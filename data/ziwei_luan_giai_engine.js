// ============================================
// NỘI TÂM — Engine Luận Giải Tử Vi & Kinh Dịch Sâu (Synchronicity & Archetypes) - GIAI ĐOẠN 2
// Tổng hợp từ: Jung - Synchronicity, Tử Vi Đẩu Số Tân Biên, Tử Vi Thực Hành
// ============================================

window.ZiweiLuanGiaiEngine = (function() {
  'use strict';

  // 1. Ánh Xạ Địa Chi -> Bát Quái
  const CHI_TO_BAT_QUAI = {
    'Hợi': { que: 'Càn', symbol: '☰', hanh: 'Thủy', phuong: 'Tây Bắc', yNghia: 'Trời, Cứng mạnh, Người cha, Sức mạnh khởi sinh' },
    'Tý': { que: 'Khảm', symbol: '☵', hanh: 'Thủy', phuong: 'Chính Bắc', yNghia: 'Nước, Hiểm trở, Tình cảm sâu sắc, Vô thức' },
    'Sửu': { que: 'Cấn', symbol: '☶', hanh: 'Thổ', phuong: 'Đông Bắc', yNghia: 'Núi, Dừng lại, Tĩnh tâm, Thiền định' },
    'Dần': { que: 'Cấn', symbol: '☶', hanh: 'Mộc', phuong: 'Đông Bắc', yNghia: 'Núi, Khởi động năng lượng Mộc, Mưu cơ' },
    'Mão': { que: 'Chấn', symbol: '☳', hanh: 'Mộc', phuong: 'Chính Đông', yNghia: 'Sấm, Vận động mạnh mẽ, Bứt phá' },
    'Thìn': { que: 'Tốn', symbol: '☴', hanh: 'Thổ', phuong: 'Đông Nam', yNghia: 'Gió, Rồng mây hội tụ, Biến chuyển' },
    'Tỵ': { que: 'Tốn', symbol: '☴', hanh: 'Hỏa', phuong: 'Đông Nam', yNghia: 'Gió, Thấm sâu, Giao tế, Kinh doanh' },
    'Ngọ': { que: 'Ly', symbol: '☲', hanh: 'Hỏa', phuong: 'Chính Nam', yNghia: 'Lửa, Rực rỡ, Văn minh, Quang minh chính đại' },
    'Mùi': { que: 'Khôn', symbol: '☷', hanh: 'Thổ', phuong: 'Tây Nam', yNghia: 'Đất, Bao dung, Nối tiếp và tích lũy' },
    'Thân': { que: 'Khôn', symbol: '☷', hanh: 'Kim', phuong: 'Tây Nam', yNghia: 'Đất, Người mẹ, Nuôi dưỡng, Thao lược' },
    'Dậu': { que: 'Đoài', symbol: '☱', hanh: 'Kim', phuong: 'Chính Tây', yNghia: 'Hồ, Vui vẻ, Thu hoạch, Giao tiếp nghệ thuật' },
    'Tuất': { que: 'Càn', symbol: '☰', hanh: 'Thổ', phuong: 'Tây Bắc', yNghia: 'Trời, Nguyên mẫu trung thành, Cổ điển' }
  };

  // 2. Danh sách Cách Cục Mở Rộng từ Kho Luận Giải (Giai Đoạn 2)
  const CACH_CUC_RULES = [
    // === CÁCH QUÝ / CÁCH LỚN ===
    {
      id: 'QUAN_THANH_KHANH_HOI',
      name: 'Quần Thần Khánh Hội',
      type: 'quy',
      check: (chart, mainStars, subStars) => mainStars.includes('Tử Vi') && subStars.filter(s => ['Tả Phụ', 'Hữu Bật', 'Thiên Khôi', 'Thiên Việt', 'Văn Xương', 'Văn Khúc'].includes(s)).length >= 2,
      meaning: 'Phú quý trọn đời, uy danh lừng lẫy. Đế tinh Tử Vi hội tụ đủ quần thần tá phụ.',
      synchronicity: 'Bản ngã (The Self) nhận được sự đồng thuận và hỗ trợ tối đa từ mọi nguồn lực vô thức và hoàn cảnh khách quan.'
    },
    {
      id: 'TU_PHU_DONG_CUNG',
      name: 'Tử Phủ Đồng Cung (Phù Du Mã)',
      type: 'quy',
      check: (chart, mainStars) => mainStars.includes('Tử Vi') && mainStars.includes('Thiên Phủ'),
      meaning: 'Tài giỏi thao lược, uy quyền hiển hách, kho tàng vững chắc.',
      synchronicity: 'Sự kết hợp hoàn hảo giữa năng lực lãnh đạo (Tử Vi) và năng lực bảo toàn/tích lũy (Thiên Phủ).'
    },
    {
      id: 'TU_PHU_VU_TUONG',
      name: 'Tử Phủ Vũ Tướng (Bổn Mệnh Vương)',
      type: 'quy',
      check: (chart, mainStars) => {
        const set = new Set(mainStars);
        return (set.has('Tử Vi') || set.has('Thiên Phủ')) && (set.has('Vũ Khúc') || set.has('Thiên Tướng'));
      },
      meaning: 'Tổ hợp tài quyền danh vọng số một. Bản lĩnh lãnh đạo và kiến tạo tài chính bền vững.',
      synchronicity: 'Bản ngã trung tâm kiểm soát hoàn toàn các cấu trúc tổ chức và nguồn lực cuộc sống.'
    },
    {
      id: 'CO_NGUYET_DONG_LUONG',
      name: 'Cơ Nguyệt Đồng Lương (Văn Thần Thao Lược)',
      type: 'quy',
      check: (chart, mainStars) => {
        const count = mainStars.filter(s => ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'].includes(s)).length;
        return count >= 2;
      },
      meaning: 'Mưu trí, hiền lành, giỏi chuyên môn, hành chính, giáo dục hoặc nghiên cứu sâu.',
      synchronicity: 'Trí tuệ mềm mại (Anima & Sage) giúp giải quyết các bài toán phức tạp mà không cần dùng bạo lực.'
    },
    {
      id: 'SAT_PHA_THAM',
      name: 'Sát Phá Tham (Tiên Phong Khai Sáng)',
      type: 'quy',
      check: (chart, mainStars) => mainStars.some(s => ['Thất Sát', 'Phá Quân', 'Tham Lang'].includes(s)),
      meaning: 'Cuộc đời nhiều thăng trầm bứt phá, năng lượng biến động mạnh, dám nghĩ dám làm.',
      synchronicity: 'Nguyên mẫu Kẻ Khai Phá (Pioneer/Rebel) buộc bạn phải liên tục đập bỏ cái cũ để kiến tạo trật tự mới.'
    },
    {
      id: 'NHAT_NGUYET_DONG_CUNG',
      name: 'Nhật Nguyệt Đồng Cung',
      type: 'quy',
      check: (chart, mainStars, subStars, branch) => (branch === 'Sửu' || branch === 'Mùi') && mainStars.includes('Thái Dương') && mainStars.includes('Thái Âm'),
      meaning: 'Âm Dương bình hành tại Sửu/Mùi. Trí tuệ xuất chúng, thấu hiểu thời thế.',
      synchronicity: 'Sự cân bằng tuyệt mỹ giữa Anima (Âm) và Animus (Dương) trong tâm lý học Jungian.'
    },
    {
      id: 'NHAT_NGUYET_CHIEU_BICH',
      name: 'Nhật Nguyệt Chiếu Bích (Bức Vách Ngọc)',
      type: 'quy',
      check: (chart, mainStars, subStars, branch) => (branch === 'Thìn' || branch === 'Tuất') && (mainStars.includes('Thái Dương') || mainStars.includes('Thái Âm')),
      meaning: 'Sáng sủa rực rỡ, danh tiếng lẫy lừng, nhà cửa đất đai súc tích.',
      synchronicity: 'Ánh sáng ý thức chiếu soi vào các kho tàng vô thức, biến tiềm năng thành hiện thực.'
    },
    {
      id: 'TU_SAT_TY_HOI',
      name: 'Tử Sát Tỵ Hợi (Nhất Triều Phú Quý)',
      type: 'quy',
      check: (chart, mainStars, subStars, branch) => (branch === 'Tỵ' || branch === 'Hợi') && mainStars.includes('Tử Vi') && mainStars.includes('Thất Sát'),
      meaning: 'Vua mang kiếm báu, uy quyền dũng mãnh, nhất triều phú quý song toàn.',
      synchronicity: 'Nguyên mẫu Chiến Sĩ (Hero/Warrior) phụng sự Bản Ngã, dẹp tan mọi trở lực.'
    },
    {
      id: 'LOC_MA_GIAO_TRI',
      name: 'Lộc Mã Giao Trì (Phát Tài Viễn Quận)',
      type: 'quy',
      check: (chart, mainStars, subStars) => (subStars.includes('Hóa Lộc') || subStars.includes('Lộc Tồn')) && subStars.includes('Thiên Mã'),
      meaning: 'Xung phong xứ xa, kinh doanh bôn ba mà tạo nên cơ nghiệp lớn lao.',
      synchronicity: 'Sự di chuyển không gian (Thiên Mã) đồng bộ với dòng chảy tài lộc thịnh vượng (Lộc).'
    },
    {
      id: 'THAM_HOA_TUONG_PHUNG',
      name: 'Tham Hỏa Tương Phùng (Hoạnh Phát Danh Vinh)',
      type: 'quy',
      check: (chart, mainStars, subStars) => mainStars.includes('Tham Lang') && subStars.includes('Hỏa Tinh'),
      meaning: 'Dũng mãnh bất ngờ, tài lộc hoạnh phát mau lẹ như lửa reo.',
      synchronicity: 'Sự bùng nổ năng lượng dồn nén, biến khát khao thành thành tựu đột phá.'
    },

    // === CÁCH XẤU / CẦN ĐỀ PHÒNG ===
    {
      id: 'LIEM_PHA_HOA_TU',
      name: 'Liêm Phá Hỏa Tụ (Cần Đề Phòng)',
      type: 'xau',
      check: (chart, mainStars, subStars) => (mainStars.includes('Liêm Trinh') || mainStars.includes('Phá Quân')) && subStars.includes('Hỏa Tinh'),
      meaning: 'Dễ nảy sinh tâm lý cực đoan, u uất hoặc tai hoạ bạo phát khi bốc đồng.',
      synchronicity: 'Bóng tối tâm lý (The Shadow) bùng nổ vượt kiểm soát của ý thức. Cần thực hành tĩnh tâm.'
    },
    {
      id: 'THIEN_TUONG_KINH_DUONG',
      name: 'Thiên Tướng Kình Dương (Dao Kề Trên Đầu)',
      type: 'xau',
      check: (chart, mainStars, subStars) => mainStars.includes('Thiên Tướng') && subStars.includes('Kình Dương'),
      meaning: 'Tướng quân gặp hình đao, dễ vướng tranh chấp pháp lý hoặc tai nạn bất ngờ.',
      synchronicity: 'Xung đột giữa nguyên mẫu Bảo Vệ và lực lượng Phá Hoại. Cần cẩn trọng quyết định mạo hiểm.'
    },
    {
      id: 'MA_DA_NGUA_QUE',
      name: 'Mã Đà Ngựa Què (Trở Trại Giao Thương)',
      type: 'xau',
      check: (chart, mainStars, subStars) => subStars.includes('Thiên Mã') && subStars.includes('Đà La'),
      meaning: 'Ý định di chuyển hoặc mở rộng bị ngưng trệ, cản trở, tốn công sức.',
      synchronicity: 'Sự giằng xé giữa ý chí tiến lên và lực cản vô thức. Cần dừng lại rà soát nền tảng.'
    },
    {
      id: 'CU_KY_SONG_NUOC',
      name: 'Cự Kỵ Thị Phi (Khẩu Lỗ Giao Tranh)',
      type: 'xau',
      check: (chart, mainStars, subStars) => mainStars.includes('Cự Môn') && subStars.includes('Hóa Kỵ'),
      meaning: 'Dễ rước họa từ lời nói, thị phi, hiểu lầm hoặc tai nạn vùng sông nước.',
      synchronicity: 'Thông điệp giao tiếp bị méo mó. Nhắc nhở bạn luyện tập cẩn ngôn và lắng nghe.'
    }
  ];

  // Map tên cung -> nhãn tiếng Việt & biểu tượng
  const PALACE_MAP = {
    'menh': { name: 'Mệnh Viên', icon: '⭐', desc: 'Bản ngã, ngoại hình, tư chất và quỹ đạo chung cuộc đời.' },
    'phuhuynh': { name: 'Huynh Đệ', icon: '🤝', desc: 'Anh chị em, bạn chí cốt, đối tác cùng hội cùng thuyền.' },
    'phuthe': { name: 'Phu Thê', icon: '💍', desc: 'Hôn nhân, bạn đời, tính cách và sự hòa hợp tình cảm.' },
    'tutuc': { name: 'Tử Tức', icon: '👶', desc: 'Con cái, hậu bối, học trò và thành quả sáng tạo.' },
    'taibach': { name: 'Tài Bạch', icon: '💰', desc: 'Nguồn tiền, năng lực kiếm tiền và thái độ với tài chính.' },
    'tatach': { name: 'Tật Ách', icon: '🏥', desc: 'Sức khỏe, bệnh tật, các tai tai nạn cần phòng tránh.' },
    'thiendi': { name: 'Thiên Di', icon: '✈️', desc: 'Môi trường bên ngoài, di chuyển, xuất ngoại và giao tế.' },
    'noboc': { name: 'Nô Bộc', icon: '👥', desc: 'Bạn bè xã giao, nhân viên cấp dưới, sự hỗ trợ từ đám đông.' },
    'quanloc': { name: 'Quan Lộc', icon: '👔', desc: 'Sự nghiệp, công danh, học vấn và vị thế xã hội.' },
    'dientrach': { name: 'Điền Trạch', icon: '🏡', desc: 'Bất động sản, nhà cửa, nơi ở và gia sản tổ tiên.' },
    'phucduc': { name: 'Phúc Đức', icon: '🧘', desc: 'Phúc thọ, đời sống tinh thần, tâm linh và nghiệp duyên.' },
    'phumau': { name: 'Phụ Mẫu', icon: '👴', desc: 'Cha mẹ, tổ tiên, cấp trên và mối quan hệ với quyền lực.' }
  };

  // Helper lấy thông tin sao Mệnh
  function getMingDetails(chart) {
    if (!chart || !chart.palaces) return null;
    const mingPalace = chart.palaces.find(p => p.isMenh || p.name === 'Mệnh' || p.isMing || p.id === 'menh');
    if (!mingPalace) return null;

    const mainStars = (mingPalace.mainStarsList || []).map(s => s.name || s);
    const subStars = (mingPalace.subStarsList || []).map(s => s.name || s);
    const branch = mingPalace.chi || mingPalace.branchName || 'Tý';

    return { mingPalace, mainStars, subStars, branch };
  }

  return {
    // 1. Bát quái theo chi
    getBatQuaiForChi: function(chi) {
      return CHI_TO_BAT_QUAI[chi] || { que: 'Vô Hướng', symbol: '☯', hanh: 'Thổ', phuong: 'Trung Cung', yNghia: 'Hòa hợp ngũ hành' };
    },

    // 2. Nhận diện cách cục sâu
    detectCachCuc: function(chart) {
      const mingDetails = getMingDetails(chart);
      if (!mingDetails) return [];

      const { mainStars, subStars, branch } = mingDetails;
      const detected = [];

      CACH_CUC_RULES.forEach(rule => {
        if (rule.check(chart, mainStars, subStars, branch)) {
          detected.push(rule);
        }
      });

      return detected;
    },

    // 3. Phân tích Mệnh Cung theo Synchronicity & Archetype
    analyzeMenhCung: function(chart) {
      const mingDetails = getMingDetails(chart);
      if (!mingDetails) {
        return {
          headline: 'Chưa xác định Mệnh Cung',
          archetype: 'Chưa rõ',
          depth: 'Vui lòng kiểm tra lại lá số.',
          batQuai: CHI_TO_BAT_QUAI['Tý']
        };
      }

      const { mainStars, branch } = mingDetails;
      const batQuai = CHI_TO_BAT_QUAI[branch] || CHI_TO_BAT_QUAI['Tý'];
      const firstStar = mainStars[0] || 'Vô Chính Diệu';

      // Tra từ điển archetype
      const dict = window.ZiweiDictionary || {};
      const starInfo = dict[firstStar] || {};
      const archetype = starInfo.archetype || `Nguyên mẫu ${firstStar}`;
      const synchronicity = starInfo.synchronicity || `Mẫu hình năng lượng ${firstStar} chi phối lá số.`;

      let depthText = `Cung Mệnh an tại ${branch} thuộc quẻ ${batQuai.que} (${batQuai.symbol} - hành ${batQuai.hanh}). `;
      if (mainStars.length > 0) {
        depthText += `Chính tinh tọa thủ là ${mainStars.join(', ')}. `;
      } else {
        depthText += `Cung Mệnh Vô Chính Diệu, mượn năng lượng từ cung xung chiếu. `;
      }
      depthText += `Phương vị ${batQuai.phuong}: ${batQuai.yNghia}.`;

      return {
        headline: mainStars.length > 0 ? `${mainStars.join(' & ')} thủ Mệnh tại ${branch}` : `Vô Chính Diệu tại ${branch}`,
        primaryStar: firstStar,
        archetype: archetype,
        synchronicity: synchronicity,
        batQuai: batQuai,
        depth: depthText
      };
    },

    // 4. Luận giải Chuyên Sâu Bất Kỳ Cung Nào (Giai Đoạn 2)
    analyzePalaceDeep: function(chart, palaceId) {
      if (!chart || !chart.palaces) return null;
      const target = chart.palaces.find(p => p.id === palaceId || p.name === palaceId);
      if (!target) return null;

      const meta = PALACE_MAP[palaceId] || { name: target.name || palaceId, icon: '🏛️', desc: 'Luận giải chuyên sâu' };
      const mainStars = (target.mainStarsList || []).map(s => s.name || s);
      const subStars = (target.subStarsList || []).map(s => s.name || s);
      const branch = target.chi || target.branchName || 'Tý';
      const bq = CHI_TO_BAT_QUAI[branch] || CHI_TO_BAT_QUAI['Tý'];

      const dict = window.ZiweiDictionary || {};
      const primaryStar = mainStars[0] || 'Vô Chính Diệu';
      const starInfo = dict[primaryStar] || {};

      return {
        id: palaceId,
        name: meta.name,
        icon: meta.icon,
        desc: meta.desc,
        branch: branch,
        batQuai: bq,
        mainStars: mainStars,
        subStars: subStars,
        primaryStar: primaryStar,
        archetype: starInfo.archetype || 'Nguyên mẫu tiềm ẩn',
        synchronicity: starInfo.synchronicity || 'Dòng năng lượng vận hành tự nhiên.',
        fullDictText: starInfo.full || starInfo.short || 'Luận giải đang được cập nhật.'
      };
    },

    // 5. Luận giải Hạn Vận theo Synchronicity
    analyzeHanVan: function(chart, daiHanPalace) {
      if (!daiHanPalace) {
        return {
          theme: 'Đang theo dõi vận trình',
          archetype: 'The Traveler (Lữ Khách)',
          advice: 'Giữ tâm thế tĩnh lặng để đón nhận các sự kiện trùng hợp có ý nghĩa.'
        };
      }

      const stars = (daiHanPalace.mainStarsList || []).map(s => s.name || s);
      const branch = daiHanPalace.chi || daiHanPalace.branchName || 'Tý';
      const bq = CHI_TO_BAT_QUAI[branch] || CHI_TO_BAT_QUAI['Tý'];

      return {
        theme: `Đại Hạn 10 năm tại cung ${daiHanPalace.name || 'Hạn'} (${branch} - Quẻ ${bq.que})`,
        stars: stars.join(', ') || 'Vô Chính Diệu',
        archetype: stars[0] ? `Nguyên mẫu bối cảnh: ${stars[0]}` : 'Nguyên mẫu Chuyển Đổi',
        advice: `Giai đoạn này mang năng lượng của quẻ ${bq.que} (${bq.yNghia}). Hãy để ý các cơ hội trùng hợp phi nhân quả xuất hiện trong thời gian này.`
      };
    },

    // 6. Trích dẫn Triết Lý Hôm Nay cho Dashboard
    getDailyPhilosophy: function(transitData, userProfile) {
      const canNgay = transitData?.canNgay || userProfile?.canNam || 'Giáp';
      const quotes = {
        'Giáp': {
          quote: 'Cây đại thụ vươn cao bắt đầu từ mầm non dũng cảm. Hãy tin vào trực giác khởi đầu.',
          archetype: 'The Creator (Đấng Sáng Tạo)',
          action: 'Bắt đầu dự án mới hoặc đưa ra quyết định tiên phong.'
        },
        'Ất': {
          quote: 'Cây liễu uốn mình theo gió mà không gãy. Sự mềm dẻo là sức mạnh tối thượng.',
          archetype: 'The Lover / The Adaptor',
          action: 'Lắng nghe, hòa giải và ứng biến linh hoạt.'
        },
        'Bính': {
          quote: 'Mặt trời tỏa sáng không đòi hỏi đền đáp. Hãy chia sẻ trí tuệ và sự ấm áp.',
          archetype: 'The Hero (Anh Hùng)',
          action: 'Thể hiện bản thân, truyền cảm hứng cho người xung quanh.'
        },
        'Đinh': {
          quote: 'Ngọn đèn trong đêm soi sáng từng bước đi. Chút ánh sáng nhỏ có thể xua tan bóng tối.',
          archetype: 'The Sage (Hiền Triết)',
          action: 'Tập trung học hỏi, đọc sách, tĩnh tâm suy ngẫm.'
        },
        'Mậu': {
          quote: 'Vững như núi Thái Sơn. Đứng vững trên nguyên tắc của chính mình.',
          archetype: 'The Ruler (Bậc Trị Vì)',
          action: 'Kiểm soát tài chính, gia cố nền tảng gia đình và công việc.'
        },
        'Kỷ': {
          quote: 'Đất mẹ dung dưỡng vạn vật. Bao dung là chìa khóa mở mọi cánh cửa.',
          archetype: 'The Caregiver (Người Nuôi Dưỡng)',
          action: 'Chăm sóc sức khỏe bản thân và kết nối tình thân.'
        },
        'Canh': {
          quote: 'Thanh kiếm báu được tôi luyện qua lửa đỏ. Thách thức là cơ hội rèn luyện bản lĩnh.',
          archetype: 'The Warrior (Chiến Sĩ)',
          action: 'Giải quyết dứt điểm các vướng mắc tồn đọng.'
        },
        'Tân': {
          quote: 'Viên ngọc quý cần thời gian mài dũa. Tinh tế trong từng chi tiết nhỏ.',
          archetype: 'The Artist (Nghệ Sĩ)',
          action: 'Sáng tạo, tối ưu không gian sống và công việc.'
        },
        'Nhâm': {
          quote: 'Dòng sông cuồn cuộn chảy về biển lớn. Mọi dòng chảy nội tâm đều tìm thấy bến đỗ.',
          archetype: 'The Explorer (Nhà Khám Phá)',
          action: 'Mở rộng tầm nhìn, xuất hành hoặc trải nghiệm điều mới.'
        },
        'Quý': {
          quote: 'Giọt sương sớm lắng đọng nguồn sống. Nhìn sâu vào giấc mơ và vô thức.',
          archetype: 'The Mystic (Nhà Tâm Linh)',
          action: 'Thiền định, ghi chép nhật ký phản tư.'
        }
      };

      return quotes[canNgay] || quotes['Giáp'];
    },

    // Danh sách 12 cung ID
    PALACE_IDS: ['menh', 'taibach', 'quanloc', 'phuthe', 'dientrach', 'phucduc', 'tatach', 'thiendi', 'phuhuynh', 'tutuc', 'noboc', 'phumau']
  };
})();
