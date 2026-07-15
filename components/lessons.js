// ============================================
// NỘI TÂM — Lessons Component (Bài học đúc kết)
// ============================================

(function() {
  'use strict';

  function renderLessons(container) {
    const { Utils, CRUD, Modal, Toast } = App;
    let activeTag = 'all';

    function render() {
      const lessons = CRUD.getAll('lessons');
      const allTags = Utils.getAllTags(lessons);
      const filtered = activeTag === 'all' ? lessons : lessons.filter(l => l.tags && l.tags.includes(activeTag));

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="page-toolbar">
            <div>
              <h1 class="page-title">Bài học Đúc kết</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Tri thức rút ra từ trải nghiệm thực tế</p>
            </div>
            <button class="btn btn-primary" id="btn-add-lesson">+ Thêm bài học</button>
          </div>
        </div>

        <!-- Tag Filter -->
        ${allTags.length > 0 ? `
          <div class="filter-bar stagger-item">
            <button class="btn btn-sm ${activeTag === 'all' ? 'btn-primary' : ''}" data-filter="all">Tất cả (${lessons.length})</button>
            ${allTags.slice(0, 12).map(tag => `
              <button class="btn btn-sm ${activeTag === tag ? 'btn-primary' : ''}" data-filter="${tag}">${tag}</button>
            `).join('')}
          </div>
        ` : ''}

        <!-- Content -->
        ${filtered.length > 0 ? `
          <div class="grid-auto">
            ${filtered.map((lesson, i) => `
              <div class="card stagger-item">
                <div class="flex items-center justify-between mb-sm">
                  <h4 class="card-title" style="font-size:var(--text-base);margin-bottom:0;">${Utils.escapeHtml(lesson.title)}</h4>
                  <div class="flex gap-xs">
                    <button class="btn btn-ghost btn-icon btn-sm" data-edit="${lesson.id}" title="Sửa">✏️</button>
                    <button class="btn btn-ghost btn-icon btn-sm" data-delete="${lesson.id}" title="Xóa">🗑️</button>
                  </div>
                </div>
                <p class="card-text">${Utils.escapeHtml(lesson.content)}</p>
                ${lesson.relatedStrength ? `<div class="mt-sm"><span class="tag tag-strength">💪 ${lesson.relatedStrength}</span></div>` : ''}
                ${lesson.relatedWeakness ? `<div class="mt-sm"><span class="tag tag-weakness">⚠️ ${lesson.relatedWeakness}</span></div>` : ''}
                <div class="tags-container">
                  ${Utils.renderTags(lesson.tags || [])}
                </div>
                <div class="card-meta">
                  <span>${Utils.timeAgo(lesson.createdAt)}</span>
                  ${lesson.source ? `<span>• ${Utils.escapeHtml(lesson.source)}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state stagger-item">
            <div class="empty-state-icon">📖</div>
            <div class="empty-state-title">Chưa có bài học nào</div>
            <div class="empty-state-text">Hãy ghi lại những bài học rút ra từ trải nghiệm sống.</div>
            <button class="btn btn-primary" id="btn-add-lesson-empty">+ Thêm bài học đầu tiên</button>
          </div>
        `}
      `;

      // Bind events
      container.querySelector('#btn-add-lesson')?.addEventListener('click', () => showLessonForm());
      container.querySelector('#btn-add-lesson-empty')?.addEventListener('click', () => showLessonForm());

      container.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTag = btn.dataset.filter;
          render();
        });
      });

      container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const lesson = CRUD.getById('lessons', btn.dataset.edit);
          if (lesson) showLessonForm(lesson);
        });
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Bạn có chắc muốn xóa bài học này?')) {
            CRUD.delete('lessons', btn.dataset.delete);
            Toast.show('Đã xóa bài học', 'success');
            render();
            if (window.updateBadges) updateBadges();
          }
        });
      });
    }

    function showLessonForm(existing = null) {
      const allStrengths = [...new Set(TUVI_DATA.flatMap(d => d.strengths || []))];
      const allWeaknesses = [...new Set(TUVI_DATA.flatMap(d => d.weaknesses || []))];

      const overlay = Modal.show(`
        <div class="form-group">
          <label class="form-label">Tiêu đề *</label>
          <input class="form-input" id="lesson-title" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Tên bài học..." required>
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung *</label>
          <textarea class="form-textarea" id="lesson-content" placeholder="Ghi lại bài học...">${existing ? Utils.escapeHtml(existing.content) : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (cách nhau bởi dấu phẩy)</label>
          <input class="form-input" id="lesson-tags" value="${existing && existing.tags ? existing.tags.join(', ') : ''}" placeholder="kiên-nhẫn, kỷ-luật, công-việc...">
        </div>
        <div class="form-group">
          <label class="form-label">Liên kết điểm mạnh</label>
          <select class="form-select" id="lesson-strength">
            <option value="">-- Không --</option>
            ${allStrengths.map(s => `<option value="${s}" ${existing?.relatedStrength === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Liên kết điểm yếu cần sửa</label>
          <select class="form-select" id="lesson-weakness">
            <option value="">-- Không --</option>
            ${allWeaknesses.map(w => `<option value="${w}" ${existing?.relatedWeakness === w ? 'selected' : ''}>${w}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nguồn</label>
          <input class="form-input" id="lesson-source" value="${existing?.source ? Utils.escapeHtml(existing.source) : ''}" placeholder="Từ sách, trải nghiệm...">
        </div>
      `, {
        title: existing ? 'Sửa bài học' : 'Thêm bài học mới',
        footer: `
          <button class="btn" onclick="App.Modal.close()">Hủy</button>
          <button class="btn btn-primary" id="btn-save-lesson">💾 Lưu</button>
        `
      });

      overlay.querySelector('#btn-save-lesson').addEventListener('click', () => {
        const title = overlay.querySelector('#lesson-title').value.trim();
        const content = overlay.querySelector('#lesson-content').value.trim();
        const tags = overlay.querySelector('#lesson-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        const relatedStrength = overlay.querySelector('#lesson-strength').value;
        const relatedWeakness = overlay.querySelector('#lesson-weakness').value;
        const source = overlay.querySelector('#lesson-source').value.trim();

        if (!title || !content) {
          Toast.show('Vui lòng nhập tiêu đề và nội dung', 'error');
          return;
        }

        const data = { title, content, tags, relatedStrength, relatedWeakness, source };

        if (existing) {
          CRUD.update('lessons', existing.id, data);
          Toast.show('Đã cập nhật bài học', 'success');
        } else {
          CRUD.create('lessons', data);
          Toast.show('Đã thêm bài học mới', 'success');
        }

        Modal.close(overlay);
        render();
        if (window.updateBadges) updateBadges();
      });
    }

    render();
  }

  window.renderLessons = renderLessons;
})();
