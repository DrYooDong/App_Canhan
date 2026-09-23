// ==============================================================================
// AUTHENTICATION & DOCTOR WORKSPACE CONTROLLER - MEDWARD PRO
// Quản lý Không Gian Bác Sĩ Riêng, Đăng Nhập, Đăng Ký & Hồ Sơ Bác Sĩ
// ==============================================================================

class AuthController {
  constructor() {
    this.currentUser = null;
    this.activeDoctor = null;
    this.isLoggedIn = false;
    this.knownDoctors = [];
    this.init();
  }

  async init() {
    // 1. Tải danh sách bác sĩ đã lưu & làm sạch để chỉ giữ BS. Nguyễn Hữu Đông
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify([CONFIG.DEFAULT_DEMO_DOCTOR]));
    } catch (e) {}

    await this.loadKnownDoctors();

    // 2. Lấy thông tin user hiện tại (Supabase hoặc Local Storage)
    this.currentUser = await window.supabaseService.getCurrentUser();

    // 3. Khởi tạo trạng thái đăng nhập bắt buộc mỗi khi vào trang web (Session Gate)
    const isUnlocked = sessionStorage.getItem('medward_session_unlocked') === 'true';
    this.isLoggedIn = isUnlocked;
    this.activeDoctor = { ...CONFIG.DEFAULT_DEMO_DOCTOR };
    this.saveActiveDoctor();

    this.updateUserUI();
    this.checkLoginGate();
    this.bindEvents();

    // Lắng nghe thay đổi kết nối Cloud
    window.supabaseService.onStateChange((status) => {
      this.updateCloudStatusUI(status);
    });
  }

  checkLoginGate() {
    const overlay = document.getElementById('loginGateOverlay');
    const pinInput = document.getElementById('gatePinInput');
    const msgEl = document.getElementById('gateLoginMsg');

    if (!this.isLoggedIn) {
      document.body.classList.add('app-locked');
      if (overlay) {
        overlay.style.display = 'flex';
      }
      if (msgEl) {
        msgEl.style.display = 'none';
        msgEl.innerText = '';
      }

      // Khôi phục phương thức mở khóa người dùng chọn lần trước (Mặc định: vẽ hình 9 nút)
      const preferredMode = localStorage.getItem('medward_unlock_mode') || 'pattern';
      this.switchGateMode(preferredMode);

      if (pinInput) {
        pinInput.value = '';
      }
    } else {
      document.body.classList.remove('app-locked');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  switchGateMode(mode) {
    const btnPattern = document.getElementById('btnGateModePattern');
    const btnPin = document.getElementById('btnGateModePin');
    const panelPattern = document.getElementById('gatePatternContainer');
    const panelPin = document.getElementById('gateLoginForm');
    const pinInput = document.getElementById('gatePinInput');

    localStorage.setItem('medward_unlock_mode', mode);

    if (mode === 'pattern') {
      if (btnPattern) btnPattern.classList.add('active');
      if (btnPin) btnPin.classList.remove('active');
      if (panelPattern) panelPattern.style.display = 'block';
      if (panelPin) panelPin.style.display = 'none';
      if (window.patternLock) {
        window.patternLock.setupMainGateLock();
        window.patternLock.reset();
      }
    } else {
      if (btnPattern) btnPattern.classList.remove('active');
      if (btnPin) btnPin.classList.add('active');
      if (panelPattern) panelPattern.style.display = 'none';
      if (panelPin) panelPin.style.display = 'block';
      if (pinInput) {
        setTimeout(() => pinInput.focus(), 100);
      }
    }
  }

  unlockSession() {
    sessionStorage.setItem('medward_session_unlocked', 'true');
    this.isLoggedIn = true;
    this.activeDoctor = { ...CONFIG.DEFAULT_DEMO_DOCTOR };
    this.saveActiveDoctor();
    this.updateUserUI();
    this.checkLoginGate();

    if (window.patientController) {
      window.patientController.updateDoctorFilterDropdown();
      window.patientController.render();
    }

    if (window.showToast) {
      window.showToast('✓ Chào mừng BS. Nguyễn Hữu Đông vào hệ thống điều trị!');
    }
  }

  showGateOverlay() {
    this.isLoggedIn = false;
    this.checkLoginGate();
  }

  togglePinVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btnEl) btnEl.innerText = '🙈';
    } else {
      input.type = 'password';
      if (btnEl) btnEl.innerText = '👁️';
    }
  }

  async handleGateLogin() {
    const pinInput = document.getElementById('gatePinInput');
    const msgEl = document.getElementById('gateLoginMsg');
    const pin = pinInput?.value?.trim() || '';

    if (!pin) {
      this.showMsg(msgEl, 'Vui lòng nhập mã PIN / Mật khẩu số!', 'error');
      if (pinInput) pinInput.focus();
      return;
    }

    if (!/^\d+$/.test(pin)) {
      this.showMsg(msgEl, 'Mật khẩu chỉ bao gồm các chữ số!', 'error');
      if (pinInput) pinInput.focus();
      return;
    }

    const savedPin = localStorage.getItem('medward_doctor_pin') || '123456';
    let isAuthenticated = (pin === '123456' || pin === savedPin);

    // Thử xác thực với Supabase nếu cần
    if (!isAuthenticated) {
      try {
        const { data, error } = await window.supabaseService.signIn('dongnh', pin);
        if (!error && data) isAuthenticated = true;
      } catch (e) {}
    }

    if (!isAuthenticated) {
      this.showMsg(msgEl, 'Mã PIN không chính xác! Vui lòng thử lại (Mặc định: 123456)', 'error');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
      return;
    }

    // Đăng nhập thành công!
    this.unlockSession();
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
    if (!this.activeDoctor) {
      try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE);
      } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE, JSON.stringify(this.activeDoctor));
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

    if (avatarEl) avatarEl.innerText = this.getInitials(doc?.full_name);
    if (nameEl) nameEl.innerText = doc?.full_name || 'BS. Nguyễn Hữu Đông';
    if (roleEl) {
      roleEl.innerText = `BS. Điều trị • ${totalCount} BN`;
    }
  }

  updateUserUI() {
    const doc = this.getActiveDoctor();
    const userBadgeEl = document.getElementById('userProfileBadge');
    const lockBtn = document.getElementById('btnLockBoard');
    const loginBtnHeader = document.getElementById('btnLoginHeader');
    const wsText = document.getElementById('currentWorkspaceText');

    if (this.isLoggedIn && doc) {
      if (userBadgeEl) {
        userBadgeEl.style.display = 'inline-flex';
        const tooltip = `Không gian điều trị: ${doc.full_name} (${doc.department || 'Khoa Nhiễm'})`;
        userBadgeEl.setAttribute('data-tooltip', tooltip);
      }
      if (lockBtn) lockBtn.style.display = 'inline-flex';
      if (loginBtnHeader) loginBtnHeader.style.display = 'none';
      if (wsText) wsText.innerText = doc.full_name;

      const totalCount = window.patientController?.patientList?.length || 0;
      this.updateHeaderPill(totalCount, totalCount);
    } else {
      if (userBadgeEl) userBadgeEl.style.display = 'none';
      if (lockBtn) lockBtn.style.display = 'none';
      if (loginBtnHeader) loginBtnHeader.style.display = 'inline-flex';
      if (wsText) wsText.innerText = 'BS. Nguyễn Hữu Đông (Chưa đăng nhập)';
    }

    if (window.medWardApp?.updatePrintDateNote) {
      window.medWardApp.updatePrintDateNote();
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
    const tabs = ['workspace', 'login', 'profile'];
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
    const container = document.getElementById('workspaceContentArea') || document.getElementById('quickDoctorGrid');
    if (!container) return;

    await this.loadKnownDoctors();

    const dong = (this.knownDoctors && this.knownDoctors[0]) || CONFIG.DEFAULT_DEMO_DOCTOR;
    const patients = window.patientController?.patientList || [];
    const myCount = patients.length;
    const criticalCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pendingCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;

    let html = '';

    if (this.isLoggedIn) {
      // ĐÃ ĐĂNG NHẬP
      html = `
        <div class="doctor-workspace-status-card logged-in" style="background: #ffffff; border: 1.5px solid var(--primary); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);">
          <div class="ws-card-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="quick-doc-avatar" style="width: 46px; height: 46px; font-size: 16px; background: var(--primary);">.Đ</div>
              <div>
                <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${this.escape(dong.full_name)}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  ${this.escape(dong.title || 'Bác sĩ điều trị')} • ${this.escape(dong.department || 'Khoa Nhiễm')}
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  Tài khoản: <strong>${this.escape(dong.username || 'dongnh')}</strong> (${this.escape(dong.email || 'nguyenhuudongy18@gmail.com')})
                </div>
              </div>
            </div>
            <span class="quick-doc-badge" style="background: #10b981; color: #ffffff; border: none; font-size: 11px; padding: 4px 10px; border-radius: 14px; font-weight: 700;">
              ✓ Đã đăng nhập
            </span>
          </div>

          <div class="ws-stats-row" style="display: flex; gap: 8px; margin: 12px 0;">
            <div style="flex: 1; padding: 10px; background: var(--bg-subtle); border-radius: 8px; border: 1px solid var(--border); text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${myCount}</div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Tổng số người bệnh</div>
            </div>
            <div style="flex: 1; padding: 10px; background: rgba(239, 68, 68, 0.08); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: var(--danger);">${criticalCount}</div>
              <div style="font-size: 11px; color: var(--danger); font-weight: 600;">🚨 Báo động đỏ</div>
            </div>
            <div style="flex: 1; padding: 10px; background: rgba(245, 158, 11, 0.08); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #b45309;">${pendingCount}</div>
              <div style="font-size: 11px; color: #b45309; font-weight: 600;">⏳ Cần theo dõi</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
            <button type="button" class="btn btn-primary" onclick="window.authController.enterMyWorkspace()" style="width: 100%; justify-content: center; height: 38px; font-weight: 700;">
              🩺 Mở Bảng Điều Trị Riêng Của Tôi
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary" onclick="window.authController.switchAuthTab('profile')" style="flex: 1; justify-content: center; font-size: 12.5px;">
                👤 Hồ Sơ &amp; Đổi PIN
              </button>
              <button type="button" class="btn btn-secondary" onclick="window.authController.handleLogout()" style="flex: 1; justify-content: center; color: var(--danger); border-color: rgba(239, 68, 68, 0.3); font-size: 12.5px; font-weight: 700;">
                🔒 Khóa Bảng &amp; Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // CHƯA ĐĂNG NHẬP -> BẮT BUỘC ĐĂNG NHẬP MỚI VÀO ĐƯỢC
      html = `
        <div class="doctor-workspace-status-card not-logged-in" style="background: #ffffff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 12px;">
          <div class="ws-card-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="quick-doc-avatar" style="width: 44px; height: 44px; font-size: 15px; background: var(--primary);">HĐ</div>
              <div>
                <div style="font-size: 14px; font-weight: 800; color: var(--text-main);">${this.escape(dong.full_name)}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${this.escape(dong.title || 'Bác sĩ điều trị')} • Khoa Nhiễm</div>
              </div>
            </div>
            <span class="quick-doc-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border-color: rgba(239, 68, 68, 0.2); font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 14px;">
              🔒 Cần đăng nhập
            </span>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 3px;">
              🔐 Xác thực tài khoản Bác sĩ
            </div>
            <div style="font-size: 12px; color: var(--text-main); line-height: 1.4;">
              Muốn vào bảng theo dõi người bệnh của <strong>BS. Nguyễn Hữu Đông</strong>, vui lòng nhập mật khẩu số (PIN):
            </div>
          </div>

          <div id="wsLoginMsg" class="form-message" style="display: none;"></div>

          <form id="wsQuickLoginForm" onsubmit="event.preventDefault(); window.authController.handleQuickLoginSubmit();">
            <div class="form-group" style="margin-bottom: 10px;">
              <label style="font-size: 12px; font-weight: 600;">Tài khoản Bác sĩ:</label>
              <input type="text" id="wsQuickUser" class="form-control" value="dongnh" readonly style="background: var(--bg-subtle); font-weight: 700; color: var(--primary);">
              <small style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px;">Email: nguyenhuudongy18@gmail.com</small>
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 600;">Mật khẩu số (Mặc định: 123456):</label>
              <input type="password" id="wsQuickPass" class="form-control" placeholder="Nhập các chữ số (VD: 123456)" pattern="[0-9]*" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,'')" autofocus required>
              <small style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 3px;">* Mật khẩu chỉ bao gồm các chữ số</small>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; height: 38px; font-weight: 700;">
              🔑 Đăng Nhập &amp; Mở Bảng Điều Trị
            </button>
          </form>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  async handleQuickLoginSubmit() {
    const user = document.getElementById('wsQuickUser')?.value || 'dongnh';
    const pass = document.getElementById('wsQuickPass')?.value || '';
    const msgEl = document.getElementById('wsLoginMsg');
    await this.processLogin(user, pass, msgEl);
  }

  enterMyWorkspace() {
    this.closeAuthModal();
    if (window.patientController) {
      window.patientController.handleDoctorFilterChange('my_patients');
      window.patientController.updateDoctorFilterDropdown();
      window.patientController.render();
    }
  }

  switchDoctorWorkspace(doctorNameOrId) {
    if (!this.isLoggedIn) {
      this.showGateOverlay();
      return;
    }

    // Đã đăng nhập: Mở bảng riêng
    this.enterMyWorkspace();
  }

  viewAllWard() {
    this.enterMyWorkspace();
  }

  fillProfileForm() {
    const doc = this.getActiveDoctor();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('profFullName', doc.full_name || 'BS. Nguyễn Hữu Đông');
    setVal('profTitle', doc.title || 'Bác sĩ điều trị');
    setVal('profTitleSelect', doc.title || 'Bác sĩ điều trị');
    setVal('profDept', doc.department || 'Khoa Nhiễm');
    setVal('profHospital', doc.hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức');
    setVal('profPhone', doc.phone || '0988.765.432');
    setVal('profUsername', doc.username || 'dongnh');
  }

  async handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim() || 'dongnh';
    const password = document.getElementById('loginPassword')?.value.trim() || '';
    const msgEl = document.getElementById('loginMessage');
    await this.processLogin(username, password, msgEl);
  }

  async processLogin(username, password, msgEl) {
    if (!password) {
      this.showMsg(msgEl, 'Vui lòng nhập mật khẩu số của BS. Đông!', 'error');
      return;
    }

    if (!/^\d+$/.test(password)) {
      this.showMsg(msgEl, 'Mật khẩu chỉ bao gồm các chữ số!', 'error');
      return;
    }

    this.showMsg(msgEl, 'Đang xác thực tài khoản BS. Nguyễn Hữu Đông...', 'info');

    const dong = { ...(CONFIG.DEFAULT_DEMO_DOCTOR || CONFIG.DEFAULT_DOCTORS[0]) };
    let isAuthenticated = false;

    // 1. Thử xác thực với Supabase Cloud nếu có kết nối
    try {
      const { data, error } = await window.supabaseService.signIn(username || 'dongnh', password);
      if (!error && data) {
        isAuthenticated = true;
      }
    } catch (e) {}

    // 2. Xác thực với mật khẩu cục bộ (123456 hoặc PIN đã lưu)
    const savedPin = localStorage.getItem('medward_doctor_pin') || '123456';
    if (password === '123456' || password === savedPin) {
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
      this.showMsg(msgEl, 'Mật khẩu không chính xác! Vui lòng nhập lại (Mặc định: 123456)', 'error');
      return;
    }

    // Xác thực thành công!
    this.isLoggedIn = true;
    this.activeDoctor = { ...dong };
    this.saveActiveDoctor();
    this.updateUserUI();

    this.showMsg(msgEl, `✓ Đăng nhập thành công! Đang chuyển vào Không gian BS. Nguyễn Hữu Đông...`, 'success');

    setTimeout(() => {
      this.closeAuthModal();
      if (window.patientController) {
        window.patientController.handleDoctorFilterChange('my_patients');
        window.patientController.updateDoctorFilterDropdown();
        window.patientController.render();
      }
      if (window.showToast) {
        window.showToast(`🩺 Đã đăng nhập Không gian Bác sĩ: BS. Nguyễn Hữu Đông`);
      }
    }, 600);
  }

  async handleSaveProfile() {
    const fullName = document.getElementById('profFullName')?.value?.trim() || 'BS. Nguyễn Hữu Đông';
    const title = document.getElementById('profTitle')?.value?.trim() || document.getElementById('profTitleSelect')?.value || 'Bác sĩ điều trị';
    const dept = document.getElementById('profDept')?.value?.trim() || 'Khoa Nhiễm';
    const hospital = document.getElementById('profHospital')?.value?.trim() || 'Bệnh viện Đa khoa Khu vực Thủ Đức';
    const phone = document.getElementById('profPhone')?.value?.trim() || '';
    const pin = document.getElementById('profPin')?.value?.trim();
    const msgEl = document.getElementById('profileMessage');

    if (pin) {
      if (!/^\d+$/.test(pin)) {
        this.showMsg(msgEl, 'Mật khẩu số (PIN) chỉ được bao gồm các chữ số!', 'error');
        return;
      }
      try {
        localStorage.setItem('medward_doctor_pin', pin);
      } catch (e) {}
    }

    const updatePayload = {
      full_name: fullName,
      title: title,
      department: dept,
      hospital: hospital,
      phone: phone
    };

    this.showMsg(msgEl, 'Đang cập nhật hồ sơ Bác sĩ...', 'info');

    // Lưu vào active doctor
    this.activeDoctor = { ...this.activeDoctor, ...updatePayload };
    this.saveActiveDoctor();

    this.knownDoctors = [{ ...CONFIG.DEFAULT_DEMO_DOCTOR, ...this.activeDoctor }];
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
    if (confirm('Khóa bảng theo dõi và đăng xuất khỏi ca trực?')) {
      try {
        await window.supabaseService.signOut();
      } catch (e) {}
      sessionStorage.removeItem('medward_session_unlocked');
      this.isLoggedIn = false;
      this.closeAuthModal();
      this.updateUserUI();
      this.checkLoginGate();
      if (window.patientController) {
        window.patientController.render();
      }
      if (window.showToast) {
        window.showToast('🔒 Đã khóa bảng theo dõi & đăng xuất');
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
