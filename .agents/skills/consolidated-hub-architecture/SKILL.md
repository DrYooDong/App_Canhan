---
name: consolidated-hub-architecture
description: Quy chuẩn bảo trì, mở rộng và gom nhóm giao diện SPA vào 5 Hub cốt lõi (Dashboard, Tử Vi, Tài Chính LifeOS, Kỳ Môn & Kinh Dịch, Tri Thức) và đăng ký Router Alias trong app.js & components/sidebar.js.
---

# Consolidated Hub Architecture Skill Guide

Skill này quy định phương pháp quản lý, mở rộng và bảo trì kiến trúc **5 Hub Cốt Lõi (Consolidated Module Hubs)** nhằm giữ thanh điều hướng Sidebar luôn tinh gọn, sang trọng và chuẩn hóa việc chuyển đổi các Sub-Tabs.

---

## 1. Danh Sách 5 Hub Cốt Lõi

| Hub Route | File Hub | Mô Tả & Các Sub-Tabs |
|---|---|---|
| `dashboard` | `components/dashboard.js` | 📱 **Ambient HUD**, ☯ **Tổng Quan Lịch Master**, 🌱 **Nhiệm Vụ Cải Mệnh**, ☀️ **Bản Tin Sáng** |
| `astrology` | `components/astrology.js` | 🔮 **Lá Số Tử Vi**, ⏳ **Time-Machine 60 Năm**, 🎮 **RPG Cuộc Đời**, 🌊 **Real-Time Mood**, 🧘 **Thiền Solfeggio**, 🏥 **Sức Khỏe**, ⚡ **Nhịp Giờ 24H**, 🌟 **Astro-Matrix** |
| `finance` | `components/finance.js` | 💰 **Timing Đầu Tư Ngũ Hành**, 📊 **Đối Chiếu Dự Đoán vs Thực Tế** |
| `oracle` | `components/oracle.js` | 🧭 **La Bàn Xuất Hành (Kỳ Môn)**, ☯ **Quẻ Dịch 64 Quẻ (Mai Hoa)** |
| `knowledge` | `components/knowledge.js` | 📖 **Nhật Ký**, 💡 **Bài Học**, ⚖️ **Quy Luật**, 💡 **Lời Nhắc SOS** |

---

## 2. Quy Tắc Đăng Ký Route Alias (`app.js`)

Khi thêm một module hoặc view phụ mới:
1. **Không thêm mục mới vào top-level Sidebar** nếu có thể lồng ghép vào một trong 5 Hub cốt lõi.
2. Đăng ký alias đường dẫn ngắn trong đối tượng `ALIASES` của `app.js`:
   ```javascript
   const ALIASES = {
     'myfeature': ['astrology', 'myfeature'], // Tự động map #myfeature -> astrology hub tab myfeature
   };
   ```
3. Trong file Hub tương ứng (`renderAstrology`, `renderDashboard`, `renderFinance`...):
   - Đọc tham số `params[0]` để tự động bật tab tương ứng.
   - Thêm nút tab vào header `.tabs-header`.

---

## 3. Quy Chuẩn Đảm Bảo UI/UX & Theme Compatibility

- Mọi nút tab sử dụng lớp CSS chung: `.btn .btn-tab`.
- Trạng thái Active: Sử dụng màu `var(--accent-muted)` cho background và `var(--accent-primary)` cho text/border.
- Đảm bảo tương thích 100% khi người dùng bật tắt Dark / Light Theme (`data-theme`).
