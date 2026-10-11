---
name: excel-import-mapper
description: Hướng dẫn chuẩn hóa và xử lý nhận diện cột khi nhập file Excel bệnh viện (HIS) vào ứng dụng lâm sàng
---

# Kỹ Năng Nhận Diện & Nhập File Excel Bệnh Viện (HIS)

Kỹ năng này giúp Agent chuẩn hóa thuật toán chấm điểm và ánh xạ cột từ các tệp Excel xuất từ các hệ thống HIS bệnh viện khác nhau tại Việt Nam (VNPT-HIS, Viettel-HIS, FPT, Medisoft...).

---

## 1. Nguyên Tắc Cốt Lõi Khi Đọc Dữ Liệu

1. **Phân biệt rạch ròi giữa "Mã định danh" và "Nội dung lâm sàng":**
   - Cột **Mã NB / Mã BA / Mã hồ sơ / Mã thẻ**: Tuyệt đối không được gán vào trường **Chẩn đoán (CĐ)** hay **Y lệnh (YL)**.
   - Nếu bệnh nhân trong Excel chưa có nội dung chẩn đoán hoặc y lệnh, giá trị trường đó phải để rỗng `''`.

2. **Thuật toán quét dòng tiêu đề (Header Scoring):**
   - Các file HIS thường có 2 - 15 dòng thông tin bệnh viện ở đầu bảng trước khi đến bảng thực tế.
   - Quét tối đa 60 dòng đầu, chấm điểm dòng có nhiều từ khóa lâm sàng nhất để làm `headerRow`.

---

## 2. Bảng Từ Đồng Nghĩa Nhận Diện Cột Chuẩn

| Trường Dữ Liệu | Từ khóa nhận diện ưu tiên 1 | Từ khóa nhận diện phụ / không dấu | Loại trừ bắt buộc |
|---|---|---|---|
| **Họ và tên người bệnh** | `họ và tên`, `họ tên`, `họ tên nb`, `họ tên bn`, `tên người bệnh`, `patient name` | `người bệnh`, `bệnh nhân`, `nb`, `bn`, `tên` | Chứa `mã`, `loại`, `đối tượng` |
| **Buồng / Giường** | `buồng - giường`, `phòng/giường`, `p/g`, `b/g` | `phòng`, `buồng`, `giường`, `p`, `g` | — |
| **Năm sinh / Tuổi** | `năm sinh / tuổi`, `ns (tuổi)`, `ns/tuổi` | `năm sinh`, `ngày sinh`, `tuổi`, `ns`, `dob`, `age` | — |
| **Chẩn đoán (CĐ)** | `chẩn đoán`, `chẩn đoán xác định`, `chẩn đoán vào viện`, `cđ`, `cd`, `dx` | `chan doan`, `bệnh chính`, `tên bệnh`, `bệnh kèm`, `icd10` | Chứa `mã người bệnh`, `mã bn` |
| **Cận lâm sàng (CLS)**| `cls hiện có`, `cls cần làm`, `cận lâm sàng`, `xét nghiệm` | `cls`, `xn`, `lab` | — |
| **Y lệnh điều trị (YL)**| `y lệnh`, `y lệnh điều trị`, `thuốc chính`, `yl` | `y lenh`, `điều trị` | Chứa `bác sĩ`, `kết quả`, `số ngày` |
| **Bác sĩ phụ trách** | `bác sĩ điều trị`, `bs điều trị`, `bác sĩ`, `bs` | `bac si`, `phụ trách` | — |

---

## 3. Quy Trình Làm Sạch Dữ Liệu Khi Nạp (Data Cleansing)

1. **Chuẩn hóa Phòng / Giường:**
   - Dạng chuẩn: `D1.01-1`, `D2.15-2`.
   - Cắt bỏ các tiền tố thừa như "Buồng: ", "Giường: ".

2. **Chuẩn hóa Năm sinh / Tuổi:**
   - Trích xuất năm 4 chữ số từ chuỗi ngày tháng: `15/08/1985` → `1985`.
   - Tự động tính tuổi nếu thiếu: `1985 (41)`.

3. **Lọc sạch dữ liệu rác cũ:**
   - Kiểm tra `p.chan_doan`: Nếu vô tình bị nạp chuỗi `[Mã NB: ...]` từ phiên bản cũ, tự động xóa về chuỗi rỗng `''`.
