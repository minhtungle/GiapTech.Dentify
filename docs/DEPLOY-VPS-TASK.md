# Nhiệm vụ: Triển khai GiapTech.Dentify lên VPS này

## Bối cảnh đã biết (từ phiên làm việc trước với Claude Code trên máy dev)

- Domain: **`dentify.io.vn`** (đã quản lý DNS sẵn).
  - Frontend: `nhakhoamanhtien.dentify.io.vn`
  - Backend (API/AuthServer): `api.dentify.io.vn` — dùng chung cho các phòng khám khác
    sau này nếu có, không gắn tên phòng khám cụ thể vào domain API.
- VPS này **đang chạy nhiều dịch vụ khác** — đã phát hiện:
  - `n8n` (container Docker, port nội bộ `127.0.0.1:5678`).
  - **Nginx** cài trên host, đang `active (running)`, chiếm sẵn port 80/443.
  - Một container cũ tên `dentify-api` (port `5050:8080`) — **là bản deploy thử trước
    đó của chính dự án này, KHÔNG có dữ liệu thật, được xác nhận an toàn để xoá sạch**
    trước khi triển khai lại từ đầu.
- Docker Engine đã có sẵn (bản 29.1.3) nhưng **Docker Compose plugin v2 (`docker compose`,
  không gạch ngang) chưa cài** — máy chỉ có `docker-compose` v1.29.2 (bản cũ, EOL). Cần
  cài `docker-compose-plugin` trước khi dùng lệnh `docker compose ...` trong toàn bộ
  hướng dẫn dưới đây.
- Vì Nginx đã chiếm port 80/443 sẵn cho các site khác, **quyết định dùng Nginx có sẵn làm
  reverse proxy** (không cài Caddy song song — tránh xung đột port 443).
- Mật khẩu Postgres đã tạo sẵn cho lần deploy này:
  `4fOEAawoR7s2VJ3QptZ2sDDa68VHx08F` (lưu vào password manager sau khi dùng xong).

## Việc cần làm — theo đúng thứ tự

### 0. Rà soát trước khi đụng vào bất cứ thứ gì

```bash
docker ps -a
docker volume ls
sudo ss -tlnp | grep -E ':80|:443'
```
Xác nhận: chỉ có `n8n` + `dentify-api` (container cũ) + có thể vài site Nginx khác.
**Không đụng tới bất kỳ container/site nào ngoài phạm vi Dentify** (đặc biệt không đụng
`n8n`).

### 1. Dọn container/image cũ của lần deploy thử trước

```bash
docker stop dentify-api
docker rm dentify-api
```
Nếu có thêm container/volume Postgres cũ riêng của lần thử trước (không phải của
`docker-compose.yml` chuẩn trong repo — tên khác `giaptechdentify-postgres-1`), xoá luôn
sau khi xác nhận qua `docker ps -a`/`docker volume ls` ở bước 0 rằng nó không chứa dữ
liệu cần giữ (đã xác nhận với người dùng: bản cũ chỉ là thử nghiệm, xoá sạch được).

### 2. Cài Docker Compose v2 plugin (nếu `docker compose version` báo lỗi)

```bash
docker compose version   # kiểm tra trước
```
Nếu báo `unknown command`, cài:
```bash
sudo apt update
sudo apt install -y docker-compose-plugin
docker compose version   # phải ra "Docker Compose version v2.x.x"
```
Nếu `apt install` báo không tìm thấy gói, thêm repo Docker chính thức trước:
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-compose-plugin
docker compose version
```

### 3. Trỏ DNS (nếu chưa làm)

```
nhakhoamanhtien.dentify.io.vn → <IP VPS>
api.dentify.io.vn             → <IP VPS>
```
Xác nhận:
```bash
dig +short nhakhoamanhtien.dentify.io.vn
dig +short api.dentify.io.vn
```

### 4. Clone code (nếu chưa có) + cấu hình `.env`

Nếu thư mục `~/GiapTech.Dentify` đã tồn tại (từ lần thử trước), `cd` vào và `git pull`
thay vì clone lại:
```bash
cd ~/GiapTech.Dentify && git pull
# hoặc: git clone <repo-url> ~/GiapTech.Dentify && cd ~/GiapTech.Dentify
cp .env.example .env
```
Sửa `.env` thành:
```
POSTGRES_DB=Dentify
POSTGRES_USER=dentify
POSTGRES_PASSWORD=4fOEAawoR7s2VJ3QptZ2sDDa68VHx08F
SELF_URL=https://api.dentify.io.vn
CLIENT_URL=https://nhakhoamanhtien.dentify.io.vn
```

### 5. Build & khởi động stack Docker

```bash
docker compose up -d --build
```
**Không dùng exit code để tin "thành công"** — xác nhận thật:
```bash
docker compose logs db-migrator
docker exec -it giaptechdentify-postgres-1 psql -U dentify -d Dentify -c "\dt" | head -20
docker exec -it giaptechdentify-postgres-1 psql -U dentify -d Dentify -c "SELECT \"Category\", COUNT(*) FROM \"AppMedicalTerms\" GROUP BY \"Category\";"
```
Kết quả `AppMedicalTerms` phải ra 3 dòng: Category 0 = 10, Category 1 = 12, Category 2 = 3
(danh mục y khoa mẫu — xác nhận migration/seed chạy đúng).

Container không được expose thẳng port ra internet ở bước này (`5432`/`44348`/`5173`
chỉ bind nội bộ hoặc `127.0.0.1`, không cần mở firewall cho các port này) — mọi truy cập
từ internet đi qua Nginx ở bước 6.

### 6. Cấu hình Nginx (site có sẵn) làm reverse proxy + certbot xin SSL thật

Tạo 2 file site mới, không sửa đè cấu hình site khác đang có (vd n8n):

```bash
sudo tee /etc/nginx/sites-available/nhakhoamanhtien.dentify.io.vn > /dev/null << 'EOF'
server {
    listen 80;
    server_name nhakhoamanhtien.dentify.io.vn;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo tee /etc/nginx/sites-available/api.dentify.io.vn > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.dentify.io.vn;

    location / {
        proxy_pass http://localhost:44348;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/nhakhoamanhtien.dentify.io.vn /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.dentify.io.vn /etc/nginx/sites-enabled/

sudo nginx -t   # kiểm tra cú pháp trước khi reload
sudo systemctl reload nginx
```

Cài certbot xin SSL thật cho cả 2 domain (certbot tự sửa lại file Nginx thêm block 443 +
tự set up cron gia hạn):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nhakhoamanhtien.dentify.io.vn -d api.dentify.io.vn
```
Làm theo prompt (nhập email, đồng ý ToS, chọn redirect HTTP→HTTPS khi được hỏi — nên
chọn có redirect).

### 7. Bật xác thực HTTPS metadata thật cho OpenIddict

Sau khi bước 6 xác nhận cả 2 domain đã có HTTPS thật hoạt động, sửa `docker-compose.yml`
trong `~/GiapTech.Dentify`, service `backend`, đổi:
```yaml
AuthServer__RequireHttpsMetadata: "true"
```
Áp dụng:
```bash
cd ~/GiapTech.Dentify
docker compose up -d backend
```

### 8. Firewall

Chỉ mở 22 (SSH)/80/443 nếu chưa mở (không đụng cấu hình firewall đã có cho các dịch vụ
khác nếu VPS đã dùng `ufw` từ trước — chỉ thêm rule, không reset):
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status   # xác nhận rule đã thêm, KHÔNG chạy `ufw enable` nếu ufw đã active sẵn
                  # (tránh reset rule cũ đang bảo vệ n8n/site khác)
```

### 9. Verify cuối cùng

```bash
curl -I https://nhakhoamanhtien.dentify.io.vn
curl -I https://api.dentify.io.vn/api/abp/application-configuration
```
Cả 2 phải trả `HTTP/2 200` với chứng chỉ hợp lệ (không còn lỗi "no alternative certificate
subject name matches" như lần thử Caddy trước).

Mở trình duyệt vào `https://nhakhoamanhtien.dentify.io.vn`, đăng nhập:
```
admin@abp.io / 1q2w3E*
```
**Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu thành công** — đây là tài khoản demo
seed sẵn, ai đọc mã nguồn cũng biết được.

### 10. Việc còn lại sau khi lên xong (không bắt buộc ngay lập tức nhưng nên làm sớm)

- Điền SMTP thật vào `appsettings.secrets.json` nếu cần gửi email nhắc hẹn (không có thì
  hệ thống vẫn chạy bình thường, chỉ không gửi được email thật).
- Thêm cron chạy `scripts/backup-db.sh` định kỳ (script có sẵn trong repo, không tự chạy
  theo lịch).
- Review lại `App__CorsOrigins` trong `docker-compose.yml` đã khớp đúng
  `https://nhakhoamanhtien.dentify.io.vn` chưa (đã tự khớp qua biến `CLIENT_URL` ở bước 4,
  thường không cần sửa thêm).

## Dữ liệu mặc định đã xác nhận tự động có sau bước 5 (không cần thao tác gì thêm)

- Tài khoản admin full quyền (`admin@abp.io` / `1q2w3E*`).
- 4 role phân quyền: Doctor, Receptionist, Accountant, Patient (kèm permission tương ứng).
- 3 OpenIddict client: `Dentify_App`, `Dentify_PatientPortal`, `Dentify_Swagger`.
- Danh mục y khoa mẫu: 10 Dị ứng + 12 Bệnh nền + 3 Tags (bảng `AppMedicalTerms`).

**KHÔNG tự động có** — cần nhập tay sau khi lên xong: Bác sĩ/Dịch vụ/Thuốc/Ghế nha khoa
mẫu, cấu hình phòng khám (`ClinicSettings` — tên, logo, địa chỉ).

## Việc tuyệt đối không làm

- Không xoá/sửa cấu hình Nginx của các site khác đang chạy trên VPS (đặc biệt liên quan
  `n8n`).
- Không chạy `sudo ufw enable` nếu `ufw` đã `active` sẵn — chỉ thêm rule mới bằng `allow`.
- Không cài Caddy (đã thử và revert vì xung đột port 443 với Nginx có sẵn).
- Không dùng `docker-compose` (gạch ngang, v1) — luôn dùng `docker compose` (cách nhau,
  v2) sau khi đã cài plugin ở bước 2.
