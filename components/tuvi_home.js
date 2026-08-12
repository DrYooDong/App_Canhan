// ============================================
// NỘI TÂM — Trang Chủ Lá Số Cá Nhân (tuvi_home.js)
// Hub trung tâm: hiển thị thông tin lá số của người dùng
// ============================================

(function () {
  'use strict';

  let activeTuviHomeTab = 'chart'; // 'chart' | 'vanhan' | 'cot-cach' | 'tools'

  function getUserProfile() {
    let p1 = null, p2 = null;
    if (window.Onboarding && typeof window.Onboarding.getProfile === 'function') {
      p1 = window.Onboarding.getProfile();
    }
    if (!p1) {
      try { p1 = JSON.parse(localStorage.getItem('noitam_user_profile')); } catch {}
    }
    try { p2 = JSON.parse(localStorage.getItem('noitam_chart_config')); } catch {}
    const res = { ...(p1 || {}), ...(p2 || {}) };
    if (res && res.year) {
      res.hour = (res.hour !== undefined && res.hour !== null) ? (parseInt(res.hour, 10) % 24) : 0;
      return res;
    }
    return null;
  }

  function getChartConfig() {
    const p = getUserProfile();
    if (p) {
      return {
        gender: p.gender || 'Nam',
        year: p.year || 2000, month: p.month || 4, day: p.day || 20,
        hour: (p.hour !== undefined && p.hour !== null ? (parseInt(p.hour, 10) % 24) : 0), minute: p.minute ?? 0,
        locationName: p.locationName || 'Hà Nội',
        lat: p.lat || 21.03, lng: p.lng || 105.85, tz: p.tz || 7
      };
    }
    try {
      const saved = JSON.parse(localStorage.getItem('noitam_chart_config'));
      if (saved) return saved;
    } catch {}
    return { gender: 'Nam', year: 2000, month: 4, day: 20, hour: 21, minute: 0, locationName: 'Hà Nội', lat: 21.03, lng: 105.85, tz: 7 };
  }

  function getAge(birthYear) {
    return new Date().getFullYear() - birthYear + 1; // Tuổi âm (tuổi mụ)
  }

  // Tính can chi năm
  function getCanChi(year) {
    const AL = window.AstrologyLogic;
    if (!AL) return '';
    const canIdx = (year - 4) % 10;
    const chiIdx = (year - 4) % 12;
    const can = AL.CAN ? AL.CAN[(canIdx + 10) % 10] : '';
    const chi = AL.CUNG ? AL.CUNG[(chiIdx + 12) % 12] : '';
    return `${can} ${chi}`;
  }

  function renderTuviHome(container, params) {
    if (params && params[0] && ['chart', 'luan-giai', 'timemachine', 'rpg', 'vanhan', 'cot-cach', 'tools'].includes(params[0])) {
      activeTuviHomeTab = params[0];
    }

    const profile = getUserProfile();
    const config = getChartConfig();
    const AL = window.AstrologyLogic;

    // Compute Tử Vi chart for banner & chart display
    let tuViChart = null;
    let fp = null;
    if (AL && AL.TuViEngine) {
      try {
        const canNam = profile?.canNam || config.canNam || 'Canh';
        const chiNam = profile?.chiNam || config.chiNam || 'Thìn';
        tuViChart = AL.TuViEngine.calculateTuViChart({
          day: config.day || 20, month: config.month || 4, year: config.year || 2000,
          hour: config.hour ?? 0, minute: config.minute ?? 0, gender: config.gender || 'Nam',
          canNam: canNam, chiNam: chiNam
        });
      } catch (e) { console.warn('TuVi calc error:', e); }
    }
    const p = fp ? fp.pillars : null;

    const tb = tuViChart ? tuViChart.thienBan : null;
    const userName = profile ? profile.name : 'Bạn';
    const birthAge = config.year ? getAge(config.year) : 25;
    const canChiNam = getCanChi(config.year);
    const menhChi = tb ? tb.menhChi : '?';
    const menhPalaceName = tb ? tb.menhPalaceId : '';
    const cucName = tb ? tb.cucName : '';
    const thanChi = tb ? tb.thanChi : '?';
    const banMenh = p ? (AL.NHAN_MENH_TEN ? (AL.NHAN_MENH_TEN[`${p.year.can}${p.year.chi}`] || '') : '') : '';
    const menhChu = tb ? tb.menhChu : '';
    const thanChu = tb ? tb.thanChu : '';

    // Current Da Xian info
    let currentDX = null;
    if (tuViChart && tuViChart.daXians) {
      currentDX = tuViChart.daXians.find(d => birthAge >= d.startAge && birthAge <= d.endAge) || tuViChart.daXians[0];
    }

    const elementColors = {
      'Kim': { bg: 'linear-gradient(135deg, #b8c8d8, #8899aa)', accent: '#aabbcc', text: '#ccdde8', icon: '⚙️' },
      'Mộc': { bg: 'linear-gradient(135deg, #2d6a4f, #40916c)', accent: '#52b788', text: '#b7e4c7', icon: '🌿' },
      'Thủy': { bg: 'linear-gradient(135deg, #023e8a, #0077b6)', accent: '#0096c7', text: '#90e0ef', icon: '🌊' },
      'Hỏa': { bg: 'linear-gradient(135deg, #9b2226, #ae2012)', accent: '#e85d04', text: '#ffba08', icon: '🔥' },
      'Thổ': { bg: 'linear-gradient(135deg, #6b4226, #b5803d)', accent: '#d4a84b', text: '#f0d090', icon: '🏔' }
    };
    const cucHanh = cucName.includes('Kim') ? 'Kim' : cucName.includes('Mộc') ? 'Mộc' : cucName.includes('Thủy') ? 'Thủy' : cucName.includes('Hỏa') ? 'Hỏa' : cucName.includes('Thổ') ? 'Thổ' : 'Thủy';
    const elemStyle = elementColors[cucHanh] || elementColors['Thủy'];

    container.innerHTML = `
      <div class="tuvi-home animate-fade-in">

        <!-- ═══ PERSONAL BANNER ═══ -->
        <div class="tuvi-banner" style="
          background: ${elemStyle.bg};
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        ">
          <!-- Decorative circles -->
          <div style="position:absolute; right:-40px; top:-40px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none;"></div>
          <div style="position:absolute; right:60px; bottom:-60px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none;"></div>
          <div style="position:absolute; right:20px; top:20px; font-size:3rem; opacity:0.15; pointer-events:none;">☯</div>

          <div style="position:relative; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="font-size:0.72rem; color:rgba(255,255,255,0.6); letter-spacing:0.15em; font-weight:700; margin-bottom:6px; text-transform:uppercase;">🔮 LÁ SỐ TỬ VI CÁ NHÂN</div>
              <h1 style="font-family:'Cinzel',serif; font-size:clamp(1.4rem,3vw,2rem); font-weight:700; color:#fff; margin:0 0 4px; text-shadow:0 2px 8px rgba(0,0,0,0.3);">
                ${userName}
              </h1>
              <div style="font-size:0.88rem; color:rgba(255,255,255,0.75); margin-bottom:16px;">
                Sinh: ${config.day}/${config.month}/${config.year} lúc ${config.hour}:${(config.minute||0).toString().padStart(2,'0')} • Tuổi: ${birthAge}
              </div>

              <!-- Key info pills -->
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${cucName ? `<div class="tuvi-pill">${elemStyle.icon} ${cucName}</div>` : ''}
                ${menhChi ? `<div class="tuvi-pill">⭐ Mệnh: Cung ${menhChi}</div>` : ''}
                ${banMenh ? `<div class="tuvi-pill">✨ Bản Mệnh: ${banMenh}</div>` : ''}
                ${menhChu ? `<div class="tuvi-pill">👑 Mệnh Chủ: ${menhChu}</div>` : ''}
                ${thanChu ? `<div class="tuvi-pill">🌟 Thân Chủ: ${thanChu}</div>` : ''}
                ${canChiNam ? `<div class="tuvi-pill">🌿 Năm sinh: ${canChiNam}</div>` : ''}
              </div>
            </div>

            <!-- Right side: Current Da Xian -->
            ${currentDX ? `
              <div style="background:rgba(0,0,0,0.25); border-radius:14px; padding:14px 18px; min-width:160px; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:0.7rem; color:rgba(255,255,255,0.55); letter-spacing:0.1em; font-weight:700; margin-bottom:6px; text-transform:uppercase;">⏳ ĐẠI HẠN HIỆN TẠI</div>
                <div style="font-size:1.3rem; font-weight:800; color:#fff; margin-bottom:2px;">${currentDX.stem || ''}${currentDX.branch || ''}</div>
                <div style="font-size:0.8rem; color:rgba(255,255,255,0.7);">Tuổi ${currentDX.startAge}–${currentDX.endAge}</div>
                <div style="font-size:0.75rem; color:rgba(255,255,255,0.55); margin-top:4px;">Cung ${currentDX.palaceName || ''}</div>
              </div>
            ` : ''}
          </div>

          <!-- Action buttons in banner -->
          <div style="position:relative; display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
            <button class="btn btn-sm" id="btn-tuvi-edit-profile" style="background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.25); backdrop-filter:blur(4px);">
              ⚙️ Chỉnh Hồ Sơ
            </button>
            <button class="btn btn-sm" id="btn-tuvi-copy-ai" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); backdrop-filter:blur(4px);">
              📋 Copy Dữ Liệu Gửi AI
            </button>
            <button class="btn btn-sm" id="btn-tuvi-export-pdf" style="background:linear-gradient(90deg, #d97706, #fbbf24); color:#fff; border:1px solid #fbbf24; backdrop-filter:blur(4px); box-shadow: 0 4px 12px rgba(251,191,36,0.3);">
              📜 Xuất PDF Hoàng Gia
            </button>
          </div>
        </div>

        <!-- ═══ NAVIGATION TABS ═══ -->
        <div class="cmd-nav-tabs" style="margin-bottom:20px; flex-wrap:wrap;">
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'chart' ? 'active' : ''}" data-tuviTab="chart">
            <span>🔮</span> Lá Số 12 Cung
          </button>
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'luan-giai' ? 'active' : ''}" data-tuviTab="luan-giai">
            <span>✨</span> Luận Giải Sâu
          </button>
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'timemachine' ? 'active' : ''}" data-tuviTab="timemachine">
            <span>⏳</span> Time-Machine 60 Năm
          </button>
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'rpg' ? 'active' : ''}" data-tuviTab="rpg">
            <span>🎮</span> RPG & Thần Số
          </button>
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'cot-cach' ? 'active' : ''}" data-tuviTab="cot-cach">
            <span>🪞</span> Cốt Cách
          </button>
          <button class="cmd-nav-btn ${activeTuviHomeTab === 'tools' ? 'active' : ''}" data-tuviTab="tools">
            <span>🧰</span> Công Cụ Tích Hợp
          </button>
        </div>

        <div id="tuvi-home-content"></div>
      </div>
    `;

    // Add pill styles if needed
    if (!document.getElementById('tuvi-home-styles')) {
      const style = document.createElement('style');
      style.id = 'tuvi-home-styles';
      style.textContent = `
        .tuvi-pill {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px; padding: 4px 12px;
          font-size: 0.78rem; font-weight: 600;
          backdrop-filter: blur(4px);
        }
      `;
      document.head.appendChild(style);
    }

    const subContent = container.querySelector('#tuvi-home-content');

    // Wire tab buttons
    container.querySelectorAll('[data-tuviTab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTuviHomeTab = btn.dataset.tuvitab || btn.dataset.tuviTab;
        container.querySelectorAll('[data-tuviTab]').forEach(b => b.classList.toggle('active', b === btn));
        loadTuviTab(activeTuviHomeTab, subContent, tuViChart, fp, config, profile, currentDX);
      });
    });

    // Wire action buttons
    container.querySelector('#btn-tuvi-edit-profile')?.addEventListener('click', () => {
      if (window.Onboarding) {
        window.Onboarding.showProfileEditor(profile, () => {
          // Re-render after save
          if (window.App && window.App.Router) window.App.Router.navigate('tuvi');
        });
      }
    });

    container.querySelector('#btn-tuvi-copy-ai')?.addEventListener('click', () => {
      if (window.copyChartRawDataForAI) window.copyChartRawDataForAI();
      else if (window.App) window.App.Toast.show('Đang copy dữ liệu...');
    });

    container.querySelector('#btn-tuvi-export-pdf')?.addEventListener('click', () => {
      if (typeof html2pdf === 'undefined') {
        if (window.App) window.App.Toast.show('Thư viện xuất PDF chưa được tải!', 'error');
        return;
      }
      
      const contentToExport = container.querySelector('#tuvi-home-content');
      if (!contentToExport) return;
      
      if (window.App) window.App.Toast.show('Đang tạo báo cáo PDF...', 'success');
      
      const opt = {
        margin:       10,
        filename:     `La_So_Tu_Vi_${profile.name || 'Premium'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' }, // Dark theme background
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Temporarily add a royal border for PDF export
      const originalBorder = contentToExport.style.border;
      const originalPadding = contentToExport.style.padding;
      contentToExport.style.border = '10px solid transparent';
      contentToExport.style.borderImage = 'linear-gradient(45deg, #fbbf24, #d97706, #fbbf24) 1';
      contentToExport.style.padding = '20px';
      
      html2pdf().set(opt).from(contentToExport).save().then(() => {
        // Restore styles
        contentToExport.style.border = originalBorder;
        contentToExport.style.borderImage = '';
        contentToExport.style.padding = originalPadding;
        if (window.App) window.App.Toast.show('Xuất PDF thành công!', 'success');
      });
    });

    // Load default tab
    loadTuviTab(activeTuviHomeTab, subContent, tuViChart, fp, config, profile, currentDX);
  }

  // ── Load Sub-Tab Content ──
  function loadTuviTab(tab, subContent, tuViChart, fp, config, profile, currentDX) {
    subContent.innerHTML = '';

    if (tab === 'chart') {
      renderChartTab(subContent, tuViChart, fp, config);
    } else if (tab === 'luan-giai') {
      renderLuanGiaiTab(subContent, tuViChart, fp, config, currentDX);
    } else if (tab === 'timemachine' && window.renderTimeMachine) {
      window.renderTimeMachine(subContent);
    } else if (tab === 'rpg') {
      const wrapper = document.createElement('div');
      wrapper.className = 'animate-fade-in';
      if (window.renderRPG) window.renderRPG(wrapper);
      if (window.renderNumerology) {
        const numDiv = document.createElement('div');
        numDiv.style.marginTop = '24px';
        window.renderNumerology(numDiv);
        wrapper.appendChild(numDiv);
      }
      subContent.appendChild(wrapper);
    } else if (tab === 'vanhan') {
      renderVanHanTab(subContent, tuViChart, fp, config);
    } else if (tab === 'cot-cach') {
      renderCotCachTab(subContent, tuViChart, fp, config);
    } else if (tab === 'tools') {
      renderToolsTab(subContent);
    }
  }

  // ── TAB MỚI: Luận Giải Sâu (Synchronicity & Bát Quái & Archetypes) ──
  function renderLuanGiaiTab(container, tuViChart, fp, config, currentDX) {
    const Engine = window.ZiweiLuanGiaiEngine;
    if (!Engine) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔮</div><div class="empty-state-title">Đang tải Engine Luận Giải...</div></div>';
      return;
    }

    const menhAnalysis = Engine.analyzeMenhCung(tuViChart);
    const cachCucs = Engine.detectCachCuc(tuViChart);
    const bq = menhAnalysis.batQuai;

    // Tìm cung đại hạn
    let daiHanPalace = null;
    if (currentDX && tuViChart && tuViChart.palaces) {
      daiHanPalace = tuViChart.palaces.find(p => p.chi === currentDX.branch || p.name === currentDX.palaceName);
    }
    const hanVanAnalysis = Engine.analyzeHanVan(tuViChart, daiHanPalace);

    container.innerHTML = `
      <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- CARD 1: ARCHETYPE & BÁN NGÃ TRUNG TÂM -->
        <div class="card" style="background:linear-gradient(135deg, rgba(30,27,75,0.7), rgba(15,23,42,0.8)); border:1px solid rgba(168,85,247,0.3); border-radius:16px; padding:24px;">
          <div class="card-header" style="margin-bottom:16px;">
            <div class="card-icon" style="font-size:1.6rem;">🌌</div>
            <div>
              <div class="card-title" style="color:#c084fc; font-family:'Cinzel',serif; font-size:1.15rem;">BẢN NGÃ TRUNG TÂM & NGUYÊN MẪU JUNGIAN</div>
              <div class="card-subtitle">${menhAnalysis.headline}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:16px;">
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px;">
              <div style="font-size:0.7rem; color:#a855f7; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;">🎭 NGUYÊN MẪU TÂM LÝ (ARCHETYPE)</div>
              <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:8px;">${menhAnalysis.archetype}</div>
              <p style="font-size:0.83rem; color:var(--text-secondary); line-height:1.6; margin:0;">${menhAnalysis.synchronicity}</p>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px;">
              <div style="font-size:0.7rem; color:#38bdf8; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;">☯ BÁT QUÁI CUNG MỆNH</div>
              <div style="font-size:1.2rem; font-weight:800; color:#38bdf8; margin-bottom:4px;">
                ${bq.symbol} Quẻ ${bq.que} (${bq.hanh} - ${bq.phuong})
              </div>
              <p style="font-size:0.83rem; color:var(--text-secondary); line-height:1.6; margin:0;">${bq.yNghia}</p>
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:12px 16px; font-size:0.85rem; color:rgba(255,255,255,0.85); line-height:1.6;">
            💡 <b>Tổng quan năng lượng:</b> ${menhAnalysis.depth}
          </div>
        </div>

        <!-- CARD 2: CÁCH CỤC PHÁT HIỆN TỪ KHO LUẬN GIẢI -->
        <div class="card" style="border-radius:16px; padding:24px;">
          <div class="card-header" style="margin-bottom:16px;">
            <div class="card-icon" style="font-size:1.4rem;">🏛️</div>
            <div>
              <div class="card-title">CÁCH CỤC & TỔ HỢP SAO MỞ RỘNG</div>
              <div class="card-subtitle">Nhận diện theo trường phái cổ điển và tâm lý học đồng bộ</div>
            </div>
          </div>

          ${cachCucs.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${cachCucs.map(cc => `
                <div style="
                  background: ${cc.type === 'quy' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'};
                  border: 1px solid ${cc.type === 'quy' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'};
                  border-radius:12px; padding:16px;
                ">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="font-weight:700; font-size:0.95rem; color:${cc.type === 'quy' ? '#10b981' : '#ef4444'};">
                      ${cc.type === 'quy' ? '🌟' : '⚠️'} ${cc.name}
                    </div>
                    <span style="font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:10px; background:${cc.type === 'quy' ? '#10b98120' : '#ef444420'}; color:${cc.type === 'quy' ? '#10b981' : '#ef4444'};">
                      ${cc.type === 'quy' ? 'Cách Quý' : 'Đề Phòng'}
                    </span>
                  </div>
                  <p style="font-size:0.85rem; color:var(--text-primary); margin:0 0 6px; line-height:1.5;">${cc.meaning}</p>
                  <div style="font-size:0.78rem; color:var(--text-tertiary); font-style:italic;">⚡ <b>Synchronicity:</b> ${cc.synchronicity}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:16px; text-align:center; color:var(--text-secondary); font-size:0.88rem;">
              Lá số phát triển cân bằng, không vướng các cách cục cực đoan. Hãy tập trung khai thác thế mạnh của chính tinh Mệnh.
            </div>
          `}
        </div>

        <!-- CARD 3: BỘ CHỌN & LUẬN GIẢI CHUYÊN SÂU 12 CUNG -->
        <div class="card" style="border-radius:16px; padding:24px;">
          <div class="card-header" style="margin-bottom:16px;">
            <div class="card-icon" style="font-size:1.4rem;">🎯</div>
            <div>
              <div class="card-title">SOI CHIẾU LUẬN GIẢI 12 CUNG CHỨC NĂNG</div>
              <div class="card-subtitle">Bấm vào cung cần soi chiếu để xem Archetype & Bát Quái tương ứng</div>
            </div>
          </div>

          <!-- Palace Pills -->
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;" id="luan-giai-palace-selector">
            ${(Engine.PALACE_IDS || ['menh','taibach','quanloc','phuthe','dientrach','phucduc','tatach','thiendi','phumau','tutuc','noboc','phuhuynh']).map((pid, idx) => {
              const pData = Engine.analyzePalaceDeep(tuViChart, pid);
              if (!pData) return '';
              const isSelected = idx === 0;
              return `
                <button class="btn btn-sm palace-select-btn ${isSelected ? 'btn-primary' : 'btn-ghost'}" data-pid="${pid}" style="border-radius:20px; font-size:0.8rem; font-weight:600; padding:6px 14px;">
                  ${pData.icon} ${pData.name}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Dynamic Deep Palace Result Block -->
          <div id="luan-giai-palace-detail"></div>
        </div>

        <!-- CARD 4: VẬN HẠN DƯỚI GÓC NHÌN SYNCHRONICITY -->
        <div class="card" style="border-radius:16px; padding:24px;">
          <div class="card-header" style="margin-bottom:16px;">
            <div class="card-icon" style="font-size:1.4rem;">⌛</div>
            <div>
              <div class="card-title">HẠN VẬN & SỰ TRÙNG HỢP CÓ Ý NGHĨA</div>
              <div class="card-subtitle">${hanVanAnalysis.theme}</div>
            </div>
          </div>

          <div style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:16px;">
            <div style="font-size:0.75rem; color:#f59e0b; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;">🔮 BỐI CẢNH NĂNG LƯỢNG HẠN</div>
            <div style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin-bottom:6px;">Sao hội chiếu: ${hanVanAnalysis.stars}</div>
            <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin:0 0 10px;">${hanVanAnalysis.advice}</p>
            <div style="font-size:0.78rem; color:#f59e0b; font-style:italic;">
              "Vận hạn không phải nhân quả cưỡng bách, mà là tấm gương phản chiếu nhịp điệu của thời gian."
            </div>
          </div>
        </div>

      </div>
    `;

    // Helper render chi tiết 1 cung được chọn
    function updatePalaceDetail(pid) {
      const pData = Engine.analyzePalaceDeep(tuViChart, pid);
      const detailDiv = container.querySelector('#luan-giai-palace-detail');
      if (!detailDiv || !pData) return;

      const mainStarsText = pData.mainStars.length > 0 ? pData.mainStars.join(', ') : 'Vô Chính Diệu';
      const subStarsText = pData.subStars.length > 0 ? pData.subStars.join(', ') : 'Không hội tụ phụ tinh lớn';

      detailDiv.innerHTML = `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:14px; padding:18px;" class="animate-fade-in">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">${pData.icon}</span>
              <div>
                <div style="font-weight:700; font-size:1.05rem; color:var(--accent-primary);">${pData.name} (An tại ${pData.branch})</div>
                <div style="font-size:0.75rem; color:var(--text-tertiary);">${pData.desc}</div>
              </div>
            </div>
            <div style="font-size:0.8rem; font-weight:700; color:#38bdf8; background:rgba(56,189,248,0.1); padding:4px 12px; border-radius:12px; border:1px solid rgba(56,189,248,0.2);">
              ${pData.batQuai.symbol} Quẻ ${pData.batQuai.que} (${pData.batQuai.hanh})
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:14px;">
            <div style="background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:8px; font-size:0.82rem;">
              <span style="color:var(--text-tertiary); display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase;">Chính Tinh</span>
              <strong style="color:var(--text-primary);">${mainStarsText}</strong>
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:8px; font-size:0.82rem;">
              <span style="color:var(--text-tertiary); display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase;">Phụ Tinh & Sát Tinh</span>
              <strong style="color:var(--text-secondary);">${subStarsText}</strong>
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:8px; font-size:0.82rem;">
              <span style="color:#a855f7; display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase;">Archetype Tương Ứng</span>
              <strong style="color:#c084fc;">${pData.archetype}</strong>
            </div>
          </div>

          <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin-bottom:10px;">
            📖 <b>Phán đoán từ điển:</b> ${pData.fullDictText}
          </div>

          <div style="font-size:0.8rem; color:#f59e0b; font-style:italic; background:rgba(245,158,11,0.06); padding:10px 12px; border-radius:8px; border-left:3px solid #f59e0b;">
            ⚡ <b>Thông điệp Đồng Bộ:</b> ${pData.synchronicity}
          </div>
        </div>
      `;
    }

    // Wire buttons
    const btns = container.querySelectorAll('.palace-select-btn');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(other => {
          other.classList.remove('btn-primary');
          other.classList.add('btn-ghost');
        });
        b.classList.remove('btn-ghost');
        b.classList.add('btn-primary');
        updatePalaceDetail(b.dataset.pid);
      });
    });

    // Default select Mệnh
    updatePalaceDetail('menh');
  }

  // ── TAB 1: Lá Số 12 Cung (chart) ──
  function renderChartTab(container, tuViChart, fp, config) {
    // Delegate to standalone chart renderer if explicitly provided
    if (typeof window.renderAstrologyChartStandalone === 'function') {
      window.renderAstrologyChartStandalone(container);
      return;
    }

    // Render local chart summary cards directly
    renderChartSummaryCards(container, tuViChart, fp, config);
  }

  function renderChartSummaryCards(container, tuViChart, fp, config) {
    const AL = window.AstrologyLogic;
    const p = fp ? fp.pillars : null;
    const tb = tuViChart ? tuViChart.thienBan : null;
    const palaces = tuViChart ? tuViChart.palaces : [];

    // Four pillars display
    const pillarsHtml = p ? `
      <div class="card animate-fade-in" style="margin-bottom:20px;">
        <div class="card-header" style="margin-bottom:14px;">
          <div class="card-icon">🗓️</div>
          <div class="card-title">TỨ TRỤ BÁT TỰ</div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; text-align:center;">
          ${['year','month','day','hour'].map(key => {
            const labels = { year:'Trụ Năm', month:'Trụ Tháng', day:'Trụ Ngày (Nhật Nguyên)', hour:'Trụ Giờ' };
            const pillar = p[key];
            return `
              <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:12px 8px;">
                <div style="font-size:0.65rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;">${labels[key]}</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-primary);">${pillar.can}</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary); margin-bottom:4px;">${pillar.chi}</div>
                <div style="font-size:0.72rem; color:var(--text-tertiary);">${pillar.tenGod || ''}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:12px; text-align:center; font-size:0.8rem; color:var(--text-tertiary);">
          ⏱ Giờ Mặt Trời Thực: ${fp.trueSolarDate ? fp.trueSolarDate.getHours() + ':' + fp.trueSolarDate.getMinutes().toString().padStart(2,'0') : config.hour + ':' + config.minute.toString().padStart(2,'0')}
          ${fp.deltaMinutes ? ` (${fp.deltaMinutes > 0 ? '+' : ''}${fp.deltaMinutes}p so GMT+7)` : ''}
        </div>
      </div>
    ` : '';

    // 12 palaces grid with Mobile 1-Hand Carousel Switcher Bar
    const palaceGrid = palaces.length > 0 ? `
      <div class="card animate-fade-in" style="margin-bottom:20px;">
        <div class="card-header" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="card-icon">🌐</div>
            <div class="card-title">12 CUNG TỬ VI</div>
          </div>
          <span style="font-size:0.7rem; color:var(--accent-primary); font-weight:600;">📱 Chế Độ Vuốt 1 Tay</span>
        </div>

        <!-- Mobile 1-Hand Carousel Switcher Bar -->
        <div class="cmd-nav-tabs mobile-palace-bar" style="margin-bottom:14px; gap:6px;">
          ${palaces.map(pl => `
            <button class="cmd-nav-btn btn-sm palace-chip-btn ${pl.id === 'menh' ? 'active' : ''}" data-pchip="${pl.id}" style="font-size:0.75rem; padding:4px 10px;">
              ${pl.name} [${pl.chi}]
            </button>
          `).join('')}
        </div>

        <div class="palaces-grid-wrap" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:8px;">
          ${palaces.map(pl => {
            const isMenh = pl.id === 'menh';
            const isThan = pl.id === 'than' || (tb && pl.chi === tb.thanChi);
            const mainStars = pl.mainStarsList || [];
            return `
              <div class="palace-card-box" id="pcard-${pl.id}" style="
                background:var(--bg-card);
                border:1px solid ${isMenh ? 'var(--accent-primary)' : isThan ? '#f59e0b' : 'var(--border-color)'};
                border-radius:10px; padding:10px; transition: all 0.2s ease;
                ${isMenh ? 'box-shadow:0 0 12px rgba(var(--accent-rgb),0.2);' : ''}
              ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:0.7rem; font-weight:700; color:${isMenh ? 'var(--accent-primary)' : 'var(--text-secondary)'}; text-transform:uppercase;">
                    ${pl.name}${isMenh ? ' ⭐' : isThan ? ' 🌟' : ''}
                  </span>
                  <span style="font-size:0.7rem; color:var(--text-tertiary);">${pl.chi}</span>
                </div>
                <div style="font-size:0.78rem; font-weight:700; color:var(--text-primary); line-height:1.4;">
                  ${mainStars.length > 0 ? mainStars.map(s => `<span class="star-clickable" onclick="window.showStarArchetypeModal('${s.name}')" style="cursor:pointer; text-decoration:underline dashed; color:${s.bright === 'M' || s.bright === 'V' ? 'var(--accent-primary)' : 'var(--text-primary)'};" title="Bấm để xem Archetype">${s.name} [${s.bright}]</span>`).join(', ') : '<span style="color:var(--text-tertiary); font-style:italic;">Vô Chính Diệu</span>'}
                </div>
                ${pl.subStarsList && pl.subStarsList.length > 0 ? `
                  <div style="font-size:0.68rem; color:var(--text-tertiary); margin-top:4px;">${pl.subStarsList.slice(0,4).map(s => `<span class="star-clickable" onclick="window.showStarArchetypeModal('${s.name}')" style="cursor:pointer; text-decoration:underline dashed;" title="Bấm để xem Archetype">${s.name}</span>`).join(', ')}</div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '<div class="empty-state"><div class="empty-state-icon">🔮</div><div class="empty-state-title">Chưa tính được lá số</div><p class="empty-state-desc">Vui lòng kiểm tra thông tin ngày giờ sinh trong Cài đặt.</p></div>';

    container.innerHTML = pillarsHtml + palaceGrid;

    container.querySelectorAll('.palace-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pchip;
        container.querySelectorAll('.palace-chip-btn').forEach(b => b.classList.toggle('active', b === btn));
        container.querySelectorAll('.palace-card-box').forEach(box => {
          box.style.borderColor = 'var(--border-color)';
          box.style.transform = '';
        });
        const targetBox = container.querySelector(`#pcard-${pid}`);
        if (targetBox) {
          targetBox.style.borderColor = 'var(--accent-primary)';
          targetBox.style.transform = 'scale(1.03)';
          targetBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // ── TAB 2: Vận Hạn ──
  function renderVanHanTab(container, tuViChart, fp, config) {
    if (typeof window.renderTimeMachine === 'function') {
      try {
        window.renderTimeMachine(container);
        if (container.children.length > 0) return;
      } catch (e) {
        console.warn('TimeMachine render fallback:', e);
      }
    }

    const daXians = tuViChart ? tuViChart.daXians : [];
    const birthAge = getAge(config.year);

    if (!daXians || daXians.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Đang tính vận hạn...</div></div>';
      return;
    }

    container.innerHTML = `
      <div class="card animate-fade-in" style="margin-bottom:20px;">
        <div class="card-header" style="margin-bottom:16px;">
          <div class="card-icon">⏳</div>
          <div class="card-title">ĐẠI HẠN VẬN 60 NĂM</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${daXians.map((dx, i) => {
            const isCurrentDX = birthAge >= dx.startAge && birthAge <= dx.endAge;
            const isPast = birthAge > dx.endAge;
            return `
              <div style="
                display:flex; align-items:center; gap:14px;
                padding:12px 16px; border-radius:12px;
                background: ${isCurrentDX ? 'var(--accent-muted)' : isPast ? 'rgba(0,0,0,0.1)' : 'var(--bg-card)'};
                border:1px solid ${isCurrentDX ? 'var(--border-accent)' : 'var(--border-color)'};
                opacity: ${isPast ? 0.6 : 1};
              ">
                <div style="min-width:60px; text-align:center;">
                  <div style="font-size:1.1rem; font-weight:800; color:${isCurrentDX ? 'var(--accent-primary)' : 'var(--text-primary)'};">${dx.stem || ''}${dx.branch || ''}</div>
                  <div style="font-size:0.68rem; color:var(--text-tertiary);">${dx.startAge}–${dx.endAge}t</div>
                </div>
                <div style="flex:1;">
                  <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">Cung ${dx.palaceName || ''}</div>
                  <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Giai đoạn ${config.year + dx.startAge}–${config.year + dx.endAge}</div>
                </div>
                ${isCurrentDX ? '<div style="font-size:0.72rem; background:var(--accent-primary); color:#fff; padding:2px 10px; border-radius:12px; font-weight:700;">HIỆN TẠI</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="text-align:center; margin-top:8px;">
        <button class="btn btn-primary btn-sm" onclick="App.Router.navigate('astrology/timemachine')">
          ⏳ Xem Chi Tiết Time-Machine 60 Năm
        </button>
      </div>
    `;
  }

  // ── TAB 3: Cốt Cách ──
  function renderCotCachTab(container, tuViChart, fp, config) {
    const tuviData = window.TUVI_DATA || [];
    const tuviSections = window.TUVI_SECTIONS || [];

    if (tuviData.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🪞</div>
          <div class="empty-state-title">Chưa có phân tích Cốt Cách</div>
          <p class="empty-state-desc">Hệ thống chưa có dữ liệu phân tích lá số của bạn. Hãy dùng tính năng Copy AI để nhờ AI phân tích.</p>
          <button class="btn btn-primary" style="margin-top:16px;" id="btn-cot-cach-copy-ai">
            📋 Copy Dữ Liệu Lá Số Gửi AI
          </button>
        </div>
      `;
      container.querySelector('#btn-cot-cach-copy-ai')?.addEventListener('click', () => {
        if (window.copyChartRawDataForAI) window.copyChartRawDataForAI();
      });
      return;
    }

    // Group by section
    const grouped = {};
    tuviSections.forEach(sec => { grouped[sec.id] = []; });
    tuviData.forEach(item => {
      if (grouped[item.section] !== undefined) grouped[item.section].push(item);
    });

    const typeColors = {
      strength: { bg: '#10b98115', border: '#10b98130', tag: '#10b981', label: '💪 Ưu điểm' },
      weakness: { bg: '#ef444415', border: '#ef444430', tag: '#ef4444', label: '⚠️ Cần lưu ý' },
      info:     { bg: 'var(--bg-card)', border: 'var(--border-color)', tag: 'var(--accent-primary)', label: '📌 Thông tin' },
      warning:  { bg: '#f59e0b10', border: '#f59e0b30', tag: '#f59e0b', label: '🔔 Cảnh báo' }
    };

    container.innerHTML = `
      <div class="animate-fade-in">
        ${tuviSections.map(sec => {
          const items = grouped[sec.id] || [];
          if (items.length === 0) return '';
          return `
            <div class="card" style="margin-bottom:20px;">
              <div class="card-header" style="margin-bottom:16px;">
                <div class="card-icon">${sec.icon}</div>
                <div>
                  <div class="card-title">${sec.name}</div>
                  <div class="card-subtitle">${sec.description}</div>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${items.map(item => {
                  const tc = typeColors[item.type] || typeColors.info;
                  return `
                    <div style="background:${tc.bg}; border:1px solid ${tc.border}; border-radius:10px; padding:14px;">
                      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                        <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${item.title}</div>
                        <span style="font-size:0.68rem; color:${tc.tag}; font-weight:700; background:${tc.bg}; padding:2px 8px; border-radius:10px; border:1px solid ${tc.border};">${tc.label}</span>
                      </div>
                      <p style="font-size:0.83rem; color:var(--text-secondary); line-height:1.7; margin:0;">${item.content}</p>
                      ${item.tags && item.tags.length > 0 ? `
                        <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:4px;">
                          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── TAB 4: Tools ──
  function renderToolsTab(container) {
    const tools = [
      {
        icon: '🔢', title: 'Số Học Ngày Sinh', desc: 'Thần số học Pythagoras — Con số cuộc đời, con số sinh nhật.',
        action: () => App.Router.navigate('astrology/numerology')
      },
      {
        icon: '🎮', title: 'RPG Cuộc Đời', desc: 'Hệ thống nhân vật RPG từ bản đồ vận mệnh Tử Vi.',
        action: () => App.Router.navigate('astrology/rpg')
      },
      {
        icon: '🌊', title: 'Real-Time Mood', desc: 'Ghi nhận cảm xúc nhanh, theo dõi năng lượng hàng ngày.',
        action: () => App.Router.navigate('astrology/mood')
      },
      {
        icon: '🧘', title: 'Thiền Solfeggio', desc: 'Âm nhạc trị liệu 7 tần số — Web Audio API đích thực.',
        action: () => App.Router.navigate('astrology/meditation')
      },
      {
        icon: '🏥', title: 'Trợ Lý Sức Khỏe', desc: 'Phân tích sức khỏe theo Ngũ Hành từ lá số cá nhân.',
        action: () => App.Router.navigate('astrology/health')
      },
      {
        icon: '⚡', title: 'Nhịp Giờ Hoàng Đạo', desc: '12 Canh Giờ 24H — Khung giờ vàng theo mệnh cá nhân.',
        action: () => App.Router.navigate('astrology/heatmap')
      },
      {
        icon: '🧭', title: 'La Bàn Kỳ Môn', desc: 'Xuất hành theo Kỳ Môn Độn Giáp — 8 cửa, 9 cung.',
        action: () => App.Router.navigate('oracle/compass')
      },
      {
        icon: '☯', title: 'Kinh Dịch 64 Quẻ', desc: 'Gieo quẻ Mai Hoa Dịch Số — Hỏi đáp vận mệnh.',
        action: () => App.Router.navigate('oracle/iching')
      },
      {
        icon: '⏳', title: 'Time-Machine 60 Năm', desc: 'Lộ đồ vận hạn toàn bộ 60 năm cuộc đời.',
        action: () => App.Router.navigate('astrology/timemachine')
      },
      {
        icon: '💰', title: 'Timing Tài Chính', desc: 'Chọn thời điểm đầu tư theo Ngũ Hành và vận hạn.',
        action: () => App.Router.navigate('finance')
      },
      {
        icon: '📖', title: 'Nhật Ký Phản Tư', desc: 'Ghi chép nhật ký, bài học, quy luật cuộc sống.',
        action: () => App.Router.navigate('knowledge/journal')
      }
    ];

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
          ${tools.map((t, i) => `
            <div class="card tool-card" data-tool-idx="${i}" style="cursor:pointer; transition:all 0.25s; padding:18px;">
              <div style="font-size:2rem; margin-bottom:10px;">${t.icon}</div>
              <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem; margin-bottom:4px;">${t.title}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5;">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Wire tool card clicks
    container.querySelectorAll('.tool-card').forEach(card => {
      const idx = parseInt(card.dataset.toolIdx);
      card.addEventListener('click', () => tools[idx].action());
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-3px)';
        card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  // --- Hỗ trợ tra cứu Kho Luận Giải ---
  if (!window.setupDictionaryLookup) {
    window.setupDictionaryLookup = true;
    document.body.addEventListener('click', function(e) {
      if (!window.ZiweiDictionary) return;
      
      let term = null;
      if (e.target.classList.contains('main-star') || e.target.classList.contains('minor-star-good') || e.target.classList.contains('minor-star-bad')) {
        term = e.target.innerText;
      } else if (e.target.classList.contains('palace-title') || e.target.classList.contains('palace-name')) {
        term = e.target.innerText;
      } else {
        const el = e.target.closest('.main-star, .minor-star-good, .minor-star-bad, .palace-title, .palace-name');
        if (el) term = el.innerText;
      }
      
      if (term) {
         const info = window.ZiweiDictionary.getTerm(term);
         if (info) {
           showDictionaryModal(term, info);
         }
      }
    });
    
    function showDictionaryModal(term, info) {
       const cleanTerm = term.replace(/\([A-ZĐ]\)/g, "").trim();
       const contentHtml = `
         <div style="font-size:0.75rem; color:var(--accent-primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; font-weight:700;">${info.type}</div>
         <div style="font-weight:700; color:var(--text-primary); margin-bottom:12px; font-size:1.1rem;">${info.short}</div>
         <div style="color:var(--text-secondary); line-height:1.6; font-size:0.92rem;">${info.full}</div>
       `;

       if (window.innerWidth <= 768 && window.App && window.App.BottomSheet) {
         window.App.BottomSheet.show(cleanTerm, contentHtml);
         return;
       }

       let m = document.getElementById('ziwei-dict-modal');
       if (!m) {
         m = document.createElement('div');
         m.id = 'ziwei-dict-modal';
         m.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px); perspective: 1200px;';
         
         const innerStyle = `
           background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
           border: 1px solid rgba(139, 92, 246, 0.4);
           border-radius: 24px;
           width: 90%;
           max-width: 480px;
           padding: 32px;
           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2) inset, 0 0 20px rgba(139, 92, 246, 0.4);
           position: relative;
           transform: translateZ(50px) rotateX(10deg);
           transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
           animation: popup3dEntrance 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
         `;

         m.innerHTML = `
           <style>
             @keyframes popup3dEntrance {
               0% { opacity: 0; transform: translateY(50px) translateZ(-100px) rotateX(-20deg); }
               100% { opacity: 1; transform: translateY(0) translateZ(50px) rotateX(0deg); }
             }
             .dict-3d-card:hover {
               transform: translateZ(60px) rotateX(2deg) rotateY(2deg) !important;
               box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.3) inset, 0 0 30px rgba(139, 92, 246, 0.6) !important;
             }
           </style>
           <div class="dict-3d-card" style="${innerStyle}">
              <div style="position:absolute; top:-15px; left:32px; background:linear-gradient(90deg, var(--accent-primary), #38bdf8); padding:6px 16px; border-radius:12px; font-weight:800; font-size:0.8rem; color:#fff; box-shadow:0 4px 15px rgba(139,92,246,0.4); letter-spacing:1px; text-transform:uppercase;" id="zdict-type"></div>
              
              <button id="zdict-close" style="position:absolute;top:20px;right:24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);font-size:1.2rem;color:#fff;cursor:pointer;line-height:1;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">&times;</button>
              
              <h2 id="zdict-term" style="margin:16px 0 12px 0; color:#fff; font-family:'Cinzel', serif; font-size:2rem; text-shadow:0 2px 10px rgba(255,255,255,0.2);"></h2>
              
              <div id="zdict-short" style="font-weight:700; color:#fbbf24; margin-bottom:20px; font-size:1.15rem; border-left:4px solid #fbbf24; padding-left:12px; background:rgba(251,191,36,0.1); border-radius:0 8px 8px 0; padding-top:8px; padding-bottom:8px;"></div>
              
              <div id="zdict-full" style="color:var(--text-secondary); line-height:1.7; font-size:1rem;"></div>
           </div>
         `;
         document.body.appendChild(m);
         
         // Hover 3D effect listener
         const card = m.querySelector('.dict-3d-card');
         m.addEventListener('mousemove', (e) => {
           const rect = card.getBoundingClientRect();
           const x = e.clientX - rect.left; // x position within the element.
           const y = e.clientY - rect.top;  // y position within the element.
           const centerX = rect.width / 2;
           const centerY = rect.height / 2;
           const rotateX = ((y - centerY) / centerY) * -10;
           const rotateY = ((x - centerX) / centerX) * 10;
           card.style.transform = `translateZ(50px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
         });
         
         m.addEventListener('mouseleave', () => {
           card.style.transform = 'translateZ(50px) rotateX(0deg) rotateY(0deg)';
         });

         m.addEventListener('click', (e) => { if(e.target === m) m.style.display='none'; });
         m.querySelector('#zdict-close').addEventListener('click', () => m.style.display='none');
       }
       m.querySelector('#zdict-type').innerText = info.type;
       m.querySelector('#zdict-term').innerText = cleanTerm;
       m.querySelector('#zdict-short').innerText = info.short;
       m.querySelector('#zdict-full').innerText = info.full;
       m.style.display = 'flex';
    }
  }

  // Export
  window.renderTuviHome = renderTuviHome;

})();
