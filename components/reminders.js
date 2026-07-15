// ============================================
// NỘI TÂM — Reminders Component (Lời nhắc nhở)
// ============================================

(function() {
  'use strict';

  function renderReminders(container) {
    const { Utils, CRUD, Modal, Toast } = App;
    let activeMood = 'all';

    function render() {
      const reminders = CRUD.getAll('reminders');
      const filtered = activeMood === 'all' ? reminders : reminders.filter(r => r.mood === activeMood);

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="page-toolbar">
            <div>
              <h1 class="page-title">Lời nhắc nhở</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Khi chệch hướng, hệ thống sẽ kéo bạn quay lại</p>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-primary" id="btn-sos">🆘 SOS — Nhắc ngay</button>
              <button class="btn" id="btn-add-reminder">+ Thêm</button>
            </div>
          </div>
        </div>

        <!-- Mood Filter -->
        <div class="filter-bar stagger-item">
          <button class="btn btn-sm ${activeMood === 'all' ? 'btn-primary' : ''}" data-mood="all">Tất cả (${reminders.length})</button>
          ${MOOD_OPTIONS.map(mood => {
            const count = reminders.filter(r => r.mood === mood.value).length;
            if (count === 0 && activeMood !== mood.value) return '';
            return `<button class="btn btn-sm ${activeMood === mood.value ? 'btn-primary' : ''}" data-mood="${mood.value}">${mood.label} (${count})</button>`;
          }).join('')}
        </div>

        <!-- Content -->
        ${filtered.length > 0 ? `
          <div class="grid-auto">
            ${filtered.map(reminder => {
              const mood = MOOD_OPTIONS.find(m => m.value === reminder.mood);
              return `
                <div class="card stagger-item">
                  <div class="flex items-center justify-between mb-sm">
                    ${mood ? `<span class="tag" style="background:${mood.color}15;color:${mood.color};border-color:${mood.color}30;">${mood.label}</span>` : ''}
                    <div class="flex gap-xs">
                      <button class="btn btn-ghost btn-icon btn-sm" data-edit="${reminder.id}" title="Sửa">✏️</button>
                      <button class="btn btn-ghost btn-icon btn-sm" data-delete="${reminder.id}" title="Xóa">🗑️</button>
                    </div>
                  </div>
                  <h4 class="card-title" style="font-size:var(--text-base);">${Utils.escapeHtml(reminder.title)}</h4>
                  <p class="card-text" style="line-height:1.8;">${Utils.escapeHtml(reminder.content)}</p>
                  <div class="tags-container">
                    ${Utils.renderTags(reminder.tags || [])}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state stagger-item">
            <div class="empty-state-icon">💡</div>
            <div class="empty-state-title">Chưa có lời nhắc nào</div>
            <div class="empty-state-text">Tạo những lời nhắc để giữ bạn đi đúng hướng khi dao động.</div>
            <button class="btn btn-primary" id="btn-add-reminder-empty">+ Thêm lời nhắc đầu tiên</button>
          </div>
        `}
      `;

      // Bind events
      container.querySelector('#btn-add-reminder')?.addEventListener('click', () => showReminderForm());
      container.querySelector('#btn-add-reminder-empty')?.addEventListener('click', () => showReminderForm());

      container.querySelector('#btn-sos')?.addEventListener('click', () => {
        const reminders = CRUD.getAll('reminders');
        if (reminders.length === 0) {
          Toast.show('Chưa có lời nhắc nào. Hãy thêm lời nhắc trước!', 'info');
          return;
        }
        showSOSMode(reminders);
      });

      container.querySelectorAll('[data-mood]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeMood = btn.dataset.mood;
          render();
        });
      });

      container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reminder = CRUD.getById('reminders', btn.dataset.edit);
          if (reminder) showReminderForm(reminder);
        });
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Bạn có chắc muốn xóa lời nhắc này?')) {
            CRUD.delete('reminders', btn.dataset.delete);
            Toast.show('Đã xóa lời nhắc', 'success');
            render();
            if (window.updateBadges) updateBadges();
          }
        });
      });
    }

    function showSOSMode(reminders) {
      const reminder = Utils.getRandomItem(reminders);
      const mood = MOOD_OPTIONS.find(m => m.value === reminder.mood);

      const overlay = Modal.show(`
        <div style="text-align:center;padding:var(--space-lg) 0;">
          <div style="font-size:3rem;margin-bottom:var(--space-md);">🌟</div>
          ${mood ? `<div class="tag" style="background:${mood.color}15;color:${mood.color};border-color:${mood.color}30;margin-bottom:var(--space-lg);display:inline-flex;">${mood.label}</div>` : ''}
          <h3 class="card-title" style="font-size:var(--text-xl);margin-bottom:var(--space-md);">${Utils.escapeHtml(reminder.title)}</h3>
          <p style="line-height:1.8;color:var(--text-secondary);font-size:var(--text-base);">${Utils.escapeHtml(reminder.content)}</p>
          <div class="tags-container" style="justify-content:center;margin-top:var(--space-lg);">
            ${Utils.renderTags(reminder.tags || [])}
          </div>
        </div>
      `, {
        title: '🆘 Lời nhắc dành cho bạn',
        footer: `
          <button class="btn" onclick="App.Modal.close()">Đã hiểu ✓</button>
          <button class="btn btn-primary" id="btn-another-sos">🔄 Lời nhắc khác</button>
        `
      });

      overlay.querySelector('#btn-another-sos')?.addEventListener('click', () => {
        Modal.close(overlay);
        setTimeout(() => showSOSMode(reminders), 300);
      });
    }

    function showReminderForm(existing = null) {
      const overlay = Modal.show(`
        <div class="form-group">
          <label class="form-label">Tiêu đề *</label>
          <input class="form-input" id="reminder-title" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Khi nào cần nhắc...">
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung *</label>
          <textarea class="form-textarea" id="reminder-content" placeholder="Lời nhắc nhở...">${existing ? Utils.escapeHtml(existing.content) : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Trạng thái cần nhắc</label>
          <select class="form-select" id="reminder-mood">
            ${MOOD_OPTIONS.map(mood => `<option value="${mood.value}" ${existing?.mood === mood.value ? 'selected' : ''}>${mood.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (cách nhau bởi dấu phẩy)</label>
          <input class="form-input" id="reminder-tags" value="${existing?.tags ? existing.tags.join(', ') : ''}" placeholder="kiên-nhẫn, bình-tĩnh...">
        </div>
      `, {
        title: existing ? 'Sửa lời nhắc' : 'Thêm lời nhắc mới',
        footer: `
          <button class="btn" onclick="App.Modal.close()">Hủy</button>
          <button class="btn btn-primary" id="btn-save-reminder">💾 Lưu</button>
        `
      });

      overlay.querySelector('#btn-save-reminder').addEventListener('click', () => {
        const title = overlay.querySelector('#reminder-title').value.trim();
        const content = overlay.querySelector('#reminder-content').value.trim();
        const mood = overlay.querySelector('#reminder-mood').value;
        const tags = overlay.querySelector('#reminder-tags').value.split(',').map(t => t.trim()).filter(Boolean);

        if (!title || !content) {
          Toast.show('Vui lòng nhập tiêu đề và nội dung', 'error');
          return;
        }

        const data = { title, content, mood, tags };

        if (existing) {
          CRUD.update('reminders', existing.id, data);
          Toast.show('Đã cập nhật lời nhắc', 'success');
        } else {
          CRUD.create('reminders', data);
          Toast.show('Đã thêm lời nhắc mới', 'success');
        }

        Modal.close(overlay);
        render();
        if (window.updateBadges) updateBadges();
      });
    }

    render();
  }

  window.renderReminders = renderReminders;
})();
