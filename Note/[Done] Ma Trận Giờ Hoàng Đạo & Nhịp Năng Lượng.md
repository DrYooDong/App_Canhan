Tính năng **Ma Trận Giờ Hoàng Đạo & Nhịp Năng Lượng 24 Giờ (Hourly Energy Heatmap)** sẽ giúp biến cuốn lịch âm dương khô khô Khán thành một **biểu đồ nhịp sinh học năng lượng trực quan**, hỗ trợ bạn chủ động lập kế hoạch công việc, họp hành, thương thảo hay nghỉ ngơi trong suốt 24 giờ.

Dưới đây là thiết kế chi tiết về **Logic thuật toán, Quy tắc an giờ, Giao diện UI/UX và Cấu trúc dữ liệu JSON** để bạn triển khai tính năng này.

---

## 1. Kiến Trúc Thuật Toán Chấm Điểm Giờ (Hourly Energy Scoring)

Một ngày có 12 canh giờ (mỗi canh 2 tiếng). Điểm năng lượng từng canh giờ ($H_{score} \in [0, 100]$) được tổng hợp từ **3 lớp tín hiệu**:

$$\text{Hourly Score } (H) = (W_1 \times H_{\text{Chung}}) + (W_2 \times H_{\text{CanChi}}) + (W_3 \times H_{\text{TửVi}})$$

* **Trọng số đề xuất:** $W_1 = 0.25$ (Lịch chung), $W_2 = 0.35$ (Xung hợp Can Chi tuổi), $W_3 = 0.40$ (Lưu thời Tử Vi cá nhân).

---

### Lớp 1: Khung Năng Lượng Chung ($H_{\text{Chung}}$ - Trọng số 25%)

1. **Hoàng Đạo / Hắc Đạo của Ngày:**
* Giờ Hoàng Đạo (Thanh Long, Minh Đường, Kim Quỹ, Bảo Quang, Ngọc Đường, Tư Mệnh): $+20$ điểm.
* Giờ Hắc Đạo (Thần Cùng, Thiên Hình, Chu Tước, Bạch Hổ, Huyền Vũ, Câu Trận): $-20$ điểm.


2. **Lục Diệu & Giờ Lý Thuần Phong:**
* Tính Lục Diệu giờ dựa vào Ngày âm lịch (Khởi tháng $\rightarrow$ Khởi ngày $\rightarrow$ Khởi giờ):
* **Đại An, Tốc Hỷ, Tiểu Cát:** $+15$ điểm.
* **Lưu Niên, Xích Khẩu, Không Vong:** $-15$ điểm.





---

### Lớp 2: Tương Khắc Can Chi Bản Mệnh ($H_{\text{CanChi}}$ - Trọng số 35%)

Đối chiếu **Chi của Giờ** với **Chi Năm sinh / Chi Cung Mệnh** của bạn:

* **Tương Hợp:**
* Giờ thuộc **Tam Hợp / Lục Hợp** với Chi Mệnh/Tuổi: $+30$ điểm.
* Giờ là **Thiên Lộc / Thiên Mã / Thiên Khôi / Thiên Việt** của Can Tuổi: $+20$ điểm.


* **Tương Xung / Tương Hình:**
* Giờ **Lục Xung** trực tiếp với Chi Tuổi (VD: Tuổi Tý gặp Giờ Ngọ): $-40$ điểm *(Cảnh báo đỏ)*.
* Giờ **Tương Hình / Lục Hại**: $-20$ điểm.



---

### Lớp 3: Tương Tác Lá Số Tử Vi Trực Tiếp ($H_{\text{TửVi}}$ - Trọng số 40%)

Mỗi canh giờ (Tý đến Hợi) tương ứng với 1 ô Cung cố định trên Lá số Tử Vi của bạn:

1. **Vị Trí Cung Giờ Chiếu:**
* Giờ rơi vào **Cung Mệnh / Cung Quan Lộc / Cung Tài Bạch / Cung Phúc Đức**: $+25$ điểm.
* Giờ rơi vào **Cung Tật Ách**: $-10$ điểm (Ưu tiên nghỉ ngơi, trị liệu).


2. **Cát / Hung Tinh Tại Cung Đó (Đã an trên Thiên Bàn):**
* Cung giờ có **Tử, Tướng, Đồng, Lương, Phủ, Vũ, Hóa Lộc, Hóa Quyền**: $+20$ điểm.
* Cung giờ có **Kình Dương, Đà La, Hóa Kị, Phục Binh, Địa Không, Địa Kiếp**: $-25$ điểm.



---

## 2. Thiết Kế Giao Diện UI/UX (Hourly Energy Heatmap)

### A. Thanh Nhịp Năng Lượng 24H (Visual Heatmap Bar)

Giao diện hiển thị dải màu kéo dài 24 tiếng (mỗi block 2 giờ), hoặc biểu đồ đường hình sóng (Wave Form):

```
[00:00 - 01:00] TÝ   █ 85 pts (Đại Cát - Xanh Lá)
[01:00 - 03:00] SỬU  █ 45 pts (Thận Trọng - Cam)
[03:00 - 05:00] DẦN  █ 60 pts (Bình Hòa - Vàng)
[05:00 - 07:00] MÃO  █ 92 pts (ĐẠI CÁT HIGHLIGHT - Vàng Kim)
...
[11:00 - 13:00] NGỌ  █ 25 pts (XUNG MỆNH - Đỏ Đậm ⚠️)

```

### B. Bảng Mã Màu Trạng Thái:

* 🟢 **85 - 100 điểm (Xanh lá / Vàng Kim):** **Giờ Hoàng Đạo Đại Cát** $\rightarrow$ Thích hợp họp quan trọng, ký kết, ra quyết định, chốt deal.
* 🔵 **70 - 84 điểm (Xanh Dương):** **Tiểu Cát / Thuận Lợi** $\rightarrow$ Tốt cho sáng tạo, viết lách, giao tiếp, gửi email.
* 🟡 **50 - 69 điểm (Vàng):** **Bình Hòa** $\rightarrow$ Làm việc vận hành hàng ngày, công việc sự vụ.
* 🟠 **35 - 49 điểm (Cam):** **Thận Trọng** $\rightarrow$ Dễ gián đoạn, nên tập trung làm việc cá nhân, tránh tranh luận.
* 🔴 **< 35 điểm (Đỏ):** **Đại Hung / Xung Mệnh** $\rightarrow$ Tránh đưa ra quyết định quan trọng, dễ va chạm hoặc sai sót.

---

## 3. Tích Hợp Đồng Hồ Sinh Học Đông Y (Biological Rhythm Sync)

Một điểm độc đáo có thể bổ sung là sự kết hợp **Kinh Lạc Đông Y** theo 12 canh giờ để đưa ra lời khuyên sức khỏe cá nhân hóa:

| Khung Giờ | Canh Giờ | Kinh Lạc Vượng | Gợi Ý Hành Động Phù Hợp |
| --- | --- | --- | --- |
| **23h - 01h** | Tý | Kinh Đởm (Túi mật) | Ngủ sâu để cơ thể tái tạo năng lượng, thải độc. |
| **03h - 05h** | Dần | Kinh Phế (Phổi) | Thời điểm khí huyết điều hòa, sâu giấc hoặc thiền định. |
| **07h - 09h** | Thìn | Kinh Vị (Dạ dày) | Ăn sáng đầy đủ dinh dưỡng, năng lượng cao nhất. |
| **09h - 11h** | Tỵ | Kinh Tỳ (Lách) | Sáng suốt nhất trong ngày, ưu tiên tư duy chiến lược/học tập. |
| **11h - 13h** | Ngọ | Kinh Tâm (Tim) | Nghỉ trưa ngắn (15-30 phút) để dưỡng tâm khí. |
| **15h - 17h** | Thân | Kinh Bàng Quang | Tỉnh táo trở lại, thời điểm tốt cho thể thao hoặc xử lý công việc dồn dập. |

---

## 4. Cấu Trúc Dữ Liệu JSON Cho Web API

```json
{
  "date": "2026-10-15",
  "hourly_heatmap": [
    {
      "hour_chi": "Thìn",
      "time_range": "07:00 - 08:59",
      "score": 88,
      "status": "DAI_CAT",
      "color_code": "#10B981",
      "luc_dieu": "Tốc Hỷ",
      "hoang_dao_status": "Hoàng Đạo (Minh Đường)",
      "tu_vi_cung": "Quan Lộc",
      "meridian_health": "Kinh Vị - Ăn sáng & Bắt đầu công việc trọng tâm",
      "recommendations": [
        "Rất tốt cho việc gặp khách hàng, đàm phán",
        "Có sao Hóa Quyền hội chiếu, lời nói có trọng lượng"
      ],
      "warnings": []
    },
    {
      "hour_chi": "Ngọ",
      "time_range": "11:00 - 12:59",
      "score": 28,
      "status": "XUNG_MENH",
      "color_code": "#EF4444",
      "luc_dieu": "Xích Khẩu",
      "hoang_dao_status": "Hắc Đạo (Bạch Hổ)",
      "tu_vi_cung": "Tật Ách",
      "meridian_health": "Kinh Tâm - Nên chợp mắt nghỉ trưa",
      "recommendations": ["Nghỉ ngơi, tĩnh tâm, ăn trưa thanh nhẹ"],
      "warnings": [
        "Lục xung với Chi Tý của Mệnh",
        "Dễ xảy ra bất đồng quan điểm hoặc mệt mỏi"
      ]
    }
  ]
}

```

---

## 5. Các Tính Năng Thông Minh Mở Rộng Dành Cho Cá Nhân

1. **Widget "Live Energy Clock" Trên Trang Chủ:** Hiển thị một đồng hồ đếm ngược canh giờ hiện tại, báo rõ: *"Bạn đang ở trong Khung Giờ Đại Cát (Tỵ: 09:00 - 11:00) - Hãy chốt các việc quan trọng ngay!"*.
2. **Focus Mode Switch (Chế Độ Tập Trung):** Tự động chuyển giao diện web hoặc gửi notification nhắc nhở bước vào giờ tập trung sâu (Deep Work).
3. **Lịch Lọc Giờ Tối Ưu (Smart Hour Finder):** Nhấp chọn việc: *"Gửi Email đề xuất tăng lương"* $\rightarrow$ Web tự động chỉ định: *"Khung giờ tốt nhất hôm nay của bạn là 08:15 (Giờ Thìn - Trực Thành - Cung Quan Lộc)"*.

---

Bạn muốn chúng ta hiện thực hóa **Công thức an Lục Diệu/Hoàng Đạo bằng code JavaScript/Python** hay thiết kế chi tiết **Layout Widget hiển thị 24h** cho website?