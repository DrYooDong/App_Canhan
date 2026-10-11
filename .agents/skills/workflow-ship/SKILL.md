---
name: workflow-ship
description: Quy trình kiểm tra chất lượng, làm mới cache Service Worker và chuẩn bị bàn giao phiên bản mới
---

# Quy Trình Bàn Giao & Làm Mới Phiên Bản (/ship)

Áp dụng quy trình này trước khi hoàn thành một tính năng lớn hoặc bàn giao sản phẩm để đưa lên môi trường hoạt động (GitHub Pages / Web Server).

---

## Các Bước Thực Hiện

### Bước 1: Kiểm thử cú pháp & tính toàn vẹn (Quality Gate)
Thực hiện đồng thời 2 lệnh kiểm tra:
```powershell
npm run lint
npm test
```
Nếu có bất kỳ lỗi nào, phải sửa chữa triệt để trước khi chuyển bước.

### Bước 2: Tăng phiên bản Service Worker Cache (Bust Cache)
Để người dùng (bác sĩ trên điện thoại/máy tính) nhận được mã nguồn mới mà không bị dính Service Worker Cache cũ:
1. Mở `service-worker.js`.
2. Tăng số phiên bản của hằng số `CACHE_NAME`:
   - Ví dụ: `'medward-pro-v2.0.0'` → `'medward-pro-v2.0.1'`.
3. Khi service worker mới kích hoạt, nó sẽ tự động xóa sạch cache cũ và tải tài nguyên mới nhất.

### Bước 3: Rà soát thay đổi qua Git
Chạy:
```powershell
git status -s
```
Đảm bảo không có file rác, file nháp không mong muốn lọt vào commit.

### Bước 4: Tóm tắt bàn giao cho Người dùng
Báo cáo ngắn gọn cho người dùng:
- Các thay đổi chính đã thực hiện.
- Trạng thái kiểm thử tự động (`npm test`: PASS).
- Trạng thái Service Worker (đã tăng phiên bản cache).
