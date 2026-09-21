# Hướng Dẫn Sử Dụng & Vận Hành Hệ Thống MedWard Pro

Hệ thống Quản lý Người bệnh Nội trú, Theo dõi Lâm sàng SOAP & Bàn giao Tua trực (MedWard Pro v2.0).

---

## 1. Các Tính Năng Đã Được Nâng Cấp

### 1.1. Cá Thể Hóa Người Dùng & Quản Lý Tài Khoản
- **Đăng ký & Đăng nhập**: Hỗ trợ tạo tài khoản bằng Email & Mật khẩu riêng cho từng Bác sĩ.
- **Hồ sơ Bác sĩ (Doctor Profile)**: Quản lý Họ tên, Chức danh, Khoa phòng, Bệnh viện và Số điện thoại liên hệ trực.
- **Chế độ Ngoại tuyến (Local Fallback)**: Tự động lưu trữ nội bộ an toàn trên thiết bị ngay cả khi chưa kết nối Cloud.

### 1.2. Phân Hệ Bàn Giao Ca Trực Lâm Sàng (Clinical Handover)
- **Đánh dấu mức độ**:
  - 🟢 **Ổn định**: Không có vấn đề đặc biệt.
  - ⏳ **Cần theo dõi sát / Tồn đọng**: Có vấn đề lâm sàng đang chờ giải quyết (chờ kết quả cận lâm sàng, xét nghiệm cấy máu, v.v.).
  - 🚨 **Báo động đỏ (Nguy kịch / Nặng)**: Diễn tiến xấu, sốt cao liên tục, tụt huyết áp, suy hô hấp cần theo dõi sát từng giờ.
  - ✅ **Đã xử trí xong**: Đã được bác sĩ trực xử trí hoàn tất.
- **Ghi chú bàn giao chi tiết**:
  - Vấn đề tồn đọng (kèm Quick Tags 1 chạm).
  - Y lệnh & Hành động tua trực cần làm (kèm Quick Tags 1 chạm).
  - Tên Bác sĩ bàn giao & Thời gian bàn giao.
- **Biên bản bàn giao tua trực (Handover Dashboard)**:
  - Nút **"📋 Sao chép tóm tắt gửi Zalo/Viber"**: Tạo tin nhắn tóm tắt định dạng chuyên nghiệp để dán ngay vào nhóm Zalo/Telegram trực của khoa.
  - Nút **"🖨️ In biên bản trực"**: Xuất báo cáo in A4 nhanh các ca cần theo dõi.
  - Nút **"✅ Đã xử trí xong"**: Bác sĩ trực tick nhanh ngay tại giường bệnh.

### 1.3. Giao Diện Chuẩn Mobile-First (Dành Cho Smartphone)
- **Bottom Navigation Bar**: Thanh điều hướng ngón tay cái cố định phía dưới màn hình:
  - `[📋 Danh sách]` - Xem toàn bộ người bệnh.
  - `[🚨 Bàn giao]` - Xem riêng các ca có vấn đề tồn đọng/bệnh nặng.
  - `[➕ Thêm NB]` - Thêm nhanh bệnh nhân mới.
  - `[📊 Tua trực]` - Mở Dashboard bàn giao ca trực.
  - `[👤 Bác sĩ]` - Quản lý tài khoản & hồ sơ.
- **Thẻ Người Bệnh (Card View)**: Badge buồng giường to rõ, mã màu tương phản cao, chẩn đoán, CLS và y lệnh hiển thị rõ ràng, không bị co kéo hay vỡ dòng.
- **Drawer / Bottom Sheet**: Các hộp thoại chỉnh sửa trượt từ dưới lên, thao tác bằng một tay dễ dàng khi đi buồng bệnh.
- **PWA Ready**: Mở trình duyệt Safari (iOS) hoặc Chrome (Android) $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** để sử dụng như một ứng dụng native không viền.

### 1.4. Đồng Bộ Hai Chiều Giữa Laptop & Điện Thoại (Cloud Realtime Sync)
- Khi nhập liệu trên Laptop (nạp Excel, paste `Ctrl+V`, gõ phím nhanh), dữ liệu sẽ lập tức hiện trên Điện thoại của Bác sĩ khi đi buồng bệnh.
- Khi chỉnh sửa y lệnh hoặc tick bàn giao trên Điện thoại, màn hình Laptop tại phòng trực tự động cập nhật ngay tức thì mà không cần F5.

---

## 2. Hướng Dẫn Kết Nối Supabase Cloud Miễn Phí (2 Phút)

Hệ thống hoạt động ngay với chế độ lưu trữ thiết bị (Offline Mode). Nếu muốn đồng bộ giữa máy tính và điện thoại, bạn có thể thiết lập tài khoản Supabase hoàn toàn miễn phí:

1. Truy cập [https://supabase.com](https://supabase.com) và đăng ký tài khoản miễn phí.
2. Bấm **"New Project"**, nhập tên dự án (VD: `MedWard-KhoaNhiem`) và mật khẩu Database.
3. Vào mục **SQL Editor** (biểu tượng trang giấy ở menu bên trái), dán nội dung file [docs/supabase_schema.sql](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/docs/supabase_schema.sql) và bấm **Run**.
4. Vào mục **Project Settings $\rightarrow$ API**:
   - Copy **Project URL** (VD: `https://abcdefghijkl.supabase.co`).
   - Copy **anon / public Key** (chuỗi ký tự dài bắt đầu bằng `eyJ...`).
5. Trong ứng dụng MedWard Pro, bấm vào biểu tượng **"Lưu trữ nội bộ / Cloud"** ở góc phải thanh tiêu đề $\rightarrow$ Dán URL và Key vào $\rightarrow$ Bấm **"Lưu & Kiểm Tra Kết Nối Cloud"**.
6. Đèn trạng thái chuyển sang **🟢 Cloud Realtime kết nối tốt** là hoàn tất!

---

## 3. Danh Mục Tệp Dự Án

- [index.html](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/index.html): Trang ứng dụng chính (PWA ready, Responsive).
- [gemini-code-1790001124584.html](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/gemini-code-1790001124584.html): Bản sao lưu phiên bản cũ kèm liên kết chuyển đổi.
- [css/main.css](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/css/main.css): Hệ thống giao diện y tế, màu sắc trạng thái, bảng biểu, modal.
- [css/mobile.css](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/css/mobile.css): Tối ưu hóa cảm ứng di động, Bottom Navigation Bar, Thẻ người bệnh.
- [css/print.css](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/css/print.css): Định dạng in A4 ngang chuẩn y khoa.
- [js/config.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/config.js): Cấu hình hằng số, mẫu thẻ nhanh, dữ liệu khởi tạo.
- [js/supabase_service.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/supabase_service.js): Dịch vụ kết nối Cloud Database, Auth & Realtime Subscription.
- [js/auth.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/auth.js): Quản lý đăng nhập, đăng ký và hồ sơ Bác sĩ.
- [js/patient_service.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/patient_service.js): Xử lý danh sách người bệnh, phân tích file Excel, gom nhóm buồng.
- [js/handover_service.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/handover_service.js): Nghiệp vụ bàn giao tua trực lâm sàng, tổng hợp gửi Zalo.
- [js/app.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/js/app.js): Điều phối tổng thể ứng dụng và sự kiện.
- [docs/supabase_schema.sql](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/docs/supabase_schema.sql): Script cấu trúc CSDL và chính sách bảo mật RLS trên Supabase.
- [manifest.json](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/manifest.json) & [service-worker.js](file:///i:/Drive%20c%E1%BB%A7a%20t%C3%B4i/apps/App_Canhan/service-worker.js): Cấu hình cài đặt ứng dụng PWA trên điện thoại.
