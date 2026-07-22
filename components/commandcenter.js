// ============================================
// NỘI TÂM — Command Center Component (#10)
// Zero-Click Ambient Morning Brief & TTS Voice Reader
// ============================================

(function () {
  'use strict';

  function renderCommandCenter(container) {
    const AL = window.AstrologyLogic;
    const userProfile = { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };
    const today = new Date();

    let intel = null;
    if (AL && typeof AL.getMasterDailyIntelligence === 'function') {
      intel = AL.getMasterDailyIntelligence(today, userProfile, 'GENERAL');
    }

    const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const score = intel ? intel.scoreResult.score : 85;
    const ratingText = intel ? intel.scoreResult.text : 'Đại Cát';
    const canNgay = intel ? intel.canNgay : 'Giáp';
    const chiNgay = intel ? intel.chiNgay : 'Tý';
    const hanhNgay = intel ? intel.hanhNgay : 'Kim';

    container.innerHTML = `
      <div class="command-center-module animate-fade-in" style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Top HUD Header -->
        <div class="card tuvi-card" style="background:linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)); border:1px solid var(--border-accent); padding:24px; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; color:var(--accent-primary); font-size:0.8rem; font-weight:700; letter-spacing:0.15em;">
                <span>📱 ZERO-CLICK AMBIENT HUD</span>
              </div>
              <h2 style="font-family:'Cinzel',serif; margin:4px 0; color:var(--text-primary); font-size:1.6rem;">
                Trung Tâm Trục Thời Gian Real-Time
              </h2>
              <p style="margin:0; color:var(--text-secondary); font-size:0.9rem;">${dateStr} (${canNgay} ${chiNgay} - Hành ${hanhNgay})</p>
            </div>

            <div style="display:flex; gap:10px; align-items:center;">
              <button class="btn btn-primary" id="btn-tts-readout" style="display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:24px; font-weight:600;">
                <span>🔊</span> Đọc Bản Tin Buổi Sáng
              </button>
            </div>
          </div>
        </div>

        <!-- Glanceable 4-Grid HUD Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px;">
          
          <!-- Card 1: Score & Status -->
          <div class="card" style="padding:20px; border-radius:14px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
            <div style="width:60px; height:60px; border-radius:50%; background:rgba(16, 185, 129, 0.15); border:2px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:800; color:#10b981;">
              ${score}
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Cát Hung Hôm Nay</div>
              <div style="font-weight:700; font-size:1.1rem; color:var(--accent-primary);">${ratingText}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Tụ khí Ngũ Hành ${hanhNgay}</div>
            </div>
          </div>

          <!-- Card 2: Next Best Hour -->
          <div class="card" style="padding:20px; border-radius:14px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
            <div style="width:60px; height:60px; border-radius:50%; background:rgba(59, 130, 246, 0.15); border:2px solid #3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              ⏰
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Giờ Hoàng Đạo Kế Tiếp</div>
              <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary);">09:00 - 11:00 (Tỵ)</div>
              <div style="font-size:0.8rem; color:var(--color-success);">Cát tinh hội tụ: Thích hợp đàm phán</div>
            </div>
          </div>

          <!-- Card 3: Solfeggio Frequency -->
          <div class="card" style="padding:20px; border-radius:14px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
            <div style="width:60px; height:60px; border-radius:50%; background:rgba(139, 92, 246, 0.15); border:2px solid #8b5cf6; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              🎵
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Tần Số Solfeggio</div>
              <div style="font-weight:700; font-size:1.1rem; color:#8b5cf6;">528 Hz — Chữa Lành</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Tái tạo năng lượng tạng phủ</div>
            </div>
          </div>

          <!-- Card 4: Karma Quest -->
          <div class="card" style="padding:20px; border-radius:14px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
            <div style="width:60px; height:60px; border-radius:50%; background:rgba(245, 158, 11, 0.15); border:2px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              🌱
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Nhiệm Vụ Cải Mệnh</div>
              <div style="font-weight:700; font-size:1.0rem; color:var(--text-primary);">Hành Thiện +20 KP</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Mở lời khen ngợi 3 đồng nghiệp</div>
            </div>
          </div>

        </div>

        <!-- Master Summary Box -->
        <div class="card" style="padding:24px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary);">📜 Bản Tin Tóm Tắt Trong 10 Giây</h3>
          <p style="line-height:1.7; color:var(--text-secondary); margin-bottom:12px;">
            Hôm nay là ngày <strong>${canNgay} ${chiNgay}</strong>, hành <strong>${hanhNgay}</strong>. Điểm số năng lượng cá nhân đạt <strong>${score}/100 (${ratingText})</strong>. 
            Môi trường năng lượng ủng hộ việc mở rộng hợp tác, ký kết tài chính trong khung giờ 09:00 - 11:00. Khuyên mặc trang phục tông màu tương sinh và duy trì tâm thái ôn hòa.
          </p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; border-top:1px dashed var(--border-color); padding-top:12px;">
            <button class="btn btn-secondary btn-sm" onclick="App.Router.navigate('finance')">💰 Xem Timing Tài Chính</button>
            <button class="btn btn-secondary btn-sm" onclick="App.Router.navigate('meditation')">🧘 Vào Phòng Thiền</button>
            <button class="btn btn-secondary btn-sm" onclick="App.Router.navigate('rpg')">🎮 Bảng Chỉ Số RPG</button>
          </div>
        </div>

      </div>
    `;

    // TTS Reader logic
    const ttsBtn = container.querySelector('#btn-tts-readout');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // stop current
          const text = `Xin chào Nguyễn Hữu Đông. Hôm nay là ${dateStr}. Điểm số năng lượng cá nhân đạt ${score} điểm, đánh giá ${ratingText}. Giờ hoàng đạo cát tường tiếp theo là từ 9 giờ đến 11 giờ. Chúc bạn một ngày thanh thản và hanh thông.`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'vi-VN';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
          App.Toast.show('Đang đọc bản tin sáng...', 'info');
        } else {
          App.Toast.show('Trình duyệt của bạn không hỗ trợ Text-to-Speech.', 'error');
        }
      });
    }
  }

  window.renderCommandCenter = renderCommandCenter;
})();
