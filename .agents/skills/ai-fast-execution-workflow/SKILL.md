---
name: ai-fast-execution-workflow
description: Hướng dẫn quy trình xử lý tối ưu tốc độ làm việc cho AI Agent (Fast Edit-Verify Loop), cắt giảm số bước xem file thừa, phòng ngừa lỗi tiềm ẩn và tự động hóa các thao tác lập trình.
---

# FAST EXECUTION WORKFLOW FOR AI AGENTS

Mục tiêu: Giảm 50% số lượt gọi tool (tool calls) và phản hồi người dùng tức thì.

## 1. QUY TRÌNH "ĐỌC 1 LẦN — SỬA ĐÚNG ĐIỂM" (ONE-SHOT EDIT PATTERN)
1. **Tra cứu sơ đồ:** Thay vì grep toàn bộ dự án, tra cứu ngay `codebase-architecture-map` để xác định file đích (VD: Chỉnh sửa tài chính -> `components/finance.js` & `data/astrology_logic.js`).
2. **View theo line range hẹp:** Khi dùng `view_file`, chỉ đọc đúng khối mã 30-50 dòng cần sửa (ví dụ: dòng chứa `getTodayInfo` hoặc `render`). Không đọc lại toàn bộ file 2000 dòng.
3. **Thực thi `replace_file_content` đơn lẻ:** Đảm bảo `TargetContent` có ít nhất 2-3 dòng ngữ cảnh tĩnh xung quanh để tránh lỗi sai vị trí.

## 2. CHECKLIST AN TOÀN TRƯỚC KHI DEPLOY
- [ ] Đã dùng toán tử nullish `??` hoặc kiểm tra `!= null` cho tất cả biến `hour` (giờ sinh 0h00)?
- [ ] Đã bọc class `main-star` hoặc `palace-name` cho các danh từ Tử Vi để trigger Modal từ điển?
- [ ] Đã lưu đồng bộ vào cả `userProfile` lẫn `noitam_chart_config` nếu thay đổi thông tin cá nhân?
- [ ] Đã kiểm tra không có câu lệnh `console.log` rác hoặc dữ liệu giả (hardcode mock data)?

## 3. CÁCH PHẢN HỒI NGƯỜI DÙNG TỐI ƯU
- Trả lời ngắn gọn, cô đọng, súc tích.
- Trình bày kết quả dạng danh sách gạch đầu dòng rõ ràng.
- Gửi kèm link mở trực tiếp file đã sửa dưới dạng `[filename](file:///path/to/file)`.
