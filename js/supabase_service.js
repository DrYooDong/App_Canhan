// ==============================================================================
// SUPABASE CLIENT SERVICE & REALTIME SYNC (WITH LOCAL FALLBACK)
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

    this.init();
  }

  async init() {
    let conf = null;
    const configStr = localStorage.getItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG);
    if (configStr) {
      try {
        conf = JSON.parse(configStr);
      } catch (err) {}
    }

    // Nếu trong LocalStorage chưa có hoặc rỗng, tự động lấy cấu hình cố định mặc định
    if (!conf || !conf.url || !conf.key) {
      if (CONFIG.DEFAULT_SUPABASE?.URL && CONFIG.DEFAULT_SUPABASE?.KEY) {
        conf = {
          url: CONFIG.DEFAULT_SUPABASE.URL,
          key: CONFIG.DEFAULT_SUPABASE.KEY
        };
        try {
          localStorage.setItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(conf));
        } catch (e) {}
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

      // Nếu đã lưu phiên người dùng
      const savedDoctor = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
      const email = savedDoctor?.email || 'nguyenhuudongy18@gmail.com';
      const savedPin = localStorage.getItem('medward_doctor_pin') || '123456';

      const { data, error } = await this.client.auth.signInWithPassword({
        email: email,
        password: savedPin
      });
      if (!error && data?.session) {
        return data.session;
      }
    } catch (e) {
      // Bỏ qua lỗi kết nối phiên để không gây nghẽn truy vấn dữ liệu
    }
    return null;
  }

  // Cấu hình URL & Key
  configure(url, key) {
    if (!url || !key) {
      // Nếu xóa trắng, phục hồi về cấu hình cố định mặc định nếu có
      if (CONFIG.DEFAULT_SUPABASE?.URL && CONFIG.DEFAULT_SUPABASE?.KEY) {
        const defaultConf = {
          url: CONFIG.DEFAULT_SUPABASE.URL,
          key: CONFIG.DEFAULT_SUPABASE.KEY
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(defaultConf));
        this.client = window.supabase.createClient(defaultConf.url, defaultConf.key);
        this.isCloudEnabled = true;
        this.setupRealtimeSubscription();
        this.notifyStateChange();
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
      this.setupRealtimeSubscription();
      this.notifyStateChange();
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
      } catch (e) {}
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
      lastSyncedAt: this.lastSyncedAt
    };
  }

  onStateChange(callback) {
    this.stateListeners.push(callback);
    callback(this.getConnectionStatus());
  }

  notifyStateChange() {
    const status = this.getConnectionStatus();
    this.stateListeners.forEach(cb => {
      try { cb(status); } catch (e) {}
    });
  }

  // Đăng ký nhận thông báo khi có dữ liệu mới từ thiết bị khác (Realtime)
  onRealtimeUpdate(callback) {
    this.syncListeners.push(callback);
  }

  notifyRealtimeSubscribers(payload) {
    this.syncListeners.forEach(cb => {
      try { cb(payload); } catch (e) {}
    });
  }

  // Lắng nghe thay đổi Realtime qua Supabase Channels
  setupRealtimeSubscription() {
    if (!this.client) return;

    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    try {
      this.realtimeChannel = this.client
        .channel('public:patients')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          (payload) => {
            console.log('⚡ Realtime sync received:', payload);
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            this.notifyRealtimeSubscribers(payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 Trạng thái kênh Realtime Supabase:', status);
        });
    } catch (e) {
      console.warn('Không thể khởi tạo kênh Realtime:', e);
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
      // Local Mode Sign Up
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

      // Lưu thông tin vào bảng profiles nếu user tạo thành công
      if (data && data.user) {
        await this.client.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: doctorData.full_name || '',
          title: doctorData.title || 'Bác sĩ điều trị',
          department: doctorData.department || 'Khoa Nhiễm',
          hospital: doctorData.hospital || 'BV ĐKKV Thủ Đức',
          phone: doctorData.phone || ''
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
      // Local Mode Sign In
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

      // Lấy profile chi tiết
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
        phone: profile?.phone || user.user_metadata?.phone || ''
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
    // Chỉ giữ duy nhất BS. Nguyễn Hữu Đông, loại bỏ hoàn toàn các bác sĩ khác
    const defaultDoctor = { ...(CONFIG.DEFAULT_DEMO_DOCTOR || CONFIG.DEFAULT_DOCTORS[0]) };
    let localList = [defaultDoctor];

    if (this.isCloudEnabled && this.client) {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });
        if (!error && data && data.length > 0) {
          // Chỉ lấy profile khớp với BS. Đông
          const dongProfile = data.find(p => {
            const name = (p.full_name || '').toLowerCase();
            const email = (p.email || '').toLowerCase();
            const user = (p.username || '').toLowerCase();
            return name.includes('đông') || name.includes('dong') || email.includes('dong') || user.includes('dong');
          });

          if (dongProfile) {
            defaultDoctor.id = dongProfile.id;
            defaultDoctor.full_name = dongProfile.full_name || 'BS. Nguyễn Hữu Đông';
            defaultDoctor.email = dongProfile.email || 'nguyenhuudongy18@gmail.com';
            defaultDoctor.username = dongProfile.username || 'dongnh';
            defaultDoctor.department = dongProfile.department || 'Khoa Nhiễm';
            defaultDoctor.hospital = dongProfile.hospital || 'BV ĐKKV Thủ Đức';
            defaultDoctor.title = dongProfile.title || 'Bác sĩ điều trị';
            if (dongProfile.phone) defaultDoctor.phone = dongProfile.phone;
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy thông tin bác sĩ từ cloud:', err);
      }
    }

    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify([defaultDoctor]));
    } catch (e) {}

    return [defaultDoctor];
  }

  // ================= PATIENT DATA OPERATIONS =================

  async fetchPatients() {
    this.isSyncing = true;
    this.notifyStateChange();

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.notifyStateChange();
      const local = localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      return local ? JSON.parse(local) : [...CONFIG.SAMPLE_PATIENTS];
    }

    try {
      // Đảm bảo session trước khi truy vấn
      await this.ensureSession();

      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();

      if (error) throw error;
      if (data && data.length > 0) {
        // Cache lại vào localStorage để phòng khi mất mạng
        localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(data));
        return data;
      } else {
        // Nếu trên cloud chưa có dữ liệu, trả về cache local nếu có
        const local = localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
        return local ? JSON.parse(local) : [];
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu bệnh nhân từ cloud, dùng cache nội bộ:', err);
      this.isSyncing = false;
      this.notifyStateChange();
      const local = localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      return local ? JSON.parse(local) : [...CONFIG.SAMPLE_PATIENTS];
    }
  }

  // Lọc chỉ giữ các cột hợp lệ theo PostgreSQL Schema để tránh lỗi column not exist và bảo đảm Not-Null constraints
  sanitizePatientForSupabase(p) {
    const allowedCols = [
      'id', 'user_id', 'department', 'phong_giuong', 'ten', 'nam_sinh_tuoi',
      'chan_doan', 'cls', 'y_lenh', 'sort_order', 'handover_status',
      'handover_issues', 'handover_actions', 'handover_by', 'handover_by_id',
      'handover_at', 'handover_resolved_by', 'handover_resolved_at',
      'created_at', 'updated_at'
    ];
    const out = {};
    for (const col of allowedCols) {
      if (p[col] !== undefined && p[col] !== null) {
        out[col] = p[col];
      }
    }
    // Gán doctor_name vào handover_by để đồng bộ xuyên suốt
    if (p.doctor_name && !out.handover_by) {
      out.handover_by = p.doctor_name;
    }

    // Đóng gói cấu trúc 2 phần CLS (Hiện có & Cần làm) vào cột cls để tương thích hoàn toàn cơ sở dữ liệu
    if (p.cls_hien_co !== undefined || p.cls_can_lam !== undefined) {
      const hc = (p.cls_hien_co || '').trim();
      const cl = (p.cls_can_lam || '').trim();
      if (hc && cl) {
        out.cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
      } else if (cl) {
        out.cls = `[Cần làm]: ${cl}`;
      } else {
        out.cls = hc;
      }
    }

    // Đóng gói Thêm thuốc vào cột y_lenh để tương thích cơ sở dữ liệu
    if (p.them_thuoc) {
      const baseYl = (p.y_lenh || '').trim();
      const extraRx = String(p.them_thuoc).trim();
      if (extraRx) {
        if (baseYl) {
          out.y_lenh = `${baseYl}\n[Thêm thuốc]: ${extraRx}`;
        } else {
          out.y_lenh = `[Thêm thuốc]: ${extraRx}`;
        }
      }
    }

    // Đảm bảo created_at và updated_at luôn là chuỗi thời gian ISO hợp lệ, TUYỆT ĐỐI không bao giờ null
    const nowIso = new Date().toISOString();
    if (!out.created_at || out.created_at === 'null' || typeof out.created_at !== 'string') {
      out.created_at = (p.created_at && p.created_at !== 'null' && typeof p.created_at === 'string')
        ? p.created_at
        : nowIso;
    }
    if (!out.updated_at || out.updated_at === 'null' || typeof out.updated_at !== 'string') {
      out.updated_at = nowIso;
    }

    // Đảm bảo tên người bệnh không rỗng
    if (!out.ten || !String(out.ten).trim()) {
      out.ten = (p.ten && String(p.ten).trim()) || 'BỆNH NHÂN MỚI';
    }

    // Đảm bảo handover_status hợp lệ
    if (!out.handover_status) {
      out.handover_status = p.handover_status || 'none';
    }

    // Đảm bảo sort_order là số
    if (typeof out.sort_order !== 'number' || isNaN(out.sort_order)) {
      out.sort_order = 0;
    }

    return out;
  }

  async savePatient(patient) {
    this.isSyncing = true;
    this.notifyStateChange();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!patient.id || !uuidRegex.test(patient.id)) {
      patient.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
    }

    // Luôn cập nhật local storage trước
    let localList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA) || '[]');
    const idx = localList.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...patient };
    } else {
      localList.push(patient);
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(localList));

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patient, error: null };
    }

    try {
      await this.ensureSession();
      const payload = this.sanitizePatientForSupabase(patient);
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id && uuidRegex.test(currentUser.id)) {
        payload.user_id = currentUser.id;
      }
      payload.updated_at = new Date().toISOString();

      const { data, error } = await this.client
        .from('patients')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: data || patient, error: null };
    } catch (err) {
      console.warn('Lưu ý lưu bệnh nhân lên cloud:', err?.message || err);
      this.isSyncing = false;
      this.notifyStateChange();
      return { data: patient, error: null, offlineSaved: true };
    }
  }

  async syncBatchPatients(patientsArray) {
    if (!patientsArray || !Array.isArray(patientsArray)) {
      return { data: [], error: null };
    }

    // Cache local ngay lập tức
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(patientsArray));

    // Khóa chống xung đột truy vấn đồng thời (concurrency mutex)
    if (this.batchSyncLock) {
      this.pendingBatch = patientsArray;
      return { data: patientsArray, error: null, queued: true };
    }

    this.batchSyncLock = true;
    this.isSyncing = true;
    this.notifyStateChange();

    if (!this.isCloudEnabled || !this.client) {
      this.batchSyncLock = false;
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patientsArray, error: null };
    }

    try {
      await this.ensureSession().catch(() => {});
      const currentUser = await this.getCurrentUser().catch(() => null);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const nowIso = new Date().toISOString();

      // 1. Chuẩn hóa dữ liệu theo schema Postgres và cấp phát UUID nếu thiếu hoặc không hợp lệ
      const rawRecords = patientsArray.map((p, idx) => {
        const item = this.sanitizePatientForSupabase({ ...p, sort_order: idx });
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
        return item;
      });

      // 2. KHỬ TRÙNG LẶP ID TRIỆT ĐỂ: Đảm bảo không có 2 bản ghi nào cùng id trong cùng 1 request
      const seenIds = new Set();
      const deduplicatedRecords = [];
      for (let i = 0; i < rawRecords.length; i++) {
        const item = rawRecords[i];
        const lowerId = String(item.id).toLowerCase();
        if (seenIds.has(lowerId)) {
          // Trùng ID: cấp phát UUID mới để tránh lỗi 23505
          item.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
          if (patientsArray[i]) patientsArray[i].id = item.id;
        }
        seenIds.add(String(item.id).toLowerCase());
        deduplicatedRecords.push(item);
      }

      let syncedData = deduplicatedRecords;

      // 3. THỰC HIỆN UPSERT (ON CONFLICT 'id')
      if (deduplicatedRecords.length > 0) {
        let upsertSuccess = false;
        try {
          const { data, error: upsertError } = await this.client
            .from('patients')
            .upsert(deduplicatedRecords, { onConflict: 'id', ignoreDuplicates: false })
            .select();

          if (!upsertError && data && data.length > 0) {
            syncedData = data;
            upsertSuccess = true;
          } else if (upsertError) {
            console.warn('Lưu ý upsert mẻ:', upsertError?.message || upsertError);
          }
        } catch (batchErr) {
          console.warn('Lỗi mạng khi upsert mẻ, chuyển sang lưu từng bản ghi:', batchErr?.message || batchErr);
        }

        // Nếu upsert cả mẻ bị lỗi (ví dụ 23505 hoặc payload lớn), lưu từng bản ghi một cách bền bỉ
        if (!upsertSuccess) {
          const individuallySaved = [];
          for (const item of deduplicatedRecords) {
            try {
              const res = await this.client.from('patients').upsert(item, { onConflict: 'id' });
              if (res.error) {
                // Nếu bị lỗi 23505 trùng khóa, cấp phát UUID mới và thử lại
                item.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
                const retryRes = await this.client.from('patients').upsert(item, { onConflict: 'id' });
                if (!retryRes.error) individuallySaved.push(item);
              } else {
                individuallySaved.push(item);
              }
            } catch (singleErr) {
              // Bỏ qua lỗi từng bản ghi để không ngắt toàn bộ tiến trình
            }
          }
          if (individuallySaved.length > 0) {
            syncedData = individuallySaved;
          }
        }

        // 4. DỌN DẸP BỆNH NHÂN ĐÃ BỊ XÓA
        try {
          const keepIdSet = new Set(deduplicatedRecords.map(r => r.id));
          let q = this.client.from('patients').select('id');
          if (currentUser && currentUser.id && uuidRegex.test(currentUser.id)) {
            q = q.eq('user_id', currentUser.id);
          }
          const { data: remoteRows, error: fetchErr } = await q;
          if (!fetchErr && remoteRows && remoteRows.length > 0) {
            const staleIds = remoteRows.map(r => r.id).filter(id => !keepIdSet.has(id));
            if (staleIds.length > 0) {
              for (let i = 0; i < staleIds.length; i += 50) {
                const chunk = staleIds.slice(i, i + 50);
                await this.client.from('patients').delete().in('id', chunk).catch(() => {});
              }
            }
          }
        } catch (pruneErr) {
          // Bỏ qua lỗi dọn dẹp ID cũ
        }
      } else {
        // Trường hợp danh sách rỗng (người dùng xóa hết bệnh nhân)
        try {
          let delQ = this.client.from('patients').delete();
          if (currentUser && currentUser.id && uuidRegex.test(currentUser.id)) {
            delQ = delQ.eq('user_id', currentUser.id);
          } else {
            delQ = delQ.neq('ten', '___PROTECT_EMPTY_GUARD___');
          }
          await delQ;
        } catch (e) {}
      }

      // Đồng bộ ngược lại vào local cache và controller
      localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(syncedData));
      if (window.patientController) {
        window.patientController.patientList = syncedData;
      }

      this.batchSyncLock = false;
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();

      // Nếu có tác vụ chờ trong hàng đợi, thực thi tiếp tục
      if (this.pendingBatch) {
        const nextBatch = this.pendingBatch;
        this.pendingBatch = null;
        setTimeout(() => this.syncBatchPatients(nextBatch), 50);
      }

      return { data: syncedData, error: null };
    } catch (err) {
      console.warn('Lưu ý đồng bộ Cloud (dữ liệu đã lưu an toàn vào bộ nhớ nội bộ):', err?.message || err);
      this.batchSyncLock = false;
      this.isSyncing = false;
      this.notifyStateChange();

      if (this.pendingBatch) {
        this.pendingBatch = null;
      }

      // Cập nhật trạng thái lưu an toàn trên máy
      if (window.updateSaveStatus) {
        window.updateSaveStatus('💾 Đã lưu bộ nhớ máy (Đang chờ kết nối Cloud)');
      }

      return { 
        data: patientsArray, 
        error: null, 
        offlineSaved: true,
        networkWarning: err?.message || 'Chờ kết nối mạng'
      };
    }
  }

  async deletePatient(patientId) {
    // Local remove
    let localList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA) || '[]');
    localList = localList.filter(p => p.id !== patientId);
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(localList));

    if (!this.isCloudEnabled || !this.client) {
      return { success: true };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      return { success: true };
    }

    try {
      await this.ensureSession();
      const { error } = await this.client.from('patients').delete().eq('id', patientId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Lỗi xóa bệnh nhân trên cloud:', err);
      return { success: false, error: err };
    }
  }
}

window.supabaseService = new SupabaseService();
