// ============================================
// NỘI TÂM — Sidebar Component (Phong cách Tử Vi & Tri Thức Đông Phương)
// ============================================

(function() {
  'use strict';

  const NAV_ITEMS = [
    { route: 'dashboard', icon: '📅', label: 'Lịch Ngày Tốt Master Hub' },
    { route: 'astrology', icon: '🔮', label: 'Lá Số Tử Vi & Sinh Học' },
    { route: 'oracle',    icon: '🧭', label: 'Kỳ Môn & Quẻ Dịch' },
    { route: 'knowledge', icon: '📜', label: 'Tri Thức & Phản Tư', badge: true },
    { route: 'search',    icon: '🔍', label: 'Tìm Kiếm Tri Thức' }
  ];

  function getLunarDateDisplay() {
    const now = new Date();
    const solarStr = now.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' });
    let lunarStr = '';
    
    if (typeof Lunar !== 'undefined' && window.AstrologyLogic) {
      try {
        const AL = window.AstrologyLogic;
        const lunar = Lunar.fromDate(now);
        const canNgay = AL.CAN[lunar.getDayGanIndex()] || '';
        const chiNgay = AL.CUNG[lunar.getDayZhiIndex()] || '';
        lunarStr = ` • Âm: ${lunar.getDay()}/${Math.abs(lunar.getMonth())} (${canNgay} ${chiNgay})`;
      } catch (e) {
        lunarStr = '';
      }
    }
    return `${solarStr}${lunarStr}`;
  }

  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const quotes = [
      'Nước chảy đá mòn,\nlấy nhu thắng cương.',
      'Hiểu mình, lưu tri thức sống,\nnhắc mình đúng lúc.',
      'Hỏa nung Kim,\ntôi luyện thành vàng.',
      'Tích tiểu thành đại,\nkiên nhẫn là vàng.',
      'Tâm bình khí hòa,\nmọi sự hanh thông.'
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];
    const currentTheme = window.App?.Theme ? window.App.Theme.get() : (localStorage.getItem('noitam_theme')?.includes('dark') ? 'dark' : 'light');

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo" title="Nội Tâm — Thái Cực Tử Vi">☯</div>
          <div>
            <div class="sidebar-title">NỘI TÂM</div>
            <div class="sidebar-subtitle">Tử Vi & Tri Thức</div>
          </div>
        </div>
        <button class="theme-toggle-btn" id="theme-toggle-btn" title="${currentTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}" aria-label="Đổi giao diện">
          <span class="theme-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </div>

      <div class="sidebar-date" title="Lịch Âm Dương Ngày Chi Tiết">
        <span>📅</span>
        <span style="font-weight: 500;">${getLunarDateDisplay()}</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">✦ ĐIỀU HƯỚNG BÁT QUÁI ✦</div>
        ${NAV_ITEMS.map(item =>
          `<div class="nav-item" data-route="${item.route}" onclick="App.Router.navigate('${item.route}'); document.querySelector('.sidebar')?.classList.remove('open');">
            <span class="nav-item-icon">${item.icon}</span>
            <span class="nav-item-label">${item.label}</span>
            ${item.badge ? `<span class="nav-item-badge" id="badge-${item.route}">0</span>` : ''}
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div style="font-size:0.68rem; color:var(--accent-primary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px; font-weight:600;">❖ MINH TRIẾT ĐÔNG PHƯƠNG</div>
        <p class="sidebar-quote">${dailyQuote.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    const themeBtn = sidebar.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.App && window.App.Theme) {
          window.App.Theme.toggle();
        }
      });
    }

    updateBadges();
  }

  function updateBadges() {
    const badge = document.getElementById('badge-knowledge');
    if (badge) {
      const count = App.CRUD.count('lessons') + App.CRUD.count('rules') + App.CRUD.count('reminders') + App.CRUD.count('journals');
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }

  window.renderSidebar = renderSidebar;
  window.updateBadges = updateBadges;

})();
