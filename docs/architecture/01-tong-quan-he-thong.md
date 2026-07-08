# 01 — Tổng quan hệ thống

> Phần của bộ tài liệu kiến trúc `docs/architecture/`. Đây là điểm bắt đầu — đọc file này
> trước khi vào các file chi tiết khác. Với tiến độ theo thời gian (ai làm gì, khi nào,
> quyết định gì), xem `docs/PROGRESS.md` — file đó là nhật ký, còn 6 file trong
> `docs/architecture/` là ảnh chụp trạng thái hệ thống tại một thời điểm, được cập nhật
> lại mỗi khi kiến trúc thay đổi đáng kể.

## Dentify là gì

Dentify là ứng dụng quản lý phòng khám nha khoa quy mô 1 phòng khám (không phải chuỗi
đa chi nhánh dù hạ tầng multi-tenant đã có sẵn — xem mục "Multi-tenancy" ở
`04-kien-truc-ky-thuat.md`). Hệ thống phục vụ nhân viên phòng khám (lễ tân, bác sĩ, kế
toán — phân quyền theo vai trò lâm sàng qua 3 Role `Doctor`/`Receptionist`/`Accountant`)
quản lý: hồ sơ bệnh nhân, lịch hẹn đa bác sĩ/đa ghế, sơ đồ răng, đơn thuốc, ảnh lâm sàng,
phiếu đồng ý điều trị điện tử, kế hoạch điều trị nhiều bước, bảo hiểm y tế, quản lý vật
tư/tồn kho, danh sách chờ, ca gửi labo ngoài, chi phí vận hành, công việc nội bộ, thanh
toán nhiều lần, hoá đơn in, nhắc hẹn qua email, và thống kê doanh thu.

Có **Patient Portal** (bệnh nhân tự đăng nhập xem hồ sơ) ở mức tối giản, đọc-only — bệnh
nhân xem được lịch hẹn sắp tới, lịch sử điều trị, và công nợ của chính mình, không tự đặt
lịch/sửa được gì. Tài khoản do admin tạo + gán link thủ công (không có luồng tự đăng ký).
Đây là module cuối cùng trong roadmap 13 mục — xem `docs/PROGRESS.md` mục "Roadmap 5 đợt"
để biết chi tiết quyết định thiết kế.

## Bức tranh kiến trúc 1 câu

**Backend ABP Framework (.NET 10, layered DDD) đóng 3 vai trò trong 1 process** — AuthServer
(OpenIddict), API host (REST tự sinh từ AppService), và admin backoffice (Razor Pages có
sẵn của ABP cho Identity/Permission/Tenant) — **frontend là 1 Vite app duy nhất chứa 2 SPA
độc lập** (route `/` cho nhân viên, route `/portal` cho bệnh nhân), mỗi SPA có OIDC client
riêng (`Dentify_App`/`Dentify_PatientPortal`) nhưng cùng gọi chung API qua `/api/app/*`,
đăng nhập bằng OAuth2 Authorization Code + PKCE (redirect sang trang login do chính
AuthServer host).

```
┌───────────────────────────────────┐         ┌──────────────────────────────────────┐
│   React app (frontend, 1 build)   │  PKCE   │        ASP.NET Core (Web host)       │
│   Vite + TS + Tailwind             │◄───────►│  ┌────────────┐  ┌─────────────────┐ │
│   /        → SPA nhân viên         │  REST   │  │ AuthServer │  │  Admin Razor    │ │
│   /portal  → SPA bệnh nhân          │────────►│  │ OpenIddict │  │  Pages (ABP)    │ │
│   port 5173                        │  JSON   │  └────────────┘  └─────────────────┘ │
└───────────────────────────────────┘         │  ┌──────────────────────────────┐   │
                                     │  │  Auto API Controllers        │   │
                                     │  │  (từ AppService, /api/app/*) │   │
                                     │  └──────────────────────────────┘   │
                                     │           port 44348                │
                                     └──────────────────┬───────────────────┘
                                                         │ EF Core (Npgsql)
                                                         │           ┌──────────────┐
                                                         │           │ SMTP (email  │
                                                         │           │ nhắc hẹn,    │
                                                         │           │ optional)    │
                                                         ▼           └──────────────┘
                                                 ┌───────────────┐
                                                 │  PostgreSQL   │
                                                 │  port 5432    │
                                                 └───────────────┘
```

## Trạng thái hiện tại (tính năng đã hoàn thành)

Roadmap 13 mục đã **hoàn tất toàn bộ 5 đợt**. Các module nghiệp vụ đang hoạt động — xem
đặc tả đầy đủ ở `02-dac-ta-chuc-nang.md`:

| Module | Tóm tắt 1 dòng |
|---|---|
| Patient | Hồ sơ bệnh nhân, tag, dị ứng/bệnh nền có cấu trúc, đếm no-show, danh sách cần nhắc tái khám, liên kết tài khoản Patient Portal |
| Doctor | Bác sĩ liên kết `IdentityUser`, dùng cho double-booking + phân quyền lâm sàng |
| Service / Drug / Chair | 3 danh mục chuẩn thay cho dữ liệu tự do trước đây (dịch vụ, thuốc, ghế) |
| Appointment | Lịch hẹn đa bác sĩ/đa ghế, trạng thái, đơn thuốc con, ảnh lâm sàng con, phiếu đồng ý con, lịch sử thanh toán con, đã gửi nhắc hẹn email |
| TreatmentPlan | Kế hoạch điều trị nhiều bước/bệnh nhân, mỗi bước có trạng thái riêng |
| InsurancePolicy | Hồ sơ bảo hiểm y tế (chỉ thông tin, không đụng tiền) |
| Supply / SupplyUsage | Quản lý vật tư có tính tồn kho tự động |
| Waitlist | Danh sách chờ, xếp lịch thủ công |
| ToothChart | Sơ đồ răng số hoá (SVG), lịch sử đổi trạng thái theo từng răng |
| LabWork | Theo dõi ca gửi labo ngoài, board Kanban kéo-thả theo trạng thái |
| Expense | Sổ chi phí vận hành theo danh mục |
| TaskItem | To-do nội bộ nhân viên, không gắn với bệnh nhân |
| ClinicSettings | Thông tin phòng khám (tên/địa chỉ/SĐT/logo) qua ABP Setting Management |
| Statistics | Doanh thu theo thời gian + tăng trưởng, xếp hạng dịch vụ, theo bác sĩ |
| PatientPortal | SPA riêng cho bệnh nhân — xem lịch hẹn/lịch sử/công nợ, đọc-only |
| Invoice (trang) | In hoá đơn HTML qua `window.print()`, không sinh PDF |
| Dashboard (trang) | Tổng quan: doanh thu, cảnh báo công nợ/labo trễ/task quá hạn/nhắc tái khám |

## Roadmap 13 mục — đã hoàn tất

5 đợt đã lên kế hoạch và triển khai xong (đối chiếu chuẩn ngành PMS — Dentrix/Open
Dental/Curve/tab32), theo đúng thứ tự phụ thuộc kỹ thuật:

1. **Đợt 1 (nền tảng)**: entity Doctor, phân quyền theo vai trò (Role có sẵn của ABP),
   `Appointment.DurationMinutes`.
2. **Đợt 2 (danh mục dịch vụ)**: chuyển `TreatmentType` enum → entity `Service` có giá,
   danh mục thuốc chuẩn `Drug`.
3. **Đợt 3 (vận hành lịch)**: Multi-chair, Waitlist, Referral tracking.
4. **Đợt 4 (hồ sơ & tài chính mở rộng)**: Treatment plan nhiều bước, Consent form điện
   tử, Bảo hiểm y tế, Quản lý vật tư/tồn kho.
5. **Đợt 5 (mở rộng ra ngoài)**: Nhắc hẹn email (SMS cố tình không làm — cần provider trả
   phí ngoài phạm vi), Patient Portal đọc-only.

Chi tiết đầy đủ từng đợt (quyết định thiết kế, lý do): `docs/PROGRESS.md` mục nhật ký
"Roadmap 5 đợt cho 13 mục còn thiếu" và các mục nhật ký "Roadmap Đợt N" theo sau. Khi
thêm tính năng mới ngoài phạm vi 13 mục gốc, tiếp tục cập nhật 6 file trong
`docs/architecture/` — đây là tài liệu sống, không phải chụp 1 lần rồi bỏ.

## Cách đọc bộ tài liệu này

| File | Trả lời câu hỏi |
|---|---|
| `01-tong-quan-he-thong.md` (đang đọc) | Hệ thống này là gì, kiến trúc tổng thể ra sao |
| `02-dac-ta-chuc-nang.md` | Từng module có field gì, business rule gì, API gì |
| `03-luong-nghiep-vu.md` | Người dùng thao tác qua các bước nào cho từng nghiệp vụ chính |
| `04-kien-truc-ky-thuat.md` | Công nghệ cụ thể, cấu hình DI, cơ chế auth, database schema |
| `05-trien-khai-van-hanh.md` | Cách cài đặt, chạy dev, deploy Docker, backup/restore |
| `06-quy-uoc-phat-trien.md` | Quy trình/convention khi thêm 1 tính năng mới |

Tài liệu này bổ sung, không thay thế `CLAUDE.md` ở gốc repo (hướng dẫn ngắn cho AI agent
khi mở dự án) và `docs/PROGRESS.md` (nhật ký tiến độ theo thời gian). `CLAUDE.md` nên trỏ
sang bộ tài liệu này để tránh trùng lặp nội dung chi tiết.
