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
      const preferredMode = localStorage.getItem('medward_unlock_mode') || 'pattern';
      this.switchGateMode(preferredMode);
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

    if (pin === '123456' || pin === docPin) {
      this.unlockSession(doc);
    } else {
      this.showMsg(msgEl, 'Mã PIN không chính xác! (Mặc định: 123456)', 'error');
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
    if (pin !== '123456' && pin !== expectedPin) {
      this.showMsg(msgEl, 'Mật khẩu số không đúng! (Mặc định: 123456)', 'error');
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

  unlockSession(doctor = null) {
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
      window.patientController.updateDoctorFilterDropdown();
      window.patientController.render();
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

    const isAdmin = this.isDongAdmin();
    const currentDoc = this.getActiveDoctor();
    const docs = this.getKnownDoctors();

    let html = '';

    if (isAdmin) {
      html += `
        <div style="background: #eff6ff; border: 1.5px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; color: #1d4ed8; font-size: 13.5px; margin-bottom: 4px;">
            <span>👑 QUẢN TRỊ VIÊN HỆ THỐNG: BS. NGUYỄN HỮU ĐÔNG</span>
          </div>
          <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.45;">
            Theo quy định phân quyền, chỉ riêng tài khoản của bạn mới có quyền thêm, chỉnh sửa hoặc loại bỏ hồ sơ các Bác sĩ khác trong hệ thống.
          </p>
        </div>
      `;
    } else {
      html += `
        <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; color: #b45309; font-size: 13.5px; margin-bottom: 4px;">
            <span>🛡️ PHÂN QUYỀN TRUY CẬP: BÁC SĨ ĐIỀU TRỊ</span>
          </div>
          <p style="font-size: 12px; color: #78350f; margin: 0; line-height: 1.45;">
            Bạn đang làm việc với tài khoản: <strong>${this.escape(currentDoc.full_name)}</strong>.<br>
            🔒 <em>Chỉ riêng tài khoản <strong>BS. Nguyễn Hữu Đông</strong> mới có quyền chỉnh sửa hoặc loại bỏ các hồ sơ bác sĩ khác.</em>
          </p>
        </div>
      `;
    }

    // Danh sách Bác sĩ
    html += `<div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">`;

    docs.forEach(doc => {
      const isDong = this.isDongAdmin(doc);
      const isCurrent = doc.id === currentDoc.id || doc.username === currentDoc.username;

      html += `
        <div style="background: #ffffff; border: 1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isDong ? '#1e3a8a' : '#0284c7'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0;">
              ${this.getInitials(doc.full_name)}
            </div>
            <div style="min-width: 0;">
              <div style="font-size: 14px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>${this.escape(doc.full_name)}</span>
                ${isDong ? '<span style="background: #fef3c7; color: #92400e; font-size: 10.5px; padding: 1px 7px; border-radius: 10px; font-weight: 700;">Quản trị viên</span>' : ''}
                ${isCurrent ? '<span style="background: #dcfce7; color: #166534; font-size: 10.5px; padding: 1px 7px; border-radius: 10px; font-weight: 700;">Đang dùng</span>' : ''}
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                ${this.escape(doc.title || 'Bác sĩ điều trị')} • ${this.escape(doc.department || 'Khoa Nhiễm')}
              </div>
              <div style="font-size: 11.5px; color: var(--text-muted);">
                Tài khoản: <strong>${this.escape(doc.username || '')}</strong> ${doc.phone ? '• ĐT: ' + this.escape(doc.phone) : ''}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${isAdmin ? `
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.authController.openDoctorEditModal('${doc.id || doc.username}')" title="Sửa thông tin">
                ✏️ Sửa
              </button>
              ${!isDong ? `
                <button type="button" class="btn btn-danger btn-sm" onclick="window.authController.deleteDoctor('${doc.id || doc.username}')" title="Xóa tài khoản này">
                  🗑️ Xóa
                </button>
              ` : ''}
            ` : `
              ${isCurrent ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.authController.switchAuthTab('profile')">
                  👤 Hồ sơ của tôi
                </button>
              ` : `
                <span style="font-size: 11.5px; color: var(--text-muted); font-style: italic;">Chỉ xem</span>
              `}
            `}
          </div>
        </div>
      `;
    });

    html += `</div>`;

    if (isAdmin) {
      html += `
        <div style="display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.authController.showGateView('register'); window.authController.closeAuthModal(); window.authController.showGateOverlay();">
            ➕ Thêm Bác Sĩ Mới
          </button>
        </div>
      `;
    }

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
  // TAB WORKSPACE & PROFILE MODAL
  // ============================================================================
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
    const tabs = ['workspace', 'doctors', 'login', 'profile'];
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
    } else if (tabName === 'doctors') {
      this.renderDoctorManagementTab();
    } else if (tabName === 'profile') {
      this.fillProfileForm();
    }
  }

  async renderWorkspaceTab() {
    const container = document.getElementById('workspaceContentArea');
    if (!container) return;

    const doc = this.getActiveDoctor();
    const patients = window.patientController?.patientList || [];
    const myCount = patients.length;
    const criticalCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pendingCount = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;

    let html = `
      <div class="doctor-workspace-status-card logged-in" style="background: #ffffff; border: 1.5px solid var(--primary); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);">
        <div class="ws-card-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="quick-doc-avatar" style="width: 46px; height: 46px; font-size: 16px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800;">
              ${this.getInitials(doc.full_name)}
            </div>
            <div>
              <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${this.escape(doc.full_name)}</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                ${this.escape(doc.title || 'Bác sĩ điều trị')} • ${this.escape(doc.department || 'Khoa Nhiễm')}
              </div>
              <div style="font-size: 11.5px; color: var(--text-muted);">
                Tài khoản: <strong>${this.escape(doc.username || '')}</strong> ${doc.email ? `(${this.escape(doc.email)})` : ''}
              </div>
            </div>
          </div>
          <span class="quick-doc-badge" style="background: #10b981; color: #ffffff; border: none; font-size: 11px; padding: 4px 10px; border-radius: 14px; font-weight: 700;">
            ✓ Đang trực
          </span>
        </div>

        <div class="ws-stats-row" style="display: flex; gap: 8px; margin: 12px 0;">
          <div style="flex: 1; padding: 10px; background: var(--bg-subtle); border-radius: 8px; border: 1px solid var(--border); text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${myCount}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Tổng số NB</div>
          </div>
          <div style="flex: 1; padding: 10px; background: rgba(239, 68, 68, 0.08); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: var(--danger);">${criticalCount}</div>
            <div style="font-size: 11px; color: var(--danger); font-weight: 600;">🚨 Nguy kịch</div>
          </div>
          <div style="flex: 1; padding: 10px; background: rgba(245, 158, 11, 0.08); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: #b45309;">${pendingCount}</div>
            <div style="font-size: 11px; color: #b45309; font-weight: 600;">⏳ Bàn giao</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
          <button type="button" class="btn btn-primary" onclick="window.authController.enterMyWorkspace()" style="width: 100%; justify-content: center; height: 38px; font-weight: 700;">
            🩺 Vào Bảng Theo Dõi &amp; Y Lệnh
          </button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.authController.switchAuthTab('doctors')" style="flex: 1; justify-content: center; font-size: 12px; font-weight: 600;">
              👥 Danh Sách BS
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.authController.switchAuthTab('profile')" style="flex: 1; justify-content: center; font-size: 12px; font-weight: 600;">
              👤 Hồ Sơ &amp; PIN
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.authController.handleLogout()" style="flex: 1; justify-content: center; color: var(--danger); border-color: rgba(239, 68, 68, 0.3); font-size: 12px; font-weight: 700;">
              🔒 Khóa Bảng
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
      setTimeout(() => {
        this.closeCloudSettingsModal();
        if (window.patientController) {
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
