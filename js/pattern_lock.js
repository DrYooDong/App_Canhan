// ==============================================================================
// 9-DOT PATTERN LOCK CONTROLLER (VẼ HÌNH MỞ KHÓA 9 NÚT)
// ==============================================================================

class PatternLockController {
  constructor() {
    this.dots = [
      { id: 1, x: 50,  y: 50  },
      { id: 2, x: 150, y: 50  },
      { id: 3, x: 250, y: 50  },
      { id: 4, x: 50,  y: 150 },
      { id: 5, x: 150, y: 150 },
      { id: 6, x: 250, y: 150 },
      { id: 7, x: 50,  y: 250 },
      { id: 8, x: 150, y: 250 },
      { id: 9, x: 250, y: 250 }
    ];

    // Bảng trung gian khi kéo thẳng qua 1 nút (Ví dụ kéo 1 -> 3 sẽ tự động đi qua 2)
    this.intermediateMap = {
      '1-3': 2, '3-1': 2,
      '4-6': 5, '6-4': 5,
      '7-9': 8, '9-7': 8,
      '1-7': 4, '7-1': 4,
      '2-8': 5, '8-2': 5,
      '3-9': 6, '9-3': 6,
      '1-9': 5, '9-1': 5,
      '3-7': 5, '7-3': 5
    };

    // Mẫu mặc định: Chữ L (1-4-7-8-9), Chữ Z (1-2-3-5-7-8-9), Chữ L ngược (1-2-3-6-9), v.v.
    this.defaultPatterns = ['1-4-7-8-9', '1-2-3-6-9', '1-2-3-5-7-8-9', '1-2-3-6'];

    // Trạng thái cho màn hình mở khóa chính
    this.isDrawing = false;
    this.selectedDots = [];
    this.currentPointer = null;

    // Trạng thái cho modal thiết lập hình vẽ mới
    this.recordStep = 1; // 1: Vẽ lần 1, 2: Xác nhận lần 2
    this.firstPattern = null;
    this.isRecordDrawing = false;
    this.recordSelectedDots = [];

    this.init();
  }

  init() {
    this.setupMainGateLock();
    this.setupRecordLock();
    this.updateProfileBadge();
  }

  // Khởi tạo bàn vẽ trên màn hình mở khóa Gate
  setupMainGateLock() {
    const svg = document.getElementById('patternLockSvg');
    if (!svg) return;
    this.buildSvgMarkup(svg);
    this.attachPointerEvents(svg, false);
  }

  // Khởi tạo bàn vẽ trên Modal đổi hình vẽ
  setupRecordLock() {
    const svg = document.getElementById('patternRecordSvg');
    if (!svg) return;
    this.buildSvgMarkup(svg);
    this.attachPointerEvents(svg, true);
  }

  buildSvgMarkup(svg) {
    svg.innerHTML = `
      <defs>
        <filter id="dotGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Đường vẽ kết nối các điểm -->
      <path class="pattern-path" d="" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Đường kéo theo con trỏ chuột/ngón tay -->
      <line class="pattern-follower" x1="0" y1="0" x2="0" y2="0" stroke-linecap="round" />
      <!-- 9 điểm nút -->
      <g class="pattern-dots-group">
        ${this.dots.map(d => `
          <g class="dot-node" data-id="${d.id}" transform="translate(${d.x}, ${d.y})">
            <!-- Vùng cảm ứng mở rộng -->
            <circle class="dot-hit-zone" r="38" fill="transparent" />
            <!-- Vòng tròn hiệu ứng ngoài -->
            <circle class="dot-ring" r="22" />
            <!-- Lõi điểm tròn giữa -->
            <circle class="dot-core" r="8" />
          </g>
        `).join('')}
      </g>
    `;
  }

  attachPointerEvents(svg, isRecord) {
    const getPointInSvg = (e) => {
      const rect = svg.getBoundingClientRect();
      const scale = 300 / rect.width;
      return {
        x: (e.clientX - rect.left) * scale,
        y: (e.clientY - rect.top) * scale
      };
    };

    const getNearestDot = (pt, hitRadius = 38) => {
      for (const d of this.dots) {
        const dist = Math.hypot(d.x - pt.x, d.y - pt.y);
        if (dist <= hitRadius) return d;
      }
      return null;
    };

    const onPointerDown = (e) => {
      svg.setPointerCapture(e.pointerId);
      const pt = getPointInSvg(e);
      const dot = getNearestDot(pt);

      if (isRecord) {
        this.isRecordDrawing = true;
        this.recordSelectedDots = dot ? [dot.id] : [];
        this.renderSvgState(svg, this.recordSelectedDots, pt);
      } else {
        this.isDrawing = true;
        this.selectedDots = dot ? [dot.id] : [];
        this.renderSvgState(svg, this.selectedDots, pt);
      }

      if (dot && navigator.vibrate) {
        navigator.vibrate(10);
      }
    };

    const onPointerMove = (e) => {
      const isDrawing = isRecord ? this.isRecordDrawing : this.isDrawing;
      if (!isDrawing) return;

      const pt = getPointInSvg(e);
      const dot = getNearestDot(pt);
      const currentList = isRecord ? this.recordSelectedDots : this.selectedDots;

      if (dot && !currentList.includes(dot.id)) {
        if (currentList.length > 0) {
          const lastId = currentList[currentList.length - 1];
          const bridgeKey = `${lastId}-${dot.id}`;
          const intermediateId = this.intermediateMap[bridgeKey];
          if (intermediateId && !currentList.includes(intermediateId)) {
            currentList.push(intermediateId);
          }
        }
        currentList.push(dot.id);
        if (navigator.vibrate) navigator.vibrate(12);
      }

      this.renderSvgState(svg, currentList, pt);
    };

    const onPointerUp = (e) => {
      const isDrawing = isRecord ? this.isRecordDrawing : this.isDrawing;
      if (!isDrawing) return;

      try { svg.releasePointerCapture(e.pointerId); } catch (err) {}

      if (isRecord) {
        this.isRecordDrawing = false;
        this.renderSvgState(svg, this.recordSelectedDots, null);
        this.handleRecordPointerUp();
      } else {
        this.isDrawing = false;
        this.renderSvgState(svg, this.selectedDots, null);
        this.handleGatePointerUp();
      }
    };

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('pointercancel', onPointerUp);
  }

  renderSvgState(svg, selectedDotIds, pointerPt = null) {
    const pathEl = svg.querySelector('.pattern-path');
    const followerEl = svg.querySelector('.pattern-follower');
    const dotNodes = svg.querySelectorAll('.dot-node');

    // Cập nhật trạng thái từng nút
    dotNodes.forEach(node => {
      const id = parseInt(node.getAttribute('data-id'), 10);
      const isSelected = selectedDotIds.includes(id);
      node.classList.toggle('active', isSelected);
    });

    // Vẽ đường path nối các nút đã chọn
    if (selectedDotIds.length > 0) {
      let d = '';
      selectedDotIds.forEach((id, idx) => {
        const dot = this.dots.find(item => item.id === id);
        if (!dot) return;
        if (idx === 0) {
          d += `M ${dot.x} ${dot.y}`;
        } else {
          d += ` L ${dot.x} ${dot.y}`;
        }
      });
      if (pathEl) pathEl.setAttribute('d', d);
    } else {
      if (pathEl) pathEl.setAttribute('d', '');
    }

    // Vẽ đường kéo động theo con trỏ
    if (pointerPt && selectedDotIds.length > 0 && followerEl) {
      const lastId = selectedDotIds[selectedDotIds.length - 1];
      const lastDot = this.dots.find(item => item.id === lastId);
      if (lastDot) {
        followerEl.setAttribute('x1', lastDot.x);
        followerEl.setAttribute('y1', lastDot.y);
        followerEl.setAttribute('x2', pointerPt.x);
        followerEl.setAttribute('y2', pointerPt.y);
        followerEl.style.display = 'block';
      }
    } else if (followerEl) {
      followerEl.style.display = 'none';
    }
  }

  // Xử lý khi thả tay trên bàn vẽ mở khoá chính
  handleGatePointerUp() {
    const statusEl = document.getElementById('gatePatternStatus');
    const svg = document.getElementById('patternLockSvg');
    const wrap = document.getElementById('patternLockWrap');

    if (this.selectedDots.length === 0) return;

    if (this.selectedDots.length < 3) {
      if (statusEl) {
        statusEl.className = 'gate-pattern-status error';
        statusEl.innerText = '⚠️ Vui lòng nối ít nhất 3 điểm!';
      }
      this.triggerErrorFeedback(svg, wrap);
      setTimeout(() => this.reset(), 500);
      return;
    }

    const patternCode = this.selectedDots.join('-');
    const savedPattern = localStorage.getItem('medward_pattern_lock');

    let isValid = false;
    if (savedPattern) {
      isValid = (patternCode === savedPattern);
    } else {
      isValid = this.defaultPatterns.includes(patternCode);
    }

    if (isValid) {
      // Mở khóa thành công!
      if (statusEl) {
        statusEl.className = 'gate-pattern-status success';
        statusEl.innerText = '✓ Hình vẽ chính xác! Đang mở khoá...';
      }
      if (svg) svg.classList.add('pattern-success');
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);

      setTimeout(() => {
        window.authController?.unlockSession?.();
        this.reset();
      }, 350);
    } else {
      // Hình vẽ sai
      if (statusEl) {
        statusEl.className = 'gate-pattern-status error';
        statusEl.innerText = '❌ Hình vẽ chưa đúng! (Mặc định: Chữ L 1➔4➔7➔8➔9)';
      }
      this.triggerErrorFeedback(svg, wrap);
      setTimeout(() => {
        this.reset();
        if (statusEl) {
          statusEl.className = 'gate-pattern-status';
          statusEl.innerText = 'Vẽ hình nối các điểm để mở khoá';
        }
      }, 700);
    }
  }

  triggerErrorFeedback(svg, wrap) {
    if (svg) svg.classList.add('pattern-error');
    if (wrap) {
      wrap.classList.remove('shake-anim');
      void wrap.offsetWidth; // Force reflow
      wrap.classList.add('shake-anim');
    }
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  }

  // Đặt lại bàn vẽ về ban đầu
  reset() {
    this.selectedDots = [];
    this.isDrawing = false;
    const svg = document.getElementById('patternLockSvg');
    if (svg) {
      svg.classList.remove('pattern-success', 'pattern-error');
      this.renderSvgState(svg, []);
    }
    const statusEl = document.getElementById('gatePatternStatus');
    if (statusEl) {
      statusEl.className = 'gate-pattern-status';
      statusEl.innerText = 'Vẽ hình nối các điểm để mở khoá';
    }
  }

  // ==============================================================================
  // MODAL ĐỔI / THIẾT LẬP HÌNH VẼ MỚI (PATTERN RECORDER)
  // ==============================================================================
  openPatternChangeModal() {
    const modal = document.getElementById('patternChangeModal');
    if (!modal) return;
    this.recordStep = 1;
    this.firstPattern = null;
    this.recordSelectedDots = [];

    const statusEl = document.getElementById('patternRecordStatus');
    if (statusEl) {
      statusEl.className = 'gate-pattern-status';
      statusEl.innerText = 'Bước 1: Vẽ hình khoá mới (Nối từ 3 điểm trở lên)';
    }

    const svg = document.getElementById('patternRecordSvg');
    if (svg) {
      this.buildSvgMarkup(svg);
      this.attachPointerEvents(svg, true);
      this.renderSvgState(svg, []);
      svg.classList.remove('pattern-success', 'pattern-error');
    }

    modal.classList.add('active');
  }

  closePatternChangeModal() {
    const modal = document.getElementById('patternChangeModal');
    if (modal) modal.classList.remove('active');
    this.recordStep = 1;
    this.firstPattern = null;
    this.recordSelectedDots = [];
  }

  handleRecordPointerUp() {
    const svg = document.getElementById('patternRecordSvg');
    const wrap = document.getElementById('patternRecordWrap');
    const statusEl = document.getElementById('patternRecordStatus');

    if (this.recordSelectedDots.length === 0) return;

    if (this.recordSelectedDots.length < 3) {
      if (statusEl) {
        statusEl.className = 'gate-pattern-status error';
        statusEl.innerText = '⚠️ Hình vẽ quá ngắn! Vui lòng nối từ 3 điểm trở lên.';
      }
      this.triggerErrorFeedback(svg, wrap);
      setTimeout(() => {
        this.recordSelectedDots = [];
        this.renderSvgState(svg, []);
        svg.classList.remove('pattern-error');
      }, 500);
      return;
    }

    const currentPattern = this.recordSelectedDots.join('-');

    if (this.recordStep === 1) {
      // Đã vẽ xong bước 1
      this.firstPattern = currentPattern;
      this.recordStep = 2;
      if (svg) svg.classList.add('pattern-success');
      if (statusEl) {
        statusEl.className = 'gate-pattern-status success';
        statusEl.innerText = '✓ Đã ghi nhận! Bước 2: Hãy vẽ lại lần nữa để xác nhận.';
      }

      setTimeout(() => {
        this.recordSelectedDots = [];
        if (svg) {
          svg.classList.remove('pattern-success');
          this.renderSvgState(svg, []);
        }
        if (statusEl) {
          statusEl.className = 'gate-pattern-status';
          statusEl.innerText = 'Bước 2: Vẽ lại hình vừa rồi để xác nhận';
        }
      }, 600);

    } else if (this.recordStep === 2) {
      // Xác nhận bước 2
      if (currentPattern === this.firstPattern) {
        // Khớp! Lưu hình vẽ mới
        localStorage.setItem('medward_pattern_lock', currentPattern);
        if (svg) svg.classList.add('pattern-success');
        if (statusEl) {
          statusEl.className = 'gate-pattern-status success';
          statusEl.innerText = '🎉 Cài đặt hình vẽ mở khoá 9 nút thành công!';
        }

        this.updateProfileBadge();

        if (window.showToast) {
          window.showToast('✓ Đã cập nhật hình vẽ mở khoá 9 nút mới thành công!');
        }

        setTimeout(() => {
          this.closePatternChangeModal();
        }, 800);

      } else {
        // Không khớp
        if (statusEl) {
          statusEl.className = 'gate-pattern-status error';
          statusEl.innerText = '❌ Hình xác nhận không khớp! Vui lòng vẽ lại từ Bước 1.';
        }
        this.triggerErrorFeedback(svg, wrap);

        setTimeout(() => {
          this.recordStep = 1;
          this.firstPattern = null;
          this.recordSelectedDots = [];
          if (svg) {
            svg.classList.remove('pattern-error');
            this.renderSvgState(svg, []);
          }
          if (statusEl) {
            statusEl.className = 'gate-pattern-status';
            statusEl.innerText = 'Bước 1: Vẽ hình khoá mới (Nối từ 3 điểm trở lên)';
          }
        }, 900);
      }
    }
  }

  resetToDefaultPattern() {
    localStorage.removeItem('medward_pattern_lock');
    this.updateProfileBadge();
    if (window.showToast) {
      window.showToast('✓ Đã khôi phục hình vẽ mở khoá về mặc định (Chữ L hoặc Z)');
    }
    this.reset();
  }

  updateProfileBadge() {
    const badge = document.getElementById('currentPatternBadge');
    if (!badge) return;
    const custom = localStorage.getItem('medward_pattern_lock');
    if (custom) {
      badge.innerText = 'Hình vẽ riêng (Đã cài)';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
    } else {
      badge.innerText = 'Mặc định: Chữ L hoặc Z';
      badge.style.background = '#e0f2fe';
      badge.style.color = '#0369a1';
    }
  }
}

// Khởi tạo global instance
window.patternLock = new PatternLockController();
