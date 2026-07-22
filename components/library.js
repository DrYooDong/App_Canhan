// ============================================
// NỘI TÂM — Library Component (Thư viện tài liệu)
// ============================================

(function() {
  'use strict';

  function renderLibrary(container) {
    const { Utils } = App;

    // Group Tử Vi data by sections for a reading library experience
    const sections = TUVI_SECTIONS;

    container.innerHTML = `
      <div class="animate-fade-in">
        <h1 class="page-title">Thư viện Tài liệu</h1>
        <p class="page-subtitle">Kho tri thức từ Tử Vi cá nhân — 100 mục, ${TUVI_SECTIONS.length} phần</p>
      </div>

      <!-- Tử Vi Summary Card -->
      <div class="card card-highlight stagger-item" style="margin-bottom:var(--space-xl);">
        <div class="flex items-center gap-md">
          <div style="font-size:2.5rem;">☯</div>
          <div>
            <h3 class="card-title">Lá số Tử Vi — Đồng Âm cư Tý / Cơ Nguyệt Đồng Lương</h3>
            <p class="card-text">Mệnh Đồng Âm tại Tý • Phúc Cự Nhật Hóa Lộc • Bạch Lạp Kim • Hỏa Lục Cục • Điểm: 8.5/10</p>
          </div>
        </div>
      </div>

      <!-- Section Cards -->
      <div class="grid-2 stagger-item" style="margin-bottom:var(--space-xl);">
        ${sections.map(section => {
          const items = TUVI_DATA.filter(d => d.section === section.id);
          const strengths = items.filter(d => d.type === 'strength').length;
          const weaknesses = items.filter(d => d.type === 'weakness').length;
          return `
            <div class="card" style="cursor:pointer;" onclick="App.Router.navigate('overview')">
              <div class="flex items-center gap-sm mb-sm">
                <span style="font-size:1.5rem;">${section.icon}</span>
                <div>
                  <h4 class="card-title" style="margin-bottom:0;">${section.name}</h4>
                  <p class="text-xs text-muted">${section.description}</p>
                </div>
              </div>
              <div class="flex gap-sm mt-md">
                <span class="tag tag-info">${items.length} mục</span>
                ${strengths > 0 ? `<span class="tag tag-strength">💪 ${strengths}</span>` : ''}
                ${weaknesses > 0 ? `<span class="tag tag-weakness">⚠️ ${weaknesses}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Key Insights Quick Access -->
      <div class="stagger-item">
        <div class="section-title"><span class="icon">🔑</span> Thông tin mấu chốt</div>
        <div class="grid-auto">
          ${renderKeyInsight('Điểm mạnh cốt lõi', TUVI_DATA.find(d => d.id === 91))}
          ${renderKeyInsight('Điểm yếu chí mạng', TUVI_DATA.find(d => d.id === 92))}
          ${renderKeyInsight('Định hướng Tu dưỡng', TUVI_DATA.find(d => d.id === 94))}
          ${renderKeyInsight('Thông điệp cuối', TUVI_DATA.find(d => d.id === 100))}
        </div>
      </div>

      <div class="divider"></div>

      <!-- Reading Guide -->
      <div class="stagger-item">
        <div class="section-title"><span class="icon">📚</span> Hướng dẫn sử dụng</div>
        <div class="card">
          <p class="card-text" style="line-height:2;">
            Web cá nhân này được xây dựng quanh 3 nguyên tắc: <strong class="text-accent">hiểu mình</strong>, lưu tri thức sống, và <strong class="text-accent">nhắc mình đúng lúc</strong>.<br><br>
            📌 <strong>Tổng quan cuộc đời</strong> — Đọc và chiêm nghiệm lá số Tử Vi, hiểu điểm mạnh, điểm yếu, xu hướng cuộc đời.<br>
            📖 <strong>Bài học đúc kết</strong> — Ghi lại những bài học rút ra từ trải nghiệm thực tế, liên kết với điểm mạnh/yếu.<br>
            ⚖️ <strong>Quy luật xã hội</strong> — Thu thập những nguyên tắc sống, quan hệ, quyền lực từ sách vở và kinh nghiệm.<br>
            💡 <strong>Lời nhắc nhở</strong> — Tạo lời nhắc theo trạng thái cảm xúc, dùng nút SOS khi cần ngay lập tức.<br>
            📓 <strong>Nhật ký phản tư</strong> — Viết nhật ký hàng ngày với prompt gợi mở từ Tử Vi.
          </p>
        </div>
      </div>
    `;
  }

  function renderKeyInsight(label, item) {
    if (!item) return '';
    return `
      <div class="card" style="cursor:pointer;" onclick="App.Router.navigate('overview')">
        <div class="text-xs text-accent mb-sm" style="text-transform:uppercase;letter-spacing:0.1em;">${label}</div>
        <h4 class="card-title" style="font-size:var(--text-sm);">${App.Utils.escapeHtml(item.title)}</h4>
        <p class="card-text" style="font-size:var(--text-xs);">${App.Utils.escapeHtml(item.content).substring(0, 120)}...</p>
      </div>
    `;
  }

  window.renderLibrary = renderLibrary;
})();
