# 03 — Luồng nghiệp vụ

> Góc nhìn theo thao tác của người dùng thay vì theo module. Dùng file này để hiểu "khi
> nhân viên làm X, hệ thống chạy qua những bước nào" — hữu ích khi debug hoặc khi thêm
> tính năng cần chèn vào giữa 1 luồng có sẵn. Chi tiết field/API xem `02-dac-ta-chuc-nang.md`.

## Đăng nhập (OAuth2 Authorization Code + PKCE)

```
1. Người dùng mở SPA (http://localhost:5173) → chưa có session
2. ProtectedRoute phát hiện !user → tự gọi signIn() → redirect toàn trang
   sang AuthServer (https://localhost:44348/Account/Login)
3. Nhập tài khoản trên trang Login do chính AuthServer host (Razor Pages
   có sẵn của ABP — SPA KHÔNG tự vẽ form login)
4. AuthServer redirect về {CLIENT_URL}/auth-callback?code=...
5. AuthCallbackPage gọi userManager.signinRedirectCallback()
   → exchange code (kèm PKCE verifier) lấy access_token
   → lưu vào localStorage
   → navigate("/patients", { replace: true })
6. Các request sau đó tự đính Authorization: Bearer <token>
```

Không có role/claim nào được kiểm tra ở tầng route — `ProtectedRoute` chỉ hỏi "đã đăng
nhập chưa", mọi nhân viên đăng nhập được đều thấy toàn bộ menu (phân quyền thật diễn ra
ở tầng API qua `[Authorize(DentifyPermissions.X)]`, ẩn/hiện nút bấm theo permission
**chưa được làm ở frontend** — nút bấm luôn hiện, chỉ API chặn nếu thiếu quyền).

## Tạo lịch hẹn mới cho bệnh nhân

```
1. Vào /appointments → nút "Thêm lịch hẹn"
2. Dialog mở, mặc định chọn patients[0] trong danh sách đã tải sẵn
3. Chọn bệnh nhân khác trong Select
   → tra ngay trong state `patients` đã có: nếu bệnh nhân có allergies/
     medicalConditions → hiện badge cảnh báo NGAY dưới Select (không gọi
     API — dữ liệu đã có trong list)
   → gọi lười patientsApi.getDetail(patientId) → nếu noShowCount > 0
     → hiện dòng cảnh báo đỏ "đã không đến N lần trước đó"
4. Nhập giờ hẹn, loại điều trị (TreatmentType), giá dịch vụ (nhập tay,
   KHÔNG gợi ý theo loại điều trị vì chưa có bảng giá — xem Đợt 2 roadmap)
5. (Tuỳ chọn) thêm dòng đơn thuốc — mỗi dòng có key tạm phía client
   (temp-N) cho tới khi lưu
6. Submit → appointmentsApi.create() → Status mặc định Scheduled,
   PaymentStatus mặc định Unpaid
```

## Sửa lịch hẹn đã có

```
1. Bấm icon Sửa trên 1 dòng trong bảng (hoặc click event trên Calendar)
2. QUAN TRỌNG: object trong bảng/calendar là từ GetListAsync/
   GetCalendarViewAsync — KHÔNG có prescriptionItems đầy đủ (tránh join
   thừa cho view danh sách). Trước khi mở form phải gọi lại
   appointmentsApi.get(id) (dùng GetWithDetailsAsync ở backend) để lấy
   đủ dữ liệu, nếu không đơn thuốc hiện có sẽ bị xoá mất khi lưu lại
   → đây là bug thật đã từng xảy ra và được fix, xem docs/PROGRESS.md
     mục Giai đoạn 2 (3) — không lặp lại lỗi này khi thêm entity con mới
3. Sửa field cần thiết → submit → appointmentsApi.update()
```

## Kéo-thả đổi giờ lịch hẹn trên Calendar

```
1. Kéo 1 event sang ô giờ/ngày khác trên FullCalendar
2. onEventReschedule gọi appointmentsApi.update() với TOÀN BỘ dữ liệu cũ
   của appointment + chỉ đổi scheduledDateTime
3. Nếu API lỗi (ví dụ mất quyền) → arg.revert() của FullCalendar tự đưa
   event về vị trí cũ trên UI — không cần code thêm gì để rollback UI
```

## Thanh toán nhiều lần cho 1 lịch hẹn

```
1. Mở PaymentHistoryDialog (từ AppointmentsPage hoặc tab "Thanh toán"
   trong PatientDetailPage)
2. Dialog hiện tổng giá / đã trả / còn lại + lịch sử từng lần thu
3. Nếu remaining > 0 → hiện form "Ghi nhận thanh toán" (ẩn hoàn toàn nếu
   đã trả đủ — không cho trả vượt)
4. Nhập số tiền (validate client-side: không vượt remaining TRƯỚC khi
   gọi API) → appointmentsApi.addPayment()
   → backend: nếu PaidAmount + amount > Price → throw
     PaidAmountCannotExceedPrice (double-check ở server, không chỉ tin
     validate client)
   → PaidAmount và PaymentStatus tự tính lại (không set thủ công)
5. Có thể xoá 1 lần thanh toán cụ thể qua ConfirmDialog → PaidAmount/
   PaymentStatus tự tính lại theo tổng còn lại
6. Nút "In hoá đơn" mở /appointments/:id/invoice ở TAB MỚI (không điều
   hướng rời trang hiện tại) → trang này gọi window.print(), không sinh
   PDF, không lưu file
```

## Cập nhật sơ đồ răng

```
1. Vào tab "Sơ đồ răng" trong PatientDetailPage HOẶC route riêng
   /patients/:id/tooth-chart (2 nơi dùng chung PatientToothChartPanel)
2. Lần đầu mở cho 1 bệnh nhân chưa có chart → backend tự tạo lazy toàn
   bộ ToothRecord trạng thái Healthy (32 số nếu người lớn, 20 số nếu
   IsChildPatient)
3. Click 1 răng trên SVG (hoặc focus + Enter/Space bằng bàn phím) → mở
   dialog hiện trạng thái hiện tại + ghi chú
4. Đổi trạng thái + lưu → UpdateStatusAsync ghi đè ToothRecord hiện tại
   VÀ đồng thời insert 1 ToothRecordHistory mới (không ghi đè lịch sử
   cũ) — 2 việc trong 1 lần gọi, cùng 1 transaction UnitOfWork
5. "Xem lịch sử" chỉ tải khi bấm (lazy), không tự tải khi mở dialog
```

## Theo dõi ca gửi labo (Kanban)

```
1. Tạo ca labo mới, gắn PatientId bắt buộc + AppointmentId tuỳ chọn
   → card xuất hiện ở cột "Đã gửi" (Sent)
2. Đổi trạng thái bằng 1 trong 2 cách tương đương:
   a. Kéo-thả card sang cột khác (chuột, không hoạt động trên cảm ứng)
   b. Đổi Select ngay trên card (hoạt động mọi thiết bị)
   Cả 2 gọi cùng 1 hàm changeStatus() → optimistic update ngay trên UI,
   loadData() lại nếu API lỗi (rollback)
3. Khi đổi sang Received lần đầu → backend tự set ReceivedDate = now,
   các lần đổi lại về Received sau đó KHÔNG ghi đè ReceivedDate
4. Trạng thái Attached (đã gắn cho bệnh nhân) → GetBoardAsync loại khỏi
   board (coi như hoàn tất, không cần theo dõi tiếp); Cancelled cũng bị
   loại khỏi board nhưng vẫn còn trong DB (không xoá)
```

## Nhắc tái khám (recall) — luồng chỉ đọc, chưa có hành động gửi thật

```
1. Dashboard gọi patientsApi.getRecallList(6) mỗi lần tải trang
2. Backend quét TOÀN BỘ Appointment, group theo PatientId, tìm
   MAX(ScheduledDateTime) trong các Appointment Completed
3. Lọc bệnh nhân có lần khám gần nhất quá 6 tháng VÀ không có Appointment
   Scheduled nào trong tương lai
4. Hiện danh sách trong khối "Cảnh báo cần chú ý" trên Dashboard, mỗi
   dòng là Link sang trang chi tiết bệnh nhân đó
5. KHÔNG có hành động gửi SMS/email tự động — nhân viên tự gọi/nhắn tay
   sau khi thấy danh sách này (xem Đợt 5 roadmap cho nhắc hẹn tự động)
```

## Nhập/Xuất CSV (Patient, Expense)

```
Xuất:
1. Gọi thẳng API list đã có (maxResultCount: 1000, không endpoint riêng)
2. Convert JSON → CSV bằng parser tự viết (lib/csv.ts, RFC 4180 cơ bản,
   không dùng thư viện ngoài)
3. Tải file qua thẻ <a download>

Nhập:
1. Đọc file CSV chọn từ máy, parse thành object theo header
2. Validate TỪNG DÒNG ở client (field bắt buộc, format ngày...)
3. Gọi Create() tuần tự cho từng dòng hợp lệ — dòng nào lỗi thì báo lỗi
   dòng đó, KHÔNG chặn các dòng hợp lệ khác tiếp tục được tạo
4. Đây là quyết định kiến trúc có chủ đích: không thêm endpoint
   ImportCsvAsync ở backend để tận dụng 100% validate/business rule đã
   có sẵn trong AppService, đổi lại là chậm hơn cho file rất lớn (N
   request tuần tự) — chấp nhận được ở quy mô 1 phòng khám
```

## Backup / Restore database (vận hành, không phải tính năng trong app)

```
Backup: ./scripts/backup-db.sh [output-file]
  → tự phát hiện container Postgres đang chạy, pg_dump format custom (-F c)
  → nếu không có container → fallback pg_dump local (localhost:5432)

Restore: ./scripts/restore-db.sh <backup-file>
  → CẢNH BÁO: xoá và tạo lại TOÀN BỘ dữ liệu (pg_restore --clean --if-exists)
  → có prompt xác nhận [y/N] trước khi thực hiện
  → sau khi restore cần tự restart backend/DbMigrator
```

Đây là backup/restore **cấp database** (pg_dump/pg_restore), khác hoàn toàn với tính
năng Import/Export CSV nghiệp vụ ở trên — không nhầm lẫn 2 khái niệm này.
