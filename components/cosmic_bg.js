// ============================================
// NỘI TÂM — Cosmic Canvas Background
// ============================================

(function() {
  'use strict';

  class CosmicBackground {
    constructor() {
      this.canvas = document.getElementById('cosmic-bg');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null, radius: 100 };
      this.numParticles = 100; // Optimal for performance
      this.animationId = null;

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.x;
        this.mouse.y = e.y;
      });
      window.addEventListener('mouseout', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      this.createParticles();
      this.animate();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.ctx.scale(dpr, dpr);
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.numParticles; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const size = Math.random() * 1.5 + 0.5;
        const speedX = (Math.random() - 0.5) * 0.3;
        const speedY = (Math.random() - 0.5) * 0.3;
        const color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
        this.particles.push({ x, y, size, speedX, speedY, color, baseSize: size });
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      const theme = document.documentElement.getAttribute('data-theme');
      const isLight = theme === 'light';
      // In light mode, make particles darker
      const particleColor = isLight ? `rgba(109, 40, 217, 0.4)` : null; 

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        // Bounce off edges
        if (p.x < 0 || p.x > window.innerWidth) p.speedX *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.speedY *= -1;

        // Mouse interaction
        if (this.mouse.x !== null) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.mouse.radius) {
            const force = (this.mouse.radius - distance) / this.mouse.radius;
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            p.x -= dirX * force * 1.5;
            p.y -= dirY * force * 1.5;
            p.size = Math.min(p.baseSize * 2.5, p.size + 0.2);
          } else {
             p.size = Math.max(p.baseSize, p.size - 0.1);
          }
        } else {
             p.size = Math.max(p.baseSize, p.size - 0.1);
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = particleColor || p.color;
        this.ctx.fill();
      }

      // Draw connections
      this.connectParticles(isLight);

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    connectParticles(isLight) {
      for (let a = 0; a < this.particles.length; a++) {
        for (let b = a; b < this.particles.length; b++) {
          const dx = this.particles[a].x - this.particles[b].x;
          const dy = this.particles[a].y - this.particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 90) {
            const opacity = 1 - (distance / 90);
            const rgb = isLight ? '109, 40, 217' : '139, 92, 246'; // Violet theme colors
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.15})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
            this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  // Khởi tạo khi DOM đã tải xong
  window.addEventListener('DOMContentLoaded', () => {
    // Chỉ chạy nếu không phải trên mobile screen nhỏ (giảm lag)
    if (window.innerWidth > 768) {
        window.CosmicBG = new CosmicBackground();
    }
  });

})();
