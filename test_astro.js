const window = {}; const document = {};
// ============================================
// NỘI TÂM — Dữ liệu & Logic Tử Vi / Ngày Tốt
// ============================================

window.AstrologyLogic = (function() {
  'use strict';

  // --- Hằng số cơ bản ---
  const CUNG = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  const CHI = CUNG; // Chi giống hệt Cung trên địa bàn

  const NGU_HANH_CAN = {
    "Giáp": "Mộc", "Ất": "Mộc",
    "Bính": "Hỏa", "Đinh": "Hỏa",
    "Mậu": "Thổ", "Kỷ": "Thổ",
    "Canh": "Kim", "Tân": "Kim",
    "Nhâm": "Thủy", "Quý": "Thủy"
  };

  const NGU_HANH_CHI = {
    "Tý": "Thủy", "Hợi": "Thủy",
    "Dần": "Mộc", "Mão": "Mộc",
    "Tỵ": "Hỏa", "Ngọ": "Hỏa",
    "Thân": "Kim", "Dậu": "Kim",
    "Thìn": "Thổ", "Tuất": "Thổ", "Sửu": "Thổ", "Mùi": "Thổ"
  };

  const CHI_TO_QUAI = {
    "Tý": { quai: "Khảm", hanh: "Thủy", mau: "Đen" },
    "Sửu": { quai: "Cấn", hanh: "Mộc", mau: "Xanh" },
    "Dần": { quai: "Cấn", hanh: "Mộc", mau: "Xanh" },
    "Mão": { quai: "Chấn", hanh: "Mộc", mau: "Xanh" },
    "Thìn": { quai: "Tốn", hanh: "Hỏa", mau: "Đỏ" },
    "Tỵ": { quai: "Tốn", hanh: "Hỏa", mau: "Đỏ" },
    "Ngọ": { quai: "Ly", hanh: "Hỏa", mau: "Đỏ" },
    "Mùi": { quai: "Khôn", hanh: "Kim", mau: "Trắng" },
    "Thân": { quai: "Khôn", hanh: "Kim", mau: "Trắng" },
    "Dậu": { quai: "Đoài", hanh: "Kim", mau: "Trắng" },
    "Tuất": { quai: "Càn", hanh: "Thủy", mau: "Đen" },
    "Hợi": { quai: "Càn", hanh: "Thủy", mau: "Đen" }
  };

  const NGU_HANH_AM_DUONG = {
    "Mộc": { amDuong: ["Dương", "Âm"] }, // Giáp (Dương), Ất (Âm) - simplifies to checking Can index % 2
    // just map index: chẵn là Dương, lẻ là Âm.
  };

  const HanhSinhKhac = {
    sinh: { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" },
    khac: { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" }
  };

  function getAmDuongCan(canStr) {
    const idx = CAN.indexOf(canStr);
    if (idx === -1) return "Dương"; // fallback
    return idx % 2 === 0 ? "Dương" : "Âm";
  }

  // Tiện ích đếm trên 12 cung (0-11)
  function demThuan(cungBatDau, buocDem) {
    return (cungBatDau + buocDem) % 12;
  }
  function demNghich(cungBatDau, buocDem) {
    return (cungBatDau - buocDem % 12 + 12) % 12;
  }

  // --- Logic Tử Vi ---

  // 1. Tính Tiểu hạn
  // Tuổi Dần, Ngọ, Tuất: khởi Thìn (4).
  // Tuổi Thân, Tý, Thìn: khởi Tuất (10).
  // Tuổi Tỵ, Dậu, Sửu: khởi Mùi (7).
  // Tuổi Hợi, Mão, Mùi: khởi Sửu (1).
  function tinhTieuHan(chiNamSinh, namXem, gioiTinh) {
    let khoiCung = 0;
    if (["Dần", "Ngọ", "Tuất"].includes(chiNamSinh)) khoiCung = 4; // Thìn
    else if (["Thân", "Tý", "Thìn"].includes(chiNamSinh)) khoiCung = 10; // Tuất
    else if (["Tỵ", "Dậu", "Sửu"].includes(chiNamSinh)) khoiCung = 7; // Mùi
    else if (["Hợi", "Mão", "Mùi"].includes(chiNamSinh)) khoiCung = 1; // Sửu

    // Nam thuận, Nữ nghịch. Đếm từ tuổi 1 đến tuổi xem.
    // Nếu tuổi xem là 1, thì Tiểu hạn ở đúng cung khởi điểm.
    // Cách đếm: số bước = (namXem - 1). (Giả sử namXem là tuổi âm lịch)
    // Ở đây ta đơn giản hóa: namXem là số tuổi âm lịch của năm đó.
    const buocDem = namXem - 1;
    if (gioiTinh === "Nam") {
      return demThuan(khoiCung, buocDem);
    } else {
      return demNghich(khoiCung, buocDem);
    }
  }

  // 2. Tính Nguyệt hạn
  function tinhNguyetHan(cungTieuHan, thangSinh, gioSinhIdx, thangXem) {
    // Từ cung Tiểu hạn (coi là tháng 1), đếm nghịch đến tháng sinh
    // Tháng sinh: tháng 1 -> bước đếm = 0, tháng n -> bước đếm = n - 1
    const buocNghich = thangSinh - 1;
    const cungDung1 = demNghich(cungTieuHan, buocNghich);

    // Tại cung dừng lại, coi là giờ Tý (0), đếm thuận đến giờ sinh
    // Giờ Tý (0), Sửu (1)...
    const cungDung2 = demThuan(cungDung1, gioSinhIdx);
    
    // Cung dừng lại cuối cùng chính là tháng Giêng (tháng 1).
    const cungThangGieng = cungDung2;

    // Đếm thuận đến tháng xem
    const buocThuan = thangXem - 1;
    return demThuan(cungThangGieng, buocThuan);
  }

  // 3. Tính Nhật hạn
  function tinhNhatHan(cungNguyetHan, ngayXem) {
    // Cung nguyệt hạn là mùng 1. Đếm thuận đến ngày xem.
    const buocThuan = ngayXem - 1;
    return demThuan(cungNguyetHan, buocThuan);
  }

  // --- Logic Ngày Tốt ---
  function kiemTraLucXung(chiNamSinh, chiNgay) {
    if (!chiNamSinh) return { isXung: false, text: "Chưa xác định tuổi", score: 0 };
    const cacCapXung = [
      ["Tý", "Ngọ"], ["Sửu", "Mùi"], ["Dần", "Thân"],
      ["Mão", "Dậu"], ["Thìn", "Tuất"], ["Tỵ", "Hợi"]
    ];
    for (let cap of cacCapXung) {
      if ((cap[0] === chiNamSinh && cap[1] === chiNgay) || (cap[1] === chiNamSinh && cap[0] === chiNgay)) {
        return { isXung: true, text: `Ngày ${chiNgay} xung trực diện với tuổi ${chiNamSinh} (Đại Hung)`, score: -20 };
      }
    }
    return { isXung: false, text: "Không phạm Lục Xung", score: 0 };
  }

  function soSanhCanChiNgay(canNgay, chiNgay) {
    const hanhCan = NGU_HANH_CAN[canNgay];
    const hanhChi = NGU_HANH_CHI[chiNgay];

    if (HanhSinhKhac.sinh[hanhCan] === hanhChi) {
      return { level: 1, text: `Đại Cát: Bảo nhật (Can sinh Chi)`, score: 20 };
    } else if (HanhSinhKhac.sinh[hanhChi] === hanhCan) {
      return { level: 2, text: `Tiểu Cát: Thoa nhật (Chi sinh Can)`, score: 10 };
    } else if (hanhCan === hanhChi) {
      return { level: 3, text: `Bát chuyên: Đồng khí đồng hành`, score: 5 };
    } else if (HanhSinhKhac.khac[hanhChi] === hanhCan) {
      return { level: 4, text: `Tiểu Hung: Chế nhật (Chi khắc Can)`, score: -10 };
    } else if (HanhSinhKhac.khac[hanhCan] === hanhChi) {
      return { level: 5, text: `Đại Hung: Phạt nhật (Can khắc Chi)`, score: -20 };
    }
    return { level: 3, text: "Bình hòa", score: 0 };
  }

  function soSanhCan(canNgay, canNamSinh) {
    const hanhNgay = NGU_HANH_CAN[canNgay];
    const hanhNamSinh = NGU_HANH_CAN[canNamSinh];

    if (HanhSinhKhac.sinh[hanhNgay] === hanhNamSinh) {
      return { level: 1, text: "Mức 1 (Rất Tốt): Can ngày sinh cho Can năm sinh", score: 60 };
    } else if (HanhSinhKhac.sinh[hanhNamSinh] === hanhNgay) {
      return { level: 2, text: "Mức 2 (Khá Tốt): Can năm sinh sinh cho Can ngày", score: 45 };
    } else if (hanhNgay === hanhNamSinh) {
      return { level: 3, text: "Mức 3 (Bình hòa): Can ngày đồng hành với Can năm sinh", score: 30 };
    } else if (HanhSinhKhac.khac[hanhNamSinh] === hanhNgay) {
      return { level: 4, text: "Mức 4 (Xấu Vừa): Can năm sinh khắc Can ngày", score: 15 };
    } else if (HanhSinhKhac.khac[hanhNgay] === hanhNamSinh) {
      return { level: 5, text: "Mức 5 (Rất Xấu): Can ngày khắc Can năm sinh", score: 0 };
    }
    return { level: 3, text: "Không xác định", score: 30 };
  }

  function congTruNguHanh(hanhNgay, hanhMenh, amDuongNgay, amDuongMenh) {
    let point = 0;
    let detail = [];
    if (HanhSinhKhac.sinh[hanhNgay] === hanhMenh) {
      point += 10;
      detail.push("Hành ngày sinh Bản Mệnh (+10đ)");
    }
    if (hanhNgay === hanhMenh && amDuongNgay === amDuongMenh) {
      point += 5; // Cùng âm dương
      detail.push("Hành ngày và Bản Mệnh cùng Âm/Dương (+5đ)");
    }
    return { point, detail };
  }

  function kiemTraNgayXau(ngayAmLich, canNgay, chiNgay) {
    const tamNuong = [3, 7, 13, 18, 22, 27];
    const tamCuong = [8, 18, 28];
    const nguyetKy = [5, 14, 23];
    let isXau = false;
    let errors = [];
    let penalty = 0;

    if (tamNuong.includes(ngayAmLich)) {
      isXau = true;
      errors.push("Phạm ngày Tam Nương (trừ 20 điểm)");
      penalty += 20;
    }
    if (tamCuong.includes(ngayAmLich)) {
      isXau = true;
      errors.push("Phạm ngày Tam Cường (trừ 15 điểm)");
      penalty += 15;
    }
    if (nguyetKy.includes(ngayAmLich)) {
      isXau = true;
      errors.push("Phạm ngày Nguyệt Kỵ (trừ 15 điểm)");
      penalty += 15;
    }
    if (ngayAmLich === 1) {
      isXau = true;
      errors.push("Ngày mùng 1 đầu tháng (Sóc) (trừ 10 điểm)");
      penalty += 10;
    }
    if (canNgay === "Quý" && chiNgay === "Hợi") {
      isXau = true;
      errors.push("Ngày Cùng, Cực - Quý Hợi (trừ 20 điểm)");
      penalty += 20;
    }

    return { isXau, errors, penalty };
  }

  const GIO_TIME = {
    "Tý": "23h-1h", "Sửu": "1h-3h", "Dần": "3h-5h", "Mão": "5h-7h",
    "Thìn": "7h-9h", "Tỵ": "9h-11h", "Ngọ": "11h-13h", "Mùi": "13h-15h",
    "Thân": "15h-17h", "Dậu": "17h-19h", "Tuất": "19h-21h", "Hợi": "21h-23h"
  };

  function formatGio(chiList) {
    return chiList.map(chi => `${chi} (${GIO_TIME[chi]})`);
  }

  function tinhGioHoangDao(chiNgay) {
    // Lục đạo hoàng đạo theo ngày (Thanh Long, Minh Đường, Kim Quỹ, Thiên Đức, Ngọc Đường, Tư Mệnh)
    let hd = [];
    if (["Tý", "Ngọ"].includes(chiNgay)) hd = ["Tý", "Sửu", "Mão", "Ngọ", "Thân", "Dậu"];
    else if (["Sửu", "Mùi"].includes(chiNgay)) hd = ["Dần", "Mão", "Tỵ", "Thân", "Tuất", "Hợi"];
    else if (["Dần", "Thân"].includes(chiNgay)) hd = ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"];
    else if (["Mão", "Dậu"].includes(chiNgay)) hd = ["Dần", "Mão", "Ngọ", "Mùi", "Dậu", "Tý"];
    else if (["Thìn", "Tuất"].includes(chiNgay)) hd = ["Dần", "Thìn", "Tỵ", "Thân", "Dậu", "Hợi"];
    else if (["Tỵ", "Hợi"].includes(chiNgay)) hd = ["Sửu", "Thìn", "Ngọ", "Mùi", "Tuất", "Hợi"];
    return formatGio(hd);
  }

  function tinhGioXau(canNgay, thangAmLich) {
    let khongVong = [];
    let satChu = [];

    if (["Giáp", "Kỷ"].includes(canNgay)) { khongVong = ["Thân", "Dậu"]; satChu = ["Ngọ"]; }
    else if (["Ất", "Canh"].includes(canNgay)) { khongVong = ["Ngọ", "Mùi"]; satChu = ["Thìn"]; }
    else if (["Bính", "Tân"].includes(canNgay)) { khongVong = ["Dần", "Mão"]; satChu = ["Hợi"]; }

    let satChuThang = "";
    if ([1, 7].includes(thangAmLich)) satChuThang = "Tỵ";
    else if ([2, 8].includes(thangAmLich)) satChuThang = "Tý";
    else if ([3, 9].includes(thangAmLich)) satChuThang = "Thân";
    else if ([4, 10].includes(thangAmLich)) satChuThang = "Thìn";
    else if ([5, 11].includes(thangAmLich)) satChuThang = "Dậu";
    else if ([6, 12].includes(thangAmLich)) satChuThang = "Sửu";

    if (satChuThang && !satChu.includes(satChuThang)) {
      satChu.push(satChuThang);
    }

    return { 
      khongVong: formatGio(khongVong), 
      satChu: formatGio(satChu) 
    };
  }

  function tinhMauSac(hanhMenh, canNgay, chiNgay) {
    const COLORS = {
      "Kim": ["Trắng", "Bạc", "Xám"],
      "Mộc": ["Xanh lá", "Xanh lục"],
      "Thủy": ["Đen", "Xanh dương"],
      "Hỏa": ["Đỏ", "Cam", "Tím", "Hồng"],
      "Thổ": ["Vàng", "Nâu đất"]
    };

    const hanhNgay = NGU_HANH_CAN[canNgay];
    const quaiNgay = CHI_TO_QUAI[chiNgay];
    
    let hanhApLuc = [];
    if (HanhSinhKhac.khac[hanhNgay] === hanhMenh) hanhApLuc.push(hanhNgay);
    if (HanhSinhKhac.khac[quaiNgay.hanh] === hanhMenh) hanhApLuc.push(quaiNgay.hanh);

    let tot = new Set();
    let xau = new Set();
    let lyDo = "";

    const hanhSinhMenh = Object.keys(HanhSinhKhac.sinh).find(k => HanhSinhKhac.sinh[k] === hanhMenh);

    if (hanhApLuc.length > 0) {
      COLORS[hanhSinhMenh].forEach(m => tot.add(m));
      COLORS[hanhMenh].forEach(m => tot.add(m));
      
      hanhApLuc.forEach(h => {
         COLORS[h].forEach(m => xau.add(m));
      });
      lyDo = `Ngày có yếu tố hành ${[...new Set(hanhApLuc)].join(', ')} khắc Bản Mệnh ${hanhMenh}. Nên ưu tiên dùng màu ${hanhSinhMenh} để hóa giải (Dụng ${hanhSinhMenh} sinh ${hanhMenh}). Tránh màu thuộc ${[...new Set(hanhApLuc)].join(', ')}.`;
    } else {
      COLORS[hanhMenh].forEach(m => tot.add(m));
      COLORS[hanhSinhMenh].forEach(m => tot.add(m));
      
      const hanhKhacMenh = Object.keys(HanhSinhKhac.khac).find(k => HanhSinhKhac.khac[k] === hanhMenh);
      COLORS[hanhKhacMenh].forEach(m => xau.add(m));
      
      lyDo = `Ngày sinh trợ/tỷ hòa với Bản Mệnh. Ưu tiên dùng màu Bản mệnh (${hanhMenh}) hoặc màu sinh trợ (${hanhSinhMenh}) để tăng cường vượng khí.`;
    }

    lyDo += `<br><span style="font-size: 0.9em; color: var(--text-muted);">* Ghi chú Bát Quái: Chi ${chiNgay} thuộc quái ${quaiNgay.quai} - hành ${quaiNgay.hanh}, màu đặc trưng là ${quaiNgay.mau}.</span>`;

    return {
      tot: Array.from(tot),
      xau: Array.from(xau),
      lyDo: lyDo
    };
  }

  const HEALTH_STARS_DICT = [
    { sao: "Thiên Khôi, Kình Dương", boPhan: "Đầu", canhBao: "Cẩn thận vùng đầu, tránh va đập mạnh khi làm việc hay chơi thể thao.", type: "risk" },
    { sao: "Thái Dương, Hóa Kỵ", boPhan: "Mắt", canhBao: "Thị lực giảm sút, mỏi mắt, dễ bị đau mắt. Hãy hạn chế nhìn màn hình quá lâu.", type: "risk" },
    { sao: "Tuế Phá, Thiên Khốc", boPhan: "Răng", canhBao: "Cảnh báo đau răng, hư răng. Hạn chế đồ ngọt và đồ quá cứng.", type: "risk" },
    { sao: "Phượng Các, Sát Tinh", boPhan: "Tai Mũi Họng", canhBao: "Dễ bị viêm họng, đau mũi, ù tai do thay đổi thời tiết.", type: "risk" },
    { sao: "Thiên Đồng, Tiểu Hao", boPhan: "Tiêu hóa", canhBao: "Hệ tiêu hóa hôm nay rất nhạy cảm. Cẩn thận nguy cơ đau bụng, trúng thực, tránh ăn hàng quán vỉa hè.", type: "risk" },
    { sao: "Bạch Hổ, Sát Tinh", boPhan: "Xương Khớp, Máu Huyết", canhBao: "Dễ bị nhức mỏi xương khớp, áp huyết dao động. Hãy tránh vận động quá sức.", type: "risk" },
    { sao: "Thiên Mã, Tuần Triệt", boPhan: "Chân Tay", canhBao: "Cẩn thận di chuyển, nguy cơ té ngã, thương tích tay chân.", type: "risk" },
    { sao: "Tang Môn, Thiên Khốc", boPhan: "Tinh thần", canhBao: "Trạng thái thể lực hôm nay ở mức [Thấp]. Năng lượng vũ trụ khiến bạn dễ cảm thấy uể oải, suy nhược. Đừng ép bản thân làm việc quá sức.", type: "mental" },
    { sao: "Bệnh Phù", boPhan: "Hệ miễn dịch", canhBao: "Người mỏi mệt, dễ cảm lạnh, sổ mũi, nhức đầu. Nên giữ ấm cơ thể.", type: "mental" },
    { sao: "Thiên Y, Ân Quang", boPhan: "Khám bệnh", canhBao: "Nếu dạo này bạn đang thấy mệt mỏi, hôm nay là ngày tuyệt vời để đi khám bệnh. Báo hiệu bạn sẽ gặp được bác sĩ giỏi, kê đúng thuốc, mau lành bệnh.", type: "heal" }
  ];

  function tinhTrangSucKhoeCucBo(dateObj, canNamSinh) {
    if (!dateObj) return null;
    const seedStr = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}-${canNamSinh}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash = hash & hash;
    }
    hash = Math.abs(hash);
    
    // Pick 1-2 items from HEALTH_STARS_DICT
    const index1 = hash % HEALTH_STARS_DICT.length;
    const item1 = HEALTH_STARS_DICT[index1];
    
    let result = {
      items: [item1],
      mentalLevel: item1.type === 'mental' ? 'Thấp' : (hash % 2 === 0 ? 'Trung bình' : 'Tốt'),
    };
    
    // Add a chance for a second item if it's different
    if (hash % 3 === 0) {
      const index2 = (hash + 5) % HEALTH_STARS_DICT.length;
      if (index1 !== index2) {
        result.items.push(HEALTH_STARS_DICT[index2]);
      }
    }
    
    return result;
  }

  function chamDiemNgayTot(params) {
    // params = { canNamSinh, chiNamSinh, canNgay, chiNgay, hanhMenh, hanhNgay, ngayAmLich, thangAmLich }
    const b1 = soSanhCan(params.canNgay, params.canNamSinh);
    
    // Bước 2: Nhật Hạn cát hung (Mocked for now since real calculation requires full chart generation)
    // Tạm thời cho điểm trung bình: 25/40.
    const b2_score = 25; 
    
    // Yếu tố Can Chi của Ngày (Sự giao thoa)
    const canChiNgayScore = soSanhCanChiNgay(params.canNgay, params.chiNgay);
    
    // Lục Xung Can Chi
    const lucXung = kiemTraLucXung(params.chiNamSinh, params.chiNgay);
    
    const amDuongNgay = getAmDuongCan(params.canNgay);
    const amDuongMenh = "Dương"; // Tạm giả định, có thể nâng cấp thêm

    const b3 = congTruNguHanh(params.hanhNgay, params.hanhMenh, amDuongNgay, amDuongMenh);
    
    const b4 = kiemTraNgayXau(params.ngayAmLich, params.canNgay, params.chiNgay);
    
    const gioXau = tinhGioXau(params.canNgay, params.thangAmLich);
    const gioHoangDao = tinhGioHoangDao(params.chiNgay);

    let total = b1.score + b2_score + b3.point - b4.penalty + canChiNgayScore.score + lucXung.score;
    if (total > 100) total = 100;
    if (total < 0) total = 0;

    let danhGia = "Bình thường";
    if (total >= 80) danhGia = "Rất Tốt";
    else if (total >= 60) danhGia = "Tốt";
    else if (total >= 40) danhGia = "Bình hòa";
    else if (total >= 20) danhGia = "Xấu";
    else danhGia = "Rất Xấu";

    const mauSac = tinhMauSac(params.hanhMenh, params.canNgay, params.chiNgay);
    const sucKhoe = tinhLoiKhuyenSucKhoe(params.hanhMenh, params.hanhNgay, params.thangAmLich);
    
    const troLySucKhoe = tinhTrangSucKhoeCucBo(params.dateObj, params.canNamSinh);

    return {
      total,
      danhGia,
      b1,
      b2_score,
      canChiNgayScore,
      lucXung,
      b3,
      b4,
      gioXau,
      gioHoangDao,
      mauSac,
      sucKhoe,
      troLySucKhoe
    };
  }

  // Cầu nối dùng lunar-javascript (lunar.js)
  function tinhDiemNgayDuongLich(dateObj, userCan, userMenh, userChi) {
    if (typeof Lunar === 'undefined') {
      console.warn("Thư viện lunar-javascript chưa được tải!");
      return null;
    }
    const lunar = Lunar.fromDate(dateObj);
    const ngayAmLich = lunar.getDay();
    const thangAmLich = lunar.getMonth();
    
    const canNgayIdx = lunar.getDayGanIndex(); // 0-9 tương ứng Giáp - Quý
    const canNgay = CAN[canNgayIdx];
    
    const chiNgayIdx = lunar.getDayZhiIndex(); // 0-11 tương ứng Tý - Hợi
    const chiNgay = CHI[chiNgayIdx];
    
    const hanhNgay = NGU_HANH_CAN[canNgay];

    return chamDiemNgayTot({
      canNamSinh: userCan,
      chiNamSinh: userChi,
      hanhMenh: userMenh,
      ngayAmLich: ngayAmLich,
      thangAmLich: Math.abs(thangAmLich), // có thể có tháng nhuận bị âm
      canNgay: canNgay,
      chiNgay: chiNgay,
      hanhNgay: hanhNgay,
      dateObj: dateObj
    });
  }

  // --- Logic Mới (Phong thủy & Bát Quái) ---
  
  function tinhMenhTuCanChi(can, chi) {
    const canValue = {
      "Giáp": 1, "Ất": 1, "Bính": 2, "Đinh": 2, "Mậu": 3, "Kỷ": 3, "Canh": 4, "Tân": 4, "Nhâm": 5, "Quý": 5
    }[can] || 1;
    
    let chiValue = 0;
    if (["Tý", "Sửu", "Ngọ", "Mùi"].includes(chi)) chiValue = 0;
    else if (["Dần", "Mão", "Thân", "Dậu"].includes(chi)) chiValue = 1;
    else if (["Thìn", "Tỵ", "Tuất", "Hợi"].includes(chi)) chiValue = 2;
    
    let sum = canValue + chiValue;
    if (sum > 5) sum -= 5;
    
    const MENH_MAP = { 1: "Kim", 2: "Thủy", 3: "Hỏa", 4: "Thổ", 5: "Mộc" };
    return MENH_MAP[sum];
  }

  function tinhLoiKhuyenSucKhoe(hanhMenh, hanhNgay, thangAmLich) {
    let mua = "";
    let hanhMua = "";
    if ([1, 2, 3].includes(thangAmLich)) { mua = "Mùa Xuân"; hanhMua = "Mộc"; }
    else if ([4, 5, 6].includes(thangAmLich)) { mua = "Mùa Hạ"; hanhMua = "Hỏa"; }
    else if ([7, 8, 9].includes(thangAmLich)) { mua = "Mùa Thu"; hanhMua = "Kim"; }
    else { mua = "Mùa Đông"; hanhMua = "Thủy"; }

    let khuyenNghi = [];
    
    if (HanhSinhKhac.khac[hanhMua] === hanhMenh) {
      khuyenNghi.push(`Đang là ${mua} (${hanhMua} vượng) khắc Bản Mệnh (${hanhMenh}). Cơ thể dễ suy nhược, cần nghỉ ngơi, bồi bổ năng lượng.`);
    }

    if (hanhMenh === "Kim" && hanhNgay === "Hỏa") {
      khuyenNghi.push("Hôm nay Hỏa khí mạnh, dễ gây áp lực cho hệ hô hấp (Phế). Nên uống trà thảo mộc, bổ sung thức ăn có vị ngọt (Thổ) để dưỡng Phế, giữ tâm thái bình hòa.");
    } else if (hanhMenh === "Kim" && hanhMua === "Hỏa") {
      khuyenNghi.push("Trong Mùa Hạ (Hỏa), cần chú ý bồi bổ tỳ vị (vị ngọt) để sinh Phế (Kim), tránh đồ ăn quá đắng (Hỏa) tổn hao tâm khí.");
    } else {
      if (HanhSinhKhac.khac[hanhNgay] === hanhMenh) {
        let sinhMenh = Object.keys(HanhSinhKhac.sinh).find(k => HanhSinhKhac.sinh[k] === hanhMenh);
        khuyenNghi.push(`Hôm nay hành ${hanhNgay} khắc Bản Mệnh ${hanhMenh}. Nên dùng các thực phẩm thuộc hành ${sinhMenh} để điều hòa cơ thể.`);
      } else if (HanhSinhKhac.sinh[hanhNgay] === hanhMenh) {
        khuyenNghi.push(`Ngày có hành ${hanhNgay} sinh trợ Bản Mệnh. Thể trạng tốt, năng lượng tràn trề để làm việc lớn.`);
      } else {
        khuyenNghi.push(`Ngày bình hòa, không có yếu tố tương khắc mạnh về sức khỏe.`);
      }
    }

    return { mua, hanhMua, khuyenNghi };
  }

  function tinhHuongTot(hanhMenh) {
    const DIRECTIONS = {
      "Kim": ["Tây", "Tây Bắc", "Trung tâm", "Đông Bắc", "Tây Nam"],
      "Mộc": ["Đông", "Đông Nam", "Bắc"],
      "Thủy": ["Bắc", "Tây", "Tây Bắc"],
      "Hỏa": ["Nam", "Đông", "Đông Nam"],
      "Thổ": ["Trung tâm", "Tây Nam", "Đông Bắc", "Nam"]
    };
    const BAD_DIRECTIONS = {
      "Kim": ["Nam", "Đông", "Đông Nam"],
      "Mộc": ["Tây", "Tây Bắc", "Trung tâm"],
      "Thủy": ["Trung tâm", "Tây Nam", "Đông Bắc", "Nam"],
      "Hỏa": ["Bắc", "Tây", "Tây Bắc"],
      "Thổ": ["Đông", "Đông Nam", "Bắc"]
    };
    return {
      tot: DIRECTIONS[hanhMenh] || [],
      xau: BAD_DIRECTIONS[hanhMenh] || []
    };
  }

  function tuongHopNhanSu(menhBan, menhDoiTac) {
    if (HanhSinhKhac.sinh[menhDoiTac] === menhBan) {
      return { level: "Rất Tốt", type: "Sinh trợ", desc: `Đối tác mệnh ${menhDoiTac} sẽ che chở, bồi đắp và mang lại cơ hội cho bạn.` };
    }
    if (menhBan === menhDoiTac) {
      return { level: "Khá", type: "Bình hòa", desc: `Cùng mệnh ${menhBan}, hai bên có sự thấu hiểu, đồng minh vững chắc để thực thi.` };
    }
    if (HanhSinhKhac.sinh[menhBan] === menhDoiTac) {
      return { level: "Trung bình", type: "Sinh xuất", desc: `Bạn sẽ mất nhiều năng lượng để hỗ trợ người mệnh ${menhDoiTac}.` };
    }
    if (HanhSinhKhac.khac[menhBan] === menhDoiTac) {
      return { level: "Kém", type: "Khắc xuất", desc: `Bạn áp chế được họ, nhưng dễ sinh mâu thuẫn. Cần cư xử khéo léo.` };
    }
    if (HanhSinhKhac.khac[menhDoiTac] === menhBan) {
      let trungGian = Object.keys(HanhSinhKhac.sinh).find(k => HanhSinhKhac.sinh[k] === menhBan);
      return { level: "Rất Xấu", type: "Bị Khắc", desc: `Họ khắc chế bạn. Tránh cãi vã, nên để họ dẫn dắt hoặc tìm người mệnh ${trungGian} làm trung gian.` };
    }
    return { level: "Không xác định", type: "", desc: "" };
  }

  // --- THUẬT TOÁN TRẠCH NHẬT CÁ NHÂN HÓA ĐA TẦNG (4 LAYERS) ---

  // Tầng 1: Lọc Nền Thiên Văn & Lịch Cổ Điển
  function calculateLayer1_Global(lunarDay, lunarMonth, canNgay, chiNgay) {
    let score = 50; // Base score
    let highlights = [];
    let isHardStop = false;

    // Ngày xấu cơ bản
    const tamNuong = [3, 7, 13, 18, 22, 27];
    const nguyetKy = [5, 14, 23];
    
    if (tamNuong.includes(lunarDay)) {
      score -= 30;
      highlights.push("Ngày Tam Nương (Xấu)");
      isHardStop = true;
    }
    if (nguyetKy.includes(lunarDay)) {
      score -= 30;
      highlights.push("Ngày Nguyệt Kỵ (Xấu)");
      isHardStop = true;
    }
    if (canNgay === "Quý" && chiNgay === "Hợi") {
      score -= 20;
      highlights.push("Ngày Cùng Cực Quý Hợi");
    }

    // Tạm giả lập điểm Trực trung bình nếu không get được (hoặc giả sử getZhiXing)
    score += 10; 

    return { score: Math.max(0, Math.min(100, score)), highlights, isHardStop };
  }

  // Tầng 2: Tương Khắc Can Chi Bát Tự Cá Nhân
  function calculateLayer2_CanChi(canNgay, chiNgay, hanhNgay, userProfile) {
    let score = 50;
    let highlights = [];
    
    const { canNam, chiNam, hanhMenh } = userProfile;

    // Can
    const canHop = { "Giáp": "Kỷ", "Kỷ": "Giáp", "Ất": "Canh", "Canh": "Ất", "Bính": "Tân", "Tân": "Bính", "Đinh": "Nhâm", "Nhâm": "Đinh", "Mậu": "Quý", "Quý": "Mậu" };
    const canPha = { "Giáp": "Mậu", "Mậu": "Nhâm", "Nhâm": "Bính", "Bính": "Canh", "Canh": "Giáp", "Ất": "Kỷ", "Kỷ": "Quý", "Quý": "Đinh", "Đinh": "Tân", "Tân": "Ất" }; 

    if (canHop[canNgay] === canNam) {
      score += 15;
      highlights.push(`Thiên Can tương hợp (${canNgay} hợp ${canNam})`);
    } else if (canPha[canNgay] === canNam || canPha[canNam] === canNgay) {
      score -= 15;
      highlights.push(`Thiên Can tương phá (${canNgay} - ${canNam})`);
    }

    // Chi
    const tamHop = [ ["Dần", "Ngọ", "Tuất"], ["Thân", "Tý", "Thìn"], ["Tỵ", "Dậu", "Sửu"], ["Hợi", "Mão", "Mùi"] ];
    const nhiHop = { "Tý": "Sửu", "Sửu": "Tý", "Dần": "Hợi", "Hợi": "Dần", "Mão": "Tuất", "Tuất": "Mão", "Thìn": "Dậu", "Dậu": "Thìn", "Tỵ": "Thân", "Thân": "Tỵ", "Ngọ": "Mùi", "Mùi": "Ngọ" };
    const lucXung = { "Tý": "Ngọ", "Ngọ": "Tý", "Sửu": "Mùi", "Mùi": "Sửu", "Dần": "Thân", "Thân": "Dần", "Mão": "Dậu", "Dậu": "Mão", "Thìn": "Tuất", "Tuất": "Thìn", "Tỵ": "Hợi", "Hợi": "Tỵ" };

    let isTamHop = tamHop.some(group => group.includes(chiNgay) && group.includes(chiNam));
    if (isTamHop || nhiHop[chiNgay] === chiNam) {
      score += 20;
      highlights.push(`Địa Chi hòa hợp (${chiNgay} - ${chiNam})`);
    } else if (lucXung[chiNgay] === chiNam) {
      score -= 30;
      highlights.push(`Lục Xung Tuổi (${chiNgay} xung ${chiNam})`);
    }

    // Mệnh
    if (HanhSinhKhac.sinh[hanhNgay] === hanhMenh) {
      score += 10;
      highlights.push(`Ngũ hành Ngày sinh Mệnh (+10)`);
    } else if (HanhSinhKhac.khac[hanhNgay] === hanhMenh) {
      score -= 15;
      highlights.push(`Ngũ hành Ngày khắc Mệnh (-15)`);
    }

    return { score: Math.max(0, Math.min(100, score)), highlights };
  }

  // Tầng 3: Ma Trận Lưu Sao Tử Vi Cá Nhân
  function calculateLayer3_ZiWei(canNgay, chiNgay, userChart) {
    let score = 50;
    let highlights = [];

    const LOC_TON = { "Giáp": "Dần", "Ất": "Mão", "Bính": "Tỵ", "Mậu": "Tỵ", "Đinh": "Ngọ", "Kỷ": "Ngọ", "Canh": "Thân", "Tân": "Dậu", "Nhâm": "Hợi", "Quý": "Tý" };
    const HOA_KY = { "Giáp": "Thái Dương", "Ất": "Thái Âm", "Bính": "Liêm Trinh", "Đinh": "Cự Môn", "Mậu": "Thiên Cơ", "Kỷ": "Văn Khúc", "Canh": "Thiên Đồng", "Tân": "Văn Xương", "Nhâm": "Vũ Khúc", "Quý": "Tham Lang" };
    const HOA_LOC = { "Giáp": "Liêm Trinh", "Ất": "Thiên Cơ", "Bính": "Thiên Đồng", "Đinh": "Thái Âm", "Mậu": "Tham Lang", "Kỷ": "Vũ Khúc", "Canh": "Thái Dương", "Tân": "Cự Môn", "Nhâm": "Thiên Lương", "Quý": "Phá Quân" };
    const THIEN_MA = { "Dần": "Thân", "Ngọ": "Thân", "Tuất": "Thân", "Thân": "Dần", "Tý": "Dần", "Thìn": "Dần", "Tỵ": "Hợi", "Dậu": "Hợi", "Sửu": "Hợi", "Hợi": "Tỵ", "Mão": "Tỵ", "Mùi": "Tỵ" };

    let luuLocTonCung = LOC_TON[canNgay];
    let luuThienMaCung = THIEN_MA[chiNgay];
    const CUNG_IDX = { "Tý": 0, "Sửu": 1, "Dần": 2, "Mão": 3, "Thìn": 4, "Tỵ": 5, "Ngọ": 6, "Mùi": 7, "Thân": 8, "Dậu": 9, "Tuất": 10, "Hợi": 11 };
    
    let lT_idx = CUNG_IDX[luuLocTonCung];
    let tM_idx = luuThienMaCung ? CUNG_IDX[luuThienMaCung] : -1;
    
    if (lT_idx === userChart.menh_cung_idx || lT_idx === userChart.tai_bach_idx || lT_idx === userChart.quan_loc_idx) {
      score += 25;
      highlights.push(`Lưu Lộc Tồn chiếu Tam hợp Mệnh/Tài/Quan`);
    }
    if (tM_idx === userChart.thien_di_idx) {
      score += 15;
      highlights.push(`Lưu Thiên Mã chiếu cung Thiên Di (Tốt đi xa)`);
    }
    if (HOA_KY[canNgay] === "Thiên Đồng" || HOA_KY[canNgay] === "Thái Âm") {
      score -= 25;
      highlights.push(`Lưu Hóa Kị giáng Mệnh (${HOA_KY[canNgay]} Hóa Kị)`);
    }
    if (HOA_LOC[canNgay] === "Thiên Đồng" || HOA_LOC[canNgay] === "Thái Âm") {
      score += 25;
      highlights.push(`Lưu Hóa Lộc giáng Mệnh (${HOA_LOC[canNgay]} Hóa Lộc)`);
    }

    return { score: Math.max(0, Math.min(100, score)), highlights };
  }

  // Tầng 4: Trọng số theo mục đích
  function calculateLayer4_Task(taskType, layerData) {
    let score = 50;
    let highlights = [];
    const allHighlights = [...layerData.layer1.highlights, ...layerData.layer2.highlights, ...layerData.layer3.highlights].join(" | ");

    if (taskType === "CONTRACT_SIGNING") {
      if (allHighlights.includes("Lộc Tồn") || allHighlights.includes("Hóa Lộc")) {
        score += 20;
        highlights.push("Tuyệt vời cho Ký hợp đồng (Có Lộc tinh)");
      }
      if (allHighlights.includes("Hóa Kị") || allHighlights.includes("Xung")) {
        score -= 20;
        highlights.push("Kỵ Ký hợp đồng (Có Hung/Xung tinh)");
      }
    } else if (taskType === "TRAVEL") {
      if (allHighlights.includes("Thiên Mã")) {
        score += 20;
        highlights.push("Tuyệt vời để Xuất hành (Có Thiên Mã)");
      }
    } else if (taskType === "MARRIAGE") {
      if (allHighlights.includes("hòa hợp")) {
        score += 15;
        highlights.push("Thuận lợi cho Gia đạo (Hòa hợp Can Chi)");
      }
      if (allHighlights.includes("Nguyệt Kỵ") || allHighlights.includes("Tam Nương")) {
        score -= 25;
        highlights.push("Đại kỵ Cưới hỏi (Ngày xấu)");
      }
    } else if (taskType === "HEALTH") {
       if (allHighlights.includes("Hóa Kị")) {
         score -= 20;
         highlights.push("Bất lợi cho Chữa bệnh (Hóa Kị chiếu)");
       }
    } else {
      score = 70; // GENERAL default
    }

    return { score: Math.max(0, Math.min(100, score)), highlights };
  }

  // Hàm Tổng Trạch Nhật Cá Nhân Hóa Đa Tầng
  function evaluatePersonalizedDay(dateObj, userProfile, taskType = "GENERAL") {
    if (typeof Lunar === 'undefined') return null;
    const lunar = Lunar.fromDate(dateObj);
    
    const lunarDay = lunar.getDay();
    const lunarMonth = Math.abs(lunar.getMonth());
    const canNgayIdx = lunar.getDayGanIndex();
    const canNgay = CAN[canNgayIdx];
    const chiNgayIdx = lunar.getDayZhiIndex();
    const chiNgay = CHI[chiNgayIdx];
    const hanhNgay = NGU_HANH_CAN[canNgay];

    const l1 = calculateLayer1_Global(lunarDay, lunarMonth, canNgay, chiNgay);
    const l2 = calculateLayer2_CanChi(canNgay, chiNgay, hanhNgay, userProfile);
    const l3 = calculateLayer3_ZiWei(canNgay, chiNgay, userProfile.tu_vi_chart);
    
    const layerData = { layer1: l1, layer2: l2, layer3: l3 };
    const l4 = calculateLayer4_Task(taskType, layerData);

    const W1 = 0.20, W2 = 0.30, W3 = 0.35, W4 = 0.15;
    let P_HardStop = l1.isHardStop || layerData.layer2.highlights.some(h => h.includes("Lục Xung Tuổi")) ? 50 : 0;
    
    let S = (W1 * l1.score) + (W2 * l2.score) + (W3 * l3.score) + (W4 * l4.score) - P_HardStop;
    S = Math.round(Math.max(0, Math.min(100, S)));

    let rating = "ĐẠI HUNG";
    if (S >= 85) rating = "ĐẠI CÁT";
    else if (S >= 70) rating = "TIỂU CÁT";
    else if (S >= 50) rating = "BÌNH HÒA";
    else if (S >= 30) rating = "THẬN TRỌNG";

    let dSolarStr = dateObj.toISOString().split('T')[0];
    let dLunarStr = `${lunar.getYear()}-${lunarMonth}-${lunarDay}`;

    return {
      date_solar: dSolarStr,
      date_lunar: dLunarStr,
      can_chi_date: `${canNgay} ${chiNgay}`,
      total_score: S,
      rating: rating,
      breakdown: {
        layer1_global_score: l1.score,
        layer2_can_chi_score: l2.score,
        layer3_tu_vi_score: l3.score,
        layer4_task_score: l4.score
      },
      hard_stop_flags: P_HardStop > 0 ? ["Phạm ngày Đại Hung hoặc Xung Tuổi"] : [],
      key_highlights: [
        ...l1.highlights,
        ...l2.highlights,
        ...l3.highlights,
        ...l4.highlights
      ],
      best_hours: tinhGioHoangDao(chiNgay)
    };
  }

  return {
    CUNG,
    CAN,
    CHI,
    NGU_HANH_CAN,
    tinhTieuHan,
    tinhNguyetHan,
    tinhNhatHan,
    chamDiemNgayTot,
    tinhDiemNgayDuongLich,
    tinhMenhTuCanChi,
    tinhLoiKhuyenSucKhoe,
    tinhHuongTot,
    tuongHopNhanSu,
    evaluatePersonalizedDay
  };
})();

const dateObj = new Date(); const userProfile = { canNam: 'Canh', chiNam: 'Thìn', hanhMenh: 'Kim', tu_vi_chart: { menh_cung_idx: 0, tai_bach_idx: 8, quan_loc_idx: 4, tat_ach_idx: 7, thien_di_idx: 6 } }; console.log(window.AstrologyLogic.evaluatePersonalizedDay(dateObj, userProfile, 'GENERAL'));