---
name: iching-oracle-compass-engine
description: Quy chuẩn bảo trì và mở rộng Module Kinh Dịch (iching.js), Linh Quẻ Bói Toán (oracle.js) và La Bàn Phong Thủy 24 Sơn Hướng (compass.js) gắn Tử Vi.
---

# ICHING, ORACLE & COMPASS ENGINE SPECIFICATION

Quy chuẩn kỹ thuật khi làm việc với các module thuật số Kinh Dịch, Oracle và La Bàn Phong Thủy.

## 1. Module Kinh Dịch (`components/iching.js`)
- **Nguyên lý gieo quẻ:** 3 đồng xu / Hào âm (Hào Thiếu Âm/Lão Âm), Hào dương (Hào Thiếu Dương/Lão Dương).
- **Cấu trúc quẻ:** Quẻ Thượng (Thượng Quái - 3 hào trên), Quẻ Hạ (Hạ Quái - 3 hào dưới), Hào Động -> Quẻ Biến.
- **Quy tắc code:** Luôn trả về đủ tên 64 Quẻ Dịch, Lời Thoán, Hào Từ biến và Lời khuyên Cải Mệnh cho người dùng.

## 2. Module La Bàn Phong Thủy 24 Sơn Hướng (`components/compass.js`)
- **Tọa độ & Sơn hướng:** 24 Sơn Hướng (8 Quái x 3 Sơn: Ví dụ Bính-Ngọ-Đinh thuộc hướng Nam).
- **Tích hợp Lá Số Tử Vi:** Đồng bộ vị trí 12 Cung Địa Chi trên lá số Tử Vi tương ứng với các hướng địa lý:
  - `Tý`: Bắc (0°)
  - `Ngọ`: Nam (180°)
  - `Mão`: Đông (90°)
  - `Dậu`: Tây (270°)
- **Cảm biến Hướng (DeviceOrientation API):** Hỗ trợ xoay la bàn thực tế trên di động khi người dùng cấp quyền.

## 3. Module Oracle & Linh Quẻ (`components/oracle.js`)
- **Tập bài Oracle:** Chứa thông điệp chữa lành, chiêm nghiệm và lời khuyên tâm trí (Mindfulness & Cosmic Advice).
- **Cách tích hợp:** Cho phép rút quẻ 1 lá/3 lá (Quá khứ - Hiện tại - Vị lai) gắn liền với nhịp sinh học Biorhythm của ngày.
