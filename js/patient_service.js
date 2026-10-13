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

  getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getTodayDMY() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  getCurrentDateString() {
    return this.getTodayDMY();
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
    this.currentDate = this.getTodayDMY();

    // Luôn hiển thị ngày hôm nay trên giao diện
    const repInput = document.getElementById('reportDate');
    if (repInput) repInput.value = this.currentDate;
    const nativePicker = document.getElementById('nativeDatePicker');
    if (nativePicker) nativePicker.value = this.getTodayIso();
    const mobSummaryDate = document.getElementById('mobileSummaryDate');
    if (mobSummaryDate) mobSummaryDate.innerText = this.currentDate;

    // 1. Tải dữ liệu bệnh nhân hiện hành
    await this.reloadFromSource(false, this.currentDate);

    // 2. Dọn dẹp các cache lưu trữ ngày cũ để chỉ duy trì danh sách hôm nay
    this.cleanupLegacyOldDateStorage();

    // 3. Tự động kiểm tra và chuyển đổi thông minh nếu đã bước sang ngày mới (sau 0h)
    await this.checkAndExecuteAutoRollover();

    // 4. Kích hoạt bộ theo dõi 0h Realtime (Midnight Watcher)
    if (this._midnightInterval) clearInterval(this._midnightInterval);
    this._midnightInterval = setInterval(() => {
      this.checkMidnightRollover();
    }, 30000);

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
  // HỆ THỐNG KHÔNG GIAN BIỆT LẬP TỪNG TÀI KHOẢN (DUY NHẤT DANH SÁCH NGÀY HÔM NAY)
  // ==============================================================================
  getDoctorSpaceKey(docId, dateStr = null) {
    if (!docId) return CONFIG.STORAGE_KEYS.PATIENT_DATA || 'medward_patients_v2';
    return (CONFIG.STORAGE_KEYS.DOCTOR_SPACE_PREFIX || 'medward_doc_space_') + docId;
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
    const key = this.getDoctorSpaceKey(docId);
    let local = localStorage.getItem(key);

    // Migration bảo toàn dữ liệu: Nếu chưa có trong key mới, tìm từ các key cũ có đuôi ngày
    if (local === null) {
      const prefix = (CONFIG.STORAGE_KEYS.DOCTOR_SPACE_PREFIX || 'medward_doc_space_') + docId + '_';
      let foundLegacy = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          foundLegacy = localStorage.getItem(k);
          if (foundLegacy && foundLegacy !== '[]') break;
        }
      }
      if (foundLegacy) {
        local = foundLegacy;
        localStorage.setItem(key, local);
      }
    }

    if (local !== null) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }

    // Nếu là BS. Đông và chưa khởi tạo partition riêng
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
            localStorage.setItem(this.getDoctorSpaceKey(doctor.id), JSON.stringify(matched));
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

      // Dọn sạch nếu Chẩn đoán bị dính Mã NB trước đây
      if (p.chan_doan && /^\[Mã\s*(?:NB|BN|BA|hồ\s*sơ):\s*[^\]]+\]$/i.test(p.chan_doan.trim())) {
        p.chan_doan = '';
        cleaned = true;
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

    // Dọn sạch nếu Chẩn đoán bị dính Mã NB trước đây
    if (p.chan_doan && /^\[Mã\s*(?:NB|BN|BA|hồ\s*sơ):\s*[^\]]+\]$/i.test(p.chan_doan.trim())) {
      p.chan_doan = '';
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
    // Ghi nhớ mốc ngày hoạt động gần nhất
    localStorage.setItem('medward_last_active_date', this.getTodayIso());
    this.updateStorageHudUI();
  }

  // ==============================================================================
  // ĐẢM BẢO DUY TRÌ DANH SÁCH NGÀY HÔM NAY (KHÔNG LƯU TRỮ NGÀY CŨ)
  // ==============================================================================
  async changeReportDate(targetDateStr) {
    const todayDMY = this.getTodayDMY();
    const todayIso = this.getTodayIso();
    this.currentDate = todayDMY;

    const repInput = document.getElementById('reportDate');
    if (repInput) repInput.value = todayDMY;

    const nativePicker = document.getElementById('nativeDatePicker');
    if (nativePicker) nativePicker.value = todayIso;

    const mobSummaryDate = document.getElementById('mobileSummaryDate');
    if (mobSummaryDate) mobSummaryDate.innerText = todayDMY;

    if (window.medWardApp && typeof window.medWardApp.updatePrintDateNote === 'function') {
      window.medWardApp.updatePrintDateNote();
    }

    if (targetDateStr && targetDateStr.trim() !== todayDMY) {
      if (window.showToast) {
        window.showToast('ℹ️ Ứng dụng chỉ duy trì danh sách người bệnh ngày hôm nay và tự động cập nhật sau 0h mỗi ngày.');
      }
    } else {
      if (window.showToast) {
        window.showToast(`📅 Đang xem danh sách: Hôm nay (${todayDMY})`);
      }
    }

    if (window.updateSaveStatus) {
      window.updateSaveStatus(`🟢 Hôm nay: ${todayDMY}`);
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

  // LẤY BỘ MÀU PHÂN LOẠI BUỒNG THEO MÃ BUỒNG (COLOR-CODED ROOMS)
  getRoomTheme(roomCode) {
    if (window.CONFIG && typeof window.CONFIG.getRoomColorTheme === 'function') {
      return window.CONFIG.getRoomColorTheme(roomCode);
    }
    return { name: 'cerulean', accent: '#0284c7', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' };
  }

  // ==============================================================================
  // TÍNH NĂNG 2: XU HƯỚNG DENGUE (HCT & TIỂU CẦU TRENDLINE)
  // ==============================================================================
  isDenguePatient(p) {
    if (!p) return false;
    if (Array.isArray(p.dengue_trends) && p.dengue_trends.length > 0) return true;
    const cd = (p.chan_doan || '').toLowerCase();
    if (/\b(sxh|dengue|sốt\s*xuất\s*huyết|sot\s*xuat\s*huyet|cô\s*đặc\s*máu)\b/i.test(cd)) return true;
    const cls = (p.cls_hien_co || p.cls || '').toLowerCase();
    if ((cls.includes('hct') || cls.includes('hematocrit')) && (cls.includes('tc') || cls.includes('tiểu cầu') || cls.includes('tieu cau'))) return true;
    return false;
  }

  getPatientDengueTrends(p) {
    if (!p) return [];
    if (Array.isArray(p.dengue_trends) && p.dengue_trends.length > 0) {
      return p.dengue_trends;
    }
    // Tự động phân tích từ chuỗi kết quả CLS hiện có nếu chưa có mảng riêng
    const text = `${p.cls_hien_co || ''} ${p.cls || ''}`;
    const hctMatch = text.match(/(?:hct|hematocrit)\s*[:=]?\s*(\d{2}(?:\.\d)?)\s*%?/i);
    const tcMatch = text.match(/(?:tc|tiểu\s*cầu|tieu\s*cau)\s*[:=]?\s*(\d{1,3}(?:\.\d)?)\s*(?:k|nghìn|\.000)?/i);
    if (hctMatch && tcMatch) {
      const hct = parseFloat(hctMatch[1]);
      let tc = parseFloat(tcMatch[1]);
      if (tc < 10 && tc > 0) tc = tc * 100;
      return [{
        id: 'auto-base',
        date: this.currentDate || this.getTodayDMY(),
        time: '08:00',
        hct: hct,
        tc: tc,
        note: 'Mốc ban đầu'
      }];
    }
    return [];
  }

  calculateDengueDelta(trends) {
    if (!trends || trends.length === 0) return null;
    const latest = trends[trends.length - 1];
    const first = trends[0];
    const prev = trends.length >= 2 ? trends[trends.length - 2] : null;

    const deltaHct = prev ? parseFloat((latest.hct - prev.hct).toFixed(1)) : null;
    const deltaTc = prev ? (latest.tc - prev.tc) : null;
    const percentRise = first.hct > 0 ? parseFloat(((latest.hct - first.hct) / first.hct * 100).toFixed(1)) : 0;

    const isHemoconcentration = percentRise >= 20 || latest.hct >= 45;
    const isSevereThrombocytopenia = latest.tc < 50;
    const isCriticalTc = latest.tc < 20;

    let alertHtml = '';
    if (isCriticalTc) {
      alertHtml = `<div class="trend-box-alert">🚨 BÁO ĐỘNG ĐỎ: Tiểu cầu < 20k (nguy cơ xuất huyết cao)!</div>`;
    } else if (isHemoconcentration) {
      alertHtml = `<div class="trend-box-alert">⚠️ CÔ ĐẶC MÁU (Hct ${latest.hct}% ${percentRise >= 20 ? '+'+percentRise+'%' : ''})!</div>`;
    } else if (isSevereThrombocytopenia) {
      alertHtml = `<div class="trend-box-alert">⚠️ Tiểu cầu thấp (< 50k)!</div>`;
    }

    return {
      latestHct: latest.hct,
      latestTc: latest.tc,
      deltaHct,
      deltaTc,
      percentRise,
      isHemoconcentration,
      isSevereThrombocytopenia,
      isCriticalTc,
      alertHtml
    };
  }

  renderDengueSparklineSvg(trends, width = 140, height = 36) {
    if (!trends || trends.length === 0) {
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-size="10">Chưa có mốc đo</text></svg>`;
    }

    if (trends.length === 1) {
      const pt = trends[0];
      return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <line x1="8" y1="${height/2}" x2="${width-8}" y2="${height/2}" stroke="#e2e8f0" stroke-dasharray="2,2" stroke-width="1"/>
          <circle cx="22" cy="${height/2 - 4}" r="3.5" fill="#f43f5e" />
          <circle cx="22" cy="${height/2 + 6}" r="3.5" fill="#0284c7" />
          <text x="32" y="${height/2 + 3}" fill="#64748b" font-size="9.5" font-weight="700">${pt.hct}% / ${pt.tc}k</text>
        </svg>
      `;
    }

    const padX = 10;
    const padY = 6;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const n = trends.length;

    const minHct = 30;
    const maxHct = 55;
    const getYHct = (val) => padY + usableH - ((Math.max(minHct, Math.min(maxHct, val)) - minHct) / (maxHct - minHct)) * usableH;

    const minTc = 10;
    const maxTc = 200;
    const getYTc = (val) => padY + usableH - ((Math.max(minTc, Math.min(maxTc, val)) - minTc) / (maxTc - minTc)) * usableH;

    const getX = (idx) => padX + (idx / (n - 1)) * usableW;

    let dHct = '';
    let dTc = '';
    let dotsHct = '';
    let dotsTc = '';

    trends.forEach((t, i) => {
      const x = getX(i);
      const yH = getYHct(t.hct);
      const yT = getYTc(t.tc);

      if (i === 0) {
        dHct += `M ${x.toFixed(1)} ${yH.toFixed(1)}`;
        dTc += `M ${x.toFixed(1)} ${yT.toFixed(1)}`;
      } else {
        dHct += ` L ${x.toFixed(1)} ${yH.toFixed(1)}`;
        dTc += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
      }

      const isLast = i === n - 1;
      dotsHct += `<circle cx="${x.toFixed(1)}" cy="${yH.toFixed(1)}" r="${isLast ? 3.5 : 2}" fill="#f43f5e" ${isLast ? 'stroke="#ffffff" stroke-width="1.5"' : ''}/>`;
      dotsTc += `<circle cx="${x.toFixed(1)}" cy="${yT.toFixed(1)}" r="${isLast ? 3.5 : 2}" fill="#0284c7" ${isLast ? 'stroke="#ffffff" stroke-width="1.5"' : ''}/>`;
    });

    const yWarn = getYHct(45);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <line x1="${padX}" y1="${yWarn.toFixed(1)}" x2="${(width-padX)}" y2="${yWarn.toFixed(1)}" stroke="#fecaca" stroke-dasharray="2,2" stroke-width="1" />
        <path d="${dHct}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${dTc}" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dotsHct}
        ${dotsTc}
      </svg>
    `;
  }

  renderCardDengueTrendHtml(p) {
    const trends = this.getPatientDengueTrends(p);
    const delta = this.calculateDengueDelta(trends);
    const sparklineSvg = this.renderDengueSparklineSvg(trends, 130, 34);

    return `
      <div class="card-dengue-trend-box" onclick="event.stopPropagation(); window.patientController.openDengueTrendModal('${p.id}')">
        <div class="trend-box-header">
          <div class="trend-title-tag">
            <span class="trend-badge-pulse">📈</span>
            <strong>XU HƯỚNG SXH (Hct &amp; TC)</strong>
          </div>
          <button type="button" class="btn-trend-open">Chi tiết ➔</button>
        </div>
        <div class="trend-box-content">
          <div class="trend-sparkline-wrap">
            ${sparklineSvg}
          </div>
          <div class="trend-metrics-row">
            <div class="trend-metric metric-hct ${delta && delta.isHemoconcentration ? 'alert-danger' : ''}">
              <span class="m-label">Hct</span>
              <span class="m-val">${delta ? delta.latestHct + '%' : '—'}</span>
              ${delta && delta.deltaHct !== null ? `<span class="m-delta ${delta.deltaHct > 0 ? 'up' : 'down'}">${delta.deltaHct > 0 ? '▲+' : '▼'}${delta.deltaHct}%</span>` : ''}
            </div>
            <div class="trend-metric metric-tc ${delta && delta.isSevereThrombocytopenia ? 'alert-danger' : ''}">
              <span class="m-label">TC</span>
              <span class="m-val">${delta ? delta.latestTc + 'k' : '—'}</span>
              ${delta && delta.deltaTc !== null ? `<span class="m-delta ${delta.deltaTc < 0 ? 'down' : 'up'}">${delta.deltaTc > 0 ? '▲+' : '▼'}${delta.deltaTc}k</span>` : ''}
            </div>
          </div>
        </div>
        ${delta && delta.alertHtml ? delta.alertHtml : ''}
      </div>
    `;
  }

  openDengueTrendModal(patientId) {
    this.currentTrendPatientId = patientId;
    const p = this.patientList.find(item => item.id === patientId);
    if (!p) return;

    this.renderDengueTrendModalBody(p);
    const modal = document.getElementById('dengueTrendModal');
    if (modal) modal.classList.add('active');
  }

  openDengueTrendModalFromDetail() {
    const pId = document.getElementById('editPatientId')?.value || this.currentEditingPatientId;
    if (pId) {
      this.openDengueTrendModal(pId);
    }
  }

  closeDengueTrendModal() {
    const modal = document.getElementById('dengueTrendModal');
    if (modal) modal.classList.remove('active');
  }

  renderDengueTrendModalBody(p) {
    const body = document.getElementById('dengueTrendModalBody');
    if (!body) return;

    const trends = this.getPatientDengueTrends(p);
    const delta = this.calculateDengueDelta(trends);
    const roomTheme = this.getRoomTheme(this.extractRoomCode(p.phong_giuong));
    const fullSvg = this.renderDengueFullChartSvg(trends, 520, 150);

    let clinicalGuidanceHtml = '';
    if (delta) {
      if (delta.isCriticalTc) {
        clinicalGuidanceHtml = `
          <div class="dengue-clinical-card alert-danger">
            <span style="font-size: 20px;">🚨</span>
            <div>
              <strong>BÁO ĐỘNG ĐỎ: Tiểu cầu < 20.000/µL</strong><br>
              Nguy cơ xuất huyết tự nhiên rất cao. Theo dõi sát tri giác, da niêm, phân, nước tiểu. Hạn chế tiêm bắp, lấy ven cẩn trọng, sẵn sàng chỉ định truyền khối tiểu cầu nếu có xuất huyết nặng.
            </div>
          </div>
        `;
      } else if (delta.isHemoconcentration) {
        clinicalGuidanceHtml = `
          <div class="dengue-clinical-card alert-danger">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <strong>CÔ ĐẶC MÁU RÕ RỆT (Hct: ${delta.latestHct}%, tăng ${delta.percentRise}% so với mốc đầu)</strong><br>
              Dấu hiệu cảnh báo thoát huyết tương theo phác đồ Bộ Y Tế. Đánh giá sinh hiệu, nước tiểu, xem xét bù dịch điện giải (Ringer Lactate) theo phác đồ SXH Dengue người lớn.
            </div>
          </div>
        `;
      } else if (delta.isSevereThrombocytopenia) {
        clinicalGuidanceHtml = `
          <div class="dengue-clinical-card alert-warning">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <strong>TIỂU CẦU GIẢM NẶNG (< 50.000/µL)</strong><br>
              Cần theo dõi dấu hiệu xuất huyết, dặn bệnh nhân nghỉ ngơi tuyệt đối tại giường, tránh va chạm chấn thương.
            </div>
          </div>
        `;
      } else {
        clinicalGuidanceHtml = `
          <div class="dengue-clinical-card alert-success">
            <span style="font-size: 20px;">✅</span>
            <div>
              <strong>Chỉ số trong ngưỡng theo dõi ổn định</strong><br>
              Hct hiện tại: ${delta.latestHct}%, Tiểu cầu: ${delta.latestTc}k. Tiếp tục theo dõi CTM + Hct theo giờ chỉ định.
            </div>
          </div>
        `;
      }
    }

    const now = new Date();
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const curDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

    let tableRows = '';
    if (trends.length === 0) {
      tableRows = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 16px;">Chưa có dữ liệu theo dõi nào. Hãy thêm mốc đo đầu tiên ở form bên dưới!</td></tr>`;
    } else {
      trends.forEach((t, idx) => {
        tableRows += `
          <tr>
            <td style="font-weight: 700;">#${idx + 1}</td>
            <td>${this.escape(t.date || curDate)}</td>
            <td style="font-family: var(--font-mono, monospace); font-weight: 700;">${this.escape(t.time || '')}</td>
            <td style="color: #f43f5e; font-weight: 800; font-family: var(--font-mono, monospace);">${t.hct}%</td>
            <td style="color: #0284c7; font-weight: 800; font-family: var(--font-mono, monospace);">${t.tc}k</td>
            <td>${this.escape(t.note || '—')}</td>
            <td style="text-align: right;">
              <button type="button" class="btn-table-action action-delete" onclick="window.patientController.deleteDengueTrendPoint('${p.id}', '${t.id}')" title="Xóa mốc này">✕</button>
            </td>
          </tr>
        `;
      });
    }

    body.innerHTML = `
      <!-- THẺ THÔNG TIN BỆNH NHÂN -->
      <div class="dengue-modal-header-card" style="border-left: 5px solid ${roomTheme.accent};">
        <div class="dengue-patient-meta">
          <h3>${this.escape(p.ten || 'BỆNH NHÂN')} <span style="font-size: 13px; font-weight: 500; color: var(--text-muted);">${this.escape(p.nam_sinh_tuoi || '')}</span></h3>
          <p>🚪 Buồng/Giường: <strong>${this.escape(p.phong_giuong || 'Chưa xếp phòng')}</strong> • CĐ: <strong>${this.escape(p.chan_doan || 'Sốt xuất huyết Dengue')}</strong></p>
        </div>
        <div class="dengue-patient-tags">
          <span class="table-room-badge" style="border-color: ${roomTheme.border}; background: ${roomTheme.bg}; color: ${roomTheme.text};">
            ${this.escape(p.phong_giuong || 'P/G')}
          </span>
        </div>
      </div>

      <!-- BIỂU ĐỒ DIỄN TIẾN SVG PHÓNG TO -->
      <div class="dengue-chart-container">
        <div class="dengue-chart-header">
          <strong style="font-size: 13px; color: var(--text-main);">📈 Biểu Đồ Diễn Tiến Hct (%) &amp; Tiểu Cầu (k/µL)</strong>
          <div class="dengue-chart-legend">
            <div class="legend-item"><span class="legend-color-box hct"></span> <span>Hct (%) [Đỏ]</span></div>
            <div class="legend-item"><span class="legend-color-box tc"></span> <span>Tiểu Cầu (k/µL) [Xanh]</span></div>
          </div>
        </div>
        <div class="dengue-svg-wrapper">
          ${fullSvg}
        </div>
      </div>

      <!-- THẺ ĐÁNH GIÁ LÂM SÀNG -->
      ${clinicalGuidanceHtml}

      <!-- FORM THÊM MỐC ĐO NHANH -->
      <form class="dengue-add-form" onsubmit="event.preventDefault(); window.patientController.addDengueTrendPoint('${p.id}', this)">
        <div class="dengue-add-form-title">➕ Thêm Mốc Xét Nghiệm / Theo Dõi Mới:</div>
        <div class="dengue-form-grid">
          <div>
            <label style="font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px;">Ngày:</label>
            <input type="text" name="trendDate" class="form-control form-control-sm" value="${curDate}" required style="font-size: 12px; padding: 5px 8px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px;">Giờ đo:</label>
            <input type="time" name="trendTime" class="form-control form-control-sm" value="${curTime}" required style="font-size: 12px; padding: 5px 8px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px; color: #f43f5e;">Hct (%):</label>
            <input type="number" step="0.1" min="15" max="75" name="trendHct" placeholder="VD: 44" class="form-control form-control-sm" required style="font-size: 12px; padding: 5px 8px; font-weight: 700; color: #f43f5e;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px; color: #0284c7;">Tiểu cầu (k):</label>
            <input type="number" step="1" min="1" max="1000" name="trendTc" placeholder="VD: 65" class="form-control form-control-sm" required style="font-size: 12px; padding: 5px 8px; font-weight: 700; color: #0284c7;">
          </div>
          <div>
            <button type="submit" class="btn btn-primary btn-sm" style="font-size: 12px; padding: 6px 12px; font-weight: 700; white-space: nowrap;">
              ✓ Thêm Điểm
            </button>
          </div>
        </div>
      </form>

      <!-- BẢNG LỊCH SỬ CÁC LẦN ĐO -->
      <div class="dengue-table-wrap">
        <table class="dengue-points-table">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th style="width: 80px;">Ngày</th>
              <th style="width: 75px;">Giờ</th>
              <th style="width: 85px;">Hct (%)</th>
              <th style="width: 95px;">Tiểu Cầu (k)</th>
              <th>Ghi chú</th>
              <th style="width: 40px; text-align: right;">Xóa</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  renderDengueFullChartSvg(trends, width = 520, height = 150) {
    if (!trends || trends.length === 0) {
      return `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
          <rect width="${width}" height="${height}" fill="transparent"/>
          <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#94a3b8" font-size="12">
            Chưa có điểm dữ liệu nào. Hãy nhập điểm đo ở form bên dưới.
          </text>
        </svg>
      `;
    }

    const padL = 40;
    const padR = 40;
    const padT = 15;
    const padB = 25;
    const usableW = width - padL - padR;
    const usableH = height - padT - padB;
    const n = trends.length;

    const minHct = 30;
    const maxHct = 55;
    const getYHct = (v) => padT + usableH - ((Math.max(minHct, Math.min(maxHct, v)) - minHct) / (maxHct - minHct)) * usableH;

    const minTc = 10;
    const maxTc = 200;
    const getYTc = (v) => padT + usableH - ((Math.max(minTc, Math.min(maxTc, v)) - minTc) / (maxTc - minTc)) * usableH;

    const getX = (i) => n === 1 ? padL + usableW / 2 : padL + (i / (n - 1)) * usableW;

    let gridSvg = '';
    [35, 40, 45, 50].forEach(hctLvl => {
      const y = getYHct(hctLvl);
      const isWarn = hctLvl === 45;
      gridSvg += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${isWarn ? '#fecaca' : '#f1f5f9'}" stroke-dasharray="${isWarn ? '3,3' : 'none'}" stroke-width="${isWarn ? 1.5 : 1}"/>`;
      gridSvg += `<text x="${padL - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" fill="${isWarn ? '#f43f5e' : '#94a3b8'}" font-size="9" font-weight="${isWarn ? 700 : 500}">${hctLvl}%</text>`;
    });

    [50, 100, 150].forEach(tcLvl => {
      const y = getYTc(tcLvl);
      gridSvg += `<text x="${width - padR + 6}" y="${(y + 3).toFixed(1)}" text-anchor="start" fill="#0284c7" font-size="9" font-weight="600">${tcLvl}k</text>`;
    });

    let pathHct = '';
    let pathTc = '';
    let ptsSvg = '';

    trends.forEach((t, i) => {
      const x = getX(i);
      const yH = getYHct(t.hct);
      const yT = getYTc(t.tc);

      if (i === 0) {
        pathHct += `M ${x.toFixed(1)} ${yH.toFixed(1)}`;
        pathTc += `M ${x.toFixed(1)} ${yT.toFixed(1)}`;
      } else {
        pathHct += ` L ${x.toFixed(1)} ${yH.toFixed(1)}`;
        pathTc += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
      }

      const labelTime = t.time || `${i+1}`;
      gridSvg += `<text x="${x.toFixed(1)}" y="${(height - 6).toFixed(1)}" text-anchor="middle" fill="#64748b" font-size="9.5" font-weight="600">${labelTime}</text>`;

      ptsSvg += `
        <circle cx="${x.toFixed(1)}" cy="${yH.toFixed(1)}" r="4" fill="#f43f5e" stroke="#ffffff" stroke-width="2"/>
        <text x="${x.toFixed(1)}" y="${(yH - 7).toFixed(1)}" text-anchor="middle" fill="#f43f5e" font-size="10" font-weight="800">${t.hct}%</text>
        <circle cx="${x.toFixed(1)}" cy="${yT.toFixed(1)}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
        <text x="${x.toFixed(1)}" y="${(yT + 14).toFixed(1)}" text-anchor="middle" fill="#0284c7" font-size="10" font-weight="800">${t.tc}k</text>
      `;
    });

    return `
      <svg class="dengue-svg-chart" width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        ${gridSvg}
        <path d="${pathHct}" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${pathTc}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${ptsSvg}
      </svg>
    `;
  }

  addDengueTrendPoint(patientId, formEl) {
    const p = this.patientList.find(item => item.id === patientId);
    if (!p) return;

    const fd = new FormData(formEl);
    const dateVal = fd.get('trendDate')?.trim() || this.currentDate || this.getTodayDMY();
    const timeVal = fd.get('trendTime')?.trim() || '08:00';
    const hctVal = parseFloat(fd.get('trendHct'));
    const tcVal = parseFloat(fd.get('trendTc'));

    if (isNaN(hctVal) || isNaN(tcVal)) {
      alert('Vui lòng nhập đầy đủ giá trị số cho Hct và Tiểu cầu!');
      return;
    }

    if (!Array.isArray(p.dengue_trends)) {
      p.dengue_trends = this.getPatientDengueTrends(p);
    }

    const newPt = {
      id: 'dt_' + Date.now(),
      date: dateVal,
      time: timeVal,
      hct: hctVal,
      tc: tcVal,
      note: ''
    };

    p.dengue_trends.push(newPt);
    this.saveLocalCache();
    this.renderDengueTrendModalBody(p);
    this.render();

    if (window.updateSaveStatus) {
      window.updateSaveStatus(`✓ Đã lưu mốc Hct ${hctVal}%, TC ${tcVal}k`);
    }
  }

  deleteDengueTrendPoint(patientId, pointId) {
    const p = this.patientList.find(item => item.id === patientId);
    if (!p || !Array.isArray(p.dengue_trends)) return;

    p.dengue_trends = p.dengue_trends.filter(pt => pt.id !== pointId);
    this.saveLocalCache();
    this.renderDengueTrendModalBody(p);
    this.render();
  }

  syncTrendsToCls(patientId) {
    const pId = patientId || this.currentTrendPatientId;
    const p = this.patientList.find(item => item.id === pId);
    if (!p) return;

    const trends = this.getPatientDengueTrends(p);
    if (!trends || trends.length === 0) {
      alert('Chưa có dữ liệu xu hướng để đồng bộ!');
      return;
    }

    const summaryParts = trends.map(t => `${t.time ? t.time : ''}: Hct ${t.hct}%, TC ${t.tc}k`).join(' -> ');
    const trendStr = `[Diễn tiến Hct/TC]: ${summaryParts}`;

    let curClsHc = (p.cls_hien_co || '').trim();
    if (curClsHc.includes('[Diễn tiến Hct/TC]:')) {
      curClsHc = curClsHc.replace(/\[Diễn tiến Hct\/TC\]:[^\n]+/g, trendStr).trim();
    } else if (curClsHc) {
      curClsHc = `${curClsHc}\n${trendStr}`;
    } else {
      curClsHc = trendStr;
    }

    p.cls_hien_co = curClsHc;
    this.saveLocalCache();
    if (window.supabaseService) {
      window.supabaseService.savePatient(p).catch(() => {});
    }
    this.render();

    const editClsHc = document.getElementById('editClsHienCo');
    if (editClsHc && document.getElementById('editPatientId')?.value === p.id) {
      editClsHc.value = curClsHc;
    }

    alert('✓ Đã đồng bộ chuỗi xu hướng Hct & Tiểu cầu vào ô CLS Hiện Có thành công!');
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
    } else if (CONFIG.expandMedicalText && field === 'chan_doan') {
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

    // Cập nhật danh sách gợi ý bác sĩ vào datalist
    const datalist = document.getElementById('doctorListDatalist');
    if (datalist && window.authController?.getKnownDoctors) {
      const knownDocs = window.authController.getKnownDoctors();
      datalist.innerHTML = knownDocs.map(d => `<option value="${this.escape(d.full_name)}">${this.escape(d.title || 'Bác sĩ')} • ${this.escape(d.department || 'Khoa Nhiễm')}</option>`).join('');
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

    const allDocs = window.authController?.getKnownDoctors?.() || [CONFIG.DEFAULT_DEMO_DOCTOR];
    const currentDoc = this.patientList[idx].doctor_name || this.patientList[idx].handover_by || '';

    // Luân chuyển sang bác sĩ tiếp theo trong danh sách khoa
    const currentIdx = allDocs.findIndex(d => d.full_name === currentDoc || d.username === currentDoc);
    const nextDoc = allDocs[(currentIdx + 1) % allDocs.length];
    const newDocName = nextDoc.full_name;

    this.patientList[idx].doctor_name = newDocName;
    this.patientList[idx].handover_by = newDocName;
    this.patientList[idx].updated_at = new Date().toISOString();
    this.saveLocalCache();
    window.supabaseService.savePatient(this.patientList[idx]).catch(err => {
      console.warn('Lỗi đồng bộ chuyển bác sĩ lên cloud:', err);
    });
    this.updateDoctorFilterDropdown();
    this.render();
    if (window.showToast) {
      window.showToast(`✓ Đã chuyển người bệnh sang BS: ${newDocName}`);
    }
  }

  // ==============================================================================
  // TÍNH NĂNG CHUYỂN ĐỔI NGÀY MỚI THÔNG MINH (SMART MIDNIGHT ROLLOVER)
  // Bỏ lưu trữ ngày cũ — Chỉ duy trì danh sách ngày hôm nay
  // ==============================================================================
  
  // 1. DỌN DẸP CACHE LƯU TRỮ NGÀY CŨ (GIẢI PHÓNG BỘ NHỚ & CHỈ GIỮ NGÀY HÔM NAY)
  cleanupLegacyOldDateStorage() {
    try {
      localStorage.removeItem('medward_archived_days');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // Bắt các key ngày cũ: medward_doc_space_*_DD_MM_YYYY hoặc medward_patients_YYYY-MM-DD
        if (/^medward_doc_space_.*_\d{1,2}_\d{1,2}_\d{4}$/.test(k) || /^medward_patients_\d{4}-\d{2}-\d{2}$/.test(k)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Lỗi dọn dẹp storage ngày cũ:', e);
    }
  }

  // 2. NHẬN DIỆN NGƯỜI BỆNH ĐÃ XUẤT VIỆN / RA VIỆN / XIN VỀ / CHUYỂN VIỆN
  isDischargedPatient(p) {
    if (!p) return false;
    if (p.is_discharged === true) return true;
    const text = `${p.chan_doan || ''} ${p.y_lenh || ''} ${p.them_thuoc || ''} ${p.handover_issues || ''} ${p.handover_actions || ''} ${p.phong_giuong || ''} ${p.ghi_chu || ''}`.toLowerCase();
    return /ra\s*vi[ệe]n|xu[ấa]t\s*vi[ệe]n|chuy[ểe]n\s*vi[ệe]n|xin\s*v[ềe]|t[ửu]\s*vong|tr[ốo]n\s*vi[ệe]n|cho\s*v[ềe]|\brv\b|\bxv\b/i.test(text);
  }

  // 3. KHÔNG TỰ ĐỘNG TĂNG SỐ NGÀY BỆNH (GIỮ NGUYÊN CHẨN ĐOÁN GỐC CỦA BÁC SĨ)
  smartIncrementIllnessDay(diagnosis, diffDays = 1) {
    return diagnosis || '';
  }

  // Alias để bảo đảm tương thích với code cũ
  incrementIllnessDay(diagnosis) {
    return this.smartIncrementIllnessDay(diagnosis, 1);
  }

  // 4. KHÔNG TỰ ĐỘNG TĂNG SỐ NGÀY KHÁNG SINH & THUỐC (GIỮ NGUYÊN Y LỆNH GỐC CỦA BÁC SĨ)
  smartIncrementMedicationDay(orders, diffDays = 1) {
    return orders || '';
  }

  // 5. THỰC THI CHUYỂN ĐỔI NGÀY MỚI (KHÔNG TỰ ĐỘNG XÓA XUẤT VIỆN, KHÔNG TỰ ĐỘNG TĂNG NGÀY)
  async performSmartDailyRollover(diffDays = 1, fromDateStr = '', toDateStr = '', manualTrigger = false) {
    const todayIso = this.getTodayIso();
    const todayDMY = this.getTodayDMY();

    if (!this.patientList || this.patientList.length === 0) {
      localStorage.setItem('medward_last_active_date', todayIso);
      return;
    }

    // Giữ nguyên toàn bộ danh sách người bệnh (không xóa ca xuất viện, không tăng số ngày)
    const activePatients = this.patientList.map((p) => {
      // Trạng thái giao ban: Báo động đỏ giữ nguyên, ca khác về bình thường khi chuyển ngày thủ công
      const nextStatus = (p.handover_status === 'critical') ? 'critical' : (manualTrigger ? 'none' : (p.handover_status || 'none'));
      const keepIssues = (p.handover_status === 'critical') ? p.handover_issues : (manualTrigger ? '' : (p.handover_issues || ''));
      const keepActions = (p.handover_status === 'critical') ? p.handover_actions : (manualTrigger ? '' : (p.handover_actions || ''));

      return {
        ...p,
        report_date: todayIso,
        chan_doan: p.chan_doan || '',
        y_lenh: p.y_lenh || '',
        them_thuoc: p.them_thuoc || '',
        handover_status: nextStatus,
        handover_issues: keepIssues,
        handover_actions: keepActions,
        updated_at: new Date().toISOString()
      };
    });

    // Cập nhật danh sách ngày hôm nay
    this.patientList = activePatients;
    this.saveLocalCache();

    // Đồng bộ lên Supabase Cloud
    if (window.supabaseService) {
      // Đồng bộ danh sách ngày hôm nay
      window.supabaseService.syncBatchPatients(this.patientList, todayIso).catch(err => {
        console.warn('Lỗi đồng bộ ngày hôm nay lên Cloud:', err);
      });
      window.supabaseService.setWorkDayStatus(todayIso, 'active', this.patientList.length);

      // Tự động xóa dữ liệu cũ trên Cloud (chỉ giữ hôm qua & hôm nay)
      window.supabaseService.purgeOldData?.().catch(() => {});
    }

    // Cập nhật mốc ngày hoạt động
    localStorage.setItem('medward_last_active_date', todayIso);
    this.currentDate = todayDMY;

    // Cập nhật DOM
    const repDateInput = document.getElementById('reportDate');
    if (repDateInput) repDateInput.value = todayDMY;
    const nativeDate = document.getElementById('nativeDatePicker');
    if (nativeDate) nativeDate.value = todayIso;
    const mobSummaryDate = document.getElementById('mobileSummaryDate');
    if (mobSummaryDate) mobSummaryDate.innerText = todayDMY;

    this.render();
    this.updateDoctorFilterDropdown();
    this.updateStorageHudUI();

    const noticeTitle = manualTrigger ? '⏭️ CHUYỂN NGÀY THÀNH CÔNG' : '🌅 CẬP NHẬT NGÀY MỚI';
    const msg = `Hôm nay: ${todayDMY}\n• Đã cập nhật danh sách ${activePatients.length} người bệnh sang ngày mới`;

    if (window.showToast) {
      window.showToast({
        title: noticeTitle,
        message: msg,
        type: 'success',
        duration: 5000
      });
    } else if (window.updateSaveStatus) {
      window.updateSaveStatus(`✓ ${noticeTitle}: Cập nhật ${activePatients.length} người bệnh`);
    }
  }

  // 6. KIỂM TRA CHUYỂN ĐỔI KHI KHỞI ĐỘNG (NẾU MỞ APP VÀO NGÀY MỚI)
  async checkAndExecuteAutoRollover() {
    const todayIso = this.getTodayIso();
    const lastActive = localStorage.getItem('medward_last_active_date');
    if (!lastActive) {
      localStorage.setItem('medward_last_active_date', todayIso);
      return;
    }

    if (lastActive !== todayIso) {
      console.log(`🌅 [Auto Rollover] Phát hiện ngày mới: ${lastActive} ➔ ${todayIso}. Đang chuyển đổi thông minh...`);
      const d1 = new Date(lastActive);
      const d2 = new Date(todayIso);
      let diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (isNaN(diffDays) || diffDays < 1) diffDays = 1;
      await this.performSmartDailyRollover(diffDays, lastActive, todayIso, false);
    }
  }

  // 7. THEO DÕI 0H REALTIME (KHI BÁC SĨ MỞ MÁY QUA ĐÊM)
  checkMidnightRollover() {
    const todayIso = this.getTodayIso();
    const lastActive = localStorage.getItem('medward_last_active_date');
    if (lastActive && lastActive !== todayIso) {
      console.log(`⏰ [Midnight Watcher] Vừa qua 0h sang ngày mới: ${lastActive} ➔ ${todayIso}`);
      const d1 = new Date(lastActive);
      const d2 = new Date(todayIso);
      let diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (isNaN(diffDays) || diffDays < 1) diffDays = 1;
      this.performSmartDailyRollover(diffDays, lastActive, todayIso, false);
    }
  }

  openNextDayModal() {
    const modal = document.getElementById('nextDayModal');
    if (!modal) return;

    const currDateStr = this.getTodayDMY();
    const currDateSpan = document.getElementById('nextDayCurrentDate');
    if (currDateSpan) currDateSpan.innerText = currDateStr;

    const targetInput = document.getElementById('nextDayTargetDate');
    if (targetInput) targetInput.value = currDateStr;

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

    let selectedCount = 0;

    this.patientList.forEach((p) => {
      selectedCount++;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="chk-next-day-patient" data-id="${p.id}" checked onchange="window.patientController.updateNextDaySelectedCount()">
        </td>
        <td><strong>${this.escape(p.phong_giuong || '—')}</strong></td>
        <td><strong>${this.escape(p.ten || '—')}</strong></td>
        <td><small>🩺 ${this.escape(p.doctor_name || p.handover_by || 'Chưa phân')}</small></td>
        <td>
          <div class="diag-preview-old">${this.escape(p.chan_doan || '—')}</div>
          ${p.y_lenh ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">💊 Y lệnh: ${this.escape(p.y_lenh)}</div>` : ''}
        </td>
        <td style="text-align: center;">
          <span class="badge-inpatient">Nội trú</span>
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
    // Chuyển đổi thông minh ngay lập tức
    await this.performSmartDailyRollover(1, this.currentDate, this.getTodayIso(), true);
    this.closeNextDayModal();
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

  openAddPatientModal() {
    this.flushActiveInput();
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }
    const modal = document.getElementById('patientDetailModal');
    if (!modal) return;

    this.currentEditingPatientId = null;
    const { doctor } = this.getEffectiveDoctor();
    const myDocName = doctor.full_name || 'BS. Nguyễn Hữu Đông';

    const titleEl = modal.querySelector('.modal-title');
    if (titleEl) titleEl.innerText = '➕ Tiếp Nhận Người Bệnh Mới';

    document.getElementById('editPatientId').value = '';
    document.getElementById('editRoomBed').value = '';
    document.getElementById('editFullName').value = '';
    const ageInput = document.getElementById('editAgeYear');
    if (ageInput) {
      ageInput.value = '';
      const badge = document.getElementById('calcAgeBadge');
      if (badge) badge.innerText = '';
    }
    const docInput = document.getElementById('editDoctorName');
    if (docInput) docInput.value = myDocName;
    document.getElementById('editDiagnosis').value = '';
    if (document.getElementById('editClsHienCo')) document.getElementById('editClsHienCo').value = '';
    if (document.getElementById('editClsCanLam')) document.getElementById('editClsCanLam').value = '';
    document.getElementById('editOrders').value = '';
    if (document.getElementById('editThemThuoc')) document.getElementById('editThemThuoc').value = '';
    document.getElementById('editHandoverStatus').value = CONFIG.HANDOVER_STATUS.NONE;
    document.getElementById('editHandoverIssues').value = '';
    document.getElementById('editHandoverActions').value = '';

    modal.classList.add('active');
    setTimeout(() => {
      const roomInput = document.getElementById('editRoomBed');
      if (roomInput) roomInput.focus();
    }, 120);
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
      this.patientList = [];
      this.saveLocalCache();
      this.updateDoctorFilterDropdown();
      this.render();

      if (window.supabaseService) {
        await window.supabaseService.clearAllPatients(this.getCurrentDateString()).catch(() => {});
        if (typeof window.supabaseService.setWorkDayStatus === 'function') {
          window.supabaseService.setWorkDayStatus(this.getTodayIso(), 'active', 0).catch(() => {});
        }
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
      chan_doan: (() => {
        let idx = headerRow.findIndex(c =>
          c === 'chẩn đoán' || c === 'chan doan' || c === 'chẩn đoán xác định' || c === 'chẩn đoán hiện tại' ||
          c === 'chẩn đoán vào viện' || c === 'chẩn đoán ra viện' || c === 'chẩn đoán sơ bộ' || c === 'chẩn đoán khoa' ||
          c === 'cđ' || c === 'cd' || c === 'dx' || c.includes('chẩn đoán') || c.includes('chan doan')
        );
        if (idx === -1) idx = headerRow.findIndex(c => c.includes('bệnh chính') || c.includes('tên bệnh') || c.includes('bệnh kèm') || c.includes('lý do vào viện'));
        if (idx === -1) idx = headerRow.findIndex(c => c === 'icd' || c.includes('mã bệnh') || c.includes('mã icd') || c.includes('icd10') || c.includes('icd-10'));
        if (idx === -1) idx = headerRow.findIndex(c => c === 'a' || c === 'diagnosis');
        return idx;
      })(),
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

      // 4. Chẩn đoán (không lấy cột Mã NB làm chẩn đoán)
      let cdVal = mapping.chan_doan !== -1 ? String(row[mapping.chan_doan] || '').trim() : '';
      if (!cdVal && mapping.huong_dieu_tri !== -1 && row[mapping.huong_dieu_tri]) {
        cdVal = String(row[mapping.huong_dieu_tri]).trim();
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
      } else if (this.activeMobileFilter === 'duplicate') {
        const dupIds = this.getDuplicatePatientIds();
        list = list.filter(p => dupIds.has(p.id));
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

    // Cập nhật badge lọc trùng trên thanh công cụ
    this.updateDuplicateBadge();

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
        const theme = this.getRoomTheme(room);
        const isActive = this.activeMobileFilter === chipKey;
        const roomPatients = this.patientList.filter(p => this.extractRoomCode(p.phong_giuong) === room);
        const hasCrit = roomPatients.some(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
        const hasPend = roomPatients.some(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING);

        let alertBadge = '';
        if (hasCrit) {
          alertBadge = `<span class="room-ruler-alert" title="Buồng có ca Báo động đỏ">🚨</span>`;
        } else if (hasPend) {
          alertBadge = `<span class="room-ruler-alert" title="Buồng có ca Cần bàn giao">⏳</span>`;
        }

        const activeStyle = isActive 
          ? `background: ${theme.accent}; color: #ffffff; border-color: ${theme.accent}; box-shadow: 0 2px 6px ${theme.accent}66; font-weight: 700;`
          : `border-left: 3.5px solid ${theme.accent};`;

        html += `
          <button class="${btnClass} ${isActive ? 'active' : ''}" style="${activeStyle}" onclick="window.patientController.setMobileFilter('${chipKey}')">
            <span class="room-ruler-dot" style="background-color: ${isActive ? '#ffffff' : theme.accent};"></span>
            <span>${this.escape(room)}</span>
            <span class="room-ruler-count">${rooms[room]}</span>
            ${alertBadge}
          </button>
        `;
      });

      // Chip lọc người bệnh trùng lặp (nếu có ca trùng)
      const dupCount = this.getDuplicatePatientIds().size;
      if (dupCount > 0) {
        html += `
          <button class="${btnClass} chip-duplicate ${this.activeMobileFilter === 'duplicate' ? 'active' : ''}" onclick="window.patientController.setMobileFilter('duplicate')" title="Lọc xem các người bệnh trùng Họ tên & Năm sinh">
            👥 Trùng lặp (${dupCount})
          </button>
        `;
      }
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
      const roomTheme = this.getRoomTheme(roomCode);
      const isDengue = this.isDenguePatient(p);
      const delta = isDengue ? this.calculateDengueDelta(this.getPatientDengueTrends(p)) : null;

      // Nhóm buồng
      if (this.isGroupedByRoom && (!this.currentFilterQuery || this.currentFilterQuery.length === 0)) {
        if (roomCode !== lastRoomCode) {
          lastRoomCode = roomCode;
          const groupTr = document.createElement('tr');
          groupTr.className = 'room-group-row';
          groupTr.style.borderLeft = `6px solid ${roomTheme.accent}`;
          groupTr.innerHTML = `
            <td colspan="9">
              <span class="room-group-color-pill" style="background: ${roomTheme.accent}; color: #ffffff;">🚪 BUỒNG: ${this.escape(roomCode)}</span>
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
            style="border-left: 3.5px solid ${roomTheme.accent};"
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
            data-placeholder="Chẩn đoán xác định / kèm theo..."
            oninput="window.patientController.handleCellInput('${p.id}', 'chan_doan', this.innerText, this)"
            onkeydown="if(event.key==='Escape'||(event.key==='Enter'&&event.ctrlKey)){event.preventDefault();this.blur();}"
            onblur="window.patientController.handleCellBlur('${p.id}', 'chan_doan', this.innerText, this)">${this.escape(p.chan_doan || '')}</td>
        <td class="col-cls col-cls-dual">
          <div class="med-dual-cell">
            <div class="med-tier tier-present" onclick="this.querySelector('.med-cell-editor')?.focus()">
              <div class="med-tier-header">
                <span class="med-micro-badge badge-present">✓ Hiện có</span>
                ${isDengue ? `
                  <div class="desktop-dengue-badge" onclick="event.stopPropagation(); window.patientController.openDengueTrendModal('${p.id}')" title="Nhấn để xem diễn tiến Hct & Tiểu cầu (SXH)">
                    <span>📈 Xu hướng Hct/TC:</span>
                    ${delta ? `<strong>${delta.latestHct}%/${delta.latestTc}k</strong>` : '<strong>+ Mở biểu đồ</strong>'}
                    ${delta && delta.isHemoconcentration ? '<span class="badge-warn">🚨 Cô đặc</span>' : ''}
                    ${delta && delta.isSevereThrombocytopenia ? '<span class="badge-warn-tc">⚠️ TC thấp</span>' : ''}
                  </div>
                ` : ''}
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
      const roomCode = this.extractRoomCode(p.phong_giuong);
      const roomTheme = this.getRoomTheme(roomCode);

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
      card.style.borderLeft = `4.5px solid ${roomTheme.accent}`;

      card.innerHTML = `
        <!-- HEADER THẺ: BUỒNG GIƯỜNG & TRẠNG THÁI -->
        <div class="card-header" onclick="window.patientController.openPatientDetailModal('${p.id}')">
          <div class="card-room-badge" style="background: ${roomTheme.bg}; color: ${roomTheme.text}; border-color: ${roomTheme.border};">
            <span class="card-room-dot" style="background: ${roomTheme.accent};"></span>
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

          <!-- DENGUE TRENDLINE STRIP (NẾU LÀ BỆNH NHÂN SXH HOẶC CÓ THEO DÕI HCT/TC) -->
          ${this.isDenguePatient(p) ? this.renderCardDengueTrendHtml(p) : ''}

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

    const titleEl = modal.querySelector('.modal-title');
    if (titleEl) titleEl.innerText = '🩺 Chi Tiết Người Bệnh';

    document.getElementById('editPatientId').value = p.id;
    document.getElementById('editRoomBed').value = p.phong_giuong || '';
    document.getElementById('editFullName').value = p.ten || '';
    const ageInput = document.getElementById('editAgeYear');
    if (ageInput) {
      ageInput.value = p.nam_sinh_tuoi || '';
      this.handleAgeYearInput(ageInput);
    }
    const docInput = document.getElementById('editDoctorName');
    if (docInput) docInput.value = p.doctor_name || p.handover_by || '';

    // Dọn sạch nếu Chẩn đoán bị dính Mã NB trước đây
    if (p.chan_doan && /^\[Mã\s*(?:NB|BN|BA|hồ\s*sơ):\s*[^\]]+\]$/i.test(p.chan_doan.trim())) {
      p.chan_doan = '';
    }
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

    // Cập nhật tóm tắt Xu hướng Dengue (Hct & TC)
    const triggerSub = document.getElementById('detailTrendSummaryText');
    if (triggerSub) {
      const trends = this.getPatientDengueTrends(p);
      const delta = this.calculateDengueDelta(trends);
      if (delta) {
        triggerSub.innerHTML = `Hct: <strong>${delta.latestHct}%</strong> ${delta.deltaHct !== null ? (delta.deltaHct > 0 ? '▲+' : '▼') + delta.deltaHct + '%' : ''} • TC: <strong>${delta.latestTc}k</strong> ${delta.deltaTc !== null ? (delta.deltaTc > 0 ? '▲+' : '▼') + delta.deltaTc + 'k' : ''} • Chạm để xem/nhập`;
      } else {
        triggerSub.textContent = 'Chưa có mốc theo dõi • Chạm để mở biểu đồ & nhập điểm';
      }
    }

    modal.classList.add('active');
  }

  closePatientDetailModal() {
    const modal = document.getElementById('patientDetailModal');
    if (modal) modal.classList.remove('active');
  }

  savePatientFromDetailModal() {
    const id = document.getElementById('editPatientId').value;

    let cdVal = document.getElementById('editDiagnosis').value.trim();
    let clsHcVal = document.getElementById('editClsHienCo') ? document.getElementById('editClsHienCo').value.trim() : '';
    let clsClVal = document.getElementById('editClsCanLam') ? document.getElementById('editClsCanLam').value.trim() : '';
    let ylVal = document.getElementById('editOrders').value.trim();
    let themThuocVal = document.getElementById('editThemThuoc') ? document.getElementById('editThemThuoc').value.trim() : '';

    if (CONFIG.expandMedicalText) {
      cdVal = CONFIG.expandMedicalText(cdVal);
    }

    let combinedCls = '';
    if (clsHcVal && clsClVal) {
      combinedCls = `[Hiện có]: ${clsHcVal}\n[Cần làm]: ${clsClVal}`;
    } else if (clsClVal) {
      combinedCls = `[Cần làm]: ${clsClVal}`;
    } else {
      combinedCls = clsHcVal;
    }

    const existingPatient = this.patientList.find(x => x.id === id);
    const docVal = document.getElementById('editDoctorName')?.value?.trim() || existingPatient?.doctor_name || this.getEffectiveDoctor()?.doctor?.full_name || '';
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

    if (!id) {
      if (!updateData.ten) updateData.ten = 'BỆNH NHÂN MỚI';

      // Kiểm tra trùng lặp: Họ tên & Năm sinh
      const existingDup = this.findFirstDuplicate(updateData.ten, updateData.nam_sinh_tuoi, null);
      if (existingDup) {
        this.showDuplicateConfirmModal(updateData, existingDup, () => {
          // Người dùng chọn vẫn tiếp tục thêm mới
          this.addPatient(updateData);
          this.closePatientDetailModal();
          if (window.showToast) {
            window.showToast(`✓ Đã tiếp nhận người bệnh "${updateData.ten}"!`);
          }
        }, () => {
          // Người dùng chọn mở ca đã có để cập nhật
          this.closePatientDetailModal();
          this.openPatientDetailModal(existingDup.id);
        });
        return;
      }

      this.addPatient(updateData);
      this.closePatientDetailModal();
      if (window.showToast) {
        window.showToast(`✓ Đã tiếp nhận người bệnh "${updateData.ten}"!`);
      }
      return;
    }

    // Trường hợp cập nhật bệnh nhân: kiểm tra xem có trùng với người bệnh KHÁC không
    const otherDup = this.findFirstDuplicate(updateData.ten, updateData.nam_sinh_tuoi, id);
    if (otherDup) {
      this.showDuplicateConfirmModal(updateData, otherDup, () => {
        // Vẫn tiếp tục lưu cập nhật
        this.updatePatient(id, updateData);
        this.updateDoctorFilterDropdown();
        this.closePatientDetailModal();
        if (window.updateSaveStatus) {
          window.updateSaveStatus('✓ Đã cập nhật thông tin người bệnh');
        }
      }, () => {
        // Mở ca trùng kia
        this.closePatientDetailModal();
        this.openPatientDetailModal(otherDup.id);
      });
      return;
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
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="nurse-sheet-content">
        <!-- Tiêu đề và ngày in phiếu điều dưỡng nhỏ gọn -->
        <div class="nurse-print-header">
          <span class="nurse-print-title">📋 PHIẾU Y LỆNH &amp; CHỈ ĐỊNH CLS CHO ĐIỀU DƯỠNG</span>
          <span class="nurse-print-date">Ngày: ${todayStr} • ${nowTimeStr}</span>
        </div>
        <table class="nurse-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">STT</th>
              <th style="width: 85px; text-align: center;">Phòng/Giường</th>
              <th style="width: 160px;">Họ và Tên NB</th>
              <th style="width: 80px; text-align: center;">Năm sinh (Tuổi)</th>
              <th style="width: 42%;">🔬 CLS CẦN LÀM (XN / CĐHA)</th>
              <th style="width: 42%;">💊 THÊM THUỐC / Y LỆNH MỚI</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  printPatientTable() {
    this.executePrint(() => {
      if (window.medWardApp?.updatePrintDateNote) {
        window.medWardApp.updatePrintDateNote();
      }
    });
  }

  printNurseWorklist() {
    this.renderNursePrintPreview();
    const modal = document.getElementById('nursePrintModal');
    if (modal && !modal.classList.contains('active')) {
      modal.classList.add('active');
    }
    this.executePrint(null, 'print-nurse-mode');
  }

  executePrint(beforePrintFn, modeClass = null) {
    const isDark = document.body.classList.contains('dark-theme') || document.documentElement.classList.contains('dark-theme');
    
    // 1. Tạm ẩn thông báo toast nếu đang hiển thị
    const toastContainer = document.getElementById('toastContainer');
    const prevToastDisplay = toastContainer ? toastContainer.style.display : '';
    if (toastContainer) toastContainer.style.display = 'none';

    // 2. Chuyển tạm thời khỏi giao diện đêm để không dính nền đen và chữ trắng
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark-theme');
    }

    // 3. Kích hoạt class chế độ in chuyên biệt
    if (modeClass) {
      document.body.classList.add(modeClass);
    }

    if (typeof beforePrintFn === 'function') {
      beforePrintFn();
    }

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      if (modeClass) document.body.classList.remove(modeClass);
      if (isDark) {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.add('dark-theme');
      }
      if (toastContainer) toastContainer.style.display = prevToastDisplay;
      window.removeEventListener('afterprint', restore);
    };

    window.addEventListener('afterprint', restore);

    setTimeout(() => {
      window.print();
    }, 120);

    setTimeout(restore, 3500);
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

  // ==============================================================================
  // TÍNH NĂNG LỌC TRÙNG BỆNH NHÂN DỰA VÀO: HỌ & TÊN + NĂM SINH
  // ==============================================================================

  // 1. Chuẩn hóa họ tên người bệnh (chữ thường, bỏ dấu cách thừa)
  normalizePatientName(name) {
    if (!name) return '';
    return String(name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // 2. Trích xuất năm sinh 4 chữ số từ chuỗi nam_sinh_tuoi
  extractBirthYear(str) {
    if (!str) return null;
    const s = String(str).trim();
    if (!s) return null;

    const curYear = new Date().getFullYear();

    // Dạng 1: Tìm chuỗi 4 chữ số năm sinh 19xx hoặc 20xx
    const m = s.match(/\b(19\d{2}|20\d{2})\b/);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y >= 1900 && y <= curYear + 1) return y;
    }

    // Dạng 2: Ngày tháng năm sinh dạng dd/mm/yyyy hoặc yyyy-mm-dd
    const dateMatch = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dateMatch) {
      const y = parseInt(dateMatch[1] || dateMatch[6], 10);
      if (y >= 1900 && y <= curYear + 1) return y;
    }

    // Dạng 3: Người dùng chỉ ghi số tuổi (VD: "41 tuổi", "41t", "(41)") -> ước tính năm sinh
    const ageMatch = s.match(/^\(?\s*(\d{1,3})\s*(?:tuổi|t)?\s*\)?$/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1], 10);
      if (age >= 0 && age <= 125) {
        return curYear - age;
      }
    }

    return null;
  }

  // 3. Kiểm tra 2 người bệnh có trùng 02 yếu tố: Họ & Tên VÀ Năm Sinh
  isDuplicatePatient(p1, p2) {
    if (!p1 || !p2) return false;
    const n1 = this.normalizePatientName(p1.ten);
    const n2 = this.normalizePatientName(p2.ten);
    if (!n1 || !n2 || n1 === 'bệnh nhân mới' || n2 === 'bệnh nhân mới') return false;
    if (n1 !== n2) return false;

    // Yếu tố 2: Năm sinh
    const y1 = this.extractBirthYear(p1.nam_sinh_tuoi);
    const y2 = this.extractBirthYear(p2.nam_sinh_tuoi);

    if (y1 && y2) {
      return y1 === y2;
    }

    // Nếu không trích được 4 số nhưng chuỗi nam_sinh_tuoi giống nhau và không rỗng
    const raw1 = String(p1.nam_sinh_tuoi || '').trim().toLowerCase();
    const raw2 = String(p2.nam_sinh_tuoi || '').trim().toLowerCase();
    if (raw1 && raw2 && raw1 === raw2) {
      return true;
    }

    return false;
  }

  // 4. Tìm các nhóm người bệnh trùng lặp trong danh sách
  findDuplicatePatientGroups(list = this.patientList) {
    const map = new Map();
    for (const p of list) {
      if (p.is_deleted) continue;
      const normName = this.normalizePatientName(p.ten);
      if (!normName || normName === 'bệnh nhân mới') continue;

      const bYear = this.extractBirthYear(p.nam_sinh_tuoi);
      const rawYear = String(p.nam_sinh_tuoi || '').trim().toLowerCase();
      const yearKey = bYear ? String(bYear) : (rawYear || null);

      // Phải có cả 2 yếu tố: Họ tên VÀ Năm sinh thì mới xác định trùng
      if (!yearKey) continue;

      const groupKey = `${normName}:::${yearKey}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          name: (p.ten || '').trim().toUpperCase(),
          normName: normName,
          birthYear: bYear || p.nam_sinh_tuoi || 'Chưa rõ',
          patients: []
        });
      }
      map.get(groupKey).patients.push(p);
    }

    const dupGroups = [];
    for (const group of map.values()) {
      if (group.patients.length >= 2) {
        dupGroups.push(group);
      }
    }
    return dupGroups;
  }

  // 5. Lấy tập hợp ID của các người bệnh trùng lặp
  getDuplicatePatientIds(list = this.patientList) {
    const groups = this.findDuplicatePatientGroups(list);
    const idSet = new Set();
    groups.forEach(g => g.patients.forEach(p => idSet.add(p.id)));
    return idSet;
  }

  // 6. Tìm bệnh nhân đầu tiên trùng Họ tên & Năm sinh (dùng khi thêm/sửa)
  findFirstDuplicate(name, birthYearAge, excludeId = null) {
    if (!name) return null;
    const normName = this.normalizePatientName(name);
    if (!normName || normName === 'bệnh nhân mới') return null;

    const targetYear = this.extractBirthYear(birthYearAge);
    const targetRaw = String(birthYearAge || '').trim().toLowerCase();
    if (!targetYear && !targetRaw) return null; // Cần có năm sinh để so khớp 02 yếu tố

    for (const p of this.patientList) {
      if (p.is_deleted) continue;
      if (excludeId && p.id === excludeId) continue;

      const pNormName = this.normalizePatientName(p.ten);
      if (pNormName !== normName) continue;

      const pYear = this.extractBirthYear(p.nam_sinh_tuoi);
      const pRaw = String(p.nam_sinh_tuoi || '').trim().toLowerCase();

      if (targetYear && pYear && targetYear === pYear) {
        return p;
      }
      if (targetRaw && pRaw && targetRaw === pRaw) {
        return p;
      }
    }
    return null;
  }

  // 7. Cập nhật Badge báo trùng trên thanh công cụ
  updateDuplicateBadge() {
    const badgeEl = document.getElementById('duplicateBadgeCount');
    if (!badgeEl) return;

    const dupCount = this.getDuplicatePatientIds().size;
    if (dupCount > 0) {
      badgeEl.innerText = dupCount;
      badgeEl.style.display = 'block';
      badgeEl.title = `Có ${dupCount} người bệnh trùng Họ tên & Năm sinh`;
    } else {
      badgeEl.innerText = '0';
      badgeEl.style.display = 'none';
    }
  }

  // 8. Đánh giá độ đầy đủ thông tin của hồ sơ để ưu tiên giữ lại ca tốt nhất
  calculatePatientScore(p) {
    if (!p) return 0;
    let score = 0;
    if (p.ten && p.ten !== 'BỆNH NHÂN MỚI') score += 10;
    if (p.phong_giuong && p.phong_giuong !== 'D1.01-1') score += 15;
    if (p.doctor_name && !p.doctor_name.includes('Chưa')) score += 10;
    if (p.chan_doan) score += p.chan_doan.length * 2;
    if (p.cls) score += p.cls.length * 2;
    if (p.cls_hien_co) score += p.cls_hien_co.length * 2;
    if (p.cls_can_lam) score += p.cls_can_lam.length * 2;
    if (p.y_lenh) score += p.y_lenh.length * 2;
    if (p.them_thuoc) score += p.them_thuoc.length;
    if (p.handover_status && p.handover_status !== CONFIG.HANDOVER_STATUS.NONE) score += 20;
    if (p.handover_issues) score += p.handover_issues.length;
    if (p.handover_actions) score += p.handover_actions.length;
    return score;
  }

  // 9. Mở Modal Lọc Trùng Bệnh Nhân
  openDuplicateModal() {
    const modal = document.getElementById('duplicatePatientModal');
    if (!modal) return;

    this.renderDuplicateModalContent();
    modal.classList.add('active');
  }

  // 10. Đóng Modal Lọc Trùng Bệnh Nhân
  closeDuplicateModal() {
    const modal = document.getElementById('duplicatePatientModal');
    if (modal) modal.classList.remove('active');
  }

  // 11. Render nội dung Modal Lọc Trùng Bệnh Nhân
  renderDuplicateModalContent() {
    const bodyEl = document.getElementById('duplicateModalBody');
    const footerEl = document.getElementById('duplicateModalFooter');
    if (!bodyEl) return;

    const dupGroups = this.findDuplicatePatientGroups();
    const totalDupPatients = dupGroups.reduce((acc, g) => acc + g.patients.length, 0);

    // TRƯỜNG HỢP: KHÔNG CÓ BỆNH NHÂN NÀO BỊ TRÙNG
    if (dupGroups.length === 0) {
      bodyEl.innerHTML = `
        <div class="dup-banner-alert success">
          <div class="dup-banner-icon">✅</div>
          <div>
            <div class="dup-banner-title">Danh sách sạch sẽ - Không phát hiện trùng lặp!</div>
            <div>Tất cả người bệnh trong ngày <strong>${this.escape(this.currentDate)}</strong> đều có thông tin Họ &amp; tên và Năm sinh phân biệt rõ ràng.</div>
          </div>
        </div>
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; color: #10b981;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">Hệ thống đã rà soát toàn bộ ${this.patientList.length} người bệnh</div>
          <div style="font-size: 13px; margin-top: 4px;">Tính năng lọc trùng tự động giúp bạn an tâm không bị trùng lặp hồ sơ và y lệnh.</div>
        </div>
      `;

      if (footerEl) {
        footerEl.innerHTML = `
          <button type="button" class="btn btn-secondary" onclick="window.patientController.closeDuplicateModal()">Đóng</button>
        `;
      }
      return;
    }

    // TRƯỜNG HỢP: PHÁT HIỆN CÓ CÁC NHÓM TRÙNG LẶP
    let bodyHtml = `
      <div class="dup-banner-alert warning">
        <div class="dup-banner-icon">⚠️</div>
        <div>
          <div class="dup-banner-title">Phát hiện ${dupGroups.length} nhóm người bệnh (${totalDupPatients} ca) trùng Họ tên &amp; Năm sinh!</div>
          <div>Hệ thống đã nhận diện các hồ sơ có cùng <strong>Họ &amp; Tên</strong> và <strong>Năm sinh</strong>. Vui lòng kiểm tra và lựa chọn bản ghi bạn muốn <strong>GIỮ LẠI</strong> cho mỗi nhóm:</div>
        </div>
      </div>

      <div class="dup-options-bar">
        <label>
          <input type="checkbox" id="chkAutoMergeNotes" checked>
          <span>Tự động gộp Chẩn đoán, CLS &amp; Y lệnh từ ca bị xóa sang ca được giữ lại (bảo toàn dữ liệu)</span>
        </label>
        <span style="color: var(--text-muted); font-size: 12px;">Đã tự động chọn ca đầy đủ nhất ⚡</span>
      </div>

      <div class="dup-group-container">
    `;

    dupGroups.forEach((group, gIdx) => {
      // Tìm ca có điểm cao nhất để mặc định chọn giữ lại
      let bestPatient = group.patients[0];
      let maxScore = -1;
      group.patients.forEach(p => {
        const sc = this.calculatePatientScore(p);
        if (sc > maxScore) {
          maxScore = sc;
          bestPatient = p;
        }
      });

      bodyHtml += `
        <div class="dup-group-box" data-group-index="${gIdx}">
          <div class="dup-group-head">
            <div class="dup-group-title">
              <span>👤</span>
              <span class="dup-name-badge">${this.escape(group.name)}</span>
              <span class="dup-year-badge">🎂 Năm sinh: ${this.escape(String(group.birthYear))}</span>
            </div>
            <span class="dup-count-tag">${group.patients.length} bản ghi trùng</span>
          </div>

          <div class="dup-items-list">
      `;

      group.patients.forEach(p => {
        const isBest = (p.id === bestPatient.id);
        const radioName = `dup_group_keep_${gIdx}`;
        const cdShort = p.chan_doan || 'Chưa ghi chẩn đoán';
        const clsShort = p.cls || (p.cls_hien_co ? `[Hiện có]: ${p.cls_hien_co}` : '') || '';
        const ylShort = p.y_lenh || '';

        bodyHtml += `
          <div class="dup-item-card ${isBest ? 'is-selected' : ''}" id="dup_card_${p.id}" onclick="window.patientController.selectDuplicateItemRadio('${radioName}', '${p.id}')">
            <div class="dup-item-radio">
              <input type="radio" name="${radioName}" value="${p.id}" ${isBest ? 'checked' : ''} onchange="window.patientController.handleDuplicateRadioChange('${radioName}', '${p.id}')" onclick="event.stopPropagation()">
            </div>
            <div class="dup-item-content">
              <div class="dup-item-header">
                <div class="dup-item-badges">
                  <span class="dup-badge-room">🚪 ${this.escape(p.phong_giuong || 'Chưa xếp phòng')}</span>
                  <span class="dup-badge-doc">👨‍⚕️ ${this.escape(p.doctor_name || 'Chưa phân công')}</span>
                  ${p.handover_status && p.handover_status !== CONFIG.HANDOVER_STATUS.NONE ? `<span class="ho-status-badge ${p.handover_status}">🚨 Bàn giao: ${this.escape(p.handover_status)}</span>` : ''}
                </div>
                <span class="dup-action-badge ${isBest ? 'keep' : 'remove'}" id="dup_status_badge_${p.id}">
                  ${isBest ? '✓ Giữ lại' : '✕ Sẽ xóa'}
                </span>
              </div>

              <div class="dup-item-detail">
                <strong>Chẩn đoán:</strong> ${this.escape(cdShort)}
              </div>

              ${clsShort ? `<div class="dup-item-detail"><strong>CLS:</strong> ${this.escape(clsShort.length > 120 ? clsShort.substring(0, 120) + '...' : clsShort)}</div>` : ''}
              ${ylShort ? `<div class="dup-item-detail"><strong>Y lệnh:</strong> ${this.escape(ylShort.length > 120 ? ylShort.substring(0, 120) + '...' : ylShort)}</div>` : ''}

              <div class="dup-item-actions" onclick="event.stopPropagation()">
                <button type="button" class="btn-dup-action" onclick="window.patientController.openPatientDetailModal('${p.id}')" title="Xem &amp; sửa hồ sơ này">
                  👁️ Xem chi tiết
                </button>
                <button type="button" class="btn-dup-action danger" onclick="window.patientController.deleteSingleDuplicatePatient('${p.id}')" title="Xóa ngay bản ghi này">
                  🗑️ Xóa bản ghi này
                </button>
              </div>
            </div>
          </div>
        `;
      });

      bodyHtml += `
          </div>
        </div>
      `;
    });

    bodyHtml += `</div>`;
    bodyEl.innerHTML = bodyHtml;

    if (footerEl) {
      footerEl.innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="window.patientController.filterDuplicatesOnMainTable()" title="Lọc hiển thị danh sách các ca trùng trên bảng chính">
          🔍 Xem Trên Bảng Chính
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.patientController.closeDuplicateModal()">Đóng</button>
          <button type="button" class="btn btn-primary" onclick="window.patientController.executeSelectedDeduplicate()" style="font-weight: 700;">
            ✓ Lọc Theo Lựa Chọn Đã Tích
          </button>
          <button type="button" class="btn btn-success" onclick="window.patientController.executeAutoDeduplicate()" style="font-weight: 700;" title="Tự động giữ ca đầy đủ nhất của mỗi nhóm và xóa các ca thừa">
            ⚡ Tự Động Lọc Nhanh
          </button>
        </div>
      `;
    }
  }

  // 12. Xử lý khi click vào radio chọn ca giữ lại trong nhóm
  selectDuplicateItemRadio(radioName, patientId) {
    const radio = document.querySelector(`input[name="${radioName}"][value="${patientId}"]`);
    if (radio) {
      radio.checked = true;
      this.handleDuplicateRadioChange(radioName, patientId);
    }
  }

  handleDuplicateRadioChange(radioName, selectedId) {
    const radios = document.querySelectorAll(`input[name="${radioName}"]`);
    radios.forEach(r => {
      const card = document.getElementById(`dup_card_${r.value}`);
      const badge = document.getElementById(`dup_status_badge_${r.value}`);
      if (r.value === selectedId) {
        if (card) card.classList.add('is-selected');
        if (badge) {
          badge.className = 'dup-action-badge keep';
          badge.innerText = '✓ Giữ lại';
        }
      } else {
        if (card) card.classList.remove('is-selected');
        if (badge) {
          badge.className = 'dup-action-badge remove';
          badge.innerText = '✕ Sẽ xóa';
        }
      }
    });
  }

  // 13. Xóa một bệnh nhân trùng trực tiếp trong modal
  async deleteSingleDuplicatePatient(patientId) {
    const p = this.patientList.find(x => x.id === patientId);
    const pName = p ? p.ten : 'người bệnh này';
    const pRoom = p ? p.phong_giuong : '';

    if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi của "${pName}" (${pRoom}) không?`)) {
      return;
    }

    this.patientList = this.patientList.filter(x => x.id !== patientId);
    this.saveLocalCache();
    this.updateDoctorFilterDropdown();
    this.render();

    await window.supabaseService.deletePatient(patientId).catch(() => {});

    if (window.showToast) {
      window.showToast(`✓ Đã xóa bản ghi trùng lặp "${pName}" (${pRoom})`);
    }

    // Render lại modal lọc trùng
    this.renderDuplicateModalContent();
  }

  // 14. Gộp thông tin từ bệnh nhân bị xóa sang bệnh nhân được giữ lại
  mergeDuplicatePatientData(keepPatient, removePatient) {
    if (!keepPatient || !removePatient) return;

    // Gộp chẩn đoán nếu ca bị xóa có chẩn đoán bổ sung
    const cdOld = (removePatient.chan_doan || '').trim();
    const cdKeep = (keepPatient.chan_doan || '').trim();
    if (cdOld && !cdKeep.includes(cdOld)) {
      keepPatient.chan_doan = cdKeep ? `${cdKeep} / [Từ ca trùng]: ${cdOld}` : cdOld;
    }

    // Gộp Cận lâm sàng
    const clsOld = (removePatient.cls || '').trim();
    const clsKeep = (keepPatient.cls || '').trim();
    if (clsOld && !clsKeep.includes(clsOld)) {
      keepPatient.cls = clsKeep ? `${clsKeep}\n[CLS ca trùng]: ${clsOld}` : clsOld;
    }

    // Gộp Y lệnh
    const ylOld = (removePatient.y_lenh || '').trim();
    const ylKeep = (keepPatient.y_lenh || '').trim();
    if (ylOld && !ylKeep.includes(ylOld)) {
      keepPatient.y_lenh = ylKeep ? `${ylKeep}\n[Y lệnh ca trùng]: ${ylOld}` : ylOld;
    }

    // Kế thừa báo động đỏ nếu ca bị xóa có báo động đỏ mà ca giữ lại chưa có
    if (removePatient.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL && keepPatient.handover_status !== CONFIG.HANDOVER_STATUS.CRITICAL) {
      keepPatient.handover_status = CONFIG.HANDOVER_STATUS.CRITICAL;
      keepPatient.handover_issues = [keepPatient.handover_issues, removePatient.handover_issues].filter(Boolean).join('\n');
      keepPatient.handover_actions = [keepPatient.handover_actions, removePatient.handover_actions].filter(Boolean).join('\n');
    }
  }

  // 15. Thực hiện Lọc Trùng Tự Động: Giữ ca đầy đủ nhất của mỗi nhóm, xóa các ca thừa
  async executeAutoDeduplicate() {
    const dupGroups = this.findDuplicatePatientGroups();
    if (dupGroups.length === 0) {
      if (window.showToast) window.showToast('Không có người bệnh nào bị trùng lặp!');
      return;
    }

    const shouldMerge = document.getElementById('chkAutoMergeNotes') ? document.getElementById('chkAutoMergeNotes').checked : true;
    const idsToRemove = [];
    let keptCount = 0;

    dupGroups.forEach(group => {
      // Tìm ca có điểm cao nhất
      let bestPatient = group.patients[0];
      let maxScore = -1;
      group.patients.forEach(p => {
        const sc = this.calculatePatientScore(p);
        if (sc > maxScore) {
          maxScore = sc;
          bestPatient = p;
        }
      });

      // Các ca còn lại sẽ bị xóa
      group.patients.forEach(p => {
        if (p.id !== bestPatient.id) {
          if (shouldMerge) {
            this.mergeDuplicatePatientData(bestPatient, p);
          }
          idsToRemove.push(p.id);
        }
      });
      keptCount++;
    });

    if (idsToRemove.length === 0) return;

    if (!confirm(`Hệ thống sẽ giữ lại ${keptCount} ca bệnh đầy đủ nhất và XÓA ${idsToRemove.length} bản ghi trùng lặp thừa.\n\n${shouldMerge ? '✓ Dữ liệu CĐ, CLS và Y lệnh sẽ được tự động gộp an toàn.\n\n' : ''}Bạn có chắc chắn muốn thực hiện?`)) {
      return;
    }

    // Cập nhật danh sách cục bộ
    this.patientList = this.patientList.filter(p => !idsToRemove.includes(p.id));
    this.saveLocalCache();
    this.updateDoctorFilterDropdown();
    this.render();

    // Đồng bộ lên Supabase Cloud
    for (const pid of idsToRemove) {
      await window.supabaseService.deletePatient(pid).catch(() => {});
    }
    await window.supabaseService.syncBatchPatients(this.patientList, this.currentDate).catch(() => {});

    if (window.showToast) {
      window.showToast(`✓ Đã lọc trùng thành công! Đã xóa ${idsToRemove.length} bản ghi trùng thừa.`);
    }

    this.closeDuplicateModal();
  }

  // 16. Thực hiện Lọc Trùng Theo Lựa Chọn Đã Tích của Người Dùng
  async executeSelectedDeduplicate() {
    const dupGroups = this.findDuplicatePatientGroups();
    if (dupGroups.length === 0) {
      this.closeDuplicateModal();
      return;
    }

    const shouldMerge = document.getElementById('chkAutoMergeNotes') ? document.getElementById('chkAutoMergeNotes').checked : true;
    const idsToRemove = [];
    let keptCount = 0;

    dupGroups.forEach((group, gIdx) => {
      const radioName = `dup_group_keep_${gIdx}`;
      const selectedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
      const keepId = selectedRadio ? selectedRadio.value : group.patients[0].id;
      const keepPatient = group.patients.find(p => p.id === keepId) || group.patients[0];

      group.patients.forEach(p => {
        if (p.id !== keepPatient.id) {
          if (shouldMerge) {
            this.mergeDuplicatePatientData(keepPatient, p);
          }
          idsToRemove.push(p.id);
        }
      });
      keptCount++;
    });

    if (idsToRemove.length === 0) {
      this.closeDuplicateModal();
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn giữ lại ${keptCount} người bệnh đã chọn và xóa ${idsToRemove.length} bản ghi trùng thừa không?`)) {
      return;
    }

    this.patientList = this.patientList.filter(p => !idsToRemove.includes(p.id));
    this.saveLocalCache();
    this.updateDoctorFilterDropdown();
    this.render();

    for (const pid of idsToRemove) {
      await window.supabaseService.deletePatient(pid).catch(() => {});
    }
    await window.supabaseService.syncBatchPatients(this.patientList, this.currentDate).catch(() => {});

    if (window.showToast) {
      window.showToast(`✓ Đã hoàn tất lọc trùng theo lựa chọn (${idsToRemove.length} bản ghi thừa đã xóa).`);
    }

    this.closeDuplicateModal();
  }

  // 17. Lọc chỉ xem các ca trùng lặp ngay trên bảng chính
  filterDuplicatesOnMainTable() {
    this.closeDuplicateModal();
    this.setMobileFilter('duplicate');
    this.scrollToTop();
    if (window.showToast) {
      window.showToast('🔍 Đang lọc danh sách chỉ hiển thị các ca trùng Họ tên & Năm sinh');
    }
  }

  // 18. Hiển thị Modal Cảnh Báo Trùng Lặp Khi Tiếp Nhận / Sửa Người Bệnh
  showDuplicateConfirmModal(newData, existingDup, onProceedAdd, onOpenExisting) {
    const modal = document.getElementById('duplicateAlertModal');
    const bodyEl = document.getElementById('duplicateAlertBody');
    const btnProceed = document.getElementById('btnDupProceedAdd');
    const btnOpenExist = document.getElementById('btnDupOpenExisting');

    if (!modal || !bodyEl) {
      // Fallback nếu không tìm thấy modal DOM
      const ans = confirm(`⚠️ CẢNH BÁO TRÙNG BỆNH NHÂN:\nNgười bệnh "${newData.ten}" (Năm sinh: ${newData.nam_sinh_tuoi || 'chưa rõ'}) đã tồn tại trong danh sách:\n• Buồng/Giường: ${existingDup.phong_giuong}\n• Bác sĩ: ${existingDup.doctor_name}\n• CĐ: ${existingDup.chan_doan}\n\nBạn có muốn tiếp tục thêm người bệnh này không?`);
      if (ans && typeof onProceedAdd === 'function') onProceedAdd();
      return;
    }

    const bYear = this.extractBirthYear(newData.nam_sinh_tuoi) || newData.nam_sinh_tuoi || 'Chưa rõ';

    bodyEl.innerHTML = `
      <div style="font-size: 13.5px; line-height: 1.5; margin-bottom: 12px; color: var(--text-main);">
        Hệ thống phát hiện người bệnh <strong>${this.escape(newData.ten)}</strong> (Năm sinh: <strong>${this.escape(String(bYear))}</strong>) đã tồn tại trong danh sách điều trị hôm nay:
      </div>

      <div class="dup-alert-summary">
        <div style="font-weight: 800; font-size: 13.5px; color: #0284c7; margin-bottom: 8px;">
          📋 Hồ sơ người bệnh đã có trong danh sách:
        </div>
        <div class="row-info">
          <span class="row-label">Họ &amp; Tên:</span>
          <span class="row-val">${this.escape(existingDup.ten)}</span>
        </div>
        <div class="row-info">
          <span class="row-label">Năm sinh:</span>
          <span class="row-val">${this.escape(existingDup.nam_sinh_tuoi || '—')}</span>
        </div>
        <div class="row-info">
          <span class="row-label">Phòng/Giường:</span>
          <span class="row-val" style="color: #4338ca;">${this.escape(existingDup.phong_giuong || '—')}</span>
        </div>
        <div class="row-info">
          <span class="row-label">Bác sĩ:</span>
          <span class="row-val">${this.escape(existingDup.doctor_name || 'Chưa phân công')}</span>
        </div>
        <div class="row-info">
          <span class="row-label">Chẩn đoán:</span>
          <span class="row-val" style="font-size: 12.5px;">${this.escape(existingDup.chan_doan || 'Chưa ghi')}</span>
        </div>
      </div>

      <div style="font-size: 12.5px; color: var(--text-muted); background: #fef3c7; border: 1px solid #fde68a; padding: 8px 12px; border-radius: 6px;">
        💡 <strong>Gợi ý:</strong> Nếu đây là cùng một người bệnh, bạn nên chọn <strong>"Mở Ca Đã Có Để Cập Nhật"</strong> để tránh trùng lặp số liệu khoa.
      </div>
    `;

    // Gán sự kiện
    if (btnProceed) {
      btnProceed.onclick = () => {
        this.closeDuplicateAlertModal();
        if (typeof onProceedAdd === 'function') onProceedAdd();
      };
    }

    if (btnOpenExist) {
      btnOpenExist.onclick = () => {
        this.closeDuplicateAlertModal();
        if (typeof onOpenExisting === 'function') onOpenExisting();
      };
    }

    modal.classList.add('active');
  }

  // 19. Đóng Modal Cảnh Báo Trùng Lặp
  closeDuplicateAlertModal() {
    const modal = document.getElementById('duplicateAlertModal');
    if (modal) modal.classList.remove('active');
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
