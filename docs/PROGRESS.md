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
- [x] Giai đoạn 2 (một phần): Tooth Chart module (SVG interactive) — xong. Photo upload +
      Prescription chi tiết (PrescriptionItem) — CHƯA làm, để dành việc kế tiếp.
- [ ] Giai đoạn 3: LabWork + Expense + Kanban
- [ ] Giai đoạn 4: Import/Export CSV + Backup/Restore + Settings đầy đủ
- [ ] Giai đoạn 5 (tuỳ chọn): AI voice-to-note, AI scan hoá đơn, Patient Portal

## Nhật ký

### 2026-07-06 — Giai đoạn 2 (một phần): Tooth Chart module

Làm trên máy mới (clone từ git, VS Code extension) — môi trường chưa có gì, đã tự cài
.NET 10 SDK (`dotnet-install.sh`), Docker Desktop, `Volo.Abp.Studio.Cli` (`abp install-libs`),
`dotnet-ef`. Gặp 1 trở ngại môi trường: npm cache `~/.npm` bị owner sai (do lần cài trước
dùng `sudo npm`) → dùng `npm install --cache /tmp/npm-cache-dentify` thay vì sửa quyền
(không có sudo non-interactive).

- **Domain**: `ToothChart` (FullAuditedAggregateRoot, 1-1 với Patient) chứa collection
  `ToothRecord` (entity con, `Entity<Guid>`, unique theo `(ToothChartId, ToothNumber)`).
  `ToothRecordHistory` — **cố ý làm aggregate root RIÊNG** (không phải child collection
  của ToothChart) vì đây là log append-only sẽ phình to theo thời gian sống của bệnh nhân;
  nhét vào ToothChart sẽ buộc phải load toàn bộ lịch sử mỗi lần chỉ cần xem trạng thái hiện
  tại. `ToothNumbers` (Domain.Shared): danh sách số răng chuẩn ISO 3950 duy nhất dùng trong
  toàn bộ backend — Palmer/Universal chỉ là hiển thị, KHÔNG lưu, convert ở frontend nếu cần
  sau này (chưa làm, hiện chỉ hiển thị số ISO).
  Răng vĩnh viễn: 11-18/21-28/31-38/41-48 (32 răng). Răng sữa: 51-55/61-65/71-75/81-85
  (20 răng) — chọn bộ nào dựa vào `Patient.IsChildPatient` lúc tạo chart lần đầu.
- **EF Core**: `IToothChartRepository` (custom repo interface ở Domain, implement ở
  EntityFrameworkCore) — **bắt buộc** vì cần `.Include(x => x.Records)` khi load
  (navigation dùng private backing field `_records`, phải `HasField` + generic
  `IRepository<ToothChart,Guid>` mặc định của ABP không hỗ trợ include tuỳ ý; Application
  layer không nên biết `Microsoft.EntityFrameworkCore` trực tiếp). Migration
  `AddToothChart`: 3 bảng `AppToothCharts`, `AppToothRecords`, `AppToothRecordHistories`.
- **Application**: `ToothChartAppService.GetAsync(id)` tạo chart **lazy** nếu bệnh nhân
  chưa có (insert toàn bộ `ToothRecord` Healthy cho đúng bộ răng). `UpdateStatusAsync`
  vừa cập nhật `ToothRecord` (ghi đè) vừa insert 1 `ToothRecordHistory` mới (không ghi đè)
  — 2 aggregate khác nhau nên AppService là nơi điều phối (đúng theo DDD, domain method
  của 1 aggregate không được tự ý ghi vào aggregate khác).
  **Lưu ý route ABP convention**: đặt tên method đúng `GetAsync(Guid id)` (tham số phải
  tên "id") thì ABP mới sinh route `{id}` trong path; nếu tên khác ("patientId") sẽ bị
  đẩy xuống query string dù cùng là action Get. Method custom (`UpdateStatusAsync`,
  `GetHistoryAsync`) thì mọi tham số Guid/int đầu vào tự động thành path segment theo thứ
  tự, không cần đặt tên "id". Ban đầu đặt tên method trùng theo kiểu
  `GetToothChartAsync`/`UpdateToothStatusAsync` khiến route bị lặp đoạn
  (`/tooth-chart/tooth-chart/{patientId}`) — đã đổi lại cho gọn.
  **Bẫy đã gặp**: sau khi thêm permission mới (`Dentify.ToothChart.*`) phải **chạy lại
  DbMigrator** (seed lại `AbpPermissionGrants` cho role admin) RỒI **restart backend**
  (permission checker có cache in-memory, không tự invalidate) — nếu không sẽ bị 403 dù
  code đúng.
- **Frontend**: `ToothChartSvg` component tự vẽ (không dùng thư viện SVG dạng răng có sẵn)
  — 2 hàng (hàm trên/dưới), mỗi răng là `<rect>` bo góc tô màu theo `ToothStatus` + label
  số răng bên dưới, click vào `<g>` mở dialog. `ToothChartPage` (route
  `/patients/:patientId/tooth-chart`, link từ nút icon 🙂 trong bảng Patients): dialog
  đổi status + notes, nút "Xem lịch sử" load on-demand (không tự load history khi mở dialog
  để đỡ 1 request không cần thiết cho thao tác đổi status thông thường).
  Enum wire format giữ đúng convention đã ghi trước đó (response = số, request = string).
- **Test**: `ToothChartAppServiceTests` (6 test: tạo lazy đúng bộ răng theo tuổi, không tạo
  lại lần 2, update + ghi history, nhiều lần đổi status không đè lịch sử cũ, tooth number
  không hợp lệ → BusinessException). Tổng test toàn repo: 16 → 22 (EfCoreTests) + 1
  (WebTests) = 23, tất cả pass.
  **Đã verify UI thật bằng Playwright** (không phải chỉ dotnet test): login → tạo bệnh
  nhân → mở sơ đồ răng → click răng 11 → đổi "Sâu răng" + ghi chú → lưu → răng đổi màu đỏ
  trên SVG + toast đúng → mở lại → xem lịch sử → thấy đúng entry vừa tạo. Không có lỗi
  console.
- Chưa làm (để lại cho lần sau): Photo upload (IBlobContainer) + Prescription chi tiết —
  đây là phần còn lại của Giai đoạn 2 theo kế hoạch gốc. Hiển thị theo Palmer/Universal
  notation ở frontend (hiện chỉ có ISO 3950). Không cho chọn `appointmentId` khi cập nhật
  tình trạng răng từ UI (field có trong API nhưng chưa có chỗ chọn lịch hẹn liên quan trên
  form — cần khi làm tích hợp Appointment ↔ ToothChart).

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

- Giai đoạn 2 (phần còn lại): Photo upload cho Appointment (IBlobContainer), Prescription
  chi tiết (bảng `PrescriptionItem` thay vì text tự do như hiện tại).
- Tooth Chart: hiển thị theo Palmer/Universal notation ở frontend (Setting
  `Clinic.ToothNotationSystem` — hiện chưa có UI Settings, chỉ mới có ISO 3950), cho chọn
  `appointmentId` liên quan khi cập nhật tình trạng răng.
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
- `ToothRecordHistory` là aggregate root độc lập, không phải child collection của
  `ToothChart` — log append-only phình to vô hạn theo thời gian, tách riêng để không phải
  load hết lịch sử mỗi lần chỉ cần xem trạng thái hiện tại (xem nhật ký 2026-07-06).
- Số răng dùng **duy nhất chuẩn ISO 3950** trong toàn bộ backend/API; Palmer/Universal (nếu
  làm) chỉ là convert hiển thị ở frontend, không lưu thêm cột nào — tránh phải đồng bộ 3
  hệ ký hiệu mỗi khi đổi trạng thái răng.
