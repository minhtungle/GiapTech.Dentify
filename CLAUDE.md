# CLAUDE.md — GiapTech.Dentify

> File này được Claude Code đọc tự động ở mọi máy. Mục tiêu: bất kỳ máy nào, sau khi
> `git pull`, đều nắm ngay được dự án và cách làm việc.

## Dự án là gì

**GiapTech.Dentify** — ứng dụng quản lý nha khoa, backend xây trên **ABP Framework**,
**.NET 10**, kiến trúc **layered monolith + DDD**; frontend là **React (Vite +
TypeScript + shadcn-style)** riêng biệt, gọi backend qua REST API + OAuth2 PKCE.

## Đọc gì trước khi làm việc

Dự án có bộ tài liệu kiến trúc đầy đủ trong **`docs/architecture/`** — đọc trước khi
code bất cứ gì mới, đặc biệt `06-quy-uoc-phat-trien.md` (bài học/quy tắc đã rút ra, tránh
lặp lại lỗi cũ):

| File | Nội dung |
|---|---|
| `01-tong-quan-he-thong.md` | Hệ thống là gì, kiến trúc tổng thể, trạng thái hiện tại, roadmap sắp tới |
| `02-dac-ta-chuc-nang.md` | Từng module: entity, field, business rule, API |
| `03-luong-nghiep-vu.md` | Luồng thao tác người dùng cho từng nghiệp vụ chính |
| `04-kien-truc-ky-thuat.md` | Công nghệ, DI, database schema, cơ chế auth |
| `05-trien-khai-van-hanh.md` | Cài đặt, chạy dev, deploy Docker, backup/restore |
| `06-quy-uoc-phat-trien.md` | Quy trình + quy tắc bắt buộc khi thêm tính năng mới |

**`docs/PROGRESS.md`** là nhật ký theo thời gian (ai làm gì, khi nào, quyết định gì) —
đọc để biết đang làm tới đâu và quyết định nào đã chốt. Khi kiến trúc/chức năng thay đổi
đáng kể, **cập nhật lại file `docs/architecture/*.md` liên quan**, không chỉ ghi vào
PROGRESS.md — 2 loại tài liệu này bổ sung nhau, không thay thế nhau.

## Chạy nhanh

```bash
abp install-libs                                          # 1 lần sau khi clone
docker compose up -d postgres                              # hoặc Postgres cài sẵn
dotnet build src/GiapTech.Dentify.DbMigrator
cd src/GiapTech.Dentify.DbMigrator/bin/Debug/net10.0 && dotnet GiapTech.Dentify.DbMigrator.dll && cd -
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/GiapTech.Dentify.Web   # → https://localhost:44348
cd frontend && npm install && npm run dev                                          # → http://localhost:5173
```

Hoặc toàn bộ qua Docker: `docker compose up -d --build`. Admin mặc định: `admin@abp.io`
/ `1q2w3E*`. Chi tiết đầy đủ + các lỗi thường gặp: `docs/architecture/05-trien-khai-van-hanh.md`.

```bash
dotnet build GiapTech.Dentify.slnx && dotnet test GiapTech.Dentify.slnx   # backend
cd frontend && npm run build && npx oxlint                                # frontend
```

## Đồng bộ giữa các máy

- Code qua **Git remote** — `git pull` trước khi làm, `git push` sau khi xong (khi được
  yêu cầu, không tự commit/push nếu không được yêu cầu rõ).
- Memory cục bộ của Claude (`~/.claude/.../memory`) **không đi theo git** — thông tin
  dùng chung phải nằm trong file này, `docs/PROGRESS.md`, hoặc `docs/architecture/`.
