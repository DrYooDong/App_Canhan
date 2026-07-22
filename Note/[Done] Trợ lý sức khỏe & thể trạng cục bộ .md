Hệ thống **Trợ lý Sức khỏe & Thể trạng Cục bộ (Daily Health Tracker)** là một tính năng cực kỳ thực tế và hấp dẫn. Thay vì đưa ra những lời khuyên y tế chung chung, hệ thống này sẽ dùng thuật toán để "bắt mạch" người dùng mỗi ngày thông qua sự di chuyển của các sao trên lá số Tử Vi, chỉ đích danh bộ phận nào trên cơ thể dễ bị tổn thương, suy nhược hay gặp rủi ro.

Dưới đây là kế hoạch chi tiết để lập trình tính năng này:

### BƯỚC 1: THIẾT LẬP "BỘ TỪ ĐIỂN CƠ THỂ & BỆNH LÝ" (DATABASE MAPPING)
Hệ thống Database của bạn cần được mã hóa để gán mỗi vì sao với một bộ phận cơ thể và một loại bệnh lý đặc thù. Dựa trên y lý của Tử Vi, cấu trúc Database sẽ được phân chia như sau:

**1. Vùng Đầu, Mặt & Các Giác quan:**
*   **Thiên Khôi:** Đại diện cho vùng Đầu,. (Nếu hệ thống quét thấy Thiên Khôi đi kèm Thiên Hình/Kình Dương -> Cảnh báo chấn thương đầu, va đập),.
*   **Thái Dương (Nhật) & Thái Âm (Nguyệt):** Lần lượt đại diện cho Mắt trái và Mắt phải,. (Nếu gặp Hóa Kỵ, Đà La, Kình Dương -> Cảnh báo mỏi mắt, đau mắt, hoặc thị lực kém),.
*   **Tuế Phá:** Đại diện cho Răng. Đi kèm Thiên Khốc, Thiên Hư -> Cảnh báo đau răng, hư răng,.
*   **Thiên Tướng:** Đại diện cho Khuôn mặt,. (Gặp Hình, Không Kiếp -> Dễ bị sẹo, thương tích ở mặt).
*   **Bộ 3 Tai-Mũi-Họng:** Phượng Các (Tai),, Long Trì (Mũi),, Phá Toái (Cuống họng),. (Gặp sát tinh -> Cảnh báo viêm họng, đau mũi, ù tai),,.
*   **Cự Môn:** Miệng, vòm họng,.
*   **Hóa Kỵ:** Lưỡi,. (Cảnh báo ngộ độc thực phẩm hoặc nhiệt miệng).

**2. Vùng Hệ Tiêu hóa & Nội tạng:**
*   **Thiên Đồng:** Quản lý toàn bộ hệ máy tiêu hóa (bao tử, ruột),. (Nếu gặp Khốc, Hư hoặc Đại/Tiểu Hao -> Cảnh báo tiêu chảy, khó tiêu, trúng thực. Nếu gặp Không Kiếp, Thiên Hình -> Cảnh báo viêm loét dạ dày, đau bao tử nặng).
*   **Tham Lang, Thiên Riêu:** Hệ tiêu hóa bị ảnh hưởng do thói quen sinh hoạt. (Gặp Đà La -> Cảnh báo bội thực do ăn uống quá độ).
*   **Thiên Cơ:** Bệnh về Gan, Mật hoặc tê thấp, ngoài da,.

**3. Vùng Hệ Cơ, Xương Khớp & Máu Huyết:**
*   **Bạch Hổ:** Chủ về xương cốt và máu huyết,. (Quét thấy Bạch Hổ đi kèm sát tinh -> Cảnh báo hoại huyết, áp huyết cao, nhức mỏi xương khớp),.
*   **Thiên Mã:** Đại diện cho Chân tay. (Nếu ngộ Đà La, Tuần, Triệt -> Cảnh báo rủi ro té ngã, tai nạn xe cộ thương tích tay chân),.
*   **Đế Vượng:** Vùng Lưng,,. (Gặp Không, Kiếp -> Cảnh báo cẩn thận sai khớp lưng, đau cột sống).
*   **Thiên Hình:** Biểu tượng của Da,. Dễ trầy xước, dị ứng.

**4. Vùng Sinh dục & Phụ khoa (Đặc biệt cho User Nữ):**
*   **Thai, Mộc Dục:** Đại diện cho tử cung, âm hộ. (Nếu gặp sát tinh -> Cảnh báo viêm nhiễm phụ khoa hoặc nguy cơ cho thai kỳ).
*   **Tham Lang, Đào Hoa, Hồng Loan, Thiên Riêu:** Cảnh báo bệnh lây qua đường tình dục, phong tình,,.

**5. Sức khỏe Tinh thần & Đề kháng:**
*   **Bệnh Phù:** Người mỏi mệt, suy nhược, dễ cảm lạnh, sổ mũi, nhức đầu.
*   **Tang Môn, Thiên Khốc:** U buồn, ủy mị, suy nhược thần kinh do âu lo,.

### BƯỚC 2: THUẬT TOÁN ĐỊNH VỊ VÀ XỬ LÝ (CORE LOGIC)
Hệ thống sẽ chạy cronjob mỗi ngày lúc 00:00 để quét lá số của từng user theo trình tự sau:

*   **Định vị Cung Nhật Hạn (Vận hạn trong ngày):** Tính toán xem ngày hôm nay (Âm lịch) của user đang rơi vào cung nào trên lá số.
*   **Quét Sao (Star Scanning):** Hệ thống bắt đầu quét các sao đang tọa thủ hoặc chiếu vào cung Nhật Hạn đó, đặc biệt ưu tiên quét chùm sao ở cung Tật Ách của người dùng.
*   **Phân tích Cấu trúc (Pattern Matching):** Đối chiếu các sao xuất hiện với Database ở Bước 1. Thuật toán cần đủ thông minh để đọc được "combo sao". Ví dụ: Quét thấy `Thái Dương` + `Hóa Kỵ` đồng cung -> Trigger kịch bản "Bệnh về mắt". Quét thấy `Thiên Cơ` + `Kình Dương` -> Trigger kịch bản "Đau nhức gân cốt tay chân".

### BƯỚC 3: XUẤT THÔNG BÁO VÀ GỢI Ý CÁ NHÂN HÓA (OUTPUT & UX)
Dựa trên kết quả quét, giao diện ứng dụng/website sẽ xuất ra một Bảng Điều Khiển Sức Khỏe (Health Dashboard) cho ngày hôm nay.

**1. Cảnh báo tình trạng cơ thể:**
*   *Giao diện:* Một hình nhân (Avatar) 3D hoặc 2D. Vùng cơ thể nào bị sao xấu chiếu sẽ sáng đèn đỏ. 
*   *Thông báo xuất ra:* "Hôm nay cung ngày của bạn gặp Thiên Khôi và Kình Dương. Hãy đặc biệt bảo vệ vùng **Đầu**, tránh va đập mạnh khi làm việc hay chơi thể thao nhé." hoặc "Thiên Đồng ngộ Tiểu Hao xuất hiện, hệ tiêu hóa hôm nay rất nhạy cảm. Cẩn thận nguy cơ đau bụng, trúng thực, tránh ăn hàng quán vỉa hè".

**2. Đo lường Sức khỏe Tinh thần (Mental Health Thermometer):**
*   Nếu hệ thống quét thấy Tang Môn, Thiên Khốc, hoặc Bệnh Phù,,: "Trạng thái thể lực hôm nay ở mức [Thấp]. Năng lượng vũ trụ khiến bạn dễ cảm thấy uể oải, suy nhược và đa sầu đa cảm. Đừng ép bản thân làm việc quá sức, hãy đi ngủ sớm."

**3. Đề xuất "Lịch Khám Chữa Bệnh" tự động:**
*   Hệ thống không chỉ dọa bệnh mà còn tìm cách chữa. Thuật toán sẽ quét trên 12 khung giờ trong ngày để tìm các sao cứu giải: **Thiên Y (sao thuốc men, bác sĩ), Bác Sĩ, Thiên Giải, Địa Giải, Giải Thần, Ân Quang, Thiên Quý**,,.
*   *Thông báo xuất ra:* "Nếu dạo này bạn đang thấy mệt mỏi, hôm nay là ngày tuyệt vời để đi khám bệnh. Cung hạn lúc 9h-11h sáng (giờ Tỵ) có sự hội tụ của sao **Thiên Y và Ân Quang**, báo hiệu bạn sẽ gặp được bác sĩ giỏi, kê đúng thuốc, mau lành bệnh",.

**4. Ứng dụng Thực dưỡng (Dựa trên Ngũ Hành):**
*   Phân tích hành của ngày so với Bản Mệnh. Nếu ngày khắc Mệnh (VD: Ngày Hỏa khắc Mệnh Kim) dẫn đến Phế (Hệ hô hấp) dễ suy yếu,.
*   *Đề xuất chế độ ăn tự động:* "Hôm nay Hỏa khí vượng đè nén Kim mệnh của bạn, dễ gây khô háo, ho khan. Hãy bổ sung thực phẩm có vị ngọt (thuộc Thổ) để bồi bổ tỳ vị, tạo năng lượng tương sinh bảo vệ phổi."

Với tính năng này, website của bạn sẽ hoạt động giống như một bác sĩ gia đình kết hợp thuật chiêm tinh, mang lại giá trị nhắc nhở thiết thực mỗi buổi sáng khiến người dùng luôn muốn truy cập để kiểm tra cơ thể mình.