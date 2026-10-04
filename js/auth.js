// ==============================================================================
// AUTHENTICATION, MULTI-DOCTOR RBAC & WORKSPACE CONTROLLER - MEDWARD PRO
// Quản lý Mở Khóa, Đăng Nhập, Đăng Ký & Phân Quyền (BS. Đông Toàn Quyền)
// ==============================================================================

class AuthController {
  constructor() {
    this.currentUser = null;
    this.activeDoctor = null;
    this.isLoggedIn = false;
    this.knownDoctors = [];
    this.currentGateView = 'unlock'; // 'unlock' | 'login' | 'register'
    this.activePinField = 'changePinNew';
    this.isTouchNumpadVisible = true;
    this.init();
  }

  async init() {
    // 1. Tải danh sách bác sĩ từ LocalStorage hoặc Supabase
    await this.loadKnownDoctors();

    // 2. Lấy thông tin user hiện tại (Supabase hoặc Local Storage)
    this.currentUser = await window.supabaseService?.getCurrentUser?.();

    // 3. Khởi tạo phiên làm việc
    const isUnlocked = sessionStorage.getItem('medward_session_unlocked') === 'true';
    this.isLoggedIn = isUnlocked;

    // Lấy bác sĩ đang chọn hoặc mặc định là BS. Đông
    this.activeDoctor = this.getActiveDoctor();
    this.saveActiveDoctor();

    this.updateUserUI();
    this.checkLoginGate();
    this.bindEvents();

    // Lắng nghe thay đổi kết nối Cloud
    if (window.supabaseService?.onStateChange) {
      window.supabaseService.onStateChange((status) => {
        this.updateCloudStatusUI(status);
      });
    }
  }

  // ============================================================================
  // RBAC: KIỂM TRA QUYỀN QUẢN TRỊ VIÊN CỦA BS. NGUYỄN HỮU ĐÔNG
  // Chỉ riêng BS. Đông có quyền chỉnh sửa hoặc loại bỏ các hồ sơ bác sĩ khác
  // ============================================================================
  isDongAdmin(doc = null) {
    const target = doc || this.getActiveDoctor();
    if (!target) return false;
    const username = (target.username || '').toLowerCase().trim();
    const email = (target.email || '').toLowerCase().trim();
    const id = (target.id || '').toLowerCase().trim();
    const fullName = (target.full_name || '').toLowerCase().trim();

    return username === 'dongnh' ||
           id === 'doc_dongnh' ||
           email === 'nguyenhuudongy18@gmail.com' ||
           fullName.includes('nguyễn hữu đông') ||
           fullName.includes('nguyen huu dong');
  }

  // ============================================================================
  // QUẢN LÝ DANH SÁCH BÁC SĨ (PERSISTENCE)
  // ============================================================================
  async loadKnownDoctors() {
    let list = [];
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES);
      if (saved) {
        list = JSON.parse(saved);
      }
    } catch (e) {}

    // Luôn đảm bảo BS. Nguyễn Hữu Đông tồn tại trong hệ thống
    const dongExists = list.some(d => this.isDongAdmin(d));
    if (!dongExists) {
      list.unshift({ ...CONFIG.DEFAULT_DEMO_DOCTOR });
    }

    this.knownDoctors = list;
    this.saveKnownDoctors();

    // Đồng bộ thêm danh sách bác sĩ từ Supabase Cloud profiles nếu có mạng
    if (window.supabaseService && window.supabaseService.isCloudEnabled) {
      window.supabaseService.fetchDepartmentDoctors().then(cloudDocs => {
        if (cloudDocs && cloudDocs.length > 0) {
          this.knownDoctors = cloudDocs;
          this.saveKnownDoctors();
          if (window.patientController?.updateDoctorFilterDropdown) {
            window.patientController.updateDoctorFilterDropdown();
          }
        }
      }).catch(() => {});
    }

    return this.knownDoctors;
  }

  saveKnownDoctors() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOCTOR_WORKSPACES, JSON.stringify(this.knownDoctors));
    } catch (e) {}
  }

  getKnownDoctors() {
    if (!this.knownDoctors || this.knownDoctors.length === 0) {
      return [{ ...CONFIG.DEFAULT_DEMO_DOCTOR }];
    }
    return this.knownDoctors;
  }

  getActiveDoctor() {
    if (!this.activeDoctor) {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE);
      if (saved) {
        try { this.activeDoctor = JSON.parse(saved); } catch (e) {}
      }
      if (!this.activeDoctor) {
        this.activeDoctor = { ...CONFIG.DEFAULT_DEMO_DOCTOR };
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

  // ============================================================================
  // MÀN HÌNH MỞ KHÓA / ĐĂNG NHẬP / ĐĂNG KÝ (GATE CONTROLLER)
  // ============================================================================
  checkLoginGate() {
    const overlay = document.getElementById('loginGateOverlay');
    if (!this.isLoggedIn) {
      document.body.classList.add('app-locked');
      if (overlay) {
        overlay.style.display = 'flex';
      }
      this.showGateView('unlock');
    } else {
      document.body.classList.remove('app-locked');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  // ============================================================================
  // NHẬN DIỆN THIẾT BỊ: WEB LAPTOP (MÃ PIN) VS DI ĐỘNG / MÁY TÍNH BẢNG (9 NÚT)
  // ============================================================================
  isMobileOrTablet() {
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const isIPadOS = (navigator.platform === 'MacIntel' || ua.includes('Macintosh')) && navigator.maxTouchPoints > 1;
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 1024;
    return isMobileUA || isIPadOS || (hasTouch && isSmallScreen);
  }

  getDeviceUnlockMode() {
    // Yêu cầu: Web laptop là nhập mã PIN ('pin'), Di động hoặc máy tính bảng là mở khóa 9 nút ('pattern')
    return this.isMobileOrTablet() ? 'pattern' : 'pin';
  }

  showGateView(viewName) {
    this.currentGateView = viewName;
    const vUnlock = document.getElementById('gateViewUnlock');
    const vLogin = document.getElementById('gateViewLogin');
    const vRegister = document.getElementById('gateViewRegister');

    if (vUnlock) vUnlock.style.display = (viewName === 'unlock') ? 'block' : 'none';
    if (vLogin) vLogin.style.display = (viewName === 'login') ? 'block' : 'none';
    if (vRegister) vRegister.style.display = (viewName === 'register') ? 'block' : 'none';

    if (viewName === 'unlock') {
      this.updateGateDoctorPreview();
      // Tự động chọn phương thức theo thiết bị:
      // Web laptop: Nhập mã PIN
      // Di động hoặc máy tính bảng: Mở khóa vẽ hình 9 nút
      const targetMode = this.getDeviceUnlockMode();
      this.switchGateMode(targetMode);
    } else if (viewName === 'login') {
      this.renderGateDoctorChips();
      const userInp = document.getElementById('gateOtherUser');
      if (userInp) {
        userInp.value = '';
        setTimeout(() => userInp.focus(), 100);
      }
    } else if (viewName === 'register') {
      const regForm = document.getElementById('gateRegisterForm');
      if (regForm) regForm.reset();
      const regDept = document.getElementById('regDept');
      const regTitle = document.getElementById('regTitle');
      if (regDept) regDept.value = 'Khoa Nhiễm';
      if (regTitle) regTitle.value = 'Bác sĩ điều trị';
      const nameInp = document.getElementById('regFullName');
      if (nameInp) setTimeout(() => nameInp.focus(), 100);
    }
  }

  updateGateDoctorPreview() {
    const doc = this.getActiveDoctor();
    const avatarEl = document.getElementById('gateDocAvatar');
    const nameEl = document.getElementById('gateDocName');
    const roleEl = document.getElementById('gateDocRole');
    const userEl = document.getElementById('gateDocUsername');
    const emailEl = document.getElementById('gateDocEmail');

    if (avatarEl) avatarEl.innerText = this.getInitials(doc?.full_name);
    if (nameEl) nameEl.innerText = doc?.full_name || 'BS. Nguyễn Hữu Đông';
    if (roleEl) roleEl.innerText = `${doc?.title || 'Bác sĩ điều trị'} • ${doc?.department || 'Khoa Nhiễm'}`;
    if (userEl) userEl.innerText = doc?.username || 'dongnh';
    if (emailEl) emailEl.innerText = doc?.email ? `(${doc.email})` : '';
  }

  renderGateDoctorChips() {
    const container = document.getElementById('gateDocChips');
    if (!container) return;
    container.innerHTML = '';

    const docs = this.getKnownDoctors();
    docs.forEach(doc => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gate-doc-chip';
      chip.innerHTML = `
        <span class="gate-doc-chip-avatar">${this.getInitials(doc.full_name)}</span>
        <span>${this.escape(doc.full_name)}</span>
      `;
      chip.onclick = () => {
        const userInput = document.getElementById('gateOtherUser');
        const passInput = document.getElementById('gateOtherPass');
        if (userInput) userInput.value = doc.username || doc.email;
        if (passInput) passInput.focus();
      };
      container.appendChild(chip);
    });
  }

  switchGateMode(mode) {
    const btnPattern = document.getElementById('btnGateModePattern');
    const btnPin = document.getElementById('btnGateModePin');
    const panelPattern = document.getElementById('gatePatternContainer');
    const panelPin = document.getElementById('gateLoginForm');
    const pinInput = document.getElementById('gatePinInput');

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
        setTimeout(() => {
          pinInput.focus();
          pinInput.select();
        }, 120);
      }
    }
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

  // Mở khóa cho Bác sĩ hiện tại qua mã PIN
  async handleGateLogin() {
    const pinInput = document.getElementById('gatePinInput');
    const msgEl = document.getElementById('gateLoginMsg');
    const pin = pinInput?.value?.trim() || '';

    if (!pin) {
      this.showMsg(msgEl, 'Vui lòng nhập mã PIN!', 'error');
      if (pinInput) pinInput.focus();
      return;
    }

    const doc = this.getActiveDoctor();
    const docPin = doc.pin || localStorage.getItem('medward_doctor_pin') || '123456';

    const isMatch = (docPin && docPin !== '123456') ? (pin === docPin) : (pin === '123456');

    if (isMatch) {
      this.unlockSession(doc);
    } else {
      this.showMsg(msgEl, `Mã PIN không chính xác!${docPin === '123456' ? ' (Mặc định: 123456)' : ''}`, 'error');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  // Đăng nhập một tài khoản Bác sĩ khác
  async handleGateOtherLogin() {
    const userInput = document.getElementById('gateOtherUser');
    const passInput = document.getElementById('gateOtherPass');
    const msgEl = document.getElementById('gateOtherLoginMsg');

    const username = (userInput?.value || '').trim().toLowerCase();
    const pin = (passInput?.value || '').trim();

    if (!username) {
      this.showMsg(msgEl, 'Vui lòng nhập tên đăng nhập hoặc Email!', 'error');
      if (userInput) userInput.focus();
      return;
    }

    if (!pin) {
      this.showMsg(msgEl, 'Vui lòng nhập mật khẩu số (PIN)!', 'error');
      if (passInput) passInput.focus();
      return;
    }

    const docs = this.getKnownDoctors();
    const targetDoc = docs.find(d =>
      (d.username && d.username.toLowerCase() === username) ||
      (d.email && d.email.toLowerCase() === username)
    );

    if (!targetDoc) {
      this.showMsg(msgEl, `Không tìm thấy tài khoản Bác sĩ "${username}". Vui lòng đăng ký mới nếu chưa có tài khoản!`, 'error');
      return;
    }

    const expectedPin = targetDoc.pin || '123456';
    const isMatch = (expectedPin && expectedPin !== '123456') ? (pin === expectedPin) : (pin === '123456');

    if (!isMatch) {
      this.showMsg(msgEl, 'Mật khẩu số không đúng!', 'error');
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
      return;
    }

    // Đăng nhập thành công
    this.unlockSession(targetDoc);
  }

  // Đăng ký tài khoản Bác sĩ mới
  async handleGateRegister() {
    const fullName = document.getElementById('regFullName')?.value?.trim();
    let username = document.getElementById('regUsername')?.value?.trim().toLowerCase();
    const pin = document.getElementById('regPin')?.value?.trim();
    const email = document.getElementById('regEmail')?.value?.trim();
    const phone = document.getElementById('regPhone')?.value?.trim();
    const dept = document.getElementById('regDept')?.value?.trim() || 'Khoa Nhiễm';
    const title = document.getElementById('regTitle')?.value?.trim() || 'Bác sĩ điều trị';
    const msgEl = document.getElementById('gateRegMsg');

    if (!fullName) {
      this.showMsg(msgEl, 'Vui lòng nhập họ và tên Bác sĩ!', 'error');
      return;
    }

    if (!username) {
      username = this.generateDoctorUsername(fullName);
    }

    if (!pin) {
      this.showMsg(msgEl, 'Vui lòng nhập mã PIN số để bảo mật!', 'error');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      this.showMsg(msgEl, 'Mã PIN chỉ được bao gồm các chữ số!', 'error');
      return;
    }

    // Kiểm tra trùng username
    const docs = this.getKnownDoctors();
    const duplicate = docs.some(d => (d.username && d.username.toLowerCase() === username));
    if (duplicate) {
      this.showMsg(msgEl, `Tên đăng nhập "${username}" đã tồn tại! Vui lòng chọn tên khác.`, 'error');
      return;
    }

    const newDoctor = {
      id: 'doc_' + Date.now().toString(36),
      username: username,
      full_name: fullName,
      pin: pin,
      email: email || `${username}@medward.local`,
      phone: phone || '',
      department: dept,
      title: title,
      hospital: 'Bệnh viện Đa khoa Khu vực Thủ Đức',
      role: 'doctor',
      created_at: new Date().toISOString()
    };

    this.knownDoctors.push(newDoctor);
    this.saveKnownDoctors();

    this.showMsg(msgEl, `✓ Đăng ký thành công! Đang chuyển vào không gian làm việc của ${fullName}...`, 'success');

    setTimeout(() => {
      this.unlockSession(newDoctor);
    }, 600);
  }

  async unlockSession(doctor = null) {
    sessionStorage.setItem('medward_session_unlocked', 'true');
    this.isLoggedIn = true;

    if (doctor) {
      this.activeDoctor = { ...doctor };
    } else if (!this.activeDoctor) {
      this.activeDoctor = { ...CONFIG.DEFAULT_DEMO_DOCTOR };
    }

    this.saveActiveDoctor();
    this.updateUserUI();
    this.checkLoginGate();

    if (window.patientController) {
      await window.patientController.switchWorkspaceDoctor(this.activeDoctor.id);
    }

    if (window.showToast) {
      window.showToast(`✓ Chào mừng ${this.activeDoctor.full_name} vào ca trực!`);
    }
  }

  showGateOverlay() {
    this.isLoggedIn = false;
    this.checkLoginGate();
  }

  getInitials(name) {
    if (!name) return 'BS';
    const clean = name.replace(/\b(bs|bs\.|cki|ckii|ths|ts|pgs|gs)\b/gi, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'BS';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // ============================================================================
  // CẬP NHẬT GIAO DIỆN TỔNG QUAN (DESKTOP & MOBILE CLINICAL HEADER)
  // ============================================================================
  updateUserUI() {
    const doc = this.getActiveDoctor();
    const userBadgeEl = document.getElementById('userProfileBadge');
    const lockBtn = document.getElementById('btnLockBoard');
    const loginBtnHeader = document.getElementById('btnLoginHeader');
    const wsText = document.getElementById('currentWorkspaceText');

    // Mobile Elements
    const mobileAvatar = document.getElementById('mobileDocAvatar');
    const mobileName = document.getElementById('mobileDocName');

    if (this.isLoggedIn && doc) {
      if (userBadgeEl) {
        userBadgeEl.style.display = 'inline-flex';
        const tooltip = `Không gian điều trị: ${doc.full_name} (${doc.department || 'Khoa Nhiễm'})`;
        userBadgeEl.setAttribute('data-tooltip', tooltip);
      }
      if (lockBtn) lockBtn.style.display = 'inline-flex';
      if (loginBtnHeader) loginBtnHeader.style.display = 'none';
      if (wsText) wsText.innerText = doc.full_name;

      // Update Mobile Header
      if (mobileAvatar) mobileAvatar.innerText = this.getInitials(doc.full_name);
      if (mobileName) {
        const shortName = doc.full_name.replace(/^(th|s|bs|bác sĩ|ck1|ck2|\.|\s)+/i, '').trim();
        mobileName.innerText = shortName ? `BS. ${shortName}` : doc.full_name;
      }

      const totalCount = window.patientController?.patientList?.length || 0;
      this.updateHeaderPill(totalCount, totalCount);
      this.updateModalHeroBanner();
    } else {
      if (userBadgeEl) userBadgeEl.style.display = 'none';
      if (lockBtn) lockBtn.style.display = 'none';
      if (loginBtnHeader) loginBtnHeader.style.display = 'inline-flex';
      if (wsText) wsText.innerText = 'Chưa đăng nhập';
    }

    if (window.medWardApp?.updatePrintDateNote) {
      window.medWardApp.updatePrintDateNote();
    }
  }

  updateHeaderPill(myPatientsCount = 0, totalCount = 0) {
    const doc = this.getActiveDoctor();
    const avatarEl = document.getElementById('headerDocAvatar');
    const nameEl = document.getElementById('headerDocName');
    const roleEl = document.getElementById('headerDocRole');

    if (avatarEl) avatarEl.innerText = this.getInitials(doc?.full_name);
    if (nameEl) nameEl.innerText = doc?.full_name || 'BS. Nguyễn Hữu Đông';
    if (roleEl) {
      roleEl.innerText = `${doc?.title || 'BS. Điều trị'} • ${totalCount} BN`;
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
        if (statusText) statusText.innerText = '🟡 Đang đồng bộ với Cloud...';
      } else {
        const timeStr = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString('vi-VN') : 'vừa xong';
        indicator.className = 'icon-btn btn-cloud connected';
        indicator.setAttribute('data-tooltip', `Cloud Realtime: Đã đồng bộ (${timeStr})`);
        if (statusText) statusText.innerText = `🟢 Cloud Realtime kết nối tốt (Đồng bộ lúc ${timeStr})`;
      }
    } else {
      indicator.className = 'icon-btn btn-cloud';
      indicator.setAttribute('data-tooltip', 'Lưu trữ nội bộ (Nhấn để cấu hình Cloud)');
      if (statusText) statusText.innerText = '🟢 Lưu trữ bộ nhớ thiết bị (Tự động lưu)';
    }
  }

  // ============================================================================
  // TAB QUẢN LÝ BÁC SĨ (RBAC ĐẶC QUYỀN: CHỈ DUY NHẤT BS. ĐÔNG SỬA / XÓA)
  // ============================================================================
  renderDoctorManagementTab() {
    const container = document.getElementById('doctorManagementArea');
    if (!container) return;

    this.updateModalHeroBanner();

    const isAdmin = this.isDongAdmin();
    const currentDoc = this.getActiveDoctor();
    const docs = this.getKnownDoctors();

    let html = `<div class="modern-doc-management">`;

    html += `
      <div class="doc-management-header">
        <div>
          <div class="doc-mgmt-title">Danh Sách Bác Sĩ Trong Khoa</div>
          <div class="doc-mgmt-sub">${docs.length} bác sĩ đã kích hoạt không gian làm việc</div>
        </div>
        ${isAdmin ? `
          <button type="button" class="btn-add-doc" onclick="window.authController.showGateView('register'); window.authController.closeAuthModal(); window.authController.showGateOverlay();">
            + Thêm Bác Sĩ
          </button>
        ` : ''}
      </div>
    `;

    if (isAdmin) {
      html += `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">👑</span>
          <div style="font-size: 11.5px; color: #1e40af; line-height: 1.4;">
            <strong>Quyền quản trị viên:</strong> Bạn có quyền chuyển vùng xem không gian, chỉnh sửa và quản lý hồ sơ bác sĩ trong toàn khoa.
          </div>
        </div>
      `;
    }

    html += `<div class="doctor-list-container">`;

    docs.forEach(doc => {
      const isDong = this.isDongAdmin(doc);
      const isCurrent = doc.id === currentDoc?.id || doc.username === currentDoc?.username;
      const stats = window.patientController?.calculateDoctorStorageUsage?.(doc.id) || { patientsCount: 0, usedFormatted: '0 KB', percent: '0' };

      html += `
        <div class="modern-doc-row ${isCurrent ? 'is-current' : ''}">
          <div class="doc-row-left">
            <div class="doc-row-avatar ${isDong ? 'admin-avatar' : ''}">
              ${this.getInitials(doc.full_name)}
            </div>
            <div class="doc-row-details">
              <div class="doc-row-name-line">
                <span class="doc-row-name">${this.escape(doc.full_name)}</span>
                ${isDong ? '<span class="doc-role-pill admin">Quản trị viên</span>' : ''}
                ${isCurrent ? '<span class="doc-role-pill current">Đang dùng</span>' : ''}
              </div>
              <div class="doc-row-sub">
                <span>${this.escape(doc.title || 'Bác sĩ')}</span>
                <span class="sep">•</span>
                <span>${this.escape(doc.department || 'Khoa Nhiễm')}</span>
                <span class="sep">•</span>
                <span style="color: #2563eb; font-weight: 600;">${stats.patientsCount} NB (${stats.usedFormatted})</span>
              </div>
            </div>
          </div>

          <div class="doc-row-actions">
            ${isAdmin ? `
              <button type="button" class="btn-switch-doc" onclick="window.patientController.switchWorkspaceDoctor('${doc.id || doc.username}'); window.authController.closeAuthModal();" title="Xem không gian làm việc của bác sĩ này">
                Xem
              </button>
              <button type="button" class="btn-icon-edit" onclick="window.authController.openDoctorEditModal('${doc.id || doc.username}')" title="Sửa thông tin">
                ✏️
              </button>
              ${!isDong ? `
                <button type="button" class="btn-icon-del" onclick="window.authController.deleteDoctor('${doc.id || doc.username}')" title="Xóa tài khoản này">
                  🗑️
                </button>
              ` : ''}
            ` : `
              ${isCurrent ? `
                <button type="button" class="btn-switch-doc" onclick="window.authController.switchAuthTab('profile')">
                  Hồ sơ của tôi
                </button>
              ` : `
                <span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Chỉ xem</span>
              `}
            `}
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  }

  // Mở modal sửa thông tin Bác sĩ (chỉ cho BS Đông)
  openDoctorEditModal(docId) {
    if (!this.isDongAdmin()) {
      alert('Chỉ riêng tài khoản BS. Nguyễn Hữu Đông mới có quyền chỉnh sửa hồ sơ các Bác sĩ khác!');
      return;
    }

    const docs = this.getKnownDoctors();
    const doc = docs.find(d => d.id === docId || d.username === docId);
    if (!doc) return;

    const modal = document.getElementById('doctorEditModal');
    if (!modal) return;

    document.getElementById('adminEditDocId').value = doc.id || doc.username;
    document.getElementById('adminEditDocName').value = doc.full_name || '';
    document.getElementById('adminEditDocTitle').value = doc.title || '';
    document.getElementById('adminEditDocDept').value = doc.department || '';
    document.getElementById('adminEditDocPhone').value = doc.phone || '';
    document.getElementById('adminEditDocPin').value = '';

    modal.style.display = 'flex';
  }

  closeDoctorEditModal() {
    const modal = document.getElementById('doctorEditModal');
    if (modal) modal.style.display = 'none';
  }

  handleAdminSaveDoctor() {
    if (!this.isDongAdmin()) {
      alert('Chỉ riêng tài khoản BS. Nguyễn Hữu Đông mới có quyền chỉnh sửa hồ sơ các Bác sĩ khác!');
      return;
    }

    const docId = document.getElementById('adminEditDocId')?.value;
    const name = document.getElementById('adminEditDocName')?.value?.trim();
    const title = document.getElementById('adminEditDocTitle')?.value?.trim();
    const dept = document.getElementById('adminEditDocDept')?.value?.trim();
    const phone = document.getElementById('adminEditDocPhone')?.value?.trim();
    const pin = document.getElementById('adminEditDocPin')?.value?.trim();

    if (!name) {
      alert('Vui lòng nhập họ và tên Bác sĩ!');
      return;
    }

    const docs = this.getKnownDoctors();
    const doc = docs.find(d => d.id === docId || d.username === docId);
    if (!doc) return;

    doc.full_name = name;
    doc.title = title || 'Bác sĩ điều trị';
    doc.department = dept || 'Khoa Nhiễm';
    doc.phone = phone || '';
    if (pin) {
      if (!/^\d+$/.test(pin)) {
        alert('Mã PIN chỉ được bao gồm các chữ số!');
        return;
      }
      doc.pin = pin;
    }

    this.saveKnownDoctors();
    this.closeDoctorEditModal();
    this.renderDoctorManagementTab();

    // Nếu sửa trúng bác sĩ đang hoạt động, cập nhật luôn UI
    if (this.activeDoctor && (this.activeDoctor.id === docId || this.activeDoctor.username === docId)) {
      this.activeDoctor = { ...this.activeDoctor, ...doc };
      this.saveActiveDoctor();
      this.updateUserUI();
    }

    if (window.showToast) {
      window.showToast(`✓ Đã cập nhật hồ sơ: ${name}`);
    }
  }

  deleteDoctor(docId) {
    if (!this.isDongAdmin()) {
      alert('Chỉ riêng tài khoản BS. Nguyễn Hữu Đông mới có quyền loại bỏ hồ sơ các Bác sĩ khác!');
      return;
    }

    const docs = this.getKnownDoctors();
    const doc = docs.find(d => d.id === docId || d.username === docId);
    if (!doc) return;

    if (this.isDongAdmin(doc)) {
      alert('Không thể xóa tài khoản Quản trị viên của BS. Nguyễn Hữu Đông!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn loại bỏ hồ sơ của ${doc.full_name} khỏi hệ thống?`)) {
      return;
    }

    this.knownDoctors = this.knownDoctors.filter(d => d.id !== doc.id && d.username !== doc.username);
    this.saveKnownDoctors();
    this.renderDoctorManagementTab();

    if (window.showToast) {
      window.showToast(`🗑️ Đã xóa hồ sơ: ${doc.full_name}`);
    }
  }

  // ============================================================================
  // TAB WORKSPACE & PROFILE MODAL (DOCTOR WORKSPACE BOARD)
  // ============================================================================
  updateModalHeroBanner() {
    const doc = this.getActiveDoctor();
    if (!doc) return;
    const isAdmin = this.isDongAdmin(doc);
    const avatar = document.getElementById('wsDocAvatar');
    const name = document.getElementById('wsDocFullName');
    const role = document.getElementById('wsDocRoleBadge');
    const title = document.getElementById('wsDocTitle');
    const dept = document.getElementById('wsDocDept');
    const hospital = document.getElementById('wsDocHospital');
    const username = document.getElementById('wsDocUsername');

    if (avatar) avatar.innerText = this.getInitials(doc.full_name);
    if (name) name.innerText = doc.full_name;
    if (role) {
      role.className = isAdmin ? 'doc-hero-role-badge admin' : 'doc-hero-role-badge';
      role.innerText = isAdmin ? 'Quản trị viên' : 'Bác sĩ điều trị';
    }
    if (title) title.innerText = doc.title || 'Bác sĩ điều trị';
    if (dept) dept.innerText = doc.department || 'Khoa Nhiễm';
    if (hospital) hospital.innerText = doc.hospital || 'BV ĐK KV Thủ Đức';
    if (username) username.innerText = doc.username || 'dongnh';
  }

  openAuthModal(defaultTab = 'workspace') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    this.updateModalHeroBanner();
    this.switchAuthTab(defaultTab);
    modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tabName) {
    if (tabName === 'security' || tabName === 'password') {
      this.closeAuthModal();
      this.openChangePasswordModal('pin');
      return;
    }

    const tabs = ['workspace', 'profile', 'doctors', 'login', 'security'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tabBtn_${t}`);
      const content = document.getElementById(`tabContent_${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (content) {
        content.classList.toggle('active', t === tabName);
        content.style.display = (t === tabName) ? 'block' : 'none';
      }
    });

    this.updateModalHeroBanner();

    if (tabName === 'workspace') {
      this.renderWorkspaceTab();
    } else if (tabName === 'doctors') {
      this.renderDoctorManagementTab();
    } else if (tabName === 'profile') {
      this.fillProfileForm();
    }
  }

  async renderWorkspaceTab() {
    const container = document.getElementById('workspaceContentArea');
    if (!container) return;

    this.updateModalHeroBanner();

    const doc = this.getActiveDoctor();
    const isAdmin = this.isDongAdmin(doc);
    const patients = window.patientController?.patientList || [];
    const myCount = patients.length;
    const criticalCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pendingCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;
    const storageStats = window.patientController?.calculateDoctorStorageUsage?.(doc.id) || {
      usedFormatted: '0 KB',
      maxFormatted: '100 MB',
      remainingFormatted: '100 MB',
      percent: '0',
      percentNum: 0,
      patientsBytesFormatted: '0 KB',
      logsBytesFormatted: '0 KB',
      profileBytesFormatted: '0 KB',
      patientsCount: myCount
    };

    const isAllMode = window.patientController?.activeWorkspaceDoctorId === 'all';
    const effectiveDoc = window.patientController?.getEffectiveDoctor?.()?.doctor || doc;

    let html = `
      <div class="modern-workspace-overview">
        <!-- 3 KHỐI CHỈ SỐ LÂM SÀNG TRỌNG TÂM -->
        <div class="modern-stat-grid">
          <div class="modern-stat-card stat-blue">
            <div class="modern-stat-val">${myCount}</div>
            <div class="modern-stat-label">Tổng người bệnh</div>
          </div>
          <div class="modern-stat-card stat-red">
            <div class="modern-stat-val">${criticalCount}</div>
            <div class="modern-stat-label">Cần theo dõi sát</div>
          </div>
          <div class="modern-stat-card stat-amber">
            <div class="modern-stat-val">${pendingCount}</div>
            <div class="modern-stat-label">Chờ bàn giao</div>
          </div>
        </div>

        <!-- KHỐI DUNG LƯỢNG LƯU TRỮ AN TOÀN -->
        <div class="modern-quota-card">
          <div class="quota-header">
            <span>💾 Dung lượng lưu trữ an toàn</span>
            <span>${storageStats.usedFormatted} / 100 MB (${storageStats.percent}%)</span>
          </div>
          <div class="quota-progress-track">
            <div class="quota-progress-bar" style="width: ${Math.max(2, Math.min(100, storageStats.percentNum * 20))}%; background: ${storageStats.isFull ? '#ef4444' : (storageStats.isNearLimit ? '#f59e0b' : '#2563eb')};"></div>
          </div>
          <div class="quota-details">
            <span>🗂️ ${storageStats.patientsCount || myCount} người bệnh (${storageStats.patientsBytesFormatted})</span>
            <span>🟢 Bộ nhớ cục bộ &amp; Đồng bộ an toàn</span>
          </div>
        </div>

        ${isAdmin ? `
          <!-- KHU VỰC ĐIỀU HÀNH DÀNH RIÊNG QUẢN TRỊ VIÊN -->
          <div class="admin-oversight-card">
            <div class="admin-oversight-header">
              <span style="font-size: 12.5px; font-weight: 800; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                <span class="admin-crown-icon">👑</span>
                <span>Phạm Vi Điều Hành Toàn Khoa</span>
              </span>
              <span class="admin-scope-pill">${isAllMode ? '🌐 Toàn Khoa' : effectiveDoc.full_name}</span>
            </div>
            <button type="button" class="btn-admin-switch" onclick="window.authController.closeAuthModal(); window.patientController.openAdminWorkspaceSwitcherModal();">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M16 3h5v5"></path><path d="M4 20L21 3"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M4 4l5 5"></path></svg>
              <span>Chuyển Đổi Không Gian Bác Sĩ</span>
            </button>
          </div>
        ` : ''}

        <!-- TỐI GIẢN CÁC NÚT: 1 PRIMARY CTA + 2 UTILITIES + SUBTLE FOOTER -->
        <div class="workspace-action-bar">
          <!-- Nút hành động chính: Rõ ràng, to, nổi bật nhất -->
          <button type="button" class="btn-enter-workspace" onclick="window.authController.enterMyWorkspace()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M3 12h18"></path><path d="M3 6h18"></path><path d="M3 18h18"></path></svg>
            <span>Mở Bảng Theo Dõi &amp; Y Lệnh</span>
          </button>

          <!-- 2 Nút tiện ích phụ gọn gàng 1 hàng -->
          <div class="workspace-utility-row">
            <button type="button" class="btn-util-excel" onclick="document.getElementById('excelFileInput').click(); window.authController.closeAuthModal();" title="Nạp nhanh danh sách từ Excel">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>
              <span>Nhập Excel</span>
            </button>
            <button type="button" class="btn-util-backup" onclick="window.patientController.openExportBackupModal(); window.authController.closeAuthModal();" title="Xuất và sao lưu dữ liệu ca trực">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Xuất &amp; Sao Lưu</span>
            </button>
          </div>

          <!-- Chân bảng: Đổi mật khẩu & Khóa bảng trang nhã -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
            <button type="button" class="btn-quiet-change-pass" onclick="window.authController.openChangePasswordModal('pin')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Đổi Mã PIN / Mã 9 Nút</span>
            </button>
            <button type="button" class="btn-quiet-logout" onclick="window.authController.handleLogout()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Khóa Bảng</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  enterMyWorkspace() {
    this.closeAuthModal();
    if (window.patientController) {
      window.patientController.render();
    }
  }

  fillProfileForm() {
    const doc = this.getActiveDoctor();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('profFullName', doc.full_name || '');
    setVal('profTitle', doc.title || 'Bác sĩ điều trị');
    setVal('profDept', doc.department || 'Khoa Nhiễm');
    setVal('profHospital', doc.hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức');
    setVal('profPhone', doc.phone || '');
    setVal('profUsername', doc.username || '');
  }

  async handleSaveProfile() {
    const fullName = document.getElementById('profFullName')?.value?.trim();
    const title = document.getElementById('profTitle')?.value?.trim();
    const dept = document.getElementById('profDept')?.value?.trim();
    const hospital = document.getElementById('profHospital')?.value?.trim();
    const phone = document.getElementById('profPhone')?.value?.trim();
    const pin = document.getElementById('profPin')?.value?.trim();
    const msgEl = document.getElementById('profileMessage');

    if (!fullName) {
      this.showMsg(msgEl, 'Họ và tên Bác sĩ không được để trống!', 'error');
      return;
    }

    if (pin) {
      if (!/^\d+$/.test(pin)) {
        this.showMsg(msgEl, 'Mật khẩu số (PIN) chỉ được bao gồm các chữ số!', 'error');
        return;
      }
    }

    const updatePayload = {
      full_name: fullName,
      title: title || 'Bác sĩ điều trị',
      department: dept || 'Khoa Nhiễm',
      hospital: hospital || 'Bệnh viện Đa khoa Khu vực Thủ Đức',
      phone: phone || ''
    };

    if (pin) updatePayload.pin = pin;

    this.activeDoctor = { ...this.activeDoctor, ...updatePayload };
    this.saveActiveDoctor();

    // Cập nhật trong knownDoctors
    const idx = this.knownDoctors.findIndex(d => d.id === this.activeDoctor.id || d.username === this.activeDoctor.username);
    if (idx !== -1) {
      this.knownDoctors[idx] = { ...this.knownDoctors[idx], ...updatePayload };
      this.saveKnownDoctors();
    }

    this.updateUserUI();
    this.showMsg(msgEl, '✓ Đã cập nhật hồ sơ cá nhân thành công!', 'success');
  }

  async handleLogout() {
    if (confirm('Khóa bảng theo dõi và đăng xuất khỏi ca trực?')) {
      try {
        await window.supabaseService?.signOut?.();
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
        window.showToast('🔒 Đã khóa bảng theo dõi');
      }
    }
  }

  // ============================================================================
  // CÀI ĐẶT & ĐỔI MẬT KHẨU (MÃ PIN VÀ MÃ 9 NÚT)
  // ============================================================================
  openChangePasswordModal(initialTab = 'pin') {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;

    const doc = this.getActiveDoctor();
    const avatarEl = document.getElementById('changePassDocAvatar');
    const nameEl = document.getElementById('changePassDocName');
    const subEl = document.getElementById('changePassDocSub');

    if (avatarEl) avatarEl.innerText = this.getInitials(doc?.full_name);
    if (nameEl) nameEl.innerText = doc?.full_name || 'BS. Nguyễn Hữu Đông';
    if (subEl) subEl.innerText = `Tài khoản: ${doc?.username || 'dongnh'} • ${doc?.department || 'Khoa Nhiễm'}`;

    // Reset thông báo và ô nhập liệu
    const msgEl = document.getElementById('changePinMsg');
    if (msgEl) {
      msgEl.style.display = 'none';
      msgEl.className = 'form-message';
      msgEl.innerText = '';
    }

    const cur = document.getElementById('changePinCurrent');
    const nw = document.getElementById('changePinNew');
    const cf = document.getElementById('changePinConfirm');
    if (cur) cur.value = '';
    if (nw) nw.value = '';
    if (cf) cf.value = '';

    const matchBadge = document.getElementById('pinMatchBadge');
    if (matchBadge) matchBadge.style.display = 'none';

    const lengthBadge = document.getElementById('pinNewLengthBadge');
    if (lengthBadge) {
      lengthBadge.innerText = '(4 - 8 chữ số)';
      lengthBadge.style.color = 'var(--text-muted)';
    }

    this.activePinField = 'changePinNew';

    this.switchChangePasswordTab(initialTab);
    modal.classList.add('active');

    // Cập nhật trạng thái badge 9 nút
    if (window.patternLock) {
      window.patternLock.updateProfileBadge();
    }
  }

  closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.classList.remove('active');
    if (window.patternLock) {
      window.patternLock.resetRecordStep();
    }
  }

  switchChangePasswordTab(tab = 'pin') {
    const btnPin = document.getElementById('btnTabChangePin');
    const btnPattern = document.getElementById('btnTabChangePattern');
    const panelPin = document.getElementById('panelChangePin');
    const panelPattern = document.getElementById('panelChangePattern');

    if (tab === 'pin') {
      if (btnPin) btnPin.classList.add('active');
      if (btnPattern) btnPattern.classList.remove('active');
      if (panelPin) {
        panelPin.style.display = 'block';
        panelPin.classList.add('active');
      }
      if (panelPattern) {
        panelPattern.style.display = 'none';
        panelPattern.classList.remove('active');
      }
      setTimeout(() => {
        const cur = document.getElementById('changePinCurrent');
        if (cur) cur.focus();
      }, 100);
    } else {
      if (btnPin) btnPin.classList.remove('active');
      if (btnPattern) btnPattern.classList.add('active');
      if (panelPin) {
        panelPin.style.display = 'none';
        panelPin.classList.remove('active');
      }
      if (panelPattern) {
        panelPattern.style.display = 'block';
        panelPattern.classList.add('active');
      }
      if (window.patternLock) {
        window.patternLock.setupRecordLock();
        window.patternLock.updateProfileBadge();
      }
    }
  }

  setActivePinField(fieldId) {
    this.activePinField = fieldId;
  }

  handleKeypadInput(key) {
    const targetInput = document.getElementById(this.activePinField) || document.getElementById('changePinNew');
    if (!targetInput) return;

    if (key === 'C') {
      targetInput.value = '';
    } else if (key === 'BACK') {
      targetInput.value = targetInput.value.slice(0, -1);
    } else if (/^[0-9]$/.test(key)) {
      if (targetInput.value.length < 8) {
        targetInput.value += key;
      }
    }

    this.checkPinMatch();
  }

  toggleTouchNumpad() {
    const grid = document.getElementById('touchNumpadGrid');
    if (!grid) return;
    this.isTouchNumpadVisible = !this.isTouchNumpadVisible;
    grid.style.display = this.isTouchNumpadVisible ? 'grid' : 'none';
  }

  checkPinMatch() {
    const newPin = (document.getElementById('changePinNew')?.value || '').trim();
    const confirmPin = (document.getElementById('changePinConfirm')?.value || '').trim();
    const badge = document.getElementById('pinMatchBadge');
    const lengthBadge = document.getElementById('pinNewLengthBadge');

    if (lengthBadge) {
      if (newPin.length === 0) {
        lengthBadge.innerText = '(4 - 8 chữ số)';
        lengthBadge.style.color = 'var(--text-muted)';
      } else if (newPin.length < 4) {
        lengthBadge.innerText = `(${newPin.length}/4 số - Quá ngắn)`;
        lengthBadge.style.color = '#dc2626';
      } else {
        lengthBadge.innerText = `(${newPin.length} số - Hợp lệ ✓)`;
        lengthBadge.style.color = '#15803d';
      }
    }

    if (!badge) return;

    if (!confirmPin) {
      badge.style.display = 'none';
      return;
    }

    badge.style.display = 'inline-block';
    if (newPin === confirmPin) {
      badge.className = 'pin-match-badge matched';
      badge.innerText = '✓ Khớp';
    } else {
      badge.className = 'pin-match-badge mismatched';
      badge.innerText = '❌ Chưa khớp';
    }
  }

  async handleSaveNewPin() {
    const currentPinInput = document.getElementById('changePinCurrent');
    const newPinInput = document.getElementById('changePinNew');
    const confirmPinInput = document.getElementById('changePinConfirm');
    const msgEl = document.getElementById('changePinMsg');

    const currentPin = (currentPinInput?.value || '').trim();
    const newPin = (newPinInput?.value || '').trim();
    const confirmPin = (confirmPinInput?.value || '').trim();

    const doc = this.getActiveDoctor();
    const expectedCurrentPin = doc.pin || localStorage.getItem('medward_doctor_pin') || '123456';

    // 1. Kiểm tra mã PIN hiện tại
    if (!currentPin) {
      this.showMsg(msgEl, '⚠️ Vui lòng nhập Mã PIN hiện tại để xác thực chủ tài khoản!', 'error');
      if (currentPinInput) currentPinInput.focus();
      return;
    }

    if (currentPin !== expectedCurrentPin && currentPin !== '123456') {
      this.showMsg(msgEl, '❌ Mã PIN hiện tại không chính xác! (Mặc định: 123456 nếu chưa từng đổi)', 'error');
      if (currentPinInput) currentPinInput.focus();
      return;
    }

    // 2. Kiểm tra mã PIN mới
    if (!newPin) {
      this.showMsg(msgEl, '⚠️ Vui lòng nhập Mã PIN mới!', 'error');
      if (newPinInput) newPinInput.focus();
      return;
    }

    if (!/^\d{4,8}$/.test(newPin)) {
      this.showMsg(msgEl, '⚠️ Mã PIN mới phải bao gồm từ 4 đến 8 chữ số (0-9)!', 'error');
      if (newPinInput) newPinInput.focus();
      return;
    }

    if (newPin === currentPin) {
      this.showMsg(msgEl, '⚠️ Mã PIN mới trùng với mã PIN hiện tại! Vui lòng chọn mã khác.', 'error');
      if (newPinInput) newPinInput.focus();
      return;
    }

    // 3. Kiểm tra xác nhận mã PIN
    if (newPin !== confirmPin) {
      this.showMsg(msgEl, '❌ Xác nhận mã PIN mới không trùng khớp!', 'error');
      if (confirmPinInput) confirmPinInput.focus();
      return;
    }

    // 4. Lưu mã PIN mới
    doc.pin = newPin;
    this.activeDoctor = { ...this.activeDoctor, pin: newPin };
    this.saveActiveDoctor();
    localStorage.setItem('medward_doctor_pin', newPin);

    // Cập nhật trong knownDoctors
    const idx = this.knownDoctors.findIndex(d => d.id === doc.id || d.username === doc.username);
    if (idx !== -1) {
      this.knownDoctors[idx] = { ...this.knownDoctors[idx], pin: newPin };
      this.saveKnownDoctors();
    }

    // Đồng bộ lên Supabase nếu có Cloud
    try {
      if (window.supabaseService?.isCloudEnabled) {
        await window.supabaseService.saveDoctor?.(this.activeDoctor);
      }
    } catch (e) {
      console.warn('Could not sync PIN to cloud:', e);
    }

    this.showMsg(msgEl, `✓ Đổi mã PIN thành công! Mã PIN mới: ${newPin}. Hãy ghi nhớ mã này để mở khóa.`, 'success');
    if (window.showToast) {
      window.showToast(`✓ Đã đổi mã PIN thành công (${newPin})`);
    }

    // Reset inputs
    if (currentPinInput) currentPinInput.value = '';
    if (newPinInput) newPinInput.value = '';
    if (confirmPinInput) confirmPinInput.value = '';

    setTimeout(() => {
      this.closeChangePasswordModal();
    }, 1200);
  }

  async handleResetDefaultPin() {
    if (!confirm('Bạn có chắc chắn muốn khôi phục mã PIN về mặc định (123456)?')) return;
    const doc = this.getActiveDoctor();
    doc.pin = '123456';
    this.activeDoctor = { ...this.activeDoctor, pin: '123456' };
    this.saveActiveDoctor();
    localStorage.setItem('medward_doctor_pin', '123456');

    const idx = this.knownDoctors.findIndex(d => d.id === doc.id || d.username === doc.username);
    if (idx !== -1) {
      this.knownDoctors[idx] = { ...this.knownDoctors[idx], pin: '123456' };
      this.saveKnownDoctors();
    }

    try {
      if (window.supabaseService?.isCloudEnabled) {
        await window.supabaseService.saveDoctor?.(this.activeDoctor);
      }
    } catch (e) {}

    const msgEl = document.getElementById('changePinMsg');
    this.showMsg(msgEl, '✓ Đã khôi phục mã PIN về mặc định (123456)!', 'success');
    if (window.showToast) {
      window.showToast('✓ Mã PIN đã được đặt lại về 123456');
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

  bindEvents() {
    const authBtn = document.getElementById('btnAuthModal');
    if (authBtn) {
      authBtn.addEventListener('click', () => this.openAuthModal('workspace'));
    }

    const settingsBtn = document.getElementById('btnCloudSettingsModal');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openCloudSettingsModal());
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveProfile();
      });
    }

    // Auto gợi ý username khi gõ tên
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

    // Tự động thích ứng chế độ mở khóa khi thay đổi kích thước/thiết bị
    window.addEventListener('resize', () => {
      const overlay = document.getElementById('loginGateOverlay');
      if (overlay && overlay.style.display !== 'none' && this.currentGateView === 'unlock') {
        const targetMode = this.getDeviceUnlockMode();
        this.switchGateMode(targetMode);
      }
    });
  }

  openCloudSettingsModal() {
    const modal = document.getElementById('cloudSettingsModal');
    if (!modal) return;
    const conf = window.supabaseService?.getConfig?.() || {};
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
    const res = window.supabaseService?.configure?.(url, key);
    if (res?.success) {
      this.showMsg(msgEl, res.message, 'success');
      setTimeout(async () => {
        this.closeCloudSettingsModal();
        if (window.patientController) {
          if (window.patientController.patientList && window.patientController.patientList.length > 0) {
            await window.supabaseService?.syncBatchPatients?.(window.patientController.patientList);
            if (window.showToast) {
              window.showToast(`✓ Đã đồng bộ ${window.patientController.patientList.length} người bệnh lên Supabase Cloud mới!`);
            }
          }
          window.patientController.reloadFromSource();
        }
      }, 1000);
    } else {
      this.showMsg(msgEl, res?.message || 'Lỗi cấu hình', 'error');
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
