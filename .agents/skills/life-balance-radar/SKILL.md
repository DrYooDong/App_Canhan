---
name: life-balance-radar
description: Quy chuẩn bảo trì và mở rộng Bộ vẽ HTML5 Canvas 2D Dual-Layer Radar Engine 6 Trụ Cột Năng Lượng Sống (Thân Tâm, Sự Nghiệp, Gia Đạo, Mối Quan Hệ, Tài Chính, Tri Thức).
---

# Life Energy Balance Radar Skill Guide

Skill này quy định chuẩn mực phát triển và bảo trì cho công cụ **Bảng Cân Bằng Năng Lượng Sống 6 Trụ Cột (Life Energy Balance Engine)**.

## 1. Cấu Trúc Đồ Thị Dual-Layer Canvas 2D

Bộ đồ thị Radar 6 đỉnh lục giác (Hexagon Engine) được vẽ trực tiếp bằng **HTML5 Canvas 2D API** trong `components/dashboard.js` (`drawRadarCanvas`):
- **Đỉnh 1**: Thân Tâm (Health & Mind)
- **Đỉnh 2**: Sự Nghiệp (Career & Focus)
- **Đỉnh 3**: Gia Đạo (Family & Home)
- **Đỉnh 4**: Mối Quan Hệ (Relationships)
- **Đỉnh 5**: Tài Chính (Finance & Assets)
- **Đỉnh 6**: Tri Thức (Knowledge & Soul)

### Hai Lớp Biểu Đồ (Dual-Layer Overlay):
1. **Lớp Thực Tế (Green `#10b981`)**: Điểm tự Check-in tuần của người dùng (10 - 100%).
2. **Lớp Tiềm Năng Tử Vi (Gold `#d4af37` / `#b8860b`)**: Điểm xung lực Vận hạn chiếu từ lá số 12 Cung và Biorhythm trong `data/astrology_logic.js`.

---

## 2. Quy Trình Cập Nhật & Check-in State

- Hàm `calculateLifeBalanceScores(userProfile, dateObj)` tự động tính khoảng lệch $\Delta = \text{Thực Tế} - \text{Tiềm Năng}$.
- Dữ liệu Check-in lưu tại `localStorage.getItem('user_life_balance_scores')`.
- Khi người dùng bấm `Lưu Check-in` trên Modal `showLifeBalanceCheckinModal`, hàm sẽ lưu `localStorage` và phát lệnh `renderLifeBalanceRadarWidget` cập nhật Canvas realtime.

---

## 3. Lưu Ý Giao Diện (Theme Compatibility)

- Khi chế độ sáng/tối (Dark/Light mode) thay đổi, hàm `drawRadarCanvas` tự động nhận diện `document.documentElement.getAttribute('data-theme')` để điều chỉnh màu lưới (`gridColor`) và nhãn chữ (`textColor`) giúp đồ thị luôn nét đẹp.
