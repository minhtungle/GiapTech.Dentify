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
toán dùng chung 1 giao diện, chưa phân quyền theo vai trò lâm sàng) quản lý: hồ sơ bệnh
nhân, lịch hẹn, sơ đồ răng, đơn thuốc, ảnh lâm sàng, ca gửi labo ngoài, chi phí vận
hành, công việc nội bộ, thanh toán nhiều lần, hoá đơn in, và thống kê doanh thu.

Không có patient portal (bệnh nhân không tự đăng nhập xem hồ sơ) — đây là 1 trong 13 mục
đã xác định còn thiếu, xem `docs/PROGRESS.md` mục "Roadmap 5 đợt".

## Bức tranh kiến trúc 1 câu

**Backend ABP Framework (.NET 10, layered DDD) đóng 3 vai trò trong 1 process** — AuthServer
(OpenIddict), API host (REST tự sinh từ AppService), và admin backoffice (Razor Pages có
sẵn của ABP cho Identity/Permission/Tenant) — **frontend nghiệp vụ là 1 React SPA hoàn
toàn tách biệt**, gọi API qua `/api/app/*`, đăng nhập bằng OAuth2 Authorization Code +
PKCE (redirect sang trang login do chính AuthServer host).

```
┌─────────────────────────┐         ┌──────────────────────────────────────┐
│   React SPA (frontend)  │  PKCE   │        ASP.NET Core (Web host)       │
│   Vite + TS + Tailwind  │◄───────►│  ┌────────────┐  ┌─────────────────┐ │
│   port 5173             │  REST   │  │ AuthServer │  │  Admin Razor    │ │
│                          │────────►│  │ OpenIddict │  │  Pages (ABP)    │ │
└─────────────────────────┘  JSON   │  └────────────┘  └─────────────────┘ │
                                     │  ┌──────────────────────────────┐   │
                                     │  │  Auto API Controllers        │   │
                                     │  │  (từ AppService, /api/app/*) │   │
                                     │  └──────────────────────────────┘   │
                                     │           port 44348                │
                                     └──────────────────┬───────────────────┘
                                                         │ EF Core (Npgsql)
                                                         ▼
                                                 ┌───────────────┐
                                                 │  PostgreSQL   │
                                                 │  port 5432    │
                                                 └───────────────┘
```

## Trạng thái hiện tại (tính năng đã hoàn thành)

10 module nghiệp vụ đang hoạt động — xem đặc tả đầy đủ ở `02-dac-ta-chuc-nang.md`:

| Module | Tóm tắt 1 dòng |
|---|---|
| Patient | Hồ sơ bệnh nhân, tag, dị ứng/bệnh nền có cấu trúc, đếm no-show, danh sách cần nhắc tái khám |
| Appointment | Lịch hẹn, trạng thái, loại điều trị, đơn thuốc con, ảnh lâm sàng con, lịch sử thanh toán con |
| ToothChart | Sơ đồ răng số hoá (SVG), lịch sử đổi trạng thái theo từng răng |
| LabWork | Theo dõi ca gửi labo ngoài, board Kanban kéo-thả theo trạng thái |
| Expense | Sổ chi phí vận hành theo danh mục |
| TaskItem | To-do nội bộ nhân viên, không gắn với bệnh nhân |
| ClinicSettings | Thông tin phòng khám (tên/địa chỉ/SĐT/logo) qua ABP Setting Management |
| Statistics | Doanh thu theo thời gian + tăng trưởng, xếp hạng loại điều trị, theo bác sĩ |
| Invoice (trang) | In hoá đơn HTML qua `window.print()`, không sinh PDF |
| Dashboard (trang) | Tổng quan: doanh thu, cảnh báo công nợ/labo trễ/task quá hạn/nhắc tái khám |

**Trạng thái git tại thời điểm viết tài liệu này**: phần "Giai đoạn B" (Allergies/
MedicalConditions trên Patient, `GetRecallListAsync`, đếm no-show) đã code xong, build
+ test pass, verify UI thật bằng Playwright không lỗi — **nhưng chưa được `git commit`**.
Nội dung 6 file tài liệu này phản ánh code hiện có trên đĩa (bao gồm phần chưa commit),
vì đó là trạng thái thật đang chạy. Trước khi bắt tay vào bất kỳ tính năng mới nào, hãy
xác nhận đã commit phần này hay muốn giữ nguyên working tree.

## Lộ trình sắp tới

Đã lên roadmap 5 đợt cho 13 mục còn thiếu (đối chiếu chuẩn ngành PMS — Dentrix/Open
Dental/Curve/tab32), theo đúng thứ tự phụ thuộc kỹ thuật:

1. **Đợt 1 (nền tảng)**: entity Doctor, phân quyền theo vai trò (Role có sẵn của ABP),
   `Appointment.DurationMinutes`.
2. **Đợt 2 (danh mục dịch vụ)**: chuyển `TreatmentType` enum → entity `Service` có giá,
   danh mục thuốc chuẩn `Drug`.
3. **Đợt 3 (vận hành lịch)**: Multi-chair, Waitlist, Referral tracking.
4. **Đợt 4 (hồ sơ & tài chính mở rộng)**: Treatment plan nhiều bước, Consent form điện
   tử, Bảo hiểm y tế, Quản lý vật tư/tồn kho.
5. **Đợt 5 (mở rộng ra ngoài)**: Nhắc hẹn SMS/email, Patient Portal.

Chi tiết đầy đủ từng đợt: `docs/PROGRESS.md` mục nhật ký "Roadmap 5 đợt cho 13 mục còn
thiếu". Khi bắt đầu 1 đợt, cập nhật lại 6 file trong `docs/architecture/` — đây là tài
liệu sống, không phải chụp 1 lần rồi bỏ.

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
