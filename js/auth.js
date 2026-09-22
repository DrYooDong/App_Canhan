// ==============================================================================
// AUTHENTICATION & DOCTOR WORKSPACE CONTROLLER - MEDWARD PRO
// Quản lý Không Gian Bác Sĩ Riêng, Đăng Nhập, Đăng Ký & Hồ Sơ Bác Sĩ
// ==============================================================================

class AuthController {
  constructor() {
    this.currentUser = null;
    this.activeDoctor = null;
    this.knownDoctors = [];
    this.init();
  }

  async init() {
    // 1. Tải danh sách bác sĩ đã lưu
    await this.loadKnownDoctors();

    // 2. Lấy thông tin user hiện tại (Supabase hoặc Local Storage)
    this.currentUser = await window.supabaseService.getCurrentUser();

    // 3. Khởi tạo không gian bác sĩ đang kích hoạt
    const savedActiveDocStr = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE);
    if (savedActiveDocStr) {
      try {
        this.activeDoctor = JSON.parse(savedActiveDocStr);
      } catch (e) {}
    }

    if (!this.activeDoctor) {
      if (this.currentUser) {
        this.activeDoctor = { ...this.currentUser };
      } else {
        this.activeDoctor = { ...(CONFIG.DEFAULT_DEMO_DOCTOR || CONFIG.DEFAULT_DOCTORS[0]) };
      }
    }

    this.saveActiveDoctor();
    this.updateUserUI();
    this.bindEvents();

    // Lắng nghe thay đổi kết nối Cloud
    window.supabaseService.onStateChange((status) => {
      this.updateCloudStatusUI(status);
    });
  }

  async loadKnownDoctors() {
    this.knownDoctors = await window.supabaseService.fetchDepartmentDoctors();
    return this.knownDoctors;
  }

  getActiveDoctor() {
    if (!this.activeDoctor) {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE);
      if (saved) {
        try { this.activeDoctor = JSON.parse(saved); } catch (e) {}
      }
      if (!this.activeDoctor) {
        this.activeDoctor = { ...(CONFIG.DEFAULT_DEMO_DOCTOR || CONFIG.DEFAULT_DOCTORS[0]) };
      }
    }
    return this.activeDoctor;
  }

  saveActiveDoctor() {
    if (!this.activeDoctor) return;
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE, JSON.stringify(this.activeDoctor));
      // Đồng bộ vào AUTH_USER nếu cần
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(this.activeDoctor));
    } catch (e) {}
  }

  getInitials(name) {
    if (!name) return 'BS';
    const clean = name.replace(/\b(bs|bs\.|cki|ckii|ths|ts|pgs|gs)\b/gi, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'BS';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  updateHeaderPill(myPatientsCount = 0, totalCount = 0) {
    const doc = this.getActiveDoctor();
    const avatarEl = document.getElementById('headerDocAvatar');
    const nameEl = document.getElementById('headerDocName');
    const roleEl = document.getElementById('headerDocRole');

    if (avatarEl) avatarEl.innerText = this.getInitials(doc.full_name);
    if (nameEl) nameEl.innerText = doc.full_name || 'Bác sĩ điều trị';
    if (roleEl) {
      const isFilteringMine = window.patientController?.currentDoctorFilter === 'my_patients';
      if (isFilteringMine) {
        roleEl.innerText = `Không gian riêng • ${myPatientsCount} BN`;
      } else if (window.patientController?.currentDoctorFilter === 'all') {
        roleEl.innerText = `Toàn khoa • ${totalCount} BN`;
      } else {
        roleEl.innerText = `Bác sĩ: ${window.patientController?.currentDoctorFilter}`;
      }
    }
  }

  updateUserUI() {
    const doc = this.getActiveDoctor();
    const doctorInput = document.getElementById('doctorName');
    const userBadgeEl = document.getElementById('userProfileBadge');

    if (doctorInput) {
      doctorInput.value = doc.full_name || '';
    }

    if (userBadgeEl) {
      const tooltip = `Không gian: ${doc.full_name} (${doc.department || 'Khoa Nhiễm'})`;
      userBadgeEl.setAttribute('data-tooltip', tooltip);
    }

    // Cập nhật header pill
    const countMy = window.patientController?.patientList?.filter(p => {
      const d = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
      const myName = (doc.full_name || '').trim().toLowerCase();
      return myName && (d.includes(myName) || myName.includes(d));
    }).length || 0;

    this.updateHeaderPill(countMy, window.patientController?.patientList?.length || 0);
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
      authBtn.addEventListener('click', () => this.openAuthModal('workspace'));
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

  suggestUsername(val) {
    const userInput = document.getElementById('regUsername');
    if (userInput && (!userInput.dataset.manuallyEdited || !userInput.value)) {
      userInput.value = this.generateDoctorUsername(val);
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

  openAuthModal(defaultTab = 'workspace') {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    this.switchAuthTab(defaultTab);
    modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tabName) {
    const tabs = ['workspace', 'profile', 'login', 'register'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tabBtn_${t}`);
      const content = document.getElementById(`tabContent_${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (content) {
        content.classList.toggle('active', t === tabName);
        content.style.display = (t === tabName) ? 'block' : 'none';
      }
    });

    if (tabName === 'workspace') {
      this.renderWorkspaceTab();
    } else if (tabName === 'profile') {
      this.fillProfileForm();
    }
  }

  async renderWorkspaceTab() {
    const doc = this.getActiveDoctor();

    // 1. Cập nhật hero card
    const heroAvatar = document.getElementById('heroDocAvatar');
    const heroName = document.getElementById('heroDocName');
    const heroDept = document.getElementById('heroDocDept');
    const heroHospital = document.getElementById('heroDocHospital');

    if (heroAvatar) heroAvatar.innerText = this.getInitials(doc.full_name);
    if (heroName) heroName.innerText = doc.full_name || 'Bác sĩ điều trị';
    if (heroDept) heroDept.innerText = `${doc.title || 'Bác sĩ điều trị'} • ${doc.department || 'Khoa Nhiễm'}`;
    if (heroHospital) heroHospital.innerText = doc.hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức';

    // 2. Thống kê số lượng
    const patients = window.patientController?.patientList || [];
    const myDocName = (doc.full_name || '').trim().toLowerCase();
    const myDocId = doc.id || '';

    const myPatients = patients.filter(p => {
      const pDoc = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
      const pUserId = p.user_id || '';
      const matchId = myDocId && pUserId && pUserId === myDocId;
      const matchName = myDocName && (pDoc.includes(myDocName) || myDocName.includes(pDoc));
      return matchId || matchName;
    });

    const myCritical = myPatients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;

    const wsPatientCount = document.getElementById('wsPatientCount');
    const wsCriticalCount = document.getElementById('wsCriticalCount');
    const wsTotalWardCount = document.getElementById('wsTotalWardCount');

    if (wsPatientCount) wsPatientCount.innerText = myPatients.length;
    if (wsCriticalCount) wsCriticalCount.innerText = myCritical;
    if (wsTotalWardCount) wsTotalWardCount.innerText = patients.length;

    // 3. Render danh sách chuyển nhanh không gian Bác sĩ
    const listContainer = document.getElementById('doctorWorkspacesList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px;">Đang tải danh sách Bác sĩ...</div>';

    await this.loadKnownDoctors();

    // Thu thập thêm các bác sĩ từ danh sách bệnh nhân
    const allDoctorsMap = new Map();

    this.knownDoctors.forEach(d => {
      allDoctorsMap.set(d.full_name.toLowerCase(), d);
    });

    patients.forEach(p => {
      const pDoc = (p.doctor_name || p.handover_by || '').trim();
      if (pDoc && !allDoctorsMap.has(pDoc.toLowerCase())) {
        allDoctorsMap.set(pDoc.toLowerCase(), {
          id: 'doc_' + pDoc.toLowerCase().replace(/[^a-z0-9]/g, ''),
          full_name: pDoc,
          title: 'Bác sĩ điều trị',
          department: 'Khoa Nhiễm',
          hospital: 'BV ĐKKV Thủ Đức'
        });
      }
    });

    const doctorsArray = Array.from(allDoctorsMap.values());

    let listHtml = '';
    doctorsArray.forEach(d => {
      const isActive = d.full_name.toLowerCase() === doc.full_name.toLowerCase();
      const initials = this.getInitials(d.full_name);
      const count = patients.filter(p => {
        const pd = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
        return pd.includes(d.full_name.toLowerCase()) || d.full_name.toLowerCase().includes(pd);
      }).length;

      listHtml += `
        <div class="doctor-workspace-item ${isActive ? 'active' : ''}">
          <div class="doc-item-left">
            <div class="doc-item-avatar">${initials}</div>
            <div class="doc-item-info">
              <span class="doc-item-name">${this.escape(d.full_name)}</span>
              <span class="doc-item-title">${this.escape(d.title || 'Bác sĩ điều trị')} • ${this.escape(d.department || 'Khoa')}</span>
            </div>
          </div>
          <div class="doc-item-right">
            <span class="doc-item-count" title="Số người bệnh đang phụ trách">${count} BN</span>
            ${isActive ? `
              <span class="btn-switch-workspace" style="background: #e2e8f0; border-color: #cbd5e1; color: var(--text-muted); cursor: default;">
                ✓ Đang kích hoạt
              </span>
            ` : `
              <button type="button" class="btn-switch-workspace" onclick="window.authController.switchDoctorWorkspace('${this.escape(d.full_name)}')">
                Vào không gian
              </button>
            `}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = listHtml;
  }

  switchDoctorWorkspace(doctorNameOrId) {
    if (!doctorNameOrId) return;

    // Tìm trong knownDoctors hoặc tạo mới
    let target = this.knownDoctors.find(d => 
      d.full_name.toLowerCase() === doctorNameOrId.toLowerCase() || 
      d.id === doctorNameOrId || 
      d.username === doctorNameOrId
    );

    if (!target) {
      target = {
        id: 'doc_' + Date.now(),
        full_name: doctorNameOrId,
        title: 'Bác sĩ điều trị',
        department: 'Khoa Nhiễm',
        hospital: 'BV ĐKKV Thủ Đức'
      };
      this.knownDoctors.push(target);
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(this.knownDoctors));
      } catch (e) {}
    }

    this.activeDoctor = { ...target };
    this.saveActiveDoctor();
    this.updateUserUI();

    // Chuyển bộ lọc bệnh nhân sang Bác sĩ này
    if (window.patientController) {
      window.patientController.handleDoctorFilterChange('my_patients');
      window.patientController.updateDoctorFilterDropdown();
    }

    this.closeAuthModal();

    if (window.showToast) {
      window.showToast(`🩺 Đã chuyển sang Không gian Bác sĩ: ${this.activeDoctor.full_name}`);
    }
  }

  viewAllWard() {
    if (window.patientController) {
      window.patientController.handleDoctorFilterChange('all');
      window.patientController.updateDoctorFilterDropdown();
    }
    this.closeAuthModal();
    if (window.showToast) {
      window.showToast('🏥 Đang hiển thị Bảng theo dõi Toàn khoa (Tất cả Bác sĩ)');
    }
  }

  fillProfileForm() {
    const doc = this.getActiveDoctor();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('profFullName', doc.full_name);
    setVal('profTitle', doc.title || 'Bác sĩ điều trị');
    setVal('profTitleSelect', doc.title || 'Bác sĩ điều trị');
    setVal('profDept', doc.department || 'Khoa Nhiễm');
    setVal('profHospital', doc.hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức');
    setVal('profPhone', doc.phone || '');
    setVal('profUsername', doc.username || this.generateDoctorUsername(doc.full_name));
  }

  async quickLogin(username, password) {
    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    await this.handleLogin();
  }

  async handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgEl = document.getElementById('loginMessage');

    if (!username || !password) {
      this.showMsg(msgEl, 'Vui lòng nhập đầy đủ Tài khoản Bác sĩ và Mật khẩu số!', 'error');
      return;
    }

    if (!/^\d+$/.test(password)) {
      this.showMsg(msgEl, 'Mật khẩu chỉ bao gồm các chữ số!', 'error');
      return;
    }

    this.showMsg(msgEl, 'Đang xác thực & mở không gian Bác sĩ...', 'info');

    const { data, error } = await window.supabaseService.signIn(username, password);
    if (error) {
      this.showMsg(msgEl, 'Đăng nhập không thành công: ' + (error.message || 'Sai tài khoản hoặc mật khẩu'), 'error');
      return;
    }

    this.currentUser = await window.supabaseService.getCurrentUser();
    
    // Tìm hoặc thêm vào knownDoctors
    let target = this.knownDoctors.find(d => 
      (d.username && d.username.toLowerCase() === username.toLowerCase()) ||
      (this.currentUser.full_name && d.full_name.toLowerCase() === this.currentUser.full_name.toLowerCase())
    );

    if (target) {
      this.activeDoctor = { ...target, ...this.currentUser };
    } else {
      this.activeDoctor = { ...this.currentUser };
      this.knownDoctors.push(this.activeDoctor);
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(this.knownDoctors));
      } catch (e) {}
    }

    this.saveActiveDoctor();
    this.updateUserUI();

    this.showMsg(msgEl, `✓ Đăng nhập thành công! Đang chuyển vào Không gian Bác sĩ ${this.activeDoctor.full_name}...`, 'success');

    setTimeout(() => {
      this.closeAuthModal();
      if (window.patientController) {
        window.patientController.handleDoctorFilterChange('my_patients');
        window.patientController.reloadFromSource();
      }
    }, 700);
  }

  async handleRegister() {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value.trim();
    const title = document.getElementById('regTitle')?.value || 'Bác sĩ điều trị';
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

    this.showMsg(msgEl, 'Đang khởi tạo Không Gian Bác Sĩ...', 'info');

    const doctorData = {
      full_name: fullName,
      username: username,
      title: title,
      department: dept || 'Khoa Nhiễm',
      hospital: 'Bệnh viện Đa khoa Khu vực Thủ Đức',
      phone: phone || ''
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

    this.currentUser = await window.supabaseService.getCurrentUser() || doctorData;
    this.activeDoctor = { ...doctorData, id: this.currentUser?.id || ('doc_' + Date.now()) };

    // Thêm vào knownDoctors
    this.knownDoctors.push(this.activeDoctor);
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(this.knownDoctors));
    } catch (e) {}

    this.saveActiveDoctor();
    this.updateUserUI();

    this.showMsg(msgEl, `✓ Đã tạo Không Gian Bác Sĩ "${fullName}" thành công!`, 'success');

    setTimeout(() => {
      this.closeAuthModal();
      if (window.patientController) {
        window.patientController.handleDoctorFilterChange('my_patients');
        window.patientController.updateDoctorFilterDropdown();
        window.patientController.reloadFromSource();
      }
    }, 900);
  }

  async handleSaveProfile() {
    const fullName = document.getElementById('profFullName').value.trim();
    const title = document.getElementById('profTitle').value.trim() || document.getElementById('profTitleSelect')?.value || 'Bác sĩ điều trị';
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

    this.showMsg(msgEl, 'Đang cập nhật hồ sơ & không gian Bác sĩ...', 'info');

    // Lưu vào active doctor
    this.activeDoctor = { ...this.activeDoctor, ...updatePayload };
    this.saveActiveDoctor();

    // Cập nhật trong knownDoctors
    const idx = this.knownDoctors.findIndex(d => 
      d.id === this.activeDoctor.id || 
      (d.username && d.username === this.activeDoctor.username)
    );
    if (idx >= 0) {
      this.knownDoctors[idx] = { ...this.knownDoctors[idx], ...updatePayload };
    } else {
      this.knownDoctors.push(this.activeDoctor);
    }
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(this.knownDoctors));
    } catch (e) {}

    if (window.supabaseService?.isCloudEnabled) {
      await window.supabaseService.updateProfile(updatePayload);
    }

    this.updateUserUI();

    if (window.patientController) {
      window.patientController.handleDoctorFilterChange('my_patients');
      window.patientController.updateDoctorFilterDropdown();
    }

    this.showMsg(msgEl, '✓ Đã cập nhật Không Gian Bác Sĩ thành công!', 'success');
  }

  async handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất khỏi tài khoản Bác sĩ hiện tại?')) {
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
