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
    this.activeMobileFilter = 'all'; // 'all' | 'critical' | 'pending' | 'room:...'
    this.mobileViewMode = localStorage.getItem('medward_mobile_view_mode') || 'cards'; // 'cards' | 'table'
    this.activeWorkspaceDoctorId = 'my_space'; // 'my_space' | 'all' | specific docId
    this.autoSaveTimers = {};

    this.init();
  }

  async init() {
    this.loadSettings();
    this.applyMobileViewMode();
    await this.reloadFromSource();
    this.setupRealtimeListener();
    this.updateStorageHudUI();
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
        if (document.activeElement && (document.activeElement.isContentEditable || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }

        if (this.realtimeDebounceTimer) {
          clearTimeout(this.realtimeDebounceTimer);
        }

        this.realtimeDebounceTimer = setTimeout(async () => {
          await this.reloadFromSource(false);
          this.render();
        }, 2000);
      });
    }
  }

  // ==============================================================================
  // HỆ THỐNG KHÔNG GIAN BIỆT LẬP TỪNG TÀI KHOẢN (ISOLATED WORKSPACE & 100MB SAVE SLOT)
  // ==============================================================================
  getDoctorSpaceKey(docId) {
    if (!docId) return 'medward_patients_v2';
    return (CONFIG.STORAGE_KEYS.DOCTOR_SPACE_PREFIX || 'medward_doc_space_') + docId + '_patients';
  }

  getEffectiveDoctor() {
    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const isAdmin = window.authController?.isDongAdmin?.(activeDoc);

    if (!isAdmin || !this.activeWorkspaceDoctorId || this.activeWorkspaceDoctorId === 'my_space') {
      return { doctor: activeDoc, isAll: false, isAdmin: !!isAdmin };
    }

    if (this.activeWorkspaceDoctorId === 'all') {
      return { doctor: activeDoc, isAll: true, isAdmin: true };
    }

    const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
    const targetDoc = allDocs.find(d => d.id === this.activeWorkspaceDoctorId || d.username === this.activeWorkspaceDoctorId) || activeDoc;
    return { doctor: targetDoc, isAll: false, isAdmin: true };
  }

  loadDoctorPatients(docId) {
    const key = this.getDoctorSpaceKey(docId);
    const local = localStorage.getItem(key);
    if (local !== null) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }

    // Nếu là BS. Đông và chưa khởi tạo partition riêng, nạp từ cache cũ hoặc sample
    if (docId === 'doc_dongnh' || (window.authController && window.authController.isDongAdmin({ id: docId }))) {
      const oldCache = localStorage.getItem(CONFIG.STORAGE_KEYS.PATIENT_DATA);
      if (oldCache) {
        try {
          const parsed = JSON.parse(oldCache);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(key, JSON.stringify(parsed));
            return parsed;
          }
        } catch (e) {}
      }
      const samples = CONFIG.SAMPLE_PATIENTS ? JSON.parse(JSON.stringify(CONFIG.SAMPLE_PATIENTS)) : [];
      localStorage.setItem(key, JSON.stringify(samples));
      return samples;
    }

    // MỌI TÀI KHOẢN BÁC SĨ KHÁC (VD: Hồ Thế Bảo) BẮT ĐẦU VỚI MẢNG RỖNG []
    // Hoàn toàn độc lập, không thấy danh sách của BS. Đông!
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }

  async reloadFromSource(showNotice = true) {
    const { doctor, isAll, isAdmin } = this.getEffectiveDoctor();
    let data = null;

    if (isAll) {
      // Chế độ Quản trị viên xem toàn bộ khoa: Tổng hợp người bệnh từ tất cả các bác sĩ
      const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
      const aggregated = [];
      const seenIds = new Set();
      allDocs.forEach(d => {
        const docPts = this.loadDoctorPatients(d.id);
        docPts.forEach(p => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            aggregated.push({
              ...p,
              doctor_name: p.doctor_name || d.full_name,
              doctor_id: p.doctor_id || d.id
            });
          }
        });
      });
      data = aggregated;
    } else {
      // Chế độ Không gian riêng của từng Bác sĩ (VD: BS. Hồ Thế Bảo hoặc BS. Nguyễn Hữu Đông)
      if (window.supabaseService && window.supabaseService.isCloudEnabled) {
        try {
          const cloudData = await window.supabaseService.fetchPatients();
          if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
            const docId = doctor.id;
            const docNameLower = (doctor.full_name || '').toLowerCase().trim();
            const matched = cloudData.filter(p => {
              const pDocId = p.doctor_id || p.handover_by_id || p.user_id;
              const pDocName = (p.doctor_name || p.handover_by || '').toLowerCase().trim();
              if (docId === 'doc_dongnh' || (isAdmin && docId === 'doc_dongnh')) {
                return pDocId === 'doc_dongnh' || pDocName.includes('đông') || pDocName.includes('dong');
              }
              return pDocId === docId || pDocName === docNameLower;
            });
            if (matched.length > 0) {
              data = matched;
              localStorage.setItem(this.getDoctorSpaceKey(doctor.id), JSON.stringify(matched));
            }
          }
        } catch (err) {
          console.warn('Lưu ý kết nối Cloud:', err);
        }
      }

      if (!data) {
        data = this.loadDoctorPatients(doctor.id);
        // Nếu có danh sách trong bộ nhớ máy (như vừa nạp file Excel) mà Cloud chưa có, tự động đồng bộ ngay lên Supabase
        if (window.supabaseService && window.supabaseService.isCloudEnabled && Array.isArray(data) && data.length > 0) {
          setTimeout(() => {
            window.supabaseService.syncBatchPatients(data);
          }, 400);
        }
      }
    }

    this.patientList = data || [];

    // Tự động chuẩn hóa phòng/giường và bảo toàn Bác sĩ điều trị phụ trách
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

      // Bảo toàn thông tin Bác sĩ phụ trách người bệnh
      if (!p.doctor_name) {
        p.doctor_name = doctor.full_name || 'BS. Nguyễn Hữu Đông';
        cleaned = true;
      }
      if (!p.doctor_id) {
        p.doctor_id = doctor.id || 'doc_dongnh';
        cleaned = true;
      }
      if (!p.handover_by) {
        p.handover_by = p.doctor_name;
        cleaned = true;
      }

      // Dọn sạch cột Y lệnh nếu bị dính tên Bác sĩ điều trị
      if (p.y_lenh) {
        const ylLower = p.y_lenh.trim().toLowerCase();
        const isDocName = ylLower.startsWith('bs.') || 
                          ylLower.startsWith('bs ') || 
                          ylLower.startsWith('bác sĩ') || 
                          ylLower.startsWith('bác sỹ') || 
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
    }

    this.updateDoctorFilterDropdown();
    this.render();
    this.updateStorageHudUI();

    if (showNotice && window.updateSaveStatus) {
      const spaceLabel = isAll ? 'Toàn Khoa' : doctor.full_name;
      window.updateSaveStatus(`✓ Đã vào Không gian: ${spaceLabel} (${this.patientList.length} NB)`);
    }
  }

  // ==============================================================================
  // CHUẨN HÓA CẬN LÂM SÀNG (HIỆN CÓ / CẦN LÀM) VÀ Y LỆNH (THÊM THUỐC)
  // ==============================================================================
  normalizePatientClsAndOrders(p) {
    if (!p) return;

    // Đảm bảo các thuộc tính chuỗi luôn tồn tại
    if (typeof p.cls_hien_co !== 'string') p.cls_hien_co = p.cls_hien_co ? String(p.cls_hien_co) : '';
    if (typeof p.cls_can_lam !== 'string') p.cls_can_lam = p.cls_can_lam ? String(p.cls_can_lam) : '';
    if (typeof p.cls !== 'string') p.cls = p.cls ? String(p.cls) : '';
    if (typeof p.y_lenh !== 'string') p.y_lenh = p.y_lenh ? String(p.y_lenh) : '';
    if (typeof p.them_thuoc !== 'string') p.them_thuoc = p.them_thuoc ? String(p.them_thuoc) : '';

    // Nếu chưa phân tách cls_hien_co và cls_can_lam nhưng có cột cls tổng hợp
    if (!p.cls_hien_co && !p.cls_can_lam && p.cls) {
      const clsText = p.cls;
      if (clsText.includes('[Hiện có]:') || clsText.includes('[Cần làm]:')) {
        const hcMatch = clsText.match(/\[Hiện có\]:\s*([\s\S]*?)(?=\n\[Cần làm\]:|$)/i);
        const clMatch = clsText.match(/\[Cần làm\]:\s*([\s\S]*?)$/i);
        p.cls_hien_co = hcMatch ? hcMatch[1].trim() : '';
        p.cls_can_lam = clMatch ? clMatch[1].trim() : '';
      } else if (clsText.includes('⚡ Cần làm:')) {
        const parts = clsText.split(/⚡ Cần làm:/i);
        p.cls_hien_co = parts[0].trim();
        p.cls_can_lam = parts[1] ? parts[1].trim() : '';
      } else {
        p.cls_hien_co = clsText.trim();
        p.cls_can_lam = '';
      }
    }

    // Đồng bộ ngược lại cls từ cls_hien_co và cls_can_lam
    if (p.cls_hien_co || p.cls_can_lam) {
      const hc = (p.cls_hien_co || '').trim();
      const cl = (p.cls_can_lam || '').trim();
      if (hc && cl) {
        p.cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
      } else if (cl) {
        p.cls = `[Cần làm]: ${cl}`;
      } else {
        p.cls = hc;
      }
    }

    // Nếu có [Thêm thuốc] trong y_lenh nhưng cột them_thuoc đang rỗng
    if (!p.them_thuoc && p.y_lenh) {
      if (p.y_lenh.includes('[Thêm thuốc]:')) {
        const parts = p.y_lenh.split(/\[Thêm thuốc\]:/i);
        p.y_lenh = parts[0].trim();
        p.them_thuoc = parts[1] ? parts[1].trim() : '';
      } else if (p.y_lenh.includes('💊 Thêm thuốc:')) {
        const parts = p.y_lenh.split(/💊 Thêm thuốc:/i);
        p.y_lenh = parts[0].trim();
        p.them_thuoc = parts[1] ? parts[1].trim() : '';
      }
    }

    // Xử lý y_lenh nếu lỡ dính tên bác sĩ
    if (p.y_lenh) {
      const ylLower = p.y_lenh.trim().toLowerCase();
      const isDocName = ylLower.startsWith('bs.') || 
                        ylLower.startsWith('bs ') || 
                        ylLower.startsWith('bác sĩ') || 
                        ylLower.startsWith('bác sỹ') || 
                        ylLower === (p.doctor_name || '').trim().toLowerCase() ||
                        ylLower === (p.handover_by || '').trim().toLowerCase();
      if (isDocName) {
        p.y_lenh = '';
      }
    }
  }

  saveLocalCache() {
    const { doctor, isAll } = this.getEffectiveDoctor();
    if (isAll) {
      const partitionMap = {};
      this.patientList.forEach(p => {
        const dId = p.doctor_id || p.handover_by_id || 'doc_dongnh';
        if (!partitionMap[dId]) partitionMap[dId] = [];
        partitionMap[dId].push(p);
      });
      Object.keys(partitionMap).forEach(dId => {
        localStorage.setItem(this.getDoctorSpaceKey(dId), JSON.stringify(partitionMap[dId]));
      });
    } else {
      const key = this.getDoctorSpaceKey(doctor.id);
      localStorage.setItem(key, JSON.stringify(this.patientList));
      if (doctor.id === 'doc_dongnh' || window.authController?.isDongAdmin?.(doctor)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(this.patientList));
      }
    }
    this.updateStorageHudUI();
  }

  // TÍNH TOÁN DUNG LƯỢNG LƯU TRỮ 100MB CHO TỪNG TÀI KHOẢN (SAVE SLOT HUD)
  calculateDoctorStorageUsage(targetDocId = null) {
    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const doc = targetDocId
      ? (window.authController?.getKnownDoctors?.()?.find(d => d.id === targetDocId || d.username === targetDocId) || { id: targetDocId, full_name: 'Bác sĩ', storage_limit_mb: 100 })
      : activeDoc;
    const docId = doc.id || 'doc_dongnh';

    const spaceKey = this.getDoctorSpaceKey(docId);
    const patientsJson = localStorage.getItem(spaceKey) || '[]';
    const patientsBytes = new Blob([patientsJson]).size;

    let logsBytes = 0;
    try {
      const allLogs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HANDOVER_LOGS) || '[]');
      const docLogs = allLogs.filter(l => l.doctor_id === docId || l.doctor_name === doc.full_name || l.handover_by === doc.full_name);
      logsBytes = new Blob([JSON.stringify(docLogs)]).size;
    } catch (e) {}

    const profileBytes = new Blob([JSON.stringify(doc)]).size;
    const totalBytes = patientsBytes + logsBytes + profileBytes;
    const maxBytes = (doc.storage_limit_mb || CONFIG.STORAGE_LIMIT_MB || 100) * 1024 * 1024;
    const percentNum = (totalBytes / maxBytes) * 100;
    const remainingBytes = Math.max(0, maxBytes - totalBytes);

    let patientsCount = 0;
    try { patientsCount = JSON.parse(patientsJson).length; } catch (e) {}

    return {
      docId,
      docName: doc.full_name || 'Bác sĩ',
      role: doc.role || 'doctor',
      isAdmin: window.authController?.isDongAdmin?.(doc),
      totalBytes,
      maxBytes,
      percent: percentNum.toFixed(2),
      percentNum,
      usedFormatted: this.formatBytes(totalBytes),
      maxFormatted: '100 MB',
      remainingFormatted: this.formatBytes(remainingBytes),
      patientsCount,
      patientsBytesFormatted: this.formatBytes(patientsBytes),
      logsBytesFormatted: this.formatBytes(logsBytes),
      profileBytesFormatted: this.formatBytes(profileBytes),
      isNearLimit: percentNum >= 85,
      isFull: percentNum >= 99
    };
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // CẬP NHẬT GIAO DIỆN THANH CHỈ BÁO DUNG LƯỢNG 100MB (HEADER & WORKSPACE)
  updateStorageHudUI() {
    const stats = this.calculateDoctorStorageUsage();

    // 1. Header Storage Pill
    const hudEl = document.getElementById('headerStorageHud');
    const textEl = document.getElementById('headerStorageText');
    const barEl = document.getElementById('headerStorageBarFill');

    if (hudEl && textEl && barEl) {
      hudEl.style.display = 'inline-flex';
      textEl.innerText = `${stats.usedFormatted} / 100 MB`;
      const fillW = Math.max(2, Math.min(100, stats.percentNum * 20));
      barEl.style.width = `${fillW}%`;
      hudEl.setAttribute('data-tooltip', `🎮 Dung lượng tài khoản: ${stats.usedFormatted} / 100 MB (${stats.percent}%)\nSố bệnh nhân: ${stats.patientsCount} | Còn trống: ${stats.remainingFormatted}`);
    }

    // 2. Mobile summary storage
    const mobStorage = document.getElementById('mobileSummaryStorage');
    if (mobStorage) {
      mobStorage.innerText = `💾 ${stats.usedFormatted} / 100MB`;
    }

    // 3. Workspace tab in AuthModal nếu đang mở
    const wsArea = document.getElementById('workspaceContentArea');
    if (window.authController && wsArea && document.getElementById('authModal')?.classList?.contains('active')) {
      window.authController.renderWorkspaceTab();
    }
  }

  async switchWorkspaceDoctor(docId) {
    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const isAdmin = window.authController?.isDongAdmin?.(activeDoc);

    if (!isAdmin && docId !== 'my_space' && docId !== activeDoc.id) {
      this.activeWorkspaceDoctorId = 'my_space';
    } else {
      this.activeWorkspaceDoctorId = docId;
    }

    await this.reloadFromSource(false);
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
    const { doctor, isAll, isAdmin } = this.getEffectiveDoctor();
    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const subTitleEl = document.querySelector('.sub-title');
    const wsText = document.getElementById('currentWorkspaceText');

    let labelText = '';
    if (isAll) {
      labelText = '🌐 Toàn Khoa (Tất cả BS)';
      if (subTitleEl) subTitleEl.innerText = `(🌐 Toàn Khoa: Giám sát toàn bộ người bệnh • Quản trị viên: ${activeDoc.full_name})`;
    } else {
      const roleBadge = doctor.role === 'admin' ? '👑 ' : '🩺 ';
      labelText = `${roleBadge}${doctor.full_name}`;
      if (subTitleEl) subTitleEl.innerText = `(Không gian điều trị riêng: ${doctor.full_name} • ${doctor.role === 'admin' ? 'Quản trị viên' : 'Bác sĩ điều trị'} • 100MB)`;
    }

    if (wsText) {
      wsText.innerHTML = `
        <span style="font-weight: 700;">${this.escape(labelText)}</span>
        ${isAdmin ? '<span style="font-size: 10px; margin-left: 4px; opacity: 0.8;" title="Chuyển không gian làm việc">▾</span>' : ''}
      `;
      wsText.style.cursor = 'pointer';
      wsText.onclick = () => {
        if (isAdmin) {
          window.patientController.openAdminWorkspaceSwitcherModal();
        } else {
          window.authController.openAuthModal('workspace');
        }
      };
    }
  }

  // MODAL CHUYỂN ĐỔI KHÔNG GIAN DÀNH CHO ADMIN
  openAdminWorkspaceSwitcherModal() {
    let modal = document.getElementById('adminWorkspaceModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adminWorkspaceModal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;';
      document.body.appendChild(modal);
    }

    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
    const currentMode = this.activeWorkspaceDoctorId || 'my_space';

    let docsHtml = '';
    allDocs.forEach(d => {
      const stats = this.calculateDoctorStorageUsage(d.id);
      const isSelected = (currentMode === d.id) || (currentMode === 'my_space' && d.id === activeDoc.id);
      const isDong = window.authController?.isDongAdmin?.(d);

      docsHtml += `
        <div onclick="window.patientController.switchWorkspaceDoctor('${d.id}'); window.patientController.closeAdminWorkspaceSwitcherModal();"
             style="background: ${isSelected ? '#eff6ff' : '#ffffff'}; border: 1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}; border-radius: 10px; padding: 12px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s ease;"
             onmouseover="this.style.borderColor='#2563eb'" onmouseout="if(!${isSelected}) this.style.borderColor='#e2e8f0'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: ${isDong ? '#1e3a8a' : '#0284c7'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
              ${window.authController?.getInitials?.(d.full_name) || 'BS'}
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                <span>${this.escape(d.full_name)}</span>
                ${isDong ? '<span style="background: #fef3c7; color: #92400e; font-size: 10px; padding: 1px 6px; border-radius: 6px; font-weight: 700;">Admin</span>' : ''}
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
                Tài khoản: <strong>${this.escape(d.username || '')}</strong> • ${this.escape(d.department || 'Khoa Nhiễm')}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12.5px; font-weight: 700; color: #2563eb;">${stats.patientsCount} người bệnh</div>
            <div style="font-size: 11px; color: #64748b;">💾 ${stats.usedFormatted} / 100MB</div>
          </div>
        </div>
      `;
    });

    const isAllSelected = currentMode === 'all';

    modal.innerHTML = `
      <div style="background: #ffffff; border-radius: 14px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); overflow: hidden; animation: modalFadeIn 0.2s ease;">
        <div style="background: #1e3a8a; color: white; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🎮</span>
            <div>
              <div style="font-size: 15px; font-weight: 800;">Chuyển Không Gian Làm Việc</div>
              <div style="font-size: 11.5px; opacity: 0.9;">Đặc quyền Quản trị viên (Admin: ${this.escape(activeDoc.full_name)})</div>
            </div>
          </div>
          <button onclick="window.patientController.closeAdminWorkspaceSwitcherModal()" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <div style="padding: 16px 20px; max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
          <!-- Nút Toàn Khoa -->
          <div onclick="window.patientController.switchWorkspaceDoctor('all'); window.patientController.closeAdminWorkspaceSwitcherModal();"
               style="background: ${isAllSelected ? '#eff6ff' : '#f8fafc'}; border: 1.5px solid ${isAllSelected ? '#2563eb' : '#cbd5e1'}; border-radius: 10px; padding: 12px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                🌐
              </div>
              <div>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Toàn Khoa (Tất cả Bác sĩ)</div>
                <div style="font-size: 11.5px; color: #64748b;">Giám sát toàn bộ người bệnh đang theo dõi trong khoa</div>
              </div>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: #059669;">Tổng quan</span>
          </div>

          <div style="font-size: 11.5px; font-weight: 700; color: #64748b; margin-top: 4px; text-transform: uppercase;">
            Không gian riêng từng tài khoản (100MB / ID):
          </div>
          ${docsHtml}
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 20px; display: flex; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="window.patientController.closeAdminWorkspaceSwitcherModal()">Đóng</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  closeAdminWorkspaceSwitcherModal() {
    const modal = document.getElementById('adminWorkspaceModal');
    if (modal) modal.style.display = 'none';
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
  flushActiveInput() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      try {
        document.activeElement.blur();
      } catch (e) {}
    }
  }

  async openAddPatientModal() {
    this.flushActiveInput();
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
    this.flushActiveInput();
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }

    const { doctor } = this.getEffectiveDoctor();
    const myDocName = doctor.full_name || 'BS. Nguyễn Hữu Đông';
    const myDocId = doctor.id || 'doc_dongnh';

    const newPatient = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      user_id: myDocId,
      doctor_id: myDocId,
      doctor_name: myDocName,
      handover_by_id: myDocId,
      handover_by: myDocName,
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
    const { doctor } = this.getEffectiveDoctor();
    const myDoc = doctor.full_name || 'BS. Nguyễn Hữu Đông';
    const myDocId = doctor.id || 'doc_dongnh';

    const newP = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      user_id: myDocId,
      doctor_id: myDocId,
      doctor_name: myDoc,
      handover_by_id: myDocId,
      handover_by: myDoc,
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
      chan_doan: headerRow.findIndex(c => c === 'cđ' || c === 'cd' || c === 'a' || c === 'dx' || c.includes('chẩn đoán') || c.includes('chan doan') || c.includes('(a)') || c.includes('diagnosis')),
      cls_hien_co: headerRow.findIndex(c => c.includes('hiện có') || c === 'cls_hien_co'),
      cls_can_lam: headerRow.findIndex(c => c.includes('cần làm') || c === 'cls_can_lam'),
      cls: headerRow.findIndex(c => c === 'cls' || c === 'xn' || c === 'lab' || c.includes('cận lâm sàng') || c.includes('xét nghiệm') || c.includes('cls')),
      y_lenh: headerRow.findIndex(c => c === 'yl' || c.includes('y lệnh') || c.includes('y lenh') || c.includes('điều trị')),
      them_thuoc: headerRow.findIndex(c => c.includes('thêm thuốc') || c.includes('them thuoc') || c.includes('bổ sung thuốc') || c === 'them_thuoc'),
      bac_si: headerRow.findIndex(c => c === 'bs' || c === 'bác sĩ' || c === 'bác sỹ' || c.includes('bác sĩ') || c.includes('bác sỹ') || c.includes('bs điều trị') || c.includes('bác sĩ điều trị'))
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
      let clsHcVal = mapping.cls_hien_co !== -1 ? String(row[mapping.cls_hien_co] || '').trim() : '';
      let clsClVal = mapping.cls_can_lam !== -1 ? String(row[mapping.cls_can_lam] || '').trim() : '';
      let clsVal = mapping.cls !== -1 ? String(row[mapping.cls] || '').trim() : '';
      if (!clsHcVal && clsVal) {
        if (clsVal.includes('[Hiện có]:') || clsVal.includes('[Cần làm]:')) {
          const hcMatch = clsVal.match(/\[Hiện có\]:\s*([\s\S]*?)(?=\n\[Cần làm\]:|$)/i);
          const clMatch = clsVal.match(/\[Cần làm\]:\s*([\s\S]*?)$/i);
          clsHcVal = hcMatch ? hcMatch[1].trim() : '';
          clsClVal = clMatch ? clMatch[1].trim() : '';
        } else {
          clsHcVal = clsVal;
        }
      }

      let ylVal = mapping.y_lenh !== -1 ? String(row[mapping.y_lenh] || '').trim() : '';
      let themThuocVal = mapping.them_thuoc !== -1 ? String(row[mapping.them_thuoc] || '').trim() : '';
      if (!themThuocVal && ylVal && ylVal.includes('[Thêm thuốc]:')) {
        const parts = ylVal.split(/\[Thêm thuốc\]:/i);
        ylVal = parts[0].trim();
        themThuocVal = parts[1] ? parts[1].trim() : '';
      }

      // Chỉ bỏ qua Y lệnh nếu ô đó CHỈ LÀ tên Bác sĩ (tránh việc nạp nhầm cột Bác sĩ vào Y lệnh)
      if (ylVal) {
        const ylLower = ylVal.toLowerCase();
        if (ylLower === 'bs. nguyễn hữu đông' || ylLower === 'bác sĩ điều trị' || ylLower === 'bs điều trị') {
          ylVal = '';
        }
      }

      let docVal = (mapping.bac_si !== -1 && row[mapping.bac_si]) ? String(row[mapping.bac_si]).trim() : myDoc;
      if (!docVal) docVal = myDoc;

      if (CONFIG.expandMedicalText) {
        cdVal = CONFIG.expandMedicalText(cdVal);
        clsHcVal = CONFIG.expandMedicalText(clsHcVal);
        clsClVal = CONFIG.expandMedicalText(clsClVal);
        ylVal = CONFIG.expandMedicalText(ylVal);
        themThuocVal = CONFIG.expandMedicalText(themThuocVal);
      }

      let combinedCls = '';
      if (clsHcVal && clsClVal) combinedCls = `[Hiện có]: ${clsHcVal}\n[Cần làm]: ${clsClVal}`;
      else if (clsClVal) combinedCls = `[Cần làm]: ${clsClVal}`;
      else combinedCls = clsHcVal;

      results.push({
        id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
        phong_giuong: phongGiuongVal,
        ten: tenVal,
        nam_sinh_tuoi: namSinhTuoiVal,
        chan_doan: cdVal,
        cls: combinedCls,
        cls_hien_co: clsHcVal,
        cls_can_lam: clsClVal,
        y_lenh: ylVal,
        them_thuoc: themThuocVal,
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
  // LỌC DANH SÁCH BỆNH NHÂN (HỖ TRỢ MOBILE FILTER CHIPS & TÌM KIẾM)
  // ==============================================================================
  getFilteredPatients() {
    let list = this.patientList;

    // Lọc theo Mobile Filter Chip nếu có
    if (this.activeMobileFilter && this.activeMobileFilter !== 'all') {
      if (this.activeMobileFilter === 'critical') {
        list = list.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
      } else if (this.activeMobileFilter === 'pending') {
        list = list.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING || p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
      } else if (this.activeMobileFilter.startsWith('room:')) {
        const targetRoom = this.activeMobileFilter.replace('room:', '');
        list = list.filter(p => this.extractRoomCode(p.phong_giuong) === targetRoom);
      }
    }

    const q = this.currentFilterQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(p => {
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
    const filtered = this.getFilteredPatients();

    // Cập nhật bộ đếm desktop
    const totalEl = document.getElementById('patientCount');
    if (totalEl) {
      totalEl.innerText = filtered.length;
    }

    // Cập nhật Header Pill Badge
    if (window.authController && window.authController.updateHeaderPill) {
      window.authController.updateHeaderPill(filtered.length, this.patientList.length);
    }

    // Cập nhật thanh tóm tắt Mobile (Mobile Clinical Header)
    this.updateMobileSummaryBar();

    // Cập nhật Mobile Filter Chips
    this.renderMobileFilterChips();

    // Render Bảng Desktop
    this.renderDesktopTable(filtered);

    // Render Thẻ Mobile
    this.renderMobileCards(filtered);

    // Kiểm tra empty state
    const emptyMsg = document.getElementById('emptyMessage');
    if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }

  // CẬP NHẬT THANH TÓM TẮT TRÊN MOBILE CLINICAL HEADER
  updateMobileSummaryBar() {
    const totalEl = document.getElementById('mobileSummaryTotal');
    const critEl = document.getElementById('mobileSummaryCritical');
    const pendEl = document.getElementById('mobileSummaryPending');
    const dateEl = document.getElementById('mobileSummaryDate');

    const total = this.patientList.length;
    const critical = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pending = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;

    if (totalEl) totalEl.innerText = total;
    if (critEl) critEl.innerText = critical;
    if (pendEl) pendEl.innerText = pending;

    if (dateEl) {
      const repDateInput = document.getElementById('reportDate');
      if (repDateInput && repDateInput.value) {
        const parts = repDateInput.value.split('-');
        if (parts.length === 3) {
          dateEl.innerText = `${parts[2]}/${parts[1]}`;
        } else {
          dateEl.innerText = repDateInput.value;
        }
      } else {
        const now = new Date();
        dateEl.innerText = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      }
    }
  }

  // RENDER DẢI FILTER CHIP TRÊN MOBILE
  renderMobileFilterChips() {
    const container = document.getElementById('mobileFilterChips');
    if (!container) return;

    const total = this.patientList.length;
    const critical = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pending = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;

    // Lấy danh sách các buồng hiện có
    const rooms = {};
    this.patientList.forEach(p => {
      const r = this.extractRoomCode(p.phong_giuong);
      if (r && r !== 'Chưa xếp phòng') {
        rooms[r] = (rooms[r] || 0) + 1;
      }
    });
    const sortedRooms = Object.keys(rooms).sort();

    let html = `
      <button class="mobile-filter-chip ${this.activeMobileFilter === 'all' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('all')">
        Tất cả (${total})
      </button>
    `;

    if (critical > 0) {
      html += `
        <button class="mobile-filter-chip chip-critical ${this.activeMobileFilter === 'critical' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('critical')">
          🚨 Báo động đỏ (${critical})
        </button>
      `;
    }

    if (pending > 0) {
      html += `
        <button class="mobile-filter-chip chip-pending ${this.activeMobileFilter === 'pending' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('pending')">
          ⏳ Cần bàn giao (${pending})
        </button>
      `;
    }

    sortedRooms.forEach(room => {
      const chipKey = `room:${room}`;
      html += `
        <button class="mobile-filter-chip ${this.activeMobileFilter === chipKey ? 'active' : ''}" onclick="window.patientController.setMobileFilter('${chipKey}')">
          🚪 ${this.escape(room)} (${rooms[room]})
        </button>
      `;
    });

    container.innerHTML = html;
  }

  setMobileFilter(filterKey) {
    this.activeMobileFilter = filterKey;
    this.render();
  }

  // TÌM KIẾM TRÊN MOBILE
  handleMobileSearch(query) {
    this.currentFilterQuery = query || '';
    const clearBtn = document.getElementById('btnMobileClearSearch');
    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }
    // Đồng bộ ô search desktop nếu có
    const deskSearch = document.getElementById('searchInput');
    if (deskSearch && deskSearch.value !== query) {
      deskSearch.value = query;
    }
    this.render();
  }

  clearMobileSearch() {
    const input = document.getElementById('mobileSearchInput');
    if (input) input.value = '';
    this.handleMobileSearch('');
  }

  // CHUYỂN ĐỔI CHẾ ĐỘ XEM TRÊN MOBILE (THẺ VS BẢNG)
  toggleMobileViewMode() {
    this.mobileViewMode = (this.mobileViewMode === 'cards') ? 'table' : 'cards';
    localStorage.setItem('medward_mobile_view_mode', this.mobileViewMode);
    this.applyMobileViewMode();
  }

  applyMobileViewMode() {
    const btn = document.getElementById('btnMobileToggleView');
    const label = document.getElementById('mobileViewToggleLabel');
    if (this.mobileViewMode === 'table') {
      document.body.classList.add('mobile-view-table');
      if (label) label.innerText = '📋 Bảng';
    } else {
      document.body.classList.remove('mobile-view-table');
      if (label) label.innerText = '📱 Thẻ';
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderDesktopTable(filtered) {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      if (this.patientList.length === 0) {
        const { doctor } = this.getEffectiveDoctor();
        tbody.innerHTML = `
          <tr class="empty-table-row">
            <td colspan="9" style="text-align: center; padding: 48px 20px; background: #ffffff;">
              <div style="max-width: 480px; margin: 0 auto; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 26px 20px;">
                <div style="font-size: 38px; margin-bottom: 8px;">🎮</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
                  Không gian điều trị riêng: ${this.escape(doctor.full_name)}
                </div>
                <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.55; margin-bottom: 16px;">
                  Mỗi tài khoản ID là một không gian lưu trữ độc lập (<strong>100MB / ID</strong>).<br>
                  Chưa có người bệnh nào trong không gian này. Dữ liệu của bạn được cách ly an toàn.
                </div>
                <button class="btn btn-primary" onclick="window.patientController.openAddPatientModal()" style="font-weight: 700; padding: 8px 18px; margin: 0 auto;">
                  ➕ Tiếp nhận người bệnh đầu tiên (Ctrl+N)
                </button>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = `
        <tr class="empty-table-row">
          <td colspan="9" style="text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 13.5px; background: #ffffff;">
            <div style="font-size: 28px; margin-bottom: 8px;">📋</div>
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px; font-size: 14px;">Chưa có bệnh nhân nào phù hợp bộ lọc</div>
            <div style="font-size: 12.5px; color: var(--text-muted);">Bấm nút <strong>+ Thêm NB (Ctrl+N)</strong> hoặc xóa từ khóa tìm kiếm.</div>
          </td>
        </tr>
      `;
      return;
    }

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
            <button class="btn-table-action" data-tooltip="Copy qua Zalo" onclick="window.patientController.copySinglePatientZalo('${p.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
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

  // ==============================================================================
  // RENDER CHẾ ĐỘ THẺ NGƯỜI BỆNH TRÊN THIẾT BỊ DI ĐỘNG (MOBILE CARDS VIEW)
  // ==============================================================================
  renderMobileCards(filtered) {
    const container = document.getElementById('mobileCardContainer');
    if (!container) return;
    container.innerHTML = '';

    if (filtered.length === 0) {
      if (this.patientList.length === 0) {
        const { doctor } = this.getEffectiveDoctor();
        container.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #64748b; background: white; border-radius: 12px; border: 1.5px dashed #cbd5e1; margin-top: 6px;">
            <div style="font-size: 36px; margin-bottom: 8px;">🎮</div>
            <div style="font-weight: 800; color: #1e293b; font-size: 15px; margin-bottom: 4px;">Không gian riêng: ${this.escape(doctor.full_name)}</div>
            <div style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 14px;">Mỗi tài khoản ID có 100MB lưu trữ dữ liệu độc lập.<br>Chưa có người bệnh nào trong không gian này.</div>
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 12px;">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('excelFileInput').click()" style="font-weight: 700; background: #f0fdf4; border-color: #86efac; color: #166534;">
                📊 Nhập từ file Excel (.xlsx)
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.patientController.openExportBackupModal()" style="font-weight: 700; background: #eff6ff; border-color: #bfdbfe; color: #1e40af;">
                🛡️ Sao lưu / Xuất file
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.patientController.openAddPatientModal()" style="font-weight: 700;">
                ➕ Tiếp nhận người bệnh đầu tiên
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: #64748b; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 6px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
          <div style="font-weight: 800; color: #1e293b; font-size: 14px;">Chưa có bệnh nhân nào phù hợp</div>
          <div style="font-size: 12px; margin: 6px 0 14px 0; color: #64748b;">Chạm nút <strong>+ Thêm NB</strong> hoặc nạp nhanh danh sách từ file Excel.</div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('excelFileInput').click()" style="font-weight: 700; background: #f0fdf4; border-color: #86efac; color: #166534;">
              📊 Nhập từ file Excel (.xlsx)
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.patientController.openAddPatientModal()" style="font-weight: 700;">
              ➕ Thêm NB mới
            </button>
          </div>
        </div>
      `;
      return;
    }

    filtered.forEach((p) => {
      this.normalizePatientClsAndOrders(p);
      const isCritical = p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
      const isPending = p.handover_status === CONFIG.HANDOVER_STATUS.PENDING;

      let statusPillHtml = '';
      if (isCritical) {
        statusPillHtml = `<span class="card-status-pill status-critical">🚨 BÁO ĐỘNG ĐỎ</span>`;
      } else if (isPending) {
        statusPillHtml = `<span class="card-status-pill status-pending">⏳ CẦN BÀN GIAO</span>`;
      } else {
        statusPillHtml = `<span class="card-status-pill status-none">✓ Ổn định</span>`;
      }

      const card = document.createElement('div');
      card.className = `mobile-patient-card ${isCritical ? 'card-critical' : (isPending ? 'card-pending' : '')}`;
      card.dataset.id = p.id;

      card.innerHTML = `
        <!-- HEADER THẺ: BUỒNG GIƯỜNG & TRẠNG THÁI -->
        <div class="card-header" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-room-badge">
            <span>🚪</span>
            <span>${this.escape(p.phong_giuong || 'Chưa xếp phòng')}</span>
          </div>
          ${statusPillHtml}
        </div>

        <!-- THÂN THẺ: TÊN & CHẨN ĐOÁN -->
        <div onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-name-row">
            <h3 class="patient-name">${this.escape(p.ten || 'BỆNH NHÂN CHƯA TÊN')}</h3>
            <span class="patient-age">${this.escape(p.nam_sinh_tuoi || '')}</span>
          </div>

          <div class="card-diagnosis-box" style="margin-bottom: 8px;">
            <strong>Chẩn đoán:</strong>
            ${this.escape(p.chan_doan || 'Chưa có chẩn đoán')}
          </div>

          <!-- 2 TẦNG LÂM SÀNG: CLS & Y LỆNH -->
          <div class="card-clinical-grid">
            <div class="card-tier-box tier-cls">
              <div class="card-tier-title">
                <span>🔬 Cận lâm sàng (CLS)</span>
              </div>
              <div class="card-tier-content">
                <div><span style="font-weight: 700; color: #0284c7;">✓ Hiện có:</span> ${this.escape(p.cls_hien_co || '—')}</div>
                ${p.cls_can_lam ? `
                  <div class="card-tier-highlight">
                    <span>⚡ Cần làm:</span> ${this.escape(p.cls_can_lam)}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="card-tier-box tier-yl">
              <div class="card-tier-title">
                <span>💊 Y lệnh điều trị</span>
              </div>
              <div class="card-tier-content">
                <div>${this.escape(p.y_lenh || '—')}</div>
                ${p.them_thuoc ? `
                  <div class="card-tier-highlight" style="color: #b45309;">
                    <span>💊 Thêm thuốc:</span> ${this.escape(p.them_thuoc)}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- CẢNH BÁO BÀN GIAO TRỰC -->
          ${(p.handover_issues || p.handover_actions) ? `
            <div class="card-handover-alert" style="margin-top: 8px;">
              <strong>🚨 BÀN GIAO CA TRỰC:</strong>
              ${p.handover_issues ? `<div>⚠️ <em>Tồn đọng:</em> ${this.escape(p.handover_issues)}</div>` : ''}
              ${p.handover_actions ? `<div>⚡ <em>Cần làm:</em> ${this.escape(p.handover_actions)}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- HÀNG NÚT HÀNH ĐỘNG DỄ CHẠM NGÓN TAY -->
        <div class="card-actions-row">
          <button type="button" class="card-btn-action btn-handover" onclick="window.handoverController.openHandoverModal('${p.id}')">
            <span>🚨</span>
            <span>Bàn giao</span>
          </button>
          <button type="button" class="card-btn-action btn-zalo" onclick="window.patientController.copySinglePatientZalo('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Zalo</span>
          </button>
          <button type="button" class="card-btn-action" onclick="window.patientController.openPatientDetailModal('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Chi tiết</span>
          </button>
          <button type="button" class="card-btn-action btn-danger" onclick="window.patientController.deletePatient('${p.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    this.currentEditingPatientId = patientId;
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
  // TÍNH NĂNG COPY QUA ZALO CHO NGƯỜI BỆNH
  // ==============================================================================
  copySinglePatientZalo(patientId) {
    if (window.handoverController) {
      window.handoverController.copySinglePatientZalo(patientId);
    }
  }

  copyCurrentPatientZalo() {
    if (!this.currentEditingPatientId) return;
    const p = this.patientList.find(item => item.id === this.currentEditingPatientId);
    if (!p) return;

    const chanDoan = document.getElementById('editDiagnosis')?.value.trim();
    const clsHcVal = document.getElementById('editClsHienCo') ? document.getElementById('editClsHienCo').value.trim() : '';
    const clsClVal = document.getElementById('editClsCanLam') ? document.getElementById('editClsCanLam').value.trim() : '';
    const ylVal = document.getElementById('editOrders')?.value.trim();
    const themThuocVal = document.getElementById('editThemThuoc') ? document.getElementById('editThemThuoc').value.trim() : '';
    const hoStatus = document.getElementById('editHandoverStatus')?.value;
    const hoIssues = document.getElementById('editHandoverIssues')?.value.trim();
    const hoActions = document.getElementById('editHandoverActions')?.value.trim();

    const tempP = {
      ...p,
      chan_doan: chanDoan || p.chan_doan,
      cls_hien_co: clsHcVal || p.cls_hien_co,
      cls_can_lam: clsClVal || p.cls_can_lam,
      y_lenh: ylVal || p.y_lenh,
      them_thuoc: themThuocVal || p.them_thuoc,
      handover_status: hoStatus || p.handover_status,
      handover_issues: hoIssues !== undefined ? hoIssues : p.handover_issues,
      handover_actions: hoActions !== undefined ? hoActions : p.handover_actions
    };

    if (window.handoverController) {
      const text = window.handoverController.formatPatientZaloText(tempP, true);
      window.handoverController.copyText(text, `📋 Đã sao chép người bệnh ${p.ten || ''} qua Zalo!`);
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
      if (window.showToast) window.showToast('ℹ️ Không có người bệnh nào có CLS cần làm hoặc Thêm thuốc');
      else if (window.updateSaveStatus) window.updateSaveStatus('ℹ️ Không có người bệnh nào có CLS cần làm hoặc Thêm thuốc', 'warning');
      return;
    }

    let dateStr = '';
    const reportDateInput = document.getElementById('reportDate');
    if (reportDateInput && reportDateInput.value) {
      const parts = reportDateInput.value.split('-');
      if (parts.length === 3) dateStr = `${parts[2]}/${parts[1]}`;
      else dateStr = reportDateInput.value;
    } else {
      const now = new Date();
      dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    let text = `📋 Y LỆNH (${dateStr})\n\n`;

    targetList.forEach((p, idx) => {
      const ten = (p.ten || 'BỆNH NHÂN').toUpperCase();
      const ns = p.nam_sinh_tuoi || '—';
      const phong = p.phong_giuong || 'Chưa xếp phòng';
      const cd = p.chan_doan || 'Chưa ghi';

      let issues = [];
      if (p.cls_can_lam && p.cls_can_lam.trim()) {
        issues.push('CLS: ' + p.cls_can_lam.trim());
      }
      if (p.them_thuoc && p.them_thuoc.trim()) {
        issues.push('Thuốc thêm: ' + p.them_thuoc.trim());
      }
      if (issues.length === 0 && p.y_lenh && p.y_lenh.trim()) {
        issues.push('Y lệnh: ' + p.y_lenh.trim());
      }
      const vanDe = issues.length > 0 ? issues.join('; ') : 'Thực hiện y lệnh thường quy';

      text += `${idx + 1}. - BN: ${ten}\n- Năm sinh: ${ns}\n- Phòng: ${phong}\n- CĐ: ${cd}\n- Vấn đề: ${vanDe}\n\n`;
    });

    if (window.handoverController && window.handoverController.copyText) {
      window.handoverController.copyText(text.trim(), '📋 Đã sao chép y lệnh Điều dưỡng qua Zalo!');
    } else {
      navigator.clipboard.writeText(text.trim()).then(() => {
        if (window.showToast) window.showToast('📋 Đã sao chép y lệnh Điều dưỡng qua Zalo!');
      });
    }
  }

  // ==============================================================================
  // TÍNH NĂNG XUẤT FILE EXCEL (.XLSX) VÀ FILE .CSV DỰ PHÒNG CHỐNG MẤT DỮ LIỆU
  // ==============================================================================
  openExportBackupModal() {
    const modal = document.getElementById('exportBackupModal');
    if (!modal) return;
    const countEl = document.getElementById('exportBackupPatientCount');
    if (countEl) {
      countEl.innerText = this.patientList ? this.patientList.length : 0;
    }
    modal.classList.add('active');
  }

  closeExportBackupModal() {
    const modal = document.getElementById('exportBackupModal');
    if (modal) modal.classList.remove('active');
  }

  getExportFilename(extension = 'xlsx') {
    let dateStr = '';
    const reportDateInput = document.getElementById('reportDate');
    if (reportDateInput && reportDateInput.value) {
      const parts = reportDateInput.value.split('-');
      if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      else dateStr = reportDateInput.value.replace(/[\/\\]/g, '-');
    } else {
      const now = new Date();
      dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    }

    const { doctor } = this.getEffectiveDoctor();
    const docSlug = (doctor?.username || 'bacsi').replace(/[^a-zA-Z0-9_]/g, '');
    return `DanhSachNguoiBenh_${docSlug}_${dateStr}.${extension}`;
  }

  getExportDataRows() {
    this.patientList.forEach(p => this.normalizePatientClsAndOrders(p));
    
    return this.patientList.map((p, idx) => {
      let trangThaiGiao = 'Bình thường';
      if (p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL) trangThaiGiao = '🚨 Nguy kịch (Báo động đỏ)';
      else if (p.handover_status === CONFIG.HANDOVER_STATUS.PENDING) trangThaiGiao = '⏳ Cần bàn giao / Theo dõi sát';

      return {
        'STT': idx + 1,
        'Buồng - Giường': p.phong_giuong || '',
        'Họ và tên': p.ten || '',
        'Năm sinh / Tuổi': p.nam_sinh_tuoi || '',
        'Chẩn đoán': p.chan_doan || '',
        'CLS Hiện có': p.cls_hien_co || p.cls || '',
        'CLS Cần làm': p.cls_can_lam || '',
        'Y lệnh điều trị': p.y_lenh || '',
        'Thêm thuốc': p.them_thuoc || '',
        'Trạng thái bàn giao': trangThaiGiao,
        'Vấn đề tồn đọng': p.handover_issues || '',
        'Xử trí / Cần làm tiếp': p.handover_actions || '',
        'Bác sĩ điều trị': p.doctor_name || 'BS. Nguyễn Hữu Đông'
      };
    });
  }

  exportToExcel() {
    if (!this.patientList || this.patientList.length === 0) {
      if (window.showToast) window.showToast('⚠️ Danh sách hiện đang trống, chưa có người bệnh để xuất file!');
      return;
    }

    const filename = this.getExportFilename('xlsx');
    const rows = this.getExportDataRows();

    try {
      if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Tự động căn chỉnh độ rộng cột thẩm mỹ
        const colWidths = [
          { wch: 6 },  // STT
          { wch: 16 }, // Buồng - Giường
          { wch: 25 }, // Họ và tên
          { wch: 16 }, // Năm sinh / Tuổi
          { wch: 38 }, // Chẩn đoán
          { wch: 32 }, // CLS Hiện có
          { wch: 24 }, // CLS Cần làm
          { wch: 36 }, // Y lệnh điều trị
          { wch: 22 }, // Thêm thuốc
          { wch: 24 }, // Trạng thái bàn giao
          { wch: 32 }, // Vấn đề tồn đọng
          { wch: 32 }, // Xử trí / Cần làm tiếp
          { wch: 22 }  // Bác sĩ điều trị
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DS_NguoiBenh');
        XLSX.writeFile(workbook, filename);

        if (window.showToast) {
          window.showToast(`✓ Đã tải file sao lưu Excel: ${filename}`);
        }
      } else {
        // Fallback sang CSV nếu thư viện XLSX chưa nạp kịp
        this.exportToCSV();
      }
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      // Fallback xuất CSV chống mất dữ liệu
      this.exportToCSV();
    }
  }

  exportToCSV() {
    if (!this.patientList || this.patientList.length === 0) {
      if (window.showToast) window.showToast('⚠️ Danh sách hiện đang trống, chưa có người bệnh để xuất file!');
      return;
    }

    const filename = this.getExportFilename('csv');
    const rows = this.getExportDataRows();
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    
    // Định dạng CSV chuẩn với BOM (\uFEFF) để Excel mở hiển thị đúng tiếng Việt có dấu
    let csvContent = '\uFEFF';
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

    rows.forEach(row => {
      const line = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
      csvContent += line + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast(`✓ Đã tải file sao lưu CSV: ${filename}`);
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
