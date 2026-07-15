// ============================================
// NỘI TÂM — Dữ liệu Tử Vi Cá nhân
// Cấu trúc hóa từ file Tử vi cá nhân.md
// ============================================

const TUVI_SECTIONS = [
  { id: 'chan-dung', name: 'Chân dung Cốt cách & Nội tâm', icon: '🪞', description: 'Tính cách, năng khiếu, khát vọng và nội tâm sâu thẳm' },
  { id: 'su-nghiep', name: 'Sự nghiệp, Tài lộc & Vị thế', icon: '⚡', description: 'Con đường sự nghiệp, tài chính và vị thế xã hội' },
  { id: 'gia-dao', name: 'Gia đạo & Huyết thống', icon: '🏠', description: 'Gia đình, hôn nhân, con cái và dòng tộc' },
  { id: 'cai-menh', name: 'Chiến lược Cải mệnh', icon: '🧭', description: 'Điểm mạnh, điểm yếu và chiến lược tu dưỡng' }
];

const TUVI_DATA = [
  // ── PHẦN I: CHÂN DUNG CỐT CÁCH & NỘI TÂM (1–20) ──
  {
    id: 1,
    title: 'Hé lộ Cục diện Mệnh bàn',
    section: 'chan-dung',
    content: 'Bạn là Dương Nam, sinh năm Canh Thìn, Bản mệnh Bạch Lạp Kim, Hỏa Lục Cục. Mệnh an tại Tý có Thiên Đồng tọa thủ, Thân cư Phúc Đức tại Dần. Việc sinh vào giờ Mùi khiến Cung Thân đóng tại Phúc Đức, chỉ ra rằng cuộc đời bạn chịu ảnh hưởng vô cùng sâu sắc từ phước phần của tổ tiên, họ hàng. Mệnh chủ là Liêm Trinh, Thân chủ là Văn Xương, đóng vai trò định hình những nét tính cách ẩn sâu bên trong. Lai nhân cung nằm ở Quan Lộc, cho thấy cuộc đời bạn có duyên nghiệp, khát vọng gắn liền với công danh, sự nghiệp.',
    tags: ['mệnh', 'thiên-đồng', 'bạch-lạp-kim', 'hỏa-lục-cục', 'phúc-đức'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 2,
    title: 'Ngoại hình và Tướng mạo',
    section: 'chan-dung',
    content: 'Nhờ sao Thiên Đồng đắc địa tọa thủ tại Mệnh, bạn sở hữu một ngoại hình mang nhiều nét "phúc tướng". Người có Thiên Đồng thủ Mệnh thường có vóc dáng phi nộn (đậm người, có da có thịt), da trắng, mày xanh, mắt sáng, lưng dày. Gương mặt thường vuông vắn, đầy đặn, mang nét phong mãn, thanh tú. Kết hợp với Thân chủ Văn Xương, ngoại hình của bạn còn toát lên sự đĩnh đạc, nho nhã và sáng sủa.',
    tags: ['ngoại-hình', 'thiên-đồng', 'văn-xương', 'phúc-tướng'],
    strengths: ['phúc-tướng', 'đĩnh-đạc', 'nho-nhã'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 3,
    title: 'Tính cách cốt lõi (Ưu điểm)',
    section: 'chan-dung',
    content: 'Tính cách cốt lõi của bạn được định hình bởi phúc tinh Thiên Đồng. Bạn là người bẩm tính ôn hòa, nhân hậu, đức hạnh và có lòng từ thiện. Bạn sở hữu một tâm hồn hướng thượng, thích tìm hiểu về triết lý, đạo lý và thường xử sự một cách khiêm cung, nhã nhặn. Dù là người có chí khí và thông minh khôn ngoan, bạn không bao giờ tỏ vẻ cao ngạo hay chống báng người khác.',
    tags: ['tính-cách', 'ưu-điểm', 'thiên-đồng'],
    strengths: ['ôn-hòa', 'nhân-hậu', 'khiêm-cung', 'thông-minh'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 4,
    title: 'Góc khuất tính cách (Khuyết điểm)',
    section: 'chan-dung',
    content: 'Điểm yếu lớn nhất của Thiên Đồng là sự thiếu kiên định. Bạn dễ mắc phải nhược điểm là "hay thay đổi ý kiến, chí hướng, công việc", đôi khi tỏ ra nông nổi, bất quyết và thiếu sự bền chí (hay bỏ dở nửa chừng). Ngoài ra, do chịu ảnh hưởng ngầm từ Mệnh chủ Liêm Trinh, sâu thẳm bên trong bạn đôi khi có sự nóng nảy, cuồng độc ngầm, không ưa bị gò bó hoặc áp đặt.',
    tags: ['tính-cách', 'khuyết-điểm', 'thiên-đồng', 'liêm-trinh'],
    strengths: [],
    weaknesses: ['thiếu-kiên-định', 'bất-quyết', 'nóng-nảy-ngầm'],
    type: 'weakness'
  },
  {
    id: 5,
    title: 'Năng khiếu bẩm sinh',
    section: 'chan-dung',
    content: 'Bạn sở hữu trí thông minh bẩm sinh, khả năng học hỏi rộng và tư chất tinh thông văn bút. Sao Thiên Đồng trao cho bạn óc kinh doanh, sự tháo vát, biết quyền biến trong công việc và có hoa tay khéo léo. Ngoài ra, ảnh hưởng từ Thân chủ Văn Xương giúp bạn có cơ trí sắc sảo, tài năng hiểu biết nhiều lĩnh vực, có thiên hướng tốt trong các công việc đòi hỏi trí tuệ, nghiên cứu.',
    tags: ['năng-khiếu', 'trí-tuệ', 'văn-xương'],
    strengths: ['trí-thông-minh', 'tháo-vát', 'đa-tài'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 6,
    title: 'Chí hướng và Khát vọng',
    section: 'chan-dung',
    content: 'Với Lai nhân cung ở Quan Lộc, khát vọng lớn nhất của bạn là xây dựng được một sự nghiệp vững chắc, có chỗ đứng trong xã hội. Tuy nhiên, vì Thân cư Phúc Đức, đích đến cuối cùng mà bạn hướng tới không chỉ là tiền tài bề ngoài, mà là sự hãnh diện cho gia đình, dòng họ, và sự bình yên trong tâm hồn ở nửa đời sau.',
    tags: ['chí-hướng', 'khát-vọng', 'quan-lộc', 'phúc-đức'],
    strengths: ['có-chí-hướng'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 7,
    title: 'Sự tương tác Ngũ Hành (Mệnh – Cục)',
    section: 'chan-dung',
    content: 'Bạn mang Mệnh Kim, nhưng Cục lại là Hỏa (Hỏa Lục Cục), tạo thành thế Cục khắc Mệnh (Khắc nhập). Điều này có nghĩa là môi trường sống, hoàn cảnh xã hội (Cục) thường xuyên tạo ra áp lực, thử thách và đè nén lên bản thân bạn (Mệnh). Cuộc đời bạn ít khi trải qua sự bằng phẳng ngay từ đầu mà phải kinh qua sự tôi luyện (Hỏa nung Kim) mới có thể đắc dụng và thành công.',
    tags: ['ngũ-hành', 'mệnh-kim', 'hỏa-cục', 'thử-thách'],
    strengths: [],
    weaknesses: ['áp-lực-môi-trường'],
    type: 'warning'
  },
  {
    id: 8,
    title: 'Đánh giá Cung Thân (Hậu vận)',
    section: 'chan-dung',
    content: 'Cung Thân của bạn an tại Phúc Đức, nghĩa là từ sau 30 tuổi (hậu vận), cuộc sống của bạn sẽ gắn liền và bị chi phối mạnh mẽ bởi gia tộc, mồ mả tổ tiên, và nghiệp quả của chính mình. Nửa đời sau, tư tưởng của bạn sẽ chuyển hướng mạnh từ việc tranh đoạt cá nhân sang việc chăm lo cho gia đình lớn, dòng họ, hướng về cội nguồn và những giá trị tâm linh.',
    tags: ['hậu-vận', 'phúc-đức', 'gia-tộc', 'tâm-linh'],
    strengths: ['hậu-vận-tốt'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 9,
    title: 'Độ nhất quán Thân – Mệnh',
    section: 'chan-dung',
    content: 'Khoa Tử Vi quan niệm "Mệnh là nhân, Thân là quả". Ở đây, Mệnh của bạn là Thiên Đồng (Phúc tinh, hiền lành) và Thân nằm ở cung Phúc Đức. Có một sự nhất quán lớn: hạt mầm nhân hậu, từ thiện ở Mệnh sẽ trổ quả thành một hậu vận bình an, được hưởng phúc lộc từ dòng họ nếu bạn giữ vững được cốt cách lương thiện.',
    tags: ['thân-mệnh', 'nhân-quả', 'phúc-đức'],
    strengths: ['nhất-quán', 'phúc-lộc'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 10,
    title: 'Định vị đẳng cấp xã hội',
    section: 'chan-dung',
    content: 'Với cốt cách của Thiên Đồng, xã hội sẽ luôn nhìn nhận bạn là một nhân sĩ đàng hoàng, tử tế, đáng tin cậy. Dù bạn có thể bị môi trường chèn ép (Cục khắc Mệnh), nhưng nhờ lối hành xử khiêm cung, hòa nhã, bạn tự định vị mình là người dùng đạo đức và trí tuệ để thu phục lòng người, chứ không dùng thủ đoạn đoạt lợi.',
    tags: ['xã-hội', 'uy-tín', 'đạo-đức'],
    strengths: ['đáng-tin-cậy', 'uy-tín'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 11,
    title: 'Gốc rễ Dòng họ (Phúc Đức)',
    section: 'chan-dung',
    content: 'Cung Phúc Đức trong lá số của bạn giữ vai trò sinh tử vì bạn có "Thân cư Phúc Đức". Cung này đại diện cho "tiền kiếp", "huyết thống", và hậu quả của dòng họ lên cuộc đời bạn. Sự thành bại, thọ yểu của bạn đều chịu ảnh hưởng trực tiếp từ phước ấm của ông bà tổ tiên để lại. Nếu họ hàng thịnh vượng, bạn sẽ nhận được sự nâng đỡ lớn lao; nếu sa sút, bạn chính là người phải đứng ra gánh vác nghiệp quả của gia tộc.',
    tags: ['phúc-đức', 'dòng-họ', 'tổ-tiên', 'nghiệp-quả'],
    strengths: [],
    weaknesses: [],
    type: 'warning'
  },
  {
    id: 12,
    title: 'Mối liên kết Tâm linh',
    section: 'chan-dung',
    content: 'Là người có Thiên Đồng tọa Mệnh và Thân cư Phúc Đức, sợi dây liên kết giữa bạn với thế giới tâm linh, tín ngưỡng rất bền chặt. Bạn có khuynh hướng tò mò về triết học, đạo lý, và sở hữu một "thiện tâm" lớn. Đây là cơ sở để bạn dễ dàng cảm nhận được những sự che chở vô hình trong cuộc sống.',
    tags: ['tâm-linh', 'triết-học', 'thiện-tâm'],
    strengths: ['tâm-linh-mạnh'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 13,
    title: 'Chỉ số Hạnh phúc',
    section: 'chan-dung',
    content: 'Chỉ số hạnh phúc của bạn ở mức rất cao, chủ yếu xuất phát từ thế giới quan nội tâm. Vì sao Thiên Đồng chủ về sự "ích thọ", "phúc thiện", bạn dễ tìm thấy niềm vui trong sự thanh thản, giúp đỡ người khác. Bạn "hay làm phúc, không hại ai nên ít bị người hại", điều này mang lại một tâm lý bình yên, không bị dằn vặt hay thù hằn.',
    tags: ['hạnh-phúc', 'nội-tâm', 'bình-yên'],
    strengths: ['hạnh-phúc-cao', 'bình-yên'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 14,
    title: 'Chỉ số Vượt khó (AQ)',
    section: 'chan-dung',
    content: 'Chỉ số vượt khó của bạn được rèn luyện do thế "Cục khắc Mệnh" (Hỏa khắc Kim). Bạn luôn bị hoàn cảnh đặt vào thế phải nỗ lực vươn lên. Tuy vẻ ngoài (Mệnh Thiên Đồng) có vẻ nhàn nhã, thiếu kiên định, nhưng ẩn sâu bên trong (Mệnh chủ Liêm Trinh) lại là một sức sống mạnh mẽ, không chịu khuất phục sự gò bó, giúp bạn đứng lên sau những lần vấp ngã.',
    tags: ['vượt-khó', 'AQ', 'liêm-trinh', 'sức-sống'],
    strengths: ['sức-sống-mạnh', 'vượt-khó'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 15,
    title: 'Đạo đức và Lương tâm',
    section: 'chan-dung',
    content: 'Đạo đức là điểm sáng rực rỡ nhất trong cốt cách của bạn. Sự thiện lương, độ lượng, thích làm việc thiện giúp người không phải là vỏ bọc mà là bản chất thật của bạn. Bạn xử sự bằng sự chân thành, giữ gìn phẩm hạnh và luôn hướng tới việc tích đức cho bản thân và con cháu sau này.',
    tags: ['đạo-đức', 'lương-tâm', 'thiện-lương'],
    strengths: ['đạo-đức-cao', 'chân-thành'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 16,
    title: 'Sở thích và Thú vui',
    section: 'chan-dung',
    content: 'Dưới tác động của Thân chủ Văn Xương, bạn có tính tình nho nhã, ưa thích sự u nhàn, thanh tịnh và thường ghét những nơi náo tạp, ồn ào. Bạn có thể có đam mê với nghệ thuật, văn chương, sách vở, hoặc những môn khoa học đòi hỏi sự suy luận, nghiên cứu tỉ mỉ.',
    tags: ['sở-thích', 'văn-xương', 'nghệ-thuật', 'học-thuật'],
    strengths: ['nho-nhã', 'ham-học'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 17,
    title: 'Quý nhân âm trợ',
    section: 'chan-dung',
    content: 'Sao Thiên Đồng tại Mệnh vốn là Phúc Tinh, tượng trưng cho việc ra ngoài luôn có thần linh che chở và quý nhân phù trợ. Bất cứ khi nào bạn gặp gian nan, nhờ vào phước đức đã gieo trồng và gốc rễ từ dòng họ, luôn có người xuất hiện đúng lúc để giúp đỡ bạn vượt qua sóng gió.',
    tags: ['quý-nhân', 'phúc-tinh', 'che-chở'],
    strengths: ['quý-nhân-phù-trợ'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 18,
    title: 'Nỗi lo âu thường trực',
    section: 'chan-dung',
    content: 'Góc khuất của Mệnh Thiên Đồng khiến bạn thường trực một nỗi lo âu về sự mất phương hướng. Vì tính cách đôi khi "bất quyết", bạn hay phân vân, trăn trở khi phải đưa ra các quyết định lớn, dẫn đến việc dễ chán nản hoặc mệt mỏi với hoàn cảnh hiện tại (do Cục Hỏa khắc Mệnh Kim).',
    tags: ['lo-âu', 'bất-quyết', 'mệt-mỏi'],
    strengths: [],
    weaknesses: ['lo-âu', 'mất-phương-hướng', 'chán-nản'],
    type: 'weakness'
  },
  {
    id: 19,
    title: 'Họ hàng xa',
    section: 'chan-dung',
    content: 'Mối quan hệ với họ hàng xa và những người trong dòng tộc rất mật thiết. Do Thân đóng tại Phúc, bạn không thể sống tách biệt khỏi dòng họ. Dù muốn hay không, các biến cố, hiếu hỉ, hay sự hưng suy của những người họ hàng đều tác động trực tiếp đến tinh thần và sự nghiệp của bạn.',
    tags: ['họ-hàng', 'dòng-tộc', 'phúc-đức'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 20,
    title: 'Tuổi thọ và Nghiệp quả',
    section: 'chan-dung',
    content: 'Thiên Đồng là sao "Mộc chủ Thọ tinh", chuyên ban phước và kéo dài tuổi thọ. Cuộc đời bạn là một bài toán nhân quả rõ rệt (nghiệp báo của Phúc Đức). Nếu bạn liên tục hành thiện, tu dưỡng tâm tính, bạn không chỉ hóa giải được các ách nạn (do Cục khắc Mệnh mang lại) mà còn được an hưởng một hậu vận trường thọ, thanh nhàn, viên mãn bên gia tộc.',
    tags: ['tuổi-thọ', 'nghiệp-quả', 'nhân-quả', 'hành-thiện'],
    strengths: ['trường-thọ'],
    weaknesses: [],
    type: 'info'
  },

  // ── PHẦN II: SỰ NGHIỆP, TÀI LỘC & VỊ THẾ (21–50) ──
  {
    id: 21,
    title: 'Ngành nghề đắc cách',
    section: 'su-nghiep',
    content: 'Cung Quan Lộc của bạn hội tụ bộ sao Thiên Cơ và Thiên Lương đắc địa tại Thìn, tạo thành một cấu trúc sự nghiệp vô cùng đẹp. Bộ sao Cơ Lương này là biểu tượng của tài năng "tham mưu, cố vấn, chính trị và chiến lược". Bạn đặc biệt đắc cách trong các lĩnh vực: giảng dạy, sư phạm, y khoa, dược khoa, quản trị hành chính, hoặc làm chuyên gia tư vấn, thiết kế, tham mưu cho các cấp lãnh đạo. Thiên Cơ cũng đại diện cho khả năng tinh xảo về kỹ thuật, máy móc, cơ khí.',
    tags: ['ngành-nghề', 'cơ-lương', 'tham-mưu', 'giáo-dục', 'y-khoa'],
    strengths: ['tham-mưu', 'cố-vấn', 'chiến-lược'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 22,
    title: 'Phong cách làm việc',
    section: 'su-nghiep',
    content: 'Bạn có phong cách làm việc của một chiến lược gia đích thực. Với Thiên Cơ và Thiên Lương ở Quan Lộc, bạn làm việc bằng trí óc nhạy bén, khả năng phân tích tỉ mỉ, đa mưu túc trí và rất biết quyền biến, tháo vát. Bạn giải quyết vấn đề bằng sự mềm mỏng, khiêm cung, lấy sự chân thành và đạo lý để thuyết phục người khác chứ không dùng vũ lực hay sự áp đặt.',
    tags: ['phong-cách', 'chiến-lược', 'phân-tích', 'nhu-thắng-cương'],
    strengths: ['chiến-lược-gia', 'phân-tích-tỉ-mỉ'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 23,
    title: 'Con đường Học vấn & Bằng cấp',
    section: 'su-nghiep',
    content: 'Con đường học vấn của bạn rất rộng mở và rực rỡ. Bộ Cơ Lương là một "bộ khoa bảng quan trọng" chuyên về khả năng nghiên cứu, tìm tòi và lý thuyết. Kết hợp với Thân chủ là Văn Xương, bạn sở hữu tư chất thông minh xuất chúng, học rộng biết nhiều, khả năng tiếp thu cực tốt và dễ dàng đạt được những bằng cấp, học vị cao.',
    tags: ['học-vấn', 'bằng-cấp', 'nghiên-cứu', 'văn-xương'],
    strengths: ['học-giỏi', 'nghiên-cứu'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 24,
    title: 'Môi trường làm việc tối ưu',
    section: 'su-nghiep',
    content: 'Bạn sẽ phát huy tối đa năng lực trong những môi trường mang tính hàn lâm, nghiên cứu, viện tư vấn, cơ quan hành chính nhà nước hoặc các tổ chức giáo dục, y tế. Môi trường này cần có sự ổn định, ít sự cạnh tranh bạo liệt hay bon chen bằng thủ đoạn.',
    tags: ['môi-trường', 'hàn-lâm', 'ổn-định'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 25,
    title: 'Quyền lực thực tế',
    section: 'su-nghiep',
    content: 'Quyền lực của bạn không phải là "thét ra lửa" hay thống lĩnh quân đội mang tính sát phạt. Thay vào đó, bạn nắm giữ "quyền lực mềm" – sức mạnh của một quân sư, cố vấn tối cao. Lời nói và chiến lược của bạn có trọng lượng, có khả năng can gián và định hướng cho những người đứng đầu.',
    tags: ['quyền-lực', 'quyền-lực-mềm', 'cố-vấn'],
    strengths: ['quyền-lực-mềm'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 26,
    title: 'Tính ổn định nghề nghiệp',
    section: 'su-nghiep',
    content: 'Tuy có tư chất thông minh và vị trí tốt, nhưng do ảnh hưởng của Thiên Đồng thủ Mệnh, tâm lý của bạn đôi khi thiếu sự kiên định, dễ "chóng chán", hay thay đổi ý kiến và có thể có những giai đoạn muốn chuyển đổi môi trường làm việc. Tuy nhiên, nhờ cung Quan Lộc có bộ sao vững chắc, sự nghiệp dù có lúc thay đổi vị trí nhưng tựu trung vẫn luôn thăng tiến.',
    tags: ['ổn-định', 'chóng-chán', 'thăng-tiến'],
    strengths: ['thăng-tiến'],
    weaknesses: ['chóng-chán', 'thiếu-kiên-định'],
    type: 'warning'
  },
  {
    id: 27,
    title: 'Quan hệ với Cấp trên',
    section: 'su-nghiep',
    content: 'Bạn là một "hảo thần" (bề tôi giỏi) trong mắt cấp trên. Với tài tham mưu xuất sắc, bạn luôn đưa ra được những sách lược quý giá để giúp đỡ họ. Bạn biết cách can gián bằng sự tinh tế, được cấp trên rất tín nhiệm, trọng dụng và thường được bố trí làm việc ở cạnh những chức quyền cao cấp.',
    tags: ['cấp-trên', 'tham-mưu', 'tín-nhiệm'],
    strengths: ['được-tín-nhiệm'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 28,
    title: 'Năng lực Cạnh tranh',
    section: 'su-nghiep',
    content: 'Bạn cạnh tranh bằng trí tuệ, lý luận sắc bén và đạo đức nghề nghiệp. Bạn không thích dùng mưu hèn kế bẩn hay dẫm đạp lên người khác để tiến thân. Tuy nhiên, nếu bị dồn vào thế phải đấu tranh, óc quyền biến và mưu trí của Thiên Cơ sẽ giúp bạn tìm ra giải pháp tối ưu nhất.',
    tags: ['cạnh-tranh', 'trí-tuệ', 'đạo-đức'],
    strengths: ['cạnh-tranh-bằng-trí-tuệ'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 29,
    title: 'Thời điểm "Phát quan"',
    section: 'su-nghiep',
    content: 'Cơ hội thăng hoa sự nghiệp của bạn sẽ thực sự bùng nổ khi bạn bước vào giai đoạn trung vận (từ 30 tuổi trở đi), khi Cung Thân ở Phúc Đức bắt đầu chi phối mạnh. Lúc này, kinh nghiệm sống, trí tuệ học thuật và uy tín đạo đức của bạn đã đạt độ chín muồi.',
    tags: ['phát-quan', 'trung-vận', 'thăng-hoa'],
    strengths: ['thăng-hoa-trung-vận'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 30,
    title: 'Rủi ro Nghề nghiệp',
    section: 'su-nghiep',
    content: 'Rủi ro lớn nhất đến từ chính tâm lý "bất quyết", hay phân vân và đôi lúc thiếu bền chí của bạn. Nếu không rèn luyện sự kiên nhẫn, bạn rất dễ bỏ dở những dự án lớn khi đang ở lưng chừng. Ngoài ra, việc quá nhân hậu và đôi khi cả nể có thể khiến bạn chịu thiệt thòi.',
    tags: ['rủi-ro', 'bất-quyết', 'cả-nể'],
    strengths: [],
    weaknesses: ['bỏ-dở', 'cả-nể'],
    type: 'weakness'
  },
  {
    id: 31,
    title: 'Nguồn gốc Tài chính',
    section: 'su-nghiep',
    content: 'Cung Tài Bạch nằm trong tam hợp Cơ Nguyệt Đồng Lương, cho thấy nguồn thu chính đến từ những công việc trí óc, chất xám, lương bổng, tư vấn, hoặc phát minh, nghiên cứu. Bạn kiếm tiền bằng "Chính tài" – tiền sạch, do mồ hôi công sức, trí tuệ và sự tận tâm làm ra.',
    tags: ['tài-chính', 'chính-tài', 'chất-xám'],
    strengths: ['tiền-sạch'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 32,
    title: 'Tốc độ kiếm tiền',
    section: 'su-nghiep',
    content: 'Tốc độ kiếm tiền của bạn đi theo quỹ đạo tích tiểu thành đại, chậm nhưng cực kỳ chắc chắn. Bạn "bạch thủ sinh tài" (tay trắng làm nên), sử dụng chất xám và xảo thuật tư duy để mưu sinh. Càng về hậu vận, tốc độ tụ tài càng nhanh và vững chãi.',
    tags: ['tốc-độ', 'tích-tiểu-thành-đại', 'bạch-thủ'],
    strengths: ['chắc-chắn'],
    weaknesses: ['chậm-ban-đầu'],
    type: 'info'
  },
  {
    id: 33,
    title: 'Thói quen chi tiêu',
    section: 'su-nghiep',
    content: 'Sở hữu bản tính nhân hậu, từ thiện, bạn rất thoáng đãng trong việc chi tiêu cho các hoạt động xã hội, giúp đỡ người thân hoặc làm việc thiện. Bạn không quá bủn xỉn hay so đo từng đồng, mà chi tiêu có chừng mực, biết giá trị của đồng tiền nhưng không làm nô lệ cho nó.',
    tags: ['chi-tiêu', 'từ-thiện', 'chừng-mực'],
    strengths: ['hào-phóng-có-chừng-mực'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 34,
    title: 'Khả năng Tụ tài',
    section: 'su-nghiep',
    content: 'Khả năng tụ tài cực kỳ tốt, đặc biệt vào giai đoạn trung và hậu vận. Bộ sao Cơ Lương ở Thìn Tuất chỉ "sự giàu có dễ dàng", Thiên Cơ mang lại mưu trí kiếm tiền, Thiên Lương mang đến cơ hội may mắn và phước lộc. Bạn biết cách tích lũy và điều hướng dòng tiền vào những kênh an toàn, sinh lời bền vững.',
    tags: ['tụ-tài', 'tích-lũy', 'đầu-tư'],
    strengths: ['tụ-tài-tốt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 35,
    title: 'Vận may Hoạnh tài',
    section: 'su-nghiep',
    content: 'Lá số không có đặc tính trúng số độc đắc hay giàu lên bất thình lình bằng con đường ma giáo, cờ bạc. Nếu có hoạnh tài, nó thường đến dưới dạng một sự ghi nhận xứng đáng cho công trình nghiên cứu, phần thưởng nghề nghiệp, hoặc tiền bạc được hưởng từ ông bà, dòng họ để lại nhờ "Thân cư Phúc Đức".',
    tags: ['hoạnh-tài', 'phần-thưởng', 'phúc-đức'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 36,
    title: 'Tổng quan Điền sản',
    section: 'su-nghiep',
    content: 'Bộ sao Cơ Nguyệt Đồng Lương cho thấy về sau bạn sẽ sở hữu một khối lượng bất động sản lớn ("có nhiều nhà đất"). Cung Điền Trạch ổn định, nhà cửa khang trang, tươm tất. Ban đầu có thể bình thường hoặc phải tự tay gây dựng, nhưng về lâu dài, đất đai sẽ sinh sôi nảy nở mạnh mẽ.',
    tags: ['điền-sản', 'bất-động-sản', 'nhà-đất'],
    strengths: ['nhiều-bất-động-sản'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 37,
    title: 'Quá trình tạo dựng cơ nghiệp',
    section: 'su-nghiep',
    content: 'Đó là một hành trình đi từ tri thức đến thực tiễn. Bạn dùng bằng cấp, tài tham mưu và chất xám làm vốn liếng ban đầu. Nhờ "tay trắng làm nên sự nghiệp", quá trình này đòi hỏi sự nhẫn nại trong tiền vận. Từ nền tảng tri thức và uy tín, bạn dần xây dựng nên một cơ nghiệp đáng nể.',
    tags: ['cơ-nghiệp', 'tri-thức', 'nhẫn-nại'],
    strengths: ['tự-lập'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 38,
    title: 'Phong thủy nơi ở',
    section: 'su-nghiep',
    content: 'Người có cốt cách của Thiên Đồng, Văn Xương và Thiên Lương luôn hướng tới một không gian sống thanh tịnh, nho nhã, có yếu tố văn hóa hoặc học thuật. Phong thủy nơi ở tối ưu là những khu vực yên tĩnh, có thư phòng lớn, nhiều ánh sáng, gần gũi với môi trường giáo dục hoặc khu dân cư có dân trí cao.',
    tags: ['phong-thủy', 'nơi-ở', 'thanh-tịnh'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 39,
    title: 'Biến động Tài sản lớn',
    section: 'su-nghiep',
    content: 'Tài sản ít khi gặp phải cảnh sụp đổ trắng tay trong một đêm. Tuy nhiên, biến động tài sản lớn nhất thường xuất hiện khi bạn quyết định thay đổi công việc, chuyển hướng kinh doanh, hoặc trích khoản tiền lớn để chăm lo cho dòng họ, mồ mả tổ tiên.',
    tags: ['biến-động', 'tài-sản', 'rủi-ro'],
    strengths: ['ít-rủi-ro-lớn'],
    weaknesses: [],
    type: 'warning'
  },
  {
    id: 40,
    title: 'Hậu vận Tài chính',
    section: 'su-nghiep',
    content: 'Hậu vận tài chính vô cùng rực rỡ và viên mãn. "Tiền bần hậu phú", bạn sẽ được an hưởng sự giàu sang, phong túc khi về già. Tiền bạc không còn là nỗi lo, bạn sẽ dùng khối tài sản tích lũy được để làm phúc, chăm lo cho con cháu và đóng góp cho xã hội.',
    tags: ['hậu-vận', 'tài-chính', 'tiền-bần-hậu-phú'],
    strengths: ['viên-mãn-tài-chính'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 41,
    title: 'Hình ảnh công chúng',
    section: 'su-nghiep',
    content: 'Trong mắt công chúng, bạn là một nhân sĩ trí thức, một bậc hiền triết đáng kính, "nho phong đạo cốt" và đầy lòng bác ái. Bạn luôn được nhìn nhận như một người thầy, một vị cố vấn tài ba, điềm đạm, không khoe khoang và có đạo đức nghề nghiệp cực kỳ cao.',
    tags: ['hình-ảnh', 'trí-thức', 'hiền-triết'],
    strengths: ['uy-tín-công-chúng'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 42,
    title: 'Xu hướng Xuất ngoại/Đi xa',
    section: 'su-nghiep',
    content: 'Sao Thiên Đồng tọa Mệnh mang đậm "khuynh hướng thay đổi", bao gồm việc dễ di chuyển, thay đổi chỗ ở, chỗ làm. Bạn có cơ hội và xu hướng đi xa, lập nghiệp phương xa. Tuy nhiên, đi đâu thì cuối cùng tâm trí vẫn luôn hướng về dòng họ, quê hương (Thân cư Phúc).',
    tags: ['xuất-ngoại', 'đi-xa', 'thay-đổi'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 43,
    title: 'Cát hung khi đi xa',
    section: 'su-nghiep',
    content: 'Sao Thiên Đồng là Phúc tinh, nên khi ra ngoài xã hội bạn được hưởng sự thanh nhàn và may mắn. Bạn luôn gặp được "quý nhân phù trợ", những người có địa vị sẵn sàng giúp đỡ. Tuy nhiên, tâm lý thiếu lập trường đôi khi khiến bạn dễ bị tác động bởi dư luận hoặc hoàn cảnh bên ngoài.',
    tags: ['thiên-di', 'quý-nhân', 'may-mắn'],
    strengths: ['may-mắn-đi-xa'],
    weaknesses: ['dễ-bị-tác-động'],
    type: 'info'
  },
  {
    id: 44,
    title: 'Chất lượng Bạn bè',
    section: 'su-nghiep',
    content: 'Vì sống nhân hậu, "hay làm phúc, không hại ai", bạn thu hút được những người bạn chân thành, tri thức và lương thiện. Bạn bè phần lớn là những người có học vấn. Bạn hiếm khi bị bạn bè hãm hại hay lừa gạt, nếu có, bạn cũng dùng sự độ lượng để hóa giải.',
    tags: ['bạn-bè', 'chân-thành', 'tri-thức'],
    strengths: ['bạn-bè-tốt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 45,
    title: 'Chất lượng Cấp dưới/Nhân viên',
    section: 'su-nghiep',
    content: 'Nhờ bản tính ôn hòa, từ thiện, bạn lãnh đạo cấp dưới bằng tình cảm, đạo lý chứ không dùng uy quyền sát phạt. Cấp dưới tôn trọng và trung thành vì cái tâm và cái tầm. Tuy nhiên, sự thiếu quyết đoán và quá hiền lành có thể làm giảm bớt tính kỷ luật thép trong tổ chức.',
    tags: ['lãnh-đạo', 'cấp-dưới', 'ôn-hòa'],
    strengths: ['được-tôn-trọng'],
    weaknesses: ['thiếu-kỷ-luật'],
    type: 'warning'
  },
  {
    id: 46,
    title: 'Kỹ năng Ngoại giao',
    section: 'su-nghiep',
    content: 'Kỹ năng ngoại giao ở mức tuyệt đỉnh theo trường phái "nhu thắng cương". Bạn ứng xử khéo léo, tinh tế, luôn "lấy lễ đãi người, dùng sự thành thật, khiêm cung để xử thế". Bạn biết nhường nhịn, dung hòa các mối quan hệ, khiến đối tác hay đối thủ cũng phải nể phục.',
    tags: ['ngoại-giao', 'nhu-thắng-cương', 'tinh-tế'],
    strengths: ['ngoại-giao-tuyệt-đỉnh'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 47,
    title: 'Thị phi và Tai tiếng',
    section: 'su-nghiep',
    content: 'Sự thiện lương giúp bạn tránh được hầu hết các họa thị phi lớn trong đời. Nếu có tai tiếng, thường chỉ xuất phát từ sự hiểu lầm do tính cách "hay thay đổi chí hướng" khiến người ngoài nghĩ bạn không kiên định.',
    tags: ['thị-phi', 'tai-tiếng', 'hiểu-lầm'],
    strengths: ['ít-thị-phi'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 48,
    title: 'Hợp tác làm ăn',
    section: 'su-nghiep',
    content: 'Trong hợp tác, bạn là người lo về mặt mưu trí, kế hoạch, định hướng chiến lược (Thiên Cơ) và giữ vai trò cân bằng, ổn định đạo đức (Thiên Lương). Bạn hợp tác tốt nhất với những người có thế mạnh về thực thi, hành động quyết liệt. Nếu để tự mình gánh vác các quyết định mang tính bạo dạn rủi ro cao, bạn sẽ dễ bị phân tâm.',
    tags: ['hợp-tác', 'chiến-lược', 'thực-thi'],
    strengths: ['chiến-lược-gia'],
    weaknesses: ['thiếu-quyết-đoán-rủi-ro'],
    type: 'warning'
  },
  {
    id: 49,
    title: 'Sức hút người khác giới',
    section: 'su-nghiep',
    content: 'Nét đào hoa của bạn không nằm ở sự lả lơi, mà toát ra từ vẻ đẹp trí tuệ, sự nho nhã của Văn Xương và sự ân cần, ấm áp của Thiên Đồng. Người khác giới bị thu hút bởi sự tinh tế, học thức và lòng nhân hậu. Tuy nhiên, sự lãng mạn, đa cảm ẩn sâu bên trong có thể khiến nội tâm đôi khi dậy sóng vì tình cảm.',
    tags: ['đào-hoa', 'sức-hút', 'trí-tuệ', 'tình-cảm'],
    strengths: ['sức-hút-trí-tuệ'],
    weaknesses: ['đa-cảm'],
    type: 'info'
  },
  {
    id: 50,
    title: 'Biến cố từ môi trường',
    section: 'su-nghiep',
    content: 'Bạn sống trong thế "Cục Hỏa khắc Mệnh Kim", nghĩa là môi trường xã hội thường mang lại áp lực và sự chèn ép. Dù vậy, với bộ sao Cơ Nguyệt Đồng Lương mưu trí và phước thiện, bạn có khả năng xoay chuyển tình thế, dùng sự linh hoạt (quyền biến của Thiên Cơ) và phước lành (Thiên Lương, Thiên Đồng) để lách qua những biến cố lớn một cách an toàn. Nghịch cảnh chỉ là ngọn lửa tôi luyện thêm sự thông thái.',
    tags: ['biến-cố', 'hỏa-khắc-kim', 'quyền-biến'],
    strengths: ['xoay-chuyển-tình-thế'],
    weaknesses: [],
    type: 'strength'
  },

  // ── PHẦN III: GIA ĐẠO & HUYẾT THỐNG (51–70) ──
  {
    id: 51,
    title: 'Hình ảnh người Cha',
    section: 'gia-dao',
    content: 'Cung Phụ Mẫu có sao Vũ Khúc và Tham Lang tọa thủ. Vũ Khúc là tài tinh, Tham Lang là sao của sự tham vọng và tháo vát. Hình ảnh người cha hiện lên là một người cực kỳ thực tế, có ý chí làm giàu mạnh mẽ, năng động trong kinh tế và đôi khi có phần nghiêm khắc, gia trưởng.',
    tags: ['cha', 'vũ-khúc', 'tham-lang', 'gia-trưởng'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 52,
    title: 'Hình ảnh người Mẹ',
    section: 'gia-dao',
    content: 'Người mẹ cũng là một người phụ nữ đảm đang, giỏi giang và tháo vát trong việc quán xuyến tài chính. Dưới sự ảnh hưởng của Tham Lang và Vũ Khúc, mẹ bạn là người không ngại vất vả, có nhiều lo toan, tính toán để vun vén cho kinh tế gia đình.',
    tags: ['mẹ', 'đảm-đang', 'tài-chính'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 53,
    title: 'Tình cảm với Song thân',
    section: 'gia-dao',
    content: 'Mặc dù cha mẹ có năng lực và xây dựng được nền tảng kinh tế khá giả, nhưng Vũ Khúc (chủ sự cô độc) và Tham Lang tại cung Phụ Mẫu cho thấy giữa bạn và song thân có sự bất đồng quan điểm sâu sắc. Cha mẹ và con cái thường không hợp tính nhau, ít có sự chia sẻ sâu sắc về mặt tinh thần.',
    tags: ['song-thân', 'bất-đồng', 'tình-cảm'],
    strengths: [],
    weaknesses: ['bất-đồng-thế-hệ'],
    type: 'warning'
  },
  {
    id: 54,
    title: 'Sự trợ lực từ Phụ mẫu',
    section: 'gia-dao',
    content: 'Nhờ cha mẹ giỏi kinh tế, bạn sẽ nhận được sự trợ lực rất lớn về mặt vật chất, tiền bạc hoặc tài sản làm vốn liếng bước vào đời. Tuy nhiên, về mặt định hướng tinh thần hay sự đồng điệu trong tư tưởng, bạn thường phải tự lực cánh sinh.',
    tags: ['trợ-lực', 'vật-chất', 'tự-lập'],
    strengths: ['hỗ-trợ-vật-chất'],
    weaknesses: ['thiếu-đồng-điệu-tinh-thần'],
    type: 'info'
  },
  {
    id: 55,
    title: 'Lưu ý Sức khỏe Cha Mẹ',
    section: 'gia-dao',
    content: 'Khi cha mẹ bước vào độ tuổi trung vận và hậu vận, cần đặc biệt lưu ý đến các bệnh liên quan đến hệ tiêu hóa, đường hô hấp hoặc các bệnh do lao lực, ăn uống gây ra. Hệ thống gân cốt của cha mẹ cũng cần được chăm sóc kỹ lưỡng.',
    tags: ['sức-khỏe', 'cha-mẹ', 'lưu-ý'],
    strengths: [],
    weaknesses: [],
    type: 'warning'
  },
  {
    id: 56,
    title: 'Số lượng & Tình trạng Anh em',
    section: 'gia-dao',
    content: 'Cung Huynh Đệ tọa tại Hợi có sao Thiên Phủ đắc địa. Gia đình thường có đông anh chị em (từ 3 đến 5 người), không khí luôn đông đúc, nhộn nhịp.',
    tags: ['anh-em', 'thiên-phủ', 'gia-đình'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 57,
    title: 'Tình cảm Huynh đệ',
    section: 'gia-dao',
    content: 'Thiên Phủ là phúc tinh và lộc tinh mang tính chất bao dung, ổn định. Nhờ đó, tình cảm giữa các anh chị em rất tốt đẹp, hòa thuận. Mọi người biết đùm bọc, giúp đỡ và nhường nhịn lẫn nhau.',
    tags: ['huynh-đệ', 'hòa-thuận', 'đùm-bọc'],
    strengths: ['anh-em-hòa-thuận'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 58,
    title: 'Sự thành đạt của Anh em',
    section: 'gia-dao',
    content: 'Anh chị em phần lớn đều là những người có năng lực, làm ăn phát đạt và xây dựng được cuộc sống giàu sang, sung túc. Họ có khả năng quản lý tài chính tốt, có địa vị và được xã hội nể trọng nhờ sự che chở của lộc tinh Thiên Phủ.',
    tags: ['anh-em', 'thành-đạt', 'giàu-sang'],
    strengths: ['anh-em-thành-đạt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 59,
    title: 'Khả năng hợp tác người thân',
    section: 'gia-dao',
    content: 'Bạn hoàn toàn có thể tin tưởng và hợp tác làm ăn với anh chị em ruột thịt. Sự vững chắc, cẩn trọng và uy tín của Thiên Phủ đảm bảo rằng sự hợp tác kinh tế trong gia đình sẽ mang lại tài lộc bền vững, ít rủi ro hay tranh chấp.',
    tags: ['hợp-tác', 'gia-đình', 'tin-tưởng'],
    strengths: ['hợp-tác-gia-đình-tốt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 60,
    title: 'Nghiệp quả chung của gia đình',
    section: 'gia-dao',
    content: 'Nghiệp quả gắn liền với nền tảng kinh tế và sự ổn định của gia tộc. Nếu gia đình giữ được nề nếp, đạo đức thì hậu vận đều rực rỡ. Thử thách lớn nhất là sự thiếu thấu hiểu giữa thế hệ cha mẹ và con cái, đòi hỏi bạn phải dùng sự hòa nhã của Thiên Đồng để dung hòa.',
    tags: ['nghiệp-quả', 'gia-đình', 'dung-hòa'],
    strengths: [],
    weaknesses: ['xung-khắc-thế-hệ'],
    type: 'warning'
  },
  {
    id: 61,
    title: 'Duyên nợ Tiền định',
    section: 'gia-dao',
    content: 'Cung Phu Thê vô chính diệu tại Tuất, nhận xung chiếu của bộ sao Thiên Cơ, Thiên Lương đắc địa từ Thìn. Duyên nợ với người bạn đời mang tính chất "tiền định" rất rõ nét. Hai người có thể là bạn bè lâu năm, thanh mai trúc mã, đồng nghiệp, hoặc quen biết qua sự giới thiệu của họ hàng.',
    tags: ['duyên-nợ', 'tiền-định', 'hôn-nhân'],
    strengths: ['duyên-tiền-định'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 62,
    title: 'Chân dung Phối ngẫu',
    section: 'gia-dao',
    content: 'Vợ/chồng mang trọn vẹn nét đẹp của sao Cơ Lương: khuôn mặt thanh tú, hiền hậu, thông minh và có tri thức cao. Phối ngẫu thường là người sinh ra trong gia đình nề nếp, lương thiện, có thể làm các công việc liên quan đến hành chính, giáo dục, tư vấn hoặc y tế.',
    tags: ['phối-ngẫu', 'cơ-lương', 'tri-thức'],
    strengths: ['phối-ngẫu-tốt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 63,
    title: 'Chất lượng Hôn nhân',
    section: 'gia-dao',
    content: 'Cuộc sống hôn nhân nhìn chung rất êm ấm, thịnh vượng và bền vững. Hai vợ chồng lấy nhau dễ dàng, sống có đạo lý, biết tôn trọng và nhường nhịn lẫn nhau. Sự hòa hợp dựa trên nền tảng tri thức và sự thấu hiểu sâu sắc.',
    tags: ['hôn-nhân', 'êm-ấm', 'bền-vững'],
    strengths: ['hôn-nhân-tốt'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 64,
    title: 'Vai trò của Phối ngẫu',
    section: 'gia-dao',
    content: 'Người bạn đời sẽ là một "quân sư" tuyệt vời ở hậu phương. Với sự mưu trí của Thiên Cơ và tính ổn định, bao dung của Thiên Lương, họ không chỉ chăm lo tốt cho gia đình mà còn mang đến cho bạn những lời khuyên chiến lược sắc bén trong công việc.',
    tags: ['phối-ngẫu', 'quân-sư', 'hậu-phương'],
    strengths: ['phối-ngẫu-giỏi'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 65,
    title: 'Thử thách Hôn nhân',
    section: 'gia-dao',
    content: 'Thử thách lớn nhất trong hôn nhân đến từ tính cách khắt khe, cầu toàn của bộ Cơ Lương và bản tính ghen tuông ngầm, hay dò xét của Thiên Cơ. Đôi khi sự nguyên tắc quá mức của người bạn đời có thể khiến không khí gia đình trở nên ngột ngạt.',
    tags: ['hôn-nhân', 'thử-thách', 'cầu-toàn'],
    strengths: [],
    weaknesses: ['cầu-toàn-quá-mức'],
    type: 'weakness'
  },
  {
    id: 66,
    title: 'Đường Con cái (Sinh nở)',
    section: 'gia-dao',
    content: 'Cung Tử Tức tọa tại Dậu có hai hung tinh Liêm Trinh và Phá Quân đồng cung. Đây là dấu hiệu cho thấy đường sinh nở và nuôi dưỡng con cái buổi đầu sẽ gặp nhiều khó khăn, trắc trở, có thể tốn kém nhiều tâm sức.',
    tags: ['con-cái', 'sinh-nở', 'khó-khăn'],
    strengths: [],
    weaknesses: ['sinh-nở-khó-khăn'],
    type: 'warning'
  },
  {
    id: 67,
    title: 'Giới tính và Số lượng con',
    section: 'gia-dao',
    content: 'Liêm Trinh và Phá Quân đều là Bắc đẩu tinh đóng tại cung Âm, do đó bạn có khuynh hướng sinh con gái nhiều hơn con trai. Về số lượng, thường chỉ có từ 1 đến 2 người con.',
    tags: ['con-cái', 'số-lượng', 'giới-tính'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 68,
    title: 'Tính cách & Hiếu đạo của con',
    section: 'gia-dao',
    content: 'Con cái sở hữu cá tính vô cùng mạnh mẽ, bướng bỉnh, độc lập và có phần ngang tàng từ nhỏ. Do ảnh hưởng của Liêm Phá, con cái không thích bị gò bó, quản thúc, và khi trưởng thành rất dễ nảy sinh sự xung khắc, bất đồng quan điểm với cha mẹ.',
    tags: ['con-cái', 'tính-cách', 'bướng-bỉnh', 'xung-khắc'],
    strengths: ['con-mạnh-mẽ'],
    weaknesses: ['con-bướng-bỉnh'],
    type: 'warning'
  },
  {
    id: 69,
    title: 'Tương lai của con cái',
    section: 'gia-dao',
    content: 'Tuy khó dạy bảo lúc nhỏ, nhưng nếu được định hướng đúng đắn, con cái sẽ rất tự lập và có bản lĩnh vươn lên trong nghịch cảnh. Tương lai thích hợp với những công việc mang tính đột phá, kỹ thuật, kinh doanh mạo hiểm hoặc lực lượng vũ trang.',
    tags: ['con-cái', 'tương-lai', 'tự-lập'],
    strengths: ['con-tự-lập'],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 70,
    title: 'Sự gắn kết gia đình nhỏ',
    section: 'gia-dao',
    content: 'Gia đình nhỏ của bạn là một sự bù trừ thú vị. Trong khi bạn (Thiên Đồng) ôn hòa, vợ/chồng (Cơ Lương) nguyên tắc, tri thức, thì con cái (Liêm Phá) lại nổi loạn, phá cách. Điều này đòi hỏi bạn và người phối ngẫu phải sử dụng tối đa sự kiên nhẫn, mưu trí và lòng nhân hậu để nuôi dạy, cảm hóa con cái.',
    tags: ['gia-đình', 'gắn-kết', 'bù-trừ'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },

  // ── PHẦN V: CHIẾN LƯỢC CẢI MỆNH (91–100) ──
  {
    id: 91,
    title: 'Điểm Mạnh nhất',
    section: 'cai-menh',
    content: 'Điểm mạnh cốt lõi và là "vũ khí" lớn nhất của bạn chính là sự thiện lương, nhân hậu (Thiên Đồng thủ Mệnh) kết hợp với trí tuệ tham mưu sắc bén, óc chiến lược học thuật (Thiên Cơ, Thiên Lương ở Quan Lộc). Bạn có khả năng dùng "nhu thắng cương", lấy sự khiêm cung, hòa nhã và đạo lý để thu phục lòng người. Đặc tính "Phúc tinh" giúp bạn thường xuyên gặp được quý nhân che chở, có khả năng biến hung thành cát.',
    tags: ['điểm-mạnh', 'nhân-hậu', 'chiến-lược', 'quý-nhân'],
    strengths: ['nhân-hậu', 'chiến-lược', 'nhu-thắng-cương', 'quý-nhân-phù-trợ'],
    weaknesses: [],
    type: 'strength'
  },
  {
    id: 92,
    title: 'Điểm Yếu chí mạng',
    section: 'cai-menh',
    content: 'Khuyết điểm lớn nhất mà bạn cần phải khắc phục là tâm lý "bất quyết", hay phân vân, thiếu kiên định và dễ "chóng chán". Dưới áp lực đè nén của hoàn cảnh (do Cục Hỏa khắc Mệnh Kim), bạn dễ bị dao động và mệt mỏi khi phải đưa ra các quyết định mang tính bước ngoặt. Nếu không rèn luyện sự bền bỉ, bạn rất dễ bỏ dở những dự án lớn hoặc thay đổi phương hướng khi mới đi được nửa đường.',
    tags: ['điểm-yếu', 'bất-quyết', 'thiếu-kiên-định', 'chóng-chán'],
    strengths: [],
    weaknesses: ['bất-quyết', 'thiếu-kiên-định', 'chóng-chán', 'dễ-bỏ-dở'],
    type: 'weakness'
  },
  {
    id: 93,
    title: 'Bài học Nghiệp quả',
    section: 'cai-menh',
    content: 'Bài học nghiệp quả lớn nhất ở kiếp này là sự nhẫn nại và lòng bao dung trong các mối quan hệ ruột thịt. Bạn sinh ra không chỉ để sống cho riêng mình mà còn để gánh vác, dung hòa những xung khắc thế hệ trong gia đình. Sự nghiệp và nỗ lực rốt cuộc cũng là để xây dựng nền tảng vững chắc và niềm tự hào cho dòng họ.',
    tags: ['nghiệp-quả', 'nhẫn-nại', 'bao-dung', 'gia-đình'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 94,
    title: 'Định hướng Tu dưỡng',
    section: 'cai-menh',
    content: 'Chiến lược tu dưỡng hàng đầu: "Rèn luyện ý chí kim cương trong một vỏ bọc mềm mỏng". Bạn cần học cách đặt ra kỷ luật thép cho bản thân, kiên trì theo đuổi mục tiêu đến cùng để khắc phục nhược điểm thiếu bền chí. Về mặt tâm tính, hãy tiếp tục duy trì bản chất bác ái, "nho phong đạo cốt", chuyên tâm vào con đường học thức, nghiên cứu và cố vấn.',
    tags: ['tu-dưỡng', 'kỷ-luật', 'kiên-trì', 'bác-ái'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 95,
    title: 'Phong thủy Cải mệnh',
    section: 'cai-menh',
    content: 'Bạn mang Mệnh Bạch Lạp Kim, nhưng sinh vào Cục Hỏa tạo thành thế Cục khắc Mệnh. Để dung hòa áp lực này, bạn nên sử dụng hành Thổ làm năng lượng cầu nối (vì Hỏa sinh Thổ, Thổ sinh Kim). Hãy ưu tiên sử dụng các màu sắc thuộc hành Thổ (vàng, nâu đất) và hành Kim (trắng, xám, bạc). Nơi làm việc và nơi ở cần có một thư phòng yên tĩnh, thanh tịnh, nhiều ánh sáng tự nhiên.',
    tags: ['phong-thủy', 'ngũ-hành', 'hành-thổ', 'hành-kim'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 96,
    title: 'Nhân sự Cải mệnh',
    section: 'cai-menh',
    content: 'Do bạn thiên về mưu trí, tham mưu và đôi khi thiếu đi tính hành động quyết liệt, bạn rất cần kết hợp với những người có tính cách mạnh mẽ, thực tế và dứt khoát (như những người có bộ sao Sát - Phá - Tham hoặc Vũ Khúc). Họ sẽ là những người "đứng mũi chịu sào", thay bạn thực thi những kế hoạch xuất sắc. Đặc biệt, nên giữ mối quan hệ tốt với những người lớn tuổi, những vị tiền bối.',
    tags: ['nhân-sự', 'hợp-tác', 'quý-nhân', 'hành-động'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 97,
    title: 'Thời điểm Cải mệnh',
    section: 'cai-menh',
    content: 'Sự thăng hoa rực rỡ nhất nằm ở hậu vận (từ 30 tuổi trở đi), khi Cung Thân tại Phúc Đức chi phối toàn bộ cuộc sống. Tiền vận là quá trình "Hỏa nung Kim" - phải chịu nhiều thử thách, khó khăn. Khi vượt qua được giai đoạn này, bạn sẽ bước vào thời kỳ "Phát quan", vượng tài và có vị thế xã hội vô cùng vững chắc.',
    tags: ['thời-điểm', 'hậu-vận', 'phát-quan', 'hỏa-nung-kim'],
    strengths: ['hậu-vận-rực-rỡ'],
    weaknesses: ['tiền-vận-gian-khó'],
    type: 'info'
  },
  {
    id: 98,
    title: 'Hành động Giải hạn',
    section: 'cai-menh',
    content: 'Phương pháp giải hạn tốt nhất và hiệu nghiệm nhất chính là Hành thiện tích đức. Hãy tích cực làm việc thiện, giúp đỡ cộng đồng, chăm lo chu đáo cho mồ mả tổ tiên và đùm bọc những người thân yếu thế trong gia đình. Những hành động xuất phát từ tâm sẽ kích hoạt tối đa năng lực "giải ách, trừ tai" của bộ sao Thiên Đồng và Thiên Lương.',
    tags: ['giải-hạn', 'hành-thiện', 'tích-đức', 'tổ-tiên'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  },
  {
    id: 99,
    title: 'Chấm điểm Lá số: 8/10',
    section: 'cai-menh',
    content: 'Đây là một lá số thuộc cách "Cơ Nguyệt Đồng Lương" rất đẹp, mang đậm cốt cách của một danh sĩ, bậc quân tử thời nay. Mặc dù tiền vận có phần gian truân do sự cản trở của Cục khắc Mệnh, nhưng nền tảng Mệnh rất vững, Thân tốt và đường Quan Lộc xuất chúng. Đây điển hình là lá số "Tiền bần hậu phú" – Trước vất vả, sau nhàn nhã, càng về hậu vận cuộc sống càng hiển vinh, trường thọ và an lạc.',
    tags: ['tổng-quan', 'đánh-giá', 'cơ-nguyệt-đồng-lương', '8/10'],
    strengths: ['lá-số-đẹp', 'tiền-bần-hậu-phú'],
    weaknesses: ['tiền-vận-gian-truân'],
    type: 'strength'
  },
  {
    id: 100,
    title: 'Thông điệp cuối',
    section: 'cai-menh',
    content: '"Nước chảy đá mòn, lấy nhu thắng cương". Cuộc đời bạn không cần phải ồn ào sát phạt hay dùng mưu mô để tranh đoạt danh lợi. Hãy cứ giữ vững tấm lòng thiện lương, dùng trí tuệ tham mưu để cống hiến, và kiên nhẫn bước qua những ngọn lửa thử thách. Thời gian qua đi, quả ngọt của sự bình an, uy danh sự nghiệp và sự hưng vượng của gia tộc chắc chắn sẽ nằm trọn trong tay bạn.',
    tags: ['thông-điệp', 'nhu-thắng-cương', 'thiện-lương', 'kiên-nhẫn'],
    strengths: [],
    weaknesses: [],
    type: 'info'
  }
];

// Export for use in other modules
window.TUVI_DATA = TUVI_DATA;
window.TUVI_SECTIONS = TUVI_SECTIONS;
