// ============================================
// NỘI TÂM — La Bàn Kỳ Môn & Bản Đồ Phong Thủy Vi Mô
// ============================================

(function () {
  'use strict';

  // ── Bát Môn Data ──
  const BAT_MON = [
    { name: 'Khai Môn', chi: 'Tuất', degree: 315, type: 'DAI_CAT', color: '#10b981', icon: '🟢', meaning: 'Mở ra vận may', bestFor: ['Kinh doanh', 'Đàm phán', 'Phỏng vấn', 'Bắt đầu dự án'] },
    { name: 'Hưu Môn', chi: 'Tý', degree: 0, type: 'TRUNG_CAT', color: '#3b82f6', icon: '🔵', meaning: 'Nghỉ ngơi, tái nạp', bestFor: ['Nghỉ ngơi', 'Gặp gỡ bạn bè', 'Cầu hôn', 'Chữa bệnh'] },
    { name: 'Sinh Môn', chi: 'Cấn', degree: 45, type: 'THUONG_CAT', color: '#f59e0b', icon: '🌟', meaning: 'Sinh tài vượng lộc', bestFor: ['Cầu tài', 'Mua bán đất đai', 'Ký hợp đồng tài chính', 'Đầu tư'] },
    { name: 'Thương Môn', chi: 'Chấn', degree: 90, type: 'HUNG', color: '#ef4444', icon: '🔴', meaning: 'Tổn thương, tai nạn', bestFor: ['Tránh xuất hành việc quan trọng'] },
    { name: 'Đỗ Môn', chi: 'Tốn', degree: 135, type: 'TRUNG', color: '#8b5cf6', icon: '🟣', meaning: 'Ẩn nấp, điều tra', bestFor: ['Nghiên cứu', 'Điều tra', 'Ẩn thân tránh thị phi'] },
    { name: 'Cảnh Môn', chi: 'Ly', degree: 180, type: 'TRUNG', color: '#06b6d4', icon: '🔷', meaning: 'Văn thư, truyền thông', bestFor: ['Truyền thông', 'Thi cử', 'Ký văn bản', 'Sáng tác'] },
    { name: 'Tử Môn', chi: 'Khôn', degree: 225, type: 'DAI_HUNG', color: '#374151', icon: '⚫', meaning: 'Đại hung, tuyệt đối tránh', bestFor: ['Chỉ dùng cho viếng tang, cúng tế'] },
    { name: 'Kinh Môn', chi: 'Đoài', degree: 270, type: 'HUNG', color: '#dc2626', icon: '🔴', meaning: 'Tranh chấp, kiện tụng', bestFor: ['Tránh hoàn toàn'] },
  ];

  const DIRECTION_NAMES = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];

  const THAN_CAT_BY_CAN = {
    'Giáp': { taiThan: 'Đông Nam', hyThan: 'Đông Bắc', quyNhan: 'Sửu/Mùi → Tây Nam' },
    'Ất':   { taiThan: 'Đông', hyThan: 'Bắc', quyNhan: 'Tý/Thân → Bắc/Tây' },
    'Bính': { taiThan: 'Nam', hyThan: 'Đông', quyNhan: 'Hợi/Dậu → Bắc/Tây' },
    'Đinh': { taiThan: 'Đông Nam', hyThan: 'Tây Nam', quyNhan: 'Hợi/Dậu → Bắc/Tây' },
    'Mậu': { taiThan: 'Đông Nam', hyThan: 'Bắc', quyNhan: 'Sửu/Mùi → Tây Nam' },
    'Kỷ':   { taiThan: 'Tây', hyThan: 'Tây Nam', quyNhan: 'Tý/Thân → Bắc/Tây' },
    'Canh': { taiThan: 'Tây', hyThan: 'Nam', quyNhan: 'Sửu/Mùi → Tây Nam' },
    'Tân':  { taiThan: 'Tây Bắc', hyThan: 'Tây', quyNhan: 'Ngọ/Dần → Nam/Đông' },
    'Nhâm': { taiThan: 'Bắc', hyThan: 'Tây Bắc', quyNhan: 'Mão/Tỵ → Đông' },
    'Quý':  { taiThan: 'Bắc', hyThan: 'Bắc Đông', quyNhan: 'Mão/Tỵ → Đông' }
  };

  function getBatMonForDay(canNgay) {
    const canIdx = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'].indexOf(canNgay);
    const offset = (canIdx * 1) % 8;
    return BAT_MON.map((mon, i) => ({
      ...mon,
      degree: (mon.degree + offset * 45) % 360
    }));
  }

  let compassHeading = 0;
  let hasGyroscope = false;

  function renderCompass(container, params) {
    let activeTab = (params && params[0] === 'microspace') ? 'microspace' : 'compass';

    container.innerHTML = `
      <div class="compass-module animate-fade-in">
        <!-- Sub-tabs navigation -->
        <div style="display:flex; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px; flex-wrap:wrap;">
          <button class="btn btn-tab ${activeTab === 'compass' ? 'active' : ''}" data-subtab="compass" style="font-weight:600; border-radius:20px; padding:6px 16px; background:${activeTab === 'compass' ? 'var(--accent-muted)' : 'transparent'}; color:${activeTab === 'compass' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; border:1px solid ${activeTab === 'compass' ? 'var(--border-accent)' : 'transparent'};">
            🧭 La Bàn Xuất Hành (Kỳ Môn)
          </button>
          <button class="btn btn-tab ${activeTab === 'microspace' ? 'active' : ''}" data-subtab="microspace" style="font-weight:600; border-radius:20px; padding:6px 16px; background:${activeTab === 'microspace' ? 'var(--accent-muted)' : 'transparent'}; color:${activeTab === 'microspace' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; border:1px solid ${activeTab === 'microspace' ? 'var(--border-accent)' : 'transparent'};">
            🖥️ Phong Thủy Vi Mô (Micro-Space Matrix)
          </button>
        </div>

        <div id="compass-sub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#compass-sub-content');

    function loadSubTab(tab) {
      activeTab = tab;
      container.querySelectorAll('[data-subtab]').forEach(btn => {
        const isCurrent = btn.dataset.subtab === tab;
        btn.style.background = isCurrent ? 'var(--accent-muted)' : 'transparent';
        btn.style.color = isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)';
        btn.style.borderColor = isCurrent ? 'var(--border-accent)' : 'transparent';
      });

      subContent.innerHTML = '';
      if (tab === 'compass') {
        renderCompassOriginal(subContent);
      } else if (tab === 'microspace') {
        renderMicroSpaceMatrix(subContent);
      }
    }

    container.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => loadSubTab(btn.dataset.subtab));
    });

    loadSubTab(activeTab);
  }

  function renderCompassOriginal(container) {
    const AL = window.AstrologyLogic;
    let canNgay = 'Giáp';
    let lunarStr = '';

    try {
      if (typeof Lunar !== 'undefined' && AL) {
        const lunar = Lunar.fromDate(new Date());
        canNgay = AL.CAN[lunar.getDayGanIndex()] || 'Giáp';
        lunarStr = `${lunar.getDay()}/${Math.abs(lunar.getMonth())}, ngày ${canNgay} ${AL.CUNG[lunar.getDayZhiIndex()]}`;
      }
    } catch (e) {}

    const batMonDay = getBatMonForDay(canNgay);
    const thanCat = THAN_CAT_BY_CAN[canNgay] || THAN_CAT_BY_CAN['Giáp'];
    const bestDir = batMonDay.find(m => m.type === 'THUONG_CAT' || m.type === 'DAI_CAT');
    const worstDir = batMonDay.find(m => m.type === 'DAI_HUNG');

    container.innerHTML = `
    <div class="animate-fade-in">
      <div style="margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:5px;">🧭 La Bàn Kỳ Môn Độn Giáp</h1>
        <p class="page-subtitle">${lunarStr || 'Hướng xuất hành cát hung hôm nay'} • <span id="compass-mode-badge" style="color:#f59e0b;">⚡ Đang tải cảm biến...</span></p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;align-items:start;">
        <!-- Compass Canvas -->
        <div class="card" style="padding:24px;text-align:center;">
          <div id="compass-container" style="position:relative;display:inline-block;">
            <canvas id="compass-canvas" width="300" height="300" style="border-radius:50%;cursor:crosshair;"></canvas>
            <div id="compass-center-label" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
              <div style="text-align:center;">
                <div style="font-size:1.6em;">🧭</div>
                <div id="compass-heading-text" style="font-size:0.7em;color:var(--text-muted);margin-top:4px;">0°</div>
              </div>
            </div>
          </div>
          <div style="margin-top:16px;font-size:0.85em;color:var(--text-muted);" id="gyro-hint">
            📱 Trên điện thoại: La bàn tự xoay theo hướng bạn nhìn
          </div>
          <div style="margin-top:12px;">
            <label style="font-size:0.8em;color:var(--text-muted);">Xoay la bàn thủ công:</label>
            <input type="range" id="compass-slider" min="0" max="359" value="0" style="width:100%;margin-top:6px;accent-color:var(--primary-color);">
          </div>
        </div>

        <!-- Direction Info -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${bestDir ? `
          <div class="card" style="padding:16px;border-left:3px solid #10b981;background:rgba(16,185,129,0.06);">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">⭐ Hướng Tốt Nhất Hôm Nay</div>
            <div style="font-size:1.1em;font-weight:700;color:#10b981;margin-bottom:4px;">${getDirName(bestDir.degree)} — ${bestDir.name}</div>
            <div style="font-size:0.85em;color:var(--text-secondary);">Tốt cho: ${bestDir.bestFor.join(', ')}</div>
          </div>
          ` : ''}

          ${worstDir ? `
          <div class="card" style="padding:16px;border-left:3px solid #ef4444;background:rgba(239,68,68,0.06);">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">⛔ Hướng Cần Tránh</div>
            <div style="font-size:1.1em;font-weight:700;color:#ef4444;margin-bottom:4px;">${getDirName(worstDir.degree)} — ${worstDir.name}</div>
          </div>
          ` : ''}

          <div class="card" style="padding:16px;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">✨ Thần Cát Ngày ${canNgay}</div>
            <div style="font-size:0.85em;color:var(--text-secondary);display:flex;flex-direction:column;gap:6px;">
              <div>💰 <strong>Tài Thần:</strong> Hướng ${thanCat.taiThan}</div>
              <div>😊 <strong>Hỷ Thần:</strong> Hướng ${thanCat.hyThan}</div>
              <div>👑 <strong>Quý Nhân:</strong> Hướng ${thanCat.quyNhan}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    setTimeout(() => {
      const canvas = document.getElementById('compass-canvas');
      if (canvas) {
        drawCompass(batMonDay, compassHeading);
        initGyroscope(batMonDay);
        const slider = document.getElementById('compass-slider');
        slider?.addEventListener('input', (e) => {
          compassHeading = parseInt(e.target.value, 10);
          drawCompass(batMonDay, compassHeading);
          document.getElementById('compass-heading-text').textContent = `${compassHeading}°`;
        });
      }
    }, 100);
  }

  function renderMicroSpaceMatrix(container) {
    const AL = window.AstrologyLogic;
    const sectors = AL.calculateFlyingStars ? AL.calculateFlyingStars() : [];

    let deskGrid = App.Storage.get('desk_grid_items') || {
      'SouthEast': { id: 'water_cup', label: 'Cốc Nước Thủy Sinh', icon: '💧', element: 'Thủy' },
      'South': { id: 'warm_lamp', label: 'Đèn Bàn Ánh Sáng Ấm', icon: '💡', element: 'Hỏa' },
      'Center': { id: 'metal_bell', label: 'Chuông Gió Kim Loại', icon: '🔔', element: 'Kim' }
    };

    let selectedRemedy = null;

    const remediesList = [
      { id: 'water_cup', label: 'Cốc Nước Thủy Sinh', icon: '💧', element: 'Thủy' },
      { id: 'warm_lamp', label: 'Đèn Bàn Ánh Sáng Ấm', icon: '💡', element: 'Hỏa' },
      { id: 'green_plant', label: 'Cây Xanh Kim Tiền', icon: '🌿', element: 'Mộc' },
      { id: 'metal_bell', label: 'Chuông Gió Kim Loại', icon: '🔔', element: 'Kim' },
      { id: 'quartz_stone', label: 'Đá Thạch Anh Vàng', icon: '🪨', element: 'Thổ' }
    ];

    function renderView() {
      const evaluation = AL.evaluateMicroSpaceEnergy ? AL.evaluateMicroSpaceEnergy(deskGrid) : { score: 85, recommendations: [] };

      const gridOrder = [
        'NorthWest', 'North', 'NorthEast',
        'West', 'Center', 'East',
        'SouthWest', 'South', 'SouthEast'
      ];

      container.innerHTML = `
        <div class="animate-fade-in">
          <div class="card card-highlight mb-lg" style="padding:20px; border:1px solid var(--border-accent); background:linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08));">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <h3 style="font-size:1.15rem; font-weight:700; margin:0; color:var(--accent-primary); display:flex; align-items:center; gap:8px;">
                  <span>🖥️</span> Bản Đồ Phong Thủy Vi Mô (Micro-Space & Flying Stars Matrix)
                </h3>
                <p style="font-size:0.88rem; color:var(--text-secondary); margin-top:4px;">
                  Tối ưu hóa năng lượng trực quan trên mặt bàn làm việc dựa trên Cửu Cung Phi Tinh Vận 9 & Lá Số Tử Vi.
                </p>
              </div>

              <div style="background:var(--bg-card); padding:10px 18px; border-radius:12px; border:1px solid var(--border-color); text-align:center;">
                <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Điểm Năng Lượng Không Gian</div>
                <div style="font-size:1.5rem; font-weight:800; color:${evaluation.score >= 80 ? '#10b981' : evaluation.score >= 60 ? '#f59e0b' : '#ef4444'};">
                  ⚡ ${evaluation.score}<span style="font-size:0.5em;">/100</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Remedy Selector -->
          <div class="card mb-lg" style="padding:16px;">
            <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
              <span>🧰</span> CHỌN VẬT THỂ HÓA GIẢI / KÍCH HOẠT (Click chọn rồi click vào ô phương vị bên dưới):
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${remediesList.map(r => {
                const isSelected = selectedRemedy && selectedRemedy.id === r.id;
                return `
                  <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}" data-remedy-id="${r.id}" style="border:1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}; font-size:0.82rem; padding:8px 12px; border-radius:12px;">
                    ${r.icon} ${r.label} (${r.element})
                  </button>
                `;
              }).join('')}
              <button class="btn btn-sm btn-ghost" id="btn-clear-remedy" style="font-size:0.8rem; color:var(--danger-color);">🧹 Xóa lựa chọn</button>
            </div>
          </div>

          <!-- 3x3 Canvas Grid -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:24px;">
            ${gridOrder.map(secId => {
              const sec = sectors.find(s => s.id === secId) || { name: secId, starName: '', nature: 'Normal', icon: '▫️' };
              const placedItem = deskGrid[secId];
              const isCrit = sec.nature === 'Critical';
              const isAus = sec.nature === 'Auspicious';

              return `
                <div class="micro-sector-cell card" data-sector-id="${secId}" style="padding:14px; min-height:120px; cursor:pointer; border:1.5px solid ${isCrit ? '#ef4444' : isAus ? '#10b981' : 'var(--border-color)'}; background:${isCrit ? 'rgba(239,68,68,0.05)' : isAus ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)'}; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s ease;">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <span style="font-weight:800; font-size:0.9rem; color:var(--text-primary);">${sec.icon} ${sec.name}</span>
                      <span class="tag tag-sm" style="font-size:0.7rem; font-weight:700; background:var(--bg-surface); border:1px solid var(--border-color);">
                        ${sec.starName}
                      </span>
                    </div>

                    <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:8px; line-height:1.4;">
                      ${sec.desc}
                    </div>

                    <div style="font-size:0.75rem; color:var(--accent-primary); font-weight:600;">
                      💡 ${sec.ziweiNote}
                    </div>
                  </div>

                  <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    ${placedItem ? `
                      <span style="font-size:0.85rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:4px;">
                        ${placedItem.icon} ${placedItem.label}
                      </span>
                      <button class="btn btn-ghost btn-icon btn-sm btn-remove-item" data-sector="${secId}" style="font-size:0.75rem;">❌</button>
                    ` : `
                      <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">+ Thêm vật thể...</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${evaluation.recommendations.length > 0 ? `
            <div class="card p-md">
              <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:10px;">📋 Đánh Giá Phong Thủy Bàn Làm Việc:</h4>
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${evaluation.recommendations.map(rec => `
                  <div style="font-size:0.88rem; color:var(--text-secondary); line-height:1.5;">${rec}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelectorAll('[data-remedy-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const rId = btn.dataset.remedyId;
          selectedRemedy = remediesList.find(r => r.id === rId);
          renderView();
        });
      });

      container.querySelector('#btn-clear-remedy')?.addEventListener('click', () => {
        selectedRemedy = null;
        renderView();
      });

      container.querySelectorAll('.micro-sector-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
          if (e.target.closest('.btn-remove-item')) return;
          const secId = cell.dataset.sectorId;
          if (selectedRemedy) {
            deskGrid[secId] = selectedRemedy;
            App.Storage.set('desk_grid_items', deskGrid);
            App.Toast.show(`Đã đặt ${selectedRemedy.label} tại phương vị ${secId}!`);
            renderView();
          }
        });
      });

      container.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const secId = btn.dataset.sector;
          delete deskGrid[secId];
          App.Storage.set('desk_grid_items', deskGrid);
          renderView();
        });
      });
    }

    renderView();
  }

  function getDirName(deg) {
    const idx = Math.round(deg / 45) % 8;
    return DIRECTION_NAMES[idx];
  }

  function drawCompass(batMonDay, heading) {
    const canvas = document.getElementById('compass-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 150, cy = 150, r = 135;

    ctx.clearRect(0, 0, 300, 300);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const rotRad = (heading * Math.PI) / 180;

    batMonDay.forEach(mon => {
      const startRad = ((mon.degree - 22.5 - heading) * Math.PI) / 180;
      const endRad = ((mon.degree + 22.5 - heading) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 5, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = mon.color + '25';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, startRad, endRad);
      ctx.strokeStyle = mon.color + '60';
      ctx.lineWidth = 1;
      ctx.stroke();

      const midRad = ((mon.degree - heading) * Math.PI) / 180;
      const tx = cx + Math.cos(midRad) * (r - 28);
      const ty = cy + Math.sin(midRad) * (r - 28);

      ctx.save();
      ctx.translate(tx, ty);
      ctx.fillStyle = mon.color;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mon.name, 0, 0);
      ctx.restore();
    });

    const northAngle = ((-90 - heading) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const nx = cx + Math.cos(northAngle) * 55;
    const ny = cy + Math.sin(northAngle) * 55;
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function initGyroscope(batMonDay) {
    const badge = document.getElementById('compass-mode-badge');
    if (window.DeviceOrientationEvent) {
      const handler = (event) => {
        if (event.alpha !== null) {
          hasGyroscope = true;
          compassHeading = Math.round(event.alpha);
          drawCompass(batMonDay, compassHeading);
          const textEl = document.getElementById('compass-heading-text');
          if (textEl) textEl.textContent = `${compassHeading}°`;
          const slider = document.getElementById('compass-slider');
          if (slider) slider.value = compassHeading;
        }
      };
      window.addEventListener('deviceorientation', handler, true);
    }
  }

  window.renderCompass = renderCompass;
})();
