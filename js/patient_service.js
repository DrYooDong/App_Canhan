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
    this.currentDate = this.getCurrentDateString();
    this.pendingRealtimePatches = [];

    this.init();
  }

  getCurrentDateString() {
    const repInput = document.getElementById('reportDate');
    if (repInput && repInput.value && repInput.value.trim().length >= 8) {
      return repInput.value.trim();
    }
    if (this.currentDate) return this.currentDate;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  formatDateToCompare(d) {
    if (!d) return '';
    if (window.supabaseService && window.supabaseService.formatDateToISO) {
      return window.supabaseService.formatDateToISO(d);
    }
    return String(d).trim();
  }

  async init() {
    this.loadSettings();
    this.applyMobileViewMode();
    this.currentDate = this.getCurrentDateString();
    await this.reloadFromSource(false, this.currentDate);
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

  // ==============================================================================
  // GRANULAR REALTIME LISTENER - ĐỒNG BỘ VI MÔ KHÔNG LÀM GIẬT GIAO DIỆN MOBILE
  // ==============================================================================
  setupRealtimeListener() {
    if (window.supabaseService) {
      window.supabaseService.onRealtimeUpdate((payload) => {
        if (!payload) return;

        // 1. Kiểm tra ngày: Nếu payload thuộc ngày khác với ngày đang xem thì bỏ qua
        const record = payload.new || payload.old;
        if (record && record.report_date) {
          const curIso = window.supabaseService.formatDateToISO(this.getCurrentDateString());
          const recIso = window.supabaseService.formatDateToISO(record.report_date);
          if (curIso !== recIso) {
            return; // Khác ngày làm việc hiện tại, bỏ qua
          }
        }

        // 2. Nếu người dùng đang tập trung gõ phím trên màn hình này:
        const isUserTyping = document.activeElement && (
          document.activeElement.isContentEditable ||
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA'
        );

        if (isUserTyping) {
          this.pendingRealtimePatches.push(payload);
          return;
        }

        // 3. Thực hiện áp dụng trực tiếp bản cập nhật
        this.applyRealtimePayload(payload);
      });

      // Lắng nghe khi người dùng kết thúc nhập liệu (focusout) để áp dụng các bản cập nhật chờ
      document.addEventListener('focusout', () => {
        if (this.pendingRealtimePatches && this.pendingRealtimePatches.length > 0) {
          setTimeout(() => {
            const isStillTyping = document.activeElement && (
              document.activeElement.isContentEditable ||
              document.activeElement.tagName === 'INPUT' ||
              document.activeElement.tagName === 'TEXTAREA'
            );
            if (!isStillTyping && this.pendingRealtimePatches.length > 0) {
              const patches = [...this.pendingRealtimePatches];
              this.pendingRealtimePatches = [];
              patches.forEach(p => this.applyRealtimePayload(p));
            }
          }, 350);
        }
      });
    }
  }

  flashPatientRow(patientId) {
    if (!patientId) return;
    setTimeout(() => {
      const row = document.querySelector(`tr[data-id="${patientId}"]`);
      const card = document.querySelector(`.mobile-patient-card[data-id="${patientId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.remove('row-realtime-flash');
        void row.offsetWidth;
        row.classList.add('row-realtime-flash');
        setTimeout(() => row.classList.remove('row-realtime-flash'), 3000);
      }
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.remove('card-realtime-flash');
        void card.offsetWidth;
        card.classList.add('card-realtime-flash');
        setTimeout(() => card.classList.remove('card-realtime-flash'), 3000);
      }
    }, 100);
  }

  applyRealtimePayload(payload) {
    const eventType = payload.eventType || (payload.new?.is_deleted ? 'DELETE' : 'UPDATE');
    const newRecord = payload.new;
    const oldRecord = payload.old;

    if (eventType === 'DELETE' || newRecord?.is_deleted) {
      const targetId = oldRecord?.id || newRecord?.id;
      if (targetId) {
        const deletedPatient = this.patientList.find(p => p.id === targetId);
        const pName = deletedPatient?.ten || oldRecord?.ten || newRecord?.ten || 'Một người bệnh';
        const pRoom = deletedPatient?.phong_giuong || oldRecord?.phong_giuong || '';
        const prevLen = this.patientList.length;
        this.patientList = this.patientList.filter(p => p.id !== targetId);
        if (this.patientList.length !== prevLen) {
          this.saveLocalCache();
          this.render();
          if (window.showToast) {
            window.showToast({
              title: '🗑️ XUẤT VIỆN / XÓA (REALTIME)',
              message: `BS khác vừa cập nhật xuất viện hoặc xóa người bệnh ${pName}${pRoom ? ` (${pRoom})` : ''}`,
              type: 'normal',
              icon: '🗑️'
            });
          }
        }
      }
      return;
    }

    if (eventType === 'INSERT') {
      if (newRecord && newRecord.id) {
        const exists = this.patientList.some(p => p.id === newRecord.id);
        if (!exists) {
          this.normalizePatientClsAndOrders(newRecord);
          this.patientList.push(newRecord);
          this.patientList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          this.saveLocalCache();
          this.render();
          const pName = newRecord.ten || 'Người bệnh mới';
          const pRoom = newRecord.phong_giuong ? ` (${newRecord.phong_giuong})` : '';
          const docBy = newRecord.doctor_name || newRecord.handover_by || '';
          if (window.showToast) {
            window.showToast({
              title: '➕ TIẾP NHẬN MỚI (REALTIME)',
              message: `Tiếp nhận người bệnh mới từ BS khác: ${pName}${pRoom}${docBy ? ` · BS: ${docBy}` : ''}`,
              type: 'handover',
              icon: '➕',
              patientId: newRecord.id,
              actionText: 'Xem ca này ➔'
            });
          }
          this.flashPatientRow(newRecord.id);
        }
      }
      return;
    }

    if (eventType === 'UPDATE') {
      if (newRecord && newRecord.id) {
        const idx = this.patientList.findIndex(p => p.id === newRecord.id);
        if (idx >= 0) {
          const oldP = this.patientList[idx];
          this.normalizePatientClsAndOrders(newRecord);
          this.patientList[idx] = { ...this.patientList[idx], ...newRecord };
          this.saveLocalCache();
          this.render();

          // Cập nhật ngay Dashboard bàn giao nếu bác sĩ đang mở xem
          if (window.handoverController && typeof window.handoverController.renderDashboard === 'function') {
            const hoModal = document.getElementById('handoverDashboardModal');
            if (hoModal && hoModal.classList.contains('active')) {
              window.handoverController.renderDashboard();
            }
          }

          const pName = newRecord.ten || oldP.ten || 'Người bệnh';
          const pRoom = newRecord.phong_giuong || oldP.phong_giuong || '';
          const roomStr = pRoom ? ` (${pRoom})` : '';

          // Phân tích nội dung thay đổi để thông báo rõ ràng cho bác sĩ trực
          const statusChanged = oldP.handover_status !== newRecord.handover_status;
          const issuesChanged = (oldP.handover_issues || '').trim() !== (newRecord.handover_issues || '').trim();
          const ordersChanged = (oldP.y_lenh || '').trim() !== (newRecord.y_lenh || '').trim() || (oldP.them_thuoc || '').trim() !== (newRecord.them_thuoc || '').trim();
          const labsChanged = (oldP.cls_can_lam || '').trim() !== (newRecord.cls_can_lam || '').trim() || (oldP.cls_hien_co || '').trim() !== (newRecord.cls_hien_co || '').trim();

          if (statusChanged || issuesChanged) {
            const isCritical = newRecord.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
            const isPending = newRecord.handover_status === CONFIG.HANDOVER_STATUS.PENDING;
            const statusCfg = CONFIG.STATUS_CONFIG[newRecord.handover_status] || {};
            const statusText = statusCfg.label || newRecord.handover_status;
            const statusIcon = isCritical ? '🚨' : (isPending ? '⏳' : (statusCfg.icon || '🔄'));
            const docBy = newRecord.handover_by || newRecord.doctor_name || 'BS khác';
            const issueDetail = (newRecord.handover_issues || '').trim() ? ` • Vấn đề: ${newRecord.handover_issues.trim()}` : '';

            if (window.showToast) {
              window.showToast({
                title: isCritical ? '🚨 BÁO ĐỘNG ĐỎ TRỰC LÂM SÀNG' : '🔄 BÀN GIAO TRỰC (REALTIME)',
                message: `${docBy} cập nhật BÀN GIAO ${pName}${roomStr} ➔ [${statusText}]${issueDetail}`,
                type: isCritical ? 'critical' : 'handover',
                icon: statusIcon,
                patientId: newRecord.id,
                actionText: 'Xem ca này ➔',
                duration: isCritical ? 7500 : 5500
              });
            }
            this.flashPatientRow(newRecord.id);
          } else if (ordersChanged) {
            if (window.showToast) {
              window.showToast({
                title: '💊 Y LỆNH ĐIỀU TRỊ (REALTIME)',
                message: `Y lệnh điều trị của ${pName}${roomStr} vừa được cập nhật từ thiết bị khác`,
                type: 'order',
                icon: '💊',
                patientId: newRecord.id,
                actionText: 'Xem ca này ➔'
              });
            }
            this.flashPatientRow(newRecord.id);
          } else if (labsChanged) {
            if (window.showToast) {
              window.showToast({
                title: '⚡ CHỈ ĐỊNH CLS (REALTIME)',
                message: `Chỉ định CLS / Kết quả của ${pName}${roomStr} vừa được cập nhật từ thiết bị khác`,
                type: 'lab',
                icon: '⚡',
                patientId: newRecord.id,
                actionText: 'Xem ca này ➔'
              });
            }
            this.flashPatientRow(newRecord.id);
          } else {
            if (window.showToast) {
              window.showToast({
                title: '🔄 ĐỒNG BỘ REALTIME',
                message: `Thông tin ${pName}${roomStr} đã đồng bộ từ thiết bị khác`,
                type: 'normal',
                icon: '🔄',
                patientId: newRecord.id,
                actionText: 'Xem ca này ➔'
              });
            }
            this.flashPatientRow(newRecord.id);
          }
        }
      }
    }
  }

  // ==============================================================================
  // HỆ THỐNG KHÔNG GIAN BIỆT LẬP TỪNG TÀI KHOẢN & PHÂN VÙNG THEO NGÀY
  // ==============================================================================
  getDoctorSpaceKey(docId, dateStr = null) {
    const dStr = dateStr || this.getCurrentDateString();
    const cleanDate = String(dStr).replace(/[\/\-\.]/g, '_');
    if (!docId) return `medward_patients_${cleanDate}`;
    return (CONFIG.STORAGE_KEYS.DOCTOR_SPACE_PREFIX || 'medward_doc_space_') + docId + '_' + cleanDate;
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

  loadDoctorPatients(docId, dateStr = null) {
    const key = this.getDoctorSpaceKey(docId, dateStr);
    const local = localStorage.getItem(key);
    if (local !== null) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }

    // Nếu là ngày hôm nay và là BS. Đông và chưa khởi tạo partition riêng
    const isToday = (this.formatDateToCompare(dateStr) === this.formatDateToCompare(new Date()));
    if (isToday && (docId === 'doc_dongnh' || (window.authController && window.authController.isDongAdmin({ id: docId })))) {
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

    return [];
  }

  async reloadFromSource(showNotice = true, targetDate = null) {
    const reqDate = targetDate || this.getCurrentDateString();
    this.currentDate = reqDate;
    const { doctor, isAll, isAdmin } = this.getEffectiveDoctor();
    let data = null;

    if (isAll) {
      // Chế độ Quản trị viên xem toàn bộ khoa: Tổng hợp người bệnh từ tất cả các bác sĩ
      const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
      const aggregated = [];
      const seenIds = new Set();
      allDocs.forEach(d => {
        const docPts = this.loadDoctorPatients(d.id, reqDate);
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
      // Chế độ Không gian riêng của từng Bác sĩ
      if (window.supabaseService && window.supabaseService.isCloudEnabled) {
        try {
          const cloudData = await window.supabaseService.fetchPatients(doctor, reqDate);
          if (cloudData && Array.isArray(cloudData)) {
            const docId = String(doctor.id || '').toLowerCase().trim();
            const docUsername = String(doctor.username || '').toLowerCase().trim();
            const docEmail = String(doctor.email || '').toLowerCase().trim();
            const docNameLower = (doctor.full_name || '').toLowerCase().trim();

            const isDongTarget = docId === 'doc_dongnh' || 
                                 docUsername === 'dongnh' || 
                                 docEmail.includes('dong') || 
                                 docNameLower.includes('đông') || 
                                 docNameLower.includes('dong');

            const matched = cloudData.filter(p => {
              if (p.is_deleted) return false;
              const pDocId = String(p.doctor_id || '').toLowerCase().trim();
              const pUserId = String(p.user_id || '').toLowerCase().trim();
              const pHandoverId = String(p.handover_by_id || '').toLowerCase().trim();
              const pDocName = (p.doctor_name || p.handover_by || '').toLowerCase().trim();

              if (isDongTarget) {
                return pDocId === 'doc_dongnh' || 
                       pDocId === docId ||
                       pUserId === docId ||
                       pDocName.includes('đông') || 
                       pDocName.includes('dong') ||
                       (!pDocName && !pDocId);
              }

              return pDocId === docId || 
                     pUserId === docId || 
                     pHandoverId === docId ||
                     (docUsername && (pDocId === docUsername || pDocName.includes(docUsername))) ||
                     (docNameLower && (pDocName === docNameLower || pDocName.includes(docNameLower)));
            });

            data = matched;
            localStorage.setItem(this.getDoctorSpaceKey(doctor.id, reqDate), JSON.stringify(matched));
          }
        } catch (err) {
          console.warn('Lưu ý kết nối Cloud:', err);
        }
      }

      if (data === null) {
        data = this.loadDoctorPatients(doctor.id, reqDate);
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
      if (window.supabaseService) {
        window.supabaseService.syncBatchPatients(this.patientList).catch(err => {
          console.warn('Lỗi đồng bộ chuẩn hóa dữ liệu lên Cloud:', err);
        });
      }
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
    const curDateStr = this.getCurrentDateString();
    if (isAll) {
      const partitionMap = {};
      this.patientList.forEach(p => {
        const dId = p.doctor_id || p.handover_by_id || 'doc_dongnh';
        if (!partitionMap[dId]) partitionMap[dId] = [];
        partitionMap[dId].push(p);
      });
      Object.keys(partitionMap).forEach(dId => {
        localStorage.setItem(this.getDoctorSpaceKey(dId, curDateStr), JSON.stringify(partitionMap[dId]));
      });
    } else {
      const key = this.getDoctorSpaceKey(doctor.id, curDateStr);
      localStorage.setItem(key, JSON.stringify(this.patientList));
      if (doctor.id === 'doc_dongnh' || window.authController?.isDongAdmin?.(doctor)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PATIENT_DATA, JSON.stringify(this.patientList));
      }
    }
    this.updateStorageHudUI();
  }

  // ==============================================================================
  // CHUYỂN ĐỔI NGÀY XEM (DATE SWITCHER & HISTORICAL VIEW)
  // ==============================================================================
  async changeReportDate(targetDateStr) {
    if (!targetDateStr) return;
    const cleanDate = targetDateStr.trim();
    this.currentDate = cleanDate;

    const repInput = document.getElementById('reportDate');
    if (repInput) repInput.value = cleanDate;

    const nativePicker = document.getElementById('nativeDatePicker');
    if (nativePicker && window.supabaseService) {
      nativePicker.value = window.supabaseService.formatDateToISO(cleanDate);
    }

    const mobSummaryDate = document.getElementById('mobileSummaryDate');
    if (mobSummaryDate) mobSummaryDate.innerText = cleanDate;

    await this.reloadFromSource(false, cleanDate);
    this.render();

    if (window.medWardApp && typeof window.medWardApp.updatePrintDateNote === 'function') {
      window.medWardApp.updatePrintDateNote();
    }

    const todayStr = (window.medWardApp && window.medWardApp.formatToDMY)
      ? window.medWardApp.formatToDMY(new Date())
      : new Date().toLocaleDateString('vi-VN');

    const isToday = (cleanDate === todayStr);
    if (window.showToast) {
      if (isToday) {
        window.showToast(`📅 Đang xem danh sách: Hôm nay (${cleanDate})`);
      } else {
        window.showToast(`📜 Lịch sử người bệnh ngày: ${cleanDate}`);
      }
    }
    if (window.updateSaveStatus) {
      window.updateSaveStatus(isToday ? `🟢 Ngày trực: ${cleanDate}` : `📜 Lịch sử: ${cleanDate}`);
    }
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
  // Lọc sạch toàn bộ các từ: "DỊCH VỤ", "NHIEMDV", "KHOA NHIỄM DỊCH VỤ", "DV", v.v.
  // ==============================================================================
  cleanRoom(r) {
    if (!r) return '';
    let s = String(r).trim();
    const m = s.match(/(D1\.\d+)/i);
    if (m) return m[1].toUpperCase();
    s = s.replace(/^(?:KHOA\s*)?NHI[ỄE]M[\s_.-]*(?:D[ỊI]CH[\s_.-]*V[ỤU]|DV|CLY)?[\s_.:\/-]*/i, '');
    s = s.replace(/(?:D[ỊI]CH[\s_.-]*V[ỤU]|DICHVU|DỊCHVU|DV|CLY)[\s_.:\/-]*$/i, '');
    s = s.replace(/\b(?:D[ỊI]CH[\s_.-]*V[ỤU]|DICHVU|DỊCHVU|DV)\b/gi, '');
    s = s.replace(/^(?:Phòng|Buồng|Phong|Buong|P\.?|B\.?)[\s.:_-]*/i, '');
    s = s.replace(/^d1\./i, 'D1.').trim();
    return s;
  }

  cleanBed(b) {
    if (!b) return '';
    let s = String(b).trim();
    const m = s.match(/[-_Gg]0*([1-9]\d*)$/i) || s.match(/0*([1-9]\d*)$/);
    if (m) return m[1];
    return s;
  }

  cleanRoomBedString(str) {
    if (!str) return '';
    let s = String(str).trim();

    // 1. Loại bỏ các tiền tố khoa, đơn vị, dịch vụ thường gặp trong file xuất bệnh viện (HIS):
    s = s.replace(/^(?:KHOA\s*)?NHI[ỄE]M[\s_.-]*(?:D[ỊI]CH[\s_.-]*V[ỤU]|DV|CLY)?[\s_.:\/-]*/i, '');
    s = s.replace(/(?:D[ỊI]CH[\s_.-]*V[ỤU]|DICHVU|DỊCHVU|DV|CLY)[\s_.:\/-]*$/i, '');
    s = s.replace(/\b(?:KHOA\s*)?NHI[ỄE]M[\s_.-]*(?:D[ỊI]CH[\s_.-]*V[ỤU]|DV|CLY)?\b/gi, ' ');
    s = s.replace(/\b(?:D[ỊI]CH[\s_.-]*V[ỤU]|DICHVU|DỊCHVU)\b/gi, ' ');
    s = s.replace(/\bDV\b/gi, ' ');

    // Loại bỏ các tiền tố buồng / phòng
    s = s.replace(/^(?:Phòng|Buồng|Phong|Buong|P\.?|B\.?)[\s.:_-]*/i, '');
    s = s.replace(/^[\s_.:\/-]+/, '').replace(/[\s_.:\/-]+$/, '').trim();

    if (!s) return '';
    s = s.replace(/^d1\./i, 'D1.');

    // 2. Khớp dạng: Buồng/Phòng - Giường -> Phòng-Giường
    const match = s.match(/^([A-Za-z0-9.]+)\s*[-–—/,\s]\s*(?:(?:Giường|G\.?)\s*)?([0-9A-Za-z]+)$/i);
    if (match) {
      let room = this.cleanRoom(match[1]);
      let bed = this.cleanBed(match[2]);
      return bed ? `${room}-${bed}` : room;
    }

    // 3. Khớp dạng dính liền: D1.01-G03 hoặc D1.01-03 hoặc D1.01-3
    const match2 = s.match(/^([A-Za-z0-9.]+)-G?0*([0-9]+)$/i);
    if (match2) {
      let room = this.cleanRoom(match2[1]);
      let bed = this.cleanBed(match2[2]);
      return bed ? `${room}-${bed}` : room;
    }

    // 4. Khớp dạng 3 phân đoạn chấm: D1.01.01 -> D1.01-1 (D1.01 là phòng, 01 là giường)
    const matchDotBed = s.match(/^([A-Za-z0-9]+\.[0-9]+)\.G?0*([0-9]+)$/i);
    if (matchDotBed) {
      let room = this.cleanRoom(matchDotBed[1]);
      let bed = this.cleanBed(matchDotBed[2]);
      return bed ? `${room}-${bed}` : room;
    }

    // 5. Chỉ có Giường: Giường 03 -> G3
    const match3 = s.match(/^(?:Giường|G\.?)\s*[-_]?\s*0*([0-9]+[A-Za-z]?)$/i);
    if (match3) {
      return `G${match3[1]}`;
    }

    // 6. Chỉ có Phòng: D1.01, 14
    const match4 = s.match(/^([A-Za-z0-9.]+)$/i);
    if (match4) {
      return this.cleanRoom(match4[1]);
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
      window.supabaseService.syncBatchPatients(this.patientList).catch(err => {
        console.warn('Lỗi đồng bộ sắp xếp lên cloud:', err);
      });
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
        await window.supabaseService.savePatient(this.patientList[idx], this.currentDate);
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
    } else if (field === 'nam_sinh_tuoi') {
      cleanVal = this.formatBirthYearAge(cleanVal);
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
        const res = await window.supabaseService.savePatient(this.patientList[idx], this.currentDate);
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
    const modal = document.getElementById('adminWorkspaceModal');
    const container = document.getElementById('adminWorkspaceListContainer');
    if (!modal || !container) return;

    const activeDoc = window.authController?.getActiveDoctor?.() || CONFIG.DEFAULT_DEMO_DOCTOR;
    const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
    const currentMode = this.activeWorkspaceDoctorId || 'my_space';
    const isAllSelected = currentMode === 'all';

    let html = `
      <!-- Nút Toàn Khoa -->
      <div class="admin-ws-item admin-ws-item-all ${isAllSelected ? 'selected' : ''}"
           onclick="window.patientController.switchWorkspaceDoctor('all'); window.patientController.closeAdminWorkspaceSwitcherModal();">
        <div class="admin-ws-item-left">
          <div class="admin-ws-avatar ws-avatar-all">🌐</div>
          <div>
            <div class="admin-ws-name">
              <span>Toàn Khoa (Tất cả Bác sĩ)</span>
              <span class="admin-ws-badge badge-all">Tổng quan</span>
            </div>
            <div class="admin-ws-sub">Giám sát toàn bộ người bệnh đang theo dõi trong khoa</div>
          </div>
        </div>
        <span class="admin-ws-chevron">➔</span>
      </div>

      <div class="admin-ws-section-label">Không gian riêng từng tài khoản (100MB / ID):</div>
    `;

    allDocs.forEach(d => {
      const stats = this.calculateDoctorStorageUsage(d.id);
      const isSelected = (currentMode === d.id) || (currentMode === 'my_space' && d.id === activeDoc.id);
      const isDong = window.authController?.isDongAdmin?.(d);

      html += `
        <div class="admin-ws-item ${isSelected ? 'selected' : ''}"
             onclick="window.patientController.switchWorkspaceDoctor('${d.id}'); window.patientController.closeAdminWorkspaceSwitcherModal();">
          <div class="admin-ws-item-left">
            <div class="admin-ws-avatar ${isDong ? 'ws-avatar-admin' : 'ws-avatar-doc'}">
              ${window.authController?.getInitials?.(d.full_name) || 'BS'}
            </div>
            <div>
              <div class="admin-ws-name">
                <span>${this.escape(d.full_name)}</span>
                ${isDong ? '<span class="admin-ws-badge badge-admin">Admin</span>' : ''}
                ${isSelected ? '<span class="admin-ws-badge badge-current">Đang chọn</span>' : ''}
              </div>
              <div class="admin-ws-sub">
                Tài khoản: <strong>${this.escape(d.username || '')}</strong> • ${this.escape(d.department || 'Khoa Nhiễm')}
              </div>
            </div>
          </div>
          <div class="admin-ws-item-right">
            <div class="admin-ws-count">${stats.patientsCount} người bệnh</div>
            <div class="admin-ws-storage">💾 ${stats.usedFormatted} / 100MB</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    modal.classList.add('active');
  }

  closeAdminWorkspaceSwitcherModal() {
    const modal = document.getElementById('adminWorkspaceModal');
    if (modal) modal.classList.remove('active');
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
      window.supabaseService.savePatient(this.patientList[idx]).catch(err => {
        console.warn('Lỗi đồng bộ chuyển bác sĩ lên cloud:', err);
      });
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
      if (window.showToast) window.showToast('⚠️ Vui lòng chọn ít nhất một người bệnh để chuyển sang ngày mới!');
      return;
    }

    const targetDate = document.getElementById('nextDayTargetDate')?.value?.trim();
    if (!targetDate) {
      if (window.showToast) window.showToast('⚠️ Vui lòng nhập ngày tiếp theo!');
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

    const targetIsoDate = window.supabaseService
      ? window.supabaseService.formatDateToISO(targetDate)
      : targetDate;

    // Xây dựng danh sách bệnh nhân cho ngày mới
    const newPatients = [];
    this.patientList.forEach((p) => {
      if (selectedIds.has(p.id)) {
        const nextP = {
          ...p,
          id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
          report_date: targetIsoDate,
          phong_giuong: this.cleanRoomBedString(p.phong_giuong),
          chan_doan: autoInc ? this.incrementIllnessDay(p.chan_doan) : p.chan_doan,
          y_lenh: keepOrders ? p.y_lenh : '',
          handover_status: resetHandover ? (p.handover_status === 'critical' ? 'critical' : 'none') : p.handover_status,
          handover_issues: resetHandover && p.handover_status !== 'critical' ? '' : p.handover_issues,
          handover_actions: resetHandover && p.handover_status !== 'critical' ? '' : p.handover_actions,
          sort_order: newPatients.length,
          is_discharged: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        newPatients.push(nextP);
      }
    });

    this.currentDate = targetDate;
    this.patientList = newPatients;
    this.saveLocalCache();

    // Cập nhật ngày báo cáo trên giao diện
    const repDateInput = document.getElementById('reportDate');
    if (repDateInput) repDateInput.value = targetDate;
    const nativeDate = document.getElementById('nativeDatePicker');
    if (nativeDate && window.supabaseService) {
      nativeDate.value = window.supabaseService.formatDateToISO(targetDate);
    }
    const mobSummaryDate = document.getElementById('mobileSummaryDate');
    if (mobSummaryDate) mobSummaryDate.innerText = targetDate;

    // Đồng bộ danh sách ngày mới lên Supabase Cloud
    if (window.supabaseService) {
      window.supabaseService.syncBatchPatients(this.patientList, targetIsoDate).catch(err => {
        console.warn('Lỗi đồng bộ ngày mới lên cloud:', err);
      });
      window.supabaseService.setWorkDayStatus(targetIsoDate, 'active', this.patientList.length);
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const currentIsoDate = window.supabaseService ? window.supabaseService.formatDateToISO(this.currentDate) : this.currentDate;
    const newPatient = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      report_date: currentIsoDate,
      user_id: uuidRegex.test(myDocId) ? myDocId : null,
      doctor_id: myDocId,
      doctor_name: myDocName,
      handover_by_id: uuidRegex.test(myDocId) ? myDocId : null,
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
      is_discharged: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.patientList.push(newPatient);
    this.saveLocalCache();
    this.updateDoctorFilterDropdown();
    this.render();

    // Async lưu lên cloud
    await window.supabaseService.savePatient(newPatient, this.currentDate);
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const currentIsoDate = window.supabaseService ? window.supabaseService.formatDateToISO(this.currentDate) : this.currentDate;
    const newP = {
      id: (CONFIG.generateUUID ? CONFIG.generateUUID() : crypto.randomUUID()),
      report_date: currentIsoDate,
      user_id: uuidRegex.test(myDocId) ? myDocId : null,
      doctor_id: myDocId,
      doctor_name: myDoc,
      handover_by_id: uuidRegex.test(myDocId) ? myDocId : null,
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
      is_discharged: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (idx >= 0) {
      this.patientList.splice(idx + 1, 0, newP);
    } else {
      this.patientList.push(newP);
    }

    this.saveLocalCache();
    window.supabaseService.syncBatchPatients(this.patientList, this.currentDate).catch(err => {
      console.warn('Lỗi đồng bộ thêm dòng lên cloud:', err);
    });
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
      report_date: this.patientList[idx].report_date || (window.supabaseService ? window.supabaseService.formatDateToISO(this.currentDate) : this.currentDate),
      updated_at: new Date().toISOString()
    };

    this.patientList[idx] = updated;
    this.saveLocalCache();
    this.render();

    // Async lưu lên cloud
    await window.supabaseService.savePatient(updated, this.currentDate);
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
      const oldIds = this.patientList.map(p => p.id);
      this.patientList = [];
      this.saveLocalCache();
      this.updateDoctorFilterDropdown();
      this.render();

      for (const pid of oldIds) {
        await window.supabaseService.deletePatient(pid).catch(() => {});
      }
      if (window.updateSaveStatus) {
        window.updateSaveStatus('✓ Đã xóa trắng danh sách');
      }
    }
  }

  // ==============================================================================
  // XỬ LÝ NHẬP EXCEL
  // ==============================================================================
  extractYearFromCell(val) {
    if (!val) return '';
    if (val instanceof Date) return String(val.getFullYear());
    if (typeof val === 'number' && val > 10000 && val < 60000) {
      const d = new Date((val - 25569) * 86400 * 1000);
      return String(d.getFullYear());
    }
    const s = String(val).trim();
    const m = s.match(/\b(19\d\d|20\d\d)\b/);
    if (m) return m[1];
    if (/^\d{4}$/.test(s)) return s;
    return '';
  }

  scoreHeaderRow(row) {
    if (!row || !Array.isArray(row)) return 0;
    let score = 0;
    let hasName = false;
    for (const cell of row) {
      const c = String(cell || '').toLowerCase().trim();
      if (!c) continue;
      if (c === 'stt' || c === 'tt' || c.includes('số tt') || c.includes('số thứ tự') || c === 'no' || c === 'no.') score += 2;
      if (c === 'họ và tên' || c === 'họ tên' || c === 'họ & tên' || c === 'tên' || c === 'người bệnh' || c === 'bệnh nhân' ||
          c.includes('họ tên') || c.includes('họ và tên') || c.includes('tên nb') || c.includes('tên bn') ||
          (c.includes('người bệnh') && !c.includes('mã')) || (c.includes('bệnh nhân') && !c.includes('mã')) ||
          c === 'nb' || c === 'bn' || c.includes('patient') || c.includes('full name')) {
        score += 4;
        hasName = true;
      }
      if (c.includes('phòng') || c.includes('buồng') || c.includes('giường') || c === 'p' || c === 'g' || c === 'b' || c === 'p/g' || c === 'b/g' || c === 'room' || c === 'bed') score += 2;
      if (c.includes('năm sinh') || c.includes('ngày sinh') || c.includes('tuổi') || c === 'ns' || c === 'dob' || c === 'age') score += 2;
      if (c.includes('chẩn đoán') || c.includes('chan doan') || c === 'cđ' || c === 'cd' || c === 'dx' || c.includes('bệnh chính') || c.includes('icd')) score += 2;
      if ((c.includes('y lệnh') || c.includes('y lenh') || c === 'yl' || c.includes('điều trị')) &&
          !c.includes('bác sĩ') && !c.includes('bác sỹ') && !c.includes('bs') && !c.includes('khoa') &&
          !c.includes('kết quả') && !c.includes('số ngày') && !c.includes('sơ kết') && !c.includes('hướng điều trị')) score += 2;
      if (c.includes('bác sĩ') || c.includes('bác sỹ') || c === 'bs' || c.includes('bs điều trị')) score += 2;
      if (c.includes('cls') || c.includes('xét nghiệm') || c.includes('cận lâm sàng')) score += 2;
      if (c.includes('mã nb') || c.includes('mã bn') || c.includes('mã ba') || c.includes('mã người bệnh') || c.includes('mã hồ sơ')) score += 2;
      if (c.includes('giới tính') || c === 'giới' || c === 'phái') score += 1;
    }
    return hasName ? score + 3 : score;
  }

  parseExcelRawRows(rows) {
    if (!rows || rows.length === 0) return [];

    let bestHeaderIdx = -1;
    let maxScore = 0;
    const maxScanRows = Math.min(rows.length, 60);

    for (let r = 0; r < maxScanRows; r++) {
      const score = this.scoreHeaderRow(rows[r]);
      if (score > maxScore) {
        maxScore = score;
        bestHeaderIdx = r;
      }
    }

    if (bestHeaderIdx === -1 || maxScore < 3) {
      bestHeaderIdx = rows.findIndex(r => Array.isArray(r) && r.some(c => String(c).trim().length > 0));
      if (bestHeaderIdx === -1) return [];
    }

    const headerRow = rows[bestHeaderIdx].map(c => String(c || '').toLowerCase().trim());

    // Nhận diện cột Tên Người Bệnh (ưu tiên tiêu đề rõ ràng, tránh nhầm cột "Mã người bệnh")
    let tenIdx = headerRow.findIndex(c =>
      c === 'họ và tên' || c === 'họ tên' || c === 'họ & tên' || c === 'họ tên nb' || c === 'họ tên bn' ||
      c === 'họ và tên nb' || c === 'họ và tên bn' || c === 'họ tên người bệnh' || c === 'họ và tên người bệnh' ||
      c === 'họ tên bệnh nhân' || c === 'họ và tên bệnh nhân' || c === 'tên nb' || c === 'tên bn' ||
      c === 'tên người bệnh' || c === 'tên bệnh nhân' || c === 'patient name' || c === 'full name'
    );
    if (tenIdx === -1) {
      tenIdx = headerRow.findIndex(c => (c.includes('họ tên') || c.includes('họ và tên') || c.includes('tên nb') || c.includes('tên bn')) && !c.includes('mã'));
    }
    if (tenIdx === -1) {
      tenIdx = headerRow.findIndex(c => c === 'người bệnh' || c === 'bệnh nhân' || c === 'nb' || c === 'bn' || c === 'patient');
    }
    if (tenIdx === -1) {
      tenIdx = headerRow.findIndex(c => (c.includes('người bệnh') || c.includes('bệnh nhân')) && !c.includes('mã') && !c.includes('loại') && !c.includes('trạng thái') && !c.includes('đối tượng'));
    }
    if (tenIdx === -1) {
      tenIdx = headerRow.findIndex(c => c === 'tên' || c === 'name');
    }

    const mapping = {
      ho: headerRow.findIndex(c => c === 'họ' || c === 'họ và đệm' || c === 'họ và chữ đệm' || c === 'họ và tên đệm' || c === 'họ lót' || c === 'họ đệm'),
      ten: tenIdx,
      phong: headerRow.findIndex(c => (c === 'phòng' || c === 'buồng' || c === 'p' || c === 'b' || ((c.includes('phòng') || c.includes('buồng')) && !c.includes('giường')))),
      giuong: headerRow.findIndex(c => (c === 'giường' || c === 'g' || (c.includes('giường') && !c.includes('phòng') && !c.includes('buồng')))),
      phong_giuong: headerRow.findIndex(c => c === 'p/g' || c === 'b/g' || c === 'p-g' || c === 'b-g' || c.includes('buồng - giường') || c.includes('phòng - giường') || c.includes('buồng/giường') || c.includes('phòng/giường') || c.includes('buồng giường') || c.includes('phòng giường')),
      ngay_sinh: headerRow.findIndex(c => c === 'ns' || c === 'dob' || c.includes('ngày sinh')),
      tuoi: headerRow.findIndex(c => c === 'tuổi' || c === 'age' || (c.includes('tuổi') && !c.includes('năm sinh') && !c.includes('ngày sinh'))),
      nam_sinh_tuoi: headerRow.findIndex(c => c.includes('năm sinh / tuổi') || c.includes('năm sinh/tuổi') || c.includes('ns (tuổi)') || c.includes('ns/tuổi') || ((c.includes('năm sinh') || c.includes('ns')) && c.includes('tuổi'))),
      nam_sinh: headerRow.findIndex(c => c === 'năm sinh' || (c.includes('năm sinh') && !c.includes('tuổi'))),
      chan_doan: headerRow.findIndex(c => c === 'cđ' || c === 'cd' || c === 'a' || c === 'dx' || c.includes('chẩn đoán') || c.includes('chan doan') || c.includes('bệnh chính') || c.includes('tên bệnh') || c.includes('icd')),
      huong_dieu_tri: headerRow.findIndex(c => c.includes('hướng điều trị')),
      y_lenh: headerRow.findIndex(c => (c === 'yl' || c.includes('y lệnh') || c.includes('y lenh') || c.includes('điều trị')) &&
        !c.includes('bác sĩ') && !c.includes('bác sỹ') && !c.includes('bs') && !c.includes('khoa') &&
        !c.includes('kết quả') && !c.includes('số ngày') && !c.includes('sơ kết') && !c.includes('hướng điều trị')),
      them_thuoc: headerRow.findIndex(c => c.includes('thêm thuốc') || c.includes('them thuoc') || c.includes('bổ sung thuốc') || c === 'them_thuoc'),
      bac_si: headerRow.findIndex(c => c === 'bs' || c === 'bác sĩ' || c === 'bác sỹ' || c.includes('bác sĩ') || c.includes('bác sỹ') || c.includes('bs điều trị')),
      ma_nb: headerRow.findIndex(c => c.includes('mã người bệnh') || c.includes('mã nb') || c.includes('mã bn') || c.includes('mã ba') || c.includes('mã hồ sơ')),
      cls_hien_co: headerRow.findIndex(c => c.includes('hiện có') || c === 'cls_hien_co'),
      cls_can_lam: headerRow.findIndex(c => c.includes('cần làm') || c === 'cls_can_lam'),
      cls: headerRow.findIndex(c => c === 'cls' || c === 'xn' || c === 'lab' || c.includes('cận lâm sàng') || c.includes('xét nghiệm')),
      trang_thai_bg: headerRow.findIndex(c => c.includes('trạng thái bàn giao') || c === 'bàn giao'),
      van_de_td: headerRow.findIndex(c => c.includes('vấn đề tồn đọng') || c.includes('tồn đọng')),
      xu_tri_tiep: headerRow.findIndex(c => c.includes('xử trí / cần làm tiếp') || c.includes('cần làm tiếp') || c.includes('xử trí tiếp'))
    };

    const activeDoc = window.authController?.getActiveDoctor?.();
    const myDoc = activeDoc ? activeDoc.full_name : 'BS. Nguyễn Hữu Đông';
    const results = [];

    for (let r = bestHeaderIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      // 1. Họ và tên người bệnh
      let tenVal = '';
      if (mapping.ho !== -1 && mapping.ten !== -1 && mapping.ho !== mapping.ten) {
        const ho = String(row[mapping.ho] || '').trim();
        const ten = String(row[mapping.ten] || '').trim();
        tenVal = [ho, ten].filter(Boolean).join(' ');
      } else if (mapping.ten !== -1) {
        tenVal = String(row[mapping.ten] || '').trim();
      }

      if (!tenVal) continue;
      const lowerTen = tenVal.toLowerCase();
      if (lowerTen.includes('tổng cộng') || lowerTen === 'họ và tên' || lowerTen === 'họ tên' || lowerTen === 'họ tên nb') continue;

      // 2. Buồng / Giường
      let phongGiuongVal = '';
      if (mapping.phong_giuong !== -1 && row[mapping.phong_giuong]) {
        phongGiuongVal = this.cleanRoomBedString(row[mapping.phong_giuong]);
      } else {
        const p = mapping.phong !== -1 ? String(row[mapping.phong] || '').trim() : '';
        const g = mapping.giuong !== -1 ? String(row[mapping.giuong] || '').trim() : '';
        if (p && g) {
          const rp = this.cleanRoom(p);
          const bg = this.cleanBed(g);
          phongGiuongVal = bg ? `${rp}-${bg}` : rp;
        } else if (p) {
          phongGiuongVal = this.cleanRoom(p);
        } else if (g) {
          phongGiuongVal = this.cleanBed(g);
        }
      }
      if (!phongGiuongVal) phongGiuongVal = 'D1.01-1';

      // 3. Năm sinh / Tuổi
      let namSinhTuoiVal = '';
      if (mapping.nam_sinh_tuoi !== -1 && row[mapping.nam_sinh_tuoi]) {
        namSinhTuoiVal = String(row[mapping.nam_sinh_tuoi]).trim();
      } else {
        const nsRaw = mapping.ngay_sinh !== -1 ? row[mapping.ngay_sinh] : (mapping.nam_sinh !== -1 ? row[mapping.nam_sinh] : '');
        const t = mapping.tuoi !== -1 ? String(row[mapping.tuoi] || '').trim() : '';
        const nam = this.extractYearFromCell(nsRaw);
        const curYear = new Date().getFullYear();

        if (nam && t) {
          namSinhTuoiVal = `${nam} (${t})`;
        } else if (nam && !t) {
          const calcAge = curYear - parseInt(nam);
          namSinhTuoiVal = `${nam} (${calcAge})`;
        } else if (t) {
          namSinhTuoiVal = `(${t} tuổi)`;
        }
      }

      // 4. Chẩn đoán
      let cdVal = mapping.chan_doan !== -1 ? String(row[mapping.chan_doan] || '').trim() : '';
      if (!cdVal && mapping.huong_dieu_tri !== -1 && row[mapping.huong_dieu_tri]) {
        cdVal = String(row[mapping.huong_dieu_tri]).trim();
      }
      if (!cdVal && mapping.ma_nb !== -1 && row[mapping.ma_nb]) {
        cdVal = `[Mã NB: ${String(row[mapping.ma_nb]).trim()}]`;
      }

      // 5. Cận lâm sàng (CLS)
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

      // 6. Y lệnh & Thêm thuốc
      let ylVal = mapping.y_lenh !== -1 ? String(row[mapping.y_lenh] || '').trim() : '';
      let themThuocVal = mapping.them_thuoc !== -1 ? String(row[mapping.them_thuoc] || '').trim() : '';
      if (!themThuocVal && ylVal && ylVal.includes('[Thêm thuốc]:')) {
        const parts = ylVal.split(/\[Thêm thuốc\]:/i);
        ylVal = parts[0].trim();
        themThuocVal = parts[1] ? parts[1].trim() : '';
      }

      // Không để tên Bác sĩ bị nạp nhầm vào Y lệnh
      if (ylVal) {
        const ylLower = ylVal.toLowerCase();
        if (ylLower.startsWith('bs.') || ylLower.startsWith('bs ') || ylLower === 'bác sĩ điều trị' || ylLower === 'bs điều trị') {
          ylVal = '';
        }
      }

      // 7. Bác sĩ điều trị
      let docVal = (mapping.bac_si !== -1 && row[mapping.bac_si]) ? String(row[mapping.bac_si]).trim() : myDoc;
      if (!docVal) docVal = myDoc;
      // Chuẩn hóa tên bác sĩ nếu có tiền tố tài khoản HIS (VD: "baoht - Hồ Thế Bảo" -> "BS. Hồ Thế Bảo")
      docVal = docVal.replace(/^[a-z0-9_]+\s*[-–—:]\s*/i, '').trim();
      if (docVal && !docVal.toLowerCase().startsWith('bs')) {
        docVal = `BS. ${docVal}`;
      }

      // 8. Trạng thái bàn giao
      let hoStatus = CONFIG.HANDOVER_STATUS.NONE;
      if (mapping.trang_thai_bg !== -1 && row[mapping.trang_thai_bg]) {
        const stStr = String(row[mapping.trang_thai_bg]).toLowerCase();
        if (stStr.includes('nguy kịch') || stStr.includes('critical')) {
          hoStatus = CONFIG.HANDOVER_STATUS.CRITICAL;
        } else if (stStr.includes('bàn giao') || stStr.includes('theo dõi') || stStr.includes('pending')) {
          hoStatus = CONFIG.HANDOVER_STATUS.PENDING;
        }
      }
      const hoIssues = mapping.van_de_td !== -1 ? String(row[mapping.van_de_td] || '').trim() : '';
      const hoActions = mapping.xu_tri_tiep !== -1 ? String(row[mapping.xu_tri_tiep] || '').trim() : '';

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
        handover_status: hoStatus,
        handover_issues: hoIssues,
        handover_actions: hoActions,
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

    // Cập nhật dải chỉ số KPI lâm sàng
    const totalCount = this.patientList.length;
    const criticalCount = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL).length;
    const pendingCount = this.patientList.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING).length;
    const stableCount = Math.max(0, totalCount - criticalCount - pendingCount);

    const deskTot = document.getElementById('desktopStatTotal');
    if (deskTot) deskTot.innerText = totalCount;
    const deskCrit = document.getElementById('desktopStatCritical');
    if (deskCrit) deskCrit.innerText = criticalCount;
    const deskPend = document.getElementById('desktopStatPending');
    if (deskPend) deskPend.innerText = pendingCount;
    const deskStab = document.getElementById('desktopStatStable');
    if (deskStab) deskStab.innerText = stableCount;

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

  // RENDER DẢI FILTER CHIP TRÊN MOBILE, TABLET & LAPTOP
  renderMobileFilterChips() {
    const mobileContainer = document.getElementById('mobileFilterChips');
    const desktopContainer = document.getElementById('desktopFilterChips');
    if (!mobileContainer && !desktopContainer) return;

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

    const generateChipsHtml = (btnClass) => {
      let html = `
        <button class="${btnClass} ${this.activeMobileFilter === 'all' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('all')">
          Tất cả (${total})
        </button>
      `;

      if (critical > 0) {
        html += `
          <button class="${btnClass} chip-critical ${this.activeMobileFilter === 'critical' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('critical')">
            🚨 Báo động đỏ (${critical})
          </button>
        `;
      }

      if (pending > 0) {
        html += `
          <button class="${btnClass} chip-pending ${this.activeMobileFilter === 'pending' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('pending')">
            ⏳ Cần bàn giao (${pending})
          </button>
        `;
      }

      sortedRooms.forEach(room => {
        const chipKey = `room:${room}`;
        html += `
          <button class="${btnClass} ${this.activeMobileFilter === chipKey ? 'active' : ''}" onclick="window.patientController.setMobileFilter('${chipKey}')">
            🚪 ${this.escape(room)} (${rooms[room]})
          </button>
        `;
      });
      return html;
    };

    if (mobileContainer) {
      mobileContainer.innerHTML = generateChipsHtml('mobile-filter-chip');
    }
    if (desktopContainer) {
      desktopContainer.innerHTML = generateChipsHtml('clinical-filter-chip');
    }
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

  // CHUYỂN ĐỔI CHẾ ĐỘ XEM TRÊN MOBILE / TABLET / LAPTOP
  toggleMobileViewMode() {
    if (window.medWardApp && window.medWardApp.toggleViewMode) {
      window.medWardApp.toggleViewMode();
    }
  }

  applyMobileViewMode() {
    // Được đồng bộ tự động qua MedWardApp.setupResponsiveAndViews()
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
            <td colspan="9" class="empty-table-cell">
              <div class="empty-workspace-banner">
                <div class="empty-banner-icon">🎮</div>
                <div class="empty-banner-title">
                  Không gian điều trị riêng: ${this.escape(doctor.full_name)}
                </div>
                <div class="empty-banner-desc">
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
          <td colspan="9" class="empty-table-cell">
            <div class="empty-filter-banner">
              <div class="empty-banner-icon">📋</div>
              <div class="empty-banner-title">Chưa có bệnh nhân nào phù hợp bộ lọc</div>
              <div class="empty-banner-desc">Bấm nút <strong>+ Thêm NB (Ctrl+N)</strong> hoặc xóa từ khóa tìm kiếm.</div>
            </div>
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
          <div class="empty-mobile-banner empty-mobile-workspace">
            <div class="empty-banner-icon">🎮</div>
            <div class="empty-banner-title">Không gian riêng: ${this.escape(doctor.full_name)}</div>
            <div class="empty-banner-desc">Mỗi tài khoản ID có 100MB lưu trữ dữ liệu độc lập.<br>Chưa có người bệnh nào trong không gian này.</div>
            <div class="empty-banner-actions">
              <button class="btn btn-secondary btn-sm btn-empty-excel" onclick="document.getElementById('excelFileInput').click()">
                📊 Nhập từ file Excel (.xlsx)
              </button>
              <button class="btn btn-secondary btn-sm btn-empty-backup" onclick="window.patientController.openExportBackupModal()">
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
        <div class="empty-mobile-banner empty-mobile-filter">
          <div class="empty-banner-icon">📋</div>
          <div class="empty-banner-title">Chưa có bệnh nhân nào phù hợp</div>
          <div class="empty-banner-desc">Chạm nút <strong>+ Thêm NB</strong> hoặc nạp nhanh danh sách từ file Excel.</div>
          <div class="empty-banner-actions">
            <button class="btn btn-secondary btn-sm btn-empty-excel" onclick="document.getElementById('excelFileInput').click()">
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M15 11h.01"/></svg>
            <span>${this.escape(p.phong_giuong || 'Chưa xếp phòng')}</span>
          </div>
          ${statusPillHtml}
        </div>

        <!-- THÂN THẺ: TÊN & CHẨN ĐOÁN -->
        <div class="card-body" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-name-row">
            <h3 class="patient-name">${this.escape(p.ten || 'BỆNH NHÂN CHƯA TÊN')}</h3>
            <span class="patient-age">${this.escape(p.nam_sinh_tuoi || '')}</span>
          </div>

          <div class="card-diagnosis-box">
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

        <!-- HÀNG NÚT HÀNH ĐỘNG DẠNG ICON GỌN GÀNG -->
        <div class="card-actions-row">
          <button type="button" class="card-btn-action btn-handover" title="Bàn giao ca trực" data-tooltip="Bàn giao ca trực" aria-label="Bàn giao ca trực" onclick="window.handoverController.openHandoverModal('${p.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <button type="button" class="card-btn-action btn-zalo" title="Copy gửi Zalo" data-tooltip="Copy gửi Zalo" aria-label="Copy gửi Zalo" onclick="window.patientController.copySinglePatientZalo('${p.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button type="button" class="card-btn-action" title="Chi tiết bệnh nhân" data-tooltip="Chi tiết bệnh nhân" aria-label="Chi tiết bệnh nhân" onclick="window.patientController.openPatientDetailModal('${p.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="card-btn-action btn-danger" title="Xóa người bệnh" data-tooltip="Xóa người bệnh" aria-label="Xóa người bệnh" onclick="window.patientController.deletePatient('${p.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // ==============================================================================
  // TỰ ĐỘNG TÍNH TUỔI TỪ NĂM SINH
  // ==============================================================================
  formatBirthYearAge(val) {
    if (!val) return '';
    const s = String(val).trim();
    if (!s) return '';

    const curYear = new Date().getFullYear();

    // 1. Nếu đã có dạng "1985 (41)" hoặc "1985 (41 tuổi)"
    const fullMatch = s.match(/^(\d{4})\s*\(([^)]+)\)$/);
    if (fullMatch) {
      const y = parseInt(fullMatch[1], 10);
      if (y >= 1900 && y <= curYear) {
        const expectedAge = curYear - y;
        return `${y} (${expectedAge})`;
      }
      return s;
    }

    // 2. Nếu người dùng nhập 4 chữ số năm sinh (VD: "1985", "2003", "1956")
    const yearMatch = s.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      if (y >= 1900 && y <= curYear) {
        const age = curYear - y;
        return `${y} (${age})`;
      }
    }

    // 3. Nếu người dùng nhập ngày tháng năm sinh (VD: "15/08/1985", "1985-08-15")
    const dateMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dateMatch) {
      const y = parseInt(dateMatch[3], 10);
      if (y >= 1900 && y <= curYear) {
        const age = curYear - y;
        return `${y} (${age})`;
      }
    }

    // 4. Nếu người dùng chỉ nhập số tuổi (VD: "41 tuổi", "41t", hoặc số nguyên)
    const ageMatch = s.match(/^(\d{1,3})\s*(?:tuổi|t)?$/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1], 10);
      if (age >= 0 && age <= 125) {
        const estYear = curYear - age;
        return `${estYear} (${age})`;
      }
    }

    return s;
  }

  handleAgeYearInput(inputEl) {
    if (!inputEl) return;
    const val = inputEl.value.trim();
    const badge = document.getElementById('calcAgeBadge');
    if (!badge) return;

    if (!val) {
      badge.textContent = '';
      badge.className = 'calc-age-badge';
      return;
    }

    const curYear = new Date().getFullYear();

    // 1. Kiểm tra nếu có năm sinh 4 chữ số
    const yearMatch = val.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      if (y >= 1900 && y <= curYear) {
        const age = curYear - y;
        badge.textContent = `⚡ Tuổi: ${age}`;
        badge.className = 'calc-age-badge has-age';
        return;
      }
    }

    // 2. Nếu người dùng nhập số tuổi
    const ageMatch = val.match(/^(\d{1,3})\s*(?:tuổi|t)?$/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1], 10);
      if (age >= 0 && age <= 125) {
        const estYear = curYear - age;
        badge.textContent = `⚡ Năm sinh: ${estYear}`;
        badge.className = 'calc-age-badge has-age';
        return;
      }
    }

    badge.textContent = '';
    badge.className = 'calc-age-badge';
  }

  handleAgeYearBlur(inputEl) {
    if (!inputEl) return;
    const val = inputEl.value.trim();
    if (!val) return;
    const formatted = this.formatBirthYearAge(val);
    if (formatted) {
      inputEl.value = formatted;
      this.handleAgeYearInput(inputEl);
    }
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
    const ageInput = document.getElementById('editAgeYear');
    if (ageInput) {
      ageInput.value = p.nam_sinh_tuoi || '';
      this.handleAgeYearInput(ageInput);
    }
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
    const ageYearInput = document.getElementById('editAgeYear');
    let rawAgeYear = ageYearInput ? ageYearInput.value.trim() : '';
    const formattedAgeYear = this.formatBirthYearAge(rawAgeYear);
    if (ageYearInput && formattedAgeYear) ageYearInput.value = formattedAgeYear;

    const updateData = {
      phong_giuong: this.cleanRoomBedString(document.getElementById('editRoomBed').value.trim()),
      ten: document.getElementById('editFullName').value.trim(),
      nam_sinh_tuoi: formattedAgeYear,
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
