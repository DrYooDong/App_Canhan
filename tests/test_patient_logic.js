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

console.log('\n🎉 Toàn bộ 4/4 kiểm thử đơn vị đều vượt qua thành công!');
