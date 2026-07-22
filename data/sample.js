// ============================================
// NỘI TÂM — Dữ liệu mẫu
// Bài học, Quy luật, Lời nhắc, Nhật ký
// ============================================

const SAMPLE_LESSONS = [
  {
    id: 'l1',
    title: 'Kiên nhẫn là vũ khí của kẻ mạnh',
    content: 'Trong mọi tình huống, kiên nhẫn luôn mang lại kết quả tốt hơn sự vội vàng. Khi bạn cảm thấy muốn bỏ cuộc, hãy nhớ rằng "Hỏa nung Kim" — lửa tôi luyện vàng. Mọi áp lực đều đang rèn giũa bạn thành phiên bản tốt hơn.',
    tags: ['kiên-nhẫn', 'kỷ-luật', 'vượt-khó'],
    relatedStrength: 'vượt-khó',
    relatedWeakness: 'thiếu-kiên-định',
    createdAt: '2026-07-01T08:00:00',
    source: 'Trải nghiệm cá nhân'
  },
  {
    id: 'l2',
    title: 'Nhu thắng cương trong mọi cuộc tranh luận',
    content: 'Không bao giờ cố thắng bằng sự áp đặt. Hãy lắng nghe, thấu hiểu, rồi trình bày quan điểm bằng sự chân thành. Người ta sẽ tự nguyện đồng ý với bạn khi họ cảm nhận được sự tôn trọng. Đây chính là quyền lực mềm — thứ vũ khí mạnh nhất mà bạn sở hữu.',
    tags: ['giao-tiếp', 'nhu-thắng-cương', 'quyền-lực-mềm'],
    relatedStrength: 'ngoại-giao-tuyệt-đỉnh',
    relatedWeakness: '',
    createdAt: '2026-07-05T10:30:00',
    source: 'Đọc sách'
  },
  {
    id: 'l3',
    title: 'Quyết định nhanh, hành động ngay',
    content: 'Nhận ra rằng sự phân vân kéo dài chỉ tiêu hao năng lượng mà không tạo ra giá trị. Đặt deadline cho mọi quyết định: 10 phút cho việc nhỏ, 1 ngày cho việc trung bình, 1 tuần cho việc lớn. Sau deadline, chọn phương án tốt nhất có thể và hành động ngay.',
    tags: ['quyết-đoán', 'hành-động', 'kỷ-luật'],
    relatedStrength: '',
    relatedWeakness: 'bất-quyết',
    createdAt: '2026-07-10T14:00:00',
    source: 'Tự phản tư'
  },
  {
    id: 'l4',
    title: 'Giá trị của sự im lặng',
    content: 'Không phải lúc nào cũng cần nói. Đôi khi, sự im lặng mang nhiều sức mạnh hơn ngàn lời. Im lặng để quan sát, để hiểu, để tìm thời cơ đúng đắn. Thiên Cơ và Thiên Lương trong lá số nhắc nhở: mưu trí nằm ở sự chờ đợi đúng lúc.',
    tags: ['im-lặng', 'quan-sát', 'mưu-trí'],
    relatedStrength: 'chiến-lược-gia',
    relatedWeakness: '',
    createdAt: '2026-07-12T09:15:00',
    source: 'Sách "Nghệ thuật chiến tranh"'
  },
  {
    id: 'l5',
    title: 'Dòng họ là gốc rễ',
    content: 'Mỗi khi cảm thấy lạc lõng, hãy nhớ về gia đình. Thân cư Phúc Đức — cuộc đời bạn gắn liền với dòng tộc. Chăm lo cho tổ tiên, mồ mả không phải là mê tín, mà là cách bạn kết nối với gốc rễ, tìm lại sự bình yên và sức mạnh nội tâm.',
    tags: ['gia-đình', 'dòng-họ', 'tâm-linh'],
    relatedStrength: 'phúc-lộc',
    relatedWeakness: 'mất-phương-hướng',
    createdAt: '2026-07-14T16:00:00',
    source: 'Tử Vi cá nhân'
  }
];

const SAMPLE_RULES = [
  {
    id: 'r1',
    title: 'Quy luật Reciprocity — Có đi có lại',
    content: 'Con người luôn cảm thấy "nợ" khi nhận được điều gì đó. Hãy cho đi trước — kiến thức, sự giúp đỡ, sự tôn trọng — và bạn sẽ nhận lại gấp bội. Đây là nguyên tắc mạnh nhất trong xây dựng quan hệ.',
    category: 'quan-hệ',
    tags: ['quan-hệ', 'cho-đi', 'tâm-lý-học'],
    createdAt: '2026-07-02T08:00:00',
    source: 'Robert Cialdini — Influence'
  },
  {
    id: 'r2',
    title: 'Quy luật 80/20 trong Công việc',
    content: '80% kết quả đến từ 20% nỗ lực quan trọng nhất. Xác định đâu là 20% công việc tạo ra giá trị lớn nhất và tập trung tối đa vào đó. Phần còn lại có thể ủy thác hoặc đơn giản hóa.',
    category: 'công-việc',
    tags: ['công-việc', 'hiệu-suất', 'pareto'],
    createdAt: '2026-07-03T10:00:00',
    source: 'Richard Koch — The 80/20 Principle'
  },
  {
    id: 'r3',
    title: 'Quyền lực đến từ vị trí, không phải lời nói',
    content: 'Đừng đòi hỏi sự tôn trọng bằng lời. Hãy xây dựng giá trị bản thân, tích lũy uy tín qua hành động. Khi bạn đã ở vị trí đủ cao, lời nói của bạn tự nhiên có trọng lượng. Đây chính là "quyền lực mềm" mà lá số bạn đề cập.',
    category: 'quyền-lực',
    tags: ['quyền-lực', 'uy-tín', 'vị-trí'],
    createdAt: '2026-07-06T14:30:00',
    source: 'Tự chiêm nghiệm'
  },
  {
    id: 'r4',
    title: 'Cảm xúc là kẻ phá hoại quyết định',
    content: 'Không bao giờ đưa ra quyết định quan trọng khi đang tức giận, phấn khích quá mức hoặc chán nản. Đợi 24 giờ. Nếu sau 24 giờ vẫn nghĩ giống, thì đó là quyết định đúng.',
    category: 'cảm-xúc',
    tags: ['cảm-xúc', 'quyết-định', 'kỷ-luật'],
    createdAt: '2026-07-08T09:00:00',
    source: 'Stoicism — Marcus Aurelius'
  },
  {
    id: 'r5',
    title: 'Kỷ luật thắng động lực',
    content: 'Động lực đến rồi đi, nhưng kỷ luật luôn ở đó. Hãy xây dựng hệ thống thói quen thay vì phụ thuộc vào cảm hứng. Mỗi ngày làm một ít, nhất quán, "tích tiểu thành đại" — đúng như quỹ đạo tài chính trong lá số.',
    category: 'kỷ-luật',
    tags: ['kỷ-luật', 'thói-quen', 'kiên-trì'],
    createdAt: '2026-07-09T07:30:00',
    source: 'James Clear — Atomic Habits'
  },
  {
    id: 'r_nguhanh_1',
    title: 'Quy luật Tương Sinh (Sự nuôi dưỡng, thúc đẩy)',
    content: `Tương sinh là quá trình hành này trợ giúp, nuôi dưỡng và thúc đẩy hành kia phát triển. Vòng tương sinh diễn ra liên tục:
• Mộc sinh Hỏa: Cây cối là vật liệu để đốt cháy, tạo ra lửa.
• Hỏa sinh Thổ: Lửa thiêu đốt vạn vật thành tro bụi tích tụ thành đất.
• Thổ sinh Kim: Trong đất đá ẩn chứa và kết tụ các quặng kim loại.
• Kim sinh Thủy: Kim loại khi bị nung chảy thành thể lỏng, hoặc lạnh làm ngưng tụ hơi nước.
• Thủy sinh Mộc: Nước cung cấp dưỡng chất nuôi cây cối sinh trưởng.

* Tính một chiều:
- Sinh nhập (Người nhận): Hành được sinh ra nhận lợi ích, trở nên mạnh mẽ và sung mãn hơn.
- Sinh xuất (Người cho): Hành đi sinh bị tiêu hao năng lượng, yếu đi (Mộc sinh Hỏa thì Hỏa vượng nhưng Mộc cháy rụi).`,
    category: 'ngũ-hành',
    tags: ['ngũ-hành', 'tương-sinh', 'sinh-nhập', 'sinh-xuất'],
    createdAt: '2026-07-22T10:00:00',
    source: 'Thuyết Ngũ Hành'
  },
  {
    id: 'r_nguhanh_2',
    title: 'Quy luật Tương Khắc (Sự ức chế, cản trở)',
    content: `Tương khắc là quá trình hành này kiểm soát, ức chế hoặc tiêu diệt hành kia để giữ thế quân bình vũ trụ:
• Kim khắc Mộc: Công cụ kim loại (dao, búa, cưa) có thể đốn hạ cây cối.
• Mộc khắc Thổ: Rễ cây cắm sâu vào đất, hút hết chất dinh dưỡng của đất.
• Thổ khắc Thủy: Đất đắp thành đê đập ngăn dòng chảy, đất hút cạn nước.
• Thủy khắc Hỏa: Nước dập tắt ngọn lửa.
• Hỏa khắc Kim: Lửa ở nhiệt độ cao nung chảy và phá hủy kim loại.

* Tính một chiều:
- Khắc xuất (Bên thắng): Hành đi khắc chiếm ưu thế, đàn áp đối phương.
- Khắc nhập (Bên thua): Hành bị khắc chịu thua thiệt, tổn thương và hao mòn.`,
    category: 'ngũ-hành',
    tags: ['ngũ-hành', 'tương-khắc', 'khắc-xuất', 'khắc-nhập'],
    createdAt: '2026-07-22T10:05:00',
    source: 'Thuyết Ngũ Hành'
  },
  {
    id: 'r_nguhanh_3',
    title: 'Quy luật Tỷ Hòa (Sự đồng hành)',
    content: `Tỷ hòa là khi hai hành giống nhau kết hợp với nhau (Kim gặp Kim, Mộc gặp Mộc...). Quy luật này có thể mang lại sức mạnh nhân đôi, nhưng cũng có thể mang lại sự triệt tiêu:
• Điểm tốt: "Lưỡng Mộc thành lâm" (hai cây hợp thành rừng), "Lưỡng Thổ thành sơn" (đất đắp thành núi), "Lưỡng Kim thành khí" (kim loại gom lại đúc thành binh khí).
• Điểm xấu: "Lưỡng Hỏa Hỏa tuyệt" (hai ngọn lửa tiêu diệt nhau), "Lưỡng Thủy Thủy kiệt" (hai luồng nước trái ngược làm cạn kiệt nhau).`,
    category: 'ngũ-hành',
    tags: ['ngũ-hành', 'tỷ-hòa', 'đồng-hành', 'sức-mạnh'],
    createdAt: '2026-07-22T10:10:00',
    source: 'Thuyết Ngũ Hành'
  },
  {
    id: 'r_nguhanh_4',
    title: 'Quy luật Tiêu Trưởng theo Thời tiết (Vượng - Tướng - Hưu - Tù - Tuyệt)',
    content: `Ngũ Hành thay đổi sức mạnh (tiêu trưởng) theo chu kỳ 4 mùa. Trạng thái mạnh nhất là Vượng, yếu nhất/hết năng lượng là Tuyệt:
• Mùa Xuân: Mộc Vượng (cây đâm chồi), Hỏa Tướng (ấm áp), Thủy Hưu (nghỉ ngơi), Kim Tù (bị nhốt), Thổ Tuyệt (hết dưỡng chất).
• Mùa Hạ: Hỏa Vượng (nắng nóng đỉnh điểm), Thổ Tướng, Mộc Hưu, Thủy Tù, Kim Tuyệt.
• Mùa Thu: Kim Vượng (cây rụng lá lộ gân cốt), Thủy Tướng, Thổ Hưu, Hỏa Tù, Mộc Tuyệt.
• Mùa Đông: Thủy Vượng (lạnh lẽo), Mộc Tướng, Kim Hưu, Thổ Tù, Hỏa Tuyệt.
• Tứ Quý (tháng cuối mỗi mùa): Thổ Vượng, Kim Tướng, Hỏa Hưu, Mộc Tù, Thủy Tuyệt.

* Ứng dụng: Người mệnh Mộc sinh mùa Thu (Kim vượng khắc Mộc) thường sinh ra chịu thiệt thòi, cơ thể dễ mang bệnh tật.`,
    category: 'ngũ-hành',
    tags: ['ngũ-hành', 'tiêu-trưởng', 'thời-tiết', 'vượng-tướng-hưu-tù-tuyệt'],
    createdAt: '2026-07-22T10:15:00',
    source: 'Thuyết Ngũ Hành'
  },
  {
    id: 'r_nguhanh_5',
    title: 'Ứng dụng quy luật Ngũ Hành vào đời sống và Tử Vi',
    content: `Quy luật Ngũ Hành cực kỳ biến ảo khi áp dụng vào thực tế luận đoán mệnh lý:
• Tương tác Môi trường & Bản mệnh: Cục sinh Mệnh là tốt nhất (hoàn cảnh ưu ái, dễ gặp may mắn). Cục khắc Mệnh là xấu nhất (bị đè nén, chèn ép). Mệnh khắc Cục thì vất vả nhưng cá nhân vẫn dùng năng lực chinh phục được hoàn cảnh.
• Tương tác Cung & Sao: Đất (Cung) tốt thì Cây (Sao) mới phát triển. Sao Mộc ở Cung Thủy (Thủy sinh Mộc) phát huy tối đa; Sao Kim ở Cung Hỏa thì năng lượng Sao bị thiêu rụi, báo hiệu hung họa.
• Sự phản biện của Ngũ Hành Nạp Âm: Không phải "Khắc" nào cũng xấu. Ví dụ: Kiếm Phong Kim hay Sa Trung Kim cần Hỏa nung đốt mới thành binh khí sắc bén hoặc vàng khối quý giá.`,
    category: 'ngũ-hành',
    tags: ['ngũ-hành', 'tử-vi', 'ứng-dụng', 'bản-mệnh', 'nạp-âm'],
    createdAt: '2026-07-22T10:20:00',
    source: 'Thuyết Ngũ Hành & Tử Vi'
  },
  {
    id: 'r_batquai_1',
    title: 'Quy luật Sinh Thành của Bát Quái (Nguồn gốc vũ trụ)',
    content: `Bát Quái đồ được hình thành dựa trên nguyên lý biến dịch không ngừng của vũ trụ. Quá trình sinh hóa vạn vật diễn ra theo cấu trúc phân lớp:
• Thái Cực sinh Lưỡng Nghi: Vũ trụ ban sơ (Thái Cực) phân chia năng lượng thành hai khí Âm và Dương.
• Lưỡng Nghi sinh Tứ Tượng: Âm Dương tương tác phân tách thành Thái Âm, Thiếu Âm, Thái Dương, Thiếu Dương.
• Tứ Tượng sinh Bát Quái: Sinh ra 8 quẻ cơ bản đại diện cho 8 hiện tượng tự nhiên: Càn (Trời), Khảm (Nước), Cấn (Núi), Chấn (Sấm), Tốn (Gió), Ly (Lửa), Khôn (Đất), Đoài (Đầm).
• 8 quẻ cơ sở giao thoa sinh ra 64 quẻ (trùng quái), đại diện cho sự biến hóa sinh diệt vô tận của vạn vật.`,
    category: 'bát-quái',
    tags: ['bát-quái', 'thái-cực', 'lưỡng-nghi', 'tứ-tượng', 'dịch-lý'],
    createdAt: '2026-07-22T11:00:00',
    source: 'Dịch Lý & Tử Vi'
  },
  {
    id: 'r_batquai_2',
    title: 'Quy luật phân bổ Phương hướng và Ngũ hành trên Địa Bàn',
    content: `Bát Quái được sắp xếp tương ứng với 12 cung Địa Chi để xác định tính lý Ngũ hành, màu sắc và phương hướng:
• Quái Khảm: Hành Thủy, màu Đen, cai quản phương Chính Bắc (cung Tý).
• Quái Cấn: Hành Mộc, màu Xanh, cai quản phương Đông Bắc thiên Đông (cung Dần).
• Quái Chấn: Hành Mộc, màu Xanh, cai quản phương Chính Đông (cung Mão).
• Quái Tốn: Hành Hỏa, màu Đỏ, cai quản phương Đông Nam thiên Nam (cung Tỵ).
• Quái Ly: Hành Hỏa, màu Đỏ, cai quản phương Chính Nam (cung Ngọ).
• Quái Khôn: Hành Kim, màu Trắng, cai quản phương Tây Nam thiên Tây (cung Thân).
• Quái Đoài: Hành Kim, màu Trắng, cai quản phương Chính Tây (cung Dậu).
• Quái Càn: Hành Thủy, màu Đen, cai quản phương Tây Bắc thiên Bắc (cung Hợi).`,
    category: 'bát-quái',
    tags: ['bát-quái', 'địa-bàn', 'phương-hướng', 'ngũ-hành', 'cung-vị'],
    createdAt: '2026-07-22T11:05:00',
    source: 'Dịch Lý & Tử Vi'
  },
  {
    id: 'r_batquai_3',
    title: 'Quy luật Động - Tĩnh và sự tương quan Xung / Hợp',
    content: `Bát Quái được chia thành các cặp năng lượng Động và Tĩnh xen kẽ nhau trên 12 cung Địa bàn:
• Tuất - Hợi - Tý: Quái Càn (Động) & Khảm (Tĩnh).
• Sửu - Dần - Mão: Quái Cấn (Tĩnh) & Chấn (Động).
• Thìn - Tỵ - Ngọ: Quái Tốn (Tĩnh) & Ly (Động).
• Mùi - Thân - Dậu: Quái Khôn (Tĩnh) & Đoài (Động).

* Quy tắc Tương tác:
- Tính trái ngược (Xung chiếu): Các cặp xung chiếu nghịch đảo năng lượng (Càn Động xung Tốn Tĩnh, Khảm Tĩnh xung Ly Động).
- Tính đồng dạng (Tương hợp): Quẻ cùng đặc tính hỗ trợ lẫn nhau (Chấn - Đoài hợp vì cùng Động; Khôn - Cấn hợp vì cùng Tĩnh).`,
    category: 'bát-quái',
    tags: ['bát-quái', 'động-tĩnh', 'xung-chiếu', 'tương-hợp'],
    createdAt: '2026-07-22T11:10:00',
    source: 'Dịch Lý & Tử Vi'
  },
  {
    id: 'r_batquai_4',
    title: 'Ứng dụng Bát Quái Tượng trong Hôn Nhân và Gia Đạo',
    content: `Bát Quái Tượng được ứng dụng xem xét mức độ hòa hợp trong hôn nhân. Nếu cung mệnh nam nữ tác hợp rơi vào thế tương khắc sẽ sinh điềm hung:
• Bát san Tuyệt mạng: Cung mệnh tác hợp rơi vào Càn, Ly, Đoài, Chấn, Cấn, Tốn tạo thế Âm khắc Dương, nguy cơ đứt gánh gia đạo.
• Bát san Ngũ quỷ (Giao chiến): Kết hợp các quái Càn, Chấn, Tốn, Khôn tạo thế Âm khắc Âm, chủ về hung kỵ, tai ách.
• Lục sát: Kết hợp các quái Càn, Khảm, Cấn, Chấn, Tốn, Đoài, Khôn, Ly sinh ra sự lục đục, bất hòa triền miên.

Bát Quái cung cấp cơ sở triết học vững chắc định vị 12 cung, xem thuộc tính sinh khắc và dự đoán nhân duyên con người.`,
    category: 'bát-quái',
    tags: ['bát-quái', 'bát-quái-tượng', 'hôn-nhân', 'gia-đạo', 'phong-thủy'],
    createdAt: '2026-07-22T11:15:00',
    source: 'Dịch Lý & Tử Vi'
  }
];

const SAMPLE_REMINDERS = [
  {
    id: 'rm1',
    title: 'Khi mất phương hướng',
    content: 'Hãy dừng lại. Hít thở. Nhớ lại: "Tôi là ai" — một người nhân hậu, trí tuệ, có phúc tinh Thiên Đồng che chở. Mọi khó khăn đều sẽ qua. Quý nhân luôn xuất hiện đúng lúc.',
    mood: 'mất-phương-hướng',
    tags: ['bình-tĩnh', 'thiên-đồng', 'quý-nhân'],
    createdAt: '2026-07-01T06:00:00'
  },
  {
    id: 'rm2',
    title: 'Khi muốn bỏ cuộc',
    content: '"Nước chảy đá mòn" — bạn không cần nhanh, bạn chỉ cần không dừng lại. Tiền vận gian truân chính là lửa tôi luyện. Hậu vận phú quý đang đợi bạn ở phía trước. 8/10 — lá số của bạn rất đẹp, đừng phí hoài nó.',
    mood: 'muốn-bỏ-cuộc',
    tags: ['kiên-trì', 'hậu-vận', 'lá-số-đẹp'],
    createdAt: '2026-07-02T06:00:00'
  },
  {
    id: 'rm3',
    title: 'Khi cảm thấy cô đơn',
    content: 'Bạn không bao giờ thực sự một mình. Thân cư Phúc Đức — dòng họ bạn luôn ở bên, dù hữu hình hay vô hình. Anh chị em Thiên Phủ — hòa thuận, đùm bọc. Phối ngẫu Cơ Lương — quân sư hậu phương. Bạn được bao bọc bởi tình yêu thương.',
    mood: 'cô-đơn',
    tags: ['gia-đình', 'tình-yêu', 'không-cô-đơn'],
    createdAt: '2026-07-03T06:00:00'
  },
  {
    id: 'rm4',
    title: 'Khi bị áp lực công việc',
    content: 'Nhớ rằng bạn là chiến lược gia, không phải chiến binh xung trận. Hãy lùi lại một bước, phân tích bình tĩnh. Thiên Cơ cho bạn mưu trí, Thiên Lương cho bạn sự ổn định. Dùng trí thay vì dùng sức.',
    mood: 'áp-lực',
    tags: ['công-việc', 'chiến-lược', 'bình-tĩnh'],
    createdAt: '2026-07-04T06:00:00'
  },
  {
    id: 'rm5',
    title: 'Khi dao động về quyết định',
    content: 'Tâm lý "bất quyết" là điểm yếu lớn nhất của bạn — NHƯNG bạn đã nhận ra nó. Và nhận ra là bước đầu tiên để vượt qua. Hãy đặt deadline, chọn phương án tốt nhất, rồi HÀNH ĐỘNG. Không có quyết định hoàn hảo, chỉ có quyết định đúng lúc.',
    mood: 'dao-động',
    tags: ['quyết-đoán', 'hành-động', 'vượt-qua-bất-quyết'],
    createdAt: '2026-07-05T06:00:00'
  },
  {
    id: 'rm6',
    title: 'Lời nhắc buổi sáng',
    content: '"Hãy cứ giữ vững tấm lòng thiện lương, dùng trí tuệ tham mưu để cống hiến, và kiên nhẫn bước qua những ngọn lửa thử thách." — Mỗi ngày mới là một cơ hội để trở thành phiên bản tốt hơn.',
    mood: 'hằng-ngày',
    tags: ['buổi-sáng', 'thiện-lương', 'kiên-nhẫn'],
    createdAt: '2026-07-06T06:00:00'
  }
];

const SAMPLE_JOURNALS = [
  {
    id: 'j1',
    title: 'Ngày đầu tiên sử dụng hệ thống',
    content: 'Hôm nay tôi bắt đầu xây dựng thư viện tri thức cá nhân. Đọc lại toàn bộ lá số Tử Vi, tôi thấy rất nhiều điều trùng khớp với cuộc sống hiện tại. Đặc biệt là phần "bất quyết" — đúng là tôi hay phân vân quá lâu trước các quyết định. Mục tiêu tuần này: rèn luyện quyết đoán hơn.',
    tags: ['khởi-đầu', 'tự-nhận-thức', 'mục-tiêu'],
    mood: '🤔',
    prompt: 'Bạn có nhận ra điểm yếu nào đang ảnh hưởng đến cuộc sống hàng ngày không?',
    createdAt: '2026-07-14T21:00:00'
  },
  {
    id: 'j2',
    title: 'Suy ngẫm về sự kiên nhẫn',
    content: 'Tuần này có một dự án bị trì hoãn và tôi suýt muốn bỏ. Nhưng rồi nhớ lại "Hỏa nung Kim" — áp lực là để tôi luyện. Tôi quyết định tiếp tục, chia nhỏ công việc thành từng bước. Kết quả: hoàn thành 70% và cảm thấy tự hào.',
    tags: ['kiên-nhẫn', 'dự-án', 'vượt-khó'],
    mood: '💪',
    prompt: 'Khi gặp khó khăn, bạn thường phản ứng thế nào? Có giống với mô tả trong Tử Vi không?',
    createdAt: '2026-07-13T22:30:00'
  }
];

const MOOD_OPTIONS = [
  { value: 'mất-phương-hướng', label: '😶‍🌫️ Mất phương hướng', color: '#6a6878' },
  { value: 'muốn-bỏ-cuộc', label: '😩 Muốn bỏ cuộc', color: '#c45a5a' },
  { value: 'cô-đơn', label: '🥀 Cô đơn', color: '#7a5ac4' },
  { value: 'áp-lực', label: '😤 Áp lực', color: '#c4a95a' },
  { value: 'dao-động', label: '🌊 Dao động', color: '#5a8fc4' },
  { value: 'hằng-ngày', label: '☀️ Hằng ngày', color: '#c9a96e' },
  { value: 'tích-cực', label: '✨ Tích cực', color: '#5bc47a' }
];

const RULE_CATEGORIES = [
  { value: 'quan-hệ', label: '🤝 Quan hệ', color: '#5a8fc4' },
  { value: 'công-việc', label: '💼 Công việc', color: '#c9a96e' },
  { value: 'quyền-lực', label: '👑 Quyền lực', color: '#c47a5a' },
  { value: 'cảm-xúc', label: '💭 Cảm xúc', color: '#7a5ac4' },
  { value: 'kỷ-luật', label: '⚔️ Kỷ luật', color: '#5bc47a' },
  { value: 'tài-chính', label: '💰 Tài chính', color: '#c4a95a' },
  { value: 'ngũ-hành', label: '🔥 Ngũ Hành', color: '#e63946' },
  { value: 'bát-quái', label: '☯️ Bát Quái', color: '#1d3557' }
];

const JOURNAL_PROMPTS = [
  'Hôm nay bạn có thấy mình bất quyết trong việc gì không?',
  'Bạn đã giúp đỡ ai hôm nay? Cảm giác như thế nào?',
  'Điều gì khiến bạn cảm thấy "chóng chán" gần đây?',
  'Bạn có đang kiên trì với mục tiêu lớn nào không?',
  'Mối quan hệ nào trong gia đình cần bạn chú ý hơn?',
  'Bạn có nhận ra sự che chở từ quý nhân nào gần đây?',
  'Hôm nay bạn đã dùng "nhu thắng cương" trong tình huống nào?',
  'Bạn đã rèn luyện ý chí kim cương như thế nào hôm nay?',
  'Điều gì từ Tử Vi mà bạn muốn chiêm nghiệm thêm?',
  'Bạn có cảm nhận được sự kết nối với dòng họ hôm nay không?',
  'Nếu phải đưa ra một quyết định quan trọng hôm nay, bạn sẽ chọn gì?',
  'Điểm mạnh nào của bạn đã phát huy tác dụng hôm nay?',
  'Bạn đã đọc/học được gì mới hôm nay?',
  'Bạn có đang sống đúng với cốt cách "nhân hậu, trí tuệ" không?'
];

// Export
window.SAMPLE_LESSONS = SAMPLE_LESSONS;
window.SAMPLE_RULES = SAMPLE_RULES;
window.SAMPLE_REMINDERS = SAMPLE_REMINDERS;
window.SAMPLE_JOURNALS = SAMPLE_JOURNALS;
window.MOOD_OPTIONS = MOOD_OPTIONS;
window.RULE_CATEGORIES = RULE_CATEGORIES;
window.JOURNAL_PROMPTS = JOURNAL_PROMPTS;
