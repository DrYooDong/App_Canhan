---
description: Các quy tắc phát triển ứng dụng y tế lâm sàng MedWard Pro
---

# Quy Tắc Phát Triển Ứng Dụng Lâm Sàng (MedWard Pro Rules)

1. **Ngôn ngữ & Thuật ngữ y tế chuẩn Việt Nam:**
   - Sử dụng các ký hiệu y khoa chuẩn: `NB` (Người bệnh), `P/G` (Phòng/Giường), `NS` (Năm sinh/Tuổi), `CĐ` (Chẩn đoán), `CLS` (Cận lâm sàng: Hiện có & Cần làm), `YL` (Y lệnh điều trị & Thuốc chính).
   - Tuyệt đối không tự suy diễn hoặc bịa đặt kết quả chẩn đoán/cận lâm sàng khi xử lý dữ liệu.

2. **Bảo tồn tính toàn vẹn của DOM:**
   - Mọi thao tác đọc/ghi DOM element phải kiểm tra tồn tại an toàn (`document.getElementById(...)?.value`).
   - Nếu người dùng yêu cầu bỏ/ẩn một trường thông tin khỏi giao diện nhập liệu, **không được xóa bỏ logic dữ liệu phía sau**. Chuyển sang `<input type="hidden">` để giữ nguyên tính tương thích với Supabase và localStorage.

3. **Nguyên tắc nhập Excel:**
   - Cột Mã người bệnh / Mã BA chỉ phục vụ đối soát, **không được nạp vào trường Chẩn đoán hoặc Y lệnh**.
   - Nếu ô chẩn đoán trống, để chuỗi rỗng `''`.
   - Luôn duy trì cơ chế làm sạch tự động đối với các dữ liệu cũ bị dính nhầm mã.

4. **Kiểm tra cú pháp bắt buộc:**
   - Luôn chạy kiểm tra cú pháp sau khi chỉnh sửa bất kỳ file JavaScript nào (`npm run lint` hoặc `node -c <file>`).
