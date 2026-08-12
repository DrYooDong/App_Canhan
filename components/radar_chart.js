// ============================================
// NỘI TÂM — Dual-Layer Radar Chart Engine
// ============================================

(function() {
  'use strict';

  function renderRadarChart(canvasId, dataPoints) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Support Retina Displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const radius = Math.min(centerX, centerY) - 30; // Leave room for labels
    
    const numSides = dataPoints.length;
    const angleStep = (Math.PI * 2) / numSides;
    
    ctx.clearRect(0, 0, width, height);

    // Get theme colors
    const theme = document.documentElement.getAttribute('data-theme');
    const isLight = theme === 'light';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    const gridColorStrong = isLight ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)';
    const labelColor = isLight ? '#0f172a' : '#f8fafc';
    
    // Draw Grid (Hexagon/Polygon)
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = radius * (level / levels);
      ctx.beginPath();
      for (let i = 0; i < numSides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = level === levels ? gridColorStrong : gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Draw Axes & Labels
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < numSides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Draw Axis Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = gridColor;
      ctx.stroke();
      
      // Draw Label
      const labelRadius = radius + 20;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      ctx.fillStyle = labelColor;
      ctx.fillText(dataPoints[i].label, labelX, labelY);
    }
    
    // Draw Data Polygon
    ctx.beginPath();
    for (let i = 0; i < numSides; i++) {
      const val = Math.min(100, Math.max(0, dataPoints[i].value));
      const r = radius * (val / 100);
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Fill and Stroke Data
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (isLight) {
        gradient.addColorStop(0, 'rgba(109, 40, 217, 0.4)');
        gradient.addColorStop(1, 'rgba(109, 40, 217, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#6d28d9';
    } else {
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw Data Points
    for (let i = 0; i < numSides; i++) {
      const val = Math.min(100, Math.max(0, dataPoints[i].value));
      const r = radius * (val / 100);
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#6d28d9' : '#a855f7';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#fff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  window.renderRadarChart = renderRadarChart;

})();
