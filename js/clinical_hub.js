// ==============================================================================
// CLINICAL TOOLS & SCORES HUB v2.0 - MEDWARD PRO
// Trung Tâm Thang Điểm & Công Cụ Lâm Sàng Bỏ Túi (16 công cụ)
// Tích hợp liên kết NB đi buồng, tự điền thông số & chèn trực tiếp vào hồ sơ
// ==============================================================================

class ClinicalHub {
  constructor() {
    this.modalId = 'clinicalHubModal';
    this.currentCategory = 'all'; // 'all' | 'favorites' | 'scores' | 'calculators' | 'infectious'
    this.searchQuery = '';
    this.activeToolId = 'tool_drip';
    this.linkedPatientId = '';
    this.favorites = this.loadStoredList('medward_hub_favorites', ['tool_drip', 'tool_crcl', 'tool_news2', 'tool_dengue_classify']);
    this.recentTools = this.loadStoredList('medward_hub_recent', []);
    this.lastResults = {};
    this.state = {
      dripMode: 'rate',       // 'rate' | 'time'
      dripFactor: 20,         // 15 | 20 | 60
      crclGender: 'male',
      egfrGender: 'male',
      elecTab: 'na',          // 'na' | 'ca'
      bmiGender: 'male',
      gcsE: 4,
      gcsV: 5,
      gcsIntubated: false,
      gcsM: 6,
      cp: { bili: 1, alb: 1, inr: 1, asc: 1, enc: 1 },
      news2: { rr: 'rr0', spo2Scale: 1, spo2: 's0', o2: 'o0', sbp: 'bp0', hr: 'hr0', avpu: 'a0', temp: 't0' },
      dengueFluidScenario: 'warning' // 'warning' | 'shock' | 'maint'
    };
  }

  init() {
    this.bindEvents();
  }

  loadStoredList(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [...fallback];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...fallback];
    } catch {
      return [...fallback];
    }
  }

  saveStoredList(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // Bỏ qua nếu bộ nhớ đầy hoặc ẩn danh
    }
  }

  // Chuẩn hóa tiếng Việt không dấu để tìm kiếm nhanh
  normalizeText(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  stripLeadingEmoji(str) {
    return String(str || '').replace(/^(?:[^\p{L}\p{N}\s]+\s*)+/u, '').trim();
  }

  // ============================================================================
  // MỞ / ĐÓNG MODAL & PHÍM TẮT
  // ============================================================================
  openForCurrentDetailPatient(preselectToolId = null) {
    const detailId = document.getElementById('editPatientId')?.value || window.patientController?.currentEditingPatientId || '';
    this.openModal(preselectToolId, detailId);
  }

  openModal(preselectToolId = null, preselectPatientId = null) {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;

    if (preselectToolId) {
      this.activeToolId = preselectToolId;
    }

    // Nếu không truyền patientId cụ thể nhưng Modal Chi tiết NB đang mở, tự liên kết NB đó
    if (preselectPatientId !== null) {
      this.linkedPatientId = preselectPatientId;
    } else {
      const detailModal = document.getElementById('patientDetailModal');
      if (detailModal && detailModal.classList.contains('active')) {
        this.linkedPatientId = document.getElementById('editPatientId')?.value || '';
      }
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    this.populatePatientSelector();
    this.updateCategoryCounts();
    this.renderToolList();
    this.renderActiveTool();

    // Chỉ auto-focus search trên desktop để tránh bật bàn phím ảo trên điện thoại
    if (window.innerWidth > 768) {
      setTimeout(() => {
        document.getElementById('hubSearchInput')?.focus();
      }, 100);
    }
  }

  closeModal() {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';

    // Giữ class modal-open nếu vẫn còn modal khác (VD: patientDetailModal) đang mở bên dưới
    const anyOtherModal = document.querySelector('.modal-overlay.active:not(#clinicalHubModal)');
    if (!anyOtherModal) {
      document.body.classList.remove('modal-open');
    }
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      // Alt + C: Bật / Tắt Clinical Hub
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        const modal = document.getElementById(this.modalId);
        if (modal && modal.classList.contains('active')) {
          this.closeModal();
        } else {
          this.openModal();
        }
        return;
      }

      // Điều hướng nhanh ↑ / ↓ giữa các công cụ khi Hub đang mở
      const modal = document.getElementById(this.modalId);
      if (!modal || !modal.classList.contains('active')) return;

      const activeTag = document.activeElement?.tagName;
      const inNumericOrSelect = activeTag === 'SELECT' || (activeTag === 'INPUT' && document.activeElement?.id !== 'hubSearchInput');
      if (!inNumericOrSelect && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const filtered = this.getFilteredTools();
        if (filtered.length <= 1) return;
        e.preventDefault();
        const curIdx = filtered.findIndex(t => t.id === this.activeToolId);
        const nextIdx = e.key === 'ArrowDown'
          ? (curIdx + 1) % filtered.length
          : (curIdx - 1 + filtered.length) % filtered.length;
        this.selectTool(filtered[nextIdx].id);
      }
    });
  }

  // ============================================================================
  // LIÊN KẾT NGƯỜI BỆNH (PATIENT CONTEXT) & CHÈN TRỰC TIẾP VÀO HỒ SƠ
  // ============================================================================
  getPatientList() {
    return Array.isArray(window.patientController?.patientList)
      ? window.patientController.patientList
      : [];
  }

  getLinkedPatient() {
    if (!this.linkedPatientId) return null;
    return this.getPatientList().find(p => p.id === this.linkedPatientId) || null;
  }

  extractPatientAge(p) {
    if (!p) return null;
    const raw = String(p.nam_sinh_tuoi || '').trim();
    if (!raw) return null;
    const nowYear = new Date().getFullYear();

    // Dạng "1958 (68t)" hoặc "68 tuổi"
    const ageInParen = raw.match(/\((\d{1,3})\s*(?:t|tuổi|tuoi)?\)/i);
    if (ageInParen) {
      const a = parseInt(ageInParen[1], 10);
      if (a >= 0 && a <= 125) return a;
    }

    // Dạng năm sinh 4 chữ số (1900..nowYear)
    const yearMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      const a = nowYear - y;
      if (a >= 0 && a <= 125) return a;
    }

    // Dạng số tuổi đơn thuần (VD: "65" hoặc "65t")
    const plainAge = raw.match(/^(\d{1,3})\s*(?:t|tuổi|tuoi)?$/i);
    if (plainAge) {
      const a = parseInt(plainAge[1], 10);
      if (a >= 0 && a <= 125) return a;
    }

    return null;
  }

  extractLatestHct(p) {
    if (!p) return null;
    // Ưu tiên mốc Hct mới nhất trong dengue_trends
    if (Array.isArray(p.dengue_trends) && p.dengue_trends.length > 0) {
      const last = p.dengue_trends[p.dengue_trends.length - 1];
      const v = parseFloat(last?.hct);
      if (!isNaN(v) && v >= 15 && v <= 75) return v;
    }
    // Fallback tìm trong CLS hiện có (VD: "Hct 45.2%" hoặc "HCT: 46")
    const clsText = `${p.cls_hien_co || ''} ${p.cls || ''}`;
    const matches = [...clsText.matchAll(/\bhct\s*[:=]?\s*(\d{2}(?:\.\d+)?)\s*%?/gi)];
    if (matches.length > 0) {
      const v = parseFloat(matches[matches.length - 1][1]);
      if (!isNaN(v) && v >= 15 && v <= 75) return v;
    }
    return null;
  }

  populatePatientSelector() {
    const select = document.getElementById('hubPatientSelect');
    if (!select) return;

    const patients = this.getPatientList().filter(p => !p.is_discharged);
    const prevVal = this.linkedPatientId;

    const optionsHtml = [
      `<option value="">-- Tính độc lập (chưa gắn người bệnh) --</option>`,
      ...patients.map(p => {
        const room = p.phong_giuong ? `[${p.phong_giuong}] ` : '';
        const age = this.extractPatientAge(p);
        const ageStr = age !== null ? ` (${age}t)` : '';
        const name = p.ten || 'Chưa rõ tên';
        const selected = p.id === prevVal ? 'selected' : '';
        return `<option value="${this.escapeHtml(p.id)}" ${selected}>${this.escapeHtml(room + name + ageStr)}</option>`;
      })
    ].join('');

    select.innerHTML = optionsHtml;

    // Nếu NB cũ không còn trong danh sách ngày hiện tại, reset
    if (prevVal && !patients.some(p => p.id === prevVal)) {
      this.linkedPatientId = '';
    }

    this.renderPatientMeta();
  }

  selectPatient(patientId) {
    this.linkedPatientId = patientId || '';
    const select = document.getElementById('hubPatientSelect');
    if (select && select.value !== this.linkedPatientId) {
      select.value = this.linkedPatientId;
    }
    this.renderPatientMeta();
    this.applyPatientContextToActiveTool(true);
    this.updateInsertButtonState();
  }

  renderPatientMeta() {
    const metaEl = document.getElementById('hubPatientMeta');
    const clearBtn = document.getElementById('hubPatientClearBtn');
    const barEl = document.getElementById('hubPatientBar');
    if (!metaEl) return;

    const p = this.getLinkedPatient();
    if (!p) {
      if (clearBtn) clearBtn.style.display = 'none';
      barEl?.classList.remove('has-patient');
      metaEl.innerHTML = `<span class="hub-patient-hint">Chọn NB để tự động lấy tuổi / Hct &amp; chèn thẳng kết quả vào hồ sơ</span>`;
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';
    barEl?.classList.add('has-patient');

    const age = this.extractPatientAge(p);
    const hct = this.extractLatestHct(p);
    const diag = (p.chan_doan || '').trim();
    const shortDiag = diag.length > 42 ? `${diag.slice(0, 42)}…` : diag;

    const chips = [];
    if (age !== null) chips.push(`<span class="hub-meta-chip">🎂 ${age} tuổi</span>`);
    if (hct !== null) chips.push(`<span class="hub-meta-chip chip-warn">🩸 Hct gần nhất: ${hct}%</span>`);
    if (shortDiag) chips.push(`<span class="hub-meta-chip chip-diag" title="${this.escapeHtml(diag)}">📋 ${this.escapeHtml(shortDiag)}</span>`);

    metaEl.innerHTML = chips.length > 0
      ? chips.join('')
      : `<span class="hub-patient-hint">Đã gắn NB — có thể chèn thẳng kết quả vào hồ sơ</span>`;
  }

  // Tự động điền tuổi / Hct từ NB đang gắn vào công cụ hiện tại
  applyPatientContextToActiveTool(showNotice = false) {
    const p = this.getLinkedPatient();
    if (!p) return;
    const age = this.extractPatientAge(p);
    const hct = this.extractLatestHct(p);
    let filled = [];

    if (this.activeToolId === 'tool_crcl' && age !== null) {
      const el = document.getElementById('crclAge');
      if (el) { el.value = age; this.calcCrCl(); filled.push(`Tuổi ${age}`); }
    } else if (this.activeToolId === 'tool_egfr' && age !== null) {
      const el = document.getElementById('egfrAge');
      if (el) { el.value = age; this.calcEgfr(); filled.push(`Tuổi ${age}`); }
    } else if (this.activeToolId === 'tool_curb65' && age !== null) {
      const el = document.getElementById('curb_65');
      if (el) { el.checked = age >= 65; this.calcCurb65(); if (age >= 65) filled.push(`Tuổi ≥65 (${age}t)`); }
    } else if (this.activeToolId === 'tool_chadsvasc' && age !== null) {
      const el75 = document.getElementById('chads_a75');
      const el65 = document.getElementById('chads_a65');
      if (el75 && el65) {
        el75.checked = age >= 75;
        el65.checked = age >= 65 && age < 75;
        this.calcChadsVasc();
        if (age >= 65) filled.push(`Tuổi ${age}`);
      }
    } else if (this.activeToolId === 'tool_hct_concentrate' && hct !== null) {
      const el = document.getElementById('hctCurrent');
      if (el) { el.value = hct; this.calcHct(); filled.push(`Hct ${hct}%`); }
    }

    if (showNotice && filled.length > 0 && window.showToast) {
      window.showToast(`⚡ Tự động điền từ hồ sơ ${p.ten}: ${filled.join(', ')}`);
    }
  }

  getToolById(toolId) {
    return this.getToolRegistry().find(t => t.id === toolId) || null;
  }

  // Thanh thao tác thống nhất cho mọi công cụ (Chèn hồ sơ + Sao chép + Làm lại)
  renderToolActions(toolKey, resetMethodName, copyLabel = 'Sao chép') {
    const tool = this.getToolById(this.activeToolId);
    const defaultField = tool?.defaultTargetField || 'kham_lam_sang';
    const linked = this.getLinkedPatient();
    const disabledAttr = linked ? '' : 'disabled';
    const insertTitle = linked
      ? `Chèn kết quả trực tiếp vào hồ sơ ${linked.ten}`
      : 'Chọn Người bệnh ở thanh trên để chèn trực tiếp vào hồ sơ';

    return `
      <div class="calc-actions-bar">
        <div class="calc-insert-group ${linked ? 'ready' : 'unlinked'}">
          <select id="hubInsertFieldSelect" class="calc-insert-select" title="Chọn mục cần chèn trong hồ sơ người bệnh">
            <option value="kham_lam_sang" ${defaultField === 'kham_lam_sang' ? 'selected' : ''}>🔍 (O) Khám lâm sàng</option>
            <option value="cls_hien_co" ${defaultField === 'cls_hien_co' ? 'selected' : ''}>🔬 (O) CLS Hiện có</option>
            <option value="y_lenh" ${defaultField === 'y_lenh' ? 'selected' : ''}>💊 (P) Y lệnh điều trị</option>
            <option value="handover_issues" ${defaultField === 'handover_issues' ? 'selected' : ''}>⚠️ Vấn đề bàn giao</option>
          </select>
          <button type="button" id="hubInsertBtn" class="btn btn-success calc-btn-insert" ${disabledAttr}
            title="${this.escapeHtml(insertTitle)}"
            onclick="window.clinicalHub.insertIntoPatient('${toolKey}')">
            📥 Chèn hồ sơ NB
          </button>
        </div>

        <div class="calc-actions-secondary">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('${toolKey}')">
            📋 ${copyLabel}
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.${resetMethodName}()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  updateInsertButtonState() {
    const btn = document.getElementById('hubInsertBtn');
    const group = btn?.closest('.calc-insert-group');
    const linked = this.getLinkedPatient();
    if (!btn) return;
    btn.disabled = !linked;
    btn.title = linked
      ? `Chèn kết quả trực tiếp vào hồ sơ ${linked.ten}`
      : 'Chọn Người bệnh ở thanh trên để chèn trực tiếp vào hồ sơ';
    group?.classList.toggle('ready', !!linked);
    group?.classList.toggle('unlinked', !linked);
  }

  insertIntoPatient(toolKey) {
    const p = this.getLinkedPatient();
    if (!p) {
      if (window.showToast) window.showToast('⚠️ Vui lòng chọn Người bệnh ở thanh trên trước khi chèn');
      document.getElementById('hubPatientSelect')?.focus();
      return;
    }

    const text = (this.lastResults[toolKey] || '').trim();
    if (!text) {
      if (window.showToast) window.showToast('⚠️ Chưa có kết quả hợp lệ để chèn');
      return;
    }

    const field = document.getElementById('hubInsertFieldSelect')?.value || 'kham_lam_sang';
    const fieldMap = {
      kham_lam_sang: { label: '(O) Khám lâm sàng', textareaId: 'editKhamLamSang' },
      cls_hien_co: { label: '(O) CLS Hiện có', textareaId: 'editClsHienCo' },
      y_lenh: { label: '(P) Y lệnh điều trị', textareaId: 'editOrders' },
      handover_issues: { label: 'Vấn đề bàn giao', textareaId: 'editHandoverIssues' }
    };
    const meta = fieldMap[field] || fieldMap.kham_lam_sang;

    // Nếu Modal Chi tiết NB đang mở đúng NB này, đồng bộ nội dung đang gở dở trước khi chèn
    const detailModal = document.getElementById('patientDetailModal');
    const isEditingThisPatient = detailModal?.classList.contains('active') &&
      document.getElementById('editPatientId')?.value === p.id;

    if (isEditingThisPatient && window.patientController?.syncAllTextareasFromModalRichEditors) {
      window.patientController.syncAllTextareasFromModalRichEditors();
      const taEl = document.getElementById(meta.textareaId);
      if (taEl) {
        p[field] = taEl.value;
      }
    }

    const existing = String(p[field] || '').trim();
    const updated = existing ? `${existing}\n- ${text}` : `- ${text}`;
    p[field] = updated;

    // Giữ đồng bộ trường p.cls tổng hợp khi cập nhật cls_hien_co
    if (field === 'cls_hien_co') {
      const hc = (p.cls_hien_co || '').trim();
      const cl = (p.cls_can_lam || '').trim();
      if (hc && cl) p.cls = `[Hiện có]: ${hc}\n[Cần làm]: ${cl}`;
      else if (cl) p.cls = `[Cần làm]: ${cl}`;
      else p.cls = hc;
    }

    p.updated_at = new Date().toISOString();

    if (window.patientController) {
      window.patientController.saveLocalCache?.();
      if (window.supabaseService) {
        window.supabaseService.savePatient(p, window.patientController.currentDate).catch(() => {});
      }
      if (isEditingThisPatient) {
        const taEl = document.getElementById(meta.textareaId);
        if (taEl) {
          taEl.value = updated;
          window.patientController.syncModalRichEditorsFromTextareas?.();
        }
      }
      window.patientController.render?.();
    }

    if (window.showToast) {
      window.showToast({
        title: `📥 ĐÃ CHÈN VÀO HỒ SƠ ${p.ten}`,
        message: `Đã thêm kết quả vào mục ${meta.label} và đồng bộ dữ liệu.`,
        type: 'success',
        icon: '✅'
      });
    }
  }

  // ============================================================================
  // DANH MỤC 16 CÔNG CỤ, GHIM YÊU THÍCH & TÌM KIẾM THÔNG MINH
  // ============================================================================
  getToolRegistry() {
    return [
      // --- NHÓM MÁY TÍNH LÂM SÀNG (7) ---
      {
        id: 'tool_drip',
        name: 'Tốc độ truyền dịch (IV Drip Rate)',
        short: 'Tốc độ truyền dịch',
        icon: '💧',
        category: 'calculators',
        badge: 'Hằng ngày',
        defaultTargetField: 'y_lenh',
        keywords: 'dich truyen giot phut ml gio infusion drip pump bom tiem dien',
        desc: 'Tính giọt/phút, ml/giờ, thời gian hết chai & giờ dự kiến xong'
      },
      {
        id: 'tool_crcl',
        name: 'Độ thanh thải Thận (Cockcroft-Gault CrCl)',
        short: 'CrCl Cockcroft-Gault',
        icon: '🧪',
        category: 'calculators',
        badge: 'Chỉnh liều KS',
        defaultTargetField: 'cls_hien_co',
        keywords: 'than creatinine crcl cockcroft gault khang sinh chinh lieu suy than',
        desc: 'Tính CrCl chỉnh liều kháng sinh & bảng tra cứu liều theo KDIGO'
      },
      {
        id: 'tool_egfr',
        name: 'Độ lọc cầu thận eGFR (CKD-EPI 2021)',
        short: 'eGFR (CKD-EPI 2021)',
        icon: '🫘',
        category: 'calculators',
        badge: 'Thận CKD',
        defaultTargetField: 'cls_hien_co',
        keywords: 'egfr ckd epi 2021 loc cau than creatinine kdigo suy than man',
        desc: 'Công thức chuẩn CKD-EPI 2021 phân độ bệnh thận mạn G1–G5'
      },
      {
        id: 'tool_electrolytes',
        name: 'Hiệu chỉnh Natri (Glucose) & Calci (Albumin)',
        short: 'Hiệu chỉnh Na⁺ & Ca²⁺',
        icon: '🧂',
        category: 'calculators',
        badge: 'Điện giải',
        defaultTargetField: 'cls_hien_co',
        keywords: 'natri na calci ca albumin glucose duong huyet dien giai katz payne ha natri',
        desc: 'Tính Na⁺ hiệu chỉnh khi tăng đường huyết & Ca²⁺ hiệu chỉnh theo Albumin'
      },
      {
        id: 'tool_bmi_ibw',
        name: 'BMI, Cân nặng lý tưởng (IBW), AdjBW & BSA',
        short: 'BMI, IBW & BSA',
        icon: '⚖️',
        category: 'calculators',
        badge: 'Thể trạng',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'bmi ibw adjbw bsa can nang chieu cao beo phi dien tich da devine mosteller',
        desc: 'Phân loại BMI Châu Á, cân nặng lý tưởng/hiệu chỉnh & diện tích da'
      },
      {
        id: 'tool_anion_gap',
        name: 'Khoảng trống Anion (AG & AG hiệu chỉnh Albumin)',
        short: 'Anion Gap (AG)',
        icon: '⚡',
        category: 'calculators',
        badge: 'Toan kiềm',
        defaultTargetField: 'cls_hien_co',
        keywords: 'anion gap ag toan chuyen hoa khi mau albumin dka lactic goldmark',
        desc: 'Tính AG và AG hiệu chỉnh theo Albumin đánh giá toan chuyển hóa'
      },
      {
        id: 'tool_map_pf',
        name: 'Huyết áp trung bình (MAP), Hiệu áp & P/F Ratio',
        short: 'MAP, Hiệu áp & P/F',
        icon: '❤️‍🩹',
        category: 'calculators',
        badge: 'Hồi sức',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'map huyet ap trung binh hieu ap kep ards pf ratio pao2 fio2 khi mau oxy',
        desc: 'Tính MAP, hiệu áp (nhận diện HA kẹp) & chỉ số PaO₂/FiO₂ đánh giá ARDS'
      },

      // --- NHÓM KHOA NHIỄM & SXH DENGUE (3 chuyên sâu + CURB-65, qSOFA) ---
      {
        id: 'tool_hct_concentrate',
        name: '% Cô đặc máu SXH Dengue (ΔHct)',
        short: 'Cô đặc máu ΔHct',
        icon: '🩸',
        category: 'infectious',
        badge: 'Khoa Nhiễm',
        defaultTargetField: 'cls_hien_co',
        keywords: 'sxh dengue hct co dac mau thoat huyet tuong tieu cau delta',
        desc: 'Tính % tăng Hct so với Hct nền & ngưỡng cảnh báo +10% / +20%'
      },
      {
        id: 'tool_dengue_fluid',
        name: 'Bù dịch SXH Dengue theo cân nặng (BYT)',
        short: 'Dịch truyền Dengue',
        icon: '💦',
        category: 'infectious',
        badge: 'Phác đồ BYT',
        defaultTargetField: 'y_lenh',
        keywords: 'bu dich sxh dengue soc ringer holliday segar phac do byt can nang',
        desc: 'Tính nhanh lộ trình ml/giờ & giọt/phút cho SXH cảnh báo, Sốc & duy trì'
      },
      {
        id: 'tool_dengue_classify',
        name: 'Phân tầng SXH Dengue (Bộ Y tế)',
        short: 'Phân tầng Dengue',
        icon: '🦟',
        category: 'infectious',
        badge: 'Bộ Y tế',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'phan tang sxh dengue dau hieu canh bao nang soc xuat huyet byt',
        desc: 'Checklist dấu hiệu cảnh báo & tiêu chuẩn SXH Dengue nặng'
      },

      // --- NHÓM THANG ĐIỂM LÂM SÀNG (6) ---
      {
        id: 'tool_news2',
        name: 'Thang điểm Cảnh báo Sớm NEWS2',
        short: 'NEWS2 Cảnh báo sớm',
        icon: '🚨',
        category: 'scores',
        badge: 'Đi buồng',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'news2 canh bao som sinh hieu spo2 mach huyet ap nhiet do tri giac bao dong do',
        desc: 'Chấm nhanh 7 dấu hiệu sinh tồn, phân tầng nguy cơ & lịch theo dõi'
      },
      {
        id: 'tool_curb65',
        name: 'Thang điểm CURB-65 / CRB-65 (Viêm phổi)',
        short: 'CURB-65 / CRB-65',
        icon: '🫁',
        category: 'scores',
        badge: 'Viêm phổi',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'curb65 crb65 viem phoi cap ho hap nhap vien icu ure',
        desc: 'Đánh giá độ nặng Viêm phổi cộng đồng & chỉ định nhập viện / ICU'
      },
      {
        id: 'tool_qsofa',
        name: 'Thang điểm qSOFA (Quick SOFA)',
        short: 'qSOFA Sepsis',
        icon: '🦠',
        category: 'scores',
        badge: 'Sepsis',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'qsofa sofa nhiem khuan huyet nhiem trung huyet sepsis soc nhiem khuan',
        desc: 'Tầm soát nhanh nguy cơ Sepsis tại giường + gói xử trí giờ đầu'
      },
      {
        id: 'tool_glasgow',
        name: 'Thang điểm Hôn mê Glasgow (GCS)',
        short: 'Glasgow (GCS)',
        icon: '🧠',
        category: 'scores',
        badge: 'Tri giác',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'glasgow gcs hon me tri giac y thuc mat loi noi van dong nkq',
        desc: 'Chấm 1 chạm Mắt (E), Lời nói (V / T-NKQ), Vận động (M)'
      },
      {
        id: 'tool_child_pugh',
        name: 'Thang điểm Child-Pugh Xơ Gan',
        short: 'Child-Pugh Xơ Gan',
        icon: '🟡',
        category: 'scores',
        badge: 'Gan mật',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'child pugh xo gan suy gan bilirubin albumin inr co truong nao gan',
        desc: 'Chọn nhanh 1 chạm 5 tiêu chí phân loại xơ gan Class A, B, C'
      },
      {
        id: 'tool_chadsvasc',
        name: 'Thang điểm CHA₂DS₂-VASc (Rung nhĩ)',
        short: 'CHA₂DS₂-VASc',
        icon: '🫀',
        category: 'scores',
        badge: 'Tim mạch',
        defaultTargetField: 'kham_lam_sang',
        keywords: 'chadsvasc chads2 rung nhi dot quy khang dong noac warfarin tim mach',
        desc: 'Ước tính nguy cơ đột quỵ/năm & chỉ định kháng đông ở BN rung nhĩ'
      }
    ];
  }

  matchesCategory(item, cat) {
    if (cat === 'all') return true;
    if (cat === 'favorites') return this.favorites.includes(item.id);
    if (cat === 'scores') return item.category === 'scores';
    if (cat === 'calculators') return item.category === 'calculators';
    if (cat === 'infectious') {
      return item.category === 'infectious' || item.id === 'tool_curb65' || item.id === 'tool_qsofa';
    }
    return true;
  }

  getFilteredTools() {
    const registry = this.getToolRegistry();
    const normQuery = this.normalizeText(this.searchQuery);

    const matched = registry.filter(item => {
      const matchCat = this.matchesCategory(item, this.currentCategory);
      if (!matchCat) return false;
      if (!normQuery) return true;
      const hay = this.normalizeText(`${item.name} ${item.short} ${item.desc} ${item.badge} ${item.keywords || ''}`);
      return hay.includes(normQuery);
    });

    // Đưa các công cụ đã ghim lên đầu khi ở tab 'all' và chưa tìm kiếm
    if (this.currentCategory === 'all' && !normQuery) {
      matched.sort((a, b) => {
        const favA = this.favorites.includes(a.id) ? 0 : 1;
        const favB = this.favorites.includes(b.id) ? 0 : 1;
        return favA - favB;
      });
    }

    return matched;
  }

  updateCategoryCounts() {
    const registry = this.getToolRegistry();
    const setCnt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };
    setCnt('hubCountAll', registry.length);
    setCnt('hubCountFav', registry.filter(i => this.favorites.includes(i.id)).length);
    setCnt('hubCountScores', registry.filter(i => this.matchesCategory(i, 'scores')).length);
    setCnt('hubCountCalc', registry.filter(i => this.matchesCategory(i, 'calculators')).length);
    setCnt('hubCountInf', registry.filter(i => this.matchesCategory(i, 'infectious')).length);
    const totalBadge = document.getElementById('hubTotalCountBadge');
    if (totalBadge) totalBadge.textContent = `${registry.length} công cụ`;
  }

  toggleFavorite(toolId, evt) {
    if (evt) evt.stopPropagation();
    const idx = this.favorites.indexOf(toolId);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
    } else {
      this.favorites.unshift(toolId);
    }
    this.saveStoredList('medward_hub_favorites', this.favorites);
    this.updateCategoryCounts();
    this.renderToolList();
  }

  setCategory(cat) {
    this.currentCategory = cat;
    document.querySelectorAll('.hub-filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.cat === cat);
    });
    this.renderToolList();
  }

  handleSearch(query) {
    this.searchQuery = (query || '').trim();
    const clearBtn = document.getElementById('hubSearchClear');
    if (clearBtn) clearBtn.style.display = this.searchQuery ? 'inline-flex' : 'none';
    this.renderToolList();
  }

  clearSearch() {
    const input = document.getElementById('hubSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.handleSearch('');
  }

  selectTool(toolId) {
    this.activeToolId = toolId;
    this.recentTools = [toolId, ...this.recentTools.filter(id => id !== toolId)].slice(0, 5);
    this.saveStoredList('medward_hub_recent', this.recentTools);
    this.renderToolList();
    this.renderActiveTool();

    // Cuộn vùng nội dung lên đầu khi đổi công cụ
    const content = document.getElementById('hubToolDetail');
    if (content) content.scrollTop = 0;

    // Trên mobile, cuộn mượt pill đang chọn vào giữa thanh ngang
    if (window.innerWidth <= 768) {
      const activePill = document.querySelector('#hubToolList .hub-tool-item.active');
      activePill?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  renderToolList() {
    const listContainer = document.getElementById('hubToolList');
    if (!listContainer) return;

    const filtered = this.getFilteredTools();

    if (filtered.length === 0) {
      const emptyMsg = this.currentCategory === 'favorites' && !this.searchQuery
        ? `Chưa có công cụ nào được ghim.<br>Bấm biểu tượng <strong>☆</strong> ở bên phải công cụ để ghim lên đầu!`
        : `Không tìm thấy công cụ phù hợp với từ khóa "<strong>${this.escapeHtml(this.searchQuery)}</strong>"`;
      listContainer.innerHTML = `
        <div class="hub-empty-state">
          <div style="font-size: 24px; margin-bottom: 6px;">${this.currentCategory === 'favorites' ? '⭐' : '🔍'}</div>
          <div>${emptyMsg}</div>
        </div>
      `;
      return;
    }

    if (!filtered.some(f => f.id === this.activeToolId)) {
      this.activeToolId = filtered[0].id;
      this.renderActiveTool();
    }

    listContainer.innerHTML = filtered.map(tool => {
      const isActive = tool.id === this.activeToolId;
      const isFav = this.favorites.includes(tool.id);
      return `
        <div class="hub-tool-item ${isActive ? 'active' : ''}" data-tool-id="${tool.id}"
          onclick="window.clinicalHub.selectTool('${tool.id}')">
          <div class="hub-tool-icon">${tool.icon}</div>
          <div class="hub-tool-info">
            <div class="hub-tool-title">
              <span class="hub-tool-name">${tool.short}</span>
              <div class="hub-tool-right">
                <span class="hub-tool-badge">${tool.badge}</span>
                <button type="button" class="hub-fav-btn ${isFav ? 'pinned' : ''}"
                  title="${isFav ? 'Bỏ ghim' : 'Ghim công cụ hay dùng'}"
                  onclick="window.clinicalHub.toggleFavorite('${tool.id}', event)">${isFav ? '★' : '☆'}</button>
              </div>
            </div>
            <div class="hub-tool-desc">${tool.desc}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================================
  // RENDER CÔNG CỤ ĐANG CHỌN
  // ============================================================================
  renderActiveTool() {
    const detailContainer = document.getElementById('hubToolDetail');
    if (!detailContainer) return;

    switch (this.activeToolId) {
      case 'tool_drip':
        detailContainer.innerHTML = this.templateToolDrip();
        this.calcDripRate();
        break;
      case 'tool_crcl':
        detailContainer.innerHTML = this.templateToolCrCl();
        this.applyPatientContextToActiveTool(false);
        this.calcCrCl();
        break;
      case 'tool_egfr':
        detailContainer.innerHTML = this.templateToolEgfr();
        this.applyPatientContextToActiveTool(false);
        this.calcEgfr();
        break;
      case 'tool_electrolytes':
        detailContainer.innerHTML = this.templateToolElectrolytes();
        this.calcElectrolytes();
        break;
      case 'tool_bmi_ibw':
        detailContainer.innerHTML = this.templateToolBmi();
        this.calcBmi();
        break;
      case 'tool_anion_gap':
        detailContainer.innerHTML = this.templateToolAnionGap();
        this.calcAnionGap();
        break;
      case 'tool_map_pf':
        detailContainer.innerHTML = this.templateToolMapPf();
        this.calcMapPf();
        break;
      case 'tool_hct_concentrate':
        detailContainer.innerHTML = this.templateToolHct();
        this.applyPatientContextToActiveTool(false);
        this.calcHct();
        break;
      case 'tool_dengue_fluid':
        detailContainer.innerHTML = this.templateToolDengueFluid();
        this.calcDengueFluid();
        break;
      case 'tool_dengue_classify':
        detailContainer.innerHTML = this.templateToolDengueClassify();
        this.calcDengueClassify();
        break;
      case 'tool_news2':
        detailContainer.innerHTML = this.templateToolNews2();
        this.calcNews2();
        break;
      case 'tool_curb65':
        detailContainer.innerHTML = this.templateToolCurb65();
        this.applyPatientContextToActiveTool(false);
        this.calcCurb65();
        break;
      case 'tool_qsofa':
        detailContainer.innerHTML = this.templateToolQsofa();
        this.calcQsofa();
        break;
      case 'tool_glasgow':
        detailContainer.innerHTML = this.templateToolGlasgow();
        this.calcGlasgow();
        break;
      case 'tool_child_pugh':
        detailContainer.innerHTML = this.templateToolChildPugh();
        this.calcChildPugh();
        break;
      case 'tool_chadsvasc':
        detailContainer.innerHTML = this.templateToolChadsVasc();
        this.applyPatientContextToActiveTool(false);
        this.calcChadsVasc();
        break;
      default:
        detailContainer.innerHTML = `<div class="hub-empty-state">Vui lòng chọn một công cụ lâm sàng</div>`;
    }
  }

  // Đặt mức độ màu cho hộp kết quả (res-good | res-mild | res-moderate | res-severe | res-critical)
  setResultSeverity(boxEl, severityClass) {
    if (!boxEl) return;
    boxEl.classList.remove('sev-good', 'sev-mild', 'sev-moderate', 'sev-severe', 'sev-critical');
    if (severityClass) {
      const sev = severityClass.replace(/^res-/, 'sev-');
      boxEl.classList.add(sev);
    }
  }

  renderCopyPreview(text) {
    if (!text) return '';
    return `
      <div class="calc-copy-preview">
        <span class="calc-copy-preview-lbl">Mẫu chèn / chép:</span>
        <span class="calc-copy-preview-text">${this.escapeHtml(text)}</span>
      </div>
    `;
  }

  // ============================================================================
  // 1. TỐC ĐỘ TRUYỀN DỊCH (IV DRIP RATE - 2 CHIỀU)
  // ============================================================================
  templateToolDrip() {
    const mode = this.state.dripMode;
    const factor = this.state.dripFactor;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">💧 Tính Tốc Độ &amp; Thời Gian Truyền Dịch (IV Drip Rate)</div>
          <div class="calc-subtitle">Quy đổi 2 chiều giữa thể tích, thời gian, giọt/phút &amp; ml/giờ — tự tính giờ kết thúc</div>
        </div>

        <div class="calc-segmented-tabs">
          <button type="button" class="calc-seg-tab ${mode === 'rate' ? 'active' : ''}"
            onclick="window.clinicalHub.setDripMode('rate')">⏱️ Tính tốc độ (Giọt/phút)</button>
          <button type="button" class="calc-seg-tab ${mode === 'time' ? 'active' : ''}"
            onclick="window.clinicalHub.setDripMode('time')">⏳ Tính thời gian truyền hết</button>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Thể tích dịch truyền (ml):</label>
            <div class="calc-quick-chips" id="dripVolChips">
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripVol(100)">100 ml</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripVol(250)">250 ml</button>
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setDripVol(500)">500 ml</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripVol(1000)">1000 ml</button>
            </div>
            <input type="number" id="dripVol" class="calc-input" value="500" min="5" max="5000" oninput="window.clinicalHub.calcDripRate()">
          </div>

          ${mode === 'rate' ? `
            <div class="calc-form-group">
              <label class="calc-label">Thời gian truyền:</label>
              <div class="calc-quick-chips" id="dripTimeChips">
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripHours(1)">1h</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripHours(2)">2h</button>
                <button type="button" class="calc-chip active" onclick="window.clinicalHub.setDripHours(4)">4h</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripHours(6)">6h</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripHours(8)">8h</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripHours(12)">12h</button>
              </div>
              <div class="calc-input-row">
                <input type="number" id="dripTime" class="calc-input" value="4" min="0.1" step="0.5" style="flex: 1;" oninput="window.clinicalHub.calcDripRate()">
                <select id="dripTimeUnit" class="calc-select" style="width: 96px;" onchange="window.clinicalHub.calcDripRate()">
                  <option value="hours" selected>Giờ</option>
                  <option value="minutes">Phút</option>
                </select>
              </div>
            </div>
          ` : `
            <div class="calc-form-group">
              <label class="calc-label">Tốc độ đang chảy (giọt / phút):</label>
              <div class="calc-quick-chips" id="dripRateChips">
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripRateInput(20)">20 g/p</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripRateInput(30)">30 g/p</button>
                <button type="button" class="calc-chip active" onclick="window.clinicalHub.setDripRateInput(40)">40 g/p</button>
                <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripRateInput(60)">60 g/p</button>
              </div>
              <input type="number" id="dripRateInput" class="calc-input" value="40" min="1" max="500" oninput="window.clinicalHub.calcDripRate()">
            </div>
          `}

          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">Hệ số dây truyền dịch:</label>
            <div class="calc-radio-group cols-3">
              <label class="calc-radio-card ${factor === 20 ? 'active' : ''}" id="cardDrop20" onclick="window.clinicalHub.setDropFactor(20)">
                <span class="calc-radio-title">Dây thường (20 g/ml)</span>
                <span class="calc-radio-sub">Dịch truyền người lớn</span>
              </label>
              <label class="calc-radio-card ${factor === 15 ? 'active' : ''}" id="cardDrop15" onclick="window.clinicalHub.setDropFactor(15)">
                <span class="calc-radio-title">Dây truyền máu (15 g/ml)</span>
                <span class="calc-radio-sub">Máu / Chế phẩm máu</span>
              </label>
              <label class="calc-radio-card ${factor === 60 ? 'active' : ''}" id="cardDrop60" onclick="window.clinicalHub.setDropFactor(60)">
                <span class="calc-radio-title">Vi giọt (60 g/ml)</span>
                <span class="calc-radio-sub">Nhi khoa / truyền chậm</span>
              </label>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="dripResultBox"></div>
        ${this.renderToolActions('drip', 'resetDrip', 'Sao chép Y lệnh')}
      </div>
    `;
  }

  setDripMode(mode) {
    this.state.dripMode = mode;
    this.renderActiveTool();
  }

  setDripVol(vol) {
    const input = document.getElementById('dripVol');
    if (input) {
      input.value = vol;
      document.querySelectorAll('#dripVolChips .calc-chip').forEach(c => {
        c.classList.toggle('active', c.textContent.trim() === `${vol} ml`);
      });
      this.calcDripRate();
    }
  }

  setDripHours(h) {
    const input = document.getElementById('dripTime');
    const unit = document.getElementById('dripTimeUnit');
    if (input) input.value = h;
    if (unit) unit.value = 'hours';
    document.querySelectorAll('#dripTimeChips .calc-chip').forEach(c => {
      c.classList.toggle('active', c.textContent.trim() === `${h}h`);
    });
    this.calcDripRate();
  }

  setDripRateInput(r) {
    const input = document.getElementById('dripRateInput');
    if (input) input.value = r;
    document.querySelectorAll('#dripRateChips .calc-chip').forEach(c => {
      c.classList.toggle('active', c.textContent.trim() === `${r} g/p`);
    });
    this.calcDripRate();
  }

  setDropFactor(factor) {
    this.state.dripFactor = factor;
    [15, 20, 60].forEach(f => {
      document.getElementById(`cardDrop${f}`)?.classList.toggle('active', factor === f);
    });
    this.calcDripRate();
  }

  formatEndTime(minutesFromNow) {
    const end = new Date(Date.now() + minutesFromNow * 60000);
    const hh = String(end.getHours()).padStart(2, '0');
    const mm = String(end.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  calcDripRate() {
    const vol = parseFloat(document.getElementById('dripVol')?.value) || 0;
    const factor = this.state.dripFactor || 20;
    const resBox = document.getElementById('dripResultBox');
    if (!resBox) return;

    this.setResultSeverity(resBox, 'res-mild');

    if (this.state.dripMode === 'rate') {
      const timeVal = parseFloat(document.getElementById('dripTime')?.value) || 0;
      const unit = document.getElementById('dripTimeUnit')?.value || 'hours';

      if (vol <= 0 || timeVal <= 0) {
        resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập thể tích và thời gian hợp lệ</div>`;
        this.lastResults.drip = '';
        return;
      }

      const totalMinutes = unit === 'hours' ? timeVal * 60 : timeVal;
      const totalHours = unit === 'hours' ? timeVal : timeVal / 60;
      const dropsPerMin = Math.round((vol * factor) / totalMinutes);
      const mlPerHour = Math.round((vol / totalHours) * 10) / 10;
      const secPerDrop = dropsPerMin > 0 ? (60 / dropsPerMin).toFixed(1) : '—';
      const endTimeStr = this.formatEndTime(totalMinutes);

      const copyText = `Truyền TM ${vol}ml / ${timeVal} ${unit === 'hours' ? 'giờ' : 'phút'} → ${dropsPerMin} giọt/phút (${mlPerHour} ml/h, dây ${factor} g/ml)`;
      this.lastResults.drip = copyText;

      resBox.innerHTML = `
        <div class="calc-result-main res-mild">
          <span class="calc-result-val">${dropsPerMin}</span>
          <span class="calc-result-unit">giọt / phút</span>
        </div>
        <div class="calc-result-details">
          <span class="calc-badge-res">💧 ${mlPerHour} ml / giờ</span>
          <span class="calc-badge-res">⏱️ ~${secPerDrop} giây / giọt</span>
          <span class="calc-badge-res">🕒 Dự kiến xong: ${endTimeStr}</span>
        </div>
        ${this.renderCopyPreview(copyText)}
      `;
    } else {
      const rate = parseFloat(document.getElementById('dripRateInput')?.value) || 0;
      if (vol <= 0 || rate <= 0) {
        resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập thể tích và tốc độ giọt/phút hợp lệ</div>`;
        this.lastResults.drip = '';
        return;
      }

      const totalMinutes = Math.round((vol * factor) / rate);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const mlPerHour = Math.round(((rate * 60) / factor) * 10) / 10;
      const durationStr = hours > 0 ? `${hours} giờ ${mins > 0 ? `${mins} phút` : ''}`.trim() : `${mins} phút`;
      const endTimeStr = this.formatEndTime(totalMinutes);

      const copyText = `Truyền TM ${vol}ml tốc độ ${rate} giọt/phút (${mlPerHour} ml/h, dây ${factor} g/ml) → hết trong ${durationStr} (xong ~${endTimeStr})`;
      this.lastResults.drip = copyText;

      resBox.innerHTML = `
        <div class="calc-result-main res-mild">
          <span class="calc-result-val">${durationStr}</span>
        </div>
        <div class="calc-result-details">
          <span class="calc-badge-res">💧 ${mlPerHour} ml / giờ</span>
          <span class="calc-badge-res">🕒 Dự kiến xong: ${endTimeStr}</span>
          <span class="calc-badge-res">🧪 ${vol} ml ở ${rate} g/p</span>
        </div>
        ${this.renderCopyPreview(copyText)}
      `;
    }
  }

  resetDrip() {
    this.state.dripMode = 'rate';
    this.state.dripFactor = 20;
    this.renderActiveTool();
  }

  // ============================================================================
  // 2. ĐỘ THANH THẢI THẬN COCKCROFT-GAULT (CrCl)
  // ============================================================================
  templateToolCrCl() {
    const g = this.state.crclGender;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🧪 Chức Năng Thận Cockcroft-Gault (CrCl)</div>
          <div class="calc-subtitle">Ước tính độ thanh thải Creatinine phục vụ hiệu chỉnh liều kháng sinh &amp; thuốc thải qua thận</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Tuổi (năm):</label>
            <input type="number" id="crclAge" class="calc-input" value="65" min="15" max="120" oninput="window.clinicalHub.calcCrCl()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Giới tính:</label>
            <div class="calc-input-row">
              <button type="button" class="calc-chip calc-chip-lg ${g === 'male' ? 'active' : ''}" id="btnCrclMale" onclick="window.clinicalHub.setCrclGender('male')">👨 Nam</button>
              <button type="button" class="calc-chip calc-chip-lg ${g === 'female' ? 'active' : ''}" id="btnCrclFemale" onclick="window.clinicalHub.setCrclGender('female')">👩 Nữ (×0.85)</button>
            </div>
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Cân nặng (kg):</label>
            <input type="number" id="crclWeight" class="calc-input" value="55" min="20" max="250" oninput="window.clinicalHub.calcCrCl()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Creatinine huyết thanh:</label>
            <div class="calc-input-row">
              <input type="number" id="crclScr" class="calc-input" value="120" min="5" max="2500" step="any" style="flex: 1;" oninput="window.clinicalHub.calcCrCl()">
              <select id="crclScrUnit" class="calc-select" style="width: 105px;" onchange="window.clinicalHub.handleScrUnitChange('crclScr', 'crclScrUnit', 'calcCrCl')">
                <option value="umol" selected>μmol/L</option>
                <option value="mgdl">mg/dL</option>
              </select>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="crclResultBox"></div>
        ${this.renderToolActions('crcl', 'resetCrCl', 'Sao chép CrCl')}
      </div>
    `;
  }

  setCrclGender(gender) {
    this.state.crclGender = gender;
    document.getElementById('btnCrclMale')?.classList.toggle('active', gender === 'male');
    document.getElementById('btnCrclFemale')?.classList.toggle('active', gender === 'female');
    this.calcCrCl();
  }

  handleScrUnitChange(inputId, unitId, calcFnName) {
    const unit = document.getElementById(unitId)?.value;
    const input = document.getElementById(inputId);
    if (!input) return;
    const val = parseFloat(input.value) || 0;
    if (val > 0) {
      input.value = unit === 'mgdl' ? (val / 88.4).toFixed(2) : Math.round(val * 88.4);
    }
    this[calcFnName]?.();
  }

  calcCrCl() {
    const age = parseFloat(document.getElementById('crclAge')?.value) || 0;
    const gender = this.state.crclGender || 'male';
    const weight = parseFloat(document.getElementById('crclWeight')?.value) || 0;
    const scr = parseFloat(document.getElementById('crclScr')?.value) || 0;
    const unit = document.getElementById('crclScrUnit')?.value || 'umol';

    const resBox = document.getElementById('crclResultBox');
    if (!resBox) return;

    if (age <= 0 || weight <= 0 || scr <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập đầy đủ tuổi, cân nặng và Creatinine</div>`;
      this.lastResults.crcl = '';
      return;
    }

    const scrMgDl = Math.max(0.1, unit === 'umol' ? scr / 88.4 : scr);
    let crcl = ((140 - age) * weight) / (72 * scrMgDl);
    if (gender === 'female') crcl *= 0.85;
    crcl = Math.max(0, Math.round(crcl * 10) / 10);

    let stage = '', stageClass = '', doseAdvice = '', quickTable = '';

    if (crcl >= 90) {
      stage = 'Bình thường (G1)';
      stageClass = 'res-good';
      doseAdvice = 'Dùng liều chuẩn bình thường theo phác đồ.';
      quickTable = 'Meropenem 1g q8h • Levofloxacin 750mg q24h • Piperacillin/Tazo 4.5g q6-8h';
    } else if (crcl >= 60) {
      stage = 'Giảm nhẹ (G2)';
      stageClass = 'res-mild';
      doseAdvice = 'Đa số kháng sinh giữ liều chuẩn; lưu ý theo dõi độc thận với Aminoglycoside / Vancomycin / Colistin.';
      quickTable = 'Meropenem 1g q8h • Levofloxacin 750mg q24h • Ceftazidime 2g q8h';
    } else if (crcl >= 30) {
      stage = 'Suy thận trung bình (G3)';
      stageClass = 'res-moderate';
      doseAdvice = 'Cần giãn khoảng cách hoặc giảm 25–50% liều kháng sinh thải trừ qua thận.';
      quickTable = 'Meropenem 1g q12h • Levofloxacin 750mg q48h (CrCl<50) • Ceftazidime 1–2g q12h';
    } else if (crcl >= 15) {
      stage = 'Suy thận nặng (G4)';
      stageClass = 'res-severe';
      doseAdvice = 'Giảm liều mạnh (50–75%), giãn liều tối đa, tránh thuốc độc thận (NSAID, Aminoglycoside).';
      quickTable = 'Meropenem 500mg q12h • Levofloxacin 750mg nạp → 500mg q48h • Ceftazidime 1g q24h';
    } else {
      stage = 'Suy thận giai đoạn cuối (G5)';
      stageClass = 'res-critical';
      doseAdvice = 'Chỉnh liều theo phác đồ lọc máu / chạy thận nhân tạo định kỳ (bổ sung liều sau lọc nếu cần).';
      quickTable = 'Meropenem 500mg q24h (sau HD) • Ceftazidime 0.5–1g q24–48h • Hội chẩn Dược lâm sàng';
    }

    this.setResultSeverity(resBox, stageClass);
    const copyText = `CrCl (Cockcroft-Gault) = ${crcl} ml/phút (${stage}; ${gender === 'male' ? 'Nam' : 'Nữ'} ${age}t, ${weight}kg, Scr ${scr} ${unit === 'umol' ? 'μmol/L' : 'mg/dL'}).`;
    this.lastResults.crcl = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${stageClass}">
        <span class="calc-result-val">${crcl}</span>
        <span class="calc-result-unit">ml / phút</span>
      </div>
      <div class="calc-stage-title ${stageClass}">📌 ${stage}</div>
      <div class="calc-advice-box">
        <div>💡 <strong>Khuyến cáo:</strong> ${doseAdvice}</div>
        <div class="calc-ref-line">💊 <strong>Gợi ý tham khảo:</strong> ${quickTable}</div>
      </div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetCrCl() {
    this.state.crclGender = 'male';
    this.renderActiveTool();
  }

  // ============================================================================
  // 3. ĐỘ LỌC CẦU THẬN eGFR (CKD-EPI 2021) - MỚI
  // ============================================================================
  templateToolEgfr() {
    const g = this.state.egfrGender;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🫘 Độ Lọc Cầu Thận Ước Tính eGFR (CKD-EPI 2021)</div>
          <div class="calc-subtitle">Công thức chuẩn KDIGO hiện hành (không dùng hệ số chủng tộc) đánh giá giai đoạn bệnh thận mạn</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Tuổi (năm):</label>
            <input type="number" id="egfrAge" class="calc-input" value="60" min="18" max="120" oninput="window.clinicalHub.calcEgfr()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Giới tính:</label>
            <div class="calc-input-row">
              <button type="button" class="calc-chip calc-chip-lg ${g === 'male' ? 'active' : ''}" id="btnEgfrMale" onclick="window.clinicalHub.setEgfrGender('male')">👨 Nam</button>
              <button type="button" class="calc-chip calc-chip-lg ${g === 'female' ? 'active' : ''}" id="btnEgfrFemale" onclick="window.clinicalHub.setEgfrGender('female')">👩 Nữ</button>
            </div>
          </div>

          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">Creatinine huyết thanh:</label>
            <div class="calc-input-row">
              <input type="number" id="egfrScr" class="calc-input" value="95" min="10" max="2500" step="any" style="flex: 1;" oninput="window.clinicalHub.calcEgfr()">
              <select id="egfrScrUnit" class="calc-select" style="width: 110px;" onchange="window.clinicalHub.handleScrUnitChange('egfrScr', 'egfrScrUnit', 'calcEgfr')">
                <option value="umol" selected>μmol/L</option>
                <option value="mgdl">mg/dL</option>
              </select>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="egfrResultBox"></div>
        ${this.renderToolActions('egfr', 'resetEgfr', 'Sao chép eGFR')}
      </div>
    `;
  }

  setEgfrGender(gender) {
    this.state.egfrGender = gender;
    document.getElementById('btnEgfrMale')?.classList.toggle('active', gender === 'male');
    document.getElementById('btnEgfrFemale')?.classList.toggle('active', gender === 'female');
    this.calcEgfr();
  }

  calcEgfr() {
    const age = parseFloat(document.getElementById('egfrAge')?.value) || 0;
    const scr = parseFloat(document.getElementById('egfrScr')?.value) || 0;
    const unit = document.getElementById('egfrScrUnit')?.value || 'umol';
    const gender = this.state.egfrGender || 'male';
    const resBox = document.getElementById('egfrResultBox');
    if (!resBox) return;

    if (age < 18 || scr <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập tuổi (≥ 18) và Creatinine hợp lệ</div>`;
      this.lastResults.egfr = '';
      return;
    }

    const scrMgDl = Math.max(0.1, unit === 'umol' ? scr / 88.4 : scr);
    const kappa = gender === 'female' ? 0.7 : 0.9;
    const alpha = gender === 'female' ? -0.241 : -0.302;
    const sexMult = gender === 'female' ? 1.012 : 1.0;

    const ratio = scrMgDl / kappa;
    const egfr = Math.round(
      142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.200) * Math.pow(0.9938, age) * sexMult * 10
    ) / 10;

    let stage = '', stageClass = '', advice = '';
    if (egfr >= 90) {
      stage = 'G1 — Bình thường hoặc tăng (≥ 90)';
      stageClass = 'res-good';
      advice = 'Chức năng lọc cầu thận bình thường (chỉ chẩn đoán CKD nếu kèm đạm niệu/tổn thương cấu trúc thận > 3 tháng).';
    } else if (egfr >= 60) {
      stage = 'G2 — Giảm nhẹ (60 – 89)';
      stageClass = 'res-mild';
      advice = 'Theo dõi định kỳ, kiểm soát tốt huyết áp và đường huyết. Kiểm tra tỉ số ACR niệu nếu có bệnh nền.';
    } else if (egfr >= 45) {
      stage = 'G3a — Giảm nhẹ đến trung bình (45 – 59)';
      stageClass = 'res-moderate';
      advice = 'Hạn chế NSAID, thận trọng thuốc cản quang iod, đánh giá chỉnh liều thuốc (Metformin, SGLT2i, kháng sinh).';
    } else if (egfr >= 30) {
      stage = 'G3b — Giảm trung bình đến nặng (30 – 44)';
      stageClass = 'res-moderate';
      advice = 'Giảm liều Metformin (tối đa 1000mg/ngày), chỉnh liều kháng sinh, theo dõi Kali, thiếu máu và toan chuyển hóa.';
    } else if (egfr >= 15) {
      stage = 'G4 — Giảm nặng (15 – 29)';
      stageClass = 'res-severe';
      advice = 'Ngưng Metformin, tránh hoàn toàn NSAID và thuốc độc thận, hội chẩn chuyên khoa Nội Thận.';
    } else {
      stage = 'G5 — Suy thận giai đoạn cuối (< 15)';
      stageClass = 'res-critical';
      advice = 'Suy thận nặng, đánh giá chỉ định điều trị thay thế thận (lọc máu / lọc màng bụng).';
    }

    this.setResultSeverity(resBox, stageClass);
    const copyText = `eGFR (CKD-EPI 2021) = ${egfr} ml/phút/1.73m² (${stage}; Scr ${scr} ${unit === 'umol' ? 'μmol/L' : 'mg/dL'}).`;
    this.lastResults.egfr = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${stageClass}">
        <span class="calc-result-val">${egfr}</span>
        <span class="calc-result-unit">ml/phút/1.73m²</span>
      </div>
      <div class="calc-stage-title ${stageClass}">📌 KDIGO ${stage}</div>
      <div class="calc-advice-box">
        <div>💡 <strong>Đánh giá lâm sàng:</strong> ${advice}</div>
        <div class="calc-ref-line">ℹ️ Lưu ý: eGFR áp dụng khi Creatinine ổn định (không dùng chính xác trong tổn thương thận cấp AKI đang diễn tiến).</div>
      </div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetEgfr() {
    this.state.egfrGender = 'male';
    this.renderActiveTool();
  }

  // ============================================================================
  // 4. HIỆU CHỈNH NATRI (ĐƯỜNG HUYẾT) & CALCI (ALBUMIN) - MỚI
  // ============================================================================
  templateToolElectrolytes() {
    const tab = this.state.elecTab;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🧂 Hiệu Chỉnh Điện Giải: Na⁺ (Tăng Đường Huyết) &amp; Ca²⁺ (Albumin)</div>
          <div class="calc-subtitle">Phân biệt hạ Natri giả do tăng đường huyết (DKA/HHS) và hạ Calci giả do hạ Albumin máu</div>
        </div>

        <div class="calc-segmented-tabs">
          <button type="button" class="calc-seg-tab ${tab === 'na' ? 'active' : ''}"
            onclick="window.clinicalHub.setElecTab('na')">🍬 Na⁺ hiệu chỉnh (Glucose)</button>
          <button type="button" class="calc-seg-tab ${tab === 'ca' ? 'active' : ''}"
            onclick="window.clinicalHub.setElecTab('ca')">🦴 Ca²⁺ hiệu chỉnh (Albumin)</button>
        </div>

        ${tab === 'na' ? `
          <div class="calc-grid">
            <div class="calc-form-group">
              <label class="calc-label">Na⁺ máu đo được (mmol/L):</label>
              <input type="number" id="elecNa" class="calc-input" value="128" min="90" max="190" step="0.5" oninput="window.clinicalHub.calcElectrolytes()">
            </div>
            <div class="calc-form-group">
              <label class="calc-label">Đường huyết (Glucose):</label>
              <div class="calc-input-row">
                <input type="number" id="elecGlu" class="calc-input" value="22" min="1" max="1500" step="0.1" style="flex: 1;" oninput="window.clinicalHub.calcElectrolytes()">
                <select id="elecGluUnit" class="calc-select" style="width: 105px;" onchange="window.clinicalHub.handleGluUnitChange()">
                  <option value="mmol" selected>mmol/L</option>
                  <option value="mgdl">mg/dL</option>
                </select>
              </div>
            </div>
          </div>
        ` : `
          <div class="calc-grid">
            <div class="calc-form-group">
              <label class="calc-label">Calci toàn phần đo được:</label>
              <div class="calc-input-row">
                <input type="number" id="elecCa" class="calc-input" value="1.95" min="0.5" max="20" step="0.05" style="flex: 1;" oninput="window.clinicalHub.calcElectrolytes()">
                <select id="elecCaUnit" class="calc-select" style="width: 105px;" onchange="window.clinicalHub.handleCaUnitChange()">
                  <option value="mmol" selected>mmol/L</option>
                  <option value="mgdl">mg/dL</option>
                </select>
              </div>
            </div>
            <div class="calc-form-group">
              <label class="calc-label">Albumin huyết thanh:</label>
              <div class="calc-input-row">
                <input type="number" id="elecAlb" class="calc-input" value="28" min="5" max="65" step="0.5" style="flex: 1;" oninput="window.clinicalHub.calcElectrolytes()">
                <select id="elecAlbUnit" class="calc-select" style="width: 90px;" onchange="window.clinicalHub.handleAlbUnitChange()">
                  <option value="gl" selected>g/L</option>
                  <option value="gdl">g/dL</option>
                </select>
              </div>
            </div>
          </div>
        `}

        <div class="calc-result-box" id="elecResultBox"></div>
        ${this.renderToolActions('electrolytes', 'resetElectrolytes', 'Sao chép Kết quả')}
      </div>
    `;
  }

  setElecTab(tab) {
    this.state.elecTab = tab;
    this.renderActiveTool();
  }

  handleGluUnitChange() {
    const unit = document.getElementById('elecGluUnit')?.value;
    const input = document.getElementById('elecGlu');
    if (!input) return;
    const v = parseFloat(input.value) || 0;
    if (v > 0) input.value = unit === 'mgdl' ? Math.round(v * 18) : (v / 18).toFixed(1);
    this.calcElectrolytes();
  }

  handleCaUnitChange() {
    const unit = document.getElementById('elecCaUnit')?.value;
    const input = document.getElementById('elecCa');
    if (!input) return;
    const v = parseFloat(input.value) || 0;
    if (v > 0) input.value = unit === 'mgdl' ? (v * 4).toFixed(2) : (v / 4).toFixed(2);
    this.calcElectrolytes();
  }

  handleAlbUnitChange() {
    const unit = document.getElementById('elecAlbUnit')?.value;
    const input = document.getElementById('elecAlb');
    if (!input) return;
    const v = parseFloat(input.value) || 0;
    if (v > 0) input.value = unit === 'gdl' ? (v / 10).toFixed(1) : Math.round(v * 10);
    this.calcElectrolytes();
  }

  calcElectrolytes() {
    const resBox = document.getElementById('elecResultBox');
    if (!resBox) return;

    if (this.state.elecTab === 'na') {
      const na = parseFloat(document.getElementById('elecNa')?.value) || 0;
      const glu = parseFloat(document.getElementById('elecGlu')?.value) || 0;
      const unit = document.getElementById('elecGluUnit')?.value || 'mmol';

      if (na <= 0 || glu <= 0) {
        resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập Na⁺ và Glucose hợp lệ</div>`;
        this.lastResults.electrolytes = '';
        return;
      }

      const gluMgDl = unit === 'mmol' ? glu * 18.018 : glu;
      const excess100 = Math.max(0, (gluMgDl - 100) / 100);
      const naKatz = Math.round((na + 1.6 * excess100) * 10) / 10;
      const naHillier = Math.round((na + 2.4 * excess100) * 10) / 10;
      const primary = gluMgDl > 400 ? naHillier : naKatz;
      const methodLabel = gluMgDl > 400 ? 'Hillier (+2.4 — Glucose > 22.2 mmol/L)' : 'Katz (+1.6)';

      let evalText = '', cls = '', advice = '';
      if (primary < 135) {
        evalText = primary < 125 ? '🚨 HẠ NATRI THẬT MỨC ĐỘ NẶNG (< 125)' : '⚠️ HẠ NATRI THẬT (125 – 134)';
        cls = primary < 125 ? 'res-critical' : 'res-moderate';
        advice = 'Ngay cả sau hiệu chỉnh đường huyết, bệnh nhân vẫn hạ Na⁺ thật. Đánh giá thể tích dịch ngoại bào & tránh tăng Na⁺ quá 8–10 mmol/L trong 24h.';
      } else if (primary <= 145) {
        evalText = '🟢 NATRI HIỆU CHỈNH BÌNH THƯỜNG (135 – 145)';
        cls = 'res-good';
        advice = 'Hạ Na⁺ đo được là do pha loãng tăng áp lực thẩm thấu (tăng Glucose). Khi điều trị Insulin hạ đường huyết, Na⁺ sẽ tự tăng trở lại.';
      } else {
        evalText = '🚨 TĂNG NATRI THẬT (> 145 mmol/L)';
        cls = 'res-critical';
        advice = 'Bệnh nhân mất nước tự do nặng (thường gặp trong HHS/DKA). Cân nhắc dịch nhược trương NaCl 0.45% sau giai đoạn hồi sức dịch ban đầu.';
      }

      this.setResultSeverity(resBox, cls);
      const copyText = `Na⁺ hiệu chỉnh = ${primary} mmol/L (${methodLabel}; Na⁺ đo ${na}, Glucose ${glu} ${unit === 'mmol' ? 'mmol/L' : 'mg/dL'}) — ${this.stripLeadingEmoji(evalText)}.`;
      this.lastResults.electrolytes = copyText;

      resBox.innerHTML = `
        <div class="calc-result-main ${cls}">
          <span class="calc-result-val">${primary}</span>
          <span class="calc-result-unit">mmol/L (${gluMgDl > 400 ? 'Hillier' : 'Katz'})</span>
        </div>
        <div class="calc-result-details">
          <span class="calc-badge-res">Katz (+1.6): ${naKatz} mmol/L</span>
          <span class="calc-badge-res">Hillier (+2.4): ${naHillier} mmol/L</span>
        </div>
        <div class="calc-stage-title ${cls}">${evalText}</div>
        <div class="calc-advice-box">💡 <strong>Biện luận:</strong> ${advice}</div>
        ${this.renderCopyPreview(copyText)}
      `;
    } else {
      const ca = parseFloat(document.getElementById('elecCa')?.value) || 0;
      const caUnit = document.getElementById('elecCaUnit')?.value || 'mmol';
      const alb = parseFloat(document.getElementById('elecAlb')?.value) || 0;
      const albUnit = document.getElementById('elecAlbUnit')?.value || 'gl';

      if (ca <= 0 || alb <= 0) {
        resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập Calci và Albumin hợp lệ</div>`;
        this.lastResults.electrolytes = '';
        return;
      }

      const caMmol = caUnit === 'mgdl' ? ca / 4 : ca;
      const albGL = albUnit === 'gdl' ? alb * 10 : alb;
      const caCorrMmol = Math.round((caMmol + 0.02 * (40 - albGL)) * 100) / 100;
      const caCorrMgDl = Math.round((caCorrMmol * 4) * 100) / 100;

      let evalText = '', cls = '', advice = '';
      if (caCorrMmol < 2.1) {
        evalText = caCorrMmol < 1.9 ? '🚨 HẠ CALCI MÁU THẬT NẶNG (< 1.9 mmol/L)' : '⚠️ HẠ CALCI MÁU THẬT (1.9 – 2.09 mmol/L)';
        cls = caCorrMmol < 1.9 ? 'res-critical' : 'res-moderate';
        advice = 'Khám dấu Chvostek/Trousseau, kiểm tra ECG (QT kéo dài) và Magie máu. Cân nhắc bù Calci Gluconate TM nếu có triệu chứng.';
      } else if (caCorrMmol <= 2.6) {
        evalText = '🟢 CALCI HIỆU CHỈNH BÌNH THƯỜNG (2.10 – 2.60 mmol/L)';
        cls = 'res-good';
        advice = 'Calci toàn phần thấp chỉ là hạ Calci giả do giảm Albumin máu. Không cần bù Calci nếu không có triệu chứng lâm sàng.';
      } else {
        evalText = '🚨 TĂNG CALCI MÁU THẬT (> 2.60 mmol/L)';
        cls = 'res-critical';
        advice = 'Tìm nguyên nhân tăng Calci máu (cường cận giáp, ác tính, ngộ độc vitamin D). Nếu > 3.0 mmol/L cần truyền NaCl 0.9% tích cực.';
      }

      this.setResultSeverity(resBox, cls);
      const copyText = `Ca²⁺ hiệu chỉnh (Payne) = ${caCorrMmol} mmol/L (${caCorrMgDl} mg/dL; Ca đo ${ca} ${caUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}, Albumin ${alb} ${albUnit === 'gl' ? 'g/L' : 'g/dL'}).`;
      this.lastResults.electrolytes = copyText;

      resBox.innerHTML = `
        <div class="calc-result-main ${cls}">
          <span class="calc-result-val">${caCorrMmol}</span>
          <span class="calc-result-unit">mmol/L (${caCorrMgDl} mg/dL)</span>
        </div>
        <div class="calc-stage-title ${cls}">${evalText}</div>
        <div class="calc-advice-box">💡 <strong>Biện luận:</strong> ${advice}</div>
        ${this.renderCopyPreview(copyText)}
      `;
    }
  }

  resetElectrolytes() {
    this.renderActiveTool();
  }

  // ============================================================================
  // 5. BMI, IBW, AdjBW & BSA
  // ============================================================================
  templateToolBmi() {
    const g = this.state.bmiGender;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">⚖️ BMI, Cân Nặng Lý Tưởng (IBW), Hiệu Chỉnh (AdjBW) &amp; BSA</div>
          <div class="calc-subtitle">Phân loại WHO Châu Á + Devine IBW + Adjusted BW (tính dịch/thuốc người béo phì) + BSA Mosteller</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Chiều cao (cm):</label>
            <input type="number" id="bmiHeight" class="calc-input" value="165" min="100" max="220" oninput="window.clinicalHub.calcBmi()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Cân nặng thực tế (kg):</label>
            <input type="number" id="bmiWeight" class="calc-input" value="62" min="20" max="250" oninput="window.clinicalHub.calcBmi()">
          </div>

          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">Giới tính (tính IBW &amp; AdjBW):</label>
            <div class="calc-input-row">
              <button type="button" class="calc-chip calc-chip-lg ${g === 'male' ? 'active' : ''}" id="btnBmiMale" onclick="window.clinicalHub.setBmiGender('male')">👨 Nam</button>
              <button type="button" class="calc-chip calc-chip-lg ${g === 'female' ? 'active' : ''}" id="btnBmiFemale" onclick="window.clinicalHub.setBmiGender('female')">👩 Nữ</button>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="bmiResultBox"></div>
        ${this.renderToolActions('bmi', 'resetBmi', 'Sao chép BMI/IBW')}
      </div>
    `;
  }

  setBmiGender(gender) {
    this.state.bmiGender = gender;
    document.getElementById('btnBmiMale')?.classList.toggle('active', gender === 'male');
    document.getElementById('btnBmiFemale')?.classList.toggle('active', gender === 'female');
    this.calcBmi();
  }

  calcBmi() {
    const h = parseFloat(document.getElementById('bmiHeight')?.value) || 0;
    const w = parseFloat(document.getElementById('bmiWeight')?.value) || 0;
    const gender = this.state.bmiGender || 'male';
    const resBox = document.getElementById('bmiResultBox');
    if (!resBox) return;

    if (h <= 0 || w <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập chiều cao và cân nặng hợp lệ</div>`;
      this.lastResults.bmi = '';
      return;
    }

    const hM = h / 100;
    const bmi = Math.round((w / (hM * hM)) * 10) / 10;
    const baseIbw = gender === 'male' ? 50 : 45.5;
    const ibw = Math.round(Math.max(30, baseIbw + 0.9 * (h - 152.4)) * 10) / 10;
    const adjBw = Math.round((ibw + 0.4 * (w - ibw)) * 10) / 10;
    const bsa = Math.round(Math.sqrt((h * w) / 3600) * 100) / 100;

    let category = '', catClass = '';
    if (bmi < 18.5) { category = 'Gầy / Thiếu cân'; catClass = 'res-mild'; }
    else if (bmi <= 22.9) { category = 'Bình thường (Châu Á)'; catClass = 'res-good'; }
    else if (bmi <= 24.9) { category = 'Thừa cân'; catClass = 'res-moderate'; }
    else if (bmi <= 29.9) { category = 'Béo phì Độ I'; catClass = 'res-severe'; }
    else { category = 'Béo phì Độ II (Nặng)'; catClass = 'res-critical'; }

    this.setResultSeverity(resBox, catClass);
    const adjNote = w > ibw * 1.2 ? `, AdjBW: ${adjBw} kg` : '';
    const copyText = `BMI = ${bmi} kg/m² (${category}; ${h}cm, ${w}kg) | IBW: ${ibw} kg${adjNote} | BSA: ${bsa} m².`;
    this.lastResults.bmi = copyText;

    resBox.innerHTML = `
      <div class="calc-metrics-grid">
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">BMI</div>
          <div class="calc-metric-val ${catClass}">${bmi}</div>
          <div class="calc-metric-sub">${category}</div>
        </div>
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">IBW (Lý tưởng)</div>
          <div class="calc-metric-val res-good">${ibw} <small>kg</small></div>
          <div class="calc-metric-sub">Công thức Devine</div>
        </div>
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">AdjBW (Hiệu chỉnh)</div>
          <div class="calc-metric-val res-mild">${adjBw} <small>kg</small></div>
          <div class="calc-metric-sub">${w > ibw * 1.2 ? 'Nên dùng tính dịch/KS' : 'Khi thừa cân >20%'}</div>
        </div>
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">BSA (Mosteller)</div>
          <div class="calc-metric-val">${bsa} <small>m²</small></div>
          <div class="calc-metric-sub">Diện tích da</div>
        </div>
      </div>
      <div class="calc-advice-box">💡 <strong>Ứng dụng:</strong> Ở BN thừa cân/béo phì (SXH Dengue, thở máy, Aminoglycoside), dùng <strong>IBW (${ibw} kg)</strong> hoặc <strong>AdjBW (${adjBw} kg)</strong> thay cân nặng thực tế để tránh quá tải dịch &amp; quá liều thuốc.</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetBmi() {
    this.state.bmiGender = 'male';
    this.renderActiveTool();
  }

  // ============================================================================
  // 6. KHOẢNG TRỐNG ANION (AG + AG HIỆU CHỈNH ALBUMIN)
  // ============================================================================
  templateToolAnionGap() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">⚡ Khoảng Trống Anion (AG &amp; AG Hiệu Chỉnh Albumin)</div>
          <div class="calc-subtitle">Phân biệt toan chuyển hóa tăng AG (GOLDMARK) hay bình thường — tự hiệu chỉnh khi hạ Albumin</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Na⁺ (mmol/L):</label>
            <input type="number" id="agNa" class="calc-input" value="138" min="80" max="200" oninput="window.clinicalHub.calcAnionGap()">
          </div>
          <div class="calc-form-group">
            <label class="calc-label">Cl⁻ (mmol/L):</label>
            <input type="number" id="agCl" class="calc-input" value="102" min="50" max="150" oninput="window.clinicalHub.calcAnionGap()">
          </div>
          <div class="calc-form-group">
            <label class="calc-label">HCO₃⁻ (mmol/L):</label>
            <input type="number" id="agHco3" class="calc-input" value="22" min="2" max="60" oninput="window.clinicalHub.calcAnionGap()">
          </div>
          <div class="calc-form-group">
            <label class="calc-label">Albumin huyết thanh (g/L — tùy chọn):</label>
            <input type="number" id="agAlb" class="calc-input" value="" placeholder="Mặc định 40 g/L" min="5" max="65" step="0.5" oninput="window.clinicalHub.calcAnionGap()">
          </div>
        </div>

        <div class="calc-result-box" id="agResultBox"></div>
        ${this.renderToolActions('anion_gap', 'resetAnionGap', 'Sao chép AG')}
      </div>
    `;
  }

  calcAnionGap() {
    const na = parseFloat(document.getElementById('agNa')?.value) || 0;
    const cl = parseFloat(document.getElementById('agCl')?.value) || 0;
    const hco3 = parseFloat(document.getElementById('agHco3')?.value) || 0;
    const albRaw = document.getElementById('agAlb')?.value?.trim();
    const alb = albRaw ? parseFloat(albRaw) : null;
    const resBox = document.getElementById('agResultBox');
    if (!resBox) return;

    if (na <= 0 || cl <= 0 || hco3 <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập đủ Na⁺, Cl⁻ và HCO₃⁻</div>`;
      this.lastResults.anion_gap = '';
      return;
    }

    const ag = Math.round((na - (cl + hco3)) * 10) / 10;
    const agCorr = alb !== null && !isNaN(alb) && alb > 0
      ? Math.round((ag + 0.25 * (40 - alb)) * 10) / 10
      : null;
    const evalVal = agCorr !== null ? agCorr : ag;

    let evalText = '', evalClass = '', cause = '';
    if (evalVal > 12) {
      evalText = '🚨 TĂNG KHOẢNG TRỐNG ANION (> 12 mmol/L)';
      evalClass = 'res-critical';
      cause = 'Gợi ý Toan chuyển hóa tăng AG (GOLDMARK): Toan Lactic (sốc/sepsis), Nhiễm toan Ceton (DKA), Suy thận ure huyết cao, Ngộ độc (methanol, salicylate, ethylene glycol).';
    } else if (evalVal >= 8) {
      evalText = '🟢 KHOẢNG TRỐNG ANION BÌNH THƯỜNG (8 – 12 mmol/L)';
      evalClass = 'res-good';
      cause = 'Nếu có toan chuyển hóa: Toan chuyển hóa tăng Cl⁻ máu (mất HCO₃⁻ qua tiêu hóa do tiêu chảy nặng, truyền nhiều NaCl 0.9%, hoặc toan hóa ống thận RTA).';
    } else {
      evalText = '📉 KHOẢNG TRỐNG ANION THẤP (< 8 mmol/L)';
      evalClass = 'res-mild';
      cause = 'Thường gặp do hạ Albumin máu (nhập Albumin để hiệu chỉnh!), đa u tủy xương hoặc tăng Lithium/Calci.';
    }

    this.setResultSeverity(resBox, evalClass);
    const corrStr = agCorr !== null ? ` | AG hiệu chỉnh (Alb ${alb} g/L) = ${agCorr} mmol/L` : '';
    const copyText = `Anion Gap = ${ag} mmol/L${corrStr} (Na ${na}, Cl ${cl}, HCO3 ${hco3}) — ${this.stripLeadingEmoji(evalText)}.`;
    this.lastResults.anion_gap = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${evalClass}">
        <span class="calc-result-val">${evalVal}</span>
        <span class="calc-result-unit">mmol/L ${agCorr !== null ? '(AG hiệu chỉnh)' : '(AG đo)'}</span>
      </div>
      ${agCorr !== null ? `
        <div class="calc-result-details">
          <span class="calc-badge-res">AG thô: ${ag} mmol/L</span>
          <span class="calc-badge-res">Albumin: ${alb} g/L → +${Math.round(0.25 * (40 - alb) * 10) / 10} mmol/L</span>
        </div>
      ` : ''}
      <div class="calc-stage-title ${evalClass}">${evalText}</div>
      <div class="calc-advice-box">💡 <strong>Biện luận lâm sàng:</strong> ${cause}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetAnionGap() {
    this.renderActiveTool();
  }

  // ============================================================================
  // 7. HUYẾT ÁP TRUNG BÌNH (MAP), HIỆU ÁP & P/F RATIO (ARDS) - MỚI
  // ============================================================================
  templateToolMapPf() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">❤️‍🩹 Huyết Áp Trung Bình (MAP), Hiệu Áp &amp; Chỉ Số Oxy Hóa (P/F Ratio)</div>
          <div class="calc-subtitle">Đánh giá tưới máu tạng (Sepsis ≥ 65 mmHg), HA kẹp (SXH Dengue ≤ 20 mmHg) &amp; mức độ ARDS (Berlin)</div>
        </div>

        <div class="calc-section-label">1. Huyết động tại giường (MAP &amp; Hiệu áp)</div>
        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">HA Tâm thu — SBP (mmHg):</label>
            <input type="number" id="mpSbp" class="calc-input" value="105" min="40" max="280" oninput="window.clinicalHub.calcMapPf()">
          </div>
          <div class="calc-form-group">
            <label class="calc-label">HA Tâm trương — DBP (mmHg):</label>
            <input type="number" id="mpDbp" class="calc-input" value="65" min="20" max="180" oninput="window.clinicalHub.calcMapPf()">
          </div>
        </div>

        <div class="calc-section-label" style="margin-top: 4px;">2. Khí máu động mạch — P/F Ratio (Tùy chọn)</div>
        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">PaO₂ (mmHg):</label>
            <input type="number" id="mpPao2" class="calc-input" value="" placeholder="VD: 85 (để trống nếu chưa có KMĐM)" min="20" max="600" oninput="window.clinicalHub.calcMapPf()">
          </div>
          <div class="calc-form-group">
            <label class="calc-label">FiO₂ (%):</label>
            <div class="calc-quick-chips" id="mpFio2Chips">
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setFio2(21)">21%</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setFio2(28)">28%</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setFio2(40)">40%</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setFio2(60)">60%</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setFio2(100)">100%</button>
            </div>
            <input type="number" id="mpFio2" class="calc-input" value="21" min="21" max="100" oninput="window.clinicalHub.calcMapPf()">
          </div>
        </div>

        <div class="calc-result-box" id="mpResultBox"></div>
        ${this.renderToolActions('map_pf', 'resetMapPf', 'Sao chép MAP / P/F')}
      </div>
    `;
  }

  setFio2(val) {
    const el = document.getElementById('mpFio2');
    if (el) el.value = val;
    document.querySelectorAll('#mpFio2Chips .calc-chip').forEach(c => {
      c.classList.toggle('active', c.textContent.trim() === `${val}%`);
    });
    this.calcMapPf();
  }

  calcMapPf() {
    const sbp = parseFloat(document.getElementById('mpSbp')?.value) || 0;
    const dbp = parseFloat(document.getElementById('mpDbp')?.value) || 0;
    const pao2Raw = document.getElementById('mpPao2')?.value?.trim();
    const pao2 = pao2Raw ? parseFloat(pao2Raw) : null;
    const fio2 = parseFloat(document.getElementById('mpFio2')?.value) || 21;
    const resBox = document.getElementById('mpResultBox');
    if (!resBox) return;

    if (sbp <= 0 || dbp <= 0 || dbp >= sbp) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập HA tâm thu > HA tâm trương hợp lệ</div>`;
      this.lastResults.map_pf = '';
      return;
    }

    const map = Math.round(((sbp + 2 * dbp) / 3) * 10) / 10;
    const pp = Math.round((sbp - dbp) * 10) / 10;

    let mapCls = 'res-good', mapStatus = 'Tưới máu ổn định (≥ 65 mmHg)';
    if (map < 65) {
      mapCls = 'res-critical';
      mapStatus = '🚨 Tụt MAP (< 65 mmHg) — Nguy cơ giảm tưới máu tạng!';
    } else if (map > 110) {
      mapCls = 'res-moderate';
      mapStatus = '⚠️ Tăng huyết áp rõ (MAP > 110 mmHg)';
    }

    const isNarrowPP = pp <= 20;
    const ppCls = isNarrowPP ? 'res-critical' : (pp <= 25 ? 'res-moderate' : 'res-good');
    const ppLabel = isNarrowPP ? '🚨 HA KẸP (≤ 20 mmHg — Cảnh báo sốc SXH!)' : (pp <= 25 ? '⚠️ Hiệu áp hẹp (≤ 25 mmHg)' : 'Hiệu áp bình thường');

    let pfHtml = '';
    let pfCopy = '';
    let worstCls = isNarrowPP || map < 65 ? 'res-critical' : mapCls;

    if (pao2 !== null && !isNaN(pao2) && pao2 > 0 && fio2 >= 21) {
      const pf = Math.round(pao2 / (fio2 / 100));
      let pfCls = 'res-good', pfStatus = 'Bình thường (> 300)';
      if (pf <= 100) { pfCls = 'res-critical'; pfStatus = 'ARDS Nặng (≤ 100)'; worstCls = 'res-critical'; }
      else if (pf <= 200) { pfCls = 'res-severe'; pfStatus = 'ARDS Trung bình (101–200)'; if (worstCls !== 'res-critical') worstCls = 'res-severe'; }
      else if (pf <= 300) { pfCls = 'res-moderate'; pfStatus = 'ARDS Nhẹ / Giảm oxy hóa (201–300)'; if (worstCls === 'res-good') worstCls = 'res-moderate'; }

      pfCopy = ` | P/F = ${pf} mmHg (PaO2 ${pao2}, FiO2 ${fio2}% — ${pfStatus})`;
      pfHtml = `
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">P/F Ratio</div>
          <div class="calc-metric-val ${pfCls}">${pf}</div>
          <div class="calc-metric-sub">${pfStatus}</div>
        </div>
      `;
    }

    this.setResultSeverity(resBox, worstCls);
    const copyText = `HA ${sbp}/${dbp} mmHg → MAP = ${map} mmHg, Hiệu áp = ${pp} mmHg${isNarrowPP ? ' (HA KẸP)' : ''}${pfCopy}.`;
    this.lastResults.map_pf = copyText;

    resBox.innerHTML = `
      <div class="calc-metrics-grid">
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">MAP (HA Trung bình)</div>
          <div class="calc-metric-val ${mapCls}">${map} <small>mmHg</small></div>
          <div class="calc-metric-sub">${mapStatus}</div>
        </div>
        <div class="calc-metric-card">
          <div class="calc-metric-lbl">Hiệu áp (SBP − DBP)</div>
          <div class="calc-metric-val ${ppCls}">${pp} <small>mmHg</small></div>
          <div class="calc-metric-sub">${ppLabel}</div>
        </div>
        ${pfHtml}
      </div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetMapPf() {
    this.renderActiveTool();
  }

  // ============================================================================
  // 8. % CÔ ĐẶC MÁU SXH DENGUE (ΔHct)
  // ============================================================================
  templateToolHct() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🩸 % Cô Đặc Máu SXH Dengue (ΔHct)</div>
          <div class="calc-subtitle">Đánh giá mức độ thoát huyết tương theo Hướng dẫn Bộ Y tế — tự lấy Hct gần nhất nếu đã gắn NB</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Hct hiện tại (%):</label>
            <input type="number" id="hctCurrent" class="calc-input" value="44" min="15" max="75" step="0.5" oninput="window.clinicalHub.calcHct()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Hct nền (%):</label>
            <div class="calc-quick-chips" id="hctBaseChips">
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setHctBaseline(42, 'Nam')">Nam (42%)</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setHctBaseline(38, 'Nữ')">Nữ (38%)</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setHctBaseline(35, 'Trẻ')">Trẻ (35%)</button>
            </div>
            <input type="number" id="hctBaseline" class="calc-input" value="42" min="15" max="60" step="0.5" oninput="window.clinicalHub.calcHct()">
          </div>
        </div>

        <div class="calc-result-box" id="hctResultBox"></div>
        ${this.renderToolActions('hct', 'resetHct', 'Sao chép ΔHct')}
      </div>
    `;
  }

  setHctBaseline(val, label) {
    const input = document.getElementById('hctBaseline');
    if (input) {
      input.value = val;
      document.querySelectorAll('#hctBaseChips .calc-chip').forEach(c => {
        c.classList.toggle('active', c.textContent.includes(label));
      });
      this.calcHct();
    }
  }

  calcHct() {
    const cur = parseFloat(document.getElementById('hctCurrent')?.value) || 0;
    const base = parseFloat(document.getElementById('hctBaseline')?.value) || 0;
    const resBox = document.getElementById('hctResultBox');
    if (!resBox) return;

    if (cur <= 0 || base <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập giá trị Hct hiện tại và Hct nền</div>`;
      this.lastResults.hct = '';
      return;
    }

    const deltaPercent = Math.round(((cur - base) / base) * 100 * 10) / 10;
    const thresh10 = Math.round(base * 1.1 * 10) / 10;
    const thresh20 = Math.round(base * 1.2 * 10) / 10;

    let statusText = '', statusClass = '', advice = '';
    if (deltaPercent >= 20) {
      statusText = '🚨 CÔ ĐẶC MÁU NẶNG — DẤU HIỆU CẢNH BÁO (TĂNG ≥ 20%)';
      statusClass = 'res-critical';
      advice = 'Thoát huyết tương rõ rệt! Theo dõi sinh hiệu mỗi 1–2 giờ, đánh giá chỉ định bù dịch điện giải tĩnh mạch theo phác đồ Bộ Y tế.';
    } else if (deltaPercent >= 10) {
      statusText = '⚠️ CÓ CÔ ĐẶC MÁU NHẸ (10% – 19.9%)';
      statusClass = 'res-moderate';
      advice = 'Bắt đầu có thoát dịch. Khuyến khích uống nhiều Oresol, kiểm tra lại CTM + Hct sau 4–6 giờ.';
    } else if (deltaPercent > 0) {
      statusText = '🟢 CHƯA CÔ ĐẶC MÁU ĐÁNG KỂ (< 10%)';
      statusClass = 'res-good';
      advice = 'Hct trong giới hạn an toàn so với mốc nền. Tiếp tục theo dõi diễn tiến lâm sàng.';
    } else {
      statusText = '📉 Hct THẤP HƠN HOẶC BẰNG NỀN';
      statusClass = 'res-mild';
      advice = 'Không cô đặc máu. Nếu Hct tụt nhanh kèm mạch nhanh/tiểu cầu thấp, cảnh giác xuất huyết ẩn (xuất huyết tiêu hóa, xuất huyết nội)!';
    }

    this.setResultSeverity(resBox, statusClass);
    const sign = deltaPercent > 0 ? '+' : '';
    const copyText = `ΔHct SXH Dengue = ${sign}${deltaPercent}% (Hct hiện tại ${cur}% / nền ${base}%) — ${this.stripLeadingEmoji(statusText)}.`;
    this.lastResults.hct = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${statusClass}">
        <span class="calc-result-val">${sign}${deltaPercent}</span>
        <span class="calc-result-unit">%</span>
      </div>
      <div class="calc-result-details">
        <span class="calc-badge-res">Mốc +10%: ${thresh10}%</span>
        <span class="calc-badge-res">Mốc cảnh báo +20%: ${thresh20}%</span>
      </div>
      <div class="calc-stage-title ${statusClass}">${statusText}</div>
      <div class="calc-advice-box">💡 <strong>Xử trí lâm sàng:</strong> ${advice}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetHct() {
    this.renderActiveTool();
  }

  // ============================================================================
  // 9. BÙ DỊCH SXH DENGUE THEO CÂN NẶNG (BỘ Y TẾ) - MỚI
  // ============================================================================
  templateToolDengueFluid() {
    const scen = this.state.dengueFluidScenario;
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">💦 Tính Dịch Truyền SXH Dengue Theo Cân Nặng (Phác Đồ BYT)</div>
          <div class="calc-subtitle">Tính nhanh ml/giờ &amp; giọt/phút (dây 20) cho từng bậc truyền dịch — dùng cân nặng hiệu chỉnh nếu thừa cân</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Cân nặng tính dịch (kg):</label>
            <div class="calc-quick-chips" id="dfWeightChips">
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDfWeight(45)">45 kg</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDfWeight(50)">50 kg</button>
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setDfWeight(60)">60 kg</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDfWeight(70)">70 kg</button>
            </div>
            <input type="number" id="dfWeight" class="calc-input" value="60" min="5" max="150" oninput="window.clinicalHub.calcDengueFluid()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Tình huống lâm sàng:</label>
            <select id="dfScenario" class="calc-select" onchange="window.clinicalHub.setDfScenario(this.value)">
              <option value="warning" ${scen === 'warning' ? 'selected' : ''}>🚨 SXH có dấu hiệu cảnh báo (6→5→3→1.5 ml/kg/h)</option>
              <option value="shock" ${scen === 'shock' ? 'selected' : ''}>☠️ Sốc SXH còn bù (15–20→10→7.5→5→3→1.5 ml/kg/h)</option>
              <option value="maint" ${scen === 'maint' ? 'selected' : ''}>💧 Dịch duy trì Holliday-Segar (M &amp; M+5%)</option>
            </select>
          </div>
        </div>

        <div class="calc-result-box" id="dfResultBox"></div>
        ${this.renderToolActions('dengue_fluid', 'resetDengueFluid', 'Sao chép Lộ trình dịch')}
      </div>
    `;
  }

  setDfWeight(w) {
    const el = document.getElementById('dfWeight');
    if (el) el.value = w;
    document.querySelectorAll('#dfWeightChips .calc-chip').forEach(c => {
      c.classList.toggle('active', c.textContent.trim() === `${w} kg`);
    });
    this.calcDengueFluid();
  }

  setDfScenario(scen) {
    this.state.dengueFluidScenario = scen;
    const sel = document.getElementById('dfScenario');
    if (sel) sel.value = scen;
    this.calcDengueFluid();
  }

  calcDengueFluid() {
    const w = parseFloat(document.getElementById('dfWeight')?.value) || 0;
    const scen = this.state.dengueFluidScenario || document.getElementById('dfScenario')?.value || 'warning';
    const resBox = document.getElementById('dfResultBox');
    if (!resBox) return;

    if (w <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập cân nặng hợp lệ (kg)</div>`;
      this.lastResults.dengue_fluid = '';
      return;
    }

    const toRow = (label, ratePerKg, duration) => {
      const mlH = Math.round(w * ratePerKg);
      const drops = Math.round((mlH * 20) / 60);
      return { label, ratePerKg, duration, mlH, drops };
    };

    if (scen === 'warning') {
      const steps = [
        toRow('Khởi đầu (1–2h)', 6, '1 – 2 giờ'),
        toRow('Giảm liều 1', 5, '2 – 4 giờ'),
        toRow('Giảm liều 2', 3, '2 – 4 giờ'),
        toRow('Duy trì / Ngưng', 1.5, 'Đến 24–48h')
      ];
      this.setResultSeverity(resBox, 'res-moderate');
      const copyText = `Bù dịch SXH Dengue có dấu hiệu cảnh báo (${w}kg, Ringer Lactate / NaCl 0.9%): Khởi đầu 6 ml/kg/h = ${steps[0].mlH} ml/h (${steps[0].drops} g/p) × 1–2h → giảm dần 5 ml/kg/h (${steps[1].mlH} ml/h) → 3 ml/kg/h (${steps[2].mlH} ml/h) → 1.5 ml/kg/h (${steps[3].mlH} ml/h).`;
      this.lastResults.dengue_fluid = copyText;

      resBox.innerHTML = `
        <div class="calc-stage-title res-moderate">🚨 Lộ trình SXH Dengue có dấu hiệu cảnh báo (${w} kg)</div>
        <table class="calc-mini-table">
          <thead><tr><th>Giai đoạn</th><th>Liều</th><th>Tốc độ (ml/h)</th><th>Giọt/phút (dây 20)</th></tr></thead>
          <tbody>
            ${steps.map(s => `
              <tr>
                <td><strong>${s.label}</strong><div class="calc-mini-sub">${s.duration}</div></td>
                <td>${s.ratePerKg} ml/kg/h</td>
                <td><strong>${s.mlH}</strong> ml/h</td>
                <td><strong>${s.drops}</strong> g/p</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="calc-advice-box">💡 Kiểm tra lại Hct và lâm sàng sau mỗi 2–4h để giảm tốc độ kịp thời. Tổng thời gian truyền thường không quá 24–48 giờ.</div>
        ${this.renderCopyPreview(copyText)}
      `;
    } else if (scen === 'shock') {
      const steps = [
        toRow('Chống sốc giờ đầu (15)', 15, '1 giờ (hoặc 20 ml/kg/h)'),
        toRow('Nếu cải thiện — Bậc 1', 10, '1 – 2 giờ'),
        toRow('Bậc 2', 7.5, '1 – 2 giờ'),
        toRow('Bậc 3', 5, '4 – 5 giờ'),
        toRow('Bậc 4', 3, '4 – 6 giờ'),
        toRow('Duy trì', 1.5, 'Đến 24–48h')
      ];
      const ml20 = Math.round(w * 20);
      const drops20 = Math.round((ml20 * 20) / 60);
      this.setResultSeverity(resBox, 'res-critical');
      const copyText = `Chống sốc SXH Dengue (${w}kg, Ringer Lactate): Giờ đầu 15–20 ml/kg/h = ${steps[0].mlH}–${ml20} ml/h (${steps[0].drops}–${drops20} g/p) → đánh giá lại sau 1h; nếu cải thiện giảm 10 (${steps[1].mlH} ml/h) → 7.5 (${steps[2].mlH} ml/h) → 5 (${steps[3].mlH} ml/h) → 3 (${steps[4].mlH} ml/h) → 1.5 ml/kg/h.`;
      this.lastResults.dengue_fluid = copyText;

      resBox.innerHTML = `
        <div class="calc-stage-title res-critical">☠️ Phác đồ chống sốc SXH Dengue còn bù (${w} kg)</div>
        <table class="calc-mini-table">
          <thead><tr><th>Giai đoạn</th><th>Liều</th><th>Tốc độ (ml/h)</th><th>Giọt/phút (dây 20)</th></tr></thead>
          <tbody>
            ${steps.map((s, idx) => `
              <tr>
                <td><strong>${s.label}</strong><div class="calc-mini-sub">${s.duration}</div></td>
                <td>${idx === 0 ? '15–20' : s.ratePerKg} ml/kg/h</td>
                <td><strong>${idx === 0 ? `${s.mlH}–${ml20}` : s.mlH}</strong> ml/h</td>
                <td><strong>${idx === 0 ? `${s.drops}–${drops20}` : s.drops}</strong> g/p</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="calc-advice-box">🚨 Nếu sau 1 giờ sốc không cải thiện và Hct còn cao/tăng: chuyển dung dịch <strong>Cao phân tử (HES 6% 200/0.5 hoặc Dextran 40)</strong> 10–20 ml/kg/h. Nếu Hct tụt nhanh: nghĩ xuất huyết nặng → truyền máu!</div>
        ${this.renderCopyPreview(copyText)}
      `;
    } else {
      // Holliday-Segar (M)
      let maint24 = 0;
      if (w <= 10) maint24 = w * 100;
      else if (w <= 20) maint24 = 1000 + (w - 10) * 50;
      else maint24 = 1500 + (w - 20) * 20;
      const maintPerH = Math.round(maint24 / 24);
      const maintDrops = Math.round((maintPerH * 20) / 60);
      const deficit5 = Math.round(Math.min(w, 50) * 50); // M + 5% (giới hạn 5% tại 50kg cho người lớn)
      const total48 = Math.round(maint24 * 2 + deficit5);
      const m5PerH = Math.round(total48 / 48);

      this.setResultSeverity(resBox, 'res-mild');
      const copyText = `Dịch duy trì Holliday-Segar (${w}kg): M = ${maint24} ml/24h (${maintPerH} ml/h ≈ ${maintDrops} g/p). Tổng trần M + 5% thiếu dịch / 48h ≈ ${total48} ml (~${m5PerH} ml/h).`;
      this.lastResults.dengue_fluid = copyText;

      resBox.innerHTML = `
        <div class="calc-metrics-grid">
          <div class="calc-metric-card">
            <div class="calc-metric-lbl">Duy trì M / 24 giờ</div>
            <div class="calc-metric-val res-mild">${maint24} <small>ml</small></div>
            <div class="calc-metric-sub">${maintPerH} ml/h (~${maintDrops} g/p)</div>
          </div>
          <div class="calc-metric-card">
            <div class="calc-metric-lbl">Trần M + 5% (48 giờ)</div>
            <div class="calc-metric-val res-good">${total48} <small>ml</small></div>
            <div class="calc-metric-sub">Trung bình ~${m5PerH} ml/h</div>
          </div>
        </div>
        <div class="calc-advice-box">💡 Tổng dịch truyền + uống trong 48h giai đoạn nguy hiểm thường không vượt quá ngưỡng M + 5% để phòng ngừa quá tải dịch / phù phổi cấp khi tái hấp thu.</div>
        ${this.renderCopyPreview(copyText)}
      `;
    }
  }

  resetDengueFluid() {
    this.state.dengueFluidScenario = 'warning';
    this.renderActiveTool();
  }

  // ============================================================================
  // 10. PHÂN TẦNG SXH DENGUE (BỘ Y TẾ)
  // ============================================================================
  templateToolDengueClassify() {
    const warnings = [
      { id: 'dw_belly', text: 'Đau bụng nhiều và liên tục hoặc tăng cảm giác đau vùng gan' },
      { id: 'dw_vomit', text: 'Nôn ói liên tục (≥ 3 lần/1h hoặc ≥ 4 lần/6h)' },
      { id: 'dw_bleed', text: 'Xuất huyết niêm mạc (chảy máu chân răng, mũi, nôn máu, tiểu máu, rong kinh)' },
      { id: 'dw_fluid', text: 'Ứ dịch lâm sàng (tràn dịch màng phổi, màng bụng qua khám / siêu âm)' },
      { id: 'dw_liver', text: 'Gan to > 2 cm dưới bờ sườn' },
      { id: 'dw_hct_tc', text: 'Hct tăng cao kèm số lượng tiểu cầu giảm nhanh chóng' },
      { id: 'dw_lethargy', text: 'Li bì, bứt rứt, vật vã hoặc tiểu ít' }
    ];
    const severes = [
      { id: 'ds_shock', title: 'Sốc SXH Dengue', desc: 'Mạch nhanh nhỏ, HA tụt hoặc HA kẹp ≤ 20 mmHg, chi lạnh ẩm' },
      { id: 'ds_bleed', title: 'Xuất huyết nặng', desc: 'Xuất huyết tiêu hóa ồ ạt, xuất huyết não, cần truyền máu' },
      { id: 'ds_organ', title: 'Tổn thương tạng nặng', desc: 'AST/ALT ≥ 1000 U/L, Suy thận cấp, Rối loạn ý thức, Viêm cơ tim' }
    ];

    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🦟 Phân Tầng SXH Dengue Theo Hướng Dẫn Bộ Y Tế</div>
          <div class="calc-subtitle">Tích nhanh dấu hiệu cảnh báo &amp; tiêu chuẩn Dengue nặng để phân loại và định hướng xử trí</div>
        </div>

        <div class="calc-section-label text-warn">⚠️ DẤU HIỆU CẢNH BÁO (Tích chọn nếu có):</div>
        <div class="calc-checklist">
          ${warnings.map(w => `
            <label class="calc-check-item">
              <input type="checkbox" id="${w.id}" onchange="window.clinicalHub.calcDengueClassify()">
              <div class="calc-check-content">
                <span class="calc-check-title">${w.text}</span>
              </div>
            </label>
          `).join('')}
        </div>

        <div class="calc-section-label text-danger" style="margin-top: 6px;">☠️ TIÊU CHUẨN SXH DENGUE NẶNG (Tích chọn nếu có):</div>
        <div class="calc-checklist">
          ${severes.map(s => `
            <label class="calc-check-item check-danger">
              <input type="checkbox" id="${s.id}" onchange="window.clinicalHub.calcDengueClassify()">
              <div class="calc-check-content">
                <span class="calc-check-title"><strong>${s.title}</strong></span>
                <span class="calc-check-desc">${s.desc}</span>
              </div>
            </label>
          `).join('')}
        </div>

        <div class="calc-result-box" id="dengueResultBox"></div>
        ${this.renderToolActions('dengue_classify', 'resetDengueClassify', 'Sao chép Phân tầng')}
      </div>
    `;
  }

  calcDengueClassify() {
    const warningMap = [
      ['dw_belly', 'đau bụng/vùng gan'],
      ['dw_vomit', 'nôn nhiều'],
      ['dw_bleed', 'xuất huyết niêm mạc'],
      ['dw_fluid', 'ứ dịch lâm sàng'],
      ['dw_liver', 'gan to >2cm'],
      ['dw_hct_tc', 'Hct tăng/TC giảm nhanh'],
      ['dw_lethargy', 'li bì/vật vã/tiểu ít']
    ];
    const severeMap = [
      ['ds_shock', 'Sốc SXH Dengue'],
      ['ds_bleed', 'Xuất huyết nặng'],
      ['ds_organ', 'Tổn thương tạng nặng']
    ];

    const warnings = [];
    warningMap.forEach(([id, label]) => {
      const el = document.getElementById(id);
      if (el?.checked) warnings.push(label);
      el?.closest('.calc-check-item')?.classList.toggle('active', !!el?.checked);
    });

    const severes = [];
    severeMap.forEach(([id, label]) => {
      const el = document.getElementById(id);
      if (el?.checked) severes.push(label);
      el?.closest('.calc-check-item')?.classList.toggle('active', !!el?.checked);
    });

    const resBox = document.getElementById('dengueResultBox');
    if (!resBox) return;

    let stage = '', stageClass = '', advice = '', detail = '';
    if (severes.length > 0) {
      stage = '☠️ SXH DENGUE NẶNG (SEVERE DENGUE)';
      stageClass = 'res-critical';
      detail = `Tiêu chuẩn nặng: ${severes.join(', ')}${warnings.length ? `; kèm cảnh báo: ${warnings.join(', ')}` : ''}`;
      advice = 'Báo động đỏ! Chuyển phòng Cấp cứu / ICU, thiết lập 2 đường truyền TM lớn, chống sốc theo phác đồ BYT, theo dõi sinh hiệu mỗi 15–30 phút.';
    } else if (warnings.length > 0) {
      stage = `🚨 SXH DENGUE CÓ DẤU HIỆU CẢNH BÁO (${warnings.length} dấu hiệu)`;
      stageClass = 'res-moderate';
      detail = `Dấu hiệu cảnh báo: ${warnings.join(', ')}`;
      advice = 'Chỉ định nhập viện nội trú. Xét nghiệm Hct, Tiểu cầu mỗi 4–6 giờ. Truyền dịch TM nếu không uống được hoặc Hct tăng nhanh.';
    } else {
      stage = '🟢 SXH DENGUE KHÔNG CÓ DẤU HIỆU CẢNH BÁO';
      stageClass = 'res-good';
      detail = 'Chưa ghi nhận dấu hiệu cảnh báo';
      advice = 'Theo dõi ngoại trú / tái khám mỗi ngày nếu đảm bảo điều kiện. Uống nhiều Oresol, hạ sốt Paracetamol đơn thuần, dặn dò dấu hiệu cảnh báo.';
    }

    this.setResultSeverity(resBox, stageClass);
    const copyText = `Phân tầng SXH Dengue (BYT): ${this.stripLeadingEmoji(stage)} (${detail}).`;
    this.lastResults.dengue_classify = copyText;

    resBox.innerHTML = `
      <div class="calc-stage-title ${stageClass}" style="font-size: 15.5px;">${stage}</div>
      <div class="calc-advice-box">💡 <strong>Hướng xử trí (BYT):</strong> ${advice}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetDengueClassify() {
    this.renderActiveTool();
  }

  // ============================================================================
  // 11. THANG ĐIỂM CẢNH BÁO SỚM NEWS2 - MỚI
  // ============================================================================
  templateToolNews2() {
    if (typeof this.state.news2?.rr !== 'string') {
      this.state.news2 = { rr: 'rr0', spo2Scale: 1, spo2: 's0', o2: 'o0', sbp: 'bp0', hr: 'hr0', avpu: 'a0', temp: 't0' };
    }
    const st = this.state.news2;
    const renderRow = (key, label, options) => `
      <div class="calc-seg-row">
        <div class="calc-seg-label">${label}</div>
        <div class="calc-seg-pills">
          ${options.map(opt => {
            const isActive = st[key] === opt.id;
            const ptCls = opt.pts >= 3 ? 'pt-3' : opt.pts === 2 ? 'pt-2' : opt.pts === 1 ? 'pt-1' : 'pt-0';
            return `
              <button type="button" class="calc-pill-btn ${isActive ? 'active' : ''} ${ptCls}"
                onclick="window.clinicalHub.setNews2('${key}', '${opt.id}')">
                <span>${opt.label}</span>
                <small>+${opt.pts}</small>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const spo2Opts = st.spo2Scale === 1
      ? [
          { id: 's3', label: '≤ 91%', pts: 3 },
          { id: 's2', label: '92–93%', pts: 2 },
          { id: 's1', label: '94–95%', pts: 1 },
          { id: 's0', label: '≥ 96%', pts: 0 }
        ]
      : [
          { id: 's3l', label: '≤ 83%', pts: 3 },
          { id: 's2l', label: '84–85%', pts: 2 },
          { id: 's1l', label: '86–87%', pts: 1 },
          { id: 's0', label: '88–92% / ≥93% KT', pts: 0 },
          { id: 's1h', label: '93–94% (O₂)', pts: 1 },
          { id: 's2h', label: '95–96% (O₂)', pts: 2 },
          { id: 's3h', label: '≥ 97% (O₂)', pts: 3 }
        ];

    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🚨 Thang Điểm Cảnh Báo Sớm NEWS2 (Đi Buồng Nội Trú)</div>
          <div class="calc-subtitle">Phát hiện sớm bệnh nhân diễn tiến nặng dựa trên 7 dấu hiệu sinh tồn chuẩn Royal College of Physicians</div>
        </div>

        <div class="calc-seg-stack">
          ${renderRow('rr', 'Nhịp thở (l/phút)', [
            { id: 'rr3l', label: '≤ 8', pts: 3 },
            { id: 'rr1', label: '9–11', pts: 1 },
            { id: 'rr0', label: '12–20', pts: 0 },
            { id: 'rr2', label: '21–24', pts: 2 },
            { id: 'rr3h', label: '≥ 25', pts: 3 }
          ])}

          <div class="calc-seg-row">
            <div class="calc-seg-label" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span>SpO₂ (%)</span>
              <span class="calc-inline-toggle">
                <button type="button" class="calc-mini-btn ${st.spo2Scale === 1 ? 'active' : ''}" onclick="window.clinicalHub.setNews2Scale(1)">Thang 1 (Thường)</button>
                <button type="button" class="calc-mini-btn ${st.spo2Scale === 2 ? 'active' : ''}" onclick="window.clinicalHub.setNews2Scale(2)">Thang 2 (COPD/Tăng CO₂)</button>
              </span>
            </div>
            <div class="calc-seg-pills">
              ${spo2Opts.map(opt => {
                const isActive = st.spo2 === opt.id;
                const ptCls = opt.pts >= 3 ? 'pt-3' : opt.pts === 2 ? 'pt-2' : opt.pts === 1 ? 'pt-1' : 'pt-0';
                return `
                  <button type="button" class="calc-pill-btn ${isActive ? 'active' : ''} ${ptCls}"
                    onclick="window.clinicalHub.setNews2('spo2', '${opt.id}')">
                    <span>${opt.label}</span><small>+${opt.pts}</small>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          ${renderRow('o2', 'Hỗ trợ Oxy', [
            { id: 'o0', label: 'Khí trời (Air)', pts: 0 },
            { id: 'o2', label: 'Có thở Oxy', pts: 2 }
          ])}

          ${renderRow('sbp', 'HA Tâm thu (mmHg)', [
            { id: 'bp3l', label: '≤ 90', pts: 3 },
            { id: 'bp2', label: '91–100', pts: 2 },
            { id: 'bp1', label: '101–110', pts: 1 },
            { id: 'bp0', label: '111–219', pts: 0 },
            { id: 'bp3h', label: '≥ 220', pts: 3 }
          ])}

          ${renderRow('hr', 'Mạch (l/phút)', [
            { id: 'hr3l', label: '≤ 40', pts: 3 },
            { id: 'hr1l', label: '41–50', pts: 1 },
            { id: 'hr0', label: '51–90', pts: 0 },
            { id: 'hr1h', label: '91–110', pts: 1 },
            { id: 'hr2', label: '111–130', pts: 2 },
            { id: 'hr3h', label: '≥ 131', pts: 3 }
          ])}

          ${renderRow('avpu', 'Tri giác (ACVPU)', [
            { id: 'a0', label: 'A — Tỉnh táo', pts: 0 },
            { id: 'a3', label: 'C/V/P/U — Lú lẫn mới / Li bì / Hôn mê', pts: 3 }
          ])}

          ${renderRow('temp', 'Nhiệt độ (°C)', [
            { id: 't3', label: '≤ 35.0', pts: 3 },
            { id: 't1l', label: '35.1–36.0', pts: 1 },
            { id: 't0', label: '36.1–38.0', pts: 0 },
            { id: 't1h', label: '38.1–39.0', pts: 1 },
            { id: 't2', label: '≥ 39.1', pts: 2 }
          ])}
        </div>

        <div class="calc-result-box" id="news2ResultBox"></div>
        ${this.renderToolActions('news2', 'resetNews2', 'Sao chép NEWS2')}
      </div>
    `;
  }

  setNews2(key, id) {
    this.state.news2[key] = id;
    this.renderActiveTool();
  }

  setNews2Scale(scale) {
    this.state.news2.spo2Scale = scale;
    this.state.news2.spo2 = 's0';
    this.renderActiveTool();
  }

  calcNews2() {
    const ptMap = {
      rr3l: 3, rr1: 1, rr0: 0, rr2: 2, rr3h: 3,
      s3: 3, s2: 2, s1: 1, s0: 0, s3l: 3, s2l: 2, s1l: 1, s1h: 1, s2h: 2, s3h: 3,
      o0: 0, o2: 2,
      bp3l: 3, bp2: 2, bp1: 1, bp0: 0, bp3h: 3,
      hr3l: 3, hr1l: 1, hr0: 0, hr1h: 1, hr2: 2, hr3h: 3,
      a0: 0, a3: 3,
      t3: 3, t1l: 1, t0: 0, t1h: 1, t2: 2
    };
    const st = this.state.news2;
    const pts = [st.rr, st.spo2, st.o2, st.sbp, st.hr, st.avpu, st.temp].map(k => ptMap[k] ?? 0);
    const total = pts.reduce((a, b) => a + b, 0);
    const hasSingle3 = pts.some(p => p >= 3);

    const resBox = document.getElementById('news2ResultBox');
    if (!resBox) return;

    let risk = '', cls = '', monitor = '', advice = '';
    if (total >= 7) {
      risk = '🚨 NGUY CƠ CAO — BÁO ĐỘNG ĐỎ (≥ 7 ĐIỂM)';
      cls = 'res-critical';
      monitor = 'Theo dõi sinh hiệu liên tục (Monitor)';
      advice = 'Đánh giá cấp cứu ngay bởi bác sĩ trực chính / ekip Hồi sức tích cực (ICU). Cân nhắc chuyển ICU!';
    } else if (total >= 5) {
      risk = '🟠 NGUY CƠ TRUNG BÌNH (5 – 6 ĐIỂM)';
      cls = 'res-severe';
      monitor = 'Theo dõi sinh hiệu tối thiểu mỗi 1 giờ';
      advice = 'Bác sĩ trực thăm khám khẩn trong vòng 30 phút, đánh giá nguy cơ Sepsis/suy hô hấp và xem xét chuyển phòng nặng.';
    } else if (hasSingle3) {
      risk = '⚠️ NGUY CƠ THẤP–TRUNG BÌNH (CÓ 1 THÔNG SỐ = 3 ĐIỂM)';
      cls = 'res-moderate';
      monitor = 'Theo dõi tối thiểu mỗi 1 giờ';
      advice = 'Dù tổng điểm thấp nhưng có 1 chỉ số cực đoan (+3đ). Bác sĩ trực cần khám đánh giá nguyên nhân và quyết định tăng tần suất theo dõi.';
    } else if (total >= 1) {
      risk = '🟢 NGUY CƠ THẤP (1 – 4 ĐIỂM)';
      cls = 'res-mild';
      monitor = 'Theo dõi mỗi 4 – 6 giờ';
      advice = 'Điều dưỡng đánh giá lại và thông báo bác sĩ nếu diễn tiến tăng điểm.';
    } else {
      risk = '🟢 NGUY CƠ THẤP — ỔN ĐỊNH (0 ĐIỂM)';
      cls = 'res-good';
      monitor = 'Theo dõi thường quy mỗi 12 giờ';
      advice = 'Các dấu hiệu sinh tồn trong giới hạn bình thường.';
    }

    this.setResultSeverity(resBox, cls);
    const copyText = `NEWS2 = ${total} điểm${hasSingle3 && total < 5 ? ' (có 1 thông số 3đ)' : ''} — ${this.stripLeadingEmoji(risk)}. Tần suất TD: ${monitor}.`;
    this.lastResults.news2 = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${cls}">
        <span class="calc-result-val">${total}</span>
        <span class="calc-result-unit">/ 20 điểm</span>
      </div>
      <div class="calc-result-details">
        <span class="calc-badge-res">⏱️ ${monitor}</span>
        ${hasSingle3 ? `<span class="calc-badge-res" style="color:#dc2626;border-color:#fca5a5;">⚠️ Có thông số đạt 3đ</span>` : ''}
      </div>
      <div class="calc-stage-title ${cls}">${risk}</div>
      <div class="calc-advice-box">💡 <strong>Đáp ứng lâm sàng:</strong> ${advice}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetNews2() {
    this.state.news2 = { rr: 'rr0', spo2Scale: 1, spo2: 's0', o2: 'o0', sbp: 'bp0', hr: 'hr0', avpu: 'a0', temp: 't0' };
    this.renderActiveTool();
  }

  // ============================================================================
  // 12. THANG ĐIỂM CURB-65 / CRB-65 (VIÊM PHỔI)
  // ============================================================================
  templateToolCurb65() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🫁 Thang Điểm CURB-65 / CRB-65 (Viêm Phổi Cộng Đồng)</div>
          <div class="calc-subtitle">Đánh giá độ nặng &amp; chỉ định nhập viện — tự tích Tuổi ≥ 65 nếu đã liên kết NB</div>
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item">
            <input type="checkbox" id="curb_c" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>C</strong> — Confusion (Lú lẫn mới xuất hiện, suy giảm tri giác)</span>
              <span class="calc-check-desc">Mất định hướng không gian, thời gian hoặc bản thân</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="curb_u" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>U</strong> — Urea máu &gt; 7 mmol/L (hoặc BUN &gt; 19 mg/dL)</span>
              <span class="calc-check-desc">Nếu chưa có xét nghiệm Ure máu, tham khảo điểm CRB-65 bên dưới</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="curb_r" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>R</strong> — Nhịp thở (Respiratory rate) ≥ 30 lần/phút</span>
              <span class="calc-check-desc">Thở nhanh, khó thở rõ</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="curb_b" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>B</strong> — Huyết áp tụt (Blood pressure)</span>
              <span class="calc-check-desc">Huyết áp tâm thu &lt; 90 mmHg HOẶC tâm trương ≤ 60 mmHg</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="curb_65" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>65</strong> — Tuổi ≥ 65</span>
              <span class="calc-check-desc">Người cao tuổi nguy cơ diễn tiến nặng cao</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>
        </div>

        <div class="calc-result-box" id="curbResultBox"></div>
        ${this.renderToolActions('curb65', 'resetCurb65', 'Sao chép CURB-65')}
      </div>
    `;
  }

  calcCurb65() {
    let score = 0;
    let crbScore = 0;
    const criteria = [];

    if (document.getElementById('curb_c')?.checked) { score++; crbScore++; criteria.push('Lú lẫn'); }
    if (document.getElementById('curb_u')?.checked) { score++; criteria.push('Ure >7'); }
    if (document.getElementById('curb_r')?.checked) { score++; crbScore++; criteria.push('Thở ≥30'); }
    if (document.getElementById('curb_b')?.checked) { score++; crbScore++; criteria.push('HA <90/60'); }
    if (document.getElementById('curb_65')?.checked) { score++; crbScore++; criteria.push('Tuổi ≥65'); }

    ['curb_c', 'curb_u', 'curb_r', 'curb_b', 'curb_65'].forEach(id => {
      const el = document.getElementById(id);
      el?.closest('.calc-check-item')?.classList.toggle('active', !!el?.checked);
    });

    const resBox = document.getElementById('curbResultBox');
    if (!resBox) return;

    let group = '', groupClass = '', recommendation = '', mortality = '';
    if (score <= 1) {
      group = 'Nhóm 1: Viêm phổi mức độ nhẹ';
      groupClass = 'res-good';
      mortality = '1.5% – 3%';
      recommendation = 'Xem xét điều trị ngoại trú nếu không có bệnh nền nặng hoặc giảm SpO₂.';
    } else if (score === 2) {
      group = 'Nhóm 2: Viêm phổi mức độ trung bình';
      groupClass = 'res-moderate';
      mortality = '~ 9%';
      recommendation = 'Chỉ định nhập viện điều trị nội trú tại Khoa Nhiễm / Hô hấp.';
    } else {
      group = 'Nhóm 3: Viêm phổi mức độ nặng';
      groupClass = 'res-critical';
      mortality = '15% – 40%';
      recommendation = '🚨 Nguy cơ tử vong cao! Nhập viện khẩn cấp, cân nhắc hội chẩn Hồi sức tích cực (ICU) đặc biệt khi ≥ 4 điểm.';
    }

    this.setResultSeverity(resBox, groupClass);
    const critText = criteria.length > 0 ? ` (${criteria.join(', ')})` : '';
    const copyText = `CURB-65 = ${score}/5 điểm [CRB-65 = ${crbScore}/4]${critText} — ${group}, tử vong ~${mortality}.`;
    this.lastResults.curb65 = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${groupClass}">
        <span class="calc-result-val">${score}</span>
        <span class="calc-result-unit">/ 5 điểm</span>
      </div>
      <div class="calc-result-details">
        <span class="calc-badge-res">CRB-65 (không Ure): ${crbScore}/4</span>
        <span class="calc-badge-res">Tử vong 30 ngày: ${mortality}</span>
      </div>
      <div class="calc-stage-title ${groupClass}">${group}</div>
      <div class="calc-advice-box">💡 <strong>Chỉ định xử trí:</strong> ${recommendation}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetCurb65() {
    ['curb_c', 'curb_u', 'curb_r', 'curb_b', 'curb_65'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    this.calcCurb65();
  }

  // ============================================================================
  // 13. THANG ĐIỂM qSOFA (SEPSIS)
  // ============================================================================
  templateToolQsofa() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🦠 Thang Điểm qSOFA (Quick SOFA — Tầm Soát Sepsis)</div>
          <div class="calc-subtitle">Sàng lọc nhanh nguy cơ nhiễm khuẩn huyết diễn tiến xấu tại buồng bệnh (Sepsis-3)</div>
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item">
            <input type="checkbox" id="qsofa_rr" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Nhịp thở ≥ 22 lần/phút</span>
              <span class="calc-check-desc">Thở nhanh bù trừ toan chuyển hóa hoặc tổn thương phổi</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="qsofa_gcs" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Rối loạn tri giác (Glasgow &lt; 15)</span>
              <span class="calc-check-desc">Lú lẫn, li bì, bứt rứt hoặc chậm chạp mới xuất hiện</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item">
            <input type="checkbox" id="qsofa_sbp" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Huyết áp tâm thu ≤ 100 mmHg</span>
              <span class="calc-check-desc">Hạ huyết áp do giãn mạch nhiễm độc hoặc giảm thể tích</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>
        </div>

        <div class="calc-result-box" id="qsofaResultBox"></div>
        ${this.renderToolActions('qsofa', 'resetQsofa', 'Sao chép qSOFA')}
      </div>
    `;
  }

  calcQsofa() {
    let score = 0;
    const criteria = [];

    if (document.getElementById('qsofa_rr')?.checked) { score++; criteria.push('Thở ≥22'); }
    if (document.getElementById('qsofa_gcs')?.checked) { score++; criteria.push('GCS <15'); }
    if (document.getElementById('qsofa_sbp')?.checked) { score++; criteria.push('SBP ≤100'); }

    ['qsofa_rr', 'qsofa_gcs', 'qsofa_sbp'].forEach(id => {
      const el = document.getElementById(id);
      el?.closest('.calc-check-item')?.classList.toggle('active', !!el?.checked);
    });

    const resBox = document.getElementById('qsofaResultBox');
    if (!resBox) return;

    let title = '', cls = '', advice = '';
    if (score >= 2) {
      title = '🚨 NGUY CƠ CAO SEPSIS / TỬ VONG (≥ 2 ĐIỂM)';
      cls = 'res-critical';
      advice = 'Kích hoạt Gói Sepsis Giờ Đầu (Hour-1 Bundle): (1) Đo Lactate máu, (2) Cấy máu 2 vị trí trước KS, (3) Dùng kháng sinh phổ rộng TM ngay, (4) Bù dịch tinh thể 30 ml/kg nếu tụt HA / Lactate ≥ 4, (5) Vận mạch (Noradrenaline) nếu MAP < 65 mmHg.';
    } else if (score === 1) {
      title = '⚠️ CẢNH BÁO TRUNG BÌNH (1 ĐIỂM)';
      cls = 'res-moderate';
      advice = 'Chưa đủ ngưỡng qSOFA dương tính nhưng cần theo dõi sát sinh hiệu mỗi 2–4h, tìm ổ nhiễm trùng và làm bilan viêm/chức năng tạng.';
    } else {
      title = '🟢 NGUY CƠ THẤP (0 ĐIỂM)';
      cls = 'res-good';
      advice = 'Ít nguy cơ diễn tiến Sepsis nặng tại thời điểm đánh giá. Tiếp tục theo dõi thường quy.';
    }

    this.setResultSeverity(resBox, cls);
    const critText = criteria.length > 0 ? ` (${criteria.join(', ')})` : '';
    const copyText = `qSOFA = ${score}/3 điểm${critText} — ${this.stripLeadingEmoji(title)}.`;
    this.lastResults.qsofa = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${cls}">
        <span class="calc-result-val">${score}</span>
        <span class="calc-result-unit">/ 3 điểm</span>
      </div>
      <div class="calc-stage-title ${cls}">${title}</div>
      <div class="calc-advice-box">💡 <strong>Hành động lâm sàng:</strong> ${advice}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetQsofa() {
    ['qsofa_rr', 'qsofa_gcs', 'qsofa_sbp'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    this.calcQsofa();
  }

  // ============================================================================
  // 14. THANG ĐIỂM HÔN MÊ GLASGOW (GCS - CHỌN 1 CHẠM + HỖ TRỢ NKQ)
  // ============================================================================
  templateToolGlasgow() {
    const eOpts = [
      { v: 4, t: '4 — Tự nhiên' },
      { v: 3, t: '3 — Khi gọi' },
      { v: 2, t: '2 — Khi kích thích đau' },
      { v: 1, t: '1 — Không mở mắt' }
    ];
    const vOpts = [
      { v: 5, t: '5 — Định hướng tốt' },
      { v: 4, t: '4 — Lẫn lộn' },
      { v: 3, t: '3 — Từ ngữ không phù hợp' },
      { v: 2, t: '2 — Ú ớ vô nghĩa' },
      { v: 1, t: '1 — Không phát âm' }
    ];
    const mOpts = [
      { v: 6, t: '6 — Đúng y lệnh' },
      { v: 5, t: '5 — Gạt đúng chỗ đau' },
      { v: 4, t: '4 — Rụt chi khi đau' },
      { v: 3, t: '3 — Gấp cứng mất vỏ' },
      { v: 2, t: '2 — Duỗi cứng mất não' },
      { v: 1, t: '1 — Không đáp ứng' }
    ];

    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🧠 Thang Điểm Hôn Mê Glasgow (GCS)</div>
          <div class="calc-subtitle">Chấm nhanh 1 chạm Mắt (E), Lời nói (V / T-NKQ), Vận động (M)</div>
        </div>

        <div class="calc-seg-stack">
          <div class="calc-seg-row">
            <div class="calc-seg-label">👁️ Mở Mắt (Eye — E)</div>
            <div class="calc-seg-pills">
              ${eOpts.map(o => `
                <button type="button" class="calc-pill-btn ${this.state.gcsE === o.v ? 'active' : ''}"
                  onclick="window.clinicalHub.setGcs('E', ${o.v})">${o.t}</button>
              `).join('')}
            </div>
          </div>

          <div class="calc-seg-row">
            <div class="calc-seg-label" style="display:flex; justify-content:space-between; align-items:center;">
              <span>🗣️ Đáp Ứng Lời Nói (Verbal — V)</span>
              <label class="calc-inline-check">
                <input type="checkbox" id="gcsIntubated" ${this.state.gcsIntubated ? 'checked' : ''}
                  onchange="window.clinicalHub.toggleGcsIntubated(this.checked)">
                <span>Đang đặt NKQ (V-T)</span>
              </label>
            </div>
            <div class="calc-seg-pills ${this.state.gcsIntubated ? 'disabled-group' : ''}">
              ${vOpts.map(o => `
                <button type="button" class="calc-pill-btn ${!this.state.gcsIntubated && this.state.gcsV === o.v ? 'active' : ''}"
                  ${this.state.gcsIntubated ? 'disabled' : ''}
                  onclick="window.clinicalHub.setGcs('V', ${o.v})">${o.t}</button>
              `).join('')}
            </div>
          </div>

          <div class="calc-seg-row">
            <div class="calc-seg-label">💪 Đáp Ứng Vận Động (Motor — M)</div>
            <div class="calc-seg-pills">
              ${mOpts.map(o => `
                <button type="button" class="calc-pill-btn ${this.state.gcsM === o.v ? 'active' : ''}"
                  onclick="window.clinicalHub.setGcs('M', ${o.v})">${o.t}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="gcsResultBox"></div>
        ${this.renderToolActions('glasgow', 'resetGlasgow', 'Sao chép GCS')}
      </div>
    `;
  }

  setGcs(part, val) {
    if (part === 'E') this.state.gcsE = val;
    else if (part === 'V') { this.state.gcsV = val; this.state.gcsIntubated = false; }
    else if (part === 'M') this.state.gcsM = val;
    this.renderActiveTool();
  }

  toggleGcsIntubated(checked) {
    this.state.gcsIntubated = !!checked;
    this.renderActiveTool();
  }

  calcGlasgow() {
    const e = this.state.gcsE;
    const m = this.state.gcsM;
    const isT = this.state.gcsIntubated;
    const v = isT ? 1 : this.state.gcsV;
    const total = isT ? (e + m) : (e + v + m);
    const totalLabel = isT ? `${total}T` : `${total}`;
    const compLabel = isT ? `E${e}VTM${m}` : `E${e}V${v}M${m}`;

    const resBox = document.getElementById('gcsResultBox');
    if (!resBox) return;

    const effectiveScore = isT ? (e + m + 1) : total;
    let level = '', levelClass = '', note = '';
    if (effectiveScore >= 13 && !isT) {
      level = 'Tri giác nhẹ / Tỉnh táo (GCS 13–15)';
      levelClass = 'res-good';
      note = 'Tri giác ổn định. Tiếp tục theo dõi sinh hiệu và đánh giá thần kinh định kỳ.';
    } else if (effectiveScore >= 9) {
      level = isT ? 'Đang đặt NKQ — Tri giác trung bình' : 'Rối loạn tri giác trung bình — Li bì / lơ mơ (GCS 9–12)';
      levelClass = 'res-moderate';
      note = 'Theo dõi sát nguy cơ hít sặc, đường thở, kiểm tra đường huyết mao mạch, khí máu & nguyên nhân tổn thương não/nhiễm độc.';
    } else {
      level = '🚨 HÔN MÊ / RỐI LOẠN TRI GIÁC NẶNG (GCS ≤ 8)';
      levelClass = 'res-critical';
      note = 'Nguy cơ cao mất phản xạ bảo vệ đường thở! Chỉ định đặt nội khí quản bảo vệ đường thở & chuyển Hồi sức tích cực.';
    }

    this.setResultSeverity(resBox, levelClass);
    const copyText = `Glasgow (GCS) = ${totalLabel}${isT ? '' : '/15'} (${compLabel}) — ${this.stripLeadingEmoji(level)}.`;
    this.lastResults.glasgow = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${levelClass}">
        <span class="calc-result-val">${totalLabel}</span>
        <span class="calc-result-unit">${isT ? '(Đặt NKQ)' : '/ 15 điểm'} • ${compLabel}</span>
      </div>
      <div class="calc-stage-title ${levelClass}">${level}</div>
      <div class="calc-advice-box">💡 <strong>Lưu ý lâm sàng:</strong> ${note}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetGlasgow() {
    this.state.gcsE = 4;
    this.state.gcsV = 5;
    this.state.gcsIntubated = false;
    this.state.gcsM = 6;
    this.renderActiveTool();
  }

  // ============================================================================
  // 15. THANG ĐIỂM CHILD-PUGH XƠ GAN (CHỌN 1 CHẠM)
  // ============================================================================
  templateToolChildPugh() {
    const cp = this.state.cp;
    const rows = [
      {
        key: 'bili', label: 'Bilirubin toàn phần',
        opts: [
          { v: 1, t: '< 34 μmol/L (< 2 mg/dL)' },
          { v: 2, t: '34–51 μmol/L (2–3)' },
          { v: 3, t: '> 51 μmol/L (> 3)' }
        ]
      },
      {
        key: 'alb', label: 'Albumin huyết thanh',
        opts: [
          { v: 1, t: '> 35 g/L' },
          { v: 2, t: '28 – 35 g/L' },
          { v: 3, t: '< 28 g/L' }
        ]
      },
      {
        key: 'inr', label: 'INR / Prothrombin (PT%)',
        opts: [
          { v: 1, t: 'INR < 1.7 (PT > 50%)' },
          { v: 2, t: '1.7 – 2.3 (30–50%)' },
          { v: 3, t: 'INR > 2.3 (PT < 30%)' }
        ]
      },
      {
        key: 'asc', label: 'Cổ trướng (Báng bụng)',
        opts: [
          { v: 1, t: 'Không có' },
          { v: 2, t: 'Nhẹ / Vừa (đáp ứng LT)' },
          { v: 3, t: 'Nhiều / Kháng trị' }
        ]
      },
      {
        key: 'enc', label: 'Bệnh não gan',
        opts: [
          { v: 1, t: 'Không có' },
          { v: 2, t: 'Độ 1 – 2 (lẫn nhẹ)' },
          { v: 3, t: 'Độ 3 – 4 (lơ mơ/hôn mê)' }
        ]
      }
    ];

    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🟡 Thang Điểm Child-Pugh Đánh Giá Xơ Gan</div>
          <div class="calc-subtitle">Bấm chọn nhanh 1 chạm 5 tiêu chí phân loại suy tế bào gan (Class A, B, C)</div>
        </div>

        <div class="calc-seg-stack">
          ${rows.map(r => `
            <div class="calc-seg-row">
              <div class="calc-seg-label">${r.label}</div>
              <div class="calc-seg-pills cols-3-equal">
                ${r.opts.map(o => `
                  <button type="button" class="calc-pill-btn ${cp[r.key] === o.v ? 'active' : ''} pt-${o.v}"
                    onclick="window.clinicalHub.setChildPugh('${r.key}', ${o.v})">
                    <span>${o.t}</span><small>${o.v}đ</small>
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="calc-result-box" id="cpResultBox"></div>
        ${this.renderToolActions('child_pugh', 'resetChildPugh', 'Sao chép Child-Pugh')}
      </div>
    `;
  }

  setChildPugh(key, val) {
    this.state.cp[key] = val;
    this.renderActiveTool();
  }

  calcChildPugh() {
    const { bili, alb, inr, asc, enc } = this.state.cp;
    const total = bili + alb + inr + asc + enc;
    const resBox = document.getElementById('cpResultBox');
    if (!resBox) return;

    let clsName = '', stage = '', stageClass = '', prognosis = '';
    if (total <= 6) {
      clsName = 'Child-Pugh A';
      stage = 'Child-Pugh Class A (Xơ gan còn bù)';
      stageClass = 'res-good';
      prognosis = 'Sống còn 1 năm: ~100%, 2 năm: ~85%. Nguy cơ tử vong phẫu thuật bụng ~10%.';
    } else if (total <= 9) {
      clsName = 'Child-Pugh B';
      stage = 'Child-Pugh Class B (Xơ gan mất bù vừa)';
      stageClass = 'res-moderate';
      prognosis = 'Sống còn 1 năm: ~80%, 2 năm: ~60%. Chú ý chỉnh liều thuốc chuyển hóa qua gan, phòng ngừa biến chứng.';
    } else {
      clsName = 'Child-Pugh C';
      stage = '🚨 Child-Pugh Class C (Xơ gan mất bù nặng)';
      stageClass = 'res-critical';
      prognosis = 'Suy tế bào gan nặng. Sống còn 1 năm: ~45%, 2 năm: ~35%. Tránh tối đa thuốc độc gan và can thiệp phẫu thuật không cấp cứu.';
    }

    this.setResultSeverity(resBox, stageClass);
    const copyText = `Child-Pugh = ${total} điểm (${clsName} — ${this.stripLeadingEmoji(stage)}).`;
    this.lastResults.child_pugh = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${stageClass}">
        <span class="calc-result-val">${total}</span>
        <span class="calc-result-unit">/ 15 điểm (${clsName})</span>
      </div>
      <div class="calc-stage-title ${stageClass}">${stage}</div>
      <div class="calc-advice-box">💡 <strong>Tiên lượng:</strong> ${prognosis}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetChildPugh() {
    this.state.cp = { bili: 1, alb: 1, inr: 1, asc: 1, enc: 1 };
    this.renderActiveTool();
  }

  // ============================================================================
  // 16. THANG ĐIỂM CHA₂DS₂-VASc (RUNG NHĨ) - MỚI
  // ============================================================================
  templateToolChadsVasc() {
    const items = [
      { id: 'chads_c', pts: 1, code: 'C', title: 'Suy tim sung huyết / Giảm chức năng thất trái', desc: 'LVEF ≤ 40% hoặc tiền sử suy tim lâm sàng' },
      { id: 'chads_h', pts: 1, code: 'H', title: 'Tăng huyết áp', desc: 'Đang điều trị hạ áp hoặc HA ≥ 140/90 mmHg' },
      { id: 'chads_a75', pts: 2, code: 'A₂', title: 'Tuổi ≥ 75', desc: 'Tự loại trừ với nhóm 65–74 tuổi' },
      { id: 'chads_d', pts: 1, code: 'D', title: 'Đái tháo đường', desc: 'Đang điều trị hoặc đường huyết đói ≥ 7.0 mmol/L' },
      { id: 'chads_s2', pts: 2, code: 'S₂', title: 'Tiền sử Đột quỵ / TIA / Thuyên tắc mạch hệ thống', desc: 'Yếu tố nguy cơ cao (+2 điểm)' },
      { id: 'chads_v', pts: 1, code: 'V', title: 'Bệnh mạch máu (Vascular disease)', desc: 'NMCT cũ, bệnh động mạch ngoại biên (PAD), mảng xơ vữa ĐMC' },
      { id: 'chads_a65', pts: 1, code: 'A', title: 'Tuổi 65 – 74', desc: 'Không chọn đồng thời với Tuổi ≥ 75' },
      { id: 'chads_sc', pts: 1, code: 'Sc', title: 'Giới tính Nữ', desc: 'Chỉ làm tăng nguy cơ khi có kèm yếu tố nguy cơ khác' }
    ];

    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🫀 Thang Điểm CHA₂DS₂-VASc (Đánh Giá Nguy Cơ Đột Quỵ Rung Nhĩ)</div>
          <div class="calc-subtitle">Hướng dẫn chỉ định thuốc chống đông đường uống (NOAC / Warfarin) ở người bệnh rung nhĩ không do van tim</div>
        </div>

        <div class="calc-checklist">
          ${items.map(it => `
            <label class="calc-check-item">
              <input type="checkbox" id="${it.id}" onchange="window.clinicalHub.handleChadsToggle('${it.id}')">
              <div class="calc-check-content">
                <span class="calc-check-title"><strong>${it.code}</strong> — ${it.title}</span>
                <span class="calc-check-desc">${it.desc}</span>
              </div>
              <span class="calc-check-points">+${it.pts} đ</span>
            </label>
          `).join('')}
        </div>

        <div class="calc-result-box" id="chadsResultBox"></div>
        ${this.renderToolActions('chadsvasc', 'resetChadsVasc', 'Sao chép CHA₂DS₂-VASc')}
      </div>
    `;
  }

  handleChadsToggle(changedId) {
    // Hai tiêu chí tuổi 65-74 và ≥75 loại trừ lẫn nhau
    if (changedId === 'chads_a75' && document.getElementById('chads_a75')?.checked) {
      const a65 = document.getElementById('chads_a65');
      if (a65) a65.checked = false;
    } else if (changedId === 'chads_a65' && document.getElementById('chads_a65')?.checked) {
      const a75 = document.getElementById('chads_a75');
      if (a75) a75.checked = false;
    }
    this.calcChadsVasc();
  }

  calcChadsVasc() {
    const defs = [
      ['chads_c', 1, 'C'],
      ['chads_h', 1, 'H'],
      ['chads_a75', 2, 'A₂≥75'],
      ['chads_d', 1, 'D'],
      ['chads_s2', 2, 'S₂'],
      ['chads_v', 1, 'V'],
      ['chads_a65', 1, 'A65-74'],
      ['chads_sc', 1, 'Nữ']
    ];
    let score = 0;
    const picked = [];
    let isFemale = false;

    defs.forEach(([id, pts, label]) => {
      const el = document.getElementById(id);
      const checked = !!el?.checked;
      el?.closest('.calc-check-item')?.classList.toggle('active', checked);
      if (checked) {
        score += pts;
        picked.push(label);
        if (id === 'chads_sc') isFemale = true;
      }
    });

    const resBox = document.getElementById('chadsResultBox');
    if (!resBox) return;

    const riskTable = ['0%', '1.3%', '2.2%', '3.2%', '4.0%', '6.7%', '9.8%', '9.6%', '12.5%', '15.2%'];
    const annualRisk = riskTable[Math.min(score, 9)];
    const nonSexScore = isFemale ? score - 1 : score;

    let stage = '', cls = '', advice = '';
    if (nonSexScore === 0) {
      stage = '🟢 NGUY CƠ THẤP — KHÔNG CHỈ ĐỊNH KHÁNG ĐÔNG';
      cls = 'res-good';
      advice = 'Nam 0 điểm hoặc Nữ 1 điểm (chỉ riêng yếu tố giới tính): Không khuyến cáo dùng thuốc chống đông đường uống.';
    } else if (nonSexScore === 1) {
      stage = '⚠️ NGUY CƠ TRUNG BÌNH — CÂN NHẮC KHÁNG ĐÔNG (Class IIa)';
      cls = 'res-moderate';
      advice = 'Nam 1 điểm hoặc Nữ 2 điểm: Cân nhắc khởi trị thuốc chống đông (ưu tiên NOAC) sau khi đánh giá nguy cơ xuất huyết (HAS-BLED) và ý kiến NB.';
    } else {
      stage = '🚨 NGUY CƠ CAO — CHỈ ĐỊNH KHÁNG ĐÔNG ĐƯỜNG UỐNG (Class I)';
      cls = 'res-critical';
      advice = 'Nam ≥ 2 điểm hoặc Nữ ≥ 3 điểm: Khuyến cáo mạnh khởi trị thuốc chống đông (ưu tiên NOAC như Apixaban, Rivaroxaban, Dabigatran hoặc Warfarin INR 2–3). Đánh giá chức năng thận CrCl trước khi chọn liều!';
    }

    this.setResultSeverity(resBox, cls);
    const critStr = picked.length > 0 ? ` (${picked.join(', ')})` : '';
    const copyText = `CHA₂DS₂-VASc = ${score}/9 điểm${critStr} (Nguy cơ đột quỵ ~${annualRisk}/năm) — ${this.stripLeadingEmoji(stage)}.`;
    this.lastResults.chadsvasc = copyText;

    resBox.innerHTML = `
      <div class="calc-result-main ${cls}">
        <span class="calc-result-val">${score}</span>
        <span class="calc-result-unit">/ 9 điểm</span>
      </div>
      <div class="calc-result-details">
        <span class="calc-badge-res">📈 Nguy cơ đột quỵ/năm: ~${annualRisk}</span>
        <span class="calc-badge-res">Điểm không tính giới tính: ${nonSexScore}</span>
      </div>
      <div class="calc-stage-title ${cls}">${stage}</div>
      <div class="calc-advice-box">💡 <strong>Khuyến cáo ESC/AHA:</strong> ${advice}</div>
      ${this.renderCopyPreview(copyText)}
    `;
  }

  resetChadsVasc() {
    ['chads_c', 'chads_h', 'chads_a75', 'chads_d', 'chads_s2', 'chads_v', 'chads_a65', 'chads_sc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    this.calcChadsVasc();
  }

  // ============================================================================
  // SAO CHÉP KẾT QUẢ VÀO CLIPBOARD
  // ============================================================================
  copyResult(toolKey) {
    const textToCopy = (this.lastResults[toolKey] || '').trim();
    if (!textToCopy) {
      if (window.showToast) window.showToast('⚠️ Không có dữ liệu để sao chép');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (window.showToast) {
          window.showToast({
            title: '📋 ĐÃ SAO CHÉP KẾT QUẢ',
            message: 'Đã lưu vào bộ nhớ tạm. Bác sĩ có thể dán (Ctrl+V) vào Bệnh án hoặc Zalo.',
            type: 'success',
            icon: '✅'
          });
        }
      }).catch(() => this.fallbackCopyText(textToCopy));
    } else {
      this.fallbackCopyText(textToCopy);
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (window.showToast) window.showToast('📋 Đã sao chép kết quả vào bộ nhớ tạm');
    } catch (e) {
      console.warn('Không thể sao chép kết quả:', e);
    }
    document.body.removeChild(textArea);
  }
}

// Khởi tạo global instance
if (typeof window !== 'undefined') {
  window.clinicalHub = new ClinicalHub();
  document.addEventListener('DOMContentLoaded', () => {
    window.clinicalHub.init();
  });
}
