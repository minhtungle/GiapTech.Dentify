# CLAUDE.md — GiapTech.Dentify

> File này được Claude Code đọc tự động ở mọi máy. Mục tiêu: bất kỳ máy nào, sau khi `git pull`, đều nắm ngay được dự án và cách làm việc.

## Dự án là gì

**GiapTech.Dentify** — ứng dụng quản lý nha khoa, backend xây trên **ABP Framework**, **.NET 10**, kiến trúc **layered monolith + DDD**; frontend là **React (Vite + TypeScript + shadcn/ui)** riêng biệt, gọi backend qua REST API + OAuth2 PKCE.

> Trạng thái hiện tại: xong Giai đoạn 1 (Patient + Appointment); Giai đoạn 2 gần xong
> (Tooth Chart + Photo upload cho Appointment đã xong — còn thiếu Prescription chi tiết).
> Xem `docs/PROGRESS.md` để biết đang làm tới đâu.

## Kiến trúc tổng quan

- **Backend** (`src/GiapTech.Dentify.Web`) đóng 3 vai trò cùng lúc: AuthServer (OpenIddict, hosted login/consent Razor pages của module Account), API host (Application Services tự động expose REST tại `/api/app/...`), và **admin backoffice** (Razor Pages có sẵn của ABP: Identity/Users/Roles, Permission Management, Setting Management, Tenant Management — **giữ nguyên**, không viết lại bằng React).
- **Frontend nghiệp vụ** (`frontend/`) — React + Vite + shadcn/ui, gọi API qua `/api/app/*`, đăng nhập bằng **Authorization Code + PKCE** (redirect sang trang Login do AuthServer host, không tự làm form login). Toàn bộ UI Patient/Appointment/ToothChart... nằm ở đây, KHÔNG còn Razor Pages nghiệp vụ trong `Web`.
- CORS được mở cho origin của frontend qua `App:CorsOrigins` trong appsettings.

## Cấu trúc layer (`src/`)

| Project | Vai trò |
|---------|---------|
| `Domain.Shared` | Hằng số, enum, mã lỗi, localization dùng chung |
| `Domain` | Entities, Aggregate Roots, Domain Services, business rules |
| `Application.Contracts` | DTOs, interface AppService, **Permissions** |
| `Application` | Application Services, object mapping (Mapperly) |
| `EntityFrameworkCore` | `DentifyDbContext`, migrations, EF Core repositories |
| `HttpApi` / `HttpApi.Client` | REST controllers / proxy client |
| `Web` | AuthServer + API host + admin Razor Pages (Identity/Permission/Setting/Tenant) |
| `DbMigrator` | Console app: chạy migration + seed dữ liệu |

`frontend/` — React SPA (nghiệp vụ nha khoa: Patient, Appointment, Tooth Chart...), xem `frontend/README.md`.

Test nằm trong `test/` (Domain.Tests, Application.Tests, EntityFrameworkCore.Tests, Web.Tests...).

## Cấu hình chính

- **Database**: **PostgreSQL**. Connection string `Default` trong `src/GiapTech.Dentify.Web/appsettings.json` và `DbMigrator/appsettings.json`, ví dụ `Host=localhost;Port=5432;Database=Dentify;Username=dentify;Password=dentify`.
  - Local dev: chạy Postgres bằng `docker compose up -d postgres` (xem `docker-compose.yml`), hoặc Postgres cài sẵn trên máy.
  - `AbpClockOptions.Kind = DateTimeKind.Utc` được set cứng trong `DentifyDomainSharedModule` vì Postgres `timestamp with time zone` chỉ nhận UTC — mọi entity tự chuẩn hoá `DateTime` sang UTC trước khi lưu (xem `Patient.SetDateOfBirth`, `Appointment.Reschedule`).
- **URL web (AuthServer/API)**: `https://localhost:44348` (dev có thể chạy HTTP `http://localhost:44348`).
- **Admin mặc định**: `admin@abp.io` / `1q2w3E*` (xem `DentifyConsts`)
- **Prefix bảng**: `App` (vd `AppUsers`, `AppRoles`)
- **Auth**: OpenIddict, **bắt buộc PKCE** cho mọi client (`RequireProofKeyForCodeExchange()` trong `DentifyWebModule`). Client SPA `Dentify_App` được seed trong `OpenIddictDataSeedContributor` với `RedirectUri = {RootUrl}/auth-callback` — cấu hình `RootUrl` (URL của frontend) qua `OpenIddict:Applications:Dentify_App:RootUrl` trong appsettings của `DbMigrator`.
  - Production cần file `openiddict.pfx` (đã ignore).

## Cách chạy (không dùng Docker)

```bash
abp install-libs                                          # cài thư viện client-side cho Razor admin (bắt buộc sau khi clone)
# Cần Postgres đang chạy (xem docker-compose.yml, hoặc cài local) khớp với ConnectionStrings:Default
dotnet run --project src/GiapTech.Dentify.DbMigrator      # tạo/migrate DB + seed data
dotnet run --project src/GiapTech.Dentify.Web             # chạy backend → https://localhost:44348
cd frontend && npm install && npm run dev                 # chạy frontend → http://localhost:5173
```

## Chạy toàn bộ qua Docker

```bash
docker compose up -d --build     # postgres + backend (tự migrate) + frontend
```
Xem chi tiết trong `docker-compose.yml` và `docs/PROGRESS.md`.

## Build & Test

```bash
dotnet build                                              # build toàn solution (GiapTech.Dentify.slnx)
dotnet test                                               # chạy toàn bộ test
```

## Quy trình thêm tính năng mới (chuẩn ABP DDD)

1. **Entity** trong `Domain` (kế thừa `AggregateRoot` / `FullAuditedAggregateRoot`).
2. Thêm `DbSet<>` + cấu hình trong `DentifyDbContext.OnModelCreating`, rồi:
   `dotnet ef migrations add <Tên> --project src/GiapTech.Dentify.EntityFrameworkCore` → chạy `DbMigrator`.
3. **DTOs + interface AppService** trong `Application.Contracts`.
4. **Permissions**: khai báo trong `DentifyPermissions` + đăng ký ở `DentifyPermissionDefinitionProvider`.
5. **AppService** trong `Application` (mapping qua Mapperly trong `DentifyApplicationMappers`).
6. **UI**: nghiệp vụ → trang mới trong `frontend/src/pages` gọi `/api/app/...`; nếu là màn quản trị dùng module có sẵn của ABP thì không cần làm gì thêm ở `Web`.

## Quy ước

- Localization: `Localization/Dentify/*.json` trong `Domain.Shared`.
- Mã lỗi nghiệp vụ: `DentifyDomainErrorCodes`.
- Namespace gốc: `GiapTech.Dentify`.

## Đồng bộ giữa các máy

- Code đồng bộ qua **Git remote** — luôn `git pull` trước khi làm, `git push` sau khi xong.
- Ngữ cảnh/tiến độ công việc ghi trong **`docs/PROGRESS.md`** (commit chung repo).
- Memory cục bộ của Claude (`~/.claude/.../memory`) KHÔNG đi theo git — thông tin dùng chung phải để trong file này hoặc `docs/`.
