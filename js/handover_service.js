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

  handleStatusRadioChange(status) {
    const helpEl = document.getElementById('hoStatusHelpNote');
    const issuesGroup = document.getElementById('hoIssuesGroup');
    const actionsGroup = document.getElementById('hoActionsGroup');

    if (helpEl) {
      const cfg = CONFIG.STATUS_CONFIG[status];
      helpEl.innerText = cfg?.desc ? `💡 ${cfg.desc}` : '';
    }

    if (status === 'can_ban_giao') {
      if (issuesGroup) issuesGroup.style.borderLeft = '3px solid #ef4444';
      if (actionsGroup) actionsGroup.style.borderLeft = '3px solid #0284c7';
      const issuesInput = document.getElementById('hoIssues');
      if (issuesInput && !issuesInput.value.trim()) {
        setTimeout(() => issuesInput.focus(), 100);
      }
    } else {
      if (issuesGroup) issuesGroup.style.borderLeft = 'none';
      if (actionsGroup) actionsGroup.style.borderLeft = 'none';
    }
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

    // Lấy trạng thái công việc hiện tại
    const currentStatus = window.patientController ? window.patientController.getPatientWorkStatus(p) : (p.handover_status || 'chua_lam');
    const radio = document.querySelector(`input[name="hoStatusRadio"][value="${currentStatus}"]`);
    if (radio) {
      radio.checked = true;
    } else {
      const defRadio = document.querySelector(`input[name="hoStatusRadio"][value="chua_lam"]`);
      if (defRadio) defRadio.checked = true;
    }

    this.handleStatusRadioChange(currentStatus);

    document.getElementById('hoIssues').value = p.handover_issues || '';
    document.getElementById('hoActions').value = p.handover_actions || '';

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
    const status = selectedRadio ? selectedRadio.value : 'chua_lam';
    const issues = document.getElementById('hoIssues') ? document.getElementById('hoIssues').value.trim() : '';
    const actions = document.getElementById('hoActions') ? document.getElementById('hoActions').value.trim() : '';

    const updateFields = {
      handover_status: status,
      work_status: status,
      handover_issues: issues,
      handover_actions: actions,
      updated_at: new Date().toISOString()
    };

    if (status === 'da_check') {
      updateFields.handover_resolved_at = new Date().toISOString();
      updateFields.handover_resolved_by = window.authController?.currentUser?.full_name || 'Bác sĩ điều trị';
    }

    await window.patientController.updatePatient(this.currentPatientId, updateFields);
    this.closeHandoverModal();

    if (window.showToast) {
      window.showToast('✓ Đã cập nhật trạng thái công việc & bàn giao!');
    }
  }

  // BÁC SĨ TRỰC TIẾP NHẬN & ĐÁNH DẤU ĐÃ XỬ TRÍ NHANH / ĐÃ CHECK
  async markAsResolved(patientId) {
    const p = window.patientController.patientList.find(item => item.id === patientId);
    if (!p) return;

    if (confirm(`Xác nhận ca bệnh "${p.ten}" (${p.phong_giuong}) đã được kiểm tra / xử trí hoàn thành?`)) {
      await window.patientController.updatePatient(patientId, {
        handover_status: 'da_check',
        work_status: 'da_check',
        handover_resolved_at: new Date().toISOString(),
        handover_resolved_by: window.authController?.currentUser?.full_name || 'Bác sĩ điều trị'
      });

      this.renderHandoverDashboard();
      if (window.showToast) {
        window.showToast(`✓ Đã xác nhận hoàn thành cho bệnh nhân ${p.ten}`);
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
    const handoverList = patients.filter(p => {
      const st = window.patientController ? window.patientController.getPatientWorkStatus(p) : p.handover_status;
      return st === 'can_ban_giao' || Boolean(p.handover_issues && p.handover_issues.trim()) || p.handover_status === 'pending' || p.handover_status === 'critical';
    });
    const pendingClsList = patients.filter(p => {
      const st = window.patientController ? window.patientController.getPatientWorkStatus(p) : p.handover_status;
      return st === 'don_cls_thuoc' || Boolean(p.cls_can_lam && p.cls_can_lam.trim()) || Boolean(p.them_thuoc && p.them_thuoc.trim());
    });
    const checkedList = patients.filter(p => {
      const st = window.patientController ? window.patientController.getPatientWorkStatus(p) : p.handover_status;
      return st === 'da_check';
    });

    // Cập nhật thống kê
    if (document.getElementById('statCriticalCount')) {
      document.getElementById('statCriticalCount').innerText = handoverList.length;
    }
    if (document.getElementById('statPendingCount')) {
      document.getElementById('statPendingCount').innerText = pendingClsList.length;
    }
    if (document.getElementById('statResolvedCount')) {
      document.getElementById('statResolvedCount').innerText = checkedList.length;
    }

    const emptyNotice = document.getElementById('handoverDashboardEmpty');

    if (handoverList.length === 0 && pendingClsList.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      container.innerHTML = '';
      return;
    } else {
      if (emptyNotice) emptyNotice.style.display = 'none';
    }

    const renderList = [...handoverList];
    pendingClsList.forEach(p => {
      if (!renderList.some(item => item.id === p.id)) {
        renderList.push(p);
      }
    });

    container.innerHTML = renderList.map(p => {
      const st = window.patientController ? window.patientController.getPatientWorkStatus(p) : p.handover_status;
      const isHo = st === 'can_ban_giao';
      return `
        <div class="ho-summary-card ${isHo ? 'critical-border' : 'pending-border'}">
          <div class="ho-card-top">
            <div class="ho-card-left">
              <span class="badge-bed">🛏️ ${this.escape(p.phong_giuong || 'Chưa xếp giường')}</span>
              <strong class="ho-card-name">${this.escape(p.ten)}</strong>
              <span class="ho-card-age">${this.escape(p.nam_sinh_tuoi || '')}</span>
            </div>
            <span class="badge-status ${isHo ? 'badge-critical' : 'badge-pending'}">
              ${isHo ? '⏳ Cần bàn giao' : '🟠 Đón CLS / Thuốc'}
            </span>
          </div>

          <div class="ho-card-diag">
            <strong>CĐ:</strong> ${this.escape(p.chan_doan || '—')}
          </div>

          <div class="ho-card-issues-box">
            <div class="ho-issue-row">
              <span class="ho-label red">⚠️ VĐ:</span>
              <span class="ho-val">${this.escape(p.handover_issues || (p.cls_can_lam ? 'Đón CLS: ' + p.cls_can_lam : 'Chưa ghi chú'))}</span>
            </div>
            <div class="ho-action-row">
              <span class="ho-label green">🎯 Nhờ trực:</span>
              <span class="ho-val">${this.escape(p.handover_actions || (p.them_thuoc ? 'Bổ sung thuốc: ' + p.them_thuoc : 'Theo dõi sinh hiệu theo quy trình'))}</span>
            </div>
          </div>

          <div class="ho-card-bottom">
            <div class="ho-action-btns" style="margin-left: auto;">
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
  // QUY CHUẨN RÚT GỌN:
  // - BN: <Họ tên> (<Năm sinh/Tuổi>)
  // - P-G: <Phòng/Giường>
  // - CĐ: <Chẩn đoán>
  // - VĐ: <Vấn đề tồn đọng & Nhờ BS trực>
  // - YL: <Y lệnh & Thêm thuốc>
  // ==============================================================================
  extractPatientProblem(p) {
    if (!p) return 'Theo dõi thường quy';
    let issues = [];
    if (p.handover_issues && p.handover_issues.trim()) {
      issues.push(p.handover_issues.trim());
    }
    if (p.handover_actions && p.handover_actions.trim()) {
      issues.push(`Nhờ trực: ${p.handover_actions.trim()}`);
    }
    if (issues.length === 0) {
      if (p.cls_can_lam && p.cls_can_lam.trim()) issues.push(`Đón CLS: ${p.cls_can_lam.trim()}`);
      if (p.them_thuoc && p.them_thuoc.trim()) issues.push(`Thêm thuốc: ${p.them_thuoc.trim()}`);
    }
    return issues.length > 0 ? issues.join('; ') : 'Theo dõi thường quy';
  }

  formatPatientZaloText(p, isSingle = true) {
    if (!p) return '';
    const ten = (p.ten || 'BN').toUpperCase();
    let ns = '';
    if (p.nam_sinh_tuoi) {
      let rawNs = String(p.nam_sinh_tuoi).trim();
      if (rawNs.startsWith('(') && rawNs.endsWith(')')) {
        ns = ` ${rawNs}`;
      } else {
        rawNs = rawNs.replace(/\(([^\)]+)\)/g, '- $1').replace(/\s+/g, ' ').trim();
        ns = ` (${rawNs})`;
      }
    }
    const phong = p.phong_giuong || '—';
    const cd = p.chan_doan || '—';
    const vanDe = this.extractPatientProblem(p);

    const ylItems = [];
    if (p.y_lenh && p.y_lenh.trim()) ylItems.push(p.y_lenh.trim());
    if (p.them_thuoc && p.them_thuoc.trim()) ylItems.push(`Thêm: ${p.them_thuoc.trim()}`);
    const ylStr = ylItems.join('; ');

    const lines = [];
    if (isSingle) {
      lines.push('📋 BÀN GIAO');
    }
    lines.push(`- BN: ${ten}${ns}`);
    lines.push(`- P-G: ${phong}`);
    lines.push(`- CĐ: ${cd}`);
    lines.push(`- VĐ: ${vanDe}`);
    if (ylStr) {
      lines.push(`- YL: ${ylStr}`);
    }

    return lines.join('\n');
  }

  // TẠO ĐỊNH DẠNG BÀN GIAO TỔNG HỢP GỬI ZALO (TIÊU ĐỀ SIÊU NGẮN GỌN)
  generateZaloSummaryText() {
    const patients = window.patientController.patientList;
    const handoverList = patients.filter(p => {
      const st = window.patientController ? window.patientController.getPatientWorkStatus(p) : p.handover_status;
      return st === 'can_ban_giao' || Boolean(p.handover_issues && p.handover_issues.trim()) || p.handover_status === 'pending' || p.handover_status === 'critical';
    });

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

    if (handoverList.length === 0) {
      return `📋 BÀN GIAO (${dateStr})\n- Không có ca bệnh tồn đọng hoặc cần bàn giao.`;
    }

    let text = `📋 BÀN GIAO (${dateStr})\n\n`;

    handoverList.forEach((p, idx) => {
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
