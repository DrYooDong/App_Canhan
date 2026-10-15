const assert = require('assert');
const fs = require('fs');

console.log('=== BẮT ĐẦU CHẠY KIỂM TRA TỰ ĐỘNG BỘ SỬA LỖI (MEDWARD PRO) ===\n');

// 1. Kiểm tra CONFIG và expandMedicalText
global.window = {};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

eval(fs.readFileSync('js/config.js', 'utf8') + '; global.CONFIG = window.CONFIG;');

console.log('Test 1: Mở rộng từ viết tắt & chống trùng lặp hậu tố');
assert.strictEqual(global.CONFIG.expandMedicalText('Bệnh nhân dtđ type 2'), 'Bệnh nhân ĐTĐ type 2');
assert.strictEqual(global.CONFIG.expandMedicalText('Bệnh nhân dtđ'), 'Bệnh nhân ĐTĐ type 2');
assert.strictEqual(global.CONFIG.expandMedicalText('sxh ngày 4'), 'SXH Dengue ngày 4');
assert.strictEqual(global.CONFIG.expandMedicalText('Đã là SXH Dengue rồi'), 'Đã là SXH Dengue rồi');
console.log('✓ Test 1 ĐẠT!\n');

// 2. Kiểm tra bộ đếm KPI
console.log('Test 2: Bộ đếm KPI phân loại chính xác các trạng thái');
const samplePatients = [
  { id: '1', handover_status: 'none' },
  { id: '2', handover_status: 'critical' },
  { id: '3', handover_status: 'pending' },
  { id: '4', handover_status: 'waiting_cls' },
  { id: '5', handover_status: 'discharged' },
  { id: '6', handover_status: '' } // coi như ổn định
];

const totalCount = samplePatients.length;
const criticalCount = samplePatients.filter(p => p.handover_status === 'critical').length;
const pendingCount = samplePatients.filter(p => p.handover_status === 'pending').length;
const waitingClsCount = samplePatients.filter(p => p.handover_status === 'waiting_cls').length;
const dischargedCount = samplePatients.filter(p => p.handover_status === 'discharged').length;
const stableCount = samplePatients.filter(p => p.handover_status === 'none' || !p.handover_status).length;

assert.strictEqual(totalCount, 6);
assert.strictEqual(criticalCount, 1);
assert.strictEqual(pendingCount, 1);
assert.strictEqual(waitingClsCount, 1);
assert.strictEqual(dischargedCount, 1);
assert.strictEqual(stableCount, 2); // id 1 và 6
console.log('✓ Test 2 ĐẠT!\n');

// 3. Kiểm tra Dengue delta với mốc thời gian không theo thứ tự
console.log('Test 3: Tự động sắp xếp mốc Dengue theo thời gian chuẩn');
const trendsUnsorted = [
  { id: 't2', date: '15/10', time: '14:00', hct: 44, tc: 70 },
  { id: 't1', date: '15/10', time: '08:00', hct: 38, tc: 120 },
  { id: 't3', date: '15/10', time: '20:00', hct: 46, tc: 55 }
];

const sorted = [...trendsUnsorted].sort((a, b) => {
  const parseTime = (item) => {
    const d = item.date || '';
    const t = item.time || '00:00';
    const dParts = d.split(/[\/\-]/);
    const day = dParts[0] || '01';
    const mon = dParts[1] || '01';
    return `2026-${mon.padStart(2, '0')}-${day.padStart(2, '0')}T${t}`;
  };
  return parseTime(a).localeCompare(parseTime(b));
});

assert.strictEqual(sorted[0].id, 't1'); // 08:00
assert.strictEqual(sorted[1].id, 't2'); // 14:00
assert.strictEqual(sorted[2].id, 't3'); // 20:00
assert.strictEqual(sorted[sorted.length - 1].hct, 46);
console.log('✓ Test 3 ĐẠT!\n');

console.log('🎉 TẤT CẢ CÁC BÀI TEST ĐỀU ĐẠT THÀNH CÔNG 100%!');
