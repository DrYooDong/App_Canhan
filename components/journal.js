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

      const AL = window.AstrologyLogic;
      let luuNienInfo = {
        luuNienYear: 2026,
        canChiYear: 'Bính Thìn',
        luuPalaceName: 'Thiên Di',
        luuChi: 'Ngọ',
        siHuaList: 'Bính Đồng Cơ Xương Liêm (Đồng Hóa Lộc, Cơ Hóa Quyền, Xương Hóa Khoa, Liêm Hóa Kỵ)',
        reflectionPrompt: 'Năm 2026 Lưu Niên cư Thiên Di gặp Hóa Lộc: Thích hợp ngoại giao, dịch chuyển và mở rộng mạng lưới liên kết.'
      };

      if (AL && AL.TuViEngine) {
        try {
          const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : null;
          const tuViChart = userProfile ? AL.TuViEngine.calculateTuViChart({
            day: userProfile.day || 1, month: userProfile.month || 1, year: userProfile.year || 1990, hour: (userProfile.hour !== undefined && userProfile.hour !== null ? userProfile.hour : 12), minute: userProfile.minute || 0,
            gender: userProfile.gender || 'Nam', canNam: userProfile.canNam || 'Canh', chiNam: userProfile.chiNam || 'Thìn'
          }) : AL.TuViEngine.calculateTuViChart({
            day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear(), hour: 10, minute: 0,
            gender: 'Nam', canNam: 'Canh', chiNam: 'Thìn'
          });
          if (tuViChart && tuViChart.palaces) {
            const thienDi = tuViChart.palaces.find(p => p.id === 'thien-di' || p.name === 'Thiên Di');
            if (thienDi) {
              luuNienInfo.luuPalaceName = thienDi.name;
              luuNienInfo.luuChi = thienDi.chi;
            }
          }
        } catch (e) {}
      }

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="page-toolbar">
            <div>
              <h1 class="page-title">Nhật ký Năng lượng & Phản Tư Tử Vi</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Ghi lại trải nghiệm và cảm xúc theo Ngũ Hành & Lưu Niên Tử Vi</p>
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

        <!-- Ziwei Yearly Reflection Widget -->
        <div class="card tuvi-card stagger-item animate-fade-in" style="margin-bottom:var(--space-xl); background:linear-gradient(135deg, var(--bg-card), var(--bg-surface)); border:1px solid var(--border-accent); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">📜</span>
              <div>
                <h3 style="font-family:'Cinzel',serif; margin:0; color:var(--accent-primary); font-size:1.05rem;">
                  Phản Tư Theo Nhịp Lưu Niên Tử Vi (Năm ${luuNienInfo.luuNienYear} ${luuNienInfo.canChiYear})
                </h3>
                <p style="margin:2px 0 0 0; color:var(--text-tertiary); font-size:0.8rem;">
                  Gắn thẻ nhật ký theo Lưu Niên để soi chiếu mô thức thăng trầm cuộc đời
                </p>
              </div>
            </div>
            <button class="btn btn-sm" id="btn-quick-tag-tuvi" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:600; border-radius:20px; padding:4px 14px; border:1px solid var(--border-accent);">
              ✍️ Viết Nhật Ký Tag #LuuNienTuVi
            </button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Cung Vị Lưu Niên Hiện Tại</div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--accent-gold); margin:3px 0;">Cung <span class="palace-name" style="cursor:pointer; text-decoration:underline dashed;">${luuNienInfo.luuPalaceName}</span> [Chi ${luuNienInfo.luuChi}]</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">Mặt trận chính của vận trình năm nay</div>
            </div>

            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Tứ Hóa Chiếu Lưu Niên</div>
              <div style="font-size:0.78rem; font-weight:600; color:var(--accent-primary); margin:3px 0;">${luuNienInfo.siHuaList}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">Dấu ấn năng lượng năm Bính</div>
            </div>

            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color);">
              <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Gợi Ý Phản Tư Lưu Niên</div>
              <div style="font-size:0.78rem; color:var(--text-primary); margin-top:3px; line-height:1.4;">${luuNienInfo.reflectionPrompt}</div>
            </div>
          </div>
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
      container.querySelector('#btn-quick-tag-tuvi')?.addEventListener('click', () => {
        showJournalForm(null, luuNienInfo.reflectionPrompt, ['#LuuNienTuVi', '#TuVi', '#BinhThin2026']);
      });

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

    function showJournalForm(existing = null, prompt = null, defaultTags = []) {
      const moods = [
        '🔥 Hỏa (Bức bối/Áp lực)', 
        '💧 Thủy (Buồn bã/Trầm ngâm)', 
        '⛰️ Thổ (Bình ổn/An toàn)', 
        '⚔️ Kim (Sắc bén/Lý trí)', 
        '🌳 Mộc (Hào hứng/Sáng tạo)',
        '😶 Trung tính'
      ];

      const initialTagsStr = existing?.tags ? existing.tags.join(', ') : (defaultTags.length > 0 ? defaultTags.join(', ') : '');

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
          <input class="form-input" id="journal-tags" value="${initialTagsStr}" placeholder="suy-ngẫm, #LuuNienTuVi...">
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
