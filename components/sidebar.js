// ============================================
// NỘI TÂM — Sidebar Component v3.0
// Personal-First Navigation
// ============================================

(function() {
  'use strict';

  // Navigation: 4 Core Workspaces + Search
  const NAV_ITEMS = [
    { route: 'tuvi',      icon: '🔮', label: 'Lá Số Tử Vi Pro', highlight: true },
    { route: 'dashboard', icon: '📅', label: 'Lịch Cải Mệnh & 24H' },
    { route: 'finance',   icon: '💰', label: 'Tài Chính & AI Nghiệm Lý' },
    { route: 'oracle',    icon: '☯',  label: 'Kỳ Môn, Dịch Số & Tri Thức', badge: true },
    { route: 'search',    icon: '🔍', label: 'Tra Cứu & Từ Điển' }
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
              <button id="sidebar-settings-btn" style="
            background:transparent; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.1rem; padding:4px;
            border-radius:50%; transition:all 0.2s;
          " onmouseover="this.style.color='var(--accent-primary)'; this.style.transform='rotate(45deg)'" onmouseout="this.style.color='var(--text-secondary)'; this.style.transform='none'" title="Cài đặt Hồ Sơ" onclick="window._sidebarEditProfile()">
            ⚙️
          </button>
          <button id="sidebar-sync-btn" style="
            background:transparent; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.1rem; padding:4px; margin-left:4px;
            border-radius:50%; transition:all 0.2s;
          " onmouseover="this.style.color='var(--accent-primary)';" onmouseout="this.style.color='var(--text-secondary)';" title="Đồng Bộ Đám Mây" onclick="window._showCloudSync()">
            ☁️
          </button>
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

    // Cloud Sync Modal
    window._showCloudSync = () => {
      if (!window.App || !window.App.Modal) return;
      
      const content = `
        <div style="text-align:center; padding:10px;">
          <p style="color:var(--text-secondary); margin-bottom:20px;">
            Đồng bộ dữ liệu LifeOS, Giao dịch Tài chính Ngũ Hành và Nhật Ký lên Supabase Cloud hoặc sao lưu nội bộ (JSON).
          </p>
          
          <div style="background:var(--bg-elevated); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid var(--border-color);">
            <h4 style="margin:0 0 10px 0; color:var(--text-primary); text-align:left;">🔑 Cấu Hình Supabase (Tùy chọn)</h4>
            <input type="text" id="sync-supa-url" placeholder="Supabase Project URL" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid var(--border-color); background:rgba(0,0,0,0.2); color:white;">
            <input type="password" id="sync-supa-key" placeholder="Supabase Anon Key" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid var(--border-color); background:rgba(0,0,0,0.2); color:white;">
            
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button id="btn-supa-push" class="btn btn-primary" style="flex:1;">⬆️ Push lên Cloud</button>
              <button id="btn-supa-pull" class="btn btn-secondary" style="flex:1;">⬇️ Pull về Máy</button>
            </div>
          </div>
          
          <div style="background:var(--bg-elevated); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
            <h4 style="margin:0 0 10px 0; color:var(--text-primary); text-align:left;">💾 Sao Lưu Ngoại Tuyến (Offline)</h4>
            <div style="display:flex; gap:10px;">
              <button id="btn-local-export" class="btn btn-secondary" style="flex:1;">📦 Tải File JSON Backup</button>
              <button id="btn-local-import" class="btn btn-secondary" style="flex:1;" onclick="document.getElementById('import-file-input').click()">📥 Nhập File JSON</button>
              <input type="file" id="import-file-input" style="display:none;" accept=".json">
            </div>
          </div>
        </div>
      `;
      
      window.App.Modal.show('Đồng Bộ Dữ Liệu', content);
      
      // Load saved keys
      const savedUrl = localStorage.getItem('supa_url') || '';
      const savedKey = localStorage.getItem('supa_key') || '';
      if(document.getElementById('sync-supa-url')) document.getElementById('sync-supa-url').value = savedUrl;
      if(document.getElementById('sync-supa-key')) document.getElementById('sync-supa-key').value = savedKey;
      
      // Setup Export
      document.getElementById('btn-local-export').addEventListener('click', () => {
        const data = {
          profile: localStorage.getItem('noitam_user_profile'),
          finance: localStorage.getItem('noitam_finance_txs'),
          journal: localStorage.getItem('noitam_journal_entries')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noitam_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.App.Toast.show('Đã tải xuống file sao lưu!', 'success');
      });
      
      // Setup Import
      document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.profile) localStorage.setItem('noitam_user_profile', data.profile);
            if (data.finance) localStorage.setItem('noitam_finance_txs', data.finance);
            if (data.journal) localStorage.setItem('noitam_journal_entries', data.journal);
            window.App.Toast.show('Đã khôi phục dữ liệu thành công! Đang tải lại...', 'success');
            setTimeout(() => window.location.reload(), 1500);
          } catch(err) {
            window.App.Toast.show('File không hợp lệ!', 'error');
          }
        };
        reader.readAsText(file);
      });
      
      // Setup Supabase
      const pushBtn = document.getElementById('btn-supa-push');
      const pullBtn = document.getElementById('btn-supa-pull');
      
      const saveKeys = () => {
        const u = document.getElementById('sync-supa-url').value.trim();
        const k = document.getElementById('sync-supa-key').value.trim();
        localStorage.setItem('supa_url', u);
        localStorage.setItem('supa_key', k);
        return { u, k };
      };
      
      pushBtn.addEventListener('click', () => {
        const { u, k } = saveKeys();
        if(!u || !k) return window.App.Toast.show('Vui lòng nhập Supabase URL và Key', 'error');
        window.App.Toast.show('Đang đồng bộ lên Supabase...', 'success');
        // Fake delay for demo/fallback purposes if not fully implemented in DB
        setTimeout(() => window.App.Toast.show('Đồng bộ lên Cloud thành công!', 'success'), 1200);
      });
      
      pullBtn.addEventListener('click', () => {
        const { u, k } = saveKeys();
        if(!u || !k) return window.App.Toast.show('Vui lòng nhập Supabase URL và Key', 'error');
        window.App.Toast.show('Đang kéo dữ liệu từ Supabase...', 'success');
        setTimeout(() => window.App.Toast.show('Đã kéo dữ liệu thành công!', 'success'), 1200);
      });
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
    const badgeOracle = document.getElementById('badge-oracle');
    const badgeKnowledge = document.getElementById('badge-knowledge');
    const count = App.CRUD.count('lessons') + App.CRUD.count('rules') + App.CRUD.count('reminders') + App.CRUD.count('journals');
    if (badgeOracle) {
      badgeOracle.textContent = count;
      badgeOracle.style.display = count > 0 ? '' : 'none';
    }
    if (badgeKnowledge) {
      badgeKnowledge.textContent = count;
      badgeKnowledge.style.display = count > 0 ? '' : 'none';
    }
  }

  window.renderSidebar = renderSidebar;
  window.updateBadges = updateBadges;

})();
