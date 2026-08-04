// ============================================
// NỘI TÂM — App Core Logic
// Router, State, Storage, Utils
// ============================================

(function() {
  'use strict';

  // ── Storage Manager ──
  const Storage = {
    prefix: 'noitam_',

    get(key) {
      try {
        const data = localStorage.getItem(this.prefix + key);
        return data ? JSON.parse(data) : null;
      } catch { return null; }
    },

    set(key, value) {
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
        return true;
      } catch { return false; }
    },

    remove(key) {
      localStorage.removeItem(this.prefix + key);
    },

    // Initialize sample data if first run, and sync any missing sample rules
    init() {
      if (!this.get('initialized')) {
        this.set('lessons', window.SAMPLE_LESSONS || []);
        this.set('rules', window.SAMPLE_RULES || []);
        this.set('reminders', window.SAMPLE_REMINDERS || []);
        this.set('journals', window.SAMPLE_JOURNALS || []);
        this.set('initialized', true);
      } else {
        const storedRules = this.get('rules') || [];
        const sampleRules = window.SAMPLE_RULES || [];
        let updated = false;
        sampleRules.forEach(sRule => {
          if (!storedRules.some(r => r.id === sRule.id)) {
            storedRules.push(sRule);
            updated = true;
          }
        });
        if (updated) {
          this.set('rules', storedRules);
        }
      }
    }
  };

  // ── State Manager ──
  const State = {
    _data: {},
    _listeners: {},

    get(key) {
      return this._data[key];
    },

    set(key, value) {
      this._data[key] = value;
      this._notify(key, value);
    },

    on(key, callback) {
      if (!this._listeners[key]) this._listeners[key] = [];
      this._listeners[key].push(callback);
    },

    off(key, callback) {
      if (!this._listeners[key]) return;
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    },

    _notify(key, value) {
      if (this._listeners[key]) {
        this._listeners[key].forEach(cb => cb(value));
      }
    }
  };

  // ── Router ──
  const Router = {
    routes: {},
    currentRoute: null,

    register(path, handler) {
      this.routes[path] = handler;
    },

    navigate(path) {
      window.location.hash = path;
    },

    _handleRoute() {
      const hash = window.location.hash.slice(1) || 'tuvi';
      let [route, ...params] = hash.split('/');

      // Alias mapping for consolidated modules
      const ALIASES = {
        'home': ['tuvi'],
        'command': ['dashboard', 'command'],
        'commandcenter': ['dashboard', 'command'],
        'morning': ['dashboard', 'morning'],
        'overview': ['dashboard', 'overview'],
        'tasks': ['dashboard', 'tasks'],
        'health': ['astrology', 'health'],
        'heatmap': ['astrology', 'heatmap'],
        'timemachine': ['astrology', 'timemachine'],
        'rpg': ['astrology', 'rpg'],
        'mood': ['astrology', 'mood'],
        'moodtracker': ['astrology', 'mood'],
        'meditation': ['astrology', 'meditation'],
        'timing': ['finance', 'timing'],
        'retroverify': ['finance', 'retroverify'],
        'compass': ['oracle', 'compass'],
        'iching': ['oracle', 'iching'],
        'journal': ['knowledge', 'journal'],
        'lessons': ['knowledge', 'lessons'],
        'rules': ['knowledge', 'rules'],
        'reminders': ['knowledge', 'reminders']
      };

      if (ALIASES[route]) {
        const alias = ALIASES[route];
        route = alias[0];
        params = [alias[1], ...params];
      }

      if (this.routes[route]) {
        this.currentRoute = route;
        State.set('currentRoute', route);

        // Update nav active states (both sidebar and mobile bottom nav)
        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.toggle('active', item.dataset.route === route);
        });
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.toggle('active', item.dataset.route === route);
        });

        // Update Mobile Top Bar Title
        const routeTitles = {
          'tuvi': 'LÁ SỐ CỦA TÔI',
          'dashboard': 'NHẬT LỊCH',
          'astrology': 'TỬ VI CHUYÊN SÂU',
          'finance': 'TÀI CHÍNH LIFEOS',
          'oracle': 'KỲ MÔN & KINH DỊCH',
          'knowledge': 'TRI THỨC & NHẬT KÝ',
          'search': 'TÌM KIẾM'
        };
        const mobileTitle = document.querySelector('.mobile-title');
        if (mobileTitle && routeTitles[route]) {
          mobileTitle.textContent = routeTitles[route];
        }

        // Close mobile drawer if open
        document.querySelector('.sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('active');

        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Render the route
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.innerHTML = '<div class="content-container"></div>';
          const container = mainContent.querySelector('.content-container');
          this.routes[route](container, params);
        }
      }
    },

    init() {
      window.addEventListener('hashchange', () => this._handleRoute());
      this._handleRoute();
    }
  };

  // ── Toast Notifications ──
  const Toast = {
    container: null,

    init() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      const icons = { success: '✓', error: '✕', info: 'ℹ' };
      toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;

      this.container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ── Modal Manager ──
  const Modal = {
    _counter: 0,

    show(contentOrOptions, options = {}) {
      // Support both: Modal.show(htmlString, {title}) and Modal.show({title, content, actions})
      let title, content, footer;

      if (typeof contentOrOptions === 'object' && contentOrOptions !== null && !Array.isArray(contentOrOptions)) {
        // Object API: { title, content, actions, footer }
        title = contentOrOptions.title;
        content = contentOrOptions.content || '';
        if (contentOrOptions.footer) {
          footer = contentOrOptions.footer;
        } else if (contentOrOptions.actions && contentOrOptions.actions.length) {
          footer = contentOrOptions.actions.map(a =>
            `<button class="btn btn-${a.type || 'ghost'}" ${a.onClick ? `data-action-idx="${Modal._counter}"` : 'onclick="App.Modal.close()"'}>${a.label}</button>`
          ).join('');
        }
      } else {
        // Classic API: (htmlString, {title, footer})
        content = contentOrOptions;
        title = options.title;
        footer = options.footer;
      }

      const modalId = 'modal-' + (++Modal._counter);
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = modalId;
      overlay.innerHTML = `
        <div class="modal">
          ${title ? `
            <div class="modal-header">
              <h3 class="modal-title">${title}</h3>
              <button class="btn btn-ghost btn-icon modal-close" aria-label="Đóng">✕</button>
            </div>
          ` : ''}
          <div class="modal-body">${content}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      // Wire action onClick callbacks
      if (typeof contentOrOptions === 'object' && contentOrOptions.actions) {
        setTimeout(() => {
          contentOrOptions.actions.forEach((a, i) => {
            if (a.onClick) {
              const btn = overlay.querySelectorAll('.modal-footer .btn')[i];
              if (btn) btn.addEventListener('click', () => { a.onClick(); Modal.close(overlay); });
            }
          });
        }, 50);
      }

      // Close handlers
      overlay.querySelector('.modal-close')?.addEventListener('click', () => Modal.close(overlay));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) Modal.close(overlay);
      });

      return modalId;
    },

    close(overlay) {
      if (!overlay) overlay = document.querySelector('.modal-overlay.active');
      if (typeof overlay === 'string') overlay = document.getElementById(overlay);
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 250);
      }
    }
  };


  // ── Detail Panel ──
  const DetailPanel = {
    show(title, content) {
      this.close(); // Close any existing

      const panelOverlay = document.createElement('div');
      panelOverlay.className = 'detail-panel-overlay open';
      panelOverlay.id = 'detail-overlay';

      const panel = document.createElement('div');
      panel.className = 'detail-panel open';
      panel.id = 'detail-panel';
      panel.innerHTML = `
        <div class="detail-panel-header">
          <h3 class="card-title">${title}</h3>
          <button class="btn btn-ghost btn-icon" id="detail-close" aria-label="Đóng">✕</button>
        </div>
        <div class="detail-panel-body">${content}</div>
      `;

      document.body.appendChild(panelOverlay);
      document.body.appendChild(panel);

      panel.querySelector('#detail-close').addEventListener('click', () => this.close());
      panelOverlay.addEventListener('click', () => this.close());
    },

    close() {
      const panel = document.getElementById('detail-panel');
      const overlay = document.getElementById('detail-overlay');
      if (panel) {
        panel.classList.remove('open');
        setTimeout(() => panel.remove(), 250);
      }
      if (overlay) {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 250);
      }
    }
  };

  // ── Utilities ──
  const Utils = {
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(dateStr) {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    },

    formatDateTime(dateStr) {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    timeAgo(dateStr) {
      const now = new Date();
      const date = new Date(dateStr);
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;
      return this.formatDate(dateStr);
    },

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    searchInText(text, query) {
      if (!query) return true;
      const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedText.includes(normalizedQuery);
    },

    getRandomItem(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    // Get today's "daily" item based on date seed
    getDailyItem(arr) {
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      return arr[seed % arr.length];
    },

    renderTags(tags, options = {}) {
      const { clickable, activeTag, className } = options;
      return tags.map(tag => {
        const isActive = activeTag === tag;
        const clickClass = clickable ? 'tag-clickable' : '';
        const activeClass = isActive ? 'active' : '';
        const extraClass = className || '';
        return `<span class="tag ${clickClass} ${activeClass} ${extraClass}" data-tag="${tag}">${tag}</span>`;
      }).join('');
    },

    getTypeIcon(type) {
      const icons = {
        strength: '💪',
        weakness: '⚠️',
        info: '📌',
        warning: '🔔'
      };
      return icons[type] || '📌';
    },

    getTypeClass(type) {
      const classes = {
        strength: 'tag-strength',
        weakness: 'tag-weakness',
        info: 'tag-info',
        warning: 'tag-accent'
      };
      return classes[type] || 'tag-info';
    },

    getAllTags(items) {
      const tags = new Set();
      items.forEach(item => {
        if (item.tags) item.tags.forEach(t => tags.add(t));
      });
      return Array.from(tags).sort();
    }
  };

  // ── CRUD Helpers ──
  const CRUD = {
    getAll(collection) {
      return Storage.get(collection) || [];
    },

    getById(collection, id) {
      const items = this.getAll(collection);
      return items.find(item => item.id === id);
    },

    create(collection, item) {
      const items = this.getAll(collection);
      item.id = item.id || Utils.generateId();
      item.createdAt = item.createdAt || new Date().toISOString();
      items.unshift(item);
      Storage.set(collection, items);
      return item;
    },

    update(collection, id, updates) {
      const items = this.getAll(collection);
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        Storage.set(collection, items);
        return items[index];
      }
      return null;
    },

    delete(collection, id) {
      const items = this.getAll(collection);
      const filtered = items.filter(item => item.id !== id);
      Storage.set(collection, filtered);
      return filtered;
    },

    count(collection) {
      return this.getAll(collection).length;
    }
  };

  // ── Theme Manager ──
  const Theme = {
    get() {
      return Storage.get('theme') || 'dark';
    },

    set(theme) {
      const targetTheme = (theme === 'dark') ? 'dark' : 'light';
      Storage.set('theme', targetTheme);
      document.documentElement.setAttribute('data-theme', targetTheme);
      document.body.setAttribute('data-theme', targetTheme);

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', targetTheme === 'dark' ? '#070912' : '#f4f6ff');
      }

      const icon = document.querySelector('#theme-toggle-btn .theme-icon');
      if (icon) {
        icon.textContent = targetTheme === 'dark' ? '☀️' : '🌙';
      }
      const mobileThemeBtn = document.querySelector('#mobile-theme-toggle-btn');
      if (mobileThemeBtn) {
        mobileThemeBtn.textContent = targetTheme === 'dark' ? '☀️' : '🌙';
      }
      const btn = document.querySelector('#theme-toggle-btn');
      if (btn) {
        btn.setAttribute('title', targetTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối');
      }
    },

    toggle() {
      const current = this.get();
      this.set(current === 'dark' ? 'light' : 'dark');
    },

    init() {
      const current = this.get();
      this.set(current);
    }
  };

  // ── App Initialization ──
  async function initApp() {
    Storage.init();
    Theme.init();
    Toast.init();

    if (window.SupabaseManager) {
      const currentProfileId = window.SupabaseManager.getCurrentProfileId();
      await window.SupabaseManager.loadProfile(currentProfileId);
    }

    // Áp dụng Theme theo Ngũ Hành ngày hôm nay
    function applyDynamicTheme() {
      if (typeof Lunar !== 'undefined' && window.AstrologyLogic) {
        const lunar = Lunar.fromDate(new Date());
        const canNgayIdx = lunar.getDayGanIndex();
        const canNgay = window.AstrologyLogic.CAN[canNgayIdx];
        const hanhNgay = window.AstrologyLogic.NGU_HANH_CAN[canNgay];
        
        const themeMap = {
          "Kim": "theme-kim",
          "Mộc": "theme-moc",
          "Thủy": "theme-thuy",
          "Hỏa": "theme-hoa",
          "Thổ": "theme-tho"
        };
        const themeClass = themeMap[hanhNgay];
        if (themeClass) {
          document.body.classList.add(themeClass);
        }
      }
    }
    applyDynamicTheme();

    // Register routes
    Router.register('tuvi', window.renderTuviHome);  // NEW: Personal Chart Home
    Router.register('dashboard', window.renderDashboard);
    Router.register('astrology', window.renderAstrology);
    Router.register('oracle', window.renderOracle);
    Router.register('knowledge', window.renderKnowledge);
    Router.register('search', window.renderSearch);
    Router.register('library', window.renderLibrary);

    Router.register('commandcenter', window.renderCommandCenter);
    Router.register('finance', window.renderFinance);
    Router.register('meditation', window.renderMeditation);
    Router.register('retroverify', window.renderRetroVerify);
    Router.register('moodtracker', window.renderMoodTracker);
    Router.register('rpg', window.renderRPG);

    // ── Check for first-time onboarding ──
    if (window.Onboarding && !window.Onboarding.hasProfile()) {
      // Show onboarding screen before router starts
      window.Onboarding.showOnboarding((profile) => {
        // After onboarding complete, init router
        if (window.renderSidebar) window.renderSidebar();
        Router.init();
        setupMobileMenu();
      });
      return; // Don't call Router.init() yet
    }

    // Render sidebar
    if (window.renderSidebar) window.renderSidebar();

    // Init router
    Router.init();

    // Mobile menu toggle
    setupMobileMenu();
    function setupMobileMenu() {
      const mobileBtn = document.getElementById('mobile-menu-btn');
      if (mobileBtn && !mobileBtn._listenerAdded) {
        mobileBtn._listenerAdded = true;
        mobileBtn.addEventListener('click', () => {
          const sidebar = document.querySelector('.sidebar');
          const overlay = document.getElementById('sidebar-overlay');
          const isOpen = sidebar?.classList.toggle('open');
          if (overlay) {
            overlay.classList.toggle('active', isOpen);
          }
        });
      }
    }

    // SOS button
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        const reminders = CRUD.getAll('reminders');
        if (reminders.length === 0) return;
        const reminder = Utils.getRandomItem(reminders);
        DetailPanel.show(
          `💡 ${reminder.title}`,
          `<div class="insight-block" style="border:none;background:transparent;padding:0;">
            <p class="insight-text" style="font-size:var(--text-base);line-height:1.8;">${Utils.escapeHtml(reminder.content)}</p>
            <div class="tags-container mt-md">
              ${Utils.renderTags(reminder.tags || [])}
            </div>
          </div>`
        );
      });
    }
  }

  // ── Export Globals ──
  window.App = {
    Storage,
    State,
    Router,
    Toast,
    Modal,
    DetailPanel,
    Utils,
    CRUD,
    Theme,
    init: initApp
  };

  // Auto-init when DOM ready
  document.addEventListener('DOMContentLoaded', initApp);

})();
