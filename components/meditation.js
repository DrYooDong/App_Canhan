// ============================================
// NỘI TÂM — Meditation Component (#3)
// Phòng Thiền Số & Nhịp Thở Solfeggio (Web Audio API & Canvas Animation)
// ============================================

(function () {
  'use strict';

  let audioCtx = null;
  let currentOscillator = null;
  let isPlayingAudio = false;
  let breathingAnimId = null;

  const SOLFEGGIO_FREQS = [
    { freq: 396, name: '396 Hz', desc: 'Giải tỏa lo âu & giải phóng năng lượng tiêu cực', element: 'Thổ' },
    { freq: 432, name: '432 Hz', desc: 'Định tâm, thư giãn & hòa hợp tự nhiên', element: 'Thủy' },
    { freq: 528, name: '528 Hz', desc: 'Tái tạo tế bào & chữa lành DNA', element: 'Mộc' },
    { freq: 639, name: '639 Hz', desc: 'Mở rộng lòng yêu thương & kết nối mối quan hệ', element: 'Hỏa' },
    { freq: 741, name: '741 Hz', desc: 'Làm sạch tâm trí & tỉnh táo trí tuệ', element: 'Kim' }
  ];

  function startAudio(freq) {
    stopAudio();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      currentOscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      currentOscillator.type = 'sine';
      currentOscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // gentle volume

      currentOscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      currentOscillator.start();
      isPlayingAudio = true;
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  function stopAudio() {
    if (currentOscillator) {
      try {
        currentOscillator.stop();
        currentOscillator.disconnect();
      } catch (e) {}
      currentOscillator = null;
    }
    isPlayingAudio = false;
  }

  function renderMeditation(container) {
    let selectedFreqObj = SOLFEGGIO_FREQS[2]; // Default 528Hz
    let meditationSeconds = 0;
    let timerInterval = null;
    let isMeditating = false;

    container.innerHTML = `
      <div class="meditation-module animate-fade-in" style="display:flex; flex-direction:column; gap:20px; align-items:center;">
        
        <!-- Header Banner -->
        <div class="card tuvi-card" style="width:100%; background:linear-gradient(135deg, rgba(20, 25, 45, 0.95), rgba(10, 15, 30, 0.95)); border:1px solid var(--border-accent); padding:24px; border-radius:16px; text-align:center;">
          <div style="font-size:2rem; margin-bottom:4px;">🧘</div>
          <h2 style="font-family:'Cinzel',serif; margin:0; color:var(--accent-primary); font-size:1.6rem;">
            Phòng Thiền Số & Nhịp Thở Solfeggio
          </h2>
          <p style="margin:6px 0 0 0; color:var(--text-secondary); font-size:0.9rem;">
            Tần Số Âm Thanh Chữa Lành Web Audio & Bài Thở 4-7-8 Trấn An Thần Kinh
          </p>
        </div>

        <!-- Gợi Ý Tần Số Theo Archetype Lá Số -->
        ${(function() {
          const Engine = window.ZiweiLuanGiaiEngine;
          const AL = window.AstrologyLogic;
          if (!Engine || !AL) return '';
          let chart = null;
          const userProfile = (typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : null;
          if (userProfile && AL.TuViEngine) {
            try {
              chart = AL.TuViEngine.calculateTuViChart({
                day: userProfile.day || 1, month: userProfile.month || 1, year: userProfile.year || 1990,
                hour: (userProfile.hour ?? 0), minute: userProfile.minute ?? 0,
                gender: userProfile.gender || 'Nam', canNam: userProfile.canNam || 'Canh', chiNam: userProfile.chiNam || 'Thìn'
              });
            } catch (e) {}
          }
          const menhAnalysis = Engine.analyzeMenhCung(chart);
          const elemMap = { 'Kim': 741, 'Mộc': 528, 'Thủy': 432, 'Hỏa': 639, 'Thổ': 396 };
          const recFreq = elemMap[menhAnalysis.batQuai.hanh] || 528;
          return `
            <div style="width:100%; max-width:600px; background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.25); border-radius:12px; padding:14px; text-align:center;">
              <div style="font-size:0.75rem; color:#a855f7; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">
                ☯ KHUYÊN DÙNG THEO LÁ SỐ CÁ NHÂN
              </div>
              <div style="font-size:0.88rem; color:var(--text-primary);">
                Mệnh an tại <b>${menhAnalysis.batQuai.que}</b> (Hành ${menhAnalysis.batQuai.hanh}) • Archetype <b>${menhAnalysis.primaryStar}</b>
              </div>
              <div style="font-size:0.8rem; color:#c084fc; margin-top:4px; font-weight:600;">
                🎯 Tần số chữa lành đề xuất: <b>${recFreq} Hz</b> để cân bằng trường năng lượng và khai mở trực giác đồng bộ.
              </div>
            </div>
          `;
        })()}

        <!-- Frequency Selector Pills -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          ${SOLFEGGIO_FREQS.map(f => `
            <button class="btn btn-secondary freq-btn ${f.freq === selectedFreqObj.freq ? 'active-freq' : ''}" data-freq="${f.freq}" style="padding:8px 16px; border-radius:20px; font-weight:600; font-size:0.85rem; border:1px solid ${f.freq === selectedFreqObj.freq ? 'var(--border-accent)' : 'var(--border-color)'}; background:${f.freq === selectedFreqObj.freq ? 'var(--accent-muted)' : 'var(--bg-card)'}; color:${f.freq === selectedFreqObj.freq ? 'var(--accent-primary)' : 'var(--text-secondary)'};">
              🎵 ${f.name} (${f.element})
            </button>
          `).join('')}
        </div>

        <div style="font-size:0.85rem; color:var(--text-muted); text-align:center;" id="freq-desc-text">
          ${selectedFreqObj.desc}
        </div>

        <!-- Canvas Breathing Circle -->
        <div class="card" style="padding:30px; border-radius:20px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; flex-direction:column; align-items:center; width:100%; max-width:480px;">
          <canvas id="breathing-canvas" width="280" height="280" style="width:280px; height:280px;"></canvas>

          <div style="margin-top:16px; font-family:'Cinzel',serif; font-size:1.6rem; font-weight:700; color:var(--accent-primary);" id="breathing-guide-text">
            Sẵn Sàng Thiền
          </div>

          <div style="font-size:1.2rem; font-weight:700; color:var(--text-muted); margin-top:6px;" id="meditation-timer">
            00:00
          </div>

          <!-- Controls -->
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button class="btn btn-primary" id="btn-start-meditation" style="padding:10px 24px; border-radius:24px; font-size:1rem; font-weight:600;">
              ▶️ Bắt Đầu Thiền
            </button>
            <button class="btn btn-secondary" id="btn-stop-meditation" style="padding:10px 24px; border-radius:24px; font-size:1rem; font-weight:600; display:none;">
              ⏹️ Dừng
            </button>
          </div>
        </div>

      </div>
    `;

    const canvas = container.querySelector('#breathing-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const guideText = container.querySelector('#breathing-guide-text');
    const timerText = container.querySelector('#meditation-timer');
    const startBtn = container.querySelector('#btn-start-meditation');
    const stopBtn = container.querySelector('#btn-stop-meditation');

    let phaseProgress = 0; // 0 to 1
    let breathPhase = 'INHALE'; // INHALE (4s), HOLD (7s), EXHALE (8s)

    function drawBreathingCircle(radius, label) {
      if (!ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      if (canvas.width !== width * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Glow outer circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      const outerGrad = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 15);
      outerGrad.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
      outerGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = outerGrad;
      ctx.fill();

      // Main gradient circle (Cosmic Violet Theme)
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
      grad.addColorStop(1, 'rgba(109, 40, 217, 0.9)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.stroke();

      // Add small orbiting particles around the circle (visual flare)
      const time = Date.now() / 1000;
      for (let i = 0; i < 3; i++) {
        const angle = time * (1 + i * 0.5) + (i * Math.PI * 2 / 3);
        const px = centerX + (radius + 25) * Math.cos(angle);
        const py = centerY + (radius + 25) * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24'; // Gold particles
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
      }
      ctx.shadowBlur = 0; // Reset shadow

      // Text inside circle
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label || '', centerX, centerY);
    }

    drawBreathingCircle(60, 'Hít Vào');

    function animateBreathing() {
      if (!isMeditating) return;

      const now = Date.now();
      const cycleLength = 19000; // 4s inhale + 7s hold + 8s exhale
      const cycleTime = now % cycleLength;

      let radius = 60;
      let label = 'Hít Vào';

      if (cycleTime < 4000) { // Inhale 4s
        const p = cycleTime / 4000;
        radius = 60 + p * 50; // 60 -> 110
        label = 'Hít Vào (4s)';
      } else if (cycleTime < 11000) { // Hold 7s
        radius = 110;
        label = 'Giữ Hơi (7s)';
      } else { // Exhale 8s
        const p = (cycleTime - 11000) / 8000;
        radius = 110 - p * 50; // 110 -> 60
        label = 'Thở Ra (8s)';
      }

      drawBreathingCircle(radius, label);
      if (guideText) guideText.innerText = label;

      breathingAnimId = requestAnimationFrame(animateBreathing);
    }

    // Freq pill buttons listener
    container.querySelectorAll('.freq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const freq = parseInt(btn.dataset.freq);
        selectedFreqObj = SOLFEGGIO_FREQS.find(f => f.freq === freq) || selectedFreqObj;

        container.querySelectorAll('.freq-btn').forEach(b => {
          const active = parseInt(b.dataset.freq) === freq;
          b.style.background = active ? 'var(--accent-muted)' : 'var(--bg-card)';
          b.style.color = active ? 'var(--accent-primary)' : 'var(--text-secondary)';
          b.style.borderColor = active ? 'var(--border-accent)' : 'var(--border-color)';
        });

        const descText = container.querySelector('#freq-desc-text');
        if (descText) descText.innerText = selectedFreqObj.desc;

        if (isMeditating) {
          startAudio(selectedFreqObj.freq);
        }
      });
    });

    startBtn.addEventListener('click', () => {
      isMeditating = true;
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';

      startAudio(selectedFreqObj.freq);
      animateBreathing();

      meditationSeconds = 0;
      timerInterval = setInterval(() => {
        meditationSeconds++;
        const mins = Math.floor(meditationSeconds / 60).toString().padStart(2, '0');
        const secs = (meditationSeconds % 60).toString().padStart(2, '0');
        if (timerText) timerText.innerText = `${mins}:${secs}`;
      }, 1000);

      App.Toast.show(`Đã bắt đầu thiền với tần số ${selectedFreqObj.name}`, 'success');
    });

    stopBtn.addEventListener('click', () => {
      isMeditating = false;
      stopBtn.style.display = 'none';
      startBtn.style.display = 'inline-block';

      stopAudio();
      if (breathingAnimId) cancelAnimationFrame(breathingAnimId);
      if (timerInterval) clearInterval(timerInterval);

      drawBreathingCircle(60, 'Sẵn Sàng');
      if (guideText) guideText.innerText = 'Hoàn Thành Thiền';

      if (meditationSeconds >= 60) {
        if (window.AstrologyLogic && window.AstrologyLogic.getKarmaLevelInfo) {
          App.Toast.show('Tuyệt vời! Bạn đã tích lũy thêm +15 Điểm Phúc Đức!', 'success');
        }
      }
    });

    // Stop audio if navigating away
    window.addEventListener('hashchange', stopAudio, { once: true });
  }

  window.renderMeditation = renderMeditation;
})();
