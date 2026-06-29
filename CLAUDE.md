# CLAUDE.md — GiapTech.Dentify

> File này được Claude Code đọc tự động ở mọi máy. Mục tiêu: bất kỳ máy nào, sau khi `git pull`, đều nắm ngay được dự án và cách làm việc.

## Dự án là gì

**GiapTech.Dentify** — ứng dụng (dự kiến) quản lý nha khoa, xây trên **ABP Framework**, **.NET 10**, kiến trúc **layered monolith + DDD**.

> Trạng thái hiện tại: **mới là scaffold template ABP**, chưa có entity/nghiệp vụ tùy chỉnh. Xem `docs/PROGRESS.md` để biết đang làm tới đâu.

## Cấu trúc layer (`src/`)

| Project | Vai trò |
|---------|---------|
| `Domain.Shared` | Hằng số, enum, mã lỗi, localization dùng chung |
| `Domain` | Entities, Aggregate Roots, Domain Services, business rules |
| `Application.Contracts` | DTOs, interface AppService, **Permissions** |
| `Application` | Application Services, object mapping (Mapperly) |
| `EntityFrameworkCore` | `DentifyDbContext`, migrations, EF Core repositories |
| `HttpApi` / `HttpApi.Client` | REST controllers / proxy client |
| `Web` | UI MVC + Razor Pages, Menu, Toolbar |
| `DbMigrator` | Console app: chạy migration + seed dữ liệu |

Test nằm trong `test/` (Domain.Tests, Application.Tests, EntityFrameworkCore.Tests, Web.Tests...).

## Cấu hình chính

- **Database**: SQLite — file `Dentify.db` ở thư mục gốc. Connection string `Default = Data Source=../../Dentify.db;` (trong `src/GiapTech.Dentify.Web/appsettings.json` và `DbMigrator`).
  - **`Dentify.db` KHÔNG được commit** (đã ignore). Máy mới tạo DB bằng `DbMigrator`.
- **URL web**: `https://localhost:44348`
- **Admin mặc định**: `admin@abp.io` / `1q2w3E*` (xem `DentifyConsts`)
- **Prefix bảng**: `App` (vd `AppUsers`, `AppRoles`)
- **Auth**: OpenIddict (production cần `openiddict.pfx`, đã ignore).

## Cách chạy

```bash
abp install-libs                                          # cài thư viện client-side (bắt buộc sau khi clone)
dotnet run --project src/GiapTech.Dentify.DbMigrator      # tạo/migrate DB + seed data
dotnet run --project src/GiapTech.Dentify.Web             # chạy web → https://localhost:44348
```

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
6. **UI / menu** trong `Web` (`DentifyMenuContributor`).

## Quy ước

- Localization: `Localization/Dentify/*.json` trong `Domain.Shared`.
- Mã lỗi nghiệp vụ: `DentifyDomainErrorCodes`.
- Namespace gốc: `GiapTech.Dentify`.

## Đồng bộ giữa các máy

- Code đồng bộ qua **Git remote** — luôn `git pull` trước khi làm, `git push` sau khi xong.
- Ngữ cảnh/tiến độ công việc ghi trong **`docs/PROGRESS.md`** (commit chung repo).
- Memory cục bộ của Claude (`~/.claude/.../memory`) KHÔNG đi theo git — thông tin dùng chung phải để trong file này hoặc `docs/`.
