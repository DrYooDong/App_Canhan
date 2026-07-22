// ============================================
// NỘI TÂM — Mood Tracker Component (#6)
// Hệ Thống Cảm Xúc Real-Time & Mood-Energy Correlation
// ============================================

(function () {
  'use strict';

  function getStoredMoodLogs() {
    try {
      const stored = localStorage.getItem('noitam_mood_logs');
      return stored ? JSON.parse(stored) : [
        { id: 1, mood: 'Vui Phấn Chấn', val: 5, icon: '😄', organ: '❤️ Tâm (Hỏa)', date: '2026-07-20 09:30' },
        { id: 2, mood: 'An Yên', val: 4, icon: '😌', organ: '🫁 Phổi (Kim)', date: '2026-07-21 14:15' },
        { id: 3, mood: 'Căng Thẳng', val: 2, icon: '😰', organ: '🫀 Gan (Mộc)', date: '2026-07-22 10:00' }
      ];
    } catch (e) {
      return [];
    }
  }

  function saveMoodLogs(logs) {
    try {
      localStorage.setItem('noitam_mood_logs', JSON.stringify(logs));
    } catch (e) {}
  }

  const MOOD_OPTIONS = [
    { mood: 'Vui Phấn Chấn', val: 5, icon: '😄', organ: '❤️ Tâm (Hỏa)' },
    { mood: 'An Yên', val: 4, icon: '😌', organ: '🫁 Phổi (Kim)' },
    { mood: 'Bình Thường', val: 3, icon: '😐', organ: '🫄 Tỳ (Thổ)' },
    { mood: 'Căng Thẳng / Mệt', val: 2, icon: '😰', organ: '🫀 Gan (Mộc)' },
    { mood: 'Lo Vẫn / Trầm', val: 1, icon: '😔', organ: '🫘 Thận (Thủy)' }
  ];

  function renderMoodTracker(container) {
    const AL = window.AstrologyLogic;
    let logs = getStoredMoodLogs();

    let bio = { emotional: 65 };
    if (AL && typeof AL.calculateBiorhythms === 'function') {
      bio = AL.calculateBiorhythms(new Date(1995, 0, 1), new Date());
    }

    const pattern = (AL && typeof AL.analyzeEmotionalPattern === 'function') ? AL.analyzeEmotionalPattern(logs, bio) : {
      harmonyText: 'Hòa hợp tốt với sóng sinh học.',
      logCount: logs.length
    };

    function renderUI() {
      container.innerHTML = `
        <div class="moodtracker-module animate-fade-in" style="display:flex; flex-direction:column; gap:24px;">
          
          <!-- Banner Header -->
          <div class="card tuvi-card" style="background:linear-gradient(135deg, rgba(30, 20, 50, 0.95), rgba(15, 10, 30, 0.95)); border:1px solid var(--border-accent); padding:24px; border-radius:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.8rem;">🌊</span>
                  <div>
                    <h2 style="font-family:'Cinzel',serif; margin:0; color:var(--accent-primary); font-size:1.5rem;">
                      Nhật Ký Cảm Xúc Real-Time & Tương Quan Biorhythm
                    </h2>
                    <p style="margin:4px 0 0 0; color:var(--text-secondary); font-size:0.9rem;">
                      Theo dõi biến động tâm trạng thực tế & Đối chiếu với Sóng Cảm Xúc Biorhythm
                    </p>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); border:1px solid var(--border-accent); padding:6px 14px; border-radius:20px; font-weight:600;">
                  Sóng Cảm Xúc Hôm Nay: ${bio.emotional > 0 ? '+' : ''}${bio.emotional}%
                </span>
              </div>
            </div>
          </div>

          <!-- 1-Tap Mood Logger Widget -->
          <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-card); border:1px solid var(--border-color);">
            <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary); font-size:1.1rem; text-align:center;">
              ⚡ Log Nhanh Cảm Xúc Hiện Tại (1-Tap)
            </h3>

            <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-top:16px;">
              ${MOOD_OPTIONS.map(m => `
                <button class="btn btn-secondary btn-mood-tap" data-mood="${m.mood}" data-val="${m.val}" data-icon="${m.icon}" data-organ="${m.organ}" style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 18px; border-radius:14px; background:var(--bg-surface); border:1px solid var(--border-color);">
                  <span style="font-size:1.8rem;">${m.icon}</span>
                  <span style="font-size:0.85rem; font-weight:600;">${m.mood}</span>
                  <span style="font-size:0.72rem; color:var(--text-muted);">${m.organ}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Insight & Correlation Widget -->
          <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
            <div style="font-size:2rem;">💡</div>
            <div>
              <div style="font-weight:700; font-size:1.0rem; color:var(--accent-primary);">Đánh Giá Tương Quan AI Mood-Biorhythm</div>
              <div style="font-size:0.9rem; color:var(--text-secondary); margin-top:4px;">
                ${pattern.harmonyText} (Đã ghi nhận ${logs.length} bản ghi cảm xúc)
              </div>
            </div>
          </div>

          <!-- History Logs -->
          <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
            <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary); font-size:1.1rem;">
              📜 Lịch Sử Ghi Cảm Xúc
            </h3>

            <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
              ${logs.length === 0 ? `<p style="color:var(--text-muted);">Chưa có ghi nhận cảm xúc nào.</p>` : logs.map(l => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border-radius:10px; border:1px solid var(--border-color);">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.4rem;">${l.icon}</span>
                    <div>
                      <div style="font-weight:600; font-size:0.9rem;">${l.mood}</div>
                      <div style="font-size:0.78rem; color:var(--text-muted);">${l.date} • Tạng phủ: ${l.organ}</div>
                    </div>
                  </div>
                  <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:700;">
                    Mức ${l.val}/5
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;

      // 1-tap listeners
      container.querySelectorAll('.btn-mood-tap').forEach(btn => {
        btn.addEventListener('click', () => {
          const mood = btn.dataset.mood;
          const val = parseInt(btn.dataset.val);
          const icon = btn.dataset.icon;
          const organ = btn.dataset.organ;
          const dateStr = new Date().toLocaleString('vi-VN');

          logs.unshift({
            id: Date.now(),
            mood,
            val,
            icon,
            organ,
            date: dateStr
          });

          saveMoodLogs(logs);
          App.Toast.show(`Đã log cảm xúc: ${icon} ${mood}`, 'success');
          renderUI();
        });
      });
    }

    renderUI();
  }

  window.renderMoodTracker = renderMoodTracker;
})();
