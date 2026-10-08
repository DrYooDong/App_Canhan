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
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    this.lastLocalSaveTimestamp = 0;

    this.init();
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
    const reportDateInput = document.getElementById('reportDate');
    if (reportDateInput && reportDateInput.value) {
      return this.formatDateToISO(reportDateInput.value);
    }
    return this.formatDateToISO(new Date());
  }

  // ================= INITIALIZATION =================

  async init() {
    let conf = null;
    const configStr = localStorage.getItem(CONFIG.STORAGE_KEYS.SUPABASE_CONFIG);
    if (configStr) {
      try {
        conf = JSON.parse(configStr);
      } catch (err) {}
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

      const savedDoctor = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
      const email = savedDoctor?.email || 'nguyenhuudongy18@gmail.com';
      const savedPin = localStorage.getItem('medward_doctor_pin') || savedDoctor?.pin;

      if (savedPin) {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: email,
          password: String(savedPin).trim()
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
    // 1. Kiểm tra Client ID để triệt tiêu echo loop
    if (payload?.new?.last_client_id && payload.new.last_client_id === this.clientId) {
      return;
    }

    // 2. Kiểm tra nếu vừa mới lưu từ chính phiên này trong 1.5s
    if (this.lastLocalSaveTimestamp && (Date.now() - this.lastLocalSaveTimestamp < 1500)) {
      return;
    }

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
        .channel('public:medward_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          (payload) => {
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            this.notifyRealtimeSubscribers(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'work_days' },
          (payload) => {
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
            this.lastSyncedAt = new Date();
            this.notifyStateChange();
            if (window.loadHospitalMetadata) {
              window.loadHospitalMetadata();
            }
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
    } catch (e) {}

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
            const existingIdx = docs.findIndex(d => d.id === p.id || (p.username && d.username === p.username) || (p.email && d.email === p.email));
            const docObj = {
              id: p.id || 'doc_' + (p.username || Date.now()),
              username: p.username || (p.email ? p.email.split('@')[0] : 'bs'),
              full_name: p.full_name || 'Bác sĩ điều trị',
              title: p.title || 'Bác sĩ điều trị',
              department: p.department || 'Khoa Nhiễm',
              hospital: p.hospital || 'BV ĐKKV Thủ Đức',
              phone: p.phone || '',
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
    } catch (e) {}

    return docs;
  }

  // ================= PATIENT DATA OPERATIONS =================

  /**
   * Truy vấn danh sách bệnh nhân theo NGÀY (report_date) và BÁC SĨ (doctor)
   * @param {Object|null} targetDoctor Bác sĩ mục tiêu
   * @param {string|Date|null} targetDate Ngày làm việc (định dạng DD/MM/YYYY hoặc YYYY-MM-DD hoặc Date)
   */
  async fetchPatients(targetDoctor = null, targetDate = null) {
    this.isSyncing = true;
    this.notifyStateChange();

    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());
    const dateCacheKey = `medward_patients_${isoDate}`;

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.notifyStateChange();
      const local = localStorage.getItem(dateCacheKey) || localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      return local ? JSON.parse(local) : [...CONFIG.SAMPLE_PATIENTS];
    }

    try {
      await this.ensureSession();

      // 1. Truy vấn bệnh nhân ĐÚNG THEO NGÀY và CHƯA BỊ XÓA (is_deleted = false)
      let query = this.client
        .from('patients')
        .select('*')
        .eq('report_date', isoDate)
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(p => {
          if (window.patientController && typeof window.patientController.normalizePatientClsAndOrders === 'function') {
            window.patientController.normalizePatientClsAndOrders(p);
          }
        });
        localStorage.setItem(dateCacheKey, JSON.stringify(data));
        return data;
      } else {
        // Nếu ngày này chưa có bản ghi trên cloud, kiểm tra xem có phải là ngày hôm nay và DB cũ chưa có report_date
        const isToday = (isoDate === this.formatDateToISO(new Date()));
        if (isToday) {
          const { data: legacyData } = await this.client
            .from('patients')
            .select('*')
            .is('report_date', null)
            .eq('is_deleted', false)
            .order('sort_order', { ascending: true });

          if (legacyData && legacyData.length > 0) {
            // Tự động gán report_date cho các bản ghi cũ
            legacyData.forEach(p => p.report_date = isoDate);
            localStorage.setItem(dateCacheKey, JSON.stringify(legacyData));
            return legacyData;
          }
        }

        // Ngày hoàn toàn mới / chưa có bệnh nhân
        const local = localStorage.getItem(dateCacheKey);
        return local ? JSON.parse(local) : [];
      }
    } catch (err) {
      console.warn(`Lỗi tải dữ liệu bệnh nhân ngày ${isoDate} từ cloud:`, err);
      this.isSyncing = false;
      this.notifyStateChange();
      const local = localStorage.getItem(dateCacheKey) || localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      return local ? JSON.parse(local) : [...CONFIG.SAMPLE_PATIENTS];
    }
  }

  /**
   * Lọc và chuẩn hóa dữ liệu bản ghi bệnh nhân phù hợp với Supabase Schema 2026
   */
  sanitizePatientForSupabase(p, targetDate = null) {
    const allowedCols = [
      'id', 'report_date', 'user_id', 'department', 'phong_giuong', 'ten', 'nam_sinh_tuoi',
      'chan_doan', 'cls', 'cls_hien_co', 'cls_can_lam', 'y_lenh', 'them_thuoc',
      'doctor_id', 'doctor_name', 'sort_order',
      'is_discharged', 'is_deleted',
      'handover_status', 'handover_issues', 'handover_actions', 'handover_by', 'handover_by_id',
      'handover_at', 'handover_resolved_by', 'handover_resolved_at',
      'version', 'last_client_id', 'client_updated_at',
      'created_at', 'updated_at'
    ];
    const out = {};
    for (const col of allowedCols) {
      if (p[col] !== undefined && p[col] !== null) {
        out[col] = p[col];
      }
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
    this.lastLocalSaveTimestamp = Date.now();
    this.isSyncing = true;
    this.notifyStateChange();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!patient.id || !uuidRegex.test(patient.id)) {
      patient.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
    }

    const isoDate = this.formatDateToISO(patient.report_date || targetDate || this.getCurrentWorkDate());
    patient.report_date = isoDate;

    // Cache local theo ngày
    const dateCacheKey = `medward_patients_${isoDate}`;
    let localList = JSON.parse(localStorage.getItem(dateCacheKey) || '[]');
    const idx = localList.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...patient };
    } else {
      localList.push(patient);
    }
    localStorage.setItem(dateCacheKey, JSON.stringify(localList));
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(localList));

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patient, error: null };
    }

    try {
      await this.ensureSession();
      const payload = this.sanitizePatientForSupabase(patient, isoDate);
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

  async syncBatchPatients(patientsArray, targetDate = null) {
    if (!patientsArray || !Array.isArray(patientsArray)) {
      return { data: [], error: null };
    }

    const isoDate = this.formatDateToISO(targetDate || this.getCurrentWorkDate());
    const dateCacheKey = `medward_patients_${isoDate}`;

    // Cache local ngay lập tức
    localStorage.setItem(dateCacheKey, JSON.stringify(patientsArray));
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(patientsArray));

    if (this.batchSyncLock) {
      this.pendingBatch = { array: patientsArray, date: isoDate };
      return { data: patientsArray, error: null, queued: true };
    }

    this.lastLocalSaveTimestamp = Date.now();
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

      const rawRecords = patientsArray.map((p, idx) => {
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

        if (!upsertSuccess) {
          const individuallySaved = [];
          for (const item of deduplicatedRecords) {
            try {
              const res = await this.client.from('patients').upsert(item, { onConflict: 'id' });
              if (res.error) {
                item.id = (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID());
                const retryRes = await this.client.from('patients').upsert(item, { onConflict: 'id' });
                if (!retryRes.error) individuallySaved.push(item);
              } else {
                individuallySaved.push(item);
              }
            } catch (singleErr) {}
          }
          if (individuallySaved.length > 0) {
            syncedData = individuallySaved;
          }
        }
      }

      this.batchSyncLock = false;
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();

      if (this.pendingBatch) {
        const nextBatch = this.pendingBatch;
        this.pendingBatch = null;
        setTimeout(() => this.syncBatchPatients(nextBatch.array, nextBatch.date), 50);
      }

      return { data: syncedData, error: null };
    } catch (err) {
      console.warn('Lưu ý đồng bộ Cloud:', err?.message || err);
      this.batchSyncLock = false;
      this.isSyncing = false;
      this.notifyStateChange();

      if (this.pendingBatch) {
        this.pendingBatch = null;
      }

      return {
        data: patientsArray,
        error: null,
        offlineSaved: true,
        networkWarning: err?.message || 'Chờ kết nối mạng'
      };
    }
  }

  /**
   * Xóa bệnh nhân: Sử dụng SOFT DELETE (is_deleted = true) trên Cloud
   * để thông báo Realtime xóa tức thì sang các máy khác mà không bị hiện tượng Zombie
   */
  async deletePatient(patientId) {
    const isoDate = this.getCurrentWorkDate();
    const dateCacheKey = `medward_patients_${isoDate}`;

    // Xóa khỏi cache local
    let localList = JSON.parse(localStorage.getItem(dateCacheKey) || '[]');
    localList = localList.filter(p => p.id !== patientId);
    localStorage.setItem(dateCacheKey, JSON.stringify(localList));
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
      // Soft delete trên Supabase để bắn Realtime DELETE cho các client khác
      const { error } = await this.client
        .from('patients')
        .update({
          is_deleted: true,
          last_client_id: this.clientId,
          client_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) {
        // Fallback hard delete nếu schema cũ chưa có is_deleted
        await this.client.from('patients').delete().eq('id', patientId);
      }
      return { success: true };
    } catch (err) {
      console.warn('Lỗi xóa bệnh nhân trên cloud:', err);
      return { success: false, error: err };
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
    } catch (e) {}
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
}

window.supabaseService = new SupabaseService();
