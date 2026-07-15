// ============================================
// NỘI TÂM — Overview Component (Tổng quan cuộc đời)
// ============================================

(function() {
  'use strict';

  function renderOverview(container) {
    const { Utils } = App;
    const sections = TUVI_SECTIONS;
    let activeFilter = 'all';
    let activeTypeFilter = 'all';

    function render() {
      const filteredData = TUVI_DATA.filter(item => {
        const sectionMatch = activeFilter === 'all' || item.section === activeFilter;
        const typeMatch = activeTypeFilter === 'all' || item.type === activeTypeFilter;
        return sectionMatch && typeMatch;
      });

      container.innerHTML = `
        <div class="animate-fade-in">
          <h1 class="page-title">Tổng quan Cuộc đời</h1>
          <p class="page-subtitle">Bản đồ cuộc đời từ lá số Tử Vi — Mệnh Thiên Đồng tại Tý, cách Cơ Nguyệt Đồng Lương</p>
        </div>

        <!-- Section Filter -->
        <div class="filter-bar stagger-item">
          <button class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : ''}" data-section="all">Tất cả (${TUVI_DATA.length})</button>
          ${sections.map(s => {
            const count = TUVI_DATA.filter(d => d.section === s.id).length;
            return `<button class="btn btn-sm ${activeFilter === s.id ? 'btn-primary' : ''}" data-section="${s.id}">${s.icon} ${s.name} (${count})</button>`;
          }).join('')}
        </div>

        <!-- Type Filter -->
        <div class="filter-bar stagger-item" style="margin-top: calc(var(--space-lg) * -1); margin-bottom: var(--space-lg);">
          <span class="text-xs text-muted" style="margin-right: var(--space-sm);">Loại:</span>
          <button class="btn btn-sm ${activeTypeFilter === 'all' ? 'btn-primary' : ''}" data-type="all">Tất cả</button>
          <button class="btn btn-sm ${activeTypeFilter === 'strength' ? 'btn-primary' : ''}" data-type="strength">💪 Điểm mạnh</button>
          <button class="btn btn-sm ${activeTypeFilter === 'weakness' ? 'btn-primary' : ''}" data-type="weakness">⚠️ Điểm yếu</button>
          <button class="btn btn-sm ${activeTypeFilter === 'warning' ? 'btn-primary' : ''}" data-type="warning">🔔 Lưu ý</button>
          <button class="btn btn-sm ${activeTypeFilter === 'info' ? 'btn-primary' : ''}" data-type="info">📌 Thông tin</button>
        </div>

        <!-- Content -->
        ${activeFilter === 'all' ? renderGroupedView(filteredData) : renderFlatView(filteredData)}
      `;

      // Bind filter clicks
      container.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeFilter = btn.dataset.section;
          render();
        });
      });

      container.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTypeFilter = btn.dataset.type;
          render();
        });
      });

      // Bind collapsible sections
      container.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
          header.parentElement.classList.toggle('open');
        });
      });

      // Bind card clicks
      container.querySelectorAll('[data-item-id]').forEach(card => {
        card.addEventListener('click', () => {
          const item = TUVI_DATA.find(d => d.id === parseInt(card.dataset.itemId));
          if (item) showItemDetail(item);
        });
      });
    }

    function renderGroupedView(data) {
      return TUVI_SECTIONS.map(section => {
        const items = data.filter(d => d.section === section.id);
        if (items.length === 0) return '';
        return `
          <div class="collapsible open stagger-item">
            <div class="collapsible-header">
              <div class="collapsible-title">
                <span>${section.icon}</span>
                ${section.name}
                <span class="text-xs text-muted" style="margin-left:var(--space-sm);">(${items.length} mục)</span>
              </div>
              <span class="collapsible-arrow">▼</span>
            </div>
            <div class="collapsible-body">
              <div class="collapsible-content">
                <p class="text-sm text-muted mb-md">${section.description}</p>
                <div class="grid-auto">
                  ${items.map(item => renderItemCard(item)).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderFlatView(data) {
      if (data.length === 0) {
        return `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Không tìm thấy</div>
            <div class="empty-state-text">Thử thay đổi bộ lọc để xem nội dung khác.</div>
          </div>
        `;
      }
      return `<div class="grid-auto">${data.map(item => renderItemCard(item)).join('')}</div>`;
    }

    function renderItemCard(item) {
      return `
        <div class="card stagger-item" style="cursor:pointer;" data-item-id="${item.id}">
          <div class="flex items-center gap-sm mb-sm">
            <span class="tag tag-accent" style="font-size:var(--text-xs);">#${item.id}</span>
            <span class="tag ${Utils.getTypeClass(item.type)}" style="font-size:var(--text-xs);">
              ${Utils.getTypeIcon(item.type)} ${item.type === 'strength' ? 'Mạnh' : item.type === 'weakness' ? 'Yếu' : item.type === 'warning' ? 'Lưu ý' : 'Info'}
            </span>
          </div>
          <h4 class="card-title" style="font-size:var(--text-base);">${Utils.escapeHtml(item.title)}</h4>
          <p class="card-text" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
            ${Utils.escapeHtml(item.content).substring(0, 150)}...
          </p>
          <div class="tags-container" style="margin-top:var(--space-sm);">
            ${Utils.renderTags(item.tags.slice(0, 3))}
          </div>
        </div>
      `;
    }

    function showItemDetail(item) {
      const section = TUVI_SECTIONS.find(s => s.id === item.section);

      const strengthsHtml = item.strengths && item.strengths.length > 0
        ? `<div class="mt-md">
            <span class="text-xs text-muted" style="display:block;margin-bottom:4px;">Điểm mạnh liên quan:</span>
            <div class="tags-container">${item.strengths.map(s => `<span class="tag tag-strength">${s}</span>`).join('')}</div>
          </div>`
        : '';

      const weaknessesHtml = item.weaknesses && item.weaknesses.length > 0
        ? `<div class="mt-md">
            <span class="text-xs text-muted" style="display:block;margin-bottom:4px;">Điểm yếu liên quan:</span>
            <div class="tags-container">${item.weaknesses.map(w => `<span class="tag tag-weakness">${w}</span>`).join('')}</div>
          </div>`
        : '';

      // Find related items by shared tags
      const relatedItems = TUVI_DATA
        .filter(d => d.id !== item.id && d.tags.some(t => item.tags.includes(t)))
        .slice(0, 4);

      const relatedHtml = relatedItems.length > 0
        ? `<div class="divider"></div>
          <div class="section-title" style="font-size:var(--text-base);">🔗 Liên kết chéo</div>
          ${relatedItems.map(r => `
            <div class="card" style="padding:var(--space-md);margin-bottom:var(--space-sm);cursor:pointer;" onclick="(function(){
              App.DetailPanel.close();
              setTimeout(function(){
                const item = TUVI_DATA.find(d => d.id === ${r.id});
                if(item) document.querySelector('[data-item-id=&quot;${r.id}&quot;]')?.click();
              }, 300);
            })()">
              <div class="flex items-center gap-sm">
                <span class="tag tag-accent" style="font-size:var(--text-xs);">#${r.id}</span>
                <span class="text-sm">${Utils.escapeHtml(r.title)}</span>
              </div>
            </div>
          `).join('')}`
        : '';

      App.DetailPanel.show(
        `#${item.id} — ${Utils.escapeHtml(item.title)}`,
        `
          <div class="flex items-center gap-sm mb-md">
            <span class="tag ${Utils.getTypeClass(item.type)}">${Utils.getTypeIcon(item.type)} ${item.type === 'strength' ? 'Điểm mạnh' : item.type === 'weakness' ? 'Điểm yếu' : item.type === 'warning' ? 'Lưu ý' : 'Thông tin'}</span>
            ${section ? `<span class="tag tag-accent">${section.icon} ${section.name}</span>` : ''}
          </div>
          <p style="line-height:1.8;color:var(--text-secondary);">${Utils.escapeHtml(item.content)}</p>
          <div class="tags-container mt-md">
            ${Utils.renderTags(item.tags)}
          </div>
          ${strengthsHtml}
          ${weaknessesHtml}
          ${relatedHtml}
        `
      );
    }

    render();
  }

  window.renderOverview = renderOverview;
})();
