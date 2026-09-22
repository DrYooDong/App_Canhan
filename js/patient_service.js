// ==============================================================================
// PATIENT MANAGEMENT SERVICE & CLINICAL HANDOVER CONTROLLER
// MedWard Pro - Bệnh viện Đa khoa Khu vực Thủ Đức
// ==============================================================================

class PatientController {
  constructor() {
    this.patientList = [];
    this.isGroupedByRoom = true;
    this.currentFilterQuery = '';
    this.currentDoctorFilter = localStorage.getItem('medward_doctor_filter') || 'my_patients';
    this.autoSaveTimers = {};

    this.init();
  }

  async init() {
    this.loadSettings();
    await this.reloadFromSource();
    this.setupRealtimeListener();
  }

  loadSettings() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (typeof s.isGroupedByRoom === 'boolean') {
          this.isGroupedByRoom = s.isGroupedByRoom;
        }
      } catch (e) {}
    }
  }

  saveSettings() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify({
      isGroupedByRoom: this.isGroupedByRoom
    }));
  }

  setupRealtimeListener() {
    // Nhận thông báo Realtime từ Supabase khi thiết bị khác thay đổi
    if (window.supabaseService) {
      window.supabaseService.onRealtimeUpdate(async (payload) => {
        console.log('🔄 Bệnh nhân được cập nhật từ thiết bị khác:', payload);
        await this.reloadFromSource(false);
        this.render();
        if (window.showToast) {
          window.showToast('📡 Dữ liệu vừa được đồng bộ từ thiết bị khác!');
        }
      });
    }
  }

  async reloadFromSource(showNotice = true) {
    const data = await window.supabaseService.fetchPatients();
    this.patientList = data || [];

    // Tự động chuẩn hóa phòng/giường thành dạng ngắn gọn (VD: D1.14-3)
    let cleaned = false;
    this.patientList.forEach(p => {
      if (p.phong_giuong) {
        const compact = this.cleanRoomBedString(p.phong_giuong);
        if (compact !== p.phong_giuong) {
          p.phong_giuong = compact;
          cleaned = true;
        }
      }
      // Gán doctor_name từ handover_by nếu chưa có
      if (!p.doctor_name && p.handover_by) {
        p.doctor_name = p.handover_by;
      }
    });

    if (cleaned) {
      this.saveLocalCache();
    }

    this.updateDoctorFilterDropdown();
    this.render();

    if (showNotice && window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã tải dữ liệu bệnh nhân');
    }
  }

  saveLocalCache() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(this.patientList));
  }

  // ==============================================================================
  // CHUẨN HÓA PHÒNG / GIƯỜNG NGẮN GỌN (VD: D1.14 - G03 -> D1.14-3, Phòng 14 Giường 3 -> 14-3)
  // ==============================================================================
  cleanRoomBedString(str) {
    if (!str) return '';
    let s = String(str).trim();

    // 1. Loại bỏ tiền tố khoa như NHIEM, KHOA NHIEM, NHIEMCLY
    s = s.replace(/^(?:KHOA\s*)?NHI[ỄE]M(?=CLY|\d|[A-Za-z])/i, '');
    s = s.replace(/^\s*[-_]\s*/, '').trim();

    // 2. Định dạng chuẩn: Buồng/Phòng - Giường -> Phòng-Giường
    // Khớp: D1.14 - G03, D1.14 - 3, Phòng 14 - Giường 03, P.14 - G.03, CLY13 - G01, 14-03
    const match = s.match(/^(?:(?:Phòng|Buồng|P\.?)\s*)?([A-Za-z0-9.]+)\s*[-–—/]\s*(?:(?:Giường|G\.?)\s*)?([0-9A-Za-z]+)$/i);
    if (match) {
      let room = match[1].trim();
      let bed = match[2].trim();
      // Bỏ số 0 đầu giường (03 -> 3, 01 -> 1)
      if (/^0+[1-9]\d*$/.test(bed)) {
        bed = bed.replace(/^0+/, '');
      }
      bed = bed.replace(/^G0*([1-9]\d*)$/i, '$1');
      return `${room}-${bed}`;
    }

    // 3. Khớp dạng dính liền: D1.14-G03 hoặc D1.14-03
    const match2 = s.match(/^([A-Za-z0-9.]+)-G?0*([0-9]+)$/i);
    if (match2) {
      return `${match2[1]}-${match2[2]}`;
    }

    // 4. Chỉ có Giường: Giường 03 -> G3
    const match3 = s.match(/^(?:Giường|G\.?)\s*[-_]?\s*0*([0-9]+[A-Za-z]?)$/i);
    if (match3) {
      return `G${match3[1]}`;
    }

    // 5. Chỉ có Phòng: Phòng 14 -> 14
    const match4 = s.match(/^(?:Phòng|Buồng|P\.?)\s*([A-Za-z0-9.]+)$/i);
    if (match4) {
      return match4[1];
    }

    // Dọn dẹp dấu gạch ngang và số 0 thừa
    s = s.replace(/\s*[-–—]\s*/g, '-');
    s = s.replace(/-G0*([1-9]\d*)$/i, '-$1');
    s = s.replace(/-0+([1-9]\d*)$/i, '-$1');
    return s;
  }

  // TÁCH MÃ PHÒNG TỪ CHUỖI PHÒNG-GIƯỜNG (VD: D1.14-3 -> D1.14)
  extractRoomCode(phongGiuongStr) {
    if (!phongGiuongStr) return 'Chưa xếp phòng';
    const str = this.cleanRoomBedString(phongGiuongStr).trim();
    const parts = str.split(/[-–—/]/);
    if (parts.length > 1) {
      return parts[0].trim() || 'Chưa xếp phòng';
    }
    return str || 'Chưa xếp phòng';
  }

  // SẮP XẾP TỰ NHIÊN THEO BUỒNG & GIƯỜNG (NATURAL SORT)
  sortPatientsByRoomAndBed(notify = true, syncCloud = true) {
    this.patientList.sort((a, b) => {
      const roomA = a.phong_giuong || '';
      const roomB = b.phong_giuong || '';
      return roomA.localeCompare(roomB, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });

    this.patientList.forEach((p, i) => p.sort_order = i);
    this.saveLocalCache();
    if (syncCloud && window.supabaseService) {
      window.supabaseService.syncBatchPatients(this.patientList);
    }
    this.render();

    if (notify && window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã sắp xếp danh sách theo thứ tự buồng & giường');
    }
  }

  // ==============================================================================
  // AUTO-SAVE VÀ XỬ LÝ CONTENTEDITABLE CELL
  // ==============================================================================
  handleCellInput(patientId, field, rawValue, el) {
    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx === -1) return;

    // 1. Cập nhật ngay lập tức vào bộ nhớ RAM
    this.patientList[idx][field] = rawValue;
    this.patientList[idx].updated_at = new Date().toISOString();

    // 2. Lưu ngay vào localStorage (phòng ngừa F5/đóng tab)
    this.saveLocalCache();

    // 3. Báo trạng thái đang lưu
    if (window.updateSaveStatus) {
      window.updateSaveStatus('🟡 Đang tự động lưu...', 'saving');
    }

    // 4. Debounce đồng bộ lên Supabase Cloud (800ms sau khi ngừng gõ)
    const timerKey = `${patientId}_${field}`;
    if (this.autoSaveTimers[timerKey]) {
      clearTimeout(this.autoSaveTimers[timerKey]);
    }

    this.autoSaveTimers[timerKey] = setTimeout(async () => {
      delete this.autoSaveTimers[timerKey];
      if (window.supabaseService) {
        await window.supabaseService.savePatient(this.patientList[idx]);
      }
      if (window.updateSaveStatus) {
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        window.updateSaveStatus(`🟢 Đã tự động lưu (${timeStr})`, 'saved');
      }
      if (el) {
        el.classList.add('saved-pulse');
        setTimeout(() => el.classList.remove('saved-pulse'), 700);
      }
    }, 800);
  }

  async handleCellBlur(patientId, field, value, el) {
    const timerKey = `${patientId}_${field}`;
    if (this.autoSaveTimers[timerKey]) {
      clearTimeout(this.autoSaveTimers[timerKey]);
      delete this.autoSaveTimers[timerKey];
    }

    let cleanVal = value.trim();

    // Tự động định dạng phòng/giường gọn gàng
    if (field === 'phong_giuong') {
      cleanVal = this.cleanRoomBedString(cleanVal);
      if (el && el.innerText !== cleanVal) {
        el.innerText = cleanVal;
      }
    } else if (CONFIG.expandMedicalText && (field === 'chan_doan' || field === 'cls' || field === 'y_lenh')) {
      cleanVal = CONFIG.expandMedicalText(cleanVal);
      if (el && el.innerText !== cleanVal) {
        el.innerText = cleanVal;
      }
    }

    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx !== -1) {
      this.patientList[idx][field] = cleanVal;
      this.patientList[idx].updated_at = new Date().toISOString();
      this.saveLocalCache();

      if (window.updateSaveStatus) {
        window.updateSaveStatus('🟡 Đang đồng bộ Cloud...', 'saving');
      }

      if (window.supabaseService) {
        const res = await window.supabaseService.savePatient(this.patientList[idx]);
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        if (res && res.error) {
          if (window.updateSaveStatus) window.updateSaveStatus(`⚠️ Đã lưu offline (${timeStr})`, 'warning');
        } else {
          if (window.updateSaveStatus) window.updateSaveStatus(`🟢 Đã lưu Cloud (${timeStr})`, 'saved');
        }
      }

      if (el) {
        el.classList.add('saved-pulse');
        setTimeout(() => el.classList.remove('saved-pulse'), 700);
      }
    }
  }

  // ==============================================================================
  // BẢNG THEO DÕI RIÊNG CHO TỪNG BÁC SĨ (DOCTOR WORKSPACE)
  // ==============================================================================
  handleDoctorFilterChange(val) {
    this.currentDoctorFilter = val || 'my_patients';
    try {
      localStorage.setItem('medward_doctor_filter', this.currentDoctorFilter);
    } catch (e) {}

    const activeDoc = window.authController?.getActiveDoctor?.() || {
      full_name: document.getElementById('doctorName')?.value || 'Bác sĩ'
    };

    // Cập nhật tiêu đề bảng theo dõi
    const titleEl = document.querySelector('.main-title');
    const subTitleEl = document.querySelector('.sub-title');
    if (titleEl) {
      if (this.currentDoctorFilter === 'all') {
        titleEl.innerText = CONFIG.DEFAULT_META.title;
        if (subTitleEl) subTitleEl.innerText = '(Bảng theo dõi toàn khoa - Tất cả bác sĩ điều trị)';
      } else if (this.currentDoctorFilter === 'my_patients') {
        titleEl.innerText = `BẢNG THEO DÕI BỆNH NHÂN - ${activeDoc.full_name.toUpperCase()}`;
        if (subTitleEl) subTitleEl.innerText = `(Không gian điều trị & Bàn giao trực của ${activeDoc.full_name} • ${activeDoc.department || 'Khoa Nhiễm'})`;
      } else {
        titleEl.innerText = `BẢNG THEO DÕI BỆNH NHÂN - ${this.currentDoctorFilter.toUpperCase()}`;
        if (subTitleEl) subTitleEl.innerText = `(Không gian điều trị & Bàn giao trực của ${this.currentDoctorFilter})`;
      }
    }

    this.render();
  }

  updateDoctorFilterDropdown() {
    const select = document.getElementById('doctorFilterSelect');
    if (!select) return;

    const activeDoc = window.authController?.getActiveDoctor?.() || {
      full_name: document.getElementById('doctorName')?.value || 'BS. CKI Nguyễn Văn An'
    };
    const myDocName = (activeDoc.full_name || '').trim();

    // Thu thập danh sách bác sĩ từ dữ liệu bệnh nhân và user hiện tại
    const docSet = new Set();
    if (myDocName) docSet.add(myDocName);

    this.patientList.forEach(p => {
      const d = (p.doctor_name || p.handover_by || '').trim();
      if (d) docSet.add(d);
    });

    const doctors = Array.from(docSet).filter(Boolean);

    // Đếm số lượng bệnh nhân của từng bác sĩ
    const docCounts = {};
    this.patientList.forEach(p => {
      const d = (p.doctor_name || p.handover_by || '').trim();
      if (d) {
        docCounts[d] = (docCounts[d] || 0) + 1;
      }
    });

    let myCount = 0;
    if (myDocName) {
      myCount = this.patientList.filter(p => {
        const d = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
        return d.includes(myDocName.toLowerCase()) || myDocName.toLowerCase().includes(d);
      }).length;
    }

    let html = `<option value="my_patients">🩺 Bảng theo dõi của tôi: ${this.escape(myDocName)} (${myCount})</option>`;
    html += `<option value="all">🏥 Bảng toàn khoa: Tất cả bác sĩ (${this.patientList.length})</option>`;

    doctors.forEach(doc => {
      if (doc.toLowerCase() !== myDocName.toLowerCase()) {
        const count = docCounts[doc] || 0;
        html += `<option value="${this.escape(doc)}">👨‍⚕️ Bác sĩ: ${this.escape(doc)} (${count})</option>`;
      }
    });

    select.innerHTML = html;

    // Giữ giá trị đã chọn
    if (this.currentDoctorFilter && Array.from(select.options).some(o => o.value === this.currentDoctorFilter)) {
      select.value = this.currentDoctorFilter;
    } else {
      select.value = 'my_patients';
      this.currentDoctorFilter = 'my_patients';
    }
  }

  quickAssignDoctor(patientId, event) {
    if (event) event.stopPropagation();
    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx === -1) return;

    const currentDoc = this.patientList[idx].doctor_name || this.patientList[idx].handover_by || '';
    const activeDoc = window.authController?.getActiveDoctor?.() || {
      full_name: document.getElementById('doctorName')?.value || 'BS. CKI Nguyễn Văn An'
    };

    const newDoc = prompt(
      `Chuyển không gian điều trị cho BN "${this.patientList[idx].ten}":\n(Nhập tên hoặc ID Bác sĩ tiếp nhận)`,
      currentDoc || activeDoc.full_name
    );

    if (newDoc !== null) {
      const cleanDoc = newDoc.trim();
      this.patientList[idx].doctor_name = cleanDoc;
      this.patientList[idx].handover_by = cleanDoc;
      this.saveLocalCache();
      if (window.supabaseService) {
        window.supabaseService.savePatient(this.patientList[idx]);
      }
      this.updateDoctorFilterDropdown();
      this.render();
      if (window.showToast) {
        window.showToast(`✓ Đã chuyển người bệnh sang Bác sĩ: ${cleanDoc || 'Chưa phân công'}`);
      }
    }
  }

  // ==============================================================================
  // TÍNH NĂNG CHUYỂN NGÀY TIẾP THEO (NEXT DAY ROLLOVER)
  // ==============================================================================
  incrementIllnessDay(diagnosis) {
    if (!diagnosis) return '';
    let str = diagnosis;

    // 1. Dạng "ngày X" -> "ngày X+1" (VD: "SXH ngày 4" -> "SXH ngày 5")
    str = str.replace(/(ng[àa]y\s*)(\d+)/gi, (match, prefix, day) => {
      return prefix + (parseInt(day, 10) + 1);
    });

    // 2. Dạng "NX" hoặc "DX" (VD: "VP N3" -> "VP N4", "N1" -> "N2", "D3" -> "D4", "HP N2" -> "HP N3")
    str = str.replace(/\b(N|D|HP|H[ẬA]U PH[ẪA]U N)(\s*)(\d+)\b/gi, (match, prefix, space, day) => {
      return prefix + space + (parseInt(day, 10) + 1);
    });

    return str;
  }

  isDischargedPatient(p) {
    const text = `${p.chan_doan || ''} ${p.y_lenh || ''} ${p.handover_issues || ''} ${p.handover_actions || ''}`.toLowerCase();
    return /ra\s*vi[ệe]n|xu[ấa]t\s*vi[ệe]n|chuy[ểe]n\s*vi[ệe]n|xin\s*v[ềe]|t[ửu]\s*vong/.test(text);
  }

  openNextDayModal() {
    const modal = document.getElementById('nextDayModal');
    if (!modal) return;

    // 1. Tính toán ngày hiện tại và ngày tiếp theo
    const currDateStr = document.getElementById('reportDate')?.value || new Date().toLocaleDateString('vi-VN');
    const currDateSpan = document.getElementById('nextDayCurrentDate');
    if (currDateSpan) currDateSpan.innerText = currDateStr;

    let nextDate = new Date();
    const parts = currDateStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) {
        dt.setDate(dt.getDate() + 1);
        nextDate = dt;
      }
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    const dd = String(nextDate.getDate()).padStart(2, '0');
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const yyyy = nextDate.getFullYear();
    const targetInput = document.getElementById('nextDayTargetDate');
    if (targetInput) targetInput.value = `${dd}/${mm}/${yyyy}`;

    // 2. Render danh sách xem trước
    this.renderNextDayPatientList();

    modal.classList.add('active');
  }

  closeNextDayModal() {
    const modal = document.getElementById('nextDayModal');
    if (modal) modal.classList.remove('active');
  }

  renderNextDayPatientList() {
    const tbody = document.getElementById('nextDayPatientTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const autoInc = document.getElementById('chkAutoIncrementDay')?.checked ?? true;
    const filterDischarged = document.getElementById('chkFilterDischarged')?.checked ?? true;

    let selectedCount = 0;

    this.patientList.forEach((p) => {
      const isDischarged = this.isDischargedPatient(p);
      const shouldSelect = filterDischarged ? !isDischarged : true;
      if (shouldSelect) selectedCount++;

      const newDiag = autoInc ? this.incrementIllnessDay(p.chan_doan) : p.chan_doan;

      const tr = document.createElement('tr');
      tr.className = isDischarged ? 'discharged-row' : '';
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="chk-next-day-patient" data-id="${p.id}" ${shouldSelect ? 'checked' : ''} onchange="window.patientController.updateNextDaySelectedCount()">
        </td>
        <td><strong>${this.escape(p.phong_giuong || '—')}</strong></td>
        <td><strong>${this.escape(p.ten || '—')}</strong></td>
        <td><small>🩺 ${this.escape(p.doctor_name || p.handover_by || 'Chưa phân')}</small></td>
        <td>
          <div class="diag-preview-old">${this.escape(p.chan_doan || '—')}</div>
          <div class="diag-preview-new">➔ ${this.escape(newDiag || '—')}</div>
        </td>
        <td style="text-align: center;">
          ${isDischarged ? '<span class="badge-discharged">Ra viện</span>' : '<span class="badge-inpatient">Nội trú</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });

    const totalEl = document.getElementById('nextDayTotalCount');
    const selEl = document.getElementById('nextDaySelectedCount');
    if (totalEl) totalEl.innerText = this.patientList.length;
    if (selEl) selEl.innerText = selectedCount;
  }

  updateNextDaySelectedCount() {
    const checked = document.querySelectorAll('.chk-next-day-patient:checked').length;
    const selEl = document.getElementById('nextDaySelectedCount');
    if (selEl) selEl.innerText = checked;
  }

  toggleAllNextDayPatients(select) {
    document.querySelectorAll('.chk-next-day-patient').forEach(chk => {
      chk.checked = select;
    });
    this.updateNextDaySelectedCount();
  }

  handleDischargeFilterToggle(checked) {
    this.renderNextDayPatientList();
  }

  async executeNextDayRollover() {
    const selectedCheckboxes = document.querySelectorAll('.chk-next-day-patient:checked');
    if (selectedCheckboxes.length === 0) {
      alert('Vui lòng chọn ít nhất một người bệnh để chuyển sang ngày mới!');
      return;
    }

    const targetDate = document.getElementById('nextDayTargetDate')?.value?.trim();
    if (!targetDate) {
      alert('Vui lòng nhập ngày tiếp theo!');
      return;
    }

    const autoInc = document.getElementById('chkAutoIncrementDay')?.checked ?? true;
    const resetHandover = document.getElementById('chkResetHandover')?.checked ?? true;
    const keepOrders = document.getElementById('chkKeepOrders')?.checked ?? true;

    const selectedIds = new Set(Array.from(selectedCheckboxes).map(c => c.dataset.id));

    // Sao lưu ngày cũ vào lịch sử lưu trữ
    const currDate = document.getElementById('reportDate')?.value || 'Trước ' + targetDate;
    try {
      const archives = JSON.parse(localStorage.getItem('medward_archived_days') || '{}');
      archives[currDate] = {
        date: currDate,
        patients: [...this.patientList],
        archived_at: new Date().toISOString()
      };
      localStorage.setItem('medward_archived_days', JSON.stringify(archives));
    } catch (e) {
      console.warn('Lỗi lưu archive ngày cũ:', e);
    }

    // Xây dựng danh sách bệnh nhân cho ngày mới
    const newPatients = [];
    this.patientList.forEach((p) => {
      if (selectedIds.has(p.id)) {
        const nextP = {
          ...p,
          id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
          phong_giuong: this.cleanRoomBedString(p.phong_giuong),
          chan_doan: autoInc ? this.incrementIllnessDay(p.chan_doan) : p.chan_doan,
          y_lenh: keepOrders ? p.y_lenh : '',
          handover_status: resetHandover ? (p.handover_status === 'critical' ? 'critical' : 'none') : p.handover_status,
          handover_issues: resetHandover && p.handover_status !== 'critical' ? '' : p.handover_issues,
          handover_actions: resetHandover && p.handover_status !== 'critical' ? '' : p.handover_actions,
          sort_order: newPatients.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        newPatients.push(nextP);
      }
    });

    this.patientList = newPatients;
    this.saveLocalCache();

    // Cập nhật ngày báo cáo trên giao diện
    const repDateInput = document.getElementById('reportDate');
    if (repDateInput) repDateInput.value = targetDate;
    const nativeDate = document.getElementById('nativeDatePicker');
    if (nativeDate) {
      const parts = targetDate.split('/');
      if (parts.length === 3) {
        nativeDate.value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Đồng bộ lên Supabase Cloud
    if (window.supabaseService) {
      window.supabaseService.syncBatchPatients(this.patientList);
    }

    this.closeNextDayModal();
    this.updateDoctorFilterDropdown();
    this.render();

    if (window.showToast) {
      window.showToast(`✓ Đã chuyển ${newPatients.length} người bệnh sang ngày ${targetDate}!`);
    }
    if (window.updateSaveStatus) {
      window.updateSaveStatus(`✓ Danh sách ngày mới: ${targetDate} (${newPatients.length} người bệnh)`);
    }
  }

  // ==============================================================================
  // CRUD CƠ BẢN
  // ==============================================================================
  async addPatient(patientData = {}) {
    const activeDoc = window.authController?.getActiveDoctor?.() || {
      full_name: document.getElementById('doctorName')?.value || 'BS. CKI Nguyễn Văn An',
      id: 'doc_annv'
    };
    const targetDoc = (this.currentDoctorFilter && this.currentDoctorFilter !== 'all' && this.currentDoctorFilter !== 'my_patients')
      ? this.currentDoctorFilter
      : (activeDoc.full_name || 'BS. CKI Nguyễn Văn An');

    const newPatient = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      user_id: activeDoc.id || null,
      phong_giuong: this.cleanRoomBedString(patientData.phong_giuong || 'D1.14-1'),
      ten: (patientData.ten || 'BỆNH NHÂN MỚI').trim(),
      nam_sinh_tuoi: (patientData.nam_sinh_tuoi || '').trim(),
      chan_doan: (patientData.chan_doan || '').trim(),
      cls: (patientData.cls || '').trim(),
      y_lenh: (patientData.y_lenh || '').trim(),
      handover_status: patientData.handover_status || CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: patientData.handover_issues || '',
      handover_actions: patientData.handover_actions || '',
      doctor_name: patientData.doctor_name || targetDoc,
      handover_by: patientData.handover_by || targetDoc,
      handover_at: patientData.handover_at || null,
      sort_order: this.patientList.length,
      created_at: new Date().toISOString()
    };

    this.patientList.push(newPatient);
    this.saveLocalCache();
    this.updateDoctorFilterDropdown();
    this.render();

    // Async lưu lên cloud
    await window.supabaseService.savePatient(newPatient);
    return newPatient;
  }

  insertRowAfter(patientId) {
    const idx = this.patientList.findIndex(p => p.id === patientId);
    const baseRoom = idx >= 0 ? this.cleanRoomBedString(this.patientList[idx].phong_giuong) : 'D1.14-1';
    const baseDoc = idx >= 0 ? (this.patientList[idx].doctor_name || this.patientList[idx].handover_by) : '';
    const myDoc = window.authController?.currentUser?.full_name || document.getElementById('doctorName')?.value || 'BS. CKI Nguyễn Văn An';

    const newP = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      phong_giuong: baseRoom,
      ten: 'BỆNH NHÂN MỚI',
      nam_sinh_tuoi: '',
      chan_doan: '',
      cls: '',
      y_lenh: '',
      handover_status: CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: '',
      handover_actions: '',
      doctor_name: baseDoc || myDoc,
      handover_by: baseDoc || myDoc,
      sort_order: idx + 1,
      created_at: new Date().toISOString()
    };

    if (idx >= 0) {
      this.patientList.splice(idx + 1, 0, newP);
    } else {
      this.patientList.push(newP);
    }

    this.saveLocalCache();
    window.supabaseService.syncBatchPatients(this.patientList);
    this.updateDoctorFilterDropdown();
    this.render();
  }

  async updatePatient(patientId, fields) {
    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx === -1) return;

    if (fields.phong_giuong) {
      fields.phong_giuong = this.cleanRoomBedString(fields.phong_giuong);
    }
    if (fields.chan_doan && CONFIG.expandMedicalText) {
      fields.chan_doan = CONFIG.expandMedicalText(fields.chan_doan);
    }
    if (fields.cls && CONFIG.expandMedicalText) {
      fields.cls = CONFIG.expandMedicalText(fields.cls);
    }
    if (fields.y_lenh && CONFIG.expandMedicalText) {
      fields.y_lenh = CONFIG.expandMedicalText(fields.y_lenh);
    }

    const updated = {
      ...this.patientList[idx],
      ...fields,
      updated_at: new Date().toISOString()
    };

    this.patientList[idx] = updated;
    this.saveLocalCache();
    this.render();

    // Async lưu lên cloud
    await window.supabaseService.savePatient(updated);
  }

  async deletePatient(patientId) {
    const patient = this.patientList.find(p => p.id === patientId);
    const pName = patient ? patient.ten : 'người bệnh này';

    if (confirm(`Bạn có chắc chắn muốn xóa bệnh nhân "${pName}" không?`)) {
      this.patientList = this.patientList.filter(p => p.id !== patientId);
      this.saveLocalCache();
      this.updateDoctorFilterDropdown();
      this.render();

      await window.supabaseService.deletePatient(patientId);
      if (window.updateSaveStatus) {
        window.updateSaveStatus('✓ Đã xóa bệnh nhân khỏi danh sách');
      }
    }
  }

  async clearAll() {
    if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách bệnh nhân hiện tại không? Thao tác này không thể hoàn tác.')) {
      this.patientList = [];
      this.saveLocalCache();
      this.updateDoctorFilterDropdown();
      this.render();

      await window.supabaseService.syncBatchPatients([]);
      if (window.updateSaveStatus) {
        window.updateSaveStatus('✓ Đã xóa trắng danh sách');
      }
    }
  }

  // ==============================================================================
  // XỬ LÝ NHẬP EXCEL
  // ==============================================================================
  parseExcelRawRows(rows) {
    if (!rows || rows.length === 0) return [];

    let headerIdx = -1;
    let mapping = {};

    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      const lowerRow = row.map(cell => String(cell).toLowerCase().trim());

      const hasName = lowerRow.some(c => c.includes('họ tên') || c.includes('tên nb') || c.includes('tên người bệnh') || c.includes('bệnh nhân') || c.includes('họ và tên') || c === 'nb');
      const hasRoom = lowerRow.some(c => c.includes('phòng') || c.includes('giường') || c.includes('buồng') || c === 'p' || c === 'g' || c === 'b');
      const hasSTT = lowerRow.some(c => c === 'stt' || c.includes('số thứ tự'));

      if ((hasName && hasRoom) || (hasName && hasSTT)) {
        headerIdx = r;
        break;
      }
    }

    if (headerIdx === -1) {
      headerIdx = rows.findIndex(r => r.some(cell => String(cell).trim().length > 0));
      if (headerIdx === -1) return [];
    }

    const headerRow = rows[headerIdx].map(c => String(c).toLowerCase().trim());
    mapping = {
      phong: headerRow.findIndex(c => c === 'phòng' || c === 'buồng' || c === 'p' || c === 'b' || ((c.includes('phòng') || c.includes('buồng')) && !c.includes('giường'))),
      giuong: headerRow.findIndex(c => c === 'giường' || c === 'g' || (c.includes('giường') && !c.includes('phòng') && !c.includes('buồng'))),
      phong_giuong: headerRow.findIndex(c => c === 'p/g' || c === 'b/g' || c === 'p-g' || c === 'b-g' || ((c.includes('phòng') || c.includes('buồng') || c.includes('p/') || c.includes('b/')) && (c.includes('giường') || c.includes('/g')))),
      ten: headerRow.findIndex(c => c === 'tên' || c === 'nb' || c === 'họ & tên' || c.includes('họ tên') || c.includes('tên nb') || c.includes('tên người bệnh') || c.includes('bệnh nhân') || c.includes('họ và tên')),
      ngay_sinh: headerRow.findIndex(c => c === 'ns' || c === 'dob' || c.includes('ngày sinh') || (c.includes('năm sinh') && !c.includes('tuổi'))),
      tuoi: headerRow.findIndex(c => c === 'tuổi' || c === 'age' || (c.includes('tuổi') && !c.includes('năm sinh'))),
      nam_sinh_tuoi: headerRow.findIndex(c => c === 'ns (tuổi)' || c === 'ns/tuổi' || ((c.includes('năm sinh') || c.includes('year') || c.includes('ns')) && (c.includes('tuổi') || c.includes('age')))),
      chan_doan: headerRow.findIndex(c => c === 'cđ' || c === 'cd' || c === 'a' || c === 'dx' || c.includes('chẩn đoán') || c.includes('(a)') || c.includes('diagnosis')),
      cls: headerRow.findIndex(c => c === 'cls' || c === 'xn' || c === 'lab' || c.includes('cận lâm sàng') || c.includes('xét nghiệm')),
      y_lenh: headerRow.findIndex(c => c === 'yl' || c === 'p' || c === 'rx' || c === 'order' || c.includes('y lệnh') || c.includes('điều trị') || c.includes('(p)') || c.includes('treatment')),
      bac_si: headerRow.findIndex(c => c === 'bs' || c === 'bác sĩ' || c.includes('bác sĩ') || c.includes('bs điều trị'))
    };

    const myDoc = window.authController?.currentUser?.full_name || document.getElementById('doctorName')?.value || 'BS. CKI Nguyễn Văn An';
    const results = [];

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let tenVal = mapping.ten !== -1 ? String(row[mapping.ten] || '').trim() : '';
      if (!tenVal) continue;

      let phongGiuongVal = '';
      if (mapping.phong_giuong !== -1 && row[mapping.phong_giuong]) {
        phongGiuongVal = String(row[mapping.phong_giuong]).trim();
      } else {
        const p = mapping.phong !== -1 ? String(row[mapping.phong] || '').trim() : '';
        const g = mapping.giuong !== -1 ? String(row[mapping.giuong] || '').trim() : '';
        if (p && g) phongGiuongVal = `${p}-${g}`;
        else phongGiuongVal = p || g;
      }

      phongGiuongVal = this.cleanRoomBedString(phongGiuongVal);

      let namSinhTuoiVal = '';
      if (mapping.nam_sinh_tuoi !== -1 && row[mapping.nam_sinh_tuoi]) {
        namSinhTuoiVal = String(row[mapping.nam_sinh_tuoi]).trim();
      } else {
        const ns = mapping.ngay_sinh !== -1 ? String(row[mapping.ngay_sinh] || '').trim() : '';
        const t = mapping.tuoi !== -1 ? String(row[mapping.tuoi] || '').trim() : '';

        let nam = '';
        const yearMatch = ns.match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) nam = yearMatch[1];
        else nam = ns;

        if (nam && t) namSinhTuoiVal = `${nam} (${t})`;
        else if (nam) namSinhTuoiVal = nam;
        else if (t) namSinhTuoiVal = `(${t} tuổi)`;
      }

      let cdVal = mapping.chan_doan !== -1 ? String(row[mapping.chan_doan] || '').trim() : '';
      let clsVal = mapping.cls !== -1 ? String(row[mapping.cls] || '').trim() : '';
      let ylVal = mapping.y_lenh !== -1 ? String(row[mapping.y_lenh] || '').trim() : '';
      let docVal = mapping.bac_si !== -1 ? String(row[mapping.bac_si] || '').trim() : myDoc;

      if (CONFIG.expandMedicalText) {
        cdVal = CONFIG.expandMedicalText(cdVal);
        clsVal = CONFIG.expandMedicalText(clsVal);
        ylVal = CONFIG.expandMedicalText(ylVal);
      }

      results.push({
        id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
        phong_giuong: phongGiuongVal,
        ten: tenVal,
        nam_sinh_tuoi: namSinhTuoiVal,
        chan_doan: cdVal,
        cls: clsVal,
        y_lenh: ylVal,
        doctor_name: docVal,
        handover_by: docVal,
        handover_status: CONFIG.HANDOVER_STATUS.NONE,
        handover_issues: '',
        handover_actions: '',
        sort_order: r
      });
    }

    return results;
  }

  // ==============================================================================
  // LỌC DANH SÁCH BỆNH NHÂN THEO BÁC SĨ (KHÔNG GIAN RIÊNG) VÀ TỪ KHÓA
  // (Đã loại bỏ phân loại bệnh nhân - Tất cả hiển thị cùng không gian)
  // ==============================================================================
  getFilteredPatients() {
    const q = this.currentFilterQuery.toLowerCase().trim();
    const docFilter = this.currentDoctorFilter || 'my_patients';
    const activeDoc = window.authController?.getActiveDoctor?.() || null;
    const myDocName = (activeDoc?.full_name || document.getElementById('doctorName')?.value || '').trim().toLowerCase();
    const myDocId = activeDoc?.id || '';

    return this.patientList.filter(p => {
      // 1. Lọc theo Không Gian Bác Sĩ (Bảng theo dõi riêng)
      if (docFilter && docFilter !== 'all') {
        const pDoc = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
        const pUserId = p.user_id || '';
        if (docFilter === 'my_patients') {
          // Khớp theo user_id hoặc tên bác sĩ
          const matchId = myDocId && pUserId && pUserId === myDocId;
          const matchName = myDocName && (pDoc.includes(myDocName) || myDocName.includes(pDoc));
          if (!matchId && !matchName) return false;
        } else {
          // Khớp theo tên bác sĩ được chọn cụ thể
          const targetLower = docFilter.toLowerCase();
          if (!pDoc.includes(targetLower) && !targetLower.includes(pDoc)) return false;
        }
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (!q) return true;

      return (p.phong_giuong || '').toLowerCase().includes(q) ||
             (p.ten || '').toLowerCase().includes(q) ||
             (p.doctor_name || '').toLowerCase().includes(q) ||
             (p.chan_doan || '').toLowerCase().includes(q) ||
             (p.cls || '').toLowerCase().includes(q) ||
             (p.y_lenh || '').toLowerCase().includes(q) ||
             (p.handover_issues || '').toLowerCase().includes(q) ||
             (p.handover_actions || '').toLowerCase().includes(q);
    });
  }

  // ==============================================================================
  // RENDER GIAO DIỆN CHÍNH
  // ==============================================================================
  render() {
    const filtered = this.getFilteredPatients();

    // Cập nhật bộ đếm
    const totalEl = document.getElementById('patientCount');
    const activeDoc = window.authController?.getActiveDoctor?.() || null;
    const myDocName = (activeDoc?.full_name || '').trim().toLowerCase();
    const myPatientsCount = this.patientList.filter(p => {
      const d = (p.doctor_name || p.handover_by || '').trim().toLowerCase();
      return myDocName && (d.includes(myDocName) || myDocName.includes(d));
    }).length;

    if (totalEl) {
      if (this.currentDoctorFilter === 'my_patients') {
        totalEl.innerHTML = `${filtered.length} <small style="font-weight: normal; font-size: 11px; color: var(--text-muted);">(Khoa: ${this.patientList.length})</small>`;
      } else {
        totalEl.innerText = filtered.length;
      }
    }

    // Cập nhật Header Pill Badge
    if (window.authController && window.authController.updateHeaderPill) {
      window.authController.updateHeaderPill(myPatientsCount, this.patientList.length);
    }

    // Render Bảng Desktop
    this.renderDesktopTable(filtered);

    // Render Thẻ Mobile
    this.renderMobileCards(filtered);

    // Kiểm tra empty state
    const emptyMsg = document.getElementById('emptyMessage');
    if (emptyMsg) {
      emptyMsg.style.display = filtered.length === 0 ? 'block' : 'none';
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderDesktopTable(filtered) {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let lastRoomCode = null;
    const roomCounts = {};
    if (this.isGroupedByRoom) {
      filtered.forEach(item => {
        const rCode = this.extractRoomCode(item.phong_giuong);
        roomCounts[rCode] = (roomCounts[rCode] || 0) + 1;
      });
    }

    filtered.forEach((p, idx) => {
      const roomCode = this.extractRoomCode(p.phong_giuong);

      // Nhóm buồng
      if (this.isGroupedByRoom && (!this.currentFilterQuery || this.currentFilterQuery.length === 0)) {
        if (roomCode !== lastRoomCode) {
          lastRoomCode = roomCode;
          const groupTr = document.createElement('tr');
          groupTr.className = 'room-group-row';
          groupTr.innerHTML = `
            <td colspan="9">
              🚪 BUỒNG: <strong>${this.escape(roomCode)}</strong>
              <span class="room-badge-count">${roomCounts[roomCode] || 1} người bệnh</span>
            </td>
          `;
          tbody.appendChild(groupTr);
        }
      }

      const statusCfg = CONFIG.STATUS_CONFIG[p.handover_status] || CONFIG.STATUS_CONFIG.none;
      const isCritical = p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
      const isPending = p.handover_status === CONFIG.HANDOVER_STATUS.PENDING;

      const tr = document.createElement('tr');
      tr.className = `patient-row ${isCritical ? 'row-critical' : (isPending ? 'row-pending' : '')}`;
      tr.dataset.id = p.id;

      tr.innerHTML = `
        <td class="col-stt">${idx + 1}</td>
        <td class="col-room col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'phong_giuong', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'phong_giuong', this.innerText, this)">${this.escape(p.phong_giuong || '')}</td>
        <td class="col-name col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'ten', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'ten', this.innerText, this)">${this.escape(p.ten || '')}</td>
        <td class="col-birth col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'nam_sinh_tuoi', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'nam_sinh_tuoi', this.innerText, this)">${this.escape(p.nam_sinh_tuoi || '')}</td>
        <td class="col-cd col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'chan_doan', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'chan_doan', this.innerText, this)">${this.escape(p.chan_doan || '')}</td>
        <td class="col-cls col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'cls', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'cls', this.innerText, this)">${this.escape(p.cls || '')}</td>
        <td class="col-yl col-editable" contenteditable="true"
            oninput="window.patientController.handleCellInput('${p.id}', 'y_lenh', this.innerText, this)"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'y_lenh', this.innerText, this)">${this.escape(p.y_lenh || '')}</td>
        <td class="col-handover">
          <button class="icon-status-btn ${statusCfg.badgeClass}" onclick="window.handoverController.openHandoverModal('${p.id}')" data-tooltip="${statusCfg.label}">
            ${statusCfg.icon}
          </button>
          ${p.handover_issues ? `<span class="handover-mini-icon" data-tooltip="${this.escape(p.handover_issues)}">⚠️</span>` : ''}
          <div class="print-handover-view">
            <span class="print-status-tag ${statusCfg.badgeClass}">${statusCfg.label || 'Bình thường'}</span>
            ${p.handover_issues ? `<div class="print-issue-text">⚠️ ${this.escape(p.handover_issues)}</div>` : ''}
          </div>
        </td>
        <td class="col-actions no-print">
          <div class="action-btn-group">
            <button class="btn-icon" data-tooltip="Thêm dòng dưới" onclick="window.patientController.insertRowAfter('${p.id}')">➕</button>
            <button class="btn-icon" data-tooltip="Chi tiết & Chẩn đoán" onclick="window.patientController.openPatientDetailModal('${p.id}')">✏️</button>
            <button class="btn-icon delete" data-tooltip="Xóa người bệnh" onclick="window.patientController.deletePatient('${p.id}')">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderMobileCards(filtered) {
    const container = document.getElementById('mobileCardContainer');
    if (!container) return;
    container.innerHTML = '';

    filtered.forEach((p) => {
      const statusCfg = CONFIG.STATUS_CONFIG[p.handover_status] || CONFIG.STATUS_CONFIG.none;
      const isCritical = p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
      const isPending = p.handover_status === CONFIG.HANDOVER_STATUS.PENDING;

      const card = document.createElement('div');
      card.className = `mobile-patient-card ${isCritical ? 'card-critical' : (isPending ? 'card-pending' : '')}`;
      card.dataset.id = p.id;

      card.innerHTML = `
        <div class="card-header" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-room-badge">
            <span class="icon">🛏️</span>
            <strong>${this.escape(p.phong_giuong || 'Chưa xếp')}</strong>
          </div>
          <button class="icon-status-btn ${statusCfg.badgeClass}" onclick="event.stopPropagation(); window.handoverController.openHandoverModal('${p.id}')" data-tooltip="${statusCfg.label}">
            ${statusCfg.icon}
          </button>
        </div>

        <div class="card-body" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-name-row">
            <h3 class="patient-name">${this.escape(p.ten || 'Chưa đặt tên')}</h3>
            <span class="patient-age">${this.escape(p.nam_sinh_tuoi || '')}</span>
          </div>

          <div class="card-field">
            <span class="field-label">Chẩn đoán:</span>
            <div class="field-content">${this.escape(p.chan_doan || '—')}</div>
          </div>

          <div class="card-field">
            <span class="field-label">CLS:</span>
            <div class="field-content">${this.escape(p.cls || '—')}</div>
          </div>

          <div class="card-field">
            <span class="field-label">Y lệnh:</span>
            <div class="field-content">${this.escape(p.y_lenh || '—')}</div>
          </div>

          ${p.handover_issues || p.handover_actions ? `
            <div class="card-handover-box ${isCritical ? 'critical-box' : ''}">
              <div class="handover-title">🚨 BÀN GIAO TUA TRỰC:</div>
              ${p.handover_issues ? `<div class="handover-text"><strong>Tồn đọng:</strong> ${this.escape(p.handover_issues)}</div>` : ''}
              ${p.handover_actions ? `<div class="handover-text"><strong>Cần làm:</strong> ${this.escape(p.handover_actions)}</div>` : ''}
              ${p.handover_by ? `<div class="handover-meta">BS: ${this.escape(p.handover_by)}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="card-footer-icons">
          <button class="icon-btn btn-ho-mobile" data-tooltip="Bàn giao trực" onclick="window.handoverController.openHandoverModal('${p.id}')">
            🚨
          </button>
          <button class="icon-btn btn-edit-mobile" data-tooltip="Sửa chi tiết" onclick="window.patientController.openPatientDetailModal('${p.id}')">
            ✏️
          </button>
          <button class="icon-btn btn-del-mobile" data-tooltip="Xóa người bệnh" onclick="window.patientController.deletePatient('${p.id}')">
            🗑️
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ==============================================================================
  // MODAL CHI TIẾT NGƯỜI BỆNH
  // ==============================================================================
  insertQuickTag(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (el.value.trim().length > 0) {
      el.value = el.value.trim() + '; ' + text;
    } else {
      el.value = text;
    }
    el.focus();
  }

  openPatientDetailModal(patientId) {
    const p = this.patientList.find(item => item.id === patientId);
    if (!p) return;

    const modal = document.getElementById('patientDetailModal');
    if (!modal) return;

    document.getElementById('editPatientId').value = p.id;
    document.getElementById('editRoomBed').value = p.phong_giuong || '';
    document.getElementById('editFullName').value = p.ten || '';
    document.getElementById('editAgeYear').value = p.nam_sinh_tuoi || '';
    document.getElementById('editDoctorName').value = p.doctor_name || p.handover_by || '';
    document.getElementById('editDiagnosis').value = p.chan_doan || '';
    document.getElementById('editCls').value = p.cls || '';
    document.getElementById('editOrders').value = p.y_lenh || '';
    document.getElementById('editHandoverStatus').value = p.handover_status || CONFIG.HANDOVER_STATUS.NONE;
    document.getElementById('editHandoverIssues').value = p.handover_issues || '';
    document.getElementById('editHandoverActions').value = p.handover_actions || '';

    // Quick tags
    const diagEl = document.getElementById('diagQuickTags');
    if (diagEl && CONFIG.QUICK_TAGS?.DIAGNOSIS) {
      diagEl.innerHTML = CONFIG.QUICK_TAGS.DIAGNOSIS.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editDiagnosis', '${t}')">+ ${t}</button>`
      ).join('');
    }
    const clsEl = document.getElementById('clsQuickTags');
    if (clsEl && CONFIG.QUICK_TAGS?.LABS) {
      clsEl.innerHTML = CONFIG.QUICK_TAGS.LABS.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editCls', '${t}')">+ ${t}</button>`
      ).join('');
    }
    const ordersEl = document.getElementById('ordersQuickTags');
    if (ordersEl && CONFIG.QUICK_TAGS?.ORDERS) {
      ordersEl.innerHTML = CONFIG.QUICK_TAGS.ORDERS.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editOrders', '${t}')">+ ${t}</button>`
      ).join('');
    }

    modal.classList.add('active');
  }

  closePatientDetailModal() {
    const modal = document.getElementById('patientDetailModal');
    if (modal) modal.classList.remove('active');
  }

  savePatientFromDetailModal() {
    const id = document.getElementById('editPatientId').value;
    if (!id) return;

    let cdVal = document.getElementById('editDiagnosis').value.trim();
    let clsVal = document.getElementById('editCls').value.trim();
    let ylVal = document.getElementById('editOrders').value.trim();

    if (CONFIG.expandMedicalText) {
      cdVal = CONFIG.expandMedicalText(cdVal);
      clsVal = CONFIG.expandMedicalText(clsVal);
      ylVal = CONFIG.expandMedicalText(ylVal);
    }

    const docVal = document.getElementById('editDoctorName')?.value?.trim() || '';

    const updateData = {
      phong_giuong: this.cleanRoomBedString(document.getElementById('editRoomBed').value.trim()),
      ten: document.getElementById('editFullName').value.trim(),
      nam_sinh_tuoi: document.getElementById('editAgeYear').value.trim(),
      doctor_name: docVal,
      chan_doan: cdVal,
      cls: clsVal,
      y_lenh: ylVal,
      handover_status: document.getElementById('editHandoverStatus').value,
      handover_issues: document.getElementById('editHandoverIssues').value.trim(),
      handover_actions: document.getElementById('editHandoverActions').value.trim()
    };

    if (docVal && !updateData.handover_by) {
      updateData.handover_by = docVal;
    }

    if (updateData.handover_status !== CONFIG.HANDOVER_STATUS.NONE && updateData.handover_status !== CONFIG.HANDOVER_STATUS.RESOLVED) {
      if (window.authController && window.authController.currentUser) {
        updateData.handover_by = window.authController.currentUser.full_name || docVal || 'Bác sĩ điều trị';
        updateData.handover_at = new Date().toISOString();
      }
    }

    this.updatePatient(id, updateData);
    this.updateDoctorFilterDropdown();
    this.closePatientDetailModal();
    if (window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã cập nhật thông tin người bệnh');
    }
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

window.patientController = new PatientController();
