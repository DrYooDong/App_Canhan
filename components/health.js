// ============================================
// NỘI TÂM — Trợ Lý Sức Khỏe & Thể Trạng
// ============================================

(function () {
  'use strict';

  // ── Dữ liệu mapping Sao → Bộ phận cơ thể ──
  const BODY_PART_MAP = {
    // Vùng đầu mặt
    head: {
      label: 'Đầu & Não',
      stars_risk: ['Kình Dương', 'Thiên Hình', 'Thiên Khôi'],
      warning: 'Cẩn thận va đập, chấn thương đầu. Tránh làm việc căng thẳng kéo dài.'
    },
    eyes: {
      label: 'Mắt',
      stars_risk: ['Thái Dương', 'Thái Âm', 'Hóa Kỵ', 'Đà La'],
      warning: 'Mắt dễ mỏi, đau mắt, suy giảm thị lực. Nên nghỉ ngơi mắt sau mỗi 45 phút làm việc.'
    },
    throat: {
      label: 'Họng & Mũi',
      stars_risk: ['Cự Môn', 'Phá Toái'],
      warning: 'Cẩn thận viêm họng, đau mũi, mất giọng. Uống nước ấm thường xuyên.'
    },
    // Vùng tiêu hóa
    stomach: {
      label: 'Dạ dày & Tiêu hóa',
      stars_risk: ['Thiên Đồng', 'Tham Lang', 'Tiểu Hao', 'Đại Hao'],
      warning: 'Tiêu hóa nhạy cảm hôm nay. Tránh ăn đồ lạnh, thức ăn nặng mùi. Ăn đúng giờ.'
    },
    liver: {
      label: 'Gan & Mật',
      stars_risk: ['Thiên Cơ', 'Kình Dương'],
      warning: 'Gan mật dễ bị căng thẳng. Tránh rượu bia, thức khuya. Uống nhiều nước lọc.'
    },
    // Vùng cơ xương khớp
    bones: {
      label: 'Xương khớp & Máu huyết',
      stars_risk: ['Bạch Hổ', 'Đà La'],
      warning: 'Xương khớp nhức mỏi, huyết áp dễ biến động. Vận động nhẹ nhàng, không mang vác nặng.'
    },
    limbs: {
      label: 'Tay chân',
      stars_risk: ['Thiên Mã', 'Đà La', 'Địa Không'],
      warning: 'Cẩn thận té ngã, tai nạn giao thông. Lái xe chú ý, tránh vội vàng.'
    },
    skin: {
      label: 'Da & Dị ứng',
      stars_risk: ['Thiên Hình', 'Địa Kiếp'],
      warning: 'Da dễ trầy xước, dị ứng. Bảo vệ da khi ra ngoài, tránh tiếp xúc chất kích ứng.'
    },
    // Tinh thần
    mental: {
      label: 'Tinh thần & Thần kinh',
      stars_risk: ['Tang Môn', 'Thiên Khốc', 'Bệnh Phù'],
      warning: 'Dễ u buồn, lo âu, suy nhược thần kinh. Không ép bản thân, hãy nghỉ ngơi và thiền định.'
    },
    // Sinh dục (nữ)
    reproductive: {
      label: 'Phụ khoa (Nữ)',
      stars_risk: ['Đào Hoa', 'Hồng Loan', 'Thai'],
      warning: 'Cần chú ý sức khỏe phụ khoa. Giữ ấm, vệ sinh sạch sẽ.'
    }
  };

  // Sao lưu trong ngày (giả lập dựa trên Can Chi ngày)
  const DAILY_STARS_BY_CAN = {
    'Giáp': ['Thiên Mã', 'Bạch Hổ'],
    'Ất':   ['Thái Dương', 'Tang Môn'],
    'Bính': ['Thiên Đồng', 'Tiểu Hao'],
    'Đinh': ['Thiên Khốc', 'Bệnh Phù'],
    'Mậu':  ['Kình Dương', 'Đà La'],
    'Kỷ':   ['Hóa Kỵ', 'Địa Không'],
    'Canh': ['Cự Môn', 'Thiên Hình'],
    'Tân':  ['Tham Lang', 'Thiên Khốc'],
    'Nhâm': ['Bạch Hổ', 'Thiên Mã'],
    'Quý':  ['Đào Hoa', 'Phá Toái']
  };

  // Sao cứu giải (Thiên Y giờ tốt)
  const HEALING_STARS = ['Thiên Y', 'Ân Quang', 'Thiên Quý', 'Địa Giải'];
  const HEALING_HOURS = {
    'Giáp': ['Tỵ (9h-11h)', 'Thân (15h-17h)'],
    'Ất':   ['Mão (5h-7h)', 'Ngọ (11h-13h)'],
    'Bính': ['Tý (23h-1h)', 'Thìn (7h-9h)'],
    'Đinh': ['Sửu (1h-3h)', 'Dậu (17h-19h)'],
    'Mậu':  ['Dần (3h-5h)', 'Tỵ (9h-11h)'],
    'Kỷ':   ['Mão (5h-7h)', 'Thân (15h-17h)'],
    'Canh': ['Thìn (7h-9h)', 'Hợi (21h-23h)'],
    'Tân':  ['Tý (23h-1h)', 'Tỵ (9h-11h)'],
    'Nhâm': ['Mão (5h-7h)', 'Tuất (19h-21h)'],
    'Quý':  ['Dần (3h-5h)', 'Mùi (13h-15h)']
  };

  // Thực dưỡng theo Ngũ hành cần bổ
  const DIETARY_BY_ELEMENT = {
    'Kim': {
      organ: 'Phổi & Đại Trường',
      tea: '☕ Trà Hoa Nhài, Trà Bá Tước (Earl Grey)',
      food: '🥗 Nấm tuyết, củ cải trắng, lê ngâm mật ong, hạt bạch quả',
      avoid: 'Tránh đồ cay nóng quá, đồ chiên rán nhiều dầu mỡ',
      color: '#e5e7eb',
      icon: '⚪'
    },
    'Mộc': {
      organ: 'Gan & Mật',
      tea: '☕ Trà Xanh, Trà Matcha, Trà Hoa Cúc',
      food: '🥦 Rau mầm, nước ép táo xanh, sinh tố bơ, cần tây',
      avoid: 'Tránh rượu bia, đồ chua cay, thức ăn mỡ nhiều',
      color: '#d1fae5',
      icon: '🍃'
    },
    'Thủy': {
      organ: 'Thận & Bàng Quang',
      tea: '☕ Trà Đỗ Đen Rang, Trà Đông Trùng Thảo',
      food: '🐟 Hạt óc chó, mè đen, hải sản, rong biển, đậu đen',
      avoid: 'Tránh thức khuya, uống quá nhiều cafe, đồ muối mặn',
      color: '#dbeafe',
      icon: '💧'
    },
    'Hỏa': {
      organ: 'Tim & Tiểu Trường',
      tea: '☕ Trà Tía Tô, Trà Táo Đỏ Kỷ Tử',
      food: '🍓 Cà chua, dâu tây, hạt macca, ớt đà lạt đỏ, lựu',
      avoid: 'Tránh xúc động mạnh, ăn quá no, uống nhiều rượu',
      color: '#fee2e2',
      icon: '🔴'
    },
    'Thổ': {
      organ: 'Tỳ Vị (Lách & Dạ dày)',
      tea: '☕ Trà Cam Thảo, Trà Gừng Mật Ong',
      food: '🎃 Cháo hạt sen, khoai lang vàng, bí đỏ, nấm hương',
      avoid: 'Tránh ăn lạnh, ăn vội vàng, đồ ngọt quá nhiều',
      color: '#fef9c3',
      icon: '🟡'
    }
  };

  // Tính sức khỏe ngày theo Can Chi & Cung Tật Ách
  function calcHealthData(canNgay, chiNgay, userProfile) {
    const AL = window.AstrologyLogic;
    const hanhMenh = userProfile.hanhMenh || 'Kim';
    let stars = DAILY_STARS_BY_CAN[canNgay] || [];
    const hanhNgay = AL ? AL.NGU_HANH_CAN[canNgay] : 'Thổ';

    let dailyRemedy = null;
    let kyPalaceName = '';

    if (AL && typeof AL.calculateDailyTransit === 'function') {
      try {
        const today = new Date();
        const dailyTransit = AL.calculateDailyTransit(today, userProfile);
        dailyRemedy = AL.getDailyRemedy(dailyTransit, userProfile);
        
        if (dailyTransit && dailyTransit.baseChart) {
           const tatAch = dailyTransit.baseChart.palaces.find(p => p.id === 'tat-ach' || p.name === 'Tật Ách');
           if (tatAch) {
             stars = [...(tatAch.mainStars || []), ...(tatAch.minorStars || [])];
           }
           
           if (dailyTransit.kyPalace && (dailyTransit.kyPalace.id === 'tat-ach' || dailyTransit.kyPalace.name === 'Tật Ách')) {
              kyPalaceName = 'Tật Ách';
              stars.push(dailyTransit.tuHoa.ky + ' (Hóa Kỵ Lưu Nhật)');
           }
        }
      } catch (e) {}
    }

    // Xác định vùng cơ thể bị ảnh hưởng
    const affectedParts = [];
    Object.entries(BODY_PART_MAP).forEach(([key, part]) => {
      const riskStars = part.stars_risk.filter(s => stars.includes(s));
      if (riskStars.length > 0) {
        affectedParts.push({ key, ...part, triggerStars: riskStars });
      }
    });

    // Tính điểm sức khỏe tổng thể (0-100)
    const HanhSinhKhac = {
      sinh: { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' },
      khac: { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' }
    };

    let healthScore = 70;
    if (HanhSinhKhac.sinh[hanhNgay] === hanhMenh) healthScore += 15;
    else if (HanhSinhKhac.khac[hanhNgay] === hanhMenh) healthScore -= 20;
    else if (hanhNgay === hanhMenh) healthScore += 5;
    healthScore -= affectedParts.length * 8;
    healthScore = Math.max(20, Math.min(100, healthScore));

    // Xác định Dụng Thần (hành cần bổ)
    let dungThan = hanhMenh;
    if (dailyRemedy && dailyRemedy.dungThan) {
        dungThan = dailyRemedy.dungThan;
    } else {
        if (HanhSinhKhac.khac[hanhNgay] === hanhMenh) {
          dungThan = Object.keys(HanhSinhKhac.sinh).find(k => HanhSinhKhac.sinh[k] === hanhMenh && HanhSinhKhac.khac[hanhNgay] !== k) || hanhMenh;
        } else if (HanhSinhKhac.khac[hanhMenh] === hanhNgay) {
          dungThan = Object.keys(HanhSinhKhac.sinh).find(k => HanhSinhKhac.sinh[k] === hanhMenh) || hanhMenh;
        }
    }

    if (kyPalaceName === 'Tật Ách') healthScore -= 30;
    healthScore = Math.max(20, Math.min(100, healthScore));

    // Giờ Thiên Y hôm nay
    const healingHours = HEALING_HOURS[canNgay] || ['Tỵ (9h-11h)', 'Thân (15h-17h)'];

    return { stars, affectedParts, healthScore, dungThan, hanhNgay, healingHours, dietary: DIETARY_BY_ELEMENT[dungThan] || DIETARY_BY_ELEMENT['Thổ'] };
  }

  // Tính mental health score
  function getMentalScore(stars) {
    const badMentalStars = ['Tang Môn', 'Thiên Khốc', 'Bệnh Phù', 'Hóa Kỵ', 'Địa Không'];
    const badCount = stars.filter(s => badMentalStars.includes(s)).length;
    return Math.max(20, 100 - badCount * 35);
  }

  // SVG Hình nhân
  function renderBodySVG(affectedKeys) {
    const highlight = (key) => affectedKeys.includes(key) ? '#ef444480' : 'transparent';
    const strokeHighlight = (key) => affectedKeys.includes(key) ? '#ef4444' : '#4b5563';

    return `
    <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:200px;filter:drop-shadow(0 4px 24px rgba(0,0,0,0.5));">
      <!-- Head -->
      <g id="body-head">
        <ellipse cx="100" cy="52" rx="32" ry="36" fill="${highlight('head')}" stroke="${strokeHighlight('head')}" stroke-width="2.5" style="transition:all 0.5s;"/>
        <!-- Eyes -->
        <ellipse cx="88" cy="46" rx="5" ry="4" fill="${highlight('eyes')}" stroke="${strokeHighlight('eyes')}" stroke-width="1.5"/>
        <ellipse cx="112" cy="46" rx="5" ry="4" fill="${highlight('eyes')}" stroke="${strokeHighlight('eyes')}" stroke-width="1.5"/>
        <!-- Nose/mouth hint -->
        <path d="M96 60 Q100 65 104 60" fill="none" stroke="${highlight('throat') !== 'transparent' ? '#ef4444' : '#6b7280'}" stroke-width="1.5" stroke-linecap="round"/>
      </g>
      <!-- Neck + Throat -->
      <rect x="92" y="86" width="16" height="20" rx="4" fill="${highlight('throat')}" stroke="${strokeHighlight('throat')}" stroke-width="2"/>
      <!-- Torso -->
      <rect x="64" y="104" width="72" height="110" rx="12" fill="rgba(30,30,50,0.4)" stroke="#374151" stroke-width="2"/>
      <!-- Liver zone -->
      <ellipse cx="120" cy="140" rx="20" ry="14" fill="${highlight('liver')}" stroke="${strokeHighlight('liver')}" stroke-width="1.5" opacity="0.8"/>
      <!-- Stomach zone -->
      <ellipse cx="100" cy="170" rx="24" ry="16" fill="${highlight('stomach')}" stroke="${strokeHighlight('stomach')}" stroke-width="1.5" opacity="0.8"/>
      <!-- Heart hint -->
      <path d="M87,118 Q92,110 100,120 Q108,110 113,118 Q113,130 100,140 Q87,130 87,118Z" fill="${highlight('mental')}" stroke="${strokeHighlight('mental')}" stroke-width="1.5" opacity="0.8"/>
      <!-- Left Arm -->
      <rect x="36" y="108" width="26" height="80" rx="12" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="2"/>
      <!-- Right Arm -->
      <rect x="138" y="108" width="26" height="80" rx="12" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="2"/>
      <!-- Left Hand -->
      <ellipse cx="49" cy="198" rx="13" ry="10" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="1.5"/>
      <!-- Right Hand -->
      <ellipse cx="151" cy="198" rx="13" ry="10" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="1.5"/>
      <!-- Pelvis -->
      <rect x="68" y="214" width="64" height="30" rx="8" fill="rgba(30,30,50,0.3)" stroke="#374151" stroke-width="1.5"/>
      <!-- Left Leg -->
      <rect x="68" y="242" width="28" height="100" rx="12" fill="${highlight('bones')}" stroke="${strokeHighlight('bones')}" stroke-width="2"/>
      <!-- Right Leg -->
      <rect x="104" y="242" width="28" height="100" rx="12" fill="${highlight('bones')}" stroke="${strokeHighlight('bones')}" stroke-width="2"/>
      <!-- Left Foot -->
      <ellipse cx="82" cy="350" rx="18" ry="10" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="1.5"/>
      <!-- Right Foot -->
      <ellipse cx="118" cy="350" rx="18" ry="10" fill="${highlight('limbs')}" stroke="${strokeHighlight('limbs')}" stroke-width="1.5"/>
      <!-- Skin overlay -->
      <rect x="64" y="104" width="72" height="110" rx="12" fill="${highlight('skin')}" stroke="none" opacity="0.4"/>
    </svg>`;
  }

  function getScoreColor(score) {
    if (score >= 80) return 'var(--success-color, #10b981)';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  function getScoreLabel(score) {
    if (score >= 80) return 'Tốt';
    if (score >= 60) return 'Ổn định';
    if (score >= 40) return 'Thận trọng';
    return 'Cần bảo dưỡng';
  }

  function getMentalLabel(score) {
    if (score >= 80) return '😊 Tinh thần thoải mái';
    if (score >= 60) return '😐 Bình thường';
    if (score >= 40) return '😔 Hơi mệt mỏi';
    return '😰 Suy nhược, cần nghỉ ngơi';
  }

  function renderHealth(container) {
    const AL = window.AstrologyLogic;
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };

    let canNgay = 'Giáp', chiNgay = 'Tý', hanhNgay = 'Mộc';
    let lunarDateStr = '';

    try {
      if (typeof Lunar !== 'undefined') {
        const lunar = Lunar.fromDate(new Date());
        const idx = lunar.getDayGanIndex();
        canNgay = AL.CAN[idx] || 'Giáp';
        chiNgay = AL.CUNG[lunar.getDayZhiIndex()] || 'Tý';
        hanhNgay = AL.NGU_HANH_CAN[canNgay] || 'Mộc';
        lunarDateStr = `${lunar.getDay()}/${Math.abs(lunar.getMonth())}/${lunar.getYear()} âm lịch`;
      }
    } catch (e) {}

    const data = calcHealthData(canNgay, chiNgay, userProfile);
    const mentalScore = getMentalScore(data.stars);
    const affectedKeys = data.affectedParts.map(p => p.key);

    container.innerHTML = `
    <div class="animate-fade-in">
      <div style="margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:5px;">🏥 Trợ Lý Sức Khỏe Hôm Nay</h1>
        <p class="page-subtitle">Ngày <strong>${canNgay} ${chiNgay}</strong> ${lunarDateStr ? `• ${lunarDateStr}` : ''} • Hành Ngày: <strong>${hanhNgay}</strong></p>
      </div>

      <!-- Main Grid: Body + Info -->
      <div style="display:grid;grid-template-columns:220px 1fr;gap:24px;margin-bottom:24px;align-items:start;">
        <!-- Body Map -->
        <div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:12px;letter-spacing:0.05em;text-transform:uppercase;">Bản Đồ Cơ Thể</div>
            ${renderBodySVG(affectedKeys)}
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;font-size:0.75em;">
              <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px;display:inline-block;"></span>Cần chú ý</span>
              <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#374151;border-radius:2px;display:inline-block;"></span>Bình thường</span>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Overall Health Score -->
          <div class="card" style="padding:20px;">
            <div style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px;">Chỉ Số Sức Khỏe Tổng Thể</div>
            <div style="display:flex;align-items:center;gap:20px;">
              <div style="position:relative;width:80px;height:80px;flex-shrink:0;">
                <svg viewBox="0 0 80 80" style="transform:rotate(-90deg);">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
                  <circle cx="40" cy="40" r="33" fill="none" stroke="${getScoreColor(data.healthScore)}" stroke-width="8"
                    stroke-dasharray="${2 * Math.PI * 33}" stroke-dashoffset="${2 * Math.PI * 33 * (1 - data.healthScore / 100)}"
                    stroke-linecap="round" style="transition:stroke-dashoffset 1s ease;"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;">
                  <span style="font-size:1.3em;font-weight:700;color:${getScoreColor(data.healthScore)};">${data.healthScore}</span>
                  <span style="font-size:0.55em;color:var(--text-muted);">/100</span>
                </div>
              </div>
              <div>
                <div style="font-size:1.2em;font-weight:600;color:${getScoreColor(data.healthScore)};margin-bottom:4px;">${getScoreLabel(data.healthScore)}</div>
                <div style="font-size:0.85em;color:var(--text-secondary);">Sao lưu Cung Tật Ách: <strong>${data.stars.length ? data.stars.map(s => `<span class="main-star" style="cursor:pointer; text-decoration:underline dashed;">${s}</span>`).join(', ') : 'Vô Chính Diệu'}</strong></div>
                <div style="font-size:0.85em;color:var(--text-muted);margin-top:4px;">Bản Mệnh: <strong>${userProfile.hanhMenh}</strong> • Dụng Thần: <strong>${data.dungThan}</strong></div>
              </div>
            </div>
          </div>

          <!-- Mental Health -->
          <div class="card" style="padding:20px;">
            <div style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px;">🧠 Nhiệt Kế Tinh Thần</div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
              <div style="flex:1;height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;">
                <div style="height:100%;width:${mentalScore}%;background:linear-gradient(90deg,#ef4444,#f59e0b,#10b981);border-radius:5px;transition:width 1s ease;"></div>
              </div>
              <span style="font-size:0.9em;font-weight:600;color:${getScoreColor(mentalScore)};min-width:28px;">${mentalScore}</span>
            </div>
            <div style="font-size:0.9em;color:var(--text-secondary);">${getMentalLabel(mentalScore)}</div>
            ${mentalScore < 50 ? `<div style="margin-top:8px;font-size:0.8em;color:#f59e0b;background:rgba(245,158,11,0.1);padding:8px 12px;border-radius:6px;border-left:3px solid #f59e0b;">⚠️ Năng lượng thấp hôm nay — Đừng ép bản thân, hãy nghỉ ngơi sớm và tránh quyết định lớn.</div>` : ''}
          </div>

          <!-- Healing Hours -->
          <div class="card" style="padding:20px;background:linear-gradient(135deg,rgba(16,185,129,0.08),var(--bg-card));">
            <div style="font-size:0.75em;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px;">⏰ Giờ Thiên Y Hôm Nay</div>
            <p style="font-size:0.85em;color:var(--text-secondary);margin-bottom:10px;">Nếu cần khám bệnh hay uống thuốc, hãy chọn khung giờ may mắn:</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              ${data.healingHours.map(h => `<span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#10b981;padding:6px 14px;border-radius:20px;font-size:0.85em;font-weight:500;">✨ ${h}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Affected Body Parts -->
      ${data.affectedParts.length > 0 ? `
      <div style="margin-bottom:24px;">
        <div class="section-title"><span class="icon">⚠️</span> Vùng Cơ Thể Cần Chú Ý Hôm Nay</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
          ${data.affectedParts.map(part => `
          <div class="card" style="padding:16px;border-left:3px solid #ef4444;">
            <div style="font-weight:600;color:#ef4444;margin-bottom:6px;">🔴 ${part.label}</div>
            <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:8px;">Sao kích hoạt: ${part.triggerStars.map(s => `<span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:1px 6px;border-radius:3px;">${s}</span>`).join(' ')}</div>
            <div style="font-size:0.85em;color:var(--text-secondary);">${part.warning}</div>
          </div>
          `).join('')}
        </div>
      </div>
      ` : `
      <div class="insight-block" style="margin-bottom:24px;border-left-color:var(--success-color);">
        <div class="insight-text" style="color:var(--success-color);">✅ Hôm nay không có vùng cơ thể đặc biệt cần cảnh báo</div>
        <div class="insight-source">Ngày ${canNgay} ${chiNgay} — Năng lượng sức khỏe ổn định</div>
      </div>
      `}

      <!-- Dietary -->
      <div style="margin-bottom:24px;">
        <div class="section-title"><span class="icon">🍵</span> Thực Dưỡng & Trà Dưỡng Sinh</div>
        <div class="card" style="padding:24px;background:linear-gradient(135deg,${data.dietary.color}18,var(--bg-card));">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;">
            <div>
              <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Tạng Phủ Ưu Tiên</div>
              <div style="font-size:1.05em;font-weight:600;color:var(--text-primary);">${data.dietary.icon} ${data.dietary.organ}</div>
              <div style="font-size:0.8em;color:var(--text-muted);margin-top:4px;">Hành cần bổ: <strong>${data.dungThan}</strong></div>
            </div>
            <div>
              <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Trà Buổi Sáng</div>
              <div style="font-size:0.9em;color:var(--text-secondary);">${data.dietary.tea}</div>
            </div>
            <div>
              <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Thực Phẩm Khuyên Dùng</div>
              <div style="font-size:0.9em;color:var(--text-secondary);">${data.dietary.food}</div>
            </div>
            <div>
              <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Nên Tránh</div>
              <div style="font-size:0.9em;color:#f87171;">${data.dietary.avoid}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TCM Clock -->
      <div>
        <div class="section-title"><span class="icon">🕐</span> Đồng Hồ Kinh Lạc Đông Y</div>
        <div class="card" style="padding:20px;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85em;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);">
                <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;">Khung Giờ</th>
                <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;">Canh Giờ</th>
                <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;">Kinh Lạc Vượng</th>
                <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;">Gợi Ý Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ['23h-01h','Tý','Kinh Đởm (Túi mật)','Ngủ sâu để cơ thể thải độc, tái tạo năng lượng.'],
                ['01h-03h','Sửu','Kinh Can (Gan)','Ngủ say, đừng thức khuya — Gan cần nghỉ ngơi tuyệt đối.'],
                ['03h-05h','Dần','Kinh Phế (Phổi)','Khí huyết điều hòa, có thể thiền định nhẹ.'],
                ['05h-07h','Mão','Kinh Đại Trường','Thời điểm tốt để đại tiện, uống nước lọc.'],
                ['07h-09h','Thìn','Kinh Vị (Dạ dày)','Ăn sáng đầy đủ — Dạ dày hoạt động mạnh nhất.'],
                ['09h-11h','Tỵ','Kinh Tỳ (Lách)','Sáng suốt nhất, ưu tiên tư duy & học tập.'],
                ['11h-13h','Ngọ','Kinh Tâm (Tim)','Nghỉ trưa ngắn 15-30 phút để dưỡng tâm khí.'],
                ['13h-15h','Mùi','Kinh Tiểu Trường','Tiêu hóa thức ăn, uống thêm nước.'],
                ['15h-17h','Thân','Kinh Bàng Quang','Tỉnh táo trở lại, tốt cho thể thao nhẹ.'],
                ['17h-19h','Dậu','Kinh Thận','Bổ thận khí, ăn tối nhẹ, thư giãn.'],
                ['19h-21h','Tuất','Kinh Tâm Bào','Thư giãn tinh thần, không làm việc nặng nhọc.'],
                ['21h-23h','Hợi','Kinh Tam Tiêu','Chuẩn bị ngủ, tắt thiết bị điện tử.'],
              ].map(([time, chi, kinh, note]) => {
                const now = new Date();
                const h = now.getHours();
                const isNow = (chi === 'Tý' && (h >= 23 || h < 1)) ||
                  (chi === 'Sửu' && h >= 1 && h < 3) ||
                  (chi === 'Dần' && h >= 3 && h < 5) ||
                  (chi === 'Mão' && h >= 5 && h < 7) ||
                  (chi === 'Thìn' && h >= 7 && h < 9) ||
                  (chi === 'Tỵ' && h >= 9 && h < 11) ||
                  (chi === 'Ngọ' && h >= 11 && h < 13) ||
                  (chi === 'Mùi' && h >= 13 && h < 15) ||
                  (chi === 'Thân' && h >= 15 && h < 17) ||
                  (chi === 'Dậu' && h >= 17 && h < 19) ||
                  (chi === 'Tuất' && h >= 19 && h < 21) ||
                  (chi === 'Hợi' && h >= 21 && h < 23);
                return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);${isNow ? 'background:rgba(251,191,36,0.08);' : ''}">
                  <td style="padding:8px 12px;color:${isNow ? '#fbbf24' : 'var(--text-secondary)'};font-weight:${isNow ? '600' : '400'};">${time}${isNow ? ' ← Hiện tại' : ''}</td>
                  <td style="padding:8px 12px;color:var(--text-muted);">${chi}</td>
                  <td style="padding:8px 12px;color:var(--text-secondary);">${kinh}</td>
                  <td style="padding:8px 12px;color:var(--text-muted);">${note}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;
  }

  window.renderHealth = renderHealth;
})();
