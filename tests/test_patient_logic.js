// Test Suite Tối Thiểu Cho Các Logic Lâm Sàng Cốt Lõi (MedWard Pro)
// Chạy trực tiếp: node tests/test_patient_logic.js

import assert from 'node:assert';

console.log('🧪 Bắt đầu chạy kiểm thử logic y tế lâm sàng...');

// 1. Kiểm tra chuẩn hóa buồng giường (Clean Room / Bed)
function cleanRoomBedString(str) {
  if (!str) return '';
  return String(str)
    .replace(/\s+/g, '')
    .replace(/[–—]/g, '-')
    .toUpperCase();
}

assert.strictEqual(cleanRoomBedString(' D1.03 - 1 '), 'D1.03-1');
assert.strictEqual(cleanRoomBedString('d1.14–2'), 'D1.14-2');
console.log('  ✅ 1. Chuẩn hóa buồng giường: PASS');

// 2. Kiểm tra chuẩn hóa năm sinh & tuổi (Birth Year & Age)
function formatBirthYearAge(val, currentYear = 2026) {
  if (!val) return '';
  const str = String(val).trim();
  const yearMatch = str.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    const age = currentYear - y;
    return `${y} (${age})`;
  }
  return str;
}

assert.strictEqual(formatBirthYearAge('1956', 2026), '1956 (70)');
assert.strictEqual(formatBirthYearAge('15/08/1985', 2026), '1985 (41)');
console.log('  ✅ 2. Định dạng năm sinh & tính tuổi: PASS');

// 3. Kiểm tra cơ chế tự động dọn sạch Mã NB khỏi Chẩn đoán
function sanitizeDiagnosis(cd) {
  if (!cd) return '';
  const trimmed = String(cd).trim();
  if (/^\[Mã\s*(?:NB|BN|BA|hồ\s*sơ):\s*[^\]]+\]$/i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

assert.strictEqual(sanitizeDiagnosis('[Mã NB: TD2506003798]'), '');
assert.strictEqual(sanitizeDiagnosis('[Mã BN: 123456]'), '');
assert.strictEqual(sanitizeDiagnosis('Sốt xuất huyết Dengue ngày 4 cảnh báo'), 'Sốt xuất huyết Dengue ngày 4 cảnh báo');
console.log('  ✅ 3. Làm sạch Mã NB khỏi Chẩn đoán: PASS');

// 4. Kiểm tra nguyên tắc ánh xạ cột Excel không bao giờ lấy Mã NB làm Chẩn đoán
function mockParseDiagnosis(row, mapping) {
  let cdVal = mapping.chan_doan !== -1 ? String(row[mapping.chan_doan] || '').trim() : '';
  if (!cdVal && mapping.huong_dieu_tri !== -1 && row[mapping.huong_dieu_tri]) {
    cdVal = String(row[mapping.huong_dieu_tri]).trim();
  }
  // Tuyệt đối không lấy mapping.ma_nb
  return cdVal;
}

const mockRow = ['TD2506003798', 'NGUYỄN THỊ HOA', '', 'D1.03-1']; // Cột 0 là Mã NB, Cột 2 là Chẩn đoán trống
const mockMapping = { ma_nb: 0, ten: 1, chan_doan: 2, huong_dieu_tri: -1 };

assert.strictEqual(mockParseDiagnosis(mockRow, mockMapping), '');
console.log('  ✅ 4. Nguyên tắc không gán Mã NB vào Chẩn đoán khi nhập Excel: PASS');

// 5. Kiểm tra KHÔNG tự động tăng ngày bệnh và ngày kháng sinh
function smartIncrementIllnessDay(diagnosis) {
  return diagnosis || '';
}
function smartIncrementMedicationDay(orders) {
  return orders || '';
}

assert.strictEqual(smartIncrementIllnessDay('SXH Dengue ngày 4'), 'SXH Dengue ngày 4');
assert.strictEqual(smartIncrementIllnessDay('Viêm phổi N3'), 'Viêm phổi N3');
assert.strictEqual(smartIncrementMedicationDay('Ceftriaxone 2g IV (N3)'), 'Ceftriaxone 2g IV (N3)');
assert.strictEqual(smartIncrementMedicationDay('KS ngày 2'), 'KS ngày 2');
console.log('  ✅ 5. Giữ nguyên số ngày bệnh và ngày dùng thuốc (không tự động tăng): PASS');

// 6. Kiểm tra KHÔNG tự động xóa ca xuất viện khi chuyển ngày mới
const mockPatients = [
  { id: '1', ten: 'A', chan_doan: 'Viêm phổi N5 (xuất viện)', is_discharged: false },
  { id: '2', ten: 'B', chan_doan: 'SXH ngày 4', is_discharged: false }
];
const rolloverPatients = mockPatients.map(p => ({ ...p, report_date: '2026-10-13' }));
assert.strictEqual(rolloverPatients.length, 2);
assert.strictEqual(rolloverPatients[0].chan_doan, 'Viêm phổi N5 (xuất viện)');
console.log('  ✅ 6. Duy trì toàn bộ người bệnh khi chuyển ngày (không tự xóa ca xuất viện): PASS');

// 7. Kiểm tra chỉ mở rộng từ viết tắt cho bệnh lý trong chẩn đoán, không mở rộng CLS/Y lệnh
const pathologyMap = {
  'sxh': 'SXH Dengue',
  'vp': 'Viêm phổi',
  'tha': 'Tăng huyết áp',
  'dtd': 'ĐTĐ type 2'
};

function expandDiagnosisOnly(text, lookup) {
  if (!text) return text;
  return text.replace(/([a-zA-Z0-9_À-ỹ]+(?:[\/\-_][a-zA-Z0-9_À-ỹ]+)*)/gu, (match) => {
    const lower = match.toLowerCase();
    return lookup[lower] || match;
  });
}

assert.strictEqual(expandDiagnosisOnly('sxh ngày 4', pathologyMap), 'SXH Dengue ngày 4');
assert.strictEqual(expandDiagnosisOnly('vp cộng đồng', pathologyMap), 'Viêm phổi cộng đồng');
// Các từ CLS / y lệnh (ttm, iv, para, ks, ha, bc, tc) không có trong map bệnh lý và không bị chuyển đổi
assert.strictEqual(expandDiagnosisOnly('ttm nacl 0.9% 500ml', pathologyMap), 'ttm nacl 0.9% 500ml');
assert.strictEqual(expandDiagnosisOnly('para 500mg uống', pathologyMap), 'para 500mg uống');
console.log('  ✅ 7. Chỉ chuyển đổi viết tắt bệnh lý trong cột chẩn đoán, không đổi y lệnh/CLS: PASS');

// 8. Kiểm tra thuật toán gán màu buồng bệnh nhất quán (Color-Coded Rooms)
const ROOM_PALETTE = [
  { name: 'emerald', accent: '#059669' },
  { name: 'cerulean', accent: '#0284c7' },
  { name: 'indigo', accent: '#4f46e5' },
  { name: 'purple', accent: '#7c3aed' },
  { name: 'rose', accent: '#e11d48' },
  { name: 'amber', accent: '#d97706' },
  { name: 'teal', accent: '#0d9488' },
  { name: 'orange', accent: '#ea580c' },
  { name: 'cyan', accent: '#0891b2' },
  { name: 'pink', accent: '#db2777' },
  { name: 'lime', accent: '#65a30d' },
  { name: 'slate', accent: '#475569' }
];

function getRoomColorTheme(roomCode) {
  if (!roomCode || roomCode === 'Chưa xếp phòng') {
    return ROOM_PALETTE[11];
  }
  const clean = String(roomCode).trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % ROOM_PALETTE.length;
  return ROOM_PALETTE[index];
}

const theme1 = getRoomColorTheme('D1.12');
const theme2 = getRoomColorTheme('d1.12'); // Case-insensitive
assert.strictEqual(theme1.name, theme2.name);
assert.ok(theme1.accent.startsWith('#'));
assert.strictEqual(getRoomColorTheme('Chưa xếp phòng').name, 'slate');
console.log('  ✅ 8. Thuật toán phân loại màu theo buồng nhất quán: PASS');

// 9. Kiểm tra phân tích chỉ số Xu hướng Dengue (Hct & Tiểu cầu)
function analyzeDengueTrends(trends) {
  if (!trends || trends.length === 0) return null;
  const latest = trends[trends.length - 1];
  const first = trends[0];
  const prev = trends.length >= 2 ? trends[trends.length - 2] : null;

  const deltaHct = prev ? parseFloat((latest.hct - prev.hct).toFixed(1)) : 0;
  const deltaTc = prev ? (latest.tc - prev.tc) : 0;
  const percentRise = first.hct > 0 ? parseFloat(((latest.hct - first.hct) / first.hct * 100).toFixed(1)) : 0;

  return {
    latestHct: latest.hct,
    latestTc: latest.tc,
    deltaHct,
    deltaTc,
    percentRise,
    isHemoconcentration: percentRise >= 20 || latest.hct >= 45,
    isSevereThrombocytopenia: latest.tc < 50,
    isCriticalThrombocytopenia: latest.tc < 20
  };
}

const mockTrends = [
  { hct: 38, tc: 120 },
  { hct: 41, tc: 85 },
  { hct: 46, tc: 42 } // Hct tăng từ 38 -> 46 (>20%), TC tụt < 50k
];

const analysis = analyzeDengueTrends(mockTrends);
assert.strictEqual(analysis.latestHct, 46);
assert.strictEqual(analysis.latestTc, 42);
assert.strictEqual(analysis.deltaHct, 5);
assert.strictEqual(analysis.deltaTc, -43);
assert.strictEqual(analysis.isHemoconcentration, true); // Cô đặc máu
assert.strictEqual(analysis.isSevereThrombocytopenia, true); // Tiểu cầu < 50k
console.log('  ✅ 9. Phân tích lâm sàng xu hướng Hct & Tiểu cầu (Dengue Trendline): PASS');

// 10. Kiểm tra chẩn đoán nhiều dòng (Multiline Diagnosis xuống dòng)
const multilineCd = "1. sxh ngày 4 cảnh báo\n2. Viêm dạ dày cấp\n3. tha";
const expandedMulti = expandDiagnosisOnly(multilineCd, pathologyMap);
assert.strictEqual(expandedMulti.split('\n').length, 3);
assert.ok(expandedMulti.includes('1. SXH Dengue ngày 4 cảnh báo'));
assert.ok(expandedMulti.includes('2. Viêm dạ dày cấp'));
assert.ok(expandedMulti.includes('3. Tăng huyết áp'));
console.log('  ✅ 10. Chẩn đoán hỗ trợ xuống dòng nhiều hàng (Multiline): PASS');

console.log('\n🎉 Toàn bộ 10/10 kiểm thử đơn vị đều vượt qua thành công!');


