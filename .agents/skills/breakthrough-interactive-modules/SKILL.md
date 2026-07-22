---
name: breakthrough-interactive-modules
description: Quy chuẩn phát triển các module tương tác đột phá (Web Audio API Solfeggio Synthesizer, Canvas 2D Animated Breathing, 1-Tap Mood Logger, RPG Character Sheet, TTS Voice Reader, Local-first Storage).
---

# Breakthrough Interactive Modules Skill Guide

Skill này quy định quy chuẩn kỹ thuật cho việc xây dựng và bảo trì các tính năng trải nghiệm người dùng đột phá (Interactive & Ambient Features) trong ứng dụng NỘI TÂM.

---

## 1. Web Audio API & Solfeggio Synthesizer

- **Nguyên tắc**: Sử dụng `AudioContext` để tạo pure sine wave frequencies (396Hz, 432Hz, 528Hz, 639Hz, 741Hz) trực tiếp, không phụ thuộc file mp3 bên ngoài.
- **An toàn âm thanh**:
  - Khi ngắt hoặc chuyển tab (lắng nghe sự kiện `hashchange`), luôn gọi `stopAudio()` ngắt `OscillatorNode` và giải phóng bộ nhớ.
  - Luôn kiểm tra `audioCtx.state === 'suspended'` và gọi `audioCtx.resume()` trước khi phát.

---

## 2. Canvas 2D Micro-Animations (Nhịp Thở 4-7-8 & RPG Skill Tree)

- **Loop Animation**: Sử dụng `requestAnimationFrame` và lưu lại handle ID (`animId`) để `cancelAnimationFrame(animId)` khi dừng.
- **Retina Display High-DPI**: Tính toán tỷ lệ `window.devicePixelRatio` khi khởi tạo kích thước Canvas để đảm bảo đồ thị luôn nét mịn trên mọi màn hình.

---

## 3. Web Speech Synthesis (TTS Morning Brief)

- Kiểm tra tính sẵn có: `'speechSynthesis' in window`.
- Cấu hình giọng đọc tiếng Việt:
  ```javascript
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 0.95; // Nhịp đọc ôn hòa
  window.speechSynthesis.speak(utterance);
  ```

---

## 4. Local-First Persistence & Storage Standards

- Tất cả dữ liệu check-in (Cảm xúc, Thu chi, Retro-verification, RPG Stats) lưu tại `localStorage` với tiền tố tập trung:
  - `noitam_finance_txs`
  - `noitam_mood_logs`
  - `noitam_retro_logs`
  - `phuc_duc_points`
- Bọc tất cả lệnh `getItem` / `setItem` trong khối `try-catch` để chống sập ứng dụng khi localStorage bị hạn chế.
