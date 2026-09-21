// ==============================================================================
// AUTHENTICATION & DOCTOR PROFILE CONTROLLER
// ==============================================================================

class AuthController {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    this.currentUser = await window.supabaseService.getCurrentUser();
    this.updateUserUI();
    this.bindEvents();

    // Lắng nghe thay đổi trạng thái kết nối Cloud
    window.supabaseService.onStateChange((status) => {
      this.updateCloudStatusUI(status);
    });
  }

  updateUserUI() {
    const doctorNameEl = document.getElementById('doctorNameDisplay');
    const doctorDeptEl = document.getElementById('doctorDeptDisplay');
    const doctorInput = document.getElementById('doctorName');
    const userBadgeEl = document.getElementById('userProfileBadge');

    if (this.currentUser) {
      if (doctorInput && !doctorInput.value) doctorInput.value = this.currentUser.full_name || '';
      if (userBadgeEl) {
        const info = `${this.currentUser.full_name || 'Bác sĩ'} (${this.currentUser.department || 'Khoa Nhiễm'})`;
        userBadgeEl.setAttribute('data-tooltip', info);
        userBadgeEl.className = 'icon-btn btn-user';
        userBadgeEl.innerHTML = '🩺';
      }
    } else {
      if (userBadgeEl) {
        userBadgeEl.setAttribute('data-tooltip', 'Đăng nhập / Hồ sơ Bác sĩ');
        userBadgeEl.className = 'icon-btn btn-user';
        userBadgeEl.innerHTML = '👤';
      }
    }
  }

  updateCloudStatusUI(status) {
    const indicator = document.getElementById('cloudSyncIndicator');
    const statusText = document.getElementById('saveStatus');

    if (!indicator) return;

    if (status.isCloud) {
      if (status.isSyncing) {
        indicator.className = 'icon-btn btn-cloud syncing';
        indicator.setAttribute('data-tooltip', 'Cloud: Đang đồng bộ...');
        indicator.innerHTML = '☁️';
        if (statusText) statusText.innerText = '🟡 Đang đồng bộ với Cloud...';
      } else {
        const timeStr = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString('vi-VN') : 'vừa xong';
        indicator.className = 'icon-btn btn-cloud connected';
        indicator.setAttribute('data-tooltip', `Cloud Realtime: Đã đồng bộ (${timeStr})`);
        indicator.innerHTML = '☁️';
        if (statusText) statusText.innerText = `🟢 Cloud Realtime kết nối tốt (Đồng bộ lúc ${timeStr})`;
      }
    } else {
      indicator.className = 'icon-btn btn-cloud';
      indicator.setAttribute('data-tooltip', 'Lưu trữ nội bộ (Nhấn để kết nối Cloud)');
      indicator.innerHTML = '☁️';
      if (statusText) statusText.innerText = '🟢 Lưu trữ bộ nhớ thiết bị (Tự động lưu)';
    }
  }

  bindEvents() {
    // Modal Auth Toggles
    const authBtn = document.getElementById('btnAuthModal');
    if (authBtn) {
      authBtn.addEventListener('click', () => this.openAuthModal());
    }

    const settingsBtn = document.getElementById('btnCloudSettingsModal');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openCloudSettingsModal());
    }

    // Form Đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    // Form Đăng ký
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister();
      });
    }

    // Form Hồ sơ Bác sĩ
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveProfile();
      });
    }

    // Form Cấu hình Supabase Cloud
    const cloudForm = document.getElementById('cloudConfigForm');
    if (cloudForm) {
      cloudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCloudConfig();
      });
    }

    // Nút Đăng xuất
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }

    // Tự động gợi ý tên tài khoản viết tắt khi gõ họ tên Bác sĩ
    this.setupUsernameAutoSuggest();
  }

  setupUsernameAutoSuggest() {
    const nameInput = document.getElementById('regFullName');
    const userInput = document.getElementById('regUsername');
    if (nameInput && userInput) {
      nameInput.addEventListener('input', () => {
        if (!userInput.dataset.manuallyEdited || !userInput.value) {
          userInput.value = this.generateDoctorUsername(nameInput.value);
        }
      });
      userInput.addEventListener('input', () => {
        userInput.dataset.manuallyEdited = 'true';
        userInput.value = userInput.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      });
    }
  }

  generateDoctorUsername(name) {
    if (!name) return '';
    let clean = name.replace(/\b(bs|bs\.|cki|ckii|ths|ts|pgs|gs)\b/gi, '').trim();
    clean = clean.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z\s]/g, '')
      .toLowerCase()
      .trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0];
    const lastName = words[words.length - 1];
    const initials = words.slice(0, -1).map(w => w[0]).join('');
    return (lastName + initials).toLowerCase();
  }

  openAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    // Nếu đã đăng nhập thì hiện tab Profile
    if (this.currentUser) {
      this.switchAuthTab('profile');
      this.fillProfileForm();
    } else {
      this.switchAuthTab('login');
    }
    modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tabName) {
    const tabs = ['login', 'register', 'profile'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tabBtn_${t}`);
      const content = document.getElementById(`tabContent_${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (content) {
        content.classList.toggle('active', t === tabName);
        content.style.display = (t === tabName) ? 'block' : 'none';
      }
    });
  }

  fillProfileForm() {
    if (!this.currentUser) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    setVal('profFullName', this.currentUser.full_name);
    setVal('profTitle', this.currentUser.title);
    setVal('profDept', this.currentUser.department);
    setVal('profHospital', this.currentUser.hospital);
    setVal('profPhone', this.currentUser.phone);
    setVal('profUsername', this.currentUser.username || window.supabaseService.extractUsername(this.currentUser.email));
  }

  async handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgEl = document.getElementById('loginMessage');

    if (!username || !password) {
      this.showMsg(msgEl, 'Vui lòng nhập đầy đủ Tài khoản và Mật khẩu (số)!', 'error');
      return;
    }

    if (!/^\d+$/.test(password)) {
      this.showMsg(msgEl, 'Mật khẩu chỉ bao gồm các chữ số (không lấy ký tự chữ)!', 'error');
      return;
    }

    this.showMsg(msgEl, 'Đang đăng nhập...', 'info');

    const { data, error } = await window.supabaseService.signIn(username, password);
    if (error) {
      this.showMsg(msgEl, 'Đăng nhập không thành công: ' + (error.message || 'Sai tài khoản hoặc mật khẩu'), 'error');
      return;
    }

    this.currentUser = await window.supabaseService.getCurrentUser();
    this.updateUserUI();
    this.showMsg(msgEl, 'Đăng nhập thành công!', 'success');

    setTimeout(() => {
      this.closeAuthModal();
      // Tải lại dữ liệu bệnh nhân của bác sĩ
      if (window.patientController) {
        window.patientController.reloadFromSource();
      }
    }, 800);
  }

  async handleRegister() {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value.trim();
    const dept = document.getElementById('regDept').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const msgEl = document.getElementById('registerMessage');

    if (!fullName || !username) {
      this.showMsg(msgEl, 'Vui lòng điền Họ tên và Tài khoản viết tắt của Bác sĩ!', 'error');
      return;
    }

    if (!/^\d{6,}$/.test(password)) {
      this.showMsg(msgEl, 'Mật khẩu phải chỉ gồm các chữ số và tối thiểu 6 số (VD: 123456)!', 'error');
      return;
    }

    this.showMsg(msgEl, 'Đang khởi tạo tài khoản...', 'info');

    const doctorData = {
      full_name: fullName,
      department: dept || 'Khoa Nhiễm',
      phone: phone || '',
      title: 'Bác sĩ điều trị'
    };

    const { data, error } = await window.supabaseService.signUp(username, password, doctorData);
    if (error) {
      if (error.message?.includes('rate limit')) {
        this.showMsg(msgEl, 'Lưu ý: Supabase đang giới hạn gửi email. Vui lòng vào Supabase Dashboard tắt "Confirm email" hoặc đăng nhập tài khoản đã có!', 'error');
      } else if (error.message?.includes('Email signups are disabled') || error.message?.includes('Signups not allowed')) {
        this.showMsg(msgEl, 'Lỗi: Dự án Supabase chưa bật cho phép đăng ký mới. Vui lòng vào Supabase Dashboard > Authentication > Providers > Email: Bật "Allow new users to sign up" và Tắt "Confirm email".', 'error');
      } else {
        this.showMsg(msgEl, 'Đăng ký thất bại: ' + error.message, 'error');
      }
      return;
    }

    this.currentUser = await window.supabaseService.getCurrentUser();
    this.updateUserUI();
    this.showMsg(msgEl, `✓ Tạo tài khoản "${username}" thành công!`, 'success');

    setTimeout(() => {
      this.closeAuthModal();
      if (window.patientController) {
        window.patientController.reloadFromSource();
      }
    }, 1000);
  }

  async handleSaveProfile() {
    const fullName = document.getElementById('profFullName').value.trim();
    const title = document.getElementById('profTitle').value.trim();
    const dept = document.getElementById('profDept').value.trim();
    const hospital = document.getElementById('profHospital').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const msgEl = document.getElementById('profileMessage');

    const updatePayload = {
      full_name: fullName,
      title: title,
      department: dept,
      hospital: hospital,
      phone: phone
    };

    this.showMsg(msgEl, 'Đang lưu hồ sơ...', 'info');
    const { error } = await window.supabaseService.updateProfile(updatePayload);
    if (error) {
      this.showMsg(msgEl, 'Lỗi lưu thông tin: ' + error.message, 'error');
      return;
    }

    this.currentUser = await window.supabaseService.getCurrentUser();
    this.updateUserUI();

    // Cập nhật tên BS ở meta nếu muốn
    const doctorInput = document.getElementById('doctorName');
    if (doctorInput) doctorInput.value = fullName;

    this.showMsg(msgEl, '✓ Đã cập nhật thông tin cá nhân!', 'success');
  }

  async handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất không?')) {
      await window.supabaseService.signOut();
      this.currentUser = null;
      this.updateUserUI();
      this.closeAuthModal();
      if (window.patientController) {
        window.patientController.reloadFromSource();
      }
    }
  }

  openCloudSettingsModal() {
    const modal = document.getElementById('cloudSettingsModal');
    if (!modal) return;

    const conf = window.supabaseService.getConfig();
    const urlInput = document.getElementById('cfgSupabaseUrl');
    const keyInput = document.getElementById('cfgSupabaseKey');

    if (urlInput) urlInput.value = conf.url || '';
    if (keyInput) keyInput.value = conf.key || '';

    modal.classList.add('active');
  }

  closeCloudSettingsModal() {
    const modal = document.getElementById('cloudSettingsModal');
    if (modal) modal.classList.remove('active');
  }

  handleSaveCloudConfig() {
    const url = document.getElementById('cfgSupabaseUrl').value;
    const key = document.getElementById('cfgSupabaseKey').value;
    const msgEl = document.getElementById('cloudConfigMessage');

    const res = window.supabaseService.configure(url, key);
    if (res.success) {
      this.showMsg(msgEl, res.message, 'success');
      setTimeout(() => {
        this.closeCloudSettingsModal();
        if (window.patientController) {
          window.patientController.reloadFromSource();
        }
      }, 1000);
    } else {
      this.showMsg(msgEl, res.message, 'error');
    }
  }

  showMsg(el, text, type) {
    if (!el) return;
    el.innerText = text;
    el.className = `form-message ${type}`;
    el.style.display = 'block';
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

window.authController = new AuthController();
