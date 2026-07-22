Xây dựng **Thuật Toán Trạch Nhật Cá Nhân Hóa Đa Tầng (Multi-layer Screening Algorithm)** là bước đi chiến lược giúp chuyển hóa tri thức Trạch nhật cổ truyền thành một hệ thống tính toán chính xác, khách quan và minh bạch.

Dưới đây là thiết kế kiến trúc thuật toán toàn diện gồm **4 Tầng lọc (4-Layer Pipeline)**, **Công thức chấm điểm**, và **Cấu trúc dữ liệu JSON** để bạn triển khai lập trình.

---

## 1. Tổng Quan Kiến Trúc Thuật Toán (Pipeline Architecture)

Mô hình xử lý dữ liệu qua 4 tầng lọc tiếp sức. Điểm số cuối cùng ($S$) được quy đổi về thang điểm $0 - 100$.

```
[Input: Ngày cần xét + Bản mệnh User + Mục đích công việc]
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 1: Lọc Nền Thiên Văn & Lịch Cổ Điện (Global Rules) │ ──> Loại ngày Sát Chủ/Thụ Tử/Dương Công Kị
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 2: Xung Khắc Can Chi Bát Tự (Personal Stems/Branches)│ ──> Kiểm tra Thiên khắc Địa xung Tuổi/Mệnh
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 3: Ma Trận Lưu Sao Tử Vi Cá Nhân (Zi Wei Transit) │ ──> Định vị Lưu Sao Ngày vào 12 Cung Lá số
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 4: Trọng Số Theo Mục Đích Công Việc (Task Context) │ ──> Lọc ngày tối ưu riêng cho Ký Hợp Đồng/Cưới/Khởi công...
└────────────────────────────────────────────────────────┘
                         │
                         ▼
[Output: Điểm Số Tổng Hợp (0 - 100) + Xếp Hạng + Khuyên Dùng + Giờ Hoàng Đạo]

```

---

## 2. Chi Tiết 4 Tầng Lọc & Trọng Số Chấm Điểm

### Tầng 1: Lọc Nền Thiên Văn & Lịch Cổ Điển (Global Filter)

* **Mục tiêu:** Đánh giá năng lượng vũ trụ chung của ngày (không phụ thuộc tuổi).
* **Tiêu chí đánh giá:**
* **Trực (12 Trực):** Kiến, Trừ, Mãn, Bình, Định, Chấp, Phá, Nguy, Thành, Thâu, Khai, Bế (Mỗi Trực có điểm cộng/trừ cơ bản).
* **Nhị Thập Bát Tú:** 28 Chòm sao (Sao Cát: Đẩu, Phòng, Hư, Mão...; Sao Hung: Cơ, Ngưu, Tỉnh...).
* **Ngày Hoàng Đạo / Hắc Đạo:** Thanh Long, Minh Đường, Kim Quỹ... vs. Thiên Hình, Chu Tước, Bạch Hổ...
* **Cờ Cảnh Báo Tuyệt Đối (Hard Stop Flag):** Nếu rơi vào *Dương Công Kỵ*, *Sát Chủ*, *Thụ Tử*, *Nguyệt Phá*, *Tam Nương* $\rightarrow$ Kích hoạt `Flag_HardStop = True` (Loại thẳng hoặc trừ cực nặng).



### Tầng 2: Tương Khắc Can Chi & Bát Tự Cá Nhân (Personal Stem/Branch Filter)

* **Mục tiêu:** Kiểm tra ngày đó có "đánh" hay "hợp" với Bát tự sinh của cá nhân hay không.
* **Tiêu chí đánh giá:**
* **Thiên Can Ngày vs. Can Năm/Ngày Sinh:** Tương hợp (Giáp-Kỷ, Ất-Canh...) $+15$ điểm; Tương phá (Giáp-Mậu, Bính-Canh...) $-15$ điểm.
* **Địa Chi Ngày vs. Chi Năm/Ngày Sinh:**
* *Tam hợp / Lục hợp:* $+20$ điểm.
* *Lục xung / Lục hại / Tương hình:* $-30$ điểm.


* **Nạp Âm Ngũ Hành:** Ngũ hành Ngày tương sinh/tương hòa với Nạp âm Mệnh $+10$ điểm; Khắc Mệnh $-15$ điểm.



### Tầng 3: Tương Tác Lưu Sao Tử Vi Cá Nhân (Zi Wei Transit Matrix)

* **Mục tiêu:** Lớp lọc độc bản nhất – xác định năng lượng các sao di chuyển trong ngày chiếu vào Cung nào trên lá số cá nhân.
* **Quy tắc an Sao Lưu Ngày (Transit Stars):**
1. Xử lý Thiên Can ngày $\rightarrow$ An **Lưu Lộc Tồn**, **Lưu Hóa Lộc**, **Lưu Hóa Quyền**, **Lưu Hóa Khoa**, **Lưu Hóa Kị**.
2. Xử lý Địa Chi ngày $\rightarrow$ An **Lưu Thái Tuế**, **Lưu Thiên Mã**, **Lưu Hà**, **Kình Dương / Đà La ngày**.


* **Logic Chiếu Cung:**
* Nếu **Lưu Hóa Lộc / Lưu Lộc Tồn** rơi vào *Cung Mệnh, Tài Bạch, Quan Lộc* $\rightarrow +25$ điểm.
* Nếu **Lưu Hóa Kị / Lưu Kình Đà** rơi vào *Cung Mệnh, Tật Ách, Quan Lộc* $\rightarrow -25$ điểm.
* Nếu **Lưu Thiên Mã** rơi vào *Cung Di* $\rightarrow$ Rất tốt cho xuất hành, đi xa ($+15$ điểm).



### Tầng 4: Trọng Số Theo Mục Đích Công Việc (Task-Based Adjustment)

Cùng một ngày, điểm số sẽ biến thiên tùy thuộc vào việc người dùng muốn làm gì:

| Loại Công Việc ($Task$) | Sao & Trực Ưu Tiên (Bonus $+15$) | Sao & Trực Kỵ (Penalty $-20$) |
| --- | --- | --- |
| **Ký Hợp Đồng / Tài Chính** | Lưu Lộc Tồn, Lưu Hóa Lộc, Trực Thành, Trực Khai | Lưu Hóa Kị, Sao Phục Binh, Trực Phá |
| **Cầu Hôn / Cưới Hỏi** | Hồng Loan, Thiên Hỷ, Trực Định, Trực Mãn | Cô Thần, Quả Tú, Lưu Kình Đà |
| **Xuất Hành / Mua Xe** | Lưu Thiên Mã, Trực Khai, Trực Bình | Ngũ Quỷ, Thụ Tử, Lưu Hóa Kị ở Cung Di |
| **Chữa Bệnh / Phẫu Thuật** | Trực Trừ, Trực Giải, Thiên Giải | Trực Bế, Lưu Hóa Kị ở Cung Tật Ách |

---

## 3. Mô Hình Toán Học Chấm Điểm (Scoring Matrix)

Tổng điểm $S$ của một ngày được tính theo công thức:

$$S = \max \left(0, \min \left(100, \sum_{i=1}^{4} (W_i \times S_i) - P_{\text{HardStop}} \right)\right)$$

Trong đó:

* $S_1, S_2, S_3, S_4$: Điểm chuẩn hóa của từng tầng (Thang $0 - 100$).
* $W_1 = 0.20$ (Tầng 1 - Lịch chung)
* $W_2 = 0.30$ (Tầng 2 - Can Chi Tuổi)
* $W_3 = 0.35$ (Tầng 3 - Tử Vi cá nhân)
* $W_4 = 0.15$ (Tầng 4 - Mục đích công việc)
* $P_{\text{HardStop}}$: Điểm phạt nặng ($50$ điểm) nếu phạm các ngày Đại Hung hoặc Xung Trực Tiếp Tuổi.

### Phân Loại Kết Quả:

* **$85 \le S \le 100$:** **Đại Cát** (Thích hợp tiến hành việc lớn).
* **$70 \le S < 85$:** **Tiểu Cát** (Tốt, tiến hành thuận lợi).
* **$50 \le S < 70$:** **Bình Hòa** (Việc nhỏ làm được, việc lớn cần cân nhắc).
* **$30 \le S < 50$:** **Thận Trọng** (Nên hoãn hoặc chọn giờ tốt để giải hạn).
* **$S < 30$ hoặc `Flag_HardStop = True`:** **Đại Hung** (Tuyệt đối không sử dụng).

---

## 4. Cấu Trúc Dữ Liệu Lập Trình (JSON Schema Input/Output)

### Input Schema (Dữ liệu đầu vào)

```json
{
  "user_profile": {
    "birth_year_can_chi": "Giáp Tý",
    "birth_date_lunar": "1984-05-15",
    "menh_nap_am": "Hải Trung Kim",
    "tu_vi_chart": {
      "menh_cung_idx": 3,
      "tai_bach_idx": 11,
      "quan_loc_idx": 7,
      "tat_ach_idx": 8,
      "thien_di_idx": 9
    }
  },
  "target_date_solar": "2026-10-15",
  "task_type": "CONTRACT_SIGNING"
}

```

### Output Schema (Kết quả trả về)

```json
{
  "date_solar": "2026-10-15",
  "date_lunar": "2026-09-05",
  "can_chi_date": "Mậu Dần",
  "total_score": 88,
  "rating": "ĐẠI CÁT",
  "breakdown": {
    "layer1_global_score": 75,
    "layer2_can_chi_score": 90,
    "layer3_tu_vi_score": 95,
    "layer4_task_score": 85
  },
  "hard_stop_flags": [],
  "key_highlights": [
    "Lưu Hóa Lộc ngày Mậu chiếu thẳng Cung Tài Bạch",
    "Địa chi Dần hòa hợp Tam hợp với Tuổi Tý (cùng thuộc Thủy cục/Thủy sinh Wood)",
    "Ngày Trực Thành rất tốt cho giao dịch ký kết"
  ],
  "best_hours": [
    {"hour_chi": "Thìn", "time_range": "07:00 - 09:00", "status": "HOÀNG_ĐẠO"},
    {"hour_chi": "Tỵ", "time_range": "09:00 - 11:00", "status": "HOÀNG_ĐẠO"}
  ]
}

```

---

Bạn muốn chúng ta đi chi tiết hơn vào **Bảng ma trận an Sao Lưu Ngày trong Tử Vi** để viết hàm code, hay thiết kế **Giao diện người dùng (UI Component)** cho phần Lịch Trạch Nhật này?