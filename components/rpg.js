// ============================================
// NỘI TÂM — RPG Component (#9)
// RPG Cuộc Đời — Character Sheet, Skill Tree & Bản Đồ Thế Giới Cá Nhân
// ============================================

(function () {
  'use strict';

  function renderRPG(container) {
    const AL = window.AstrologyLogic;
    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim' };
    const phucDucPts = (window.App && window.App.Storage) ? (App.Storage.get('phuc_duc_points') || 120) : 120;

    const stats = (AL && typeof AL.calculateCharacterStats === 'function') ? AL.calculateCharacterStats(userProfile, phucDucPts) : {
      vit: 85, int: 90, cha: 75, wis: 88, str: 80, dex: 92, totalPower: 510, phucDucPoints: phucDucPts
    };

    const skillTree = (AL && typeof AL.getSkillTreeData === 'function') ? AL.getSkillTreeData() : [];

    container.innerHTML = `
      <div class="rpg-module animate-fade-in" style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- RPG Header Banner -->
        <div class="card tuvi-card" style="background:linear-gradient(135deg, rgba(30, 20, 45, 0.95), rgba(15, 10, 25, 0.95)); border:1px solid var(--border-accent); padding:24px; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.8rem;">🎮</span>
                <div>
                  <h2 style="font-family:'Cinzel',serif; margin:0; color:var(--accent-primary); font-size:1.5rem;">
                    RPG Cuộc Đời — Character Sheet & Skill Tree
                  </h2>
                  <p style="margin:4px 0 0 0; color:var(--text-secondary); font-size:0.9rem;">
                    Game-hóa hành trình phát triển cá nhân theo 6 Trụ Cột Năng Lượng
                  </p>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <span class="badge" style="background:rgba(245, 158, 11, 0.15); color:#f59e0b; border:1px solid #f59e0b; padding:6px 14px; border-radius:20px; font-weight:700;">
                ⚡ Tổng Lực Chiến (Total Power): ${stats.totalPower}
              </span>
              <span class="badge" style="background:var(--accent-muted); color:var(--accent-primary); border:1px solid var(--border-accent); padding:6px 14px; border-radius:20px; font-weight:700;">
                🌱 Điểm Phúc Đức: ${stats.phucDucPoints} KP
              </span>
            </div>
          </div>
        </div>

        <!-- Archetype Class & Synchronicity Passive Skill -->
        ${(function() {
          const Engine = window.ZiweiLuanGiaiEngine;
          if (!Engine) return '';
          const dict = window.ZiweiDictionary || {};
          let chart = null;
          if (AL && AL.TuViEngine) {
            try {
              chart = AL.TuViEngine.calculateTuViChart({
                day: userProfile.day || 1, month: userProfile.month || 1, year: userProfile.year || 1990,
                hour: (userProfile.hour ?? 12), minute: userProfile.minute || 0,
                gender: userProfile.gender || 'Nam', canNam: userProfile.canNam || 'Canh', chiNam: userProfile.chiNam || 'Thìn'
              });
            } catch (e) {}
          }
          const menhAnalysis = Engine.analyzeMenhCung(chart);
          return `
            <div class="card" style="padding:20px; border-radius:16px; background:linear-gradient(135deg, rgba(30,27,75,0.7), rgba(15,23,42,0.85)); border:1px solid rgba(168,85,247,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
                <div>
                  <div style="font-size:0.75rem; color:#a855f7; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">🎭 ARCHETYPE CLASS HỆ THỐNG</div>
                  <h3 style="font-family:'Cinzel',serif; margin:2px 0 0; color:#fff; font-size:1.25rem;">
                    Class: ${menhAnalysis.primaryStar} — ${menhAnalysis.archetype}
                  </h3>
                </div>
                <div style="font-size:0.8rem; font-weight:700; color:#38bdf8; background:rgba(56,189,248,0.1); padding:4px 12px; border-radius:12px; border:1px solid rgba(56,189,248,0.2);">
                  ${menhAnalysis.batQuai.symbol} Quẻ ${menhAnalysis.batQuai.que} (${menhAnalysis.batQuai.hanh})
                </div>
              </div>
              <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
                ⚡ <b>Kỹ Năng Đồng Bộ Nội Tại (Passive Skill):</b> ${menhAnalysis.synchronicity}
              </div>
            </div>
          `;
        })()}

        <!-- 6 RPG Stats Character Sheet -->
        <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary); font-size:1.1rem;">
            🛡️ Bảng Chỉ Số Nhân Vật (6 Trụ Cột)
          </h3>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-top:14px;">
            ${[
              { name: 'VIT (Thân Tâm)', val: stats.vit, icon: '🧘', color: '#10b981' },
              { name: 'INT (Sự Nghiệp)', val: stats.int, icon: '👑', color: '#3b82f6' },
              { name: 'CHA (Gia Đạo)', val: stats.cha, icon: '🏡', color: '#ec4899' },
              { name: 'WIS (Mối Quan Hệ)', val: stats.wis, icon: '🤝', color: '#8b5cf6' },
              { name: 'STR (Tài Chính)', val: stats.str, icon: '💰', color: '#f59e0b' },
              { name: 'DEX (Tri Thức)', val: stats.dex, icon: '📚', color: '#06b6d4' }
            ].map(s => `
              <div style="padding:12px; background:var(--bg-card); border-radius:10px; border:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; font-size:0.85rem;">${s.icon} ${s.name}</span>
                  <span style="font-weight:800; color:${s.color}; font-size:0.95rem;">${s.val}</span>
                </div>
                <div style="width:100%; height:6px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden;">
                  <div style="width:${s.val}%; height:100%; background:${s.color}; border-radius:3px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Interactive Skill Tree Grid -->
        <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary); font-size:1.1rem;">
            🌳 Cây Kỹ Năng Kỷ Luật (Skill Tree)
          </h3>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:14px;">
            ${skillTree.map(branch => `
              <div style="padding:16px; background:var(--bg-card); border-radius:12px; border:1px solid var(--border-color);">
                <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:${branch.color}; margin-bottom:12px;">
                  <span style="font-size:1.3rem;">${branch.icon}</span>
                  <span>${branch.name}</span>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                  ${branch.skills.map(sk => `
                    <div style="padding:10px; background:var(--bg-surface); border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-weight:600; font-size:0.88rem;">${sk.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${sk.desc}</div>
                      </div>
                      <span class="badge" style="background:${branch.color}22; color:${branch.color}; font-weight:700; border:1px solid ${branch.color}44;">
                        Lv.${sk.level}/${sk.maxLevel}
                      </span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- World Map 60 Years (Fog of War) -->
        <div class="card" style="padding:20px; border-radius:16px; background:var(--bg-surface); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-family:'Cinzel',serif; color:var(--accent-primary); font-size:1.1rem;">
            🗺️ Bản Đồ Thế Giới Hành Trình 60 Năm (Fog of War)
          </h3>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:14px;">
            Các mốc tuổi quá khứ đã được khám phá (Explored), các mốc tuổi tương lai được bao phủ bởi sương mù chiến thuật (Fog of War).
          </p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(60px, 1fr)); gap:8px;">
            ${Array.from({ length: 21 }, (_, i) => 30 + i * 2).map(age => {
              const isPast = age <= 31;
              const isCurrent = age === 31;
              return `
                <div style="padding:10px 4px; text-align:center; border-radius:8px; border:1px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border-color)'}; background:${isCurrent ? 'var(--accent-muted)' : isPast ? 'var(--bg-card)' : 'rgba(0,0,0,0.4)'}; opacity:${isPast ? '1' : '0.55'}; font-weight:${isCurrent ? '800' : '600'}; color:${isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                  <div style="font-size:0.75rem;">${isPast ? '🚩' : '🌫️'}</div>
                  <div style="font-size:0.8rem; margin-top:2px;">${age}t</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  window.renderRPG = renderRPG;
})();
