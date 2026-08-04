// ============================================
// NỘI TÂM — Numerology Component (Số Học Ngày Sinh & Thần Số Học Đông - Tây)
// ============================================

(function() {
  'use strict';

  function renderNumerology(container, params) {
    const { Utils, Toast } = App;
    const AL = window.AstrologyLogic;

    let savedDob = null;
    try {
      if (AL && typeof AL.getUserProfile === 'function') {
        const p = AL.getUserProfile();
        if (p && p.birthDay) {
          savedDob = { day: parseInt(p.birthDay, 10), month: parseInt(p.birthMonth, 10), year: parseInt(p.birthYear, 10) };
        }
      }
      if (!savedDob) {
        savedDob = JSON.parse(localStorage.getItem('noitam_user_dob'));
        if (!savedDob) {
          const chartConfig = JSON.parse(localStorage.getItem('noitam_chart_config'));
          if (chartConfig && chartConfig.day) {
            savedDob = { day: parseInt(chartConfig.day, 10), month: parseInt(chartConfig.month, 10), year: parseInt(chartConfig.year, 10) };
          }
        }
      }
    } catch (e) {}

    const dob = savedDob || { day: 20, month: 4, year: 2000 };

    function getNumerologyResults(d, m, y) {
      if (!AL || !AL.Numerology) return null;
      const numEngine = AL.Numerology;
      const lifePath = numEngine.calculateLifePath(d, m, y);
      const birthdayNum = numEngine.calculateBirthdayNumber(d);
      const attitudeNum = numEngine.calculateAttitudeNumber(d, m);
      const personalYear = numEngine.calculatePersonalYear(d, m, 2026);
      const birthGrid = numEngine.calculateBirthGrid(d, m, y);
      const dict = numEngine.getNumerologyDict();
      const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };
      const synergy = numEngine.getEasternWesternSynergy(lifePath, userProfile);

      return {
        lifePath,
        birthdayNum,
        attitudeNum,
        personalYear,
        birthGrid,
        lifePathInfo: dict[lifePath] || dict[8],
        personalYearInfo: dict[personalYear] || dict[8],
        dict,
        synergy
      };
    }

    function render() {
      const res = getNumerologyResults(dob.day, dob.month, dob.year);
      if (!res) {
        container.innerHTML = `<div class="p-lg text-center">Đang nạp dữ liệu thuật toán Thần Số Học...</div>`;
        return;
      }

      const lp = res.lifePathInfo;
      const py = res.personalYearInfo;

      container.innerHTML = `
        <div class="numerology-hub animate-fade-in" style="max-width: 1080px; margin: 0 auto;">
          <!-- Header Section -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem; color:var(--accent-primary); letter-spacing:0.15em; font-weight:700; text-transform:uppercase; margin-bottom:4px;">
                <span>🔢 THẦN SỐ HỌC ĐÔNG — TÂY</span>
              </div>
              <h1 class="page-title" style="margin-bottom:4px;">Số Học Ngày Sinh & Bản Đồ Tần Số Bản Thân</h1>
              <p class="page-subtitle" style="margin-bottom:0;">Khám phá Số Chủ Đạo, Chu Kỳ Năm Cá Nhân 2026 và Ma Trận Pythagoras Ngày Sinh</p>
            </div>

            <!-- Date Selector Panel -->
            <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px 14px; border-radius:var(--radius-lg); display:flex; align-items:center; gap:10px; box-shadow:var(--shadow-sm);">
              <span style="font-size:1.1rem;" title="Ngày sinh Dương Lịch">📅</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <input type="number" id="num-dob-day" min="1" max="31" value="${dob.day}" style="width:48px; padding:4px 6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-primary); border-radius:4px; font-weight:600; text-align:center;">
                <span>/</span>
                <input type="number" id="num-dob-month" min="1" max="12" value="${dob.month}" style="width:48px; padding:4px 6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-primary); border-radius:4px; font-weight:600; text-align:center;">
                <span>/</span>
                <input type="number" id="num-dob-year" min="1900" max="2100" value="${dob.year}" style="width:68px; padding:4px 6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-primary); border-radius:4px; font-weight:600; text-align:center;">
              </div>
              <button class="btn btn-primary btn-sm" id="btn-save-dob" style="padding:6px 12px;">💾 Lưu Ngày Sinh</button>
            </div>
          </div>

          <!-- Hero Display: Life Path Number -->
          <div class="card animate-fade-in-up" style="margin-bottom:24px; padding:24px; background:linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(59, 130, 246, 0.12)); border:1px solid var(--border-accent); position:relative; overflow:hidden;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px;">
              <div style="flex:1; min-width:280px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                  <span class="tag tag-accent" style="font-weight:700; padding:4px 10px; font-size:0.85rem;">SỐ CHỦ ĐẠO (LIFE PATH NUMBER)</span>
                  <span style="font-size:0.85rem; color:var(--text-muted);">Hành Ngũ Hành: ${lp.element}</span>
                </div>
                <h2 style="font-family:var(--font-heading); font-size:1.6rem; font-weight:700; color:var(--accent-primary); margin-bottom:8px;">${lp.title}</h2>
                <p style="font-size:0.95rem; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;"><strong>Từ khóa cốt lõi:</strong> ${lp.keyword}</p>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                  ${lp.strengths.map(s => `<span style="background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); padding:4px 10px; border-radius:16px; font-size:0.82rem; font-weight:600;">✨ ${s}</span>`).join('')}
                </div>
              </div>

              <!-- Life Path Big Number Circle Badge -->
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:110px; height:110px; background:var(--accent-primary); color:#000; border-radius:50%; box-shadow:0 0 25px rgba(234,179,8,0.4); border:4px solid rgba(255,255,255,0.3); flex-shrink:0;">
                <div style="font-size:2.8rem; font-weight:800; font-family:var(--font-heading); line-height:1;">${res.lifePath}</div>
                <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">Con Số Bản Mệnh</div>
              </div>
            </div>

            <!-- Advice Strip -->
            <div style="margin-top:18px; padding-top:14px; border-top:1px dashed var(--border-color); font-size:0.9rem; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.2rem;">💡</span>
              <div><strong>Lời khuyên cải mệnh:</strong> ${lp.advice}</div>
            </div>
          </div>

          <!-- Secondary Core Indicators: 3 Columns Grid -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:24px;">
            <!-- Personal Year 2026 -->
            <div class="card animate-fade-in-up" style="border:1px solid var(--border-color); background:var(--bg-card); padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-weight:700; color:var(--accent-primary); font-size:0.9rem;">📆 NĂM CÁ NHÂN 2026</span>
                <span style="width:36px; height:36px; background:var(--accent-muted); color:var(--accent-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">${res.personalYear}</span>
              </div>
              <div style="font-weight:700; font-size:1.05rem; margin-bottom:6px;">Năm Số ${res.personalYear} — Chu Kỳ 9 Năm</div>
              <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.45; margin-bottom:0;">${py.personalYearMeaning || 'Năm để củng cố mục tiêu và hành động.'}</p>
            </div>

            <!-- Birthday Number -->
            <div class="card animate-fade-in-up" style="border:1px solid var(--border-color); background:var(--bg-card); padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-weight:700; color:var(--accent-primary); font-size:0.9rem;">🎂 SỐ NGÀY SINH</span>
                <span style="width:36px; height:36px; background:var(--accent-muted); color:var(--accent-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">${res.birthdayNum}</span>
              </div>
              <div style="font-weight:700; font-size:1.05rem; margin-bottom:6px;">Món Quà Bẩm Sinh: Số ${res.birthdayNum}</div>
              <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.45; margin-bottom:0;">Bổ trợ tài năng đặc biệt và phản ánh thế mạnh sẵn có khi bạn đối diện với thực tế công việc.</p>
            </div>

            <!-- Attitude Number -->
            <div class="card animate-fade-in-up" style="border:1px solid var(--border-color); background:var(--bg-card); padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-weight:700; color:var(--accent-primary); font-size:0.9rem;">🤝 SỐ THÁI ĐỘ (NGOẠI GIAO)</span>
                <span style="width:36px; height:36px; background:var(--accent-muted); color:var(--accent-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">${res.attitudeNum}</span>
              </div>
              <div style="font-weight:700; font-size:1.05rem; margin-bottom:6px;">Phản Ứng Ban Đầu: Số ${res.attitudeNum}</div>
              <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.45; margin-bottom:0;">Quyết định cách người khác ấn tượng về bạn và cách bạn phản ứng trước áp lực thay đổi đột ngột.</p>
            </div>
          </div>

          <!-- Pythagoras Grid & Synergy Section -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">
            <!-- Pythagoras 3x3 Grid -->
            <div class="card" style="padding:20px; border:1px solid var(--border-color);">
              <h3 style="font-family:var(--font-heading); font-size:1.1rem; font-weight:700; color:var(--accent-primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <span>📊</span> Ma Trận Ngày Sinh 3x3 (Pythagoras)
              </h3>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">Tần suất các con số trong ngày sinh (${dob.day}/${dob.month}/${dob.year}) định hình các mũi tên sức mạnh:</p>

              <!-- 3x3 Visual Matrix -->
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; width:220px; margin:0 auto 20px auto;">
                ${[3,6,9, 2,5,8, 1,4,7].map(num => {
                  const count = res.birthGrid.counts[num] || 0;
                  const hasNum = count > 0;
                  return `
                    <div style="aspect-ratio:1; border:1px solid ${hasNum ? 'var(--border-accent)' : 'var(--border-color)'}; background:${hasNum ? 'var(--accent-muted)' : 'var(--bg-surface)'}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                      <span style="font-size:1.2rem; font-weight:700; color:${hasNum ? 'var(--accent-primary)' : 'var(--text-muted)'}">${num}</span>
                      ${count > 0 ? `<span style="font-size:0.7rem; color:var(--accent-primary); font-weight:600;">x${count}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Lines / Arrows -->
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${res.birthGrid.lines.map(line => `
                  <div style="padding:8px 12px; border-radius:6px; background:${line.has ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)'}; border:1px solid ${line.has ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.85rem; font-weight:600; color:${line.has ? '#22c55e' : 'var(--text-muted)'}">${line.name}</span>
                    <span style="font-size:0.78rem; font-weight:700; padding:2px 8px; border-radius:12px; background:${line.has ? '#22c55e' : 'var(--bg-card)'}; color:${line.has ? '#000' : 'var(--text-muted)'}">${line.has ? 'CÓ' : 'TRỐNG'}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Eastern-Western Synergy Report -->
            <div class="card" style="padding:20px; border:1px solid var(--border-accent); background:linear-gradient(135deg, var(--bg-card), rgba(147, 51, 234, 0.05));">
              <h3 style="font-family:var(--font-heading); font-size:1.1rem; font-weight:700; color:var(--accent-primary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <span>☯</span> Luận Giải Tương Tác Đông — Tây
              </h3>
              <div style="padding:12px; background:var(--bg-surface); border-radius:8px; border:1px solid var(--border-color); margin-bottom:14px;">
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary); margin-bottom:6px;">${res.synergy.title}</div>
                <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0;">${res.synergy.summary}</p>
              </div>

              <div style="padding:12px; background:var(--accent-muted); border-radius:8px; border:1px solid var(--border-accent);">
                <div style="font-weight:700; font-size:0.88rem; color:var(--accent-primary); margin-bottom:4px;">🧭 Lời Khuyên Định Hướng Cải Mệnh</div>
                <p style="font-size:0.85rem; color:var(--text-primary); line-height:1.45; margin-bottom:0;">${res.synergy.synergyAdvice}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Event Listeners for Date Picker
      const btnSave = container.querySelector('#btn-save-dob');
      if (btnSave) {
        btnSave.addEventListener('click', () => {
          const d = parseInt(container.querySelector('#num-dob-day').value) || 20;
          const m = parseInt(container.querySelector('#num-dob-month').value) || 4;
          const y = parseInt(container.querySelector('#num-dob-year').value) || 2000;

          dob.day = d;
          dob.month = m;
          dob.year = y;

          localStorage.setItem('noitam_user_dob', JSON.stringify(dob));
          Toast.show(`Đã lưu ngày sinh: ${d}/${m}/${y}`);
          render();
        });
      }
    }

    render();
  }

  window.renderNumerology = renderNumerology;
})();
