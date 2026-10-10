// ==============================================================================
// MAIN APPLICATION COORDINATOR - MEDWARD PRO
// ==============================================================================

class MedWardApp {
  constructor() {
    this.viewMode = 'auto'; // 'auto' | 'table' | 'cards'
    this.init();
  }

  init() {
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
      }
    });
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

// Global UI helper functions
window.showToast = function(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
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
