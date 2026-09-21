// ==============================================================================
// PATIENT MANAGEMENT SERVICE & EXCEL PARSER
// ==============================================================================

class PatientController {
  constructor() {
    this.patientList = [];
    this.isGroupedByRoom = true;
    this.currentFilterQuery = '';
    this.currentTab = 'all'; // 'all' | 'handover' | 'rooms'

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
    window.supabaseService.onRealtimeUpdate(async (payload) => {
      console.log('🔄 Bệnh nhân được cập nhật từ thiết bị khác:', payload);
      await this.reloadFromSource(false);
      this.render();
      if (window.showToast) {
        window.showToast('📡 Dữ liệu vừa được đồng bộ từ thiết bị khác!');
      }
    });
  }

  async reloadFromSource(showNotice = true) {
    const data = await window.supabaseService.fetchPatients();
    this.patientList = data || [];

    // Tự động làm sạch cụm "NHIEM" nếu có dữ liệu cũ
    let cleaned = false;
    this.patientList.forEach(p => {
      if (p.phong_giuong && /NHIEM/i.test(p.phong_giuong)) {
        p.phong_giuong = this.cleanRoomBedString(p.phong_giuong);
        cleaned = true;
      }
    });

    if (cleaned) {
      this.saveLocalCache();
    }

    this.render();
    if (showNotice && window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã tải dữ liệu bệnh nhân');
    }
  }

  saveLocalCache() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(this.patientList));
  }

  // HÀM LỌC BỎ CỤM TỪ "NHIEM" (VD: NHIEM12-G01 -> G01, NHIEMCLY13-G01 -> G01)
  cleanRoomBedString(str) {
    if (!str) return '';
    let cleaned = String(str);
    cleaned = cleaned.replace(/NHIEM[A-Za-z0-9_]*\s*[-_]?\s*/gi, '');
    cleaned = cleaned.replace(/\s*-\s*-+\s*/g, ' - ');
    cleaned = cleaned.replace(/^\s*[-_]\s*/, '').replace(/\s*[-_]\s*$/, '').trim();
    cleaned = cleaned.replace(/\s*-\s*/g, ' - ');
    return cleaned;
  }

  // TÁCH PHÒNG TỪ CHUỖI "PHÒNG - GIƯỜNG" ĐỂ GOM NHÓM
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
  sortPatientsByRoomAndBed(notify = true) {
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
    window.supabaseService.syncBatchPatients(this.patientList);
    this.render();

    if (notify && window.updateSaveStatus) {
      window.updateSaveStatus('✓ Đã sắp xếp danh sách theo thứ tự buồng & giường');
    }
  }

  // CRUD THAO TÁC BỆNH NHÂN
  async addPatient(patientData) {
    const newPatient = {
      id: 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      phong_giuong: this.cleanRoomBedString(patientData.phong_giuong || ''),
      ten: (patientData.ten || '').trim(),
      nam_sinh_tuoi: (patientData.nam_sinh_tuoi || '').trim(),
      chan_doan: (patientData.chan_doan || '').trim(),
      cls: (patientData.cls || '').trim(),
      y_lenh: (patientData.y_lenh || '').trim(),
      handover_status: patientData.handover_status || CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: patientData.handover_issues || '',
      handover_actions: patientData.handover_actions || '',
      handover_by: patientData.handover_by || '',
      handover_at: patientData.handover_at || null,
      sort_order: this.patientList.length,
      created_at: new Date().toISOString()
    };

    this.patientList.push(newPatient);
    this.saveLocalCache();
    this.render();

    // Async lưu lên cloud
    await window.supabaseService.savePatient(newPatient);
    return newPatient;
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
      this.render();

      await window.supabaseService.syncBatchPatients([]);
      if (window.updateSaveStatus) {
        window.updateSaveStatus('✓ Đã xóa trắng danh sách');
      }
    }
  }

  // XỬ LÝ NHẬP EXCEL VỚI BỘ NHẬN DIỆN TỪ VIẾT TẮT Y KHOA TỐI ƯU
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
      y_lenh: headerRow.findIndex(c => c === 'yl' || c === 'p' || c === 'rx' || c === 'order' || c.includes('y lệnh') || c.includes('điều trị') || c.includes('(p)') || c.includes('treatment'))
    };

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
        if (p && g) phongGiuongVal = `${p} - ${g}`;
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

      // Tự động mở rộng viết tắt y khoa khi nạp từ Excel
      if (CONFIG.expandMedicalText) {
        cdVal = CONFIG.expandMedicalText(cdVal);
        clsVal = CONFIG.expandMedicalText(clsVal);
        ylVal = CONFIG.expandMedicalText(ylVal);
      }

      results.push({
        id: 'patient_' + Date.now() + '_' + r + '_' + Math.random().toString(36).substr(2, 4),
        phong_giuong: phongGiuongVal,
        ten: tenVal,
        nam_sinh_tuoi: namSinhTuoiVal,
        chan_doan: cdVal,
        cls: clsVal,
        y_lenh: ylVal,
        handover_status: CONFIG.HANDOVER_STATUS.NONE,
        handover_issues: '',
        handover_actions: '',
        sort_order: r
      });
    }

    return results;
  }

  // LỌC DANH SÁCH BỆNH NHÂN THEO TAB VÀ TỪ KHÓA
  getFilteredPatients() {
    const q = this.currentFilterQuery.toLowerCase().trim();

    return this.patientList.filter(p => {
      // 1. Lọc theo Tab
      if (this.currentTab === 'handover') {
        const isHandover = p.handover_status === CONFIG.HANDOVER_STATUS.PENDING ||
                           p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
        if (!isHandover) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (!q) return true;

      return (p.phong_giuong || '').toLowerCase().includes(q) ||
             (p.ten || '').toLowerCase().includes(q) ||
             (p.chan_doan || '').toLowerCase().includes(q) ||
             (p.cls || '').toLowerCase().includes(q) ||
             (p.y_lenh || '').toLowerCase().includes(q) ||
             (p.handover_issues || '').toLowerCase().includes(q) ||
             (p.handover_actions || '').toLowerCase().includes(q);
    });
  }

  // RENDER DỮ LIỆU LÊN GIAO DIỆN BẢNG VÀ GIAO DIỆN THẺ
  render() {
    const filtered = this.getFilteredPatients();

    // Cập nhật bộ đếm
    const totalEl = document.getElementById('patientCount');
    const badgeAll = document.getElementById('countTabAll');
    const badgeHandover = document.getElementById('countTabHandover');

    const handoverPendingCount = this.patientList.filter(p => 
      p.handover_status === CONFIG.HANDOVER_STATUS.PENDING || 
      p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL
    ).length;

    const criticalCount = this.patientList.filter(p => 
      p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL
    ).length;

    if (totalEl) totalEl.innerText = this.patientList.length;
    if (badgeAll) badgeAll.innerText = this.patientList.length;
    if (badgeHandover) {
      badgeHandover.innerText = handoverPendingCount;
      badgeHandover.className = criticalCount > 0 ? 'badge-count critical' : 'badge-count';
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
        <td class="col-room col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'phong_giuong', this.innerText, this)">${this.escape(p.phong_giuong || '')}</td>
        <td class="col-name col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'ten', this.innerText, this)">${this.escape(p.ten || '')}</td>
        <td class="col-birth col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'nam_sinh_tuoi', this.innerText, this)">${this.escape(p.nam_sinh_tuoi || '')}</td>
        <td class="col-cd col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'chan_doan', this.innerText, this)">${this.escape(p.chan_doan || '')}</td>
        <td class="col-cls col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'cls', this.innerText, this)">${this.escape(p.cls || '')}</td>
        <td class="col-yl col-editable" contenteditable="true" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.blur();}" onblur="window.patientController.handleCellBlur('${p.id}', 'y_lenh', this.innerText, this)">${this.escape(p.y_lenh || '')}</td>
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

  insertRowAfter(patientId) {
    const idx = this.patientList.findIndex(p => p.id === patientId);
    const baseRoom = idx >= 0 ? this.cleanRoomBedString(this.patientList[idx].phong_giuong) : '';
    const newP = {
      id: 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      phong_giuong: baseRoom,
      ten: 'BỆNH NHÂN MỚI',
      nam_sinh_tuoi: '',
      chan_doan: '',
      cls: '',
      y_lenh: '',
      handover_status: CONFIG.HANDOVER_STATUS.NONE,
      handover_issues: '',
      handover_actions: '',
      sort_order: idx + 1
    };

    if (idx >= 0) {
      this.patientList.splice(idx + 1, 0, newP);
    } else {
      this.patientList.push(newP);
    }

    this.saveLocalCache();
    window.supabaseService.syncBatchPatients(this.patientList);
    this.render();
  }

  renderMobileCards(filtered) {
    const container = document.getElementById('mobileCardContainer');
    if (!container) return;
    container.innerHTML = '';

    filtered.forEach((p, idx) => {
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
            <strong>${this.escape(p.phong_giuong || 'Chưa xếp giường')}</strong>
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

  handleCellBlur(patientId, field, value, el) {
    let cleanVal = value.trim();
    if (CONFIG.expandMedicalText && (field === 'chan_doan' || field === 'cls' || field === 'y_lenh')) {
      cleanVal = CONFIG.expandMedicalText(cleanVal);
      if (el && el.innerText !== cleanVal) {
        el.innerText = cleanVal;
      }
    }
    this.updatePatient(patientId, { [field]: cleanVal });
  }

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
    document.getElementById('editDiagnosis').value = p.chan_doan || '';
    document.getElementById('editCls').value = p.cls || '';
    document.getElementById('editOrders').value = p.y_lenh || '';
    document.getElementById('editHandoverStatus').value = p.handover_status || CONFIG.HANDOVER_STATUS.NONE;
    document.getElementById('editHandoverIssues').value = p.handover_issues || '';
    document.getElementById('editHandoverActions').value = p.handover_actions || '';

    // Quick tags chẩn đoán, CLS, y lệnh
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

    // Thiết lập tự động mở rộng từ viết tắt khi rời ô trong Modal
    ['editDiagnosis', 'editCls', 'editOrders'].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el && !el.dataset.hasAbbrBlur) {
        el.dataset.hasAbbrBlur = 'true';
        el.addEventListener('blur', () => {
          if (CONFIG.expandMedicalText && el.value) {
            el.value = CONFIG.expandMedicalText(el.value);
          }
        });
      }
    });

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

    const updateData = {
      phong_giuong: document.getElementById('editRoomBed').value.trim(),
      ten: document.getElementById('editFullName').value.trim(),
      nam_sinh_tuoi: document.getElementById('editAgeYear').value.trim(),
      chan_doan: cdVal,
      cls: clsVal,
      y_lenh: ylVal,
      handover_status: document.getElementById('editHandoverStatus').value,
      handover_issues: document.getElementById('editHandoverIssues').value.trim(),
      handover_actions: document.getElementById('editHandoverActions').value.trim()
    };

    // Nếu người dùng vừa đổi sang pending hoặc critical mà chưa có người bàn giao thì gán user hiện tại
    if (updateData.handover_status !== CONFIG.HANDOVER_STATUS.NONE && updateData.handover_status !== CONFIG.HANDOVER_STATUS.RESOLVED) {
      if (window.authController && window.authController.currentUser) {
        updateData.handover_by = window.authController.currentUser.full_name || 'Bác sĩ điều trị';
        updateData.handover_at = new Date().toISOString();
      }
    }

    this.updatePatient(id, updateData);
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
