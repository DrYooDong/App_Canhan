// ============================================
// NỘI TÂM — Dashboard Component
// Tích hợp Lịch Ngày Tốt & Trung Tâm Năng Lượng Ngày
// ============================================

(function () {
  'use strict';

  let currentCalDate = new Date();
  let activeDashTab = 'overview'; // 'overview' | 'tasks' | 'morning'

  // Helper tổng hợp toàn bộ thông tin 6 module cho 1 ngày bất kỳ
  function getDailyIntegratedDetails(dateObj, userProfile, taskType) {
    const AL = window.AstrologyLogic;
    let lunarStr = '';
    let canNgay = 'Giáp';
    let chiNgay = 'Tý';
    let hanhNgay = 'Kim';
    let lunarDay = dateObj.getDate();
    let lunarMonth = dateObj.getMonth() + 1;
    let lunarYear = dateObj.getFullYear();

    if (typeof Lunar !== 'undefined' && AL) {
      const lunar = Lunar.fromDate(dateObj);
      lunarDay = lunar.getDay();
      lunarMonth = Math.abs(lunar.getMonth());
      lunarYear = lunar.getYear();
      canNgay = AL.CAN[lunar.getDayGanIndex()] || 'Giáp';
      chiNgay = AL.CUNG[lunar.getDayZhiIndex()] || 'Tý';
      hanhNgay = AL.NGU_HANH_CAN[canNgay] || 'Kim';
      lunarStr = `Mùng ${lunarDay}/${lunarMonth} năm ${lunar.getYearInGanZhi()} (${canNgay} ${chiNgay})`;
    }

    // 1. Cát hung score
    const scoreResult = AL && AL.evaluatePersonalizedDay ? AL.evaluatePersonalizedDay(dateObj, userProfile, taskType) : null;

    // 2. Y phục & Thực dưỡng (Bio-Fengshui)
    const remedyDB = {
      'Kim': { element: 'Kim', icon: '⚪', wardrobe: { colors: ['Trắng', 'Bạc', 'Ghi nhạt', 'Kem'], accessories: 'Đồng hồ dây kim loại, trang sức bạc', avoidColors: ['Đỏ', 'Cam', 'Tím'] }, dietary: { organ: '🫁 Phổi & Đại Trường', tea: 'Trà Hoa Nhài, Trà Bá Tước', breakfast: 'Nấm tuyết chưng đường phèn, súp củ cải', time: '05:00 - 07:00 (Giờ Mão)' }, environment: { oil: 'Tinh dầu Hoa Nhài, Sả Chanh', frequency: '741 Hz — Làm sạch, giải độc, tỉnh táo' }, mindset: 'Kiểm tra kỹ văn bản, hợp đồng trước khi ký.' },
      'Mộc': { element: 'Mộc', icon: '🍃', wardrobe: { colors: ['Xanh lá', 'Xanh ngọc', 'Xanh rêu'], accessories: 'Vòng tay gỗ trầm hương, ngọc thạch', avoidColors: ['Trắng', 'Bạc'] }, dietary: { organ: '🫀 Gan & Mật', tea: 'Trà Xanh Sencha, Trà Matcha, Trà Hoa Cúc', breakfast: 'Sinh tố bơ xanh, nước ép táo xanh', time: '01:00 - 03:00 (Giờ Sửu)' }, environment: { oil: 'Tinh dầu Bạc Hà, Hương Thảo', frequency: '528 Hz — Tái tạo tế bào' }, mindset: 'Giữ tâm ôn hòa, không nóng vội.' },
      'Thủy': { element: 'Thủy', icon: '🌊', wardrobe: { colors: ['Đen', 'Xanh navy', 'Xanh đen'], accessories: 'Thạch anh đen, Sapphire', avoidColors: ['Vàng', 'Nâu đất'] }, dietary: { organ: '🧠 Thận & Bàng Quang', tea: 'Trà Đỗ Đen Rang, Trà Đông Trùng', breakfast: 'Hạt óc chó, cháo mè đen, rong biển', time: '17:00 - 19:00 (Giờ Dậu)' }, environment: { oil: 'Tinh dầu Lavender, Gỗ Tuyết Tùng', frequency: '432 Hz — Định tâm, giảm căng thẳng' }, mindset: 'Lắng nghe trực giác và kiên nhẫn.' },
      'Hỏa': { element: 'Hỏa', icon: '🔥', wardrobe: { colors: ['Đỏ', 'Hồng', 'Tím', 'Cam'], accessories: 'Thạch anh hồng, điểm nhấn khăn/caravat ấm', avoidColors: ['Đen', 'Xanh navy'] }, dietary: { organ: '❤️ Tâm & Tiểu Trường', tea: 'Trà Táo Đỏ Kỷ Tử, Trà Tía Tô', breakfast: 'Cà chua, dâu tây, hạt macca', time: '11:00 - 13:00 (Giờ Ngọ)' }, environment: { oil: 'Tinh dầu Quế, Cam Ngọt', frequency: '639 Hz — Kết nối tình cảm' }, mindset: 'Hào hứng nhưng tránh bốc đồng.' },
      'Thổ': { element: 'Thổ', icon: '🪵', wardrobe: { colors: ['Vàng nâu', 'Nâu đất', 'Be', 'Vàng kem'], accessories: 'Đồ gốm sứ, thạch anh vàng', avoidColors: ['Xanh lá'] }, dietary: { organ: '🫄 Tỳ & Vị (Lách / Dạ dày)', tea: 'Trà Gừng Mật Ong ấm, Trà Cam Thảo', breakfast: 'Cháo hạt sen, khoai lang vàng, súp nóng', time: '07:00 - 09:00 (Giờ Thìn)' }, environment: { oil: 'Tinh dầu Gỗ Trầm, Quế', frequency: '396 Hz — Giải tỏa âu lo' }, mindset: 'Điềm tĩnh, chú trọng thực chất.' }
    };
    const remedy = remedyDB[hanhNgay] || remedyDB['Kim'];

    // 3. Kỳ Môn Bát Môn & Thần Cát
    const thanCatDB = {
      'Giáp': { taiThan: 'Đông Nam', hyThan: 'Đông Bắc', quyNhan: 'Tây Nam' },
      'Ất':   { taiThan: 'Đông', hyThan: 'Bắc', quyNhan: 'Tây' },
      'Bính': { taiThan: 'Nam', hyThan: 'Đông', quyNhan: 'Bắc' },
      'Đinh': { taiThan: 'Đông Nam', hyThan: 'Tây Nam', quyNhan: 'Bắc' },
      'Mậu':  { taiThan: 'Đông Nam', hyThan: 'Bắc', quyNhan: 'Tây Nam' },
      'Kỷ':   { taiThan: 'Tây', hyThan: 'Tây Nam', quyNhan: 'Bắc' },
      'Canh': { taiThan: 'Tây', hyThan: 'Nam', quyNhan: 'Tây Nam' },
      'Tân':  { taiThan: 'Tây Bắc', hyThan: 'Tây', quyNhan: 'Nam' },
      'Nhâm': { taiThan: 'Bắc', hyThan: 'Tây Bắc', quyNhan: 'Đông' },
      'Quý':  { taiThan: 'Bắc', hyThan: 'Bắc Đông', quyNhan: 'Đông' }
    };
    const thanCat = thanCatDB[canNgay] || thanCatDB['Giáp'];

    // 4. Quẻ Mai Hoa Dịch Số
    const upperIdx = ((lunarYear + lunarMonth + lunarDay) % 8) || 8;
    const lowerIdx = ((lunarYear + lunarMonth + lunarDay + 1) % 8) || 8;
    const movingLine = ((lunarYear + lunarMonth + lunarDay + 1) % 6) || 6;
    const batQuaiNames = ['', 'Càn (Thiên)', 'Đoài (Trạch)', 'Ly (Hỏa)', 'Chấn (Lôi)', 'Tốn (Phong)', 'Khảm (Thủy)', 'Cấn (Sơn)', 'Khôn (Địa)'];
    const hexKey = `${upperIdx}-${lowerIdx}`;
    
    const queSimpleData = {
      '1-1': { name: 'Thuần Càn', advice: 'Sức mạnh & Lãnh đạo. Thời cơ thuận lợi tiến lên.' },
      '8-8': { name: 'Thuần Khôn', advice: 'Nhu thuận & Bền chí. Hợp tác, kiên nhẫn chờ thời.' },
      '8-1': { name: 'Địa Thiên Thái', advice: 'Thái bình hanh thông. Mọi sự thuận lợi.' },
      '1-8': { name: 'Thiên Địa Bĩ', advice: 'Bế tắc trở ngại. Nên ẩn nhẫn chờ thời.' },
      '1-3': { name: 'Hỏa Thiên Đại Hữu', advice: 'Đại thành sung túc. Giữ sự khiêm tốn.' },
      '3-1': { name: 'Thiên Hỏa Đồng Nhân', advice: 'Đoàn kết hợp tác. Sức mạnh tập thể.' },
      '6-4': { name: 'Thủy Lôi Truân', advice: 'Khởi đầu gian nan. Chưa nên vội vã.' },
      '2-8': { name: 'Trạch Lôi Tùy', advice: 'Thuận thời thích nghi. Không cưỡng cầu.' }
    };
    const queInfo = queSimpleData[hexKey] || {
      name: `${batQuaiNames[upperIdx]} / ${batQuaiNames[lowerIdx]}`,
      advice: 'Giữ tâm bình thản, kiên nhẫn hành động theo thời cơ.'
    };

    // 5. Biorhythm wave score
    let bio = { physical: 0, emotional: 0, intellectual: 0, statusTag: 'NORMAL' };
    if (AL && AL.calculateBiorhythms) {
      bio = AL.calculateBiorhythms(new Date(1990, 0, 1), dateObj);
    }

    // 6. Cảnh báo Sức Khỏe Tử Vi
    const healthWarnings = [
      { organ: 'Dạ dày & Tiêu hóa', warning: 'Tiêu hóa nhạy cảm. Tránh đồ ăn quá lạnh hoặc kích ứng.' },
      { organ: 'Mắt & Vùng Đầu', warning: 'Mắt dễ mỏi, căng thẳng. Nên chợp mắt nghỉ ngơi 15 phút.' },
      { organ: 'Xương khớp & Máu huyết', warning: 'Vận động nhẹ nhàng, cẩn thận khi lái xe giao thông.' }
    ];
    const healthFocus = healthWarnings[dateObj.getDate() % healthWarnings.length];

    return {
      dateObj,
      lunarStr,
      canNgay,
      chiNgay,
      hanhNgay,
      scoreResult,
      remedy,
      thanCat,
      queInfo,
      upperName: batQuaiNames[upperIdx],
      lowerName: batQuaiNames[lowerIdx],
      movingLine,
      healthFocus,
      bio
    };
  }

  function renderDashboard(container, params) {
    if (params && params[0]) {
      if (['morning', 'tasks', 'overview', 'main'].includes(params[0])) {
        if (params[0] === 'morning') activeDashTab = 'morning';
        else if (params[0] === 'tasks') activeDashTab = 'tasks';
        else activeDashTab = 'overview';
      }
    }

    container.innerHTML = `
      <div class="dashboard-hub animate-fade-in">
        <div class="tabs-header" style="display:flex;gap:12px;margin-bottom:24px;border-bottom:1px solid var(--border-color);padding-bottom:12px;flex-wrap:wrap;">
          <button class="btn btn-tab ${activeDashTab === 'overview' ? 'active' : ''}" data-tab="overview" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeDashTab === 'overview' ? 'var(--accent-muted)' : 'transparent'};color:${activeDashTab === 'overview' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeDashTab === 'overview' ? 'var(--border-accent)' : 'transparent'};">
            <span>☯</span> Tổng Quan & Lịch Ngày Tốt
          </button>
          <button class="btn btn-tab ${activeDashTab === 'tasks' ? 'active' : ''}" data-tab="tasks" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeDashTab === 'tasks' ? 'var(--accent-muted)' : 'transparent'};color:${activeDashTab === 'tasks' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeDashTab === 'tasks' ? 'var(--border-accent)' : 'transparent'};">
            <span>🌱</span> Nhiệm Vụ Cải Mệnh
          </button>
          <button class="btn btn-tab ${activeDashTab === 'morning' ? 'active' : ''}" data-tab="morning" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeDashTab === 'morning' ? 'var(--accent-muted)' : 'transparent'};color:${activeDashTab === 'morning' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeDashTab === 'morning' ? 'var(--border-accent)' : 'transparent'};">
            <span>☀️</span> Bản Tin Cải Mệnh Sáng
          </button>
        </div>

        <div id="dashboard-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#dashboard-sub-content');

    function loadSubTab(tab) {
      activeDashTab = tab;
      container.querySelectorAll('.btn-tab').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
        btn.style.background = isCurrent ? 'var(--accent-muted)' : 'transparent';
        btn.style.color = isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)';
        btn.style.borderColor = isCurrent ? 'var(--border-accent)' : 'transparent';
      });

      subContent.innerHTML = '';
      if (tab === 'morning' && window.renderMorning) {
        window.renderMorning(subContent);
      } else if (tab === 'tasks' && window.renderTasks) {
        window.renderTasks(subContent);
      } else {
        renderMainDashboard(subContent);
      }
    }

    container.querySelectorAll('.btn-tab').forEach(btn => {
      btn.addEventListener('click', () => loadSubTab(btn.dataset.tab));
    });

    loadSubTab(activeDashTab);
  }

  function renderMainDashboard(container) {
    const { Utils, CRUD, Storage } = App;
    const dailyInsight = Utils.getDailyItem(TUVI_DATA);
    const lessons = CRUD.getAll('lessons');
    const rules = CRUD.getAll('rules');
    const reminders = CRUD.getAll('reminders');
    const journals = CRUD.getAll('journals');
    const recentLessons = lessons.slice(0, 3);
    const todayReminder = reminders.length > 0 ? Utils.getDailyItem(reminders) : null;

    const allStrengths = [...new Set(TUVI_DATA.flatMap(d => d.strengths || []))];
    const allWeaknesses = [...new Set(TUVI_DATA.flatMap(d => d.weaknesses || []))];

    // Thông tin tử vi cá nhân hóa Nguyễn Hữu Đông
    const userProfile = {
      canNam: 'Canh',
      chiNam: 'Thìn',
      hanhMenh: 'Kim',
      tu_vi_chart: {
        menh_cung_idx: 0, // Tý (Mệnh Đồng Âm)
        tai_bach_idx: 8,  // Thân (Cơ Nguyệt Đồng Lương)
        quan_loc_idx: 4,  // Thìn
        tat_ach_idx: 7,   // Mùi
        thien_di_idx: 6   // Ngọ
      }
    };
    let currentTaskType = "GENERAL";

    // Tích hợp dữ liệu tổng hợp cho ngày hôm nay
    const todayInfo = getDailyIntegratedDetails(new Date(), userProfile, currentTaskType);

    container.innerHTML = `
      <!-- Master Header -->
      <div class="animate-fade-in" style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--accent-primary); letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
              <span>☯ TRUNG TÂM ĐIỀU HÀNH TỬ VI & LỊCH NGÀY TỐT MASTER</span>
            </div>
            <h1 class="page-title" style="margin-bottom: 4px;">Xin chào Nguyễn Hữu Đông</h1>
            <p class="page-subtitle" style="margin-bottom: 0;">Lịch Ngày Tốt Cá Nhân Hóa & Hệ Thống Năng Lượng 13-trong-1.</p>
          </div>

          <!-- Quick Date Filter Pills -->
          <div class="segmented-tabs" id="quick-date-filters">
            <button class="segmented-tab active" data-quick-date="today"><span>📅</span> Hôm Nay</button>
            <button class="segmented-tab" data-quick-date="tomorrow"><span>☀️</span> Ngày Mai</button>
            <button class="segmented-tab" data-quick-date="weekend"><span>🏖️</span> Cuối Tuần</button>
            <button class="segmented-tab" data-quick-date="scan-exam"><span>🎓 Top Thi Cử</span></button>
            <button class="segmented-tab" data-quick-date="scan-contract"><span>✍️ Top Hợp Đồng</span></button>
          </div>
        </div>
      </div>

      <!-- Smart Target Scanner (Săn Ngày Thăng Tiến & Thi Cử) -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div class="tuvi-card">
          <div class="tuvi-card-header">
            <div class="tuvi-card-title-group">
              <div class="tuvi-card-icon">🎯</div>
              <div>
                <div class="tuvi-card-title">Smart Target Scanner — Quét Ngày Vàng Mục Tiêu</div>
                <div class="tuvi-card-subtitle">Tự động chọn Top 3 Ngày Cát Tường 30 ngày tới cho Sự Nghiệp, Thi Cử & Hợp Đồng</div>
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <select id="goal-scanner-type" class="form-select" style="max-width:210px; background:var(--bg-input); font-weight:600; padding:6px 32px 6px 12px; font-size:0.82rem;">
                <option value="EXAM">🎓 Thi Cử / Bảo Vệ Luận Văn</option>
                <option value="INTERVIEW">💼 Phỏng Vấn / Xin Việc</option>
                <option value="PROMOTION">👑 Trình Sếp / Tăng Lương</option>
                <option value="PITCHING">🎤 Ra Mắt / Thuyết Trình</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btn-run-goal-scan">🔍 Quét Top 3 Ngày Vàng</button>
            </div>
          </div>

          <div id="goal-scan-results-container" style="display:none; margin-top:14px; padding:14px; background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-color);">
          </div>
        </div>
      </div>

      <!-- Master Calendar Grid (Lịch Ngày Tốt Cá Nhân Hóa) -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div class="tuvi-card">
          <div class="tuvi-card-header">
            <div class="tuvi-card-title-group">
              <div class="tuvi-card-icon">📅</div>
              <div>
                <div class="tuvi-card-title">Lịch Cát Hung & Năng Lượng 30 Ngày</div>
                <div class="tuvi-card-subtitle">Chấm điểm cá nhân hóa 4 Tầng dựa trên Lá Số Tử Vi, Biorhythm & Can Chi Ngày</div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <div class="flex items-center gap-xs">
                <button class="btn btn-ghost btn-icon btn-sm" id="btn-cal-prev" aria-label="Tháng trước">◀</button>
                <span id="cal-month-year" style="font-family:var(--font-heading); font-weight:700; font-size:1.1rem; min-width:140px; text-align:center; color:var(--text-primary);">Tháng --/----</span>
                <button class="btn btn-ghost btn-icon btn-sm" id="btn-cal-next" aria-label="Tháng sau">▶</button>
              </div>
              <select id="cal-task-type" class="form-select" style="max-width:190px; background:var(--bg-input); font-size:0.82rem; padding:6px 32px 6px 12px;">
                <option value="GENERAL">🌐 Tổng Quan Ngày</option>
                <option value="EXAM">🎓 Thi Cử / Bảo Vệ Luận Văn</option>
                <option value="INTERVIEW">💼 Phỏng Vấn / Xin Việc</option>
                <option value="PROMOTION">👑 Trình Sếp / Tăng Lương</option>
                <option value="CONTRACT">✍️ Hợp Đồng / Đầu Tư</option>
              </select>
            </div>
          </div>

          <div id="calendar-grid"></div>

          <div class="calendar-legend mt-md" style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap; font-size:0.8rem; color:var(--text-secondary); border-top:1px dashed var(--border-color); padding-top:12px;">
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:var(--color-success);"></span> 🟢 Đại Cát (≥80đ)</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:var(--color-warning);"></span> 🟡 Bình Hòa (60-79đ)</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:var(--color-danger);"></span> 🔴 Cung Cảnh Báo (&lt;60đ)</span>
          </div>

          <!-- Integrated Hourly Rhythm Widget (Nhịp Giờ Hoàng Đạo Trong Lịch) -->
          <div id="calendar-hourly-rhythm-widget" style="margin-top:16px; border-top:1px dashed var(--border-color); padding-top:14px;"></div>
        </div>
      </div>

      <div class="ornamental-divider">✦ ────── ❖ ────── ✦</div>

      <!-- MASTER DAILY INTELLIGENCE BOARD (Bảng Năng Lượng Chi Tiết 13-trong-1) -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div id="master-daily-intelligence-board"></div>
      </div>

      <!-- Daily Reminder -->
      ${todayReminder ? `
        <div class="insight-block animate-fade-in-up stagger-item" style="margin-bottom: var(--space-xl);">
          <div class="insight-text">${Utils.escapeHtml(todayReminder.content)}</div>
          <div class="insight-source">💡 ${Utils.escapeHtml(todayReminder.title)}</div>
        </div>
      ` : ''}

      <!-- Stats -->
      <div class="grid-2 stagger-item" style="margin-bottom: var(--space-xl); max-width: 600px;">
        <div class="stat-card" style="grid-column: span 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md); padding: var(--space-lg);">
          <div style="text-align:center;">
            <div class="stat-value">${lessons.length}</div>
            <div class="stat-label">Bài học</div>
          </div>
          <div style="text-align:center;">
            <div class="stat-value">${rules.length}</div>
            <div class="stat-label">Quy luật</div>
          </div>
          <div style="text-align:center;">
            <div class="stat-value">${reminders.length}</div>
            <div class="stat-label">Lời nhắc</div>
          </div>
          <div style="text-align:center;">
            <div class="stat-value">${journals.length}</div>
            <div class="stat-label">Nhật ký</div>
          </div>
        </div>
      </div>

      <!-- Daily Insight from Tử Vi -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div class="section-title"><span class="icon">🌟</span> Chiêm nghiệm hôm nay</div>
        <div class="card card-highlight" style="cursor:pointer;" onclick="App.DetailPanel.show('${Utils.escapeHtml(dailyInsight.title)}', \`
          <p style='line-height:1.8;color:var(--text-secondary);margin-bottom:var(--space-md);'>${Utils.escapeHtml(dailyInsight.content).replace(/'/g, "\\'")}</p>
          <div class='tags-container'>${Utils.renderTags(dailyInsight.tags).replace(/'/g, "\\'")}</div>
        \`)">
          <div class="flex items-center gap-sm mb-sm">
            <span class="tag ${Utils.getTypeClass(dailyInsight.type)}">${Utils.getTypeIcon(dailyInsight.type)} ${dailyInsight.type === 'strength' ? 'Điểm mạnh' : dailyInsight.type === 'weakness' ? 'Điểm yếu' : dailyInsight.type === 'warning' ? 'Lưu ý' : 'Thông định'}</span>
            <span class="text-xs text-muted">Mục #${dailyInsight.id}</span>
          </div>
          <h3 class="card-title">${Utils.escapeHtml(dailyInsight.title)}</h3>
          <p class="card-text">${Utils.escapeHtml(dailyInsight.content).substring(0, 200)}...</p>
          <div class="tags-container">
            ${Utils.renderTags(dailyInsight.tags.slice(0, 4))}
          </div>
        </div>
      </div>

      <!-- Feature Quick-Links Hub -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div class="section-title"><span class="icon">🗺️</span> Khám phá tính năng</div>
        <div class="feature-hub-grid">

          <div class="feature-hub-card" onclick="App.Router.navigate('dashboard/morning')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#f59e0b22,#ef444422);">☀️</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Bản Tin Cải Mệnh Sáng</div>
              <div class="feature-hub-desc">Nghi thức sáng, thực dưỡng Ngũ Hành & checklist hàng ngày</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('astrology/chart')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#8b5cf622,#6366f122);">🔮</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Lá Số Tử Vi & Vận Hạn</div>
              <div class="feature-hub-desc">Xem lá số, vận hạn từng thời kỳ, la bàn nhân sự</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('astrology/health')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#10b98122,#3b82f622);">🏥</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Trợ Lý Sức Khỏe Ngũ Hành</div>
              <div class="feature-hub-desc">Bản đồ cơ thể, thực dưỡng & phác đồ sức khỏe cá nhân</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('astrology/heatmap')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#f59e0b22,#10b98122);">⚡</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Nhịp Giờ Hoàng Đạo</div>
              <div class="feature-hub-desc">Ma trận năng lượng 12 canh giờ & tìm giờ tốt cho công việc</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('oracle/compass')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#06b6d422,#2563eb22);">🧭</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">La Bàn Kỳ Môn Độn Giáp</div>
              <div class="feature-hub-desc">Bát Môn cát hung, hướng xuất hành & thần cát theo ngày</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('oracle/iching')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#a855f722,#6366f122);">☯</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Quẻ Dịch & Nhật Ký Gieo Quẻ</div>
              <div class="feature-hub-desc">64 quẻ Kinh Dịch, gieo quẻ hỏi đáp & lưu nhật ký</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('astrology/overview')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#c9a96e22,#f59e0b22);">🌟</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Tổng Quan Cuộc Đời</div>
              <div class="feature-hub-desc">Bản đồ cuộc đời từ lá số, điểm mạnh-yếu toàn diện</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

          <div class="feature-hub-card" onclick="App.Router.navigate('knowledge')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#16a34a22,#06b6d422);">📓</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Tri Thức & Phản Tư</div>
              <div class="feature-hub-desc">Bài học sống, quy luật, nhật ký & lời nhắc cá nhân</div>
            </div>
            <div class="feature-hub-arrow">→</div>
          </div>

        </div>
      </div>

      <!-- Strengths & Weaknesses -->
      <div class="grid-2 stagger-item" style="margin-bottom: var(--space-xl);">
        <div>
          <div class="section-title"><span class="icon">💪</span> Điểm mạnh cốt lõi</div>
          <div class="tags-container" style="gap:var(--space-sm);">
            ${allStrengths.slice(0, 10).map(s => `<span class="tag tag-strength">${s}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="section-title"><span class="icon">⚠️</span> Cần rèn luyện</div>
          <div class="tags-container" style="gap:var(--space-sm);">
            ${allWeaknesses.slice(0, 10).map(w => `<span class="tag tag-weakness">${w}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Recent Lessons -->
      ${recentLessons.length > 0 ? `
        <div class="stagger-item" style="margin-bottom: var(--space-xl);">
          <div class="flex items-center justify-between mb-md">
            <div class="section-title" style="margin-bottom:0"><span class="icon">📖</span> Bài học gần đây</div>
            <button class="btn btn-ghost btn-sm" onclick="App.Router.navigate('lessons')">Xem tất cả →</button>
          </div>
          <div class="grid-auto">
            ${recentLessons.map(lesson => `
              <div class="card">
                <h4 class="card-title" style="font-size:var(--text-base);">${Utils.escapeHtml(lesson.title)}</h4>
                <p class="card-text">${Utils.escapeHtml(lesson.content).substring(0, 120)}...</p>
                <div class="card-meta">
                  <span>${Utils.timeAgo(lesson.createdAt)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Final Message -->
      <div class="stagger-item" style="margin-bottom:var(--space-xl);">
        <div class="insight-block" style="background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-card)); text-align:center;">
          <div class="insight-text" style="font-size:var(--text-xl);">
            "Nước chảy đá mòn, lấy nhu thắng cương"
          </div>
          <div class="insight-source">Thông điệp cuộc đời • Lá số 8/10</div>
        </div>
      </div>
    `;

    // Bind events
    if (userProfile) {
      renderCalendar(userProfile, currentTaskType);

      // Quick Date Filters Handler
      const quickFilters = container.querySelector('#quick-date-filters');
      if (quickFilters) {
        quickFilters.querySelectorAll('.segmented-tab').forEach(btn => {
          btn.addEventListener('click', (e) => {
            quickFilters.querySelectorAll('.segmented-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.dataset.quickDate;
            const now = new Date();

            if (filterType === 'today') {
              currentCalDate = new Date();
              renderCalendar(userProfile, currentTaskType);
              renderMasterDailyBoard(new Date(), userProfile, currentTaskType);
            } else if (filterType === 'tomorrow') {
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              currentCalDate = tomorrow;
              renderCalendar(userProfile, currentTaskType);
              renderMasterDailyBoard(tomorrow, userProfile, currentTaskType);
            } else if (filterType === 'weekend') {
              const sat = new Date(now);
              sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
              currentCalDate = sat;
              renderCalendar(userProfile, currentTaskType);
              renderMasterDailyBoard(sat, userProfile, currentTaskType);
            } else if (filterType === 'scan-exam' || filterType === 'scan-contract') {
              const goalType = filterType === 'scan-exam' ? 'EXAM' : 'CONTRACT';
              const scanSelect = container.querySelector('#goal-scanner-type');
              const scanBtn = container.querySelector('#btn-run-goal-scan');
              if (scanSelect && scanBtn) {
                scanSelect.value = goalType;
                scanBtn.click();
              }
            }
          });
        });
      }

      document.getElementById('cal-task-type').addEventListener('change', (e) => {
        currentTaskType = e.target.value;
        renderCalendar(userProfile, currentTaskType);
        renderMasterDailyBoard(currentCalDate, userProfile, currentTaskType);
      });

      document.getElementById('btn-cal-prev').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar(userProfile, currentTaskType);
      });
      document.getElementById('btn-cal-next').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar(userProfile, currentTaskType);
      });

      // Goal scanner run
      const scanBtn = container.querySelector('#btn-run-goal-scan');
      const scanSelect = container.querySelector('#goal-scanner-type');
      const scanResultContainer = container.querySelector('#goal-scan-results-container');

      if (scanBtn && scanSelect && scanResultContainer) {
        scanBtn.addEventListener('click', () => {
          const goalType = scanSelect.value;
          const topDates = window.AstrologyLogic.scanGoalDates(new Date(), 30, goalType, userProfile);

          if (topDates.length === 0) return;

          scanResultContainer.style.display = 'block';
          scanResultContainer.innerHTML = `
            <div style="font-weight:700; font-size:0.95em; color:var(--accent-primary); margin-bottom:10px;">
              🌟 TOP 3 NGÀY VÀNG TỐI ƯU NHẤT — ${topDates[0].config.icon} ${topDates[0].config.label}
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
              ${topDates.map((d, idx) => `
                <div class="card" style="padding:12px; border-left:4px solid ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309'}; cursor:pointer;" data-scan-date="${d.dateStr}">
                  <div style="display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:0.9em;">
                    <span>${idx === 0 ? '🥇 Rank #1' : idx === 1 ? '🥈 Rank #2' : '🥉 Rank #3'}: ${d.formattedDate}</span>
                    <span style="color:var(--accent-primary); font-size:1.1em;">${d.goalScore}đ</span>
                  </div>
                  <div style="font-size:0.8em; color:var(--text-secondary); margin-top:4px;">
                    Can Chi: ${d.canChi} (${d.rating})
                  </div>
                  <div style="font-size:0.78em; color:var(--color-success); font-weight:600; margin-top:4px;">
                    ⌛ Giờ Vàng: ${d.bestHours.slice(0, 2).join(', ')}
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          scanResultContainer.querySelectorAll('[data-scan-date]').forEach(card => {
            card.addEventListener('click', (e) => {
              const dStr = e.currentTarget.dataset.scanDate;
              const [y, m, d] = dStr.split('-');
              const selectedD = new Date(y, m - 1, d);
              renderHourlyRhythmWidget(selectedD, userProfile);
              renderMasterDailyBoard(selectedD, userProfile, currentTaskType);
              showDayDetail(selectedD, userProfile, currentTaskType);
            });
          });
        });
      }
    }
  }

  function renderCalendar(userProfile, taskType) {
    const monthYearStr = currentCalDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    document.getElementById('cal-month-year').textContent = monthYearStr;

    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
      <div class="calendar-grid">
        ${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => `<div class="calendar-header-day">${d}</div>`).join('')}
    `;

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      html += `<div></div>`;
    }

    // Days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const iterDate = new Date(year, month, i);
      const isToday = iterDate.getDate() === today.getDate() && iterDate.getMonth() === today.getMonth() && iterDate.getFullYear() === today.getFullYear();

      let dayScore = null;
      let statusClass = '';

      if (window.AstrologyLogic && window.AstrologyLogic.evaluatePersonalizedDay && typeof Lunar !== 'undefined') {
        dayScore = window.AstrologyLogic.evaluatePersonalizedDay(iterDate, userProfile, taskType);
      }

      if (dayScore) {
        if (dayScore.total_score >= 80) {
          statusClass = 'good';
        } else if (dayScore.total_score >= 60) {
          statusClass = 'neutral';
        } else if (dayScore.total_score < 40) {
          statusClass = 'bad';
        }
      }

      html += `
        <div class="cal-day ${statusClass} ${isToday ? 'cal-today' : ''}" data-date="${year}-${month + 1}-${i}">
          <div class="cal-day-num">${i}</div>
          ${dayScore ? `<div class="cal-score">${dayScore.total_score}đ</div>` : ''}
        </div>
      `;
    }

    html += `</div>`;
    grid.innerHTML = html;

    // Attach click events to days
    grid.querySelectorAll('.cal-day').forEach(el => {
      el.addEventListener('click', (e) => {
        grid.querySelectorAll('.cal-day').forEach(d => d.style.borderColor = '');
        el.style.borderColor = 'var(--accent-primary)';
        el.style.boxShadow = '0 0 15px var(--accent-glow)';

        const [y, m, d] = e.currentTarget.dataset.date.split('-');
        const dateObj = new Date(y, m - 1, d);
        renderHourlyRhythmWidget(dateObj, userProfile);
        renderMasterDailyBoard(dateObj, userProfile, taskType);
      });
    });

    // Render initial hourly rhythm widget for current/today date
    renderHourlyRhythmWidget(new Date(), userProfile);
  }

  function renderHourlyRhythmWidget(selectedDate, userProfile) {
    const container = document.getElementById('calendar-hourly-rhythm-widget');
    if (!container) return;

    const AL = window.AstrologyLogic;
    if (!AL || typeof AL.evaluateHourlyRhythm !== 'function') {
      container.innerHTML = '';
      return;
    }

    try {
      const rhythm = AL.evaluateHourlyRhythm(selectedDate, userProfile);
      if (!rhythm || !rhythm.hours) return;
      const dateFormatted = selectedDate.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', year: 'numeric' });

      container.innerHTML = `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-weight:700; font-size:0.9rem; color:var(--accent-primary); display:flex; align-items:center; gap:6px;">
            <span>⚡</span> Nhịp Giờ Hoàng Đạo 12 Canh Giờ (${dateFormatted})
          </div>
          <div style="font-size:0.75rem; color:var(--text-tertiary);">
            Ngày Canh ${rhythm.chiNgay || ''} • Di chuột vào giờ để xem chi tiết
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(135px, 1fr)); gap:8px;">
          ${rhythm.hours.map(g => {
            let statusColor = 'var(--color-success)';
            if (g.status === 'TIEU_CAT') statusColor = 'var(--color-info)';
            else if (g.status === 'BINH_HOA') statusColor = 'var(--color-warning)';
            else if (g.status === 'THAN_TRONG') statusColor = '#f97316';
            else if (g.status === 'XUNG_MENH') statusColor = 'var(--color-danger)';

            return `
              <div style="background:var(--bg-card); padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--border-color); border-top:2px solid ${statusColor}; transition:all 0.2s ease;" title="${g.kinh}: ${g.hanhDong}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; font-size:0.82rem; color:${statusColor};">${g.chi} (${g.start}h-${g.endH}h)</span>
                  <span style="font-weight:800; font-size:0.82rem; color:${statusColor};">${g.score}đ</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-tertiary); margin-top:2px;">
                  ${g.isHoangDao ? '🌟 Hoàng Đạo' : '⚫ Hắc Đạo'}
                </div>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${g.lucDieu}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch(e) {
      console.error("Lỗi khi render widget nhịp giờ:", e);
    }
  }

  function renderMasterDailyBoard(selectedDate, userProfile, taskType) {
    const container = document.getElementById('master-daily-intelligence-board');
    if (!container) return;

    const AL = window.AstrologyLogic;
    if (!AL || !AL.getMasterDailyIntelligence) return;

    const info = AL.getMasterDailyIntelligence(selectedDate, userProfile, taskType);
    const dateFormatted = selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    let scoreColor = 'var(--accent-primary)';
    if (info.scoreResult) {
      if (info.scoreResult.total_score >= 80) scoreColor = 'var(--color-success)';
      else if (info.scoreResult.total_score >= 60) scoreColor = 'var(--color-warning)';
      else scoreColor = 'var(--color-danger)';
    }

    container.innerHTML = `
      <div class="tuvi-card" style="background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%);">
        <div class="tuvi-card-header">
          <div class="tuvi-card-title-group">
            <div class="tuvi-card-icon">☀️</div>
            <div>
              <div class="tuvi-card-title">BẢNG NĂNG LƯỢNG MASTER 13-TRONG-1 (${dateFormatted})</div>
              <div class="tuvi-card-subtitle">${info.lunarStr}</div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-family:var(--font-heading); font-size:1.6rem; font-weight:800; color:${scoreColor};">${info.scoreResult ? info.scoreResult.total_score : 80}đ</span>
            <button class="btn btn-primary btn-sm" id="btn-open-selected-detail">
              📋 Xem Modal Đa Tầng →
            </button>
          </div>
        </div>

        <!-- Biorhythm Waves (Sóng Sinh Học 30 Ngày Tích Hợp) -->
        <div style="background:var(--bg-card); padding:12px 14px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:16px;">
          <div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            🌊 SÓNG NHỊP SINH HỌC NGÀY (BIORHYTHM)
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; color:var(--color-success);">
                <span>💪 Thể Chất (Physical)</span>
                <span>${info.biorhythms.physical}%</span>
              </div>
              <div class="indicator-progress-bg" style="height:5px;">
                <div class="indicator-progress-fill" style="width:${Math.max(10, Math.abs(info.biorhythms.physical))}%; background:var(--color-success);"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; color:var(--color-info);">
                <span>❤️ Cảm Xúc (Emotional)</span>
                <span>${info.biorhythms.emotional}%</span>
              </div>
              <div class="indicator-progress-bg" style="height:5px;">
                <div class="indicator-progress-fill" style="width:${Math.max(10, Math.abs(info.biorhythms.emotional))}%; background:var(--color-info);"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; color:var(--accent-primary);">
                <span>🧠 Trí Tuệ (Intellectual)</span>
                <span>${info.biorhythms.intellectual}%</span>
              </div>
              <div class="indicator-progress-bg" style="height:5px;">
                <div class="indicator-progress-fill" style="width:${Math.max(10, Math.abs(info.biorhythms.intellectual))}%; background:var(--accent-primary);"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6 Main Energy Modules Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 16px;">
          
          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🎨 Y PHỤC NẠP KHÍ</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-top:2px;">
              Màu ${info.remedy.wardrobe.colors[0]} & ${info.remedy.wardrobe.colors[1]}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${info.remedy.wardrobe.accessories}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">☕ THỰC DƯỠNG TRÀ SÁNG</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-top:2px;">
              ${info.remedy.dietary.tea.split(',')[0]}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Nuôi dưỡng: ${info.remedy.dietary.organ}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🧭 HƯỚNG XUẤT HÀNH CÁT</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-success); margin-top:2px;">
              Tài Thần: Hướng ${info.thanCat.taiThan}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Hỷ Thần: Hướng ${info.thanCat.hyThan} • Quý Nhân: ${info.thanCat.quyNhan}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">☯ QUẺ CHỦ NGÀY MAI HOA</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-secondary); margin-top:2px;">
              ${info.queInfo.name}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Hào động: Hào ${info.movingLine}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🩺 BẢO VỆ SỨC KHỎE</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-warning); margin-top:2px;">
              ${info.healthFocus.organ}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${info.healthFocus.warning.substring(0, 26)}...</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🖥️ CỬU TINH BÀN LÀM VIỆC</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-info); margin-top:2px;">
              Cửu Tử (Nam) & Bát Bạch (Đông Nam)
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Đặt Laptop / Điện thoại ở Nam & Đông Nam</div>
          </div>

        </div>

        <!-- Integrated Karma Quests (Nhiệm Vụ Cải Mệnh Ngày) -->
        <div style="background:var(--bg-card); padding:12px 14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--accent-primary);">
              🌱 CHECKLIST NHIỆM VỤ CẢI MỆNH NGÀY (${info.karmaQuests.length} Task)
            </div>
            <div style="font-size:0.75rem; color:var(--text-tertiary);">
              Tích lũy vốn Phúc Đức Cung Phúc Đức Ảo
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
            ${info.karmaQuests.slice(0, 4).map(q => `
              <div style="background:var(--bg-tertiary); padding:8px 10px; border-radius:6px; border:1px solid var(--border-color); font-size:0.78rem; display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem;">${q.icon || '✨'}</span>
                <div style="flex:1;">
                  <div style="font-weight:600; color:var(--text-primary);">${q.title}</div>
                  <div style="font-size:0.7rem; color:var(--text-tertiary);">${q.desc || ''} (+${q.rewardKarma || 10}đ Phúc)</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const detailBtn = container.querySelector('#btn-open-selected-detail');
    if (detailBtn) {
      detailBtn.addEventListener('click', () => {
        showDayDetail(selectedDate, userProfile, taskType);
      });
    }
  }

  // Modal Chi Tiết Ngày Đa Tầng (7 Tabs Tích Hợp)
  function showDayDetail(dateObj, userProfile, taskType) {
    const info = getDailyIntegratedDetails(dateObj, userProfile, taskType);
    const dateStr = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const scoreResult = info.scoreResult;

    let color = 'var(--text-base)';
    if (scoreResult) {
      if (scoreResult.total_score >= 85) color = 'var(--success-color)';
      else if (scoreResult.total_score >= 70) color = 'var(--primary-color)';
      else if (scoreResult.total_score >= 50) color = 'var(--warning-color, #f59e0b)';
      else color = 'var(--danger-color)';
    }

    const content = `
      <div class="day-detail-modal-container">
        <!-- Top Score Header -->
        <div style="text-align: center; margin-bottom: 16px; background: var(--bg-card); padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 2.4rem; font-weight: 800; color: ${color}; line-height: 1.1;">
            ${scoreResult ? scoreResult.total_score : 80}<span style="font-size: 1.2rem">/100</span>
          </div>
          <div style="font-size: 1.05rem; margin-top: 4px; color: ${color}; font-weight: 700;">Đánh giá: ${scoreResult ? scoreResult.rating : 'Khá Tốt'}</div>
          <div style="font-size: 0.85em; margin-top: 2px; color: var(--text-muted);">${info.lunarStr}</div>
        </div>

        <!-- Integrated 7 Sub-Tabs -->
        <div class="modal-tab-headers" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; margin-bottom:14px; border-bottom:1px solid var(--border-color);">
          <button class="btn btn-sm modal-tab-btn active" data-tab="tab-cat-hung" style="white-space:nowrap; padding:6px 12px;">🔮 Cát Hung</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-hourly-rhythm" style="white-space:nowrap; padding:6px 12px;">⚡ Nhịp Giờ 24H</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-remedy" style="white-space:nowrap; padding:6px 12px;">🎨 Y Phục & Trà</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-qimen" style="white-space:nowrap; padding:6px 12px;">🧭 Hướng Kỳ Môn</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-iching" style="white-space:nowrap; padding:6px 12px;">☯ Quẻ Chủ Ngày</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-health" style="white-space:nowrap; padding:6px 12px;">🏥 Sức Khỏe</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-tasks" style="white-space:nowrap; padding:6px 12px;">🌱 Nhiệm Vụ</button>
        </div>

        <!-- Tab 1: Cát Hung & Vận Hạn -->
        <div class="modal-tab-pane" id="tab-cat-hung" style="display:block;">
          ${scoreResult && scoreResult.hard_stop_flags && scoreResult.hard_stop_flags.length > 0 ? `
          <div style="background: rgba(220, 38, 38, 0.1); padding: 12px; border-radius: 8px; border: 1px solid var(--danger-color); margin-bottom: 12px;">
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--danger-color);">⚠️ Cảnh Báo Tuyệt Đối (Hard Stop)</div>
            <div style="color: var(--text-base); font-size: 0.9em;">${scoreResult.hard_stop_flags.join('<br>')}</div>
          </div>
          ` : ''}

          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 12px;">
            <div style="font-weight: 700; margin-bottom: 6px; color: var(--accent-primary); font-size:0.9em;">🔎 Điểm Nhấn Nổi Bật</div>
            <ul style="color: var(--text-base); line-height: 1.5; margin: 0; padding-left: 18px; font-size: 0.88em;">
              ${scoreResult && scoreResult.key_highlights && scoreResult.key_highlights.length > 0 ? scoreResult.key_highlights.map(h => `<li>${h}</li>`).join('') : '<li>Không có điểm hung tinh nghiêm trọng. Ngày bình hòa.</li>'}
            </ul>
          </div>

          ${scoreResult && scoreResult.breakdown ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: var(--bg-main); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
              <div style="font-weight: 600; font-size: 0.78em; color: var(--text-muted);">Tầng 1: Lịch Cổ Điển</div>
              <div style="font-size: 1.3em; font-weight: 800; color: var(--text-primary);">${scoreResult.breakdown.layer1_global_score}</div>
            </div>
            <div style="background: var(--bg-main); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
              <div style="font-weight: 600; font-size: 0.78em; color: var(--text-muted);">Tầng 2: Can Chi Tuổi</div>
              <div style="font-size: 1.3em; font-weight: 800; color: var(--text-primary);">${scoreResult.breakdown.layer2_can_chi_score}</div>
            </div>
            <div style="background: var(--bg-main); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
              <div style="font-weight: 600; font-size: 0.78em; color: var(--text-muted);">Tầng 3: Tử Vi Mệnh</div>
              <div style="font-size: 1.3em; font-weight: 800; color: var(--text-primary);">${scoreResult.breakdown.layer3_tu_vi_score}</div>
            </div>
            <div style="background: var(--bg-main); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
              <div style="font-weight: 600; font-size: 0.78em; color: var(--text-muted);">Tầng 4: Mục Đích CV</div>
              <div style="font-size: 1.3em; font-weight: 800; color: var(--text-primary);">${scoreResult.breakdown.layer4_task_score}</div>
            </div>
          </div>
          ` : ''}

          ${scoreResult && scoreResult.best_hours && scoreResult.best_hours.length > 0 ? `
          <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; border: 1px solid var(--success-color);">
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--success-color); font-size:0.9em;">⌛ Khung Giờ Hoàng Đạo Tối Ưu</div>
            <div style="color: var(--text-base); line-height: 1.5; font-size:0.9em;">
              <span style="font-weight:bold; color:var(--success-color);">${scoreResult.best_hours.join(', ')}</span>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Tab 2: Nhịp Giờ Hoàng Đạo 24H -->
        <div class="modal-tab-pane" id="tab-hourly-rhythm" style="display:none;">
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:var(--accent-primary); font-size:0.92rem; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
              <span>⚡ Chi Tiết Ma Trận 12 Canh Giờ Hoàng Đạo</span>
              <span style="font-size:0.78rem; font-weight:600; color:var(--text-tertiary);">${dateStr}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">
              Điểm số, Lục Diệu, Hoàng/Hắc Đạo & Lời khuyên Kinh Lạc từng khung giờ trong ngày.
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px; max-height:420px; overflow-y:auto; padding-right:4px;">
            ${(function() {
              const rhythm = window.AstrologyLogic ? window.AstrologyLogic.evaluateHourlyRhythm(dateObj, userProfile) : null;
              if (!rhythm || !rhythm.hours) return '<div style="padding:12px; color:var(--text-tertiary);">Chưa có dữ liệu nhịp giờ.</div>';
              return rhythm.hours.map(g => {
                let color = 'var(--color-success)';
                if (g.status === 'TIEU_CAT') color = 'var(--color-info)';
                else if (g.status === 'BINH_HOA') color = 'var(--color-warning)';
                else if (g.status === 'THAN_TRONG') color = '#f97316';
                else if (g.status === 'XUNG_MENH') color = 'var(--color-danger)';

                return `
                  <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); border-left:4px solid ${color};">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <div style="font-weight:700; font-size:0.9rem; color:${color};">
                        Giờ ${g.chi} (${g.start}:00 - ${g.endH.toString().padStart(2,'0')}:00)
                      </div>
                      <div style="font-weight:800; font-size:1.05rem; color:${color};">${g.score}đ</div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:4px; font-weight:600;">
                      ${g.isHoangDao ? '🌟 Hoàng Đạo' : '⚫ Hắc Đạo'} • ${g.lucDieu}
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
                      🫀 ${g.kinh}
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">
                      ${g.hanhDong}
                    </div>
                  </div>
                `;
              }).join('');
            })()}
          </div>
        </div>

        <!-- Tab 2: Y Phục & Thực Dưỡng -->
        <div class="modal-tab-pane" id="tab-remedy" style="display:none;">
          <div class="card mb-sm" style="padding:12px; background:var(--bg-main);">
            <div style="font-weight:700; font-size:0.95em; color:var(--accent-primary); margin-bottom:6px;">
              ${info.remedy.icon} Đơn Thuốc Nạp Khí Ngũ Hành (${info.hanhNgay})
            </div>
            <div style="font-size:0.85em; color:var(--text-secondary); line-height:1.5;">
              <strong>🎨 Trang Phục Nạp Khí:</strong> Ưu tiên màu ${info.remedy.wardrobe.colors.join(', ')}.<br>
              <strong>💍 Phụ Kiện:</strong> ${info.remedy.wardrobe.accessories}.<br>
              <strong>🚫 Tránh Màu:</strong> ${info.remedy.wardrobe.avoidColors.join(', ')}.
            </div>
          </div>

          <div class="card mb-sm" style="padding:12px; background:var(--bg-main);">
            <div style="font-weight:700; font-size:0.95em; color:#10b981; margin-bottom:6px;">
              ☕ Thực Dưỡng & Trà Dưỡng Sinh Đông Y
            </div>
            <div style="font-size:0.85em; color:var(--text-secondary); line-height:1.5;">
              <strong>🫀 Tạng Phủ Ưu Tiên:</strong> ${info.remedy.dietary.organ}.<br>
              <strong>🍵 Trà Sáng:</strong> ${info.remedy.dietary.tea}.<br>
              <strong>🥣 Bữa Sáng Gợi Ý:</strong> ${info.remedy.dietary.breakfast}.<br>
              <strong>⏰ Khung Giờ Vượng Kinh Lạc:</strong> ${info.remedy.dietary.time}.
            </div>
          </div>

          <div class="card" style="padding:12px; background:var(--bg-main);">
            <div style="font-weight:700; font-size:0.95em; color:#8b5cf6; margin-bottom:6px;">
              🎵 Âm Nhạc Solfeggio & Vi Hành Động
            </div>
            <div style="font-size:0.85em; color:var(--text-secondary); line-height:1.5;">
              <strong>🎧 Tần Số Tần Tảo:</strong> ${info.remedy.environment.frequency}.<br>
              <strong>🌸 Tinh Dầu Mùi Hương:</strong> ${info.remedy.environment.oil}.<br>
              <strong>🧘 Vi Hành Động:</strong> "${info.remedy.mindset}"
            </div>
          </div>
        </div>

        <!-- Tab 3: Hướng Xuất Hành Kỳ Môn -->
        <div class="modal-tab-pane" id="tab-qimen" style="display:none;">
          <div style="background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:10px;">
            <div style="font-weight:700; color:var(--accent-primary); font-size:0.9em; margin-bottom:6px;">
              🧭 Phương Vị Thần Cát Ngày Can ${info.canNgay}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.85em;">
              <div style="background:rgba(16,185,129,0.08); padding:8px; border-radius:6px; border:1px solid rgba(16,185,129,0.2);">
                <div style="color:var(--text-muted);">💰 Tài Thần (Cầu Tài)</div>
                <div style="font-weight:700; color:#10b981; font-size:1.1em;">Hướng ${info.thanCat.taiThan}</div>
              </div>
              <div style="background:rgba(59,130,246,0.08); padding:8px; border-radius:6px; border:1px solid rgba(59,130,246,0.2);">
                <div style="color:var(--text-muted);">🎉 Hỷ Thần (Vui Vẻ)</div>
                <div style="font-weight:700; color:#3b82f6; font-size:1.1em;">Hướng ${info.thanCat.hyThan}</div>
              </div>
            </div>
            <div style="margin-top:8px; font-size:0.82em; color:var(--text-secondary);">
              👑 <strong>Quý Nhân Hỗ Trợ:</strong> Hướng ${info.thanCat.quyNhan}
            </div>
          </div>

          <div style="background:var(--bg-main); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
            <div style="font-weight:700; font-size:0.9em; margin-bottom:6px;">🌟 Kỹ Thuật "Xuất Hành Nạp Khí":</div>
            <p style="font-size:0.85em; color:var(--text-secondary); margin:0; line-height:1.5;">
              Khi cất bước ra khỏi nhà vào đầu ngày, hãy rẽ theo hướng <strong>${info.thanCat.taiThan}</strong> hoặc <strong>${info.thanCat.hyThan}</strong> khoảng 100 - 200m để "nạp cát khí" trước khi di chuyển đến điểm hẹn.
            </p>
          </div>
        </div>

        <!-- Tab 4: Quẻ Dịch Chủ Ngày -->
        <div class="modal-tab-pane" id="tab-iching" style="display:none;">
          <div style="text-align:center; padding:16px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); margin-bottom:10px;">
            <div style="font-size:2em; margin-bottom:4px;">☯</div>
            <div style="font-size:1.2em; font-weight:800; color:var(--accent-primary);">${info.queInfo.name}</div>
            <div style="font-size:0.85em; color:var(--text-muted); margin-top:2px;">
              Thượng quẻ: ${info.upperName} | Hạ quẻ: ${info.lowerName} | Hào động: Hào ${info.movingLine}
            </div>
          </div>

          <div style="background:var(--bg-main); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
            <div style="font-weight:700; font-size:0.9em; color:var(--accent-primary); margin-bottom:4px;">💡 Lời Khuyên Kinh Dịch Cho Ngày:</div>
            <p style="font-size:0.88em; color:var(--text-secondary); margin:0; line-height:1.5;">
              ${info.queInfo.advice}
            </p>
          </div>
        </div>

        <!-- Tab 5: Cảnh Báo Sức Khỏe -->
        <div class="modal-tab-pane" id="tab-health" style="display:none;">
          <div style="background:rgba(245,158,11,0.08); padding:12px; border-radius:8px; border:1px solid rgba(245,158,11,0.3); margin-bottom:10px;">
            <div style="font-weight:700; color:#f59e0b; font-size:0.9em; margin-bottom:4px;">🩺 Vùng Cơ Thể Cần Chú Ý Hôm Nay:</div>
            <div style="font-size:1.1em; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${info.healthFocus.organ}</div>
            <p style="font-size:0.85em; color:var(--text-secondary); margin:0;">${info.healthFocus.warning}</p>
          </div>

          <div style="background:var(--bg-main); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
            <div style="font-weight:700; font-size:0.88em; margin-bottom:4px;">🌿 Lời Khuyên Trị Liệu Đông Y:</div>
            <p style="font-size:0.85em; color:var(--text-secondary); margin:0; line-height:1.5;">
              Uống trà dưỡng sinh đúng giờ kinh lạc (${info.remedy.dietary.time}) giúp hạ hỏa tạng phủ và giảm áp lực thần kinh.
            </p>
          </div>
        </div>

        <!-- Tab 6: Nhiệm Vụ Cải Mệnh -->
        <div class="modal-tab-pane" id="tab-tasks" style="display:none;">
          <div style="padding:4px 0;">
            <div style="font-size:0.88em; color:var(--text-secondary); margin-bottom:10px;">
              Thực hiện các hành động thiện lành dưới đây để hóa giải hung tinh và tích điểm Phúc Đức trong ngày:
            </div>
            <div id="modal-task-list-container">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    const modalOverlay = App.Modal.show(content, { title: `Cát Hung & Đơn Thuốc Ngày ${dateStr}` });

    if (modalOverlay) {
      // Bind tab switching logic inside modal
      const tabBtns = modalOverlay.querySelectorAll('.modal-tab-btn');
      const tabPanes = modalOverlay.querySelectorAll('.modal-tab-pane');

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.dataset.tab;
          tabBtns.forEach(b => {
            b.classList.toggle('active', b === btn);
            b.style.background = b === btn ? 'var(--accent-primary)' : 'transparent';
            b.style.color = b === btn ? '#fff' : 'var(--text-secondary)';
          });

          tabPanes.forEach(pane => {
            pane.style.display = pane.id === targetTab ? 'block' : 'none';
          });

          if (targetTab === 'tab-tasks') {
            const taskContainer = modalOverlay.querySelector('#modal-task-list-container');
            if (taskContainer && window.renderTasks) {
              window.renderTasks(taskContainer);
            }
          }
        });
      });
    }
  }

  window.renderDashboard = renderDashboard;
})();
