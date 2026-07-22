// ============================================
// NỘI TÂM — Karma & Habit Hub (Game-Hóa Cải Mệnh & Bảng Cân Bằng Phúc Đức)
// ============================================

(function () {
  'use strict';

  function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  }

  function getTaskState() {
    const data = App.Storage.get('tasks_state') || {};
    const today = getTodayKey();
    if (data.date !== today) {
      return { date: today, completed: {} };
    }
    return data;
  }

  function saveTaskState(state) {
    App.Storage.set('tasks_state', state);
  }

  function getPhucDucPoints() {
    return App.Storage.get('phuc_duc_points') || 0;
  }

  function addPhucDucPoints(pts) {
    const current = getPhucDucPoints();
    const next = Math.max(0, current + pts);
    App.Storage.set('phuc_duc_points', next);
    return next;
  }

  function getStreakDays() {
    return App.Storage.get('karma_streak') || 1;
  }

  function renderTasks(container) {
    const { Utils, Toast, DetailPanel } = App;
    let activeSubTab = 'daily'; // 'daily' | 'monthly' | 'mastery'

    function render() {
      const todayStr = getTodayKey();
      const totalPoints = getPhucDucPoints();
      const streak = getStreakDays();
      const levelInfo = (window.AstrologyLogic && window.AstrologyLogic.getKarmaLevelInfo) ? window.AstrologyLogic.getKarmaLevelInfo(totalPoints) : {
        current: { level: 1, title: 'Người Quan Sát', icon: '🌱', maxKp: 100 },
        kp: totalPoints,
        progressPct: 50
      };

      const taskState = getTaskState();

      // Dynamic remedies from daily Luu Sao
      const dailyQuests = (window.AstrologyLogic && window.AstrologyLogic.generateKarmaQuests) ? window.AstrologyLogic.generateKarmaQuests(todayStr) : [];

      // Monthly campaigns
      const monthlyQuests = [
        {
          id: 'q_month_01',
          targetStar: 'Lưu Tật Ách Hóa Kị',
          nature: 'Chiến dịch Tháng',
          title: 'Detox Thân Tâm 30 Ngày',
          description: 'Uống đủ 2L nước, ăn chay 4 ngày âm lịch, nghe nhạc tần số Solfeggio 528Hz trước khi ngủ.',
          kpReward: 50,
          element: 'Water',
          category: 'monthly'
        },
        {
          id: 'q_month_02',
          targetStar: 'Lưu Kình Dương Cung Quan',
          nature: 'Chiến dịch Tháng',
          title: 'Rèn Luyện Kỷ Luật Kim Cương',
          description: 'Dành 45 phút học tập/đọc tài liệu chuyên môn mỗi ngày, hoàn thành 100% việc trong ngày.',
          kpReward: 60,
          element: 'Metal',
          category: 'monthly'
        }
      ];

      // Mastery quests (Items 91-100 from TUVI_DATA)
      const tuviMasteryItems = (window.TUVI_DATA || []).filter(d => d.id >= 91 && d.id <= 100);
      const masteryQuests = tuviMasteryItems.map(item => ({
        id: `q_mastery_${item.id}`,
        targetStar: `Mục #${item.id}`,
        nature: 'Cốt lõi Cải mệnh',
        title: item.title,
        description: item.content.substring(0, 120) + '...',
        kpReward: 30,
        element: 'Earth',
        category: 'mastery'
      }));

      const activeQuests = activeSubTab === 'daily' ? dailyQuests : activeSubTab === 'monthly' ? monthlyQuests : masteryQuests;
      const completedCount = activeQuests.filter(q => taskState.completed[q.id]).length;

      container.innerHTML = `
        <div class="karma-hub-container animate-fade-in">
          <!-- Game-ification Profile Header Banner -->
          <div class="card mb-lg" style="background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%); border: 1px solid var(--border-accent); padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
              
              <!-- Level & Title -->
              <div style="display:flex; align-items:center; gap:14px;">
                <div style="font-size:2.5rem; background:var(--bg-card); padding:10px; border-radius:50%; border:2px solid var(--border-accent); box-shadow:var(--shadow-sm);">
                  ${levelInfo.current.icon}
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="tag tag-accent" style="font-size:0.8rem; font-weight:700;">Lv ${levelInfo.current.level}</span>
                    <h2 style="font-size:1.25rem; font-weight:700; margin:0; color:var(--text-primary);">${levelInfo.current.title}</h2>
                  </div>
                  <p style="color:var(--text-secondary); margin-top:4px; font-size:0.88rem;">
                    "${levelInfo.current.desc}"
                  </p>
                </div>
              </div>

              <!-- Metrics Widget -->
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <div style="background:var(--bg-card); padding:10px 16px; border-radius:12px; border:1px solid var(--border-color); text-align:center; min-width:120px;">
                  <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:600;">Phúc Đức (KP)</div>
                  <div id="phuc-duc-display" style="font-size:1.4rem; font-weight:800; color:var(--accent-primary);">
                    ✨ ${totalPoints}
                  </div>
                </div>

                <div style="background:var(--bg-card); padding:10px 16px; border-radius:12px; border:1px solid var(--border-color); text-align:center; min-width:110px;">
                  <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:600;">Chuỗi Streak</div>
                  <div style="font-size:1.4rem; font-weight:800; color:var(--warning-color, #f59e0b);">
                    🔥 ${streak} ngày
                  </div>
                </div>
              </div>
            </div>

            <!-- Level Upgrade Progress Bar -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:6px; font-weight:600; color:var(--text-muted);">
                <span>Tiến trình nâng cấp ${levelInfo.next ? `(Mục tiêu tiếp theo: ${levelInfo.next.icon} ${levelInfo.next.title})` : ''}</span>
                <span style="color:var(--accent-primary);">${levelInfo.progressPct}%</span>
              </div>
              <div style="width:100%; height:10px; background:var(--bg-card); border-radius:5px; overflow:hidden; border:1px solid var(--border-color);">
                <div style="width:${levelInfo.progressPct}%; height:100%; background:linear-gradient(90deg, #10b981, #6366f1, #8b5cf6); transition:width 0.4s ease;"></div>
              </div>
            </div>
          </div>

          <!-- Quest Category Navigation Tabs -->
          <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px; flex-wrap:wrap;">
            <button class="btn btn-tab ${activeSubTab === 'daily' ? 'active' : ''}" data-subtab="daily" style="font-weight:600; border-radius:20px; padding:6px 16px; background:${activeSubTab === 'daily' ? 'var(--accent-muted)' : 'transparent'}; color:${activeSubTab === 'daily' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; border:1px solid ${activeSubTab === 'daily' ? 'var(--border-accent)' : 'transparent'};">
              ⚡ Nhiệm Vụ Nhật Hạn (${dailyQuests.length})
            </button>
            <button class="btn btn-tab ${activeSubTab === 'monthly' ? 'active' : ''}" data-subtab="monthly" style="font-weight:600; border-radius:20px; padding:6px 16px; background:${activeSubTab === 'monthly' ? 'var(--accent-muted)' : 'transparent'}; color:${activeSubTab === 'monthly' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; border:1px solid ${activeSubTab === 'monthly' ? 'var(--border-accent)' : 'transparent'};">
              🎯 Chiến Dịch Tháng (${monthlyQuests.length})
            </button>
            <button class="btn btn-tab ${activeSubTab === 'mastery' ? 'active' : ''}" data-subtab="mastery" style="font-weight:600; border-radius:20px; padding:6px 16px; background:${activeSubTab === 'mastery' ? 'var(--accent-muted)' : 'transparent'}; color:${activeSubTab === 'mastery' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; border:1px solid ${activeSubTab === 'mastery' ? 'var(--border-accent)' : 'transparent'};">
              💎 Cốt Lõi Cải Mệnh (${masteryQuests.length})
            </button>
          </div>

          <!-- Section Header & Weekly Summary button -->
          <div class="section-title" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:1.05rem;">
              ${activeSubTab === 'daily' ? '⚡ Danh Sách Hóa Giải Sao Lưu Nhật Hạn' : activeSubTab === 'monthly' ? '🎯 Chiến Dịch Hóa Giải Tháng' : '💎 10 Chỉ Số Cải Mệnh Tử Vi'}
            </span>
            <button class="btn btn-sm btn-ghost" id="btn-weekly-report" style="color:var(--accent-primary);">📊 Bảng Cân Bằng Phúc Đức</button>
          </div>

          <!-- Quest List Grid -->
          <div class="grid-auto" style="gap:14px; margin-bottom:24px;">
            ${activeQuests.map((quest) => {
              const isDone = !!taskState.completed[quest.id];
              return `
                <div class="card quest-item-card ${isDone ? 'task-done' : ''}" data-quest-id="${quest.id}" style="padding:16px; border-left:4px solid ${isDone ? '#10b981' : 'var(--accent-primary)'}; transition:all 0.3s ease; position:relative;">
                  <div style="display:flex; align-items:flex-start; gap:12px;">
                    <label class="custom-checkbox" style="margin-top:2px; cursor:pointer;">
                      <input type="checkbox" class="quest-checkbox" data-id="${quest.id}" data-points="${quest.kpReward}" ${isDone ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer; accent-color:#10b981;">
                    </label>
                    
                    <div style="flex:1;">
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                        <h4 class="quest-title" style="margin:0; font-size:0.98rem; font-weight:700; ${isDone ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">
                          ${Utils.escapeHtml(quest.title)}
                        </h4>
                        <span class="tag tag-accent" style="font-size:0.75rem;">
                          +${quest.kpReward} KP
                        </span>
                        <span class="tag tag-ghost" style="font-size:0.75rem; background:rgba(245,158,11,0.1); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">
                          📌 ${quest.targetStar}
                        </span>
                        <span class="tag tag-ghost" style="font-size:0.75rem;">
                          Hành: ${quest.element}
                        </span>
                      </div>

                      <p style="font-size:0.88rem; color:var(--text-secondary); margin:4px 0; line-height:1.5;">
                        ${Utils.escapeHtml(quest.description)}
                      </p>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      // Bind Subtab clicks
      container.querySelectorAll('[data-subtab]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSubTab = btn.dataset.subtab;
          render();
        });
      });

      // Bind Checkbox logic
      container.querySelectorAll('.quest-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const questId = e.target.dataset.id;
          const pts = parseInt(e.target.dataset.points, 10) || 20;
          const isChecked = e.target.checked;

          const currentState = getTaskState();
          if (isChecked) {
            currentState.completed[questId] = true;
            addPhucDucPoints(pts);
            Toast.show(`✨ +${pts} Điểm Phúc Đức (KP)! Tiến trình chuyển hóa tăng trưởng!`, 'success', 2500);
            render();
          } else {
            delete currentState.completed[questId];
            addPhucDucPoints(-pts);
            render();
          }
          saveTaskState(currentState);
        });
      });

      // Weekly Report Button
      container.querySelector('#btn-weekly-report')?.addEventListener('click', () => {
        const pts = getPhucDucPoints();
        DetailPanel.show(
          '📊 Báo Cáo Cân Bằng Phúc Đức & Cải Mệnh Tuần',
          `<div class="insight-block" style="padding:16px; border:none; background:transparent;">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="font-size:3em; margin-bottom:8px;">🏛️</div>
              <h3 style="margin:0; font-size:1.2em; font-weight:700;">Tổng Điểm Phúc Đức Tích Lũy</h3>
              <div style="font-size:2.2em; font-weight:800; color:var(--accent-primary); margin:8px 0;">${pts} KP</div>
              <p style="font-size:0.9em; color:var(--text-secondary); line-height:1.6;">
                Mỗi thói quen hóa giải nhỏ đều đóng góp trực tiếp vào sự cân bằng 5 hành của bản mệnh, giúp triệt tiêu rủi ro sát tinh và tăng trưởng vận khí quý nhân.
              </p>
            </div>
          </div>`
        );
      });
    }

    render();
  }

  window.renderTasks = renderTasks;
})();
