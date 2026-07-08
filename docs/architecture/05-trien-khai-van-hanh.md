# 05 — Triển khai & vận hành

> Cách cài đặt máy mới, chạy dev, deploy qua Docker, backup/restore. Xem `CLAUDE.md` ở
> gốc repo cho bản tóm tắt ngắn — file này đi sâu hơn vào lý do và chi tiết cấu hình.

## Yêu cầu môi trường

| Thành phần | Phiên bản |
|---|---|
| .NET SDK | **10.0** (không có `global.json`, xác nhận qua `TargetFramework` trong `.csproj`) |
| Node.js | Dockerfile build bằng `node:22-alpine`; README ghi "v18 or 20" — **README có thể lỗi thời so với Dockerfile thực tế**, ưu tiên theo Dockerfile (Node 22) khi có mâu thuẫn |
| PostgreSQL | 16 (image `postgres:16-alpine` trong compose) |
| Docker | cần cho cách chạy qua compose; không bắt buộc nếu chạy thủ công |

Nếu máy chỉ có SDK .NET cũ hơn 10 (ví dụ máy CI/agent dùng chung), `dotnet build` trên
`.slnx` sẽ lỗi `MSB4068`. Cài .NET 10 SDK vào thư mục riêng của user nếu không có quyền
ghi vào global location:
```bash
curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 10.0 --install-dir "$HOME/.dotnet10"
export PATH="$HOME/.dotnet10:$PATH"
export DOTNET_ROOT="$HOME/.dotnet10"
```
Thêm 2 dòng `export` vào `~/.zshrc` để không phải lặp lại mỗi session mới.

## Cách 1 — Chạy thủ công (dev, không Docker)

```bash
abp install-libs                                          # thư viện client-side cho Razor admin, bắt buộc sau khi clone
docker compose up -d postgres                              # hoặc dùng Postgres cài sẵn khớp ConnectionStrings:Default

dotnet build GiapTech.Dentify.slnx                          # build trước để bắt lỗi sớm

# Migrate + seed — LUÔN build trước rồi chạy .dll trực tiếp, KHÔNG dùng
# `dotnet run --project` cho DbMigrator (xem mục Gotcha dưới đây)
dotnet build src/GiapTech.Dentify.DbMigrator
cd src/GiapTech.Dentify.DbMigrator/bin/Debug/net10.0 && dotnet GiapTech.Dentify.DbMigrator.dll
cd -

# Chạy backend — dùng `dotnet run` (không chạy .dll trực tiếp) để nạp đúng
# appsettings.Development.json + dev certificate
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/GiapTech.Dentify.Web

# Terminal khác — frontend
cd frontend && npm install && npm run dev
```

Backend nghe ở `https://localhost:44348` (hoặc `http://` nếu chỉnh
`ASPNETCORE_URLS`/launchSettings). Frontend ở `http://localhost:5173`. Đăng nhập mặc định
`admin@abp.io` / `1q2w3E*`.

### Gotcha đã gặp nhiều lần — ghi nhớ khi setup máy mới

1. **DbMigrator chạy qua `dotnet run --project` từ repo root đôi khi báo lỗi runtime
   `ConnectionString property has not been initialized`** dù `appsettings.json` đúng và
   design-time (`dotnet ef migrations add`) chạy bình thường. Nguyên nhân chưa xác định
   rõ (nghi liên quan CWD khi `dotnet run --project` build+run trong cùng lời gọi). **Cách
   né chắc chắn**: build trước rồi chạy trực tiếp
   `dotnet <path>/GiapTech.Dentify.DbMigrator/bin/Debug/net10.0/GiapTech.Dentify.DbMigrator.dll`
   từ đúng thư mục bin.
2. **Backend cần `ASPNETCORE_ENVIRONMENT=Development`** khi chạy `dotnet run` để nạp
   `appsettings.Development.json` (tắt `RequireHttpsMetadata`, hạ log level) và tự tạo
   dev signing certificate — nếu chạy trực tiếp `.dll` publish output (Production mặc
   định) mà thiếu `openiddict.pfx`, backend crash ngay lúc start với
   `FileNotFoundException: Signing Certificate couldn't found: openiddict.pfx`.
3. **Frontend treo màn hình "Đang xác thực..." vô hạn** thường do `.env` trỏ sai scheme
   (`http://` khi backend chỉ chạy `https://`, hoặc ngược lại) — kiểm tra `VITE_API_URL`/
   `VITE_AUTHORITY` khớp đúng scheme backend đang chạy, và chạy
   `dotnet dev-certs https --trust` để máy tin cậy chứng chỉ dev nếu dùng HTTPS local.
4. **Thêm permission mới phải chạy lại DbMigrator VÀ restart backend** — permission
   checker có cache in-memory, không tự invalidate khi seed permission mới vào DB.
5. **File rác trùng lặp do VS Code auto-save** (dạng `Tên 2.cs`, `Tên 2.json`) — luôn
   `diff` để xác nhận là bản cũ y hệt trước khi xoá, không xoá mù.

## Cách 2 — Chạy toàn bộ qua Docker Compose

```bash
docker compose up -d --build
```

Thứ tự khởi động (định nghĩa qua `depends_on` + healthcheck):
```
postgres (chờ healthy, pg_isready)
  → db-migrator (chạy 1 lần, migrate + seed, rồi exit)
    → backend (chờ db-migrator completed_successfully)
      → frontend (chờ backend start, không chờ healthy)
```

| Service | Port host:container | Ghi chú |
|---|---|---|
| `postgres` | `5432:5432` | volume `postgres-data` (persistent) |
| `db-migrator` | không expose | chạy 1 lần rồi exit, không phải long-running service |
| `backend` | `44348:8080` | `ASPNETCORE_ENVIRONMENT=Production` mặc định trong image, `AuthServer:RequireHttpsMetadata=false` để phát token qua HTTP nội bộ trong compose stack |
| `frontend` | `5173:80` | build `VITE_*` bake tại **build time** (không đổi được sau khi build — phải rebuild image nếu đổi API URL) |

Biến môi trường override qua file `.env` ở root (copy từ `.env.example`):
```
POSTGRES_DB=Dentify
POSTGRES_USER=dentify
POSTGRES_PASSWORD=dentify
SELF_URL=http://localhost:44348
CLIENT_URL=http://localhost:5173
```

**Cảnh báo production thật**: cấu hình compose hiện tại (`RequireHttpsMetadata=false`,
cert placeholder tự tạo bằng `dotnet dev-certs https` trong Dockerfile) chỉ phù hợp môi
trường nội bộ/demo. Xem checklist đầy đủ ở mục "Checklist trước khi deploy production
thật" bên dưới trước khi expose ra internet.

## Checklist trước khi deploy production thật

Cấu hình mặc định trong repo (Docker Compose, migration, seed data) được thiết kế để
chạy **được ngay** cho demo/nội bộ, không phải để expose thẳng ra internet. Trước khi
deploy thật cho 1 phòng khám dùng thật, tự thực hiện từng mục sau — không mục nào tự
động hoá được vì đều cần thông tin cụ thể (domain thật, nhà cung cấp hạ tầng) chỉ người
vận hành mới biết:

1. **Certificate signing/encryption OpenIddict thật** — thay `openiddict.pfx` placeholder
   (tự sinh bằng `dotnet dev-certs https` trong `Dockerfile`, xem mục Dockerfile bên
   dưới) bằng certificate thật (mua CA hoặc tự ký nội bộ tuỳ chính sách bảo mật), đặt
   đúng `AuthServer:CertificatePassPhrase` trong `appsettings.secrets.json`/biến môi
   trường compose — **không commit passphrase thật vào git**.
2. **Reverse proxy + TLS thật trước `backend`** — Nginx/Caddy/Traefik/Cloudflare Tunnel
   đứng trước container `backend`, cấp domain thật + chứng chỉ TLS thật (Let's Encrypt
   hoặc CA khác). Container `frontend`/`backend` hiện tại tự phục vụ HTTP nội bộ trong
   compose network, không tự có TLS.
3. **Đổi `AuthServer:RequireHttpsMetadata=true`** trong cấu hình production sau khi có
   reverse proxy TLS thật — cấu hình `false` hiện tại chỉ chấp nhận được vì cả stack chạy
   nội bộ qua HTTP trong cùng Docker network, **không an toàn nếu expose thẳng ra
   internet không qua reverse proxy kiểm soát** (xem thêm mục "Cơ chế Auth chi tiết" ở
   `04-kien-truc-ky-thuat.md`).
4. **Điền SMTP thật vào `appsettings.secrets.json`** (`Settings:Abp.Mailing.Smtp.*`,
   xem `04-kien-truc-ky-thuat.md` mục "Email & Background Worker") — nếu để trống,
   `AppointmentReminderWorker` vẫn chạy nhưng không gửi được email thật (tự fallback
   `NullEmailSender`, không crash, chỉ không có tác dụng).
5. **Đổi `RootUrl` của cả 2 OIDC client** (`Dentify_App`, `Dentify_PatientPortal`) trong
   `appsettings.json` của `DbMigrator` sang domain thật trước khi chạy migration/seed lần
   đầu trên production — client được seed 1 lần bởi `OpenIddictDataSeedContributor`, đổi
   domain sau này cần chạy lại DbMigrator để `CreateOrUpdateApplicationAsync` cập nhật
   redirect URI.
6. **Đổi mật khẩu admin mặc định** (`admin@abp.io` / `1q2w3E*`) ngay sau lần deploy đầu
   tiên — đây là tài khoản seed sẵn dùng cho demo/dev, không phải tài khoản vận hành thật.
7. **Backup định kỳ** — script `backup-db.sh` có sẵn (xem mục "Backup / Restore database")
   nhưng không tự chạy theo lịch; tự thêm cron job/scheduled task gọi script này định kỳ
   trên máy chủ thật, không chỉ chạy tay khi nhớ ra.
8. **Review CORS origins** (`App:CorsOrigins` trong `appsettings.json`) — giá trị mặc định
   trỏ tới `localhost`, phải đổi thành domain thật của cả 2 frontend (SPA nhân viên +
   Patient Portal) khi deploy.

## Dockerfile — tóm tắt multi-stage

- **Backend** (`src/GiapTech.Dentify.Web/Dockerfile`, build context = root repo):
  `dotnet/sdk:10.0` (restore + publish) → `dotnet/aspnet:10.0` (runtime, chỉ copy output
  publish). Có bước tạo `openiddict.pfx` placeholder bằng `dotnet dev-certs https` ngay
  trong build stage — **không phải cert production thật**, phải thay khi deploy thật.
- **DbMigrator** (`src/GiapTech.Dentify.DbMigrator/Dockerfile`): multi-stage tương tự,
  không expose port, entrypoint chạy migration + seed rồi tự exit.
- **Frontend** (`frontend/Dockerfile`, build context = `./frontend`): `node:22-alpine`
  (`npm ci` + `npm run build`, nhận `VITE_*` qua build ARG) → `nginx:1.27-alpine` (chỉ
  serve static `dist/` + `nginx.conf` tự viết, SPA fallback `try_files ... /index.html`).
  Không có proxy API/gzip/cache header trong `nginx.conf` — frontend container chỉ serve
  static, gọi API trực tiếp tới backend qua CORS.

## Backup / Restore database

```bash
./scripts/backup-db.sh [output-file]      # mặc định: backup-YYYYMMDD-HHMMSS.dump
./scripts/restore-db.sh <backup-file>     # CẢNH BÁO: xoá và tạo lại toàn bộ dữ liệu
```

Cả 2 script tự phát hiện container Postgres đang chạy (`docker ps --filter name=postgres`)
và dump/restore qua `docker exec`; nếu không có container nào chạy thì fallback dùng
`pg_dump`/`pg_restore` local (giả định Postgres nghe ở `localhost:5432`). `restore-db.sh`
có prompt xác nhận `[y/N]` trước khi ghi đè — không bỏ qua bằng cờ `--force` nào, luôn
cần tương tác tay.

Sau khi restore, cần tự restart backend/DbMigrator (script chỉ nhắc, không tự làm).

## Build & Test

```bash
dotnet build GiapTech.Dentify.slnx     # build toàn solution
dotnet test GiapTech.Dentify.slnx      # test — chạy hoàn toàn in-memory (SQLite), không cần Postgres/Docker

cd frontend
npm run build                          # tsc -b && vite build — type-check trước khi build production
npx oxlint                             # lint
```

Không có script `npm test` — frontend không có test tự động (xem
`04-kien-truc-ky-thuat.md` mục Testing).

## CI/CD

Chưa có (`.github/workflows/` không tồn tại). Build/test/deploy hiện tại đều chạy tay
theo hướng dẫn trên.

## Health check

Backend expose `/health-status` (cấu hình `App:HealthCheckUrl` trong `appsettings.json`)
và `/health-ui`. Dùng để kiểm tra backend đã sẵn sàng nhận request sau khi start.
