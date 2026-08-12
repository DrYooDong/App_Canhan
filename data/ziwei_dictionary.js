// ============================================
// NỘI TÂM — Từ Điển Luận Giải Tử Vi (Ziwei Dictionary)
// Cung cấp giải nghĩa chi tiết cho các Chính tinh, Phụ tinh, và Cung trên lá số.
// ============================================

window.ZiweiDictionary = (function() {
  'use strict';

  const DICTIONARY = {
    // 14 Chính Tinh (Tích hợp Archetype Jungian & Synchronicity)
    "Tử Vi": {
      type: "Chính Tinh",
      short: "Đế tinh, tượng trưng cho quyền lực, tôn quý và sự che chở.",
      full: "Tử Vi là ngôi sao đứng đầu, mang tính chất của một bậc đế vương. Người có Tử Vi thủ mệnh thường có khí chất đĩnh đạc, thích lãnh đạo, có lòng bao dung nhưng đôi khi khá bảo thủ và độc đoán. Tử Vi mang lại khả năng giải ách, hóa khoa, mang đến sự tôn quý và danh vọng nếu hội tụ đủ quần thần (Tả Hữu, Khôi Việt).",
      archetype: "The Self (Jung) — Bản ngã trung tâm điều phối toàn bộ hệ thống tâm trí và vận mệnh",
      synchronicity: "Thời điểm Tử Vi xuất hiện là lúc vũ trụ yêu cầu bạn bước ra vị trí chủ động, khẳng định thẩm quyền nội tâm và bao dung với tập thể."
    },
    "Thiên Cơ": {
      type: "Chính Tinh",
      short: "Thiện tinh, chủ về trí tuệ, mưu lược và sự linh hoạt.",
      full: "Thiên Cơ là sao của mưu sĩ, tượng trưng cho trí tuệ, sự tính toán và khéo léo. Người có Thiên Cơ thường rất thông minh, nhạy bén, giỏi phân tích. Tuy nhiên, nếu sát tinh xâm phạm, dễ sinh ra lo nghĩ quá nhiều, thần kinh căng thẳng hoặc tính toán thủ đoạn.",
      archetype: "The Sage / The Trickster — Trí tuệ linh hoạt, mưu lược và sự ứng biến",
      synchronicity: "Biểu hiện cho sự đồng bộ của các dòng tư tưởng nhạy bén. Cần cẩn trọng tránh rơi vào suy nghĩ quá mức (overthinking)."
    },
    "Thái Dương": {
      type: "Chính Tinh",
      short: "Quyền tinh, chủ về sự tỏa sáng, danh tiếng và nam giới.",
      full: "Thái Dương mang năng lượng của Mặt Trời, tượng trưng cho sự quang minh chính đại, tính tình bộc trực, hào sảng, thích lo toan cho người khác. Phụ nữ có Thái Dương thủ mệnh thường có tính cách mạnh mẽ, gánh vác việc gia đình.",
      archetype: "Animus / The Sun Hero — Nguyên mẫu năng lượng nam tính tỏa sáng và phụng sự",
      synchronicity: "Sự kiện xảy ra công khai, đòi hỏi minh bạch và lòng hào sảng để vượt qua mọi trở lực."
    },
    "Vũ Khúc": {
      type: "Chính Tinh",
      short: "Tài tinh, chủ về tiền bạc, sự quyết đoán và cô độc.",
      full: "Vũ Khúc là sao quản lý tài chính xuất sắc, tính cách quyết đoán, cương nghị, thực tế. Tuy nhiên, vì quá lý trí và cứng rắn nên Vũ Khúc mang tính cô độc (quả tú tinh), đôi khi gặp khó khăn trong việc thể hiện tình cảm.",
      archetype: "The Ruler / The Hermit — Quyết đoán tài chính nhưng mang nét rèn luyện nội tâm cô độc",
      synchronicity: "Lợi ích vật chất và thử thách tình cảm diễn ra đồng thời, đòi hỏi bạn cân bằng giữa lý trí và cảm xúc."
    },
    "Thiên Đồng": {
      type: "Chính Tinh",
      short: "Phúc tinh, chủ về sự an nhàn, thụ hưởng và trẻ trung.",
      full: "Thiên Đồng tượng trưng cho tính cách trẻ con, lạc quan, thích hưởng thụ, dễ dãi và nhân hậu. Người có Thiên Đồng không thích sự tranh đoạt gay gắt, đôi khi thiếu kiên trì, nhưng bù lại luôn gặp may mắn, có người giúp đỡ.",
      archetype: "Divine Child (Puer Aeternus) — Đứa trẻ vĩnh cửu, sự trong sáng và may mắn nguyên thủy",
      synchronicity: "Nhắc nhở bạn quay về sự thuần khiết ban đầu. May mắn bất ngờ đến khi bạn dừng sự tranh đấu gay gắt."
    },
    "Liêm Trinh": {
      type: "Chính Tinh",
      short: "Tù tinh / Đào hoa tinh, chủ về luật pháp, sự phức tạp và cảm xúc mãnh liệt.",
      full: "Liêm Trinh là ngôi sao phức tạp nhất. Khi tốt, nó là thanh liêm, thẳng thắn, giỏi ngoại giao. Khi xấu, nó là sự cố chấp, cờ bạc, kiện tụng. Nó cũng mang tính chất đào hoa ngầm, tình cảm mãnh liệt và hay ghen.",
      archetype: "The Shadow / The Lover — Vùng bóng tối cảm xúc mãnh liệt và quy tắc ứng xử",
      synchronicity: "Sự trùng hợp thử thách tính kỷ luật và sự trung thực nội tâm. Tránh hành vi nông nổi khi cảm xúc dâng cao."
    },
    "Thiên Phủ": {
      type: "Chính Tinh",
      short: "Lệnh tinh / Khố tinh, chủ về kho tàng, sự cẩn trọng và ổn định.",
      full: "Thiên Phủ như cái kho chứa của cải, người có Thiên Phủ rất biết quản lý tài sản, tính tình cẩn thận, bao dung, thích sự ổn định. Họ có năng lực lãnh đạo nhưng thiên về bảo thủ, phòng thủ hơn là tấn công.",
      archetype: "Great Mother / The Guardian — Người bảo hộ kho tàng và giá trị bền vững",
      synchronicity: "Tích lũy nội lực và duy trì trật tự an toàn trước khi hành động mở rộng."
    },
    "Thái Âm": {
      type: "Chính Tinh",
      short: "Phú tinh, chủ về điền sản, sự tinh tế, nghệ thuật và nữ giới.",
      full: "Thái Âm là Mặt Trăng, tượng trưng cho mẹ, vợ. Người có Thái Âm tinh tế, lãng mạn, thích văn chương nghệ thuật, giỏi tích lũy của cải (đặc biệt là điền sản). Nhược điểm là đôi khi quá nhạy cảm và yếu đuối.",
      archetype: "Anima / The High Priestess — Nguyên mẫu nữ tính, trực giác và vô thức sâu thẳm",
      synchronicity: "Giai đoạn của trực giác, giấc mơ và những thông điệp tinh tế từ chiều sâu tâm thức."
    },
    "Tham Lang": {
      type: "Chính Tinh",
      short: "Đào hoa tinh / Dục tinh, chủ về ham muốn, giao tế và sự đa tài.",
      full: "Tham Lang là ngôi sao của sự ham muốn (cả vật chất lẫn tinh thần), rất khéo léo trong giao tiếp, đa tài đa nghệ. Người có Tham Lang thích sự náo nhiệt, biết hưởng thụ, đôi khi dễ sa đà vào tửu sắc nếu không biết tự chủ.",
      archetype: "The Magician / The Seeker — Sự khát khao trải nghiệm, biến hóa và đa tài",
      synchronicity: "Dung hòa giữa ham muốn trần thế và sự thức tỉnh tâm linh. Học cách chuyển hóa năng lượng dục vọng thành sáng tạo."
    },
    "Cự Môn": {
      type: "Chính Tinh",
      short: "Ám tinh, chủ về ngôn ngữ, thị phi và sự nghiên cứu sâu.",
      full: "Cự Môn liên quan đến cái miệng, người có Cự Môn giỏi ăn nói, hùng biện, phù hợp với nghề giáo dục, luật sư, ngoại giao. Nhưng Cự Môn cũng mang tính chất nghi ngờ, hay săm soi, dễ rước họa từ lời nói (thị phi).",
      archetype: "The Critic / The Examiner — Nhà phân tích phản biện và ánh sáng xua tan nghi ngờ",
      synchronicity: "Lời nói và tư duy có sức mạnh kiến tạo hoặc phá hủy. Cần tìm sự chân thật để ngọc lộ ra khỏi đá."
    },
    "Thiên Tướng": {
      type: "Chính Tinh",
      short: "Ấn tinh, chủ về sự phò tá, lòng trung thành và cái đẹp.",
      full: "Thiên Tướng là tể tướng, rất trung thành, trọng thể diện, thích ăn ngon mặc đẹp. Người Thiên Tướng bao đồng, hay giúp người, tính tình hiền lành nhưng đôi khi thiếu lập trường quyết đoán.",
      archetype: "The Loyal Companion / The Judge — Lòng trung thành, tính đại diện và công lý",
      synchronicity: "Thời điểm cần đứng ra làm gạch nối hòa giải, bảo vệ danh dự và phụng sự lý tưởng cao đẹp."
    },
    "Thiên Lương": {
      type: "Chính Tinh",
      short: "Ấm tinh / Thọ tinh, chủ về sự che chở, tuổi thọ và sự nguyên tắc.",
      full: "Thiên Lương mang dáng dấp của một ông cụ/bà cụ, tính tình nguyên tắc, đạo mạo, thích làm việc thiện, có khả năng hóa giải tai ách. Phù hợp với y học, giáo dục, hoặc công việc thanh tra, giám sát.",
      archetype: "Wise Old Man / The Healer — Bậc trưởng thượng che chở và hóa giải tai ương",
      synchronicity: "Sự xuất hiện của sự hỗ trợ tinh thần hoặc bài học từ kinh nghiệm sống của người đi trước."
    },
    "Thất Sát": {
      type: "Chính Tinh",
      short: "Tướng tinh, chủ về sự uy dũng, khai sáng và cô độc.",
      full: "Thất Sát là vị tướng cầm quân tiên phong, tính cách cương liệt, xông xáo, dám làm dám chịu. Cuộc đời Thất Sát thường trải qua nhiều thăng trầm, gian nan trước khi thành công. Tính cô độc cao, ít người hiểu thấu.",
      archetype: "The Warrior / The Pioneer — Kẻ khai phá dũng cảm, quyết đoán vượt sóng gió",
      synchronicity: "Đột phá ra khỏi vùng an toàn. Dũng cảm đối mặt với thử thách cá nhân để tự khẳng định."
    },
    "Phá Quân": {
      type: "Chính Tinh",
      short: "Hao tinh, chủ về sự phá hoại, thay đổi và tiên phong.",
      full: "Phá Quân là ngôi sao phá cũ lập mới. Người có Phá Quân rất can đảm, thích sự đổi mới, không chịu ngồi yên. Nhược điểm là tính tình nóng nảy, tiêu xài hoang phí, cuộc đời nhiều biến động lớn.",
      archetype: "The Rebel / The Transformer — Kẻ tái thiết, đập bỏ khuôn mẫu cũ để đổi mới",
      synchronicity: "Sự kết thúc của một chu kỳ cũ để nhường chỗ cho trật tự mới tái sinh."
    },

    // 12 Cung
    "Mệnh": {
      type: "Cung Chức năng",
      short: "Trung tâm của lá số, đại diện cho bản ngã, tính cách, ngoại hình và tư chất bẩm sinh.",
      full: "Cung Mệnh là cốt lõi của lá số Tử Vi. Nó phản ánh bản tính, ngoại hình, năng khiếu và quỹ đạo chung của cuộc đời bạn. Mọi cung khác đều phải được luận đoán dựa trên sự đối chiếu với cung Mệnh."
    },
    "Huynh Đệ": {
      type: "Cung Chức năng",
      short: "Mối quan hệ với anh em ruột thịt, bạn bè chí cốt hoặc đối tác làm ăn.",
      full: "Cung Huynh Đệ cho biết tình cảm, sự giúp đỡ hay tranh chấp giữa bạn và anh em. Trong xã hội hiện đại, nó cũng tượng trưng cho người hợp tác kinh doanh hoặc đồng nghiệp thân thiết."
    },
    "Phu Thê": {
      type: "Cung Chức năng",
      short: "Mối quan hệ hôn nhân, tính cách người phối ngẫu và đời sống tình cảm.",
      full: "Phu Thê thể hiện gu chọn bạn đời, tính cách của vợ/chồng bạn, và mức độ hòa hợp trong hôn nhân. Nó cũng cho biết bạn có dễ kết hôn hay gặp trắc trở trong tình cảm hay không."
    },
    "Tử Tức": {
      type: "Cung Chức năng",
      short: "Chủ về con cái, hậu bối, học trò hoặc nhân viên cấp dưới.",
      full: "Cung Tử Tức không chỉ dự đoán số lượng, giới tính hay sự hiếu thuận của con cái, mà còn phản ánh mối quan hệ của bạn với những người nhỏ tuổi hơn mình (nhân viên, học trò) và khả năng sinh lý."
    },
    "Tài Bạch": {
      type: "Cung Chức năng",
      short: "Quan niệm về tiền bạc, năng lực kiếm tiền và cách chi tiêu.",
      full: "Tài Bạch không hẳn chỉ số lượng tài sản (đó là cung Điền Trạch), mà chỉ 'dòng tiền' (cash flow). Nó cho biết bạn kiếm tiền bằng cách nào, dễ hay khó, và thói quen tiêu xài của bạn ra sao."
    },
    "Tật Ách": {
      type: "Cung Chức năng",
      short: "Sức khỏe thể chất, tâm lý và những tai ách có thể gặp phải.",
      full: "Tật Ách là nơi ẩn chứa những điểm yếu về sức khỏe của bạn. Nó cho biết các bộ phận cơ thể dễ mắc bệnh, cũng như những tai nạn, nghiệp chướng hoặc muộn phiền trong tâm trí."
    },
    "Thiên Di": {
      type: "Cung Chức năng",
      short: "Môi trường bên ngoài, cơ hội xã hội và những chuyến đi.",
      full: "Thiên Di là cung đối xung với Mệnh. Nó thể hiện hình ảnh của bạn trong mắt xã hội, những cơ hội hay rủi ro khi bạn ra ngoài giao tiếp, đi xa, xuất ngoại hoặc chuyển đổi môi trường sống."
    },
    "Giao Hữu": {
      type: "Cung Chức năng",
      short: "Mối quan hệ với bạn bè xã hội, đồng nghiệp, cấp dưới hoặc người hâm mộ.",
      full: "Cung Nô Bộc (Giao Hữu) cho biết mức độ rộng rãi của mạng lưới quan hệ xã hội. Bạn có được người khác tôn trọng, giúp đỡ hay dễ bị phản bội, lợi dụng."
    },
    "Quan Lộc": {
      type: "Cung Chức năng",
      short: "Thái độ với công việc, con đường sự nghiệp và định hướng chuyên môn.",
      full: "Quan Lộc thể hiện môi trường làm việc phù hợp, năng lực thăng tiến, và khát vọng công danh của bạn. Nó trả lời câu hỏi: Bạn nên làm nghề gì và có làm sếp được không?"
    },
    "Điền Trạch": {
      type: "Cung Chức năng",
      short: "Bất động sản, tài sản tích lũy, nơi ở và môi trường gia đình.",
      full: "Điền Trạch là kho lưu trữ của cải cuối cùng. Nó cho biết bạn có duyên với nhà đất hay không, môi trường sống ra sao, và thậm chí là nền tảng gia đình (phong thủy nơi ở)."
    },
    "Phúc Đức": {
      type: "Cung Chức năng",
      short: "Thế giới tinh thần, phước báu dòng họ và sự thụ hưởng cuộc sống.",
      full: "Cung Phúc Đức là gốc rễ của lá số, chi phối sự máy rủi. Nó đại diện cho chỉ số hạnh phúc (EQ), sự an yên trong tâm hồn, thói quen sở thích và âm phù dương trợ từ tổ tiên."
    },
    "Phụ Mẫu": {
      type: "Cung Chức năng",
      short: "Mối quan hệ với cha mẹ, cấp trên, hoặc các yếu tố pháp lý, giấy tờ.",
      full: "Phụ Mẫu không chỉ xem về tuổi thọ, tình cảm của cha mẹ đối với bạn, mà còn đại diện cho sự bảo bọc, sếp trực tiếp, hoặc các vấn đề liên quan đến giấy tờ, pháp luật, bằng cấp."
    },

    // LỤC SÁT TINH (Sát Tinh & Archetypes)
    "Kình Dương": {
      type: "Sát Tinh",
      short: "Hình tinh, chủ về sự dũng mãnh, hình đao, sự va chạm hoặc đột phá.",
      full: "Kình Dương như mũi kiếm sắc bén. Khi đắc địa, nó mang lại sức mạnh tiên phong, quyết đoán và kiên cường vượt trở lực. Khi hãm địa, nó biểu hiện qua sự nôn nóng, va chạm, tổn thương hoặc tai nạn.",
      archetype: "The Executioner / The Spear Head — Năng lượng hành đao tiên phong",
      synchronicity: "Đòi hỏi bạn phải dứt khoát đưa ra quyết định cắt bỏ các liên kết thừa thãi."
    },
    "Đà La": {
      type: "Sát Tinh",
      short: "Kỵ tinh, chủ về sự trì trệ, dai dẳng, kiên trì hoặc vướng mắc.",
      full: "Đà La là dây xích kéo lùi. Đắc địa thì thâm trầm kiên nhẫn; hãm địa thì tạo ra sự u uất, suy nghĩ dai dẳng không thoát ra được.",
      archetype: "The Anchor / The Delayer — Lực cản kiên trì rèn luyện tính nhẫn nại",
      synchronicity: "Nhắc nhở bạn chậm lại để gia cố nền móng trước khi muốn tăng tốc."
    },
    "Hỏa Tinh": {
      type: "Sát Tinh",
      short: "Hát tinh, chủ về ngọn lửa bùng phát, nôn nóng, hoạnh phát.",
      full: "Hỏa Tinh mang năng lượng nhiệt độ cao. Khi đắc địa kết hợp Tham Lang sẽ gây hoạnh phát tài lộc. Khi hãm địa gây bốc đồng, quyết định sai lầm.",
      archetype: "The Spark / The Catalyst — Chất xúc tác bùng nổ năng lượng nhanh",
      synchronicity: "Thử thách khả năng kiềm chế cơn giận và tận dụng thời cơ bùng nổ."
    },
    "Linh Tinh": {
      type: "Sát Tinh",
      short: "Âm Hỏa, chủ về sự thâm trầm, lo lắng âm ỉ, dũng mãnh ngầm.",
      full: "Linh Tinh mang tính ngầm. Khi đắc địa là mưu dũng; khi hãm địa dễ sinh ra tâm lý tự dằn dỗi, căng thẳng thần kinh.",
      archetype: "The Whispering Flame — Ngọn lửa ngầm chấn động chiều sâu tâm thức",
      synchronicity: "Lắng nghe những cảnh báo thầm lặng từ trực giác."
    },
    "Địa Không": {
      type: "Sát Tinh",
      short: "Không tinh, chủ về sự hư không, sáng tạo đột phá, biến động.",
      full: "Địa Không mang tính giải phóng mọi ranh giới. Đắc địa biến bạn thành thiên tài tưởng tượng sáng tạo; hãm địa dễ gây hao hụt bất ngờ.",
      archetype: "The Void / The Innovator — Không gian hư không kiến tạo ý tưởng mới",
      synchronicity: "Chấp nhận sự buông bỏ để đón nhận cái mới vĩ đại hơn."
    },
    "Địa Kiếp": {
      type: "Sát Tinh",
      short: "Kiếp tinh, chủ về sự hoạnh phát hoạnh phá, cá tính táo bạo.",
      full: "Địa Kiếp đại diện cho sự bứt phá khỏi khuôn mẫu. Đắc địa ở Tứ Mộ đem lại tài lộc bất ngờ; hãm địa làm cho công việc thăng trầm.",
      archetype: "The Disruptor — Kẻ gây rối trật tự để tái thiết thế giới",
      synchronicity: "Nhìn nhận các biến cố như cơ hội tái cấu trúc lại cuộc sống."
    },

    // TỨ HÓA (Tứ Hóa Biến Hóa)
    "Hóa Lộc": {
      type: "Tứ Hóa",
      short: "Chủ về tài lộc, cơ hội, duyên lành và sự gia tăng.",
      full: "Hóa Lộc mang năng lượng Mộc đới Thổ, mang đến may mắn, tài lộc, sự ngọt ngào và khả năng phục hồi năng lượng mạnh mẽ.",
      archetype: "Abundance / The Benefactor — Dòng chảy thịnh vượng và cơ hội",
      synchronicity: "Sự kiện mang lại lộc tài bất ngờ khi bạn biết sẻ chia."
    },
    "Hóa Quyền": {
      type: "Tứ Hóa",
      short: "Chủ về uy quyền, sức mạnh, sự làm chủ và năng lực tự quyết.",
      full: "Hóa Quyền giúp nâng cao vị thế xã hội, tăng cường sức ảnh hưởng và khả năng quản lý trong công việc.",
      archetype: "Sovereignty / The Commander — Uy quyền và khả năng làm chủ vận mệnh",
      synchronicity: "Khẳng định bản lĩnh và nhận trách nhiệm lãnh đạo."
    },
    "Hóa Khoa": {
      type: "Tứ Hóa",
      short: "Chủ về danh tiếng, khoa giáp, giải ách và trí tuệ.",
      full: "Hóa Khoa là ngôi sao giải hạn đệ nhất. Nó đem lại sự nhẹ nhàng, danh tiếng lành mạnh, tri thức và sự giúp đỡ quý báu.",
      archetype: "Wisdom / The Academic — Trí tuệ soi sáng và khả năng chữa lành",
      synchronicity: "Sự thấu hiểu tri thức mở ra lối thoát cho mọi bế tắc."
    },
    "Hóa Kỵ": {
      type: "Tứ Hóa",
      short: "Chủ về rắc rối, bài học kinh nghiệm, sự bám chấp và giữ của.",
      full: "Hóa Kỵ không chỉ là xui xẻo. Nó đại diện cho nơi bạn dồn tâm trí nhiều nhất, bài học lớn nhất mà bạn cần vượt qua.",
      archetype: "The Catalyst Lesson / The Knot — Nút thắt tâm lý và bài học thức tỉnh",
      synchronicity: "Nhìn thấu qua sự vướng mắc để tìm thấy cơ hội tăng trưởng tâm linh."
    }
  };

  return {
    getTerm: function(term) {
      if (!term) return null;
      let cleanTerm = term.replace(/\([A-ZĐ]\)/g, "").trim(); // Remove (V), (M), (H), (Đ)
      return DICTIONARY[cleanTerm] || null;
    },
    getAllTerms: function() {
      return Object.keys(DICTIONARY);
    }
  };
})();
