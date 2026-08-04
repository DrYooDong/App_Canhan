---
name: ui-design-system-cosmic
description: Quy chuẩn thiết kế giao diện Cosmic Glassmorphism, CSS Tokens, Typography Cinzel/DM Sans, Responsive Layout, Animation và UI Component Standards trong Nội Tâm SPA.
---

# COSMIC DESIGN SYSTEM & UI GUIDELINES

Sử dụng tài liệu này để tạo mới hoặc chỉnh sửa bất kỳ UI Component nào trong dự án, đảm bảo phong cách nhất quán 100%.

## 1. CSS Design Tokens (`index.css`)
- **Nền & Thẻ Card (Cosmic Dark Mode):**
  - Card chính: `background: linear-gradient(135deg, rgba(20, 25, 45, 0.95), rgba(10, 15, 30, 0.95)); border: 1px solid var(--border-accent); border-radius: 16px;`
  - Shading & Glow: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37); backdrop-filter: blur(12px);`
- **Màu sắc chỉ định:**
  - Vàng Kim (Chính sao/Hóa Lộc): `var(--accent-gold)` (`#f59e0b` hoặc `#fbbf24`)
  - Tím Vũ Trụ (Mệnh/Chủ đạo): `var(--accent-primary)` (`#a855f7` hoặc `#c084fc`)
  - Đỏ Báo Động (Sát sao/Hóa Kỵ): `#ef4444`
  - Xanh Lục (Thần Tài/Thượng Cát): `#10b981`
- **Fonts & Typography:**
  - Tiêu đề & Card Title: `font-family: 'Cinzel', serif;`
  - Nội dung văn bản: `font-family: 'DM Sans', 'Inter', sans-serif;`

## 2. Quy Chuẩn Đội Hình & Micro-Animations
- **Stagger Effect:** Mọi danh sách item hiển thị cần bọc class `.stagger-item` hoặc `.animate-fade-in`.
- **Badge & Tooltips:**
  - Tên Sao Tử Vi: Bọc class `main-star` hoặc `sub-star` với kiểu gạch chân đứt nét (`border-bottom: 1px dashed var(--accent-gold); cursor: pointer;`) để cho phép click tra từ điển.
  - Red Alert Badge: Thêm hiệu ứng rung/đập nhẹ `animation: pulse 2s infinite;`.
- **Responsive Layout:** Luôn dùng CSS Grid tự điều chỉnh:
  `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;`
