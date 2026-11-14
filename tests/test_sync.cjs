const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

console.log('=== KIỂM THỬ ĐỒNG BỘ ĐA THIẾT BỊ & CÁCH LY WORKSPACE (MEDWARD PRO) ===\n');

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i) => Array.from(store.keys())[i] || null,
    get length() { return store.size; }
  };
}

function createFakeSupabaseClient(dbRows, options = {}) {
  const removedChannels = [];
  const channelCallbacks = [];
  let failDengueColOnce = !!options.failDengueCol;
  let simulateOffline = !!options.simulateOffline;

  const client = {
    _removedChannels: removedChannels,
    _channelCallbacks: channelCallbacks,
    setOffline(v) { simulateOffline = v; },
    auth: {
      getSession: async () => ({ data: { session: { user: { id: '11111111-1111-4111-8111-111111111111' } } } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    channel(name) {
      const ch = {
        _name: name,
        _statusCb: null,
        on() { return ch; },
        subscribe(cb) {
          ch._statusCb = cb;
          channelCallbacks.push(cb);
          return ch;
        },
        unsubscribe() {}
      };
      return ch;
    },
    removeChannel(ch) {
      removedChannels.push(ch);
      if (ch._statusCb) ch._statusCb('CLOSED');
    },
    from(table) {
      let filters = [];
      let op = 'select';
      let opPayload = null;
      let orderCols = [];
      let limitVal = null;
      let singleMode = false;

      const exec = async () => {
        if (simulateOffline) {
          throw new Error('Network offline');
        }
        if (table !== 'patients') {
          return { data: [], error: null };
        }

        const matchesFilters = (row) => filters.every(f => {
          if (f.type === 'eq') return row[f.col] === f.val;
          if (f.type === 'lt') return String(row[f.col]) < String(f.val);
          if (f.type === 'in') return f.vals.includes(row[f.col]);
          return true;
        });

        if (op === 'select') {
          let rows = dbRows.filter(matchesFilters).map(r => ({ ...r }));
          if (orderCols.length > 0) {
            rows.sort((a, b) => {
              for (const o of orderCols) {
                const av = a[o.col] ?? '';
                const bv = b[o.col] ?? '';
                if (av < bv) return o.asc ? -1 : 1;
                if (av > bv) return o.asc ? 1 : -1;
              }
              return 0;
            });
          }
          if (limitVal !== null) rows = rows.slice(0, limitVal);
          return { data: singleMode ? (rows[0] || null) : rows, error: null };
        }

        if (op === 'upsert') {
          const items = Array.isArray(opPayload) ? opPayload : [opPayload];
          if (failDengueColOnce && items.some(it => it && 'dengue_trends' in it)) {
            return {
              data: null,
              error: { code: 'PGRST204', message: "Could not find the 'dengue_trends' column of 'patients' in the schema cache" }
            };
          }
          const out = [];
          for (const item of items) {
            const idx = dbRows.findIndex(r => r.id === item.id);
            if (idx >= 0) {
              const updated = {
                ...dbRows[idx],
                ...item,
                version: (dbRows[idx].version || 1) + 1
              };
              dbRows[idx] = updated;
              out.push({ ...updated });
            } else {
              const inserted = { ...item, version: item.version || 1 };
              dbRows.push(inserted);
              out.push({ ...inserted });
            }
          }
          return { data: singleMode ? out[0] : out, error: null };
        }

        if (op === 'update') {
          const updatedRows = [];
          for (let i = 0; i < dbRows.length; i++) {
            if (matchesFilters(dbRows[i])) {
              dbRows[i] = { ...dbRows[i], ...opPayload, version: (dbRows[i].version || 1) + 1 };
              updatedRows.push({ ...dbRows[i] });
            }
          }
          return { data: updatedRows, error: null };
        }

        if (op === 'delete') {
          const before = dbRows.length;
          for (let i = dbRows.length - 1; i >= 0; i--) {
            if (matchesFilters(dbRows[i])) dbRows.splice(i, 1);
          }
          return { data: null, error: null, count: before - dbRows.length };
        }

        return { data: [], error: null };
      };

      const builder = {
        select() { return builder; },
        upsert(payload) { op = 'upsert'; opPayload = payload; return builder; },
        update(payload) { op = 'update'; opPayload = payload; return builder; },
        delete() { op = 'delete'; return builder; },
        eq(col, val) { filters.push({ type: 'eq', col, val }); return builder; },
        lt(col, val) { filters.push({ type: 'lt', col, val }); return builder; },
        in(col, vals) { filters.push({ type: 'in', col, vals }); return builder; },
        order(col, { ascending = true } = {}) { orderCols.push({ col, asc: ascending }); return builder; },
        limit(n) { limitVal = n; return builder; },
        single() { singleMode = true; return exec(); },
        then(resolve, reject) { return exec().then(resolve, reject); },
        catch(reject) { return exec().catch(reject); }
      };
      return builder;
    }
  };
  return client;
}

function createAppEnv(dbRows, doctor, clientOpts = {}) {
  const localStorage = createMockStorage();
  const fakeSupabaseClient = createFakeSupabaseClient(dbRows, clientOpts);

  localStorage.setItem('medward_supabase_config_v2', JSON.stringify({
    url: 'https://test.supabase.co',
    key: 'test-key'
  }));
  localStorage.setItem('medward_active_workspace_v2', JSON.stringify(doctor));

  const docObj = {
    activeElement: null,
    body: { classList: { add() {}, remove() {}, contains: () => false } },
    documentElement: { classList: { add() {}, remove() {}, contains: () => false } },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: () => {},
    Date,
    Math,
    JSON,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Blob: class MockBlob { constructor(parts) { this.size = String(parts.join('')).length; } },
    crypto: { randomUUID: () => crypto.randomUUID() },
    localStorage,
    sessionStorage: createMockStorage(),
    navigator: { onLine: true },
    document: docObj,
    addEventListener: () => {},
    removeEventListener: () => {},
    window: null
  };
  sandbox.window = sandbox;
  sandbox.supabase = { createClient: () => fakeSupabaseClient };
  sandbox.authController = {
    isLoggedIn: true,
    getActiveDoctor: () => doctor,
    isDongAdmin: (d) => (d?.id === 'doc_dongnh' || d?.username === 'dongnh'),
    getKnownDoctors: () => [
      { id: 'doc_dongnh', username: 'dongnh', full_name: 'BS. Nguyễn Hữu Đông', role: 'admin' },
      { id: 'doc_b', username: 'bsb', full_name: 'BS. Trần Văn B', role: 'doctor' }
    ],
    updateHeaderPill: () => {},
    updateUserUI: () => {}
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('js/config.js', 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync('js/supabase_service.js', 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync('js/patient_service.js', 'utf8'), sandbox);

  // Override init side effects that run async timers
  sandbox.supabaseService.client = fakeSupabaseClient;
  sandbox.supabaseService.isCloudEnabled = true;

  return { sandbox, fakeSupabaseClient, localStorage };
}

async function createSettledAppEnv(dbRows, doctor, clientOpts = {}) {
  const env = createAppEnv(dbRows, doctor, clientOpts);
  await new Promise(r => setTimeout(r, 30));
  return env;
}

(async () => {
  const todayIso = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();
  const yesterdayIso = (() => {
    const n = new Date();
    n.setDate(n.getDate() - 1);
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const docA = { id: 'doc_dongnh', username: 'dongnh', full_name: 'BS. Nguyễn Hữu Đông', role: 'admin' };
  const docB = { id: 'doc_b', username: 'bsb', full_name: 'BS. Trần Văn B', role: 'doctor' };

  const idA1 = '11111111-1111-4111-8111-000000000001';
  const idA2 = '11111111-1111-4111-8111-000000000002';
  const idB1 = '22222222-2222-4222-8222-000000000001';
  const idB2 = '22222222-2222-4222-8222-000000000002';

  // TEST 1: Chống Zombie Record khi Device A xóa và Device B thức dậy (syncWithCloudOnResume)
  {
    const db = [
      { id: idA1, report_date: todayIso, ten: 'BN A1', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, updated_at: new Date().toISOString() },
      { id: idA2, report_date: todayIso, ten: 'BN A2', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, updated_at: new Date().toISOString() }
    ];
    const devA = await createSettledAppEnv(db, docA);
    const devB = await createSettledAppEnv(db, docA);

    await devA.sandbox.patientController.reloadFromSource(false);
    await devB.sandbox.patientController.reloadFromSource(false);
    assert.strictEqual(devB.sandbox.patientController.patientList.length, 2);

    // Device A xóa BN A2 (soft delete trên Cloud)
    devA.sandbox.patientController.patientList = devA.sandbox.patientController.patientList.filter(p => p.id !== idA2);
    await devA.sandbox.supabaseService.deletePatient(idA2);
    assert.strictEqual(db.find(r => r.id === idA2).is_deleted, true);

    // Device B thức dậy -> KHÔNG được hồi sinh BN A2
    await devB.sandbox.patientController.syncWithCloudOnResume(false);
    assert.strictEqual(devB.sandbox.patientController.patientList.length, 1);
    assert.strictEqual(devB.sandbox.patientController.patientList[0].id, idA1);
    assert.strictEqual(db.find(r => r.id === idA2).is_deleted, true);

    // Trường hợp bản ghi bị hard delete thẳng trong DB: Device B vẫn KHÔNG được đẩy lại nếu không nằm trong pendingSyncIds
    db.splice(db.findIndex(r => r.id === idA1), 1);
    await devB.sandbox.patientController.syncWithCloudOnResume(false);
    assert.strictEqual(devB.sandbox.patientController.patientList.length, 0);
    assert.strictEqual(db.filter(r => r.id === idA1).length, 0);
    console.log('✓ Test 1: Chống hồi sinh Zombie Record (soft & hard delete): PASS');
  }

  // TEST 2: Bảo toàn chỉnh sửa offline khi có mạng lại (pendingSyncIds)
  {
    const db = [
      { id: idA1, report_date: todayIso, ten: 'BN A1', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, updated_at: '2026-11-11T08:00:00.000Z' }
    ];
    const devB = createAppEnv(db, docA);
    await devB.sandbox.patientController.reloadFromSource(false);

    // Mất mạng và thêm bệnh nhân mới offline
    devB.fakeSupabaseClient.setOffline(true);
    const offlineNewId = '33333333-3333-4333-8333-000000000001';
    const offlinePatient = {
      id: offlineNewId,
      report_date: todayIso,
      ten: 'BN OFFLINE MOI',
      doctor_id: 'doc_dongnh',
      doctor_name: docA.full_name,
      updated_at: new Date().toISOString()
    };
    devB.sandbox.patientController.patientList.push(offlinePatient);
    const saveRes = await devB.sandbox.supabaseService.savePatient(offlinePatient, todayIso);
    assert.strictEqual(saveRes.offlineSaved, true);
    assert(saveRes.error instanceof Error);
    assert(devB.sandbox.supabaseService.getPendingSyncIds().has(offlineNewId));

    // Mạng phục hồi -> syncWithCloudOnResume đẩy BN offline lên Cloud
    devB.fakeSupabaseClient.setOffline(false);
    await devB.sandbox.patientController.syncWithCloudOnResume(false);
    // Cho savePatient async hoàn tất
    await new Promise(r => setTimeout(r, 50));
    assert(db.some(r => r.id === offlineNewId && r.ten === 'BN OFFLINE MOI'));
    assert.strictEqual(devB.sandbox.supabaseService.getPendingSyncIds().has(offlineNewId), false);
    console.log('✓ Test 2: Bảo toàn & đẩy lại bệnh nhân tạo offline khi có mạng lại: PASS');
  }

  // TEST 3: Cách ly Workspace giữa các Bác sĩ (Realtime, Resume, FullReplace Excel, ClearAll)
  {
    const db = [
      { id: idA1, report_date: todayIso, ten: 'BN CUA BS DONG', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, updated_at: new Date().toISOString() },
      { id: idB1, report_date: todayIso, ten: 'BN CUA BS B', doctor_id: 'doc_b', doctor_name: docB.full_name, is_deleted: false, version: 1, updated_at: new Date().toISOString() }
    ];
    const envA = await createSettledAppEnv(db, docA);
    const envB = await createSettledAppEnv(db, docB);

    await envA.sandbox.patientController.reloadFromSource(false);
    await envB.sandbox.patientController.reloadFromSource(false);
    assert.strictEqual(envA.sandbox.patientController.patientList.length, 1);
    assert.strictEqual(envA.sandbox.patientController.patientList[0].id, idA1);
    assert.strictEqual(envB.sandbox.patientController.patientList.length, 1);
    assert.strictEqual(envB.sandbox.patientController.patientList[0].id, idB1);

    // Realtime INSERT từ BS B KHÔNG được nhảy vào workspace BS A
    envA.sandbox.patientController.applyRealtimePayload({
      eventType: 'INSERT',
      new: { id: idB2, report_date: todayIso, ten: 'BN MOI BS B', doctor_id: 'doc_b', doctor_name: docB.full_name, is_deleted: false }
    });
    assert.strictEqual(envA.sandbox.patientController.patientList.length, 1);

    // Resume sync trên máy BS A KHÔNG được kéo BN của BS B
    await envA.sandbox.patientController.syncWithCloudOnResume(false);
    assert.strictEqual(envA.sandbox.patientController.patientList.length, 1);
    assert.strictEqual(envA.sandbox.patientController.patientList[0].id, idA1);

    // BS B nạp đè Excel (isFullReplace: true) chỉ thay thế BN của BS B, KHÔNG đụng vào BN của BS Đông
    await envB.sandbox.supabaseService.syncBatchPatients(
      [{ id: idB2, report_date: todayIso, ten: 'BN THAY THE BS B', doctor_id: 'doc_b', doctor_name: docB.full_name }],
      todayIso,
      { isFullReplace: true, doctor: docB, isAll: false }
    );
    assert.strictEqual(db.find(r => r.id === idA1).is_deleted, false, 'Không được xóa BN của BS khác khi FullReplace');
    assert.strictEqual(db.find(r => r.id === idB1).is_deleted, true, 'Phải soft-delete BN cũ của chính BS B');
    assert.strictEqual(db.find(r => r.id === idB2).is_deleted, false);

    // BS B xóa trắng danh sách (clearAllPatients) KHÔNG được xóa BN của BS Đông
    await envB.sandbox.supabaseService.clearAllPatients(todayIso, docB, false);
    assert.strictEqual(db.find(r => r.id === idA1).is_deleted, false, 'Không được xóa BN của BS khác khi clearAll');
    assert.strictEqual(db.find(r => r.id === idB2).is_deleted, true);
    console.log('✓ Test 3: Cách ly hoàn toàn Workspace giữa các Bác sĩ: PASS');
  }

  // TEST 4: Rollover ngày mới khi BS khác đã sang ngày mới + persist lên Cloud
  {
    const db = [
      // BS A đã sang ngày hôm nay
      { id: idA1, report_date: todayIso, ten: 'BN A HOM NAY', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1 },
      // BS B vẫn còn ở ngày hôm qua
      { id: idB1, report_date: yesterdayIso, ten: 'BN B1 HOM QUA', doctor_id: 'doc_b', doctor_name: docB.full_name, is_deleted: false, version: 1 },
      { id: idB2, report_date: yesterdayIso, ten: 'BN B2 HOM QUA', doctor_id: 'doc_b', doctor_name: docB.full_name, is_deleted: false, version: 1 }
    ];
    const envB = await createSettledAppEnv(db, docB);
    await envB.sandbox.patientController.reloadFromSource(false);

    // BS B vẫn phải nhận được 2 ca từ hôm qua VÀ Cloud phải cập nhật report_date = todayIso cho cả 2 ca
    assert.strictEqual(envB.sandbox.patientController.patientList.length, 2);
    assert.strictEqual(db.find(r => r.id === idB1).report_date, todayIso);
    assert.strictEqual(db.find(r => r.id === idB2).report_date, todayIso);
    console.log('✓ Test 4: Rollover ngày mới riêng từng bác sĩ & lưu report_date hôm nay lên Cloud: PASS');
  }

  // TEST 5: Realtime DELETE payload {} + chống vòng lặp reconnect + fallback cột dengue_trends
  {
    const db = [];
    const env = createAppEnv(db, docA, { failDengueCol: true });
    let receivedEvents = [];
    env.sandbox.supabaseService.onRealtimeUpdate((p) => receivedEvents.push(p));

    // Payload DELETE kiểu Supabase v2 (new = {}, old = { id, last_client_id: chính_client_này })
    env.sandbox.supabaseService.notifyRealtimeSubscribers({
      eventType: 'DELETE',
      new: {},
      old: { id: idA1, last_client_id: env.sandbox.supabaseService.clientId }
    });
    assert.strictEqual(receivedEvents.length, 1, 'Không được nuốt sự kiện DELETE từ máy khác chỉ vì old.last_client_id trùng');

    // Chống vòng lặp reconnect khi channel đang CONNECTING hoặc old channel emit CLOSED
    env.sandbox.supabaseService.setupRealtimeSubscription();
    assert.strictEqual(env.sandbox.supabaseService.realtimeStatus, 'CONNECTING');
    const firstCb = env.fakeSupabaseClient._channelCallbacks[0];
    // checkRealtimeHealth() ngay lúc CONNECTING không được hủy kênh
    env.sandbox.supabaseService.checkRealtimeHealth();
    assert.strictEqual(env.fakeSupabaseClient._channelCallbacks.length, 1);
    firstCb('SUBSCRIBED');
    assert.strictEqual(env.sandbox.supabaseService.realtimeStatus, 'CONNECTED');
    // Reconnect mới -> callback CLOSED của kênh cũ không được phá trạng thái kênh mới
    env.sandbox.supabaseService.setupRealtimeSubscription();
    firstCb('CLOSED');
    assert.strictEqual(env.sandbox.supabaseService.realtimeStatus, 'CONNECTING');

    // Fallback tự động khi bảng Cloud chưa có cột dengue_trends
    const pWithTrend = {
      id: '44444444-4444-4444-8444-000000000001',
      ten: 'BN SXH',
      doctor_id: 'doc_dongnh',
      doctor_name: docA.full_name,
      dengue_trends: [{ id: '1', hct: 44, tc: 65 }]
    };
    const res = await env.sandbox.supabaseService.savePatient(pWithTrend, todayIso);
    assert.strictEqual(res.error, null);
    assert.strictEqual(env.sandbox.supabaseService.supportsDengueTrendsCol, false);
    assert.strictEqual(db.length, 1);
    console.log('✓ Test 5: Realtime DELETE {}, chống vòng lặp reconnect & fallback cột dengue_trends: PASS');
  }

  // TEST 6: quickAssignDoctor cập nhật doctor_id & debounce handleCellInput không lưu nhầm khi mảng đổi thứ tự
  {
    const db = [
      { id: idA1, report_date: todayIso, phong_giuong: 'D1.15-1', ten: 'BN MOT', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, created_at: new Date().toISOString() },
      { id: idA2, report_date: todayIso, phong_giuong: 'D1.10-1', ten: 'BN HAI', doctor_id: 'doc_dongnh', doctor_name: docA.full_name, is_deleted: false, version: 1, created_at: new Date().toISOString() }
    ];
    const env = await createSettledAppEnv(db, docA);
    await env.sandbox.patientController.reloadFromSource(false);

    // Gõ sửa trên BN MOT (index 0 lúc bắt đầu gõ)
    env.sandbox.patientController.handleCellInput(idA1, 'chan_doan', 'Viêm phổi mới', null);

    // Trước khi hết 800ms, sắp xếp lại danh sách (idA1 chuyển từ index 0 sang index 1)
    env.sandbox.patientController.patientList.reverse();

    await new Promise(r => setTimeout(r, 900));
    const savedA1 = db.find(r => r.id === idA1);
    const savedA2 = db.find(r => r.id === idA2);
    assert.strictEqual(savedA1.chan_doan, 'Viêm phổi mới', 'Debounce phải tìm lại đúng ca theo patientId dù thứ tự mảng đã đổi');
    assert.notStrictEqual(savedA2.chan_doan, 'Viêm phổi mới');

    // Chuyển bác sĩ nhanh -> phải cập nhật cả doctor_id lẫn doctor_name
    env.sandbox.patientController.quickAssignDoctor(idA1);
    await new Promise(r => setTimeout(r, 50));
    const reassigned = env.sandbox.patientController.patientList.find(p => p.id === idA1);
    assert.strictEqual(reassigned.doctor_id, 'doc_b');
    assert.strictEqual(reassigned.doctor_name, docB.full_name);
    console.log('✓ Test 6: An toàn debounce theo patientId & quickAssignDoctor cập nhật doctor_id: PASS');
  }

  // TEST 7: Bảo toàn 100% dữ liệu khi qua ngày mới (không xóa gì, không thay đổi gì)
  {
    const twoDaysAgoIso = (() => {
      const n = new Date();
      n.setDate(n.getDate() - 2);
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    })();

    const db = [
      // Ca 1 từ hôm qua có thông tin bàn giao pending
      {
        id: idA1,
        report_date: yesterdayIso,
        ten: 'BN HOM QUA',
        doctor_id: 'doc_dongnh',
        doctor_name: docA.full_name,
        chan_doan: 'Sốt xuất huyết Dengue ngày 4',
        y_lenh: 'Ringer lactat 500ml',
        them_thuoc: 'Paracetamol 500mg 1v khi sốt >= 38.5',
        handover_status: 'pending',
        handover_issues: 'Theo dõi dấu hiệu cảnh báo, tiểu cầu giảm',
        handover_actions: 'Làm lại CTM lúc 14h',
        is_deleted: false,
        version: 1
      },
      // Ca 2 từ 2 ngày trước (không bị bỏ sót chỉ vì khác newestDate)
      {
        id: idA2,
        report_date: twoDaysAgoIso,
        ten: 'BN HAI NGAY TRUOC',
        doctor_id: 'doc_dongnh',
        doctor_name: docA.full_name,
        chan_doan: 'Viêm phổi cộng đồng',
        y_lenh: 'Ceftriaxone 2g/ngày',
        them_thuoc: '',
        handover_status: 'none',
        handover_issues: '',
        handover_actions: '',
        is_deleted: false,
        version: 1
      }
    ];

    const env = await createSettledAppEnv(db, docA);
    // Sáng sớm mở app vào ngày mới (chưa có ca nào trên Cloud hôm nay)
    await env.sandbox.patientController.reloadFromSource(false);

    // Cả 2 ca đều phải được giữ lại và chuyển sang ngày hôm nay
    assert.strictEqual(env.sandbox.patientController.patientList.length, 2, 'Không được bỏ sót ca 2 ngày trước');
    
    const p1 = env.sandbox.patientController.patientList.find(p => p.id === idA1);
    const p2 = env.sandbox.patientController.patientList.find(p => p.id === idA2);

    // Kiểm tra không xóa gì, không thay đổi gì:
    assert.strictEqual(p1.handover_status, 'pending', 'handover_status phải được giữ nguyên');
    assert.strictEqual(p1.handover_issues, 'Theo dõi dấu hiệu cảnh báo, tiểu cầu giảm', 'handover_issues phải được giữ nguyên');
    assert.strictEqual(p1.handover_actions, 'Làm lại CTM lúc 14h', 'handover_actions phải được giữ nguyên');
    assert.strictEqual(p1.chan_doan, 'Sốt xuất huyết Dengue ngày 4');
    assert.strictEqual(p1.report_date, todayIso);

    assert.strictEqual(p2.chan_doan, 'Viêm phổi cộng đồng');
    assert.strictEqual(p2.report_date, todayIso);

    console.log('✓ Test 7: Bảo toàn 100% dữ liệu khi qua ngày mới (không xóa gì, không thay đổi gì): PASS');
  }

  // TEST 8: purgeOldData() không xóa dữ liệu cũ trên database Supabase
  {
    const oldDateIso = '2026-01-01';
    const db = [
      { id: idA1, report_date: oldDateIso, ten: 'BN CU NAM NGOAI', doctor_id: 'doc_dongnh', is_deleted: false }
    ];
    const env = await createSettledAppEnv(db, docA);
    const purgeRes = await env.sandbox.supabaseService.purgeOldData();
    assert.strictEqual(purgeRes.success, true);
    // Ca cũ trên db vẫn phải còn nguyên vẹn, không bị xóa
    assert.strictEqual(db.length, 1);
    assert.strictEqual(db[0].id, idA1);
    console.log('✓ Test 8: purgeOldData() không xóa dữ liệu cũ trên database: PASS');
  }

  // TEST 9: Bảo toàn dữ liệu Local khi Cloud ngày mới rỗng (không ghi đè rỗng vào local)
  {
    const db = []; // Cloud hoàn toàn rỗng
    const env = await createSettledAppEnv(db, docA);

    // Giả lập trên local đã có sẵn 2 bệnh nhân từ ngày hôm trước
    const localPatients = [
      { id: idA1, ten: 'BN LOCAL 1', doctor_id: 'doc_dongnh', report_date: yesterdayIso },
      { id: idA2, ten: 'BN LOCAL 2', doctor_id: 'doc_dongnh', report_date: yesterdayIso }
    ];
    env.localStorage.setItem(env.sandbox.patientController.getDoctorSpaceKey('doc_dongnh'), JSON.stringify(localPatients));

    // Reload từ nguồn vào ngày mới hôm nay
    await env.sandbox.patientController.reloadFromSource(false);

    // Dữ liệu local không được phép bị xóa sạch
    assert.strictEqual(env.sandbox.patientController.patientList.length, 2, 'Local không bị xóa sạch khi Cloud rỗng');
    assert.strictEqual(env.sandbox.patientController.patientList[0].id, idA1);
    console.log('✓ Test 9: Bảo toàn dữ liệu Local khi Cloud ngày mới rỗng: PASS');
  }

  console.log('\n🎉 TẤT CẢ 9 BỘ KIỂM THỬ ĐỒNG BỘ ĐỀU ĐẠT 100%!');
})().catch((err) => {
  console.error('❌ Test sync thất bại:', err);
  process.exit(1);
});
