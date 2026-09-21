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

    this.init();
  }

  init() {
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
        this.setupRealtimeSubscription();
      } catch (err) {
        console.error('Lỗi khởi tạo Supabase:', err);
      }
    }
    this.notifyStateChange();
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
        // Nếu trên cloud chưa có dữ liệu, trả về cache local
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

  async savePatient(patient) {
    this.isSyncing = true;
    this.notifyStateChange();

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
      const payload = { ...patient };
      // Nếu ID là dạng tạm demo/local thì không gửi id dạng string nếu Postgres đòi UUID
      if (typeof payload.id === 'string' && payload.id.startsWith('local_')) {
        delete payload.id;
      }

      const { data, error } = await this.client
        .from('patients')
        .upsert(payload)
        .select()
        .single();

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data, error };
    } catch (err) {
      this.isSyncing = false;
      this.notifyStateChange();
      return { data: null, error: err };
    }
  }

  async syncBatchPatients(patientsArray) {
    this.isSyncing = true;
    this.notifyStateChange();

    // Cache local
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(patientsArray));

    if (!this.isCloudEnabled || !this.client) {
      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data: patientsArray, error: null };
    }

    try {
      // Xóa và ghi lại hoặc upsert
      const recordsToInsert = patientsArray.map((p, idx) => {
        const item = { ...p, sort_order: idx };
        if (typeof item.id === 'string' && (item.id.startsWith('demo_') || item.id.startsWith('local_'))) {
          delete item.id;
        }
        return item;
      });

      // Xóa cũ và thêm mới danh sách giao ban
      await this.client.from('patients').delete().neq('ten', '___PROTECT_KEEP_ALL___');
      const { data, error } = await this.client.from('patients').insert(recordsToInsert).select();

      this.isSyncing = false;
      this.lastSyncedAt = new Date();
      this.notifyStateChange();
      return { data, error };
    } catch (err) {
      console.error('Lỗi sync batch patients lên cloud:', err);
      this.isSyncing = false;
      this.notifyStateChange();
      return { data: null, error: err };
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

    try {
      await this.client.from('patients').delete().eq('id', patientId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

window.supabaseService = new SupabaseService();
