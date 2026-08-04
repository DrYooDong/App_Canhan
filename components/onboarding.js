// ============================================
// NỘI TÂM — Onboarding Component
// First-time setup: Enter birth info → Generate personal chart
// ============================================

(function () {
  'use strict';

  const PROFILE_KEY = 'noitam_user_profile';

  function getProfile() {
    try {
      let p1 = null, p2 = null;
      try { p1 = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch {}
      try { p2 = JSON.parse(localStorage.getItem('noitam_chart_config')); } catch {}
      if (!p1 && !p2) return null;
      const merged = { ...(p1 || {}), ...(p2 || {}) };
      merged.hour = (merged.hour !== undefined && merged.hour !== null) ? (parseInt(merged.hour, 10) % 24) : 0;
      if (isNaN(merged.hour)) merged.hour = 0;
      return merged;
    } catch { return null; }
  }

  function saveProfile(profile) {
    try {
      if (profile) {
        profile.hour = (profile.hour !== undefined && profile.hour !== null) ? (parseInt(profile.hour, 10) % 24) : 0;
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem('noitam_chart_config', JSON.stringify(profile));
      return true;
    } catch { return false; }
  }

  function hasProfile() {
    const p = getProfile();
    return !!(p && p.name && p.year);
  }

  // Danh sách Tỉnh Thành & Quốc Tế cho Nơi Sinh
  const LOCATIONS_VN = [
    // --- MIỀN BẮC ---
    { name: 'Hà Nội, Việt Nam', lat: 21.0285, lng: 105.8333, tz: 7 },
    { name: 'Hải Phòng, Việt Nam', lat: 20.8449, lng: 106.6881, tz: 7 },
    { name: 'Hạ Long, Quảng Ninh', lat: 20.9505, lng: 107.0734, tz: 7 },
    { name: 'Bắc Ninh, Việt Nam', lat: 21.1861, lng: 106.0763, tz: 7 },
    { name: 'Bắc Giang, Việt Nam', lat: 21.2731, lng: 106.1946, tz: 7 },
    { name: 'Hải Dương, Việt Nam', lat: 20.9400, lng: 106.3330, tz: 7 },
    { name: 'Hưng Yên, Việt Nam', lat: 20.6464, lng: 106.0511, tz: 7 },
    { name: 'Nam Định, Việt Nam', lat: 20.4167, lng: 106.1667, tz: 7 },
    { name: 'Thái Bình, Việt Nam', lat: 20.4464, lng: 106.3364, tz: 7 },
    { name: 'Ninh Bình, Việt Nam', lat: 20.2506, lng: 105.9745, tz: 7 },
    { name: 'Vĩnh Yên, Vĩnh Phúc', lat: 21.3089, lng: 105.6048, tz: 7 },
    { name: 'Phủ Lý, Hà Nam', lat: 20.5453, lng: 105.9122, tz: 7 },
    { name: 'Việt Trì, Phú Thọ', lat: 21.3000, lng: 105.4333, tz: 7 },
    { name: 'Thái Nguyên, Việt Nam', lat: 21.5928, lng: 105.8442, tz: 7 },
    { name: 'Lạng Sơn, Việt Nam', lat: 21.8475, lng: 106.7597, tz: 7 },
    { name: 'Cao Bằng, Việt Nam', lat: 22.6657, lng: 106.2570, tz: 7 },
    { name: 'Hà Giang, Việt Nam', lat: 22.8233, lng: 104.9839, tz: 7 },
    { name: 'Tuyên Quang, Việt Nam', lat: 21.8242, lng: 105.2158, tz: 7 },
    { name: 'Lào Cai / Sa Pa', lat: 22.3364, lng: 103.8438, tz: 7 },
    { name: 'Yên Bái, Việt Nam', lat: 21.7051, lng: 104.8986, tz: 7 },
    { name: 'Sơn La, Việt Nam', lat: 21.3257, lng: 103.9188, tz: 7 },
    { name: 'Điện Biên Phủ', lat: 21.3854, lng: 103.0188, tz: 7 },
    { name: 'Hòa Bình, Việt Nam', lat: 20.8171, lng: 105.3377, tz: 7 },
    { name: 'Lai Châu, Việt Nam', lat: 22.3963, lng: 103.4582, tz: 7 },

    // --- MIỀN TRUNG & TÂY NGUYÊN ---
    { name: 'Thanh Hóa, Việt Nam', lat: 19.8067, lng: 105.7852, tz: 7 },
    { name: 'Vinh, Nghệ An', lat: 18.6734, lng: 105.6813, tz: 7 },
    { name: 'Hà Tĩnh, Việt Nam', lat: 18.3436, lng: 105.9056, tz: 7 },
    { name: 'Đồng Hới, Quảng Bình', lat: 17.4761, lng: 106.6000, tz: 7 },
    { name: 'Đông Hà, Quảng Trị', lat: 16.8183, lng: 107.1006, tz: 7 },
    { name: 'Huế, Việt Nam', lat: 16.4637, lng: 107.5909, tz: 7 },
    { name: 'Đà Nẵng, Việt Nam', lat: 16.0544, lng: 108.2022, tz: 7 },
    { name: 'Hội An / Quảng Nam', lat: 15.8801, lng: 108.3380, tz: 7 },
    { name: 'Tam Kỳ, Quảng Nam', lat: 15.5647, lng: 108.4808, tz: 7 },
    { name: 'Quảng Ngãi, Việt Nam', lat: 15.1205, lng: 108.7924, tz: 7 },
    { name: 'Quy Nhơn, Bình Định', lat: 13.7820, lng: 109.2194, tz: 7 },
    { name: 'Tuy Hòa, Phú Yên', lat: 13.0882, lng: 109.3142, tz: 7 },
    { name: 'Nha Trang, Khánh Hòa', lat: 12.2388, lng: 109.1967, tz: 7 },
    { name: 'Phan Rang, Ninh Thuận', lat: 11.5658, lng: 108.9882, tz: 7 },
    { name: 'Phan Thiết, Bình Thuận', lat: 10.9333, lng: 108.1000, tz: 7 },
    { name: 'Đà Lạt, Lâm Đồng', lat: 11.9404, lng: 108.4583, tz: 7 },
    { name: 'Buôn Ma Thuột, Đắk Lắk', lat: 12.6667, lng: 108.0333, tz: 7 },
    { name: 'Pleiku, Gia Lai', lat: 13.9833, lng: 108.0000, tz: 7 },
    { name: 'Kon Tum, Việt Nam', lat: 14.3504, lng: 108.0047, tz: 7 },
    { name: 'Gia Nghĩa, Đắk Nông', lat: 12.0042, lng: 107.6897, tz: 7 },

    // --- MIỀN NAM ---
    { name: 'TP. Hồ Chí Minh, Việt Nam', lat: 10.8231, lng: 106.6297, tz: 7 },
    { name: 'Thủ Dầu Một, Bình Dương', lat: 10.9804, lng: 106.6519, tz: 7 },
    { name: 'Biên Hòa, Đồng Nai', lat: 10.9574, lng: 106.8426, tz: 7 },
    { name: 'Vũng Tàu, Ba Rịa', lat: 10.3460, lng: 107.0843, tz: 7 },
    { name: 'Tây Ninh, Việt Nam', lat: 11.3102, lng: 106.0984, tz: 7 },
    { name: 'Đồng Xoài, Bình Phước', lat: 11.5333, lng: 106.9000, tz: 7 },
    { name: 'Tân An, Long An', lat: 10.5362, lng: 106.4107, tz: 7 },
    { name: 'Mỹ Tho, Tiền Giang', lat: 10.3600, lng: 106.3600, tz: 7 },
    { name: 'Bến Tre, Việt Nam', lat: 10.2415, lng: 106.3756, tz: 7 },
    { name: 'Trà Vinh, Việt Nam', lat: 9.9348, lng: 106.3458, tz: 7 },
    { name: 'Vĩnh Long, Việt Nam', lat: 10.2537, lng: 105.9722, tz: 7 },
    { name: 'Cao Lãnh, Đồng Tháp', lat: 10.4578, lng: 105.6324, tz: 7 },
    { name: 'Long Xuyên, An Giang', lat: 10.3800, lng: 105.4300, tz: 7 },
    { name: 'Cần Thơ, Việt Nam', lat: 10.0452, lng: 105.7469, tz: 7 },
    { name: 'Vị Thanh, Hậu Giang', lat: 9.7844, lng: 105.4701, tz: 7 },
    { name: 'Rạch Giá, Kiên Giang', lat: 10.0125, lng: 105.0809, tz: 7 },
    { name: 'Phú Quốc, Kiên Giang', lat: 10.2899, lng: 103.9840, tz: 7 },
    { name: 'Sóc Trăng, Việt Nam', lat: 9.6033, lng: 105.9800, tz: 7 },
    { name: 'Bạc Liêu, Việt Nam', lat: 9.2941, lng: 105.7244, tz: 7 },
    { name: 'Cà Mau, Việt Nam', lat: 9.1769, lng: 105.1524, tz: 7 },

    // --- CHÂU Á & ĐÔNG NAM Á ---
    { name: 'Tokyo, Nhật Bản', lat: 35.6762, lng: 139.6503, tz: 9 },
    { name: 'Osaka, Nhật Bản', lat: 34.6937, lng: 135.5023, tz: 9 },
    { name: 'Fukuoka, Nhật Bản', lat: 33.5902, lng: 130.4017, tz: 9 },
    { name: 'Seoul, Hàn Quốc', lat: 37.5665, lng: 126.9780, tz: 9 },
    { name: 'Busan, Hàn Quốc', lat: 35.1796, lng: 129.0756, tz: 9 },
    { name: 'Bắc Kinh, Trung Quốc', lat: 39.9042, lng: 116.4074, tz: 8 },
    { name: 'Thượng Hải, Trung Quốc', lat: 31.2304, lng: 121.4737, tz: 8 },
    { name: 'Quảng Châu, Trung Quốc', lat: 23.1291, lng: 113.2644, tz: 8 },
    { name: 'Đài Bắc, Đài Loan', lat: 25.0330, lng: 121.5654, tz: 8 },
    { name: 'Hồng Kông', lat: 22.3193, lng: 114.1694, tz: 8 },
    { name: 'Bangkok, Thái Lan', lat: 13.7563, lng: 100.5018, tz: 7 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 8 },
    { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869, tz: 8 },
    { name: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456, tz: 7 },
    { name: 'Manila, Philippines', lat: 14.5995, lng: 120.9842, tz: 8 },

    // --- CHÂU ÚC & CHÂU ÂU ---
    { name: 'Sydney, Úc', lat: -33.8688, lng: 151.2093, tz: 10 },
    { name: 'Melbourne, Úc', lat: -37.8136, lng: 144.9631, tz: 10 },
    { name: 'Brisbane, Úc', lat: -27.4698, lng: 153.0251, tz: 10 },
    { name: 'Auckland, New Zealand', lat: -36.8485, lng: 174.7633, tz: 12 },
    { name: 'London, Anh', lat: 51.5074, lng: -0.1278, tz: 0 },
    { name: 'Paris, Pháp', lat: 48.8566, lng: 2.3522, tz: 1 },
    { name: 'Berlin, Đức', lat: 52.5200, lng: 13.4050, tz: 1 },
    { name: 'Frankfurt, Đức', lat: 50.1109, lng: 8.6821, tz: 1 },
    { name: 'München, Đức', lat: 48.1351, lng: 11.5820, tz: 1 },
    { name: 'Praha, Cộng hòa Séc', lat: 50.0755, lng: 14.4378, tz: 1 },
    { name: 'Warsaw, Ba Lan', lat: 52.2297, lng: 21.0122, tz: 1 },
    { name: 'Moscow, Nga', lat: 55.7558, lng: 37.6173, tz: 3 },
    { name: 'Amsterdam, Hà Lan', lat: 52.3676, lng: 4.9041, tz: 1 },
    { name: 'Brussels, Bỉ', lat: 50.8503, lng: 4.3517, tz: 1 },
    { name: 'Rome, Ý', lat: 41.9028, lng: 12.4964, tz: 1 },

    // --- CHÂU MỸ ---
    { name: 'New York, Mỹ', lat: 40.7128, lng: -74.0060, tz: -5 },
    { name: 'California, Mỹ', lat: 36.7783, lng: -119.4179, tz: -8 },
    { name: 'Los Angeles, Mỹ', lat: 34.0522, lng: -118.2437, tz: -8 },
    { name: 'San Jose, Mỹ', lat: 37.3382, lng: -121.8863, tz: -8 },
    { name: 'San Francisco, Mỹ', lat: 37.7749, lng: -122.4194, tz: -8 },
    { name: 'Houston, Texas, Mỹ', lat: 29.7604, lng: -95.3698, tz: -6 },
    { name: 'Dallas, Texas, Mỹ', lat: 32.7767, lng: -96.7970, tz: -6 },
    { name: 'Chicago, Mỹ', lat: 41.8781, lng: -87.6298, tz: -6 },
    { name: 'Seattle, Mỹ', lat: 47.6062, lng: -122.3321, tz: -8 },
    { name: 'Washington D.C., Mỹ', lat: 38.9072, lng: -77.0369, tz: -5 },
    { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832, tz: -5 },
    { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207, tz: -8 },

    // --- TÙY CHỈNH THỦ CÔNG ---
    { name: '📍 Khác (Nhập tọa độ thủ công...)', lat: 0, lng: 0, tz: 7, isCustom: true }
  ];

  // Cosmic particles background
  function createStarfield(container) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.4;';
    container.appendChild(canvas);

    function resize() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      drawStars();
    }

    function drawStars() {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 1.5;
        const alpha = Math.random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 160, 255, ${alpha})`;
        ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return canvas;
  }

  function showOnboarding(onComplete) {
    // Remove any existing onboarding
    document.getElementById('onboarding-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: linear-gradient(135deg, #050810 0%, #0a0f1e 40%, #0f0a1a 70%, #080c18 100%);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    `;

    createStarfield(overlay);

    const AL = window.AstrologyLogic;
    const locations = (AL && AL.FourPillars && AL.FourPillars.LOCATIONS) ? AL.FourPillars.LOCATIONS : LOCATIONS_VN;

    overlay.innerHTML += `
      <div class="ob-container" style="
        position: relative; z-index: 1;
        max-width: 540px; width: 94%; margin: auto;
        padding: 40px 36px;
        background: rgba(10, 12, 30, 0.85);
        border: 1px solid rgba(120, 80, 220, 0.35);
        border-radius: 24px;
        box-shadow: 0 0 80px rgba(100, 60, 200, 0.25), 0 0 1px rgba(255,255,255,0.08) inset;
        backdrop-filter: blur(20px);
        animation: ob-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        max-height: 92vh; overflow-y: auto;
      ">
        <!-- Logo -->
        <div style="text-align:center; margin-bottom:28px;">
          <div style="font-size:3rem; margin-bottom:8px; filter: drop-shadow(0 0 20px rgba(150,100,255,0.6));">☯</div>
          <h1 style="font-family:'Cinzel',serif; font-size:1.8rem; font-weight:700; color:#fff; margin:0; letter-spacing:0.1em;">NỘI TÂM</h1>
          <p style="color:rgba(180,160,255,0.7); font-size:0.9rem; margin:6px 0 0; letter-spacing:0.05em;">Hành trình khám phá vận mệnh cá nhân</p>
        </div>

        <!-- Step indicator -->
        <div style="display:flex; justify-content:center; gap:8px; margin-bottom:28px;" id="ob-steps">
          <div class="ob-step active" data-step="1" style="width:32px; height:4px; border-radius:2px; background:rgba(140,100,255,0.9); transition:all 0.3s;"></div>
          <div class="ob-step" data-step="2" style="width:32px; height:4px; border-radius:2px; background:rgba(255,255,255,0.15); transition:all 0.3s;"></div>
          <div class="ob-step" data-step="3" style="width:32px; height:4px; border-radius:2px; background:rgba(255,255,255,0.15); transition:all 0.3s;"></div>
        </div>

        <!-- STEP 1: Welcome & Name -->
        <div id="ob-step-1" class="ob-step-panel">
          <h2 style="font-size:1.25rem; font-weight:700; color:#e8d5ff; margin:0 0 8px; text-align:center;">✨ Chào Mừng Bạn</h2>
          <p style="color:rgba(200,180,255,0.65); font-size:0.88rem; text-align:center; margin:0 0 24px; line-height:1.6;">
            App sẽ lập lá số Tử Vi riêng cho bạn và cá nhân hóa toàn bộ trải nghiệm.<br>Hãy bắt đầu bằng một vài thông tin cơ bản.
          </p>

          <div style="margin-bottom:16px;">
            <label class="ob-label">HỌ TÊN CỦA BẠN</label>
            <input type="text" id="ob-name" class="ob-input" placeholder="VD: Nguyễn Văn A" autocomplete="given-name" maxlength="60">
          </div>

          <div style="margin-bottom:24px;">
            <label class="ob-label">GIỚI TÍNH</label>
            <div style="display:flex; gap:12px;">
              <label class="ob-radio-label" style="flex:1;">
                <input type="radio" name="ob-gender" value="Nam" checked> ♂ Nam
              </label>
              <label class="ob-radio-label" style="flex:1;">
                <input type="radio" name="ob-gender" value="Nữ"> ♀ Nữ
              </label>
            </div>
          </div>

          <button class="ob-btn-primary" id="ob-next-1" onclick="window._obNext(1)">Tiếp Theo →</button>
        </div>

        <!-- STEP 2: Birth Date & Time -->
        <div id="ob-step-2" class="ob-step-panel" style="display:none;">
          <h2 style="font-size:1.25rem; font-weight:700; color:#e8d5ff; margin:0 0 8px; text-align:center;">📅 Ngày Giờ Sinh</h2>
          <p style="color:rgba(200,180,255,0.65); font-size:0.88rem; text-align:center; margin:0 0 20px; line-height:1.6;">Nhập theo <strong style="color:#c4a0ff;">Dương lịch</strong>. Giờ sinh càng chính xác, lá số càng đúng.</p>

          <div style="display:grid; grid-template-columns:1fr 1fr 1.4fr; gap:12px; margin-bottom:16px;">
            <div>
              <label class="ob-label">NGÀY</label>
              <input type="number" id="ob-day" class="ob-input" min="1" max="31" placeholder="20" value="20" style="text-align:center;">
            </div>
            <div>
              <label class="ob-label">THÁNG</label>
              <input type="number" id="ob-month" class="ob-input" min="1" max="12" placeholder="4" value="4" style="text-align:center;">
            </div>
            <div>
              <label class="ob-label">NĂM SINH</label>
              <input type="number" id="ob-year" class="ob-input" min="1900" max="2020" placeholder="2000" value="2000" style="text-align:center;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div>
              <label class="ob-label">GIỜ SINH</label>
              <input type="number" id="ob-hour" class="ob-input" min="0" max="23" placeholder="21" value="21" style="text-align:center;">
            </div>
            <div>
              <label class="ob-label">PHÚT</label>
              <input type="number" id="ob-minute" class="ob-input" min="0" max="59" placeholder="0" value="0" style="text-align:center;">
            </div>
          </div>

          <div style="background:rgba(100,70,200,0.12); border:1px solid rgba(100,70,200,0.25); border-radius:12px; padding:10px 14px; margin-bottom:20px; font-size:0.82rem; color:rgba(200,180,255,0.7);">
            💡 Nếu không nhớ chính xác giờ sinh, hãy dùng giờ gần đúng nhất. Bạn có thể chỉnh lại sau trong phần Cài đặt.
          </div>

          <div style="display:flex; gap:10px;">
            <button class="ob-btn-secondary" onclick="window._obBack(2)">← Quay Lại</button>
            <button class="ob-btn-primary" style="flex:2;" onclick="window._obNext(2)">Tiếp Theo →</button>
          </div>
        </div>

        <!-- STEP 3: Location & Finalize -->
        <div id="ob-step-3" class="ob-step-panel" style="display:none;">
          <h2 style="font-size:1.25rem; font-weight:700; color:#e8d5ff; margin:0 0 8px; text-align:center;">📍 Nơi Sinh & Hoàn Tất</h2>
          <p style="color:rgba(200,180,255,0.65); font-size:0.88rem; text-align:center; margin:0 0 20px; line-height:1.6;">Vị trí nơi sinh để tính <strong style="color:#c4a0ff;">Giờ Mặt Trời Thực</strong> — yếu tố quan trọng trong Tứ Trụ.</p>

          <div style="margin-bottom:16px;">
            <label class="ob-label">NƠI SINH</label>
            <select id="ob-location" class="ob-input" style="cursor:pointer;">
              ${locations.map(loc =>
                `<option value="${loc.name}" data-lat="${loc.lat}" data-lng="${loc.lng}" data-tz="${loc.tz}">${loc.name}</option>`
              ).join('')}
            </select>
          </div>

          <!-- Summary preview -->
          <div id="ob-summary" style="background:rgba(100,70,200,0.12); border:1px solid rgba(100,70,200,0.3); border-radius:14px; padding:16px; margin-bottom:20px;">
            <div style="font-size:0.78rem; color:rgba(200,180,255,0.6); margin-bottom:8px; letter-spacing:0.05em;">XÁC NHẬN THÔNG TIN</div>
            <div id="ob-summary-content" style="color:#e0d0ff; font-size:0.92rem; line-height:1.8;"></div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="ob-btn-secondary" onclick="window._obBack(3)">← Quay Lại</button>
            <button class="ob-btn-primary ob-btn-glow" id="ob-finish" style="flex:2;" onclick="window._obFinish()">
              ✨ Bắt Đầu Hành Trình
            </button>
          </div>
        </div>
      </div>
    `;

    // Inject styles
    if (!document.getElementById('ob-styles')) {
      const style = document.createElement('style');
      style.id = 'ob-styles';
      style.textContent = `
        @keyframes ob-appear {
          from { opacity:0; transform:translateY(30px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .ob-label {
          display:block; font-size:0.7rem; font-weight:700;
          color:rgba(180,150,255,0.7); letter-spacing:0.12em;
          margin-bottom:6px;
        }
        .ob-input {
          width:100%; box-sizing:border-box;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(150,100,255,0.25);
          border-radius:10px; padding:10px 14px;
          color:#e8d5ff; font-size:0.95rem;
          font-family:var(--font-primary,'DM Sans'),sans-serif;
          transition:border-color 0.2s, box-shadow 0.2s;
          outline:none;
        }
        .ob-input:focus {
          border-color:rgba(150,100,255,0.6);
          box-shadow:0 0 0 3px rgba(150,100,255,0.12);
        }
        .ob-input::placeholder { color:rgba(180,150,255,0.35); }
        select.ob-input option { background:#12102a; color:#e8d5ff; }
        .ob-radio-label {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(150,100,255,0.2);
          border-radius:10px; padding:10px 14px;
          color:#e0d0ff; font-size:0.9rem; font-weight:600;
          cursor:pointer; transition:all 0.2s;
          justify-content:center;
        }
        .ob-radio-label:has(input:checked) {
          background:rgba(140,80,255,0.2);
          border-color:rgba(140,80,255,0.5);
          color:#c4a0ff;
        }
        .ob-radio-label input { accent-color:#a070ff; }
        .ob-btn-primary {
          width:100%; padding:13px 20px;
          background:linear-gradient(135deg, #7b3fe4 0%, #9b59f5 100%);
          border:none; border-radius:12px;
          color:#fff; font-size:0.95rem; font-weight:700;
          cursor:pointer; transition:all 0.25s;
          letter-spacing:0.03em;
        }
        .ob-btn-primary:hover {
          transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(120,60,240,0.4);
        }
        .ob-btn-primary:active { transform:translateY(0); }
        .ob-btn-secondary {
          flex:1; padding:13px 16px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:12px;
          color:rgba(200,180,255,0.8); font-size:0.9rem; font-weight:600;
          cursor:pointer; transition:all 0.2s;
        }
        .ob-btn-secondary:hover { background:rgba(255,255,255,0.1); }
        .ob-btn-glow {
          box-shadow:0 4px 20px rgba(120,60,240,0.35);
          animation:ob-glow-pulse 2.5s ease-in-out infinite;
        }
        @keyframes ob-glow-pulse {
          0%, 100% { box-shadow:0 4px 20px rgba(120,60,240,0.35); }
          50%       { box-shadow:0 6px 32px rgba(140,80,255,0.55); }
        }
        .ob-container::-webkit-scrollbar { width:4px; }
        .ob-container::-webkit-scrollbar-track { background:transparent; }
        .ob-container::-webkit-scrollbar-thumb { background:rgba(150,100,255,0.3); border-radius:2px; }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // Navigation helpers
    let currentStep = 1;

    function goToStep(step) {
      document.querySelectorAll('.ob-step-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`ob-step-${step}`).style.display = 'block';
      document.querySelectorAll('#ob-steps .ob-step').forEach(s => {
        const isActive = parseInt(s.dataset.step) <= step;
        s.style.background = isActive ? 'rgba(140,100,255,0.9)' : 'rgba(255,255,255,0.15)';
        s.style.width = s.dataset.step == step ? '48px' : '32px';
      });
      currentStep = step;
    }

    window._obNext = function(step) {
      if (step === 1) {
        const name = document.getElementById('ob-name').value.trim();
        if (!name) {
          document.getElementById('ob-name').focus();
          document.getElementById('ob-name').style.borderColor = 'rgba(255,80,80,0.6)';
          return;
        }
        document.getElementById('ob-name').style.borderColor = '';
        goToStep(2);
      } else if (step === 2) {
        const day = parseInt(document.getElementById('ob-day').value);
        const month = parseInt(document.getElementById('ob-month').value);
        const year = parseInt(document.getElementById('ob-year').value);
        if (!day || !month || !year || year < 1900 || year > 2020) {
          alert('Vui lòng nhập ngày tháng năm sinh hợp lệ (1900–2020).');
          return;
        }
        updateSummary();
        goToStep(3);
      }
    };

    window._obBack = function(step) {
      goToStep(step - 1);
    };

    function updateSummary() {
      const name = document.getElementById('ob-name').value.trim() || 'Bạn';
      const gender = document.querySelector('input[name="ob-gender"]:checked')?.value || 'Nam';
      const day = document.getElementById('ob-day').value || '20';
      const month = document.getElementById('ob-month').value || '4';
      const year = document.getElementById('ob-year').value || '2000';
      const hourVal = document.getElementById('ob-hour').value;
      const hourStr = (hourVal !== '' && hourVal !== null && hourVal !== undefined) ? hourVal : '0';
      const minute = document.getElementById('ob-minute').value || '0';
      const locEl = document.getElementById('ob-location');
      const locName = locEl ? locEl.options[locEl.selectedIndex]?.text : '';

      const summaryEl = document.getElementById('ob-summary-content');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div>👤 <strong>${name}</strong> — ${gender}</div>
          <div>🎂 Sinh: <strong>${day}/${month}/${year}</strong> lúc <strong>${hourStr}:${(minute||'0').toString().padStart(2,'0')}</strong></div>
          <div>📍 Nơi sinh: <strong>${locName}</strong></div>
        `;
      }
    }

    window._obFinish = function() {
      const name = document.getElementById('ob-name').value.trim();
      const gender = document.querySelector('input[name="ob-gender"]:checked')?.value || 'Nam';
      const day = parseInt(document.getElementById('ob-day').value) || 20;
      const month = parseInt(document.getElementById('ob-month').value) || 4;
      const year = parseInt(document.getElementById('ob-year').value) || 2000;
      const rawHour = parseInt(document.getElementById('ob-hour').value);
      const hour = isNaN(rawHour) ? 21 : rawHour;
      const rawMin = parseInt(document.getElementById('ob-minute').value);
      const minute = isNaN(rawMin) ? 0 : rawMin;
      const locEl = document.getElementById('ob-location');
      const selectedOpt = locEl ? locEl.options[locEl.selectedIndex] : null;
      const locationName = selectedOpt ? selectedOpt.value : 'Hà Nội';
      const lat = selectedOpt ? parseFloat(selectedOpt.dataset.lat) || 21.03 : 21.03;
      const lng = selectedOpt ? parseFloat(selectedOpt.dataset.lng) || 105.85 : 105.85;
      const tz = selectedOpt ? parseInt(selectedOpt.dataset.tz) || 7 : 7;

      const profile = {
        name, gender, day, month, year, hour, minute,
        locationName, lat, lng, tz,
        createdAt: new Date().toISOString(),
        version: 1
      };

      saveProfile(profile);

      // Also save to chart_config for backward compatibility
      localStorage.setItem('noitam_chart_config', JSON.stringify({
        gender, year, month, day, hour, minute,
        locationName, lat, lng, tz
      }));

      // Animate out
      const finishBtn = document.getElementById('ob-finish');
      if (finishBtn) {
        finishBtn.textContent = '🌟 Đang lập lá số...';
        finishBtn.disabled = true;
      }

      setTimeout(() => {
        overlay.style.transition = 'opacity 0.6s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          if (onComplete) onComplete(profile);
        }, 600);
      }, 800);
    };

    // Listen for location change to update summary
    document.getElementById('ob-location')?.addEventListener('change', updateSummary);

    goToStep(1);
    // Focus first input
    setTimeout(() => document.getElementById('ob-name')?.focus(), 100);
  }

  // ── Profile Editor (for settings) ──
  function showProfileEditor(currentProfile, onSave) {
    const AL = window.AstrologyLogic;
    const locations = (AL && AL.FourPillars && AL.FourPillars.LOCATIONS) ? AL.FourPillars.LOCATIONS : LOCATIONS_VN;
    const p = currentProfile || {};

    const { Modal, Toast } = App;

    Modal.show(`
      <div style="display:flex; flex-direction:column; gap:14px; padding:4px 0;">
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px;">HỌ TÊN</label>
          <input type="text" id="pe-name" class="form-input" value="${p.name || ''}" placeholder="Họ và tên của bạn" style="width:100%;">
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px;">GIỚI TÍNH</label>
          <div style="display:flex; gap:12px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
              <input type="radio" name="pe-gender" value="Nam" ${(p.gender||'Nam') === 'Nam' ? 'checked' : ''}> ♂ Nam
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
              <input type="radio" name="pe-gender" value="Nữ" ${(p.gender) === 'Nữ' ? 'checked' : ''}> ♀ Nữ
            </label>
          </div>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px;">NGÀY THÁNG NĂM SINH</label>
          <div style="display:grid; grid-template-columns:1fr 1fr 1.5fr; gap:8px;">
            <input type="number" id="pe-day" class="form-input" min="1" max="31" value="${p.day||20}" placeholder="Ngày" style="text-align:center;">
            <input type="number" id="pe-month" class="form-input" min="1" max="12" value="${p.month||4}" placeholder="Tháng" style="text-align:center;">
            <input type="number" id="pe-year" class="form-input" min="1900" max="2020" value="${p.year||2000}" placeholder="Năm" style="text-align:center;">
          </div>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px;">GIỜ:PHÚT SINH</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="number" id="pe-hour" class="form-input" min="0" max="23" value="${p.hour !== undefined && p.hour !== null ? p.hour : 21}" placeholder="Giờ" style="text-align:center;">
            <input type="number" id="pe-minute" class="form-input" min="0" max="59" value="${p.minute !== undefined && p.minute !== null ? p.minute : 0}" placeholder="Phút" style="text-align:center;">
          </div>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px;">NƠI SINH</label>
          <select id="pe-location" class="form-input" style="width:100%;">
            ${locations.map(loc =>
              `<option value="${loc.name}" data-lat="${loc.lat}" data-lng="${loc.lng}" data-tz="${loc.tz}" ${loc.name === (p.locationName||'Hà Nội') ? 'selected' : ''}>${loc.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    `, {
      title: '⚙️ Chỉnh Sửa Hồ Sơ Cá Nhân',
      footer: `
        <button class="btn btn-ghost" onclick="App.Modal.close()">Hủy</button>
        <button class="btn btn-primary" id="pe-save-btn">💾 Lưu Hồ Sơ</button>
      `
    });

    setTimeout(() => {
      document.getElementById('pe-save-btn')?.addEventListener('click', () => {
        const name = document.getElementById('pe-name')?.value.trim() || 'Bạn';
        const gender = document.querySelector('input[name="pe-gender"]:checked')?.value || 'Nam';
        const day = parseInt(document.getElementById('pe-day')?.value) || 20;
        const month = parseInt(document.getElementById('pe-month')?.value) || 4;
        const year = parseInt(document.getElementById('pe-year')?.value) || 2000;
        const peHourRaw = parseInt(document.getElementById('pe-hour')?.value);
        const hour = isNaN(peHourRaw) ? 21 : peHourRaw;
        const peMinRaw = parseInt(document.getElementById('pe-minute')?.value);
        const minute = isNaN(peMinRaw) ? 0 : peMinRaw;
        const locEl = document.getElementById('pe-location');
        const selectedOpt = locEl?.options[locEl.selectedIndex];
        const locationName = selectedOpt?.value || 'Hà Nội';
        const lat = parseFloat(selectedOpt?.dataset.lat) || 21.03;
        const lng = parseFloat(selectedOpt?.dataset.lng) || 105.85;
        const tz = parseInt(selectedOpt?.dataset.tz) || 7;

        const updatedProfile = {
          ...(currentProfile || {}),
          name, gender, day, month, year, hour, minute,
          locationName, lat, lng, tz,
          updatedAt: new Date().toISOString()
        };

        saveProfile(updatedProfile);
        localStorage.setItem('noitam_chart_config', JSON.stringify({ gender, year, month, day, hour, minute, locationName, lat, lng, tz }));

        App.Modal.close();
        Toast.show('✅ Đã lưu hồ sơ cá nhân!', 'success');
        if (onSave) onSave(updatedProfile);
      });
    }, 100);
  }

  // ── Exports ──
  window.Onboarding = {
    hasProfile,
    getProfile,
    saveProfile,
    showOnboarding,
    showProfileEditor
  };

})();
