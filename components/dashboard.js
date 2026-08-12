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

    // 7. Tử Vi & Cách Cục (Ni Hải Hạ Engine)
    let ziweiInsight = {
      menhChi: 'Tý',
      cucName: 'Hỏa Lục Cục',
      patterns: [],
      topPatternName: 'Chưa quét cách cục',
      adviceText: 'Giữ tâm thái kiên định, phát huy tối đa năng lượng bản mệnh.'
    };
    if (AL && AL.TuViEngine) {
      try {
        const tuViChart = AL.TuViEngine.calculateTuViChart({
          day: userProfile?.day || 1,
          month: userProfile?.month || 1,
          year: userProfile?.year || 1990,
          hour: (userProfile?.hour !== undefined && userProfile?.hour !== null ? userProfile.hour : 12),
          minute: userProfile?.minute || 0,
          gender: userProfile?.gender || 'Nam',
          canNam: userProfile?.canNam || 'Canh',
          chiNam: userProfile?.chiNam || 'Thìn'
        });
        if (tuViChart && tuViChart.thienBan) {
          ziweiInsight.menhChi = tuViChart.thienBan.menhChi || 'Tý';
          ziweiInsight.cucName = tuViChart.thienBan.cucName || 'Hỏa Lục Cục';
        }
        if (window.ZiweiPatterns && tuViChart) {
          const detected = window.ZiweiPatterns.detectPatterns(tuViChart);
          if (detected && detected.length > 0) {
            ziweiInsight.patterns = detected;
            ziweiInsight.topPatternName = detected[0].name;
            ziweiInsight.adviceText = detected[0].description || ziweiInsight.adviceText;
          }
        }
      } catch (err) {
        console.warn("Dashboard Ziwei Insight calculation error:", err);
      }
    }

    let dailyTransit = null;
    let dailyRemedy = null;
    if (AL && typeof AL.calculateDailyTransit === 'function') {
        dailyTransit = AL.calculateDailyTransit(dateObj, userProfile);
        dailyRemedy = AL.getDailyRemedy(dailyTransit, userProfile);
    }

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
      bio,
      ziweiInsight,
      dailyTransit,
      dailyRemedy
    };
  }

  function renderDashboard(container, params) {
    if (params && params[0]) {
      if (['command', 'morning', 'tasks', 'overview', 'scanner', 'main', 'reaction'].includes(params[0])) {
        if (params[0] === 'command') activeDashTab = 'command';
        else if (params[0] === 'morning') activeDashTab = 'morning';
        else if (params[0] === 'tasks') activeDashTab = 'tasks';
        else if (params[0] === 'scanner') activeDashTab = 'scanner';
        else if (params[0] === 'reaction') activeDashTab = 'reaction';
        else activeDashTab = 'overview';
      }
    }

    const AL = window.AstrologyLogic;
    const today = new Date();
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };
    const todayInfo = getDailyIntegratedDetails(today, userProfile, 'GENERAL');

    let fpSummary = '';
    if (AL && AL.FourPillars && typeof AL.FourPillars.calculate === 'function') {
      try {
        const fp = AL.FourPillars.calculate(today);
        fpSummary = `${fp.year.can} ${fp.year.chi} | ${fp.month.can} ${fp.month.chi} | ${fp.day.can} ${fp.day.chi}`;
      } catch (e) {
        fpSummary = `${todayInfo.canNgay} ${todayInfo.chiNgay}`;
      }
    } else {
      fpSummary = `${todayInfo.canNgay} ${todayInfo.chiNgay}`;
    }

    const score = todayInfo.scoreResult ? (todayInfo.scoreResult.total_score ?? todayInfo.scoreResult.totalScore ?? todayInfo.scoreResult.score ?? 85) : 85;
    const ratingText = todayInfo.scoreResult ? (todayInfo.scoreResult.rating ?? todayInfo.scoreResult.text ?? 'Đại Cát') : 'Đại Cát';
    const scoreColor = score >= 80 ? 'var(--color-success)' : (score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)');

    container.innerHTML = `
      <div class="dashboard-hub animate-fade-in" style="display:flex; flex-direction:column; gap:24px;">
        <!-- Option A: Today's Energy Brief Hero Card (Command Center) -->
        <div class="cmd-hero">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="display:inline-flex; align-items:center; gap:6px; background: rgba(124, 58, 237, 0.2); border: 1px solid rgba(124, 58, 237, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight:700; color: var(--accent-primary); letter-spacing:0.1em; text-transform:uppercase;">
                  <span>☯ NỘI TÂM COMMAND CENTER</span>
                </span>
                <span style="font-size:0.85rem; color: var(--text-secondary);">${todayInfo.lunarStr}</span>
              </div>
              <h1 style="font-family:'Cinzel', serif; font-size: 1.85rem; font-weight:700; color:var(--text-primary); margin:0 0 6px 0;">
                Năng Lượng Ngày Hôm Nay
              </h1>
              <p style="margin:0; font-size:0.95rem; color:var(--text-secondary);">
                Tứ Trụ Hôm Nay: <strong style="color:var(--accent-gold);">${fpSummary}</strong> — Hành <strong style="color:var(--text-primary);">${todayInfo.hanhNgay}</strong>
              </p>
            </div>

            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-ghost btn-sm" id="btn-hero-copy-ai" title="Copy dữ liệu ngày hôm nay cho AI">
                <span>📋</span> Copy Data AI
              </button>
              <button class="btn btn-primary btn-sm" id="btn-hero-tts" title="Đọc bản tin ngày" style="border-radius:24px; padding:8px 18px; font-weight:600;">
                <span>🔊</span> Đọc Bản Tin Sáng
              </button>
            </div>
          </div>

          <!-- Hero Grid Quick Stats -->
          <div class="cmd-hero-grid">
            <div class="cmd-stat-box">
              <div class="cmd-stat-icon" style="background: rgba(74, 222, 128, 0.12); color: ${scoreColor}; border: 1px solid ${scoreColor};">
                <span>⭐</span>
              </div>
              <div>
                <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Điểm Cát Hung</div>
                <div style="font-size:1.15rem; font-weight:700; color:${scoreColor};">${score} — ${ratingText}</div>
              </div>
            </div>

            <div class="cmd-stat-box">
              <div class="cmd-stat-icon" style="background: rgba(251, 191, 36, 0.12); color: var(--accent-gold);">
                <span>${todayInfo.remedy.icon || '⚪'}</span>
              </div>
              <div>
                <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Y Phục & May Mắn</div>
                <div style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">${todayInfo.remedy.wardrobe.colors[0] || 'Trắng'} · ${todayInfo.remedy.element}</div>
              </div>
            </div>

            <div class="cmd-stat-box">
              <div class="cmd-stat-icon" style="background: rgba(124, 58, 237, 0.12); color: var(--accent-primary);">
                <span>🧭</span>
              </div>
              <div>
                <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Quẻ Dịch Hôm Nay</div>
                <div style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">${todayInfo.queInfo.name}</div>
              </div>
            </div>

            <div class="cmd-stat-box" style="cursor:pointer;" onclick="App.Router.navigate('astrology')" title="Bấm để mở Hub Tử Vi">
              <div class="cmd-stat-icon" style="background: rgba(212, 168, 67, 0.12); color: var(--accent-gold); border:1px solid rgba(212, 168, 67, 0.3);">
                <span>🔮</span>
              </div>
              <div>
                <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Tử Vi & Cách Cục</div>
                <div style="font-size:1.05rem; font-weight:700; color:var(--accent-gold);">${todayInfo.ziweiInsight.topPatternName}</div>
              </div>
            </div>

            <div class="cmd-stat-box">
              <div class="cmd-stat-icon" style="background: rgba(96, 165, 250, 0.12); color: var(--color-info);">
                <span>🌊</span>
              </div>
              <div>
                <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Nhịp Sinh Học</div>
                <div style="font-size:1.05rem; font-weight:700; color:var(--color-info);">${todayInfo.bio.statusTag || 'Bình Hòa'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Switcher Tabs -->
        <div class="cmd-nav-tabs">
          <button class="cmd-nav-btn ${activeDashTab === 'overview' ? 'active' : ''}" data-tab="overview"><span>📅</span> Lịch & Nhịp Ngày</button>
          <button class="cmd-nav-btn ${activeDashTab === 'reaction' ? 'active' : ''}" data-tab="reaction"><span>⚡</span> Chuỗi Phản Ứng</button>
          <button class="cmd-nav-btn ${activeDashTab === 'scanner' ? 'active' : ''}" data-tab="scanner"><span>🎯</span> Quét Mục Tiêu Vàng</button>
          <button class="cmd-nav-btn ${activeDashTab === 'morning' ? 'active' : ''}" data-tab="morning"><span>☀️</span> Bản Tin & Thực Dưỡng</button>
          <button class="cmd-nav-btn ${activeDashTab === 'tasks' ? 'active' : ''}" data-tab="tasks"><span>🌱</span> Nhiệm Vụ Cải Mệnh</button>
          <button class="cmd-nav-btn ${activeDashTab === 'command' ? 'active' : ''}" data-tab="command"><span>📱</span> Ambient HUD</button>
        </div>

        <!-- Sub Content Area -->
        <div id="dashboard-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#dashboard-sub-content');

    // Hero action buttons
    const btnCopyAI = container.querySelector('#btn-hero-copy-ai');
    if (btnCopyAI) {
      btnCopyAI.addEventListener('click', () => {
        const text = `=== NĂNG LƯỢNG NGÀY HÔM NAY & TỬ VI BẢN MỆNH ===\nNgày: ${today.toLocaleDateString('vi-VN')} (${todayInfo.lunarStr})\nCan Chi: ${todayInfo.canNgay} ${todayInfo.chiNgay} - Hành ${todayInfo.hanhNgay}\nTứ Trụ: ${fpSummary}\nĐiểm Cát Hung: ${score} (${ratingText})\nTử Vi Bản Mệnh: Mệnh cư ${todayInfo.ziweiInsight.menhChi} (${todayInfo.ziweiInsight.cucName})\nCách Cục Tử Vi: ${todayInfo.ziweiInsight.topPatternName}\nQuẻ Dịch: ${todayInfo.queInfo.name} - ${todayInfo.queInfo.advice}\nY Phục May Mắn: ${todayInfo.remedy.wardrobe.colors.join(', ')}`;
        navigator.clipboard.writeText(text);
        if (window.App?.Toast) window.App.Toast.show("Đã sao chép dữ liệu ngày hôm nay cho AI!", "success");
      });
    }

    const btnHeroTTS = container.querySelector('#btn-hero-tts');
    if (btnHeroTTS) {
      btnHeroTTS.addEventListener('click', () => {
        loadSubTab('morning');
      });
    }

    function loadSubTab(tab) {
      activeDashTab = tab;
      container.querySelectorAll('.cmd-nav-btn').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
      });

      subContent.innerHTML = '';
      if (tab === 'command' && window.renderCommandCenter) {
        window.renderCommandCenter(subContent);
      } else if (tab === 'morning' && window.renderMorning) {
        window.renderMorning(subContent);
      } else if (tab === 'tasks' && window.renderTasks) {
        window.renderTasks(subContent);
      } else if (tab === 'scanner') {
        renderScannerTab(subContent);
      } else if (tab === 'reaction') {
        renderReactionChain(subContent, todayInfo);
      } else {
        renderMainDashboard(subContent);
      }
    }

    container.querySelectorAll('.cmd-nav-btn').forEach(btn => {
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
    const userProfile = (window.AstrologyLogic && typeof window.AstrologyLogic.getUserProfile === 'function') ? window.AstrologyLogic.getUserProfile() : {
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
    let currentCalDate = new Date();

    // Tích hợp dữ liệu tổng hợp cho ngày hôm nay
    const todayInfo = getDailyIntegratedDetails(currentCalDate, userProfile, currentTaskType);

    // Triết Lý Hôm Nay & Synchronicity (Kho Luận Giải)
    let dailyPhilHtml = '';
    const Engine = window.ZiweiLuanGiaiEngine;
    if (Engine && typeof Engine.getDailyPhilosophy === 'function') {
      const phil = Engine.getDailyPhilosophy(todayInfo.dailyTransit, userProfile);
      dailyPhilHtml = `
        <div class="stagger-item animate-fade-in" style="margin-bottom: var(--space-xl);">
          <div class="card tuvi-card" style="padding:20px; border-radius:16px; background:linear-gradient(135deg, rgba(30,27,75,0.7), rgba(15,23,42,0.85)); border:1px solid rgba(168,85,247,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.5rem;">🌌</span>
                <div>
                  <h3 style="font-family:'Cinzel',serif; margin:0; color:#c084fc; font-size:1.1rem;">
                    Triết Lý Hôm Nay & Đồng Bộ Vũ Trụ (Synchronicity)
                  </h3>
                  <p style="margin:2px 0 0 0; color:var(--text-secondary); font-size:0.8rem;">
                    Can Ngày: ${todayInfo.canNgay} ${todayInfo.chiNgay} (${todayInfo.hanhNgay}) • ${phil.archetype}
                  </p>
                </div>
              </div>
              <span style="font-size:0.75rem; color:#a855f7; font-weight:700; background:rgba(168,85,247,0.15); padding:4px 12px; border-radius:12px; border:1px solid rgba(168,85,247,0.3);">
                C.G. Jung & Kho Luận Giải
              </span>
            </div>

            <div style="font-size:0.95rem; color:#fff; font-weight:600; font-style:italic; line-height:1.6; margin-bottom:10px;">
              "${phil.quote}"
            </div>
            <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
              🎯 <b>Gợi Ý Hành Động:</b> ${phil.action}
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Quick Date Filter Pills Bar -->
      <div class="animate-fade-in" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 12px;">
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

      <!-- Widget Phân Tích Tử Vi & Cách Cục Bản Mệnh (Ni Hải Hạ Engine) -->
      <div class="stagger-item animate-fade-in" style="margin-bottom: var(--space-xl);">
        <div class="tuvi-card" style="border:1px solid var(--border-accent); background:linear-gradient(135deg, var(--bg-card), var(--bg-surface)); padding:18px;">
          <div class="tuvi-card-header" style="border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div class="tuvi-card-title-group" style="display:flex; align-items:center; gap:10px;">
              <div class="tuvi-card-icon" style="background:rgba(212, 168, 67, 0.15); color:var(--accent-gold); font-size:1.2rem; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;">🔮</div>
              <div>
                <div class="tuvi-card-title" style="color:var(--accent-primary); font-weight:700; font-size:1rem;">Góc Nhìn Tử Vi & Đại Hạn Bản Mệnh</div>
                <div class="tuvi-card-subtitle" style="font-size:0.78rem; color:var(--text-tertiary);">Soi chiếu cách cục Ni Hải Hạ & nhịp vận hạn 10 năm</div>
              </div>
            </div>
            <button class="btn btn-tab btn-sm" onclick="App.Router.navigate('astrology')" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:600; border-radius:20px; padding:6px 16px; border:1px solid var(--border-accent);">
              ✨ Mở Bàn Tử Vi Chi Tiết ➔
            </button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
            <div style="padding:12px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Cung Mệnh & Ngũ Hành Cục</div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--accent-gold); margin:4px 0;">Mệnh Cư <span class="palace-name" style="cursor:pointer; text-decoration:underline dashed;">${todayInfo.ziweiInsight.menhChi}</span> · ${todayInfo.ziweiInsight.cucName}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">Trường phái 倪海厦 (Ni Hải Hạ - Thiên Kỷ)</div>
            </div>

            <div style="padding:12px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Cách Cục Nổi Bật Phát Hiện</div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--accent-primary); margin:4px 0;">${todayInfo.ziweiInsight.topPatternName}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">${todayInfo.ziweiInsight.patterns.length > 1 ? `+${todayInfo.ziweiInsight.patterns.length - 1} cách cục phụ hội tụ` : 'Cách cục chủ đạo'}</div>
            </div>

            <div style="padding:12px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Định Hướng Hành Động Tử Vi</div>
              <div style="font-size:0.8rem; color:var(--text-primary); margin-top:4px; line-height:1.4;">${todayInfo.ziweiInsight.adviceText}</div>
            </div>
          </div>
        </div>
      </div>
      
      ${todayInfo.dailyRemedy ? `
      <!-- Widget Giải Pháp Cải Mệnh (Daily Remedy) -->
      <div class="stagger-item" style="margin-bottom: var(--space-xl);">
        <div class="card tuvi-card" style="padding:20px; border-radius:16px; background:linear-gradient(135deg, rgba(20,25,40,0.95), rgba(15,20,30,0.95)); border:1px solid ${todayInfo.dailyRemedy.isBadDay ? '#ef4444' : 'var(--border-accent)'};">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.6rem;">${todayInfo.dailyRemedy.isBadDay ? '🚨' : '🛡️'}</span>
              <div>
                <h3 style="font-family:'Cinzel',serif; margin:0; color:${todayInfo.dailyRemedy.isBadDay ? '#ef4444' : 'var(--accent-primary)'}; font-size:1.2rem;">
                  Chiến Thuật Hành Động & Cải Mệnh Hôm Nay
                </h3>
                <p style="margin:2px 0 0 0; color:var(--text-secondary); font-size:0.85rem;">
                  Dựa trên Lưu Nhật Tứ Hóa & Ngũ Hành Sinh Khắc
                </p>
              </div>
            </div>
            ${todayInfo.dailyRemedy.isBadDay ? `
            <div style="animation: pulse 2s infinite; background:rgba(239, 68, 68, 0.15); border:1px solid #ef4444; color:#ef4444; padding:6px 12px; border-radius:8px; font-weight:bold; font-size:0.85rem;">
              RED ALERT: ${todayInfo.dailyRemedy.alertMsg}
            </div>` : ''}
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <!-- Hành Vi (Action Mode) -->
            <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border-left:3px solid ${todayInfo.dailyRemedy.isBadDay ? '#ef4444' : '#10b981'};">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Chế Độ Hành Động</div>
              <div style="font-weight:600; color:var(--text-primary);">${todayInfo.dailyRemedy.actionMode}</div>
            </div>

            <!-- Y Phục (Wardrobe) -->
            <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border-left:3px solid #3b82f6;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Màu Sắc May Mắn (Dụng Thần ${todayInfo.dailyRemedy.dungThan})</div>
              <div style="font-weight:600; color:var(--text-primary);">${todayInfo.dailyRemedy.wardrobe}</div>
            </div>

            <!-- Phương Vị (Direction) -->
            <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border-left:3px solid #f59e0b;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Hướng Xuất Hành / Ngồi Đàm Phán</div>
              <div style="font-weight:600; color:var(--text-primary);">${todayInfo.dailyRemedy.direction}</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Widget Triết Lý Hôm Nay & Synchronicity (Kho Luận Giải) -->
      ${dailyPhilHtml}

      <!-- Radar Cảnh Báo Sớm 7 Ngày (Early Warning Radar) -->
      <div id="early-warning-radar-widget" class="stagger-item" style="margin-bottom: var(--space-xl);"></div>

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

      <!-- BATCH 2: ADAPTIVE STREAK & WORK MODE WIDGET (#3 & #4) -->
      <div id="batch2-adaptive-streak-widget" class="stagger-item" style="margin-bottom: var(--space-xl);"></div>

      <!-- BATCH 2: SOCIAL ENERGY MAP & MICRO-SPRINT 24H (#1 & #2) -->
      <div id="batch2-social-sprint-widget" class="stagger-item" style="margin-bottom: var(--space-xl);"></div>

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

          <div class="feature-hub-card" onclick="App.Router.navigate('astrology/timemachine')" role="button" tabindex="0">
            <div class="feature-hub-icon" style="background:linear-gradient(135deg,#ec489922,#8b5cf622);">⏳</div>
            <div class="feature-hub-info">
              <div class="feature-hub-title">Time-Machine Cuộc Đời 60 Năm</div>
              <div class="feature-hub-desc">Bản đồ chiến lược thời gian (20–80t), điểm LES & ghim mục tiêu</div>
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
      renderEarlyWarningRadarWidget(userProfile);
      renderCalendar(userProfile, currentTaskType);
      renderBatch2Widgets(currentCalDate, userProfile);

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
              const calSelect = container.querySelector('#cal-task-type');
              const scanBtn = container.querySelector('#btn-run-goal-scan');
              if (scanSelect) scanSelect.value = goalType;
              if (calSelect) {
                calSelect.value = goalType;
                currentTaskType = goalType;
                renderCalendar(userProfile, currentTaskType);
                renderMasterDailyBoard(currentCalDate, userProfile, currentTaskType);
              }
              if (scanBtn) scanBtn.click();
            }
          });
        });
      }

      const calTaskSelect = document.getElementById('cal-task-type');
      const goalScanSelect = document.getElementById('goal-scanner-type');

      if (calTaskSelect) {
        calTaskSelect.addEventListener('change', (e) => {
          currentTaskType = e.target.value;
          if (goalScanSelect && currentTaskType !== 'GENERAL') {
            goalScanSelect.value = currentTaskType;
          }
          renderCalendar(userProfile, currentTaskType);
          renderMasterDailyBoard(currentCalDate, userProfile, currentTaskType);
        });
      }

      if (goalScanSelect) {
        goalScanSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (calTaskSelect) {
            calTaskSelect.value = val;
            currentTaskType = val;
            renderCalendar(userProfile, currentTaskType);
            renderMasterDailyBoard(currentCalDate, userProfile, currentTaskType);
          }
        });
      }

      document.getElementById('btn-cal-prev').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar(userProfile, currentTaskType);
      });
      document.getElementById('btn-cal-next').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar(userProfile, currentTaskType);
      });

    }
  }

  function renderScannerTab(container) {
    const userProfile = (window.AstrologyLogic && typeof window.AstrologyLogic.getUserProfile === 'function') ? window.AstrologyLogic.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };

    container.innerHTML = `
      <!-- Smart Target Scanner -->
      <div class="stagger-item animate-fade-in" style="margin-bottom: var(--space-xl);">
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
                <option value="CONTRACT">✍️ Hợp Đồng / Đầu Tư</option>
                <option value="PITCHING">🎤 Ra Mắt / Thuyết Trình</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btn-run-goal-scan">🔍 Quét Top 3 Ngày Vàng</button>
            </div>
          </div>

          <div id="goal-scan-results-container" style="display:none; margin-top:14px; padding:14px; background:var(--bg-tertiary); border-radius:var(--radius-md); border:1px solid var(--border-color);">
          </div>
        </div>
      </div>

      <!-- Life Energy Balance Radar Chart -->
      <div class="stagger-item animate-fade-in" style="margin-bottom: var(--space-xl);">
        <div id="life-balance-radar-widget"></div>
      </div>
    `;

    const scanBtn = container.querySelector('#btn-run-goal-scan');
    const scanSelect = container.querySelector('#goal-scanner-type');
    const scanResultContainer = container.querySelector('#goal-scan-results-container');

    if (scanBtn && scanSelect && scanResultContainer && window.AstrologyLogic) {
      scanBtn.addEventListener('click', () => {
        const goalType = scanSelect.value;
        const topDates = window.AstrologyLogic.scanGoalDates(new Date(), 30, goalType, userProfile);

        if (topDates.length === 0) return;

        scanResultContainer.style.display = 'block';
        scanResultContainer.innerHTML = `
          <div style="font-weight:700; font-size:0.95em; color:var(--accent-primary); margin-bottom:10px;">
            🌟 TOP 3 NGÀY VÀNG TỐI ƯU NHẤT — ${topDates[0].config.icon} ${topDates[0].config.label}
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px;">
            ${topDates.map((d, idx) => {
              const [yStr, mStr, dStr] = d.dateStr.split('-');
              const dateObj = new Date(yStr, mStr - 1, dStr);
              const scenarios = window.AstrologyLogic.generateShortTermScenarios(dateObj, userProfile, goalType);

              return `
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
                  <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); font-size:0.75rem; color:var(--text-tertiary);">
                    <div style="font-weight:700; color:var(--accent-primary); margin-bottom:2px;">🔮 Kịch bản kích hoạt:</div>
                    <div style="color:var(--color-success);">🟢 <strong>Thuận lợi:</strong> ${scenarios.favorable.activationCondition.substring(0, 50)}...</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      });

      // Run initial scan
      scanBtn.click();
    }

    const radarContainer = container.querySelector('#life-balance-radar-widget');
    if (radarContainer && window.renderLifeBalanceRadar) {
      window.renderLifeBalanceRadar(radarContainer);
    }
  }

  function renderEarlyWarningRadarWidget(userProfile) {
    const container = document.getElementById('early-warning-radar-widget');
    if (!container) return;

    const AL = window.AstrologyLogic;
    if (!AL || typeof AL.calculateEarlyWarningRadar !== 'function') {
      container.innerHTML = '';
      return;
    }

    const radar = AL.calculateEarlyWarningRadar(userProfile, new Date(), 7);
    const criticalCount = radar.warnings.filter(w => w.severity === 'CRITICAL').length;
    const warningCount = radar.warnings.filter(w => w.severity === 'WARNING').length;

    // Build 7-day timeline status ribbon
    const today = new Date();
    const dailyTimeline = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      let dayIntel = null;
      if (typeof AL.getMasterDailyIntelligence === 'function') {
        try {
          dayIntel = AL.getMasterDailyIntelligence(d, userProfile, 'GENERAL');
        } catch (e) {}
      }
      
      const dayName = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' }));
      const dateNum = `${d.getDate()}/${d.getMonth() + 1}`;
      const score = dayIntel?.scoreResult?.total_score ?? dayIntel?.scoreResult?.totalScore ?? dayIntel?.scoreResult?.score ?? 70;
      const isXau = dayIntel?.scoreResult?.badDayInfo?.isXau;
      const canNgay = dayIntel?.canNgay || '';
      const chiNgay = dayIntel?.chiNgay || '';

      let statusBg = 'rgba(16, 185, 129, 0.15)';
      let statusColor = '#10b981';
      if (score < 50 || isXau) {
        statusBg = 'rgba(239, 68, 68, 0.15)';
        statusColor = '#ef4444';
      } else if (score < 70) {
        statusBg = 'rgba(245, 158, 11, 0.15)';
        statusColor = '#f59e0b';
      }

      dailyTimeline.push({
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        dayName,
        dateNum,
        score,
        statusBg,
        statusColor,
        canChi: `${canNgay} ${chiNgay}`
      });
    }

    container.innerHTML = `
      <div class="tuvi-card" style="border: 1px solid var(--border-color); background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));">
        <!-- Header -->
        <div class="tuvi-card-header" style="flex-wrap:wrap; gap:12px;">
          <div class="tuvi-card-title-group">
            <div class="tuvi-card-icon" style="background:linear-gradient(135deg,#ef444422,#f59e0b22);">📡</div>
            <div>
              <div class="tuvi-card-title" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span>Radar Cảnh Báo Sớm 7 Ngày</span>
                ${criticalCount > 0 ? `<span class="tag tag-weakness" style="font-size:0.7rem; padding:2px 8px;">🔴 ${criticalCount} Cảnh Báo Trọng Tâm</span>` : ''}
                ${warningCount > 0 ? `<span class="tag" style="font-size:0.7rem; padding:2px 8px; background:rgba(245, 158, 11, 0.15); color:#d97706; border:1px solid rgba(245,158,11,0.3);">🟡 ${warningCount} Chú Ý</span>` : ''}
                ${criticalCount === 0 && warningCount === 0 ? `<span class="tag tag-strength" style="font-size:0.7rem; padding:2px 8px;">🟢 Năng Lượng Tuần Ôn Hòa</span>` : ''}
              </div>
              <div class="tuvi-card-subtitle">Rủi ro Tử Vi, Biorhythm, Can Chi & Quẻ Dịch — Click thẻ để mở lời khuyên</div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-ghost btn-sm" id="btn-toggle-all-radar-details" style="font-size:0.78rem; padding:4px 10px;">
              <span id="radar-toggle-all-icon">👁️</span> <span id="radar-toggle-all-text">Mở Chi Tiết All</span>
            </button>
          </div>
        </div>

        <!-- 7-Day Energy Ribbon -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.75rem; color:var(--text-tertiary); font-weight:600;">
            <span>🗓️ NHỊP NĂNG LƯỢNG 7 NGÀY TỚI (Click ngày để lọc):</span>
            <span id="radar-active-date-label" style="color:var(--accent-primary); font-weight:700;">Tất cả 7 ngày</span>
          </div>
          <div class="radar-timeline-ribbon">
            <div class="radar-day-chip active" data-date-filter="ALL" title="Xem tất cả 7 ngày">
              <div class="day-date">Tất Cả</div>
              <div class="day-score-pill" style="background:var(--accent-muted); color:var(--accent-primary);">7 Ngày</div>
              <div class="day-canchi">Toàn Cảnh</div>
            </div>
            ${dailyTimeline.map(dt => `
              <div class="radar-day-chip" data-date-filter="${dt.dateStr}" title="${dt.dayName} (${dt.canChi}) - ${dt.score}đ">
                <div class="day-date">${dt.dayName} <span style="font-weight:400; opacity:0.8;">${dt.dateNum}</span></div>
                <div class="day-score-pill" style="background:${dt.statusBg}; color:${dt.statusColor};">${dt.score}đ</div>
                <div class="day-canchi">${dt.canChi}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Categorized Warning Cards Grid -->
        <div id="radar-warnings-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(270px, 1fr)); gap:10px;">
          ${radar.warnings.map(w => {
            let cardClass = 'info';
            let badgeClass = 'tag-strength';
            let badgeText = '🟢 Ôn Hòa';
            let titleColor = 'var(--text-primary)';

            if (w.severity === 'CRITICAL') {
              cardClass = 'critical';
              badgeClass = 'tag-weakness';
              badgeText = '🔴 Trọng Tâm';
              titleColor = 'var(--color-danger)';
            } else if (w.severity === 'WARNING') {
              cardClass = 'warning';
              badgeClass = '';
              badgeText = '🟡 Chú Ý';
              titleColor = '#d97706';
            }

            const isExpandedByDefault = w.severity === 'CRITICAL';

            return `
              <div class="radar-warning-card ${cardClass} ${isExpandedByDefault ? 'expanded' : ''}" data-domain="${w.domain}" data-period="${w.period}">
                <div class="radar-warning-header" onclick="this.parentElement.classList.toggle('expanded')">
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:2px; flex-wrap:wrap;">
                      <span style="font-size:0.75rem; font-weight:700; color:${titleColor}; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                        <span>${w.icon}</span> <span>${w.domainLabel}</span>
                      </span>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span class="tag ${badgeClass}" style="font-size:0.65rem; padding:1px 6px;">${badgeText}</span>
                        <span style="font-size:0.68rem; color:var(--text-tertiary); font-weight:500;">${w.period}</span>
                      </div>
                    </div>
                    <div class="radar-warning-title" style="color:${titleColor}; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${w.title}">
                      ${w.title}
                    </div>
                  </div>
                  <div style="margin-left:8px; flex-shrink:0;">
                    <span class="radar-toggle-icon">▼</span>
                  </div>
                </div>

                <div class="radar-warning-body">
                  <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.45; margin-bottom:8px; background:rgba(0,0,0,0.12); padding:8px 10px; border-radius:6px;">
                    ${w.detail}
                  </div>
                  <div style="font-size:0.75rem; background:var(--bg-card); padding:8px 10px; border-radius:6px; border:1px solid var(--border-color); color:var(--text-primary); line-height:1.4;">
                    <strong style="color:var(--accent-primary);">💡 Khuyên Hóa Giải:</strong> ${w.remedy}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Attach Event Listeners
    let allExpanded = false;
    const btnToggleAll = container.querySelector('#btn-toggle-all-radar-details');
    if (btnToggleAll) {
      btnToggleAll.addEventListener('click', () => {
        allExpanded = !allExpanded;
        const cards = container.querySelectorAll('.radar-warning-card');
        cards.forEach(c => {
          if (allExpanded) c.classList.add('expanded');
          else c.classList.remove('expanded');
        });
        const iconEl = container.querySelector('#radar-toggle-all-icon');
        const textEl = container.querySelector('#radar-toggle-all-text');
        if (iconEl) iconEl.textContent = allExpanded ? '🙈' : '👁️';
        if (textEl) textEl.textContent = allExpanded ? 'Thu Gọn Chi Tiết' : 'Mở Chi Tiết All';
      });
    }

    const dayChips = container.querySelectorAll('.radar-day-chip');
    const warningCards = container.querySelectorAll('.radar-warning-card');
    const activeDateLabel = container.querySelector('#radar-active-date-label');

    dayChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dayChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const filterDate = chip.getAttribute('data-date-filter');
        if (activeDateLabel) {
          activeDateLabel.textContent = filterDate === 'ALL' ? 'Tất cả 7 ngày' : `Ngày ${filterDate}`;
        }

        warningCards.forEach(card => {
          if (filterDate === 'ALL') {
            card.style.display = 'block';
          } else {
            const periodText = card.getAttribute('data-period') || '';
            const cardBodyText = card.innerHTML || '';
            if (periodText.includes('Cả tuần') || periodText.includes('7 ngày') || periodText.includes(filterDate) || cardBodyText.includes(filterDate)) {
              card.style.display = 'block';
              card.classList.add('expanded');
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
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
        renderLifeBalanceRadarWidget(dateObj, userProfile);
      });
    });

    // Render initial widgets for current/today date
    renderHourlyRhythmWidget(new Date(), userProfile);
    renderLifeBalanceRadarWidget(new Date(), userProfile);
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
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:0.75rem; color:var(--text-tertiary);">
              Ngày Canh ${rhythm.chiNgay || ''}
            </span>
            <button class="btn btn-ghost btn-sm" id="btn-jump-heatmap" style="font-size:0.75rem; padding:2px 8px; color:var(--accent-primary);">🔗 Ma Trận 24H ➔</button>
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

      const jumpBtn = container.querySelector('#btn-jump-heatmap');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
          if (window.App && window.App.Router) {
            window.App.Router.navigate('astrology', 'heatmap');
          }
        });
      }
    } catch(e) {
      console.error("Lỗi khi render widget nhịp giờ:", e);
    }
  }

  function renderMasterDailyBoard(selectedDate, userProfile, taskType) {
    if (window.renderBatch2Widgets) {
      window.renderBatch2Widgets(selectedDate, userProfile);
    }

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

          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-tab btn-sm" id="btn-open-numerology-chip" style="background:var(--accent-muted); color:var(--accent-primary); border:1px solid var(--border-accent); font-weight:600; font-size:0.8rem;" title="Xem chi tiết Thần Số Học & Số Học Ngày Sinh">
              🔢 Thần Số Học & Năm 2026 →
            </button>
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
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🎨 Y PHỤC NẠP KHÍ</div>
            </div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-top:2px;">
              Màu ${info.remedy.wardrobe.colors[0]} & ${info.remedy.wardrobe.colors[1]}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${info.remedy.wardrobe.accessories}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">☕ THỰC DƯỠNG TRÀ SÁNG</div>
              <button class="btn btn-ghost btn-sm" onclick="App.Router.navigate('astrology', 'morning')" style="font-size:0.68rem; padding:1px 6px; color:var(--accent-primary);">🔗 Chi Tiết ➔</button>
            </div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-top:2px;">
              ${info.remedy.dietary.tea.split(',')[0]}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Nuôi dưỡng: ${info.remedy.dietary.organ}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🧭 HƯỚNG XUẤT HÀNH CÁT</div>
              <button class="btn btn-ghost btn-sm" onclick="App.Router.navigate('oracle', 'compass')" style="font-size:0.68rem; padding:1px 6px; color:var(--accent-primary);">🔗 La Bàn ➔</button>
            </div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-success); margin-top:2px;">
              Tài Thần: Hướng ${info.thanCat.taiThan}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Hỷ Thần: Hướng ${info.thanCat.hyThan} • Quý Nhân: ${info.thanCat.quyNhan}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">☯ QUẺ NGÀY MAI HOA</div>
              <button class="btn btn-ghost btn-sm" onclick="App.Router.navigate('oracle', 'iching')" style="font-size:0.68rem; padding:1px 6px; color:var(--accent-primary);">🔗 Gieo Quẻ ➔</button>
            </div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--accent-secondary); margin-top:2px;">
              ${info.queInfo.name}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Hào động: Hào ${info.movingLine}</div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">🩺 BẢO VỆ SỨC KHỎE</div>
              <button class="btn btn-ghost btn-sm" onclick="App.Router.navigate('astrology', 'health')" style="font-size:0.68rem; padding:1px 6px; color:var(--accent-primary);">🔗 Sức Khỏe ➔</button>
            </div>
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

    const numChipBtn = container.querySelector('#btn-open-numerology-chip');
    if (numChipBtn) {
      numChipBtn.addEventListener('click', () => {
        if (window.App && window.App.Router) {
          window.App.Router.navigate('astrology/numerology');
        }
      });
    }
  }

  function renderLifeBalanceRadarWidget(selectedDate, userProfile) {
    const container = document.getElementById('life-balance-radar-widget');
    if (!container) return;

    const AL = window.AstrologyLogic;
    if (!AL || !AL.calculateLifeBalanceScores) return;

    const balanceData = AL.calculateLifeBalanceScores(userProfile, selectedDate);
    const dateFormatted = selectedDate.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', year: 'numeric' });

    container.innerHTML = `
      <div class="tuvi-card">
        <div class="tuvi-card-header">
          <div class="tuvi-card-title-group">
            <div class="tuvi-card-icon">🕸️</div>
            <div>
              <div class="tuvi-card-title">Bảng Cân Bằng "Năng Lượng Sống" 6 Trụ Cột (Life Balance Engine)</div>
              <div class="tuvi-card-subtitle">Đối chiếu Điểm Thực Tế (Xanh Lục) vs Tiềm Năng Tử Vi Vũ Trụ (Vàng Kim) (${dateFormatted})</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-life-checkin">
            📝 Check-in Điểm Tuần Này →
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; align-items:center;">
          <!-- Radar Canvas Column -->
          <div style="text-align:center; padding:10px; position:relative;">
            <canvas id="life-balance-canvas" width="340" height="300" style="max-width:100%; height:auto;"></canvas>
            <div style="display:flex; justify-content:center; gap:16px; margin-top:8px; font-size:0.78rem; font-weight:600;">
              <span style="display:flex; align-items:center; gap:6px; color:#10b981;">
                <span style="width:12px; height:3px; background:#10b981; border-radius:2px;"></span> 🔹 Thực Tế Đầu Tư
              </span>
              <span style="display:flex; align-items:center; gap:6px; color:var(--accent-primary);">
                <span style="width:12px; height:3px; background:var(--accent-primary); border-radius:2px; border:1px dashed var(--accent-primary);"></span> 🟡 Tiềm Năng Tử Vi
              </span>
            </div>
          </div>

          <!-- Insight & Score Progress Column -->
          <div>
            <div style="font-size:0.8rem; font-weight:700; color:var(--accent-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
              💡 ĐÚC KẾT & CẢNH BÁO CHIẾN LƯỢC TUẦN
            </div>
            <div style="background:var(--bg-tertiary); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:0.82rem; line-height:1.5; color:var(--text-secondary); margin-bottom:12px;">
              ${balanceData.insights.map(i => `<div style="margin-bottom:6px;">${i}</div>`).join('')}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              ${balanceData.pillars.map(p => {
                const real = balanceData.realScores[p.key] || 70;
                const astro = balanceData.astroPotentialScores[p.key] || 70;
                return `
                  <div style="background:var(--bg-card); padding:8px 10px; border-radius:6px; border:1px solid var(--border-color); font-size:0.75rem;">
                    <div style="font-weight:700; color:var(--text-primary); margin-bottom:2px;">${(p.label || p.name || '').split('(')[0]}</div>
                    <div style="display:flex; justify-content:space-between; color:var(--text-tertiary);">
                      <span>Thực tế: <strong style="color:#10b981;">${real}%</strong></span>
                      <span>Tử Vi: <strong style="color:var(--accent-primary);">${astro}%</strong></span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#life-balance-canvas');
    if (canvas) {
      drawRadarCanvas(canvas, balanceData.realScores, balanceData.astroPotentialScores);
    }

    const checkinBtn = container.querySelector('#btn-open-life-checkin');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => {
        showLifeBalanceCheckinModal(userProfile, selectedDate);
      });
    }
  }

  function drawRadarCanvas(canvas, realScores, astroScores) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 45;
    const numSides = 6;
    const angleStep = (Math.PI * 2) / numSides;

    const labels = ['1. Thân Tâm', '2. Sự Nghiệp', '3. Gia Đạo', '4. Quan Hệ', '5. Tài Chính', '6. Tri Thức'];
    const keys = ['health_mind', 'career', 'family', 'relationship', 'finance', 'knowledge'];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const realColor = '#10b981';
    const realFill = 'rgba(16, 185, 129, 0.25)';
    const astroColor = isDark ? '#d4af37' : '#b8860b';
    const astroFill = 'rgba(212, 175, 55, 0.18)';

    // Hexagon Concentric Grid (5 Rings)
    for (let level = 1; level <= 5; level++) {
      const r = (radius / 5) * level;
      ctx.beginPath();
      for (let i = 0; i < numSides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Radial Spokes & Labels
    for (let i = 0; i < numSides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = gridColor;
      ctx.stroke();

      const labelRadius = radius + 22;
      const lx = centerX + labelRadius * Math.cos(angle);
      const ly = centerY + labelRadius * Math.sin(angle);
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = Math.abs(Math.cos(angle)) < 0.1 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right');
      ctx.textBaseline = Math.abs(Math.sin(angle)) < 0.1 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom');
      ctx.fillText(labels[i], lx, ly);
    }

    function drawPolygon(scores, strokeStyle, fillStyle, isDashed) {
      ctx.beginPath();
      for (let i = 0; i < numSides; i++) {
        const val = Math.max(0, Math.min(100, scores[keys[i]] || 0));
        const r = (radius * val) / 100;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();

      ctx.save();
      if (isDashed) ctx.setLineDash([4, 4]);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < numSides; i++) {
        const val = Math.max(0, Math.min(100, scores[keys[i]] || 0));
        const r = (radius * val) / 100;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeStyle;
        ctx.fill();
      }
    }

    drawPolygon(astroScores, astroColor, astroFill, true);
    drawPolygon(realScores, realColor, realFill, false);
  }

  function showLifeBalanceCheckinModal(userProfile, dateObj) {
    const AL = window.AstrologyLogic;
    if (!AL || !AL.calculateLifeBalanceScores) return;

    const data = AL.calculateLifeBalanceScores(userProfile, dateObj);
    const real = data.realScores;

    const content = `
      <div style="padding:4px 0;">
        <p style="font-size:0.85em; color:var(--text-secondary); margin-bottom:16px;">
          Tự phản tư và đánh giá mức độ hài lòng / năng lượng bạn đã đầu tư cho 6 trụ cột đời sống trong tuần này (1 - 100 điểm):
        </p>

        <form id="form-life-checkin" style="display:grid; gap:14px;">
          ${data.pillars.map(p => {
            const val = real[p.key] || 70;
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.88rem; color:var(--text-primary); margin-bottom:4px;">
                  <span>${p.label}</span>
                  <span id="val-${p.key}" style="color:var(--accent-primary);">${val}%</span>
                </div>
                <input type="range" min="10" max="100" value="${val}" class="form-range" id="slider-${p.key}" style="width:100%;">
              </div>
            `;
          }).join('')}

          <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
            <button type="submit" class="btn btn-primary" style="width:100%;">💾 Lưu Check-in & Cập Nhật Radar Engine</button>
          </div>
        </form>
      </div>
    `;

    const overlay = App.Modal.show(content, { title: '📝 Check-in Cân Bằng Năng Lượng Sống 6 Trụ Cột' });

    if (overlay) {
      data.pillars.forEach(p => {
        const slider = overlay.querySelector(`#slider-${p.key}`);
        const valDisp = overlay.querySelector(`#val-${p.key}`);
        if (slider && valDisp) {
          slider.addEventListener('input', (e) => {
            valDisp.textContent = `${e.target.value}%`;
          });
        }
      });

      const form = overlay.querySelector('#form-life-checkin');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const newScores = {};
          data.pillars.forEach(p => {
            const slider = overlay.querySelector(`#slider-${p.key}`);
            newScores[p.key] = parseInt(slider ? slider.value : 70, 10);
          });

          localStorage.setItem('user_life_balance_scores', JSON.stringify(newScores));
          App.Modal.hide(overlay);
          renderLifeBalanceRadarWidget(dateObj, userProfile);
        });
      }
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

        <!-- Integrated 8 Sub-Tabs -->
        <div class="modal-tab-headers" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; margin-bottom:14px; border-bottom:1px solid var(--border-color);">
          <button class="btn btn-sm modal-tab-btn active" data-tab="tab-cat-hung" style="white-space:nowrap; padding:6px 12px;">🔮 Cát Hung</button>
          <button class="btn btn-sm modal-tab-btn" data-tab="tab-scenarios" style="white-space:nowrap; padding:6px 12px;">🎯 3 Kịch Bản Tương Lai</button>
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

        <!-- Tab 2: 3 Kịch Bản Tương Lai Ngắn Hạn -->
        <div class="modal-tab-pane" id="tab-scenarios" style="display:none;">
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:12px;">
            <div style="font-weight:700; color:var(--accent-primary); font-size:0.92rem; margin-bottom:4px;">
              🔮 3 Kịch Bản Tương Lai Ngắn Hạn & Điều Kiện Kích Hoạt
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">
              Hệ thống dự báo 3 con đường khả thi. Kết quả cuối cùng tùy thuộc vào sự lựa chọn và hành vi ứng xử thực tế của bạn.
            </div>
          </div>

          <div style="display:grid; gap:10px; max-height:420px; overflow-y:auto; padding-right:4px;">
            ${(function() {
              const sc = info.shortTermScenarios || (window.AstrologyLogic ? window.AstrologyLogic.generateShortTermScenarios(dateObj, userProfile, taskType) : null);
              if (!sc) return '<div style="padding:10px; color:var(--text-tertiary);">Chưa có dữ liệu kịch bản.</div>';

              const items = [
                { key: 'favorable', data: sc.favorable, borderColor: 'var(--color-success)', bgAlpha: 'rgba(16, 185, 129, 0.06)' },
                { key: 'neutral', data: sc.neutral, borderColor: 'var(--color-warning)', bgAlpha: 'rgba(245, 158, 11, 0.06)' },
                { key: 'challenging', data: sc.challenging, borderColor: 'var(--color-danger)', bgAlpha: 'rgba(239, 68, 68, 0.06)' }
              ];

              return items.map(it => `
                <div style="background:${it.bgAlpha}; border:1px solid ${it.borderColor}; border-left:4px solid ${it.borderColor}; border-radius:var(--radius-md); padding:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">${it.data.title}</span>
                    <span class="tag tag-${it.data.badgeClass}" style="font-size:0.75rem;">Mức kỳ vọng: ${it.data.scoreRange}</span>
                  </div>
                  <div style="font-size:0.82rem; color:var(--text-primary); margin-bottom:6px; background:var(--bg-card); padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                    <strong>🎯 Điều kiện kích hoạt:</strong> ${it.data.activationCondition}
                  </div>
                  <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-bottom:6px;">
                    <strong>📉 Dự báo diễn biến:</strong> ${it.data.predictedFlow}
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">
                    <strong>🌱 Hành động cải mệnh:</strong> ${it.data.remedyAction}
                  </div>
                </div>
              `).join('');
            })()}
          </div>
        </div>

        <!-- Tab 3: Nhịp Giờ Hoàng Đạo 24H -->
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

  function renderBatch2Widgets(selectedDate, userProfile) {
    const AL = window.AstrologyLogic;
    if (!AL) return;

    const streakContainer = document.getElementById('batch2-adaptive-streak-widget');
    const sprintContainer = document.getElementById('batch2-social-sprint-widget');

    const scoreResult = AL.evaluatePersonalizedDay ? AL.evaluatePersonalizedDay(selectedDate, userProfile, 'GENERAL') : { total_score: 80 };
    const todayScore = scoreResult.total_score ?? scoreResult.totalScore ?? scoreResult.score ?? 80;

    const streakInfo = AL.getAdaptiveStreakStatus ? AL.getAdaptiveStreakStatus([], todayScore) : null;
    const sprints = AL.generateMicroSprintSchedule ? AL.generateMicroSprintSchedule(selectedDate, userProfile) : [];
    const socialMap = AL.getSocialEnergyMap ? AL.getSocialEnergyMap([], selectedDate) : [];

    if (streakContainer && streakInfo) {
      streakContainer.innerHTML = `
        <div class="tuvi-card" style="border: 1px solid var(--border-accent); background: linear-gradient(135deg, var(--bg-card), var(--bg-surface));">
          <div class="tuvi-card-header" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 12px; margin-bottom: 14px;">
            <div class="tuvi-card-title-group">
              <div class="tuvi-card-icon">🔗</div>
              <div>
                <div class="tuvi-card-title">Chuỗi Thích Nghi (Adaptive Streak) & Work Mode</div>
                <div class="tuvi-card-subtitle">${streakInfo.streakBadge}</div>
              </div>
            </div>
            <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:800; font-size:0.9rem; padding:6px 14px; border-radius:20px;">
              Streak: ${streakInfo.currentStreak} Ngày
            </span>
          </div>

          <div style="font-size:0.9rem; color:var(--text-secondary); line-height:1.6;">
            💡 <strong>Khuyến Nghị Thiên Ý:</strong> ${streakInfo.taskRecommendation}
          </div>
        </div>
      `;
    }

    if (sprintContainer) {
      sprintContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
          <!-- Micro-Sprint 24H Block Timeline (#2) -->
          <div class="tuvi-card">
            <div class="tuvi-card-title" style="margin-bottom:12px; font-size:1.05rem;">
              📐 Micro-Sprint Planner 24H (Khung Giờ Cát)
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto;">
              ${sprints.slice(0, 6).map(s => `
                <div style="padding:8px 12px; border-radius:8px; background:var(--bg-surface); border:1px solid ${s.type === 'DEEP_WORK' ? '#3b82f644' : s.type === 'REST' ? '#10b98144' : 'var(--border-color)'}; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${s.time} (${s.name})</span>
                    <div style="font-size:0.78rem; color:var(--text-muted);">${s.activity}</div>
                  </div>
                  <span class="badge" style="background:${s.score >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${s.score >= 70 ? '#10b981' : '#ef4444'}; font-weight:700;">
                    ${s.score}đ
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Social Energy Map (#1) -->
          <div class="tuvi-card">
            <div class="tuvi-card-title" style="margin-bottom:12px; font-size:1.05rem;">
              🤝 Nhiệt Kế Xã Hội (Social Energy Map)
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${socialMap.map(c => `
                <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-weight:700; font-size:0.88rem;">${c.name} (${c.canChi})</div>
                    <div style="font-size:0.78rem; color:var(--text-secondary);">${c.recommendation}</div>
                  </div>
                  <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:700;">
                    ${c.harmonyScore}%
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderReactionChain(container, todayInfo) {
    const AL = window.AstrologyLogic;
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : null;
    let personalYear = '';
    let destinyNum = '';
    if (userProfile && AL && AL.Numerology) {
       destinyNum = AL.Numerology.calculateLifePath(userProfile.day, userProfile.month, userProfile.year);
       personalYear = AL.Numerology.calculatePersonalYear(userProfile.day, userProfile.month, new Date().getFullYear());
    }

    container.innerHTML = `
      <div class="animate-fade-in" style="margin-bottom:24px;">
        <h2 style="font-family:'Cinzel', serif; font-size: 1.6rem; color:var(--accent-primary); margin-bottom:8px;">⚡ Chuỗi Phản Ứng Hành Động (LifeOS Reaction Chain)</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:24px;">Quy trình 4 bước khép kín: Nhận thức Năng Lượng -> Định hướng Không Gian -> Ra Quyết Định -> Hành Động.</p>

        <div class="reaction-chain-container">
          
          <!-- BƯỚC 1: THIÊN THỜI -->
          <div class="reaction-step">
            <div class="reaction-step-icon">1</div>
            <div class="reaction-step-content">
              <div class="reaction-step-header">
                <h3 class="reaction-step-title">Thiên Thời (Nhận thức)</h3>
                <span class="reaction-step-badge">Tử Vi & Thần Số</span>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
                <div style="background:var(--bg-surface); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                  <div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Năng Lượng Ngày</div>
                  <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary); margin-top:4px;">\${todayInfo.scoreResult.rating ?? 'Đại Cát'} (\${todayInfo.scoreResult.score ?? 85} điểm)</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">Hành \${todayInfo.hanhNgay} - \${todayInfo.canNgay} \${todayInfo.chiNgay}</div>
                </div>
                <div style="background:var(--bg-surface); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                  <div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Chỉ Số Biorhythm</div>
                  <div style="font-weight:700; font-size:1.1rem; color:var(--color-info); margin-top:4px;">\${todayInfo.bio.statusTag || 'Bình Hòa'}</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">Sức mạnh tự nhiên của cơ thể</div>
                </div>
                <div style="background:var(--bg-surface); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                  <div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Thần Số Học Hỗ Trợ</div>
                  <div style="font-weight:700; font-size:1.1rem; color:var(--accent-gold); margin-top:4px;">Đường Đời: \${destinyNum} | Năm CN: \${personalYear}</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">Tần số dao động cá nhân</div>
                </div>
              </div>
            </div>
          </div>

          <!-- BƯỚC 2: ĐỊA LỢI -->
          <div class="reaction-step">
            <div class="reaction-step-icon">2</div>
            <div class="reaction-step-content">
              <div class="reaction-step-header">
                <h3 class="reaction-step-title">Địa Lợi (Không gian)</h3>
                <span class="reaction-step-badge">Kỳ Môn Độn Giáp</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">Định vị phương hướng sinh vượng khí cho công việc hôm nay.</p>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <span style="background:rgba(251,191,36,0.15); color:var(--accent-gold); padding:6px 12px; border-radius:8px; border:1px solid var(--border-gold); font-weight:600; font-size:0.85rem;">💰 Tài Thần: \${todayInfo.thanCat.taiThan}</span>
                <span style="background:rgba(236,72,153,0.15); color:#ec4899; padding:6px 12px; border-radius:8px; border:1px solid #ec489950; font-weight:600; font-size:0.85rem;">❤️ Hỷ Thần: \${todayInfo.thanCat.hyThan}</span>
                <span style="background:rgba(16,185,129,0.15); color:#10b981; padding:6px 12px; border-radius:8px; border:1px solid #10b98150; font-weight:600; font-size:0.85rem;">🛡️ Quý Nhân: \${todayInfo.thanCat.quyNhan}</span>
              </div>
              <div style="margin-top:16px;">
                <button class="btn btn-secondary btn-sm" onclick="App.Router.navigate('oracle', 'compass')">🧭 Mở La Bàn Vi Mô</button>
              </div>
            </div>
          </div>

          <!-- BƯỚC 3: NHÂN HÒA -->
          <div class="reaction-step">
            <div class="reaction-step-icon">3</div>
            <div class="reaction-step-content">
              <div class="reaction-step-header">
                <h3 class="reaction-step-title">Nhân Hòa (Quyết định)</h3>
                <span class="reaction-step-badge">Kinh Dịch Mai Hoa</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">Nếu bạn đang phân vân trước một sự việc, hãy gieo một quẻ nhanh.</p>
              
              <div id="quick-oracle-result" style="display:none; background:var(--bg-surface); padding:16px; border-radius:12px; border:1px solid var(--border-accent); margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                  <div style="font-size:2rem;">☯</div>
                  <div>
                    <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary);" id="quick-oracle-name">Quẻ...</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);" id="quick-oracle-desc">Lời khuyên...</div>
                  </div>
                </div>
              </div>

              <button class="btn btn-primary btn-sm" id="btn-quick-oracle" style="font-weight:700;">☯ Gieo Quẻ Mai Hoa Nhanh</button>
            </div>
          </div>

          <!-- BƯỚC 4: HÀNH ĐỘNG -->
          <div class="reaction-step">
            <div class="reaction-step-icon" style="background:var(--accent-primary); color:white; box-shadow:0 0 16px var(--accent-primary);">4</div>
            <div class="reaction-step-content" style="border-color:var(--accent-primary);">
              <div class="reaction-step-header">
                <h3 class="reaction-step-title" style="color:var(--text-primary);">Thực Thi & Ghi Nhận</h3>
                <span class="reaction-step-badge" style="background:var(--accent-primary); color:white;">Tài Chính Ngũ Hành</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Ghi chép lại dòng tiền sau khi đã xem xét Thiên - Địa - Nhân.</p>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; max-width:400px; margin-bottom:12px;">
                <div>
                  <label style="font-size:0.75rem; color:var(--text-tertiary); display:block; margin-bottom:4px;">Loại</label>
                  <select id="rc-tx-type" class="form-select" style="width:100%; font-size:0.85rem; padding:8px;">
                    <option value="EXPENSE">Chi Tiêu (-)</option>
                    <option value="INCOME">Thu Nhập (+)</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:0.75rem; color:var(--text-tertiary); display:block; margin-bottom:4px;">Số Tiền (VNĐ)</label>
                  <input type="number" id="rc-tx-amount" class="form-input" placeholder="0" style="width:100%; font-size:0.85rem; padding:8px;">
                </div>
                <div style="grid-column: span 2;">
                  <label style="font-size:0.75rem; color:var(--text-tertiary); display:block; margin-bottom:4px;">Ngũ Hành Tương Ứng</label>
                  <select id="rc-tx-element" class="form-select" style="width:100%; font-size:0.85rem; padding:8px;">
                    <option value="Kim">Kim (Công nghệ, Ngân hàng, Trang sức)</option>
                    <option value="Mộc">Mộc (Giáo dục, Y tế, Cây trồng)</option>
                    <option value="Thủy">Thủy (Giao thông, Du lịch, Nước giải khát)</option>
                    <option value="Hỏa">Hỏa (Truyền thông, Điện tử, Năng lượng)</option>
                    <option value="Thổ">Thổ (Bất động sản, Tích lũy tài sản)</option>
                  </select>
                </div>
                <div style="grid-column: span 2;">
                  <label style="font-size:0.75rem; color:var(--text-tertiary); display:block; margin-bottom:4px;">Ghi Chú</label>
                  <input type="text" id="rc-tx-note" class="form-input" placeholder="Lý do xuất/thu tiền..." style="width:100%; font-size:0.85rem; padding:8px;">
                </div>
              </div>
              
              <button class="btn btn-primary" id="btn-rc-save-tx" style="padding:10px 24px; font-weight:700; font-size:0.9rem;">💾 Lưu Giao Dịch</button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Script Gieo Quẻ Nhanh
    const btnOracle = container.querySelector('#btn-quick-oracle');
    const resOracle = container.querySelector('#quick-oracle-result');
    const nameOracle = container.querySelector('#quick-oracle-name');
    const descOracle = container.querySelector('#quick-oracle-desc');
    
    if (btnOracle) {
      btnOracle.addEventListener('click', () => {
        // Simple Oracle Simulation based on time (like Mai Hoa real time)
        const d = new Date();
        const hexIdx = (d.getTime() % 64) + 1;
        nameOracle.textContent = 'Quẻ Số ' + hexIdx;
        descOracle.textContent = 'Quẻ Dịch gieo theo thời gian thực (Mai Hoa Dịch Số). Bấm vào Kỳ Môn & Kinh Dịch để luận giải chi tiết.';
        resOracle.style.display = 'block';
        btnOracle.textContent = '☯ Gieo Quẻ Lại';
      });
    }

    // Script Lưu Giao Dịch
    const btnSaveTx = container.querySelector('#btn-rc-save-tx');
    if (btnSaveTx) {
      btnSaveTx.addEventListener('click', () => {
        const type = container.querySelector('#rc-tx-type').value;
        const amt = parseFloat(container.querySelector('#rc-tx-amount').value) || 0;
        const el = container.querySelector('#rc-tx-element').value;
        const note = container.querySelector('#rc-tx-note').value || 'Giao dịch nhanh';

        if (amt <= 0) {
          if (App && App.Toast) App.Toast.show('Vui lòng nhập số tiền', 'error');
          return;
        }

        try {
          const stored = localStorage.getItem('noitam_finance_txs');
          let txs = stored ? JSON.parse(stored) : [];
          txs.unshift({
            id: Date.now(),
            type,
            amount: amt,
            element: el,
            category: note,
            date: new Date().toISOString().split('T')[0],
            note
          });
          localStorage.setItem('noitam_finance_txs', JSON.stringify(txs));
          if (App && App.Toast) App.Toast.show('Lưu thành công!', 'success');
          
          container.querySelector('#rc-tx-amount').value = '';
          container.querySelector('#rc-tx-note').value = '';
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  window.renderDashboard = renderDashboard;
  window.renderLifeBalanceRadarWidget = renderLifeBalanceRadarWidget;
  window.renderBatch2Widgets = renderBatch2Widgets;
})();
