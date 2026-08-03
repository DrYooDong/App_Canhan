// ============================================
// NỘI TÂM — Engine Phân Tích Hôn Nhân & Hợp Bàn Tử Vi
// Nguồn: 倪海厦《天纪》 (Phu Thê + Phúc Đức Song Cung)
// ============================================

window.ZiweiMarriageKnowledge = (function() {
  'use strict';

  const STAR_IN_FUQI = {
    'Tử Vi': {
      summary: 'Phối ngẫu cao ngạo năng nổ, nên kết hôn muộn, tình cảm dựa trên sự tôn trọng',
      good: 'Tam phương có Phụ Bật giáp/chiếu: Bạn đời hiền năng, sau kết hôn được trợ lực; Tam hợp見Lộc chủ tài lộc song toàn.',
      bad: 'Cô quân vô phụ: Bạn đời强势 khó giao tiếp; Cư Thìn Tuất tình phân nhạt nhẽo; Gia Sát: Trước kết hôn nhiều trắc trở.',
      spouse_traits: 'Bạn đời khí chất cao ngạo, có chủ kiến, tự trọng mạnh, năng lực cao nhưng ít khi bộc lộ cảm xúc.',
      timing: 'Nên kết hôn muộn (Nam trên 30, Nữ trên 27), kết hôn sớm dễ nhiều va chạm.',
      niQuote: 'Tử Vi ở Phu Thê, cô khắc, nên kết hôn muộn, tình cảm tốt nhưng chi phí giao tiếp cao.'
    },
    'Thiên Cơ': {
      summary: 'Hôn nhân đa biến, nên chọn bạn đời lệch tuổi nhiều',
      good: 'Gặp Lộc Tồn hoặc Hóa Lộc: Tình cảm duy trì ổn định; Hội Thái Âm: Thêm phần tinh tế dịu dàng.',
      bad: 'Hóa Kỵ hoặc hội Sát: Tình cảm biến động lớn, dễ phân ly; Thiên Cơ thiện biến, bạn đời không dứt khoát.',
      spouse_traits: 'Bạn đời thông minh đa trí, suy nghĩ tinh tế, có duyên triết học tôn giáo, đôi khi hơi nhạy cảm.',
      timing: 'Nên chênh lệch tuổi tác lớn (trên 6 tuổi) giúp giảm bớt xung đột.',
      niQuote: 'Thiên Cơ thiện biến, không nên độc thủ, hôn nhân nhiều biến số.'
    },
    'Thái Dương': {
      summary: 'Nam mệnh trợ thê, Nữ mệnh vượng phu; rơi hãm địa Hóa Kỵ lại chủ hình khắc',
      good: 'Miếu vượng (Mão đến Ngọ): Bạn đời giỏi giang, nam mệnh có hiền nội trợ, nữ mệnh lấy chồng vượng.',
      bad: 'Rơi hãm (Dậu đến Dần): Nam mệnh bạn đời bệnh yếu, nữ mệnh lấy chồng bình thường; Hóa Kỵ: Nữ mệnh vất vả vì chồng.',
      spouse_traits: 'Bạn đời cởi mở rộng rãi, có ý thức hình ảnh công chúng, đôi khi hơi强势.',
      timing: 'Tình cảm lúc đầu nồng nhiệt sau điềm tĩnh, giữ khoảng cách tôn trọng.',
      niQuote: 'Thái Dương Hóa Kỵ ở Phu Thê nữ mệnh: Thường có giai đoạn gánh vác lớn cho bạn đời.'
    },
    'Vũ Khúc': {
      summary: 'Sao Quả Túc, hôn nhân cô khắc, một lòng nên kết hôn muộn',
      good: 'Vũ Khúc Hóa Lộc: Bạn đời có năng lực kiếm tiền; Gặp Lộc Tồn giáp phò: Hôn nhân vững vàng giàu có.',
      bad: 'Hóa Kỵ: Cô quả, khó kết hôn; Vũ Sát (Mão Dậu): Hôn nhân sóng gió; Vũ Phá: Gia sát hình hại.',
      spouse_traits: 'Bạn đời cương trực độc lập, nói năng trực tiếp, không giỏi nịnh nọt, kinh tế mạnh.',
      timing: 'Hệ Vũ Khúc nên kết hôn sau 30 tuổi, kết hôn sớm dễ giải tán.',
      niQuote: 'Vũ Khúc Hóa Kỵ là sao hình tù cô khắc, hệ Vũ Khúc ở Phu Thê nên kết hôn muộn.'
    },
    'Thiên Đồng': {
      summary: 'Bạn đời ôn hòa hưởng lạc, nên chênh lệch tuổi tác lớn',
      good: 'Gặp Lộc Tồn hoặc Hóa Lộc: Bạn đời ôn hòa mang tài, gia đình an ổn; Đồng Âm: Tình cảm dịu dàng.',
      bad: 'Hóa Kỵ: Tình cảm ban đầu tốt sau nhạt dần; Gặp nhiều Sát: Bạn đời lười biếng thành gánh nặng.',
      spouse_traits: 'Bạn đời ôn hòa thiện lương, tùy duyên, thích hưởng thụ cuộc sống an nhàn.',
      timing: 'Nam lấy vợ nhỏ tuổi, Nữ lấy chồng lớn tuổi (chênh 8 tuổi trở lên là đẹp nhất).',
      niQuote: 'Thiên Đồng ở Phu Thê là phúc tinh nhưng tránh lười biếng thụ động.'
    },
    'Liêm Trinh': {
      summary: 'Cung Phu Thê biến động mạnh nhất, tình cảm cần sinh hoạt lý trí',
      good: 'Liêm Phủ (Tý Ngọ): Bạn đời ôn hòa thanh tú, tình cảm khá ổn định, công chức.',
      bad: 'Liêm Tham / Liêm Phá / Liêm Sát gia Sát Kỵ: Tình cảm nhiều sóng gió, hay bất đồng.',
      spouse_traits: 'Bạn đời ngoại hình xuất chúng, giỏi giao tiếp, trí tuệ cảm xúc cao nhưng tâm lý biến động.',
      timing: 'Nam nên lấy vợ trẻ hơn nhiều tuổi, Nữ lấy chồng lớn tuổi hơn.',
      niQuote: 'Liêm Trinh ở Phu Thê kỵ gặp Hóa Kỵ và Sát tinh, cần thấu hiểu sâu sắc.'
    },
    'Thiên Phủ': {
      summary: 'Sao hiền lành, chủ sinh离 không tử biệt, tình cảm bình ổn',
      good: 'Gặp Lộc Tồn / Hóa Lộc: Tài lộc song toàn, tình cảm ổn định; Tam phương vô Sát: Vợ chồng hòa thuận.',
      bad: 'Phụ Bật đơn tinh: Dễ có trắc trở tình cảm; Gặp bốn Sát: Tình cảm nhạt nhẽo.',
      spouse_traits: 'Bạn đời ôn văn nhã nhặn, cẩn trọng nguyên tắc, giữ tiền giỏi, công việc bảo thủ.',
      timing: 'Tình cảm ổn định dài lâu nhưng cần chủ động tạo niềm vui mới.'
    },
    'Thái Âm': {
      summary: 'Thích bạn đời thanh tú dịu dàng; rơi hãm gia Sát tình cảm đa biến',
      good: 'Miếu vượng (Thân đến Tý) gặp Cát: Bạn đời tú khí có thành tựu, nam mệnh lấy vợ đẹp.',
      bad: 'Rơi hãm (Sửu đến Ngọ): Tình cảm dễ biến, bạn đời sức khỏe kém; Hóa Kỵ: Nam mệnh xung đột mẹ vợ.',
      spouse_traits: 'Bạn đời dịu dàng thanh tú, tinh tế nhạy cảm, trọng tình cảm.',
      timing: 'Rơi hãm địa nên kết hôn muộn.'
    },
    'Tham Lang': {
      summary: 'Đào hoa vượng, tình cảm cần vun đắp lòng tin và sự chung thủy',
      good: 'Hóa Lộc: Bạn đời đa tài nghệ, phong tình lãng mạn; Gặp Hóa Khoa: Tiết chế đào hoa xấu.',
      bad: 'Hóa Kỵ / Gia Sát: Tình cảm sóng gió, nhiều đào hoa xấu bên ngoài.',
      spouse_traits: 'Bạn đời tài năng xuất chúng, giao tiếp giỏi, sức hút đối phương lớn.',
      timing: 'Nên kết hôn muộn, trước kết hôn cần tìm hiểu kỹ.'
    },
    'Cự Môn': {
      summary: 'Khẩu lưỡi thị phi nhiều, dễ tranh cãi, cần Thái Dương chiếu giải',
      good: 'Thái Dương miếu vượng hội chiếu: Vợ chồng hòa hợp, khẩu tài thành công cụ giao tiếp.',
      bad: 'Hóa Kỵ: Bạn đời hay cằn nhằn thị phi; Đà La đồng độ: Tự phiền phiền người.',
      spouse_traits: 'Bạn đời khẩu tài tốt, quan tâm sĩ diện, đôi khi hơi cầu toàn khắt khe.',
      timing: 'Cần chuẩn bị tâm lý giao tiếp lắng nghe lâu dài.'
    },
    'Thiên Tướng': {
      summary: 'Hôn nhân thân càng thêm thân, phu xướng phụ tùy, hợp tác',
      good: 'Gặp Phụ Bật song toàn: Tình cảm trung thành, hôn nhân vững chắc.',
      bad: 'Gặp nhiều Sát: Tình cảm uất ức không thổ lộ.',
      spouse_traits: 'Bạn đời chính trực gián tiếp, giữ lời hứa, bạn đồng hành tuyệt vời.',
      timing: 'Thường từ bạn học, đồng nghiệp phát triển thành bạn đời.'
    },
    'Thiên Lương': {
      summary: 'Thích bạn đời có trách nhiệm hoặc lớn tuổi hơn, trước hôn nhân nhiều sóng gió',
      good: 'Gặp Lộc: Bạn đời có phúc đức, tình cảm vững vàng.',
      bad: 'Hóa Kỵ / Sát: Nói nhiều, hay thuyết giáo, khoảng cách cảm xúc.',
      spouse_traits: 'Bạn đời trách nhiệm cao, chín chắn trãi đời.',
      timing: 'Trước kết hôn trắc trở là thường thái, kết hôn rồi càng vững.'
    },
    'Thất Sát': {
      summary: 'Tụ ít chia nhiều, nên kết hôn muộn sau 30 tuổi',
      good: 'Miếu vượng (Dần Thân): Bạn đời cứng cỏi nhưng trung thành, hết lòng vì gia đình.',
      bad: 'Gặp Sát: Tình cảm bề ngoài hòa hợp trong lòng bất an.',
      spouse_traits: 'Bạn đời dũng mãnh cô độc, yêu ghét rõ ràng.',
      timing: 'Nên kết hôn sau 30 tuổi để hôn nhân vững chắc.'
    },
    'Phá Quân': {
      summary: 'Sao biến động hôn nhân, thích tự do không gông cuồng',
      good: 'Hóa Lộc: Phá rồi lại lập, trải qua sóng gió cuối cùng đến với nhau.',
      bad: 'Hóa Kỵ: Tình cảm đổ vỡ, biến động lớn.',
      spouse_traits: 'Bạn đời đột phá, thích tự do, không thích ràng buộc.',
      timing: 'Nên kéo dài thời gian tìm hiểu trước khi quyết định.'
    }
  };

  const SIHUA_IN_FUQI = {
    'Lộc': 'Có nhân duyên thiên bẩm với bạn đời, bạn đời lạc quan, sau kết hôn tình cảm và tài lộc gia tăng.',
    'Quyền': 'Bạn đời nắm quyền quyết định trong gia đình, chủ động trong hôn nhân.',
    'Khoa': 'Hòa thuận tôn trọng lẫn nhau, bạn đời có danh tiếng hoặc kỹ năng chuyên môn.',
    'Kỵ': 'Tình cảm có gánh nặng hoặc lo toan, khuyến nghị kết hôn chín chắn và thấu hiểu lẫn nhau.'
  };

  // Hàm đánh giá Cung Phu Thê & Cung Phúc Đức (Song Cung Liên Tham - Tư tưởng Ni Hải Hạ)
  function analyzeMarriage(tuViChart) {
    if (!tuViChart || !tuViChart.palaces) return null;

    const fuqiPalace = tuViChart.palaces.find(p => p.id === 'phu-the');
    const phucPalace = tuViChart.palaces.find(p => p.id === 'phuc-duc');

    if (!fuqiPalace) return null;

    const mainStars = fuqiPalace.mainStarsList || [];
    const mainStarName = mainStars.length > 0 ? mainStars[0].name : 'Vô Chính Diệu';
    const starDetail = STAR_IN_FUQI[mainStarName] || null;

    // Kiểm tra Tứ Hóa ở Cung Phu Thê
    const tuHoaList = fuqiPalace.tuHoaList || [];
    const sihuaNotes = tuHoaList.map(h => `${h}: ${SIHUA_IN_FUQI[h] || ''}`);

    // Phân tích Cung Phúc Đức (Nơi chứa đựng tình cảm tâm hồn sâu sắc)
    const phucStars = phucPalace ? (phucPalace.mainStarsList || []).map(s => s.name).join(', ') : '';

    return {
      fuqiPalaceName: fuqiPalace.name,
      fuqiChi: fuqiPalace.chi,
      mainStarName,
      starDetail,
      tuHoaList,
      sihuaNotes,
      phucPalaceChi: phucPalace ? phucPalace.chi : '',
      phucStars: phucStars || 'Vô Chính Diệu',
      niRuleAdvice: 'Trường phái Ni Hải Hạ: Xem hôn nhân phải xem đồng thời Cung Phu Thê (bạn đời) và Cung Phúc Đức (sự gắn kết tâm hồn dài lâu).'
    };
  }

  return {
    STAR_IN_FUQI,
    SIHUA_IN_FUQI,
    analyzeMarriage
  };
})();
