// ============================================
// NỘI TÂM — Trợ Lý Cải Mệnh & Thực Dưỡng Buổi Sáng
// ============================================

(function () {
  'use strict';

  // ── 4 Trụ Cột Cải Mệnh ──
  const REMEDY_DB = {
    'Kim': {
      element: 'Kim',
      icon: '⚪',
      bgColor: '#f3f4f6',
      wardrobe: {
        colors: ['Trắng', 'Bạc', 'Ghi nhạt', 'Kem', 'Ánh Kim'],
        accessories: 'Đồng hồ dây kim loại, trang sức bạc, phụ kiện kim loại',
        avoidColors: ['Đỏ', 'Cam', 'Tím nóng']
      },
      dietary: {
        organ: '🫁 Phổi & Đại Trường',
        tea: 'Trà Hoa Nhài, Trà Bá Tước (Earl Grey), Trà Ô Long',
        breakfast: 'Nấm tuyết chưng đường phèn, cháo đậu tươi trắng, củ cải trắng hầm',
        fruits: 'Lê, táo trắng, bạch quả',
        time: '05:00 - 07:00 (Giờ Mão - Kinh Đại Trường)',
        meridianTip: 'Uống 1 ly nước ấm khi thức dậy để "khai thông" đại trường.'
      },
      environment: {
        oil: 'Tinh dầu Hoa Nhài, Sả Chanh (tỉnh táo, thanh lọc)',
        frequency: '741 Hz — Làm sạch, giải độc, tỉnh táo',
        color_space: 'Thêm màu trắng/bạc vào không gian làm việc (gối, bình hoa trắng)'
      },
      mindset: {
        star: 'Hóa Kỵ',
        action: 'Kiểm tra kỹ văn bản, hợp đồng trước khi ký. Tránh hiểu lầm bằng cách viết rõ ràng, cụ thể.',
        affirmation: '"Mình rõ ràng, minh bạch và bình thản trong mọi tình huống."'
      }
    },
    'Mộc': {
      element: 'Mộc',
      icon: '🍃',
      bgColor: '#d1fae5',
      wardrobe: {
        colors: ['Xanh lá', 'Xanh ngọc', 'Xanh rêu', 'Xanh bơ'],
        accessories: 'Vòng tay gỗ trầm hương, đá mắt hổ xanh, trang sức ngọc thạch',
        avoidColors: ['Trắng', 'Bạc', 'Xám kim loại']
      },
      dietary: {
        organ: '🫀 Gan & Mật',
        tea: 'Trà Xanh Sencha, Trà Matcha, Trà Hoa Cúc, Trà Diệp Hạ Châu',
        breakfast: 'Sinh tố bơ xanh, nước ép táo xanh, rau mầm, salad rau xanh',
        fruits: 'Táo xanh, kiwi, bơ, nho xanh',
        time: '01:00 - 03:00 (Giờ Sửu - Kinh Can)',
        meridianTip: 'Gan phục hồi từ 1-3h sáng. Cố gắng ngủ trước 23h để gan được nghỉ ngơi.'
      },
      environment: {
        oil: 'Tinh dầu Bạc Hà, Tràm Trà, Hương Thảo (làm mới, sảng khoái)',
        frequency: '528 Hz — Tái tạo, chữa lành tế bào',
        color_space: 'Thêm cây xanh tươi vào bàn làm việc. Mở cửa sổ đón ánh sáng tự nhiên.'
      },
      mindset: {
        star: 'Kình Dương / Nóng nảy',
        action: 'Áp dụng quy tắc 5 giây: Đếm từ 1 đến 5 trước khi phản hồi bất kỳ email hoặc lời phê bình.',
        affirmation: '"Mình kiên nhẫn, linh hoạt và phát triển như cây xanh."'
      }
    },
    'Thủy': {
      element: 'Thủy',
      icon: '💧',
      bgColor: '#dbeafe',
      wardrobe: {
        colors: ['Đen', 'Xanh navy', 'Xanh đen', 'Xanh đậm'],
        accessories: 'Thạch anh đen (tourmaline), đá sapphire, vòng tay obsidian',
        avoidColors: ['Vàng', 'Nâu đất', 'Be']
      },
      dietary: {
        organ: '🫘 Thận & Bàng Quang',
        tea: 'Trà Đỗ Đen Rang, Trà Đông Trùng Thảo, Trà Hắc Chi',
        breakfast: 'Cháo đậu đen, mè đen ngâm mật ong, hải sản tươi, trứng muối',
        fruits: 'Mận đen, việt quất, nho đen',
        time: '17:00 - 19:00 (Giờ Dậu - Kinh Thận)',
        meridianTip: 'Thận khí vượng lúc 17-19h. Tránh thức khuya và uống nhiều nước vào tối muộn.'
      },
      environment: {
        oil: 'Tinh dầu Lavender, Hoa Oải Hương (thư giãn sâu, cân bằng)',
        frequency: '432 Hz — Định tâm, tăng tập trung, hài hòa với tự nhiên',
        color_space: 'Thêm yếu tố Thủy: bình thủy tinh, aquarium mini hoặc ảnh đại dương.'
      },
      mindset: {
        star: 'Phục Binh / Tiểu Nhân',
        action: 'Kiểm tra kỹ thông tin và nguồn gốc trước khi tin. Không chia sẻ kế hoạch quan trọng với người chưa quen.',
        affirmation: '"Mình khôn ngoan, sâu sắc và biết chảy xung quanh trở ngại."'
      }
    },
    'Hỏa': {
      element: 'Hỏa',
      icon: '🔴',
      bgColor: '#fee2e2',
      wardrobe: {
        colors: ['Đỏ', 'Hồng', 'Tím', 'Cam', 'Đỏ tươi'],
        accessories: 'Trang sức đá ruby, thạch anh hồng, khăn tay/cà vạt màu ấm',
        avoidColors: ['Đen', 'Xanh navy', 'Xanh đậm']
      },
      dietary: {
        organ: '❤️ Tim & Tiểu Trường',
        tea: 'Trà Tía Tô, Trà Táo Đỏ Kỷ Tử, Trà Hoa Hồng, Cà phê nhạt',
        breakfast: 'Cà chua, dâu tây, lựu, ớt đà lạt đỏ, hạt macadamia',
        fruits: 'Dâu, lựu, việt quất đỏ, cherry',
        time: '11:00 - 13:00 (Giờ Ngọ - Kinh Tâm)',
        meridianTip: 'Tim mạnh nhất lúc 11-13h. Nghỉ trưa ngắn 15-20 phút để dưỡng tâm khí.'
      },
      environment: {
        oil: 'Tinh dầu Quế, Cam Ngọt, Vanilla (ấm áp, an toàn, hứng khởi)',
        frequency: '396 Hz — Giải phóng sợ hãi, tăng can đảm',
        color_space: 'Nến đỏ hoặc đèn cam ấm áp trong phòng làm việc buổi tối.'
      },
      mindset: {
        star: 'Tang Môn / Khốc',
        action: 'Tránh xúc động mạnh và quyết định theo cảm xúc. Hãy ghi chú cảm xúc ra giấy trước khi phản ứng.',
        affirmation: '"Mình ấm áp, nhiệt huyết và truyền cảm hứng cho người xung quanh."'
      }
    },
    'Thổ': {
      element: 'Thổ',
      icon: '🟡',
      bgColor: '#fef9c3',
      wardrobe: {
        colors: ['Vàng', 'Nâu đất', 'Be', 'Vàng kem', 'Cam đất'],
        accessories: 'Thạch anh vàng, hổ phách, đá mắt hổ vàng, trang sức đất sét',
        avoidColors: ['Xanh lá', 'Xanh rêu']
      },
      dietary: {
        organ: '🫄 Tỳ Vị (Lách & Dạ dày)',
        tea: 'Trà Cam Thảo, Trà Gừng Mật Ong, Trà Hoa Cúc Vàng',
        breakfast: 'Cháo hạt sen bí đỏ, khoai lang vàng hấp, súp nóng đậu lăng vàng',
        fruits: 'Chuối, xoài, thơm (dứa), đu đủ vàng',
        time: '07:00 - 09:00 (Giờ Thìn - Kinh Vị)',
        meridianTip: 'Dạ dày hoạt động mạnh nhất 7-9h sáng. Ăn sáng đúng giờ và đủ chất là bí quyết.'
      },
      environment: {
        oil: 'Tinh dầu Gừng, Quế, Hồi (ấm bụng, kích thích tiêu hóa)',
        frequency: '285 Hz — Chữa lành mô, tái cấu trúc',
        color_space: 'Đặt vài viên đá thạch anh vàng hoặc vật trang trí màu đất trên bàn làm việc.'
      },
      mindset: {
        star: 'Đà La / Trì hoãn',
        action: 'Chia nhỏ công việc lớn thành 3 bước nhỏ ngay hôm nay. Hoàn thành 1 việc trước khi bắt đầu việc khác.',
        affirmation: '"Mình vững chắc, kiên nhẫn và xây dựng từng bước bền vững."'
      }
    }
  };

  // Lịch sử checklist
  const CHECKLIST_KEY = 'morning_checklist';
  const STREAK_KEY = 'morning_streak';

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }

  function getChecklist() {
    const all = App.Storage.get(CHECKLIST_KEY) || {};
    return all[getTodayKey()] || {};
  }

  function setChecklist(key, val) {
    const all = App.Storage.get(CHECKLIST_KEY) || {};
    if (!all[getTodayKey()]) all[getTodayKey()] = {};
    all[getTodayKey()][key] = val;
    App.Storage.set(CHECKLIST_KEY, all);
  }

  function getStreak() {
    return App.Storage.get(STREAK_KEY) || { count: 0, lastDate: '' };
  }

  function updateStreak(allChecked) {
    if (!allChecked) return;
    const streak = getStreak();
    const today = getTodayKey();
    if (streak.lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
    streak.count = streak.lastDate === yKey ? streak.count + 1 : 1;
    streak.lastDate = today;
    App.Storage.set(STREAK_KEY, streak);
  }

  function getEnergyWarnings(canNgay, dungThan) {
    const warnings = {
      'Giáp': 'Lưu Thiên Mã hoạt động → Dễ bị phân tán, vội vàng. Hãy tập trung vào 1 việc quan trọng nhất.',
      'Ất': 'Thái Dương lưu → Dễ mỏi mắt, bị chú ý. Bảo vệ mắt, cẩn thận về hình ảnh cá nhân.',
      'Bính': 'Thiên Đồng + Tiểu Hao → Tiêu hóa nhạy cảm. Ăn nhẹ, đúng giờ, tránh đồ lạnh.',
      'Đinh': 'Thiên Khốc + Bệnh Phù → Dễ u buồn, mệt mỏi. Không ép bản thân, nghỉ ngơi sớm.',
      'Mậu': 'Kình Dương + Đà La → Dễ nóng nảy và chần chừ. Áp dụng quy tắc 5 giây trước khi phản ứng.',
      'Kỷ': 'Hóa Kỵ + Địa Không → Dễ hiểu lầm và mất phương hướng. Viết rõ mọi thỏa thuận.',
      'Canh': 'Cự Môn + Thiên Hình → Dễ thị phi, va chạm. Tránh tranh luận, nói ít, làm nhiều.',
      'Tân': 'Tham Lang + Thiên Khốc → Dễ bị cám dỗ và u buồn. Tránh nơi ồn ào, dành thời gian một mình.',
      'Nhâm': 'Bạch Hổ + Thiên Mã → Dễ tai nạn xe cộ, thương tích. Lái xe chú ý, kiểm tra đường xá.',
      'Quý': 'Đào Hoa + Phá Toái → Dễ bị lôi cuốn vào chuyện tình cảm, thất thốt lời. Cẩn thận trong giao tiếp.'
    };
    return warnings[canNgay] || 'Hôm nay năng lượng ổn định. Duy trì thói quen tốt.';
  }

  const CHECKLIST_ITEMS = [
    { key: 'wardrobe', label: 'Đã mặc đúng màu Dụng Thần', icon: '👔' },
    { key: 'tea', label: 'Đã uống trà dưỡng sinh buổi sáng', icon: '☕' },
    { key: 'breakfast', label: 'Đã ăn sáng đúng giờ và đúng thực phẩm', icon: '🍽️' },
    { key: 'music', label: 'Đã nghe nhạc tần số phù hợp', icon: '🎵' },
    { key: 'mindset', label: 'Đã đọc và ghi nhớ vi hành động hôm nay', icon: '🧘' },
  ];

  function renderMorning(container) {
    const AL = window.AstrologyLogic;
    let canNgay = 'Giáp', chiNgay = 'Tý', hanhNgay = 'Mộc', lunarStr = '';

    try {
      if (typeof Lunar !== 'undefined' && AL) {
        const lunar = Lunar.fromDate(new Date());
        canNgay = AL.CAN[lunar.getDayGanIndex()] || 'Giáp';
        chiNgay = AL.CUNG[lunar.getDayZhiIndex()] || 'Tý';
        hanhNgay = AL.NGU_HANH_CAN[canNgay] || 'Mộc';
        lunarStr = `${lunar.getDay()}/${Math.abs(lunar.getMonth())} âm lịch`;
      }
    } catch (e) {}

    const userMenh = 'Kim'; // Nguyễn Hữu Đông — Kim Mệnh
    const HANH_SINH_KHAC = {
      sinh: { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' },
      khac: { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' }
    };

    // Xác định Dụng Thần
    let dungThan = userMenh;
    let elementBalance = '';
    let alertLevel = 'OK';

    if (HANH_SINH_KHAC.khac[hanhNgay] === userMenh) {
      // Ngày khắc Mệnh → Cần hành sinh Mệnh làm Dụng
      dungThan = Object.keys(HANH_SINH_KHAC.sinh).find(k => HANH_SINH_KHAC.sinh[k] === userMenh) || userMenh;
      elementBalance = `Ngày ${hanhNgay} khắc Mệnh ${userMenh}`;
      alertLevel = 'HIGH';
    } else if (HANH_SINH_KHAC.sinh[hanhNgay] === userMenh) {
      dungThan = hanhNgay; // Ngày sinh Mệnh → Dùng hành ngày
      elementBalance = `Ngày ${hanhNgay} sinh Mệnh ${userMenh}`;
      alertLevel = 'LOW';
    } else {
      dungThan = userMenh;
      elementBalance = `Ngày ${hanhNgay} • Mệnh ${userMenh} — Cân bằng`;
      alertLevel = 'OK';
    }

    const remedy = REMEDY_DB[dungThan] || REMEDY_DB['Thổ'];
    const warning = getEnergyWarnings(canNgay, dungThan);
    const checklist = getChecklist();
    const streak = getStreak();
    const checkedCount = CHECKLIST_ITEMS.filter(i => checklist[i.key]).length;
    const allChecked = checkedCount === CHECKLIST_ITEMS.length;

    const now = new Date();
    const greetingHour = now.getHours();
    const greeting = greetingHour < 12 ? '🌅 Chào buổi sáng' : greetingHour < 18 ? '☀️ Chào buổi chiều' : '🌙 Chào buổi tối';

    container.innerHTML = `
    <div class="animate-fade-in">
      <!-- Header -->
      <div style="margin-bottom:24px;">
        <h1 class="page-title" style="margin-bottom:5px;">☀️ Trợ Lý Cải Mệnh Buổi Sáng</h1>
        <p class="page-subtitle">${greeting}, Nguyễn Hữu Đông! • Hôm nay ${canNgay} ${chiNgay} ${lunarStr ? `• ${lunarStr}` : ''}</p>
      </div>

      <!-- Morning Briefing Card -->
      <div class="card" style="padding:24px;margin-bottom:24px;background:linear-gradient(135deg,rgba(${alertLevel === 'HIGH' ? '239,68,68' : alertLevel === 'LOW' ? '16,185,129' : '251,191,36'},0.08),var(--bg-card));border:1px solid rgba(${alertLevel === 'HIGH' ? '239,68,68' : alertLevel === 'LOW' ? '16,185,129' : '251,191,36'},0.2);">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
          <div style="font-size:2em;">${alertLevel === 'HIGH' ? '⚠️' : alertLevel === 'LOW' ? '✨' : '⚡'}</div>
          <div>
            <div style="font-size:1.1em;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Cân Bằng Ngũ Hành Hôm Nay</div>
            <div style="font-size:0.9em;color:var(--text-secondary);">${elementBalance}</div>
          </div>
        </div>
        <div style="padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:0.85em;color:var(--text-secondary);">${warning}</div>
        <div style="margin-top:12px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:0.8em;color:var(--text-muted);">Dụng Thần hôm nay:</span>
          <span style="font-size:0.9em;font-weight:700;padding:4px 14px;border-radius:20px;background:${remedy.bgColor}30;border:1px solid ${remedy.bgColor}80;color:var(--text-primary);">${remedy.icon} Hành ${remedy.element}</span>
        </div>
      </div>

      <!-- 4 Pillars -->
      <div style="margin-bottom:24px;">
        <div class="section-title"><span class="icon">💊</span> Đơn Thuốc Cải Mệnh Hôm Nay — 4 Trụ Cột</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">

          <!-- Pillar 1: Wardrobe -->
          <div class="card" style="padding:20px;border-top:3px solid #8b5cf6;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">① 👔 Y Phục & Phụ Kiện Nạp Khí</div>
            <div style="margin-bottom:10px;">
              <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:6px;">Màu sắc nên mặc:</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${remedy.wardrobe.colors.map(c => `<span style="padding:3px 10px;border-radius:12px;font-size:0.8em;font-weight:500;background:rgba(139,92,246,0.12);color:var(--text-secondary);border:1px solid rgba(139,92,246,0.25);">✓ ${c}</span>`).join('')}
              </div>
            </div>
            <div style="margin-bottom:8px;">
              <div style="font-size:0.8em;color:var(--text-muted);">Phụ kiện:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">${remedy.wardrobe.accessories}</div>
            </div>
            <div style="font-size:0.8em;color:#ef4444;">🚫 Tránh: ${remedy.wardrobe.avoidColors.join(', ')}</div>
          </div>

          <!-- Pillar 2: Dietary -->
          <div class="card" style="padding:20px;border-top:3px solid #10b981;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">② 🍵 Thực Dưỡng & Trà Dưỡng Sinh</div>
            <div style="font-size:0.85em;font-weight:600;color:var(--text-primary);margin-bottom:8px;">${remedy.dietary.organ}</div>
            <div style="margin-bottom:6px;">
              <div style="font-size:0.75em;color:var(--text-muted);">Trà buổi sáng:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);">${remedy.dietary.tea}</div>
            </div>
            <div style="margin-bottom:6px;">
              <div style="font-size:0.75em;color:var(--text-muted);">Bữa sáng gợi ý:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);">${remedy.dietary.breakfast}</div>
            </div>
            <div style="margin-bottom:6px;">
              <div style="font-size:0.75em;color:var(--text-muted);">Trái cây:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);">${remedy.dietary.fruits}</div>
            </div>
            <div style="font-size:0.75em;color:#f59e0b;padding:6px 10px;background:rgba(245,158,11,0.1);border-radius:6px;margin-top:8px;">⏰ ${remedy.dietary.time}<br>${remedy.dietary.meridianTip}</div>
          </div>

          <!-- Pillar 3: Environment -->
          <div class="card" style="padding:20px;border-top:3px solid #06b6d4;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">③ 🎵 Môi Trường & Âm Nhạc Trị Liệu</div>
            <div style="margin-bottom:10px;">
              <div style="font-size:0.8em;color:var(--text-muted);">Tinh dầu xông phòng:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">🌿 ${remedy.environment.oil}</div>
            </div>
            <div style="margin-bottom:10px;">
              <div style="font-size:0.8em;color:var(--text-muted);">Âm nhạc tần số:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">🎶 ${remedy.environment.frequency}</div>
              <button onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(remedy.environment.frequency)}','_blank')" class="btn btn-ghost btn-sm" style="margin-top:8px;font-size:0.75em;border:1px solid var(--border-color);">▶ Tìm trên YouTube</button>
            </div>
            <div>
              <div style="font-size:0.8em;color:var(--text-muted);">Không gian làm việc:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">${remedy.environment.color_space}</div>
            </div>
          </div>

          <!-- Pillar 4: Mindset -->
          <div class="card" style="padding:20px;border-top:3px solid #f59e0b;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">④ 🧘 Vi Hành Động & Neo Tâm Lý</div>
            <div style="margin-bottom:10px;">
              <div style="font-size:0.8em;color:var(--text-muted);">Sao cần hóa giải:</div>
              <div style="font-size:0.9em;font-weight:600;color:#f59e0b;margin-top:2px;">${remedy.mindset.star}</div>
            </div>
            <div style="margin-bottom:12px;">
              <div style="font-size:0.8em;color:var(--text-muted);">Vi hành động cụ thể:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;line-height:1.6;">${remedy.mindset.action}</div>
            </div>
            <div style="padding:10px 14px;background:rgba(245,158,11,0.08);border-radius:8px;border-left:3px solid #f59e0b;">
              <div style="font-size:0.75em;color:var(--text-muted);margin-bottom:4px;">💬 Lời Khẳng Định Hôm Nay:</div>
              <div style="font-size:0.85em;color:var(--text-secondary);font-style:italic;">${remedy.mindset.affirmation}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Micro-Quests (Karma Engine) -->
      ${(() => {
        const quests = (window.AstrologyLogic && window.AstrologyLogic.generateKarmaQuests) ? window.AstrologyLogic.generateKarmaQuests() : [];
        if (quests.length === 0) return '';
        return `
          <div style="margin-bottom:24px;">
            <div class="section-title"><span class="icon">⚡</span> Hành Động Cải Mệnh Ưu Tiên Theo Sao Lưu Ngày</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
              ${quests.map(q => `
                <div class="card" style="padding:14px;border-left:3px solid var(--accent-primary);background:linear-gradient(135deg,rgba(99,102,241,0.06),var(--bg-card));">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-weight:700;font-size:0.9em;color:var(--text-primary);">${q.title}</span>
                    <span style="font-size:0.75em;background:var(--accent-muted);color:var(--accent-primary);padding:2px 8px;border-radius:12px;font-weight:700;">+${q.kpReward} KP</span>
                  </div>
                  <div style="font-size:0.8rem;color:#f59e0b;font-weight:600;margin-bottom:4px;">📌 Hóa Giải: ${q.targetStar}</div>
                  <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;line-height:1.5;">${q.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}

      <!-- Daily Checklist -->
      <div style="margin-bottom:24px;">
        <div class="section-title"><span class="icon">✅</span> Thói Quan Cải Mệnh Hôm Nay — ${checkedCount}/${CHECKLIST_ITEMS.length} hoàn thành</div>
        <div class="card" style="padding:20px;">
          <!-- Progress bar -->
          <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;margin-bottom:16px;overflow:hidden;">
            <div id="checklist-progress" style="height:100%;width:${checkedCount / CHECKLIST_ITEMS.length * 100}%;background:linear-gradient(90deg,#6366f1,#10b981);border-radius:4px;transition:width 0.5s ease;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
            ${CHECKLIST_ITEMS.map(item => `
            <label style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:10px 14px;border-radius:8px;border:1px solid ${checklist[item.key] ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'};background:${checklist[item.key] ? 'rgba(16,185,129,0.06)' : 'transparent'};transition:all 0.2s;">
              <input type="checkbox" class="remedy-check" data-key="${item.key}" ${checklist[item.key] ? 'checked' : ''} style="width:18px;height:18px;accent-color:#10b981;">
              <span style="font-size:1.2em;">${item.icon}</span>
              <span style="font-size:0.9em;color:${checklist[item.key] ? 'var(--text-secondary)' : 'var(--text-primary)'};${checklist[item.key] ? 'text-decoration:line-through;' : ''}">${item.label}</span>
            </label>
            `).join('')}
          </div>
          <!-- Streak -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(251,191,36,0.06);border-radius:8px;border:1px solid rgba(251,191,36,0.2);">
            <div>
              <div style="font-size:0.8em;color:var(--text-muted);">🔥 Chuỗi ngày Cải Mệnh</div>
              <div style="font-size:1.4em;font-weight:700;color:#fbbf24;">${streak.count} ngày liên tiếp</div>
            </div>
            ${allChecked ? `<div style="text-align:center;">
              <div style="font-size:1.5em;">🏆</div>
              <div style="font-size:0.75em;color:#10b981;">Hôm nay hoàn thành!</div>
            </div>` : `<div style="font-size:0.8em;color:var(--text-muted);">Còn ${CHECKLIST_ITEMS.length - checkedCount} mục</div>`}
          </div>
        </div>
      </div>

      <!-- Tea & Food Library -->
      <div>
        <div class="section-title"><span class="icon">📚</span> Thư Viện Trà & Thực Dưỡng Đông Y Theo Ngũ Hành</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">
          ${Object.values(REMEDY_DB).map(r => `
          <div class="card" style="padding:16px;border-left:3px solid ${r.bgColor === remedy.bgColor ? 'var(--primary-color)' : 'var(--border-color)'};${r.bgColor === remedy.bgColor ? 'box-shadow:0 0 0 1px rgba(99,102,241,0.3);' : ''}">
            <div style="font-weight:700;font-size:0.95em;margin-bottom:6px;">${r.icon} Hành ${r.element} ${r.bgColor === remedy.bgColor ? '← Hôm nay' : ''}</div>
            <div style="font-size:0.78em;color:var(--text-muted);margin-bottom:4px;">${r.dietary.organ}</div>
            <div style="font-size:0.8em;color:var(--text-secondary);">${r.dietary.tea}</div>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
    `;

    // Bind checklist
    container.querySelectorAll('.remedy-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        setChecklist(key, cb.checked);

        // Update UI
        const label = cb.closest('label');
        const span = label.querySelector('span:last-child');
        if (cb.checked) {
          label.style.borderColor = 'rgba(16,185,129,0.4)';
          label.style.background = 'rgba(16,185,129,0.06)';
          span.style.textDecoration = 'line-through';
          span.style.color = 'var(--text-secondary)';
        } else {
          label.style.borderColor = 'var(--border-color)';
          label.style.background = 'transparent';
          span.style.textDecoration = 'none';
          span.style.color = 'var(--text-primary)';
        }

        const newChecklist = getChecklist();
        const newCount = CHECKLIST_ITEMS.filter(i => newChecklist[i.key]).length;
        const progress = document.getElementById('checklist-progress');
        if (progress) progress.style.width = `${newCount / CHECKLIST_ITEMS.length * 100}%`;

        if (newCount === CHECKLIST_ITEMS.length) {
          updateStreak(true);
          App.Toast.show('🏆 Xuất sắc! Bạn đã hoàn thành tất cả thói quan Cải Mệnh hôm nay!', 'success', 4000);
        }
      });
    });
  }

  window.renderMorning = renderMorning;
})();
