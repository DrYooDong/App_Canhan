// ============================================
// NỘI TÂM — Search Component (Tìm kiếm)
// ============================================

(function() {
  'use strict';

  function renderSearch(container) {
    const { Utils, CRUD } = App;
    let query = '';
    let activeSource = 'all';

    function search() {
      const results = [];

      if (!query) {
        renderResults(results, false);
        return;
      }

      // Search in Tử Vi
      if (activeSource === 'all' || activeSource === 'tuvi') {
        TUVI_DATA.forEach(item => {
          if (Utils.searchInText(item.title + ' ' + item.content + ' ' + (item.tags || []).join(' '), query)) {
            results.push({
              type: 'tuvi',
              icon: '🌟',
              label: 'Tử Vi',
              id: item.id,
              title: item.title,
              content: item.content,
              tags: item.tags,
              meta: `Mục #${item.id}`
            });
          }
        });
      }

      // Search in Lessons
      if (activeSource === 'all' || activeSource === 'lessons') {
        CRUD.getAll('lessons').forEach(item => {
          if (Utils.searchInText(item.title + ' ' + item.content + ' ' + (item.tags || []).join(' '), query)) {
            results.push({
              type: 'lessons',
              icon: '📖',
              label: 'Bài học',
              id: item.id,
              title: item.title,
              content: item.content,
              tags: item.tags,
              meta: Utils.timeAgo(item.createdAt)
            });
          }
        });
      }

      // Search in Rules
      if (activeSource === 'all' || activeSource === 'rules') {
        CRUD.getAll('rules').forEach(item => {
          if (Utils.searchInText(item.title + ' ' + item.content + ' ' + (item.tags || []).join(' '), query)) {
            results.push({
              type: 'rules',
              icon: '⚖️',
              label: 'Quy luật',
              id: item.id,
              title: item.title,
              content: item.content,
              tags: item.tags,
              meta: Utils.timeAgo(item.createdAt)
            });
          }
        });
      }

      // Search in Reminders
      if (activeSource === 'all' || activeSource === 'reminders') {
        CRUD.getAll('reminders').forEach(item => {
          if (Utils.searchInText(item.title + ' ' + item.content + ' ' + (item.tags || []).join(' '), query)) {
            results.push({
              type: 'reminders',
              icon: '💡',
              label: 'Lời nhắc',
              id: item.id,
              title: item.title,
              content: item.content,
              tags: item.tags,
              meta: item.mood || ''
            });
          }
        });
      }

      // Search in Journals
      if (activeSource === 'all' || activeSource === 'journals') {
        CRUD.getAll('journals').forEach(item => {
          if (Utils.searchInText(item.title + ' ' + item.content + ' ' + (item.tags || []).join(' '), query)) {
            results.push({
              type: 'journals',
              icon: '📓',
              label: 'Nhật ký',
              id: item.id,
              title: item.title,
              content: item.content,
              tags: item.tags,
              meta: Utils.timeAgo(item.createdAt)
            });
          }
        });
      }

      renderResults(results, true);
    }

    function renderResults(results, searched) {
      const resultsEl = container.querySelector('#search-results');
      if (!resultsEl) return;

      if (!searched) {
        resultsEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Tìm kiếm tri thức</div>
            <div class="empty-state-text">Nhập từ khóa để tìm kiếm trong toàn bộ dữ liệu: Tử Vi, bài học, quy luật, lời nhắc và nhật ký.</div>
          </div>
        `;
        return;
      }

      if (results.length === 0) {
        resultsEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">😶</div>
            <div class="empty-state-title">Không tìm thấy kết quả</div>
            <div class="empty-state-text">Thử từ khóa khác hoặc thay đổi bộ lọc nguồn.</div>
          </div>
        `;
        return;
      }

      // Highlight matched text
      function highlight(text, maxLength = 200) {
        let truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        if (query) {
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          truncated = truncated.replace(regex, '<mark style="background:rgba(var(--accent-primary-rgb),0.3);color:var(--text-primary);border-radius:2px;padding:0 2px;">$1</mark>');
        }
        return truncated;
      }

      resultsEl.innerHTML = `
        <p class="text-sm text-muted mb-md">${results.length} kết quả cho "${Utils.escapeHtml(query)}"</p>
        ${results.map((result, i) => `
          <div class="card stagger-item" style="margin-bottom:var(--space-sm);cursor:pointer;" data-result-type="${result.type}" data-result-id="${result.id}">
            <div class="flex items-center gap-sm mb-sm">
              <span class="tag tag-accent" style="font-size:var(--text-xs);">${result.icon} ${result.label}</span>
              <span class="text-xs text-muted">${result.meta}</span>
            </div>
            <h4 class="card-title" style="font-size:var(--text-base);">${highlight(result.title, 100)}</h4>
            <p class="card-text">${highlight(result.content)}</p>
            <div class="tags-container">
              ${Utils.renderTags((result.tags || []).slice(0, 4))}
            </div>
          </div>
        `).join('')}
      `;

      // Bind result clicks to navigate
      resultsEl.querySelectorAll('[data-result-type]').forEach(el => {
        el.addEventListener('click', () => {
          const type = el.dataset.resultType;
          const routeMap = {
            tuvi: 'overview',
            lessons: 'lessons',
            rules: 'rules',
            reminders: 'reminders',
            journals: 'journal'
          };
          if (routeMap[type]) {
            App.Router.navigate(routeMap[type]);
          }
        });
      });
    }

    // Render search UI
    container.innerHTML = `
      <div class="animate-fade-in">
        <h1 class="page-title">Tìm kiếm</h1>
        <p class="page-subtitle">Tra cứu nhanh trong toàn bộ kho tri thức cá nhân</p>
      </div>

      <!-- Search Input -->
      <div class="search-input-wrapper stagger-item" style="margin-bottom:var(--space-md);">
        <span class="search-icon">🔍</span>
        <input class="form-input" id="search-query" type="text" placeholder="Tìm kiếm bài học, quy luật, tử vi..." autofocus>
      </div>

      <!-- Source Filter -->
      <div class="filter-bar stagger-item">
        <button class="btn btn-sm ${activeSource === 'all' ? 'btn-primary' : ''}" data-source="all">Tất cả</button>
        <button class="btn btn-sm ${activeSource === 'tuvi' ? 'btn-primary' : ''}" data-source="tuvi">🌟 Tử Vi</button>
        <button class="btn btn-sm ${activeSource === 'lessons' ? 'btn-primary' : ''}" data-source="lessons">📖 Bài học</button>
        <button class="btn btn-sm ${activeSource === 'rules' ? 'btn-primary' : ''}" data-source="rules">⚖️ Quy luật</button>
        <button class="btn btn-sm ${activeSource === 'reminders' ? 'btn-primary' : ''}" data-source="reminders">💡 Lời nhắc</button>
        <button class="btn btn-sm ${activeSource === 'journals' ? 'btn-primary' : ''}" data-source="journals">📓 Nhật ký</button>
      </div>

      <!-- Results -->
      <div id="search-results"></div>
    `;

    // Bind events
    const searchInput = container.querySelector('#search-query');
    let debounce = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        query = searchInput.value.trim();
        search();
      }, 200);
    });

    container.querySelectorAll('[data-source]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSource = btn.dataset.source;
        // Update active states
        container.querySelectorAll('[data-source]').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.source === activeSource);
        });
        search();
      });
    });

    // Initial render
    search();
  }

  window.renderSearch = renderSearch;
})();
