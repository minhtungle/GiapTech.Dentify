# 04 — Kiến trúc kỹ thuật

> Công nghệ cụ thể, cấu hình DI, database schema, cơ chế auth. Dùng file này khi cần biết
> "hệ thống dùng thư viện gì, cấu hình ở đâu, vì sao lại thiết kế thế này" ở mức code.

## Stack tổng quan

| Lớp | Công nghệ |
|---|---|
| Backend framework | ABP Framework 10.4.1, .NET 10, layered monolith + DDD |
| Database | PostgreSQL 16, EF Core (Npgsql provider) |
| Auth | OpenIddict (AuthServer nhúng trong cùng process), OAuth2 Authorization Code + PKCE bắt buộc |
| DI container | Autofac (`AbpAutofacModule`), không dùng built-in .NET DI ở tầng Web |
| Object mapping | Riok.Mapperly (compile-time source generator) — **không dùng AutoMapper** |
| Blob storage | ABP BlobStoring, provider Database (lưu trong PostgreSQL, không filesystem/S3) |
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
   `ToothRecordHistory`) — dùng khi dữ liệu tăng vô hạn theo thời gian (log-like) hoặc
   không cần luôn load kèm parent. Cascade delete vẫn xảy ra ở tầng DB (EF Core convention
   khi FK required), dù không đi qua domain method của aggregate cha.
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

### DbSet nghiệp vụ (10 bảng)
`Patients`, `Appointments`, `ToothCharts`, `ToothRecordHistories`, `AppointmentPhotos`,
`PrescriptionItems`, `Payments`, `LabWorks`, `Expenses`, `TaskItems`. (`ToothRecords`
không có DbSet riêng — truy cập qua navigation `ToothChart.Records`.)

### Constraint đáng chú ý
- `ToothChart.PatientId` — **unique index** (1 bệnh nhân chỉ có 1 chart).
- `(ToothRecord.ToothChartId, ToothNumber)` — **unique composite index**.
- `Appointment.PatientId` — FK bắt buộc; `DoctorId` — **chỉ có index, không FK** (chưa
  có entity Doctor).
- `LabWork.AppointmentId`, `ToothRecordHistory.AppointmentId`, `LabWork` không bắt buộc
  Appointment — `IsRequired(false)`.

### Custom repository (cần `.Include()`)
| Interface | Impl | Lý do |
|---|---|---|
| `IAppointmentRepository` | `EfCoreAppointmentRepository` | `GetWithDetailsAsync` include `PrescriptionItems` + `Payments` |
| `IToothChartRepository` | `EfCoreToothChartRepository` | `FindByPatientIdAsync` include `Records` |

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

## Multi-tenancy

`AbpMultiTenancyOptions.IsEnabled = true` (bật ở tầng module), dùng đầy đủ
`Volo.Abp.TenantManagement`. **Tuy nhiên các entity nghiệp vụ (Patient, Appointment,
...) không implement `IMultiTenant`** — nghĩa là hạ tầng multi-tenant có sẵn từ ABP
startup template nhưng **chưa thực sự cách ly dữ liệu theo tenant** ở tầng nghiệp vụ. Dự
án hiện vận hành như 1 tenant duy nhất (1 phòng khám). Nếu sau này cần multi-branch thật,
phải thêm `TenantId` + implement `IMultiTenant` cho từng entity nghiệp vụ — đây là thay
đổi lớn, chưa nằm trong roadmap 13 mục hiện tại.

## Permission

Group `"Dentify"`, cấu trúc CRUD theo module (`Default`/`Create`/`Update`/`Delete`, một
số module có thêm hành động riêng như `Appointments.ManagePayment`,
`AppointmentPhotos.Upload`). **Chưa có phân quyền theo vai trò lâm sàng** (Doctor/
Receptionist/Accountant) — mọi nhân viên đăng nhập được thấy cùng 1 bộ quyền theo Role
được gán qua Identity module có sẵn của ABP, nhưng chưa có Role nào được seed sẵn hay
permission nào giới hạn theo vai trò (xem Đợt 1 roadmap).

## Cơ chế Auth chi tiết

### Backend (OpenIddict)
- `RequireProofKeyForCodeExchange()` — PKCE bắt buộc cho mọi client, không thể tắt.
- Client SPA `Dentify_App` seed qua `OpenIddictDataSeedContributor`, `RedirectUri =
  {RootUrl}/auth-callback` — `RootUrl` cấu hình qua
  `OpenIddict:Applications:Dentify_App:RootUrl` trong appsettings của `DbMigrator`.
- Production: cần `openiddict.pfx` (signing certificate thật, đã gitignore) +
  `AuthServer:CertificatePassPhrase`. Dev: `AddDevelopmentEncryptionAndSigningCertificate`
  tự tạo cert tạm.
- Nếu `AuthServer:RequireHttpsMetadata=false` (dùng khi chạy Docker compose qua HTTP nội
  bộ): tắt `DisableTransportSecurityRequirement`, mở `ForwardedHeaders.XForwardedProto`
  không giới hạn IP — chấp nhận header X-Forwarded-Proto từ bất kỳ proxy, phù hợp môi
  trường container nhưng **không an toàn nếu expose thẳng ra internet không qua reverse
  proxy kiểm soát**.

### Frontend (`oidc-client-ts`)
- `UserManager` với `WebStorageStateStore({ store: localStorage })` — **token lưu trong
  localStorage**, không phải sessionStorage/cookie httpOnly (đánh đổi: đơn giản, nhưng dễ
  bị đọc bởi XSS nếu có lỗ hổng khác trong SPA).
- `automaticSilentRenew: true` — tự refresh ngầm khi gần hết hạn.
- `response_type: "code"` → Authorization Code Flow, PKCE tự động do `oidc-client-ts` xử
  lý khi `response_type` là `"code"`.
- `ProtectedRoute` chỉ kiểm tra `user` tồn tại + chưa expired — **không đọc role/claim
  nào**, không phân biệt loại người dùng. Đây là điểm nghẽn chính khi làm Patient Portal
  (Đợt 5 roadmap): cần thêm logic đọc role vào đây, hoặc tách hẳn client OIDC khác.

## Gọi API từ frontend

`lib/api.ts` — wrapper `fetch` chung: tự đính `Authorization: Bearer <token>` (đọc từ
`userManager.getUser()` mỗi lần gọi, không cache), luôn `Content-Type: application/json`,
parse lỗi theo format ABP (`{ error: { message } }`) thành `ApiError`. Riêng
`appointment-photo-api.ts` **không dùng** `api.ts` (vì cần `FormData`/`Blob`, không set
`Content-Type: application/json`) — tự viết header/lỗi riêng.

Pattern mỗi module: 1 file `lib/<module>-api.ts` tương ứng 1 `types/<module>.ts` (DTO +
enum phía TypeScript, enum response trả số/request nhận tên chuỗi khớp backend).

## Frontend — cấu trúc route & layout

`AppLayout` — sidebar cố định (desktop, `md:flex`) hoặc drawer (mobile, dialog slide-in).
`ProtectedRoute` bọc mọi route trừ `/auth-callback` và `/appointments/:id/invoice` (route
in hoá đơn chỉ có `ProtectedRoute`, không có `AppLayout` — để in sạch không sidebar).

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
