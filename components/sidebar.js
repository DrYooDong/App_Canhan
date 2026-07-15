// ============================================
// NỘI TÂM — Sidebar Component
// ============================================

(function() {
  'use strict';

  const NAV_ITEMS = [
    { route: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { route: 'overview',  icon: '🌟', label: 'Tổng quan cuộc đời' },
    { route: 'lessons',   icon: '📖', label: 'Bài học đúc kết' },
    { route: 'rules',     icon: '⚖️', label: 'Quy luật xã hội' },
    { route: 'reminders', icon: '💡', label: 'Lời nhắc nhở' },
    { route: 'journal',   icon: '📓', label: 'Nhật ký phản tư' },
    { route: 'search',    icon: '🔍', label: 'Tìm kiếm' }
  ];

  function getLunarDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('vi-VN', options);
  }

  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const quotes = [
      'Nước chảy đá mòn,\nlấy nhu thắng cương.',
      'Hiểu mình,\nlưu tri thức sống,\nnhắc mình đúng lúc.',
      'Hỏa nung Kim,\ntôi luyện thành vàng.',
      'Tích tiểu thành đại,\nkiên nhẫn là vàng.'
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo">☯</div>
          <div>
            <div class="sidebar-title">Nội Tâm</div>
            <div class="sidebar-subtitle">Tri thức cá nhân</div>
          </div>
        </div>
      </div>

      <div class="sidebar-date">
        <span>📅</span>
        <span>${getLunarDateDisplay()}</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Điều hướng</div>
        ${NAV_ITEMS.map(item => `
          <div class="nav-item" data-route="${item.route}" onclick="App.Router.navigate('${item.route}'); document.querySelector('.sidebar')?.classList.remove('open');">
            <span class="nav-item-icon">${item.icon}</span>
            <span class="nav-item-label">${item.label}</span>
            ${item.route !== 'dashboard' && item.route !== 'overview' && item.route !== 'search' ? 
              `<span class="nav-item-badge" id="badge-${item.route}">0</span>` : ''}
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <p class="sidebar-quote">${dailyQuote.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    updateBadges();
  }

  function updateBadges() {
    const collections = {
      'lessons': 'lessons',
      'rules': 'rules',
      'reminders': 'reminders',
      'journal': 'journals'
    };

    Object.entries(collections).forEach(([route, collection]) => {
      const badge = document.getElementById(`badge-${route}`);
      if (badge) {
        const count = App.CRUD.count(collection);
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      }
    });
  }

  window.renderSidebar = renderSidebar;
  window.updateBadges = updateBadges;

})();
