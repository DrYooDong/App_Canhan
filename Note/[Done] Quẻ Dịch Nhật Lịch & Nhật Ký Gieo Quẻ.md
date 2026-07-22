Tính năng **Quẻ Dịch Nhật Lịch & Nhật Ký Gieo Quẻ (Daily I Ching & Event Journaling)** là sự kết hợp hoàn hảo giữa **Tử Vi** (khung vận hạn vĩ mô) và **Kinh Dịch** (công cụ dự báo vi mô theo thời điểm).

Tử Vi cho bạn biết *“Hôm nay Cung Quan Lộc có Lưu Hóa Kị - dễ xảy ra trục trặc”*, nhưng Kinh Dịch sẽ trả lời cho câu hỏi hành động cụ thể: *“Tôi có nên nộp bản đề xuất dự án này cho Sếp vào 10 giờ sáng nay không?”*.

Dưới đây là thiết kế chi tiết về **Logic thuật toán, Phương pháp gieo quẻ, Hệ thống nhật ký nghiệm lý và Cấu trúc dữ liệu JSON** cho tính năng này.

---

## 1. Thuật Toán Lập "Quẻ Chủ Cho Ngày" (Daily Master Hexagram)

Mỗi ngày, hệ thống sẽ tự động tính toán 1 Quẻ Dịch đại diện cho từ trường năng lượng chung của ngày hôm đó dành cho người dùng, sử dụng phương pháp **Mai Hoa Dịch Số**.

### A. Quy Trình Tính Quẻ Mai Hoa Theo Lịch Âm:

Một quẻ Dịch gồm 6 hào (Lục hào), được ghép từ 2 Quẻ Đơn (Bát Quái: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8):

1. **Thượng Quẻ (Quẻ Trên):**

$$\text{Thượng Quẻ} = (\text{Năm} + \text{Tháng Âm} + \text{Ngày Âm}) \pmod 8$$



*(Nếu số dư bằng $0$, lấy Quẻ Khôn - số 8).*
2. **Hạ Quẻ (Quẻ Dưới):**

$$\text{Hạ Quẻ} = (\text{Năm} + \text{Tháng Âm} + \text{Ngày Âm} + \text{Giờ Tý [=1]}) \pmod 8$$



*(Lấy mốc Giờ Tý đầu ngày để cố định Quẻ Chủ Ngày).*
3. **Hào Động (Xác định sự biến đổi trong ngày):**

$$\text{Hào Động} = (\text{Năm} + \text{Tháng Âm} + \text{Ngày Âm} + \text{Giờ Tý}) \pmod 6$$



*(Số dư $1$ đến $6$ tương ứng từ Hào Sơ đến Hào Thượng).*

### B. Giải Mã Năng Lượng Quẻ Chủ Ngày:

* **Xác định Thể - Dụng:** Quẻ chứa Hào Động là quẻ **Dụng** (biến đổi), quẻ không chứa Hào Động là quẻ **Thể** (chủ thể/bản thân).
* **Đánh giá Tương Khắc Ngũ Hành:**
* **Dụng sinh Thể:** Ngày cực kỳ may mắn, mọi việc trôi chảy.
* **Thể sinh Dụng:** Ngày hao tổn năng lượng, làm nhiều hưởng ít.
* **Thể khắc Dụng:** Ngày phải nỗ lực, tranh đấu mới đạt kết quả.
* **Dụng khắc Thể:** Ngày nhiều áp lực, trở ngại, nên cẩn trọng.
* **Thể Dụng Tỉ Hòa (cùng hành):** Ngày bình hòa, hợp tác tốt.



---

## 2. Trợ Lý Gieo Quẻ Sự Việc Tức Thời (On-demand Event Casting)

Khi người dùng đứng trước một quyết định đột xuất trong ngày, tính năng này cho phép gieo quẻ hỏi việc ngay lập tức.

### 3 Phương Thức Gieo Quẻ Trực Quan:

1. **Gieo Đồng Xu 3D (3-Coin Toss Simulation):**
* Giả lập tung 3 đồng xu âm dương 6 lần.
* *Quy tắc:* 3 Ngửa (Lao Dương - Hào Động), 3 Sấp (Lao Âm - Hào Động), 2 Ngửa 1 Sấp (Thiếu Dương), 2 Sấp 1 Ngửa (Thiếu Âm).


2. **Mai Hoa Theo Thời Điểm Thực (Instant Time Casting):**
* Lấy chính xác `Giờ : Phút : Giây` tại khoảnh khắc User bấm nút "Gieo Quẻ" để lập quẻ tức thì.


3. **Chỉ Định Số Ngẫu Nhiên (Intuitive Numbers):**
* Cho phép người dùng nhập 3 con số bất kỳ nảy ra trong đầu (Ví dụ: 358) $\rightarrow$ Hệ thống chuyển thành Quẻ Thượng, Quẻ Hạ và Hào Động.



---

## 3. Nhật Ký Gieo Quẻ & Hệ Thống Nghiệm Lý (Event Journaling & Backtesting)

Điểm khác biệt của web cá nhân là khả năng **lưu trữ và đối chiếu kết quả thực tế** để đánh giá độ ứng nghiệm.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SỔ TAY KINH DỊCH & NHẬT KÝ CHIÊM NGHIỆM                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  📅 Ngày gieo: 15/10/2026 - 10:15 Sáng                                      │
│  ❓ Câu hỏi: "Có nên xuống tiền đầu tư lô đất ở Nhơn Trạch hôm nay?"        │
│  ☯ Quẻ gieo được: THỦY LÔI TRUÂN (Quẻ Biến: THỦY ĐỊA TỶ)                    │
│  💡 Luận giải ngắn: "Truân" là gian nan khởi đầu, bế tắc, chưa nên vội.      │
│  ─────────────────────────────────────────────────────────                  │
│  📝 CẬP NHẬT THỰC TẾ (Viết sau 3 ngày):                                      │
│  "Đã hoãn không đặt cọc. Hôm sau phát hiện quy hoạch khu đó đang bị treo.    │
│   Quẻ ứng nghiệm 100%!"                                                       │
│  ⭐ Đánh giá độ chính xác: [★★★★★] (5/5)                                     │
└──────────────────────────────────────────────────────────────────────────────┘

```

### Các Tính Năng Nhật Ký Thông Minh:

* **Tự Động Gắn Bối Cảnh Tử Vi:** Khi lưu nhật ký gieo quẻ, hệ thống tự động ghi lại trạng thái Sao Lưu Tử Vi của ngày hôm đó (để sau này phân tích: *Vào ngày có Lưu Hóa Kị, quẻ gieo ra thường báo điềm gì?*).
* **Vòng Lặp Nhắc Nhở Kiểm Chứng (AI Retrospective Reminder):** Sau 1 ngày, 3 ngày, hoặc 1 tuần, web gửi notification hỏi: *"Sự việc bạn hỏi quẻ ngày 15/10 đã có kết quả chưa? Hãy cập nhật nhật ký nhé!"*.
* **Bộ Lọc Sổ Tay Quẻ Dịch:** Cho phép tìm kiếm lại các quẻ cũ theo chủ đề: `#tài_chính`, `#tình_cảm`, `#công_việc`, `#sức_khỏe`.

---

## 4. Cấu Trúc Dữ Liệu JSON (I Ching Engine Schema)

```json
{
  "record_id": "hex_20261015_001",
  "created_at": "2026-10-15T10:15:00+07:00",
  "question": "Có nên ký hợp đồng hợp tác với công ty X hôm nay?",
  "category": "WORK_BUSINESS",
  "casting_method": "MAI_HOA_TIME",
  "hexagram_result": {
    "primary_hexagram": {
      "id": 14,
      "name": "Hỏa Thiên Đại Hữu",
      "upper_trigram": "Li (Hỏa)",
      "lower_trigram": "Qian (Thiên)"
    },
    "moving_line": 3,
    "transformed_hexagram": {
      "id": 38,
      "name": "Hỏa Trạch Khuê",
      "upper_trigram": "Li (Hỏa)",
      "lower_trigram": "Dui (Đoài)"
    },
    "element_analysis": {
      "ti_element": "Kim",
      "dung_element": "Hỏa",
      "relation": "Dụng khắc Thể (Trở ngại, hao tổn)"
    }
  },
  "astrology_context": {
    "lunar_date": "2026-09-05",
    "can_chi_day": "Mậu Dần",
    "tu_vi_transit_warning": "Lưu Hóa Kị tại Cung Quan Lộc"
  },
  "user_journal": {
    "outcome_notes": "Đối tác đòi thay đổi điều khoản thanh toán phút chót, đàm phán thất bại đúng như quẻ Khuê (bất đồng).",
    "accuracy_rating": 5,
    "verified_at": "2026-10-16T18:00:00+07:00"
  }
}

```

---

## 5. Thiết Kế UI/UX Màn Hình Lịch & Quẻ Dịch

1. **Thẻ Widget Quẻ Ngày (Daily Hexagram Card):**
* Nằm ngay góc trên cùng của giao diện Lịch Ngày.
* Hiển thị hình vẽ 6 hào âm dương linh hoạt, tên Quẻ Chủ Ngày và 1 dòng lời khuyên cốt lõi (Ví dụ: *Quẻ Lôi Thiên Đại Tráng - Tinh thần hăng hái, nhưng tránh nóng nảy hấp vội*).


2. **Nút "Gieo Quẻ Hỏi Việc" (Quick Cast Button):**
* Đặt ở dạng Floating Action Button (FAB) luôn nổi ở góc màn hình di động.
* Nhấp vào sẽ mở Modal giả lập gieo quẻ đẹp mắt với hiệu ứng âm thanh tung đồng xu sống động.


3. **Thống Kê Tỷ Lệ Ứng Nghiệm (Accuracy Dashboard):**
* Biểu đồ hình tròn thể hiện tổng số quẻ đã gieo, tỷ lệ % các quẻ ứng nghiệm đúng thực tế, giúp bạn đo lường sự "kết nối tâm linh/trực giác" của bản thân theo thời gian.



---