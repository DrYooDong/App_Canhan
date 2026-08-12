// ============================================
// NỘI TÂM — Tàng Kinh Các (Dictionary / Knowledge Base Component)
// Hiển thị tri thức chuyên sâu: 14 Chính Tinh, Cổ Tịch, Hôn Nhân
// ============================================

(function () {
  'use strict';

  // State
  let currentCategory = 'stars'; // 'stars' | 'classics' | 'marriage' | 'patterns' | 'famous'
  let currentSelection = null;

  function getListData(category) {
    if (category === 'stars') {
      return window.ZiweiStarKnowledge ? Object.keys(window.ZiweiStarKnowledge.STAR_DETAILS) : [];
    } else if (category === 'classics') {
      return window.ZiweiClassics ? window.ZiweiClassics.BOOKS.map(b => b.id) : [];
    } else if (category === 'marriage') {
      return window.ZiweiMarriageKnowledge ? Object.keys(window.ZiweiMarriageKnowledge.STAR_IN_FUQI) : [];
    } else if (category === 'patterns') {
      return window.ZiweiPatterns && window.ZiweiPatterns.PATTERN_LIST ? window.ZiweiPatterns.PATTERN_LIST.map(p => p.id) : [];
    } else if (category === 'famous') {
      return window.ZiweiFamous ? window.ZiweiFamous.getFamousList().map(f => f.id) : [];
    }
    return [];
  }

  function getTitle(category, id) {
    if (category === 'stars' || category === 'marriage') return id;
    if (category === 'classics') {
      const b = window.ZiweiClassics.BOOKS.find(x => x.id === id);
      return b ? b.title : id;
    }
    if (category === 'patterns') {
      const p = window.ZiweiPatterns.PATTERN_LIST.find(x => x.id === id);
      return p ? p.name : id;
    }
    if (category === 'famous') {
      const f = window.ZiweiFamous.getFamousById(id);
      return f ? f.name : id;
    }
    return id;
  }

  function renderDictionary(container) {
    // Basic Layout Structure
    container.innerHTML = `
      <div class="dictionary-container animate-fade-in" style="display:flex; flex-direction:column; height: 100%; min-height: 80vh;">
        <!-- Header / Category Tabs -->
        <div class="tabs-header" style="justify-content: flex-start; gap: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; overflow-x: auto;">
          <button class="btn btn-tab dict-cat-btn ${currentCategory === 'stars' ? 'active' : ''}" data-cat="stars" style="padding: 0.5rem 1rem; white-space: nowrap;"><span>🌟</span> 14 Chính Tinh</button>
          <button class="btn btn-tab dict-cat-btn ${currentCategory === 'classics' ? 'active' : ''}" data-cat="classics" style="padding: 0.5rem 1rem; white-space: nowrap;"><span>📜</span> Cổ Tịch Tử Vi</button>
          <button class="btn btn-tab dict-cat-btn ${currentCategory === 'marriage' ? 'active' : ''}" data-cat="marriage" style="padding: 0.5rem 1rem; white-space: nowrap;"><span>❤️</span> Luận Hôn Nhân</button>
          <button class="btn btn-tab dict-cat-btn ${currentCategory === 'patterns' ? 'active' : ''}" data-cat="patterns" style="padding: 0.5rem 1rem; white-space: nowrap;"><span>🎯</span> Cách Cục</button>
          <button class="btn btn-tab dict-cat-btn ${currentCategory === 'famous' ? 'active' : ''}" data-cat="famous" style="padding: 0.5rem 1rem; white-space: nowrap;"><span>👑</span> Lá Số Danh Nhân</button>
        </div>

        <!-- 2-Column Main Content -->
        <div class="dict-main-content" style="display:flex; gap: 1.5rem; flex: 1; min-height: 0;">
          <!-- Left: List -->
          <div class="dict-sidebar custom-scrollbar" style="width: 250px; border-right: 1px solid var(--border-color); padding-right: 1rem; overflow-y: auto; max-height: calc(100vh - 250px);">
            <div id="dict-list"></div>
          </div>
          
          <!-- Right: Details -->
          <div class="dict-details custom-scrollbar" style="flex: 1; overflow-y: auto; max-height: calc(100vh - 250px); padding-right: 1rem; padding-left: 0.5rem;">
            <div id="dict-content-pane" style="min-height: 100%; border: none; box-shadow: none; background: transparent;">
              <div class="text-center text-muted" style="margin-top: 5rem;">
                <span style="font-size: 3rem; opacity: 0.3;">☯</span>
                <p>Xin chọn một mục bên trái để đọc luận giải</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const catButtons = container.querySelectorAll('.dict-cat-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--text-secondary)';
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--accent-muted)';
        btn.style.color = 'var(--accent-primary)';
        btn.style.borderColor = 'var(--border-accent)';
        
        currentCategory = btn.dataset.cat;
        
        // Pick first item by default
        const listData = getListData(currentCategory);
        currentSelection = listData.length > 0 ? listData[0] : null;
        
        updateSidebar(container);
        updateContentPane(container);
      });
    });

    // Initial render
    const listData = getListData(currentCategory);
    if (!currentSelection && listData.length > 0) {
      currentSelection = listData[0];
    }
    updateSidebar(container);
    updateContentPane(container);
  }

  function updateSidebar(container) {
    const listContainer = container.querySelector('#dict-list');
    const items = getListData(currentCategory);
    
    if (!items || items.length === 0) {
      listContainer.innerHTML = `<div class="text-muted text-sm p-md">Chưa có dữ liệu. Hãy chắc chắn đã load các file thư viện data.</div>`;
      return;
    }

    listContainer.innerHTML = items.map(id => {
      const isSelected = id === currentSelection;
      const title = getTitle(currentCategory, id);
      return `
        <div class="dict-list-item ${isSelected ? 'active' : ''}" 
             data-id="${id}" 
             style="padding: 0.75rem 1rem; cursor: pointer; border-radius: var(--radius-md); margin-bottom: 0.25rem; transition: all 0.2s;
                    ${isSelected ? 'background: var(--surface-2); color: var(--accent-gold); font-weight: bold;' : 'color: var(--text-primary);'}"
             onmouseover="if(!this.classList.contains('active')) this.style.background='var(--surface-1)'"
             onmouseout="if(!this.classList.contains('active')) this.style.background='transparent'">
          ${title}
        </div>
      `;
    }).join('');

    const listEls = listContainer.querySelectorAll('.dict-list-item');
    listEls.forEach(el => {
      el.addEventListener('click', () => {
        currentSelection = el.dataset.id;
        updateSidebar(container); // to update active states
        updateContentPane(container);
      });
    });
  }

  function updateContentPane(container) {
    const pane = container.querySelector('#dict-content-pane');
    if (!currentSelection) {
       pane.innerHTML = `<div class="text-center text-muted" style="margin-top: 5rem;">Xin chọn một mục bên trái để đọc luận giải</div>`;
       return;
    }

    let html = '';
    const Utils = window.App?.Utils || { escapeHtml: (s) => s };

    if (currentCategory === 'stars' && window.ZiweiStarKnowledge) {
      const data = window.ZiweiStarKnowledge.STAR_DETAILS[currentSelection];
      if (data) {
        html = `
          <h2 style="color: var(--accent-gold); margin-bottom: 0.5rem; font-size: 2rem;">Sao ${currentSelection}</h2>
          <div style="background: rgba(234, 179, 8, 0.1); border-left: 4px solid var(--accent-gold); padding: 1rem; margin-bottom: 1.5rem; font-style: italic; color: var(--text-secondary);">
            ${data.classical || ''}
          </div>
          
          <div class="grid-2" style="margin-bottom: 1.5rem; gap: 1rem;">
            <div class="card" style="padding: 1rem; border: 1px solid var(--border-color);">
              <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">Cung Vị Đẹp Nhất</div>
              <div style="font-weight: bold; color: var(--accent-primary);">${data.bestPalace}</div>
            </div>
            <div class="card" style="padding: 1rem; border: 1px solid var(--border-color);">
              <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">Cung Vị Yếu Nhất</div>
              <div style="font-weight: bold; color: var(--danger-color, #ef4444);">${data.worstPalace}</div>
            </div>
          </div>

          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Lời Bàn của Ni Hải Hạ (Ni Haixia)</h3>
          <p style="line-height: 1.8; margin-bottom: 2rem; color: var(--text-secondary);">${data.niHaixia}</p>

          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Các Lĩnh Vực Đời Sống</h3>
          <ul style="line-height: 1.8; color: var(--text-secondary); list-style: none; padding-left: 0;">
            <li style="margin-bottom: 0.75rem;"><strong style="color:var(--text-primary);">💼 Sự nghiệp:</strong> ${data.career}</li>
            <li style="margin-bottom: 0.75rem;"><strong style="color:var(--text-primary);">💰 Tài lộc:</strong> ${data.wealth}</li>
            <li style="margin-bottom: 0.75rem;"><strong style="color:var(--text-primary);">❤️ Tình cảm:</strong> ${data.relationship}</li>
            <li style="margin-bottom: 0.75rem;"><strong style="color:var(--text-primary);">🩺 Sức khỏe:</strong> ${data.health}</li>
          </ul>
        `;
      }
    } 
    else if (currentCategory === 'classics' && window.ZiweiClassics) {
      const data = window.ZiweiClassics.BOOKS.find(b => b.id === currentSelection);
      if (data) {
        html = `
          <h2 style="color: var(--accent-gold); margin-bottom: 0.5rem; font-size: 2rem;">${data.title}</h2>
          <div style="display: flex; gap: 1rem; color: var(--text-muted); margin-bottom: 1.5rem; font-size: var(--text-sm);">
            <span><i class="icon">👤</i> Tác giả: ${data.author}</span>
            <span><i class="icon">📜</i> Triều đại: ${data.dynasty}</span>
          </div>
          <div class="card" style="background: var(--surface-1); padding: 1.5rem; margin-bottom: 2rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
            <strong style="color: var(--text-primary);">Lời Tựa:</strong> ${data.intro}
          </div>
          
          <div class="chapters-container">
            ${data.chapters.map(chap => `
              <h3 style="color: var(--accent-primary); border-bottom: 1px solid var(--border-accent); padding-bottom: 0.5rem; margin-top: 2rem; margin-bottom: 1rem; font-size: 1.5rem;">
                ${chap.title}
              </h3>
              ${chap.paragraphs.map(p => `
                <p style="line-height: 2; margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-secondary); letter-spacing: 0.02em;">
                  ${p}
                </p>
              `).join('')}
            `).join('')}
          </div>
        `;
      }
    }
    else if (currentCategory === 'marriage' && window.ZiweiMarriageKnowledge) {
      const data = window.ZiweiMarriageKnowledge.STAR_IN_FUQI[currentSelection];
      if (data) {
        html = `
          <h2 style="color: var(--danger-color, #ef4444); margin-bottom: 0.5rem; font-size: 2rem;">Phu Thê có ${currentSelection}</h2>
          <div class="card" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger-color, #ef4444); padding: 1rem; margin-bottom: 1.5rem;">
            <p style="font-weight: bold; color: var(--text-primary); margin: 0;">${data.summary}</p>
          </div>
          
          <div class="grid-2" style="margin-bottom: 1.5rem; gap: 1rem;">
            <div class="card" style="padding: 1.5rem; border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05);">
              <div style="font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">✅ Trường hợp Cát (Tốt)</div>
              <p style="color: var(--text-secondary); line-height: 1.6;">${data.good}</p>
            </div>
            <div class="card" style="padding: 1.5rem; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">
              <div style="font-weight: bold; color: #ef4444; margin-bottom: 0.5rem;">⚠️ Trường hợp Hung (Xấu)</div>
              <p style="color: var(--text-secondary); line-height: 1.6;">${data.bad}</p>
            </div>
          </div>

          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Chân Dung Người Bạn Đời</h3>
          <p style="line-height: 1.8; margin-bottom: 1.5rem; color: var(--text-secondary);">${data.spouse_traits}</p>

          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Thời Điểm Kết Hôn Tối Ưu</h3>
          <p style="line-height: 1.8; margin-bottom: 1.5rem; color: var(--accent-primary);">${data.timing}</p>

          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color);">
            <strong style="color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem;">Trích dẫn (Ni Hải Hạ)</strong>
            <p style="font-style: italic; color: var(--text-secondary); margin-top: 0.5rem;">"${data.niQuote}"</p>
          </div>
        `;
      }
    }
    else if (currentCategory === 'patterns' && window.ZiweiPatterns) {
      const data = window.ZiweiPatterns.PATTERN_LIST.find(p => p.id === currentSelection);
      if (data) {
        html = `
          <h2 style="color: var(--accent-gold); margin-bottom: 0.5rem; font-size: 2rem;">${data.name}</h2>
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid var(--accent-primary); padding: 1rem; margin-bottom: 1.5rem; font-style: italic; color: var(--text-secondary);">
            <strong style="color: var(--text-primary);">Nguồn:</strong> ${data.source}
          </div>
          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Luận Giải</h3>
          <p style="line-height: 1.8; margin-bottom: 2rem; color: var(--text-secondary); font-size: 1.1rem;">${data.description}</p>
        `;
      }
    }
    else if (currentCategory === 'famous' && window.ZiweiFamous) {
      const data = window.ZiweiFamous.getFamousById(currentSelection);
      if (data) {
        html = `
          <h2 style="color: var(--accent-primary); margin-bottom: 0.5rem; font-size: 2rem;">${data.name}</h2>
          <div style="display: flex; gap: 1rem; color: var(--text-muted); margin-bottom: 1.5rem; font-size: var(--text-sm);">
            <span class="tag tag-info">${data.category}</span>
            <span><i class="icon">👤</i> ${data.gender}</span>
            <span><i class="icon">🎂</i> Sinh năm: ${data.year}</span>
          </div>
          <div class="card" style="background: var(--surface-1); padding: 1.5rem; margin-bottom: 2rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-gold);">
            <strong style="color: var(--text-primary);">Thân Thế:</strong> ${data.description}
          </div>
          
          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">Điểm Sáng Lá Số</h3>
          <p style="line-height: 1.8; margin-bottom: 2rem; color: var(--text-secondary); font-size: 1.1rem;">${data.notable}</p>
          
          <div class="card text-center" style="padding: 2rem;">
            <p style="color: var(--text-muted); margin-bottom: 1rem;">(Bạn có thể tích hợp engine Tử Vi vào đây để vẽ lá số chi tiết cho danh nhân này)</p>
            <button class="btn btn-primary" onclick="alert('Tính năng xem chi tiết đồ hình tử vi đang được phát triển!')">Xem Lá Số Chi Tiết</button>
          </div>
        `;
      }
    }

    pane.innerHTML = html;
  }

  window.renderDictionary = renderDictionary;

  // Global Interactive Star Archetype Modal
  window.showStarArchetypeModal = function(starName) {
    if (!starName || typeof starName !== 'string') return;

    // Clean name: e.g. "Tử Vi [M]" -> "Tử Vi"
    const cleanName = starName.replace(/\[.*?\]|\(.*?\)/g, '').trim();
    const dict = window.ZiweiDictionary || {};
    const starData = dict[cleanName] || dict[starName] || null;

    if (!starData) {
      if (window.App && window.App.Toast) {
        window.App.Toast.show(`Đang cập nhật từ điển cho sao ${cleanName}`, 'info');
      }
      return;
    }

    const Modal = window.App ? window.App.Modal : null;
    if (!Modal) return;

    Modal.show(`
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Header badge -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
          <div>
            <div style="font-size:0.7rem; color:var(--accent-primary); font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">${starData.type || 'Tinh Tú'}</div>
            <h2 style="font-family:'Cinzel',serif; font-size:1.6rem; color:#fff; margin:2px 0 0;">${cleanName}</h2>
          </div>
          <span style="font-size:0.75rem; background:rgba(124,58,237,0.2); color:#c084fc; border:1px solid rgba(124,58,237,0.4); padding:4px 12px; border-radius:20px; font-weight:700;">
            Nội Tâm Dictionary
          </span>
        </div>

        <!-- Description -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:12px; padding:14px;">
          <div style="font-size:0.9rem; font-weight:700; color:var(--accent-gold); margin-bottom:6px;">${starData.short || ''}</div>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin:0;">${starData.full || ''}</p>
        </div>

        ${starData.archetype ? `
          <!-- Jungian Archetype -->
          <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.25); border-radius:12px; padding:14px;">
            <div style="font-size:0.7rem; color:#a855f7; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">🎭 NGUYÊN MẪU JUNGIAN (ARCHETYPE)</div>
            <div style="font-weight:700; font-size:0.95rem; color:#fff;">${starData.archetype}</div>
          </div>
        ` : ''}

        ${starData.synchronicity ? `
          <!-- Synchronicity Message -->
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:12px; padding:14px;">
            <div style="font-size:0.7rem; color:#f59e0b; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">⚡ THÔNG ĐIỆP ĐỒNG BỘ (SYNCHRONICITY)</div>
            <div style="font-size:0.85rem; color:var(--text-primary); line-height:1.5;">${starData.synchronicity}</div>
          </div>
        ` : ''}
      </div>
    `, {
      title: `🔮 Chi Tiết Sao: ${cleanName}`,
      footer: `<button class="btn btn-primary" onclick="App.Modal.close()">Đóng</button>`
    });
  };
})();
