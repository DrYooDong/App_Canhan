---
name: life-os-finance-retroverify
description: Quy chuẩn bảo trì và mở rộng hệ thống Quản Trị Tài Chính Ngũ Hành (finance.js), Nhật Ký Phản Tư (journal.js) và Máy Đo Sai Số AI Nghiệm Lý (retroverify.js).
---

# LIFE OS FINANCE & RETROVERIFY ENGINE SPECIFICATION

Quy chuẩn kỹ thuật khi làm việc với hệ sinh thái Tài Chính Ngũ Hành & Kiểm Định Sai Số AI.

## 1. Dòng Tiền Ngũ Hành (`components/finance.js`)
- **Phân loại Ngũ Hành:**
  - `Kim`: Lương chuyên môn, Đầu tư kim loại/tài chính, Thiết bị công nghệ.
  - `Mộc`: Học tập, Đọc sách, Sức khỏe, Nông nghiệp/Cây trồng.
  - `Thủy`: Giao lưu, Du lịch, Mạng xã hội, Vận tải.
  - `Hỏa`: Tiêu dùng giải trí, Đèn chiếu sáng, Truyền thông, Thẩm mỹ.
  - `Thổ`: Bất động sản, Tích lũy tài sản, Tiết kiệm dài hạn.
- **Tích hợp Timing Tử Vi:** Luôn dùng `AL.evaluateWealthDay` và `AL.calculateDailyTransit` để đánh giá điểm cát hung giải ngân trong ngày.

## 2. Nhật Ký & AI RetroVerify (`components/journal.js` & `retroverify.js`)
- **Luồng dữ liệu nghiệm lý (Check-in Loop):**
  1. Buổi sáng/Đầu ngày: AI dự đoán điểm số `predictedScore` (0-100).
  2. Buổi tối: Người dùng đánh giá thực tế `actualScore` (1-5 sao -> quy đổi 20-100 điểm).
  3. AI lưu log vào `noitam_retro_logs`.
- **Máy đo sai số (`calculateRetroAccuracy`):**
  - Tính độ lệch `Math.abs(predictedScore - actualScaled)`.
  - Xuất % Tương quan chính xác (`accuracyPct`) và insight học máy tự động.
