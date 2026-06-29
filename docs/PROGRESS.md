# PROGRESS — Nhật ký tiến độ GiapTech.Dentify

> Ghi lại **đang làm gì, tới đâu, quyết định gì**. Cập nhật & commit file này trước khi chuyển máy
> để máy khác `git pull` là nắm được ngay. Mục mới nhất để trên cùng.

## Trạng thái tổng quát

- [x] Khởi tạo solution ABP layered (.NET 10, SQLite) — scaffold template
- [x] Thiết lập Git + tài liệu đồng bộ giữa các máy (CLAUDE.md, PROGRESS.md)
- [ ] Xây dựng domain nghiệp vụ nha khoa (Patient, Appointment, Dentist, Treatment...)
- [ ] Permissions cho các module nghiệp vụ
- [ ] UI quản lý
- [ ] Test

## Nhật ký

### 2026-06-29
- Khởi tạo Git repository, thêm `Dentify.db` và `openiddict.pfx` vào `.gitignore`.
- Tạo `CLAUDE.md` (mô tả dự án + cách chạy/quy ước) và `docs/PROGRESS.md` (file này).
- Xác nhận dự án hiện là scaffold ABP thuần — `DentifyDbContext` mới có module ABP
  (Identity, TenantManagement...), chưa có entity riêng; `DentifyPermissions` để trống.

## TODO / việc đang dở

- (chưa có việc đang dở — điền vào đây trước khi chuyển máy)

## Quyết định kỹ thuật

- DB dùng **SQLite local**, KHÔNG commit file `.db` → mỗi máy tự chạy `DbMigrator` tạo DB.
