// ============================================
// NỘI TÂM — Astrology Component (Tử Vi - Vận Hạn)
// ============================================

(function() {
  'use strict';

  let activeTab = 'chart'; // 'chart' | 'tasks' | 'morning' | 'health' | 'heatmap' | 'timemachine' | 'overview'

  function renderAstrology(container, params) {
    if (params && params[0]) {
      if (['chart', 'timemachine', 'rpg', 'mood', 'meditation', 'tasks', 'morning', 'health', 'heatmap', 'overview', 'numerology', 'lifebalance', 'vanhan', 'laban'].includes(params[0])) {
        if (params[0] === 'chart' || params[0] === 'vanhan' || params[0] === 'laban') activeTab = 'chart';
        else activeTab = params[0];
      }
    }

    container.innerHTML = `
      <div class="astrology-hub animate-fade-in">
        <!-- Modern Astrology Hub Top Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-color);">
          <div>
            <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem; color:var(--accent-primary); letter-spacing:0.15em; font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              <span>🔮 TRUNG TÂM TỬ VI & TỨ TRỤ BÁT TỰ</span>
            </div>
            <h1 class="page-title" style="margin-bottom:2px;">Hệ Sinh Thái Tử Vi & Số Học</h1>
            <p class="page-subtitle" style="margin:0;">Lập lá số theo Giờ Mặt Trời Thực, luận giải Tứ Trụ & quy luật vận mệnh.</p>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" id="btn-astrology-config">
              <span>⚙️</span> Lập Lá Số / Cấu Hình Vị Trí
            </button>
          </div>
        </div>

        <!-- Main Astrology Hub Sub-Tabs (Section Switcher) -->
        <div class="cmd-nav-tabs" style="margin-bottom: 20px;">
          <button class="cmd-nav-btn ${activeTab === 'chart' ? 'active' : ''}" data-tab="chart"><span>🔮</span> Lá Số Tử Vi</button>
          <button class="cmd-nav-btn ${activeTab === 'numerology' ? 'active' : ''}" data-tab="numerology"><span>🔢</span> Số Học Ngày Sinh</button>
          <button class="cmd-nav-btn ${activeTab === 'timemachine' ? 'active' : ''}" data-tab="timemachine"><span>⏳</span> Time-Machine 60 Năm</button>
          <button class="cmd-nav-btn ${activeTab === 'rpg' ? 'active' : ''}" data-tab="rpg"><span>🎮</span> RPG Cuộc Đời</button>
          <button class="cmd-nav-btn ${activeTab === 'mood' ? 'active' : ''}" data-tab="mood"><span>🌊</span> Real-Time Mood</button>
          <button class="cmd-nav-btn ${activeTab === 'meditation' ? 'active' : ''}" data-tab="meditation"><span>🧘</span> Thiền Solfeggio</button>
          <button class="cmd-nav-btn ${activeTab === 'health' ? 'active' : ''}" data-tab="health"><span>🏥</span> Trợ Lý Sức Khỏe</button>
          <button class="cmd-nav-btn ${activeTab === 'heatmap' ? 'active' : ''}" data-tab="heatmap"><span>⚡</span> Nhịp Giờ Hoàng Đạo</button>
          <button class="cmd-nav-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview"><span>🌟</span> Tổng Quan Cuộc Đời</button>
        </div>

        <div id="astrology-hub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#astrology-hub-content');

    const btnConfig = container.querySelector('#btn-astrology-config');
    if (btnConfig) {
      btnConfig.addEventListener('click', () => {
        openChartConfigModal(() => loadSubTab(activeTab, params));
      });
    }

    function loadSubTab(tab, params) {
      activeTab = tab;
      container.querySelectorAll('.cmd-nav-btn').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
      });

      subContent.innerHTML = '';
      if (tab === 'chart') {
        renderAstrologyChart(subContent);
      } else if (tab === 'numerology' && window.renderNumerology) {
        window.renderNumerology(subContent, params);
      } else if (tab === 'timemachine' && window.renderTimeMachine) {
        window.renderTimeMachine(subContent);
      } else if (tab === 'rpg' && window.renderRPG) {
        window.renderRPG(subContent);
      } else if (tab === 'mood' && window.renderMoodTracker) {
        window.renderMoodTracker(subContent);
      } else if (tab === 'meditation' && window.renderMeditation) {
        window.renderMeditation(subContent);
      } else if (tab === 'tasks' && window.renderTasks) {
        window.renderTasks(subContent);
      } else if (tab === 'morning' && window.renderMorning) {
        window.renderMorning(subContent);
      } else if (tab === 'health' && window.renderHealth) {
        window.renderHealth(subContent);
      } else if (tab === 'heatmap' && window.renderHeatmap) {
        window.renderHeatmap(subContent);
      } else if (tab === 'overview' && window.renderOverview) {
        window.renderOverview(subContent, params);
      } else if (tab === 'lifebalance') {
        renderLifeBalanceTab(subContent);
      }
    }

    container.querySelectorAll('.cmd-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => loadSubTab(btn.dataset.tab));
    });

    // Expose tab switcher
    window.switchAstrologySubTab = (tab, params) => loadSubTab(tab, params);

    loadSubTab(activeTab);
  }

  // --- HELPER FUNCTIONS FOR FOUR PILLARS & CHART CONFIG ---
  function getStoredChartConfig() {
    try {
      if (window.AstrologyLogic && typeof window.AstrologyLogic.getUserProfile === 'function') {
        const p = window.AstrologyLogic.getUserProfile();
        if (p && p.year) {
          p.hour = (p.hour !== undefined && p.hour !== null) ? (parseInt(p.hour, 10) % 24) : 12;
          return p;
        }
      }
    } catch(e) {}
    try {
      const saved = JSON.parse(localStorage.getItem('noitam_chart_config'));
      if (saved) return saved;
    } catch(e) {}
    return {
      gender: 'Nam',
      year: 2000,
      month: 4,
      day: 20,
      hour: 21,
      minute: 0,
      locationName: 'Hà Nội, Việt Nam',
      lat: 21.0285,
      lng: 105.8333,
      tz: 7
    };
  }

  function openChartConfigModal(onSaveCallback) {
    const { Modal, Toast } = App;
    const AL = window.AstrologyLogic;
    const config = getStoredChartConfig();
    const locations = (AL && AL.FourPillars && AL.FourPillars.LOCATIONS) || [];

    const modalId = Modal.show({
      title: '⚙️ Cấu Hình Lá Số Tử Vi & Vị Trí Sinh',
      content: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- Giới tính -->
          <div>
            <label style="font-weight:600; font-size:0.85rem; color:var(--text-secondary); display:block; margin-bottom:6px;">GIỚI TÍNH</label>
            <div style="display:flex; gap:12px;">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
                <input type="radio" name="cfg-gender" value="Nam" ${config.gender === 'Nam' ? 'checked' : ''}> ♂️ Nam
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
                <input type="radio" name="cfg-gender" value="Nữ" ${config.gender === 'Nữ' ? 'checked' : ''}> ♀️ Nữ
              </label>
            </div>
          </div>

          <!-- Ngày Giờ Sinh -->
          <div>
            <label style="font-weight:600; font-size:0.85rem; color:var(--text-secondary); display:block; margin-bottom:6px;">NGÀY GIỜ SINH (DƯƠNG LỊCH)</label>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px;">
              <div>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">Ngày</span>
                <input type="number" id="cfg-day" min="1" max="31" value="${config.day}" class="form-input" style="width:100%; text-align:center;">
              </div>
              <div>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">Tháng</span>
                <input type="number" id="cfg-month" min="1" max="12" value="${config.month}" class="form-input" style="width:100%; text-align:center;">
              </div>
              <div>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">Năm</span>
                <input type="number" id="cfg-year" min="1900" max="2100" value="${config.year}" class="form-input" style="width:100%; text-align:center;">
              </div>
              <div>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">Giờ</span>
                <input type="number" id="cfg-hour" min="0" max="23" value="${config.hour}" class="form-input" style="width:100%; text-align:center;">
              </div>
              <div>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">Phút</span>
                <input type="number" id="cfg-minute" min="0" max="59" value="${config.minute}" class="form-input" style="width:100%; text-align:center;">
              </div>
            </div>
          </div>

          <!-- Vị trí sinh -->
          <div>
            <label style="font-weight:600; font-size:0.85rem; color:var(--text-secondary); display:block; margin-bottom:6px;">VỊ TRÍ NƠI SINH (TỰ ĐỘNG GIỜ MẶT TRỜI THỰC)</label>
            <select id="cfg-location-select" class="form-input" style="width:100%; margin-bottom:8px;">
              ${locations.map(loc => `
                <option value="${loc.name}" ${loc.name === config.locationName ? 'selected' : ''}>
                  ${loc.isCustom ? loc.name : `📍 ${loc.name} (${loc.lng}°E, GMT+${loc.tz})`}
                </option>
              `).join('')}
              ${(!locations.some(l => l.name === config.locationName) && config.locationName) ? `<option value="${config.locationName}" selected>📍 ${config.locationName} (Tùy chỉnh: ${config.lng}°E, GMT+${config.tz})</option>` : ''}
            </select>
          </div>

          <!-- Tọa độ tùy chỉnh (hiển thị khi chọn Khác/Tùy chỉnh) -->
          <div id="cfg-custom-coords-wrap" style="display:none; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap:8px; margin-bottom:12px; background:var(--bg-card); padding:10px; border-radius:8px; border:1px dashed var(--border-accent);">
            <div>
              <span style="font-size:0.72rem; color:var(--text-tertiary);">Tên Địa Danh</span>
              <input type="text" id="cfg-custom-name" value="${config.locationName || 'Tùy chỉnh'}" class="form-input" style="width:100%; font-size:0.82rem;" placeholder="Nhập tên nơi sinh">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-tertiary);">Vĩ Độ (Lat)</span>
              <input type="number" step="0.0001" id="cfg-custom-lat" value="${config.lat || 21.03}" class="form-input" style="width:100%; text-align:center; font-size:0.82rem;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-tertiary);">Kinh Độ (Lng)</span>
              <input type="number" step="0.0001" id="cfg-custom-lng" value="${config.lng || 105.85}" class="form-input" style="width:100%; text-align:center; font-size:0.82rem;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-tertiary);">Múi Giờ (UTC)</span>
              <input type="number" step="1" id="cfg-custom-tz" value="${config.tz ?? 7}" class="form-input" style="width:100%; text-align:center; font-size:0.82rem;">
            </div>
          </div>

          <!-- Preview Giờ Mặt Trời Thực -->
          <div id="cfg-tst-preview" style="background:var(--accent-muted); border:1px solid var(--border-accent); border-radius:var(--radius-md); padding:10px 14px; font-size:0.85rem;">
            ⏳ Đang tính toán Giờ Mặt Trời Thực...
          </div>
        </div>
      `,
      actions: [
        { label: 'Hủy Bỏ', type: 'secondary' },
        {
          label: '💾 Lưu & Cập Nhật Lá Số',
          type: 'primary',
          onClick: () => {
            const gender = document.querySelector('input[name="cfg-gender"]:checked')?.value || 'Nam';
            const day = parseInt(document.getElementById('cfg-day').value) || 20;
            const month = parseInt(document.getElementById('cfg-month').value) || 4;
            const year = parseInt(document.getElementById('cfg-year').value) || 2000;
            const hour = parseInt(document.getElementById('cfg-hour').value) || 21;
            const minute = parseInt(document.getElementById('cfg-minute').value) || 24;

            const locName = document.getElementById('cfg-location-select').value;
            const selectedLoc = locations.find(l => l.name === locName);

            let finalLocName = locName;
            let lat = 21.03;
            let lng = 105.85;
            let tz = 7;

            if (selectedLoc && !selectedLoc.isCustom) {
              finalLocName = selectedLoc.name;
              lat = selectedLoc.lat;
              lng = selectedLoc.lng;
              tz = selectedLoc.tz;
            } else {
              // Read custom inputs
              finalLocName = document.getElementById('cfg-custom-name')?.value.trim() || 'Tùy chỉnh';
              lat = parseFloat(document.getElementById('cfg-custom-lat')?.value) || 21.03;
              lng = parseFloat(document.getElementById('cfg-custom-lng')?.value) || 105.85;
              tz = parseInt(document.getElementById('cfg-custom-tz')?.value) ?? 7;
            }

            const normalizedHour = (hour !== undefined && hour !== null) ? (parseInt(hour, 10) % 24) : 0;
            const currentProf = (window.Onboarding && typeof window.Onboarding.getProfile === 'function') ? (window.Onboarding.getProfile() || {}) : {};
            const newConfig = {
              ...currentProf,
              gender,
              year,
              month,
              day,
              hour: normalizedHour,
              minute,
              locationName: finalLocName,
              lat,
              lng,
              tz,
              updatedAt: new Date().toISOString()
            };

            localStorage.setItem('noitam_chart_config', JSON.stringify(newConfig));
            localStorage.setItem('noitam_user_profile', JSON.stringify(newConfig));
            if (window.Onboarding && typeof window.Onboarding.saveProfile === 'function') {
              window.Onboarding.saveProfile(newConfig);
            }
            Toast.show('Đã cập nhật lá số & Giờ Mặt Trời Thực!');
            if (onSaveCallback) onSaveCallback();
          }
        }
      ]
    });

    function updateTstPreview() {
      const modalEl = document.getElementById(modalId);
      if (!modalEl) return;

      const day = parseInt(modalEl.querySelector('#cfg-day')?.value) || 20;
      const month = parseInt(modalEl.querySelector('#cfg-month')?.value) || 4;
      const year = parseInt(modalEl.querySelector('#cfg-year')?.value) || 2000;
      const hour = parseInt(modalEl.querySelector('#cfg-hour')?.value) || 21;
      const minute = parseInt(modalEl.querySelector('#cfg-minute')?.value) || 24;
      const locName = modalEl.querySelector('#cfg-location-select')?.value;
      const selectedLoc = locations.find(l => l.name === locName);

      const customWrap = modalEl.querySelector('#cfg-custom-coords-wrap');
      const isCustom = !selectedLoc || selectedLoc.isCustom;

      if (customWrap) {
        customWrap.style.display = isCustom ? 'grid' : 'none';
      }

      let lat = 21.03;
      let lng = 105.85;
      let tz = 7;
      let displayName = locName;

      if (selectedLoc && !selectedLoc.isCustom) {
        lat = selectedLoc.lat;
        lng = selectedLoc.lng;
        tz = selectedLoc.tz;
        displayName = selectedLoc.name;
      } else {
        displayName = modalEl.querySelector('#cfg-custom-name')?.value.trim() || 'Tùy chỉnh';
        lat = parseFloat(modalEl.querySelector('#cfg-custom-lat')?.value) || 21.03;
        lng = parseFloat(modalEl.querySelector('#cfg-custom-lng')?.value) || 105.85;
        tz = parseInt(modalEl.querySelector('#cfg-custom-tz')?.value) ?? 7;
      }

      if (AL && AL.FourPillars) {
        const civilDate = new Date(year, month - 1, day, hour, minute);
        const tstInfo = AL.FourPillars.calculateTrueSolarTime(civilDate, lng, tz);
        const previewEl = modalEl.querySelector('#cfg-tst-preview');
        if (previewEl) {
          const sign = tstInfo.deltaMinutes >= 0 ? '+' : '';
          previewEl.innerHTML = `
            <div style="font-weight:700; color:var(--accent-primary); margin-bottom:2px;">☀️ Giờ Mặt Trời Thực: ${tstInfo.trueSolarDate.getHours().toString().padStart(2,'0')}:${tstInfo.trueSolarDate.getMinutes().toString().padStart(2,'0')} (Độ lệch: ${sign}${tstInfo.deltaMinutes} phút)</div>
            <div style="color:var(--text-secondary); font-size:0.8rem;">📍 ${displayName} (${lng}°E, GMT+${tz}) • Local Noon (Chính ngọ): ${tstInfo.noonStr}</div>
          `;
        }
      }
    }

    setTimeout(() => {
      updateTstPreview();
      const modalEl = document.getElementById(modalId);
      if (modalEl) {
        modalEl.querySelectorAll('input, select').forEach(el => {
          el.addEventListener('change', updateTstPreview);
          el.addEventListener('input', updateTstPreview);
        });
      }
    }, 100);
  }

  function copyChartRawDataForAI() {
    const { Toast } = App;
    const AL = window.AstrologyLogic;
    const config = getStoredChartConfig();
    const civilDate = new Date(config.year, config.month - 1, config.day, config.hour, config.minute);
    
    let fp = null;
    if (AL && AL.FourPillars) {
      fp = AL.FourPillars.calculateFourPillars(civilDate, config.lng, config.tz);
    }

    const tstTimeStr = fp ? `${fp.trueSolarDate.getHours()}:${fp.trueSolarDate.getMinutes().toString().padStart(2,'0')}` : `${config.hour}:${config.minute}`;
    const deltaStr = fp ? `${fp.deltaMinutes >= 0 ? '+' : ''}${fp.deltaMinutes}m` : '0m';

    const p = fp ? fp.pillars : null;
    const yearStr = p ? `${p.year.can} ${p.year.chi} (${p.year.tenGod})` : 'Canh Thìn';
    const monthStr = p ? `${p.month.can} ${p.month.chi} (${p.month.tenGod})` : 'Bính Thìn';
    const dayStr = p ? `${p.day.can} ${p.day.chi} (Nhật Nguyên)` : 'Giáp Tuất';
    const hourStr = p ? `${p.hour.can} ${p.hour.chi} (${p.hour.tenGod})` : 'Canh Tuất';

    let tuViChart = null;
    if (AL && AL.TuViEngine) {
      tuViChart = AL.TuViEngine.calculateTuViChart({
        day: config.day,
        month: config.month,
        year: config.year,
        hour: config.hour,
        minute: config.minute,
        gender: config.gender,
        canNam: p ? p.year.can : 'Canh',
        chiNam: p ? p.year.chi : 'Thìn',
        lunarDay: fp ? fp.lunarDay : 4,
        lunarMonth: fp ? fp.lunarMonth : 7
      });
    }

    const tb = tuViChart ? tuViChart.thienBan : null;
    const palacesListStr = tuViChart ? tuViChart.palaces.map(pl => {
      const stars = pl.mainStarsList && pl.mainStarsList.length > 0
        ? pl.mainStarsList.map(s => `${s.name} [${s.bright}]${s.hoa ? ` [${s.hoa}]` : ''}`).join(', ')
        : 'Vô Chính Diệu';
      const sub = pl.subStarsList && pl.subStarsList.length > 0
        ? ` | Phụ tinh: ${pl.subStarsList.map(ss => ss.name).join(', ')}`
        : '';
      return `- Cung ${pl.name} (${pl.chi}): ${stars}${sub}${pl.tuanTrietStr ? ` [${pl.tuanTrietStr}]` : ''}`;
    }).join('\n') : `- Mệnh: Tý (Thiên Đồng, Thái Âm [V])\n- Thân: Dần (Thái Dương, Cự Môn)`;

    const rawText = `=== THÔNG TIN LÁ SỐ TỬ VI & TỨ TRỤ BÁT TỰ ===
- Giới tính: ${config.gender === 'Nam' ? 'Dương Nam' : 'Âm Nữ'}
- Ngày sinh Dương lịch: ${config.day}/${config.month}/${config.year} lúc ${config.hour}:${config.minute.toString().padStart(2,'0')}
- Vị trí sinh: ${config.locationName} (GMT+${config.tz}, Kinh độ ${config.lng}°E)
- Giờ Mặt Trời Thực: ${tstTimeStr} (Độ lệch kinh độ: ${deltaStr}, Chính ngọ: ${fp ? fp.noonStr : '12:00'})

=== TỨ TRỤ BÁT TỰ (FOUR PILLARS) ===
- Trụ Năm: ${yearStr} | Tàng Can: ${(p ? p.year.hidden.map(h => `${h.stem}(${h.tenGod})`).join(', ') : '')}
- Trụ Tháng: ${monthStr} | Tàng Can: ${(p ? p.month.hidden.map(h => `${h.stem}(${h.tenGod})`).join(', ') : '')}
- Trụ Ngày: ${dayStr} | Tàng Can: ${(p ? p.day.hidden.map(h => `${h.stem}(${h.tenGod})`).join(', ') : '')}
- Trụ Giờ: ${hourStr} | Tàng Can: ${(p ? p.hour.hidden.map(h => `${h.stem}(${h.tenGod})`).join(', ') : '')}

=== THÔNG TIN BÀN SỐ TỬ VI 12 CUNG ===
- Cục: ${tb ? tb.cucName : 'Hỏa Lục Cục'} | Âm Dương: ${tb ? tb.amDuongLy : 'Âm Dương Thuận Lý'}
- Mệnh Cục: ${tb ? tb.menhCucRel : 'Mệnh Cục bình hòa'}
- Cung Mệnh tại ${tb ? tb.menhChi : 'Tý'}, Cung Thân tại ${tb ? tb.thanChi : 'Dần'} (${tb ? tb.thanPalaceId : 'Phúc Đức'})
${palacesListStr}

=== YÊU CẦU DÀNH CHO AI (PROMPT) ===
Hãy phân tích chuyên sâu lá số Tử Vi kết hợp Tứ Trụ Bát Tự trên. Đưa ra đánh giá tổng quan về tính cách, điểm mạnh, điểm yếu, các vận hạn lớn và lời khuyên phát triển bản thân cải mệnh thiết thực nhất.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawText).then(() => {
        Toast.show("📋 Đã copy Raw Data lá số gửi AI vào Clipboard!");
      }).catch(() => {
        Toast.show("Không thể tự động copy, vui lòng thử lại!");
      });
    } else {
      Toast.show("📋 Đã tạo Raw Data lá số!");
    }
  }

  function renderAstrologyChart(container) {
    const AL = window.AstrologyLogic;
    const config = getStoredChartConfig();
    const civilDate = new Date(config.year, config.month - 1, config.day, config.hour, config.minute);
    
    let fp = null;
    if (AL && AL.FourPillars) {
      fp = AL.FourPillars.calculateFourPillars(civilDate, config.lng, config.tz);
    }

    const p = fp ? fp.pillars : null;

    // Active view & famous chart state
    let activeFamousId = null; // null for user chart, or famous person ID string
    let timeView = 'mingpan'; // 'mingpan' | 'daxian' | 'liunian' | 'liuyue'
    let currentLiunianYear = new Date().getFullYear();
    let currentLiuyueMonth = new Date().getMonth() + 1;
    let selectedPalaceBranch = 0;
    let activeFlyingBranch = null; // null or branch index 0..11 for Phi Tinh Tứ Hóa

    const openClassicsReaderModal = () => {
      const { Modal } = App;
      const classics = window.ZiweiClassics;
      if (!classics) return;

      const books = classics.getBooks();
      let currentBookId = books[0].id;

      const renderModalContent = (bookId, searchKw = '') => {
        const book = classics.getBookById(bookId);
        let searchResultsHtml = '';

        if (searchKw.trim()) {
          const results = classics.searchClassics(searchKw.trim());
          searchResultsHtml = `
            <div style="background:var(--accent-muted); border:1px solid var(--border-accent); border-radius:8px; padding:10px; margin-bottom:12px;">
              <div style="font-size:0.8rem; font-weight:700; color:var(--accent-primary); margin-bottom:6px;">🔍 KẾT QUẢ TÌM KIẾM CHO "${searchKw}" (${results.length} kết quả)</div>
              ${results.length > 0 ? results.map(r => `
                <div style="font-size:0.82rem; color:var(--text-primary); margin-bottom:6px; padding-bottom:6px; border-bottom:1px dashed var(--border-color);">
                  <strong style="color:var(--accent-primary);">[${r.bookTitle} - ${r.chapterTitle}]</strong>: ${r.text}
                </div>
              `).join('') : '<div style="font-size:0.8rem; color:var(--text-tertiary);">Không tìm thấy ca quyết phù hợp.</div>'}
            </div>
          `;
        }

        return `
          <div style="display:flex; flex-direction:column; gap:12px; max-height:68vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="display:flex; gap:6px;">
                ${books.map(b => `
                  <button class="btn btn-sm btn-classic-book ${b.id === bookId ? 'btn-primary' : 'btn-tab'}" data-bookid="${b.id}">
                    ${b.title}
                  </button>
                `).join('')}
              </div>
              <div style="display:flex; gap:4px; flex:1; max-width:240px;">
                <input type="text" id="classic-search-input" value="${searchKw}" placeholder="Tìm ca quyết..." class="form-input" style="font-size:0.8rem; padding:4px 8px;">
                <button id="btn-classic-search" class="btn btn-primary btn-sm">Tìm</button>
              </div>
            </div>

            ${searchResultsHtml}

            <div style="background:var(--bg-surface); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color);">
              <div style="font-weight:700; font-size:1rem; color:var(--accent-primary);">${book.title}</div>
              <div style="font-size:0.75rem; color:var(--text-tertiary); margin:2px 0;">📜 Triều đại: ${book.dynasty} • Tác giả: ${book.author}</div>
              <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.4; margin-top:4px;">${book.intro}</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              ${book.chapters.map(chap => `
                <div style="background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
                  <div style="font-weight:700; font-size:0.9rem; color:var(--accent-primary); margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px;">
                    ${chap.title}
                  </div>
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${chap.paragraphs.map(p => `
                      <p style="font-size:0.85rem; color:var(--text-primary); line-height:1.5; margin:0; font-family:var(--font-heading);">
                        ${p}
                      </p>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      };

      const modalId = Modal.show({
        title: '📜 Thư Viện Cổ Tịch Tử Vi Kinh Điển (Cốt Tủy Phú)',
        content: renderModalContent(currentBookId),
        actions: [{ label: 'Đóng', type: 'primary' }]
      });

      setTimeout(() => {
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        modalEl.addEventListener('click', (e) => {
          const bookBtn = e.target.closest('.btn-classic-book');
          if (bookBtn) {
            currentBookId = bookBtn.dataset.bookid;
            const container = modalEl.querySelector('.modal-body');
            if (container) container.innerHTML = renderModalContent(currentBookId);
          }

          if (e.target.id === 'btn-classic-search') {
            const kw = modalEl.querySelector('#classic-search-input')?.value || '';
            const container = modalEl.querySelector('.modal-body');
            if (container) container.innerHTML = renderModalContent(currentBookId, kw);
          }
        });
      }, 100);
    };

    const BRANCH_SVG_POS = {
      5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
      4: [12.5, 37.5],                                  9: [87.5, 37.5],
      3: [12.5, 62.5],                                 10: [87.5, 62.5],
      2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
    };

    const getSanFangSiZhengBranches = (b) => [
      b,
      (b + 6) % 12,
      (b + 4) % 12,
      (b + 8) % 12
    ];

    const getOverlaySiHua = () => {
      if (!AL || !AL.TuViEngine) return {};
      if (timeView === 'daxian' && tuViChart && tuViChart.daXians) {
        const curAge = tb ? (tb.currentAge || 25) : 25;
        const curDx = tuViChart.daXians.find(d => curAge >= d.startAge && curAge <= d.endAge) || tuViChart.daXians[0];
        if (curDx) return AL.TuViEngine.buildSiHuaOverlay(curDx.stem);
      }
      if (timeView === 'liunian') {
        const stemIdx = ((currentLiunianYear - 4) % 10 + 10) % 10;
        return AL.TuViEngine.buildSiHuaOverlay(stemIdx);
      }
      return {};
    };

    const getTuHoaBadge = (hoa) => {
      if (!hoa) return '';
      const colors = {
        'Lộc': { bg: '#10b98125', col: '#10b981' },
        'Quyền': { bg: '#f59e0b25', col: '#f59e0b' },
        'Khoa': { bg: '#3b82f625', col: '#3b82f6' },
        'Kỵ': { bg: '#ef444425', col: '#ef4444' }
      };
      const c = colors[hoa] || { bg: 'var(--accent-muted)', col: 'var(--accent-primary)' };
      return `<span style="background:${c.bg};color:${c.col};padding:1px 5px;border-radius:4px;font-size:0.68rem;margin-left:3px;font-weight:800;display:inline-block;">[${hoa}]</span>`;
    };

    const openStarDetailModal = (starName) => {
      const { Modal } = App;
      const detail = window.ZiweiStarKnowledge ? window.ZiweiStarKnowledge.getStarDetail(starName) : null;

      if (!detail) {
        App.Toast.show(`Chưa có dữ liệu luận giải chi tiết cho sao ${starName}`);
        return;
      }

      Modal.show({
        title: `✨ Luận Giải Chi Tiết Sao ${starName}`,
        content: `
          <div style="display:flex; flex-direction:column; gap:14px; max-height:68vh; overflow-y:auto; padding-right:4px;">
            <div style="background:var(--accent-muted); border:1px solid var(--border-accent); border-radius:8px; padding:12px;">
              <div style="font-weight:700; color:var(--accent-primary); font-size:0.95rem; margin-bottom:4px;">🔮 QUAN ĐIỂM 倪海厦 (NI HẢI HẠ)</div>
              <div style="font-size:0.85rem; color:var(--text-primary); line-height:1.5;">${detail.niHaixia}</div>
            </div>

            <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:12px;">
              <div style="font-weight:700; color:var(--text-secondary); font-size:0.85rem; margin-bottom:4px;">📖 CỔ QUYẾT TRÍCH DẪN</div>
              <div style="font-size:0.82rem; color:var(--text-secondary); font-style:italic; line-height:1.4;">${detail.classical}</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:#10b981; text-transform:uppercase;">CUNG ĐẮC THẾ NHẤT</div>
                <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-top:2px;">${detail.bestPalace}</div>
              </div>
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:#ef4444; text-transform:uppercase;">CUNG KỴ HÃM ĐỊA</div>
                <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-top:2px;">${detail.worstPalace}</div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--accent-primary);">💼 SỰ NGHIỆP</div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">${detail.career}</div>
              </div>
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:#ec4899;">❤️ TÌNH CẢM & HÔN NHÂN</div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">${detail.relationship}</div>
              </div>
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:#f59e0b;">💰 TÀI VẬN & TÍCH LŨY</div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">${detail.wealth}</div>
              </div>
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
                <div style="font-size:0.75rem; font-weight:700; color:#10b981;">🏥 SỨC KHỎE</div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">${detail.health}</div>
              </div>
            </div>
          </div>
        `,
        actions: [{ label: 'Đóng', type: 'primary' }]
      });
    };

    const formatPalaceStarsHtml = (pItem, isMobile = false, overlaySiHua = {}, flyingSiHuaMap = {}) => {
      let mainStarsHtml = pItem.mainStarsList && pItem.mainStarsList.length > 0
        ? pItem.mainStarsList.map(s => {
            let badgeColor = 'var(--text-secondary)';
            if (s.bright === 'M' || s.bright === 'V') badgeColor = 'var(--accent-primary)';
            else if (s.bright === 'Đ') badgeColor = '#10b981';
            else if (s.bright === 'H') badgeColor = '#ef4444';
            
            const activeHoa = timeView === 'mingpan' ? s.hoa : (overlaySiHua[s.name] || s.hoa);
            const hoaBadge = getTuHoaBadge(activeHoa);

            // Kiểm tra Phi Tinh Tứ Hóa tương tác
            let flyingBadge = '';
            if (flyingSiHuaMap && flyingSiHuaMap[s.name]) {
              const fly = flyingSiHuaMap[s.name];
              flyingBadge = `<span style="background:${fly.color}30;color:${fly.color};border:1px solid ${fly.color};font-size:0.68rem;padding:1px 5px;border-radius:4px;font-weight:900;margin-left:3px;box-shadow:0 0 6px ${fly.color}50;display:inline-block;" title="Phi Tinh: Hóa ${fly.type} từ Cung ${fly.fromPalace}">[Phi ${fly.type}]</span>`;
            }

            return `<span class="star-item-clickable" data-star="${s.name}" style="font-weight:800;color:${badgeColor};cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;" title="Bấm xem luận giải chi tiết sao ${s.name}">${s.name} <small style="font-weight:700;opacity:0.9;">[${s.bright}]</small></span>${hoaBadge}${flyingBadge}`;
          }).join(isMobile ? ', ' : '<br>')
        : `<span style="color:var(--text-tertiary);font-style:italic;">Vô Chính Diệu</span>`;

      let subStarsHtml = '';
      if (pItem.subStarsList && pItem.subStarsList.length > 0) {
        const subNames = pItem.subStarsList.map(ss => {
          let styleAttr = 'color:var(--text-tertiary);font-size:0.72rem;';
          
          if (ss.name === 'Lộc Tồn') {
            styleAttr = 'background:rgba(16,185,129,0.18);color:#10b981;border:1px solid rgba(16,185,129,0.35);font-size:0.72rem;font-weight:800;padding:1px 5px;border-radius:4px;display:inline-block;margin:1px 0;';
          } else if (['Đào Hoa', 'Hồng Loan', 'Thiên Hỷ'].includes(ss.name)) {
            styleAttr = 'background:rgba(236,72,153,0.18);color:#ec4899;border:1px solid rgba(236,72,153,0.35);font-size:0.72rem;font-weight:800;padding:1px 5px;border-radius:4px;display:inline-block;margin:1px 0;';
          } else if (['Giải Thần', 'Thiên Giải', 'Địa Giải'].includes(ss.name)) {
            styleAttr = 'background:rgba(6,182,212,0.18);color:#06b6d4;border:1px solid rgba(6,182,212,0.35);font-size:0.72rem;font-weight:800;padding:1px 5px;border-radius:4px;display:inline-block;margin:1px 0;';
          } else if (ss.name === 'Thiên Mã') {
            styleAttr = 'background:rgba(139,92,246,0.18);color:#8b5cf6;border:1px solid rgba(139,92,246,0.35);font-size:0.72rem;font-weight:800;padding:1px 5px;border-radius:4px;display:inline-block;margin:1px 0;';
          } else if (ss.type === 'sat-tinh' || ['Kình Dương', 'Đà La', 'Địa Không', 'Địa Kiếp', 'Hỏa Tinh', 'Linh Tinh', 'Tuế Phá', 'Tang Môn', 'Bạch Hổ'].includes(ss.name)) {
            styleAttr = 'color:#ef4444;font-size:0.72rem;font-weight:700;';
          } else if (ss.type === 'thai-tue' || ss.type === 'phuc-tinh') {
            styleAttr = 'color:var(--text-secondary);font-size:0.72rem;font-weight:600;';
          }

          const activeHoa = timeView === 'mingpan' ? ss.hoa : (overlaySiHua[ss.name] || ss.hoa);
          const hoaBadge = getTuHoaBadge(activeHoa);

          let flyingBadge = '';
          if (flyingSiHuaMap && flyingSiHuaMap[ss.name]) {
            const fly = flyingSiHuaMap[ss.name];
            flyingBadge = `<span style="background:${fly.color}30;color:${fly.color};border:1px solid ${fly.color};font-size:0.68rem;padding:1px 5px;border-radius:4px;font-weight:900;margin-left:3px;box-shadow:0 0 6px ${fly.color}50;display:inline-block;" title="Phi Tinh: Hóa ${fly.type} từ Cung ${fly.fromPalace}">[Phi ${fly.type}]</span>`;
          }

          return `<span style="${styleAttr}">${ss.name}</span>${hoaBadge}${flyingBadge}`;
        }).join(', ');
        subStarsHtml = `<div style="margin-top:4px;line-height:1.35;">${subNames}</div>`;
      }

      let tuanTrietBadge = pItem.tuanTrietStr
        ? `<div style="display:inline-block;background:#ef444420;color:#ef4444;border:1px dashed #ef4444;font-size:0.68rem;padding:1px 4px;border-radius:4px;margin-top:4px;font-weight:700;">${pItem.tuanTrietStr}</div>`
        : '';

      const daXianBadge = pItem.daXianAge
        ? `<div style="font-size:0.68rem;color:var(--accent-gold);margin-top:2px;font-weight:600;">[Đạn: ${pItem.daXianAge[0]}–${pItem.daXianAge[1]}t]</div>`
        : '';

      return `${mainStarsHtml}${subStarsHtml}${tuanTrietBadge}${daXianBadge}`;
    };

    // Render Marriage Analysis Widget
    const renderMarriageWidgetHtml = () => {
      const targetChart = (window.AstrologyLogic && typeof window.AstrologyLogic.getUserTuViChart === 'function') ? window.AstrologyLogic.getUserTuViChart() : null;
      if (!window.ZiweiMarriageKnowledge || !targetChart) return '';
      const mInfo = window.ZiweiMarriageKnowledge.analyzeMarriage(targetChart);
      if (!mInfo) return '';

      const detail = mInfo.starDetail;

      return `
        <div class="card animate-fade-in" style="margin-bottom:24px; padding:18px; border:1px solid #ec489940; background:linear-gradient(135deg, var(--bg-card), var(--bg-surface));">
          <div style="font-size:0.8rem; font-weight:700; color:#ec4899; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <span>💕 PHÂN TÍCH HÔN NHÂN & GIA ĐẠO (Song Cung Phu Thê & Phúc Đức)</span>
            <span style="font-size:0.7rem; font-weight:400; color:var(--text-tertiary);">Trường phái 倪海厦 (Ni Hải Hạ)</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
            <!-- Cung Phu Thê Box -->
            <div style="padding:14px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-weight:700; font-size:0.95rem; color:var(--accent-primary);">Cung Phu Thê [Cư ${mInfo.fuqiChi}]</span>
                <span style="background:rgba(236,72,153,0.15); color:#ec4899; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:12px;">★ ${mInfo.mainStarName} thủ Cung</span>
              </div>
              ${detail ? `
                <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-bottom:8px;">📌 ${detail.summary}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-bottom:6px;">👤 <strong>Đặc điểm phối ngẫu:</strong> ${detail.spouse_traits}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-bottom:6px;">⏳ <strong>Thời điểm kết hôn:</strong> ${detail.timing}</div>
                <div style="font-size:0.78rem; color:#10b981; margin-bottom:4px;">✔️ <strong>Cát tượng:</strong> ${detail.good}</div>
                <div style="font-size:0.78rem; color:#ef4444;">⚠️ <strong>Hung tượng/Trắc trở:</strong> ${detail.bad}</div>
              ` : `<div style="font-size:0.82rem; color:var(--text-secondary);">Cung Phu Thê Vô Chính Diệu, cần mượn Cung Quan Lộc chiếu sang.</div>`}
            </div>

            <!-- Cung Phúc Đức Box & Song Cung Advice -->
            <div style="padding:14px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; font-size:0.95rem; color:var(--accent-primary);">Cung Phúc Đức [Cư ${mInfo.phucPalaceChi}]</span>
                  <span style="background:var(--accent-muted); color:var(--accent-primary); font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:12px;">★ Sao: ${mInfo.phucStars}</span>
                </div>
                <p style="font-size:0.82rem; color:var(--text-secondary); margin:6px 0; line-height:1.4;">
                  Cung Phúc Đức quyết định sự thấu hiểu tâm hồn và mức độ gắn kết bền lâu trong hôn nhân. Dù Cung Phu Thê biến động nhưng Cung Phúc Đức tốt thì tình nghĩa vẫn giữ trọn vẹn.
                </p>
              </div>
              <div style="font-size:0.78rem; color:var(--accent-primary); background:var(--accent-muted); padding:8px 10px; border-radius:6px; border:1px solid var(--border-accent); margin-top:8px;">
                💡 <strong>Lời phán Ni Hải Hạ:</strong> ${detail && detail.niQuote ? detail.niQuote : mInfo.niRuleAdvice}
              </div>
            </div>
          </div>
        </div>
      `;
    };

    // Render AI 6-Topic Consultation Panel
    const renderAITopicConsultationPanelHtml = () => {
      const topics = [
        { key: 'overview', name: '🌟 Mệnh 格 Tổng Quan', color: '#3b82f6' },
        { key: 'love', name: '❤️ Tình Cảm & Hôn Nhân', color: '#ec4899' },
        { key: 'career', name: '💼 Sự Nghiệp & Công Danh', color: '#10b981' },
        { key: 'wealth', name: '💰 Tài Vận & Tích Lũy', color: '#f59e0b' },
        { key: 'health', name: '🏥 Sức Khỏe & Tạng Phủ', color: '#8b5cf6' },
        { key: 'personality', name: '🧠 Tính Cách & Tư Duy', color: '#06b6d4' }
      ];

      return `
        <div class="card animate-fade-in" style="margin-bottom:24px; padding:18px; border:1px solid var(--border-accent); background:var(--bg-card);">
          <div style="font-size:0.8rem; font-weight:700; color:var(--accent-primary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <span>🤖 AI TƯ VẤN LÁ SỐ TỬ VI (6 CHỦ ĐỀ CHUYÊN SÂU)</span>
            <span style="font-size:0.7rem; font-weight:400; color:var(--text-tertiary);">Prompting theo 倪海厦 System</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
            ${topics.map(tp => `
              <button class="btn btn-tab btn-ai-topic" data-topic="${tp.key}" style="padding:10px 12px; text-align:left; justify-content:flex-start; border:1px solid var(--border-color); border-left:4px solid ${tp.color}; background:var(--bg-surface); font-weight:600; font-size:0.85rem;">
                ${tp.name}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    };

    const openAITopicPromptModal = (topicKey) => {
      const { Modal, Toast } = App;
      const config = getStoredChartConfig();

      let fp = null;
      if (AL && AL.FourPillars) {
        const civilDate = new Date(config.year, config.month - 1, config.day, config.hour, config.minute);
        fp = AL.FourPillars.calculateFourPillars(civilDate, config.lng, config.tz);
      }
      const p = fp ? fp.pillars : null;

      let tuViChart = null;
      if (AL && AL.TuViEngine) {
        tuViChart = AL.TuViEngine.calculateTuViChart({
          day: config.day, month: config.month, year: config.year, hour: config.hour, minute: config.minute,
          gender: config.gender, canNam: p ? p.year.can : 'Canh', chiNam: p ? p.year.chi : 'Thìn'
        });
      }

      const tb = tuViChart ? tuViChart.thienBan : {};
      const patterns = window.ZiweiPatterns ? window.ZiweiPatterns.detectPatterns(tuViChart).map(pt => pt.name).join(', ') : '';

      const topicNames = {
        overview: 'Mệnh 格 Tổng Quan',
        love: 'Tình Cảm & Hôn Nhân',
        career: 'Sự Nghiệp & Công Danh',
        wealth: 'Tài Vận & Tích Lũy',
        health: 'Sức Khỏe & Tạng Phủ',
        personality: 'Tính Cách & Tư Duy'
      };

      const promptText = `Xin hãy phân tích chuyên sâu lá số Tử Vi Đẩu Số theo hệ thống 倪海厦 (Ni Hải Hạ - Thiên Kỷ) cho chủ đề [${topicNames[topicKey] || 'Tổng Quan'}]:

**[Thông Tin Lá Số]**
- Giới tính: ${config.gender} | Âm Dương: ${tb.amDuongLy || 'Thuận lý'}
- Trụ Năm: ${p ? `${p.year.can} ${p.year.chi}` : 'Canh Thìn'} | Trụ Tháng: ${p ? `${p.month.can} ${p.month.chi}` : 'Bính Thìn'} | Trụ Ngày: ${p ? `${p.day.can} ${p.day.chi}` : 'Giáp Tuất'} | Trụ Giờ: ${p ? `${p.hour.can} ${p.hour.chi}` : 'Canh Tuất'}
- Cung Mệnh: Cư ${tb.menhChi || 'Tý'} | Cung Thân: Cư ${tb.thanChi || 'Dần'} (${tb.thanPalaceId || ''})
- Cục: ${tb.cucName || 'Hỏa Lục Cục'} | Mệnh Cục: ${tb.menhCucRel || ''}
- Các cách cục phát hiện: ${patterns || 'Chưa xác định'}

**[Yêu Cầu Luận Giải]**
1. Định tính tổng thể lá số theo quan điểm Ni Hải Hạ.
2. Phân tích tác động của các chính tinh và Tứ Hóa chiếu.
3. Liên hại Tam Phương Tứ Chính (Mệnh, Tài, Quan, Di).
4. Định hướng vận hạn Đại Hạn 10 năm hiện tại.
5. Đưa ra lời khuyên thực tế, khả thi.`;

      Modal.show({
        title: `🤖 AI Prompt Template — ${topicNames[topicKey]}`,
        content: `
          <div>
            <div style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:8px;">
              Prompt đã được đóng gói tự động chuẩn cấu trúc Ni Hải Hạ. Bạn có thể copy để gửi cho AI hoặc sử dụng trực tiếp.
            </div>
            <textarea readonly style="width:100%; height:200px; background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-color); border-radius:8px; padding:10px; font-family:var(--font-mono); font-size:0.8rem; line-height:1.4; resize:none;">${promptText}</textarea>
          </div>
        `,
        actions: [
          {
            label: '📋 Copy Prompt AI',
            type: 'primary',
            onClick: () => {
              navigator.clipboard.writeText(promptText);
              Toast.show('Đã copy Prompt AI vào bộ nhớ tạm!');
            }
          },
          { label: 'Đóng', type: 'secondary' }
        ]
      });
    };

    // Render Pattern Recognition Cards
    const renderPatternsHtml = () => {
      const targetChart = (window.AstrologyLogic && typeof window.AstrologyLogic.getUserTuViChart === 'function') ? window.AstrologyLogic.getUserTuViChart() : null;
      if (!window.ZiweiPatterns || !targetChart) return '';
      const patterns = window.ZiweiPatterns.detectPatterns(targetChart);
      if (!patterns || patterns.length === 0) return '';

      return `
        <div class="card animate-fade-in" style="margin-bottom:24px; padding:18px; border:1px solid var(--border-accent); background:linear-gradient(135deg, var(--bg-card), var(--bg-surface));">
          <div style="font-size:0.8rem; font-weight:700; color:var(--accent-primary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <span>📜 CÁC CÁCH CỤC TỰ ĐỘNG PHÁT HIỆN (${patterns.length} cách)</span>
            <span style="font-size:0.7rem; font-weight:400; color:var(--text-tertiary);">Trường phái 倪海厦 (Ni Hải Hạ)</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
            ${patterns.map(pat => {
              let badgeBg = '#10b98120', badgeCol = '#10b981';
              if (pat.level === 'excellent') { badgeBg = 'rgba(212,168,67,0.2)'; badgeCol = 'var(--accent-gold)'; }
              else if (pat.level === 'neutral') { badgeBg = 'var(--accent-muted)'; badgeCol = 'var(--text-secondary)'; }

              const reqStr = (pat.conditions && pat.conditions.required) ? pat.conditions.required.join(' • ') : '';
              const bonusStr = (pat.conditions && pat.conditions.bonus && pat.conditions.bonus.length) ? `✨ Điểm cộng: ${pat.conditions.bonus.join(' • ')}` : '';
              const breakingStr = (pat.conditions && pat.conditions.breaking && pat.conditions.breaking.length) ? `⚠️ Phá cách: ${pat.conditions.breaking.join(' • ')}` : '';

              return `
                <div style="padding:12px; border-radius:10px; background:var(--bg-card); border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <span style="font-weight:700; font-size:0.95rem; color:var(--accent-primary);">${pat.name}</span>
                      <span style="background:${badgeBg}; color:${badgeCol}; font-weight:700; font-size:0.7rem; padding:2px 8px; border-radius:12px;">
                        ${pat.level === 'excellent' ? 'Đại Cát 格' : pat.level === 'good' ? 'Cát Cách 格' : 'Bình Cách'}
                      </span>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin:0 0 8px 0; line-height:1.4;">${pat.description}</p>
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-tertiary); border-top:1px dashed var(--border-color); padding-top:6px; margin-top:4px;">
                    ${reqStr ? `<div>✔️ ${reqStr}</div>` : ''}
                    ${bonusStr ? `<div style="color:#10b981;">${bonusStr}</div>` : ''}
                    ${breakingStr ? `<div style="color:#ef4444;">${breakingStr}</div>` : ''}
                    <div style="font-style:italic; margin-top:2px;">📖 Nguồn: ${pat.source || 'Cổ Quyết'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    // Render Famous Person Switcher & Comparison Widget
    const renderFamousPersonWidgetHtml = () => {
      if (!window.ZiweiFamous) return '';
      const famousList = window.ZiweiFamous.getFamousList();

      return `
        <div class="card animate-fade-in" style="margin-bottom:24px; padding:18px; border:1px solid var(--border-accent); background:linear-gradient(135deg, var(--bg-card), var(--bg-surface));">
          <div style="font-size:0.8rem; font-weight:700; color:var(--accent-gold); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <span>👑 SOI CHIẾU & HOẠCH ĐỊNH VỚI LÁ SỐ DANH NHÂN</span>
            <button class="btn btn-tab btn-sm" id="btn-open-classics-reader" style="background:var(--accent-muted); color:var(--accent-primary); font-weight:600;">
              📜 Đọc Cổ Tịch Cốt Tủy Phú
            </button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
            <div style="flex:1; min-width:240px;">
              <label style="font-size:0.75rem; color:var(--text-tertiary); font-weight:600; display:block; margin-bottom:4px;">CHỌN DANH NHÂN ĐỂ LOAD LÁ SỐ</label>
              <select id="select-famous-person" class="form-input" style="width:100%;">
                <option value="">-- Chọn Lá Số Danh Nhân --</option>
                ${famousList.map(f => `
                  <option value="${f.id}" ${activeFamousId === f.id ? 'selected' : ''}>
                    👑 ${f.name} (${f.category} - ${f.description})
                  </option>
                `).join('')}
              </select>
            </div>

            <div style="display:flex; gap:8px; align-items:flex-end;">
              ${activeFamousId ? `
                <button class="btn btn-secondary btn-sm" id="btn-reset-user-chart" style="font-weight:600; height:38px;">
                  🔙 Trở Về Lá Số Cá Nhân
                </button>
              ` : ''}
            </div>
          </div>

          ${activeFamousId ? (() => {
            const f = window.ZiweiFamous.getFamousById(activeFamousId);
            return f ? `
              <div style="margin-top:12px; padding:10px 12px; background:var(--accent-muted); border:1px solid var(--border-accent); border-radius:8px; font-size:0.82rem; color:var(--accent-primary);">
                ✨ <strong>Điểm Nổi Bật Lá Số ${f.name}:</strong> ${f.notable}
              </div>
            ` : '';
          })() : ''}
        </div>
      `;
    };

    const renderChartBoardContent = () => {
      let activeTuViChart = null;

      let fpCalc = null;
      let pCalc = null;
      if (AL && AL.FourPillars) {
        try {
          const civilDate = new Date(config.year, config.month - 1, config.day, config.hour, config.minute);
          fpCalc = AL.FourPillars.calculateFourPillars(civilDate, config.lng, config.tz);
          pCalc = fpCalc ? fpCalc.pillars : null;
        } catch(e) { console.warn('FourPillars calc error:', e); }
      }

      if (activeFamousId && window.ZiweiFamous) {
        const famousRes = window.ZiweiFamous.generateFamousTuViChart(activeFamousId);
        if (famousRes && famousRes.chart) activeTuViChart = famousRes.chart;
      }
      if (!activeTuViChart && window.AstrologyLogic && typeof window.AstrologyLogic.getUserTuViChart === 'function') {
        activeTuViChart = window.AstrologyLogic.getUserTuViChart();
      }
      if (!activeTuViChart && AL && AL.TuViEngine) {
        try {
          if (pCalc) {
            activeTuViChart = AL.TuViEngine.calculateTuViChart({
              day: config.day, month: config.month, year: config.year,
              hour: config.hour, minute: config.minute, gender: config.gender,
              canNam: pCalc.year.can, chiNam: pCalc.year.chi,
              lunarDay: fpCalc.lunarDay, lunarMonth: fpCalc.lunarMonth
            });
          }
        } catch (e) { console.warn('Direct chart compute fallback error:', e); }
      }

      const palacesData = activeTuViChart ? activeTuViChart.palaces : [];
      const tb = activeTuViChart ? activeTuViChart.thienBan : null;

      const overlaySiHua = getOverlaySiHua();
      const sanFangBranches = getSanFangSiZhengBranches(selectedPalaceBranch);
      const sfSet = new Set(sanFangBranches);

      const curAge = tb ? (tb.currentAge || 25) : 25;
      const curDx = (activeTuViChart && activeTuViChart.daXians) ? (activeTuViChart.daXians.find(d => curAge >= d.startAge && curAge <= d.endAge) || activeTuViChart.daXians[0]) : null;

      let flyingSiHuaMap = {};
      let flyingPalaceName = '';
      let flyingStemName = '';
      if (activeFlyingBranch !== null) {
        const fPalace = palacesData.find(p => p.chiIdx === activeFlyingBranch);
        if (fPalace && fPalace.stem) {
          flyingPalaceName = fPalace.name;
          flyingStemName = fPalace.stem;
          const fList = AL.TuViEngine.getFlyingSiHua(fPalace.stem);
          fList.forEach(item => {
            flyingSiHuaMap[item.star] = { type: item.type, color: item.color, fromPalace: fPalace.name };
          });
        }
      }

      const flyingSiHuaBannerHtml = activeFlyingBranch !== null && flyingPalaceName ? `
        <div class="animate-fade-in" style="background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(239,68,68,0.15)); border:1px solid var(--border-accent); border-radius:10px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-weight:800; font-size:0.88rem; color:var(--accent-primary);">💫 PHI TINH TỨ HÓA CAN [${flyingStemName}] (Cung ${flyingPalaceName}):</span>
            ${Object.entries(flyingSiHuaMap).map(([star, f]) => `
              <span style="background:${f.color}25; color:${f.color}; border:1px solid ${f.color}60; padding:3px 9px; border-radius:12px; font-weight:800; font-size:0.78rem;">
                ${star} ➔ Hóa ${f.type}
              </span>
            `).join('')}
          </div>
          <button class="btn btn-sm btn-tab" id="btn-close-flying" style="background:rgba(0,0,0,0.25); color:#fff; border:1px solid rgba(255,255,255,0.2); padding:3px 10px; border-radius:12px; cursor:pointer;">
            ✖ Tắt Phi Hóa
          </button>
        </div>
      ` : '';

      const getDynamicPalaceTitle = (pItem) => {
        if (timeView === 'mingpan') return '';
        if (timeView === 'daxian' && curDx) {
          const offset = (pItem.chiIdx - curDx.branch + 12) % 12;
          const titles = ['Mệnh ĐH', 'Phụ ĐH', 'Phúc ĐH', 'Điền ĐH', 'Quan ĐH', 'Nô ĐH', 'Di ĐH', 'Tật ĐH', 'Tài ĐH', 'Tử ĐH', 'Phu ĐH', 'Huynh ĐH'];
          return `<span style="font-size:0.68rem; background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid rgba(245,158,11,0.35); border-radius:4px; padding:1px 4px; font-weight:700;">[${titles[offset]}]</span>`;
        }
        if (timeView === 'liunian' || timeView === 'liuyue') {
          const yearBranch = ((currentLiunianYear - 4) % 12 + 12) % 12;
          const offset = (pItem.chiIdx - yearBranch + 12) % 12;
          const titles = ['Mệnh LN', 'Phụ LN', 'Phúc LN', 'Điền LN', 'Quan LN', 'Nô LN', 'Di LN', 'Tật LN', 'Tài LN', 'Tử LN', 'Phu LN', 'Huynh LN'];
          return `<span style="font-size:0.68rem; background:rgba(59,130,246,0.2); color:#3b82f6; border:1px solid rgba(59,130,246,0.35); border-radius:4px; padding:1px 4px; font-weight:700;">[${titles[offset]}]</span>`;
        }
        return '';
      };

      container.innerHTML = `
        <div class="header-section animate-fade-in" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--accent-primary); letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
            <span>🔮 TỬ VI ĐẨU SỐ & TỨ TRỤ BÁT TỰ</span>
          </div>
          <h1 class="page-title" style="margin-bottom: 6px;">Lá Số Tử Vi & Vận Hạn Định Vị</h1>
          <p class="page-subtitle" style="margin-bottom: 0;">Tra cứu Bàn Số 12 Cung, Tứ Trụ Bát Tự 10 Thần và Hiệu chỉnh Giờ Mặt Trời Thực.</p>
        </div>

        <div class="tuvi-card animate-fade-in mb-lg" style="margin-bottom:24px;">
          <div class="tuvi-card-header" style="flex-wrap:wrap; gap:12px;">
            <div class="tuvi-card-title-group">
              <div class="tuvi-card-icon">🔮</div>
              <div>
                <div class="tuvi-card-title">Bàn Số 12 Cung Interactive</div>
                <div class="tuvi-card-subtitle">Chọn 1 Cung xem Tam Phương Tứ Chính • Click nút 💫 để xem Phi Tinh Tứ Hóa</div>
              </div>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-tab btn-sm" id="btn-open-chart-config" style="background:var(--accent-muted); color:var(--accent-primary); border:1px solid var(--border-accent); font-weight:600;">
                ⚙️ Cấu Hình Lá Số
              </button>
              <button class="btn btn-tab btn-sm" id="btn-copy-raw-ai" style="background:var(--bg-card); color:var(--text-primary); border:1px solid var(--border-color); font-weight:600;">
                📋 Copy Data AI
              </button>
              <button class="btn btn-primary btn-sm" id="btn-open-matrix-all">🌐 Xem 100 Mục Luận Giải</button>
            </div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--bg-surface); padding:8px 12px; border-radius:10px; border:1px solid var(--border-color); margin-bottom:12px; flex-wrap:wrap;">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn btn-sm ${timeView === 'mingpan' ? 'btn-primary' : 'btn-tab'}" id="tv-btn-mingpan">
                ☯ Bản Mệnh
              </button>
              <button class="btn btn-sm ${timeView === 'daxian' ? 'btn-primary' : 'btn-tab'}" id="tv-btn-daxian">
                ⏳ Đại Hạn ${curDx ? `[${curDx.startAge}–${curDx.endAge}t]` : ''}
              </button>
              <div style="display:flex; align-items:center; gap:4px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:6px; padding:0 6px;">
                <button class="btn btn-sm" id="tv-btn-liunian" style="background:none; border:none; padding:4px 6px; font-weight:600; color:${timeView === 'liunian' ? 'var(--accent-primary)' : 'var(--text-secondary)'};">
                  📅 Lưu Niên ${currentLiunianYear}
                </button>
                <button id="tv-year-prev" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:0.9rem; padding:2px 4px;">‹</button>
                <button id="tv-year-next" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:0.9rem; padding:2px 4px;">›</button>
              </div>
              <div style="display:flex; align-items:center; gap:4px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:6px; padding:0 6px;">
                <button class="btn btn-sm" id="tv-btn-liuyue" style="background:none; border:none; padding:4px 6px; font-weight:600; color:${timeView === 'liuyue' ? 'var(--accent-primary)' : 'var(--text-secondary)'};">
                  🌙 Lưu Nguyệt T${currentLiuyueMonth}
                </button>
                <button id="tv-month-prev" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:0.9rem; padding:2px 4px;">‹</button>
                <button id="tv-month-next" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:0.9rem; padding:2px 4px;">›</button>
              </div>
            </div>

            <div style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">
              ${timeView === 'mingpan' ? '✨ Tứ Hóa Nguồn: Theo Can NĂM SINH' :
                timeView === 'daxian' ? `✨ Tứ Hóa Đại Hạn: Theo Can [${curDx ? curDx.stem : ''}] Cung ${curDx ? curDx.name : ''}` :
                timeView === 'liuyue' ? `✨ Tứ Hóa Lưu Nguyệt T${currentLiuyueMonth}/${currentLiunianYear}` :
                `✨ Tứ Hóa Lưu Niên ${currentLiunianYear}: Theo Can [${AL.TuViEngine.CAN_NAMES[((currentLiunianYear-4)%10+10)%10]}]`}
            </div>
          </div>

          ${flyingSiHuaBannerHtml}

          <div style="background:linear-gradient(135deg, var(--bg-card), var(--bg-secondary)); border:1px dashed var(--border-accent); border-radius:var(--radius-md); padding:16px; box-shadow:var(--shadow-sm); margin-bottom:14px;">
            <div style="text-align:center; margin-bottom:12px;">
              <div style="font-family:var(--font-heading); font-weight:700; font-size:1.15rem; color:var(--accent-primary); letter-spacing:0.05em;">
                ${config.gender === 'Nam' ? 'DƯƠNG NAM' : 'ÂM NỮ'} ${pCalc ? `${pCalc.year.can} ${pCalc.year.chi}`.toUpperCase() : 'CANH THÌN'}
              </div>
              <div style="font-size:0.875rem; color:var(--text-primary); font-weight:600; margin:2px 0;">
                ${tb ? `${tb.cucName} — ${tb.amDuongLy}` : 'Bạch Lạp Kim — Hỏa Lục Cục'}
              </div>
              <div style="font-size:0.78rem; color:var(--accent-primary); font-weight:600; margin-bottom:4px;">
                ${tb ? `🔮 ${tb.menhCucRel} • Mệnh cư ${tb.menhChi}, Thân cư ${tb.thanChi}` : ''}
              </div>
              <div style="font-size:0.78rem; color:var(--text-tertiary);">
                📍 ${config.locationName} (${config.lng}°E) • Giờ Mặt Trời Thực: <strong>${fpCalc ? fpCalc.trueSolarDate.getHours() : config.hour}:${fpCalc ? fpCalc.trueSolarDate.getMinutes().toString().padStart(2,'0') : config.minute}</strong> (${fpCalc && fpCalc.deltaMinutes >= 0 ? '+' : ''}${fpCalc ? fpCalc.deltaMinutes : 0}m) • Chính Ngọ: ${fpCalc ? fpCalc.noonStr : '12:00'}
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; background:var(--bg-surface); padding:10px; border-radius:8px; border:1px solid var(--border-color); text-align:center;">
              <div style="padding:6px; background:var(--bg-card); border-radius:6px; border:1px solid var(--border-color);">
                <div style="font-size:0.7rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">TRỤ NĂM</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary); margin:2px 0;">${p ? p.year.can : 'Canh'} ${p ? p.year.chi : 'Thìn'}</div>
                <div style="font-size:0.72rem; color:#22c55e; font-weight:600;">${p ? p.year.tenGod : 'Thất Sát'}</div>
              </div>
              <div style="padding:6px; background:var(--bg-card); border-radius:6px; border:1px solid var(--border-color);">
                <div style="font-size:0.7rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">TRỤ THÁNG</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary); margin:2px 0;">${p ? p.month.can : 'Bính'} ${p ? p.month.chi : 'Thìn'}</div>
                <div style="font-size:0.72rem; color:#3b82f6; font-weight:600;">${p ? p.month.tenGod : 'Thực Thần'}</div>
              </div>
              <div style="padding:6px; background:var(--accent-muted); border-radius:6px; border:1px solid var(--border-accent);">
                <div style="font-size:0.7rem; font-weight:700; color:var(--accent-primary); text-transform:uppercase;">NGÀY</div>
                <div style="font-weight:800; font-size:0.95rem; color:var(--accent-primary); margin:2px 0;">${p ? p.day.can : 'Giáp'} ${p ? p.day.chi : 'Tuất'}</div>
                <div style="font-size:0.72rem; color:var(--accent-primary); font-weight:700;">★ Nhật Nguyên</div>
              </div>
              <div style="padding:6px; background:var(--bg-card); border-radius:6px; border:1px solid var(--border-color);">
                <div style="font-size:0.7rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">TRỤ GIỜ</div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary); margin:2px 0;">${p ? p.hour.can : 'Canh'} ${p ? p.hour.chi : 'Tuất'}</div>
                <div style="font-size:0.72rem; color:#ef4444; font-weight:600;">${p ? p.hour.tenGod : 'Thất Sát'}</div>
              </div>
            </div>
          </div>

          <div style="position:relative;">
            <div class="tuvi-desktop-grid desktop-only" style="display:grid;grid-template-columns:repeat(4, 1fr);grid-template-rows:repeat(4, minmax(130px, auto));gap:10px;background:var(--bg-tertiary);padding:14px;border-radius:var(--radius-lg);border:1px solid var(--border-color);position:relative;">
              
              <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:5;">
                ${(() => {
                  const p0 = BRANCH_SVG_POS[sanFangBranches[0]];
                  const p1 = BRANCH_SVG_POS[sanFangBranches[1]];
                  const p2 = BRANCH_SVG_POS[sanFangBranches[2]];
                  const p3 = BRANCH_SVG_POS[sanFangBranches[3]];
                  const stroke = "rgba(59, 130, 246, 0.65)";
                  const sw = "2";
                  const dash = "6,4";

                  return `
                    <line x1="${p0[0]}%" y1="${p0[1]}%" x2="${p1[0]}%" y2="${p1[1]}%" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" />
                    <line x1="${p0[0]}%" y1="${p0[1]}%" x2="${p2[0]}%" y2="${p2[1]}%" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" />
                    <line x1="${p2[0]}%" y1="${p2[1]}%" x2="${p3[0]}%" y2="${p3[1]}%" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" />
                    <line x1="${p3[0]}%" y1="${p3[1]}%" x2="${p0[0]}%" y2="${p0[1]}%" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}" />
                    ${[p0, p1, p2, p3].map((pt, i) => `
                      <circle cx="${pt[0]}%" cy="${pt[1]}%" r="${i===0 ? 5 : 4}" fill="${i===0 ? 'var(--accent-primary)' : 'rgba(59, 130, 246, 0.8)'}" />
                    `).join('')}
                  `;
                })()}
              </svg>

              <div class="tuvi-center-cell" style="grid-column: 2 / span 2; grid-row: 2 / span 2; background: linear-gradient(135deg, var(--bg-card), var(--bg-surface)); border: 2px solid var(--border-accent); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; justify-content: space-between; position: relative; z-index: 10; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div style="text-align: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px; margin-bottom: 6px;">
                  <div style="font-family: var(--font-heading); font-weight: 800; font-size: 1.1rem; color: var(--accent-primary); letter-spacing: 0.08em; text-transform: uppercase;">
                    ☯ THIÊN BÀN TỬ VI
                  </div>
                  <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-top: 2px;">
                    ${config.gender === 'Nam' ? 'DƯƠNG NAM' : 'ÂM NỮ'} • ${p ? `${p.year.can} ${p.year.chi}`.toUpperCase() : ''} (${tb ? tb.cucName : ''})
                  </div>
                  <div style="font-size: 0.78rem; color: var(--accent-primary); font-weight: 600; margin-top: 2px;">
                    ${tb ? `🔮 ${tb.menhCucRel}` : ''}
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.72rem; background: var(--bg-surface); padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 6px;">
                  <div>📍 Mệnh: <strong>Cung ${tb ? tb.menhChi : ''}</strong></div>
                  <div>📍 Thân: <strong>Cung ${tb ? tb.thanChi : ''}</strong></div>
                  <div>👑 Mệnh chủ: <strong>${tb ? tb.menhChu : ''}</strong></div>
                  <div>🌟 Thân chủ: <strong>${tb ? tb.thanChu : ''}</strong></div>
                </div>

                <div style="background:var(--bg-surface); padding:8px; border-radius:8px; border:1px solid var(--border-accent); margin-bottom:6px;">
                  <div style="font-size:0.68rem; font-weight:800; color:var(--accent-primary); text-transform:uppercase; margin-bottom:4px; text-align:center; letter-spacing:0.05em;">
                    🎮 BỘ ĐIỀU KHIỂN VẬN HẠN ĐỘNG (IZTRO CONTROL)
                  </div>
                  <div style="display:flex; justify-content:center; gap:6px; align-items:center; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; background:var(--bg-card); border:1px solid var(--border-color); border-radius:6px; padding:2px 4px;">
                      <button id="ctrl-yr-prev" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; font-weight:800; font-size:0.85rem; padding:1px 4px;">‹</button>
                      <span style="font-size:0.75rem; font-weight:700; color:var(--text-primary); min-width:68px; text-align:center;">Năm ${currentLiunianYear}</span>
                      <button id="ctrl-yr-next" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; font-weight:800; font-size:0.85rem; padding:1px 4px;">›</button>
                    </div>
                    <div style="display:flex; align-items:center; background:var(--bg-card); border:1px solid var(--border-color); border-radius:6px; padding:2px 4px;">
                      <button id="ctrl-mo-prev" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; font-weight:800; font-size:0.85rem; padding:1px 4px;">‹</button>
                      <span style="font-size:0.75rem; font-weight:700; color:var(--text-primary); min-width:64px; text-align:center;">Tháng ${currentLiuyueMonth}</span>
                      <button id="ctrl-mo-next" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; font-size:0.85rem; padding:1px 4px;">›</button>
                    </div>
                  </div>
                </div>

                <div style="font-size: 0.68rem; color: var(--text-tertiary); text-align: center;">
                  📍 ${config.locationName} (${config.lng}°E) • MT Thực: <strong>${fp ? fp.trueSolarDate.getHours() : config.hour}:${fp ? fp.trueSolarDate.getMinutes().toString().padStart(2,'0') : config.minute}</strong>
                </div>
              </div>

              ${palacesData.map(pItem => {
                const count = (window.TUVI_DATA || []).filter(d => d.palace === pItem.id).length;
                const isMenh = pItem.isMenh;
                const isThan = pItem.isThan;
                const isSelected = pItem.chiIdx === selectedPalaceBranch;
                const isSanFang = sfSet.has(pItem.chiIdx) && !isSelected;
                const isFlyingSource = activeFlyingBranch === pItem.chiIdx;
                const dynamicTitle = getDynamicPalaceTitle(pItem);

                let borderStyle = '1px solid var(--border-color)';
                let bgStyle = 'var(--bg-card)';
                if (isFlyingSource) {
                  borderStyle = '2px solid #10b981';
                  bgStyle = 'rgba(16, 185, 129, 0.12)';
                } else if (isSelected) {
                  borderStyle = '2px solid var(--accent-primary)';
                  bgStyle = 'var(--accent-muted)';
                } else if (isSanFang) {
                  borderStyle = '1px dashed var(--accent-primary)';
                  bgStyle = 'rgba(59, 130, 246, 0.08)';
                } else if (isMenh || isThan) {
                  borderStyle = '1px solid var(--border-accent)';
                  bgStyle = 'var(--bg-secondary)';
                }

                return `
                  <div class="palace-cell" data-branch="${pItem.chiIdx}" data-palace-id="${pItem.id}" style="${pItem.pos}background:${bgStyle};border:${borderStyle};border-radius:var(--radius-md);padding:10px;cursor:pointer;transition:all 0.2s ease;display:flex;flex-direction:column;justify-content:space-between;min-height:115px;position:relative;z-index:10;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
                      <span style="font-family:var(--font-heading);font-weight:800;font-size:0.88rem;color:${isSelected || isMenh ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                        ${pItem.name} ${isThan && !isMenh ? '<span style="color:var(--accent-gold);font-size:0.72rem;">(Thân)</span>' : ''} ${dynamicTitle}
                      </span>
                      <button class="btn-trigger-flying" data-branch="${pItem.chiIdx}" style="background:var(--accent-muted);border:1px solid var(--border-accent);color:var(--accent-primary);border-radius:4px;padding:1px 4px;font-size:0.68rem;font-weight:700;cursor:pointer;" title="Bấm để Phi Tinh Tứ Hóa từ Can ${pItem.stem}">
                        💫 [${pItem.stem||''}${pItem.chi}]
                      </button>
                    </div>
                    <div style="font-size:0.8125rem;color:var(--text-secondary);margin:6px 0;line-height:1.3;">
                      ${formatPalaceStarsHtml(pItem, false, overlaySiHua, flyingSiHuaMap)}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.72rem;color:var(--accent-primary);font-weight:600;">
                      <span>${count} mục</span>
                      <span>${isSelected ? '🎯 Tam Phương' : isFlyingSource ? '🟢 Nguồn Phi Hóa' : '🔍 Bấm chọn'}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="tuvi-mobile-view mobile-only">
            <div class="card" style="margin-bottom:14px; padding:14px; background:linear-gradient(135deg, var(--bg-card), var(--bg-surface)); border:1px solid var(--border-accent);">
              <div style="font-family:var(--font-heading); font-weight:800; font-size:1rem; color:var(--accent-primary); text-transform:uppercase; text-align:center; margin-bottom:6px;">
                ☯ THIÊN BÀN TỬ VI (Ô GIỮA)
              </div>
              <div style="text-align:center; font-size:0.85rem; color:var(--text-primary); font-weight:700; margin-bottom:4px;">
                ${config.gender === 'Nam' ? 'DƯƠNG NAM' : 'ÂM NỮ'} • ${pCalc ? `${pCalc.year.can} ${pCalc.year.chi}`.toUpperCase() : ''} (${tb ? tb.cucName : ''})
              </div>
              <div style="text-align:center; font-size:0.75rem; color:var(--accent-primary); margin-bottom:10px;">
                ${tb ? `🔮 Mệnh: Cung ${tb.menhChi} • Thân: Cung ${tb.thanChi} • ${tb.menhCucRel}` : ''}
              </div>
              <div style="display:flex; justify-content:center; gap:8px; margin-bottom:10px;">
                <div style="display:flex; align-items:center; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:2px 8px;">
                  <button id="mob-yr-prev" style="background:none; border:none; color:var(--accent-primary); font-weight:800;">‹</button>
                  <span style="font-size:0.8rem; font-weight:700; padding:0 6px;">Năm ${currentLiunianYear}</span>
                  <button id="mob-yr-next" style="background:none; border:none; color:var(--accent-primary); font-weight:800;">›</button>
                </div>
                <div style="display:flex; align-items:center; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:2px 8px;">
                  <button id="mob-mo-prev" style="background:none; border:none; color:var(--accent-primary); font-weight:800;">‹</button>
                  <span style="font-size:0.8rem; font-weight:700; padding:0 6px;">Tháng ${currentLiuyueMonth}</span>
                  <button id="mob-mo-next" style="background:none; border:none; color:var(--accent-primary); font-weight:800;">›</button>
                </div>
              </div>
            </div>

            <div class="cung-tab-bar" id="mobile-cung-tabs">
              <button class="cung-tab-btn active" data-filter="all">Tất Cả 12 Cung</button>
              <button class="cung-tab-btn" data-filter="menh-tai-quan">Mệnh - Tài - Quan</button>
              <button class="cung-tab-btn" data-filter="than-di-phuc">Thân - Di - Phúc</button>
              <button class="cung-tab-btn" data-filter="phu-tu-no">Phụ - Tử - Nô</button>
              <button class="cung-tab-btn" data-filter="dien-tat-huynh">Điền - Tật - Huynh</button>
            </div>

            <div class="mobile-palace-grid">
              ${palacesData.map(pItem => {
                const count = (window.TUVI_DATA || []).filter(d => d.palace === pItem.id).length;
                const isMenh = pItem.isMenh;
                const isThan = pItem.isThan;
                let groupClass = 'all';
                if (['menh', 'tai-bach', 'quan-loc'].includes(pItem.id)) groupClass += ' menh-tai-quan';
                if (['phuc-duc', 'thien-di', 'phu-the'].includes(pItem.id)) groupClass += ' than-di-phuc';
                if (['phu-mau', 'tu-tuc', 'no-boc'].includes(pItem.id)) groupClass += ' phu-tu-no';
                if (['dien-trach', 'tat-ach', 'huynh-de'].includes(pItem.id)) groupClass += ' dien-tat-huynh';

                return `
                  <div class="mobile-palace-card palace-cell ${isMenh ? 'is-menh' : ''} ${isThan ? 'is-than' : ''}" data-group="${groupClass}" data-palace-id="${pItem.id}" data-branch="${pItem.chiIdx}">
                    <div class="mobile-palace-header">
                      <div class="mobile-palace-title">
                        ${pItem.name} ${getDynamicPalaceTitle(pItem)}
                        ${isMenh ? '<span class="mobile-palace-badge">Mệnh Bàn</span>' : ''}
                        ${isThan ? '<span class="mobile-palace-badge" style="background:var(--accent-gold-muted);color:var(--accent-gold);">Thân Cư</span>' : ''}
                      </div>
                      <button class="btn-trigger-flying" data-branch="${pItem.chiIdx}" style="background:var(--accent-muted);border:1px solid var(--border-accent);color:var(--accent-primary);border-radius:4px;padding:2px 6px;font-size:0.7rem;font-weight:700;">
                        💫 Phi Hóa Can [${pItem.stem}]
                      </button>
                    </div>
                    <div class="mobile-palace-star">✨ Sao Chủ: <div style="margin-top:4px;">${formatPalaceStarsHtml(pItem, true, overlaySiHua, flyingSiHuaMap)}</div></div>
                    <div class="mobile-palace-footer">
                      <span>📚 ${count} bài luận giải</span>
                      <span>Xem Chi Tiết ➔</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        ${renderPatternsHtml()}
        ${renderFamousPersonWidgetHtml()}
        ${renderMarriageWidgetHtml()}
        ${renderAITopicConsultationPanelHtml()}

        <div class="card animate-fade-in" style="margin-bottom:24px; padding:18px; border:1px solid var(--border-color);">
          <div style="font-size:0.78rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
            <span>ℹ️</span> TỔNG QUAN LÁ SỐ TỬ VI & TỨ TRỤ
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;">
            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color); text-align:center;">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase;">BẢN MỆNH & CHI</div>
              <strong style="font-size:0.95rem; color:var(--accent-primary);">Mệnh cư ${tb ? tb.menhChi : 'Tý'}</strong>
            </div>
            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color); text-align:center;">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase;">BỘ CỤC</div>
              <strong style="font-size:0.95rem; color:var(--text-primary);">${tb ? tb.cucName : 'Hỏa Lục Cục'}</strong>
            </div>
            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color); text-align:center;">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase;">ÂM / DƯƠNG</div>
              <strong style="font-size:0.95rem; color:var(--text-primary);">${config.gender === 'Nam' ? 'Dương Nam' : 'Âm Nữ'} (${tb ? tb.amDuongLy : 'Thuận lý'})</strong>
            </div>
            <div style="padding:10px; border-radius:8px; background:var(--bg-surface); border:1px solid var(--border-color); text-align:center;">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase;">SINH KHẮC</div>
              <strong style="font-size:0.95rem; color:#22c55e;">${tb ? tb.menhCucRel.split(' (')[0] : 'Cục Sinh Mệnh'}</strong>
            </div>
          </div>

          <div style="padding:10px; border-radius:8px; background:var(--accent-muted); border:1px solid var(--border-accent); text-align:center; font-size:0.88rem; color:var(--accent-primary); font-weight:600;">
            Mệnh cư <strong>${tb ? tb.menhChi : 'Tý'}</strong> | Thân cư <strong>${tb ? `${tb.thanChi} (${tb.thanPalaceId})` : 'Dần'}</strong> | Bộ Cục: <strong>${tb ? tb.cucName : 'Hỏa Lục Cục'}</strong>
          </div>
        </div>

        <div class="segmented-tabs animate-fade-in" style="margin-bottom: 20px;">
          <button class="segmented-tab active" id="tab-vanhan"><span>📜</span> Vận Hạn Định Vị</button>
          <button class="segmented-tab" id="tab-laban"><span>🧭</span> La Bàn & Nhân Sự</button>
        </div>

        <div id="astrology-content" class="animate-slide-up" style="animation-delay: 0.1s"></div>
      `;

      container.querySelector('#btn-open-chart-config')?.addEventListener('click', () => {
        openChartConfigModal(() => renderAstrologyChart(container));
      });

      container.querySelector('#btn-copy-raw-ai')?.addEventListener('click', () => {
        copyChartRawDataForAI();
      });

      // Bind Classics Reader & Famous Person Handlers
      container.querySelector('#btn-open-classics-reader')?.addEventListener('click', () => {
        openClassicsReaderModal();
      });

      container.querySelector('#select-famous-person')?.addEventListener('change', (e) => {
        activeFamousId = e.target.value || null;
        renderChartBoardContent();
      });

      container.querySelector('#btn-reset-user-chart')?.addEventListener('click', () => {
        activeFamousId = null;
        renderChartBoardContent();
      });

      // Bind Star Item Clicks for Star Detail Modal
      container.querySelectorAll('.star-item-clickable').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const starName = el.dataset.star;
          if (starName) openStarDetailModal(starName);
        });
      });

      // Bind AI Topic Buttons
      container.querySelectorAll('.btn-ai-topic').forEach(btn => {
        btn.addEventListener('click', () => {
          const topic = btn.dataset.topic;
          if (topic) openAITopicPromptModal(topic);
        });
      });

      // Time Navigation Button Handlers
      container.querySelector('#tv-btn-mingpan')?.addEventListener('click', () => {
        timeView = 'mingpan';
        renderChartBoardContent();
      });

      container.querySelector('#tv-btn-daxian')?.addEventListener('click', () => {
        timeView = 'daxian';
        renderChartBoardContent();
      });

      container.querySelector('#tv-btn-liunian')?.addEventListener('click', () => {
        timeView = 'liunian';
        renderChartBoardContent();
      });

      container.querySelector('#tv-year-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLiunianYear--;
        timeView = 'liunian';
        renderChartBoardContent();
      });

      container.querySelector('#tv-year-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLiunianYear++;
        timeView = 'liunian';
        renderChartBoardContent();
      });

      // Mobile Palace Tab Filtering
      const mobileTabs = container.querySelectorAll('#mobile-cung-tabs .cung-tab-btn');
      mobileTabs.forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          const filter = tabBtn.dataset.filter;
          mobileTabs.forEach(b => b.classList.remove('active'));
          tabBtn.classList.add('active');

          container.querySelectorAll('.mobile-palace-card').forEach(card => {
            if (filter === 'all') {
              card.style.display = 'block';
            } else {
              const groups = card.dataset.group.split(' ');
              card.style.display = groups.includes(filter) ? 'block' : 'none';
            }
          });
        });
      });

      // Bind Palace Cell Click: Update Tam Phương Tứ Chính selection
      container.querySelectorAll('.palace-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const bIdx = parseInt(cell.dataset.branch);
          if (!isNaN(bIdx)) {
            selectedPalaceBranch = bIdx;
            renderChartBoardContent();
          }
        });
      });

      container.querySelector('#btn-open-matrix-all')?.addEventListener('click', () => {
        if (window.switchAstrologySubTab) {
          window.switchAstrologySubTab('overview', { palace: 'all' });
        }
      });

      const content = container.querySelector('#astrology-content');
      renderVanHanForm(content);

      const tabVanhan = container.querySelector('#tab-vanhan');
      const tabLaban = container.querySelector('#tab-laban');

      tabVanhan?.addEventListener('click', () => {
        tabVanhan.classList.add('active');
        tabLaban.classList.remove('active');
        renderVanHanForm(content);
      });

      tabLaban?.addEventListener('click', () => {
        tabLaban.classList.add('active');
        tabVanhan.classList.remove('active');
        renderLaBanForm(content);
      });
    };

    renderChartBoardContent();
  }

  window.renderAstrologyChartStandalone = renderAstrologyChart;


  function renderVanHanForm(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h2 class="card-title" style="margin-bottom: 20px;">Nhập Thông Tin</h2>
          
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Địa Chi Năm Sinh</label>
              <select id="chiNamSinh" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
                ${window.AstrologyLogic.CHI.map(chi => `<option value="${chi}" ${chi === 'Thìn' ? 'selected' : ''}>${chi}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Giới Tính</label>
              <select id="gioiTinh" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Tháng Sinh (Âm lịch)</label>
              <input type="number" id="thangSinh" class="form-input" min="1" max="12" value="1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Giờ Sinh</label>
              <select id="gioSinh" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
                ${window.AstrologyLogic.CUNG.map((cung, idx) => `<option value="${idx}" ${cung === 'Mùi' ? 'selected' : ''}>${cung}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="border-top: 1px dashed var(--border-color); margin: 20px 0;"></div>
          
          <h3 style="font-size: 1.1rem; margin-bottom: 15px;">Thời điểm cần xem (Âm lịch)</h3>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Số Tuổi (Năm xem hạn)</label>
              <input type="number" id="namXem" class="form-input" min="1" max="120" value="30" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Tháng xem (1-12)</label>
              <input type="number" id="thangXem" class="form-input" min="1" max="12" value="1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Ngày mùng (1-30)</label>
              <input type="number" id="ngayXem" class="form-input" min="1" max="30" value="1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
            </div>
          </div>

          <button id="btn-calc-vanhan" class="btn btn-primary" style="width: 100%; padding: 12px;">Định Vị Vận Hạn</button>
        </div>
      </div>
      
      <div id="vanhan-result" style="margin-top: 20px; display: none;"></div>
    `;

    document.getElementById('btn-calc-vanhan').addEventListener('click', () => {
      const chiNamSinh = document.getElementById('chiNamSinh').value;
      const gioiTinh = document.getElementById('gioiTinh').value;
      const thangSinh = parseInt(document.getElementById('thangSinh').value);
      const gioSinhIdx = parseInt(document.getElementById('gioSinh').value);
      
      const namXem = parseInt(document.getElementById('namXem').value);
      const thangXem = parseInt(document.getElementById('thangXem').value);
      const ngayXem = parseInt(document.getElementById('ngayXem').value);

      const tieuHanCung = window.AstrologyLogic.tinhTieuHan(chiNamSinh, namXem, gioiTinh);
      const nguyetHanCung = window.AstrologyLogic.tinhNguyetHan(tieuHanCung, thangSinh, gioSinhIdx, thangXem);
      const nhatHanCung = window.AstrologyLogic.tinhNhatHan(nguyetHanCung, ngayXem);

      renderVanHanResult(tieuHanCung, nguyetHanCung, nhatHanCung);
    });
  }

  function renderVanHanResult(tieuHanCung, nguyetHanCung, nhatHanCung) {
    const container = document.getElementById('vanhan-result');
    container.style.display = 'block';
    
    const CUNG = window.AstrologyLogic.CUNG;

    container.innerHTML = `
      <div class="card animate-scale-in">
        <div class="card-body">
          <h3 style="margin-bottom: 15px; color: var(--primary-light);">Kết quả định vị</h3>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="background: var(--bg-surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 1.1rem;">Tiểu Hạn (Năm nay)</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">Ảnh hưởng tổng quan cả năm</div>
              </div>
              <div style="font-size: 1.2rem; color: var(--primary-color); font-weight: bold; background: rgba(59, 130, 246, 0.1); padding: 5px 15px; border-radius: 20px;">
                Cung ${CUNG[tieuHanCung]}
              </div>
            </div>

            <div style="background: var(--bg-surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 1.1rem;">Nguyệt Hạn (Tháng này)</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">Cát hung trong tháng xem</div>
              </div>
              <div style="font-size: 1.2rem; color: var(--success-color); font-weight: bold; background: rgba(16, 185, 129, 0.1); padding: 5px 15px; border-radius: 20px;">
                Cung ${CUNG[nguyetHanCung]}
              </div>
            </div>

            <div style="background: var(--bg-surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 1.1rem;">Nhật Hạn (Ngày này)</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">Vận khí trong ngày cụ thể</div>
              </div>
              <div style="font-size: 1.2rem; color: var(--warning-color, #f59e0b); font-weight: bold; background: rgba(245, 158, 11, 0.1); padding: 5px 15px; border-radius: 20px;">
                Cung ${CUNG[nhatHanCung]}
              </div>
            </div>
          </div>
          
          <div style="margin-top: 20px; font-size: 0.9rem; color: var(--text-muted); text-align: center;">
            * Đây là các cung định vị vận hạn trên địa bàn. Để luận đoán chi tiết, cần kết hợp xem các Cát tinh/Hung tinh và Sao Lưu tại cung đó trên lá số Tử Vi hoàn chỉnh.
          </div>
        </div>
      </div>
    `;
  }

  function renderLaBanForm(container) {
    container.innerHTML = `
      <div class="card mb-md animate-scale-in" style="margin-bottom: var(--space-xl);">
        <div class="card-body">
          <h2 class="card-title" style="margin-bottom: 15px;">🧭 La Bàn Phương Hướng</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
            Nhập Mệnh của bạn để xem các hướng tốt/xấu lành theo Bát Quái.
          </p>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <select id="userMenh" class="form-input" style="width: 200px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
              <option value="Kim" selected>Kim (Bạch Lạp Kim)</option>
              <option value="Mộc">Mộc</option>
              <option value="Thủy">Thủy</option>
              <option value="Hỏa">Hỏa</option>
              <option value="Thổ">Thổ</option>
            </select>
            <button id="btn-calc-laban" class="btn btn-primary">Xem Hướng</button>
          </div>
          <div id="laban-result" style="display: none; margin-top: 20px;"></div>
        </div>
      </div>

      <div class="card animate-scale-in">
        <div class="card-body">
          <h2 class="card-title" style="margin-bottom: 15px;">🤝 La Bàn Nhân Sự (Tương Hợp)</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
            Đánh giá mức độ hợp tác/khắc chế giữa bạn và đối tác theo Ngũ Hành sinh khắc.
          </p>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; margin-bottom: 15px; align-items: flex-end;">
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Can Năm Sinh Đối Tác</label>
              <select id="doiTacCan" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
                ${window.AstrologyLogic.CAN.map(can => `<option value="${can}">${can}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 0.9rem;">Chi Năm Sinh Đối Tác</label>
              <select id="doiTacChi" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-base);">
                ${window.AstrologyLogic.CHI.map(chi => `<option value="${chi}">${chi}</option>`).join('')}
              </select>
            </div>
            <div>
              <button id="btn-calc-nhansu" class="btn btn-primary" style="padding: 10px 20px; height: 100%;">Phân Tích</button>
            </div>
          </div>
          <div id="nhansu-result" style="display: none; margin-top: 20px;"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-calc-laban').addEventListener('click', () => {
      const menh = document.getElementById('userMenh').value;
      const huong = window.AstrologyLogic.tinhHuongTot(menh);
      
      const resultDiv = document.getElementById('laban-result');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-color); border-radius: 8px; padding: 15px;">
            <h4 style="color: var(--success-color); margin-bottom: 10px;">✅ Hướng Cát (Nên dùng)</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${huong.tot.map(h => `<span style="background: var(--success-color); color: #fff; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">${h}</span>`).join('')}
            </div>
          </div>
          <div style="flex: 1; min-width: 200px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error-color); border-radius: 8px; padding: 15px;">
            <h4 style="color: var(--error-color); margin-bottom: 10px;">❌ Hướng Hung (Cần tránh)</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${huong.xau.map(h => `<span style="background: var(--error-color); color: #fff; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">${h}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    });

    document.getElementById('btn-calc-nhansu').addEventListener('click', () => {
      const menhBan = document.getElementById('userMenh').value;
      const can = document.getElementById('doiTacCan').value;
      const chi = document.getElementById('doiTacChi').value;
      
      const menhDoiTac = window.AstrologyLogic.tinhMenhTuCanChi(can, chi);
      const tuongHop = window.AstrologyLogic.tuongHopNhanSu(menhBan, menhDoiTac);
      
      const resultDiv = document.getElementById('nhansu-result');
      resultDiv.style.display = 'block';
      
      let badgeColor = 'var(--info-color)';
      if (tuongHop.level === 'Rất Tốt') badgeColor = 'var(--success-color)';
      else if (tuongHop.level === 'Rất Xấu' || tuongHop.level === 'Kém') badgeColor = 'var(--error-color)';
      else if (tuongHop.level === 'Khá') badgeColor = 'var(--primary-color)';

      resultDiv.innerHTML = `
        <div style="background: var(--bg-surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <span style="color: var(--text-muted); font-size: 0.9rem;">Mệnh của đối tác (${can} ${chi}):</span>
              <span style="font-weight: bold; font-size: 1.1rem; margin-left: 5px; color: var(--primary-light);">${menhDoiTac}</span>
            </div>
            <span style="background: ${badgeColor}; color: #fff; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem;">
              ${tuongHop.level} (${tuongHop.type})
            </span>
          </div>
          <p style="color: var(--text-primary); line-height: 1.6; font-style: italic;">
            "${tuongHop.desc}"
          </p>
        </div>
      `;
    });
  }

  function renderLifeBalanceTab(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="padding:10px 0;">
        <div class="tuvi-card" style="text-align:center; padding:32px 20px; background:linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));">
          <div style="font-size:2.5rem; margin-bottom:12px;">🕸️</div>
          <h3 class="card-title" style="font-size:1.2rem; color:var(--text-primary); margin-bottom:8px;">
            Bảng Cân Bằng "Năng Lượng Sống" 6 Trụ Cột (Life Balance Hub)
          </h3>
          <p class="card-text" style="max-width:560px; margin:0 auto 20px auto; color:var(--text-secondary); line-height:1.6; font-size:0.88rem;">
            Công cụ vẽ biểu đồ Dual-Layer Radar Engine 6 Trụ Cột (Thân Tâm, Sự Nghiệp, Gia Đạo, Mối Quan Hệ, Tài Chính, Tri Thức) hiện được tích hợp tập trung tại <strong>Lịch Ngày Tốt Master Hub (Dashboard)</strong> để hỗ trợ Check-in và cập nhật điểm số hàng ngày.
          </p>
          <button class="btn btn-primary" onclick="if(window.App && window.App.Router) window.App.Router.navigate('dashboard');">
            🏠 Mở Bảng Check-in 6 Trụ Cột Tại Dashboard ➔
          </button>
        </div>
      </div>
    `;
  }

  // Export
  window.renderAstrology = renderAstrology;
  window.renderAstrologyChartStandalone = renderAstrologyChart;

})();
