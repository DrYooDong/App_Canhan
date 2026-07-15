// ============================================
// NỘI TÂM — Dashboard Component
// ============================================

(function() {
  'use strict';

  function renderDashboard(container) {
    const { Utils, CRUD } = App;
    const dailyInsight = Utils.getDailyItem(TUVI_DATA);
    const lessons = CRUD.getAll('lessons');
    const rules = CRUD.getAll('rules');
    const reminders = CRUD.getAll('reminders');
    const journals = CRUD.getAll('journals');
    const recentLessons = lessons.slice(0, 3);
    const todayReminder = reminders.length > 0 ? Utils.getDailyItem(reminders) : null;

    // Get all strengths & weaknesses
    const allStrengths = [...new Set(TUVI_DATA.flatMap(d => d.strengths || []))];
    const allWeaknesses = [...new Set(TUVI_DATA.flatMap(d => d.weaknesses || []))];

    container.innerHTML = `
      <div class="animate-fade-in">
        <h1 class="page-title">Xin chào 👋</h1>
        <p class="page-subtitle">Hôm nay bạn sẽ hiểu thêm điều gì về bản thân?</p>
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
            <span class="tag ${Utils.getTypeClass(dailyInsight.type)}">${Utils.getTypeIcon(dailyInsight.type)} ${dailyInsight.type === 'strength' ? 'Điểm mạnh' : dailyInsight.type === 'weakness' ? 'Điểm yếu' : dailyInsight.type === 'warning' ? 'Lưu ý' : 'Thông tin'}</span>
            <span class="text-xs text-muted">Mục #${dailyInsight.id}</span>
          </div>
          <h3 class="card-title">${Utils.escapeHtml(dailyInsight.title)}</h3>
          <p class="card-text">${Utils.escapeHtml(dailyInsight.content).substring(0, 200)}...</p>
          <div class="tags-container">
            ${Utils.renderTags(dailyInsight.tags.slice(0, 4))}
          </div>
        </div>
      </div>

      <!-- Quick Links -->
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
  }

  window.renderDashboard = renderDashboard;
})();
