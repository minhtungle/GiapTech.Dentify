# 02 — Đặc tả chức năng

> Mô tả từng module: entity, field, business rule, API, trang UI tương ứng. Đây là tài
> liệu tham chiếu khi cần biết "trường này lưu gì, giới hạn bao nhiêu ký tự, ai được sửa,
> API nào gọi". Xem `03-luong-nghiep-vu.md` cho góc nhìn theo luồng thao tác của người
> dùng thay vì theo module.

## Quy ước đọc

- **Aggregate root**: entity độc lập, có repository riêng, vòng đời riêng.
- **Entity con**: chỉ tồn tại bên trong 1 aggregate root, không có repository riêng thao
  tác trực tiếp từ AppService khác (dù ABP tự đăng ký generic repository cho mọi entity —
  quy ước trong dự án là chỉ sửa entity con qua domain method của aggregate root chứa nó).
- Wire format của enum: **response trả số nguyên (ordinal)**, **request nhận tên chuỗi**
  (ví dụ trạng thái lịch hẹn trả về `2`, nhưng khi tạo/sửa gửi lên `"Completed"`).
- Mọi `DateTime` được ép `DateTimeKind.Utc` trước khi lưu (PostgreSQL `timestamp with
  time zone` bắt buộc UTC) — đây là quy tắc lặp lại ở mọi entity có field ngày giờ.

---

## Patient (Bệnh nhân)

**Route quản trị**: `/patients` (danh sách), `/patients/:patientId` (chi tiết, 4 tab).

### Entity `Patient` (aggregate root, `FullAuditedAggregateRoot<Guid>`)

| Field | Kiểu | Giới hạn / Rule |
|---|---|---|
| `FullName` | string | bắt buộc, tối đa 128 ký tự |
| `DateOfBirth` | DateTime | UTC |
| `Gender` | enum `Gender` | `Male, Female, Other` |
| `PhoneNumber` | string? | tối đa 32 |
| `Email` | string? | tối đa 256 |
| `Address` | string? | tối đa 512 |
| `Notes` | string? | tối đa 2000 — ghi chú tự do, không cấu trúc |
| `Tags` | List\<string\> | tối đa 20 tag, mỗi tag tối đa 64 ký tự, trim + loại trùng không phân biệt hoa/thường |
| `Allergies` | List\<string\> | tối đa 20, mỗi mục tối đa 128 ký tự — cảnh báo dị ứng có cấu trúc riêng (khác `Tags`/`Notes`) |
| `MedicalConditions` | List\<string\> | tối đa 20, mỗi mục tối đa 128 ký tự — bệnh nền |
| `IsChildPatient` | bool (tính toán, không lưu DB) | `true` nếu tuổi < 14 (`PatientConsts.ChildPatientMaxAge`) — quyết định bộ răng sữa/vĩnh viễn khi tạo ToothChart |

`Tags`/`Allergies`/`MedicalConditions` lưu dưới dạng cột `text` chứa JSON array (EF Core
`HasConversion` + `ValueComparer` tuỳ biến) — không phải bảng con riêng.

### Domain method
`SetFullName`, `SetDateOfBirth`, `SetGender`, `SetContactInfo(phone, email, address)`,
`SetNotes`, `SetTags`, `SetAllergies`, `SetMedicalConditions`.

### AppService (`IPatientAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | |
| `GetListAsync(GetPatientListDto)` | filter theo `Filter` (tên/SĐT chứa chuỗi) và `Tag` |
| `CreateAsync` / `UpdateAsync` | |
| `DeleteAsync` | |
| `GetPatientDetailAsync(id)` | trả `PatientDetailDto`: `LastAppointmentDate`, `TotalDebt` (tổng `Price - PaidAmount` mọi Appointment), `NoShowCount` (đếm Appointment status NoShow) — tính từ toàn bộ Appointment của bệnh nhân, không lưu counter riêng |
| `GetRecallListAsync(monthsThreshold)` | quét toàn hệ thống: bệnh nhân có Appointment `Completed` gần nhất quá `monthsThreshold` tháng **và** chưa có Appointment `Scheduled` nào trong tương lai. Ngưỡng mặc định 6 tháng (`PatientConsts.RecallMonthsThreshold`), hardcode ở frontend (`DashboardPage.tsx`), chưa cấu hình qua Settings |

### UI
- **PatientsPage** (`/patients`): bảng danh sách, ô tìm kiếm theo tên/SĐT/tag, badge "Trẻ
  em" và "Dị ứng" (đỏ, nếu `allergies.length > 0`) ngay trên bảng, dialog thêm/sửa (bao
  gồm 2 ô nhập Dị ứng/Bệnh nền phân tách bằng dấu phẩy), Import/Export CSV.
- **PatientDetailPage** (`/patients/:id`): header hiển thị tuổi, SĐT, badge "Còn nợ"
  (nếu > 0), badge "Không đến N lần" (nếu > 0), badge riêng cho mỗi allergy (đỏ)/medical
  condition (vàng). 4 tab: Lịch hẹn, Thanh toán (mở `PaymentHistoryDialog` từng dòng), Ca
  labo, Sơ đồ răng (nhúng `PatientToothChartPanel`, không chuyển route).

---

## Appointment (Lịch hẹn) — cùng module chứa Payment, PrescriptionItem, AppointmentPhoto

**Route**: `/appointments` (bảng + calendar), `/appointments/:id/invoice` (in hoá đơn,
không có sidebar).

### Entity `Appointment` (aggregate root)

| Field | Kiểu | Ghi chú |
|---|---|---|
| `PatientId` | Guid | FK bắt buộc |
| `DoctorId` | Guid? | **không có FK constraint** — chỉ Guid rời, không tham chiếu `IdentityUser`. Sẽ có entity `Doctor` riêng ở Đợt 1 roadmap |
| `ScheduledDateTime` | DateTime | UTC |
| `Status` | enum `AppointmentStatus` | `Scheduled, InProgress, Completed, Cancelled, NoShow` |
| `TreatmentType` | enum `TreatmentType` | 10 giá trị cố định: `GeneralCheckup, Filling, Extraction, Whitening, RootCanal, Orthodontics, Implant, Cleaning, Crown, Other` — **không liên kết với giá**, sẽ chuyển thành entity `Service` ở Đợt 2 roadmap |
| `PreOpNotes` / `PostOpNotes` | string? | tối đa 4000 mỗi field |
| `Price` | decimal | nhập tay mỗi lần, không gợi ý theo TreatmentType |
| `PaidAmount` | decimal | **tính toán**, = tổng `Payment.Amount` con, không set trực tiếp từ ngoài |
| `PaymentStatus` | enum `PaymentStatus` | **tính toán**: `Unpaid` (PaidAmount ≤ 0), `PartiallyPaid` (< Price), `Paid` (= Price) |
| `PrescriptionItems` | entity con (list) | đơn thuốc |
| `Payments` | entity con (list) | lịch sử thu tiền |

Không có field thời lượng (`DurationMinutes`) — frontend giả định 30 phút cố định khi vẽ
FullCalendar, không lưu DB.

### Domain method quan trọng
- `AddPayment(id, amount, paymentDate, method, notes)` — nếu `PaidAmount + amount >
  Price` → throw `PaidAmountCannotExceedPrice`. Gọi lại `RecalculatePaymentStatus`.
- `RemovePayment(paymentId)` — throw `PaymentNotFound` nếu không có.
- `SetPrice(price)` — nếu hạ giá xuống dưới `PaidAmount` đã thu → throw
  `PaidAmountCannotExceedPrice` (chặn hạ giá dưới số đã thu).
- `AddPrescriptionItem` / `UpdatePrescriptionItem` / `RemovePrescriptionItem`.

### Entity con `Payment` (`CreationAuditedEntity<Guid>` — chỉ audit tạo, không sửa)
| Field | Ghi chú |
|---|---|
| `Amount` | decimal, tối thiểu 0.01 |
| `PaymentDate` | DateTime UTC |
| `Method` | enum `PaymentMethod`: `Cash, BankTransfer, CreditCard, Other` |
| `Notes` | tối đa 1000 |

Constructor và setter đều `internal` — chỉ tạo/sửa được từ trong `Appointment`.

### Entity con `PrescriptionItem` (`Entity<Guid>` — không audit)
| Field | Ghi chú |
|---|---|
| `DrugName` | bắt buộc, tối đa 256 — **text tự do**, không tham chiếu danh mục thuốc (sẽ thêm `DrugId` optional ở Đợt 2 roadmap, không breaking) |
| `Dosage` | tối đa 128 |
| `Quantity` | tối thiểu 1 |
| `Instructions` | tối đa 512 |

### Entity `AppointmentPhoto` (aggregate root riêng, `CreationAuditedAggregateRoot<Guid>`)
Không phải entity con của Appointment dù có FK bắt buộc tới nó — là aggregate độc lập để
AppService ảnh không cần load kèm Appointment mỗi lần query.

| Field | Ghi chú |
|---|---|
| `BlobName`, `FileName` (≤256), `ContentType` (≤128), `SizeBytes`, `Caption?` | |

Giới hạn: JPEG/PNG/WEBP, tối đa 10MB (`AppointmentPhotoConsts`). Lưu blob trong PostgreSQL
qua `IBlobContainer<AppointmentPhotoContainer>` (ABP BlobStoring, provider Database — không
dùng filesystem/S3).

### AppService (`IAppointmentAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | dùng `GetWithDetailsAsync` (custom repository) — include đầy đủ `PrescriptionItems`, `Payments` |
| `GetListAsync(GetAppointmentListDto)` | filter server-side: `PatientId`, `DoctorId`, `Status`, `FromDate`, `ToDate`. **Không filter theo tên bệnh nhân/TreatmentType ở server** — frontend tự lọc client-side sau khi tải về |
| `GetCalendarViewAsync(fromDate, toDate)` | cho view Lịch |
| `CreateAsync` / `UpdateAsync` / `DeleteAsync` | |
| `AddPaymentAsync(id, CreatePaymentDto)` | route ABP convention: `POST .../appointment/{id}/payment` |
| `RemovePaymentAsync(id, paymentId)` | route: `DELETE .../appointment/{id}/payment?paymentId=...` |

`IAppointmentPhotoAppService`: `GetListAsync(appointmentId)`, `UploadAsync(appointmentId,
IRemoteStreamContent)`, `DownloadAsync(id)`, `DeleteAsync(id)`.

### UI
- **AppointmentsPage** (`/appointments`): Tabs "Bảng"/"Lịch". Bảng có bộ lọc đầy đủ (tên,
  trạng thái, loại điều trị, khoảng ngày). Dialog tạo/sửa gồm cả quản lý đơn thuốc động
  (thêm/xoá dòng); khi chọn bệnh nhân, hiển thị ngay cảnh báo dị ứng/bệnh nền (tra trong
  state `patients` đã tải, không gọi API riêng) và số lần no-show (gọi lười
  `patientsApi.getDetail`). Calendar dùng FullCalendar, kéo-thả đổi giờ (`onEventReschedule`
  tự revert nếu API lỗi), màu theo `AppointmentStatus`.
- **PaymentHistoryDialog** (component dùng chung, không phải trang riêng): xem/thêm/xoá
  lịch sử thanh toán, nút "In hoá đơn" mở `/appointments/:id/invoice` ở tab mới.
- **AppointmentPhotosDialog**: upload/xem/xoá ảnh, preview lớn, tự `revokeObjectURL` để
  tránh leak memory.
- **InvoicePage** (`/appointments/:id/invoice`): route không có `AppLayout` (in sạch,
  không sidebar). Hiển thị thông tin phòng khám (từ ClinicSettings), đơn thuốc, lịch sử
  thanh toán, tổng kết giá/đã trả/còn lại. Nút "In hoá đơn" chỉ gọi `window.print()` —
  không sinh PDF.

---

## ToothChart (Sơ đồ răng)

**Route**: `/patients/:patientId/tooth-chart` (route riêng, giữ lại dù đã có tab trong
PatientDetailPage — cả 2 dùng chung component `PatientToothChartPanel`).

### Entity `ToothChart` (aggregate root, 1-1 với Patient, unique index trên `PatientId`)
Chứa entity con `ToothRecord` (unique composite index `(ToothChartId, ToothNumber)`).

| `ToothRecord` field | Ghi chú |
|---|---|
| `ToothNumber` | theo hệ ISO 3950 — validate qua `ToothNumbers.IsValid` |
| `Status` | enum `ToothStatus`: `Healthy, Decayed, Filled, Missing, Crown, RootCanal, Extracted, Implant` |
| `Notes` | tối đa 1000 |
| `LastUpdated`, `UpdatedByAppointmentId?` | |

Chart tạo **lazy**: khi `GetAsync(patientId)` lần đầu và bệnh nhân chưa có chart, tự tạo
toàn bộ `ToothRecord` trạng thái `Healthy` cho đúng bộ răng (32 số vĩnh viễn nếu
`IsChildPatient=false`, 20 số răng sữa nếu `true`).

### Entity `ToothRecordHistory` (aggregate root riêng, append-only log)
Cố ý **không** là entity con của `ToothChart` — vì log tăng vô hạn theo thời gian sống
bệnh nhân, nhúng vào ToothChart sẽ buộc load toàn bộ lịch sử mỗi lần chỉ cần xem trạng
thái hiện tại.

| Field | Ghi chú |
|---|---|
| `PatientId`, `ToothNumber`, `Status`, `Notes?`, `AppointmentId?`, `RecordedAt` | |

### AppService (`IToothChartAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | `id` = `patientId`; tạo lazy nếu chưa có |
| `UpdateStatusAsync(patientId, toothNumber, UpdateToothStatusDto)` | ghi đè `ToothRecord` hiện tại **và** insert 1 `ToothRecordHistory` mới (không ghi đè) — AppService điều phối 2 aggregate khác nhau, đúng nguyên tắc DDD (domain method của 1 aggregate không tự ghi vào aggregate khác) |
| `GetHistoryAsync(patientId, toothNumber)` | lazy-load khi bấm "Xem lịch sử", không tự tải khi mở dialog |

### UI
`ToothChartSvg` — component SVG thuần vẽ 32 răng vĩnh viễn hoặc 20 răng sữa theo FDI,
mỗi răng là `<g role="button" tabIndex>` hỗ trợ chuột và bàn phím (Enter/Space),
`aria-label` mô tả số răng + trạng thái. `PatientToothChartPanel` bọc SVG + dialog cập
nhật/lịch sử, dùng chung cho cả route riêng và tab trong PatientDetailPage.

Ghi chú hiển thị: `ToothNotationSystem` (Iso3950/Palmer/Universal) chỉ để **chuyển đổi
hiển thị ở frontend** — backend luôn lưu/trả theo ISO 3950, chưa có UI chọn hệ hiển thị
khác.

---

## LabWork (Ca gửi labo ngoài)

**Route**: `/lab-works` (Kanban board).

### Entity `LabWork` (aggregate root)

| Field | Ghi chú |
|---|---|
| `PatientId` | bắt buộc |
| `AppointmentId` | optional — **không hiển thị link ngược lại từ UI** |
| `LabName`, `WorkType` | bắt buộc, tối đa 256 mỗi field |
| `ToothNumberList` | List\<int\>, validate qua `ToothNumbers.IsValid`, lưu JSON |
| `SentDate` | UTC |
| `ExpectedReceiveDate?` | UTC — dùng để tính "quá hạn nhận" trên Dashboard |
| `ReceivedDate?` | tự set khi chuyển sang `Received` lần đầu, không ghi đè lần sau |
| `Cost` | decimal |
| `Status` | enum `LabWorkStatus`: `Sent, InProgress, Received, Attached, Cancelled` |
| `Notes?` | tối đa 2000 |

### AppService (`ILabWorkAppService`)
| Method | Ghi chú |
|---|---|
| `GetListAsync` | phân trang, filter `PatientId`/`Status` |
| `GetBoardAsync()` | **không phân trang** — trả toàn bộ LabWork trừ `Cancelled`, dùng riêng cho board Kanban |
| `CreateAsync` / `UpdateAsync` / `DeleteAsync` | |
| `UpdateStatusAsync(id, UpdateLabWorkStatusDto)` | action riêng cho kéo-thả — chỉ đổi 1 field, không gửi lại toàn form |

### UI
Board 4 cột theo `LabWorkStatus` (trừ Cancelled). Kéo-thả HTML5 Drag&Drop **hoặc** `Select`
đổi trạng thái trên mỗi card (2 cách tương đương, vì kéo-thả không hoạt động trên thiết bị
cảm ứng). Ô tìm kiếm theo tên bệnh nhân/tên labo (lọc client-side trên dữ liệu board đã
tải). Optimistic update khi đổi trạng thái, `loadData()` lại nếu API lỗi.

---

## Expense (Chi phí)

**Route**: `/expenses`.

### Entity `Expense` (aggregate root, độc lập hoàn toàn — không liên kết LabWork/Appointment)

| Field | Ghi chú |
|---|---|
| `ExpenseDate` | UTC |
| `Amount` | decimal, tối thiểu 0.01 |
| `Category` | enum `ExpenseCategory`: `Lab, Supplies, Salary, Rent, Utilities, Marketing, Other` |
| `Description?` | tối đa 512 |

### AppService (`IExpenseAppService`)
`GetSummaryAsync(fromDate, toDate)` trả `ExpenseSummaryDto` (tổng + group theo category)
— dùng cho Dashboard và trang Chi phí.

### UI
Bảng danh sách, bộ lọc danh mục + khoảng ngày (server-side), dialog thêm/sửa, Import/
Export CSV.

---

## TaskItem (Công việc nội bộ)

**Route**: `/tasks`. Phong cách tối giản kiểu Notion — không phải bảng, danh sách phẳng
chia 2 nhóm (chưa xong/đã xong).

### Entity `TaskItem` (aggregate root, độc lập hoàn toàn — không gắn Patient/Appointment)

| Field | Ghi chú |
|---|---|
| `Title` | bắt buộc, tối đa 256 |
| `Content?` | tối đa 4000 |
| `IsDone` | bool |
| `Priority` | enum `TaskPriority`: `Low, Medium, High` |
| `DueDate?` | UTC |

### AppService (`ITaskItemAppService`)
`ToggleDoneAsync(id)` — action riêng (tách khỏi `UpdateAsync`) vì đây là thao tác tần
suất cao nhất, cho phép frontend optimistic-update ngay không cần gửi lại cả form.
`GetOverviewListAsync()` — top 5 task chưa xong, dùng cho Dashboard.

### UI
Checkbox tròn (`Circle`/`CheckCircle2`, không dùng input checkbox thô). Bộ lọc độ ưu
tiên (server-side) + checkbox "Chỉ hiện việc quá hạn" (client-side, dùng
`isTaskOverdue` — hàm chung trong `lib/utils.ts`, cũng được Dashboard tái sử dụng).

---

## ClinicSettings (Cấu hình phòng khám)

**Route**: `/settings`. Không có entity Domain riêng — dùng hoàn toàn ABP Setting
Management (global scope, không theo tenant/user).

| Setting key | Mặc định |
|---|---|
| `Dentify.Clinic.Name` | `"Dentify"` |
| `Dentify.Clinic.Address` | — |
| `Dentify.Clinic.PhoneNumber` | — |
| `Dentify.Clinic.LogoUrl` | — |

`IClinicSettingsAppService.GetAsync()` / `UpdateAsync()`. UI: form đơn, preview logo trực
tiếp bằng `<img onError/onLoad>`.

---

## Statistics (Thống kê)

**Route**: `/statistics`. Không có entity riêng — AppService chỉ đọc/tổng hợp từ
`Appointment`, `Payment`, `IdentityUser`.

### AppService (`IStatisticsAppService`)
| Method | Cách tính |
|---|---|
| `GetRevenueOverviewAsync(fromDate, toDate)` | tổng `Payment.Amount` (tiền **thực nhận**, không phải giá dịch vụ) theo ngày trong khoảng, so sánh với kỳ liền trước cùng độ dài để tính `GrowthPercentage` |
| `GetTreatmentTypeStatisticsAsync` | group theo `TreatmentType`, đếm số ca + tổng `PaidAmount` |
| `GetDoctorStatisticsAsync` | group theo `DoctorId` (bác sĩ chưa gán → 1 dòng "Chưa phân công", không loại bỏ) |

### UI
Chọn khoảng thời gian nhanh (7 ngày/30 ngày/tháng này). `LineChart` doanh thu theo ngày +
badge tăng trưởng (recharts). `BarChart` ngang top 6 loại điều trị + bảng đầy đủ. Bảng
theo bác sĩ.

---

## Dashboard (Trang chủ, `/`)

Không phải module — là trang tổng hợp gọi song song nhiều AppService qua
`Promise.allSettled` (1 API lỗi không kéo sập cả trang, chỉ phần đó hiện "—" hoặc thông
báo lỗi cục bộ).

| Khối UI | Nguồn dữ liệu |
|---|---|
| Doanh thu hôm nay / tháng này | `statisticsApi.getRevenueOverview` (2 lần, 2 khoảng ngày) |
| Công nợ cần chú ý | `appointmentsApi.getList` lọc `paymentStatus !== Paid` và quá 7 ngày (`UNPAID_ALERT_DAYS`, hardcode) |
| Bệnh nhân / Lịch hẹn hôm nay / Ca labo đang xử lý / Chi phí tháng này | 4 API list/summary tương ứng |
| **Khối "Cảnh báo cần chú ý"** (tự ẩn nếu rỗng) | gộp 4 loại: công nợ quá hạn, ca labo quá `ExpectedReceiveDate`, task quá hạn (`isTaskOverdue`), bệnh nhân cần nhắc tái khám (`patientsApi.getRecallList(6)`) |
| Lịch hẹn hôm nay / Công việc sắp tới / Ca labo đang xử lý | danh sách rút gọn, mỗi dòng là `Link` điều hướng |
