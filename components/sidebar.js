// ============================================
// NỘI TÂM — Sidebar Component v3.0
// Personal-First Navigation
// ============================================

(function() {
  'use strict';

  // Navigation: Lá Số first as home
  const NAV_ITEMS = [
    { route: 'tuvi',      icon: '🔮', label: 'Lá Số Của Tôi', highlight: true },
    { route: 'dashboard', icon: '📅', label: 'Nhật Lịch & Ngày Tốt' },
    { route: 'astrology', icon: '🌌', label: 'Tử Vi Chuyên Sâu' },
    { route: 'finance',   icon: '💰', label: 'Tài Chính & Đầu Tư' },
    { route: 'oracle',    icon: '🧭', label: 'Kỳ Môn & Kinh Dịch' },
    { route: 'knowledge', icon: '📖', label: 'Nhật Ký & Tri Thức', badge: true },
    { route: 'search',    icon: '🔍', label: 'Tìm Kiếm' }
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
        lunarStr = ` • Âm ${lunar.getDay()}/${Math.abs(lunar.getMonth())} (${canNgay} ${chiNgay})`;
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
    const currentTheme = window.App?.Theme
      ? window.App.Theme.get()
      : (localStorage.getItem('noitam_theme')?.includes('dark') ? 'dark' : 'light');

    // Get user profile for display
    const profile = window.Onboarding ? window.Onboarding.getProfile() : null;
    const userName = profile ? profile.name : 'Chưa có hồ sơ';
    const userSubtitle = profile ? `${profile.day}/${profile.month}/${profile.year} • ${profile.gender}` : 'Nhấn ⚙️ để thiết lập';

    sidebar.innerHTML = `
      <!-- Brand -->
      <div class="sidebar-logo-wrap" style="cursor:pointer;" onclick="App.Router.navigate('tuvi'); document.querySelector('.sidebar')?.classList.remove('open');">
        <div class="sidebar-logo" title="Nội Tâm">☯</div>
        <div class="sidebar-brand-text">
          <div class="sidebar-title">NỘI TÂM</div>
          <div class="sidebar-subtitle">Lá Số Cá Nhân</div>
        </div>
      </div>

      <!-- Personal Profile Card -->
      <div class="sidebar-profile-wrap" style="padding: 0 12px 12px 12px;">
        <div style="
          display:flex; align-items:center; gap:10px;
          background: linear-gradient(135deg, rgba(120,60,200,0.15), rgba(80,40,160,0.1));
          border: 1px solid rgba(120,80,220,0.3);
          border-radius: 14px; padding: 10px 12px;
          cursor:pointer; transition: all 0.2s ease;
        " onclick="App.Router.navigate('tuvi'); document.querySelector('.sidebar')?.classList.remove('open');" title="Lá Số Của Tôi">
          <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#7b3fe4,#9b59f5); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">☯</div>
          <div style="min-width:0; flex:1;">
            <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userName}</div>
            <div style="font-size:0.72rem; color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userSubtitle}</div>
          </div>
          <button id="sidebar-settings-btn" style="
            background:none; border:none; cursor:pointer;
            color:var(--text-tertiary); font-size:0.9rem;
            padding:4px; border-radius:6px;
            transition: color 0.2s;
          " title="Chỉnh sửa hồ sơ" onclick="event.stopPropagation(); window._sidebarEditProfile();">⚙️</button>
        </div>
      </div>

      <!-- Date Strip -->
      <div class="sidebar-date" title="Lịch Âm Dương Ngày Chi Tiết">
        <span class="date-icon">📅</span>
        <span class="date-text">${getLunarDateDisplay()}</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">✦ ĐIỀU HƯỚNG ✦</div>
        ${NAV_ITEMS.map(item => `
          <div class="nav-item ${item.highlight ? 'nav-item-highlight' : ''}" data-route="${item.route}"
            onclick="App.Router.navigate('${item.route}'); document.querySelector('.sidebar')?.classList.remove('open');"
            title="${item.label}">
            <span class="nav-item-icon">${item.icon}</span>
            <span class="nav-item-label">${item.label}</span>
            ${item.badge ? `<span class="nav-item-badge" id="badge-${item.route}">0</span>` : ''}
          </div>
        `).join('')}
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <p class="sidebar-quote">${dailyQuote.replace(/\n/g, '<br>')}</p>
        <button class="theme-toggle-btn" id="theme-toggle-btn"
          title="${currentTheme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}"
          aria-label="Đổi giao diện">
          <span class="theme-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </div>
    `;

    // Settings edit profile
    window._sidebarEditProfile = () => {
      if (window.Onboarding) {
        const currentProfile = window.Onboarding.getProfile();
        window.Onboarding.showProfileEditor(currentProfile, (newProfile) => {
          renderSidebar(); // Re-render sidebar with new name
          if (window.App && window.App.Router && window.App.Router.currentRoute === 'tuvi') {
            window.App.Router.navigate('tuvi');
          }
        });
      }
    };

    const themeBtn = sidebar.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.App && window.App.Theme) {
          window.App.Theme.toggle();
        }
      });
    }

    // Sync Mobile Header Date Badge
    const mobileLunarBadge = document.getElementById('mobile-lunar-badge');
    if (mobileLunarBadge) {
      mobileLunarBadge.textContent = getLunarDateDisplay();
    }

    // Sync Mobile Theme Toggle Button
    const mobileThemeBtn = document.getElementById('mobile-theme-toggle-btn');
    if (mobileThemeBtn) {
      mobileThemeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      mobileThemeBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.App && window.App.Theme) {
          window.App.Theme.toggle();
        }
      };
    }

    // Mobile Sidebar Overlay Backdrop handler
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      };
    }

    updateBadges();

    // Remove Supabase profile loading - now using local profile
    // Profile is shown in the sidebar card above
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
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
