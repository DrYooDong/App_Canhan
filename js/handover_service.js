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

  // TẠO ĐỊNH DẠNG TIN NHẮN TÓM TẮT ĐỂ GỬI QUA ZALO / VIBER NHÓM TRỰC
  generateZaloSummaryText() {
    const patients = window.patientController.patientList;
    const criticalList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.CRITICAL);
    const pendingList = patients.filter(p => p.handover_status === CONFIG.HANDOVER_STATUS.PENDING);

    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const docName = window.authController?.currentUser?.full_name || 'Bác sĩ điều trị';
    const deptName = window.authController?.currentUser?.department || 'KHOA NHIỄM';

    let text = `📋 [BÀN GIAO TUA TRỰC LÂM SÀNG - ${deptName.toUpperCase()}]\n`;
    text += `⏰ Thời gian: ${nowStr}\n`;
    text += `👨‍⚕️ BS bàn giao: ${docName}\n`;
    text += `📊 Tổng số ca cần bàn giao: ${criticalList.length + pendingList.length} ca (🚨 ${criticalList.length} ca nặng, ⏳ ${pendingList.length} ca theo dõi)\n`;
    text += `────────────────────\n\n`;

    if (criticalList.length > 0) {
      text += `🚨 DANH SÁCH BÁO ĐỘNG ĐỎ / BỆNH NẶNG:\n`;
      criticalList.forEach((p, i) => {
        text += `${i + 1}. [${p.phong_giuong}] ${p.ten.toUpperCase()} (${p.nam_sinh_tuoi})\n`;
        text += `   • CĐ: ${p.chan_doan}\n`;
        if (p.handover_issues) text += `   ⚠️ Vấn đề: ${p.handover_issues}\n`;
        if (p.handover_actions) text += `   🎯 Cần làm: ${p.handover_actions}\n`;
        text += `\n`;
      });
    }

    if (pendingList.length > 0) {
      text += `⏳ DANH SÁCH VẤN ĐỀ TỒN ĐỌNG / THEO DÕI SÁT:\n`;
      pendingList.forEach((p, i) => {
        text += `${i + 1}. [${p.phong_giuong}] ${p.ten.toUpperCase()} (${p.nam_sinh_tuoi})\n`;
        text += `   • CĐ: ${p.chan_doan}\n`;
        if (p.handover_issues) text += `   ⚠️ Tồn đọng: ${p.handover_issues}\n`;
        if (p.handover_actions) text += `   🎯 Cần làm: ${p.handover_actions}\n`;
        text += `\n`;
      });
    }

    if (criticalList.length === 0 && pendingList.length === 0) {
      text += `✅ Khoa hiện tại không có ca bệnh tồn đọng hoặc nguy kịch cần theo dõi đặc biệt.\n`;
    }

    text += `────────────────────\n`;
    text += `👉 Xem chi tiết trên hệ thống MedWard Pro.`;

    return text;
  }

  async copyHandoverToClipboard() {
    const text = this.generateZaloSummaryText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (window.showToast) {
        window.showToast('📋 Đã sao chép nội dung bàn giao! Bạn có thể dán (Ctrl+V) vào Zalo / Viber.');
      } else {
        alert('Đã sao chép tóm tắt bàn giao vào bộ nhớ tạm!');
      }
    } catch (e) {
      alert('Không thể tự động sao chép. Vui lòng thử lại: ' + e.message);
    }
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
