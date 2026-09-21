// ==============================================================================
// CONFIGURATION & CONSTANTS - MEDWARD PRO
// ==============================================================================

const CONFIG = {
  APP_NAME: 'MedWard Pro',
  APP_SUBTITLE: 'Quản Lý Bệnh Nhân Nội Trú & Bàn Giao Trực Lâm Sàng',
  VERSION: '2.0.0',

  // STORAGE KEYS
  STORAGE_KEYS: {
    PATIENT_DATA: 'medward_patients_v2',
    META_DATA: 'medward_meta_v2',
    SETTINGS: 'medward_settings_v2',
    AUTH_USER: 'medward_local_user_v2',
    SUPABASE_CONFIG: 'medward_supabase_config_v2',
    HANDOVER_LOGS: 'medward_handover_logs_v2'
  },

  // CẤU HÌNH SUPABASE CLOUD CỐ ĐỊNH (PERMANENT REALTIME SYNC)
  DEFAULT_SUPABASE: {
    URL: 'https://iqkrdzeymxdrqdvfjnyt.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxa3JkemV5bXhkcnFkdmZqbnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5OTU3MjgsImV4cCI6MjEwNTU3MTcyOH0.POFtPFoT3fUN7ZeDHOFbBPvo19gSzEQvmij5G9o8eos'
  },

  // DEFAULT HOSPITAL META
  DEFAULT_META: {
    unit: 'SỞ Y TẾ TP. HỒ CHÍ MINH',
    hospital: 'BỆNH VIỆN ĐA KHOA KHU VỰC THỦ ĐỨC',
    department: 'KHOA NHIỄM',
    title: 'BẢNG THEO DÕI & Y LỆNH BỆNH NHÂN NỘI TRÚ',
    subTitle: '(Giao ban - Đi buồng - Theo dõi SOAP lâm sàng & Bàn giao trực)'
  },

  // DEFAULT LOCAL DEMO ACCOUNT (Khi chưa cấu hình Supabase Cloud)
  DEFAULT_DEMO_DOCTOR: {
    id: 'local_doctor_demo',
    email: 'bacsi@thuduchospital.vn',
    full_name: 'BS. CKI Nguyễn Văn An',
    title: 'Bác sĩ điều trị',
    department: 'Khoa Nhiễm',
    hospital: 'BV ĐKKV Thủ Đức',
    phone: '0912.345.678'
  },

  // HANDOVER STATUS TYPES
  HANDOVER_STATUS: {
    NONE: 'none',          // Bình thường, ổn định
    PENDING: 'pending',    // Vấn đề chưa giải quyết / Cần bàn giao
    CRITICAL: 'critical',  // Báo động đỏ / Bệnh nặng theo dõi sát
    RESOLVED: 'resolved'   // Đã xử trí xong trong ca trực
  },

  // STATUS LABELS & STYLES
  STATUS_CONFIG: {
    none: {
      label: 'Ổn định',
      badgeClass: 'badge-stable',
      icon: '🟢'
    },
    pending: {
      label: 'Cần bàn giao',
      badgeClass: 'badge-pending',
      icon: '⏳'
    },
    critical: {
      label: 'Báo động đỏ (Nặng)',
      badgeClass: 'badge-critical',
      icon: '🚨'
    },
    resolved: {
      label: 'Đã xử trí',
      badgeClass: 'badge-resolved',
      icon: '✅'
    }
  },

  // BỘ TỪ ĐIỂN QUY CHUẨN VIẾT TẮT LÂM SÀNG THEO CHUYÊN MỤC
  ABBREVIATIONS_CATEGORIES: {
    'Chẩn đoán thường gặp': [
      { abbr: 'sxh', full: 'SXH Dengue', desc: 'Sốt xuất huyết Dengue' },
      { abbr: 'sxhd', full: 'SXH Dengue', desc: 'Sốt xuất huyết Dengue' },
      { abbr: 'vp', full: 'Viêm phổi', desc: 'Viêm phổi' },
      { abbr: 'vpcd', full: 'Viêm phổi cộng đồng', desc: 'Viêm phổi mắc phải cộng đồng' },
      { abbr: 'dtd', full: 'ĐTĐ type 2', desc: 'Đái tháo đường type 2' },
      { abbr: 'dtđ', full: 'ĐTĐ type 2', desc: 'Đái tháo đường type 2' },
      { abbr: 'tha', full: 'Tăng huyết áp', desc: 'Tăng huyết áp' },
      { abbr: 'nkh', full: 'Nhiễm khuẩn huyết', desc: 'Nhiễm trùng huyết' },
      { abbr: 'ntth', full: 'Nhiễm trùng tiêu hóa', desc: 'Nhiễm trùng tiêu hóa' },
      { abbr: 'ntt', full: 'Nhiễm trùng tiểu', desc: 'Nhiễm trùng tiết niệu' },
      { abbr: 'copd', full: 'COPD đợt cấp', desc: 'Bệnh phổi tắc nghẽn mạn tính' },
      { abbr: 'hen', full: 'Hen phế quản', desc: 'Hen phế quản' },
      { abbr: 'vtc', full: 'Viêm tụy cấp', desc: 'Viêm tụy cấp' },
      { abbr: 'vtq', full: 'Viêm tụy cấp', desc: 'Viêm tụy cấp' },
      { abbr: 'vgc', full: 'Viêm gan cấp', desc: 'Viêm gan cấp' },
      { abbr: 'vgb', full: 'Viêm gan B mạn', desc: 'Viêm gan siêu vi B mạn' },
      { abbr: 'vgvc', full: 'Viêm gan C mạn', desc: 'Viêm gan siêu vi C mạn' },
      { abbr: 'st', full: 'Suy tim mạn', desc: 'Suy tim mạn tính' },
      { abbr: 'stm', full: 'Suy tim mạn', desc: 'Suy tim mạn tính' },
      { abbr: 'stc', full: 'Suy thận cấp', desc: 'Tổn thương thận cấp' },
      { abbr: 'tbmm', full: 'Tai biến mạch máu não', desc: 'Đột quỵ não / TBMM' },
      { abbr: 'tbmn', full: 'Tai biến mạch máu não', desc: 'Đột quỵ não / TBMN' },
      { abbr: 'xhth', full: 'Xuất huyết tiêu hóa', desc: 'Xuất huyết tiêu hóa' },
      { abbr: 'xhtq', full: 'Xuất huyết tiêu hóa trên', desc: 'Xuất huyết tiêu hóa trên' },
      { abbr: 'sv', full: 'Sốt siêu vi', desc: 'Sốt siêu vi' },
      { abbr: 'ssv', full: 'Sốt siêu vi', desc: 'Sốt siêu vi' },
      { abbr: 'nmct', full: 'Nhồi máu cơ tim', desc: 'Nhồi máu cơ tim cấp' },
      { abbr: 'tmcb', full: 'Thiếu máu cơ tim', desc: 'Bệnh tim thiếu máu cục bộ' },
      { abbr: 'rllp', full: 'Rối loạn lipid máu', desc: 'Rối loạn chuyển hóa lipid' },
      { abbr: 'gout', full: 'Gout cấp', desc: 'Cơn gout cấp' }
    ],
    'Cận lâm sàng & Xét nghiệm': [
      { abbr: 'ctm', full: 'CTM', desc: 'Tổng phân tích tế bào máu ngoại vi' },
      { abbr: 'shm', full: 'Sinh hóa máu', desc: 'Sinh hóa máu toàn phần' },
      { abbr: 'dgd', full: 'Điện giải đồ', desc: 'Điện giải đồ (Na, K, Cl)' },
      { abbr: 'đgđ', full: 'Điện giải đồ', desc: 'Điện giải đồ (Na, K, Cl)' },
      { abbr: 'xq', full: 'X-Quang tim phổi', desc: 'Chụp X-quang tim phổi thẳng' },
      { abbr: 'ct', full: 'CT-Scanner', desc: 'Chụp cắt lớp vi tính' },
      { abbr: 'mri', full: 'MRI', desc: 'Chụp cộng hưởng từ' },
      { abbr: 'sa', full: 'Siêu âm', desc: 'Siêu âm chẩn đoán' },
      { abbr: 'saob', full: 'Siêu âm ổ bụng', desc: 'Siêu âm ổ bụng tổng quát' },
      { abbr: 'sat', full: 'Siêu âm tim', desc: 'Siêu âm tim Doppler' },
      { abbr: 'satt', full: 'Siêu âm tim', desc: 'Siêu âm tim Doppler' },
      { abbr: 'cm', full: 'Cấy máu', desc: 'Cấy máu tìm vi khuẩn' },
      { abbr: 'cdam', full: 'Cấy đàm', desc: 'Cấy đàm làm kháng sinh đồ' },
      { abbr: 'cđam', full: 'Cấy đàm', desc: 'Cấy đàm làm kháng sinh đồ' },
      { abbr: 'cntt', full: 'Cấy nước tiểu', desc: 'Cấy nước tiểu định danh' },
      { abbr: 'ecg', full: 'Điện tâm đồ', desc: 'Điện tâm đồ 12 chuyển đạo' },
      { abbr: 'đtđ', full: 'Điện tâm đồ', desc: 'Điện tâm đồ (ECG)' },
      { abbr: 'tc', full: 'Tiểu cầu', desc: 'Số lượng tiểu cầu' },
      { abbr: 'bc', full: 'Bạch cầu', desc: 'Số lượng bạch cầu' },
      { abbr: 'hct', full: 'Hct', desc: 'Dung tích hồng cầu Hematocrit' },
      { abbr: 'hb', full: 'Hemoglobin', desc: 'Huyết sắc tố' },
      { abbr: 'dhmm', full: 'Đường huyết mao mạch', desc: 'Đường huyết mao mạch test nhanh' },
      { abbr: 'tptnt', full: 'Tổng phân tích nước tiểu', desc: 'Tổng phân tích nước tiểu 10 thông số' },
      { abbr: 'kmdm', full: 'Khí máu động mạch', desc: 'Khí máu động mạch' },
      { abbr: 'dnt', full: 'Dịch não tủy', desc: 'Xét nghiệm dịch não tủy' },
      { abbr: 'ast/alt', full: 'Men gan AST/ALT', desc: 'Men gan AST (GOT) & ALT (GPT)' },
      { abbr: 'ure/cre', full: 'Ure & Creatinine', desc: 'Chức năng thận Ure & Creatinine' },
      { abbr: 'crp', full: 'CRP định lượng', desc: 'Protein phản ứng C' },
      { abbr: 'pct', full: 'Procalcitonin', desc: 'Định lượng Procalcitonin' }
    ],
    'Y lệnh & Điều trị': [
      { abbr: 'ttm', full: 'TTM', desc: 'Truyền tĩnh mạch' },
      { abbr: 'iv', full: 'IV', desc: 'Tiêm tĩnh mạch' },
      { abbr: 'im', full: 'IM', desc: 'Tiêm bắp' },
      { abbr: 'sc', full: 'SC', desc: 'Tiêm dưới da' },
      { abbr: 'ks', full: 'Kháng sinh', desc: 'Kháng sinh điều trị' },
      { abbr: 'kd', full: 'Khí dung', desc: 'Thở khí dung' },
      { abbr: 'para', full: 'Paracetamol 500mg', desc: 'Hạ sốt, giảm đau' },
      { abbr: 'dhst', full: 'Dấu hiệu sinh tồn', desc: 'Theo dõi sinh tồn (M, HA, T°, SpO2)' },
      { abbr: 'sh', full: 'Sinh hiệu', desc: 'Sinh hiệu theo dõi' },
      { abbr: 'ha', full: 'Huyết áp', desc: 'Huyết áp động mạch' },
      { abbr: 'spo2', full: 'SpO2', desc: 'Độ bão hòa oxy máu mao mạch' },
      { abbr: 'rl', full: 'Ringer Lactate 500ml', desc: 'Dịch truyền Ringer Lactate' },
      { abbr: 'nacl', full: 'Natri Clorid 0.9% 500ml', desc: 'Dịch truyền Natri Clorid 0.9%' },
      { abbr: 'g5', full: 'Glucose 5% 500ml', desc: 'Dịch truyền Glucose 5%' },
      { abbr: 'ceftri', full: 'Ceftriaxone 2g IV', desc: 'Kháng sinh Ceftriaxone' },
      { abbr: 'cipro', full: 'Ciprofloxacin 400mg TTM', desc: 'Kháng sinh Ciprofloxacin' },
      { abbr: 'oresol', full: 'Bù Oresol uống rải rác', desc: 'Bù nước & điện giải bằng đường uống' },
      { abbr: 'td_sh', full: 'Theo dõi sinh hiệu mỗi 4h', desc: 'Theo dõi mạch, nhiệt độ, HA' },
      { abbr: 'td_spo2', full: 'Đo SpO2 & Mạch mỗi 2h', desc: 'Theo dõi độ bão hòa oxy' },
      { abbr: 'an_chao', full: 'Ăn cháo loãng nguội', desc: 'Chế độ ăn người bệnh tiêu hóa' },
      { abbr: 'an_nhat', full: 'Ăn nhạt giảm muối', desc: 'Chế độ ăn tim mạch, thận' },
      { abbr: 'nghi', full: 'Nghỉ ngơi tại giường', desc: 'Hạn chế vận động gắng sức' }
    ]
  },

  // DICTIONARY TỰ ĐỘNG TẠO TỪ DANH MỤC
  ABBREVIATIONS: {},

  // MEDICAL QUICK TAGS CHO MOBILE & MODAL (Bấm 1 chạm để điền nhanh)
  QUICK_TAGS: {
    DIAGNOSIS: [
      'SXH Dengue ngày 4',
      'Viêm phổi cộng đồng',
      'Nhiễm trùng tiêu hóa',
      'ĐTĐ type 2',
      'Tăng huyết áp',
      'Nhiễm khuẩn huyết',
      'COPD đợt cấp',
      'Sốt siêu vi'
    ],
    LABS: [
      'CTM: BC, TC, Hct',
      'Sinh hóa: Men gan, Ure, Creatinine',
      'Điện giải đồ (Na, K, Cl)',
      'X-Quang tim phổi thẳng',
      'Siêu âm ổ bụng tổng quát',
      'Chờ kết quả cấy máu',
      'CT-Scanner ngực'
    ],
    ORDERS: [
      'Ringer Lactate 500ml TTM',
      'Natri Clorid 0.9% 500ml TTM',
      'Paracetamol 500mg (khi sốt >= 38.5°C)',
      'Ceftriaxone 2g IV/ngày',
      'Khí dung Salbutamol 5mg x 2 lần',
      'Theo dõi sinh hiệu mỗi 4h',
      'Đo SpO2 & Mạch mỗi 2h',
      'Bù dịch Oresol uống rải rác'
    ],
    ISSUES: [
      'Chưa có KQ cấy máu',
      'Sốt cao 39.5°C chưa hạ',
      'HA dao động',
      'Chờ hội chẩn Ngoại',
      'Chưa chụp xong CT scan',
      'SpO2 giảm khi thở khí phòng',
      'Tiểu cầu giảm thấp',
      'Chờ KQ Men gan & ĐGĐ'
    ],
    ACTIONS: [
      'Đo SpO2 & Mạch mỗi 2h',
      'Theo dõi sinh hiệu mỗi 4h',
      'Lấy lại ĐGĐ lúc 22h',
      'Hạ sốt nếu T° >= 38.5°C',
      'Báo BS trực nếu HA < 90/60',
      'Bù dịch Ringer Lactate 500ml',
      'Kiểm tra tri giác trước ngủ',
      'Tiếp tục kháng sinh cữ tối'
    ]
  },

  // HÀM TỰ ĐỘNG MỞ RỘNG TỪ VIẾT TẮT Y KHOA THÔNG MINH (SINGLE-PASS & IDEMPOTENT)
  expandMedicalText(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Khởi tạo map tra cứu nhanh
    const lookup = CONFIG.ABBREVIATIONS;
    if (!lookup || Object.keys(lookup).length === 0) return text;

    return text.replace(/([a-zA-Z0-9_À-ỹ]+(?:[\/\-_][a-zA-Z0-9_À-ỹ]+)*)/gu, (match, p1, offset, fullStr) => {
      const lower = match.toLowerCase();
      const replacement = lookup[lower];
      if (!replacement) return match;

      // Nếu từ gốc và từ thay thế tương đồng (ví dụ: 'ttm' -> 'TTM')
      if (replacement.toLowerCase() === lower) {
        return replacement;
      }

      // Kiểm tra vùng ngữ cảnh xung quanh xem từ này đã nằm trong cụm từ mở rộng hay chưa (Tránh lặp vô hạn)
      const startWindow = Math.max(0, offset - replacement.length);
      const endWindow = Math.min(fullStr.length, offset + match.length + replacement.length);
      const windowText = fullStr.slice(startWindow, endWindow).toLowerCase();

      if (windowText.includes(replacement.toLowerCase())) {
        return match; // Đã nằm trong cụm đã mở rộng
      }

      return replacement;
    });
  },

  // DEFAULT SAMPLE DATA BAN ĐẦU
  SAMPLE_PATIENTS: [
    {
      id: 'demo_patient_1',
      phong_giuong: 'D1.12 - G01',
      ten: 'NGUYỄN HÀ TRỊNH THỊNH',
      nam_sinh_tuoi: '2003 (23)',
      chan_doan: 'SXH Dengue ngày 4 có dấu hiệu cảnh báo',
      cls: 'Tiểu cầu 65k, Hct 44%, AST/ALT 85/92 U/L',
      y_lenh: 'Ringer Lactate 500ml x 2 chai TTM 80 giọt/phút. Paracetamol 500mg uống khi sốt >= 38.5°C.',
      handover_status: 'critical',
      handover_issues: 'Tiểu cầu có xu hướng tụt nhanh, sốt cao liên tục ngày 4, đau bụng vùng gan.',
      handover_actions: 'Theo dõi sinh hiệu + Hct mỗi 4h. Nếu Hct > 46% hoặc đau bụng tăng báo ngay BS trực.',
      handover_by: 'BS. CKI Nguyễn Văn An',
      handover_at: '2026-09-21T17:00:00Z'
    },
    {
      id: 'demo_patient_2',
      phong_giuong: 'D1.12 - G02',
      ten: 'TRẦN VĂN HOÀNG',
      nam_sinh_tuoi: '1988 (38)',
      chan_doan: 'Viêm phổi cộng đồng mức độ trung bình',
      cls: 'X-Quang ngực: thâm nhiễm đáy phổi (P), BC 14.5k',
      y_lenh: 'Ceftriaxone 2g IV/ngày, Khí dung Salbutamol 5mg x 2 lần.',
      handover_status: 'pending',
      handover_issues: 'Còn sốt nhẹ 38°C, đang chờ kết quả cấy đàm kháng sinh đồ trả về.',
      handover_actions: 'Kiểm tra SpO2 lúc 22h (duy trì > 95%), nếu khó thở cho thở Oxy kính 2-3 L/p.',
      handover_by: 'BS. CKI Nguyễn Văn An',
      handover_at: '2026-09-21T17:00:00Z'
    },
    {
      id: 'demo_patient_3',
      phong_giuong: 'D1.14 - G01',
      ten: 'LÊ THỊ MAI',
      nam_sinh_tuoi: '1965 (61)',
      chan_doan: 'Nhiễm trùng tiêu hóa / ĐTĐ type 2',
      cls: 'Đường huyết mao mạch 8.2 mmol/L, Ion đồ ổn định',
      y_lenh: 'Ciprofloxacin 400mg TTM cữ tối, Oresol uống rải rác.',
      handover_status: 'none',
      handover_issues: '',
      handover_actions: '',
      handover_by: '',
      handover_at: null
    }
  ]
};

// Tự động map từ điển viết tắt từ danh mục
if (CONFIG.ABBREVIATIONS_CATEGORIES) {
  for (const list of Object.values(CONFIG.ABBREVIATIONS_CATEGORIES)) {
    for (const item of list) {
      CONFIG.ABBREVIATIONS[item.abbr.toLowerCase()] = item.full;
    }
  }
}

window.CONFIG = CONFIG;

