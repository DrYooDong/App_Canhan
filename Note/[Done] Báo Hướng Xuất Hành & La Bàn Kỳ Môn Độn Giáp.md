Tính năng **Báo Hướng Xuất Hành & La Bàn Kỳ Môn Độn Giáp (Interactive Qi Men Dun Jia Compass)** là điểm nhấn độc đáo nhất giúp website của bạn nâng tầm từ "xem lịch thụ động" thành một **công cụ điều hướng năng lượng thực chiến**.

Kỳ Môn Độn Giáp vốn nổi tiếng là môn thuật số chuyên về **Phương vị & Thời gian** (Không gian & Thời gian). Khi kết hợp thuật toán Kỳ Môn với cảm biến **GPS & Gyroscope (Con quay hồi chuyển)** trên điện thoại, website có thể chỉ định chính xác bạn nên bước chân ra khỏi nhà theo hướng nào để đạt hiệu quả cao nhất.

Dưới đây là thiết kế kiến trúc toàn diện cho tính năng này:

---

## 1. Thuật Toán Lọc Hướng Cát/Hung (Directional Energy Engine)

Phương vị cát hung được tính toán dựa trên **Ma trận 8 Hướng (Bát Quái - Bát Môn)** trong Kỳ Môn Độn Giáp kết hợp với **Thiên Can Ngày (Tài Thần, Hỷ Thần)** và **Lá số Tử Vi cá nhân**.

```
   [BẮC / Khảm]       [ĐÔNG BẮC / Cấn]       [ĐÔNG / Chấn]
   [ĐÔNG NAM / Tốn]   [TRUNG CUNG / Tụ]      [TÂY NAM / Khôn]
   [TÂY / Đoài]       [TÂY BẮC / Càn]        [NAM / Ly]

```

### A. Tầng 1: Tương Tác Bát Môn Kỳ Môn Độn Giáp (8 Doors Engine)

Mỗi khung giờ (12 canh giờ) có một Bàn Kỳ Môn xoay chuyển, xác định vị trí của 8 Cửa (Bát Môn):

1. **Ba Cửa Đại Cát (3 Auspicious Doors):**
* **Khai Môn (Đại Cát):** Tốt nhất cho mở mảng kinh doanh, đàm phán, phỏng vấn, bắt đầu dự án mới.
* **Hưu Môn (Trung Cát):** Tốt cho nghỉ ngơi, gặp gỡ bạn bè, cầu hôn, giải tỏa căng thẳng.
* **Sinh Môn (Thượng Cát):** Tốt nhất cho cầu tài, mua bán đất đai, ký hợp đồng tài chính, đầu tư.


2. **Hai Cửa Trung Tính / Nghiệp Vụ:**
* **Cảnh Môn:** Tốt cho quảng bá, làm truyền thông, thi cử, ký hợp đồng văn bản.
* **Đỗ Môn:** Tốt cho ẩn nấp, nghiên cứu sâu, điều tra, tránh né thị phi.


3. **Ba Cửa Hung (Avoid Doors):**
* **Tử Môn (Đại Hung):** Kỵ tuyệt đối xuất hành việc quan trọng (trừ đi viếng tang, cúng tế).
* **Kinh Môn:** Dễ gặp tranh chấp, kiện tụng, hoảng loạn, rủi ro pháp lý.
* **Thương Môn:** Dễ gặp tổn thương, tại nạn giao thông, mất mát tài sản.



---

### B. Tầng 2: Định Vị Thần Cát Theo Can Ngày (Daily Deities)

Tự động an vị trí của các vị Thần mang lại năng lượng tích cực theo Thiên Can của Ngày:

* **Tài Thần (Thần Tài Lộc):** Định hướng mang lại lợi ích tài chính, thương lượng giá.
* **Hỷ Thần (Thần Vui Vẻ):** Định hướng mang lại sự hòa nhã, tình cảm, tinh thần phấn chấn.
* **Quý Nhân (Âm/Dương Quý Nhân):** Định hướng gặp người trợ giúp, giải quyết bế tắc.

---

### C. Tầng 3: Cá Nhân Hóa Với Lá Số Tử Vi User

* Đối chiếu hướng xuất hành với **Cung Thiên Di** trên Lá Số Tử Vi: Nếu hướng xuất hành trùng với phương vị của Cung Di có cát tinh (*Lưu Thiên Mã, Lưu Hóa Lộc*) $\rightarrow$ **Cộng thêm $15 - 20$ điểm Cát**.
* Tránh hướng trùng với phương vị Cung Mệnh/Thân đang bị *Lưu Hóa Kị* hoặc *Lưu Kình Đà* chiếu.

---

## 2. Thiết Kế Giao Diện UI/UX La Bàn Kỳ Môn (Interactive Compass)

### A. La Bàn Tự Xoay Real-Time (Web Gyroscope Compass)

* Khi người dùng mở tính năng trên điện thoại, giao diện hiển thị một **Bản đồ La Bàn 360°**.
* **Tính năng cảm biến con quay:** Khi người dùng quay điện thoại theo hướng nào, mũi kim La Bàn sẽ xoay theo thực tế (sử dụng HTML5 `DeviceOrientationEvent`).
* **Vòng Bát Quái / Bát Môn:** Trên mặt la bàn chia làm 8 Cung (45°/cung).
* Hướng Cát: Đánh dấu **Màu Xanh Lá** hoặc **Vàng Kim** kèm icon (Ví dụ: *Đông Nam - Sinh Môn [Tài Thần]*).
* Hướng Hung: Đánh dấu **Màu Đỏ** kèm cảnh báo (Ví dụ: *Tây - Tử Môn [Cảnh báo]*).



### B. Bản Đồ Xuất Hành GPS (Radar Overlay Map)

* Tích hợp bản đồ GPS (Mapbox / Google Maps API): Lấy vị trí hiện tại (nhà/văn phòng) làm **Tâm điểm**.
* Vẽ 8 dải màu quạt xòe ra 8 hướng trực tiếp lên bản đồ thực tế.
* Người dùng có thể nhìn thấy ngay: *"Nếu từ nhà đi ra hướng đường Nguyễn Trãi là đang bước vào hướng Sinh Môn Cát"*.

---

## 3. Kỹ Thuật "Xuất Hành Nạp Khí" (Actionable Qi-Activation)

Để tính năng mang tính ứng dụng thực chiến cao, website cung cấp quy trình 3 bước **"Xuất Hành Nạp Khí"** (Kỹ thuật kinh điển của Kỳ Môn):

1. **Khởi Hành Đúng Giờ Cát:** Cất bước ra khỏi nhà đúng trong khung giờ Hoàng Đạo / Giờ Cát đã chọn.
2. **Kỹ Thuật Đi Đầu Hướng Cát (100 - 300 mét):**
* *Hướng dẫn User:* "Dù địa điểm họp của bạn nằm ở hướng Nam (Tử Môn), nhưng khi vừa bước ra khỏi cổng nhà, hãy **rẽ tay phải đi về hướng Đông (Sinh Môn) khoảng 200m** hoặc dừng lại ở hướng đó 3-5 phút để 'nạp khí cát'. Sau đó mới rẽ ngược lại đi đến điểm hẹn."


3. **Tâm Thế Nạp Năng Lượng:** Giữ tinh thần thoải mái, không cãi vã hay suy nghĩ tiêu cực trong 15 phút đầu tiên xuất hành.

---

## 4. Cấu Trúc Dữ Liệu JSON Cho API Phương Vị

```json
{
  "request_time": "2026-10-15T08:30:00+07:00",
  "user_location": {"lat": 10.7769, "lng": 106.7009},
  "qimen_chart": {
    "ju_number": "Dương Độn 8 Cục",
    "duty_star": "Thiên Khung",
    "duty_door": "Khai Môn"
  },
  "directions": [
    {
      "direction": "ĐÔNG_NAM",
      "degree_range": "112.5° - 157.5°",
      "door": "Sinh Môn",
      "star": "Thiên Ren",
      "deity": "Thái Âm",
      "special_deity": ["Tài Thần"],
      "score": 92,
      "status": "THƯỢNG_CÁT",
      "color_hex": "#10B981",
      "best_for": ["Cầu tài", "Giao dịch tài chính", "Ký hợp đồng"],
      "action_guide": "Ra khỏi nhà rẽ hướng Đông Nam, đi thẳng 200m trước khi di chuyển đến điểm hẹn."
    },
    {
      "direction": "TÂY",
      "degree_range": "247.5° - 292.5°",
      "door": "Tử Môn",
      "star": "Thiên Nhuế",
      "deity": "Cửu Địa",
      "special_deity": [],
      "score": 25,
      "status": "ĐẠI_HUNG",
      "color_hex": "#EF4444",
      "best_for": ["Tránh xuất hành việc lớn"],
      "warnings": ["Dễ gặp bế tắc, trì hoãn công việc", "Thương thảo dễ thất bại"]
    }
  ]
}

```

---

## 5. Tích Hợp Kỹ Thuật Lập Trình Web (Tech Stack Guide)

1. **Lấy Hướng Điện Thoại (Device Compass):**
```javascript
window.addEventListener('deviceorientation', function(event) {
    // event.alpha: Trục xoay 0 - 360 độ so với hướng Bắc thực tế
    let heading = event.alpha; 
    rotateCompassNeedle(heading);
});

```


2. **GPS / Map Overlay:** Dùng `Leaflet.js` (miễn phí, nhẹ) hoặc `Mapbox GL JS` để vẽ 8 Sector Polygons (hình quạt 45 độ) đè lên bản đồ vị trí thực của người dùng.

---