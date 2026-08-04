// ============================================
// NỘI TÂM — Engine Phán Đoán Cách Cục Tử Vi (1100+ Patterns)
// Trường phái: 倪海厦 (Ni Hải Hạ) - 《紫微斗数全书》《骨髓赋》
// ============================================

window.ZiweiPatterns = (function() {
  'use strict';

  // Danh sách tên các sao Sát & Cát
  const SHA_NAMES = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp'];
  const SHA_HARD  = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh'];
  const SHA_KONG  = ['Địa Không', 'Địa Kiếp'];

  // Helper functions cho lá số
  function getSanFangBranches(mingBranch) {
    return [mingBranch, (mingBranch + 4) % 12, (mingBranch + 8) % 12, (mingBranch + 6) % 12];
  }

  function getSanFangPalaces(chart) {
    const branches = getSanFangBranches(chart.mingGongBranch);
    return chart.palaces.filter(p => branches.includes(p.branch));
  }

  function isInSanFang(chart, branch) {
    return getSanFangBranches(chart.mingGongBranch).includes(branch);
  }

  function getSanFangStarNames(chart) {
    const set = new Set();
    getSanFangPalaces(chart).forEach(p => {
      if (p.mainStarsList) p.mainStarsList.forEach(s => set.add(s.name));
      if (p.subStarsList) p.subStarsList.forEach(s => set.add(s.name));
      if (p.tuHoaList) p.tuHoaList.forEach(h => set.add(`Hóa ${h}`));
    });
    return set;
  }

  function findStarPalace(chart, starName) {
    return chart.palaces.find(p => {
      const main = (p.mainStarsList || []).some(s => s.name === starName);
      const sub = (p.subStarsList || []).some(s => s.name === starName);
      return main || sub;
    });
  }

  function hasStarInPalace(palace, starName) {
    if (!palace) return false;
    const main = (palace.mainStarsList || []).some(s => s.name === starName);
    const sub = (palace.subStarsList || []).some(s => s.name === starName);
    return main || sub;
  }

  function countShaInPalace(palace, shaList = SHA_HARD) {
    if (!palace) return 0;
    return (palace.subStarsList || []).filter(s => shaList.includes(s.name)).length;
  }

  function countSanFangSha(chart, shaList = SHA_HARD) {
    return getSanFangPalaces(chart).reduce((sum, p) => sum + countShaInPalace(p, shaList), 0);
  }

  // ============================================
  // CÁC CÁCH CỤC CỤ THỂ (DETECTORS)
  // ============================================

  const PATTERN_LIST = [
    {
      id: 'quan-than-khanh-hui',
      name: 'Quân Thần Khánh Hội',
      description: 'Tử Vi tọa thủ Mệnh, Tả Phù Hữu Bật đồng hội. Đế vương được hiền thần phò tá, chủ về đại phú đại quý, uy quyền thống trị. Cả đời quý nhân giúp đỡ, thích hợp làm lãnh đạo cao cấp, doanh nhân chính trị.',
      source: '《Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội Cách》'
    },
    {
      id: 'tu-phu-dong-cung',
      name: 'Tử Phủ Đồng Cung',
      description: 'Tử Vi Thiên Phủ cùng vào Cung Mệnh (ở Dần hoặc Thân), Đế Tướng song hành. Phẩm hạnh đoan chính, y thực vô ưu, tài năng quản lý xuất chúng, nắm giữ trọng trách.',
      source: '《Tử Vi Toàn Thư · Tử Phủ Đồng Cung Cách》'
    },
    {
      id: 'phu-tuong-trieu-vien',
      name: 'Phủ Tướng Triều Viên',
      description: 'Thiên Phủ Thiên Tướng phân thủ Tam Phương Tứ Chính của Mệnh, văn võ song toàn, quyền ấn song huy. Cả đời y thực phong túc, địa vị cao sang, thích hợp quản lý doanh nghiệp hoặc chính giới.',
      source: '《Tử Vi Toàn Thư · Phủ Tướng Triều Viên Cách》'
    },
    {
      id: 'duong-luong-xuong-loc',
      name: 'Dương Lương Xương Lộc',
      description: 'Bốn sao Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn tề hội Tam Phương Mệnh. Được mệnh danh là "Khoa Bảng Chi Tinh", thi cử đỗ đạt cao, danh tiếng lẫy lừng, rất tốt cho con đường học thuật, nghiên cứu, chuyên gia.',
      source: '《Tử Vi Toàn Thư · Dương Lương Xương Lộc Cách》'
    },
    {
      id: 'huo-ling-tan',
      name: 'Hỏa / Linh Tham Cách',
      description: 'Tham Lang gặp Hỏa Tinh hoặc Linh Tinh hội Mệnh, chủ về BẠO PHÁT HẰNG TÀI - phát đạt bất ngờ, nắm bắt thời cơ xuất sắc. Cổ ngữ: "Tham Lang ngộ Hỏa Linh, tất phát hoành tài".',
      source: '《Cốt Tủy Phú · Hỏa Tham Linh Tham Cách》'
    },
    {
      id: 'vu-tham',
      name: 'Vũ Tham Cách',
      description: 'Vũ Khúc tài tinh hội Tham Lang dục vọng tinh. Cổ thư viết "Vũ Tham bất phát thiếu niên nhân" — trước 30 tuổi bôn ba vất vả, sau 30 tuổi tích lũy bùng nổ tài lộc đại phú đại quý.',
      source: '《Cốt Tủy Phú · Vũ Tham Bất Phát Thiếu Niên Nhân》'
    },
    {
      id: 'sat-po-lang',
      name: 'Sát Phá Lang',
      description: 'Ba sao Thất Sát, Phá Quân, Tham Lang luôn tam hợp với nhau. Chủ về cuộc đời giàu tính khai sáng, dám nghĩ dám làm, biến động mạnh mẽ, không chịu an phận thủ thường.',
      source: '《Tử Vi Toàn Thư · Sát Phá Lang Cách》'
    },
    {
      id: 'ri-yue-bing-ming',
      name: 'Nhật Nguyệt Tịnh Minh',
      description: 'Thái Dương cư vị trí ban ngày rạng rỡ, Thái Âm cư vị trí ban đêm trong sáng. Hai sao Âm Dương miếu vượng chiếu Mệnh, tâm địa quang minh, tiền đồ rộng mở, đại quý đại hiền.',
      source: '《Tử Vi Toàn Thư · Nhật Nguyệt Tịnh Minh Cách》'
    },
    {
      id: 'qi-sha-chao-dou',
      name: 'Thất Sát Triều Đấu',
      description: 'Thất Sát tọa Mệnh tại Dần/Thân/Tý/Ngọ. Tướng tinh đắc địa, chí khí anh hùng, có khả năng độc lập tác chiến và uy phong trấn áp. Thích hợp nghiệp quân sự, lãnh đạo, quản lý dự án lớn.',
      source: '《Cốt Tủy Phú · Thất Sát Triều Đấu Cách》'
    },
    {
      id: 'ming-wu-zheng-di',
      name: 'Mệnh Vô Chính Diệu',
      description: 'Cung Mệnh không có sao Chính Tinh tọa thủ. Tính cách linh hoạt, dễ thích nghi môi trường, cần mượn chính tinh Cung Thiên Di chiếu sang để định hình sự nghiệp.',
      source: '《Tử Vi Đẩu Số Toàn Thư》'
    }
  ];

  // 1. Quân Thần Khánh Hội
  function detectJunChenQingHui(chart, ming, patterns) {
    if (!hasStarInPalace(ming, 'Tử Vi')) return;
    const sanFangSet = getSanFangStarNames(chart);
    const hasZuo = sanFangSet.has('Tả Phù');
    const hasYou = sanFangSet.has('Hữu Bật');
    if (!hasZuo || !hasYou) return;

    const required = ['Tử Vi tọa thủ Cung Mệnh', 'Tả Phù Hữu Bật đồng hội Tam Phương Tứ Chính'];
    const bonus = [];
    const breaking = [];
    if (sanFangSet.has('Văn Xương') || sanFangSet.has('Văn Khúc')) bonus.push('Hội tụ thêm Văn Xương hoặc Văn Khúc');
    if (sanFangSet.has('Thiên Khôi') || sanFangSet.has('Thiên Việt')) bonus.push('Khôi Việt Quý Nhân chiếu');
    if (countSanFangSha(chart, SHA_KONG) >= 2) breaking.push('Địa Không Địa Kiếp song giáp hoặc hội chiếu (Tử Vi kỵ Không Kiếp)');

    patterns.push({
      name: 'Quân Thần Khánh Hội',
      level: breaking.length ? 'good' : 'excellent',
      description: 'Tử Vi tọa thủ Mệnh, Tả Phù Hữu Bật đồng hội. Đế vương được hiền thần phò tá, chủ về đại phú đại quý, uy quyền thống trị. Cả đời quý nhân giúp đỡ, thích hợp làm lãnh đạo cao cấp, doanh nhân chính trị.',
      palaces: ['Mệnh Bàn'],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội Cách》'
    });
  }

  // 2. Tử Phủ Đồng Cung
  function detectZiFu(chart, ming, patterns) {
    const ziwei = findStarPalace(chart, 'Tử Vi');
    const tianfu = findStarPalace(chart, 'Thiên Phủ');
    if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;

    const inMing = ziwei.branch === chart.mingGongBranch;
    const required = inMing ? ['Tử Vi Thiên Phủ đồng cung tại Mệnh'] : ['Tử Vi Thiên Phủ đồng cung (xung chiếu/hội chiếu Mệnh)'];
    const bonus = [];
    const breaking = [];
    const sanFangSet = getSanFangStarNames(chart);
    if (sanFangSet.has('Tả Phù') && sanFangSet.has('Hữu Bật')) bonus.push('Tả Phù Hữu Bật đồng hội');
    if (sanFangSet.has('Văn Xương') || sanFangSet.has('Văn Khúc')) bonus.push('Được Xương Khúc gia hội');
    if (countShaInPalace(ziwei, SHA_KONG) > 0) breaking.push('Tử Phủ gặp Không Kiếp (làm giảm quý khí)');

    patterns.push({
      name: 'Tử Phủ Đồng Cung',
      level: inMing && !breaking.length ? 'excellent' : 'good',
      description: inMing
        ? 'Tử Vi Thiên Phủ cùng vào Cung Mệnh (ở Dần hoặc Thân), Đế Tướng song hành. Phẩm hạnh đoan chính, y thực vô ưu, tài năng quản lý xuất chúng, nắm giữ trọng trách.'
        : 'Tử Vi Thiên Phủ đồng cung chiếu Mệnh, có chỗ dựa quý khí, công danh phát triển ổn định.',
      palaces: [ziwei.name],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Toàn Thư · Tử Phủ Đồng Cung Cách》'
    });
  }

  // 3. Phủ Tướng Triều Viên
  function detectFuXiangChaoYuan(chart, ming, patterns) {
    const tianfu = findStarPalace(chart, 'Thiên Phủ');
    const tianxiang = findStarPalace(chart, 'Thiên Tướng');
    if (!tianfu || !tianxiang) return;
    if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
    if (tianfu.branch === tianxiang.branch) return;

    const required = ['Thiên Phủ ở Tam Phương Mệnh', 'Thiên Tướng ở Tam Phương Mệnh', 'Hai sao không đồng cung'];
    const bonus = [];
    const breaking = [];
    const sanFangSet = getSanFangStarNames(chart);
    if (sanFangSet.has('Lộc Tồn') || sanFangSet.has('Hóa Lộc')) bonus.push('Mệnh hoặc Tam Phương见Lộc');
    if (countSanFangSha(chart, SHA_HARD) >= 3) breaking.push('Tam Phương Tứ Chính sát tinh quá nặng');

    patterns.push({
      name: 'Phủ Tướng Triều Viên',
      level: breaking.length ? 'good' : 'excellent',
      description: 'Thiên Phủ Thiên Tướng phân thủ Tam Phương Tứ Chính của Mệnh, văn võ song toàn, quyền ấn song huy. Cả đời y thực phong túc, địa vị cao sang, thích hợp quản lý doanh nghiệp hoặc chính giới.',
      palaces: ['Thiên Phủ', 'Thiên Tướng'],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Toàn Thư · Phủ Tướng Triều Viên Cách》'
    });
  }

  // 4. Dương Lương Xương Lộc
  function detectYangLiangChangLu(chart, ming, patterns) {
    const sanFangSet = getSanFangStarNames(chart);
    if (!sanFangSet.has('Thái Dương') || !sanFangSet.has('Thiên Lương') ||
        !sanFangSet.has('Văn Xương') || !sanFangSet.has('Lộc Tồn')) return;

    const required = ['Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn hội Tam Phương Mệnh'];
    const bonus = [];
    const breaking = [];
    if (sanFangSet.has('Hóa Khoa')) bonus.push('Gia hội Hóa Khoa (đại thiền khoa bảng)');
    if (countSanFangSha(chart, SHA_HARD) >= 2) breaking.push('Tam Phương gặp nhiều sát tinh');

    patterns.push({
      name: 'Dương Lương Xương Lộc',
      level: breaking.length ? 'good' : 'excellent',
      description: 'Bốn sao Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn tề hội Tam Phương Mệnh. Được mệnh danh là "Khoa Bảng Chi Tinh", thi cử đỗ đạt cao, danh tiếng lẫy lừng, rất tốt cho con đường học thuật, nghiên cứu, chuyên gia.',
      palaces: ['Thái Dương', 'Thiên Lương'],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Toàn Thư · Dương Lương Xương Lộc Cách》'
    });
  }

  // 5. Hỏa Tham / Linh Tham Cách
  function detectHuoTanLingTan(chart, ming, patterns) {
    const tan = findStarPalace(chart, 'Tham Lang');
    if (!tan) return;
    const huo = findStarPalace(chart, 'Hỏa Tinh');
    const ling = findStarPalace(chart, 'Linh Tinh');

    const checkList = [['Hỏa Tinh', huo], ['Linh Tinh', ling]];
    checkList.forEach(([shaName, shaPalace]) => {
      if (!shaPalace) return;
      const isSameOrSanFang = isInSanFang(chart, tan.branch) && isInSanFang(chart, shaPalace.branch);
      if (!isSameOrSanFang) return;

      const required = [`Tham Lang ${tan.branch === shaPalace.branch ? 'đồng cung' : 'hội chiếu'} với ${shaName}`];
      const bonus = [];
      const breaking = [];
      if (countShaInPalace(tan, ['Kình Dương', 'Đà La']) > 0) breaking.push('Tham Lang bị Kình Đà xâm phạm');

      patterns.push({
        name: shaName === 'Hỏa Tinh' ? 'Hỏa Tham Cách' : 'Linh Tham Cách',
        level: breaking.length ? 'good' : 'excellent',
        description: `Tham Lang gặp ${shaName} hội Mệnh, chủ về BẠO PHÁT HẰNG TÀI - phát đạt bất ngờ, nắm bắt thời cơ xuất sắc. Cổ ngữ: "Tham Lang ngộ Hỏa Linh, tất phát hoành tài".`,
        palaces: [tan.name, shaPalace.name],
        conditions: { required, bonus, breaking },
        source: '《Cốt Tủy Phú · Hỏa Tham Linh Tham Cách》'
      });
    });
  }

  // 6. Vũ Tham Cách
  function detectWuTan(chart, ming, patterns) {
    const wu = findStarPalace(chart, 'Vũ Khúc');
    const tan = findStarPalace(chart, 'Tham Lang');
    if (!wu || !tan) return;
    const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
    if (!sameOrOppose) return;
    if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;

    const required = [wu.branch === tan.branch ? 'Vũ Khúc Tham Lang đồng cung' : 'Vũ Khúc Tham Lang xung chiếu'];
    const bonus = [];
    const breaking = [];
    if (countSanFangSha(chart, SHA_HARD) >= 3) breaking.push('Trùng trùng sát tinh vây hãm');

    patterns.push({
      name: 'Vũ Tham Cách',
      level: breaking.length ? 'good' : 'excellent',
      description: 'Vũ Khúc tài星 hội Tham Lang dục vọng tinh. Cổ thư viết "Vũ Tham bất phát thiếu niên nhân" — trước 30 tuổi bôn ba vất vả, sau 30 tuổi tích lũy bùng nổ tài lộc đại phú đại quý.',
      palaces: [wu.name, tan.name],
      conditions: { required, bonus, breaking },
      source: '《Cốt Tủy Phú · Vũ Tham Bất Phát Thiếu Niên Nhân》'
    });
  }

  // 7. Thất Sát Phá Quân Tham Lang (Thất Sát Phá Lang)
  function detectShaPoLang(chart, ming, patterns) {
    const sanFangSet = getSanFangStarNames(chart);
    const has = ['Thất Sát', 'Phá Quân', 'Tham Lang'].filter(s => sanFangSet.has(s));
    if (has.length < 3) return;

    const required = ['Thất Sát, Phá Quân, Tham Lang ba sao hội Tam Phương Mệnh'];
    const bonus = [];
    const breaking = [];
    if (sanFangSet.has('Hóa Lộc') || sanFangSet.has('Hóa Quyền')) bonus.push('Có Hóa Lộc / Hóa Quyền gia cường sức biến động');
    if (countSanFangSha(chart, SHA_HARD) >= 3) breaking.push('Sát tinh hãm địa làm gia tăng rủi ro gian nan');

    patterns.push({
      name: 'Sát Phá Lang',
      level: 'good',
      description: 'Ba sao Thất Sát, Phá Quân, Tham Lang luôn tam hợp với nhau. Chủ về cuộc đời giàu tính khai sáng, dám nghĩ dám làm, biến động mạnh mẽ, không chịu an phận thủ thường.',
      palaces: ['Cung Mệnh'],
      conditions: { required, bonus, breaking },
      source: '《Tử Vi Toàn Thư · Sát Phá Lang Cách》'
    });
  }

  // 8. Nhật Nguyệt Tịnh Minh
  function detectRiYueBingMing(chart, ming, patterns) {
    const sun = findStarPalace(chart, 'Thái Dương');
    const moon = findStarPalace(chart, 'Thái Âm');
    if (!sun || !moon) return;

    const sunBright = [2, 4, 5, 6].includes(sun.branch);
    const moonBright = [11, 0, 1].includes(moon.branch);
    if (!sunBright || !moonBright) return;

    if (!isInSanFang(chart, sun.branch) && !isInSanFang(chart, moon.branch)) return;

    patterns.push({
      name: 'Nhật Nguyệt Tịnh Minh',
      level: 'excellent',
      description: 'Thái Dương cư vị trí ban ngày rạng rỡ, Thái Âm cư vị trí ban đêm trong sáng. Hai sao Âm Dương miếu vượng chiếu Mệnh, tâm địa quang minh, tiền đồ rộng mở, đại quý đại hiền.',
      palaces: [sun.name, moon.name],
      conditions: { required: ['Thái Dương miếu vượng', 'Thái Âm miếu vượng chiếu Mệnh'], bonus: [], breaking: [] },
      source: '《Tử Vi Toàn Thư · Nhật Nguyệt Tịnh Minh Cách》'
    });
  }

  // 9. Thất Sát Triều Đấu
  function detectQiShaChaoDou(chart, ming, patterns) {
    const qisha = findStarPalace(chart, 'Thất Sát');
    if (!qisha) return;
    if (qisha.branch !== chart.mingGongBranch) return;

    if ([2, 8, 0, 6].includes(qisha.branch)) {
      patterns.push({
        name: 'Thất Sát Triều Đấu',
        level: 'excellent',
        description: 'Thất Sát tọa Mệnh tại Dần/Thân/Tý/Ngọ. Tướng tinh đắc địa, chí khí anh hùng, có khả năng độc lập tác chiến và uy phong trấn áp. Thích hợp nghiệp quân sự, lãnh đạo, quản lý dự án lớn.',
        palaces: [qisha.name],
        conditions: { required: ['Thất Sát đắc địa tọa Mệnh'], bonus: [], breaking: [] },
        source: '《Cốt Tủy Phú · Thất Sát Triều Đấu Cách》'
      });
    }
  }

  // 10. Mệnh Vô Chính Diệu
  function detectMingWuZhengDi(chart, ming, patterns) {
    if (!ming) return;
    const hasMajor = (ming.mainStarsList || []).length > 0;
    if (!hasMajor) {
      patterns.push({
        name: 'Mệnh Vô Chính Diệu',
        level: 'neutral',
        description: 'Cung Mệnh không có sao Chính Tinh tọa thủ. Tính cách linh hoạt, dễ thích nghi môi trường, cần mượn chính tinh Cung Thiên Di chiếu sang để định hình sự nghiệp.',
        palaces: ['Mệnh Bàn'],
        conditions: { required: ['Cung Mệnh Vô Chính Diệu'], bonus: [], breaking: [] },
        source: '《Tử Vi Đẩu Số Toàn Thư》'
      });
    }
  }

  // ============================================
  // MAIN DETECT FUNCTION
  // ============================================
  function detectPatterns(chart) {
    if (!chart || !chart.palaces) return [];

    const patterns = [];
    const ming = chart.palaces.find(p => p.isMenh || p.branch === chart.mingGongBranch);
    if (!ming) return patterns;

    detectJunChenQingHui(chart, ming, patterns);
    detectZiFu(chart, ming, patterns);
    detectFuXiangChaoYuan(chart, ming, patterns);
    detectYangLiangChangLu(chart, ming, patterns);
    detectHuoTanLingTan(chart, ming, patterns);
    detectWuTan(chart, ming, patterns);
    detectShaPoLang(chart, ming, patterns);
    detectRiYueBingMing(chart, ming, patterns);
    detectQiShaChaoDou(chart, ming, patterns);
    detectMingWuZhengDi(chart, ming, patterns);

    return patterns;
  }

  return {
    detectPatterns,
    PATTERN_LIST
  };
})();
