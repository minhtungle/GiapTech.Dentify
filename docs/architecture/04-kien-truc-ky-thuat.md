# 04 — Kiến trúc kỹ thuật

> Công nghệ cụ thể, cấu hình DI, database schema, cơ chế auth. Dùng file này khi cần biết
> "hệ thống dùng thư viện gì, cấu hình ở đâu, vì sao lại thiết kế thế này" ở mức code.

## Stack tổng quan

| Lớp | Công nghệ |
|---|---|
| Backend framework | ABP Framework 10.4.1, .NET 10, layered monolith + DDD |
| Database | PostgreSQL 16, EF Core (Npgsql provider) |
| Auth | OpenIddict (AuthServer nhúng trong cùng process), OAuth2 Authorization Code + PKCE bắt buộc, **2 client SPA** (nhân viên + Patient Portal) |
| DI container | Autofac (`AbpAutofacModule`), không dùng built-in .NET DI ở tầng Web |
| Object mapping | Riok.Mapperly (compile-time source generator) — **không dùng AutoMapper** |
| Blob storage | ABP BlobStoring, provider Database (lưu trong PostgreSQL, không filesystem/S3) |
| Email | `Volo.Abp.MailKit` (SMTP thật khi có cấu hình) + `NullEmailSender` fallback khi chưa cấu hình — Đợt 5 |
| Background job | `Volo.Abp.BackgroundWorkers` — `AsyncPeriodicBackgroundWorkerBase` cho nhắc hẹn (Đợt 5) |
| Frontend framework | React 19 + Vite 8 + TypeScript ~6.0 |
| Styling | Tailwind CSS v4, design system tự viết theo phong cách shadcn (không dùng CLI shadcn) |
| Routing | react-router-dom v7 |
| Auth client | `oidc-client-ts` (PKCE, silent renew) |
| Charts | recharts |
| Calendar | FullCalendar v6 (`core`, `daygrid`, `timegrid`, `interaction`, `react`) |
| Lint | oxlint (thay ESLint), backend không có linter riêng ngoài compiler warning |

## Cấu trúc layer backend (`src/`)

```
Domain.Shared        → hằng số, enum, mã lỗi, resource localization — KHÔNG phụ thuộc
                        project nào khác trong solution
Domain                → Entity, Aggregate Root, Domain Service, Repository interface
Application.Contracts → DTO + interface AppService (contract dùng chung backend/frontend)
Application            → cài đặt AppService, Mapperly mapper
EntityFrameworkCore    → DbContext, migration, custom repository EF Core
HttpApi                → Auto API Controller cho module ngoài (Identity/Account/Tenant)
HttpApi.Client          → dynamic C# HTTP client proxy (dùng cho console test app)
Web                     → host chính: AuthServer + API host (auto controller từ AppService
                          trong Application) + admin Razor Pages có sẵn của ABP
DbMigrator              → console app: migrate schema + seed data khi deploy
```

**Không có project riêng cho Payment/Prescription/AppointmentPhoto** — các entity này
nằm trong module `Appointments` (Domain layer), không phải module độc lập.

## Quy tắc entity lặp lại toàn hệ thống (đọc trước khi thêm entity mới)

1. **Mọi `DateTime` ép `DateTimeKind.Utc`** trước khi lưu, bằng
   `DateTime.SpecifyKind(x, DateTimeKind.Utc)` trong setter — vì `AbpClockOptions.Kind =
   Utc` set cứng trong `DentifyDomainSharedModule` và PostgreSQL `timestamp with time
   zone` bắt buộc UTC. Áp dụng nhất quán ở Patient, Appointment, Payment, LabWork,
   TaskItem, ToothRecord, ToothRecordHistory.
2. **`List<string>`/`List<int>` lưu dưới dạng JSON string** qua EF Core `HasConversion` +
   `ValueComparer` tuỳ biến (không tách bảng con) — dùng cho `Patient.Tags/Allergies/
   MedicalConditions`, `LabWork.ToothNumberList`.
3. **Entity con thật** (`PrescriptionItem`, `Payment`, `ToothRecord`) có constructor và
   setter `internal` — chỉ tạo/sửa được từ domain method của aggregate root chứa nó, đúng
   nguyên tắc DDD. Cần custom repository (`GetWithDetailsAsync`/`FindByPatientIdAsync`)
   để `.Include()` navigation collection, vì generic `IRepository<T,Guid>.GetAsync()`
   KHÔNG tự include.
4. **Aggregate root độc lập nhưng có FK bắt buộc** (`AppointmentPhoto`,
   `ToothRecordHistory`, `ConsentForm`, `SupplyUsage`) — dùng khi dữ liệu tăng vô hạn theo
   thời gian (log-like) hoặc không cần luôn load kèm parent. Cascade delete vẫn xảy ra ở
   tầng DB (EF Core convention khi FK required), dù không đi qua domain method của
   aggregate cha. Mỗi container blob (`AppointmentPhotoContainer`, `ConsentFormContainer`)
   là 1 class rỗng đánh dấu `[BlobContainerName("...")]`, đăng ký `UseDatabase()` trong
   `DentifyDomainModule.Configure<AbpBlobStoringOptions>` — thêm container mới cho module
   file mới thay vì dùng chung 1 container, để không lẫn lộn file giữa các module.
5. **Mapperly mapper phải tự đăng ký DI** — `[Mapper] partial class` **không** tự động
   được ABP nhận diện, phải thêm dòng `context.Services.AddSingleton<XxxMapper>()` thủ
   công trong `DentifyApplicationModule.ConfigureServices`. Quên bước này: `dotnet build`
   **vẫn pass**, nhưng crash runtime khi DI resolve AppService
   (`Autofac.Core.DependencyResolutionException`) — chỉ phát hiện lúc chạy `dotnet test`
   hoặc gọi API thật, không phát hiện lúc build. Đã xảy ra lặp lại nhiều lần trong lịch
   sử dự án (xem `docs/PROGRESS.md`).
6. **Route ABP convention theo tên method**: `Get`/`GetList` → GET; `Create` → POST;
   `Update` → PUT; `Delete`/`Remove` → DELETE; method khác (`ToggleDone`, `UpdateStatus`)
   → mặc định POST/PUT theo verb gần nghĩa nhất, path segment lấy từ phần tên còn lại sau
   khi bỏ tiền tố verb. Tham số tên đúng `id` (không phải tên khác) mới được ABP đẩy vào
   path segment `{id}`; tham số Guid/primitive khác không phải id đầu tiên → query string
   (với GET) hoặc query string (với DELETE, vì DELETE không nhận body).

## Database schema

**Prefix bảng**: `App` (ví dụ `AppPatients`, `AppAppointments`). Provider: PostgreSQL,
kết nối qua `ConnectionStrings:Default`.

### DbSet nghiệp vụ (21 bảng)
`Patients`, `Appointments`, `Doctors`, `Services`, `Drugs`, `Chairs`, `WaitlistEntries`,
`ToothCharts`, `ToothRecordHistories`, `AppointmentPhotos`, `PrescriptionItems`,
`Payments`, `LabWorks`, `Expenses`, `TaskItems`, `TreatmentPlans`, `TreatmentPlanItems`,
`ConsentForms`, `Supplies`, `SupplyUsages`, `InsurancePolicies`. (`ToothRecords` không có
DbSet riêng — truy cập qua navigation `ToothChart.Records`.)

Đợt 5 chỉ thêm cột vào 2 bảng có sẵn (`Appointment.ReminderSentAt`,
`Patient.IdentityUserId`) — không thêm bảng mới, không có module PatientPortal riêng ở
tầng dữ liệu (AppService PatientPortal đọc trực tiếp từ `Patient`/`Appointment`/`Doctor`/
`Service` đã có).

### Constraint đáng chú ý
- `ToothChart.PatientId` — **unique index** (1 bệnh nhân chỉ có 1 chart).
- `(ToothRecord.ToothChartId, ToothNumber)` — **unique composite index**.
- `Appointment.PatientId` — FK bắt buộc; `DoctorId` — **FK tới `Doctor.Id`**, không bắt
  buộc (`IsRequired(false)`, bác sĩ có thể chưa được chỉ định lúc tạo lịch); `ServiceId`
  — **FK tới `Service.Id`**, không bắt buộc, thay thế cột `TreatmentType` (int) cũ;
  `ChairId` — **FK tới `Chair.Id`**, không bắt buộc, thêm ở Đợt 3.
- `Doctor.IdentityUserId` — **unique index** (1 tài khoản `IdentityUser` chỉ gắn với 1
  Doctor).
- `Appointment.DurationMinutes` — `int not null default 30`, `Check.Range(5, 480)` ở
  domain.
- `PrescriptionItem.DrugId` — FK tới `Drug.Id`, không bắt buộc — `DrugName` (text tự do)
  vẫn là nguồn sự thật chính, `DrugId` chỉ tham chiếu thêm, không ràng buộc phải khớp.
- `WaitlistEntry.PatientId` — FK bắt buộc (`onDelete: Cascade` — xoá Patient thì xoá luôn
  WaitlistEntry liên quan, khác các FK khác trong hệ thống thường để mặc định); `DoctorId`/
  `ServiceId` — optional, đúng pattern Appointment.
- `Patient.ReferralSource` — `character varying(128)`, nullable, không JSON conversion
  (khác `Tags`/`Allergies` vì là field đơn, không phải list).
- `LabWork.AppointmentId`, `ToothRecordHistory.AppointmentId`, `LabWork` không bắt buộc
  Appointment — `IsRequired(false)`.
- `TreatmentPlan.PatientId` — FK bắt buộc; `TreatmentPlanItem.TreatmentPlanId` — FK bắt
  buộc (`onDelete: Cascade`, entity con thật); `TreatmentPlanItem.ServiceId`/
  `AppointmentId` — optional.
- `ConsentForm.AppointmentId` — FK bắt buộc, aggregate độc lập (không phải entity con,
  đúng pattern `AppointmentPhoto`).
- `SupplyUsage.SupplyId` — FK bắt buộc (`onDelete: Cascade`); `SupplyUsage.AppointmentId`
  — optional.
- `InsurancePolicy.PatientId` — FK bắt buộc (`onDelete: Cascade`).
- `Patient.IdentityUserId` — **unique khi khác null** (Postgres partial unique index qua
  `HasFilter("\"IdentityUserId\" IS NOT NULL")`, vì field nullable — khác
  `Doctor.IdentityUserId` bắt buộc nên dùng unique index thường).
- `Appointment.ReminderSentAt` — nullable, không có index riêng (chỉ query theo
  `Status`/`ScheduledDateTime` đã có index sẵn, kết hợp filter `ReminderSentAt == null`
  ở tầng LINQ).

### Custom repository (cần `.Include()`)
| Interface | Impl | Lý do |
|---|---|---|
| `IAppointmentRepository` | `EfCoreAppointmentRepository` | `GetWithDetailsAsync` include `PrescriptionItems` + `Payments` |
| `IToothChartRepository` | `EfCoreToothChartRepository` | `FindByPatientIdAsync` include `Records` |
| `ITreatmentPlanRepository` | `EfCoreTreatmentPlanRepository` | `GetWithDetailsAsync` include `Items` |

Mọi entity khác dùng generic `IRepository<T,Guid>` (đăng ký tự động qua
`options.AddDefaultRepositories(includeAllEntities: true)`).

### Lịch sử migration (thứ tự thời gian)
1. `InitialPostgreSql` — schema khởi tạo (module ABP core + Patient + Appointment cơ bản)
2. `AddToothChart`
3. `AddAppointmentPhoto`
4. `AddPrescriptionItem`
5. `AddLabWorkAndExpense`
6. `AddTaskItem`
7. `AddPaymentAndTreatmentType`
8. `AddPatientMedicalAlerts` (Allergies/MedicalConditions) — **migration này có 1 bug đã
   fix**: `defaultValue` ban đầu set `""` cho cột JSON, nhưng converter đọc bằng
   `JsonSerializer.Deserialize<List<string>>` cần `"[]"` mới hợp lệ — `""` gây lỗi 500 khi
   đọc lại record cũ. Đã sửa migration + chạy `UPDATE` tay 1 lần trên dữ liệu đã tồn tại.
   **Bài học**: khi thêm cột JSON-converted mới, `defaultValue` phải là JSON hợp lệ cho
   giá trị rỗng của kiểu đó (`"[]"` cho list, không phải `""`).
9. `AddDoctorAndAppointmentDuration` — thêm bảng `AppDoctors`, FK
   `Appointment.DoctorId → Doctor.Id`, cột `Appointment.DurationMinutes`. **Lưu ý**: tool
   `dotnet ef migrations add` tự sinh `defaultValue: 0` cho cột `DurationMinutes` — không
   hợp lệ vì domain validate `Check.Range(5, 480)`; đã sửa tay thành `defaultValue: 30`
   trước khi migrate.
10. `AddServiceEntity` — migration **có xử lý data migration thật**, không chỉ đổi
    schema: thêm bảng `AppServices` + `AppDrugs`, cột `Appointment.ServiceId` +
    `PrescriptionItem.DrugId`, sau đó **seed đúng 10 Service với Guid cố định** khớp thứ
    tự enum `TreatmentType` cũ, chạy `migrationBuilder.Sql(...)` với `CASE
    "TreatmentType" WHEN 0 THEN '<guid>' ...` để map toàn bộ `Appointment.ServiceId` theo
    dữ liệu `TreatmentType` cũ, rồi mới `DropColumn TreatmentType`. **Thứ tự bắt buộc**:
    seed Service → map dữ liệu → thêm FK constraint → xoá cột cũ (đảo thứ tự sẽ khiến FK
    constraint hoặc map dữ liệu thất bại). Verify sau khi chạy `DbMigrator` bằng `psql`
    (không chỉ tin log) — xác nhận cả 10 Service được seed đúng tên/Guid VÀ toàn bộ
    Appointment cũ map đúng `ServiceId` tương ứng `TreatmentType` cũ, đúng bài học đã ghi
    ở Đợt 1 (seed Role) là build/log thành công không đảm bảo dữ liệu đúng.
11. `AddChairWaitlistAndReferralSource` — gộp 3 thay đổi độc lập trong 1 migration (EF
    Core tool tự gộp vì cả 3 thay đổi `DentifyDbContext` được code cùng lúc trước khi
    chạy `dotnet ef migrations add` lần đầu — đổi tên migration cho phản ánh đúng nội
    dung thay vì tách lại 3 file, không có data migration nào cần thiết vì cả 3 đều cột/
    bảng mới hoàn toàn không đụng dữ liệu cũ): bảng `AppChairs`, bảng
    `AppWaitlistEntries` (FK `PatientId` `onDelete: Cascade`), cột
    `Appointment.ChairId`, cột `Patient.ReferralSource`.
12. `AddTreatmentPlanConsentFormSupplyAndInsurancePolicy` — cùng lý do gộp như migration
    #11 (4 entity mới của Đợt 4 được code cùng lúc trước khi chạy `dotnet ef migrations
    add` lần đầu): bảng `AppTreatmentPlans` + `AppTreatmentPlanItems` (FK
    `TreatmentPlanId` `onDelete: Cascade`), `AppConsentForms`, `AppSupplies` +
    `AppSupplyUsages` (FK `SupplyId` `onDelete: Cascade`), `AppInsurancePolicies` (FK
    `PatientId` `onDelete: Cascade`). Không có data migration — toàn bộ bảng/cột mới
    hoàn toàn.
13. `AddAppointmentReminderAndPatientPortalAccess` (Đợt 5) — chỉ thêm cột, không thêm
    bảng mới: `Appointment.ReminderSentAt` (nullable), `Patient.IdentityUserId`
    (nullable) + unique filtered index. Không có data migration.
14. `AddAppointmentPhotoCaptionMaxLength` (đợt dọn dẹp tồn đọng sau roadmap 13 mục) —
    thu hẹp cột `AppAppointmentPhotos.Caption` từ `text` không giới hạn xuống
    `character varying(256)` để khớp `AppointmentPhotoConsts.MaxCaptionLength` mới thêm
    (trước đó cột này chưa từng có ràng buộc độ dài, dù entity không có field nào set nó
    qua AppService). `dotnet ef migrations add` cảnh báo "may result in loss of data" —
    chấp nhận được vì chưa có Caption nào thực sự dài hơn 256 ký tự từng được lưu (tính
    năng set Caption lúc upload chỉ vừa được thêm cùng lúc).
15. `AddExpenseLabWorkLink` (đợt hoàn thiện sau đợt dọn dẹp) — thêm cột
    `AppExpenses.LabWorkId` (nullable uuid) + FK tới `AppLabWorks.Id` với
    `onDelete: SetNull` (xoá LabWork không kéo theo xoá Expense đã phát sinh, chỉ gỡ liên
    kết) + index. Không có data migration — cột mới hoàn toàn.

## Multi-tenancy

`AbpMultiTenancyOptions.IsEnabled = true` (bật ở tầng module), dùng đầy đủ
`Volo.Abp.TenantManagement`. **Tuy nhiên các entity nghiệp vụ (Patient, Appointment,
...) không implement `IMultiTenant`** — nghĩa là hạ tầng multi-tenant có sẵn từ ABP
startup template nhưng **chưa thực sự cách ly dữ liệu theo tenant** ở tầng nghiệp vụ. Dự
án hiện vận hành như 1 tenant duy nhất (1 phòng khám). Nếu sau này cần multi-branch thật,
phải thêm `TenantId` + implement `IMultiTenant` cho từng entity nghiệp vụ — đây là thay
đổi lớn, chưa nằm trong roadmap 13 mục hiện tại.

## Email & Background Worker (Đợt 5)

- **Email**: `Volo.Abp.MailKit` (`AbpMailKitModule`, thêm vào `[DependsOn]` của
  `DentifyDomainModule`) là transport SMTP thật cho `IEmailSender` của
  `Volo.Abp.Emailing` đã có sẵn từ trước. Cấu hình đọc từ section `Settings:Abp.Mailing.
  Smtp.*` trong `appsettings.secrets.json` của `GiapTech.Dentify.Web` (Host/Port/
  UserName/Password/EnableSsl) + `Settings:Abp.Mailing.DefaultFromAddress/
  DefaultFromDisplayName`. File này tồn tại với giá trị **rỗng** (placeholder, tracked
  trong git — đúng convention có sẵn của các `appsettings.secrets.json` khác trong dự
  án, không phải file mới cần thêm gitignore) — người vận hành tự điền giá trị thật khi
  deploy.
- **Fallback an toàn**: `DentifyDomainModule.ConfigureServices` kiểm tra
  `Settings:Abp.Mailing.Smtp.Host` — nếu rỗng/chưa cấu hình, `Replace` DI đăng ký
  `IEmailSender` bằng `NullEmailSender` (không gửi, không lỗi) thay vì để MailKit cố gắng
  kết nối SMTP không tồn tại và crash. Logic này **không còn phân biệt theo `#if DEBUG`**
  như trước Đợt 5 (khi đó DEBUG luôn no-op, Release luôn cố gắng gửi thật dù chưa cấu
  hình) — giờ quyết định hoàn toàn dựa vào cấu hình thực tế, áp dụng nhất quán cho cả
  dev lẫn production.
- **Background worker**: `Volo.Abp.BackgroundWorkers` (thêm `[DependsOn]`
  `AbpBackgroundWorkersModule`) cho nhu cầu chạy định kỳ (khác `Volo.Abp.BackgroundJobs`
  đã có sẵn từ đầu dự án nhưng chưa từng được dùng thật — đó là queue chạy 1 lần, không
  phù hợp cho tác vụ "quét mỗi 15 phút"). `AppointmentReminderWorker`
  (`AsyncPeriodicBackgroundWorkerBase`, `Timer.Period =
  AppointmentReminderConsts.WorkerPeriodMilliseconds`) đăng ký qua
  `context.AddBackgroundWorkerAsync<AppointmentReminderWorker>()` trong
  `DentifyWebModule.OnPostApplicationInitializationAsync` — **chỉ chạy ở Web host**,
  không đăng ký ở `DbMigrator` (console app chạy 1 lần rồi thoát, không có ý nghĩa chạy
  worker định kỳ ở đó).
- **AppService bị worker gọi phải ẩn khỏi REST**: `AppointmentReminderAppService` đánh
  dấu `[RemoteService(IsEnabled = false)]` — nếu không, ABP auto-sinh route
  `POST /api/app/appointment-reminder/send-due-reminders` cho MỌI `IApplicationService`
  theo convention, vô tình lộ 1 endpoint cho phép bất kỳ ai gọi kích hoạt gửi email hàng
  loạt. Attribute này chỉ tắt route REST, không ảnh hưởng DI — worker vẫn resolve và gọi
  được service bình thường qua `IServiceScopeFactory`.

## Permission

Group `"Dentify"`, cấu trúc CRUD theo module (`Default`/`Create`/`Update`/`Delete`, một
số module có thêm hành động riêng như `Appointments.ManagePayment`,
`AppointmentPhotos.Upload`, `Appointments.ManageClinicalNotes` — tách riêng khỏi
`Appointments.Update` để Receptionist dời được lịch/đổi giá nhưng không sửa được ghi chú
lâm sàng (`PreOpNotes`/`PostOpNotes`); `AppointmentAppService` chỉ
`AuthorizationService.CheckAsync` permission này khi thực sự có thay đổi 2 field đó,
`Doctors.*` quản lý danh sách bác sĩ, `Services.*` quản lý bảng giá dịch vụ, `Drugs.*`
quản lý danh mục thuốc, `Chairs.*` quản lý ghế nha khoa, `Waitlist.*` quản lý danh sách
chờ, `TreatmentPlans.*` quản lý kế hoạch điều trị, `ConsentForms.Upload`/`.Delete` quản lý
phiếu đồng ý (không có `Create`/`Update` — bản chất upload file), `Supplies.*` quản lý vật
tư/tồn kho, `InsurancePolicies.*` quản lý hồ sơ bảo hiểm, `Patients.ManagePortalAccess`
tách riêng khỏi `Patients.Update` để gán/gỡ tài khoản Patient Portal, `PatientPortal.
Default` — permission duy nhất của role `Patient`, không có `Create`/`Update`/`Delete` vì
AppService PatientPortal hoàn toàn đọc-only).

**Phân quyền theo vai trò lâm sàng** — 4 Role được seed tự động khi chạy `DbMigrator`
qua `ClinicRoleDataSeedContributor` (`IDataSeedContributor`, nằm ở
`src/GiapTech.Dentify.Application/Identity/` — **không đặt ở `Domain`** vì cần
`DentifyPermissions` từ `Application.Contracts`, Domain không được reference tầng cao
hơn):

| Role | Permission |
|---|---|
| `Doctor` | `Appointments.Update`, `Appointments.ManageClinicalNotes`, `ToothChart.Update`, `AppointmentPhotos.Upload`, `AppointmentPhotos.Delete` |
| `Receptionist` | `Patients.*` (bao gồm `Patients.ManagePortalAccess`), `Appointments.Create`, `Appointments.Update`, `AbpIdentity.Users` (permission có sẵn của ABP Identity module — cần để tìm kiếm tài khoản qua `IdentityUserPicker` khi cấp tài khoản Doctor/Patient Portal, đợt dọn dẹp tồn đọng) |
| `Accountant` | `Appointments.ManagePayment`, `Expenses.*`, `Statistics.Default` |
| `Patient` (Đợt 5) | chỉ `PatientPortal.Default` — cố tình **không** có bất kỳ permission `Patients.*`/`Appointments.*` nào, tránh lộ quyền staff cho tài khoản bệnh nhân |

Gán permission theo Role qua `IPermissionManager.SetForRoleAsync(roleName, permission,
isGranted: true)` (namespace `Volo.Abp.PermissionManagement`). **Bài học quan trọng**:
`IDataSeedContributor` chỉ được ABP module system nhận diện nếu assembly chứa nó được
load qua `[DependsOn]` — ban đầu `DentifyDbMigratorModule` chỉ depend
`DentifyApplicationContractsModule` nên seed không chạy (build thành công, không lỗi,
nhưng Role không xuất hiện trong DB); phải đổi `[DependsOn]` sang
`DentifyApplicationModule` (đã bao gồm ApplicationContracts) + thêm `ProjectReference`
tới `GiapTech.Dentify.Application.csproj` trong `GiapTech.Dentify.DbMigrator.csproj`.

## Cơ chế Auth chi tiết

### Backend (OpenIddict) — 2 client SPA từ Đợt 5
- `RequireProofKeyForCodeExchange()` — PKCE bắt buộc cho mọi client, không thể tắt.
- Client SPA nhân viên `Dentify_App` seed qua `OpenIddictDataSeedContributor`,
  `RedirectUri = {RootUrl}/auth-callback` — `RootUrl` cấu hình qua
  `OpenIddict:Applications:Dentify_App:RootUrl` trong appsettings của `DbMigrator`.
- Client SPA Patient Portal `Dentify_PatientPortal` (thêm ở Đợt 5) — seed cùng file, cùng
  cấu trúc (Authorization Code + PKCE), `RedirectUri = {RootUrl}/auth-callback` với
  `RootUrl` riêng đọc từ `OpenIddict:Applications:Dentify_PatientPortal:RootUrl` (dev:
  `http://localhost:5173/portal`) — **client riêng biệt hoàn toàn với `Dentify_App`**, đổi
  redirect URI/scope 1 bên không ảnh hưởng bên kia.
- Production: cần `openiddict.pfx` (signing certificate thật, đã gitignore) +
  `AuthServer:CertificatePassPhrase`. Dev: `AddDevelopmentEncryptionAndSigningCertificate`
  tự tạo cert tạm.
- Nếu `AuthServer:RequireHttpsMetadata=false` (dùng khi chạy Docker compose qua HTTP nội
  bộ): tắt `DisableTransportSecurityRequirement`, mở `ForwardedHeaders.XForwardedProto`
  không giới hạn IP — chấp nhận header X-Forwarded-Proto từ bất kỳ proxy, phù hợp môi
  trường container nhưng **không an toàn nếu expose thẳng ra internet không qua reverse
  proxy kiểm soát**.

### Frontend (`oidc-client-ts`) — 2 UserManager độc lập
- SPA nhân viên: `UserManager` với `WebStorageStateStore({ store: localStorage })` —
  **token lưu trong localStorage**, không phải sessionStorage/cookie httpOnly (đánh đổi:
  đơn giản, nhưng dễ bị đọc bởi XSS nếu có lỗ hổng khác trong SPA).
- SPA Patient Portal (Đợt 5): **`UserManager` thứ 2 hoàn toàn độc lập**
  (`auth/patientPortalUserManager.ts`), `client_id` khác (`VITE_PATIENT_PORTAL_CLIENT_ID`),
  redirect URI `/portal/auth-callback`. `oidc-client-ts` tự scope key lưu trong
  localStorage theo `authority + client_id`, nên 2 instance không đè token lên nhau dù
  chạy trên cùng origin — không cần thêm cấu hình storage prefix thủ công.
- `automaticSilentRenew: true` (cả 2) — tự refresh ngầm khi gần hết hạn.
- `response_type: "code"` → Authorization Code Flow, PKCE tự động do `oidc-client-ts` xử
  lý khi `response_type` là `"code"`.
- `ProtectedRoute` (nhân viên) chỉ kiểm tra `user` tồn tại + chưa expired — không đọc
  role/claim nào. `PortalProtectedRoute` (Patient Portal) làm y hệt nhưng dùng context
  auth riêng (`PatientPortalAuthProvider`/`usePatientPortalAuth()`) — 2 context React
  hoàn toàn tách biệt, không có logic đọc role dùng chung vì mỗi SPA chỉ phục vụ đúng 1
  loại người dùng (nhân viên vs bệnh nhân), không cần phân biệt trong cùng 1 phiên.

## Gọi API từ frontend

`lib/api.ts` — wrapper `fetch` chung cho SPA nhân viên: tự đính `Authorization: Bearer
<token>` (đọc từ `userManager.getUser()` mỗi lần gọi, không cache), luôn `Content-Type:
application/json`, parse lỗi theo format ABP (`{ error: { message } }`) thành `ApiError`.
Riêng `appointment-photo-api.ts`/`consent-forms-api.ts` **không dùng** `api.ts` (vì cần
`FormData`/`Blob`, không set `Content-Type: application/json`) — tự viết header/lỗi riêng.

`lib/patient-portal-api.ts` (Đợt 5) — wrapper riêng cho SPA Patient Portal, cấu trúc y hệt
`api.ts` nhưng đọc token từ `patientPortalUserManager` — **không import** `lib/api.ts` hay
`auth/userManager.ts` của SPA nhân viên, giữ 2 SPA hoàn toàn độc lập ở tầng gọi API.

Pattern mỗi module: 1 file `lib/<module>-api.ts` tương ứng 1 `types/<module>.ts` (DTO +
enum phía TypeScript, enum response trả số/request nhận tên chuỗi khớp backend).

## Frontend — cấu trúc route & layout

`AppLayout` — sidebar cố định (desktop, `md:flex`) hoặc drawer (mobile, dialog slide-in).
`ProtectedRoute` bọc mọi route nhân viên trừ `/auth-callback` và
`/appointments/:id/invoice` (route in hoá đơn chỉ có `ProtectedRoute`, không có
`AppLayout` — để in sạch không sidebar).

**Route group Patient Portal** (`/portal/*`, Đợt 5) — mount trong CÙNG `App.tsx`, dạng 1
component `PatientPortalRoutes` bọc `<Routes>` con bằng `PatientPortalAuthProvider` rồi
gắn vào `<Route path="/portal/*" element={<PatientPortalRoutes />} />` ở cây route ngoài
cùng. Bên trong: `/portal/auth-callback` (không bọc `PortalProtectedRoute`, giống
`/auth-callback` của SPA nhân viên), `/portal` (index, `PortalDashboardPage`),
`/portal/appointments` (`PortalAppointmentsPage`) — cả 2 bọc `PortalProtectedRoute` +
`PortalLayout` (không phải `AppLayout`). Về mặt cây React, `PatientPortalAuthProvider`
nằm lồng bên trong `AuthProvider` của SPA nhân viên (vì `AuthProvider` bọc toàn bộ `<App
/>` từ `main.tsx`) nhưng 2 context hoàn toàn độc lập (khác `UserManager`, khác hook, khác
key lưu trữ) nên không có rò rỉ trạng thái giữa 2 SPA.

## Design system frontend (`components/ui/*.tsx`)

14 file, tự viết dựa trên Radix UI primitives (không dùng CLI shadcn để generate):
`alert-dialog`, `badge`, `button`, `card`, `dialog`, `input`, `label`, `select`,
`skeleton`, `sonner` (toast), `table`, `tabs`, `textarea`, `tooltip`. Theme màu định
nghĩa bằng biến CSS `oklch` trong `index.css`, có sẵn CSS cho dark mode (`.dark` class)
nhưng **chưa có UI toggle** để bật/tắt.

FullCalendar có theme tuỳ biến riêng (`.notion-calendar` trong `index.css`) map biến
`--fc-*` sang theme app, phong cách tối giản.

## Testing

- **Backend**: `dotnet test` chạy **hoàn toàn in-memory** (SQLite in-memory qua
  `Microsoft.Data.Sqlite`, KHÔNG dùng Testcontainers/Postgres thật). Schema tạo trực tiếp
  từ model (`CreateTables()`), không qua migration. Permission/Feature check bị tắt
  trong test module (`AddAlwaysAllowAuthorization`). Không cần Docker/Postgres khi chạy
  `dotnet test`.
- **Frontend**: **không có test tự động** (không Vitest/Jest/Playwright trong
  dependencies). Verify tính năng mới luôn qua Playwright cài tạm + xoá sau khi xong
  (quy ước xuyên suốt dự án, xem `06-quy-uoc-phat-trien.md`).

## CI/CD

**Chưa có** — không tồn tại `.github/workflows/` hay pipeline CI nào khác. Mọi
build/test/deploy hiện tại đều chạy tay.
