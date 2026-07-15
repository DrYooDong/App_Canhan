// ============================================
// NỘI TÂM — Rules Component (Quy luật xã hội)
// ============================================

(function() {
  'use strict';

  function renderRules(container) {
    const { Utils, CRUD, Modal, Toast } = App;
    let activeCategory = 'all';

    function render() {
      const rules = CRUD.getAll('rules');
      const filtered = activeCategory === 'all' ? rules : rules.filter(r => r.category === activeCategory);

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="page-toolbar">
            <div>
              <h1 class="page-title">Quy luật Xã hội</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Nguyên tắc về con người, công việc, quan hệ và quyền lực</p>
            </div>
            <button class="btn btn-primary" id="btn-add-rule">+ Thêm quy luật</button>
          </div>
        </div>

        <!-- Category Filter -->
        <div class="filter-bar stagger-item">
          <button class="btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : ''}" data-cat="all">Tất cả (${rules.length})</button>
          ${RULE_CATEGORIES.map(cat => {
            const count = rules.filter(r => r.category === cat.value).length;
            return `<button class="btn btn-sm ${activeCategory === cat.value ? 'btn-primary' : ''}" data-cat="${cat.value}">${cat.label} (${count})</button>`;
          }).join('')}
        </div>

        <!-- Content -->
        ${filtered.length > 0 ? `
          <div class="grid-auto">
            ${filtered.map(rule => {
              const cat = RULE_CATEGORIES.find(c => c.value === rule.category);
              return `
                <div class="card stagger-item">
                  <div class="flex items-center justify-between mb-sm">
                    ${cat ? `<span class="tag" style="background:${cat.color}15;color:${cat.color};border-color:${cat.color}30;">${cat.label}</span>` : ''}
                    <div class="flex gap-xs">
                      <button class="btn btn-ghost btn-icon btn-sm" data-edit="${rule.id}" title="Sửa">✏️</button>
                      <button class="btn btn-ghost btn-icon btn-sm" data-delete="${rule.id}" title="Xóa">🗑️</button>
                    </div>
                  </div>
                  <h4 class="card-title" style="font-size:var(--text-base);">${Utils.escapeHtml(rule.title)}</h4>
                  <p class="card-text">${Utils.escapeHtml(rule.content)}</p>
                  <div class="tags-container">
                    ${Utils.renderTags(rule.tags || [])}
                  </div>
                  <div class="card-meta">
                    <span>${Utils.timeAgo(rule.createdAt)}</span>
                    ${rule.source ? `<span>• ${Utils.escapeHtml(rule.source)}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state stagger-item">
            <div class="empty-state-icon">⚖️</div>
            <div class="empty-state-title">Chưa có quy luật nào</div>
            <div class="empty-state-text">Ghi lại những nguyên tắc xã hội bạn đã đúc kết.</div>
            <button class="btn btn-primary" id="btn-add-rule-empty">+ Thêm quy luật đầu tiên</button>
          </div>
        `}
      `;

      // Bind events
      container.querySelector('#btn-add-rule')?.addEventListener('click', () => showRuleForm());
      container.querySelector('#btn-add-rule-empty')?.addEventListener('click', () => showRuleForm());

      container.querySelectorAll('[data-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCategory = btn.dataset.cat;
          render();
        });
      });

      container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const rule = CRUD.getById('rules', btn.dataset.edit);
          if (rule) showRuleForm(rule);
        });
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Bạn có chắc muốn xóa quy luật này?')) {
            CRUD.delete('rules', btn.dataset.delete);
            Toast.show('Đã xóa quy luật', 'success');
            render();
            if (window.updateBadges) updateBadges();
          }
        });
      });
    }

    function showRuleForm(existing = null) {
      const overlay = Modal.show(`
        <div class="form-group">
          <label class="form-label">Tiêu đề *</label>
          <input class="form-input" id="rule-title" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Tên quy luật...">
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung *</label>
          <textarea class="form-textarea" id="rule-content" placeholder="Mô tả quy luật...">${existing ? Utils.escapeHtml(existing.content) : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Danh mục</label>
          <select class="form-select" id="rule-category">
            ${RULE_CATEGORIES.map(cat => `<option value="${cat.value}" ${existing?.category === cat.value ? 'selected' : ''}>${cat.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (cách nhau bởi dấu phẩy)</label>
          <input class="form-input" id="rule-tags" value="${existing?.tags ? existing.tags.join(', ') : ''}" placeholder="quan-hệ, công-việc...">
        </div>
        <div class="form-group">
          <label class="form-label">Nguồn</label>
          <input class="form-input" id="rule-source" value="${existing?.source ? Utils.escapeHtml(existing.source) : ''}" placeholder="Từ sách, kinh nghiệm...">
        </div>
      `, {
        title: existing ? 'Sửa quy luật' : 'Thêm quy luật mới',
        footer: `
          <button class="btn" onclick="App.Modal.close()">Hủy</button>
          <button class="btn btn-primary" id="btn-save-rule">💾 Lưu</button>
        `
      });

      overlay.querySelector('#btn-save-rule').addEventListener('click', () => {
        const title = overlay.querySelector('#rule-title').value.trim();
        const content = overlay.querySelector('#rule-content').value.trim();
        const category = overlay.querySelector('#rule-category').value;
        const tags = overlay.querySelector('#rule-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        const source = overlay.querySelector('#rule-source').value.trim();

        if (!title || !content) {
          Toast.show('Vui lòng nhập tiêu đề và nội dung', 'error');
          return;
        }

        const data = { title, content, category, tags, source };

        if (existing) {
          CRUD.update('rules', existing.id, data);
          Toast.show('Đã cập nhật quy luật', 'success');
        } else {
          CRUD.create('rules', data);
          Toast.show('Đã thêm quy luật mới', 'success');
        }

        Modal.close(overlay);
        render();
        if (window.updateBadges) updateBadges();
      });
    }

    render();
  }

  window.renderRules = renderRules;
})();
