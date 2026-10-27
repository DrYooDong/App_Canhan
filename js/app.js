// ==============================================================================
// MAIN APPLICATION COORDINATOR - MEDWARD PRO
// ==============================================================================

class MedWardApp {
  constructor() {
    this.viewMode = 'auto'; // 'auto' | 'table' | 'cards'
    this.isImportingExcel = false;
    this.pendingImportData = null;
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupResponsiveAndViews();
    this.setupDatePickers();
    this.setupMetaHandlers();
    this.bindGlobalEvents();
    this.setupKeyboardShortcuts();
    this.setupClipboardPaste();
    this.setupPWA();
    this.setupMultiDeviceLifecycle();
  }

  setupMultiDeviceLifecycle() {
    // 1. Khi người dùng mở lại tab hoặc mở lại màn hình điện thoại (Wake-up / Resume)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          window.patientController?.syncWithCloudOnResume?.(false);
        }, 150);
      }
    });

    window.addEventListener('pageshow', () => {
      setTimeout(() => {
        window.patientController?.syncWithCloudOnResume?.(false);
      }, 200);
    });

    window.addEventListener('focus', () => {
      window.supabaseService?.checkRealtimeHealth?.();
    });

    // 2. Tự động phục hồi & đồng bộ ngay khi mạng Internet bật lại
    window.addEventListener('online', () => {
      if (window.showToast) {
        window.showToast({
          title: '🌐 KẾT NỐI MẠNG ĐÃ PHỤC HỒI',
          message: 'Đang tự động đồng bộ hai chiều với Cloud & các thiết bị...',
          type: 'normal',
          icon: '🟢'
        });
      }
      setTimeout(() => {
        window.patientController?.syncWithCloudOnResume?.(true);
      }, 300);
    });

    window.addEventListener('offline', () => {
      if (window.showToast) {
        window.showToast({
          title: '⚠️ MẤT KẾT NỐI MẠNG',
          message: 'Ứng dụng đã chuyển sang chế độ Offline an toàn trên máy.',
          type: 'normal',
          icon: '📡'
        });
      }
    });

    // 3. Heartbeat kiểm tra sức khỏe kênh Realtime định kỳ mỗi 40s (khi tab đang mở)
    setInterval(() => {
      if (document.visibilityState === 'visible' && window.supabaseService?.isCloudEnabled) {
        window.supabaseService.checkRealtimeHealth();
      }
    }, 40000);
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key;
      const lowerKey = key.toLowerCase();
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      // 1. Phím ESC: Luôn đóng bất kỳ modal nào đang mở
      if (key === 'Escape') {
        this.closeAllModals();
        return;
      }

      // 2. Phím F1, Ctrl+/ hoặc ? (khi không gõ chữ): Mở bảng tra cứu phím tắt
      if (key === 'F1' || (isCtrlOrCmd && key === '/') || (!isInput && key === '?')) {
        e.preventDefault();
        this.openShortcutsModal();
        return;
      }

      // 3. Các phím tắt kết hợp với Ctrl / Cmd
      if (isCtrlOrCmd) {
        // Ctrl + N: Thêm bệnh nhân mới & mở ngay form nhập liệu
        if (lowerKey === 'n') {
          e.preventDefault();
          window.patientController?.openAddPatientModal?.();
          return;
        }

        // Ctrl + P: In ấn lâm sàng & Ctrl + Shift + P: In cho điều dưỡng
        if (lowerKey === 'p') {
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl + Shift + P: Kích hoạt in phiếu điều dưỡng
            window.patientController?.printNurseWorklist?.();
          } else {
            // Ctrl + P: Nếu đang mở modal điều dưỡng thì in phiếu điều dưỡng, ngược lại in bảng A4
            const nurseModal = document.getElementById('nursePrintModal');
            if (nurseModal && nurseModal.classList.contains('active')) {
              window.patientController?.printNurseWorklist?.();
            } else {
              window.patientController?.printPatientTable?.();
            }
          }
          return;
        }

        // Ctrl + F: Tìm kiếm nhanh bệnh nhân
        if (lowerKey === 'f') {
          e.preventDefault();
          const searchInput = document.getElementById('searchInput') || document.getElementById('mobileSearchInput');
          if (searchInput) {
            searchInput.focus();
            searchInput.select?.();
          }
          return;
        }

        // Ctrl + H: Mở Bảng bàn giao ca trực
        if (lowerKey === 'h') {
          e.preventDefault();
          window.handoverController?.openHandoverDashboard?.();
          return;
        }

        // Ctrl + D: Chuyển sang ngày mới (Rollover)
        if (lowerKey === 'd') {
          e.preventDefault();
          window.patientController?.openNextDayModal?.();
          return;
        }

        // Ctrl + E: Mở hộp thoại Xuất file Excel (.xlsx) / CSV sao lưu chống mất dữ liệu
        if (lowerKey === 'e') {
          e.preventDefault();
          window.patientController?.openExportBackupModal?.();
          return;
        }

        // Ctrl + S: Lưu tức thì và đồng bộ Cloud
        if (lowerKey === 's') {
          e.preventDefault();
          window.patientController?.saveLocalCache?.();
          window.supabaseService?.syncBatchPatients?.(window.patientController?.patientList || []);
          if (window.showToast) {
            window.showToast('💾 Đã lưu dữ liệu vào máy & gửi đồng bộ Cloud!');
          }
          return;
        }

        // Ctrl + M: Đổi chế độ xem (Bảng lâm sàng ↔ Thẻ người bệnh)
        if (lowerKey === 'm') {
          e.preventDefault();
          this.toggleViewMode();
          return;
        }

        // Ctrl + Shift + L: Đổi giao diện Sáng ↔ Tối (Dark mode trực đêm)
        if (lowerKey === 'l' && e.shiftKey) {
          e.preventDefault();
          this.toggleTheme();
          return;
        }
      }
    });
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('medward_theme') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(savedTheme, false);
  }

  applyTheme(theme, showNotice = false) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('medward_theme', isDark ? 'dark' : 'light');

    const iconDesk = document.getElementById('themeToggleIcon');
    if (iconDesk) iconDesk.innerText = isDark ? '☀️' : '🌙';
    const iconMob = document.getElementById('mobileThemeToggleIcon');
    if (iconMob) iconMob.innerText = isDark ? '☀️' : '🌙';

    const btnDesk = document.getElementById('btnThemeToggle');
    if (btnDesk) {
      btnDesk.setAttribute('data-tooltip', isDark ? 'Chuyển sang chế độ Sáng (Ban ngày - Ctrl+Shift+L)' : 'Chuyển sang chế độ Tối (Trực đêm - Ctrl+Shift+L)');
    }

    if (showNotice && window.showToast) {
      window.showToast(isDark ? '🌙 Đã kích hoạt Chế độ Tối (Trực đêm dịu mắt)' : '☀️ Đã chuyển sang Chế độ Sáng (Ban ngày)');
    }
  }

  toggleTheme() {
    const isCurrentlyDark = document.body.classList.contains('dark-theme');
    this.applyTheme(isCurrentlyDark ? 'light' : 'dark', true);
  }

  closeAllModals() {
    window.patientController?.closePatientDetailModal?.();
    window.patientController?.closeNextDayModal?.();
    window.patientController?.closeNursePrintModal?.();
    window.patientController?.closeExportBackupModal?.();
    window.handoverController?.closeHandoverModal?.();
    window.handoverController?.closeHandoverDashboard?.();
    window.authController?.closeAuthModal?.();
    window.authController?.closeCloudSettingsModal?.();
    this.closeAbbreviationModal?.();
    this.closeShortcutsModal?.();
    window.patternLock?.closePatternChangeModal?.();
  }

  openShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.add('active');
  }

  closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.remove('active');
  }

  setupDatePickers() {
    const dateInput = document.getElementById('reportDate');
    const nativePicker = document.getElementById('nativeDatePicker');
    const todayDMY = this.formatToDMY(new Date());

    if (dateInput) {
      dateInput.value = todayDMY;
      dateInput.setAttribute('readonly', 'true');
    }

    if (nativePicker) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      nativePicker.value = `${y}-${m}-${d}`;
    }

    this.updatePrintDateNote();
  }

  openCalendarPicker() {
    const todayDMY = this.formatToDMY(new Date());
    if (window.showToast) {
      window.showToast(`📅 Hệ thống luôn làm việc trên danh sách hôm nay (${todayDMY}) và tự động chuyển đổi thông minh sau 0h.`);
    }
  }

  setupResponsiveAndViews() {
    // 1. Nhận diện thiết bị và gán class vào document.body
    const updateDeviceClass = () => {
      const w = window.innerWidth;
      document.body.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
      if (w >= 1025) {
        document.body.classList.add('device-desktop');
      } else if (w >= 768) {
        document.body.classList.add('device-tablet');
      } else {
        document.body.classList.add('device-mobile');
      }
    };
    updateDeviceClass();
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(updateDeviceClass, 100);
    });

    // 2. Tải cấu hình chế độ xem đã lưu
    const saved = localStorage.getItem('medward_view_mode');
    if (saved === 'table' || saved === 'cards') {
      this.setViewMode(saved, false);
    } else {
      // Mặc định: Desktop = Bảng, Tablet/Mobile = Thẻ
      const defaultMode = (window.innerWidth >= 1025) ? 'table' : 'cards';
      this.setViewMode(defaultMode, false);
    }
  }

  setViewMode(mode, showNotification = true) {
    this.viewMode = mode; // 'table' | 'cards'
    localStorage.setItem('medward_view_mode', mode);

    // Xoá bỏ hoàn toàn inline display style để nhường quyền cho CSS responsive
    const tableWrapper = document.getElementById('tableWrapper');
    const cardsContainer = document.getElementById('mobileCardContainer');
    if (tableWrapper) tableWrapper.style.display = '';
    if (cardsContainer) cardsContainer.style.display = '';

    if (mode === 'table') {
      document.body.classList.add('view-table');
      document.body.classList.remove('view-cards');
      document.body.classList.add('mobile-view-table');
    } else {
      document.body.classList.add('view-cards');
      document.body.classList.remove('view-table');
      document.body.classList.remove('mobile-view-table');
    }

    // Cập nhật biểu tượng và nhãn trên Mobile Header
    const mobileIcon = document.getElementById('mobileViewModeIcon');
    const mobileText = document.getElementById('mobileViewModeText');
    if (mobileIcon) mobileIcon.innerText = (mode === 'table') ? '📋' : '📱';
    if (mobileText) mobileText.innerText = (mode === 'table') ? 'Bảng' : 'Thẻ';

    // Cập nhật tooltip và biểu tượng trên Toolbar Desktop/Laptop
    const desktopBtn = document.getElementById('btnToggleView');
    if (desktopBtn) {
      if (mode === 'cards') {
        desktopBtn.classList.add('active');
        desktopBtn.setAttribute('title', 'Chuyển sang xem dạng Bảng lâm sàng (Table)');
        desktopBtn.setAttribute('data-tooltip', 'Chuyển sang xem dạng Bảng 💻 (Ctrl+M)');
        desktopBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      } else {
        desktopBtn.classList.remove('active');
        desktopBtn.setAttribute('title', 'Chuyển sang xem dạng Thẻ người bệnh (Cards)');
        desktopBtn.setAttribute('data-tooltip', 'Chuyển sang xem dạng Thẻ 📱 (Ctrl+M)');
        desktopBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        `;
      }
    }

    if (showNotification && window.showToast) {
      const isMobile = window.innerWidth <= 767;
      const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
      if (mode === 'table') {
        window.showToast(isMobile ? '📋 Chế độ xem: Bảng di động' : '📋 Chế độ xem: Bảng lâm sàng');
      } else {
        window.showToast(isTablet ? '📱 Chế độ xem: Thẻ lưới máy tính bảng' : (isMobile ? '📱 Chế độ xem: Thẻ di động' : '📱 Chế độ xem: Lưới thẻ người bệnh'));
      }
    }
  }

  toggleViewMode() {
    const nextMode = (this.viewMode === 'table') ? 'cards' : 'table';
    this.setViewMode(nextMode, true);
    if (window.patientController && typeof window.patientController.render === 'function') {
      window.patientController.render();
    }
  }

  formatToDMY(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  updatePrintDateNote() {
    const dVal = (document.getElementById('reportDate')?.value || '').trim();
    const activeDoc = window.authController?.getActiveDoctor?.();
    const docVal = activeDoc ? (activeDoc.full_name || '') : '';
    const printEl = document.getElementById('printDateDisplay');
    if (printEl) {
      let str = `Ngày: ${dVal || this.formatToDMY(new Date())}`;
      if (docVal) str += ` • BS: ${docVal}`;
      printEl.innerText = str;
    }

    // Cập nhật khối chữ ký in A4
    const printDocSign = document.getElementById('printSignatureDoctorName');
    if (printDocSign) {
      printDocSign.innerText = docVal || '';
    }
    const printSignDate = document.getElementById('printSignatureDate');
    if (printSignDate) {
      const curDateStr = dVal || this.formatToDMY(new Date());
      const parts = curDateStr.split('/');
      if (parts.length === 3) {
        printSignDate.innerText = `Ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
      } else {
        printSignDate.innerText = `Ngày: ${curDateStr}`;
      }
    }
  }

  setupMetaHandlers() {
    // Tải meta đã lưu
    const savedMetaStr = localStorage.getItem(CONFIG.STORAGE_KEYS.META_DATA);
    if (savedMetaStr) {
      try {
        // Ngày luôn là ngày hôm nay (không lấy ngày cũ từ meta)
        if (document.getElementById('reportDate')) {
          document.getElementById('reportDate').value = this.formatToDMY(new Date());
        }
        if (meta.unit && document.querySelector('.unit-name')) {
          document.querySelector('.unit-name').innerText = meta.unit;
        }
        if (meta.hospital && document.querySelector('.hospital-title')) {
          document.querySelector('.hospital-title').innerText = meta.hospital;
        }
        if (meta.dept && document.querySelector('.dept-name')) {
          document.querySelector('.dept-name').innerText = meta.dept;
        }
        if (meta.title && document.querySelector('.main-title')) {
          document.querySelector('.main-title').innerText = meta.title;
        }
        if (meta.subTitle && document.querySelector('.sub-title')) {
          document.querySelector('.sub-title').innerText = meta.subTitle;
        }
      } catch (e) {}
    }

    // Lắng nghe thay đổi
    const save = () => this.saveMeta();
    document.getElementById('reportDate')?.addEventListener('input', save);
    document.querySelectorAll('.hospital-info [contenteditable], .main-title-box [contenteditable]').forEach(el => {
      el.addEventListener('input', save);
    });
  }

  saveMeta() {
    this.updatePrintDateNote();
    const activeDoc = window.authController?.getActiveDoctor?.();
    const meta = {
      date: document.getElementById('reportDate')?.value || '',
      doctor: activeDoc ? (activeDoc.full_name || '') : '',
      unit: document.querySelector('.unit-name')?.innerText || '',
      hospital: document.querySelector('.hospital-title')?.innerText || '',
      dept: document.querySelector('.dept-name')?.innerText || '',
      title: document.querySelector('.main-title')?.innerText || '',
      subTitle: document.querySelector('.sub-title')?.innerText || ''
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.META_DATA, JSON.stringify(meta));
  }

  bindGlobalEvents() {
    // Tab switching (Icon tabs & bottom nav)
    document.querySelectorAll('.btn-tab, .nav-tab-btn, .bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (window.patientController) {
          window.patientController.currentFilterQuery = e.target.value;
          window.patientController.render();
        }
      });
    }

    // Chuyển đổi gom nhóm buồng
    const toggleGroup = document.getElementById('toggleRoomGroup');
    if (toggleGroup) {
      toggleGroup.addEventListener('change', (e) => {
        if (window.patientController) {
          window.patientController.isGroupedByRoom = e.target.checked;
          window.patientController.saveSettings();
          window.patientController.render();
        }
      });
    }

    // Nút sắp xếp
    document.getElementById('btnSortPatients')?.addEventListener('click', () => {
      window.patientController?.sortPatientsByRoomAndBed(true);
    });

    // Nút nạp Excel
    const excelInput = document.getElementById('excelFileInput');
    if (excelInput) {
      excelInput.addEventListener('change', (e) => this.handleExcelFileUpload(e));
    }

    // In ấn
    window.addEventListener('beforeprint', () => {
      this.updatePrintDateNote();
    });

    // Hỗ trợ đánh số giống Word & phím tắt Ctrl+B / Alt+N trên các ô Textarea
    ['editDiagnosis', 'editOrders', 'editThemThuoc'].forEach(id => {
      const ta = document.getElementById(id);
      if (ta) {
        ta.addEventListener('keydown', (e) => {
          // Alt + N: Bật / tắt đánh số
          if (e.altKey && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            window.patientController?.toggleTextareaNumbering?.(id);
            return;
          }

          // Ctrl + B: In đậm bôi đen
          if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            window.patientController?.boldSelectionInTextarea?.(id);
            return;
          }

          // Enter: Tự động nhảy số thứ tự giống Word
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            const pos = ta.selectionStart;
            const val = ta.value;
            const textBefore = val.slice(0, pos);
            const lines = textBefore.split(/\r?\n/);
            const curLine = lines[lines.length - 1] || '';

            const m = curLine.match(/^(\s*)(\d+)([\.\/\)])(\s*)(.*)$/);
            if (m) {
              e.preventDefault();
              const num = parseInt(m[2], 10);
              const sep = m[3];
              const rest = m[5];

              if (!rest.trim()) {
                // Dòng trống có số -> Thoát đánh số
                const lineStart = pos - curLine.length;
                ta.value = val.slice(0, lineStart) + val.slice(pos);
                ta.selectionStart = ta.selectionEnd = lineStart;
              } else {
                // Nhảy số kế tiếp
                const nextNum = num + 1;
                const insertText = `\n${nextNum}${sep} `;
                const textAfter = val.slice(pos);
                ta.value = textBefore + insertText + textAfter;
                ta.selectionStart = ta.selectionEnd = pos + insertText.length;
              }
              ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        });
      }
    });
  }

  switchTab(tabName) {
    if (tabName === 'auth' || tabName === 'workspace') {
      window.authController?.openAuthModal('workspace');
      return;
    }

    if (tabName === 'profile') {
      window.authController?.openAuthModal('profile');
      return;
    }

    if (tabName === 'handover_dash') {
      window.handoverController?.openHandoverDashboard();
      return;
    }

    if (tabName === 'toggle_view') {
      this.toggleViewMode();
      return;
    }

    if (tabName === 'abbr') {
      this.openAbbreviationModal();
      return;
    }

    if (tabName === 'all' || tabName === 'patients') {
      window.patientController?.scrollToTop();
      return;
    }

    // Cập nhật trạng thái active của buttons
    document.querySelectorAll('.btn-tab, .nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });
  }

  setupClipboardPaste() {
    window.addEventListener('paste', async (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.isContentEditable || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (!window.authController?.isLoggedIn) {
        window.authController?.showGateOverlay?.();
        return;
      }

      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedText = clipboardData?.getData('text');
      if (pastedText && (pastedText.includes('\t') || pastedText.includes('\n'))) {
        const lines = pastedText.trim().split(/\r?\n/);
        const matrix = lines.map(line => line.split('\t'));
        const imported = window.patientController?.parseExcelRawRows(matrix) || [];

        if (imported.length > 0) {
          e.preventDefault();
          this.processImportedPatients(imported, {
            sourceName: 'Dán bảng từ Excel (Ctrl+V)',
            isPaste: true
          });
        }
      }
    });
  }

  handleExcelFileUpload(e) {
    if (this.isImportingExcel) {
      if (e?.target) e.target.value = '';
      return;
    }

    if (window.authController && !window.authController.isLoggedIn) {
      const gateOverlay = document.getElementById('loginGateOverlay');
      if (gateOverlay && gateOverlay.style.display !== 'none') {
        window.authController?.showGateOverlay?.();
        if (e?.target) e.target.value = '';
        return;
      } else {
        window.authController.isLoggedIn = true;
      }
    }

    const file = e.target.files?.[0];
    // Ngay lập tức xóa value của input để tránh lưu trạng thái cũ và sẵn sàng cho lần chọn file tiếp theo
    if (e?.target) e.target.value = '';
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      window.showToast("⚠️ Thư viện đọc file Excel chưa sẵn sàng. Bạn có thể sao chép bảng từ Excel rồi bấm Ctrl+V để dán trực tiếp!");
      return;
    }

    this.isImportingExcel = true;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          window.showToast('⚠️ File Excel không có bảng tính (sheet) nào!');
          this.isImportingExcel = false;
          return;
        }

        // Quét tìm sheet có dữ liệu người bệnh tốt nhất trong toàn bộ file
        let imported = [];
        let chosenSheetName = workbook.SheetNames[0];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet || !sheet['!ref']) continue;
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (!rawRows || rawRows.length === 0) continue;
          const parsed = window.patientController?.parseExcelRawRows(rawRows) || [];
          if (parsed.length > imported.length) {
            imported = parsed;
            chosenSheetName = sheetName;
          }
        }

        // Nếu quét từng sheet chưa thấy, thử parse sheet đầu tiên
        if (imported.length === 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          if (firstSheet) {
            const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
            imported = window.patientController?.parseExcelRawRows(rawRows) || [];
          }
        }

        if (imported.length === 0) {
          window.showToast('⚠️ Không tìm thấy hàng dữ liệu người bệnh phù hợp trong file Excel. Vui lòng kiểm tra lại cột Họ tên!');
          this.isImportingExcel = false;
          return;
        }

        this.processImportedPatients(imported, {
          sourceName: `"${file.name}" (sheet "${chosenSheetName}")`,
          isPaste: false
        });
      } catch (err) {
        console.error('Lỗi nạp file Excel:', err);
        window.showToast('⚠️ Lỗi đọc file Excel: ' + (err.message || 'File không hợp lệ'));
        this.isImportingExcel = false;
      }
    };

    reader.onerror = () => {
      window.showToast('⚠️ Không thể đọc file. Vui lòng thử lại!');
      this.isImportingExcel = false;
    };

    reader.readAsArrayBuffer(file);
  }

  processImportedPatients(imported, options = {}) {
    const pCtrl = window.patientController;
    if (!pCtrl) {
      this.isImportingExcel = false;
      return;
    }

    const curList = pCtrl.patientList || [];
    const curCount = curList.length;

    // TRƯỜNG HỢP 1: Danh sách hiện tại đang rỗng -> Nạp thẳng ngay không cần hỏi
    if (curCount === 0) {
      this.executeImport(imported, { isReplace: true, sourceName: options.sourceName });
      return;
    }

    // TRƯỜNG HỢP 2: Đang có sẵn người bệnh trên danh sách -> Phân tích trùng lặp và mở Modal lựa chọn
    this.pendingImportData = {
      imported,
      options
    };

    // Phân tích: Có bao nhiêu ca trong imported đã tồn tại trong curList
    let existingMatchCount = 0;
    let newCount = 0;

    imported.forEach(item => {
      const isExisting = this.findMatchingPatient(item, curList);
      if (isExisting) {
        existingMatchCount++;
      } else {
        newCount++;
      }
    });

    const modal = document.getElementById('excelImportModal');
    const bodyEl = document.getElementById('excelImportModalBody');
    const titleEl = document.getElementById('excelImportModalTitle');
    const btnSmart = document.getElementById('btnImportSmartAppend');
    const btnReplace = document.getElementById('btnImportReplaceAll');

    if (!modal || !bodyEl) {
      // Fallback nếu không tìm thấy Modal DOM
      const msg = `Phát hiện ${imported.length} người bệnh từ ${options.sourceName}.\n` +
        `Danh sách hiện tại đang có ${curCount} người bệnh.\n\n` +
        `• Bấm OK: THAY THẾ toàn bộ danh sách hiện tại.\n` +
        `• Bấm Cancel: NỐI TIẾP THÔNG MINH (chỉ thêm ${newCount} ca mới, tự động loại trừ trùng lặp).`;
      const replace = confirm(msg);
      if (replace) {
        this.executeImport(imported, { isReplace: true, sourceName: options.sourceName });
      } else {
        this.executeSmartAppend(imported, options);
      }
      return;
    }

    if (titleEl) {
      titleEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="8" y1="13" x2="16" y2="13"></line>
          <line x1="8" y1="17" x2="16" y2="17"></line>
        </svg>
        <span>${options.isPaste ? 'Xác Nhận Dán Bảng Excel (Ctrl+V)' : 'Tùy Chọn Nạp File Excel'}</span>
      `;
    }

    bodyEl.innerHTML = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; display: flex; gap: 10px; align-items: flex-start;">
        <div style="font-size: 22px; line-height: 1;">📊</div>
        <div style="font-size: 13.5px; line-height: 1.5; color: #166534;">
          <div>Nguồn dữ liệu: <strong>${options.sourceName || 'File Excel'}</strong></div>
          <div>Đã đọc được: <strong style="font-size: 15px; color: #047857;">${imported.length}</strong> người bệnh trong bảng tính.</div>
          <div style="margin-top: 4px; color: #374151;">Danh sách hiện tại trên máy đang có <strong>${curCount}</strong> người bệnh.</div>
        </div>
      </div>

      <div style="background: var(--bg-card, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 12px 14px; font-size: 13px;">
        <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
          <span>🔍 Phân tích trùng lặp thông minh:</span>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
          <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px;">
            ➕ ${newCount} ca mới chưa có
          </span>
          <span style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px;">
            🔄 ${existingMatchCount} ca đã có trong danh sách
          </span>
        </div>
        <div style="color: var(--text-muted); font-size: 12.5px; line-height: 1.45;">
          ${existingMatchCount > 0
            ? '• <strong>Nối tiếp thông minh:</strong> Giữ nguyên ' + curCount + ' ca hiện có, chỉ bổ sung <strong>' + newCount + ' ca mới</strong> và hợp nhất thông tin còn thiếu cho ' + existingMatchCount + ' ca đã có. <em>Không bao giờ bị nhân đôi danh sách!</em>'
            : '• Toàn bộ <strong>' + newCount + ' ca</strong> từ file Excel đều là bệnh nhân mới, sẵn sàng nạp nối tiếp.'}
        </div>
      </div>
    `;

    if (btnSmart) {
      btnSmart.onclick = () => {
        this.closeImportModal();
        this.executeSmartAppend(imported, options);
      };
    }

    if (btnReplace) {
      btnReplace.onclick = () => {
        this.closeImportModal();
        this.executeImport(imported, { isReplace: true, sourceName: options.sourceName });
      };
    }

    modal.classList.add('active');
  }

  findMatchingPatient(item, targetList) {
    if (!item || !targetList || targetList.length === 0) return null;
    const pCtrl = window.patientController;
    const normItemName = pCtrl?.normalizePatientName ? pCtrl.normalizePatientName(item.ten) : (item.ten || '').trim().toLowerCase();
    if (!normItemName || normItemName === 'bệnh nhân mới') return null;

    const itemYear = pCtrl?.extractBirthYear ? pCtrl.extractBirthYear(item.nam_sinh_tuoi) : null;
    const itemRoom = (item.phong_giuong || '').trim().toLowerCase();

    for (const p of targetList) {
      if (p.is_deleted) continue;
      const normPName = pCtrl?.normalizePatientName ? pCtrl.normalizePatientName(p.ten) : (p.ten || '').trim().toLowerCase();
      if (normPName !== normItemName) continue;

      const pYear = pCtrl?.extractBirthYear ? pCtrl.extractBirthYear(p.nam_sinh_tuoi) : null;
      const pRoom = (p.phong_giuong || '').trim().toLowerCase();

      // 1. Khớp theo Năm sinh (nếu cả 2 bên đều có năm sinh)
      if (itemYear && pYear && itemYear === pYear) return p;

      // 2. Khớp theo Buồng/Giường (nếu cùng tên và cùng buồng giường)
      if (itemRoom && pRoom && itemRoom === pRoom) return p;

      // 3. Khớp chuỗi năm sinh tuổi thô nếu giống hệt
      if (item.nam_sinh_tuoi && p.nam_sinh_tuoi && item.nam_sinh_tuoi.trim().toLowerCase() === p.nam_sinh_tuoi.trim().toLowerCase()) return p;

      // 4. Nếu cả 2 đều không có năm sinh nhưng tên trùng khớp trong cùng khoa
      if (!itemYear && !pYear) return p;
    }
    return null;
  }

  async executeSmartAppend(imported, options = {}) {
    const pCtrl = window.patientController;
    if (!pCtrl) {
      this.isImportingExcel = false;
      return;
    }

    const curList = [...(pCtrl.patientList || [])];
    let newAddedCount = 0;
    let mergedCount = 0;

    for (const item of imported) {
      const existing = this.findMatchingPatient(item, curList);
      if (existing) {
        // Hợp nhất thông tin nếu ca hiện tại bị thiếu
        let updated = false;
        if (!existing.chan_doan && item.chan_doan) { existing.chan_doan = item.chan_doan; updated = true; }
        if (!existing.nam_sinh_tuoi && item.nam_sinh_tuoi) { existing.nam_sinh_tuoi = item.nam_sinh_tuoi; updated = true; }
        if ((!existing.phong_giuong || existing.phong_giuong === 'D1.01-1') && item.phong_giuong && item.phong_giuong !== 'D1.01-1') {
          existing.phong_giuong = item.phong_giuong;
          updated = true;
        }
        if (!existing.cls && item.cls) {
          existing.cls = item.cls;
          existing.cls_hien_co = item.cls_hien_co || existing.cls_hien_co;
          existing.cls_can_lam = item.cls_can_lam || existing.cls_can_lam;
          updated = true;
        }
        if (!existing.y_lenh && item.y_lenh) { existing.y_lenh = item.y_lenh; updated = true; }
        if (!existing.them_thuoc && item.them_thuoc) { existing.them_thuoc = item.them_thuoc; updated = true; }
        if (!existing.doctor_name && item.doctor_name) { existing.doctor_name = item.doctor_name; updated = true; }

        if (updated) {
          existing.updated_at = new Date().toISOString();
        }
        mergedCount++;
      } else {
        // Ca mới hoàn toàn
        curList.push(item);
        newAddedCount++;
      }
    }

    pCtrl.patientList = curList;
    pCtrl.sortPatientsByRoomAndBed(false, false);
    pCtrl.saveLocalCache();
    pCtrl.render();

    if (window.updateSaveStatus) {
      window.updateSaveStatus('⏳ Đang đồng bộ danh sách lên Cloud...');
    }

    try {
      const syncRes = await window.supabaseService.syncBatchPatients(pCtrl.patientList, null, { isFullReplace: false });
      const toastMsg = newAddedCount > 0
        ? `✓ Đã thêm ${newAddedCount} người bệnh mới` + (mergedCount > 0 ? ` (hợp nhất ${mergedCount} ca đã có, không trùng lặp)` : '') + '!'
        : `✓ Đã rà soát & cập nhật ${mergedCount} người bệnh đã có (không có ca mới phát sinh)!`;

      if (syncRes && syncRes.offlineSaved) {
        window.showToast(toastMsg + ' (Lưu an toàn offline)');
      } else if (syncRes && syncRes.error) {
        window.showToast(`⚠️ ${toastMsg} (Lỗi Cloud: ${syncRes.error.message || 'Lỗi mạng'})`);
      } else {
        window.showToast(toastMsg + ' Đã đồng bộ Cloud.');
      }
    } catch (syncErr) {
      window.showToast(`✓ Đã cập nhật danh sách vào bộ nhớ thiết bị!`);
    } finally {
      this.isImportingExcel = false;
      this.pendingImportData = null;
    }
  }

  async executeImport(imported, { isReplace = true, sourceName = 'file Excel' } = {}) {
    const pCtrl = window.patientController;
    if (!pCtrl) {
      this.isImportingExcel = false;
      return;
    }

    pCtrl.patientList = imported;
    pCtrl.sortPatientsByRoomAndBed(false, false);
    pCtrl.saveLocalCache();
    pCtrl.render();

    if (window.updateSaveStatus) {
      window.updateSaveStatus('⏳ Đang đồng bộ danh sách lên Cloud...');
    }

    try {
      const syncRes = await window.supabaseService.syncBatchPatients(pCtrl.patientList, null, { isFullReplace: true });
      if (syncRes && syncRes.offlineSaved) {
        window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh từ ${sourceName}! (Lưu an toàn offline)`);
      } else if (syncRes && syncRes.error) {
        window.showToast(`⚠️ Đã nạp ${imported.length} người bệnh (Lỗi Cloud: ${syncRes.error.message || 'Lỗi mạng'})`);
      } else {
        window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh từ ${sourceName} và đồng bộ lên Cloud!`);
      }
    } catch (syncErr) {
      window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh vào bộ nhớ thiết bị!`);
    } finally {
      this.isImportingExcel = false;
      this.pendingImportData = null;
    }

    // Kiểm tra thông báo nếu file gốc bản thân nó đã chứa các hàng trùng lặp nội bộ
    setTimeout(() => {
      const dupGroups = pCtrl?.findDuplicatePatientGroups?.() || [];
      if (dupGroups.length > 0) {
        const totalDup = dupGroups.reduce((acc, g) => acc + g.patients.length, 0);
        if (confirm(`⚠️ Phát hiện ${dupGroups.length} nhóm người bệnh (${totalDup} ca) trùng Họ tên & Năm sinh ngay trong file Excel gốc.\n\nBạn có muốn mở bảng "Lọc trùng bệnh nhân" để kiểm tra và xử lý ngay không?`)) {
          pCtrl?.openDuplicateModal?.();
        }
      }
    }, 600);
  }

  closeImportModal() {
    const modal = document.getElementById('excelImportModal');
    if (modal) modal.classList.remove('active');
    this.isImportingExcel = false;
    this.pendingImportData = null;
  }

  openAbbreviationModal() {
    const modal = document.getElementById('abbreviationModal');
    if (!modal) return;
    this.currentAbbrCategory = 'all';
    this.currentAbbrQuery = '';

    // Đóng form thêm nếu đang mở
    this.closeAbbrCustomForm();

    const searchInput = document.getElementById('abbrSearchInput');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', (e) => {
        this.currentAbbrQuery = e.target.value.toLowerCase().trim();
        this.renderAbbreviationList();
      });
    }

    const tabGroup = document.getElementById('abbrCategoryTabs');
    if (tabGroup && !tabGroup.dataset.bound) {
      tabGroup.dataset.bound = 'true';
      tabGroup.querySelectorAll('.btn-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          tabGroup.querySelectorAll('.btn-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentAbbrCategory = btn.dataset.cat;
          this.renderAbbreviationList();
        });
      });
    }

    if (searchInput) searchInput.value = '';
    tabGroup?.querySelectorAll('.btn-filter-pill').forEach(b => {
      if (b.dataset.cat === 'all') b.classList.add('active');
      else b.classList.remove('active');
    });

    this.updateCustomAbbrCount();
    this.renderAbbreviationList();
    modal.classList.add('active');
  }

  closeAbbreviationModal() {
    const modal = document.getElementById('abbreviationModal');
    if (modal) modal.classList.remove('active');
    this.closeAbbrCustomForm();
  }

  updateCustomAbbrCount() {
    const customList = CONFIG.CUSTOM_ABBREVIATIONS || [];
    const countEl = document.getElementById('abbrCustomCount');
    if (countEl) countEl.innerText = customList.length;

    const resetBtn = document.getElementById('btnResetCustomAbbr');
    if (resetBtn) {
      resetBtn.style.display = customList.length > 0 ? 'inline-block' : 'none';
    }
  }

  toggleAbbrCustomForm(editItem = null) {
    const card = document.getElementById('abbrCustomFormCard');
    if (!card) return;

    if (editItem) {
      // Chế độ chỉnh sửa
      document.getElementById('abbrFormTitle').innerText = '✏️ Chỉnh Sửa Từ Viết Tắt Cá Nhân';
      document.getElementById('customAbbrEditId').value = editItem.id;
      document.getElementById('customAbbrInput').value = editItem.abbr || '';
      document.getElementById('customAbbrFullInput').value = editItem.full || '';
      document.getElementById('customAbbrDescInput').value = editItem.desc || '';
      document.getElementById('customAbbrCategorySelect').value = editItem.category || 'Chẩn đoán thường gặp';
      card.style.display = 'block';
      document.getElementById('customAbbrInput').focus();
    } else {
      if (card.style.display === 'block' && !document.getElementById('customAbbrEditId').value) {
        card.style.display = 'none';
      } else {
        // Mở form thêm mới
        document.getElementById('abbrFormTitle').innerText = '➕ Thêm Từ Viết Tắt Cá Nhân Mới';
        document.getElementById('customAbbrEditId').value = '';
        document.getElementById('customAbbrInput').value = '';
        document.getElementById('customAbbrFullInput').value = '';
        document.getElementById('customAbbrDescInput').value = '';
        document.getElementById('customAbbrCategorySelect').value = 'Chẩn đoán thường gặp';
        card.style.display = 'block';
        document.getElementById('customAbbrInput').focus();
      }
    }
  }

  closeAbbrCustomForm() {
    const card = document.getElementById('abbrCustomFormCard');
    if (card) {
      card.style.display = 'none';
      document.getElementById('customAbbrEditId').value = '';
    }
  }

  saveCustomAbbr() {
    const editId = document.getElementById('customAbbrEditId').value.trim();
    const abbr = document.getElementById('customAbbrInput').value.trim().toLowerCase();
    const full = document.getElementById('customAbbrFullInput').value.trim();
    const desc = document.getElementById('customAbbrDescInput').value.trim();
    const category = document.getElementById('customAbbrCategorySelect').value;

    if (!abbr) {
      alert('Vui lòng nhập từ viết tắt (Ví dụ: ksc, bno...)');
      document.getElementById('customAbbrInput').focus();
      return;
    }

    if (!full) {
      alert('Vui lòng nhập thuật ngữ/cụm từ đầy đủ khi mở rộng!');
      document.getElementById('customAbbrFullInput').focus();
      return;
    }

    let list = [...(CONFIG.CUSTOM_ABBREVIATIONS || [])];

    if (editId) {
      const idx = list.findIndex(x => x.id === editId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], abbr, full, desc, category, updated_at: new Date().toISOString() };
      }
    } else {
      // Kiểm tra trùng lặp
      const existing = list.find(x => x.abbr.toLowerCase() === abbr);
      if (existing) {
        if (!confirm(`Từ viết tắt "${abbr}" đã tồn tại. Bạn có muốn ghi đè nội dung mới không?`)) {
          return;
        }
        existing.full = full;
        existing.desc = desc;
        existing.category = category;
        existing.updated_at = new Date().toISOString();
      } else {
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'abbr_' + Date.now();
        list.unshift({
          id: newId,
          abbr,
          full,
          desc,
          category,
          created_at: new Date().toISOString()
        });
      }
    }

    CONFIG.saveCustomAbbreviations(list);
    this.closeAbbrCustomForm();
    this.updateCustomAbbrCount();
    this.renderAbbreviationList();

    if (window.showToast) {
      window.showToast(`✓ Đã lưu từ viết tắt cá nhân: "${abbr}" ➔ "${full}"`);
    }
  }

  editCustomAbbr(id) {
    const list = CONFIG.CUSTOM_ABBREVIATIONS || [];
    const item = list.find(x => x.id === id);
    if (!item) return;
    this.toggleAbbrCustomForm(item);
  }

  deleteCustomAbbr(id) {
    const list = CONFIG.CUSTOM_ABBREVIATIONS || [];
    const item = list.find(x => x.id === id);
    if (!item) return;

    if (confirm(`Xác nhận xóa từ viết tắt cá nhân "${item.abbr}" (${item.full})?`)) {
      const updatedList = list.filter(x => x.id !== id);
      CONFIG.saveCustomAbbreviations(updatedList);
      this.updateCustomAbbrCount();
      this.renderAbbreviationList();

      if (window.showToast) {
        window.showToast(`✓ Đã xóa từ viết tắt "${item.abbr}"`);
      }
    }
  }

  resetCustomAbbrToDefault() {
    if (confirm('Xác nhận xóa TOÀN BỘ từ viết tắt cá nhân đã lưu trên máy này?')) {
      CONFIG.saveCustomAbbreviations([]);
      this.updateCustomAbbrCount();
      this.renderAbbreviationList();
      if (window.showToast) {
        window.showToast('✓ Đã khôi phục từ điển viết tắt về mặc định!');
      }
    }
  }

  renderAbbreviationList() {
    const tbody = document.getElementById('abbrTableBody');
    if (!tbody || !CONFIG.ABBREVIATIONS_CATEGORIES) return;

    const cat = this.currentAbbrCategory || 'all';
    const q = this.currentAbbrQuery || '';

    let items = [];

    // 1. Thêm các từ viết tắt cá nhân
    const customList = CONFIG.CUSTOM_ABBREVIATIONS || [];
    customList.forEach(item => {
      items.push({
        id: item.id,
        abbr: item.abbr,
        full: item.full,
        desc: item.desc,
        category: item.category || 'Cá nhân',
        isCustom: true
      });
    });

    // 2. Thêm các từ viết tắt chuẩn hệ thống
    for (const [categoryName, list] of Object.entries(CONFIG.ABBREVIATIONS_CATEGORIES)) {
      list.forEach(item => {
        // Nếu đã bị cá nhân ghi đè cùng abbr thì không hiển thị dòng hệ thống nữa
        const isOverridden = customList.some(c => c.abbr.toLowerCase() === item.abbr.toLowerCase());
        if (!isOverridden) {
          items.push({
            abbr: item.abbr,
            full: item.full,
            desc: item.desc,
            category: categoryName,
            isCustom: false
          });
        }
      });
    }

    // Lọc theo Chuyên mục
    if (cat === 'custom') {
      items = items.filter(x => x.isCustom);
    } else if (cat !== 'all') {
      items = items.filter(x => x.category === cat);
    }

    // Lọc theo Từ khóa tìm kiếm
    if (q) {
      items = items.filter(item => 
        item.abbr.toLowerCase().includes(q) ||
        item.full.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q))
      );
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px 10px;">Không tìm thấy từ viết tắt nào phù hợp với bộ lọc hiện tại.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          <span class="abbr-code-badge">${this.escape(item.abbr)}</span>
        </td>
        <td>
          <span class="abbr-full-text">${this.escape(item.full)}</span>
        </td>
        <td>
          <span class="abbr-desc-text">${this.escape(item.desc || '')}</span>
        </td>
        <td style="text-align: center;">
          ${item.isCustom ? `
            <div class="abbr-action-btns">
              <span class="badge-source-tag badge-source-custom" title="Từ điển do bạn tự thêm">Cá nhân</span>
              <button type="button" class="btn-abbr-sm" onclick="window.medWardApp.editCustomAbbr('${item.id}')" title="Sửa từ này">✏️</button>
              <button type="button" class="btn-abbr-sm btn-abbr-del" onclick="window.medWardApp.deleteCustomAbbr('${item.id}')" title="Xóa từ này">🗑️</button>
            </div>
          ` : `
            <span class="badge-source-tag badge-source-system" title="Từ điển y khoa chuẩn">Hệ thống</span>
          `}
        </td>
      </tr>
    `).join('');
  }

  setupPWA() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => {
            reg.update();
            console.log('✓ PWA Service Worker Registered', reg);
          })
          .catch(err => console.log('Service Worker failed:', err));
      });
    }
  }
}

// Web Audio API soft clinical chime for realtime notifications
function playRealtimeChime(type = 'normal') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'critical') {
      // Soft emergency alert: two gentle pulses
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      // Gentle clinical chime (warm ding)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  } catch (e) {
    // Audio can fail if blocked before first user gesture; ignore silently
  }
}
window.playRealtimeChime = playRealtimeChime;

// Global Toast Notification System (Multi-card stacking & Realtime alert support)
window.showToast = function(input) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Parse options
  let opts = {};
  if (typeof input === 'string') {
    const isCritical = input.includes('🚨') || input.includes('NẶNG') || input.includes('Báo động');
    const isHandover = input.includes('BÀN GIAO') || input.includes('🔄');
    const isOrder = input.includes('Y lệnh') || input.includes('💊');
    const isLab = input.includes('CLS') || input.includes('⚡');
    opts = {
      message: input,
      title: isCritical ? 'BÁO ĐỘNG ĐỎ LÂM SÀNG' : (isHandover ? 'ĐỒNG BỘ BÀN GIAO' : 'MEDWARD PRO'),
      type: isCritical ? 'critical' : (isHandover ? 'handover' : (isOrder ? 'order' : (isLab ? 'lab' : 'normal'))),
      icon: isCritical ? '🚨' : (isHandover ? '🔄' : (isOrder ? '💊' : (isLab ? '⚡' : 'ℹ️'))),
      duration: isCritical ? 6500 : 4500
    };
  } else if (typeof input === 'object' && input !== null) {
    opts = {
      message: input.message || '',
      title: input.title || 'ĐỒNG BỘ REALTIME',
      type: input.type || 'normal',
      icon: input.icon || (input.type === 'critical' ? '🚨' : (input.type === 'handover' ? '🔄' : (input.type === 'order' ? '💊' : (input.type === 'lab' ? '⚡' : 'ℹ️')))),
      patientId: input.patientId || null,
      actionText: input.actionText || (input.patientId ? 'Xem ca này ➔' : null),
      duration: input.duration || (input.type === 'critical' ? 7000 : 5000)
    };
  }

  // Play audio chime for realtime events
  if (opts.type === 'critical' || opts.type === 'handover' || (opts.title && opts.title.includes('REALTIME'))) {
    playRealtimeChime(opts.type === 'critical' ? 'critical' : 'normal');
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${opts.type || 'normal'}`;

  // Header row
  const headerRow = document.createElement('div');
  headerRow.className = 'toast-header-row';

  const metaTag = document.createElement('span');
  metaTag.className = 'toast-meta-tag';
  metaTag.innerText = opts.title;

  const timeLabel = document.createElement('span');
  timeLabel.className = 'toast-time-label';
  timeLabel.innerText = 'Vừa xong';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', 'Đóng thông báo');
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    dismissToast();
  };

  headerRow.appendChild(metaTag);
  headerRow.appendChild(timeLabel);
  headerRow.appendChild(closeBtn);
  toast.appendChild(headerRow);

  // Content row
  const contentRow = document.createElement('div');
  contentRow.className = 'toast-content-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.innerText = opts.icon;

  const textEl = document.createElement('div');
  textEl.className = 'toast-text';
  textEl.innerText = opts.message;

  contentRow.appendChild(iconEl);
  contentRow.appendChild(textEl);
  toast.appendChild(contentRow);

  // Optional Action button (e.g. "Xem ca này")
  if (opts.actionText && opts.patientId) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast-action-btn';
    actionBtn.innerText = opts.actionText;
    actionBtn.onclick = () => {
      if (window.patientController && typeof window.patientController.flashPatientRow === 'function') {
        window.patientController.flashPatientRow(opts.patientId);
      }
      dismissToast();
    };
    toast.appendChild(actionBtn);
  }

  // Progress countdown bar
  const progressBar = document.createElement('div');
  progressBar.className = 'toast-progress-bar';
  progressBar.style.transition = `transform ${opts.duration}ms linear`;
  progressBar.style.transform = 'scaleX(1)';
  toast.appendChild(progressBar);

  // Trigger shrinking transition after mount
  requestAnimationFrame(() => {
    progressBar.style.transform = 'scaleX(0)';
  });

  // Keep at most 4 toasts visible at a time
  while (container.children.length >= 4) {
    container.removeChild(container.firstChild);
  }

  container.appendChild(toast);

  let timer = null;
  function dismissToast() {
    if (timer) clearTimeout(timer);
    toast.classList.add('toast-leaving');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 220);
  }

  timer = setTimeout(dismissToast, opts.duration);
};

window.updateSaveStatus = function(msg, type = 'saved') {
  const statusEl = document.getElementById('saveStatus');
  if (!statusEl) return;
  statusEl.innerText = msg;
  statusEl.className = 'status-tag highlight';
  if (type === 'saving') {
    statusEl.style.color = '#b45309';
    return;
  }
  statusEl.style.color = '';
  setTimeout(() => {
    const isCloud = window.supabaseService?.isCloudEnabled;
    statusEl.innerText = isCloud ? '🟢 Cloud Realtime kết nối tốt (Đã đồng bộ)' : '🟢 Lưu trữ bộ nhớ thiết bị (Tự động lưu)';
    statusEl.className = 'status-tag';
    statusEl.style.color = '';
  }, 3500);
};

window.handleExcelFileUpload = function(e) {
  if (window.medWardApp && typeof window.medWardApp.handleExcelFileUpload === 'function') {
    return window.medWardApp.handleExcelFileUpload(e);
  }
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  window.medWardApp = new MedWardApp();
});
