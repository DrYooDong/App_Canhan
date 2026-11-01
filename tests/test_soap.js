import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc mã nguồn trực tiếp từ js/patient_service.js
const patientServiceCode = fs.readFileSync(path.join(__dirname, '../js/patient_service.js'), 'utf8');

// Trích xuất method parseSoapText
const methodMatch = patientServiceCode.match(/parseSoapText\(text\)\s*\{([\s\S]*?)\n\s*\}\s*\n\s*applySmartSoapPaste\(\)/);
if (!methodMatch) {
  throw new Error('Không tìm thấy method parseSoapText trong js/patient_service.js');
}

const methodBody = methodMatch[1];
const parseSoapText = new Function('text', methodBody);

console.log('🧪 Bắt đầu kiểm thử tính năng Dán SOAP (Smart SOAP Paste)...');

// 1. Kiểm tra mẫu thực tế từ người dùng
const userSample = `(S)
Giảm sốt
Giảm đau đầu, giảm mệt
Giảm buồn nôn
Không đau ngực - bụng
Tiêu tiểu bình thường
Ăn uống được

(O)
Bệnh nhân tỉnh, tiếp xúc tốt
Da niêm hồng, chi ấm, mạch rõ, CRT < 2s
Sinh hiệu: 
+ M: 80 lần/phút; 
+ HA: 120/70 mmHg
+ NT: 18 lần/phút; 
+ T: 37 độ C
SpO2: 98%/KT
Tim T1, T2 đều rõ
Phổi trong, âm phế bào rõ
Bụng mềm, ấn không điểm đau, gan lách không sờ chạm
Họng sạch
Cổ mềm, không dấu thần kinh định vị

CLS từ PK Đa Khoa Sài Gòn
- NS1AG: Dương tính
- PLT: 81 k/uL
- HCT: 46%

(A)
- Sốt xuất huyết Dengue N6
- GERD - Rối loạn tiền đình
(P)
- Điều trị hỗ trợ
- Làm CLS`;

const res1 = parseSoapText(userSample);

assert(res1.trieu_chung.includes('Giảm sốt') && res1.trieu_chung.includes('Ăn uống được'), 'Triệu chứng (S) phải chứa đầy đủ các triệu chứng cơ năng');
assert(!res1.trieu_chung.includes('SpO2'), 'Triệu chứng (S) tuyệt đối không bị lẫn SpO2 của (O)');

assert(res1.kham_lam_sang.includes('Bệnh nhân tỉnh, tiếp xúc tốt'), 'Khám lâm sàng (O) phải bắt đầu bằng Bệnh nhân tỉnh');
assert(res1.kham_lam_sang.includes('Sinh hiệu:'), 'Khám lâm sàng (O) không được bị cắt ngắn bởi Sinh hiệu');
assert(res1.kham_lam_sang.includes('Cổ mềm, không dấu thần kinh định vị'), 'Khám lâm sàng (O) phải bao gồm toàn bộ phần khám thực thể');

assert(res1.cls_hien_co.includes('CLS từ PK Đa Khoa Sài Gòn'), 'CLS hiện có phải chứa thông tin nguồn gốc');
assert(res1.cls_hien_co.includes('NS1AG: Dương tính') && res1.cls_hien_co.includes('HCT: 46%'), 'CLS hiện có phải có kết quả xét nghiệm');

assert(res1.chan_doan.includes('- Sốt xuất huyết Dengue N6') && res1.chan_doan.includes('GERD - Rối loạn tiền đình'), 'Chẩn đoán (A) phải nguyên vẹn không mất chữ cái đầu');

assert(res1.y_lenh.includes('- Điều trị hỗ trợ'), 'Y lệnh (P) phải có Điều trị hỗ trợ');
assert(res1.cls_can_lam.includes('- Làm CLS'), 'CLS cần làm phải chứa chỉ định Làm CLS');

console.log('  ✅ 1. Kiểm thử mẫu người dùng cung cấp: PASS');

// 2. Kiểm thử mẫu xuất từ generateDailySoapText
const medwardSample = `(S)
Tỉnh táo, không sốt, ăn uống được
(O)
Bệnh nhân tỉnh, tiếp xúc tốt
Da niêm hồng, chi ấm, mạch rõ
Tim đều, phổi trong, bụng mềm
CLS:
- BC: 6.2
- TC: 120
(A)
Sốt xuất huyết Dengue ngày 4
(P)
Paracetamol 500mg 1v khi sốt
[Thêm thuốc]: Oresol 1 gói pha 1 lít nước
Chỉ định cận lâm sàng:
CTM lúc 16h`;

const res2 = parseSoapText(medwardSample);
assert.strictEqual(res2.trieu_chung, 'Tỉnh táo, không sốt, ăn uống được');
assert(res2.kham_lam_sang.includes('Tim đều, phổi trong, bụng mềm'));
assert(res2.cls_hien_co.includes('- BC: 6.2'));
assert.strictEqual(res2.chan_doan, 'Sốt xuất huyết Dengue ngày 4');
assert.strictEqual(res2.y_lenh, 'Paracetamol 500mg 1v khi sốt');
assert.strictEqual(res2.them_thuoc, 'Oresol 1 gói pha 1 lít nước');
assert.strictEqual(res2.cls_can_lam, 'CTM lúc 16h');
console.log('  ✅ 2. Kiểm thử khứ hồi chuẩn MedWard SOAP: PASS');

// 3. Kiểm thử nhãn tiếng Việt
const viSample = `Triệu chứng: Đau bụng từng cơn
Khám lâm sàng: Bụng chướng nhẹ, ấn đau thượng vị
Cận lâm sàng: Siêu âm bụng có dịch quanh gan
Chẩn đoán: Viêm túi mật cấp
Hướng xử trí: Chuyển Ngoại phẫu thuật cấp cứu`;

const res3 = parseSoapText(viSample);
assert.strictEqual(res3.trieu_chung, 'Đau bụng từng cơn');
assert.strictEqual(res3.kham_lam_sang, 'Bụng chướng nhẹ, ấn đau thượng vị');
assert.strictEqual(res3.cls_hien_co, 'Siêu âm bụng có dịch quanh gan');
assert.strictEqual(res3.chan_doan, 'Viêm túi mật cấp');
assert.strictEqual(res3.y_lenh, 'Chuyển Ngoại phẫu thuật cấp cứu');
console.log('  ✅ 3. Kiểm thử nhãn tiếng Việt lâm sàng: PASS');

console.log('\n🎉 Toàn bộ các bài test Dán SOAP đều vượt qua thành công 100%!');
