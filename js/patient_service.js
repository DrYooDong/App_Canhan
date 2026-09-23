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
        
        // Chống dội (Debounce 1000ms) để khi nhận nhiều sự kiện liên tiếp chỉ tải lại 1 lần duy nhất
        if (this.realtimeDebounceTimer) {
          clearTimeout(this.realtimeDebounceTimer);
        }
        
        this.realtimeDebounceTimer = setTimeout(async () => {
          await this.reloadFromSource(false);
          this.render();
          if (window.showToast) {
            window.showToast('📡 Dữ liệu vừa được cập nhật từ Cloud');
          }
        }, 1000);
      });
    }
  }

  async reloadFromSource(showNotice = true) {
    let data = null;
    if (window.supabaseService) {
      try {
        data = await window.supabaseService.fetchPatients();
      } catch (err) {
        console.warn('Lỗi khi tải từ Supabase, chuyển sang cache offline:', err);
      }
    }

    if (!data || data.length === 0) {
      const local = localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      if (local) {
        try {
          data = JSON.parse(local);
        } catch (e) {
          console.error('Lỗi đọc local cache:', e);
        }
      }
    }

    this.patientList = data || [];

    // Tự động chuẩn hóa phòng/giường thành dạng ngắn gọn (VD: D1.14-3) và bổ sung created_at nếu thiếu
    let cleaned = false;
    const nowIso = new Date().toISOString();
    this.patientList.forEach(p => {
      if (p.phong_giuong) {
        const compact = this.cleanRoomBedString(p.phong_giuong);
        if (compact !== p.phong_giuong) {
          p.phong_giuong = compact;
          cleaned = true;
        }
      }
      // Chuẩn hóa Bác sĩ điều trị duy nhất về BS. Nguyễn Hữu Đông
      if (p.doctor_name !== 'BS. Nguyễn Hữu Đông') {
        p.doctor_name = 'BS. Nguyễn Hữu Đông';
        cleaned = true;
      }
      if (!p.handover_by || p.handover_by !== 'BS. Nguyễn Hữu Đông') {
        p.handover_by = 'BS. Nguyễn Hữu Đông';
        cleaned = true;
      }
      // Dọn sạch cột Y lệnh nếu bị dính tên Bác sĩ điều trị do nạp file Excel trước đây
      if (p.y_lenh) {
        const ylLower = p.y_lenh.trim().toLowerCase();
        const isDocName = ylLower.startsWith('bs.') || 
                          ylLower.startsWith('bs ') || 
                          ylLower.startsWith('bác sĩ') || 
                          ylLower.startsWith('bác sỹ') || 
                          ylLower.includes('nguyễn hữu đông') || 
                          ylLower.includes('hữu đông') ||
                          ylLower.includes('bác sĩ điều trị') ||
                          ylLower.includes('bs điều trị') ||
                          ylLower === (p.doctor_name || '').trim().toLowerCase() ||
                          ylLower === (p.handover_by || '').trim().toLowerCase();
        if (isDocName) {
          p.y_lenh = '';
          cleaned = true;
        }
      }
      if (!p.created_at || p.created_at === 'null') {
        p.created_at = nowIso;
        cleaned = true;
      }
      if (!p.updated_at || p.updated_at === 'null') {
        p.updated_at = nowIso;
        cleaned = true;
      }
      this.normalizePatientClsAndOrders(p);
    });

    if (cleaned) {
      this.saveLocalCache();
      // TUYỆT ĐỐI KHÔNG GỌI syncBatchPatients ở đây để tránh vòng lặp đồng bộ vô tận (infinite loop)
    }

    this.updateDoctorFilterDropdown();
    this.render();

    if (showNotice && window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã tải dữ liệu bệnh nhân');
    }
  }

  // Phân tách Cận lâm sàng (Hiện có & Cần làm) và Y lệnh (Y lệnh & Thêm thuốc)
  normalizePatientClsAndOrders(p) {
    if (!p) return;

    // 1. Phân tách Cận lâm sàng thành 2 phần: Hiện có & Cần làm
    let rawCls = (p.cls || '').trim();
    if (rawCls.includes('[Hiện có]:') || rawCls.includes('[Cần làm]:')) {
      const mHienCo = rawCls.match(/\[Hiện có\]:\s*([\s\S]*?)(?=\n\[Cần làm\]:|$)/i);
      const mCanLam = rawCls.match(/\[Cần làm\]:\s*([\s\S]*?)$/i);
      p.cls_hien_co = mHienCo ? mHienCo[1].trim() : '';
      p.cls_can_lam = mCanLam ? mCanLam[1].trim() : '';
    } else if (p.cls_hien_co && (p.cls_hien_co.includes('[Hiện có]:') || p.cls_hien_co.includes('[Cần làm]:'))) {
      const mHienCo = p.cls_hien_co.match(/\[Hiện có\]:\s*([\s\S]*?)(?=\n\[Cần làm\]:|$)/i);
      const mCanLam = p.cls_hien_co.match(/\[Cần làm\]:\s*([\s\S]*?)$/i);
      p.cls_hien_co = mHienCo ? mHienCo[1].trim() : '';
      p.cls_can_lam = mCanLam ? mCanLam[1].trim() : (p.cls_can_lam || '');
    } else if (p.cls_hien_co === undefined && p.cls_can_lam === undefined) {
      p.cls_hien_co = rawCls;
      p.cls_can_lam = '';
    } else {
      p.cls_hien_co = (p.cls_hien_co || '').trim();
      p.cls_can_lam = (p.cls_can_lam || '').trim();
    }

    // 2. Phân tách Y lệnh và Thêm thuốc
    let rawYl = (p.y_lenh || '').trim();
    if (rawYl.includes('[Thêm thuốc]:')) {
      const parts = rawYl.split(/\[Thêm thuốc\]:/i);
      p.y_lenh = (parts[0] || '').trim();
      p.them_thuoc = (parts[1] || '').trim();
    } else if (p.them_thuoc === undefined) {
      p.them_thuoc = '';
    } else {
      p.them_thuoc = (p.them_thuoc || '').trim();
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

    // Nếu sửa CLS Hiện có hoặc Cần làm, tự động cập nhật trường tổng hợp cls
    if (field === 'cls_hien_co' || field === 'cls_can_lam') {
      const hc = (this.patientList[idx].cls_hien_co || '').trim();
      const cl = (this.patientList[idx].cls_can_lam || '').trim();
      if (hc && cl) {
        this.patientList[idx].cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
      } else if (cl) {
        this.patientList[idx].cls = `[Cần làm]: ${cl}`;
      } else {
        this.patientList[idx].cls = hc;
      }
    }

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
    } else if (CONFIG.expandMedicalText && (field === 'chan_doan' || field === 'cls' || field === 'cls_hien_co' || field === 'cls_can_lam' || field === 'y_lenh' || field === 'them_thuoc')) {
      cleanVal = CONFIG.expandMedicalText(cleanVal);
      if (el && el.innerText !== cleanVal) {
        el.innerText = cleanVal;
      }
    }

    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx !== -1) {
      this.patientList[idx][field] = cleanVal;

      if (field === 'cls_hien_co' || field === 'cls_can_lam') {
        const hc = (this.patientList[idx].cls_hien_co || '').trim();
        const cl = (this.patientList[idx].cls_can_lam || '').trim();
        if (hc && cl) {
          this.patientList[idx].cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
        } else if (cl) {
          this.patientList[idx].cls = `[Cần làm]: ${cl}`;
        } else {
          this.patientList[idx].cls = hc;
        }
      }

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
    const isLoggedIn = !!window.authController?.isLoggedIn;
    if (!isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }

    this.currentDoctorFilter = 'my_patients';
    try {
      localStorage.setItem('medward_doctor_filter', 'my_patients');
    } catch (e) {}

    const activeDoc = window.authController?.getActiveDoctor?.();
    const docName = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';

    // Cập nhật tiêu đề bảng theo dõi
    const titleEl = document.querySelector('.main-title');
    const subTitleEl = document.querySelector('.sub-title');
    const wsText = document.getElementById('currentWorkspaceText');
    if (titleEl) {
      titleEl.innerText = CONFIG.DEFAULT_META.title;
      if (subTitleEl) subTitleEl.innerText = `(Không gian điều trị riêng: ${docName} • ${activeDoc?.department || 'Khoa Nhiễm'})`;
      if (wsText) wsText.innerText = docName;
    }

    this.render();
  }

  updateDoctorFilterDropdown() {
    const activeDoc = window.authController?.getActiveDoctor?.();
    const docName = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';
    const subTitleEl = document.querySelector('.sub-title');
    const wsText = document.getElementById('currentWorkspaceText');
    if (subTitleEl) subTitleEl.innerText = `(Không gian điều trị riêng: ${docName} • ${activeDoc?.department || 'Khoa Nhiễm'})`;
    if (wsText) wsText.innerText = docName;
  }

  quickAssignDoctor(patientId, event) {
    if (event) event.stopPropagation();
    const idx = this.patientList.findIndex(p => p.id === patientId);
    if (idx === -1) return;

    const currentDoc = this.patientList[idx].doctor_name || this.patientList[idx].handover_by || '';
    const activeDoc = window.authController?.getActiveDoctor?.();
    const defaultDoc = activeDoc ? activeDoc.full_name : '';

    const newDoc = prompt(
      `Chuyển không gian điều trị cho BN "${this.patientList[idx].ten}":\n(Nhập tên hoặc ID Bác sĩ tiếp nhận)`,
      currentDoc || defaultDoc
    );

    if (newDoc !== null && newDoc.trim()) {
      this.patientList[idx].doctor_name = newDoc.trim();
      this.patientList[idx].handover_by = newDoc.trim();
      this.patientList[idx].updated_at = new Date().toISOString();
      this.saveLocalCache();
      window.supabaseService.savePatient(this.patientList[idx]);
      this.updateDoctorFilterDropdown();
      this.render();
      if (window.showToast) {
        window.showToast(`✓ Đã chuyển BN sang Không gian của ${newDoc.trim()}`);
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
  async openAddPatientModal() {
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }
    const newPatient = await this.addPatient({ ten: '', phong_giuong: '' });
    if (newPatient) {
      this.openPatientDetailModal(newPatient.id);
      setTimeout(() => {
        const roomInput = document.getElementById('editRoomBed');
        if (roomInput) {
          roomInput.focus();
          roomInput.select();
        }
      }, 120);
    }
  }

  async addPatient(patientData = {}) {
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }

    const activeDoc = window.authController?.getActiveDoctor?.();
    const myDocName = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';
    const targetDoc = myDocName;

    const newPatient = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      user_id: activeDoc?.id || null,
      phong_giuong: this.cleanRoomBedString(patientData.phong_giuong || 'D1.14-1'),
      ten: (patientData.ten || 'BỆNH NHÂN MỚI').trim(),
      nam_sinh_tuoi: (patientData.nam_sinh_tuoi || '').trim(),
      chan_doan: (patientData.chan_doan || '').trim(),
      cls: (patientData.cls || '').trim(),
      cls_hien_co: (patientData.cls_hien_co || patientData.cls || '').trim(),
      cls_can_lam: (patientData.cls_can_lam || '').trim(),
      y_lenh: (patientData.y_lenh || '').trim(),
      them_thuoc: (patientData.them_thuoc || '').trim(),
      handover_status: patientData.handover_status || CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: patientData.handover_issues || '',
      handover_actions: patientData.handover_actions || '',
      doctor_name: targetDoc,
      handover_by: targetDoc,
      handover_at: patientData.handover_at || null,
      sort_order: this.patientList.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }

    const idx = this.patientList.findIndex(p => p.id === patientId);
    const baseRoom = idx >= 0 ? this.cleanRoomBedString(this.patientList[idx].phong_giuong) : 'D1.14-1';
    const activeDoc = window.authController?.getActiveDoctor?.();
    const myDoc = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';

    const newP = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      user_id: activeDoc?.id || null,
      phong_giuong: baseRoom,
      ten: 'BỆNH NHÂN MỚI',
      nam_sinh_tuoi: '',
      chan_doan: '',
      cls: '',
      cls_hien_co: '',
      cls_can_lam: '',
      y_lenh: '',
      them_thuoc: '',
      handover_status: CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: '',
      handover_actions: '',
      doctor_name: myDoc,
      handover_by: myDoc,
      sort_order: idx + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }

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
      y_lenh: -1, // Lúc nhập Excel luôn để trống cột Y lệnh theo yêu cầu
      bac_si: headerRow.findIndex(c => c === 'bs' || c === 'bác sĩ' || c === 'bác sỹ' || c.includes('bác sĩ') || c.includes('bác sỹ') || c.includes('bs điều trị') || c.includes('bác sĩ điều trị') || c.includes('điều trị'))
    };

    const activeDoc = window.authController?.getActiveDoctor?.();
    const myDoc = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';
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
      // Cột Y lệnh: Để trống cột y lệnh lúc nạp file Excel (không đưa tên Bác sĩ điều trị vào y lệnh)
      let ylVal = '';
      let docVal = 'BS. Nguyễn Hữu Đông';

      if (CONFIG.expandMedicalText) {
        cdVal = CONFIG.expandMedicalText(cdVal);
        clsVal = CONFIG.expandMedicalText(clsVal);
      }

      results.push({
        id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
        phong_giuong: phongGiuongVal,
        ten: tenVal,
        nam_sinh_tuoi: namSinhTuoiVal,
        chan_doan: cdVal,
        cls: clsVal,
        cls_hien_co: clsVal,
        cls_can_lam: '',
        y_lenh: ylVal,
        them_thuoc: '',
        doctor_name: docVal,
        handover_by: docVal,
        handover_status: CONFIG.HANDOVER_STATUS.NONE,
        handover_issues: '',
        handover_actions: '',
        sort_order: r,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return results;
  }

  // ==============================================================================
  // LỌC DANH SÁCH BỆNH NHÂN CỦA BÁC SĨ ĐIỀU TRỊ VÀ TỪ KHÓA TÌM KIẾM
  // ==============================================================================
  getFilteredPatients() {
    const q = this.currentFilterQuery.toLowerCase().trim();
    if (!q) return this.patientList;

    return this.patientList.filter(p => {
      return (p.phong_giuong || '').toLowerCase().includes(q) ||
             (p.ten || '').toLowerCase().includes(q) ||
             (p.doctor_name || '').toLowerCase().includes(q) ||
             (p.chan_doan || '').toLowerCase().includes(q) ||
             (p.cls_hien_co || '').toLowerCase().includes(q) ||
             (p.cls_can_lam || '').toLowerCase().includes(q) ||
             (p.cls || '').toLowerCase().includes(q) ||
             (p.y_lenh || '').toLowerCase().includes(q) ||
             (p.them_thuoc || '').toLowerCase().includes(q) ||
             (p.handover_issues || '').toLowerCase().includes(q) ||
             (p.handover_actions || '').toLowerCase().includes(q);
    });
  }

  // ==============================================================================
  // RENDER GIAO DIỆN CHÍNH
  // ==============================================================================
  render() {
    const isLoggedIn = !!window.authController?.isLoggedIn;

    // NẾU CHƯA ĐĂNG NHẬP: KHÓA BẢO MẬT BẢNG THEO DÕI VÀ DỮ LIỆU
    if (!isLoggedIn) {
      const tbody = document.getElementById('patientTableBody');
      const cardList = document.getElementById('mobileCardContainer') || document.getElementById('patientCardList');
      const totalEl = document.getElementById('patientCount');
      const emptyMsg = document.getElementById('emptyMessage');
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (totalEl) totalEl.innerText = '0';

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
              <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
              <div style="font-size: 16px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">HỒ SƠ BỆNH ÁN ĐÃ KHÓA BẢO MẬT</div>
              <div style="font-size: 13px; max-width: 440px; margin: 0 auto; line-height: 1.5;">Vui lòng đăng nhập mã PIN để mở khóa và làm việc với danh sách người bệnh của BS. Nguyễn Hữu Đông.</div>
              <button class="btn btn-primary" onclick="window.authController.showGateOverlay()" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px;">
                🔑 Nhập mã PIN đăng nhập
              </button>
            </td>
          </tr>
        `;
      }
      if (cardList) {
        cardList.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: white; border-radius: var(--radius); border: 1.5px solid var(--border);">
            <div style="font-size: 32px; margin-bottom: 8px;">🔒</div>
            <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">Hồ sơ bệnh án đã khóa</div>
            <div style="font-size: 12.5px; margin-top: 4px; line-height: 1.4;">Vui lòng đăng nhập mã PIN để mở khóa bảng theo dõi.</div>
            <button class="btn btn-primary" onclick="window.authController.showGateOverlay()" style="margin-top: 14px; width: 100%; justify-content: center;">
              🔑 Nhập mã PIN đăng nhập
            </button>
          </div>
        `;
      }
      return;
    }

    const filtered = this.getFilteredPatients();

    // Cập nhật bộ đếm
    const totalEl = document.getElementById('patientCount');
    if (totalEl) {
      totalEl.innerText = filtered.length;
    }

    // Cập nhật Header Pill Badge
    if (window.authController && window.authController.updateHeaderPill) {
      window.authController.updateHeaderPill(filtered.length, this.patientList.length);
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
      this.normalizePatientClsAndOrders(p);
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
        <td class="col-cls col-cls-dual">
          <div class="med-dual-cell">
            <div class="med-tier tier-present" onclick="this.querySelector('.med-cell-editor')?.focus()">
              <div class="med-tier-header">
                <span class="med-micro-badge badge-present">✓ Hiện có</span>
              </div>
              <div class="med-cell-editor col-editable" contenteditable="true"
                   data-placeholder="Chưa có kết quả..."
                   oninput="window.patientController.handleCellInput('${p.id}', 'cls_hien_co', this.innerText, this)"
                   onblur="window.patientController.handleCellBlur('${p.id}', 'cls_hien_co', this.innerText, this)">${this.escape(p.cls_hien_co || '')}</div>
            </div>
            <div class="med-tier-divider"></div>
            <div class="med-tier tier-pending ${p.cls_can_lam ? 'has-content' : ''}" onclick="this.querySelector('.med-cell-editor')?.focus()">
              <div class="med-tier-header">
                <span class="med-micro-badge badge-pending ${p.cls_can_lam ? 'active' : ''}">${p.cls_can_lam ? '⚡ Cần làm' : '+ Cần làm'}</span>
              </div>
              <div class="med-cell-editor col-editable ${p.cls_can_lam ? 'text-pending-highlight' : ''}" contenteditable="true"
                   data-placeholder="+ Chỉ định mới cần làm..."
                   oninput="window.patientController.handleCellInput('${p.id}', 'cls_can_lam', this.innerText, this)"
                   onblur="window.patientController.handleCellBlur('${p.id}', 'cls_can_lam', this.innerText, this)">${this.escape(p.cls_can_lam || '')}</div>
            </div>
          </div>
        </td>
        <td class="col-yl col-yl-dual">
          <div class="med-dual-cell">
            <div class="med-tier tier-orders" onclick="this.querySelector('.med-cell-editor')?.focus()">
              <div class="med-cell-editor col-editable" contenteditable="true"
                   data-placeholder="Y lệnh điều trị, thuốc, chăm sóc..."
                   oninput="window.patientController.handleCellInput('${p.id}', 'y_lenh', this.innerText, this)"
                   onblur="window.patientController.handleCellBlur('${p.id}', 'y_lenh', this.innerText, this)">${this.escape(p.y_lenh || '')}</div>
            </div>
            <div class="med-tier-divider"></div>
            <div class="med-tier tier-rx ${p.them_thuoc ? 'has-content' : ''}" onclick="this.querySelector('.med-cell-editor')?.focus()">
              <div class="med-tier-header">
                <span class="med-micro-badge badge-rx ${p.them_thuoc ? 'active' : ''}">${p.them_thuoc ? '💊 Thêm thuốc' : '+ Thêm thuốc'}</span>
              </div>
              <div class="med-cell-editor col-editable ${p.them_thuoc ? 'text-rx-highlight' : ''}" contenteditable="true"
                   data-placeholder="+ Bổ sung thuốc mới..."
                   oninput="window.patientController.handleCellInput('${p.id}', 'them_thuoc', this.innerText, this)"
                   onblur="window.patientController.handleCellBlur('${p.id}', 'them_thuoc', this.innerText, this)">${this.escape(p.them_thuoc || '')}</div>
            </div>
          </div>
        </td>
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
            <button class="btn-table-action" data-tooltip="Thêm dòng dưới" onclick="window.patientController.insertRowAfter('${p.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="btn-table-action" data-tooltip="Chi tiết &amp; Chẩn đoán" onclick="window.patientController.openPatientDetailModal('${p.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-table-action btn-del" data-tooltip="Xóa người bệnh" onclick="window.patientController.deletePatient('${p.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
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
      this.normalizePatientClsAndOrders(p);
      const statusCfg = CONFIG.STATUS_CONFIG[p.handover_status] || CONFIG.STATUS_CONFIG.none;
      const isCritical = p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
      const isPending = p.handover_status === CONFIG.HANDOVER_STATUS.PENDING;

      const card = document.createElement('div');
      card.className = `mobile-patient-card ${isCritical ? 'card-critical' : (isPending ? 'card-pending' : '')}`;
      card.dataset.id = p.id;

      card.innerHTML = `
        <div class="card-header" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-room-badge">
            <span class="room-bed-text">${this.escape(p.phong_giuong || 'Chưa xếp')}</span>
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
            <span class="field-label">Cận lâm sàng (CLS):</span>
            <div class="mobile-cls-box">
              <div class="mobile-cls-row">
                <span class="mobile-sub-badge badge-present">✓ Hiện có:</span>
                <span>${this.escape(p.cls_hien_co || '—')}</span>
              </div>
              <div class="mobile-cls-row ${p.cls_can_lam ? 'mobile-highlight-pending' : ''}">
                <span class="mobile-sub-badge badge-pending">⚡ Cần làm:</span>
                <span class="${p.cls_can_lam ? 'text-pending-bold' : ''}">${this.escape(p.cls_can_lam || 'Không có')}</span>
              </div>
            </div>
          </div>

          <div class="card-field">
            <span class="field-label">Y lệnh:</span>
            <div class="field-content">${this.escape(p.y_lenh || '—')}</div>
            ${p.them_thuoc ? `
              <div class="mobile-them-thuoc-box">
                <span class="mobile-sub-badge badge-extra">💊 Thêm thuốc:</span>
                <span class="mobile-rx-val">${this.escape(p.them_thuoc)}</span>
              </div>
            ` : ''}
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

        <div class="card-footer-actions">
          <button class="btn-card-action btn-card-ho" onclick="window.handoverController.openHandoverModal('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="12" y2="17"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>Bàn giao</span>
          </button>
          <button class="btn-card-action" onclick="window.patientController.openPatientDetailModal('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Chi tiết</span>
          </button>
          <button class="btn-card-action btn-card-del" onclick="window.patientController.deletePatient('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Xóa</span>
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

    this.normalizePatientClsAndOrders(p);

    const modal = document.getElementById('patientDetailModal');
    if (!modal) return;

    document.getElementById('editPatientId').value = p.id;
    document.getElementById('editRoomBed').value = p.phong_giuong || '';
    document.getElementById('editFullName').value = p.ten || '';
    document.getElementById('editAgeYear').value = p.nam_sinh_tuoi || '';
    document.getElementById('editDoctorName').value = p.doctor_name || p.handover_by || '';
    document.getElementById('editDiagnosis').value = p.chan_doan || '';
    
    if (document.getElementById('editClsHienCo')) {
      document.getElementById('editClsHienCo').value = p.cls_hien_co || '';
    }
    if (document.getElementById('editClsCanLam')) {
      document.getElementById('editClsCanLam').value = p.cls_can_lam || '';
    }
    document.getElementById('editOrders').value = p.y_lenh || '';
    if (document.getElementById('editThemThuoc')) {
      document.getElementById('editThemThuoc').value = p.them_thuoc || '';
    }
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
    const clsHcEl = document.getElementById('clsHienCoQuickTags');
    if (clsHcEl && (CONFIG.QUICK_TAGS?.LABS_HIEN_CO || CONFIG.QUICK_TAGS?.LABS)) {
      const list = CONFIG.QUICK_TAGS.LABS_HIEN_CO || CONFIG.QUICK_TAGS.LABS;
      clsHcEl.innerHTML = list.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editClsHienCo', '${t}')">+ ${t}</button>`
      ).join('');
    }
    const clsClEl = document.getElementById('clsCanLamQuickTags');
    if (clsClEl && (CONFIG.QUICK_TAGS?.LABS_CAN_LAM || CONFIG.QUICK_TAGS?.LABS)) {
      const list = CONFIG.QUICK_TAGS.LABS_CAN_LAM || CONFIG.QUICK_TAGS.LABS;
      clsClEl.innerHTML = list.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editClsCanLam', '${t}')">+ ${t}</button>`
      ).join('');
    }
    const ordersEl = document.getElementById('ordersQuickTags');
    if (ordersEl && CONFIG.QUICK_TAGS?.ORDERS) {
      ordersEl.innerHTML = CONFIG.QUICK_TAGS.ORDERS.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editOrders', '${t}')">+ ${t}</button>`
      ).join('');
    }
    const themThuocEl = document.getElementById('themThuocQuickTags');
    if (themThuocEl && (CONFIG.QUICK_TAGS?.THEM_THUOC || CONFIG.QUICK_TAGS?.ORDERS)) {
      const list = CONFIG.QUICK_TAGS.THEM_THUOC || CONFIG.QUICK_TAGS.ORDERS;
      themThuocEl.innerHTML = list.map(t =>
        `<button type="button" class="quick-tag-btn" onclick="window.patientController.insertQuickTag('editThemThuoc', '${t}')">+ ${t}</button>`
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
    let clsHcVal = document.getElementById('editClsHienCo') ? document.getElementById('editClsHienCo').value.trim() : '';
    let clsClVal = document.getElementById('editClsCanLam') ? document.getElementById('editClsCanLam').value.trim() : '';
    let ylVal = document.getElementById('editOrders').value.trim();
    let themThuocVal = document.getElementById('editThemThuoc') ? document.getElementById('editThemThuoc').value.trim() : '';

    if (CONFIG.expandMedicalText) {
      cdVal = CONFIG.expandMedicalText(cdVal);
      clsHcVal = CONFIG.expandMedicalText(clsHcVal);
      clsClVal = CONFIG.expandMedicalText(clsClVal);
      ylVal = CONFIG.expandMedicalText(ylVal);
      themThuocVal = CONFIG.expandMedicalText(themThuocVal);
    }

    let combinedCls = '';
    if (clsHcVal && clsClVal) {
      combinedCls = `[Hiện có]: ${clsHcVal}\n[Cần làm]: ${clsClVal}`;
    } else if (clsClVal) {
      combinedCls = `[Cần làm]: ${clsClVal}`;
    } else {
      combinedCls = clsHcVal;
    }

    const docVal = document.getElementById('editDoctorName')?.value?.trim() || '';

    const updateData = {
      phong_giuong: this.cleanRoomBedString(document.getElementById('editRoomBed').value.trim()),
      ten: document.getElementById('editFullName').value.trim(),
      nam_sinh_tuoi: document.getElementById('editAgeYear').value.trim(),
      doctor_name: docVal,
      chan_doan: cdVal,
      cls: combinedCls,
      cls_hien_co: clsHcVal,
      cls_can_lam: clsClVal,
      y_lenh: ylVal,
      them_thuoc: themThuocVal,
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

  // ==============================================================================
  // IN CHO ĐIỀU DƯỠNG (PHIẾU Y LỆNH & CLS CẦN LÀM)
  // ==============================================================================
  openNursePrintModal() {
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }
    const modal = document.getElementById('nursePrintModal');
    if (!modal) return;

    this.renderNursePrintPreview();
    modal.classList.add('active');
  }

  closeNursePrintModal() {
    const modal = document.getElementById('nursePrintModal');
    if (modal) modal.classList.remove('active');
  }

  renderNursePrintPreview() {
    const container = document.getElementById('nursePrintArea');
    if (!container) return;

    this.patientList.forEach(p => this.normalizePatientClsAndOrders(p));

    // Đếm số người bệnh có chỉ định cần làm (CLS cần làm hoặc Thêm thuốc)
    const pendingPatients = this.patientList.filter(p => {
      const hasCls = Boolean(p.cls_can_lam && p.cls_can_lam.trim());
      const hasRx = Boolean(p.them_thuoc && p.them_thuoc.trim());
      return hasCls || hasRx;
    });

    const countEl = document.getElementById('nursePendingCount');
    if (countEl) countEl.innerText = pendingPatients.length;

    const onlyPending = document.getElementById('nurseFilterOnlyPending')?.checked ?? true;
    const targetList = onlyPending ? pendingPatients : this.patientList;

    const todayStr = new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (targetList.length === 0) {
      container.innerHTML = `
        <div class="nurse-empty-state">
          <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
          <div style="font-size: 15px; font-weight: 700; color: #15803d; margin-bottom: 4px;">Hiện tại không có chỉ định mới cần thực hiện!</div>
          <div style="font-size: 13px; color: var(--text-muted);">
            Tất cả người bệnh trong danh sách chưa có chỉ định <strong>CLS cần làm</strong> hoặc <strong>Thêm thuốc</strong> mới.
          </div>
          <div style="margin-top: 14px;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('nurseFilterOnlyPending').checked = false; window.patientController.renderNursePrintPreview();">
              Xem toàn bộ danh sách (${this.patientList.length} người bệnh)
            </button>
          </div>
        </div>
      `;
      return;
    }

    let rowsHtml = '';
    targetList.forEach((p, idx) => {
      const clsCanLamHtml = p.cls_can_lam && p.cls_can_lam.trim()
        ? `<div class="nurse-item-cls"><span class="nurse-bullet">🔬</span> ${this.escape(p.cls_can_lam)}</div>`
        : `<span class="nurse-item-empty">—</span>`;

      const themThuocHtml = p.them_thuoc && p.them_thuoc.trim()
        ? `<div class="nurse-item-rx"><span class="nurse-bullet">💊</span> <strong>${this.escape(p.them_thuoc)}</strong></div>`
        : `<span class="nurse-item-empty">—</span>`;

      rowsHtml += `
        <tr>
          <td class="nurse-col-stt">${idx + 1}</td>
          <td class="nurse-col-room">${this.escape(p.phong_giuong || '—')}</td>
          <td class="nurse-col-name">${this.escape(p.ten || '—')}</td>
          <td class="nurse-col-birth">${this.escape(p.nam_sinh_tuoi || '—')}</td>
          <td class="nurse-col-cls">${clsCanLamHtml}</td>
          <td class="nurse-col-rx">${themThuocHtml}</td>
          <td class="nurse-col-sign">
            <div class="nurse-sign-check">
              <span class="sign-box"></span>
              <span class="sign-line">Giờ: ...... Ký: .......</span>
            </div>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="nurse-sheet-content">
        <!-- Bảng danh sách phiếu điều dưỡng (Chỉ giữ lại phần bảng, không tiêu đề, không chữ ký) -->
        <table class="nurse-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              <th style="width: 95px; text-align: center;">Phòng/Giường</th>
              <th style="width: 180px;">Họ và Tên NB</th>
              <th style="width: 90px; text-align: center;">Năm sinh (Tuổi)</th>
              <th style="width: 31%;">🔬 CLS CẦN LÀM (XN / CĐHA)</th>
              <th style="width: 31%;">💊 THÊM THUỐC / Y LỆNH MỚI</th>
              <th style="width: 110px; text-align: center;">Điều Dưỡng Ký Nhận</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  printNurseWorklist() {
    this.renderNursePrintPreview();
    document.body.classList.add('print-nurse-mode');
    
    setTimeout(() => {
      window.print();
    }, 150);

    const cleanup = () => {
      document.body.classList.remove('print-nurse-mode');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      document.body.classList.remove('print-nurse-mode');
    }, 2500);
  }

  copyNurseWorklistZalo() {
    this.patientList.forEach(p => this.normalizePatientClsAndOrders(p));
    const onlyPending = document.getElementById('nurseFilterOnlyPending')?.checked ?? true;
    
    let targetList = this.patientList;
    if (onlyPending) {
      targetList = this.patientList.filter(p => {
        return Boolean(p.cls_can_lam && p.cls_can_lam.trim()) || Boolean(p.them_thuoc && p.them_thuoc.trim());
      });
    }

    if (targetList.length === 0) {
      if (window.updateSaveStatus) window.updateSaveStatus('ℹ️ Không có người bệnh nào có CLS cần làm hoặc Thêm thuốc để sao chép', 'warning');
      return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');
    let text = `🏥 KHOA NHIỄM - BV ĐK KHU VỰC THỦ ĐỨC\n`;
    text += `📋 PHIẾU Y LỆNH & CLS CHO ĐIỀU DƯỠNG (BS. Nguyễn Hữu Đông)\n`;
    text += `📅 Ngày: ${todayStr} - Tổng cộng: ${targetList.length} người bệnh\n`;
    text += `--------------------------------------------------\n`;

    targetList.forEach((p, idx) => {
      text += `${idx + 1}. [${p.phong_giuong || 'Chưa xếp'}] ${p.ten || 'BỆNH NHÂN'} - NS: ${p.nam_sinh_tuoi || '—'}\n`;
      if (p.cls_can_lam && p.cls_can_lam.trim()) {
        text += `   🔬 CLS CẦN LÀM: ${p.cls_can_lam.trim()}\n`;
      }
      if (p.them_thuoc && p.them_thuoc.trim()) {
        text += `   💊 THÊM THUỐC: ${p.them_thuoc.trim()}\n`;
      }
      if (!p.cls_can_lam?.trim() && !p.them_thuoc?.trim()) {
        text += `   ✓ Y lệnh thường quy, không thêm mới\n`;
      }
      text += `\n`;
    });

    text += `--------------------------------------------------\n`;
    text += `👉 Đề nghị Điều dưỡng ca trực tiếp nhận, thực hiện và phản hồi sau khi hoàn tất. Trân trọng!`;

    navigator.clipboard.writeText(text).then(() => {
      if (window.updateSaveStatus) {
        window.updateSaveStatus('📋 Đã sao chép nội dung phiếu Điều dưỡng! Bạn có thể dán (Ctrl+V) vào nhóm Zalo của khoa.', 'saved');
      }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (window.updateSaveStatus) {
        window.updateSaveStatus('📋 Đã sao chép nội dung phiếu Điều dưỡng! Bạn có thể dán (Ctrl+V) vào nhóm Zalo của khoa.', 'saved');
      }
    });
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
