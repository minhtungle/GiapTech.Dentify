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

Không có role/claim nào được kiểm tra ở tầng route cho các trang nghiệp vụ (Patient,
Appointment, ...) — `ProtectedRoute` chỉ hỏi "đã đăng nhập chưa", mọi nhân viên đăng
nhập được đều thấy các menu đó (phân quyền thật diễn ra ở tầng API qua
`[Authorize(DentifyPermissions.X)]`, ẩn/hiện nút bấm theo permission **chưa được làm ở
frontend** cho các trang này — nút bấm luôn hiện, chỉ API chặn nếu thiếu quyền).

Ngoại lệ duy nhất: 2 menu "Người dùng"/"Vai trò & phân quyền" (`AppLayout.tsx`) chỉ hiện
khi claim `role` trong `user.profile` (từ id_token, decode sẵn qua `oidc-client-ts`)
chứa `"admin"` — xem mục "Quản lý người dùng & phân quyền" ở `02-dac-ta-chuc-nang.md`.
Đây cũng chỉ là ẩn/hiện UI, API phía sau vẫn tự chặn độc lập.

## Tạo tài khoản nhân viên & gán quyền (admin)

```
1. Admin (admin@abp.io) đăng nhập → menu "Người dùng" hiện trên sidebar
2. Vào /users → nút "Thêm người dùng" → dialog: userName, email, name,
   surname, phoneNumber, mật khẩu tạm (admin tự đặt), tick chọn 1+ role
   trong danh sách assignable-roles (4 role Dentify + admin)
3. Submit → POST /api/identity/users → tài khoản tạo xong, active ngay
   (KHÔNG gửi email kích hoạt — admin tự báo nhân viên mật khẩu tạm qua
   kênh khác, ví dụ nói miệng/Zalo nội bộ)
4. Nhân viên tự đăng nhập bằng tài khoản mới — chưa có bước bắt buộc đổi
   mật khẩu lần đầu ở luồng này (nằm ngoài phạm vi module hiện tại)
5. Nếu cần đổi quyền cho cả role (không phải riêng 1 người) → vào /roles
   → chọn tab role → tick/untick quyền theo nhóm → "Lưu thay đổi"
   → PUT /api/permission-management/permissions?providerName=R&providerKey={role}
   → áp dụng ngay cho MỌI người dùng đang có role đó (không cần họ đăng
     nhập lại — access token cũ vẫn còn quyền cũ tới khi hết hạn/refresh,
     vì permission check ở backend đọc trực tiếp DB, không dựa vào claim
     trong token)
```

Sửa quyền của 1 người dùng riêng lẻ (không qua role) chưa có UI — chỉ sửa được ma trận
theo role (`providerName=R`), đúng quyết định phạm vi đã chốt (đơn giản hoá, quy mô
phòng khám nhỏ không cần override quyền theo từng cá nhân).

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

## Quản lý ảnh lịch hẹn

```
1. Bấm icon "Ảnh lịch hẹn" trên 1 dòng trong bảng → mở
   AppointmentPhotosDialog, tự tải danh sách ảnh + blob URL của
   appointment đó
2. (Tuỳ chọn) nhập Chú thích trước khi chọn file → upload → ảnh mới
   thêm vào lưới, ô chú thích tự reset về rỗng
3. Sửa chú thích ảnh đã có: bấm icon Pencil trên thumbnail → chuyển
   thành ô input inline + nút Lưu/Huỷ → gọi UpdateCaptionAsync
   (route PUT .../appointment-photo/{id}/caption)
4. Click vào ảnh → mở dialog preview lớn; icon Trash2 → ConfirmDialog
   trước khi xoá
5. Đổi sang appointment khác (đóng dialog rồi mở lại cho appointment
   khác) trong khi ảnh đang tải → response cũ bị bỏ qua (so khớp
   appointmentId hiện tại tại thời điểm response về), tránh hiển thị
   nhầm ảnh hoặc revoke sai blob URL đang hiển thị
6. Đóng dialog → tất cả blob URL đang giữ bị revoke để tránh leak
   memory
```

## Cập nhật sơ đồ răng

```
1. Vào tab "Sơ đồ răng" trong PatientDetailPage HOẶC route riêng
   /patients/:id/tooth-chart (2 nơi dùng chung PatientToothChartPanel)
2. Lần đầu mở cho 1 bệnh nhân chưa có chart → backend tự tạo lazy toàn
   bộ ToothRecord trạng thái Healthy (32 số nếu người lớn, 20 số nếu
   IsChildPatient)
3. Số răng hiển thị trên SVG và trong dialog theo hệ đánh số đã cấu
   hình ở Cài đặt phòng khám (Palmer/Universal/ISO 3950 — mặc định
   Iso3950 nếu tải Cài đặt lỗi), không phải hằng số cố định
4. Click 1 răng trên SVG (hoặc focus + Enter/Space bằng bàn phím) → mở
   dialog hiện trạng thái hiện tại + ghi chú + Select "Lịch hẹn liên
   quan" (tuỳ chọn, mặc định "Không liên kết", load 100 lịch hẹn gần
   nhất của bệnh nhân)
5. Đổi trạng thái/lịch hẹn liên quan + lưu → UpdateStatusAsync ghi đè
   ToothRecord hiện tại VÀ đồng thời insert 1 ToothRecordHistory mới
   (không ghi đè lịch sử cũ) — 2 việc trong 1 lần gọi, cùng 1
   transaction UnitOfWork
6. "Xem lịch sử" chỉ tải khi bấm (lazy), không tự tải khi mở dialog
```

## Theo dõi ca gửi labo (Kanban)

```
1. Tạo ca labo mới, gắn PatientId bắt buộc + AppointmentId tuỳ chọn
   → card xuất hiện ở cột "Đã gửi" (Sent), hiển thị kèm ngày giờ hẹn
   liên quan (icon lịch) nếu có gắn AppointmentId (backend join sẵn
   AppointmentScheduledDateTime, không lưu DB riêng)
2. Có thể lọc board theo tên bệnh nhân/tên labo VÀ theo Loại công việc
   (Select, danh sách động lấy từ dữ liệu board đã tải) — cả 2 lọc
   client-side, không gọi lại API
3. Đổi trạng thái bằng 1 trong 2 cách tương đương:
   a. Kéo-thả card sang cột khác (chuột, không hoạt động trên cảm ứng)
   b. Đổi Select ngay trên card (hoạt động mọi thiết bị)
   Cả 2 gọi cùng 1 hàm changeStatus() → optimistic update ngay trên UI,
   loadData() lại nếu API lỗi (rollback)
4. Khi đổi sang Received lần đầu → backend tự set ReceivedDate = now,
   các lần đổi lại về Received sau đó KHÔNG ghi đè ReceivedDate
5. Trạng thái Attached (đã gắn cho bệnh nhân) → GetBoardAsync loại khỏi
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

## Lọc bảng lịch hẹn

```
1. Các Select Trạng thái/Dịch vụ/Ghế/Thanh toán đều lọc SERVER-SIDE
   (gọi lại appointmentsApi.getList() kèm params filter tương ứng) —
   không lọc client-side trên dữ liệu đã tải như trước
2. Ô tìm theo tên bệnh nhân vẫn lọc client-side (không có field
   free-text tương ứng trong GetAppointmentListDto) — chỉ áp dụng khi
   bấm Enter hoặc bấm nút "Lọc", không debounce theo mỗi ký tự
3. Đổi Select áp dụng lọc ngay (gọi lại loadData())
```

## Tạo/sửa khoản chi (Expense)

```
1. Vào /expenses → trang hiện biểu đồ cột ngang "Chi phí theo danh
   mục (12 tháng gần nhất)" ở đầu trang (Recharts, tải qua
   expensesApi.getSummary() — độc lập với bảng danh sách, không lọc
   theo filter đang áp dụng ở bảng)
2. Nút "Thêm khoản chi" → form có Select "Ca labo liên quan" (tuỳ
   chọn, mặc định "Không liên kết") — load qua labWorksApi.getBoard(),
   cho phép gắn Expense với 1 LabWork cụ thể (labWorkId) dù Category
   không phải "Lab" (không ràng buộc cứng)
3. Submit → expensesApi.create()/update() → reload cả bảng và biểu đồ
4. Bảng danh sách có thêm cột "Labo liên quan" hiển thị tên labo nếu
   khoản chi đó có gắn labWorkId
```

## Nhập/Xuất CSV (Patient, Expense, Appointment)

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

Riêng CSV lịch hẹn (`AppointmentsPage.tsx`) có thêm 1 lớp resolve tên→ID (qua
`lib/csv-resolve.ts`) vì đây là CSV đầu tiên đụng tới field FK thay vì chỉ field phẳng:

```
1. Cột DoctorId/ServiceId/ChairId trong file xuất ra đã có sẵn kèm cột
   tên hiển thị — nhập lại ưu tiên khớp theo ID cột ẩn, fallback khớp
   tên (không phân biệt hoa/thường) nếu cột ID trống
2. PatientId là BẮT BUỘC resolve được — không tìm thấy/trùng nhiều tên
   thì chặn dòng đó (đúng behavior "lỗi thì báo lỗi dòng đó" ở trên)
3. DoctorId/ServiceId/ChairId là TUỲ CHỌN — nếu ô để trống thì bỏ qua
   hợp lệ (tạo lịch hẹn không gắn field đó); nhưng nếu người dùng CÓ ghi
   tên mà không resolve được (không tìm thấy hoặc trùng nhiều bản ghi)
   thì KHÔNG âm thầm bỏ qua — dòng đó vẫn được tạo thành công (field đó
   để trống) nhưng xuất hiện trong danh sách lỗi cuối cùng dạng cảnh
   báo, ví dụ "Bác sĩ không tìm thấy \"...\" (đã bỏ qua, vẫn tạo lịch
   hẹn)" — khác 2 nhóm lỗi khác nhau trong cùng 1 danh sách errors:
   (a) lỗi chặn dòng (PatientId/field bắt buộc sai), (b) cảnh báo không
   chặn (Doctor/Service/Chair không resolve được)
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
