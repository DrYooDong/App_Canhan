---
name: astrology-engine-reference
description: Sổ tay tra cứu nhanh API và các hàm cốt lõi trong AstrologyLogic (TuViEngine, calculateDailyTransit, getDailyRemedy, evaluateWealthDay, calculateRetroAccuracy) để AI gọi hàm chính xác 100%, không bị sai tham số hoặc dính lỗi falsy hour 0.
---

# ASTROLOGY LOGIC ENGINE API REFERENCE

Dùng sổ tay này để gọi đúng tên hàm và đúng chữ ký tham số (signature) trong `window.AstrologyLogic`.

## 1. Lấy Hồ Sơ Cá Nhân (Single Source of Truth)
```javascript
const AL = window.AstrologyLogic;
const userProfile = AL.getUserProfile();
// Trả về: { name, gender, day, month, year, hour, minute, locationName, lat, lng, tz, hanhMenh, canNam, chiNam }
// LƯU Ý CRITICAL: hour có thể bằng 0 (Giờ Tý 0h00). Không dùng (userProfile.hour || 12) vì 0 là falsy! Luôn dùng (userProfile.hour ?? 12).
```

## 2. Lá Số Tử Vi Chi Tiết (TuViEngine)
```javascript
const tuViChart = AL.TuViEngine.calculateTuViChart({
  day: userProfile.day || 1,
  month: userProfile.month || 1,
  year: userProfile.year || 1990,
  hour: (userProfile.hour ?? 12),
  minute: (userProfile.minute ?? 0),
  gender: userProfile.gender || 'Nam',
  canNam: userProfile.canNam || 'Canh',
  chiNam: userProfile.chiNam || 'Thìn'
});
// Trả về: { thienBan, palaces: [ { id, name, chi, mainStars, minorStars, subStarsList, isMenh, ... } ] }
```

## 3. Lưu Phi Tinh & Tứ Hóa Ngày (Daily Transit Engine)
```javascript
const dateStr = new Date(); // hoặc ISO string
const transitData = AL.calculateDailyTransit(dateStr, userProfile);
// Trả về: { baseChart, canNgay, chiNgay, hanhNgay, tuHoa: { loc, quyen, khoa, ky }, luuNhatChi, luuNhatPalace, locPalace, kyPalace, quyenPalace }
```

## 4. Chiến Thuật Cải Mệnh Hôm Nay (Daily Remedy)
```javascript
const remedy = AL.getDailyRemedy(transitData, userProfile);
// Trả về: { isBadDay (boolean), alertMsg (string), actionMode ('TĨNH...'/'ĐỘNG...'), wardrobe (màu áo), direction (hướng xuất hành), dungThan }
```

## 5. Đánh Giá Điểm Tài Lộc Hàng Ngày (Finance Engine)
```javascript
const wealthEval = AL.evaluateWealthDay(dateObj, userProfile);
// Trả về: { score (0-100), rating ('Đại Cát'/'Tiểu Cát'/'Cẩn Trọng'/'Cảnh Báo Đỏ'), message }
```

## 6. Đo Lường Độ Tương Quan AI Phản Tư (RetroVerify Engine)
```javascript
const retroResult = AL.calculateRetroAccuracy(logsArray);
// Trả về: { accuracyPct (0-100), correlationLevel ('Rất Cao'/'Khá'/'Trung Bình'/'Thấp'), insight }
```
