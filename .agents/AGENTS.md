# QUY TẮC & TỐI ƯU TỐC ĐỘ LÀM VIỆC DÀNH CHO AI AGENT (PROJECT RULES)

## 1. NGUYÊN TẮC AN TOÀN CODE JAVASCRIPT (ZERO-DEFECT CODE)
- **Cấm dùng toán tử `||` cho giá trị Số/Giờ/Phút:** Luôn dùng toán tử Nullish `??` hoặc kiểm tra `val !== undefined && val !== null` cho các biến dạng số (đặc biệt là Giờ sinh `hour = 0` hoặc Phút `0` hoặc Điểm số `0`) để tránh lỗi falsy biến `0` thành giá trị mặc định (như biến 0h đêm thành 21h hay 12h trưa).
- **Single Source of Truth:** `window.AstrologyLogic.getUserProfile()` là nguồn duy nhất cung cấp sinh thần bát tự của người dùng. Không hardcode dữ liệu giả định.
- **LocalStorage Keys chuẩn hóa:**
  - `noitam_user_profile`: Hồ sơ cá nhân người dùng (Tên, ngày, tháng, năm, giờ, phút, nơi sinh, lat, lng, tz, hanhMenh, canNam, chiNam).
  - `noitam_chart_config`: Cấu hình lá số đồng bộ.
  - `noitam_finance_txs`: Danh sách giao dịch tài chính ngũ hành.
  - `noitam_retro_logs`: Nhật ký nghiệm lý đối chiếu dự đoán vs thực tế.

## 2. QUY TRÌNH TỐI ƯU TỐC ĐỘ (FAST EXECUTION WORKFLOW)
- **Định vị chính xác:** Sử dụng đúng file và hàm được ghi trong các `SKILL.md` thay vì tìm kiếm (grep) toàn bộ codebase.
- **Chỉ sửa đúng điểm nóng:** Khi được yêu cầu chỉnh sửa feature, hãy sửa đúng file component tương ứng và kiểm tra liên kết tới `AstrologyLogic`.
- **Tránh gọi tool trùng lặp:** Không lặp lại các lệnh xem file nếu đã nắm cấu trúc. Đọc kỹ vị trí trước khi thay thế (`replace_file_content`).

## 3. QUY CHUẨN GIAO DIỆN (UI/UX)
- Giữ vững style Dark Mode huyền ảo (Cosmic Glassmorphism, HSL tailwind colors, Cinzel font cho tiêu đề, Inter/DM Sans cho văn bản).
- Đảm bảo tính phản hồi tốt (Tooltip, badge cát hung, popup tra cứu từ điển khi click vào sao).
