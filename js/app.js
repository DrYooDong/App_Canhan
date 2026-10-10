// ==============================================================================
// MAIN APPLICATION COORDINATOR - MEDWARD PRO
// ==============================================================================

class MedWardApp {
  constructor() {
    this.viewMode = 'auto'; // 'auto' | 'table' | 'cards'
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

        // Ctrl + P: In ấn lâm sàng
        if (lowerKey === 'p') {
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl + Shift + P: In cho điều dưỡng
            window.patientController?.openNursePrintModal?.();
          } else {
            // Ctrl + P: Nếu đang mở modal điều dưỡng thì in phiếu điều dưỡng, ngược lại in bản A4
            const nurseModal = document.getElementById('nursePrintModal');
            if (nurseModal && nurseModal.classList.contains('active')) {
              window.patientController?.printNurseWorklist?.();
            } else {
              this.updatePrintDateNote();
              window.print();
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

    if (dateInput && !dateInput.value) {
      dateInput.value = this.formatToDMY(new Date());
    }

    if (nativePicker && dateInput) {
      nativePicker.addEventListener('change', () => {
        if (nativePicker.value) {
          const parts = nativePicker.value.split('-');
          if (parts.length === 3) {
            const newDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
            dateInput.value = newDateStr;
            this.saveMeta();
            this.updatePrintDateNote();
            if (window.patientController && typeof window.patientController.changeReportDate === 'function') {
              window.patientController.changeReportDate(newDateStr);
            }
          }
        }
      });

      dateInput.addEventListener('change', () => {
        const val = dateInput.value.trim();
        if (val.length >= 8 && window.patientController && typeof window.patientController.changeReportDate === 'function') {
          window.patientController.changeReportDate(val);
        }
      });

      dateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          dateInput.blur();
        }
      });
    }

    this.updatePrintDateNote();
  }

  openCalendarPicker() {
    const nativePicker = document.getElementById('nativeDatePicker');
    if (!nativePicker) return;
    if (nativePicker.showPicker) {
      nativePicker.showPicker();
    } else {
      nativePicker.focus();
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
        const meta = JSON.parse(savedMetaStr);
        if (meta.date && document.getElementById('reportDate')) {
          document.getElementById('reportDate').value = meta.date;
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
        const imported = window.patientController.parseExcelRawRows(matrix);

        if (imported.length > 0) {
          e.preventDefault();
          const curCount = window.patientController.patientList.length;
          let replace = false;

          if (curCount > 0) {
            replace = confirm(`Phát hiện dữ liệu Excel gồm ${imported.length} người bệnh. Bạn muốn THAY THẾ danh sách hiện tại (OK) hay NỐI TIẾP thêm (Cancel)?`);
          } else {
            replace = true;
          }

          if (replace) {
            window.patientController.patientList = imported;
          } else {
            window.patientController.patientList = window.patientController.patientList.concat(imported);
          }

          window.patientController.sortPatientsByRoomAndBed(false, false);
          window.patientController.saveLocalCache();
          window.patientController.render();

          if (window.updateSaveStatus) {
            window.updateSaveStatus('⏳ Đang đồng bộ danh sách lên Cloud...');
          }

          try {
            const syncRes = await window.supabaseService.syncBatchPatients(window.patientController.patientList);
            if (syncRes && syncRes.offlineSaved) {
              window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh vào bộ nhớ máy! (Lưu an toàn offline)`);
            } else if (syncRes && syncRes.error) {
              window.showToast(`⚠️ Đã nạp ${imported.length} người bệnh vào bộ nhớ máy (Lỗi Cloud: ${syncRes.error.message || 'Lỗi mạng'})`);
            } else {
              window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh và đồng bộ lên Cloud!`);
            }
          } catch (syncErr) {
            window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh vào bộ nhớ thiết bị!`);
          }
        }
      }
    });
  }

  handleExcelFileUpload(e) {
    if (window.authController && !window.authController.isLoggedIn) {
      const gateOverlay = document.getElementById('loginGateOverlay');
      if (gateOverlay && gateOverlay.style.display !== 'none') {
        window.authController?.showGateOverlay?.();
        e.target.value = '';
        return;
      } else {
        window.authController.isLoggedIn = true;
      }
    }

    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      window.showToast("⚠️ Thư viện đọc file Excel chưa sẵn sàng. Bạn có thể sao chép bảng từ Excel rồi bấm Ctrl+V để dán trực tiếp!");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          window.showToast('⚠️ File Excel không có bảng tính (sheet) nào!');
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
          const parsed = window.patientController.parseExcelRawRows(rawRows);
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
            imported = window.patientController.parseExcelRawRows(rawRows);
          }
        }

        if (imported.length === 0) {
          window.showToast('⚠️ Không tìm thấy hàng dữ liệu người bệnh phù hợp trong file Excel. Vui lòng kiểm tra lại cột Họ tên!');
          return;
        }

        const curCount = window.patientController.patientList.length;
        let replace = false;
        if (curCount > 0) {
          replace = confirm(`Đã đọc được ${imported.length} người bệnh từ sheet "${chosenSheetName}". Bạn muốn THAY THẾ danh sách hiện tại (OK) hay NỐI TIẾP vào danh sách (Cancel)?`);
        } else {
          replace = true;
        }

        if (replace) {
          window.patientController.patientList = imported;
        } else {
          window.patientController.patientList = window.patientController.patientList.concat(imported);
        }

        window.patientController.sortPatientsByRoomAndBed(false, false);
        window.patientController.saveLocalCache();
        window.patientController.render();

        if (window.updateSaveStatus) {
          window.updateSaveStatus('⏳ Đang đồng bộ danh sách lên Cloud...');
        }

        try {
          const syncRes = await window.supabaseService.syncBatchPatients(window.patientController.patientList);
          if (syncRes && syncRes.offlineSaved) {
            window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh từ "${file.name}"! (Lưu an toàn offline)`);
          } else if (syncRes && syncRes.error) {
            window.showToast(`⚠️ Đã nạp ${imported.length} người bệnh vào bộ nhớ máy (Lỗi Cloud: ${syncRes.error.message || 'Lỗi mạng'})`);
          } else {
            window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh từ file "${file.name}"!`);
          }
        } catch (syncErr) {
          window.showToast(`✓ Đã nạp thành công ${imported.length} người bệnh vào bộ nhớ thiết bị!`);
        }
      } catch (err) {
        console.error('Lỗi nạp file Excel:', err);
        window.showToast('⚠️ Lỗi đọc file Excel: ' + (err.message || 'File không hợp lệ'));
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      window.showToast('⚠️ Không thể đọc file. Vui lòng thử lại!');
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  openAbbreviationModal() {
    const modal = document.getElementById('abbreviationModal');
    if (!modal) return;
    this.currentAbbrCategory = 'all';
    this.currentAbbrQuery = '';

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

    this.renderAbbreviationList();
    modal.classList.add('active');
  }

  closeAbbreviationModal() {
    const modal = document.getElementById('abbreviationModal');
    if (modal) modal.classList.remove('active');
  }

  renderAbbreviationList() {
    const tbody = document.getElementById('abbrTableBody');
    if (!tbody || !CONFIG.ABBREVIATIONS_CATEGORIES) return;

    const cat = this.currentAbbrCategory || 'all';
    const q = this.currentAbbrQuery || '';

    let items = [];
    for (const [categoryName, list] of Object.entries(CONFIG.ABBREVIATIONS_CATEGORIES)) {
      if (cat === 'all' || cat === categoryName) {
        list.forEach(item => {
          items.push({ ...item, category: categoryName });
        });
      }
    }

    if (q) {
      items = items.filter(item => 
        item.abbr.toLowerCase().includes(q) ||
        item.full.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q))
      );
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px 10px;">Không tìm thấy từ viết tắt nào khớp với "${q}"</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          <span class="abbr-code-badge">${item.abbr}</span>
        </td>
        <td>
          <span class="abbr-full-text">${item.full}</span>
        </td>
        <td>
          <span class="abbr-desc-text">${item.desc || ''}</span>
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
