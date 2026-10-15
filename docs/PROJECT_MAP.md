# Bản Đồ Liên Kết Mã Nguồn (PROJECT_MAP.md)

Tài liệu này tra cứu nhanh các ID giao diện trong `index.html` và các hàm tương ứng trong `js/patient_service.js`, `js/handover_service.js`, `js/auth.js`.

---

## 1. Bản Đồ Modal & Form (`index.html` ↔ `js/`)

### Modal Chi Tiết / Tiếp Nhận Người Bệnh (`#patientDetailModal`)
| DOM ID | Loại phần tử | Mục đích | Hàm khởi tạo | Hàm lưu |
|---|---|---|---|---|
| `patientDetailModal` | Container | Modal pop-up | `openPatientDetailModal(id)`, `openAddPatientModal()` | `closePatientDetailModal()` |
| `editPatientId` | `<input type="hidden">` | ID người bệnh (UUID) | Gán `p.id` hoặc `''` | Đọc id khi update |
| `editRoomBed` | `<input type="text">` | Buồng - Giường (P/G) | Gán `p.phong_giuong` | `savePatientFromDetailModal()` |
| `editAgeYear` | `<input type="text">` | Năm sinh / Tuổi (NS) | Gán `p.nam_sinh_tuoi` | `formatBirthYearAge()` |
| `calcAgeBadge` | `<span>` | Huy hiệu tính tuổi nhanh | `handleAgeYearInput()` | Hiển thị `(X tuổi)` |
| `editFullName` | `<input type="text">` | Họ và tên người bệnh | Gán `p.ten` (in hoa) | `savePatientFromDetailModal()` |
| `editDoctorName` | `<input type="hidden">` | Bác sĩ điều trị / phụ trách | Gán `p.doctor_name` ngầm | Lưu bảo toàn thông tin BS |
| `editDiagnosis` | `<textarea>` | Chẩn đoán xác định / kèm theo | Gán `p.chan_doan` | Tự động bung từ viết tắt y khoa |
| `editClsHienCo` | `<textarea>` | Cận lâm sàng hiện có | Gán `p.cls_hien_co` | Ghép vào `p.cls` |
| `editClsCanLam` | `<textarea>` | Cận lâm sàng cần làm | Gán `p.cls_can_lam` | Ghép vào `p.cls` |
| `editOrders` | `<textarea>` | Y lệnh điều trị & Thuốc chính | Gán `p.y_lenh` | Tự động bung viết tắt |
| `editThemThuoc` | `<textarea>` | Bổ sung thuốc mới | Gán `p.them_thuoc` | `savePatientFromDetailModal()` |
| `editHandoverStatus`| `<select>` | Trạng thái (Ổn định, Chờ CLS, Đã xong, Cần bàn giao, Xuất viện) | Gán `p.handover_status`| Cập nhật badge & màu sắc |
| `editHandoverIssues`| `<textarea>` | Vấn đề tồn đọng | Gán `p.handover_issues`| `savePatientFromDetailModal()` |
| `editHandoverActions`| `<textarea>` | Xử trí tiếp / theo dõi | Gán `p.handover_actions`| `savePatientFromDetailModal()` |
| `detailDengueTrendTriggerWrap` | `<div>` | Nút mở theo dõi Hct & TC | `openPatientDetailModal()` | `openDengueTrendModalFromDetail()` |

### Modal Theo Dõi Diễn Tiến Hct & Tiểu Cầu Dengue (`#dengueTrendModal`)
| DOM ID | Loại phần tử | Mục đích | Hàm khởi tạo | Hàm lưu / đồng bộ |
|---|---|---|---|---|
| `dengueTrendModal` | Container | Modal pop-up biểu đồ | `openDengueTrendModal(id)` | `closeDengueTrendModal()` |
| `dengueTrendModalBody` | `<div>` | Biểu đồ SVG & bảng mốc đo | `renderDengueTrendModalBody(p)` | `addDengueTrendPoint()`, `syncTrendsToCls()` |

---

## 2. Bảng Danh Sách & Chế Độ Xem (Desktop & Mobile)

| Vùng hiển thị | Container ID | Hàm Render | File phụ trách |
|---|---|---|---|
| Bảng bệnh nhân Desktop | `#patientTableBody` | `renderDesktopTable()` | `js/patient_service.js` |
| Danh sách thẻ Mobile | `#mobileCardContainer` | `renderMobileCards()` | `js/patient_service.js` |
| Dải KPI Desktop | `#desktopStatTotal`, `#desktopStatCritical`, `#desktopStatPending`, `#desktopStatStable` | `render()` | `js/patient_service.js` |
| Dải tóm tắt Mobile | `#mobileSummaryTotal`, `#mobileSummaryCritical`, `#mobileSummaryPending` | `updateMobileSummaryBar()` | `js/patient_service.js` |
| Thanh Filter Chips Mobile | `#mobileFilterChips` | `renderMobileFilterChips()` | `js/patient_service.js` |
| Bộ đếm ca trùng lặp | `#dupCountBadge` | `updateDuplicateBadge()` | `js/patient_service.js` |

---

## 3. Các Luồng Nhập / Xuất Dữ Liệu Quan Trọng

1. **Nhập từ file Excel (`.xlsx`):**
   - Sự kiện: `#excelFileInput` thay đổi → gọi `handleExcelImport(e)`
   - Tầng nhận diện: `scoreHeaderRow(row)` (chấm điểm dòng tiêu đề)
   - Tầng ánh xạ cột: `parseExcelRawRows(rows)` (gán họ tên, phòng giường, năm sinh, chẩn đoán, cận lâm sàng, y lệnh)
   - Lưu ý sống còn: **Không bao giờ map `mapping.ma_nb` vào `cdVal` (chẩn đoán)**.

2. **Đồng bộ đám mây (Supabase):**
   - Đọc/Ghi: `js/supabase_service.js`
   - Phân vùng dữ liệu: Từng tài khoản Bác sĩ là một không gian lưu trữ biệt lập (100MB/tài khoản).
   - Realtime: kênh `patients-changes` tự động reload giao diện khi có ca trực cập nhật đồng thời.

3. **In ấn sổ giao ban lâm sàng:**
   - Phím tắt: `Ctrl+P` hoặc nút In ấn
   - Định dạng: Tự động gom nhóm buồng, chuẩn hóa trang in qua `css/print.css`.
