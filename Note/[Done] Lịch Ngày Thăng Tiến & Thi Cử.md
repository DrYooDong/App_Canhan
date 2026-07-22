Tính năng **Lịch "Săn" Ngày Thăng Tiến & Thi Cử (Intellect & Career Booster Calendar)** được thiết kế chuyên biệt để giải quyết hai nhu cầu lớn nhất trong đời sống hiện đại: **Đạt điểm số/bằng cấp tối đa (Học vấn)** và **Gia tăng vị thế/thu nhập (Công danh)**.

Thay vì bắt người dùng tự tra cứu hàng trăm quy tắc sao complex, tính năng này cung cấp một **Bộ lọc quét mục tiêu thông minh (Goal-Driven Smart Scanner)**: Người dùng chỉ cần chọn công việc sắp tới *(ví dụ: Phỏng vấn xin việc, Thi cao học, Trình dự án cho Sếp)*, hệ thống sẽ quét ma trận lá số cá nhân trong 30–90 ngày tới và trả về **Top 3 Ngày Vàng** kèm giờ Hoàng Đạo tối ưu nhất.

Dưới đây là thiết kế chi tiết về **Thuật toán lọc Cát Tinh, 4 Kịch bản ứng dụng, Quy trình kích hoạt năng lượng, Giao diện UI/UX và JSON Schema API**.

---

## 1. Thuật Toán & Ma Trận Lọc Cát Tinh (Star Matrix Engine)

Thuật toán phân tách năng lượng ngày thành **2 Trục Cát Tinh chính**:

```
                              ┌──> TRỤC KHOA BẢNG (Thi cử, Bằng cấp, Học vấn)
[Quét Lá Số + Lưu Sao Ngày] ──┤
                              └──> TRỤC QUYỀN UY (Thăng tiến, Đàm phán, Sếp duyệt)

```

### A. Trục Khoa Bảng & Thi Cử (Intellect & Exam Boosters)

Quét các sao chủ về trí tuệ, khả năng ứng biến, thi cử đỗ đạt và văn thư bằng cấp:

1. **Văn Tinh & Khoa Bảng:** *Văn Xương, Văn Khúc, Lưu Hóa Khoa, Lưu Niên Văn Tinh, Bác Sĩ, Quốc Ấn, Long Trì, Phượng Các*.
2. **Quý Nhân Trợ Giúp:** *Thiên Khôi, Thiên Việt* (Chủ về giám thị dễ tính, đề thi rơi đúng tủ, người chấm nương tay).
3. **Cung Chức Chiếu:**
* Cung **Phụ Mẫu** (Chủ về Bằng cấp, Giấy tờ, Thầy cô, Sếp trực tiếp).
* Cung **Quan Lộc** & Cung **Mệnh/Thân**.



### B. Trục Quyền Uy & Thăng Tiến (Career & Promotion Boosters)

Quét các sao chủ về tiếng nói có trọng lượng, sự nể trọng của lãnh đạo, và khả năng chốt hợp đồng/vị thế:

1. **Quyền Uy & Vị Thế:** *Lưu Hóa Quyền, Tử Vi, Thiên Tướng, Thái Dương (Miếu/Vượng), Tướng Quân, Phong Cáo, Thái Tuế*.
2. **Trợ Lực Cấp Dưới / Đối Tác:** *Tả Phụ, Hữu Bật, Lưu Hóa Lộc*.
3. **Cung Chức Chiếu:** Cung **Quan Lộc** & Cung **Nô Bộc** (Bạn bè, Đồng nghiệp, Cấp dưới).

---

## 2. Bốn Kịch Bản "Săn Ngày" Thực Chiến (Use-Case Scenarios)

### Kịch Bản 1: Thi Cử / Bảo Vệ Luận Văn / Thi Lấy Chứng Chỉ

* **Mục tiêu:** Đầu óc sáng suốt, nhớ bài tốt, không bị gián đoạn tâm lý.
* **Tiêu chí thuật toán lọc:**
* **Sao bắt buộc hội chiếu Mệnh/Quan:** *Văn Xương / Văn Khúc / Lưu Hóa Khoa*.
* **Trực ngày ưu tiên:** **Trực Định** (Giữ vững phong độ), **Trực Mãn** (Trọn vẹn, kết quả cao).
* **Cờ Tránh (Hard Penalty):** Kỵ ngày có *Lưu Hóa Kị* (Dễ tô sai đáp án, quên giấy tờ) hoặc *Kình Dương / Đà La* (Tâm lý hoảng loạn, máy tính hỏng).



### Kịch Bản 2: Phỏng Vấn Xin Việc / Nộp Đơn Chuyển Ngạch

* **Mục tiêu:** Tạo ấn tượng ban đầu cực tốt với nhà tuyển dụng/Sếp.
* **Tiêu chí thuật toán lọc:**
* **Sao bắt buộc hội chiếu:** *Thiên Khôi / Thiên Việt* (Gặp Quý nhân) + *Phong Cáo* (Được đánh giá cao).
* **Trực ngày ưu tiên:** **Trực Khai** (Khai mở cơ hội mới), **Trực Thành** (Thành công trôi chảy).
* **Tương tác Tử Vi:** Lưu *Khôi / Việt* chiếu Cung Phụ Mẫu hoặc Cung Quan Lộc.



### Kịch Bản 3: Trình Dự Án Cho Lãnh Đạo / Xin Tăng Lương / Đề Xuất Thăng Chức

* **Mục tiêu:** Lời nói có trọng lượng, Sếp gật đầu phê duyệt nhanh chóng.
* **Tiêu chí thuật toán lọc:**
* **Sao bắt buộc hội chiếu:** *Lưu Hóa Quyền* (Nói có uy) + *Lưu Hóa Lộc* (Kích hoạt tài lộc/ngân sách dự án).
* **Tương tác Tử Vi:** Chiếu trực tiếp vào **Cung Quan Lộc** của bạn.
* **Trực ngày ưu tiên:** **Trực Thành** (Mọi việc được phê duyệt).



### Kịch Bản 4: Ra Mắt Sản Phẩm / Thuyết Trình Trước Công Chúng (Pitching)

* **Mục tiêu:** Thu hút sự chú ý, tạo danh tiếng vươn xa.
* **Tiêu chí thuật toán lọc:**
* **Sao bắt buộc hội chiếu:** *Thái Dương (Miếu địa)* hoặc *Hỷ Thần + Thái Tuế*.
* **Trực ngày ưu tiên:** **Trực Bình** (Hòa hợp đám đông), **Trực Khai** (Lan tỏa rộng rãi).



---

## 3. Quy Trình "Kích Hoạt Năng Lượng Khoa Bảng & Quyền Uy" (Actionable Boosters)

Để tăng tính ứng dụng thực tế, khi tìm ra ngày tốt, ứng dụng sẽ đưa ra **Hướng dẫn kích hoạt năng lượng (Micro-Remedies)** ngay trước thời điểm tiến hành việc:

1. **Vị Trí "Văn Xương Hướng" (Academic Orientation):**
* Dựa vào Can Chi Ngày, AI tính tọa độ phương vị Văn Xương trong phòng *(VD: Ngày Giáp - Hướng Tỵ / Đông Nam)*.
* *Lời khuyên:* "Trước khi đi thi / phỏng vấn 1 tiếng, hãy ngồi ôn bài hoặc rà soát tài liệu tại góc **Đông Nam** của ngôi nhà để nạp năng lượng sáng suốt."


2. **Trang Phục & Vật Phẩm Tăng Uy Lực:**
* *Ngày thi cử:* Đeo/mặt trang phục bổ Mộc/Kim (Màu Xanh/Trắng), mang theo bút viết thuộc hành may mắn.
* *Ngày gặp Sếp đề xuất tăng lương:* Điểm nhấn phụ kiện màu Đỏ/Vàng (Hỏa/Thổ - tượng trưng cho Tứ Hóa Quyền/Lộc) để tăng khí thế tự tin.



---

## 4. Thiết Kế Giao Diện UI/UX (Smart Target Scanner)

Giao diện dạng **Thẻ Tìm Kiếm Mục Tiêu (Target Search Card)** cực kỳ hiện đại:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 BỘ LỌC "SĂN" NGÀY THĂNG TIẾN & THI CỬ                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  📌 Chọn mục tiêu công việc:                                                │
│     [ 🎓 Thi Cử / Bảo Vệ ]  [ 💼 Phỏng Vấn ]  [ 👑 Trình Sếp / Tăng Lương ]   │
│                                                                             │
│  📅 Hạn định thời gian: [Trong 30 ngày tới  ▼]                              │
│                                                                             │
│  [  🔍 QUÉT TÌM NGÀY VÀNG NGAY  ]                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  🌟 TOP 3 NGÀY TỐI ƯU NHẤT CHO BẠN:                                         │
│                                                                             │
│  🥇 TOP 1: 18/10/2026 (Ngày Tân Mão - Trực Định) 🏆 ĐIỂM KHOA BẢNG: 96/100     │
│     • Lý do: Lưu Hóa Khoa & Thiên Khôi chiếu Cung Mệnh; Lưu Văn Tinh nhập Quan. │
│     • Khung giờ vàng tiến hành: 09:00 - 11:00 (Giờ Tỵ - Giờ Hoàng Đạo).     │
│                                                                             │
│  🥈 TOP 2: 25/10/2026 (Ngày Mậu Tuất - Trực Thành) 🏆 ĐIỂM KHOA BẢNG: 88/100    │
│  🥉 TOP 3: 02/11/2026 (Ngày Bính Ngọ - Trực Khai)  🏆 ĐIỂM KHOA BẢNG: 82/100    │
└─────────────────────────────────────────────────────────────────────────────┘

```

---

## 5. Cấu Trúc Dữ Liệu JSON Cho Web API

```json
{
  "request": {
    "user_id": "usr_8899",
    "target_goal": "PROMOTION_PROPOSAL",
    "scan_range_days": 30
  },
  "scan_results": {
    "total_days_scanned": 30,
    "top_matching_dates": [
      {
        "rank": 1,
        "date_solar": "2026-10-18",
        "date_lunar": "2026-09-08",
        "can_chi_day": "Tân Mão",
        "booster_score": 96,
        "category": "CAREER_PROMOTION",
        "key_astrology_factors": [
          "Lưu Hóa Quyền nhập Cung Quan Lộc (Tiếng nói có trọng lượng tuyệt đối)",
          "Lưu Thiên Khôi chiếu Cung Phụ Mẫu (Sếp trực tiếp có cảm tình lớn)",
          "Ngày Trực Thành rất thuận lợi cho việc ký duyệt"
        ],
        "best_hours": [
          {
            "hour_chi": "Tỵ",
            "time": "09:00 - 10:59",
            "rating": "ĐẠI_CÁT",
            "reason": "Giờ Hoàng Đạo + Cung Quan Lộc được Kích Tinh"
          }
        ],
        "activation_remedies": {
          "wen_chang_direction": "ĐÔNG_NAM",
          "recommended_colors": ["Vàng Nâu", "Ánh Kim"],
          "action_tip": "Gửi File đề xuất hoặc bước vào phòng Sếp đàm phán trong khung giờ Tỵ (09:15 - 09:45)."
        }
      }
    ]
  }
}

```

---

Với tính năng **Lịch "Săn" Ngày Thăng Tiến & Thi Cử**, website Tử Vi cá nhân của bạn sẽ sở hữu một công cụ định hướng hành động vô cùng thiết thực. Người dùng không chỉ xem vận hạn một cách bị động mà có thể chủ động **sắp xếp lịch thi cử, phỏng vấn, đàm phán sự nghiệp** vào đúng những "điểm rơi phong độ" cao nhất của lá số!