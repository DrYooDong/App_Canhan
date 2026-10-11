# MedWard Pro — Quy ước & Cẩm Nang Dành Cho Agent (AGENTS.md)

Tài liệu này định hình cách làm việc và các nguyên tắc cốt lõi khi bất kỳ Agent nào tiếp nhận hoặc phát triển dự án **MedWard Pro (App_Canhan)**.

---

## 1. Bản Đồ Kiến Trúc & Cấu Trúc Mã Nguồn

Ứng dụng là **PWA y tế lâm sàng thuần (Vanilla JS/CSS/HTML)**, chạy offline-first với Supabase backend và GitHub Pages hosting.

```
i:\Drive của tôi\apps\App_Canhan\
├── index.html               # Cấu trúc giao diện toàn bộ (Desktop table, Mobile cards, Modal chi tiết, In ấn A4)
├── index.css                # CSS entry point
├── css/
│   ├── main.css             # Giao diện Desktop, Bảng điều trị, KPI lâm sàng, Themes, Modal
│   ├── mobile.css           # Thẻ bệnh nhân di động, Action bar, Filter chips, Touch UX
│   ├── lockscreen.css       # Màn hình khóa PIN & Khóa vẽ cử chỉ (Pattern Lock)
│   └── print.css            # Định dạng trang in sổ giao ban lâm sàng A4
├── js/
│   ├── config.js            # Từ điển viết tắt y khoa, hằng số cấu hình, trạng thái ca trực
│   ├── supabase_service.js  # Kết nối Supabase REST & Realtime, phân quyền dữ liệu theo Bác sĩ (100MB/ID)
│   ├── pattern_lock.js      # Khóa hình vẽ cử chỉ bảo mật
│   ├── auth.js              # Quản lý phiên bác sĩ, phân quyền, chuyển đổi tài khoản
│   ├── patient_service.js   # Logic quản lý người bệnh, Excel parser, render bảng/thẻ, modal
│   ├── handover_service.js  # Giao ca trực, bàn giao người bệnh nặng/nguy kịch, log giao ban
│   └── app.js               # Khởi tạo ứng dụng, phím tắt (Ctrl+N, Ctrl+P...), service worker
├── service-worker.js        # Caching PWA, offline support (nhớ tăng CACHE_NAME khi deploy)
├── docs/
│   ├── PROJECT_MAP.md       # Bản đồ liên kết chi tiết: Hàm ↔ File ↔ DOM ID
│   └── supabase_schema.sql  # Database schema & RLS policies
└── .agents/
    ├── rules/               # Các quy tắc kiểm soát mã nguồn
    └── skills/              # Kỹ năng chuyên biệt (Excel parser, Refactor an toàn...)
```

---

## 2. Nguyên Tắc Cốt Lõi Khi Sửa Mã Nguồn

1. **Tuyệt đối không phá vỡ dữ liệu lâm sàng:**
   - Khi sửa đổi form hoặc cấu trúc dữ liệu, không được làm mất các trường đã có của người bệnh (phòng giường, họ tên, chẩn đoán, cận lâm sàng, y lệnh, trạng thái giao ca).
   - Luôn duy trì đồng bộ 2 chiều: `localStorage` (cache offline) và `Supabase` (cloud sync).

2. **Quy tắc an toàn khi truy cập DOM:**
   - Không giả định phần tử luôn tồn tại. Dùng Optional Chaining: `document.getElementById('xyz')?.value`.
   - Nếu ẩn/bỏ một ô nhập khỏi giao diện hiển thị, **phải chuyển thành `<input type="hidden">`** hoặc có fallback giá trị cũ khi lưu để không gây lỗi `null.value` trong các hàm xử lý.

3. **Nguyên tắc nhập file Excel bệnh viện (HIS):**
   - Không được phép gán Mã người bệnh (`[Mã NB: ...]`) vào ô Chẩn đoán hay Y lệnh. Nếu không có chẩn đoán trong Excel, để trống.
   - Nhận diện cột theo độ ưu tiên rõ ràng (từ đồng nghĩa chuẩn), tránh nhầm lẫn giữa cột mã và cột tên.

4. **Thẩm mỹ & Trải nghiệm Y tế:**
   - Giữ giao diện Dark Mode / Medical Blue sắc sảo, độ tương phản cao, phông chữ rõ ràng cho bác sĩ trực đêm.
   - Luôn hỗ trợ song song: Bảng Desktop (Laptop/PC buồng trực) và Thẻ Mobile (smartphone khi đi buồng).

5. **Quy trình kiểm tra bắt buộc (Verification):**
   - Sau mỗi lần sửa file `.js`, **bắt buộc chạy `node -c <file.js>`** hoặc `npm run lint` để kiểm tra cú pháp trước khi bàn giao cho người dùng.

---

## 3. Ma Trận Tác Động ("Sửa X thì phải kiểm tra Y")

| Khi thay đổi... | Phải kiểm tra đồng thời... | Lý do |
|---|---|---|
| Cấu trúc Modal người bệnh | `openPatientDetailModal()`, `savePatientFromDetailModal()`, `openAddPatientModal()` trong `patient_service.js` | Tránh lỗi đọc/ghi DOM element |
| Cột/Dữ liệu Excel import | `scoreHeaderRow()`, `parseExcelRawRows()`, `normalizePatientClsAndOrders()` | Tránh nhận diện sai cột hoặc lỗi dữ liệu nạp |
| Giao diện in ấn A4 | `css/print.css`, hàm render print trong `patient_service.js` | Đảm bảo ngắt trang và kích thước vừa vặn khổ A4 |
| Trạng thái bàn giao (Handover) | `handover_service.js`, `CONFIG.HANDOVER_STATUS` trong `config.js`, KPI desktop & mobile | Tránh lệch bộ đếm Báo động đỏ / Cần bàn giao |
| Phiên bản mới để đẩy lên GitHub Pages | `service-worker.js` (tăng `CACHE_NAME`), `manifest.json` | Đảm bảo trình duyệt người dùng nhận code mới ngay |
