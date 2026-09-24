// ==============================================================================
// CLINICAL SHIFT HANDOVER SERVICE & REPORT GENERATOR
// ==============================================================================

class HandoverController {
  constructor() {
    this.currentPatientId = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Quick Tag buttons trong modal bàn giao
    const issueTagsContainer = document.getElementById('handoverIssueQuickTags');
    if (issueTagsContainer) {
      issueTagsContainer.innerHTML = CONFIG.QUICK_TAGS.ISSUES.map(tag => 
        `<button type="button" class="quick-tag-btn" onclick="window.handoverController.insertTag('hoIssues', '${tag}')">+ ${tag}</button>`
      ).join('');
    }

    const actionTagsContainer = document.getElementById('handoverActionQuickTags');
    if (actionTagsContainer) {
      actionTagsContainer.innerHTML = CONFIG.QUICK_TAGS.ACTIONS.map(tag => 
        `<button type="button" class="quick-tag-btn" onclick="window.handoverController.insertTag('hoActions', '${tag}')">+ ${tag}</button>`
      ).join('');
    }

    // Nút copy Zalo/Viber
    const btnCopyZalo = document.getElementById('btnCopyHandoverZalo');
    if (btnCopyZalo) {
      btnCopyZalo.addEventListener('click', () => this.copyHandoverToClipboard());
    }

    // Nút in biên bản trực
    const btnPrintHandover = document.getElementById('btnPrintHandoverReport');
    if (btnPrintHandover) {
      btnPrintHandover.addEventListener('click', () => this.printHandoverReport());
    }
  }

  insertTag(textareaId, tagText) {
    const el = document.getElementById(textareaId);
    if (!el) return;
    if (el.value.trim().length > 0) {
      el.value = el.value.trim() + '; ' + tagText;
    } else {
      el.value = tagText;
    }
    el.focus();
  }

  openHandoverModal(patientId) {
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }
    this.currentPatientId = patientId;
    const p = window.patientController.patientList.find(item => item.id === patientId);
    if (!p) return;

    const modal = document.getElementById('handoverModal');
    if (!modal) return;

    // Hiển thị thông tin tóm tắt người bệnh
    document.getElementById('hoPatientHeader').innerHTML = `
      <div class="ho-badge-room">🛏️ ${this.escape(p.phong_giuong || 'Chưa xếp giường')}</div>
      <div class="ho-patient-info">
        <strong>${this.escape(p.ten)}</strong> • ${this.escape(p.nam_sinh_tuoi || '')}
        <div class="ho-diagnosis">${this.escape(p.chan_doan || 'Chưa ghi chẩn đoán')}</div>
      </div>
    `;

    // Radio status
    const status = p.handover_status || CONFIG.HANDOVER_STATUS.NONE;
    const radio = document.querySelector(`input[name="hoStatusRadio"][value="${status}"]`);
    if (radio) radio.checked = true;

    document.getElementById('hoIssues').value = p.handover_issues || '';
    document.getElementById('hoActions').value = p.handover_actions || '';

    const currentDoc = window.authController?.currentUser?.full_name || 'BS điều trị';
    document.getElementById('hoDoctorFrom').value = p.handover_by || currentDoc;

    modal.classList.add('active');
  }

  closeHandoverModal() {
    const modal = document.getElementById('handoverModal');
    if (modal) modal.classList.remove('active');
    this.currentPatientId = null;
  }

  async saveHandover() {
    if (!this.currentPatientId) return;

    const selectedRadio = document.querySelector('input[name="hoStatusRadio"]:checked');
    const status = selectedRadio ? selectedRadio.value : CONFIG.HANDOVER_STATUS.NONE;
    const issues = document.getElementById('hoIssues').value.trim();
    const actions = document.getElementById('hoActions').value.trim();
    const docFrom = document.getElementById('hoDoctorFrom').value.trim();

    const updateFields = {
      handover_status: status,
      handover_issues: issues,
      handover_actions: actions,
      handover_by: docFrom,
      handover_at: (status !== CONFIG.HANDOVER_STATUS.NONE && status !== CONFIG.HANDOVER_STATUS.RESOLVED) ? new Date().toISOString() : null
    };

    if (status === CONFIG.HANDOVER_STATUS.RESOLVED) {
      updateFields.handover_resolved_at = new Date().toISOString();
      updateFields.handover_resolved_by = window.authController?.currentUser?.full_name || 'Bác sĩ trực';
    }

    await window.patientController.updatePatient(this.currentPatientId, updateFields);
    this.closeHandoverModal();

    if (window.showToast) {
      window.showToast('✓ Đã cập nhật trạng thái bàn giao ca trực!');
    }
  }

  // BÁC SĨ TRỰC TIẾP NHẬN & ĐÁNH DẤU ĐÃ XỬ TRÍ NHANH
  async markAsResolved(patientId) {
    const p = window.patientController.patientList.find(item => item.id === patientId);
    if (!p) return;

    const currentDoc = window.authController?.currentUser?.full_name || 'Bác sĩ trực';
    if (confirm(`Xác nhận ca bệnh "${p.ten}" (${p.phong_giuong}) đã được giải quyết / xử trí xong trong tua trực?`)) {
      await window.patientController.updatePatient(patientId, {
        handover_status: CONFIG.HANDOVER_STATUS.RESOLVED,
        handover_resolved_at: new Date().toISOString(),
        handover_resolved_by: currentDoc
      });

      this.renderHandoverDashboard();
      if (window.showToast) {
        window.showToast(`✓ Đã đánh dấu xử trí xong cho bệnh nhân ${p.ten}`);
      }
    }
  }

  // MỞ DASHBOARD BÀN GIAO TOÀN DIỆN
  openHandoverDashboard() {
    if (!window.authController?.isLoggedIn) {
      window.authController?.showGateOverlay?.();
      return;
    }
    const modal = document.getElementById('handoverDashboardModal');
    if (!modal) return;

    this.renderHandoverDashboard();
    modal.classList.add('active');
  }

  closeHandoverDashboard() {
    const modal = document.getElementById('handoverDashboardModal');
    if (modal) modal.classList.remove('active');
  }

  renderHandoverDashboard() {
    const container = document.getElementById('handoverDashboardList');
    if (!container) return;

    const patients = window.patientController.patientList;
    const criticalList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
    const pendingList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING);
    const resolvedList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.RESOLVED);

    // Cập nhật thống kê
    document.getElementById('statCriticalCount').innerText = criticalList.length;
    document.getElementById('statPendingCount').innerText = pendingList.length;
    document.getElementById('statResolvedCount').innerText = resolvedList.length;

    const totalUnresolved = criticalList.length + pendingList.length;
    const emptyNotice = document.getElementById('handoverDashboardEmpty');

    if (totalUnresolved === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      container.innerHTML = '';
      return;
    } else {
      if (emptyNotice) emptyNotice.style.display = 'none';
    }

    const renderList = [...criticalList, ...pendingList];

    container.innerHTML = renderList.map(p => {
      const isCrit = p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL;
      return `
        <div class="ho-summary-card ${isCrit ? 'critical-border' : 'pending-border'}">
          <div class="ho-card-top">
            <div class="ho-card-left">
              <span class="badge-bed">🛏️ ${this.escape(p.phong_giuong || 'Chưa xếp giường')}</span>
              <strong class="ho-card-name">${this.escape(p.ten)}</strong>
              <span class="ho-card-age">${this.escape(p.nam_sinh_tuoi || '')}</span>
            </div>
            <span class="badge-status ${isCrit ? 'badge-critical' : 'badge-pending'}">
              ${isCrit ? '🚨 Báo động đỏ' : '⏳ Cần theo dõi'}
            </span>
          </div>

          <div class="ho-card-diag">
            <strong>Chẩn đoán:</strong> ${this.escape(p.chan_doan || '—')}
          </div>

          <div class="ho-card-issues-box">
            <div class="ho-issue-row">
              <span class="ho-label red">⚠️ Vấn đề tồn đọng:</span>
              <span class="ho-val">${this.escape(p.handover_issues || 'Chưa ghi chú')}</span>
            </div>
            <div class="ho-action-row">
              <span class="ho-label green">🎯 Y lệnh tua trực:</span>
              <span class="ho-val">${this.escape(p.handover_actions || 'Theo dõi sinh hiệu theo quy trình')}</span>
            </div>
          </div>

          <div class="ho-card-bottom">
            <span class="ho-doc-note">BS bàn giao: <strong>${this.escape(p.handover_by || 'BS điều trị')}</strong></span>
            <div class="ho-action-btns">
              <button class="btn-icon" data-tooltip="Copy qua Zalo ca này" onclick="window.handoverController.copySinglePatientZalo('${p.id}')">
                📋
              </button>
              <button class="btn-icon" data-tooltip="Xác nhận đã xử trí xong" onclick="window.handoverController.markAsResolved('${p.id}')">
                ✅
              </button>
              <button class="btn-icon" data-tooltip="Cập nhật bàn giao" onclick="window.handoverController.openHandoverModal('${p.id}')">
                ✏️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==============================================================================
  // ĐỊNH DẠNG TIN NHẮN TÓM TẮT NGẮN GỌN CHO ZALO
  // TIÊU ĐỀ NGẮN GỌN NHẤT CÓ THỂ, TÊN BN, NĂM SINH, PHÒNG, CHẨN ĐOÁN, VẤN ĐỀ
  // ==============================================================================
  extractPatientProblem(p) {
    if (!p) return 'Theo dõi thường quy';
    let issues = [];
    if (p.handover_issues && p.handover_issues.trim()) {
      issues.push(p.handover_issues.trim());
    }
    if (p.handover_actions && p.handover_actions.trim()) {
      issues.push('Xử trí: ' + p.handover_actions.trim());
    }
    if (issues.length === 0) {
      if (p.cls_can_lam && p.cls_can_lam.trim()) issues.push('CLS: ' + p.cls_can_lam.trim());
      if (p.them_thuoc && p.them_thuoc.trim()) issues.push('Thuốc thêm: ' + p.them_thuoc.trim());
      if (p.y_lenh && p.y_lenh.trim()) issues.push('Y lệnh: ' + p.y_lenh.trim());
    }
    let res = issues.length > 0 ? issues.join('; ') : 'Theo dõi thường quy';
    if (p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL) {
      if (!res.includes('Báo động đỏ') && !res.includes('NẶNG')) {
        res = `[🚨 NẶNG] ${res}`;
      }
    }
    return res;
  }

  formatPatientZaloText(p, isSingle = true) {
    if (!p) return '';
    const ten = (p.ten || 'BỆNH NHÂN').toUpperCase();
    const ns = p.nam_sinh_tuoi || '—';
    const phong = p.phong_giuong || 'Chưa xếp phòng';
    const cd = p.chan_doan || 'Chưa ghi';
    const vanDe = this.extractPatientProblem(p);

    if (isSingle) {
      return `📋 BÀN GIAO\n- BN: ${ten}\n- Năm sinh: ${ns}\n- Phòng: ${phong}\n- CĐ: ${cd}\n- Vấn đề: ${vanDe}`;
    } else {
      return `- BN: ${ten}\n- Năm sinh: ${ns}\n- Phòng: ${phong}\n- CĐ: ${cd}\n- Vấn đề: ${vanDe}`;
    }
  }

  // TẠO ĐỊNH DẠNG BÀN GIAO TỔNG HỢP GỬI ZALO (TIÊU ĐỀ SIÊU NGẮN GỌN)
  generateZaloSummaryText() {
    const patients = window.patientController.patientList;
    const criticalList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
    const pendingList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING);
    const allHandovers = [...criticalList, ...pendingList];

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

    if (allHandovers.length === 0) {
      return `📋 BÀN GIAO (${dateStr})\n- Không có ca bệnh tồn đọng hoặc nguy kịch.`;
    }

    let text = `📋 BÀN GIAO (${dateStr})\n\n`;

    allHandovers.forEach((p, idx) => {
      const patientBody = this.formatPatientZaloText(p, false);
      text += `${idx + 1}. ${patientBody}\n\n`;
    });

    return text.trim();
  }

  // HÀM SAO CHÉP CHUNG AN TOÀN CHO CẢ DESKTOP & MOBILE
  async copyText(text, successMsg = '📋 Đã sao chép nội dung qua Zalo!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (window.showToast) {
        window.showToast(successMsg);
      } else if (window.updateSaveStatus) {
        window.updateSaveStatus(successMsg, 'saved');
      } else {
        alert(successMsg);
      }
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (window.showToast) window.showToast(successMsg);
    }
  }

  async copyHandoverToClipboard() {
    const text = this.generateZaloSummaryText();
    await this.copyText(text, '📋 Đã sao chép biên bản bàn giao qua Zalo!');
  }

  async copySinglePatientZalo(patientId) {
    const p = window.patientController.patientList.find(item => item.id === patientId);
    if (!p) return;
    const text = this.formatPatientZaloText(p, true);
    await this.copyText(text, `📋 Đã sao chép người bệnh ${p.ten || ''} qua Zalo!`);
  }

  async copyCurrentPatientHandoverZalo() {
    if (!this.currentPatientId) return;
    const p = window.patientController.patientList.find(item => item.id === this.currentPatientId);
    if (!p) return;

    const issues = document.getElementById('hoIssues')?.value.trim();
    const actions = document.getElementById('hoActions')?.value.trim();
    const selectedRadio = document.querySelector('input[name="hoStatusRadio"]:checked');
    const status = selectedRadio ? selectedRadio.value : p.handover_status;

    const tempP = {
      ...p,
      handover_status: status,
      handover_issues: issues !== undefined ? issues : p.handover_issues,
      handover_actions: actions !== undefined ? actions : p.handover_actions
    };

    const text = this.formatPatientZaloText(tempP, true);
    await this.copyText(text, `📋 Đã sao chép bàn giao người bệnh ${p.ten || ''} qua Zalo!`);
  }

  printHandoverReport() {
    // Kích hoạt in chỉ danh sách bàn giao
    document.body.classList.add('printing-handover-only');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-handover-only');
    }, 1000);
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

window.handoverController = new HandoverController();
