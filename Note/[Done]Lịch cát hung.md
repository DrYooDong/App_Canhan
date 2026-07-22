Để xây dựng thuật toán cho tính năng **"Lịch Cát Hung Cá Nhân Hóa"**, chúng ta cần số hóa chính xác các quy tắc tính hạn và quy luật sinh khắc của Tử Vi thành bộ công thức logic (logic formulas) có thể lập trình được.

Dưới đây là bộ công thức tính toán chi tiết từng bước cho hệ thống của bạn, dựa trên các nền tảng Tử Vi cổ điển và các phương pháp lưu hạn:

### BƯỚC 1: CÔNG THỨC ĐỊNH VỊ CUNG VẬN HẠN (TÌM NHẬT HẠN & THỜI HẠN)
Đây là thuật toán cốt lõi nhất để hệ thống tự động dò tìm vị trí ngày và giờ hiện tại trên lá số của người dùng. Hệ thống bắt buộc phải tính theo quy trình *Top-Down* (Năm -> Tháng -> Ngày -> Giờ).

**1. Công thức tìm cung Tiểu Hạn (Năm):**
Hệ thống lấy Địa Chi của năm sinh để xác định cung khởi điểm của Tiểu hạn,,:
*   Tuổi Dần, Ngọ, Tuất: Khởi tại cung Thìn,.
*   Tuổi Thân, Tý, Thìn: Khởi tại cung Tuất,.
*   Tuổi Tỵ, Dậu, Sửu: Khởi tại cung Mùi,.
*   Tuổi Hợi, Mão, Mùi: Khởi tại cung Sửu,.
*   *Bước lặp:* Người Nam an theo chiều thuận, người Nữ an theo chiều nghịch,. Hệ thống đếm mỗi cung là một tuổi cho đến năm hiện tại để chốt cung Tiểu Hạn.

**2. Công thức tìm cung Nguyệt Hạn (Tháng):**
*   Lấy cung Tiểu Hạn vừa tìm được, hệ thống gán biến số là "Tháng 1" (Tháng Giêng).
*   Từ cung đó, đếm **nghịch** đến tháng sinh của người dùng,.
*   Dừng ở cung nào, gán cung đó là "Giờ Tý", tiếp tục đếm **thuận** đến giờ sinh của người dùng,.
*   Dừng ở cung cuối cùng, đó chính là vị trí thực sự của **Tháng Giêng** trong năm nay,. Hệ thống đếm thuận mỗi cung một tháng để ra cung tháng cần xem.

**3. Công thức tìm cung Nhật Hạn (Ngày):**
*   Lấy cung Nguyệt Hạn của tháng hiện tại, gán biến số là "Mùng 1",,,.
*   Đếm **thuận** mỗi cung là một ngày cho tới ngày Âm lịch hôm nay,,,. Cung dừng lại chính là cung vận hạn của ngày (Nhật Hạn).

**4. Công thức tìm cung Thời Hạn (Giờ):**
*   Lấy cung Nhật Hạn vừa tìm, gán biến số là "Giờ Tý",.
*   Đếm **thuận** mỗi cung là một giờ (Tý, Sửu, Dần...) cho đến khung giờ hiện tại,. Hệ thống xác định đây là cung vận hạn của giờ.

---

### BƯỚC 2: CÔNG THỨC CHẤM ĐIỂM NGŨ HÀNH & CAN CHI (SỰ GIAO THOA CÁ NHÂN)
Hệ thống trích xuất dữ liệu Can, Chi, Ngũ Hành của ngày hiện hành để đối chiếu với Bản Mệnh của người dùng.

**1. Công thức Sinh Khắc Thiên Can - Địa Chi ngày (Hệ số Ngày):**
Theo quy tắc phối hợp tương tác Trời Đất, hệ thống chấm điểm ngày như sau:
*   **Đại Cát (Bảo nhật):** Can ngày sinh Chi ngày (+ Điểm cao).
*   **Tiểu Cát (Thoa nhật):** Chi ngày sinh Can ngày (+ Điểm vừa).
*   **Tiểu Hung (Chế nhật):** Chi ngày khắc Can ngày (- Điểm).
*   **Đại Hung (Phạt nhật):** Can ngày khắc Chi ngày (- Điểm nặng).
*   **Bát chuyên:** Đồng khí đồng hành (Bình hòa).

**2. Công thức Lục Xung Can Chi (User vs Ngày):**
Hệ thống tự động so sánh Chi của năm sinh với Chi của ngày hiện tại. Trừ điểm nặng và xuất cảnh báo nếu rơi vào tứ hành xung, đặc biệt là các cặp xung trực diện: Tý xung Ngọ, Sửu xung Mùi, Dần xung Thân, Mão xung Dậu, Thìn xung Tuất, Tỵ xung Hợi,.

---

### BƯỚC 3: CÔNG THỨC LỌC KỴ CHUNG VŨ TRỤ
Dù chỉ số cá nhân cao, hệ thống bắt buộc phải tích hợp màng lọc chặn các ngày/giờ đại hung chung của Lịch Pháp:

*   **Lọc ngày xấu:** Trừ điểm kịch khung nếu rơi vào các ngày Tam nương (mùng 3, 7, 13, 18, 22, 27), hoặc Tam cường (mùng 8, 18, 28).
*   **Lọc giờ xấu:** Khóa các khung giờ phạm Không Vong và Sát Chủ tính theo Thiên Can của ngày:
    *   Ngày Giáp, Kỷ: Khóa khung giờ Thân, Dậu (Không Vong) và giờ Ngọ (Sát Chủ).
    *   Ngày Ất, Canh: Khóa khung giờ Ngọ, Mùi (Không Vong) và giờ Thìn (Sát Chủ).
    *   Ngày Bính, Tân: Khóa khung giờ Dần, Mão (Không Vong) và giờ Hợi (Sát Chủ).

---

### BƯỚC 4: CÔNG THỨC QUÉT TINH DIỆU & CHẤM ĐIỂM (MODULE QUYẾT ĐỊNH)
Hệ thống đọc dữ liệu của Cung Nhật Hạn (tính ở Bước 1) và phân loại các sao đang đóng tại đó:

*   **Các sao kích hoạt (Sao Lưu):** Kiểm tra sự có mặt của Lưu Thái Tuế, Lưu Lộc Tồn, Lưu Thiên Mã, Lưu Bạch Hổ, Lưu Tang Môn, Lưu Khốc Hư. Sự xuất hiện của các sao này báo hiệu ngày hôm nay có sự kiện phát sinh mạnh.
*   **Biến số Cộng Điểm (+):** Cung Nhật hạn có Cát tinh như Tả Phù, Hữu Bật, Thiên Khôi, Thiên Việt, Văn Xương, Văn Khúc, Ân Quang, Thiên Quý, Lộc Tồn, Hóa Lộc, Hóa Quyền, Hóa Khoa.
*   **Biến số Trừ Điểm (-):** Cung Nhật hạn ngộ Sát Hung tinh như Địa Không, Địa Kiếp, Kình Dương, Đà La, Linh Tinh, Hỏa Tinh, hoặc bị Tuần - Triệt án ngữ cản trở.

### ĐẦU RA THUẬT TOÁN (OUTPUT GENERATION)
Sau khi chạy qua 4 bước trên, hệ thống tính tổng điểm và xuất dữ liệu thông báo cho người dùng (Notification):
*   `Nếu Score < 30`: Cảnh báo đỏ. "Hôm nay cung Nhật hạn rơi vào Hung tinh / Phạm ngày Tam Nương / Chi ngày xung Chi tuổi. Đại kỵ đầu tư, xuất hành. Cẩn trọng khung giờ (Giờ Không Vong)."
*   `Nếu 30 <= Score < 70`: Cảnh báo vàng. "Ngày bình hòa. Các việc thường nhật diễn ra bình thường."
*   `Nếu Score >= 70`: Thông báo xanh. "Ngày Đại Cát! Cung Nhật hạn hội tụ Cát tinh / Ngày Bảo Nhật. Rất thích hợp để tiến hành việc quan trọng. Khung giờ hoàng đạo của riêng bạn là (Các giờ Thời Hạn có Cát tinh)."