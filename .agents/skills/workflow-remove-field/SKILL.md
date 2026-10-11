---
name: workflow-remove-field
description: Quy trình chuẩn từng bước khi người dùng yêu cầu bỏ hoặc ẩn một trường thông tin trên giao diện
---

# Quy Trình Bỏ / Ẩn Trường Dữ Liệu An Toàn (/remove-field)

Áp dụng quy trình này mỗi khi nhận được yêu cầu "Bỏ trường X", "Xóa ô Y khỏi form", "Không hiển thị Z".

---

## Các Bước Thực Hiện

### Bước 1: Quét toàn bộ điểm phụ thuộc (Scout)
Chạy `grep_search` với ID của element và tên trường trong toàn bộ workspace:
- File giao diện: `index.html`
- File JavaScript: `js/patient_service.js`, `js/handover_service.js`, `js/app.js`, v.v.
- File CSS: `css/main.css`, `css/mobile.css`, `css/print.css`.

### Bước 2: Chuyển đổi an toàn trên HTML
- Gỡ bỏ nhãn `<label>` và các phần tử UI bao bọc.
- Chuyển `<input>` thành `<input type="hidden" id="...">` để các hàm JavaScript đọc/ghi không bị lỗi `TypeError: Cannot read properties of null`.

### Bước 3: Cập nhật hàm Lưu (Save) & Mở (Open)
- Trong hàm mở modal: Gán giá trị an toàn:
  ```javascript
  const el = document.getElementById('fieldId');
  if (el) el.value = p.field_val || '';
  ```
- Trong hàm lưu modal: Luôn có giá trị fallback từ dữ liệu gốc của bệnh nhân:
  ```javascript
  const existingPatient = this.patientList.find(x => x.id === id);
  const fieldVal = document.getElementById('fieldId')?.value?.trim() || existingPatient?.field_val || '';
  ```

### Bước 4: Kiểm thử bắt buộc (Verify)
Chạy 2 lệnh kiểm tra:
```powershell
npm run lint
npm test
```
Đảm bảo kết quả trả về `exit code 0` trước khi kết thúc tác vụ.
