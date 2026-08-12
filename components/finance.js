// ============================================
// NỘI TÂM — Finance Component (#2)
// Quản Trị Tài Chính Ngũ Hành & Timing Đầu Tư
// ============================================

(function () {
  'use strict';

  function getStoredTransactions() {
    try {
      const stored = localStorage.getItem('noitam_finance_txs');
      return stored ? JSON.parse(stored) : [
        { id: 1, type: 'INCOME', amount: 20000000, category: 'Lương & Thưởng', element: 'Kim', date: '2026-07-20', note: 'Thu nhập chuyên môn' },
        { id: 2, type: 'EXPENSE', amount: 3500000, category: 'Khóa Học & Tri Thức', element: 'Mộc', date: '2026-07-21', note: 'Mua sách & học tập' },
        { id: 3, type: 'EXPENSE', amount: 5000000, category: 'Bất Động Sản / Đất Đai', element: 'Thổ', date: '2026-07-22', note: 'Tích lũy quỹ tài sản' }
      ];
    } catch (e) {
      return [];
    }
  }

  function saveTransactions(txs) {
    try {
      localStorage.setItem('noitam_finance_txs', JSON.stringify(txs));
    } catch (e) {}
  }

  let activeFinanceTab = 'timing'; // 'timing' | 'retroverify'

  function renderFinance(container, params) {
    if (params && params[0]) {
      if (['timing', 'retroverify'].includes(params[0])) {
        activeFinanceTab = params[0];
      }
    }

    container.innerHTML = `
      <div class="finance-hub animate-fade-in">
        <div class="tabs-header">
          <button class="btn btn-tab ${activeFinanceTab === 'timing' ? 'active' : ''}" data-tab="timing"><span>💰</span> Timing Đầu Tư Ngũ Hành</button>
          <button class="btn btn-tab ${activeFinanceTab === 'retroverify' ? 'active' : ''}" data-tab="retroverify"><span>📊</span> Đối Chiếu Dự Đoán vs Thực Tế</button>
        </div>

        <div id="finance-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#finance-sub-content');

    function loadSubTab(tab) {
      activeFinanceTab = tab;
      container.querySelectorAll('.btn-tab').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
        btn.style.background = isCurrent ? 'var(--accent-muted)' : 'transparent';
        btn.style.color = isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)';
        btn.style.borderColor = isCurrent ? 'var(--border-accent)' : 'transparent';
      });

      subContent.innerHTML = '';
      if (tab === 'retroverify' && window.renderRetroVerify) {
        window.renderRetroVerify(subContent);
      } else {
        renderTimingContent(subContent);
      }
    }

    container.querySelectorAll('.btn-tab').forEach(btn => {
      btn.addEventListener('click', () => loadSubTab(btn.dataset.tab));
    });

    loadSubTab(activeFinanceTab);
  }

  function renderTimingContent(container) {
    const AL = window.AstrologyLogic;
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };
    const today = new Date();

    let dailyTransit = null;
    let dailyRemedy = null;
    if (AL && typeof AL.calculateDailyTransit === 'function') {
        dailyTransit = AL.calculateDailyTransit(today, userProfile);
        dailyRemedy = AL.getDailyRemedy(dailyTransit, userProfile);
    }

    let wealthEval = (AL && typeof AL.evaluateWealthDay === 'function') ? AL.evaluateWealthDay(today, userProfile) : {
      score: 88,
      rating: 'Đại Cát',
      wealthDirection: 'Đông Nam',
      star: 'Thần Tài',
      recommendation: 'Cơ hội đầu tư thuận lợi, cần nắm bắt thời cơ.'
    };
    wealthEval.wealthDirection = (dailyRemedy && dailyRemedy.direction) ? dailyRemedy.direction : (wealthEval.wealthDirection || 'Đông Nam');
    wealthEval.star = wealthEval.star || 'Thần Tài';
    wealthEval.recommendation = (dailyRemedy && dailyRemedy.isBadDay) ? dailyRemedy.alertMsg : (wealthEval.recommendation || wealthEval.message || 'Cơ hội đầu tư thuận lợi, cần nắm bắt thời cơ.');
    
    if (dailyRemedy && dailyRemedy.isBadDay) {
        wealthEval.rating = 'Cảnh Báo Đỏ';
        wealthEval.score = Math.min(wealthEval.score, 30);
    }

    // Ziwei Wealth & Career Analysis Engine
    let ziweiWealth = {
      taiBachPalace: 'Thân',
      quanLocPalace: 'Thìn',
      wealthStars: 'Vũ Khúc, Thiên Tướng',
      careerStars: 'Tử Vi, Thiên Phủ',
      patterns: [],
      strategyMode: 'Tấn Công & Tích Lũy',
      riskScore: 'Thấp',
      advice: 'Cung Tài Bạch vượng khí, thuận lợi giải ngân đầu tư trung & dài hạn.'
    };

    if (AL && AL.TuViEngine) {
      try {
        const tuViChart = AL.TuViEngine.calculateTuViChart({
          day: userProfile.day || 1, month: userProfile.month || 1, year: userProfile.year || 1990, hour: (userProfile.hour !== undefined && userProfile.hour !== null ? userProfile.hour : 0), minute: userProfile.minute ?? 0,
          gender: userProfile.gender || 'Nam', canNam: userProfile.canNam || 'Canh', chiNam: userProfile.chiNam || 'Thìn'
        });
        if (tuViChart && tuViChart.palaces) {
          const taiPalace = tuViChart.palaces.find(p => p.id === 'tai-bach' || p.name === 'Tài Bạch');
          const quanPalace = tuViChart.palaces.find(p => p.id === 'quan-loc' || p.name === 'Quan Lộc');
          if (taiPalace) {
            ziweiWealth.taiBachPalace = taiPalace.chi || 'Thân';
            if (taiPalace.mainStars && taiPalace.mainStars.length > 0) {
              ziweiWealth.wealthStars = taiPalace.mainStars.join(', ');
            }
          }
          if (quanPalace) {
            ziweiWealth.quanLocPalace = quanPalace.chi || 'Thìn';
            if (quanPalace.mainStars && quanPalace.mainStars.length > 0) {
              ziweiWealth.careerStars = quanPalace.mainStars.join(', ');
            }
          }
        }
        if (window.ZiweiPatterns && tuViChart) {
          const detected = window.ZiweiPatterns.detectPatterns(tuViChart);
          if (detected && detected.length > 0) {
            ziweiWealth.patterns = detected.filter(p => 
              p.name.includes('Tài') || p.name.includes('Lộc') || p.name.includes('Phú') || 
              p.name.includes('Quyền') || p.name.includes('Tham') || p.level === 'excellent' || p.level === 'good'
            );
            if (ziweiWealth.patterns.length === 0) ziweiWealth.patterns = detected;
          }
        }
      } catch (err) {
        console.warn("Finance Ziwei Wealth calculation error:", err);
      }
    }

    let txs = getStoredTransactions();

    function renderUI() {
      // Calculate Element Spend Breakdown
      const elementTotals = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
      txs.forEach(t => {
        if (t.type === 'EXPENSE' && elementTotals[t.element] !== undefined) {
          elementTotals[t.element] += t.amount;
        }
      });

      const totalExpense = Object.values(elementTotals).reduce((a, b) => a + b, 0) || 1;

      container.innerHTML = `
        <div class="finance-module animate-fade-in" style="display:flex; flex-direction:column; gap:24px;">
          
          <!-- Banner Header -->
          <div class="card tuvi-card" style="background:linear-gradient(135deg, rgba(20, 30, 55, 0.95), rgba(10, 15, 30, 0.95)); border:1px solid var(--border-accent); padding:24px; border-radius:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.8rem;">💰</span>
                  <div>
                    <h2 style="font-family:'Cinzel', var(--font-body); margin:0; color:var(--accent-primary); font-size:1.5rem;">
                      Quản Trị Tài Chính Ngũ Hành & Timing Đầu Tư
                    </h2>
                    <p style="margin:4px 0 0 0; color:var(--text-secondary); font-size:0.9rem;">
                      Điều phối dòng tiền & Chọn Ngày Cát Tường giải ngân đầu tư
                    </p>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); border:1px solid var(--border-accent); padding:6px 14px; border-radius:20px; font-weight:600;">
                  Hướng Tài Thần Hôm Nay: ${wealthEval.wealthDirection}
                </span>
              </div>
            </div>
          </div>

          <!-- Widget Phân Tích Cát Hung Tử Vi Tài Bạch & Quan Lộc -->
          <div class="card tuvi-card" style="padding:20px; border-radius:16px; background:linear-gradient(135deg, var(--bg-card), var(--bg-surface)); border:1px solid var(--border-accent);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.4rem;">🔮</span>
                <div>
                  <h3 style="font-family:'Cinzel', var(--font-body); margin:0; color:var(--accent-primary); font-size:1.15rem;">
                    Cát Hung Tử Vi Tài Bạch & Chiến Lược Đầu Tư (Ni Hải Hạ)
                  </h3>
                  <p style="margin:2px 0 0 0; color:var(--text-tertiary); font-size:0.82rem;">
                    Soi chiếu cung Tài Bạch (cư ${ziweiWealth.taiBachPalace}) & Quan Lộc (cư ${ziweiWealth.quanLocPalace}) để điều phối dòng tiền
                  </p>
                </div>
              </div>
              <button class="btn btn-tab btn-sm" onclick="App.Router.navigate('astrology')" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:600; border-radius:20px; padding:4px 14px; border:1px solid var(--border-accent);">
                🔮 Xem Lá Số Tử Vi ➔
              </button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
              <div style="padding:12px; border-radius:10px; background:var(--bg-surface); border:1px solid var(--border-color);">
                <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Cung Tài Bạch (Tài Sản)</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-gold); margin:4px 0;">Cư <span class="palace-name" style="cursor:pointer; text-decoration:underline dashed;">${ziweiWealth.taiBachPalace}</span> · <span class="main-star" style="cursor:pointer; text-decoration:underline dashed;">${ziweiWealth.wealthStars}</span></div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">Trực tiếp quyết định sức hút tài lộc</div>
              </div>

              <div style="padding:12px; border-radius:10px; background:var(--bg-surface); border:1px solid var(--border-color);">
                <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Cung Quan Lộc (Sự Nghiệp)</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary); margin:4px 0;">Cư <span class="palace-name" style="cursor:pointer; text-decoration:underline dashed;">${ziweiWealth.quanLocPalace}</span> · <span class="main-star" style="cursor:pointer; text-decoration:underline dashed;">${ziweiWealth.careerStars}</span></div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">Quyết định quy mô kinh doanh & vị thế</div>
              </div>

              <div style="padding:12px; border-radius:10px; background:var(--bg-surface); border:1px solid var(--border-color);">
                <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Thống Kê Cách Cục Tài Chính</div>
                <div style="font-weight:700; font-size:0.95rem; color:#10b981; margin:4px 0;">
                  ${ziweiWealth.patterns.length > 0 ? ziweiWealth.patterns[0].name : 'Cơ Nguyệt Đồng Lương Vượng Lộc'}
                </div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${ziweiWealth.patterns.length > 1 ? `Hội tụ +${ziweiWealth.patterns.length - 1} cát cách hỗ trợ` : 'Cách cục tài chính chủ đạo'}</div>
              </div>

              <div style="padding:12px; border-radius:10px; background:var(--bg-surface); border:1px solid var(--border-color);">
                <div style="font-size:0.72rem; color:var(--text-tertiary); font-weight:700; text-transform:uppercase;">Chế Độ Quản Trị Vốn</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-gold); margin:4px 0;">${ziweiWealth.strategyMode}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${ziweiWealth.advice}</div>
              </div>
            </div>
          </div>

          <!-- Wealth Timing & Recommendation Widget -->
          <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:64px; height:64px; border-radius:50%; background:rgba(245, 158, 11, 0.15); border:2px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:800; color:#f59e0b;">
                ${wealthEval.score}
              </div>
              <div>
                <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary);">
                  Chỉ Số Vượng Tài Hôm Nay: <span style="color:#f59e0b;">${wealthEval.rating}</span>
                </div>
                <div style="font-size:0.88rem; color:var(--text-secondary); margin-top:4px;">
                  ${wealthEval.recommendation}
                </div>
              </div>
            </div>

            <button class="btn btn-primary" id="btn-add-tx" style="padding:10px 18px; border-radius:10px; font-weight:600;">
              ➕ Ghi Khoản Thu / Chi
            </button>
          </div>

          <!-- 2 Grid Layout: Element Spend Breakdown & Transaction List -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
            
            <!-- Element Spend Breakdown -->
            <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
              <h3 style="margin-top:0; font-family:'Cinzel', var(--font-body); color:var(--accent-primary); font-size:1.1rem;">
                ⚖️ Phân Bổ Chi Tiêu Ngũ Hành
              </h3>
              
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
                ${[
                  { name: 'Kim (Ngân Hàng, Máy Móc)', key: 'Kim', color: '#9ca3af' },
                  { name: 'Mộc (Giáo Dục, Y Tế)', key: 'Mộc', color: '#10b981' },
                  { name: 'Thủy (Giao Thông, Du Lịch)', key: 'Thủy', color: '#3b82f6' },
                  { name: 'Hỏa (Công Nghệ, Truyền Thông)', key: 'Hỏa', color: '#ef4444' },
                  { name: 'Thổ (Bất Động Sản, Tích Lũy)', key: 'Thổ', color: '#f59e0b' }
                ].map(item => {
                  const amt = elementTotals[item.key] || 0;
                  const pct = Math.round((amt / totalExpense) * 100);
                  return `
                    <div>
                      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                        <span>${item.name}</span>
                        <span style="font-weight:700;">${amt.toLocaleString('vi-VN')} đ (${pct}%)</span>
                      </div>
                      <div style="width:100%; height:8px; background:var(--bg-tertiary); border-radius:4px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:${item.color}; border-radius:4px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Recent Transactions List -->
            <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
              <h3 style="margin-top:0; font-family:'Cinzel', var(--font-body); color:var(--accent-primary); font-size:1.1rem;">
                📋 Lịch Sử Thu Chi Gần Đây
              </h3>

              <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px; max-height:280px; overflow-y:auto;">
                ${txs.length === 0 ? `<p style="color:var(--text-muted);">Chưa có giao dịch nào.</p>` : txs.map(t => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">
                    <div>
                      <div style="font-weight:600; font-size:0.9rem;">${t.note || t.category}</div>
                      <div style="font-size:0.78rem; color:var(--text-muted);">${t.date} • Hành ${t.element}</div>
                    </div>
                    <div style="font-weight:700; font-size:0.95rem; color:${t.type === 'INCOME' ? '#10b981' : '#ef4444'};">
                      ${t.type === 'INCOME' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

        </div>
      `;

      // Modal handle for adding transaction
      const addBtn = container.querySelector('#btn-add-tx');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          App.Modal.show(`
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Loại Giao Dịch</label>
                <select id="tx-type" class="form-select" style="width:100%;">
                  <option value="EXPENSE">Chi Tiêu (-)</option>
                  <option value="INCOME">Thu Nhập (+)</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Số Tiền (VNĐ)</label>
                <input type="number" id="tx-amount" class="form-input" style="width:100%;" placeholder="Nhập số tiền..." value="1000000">
              </div>
              <div>
                <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Ngũ Hành Giao Dịch</label>
                <select id="tx-element" class="form-select" style="width:100%;">
                  <option value="Kim">Kim — Ngân hàng, Trang thiết bị, Máy móc</option>
                  <option value="Mộc">Mộc — Giáo dục, Sách vở, Y tế, Cây trồng</option>
                  <option value="Thủy">Thủy — Giao thông, Đi lại, Du lịch, Thủy sản</option>
                  <option value="Hỏa">Hỏa — Công nghệ, IT, Truyền thông, Điện tử</option>
                  <option value="Thổ">Thổ — Bất động sản, Đất đai, Tích lũy tài sản</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Ghi Chú</label>
                <input type="text" id="tx-note" class="form-input" style="width:100%;" placeholder="Nội dung giao dịch...">
              </div>
            </div>
          `, {
            title: '➕ Thêm Giao Dịch Ngũ Hành',
            footer: `<button class="btn btn-primary" id="btn-save-tx-modal">Lưu Giao Dịch</button>`
          });

          setTimeout(() => {
            document.getElementById('btn-save-tx-modal')?.addEventListener('click', () => {
              const type = document.getElementById('tx-type').value;
              const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
              const element = document.getElementById('tx-element').value;
              const note = document.getElementById('tx-note').value || 'Thu chi cá nhân';

              if (amount <= 0) {
                App.Toast.show('Vui lòng nhập số tiền hợp lệ.', 'error');
                return;
              }

              txs.unshift({
                id: Date.now(),
                type,
                amount,
                element,
                category: note,
                date: new Date().toISOString().split('T')[0],
                note
              });

              saveTransactions(txs);
              App.Modal.close();
              App.Toast.show('Đã lưu giao dịch thành công!', 'success');
              renderUI();
            });
          }, 100);
        });
      }
    }

    renderUI();
  }

  window.renderFinance = renderFinance;
})();
