// ==============================================================================
// MAIN APPLICATION COORDINATOR - MEDWARD PRO
// ==============================================================================

class MedWardApp {
  constructor() {
    this.viewMode = 'auto'; // 'auto' | 'table' | 'cards'
    this.init();
  }

  init() {
    this.setupDatePickers();
    this.setupMetaHandlers();
    this.bindGlobalEvents();
    this.setupClipboardPaste();
    this.setupPWA();
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
            dateInput.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
            this.saveMeta();
            this.updatePrintDateNote();
          }
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

  toggleViewMode() {
    const tableWrapper = document.getElementById('tableWrapper');
    const cardsContainer = document.getElementById('mobileCardContainer');
    if (!tableWrapper || !cardsContainer) return;

    if (this.viewMode === 'table') {
      this.viewMode = 'cards';
      tableWrapper.style.display = 'none';
      cardsContainer.style.display = 'flex';
      window.showToast?.('📱 Chế độ xem: Thẻ người bệnh');
    } else {
      this.viewMode = 'table';
      tableWrapper.style.display = 'block';
      cardsContainer.style.display = 'none';
      window.showToast?.('💻 Chế độ xem: Bảng đầy đủ');
    }
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

          const syncRes = await window.supabaseService.syncBatchPatients(window.patientController.patientList);
          if (syncRes && syncRes.offlineSaved) {
            alert(`✓ Đã nạp thành công ${imported.length} người bệnh vào bộ nhớ máy!\n(Dữ liệu đã được lưu an toàn, hệ thống sẽ tự động đồng bộ lên Cloud khi có kết nối mạng)`);
          } else if (syncRes && syncRes.error) {
            alert(`⚠️ Đã nạp ${imported.length} người bệnh vào bộ nhớ máy, nhưng gặp lỗi khi lưu lên Cloud: ${syncRes.error.message || 'Lỗi mạng'}\n\nVui lòng kiểm tra biểu tượng đám mây ☁️ để đồng bộ sang điện thoại.`);
          } else {
            alert(`✓ Đã nạp thành công ${imported.length} người bệnh và đồng bộ tức thì lên Cloud!\nĐiện thoại và máy khác mở web sẽ thấy ngay lập tức.`);
          }
        }
      }
    });
  }

  handleExcelFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      alert("Không tìm thấy thư viện đọc Excel. Bạn có thể mở file Excel, bấm Ctrl+A rồi Ctrl+C, sau đó quay lại trang này bấm Ctrl+V để nạp trực tiếp!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        const imported = window.patientController.parseExcelRawRows(rawRows);
        if (imported.length === 0) {
          alert('Không tìm thấy hàng dữ liệu người bệnh phù hợp trong file Excel.');
          return;
        }

        const curCount = window.patientController.patientList.length;
        let replace = false;
        if (curCount > 0) {
          replace = confirm(`Đã đọc được ${imported.length} người bệnh. Bạn muốn THAY THẾ danh sách hiện tại (OK) hay NỐI TIẾP vào danh sách (Cancel)?`);
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

        const syncRes = await window.supabaseService.syncBatchPatients(window.patientController.patientList);
        if (syncRes && syncRes.offlineSaved) {
          alert(`✓ Đã nạp thành công ${imported.length} bệnh nhân vào bộ nhớ máy!\n(Dữ liệu đã được lưu an toàn, hệ thống sẽ tự động đồng bộ lên Cloud khi có kết nối mạng)`);
        } else if (syncRes && syncRes.error) {
          alert(`⚠️ Đã nạp ${imported.length} bệnh nhân vào bộ nhớ máy, nhưng gặp lỗi lưu lên Cloud: ${syncRes.error.message || 'Lỗi mạng'}\n\nVui lòng kiểm tra biểu tượng đám mây ☁️ để đồng bộ sang điện thoại.`);
        } else {
          alert(`✓ Đã nạp thành công ${imported.length} bệnh nhân và đồng bộ tức thì lên Cloud!\nĐiện thoại và máy khác mở web sẽ thấy ngay lập tức.`);
        }
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      } finally {
        e.target.value = '';
      }
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

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  window.medWardApp = new MedWardApp();
});
