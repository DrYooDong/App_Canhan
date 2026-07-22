---
name: astrology-calendar-engine
description: Quy chuẩn quản lý và mở rộng Thuật toán Trạch nhật Cá nhân hóa 4 Tầng, 12 Canh Giờ Hoàng Đạo 24H và Master Calendar Control Hub trong data/astrology_logic.js & components/dashboard.js.
---

# Astrology Calendar Engine Skill Guide

Skill này hướng dẫn quy chuẩn bảo trì, mở rộng và khắc phục sự cố cho bộ công cụ **Lịch Ngày Tốt Master Hub (Master Calendar Control Center)**.

## 1. Thành Phần Cấu Trúc Lõi

### A. Engine Logic (`data/astrology_logic.js`)
* **`evaluatePersonalizedDay(dateObj, userProfile, taskType)`**: Chấm điểm ngày cá nhân hóa 4 Tầng:
  * Tầng 1: Lịch Cổ Điển (Cát Hắc Tinh, Tam Nương, Nguyệt Kị).
  * Tầng 2: Can Chi Tương Sinh / Xung Hợp giữa Tuổi người dùng và Can Chi Ngày.
  * Tầng 3: Tử Vi Mệnh & Cung Thiên Di chiếu.
  * Tầng 4: Phù hợp Mục đích Công việc (EXAM, INTERVIEW, PROMOTION, CONTRACT).
* **`evaluateHourlyRhythm(dateObj, userProfile)`**: Ma trận 12 Canh Giờ (Tý - Hợi) tính điểm Hoàng/Hắc Đạo, Lục Diệu, Xung Tuổi & Kinh lạc tạng phủ.
* **`getMasterDailyIntelligence(dateObj, userProfile, taskType)`**: Hàm 13-trong-1 hợp nhất dữ liệu cho một ngày bất kỳ.

### B. Master Dashboard Component (`components/dashboard.js`)
* **`renderCalendar(userProfile, taskType)`**: Render ma trận 30 ngày interactive.
* **`renderMasterDailyBoard(selectedDate, userProfile, taskType)`**: Render bảng năng lượng 13-in-1 ngay dưới Lịch khi người dùng chọn ngày.
* **`renderHourlyRhythmWidget(selectedDate, userProfile)`**: Render widget 12 Canh Giờ có nút shortcut `🔗 Ma Trận 24H ➔`.

---

## 2. Quy Tắc Mở Rộng & Bảo Trì

1. **Luôn đảm bảo Null-Safety**:
   - Khi gọi `window.AstrologyLogic.evaluateHourlyRhythm` hoặc `getMasterDailyIntelligence`, luôn bọc trong `try-catch` và kiểm tra kiểu dữ liệu function trước khi thực thi để tránh đứt gãy giao diện Lịch.
2. **Nguyên tắc "Lịch làm Trọng tâm"**:
   - Mọi dữ liệu Tử Vi, Kinh Dịch, Kỳ Môn hay Sức Khỏe mới được phát triển ĐỀU PHẢI được xuất qua API `getMasterDailyIntelligence` để hiển thị đồng bộ trên Lịch Ngày Tốt.
