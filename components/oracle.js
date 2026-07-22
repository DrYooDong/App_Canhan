// ============================================
// NỘI TÂM — Oracle Component (Kỳ Môn & Kinh Dịch)
// ============================================

(function () {
  'use strict';

  let activeTab = 'compass'; // 'compass' | 'iching'

  function renderOracle(container, params) {
    if (params && params[0]) {
      if (['compass', 'iching'].includes(params[0])) {
        activeTab = params[0];
      }
    }

    container.innerHTML = `
      <div class="oracle-container animate-fade-in">
        <!-- Sub-tabs navigation -->
        <div class="tabs-header" style="display:flex;gap:12px;margin-bottom:24px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
          <button class="btn btn-tab ${activeTab === 'compass' ? 'active' : ''}" data-tab="compass" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'compass' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'compass' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'compass' ? 'var(--border-accent)' : 'transparent'};">
            <span>🧭</span> La Bàn Kỳ Môn
          </button>
          <button class="btn btn-tab ${activeTab === 'iching' ? 'active' : ''}" data-tab="iching" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'iching' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'iching' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'iching' ? 'var(--border-accent)' : 'transparent'};">
            <span>☯</span> Quẻ Dịch & Nhật Ký Gieo Quẻ
          </button>
        </div>

        <!-- Sub-module Content Container -->
        <div id="oracle-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#oracle-sub-content');

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
      if (tab === 'compass' && window.renderCompass) {
        window.renderCompass(subContent);
      } else if (tab === 'iching' && window.renderIching) {
        window.renderIching(subContent);
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

  window.renderOracle = renderOracle;
})();
