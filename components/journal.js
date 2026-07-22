// ============================================
// NỘI TÂM — Journal Component (Nhật ký phản tư)
// ============================================

(function() {
  'use strict';

  function renderJournal(container) {
    const { Utils, CRUD, Modal, Toast } = App;

    function render() {
      const journals = CRUD.getAll('journals');
      const dailyPrompt = Utils.getDailyItem(JOURNAL_PROMPTS);

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="page-toolbar">
            <div>
              <h1 class="page-title">Nhật ký Năng lượng</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Ghi lại trải nghiệm và cảm xúc theo Ngũ Hành</p>
            </div>
            <button class="btn btn-primary" id="btn-add-journal">+ Viết nhật ký</button>
          </div>
        </div>

        <!-- Cảnh báo SOS Năng lượng -->
        ${(() => {
          if (journals.length >= 3) {
            const recentJournals = journals.slice(0, 3);
            const fireCount = recentJournals.filter(j => j.mood && j.mood.includes('Hỏa')).length;
            if (fireCount >= 2) {
              return `
                <div class="card card-highlight animate-fade-in stagger-item" style="margin-bottom:var(--space-xl); border: 1px solid var(--danger-color); background: rgba(220, 38, 38, 0.1);">
                  <div class="flex items-center gap-sm mb-sm">
                    <span style="font-size: 1.2rem;">🚨</span>
                    <span style="font-weight: bold; color: var(--danger-color); text-transform: uppercase;">SOS: Cảnh báo Hỏa Khí</span>
                  </div>
                  <p class="card-text" style="color: var(--text-base); line-height: 1.6;">
                    Hệ thống nhận thấy bạn đang có nhiều năng lượng <strong>Hỏa</strong> (áp lực, bức bối) trong những ghi chép gần đây. 
                    Bản mệnh Kim của bạn đang bị khắc chế mạnh. <br>
                    💡 <strong>Lời khuyên Phong Thủy:</strong> Hãy tìm người mệnh Thổ để tâm sự, mặc trang phục màu Vàng/Nâu đất, và giảm bớt các quyết định bốc đồng.
                  </p>
                </div>
              `;
            }
          }
          return '';
        })()}

        <!-- Daily Prompt -->
        <div class="card card-highlight stagger-item" style="margin-bottom:var(--space-xl);">
          <div class="flex items-center gap-sm mb-sm">
            <span class="text-accent">💭</span>
            <span class="text-xs text-accent" style="text-transform:uppercase;letter-spacing:0.1em;">Gợi ý hôm nay</span>
          </div>
          <p class="card-text" style="font-size:var(--text-base);color:var(--text-primary);font-style:italic;">"${dailyPrompt}"</p>
          <button class="btn btn-sm mt-md" id="btn-write-from-prompt">✍️ Viết về chủ đề này</button>
        </div>

        <!-- Timeline -->
        ${journals.length > 0 ? `
          <div class="timeline">
            ${journals.map((journal, i) => `
              <div class="timeline-item stagger-item">
                <div class="timeline-date">${Utils.formatDateTime(journal.createdAt)} ${journal.mood ? journal.mood : ''}</div>
                <div class="card" style="${(journal.tags || []).includes('#TuVi') ? 'border-left: 3px solid var(--accent-primary); background: linear-gradient(90deg, rgba(59, 130, 246, 0.04), transparent);' : ''}">
                  <div class="flex items-center justify-between mb-sm">
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${(journal.tags || []).includes('#TuVi') ? '<span style="font-size:1.1rem;" title="Nhật ký Phản tư Tử Vi">🔮</span>' : ''}
                      <h4 class="card-title" style="font-size:var(--text-base);margin-bottom:0;">${Utils.escapeHtml(journal.title)}</h4>
                    </div>
                    <div class="flex gap-xs">
                      <button class="btn btn-ghost btn-icon btn-sm" data-edit="${journal.id}" title="Sửa">✏️</button>
                      <button class="btn btn-ghost btn-icon btn-sm" data-delete="${journal.id}" title="Xóa">🗑️</button>
                    </div>
                  </div>
                  ${journal.prompt ? `<p class="text-xs text-muted mb-sm" style="font-style:italic;">💭 ${Utils.escapeHtml(journal.prompt)}</p>` : ''}
                  <p class="card-text" style="line-height:1.8;">${Utils.escapeHtml(journal.content)}</p>
                  <div class="tags-container">
                    ${Utils.renderTags(journal.tags || [])}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state stagger-item">
            <div class="empty-state-icon">📓</div>
            <div class="empty-state-title">Chưa có nhật ký nào</div>
            <div class="empty-state-text">Hãy bắt đầu viết nhật ký phản tư để hiểu rõ hơn về bản thân.</div>
            <button class="btn btn-primary" id="btn-add-journal-empty">+ Viết nhật ký đầu tiên</button>
          </div>
        `}
      `;

      // Bind events
      container.querySelector('#btn-add-journal')?.addEventListener('click', () => showJournalForm());
      container.querySelector('#btn-add-journal-empty')?.addEventListener('click', () => showJournalForm());
      container.querySelector('#btn-write-from-prompt')?.addEventListener('click', () => showJournalForm(null, dailyPrompt));

      container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const journal = CRUD.getById('journals', btn.dataset.edit);
          if (journal) showJournalForm(journal);
        });
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Bạn có chắc muốn xóa nhật ký này?')) {
            CRUD.delete('journals', btn.dataset.delete);
            Toast.show('Đã xóa nhật ký', 'success');
            render();
            if (window.updateBadges) updateBadges();
          }
        });
      });
    }

    function showJournalForm(existing = null, prompt = null) {
      const moods = [
        '🔥 Hỏa (Bức bối/Áp lực)', 
        '💧 Thủy (Buồn bã/Trầm ngâm)', 
        '⛰️ Thổ (Bình ổn/An toàn)', 
        '⚔️ Kim (Sắc bén/Lý trí)', 
        '🌳 Mộc (Hào hứng/Sáng tạo)',
        '😶 Trung tính'
      ];

      const overlay = Modal.show(`
        ${prompt ? `
          <div class="card card-highlight mb-md" style="padding:var(--space-md);">
            <p class="text-sm" style="font-style:italic;color:var(--accent-primary);">💭 "${prompt}"</p>
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Tiêu đề *</label>
          <input class="form-input" id="journal-title" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Tiêu đề nhật ký...">
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung *</label>
          <textarea class="form-textarea" id="journal-content" style="min-height:180px;" placeholder="Viết suy nghĩ, cảm xúc, trải nghiệm...">${existing ? Utils.escapeHtml(existing.content) : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tâm trạng</label>
          <select class="form-select" id="journal-mood">
            ${moods.map(m => `<option value="${m}" ${existing?.mood === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (cách nhau bởi dấu phẩy)</label>
          <input class="form-input" id="journal-tags" value="${existing?.tags ? existing.tags.join(', ') : ''}" placeholder="suy-ngẫm, mục-tiêu...">
        </div>
      `, {
        title: existing ? 'Sửa nhật ký' : '📓 Viết nhật ký mới',
        footer: `
          <button class="btn" onclick="App.Modal.close()">Hủy</button>
          <button class="btn btn-primary" id="btn-save-journal">💾 Lưu</button>
        `
      });

      overlay.querySelector('#btn-save-journal').addEventListener('click', () => {
        const title = overlay.querySelector('#journal-title').value.trim();
        const content = overlay.querySelector('#journal-content').value.trim();
        const mood = overlay.querySelector('#journal-mood').value;
        const tags = overlay.querySelector('#journal-tags').value.split(',').map(t => t.trim()).filter(Boolean);

        if (!title || !content) {
          Toast.show('Vui lòng nhập tiêu đề và nội dung', 'error');
          return;
        }

        const data = { title, content, mood, tags, prompt: prompt || existing?.prompt || '' };

        if (existing) {
          CRUD.update('journals', existing.id, data);
          Toast.show('Đã cập nhật nhật ký', 'success');
        } else {
          CRUD.create('journals', data);
          Toast.show('Đã lưu nhật ký', 'success');
        }

        Modal.close(overlay);
        render();
        if (window.updateBadges) updateBadges();
      });
    }

    render();
  }

  window.renderJournal = renderJournal;
})();
