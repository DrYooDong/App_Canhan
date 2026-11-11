// ==============================================================================
// SUPABASE CLIENT SERVICE & REALTIME SYNC (WITH LOCAL FALLBACK)
// MedWard Pro - Chuẩn hóa 2026: Hỗ trợ Phân vùng Ngày & Granular Realtime Sync
// ==============================================================================

class SupabaseService {
  constructor() {
    this.client = null;
    this.isCloudEnabled = false;
    this.realtimeChannel = null;
    this.syncListeners = [];
    this.stateListeners = [];
    this.isSyncing = false;
    this.lastSyncedAt = null;
    this.batchSyncLock = false;
    this.pendingBatch = null;

    // Định danh phiên làm việc hiện tại (Device/Tab ID) để triệt tiêu triệt để echo loop
    const devType = (typeof window !== 'undefined' && window.innerWidth < 768) ? 'mob' : ((typeof window !== 'undefined' && window.innerWidth < 1025) ? 'tab' : 'desk');
    this.clientId = 'client_' + devType + '_' + Math.random().toString(36).substring(2, 8) + '_' + Date.now();
    this.deviceType = devType;
    this.recentlySavedPatientIds = new Map(); // patientId -> timestamp để chống echo chính xác theo ca bệnh
    this.recentlyDeletedPatientIds = new Map();
    this.realtimeStatus = 'DISCONNECTED';
    this.reconnectTimer = null;
    this._realtimeSeq = 0;
    this._connectingSince = 0;
    this._sessionAttempted = false;
    this.supportsDengueTrendsCol = true;
    this.lastLocalSaveTimestamp = 0;

    this.init();
  }

  // ================= SYNC TRACKING & WORKSPACE MATCHING HELPERS =================

  _readStorageJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  _writeStorageJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { }
  }

  getPendingSyncIds() {
    const map = this._readStorageJson('medward_pending_sync_v2', {});
    return new Set(Object.keys(map || {}));
  }

  markPendingSync(patientId) {
    if (!patientId) return;
    const map = this._readStorageJson('medward_pending_sync_v2', {});
    map[patientId] = Date.now();
    this._writeStorageJson('medward_pending_sync_v2', map);
  }

  clearPendingSync(patientId) {
    if (!patientId) return;
    const map = this._readStorageJson('medward_pending_sync_v2', {});
    if (map[patientId] !== undefined) {
      delete map[patientId];
      this._writeStorageJson('medward_pending_sync_v2', map);
    }
  }

  getPendingDeleteIds() {
    const map = this._readStorageJson('medward_pending_deletes_v2', {});
    return new Set(Object.keys(map || {}));
  }

  markPendingDelete(patientId) {
    if (!patientId) return;
    const map = this._readStorageJson('medward_pending_deletes_v2', {});
    map[patientId] = Date.now();
    this._writeStorageJson('medward_pending_deletes_v2', map);
  }

  clearPendingDelete(patientId) {
    if (!patientId) return;
    const map = this._readStorageJson('medward_pending_deletes_v2', {});
    if (map[patientId] !== undefined) {
      delete map[patientId];
      this._writeStorageJson('medward_pending_deletes_v2', map);
    }
  }

  getDeletedTombstoneMap() {
    const map = this._readStorageJson('medward_deleted_ids_v2', {});
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    let changed = false;
    for (const [id, ts] of Object.entries(map)) {
      if (typeof ts !== 'number' || ts < cutoff) {
        delete map[id];
        changed = true;
      }
    }
    if (changed) this._writeStorageJson('medward_deleted_ids_v2', map);
    return map;
  }

  getDeletedTombstoneIds() {
    return new Set(Object.keys(this.getDeletedTombstoneMap()));
  }

  markDeletedTombstone(patientId) {
    if (!patientId) return;
    const map = this.getDeletedTombstoneMap();
    map[patientId] = Date.now();
    this._writeStorageJson('medward_deleted_ids_v2', map);
  }

  clearDeletedTombstone(patientId) {
    if (!patientId) return;
    const map = this.getDeletedTombstoneMap();
    if (map[patientId] !== undefined) {
      delete map[patientId];
      this._writeStorageJson('medward_deleted_ids_v2', map);
    }
  }

  isDongDoctor(doctor) {
    if (!doctor) return false;
    const docId = String(doctor.id || '').toLowerCase().trim();
    const docUsername = String(doctor.username || '').toLowerCase().trim();
    const docEmail = String(doctor.email || '').toLowerCase().trim();
    const docNameLower = String(doctor.full_name || '').toLowerCase().trim();
    return docId === 'doc_dongnh' ||
           docUsername === 'dongnh' ||
           docEmail.includes('dong') ||
           docNameLower.includes('đông') ||
           docNameLower.includes('dong');
  }

  matchesDoctorWorkspace(patient, doctor) {
    if (!patient) return false;
    if (!doctor) return true;
    const docId = String(doctor.id || '').toLowerCase().trim();
    const docUsername = String(doctor.username || '').toLowerCase().trim();
    const docNameLower = String(doctor.full_name || '').toLowerCase().trim();
    const isDongTarget = this.isDongDoctor(doctor);

    const pDocId = String(patient.doctor_id || '').toLowerCase().trim();
    const pUserId = String(patient.user_id || '').toLowerCase().trim();
    const pHandoverId = String(patient.handover_by_id || '').toLowerCase().trim();
    const pDocName = String(patient.doctor_name || patient.handover_by || '').toLowerCase().trim();

    if (isDongTarget) {
      return pDocId === 'doc_dongnh' ||
             (docId && (pDocId === docId || pUserId === docId)) ||
             pDocName.includes('đông') ||
             pDocName.includes('dong') ||
             (!pDocName && !pDocId);
    }

    return (docId && (pDocId === docId || pUserId === docId || pHandoverId === docId)) ||
           (docUsername && (pDocId === docUsername || pDocName.includes(docUsername))) ||
           (docNameLower && (pDocName === docNameLower || pDocName.includes(docNameLower)));
  }

  extractPayloadRecord(payload) {
    const hasNew = payload?.new && Object.keys(payload.new).length > 0;
    return hasNew ? payload.new : (payload?.old || null);
  }

  isMissingColumnError(err, colName) {
    if (!err) return false;
    const msg = String(err.message || err.details || '');
    return (err.code === 'PGRST204' || err.code === '42703' || msg.includes('schema cache') || msg.includes('column')) && msg.includes(colName);
  }

  // ================= UTILITIES: DATE CONVERSION =================

  formatDateToISO(val) {
    if (!val) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      }
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // Đã là YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      // Định dạng DD/MM/YYYY
      const slashParts = trimmed.split('/');
      if (slashParts.length === 3) {
        const d = slashParts[0].padStart(2, '0');
        const m = slashParts[1].padStart(2, '0');
        const y = slashParts[2];
        return `${y}-${m}-${d}`;
      }
      // Định dạng DD-MM-YYYY
      const dashParts = trimmed.split('-');
      if (dashParts.length === 3 && dashParts[0].length <= 2) {
        const d = dashParts[0].padStart(2, '0');
        const m = dashParts[1].padStart(2, '0');
        const y = dashParts[2];
        return `${y}-${m}-${d}`;
      }
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getCurrentWorkDate() {
    return this.formatDateToISO(new Date());
  }

  // ================= INITIALIZATION =================

  async init() {
    let conf = null;
    const configStr = localStorage.getItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG);
    if (configStr) {
      try {
        conf = JSON.parse(configStr);
      } catch (err) { }
    }

    // Tự động chuyển đổi nếu chưa có cấu hình hoặc đang lưu cấu hình của project cũ
    if (!conf || !conf.url || !conf.key || conf.url.includes('iqkrdzeymxdrqdvfjnyt') || conf.url.includes('vowgqkxlhsienxcgkrnd')) {
      if (CONFIG.DEFAULT_SUPABASE?.URL && CONFIG.DEFAULT_SUPABASE?.KEY) {
        conf = {
          url: CONFIG.DEFAULT_SUPABASE.URL,
          key: CONFIG.DEFAULT_SUPABASE.KEY
        };
        try {
          localStorage.setItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(conf));
        } catch (e) { }
      }
    }

    if (conf && conf.url && conf.key && window.supabase) {
      try {
        this.client = window.supabase.createClient(conf.url, conf.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.isCloudEnabled = true;

        // Đảm bảo session xác thực để thỏa mãn RLS Supabase
        await this.ensureSession();
        this.setupRealtimeSubscription();

        // Tự động xóa dữ liệu cũ (chỉ giữ hôm qua & hôm nay)
        setTimeout(() => {
          this.purgeOldData().catch(() => { });
        }, 2000);

        this.client.auth.onAuthStateChange(async (event, session) => {
          this.notifyStateChange();
          if (window.authController) {
            window.authController.currentUser = await this.getCurrentUser();
            window.authController.updateUserUI();
          }
        });
      } catch (err) {
        console.warn('Lưu ý khởi tạo Supabase:', err?.message || err);
      }
    }
    this.notifyStateChange();
  }

  // Đảm bảo có phiên xác thực hợp lệ trên cả Laptop và Mobile
  async ensureSession() {
    if (!this.client) return null;
    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (session) return session;

      if (this._sessionAttempted) return null;
      this._sessionAttempted = true;

      const savedDoctor = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
      const email = String(savedDoctor?.email || '').trim();
      const savedPin = String(localStorage.getItem('medward_doctor_pin') || savedDoctor?.pin || '').trim();

      if (email && email.includes('@') && !email.endsWith('@medward.local') && savedPin.length >= 6) {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: email,
          password: savedPin
        });
        if (!error && data?.session) {
          return data.session;
        }
      }
    } catch (e) {
      // Bỏ qua lỗi kết nối phiên để không gây nghẽn truy vấn dữ liệu
    }
    return null;
  }

  // Cấu hình URL & Key
  configure(url, key) {
    if (!url || !key) {
      if (CONFIG.DEFAULT_SUPABASE?.URL && CONFIG.DEFAULT_SUPABASE?.KEY) {
        const defaultConf = {
          url: CONFIG.DEFAULT_SUPABASE.URL,
          key: CONFIG.DEFAULT_SUPABASE.KEY
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(defaultConf));
        this.client = window.supabase.createClient(defaultConf.url, defaultConf.key);
        this.isCloudEnabled = true;
        this.ensureSession().finally(() => {
          this.setupRealtimeSubscription();
          this.notifyStateChange();
        });
        return { success: true, message: 'Đã khôi phục về cấu hình Supabase Cloud mặc định' };
      }

      localStorage.removeItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG);
      this.client = null;
      this.isCloudEnabled = false;
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
        this.realtimeChannel = null;
      }
      this.notifyStateChange();
      return { success: true, message: 'Đã chuyển về chế độ lưu trữ cục bộ (Offline)' };
    }

    try {
      if (!window.supabase) {
        throw new Error('Thư viện Supabase CDN chưa được tải');
      }
      const client = window.supabase.createClient(url.trim(), key.trim());
      localStorage.setItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({
        url: url.trim(),
        key: key.trim()
      }));
      this.client = client;
      this.isCloudEnabled = true;
      this.ensureSession().finally(() => {
        this.setupRealtimeSubscription();
        this.notifyStateChange();
      });
      return { success: true, message: 'Kết nối Supabase Cloud thành công!' };
    } catch (e) {
      return { success: false, message: 'Lỗi thiết lập Supabase: ' + e.message };
    }
  }

  getConfig() {
    const configStr = localStorage.getItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG);
    if (configStr) {
      try {
        const conf = JSON.parse(configStr);
        if (conf.url && conf.key) return conf;
      } catch (e) { }
    }
    return {
      url: CONFIG.DEFAULT_SUPABASE?.URL || '',
      key: CONFIG.DEFAULT_SUPABASE?.KEY || ''
    };
  }

  // Trạng thái kết nối
  getConnectionStatus() {
    return {
      isCloud: this.isCloudEnabled,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      realtimeStatus: this.realtimeStatus,
      clientId: this.clientId,
      deviceType: this.deviceType
    };
  }

  onStateChange(callback) {
    this.stateListeners.push(callback);
    callback(this.getConnectionStatus());
  }

  notifyStateChange() {
    const status = this.getConnectionStatus();
    this.stateListeners.forEach(cb => {
      try { cb(status); } catch (e) { }
    });
  }

  // Đăng ký nhận thông báo khi có dữ liệu mới từ thiết bị khác (Realtime)
  onRealtimeUpdate(callback) {
    this.syncListeners.push(callback);
  }

  notifyRealtimeSubscribers(payload) {
    const record = this.extractPayloadRecord(payload);

    if (payload?.eventType === 'DELETE') {
      if (record?.id && this.recentlyDeletedPatientIds?.has(record.id)) {
        const delTime = this.recentlyDeletedPatientIds.get(record.id);
        if (Date.now() - delTime < 3000) {
          return;
        }
      }
    } else {
      // 1. Kiểm tra Client ID để triệt tiêu echo loop (bản ghi do chính phiên/thiết bị này gửi lên)
      if (record?.last_client_id && record.last_client_id === this.clientId) {
        return;
      }

      // 2. Dự phòng: Nếu bản ghi không có last_client_id nhưng chính ID ca bệnh này vừa lưu trên phiên này trong 2000ms
      if (!record?.last_client_id && record?.id && this.recentlySavedPatientIds?.has(record.id)) {
        const saveTime = this.recentlySavedPatientIds.get(record.id);
        if (Date.now() - saveTime < 2000) {
          return;
        }
      }
    }

    // 3. Chuyển tiếp ngay lập tức đến các bộ lắng nghe (không bỏ sót bất kỳ thay đổi nào từ thiết bị khác)
    this.syncListeners.forEach(cb => {
      try { cb(payload); } catch (e) { }
    });
  }

  // Lắng nghe thay đổi Realtime qua Supabase Channels
  setupRealtimeSubscription() {
    if (!this.client || !this.isCloudEnabled) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const seq = ++this._realtimeSeq;

    if (this.realtimeChannel) {
      const oldChannel = this.realtimeChannel;
      this.realtimeChannel = null;
      try {
        if (typeof this.client.removeChannel === 'function') {
          this.client.removeChannel(oldChannel);
        } else {
          oldChannel.unsubscribe();
        }
      } catch (e) { }
    }

    try {
      this.realtimeStatus = 'CONNECTING';
      this._connectingSince = Date.now();
      this.notifyStateChange();

      const channel = this.client
        .channel(`public:medward_realtime_${seq}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          (payload) => {
            if (seq !== this._realtimeSeq) return;
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            this.notifyRealtimeSubscribers(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'work_days' },
          (payload) => {
            if (seq !== this._realtimeSeq) return;
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            if (window.patientController && typeof window.patientController.onWorkDayRealtimeUpdate === 'function') {
              window.patientController.onWorkDayRealtimeUpdate(payload);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'department_settings' },
          (payload) => {
            if (seq !== this._realtimeSeq) return;
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            if (window.loadHospitalMetadata) {
              window.loadHospitalMetadata(payload?.new || null);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            if (seq !== this._realtimeSeq) return;
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            if (window.authController && typeof window.authController.loadKnownDoctors === 'function') {
              window.authController.loadKnownDoctors().catch(() => { });
            }
          }
        )
        .subscribe((status) => {
          if (seq !== this._realtimeSeq) return;
          console.log('📡 Trạng thái kênh Realtime Supabase:', status);
          if (status === 'SUBSCRIBED') {
            this.realtimeStatus = 'CONNECTED';
            this._connectingSince = 0;
            this.notifyStateChange();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.realtimeStatus = 'DISCONNECTED';
            this._connectingSince = 0;
            this.notifyStateChange();
            this.scheduleReconnect();
          }
        });

      this.realtimeChannel = channel;
    } catch (e) {
      console.warn('Không thể khởi tạo kênh Realtime:', e);
      this.realtimeStatus = 'DISCONNECTED';
      this._connectingSince = 0;
      this.notifyStateChange();
      this.scheduleReconnect();
    }
  }

  scheduleReconnect(delayMs = 3000) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isCloudEnabled && this.client && this.realtimeStatus !== 'CONNECTED') {
        console.log('🔄 Đang tự động kết nối lại kênh Realtime...');
        this.setupRealtimeSubscription();
      }
    }, delayMs);
  }

  checkRealtimeHealth() {
    if (!this.client || !this.isCloudEnabled) return;
    if (this.realtimeStatus === 'CONNECTED') return;
    if (this.realtimeStatus === 'CONNECTING' && this._connectingSince && (Date.now() - this._connectingSince < 15000)) {
      return;
    }
    if (!this.realtimeChannel || this.realtimeStatus === 'DISCONNECTED' || (Date.now() - this._connectingSince >= 15000)) {
      console.log('⚡ Phát hiện kênh Realtime chưa kết nối hoặc bị ngắt, đang kích hoạt kết nối lại...');
      this.setupRealtimeSubscription();
    }
  }

  /**
   * Kéo dữ liệu mới nhất của ngày làm việc từ Cloud (hỗ trợ đồng bộ khi chuyển tab / mở lại app)
   */
  async pullLatestChanges(targetDate = null) {
    if (!this.isCloudEnabled || !this.client) return null;
    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());
    try {
      await this.ensureSession();
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .eq('report_date', isoDate)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return data || [];
    } catch (e) {
      console.warn(`Lỗi kéo dữ liệu ngày ${isoDate} từ Cloud:`, e);
      return null;
    }
  }

  // ================= AUTHENTICATION =================

  usernameToEmail(username) {
    if (!username) return '';
    const clean = String(username).toLowerCase().trim();
    if (clean.includes('@')) return clean;
    if (clean === 'dongnh' || clean === 'dong') {
      return 'nguyenhuudongy18@gmail.com';
    }
    return `${clean}@thuduchospital.vn`;
  }

  extractUsername(email) {
    if (!email) return '';
    if (email.endsWith('@thuduchospital.vn')) {
      return email.replace('@thuduchospital.vn', '');
    }
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return email;
  }

  async signUp(username, password, doctorData = {}) {
    const email = this.usernameToEmail(username);
    const cleanUsername = this.extractUsername(email);

    if (!this.isCloudEnabled || !this.client) {
      const localUser = {
        id: 'local_user_' + Date.now(),
        email: email,
        username: cleanUsername,
        full_name: doctorData.full_name || 'Bác sĩ điều trị',
        title: doctorData.title || 'Bác sĩ điều trị',
        department: doctorData.department || 'Khoa Nhiễm',
        hospital: doctorData.hospital || 'BV ĐKKV Thủ Đức',
        phone: doctorData.phone || ''
      };
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(localUser));
      return { data: { user: localUser }, error: null };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: doctorData.full_name || '',
            title: doctorData.title || 'Bác sĩ điều trị',
            department: doctorData.department || 'Khoa Nhiễm',
            hospital: doctorData.hospital || 'BV ĐKKV Thủ Đức',
            phone: doctorData.phone || ''
          }
        }
      });

      if (error) throw error;

      if (data && data.user) {
        await this.client.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          username: cleanUsername,
          full_name: doctorData.full_name || '',
          title: doctorData.title || 'Bác sĩ điều trị',
          department: doctorData.department || 'Khoa Nhiễm',
          hospital: doctorData.hospital || 'BV ĐKKV Thủ Đức',
          phone: doctorData.phone || '',
          role: doctorData.role || 'doctor',
          pin: doctorData.pin || '123456'
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async signIn(username, password) {
    const email = this.usernameToEmail(username);
    const cleanUsername = this.extractUsername(email);

    if (!this.isCloudEnabled || !this.client) {
      const savedUserStr = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
      let user = savedUserStr ? JSON.parse(savedUserStr) : CONFIG.DEFAULT_DEMO_DOCTOR;
      user.email = email;
      user.username = cleanUsername;
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      return { data: { user }, error: null };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async signOut() {
    if (!this.isCloudEnabled || !this.client) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
      return { error: null };
    }
    return await this.client.auth.signOut();
  }

  async getCurrentUser() {
    if (!this.isCloudEnabled || !this.client) {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
      const user = saved ? JSON.parse(saved) : CONFIG.DEFAULT_DEMO_DOCTOR;
      if (!user.username && user.email) {
        user.username = this.extractUsername(user.email);
      }
      return user;
    }

    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) return null;

      const { data: profile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const displayUsername = user.user_metadata?.username || this.extractUsername(user.email);

      return {
        id: user.id,
        email: user.email,
        username: displayUsername,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Bác sĩ',
        title: profile?.title || user.user_metadata?.title || 'Bác sĩ điều trị',
        department: profile?.department || user.user_metadata?.department || 'Khoa Nhiễm',
        hospital: profile?.hospital || user.user_metadata?.hospital || 'BV ĐKKV Thủ Đức',
        phone: profile?.phone || user.user_metadata?.phone || '',
        role: profile?.role || 'doctor'
      };
    } catch (e) {
      console.warn('Lỗi lấy thông tin user:', e);
      return null;
    }
  }

  async updateProfile(profileData) {
    const user = await this.getCurrentUser();
    if (!user) return { error: new Error('Chưa đăng nhập') };

    if (!this.isCloudEnabled || !this.client) {
      const updated = { ...user, ...profileData };
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await this.client
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async fetchDepartmentDoctors() {
    let docs = [];
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES);
      if (saved) docs = JSON.parse(saved);
    } catch (e) { }

    const defaultDoctor = { ...(CONFIG.DEFAULT_DEMO_DOCTOR || CONFIG.DEFAULT_DOCTORS[0]) };
    const dongIdx = docs.findIndex(d => (d.username === 'dongnh' || d.id === 'doc_dongnh' || (d.email && d.email.includes('dong'))));
    if (dongIdx === -1) {
      docs.unshift(defaultDoctor);
    } else {
      docs[dongIdx] = { ...defaultDoctor, ...docs[dongIdx], role: 'admin', storage_limit_mb: 100 };
    }

    if (this.isCloudEnabled && this.client) {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });
        if (!error && data && data.length > 0) {
          data.forEach(p => {
            const isDong = (p.username === 'dongnh' || (p.email && p.email.includes('dong')) || (p.full_name && p.full_name.toLowerCase().includes('đông')));
            const existingIdx = docs.findIndex(d =>
              d.id === p.id ||
              d.profile_uuid === p.id ||
              (p.username && d.username === p.username) ||
              (p.email && d.email === p.email) ||
              (isDong && (d.id === 'doc_dongnh' || d.username === 'dongnh'))
            );
            const preservedId = existingIdx >= 0 && docs[existingIdx]?.id
              ? docs[existingIdx].id
              : (isDong ? 'doc_dongnh' : (p.username ? `doc_${p.username}` : (p.id || `doc_${Date.now()}`)));
            const docObj = {
              id: preservedId,
              profile_uuid: p.id || null,
              username: p.username || (p.email ? p.email.split('@')[0] : 'bs'),
              email: p.email || (existingIdx >= 0 ? docs[existingIdx].email : '') || '',
              full_name: p.full_name || 'Bác sĩ điều trị',
              title: p.title || 'Bác sĩ điều trị',
              department: p.department || 'Khoa Nhiễm',
              hospital: p.hospital || 'BV ĐKKV Thủ Đức',
              phone: p.phone || '',
              pin: p.pin || (existingIdx >= 0 ? docs[existingIdx].pin : '123456') || '123456',
              role: isDong ? 'admin' : (p.role || 'doctor'),
              storage_limit_mb: p.storage_limit_mb || 100
            };
            if (existingIdx >= 0) {
              docs[existingIdx] = { ...docs[existingIdx], ...docObj };
            } else {
              docs.push(docObj);
            }
          });
        }
      } catch (err) {
        console.warn('Lỗi lấy thông tin bác sĩ từ cloud:', err);
      }
    }

    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(docs));
    } catch (e) { }

    return docs;
  }

  async upsertDoctorProfile(doc) {
    if (!this.isCloudEnabled || !this.client || !doc) return { data: null, error: null };
    const username = String(doc.username || '').trim().toLowerCase();
    if (!username) return { data: null, error: null };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const payload = {
      username,
      email: doc.email || '',
      full_name: doc.full_name || 'Bác sĩ điều trị',
      title: doc.title || 'Bác sĩ điều trị',
      department: doc.department || 'Khoa Nhiễm',
      hospital: doc.hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức',
      phone: doc.phone || '',
      role: this.isDongDoctor(doc) ? 'admin' : (doc.role || 'doctor'),
      pin: String(doc.pin || '123456'),
      storage_limit_mb: doc.storage_limit_mb || 100,
      updated_at: new Date().toISOString()
    };

    const existingUuid = doc.profile_uuid || (uuidRegex.test(doc.id) ? doc.id : null);
    if (existingUuid) {
      payload.id = existingUuid;
    }

    try {
      const { data, error } = await this.client
        .from('profiles')
        .upsert(payload, { onConflict: 'username' })
        .select()
        .single();
      if (error) throw error;
      if (data?.id) doc.profile_uuid = data.id;
      return { data, error: null };
    } catch (err) {
      console.warn('Lưu ý đồng bộ hồ sơ bác sĩ lên Cloud:', err?.message || err);
      return { data: null, error: err };
    }
  }

  async deleteDoctorProfile(doc) {
    if (!this.isCloudEnabled || !this.client || !doc) return { success: true };
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let query = this.client.from('profiles').delete();
      if (doc.profile_uuid && uuidRegex.test(doc.profile_uuid)) {
        query = query.eq('id', doc.profile_uuid);
      } else if (doc.username) {
        query = query.eq('username', String(doc.username).toLowerCase().trim());
      } else if (uuidRegex.test(doc.id)) {
        query = query.eq('id', doc.id);
      } else {
        return { success: true };
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Lưu ý xóa hồ sơ bác sĩ trên Cloud:', err?.message || err);
      return { success: false, error: err };
    }
  }

  // ================= DEPARTMENT SETTINGS & HANDOVER LOGS =================

  async fetchDepartmentSettings() {
    if (!this.isCloudEnabled || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('department_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data && data.length > 0) ? data[0] : null;
    } catch (err) {
      console.warn('Lưu ý tải thiết lập khoa từ Cloud:', err?.message || err);
      return null;
    }
  }

  async saveDepartmentSettings(meta) {
    if (!this.isCloudEnabled || !this.client || !meta) return { data: null, error: null };
    try {
      const existing = await this.fetchDepartmentSettings();
      const payload = {
        department: meta.dept || meta.department || 'KHOA NHIỄM',
        hospital: meta.hospital || 'BỆNH VIỆN ĐA KHOA KHU VỰC THỦ ĐỨC',
        unit: meta.unit || 'SỞ Y TẾ TP. HỒ CHÍ MINH',
        main_title: meta.title || meta.main_title || 'BẢNG THEO DÕI & Y LỆNH BỆNH NHÂN NỘI TRÚ',
        sub_title: meta.subTitle || meta.sub_title || '(Giao ban - Đi buồng - Theo dõi SOAP lâm sàng & Bàn giao trực)',
        active_date: this.getCurrentWorkDate(),
        updated_at: new Date().toISOString()
      };
      if (existing?.id) {
        payload.id = existing.id;
      }
      const { data, error } = await this.client
        .from('department_settings')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Lưu ý đồng bộ thiết lập khoa lên Cloud:', err?.message || err);
      return { data: null, error: err };
    }
  }

  async saveHandoverLog(logEntry) {
    if (!logEntry) return { data: null, error: null };
    // Lưu local trước
    try {
      const logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HANDOVER_LOGS) || '[]');
      logs.unshift({ ...logEntry, id: logEntry.id || (CONFIG.generateUUID ? CONFIG.generateUUID() : String(Date.now())) });
      localStorage.setItem(CONFIG.STORAGE_KEYS.HANDOVER_LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch (e) { }

    if (!this.isCloudEnabled || !this.client) return { data: logEntry, error: null };

    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const payload = {
        report_date: this.formatDateToISO(logEntry.report_date || this.getCurrentWorkDate()),
        patient_name: logEntry.patient_name || '',
        phong_giuong: logEntry.phong_giuong || '',
        status: logEntry.status || 'pending',
        issues: logEntry.issues || '',
        actions: logEntry.actions || '',
        doctor_from: logEntry.doctor_from || '',
        doctor_to: logEntry.doctor_to || '',
        resolved_by: logEntry.resolved_by || '',
        resolved_at: logEntry.resolved_at || null
      };
      if (logEntry.patient_id && uuidRegex.test(logEntry.patient_id)) {
        payload.patient_id = logEntry.patient_id;
      }
      const { data, error } = await this.client.from('handover_logs').insert(payload).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Lưu ý ghi nhật ký giao ban lên Cloud:', err?.message || err);
      return { data: null, error: err };
    }
  }

  // ================= PATIENT DATA OPERATIONS =================

  _getClearedDateKey(targetDoctor = null, isAll = false) {
    if (isAll || !targetDoctor) return 'medward_cleared_date_all';
    return `medward_cleared_date_${targetDoctor.id || targetDoctor.username || 'doc'}`;
  }

  _clearIntentionalEmptyFlag(isoDate, targetDoctor = null) {
    try {
      const todayIso = this.formatDateToISO(isoDate || this.getCurrentWorkDate());
      localStorage.removeItem('medward_cleared_date_all');
      if (targetDoctor?.id) localStorage.removeItem(`medward_cleared_date_${targetDoctor.id}`);
      if (targetDoctor?.username) localStorage.removeItem(`medward_cleared_date_${targetDoctor.username}`);
      const activeDoc = window.authController?.getActiveDoctor?.();
      if (activeDoc?.id) localStorage.removeItem(`medward_cleared_date_${activeDoc.id}`);
      void todayIso;
    } catch (e) { }
  }

  async flushPendingDeletes() {
    if (!this.isCloudEnabled || !this.client) return;
    const pendingIds = Array.from(this.getPendingDeleteIds());
    if (pendingIds.length === 0) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const nowIso = new Date().toISOString();
    for (const pid of pendingIds) {
      if (!uuidRegex.test(pid)) {
        this.clearPendingDelete(pid);
        continue;
      }
      try {
        const { error } = await this.client
          .from('patients')
          .update({
            is_deleted: true,
            last_client_id: this.clientId,
            client_updated_at: nowIso,
            updated_at: nowIso
          })
          .eq('id', pid);
        if (!error) {
          this.clearPendingDelete(pid);
        }
      } catch (e) { }
    }
  }

  /**
   * Truy vấn danh sách bệnh nhân theo NGÀY (report_date) và BÁC SĨ (doctor)
   * @param {Object|null} targetDoctor Bác sĩ mục tiêu (null = Toàn khoa)
   * @param {string|Date|null} targetDate Ngày làm việc (định dạng DD/MM/YYYY hoặc YYYY-MM-DD hoặc Date)
   */
  async fetchPatients(targetDoctor = null, targetDate = null) {
    this.isSyncing = true;
    this.notifyStateChange();

    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.notifyStateChange();
      return null;
    }

    try {
      await this.ensureSession();
      await this.flushPendingDeletes();

      // 1. Truy vấn toàn bộ bản ghi của ngày isoDate (gồm cả is_deleted để phân biệt ngày mới vs ngày đã xóa trắng)
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .eq('report_date', isoDate)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const allToday = data || [];
      if (allToday.length > 0 && !('dengue_trends' in allToday[0])) {
        this.supportsDengueTrendsCol = false;
      }

      const deletedTombstones = this.getDeletedTombstoneIds();
      const matchedTodayAll = targetDoctor
        ? allToday.filter(p => this.matchesDoctorWorkspace(p, targetDoctor))
        : allToday;
      const activeToday = matchedTodayAll.filter(p => !p.is_deleted && !deletedTombstones.has(p.id));

      if (activeToday.length > 0) {
        activeToday.forEach(p => {
          if (window.patientController && typeof window.patientController.normalizePatientClsAndOrders === 'function') {
            window.patientController.normalizePatientClsAndOrders(p);
          }
        });
        this.isSyncing = false;
        this.lastSyncedAt = new Date();
        this.notifyStateChange();
        return activeToday;
      }

      // 2. Nếu ngày hôm nay chưa có ca nào cho bác sĩ này
      const isToday = (isoDate === this.formatDateToISO(new Date()));
      const clearedFlag = localStorage.getItem(this._getClearedDateKey(targetDoctor, !targetDoctor)) === isoDate ||
                          localStorage.getItem('medward_cleared_date_all') === isoDate;
      const hasDeletedToday = matchedTodayAll.some(p => p.is_deleted);

      if (isToday && !clearedFlag && !hasDeletedToday) {
        try {
          const { data: latestActive, error: latestErr } = await this.client
            .from('patients')
            .select('*')
            .eq('is_deleted', false)
            .lt('report_date', isoDate)
            .order('report_date', { ascending: false })
            .order('sort_order', { ascending: true })
            .limit(300);

          if (!latestErr && latestActive && latestActive.length > 0) {
            const matchedRecent = targetDoctor
              ? latestActive.filter(p => this.matchesDoctorWorkspace(p, targetDoctor) && !deletedTombstones.has(p.id))
              : latestActive.filter(p => !deletedTombstones.has(p.id));

            if (matchedRecent.length > 0) {
              const newestDate = matchedRecent[0].report_date;
              const activeRecent = matchedRecent.filter(p => p.report_date === newestDate);
              const nowIso = new Date().toISOString();

              activeRecent.forEach(p => {
                p.report_date = isoDate;
                p.updated_at = nowIso;
                if (window.patientController && typeof window.patientController.normalizePatientClsAndOrders === 'function') {
                  window.patientController.normalizePatientClsAndOrders(p);
                }
              });

              // Lưu ngay các ca chuyển ngày lên Cloud để thiết bị khác và lần reload sau không bị mất danh sách
              const rolloverPayloads = activeRecent.map((p, idx) =>
                this.sanitizePatientForSupabase({ ...p, sort_order: idx }, isoDate)
              );
              if (rolloverPayloads.length > 0) {
                await this.client
                  .from('patients')
                  .upsert(rolloverPayloads, { onConflict: 'id', ignoreDuplicates: false })
                  .catch(() => { });
              }

              this.isSyncing = false;
              this.lastSyncedAt = new Date();
              this.notifyStateChange();
              return activeRecent;
            }
          }
        } catch (e) {
          console.warn('Lỗi truy vấn danh sách gần nhất trên cloud:', e);
        }
      }

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return [];
    } catch (err) {
      console.warn(`Lỗi tải dữ liệu bệnh nhân ngày ${isoDate} từ cloud:`, err);
      this.isSyncing = false;
      this.notifyStateChange();
      return null;
    }
  }

  /**
   * Lọc và chuẩn hóa dữ liệu bản ghi bệnh nhân phù hợp với Supabase Schema 2026
   */
  sanitizePatientForSupabase(p, targetDate = null) {
    const allowedCols = [
      'id', 'report_date', 'user_id', 'department', 'phong_giuong', 'ten', 'nam_sinh_tuoi',
      'chan_doan', 'cls', 'cls_hien_co', 'cls_can_lam', 'y_lenh', 'them_thuoc',
      'trieu_chung', 'kham_lam_sang',
      'doctor_id', 'doctor_name', 'sort_order',
      'is_discharged', 'is_deleted',
      'handover_status', 'handover_issues', 'handover_actions', 'handover_by', 'handover_by_id',
      'handover_at', 'handover_resolved_by', 'handover_resolved_at',
      'last_client_id', 'client_updated_at',
      'created_at', 'updated_at'
    ];
    if (this.supportsDengueTrendsCol) {
      allowedCols.push('dengue_trends');
    }
    const out = {};
    for (const col of allowedCols) {
      if (p[col] !== undefined && p[col] !== null) {
        out[col] = p[col];
      }
    }
    if (this.supportsDengueTrendsCol && out.dengue_trends !== undefined && !Array.isArray(out.dengue_trends)) {
      delete out.dengue_trends;
    }

    // 0. Chuẩn hóa trường SOAP: trieu_chung (S) & kham_lam_sang (O)
    if (p.trieu_chung !== undefined && p.trieu_chung !== null) {
      out.trieu_chung = String(p.trieu_chung).trim();
    }
    if (p.kham_lam_sang !== undefined && p.kham_lam_sang !== null) {
      out.kham_lam_sang = String(p.kham_lam_sang).trim();
    }

    // 1. BẮT BUỘC CÓ report_date HỢP LỆ THEO CHUẨN ISO YYYY-MM-DD
    out.report_date = this.formatDateToISO(p.report_date || targetDate || this.getCurrentWorkDate());

    // 2. Gán doctor_name và doctor_id
    if (p.doctor_name) {
      out.doctor_name = p.doctor_name;
      if (!out.handover_by) out.handover_by = p.doctor_name;
    }
    if (p.doctor_id) {
      out.doctor_id = p.doctor_id;
    }

    // 3. Chuẩn hóa CLS
    if (p.cls_hien_co !== undefined && p.cls_hien_co !== null) {
      out.cls_hien_co = String(p.cls_hien_co).trim();
    }
    if (p.cls_can_lam !== undefined && p.cls_can_lam !== null) {
      out.cls_can_lam = String(p.cls_can_lam).trim();
    }
    const hc = (out.cls_hien_co || p.cls_hien_co || '').trim();
    const cl = (out.cls_can_lam || p.cls_can_lam || '').trim();
    if (hc && cl) {
      out.cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
    } else if (cl) {
      out.cls = `[Cần làm]: ${cl}`;
    } else if (hc) {
      out.cls = hc;
    }

    // 4. Chuẩn hóa Thêm thuốc
    if (p.them_thuoc !== undefined && p.them_thuoc !== null) {
      out.them_thuoc = String(p.them_thuoc).trim();
    }
    const baseYl = (out.y_lenh || p.y_lenh || '').trim();
    const extraRx = (out.them_thuoc || p.them_thuoc || '').trim();
    if (extraRx) {
      if (baseYl && !baseYl.includes('[Thêm thuốc]:')) {
        out.y_lenh = `${baseYl}\n[Thêm thuốc]: ${extraRx}`;
      } else if (!baseYl) {
        out.y_lenh = `[Thêm thuốc]: ${extraRx}`;
      }
    }

    // 5. Cờ quản lý đồng bộ
    out.is_discharged = !!p.is_discharged;
    out.is_deleted = !!p.is_deleted;
    out.last_client_id = this.clientId;
    out.client_updated_at = new Date().toISOString();

    // 6. Timestamps ISO
    const nowIso = new Date().toISOString();
    if (!out.created_at || out.created_at === 'null' || typeof out.created_at !== 'string') {
      out.created_at = (p.created_at && p.created_at !== 'null' && typeof p.created_at === 'string')
        ? p.created_at
        : nowIso;
    }
    out.updated_at = nowIso;

    // 7. Tên người bệnh không rỗng
    if (!out.ten || !String(out.ten).trim()) {
      out.ten = (p.ten && String(p.ten).trim()) || 'BỆNH NHÂN MỚI';
    }

    if (!out.handover_status) {
      out.handover_status = p.handover_status || 'none';
    }

    if (typeof out.sort_order !== 'number' || isNaN(out.sort_order)) {
      out.sort_order = 0;
    }

    // 8. UUID RFC4122
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (out.id && !uuidRegex.test(out.id)) {
      out.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
    }
    if (out.user_id && !uuidRegex.test(out.user_id)) {
      delete out.user_id;
    }
    if (out.handover_by_id && !uuidRegex.test(out.handover_by_id)) {
      delete out.handover_by_id;
    }

    return out;
  }

  async savePatient(patient, targetDate = null) {
    if (!patient) return { data: null, error: new Error('Thiếu thông tin người bệnh') };
    this.lastLocalSaveTimestamp = Date.now();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!patient.id || !uuidRegex.test(patient.id)) {
      patient.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
    }

    this.recentlySavedPatientIds.set(patient.id, Date.now());
    if (this.recentlySavedPatientIds.size > 100) {
      const threshold = Date.now() - 15000;
      for (const [id, t] of this.recentlySavedPatientIds.entries()) {
        if (t < threshold) this.recentlySavedPatientIds.delete(id);
      }
    }

    this.clearDeletedTombstone(patient.id);
    this.clearPendingDelete(patient.id);

    this.isSyncing = true;
    this.notifyStateChange();

    const isoDate = this.formatDateToISO(patient.report_date || targetDate || this.getCurrentWorkDate());
    patient.report_date = isoDate;
    this._clearIntentionalEmptyFlag(isoDate, { id: patient.doctor_id, username: patient.doctor_id });

    if (!this.isCloudEnabled || !this.client) {
      this.markPendingSync(patient.id);
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patient, error: null, offlineSaved: true };
    }

    try {
      await this.ensureSession();
      const payload = this.sanitizePatientForSupabase(patient, isoDate);
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id && uuidRegex.test(currentUser.id)) {
        payload.user_id = currentUser.id;
      }
      payload.updated_at = new Date().toISOString();

      let { data, error } = await this.client
        .from('patients')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error && this.isMissingColumnError(error, 'dengue_trends')) {
        this.supportsDengueTrendsCol = false;
        delete payload.dengue_trends;
        const retry = await this.client
          .from('patients')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      this.clearPendingSync(patient.id);
      if (data) {
        if (data.version !== undefined) patient.version = data.version;
        if (data.updated_at) patient.updated_at = data.updated_at;
        if (data.report_date) patient.report_date = data.report_date;
      }

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: data || patient, error: null };
    } catch (err) {
      console.warn('Lưu ý lưu bệnh nhân lên cloud:', err?.message || err);
      this.markPendingSync(patient.id);
      this.isSyncing = false;
      this.notifyStateChange();
      return { data: patient, error: err, offlineSaved: true };
    }
  }

  async syncBatchPatients(patientsArray, targetDate = null, options = {}) {
    if (!patientsArray || !Array.isArray(patientsArray)) {
      return { data: [], error: null };
    }

    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());
    const targetDoctor = options?.doctor || window.patientController?.getEffectiveDoctor?.()?.doctor || null;
    const isAllScope = options?.isAll !== undefined ? !!options.isAll : !!window.patientController?.getEffectiveDoctor?.()?.isAll;

    if (patientsArray.length > 0) {
      this._clearIntentionalEmptyFlag(isoDate, targetDoctor);
    }

    if (this.batchSyncLock) {
      this.pendingBatch = { array: patientsArray, date: isoDate, options };
      return { data: patientsArray, error: null, queued: true };
    }

    this.lastLocalSaveTimestamp = Date.now();
    this.batchSyncLock = true;
    this.isSyncing = true;
    this.notifyStateChange();

    if (!this.isCloudEnabled || !this.client) {
      patientsArray.forEach(p => { if (p?.id) this.markPendingSync(p.id); });
      this.batchSyncLock = false;
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patientsArray, error: null, offlineSaved: true };
    }

    try {
      await this.ensureSession().catch(() => { });
      await this.flushPendingDeletes();
      const currentUser = await this.getCurrentUser().catch(() => null);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const nowIso = new Date().toISOString();

      const deletedTombstones = this.getDeletedTombstoneIds();
      const pendingDeletes = this.getPendingDeleteIds();

      const rawRecords = patientsArray
        .filter(p => p && (!p.id || (!deletedTombstones.has(p.id) && !pendingDeletes.has(p.id))))
        .map((p, idx) => {
          const item = this.sanitizePatientForSupabase({ ...p, sort_order: idx }, isoDate);
          if (!item.id || !uuidRegex.test(item.id)) {
            item.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
            if (p) p.id = item.id;
          }
          if (currentUser && currentUser.id && uuidRegex.test(currentUser.id)) {
            item.user_id = currentUser.id;
          }
          if (!item.created_at || item.created_at === 'null') {
            item.created_at = nowIso;
          }
          item.updated_at = nowIso;
          this.recentlySavedPatientIds.set(item.id, Date.now());
          return item;
        });

      // Khử trùng lặp ID trong cùng 1 request
      const seenIds = new Set();
      const deduplicatedRecords = [];
      for (let i = 0; i < rawRecords.length; i++) {
        const item = rawRecords[i];
        const lowerId = String(item.id).toLowerCase();
        if (seenIds.has(lowerId)) {
          item.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
          if (patientsArray[i]) patientsArray[i].id = item.id;
        }
        seenIds.add(String(item.id).toLowerCase());
        deduplicatedRecords.push(item);
      }

      let syncedData = deduplicatedRecords;

      if (deduplicatedRecords.length > 0) {
        let upsertSuccess = false;
        try {
          let { data, error: upsertError } = await this.client
            .from('patients')
            .upsert(deduplicatedRecords, { onConflict: 'id', ignoreDuplicates: false })
            .select();

          if (upsertError && this.isMissingColumnError(upsertError, 'dengue_trends')) {
            this.supportsDengueTrendsCol = false;
            deduplicatedRecords.forEach(r => { delete r.dengue_trends; });
            const retryBatch = await this.client
              .from('patients')
              .upsert(deduplicatedRecords, { onConflict: 'id', ignoreDuplicates: false })
              .select();
            data = retryBatch.data;
            upsertError = retryBatch.error;
          }

          if (!upsertError && data && data.length > 0) {
            syncedData = data;
            upsertSuccess = true;
            const syncedMap = new Map(data.map(d => [d.id, d]));
            patientsArray.forEach(p => {
              if (!p?.id) return;
              this.clearPendingSync(p.id);
              const s = syncedMap.get(p.id);
              if (s) {
                if (s.version !== undefined) p.version = s.version;
                if (s.updated_at) p.updated_at = s.updated_at;
              }
            });
          } else if (upsertError) {
            console.warn('Lưu ý upsert mẻ:', upsertError?.message || upsertError);
          }
        } catch (batchErr) {
          console.warn('Lỗi mạng khi upsert mẻ, chuyển sang lưu từng bản ghi:', batchErr?.message || batchErr);
        }

        if (!upsertSuccess) {
          const individuallySaved = [];
          for (const item of deduplicatedRecords) {
            try {
              const res = await this.client.from('patients').upsert(item, { onConflict: 'id' }).select().single();
              if (!res.error) {
                individuallySaved.push(res.data || item);
                this.clearPendingSync(item.id);
              } else {
                this.markPendingSync(item.id);
              }
            } catch (singleErr) {
              this.markPendingSync(item.id);
            }
          }
          if (individuallySaved.length > 0) {
            syncedData = individuallySaved;
          }
        }
      }

      // BƯỚC RECONCILE (CÁCH LY AN TOÀN THEO BÁC SĨ & SOFT-DELETE CHỐNG ZOMBIE):
      try {
        const currentValidIds = new Set(deduplicatedRecords.map(r => String(r.id).toLowerCase()));

        if (options && options.isFullReplace) {
          const { data: cloudList } = await this.client
            .from('patients')
            .select('id, doctor_id, user_id, handover_by_id, doctor_name, handover_by')
            .eq('report_date', isoDate)
            .eq('is_deleted', false);

          if (cloudList && cloudList.length > 0) {
            const scopedCloudList = (isAllScope || !targetDoctor)
              ? cloudList
              : cloudList.filter(p => this.matchesDoctorWorkspace(p, targetDoctor));

            const orphanIds = scopedCloudList
              .map(p => p.id)
              .filter(id => !currentValidIds.has(String(id).toLowerCase()));

            if (orphanIds.length > 0) {
              await this.client
                .from('patients')
                .update({
                  is_deleted: true,
                  last_client_id: this.clientId,
                  client_updated_at: nowIso,
                  updated_at: nowIso
                })
                .in('id', orphanIds);
              orphanIds.forEach(id => {
                this.clearPendingSync(id);
                this.markDeletedTombstone(id);
              });
              console.log(`🧹 [Reconcile Full-Replace] Đã soft-delete ${orphanIds.length} bản ghi thừa trong phạm vi workspace để khớp chính xác ${deduplicatedRecords.length} ca.`);
            }
          }
        } else {
          const deletedTombstones = this.getDeletedTombstoneIds();
          const { data: cloudList } = await this.client
            .from('patients')
            .select('*')
            .eq('report_date', isoDate)
            .eq('is_deleted', false);

          if (cloudList && cloudList.length > 0) {
            const scopedCloud = (isAllScope || !targetDoctor)
              ? cloudList
              : cloudList.filter(p => this.matchesDoctorWorkspace(p, targetDoctor));

            const localIdSet = new Set(deduplicatedRecords.map(p => String(p.id).toLowerCase()));
            const missingFromLocal = scopedCloud.filter(p =>
              !localIdSet.has(String(p.id).toLowerCase()) && !deletedTombstones.has(p.id)
            );

            if (missingFromLocal.length > 0) {
              const trulyMissing = missingFromLocal.filter(cloudP => {
                const cName = (cloudP.ten || '').trim().toLowerCase();
                if (!cName) return false;
                return !deduplicatedRecords.some(localP => {
                  const lName = (localP.ten || '').trim().toLowerCase();
                  if (cName !== lName) return false;
                  const cYear = String(cloudP.nam_sinh_tuoi || '').trim().toLowerCase();
                  const lYear = String(localP.nam_sinh_tuoi || '').trim().toLowerCase();
                  if (cYear && lYear && cYear === lYear) return true;
                  const cRoom = String(cloudP.phong_giuong || '').trim().toLowerCase();
                  const lRoom = String(localP.phong_giuong || '').trim().toLowerCase();
                  if (cRoom && lRoom && cRoom === lRoom) return true;
                  return false;
                });
              });

              if (trulyMissing.length > 0) {
                console.log(`📡 [Multi-Device Safe] Phát hiện ${trulyMissing.length} người bệnh từ thiết bị khác trên Cloud trong cùng workspace.`);
                syncedData = [...syncedData, ...trulyMissing];
                syncedData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              }
            }
          }
        }

        // 3. Tự động xóa dữ liệu cũ trước hôm qua (chỉ giữ hôm qua & hôm nay)
        this.purgeOldData().catch(() => { });
      } catch (reconcileErr) {
        console.warn('Lỗi reconcile danh sách trên Cloud:', reconcileErr);
      }

      this.batchSyncLock = false;
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();

      if (this.pendingBatch) {
        const nextBatch = this.pendingBatch;
        this.pendingBatch = null;
        setTimeout(() => this.syncBatchPatients(nextBatch.array, nextBatch.date, nextBatch.options), 50);
      }

      return { data: syncedData, error: null };
    } catch (err) {
      console.warn('Lưu ý đồng bộ Cloud:', err?.message || err);
      patientsArray.forEach(p => { if (p?.id) this.markPendingSync(p.id); });
      this.batchSyncLock = false;
      this.isSyncing = false;
      this.notifyStateChange();

      if (this.pendingBatch && (typeof navigator === 'undefined' || navigator.onLine)) {
        const nextBatch = this.pendingBatch;
        this.pendingBatch = null;
        setTimeout(() => this.syncBatchPatients(nextBatch.array, nextBatch.date, nextBatch.options), 300);
      } else {
        this.pendingBatch = null;
      }

      return {
        data: patientsArray,
        error: err,
        offlineSaved: true,
        networkWarning: err?.message || 'Chờ kết nối mạng'
      };
    }
  }

  /**
   * Xóa toàn bộ danh sách bệnh nhân trên Cloud theo ngày & phạm vi Bác sĩ (Soft delete an toàn)
   */
  async clearAllPatients(targetDate = null, targetDoctor = null, isAll = false) {
    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());
    const doctor = targetDoctor || window.patientController?.getEffectiveDoctor?.()?.doctor || null;
    const clearAllScope = isAll || !!window.patientController?.getEffectiveDoctor?.()?.isAll;

    try {
      localStorage.setItem(this._getClearedDateKey(doctor, clearAllScope), isoDate);
    } catch (e) { }

    if (!this.isCloudEnabled || !this.client) {
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { success: true, offlineSaved: true };
    }

    try {
      await this.ensureSession();
      const { data: cloudList, error: fetchErr } = await this.client
        .from('patients')
        .select('id, doctor_id, user_id, handover_by_id, doctor_name, handover_by')
        .eq('report_date', isoDate)
        .eq('is_deleted', false);

      if (fetchErr) throw fetchErr;

      const scopedIds = (cloudList || [])
        .filter(p => (clearAllScope || !doctor) ? true : this.matchesDoctorWorkspace(p, doctor))
        .map(p => p.id);

      if (scopedIds.length > 0) {
        const nowIso = new Date().toISOString();
        const { error } = await this.client
          .from('patients')
          .update({
            is_deleted: true,
            last_client_id: this.clientId,
            client_updated_at: nowIso,
            updated_at: nowIso
          })
          .in('id', scopedIds);

        if (error) {
          console.warn('Lỗi xóa toàn bộ trên cloud:', error);
          scopedIds.forEach(id => {
            this.clearPendingSync(id);
            this.markPendingDelete(id);
            this.markDeletedTombstone(id);
          });
          return { success: false, error };
        }

        scopedIds.forEach(id => {
          this.clearPendingSync(id);
          this.clearPendingDelete(id);
          this.markDeletedTombstone(id);
        });
      }

      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      console.log(`🧹 Đã xóa (${scopedIds.length} ca) trong workspace ngày ${isoDate} trên Supabase Cloud.`);
      return { success: true };
    } catch (err) {
      console.warn('Lỗi xóa toàn bộ bệnh nhân trên cloud:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Xóa bệnh nhân: Soft delete (is_deleted = true) chống hồi sinh Zombie record trên đa thiết bị
   */
  async deletePatient(patientId) {
    if (!patientId) return { success: false };
    this.recentlyDeletedPatientIds.set(patientId, Date.now());
    this.clearPendingSync(patientId);
    this.markDeletedTombstone(patientId);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      return { success: true };
    }

    if (!this.isCloudEnabled || !this.client) {
      this.markPendingDelete(patientId);
      return { success: true, offlineSaved: true };
    }

    try {
      await this.ensureSession();
      const nowIso = new Date().toISOString();
      const { error } = await this.client
        .from('patients')
        .update({
          is_deleted: true,
          last_client_id: this.clientId,
          client_updated_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', patientId);

      if (error) {
        console.warn('Lỗi xóa bệnh nhân trên cloud:', error);
        this.markPendingDelete(patientId);
        return { success: false, error, offlineSaved: true };
      }

      this.clearPendingDelete(patientId);
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { success: true };
    } catch (err) {
      console.warn('Lỗi xóa bệnh nhân trên cloud:', err);
      this.markPendingDelete(patientId);
      return { success: false, error: err, offlineSaved: true };
    }
  }

  // ================= WORK_DAYS MANAGEMENT =================

  async getActiveWorkDate() {
    if (!this.isCloudEnabled || !this.client) {
      return this.getCurrentWorkDate();
    }
    try {
      const { data } = await this.client
        .from('work_days')
        .select('*')
        .eq('status', 'active')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      if (data && data.report_date) {
        return data.report_date;
      }
    } catch (e) { }
    return this.getCurrentWorkDate();
  }

  async setWorkDayStatus(dateStr, status = 'active', totalPatients = 0) {
    if (!this.isCloudEnabled || !this.client) return;
    const isoDate = this.formatDateToISO(dateStr);
    try {
      await this.client.from('work_days').upsert({
        report_date: isoDate,
        department: 'Khoa Nhiễm',
        status: status,
        total_patients: totalPatients,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Lỗi cập nhật work_day:', e);
    }
  }

  // ================= DATA RETENTION (CHỈ LƯU HÔM QUA & HÔM NAY) =================

  /**
   * Tự động xóa dữ liệu cũ trên Supabase:
   * CHỈ LƯU DANH SÁCH: HÔM QUA, HÔM NAY.
   * Tất cả dữ liệu trước ngày hôm qua (report_date < yesterday) sẽ bị xóa hoàn toàn.
   */
  async purgeOldData() {
    if (!this.isCloudEnabled || !this.client) return { success: true };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = this.formatDateToISO(yesterday);

    try {
      await this.ensureSession();

      // 1. Xóa dữ liệu bệnh nhân cũ hơn ngày hôm qua (report_date < yesterdayIso)
      const { error: errPatients, count: countPatients } = await this.client
        .from('patients')
        .delete({ count: 'exact' })
        .lt('report_date', yesterdayIso);

      if (errPatients) {
        console.warn('Lưu ý xóa bệnh nhân cũ trên Supabase:', errPatients.message || errPatients);
      } else if (countPatients && countPatients > 0) {
        console.log(`🧹 [Supabase Purge] Đã dọn dẹp ${countPatients} bản ghi bệnh nhân cũ hơn ngày ${yesterdayIso}.`);
      }

      // 2. Xóa các ca trực cũ hơn ngày hôm qua
      await this.client
        .from('work_days')
        .delete()
        .lt('report_date', yesterdayIso)
        .catch(() => { });

      // 3. Xóa các nhật ký giao ban cũ hơn ngày hôm qua
      await this.client
        .from('handover_logs')
        .delete()
        .lt('report_date', yesterdayIso)
        .catch(() => { });

      return { success: true, yesterdayIso };
    } catch (e) {
      console.warn('Lỗi dọn dẹp dữ liệu cũ trên Supabase:', e);
      return { success: false, error: e };
    }
  }
}

window.supabaseService = new SupabaseService();
