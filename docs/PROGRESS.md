# PROGRESS — Nhật ký tiến độ GiapTech.Dentify

> Ghi lại **đang làm gì, tới đâu, quyết định gì**. Cập nhật & commit file này trước khi chuyển máy
> để máy khác `git pull` là nắm được ngay. Mục mới nhất để trên cùng.

## Trạng thái tổng quát

- [x] Khởi tạo solution ABP layered (.NET 10) — scaffold template
- [x] Thiết lập Git + tài liệu đồng bộ giữa các máy (CLAUDE.md, PROGRESS.md)
- [x] Giai đoạn 1 (MVP): Patient module + Appointment module cơ bản + Identity/Permission
- [x] Đổi kiến trúc: DB → PostgreSQL, frontend nghiệp vụ tách riêng (React + shadcn/ui,
      OAuth2 PKCE), backend chỉ còn AuthServer + API + admin Razor, toàn bộ triển khai
      qua Docker Compose
- [ ] Giai đoạn 2: Tooth Chart module (SVG interactive) + Photo upload + Prescription chi tiết
- [ ] Giai đoạn 3: LabWork + Expense + Kanban
- [ ] Giai đoạn 4: Import/Export CSV + Backup/Restore + Settings đầy đủ
- [ ] Giai đoạn 5 (tuỳ chọn): AI voice-to-note, AI scan hoá đơn, Patient Portal

## Nhật ký

### 2026-07-05 (2) — Đổi kiến trúc: PostgreSQL + React frontend (shadcn) + Docker

Theo yêu cầu: tách frontend riêng (shadcn/React) gọi qua API, đổi DB sang PostgreSQL,
triển khai toàn bộ qua Docker. Đã xác nhận 2 quyết định với user trước khi làm: (1) auth
dùng **OAuth2 Authorization Code + PKCE** (không tự viết endpoint login/JWT riêng), (2)
**giữ nguyên Razor Pages admin** có sẵn của ABP (Identity/Permission/Setting/Tenant
Management), chỉ bỏ phần UI nghiệp vụ (Patient/Appointment) sang React.

- **Database → PostgreSQL**: đổi `Volo.Abp.EntityFrameworkCore.Sqlite` →
  `...PostgreSql`, `UseNpgsql()` trong `DentifyEntityFrameworkCoreModule` +
  `DentifyDbContextFactory`. Xoá migration SQLite cũ, tạo lại `InitialPostgreSql`.
  Bỏ `AddAlwaysDisableUnitOfWorkTransaction()`/`UnitOfWorkTransactionBehavior.Disabled`
  (workaround riêng cho SQLite, Postgres không cần).
  **Gotcha quan trọng**: Postgres `timestamp with time zone` chỉ nhận `DateTime` có
  `Kind=Utc` → set `AbpClockOptions.Kind = DateTimeKind.Utc` trong
  `DentifyDomainSharedModule`, và `Patient.SetDateOfBirth`/`Appointment.Reschedule` tự
  `DateTime.SpecifyKind(..., Utc)` trước khi gán (nếu không sẽ lỗi
  `Cannot write DateTime with Kind=Local/Unspecified... only UTC is supported` khi insert).
  EF Core Tests (SQLite in-memory) giữ nguyên — không cần Postgres thật để chạy test,
  đây là pattern chuẩn của ABP (test double độc lập với DB provider thật).
- **Auth cho SPA (PKCE)**: `DentifyWebModule` thêm
  `PreConfigure<OpenIddictServerBuilder>(b => b.RequireProofKeyForCodeExchange())`
  (bắt buộc PKCE cho MỌI client, vì helper `CreateOrUpdateApplicationAsync` của ABP
  không có tham số per-client cho PKCE). Thêm CORS (`App:CorsOrigins`,
  `app.UseCors()` ngay sau `UseRouting()`). Sửa `OpenIddictDataSeedContributor`: client
  `Dentify_App` đổi từ "Console Test/Angular" placeholder → SPA thật, chỉ còn
  `AuthorizationCode`+`RefreshToken` (bỏ `Password`/`ClientCredentials` — không hợp với
  public client), `RedirectUri = {RootUrl}/auth-callback` (đọc từ
  `OpenIddict:Applications:Dentify_App:RootUrl` trong appsettings của DbMigrator).
- **Bỏ UI nghiệp vụ Razor**: xoá `Pages/Patients`, `Pages/Appointments` + menu item
  tương ứng trong `DentifyMenuContributor`/`DentifyMenus`. Thêm 1 menu item link ra
  app React (đọc từ setting `App:ClientUrl`). AppServices/API giữ nguyên — chính là
  cái frontend mới gọi vào (`/api/app/patient`, `/api/app/appointment`, đã có sẵn từ
  Giai đoạn 1 nhờ `ConventionalControllers.Create(...)` — không cần thêm controller tay).
- **Frontend mới** (`frontend/`): Vite + React 19 + TypeScript + Tailwind v4 +
  shadcn/ui-style components (tự viết trong repo theo convention của shadcn — KHÔNG
  chạy `shadcn init`/CLI vì cần fetch từ ui.shadcn.com, không có trong allowlist mạng
  của sandbox; component thủ công dựa trên `@radix-ui/react-*` primitives, tương đương
  100% với output CLI sinh ra). `oidc-client-ts` cho PKCE flow (`UserManager`,
  `AuthProvider` context, `ProtectedRoute` tự redirect sang trang Login của AuthServer
  khi chưa đăng nhập). Trang Patients (CRUD + tags) và Appointments (CRUD + cập nhật
  thanh toán). **Lưu ý enum wire format**: response trả **số** (ordinal C#, do
  `AbpStringToEnumConverter.Write()` chủ động bỏ qua chính nó, chỉ áp dụng lúc đọc),
  request nhận **tên enum dạng string** — xem comment trong `types/patient.ts`.
- **Đã test end-to-end bằng Playwright thật** (không mock): chạy Postgres +
  backend (`dotnet run`, `ASPNETCORE_ENVIRONMENT=Development`,
  `AuthServer:RequireHttpsMetadata=false` trong `appsettings.Development.json` để
  OpenIddict chấp nhận HTTP khi dev) + frontend (`npm run dev`) thật, browser thật
  (Chromium qua Playwright) login bằng admin/1q2w3E\*, xác nhận redirect PKCE
  (`code_challenge`/`code_challenge_method=S256` trong URL), tạo Patient, tạo
  Appointment, cập nhật thanh toán (badge đổi màu đúng theo `PaymentStatus`) — tất cả
  chạy qua thật, không lỗi console (trừ 1 lỗi vô hại do React StrictMode double-invoke
  callback effect, đã fix bằng `useRef` guard trong `AuthCallbackPage`).
- **Docker**: viết lại `Dockerfile` cho `Web`/`DbMigrator` thành multi-stage build từ
  source (build context = repo root) — bản cũ chỉ COPY từ `bin/Release/.../publish`
  có sẵn, không tự build được. Thêm `Dockerfile`+`nginx.conf` cho `frontend` (build
  Vite rồi serve static qua nginx, SPA fallback `try_files ... /index.html`).
  `docker-compose.yml`: `postgres` + `db-migrator` (chạy 1 lần, seed xong thì thoát)
  + `backend` + `frontend`.
  **Quyết định quan trọng**: container `backend` chạy **Production** (không phải
  Development) — vì `DentifyWebModule.ConfigureVirtualFileSystem`/
  `AddRazorRuntimeCompilation` có nhánh `if (hostingEnvironment.IsDevelopment())` tự
  `ReplaceEmbeddedByPhysical` sang đường dẫn source tree sibling project (không tồn tại
  trong image đã publish) → crash `DirectoryNotFoundException` khi chạy Development
  trong container. Production dùng embedded resources + precompiled Razor views, đúng
  với 1 image chỉ có output publish. Nhưng Production lại cần file `openiddict.pfx`
  (OpenIddict signing cert) — Dockerfile tự sinh 1 cert placeholder bằng
  `dotnet dev-certs https -ep openiddict.pfx -p <passphrase>` ngay trong build stage
  (giống cách `Dockerfile.local` cũ định làm nhưng chưa hoàn thiện), passphrase mặc
  định khớp với `AuthServer:CertificatePassPhrase` đã có trong `appsettings.json`.
  `AuthServer:RequireHttpsMetadata=false` qua env var để OpenIddict chấp nhận HTTP
  (compose này chưa có TLS — cần reverse proxy + cert thật cho production thật sự).
  **Đã tự build và chạy container thật để verify** (dùng `mcr.microsoft.com/dotnet/*`
  images — pull được trong sandbox; `postgres`/`nginx`/`node` từ Docker Hub **bị chặn
  bởi policy mạng của sandbox này** — không phải lỗi Dockerfile, môi trường thật của
  user sẽ pull bình thường). Container `backend`/`db-migrator` build xong chạy được,
  gọi API/swagger/discovery/Account-Login qua container đều trả đúng.
- Chưa làm (để dành cho lần sau nếu cần): production thật (reverse proxy + TLS thật,
  không dùng cert placeholder), lỗi cosmetic health-check tự ping `0.0.0.0` (background
  job có sẵn từ scaffold, không phải do thay đổi lần này, không ảnh hưởng chức năng).

### 2026-07-05 (1) — Giai đoạn 1 (MVP): Patient + Appointment

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
  Photo upload (IBlobContainer), Prescription chi tiết (PrescriptionItem). Trang React
  tương ứng cũng làm ở `frontend/`, không quay lại Razor.
- Cân nhắc thêm `IsOperator` (bool) trên UserExtension để lọc danh sách bác sĩ trong
  Appointment (hiện đang cho chọn từ toàn bộ Identity Users).
- Production thật cho Docker Compose: reverse proxy + TLS thật + `openiddict.pfx` thật
  thay placeholder tự sinh (xem nhật ký 2026-07-05 (2)).

## Quyết định kỹ thuật

- **DB dùng PostgreSQL** (đổi từ SQLite ngày 2026-07-05). Local dev: chạy Postgres qua
  `docker compose up -d postgres` hoặc cài local, connection string trong
  `ConnectionStrings:Default`. `AbpClockOptions.Kind = Utc` bắt buộc (xem nhật ký).
- **Kiến trúc 2 phần**: backend ABP (AuthServer + API + admin Razor) và frontend React
  (shadcn) tách rời, giao tiếp qua REST + OAuth2 PKCE — không dùng chung process/host.
  UI nghiệp vụ (Patient/Appointment/...) chỉ còn ở React; Razor chỉ giữ cho
  Identity/Permission/Setting/Tenant Management (built-in của ABP) + Account/Login
  (bắt buộc phải có cho PKCE redirect).
- `Patient.Tags`: dùng `List<string>` map qua `HasConversion` (JSON) thành 1 cột TEXT,
  không tách bảng `PatientTag` riêng — đơn giản hơn cho quy mô 1 phòng khám, dễ nâng cấp
  lên bảng riêng sau nếu cần many-to-many thật (vd tag dùng chung style tag-cloud).
- AppService **không dùng `CrudAppService` generic** của ABP — viết tay từng method, gọi
  domain method (`SetTags`, `RecordPayment`,...) để giữ business invariant, chỉ dùng
  Mapperly cho chiều Entity→Dto (dữ liệu phẳng, không có logic).
- Frontend components trong `frontend/src/components/ui/` là code tự viết theo convention
  shadcn (vendor-in-repo), không phải package npm "shadcn" — đúng triết lý gốc của
  shadcn (copy-paste ownership), và tránh phải gọi CLI cần mạng ra ngoài allowlist.
