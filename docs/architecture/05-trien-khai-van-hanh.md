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

## Deploy lên VPS (Ubuntu + Caddy + domain thật)

Áp dụng khi VPS đã cài sẵn Docker + Docker Compose và có domain riêng trỏ vào. Không đổi
code — dùng đúng `docker-compose.yml` hiện tại (backend/frontend vẫn tự phục vụ HTTP nội
bộ trong Docker network), chỉ thêm **Caddy chạy trên host** làm reverse proxy nhận HTTPS
thật từ domain rồi forward vào 2 container. Cách này khớp đúng mục "Reverse proxy + TLS
thật trước `backend`" trong checklist ở trên — không cần sửa Dockerfile/appsettings.

### 1. Trỏ DNS

Tạo 2 bản ghi `A` trỏ về IP VPS (subdomain tuỳ chọn, ví dụ):
```
app.yourdomain.com  → <IP VPS>     # frontend (SPA nhân viên + Patient Portal /portal)
api.yourdomain.com  → <IP VPS>     # backend (AuthServer + API)
```
Đợi DNS propagate (`dig app.yourdomain.com` trả đúng IP) trước khi xin chứng chỉ ở bước 4
— Let's Encrypt xác thực domain qua DNS thật, chưa trỏ xong sẽ xin cert thất bại.

### 2. Clone code + cấu hình `.env`

```bash
git clone <repo-url> GiapTech.Dentify && cd GiapTech.Dentify
cp .env.example .env
```
Sửa `.env`:
```
POSTGRES_DB=Dentify
POSTGRES_USER=dentify
POSTGRES_PASSWORD=<mật khẩu mạnh, KHÔNG dùng giá trị mặc định "dentify">
SELF_URL=https://api.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
```
`SELF_URL`/`CLIENT_URL` là domain **thật có HTTPS** dù bản thân container vẫn nghe HTTP
nội bộ — 2 giá trị này được bake vào token OIDC (`issuer`, redirect URI) và vào bundle
frontend lúc build (`VITE_API_URL`/`VITE_AUTHORITY`), phải khớp đúng domain người dùng gõ
trên trình duyệt.

### 3. Build & khởi động stack

```bash
docker compose up -d --build
```
Xác nhận `db-migrator` chạy xong (`docker compose logs db-migrator` thấy "Successfully
completed all database migrations") **và** kiểm tra thật qua `docker exec` vào Postgres
thay vì chỉ tin exit code — xem gotcha "Docker exit code không đáng tin cậy" đã ghi nhận
trong dự án (container cũ có thể vẫn "Running" dù build/migrate mới thực sự lỗi mạng).
Không mở port `5432`/`44348`/`5173` ra internet ở bước này — firewall (bước 6) sẽ chỉ mở
80/443, mọi truy cập backend/frontend đi qua Caddy.

### 4. Cài Caddy + cấu hình reverse proxy + TLS tự động

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Ghi đè `/etc/caddy/Caddyfile`:
```caddyfile
app.yourdomain.com {
    reverse_proxy localhost:5173
}

api.yourdomain.com {
    reverse_proxy localhost:44348
}
```
Áp dụng:
```bash
sudo systemctl reload caddy
```
Caddy tự xin + gia hạn chứng chỉ Let's Encrypt cho cả 2 domain (yêu cầu DNS đã trỏ đúng
và cổng 80/443 mở ra internet để xác thực ACME HTTP-01) — không cần certbot/cron thủ công.

### 5. Bật lại xác thực HTTPS metadata cho OpenIddict

Cấu hình mặc định trong `docker-compose.yml` đặt
`AuthServer__RequireHttpsMetadata: "false"` để token phát được qua HTTP nội bộ trong
compose stack lúc dev. Khi đã có Caddy phát HTTPS thật trước backend, đổi giá trị này
sang `"true"` trong `docker-compose.yml` rồi `docker compose up -d backend` lại — token
OIDC giờ chỉ được chấp nhận nếu tới qua kênh HTTPS thật (Caddy), không phải request HTTP
trần đi thẳng vào container.

### 6. Firewall

Chỉ mở 80 (ACME challenge + redirect) và 443 (HTTPS) ra internet; đóng các port container
(`5432`, `44348`, `5173`) — Caddy trên host là điểm vào duy nhất:
```bash
sudo ufw allow 22/tcp     # SSH — làm trước, kẻo tự khoá mình ra ngoài
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
Nếu VPS host bằng nhà cung cấp có security group riêng (AWS/GCP/Vultr/DigitalOcean...),
cấu hình tương tự ở security group thay vì chỉ `ufw` cục bộ.

### 7. Các mục còn lại trong checklist "trước khi deploy production thật"

Sau bước 1–6, tiếp tục áp dụng đầy đủ các mục 1, 4, 6, 7, 8 trong checklist ở trên (mục 2,
3, 5 coi như đã làm ở bước 3–5): certificate signing/encryption OpenIddict thật (mục 1),
SMTP thật (mục 4), **đổi mật khẩu admin mặc định ngay** (mục 6 — làm sớm nhất, trước khi
để bất kỳ ai khác biết domain), cron backup định kỳ (mục 7), review CORS origins đã khớp
domain thật hay chưa (mục 8 — `App:CorsOrigins` đọc từ `App__CorsOrigins` env, đã tự khớp
`CLIENT_URL` qua bước 2 ở trên nên thường không cần sửa thêm).

**Patient Portal**: OIDC client `Dentify_PatientPortal` được seed với
`RootUrl=${CLIENT_URL}/portal` (đã thêm override trong `docker-compose.yml` —trước đó
biến này bị thiếu, chỉ `Dentify_App`/`Dentify_Swagger` được override nên Patient Portal
sẽ seed nhầm `localhost` nếu deploy trước khi có bản sửa này). Nếu đổi `CLIENT_URL` sau
lần seed đầu, phải chạy lại `db-migrator`
(`docker compose up -d --build db-migrator && docker compose up -d db-migrator`) để
`OpenIddictDataSeedContributor` cập nhật lại redirect URI cho cả 3 client.

### Cập nhật code sau này (redeploy)

```bash
git pull
docker compose build backend frontend db-migrator   # rebuild CẢ 3 image nếu có đổi
                                                       # migration/schema — build thiếu
                                                       # db-migrator sẽ chạy migration cũ,
                                                       # xem gotcha đã gặp ở PROGRESS.md
docker compose up -d
```

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
docker compose up -d postgres          # bắt buộc trước khi test — xem lưu ý dưới
dotnet build GiapTech.Dentify.slnx     # build toàn solution
dotnet test GiapTech.Dentify.slnx      # dữ liệu nghiệp vụ vẫn SQLite in-memory, nhưng
                                        # Distributed Locking cần Postgres thật (xem dưới)

cd frontend
npm run build                          # tsc -b && vite build — type-check trước khi build production
npx oxlint                             # lint
```

`dotnet test` **không còn hoàn toàn tự chứa**: từ khi thêm Distributed Locking
(`IAbpDistributedLock`, đăng ký trong `DentifyApplicationModule.ConfigureServices`),
`PostgresDistributedSynchronizationProvider` cần kết nối được Postgres thật qua
`ConnectionStrings:Default` (đọc từ `test/GiapTech.Dentify.TestBase/appsettings.json`) —
không cần schema `Dentify` đúng, chỉ cần connect được (advisory lock không đụng bảng
nào). Thiếu Postgres → toàn bộ test suite fail ngay lúc khởi động module, không phải lỗi
1 test case cụ thể. Chi tiết: `04-kien-truc-ky-thuat.md` mục "Distributed Locking".

Không có script `npm test` — frontend không có test tự động (xem
`04-kien-truc-ky-thuat.md` mục Testing).

## CI/CD

Chưa có (`.github/workflows/` không tồn tại). Build/test/deploy hiện tại đều chạy tay
theo hướng dẫn trên.

## Health check

Backend expose `/health-status` (cấu hình `App:HealthCheckUrl` trong `appsettings.json`)
và `/health-ui`. Dùng để kiểm tra backend đã sẵn sàng nhận request sau khi start.
