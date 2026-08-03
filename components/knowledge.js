// ============================================
// NỘI TÂM — Knowledge Component (Tri Thức & Phản Tư)
// ============================================

(function () {
  'use strict';

  let activeTab = 'journal'; // 'journal' | 'lessons' | 'rules' | 'reminders'

  function renderKnowledge(container, params) {
    if (params && params[0]) {
      if (['journal', 'lessons', 'rules', 'reminders'].includes(params[0])) {
        activeTab = params[0];
      }
    }

    container.innerHTML = `
      <div class="knowledge-container animate-fade-in">
        <div class="tabs-header">
          <button class="btn btn-tab ${activeTab === 'journal' ? 'active' : ''}" data-tab="journal"><span>📓</span> Nhật Ký Phản Tư</button>
          <button class="btn btn-tab ${activeTab === 'lessons' ? 'active' : ''}" data-tab="lessons"><span>📖</span> Bài Học Đúc Kết</button>
          <button class="btn btn-tab ${activeTab === 'rules' ? 'active' : ''}" data-tab="rules"><span>⚖️</span> Quy Luật Cuộc Sống</button>
          <button class="btn btn-tab ${activeTab === 'reminders' ? 'active' : ''}" data-tab="reminders"><span>💡</span> Lời Nhắc Nhở</button>
        </div>

        <!-- Sub-module Content Container -->
        <div id="knowledge-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#knowledge-sub-content');

    function loadSubTab(tab) {
      activeTab = tab;
      container.querySelectorAll('.btn-tab').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
        btn.style.background = isCurrent ? 'var(--accent-muted)' : 'transparent';
        btn.style.color = isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)';
        btn.style.borderColor = isCurrent ? 'var(--border-accent)' : 'transparent';
      });

      subContent.innerHTML = '';
      if (tab === 'journal' && window.renderJournal) {
        window.renderJournal(subContent);
      } else if (tab === 'lessons' && window.renderLessons) {
        window.renderLessons(subContent);
      } else if (tab === 'rules' && window.renderRules) {
        window.renderRules(subContent);
      } else if (tab === 'reminders' && window.renderReminders) {
        window.renderReminders(subContent);
      }
    }

    // Attach tab listeners
    container.querySelectorAll('.btn-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        loadSubTab(btn.dataset.tab);
      });
    });

    // Initial load
    loadSubTab(activeTab);
  }

  window.renderKnowledge = renderKnowledge;
})();
