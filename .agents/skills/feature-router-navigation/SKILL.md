---
name: feature-router-navigation
description: Quy chuẩn liên kết điều hướng Router (App.Router.navigate) từ Master Calendar Hub tới các module chuyên sâu (Tử Vi, Kỳ Môn, Kinh Dịch, Nhật Ký Phản Tư).
---

# Feature Router Navigation Skill Guide

Skill này quy định phương pháp kết nối liên thông ứng dụng giữa **Lịch Ngày Tốt Master Hub (`components/dashboard.js`)** và các view tính năng riêng rẽ mà không gây trùng lặp mã nguồn (Single Source of Truth).

## 1. Nguyên Tắc Điều Hướng Single Page App (SPA Router)

Mọi chuyển trang trong ứng dụng Nội Tâm sử dụng bộ Router tập trung:
`App.Router.navigate(route, ...subParams)`

### Các Bảng Ánh Xạ Đường Dẫn (Route Mapping Table):

| Mục Tiêu | Nút Bấm Shortcut / Link | Lệnh Router |
|---|---|---|
| **Ma Trận 24H Giờ Hoàng Đạo** | `🔗 Ma Trận 24H ➔` | `App.Router.navigate('astrology', 'heatmap')` |
| **Bảng 6 Trụ Cột Radar** | `🔗 Xem Chi Tiết 6 Trụ Cột ➔` | `App.Router.navigate('astrology', 'lifebalance')` |
| **La Bàn Kỳ Môn Độn Giáp** | `🔗 La Bàn Kỳ Môn ➔` | `App.Router.navigate('oracle', 'compass')` |
| **Quẻ Dịch 64 Quẻ Mai Hoa** | `🔗 Quẻ Dịch ➔` | `App.Router.navigate('oracle', 'iching')` |
| **Trợ Lý Sức Khỏe Tử Vi** | `🔗 Trợ Lý Sức Khỏe ➔` | `App.Router.navigate('astrology', 'health')` |
| **Checklist Nhiệm Vụ Cải Mệnh** | `🔗 Nhiệm Vụ Cải Mệnh ➔` | `App.Router.navigate('astrology', 'tasks')` |
| **Tri Thức & Phản Tư** | `🔗 Nhật Ký Phản Tư ➔` | `App.Router.navigate('knowledge')` |

---

## 2. Quy Chuẩn Gắn Nút Điều Hướng Trực Quan

Khi bổ sung bất kỳ card thông tin mới nào trên Dashboard:
1. Đảm bảo Card có hiển thị tóm tắt ngắn gọn dữ liệu của ngày đang chọn.
2. Đặt nút link phụ dạng ghost: `<button class="btn btn-ghost btn-sm">🔗 Mở Chi Tiết Module ➔</button>`.
3. Gắn sự kiện click `App.Router.navigate(...)` để người dùng có thể mở rộng nghiên cứu sâu bất kỳ lúc nào.
