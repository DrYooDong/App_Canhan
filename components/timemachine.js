// ============================================
// NỘI TÂM — Component Trình Mô Phỏng Time-Machine Cuộc Đời (20 - 80 Tuổi)
// ============================================

(function() {
  'use strict';

  let currentSelectedAge = 31;

  function getMilestones() {
    try {
      const stored = localStorage.getItem('noitam_timemachine_milestones');
      return stored ? JSON.parse(stored) : {
        "22": "Tốt nghiệp Đại học",
        "26": "Mua căn nhà đầu tiên",
        "35": "Kế hoạch khởi nghiệp công ty riêng",
        "45": "Xây dựng quỹ hưu trí & Cố vấn",
        "55": "Du lịch dưỡng sinh & Nghiên cứu Triết học"
      };
    } catch (e) {
      return {};
    }
  }

  function saveMilestones(milestones) {
    try {
      localStorage.setItem('noitam_timemachine_milestones', JSON.stringify(milestones));
    } catch (e) {}
  }

  function renderTimeMachine(container) {
    const AL = window.AstrologyLogic;
    if (!AL || typeof AL.calculateLifeTimeline !== 'function') {
      container.innerHTML = `
        <div class="card" style="padding:24px;text-align:center;">
          <p style="color:var(--text-muted);">Đang khởi tạo Engine Time-Machine...</p>
        </div>
      `;
      return;
    }

    const userProfile = (AL && typeof AL.getUserProfile === 'function') ? AL.getUserProfile() : {
      birthYear: 1995,
      currentAge: 31,
      canNam: 'Ất',
      chiNam: 'Hợi',
      hanhMenh: 'Hỏa'
    };

    const timelineData = AL.calculateLifeTimeline(userProfile);
    const yearlyMap = {};
    timelineData.yearlyData.forEach(item => {
      yearlyMap[item.age] = item;
    });

    if (!yearlyMap[currentSelectedAge]) {
      currentSelectedAge = timelineData.currentAge || 31;
    }

    let milestones = getMilestones();

    function renderUI() {
      const activeData = yearlyMap[currentSelectedAge] || timelineData.yearlyData[0];
      const milestoneText = milestones[currentSelectedAge] || '';

      container.innerHTML = `
        <div class="timemachine-module animate-fade-in" style="display:flex;flex-direction:column;gap:24px;">
          
          <!-- Header Banner -->
          <div class="card tuvi-card" style="background:linear-gradient(135deg, rgba(30,35,60,0.85), rgba(15,18,30,0.95));border:1px solid var(--border-accent);padding:24px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:2rem;">⏳</span>
                  <div>
                    <h2 style="font-family:'Cinzel',serif;margin:0;color:var(--accent-primary);font-size:1.5rem;">
                      Trình Mô Phỏng "Time-Machine" Cuộc Đời
                    </h2>
                    <p style="margin:4px 0 0 0;color:var(--text-secondary);font-size:0.9rem;">
                      Bản đồ Chiến lược Thời gian & Phân bổ Nguồn lực 60 Năm (20 – 80 Tuổi)
                    </p>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span class="badge" style="background:var(--accent-muted);color:var(--accent-primary);border:1px solid var(--border-accent);padding:6px 14px;border-radius:20px;font-size:0.85rem;font-weight:600;">
                  Bản Mệnh: ${userProfile.canNam} ${userProfile.chiNam} (${userProfile.hanhMenh})
                </span>
                <span class="badge" style="background:rgba(255,255,255,0.05);color:var(--text-primary);border:1px solid var(--border-color);padding:6px 14px;border-radius:20px;font-size:0.85rem;">
                  Năm sinh: ${userProfile.birthYear}
                </span>
              </div>
            </div>
          </div>

          <!-- Interactive Timeline Slider Section -->
          <div class="card" style="padding:24px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border-color);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:1.4rem;">🎯</span>
                <h3 style="margin:0;font-size:1.15rem;font-weight:700;">Thanh Trượt Thời Gian (Timeline Control)</h3>
              </div>
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="font-size:1.2rem;font-weight:800;color:var(--accent-primary);background:var(--accent-muted);padding:6px 16px;border-radius:12px;border:1px solid var(--border-accent);">
                  Tuổi ${activeData.age} <span style="font-size:0.9rem;font-weight:400;color:var(--text-secondary);">(Năm ${activeData.calendarYear} - ${activeData.canChi})</span>
                </div>
              </div>
            </div>

            <!-- Slider Control -->
            <div style="margin:20px 0 12px 0;">
              <input type="range" id="timemachine-slider" min="20" max="80" value="${activeData.age}" 
                style="width:100%;height:8px;border-radius:4px;cursor:pointer;accent-color:var(--accent-primary);">
            </div>

            <!-- Heatmap Strip -->
            <div style="margin-top:16px;">
              <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">
                <span>20 Tuổi</span>
                <span>30 Tuổi</span>
                <span>40 Tuổi</span>
                <span>50 Tuổi</span>
                <span>60 Tuổi</span>
                <span>70 Tuổi</span>
                <span>80 Tuổi</span>
              </div>
              <div id="heatmap-strip" style="display:grid;grid-template-columns:repeat(61, 1fr);gap:2px;height:24px;padding:4px;background:rgba(0,0,0,0.15);border-radius:8px;border:1px solid var(--border-color);">
                ${timelineData.yearlyData.map(item => {
                  let bgColor = 'var(--warning-color, #f39c12)';
                  if (item.lesScore >= 80) bgColor = '#2ecc71';
                  else if (item.lesScore < 55) bgColor = '#e74c3c';
                  const isSelected = item.age === activeData.age;
                  const isCurrent = item.isCurrentAge;
                  const hasMilestone = !!milestones[item.age];

                  return `
                    <div class="strip-pill" data-age="${item.age}" title="Tuổi ${item.age} (${item.calendarYear}): LES ${item.lesScore} - ${item.statusFlag}"
                      style="background:${bgColor};opacity:${isSelected ? 1 : 0.65};border-radius:3px;cursor:pointer;transition:all 0.2s;position:relative;border:${isSelected ? '2px solid #fff' : 'none'};transform:${isSelected ? 'scaleY(1.2)' : 'scaleY(1)'};">
                      ${isCurrent ? '<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:4px;height:4px;background:#fff;border-radius:50%;"></div>' : ''}
                      ${hasMilestone ? '<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:4px;height:4px;background:#f1c40f;border-radius:50%;"></div>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="display:flex;gap:16px;justify-content:center;margin-top:10px;font-size:0.8rem;color:var(--text-secondary);">
                <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;background:#2ecc71;border-radius:2px;display:inline-block;"></span> 🟢 Tấn Công (LES ≥ 80)</span>
                <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;background:#f39c12;border-radius:2px;display:inline-block;"></span> 🟡 Bình Hòa (50 ≤ LES < 80)</span>
                <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;background:#e74c3c;border-radius:2px;display:inline-block;"></span> 🔴 Phòng Thủ (LES < 50)</span>
              </div>
            </div>

            <!-- Decades Quick Jump Buttons -->
            <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
              <button class="btn btn-sm btn-decade" data-age="${userProfile.currentAge}" style="background:var(--accent-muted);color:var(--accent-primary);border:1px solid var(--border-accent);">📍 Hiện Tại (${userProfile.currentAge}t)</button>
              <button class="btn btn-sm btn-decade" data-age="25">25t</button>
              <button class="btn btn-sm btn-decade" data-age="30">30t</button>
              <button class="btn btn-sm btn-decade" data-age="35">35t</button>
              <button class="btn btn-sm btn-decade" data-age="40">40t</button>
              <button class="btn btn-sm btn-decade" data-age="45">45t</button>
              <button class="btn btn-sm btn-decade" data-age="50">50t</button>
              <button class="btn btn-sm btn-decade" data-age="55">55t</button>
              <button class="btn btn-sm btn-decade" data-age="60">60t</button>
              <button class="btn btn-sm btn-decade" data-age="70">70t</button>
              <button class="btn btn-sm btn-decade" data-age="80">80t</button>
            </div>
          </div>

          <!-- Selected Year Report Dashboard -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">
            
            <!-- Left Card: Main Energy & 4 Pillars -->
            <div class="card" style="padding:24px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:20px;">
              
              <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--border-color);padding-bottom:14px;">
                <div>
                  <span style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Mốc Thời Gian Được Chọn</span>
                  <h3 style="margin:4px 0 0 0;font-size:1.3rem;color:var(--text-primary);font-weight:700;">
                    Tuổi ${activeData.age} (Năm ${activeData.calendarYear} - ${activeData.canChi})
                  </h3>
                  <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">
                    🏰 Đại Vận: <strong>${activeData.decadeRange} Tuổi</strong> tại Cung <strong>${activeData.decadePalace}</strong>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:1.8rem;font-weight:900;color:${activeData.lesScore >= 80 ? '#2ecc71' : activeData.lesScore >= 55 ? '#f39c12' : '#e74c3c'};line-height:1;">
                    ${activeData.lesScore}<span style="font-size:1rem;font-weight:400;color:var(--text-muted);">/100</span>
                  </div>
                  <span class="badge" style="margin-top:6px;display:inline-block;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;background:rgba(255,255,255,0.06);color:${activeData.lesScore >= 80 ? '#2ecc71' : activeData.lesScore >= 55 ? '#f39c12' : '#e74c3c'};">
                    ${activeData.statusFlag}
                  </span>
                </div>
              </div>

              <!-- 4 Pillars Breakdown -->
              <div>
                <h4 style="margin:0 0 14px 0;font-size:1rem;color:var(--accent-primary);display:flex;align-items:center;gap:8px;">
                  <span>📊</span> Đánh Giá 4 Trụ Cột Đời Sống
                </h4>

                <div style="display:flex;flex-direction:column;gap:12px;">
                  <!-- Career -->
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                      <span style="font-weight:600;color:var(--text-primary);">💼 Sự Nghiệp & Công Danh</span>
                      <span style="font-weight:700;color:var(--accent-primary);">${activeData.fourPillars.career}%</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div style="height:100%;width:${activeData.fourPillars.career}%;background:linear-gradient(90deg, #3498db, #2ecc71);border-radius:4px;"></div>
                    </div>
                  </div>

                  <!-- Finance -->
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                      <span style="font-weight:600;color:var(--text-primary);">💰 Tài Chính & Tài Sản</span>
                      <span style="font-weight:700;color:var(--accent-primary);">${activeData.fourPillars.finance}%</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div style="height:100%;width:${activeData.fourPillars.finance}%;background:linear-gradient(90deg, #f1c40f, #2ecc71);border-radius:4px;"></div>
                    </div>
                  </div>

                  <!-- Health -->
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                      <span style="font-weight:600;color:var(--text-primary);">🧘 Sức Khỏe & Thân Tâm</span>
                      <span style="font-weight:700;color:var(--accent-primary);">${activeData.fourPillars.health}%</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div style="height:100%;width:${activeData.fourPillars.health}%;background:linear-gradient(90deg, #e67e22, #2ecc71);border-radius:4px;"></div>
                    </div>
                  </div>

                  <!-- Relationship -->
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                      <span style="font-weight:600;color:var(--text-primary);">❤️ Mối Quan Hệ & Gia Đạo</span>
                      <span style="font-weight:700;color:var(--accent-primary);">${activeData.fourPillars.relationship}%</span>
                    </div>
                    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                      <div style="height:100%;width:${activeData.fourPillars.relationship}%;background:linear-gradient(90deg, #9b59b6, #2ecc71);border-radius:4px;"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active Stars -->
              <div style="background:var(--bg-body);padding:12px 16px;border-radius:12px;border:1px solid var(--border-color);">
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">⭐ Sao Lưu Chiếu Mệnh Chính trong Năm:</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${activeData.keyActiveStars.map(star => `
                    <span class="badge" style="background:var(--accent-muted);color:var(--accent-primary);padding:3px 10px;border-radius:12px;font-size:0.8rem;border:1px solid var(--border-accent);">
                      ${star}
                    </span>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- Right Card: Strategy, Advice & Hexagram -->
            <div class="card" style="padding:24px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:20px;">
              
              <div>
                <h4 style="margin:0 0 12px 0;font-size:1rem;color:var(--accent-primary);display:flex;align-items:center;gap:8px;">
                  <span>📝</span> Định Hướng Chiến Lược Năm ${activeData.calendarYear}
                </h4>
                <div style="background:var(--bg-body);padding:14px 16px;border-radius:12px;border-left:4px solid var(--accent-primary);font-size:0.9rem;line-height:1.6;color:var(--text-primary);">
                  ${activeData.strategicAdvice}
                </div>
              </div>

              <!-- Hexagram Mai Hoa -->
              <div>
                <h4 style="margin:0 0 10px 0;font-size:0.95rem;color:var(--text-secondary);display:flex;align-items:center;gap:8px;">
                  <span>☯️</span> Quẻ Dịch Chủ Năm (Mai Hoa Dịch Số)
                </h4>
                <div style="background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:12px;border:1px solid var(--border-color);">
                  <div style="font-weight:700;color:var(--accent-primary);font-size:0.95rem;">
                    ${activeData.ichingHexagram.name}
                  </div>
                  <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;line-height:1.5;">
                    ${activeData.ichingHexagram.desc}
                  </div>
                </div>
              </div>

              <!-- Life Milestone Pinning Section -->
              <div style="border-top:1px solid var(--border-color);padding-top:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <h4 style="margin:0;font-size:0.95rem;color:var(--accent-primary);display:flex;align-items:center;gap:8px;">
                    <span>📌</span> Cột Mốc Đời Thực Ghim Vào Tuổi ${activeData.age}
                  </h4>
                </div>

                ${milestoneText ? `
                  <div style="background:var(--accent-muted);padding:12px 16px;border-radius:12px;border:1px solid var(--border-accent);display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div>
                      <div style="font-weight:700;color:var(--accent-primary);font-size:0.95rem;">
                        "${milestoneText}"
                      </div>
                      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">
                        ${activeData.age <= userProfile.currentAge ? ' (Mốc quá khứ đã nghiệm lý)' : ' (Kế hoạch mục tiêu tương lai)'}
                      </div>
                    </div>
                    <button class="btn btn-sm btn-ghost" id="btn-edit-milestone" title="Sửa cột mốc">✏️</button>
                  </div>

                  <!-- AI Strategic Evaluation for Milestone -->
                  <div style="margin-top:10px;background:rgba(46,204,113,0.08);border:1px dashed #2ecc71;padding:10px 14px;border-radius:10px;font-size:0.82rem;line-height:1.5;color:var(--text-primary);">
                    💡 <strong>Đánh Giá Tọa Độ Tử Vi</strong>: 
                    ${activeData.lesScore >= 80 
                      ? `Mốc tuổi ${activeData.age} có điểm năng lượng rất cao (${activeData.lesScore}/100), tọa độ sao Lưu ủng hộ mạnh mẽ mục tiêu "${milestoneText}". Khuyên tập trung 100% nguồn lực.`
                      : `Mốc tuổi ${activeData.age} nằm trong nhịp tích lũy (${activeData.lesScore}/100). Nên chuẩn bị sẵn sàng từ tuổi ${activeData.age - 1} để hiện thực hóa "${milestoneText}" trơn tru nhất.`
                    }
                  </div>
                ` : `
                  <div style="display:flex;gap:8px;">
                    <input type="text" id="milestone-input" placeholder="Nhập mục tiêu/cột mốc (vd: Mua nhà, Khởi nghiệp, Kết hôn...)" 
                      style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-body);color:var(--text-primary);font-size:0.85rem;">
                    <button class="btn btn-primary btn-sm" id="btn-save-milestone" style="white-space:nowrap;padding:8px 14px;border-radius:8px;">Ghim</button>
                  </div>
                `}
              </div>

            </div>

          </div>

        </div>
      `;

      // Attach Event Listeners
      const slider = container.querySelector('#timemachine-slider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          currentSelectedAge = parseInt(e.target.value, 10);
          renderUI();
        });
      }

      container.querySelectorAll('.strip-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          currentSelectedAge = parseInt(pill.dataset.age, 10);
          renderUI();
        });
      });

      container.querySelectorAll('.btn-decade').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSelectedAge = parseInt(btn.dataset.age, 10);
          renderUI();
        });
      });

      const btnSaveMilestone = container.querySelector('#btn-save-milestone');
      if (btnSaveMilestone) {
        btnSaveMilestone.addEventListener('click', () => {
          const input = container.querySelector('#milestone-input');
          if (input && input.value.trim()) {
            milestones[currentSelectedAge] = input.value.trim();
            saveMilestones(milestones);
            renderUI();
          }
        });
      }

      const btnEditMilestone = container.querySelector('#btn-edit-milestone');
      if (btnEditMilestone) {
        btnEditMilestone.addEventListener('click', () => {
          delete milestones[currentSelectedAge];
          saveMilestones(milestones);
          renderUI();
        });
      }
    }

    renderUI();
  }

  // Expose component to global window
  window.renderTimeMachine = renderTimeMachine;

})();
