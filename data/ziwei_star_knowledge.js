// ============================================
// NỘI TÂM — Từ Điển Tri Thức Chi Tiết 14 Chính Tinh Tử Vi
// Nguồn: 倪海厦《天纪》+ 《紫微斗数全书》《骨髓赋》
// ============================================

window.ZiweiStarKnowledge = (function() {
  'use strict';

  const STAR_DETAILS = {
    'Tử Vi': {
      niHaixia: 'Tử Vi là Đế Vương tinh, người thủ Mệnh có khí chất cô cao, thích độc lập, không thích bị kiềm cặp. Tử Vi cần Tả Phù Hữu Bật kẹp hoặc hội chiếu mới phát huy uy quyền đế vương, nếu không chỉ là cô quân, phú mà không quý. Tử Vi kỵ gặp Kình Dương, Đà La, Hỏa Tinh, Linh Tinh đồng cung (gia sát thì cô quý).',
      classical: 'Ancient Quote: "Tử Vi đế tọa lâm mệnh chủ tôn quý, thống lĩnh chúng tinh, tọa mệnh giả chủ uy quyền hiển đạt." (Tử Vi giữ Mệnh chủ về tôn quý, thống lĩnh các sao, đứng đầu uy quyền).',
      bestPalace: 'Cung Mệnh (Thìn, Tuất), Cung Quan Lộc',
      worstPalace: 'Cung Tật Ách, Cung Phu Thê',
      career: 'Chính giới, Quản lý cấp cao, Doanh nhân độc lập. Khí chất đế vương thiên bẩm, hợp lãnh đạo độc lập một phương.',
      relationship: 'Tình cảm bị động, tự trọng cao, cần đối phương chủ động. Có xu hướng cô độc, nên kết hôn muộn.',
      wealth: 'Tài vận ổn định, thủ thành mạnh hơn tiến thủ. Cư Thìn Tuất tài quan song mỹ, hợp đầu tư tích lũy.',
      health: 'Thuộc Thổ, chú ý tỳ vị, hệ tiêu hóa. Tránh quá lao lực, nên giữ sinh hoạt điều độ.'
    },
    'Thiên Cơ': {
      niHaixia: 'Thiên Cơ là Tham Mưu tinh, sao thông minh nhất nhưng thông minh phát lộ quá thì hại thân. Thiên Cơ Hóa Kỵ nguy hiểm nhất, đại diện thông minh phản bị thông minh hại. Thuộc Mộc, linh hoạt善变, ở Mệnh tư duy敏捷 nhưng nhiều mưu thiếu quyết, nên xa quê hương phát triển.',
      classical: 'Ancient Quote: "Thiên Cơ cư miếu vượng địa, chủ nhân sinh tinh minh, thiện sách hoạch; cư hãm địa tắc ảm đạm." (Thiên Cơ cư miếu vượng mưu trí mẫn tiệp, cư hãm địa tính khí thất thường).',
      bestPalace: 'Cung Mệnh (Mão), Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê',
      career: 'Chuyên gia kỹ thuật, Cố vấn, Nghiên cứu viên, IT, Lập kế hoạch. Dùng não hơn dùng sức, hợp rời xa quê hương.',
      relationship: 'Tình cảm đa biến, suy nghĩ quá nhiều, khó chuyên nhất. Nên kết hôn muộn, sau kết hôn cần buông bỏ tư lự.',
      wealth: 'Kiếm tiền bằng trí tuệ và kỹ năng, không giỏi giữ tiền, lấy ngành nghề chuyên môn làm gốc thì tài vận ổn định.',
      health: 'Thuộc Mộc, chú ý gan mật, hệ thần kinh. Suy nghĩ quá độ dễ mất ngủ, nên luyện thiền định.'
    },
    'Thái Dương': {
      niHaixia: 'Thái Dương là sao đại nam nhân, từ Mão đến Ngọ nhập miếu, quang minh chính đại; sau Ngọ dần rơi vào hãm địa. Thái Dương tọa Mệnh rộng rãi hiếu thắng, nam mệnh rất hợp, nữ mệnh quá mạnh mẽ. Đại diện cho cha và người trưởng bối.',
      classical: 'Ancient Quote: "Thái Dương cư Ngọ vi nhập miếu, quang huy đại phóng, chủ quý hiển, nam mệnh tối giai." (Thái Dương ở Ngọ là Nhật Lệ Trung Thiên, nam mệnh đại quý).',
      bestPalace: 'Cung Mệnh (Mão đến Ngọ), Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê (Nữ Mệnh), Cung Tật Ách',
      career: 'Công chức, Chính giới, Truyền thông, Giáo dục, Quan hệ công chúng. Thích đứng trước đám đông.',
      relationship: 'Nam mệnh đào hoa, nữ mệnh độc lập mạnh mẽ. Hôn nhân cần nhẫn nại磨合, nên tìm bạn đời ôn hòa.',
      wealth: 'Tài vận dựa vào nỗ lực, hào phóng thích bố施, không giỏi tích lũy; nhập miếu tài vận vượng.',
      health: 'Thuộc Hỏa, chú ý tim mạch, mắt. Khi rơi hãm địa dễ quá sức, cần chú ý nghỉ ngơi.'
    },
    'Vũ Khúc': {
      niHaixia: 'Vũ Khúc là Tài Bạch chủ tinh, cứng cỏi không khuất phục, sợ nhất cô khắc. Người Vũ Khúc tọa Mệnh ý chí kiên định, hợp tài chính, quản lý tiền bạc, nhưng tính tình quá thẳng thắn dễ làm tổn thương người khác.',
      classical: 'Ancient Quote: "Vũ Khúc thuộc kim, cương cường chi tính, nhất sinh đa hình khắc; thủ mệnh vu vượng địa, xuất tướng nhập tướng." (Vũ Khúc là sao tài kim, tính cương quyết).',
      bestPalace: 'Cung Mệnh (Thìn, Tuất, Sửu, Mùi), Cung Tài Bạch, Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê',
      career: 'Tài chính, Ngân hàng, Quân cảnh, Kế toán, Kỹ thuật. Thực hành cực mạnh, hợp lĩnh vực cần quyết đoán.',
      relationship: 'Tình cảm thẳng thắn, thiếu lãng mạn, cần bạn đời dịu dàng bù trừ, kỵ cô khắc.',
      wealth: 'Tài tinh bản mệnh, tài vận cực mạnh, năng lực quản lý tài chính vượt trội.',
      health: 'Thuộc Kim, chú ý phổi, hệ hô hấp, răng. Hóa Kỵ cần phòng va chạm huyết quang.'
    },
    'Thiên Đồng': {
      niHaixia: 'Thiên Đồng là Phúc tinh, sao hưởng thụ nhất. Thiên Đồng tọa Mệnh thích hưởng phúc, không thích cạnh tranh tranh giành, hợp công việc ổn định. Thiên Đồng Hóa Lộc là hóa lộc đẹp nhất, chủ cả đời y thực vô ưu.',
      classical: 'Ancient Quote: "Thiên Đồng vi phúc đức chi tinh, tọa mệnh giả hưởng phúc hữu dư, chủ nhất sinh tiêu dao tự tại." (Thiên Đồng là sao phúc đức, đời sống an nhàn).',
      bestPalace: 'Cung Mệnh, Cung Phúc Đức',
      worstPalace: 'Cung Quan Lộc',
      career: 'Dịch vụ, Giải trí, Ẩm thực, Văn nghệ. Môi trường thoải mái vui vẻ phù hợp nhất, kỵ áp lực cao.',
      relationship: 'Tình cảm ôn hòa, bị động, dễ chấp nhận, hôn nhân tương đối ổn định, tính cách hòa nhã.',
      wealth: 'Tài vận không nổi bật nhưng ổn định theo lương, ăn mặc không lo nhưng khó đại phú.',
      health: 'Thuộc Thủy, chú ý thận, bàng quang. Thể chất yếu hơn, nên vận động vừa sức.'
    },
    'Liêm Trinh': {
      niHaixia: 'Liêm Trinh là Thứ Đào Hoa, tài hoa tràn đầy nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ rất hung (kiện tụng, tù tội, tai nạn). Liêm Trinh phối Thiên Tướng thì hóa hung thành cát thành Hành Chính Ấn Thụ cách.',
      classical: 'Ancient Quote: "Liêm Trinh vi thứ đào hoa, tài hoa hoành dật, tình cảm đa ba chiết; Liêm Tướng đồng cung, hóa hung vi cát." (Liêm Trinh đào hoa, tài nghệ xuất chúng).',
      bestPalace: 'Cung Quan Lộc (gặp Thiên Tướng), Cung Mệnh (khi Hóa Lộc)',
      worstPalace: 'Cung Mệnh (khi Hóa Kỵ), Cung Phu Thê',
      career: 'Nghệ thuật, Giải trí, Pháp luật, Công chức. Tài năng xuất chúng, cần giữ chính đạo mới lâu dài.',
      relationship: 'Nhiều đào hoa, tình cảm phức tạp, dễ vướng rắc rối tình cảm, nên kết hôn muộn.',
      wealth: 'Tài vận biến động, kiếm tiền bằng tài năng, khi Hóa Kỵ phòng rủi ro pháp lý tài chính.',
      health: 'Thuộc Hỏa, chú ý tim mạch, huyết áp, dị ứng da. Phòng kiện tụng nóng giận.'
    },
    'Thiên Phủ': {
      niHaixia: 'Thiên Phủ là Tài Khoa tinh, sao hiền lành điềm đạm, chủ sinh离 không tử biệt. Người Thiên Phủ tọa Mệnh tính tình vững vàng, thủ thành giỏi, quản lý tài chính có nguyên tắc, công việc bảo thủ ổn định.',
      classical: 'Ancient Quote: "Thiên Phủ vi tài khố chi tinh, tính tình ôn hòa, tư văn nhã trí." (Thiên Phủ giữ kho tài, tính cẩn trọng vững vàng).',
      bestPalace: 'Cung Mệnh, Cung Tài Bạch, Cung Điền Trạch',
      worstPalace: 'Cung Tật Ách',
      career: 'Quản lý tài chính, Ngân hàng, Bất động sản, Hành chính. Ổn định bảo thủ.',
      relationship: 'Tình cảm điềm tĩnh, ít sóng gió nhưng thiếu sự đột phá lãng mạn.',
      wealth: 'Khả năng tích lũy cực mạnh, tích tiểu thành đại, tài sản gia tăng bền vững.',
      health: 'Thuộc Thổ, chú ý dạ dày, đường tiêu hóa.'
    },
    'Thái Âm': {
      niHaixia: 'Thái Âm đại diện cho Mẹ, Vợ và Nữ giới. Nhập miếu từ Mùi đến Tý, sáng rực rỡ; hãm địa từ Dần đến Ngọ. Thái Âm tọa Mệnh tính tình dịu dàng, tinh tế, giàu tình cảm, tài vận dịu dàng tích lũy.',
      classical: 'Ancient Quote: "Thái Âm vi phú tinh, chủ điền trạch tài sản, tính tình như thủy dịu dàng." (Thái Âm chủ tài phú điền sản, dịu dàng sâu sắc).',
      bestPalace: 'Cung Mệnh (Hợi, Tý), Cung Tài Bạch, Cung Điền Trạch',
      worstPalace: 'Cung Mệnh (rơi Hãm địa)',
      career: 'Tài chính, Bất động sản, Thiết kế, Văn nghệ, Y tế. Tinh tế sâu sắc.',
      relationship: 'Dịu dàng chu đáo,重 tình cảm, nhưng đôi khi nhạy cảm quá đỗi.',
      wealth: 'Tài tinh bất động sản, tích lũy nhà đất và vốn đầu tư dài hạn rất tốt.',
      health: 'Thuộc Thủy, chú ý mắt, âm huyết, hệ nội tiết.'
    },
    'Tham Lang': {
      niHaixia: 'Tham Lang là Chính Đào Hoa tinh, cũng chủ về Tửu Sắc Tài Khí và đa tài đa nghệ. Tham Lang gặp Hỏa Tinh/Linh Tinh thành Hỏa Tham/Linh Tham cách bạo phát hoành tài.',
      classical: 'Ancient Quote: "Tham Lang vi đào hoa chi tinh, đa tài đa nghệ, dục vọng vượng thịnh." (Tham Lang đào hoa, ham học hỏi đa tài).',
      bestPalace: 'Cung Mệnh (gặp Hỏa/Linh), Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê',
      career: 'Kinh doanh, Quan hệ công chúng, Nghệ thuật, Giải trí, Đầu tư.',
      relationship: 'Đào hoa vượng, sức hút lớn, cần tiết chế dục vọng và cảm xúc.',
      wealth: 'Hoành tài, cơ hội bùng nổ tài lộc nhanh chóng khi gặp Hỏa Linh.',
      health: 'Thuộc Mộc/Thủy, chú ý gan mật, hệ sinh dục.'
    },
    'Cự Môn': {
      niHaixia: 'Cự Môn là Khẩu Lưỡi chi tinh, chủ về thị phi nhưng cũng chủ về khẩu tài luận biện. Cự Môn cần Thái Dương chiếu sáng để hóa giải ám khí.',
      classical: 'Ancient Quote: "Cự Môn vi ám tinh, chủ khẩu thị phi, đắc Thái Dương照 diệu tắc hóa vi quyền quý." (Cự Môn khẩu tài sắc bén).',
      bestPalace: 'Cung Quan Lộc, Cung Mệnh (gặp Thái Dương miếu)',
      worstPalace: 'Cung Phu Thê, Cung Nô Bộc',
      career: 'Luật sư, Giáo viên, Diễn giả, Ngoại giao, Ngôn ngữ.',
      relationship: 'Dễ nảy sinh tranh cãi khẩu舌, cần học cách lắng nghe.',
      wealth: 'Vất vả bằng lời nói khẩu tài mới sinh tài lộc.',
      health: 'Thuộc Thủy, chú ý hô hấp, cuống họng, răng miệng.'
    },
    'Thiên Tướng': {
      niHaixia: 'Thiên Tướng là Ấn Thụ tinh, sao phụ tá trung thành, công bình chính trực, giữ nguyên tắc.',
      classical: 'Ancient Quote: "Thiên Tướng vi ấn tinh, trợ nhân vi nhạc, tính tình trung hậu." (Thiên Tướng trung hậu, tay hòm chìa khóa).',
      bestPalace: 'Cung Quan Lộc, Cung Mệnh',
      worstPalace: 'Cung Tật Ách',
      career: 'Trợ lý cao cấp, Quản trị, Nhân sự, Pháp chế.',
      relationship: 'Chân thành, coi trọng lời hứa, có trách nhiệm.',
      wealth: 'Thu nhập ổn định từ công việc hành chính quản lý.',
      health: 'Thuộc Thủy, chú ý hệ bài tiết, da.'
    },
    'Thiên Lương': {
      niHaixia: 'Thiên Lương là Ấm Tinh (sao che chở) và Y Dược tinh, giải ách trừ nguy.',
      classical: 'Ancient Quote: "Thiên Lương vi ấm tinh, giải tai trừ nguy, chủ thọ khảo." (Thiên Lương sống thọ, hay giúp người).',
      bestPalace: 'Cung Mệnh, Cung Phúc Đức, Cung Phụ Mẫu',
      worstPalace: 'Cung Tài Bạch',
      career: 'Y dược, Từ thiện, Nông nghiệp, Cố vấn, Giáo dục.',
      relationship: 'Như người anh/chị che chở bạn đời.',
      wealth: 'Không cầu đại phú nhưng luôn có quý nhân che chở tiền bạc.',
      health: 'Thuộc Thổ, thọ trường, ít bệnh nặng.'
    },
    'Thất Sát': {
      niHaixia: 'Thất Sát là Tướng Tinh, độc lập quyết đoán, xông phong nhận lĩnh.',
      classical: 'Ancient Quote: "Thất Sát vi tướng tinh, dũng mãnh quả quyết, chủ thanh danh." (Thất Sát dũng mãnh, mở đường khai sáng).',
      bestPalace: 'Cung Mệnh (Dần/Thân), Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê',
      career: 'Quân đội, Công an, Kỹ thuật nặng, Lãnh đạo dự án.',
      relationship: 'Cương trực, yêu ghét rõ ràng, nên lùi lại một bước.',
      wealth: 'Tài vận đến từ sự xông xáo quyết đoán.',
      health: 'Thuộc Kim, chú ý chấn thương, phổi.'
    },
    'Phá Quân': {
      niHaixia: 'Phá Quân là Hao Tinh, tiền phong phá旧 lập tân, thích đột phá.',
      classical: 'Ancient Quote: "Phá Quân vi hao tinh, dũng vu khai sáng, phá旧 lập tân." (Phá Quân tiên phong, dám làm dám chịu).',
      bestPalace: 'Cung Quan Lộc',
      worstPalace: 'Cung Phu Thê, Cung Điền Trạch',
      career: 'Khởi nghiệp, Đột phá công nghệ, Xây dựng, Sáng tạo.',
      relationship: 'Biến động lớn, thích tự do.',
      wealth: 'Tài sản hao rồi lại đơm, thích mạo hiểm.',
      health: 'Thuộc Thủy, chú ý thận, chấn thương tay chân.'
    }
  };

  function getStarDetail(starName) {
    return STAR_DETAILS[starName] || null;
  }

  return {
    getStarDetail,
    STAR_DETAILS
  };
})();
