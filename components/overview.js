// ============================================
// NỘI TÂM — Overview Component (Astro-Matrix 100 & Knowledge Graph)
// ============================================

(function() {
  'use strict';

  function renderOverview(container, params) {
    const { Utils, Modal, Toast } = App;
    const sections = window.TUVI_SECTIONS || [];
    const palaces = window.TUVI_PALACES || [];
    const allStrengths = [...new Set(TUVI_DATA.flatMap(d => d.strengths || []))];
    const allWeaknesses = [...new Set(TUVI_DATA.flatMap(d => d.weaknesses || []))];

    let activeFilter = 'all';
    let activePalaceFilter = 'all';
    let activeTypeFilter = 'all';
    let selectedYear = 2026;
    let searchQuery = '';

    if (params) {
      if (typeof params === 'string') {
        activePalaceFilter = params;
      } else if (typeof params === 'object') {
        if (params.palace) activePalaceFilter = params.palace;
        if (params.year) selectedYear = parseInt(params.year);
        if (params.section) activeFilter = params.section;
      }
    }

    function render() {
      const reflections = window.getTuViReflections ? window.getTuViReflections() : {};
      const currentDynamic = (window.ANNUAL_DYNAMICS && window.ANNUAL_DYNAMICS[selectedYear]) || { canChi: `Năm ${selectedYear}`, luuSao: [] };

      const filteredData = TUVI_DATA.filter(item => {
        const sectionMatch = activeFilter === 'all' || item.section === activeFilter;
        const palaceMatch = activePalaceFilter === 'all' || item.palace === activePalaceFilter;
        const typeMatch = activeTypeFilter === 'all' || item.type === activeTypeFilter;
        const searchMatch = !searchQuery || 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return sectionMatch && palaceMatch && typeMatch && searchMatch;
      });

      const activePalaceObj = palaces.find(p => p.id === activePalaceFilter);

      container.innerHTML = `
        <div class="animate-fade-in">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:16px;">
            <div>
              <h1 class="page-title" style="margin-bottom:4px;">Ma Trận Luận Giải "Astro-Matrix 100"</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Mạng lưới Tri thức Tử Vi Tương tác 100 chỉ số & Trục Thời gian Time Travel</p>
            </div>
            
            <!-- Quick Search -->
            <div style="position:relative;min-width:240px;">
              <input type="text" id="astro-search-input" class="form-input" placeholder="🔍 Tìm chỉ số, từ khóa, sao..." value="${Utils.escapeHtml(searchQuery)}" style="width:100%;padding:8px 14px;border-radius:20px;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-base);font-size:0.9rem;">
            </div>
          </div>
        </div>

        <!-- Dynamic Time Travel Slider Header -->
        <div class="card card-highlight animate-fade-in-up stagger-item" style="margin-bottom:var(--space-lg);border:1px solid var(--border-accent);background:linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08));">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.5rem;">🔮</span>
              <div>
                <div style="font-weight:700;font-size:1.05rem;color:var(--accent-primary);">Time Travel Slider: Vận Hạn Năm ${selectedYear} (${currentDynamic.canChi})</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);">${currentDynamic.highlights || ''}</div>
              </div>
            </div>
            <div style="background:var(--accent-muted);padding:4px 12px;border-radius:16px;border:1px solid var(--border-accent);font-weight:600;color:var(--accent-primary);font-size:0.9rem;">
              Hành: ${currentDynamic.hanh || 'Ngũ Hành'}
            </div>
          </div>

          <!-- Slider Bar -->
          <div style="display:flex;align-items:center;gap:16px;">
            <span style="font-weight:600;font-size:0.85rem;color:var(--text-muted);">2026</span>
            <input type="range" id="time-travel-slider" min="2026" max="2035" value="${selectedYear}" step="1" style="flex:1;cursor:pointer;accent-color:var(--accent-primary);">
            <span style="font-weight:600;font-size:0.85rem;color:var(--text-muted);">2035</span>
            <span style="font-weight:700;color:var(--accent-primary);min-width:50px;text-align:right;">${selectedYear}</span>
          </div>

          <!-- Luu Sao Badges -->
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color);">
            <span style="font-size:0.8rem;color:var(--text-muted);align-self:center;">Sao Lưu nổi bật:</span>
            ${(currentDynamic.luuSao || []).map(sao => `<span class="tag tag-accent" style="font-size:0.78rem;">✨ ${sao}</span>`).join('')}
          </div>
        </div>

        <!-- Indicators Grid -->
        <div class="indicators-grid stagger-item animate-fade-in-up">
          <div class="indicator-card hp" title="Chỉ số hạnh phúc">
            <div class="indicator-header"><div class="indicator-icon">😊</div><div class="indicator-title">Hạnh Phúc</div></div>
            <div>
              <div class="indicator-value">90<span style="font-size:0.5em;color:var(--text-muted)">/100</span></div>
              <div class="indicator-subtitle">Nội tâm bình yên, hướng thiện</div>
              <div class="indicator-progress-bg"><div class="indicator-progress-fill" style="width:90%;"></div></div>
            </div>
          </div>

          <div class="indicator-card aq" title="Chỉ số vượt khó">
            <div class="indicator-header"><div class="indicator-icon">🏔️</div><div class="indicator-title">Vượt Khó (AQ)</div></div>
            <div>
              <div class="indicator-value">85<span style="font-size:0.5em;color:var(--text-muted)">/100</span></div>
              <div class="indicator-subtitle">Sức sống mạnh mẽ từ bên trong</div>
              <div class="indicator-progress-bg"><div class="indicator-progress-fill" style="width:85%;"></div></div>
            </div>
          </div>

          <div class="indicator-card destiny" title="Điểm Lá Số">
            <div class="indicator-header"><div class="indicator-icon">✨</div><div class="indicator-title">Điểm Lá Số</div></div>
            <div>
              <div class="indicator-value">8.5<span style="font-size:0.5em;color:var(--text-muted)">/10</span></div>
              <div class="indicator-subtitle">Hậu vận rực rỡ, viên mãn</div>
              <div class="indicator-progress-bg"><div class="indicator-progress-fill" style="width:85%;"></div></div>
            </div>
          </div>

          <div class="indicator-card strength" title="Điểm mạnh cốt lõi">
            <div class="indicator-header"><div class="indicator-icon">💎</div><div class="indicator-title">Mạnh Nhất</div></div>
            <div class="indicator-text-value">Ôn hòa, nhân hậu</div>
          </div>

          <div class="indicator-card weakness" title="Khuyết điểm cần khắc phục">
            <div class="indicator-header"><div class="indicator-icon">⚠️</div><div class="indicator-title">Yếu Chí Mạng</div></div>
            <div class="indicator-text-value">Thiếu kiên định</div>
          </div>
        </div>

        <!-- 12 Palaces Filter Bar (Astro-Matrix 100 Key feature) -->
        <div style="margin-bottom:var(--space-md);">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span>🧭</span> LỌC THEO 12 CUNG LÁ SỐ:
            ${activePalaceObj && activePalaceObj.id !== 'all' ? `<span style="color:var(--accent-primary);">[Đang chọn: ${activePalaceObj.icon} ${activePalaceObj.name}]</span>` : ''}
          </div>
          <div class="filter-bar stagger-item" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;">
            ${palaces.map(p => {
              const count = p.id === 'all' ? TUVI_DATA.length : TUVI_DATA.filter(d => d.palace === p.id).length;
              const isActive = activePalaceFilter === p.id;
              return `<button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}" data-palace="${p.id}" style="white-space:nowrap;font-size:0.82rem;padding:6px 12px;border-radius:16px;">
                ${p.icon} ${p.name} (${count})
              </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Section Filter & Type Filter -->
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <div class="filter-bar stagger-item" style="margin-bottom:0;">
            <button class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : ''}" data-section="all">Tất cả Chủ đề (${TUVI_DATA.length})</button>
            ${sections.map(s => {
              const count = TUVI_DATA.filter(d => d.section === s.id).length;
              return `<button class="btn btn-sm ${activeFilter === s.id ? 'btn-primary' : ''}" data-section="${s.id}">${s.icon} ${s.name} (${count})</button>`;
            }).join('')}
          </div>

          <div class="filter-bar stagger-item" style="margin-bottom:0;">
            <span class="text-xs text-muted" style="margin-right:var(--space-sm);">Loại:</span>
            <button class="btn btn-sm ${activeTypeFilter === 'all' ? 'btn-primary' : ''}" data-type="all">Tất cả</button>
            <button class="btn btn-sm ${activeTypeFilter === 'strength' ? 'btn-primary' : ''}" data-type="strength">💪 Mạnh</button>
            <button class="btn btn-sm ${activeTypeFilter === 'weakness' ? 'btn-primary' : ''}" data-type="weakness">⚠️ Yếu</button>
            <button class="btn btn-sm ${activeTypeFilter === 'warning' ? 'btn-primary' : ''}" data-type="warning">🔔 Lưu ý</button>
            <button class="btn btn-sm ${activeTypeFilter === 'info' ? 'btn-primary' : ''}" data-type="info">📌 Info</button>
          </div>
        </div>

        <!-- Active Filter Summary -->
        <div style="margin-bottom:var(--space-md);font-size:0.9rem;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;">
          <span>Hiển thị <strong>${filteredData.length}</strong> / 100 chỉ số luận giải:</span>
          ${(activeFilter !== 'all' || activePalaceFilter !== 'all' || activeTypeFilter !== 'all' || searchQuery) ? `
            <button class="btn btn-ghost btn-sm" id="btn-reset-filters" style="color:var(--accent-primary);padding:2px 8px;font-size:0.8rem;">🔄 Xóa bộ lọc</button>
          ` : ''}
        </div>

        <!-- Content Grid -->
        ${activeFilter === 'all' && activePalaceFilter === 'all' && !searchQuery ? renderGroupedView(filteredData, reflections) : renderFlatView(filteredData, reflections)}
      `;

      // Bind slider input
      const slider = container.querySelector('#time-travel-slider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          selectedYear = parseInt(e.target.value);
          render();
        });
      }

      // Bind search input
      const searchInput = container.querySelector('#astro-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          render();
        });
      }

      // Bind Reset Filters
      container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
        activeFilter = 'all';
        activePalaceFilter = 'all';
        activeTypeFilter = 'all';
        searchQuery = '';
        render();
      });

      // Bind Palace clicks
      container.querySelectorAll('[data-palace]').forEach(btn => {
        btn.addEventListener('click', () => {
          activePalaceFilter = btn.dataset.palace;
          render();
        });
      });

      // Bind Section clicks
      container.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeFilter = btn.dataset.section;
          render();
        });
      });

      // Bind Type clicks
      container.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTypeFilter = btn.dataset.type;
          render();
        });
      });

      // Bind collapsible headers
      container.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
          header.parentElement.classList.toggle('open');
        });
      });

      // Bind card clicks for detail
      container.querySelectorAll('[data-item-id]').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-reflection-note')) return;

          const itemId = parseInt(card.dataset.itemId);
          const item = TUVI_DATA.find(d => d.id === itemId);
          if (item) showItemDetail(item, reflections);
        });
      });

      // Bind Reflection Note buttons
      container.querySelectorAll('.btn-reflection-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = parseInt(btn.dataset.itemId);
          showReflectionForm(itemId);
        });
      });
    }

    function getPalaceLabel(palaceId) {
      const p = (window.TUVI_PALACES || []).find(x => x.id === palaceId);
      return p ? `${p.icon} ${p.name}` : palaceId;
    }

    function renderGroupedView(data, reflections) {
      return sections.map(section => {
        const items = data.filter(d => d.section === section.id);
        if (items.length === 0) return '';
        return `
          <div class="collapsible open stagger-item" style="margin-bottom:var(--space-lg);">
            <div class="collapsible-header" style="padding:12px 16px;">
              <div class="collapsible-title">
                <span style="font-size:1.2rem;">${section.icon}</span>
                ${section.name}
                <span class="text-xs text-muted" style="margin-left:var(--space-sm);">(${items.length} mục)</span>
              </div>
              <span class="collapsible-arrow">▼</span>
            </div>
            <div class="collapsible-body">
              <div class="collapsible-content" style="padding:16px;">
                <p class="text-sm text-muted mb-md">${section.description}</p>
                <div class="grid-auto">
                  ${items.map(item => renderItemCard(item, reflections)).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderFlatView(data, reflections) {
      if (data.length === 0) {
        return `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Không tìm thấy mục nào</div>
            <div class="empty-state-text">Thử thay đổi từ khóa hoặc bộ lọc Cung lá số.</div>
          </div>
        `;
      }
      return `<div class="grid-auto" style="margin-bottom:var(--space-lg);">${data.map(item => renderItemCard(item, reflections)).join('')}</div>`;
    }

    function renderItemCard(item, reflections) {
      const dynamicContent = window.getDynamicTuViItemContent ? window.getDynamicTuViItemContent(item, selectedYear) : item.content;
      const itemNotes = reflections[item.id] || [];

      return `
        <div class="card stagger-item" style="cursor:pointer;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:16px;" data-item-id="${item.id}">
          <div>
            <div class="flex items-center justify-between gap-sm mb-sm" style="flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="tag tag-accent" style="font-size:var(--text-xs);font-weight:700;">#${item.id}</span>
                <span class="tag tag-ghost" style="font-size:var(--text-xs);background:var(--accent-muted);color:var(--accent-primary);border:1px solid var(--border-accent);">
                  ${getPalaceLabel(item.palace)}
                </span>
              </div>
              <span class="tag ${Utils.getTypeClass(item.type)}" style="font-size:var(--text-xs);">
                ${Utils.getTypeIcon(item.type)} ${item.type === 'strength' ? 'Mạnh' : item.type === 'weakness' ? 'Yếu' : item.type === 'warning' ? 'Lưu ý' : 'Info'}
              </span>
            </div>

            <h4 class="card-title" style="font-size:var(--text-base);margin-bottom:8px;">${Utils.escapeHtml(item.title)}</h4>
            
            <p class="card-text" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">
              ${Utils.escapeHtml(dynamicContent).substring(0, 140)}...
            </p>
          </div>

          <div>
            ${itemNotes.length > 0 ? `
              <div style="background:var(--accent-muted);padding:6px 10px;border-radius:6px;font-size:0.8rem;color:var(--accent-primary);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                <span>📝</span> <strong>${itemNotes.length} phản tư:</strong> "${Utils.escapeHtml(itemNotes[0].note).substring(0, 45)}..."
              </div>
            ` : ''}

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-sm);padding-top:8px;border-top:1px dashed var(--border-color);">
              <div class="tags-container" style="gap:4px;">
                ${Utils.renderTags(item.tags.slice(0, 2))}
              </div>
              
              <button class="btn btn-ghost btn-sm btn-reflection-note" data-item-id="${item.id}" style="font-size:0.78rem;padding:4px 8px;color:var(--accent-primary);" title="Viết Ghi chú Phản tư">
                📝 Phản tư
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function showItemDetail(item, reflections) {
      const section = sections.find(s => s.id === item.section);
      const dynamicContent = window.getDynamicTuViItemContent ? window.getDynamicTuViItemContent(item, selectedYear) : item.content;
      const itemNotes = reflections[item.id] || [];

      const notesHtml = `
        <div class="mt-lg p-md" style="background:var(--bg-surface);border-radius:12px;border:1px solid var(--border-color);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">📝 Nhật ký Phản tư Thực tế (${itemNotes.length})</span>
            <button class="btn btn-primary btn-sm" id="btn-modal-add-ref" style="font-size:0.8rem;padding:4px 10px;">+ Ghi nhận sự kiện</button>
          </div>
          ${itemNotes.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${itemNotes.map(n => `
                <div style="background:var(--bg-card);padding:10px;border-radius:8px;border:1px solid var(--border-color);">
                  <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">
                    <span>📅 ${n.date}</span>
                    <button class="btn btn-ghost btn-icon btn-sm" data-delete-ref="${n.id}" style="font-size:0.75rem;padding:0;">🗑️</button>
                  </div>
                  <div style="font-size:0.88rem;color:var(--text-base);line-height:1.5;">${Utils.escapeHtml(n.note)}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-xs text-muted" style="margin-bottom:0;">Chưa có phản tư nào. Hãy ghi lại sự kiện thực tế phát sinh để kiểm chứng luận giải này.</p>
          `}
        </div>
      `;

      const relatedItems = TUVI_DATA
        .filter(d => d.id !== item.id && d.tags.some(t => item.tags.includes(t)))
        .slice(0, 4);

      const relatedHtml = relatedItems.length > 0
        ? `<div class="divider"></div>
          <div class="section-title" style="font-size:var(--text-base);">🔗 Liên kết tri thức liên quan</div>
          ${relatedItems.map(r => `
            <div class="card" style="padding:var(--space-md);margin-bottom:var(--space-sm);cursor:pointer;" onclick="(function(){
              App.DetailPanel.close();
              setTimeout(function(){
                const item = TUVI_DATA.find(d => d.id === ${r.id});
                if(item) showItemDetail(item, window.getTuViReflections ? window.getTuViReflections() : {});
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
          <div class="flex items-center gap-sm mb-md flex-wrap">
            <span class="tag ${Utils.getTypeClass(item.type)}">${Utils.getTypeIcon(item.type)} ${item.type === 'strength' ? 'Điểm mạnh' : item.type === 'weakness' ? 'Điểm yếu' : item.type === 'warning' ? 'Lưu ý' : 'Thông tin'}</span>
            <span class="tag tag-accent">${getPalaceLabel(item.palace)}</span>
            ${section ? `<span class="tag tag-ghost">${section.icon} ${section.name}</span>` : ''}
          </div>
          <div style="line-height:1.8;color:var(--text-secondary);white-space:pre-line;">${Utils.escapeHtml(dynamicContent)}</div>
          <div class="tags-container mt-md">
            ${Utils.renderTags(item.tags)}
          </div>
          ${notesHtml}
          ${relatedHtml}
        `
      );

      setTimeout(() => {
        document.getElementById('btn-modal-add-ref')?.addEventListener('click', () => {
          showReflectionForm(item.id, () => showItemDetail(item, window.getTuViReflections ? window.getTuViReflections() : {}));
        });

        document.querySelectorAll('[data-delete-ref]').forEach(btn => {
          btn.addEventListener('click', () => {
            if (window.deleteTuViReflection) {
              window.deleteTuViReflection(item.id, btn.dataset.deleteRef);
              showItemDetail(item, window.getTuViReflections ? window.getTuViReflections() : {});
              render();
            }
          });
        });
      }, 100);
    }

    function showReflectionForm(itemId, callback) {
      const item = TUVI_DATA.find(d => d.id === itemId);
      if (!item) return;

      Modal.show({
        title: `📝 Phản tư cho Mục #${itemId}: ${item.title}`,
        content: `
          <div class="form-group mb-md">
            <label class="form-label">Sự kiện / Trải nghiệm thực tế phát sinh:</label>
            <textarea id="ref-note-input" class="form-input" rows="4" placeholder="Ví dụ: Ngày 22/07/2026, mình đầu tư mua thiết bị làm việc 30tr, đúng như dự báo chi tiêu mục này..."></textarea>
            <span class="text-xs text-muted" style="margin-top:4px;display:block;">* Ghi chú này sẽ tự động lưu & đồng bộ vào Nhật ký Phản tư (Tri Thức Hub).</span>
          </div>
        `,
        confirmText: 'Lưu Phản Tư',
        onConfirm: () => {
          const input = document.getElementById('ref-note-input');
          const val = input ? input.value.trim() : '';
          if (val) {
            if (window.saveTuViReflection) {
              window.saveTuViReflection(itemId, val);
              Toast.show('Đã lưu Ghi chú Phản tư & Đồng bộ Nhật ký!');
              render();
              if (callback) callback();
            }
          } else {
            Toast.show('Vui lòng nhập nội dung ghi chú');
          }
        }
      });
    }

    render();
  }

  window.renderOverview = renderOverview;
})();
