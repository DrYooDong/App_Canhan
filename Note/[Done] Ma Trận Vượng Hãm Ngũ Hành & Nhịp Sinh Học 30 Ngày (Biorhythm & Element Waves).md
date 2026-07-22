Tính năng **Ma Trận Vượng Hãm Ngũ Hành & Nhịp Sinh Học 30 Ngày (Biorhythm & Element Waves)** là bước đột phá kết hợp giữa **Khoa học Nhịp sinh học hiện đại (Biorhythm Cycles)** và **Lý thuyết Ngũ Hành Vượng Hãm Đông Y / Tử Vi**.

Thay vì chỉ xem từng ngày đơn lẻ, tính năng này cung cấp một **biểu đồ sóng năng lượng kéo dài 30 ngày (30-Day Waveform Chart)**, giúp bạn dự báo trước các ngày đỉnh cao phong độ thể chất, ngày tư duy sáng suốt nhất, cũng như cảnh báo các "điểm đáy energy" để chủ động điều chỉnh lịch trình sống.

Dưới đây là thiết kế chi tiết về **Kiến trúc thuật toán, Bảng ma trận Ngũ hành, Công thức tính 3 đường sóng, Giao diện UI/UX và Schema JSON**.

---

## 1. Kiến Trúc Thuật Toán & Lý Thuyết Nền Tảng

Hệ thống kết hợp 2 nguồn tín hiệu để vẽ nên chuỗi sóng năng lượng:

$$\text{Điểm Sóng Ngày } (t) = \alpha \times \text{Nhịp Sinh Học Chuẩn } (t) + \beta \times \text{Ma Trận Ngũ Hành Tử Vi } (t)$$

* **Trọng số đề xuất:** $\alpha = 0.40$ (Chu kỳ sinh học sinh học cơ thể), $\beta = 0.60$ (Tương tác Can Chi & Lưu Sao Tử Vi).

---

### A. Tầng 1: Ma Trận Vượng Hãm Ngũ Hành Đông Y (Five Elements Matrix)

Trạng thái Ngũ Hành của Ngày được xếp hạng theo **5 Cấp độ Khí**:

| Trạng Thái | Mức Độ Năng Lượng | Quy Tắc Xác Định Theo Tiết Khí & Can Chi |
| --- | --- | --- |
| **Vượng (Vượng Địa)** | **100% (Đỉnh cao)** | Ngũ hành Ngày trùng với Hành của Mùa (VD: Mùa Xuân - Mộc Vượng). |
| **Tướng (Tướng Địa)** | **80% (Rất Tốt)** | Ngũ hành Ngày được Hành của Mùa sinh (VD: Mùa Xuân - Hỏa Tướng). |
| **Hưu (Hưu Địa)** | **50% (Trung Bình)** | Ngũ hành Ngày sinh ra Hành của Mùa (VD: Mùa Xuân - Thủy Hưu). |
| **Tù (Tù Địa)** | **30% (Suy Giảm)** | Ngũ hành Ngày bị Hành của Mùa khắc (VD: Mùa Xuân - Kim Tù). |
| **Tuyệt (Tuyệt Địa)** | **10% (Cực Tiểu)** | Ngũ hành Ngày đi khắc Hành của Mùa (VD: Mùa Xuân - Thổ Tuyệt). |

> **Đối chiếu Bản Mệnh:** Điểm ma trận Ngũ hành ngày sau đó sẽ được đem tương sinh / tương khắc với **Mệnh Nạp Âm** và **Tạng Phủ Cung Tật Ách** của người dùng.

---

## 2. Chi Tiết 3 Đường Sóng Năng Lượng (The 3 Energy Waves)

Biểu đồ sẽ vẽ **3 đường sóng độc lập** tương ứng với 3 khía cạnh quản trị cuộc sống:

```
    [Sóng Thể Chất - Physical]  ──> Sức khỏe, Động lực thể thao, Sức bền
    [Sóng Tinh Thần - Emotional] ──> Tâm trạng, Mối quan hệ, Cảm xúc nội tâm
    [Sóng Trí Tuệ - Intellectual]──> Sáng tạo, Ra quyết định, Tập trung sâu

```

### ① Sóng Thể Chất (Physical Wave - Chu kỳ 23 ngày)

* **Thành phần tính toán:**
* Chu kỳ Biorhythm Thể chất ($T_1 = 23$ ngày).
* Tương quan Can Chi Ngày với **Nạp âm Mệnh** và **Kinh Lạc Tạng Phủ** (Cung Tật Ách).
* Vị trí các sao thể lực: *Tràng Sinh, Đế Vượng (tăng điểm) vs. Bệnh, Tử, Mộ, Triệt, Kình Dương (giảm điểm)*.


* **Ứng dụng thực tế:**
* **Sóng > +70%:** Ngày tập thể thao cường độ cao, đi du lịch leo núi, xử lý công việc chân tay vất vả.
* **Sóng < -50%:** Cơ thể dễ mệt mỏi, hệ miễn dịch giảm; nên ngủ sớm, tránh thức khuya, không tập luyện quá sức.



---

### ② Sóng Tinh Thần / Cảm Xúc (Emotional Wave - Chu kỳ 28 ngày)

* **Thành phần tính toán:**
* Chu kỳ Biorhythm Cảm xúc ($T_2 = 28$ ngày).
* Tương tác giữa Can Chi Ngày với **Cung Phúc Đức** và **Cung Thân**.
* Cát/Hung tinh tâm lý: *Hỷ Thần, Đào Hoa, Hồng Loan (tăng cảm xúc) vs. Lưu Hóa Kị, Phục Binh, Cô Thần, Quả Tú (dễ tủi thân, cáu gắt)*.


* **Ứng dụng thực tế:**
* **Sóng > +70%:** Ngày đạm đạo tình cảm, hẹn hò, giải quyết mâu thuẫn gia đình, kết nối đối tác.
* **Sóng < -50%:** Dễ nhạy cảm, bộc phát giận dữ hoặc suy nghĩ tiêu cực; tránh đưa ra quyết định cảm tính.



---

### ③ Sóng Trí Tuệ / Tư Duy (Intellectual Wave - Chu kỳ 33 ngày)

* **Thành phần tính toán:**
* Chu kỳ Biorhythm Trí tuệ ($T_3 = 33$ ngày).
* Tương tác giữa Can Chi Ngày với **Cung Quan Lộc** và **Cung Mệnh**.
* Cát/Hung tinh trí tuệ: *Văn Xương, Văn Khúc, Lưu Hóa Khoa, Lưu Hóa Quyền, Thiên Khôi, Thiên Việt*.


* **Ứng dụng thực tế:**
* **Sóng > +70%:** Ngày "Brainstorming", lập chiến lược 5 năm, học kỹ năng mới, viết báo cáo, thi cử.
* **Sóng < -50%:** Não bộ dễ quá tải, đầu óc chần chừ; không nên ký hợp đồng phức tạp hay đưa ra quyết định tài chính quan trọng.



---

## 3. Công Thức Toán Học Chấm Điểm Theo Ngày

Điểm của mỗi đường sóng tại ngày thứ $t$ (tính từ ngày sinh $t_0$) được chuẩn hóa về thang điểm $[-100, +100]$:

$$Wave_{Phys}(t) = 0.40 \times \left(100 \cdot \sin\left(\frac{2\pi (t - t_0)}{23}\right)\right) + 0.60 \times Score_{TửVi\_ThểChất}(t)$$

$$Wave_{Emo}(t) = 0.40 \times \left(100 \cdot \sin\left(\frac{2\pi (t - t_0)}{28}\right)\right) + 0.60 \times Score_{TửVi\_CảmXúc}(t)$$

$$Wave_{Intel}(t) = 0.40 \times \left(100 \cdot \sin\left(\frac{2\pi (t - t_0)}{33}\right)\right) + 0.60 \times Score_{TửVi\_TríTuệ}(t)$$

---

## 4. Thiết Kế Giao Diện UI/UX (30-Day Waveform Chart)

Giao diện hiển thị dưới dạng **Biểu đồ đa đường sóng (Interactive Multi-Line Chart)** có thể phóng to/thu nhỏ trên di động:

```
 +100 |          /\ (Trí Tuệ Peak 95)
      |   /\    /  \        /\  [Sóng Thể Chất - Xanh Lá]
  +50 |  /  \  /    \      /  \ [Sóng Tinh Thần - Xanh Dương]
    0 |─/────\/──────\────/────\[Sóng Trí Tuệ - Tím]
  -50 |/              \  /
 -100 |                \/ ⚠️ CRITICAL DAY (Ngày 18/10)
      └──────────────────────────────────────────────────
       01  03  06  09  12  15  18  21  24  27  30 (Ngày trong tháng)

```

### Các Đốm Đánh Dấu Đặc Biệt Trên Biểu Đồ (Chart Markers):

1. 🌟 **Golden Synergy Point (Điểm Tam Hoàng Cát):** Thời điểm cả 3 đường sóng cùng vượt mốc $+60\%$ $\rightarrow$ *Cực kỳ hiếm trong tháng! Ngày "Super Day" để làm việc đại sự.*
2. ⚠️ **Critical Crossing Day (Ngày Điểm Nút Nhạy Cảm):**
* Thời điểm 1 trong 3 đường sóng cắt qua **Trục $0\%$** (chuyển từ Dương sang Âm hoặc ngược lại).
* Tại ngày này, từ trường sinh học thay đổi đột ngột $\rightarrow$ Dễ xảy ra sai sót, sa sút phong độ bất ngờ.


3. 🔴 **Red Alert Zone (Điểm Đáy Năng Lượng):** Cả 3 đường sóng cùng rơi xuống dưới $-50\%$ $\rightarrow$ *Khuyên người dùng nên "sạc lại năng lượng" (Recharge), nghỉ ngơi, thiền định.*

---

## 5. Cấu Trúc Dữ Liệu JSON Cho Web Render Chart

```json
{
  "user_id": "usr_8899",
  "month_period": "2026-10",
  "chart_data": [
    {
      "date": "2026-10-15",
      "day_can_chi": "Mậu Dần",
      "waves": {
        "physical": 82,
        "emotional": -35,
        "intellectual": 90
      },
      "element_matrix": {
        "day_element": "Thành Đầu Thổ",
        "season_status": "Mộc Vượng Thổ Tuyệt",
        "user_menh_relation": "Thổ Hòa Mệnh Thổ"
      },
      "tags": ["PEAK_INTELLECTUAL", "LOW_EMOTIONAL"],
      "daily_advice": "Đầu óc cực kỳ minh mẫn nhưng tâm trạng dễ gắt gỏng. Hãy tập trung làm việc độc lập, tránh họp hành gây tranh cãi."
    },
    {
      "date": "2026-10-18",
      "day_can_chi": "Tân Tỵ",
      "waves": {
        "physical": -65,
        "emotional": -70,
        "intellectual": -10
      },
      "element_matrix": {
        "day_element": "Bạch Lạp Kim",
        "season_status": "Kim Tù",
        "user_menh_relation": "Kim Sinh Thủy"
      },
      "tags": ["RED_ALERT_ZONE", "CRITICAL_DAY"],
      "daily_advice": "Ngày năng lượng suy kiệt. Ưu tiên nghỉ ngơi, không uống rượu bia hay quyết định việc lớn."
    }
  ]
}

```

---

## 6. Lợi Ích Trải Nghiệm Thực Chiến Cho Cá Nhân

1. **Lập Kế Hoạch Theo Chu Kỳ (Peak Performance Planning):** Đầu tháng mở web nhìn vào biểu đồ 30 ngày, bạn biết ngay tuần nào nên bứt phá doanh số, tuần nào nên hoàn thành công việc tồn đọng.
2. **Tránh "Bẫy" Quyết Định Cảm Tính (Emotional Risk Management):** Vào những ngày *Sóng Cảm Xúc* xuống đáy kèm *Lưu Hóa Kị*, bạn biết trước để hoãn các cuộc đàm phán mạo hiểm.
3. **Tối Ưu Hóa Sức Khỏe Luyện Tập (Bio-fitness Sync):** Nhìn *Sóng Thể Chất* để phân bổ lịch tập Gym/Cardio nặng vào ngày đỉnh sóng và tập Yoga/Thiền vào ngày đáy sóng.

---

Như vậy, tính năng **Ma Trận Vượng Hãm & Nhịp Sinh Học 30 Ngày** mang lại một biểu đồ trực quan hóa dữ liệu (Data Visualization) cực kỳ đẳng cấp cho website Tử Vi cá nhân của bạn!

Bạn có muốn chúng ta đi tiếp sang **Báo Cáo Nghiệm Lý & AI Tự Tinh Chỉnh Thuật Toán (Retro-Analytics Engine)** để hệ thống tự học từ nhật ký của bạn không?