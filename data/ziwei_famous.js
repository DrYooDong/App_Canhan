// ============================================
// NỘI TÂM — Cơ Sở Dữ Liệu Lá Số Danh Nhân Lịch Sử & Đương Đại
// Nguồn: ziwei-doushu Famous Person Database
// ============================================

window.ZiweiFamous = (function() {
  'use strict';

  const FAMOUS_LIST = [
    {
      id: 'ma-yun',
      name: 'Mã Vân (Jack Ma)',
      category: 'Thương Mại',
      description: 'Nhà sáng lập tập đoàn Alibaba',
      year: 1964, month: 9, day: 10, hour: 11, minute: 30,
      gender: 'Nam',
      notable: 'Lá số thể hiện sức mạnh phá cũ lập mới cực kỳ mãnh liệt, sao Cung Quan Lộc ứng hợp kỳ diệu với đế chế thương mại điện tử.'
    },
    {
      id: 'li-jiacheng',
      name: 'Lý Gia Thành (Li Ka-shing)',
      category: 'Thương Mại',
      description: 'Tỷ phú siêu cấp Hồng Kông, người sáng lập Trường Hòa',
      year: 1928, month: 7, day: 29, hour: 4, minute: 0,
      gender: 'Nam',
      notable: 'Tứ Hóa Cung Tài Bạch là trường hợp điển hình nghiên cứu mệnh đại phú Đông Phương, Lộc Tồn thủ tài, tích lũy càng lâu càng giàu.'
    },
    {
      id: 'ren-zhengfei',
      name: 'Nhâm Chính Phi (Ren Zhengfei)',
      category: 'Thương Mại',
      description: 'Nhà sáng lập tập đoàn Huawei',
      year: 1944, month: 10, day: 25, hour: 4, minute: 0,
      gender: 'Nam',
      notable: 'Thất Sát nhập Mệnh cách, cả đời đi ngược chiều gió, càng ép càng mạnh mẽ, giáo trình sống cho lý luận Thất Sát của Ni Sư.'
    },
    {
      id: 'steve-jobs',
      name: 'Steve Jobs',
      category: 'Công Nghệ',
      description: 'Đồng sáng lập tập đoàn Apple',
      year: 1955, month: 2, day: 24, hour: 12, minute: 0,
      gender: 'Nam',
      notable: 'Phá Quân nhập Mệnh cách, từ bị cha mẹ nuôi nhận nuôi đến xây dựng đế chế Apple, hình mẫu phá rồi mới lập đỉnh cao.'
    },
    {
      id: 'elon-musk',
      name: 'Elon Musk',
      category: 'Công Nghệ',
      description: 'CEO Tesla, SpaceX, xAI',
      year: 1971, month: 6, day: 28, hour: 7, minute: 30,
      gender: 'Nam',
      notable: 'Tham Lang và Hỏa Tinh gia hội mạo hiểm khai sáng, tư duy vượt thời đại đưa con người lên Hỏa Tinh.'
    },
    {
      id: 'jay-chou',
      name: 'Chu Kiệt Luân (Jay Chou)',
      category: 'Nghệ Thuật',
      description: 'Ông hoàng nhạc Pop Hoa Ngữ',
      year: 1979, month: 1, day: 18, hour: 2, minute: 0,
      gender: 'Nam',
      notable: 'Tổ hợp Văn Khúc và Tham Lang, thiên bẩm tài nghệ, giải thích khả năng làm chủ đa dạng phong cách âm nhạc.'
    },
    {
      id: 'lin-zhiling',
      name: 'Lâm Chí Linh',
      category: 'Nghệ Thuật',
      description: 'Siêu mẫu, diễn viên nổi tiếng',
      year: 1974, month: 11, day: 29, hour: 12, minute: 0,
      gender: 'Nữ',
      notable: 'Thái Âm thủ Mệnh điền hình của vẻ đẹp dịu dàng, minh chứng sống cho câu nói của Ni Sư "Thái Âm nhập Mệnh con gái đẹp nhất".'
    },
    {
      id: 'zhang-ailing',
      name: 'Trương Ái Linh',
      category: 'Văn Học',
      description: 'Đại văn hào văn học hiện đại',
      year: 1920, month: 9, day: 30, hour: 2, minute: 0,
      gender: 'Nữ',
      notable: 'Tổ hợp sao cô độc ở Mệnh tạo nên trải nghiệm tình cảm truyền kỳ và văn phong sắc sảo trầm buồn.'
    }
  ];

  function getFamousList() {
    return FAMOUS_LIST;
  }

  function getFamousById(id) {
    return FAMOUS_LIST.find(f => f.id === id) || null;
  }

  function generateFamousTuViChart(famousId) {
    const famous = getFamousById(famousId);
    if (!famous || !window.AstrologyLogic || !window.AstrologyLogic.TuViEngine) return null;

    const AL = window.AstrologyLogic;
    let fp = null;
    if (AL.FourPillars) {
      const civilDate = new Date(famous.year, famous.month - 1, famous.day, famous.hour, famous.minute);
      fp = AL.FourPillars.calculateFourPillars(civilDate, 116.4, 8); // Kinh độ TQ tiêu chuẩn
    }

    const p = fp ? fp.pillars : null;

    const chart = AL.TuViEngine.calculateTuViChart({
      day: famous.day,
      month: famous.month,
      year: famous.year,
      hour: famous.hour,
      minute: famous.minute,
      gender: famous.gender,
      canNam: p ? p.year.can : 'Canh',
      chiNam: p ? p.year.chi : 'Thìn',
      lunarDay: fp ? fp.lunarDay : 4,
      lunarMonth: fp ? fp.lunarMonth : 7
    });

    return {
      famousInfo: famous,
      chart
    };
  }

  return {
    getFamousList,
    getFamousById,
    generateFamousTuViChart
  };
})();
