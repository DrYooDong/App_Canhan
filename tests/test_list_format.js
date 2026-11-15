import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const code = fs.readFileSync(path.join(__dirname, '../js/patient_service.js'), 'utf8');

function extractMethod(name, signatureRegex) {
  const startMatch = code.match(signatureRegex);
  assert(startMatch, `Không tìm thấy method ${name} trong js/patient_service.js`);
  const braceStart = code.indexOf('{', startMatch.index);
  let depth = 0;
  let i = braceStart;
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return code.slice(braceStart + 1, i);
}

const helpers = {
  escape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  sanitizeClinicalHtml(s) {
    return String(s);
  }
};

helpers.toggleListFormat = new Function('text', 'mode = "number"', extractMethod('toggleListFormat', /toggleListFormat\(text,\s*mode\s*=\s*'number'\)\s*\{/));
helpers.toggleNumbering = new Function('text', extractMethod('toggleNumbering', /toggleNumbering\(text\)\s*\{/));
helpers.toggleBullets = new Function('text', extractMethod('toggleBullets', /toggleBullets\(text\)\s*\{/));
helpers.formatListPrefixes = new Function('html', 'includeNumbers = true', extractMethod('formatListPrefixes', /formatListPrefixes\(html,\s*includeNumbers\s*=\s*true\)\s*\{/));
helpers.formatClinicalDisplay = new Function('text', extractMethod('formatClinicalDisplay', /formatClinicalDisplay\(text\)\s*\{/));
helpers.formatClsDisplay = new Function('text', extractMethod('formatClsDisplay', /formatClsDisplay\(text\)\s*\{/));

console.log('🧪 Bắt đầu kiểm thử tính năng Đánh số & Gạch đầu dòng...');

// 1. Bật/tắt gạch đầu dòng trên văn bản trống và nhiều dòng
assert.strictEqual(helpers.toggleBullets(''), '- ');
assert.strictEqual(helpers.toggleBullets('   '), '- ');
assert.strictEqual(helpers.toggleBullets('Sốt cao\nHo đàm'), '- Sốt cao\n- Ho đàm');
assert.strictEqual(helpers.toggleBullets('- Sốt cao\n- Ho đàm'), 'Sốt cao\nHo đàm');
assert.strictEqual(helpers.toggleBullets('- '), '');
console.log('  ✅ 1. Bật/tắt gạch đầu dòng (- ...): PASS');

// 2. Chuyển đổi qua lại giữa đánh số (1. 2.) và gạch đầu dòng (- )
assert.strictEqual(helpers.toggleBullets('1. Sốt cao\n2. Ho đàm'), '- Sốt cao\n- Ho đàm');
assert.strictEqual(helpers.toggleNumbering('- Sốt cao\n- Ho đàm'), '1. Sốt cao\n2. Ho đàm');
console.log('  ✅ 2. Chuyển đổi qua lại giữa đánh số & gạch đầu dòng: PASS');

// 3. Không làm hỏng số âm hoặc thẻ HTML in đậm toàn dòng
assert.strictEqual(helpers.toggleBullets('-5°C'), '- -5°C');
assert.strictEqual(helpers.toggleBullets('<b>Sốt cao</b>\nHo đàm'), '- <b>Sốt cao</b>\n- Ho đàm');
assert.strictEqual(helpers.formatClinicalDisplay('<b>- Sốt</b>'), '<b>- Sốt</b>');
assert.strictEqual(helpers.formatClinicalDisplay('-5°C'), '-5°C');
console.log('  ✅ 3. Bảo toàn số âm và thẻ HTML: PASS');

// 4. Định dạng hiển thị tiền tố in đậm cho số thứ tự & gạch đầu dòng
const renderedClinical = helpers.formatClinicalDisplay('- Sốt cao\n- Ho đàm');
assert(renderedClinical.includes('<b class="med-bullet-prefix" style="font-weight: 700;">- </b>Sốt cao'));
assert(renderedClinical.includes('\n<b class="med-bullet-prefix" style="font-weight: 700;">- </b>Ho đàm'));

const renderedCls = helpers.formatClsDisplay('- BC: 6.2\n- TC: 120');
assert(renderedCls.includes('<b class="med-bullet-prefix" style="font-weight: 700;">- </b>BC: 6.2'));
console.log('  ✅ 4. Định dạng hiển thị tiền tố gạch đầu dòng (Clinical & CLS): PASS');

console.log('\n🎉 Toàn bộ bài test Đánh số & Gạch đầu dòng đều PASS!');
