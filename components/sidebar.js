// ============================================
// NỘI TÂM — Sidebar Component v2.0
// Icon Rail — Cosmic Eastern Design
// ============================================

(function() {
  'use strict';

  const NAV_ITEMS = [
    { route: 'dashboard', icon: '📅', label: 'Lịch & Năng Lượng Ngày' },
    { route: 'astrology', icon: '🔮', label: 'Lá Số & Vận Hạn' },
    { route: 'finance',   icon: '💰', label: 'Tài Chính LifeOS' },
    { route: 'oracle',    icon: '🧭', label: 'Kỳ Môn & Quẻ Dịch' },
    { route: 'knowledge', icon: '📜', label: 'Tri Thức & Phản Tư', badge: true },
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

    sidebar.innerHTML = `
      <!-- Brand -->
      <div class="sidebar-logo-wrap">
        <div class="sidebar-logo" title="Nội Tâm — Cosmic Eastern">☯</div>
        <div class="sidebar-brand-text">
          <div class="sidebar-title">NỘI TÂM</div>
          <div class="sidebar-subtitle">Tử Vi & Tri Thức</div>
        </div>
      </div>

      <!-- Date Strip -->
      <div class="sidebar-date" title="Lịch Âm Dương Ngày Chi Tiết">
        <span class="date-icon">📅</span>
        <span class="date-text">${getLunarDateDisplay()}</span>
      </div>

      <!-- Profile Selector Pill -->
      <div class="sidebar-profile-wrap" style="padding: 0 12px 12px 12px;">
        <div style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.045); border: 1px solid var(--border-color); border-radius: 12px; padding: 6px 10px; transition: all 0.2s ease;" title="Chọn hồ sơ Tử Vi">
          <span style="font-size:1rem; color:var(--accent-primary);">👤</span>
          <select id="astrology-profile-select" style="background: transparent; color: var(--text-primary); border: none; outline: none; font-family: var(--font-primary); font-size: 0.85rem; font-weight:600; cursor: pointer; width: 100%;">
            <option value="default">Đang tải...</option>
          </select>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">✦ ĐIỀU HƯỚNG ✦</div>
        ${NAV_ITEMS.map(item => `
          <div class="nav-item" data-route="${item.route}"
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

    // Populate Supabase Profiles
    const profileSelect = document.getElementById('astrology-profile-select');
    if (profileSelect && window.SupabaseManager) {
      window.SupabaseManager.fetchProfiles().then(profiles => {
        profileSelect.innerHTML = profiles.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        profileSelect.value = window.SupabaseManager.getCurrentProfileId();
        
        profileSelect.addEventListener('change', async (e) => {
          const newProfileId = e.target.value;
          window.SupabaseManager.setCurrentProfileId(newProfileId);
          
          // Re-load profile data
          const success = await window.SupabaseManager.loadProfile(newProfileId);
          if (success) {
            window.App.Toast.show("Đã tải hồ sơ: " + profiles.find(p => p.id === newProfileId)?.name);
            // Re-render current route to reflect new data
            if (window.App.Router && window.App.Router.currentRoute) {
              const currentRouteParts = window.App.Router.currentRoute.split('/');
              const routeName = currentRouteParts[0];
              if (window.App.Router.routes[routeName]) {
                window.App.Router.routes[routeName](document.querySelector('.content-container'), currentRouteParts.slice(1));
              }
            }
          } else {
            window.App.Toast.show("Lỗi khi tải hồ sơ!");
          }
        });
      });
    }
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
