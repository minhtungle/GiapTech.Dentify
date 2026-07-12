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

## Quy ước UI chung (áp dụng mọi trang, không lặp lại ở từng module)

- **Dialog** (`components/ui/dialog.tsx`): click ra ngoài overlay **không** tự đóng dialog
  nữa (`onPointerDownOutside` mặc định bị chặn qua `preventDefault()`, cho phép override
  qua props nếu 1 dialog cụ thể cần khác — tránh mất dữ liệu đang nhập dở khi lỡ tay click
  ra ngoài). Mọi dialog form đều có cấu trúc 3 phần cố định: `DialogHeader` (tiêu đề, không
  cuộn), `DialogBody` (nội dung, cuộn riêng nếu dài — `flex-1 overflow-y-auto`),
  `DialogFooter` (nút hành động, không cuộn, có border-top phân tách). `DialogBody` là
  export mới, dùng để bọc phần nội dung nằm giữa Header và Footer ở mọi dialog trong
  codebase. **Không dùng `onInteractOutside`** để chặn outside-click (khác
  `onPointerDownOutside`) — đã thử và gây lỗi, xem gotcha bên dưới.
- **Cột "Hành động" trong bảng danh sách**: mọi bảng đều gộp các nút thao tác (Sửa/Xoá/
  Khoá/...) vào 1 `DropdownMenu` (`components/ui/dropdown-menu.tsx`, icon kích hoạt
  `MoreVertical`) thay vì dàn hàng ngang nhiều nút icon riêng lẻ — kể cả bảng chỉ có 2
  hành động, để đồng nhất giữa mọi trang. Mục Xoá luôn ở cuối, có `DropdownMenuSeparator`
  phân tách và class `text-destructive`.
- **Gotcha: mở Dialog từ trong DropdownMenuItem có thể khoá `pointer-events` toàn trang.**
  Radix Dialog và DropdownMenu đều tự khoá `pointer-events` trên `<body>` khi mở, tự gỡ khi
  đóng — nhưng khi 1 `Dialog` được trigger từ bên trong `DropdownMenuItem.onClick` (đúng
  pattern cột Hành động ở trên), thứ tự cleanup giữa 2 Portal không đảm bảo và có thể để
  lại `body { pointer-events: none }` vĩnh viễn dù không còn dialog/menu nào hiển thị
  (`radix-ui/primitives#1241`). Đã fix bằng `lib/radixBodyLockFix.ts` — 1
  `MutationObserver` toàn cục gọi 1 lần ở `main.tsx`, tự gỡ `pointer-events: none` bất cứ
  khi nào không còn phần tử `[role="dialog"]`/`[role="menu"]`/`[role="alertdialog"]`/
  `[role="listbox"]` nào trong DOM. **Không sửa lại bằng `useEffect` cleanup cục bộ trong
  `DialogContent`** — đã thử 2 cách (cleanup ngay, cleanup qua `setTimeout(0)`) và verify
  bằng Playwright đều không đủ tin cậy vì phụ thuộc thứ tự cleanup giữa các component.
- **Bộ lọc nhiều điều kiện**: trang có > 2 điều khiển filter (hiện là `AppointmentsPage` —
  7 điều khiển, `ExpensesPage` — 3 điều khiển) bọc phần filter nâng cao trong
  `Collapsible` (`components/ui/collapsible.tsx`), mặc định đóng, nút "Bộ lọc" hiện badge
  số lượng filter đang áp dụng. Trang chỉ có 1-2 filter (Patients, Users, LabWorks, Tasks,
  Waitlist) giữ nguyên inline, không bọc Collapsible.
- **Nhập danh sách tự do** (tags, dị ứng, bệnh nền...): dùng `TagInput`
  (`components/TagInput.tsx`, component dùng chung) thay vì input text tách dấu phẩy —
  nhập Enter/dấu phẩy để chốt thành chip, gợi ý autocomplete tự xây từ dữ liệu đã có trên
  client (không phải danh mục cố định ở backend).

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
| `ReferralSource` | string? | tối đa 128 — text tự do (vd "Bạn bè giới thiệu", "Facebook"), không phải danh mục cố định, không có logic gì thêm |
| `Tags` | List\<string\> | tối đa 20 tag, mỗi tag tối đa 64 ký tự, trim + loại trùng không phân biệt hoa/thường |
| `Allergies` | List\<string\> | tối đa 20, mỗi mục tối đa 128 ký tự — cảnh báo dị ứng có cấu trúc riêng (khác `Tags`/`Notes`) |
| `MedicalConditions` | List\<string\> | tối đa 20, mỗi mục tối đa 128 ký tự — bệnh nền |
| `IsChildPatient` | bool (tính toán, không lưu DB) | `true` nếu tuổi < 14 (`PatientConsts.ChildPatientMaxAge`) — quyết định bộ răng sữa/vĩnh viễn khi tạo ToothChart |
| `IdentityUserId` | Guid? | optional, **unique khi có giá trị** (Postgres partial unique index — khác `Doctor.IdentityUserId` bắt buộc) — liên kết tài khoản Patient Portal, xem mục "PatientPortal" bên dưới |

`Tags`/`Allergies`/`MedicalConditions` lưu dưới dạng cột `text` chứa JSON array (EF Core
`HasConversion` + `ValueComparer` tuỳ biến) — không phải bảng con riêng.

### Domain method
`SetFullName`, `SetDateOfBirth`, `SetGender`, `SetContactInfo(phone, email, address)`,
`SetNotes`, `SetReferralSource`, `SetTags`, `SetAllergies`, `SetMedicalConditions`,
`LinkToIdentityUser(id)`, `UnlinkIdentityUser()`.

### AppService (`IPatientAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | |
| `GetListAsync(GetPatientListDto)` | filter theo `Filter` (tên/SĐT chứa chuỗi) và `Tag` |
| `CreateAsync` / `UpdateAsync` | |
| `DeleteAsync` | |
| `LinkIdentityUserAsync(id, LinkPatientIdentityUserDto)` | gán tài khoản Patient Portal — đúng pattern `DoctorAppService.EnsureIdentityUserExistsAsync`/`EnsureIdentityUserNotLinkedAsync`, throw `PatientAlreadyLinkedToUser` nếu user đã gắn Patient khác. Permission riêng `Patients.ManagePortalAccess` (tách khỏi `Patients.Update`) |
| `UnlinkIdentityUserAsync(id)` | gỡ liên kết, không xoá `IdentityUser` |
| `GetPatientDetailAsync(id)` | trả `PatientDetailDto`: `LastAppointmentDate`, `TotalDebt` (tổng `Price - PaidAmount` các Appointment **không** ở trạng thái Cancelled — appointment đã huỷ chưa thu tiền không tính là công nợ), `NoShowCount` (đếm Appointment status NoShow, tính trên toàn bộ Appointment không loại Cancelled) — tính từ toàn bộ Appointment của bệnh nhân, không lưu counter riêng |
| `GetRecallListAsync(monthsThreshold)` | quét toàn hệ thống: bệnh nhân có Appointment `Completed` gần nhất quá `monthsThreshold` tháng **và** chưa có Appointment `Scheduled` nào trong tương lai. Ngưỡng mặc định 6 tháng (`PatientConsts.RecallMonthsThreshold`), hardcode ở frontend (`DashboardPage.tsx`), chưa cấu hình qua Settings |
| `GetDuplicatesAsync(fullName, phoneNumber?, excludeId?)` | `GET /api/app/patient/duplicates` — tra cứu bệnh nhân trùng theo `FullName` (so sánh không phân biệt hoa/thường) HOẶC `PhoneNumber` khớp chính xác, loại trừ `excludeId` (dùng khi sửa để không tự báo trùng chính mình). Trả tối đa 5 bản ghi. **Không throw exception** — đây là API tra cứu hỗ trợ cảnh báo ở frontend trước khi lưu, không phải validation chặn cứng ở tầng domain, xem luồng ở `03-luong-nghiep-vu.md` |

### UI
- **PatientsPage** (`/patients`): bảng danh sách, ô tìm kiếm theo tên/SĐT/tag, badge "Trẻ
  em" và "Dị ứng" (đỏ, nếu `allergies.length > 0`) ngay trên bảng, dialog thêm/sửa (bao
  gồm ô nhập "Nguồn giới thiệu" text tự do, 3 ô `TagInput` — component dùng chung tại
  `components/TagInput.tsx` — cho Dị ứng/Bệnh nền/Tags: nhập tự do + Enter/dấu phẩy để
  chốt thành chip, gợi ý autocomplete lấy từ toàn bộ giá trị đã dùng ở các bệnh nhân hiện
  có trên client — không phải danh mục cố định từ backend), Import/Export CSV (cột "Nguồn
  giới thiệu" có trong cả Export lẫn Import). Trước khi lưu (tạo hoặc sửa), tự động gọi
  `GetDuplicatesAsync` theo `fullName`/`phoneNumber` đang nhập — nếu có kết quả trùng, mở
  `ConfirmDialog` cảnh báo liệt kê các bệnh nhân trùng, chỉ lưu thật sau khi người dùng
  xác nhận tiếp tục (không tự động chặn cứng, admin có thể cố ý tạo trùng nếu chắc chắn
  đây là người khác).
- **PatientDetailPage** (`/patients/:id`): header hiển thị tuổi, SĐT, badge "Còn nợ"
  (nếu > 0), badge "Không đến N lần" (nếu > 0), badge riêng cho mỗi allergy (đỏ)/medical
  condition (vàng), dòng phụ hiển thị "Biết đến qua: ..." nếu có `ReferralSource`. Góc
  phải header có nút "Cấp tài khoản cổng bệnh nhân" (mở dialog `IdentityUserPicker` gọi
  `linkIdentityUser`) nếu chưa liên kết, hoặc badge "Đã cấp tài khoản portal" + nút "Huỷ
  liên kết" (qua `ConfirmDialog`) nếu đã có. 6 tab: Lịch hẹn, Thanh toán (mở
  `PaymentHistoryDialog` từng dòng), Ca labo, Kế hoạch điều trị (`TreatmentPlansPanel`),
  Bảo hiểm (`InsurancePoliciesPanel`), Sơ đồ răng (nhúng `PatientToothChartPanel`, không
  chuyển route).

---

## Doctor (Bác sĩ)

**Route**: `/doctors` — trang quản lý CRUD riêng (thêm sau khi hoàn tất roadmap 13 mục,
đợt dọn dẹp tồn đọng), cộng với vai trò làm nguồn dữ liệu cho Select "Bác sĩ phụ trách"
trong dialog tạo/sửa lịch hẹn. Dialog tạo mới dùng `IdentityUserPicker` (component dùng
chung, tìm kiếm qua `GET /api/identity/users?filter=...` có sẵn của ABP Identity module)
để chọn `IdentityUserId` — sửa chỉ cho đổi `Specialization`, không đổi lại tài khoản đã
gắn (tránh nhầm lẫn, muốn đổi tài khoản thì xoá tạo lại).

### Entity `Doctor` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `IdentityUserId` | Guid | bắt buộc, **unique** — 1 tài khoản `IdentityUser` chỉ gắn với 1 Doctor |
| `Specialization` | string? | tối đa 256 |
| `IsActive` | bool | mặc định true — **ngừng hoạt động thay vì xoá cứng**, để không mất lịch sử Appointment đã gắn `DoctorId` cũ |

Không có lịch làm việc theo tuần (out of scope Đợt 1, để đợt sau nếu cần).

### Domain method
`SetSpecialization`, `Activate()`, `Deactivate()`.

### AppService (`IDoctorAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | |
| `GetActiveListAsync()` | không phân trang — dùng cho Select |
| `CreateAsync` | validate `IdentityUserId` tồn tại (`EnsureIdentityUserExistsAsync`) và chưa gắn Doctor khác (`EnsureIdentityUserNotLinkedAsync` → throw `DoctorAlreadyLinkedToUser`) — bọc trong `IAbpDistributedLock` theo key `doctor-identity-{identityUserId}` để loại bỏ race condition khi 2 request đồng thời cùng tạo Doctor cho 1 tài khoản (xem `04-kien-truc-ky-thuat.md` mục Distributed Locking) |
| `UpdateAsync` | chỉ re-validate khi đổi `IdentityUserId` |
| `ActivateAsync` / `DeactivateAsync` | |
| `DeleteAsync` | xoá cứng (soft-delete qua `FullAuditedAggregateRoot`) |

`FullName` trên `DoctorDto` được join từ `IdentityUser.Name` (không phải `UserName`) tại
`MapToDtosAsync` — nếu `IdentityUser.Name` chưa được set khi tạo user, `FullName` sẽ rỗng.

### Permission
Nhóm `Doctors` (`Default`, `Create`, `Update`, `Delete`) — `[Authorize]` ở class-level
cho `Default`, action riêng cho từng method ghi.

---

## Service (Dịch vụ)

**Route**: `/services` — trang quản lý CRUD riêng (thêm sau khi hoàn tất roadmap 13 mục),
cộng với vai trò làm nguồn dữ liệu cho Select "Dịch vụ" trong dialog tạo/sửa lịch hẹn và
bộ lọc trang Lịch hẹn. Thay thế hoàn toàn enum `TreatmentType` cũ (Đợt 2 roadmap) — không
giữ song song.

### Entity `Service` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `Name` | string | bắt buộc, ≤128 |
| `Price` | decimal | giá tham chiếu, `Check.Range(0, decimal.MaxValue)` — **không ràng buộc** `Appointment.Price`, chỉ để tham khảo khi lập lịch |
| `IsActive` | bool | mặc định true — ngừng cung cấp thay vì xoá cứng, giữ lịch sử Appointment cũ còn tham chiếu |

Domain method: `SetName`, `SetPrice`, `Activate()`/`Deactivate()`.

### AppService (`IServiceAppService`)
Cùng khuôn `IDoctorAppService`: `GetAsync`, `GetActiveListAsync()` (không phân trang, cho
Select), `CreateAsync/UpdateAsync/ActivateAsync/DeactivateAsync/DeleteAsync`.

### Permission
Nhóm `Services` (`Default`, `Create`, `Update`, `Delete`).

### Dữ liệu khởi tạo (migration `AddServiceEntity`)
10 Service được seed sẵn với **Guid cố định** (`00000000-0000-0000-0000-00000000000N`),
tương ứng đúng 10 giá trị enum `TreatmentType` cũ (Khám tổng quát, Trám răng, Nhổ răng,
Tẩy trắng răng, Điều trị tuỷ, Chỉnh nha, Cấy ghép Implant, Cạo vôi răng, Bọc răng sứ,
Khác) — `Price = 0` mặc định, phòng khám tự cập nhật giá thật sau. Toàn bộ Appointment cũ
đã có `TreatmentType` được migration tự động map sang đúng `ServiceId` tương ứng (xem
`04-kien-truc-ky-thuat.md` mục migration).

---

## Drug (Danh mục thuốc)

**Route**: `/drugs` — trang quản lý CRUD riêng (thêm sau khi hoàn tất roadmap 13 mục),
cộng với vai trò làm nguồn dữ liệu cho Select chọn thuốc trong đơn thuốc của lịch hẹn.

### Entity `Drug` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `Name` | string | bắt buộc, ≤256 |
| `DefaultDosage` | string? | ≤128 — liều lượng mặc định, tự điền vào `PrescriptionItem.Dosage` khi chọn thuốc, người dùng sửa tay được sau đó |
| `IsActive` | bool | mặc định true |

Domain method: `SetName`, `SetDefaultDosage`, `Activate()`/`Deactivate()`.

### AppService (`IDrugAppService`)
Cùng khuôn `IDoctorAppService`/`IServiceAppService`.

### Permission
Nhóm `Drugs` (`Default`, `Create`, `Update`, `Delete`).

### Quan hệ với `PrescriptionItem` — không breaking
`PrescriptionItem.DrugName` (text tự do) **giữ nguyên**, chỉ thêm `DrugId?` optional tham
chiếu `Drug.Id`. Không có ràng buộc `DrugName` phải khớp tên `Drug` được chọn — frontend
tự điền khi chọn từ Select nhưng vẫn cho sửa tay, đúng tinh thần giữ tương thích ngược
với dữ liệu đơn thuốc tự do đã có từ trước.

---

## Chair (Ghế nha khoa)

**Route**: `/chairs` — trang quản lý CRUD riêng (thêm sau khi hoàn tất roadmap 13 mục),
cộng với vai trò làm nguồn dữ liệu cho Select "Ghế" trong dialog tạo/sửa lịch hẹn và cột
resource trên Calendar.

### Entity `Chair` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `Name` | string | bắt buộc, ≤64 (vd "Ghế 1", "Ghế VIP") |
| `IsActive` | bool | mặc định true — ngừng dùng thay xoá cứng, giữ lịch sử Appointment cũ còn tham chiếu |

Domain method: `SetName`, `Activate()`/`Deactivate()`. Không có lịch làm việc/màu sắc
riêng — giữ đơn giản như `Doctor` ở Đợt 1.

### AppService (`IChairAppService`)
Cùng khuôn `IDoctorAppService`/`IServiceAppService`.

### Permission
Nhóm `Chairs` (`Default`, `Create`, `Update`, `Delete`).

### Chặn double-booking theo ghế
`AppointmentAppService.CreateAsync`/`UpdateAsync` — nếu `ChairId` có giá trị, check
overlap khung giờ y hệt logic `EnsureDoctorNotDoubleBookedAsync` (đổi field lọc thành
`ChairId`) → throw `BusinessException(ChairDoubleBooked)`. Check theo ghế và check theo
bác sĩ **độc lập nhau** — 1 lịch hẹn trùng giờ khác ghế khác bác sĩ là hợp lệ; trùng ghế
dù khác bác sĩ vẫn bị chặn (2 bác sĩ không thể dùng chung 1 ghế cùng lúc).

### UI — resource view trên Calendar
`AppointmentCalendar.tsx` dùng thêm `@fullcalendar/resource` +
`@fullcalendar/resource-timegrid` — thêm view `resourceTimeGridDay` ("Theo ghế") vào
`headerToolbar`, mỗi Chair là 1 cột resource song song, cộng thêm 1 resource ảo "Chưa xếp
ghế" cho appointment chưa có `ChairId` (không mất event khỏi calendar). Kéo-thả sang cột
ghế khác gọi `onEventReschedule` với `newChairId` để cập nhật `ChairId` cùng lúc đổi giờ.

---

## Appointment (Lịch hẹn) — cùng module chứa Payment, PrescriptionItem, AppointmentPhoto

**Route**: `/appointments` (bảng + calendar), `/appointments/:id/invoice` (in hoá đơn,
không có sidebar).

### Entity `Appointment` (aggregate root)

| Field | Kiểu | Ghi chú |
|---|---|---|
| `PatientId` | Guid | FK bắt buộc |
| `DoctorId` | Guid? | FK tới `Doctor.Id`, không bắt buộc (`IsRequired(false)`) |
| `ScheduledDateTime` | DateTime | UTC |
| `DurationMinutes` | int | mặc định 30, `Check.Range(5, 480)` |
| `Status` | enum `AppointmentStatus` | `Scheduled, InProgress, Completed, Cancelled, NoShow` |
| `ServiceId` | Guid? | FK tới `Service.Id`, không bắt buộc (`IsRequired(false)`) — thay thế enum `TreatmentType` cũ (đổi ở Đợt 2 roadmap) |
| `ChairId` | Guid? | FK tới `Chair.Id`, không bắt buộc (`IsRequired(false)`) — thêm ở Đợt 3 roadmap cho Multi-chair |
| `PreOpNotes` / `PostOpNotes` | string? | tối đa 4000 mỗi field |
| `Price` | decimal | nhập tay mỗi lần, không tự động theo `Service.Price` (chỉ là giá tham chiếu, không ràng buộc) |
| `PaidAmount` | decimal | **tính toán**, = tổng `Payment.Amount` con, không set trực tiếp từ ngoài |
| `PaymentStatus` | enum `PaymentStatus` | **tính toán**: `Unpaid` (PaidAmount ≤ 0), `PartiallyPaid` (< Price), `Paid` (= Price) |
| `ReminderSentAt` | DateTime? | UTC, set 1 lần khi nhắc hẹn email gửi thành công (`MarkReminderSent`) — dùng để chống gửi trùng, xem mục "Nhắc hẹn tự động" bên dưới |
| `PrescriptionItems` | entity con (list) | đơn thuốc |
| `Payments` | entity con (list) | lịch sử thu tiền |

FullCalendar vẽ event theo `DurationMinutes` thật của từng appointment (không còn hằng số
cố định).

### Domain method quan trọng
- `AddPayment(id, amount, paymentDate, method, notes)` — nếu `PaidAmount + amount >
  Price` → throw `PaidAmountCannotExceedPrice`. Gọi lại `RecalculatePaymentStatus`.
- `RemovePayment(paymentId)` — throw `PaymentNotFound` nếu không có.
- `SetPrice(price)` — nếu hạ giá xuống dưới `PaidAmount` đã thu → throw
  `PaidAmountCannotExceedPrice` (chặn hạ giá dưới số đã thu).
- `AddPrescriptionItem` / `UpdatePrescriptionItem` / `RemovePrescriptionItem`.
- `SetDuration(minutes)` — `Check.Range(5, 480)`.

### Chặn double-booking bác sĩ và ghế
`AppointmentAppService.CreateAsync`/`UpdateAsync` — nếu `DoctorId` có giá trị, query các
Appointment khác cùng `DoctorId` (loại trừ `Status = Cancelled`, loại trừ chính nó khi
update) có khung giờ `[ScheduledDateTime, ScheduledDateTime + DurationMinutes)` giao với
appointment đang lưu → throw `BusinessException(DoctorDoubleBooked)`. Từ Đợt 3, cùng logic
áp dụng độc lập cho `ChairId` → throw `BusinessException(ChairDoubleBooked)` — 2 check
chạy riêng, không liên quan nhau (xem mục `Chair` phía trên).

Toàn bộ bước kiểm tra + insert/update được bọc trong 2 `IAbpDistributedLock` riêng (key
`appointment-doctor-{doctorId}`/`appointment-chair-{chairId}`) để loại bỏ race condition:
2 request đồng thời tạo lịch hẹn trùng giờ cho cùng bác sĩ/ghế trước đây có thể cùng qua
được kiểm tra (chỉ là 1 SELECT không có lock) trước khi bên nào insert xong — giờ request
thứ 2 phải đợi request đầu hoàn tất mới được kiểm tra, hoặc nhận lỗi
`ConcurrentBookingInProgress` nếu chờ quá 10 giây (xem `04-kien-truc-ky-thuat.md` mục
Distributed Locking).

### Permission `Appointments.ManageClinicalNotes`
Tách riêng khỏi `Appointments.Update` — `AppointmentAppService.UpdateAsync` chỉ
`AuthorizationService.CheckAsync` permission này khi `PreOpNotes`/`PostOpNotes` thực sự
thay đổi so với giá trị cũ. Mục đích: Receptionist dời được lịch/đổi giá nhưng không sửa
được ghi chú lâm sàng.

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
| `DrugName` | bắt buộc, tối đa 256 — **vẫn là text tự do**, giữ nguyên kể cả khi chọn thuốc từ danh mục (frontend tự điền, người dùng vẫn sửa tay được) |
| `DrugId` | Guid?, FK tới `Drug.Id`, không bắt buộc — tham chiếu danh mục thuốc chuẩn, không ràng buộc `DrugName` phải khớp |
| `Dosage` | tối đa 128 |
| `Quantity` | tối thiểu 1 |
| `Instructions` | tối đa 512 |

### Entity `AppointmentPhoto` (aggregate root riêng, `CreationAuditedAggregateRoot<Guid>`)
Không phải entity con của Appointment dù có FK bắt buộc tới nó — là aggregate độc lập để
AppService ảnh không cần load kèm Appointment mỗi lần query.

| Field | Ghi chú |
|---|---|
| `BlobName`, `FileName` (≤256), `ContentType` (≤128), `SizeBytes`, `Caption?` (≤256) | |

Giới hạn: JPEG/PNG/WEBP, tối đa 10MB (`AppointmentPhotoConsts`). Lưu blob trong PostgreSQL
qua `IBlobContainer<AppointmentPhotoContainer>` (ABP BlobStoring, provider Database — không
dùng filesystem/S3). `Caption` set được ngay lúc upload (qua `UploadAppointmentPhotoInput
{ Caption, File }`, đúng pattern `UploadConsentFormInput`), và sửa được sau qua
`UpdateCaptionAsync(id, UpdateAppointmentPhotoCaptionInput { Caption? })` — route
`PUT .../appointment-photo/{id}/caption` (ABP tự bỏ tiền tố `Update` khi sinh route, đã
verify qua Swagger spec thật, không đoán).

### AppService (`IAppointmentAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | dùng `GetWithDetailsAsync` (custom repository) — include đầy đủ `PrescriptionItems`, `Payments` |
| `GetListAsync(GetAppointmentListDto)` | filter server-side: `PatientId`, `DoctorId`, `ServiceId`, `ChairId`, `Status`, `PaymentStatus`, `FromDate`, `ToDate`. `PaymentStatus` là cột thật trong DB (ghi qua `RecalculatePaymentStatus()` mỗi lần `SetPrice`/`AddPayment`/`RemovePayment`, không phải field tính runtime `[NotMapped]`) nên lọc được trực tiếp ở SQL. **Không filter theo tên bệnh nhân ở server** — frontend tự lọc client-side sau khi tải về (không có field free-text tương ứng trong DTO) |
| `GetCalendarViewAsync(fromDate, toDate)` | cho view Lịch |
| `CreateAsync` / `UpdateAsync` / `DeleteAsync` | |
| `AddPaymentAsync(id, CreatePaymentDto)` | route ABP convention: `POST .../appointment/{id}/payment` |
| `RemovePaymentAsync(id, paymentId)` | route: `DELETE .../appointment/{id}/payment?paymentId=...` |

`IAppointmentPhotoAppService`: `GetListAsync(appointmentId)`, `UploadAsync(appointmentId,
UploadAppointmentPhotoInput { Caption?, File })`, `UpdateCaptionAsync(id,
UpdateAppointmentPhotoCaptionInput)`, `DownloadAsync(id)`, `DeleteAsync(id)`.

### UI
- **AppointmentsPage** (`/appointments`): Tabs "Bảng"/"Lịch". Bảng có bộ lọc đầy đủ (tên
  — client-side, trạng thái, dịch vụ, ghế, trạng thái thanh toán, khoảng ngày — tất cả trừ
  tên đều gửi server-side qua `GetAppointmentListDto`, Select dịch vụ/ghế gọi
  `servicesApi.getActiveList()`/`chairsApi.getActiveList()`).
  Dialog tạo/sửa gồm Select "Bác sĩ phụ trách" (`doctorsApi.getActiveList()`), Select
  "Dịch vụ" (`servicesApi.getActiveList()`), Select "Ghế" (`chairsApi.getActiveList()`),
  và quản lý đơn thuốc động (thêm/xoá dòng — mỗi dòng có Select chọn thuốc từ danh mục
  (`drugsApi.getActiveList()`) tự điền `drugName`/`dosage`, hoặc chọn "Nhập tên khác" để
  gõ tự do); khi chọn bệnh nhân, hiển thị ngay cảnh báo dị ứng/bệnh nền (tra trong state
  `patients` đã tải, không gọi API riêng) và số lần no-show (gọi lười
  `patientsApi.getDetail`). Calendar dùng FullCalendar với thêm view resource
  `resourceTimeGridDay` ("Theo ghế", từ Đợt 3) bên cạnh `dayGridMonth`/`timeGridWeek`/
  `timeGridDay` sẵn có — kéo-thả đổi giờ (`onEventReschedule` tự revert nếu API lỗi), kéo
  sang cột ghế khác đổi luôn `ChairId`, màu theo `AppointmentStatus`. Import/Export CSV
  (nút "Nhập CSV"/"Xuất CSV" cạnh "Thêm lịch hẹn") — cột export gồm cả tên hiển thị lẫn
  cột ID ẩn (`PatientId`, `DoctorId`, `ServiceId`, `ChairId`) để round-trip không nhầm khi
  2 bản ghi trùng tên; import ưu tiên đọc cột ID nếu khớp bản ghi đang tồn tại
  (`frontend/src/lib/csv-resolve.ts`), fallback khớp tên chính xác không phân biệt
  hoa/thường nếu cột ID trống — `PatientId` bắt buộc resolve được, `DoctorId`/`ServiceId`/
  `ChairId` bỏ qua (để trống) nếu không khớp thay vì chặn dòng, **nhưng vẫn cảnh báo rõ
  trong danh sách lỗi cuối** (ví dụ "Bác sĩ không tìm thấy ...") nếu người dùng có ghi
  tên mà không resolve được — không âm thầm bỏ qua như trước. Không xuất
  `prescriptionItems`/`payments` (dữ liệu con dạng bảng, không phẳng hoá vào 1 dòng CSV).
- **PaymentHistoryDialog** (component dùng chung, không phải trang riêng): xem/thêm/xoá
  lịch sử thanh toán, nút "In hoá đơn" mở `/appointments/:id/invoice` ở tab mới.
- **AppointmentPhotosDialog**: ô nhập "Chú thích" (tuỳ chọn) trước khi chọn file để
  upload/xem/xoá ảnh, chú thích hiển thị dưới mỗi thumbnail (có thể sửa lại sau qua nút
  Pencil → ô inline Lưu/Huỷ, gọi `UpdateCaptionAsync`), preview lớn, tự `revokeObjectURL`
  để tránh leak memory. Input caption tự reset về rỗng khi đổi sang appointment khác.
  `loadPhotos` dùng `latestAppointmentIdRef` (cùng pattern `IdentityUserPicker.tsx`) để bỏ
  qua response cũ nếu người dùng đổi sang appointment khác trước khi request trước hoàn
  tất — tránh revoke blob URL đang hiển thị của appointment mới hoặc hiển thị nhầm ảnh của
  appointment cũ.
- **InvoicePage** (`/appointments/:id/invoice`): route không có `AppLayout` (in sạch,
  không sidebar). Hiển thị thông tin phòng khám (từ ClinicSettings), đơn thuốc, lịch sử
  thanh toán, tổng kết giá/đã trả/còn lại. Nút "In hoá đơn" chỉ gọi `window.print()` —
  không sinh PDF.

### Nhắc hẹn tự động (email — Đợt 5)

Chỉ gửi **email**, không có SMS (quyết định chốt ở Đợt 5 — cần tài khoản provider SMS trả
phí, ngoài phạm vi hạ tầng hiện có). `AppointmentReminderWorker`
(`AsyncPeriodicBackgroundWorkerBase`, chu kỳ 15 phút, đăng ký trong `DentifyWebModule` —
chỉ chạy ở Web host, không chạy ở DbMigrator) gọi
`AppointmentReminderAppService.SendDueRemindersAsync()` mỗi tick — tách riêng thành
AppService (đánh dấu `[RemoteService(IsEnabled = false)]`, không lộ ra REST) để logic
chọn lịch hẹn có thể unit-test độc lập với vòng đời worker.

Điều kiện chọn: `Status = Scheduled`, `ReminderSentAt == null`, `ScheduledDateTime` nằm
trong cửa sổ `[now + 23h, now + 24h)`, và `Patient.Email` khác rỗng — bỏ qua (không lỗi)
nếu bệnh nhân không có email. Gửi thành công → `Appointment.MarkReminderSent(now)`. Gửi
lỗi (SMTP down, v.v.) → chỉ log warning, không throw, không chặn các appointment khác
trong cùng lượt quét — và **không có cơ chế tự động gửi lại** nếu lỗi.

Toàn bộ `SendDueRemindersAsync` bọc trong 1 `IAbpDistributedLock` cố định
(`appointment-reminder-worker`) — nếu chạy nhiều instance Web đồng thời (rolling deploy/
scale ngang), chỉ 1 instance giữ được lock và thực sự quét/gửi trong 1 lượt, instance
khác bỏ qua lượt đó ngay (không đợi) để tránh gửi trùng email nhắc hẹn cho cùng 1 lịch
hẹn (xem `04-kien-truc-ky-thuat.md` mục Distributed Locking).

Hạ tầng gửi email: `Volo.Abp.MailKit` + cấu hình SMTP đọc từ `Settings:Abp.Mailing.Smtp.*`
trong `appsettings.secrets.json` — nếu `Host` rỗng (mặc định, chưa cấu hình), hệ thống tự
fallback về `NullEmailSender` (không gửi, không crash) thay vì phân biệt theo `#if DEBUG`
như trước Đợt 5. Xem `04-kien-truc-ky-thuat.md` mục cấu hình email để biết cách điền
credentials thật khi deploy.

UI: `AppointmentDto.reminderSentAt` hiển thị icon nhỏ "Đã nhắc hẹn" (tooltip có giờ gửi)
cạnh badge trạng thái thanh toán trong bảng `AppointmentsPage.tsx` — chỉ thông tin, không
có hành động thủ công "gửi lại" ở đợt này.

---

## Waitlist (Danh sách chờ)

**Route**: `/waitlist`. Chỉ lưu danh sách + xếp lịch **thủ công** — không có logic tự
động gợi ý bệnh nhân phù hợp khi có lịch trống/huỷ (quyết định đã chốt khi lên plan Đợt
3, tránh phải định nghĩa phức tạp "phù hợp" nghĩa là gì). Nhân viên tự mở trang này khi
cần xem ai đang chờ rồi tạo Appointment thật theo cách thông thường.

### Entity `WaitlistEntry` (aggregate root độc lập, `FullAuditedAggregateRoot<Guid>`)
Không phải entity con của Patient/Appointment.

| Field | Kiểu | Ghi chú |
|---|---|---|
| `PatientId` | Guid | FK bắt buộc |
| `DoctorId` | Guid? | FK tới `Doctor.Id`, không bắt buộc — bác sĩ mong muốn |
| `ServiceId` | Guid? | FK tới `Service.Id`, không bắt buộc — dịch vụ mong muốn |
| `PreferredTimeNote` | string? | ≤256 — text tự do mô tả khung giờ mong muốn (vd "Sáng thứ 7"), **không** phải structured time-range vì không cần match tự động |
| `Notes` | string? | ≤1000 |
| `Status` | enum `WaitlistStatus` | `Waiting, Scheduled, Cancelled` — `Scheduled` do nhân viên tự đổi thủ công sau khi tạo Appointment thật xong, **không tự động liên kết** `AppointmentId` nào |

Domain method: `UpdateDetails(...)`, `SetPreferredTimeNote`, `SetNotes`,
`ChangeStatus(WaitlistStatus)`.

### AppService (`IWaitlistEntryAppService`)
| Method | Ghi chú |
|---|---|
| `GetListAsync(GetWaitlistEntryListDto)` | phân trang, filter theo `Status` |
| `GetAsync` / `CreateAsync` / `UpdateAsync` / `DeleteAsync` | |
| `ChangeStatusAsync(id, ChangeWaitlistEntryStatusDto)` | action riêng đổi 1 field, route `POST .../change-status` — đúng pattern `UpdateStatusAsync` của LabWork |

### Permission
Nhóm `Waitlist` (`Default`, `Create`, `Update`, `Delete`).

### UI
**WaitlistPage** (`/waitlist`, có trong sidebar menu): bảng danh sách lọc theo Status
(mặc định chỉ hiện `Waiting`), dialog tạo/sửa (Select bệnh nhân bắt buộc, Select bác
sĩ/dịch vụ optional, Input khung giờ mong muốn, Textarea ghi chú). Mỗi dòng có Select đổi
Status ngay trên bảng (không cần mở dialog) — không dùng Kanban/kéo-thả vì đây là danh
sách phẳng, Select là đủ.

---

## TreatmentPlan (Kế hoạch điều trị nhiều bước)

**Route**: tab "Kế hoạch điều trị" trong `PatientDetailPage.tsx` (`TreatmentPlansPanel`),
không có route riêng. Mỗi bệnh nhân có thể có **nhiều** TreatmentPlan cùng lúc, không giới
hạn số lượng (quyết định chốt ở Đợt 4) — mỗi kế hoạch có `Status` riêng, độc lập với các
kế hoạch khác của cùng bệnh nhân.

### Entity `TreatmentPlan` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `PatientId` | Guid | FK bắt buộc |
| `Title` | string | bắt buộc, ≤256 (vd "Kế hoạch chỉnh nha 2026") |
| `Notes?` | string | ≤2000 |
| `Status` | enum `TreatmentPlanStatus` | `Draft, Active, Completed, Cancelled` |
| `Items` | entity con (list) | các bước điều trị, đúng pattern `PrescriptionItem` — constructor/setter `internal`, chỉ sửa qua domain method của `TreatmentPlan` |

### Entity con `TreatmentPlanItem` (`Entity<Guid>` — không audit)
| Field | Ghi chú |
|---|---|
| `ServiceId?` | FK tới `Service.Id`, optional — dịch vụ dự kiến cho bước này |
| `StepOrder` | int, thứ tự hiển thị (không unique, không tự sắp xếp lại khi xoá 1 bước giữa chừng) |
| `Description` | bắt buộc, ≤512 |
| `EstimatedCost` | decimal, `Check.Range(0, decimal.MaxValue)` |
| `Status` | enum `TreatmentPlanItemStatus`: `Pending, InProgress, Completed, Skipped` |
| `AppointmentId?` | FK tới `Appointment.Id`, optional — gắn khi bước đã lên lịch thật qua `LinkItemToAppointmentAsync` (đợt dọn dẹp tồn đọng sau roadmap 13 mục — trước đó chỉ có sẵn domain method, chưa có AppService/UI gọi) |

### Domain method (`TreatmentPlan`)
`SetTitle`, `SetNotes`, `ChangeStatus`, `AddItem`, `UpdateItem(itemId, ...)`,
`RemoveItem(itemId)`, `ChangeItemStatus(itemId, status)`, `LinkItemToAppointment(itemId,
appointmentId)`.

### AppService (`ITreatmentPlanAppService`)
| Method | Ghi chú |
|---|---|
| `GetAsync(id)` | dùng `ITreatmentPlanRepository.GetWithDetailsAsync` (custom repository, đúng pattern `IAppointmentRepository`) — include `Items` |
| `GetListAsync(GetTreatmentPlanListDto)` | phân trang, filter `PatientId`/`Status` — lấy `Items` cho cả trang qua 1 lần gọi `ITreatmentPlanRepository.GetListWithDetailsAsync(ids)` (1 query `Include(Items).Where(Contains(ids))`), không loop gọi `GetWithDetailsAsync` từng id (tránh N+1: 1 trang 20 kế hoạch trước đây chạy 20+ query riêng lẻ) |
| `CreateAsync` / `UpdateAsync` | `UpdateAsync` diff `Items` theo `Id` — item không có `Id` là mới (Add), có `Id` là sửa (Update), `Id` cũ không có trong danh sách gửi lên là bị xoá (Remove) — đúng pattern `AppointmentAppService.ApplyPrescriptionItems` |
| `ChangeStatusAsync(id, ChangeTreatmentPlanStatusDto)` | đổi trạng thái cả kế hoạch |
| `ChangeItemStatusAsync(id, itemId, ChangeTreatmentPlanItemStatusDto)` | đổi trạng thái 1 bước, route `POST .../{id}/change-item-status/{itemId}` |
| `LinkItemToAppointmentAsync(id, itemId, LinkTreatmentPlanItemToAppointmentDto)` | gán/gỡ `AppointmentId` cho 1 bước, route `POST .../{id}/link-item-to-appointment/{itemId}` — validate `Appointment` tồn tại nếu có giá trị |
| `DeleteAsync` | |

### Permission
Nhóm `TreatmentPlans` (`Default`, `Create`, `Update`, `Delete`).

### UI
`TreatmentPlansPanel` (component, nhúng vào tab "Kế hoạch điều trị" của
`PatientDetailPage`): danh sách kế hoạch dạng card, mỗi card có Select đổi `Status` kế
hoạch ngay trên header, bảng con hiển thị `Items` sắp xếp theo `StepOrder` với Select đổi
`Status` từng bước và nút gắn/gỡ lịch hẹn (mở Select chọn từ lịch hẹn của bệnh nhân, gọi
`LinkItemToAppointmentAsync`) ngay trên bảng. Dialog tạo/sửa quản lý `Items` động (thêm/
xoá dòng — mỗi dòng có STT, mô tả, Select dịch vụ optional, chi phí dự kiến), đúng pattern
quản lý đơn thuốc trong `AppointmentsPage.tsx`. Xoá kế hoạch qua `ConfirmDialog`.

---

## ConsentForm (Phiếu đồng ý điều trị) — cùng module Appointment

**Route**: không có trang riêng — mở qua `ConsentFormsDialog` từ nút hành động trên mỗi
dòng của bảng `AppointmentsPage.tsx`. Tái dùng gần như nguyên vẹn pattern
`AppointmentPhoto` (cùng cơ chế `IBlobContainer`), chỉ đổi loại file cho phép và gắn thêm
`FormTitle`/`SignedAt`.

### Entity `ConsentForm` (aggregate root riêng, `CreationAuditedAggregateRoot<Guid>`)
Chỉ audit tạo, không sửa sau khi ký — đúng bản chất văn bản đã ký không được chỉnh sửa.

| Field | Ghi chú |
|---|---|
| `AppointmentId` | FK bắt buộc |
| `BlobName`, `FileName` (≤256), `ContentType` (≤128), `SizeBytes` | |
| `FormTitle` | bắt buộc, ≤256 (vd "Đồng ý nhổ răng khôn") |
| `SignedAt` | DateTime UTC — ngày ký thực tế, có thể khác ngày tải file lên |

Giới hạn: PDF/JPEG/PNG, tối đa 10MB (`ConsentFormConsts`) — thêm PDF so với
`AppointmentPhotoConsts` vì văn bản ký thường là bản scan PDF. Lưu blob trong PostgreSQL
qua `IBlobContainer<ConsentFormContainer>` (container riêng `dentify-consent-forms`, cùng
provider Database).

### AppService (`IConsentFormAppService`)
`GetListAsync(appointmentId)`, `UploadAsync(appointmentId, UploadConsentFormInput { FormTitle,
SignedAt, File })`, `DownloadAsync(id)`, `DeleteAsync(id)` — cấu trúc y hệt
`IAppointmentPhotoAppService`.

### Permission
Nhóm `ConsentForms` (`Upload`, `Delete` — không có `Create`/`Update` vì bản chất là upload
file, không sửa được sau khi tạo).

### UI
`ConsentFormsDialog` (mirror `AppointmentPhotosDialog`): form tải lên có thêm ô "Tiêu đề
phiếu" bắt buộc và "Ngày ký", danh sách phiếu đã tải kèm nút tải xuống/xoá. Mở từ icon
`FileText` mới trong hàng hành động của `AppointmentsPage.tsx`.

---

## Supply / SupplyUsage (Quản lý vật tư — có tính tồn kho tự động)

**Route**: `/supplies` (trong sidebar menu). Có tính tồn kho tự động — `SupplyUsage` trừ
trực tiếp `Supply.Quantity` (quyết định chốt ở Đợt 4, giống cách `Payment` cộng vào
`Appointment.PaidAmount`).

### Entity `Supply` (aggregate root, `FullAuditedAggregateRoot<Guid>`)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `Name` | string | bắt buộc, ≤256 |
| `Unit` | string | bắt buộc, ≤32 — đơn vị tính (vd "hộp", "cái", "ml") |
| `Quantity` | decimal | tồn kho hiện tại, khởi tạo `0`, không cho âm |
| `LowStockThreshold?` | decimal | ngưỡng cảnh báo tồn thấp, optional, đơn giản không cấu hình phức tạp |
| `IsActive` | bool | mặc định true — ngừng dùng thay xoá cứng |

Domain method: `SetName`, `SetUnit`, `SetLowStockThreshold`, `Activate()`/`Deactivate()`,
`IncreaseQuantity(amount)` (nhập kho — throw `AbpException` nếu `amount <= 0`),
`DecreaseQuantity(amount)` (xuất kho — throw `AbpException` nếu `amount <= 0`, throw
`BusinessException(InsufficientSupplyQuantity)` nếu `amount > Quantity`).

### Entity `SupplyUsage` (aggregate root riêng, `CreationAuditedAggregateRoot<Guid>`)
Aggregate độc lập (không phải entity con của `Supply`) — vì log sử dụng tăng vô hạn theo
thời gian, đúng lý do `ToothRecordHistory` tách khỏi `ToothChart`. Ghi nhận 1 lần dùng,
không sửa sau khi tạo.

| Field | Ghi chú |
|---|---|
| `SupplyId` | FK bắt buộc |
| `Quantity` | decimal, > 0 |
| `AppointmentId?` | FK optional — gắn với lịch hẹn cụ thể nếu có, chọn qua Select trong dialog "Ghi nhận sử dụng" (option "Không liên kết" mặc định) |
| `UsedAt` | DateTime UTC |
| `Notes?` | ≤512 |

### AppService (`ISupplyAppService`)
`GetAsync`, `GetActiveListAsync()` (không phân trang, cho Select), `CreateAsync`/
`UpdateAsync`/`ActivateAsync`/`DeactivateAsync`/`DeleteAsync`,
`RestockAsync(id, RestockSupplyDto { Quantity })` → gọi `IncreaseQuantity`.

### AppService (`ISupplyUsageAppService`)
| Method | Ghi chú |
|---|---|
| `GetListAsync(GetSupplyUsageListDto)` | phân trang, filter `SupplyId`/`AppointmentId`, join `SupplyName` |
| `CreateAsync(CreateSupplyUsageDto)` | load `Supply`, gọi `DecreaseQuantity(quantity)`, lưu `Supply`, rồi insert `SupplyUsage` — AppService điều phối 2 aggregate trong 1 lần gọi, đúng nguyên tắc DDD giống `ToothChartAppService.UpdateStatusAsync` |
| `DeleteAsync(id)` | hoàn tác — `supply.IncreaseQuantity(usage.Quantity)` rồi mới xoá `SupplyUsage`, tránh sai lệch tồn kho khi xoá nhầm |

### Permission
Nhóm `Supplies` (`Default`, `Create`, `Update`, `Delete`).

### UI
**SuppliesPage** (`/supplies`): bảng vật tư (tên, đơn vị, tồn kho — badge đỏ "Sắp hết
hàng" nếu `Quantity <= LowStockThreshold`), dialog tạo/sửa, nút "Nhập kho" (dialog nhập số
lượng, gọi `RestockAsync`), nút "Ghi nhận sử dụng" (dialog chọn vật tư + Select "Lịch hẹn
liên quan" optional (tải danh sách lịch hẹn gần đây qua `appointmentsApi.getList`, mặc
định "Không liên kết") + số lượng + ngày dùng + ghi chú, gọi
`SupplyUsageAppService.CreateAsync`), toggle Kích hoạt/Ngừng sử dụng, xoá qua
`ConfirmDialog`.

---

## InsurancePolicy (Bảo hiểm y tế) — cùng module Patient

**Route**: tab "Bảo hiểm" trong `PatientDetailPage.tsx`. **Chỉ hồ sơ thông tin, không đụng
tiền** — quyết định chốt ở Đợt 4: không có field/method nào liên quan `Appointment` hoặc
`Payment`, không có claim workflow, đúng tinh thần roadmap gốc.

### Entity `InsurancePolicy` (aggregate root riêng, `FullAuditedAggregateRoot<Guid>`)
Không phải entity con của `Patient` — 1 bệnh nhân có thể có nhiều bảo hiểm/nhiều thời kỳ,
tương tự lý do `WaitlistEntry` độc lập.

| Field | Kiểu | Ghi chú |
|---|---|---|
| `PatientId` | Guid | FK bắt buộc |
| `ProviderName` | string | bắt buộc, ≤128 — tên hãng bảo hiểm |
| `PolicyNumber` | string | bắt buộc, ≤64 — số thẻ |
| `EffectiveDate` | DateTime | UTC |
| `ExpiryDate?` | DateTime | UTC, optional |
| `Notes?` | string | ≤1000 |

Domain method: `SetProviderName`, `SetPolicyNumber`, `SetDates(effectiveDate,
expiryDate)` — throw `BusinessException(InsurancePolicyExpiryBeforeEffective)` nếu
`expiryDate < effectiveDate` — `SetNotes`.

### AppService (`IInsurancePolicyAppService`)
`GetListAsync(patientId)` (không phân trang — số bảo hiểm/bệnh nhân luôn nhỏ),
`CreateAsync`/`UpdateAsync`/`DeleteAsync` — CRUD đơn giản nhất trong toàn bộ Đợt 4.

### Permission
Nhóm `InsurancePolicies` (`Default`, `Create`, `Update`, `Delete`).

### UI
Tab "Bảo hiểm" trong `PatientDetailPage.tsx`: bảng đơn giản (hãng, số thẻ, hiệu lực/hết
hạn — badge đỏ "Hết hạn" nếu `ExpiryDate < now`), dialog tạo/sửa, xoá qua `ConfirmDialog`.

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
hiển thị ở frontend** — backend luôn lưu/trả theo ISO 3950. Hệ hiển thị chọn qua Setting
`Dentify.Clinic.ToothNotationSystem` (mặc định `Iso3950`, cấu hình ở trang Cài đặt);
`frontend/src/lib/toothNotation.ts` chứa các hàm chuyển đổi thuần (`toPalmer`,
`toUniversal`) áp dụng ở `ToothChartSvg` (nhãn mỗi răng) và tiêu đề dialog cập nhật.

Dialog cập nhật trạng thái răng có `Select` chọn lịch hẹn liên quan (optional, load danh
sách lịch hẹn của bệnh nhân qua `appointmentsApi.getList`) — set `appointmentId` khi gọi
`UpdateStatusAsync`, backend đã hỗ trợ trường này từ trước.

---

## LabWork (Ca gửi labo ngoài)

**Route**: `/lab-works` (Kanban board).

### Entity `LabWork` (aggregate root)

| Field | Ghi chú |
|---|---|
| `PatientId` | bắt buộc |
| `AppointmentId` | optional — `LabWorkDto.AppointmentScheduledDateTime` (backend join sẵn trong `MapToDtosAsync`, không lưu DB) hiển thị ngày giờ hẹn liên quan trên Card board, không click-through sang trang Appointment |
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
cảm ứng). Ô tìm kiếm theo tên bệnh nhân/tên labo, cộng thêm `Select` lọc theo `WorkType`
(danh sách loại việc suy ra từ dữ liệu board đã tải) — cả 2 đều lọc client-side. Optimistic
update khi đổi trạng thái, `loadData()` lại nếu API lỗi.

---

## Expense (Chi phí)

**Route**: `/expenses`.

### Entity `Expense` (aggregate root, liên kết optional tới LabWork)

| Field | Ghi chú |
|---|---|
| `ExpenseDate` | UTC |
| `Amount` | decimal, tối thiểu 0.01 |
| `Category` | enum `ExpenseCategory`: `Lab, Supplies, Salary, Rent, Utilities, Marketing, Other` |
| `Description?` | tối đa 512 |
| `LabWorkId?` | optional FK tới `LabWork`, `ON DELETE SET NULL` — không bắt buộc kể cả với `Category = Lab`; link qua LabWork là đủ để truy ngược Appointment (LabWork đã có `AppointmentId`), không cần thêm `Expense.AppointmentId` riêng |

### AppService (`IExpenseAppService`)
`GetSummaryAsync(fromDate, toDate)` trả `ExpenseSummaryDto` (tổng + group theo category)
— dùng cho Dashboard và trang Chi phí (biểu đồ cột ngang bằng `recharts`, cùng pattern với
"Dịch vụ phổ biến" ở trang Thống kê). `GetListAsync` hỗ trợ filter thêm theo `LabWorkId`.

### UI
Bảng danh sách, bộ lọc danh mục + khoảng ngày (server-side), dialog thêm/sửa có `Select`
chọn ca labo liên quan (optional, tải qua `labWorksApi.getBoard()`), cột "Labo liên quan"
trong bảng, biểu đồ chi phí theo danh mục (12 tháng gần nhất) ở đầu trang, Import/Export
CSV (không có cột LabWork trong CSV — liên kết chỉ chỉnh qua UI).

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
Management (global scope, không theo tenant/user), cộng với 1 blob container riêng cho
logo upload trực tiếp (đợt dọn dẹp tồn đọng sau roadmap 13 mục).

| Setting key | Mặc định |
|---|---|
| `Dentify.Clinic.Name` | `"Dentify"` |
| `Dentify.Clinic.Address` | — |
| `Dentify.Clinic.PhoneNumber` | — |
| `Dentify.Clinic.LogoUrl` | — |
| `Dentify.Clinic.HasUploadedLogo` | `"false"` — cờ đánh dấu đã có logo upload trực tiếp (khác `LogoUrl` là nhập tay) |
| `Dentify.Clinic.ToothNotationSystem` | `"Iso3950"` — 1 trong 3 giá trị `Iso3950`/`Palmer`/`Universal`, validate bằng `RegularExpression` ở `UpdateClinicSettingsDto`; chỉ ảnh hưởng hiển thị số răng ở frontend (xem mục ToothChart) |

`IClinicSettingsAppService`: `GetAsync()`/`UpdateAsync()` (thông tin text + `LogoUrl` nhập
tay), `UploadLogoAsync(IRemoteStreamContent)` (validate JPEG/PNG/WEBP, tối đa 2MB —
`ClinicLogoConsts`, lưu blob tên cố định `"logo"` qua
`IBlobContainer<ClinicLogoContainer>`, ghi đè khi upload mới — chỉ giữ 1 logo tại 1 thời
điểm, không có lịch sử), `DownloadLogoAsync()`. UI: nút "Tải logo lên" (upload trực tiếp,
ưu tiên hiển thị nếu có) cạnh input "URL logo ngoài" (giữ nguyên cho ai muốn dùng link
ngoài thay vì upload) — 2 cách cùng tồn tại song song, không loại trừ nhau.

---

## Statistics (Thống kê)

**Route**: `/statistics`. Không có entity riêng — AppService chỉ đọc/tổng hợp từ
`Appointment`, `Payment`, `Doctor`, `Service`, `IdentityUser`.

### AppService (`IStatisticsAppService`)
| Method | Cách tính |
|---|---|
| `GetRevenueOverviewAsync(fromDate, toDate)` | tổng `Payment.Amount` (tiền **thực nhận**, không phải giá dịch vụ) theo ngày trong khoảng, so sánh với kỳ liền trước cùng độ dài để tính `GrowthPercentage` |
| `GetServiceStatisticsAsync` | group theo `ServiceId`, join tên qua `Service.Name`, đếm số ca + tổng `PaidAmount` (dịch vụ chưa gán → 1 dòng "Chưa phân loại") — đổi tên từ `GetTreatmentTypeStatisticsAsync` ở Đợt 2 |
| `GetDoctorStatisticsAsync` | group theo `DoctorId`, join tên 2 tầng `Doctor.IdentityUserId → IdentityUser.Name` (bác sĩ chưa gán → 1 dòng "Chưa phân công", không loại bỏ) — **đã fix bug join thẳng `DoctorId` vào `IdentityUser` ở Đợt 2**, sai từ khi Đợt 1 đổi `DoctorId` thành FK tới `Doctor.Id` |

### UI
Chọn khoảng thời gian nhanh (7 ngày/30 ngày/tháng này). `LineChart` doanh thu theo ngày +
badge tăng trưởng (recharts). `BarChart` ngang top 6 dịch vụ phổ biến + bảng đầy đủ. Bảng
theo bác sĩ.

---

## PatientPortal (Cổng bệnh nhân — Đợt 5, đọc-only)

**Route**: `/portal/*` trong CÙNG 1 Vite app với SPA nhân viên (không tách repo/build
riêng) — route group độc lập, OIDC client riêng `Dentify_PatientPortal`, context React
auth riêng (`PatientPortalAuthProvider`), không dùng chung `AppLayout`/sidebar nhân viên.
**Chỉ xem, không tự đặt lịch/sửa hồ sơ** — quyết định chốt ở Đợt 5, tối giản hoá phạm vi.
Tài khoản do admin tạo qua Identity Management (Razor có sẵn của ABP) + gán Role `Patient`
+ gọi `PatientAppService.LinkIdentityUserAsync` — **không có luồng tự đăng ký**.

### Role & Permission
Role `Patient` (seed qua `ClinicRoleDataSeedContributor`) chỉ có đúng 1 permission
`PatientPortal.Default` — **không có bất kỳ permission `Patients.*`/`Appointments.*`**
nhân viên nào, tránh lộ quyền staff cho tài khoản bệnh nhân.

### AppService (`IPatientPortalAppService`) — tách hoàn toàn khỏi AppService nhân viên
Không tái dùng `IAppointmentAppService`/`IPatientAppService` — lý do: (1) tránh lộ chéo
endpoint ghi nếu sau này ai thêm method mới vào AppService nhân viên mà quên xét quyền,
(2) mọi response tự lọc theo `Patient` gắn với `CurrentUser.Id` đang đăng nhập (tra qua
`Patient.IdentityUserId`), **không nhận `patientId` làm tham số từ client** — chặn IDOR
(bệnh nhân A không thể sửa query để xem dữ liệu bệnh nhân B).

| Method | Ghi chú |
|---|---|
| `GetMyProfileAsync()` | tên, ngày sinh, SĐT/email liên hệ |
| `GetMyAppointmentsAsync(upcoming)` | danh sách rút gọn — **không trả** `PreOpNotes`/`PostOpNotes` (ghi chú lâm sàng nội bộ) hay đơn thuốc |
| `GetMyTreatmentHistoryAsync()` | các Appointment `Completed` |
| `GetMyBalanceAsync()` | tổng công nợ (loại trừ Appointment Cancelled — cùng quy tắc `PatientAppService.GetPatientDetailAsync`), tự tính lại trong scope Portal (không gọi chéo `PatientAppService`) |

Helper `GetCurrentPatientIdAsync()` (private) — throw
`BusinessException(PatientPortalAccountNotLinked)` nếu tài khoản đăng nhập chưa được
admin gán link Patient nào.

### OIDC client thứ 2
`OpenIddictDataSeedContributor` seed thêm `Dentify_PatientPortal` (Authorization Code +
PKCE, cùng kiểu `Dentify_App`) — RedirectUri riêng đọc từ
`OpenIddict:Applications:Dentify_PatientPortal:RootUrl`, tách biệt hoàn toàn khỏi client
nhân viên để đổi 1 bên không ảnh hưởng bên kia.

### UI
`PatientPortalAuthProvider` (context React riêng, `UserManager` thứ 2 từ
`patientPortalUserManager.ts`) bọc route `/portal/*`; `PortalProtectedRoute` (bản sao
`ProtectedRoute`, tự redirect sang đăng nhập nếu chưa auth — không có trang login riêng).
`PortalLayout` (header đơn giản, không sidebar) bọc 2 trang: `PortalDashboardPage` (hồ sơ
+ công nợ — badge "Đã thanh toán đủ" nếu `totalDebt <= 0` thay vì cảnh báo nợ + xem trước
vài lịch hẹn sắp tới) và `PortalAppointmentsPage` (Tabs "Sắp tới"/"Lịch sử điều trị",
bảng thuần thông tin, không có hành động nào). `lib/patient-portal-api.ts` đọc token từ
`patientPortalUserManager` riêng, không dùng chung `lib/api.ts` của SPA nhân viên.

---

## Quản lý người dùng & phân quyền (`/users`, `/roles`)

Không có entity/AppService riêng của Dentify — dùng thẳng module `Volo.Abp.Identity` +
`Volo.Abp.PermissionManagement` có sẵn trong ABP Framework, đã tự động expose REST API
qua HttpApi module (không cần code backend mới). Đây là UI React thay thế Razor Pages
`/Identity/Users` mặc định của ABP, để admin không phải rời khỏi giao diện chính.

### API dùng (có sẵn từ ABP, không phải Dentify)
| Method | Route | Ghi chú |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/identity/users` | CRUD tài khoản, `GET` hỗ trợ `filter` (tên/email/username chứa chuỗi) |
| `GET/PUT` | `/api/identity/users/{id}/roles` | lấy/gán danh sách role của 1 user |
| `GET` | `/api/identity/users/assignable-roles` | toàn bộ role có thể gán (4 role Dentify + `admin`) |
| `GET` | `/api/identity/roles/all` | toàn bộ role (dùng cho tab chọn role ở trang Vai trò) |
| `GET/PUT` | `/api/permission-management/permissions?providerName=R&providerKey={roleName}` | lấy/lưu ma trận quyền theo role — `providerName="R"` cố định (role), không dùng `"U"` (user) trong UI này |

### Vai trò hệ thống
- **4 role nghiệp vụ Dentify** (seed sẵn qua `ClinicRoleDataSeedContributor`): Doctor,
  Receptionist, Accountant, Patient — mỗi role có permission `Dentify.*` gán trước, admin
  có thể chỉnh lại qua trang `/roles`.
- **Role `admin`** — built-in tĩnh (`isStatic: true`) của ABP Identity, gán sẵn cho
  `admin@abp.io`, có toàn quyền bao gồm `AbpIdentity.*`/`PermissionManagement.*`. Chỉ
  role này thấy được menu "Người dùng"/"Vai trò & phân quyền" trên sidebar (ẩn/hiện qua
  claim `role` trong `user.profile`, xem `AppLayout.tsx`).
- **Không cho tạo Role mới** từ UI này (quyết định phạm vi có chủ đích) — chỉ 4 role
  Dentify + `admin` là cố định.

### UI
- **UsersPage** (`/users`): bảng danh sách tài khoản (Họ tên, Username/Email, Vai trò —
  badge list, Trạng thái — badge theo `isActive`, Hành động: Sửa/Khoá-Mở khoá/Xoá). Ô tìm
  kiếm gọi lại `getList({ filter })`. Dialog tạo/sửa gồm `userName`, `email`, `name`,
  `surname`, `phoneNumber`, checkbox "Đổi mật khẩu" (chỉ hiện khi sửa, tránh vô tình đổi
  mật khẩu mỗi lần sửa thông tin khác), multi-checkbox chọn role (load qua
  `assignable-roles`). Admin tự đặt mật khẩu tạm lúc tạo — **không gửi email kích hoạt**
  (dự án chưa có SMTP thật, `NullEmailSender` sẽ âm thầm không gửi được).
- **RolesPage** (`/roles`): Tab chọn 1 trong các role có sẵn → hiện ma trận quyền nhóm
  theo `group.displayName` (nhóm `Dentify` gồm toàn bộ `Patients.*`/`Appointments.*`/...,
  cộng các nhóm ABP khác như `Identity`, `PermissionManagement` nếu role đó có quyền liên
  quan). Checkbox "Chọn tất cả" ở header mỗi nhóm. Nút "Lưu thay đổi" gọi
  `updateForRole` với danh sách `{ name, isGranted }` đã đổi. Không có nút tạo role mới.

### Bảo mật
Ẩn/hiện menu theo role `admin` **chỉ là UX**, không phải lớp bảo mật — như mọi trang
khác trong app, bảo mật thật do `[Authorize(AbpIdentity.Users.Default)]`/
`[Authorize(AbpIdentity.Roles.Default)]`/`[Authorize(PermissionManagement.*)]` phía
backend chặn nếu gọi thẳng API mà thiếu quyền. Hiện chỉ `admin@abp.io` có các quyền này.

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
