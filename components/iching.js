// ============================================
// NỘI TÂM — Quẻ Dịch Nhật Lịch & Nhật Ký Gieo Quẻ
// ============================================

(function () {
  'use strict';

  // ── 64 Quẻ Dịch Data (Simplified — key quẻ) ──
  const BAT_QUAI = [
    { id: 1, name: 'Càn',  hanh: 'Kim',  symbol: '☰' },
    { id: 2, name: 'Đoài', hanh: 'Kim',  symbol: '☱' },
    { id: 3, name: 'Ly',   hanh: 'Hỏa',  symbol: '☲' },
    { id: 4, name: 'Chấn', hanh: 'Mộc',  symbol: '☳' },
    { id: 5, name: 'Tốn',  hanh: 'Mộc',  symbol: '☴' },
    { id: 6, name: 'Khảm', hanh: 'Thủy', symbol: '☵' },
    { id: 7, name: 'Cấn',  hanh: 'Thổ',  symbol: '☶' },
    { id: 8, name: 'Khôn', hanh: 'Thổ',  symbol: '☷' },
  ];

  // Quẻ kết hợp: key = "upper-lower" (1-indexed BAT_QUAI)
  const QUE_DATA = {
    '1-1': { id: 1,  name: 'Thuần Càn',        meaning: 'Sức mạnh, lãnh đạo, thành công', advice: 'Kiên cường tiến lên, thời cơ chín muồi để hành động lớn.', type: 'CAT' },
    '2-2': { id: 2,  name: 'Thuần Khôn',        meaning: 'Nhu thuận, bền chí, hợp tác', advice: 'Không nên dẫn đầu, hãy đi sau hỗ trợ. Kiên nhẫn chờ thời.', type: 'CAT' },
    '6-4': { id: 3,  name: 'Thủy Lôi Truân',    meaning: 'Khởi đầu gian nan, chưa nên vội', advice: 'Mới khởi sự gặp trở ngại là bình thường. Chờ đợi và xây nền vững.', type: 'HUNG' },
    '7-6': { id: 4,  name: 'Sơn Thủy Mông',     meaning: 'Ấu trĩ, cần học hỏi thêm', advice: '겸허히 cầu học, không nên vội vàng quyết đoán.', type: 'TRUNG' },
    '6-1': { id: 5,  name: 'Thủy Thiên Nhu',    meaning: 'Chờ đợi, dưỡng sức', advice: 'Chờ đúng thời điểm. Dưỡng thân tích lực là thượng sách.', type: 'TRUNG' },
    '1-6': { id: 6,  name: 'Thiên Thủy Tụng',   meaning: 'Tranh tụng, kiện cáo', advice: 'Tránh tranh chấp. Nhượng bộ để bảo toàn tổng thể.', type: 'HUNG' },
    '6-8': { id: 7,  name: 'Địa Thủy Sư',       meaning: 'Chiến lược, chỉ huy', advice: 'Cần lãnh đạo mạnh và kỷ luật. Đây là lúc chứng tỏ năng lực.', type: 'TRUNG' },
    '8-6': { id: 8,  name: 'Thủy Địa Tỷ',       meaning: 'Đoàn kết, liên minh', advice: 'Liên kết với người đồng chí. Sự hợp tác mang lại thành công.', type: 'CAT' },
    '1-5': { id: 9,  name: 'Phong Thiên Tiểu Súc', meaning: 'Tích lũy nhỏ, chờ thời', advice: 'Tích lũy từng bước nhỏ. Chưa phải lúc ra đòn lớn.', type: 'TRUNG' },
    '1-2': { id: 10, name: 'Thiên Trạch Lý',    meaning: 'Hành xử đúng đắn, cẩn trọng', advice: 'Dẫm trên đuôi hổ mà không bị cắn — hãy khéo léo và cẩn trọng.', type: 'CAT' },
    '8-1': { id: 11, name: 'Địa Thiên Thái',    meaning: 'Thái bình, thuận lợi', advice: 'Thời kỳ thịnh vượng. Mọi việc hanh thông, hãy tận dụng.', type: 'DAI_CAT' },
    '1-8': { id: 12, name: 'Thiên Địa Bĩ',      meaning: 'Bế tắc, trở ngại', advice: 'Thời kỳ đình trệ. Nên ẩn nhẫn chờ đợi, không nên hành động lớn.', type: 'HUNG' },
    '3-1': { id: 13, name: 'Thiên Hỏa Đồng Nhân', meaning: 'Đoàn kết, hợp tác', advice: 'Hợp tác với người khác để đạt mục tiêu chung. Sức mạnh tập thể.', type: 'CAT' },
    '1-3': { id: 14, name: 'Hỏa Thiên Đại Hữu', meaning: 'Đại thành, sung túc', advice: 'Thời kỳ đại thịnh. Giữ sự khiêm tốn để bảo toàn phúc lộc.', type: 'DAI_CAT' },
    '8-7': { id: 15, name: 'Địa Sơn Khiêm',     meaning: 'Khiêm tốn, nhún nhường', advice: 'Khiêm tốn là đức tính cao quý nhất lúc này. Thành công bền vững.', type: 'CAT' },
    '4-8': { id: 16, name: 'Lôi Địa Dự',        meaning: 'Vui vẻ, phấn chấn', advice: 'Thời điểm hành động với tinh thần hứng khởi. Tổ chức, vận động.', type: 'CAT' },
    '2-8': { id: 17, name: 'Trạch Lôi Tùy',     meaning: 'Đi theo, thuận thời', advice: 'Đi theo xu thế, không cưỡng cầu. Linh hoạt thích nghi.', type: 'CAT' },
    '7-5': { id: 18, name: 'Sơn Phong Cổ',      meaning: 'Cải cách, chấn chỉnh', advice: 'Cần mạnh dạn cải cách những gì đã cũ kỹ, sai lầm.', type: 'TRUNG' },
    '8-2': { id: 19, name: 'Địa Trạch Lâm',     meaning: 'Tiến lên, cơ hội đến', advice: 'Cơ hội đến gần. Hãy tiến tới với sự tự tin và cẩn trọng.', type: 'CAT' },
    '5-8': { id: 20, name: 'Phong Địa Quan',     meaning: 'Quan sát, suy ngẫm', advice: 'Quan sát toàn cục trước khi hành động. Tư duy chiến lược.', type: 'TRUNG' },
    '3-4': { id: 21, name: 'Hỏa Lôi Phệ Hạp',   meaning: 'Trừng phạt, công lý', advice: 'Xử lý dứt điểm vấn đề tồn đọng. Cần quyết đoán và công minh.', type: 'TRUNG' },
    '4-3': { id: 22, name: 'Sơn Hỏa Bí',        meaning: 'Trang sức, vẻ ngoài', advice: 'Chú ý hình thức nhưng đừng quên thực chất bên trong.', type: 'TRUNG' },
    '7-8': { id: 23, name: 'Sơn Địa Bác',        meaning: 'Suy thoái, bóc vỏ', advice: 'Thời điểm khó khăn. Hãy ẩn nhẫn, đừng hành động vội.', type: 'HUNG' },
    '8-4': { id: 24, name: 'Địa Lôi Phục',       meaning: 'Phục hồi, quay trở lại', advice: 'Sau khó khăn, sức mạnh đang phục hồi. Hãy kiên nhẫn thêm.', type: 'CAT' },
    '1-4': { id: 25, name: 'Thiên Lôi Vô Vọng',  meaning: 'Vô cầu, tự nhiên', advice: 'Hành động theo bản năng thuần khiết, không toan tính quá nhiều.', type: 'CAT' },
    '4-1': { id: 26, name: 'Sơn Thiên Đại Súc',  meaning: 'Tích lũy lớn, dưỡng sức', advice: 'Đây là lúc tích lũy năng lực. Thời cơ lớn đang đến.', type: 'CAT' },
    '7-4': { id: 27, name: 'Sơn Lôi Di',         meaning: 'Dưỡng sinh, nuôi dưỡng', advice: 'Chú ý dinh dưỡng, sức khỏe. Nuôi dưỡng bản thân và người xung quanh.', type: 'TRUNG' },
    '2-5': { id: 28, name: 'Trạch Phong Đại Quá', meaning: 'Quá mức, gánh nặng', advice: 'Gánh quá nặng. Cần chia sẻ, giảm tải, không cô độc một mình.', type: 'HUNG' },
    '6-6': { id: 29, name: 'Thuần Khảm',         meaning: 'Nguy hiểm, hiểm trở', advice: 'Lâm vào nơi hiểm. Giữ tâm vững, kiên định, không hoảng loạn.', type: 'HUNG' },
    '3-3': { id: 30, name: 'Thuần Ly',            meaning: 'Ánh sáng, phụ thuộc', advice: 'Tỏa sáng và bám vào điều tốt đẹp. Sự rõ ràng và văn minh.', type: 'CAT' },
    '2-7': { id: 31, name: 'Trạch Sơn Hàm',      meaning: 'Cảm ứng, tình cảm', advice: 'Kết nối cảm xúc tốt. Tình yêu và quan hệ nở rộ.', type: 'CAT' },
    '4-5': { id: 32, name: 'Lôi Phong Hằng',     meaning: 'Bền vững, lâu dài', advice: 'Kiên trì là chìa khóa. Không thay đổi quá nhiều, giữ vững lập trường.', type: 'CAT' },
    '1-7': { id: 33, name: 'Thiên Sơn Độn',      meaning: 'Lui ẩn, tránh né', advice: 'Lui bước chiến lược là khôn ngoan. Không phải nhút nhát.', type: 'TRUNG' },
    '4-1': { id: 34, name: 'Lôi Thiên Đại Tráng', meaning: 'Mạnh mẽ, hùng tráng', advice: 'Sức mạnh dồi dào nhưng cẩn thận không lạm dụng. Đức trị mới bền.', type: 'CAT' },
    '3-8': { id: 35, name: 'Hỏa Địa Tấn',        meaning: 'Tiến bộ, thăng tiến', advice: 'Thời cơ thăng tiến. Mọi nỗ lực được ghi nhận và đền đáp.', type: 'DAI_CAT' },
    '8-3': { id: 36, name: 'Địa Hỏa Minh Di',    meaning: 'Ánh sáng bị che khuất', advice: 'Tạm thời lép vế. Hãy ẩn tài, chờ thời cơ. Đừng để lộ điểm yếu.', type: 'HUNG' },
    '5-3': { id: 37, name: 'Phong Hỏa Gia Nhân',  meaning: 'Gia đình, nội bộ', advice: 'Gia đình hòa thuận là cơ sở vững chắc. Chú ý quan hệ nội bộ.', type: 'CAT' },
    '3-2': { id: 38, name: 'Hỏa Trạch Khuê',     meaning: 'Bất đồng, xa cách', advice: 'Tuy có bất đồng nhưng vẫn có thể tìm điểm chung. Kiên nhẫn thương lượng.', type: 'HUNG' },
    '6-7': { id: 39, name: 'Thủy Sơn Kiển',      meaning: 'Trở ngại, khó khăn', advice: 'Đường đi gặp trở ngại. Nên tìm trợ giúp, không nên một mình.', type: 'HUNG' },
    '4-6': { id: 40, name: 'Lôi Thủy Giải',      meaning: 'Giải phóng, tháo gỡ', advice: 'Áp lực được giải tỏa. Hành động nhanh để nắm bắt cơ hội.', type: 'CAT' },
    '7-2': { id: 41, name: 'Sơn Trạch Tổn',      meaning: 'Giảm, hy sinh', advice: 'Cần hy sinh cái nhỏ để được cái lớn. Lòng thành mang lại phúc lành.', type: 'TRUNG' },
    '5-4': { id: 42, name: 'Phong Lôi Ích',       meaning: 'Tăng ích, lợi lộc', advice: 'Thời kỳ tăng trưởng. Hành động quyết đoán mang lại lợi nhuận.', type: 'DAI_CAT' },
    '2-1': { id: 43, name: 'Trạch Thiên Quải',   meaning: 'Quyết đoán, loại bỏ', advice: 'Cương quyết loại bỏ điều tiêu cực. Cần quyết tâm và minh bạch.', type: 'TRUNG' },
    '1-5': { id: 44, name: 'Thiên Phong Cấu',    meaning: 'Gặp gỡ, cơ hội bất ngờ', advice: 'Có người/việc tốt đến bất ngờ. Hãy tỉnh táo phân biệt cơ hội thật.', type: 'TRUNG' },
    '2-7': { id: 45, name: 'Trạch Địa Tụy',      meaning: 'Tụ họp, hội tụ', advice: 'Thời điểm tốt để tập hợp, huy động lực lượng. Kết nối cộng đồng.', type: 'CAT' },
    '5-8': { id: 46, name: 'Địa Phong Thăng',    meaning: 'Thăng tiến, leo lên', advice: 'Từng bước leo lên vị trí cao hơn. Kiên trì nhất định thành công.', type: 'CAT' },
    '2-6': { id: 47, name: 'Trạch Thủy Khốn',    meaning: 'Khốn cùng, thiếu thốn', advice: 'Lúc túng thiếu vẫn giữ vững đạo đức và tâm an. Khó khăn sẽ qua.', type: 'HUNG' },
    '6-5': { id: 48, name: 'Thủy Phong Tỉnh',    meaning: 'Giếng nước, nguồn gốc', advice: 'Quay về nguồn cội, giữ gìn tài nguyên tinh thần. Bền bỉ phục vụ.', type: 'TRUNG' },
    '3-2': { id: 49, name: 'Trạch Hỏa Cách',     meaning: 'Cách mạng, thay đổi', advice: 'Thời điểm thay đổi lớn. Cải cách táo bạo sẽ thành công.', type: 'CAT' },
    '4-3': { id: 50, name: 'Hỏa Phong Đỉnh',     meaning: 'Đỉnh cao, thành đạt', advice: 'Đạt đỉnh cao sự nghiệp và tri thức. Thời điểm thu hoạch thành quả.', type: 'DAI_CAT' },
    '4-4': { id: 51, name: 'Thuần Chấn',          meaning: 'Chấn động, sấm sét', advice: 'Biến cố bất ngờ nhưng sẽ qua. Giữ bình tĩnh, đừng hoảng loạn.', type: 'HUNG' },
    '7-7': { id: 52, name: 'Thuần Cấn',           meaning: 'Tĩnh lặng, dừng lại', advice: 'Dừng lại đúng lúc là trí tuệ. Không nhất thiết phải tiến.', type: 'TRUNG' },
    '7-5': { id: 53, name: 'Phong Sơn Tiệm',      meaning: 'Từ từ, tuần tự', advice: 'Tiến dần từng bước, không vội vàng. Sự kiên trì dẫn đến thành công.', type: 'CAT' },
    '4-2': { id: 54, name: 'Lôi Trạch Quy Muội',  meaning: 'Hôn nhân, theo đuổi', advice: 'Cẩn trọng trong quan hệ tình cảm. Hành động theo đúng lễ nghi.', type: 'TRUNG' },
    '4-3': { id: 55, name: 'Lôi Hỏa Phong',       meaning: 'Phong phú, đỉnh thịnh', advice: 'Thời kỳ hoàng kim. Hãy tận dụng và chia sẻ thịnh vượng.', type: 'DAI_CAT' },
    '3-7': { id: 56, name: 'Hỏa Sơn Lữ',         meaning: 'Khách lữ hành, xa quê', advice: 'Đi xa, xa lạ. Hành xử nhẹ nhàng, tránh xung đột ở đất khách.', type: 'TRUNG' },
    '5-5': { id: 57, name: 'Thuần Tốn',           meaning: 'Khiêm nhu, thâm nhập', advice: 'Dùng sự mềm mại để thâm nhập. Kiên trì theo cùng một hướng.', type: 'TRUNG' },
    '2-2': { id: 58, name: 'Thuần Đoài',          meaning: 'Vui vẻ, hòa hợp', advice: 'Niềm vui và sự hòa hợp lan tỏa. Thời gian tốt cho quan hệ xã hội.', type: 'CAT' },
    '6-5': { id: 59, name: 'Phong Thủy Hoán',     meaning: 'Tan rã, phân tán', advice: 'Khắc phục sự chia rẽ. Kết nối lại những điều bị tan vỡ.', type: 'TRUNG' },
    '6-2': { id: 60, name: 'Thủy Trạch Tiết',    meaning: 'Tiết chế, điều độ', advice: 'Cần có giới hạn và kỷ luật. Tự nguyện tiết chế để bảo tồn lâu dài.', type: 'TRUNG' },
    '5-6': { id: 61, name: 'Phong Trạch Trung Phu', meaning: 'Lòng thành tín', advice: 'Lòng thành thực là sức mạnh. Tin tưởng và được tin tưởng.', type: 'CAT' },
    '4-7': { id: 62, name: 'Lôi Sơn Tiểu Quá',   meaning: 'Nhỏ vượt quá, thái quá nhỏ', advice: 'Chú ý tiểu tiết. Việc nhỏ làm cẩn thận, không làm việc lớn.', type: 'TRUNG' },
    '6-3': { id: 63, name: 'Thủy Hỏa Ký Tế',     meaning: 'Đã hoàn thành, cẩn trọng', advice: 'Đã hoàn thành nhưng đừng lơ là. Cẩn thận giữ gìn thành quả.', type: 'CAT' },
    '3-6': { id: 64, name: 'Hỏa Thủy Vị Tế',     meaning: 'Chưa hoàn thành', advice: 'Việc chưa xong. Còn nhiều chặng đường phía trước. Không bỏ cuộc.', type: 'TRUNG' },
  };

  const HANH_SINH_KHAC = {
    sinh: { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' },
    khac: { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' }
  };

  function getTheBodyRelation(theHanh, dungHanh) {
    if (HANH_SINH_KHAC.sinh[dungHanh] === theHanh) return { label: 'Dụng sinh Thể', color: '#10b981', icon: '🌟', desc: 'Rất may mắn — Ngoại cảnh hỗ trợ bản thân. Mọi việc hanh thông.' };
    if (HANH_SINH_KHAC.sinh[theHanh] === dungHanh) return { label: 'Thể sinh Dụng', color: '#f59e0b', icon: '💸', desc: 'Hao tổn năng lượng — Bỏ nhiều hưởng ít, nên cẩn trọng chi phí.' };
    if (HANH_SINH_KHAC.khac[theHanh] === dungHanh) return { label: 'Thể khắc Dụng', color: '#3b82f6', icon: '⚔️', desc: 'Tranh đấu mới thành — Cần nỗ lực, kiên quyết mới đạt kết quả.' };
    if (HANH_SINH_KHAC.khac[dungHanh] === theHanh) return { label: 'Dụng khắc Thể', color: '#ef4444', icon: '⚠️', desc: 'Áp lực, trở ngại — Cẩn thận, không nên hành động lớn.' };
    return { label: 'Thể Dụng Tỉ Hòa', color: '#8b5cf6', icon: '☯️', desc: 'Bình hòa — Hợp tác tốt, việc trôi chảy ở mức ổn định.' };
  }

  // Tính Quẻ theo Mai Hoa
  function calcMaiHoa(nam, thangAm, ngayAm, gioIdx) {
    const thuongQueNum = ((nam + thangAm + ngayAm) % 8) || 8;
    const haQueNum = ((nam + thangAm + ngayAm + (gioIdx + 1)) % 8) || 8;
    const haoDong = ((nam + thangAm + ngayAm + (gioIdx + 1)) % 6) || 6;

    const thuongQue = BAT_QUAI[thuongQueNum - 1];
    const haQue = BAT_QUAI[haQueNum - 1];

    const key = `${thuongQueNum}-${haQueNum}`;
    const queInfo = QUE_DATA[key] || {
      id: thuongQueNum * 8 + haQueNum,
      name: `${thuongQue.name} ${haQue.name}`,
      meaning: 'Thời kỳ trung bình, cần thận trọng',
      advice: 'Quan sát kỹ trước khi hành động. Giữ vững lập trường.',
      type: 'TRUNG'
    };

    // Xác định Thể/Dụng: quẻ chứa Hào Động là Dụng
    const isThanhDong = haoDong <= 3; // hào 1-3 thuộc Hạ Quẻ (Dụng), 4-6 thuộc Thượng Quẻ
    const theQue = isThanhDong ? thuongQue : haQue;
    const dungQue = isThanhDong ? haQue : thuongQue;
    const relation = getTheBodyRelation(theQue.hanh, dungQue.hanh);

    return {
      thuongQue, haQue, queInfo, haoDong,
      theQue, dungQue, relation
    };
  }

  // Tính quẻ hôm nay
  function getDailyQue() {
    let nam = 2026, thangAm = 6, ngayAm = 1;
    try {
      if (typeof Lunar !== 'undefined') {
        const lunar = Lunar.fromDate(new Date());
        const canNamIdx = lunar.getYearGanIndex ? lunar.getYearGanIndex() : 3;
        nam = (canNamIdx % 10) + 1;
        thangAm = Math.abs(lunar.getMonth());
        ngayAm = lunar.getDay();
      }
    } catch (e) {}
    return calcMaiHoa(nam, thangAm, ngayAm, 0);
  }

  // Vẽ 6 Hào
  function renderHaoLines(queResult, isAnimated) {
    const { thuongQue, haQue, haoDong, relation } = queResult;
    const allHao = [
      ...Array(3).fill(0).map((_, i) => ({ quai: haQue, idx: i + 1 })),
      ...Array(3).fill(0).map((_, i) => ({ quai: thuongQue, idx: i + 4 })),
    ];

    return `<div style="display:flex;flex-direction:column-reverse;gap:6px;align-items:center;width:100%;">
      ${allHao.map(({ quai, idx }) => {
        const isDong = idx === haoDong;
        const isYang = quai.name !== 'Khôn' && quai.name !== 'Đoài' && quai.name !== 'Khảm' && quai.name !== 'Cấn'; // Dương quẻ
        // Randomize yin/yang per position for visual variety
        const seed = (quai.id * 7 + idx * 3) % 2;
        const yang = seed === 0;

        return `<div style="display:flex;align-items:center;gap:10px;width:100%;justify-content:center;${isDong ? 'filter:brightness(1.5);' : ''}">
          <div style="font-size:0.7em;color:${isDong ? '#fbbf24' : 'var(--text-muted)'};min-width:16px;text-align:right;">${idx}</div>
          ${yang
            ? `<div style="height:8px;width:90px;background:${isDong ? '#fbbf24' : 'var(--text-secondary)'};border-radius:4px;${isAnimated && isDong ? 'animation:pulse 1.5s infinite;' : ''}"></div>`
            : `<div style="display:flex;gap:8px;">
                <div style="height:8px;width:40px;background:${isDong ? '#fbbf24' : 'var(--text-muted)'};border-radius:4px;"></div>
                <div style="height:8px;width:40px;background:${isDong ? '#fbbf24' : 'var(--text-muted)'};border-radius:4px;"></div>
               </div>`
          }
          ${isDong ? `<span style="color:#fbbf24;font-size:0.7em;">⟳</span>` : `<div style="width:16px;"></div>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  function getTypeColor(type) {
    const map = { 'DAI_CAT': '#10b981', 'CAT': '#3b82f6', 'TRUNG': '#f59e0b', 'HUNG': '#ef4444' };
    return map[type] || '#6b7280';
  }
  function getTypeLabel(type) {
    const map = { 'DAI_CAT': '🌟 Đại Cát', 'CAT': '✅ Cát', 'TRUNG': '⚖️ Trung', 'HUNG': '⚠️ Hung' };
    return map[type] || '⚪ Bình';
  }

  // ── Nhật Ký Gieo Quẻ ──
  const JOURNAL_KEY = 'iching_journal';

  function getJournal() {
    return App.Storage.get(JOURNAL_KEY) || [];
  }

  function saveJournal(entry) {
    const journal = getJournal();
    journal.unshift(entry);
    App.Storage.set(JOURNAL_KEY, journal);
    return entry;
  }

  function updateJournal(id, updates) {
    const journal = getJournal();
    const idx = journal.findIndex(e => e.id === id);
    if (idx !== -1) {
      journal[idx] = { ...journal[idx], ...updates };
      App.Storage.set(JOURNAL_KEY, journal);
    }
  }

  const CATEGORIES = [
    { id: 'WORK', label: '💼 Công việc', tag: '#công_việc' },
    { id: 'FINANCE', label: '💰 Tài chính', tag: '#tài_chính' },
    { id: 'LOVE', label: '❤️ Tình cảm', tag: '#tình_cảm' },
    { id: 'HEALTH', label: '🏥 Sức khỏe', tag: '#sức_khỏe' },
    { id: 'OTHER', label: '🔮 Khác', tag: '#khác' },
  ];

  let currentQueResult = null;
  let castingMode = 'TIME'; // 'COIN' | 'TIME' | 'NUMBER'

  function renderIching(container) {
    const dailyQue = getDailyQue();
    const journal = getJournal();
    const totalEntries = journal.length;
    const ratedEntries = journal.filter(e => e.rating > 0);
    const avgAccuracy = ratedEntries.length > 0
      ? Math.round(ratedEntries.reduce((s, e) => s + e.rating, 0) / ratedEntries.length * 20)
      : 0;

    container.innerHTML = `
    <div class="animate-fade-in">
      <div style="margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:5px;">☯ Quẻ Dịch & Nhật Ký Gieo Quẻ</h1>
        <p class="page-subtitle">Kinh Dịch — Công cụ dự báo vi mô cho từng quyết định cụ thể</p>
      </div>

      <!-- Daily Hexagram -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;align-items:start;">
        <div class="card" style="padding:24px;">
          <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">📅 Quẻ Chủ Hôm Nay (Mai Hoa Dịch Số)</div>
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:2em;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${dailyQue.queInfo.name}</div>
            <div style="display:flex;gap:8px;justify-content:center;align-items:center;margin-bottom:8px;">
              <span style="font-size:1.5em;">${dailyQue.thuongQue.symbol}</span>
              <span style="font-size:0.8em;color:var(--text-muted);">Thượng: ${dailyQue.thuongQue.name} | Hạ: ${dailyQue.haQue.name}</span>
              <span style="font-size:1.5em;">${dailyQue.haQue.symbol}</span>
            </div>
            <span style="font-size:0.85em;padding:4px 12px;border-radius:12px;background:${getTypeColor(dailyQue.queInfo.type)}22;color:${getTypeColor(dailyQue.queInfo.type)};font-weight:600;">${getTypeLabel(dailyQue.queInfo.type)}</span>
          </div>
          ${renderHaoLines(dailyQue, true)}
          <div style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;">
            <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:4px;">Ý nghĩa:</div>
            <div style="font-size:0.9em;color:var(--text-secondary);">${dailyQue.queInfo.meaning}</div>
          </div>
          <div style="margin-top:8px;padding:12px;background:${getTypeColor(dailyQue.queInfo.type)}11;border-left:3px solid ${getTypeColor(dailyQue.queInfo.type)};border-radius:4px;">
            <div style="font-size:0.85em;color:var(--text-secondary);">💡 ${dailyQue.queInfo.advice}</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- The/Dung Analysis -->
          <div class="card" style="padding:20px;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">⚗️ Phân Tích Thể - Dụng</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <div style="text-align:center;flex:1;">
                <div style="font-size:0.7em;color:var(--text-muted);">Thể (Bản thân)</div>
                <div style="font-size:1.3em;">${dailyQue.theQue.symbol}</div>
                <div style="font-size:0.85em;font-weight:600;">${dailyQue.theQue.name}</div>
                <div style="font-size:0.75em;color:var(--text-muted);">Hành ${dailyQue.theQue.hanh}</div>
              </div>
              <div style="text-align:center;padding:0 12px;display:flex;align-items:center;">
                <div style="font-size:1.4em;">${dailyQue.relation.icon}</div>
              </div>
              <div style="text-align:center;flex:1;">
                <div style="font-size:0.7em;color:var(--text-muted);">Dụng (Ngoại cảnh)</div>
                <div style="font-size:1.3em;">${dailyQue.dungQue.symbol}</div>
                <div style="font-size:0.85em;font-weight:600;">${dailyQue.dungQue.name}</div>
                <div style="font-size:0.75em;color:var(--text-muted);">Hành ${dailyQue.dungQue.hanh}</div>
              </div>
            </div>
            <div style="text-align:center;padding:8px;background:${dailyQue.relation.color}15;border-radius:6px;">
              <div style="font-weight:600;color:${dailyQue.relation.color};font-size:0.9em;">${dailyQue.relation.label}</div>
              <div style="font-size:0.8em;color:var(--text-secondary);margin-top:4px;">${dailyQue.relation.desc}</div>
            </div>
            <div style="margin-top:8px;font-size:0.75em;color:var(--text-muted);text-align:center;">Hào Động: Hào thứ ${dailyQue.haoDong}</div>
          </div>

          <!-- Stats -->
          <div class="card" style="padding:20px;">
            <div style="font-size:0.75em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">📊 Thống Kê Nhật Ký Của Bạn</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="text-align:center;">
                <div style="font-size:1.8em;font-weight:700;color:var(--primary-color);">${totalEntries}</div>
                <div style="font-size:0.75em;color:var(--text-muted);">Quẻ đã gieo</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:1.8em;font-weight:700;color:#10b981;">${avgAccuracy}%</div>
                <div style="font-size:0.75em;color:var(--text-muted);">Tỷ lệ ứng nghiệm</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cast Hexagram Section -->
      <div style="margin-bottom:24px;">
        <div class="section-title"><span class="icon">🎲</span> Gieo Quẻ Hỏi Việc</div>
        <div class="card" style="padding:24px;">
          <!-- Mode selector -->
          <div style="display:flex;gap:10px;margin-bottom:20px;">
            ${[
              { id: 'TIME', label: '⏱️ Mai Hoa Tức Thời', desc: 'Dùng chính xác giờ:phút:giây hiện tại' },
              { id: 'COIN', label: '🪙 Tung Đồng Xu', desc: 'Mô phỏng tung 3 đồng xu 6 lần' },
              { id: 'NUMBER', label: '🔢 Số Trực Giác', desc: 'Nhập 3 số nảy ra trong đầu' },
            ].map(m => `
            <div class="cast-mode-btn" data-mode="${m.id}" style="flex:1;padding:12px;border:1px solid ${castingMode === m.id ? 'var(--primary-color)' : 'var(--border-color)'};border-radius:8px;cursor:pointer;background:${castingMode === m.id ? 'rgba(99,102,241,0.1)' : 'transparent'};transition:all 0.2s;">
              <div style="font-weight:600;font-size:0.9em;margin-bottom:4px;">${m.label}</div>
              <div style="font-size:0.75em;color:var(--text-muted);">${m.desc}</div>
            </div>`).join('')}
          </div>

          <div id="cast-input-area">
            ${renderCastInputArea('TIME')}
          </div>

          <!-- Question Input -->
          <div style="margin-top:16px;">
            <label style="font-size:0.8em;color:var(--text-muted);display:block;margin-bottom:6px;">Câu hỏi của bạn:</label>
            <input id="cast-question" type="text" class="form-control" placeholder="Ví dụ: Tôi có nên ký hợp đồng này không?" style="width:100%;margin-bottom:10px;">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <select id="cast-category" class="form-control" style="max-width:180px;background:rgba(255,255,255,0.05);border:1px solid var(--border-color);color:var(--text-base);border-radius:4px;padding:4px 8px;">
                ${CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
              </select>
              <button id="cast-btn" class="btn btn-primary">🎲 Gieo Quẻ Ngay</button>
            </div>
          </div>

          <!-- Result Area -->
          <div id="cast-result" style="margin-top:20px;display:none;"></div>
        </div>
      </div>

      <!-- Journal List -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="section-title" style="margin:0;"><span class="icon">📓</span> Sổ Tay Quẻ Dịch</div>
          <div style="display:flex;gap:8px;">
            ${CATEGORIES.map(c => `<button class="journal-filter btn btn-ghost btn-sm" data-cat="${c.id}" style="font-size:0.7em;">${c.tag}</button>`).join('')}
          </div>
        </div>
        <div id="journal-list">
          ${renderJournalList(journal)}
        </div>
      </div>
    </div>
    `;

    bindIchingEvents(container);
  }

  function renderCastInputArea(mode) {
    if (mode === 'TIME') {
      return `<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:0.85em;color:var(--text-secondary);">Hệ thống sẽ lấy chính xác giờ:phút:giây tại khoảnh khắc bạn bấm <strong>"Gieo Quẻ"</strong> để lập quẻ. Hãy đặt câu hỏi trong tâm trí và bấm khi sẵn sàng.</div>`;
    }
    if (mode === 'COIN') {
      return `<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:0.85em;color:var(--text-secondary);">Hệ thống sẽ mô phỏng tung 3 đồng xu <strong>6 lần</strong> để lập 6 hào quẻ. Kết quả ngẫu nhiên theo xác suất thực của đồng xu.</div>`;
    }
    if (mode === 'NUMBER') {
      return `<div>
        <label style="font-size:0.8em;color:var(--text-muted);display:block;margin-bottom:6px;">Nhập 3 con số từ 1-99 nảy ra trong đầu:</label>
        <div style="display:flex;gap:10px;">
          <input id="num1" type="number" min="1" max="99" class="form-control" style="width:80px;text-align:center;" placeholder="Số 1">
          <input id="num2" type="number" min="1" max="99" class="form-control" style="width:80px;text-align:center;" placeholder="Số 2">
          <input id="num3" type="number" min="1" max="99" class="form-control" style="width:80px;text-align:center;" placeholder="Số 3">
        </div>
      </div>`;
    }
    return '';
  }

  function castQue(mode) {
    let thuong, ha, dong;
    const now = new Date();

    if (mode === 'TIME') {
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours();
      thuong = ((h + m + s) % 8) || 8;
      ha = ((h + m + s + 1) % 8) || 8;
      dong = ((h + m + s + 1) % 6) || 6;
    } else if (mode === 'COIN') {
      // Simulate 6 coin tosses
      const haoValues = Array.from({ length: 6 }, () => {
        const coins = [Math.random() > 0.5 ? 3 : 2, Math.random() > 0.5 ? 3 : 2, Math.random() > 0.5 ? 3 : 2];
        return coins.reduce((a, b) => a + b, 0);
      });
      thuong = ((haoValues[0] + haoValues[1] + haoValues[2]) % 8) || 8;
      ha = ((haoValues[3] + haoValues[4] + haoValues[5]) % 8) || 8;
      dong = (haoValues.indexOf(Math.max(...haoValues)) + 1) || 1;
    } else if (mode === 'NUMBER') {
      const n1 = parseInt(document.getElementById('num1')?.value || '3');
      const n2 = parseInt(document.getElementById('num2')?.value || '5');
      const n3 = parseInt(document.getElementById('num3')?.value || '8');
      thuong = (n1 % 8) || 8;
      ha = (n2 % 8) || 8;
      dong = (n3 % 6) || 6;
    }

    const thuongQue = BAT_QUAI[(thuong || 1) - 1] || BAT_QUAI[0];
    const haQue = BAT_QUAI[(ha || 1) - 1] || BAT_QUAI[0];
    const key = `${thuong}-${ha}`;
    const queInfo = QUE_DATA[key] || {
      name: `${thuongQue.name} - ${haQue.name}`,
      meaning: 'Quẻ trung bình, cần thận trọng và quan sát kỹ lưỡng',
      advice: 'Bình tĩnh phân tích tình hình. Không vội vã hành động.',
      type: 'TRUNG'
    };

    const isThanhDong = dong <= 3;
    const theQue = isThanhDong ? thuongQue : haQue;
    const dungQue = isThanhDong ? haQue : thuongQue;
    const relation = getTheBodyRelation(theQue.hanh, dungQue.hanh);

    return { thuongQue, haQue, queInfo, haoDong: dong, theQue, dungQue, relation };
  }

  function renderCastResult(result) {
    return `
    <div style="border-top:1px solid var(--border-color);padding-top:20px;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:2em;">${result.thuongQue.symbol}${result.haQue.symbol}</div>
        <div style="font-size:1.3em;font-weight:700;color:var(--text-primary);">${result.queInfo.name}</div>
        <span style="font-size:0.85em;padding:4px 12px;border-radius:12px;background:${getTypeColor(result.queInfo.type)}22;color:${getTypeColor(result.queInfo.type)};font-weight:600;">${getTypeLabel(result.queInfo.type)}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;margin-bottom:16px;">
        ${renderHaoLines(result, false)}
        <div>
          <div style="margin-bottom:10px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px;">
            <div style="font-size:0.75em;color:var(--text-muted);">Ý nghĩa</div>
            <div style="font-size:0.9em;color:var(--text-secondary);">${result.queInfo.meaning}</div>
          </div>
          <div style="padding:10px;background:${result.relation.color}12;border-left:3px solid ${result.relation.color};border-radius:4px;">
            <div style="font-size:0.8em;font-weight:600;color:${result.relation.color};">${result.relation.icon} ${result.relation.label}</div>
            <div style="font-size:0.8em;color:var(--text-secondary);margin-top:4px;">${result.relation.desc}</div>
          </div>
        </div>
      </div>
      <div style="padding:12px;background:${getTypeColor(result.queInfo.type)}11;border-radius:8px;margin-bottom:16px;">
        <div style="font-size:0.85em;font-weight:600;color:${getTypeColor(result.queInfo.type)};margin-bottom:4px;">💡 Lời khuyên của quẻ</div>
        <div style="font-size:0.85em;color:var(--text-secondary);">${result.queInfo.advice}</div>
      </div>
      <button id="save-cast-btn" class="btn btn-primary" style="width:100%;">💾 Lưu Vào Nhật Ký</button>
    </div>`;
  }

  function renderJournalList(journal, filterCat) {
    const filtered = filterCat ? journal.filter(e => e.category === filterCat) : journal;
    if (filtered.length === 0) {
      return `<div style="text-align:center;padding:40px;color:var(--text-muted);">Chưa có quẻ nào được lưu.<br><span style="font-size:0.85em;">Gieo quẻ và lưu nhật ký để bắt đầu!</span></div>`;
    }
    return `<div style="display:flex;flex-direction:column;gap:12px;">
      ${filtered.map(entry => {
        const cat = CATEGORIES.find(c => c.id === entry.category);
        return `
        <div class="card" id="journal-${entry.id}" style="padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div>
              <div style="font-weight:600;color:var(--text-primary);font-size:0.95em;">${entry.queName}</div>
              <div style="font-size:0.75em;color:var(--text-muted);margin-top:2px;">${App.Utils.formatDateTime(entry.createdAt)} • ${cat?.label || ''}</div>
            </div>
            <span style="font-size:0.8em;padding:3px 8px;border-radius:4px;background:${getTypeColor(entry.queType)}22;color:${getTypeColor(entry.queType)};">${getTypeLabel(entry.queType)}</span>
          </div>
          ${entry.question ? `<div style="font-size:0.85em;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">"${entry.question}"</div>` : ''}
          <div style="font-size:0.8em;color:var(--text-muted);margin-bottom:8px;">${entry.advice}</div>
          ${entry.outcome ? `
          <div style="margin-top:8px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px;">
            <div style="font-size:0.75em;color:var(--text-muted);margin-bottom:4px;">📝 Kết quả thực tế:</div>
            <div style="font-size:0.85em;color:var(--text-secondary);">${entry.outcome}</div>
            ${entry.rating > 0 ? `<div style="margin-top:6px;">${'⭐'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)} <span style="font-size:0.75em;color:var(--text-muted);">(${entry.rating}/5 ứng nghiệm)</span></div>` : ''}
          </div>
          ` : `
          <div style="margin-top:8px;">
            <button class="add-outcome-btn btn btn-ghost btn-sm" data-id="${entry.id}" style="font-size:0.75em;border:1px dashed var(--border-color);">+ Thêm kết quả thực tế</button>
          </div>
          `}
        </div>`;
      }).join('')}
    </div>`;
  }

  function bindIchingEvents(container) {
    // Mode selector
    container.querySelectorAll('.cast-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        castingMode = btn.dataset.mode;
        container.querySelectorAll('.cast-mode-btn').forEach(b => {
          b.style.borderColor = 'var(--border-color)';
          b.style.background = 'transparent';
        });
        btn.style.borderColor = 'var(--primary-color)';
        btn.style.background = 'rgba(99,102,241,0.1)';
        document.getElementById('cast-input-area').innerHTML = renderCastInputArea(castingMode);
      });
    });

    // Cast button
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) {
      castBtn.addEventListener('click', () => {
        castBtn.textContent = '🎲 Đang gieo...';
        castBtn.disabled = true;
        setTimeout(() => {
          currentQueResult = castQue(castingMode);
          const resultDiv = document.getElementById('cast-result');
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = renderCastResult(currentQueResult);

          // Bind save button
          document.getElementById('save-cast-btn')?.addEventListener('click', () => {
            const question = document.getElementById('cast-question')?.value || '';
            const category = document.getElementById('cast-category')?.value || 'OTHER';
            const entry = {
              id: App.Utils.generateId(),
              createdAt: new Date().toISOString(),
              question,
              category,
              queName: currentQueResult.queInfo.name,
              queType: currentQueResult.queInfo.type,
              advice: currentQueResult.queInfo.advice,
              thuong: currentQueResult.thuongQue.name,
              ha: currentQueResult.haQue.name,
              haoDong: currentQueResult.haoDong,
              outcome: '',
              rating: 0,
            };
            saveJournal(entry);
            document.getElementById('journal-list').innerHTML = renderJournalList(getJournal());
            App.Toast.show('✅ Đã lưu quẻ vào nhật ký!', 'success');
            bindOutcomeButtons(container);
          });

          castBtn.textContent = '🎲 Gieo Quẻ Ngay';
          castBtn.disabled = false;
        }, 600);
      });
    }

    // Journal filters
    container.querySelectorAll('.journal-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        document.getElementById('journal-list').innerHTML = renderJournalList(getJournal(), cat);
        bindOutcomeButtons(container);
      });
    });

    bindOutcomeButtons(container);
  }

  function bindOutcomeButtons(container) {
    container.querySelectorAll('.add-outcome-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        App.Modal.show(`
          <div>
            <label style="font-size:0.85em;color:var(--text-muted);display:block;margin-bottom:6px;">Kết quả thực tế:</label>
            <textarea id="modal-outcome" class="form-control" rows="4" placeholder="Việc đã xảy ra như thế nào?" style="width:100%;margin-bottom:12px;resize:vertical;"></textarea>
            <label style="font-size:0.85em;color:var(--text-muted);display:block;margin-bottom:8px;">Độ ứng nghiệm:</label>
            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px;">
              ${[1,2,3,4,5].map(r => `<button class="rating-btn btn btn-ghost" data-r="${r}" style="font-size:1.2em;border:1px solid var(--border-color);">${'⭐'.repeat(r)}</button>`).join('')}
            </div>
            <button id="modal-save-outcome" class="btn btn-primary" style="width:100%;" disabled>Lưu Kết Quả</button>
          </div>
        `, { title: '📝 Cập Nhật Kết Quả Quẻ' });

        let selectedRating = 0;
        document.querySelectorAll('.rating-btn').forEach(rb => {
          rb.addEventListener('click', () => {
            selectedRating = parseInt(rb.dataset.r);
            document.querySelectorAll('.rating-btn').forEach(b => b.style.background = 'transparent');
            rb.style.background = 'rgba(251,191,36,0.15)';
            document.getElementById('modal-save-outcome').disabled = false;
          });
        });

        document.getElementById('modal-save-outcome')?.addEventListener('click', () => {
          const outcome = document.getElementById('modal-outcome')?.value || '';
          updateJournal(id, { outcome, rating: selectedRating });
          document.getElementById('journal-list').innerHTML = renderJournalList(getJournal());
          App.Modal.close();
          bindOutcomeButtons(container);
          App.Toast.show('✅ Đã cập nhật kết quả!', 'success');
        });
      });
    });
  }

  window.renderIching = renderIching;
})();
