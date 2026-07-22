// ============================================
// NỘI TÂM — Astrology Component (Tử Vi - Vận Hạn)
// ============================================

(function() {
  'use strict';

  let activeTab = 'chart'; // 'chart' | 'tasks' | 'morning' | 'health' | 'heatmap' | 'overview'

  function renderAstrology(container, params) {
    if (params && params[0]) {
      if (['chart', 'tasks', 'morning', 'health', 'heatmap', 'overview', 'vanhan', 'laban'].includes(params[0])) {
        if (params[0] === 'chart' || params[0] === 'vanhan' || params[0] === 'laban') activeTab = 'chart';
        else activeTab = params[0];
      }
    }

    container.innerHTML = `
      <div class="astrology-hub animate-fade-in">
        <!-- Main Astrology Hub Sub-Tabs -->
        <div class="tabs-header" style="display:flex;gap:12px;margin-bottom:24px;border-bottom:1px solid var(--border-color);padding-bottom:12px;flex-wrap:wrap;">
          <button class="btn btn-tab ${activeTab === 'chart' ? 'active' : ''}" data-tab="chart" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'chart' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'chart' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'chart' ? 'var(--border-accent)' : 'transparent'};">
            <span>🔮</span> Lá Số Tử Vi
          </button>
          <button class="btn btn-tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'tasks' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'tasks' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'tasks' ? 'var(--border-accent)' : 'transparent'};">
            <span>🌱</span> Nhiệm Vụ Cải Mệnh
          </button>
          <button class="btn btn-tab ${activeTab === 'morning' ? 'active' : ''}" data-tab="morning" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'morning' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'morning' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'morning' ? 'var(--border-accent)' : 'transparent'};">
            <span>☀️</span> Thực Dưỡng Buổi Sáng
          </button>
          <button class="btn btn-tab ${activeTab === 'health' ? 'active' : ''}" data-tab="health" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'health' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'health' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'health' ? 'var(--border-accent)' : 'transparent'};">
            <span>🏥</span> Trợ Lý Sức Khỏe
          </button>
          <button class="btn btn-tab ${activeTab === 'heatmap' ? 'active' : ''}" data-tab="heatmap" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'heatmap' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'heatmap' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'heatmap' ? 'var(--border-accent)' : 'transparent'};">
            <span>⚡</span> Nhịp Giờ Hoàng Đạo
          </button>
          <button class="btn btn-tab ${activeTab === 'lifebalance' ? 'active' : ''}" data-tab="lifebalance" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'lifebalance' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'lifebalance' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'lifebalance' ? 'var(--border-accent)' : 'transparent'};">
            <span>🕸️</span> Cân Bằng 6 Trụ Cột
          </button>
          <button class="btn btn-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;font-weight:600;background:${activeTab === 'overview' ? 'var(--accent-muted)' : 'transparent'};color:${activeTab === 'overview' ? 'var(--accent-primary)' : 'var(--text-secondary)'};border:1px solid ${activeTab === 'overview' ? 'var(--border-accent)' : 'transparent'};">
            <span>🌟</span> Tổng Quan Cuộc Đời
          </button>
        </div>

        <div id="astrology-hub-content"></div>
      </div>
    `;

    const subContent = container.querySelector('#astrology-hub-content');

    function loadSubTab(tab, params) {
      activeTab = tab;
      container.querySelectorAll('.btn-tab').forEach(btn => {
        const isCurrent = btn.dataset.tab === tab;
        btn.classList.toggle('active', isCurrent);
        btn.style.background = isCurrent ? 'var(--accent-muted)' : 'transparent';
        btn.style.color = isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)';
        btn.style.borderColor = isCurrent ? 'var(--border-accent)' : 'transparent';
      });

      subContent.innerHTML = '';
      if (tab === 'chart') {
        renderAstrologyChart(subContent);
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

    container.querySelectorAll('.btn-tab').forEach(btn => {
      btn.addEventListener('click', () => loadSubTab(btn.dataset.tab));
    });

    // Expose tab switcher
    window.switchAstrologySubTab = (tab, params) => loadSubTab(tab, params);

    loadSubTab(activeTab);
  }

  function renderAstrologyChart(container) {
    const palacesData = [
      { id: 'no-boc', name: 'Nô Bộc', chi: 'Tỵ', mainStar: 'Thất Sát [M]', pos: 'grid-column:1;grid-row:1;' },
      { id: 'thien-di', name: 'Thiên Di', chi: 'Ngọ', mainStar: 'Nhật Cự chiếu', pos: 'grid-column:2;grid-row:1;' },
      { id: 'tat-ach', name: 'Tật Ách', chi: 'Mùi', mainStar: 'Vũ Phá', pos: 'grid-column:3;grid-row:1;' },
      { id: 'tai-bach', name: 'Tài Bạch', chi: 'Thân', mainStar: 'Đồng Âm chiếu', pos: 'grid-column:4;grid-row:1;' },

      { id: 'quan-loc', name: 'Quan Lộc', chi: 'Thìn', mainStar: 'Cơ Lương [V]', pos: 'grid-column:1;grid-row:2;' },
      { id: 'tu-tuc', name: 'Tử Tức', chi: 'Dậu', mainStar: 'Liêm Sát', pos: 'grid-column:4;grid-row:2;' },

      { id: 'dien-trach', name: 'Điền Trạch', chi: 'Mão', mainStar: 'Tham Lang', pos: 'grid-column:1;grid-row:3;' },
      { id: 'phu-the', name: 'Phu Thê', chi: 'Tuất', mainStar: 'Tử Tướng', pos: 'grid-column:4;grid-row:3;' },

      { id: 'phuc-duc', name: 'Phúc Đức (Thân)', chi: 'Dần', mainStar: 'Thái Dương, Cự Môn', pos: 'grid-column:1;grid-row:4;' },
      { id: 'phu-mau', name: 'Phụ Mẫu', chi: 'Sửu', mainStar: 'Thiên Phủ [V]', pos: 'grid-column:2;grid-row:4;' },
      { id: 'menh', name: 'MỆNH BÀN', chi: 'Tý', mainStar: 'Thiên Đồng, Thái Âm [V]', pos: 'grid-column:3;grid-row:4;', isMenh: true },
      { id: 'huynh-de', name: 'Huynh Đệ', chi: 'Hợi', mainStar: 'Liêm Phá', pos: 'grid-column:4;grid-row:4;' }
    ];

    container.innerHTML = `
      <div class="header-section animate-fade-in" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--accent-primary); letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
          <span>🔮 TỬ VI ĐẨU SỐ & MỆNH BÀN</span>
        </div>
        <h1 class="page-title" style="margin-bottom: 6px;">Lá Số Tử Vi & Vận Hạn Định Vị</h1>
        <p class="page-subtitle" style="margin-bottom: 0;">Tra cứu Bàn Số 12 Cung, vận hạn từng thời kỳ và La Bàn Tương Tác.</p>
      </div>

      <!-- 12 Palaces Interactive Chart Card -->
      <div class="tuvi-card animate-fade-in mb-lg" style="margin-bottom:24px;">
        <div class="tuvi-card-header">
          <div class="tuvi-card-title-group">
            <div class="tuvi-card-icon">🔮</div>
            <div>
              <div class="tuvi-card-title">Bàn Số 12 Cung Interactive</div>
              <div class="tuvi-card-subtitle">Click 1 Cung bất kỳ để tự động tra cứu luận giải chi tiết</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-matrix-all">🌐 Xem Tất Cả 100 Mục Luận Giải</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4, 1fr);grid-template-rows:repeat(4, minmax(80px, auto));gap:10px;background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
          
          <!-- Center Box -->
          <div style="grid-column:2 / span 2;grid-row:2 / span 2;background:linear-gradient(135deg, var(--bg-card), var(--bg-secondary));border:1px dashed var(--border-accent);border-radius:var(--radius-md);padding:14px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;box-shadow:var(--shadow-sm);">
            <div style="font-family:var(--font-heading);font-weight:700;font-size:1.15rem;color:var(--accent-primary);letter-spacing:0.05em;">DƯƠNG NAM CANH THÌN</div>
            <div style="font-size:0.85rem;color:var(--text-primary);font-weight:600;margin:4px 0;">Bạch Lạp Kim — Hỏa Lục Cục</div>
            <div style="font-size:0.8rem;color:var(--text-tertiary);">Mệnh: Đồng Âm cư Tý | Thân cư Phúc Đức</div>
            <div id="selected-palace-banner" style="margin-top:8px;font-size:0.78rem;color:var(--accent-primary);font-weight:600;background:var(--accent-muted);padding:4px 10px;border-radius:var(--radius-full);">
              💡 Click 1 Cung trên lá số để lọc ma trận luận giải
            </div>
          </div>

          <!-- 12 Palace Cells -->
          ${palacesData.map(p => {
            const count = (window.TUVI_DATA || []).filter(d => d.palace === p.id).length;
            const isMenh = p.isMenh;
            return `
              <div class="palace-cell" data-palace-id="${p.id}" style="${p.pos}background:${isMenh ? 'var(--accent-muted)' : 'var(--bg-card)'};border:1px solid ${isMenh ? 'var(--border-accent)' : 'var(--border-color)'};border-radius:var(--radius-md);padding:10px;cursor:pointer;transition:all 0.2s ease;display:flex;flex-direction:column;justify-content:space-between;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-family:var(--font-heading);font-weight:700;font-size:0.88rem;color:${isMenh ? 'var(--accent-primary)' : 'var(--text-primary)'};">${p.name}</span>
                  <span style="font-size:0.72rem;color:var(--text-tertiary);font-weight:600;">[${p.chi}]</span>
                </div>
                <div style="font-size:0.78rem;color:var(--text-secondary);margin:4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.mainStar}">
                  ✨ ${p.mainStar}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.72rem;color:var(--accent-primary);font-weight:600;">
                  <span>${count} mục</span>
                  <span>🔍</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="segmented-tabs animate-fade-in" style="margin-bottom: 20px;">
        <button class="segmented-tab active" id="tab-vanhan"><span>📜</span> Vận Hạn Định Vị</button>
        <button class="segmented-tab" id="tab-laban"><span>🧭</span> La Bàn & Nhân Sự</button>
      </div>

      <div id="astrology-content" class="animate-slide-up" style="animation-delay: 0.1s"></div>
    `;

    // Bind Palace Cell Clicks
    container.querySelectorAll('.palace-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const palaceId = cell.dataset.palaceId;
        if (window.switchAstrologySubTab) {
          window.switchAstrologySubTab('overview', { palace: palaceId });
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

    tabVanhan.addEventListener('click', () => {
      tabVanhan.classList.add('active');
      tabLaban.classList.remove('active');
      renderVanHanForm(content);
    });

    tabLaban.addEventListener('click', () => {
      tabLaban.classList.add('active');
      tabVanhan.classList.remove('active');
      renderLaBanForm(content);
    });
  }


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
      <div class="animate-fade-in">
        <div id="astro-life-balance-widget-container"></div>
      </div>
    `;
    const target = container.querySelector('#astro-life-balance-widget-container');
    if (target) {
      target.id = 'life-balance-radar-widget';
      const AL = window.AstrologyLogic;
      const profile = window.getUserProfile ? window.getUserProfile() : null;
      if (typeof window.renderLifeBalanceRadarWidget === 'function') {
        window.renderLifeBalanceRadarWidget(new Date(), profile);
      } else {
        target.innerHTML = `<div class="tuvi-card" style="padding:16px;">Vui lòng quay lại Dashboard để xem Bảng Cân Bằng Radar 6 Trụ Cột.</div>`;
      }
    }
  }

  // Export
  window.renderAstrology = renderAstrology;

})();
