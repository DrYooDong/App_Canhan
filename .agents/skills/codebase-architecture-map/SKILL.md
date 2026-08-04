---
name: codebase-architecture-map
description: Bản đồ kiến trúc dự án Nội Tâm (SPA Vanilla JS), danh sách 5 Hub cốt lõi, 25+ Sub-components, vị trí lưu trữ và luồng điều hướng giúp AI định vị ngay lập tức mà không cần grep toàn bộ dự án.
---

# PROJECT ARCHITECTURE & COMPONENT MAP

Sử dụng tài liệu này để định vị nhanh file cần chỉnh sửa, tránh tốn thời gian tìm kiếm file.

## 1. Cấu Trúc Tổng Thể (Single Page Application)
- `index.html`: Entry point load CSS, data scripts, components, và hub scripts.
- `index.css`: CSS Design System (Cosmic Dark Mode, CSS variables, glassmorphism, animations).
- `app.js`: Router điều hướng (`App.Router.navigate`), Modal Controller (`App.Modal`), Toast System.

## 2. Core Engine & Data (`data/`)
- `data/astrology_logic.js`: Lõi thuật toán Tử Vi, Tứ Trụ, Biorhythm, Lưu Nhật Tứ Hóa (`calculateDailyTransit`), Cải Mệnh (`getDailyRemedy`), Đánh giá Tài Lộc (`evaluateWealthDay`), Accuracy đối chiếu (`calculateRetroAccuracy`).
- `data/ziwei_dictionary.js`: Từ điển giải nghĩa 100+ chính sao, phụ sao, hóa tinh.
- `data/ziwei_patterns.js`: Nhận diện 50+ cách cục Tử Vi.
- `data/ziwei_marriage_knowledge.js` & `ziwei_star_knowledge.js`: Tri thức hôn nhân & lá số.

## 3. Bản Đồ 5 Hub Cốt Lõi (`components/`)
1. **Hub 1: Dashboard / Tổng Quan** (`components/dashboard.js`)
   - Chứa Master Calendar Grid, Red Alert Tứ Hóa, Widget Cải Mệnh Hôm Nay (`getDailyRemedy`), Nhịp Giờ Hoàng Đạo 24H.
2. **Hub 2: Tử Vi Chuyên Sâu** (`components/tuvi_home.js`, `components/astrology.js`)
   - Vẽ lá số Tử Vi 12 cung, bấm sao tra từ điển (`dictionary.js`), phân tích Mệnh/Tài/Quan/Tật.
3. **Hub 3: Tài Chính LifeOS & Quản Trị** (`components/finance.js`)
   - Timing đầu tư ngũ hành, quản lý dòng tiền, liên kết `evaluateWealthDay`.
4. **Hub 4: Kỳ Môn & Kinh Dịch & Bói Toán** (`components/iching.js`, `components/oracle.js`, `components/compass.js`)
   - Gieo quẻ Kinh Dịch, La bàn Tử Vi Phong Thủy 24 sơn hướng.
5. **Hub 5: Tri Thức & Nhật Ký Phản Tư** (`components/journal.js`, `components/retroverify.js`, `components/health.js`, `components/numerology.js`)
   - Sức khỏe Cung Tật Ách, Thần số học Đông-Tây, Nhật ký & Nghiệm lý AI RetroVerify.
