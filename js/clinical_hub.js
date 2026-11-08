// ==============================================================================
// CLINICAL TOOLS & SCORES HUB - MEDWARD PRO
// Module độc lập: Thang điểm lâm sàng & Máy tính y khoa bỏ túi
// ==============================================================================

class ClinicalHub {
  constructor() {
    this.modalId = 'clinicalHubModal';
    this.currentCategory = 'all'; // 'all' | 'scores' | 'calculators' | 'infectious'
    this.searchQuery = '';
    this.activeToolId = 'tool_drip'; // Mặc định mở công cụ tốc độ dịch
  }

  init() {
    this.bindEvents();
  }

  // Mở modal trung tâm thang điểm & công cụ
  openModal(preselectToolId = null) {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;

    if (preselectToolId) {
      this.activeToolId = preselectToolId;
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    // Render danh sách công cụ & giao diện công cụ đang chọn
    this.renderToolList();
    this.renderActiveTool();

    // Focus vào ô tìm kiếm
    setTimeout(() => {
      document.getElementById('hubSearchInput')?.focus();
    }, 100);
  }

  // Đóng modal
  closeModal() {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  bindEvents() {
    // Phím Esc đóng modal đã được app.js xử lý, nhưng bắt thêm trực tiếp nếu cần
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        const modal = document.getElementById(this.modalId);
        if (modal && modal.classList.contains('active')) {
          this.closeModal();
        } else {
          this.openModal();
        }
      }
    });
  }

  // Thiết lập bộ lọc danh mục
  setCategory(cat) {
    this.currentCategory = cat;
    document.querySelectorAll('.hub-filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.cat === cat);
    });
    this.renderToolList();
  }

  // Xử lý tìm kiếm công cụ
  handleSearch(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.renderToolList();
  }

  // Chọn công cụ hiển thị
  selectTool(toolId) {
    this.activeToolId = toolId;
    this.renderToolList();
    this.renderActiveTool();
  }

  // Danh mục dữ liệu của 10 công cụ
  getToolRegistry() {
    return [
      // NHÓM 1: MÁY TÍNH LÂM SÀNG
      {
        id: 'tool_drip',
        name: 'Tốc độ truyền dịch (IV Drip Rate)',
        short: 'Dịch truyền',
        icon: '💧',
        category: 'calculators',
        badge: 'Hằng ngày',
        desc: 'Tính số giọt/phút & ml/giờ theo thể tích và thời gian'
      },
      {
        id: 'tool_crcl',
        name: 'Độ thanh thải Thận (Cockcroft-Gault CrCl)',
        short: 'CrCl & Thận',
        icon: '🧪',
        category: 'calculators',
        badge: 'Chỉnh liều KS',
        desc: 'Đánh giá chức năng thận Cockcroft-Gault để chỉnh liều kháng sinh'
      },
      {
        id: 'tool_hct_concentrate',
        name: '% Cô đặc máu SXH Dengue (ΔHct)',
        short: 'Cô đặc máu Dengue',
        icon: '🩸',
        category: 'infectious',
        badge: 'Khoa Nhiễm',
        desc: 'Tính tỷ lệ tăng Hct so với Hct nền, nhận diện thoát huyết tương'
      },
      {
        id: 'tool_bmi_ibw',
        name: 'BMI & Cân nặng lý tưởng (IBW Devine)',
        short: 'BMI & IBW',
        icon: '⚖️',
        category: 'calculators',
        badge: 'Thể trạng',
        desc: 'Tính chỉ số khối cơ thể và cân nặng lý tưởng tính liều thuốc'
      },
      {
        id: 'tool_anion_gap',
        name: 'Khoảng trống Anion (Anion Gap)',
        short: 'Anion Gap',
        icon: '⚡',
        category: 'calculators',
        badge: 'Toan kiềm',
        desc: 'Đánh giá toan chuyển hóa tăng hoặc bình thường khoảng trống Anion'
      },

      // NHÓM 2: THANG ĐIỂM LÂM SÀNG
      {
        id: 'tool_curb65',
        name: 'Thang điểm CURB-65 / CRB-65',
        short: 'CURB-65 Viêm phổi',
        icon: '🫁',
        category: 'scores',
        badge: 'Viêm phổi',
        desc: 'Đánh giá độ nặng Viêm phổi cộng đồng & chỉ định nhập viện / ICU'
      },
      {
        id: 'tool_qsofa',
        name: 'Thang điểm qSOFA (Quick SOFA)',
        short: 'qSOFA Nhiễm trùng',
        icon: '🦠',
        category: 'scores',
        badge: 'Sepsis',
        desc: 'Tầm soát nhanh nguy cơ Sepsis / Nhiễm trùng huyết tại giường'
      },
      {
        id: 'tool_glasgow',
        name: 'Thang điểm Hôn mê Glasgow (GCS)',
        short: 'Glasgow (GCS)',
        icon: '🧠',
        category: 'scores',
        badge: 'Tri giác',
        desc: 'Đánh giá mức độ tri giác & hôn mê qua Mắt (E), Lời nói (V), Vận động (M)'
      },
      {
        id: 'tool_child_pugh',
        name: 'Thang điểm Child-Pugh Xơ Gan',
        short: 'Child-Pugh Xơ Gan',
        icon: '🟡',
        category: 'scores',
        badge: 'Gan mật',
        desc: 'Phân loại mức độ suy tế bào gan & tiên lượng xơ gan (Class A, B, C)'
      },
      {
        id: 'tool_dengue_classify',
        name: 'Phân tầng SXH Dengue (Bộ Y tế)',
        short: 'Phân tầng Dengue',
        icon: '🦟',
        category: 'infectious',
        badge: 'Bộ Y tế',
        desc: 'Nhận diện SXH Dengue thông thường, Có dấu hiệu cảnh báo, Dengue nặng'
      }
    ];
  }

  // Render danh sách công cụ bên cột trái (hoặc trên mobile)
  renderToolList() {
    const listContainer = document.getElementById('hubToolList');
    if (!listContainer) return;

    const registry = this.getToolRegistry();
    const query = this.searchQuery;
    const cat = this.currentCategory;

    const filtered = registry.filter(item => {
      const matchCat = cat === 'all' || 
        (cat === 'infectious' && (item.category === 'infectious' || item.id === 'tool_curb65' || item.id === 'tool_qsofa')) ||
        (cat === 'scores' && item.category === 'scores') ||
        (cat === 'calculators' && (item.category === 'calculators' || item.category === 'infectious'));

      const matchQuery = !query || 
        item.name.toLowerCase().includes(query) || 
        item.short.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query);

      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="hub-empty-state">
          <div style="font-size: 24px; margin-bottom: 6px;">🔍</div>
          <div>Không tìm thấy công cụ phù hợp với từ khóa "<strong>${query}</strong>"</div>
        </div>
      `;
      return;
    }

    // Nếu công cụ đang active không nằm trong kết quả lọc, chuyển sang công cụ đầu tiên
    if (!filtered.some(f => f.id === this.activeToolId)) {
      this.activeToolId = filtered[0].id;
      this.renderActiveTool();
    }

    listContainer.innerHTML = filtered.map(tool => {
      const isActive = tool.id === this.activeToolId;
      return `
        <div class="hub-tool-item ${isActive ? 'active' : ''}" onclick="window.clinicalHub.selectTool('${tool.id}')">
          <div class="hub-tool-icon">${tool.icon}</div>
          <div class="hub-tool-info">
            <div class="hub-tool-title">
              <span>${tool.short}</span>
              <span class="hub-tool-badge">${tool.badge}</span>
            </div>
            <div class="hub-tool-desc">${tool.desc}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render nội dung của công cụ đang kích hoạt
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
        this.calcCrCl();
        break;
      case 'tool_hct_concentrate':
        detailContainer.innerHTML = this.templateToolHct();
        this.calcHct();
        break;
      case 'tool_bmi_ibw':
        detailContainer.innerHTML = this.templateToolBmi();
        this.calcBmi();
        break;
      case 'tool_anion_gap':
        detailContainer.innerHTML = this.templateToolAnionGap();
        this.calcAnionGap();
        break;
      case 'tool_curb65':
        detailContainer.innerHTML = this.templateToolCurb65();
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
      case 'tool_dengue_classify':
        detailContainer.innerHTML = this.templateToolDengueClassify();
        this.calcDengueClassify();
        break;
      default:
        detailContainer.innerHTML = `<div class="hub-empty-state">Vui lòng chọn công cụ</div>`;
    }
  }

  // ============================================================================
  // CÔNG CỤ 1: TỐC ĐỘ TRUYỀN DỊCH
  // ============================================================================
  templateToolDrip() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">💧 Tính Tốc Độ Truyền Dịch (IV Drip Rate)</div>
          <div class="calc-subtitle">Quy đổi thể tích & thời gian thành số giọt/phút và ml/giờ</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Thể tích dịch truyền (ml):</label>
            <div class="calc-quick-chips">
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripVol(250)">250 ml</button>
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setDripVol(500)">500 ml</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setDripVol(1000)">1000 ml</button>
            </div>
            <input type="number" id="dripVol" class="calc-input" value="500" min="10" max="5000" oninput="window.clinicalHub.calcDripRate()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Thời gian truyền:</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" id="dripTime" class="calc-input" value="4" min="0.1" step="0.5" style="flex: 1;" oninput="window.clinicalHub.calcDripRate()">
              <select id="dripTimeUnit" class="calc-select" style="width: 100px;" onchange="window.clinicalHub.calcDripRate()">
                <option value="hours" selected>Giờ</option>
                <option value="minutes">Phút</option>
              </select>
            </div>
          </div>

          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">Hệ số dây truyền dịch:</label>
            <div class="calc-radio-group">
              <label class="calc-radio-card active" id="cardDrop20" onclick="window.clinicalHub.setDropFactor(20)">
                <input type="radio" name="dropFactor" value="20" checked style="display:none;">
                <span class="calc-radio-title">Dây người lớn (20 giọt/ml)</span>
                <span class="calc-radio-sub">Chuẩn phổ biến khoa lâm sàng</span>
              </label>
              <label class="calc-radio-card" id="cardDrop60" onclick="window.clinicalHub.setDropFactor(60)">
                <input type="radio" name="dropFactor" value="60" style="display:none;">
                <span class="calc-radio-title">Dây vi giọt (60 giọt/ml)</span>
                <span class="calc-radio-sub">Dùng cho Nhi khoa / truyền chậm</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Khung kết quả -->
        <div class="calc-result-box" id="dripResultBox">
          <!-- Render bởi calcDripRate() -->
        </div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('drip')">
            📋 Sao chép Y Lệnh
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetDrip()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  setDripVol(vol) {
    const input = document.getElementById('dripVol');
    if (input) {
      input.value = vol;
      document.querySelectorAll('.calc-quick-chips .calc-chip').forEach(c => {
        c.classList.toggle('active', c.innerText.includes(String(vol)));
      });
      this.calcDripRate();
    }
  }

  setDropFactor(factor) {
    window._curDropFactor = factor;
    document.getElementById('cardDrop20')?.classList.toggle('active', factor === 20);
    document.getElementById('cardDrop60')?.classList.toggle('active', factor === 60);
    this.calcDripRate();
  }

  calcDripRate() {
    const vol = parseFloat(document.getElementById('dripVol')?.value) || 0;
    const timeVal = parseFloat(document.getElementById('dripTime')?.value) || 0;
    const unit = document.getElementById('dripTimeUnit')?.value || 'hours';
    const factor = window._curDropFactor || 20;

    const resBox = document.getElementById('dripResultBox');
    if (!resBox) return;

    if (vol <= 0 || timeVal <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập thể tích và thời gian hợp lệ</div>`;
      return;
    }

    const totalMinutes = unit === 'hours' ? timeVal * 60 : timeVal;
    const totalHours = unit === 'hours' ? timeVal : timeVal / 60;

    const dropsPerMin = Math.round((vol * factor) / totalMinutes);
    const mlPerHour = Math.round((vol / totalHours) * 10) / 10;
    const secPerDrop = dropsPerMin > 0 ? (60 / dropsPerMin).toFixed(1) : 0;

    window._lastDripText = `Tốc độ truyền dịch: ${vol}ml trong ${timeVal} ${unit === 'hours' ? 'giờ' : 'phút'} -> ${dropsPerMin} giọt/phút (${mlPerHour} ml/h, ~${secPerDrop} giây/giọt).`;

    resBox.innerHTML = `
      <div class="calc-result-main">
        <span class="calc-result-val">${dropsPerMin}</span>
        <span class="calc-result-unit">giọt / phút</span>
      </div>
      <div class="calc-result-details">
        <span class="calc-badge-res">💧 ${mlPerHour} ml / giờ</span>
        <span class="calc-badge-res">⏱️ ~${secPerDrop} giây / 1 giọt</span>
        <span class="calc-badge-res">🧪 Tổng: ${vol} ml / ${totalMinutes} phút</span>
      </div>
    `;
  }

  resetDrip() {
    this.setDripVol(500);
    const timeInput = document.getElementById('dripTime');
    if (timeInput) timeInput.value = 4;
    this.setDropFactor(20);
  }

  // ============================================================================
  // CÔNG CỤ 2: ĐỘ THANH THẢI THẬN COCKCROFT-GAULT (CrCl)
  // ============================================================================
  templateToolCrCl() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🧪 Chức Năng Thận Cockcroft-Gault (CrCl)</div>
          <div class="calc-subtitle">Tính độ thanh thải Creatinine ước tính để chỉnh liều kháng sinh & thuốc đào thải qua thận</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Tuổi (năm):</label>
            <input type="number" id="crclAge" class="calc-input" value="65" min="18" max="120" oninput="window.clinicalHub.calcCrCl()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Giới tính:</label>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="calc-chip active" id="btnCrclMale" onclick="window.clinicalHub.setCrclGender('male')" style="flex: 1; padding: 10px;">👨 Nam</button>
              <button type="button" class="calc-chip" id="btnCrclFemale" onclick="window.clinicalHub.setCrclGender('female')" style="flex: 1; padding: 10px;">👩 Nữ (x0.85)</button>
            </div>
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Cân nặng (kg):</label>
            <input type="number" id="crclWeight" class="calc-input" value="55" min="20" max="250" oninput="window.clinicalHub.calcCrCl()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Creatinine huyết thanh:</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" id="crclScr" class="calc-input" value="120" min="10" max="2500" style="flex: 1;" oninput="window.clinicalHub.calcCrCl()">
              <select id="crclScrUnit" class="calc-select" style="width: 110px;" onchange="window.clinicalHub.handleScrUnitChange()">
                <option value="umol" selected>μmol/L</option>
                <option value="mgdl">mg/dL</option>
              </select>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="crclResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('crcl')">
            📋 Sao chép CrCl & Đánh giá
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetCrCl()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  setCrclGender(gender) {
    window._curCrclGender = gender;
    document.getElementById('btnCrclMale')?.classList.toggle('active', gender === 'male');
    document.getElementById('btnCrclFemale')?.classList.toggle('active', gender === 'female');
    this.calcCrCl();
  }

  handleScrUnitChange() {
    const unit = document.getElementById('crclScrUnit')?.value;
    const input = document.getElementById('crclScr');
    if (!input) return;
    const val = parseFloat(input.value) || 0;
    if (unit === 'mgdl') {
      input.value = (val / 88.4).toFixed(2);
    } else {
      input.value = Math.round(val * 88.4);
    }
    this.calcCrCl();
  }

  calcCrCl() {
    const age = parseFloat(document.getElementById('crclAge')?.value) || 0;
    const gender = window._curCrclGender || 'male';
    const weight = parseFloat(document.getElementById('crclWeight')?.value) || 0;
    let scr = parseFloat(document.getElementById('crclScr')?.value) || 0;
    const unit = document.getElementById('crclScrUnit')?.value || 'umol';

    const resBox = document.getElementById('crclResultBox');
    if (!resBox) return;

    if (age <= 0 || weight <= 0 || scr <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập đầy đủ tuổi, cân nặng và chỉ số Creatinine</div>`;
      return;
    }

    // Quy đổi Creatinine về mg/dL nếu đang là μmol/L
    let scrMgDl = unit === 'umol' ? scr / 88.4 : scr;
    if (scrMgDl <= 0) scrMgDl = 0.1;

    // Cockcroft-Gault = ((140 - Age) * Weight) / (72 * Scr_mgdl) * (0.85 if female)
    let crcl = ((140 - age) * weight) / (72 * scrMgDl);
    if (gender === 'female') {
      crcl *= 0.85;
    }
    crcl = Math.round(crcl * 10) / 10;

    let stage = '';
    let stageClass = '';
    let doseAdvice = '';

    if (crcl >= 90) {
      stage = 'Chức năng thận bình thường (G1)';
      stageClass = 'res-good';
      doseAdvice = 'Dùng liều kháng sinh chuẩn bình thường theo hướng dẫn.';
    } else if (crcl >= 60) {
      stage = 'Suy thận mức độ nhẹ (G2)';
      stageClass = 'res-mild';
      doseAdvice = 'Hầu hết kháng sinh chưa cần giảm liều (cần chú ý Aminoglycoside/Colistin).';
    } else if (crcl >= 30) {
      stage = 'Suy thận mức độ trung bình (G3)';
      stageClass = 'res-moderate';
      doseAdvice = 'Cần giảm 25% - 50% liều hoặc giãn khoảng cách đưa liều với Ceftriaxone/Levofloxacin/Meropenem.';
    } else if (crcl >= 15) {
      stage = 'Suy thận mức độ nặng (G4)';
      stageClass = 'res-severe';
      doseAdvice = 'Giảm liều mạnh (50% - 75%), ưu tiên giãn liều, theo dõi sát nồng độ thuốc hoặc độc tính.';
    } else {
      stage = 'Suy thận giai đoạn cuối (G5)';
      stageClass = 'res-critical';
      doseAdvice = 'Chỉ định liều theo lọc máu/chạy thận nhân tạo định kỳ.';
    }

    window._lastCrclText = `[Độ thanh thải CrCl = ${crcl} ml/phút] (${stage}) - Bệnh nhân ${gender === 'male' ? 'Nam' : 'Nữ'}, ${age}T, ${weight}kg, Creatinine ${scr} ${unit === 'umol' ? 'μmol/L' : 'mg/dL'}. Hướng dẫn: ${doseAdvice}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${stageClass}">
        <span class="calc-result-val">${crcl}</span>
        <span class="calc-result-unit">ml / phút</span>
      </div>
      <div class="calc-stage-title ${stageClass}">📌 ${stage}</div>
      <div class="calc-advice-box">💡 <strong>Khuyến cáo lâm sàng:</strong> ${doseAdvice}</div>
    `;
  }

  resetCrCl() {
    const ageInput = document.getElementById('crclAge');
    if (ageInput) ageInput.value = 65;
    const wInput = document.getElementById('crclWeight');
    if (wInput) wInput.value = 55;
    const scrInput = document.getElementById('crclScr');
    if (scrInput) scrInput.value = 120;
    this.setCrclGender('male');
  }

  // ============================================================================
  // CÔNG CỤ 3: % CÔ ĐẶC MÁU SXH DENGUE
  // ============================================================================
  templateToolHct() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🩸 % Cô Đặc Máu SXH Dengue (ΔHct)</div>
          <div class="calc-subtitle">Đánh giá mức độ thoát huyết tương theo Hướng dẫn chẩn đoán & điều trị SXH Dengue (Bộ Y tế)</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Hct hiện tại (%):</label>
            <input type="number" id="hctCurrent" class="calc-input" value="44" min="15" max="75" step="0.5" oninput="window.clinicalHub.calcHct()">
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Hct nền (%):</label>
            <div class="calc-quick-chips">
              <button type="button" class="calc-chip active" onclick="window.clinicalHub.setHctBaseline(42, 'Nam')">Nam (42%)</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setHctBaseline(38, 'Nữ')">Nữ (38%)</button>
              <button type="button" class="calc-chip" onclick="window.clinicalHub.setHctBaseline(35, 'Trẻ em')">Trẻ (35%)</button>
            </div>
            <input type="number" id="hctBaseline" class="calc-input" value="42" min="15" max="60" step="0.5" oninput="window.clinicalHub.calcHct()">
          </div>
        </div>

        <div class="calc-result-box" id="hctResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('hct')">
            📋 Sao chép Kết Quả ΔHct
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetHct()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  setHctBaseline(val, label) {
    const input = document.getElementById('hctBaseline');
    if (input) {
      input.value = val;
      document.querySelectorAll('.calc-quick-chips .calc-chip').forEach(c => {
        c.classList.toggle('active', c.innerText.includes(label));
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
      return;
    }

    const deltaPercent = Math.round(((cur - base) / base) * 100 * 10) / 10;
    let statusText = '';
    let statusClass = '';
    let advice = '';

    if (deltaPercent >= 20) {
      statusText = '🚨 DẤU HIỆU CẢNH BÁO (TĂNG ≥ 20%)';
      statusClass = 'res-critical';
      advice = 'Có hiện tượng thoát huyết tương nặng / cô đặc máu rõ rệt. Cần theo dõi sát sinh hiệu mỗi 1 - 2h, xem xét chỉ định bù dịch điện giải theo phác đồ.';
    } else if (deltaPercent >= 10) {
      statusText = '⚠️ CÓ CÔ ĐẶC MÁU NHẸ (10% - 19.9%)';
      statusClass = 'res-moderate';
      advice = 'Đang có hiện tượng thoát dịch. Khuyến khích uống nhiều Oresol / nước hoa quả, làm lại CTM + Hct sau 4 - 6 giờ.';
    } else if (deltaPercent > 0) {
      statusText = '🟢 CHƯA CÓ CÔ ĐẶC MÁU ĐÁNG KỂ (< 10%)';
      statusClass = 'res-good';
      advice = 'Hct trong giới hạn an toàn so với mốc nền. Tiếp tục theo dõi lâm sàng.';
    } else {
      statusText = '📉 Hct THẤP HƠN HOẶC BẰNG NỀN';
      statusClass = 'res-mild';
      advice = 'Không có cô đặc máu. Chú ý nguy cơ xuất huyết ẩn nếu tiểu cầu tụt sâu hoặc đang thừa dịch.';
    }

    window._lastHctText = `[Độ cô đặc máu SXH Dengue: ΔHct = +${deltaPercent}%] (Hiện tại ${cur}%, Nền ${base}%). Đánh giá: ${statusText}. Xử trí: ${advice}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${statusClass}">
        <span class="calc-result-val">${deltaPercent > 0 ? '+' : ''}${deltaPercent}</span>
        <span class="calc-result-unit">%</span>
      </div>
      <div class="calc-stage-title ${statusClass}">${statusText}</div>
      <div class="calc-advice-box">💡 <strong>Xử trí lâm sàng:</strong> ${advice}</div>
    `;
  }

  resetHct() {
    const cur = document.getElementById('hctCurrent');
    if (cur) cur.value = 44;
    this.setHctBaseline(42, 'Nam');
  }

  // ============================================================================
  // CÔNG CỤ 4: BMI & CÂN NẶNG LÝ TƯỞNG (IBW)
  // ============================================================================
  templateToolBmi() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">⚖️ Chỉ Số Khối Cơ Thể (BMI) & Cân Nặng Lý Tưởng (IBW)</div>
          <div class="calc-subtitle">Phân loại thể trạng theo tiêu chuẩn WHO khu vực Châu Á & công thức Devine tính liều thuốc</div>
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
            <label class="calc-label">Giới tính (tính IBW):</label>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="calc-chip active" id="btnBmiMale" onclick="window.clinicalHub.setBmiGender('male')" style="flex: 1; padding: 10px;">👨 Nam</button>
              <button type="button" class="calc-chip" id="btnBmiFemale" onclick="window.clinicalHub.setBmiGender('female')" style="flex: 1; padding: 10px;">👩 Nữ</button>
            </div>
          </div>
        </div>

        <div class="calc-result-box" id="bmiResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('bmi')">
            📋 Sao chép Chỉ Số BMI & IBW
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetBmi()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  setBmiGender(gender) {
    window._curBmiGender = gender;
    document.getElementById('btnBmiMale')?.classList.toggle('active', gender === 'male');
    document.getElementById('btnBmiFemale')?.classList.toggle('active', gender === 'female');
    this.calcBmi();
  }

  calcBmi() {
    const h = parseFloat(document.getElementById('bmiHeight')?.value) || 0;
    const w = parseFloat(document.getElementById('bmiWeight')?.value) || 0;
    const gender = window._curBmiGender || 'male';
    const resBox = document.getElementById('bmiResultBox');
    if (!resBox) return;

    if (h <= 0 || w <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập chiều cao và cân nặng hợp lệ</div>`;
      return;
    }

    const hM = h / 100;
    const bmi = Math.round((w / (hM * hM)) * 10) / 10;

    // Cân nặng lý tưởng (Devine 1974)
    // Nam: 50 + 0.9 * (H - 152)
    // Nữ: 45.5 + 0.9 * (H - 152)
    let ibw = gender === 'male' ? 50 + 0.9 * (h - 152) : 45.5 + 0.9 * (h - 152);
    if (h < 152) ibw = gender === 'male' ? 50 : 45.5;
    ibw = Math.round(ibw * 10) / 10;

    let category = '';
    let catClass = '';
    // Thang phân loại Châu Á (IDI & WPRO)
    if (bmi < 18.5) {
      category = 'Gầy / Thiếu năng lượng trường diễn';
      catClass = 'res-mild';
    } else if (bmi <= 22.9) {
      category = 'Thể trạng bình thường';
      catClass = 'res-good';
    } else if (bmi <= 24.9) {
      category = 'Thừa cân / Tiền béo phì';
      catClass = 'res-moderate';
    } else if (bmi <= 29.9) {
      category = 'Béo phì Độ I';
      catClass = 'res-moderate';
    } else {
      category = 'Béo phì Độ II (Nặng)';
      catClass = 'res-critical';
    }

    window._lastBmiText = `[Chỉ số BMI = ${bmi} kg/m²] (${category}) - Chiều cao ${h}cm, Cân nặng ${w}kg. Cân nặng lý tưởng IBW: ${ibw} kg.`;

    resBox.innerHTML = `
      <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        <div style="text-align: center;">
          <div class="calc-result-main ${catClass}">
            <span class="calc-result-val">${bmi}</span>
            <span class="calc-result-unit">kg/m²</span>
          </div>
          <div class="calc-stage-title ${catClass}">BMI: ${category}</div>
        </div>
        <div style="text-align: center; border-left: 1px dashed var(--border-color); padding-left: 16px;">
          <div class="calc-result-main res-good">
            <span class="calc-result-val">${ibw}</span>
            <span class="calc-result-unit">kg</span>
          </div>
          <div class="calc-stage-title res-good">Cân nặng lý tưởng (IBW)</div>
        </div>
      </div>
      <div class="calc-advice-box">💡 <strong>Ghi chú liều:</strong> Với các kháng sinh Aminoglycoside, Theophylline hoặc thở máy ở bệnh nhân béo phì, nên dùng cân nặng lý tưởng (IBW) hoặc cân nặng hiệu chỉnh (AdjBW) để tránh quá liều.</div>
    `;
  }

  resetBmi() {
    const h = document.getElementById('bmiHeight');
    if (h) h.value = 165;
    const w = document.getElementById('bmiWeight');
    if (w) w.value = 62;
    this.setBmiGender('male');
  }

  // ============================================================================
  // CÔNG CỤ 5: KHOẢNG TRỐNG ANION (ANION GAP)
  // ============================================================================
  templateToolAnionGap() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">⚡ Khoảng Trống Anion (Serum Anion Gap)</div>
          <div class="calc-subtitle">Phân biệt nhiễm toan chuyển hóa tăng Anion Gap (Lactic, DKA, Ure huyết) hay bình thường</div>
        </div>

        <div class="calc-grid" style="grid-template-columns: repeat(3, 1fr);">
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
        </div>

        <div class="calc-result-box" id="agResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('anion_gap')">
            📋 Sao chép Kết Quả Anion Gap
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetAnionGap()">
            🔄 Làm lại
          </button>
        </div>
      </div>
    `;
  }

  calcAnionGap() {
    const na = parseFloat(document.getElementById('agNa')?.value) || 0;
    const cl = parseFloat(document.getElementById('agCl')?.value) || 0;
    const hco3 = parseFloat(document.getElementById('agHco3')?.value) || 0;
    const resBox = document.getElementById('agResultBox');
    if (!resBox) return;

    if (na <= 0 || cl <= 0 || hco3 <= 0) {
      resBox.innerHTML = `<div class="calc-result-text">Vui lòng nhập đủ các chỉ số Na, Cl và HCO3</div>`;
      return;
    }

    const ag = Math.round((na - (cl + hco3)) * 10) / 10;
    let evalText = '';
    let evalClass = '';
    let cause = '';

    if (ag > 12) {
      evalText = '🚨 TĂNG KHOẢNG TRỐNG ANION (> 12 mmol/L)';
      evalClass = 'res-critical';
      cause = 'Gợi ý Toan chuyển hóa tăng Anion Gap (GOLDMARK): Toan Lactic (sốc, nhiễm khuẩn huyết), Nhiễm toan Ceton đái tháo đường (DKA), Suy thận tiến triển, Ngộ độc methanol/salicylate.';
    } else if (ag >= 8) {
      evalText = '🟢 KHOẢNG TRỐNG ANION BÌNH THƯỜNG (8 - 12 mmol/L)';
      evalClass = 'res-good';
      cause = 'Nếu có toan chuyển hóa: Toan chuyển hóa tăng Cl- máu (mất HCO3 qua đường tiêu hóa do tiêu chảy nặng, hoặc toan hóa ống thận RTA).';
    } else {
      evalText = '📉 KHOẢNG TRỐNG ANION THẤP (< 8 mmol/L)';
      evalClass = 'res-mild';
      cause = 'Thường gặp do hạ Albumin máu nặng (cứ giảm 10g/L Albumin thì AG giảm ~2.5 mmol/L), Đa u tủy xương hoặc tăng Lithium.';
    }

    window._lastAgText = `[Serum Anion Gap = ${ag} mmol/L] (Na: ${na}, Cl: ${cl}, HCO3: ${hco3}). Đánh giá: ${evalText}. Nguyên nhân: ${cause}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${evalClass}">
        <span class="calc-result-val">${ag}</span>
        <span class="calc-result-unit">mmol / L</span>
      </div>
      <div class="calc-stage-title ${evalClass}">${evalText}</div>
      <div class="calc-advice-box">💡 <strong>Biện luận lâm sàng:</strong> ${cause}</div>
    `;
  }

  resetAnionGap() {
    document.getElementById('agNa').value = 138;
    document.getElementById('agCl').value = 102;
    document.getElementById('agHco3').value = 22;
    this.calcAnionGap();
  }

  // ============================================================================
  // THANG ĐIỂM 1: CURB-65 / CRB-65 (VIÊM PHỔI CỘNG ĐỒNG)
  // ============================================================================
  templateToolCurb65() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🫁 Thang Điểm CURB-65 / CRB-65 (Viêm Phổi)</div>
          <div class="calc-subtitle">Đánh giá độ nặng và quyết định nơi điều trị cho Viêm phổi mắc phải cộng đồng</div>
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'curb')">
            <input type="checkbox" id="curb_c" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>C</strong> - Confusion (Lú lẫn, suy giảm tri giác)</span>
              <span class="calc-check-desc">Mới xuất hiện so với bình thường</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'curb')">
            <input type="checkbox" id="curb_u" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>U</strong> - Urea máu > 7 mmol/L (hoặc BUN > 19 mg/dL)</span>
              <span class="calc-check-desc">Nếu chưa có xét nghiệm Ure máu, áp dụng thang điểm CRB-65</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'curb')">
            <input type="checkbox" id="curb_r" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>R</strong> - Respiratory rate (Nhịp thở) ≥ 30 lần/phút</span>
              <span class="calc-check-desc">Thở nhanh, khó thở rõ</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'curb')">
            <input type="checkbox" id="curb_b" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>B</strong> - Blood pressure (Huyết áp tụt)</span>
              <span class="calc-check-desc">Huyết áp tâm thu < 90 mmHg HOẶC tâm trương ≤ 60 mmHg</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'curb')">
            <input type="checkbox" id="curb_65" onchange="window.clinicalHub.calcCurb65()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>65</strong> - Tuổi ≥ 65</span>
              <span class="calc-check-desc">Người cao tuổi có nguy cơ diễn tiến nặng cao</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>
        </div>

        <div class="calc-result-box" id="curbResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('curb65')">
            📋 Sao chép Điểm CURB-65
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetCurb65()">
            🔄 Bỏ chọn hết
          </button>
        </div>
      </div>
    `;
  }

  toggleScoreCheck(labelEl, prefix) {
    const input = labelEl.querySelector('input[type="checkbox"]');
    if (!input) return;
    // Ngăn chặn double toggle do sự kiện click trên label
    labelEl.classList.toggle('active', input.checked);
  }

  calcCurb65() {
    let score = 0;
    const criteria = [];

    if (document.getElementById('curb_c')?.checked) { score++; criteria.push('Lú lẫn (C)'); }
    if (document.getElementById('curb_u')?.checked) { score++; criteria.push('Urea > 7 mmol/L (U)'); }
    if (document.getElementById('curb_r')?.checked) { score++; criteria.push('Thở ≥ 30 l/p (R)'); }
    if (document.getElementById('curb_b')?.checked) { score++; criteria.push('Tụt HA < 90/60 (B)'); }
    if (document.getElementById('curb_65')?.checked) { score++; criteria.push('Tuổi ≥ 65'); }

    // Đồng bộ class active trên label
    ['curb_c', 'curb_u', 'curb_r', 'curb_b', 'curb_65'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('.calc-check-item')?.classList.toggle('active', el.checked);
    });

    const resBox = document.getElementById('curbResultBox');
    if (!resBox) return;

    let group = '';
    let groupClass = '';
    let recommendation = '';
    let mortality = '';

    if (score <= 1) {
      group = 'Nhóm 1: Viêm phổi mức độ nhẹ';
      groupClass = 'res-good';
      mortality = '< 1.5% - 3%';
      recommendation = 'Có thể xem xét điều trị ngoại trú nếu bệnh nhân không có bệnh nền phức tạp hoặc hoàn cảnh xã hội đặc biệt.';
    } else if (score === 2) {
      group = 'Nhóm 2: Viêm phổi mức độ trung bình';
      groupClass = 'res-moderate';
      mortality = '~ 9%';
      recommendation = 'Chỉ định nhập viện điều trị nội trú tại Khoa Nhiễm / Nội Hô hấp. Theo dõi sát đáp ứng điều trị.';
    } else {
      group = 'Nhóm 3: Viêm phổi mức độ nặng';
      groupClass = 'res-critical';
      mortality = '15% - 40%';
      recommendation = '🚨 Nguy cơ tử vong cao. Cần nhập viện điều trị nội trú khẩn cấp, xem xét hội chẩn Hồi sức tích cực (ICU).';
    }

    const critText = criteria.length > 0 ? `Tiêu chí dương tính: ${criteria.join(', ')}` : 'Không có tiêu chí nào';
    window._lastCurbText = `[CURB-65 = ${score} điểm] (${group}, Tỷ lệ tử vong ước tính: ${mortality}). ${critText}. Khuyến cáo: ${recommendation}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${groupClass}">
        <span class="calc-result-val">${score}</span>
        <span class="calc-result-unit">/ 5 điểm</span>
      </div>
      <div class="calc-stage-title ${groupClass}">${group} (Tử vong ước tính: ${mortality})</div>
      <div class="calc-advice-box">💡 <strong>Chỉ định xử trí:</strong> ${recommendation}</div>
    `;
  }

  resetCurb65() {
    ['curb_c', 'curb_u', 'curb_r', 'curb_b', 'curb_65'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = false;
        el.closest('.calc-check-item')?.classList.remove('active');
      }
    });
    this.calcCurb65();
  }

  // ============================================================================
  // THANG ĐIỂM 2: qSOFA (NHIỄM TRÙNG HUYẾT / SEPSIS)
  // ============================================================================
  templateToolQsofa() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🦠 Thang Điểm qSOFA (Quick SOFA)</div>
          <div class="calc-subtitle">Tầm soát nhanh nguy cơ diễn tiến xấu do Sepsis / Nhiễm trùng huyết ngay tại buồng bệnh</div>
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'qsofa')">
            <input type="checkbox" id="qsofa_rr" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Nhịp thở ≥ 22 lần/phút</span>
              <span class="calc-check-desc">Thở nhanh do bù toan chuyển hóa hoặc tổn thương phổi</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'qsofa')">
            <input type="checkbox" id="qsofa_gcs" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Rối loạn tri giác (Glasgow < 15)</span>
              <span class="calc-check-desc">Lú lẫn, li bì, bứt rứt hoặc chậm chạp</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'qsofa')">
            <input type="checkbox" id="qsofa_sbp" onchange="window.clinicalHub.calcQsofa()">
            <div class="calc-check-content">
              <span class="calc-check-title">Huyết áp tâm thu ≤ 100 mmHg</span>
              <span class="calc-check-desc">Hạ huyết áp do giãn mạch nhiễm độc hoặc giảm thể tích</span>
            </div>
            <span class="calc-check-points">+1 đ</span>
          </label>
        </div>

        <div class="calc-result-box" id="qsofaResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('qsofa')">
            📋 Sao chép Điểm qSOFA
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetQsofa()">
            🔄 Bỏ chọn hết
          </button>
        </div>
      </div>
    `;
  }

  calcQsofa() {
    let score = 0;
    const criteria = [];

    if (document.getElementById('qsofa_rr')?.checked) { score++; criteria.push('Thở ≥ 22 l/p'); }
    if (document.getElementById('qsofa_gcs')?.checked) { score++; criteria.push('Glasgow < 15'); }
    if (document.getElementById('qsofa_sbp')?.checked) { score++; criteria.push('Huyết áp tâm thu ≤ 100 mmHg'); }

    ['qsofa_rr', 'qsofa_gcs', 'qsofa_sbp'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('.calc-check-item')?.classList.toggle('active', el.checked);
    });

    const resBox = document.getElementById('qsofaResultBox');
    if (!resBox) return;

    let title = '';
    let cls = '';
    let advice = '';

    if (score >= 2) {
      title = '🚨 NGUY CƠ CAO NHIỄM KHUẨN HUYẾT / TỬ VONG (≥ 2 ĐIỂM)';
      cls = 'res-critical';
      advice = 'Nghi ngờ Sepsis! Cần khẩn trương: Đo Lactate máu, Cấy máu 2 vị trí trước khi dùng kháng sinh, Khởi động bù dịch điện giải 30ml/kg nếu tụt HA/Lactate ≥ 4mmol/L, Hội chẩn Hồi sức tích cực.';
    } else if (score === 1) {
      title = '⚠️ NGUY CƠ TRUNG BÌNH (1 ĐIỂM)';
      cls = 'res-moderate';
      advice = 'Chưa thỏa tiêu chuẩn qSOFA nhưng có dấu hiệu bất thường. Cần theo dõi sinh hiệu thường xuyên hơn (mỗi 2 - 4h) và tìm kiếm ổ nhiễm trùng tiềm ẩn.';
    } else {
      title = '🟢 NGUY CƠ THẤP (0 ĐIỂM)';
      cls = 'res-good';
      advice = 'Ít nguy cơ diễn tiến xấu do Sepsis tại thời điểm đánh giá. Tiếp tục theo dõi lâm sàng theo dõi thường quy.';
    }

    const critText = criteria.length > 0 ? `Dấu hiệu: ${criteria.join(', ')}` : 'Không có dấu hiệu nào';
    window._lastQsofaText = `[Thang điểm qSOFA = ${score}/3 điểm] (${title}). ${critText}. Xử trí: ${advice}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${cls}">
        <span class="calc-result-val">${score}</span>
        <span class="calc-result-unit">/ 3 điểm</span>
      </div>
      <div class="calc-stage-title ${cls}">${title}</div>
      <div class="calc-advice-box">💡 <strong>Hành động lâm sàng:</strong> ${advice}</div>
    `;
  }

  resetQsofa() {
    ['qsofa_rr', 'qsofa_gcs', 'qsofa_sbp'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = false;
        el.closest('.calc-check-item')?.classList.remove('active');
      }
    });
    this.calcQsofa();
  }

  // ============================================================================
  // THANG ĐIỂM 3: GLASGOW COMA SCALE (GCS)
  // ============================================================================
  templateToolGlasgow() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🧠 Thang Điểm Hôn Mê Glasgow (GCS)</div>
          <div class="calc-subtitle">Đánh giá chuẩn xác mức độ ý thức & tri giác qua 3 phản ứng: Mắt (E), Lời nói (V), Vận động (M)</div>
        </div>

        <div class="calc-grid">
          <!-- Mắt -->
          <div class="calc-form-group">
            <label class="calc-label">👁️ Mở Mắt (Eye - E):</label>
            <select id="gcsE" class="calc-select" onchange="window.clinicalHub.calcGlasgow()">
              <option value="4" selected>4 - Mở mắt tự nhiên</option>
              <option value="3">3 - Mở mắt khi gọi / nghe tiếng động</option>
              <option value="2">2 - Mở mắt khi kích thích đau</option>
              <option value="1">1 - Hoàn toàn không mở mắt</option>
            </select>
          </div>

          <!-- Lời nói -->
          <div class="calc-form-group">
            <label class="calc-label">🗣️ Đáp Ứng Lời Nói (Verbal - V):</label>
            <select id="gcsV" class="calc-select" onchange="window.clinicalHub.calcGlasgow()">
              <option value="5" selected>5 - Trả lời đúng, định hướng tốt</option>
              <option value="4">4 - Trả lời lẫn lộn, nhầm lẫn</option>
              <option value="3">3 - Nói từ ngữ không thích hợp</option>
              <option value="2">2 - Phát âm ú ớ, kêu rên vô nghĩa</option>
              <option value="1">1 - Hoàn toàn không phát âm</option>
            </select>
          </div>

          <!-- Vận động -->
          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">💪 Đáp Ứng Vận Động (Motor - M):</label>
            <select id="gcsM" class="calc-select" onchange="window.clinicalHub.calcGlasgow()">
              <option value="6" selected>6 - Vận động đúng theo y lệnh</option>
              <option value="5">5 - Gạt đúng vị trí khi kích thích đau</option>
              <option value="4">4 - Rụt chi lại khi kích thích đau (quờ quạng)</option>
              <option value="3">3 - Gấp cứng mất vỏ (Decorticate)</option>
              <option value="2">2 - Duỗi cứng mất não (Decerebrate)</option>
              <option value="1">1 - Hoàn toàn không đáp ứng vận động</option>
            </select>
          </div>
        </div>

        <div class="calc-result-box" id="gcsResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('glasgow')">
            📋 Sao chép Điểm Glasgow
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetGlasgow()">
            🔄 Đặt lại 15 điểm
          </button>
        </div>
      </div>
    `;
  }

  calcGlasgow() {
    const e = parseInt(document.getElementById('gcsE')?.value, 10) || 4;
    const v = parseInt(document.getElementById('gcsV')?.value, 10) || 5;
    const m = parseInt(document.getElementById('gcsM')?.value, 10) || 6;
    const total = e + v + m;

    const resBox = document.getElementById('gcsResultBox');
    if (!resBox) return;

    let level = '';
    let levelClass = '';
    let note = '';

    if (total >= 13) {
      level = 'Rối loạn tri giác mức độ nhẹ (Tỉnh táo / tiếp xúc được)';
      levelClass = 'res-good';
      note = 'Tri giác ổn định. Duy trì theo dõi sinh hiệu và khám thần kinh định kỳ.';
    } else if (total >= 9) {
      level = 'Rối loạn tri giác mức độ trung bình (Li bì / lơ mơ)';
      levelClass = 'res-moderate';
      note = 'Cần theo dõi sát nguy cơ hít sặc, kiểm tra đường thở, làm khí máu động mạch và tìm nguyên nhân tổn thương não/nhiễm độc.';
    } else {
      level = '🚨 Rối loạn tri giác mức độ NẶNG / HÔN MÊ (GCS ≤ 8)';
      levelClass = 'res-critical';
      note = 'Nguy cơ mất phản xạ bảo vệ đường thở. Chỉ định đặt nội khí quản bảo vệ đường thở và chuyển Hồi sức cấp cứu.';
    }

    window._lastGcsText = `[Thang điểm Glasgow = ${total} điểm] (E${e}V${v}M${m}) - ${level}. Xử trí: ${note}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${levelClass}">
        <span class="calc-result-val">${total}</span>
        <span class="calc-result-unit">/ 15 điểm (E${e}V${v}M${m})</span>
      </div>
      <div class="calc-stage-title ${levelClass}">${level}</div>
      <div class="calc-advice-box">💡 <strong>Lưu ý lâm sàng:</strong> ${note}</div>
    `;
  }

  resetGlasgow() {
    document.getElementById('gcsE').value = 4;
    document.getElementById('gcsV').value = 5;
    document.getElementById('gcsM').value = 6;
    this.calcGlasgow();
  }

  // ============================================================================
  // THANG ĐIỂM 4: CHILD-PUGH (XƠ GAN)
  // ============================================================================
  templateToolChildPugh() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🟡 Thang Điểm Child-Pugh Đánh Giá Xơ Gan</div>
          <div class="calc-subtitle">Phân loại mức độ suy tế bào gan và tiên lượng tỷ lệ sống còn ở người bệnh xơ gan</div>
        </div>

        <div class="calc-grid">
          <div class="calc-form-group">
            <label class="calc-label">Bilirubin toàn phần:</label>
            <select id="cpBili" class="calc-select" onchange="window.clinicalHub.calcChildPugh()">
              <option value="1" selected>&lt; 34 μmol/L (&lt; 2 mg/dL) [1 điểm]</option>
              <option value="2">34 - 51 μmol/L (2 - 3 mg/dL) [2 điểm]</option>
              <option value="3">&gt; 51 μmol/L (&gt; 3 mg/dL) [3 điểm]</option>
            </select>
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Albumin huyết thanh:</label>
            <select id="cpAlb" class="calc-select" onchange="window.clinicalHub.calcChildPugh()">
              <option value="1" selected>&gt; 35 g/L [1 điểm]</option>
              <option value="2">28 - 35 g/L [2 điểm]</option>
              <option value="3">&lt; 28 g/L [3 điểm]</option>
            </select>
          </div>

          <div class="calc-form-group">
            <label class="calc-label">INR / Tỷ lệ Prothrombin:</label>
            <select id="cpInr" class="calc-select" onchange="window.clinicalHub.calcChildPugh()">
              <option value="1" selected>INR &lt; 1.7 (PT &gt; 50%) [1 điểm]</option>
              <option value="2">INR 1.7 - 2.3 (PT 30 - 50%) [2 điểm]</option>
              <option value="3">INR &gt; 2.3 (PT &lt; 30%) [3 điểm]</option>
            </select>
          </div>

          <div class="calc-form-group">
            <label class="calc-label">Cổ trướng (Báng bụng):</label>
            <select id="cpAscites" class="calc-select" onchange="window.clinicalHub.calcChildPugh()">
              <option value="1" selected>Không có [1 điểm]</option>
              <option value="2">Nhẹ / Vừa (đáp ứng với lợi tiểu) [2 điểm]</option>
              <option value="3">Nhiều / Kháng trị [3 điểm]</option>
            </select>
          </div>

          <div class="calc-form-group" style="grid-column: 1 / -1;">
            <label class="calc-label">Bệnh não gan (Hôn mê gan):</label>
            <select id="cpEnceph" class="calc-select" onchange="window.clinicalHub.calcChildPugh()">
              <option value="1" selected>Không có [1 điểm]</option>
              <option value="2">Độ 1 - 2 (Lẫn lộn nhẹ, rối loạn giấc ngủ) [2 điểm]</option>
              <option value="3">Độ 3 - 4 (Lơ mơ sâu hoặc hôn mê) [3 điểm]</option>
            </select>
          </div>
        </div>

        <div class="calc-result-box" id="cpResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('child_pugh')">
            📋 Sao chép Điểm Child-Pugh
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetChildPugh()">
            🔄 Đặt lại Class A (5đ)
          </button>
        </div>
      </div>
    `;
  }

  calcChildPugh() {
    const bili = parseInt(document.getElementById('cpBili')?.value, 10) || 1;
    const alb = parseInt(document.getElementById('cpAlb')?.value, 10) || 1;
    const inr = parseInt(document.getElementById('cpInr')?.value, 10) || 1;
    const asc = parseInt(document.getElementById('cpAscites')?.value, 10) || 1;
    const enc = parseInt(document.getElementById('cpEnceph')?.value, 10) || 1;
    const total = bili + alb + inr + asc + enc;

    const resBox = document.getElementById('cpResultBox');
    if (!resBox) return;

    let stage = '';
    let stageClass = '';
    let prognosis = '';

    if (total <= 6) {
      stage = 'Child-Pugh Class A (Xơ gan còn bù)';
      stageClass = 'res-good';
      prognosis = 'Chức năng gan còn bù tốt. Tỷ lệ sống còn 1 năm: 100%, 2 năm: ~85%. Tỷ lệ tử vong phẫu thuật bụng thấp (~10%).';
    } else if (total <= 9) {
      stage = 'Child-Pugh Class B (Xơ gan mất bù vừa)';
      stageClass = 'res-moderate';
      prognosis = 'Tổn thương chức năng gan đáng kể. Tỷ lệ sống còn 1 năm: ~80%, 2 năm: ~60%. Cần xem xét chỉ định ghép gan.';
    } else {
      stage = 'Child-Pugh Class C (Xơ gan mất bù nặng)';
      stageClass = 'res-critical';
      prognosis = '🚨 Suy tế bào gan giai đoạn cuối. Tỷ lệ sống còn 1 năm: ~45%, 2 năm: ~35%. Tỷ lệ tử vong chu phẫu rất cao (> 70-80%).';
    }

    window._lastCpText = `[Thang điểm Child-Pugh = ${total} điểm] (${stage}). Tiên lượng: ${prognosis}`;

    resBox.innerHTML = `
      <div class="calc-result-main ${stageClass}">
        <span class="calc-result-val">${total}</span>
        <span class="calc-result-unit">/ 15 điểm (${stage.split('(')[0].trim()})</span>
      </div>
      <div class="calc-stage-title ${stageClass}">${stage}</div>
      <div class="calc-advice-box">💡 <strong>Tiên lượng lâm sàng:</strong> ${prognosis}</div>
    `;
  }

  resetChildPugh() {
    ['cpBili', 'cpAlb', 'cpInr', 'cpAscites', 'cpEnceph'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 1;
    });
    this.calcChildPugh();
  }

  // ============================================================================
  // THANG ĐIỂM 5: PHÂN TẦNG SXH DENGUE (BỘ Y TẾ)
  // ============================================================================
  templateToolDengueClassify() {
    return `
      <div class="calc-panel">
        <div class="calc-panel-header">
          <div class="calc-title">🦟 Phân Tầng SXH Dengue Theo Hướng Dẫn Bộ Y Tế</div>
          <div class="calc-subtitle">Nhận diện các dấu hiệu cảnh báo và tiêu chuẩn sốt xuất huyết Dengue nặng</div>
        </div>

        <div style="margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #dc2626;">
          🚨 DẤU HIỆU CẢNH BÁO (Tích chọn nếu có):
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_belly" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Đau bụng nhiều và liên tục hoặc tăng cảm giác đau ở vùng gan</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_vomit" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Nôn ói liên tục (≥ 3 lần trong 1 giờ hoặc ≥ 4 lần trong 6 giờ)</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_bleed" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Xuất huyết niêm mạc (chảy máu chân răng, mũi, nôn máu, tiểu máu, rong kinh)</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_fluid" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Ứ dịch lâm sàng (tràn dịch màng phổi, tràn dịch màng bụng qua siêu âm/khám)</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_liver" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Gan to > 2 cm dưới bờ sườn</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_hct_tc" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Hct tăng cao kèm số lượng tiểu cầu giảm nhanh chóng</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="dw_lethargy" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title">Li bì, bứt rứt, vật vã hoặc tiểu ít</span>
            </div>
          </label>
        </div>

        <div style="margin: 16px 0 10px; font-size: 13px; font-weight: 700; color: #b91c1c;">
          ☠️ TIÊU CHUẨN SXH DENGUE NẶNG (Tích chọn nếu có):
        </div>

        <div class="calc-checklist">
          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="ds_shock" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>Sốc SXH Dengue</strong> (Mạch nhanh nhỏ, HA tụt/kẹp &lt; 20mmHg, chi lạnh ẩm)</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="ds_bleed" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>Xuất huyết nặng</strong> (Xuất huyết tiêu hóa ồ ạt, xuất huyết não, cần truyền máu)</span>
            </div>
          </label>

          <label class="calc-check-item" onclick="window.clinicalHub.toggleScoreCheck(this, 'dengue')">
            <input type="checkbox" id="ds_organ" onchange="window.clinicalHub.calcDengueClassify()">
            <div class="calc-check-content">
              <span class="calc-check-title"><strong>Tổn thương tạng nặng</strong> (Men gan AST/ALT ≥ 1000 U/L, Suy thận cấp, Viêm cơ tim)</span>
            </div>
          </label>
        </div>

        <div class="calc-result-box" id="dengueResultBox"></div>

        <div class="calc-actions">
          <button type="button" class="btn btn-primary" onclick="window.clinicalHub.copyResult('dengue_classify')">
            📋 Sao chép Phân Tầng Dengue
          </button>
          <button type="button" class="btn btn-subtle" onclick="window.clinicalHub.resetDengueClassify()">
            🔄 Bỏ chọn hết
          </button>
        </div>
      </div>
    `;
  }

  calcDengueClassify() {
    const isShock = document.getElementById('ds_shock')?.checked;
    const isHeavyBleed = document.getElementById('ds_bleed')?.checked;
    const isHeavyOrgan = document.getElementById('ds_organ')?.checked;
    const isSevere = isShock || isHeavyBleed || isHeavyOrgan;

    const warningIds = ['dw_belly', 'dw_vomit', 'dw_bleed', 'dw_fluid', 'dw_liver', 'dw_hct_tc', 'dw_lethargy'];
    let warningCount = 0;
    warningIds.forEach(id => {
      const el = document.getElementById(id);
      if (el?.checked) warningCount++;
      el?.closest('.calc-check-item')?.classList.toggle('active', el.checked);
    });

    ['ds_shock', 'ds_bleed', 'ds_organ'].forEach(id => {
      const el = document.getElementById(id);
      el?.closest('.calc-check-item')?.classList.toggle('active', el.checked);
    });

    const resBox = document.getElementById('dengueResultBox');
    if (!resBox) return;

    let stage = '';
    let stageClass = '';
    let advice = '';

    if (isSevere) {
      stage = '☠️ SXH DENGUE NẶNG (SEVENRE DENGUE)';
      stageClass = 'res-critical';
      advice = 'Báo động đỏ! Cần chuyển ngay phòng Cấp cứu / Hồi sức, thiết lập 2 đường truyền tĩnh mạch lớn, chống sốc bằng Ringer Lactate / Cao phân tử theo phác đồ sốc Dengue, theo dõi sinh hiệu mỗi 15 - 30 phút.';
    } else if (warningCount > 0) {
      stage = `🚨 SXH DENGUE CÓ DẤU HIỆU CẢNH BÁO (${warningCount} dấu hiệu)`;
      stageClass = 'res-moderate';
      advice = 'Chỉ định nhập viện điều trị nội trú bắt buộc. Xét nghiệm Hct, Tiểu cầu mỗi 4 - 6 giờ. Bù dịch tĩnh mạch nếu bệnh nhân không uống được hoặc Hct có xu hướng tăng cao.';
    } else {
      stage = '🟢 SXH DENGUE THÔNG THƯỜNG (KHÔNG DẤU HIỆU CẢNH BÁO)';
      stageClass = 'res-good';
      advice = 'Bệnh nhân có thể theo dõi ngoại trú nếu bảo đảm tái khám mỗi ngày. Uống nhiều nước (Oresol, nước dừa), hạ sốt bằng Paracetamol đơn thuần, dặn dò các dấu hiệu cảnh báo cần nhập viện ngay.';
    }

    window._lastDengueText = `[Phân loại lâm sàng: ${stage}]. Hướng xử trí: ${advice}`;

    resBox.innerHTML = `
      <div class="calc-stage-title ${stageClass}" style="font-size: 16px;">${stage}</div>
      <div class="calc-advice-box">💡 <strong>Hướng dẫn điều trị (BYT):</strong> ${advice}</div>
    `;
  }

  resetDengueClassify() {
    ['dw_belly', 'dw_vomit', 'dw_bleed', 'dw_fluid', 'dw_liver', 'dw_hct_tc', 'dw_lethargy', 'ds_shock', 'ds_bleed', 'ds_organ'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = false;
        el.closest('.calc-check-item')?.classList.remove('active');
      }
    });
    this.calcDengueClassify();
  }

  // ============================================================================
  // HÀM SAO CHÉP KẾT QUẢ VÀO CLIPBOARD
  // ============================================================================
  copyResult(toolType) {
    let textToCopy = '';
    switch (toolType) {
      case 'drip': textToCopy = window._lastDripText; break;
      case 'crcl': textToCopy = window._lastCrclText; break;
      case 'hct': textToCopy = window._lastHctText; break;
      case 'bmi': textToCopy = window._lastBmiText; break;
      case 'anion_gap': textToCopy = window._lastAgText; break;
      case 'curb65': textToCopy = window._lastCurbText; break;
      case 'qsofa': textToCopy = window._lastQsofaText; break;
      case 'glasgow': textToCopy = window._lastGcsText; break;
      case 'child_pugh': textToCopy = window._lastCpText; break;
      case 'dengue_classify': textToCopy = window._lastDengueText; break;
    }

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
      }).catch(() => {
        this.fallbackCopyText(textToCopy);
      });
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
      if (window.showToast) {
        window.showToast('📋 Đã sao chép kết quả vào bộ nhớ tạm');
      }
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

