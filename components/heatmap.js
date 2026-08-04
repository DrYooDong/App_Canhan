// ============================================
// NỘI TÂM — Ma Trận Giờ Hoàng Đạo & Biểu Đồ Sóng 30 Ngày
// ============================================

(function () {
  'use strict';

  const CANH_GIO = [
    { chi: 'Tý',   label: '23:00', endH: 1,  start: 23, kinh: 'Kinh Đởm (Túi mật)', hanhDong: 'Ngủ sâu để thải độc. Đừng thức khuya.' },
    { chi: 'Sửu',  label: '01:00', endH: 3,  start: 1,  kinh: 'Kinh Can (Gan)', hanhDong: 'Ngủ say. Gan cần nghỉ ngơi tuyệt đối.' },
    { chi: 'Dần',  label: '03:00', endH: 5,  start: 3,  kinh: 'Kinh Phế (Phổi)', hanhDong: 'Khí huyết điều hòa. Có thể thiền nhẹ.' },
    { chi: 'Mão',  label: '05:00', endH: 7,  start: 5,  kinh: 'Kinh Đại Trường', hanhDong: 'Thời điểm đại tiện, uống nước lọc ấm.' },
    { chi: 'Thìn', label: '07:00', endH: 9,  start: 7,  kinh: 'Kinh Vị (Dạ dày)', hanhDong: 'Ăn sáng đầy đủ, bắt đầu công việc trọng tâm.' },
    { chi: 'Tỵ',   label: '09:00', endH: 11, start: 9,  kinh: 'Kinh Tỳ (Lách)', hanhDong: 'Sáng suốt nhất ngày. Ưu tiên tư duy chiến lược.' },
    { chi: 'Ngọ',  label: '11:00', endH: 13, start: 11, kinh: 'Kinh Tâm (Tim)', hanhDong: 'Nghỉ trưa 15-30 phút để dưỡng tâm khí.' },
    { chi: 'Mùi',  label: '13:00', endH: 15, start: 13, kinh: 'Kinh Tiểu Trường', hanhDong: 'Tiêu hóa thức ăn, uống thêm nước.' },
    { chi: 'Thân', label: '15:00', endH: 17, start: 15, kinh: 'Kinh Bàng Quang', hanhDong: 'Tỉnh táo trở lại. Tốt cho thể thao nhẹ.' },
    { chi: 'Dậu',  label: '17:00', endH: 19, start: 17, kinh: 'Kinh Thận', hanhDong: 'Bổ thận khí, ăn tối nhẹ, thư giãn.' },
    { chi: 'Tuất', label: '19:00', endH: 21, start: 19, kinh: 'Kinh Tâm Bào', hanhDong: 'Thư giãn tinh thần, không làm việc nặng.' },
    { chi: 'Hợi',  label: '21:00', endH: 23, start: 21, kinh: 'Kinh Tam Tiêu', hanhDong: 'Chuẩn bị ngủ, tắt thiết bị điện tử.' },
  ];

  const HOANG_DAO_MAP = {
    'Tý':   ['Tý','Sửu','Mão','Ngọ','Thân','Dậu'],
    'Ngọ':  ['Tý','Sửu','Mão','Ngọ','Thân','Dậu'],
    'Sửu':  ['Dần','Mão','Tỵ','Thân','Tuất','Hợi'],
    'Mùi':  ['Dần','Mão','Tỵ','Thân','Tuất','Hợi'],
    'Dần':  ['Tý','Sửu','Thìn','Tỵ','Mùi','Tuất'],
    'Thân': ['Tý','Sửu','Thìn','Tỵ','Mùi','Tuất'],
    'Mão':  ['Dần','Mão','Ngọ','Mùi','Dậu','Tý'],
    'Dậu':  ['Dần','Mão','Ngọ','Mùi','Dậu','Tý'],
    'Thìn': ['Dần','Thìn','Tỵ','Thân','Dậu','Hợi'],
    'Tuất': ['Dần','Thìn','Tỵ','Thân','Dậu','Hợi'],
    'Tỵ':   ['Sửu','Thìn','Ngọ','Mùi','Tuất','Hợi'],
    'Hợi':  ['Sửu','Thìn','Ngọ','Mùi','Tuất','Hợi'],
  };

  const LUC_DIEU_NAMES = ['Đại An', 'Lưu Niên', 'Tốc Hỷ', 'Xích Khẩu', 'Không Vong', 'Tiểu Cát'];
  const LUC_DIEU_SCORES = [20, -10, 15, -15, -15, 15];

  function getLucDieu(lunarDay, chiIdx) {
    const start = (lunarDay - 1) % 6;
    const dieu = (start + chiIdx) % 6;
    return { name: LUC_DIEU_NAMES[dieu], score: LUC_DIEU_SCORES[dieu] };
  }

  function getCurrentCanhGio() {
    const h = new Date().getHours();
    if (h >= 23 || h < 1) return 'Tý';
    if (h >= 1 && h < 3) return 'Sửu';
    if (h >= 3 && h < 5) return 'Dần';
    if (h >= 5 && h < 7) return 'Mão';
    if (h >= 7 && h < 9) return 'Thìn';
    if (h >= 9 && h < 11) return 'Tỵ';
    if (h >= 11 && h < 13) return 'Ngọ';
    if (h >= 13 && h < 15) return 'Mùi';
    if (h >= 15 && h < 17) return 'Thân';
    if (h >= 17 && h < 19) return 'Dậu';
    if (h >= 19 && h < 21) return 'Tuất';
    return 'Hợi';
  }

  function getMinutesUntilNext(currentChi) {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const cur = CANH_GIO.find(c => c.chi === currentChi);
    if (!cur) return 0;
    let minutesLeft = (cur.endH * 60) - (h * 60 + m);
    if (minutesLeft < 0) minutesLeft += 24 * 60;
    return Math.max(0, minutesLeft);
  }

  function scoreHours(chiNgay, lunarDay, userProfile) {
    const hoangDaoList = HOANG_DAO_MAP[chiNgay] || [];
    const LUC_XUNG = { 'Tý':'Ngọ','Ngọ':'Tý','Sửu':'Mùi','Mùi':'Sửu','Dần':'Thân','Thân':'Dần','Mão':'Dậu','Dậu':'Mão','Thìn':'Tuất','Tuất':'Thìn','Tỵ':'Hợi','Hợi':'Tỵ' };
    const TAM_HOP = {
      'Thìn': ['Thân', 'Tý'], 'Thân': ['Thìn', 'Tý'], 'Tý': ['Thìn', 'Thân'],
      'Dậu': ['Tỵ', 'Sửu'], 'Tỵ': ['Dậu', 'Sửu'], 'Sửu': ['Dậu', 'Tỵ'],
    };

    return CANH_GIO.map((giờ, idx) => {
      let score = 50;
      let status = 'BINH_HOA';
      let highlights = [];

      const isHoangDao = hoangDaoList.includes(giờ.chi);
      if (isHoangDao) { score += 20; highlights.push('Giờ Hoàng Đạo'); }
      else { score -= 15; highlights.push('Giờ Hắc Đạo'); }

      const lucDieu = getLucDieu(lunarDay, idx);
      score += lucDieu.score;
      highlights.push(`Lục Diệu: ${lucDieu.name}`);

      const chiMenh = userProfile?.chiNam || 'Thìn';
      if (LUC_XUNG[chiMenh] === giờ.chi) { score -= 35; highlights.push(`⚠️ Lục xung Chi Nam (${giờ.chi})`); }
      else if (TAM_HOP[chiMenh] && TAM_HOP[chiMenh].includes(giờ.chi)) { score += 15; highlights.push('Tam hợp Chi Tuổi'); }

      score = Math.max(10, Math.min(99, score));
      if (score >= 85) status = 'DAI_CAT';
      else if (score >= 70) status = 'TIEU_CAT';
      else if (score >= 50) status = 'BINH_HOA';
      else if (score >= 35) status = 'THAN_TRONG';
      else status = 'XUNG_MENH';

      return { ...giờ, score, status, highlights, lucDieu: lucDieu.name, isHoangDao };
    });
  }

  function getStatusColor(status) {
    const map = {
      'DAI_CAT': '#10b981', 'TIEU_CAT': '#3b82f6', 'BINH_HOA': '#f59e0b', 'THAN_TRONG': '#f97316', 'XUNG_MENH': '#ef4444'
    };
    return map[status] || '#9ca3af';
  }

  function getStatusLabel(status) {
    const map = {
      'DAI_CAT': 'Đại Cát (Xuất sắc)', 'TIEU_CAT': 'Tiểu Cát (Thuận lợi)', 'BINH_HOA': 'Bình Hòa (Vận hành)', 'THAN_TRONG': 'Thận Trọng', 'XUNG_MENH': 'Xung Mệnh (Tránh việc lớn)'
    };
    return map[status] || 'Bình Hòa';
  }

  const TASK_TYPES = [
    { id: 'MEETING', label: '🤝 Họp hành / Đàm phán', bestStatuses: ['DAI_CAT', 'TIEU_CAT'] },
    { id: 'DEAL', label: '💰 Chốt Hợp Đồng / Cầu tài', bestStatuses: ['DAI_CAT'] },
    { id: 'EXERCISE', label: '🏃 Thể thao / Tập gym', bestStatuses: ['BINH_HOA', 'TIEU_CAT'] },
    { id: 'STUDY', label: '📚 Học tập / Nghiên cứu', bestStatuses: ['DAI_CAT', 'TIEU_CAT'] },
    { id: 'MEDICAL', label: '🏥 Khám bệnh / Uống thuốc', bestStatuses: ['TIEU_CAT', 'BINH_HOA'] },
    { id: 'TRAVEL', label: '🚗 Xuất hành / Di chuyển', bestStatuses: ['DAI_CAT'] },
  ];

  let hoursData = [];
  let currentTask = 'MEETING';
  let countdownTimer = null;
  let activeTab = 'biorhythm'; // 'biorhythm' | 'hourly'

  function renderHeatmap(container) {
    const AL = window.AstrologyLogic;
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="margin-bottom:20px;">
          <h1 class="page-title" style="margin-bottom:5px;">⚡ Biểu Đồ Sóng Nhịp Sinh Học & Năng Lượng</h1>
          <p class="page-subtitle">Dự báo nhịp sóng 30 ngày & Ma trận năng lượng 24 giờ</p>
        </div>

        <div class="tabs-header" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border-color);padding-bottom:10px;">
          <button class="btn btn-tab ${activeTab === 'biorhythm' ? 'active' : ''}" id="btn-tab-bio" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'biorhythm' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'biorhythm' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'biorhythm' ? 'var(--border-accent)' : 'transparent'};">
            <span>🌊</span> Biểu Đồ Sóng 30 Ngày
          </button>
          <button class="btn btn-tab ${activeTab === 'hourly' ? 'active' : ''}" id="btn-tab-hourly" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'hourly' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'hourly' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'hourly' ? 'var(--border-accent)' : 'transparent'};">
            <span>⚡</span> Ma Trận 24 Giờ Ngày
          </button>
        </div>

        <div id="heatmap-sub-container"></div>
      </div>
    `;

    const subContainer = container.querySelector('#heatmap-sub-container');

    function loadSubTab(tab) {
      activeTab = tab;
      subContainer.innerHTML = '';
      if (tab === 'biorhythm') {
        renderBiorhythmChart(subContainer, userProfile);
      } else {
        renderHourlyMatrix(subContainer, userProfile);
      }
    }

    container.querySelector('#btn-tab-bio').addEventListener('click', () => loadSubTab('biorhythm'));
    container.querySelector('#btn-tab-hourly').addEventListener('click', () => loadSubTab('hourly'));

    loadSubTab(activeTab);
  }

  // Render Biểu Đồ Sóng 30 Ngày
  function renderBiorhythmChart(container, userProfile) {
    const AL = window.AstrologyLogic;
    const baseDate = new Date();
    const birthDate = new Date(1990, 0, 1);
    const wavesData = [];

    for (let i = 0; i < 30; i++) {
      const iterDate = new Date(baseDate);
      iterDate.setDate(baseDate.getDate() + i);

      let bio = { physical: 0, emotional: 0, intellectual: 0, statusTag: 'NORMAL' };
      if (AL && AL.calculateBiorhythms) {
        bio = AL.calculateBiorhythms(birthDate, iterDate);
      }
      wavesData.push({
        dayNum: iterDate.getDate(),
        monthNum: iterDate.getMonth() + 1,
        dateStr: iterDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        ...bio
      });
    }

    const synergyDays = wavesData.filter(w => w.statusTag === 'GOLDEN_SYNERGY');
    const redAlertDays = wavesData.filter(w => w.statusTag === 'RED_ALERT');

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Banner Summary -->
        <div class="card mb-lg" style="padding:16px; background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.08)); border:1px solid var(--border-accent);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h3 style="margin:0; font-size:1.1em; font-weight:700;">🌊 Biểu Đồ Nhịp Sinh Học & Sóng Năng Lượng 30 Ngày</h3>
              <p style="font-size:0.85em; color:var(--text-secondary); margin-top:4px;">
                Dự báo chu kỳ Sức bền Thể chất (23d), Cảm xúc Tâm lý (28d) và Trí tuệ Tư duy (33d).
              </p>
            </div>
            <div style="display:flex; gap:12px; font-size:0.8em;">
              <span style="color:#10b981; font-weight:700;">🟢 Thể Chất (23d)</span>
              <span style="color:#3b82f6; font-weight:700;">🔵 Cảm Xúc (28d)</span>
              <span style="color:#8b5cf6; font-weight:700;">🟣 Trí Tuệ (33d)</span>
            </div>
          </div>
        </div>

        <!-- Elements Harmony Radar Card (Karma & Habit Hub) -->
        <div class="card mb-lg animate-fade-in" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(59, 130, 246, 0.06)); border: 1px solid var(--border-accent); padding: 18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; margin:0; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                <span>☸️</span> Elements Harmony Radar — Cân Bằng Ngũ Hành & Giảm Rủi Ro Vận Hạn
              </h3>
              <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">
                Đo lường sự chuyển biến 5 yếu tố Ngũ Hành của Thân Tâm dựa trên tiến trình hoàn thành thói quen rèn luyện.
              </p>
            </div>
            <span style="background:var(--accent-muted); color:var(--accent-primary); padding:4px 12px; border-radius:16px; font-weight:700; font-size:0.82rem; border:1px solid var(--border-accent);">
              ✨ Giảm ~45% Impact Sát Tinh
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:10px; text-align:center;">
            <div style="background:var(--bg-card); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:1.2rem;">🍃</div>
              <div style="font-size:0.78rem; font-weight:700; color:#10b981; margin:2px 0;">MỘC (Tri thức)</div>
              <div style="font-size:1.1rem; font-weight:800;">80%</div>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:1.2rem;">🔥</div>
              <div style="font-size:0.78rem; font-weight:700; color:#ef4444; margin:2px 0;">HỎA (Hành động)</div>
              <div style="font-size:1.1rem; font-weight:800;">65%</div>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:1.2rem;">🪵</div>
              <div style="font-size:0.78rem; font-weight:700; color:#f59e0b; margin:2px 0;">THỔ (Định tâm)</div>
              <div style="font-size:1.1rem; font-weight:800;">90%</div>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:1.2rem;">⚪</div>
              <div style="font-size:0.78rem; font-weight:700; color:#94a3b8; margin:2px 0;">KIM (Kỷ luật)</div>
              <div style="font-size:1.1rem; font-weight:800;">75%</div>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
              <div style="font-size:1.2rem;">🌊</div>
              <div style="font-size:0.78rem; font-weight:700; color:#3b82f6; margin:2px 0;">THỦY (Thiền/Ái ngữ)</div>
              <div style="font-size:1.1rem; font-weight:800;">85%</div>
            </div>
          </div>
        </div>

        <!-- 30-Day Wave Canvas / Visual Cards -->
        <div class="card mb-lg" style="padding:20px;">
          <div style="font-size:0.88em; font-weight:700; color:var(--text-muted); margin-bottom:12px; display:flex; justify-content:space-between;">
            <span>30-DAY BIORHYTHM WAVEFORM CHART</span>
            <span>01 → 30 NGÀY TỚI</span>
          </div>

          <div style="overflow-x:auto; padding-bottom:10px;">
            <div style="min-width:700px; height:180px; position:relative; background:var(--bg-main); border-radius:8px; border:1px solid var(--border-color); padding:10px;">
              <!-- 0-Line Axis -->
              <div style="position:absolute; top:50%; left:0; width:100%; height:1px; background:rgba(255,255,255,0.15); border-top:1px dashed var(--border-color);"></div>

              <div style="display:flex; justify-content:space-between; height:100%; align-items:center;">
                ${wavesData.slice(0, 15).map((w, idx) => `
                  <div style="flex:1; text-align:center; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.7em; color:var(--text-muted); font-weight:600;">${w.dateStr}</div>
                    
                    <!-- Wave bars -->
                    <div style="display:flex; gap:2px; align-items:center; height:100px;">
                      <div style="width:4px; height:${Math.abs(w.physical)}%; background:#10b981; border-radius:2px;" title="Physical: ${w.physical}%"></div>
                      <div style="width:4px; height:${Math.abs(w.emotional)}%; background:#3b82f6; border-radius:2px;" title="Emotional: ${w.emotional}%"></div>
                      <div style="width:4px; height:${Math.abs(w.intellectual)}%; background:#8b5cf6; border-radius:2px;" title="Intellectual: ${w.intellectual}%"></div>
                    </div>

                    <div style="font-size:0.7em;">
                      ${w.statusTag === 'GOLDEN_SYNERGY' ? '🌟' : w.statusTag === 'RED_ALERT' ? '🔴' : w.statusTag === 'CRITICAL_DAY' ? '⚠️' : '▫️'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div style="margin-top:12px; font-size:0.8em; color:var(--text-secondary); display:flex; gap:16px; flex-wrap:wrap; justify-content:center;">
            <span>🌟 <strong>Golden Synergy:</strong> Ngày 3 sóng cùng đạt >60% (Ngày Super Day)</span>
            <span>⚠️ <strong>Critical Day:</strong> Ngày sóng đổi pha qua mốc 0%</span>
            <span>🔴 <strong>Red Alert:</strong> Ngày 3 sóng rơi xuống <-50% (Cần sạc lại năng lượng)</span>
          </div>
        </div>

        <!-- 30-Day Grid Details -->
        <div class="section-title"><span class="icon">📅</span> Chi Tiết Chu Kỳ Sóng 30 Ngày Tiếp Theo</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px;">
          ${wavesData.map(w => `
            <div class="card" style="padding:12px; border-left:3px solid ${w.statusTag === 'GOLDEN_SYNERGY' ? '#10b981' : w.statusTag === 'RED_ALERT' ? '#ef4444' : 'var(--border-color)'};">
              <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.88em; margin-bottom:6px;">
                <span>Ngày ${w.dateStr}</span>
                <span>${w.statusTag === 'GOLDEN_SYNERGY' ? '🌟 Cực Cát' : w.statusTag === 'RED_ALERT' ? '🔴 Cảnh Báo' : 'Bình Hòa'}</span>
              </div>
              <div style="font-size:0.8em; color:var(--text-secondary); line-height:1.6;">
                🟢 Thể chất: <strong>${w.physical}%</strong><br>
                🔵 Cảm xúc: <strong>${w.emotional}%</strong><br>
                🟣 Trí tuệ: <strong>${w.intellectual}%</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render Ma Trận 24 Giờ
  function renderHourlyMatrix(container, userProfile) {
    const AL = window.AstrologyLogic;
    let chiNgay = 'Tý', lunarDay = 1, lunarStr = '';
    try {
      if (typeof Lunar !== 'undefined' && AL) {
        const lunar = Lunar.fromDate(new Date());
        chiNgay = AL.CUNG[lunar.getDayZhiIndex()] || 'Tý';
        lunarDay = lunar.getDay();
        const canNgay = AL.CAN[lunar.getDayGanIndex()] || '?';
        lunarStr = `Ngày ${canNgay} ${chiNgay} • ${lunarDay}/${Math.abs(lunar.getMonth())} âm lịch`;
      }
    } catch (e) {}

    hoursData = scoreHours(chiNgay, lunarDay, userProfile);
    const currentChi = getCurrentCanhGio();
    const currentData = hoursData.find(g => g.chi === currentChi);
    const bestHours = hoursData.filter(g => g.status === 'DAI_CAT').slice(0, 3);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Live Clock + Current Hour -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
          <div class="card" style="padding:20px;background:linear-gradient(135deg,rgba(251,191,36,0.1),var(--bg-card));border:1px solid rgba(251,191,36,0.2);">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">⏰ Đang Ở Trong Canh Giờ</div>
            <div style="font-size:1.6em;font-weight:700;color:#fbbf24;">${currentChi} (${currentData?.label}:00 - ${currentData?.endH.toString().padStart(2,'0')}:00)</div>
            <div style="font-size:0.9em;color:${getStatusColor(currentData?.status || 'BINH_HOA')};margin-top:4px;font-weight:600;">${getStatusLabel(currentData?.status || 'BINH_HOA')} • ${currentData?.score || 50}/100 điểm</div>
            <div style="font-size:0.8em;color:var(--text-muted);margin-top:4px;">${currentData?.kinh}</div>
            <div style="font-size:0.85em;color:var(--text-secondary);margin-top:8px;">${currentData?.hanhDong || ''}</div>
            <div style="margin-top:12px;font-size:0.8em;color:var(--text-muted);">Thời gian còn lại: <span id="countdown-timer" style="font-weight:600;color:#fbbf24;">--:--</span></div>
          </div>
          <div class="card" style="padding:20px;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">🌟 Giờ Đại Cát Hôm Nay</div>
            ${bestHours.length > 0 ? bestHours.map(g => `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="width:32px;height:32px;border-radius:50%;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:0.75em;font-weight:700;color:#10b981;">${g.score}</span>
              <div>
                <div style="font-size:0.9em;font-weight:600;color:var(--text-primary);">${g.chi} • ${g.label}:00 - ${g.endH}:00</div>
                <div style="font-size:0.75em;color:var(--text-muted);">${g.highlights.filter(h => !h.includes('⚠️')).slice(0,2).join(' · ')}</div>
              </div>
            </div>
            `).join('') : '<div style="color:var(--text-muted);font-size:0.9em;">Không có giờ Đại Cát hôm nay</div>'}
          </div>
        </div>

        <!-- Smart Hour Finder -->
        <div class="card" style="padding:20px;margin-bottom:24px;background:linear-gradient(135deg,rgba(99,102,241,0.08),var(--bg-card));">
          <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">🎯 Smart Hour Finder — Tìm Giờ Tối Ưu Cho Việc</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
            ${TASK_TYPES.map(t => `
            <button class="task-btn btn btn-ghost btn-sm" data-task="${t.id}" style="border:1px solid ${currentTask === t.id ? 'var(--primary-color)' : 'var(--border-color)'};background:${currentTask === t.id ? 'rgba(99,102,241,0.15)' : 'transparent'};">${t.label}</button>
            `).join('')}
          </div>
          <div id="smart-finder-result" style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:0.9em;color:var(--text-secondary);">
            Chọn loại việc để tìm khung giờ phù hợp nhất →
          </div>
        </div>

        <!-- Full 12-hour Table -->
        <div>
          <div class="section-title"><span class="icon">📋</span> Bảng Chi Tiết 12 Canh Giờ</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
            ${hoursData.map(g => {
              const isNow = g.chi === currentChi;
              return `
              <div class="card" style="padding:14px;border-left:3px solid ${getStatusColor(g.status)};${isNow ? 'box-shadow:0 0 0 1px rgba(251,191,36,0.4),0 4px 20px rgba(251,191,36,0.1);' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                  <div>
                    <div style="font-weight:700;color:${getStatusColor(g.status)};font-size:0.95em;">${g.chi} ${g.label}:00 - ${g.endH.toString().padStart(2,'0')}:00 ${isNow ? '← Hiện tại' : ''}</div>
                    <div style="font-size:0.75em;color:var(--text-muted);margin-top:2px;">${g.lucDieu} ${g.isHoangDao ? '• 🌟 Hoàng Đạo' : '• Hắc Đạo'}</div>
                  </div>
                  <span style="font-size:1.1em;font-weight:700;color:${getStatusColor(g.status)};">${g.score}đ</span>
                </div>
                <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:6px;">🫀 ${g.kinh}</div>
                <div style="font-size:0.82em;color:var(--text-secondary);line-height:1.4;">${g.hanhDong}</div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    startCountdown(currentChi);
  }

  function startCountdown(currentChi) {
    if (countdownTimer) clearInterval(countdownTimer);
    const el = document.getElementById('countdown-timer');
    if (!el) return;

    const update = () => {
      const mins = getMinutesUntilNext(currentChi);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (el) el.textContent = `${h > 0 ? h + 'h ' : ''}${m}m`;
    };
    update();
    countdownTimer = setInterval(update, 60000);
  }

  window.renderHeatmap = renderHeatmap;
})();
