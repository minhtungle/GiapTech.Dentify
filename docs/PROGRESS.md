# PROGRESS — Nhật ký tiến độ GiapTech.Dentify

> Ghi lại **đang làm gì, tới đâu, quyết định gì**. Cập nhật & commit file này trước khi chuyển máy
> để máy khác `git pull` là nắm được ngay. Mục mới nhất để trên cùng.

## Trạng thái tổng quát

- [x] Khởi tạo solution ABP layered (.NET 10, SQLite) — scaffold template
- [x] Thiết lập Git + tài liệu đồng bộ giữa các máy (CLAUDE.md, PROGRESS.md)
- [x] Giai đoạn 1 (MVP): Patient module + Appointment module cơ bản + Identity/Permission
- [ ] Giai đoạn 2: Tooth Chart module (SVG interactive) + Photo upload + Prescription chi tiết
- [ ] Giai đoạn 3: LabWork + Expense + Kanban
- [ ] Giai đoạn 4: Import/Export CSV + Backup/Restore + Settings đầy đủ
- [ ] Giai đoạn 5 (tuỳ chọn): AI voice-to-note, AI scan hoá đơn, Patient Portal

## Nhật ký

### 2026-07-05 — Giai đoạn 1 (MVP): Patient + Appointment

- **Domain**: `Patient` (FullAuditedAggregateRoot) với `Gender`, `Tags` (List<string>,
  lưu JSON qua ValueConverter), `IsChildPatient` (computed, < 14 tuổi, `[Ignore]` trong EF).
  `Appointment` (FullAuditedAggregateRoot) với `Status`, `Price`/`PaidAmount`/`PaymentStatus`
  (tự tính lại qua `RecordPayment`/`SetPrice`, validate không cho trả vượt giá — business
  exception `Dentify:00003`).
- **EF Core**: thêm `AppPatients`, `AppAppointments` (migration
  `Added_Patient_Appointment`), FK Appointment→Patient. Đã chạy `DbMigrator` thành công
  (SQLite).
- **Application**: `PatientAppService` (CRUD + filter theo tên/SĐT/tag + tổng hợp
  `GetPatientDetailAsync` trả lịch hẹn gần nhất + tổng nợ), `AppointmentAppService`
  (CRUD + `GetCalendarViewAsync` + `UpdatePaymentAsync`, resolve tên bệnh nhân/bác sĩ
  qua repository). Dùng Mapperly cho chiều Entity→Dto (`PatientMapper`,
  `AppointmentMapper`), mapping Dto→Entity làm tay qua domain method để giữ invariant.
  **Bỏ qua `GeneratePatientPortalLinkAsync`** — Patient Portal thuộc Giai đoạn 5
  (tuỳ chọn), không implement dở dang.
- **Permissions**: `Dentify.Patients.{Default,Create,Update,Delete}`,
  `Dentify.Appointments.{Default,Create,Update,Delete,ManagePayment}`.
- **Localization**: thêm `vi.json` (ưu tiên tiếng Việt) + cập nhật `en.json`; đăng ký
  ngôn ngữ `vi` trong `DentifyDomainSharedModule`.
- **Web (MVC Razor Pages)**: menu "Patients"/"Appointments", Razor Pages
  `Pages/Patients` (Index + CreateModal/EditModal) và `Pages/Appointments`
  (Index + CreateModal/EditModal/PaymentModal), DataTables server-side qua JS proxy
  tự sinh của ABP (`giapTech.dentify.application.patients.patient`, `...appointments.appointment`).
  Đã cài `abp install-libs` (yarn cần `--ignore-engines` vì `select2` yêu cầu Node ≥24,
  máy hiện có Node 22 — không phải vấn đề runtime, chỉ là engines check của yarn).
  **Đã test thủ công bằng Playwright** (login admin, tạo/sửa/xoá Patient, tạo Appointment,
  cập nhật thanh toán) — toàn bộ luồng chạy đúng, không có lỗi console.
- **Tests**: `PatientAppServiceTests`/`AppointmentAppServiceTests` (abstract, theo pattern
  generic `<TStartupModule>` có sẵn của scaffold) + concrete `EfCorePatientAppServiceTests`/
  `EfCoreAppointmentAppServiceTests` trong `EntityFrameworkCore.Tests`. 13 test mới, tất cả pass.
- Chưa làm: `IsOperator` trên UserExtension (đánh dấu bác sĩ), Doctor hiện chọn từ toàn bộ
  Identity Users. LabWorkId/Photos trên Appointment chưa có (phụ thuộc module LabWork/Blob
  ở giai đoạn sau).

### 2026-06-29
- Khởi tạo Git repository, thêm `Dentify.db` và `openiddict.pfx` vào `.gitignore`.
- Tạo `CLAUDE.md` (mô tả dự án + cách chạy/quy ước) và `docs/PROGRESS.md` (file này).
- Xác nhận dự án hiện là scaffold ABP thuần — `DentifyDbContext` mới có module ABP
  (Identity, TenantManagement...), chưa có entity riêng; `DentifyPermissions` để trống.

## TODO / việc đang dở

- Giai đoạn 2: Tooth Chart module (SVG interactive, ISO 3950/Palmer/Universal),
  Photo upload (IBlobContainer), Prescription chi tiết (PrescriptionItem).
- Cân nhắc thêm `IsOperator` (bool) trên UserExtension để lọc danh sách bác sĩ trong
  Appointment (hiện đang cho chọn từ toàn bộ Identity Users).

## Quyết định kỹ thuật

- DB dùng **SQLite local**, KHÔNG commit file `.db` → mỗi máy tự chạy `DbMigrator` tạo DB.
- `Patient.Tags`: dùng `List<string>` map qua `HasConversion` (JSON) thành 1 cột TEXT,
  không tách bảng `PatientTag` riêng — đơn giản hơn cho quy mô 1 phòng khám, dễ nâng cấp
  lên bảng riêng sau nếu cần many-to-many thật (vd tag dùng chung style tag-cloud).
- AppService **không dùng `CrudAppService` generic** của ABP — viết tay từng method, gọi
  domain method (`SetTags`, `RecordPayment`,...) để giữ business invariant, chỉ dùng
  Mapperly cho chiều Entity→Dto (dữ liệu phẳng, không có logic).
