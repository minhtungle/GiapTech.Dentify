# PROGRESS — Nhật ký tiến độ GiapTech.Dentify

> Ghi lại **đang làm gì, tới đâu, quyết định gì**. Cập nhật & commit file này trước khi chuyển máy
> để máy khác `git pull` là nắm được ngay. Mục mới nhất để trên cùng.
>
> File này là **nhật ký theo thời gian**. Để biết **trạng thái hiện tại** của hệ thống
> (kiến trúc, chức năng từng module, luồng nghiệp vụ, cách triển khai) mà không phải đọc
> lại toàn bộ lịch sử, xem bộ tài liệu **`docs/architecture/*.md`** (6 file, cập nhật lại
> mỗi khi kiến trúc/chức năng thay đổi đáng kể — không phải nhật ký, là ảnh chụp trạng
> thái mới nhất).

## Trạng thái tổng quát

- [x] Khởi tạo solution ABP layered (.NET 10) — scaffold template
- [x] Thiết lập Git + tài liệu đồng bộ giữa các máy (CLAUDE.md, PROGRESS.md)
- [x] Giai đoạn 1 (MVP): Patient module + Appointment module cơ bản + Identity/Permission
- [x] Đổi kiến trúc: DB → PostgreSQL, frontend nghiệp vụ tách riêng (React + shadcn/ui,
      OAuth2 PKCE), backend chỉ còn AuthServer + API + admin Razor, toàn bộ triển khai
      qua Docker Compose
- [x] Giai đoạn 2 (xong): Tooth Chart module (SVG interactive), Photo upload cho
      Appointment (IBlobContainer, lưu DB), Prescription chi tiết (bảng PrescriptionItem
      thay text tự do).
- [x] Giai đoạn 3 (xong): LabWork (theo dõi ca labo ngoài + Kanban board kéo-thả trạng
      thái) + Expense (sổ chi phí theo danh mục).
- [x] Giai đoạn 4 (xong): Import/Export CSV (Patient + Expense, xử lý ở frontend),
      Backup/Restore qua script `pg_dump`/`pg_restore`, Settings (thông tin phòng khám
      qua ABP Setting Management).
- [x] Hoàn thiện UI/UX (xong): audit toàn diện 7 trang + fix — sửa 1 bug mất dữ liệu
      thật, sidebar responsive mobile, skeleton loading, empty state có CTA, AlertDialog
      thay window.confirm, accessibility cho sơ đồ răng (bàn phím/screen reader).
- [x] Bổ sung theo yêu cầu (xong): Calendar view cho Lịch hẹn (FullCalendar, kéo-thả đổi
      giờ), trang chủ Dashboard (tổng quan bệnh nhân/lịch hẹn/labo/chi phí), module
      Công việc (Task/to-do độc lập, phong cách tối giản kiểu Notion).
- [x] Polish Calendar/Dashboard/Task (xong): fix bug locale tiếng Việt của FullCalendar,
      Dashboard chịu lỗi từng phần (Promise.allSettled), Task sửa touch-device + a11y
      checkbox, Calendar responsive mobile.
- [x] Thanh toán nhiều lần + In hoá đơn + Thống kê (xong): entity `Payment` (lịch sử thu
      tiền), `TreatmentType` trên Appointment, trang in hoá đơn HTML, trang Thống kê
      (doanh thu theo thời gian + tăng trưởng, xếp hạng loại hình khám, theo bác sĩ).
- [x] Rà soát quy trình + Giai đoạn A (xong): đối chiếu với chuẩn ngành PMS nha khoa
      (Dentrix/Open Dental/Curve/tab32), sau đó triển khai bộ lọc nhất quán cho 4 trang,
      trang chi tiết bệnh nhân (liên kết chéo Lịch hẹn/Thanh toán/Ca labo/Sơ đồ răng),
      Dashboard bổ sung doanh thu + cảnh báo vận hành — không cần entity mới.
- [x] Giai đoạn B (xong): cảnh báo dị ứng/bệnh nền có cấu trúc trên Patient, nhắc tái
      khám định kỳ (recall), theo dõi no-show theo bệnh nhân — cảnh báo hiện ở hồ sơ
      bệnh nhân, dialog tạo lịch hẹn, và Dashboard.
- [ ] Roadmap 13 mục còn thiếu (đã lên kế hoạch, CHƯA triển khai) — xem mục nhật ký
      "Roadmap 5 đợt" dưới đây. Đợt 1 (Doctor entity + Role phân quyền + Duration) là
      điểm bắt đầu theo đúng thứ tự phụ thuộc đã chốt, chưa có đợt nào được code.
- [x] Bộ tài liệu kiến trúc `docs/architecture/*.md` (xong): 6 file tổng hợp toàn bộ
      chức năng/luồng nghiệp vụ/kiến trúc kỹ thuật/vận hành/quy ước hiện có, thay cho việc
      phải đọc lại toàn bộ nhật ký này để nắm trạng thái hệ thống.
- [ ] Giai đoạn 5 (tuỳ chọn): AI voice-to-note, AI scan hoá đơn

## Nhật ký

### 2026-07-07 (9) — Bộ tài liệu kiến trúc `docs/architecture/*.md` (6 file)

User yêu cầu tổng hợp toàn bộ kiến trúc hệ thống (chức năng, luồng nghiệp vụ, thiết kế
công nghệ, triển khai/cài đặt) thành bộ tài liệu lưu trong `docs/` để nắm bắt chắc chắn
thông tin hệ thống — khác với `docs/PROGRESS.md` (nhật ký theo thời gian), đây cần là
tài liệu theo cấu trúc chủ đề, phản ánh trạng thái mới nhất. Xác nhận qua
AskUserQuestion: chia 6 file theo chủ đề (không dồn 1 file dài).

- **Cấu trúc 6 file trong `docs/architecture/`**: `01-tong-quan-he-thong.md` (kiến trúc
  tổng thể, sơ đồ ASCII, trạng thái hiện tại, roadmap), `02-dac-ta-chuc-nang.md` (từng
  module: entity/field/business rule/API/UI — dài nhất, ~340 dòng), `03-luong-nghiep-vu.md`
  (luồng thao tác người dùng dạng code block step-by-step, bao gồm cả các bug/gotcha đã
  từng xảy ra trong đúng luồng đó), `04-kien-truc-ky-thuat.md` (stack, quy tắc entity lặp
  lại toàn hệ thống, database schema, multi-tenancy, auth chi tiết, testing), `05-trien-
  khai-van-hanh.md` (yêu cầu môi trường, 2 cách chạy, Dockerfile, backup/restore, CI/CD),
  `06-quy-uoc-phat-trien.md` (quy trình thêm entity mới, quy tắc frontend bắt buộc, cách
  verify, gotcha môi trường).
- **Khảo sát nguồn**: chạy 3 agent Explore song song đọc code thật (không suy diễn) —
  toàn bộ Domain/Application.Contracts/Application/EntityFrameworkCore/Permissions cho
  backend; toàn bộ routes/pages/components/lib/types cho frontend; toàn bộ
  docker-compose.yml, Dockerfile, appsettings, scripts backup/restore, CI/CD, cấu hình
  test cho hạ tầng. Một trong các agent (do gọi nhầm loại agent lúc kiểm tra tiến độ)
  tình cờ xác nhận lại: **Giai đoạn B đã build/test pass (49/49 EfCoreTests) nhưng tại
  thời điểm viết tài liệu này vẫn CHƯA được `git commit`** — bộ tài liệu mới phản ánh
  đúng code trên đĩa (bao gồm phần chưa commit), đã ghi rõ điều này ngay trong
  `01-tong-quan-he-thong.md` để không ai nhầm là đã đồng bộ git.
- **Phát hiện đáng chú ý qua khảo sát, đưa vào tài liệu làm cảnh báo lâu dài** (không
  phải bug mới, nhưng lần đầu được viết thành quy tắc rõ ràng thay vì chỉ nằm rải rác
  trong các mục nhật ký cũ):
  - `AbpMultiTenancyOptions.IsEnabled = true` nhưng **không entity nghiệp vụ nào
    implement `IMultiTenant`** — hạ tầng multi-tenant có sẵn từ ABP template nhưng chưa
    thực sự cách ly dữ liệu theo tenant, hệ thống đang vận hành như 1 tenant duy nhất.
  - `Appointment.DoctorId` chỉ là `Guid?` rời, không FK — xác nhận lại đúng như đã ghi
    trong roadmap Đợt 1, nay được ghi thành quy tắc "đọc trước khi thêm entity mới" ở
    `04-kien-truc-ky-thuat.md`.
  - Node.js: README ghi "v18 or 20" nhưng `frontend/Dockerfile` build bằng
    `node:22-alpine` — có mâu thuẫn giữa tài liệu cũ và thực tế, đã ghi rõ trong
    `05-trien-khai-van-hanh.md` để ưu tiên theo Dockerfile khi có xung đột.
  - Test backend chạy **hoàn toàn in-memory qua SQLite** (không Testcontainers, không
    Postgres thật) — trước đây không có nơi nào ghi rõ điều này, nay là mục riêng trong
    `04-kien-truc-ky-thuat.md` để biết `dotnet test` không cần Docker.
  - Chưa có CI/CD (`.github/workflows/` không tồn tại) — ghi rõ để không giả định nhầm.
- **`CLAUDE.md` được viết lại, rút ngắn đáng kể**: thay toàn bộ phần chi tiết (cấu trúc
  layer, cấu hình chính, quy trình thêm tính năng) bằng bảng trỏ sang 6 file
  `docs/architecture/*.md` tương ứng — tránh 2 nơi cùng giữ 1 thông tin rồi lệch nhau
  theo thời gian. Giữ lại phần thiết yếu nhất cho AI agent mở dự án lần đầu: lệnh chạy
  nhanh, build/test, và lưu ý đồng bộ git.
- Chưa làm: chưa có cơ chế tự động phát hiện khi `docs/architecture/*.md` bị lỗi thời so
  với code (không có test/lint kiểm tra đồng bộ tài liệu-code) — việc cập nhật lại các
  file này khi đổi kiến trúc vẫn hoàn toàn dựa vào việc chủ động nhớ làm, đã ghi thành
  quy tắc ở `06-quy-uoc-phat-trien.md` nhưng không có gì cưỡng ép.

### 2026-07-07 (8) — Roadmap 5 đợt cho 13 mục còn thiếu (chỉ lên kế hoạch, chưa code)

User yêu cầu lên kế hoạch triển khai toàn bộ 13 mục còn lại từ báo cáo rà soát ban đầu
(sau khi Giai đoạn A/B đã giải quyết 3/16 mục: recall, no-show, dị ứng/bệnh nền). Đây là
roadmap thuần — **không có dòng code nào được viết trong mục này**, chỉ khảo sát kiến
trúc hiện tại để xếp đúng thứ tự phụ thuộc, tránh làm mục sau trước mục nó phụ thuộc vào.

- **Khảo sát xác nhận trước khi xếp thứ tự** (agent Explore đọc code thật, không suy
  diễn): `Appointment.DoctorId` là `Guid?` rời không FK — thêm entity Doctor không cần
  migrate đổi kiểu dữ liệu, chỉ thêm constraint; `Appointment` không có field thời lượng
  — điều kiện tiên quyết chung cho Waitlist và Multi-chair (cả 2 cần biết khung giờ chiếm
  dụng để tính slot trống/xung đột); `TreatmentType` là enum tĩnh không liên kết gì với
  `Price` (giá luôn nhập tay 100%) — muốn có "danh mục dịch vụ có giá" đúng nghĩa phải
  chuyển hẳn thành entity `Service`, vá bằng bảng map theo enum không giải quyết được vấn
  đề gốc (mỗi dịch vụ mới vẫn phải sửa code); ABP Identity Role có sẵn hạ tầng nhưng chưa
  được khai thác cho phân quyền lâm sàng — không cần dựng khái niệm mới; hạ tầng
  background job/email đã đăng ký qua ABP module nhưng đang no-op (`NullEmailSender`) —
  nhắc hẹn SMS/email phải viết từ đầu hoàn toàn, không có gì tái dùng; Patient Portal đụng
  trực tiếp kiến trúc auth hiện tại (1 client OIDC PKCE giả định toàn bộ user đăng nhập là
  nhân viên phòng khám, `ProtectedRoute` không đọc role/claim nào) — phức tạp nhất trong
  toàn bộ 13 mục.
- **Roadmap 5 đợt theo thứ tự phụ thuộc** (không phải lịch theo ngày — mỗi đợt là 1 phiên
  plan/duyệt riêng khi tới lượt, giống cách Giai đoạn A/B đã làm, quyết định của đợt trước
  ảnh hưởng trực tiếp cách thiết kế đợt sau nên không lên chi tiết trước):
  - **Đợt 1 (nền tảng, độc lập)**: entity `Doctor` (FK không breaking vào `Appointment.
    DoctorId` có sẵn, chặn double-booking theo bác sĩ); phân quyền theo vai trò lâm sàng
    (dùng ABP Role có sẵn, seed role Doctor/Receptionist/Accountant); thêm
    `Appointment.DurationMinutes` (điều kiện tiên quyết ngầm cho Đợt 3, không phải 1
    trong 13 mục gốc nhưng bắt buộc phải có trước).
  - **Đợt 2 (danh mục dịch vụ, nền cho Đợt 4)**: chuyển `TreatmentType` enum → entity
    `Service` có giá tham chiếu (migration tốn công nhất trong roadmap vì đụng trực tiếp
    dữ liệu Appointment hiện có, không chỉ đổi schema); danh mục thuốc chuẩn `Drug` (giữ
    song song với `DrugName` text tự do trên PrescriptionItem, không bắt buộc, không
    breaking đơn thuốc cũ).
  - **Đợt 3 (vận hành lịch, cần Đợt 1)**: Multi-chair (`Chair` entity + FullCalendar
    resource view, đã dùng FullCalendar từ trước); Waitlist (`WaitlistEntry`, gợi ý khi
    có lịch huỷ/dời); Referral tracking (nhẹ nhất, chỉ thêm field trên Patient).
  - **Đợt 4 (hồ sơ & tài chính mở rộng, cần Đợt 2)**: Treatment plan nhiều bước
    (`TreatmentPlan`/`TreatmentPlanItem` tham chiếu `ServiceId`); Consent form điện tử
    (tái dùng `IBlobContainer` đã có từ AppointmentPhoto); Bảo hiểm y tế (`InsurancePolicy`,
    chỉ ghi nhận đã áp dụng, không làm claim workflow tự động vì cần tích hợp ngoài);
    Quản lý vật tư/tồn kho (`Supply`/`SupplyUsage`, nhập tay giống cách Expense đang làm).
  - **Đợt 5 (mở rộng ra ngoài, phức tạp nhất, làm sau cùng)**: Nhắc hẹn SMS/email (viết
    `IEmailSender` thật thay no-op, thêm abstraction SMS, background job quét Appointment
    24-48h tới); Patient Portal (cần Đợt 1 làm nền — role Patient, liên kết
    `IdentityUser ↔ Patient` chưa tồn tại, tách API riêng chỉ trả dữ liệu của chính bệnh
    nhân, frontend route nhóm riêng không tái dùng `ProtectedRoute` hiện tại).
- **Cố tình không chốt trong roadmap này**: provider SMS/email thật, hãng bảo hiểm tích
  hợp, thiết kế UI chi tiết patient portal — đây là quyết định nghiệp vụ cần hỏi lại user
  riêng khi tới đúng đợt, không đoán trước.
- Chưa làm gì cả — đây là roadmap thuần, không có migration/entity/UI nào được tạo trong
  mục này. Bước tiếp theo khi được yêu cầu tiếp tục: hỏi user muốn bắt đầu từ Đợt nào
  (mặc định Đợt 1 theo đúng thứ tự phụ thuộc đã chốt), rồi mới vào `EnterPlanMode` chi
  tiết riêng cho đợt đó.

### 2026-07-07 (7) — Giai đoạn B: cảnh báo y tế, nhắc tái khám, theo dõi no-show

Tiếp nối Giai đoạn A. Báo cáo rà soát ban đầu xếp 3 việc này vào nhóm ưu tiên cao (an
toàn lâm sàng + giữ khách quay lại). Khác Giai đoạn A (chỉ khai thác dữ liệu có sẵn), lần
này cần thêm field mới trên `Patient` và 1 AppService method mới thực hiện truy vấn tổng
hợp toàn hệ thống. Xác nhận qua AskUserQuestion: tách riêng 2 field `Allergies` (dị ứng)
và `MedicalConditions` (bệnh nền) — đúng bản chất lâm sàng hơn 1 danh sách chung.

- **Domain — `Patient`**: thêm `List<string> Allergies`, `List<string>
  MedicalConditions`, theo đúng convention đã có cho `Tags` (`SetAllergies`/
  `SetMedicalConditions` — trim, loại trùng không phân biệt hoa/thường, giới hạn số
  lượng/độ dài qua `PatientConsts`). EF Core lưu dạng JSON string (`HasConversion` +
  `ValueComparer`), giống hệt cách `Tags` đã lưu.
  **Bug thật phát hiện lúc verify (không phải lỗi code logic, lỗi migration)**: migration
  ban đầu set `defaultValue: ""` cho 2 cột mới — nhưng converter đọc lại bằng
  `JsonSerializer.Deserialize<List<string>>(json)`, và `""` không phải JSON hợp lệ (JSON
  hợp lệ cho list rỗng là `"[]"`). Hậu quả: **mọi** request đọc lại các Patient đã tồn tại
  trước migration (kể cả `GetListAsync` bình thường) bị lỗi 500
  (`System.Text.Json.JsonException: The input does not contain any JSON tokens`) — phát
  hiện qua Playwright thật (`GET /api/app/patient` trả lỗi ngay khi mở trang Bệnh nhân),
  không phải qua test tự động (test luôn tạo Patient mới sau khi đã fix, không đi qua
  đường dữ liệu cũ). Fix 2 phần: sửa `defaultValue` trong file migration thành `"[]"`
  (đúng cho các lần deploy mới), và chạy `UPDATE` tay 1 lần trên DB hiện tại để sửa các
  dòng Patient cũ đã bị ghi `""` từ trước khi phát hiện bug — vì sửa file migration không
  tự động sửa lại dữ liệu đã insert.
- **Nhắc tái khám (recall)** — không thể ghép từ API list hiện có mà không tải toàn bộ
  Appointment về client, nên đây là ngoại lệ hợp lý duy nhất đi ngược nguyên tắc "không
  entity/API mới" của Giai đoạn A: `PatientAppService.GetRecallListAsync(int
  monthsThreshold)` mới — group toàn bộ Appointment theo `PatientId`, lấy
  `MAX(ScheduledDateTime)` trong các Appointment `Completed`, lọc bệnh nhân có lần khám
  gần nhất quá `monthsThreshold` tháng **và** chưa có Appointment `Scheduled` nào trong
  tương lai. Ngưỡng hardcode 6 tháng (`PatientConsts.RecallMonthsThreshold`), giống cách
  `UNPAID_ALERT_DAYS` đã hardcode ở Dashboard Giai đoạn A — không cấu hình qua Settings ở
  giai đoạn này.
- **No-show theo bệnh nhân** — tính suy ra (derived), không lưu counter riêng để tránh
  out-of-sync. `PatientAppService.GetPatientDetailAsync` đã load toàn bộ Appointment theo
  `PatientId` để tính `totalDebt`/`lastAppointmentDate` từ trước — chỉ thêm 1 dòng
  `Count(a => a.Status == AppointmentStatus.NoShow)` trên cùng danh sách đã có, không
  thêm query.
- **Frontend**:
  - `PatientsPage.tsx`: dialog thêm/sửa — 2 `Input` mới (Dị ứng/Bệnh nền, phân tách bằng
    dấu phẩy, cùng pattern ô "Tags" đã có). Bảng danh sách thêm badge đỏ "Dị ứng" cạnh tên
    nếu bệnh nhân có ít nhất 1 dị ứng — cảnh báo nổi bật ngay từ danh sách, không phải
    chờ mở chi tiết mới thấy.
  - `PatientDetailPage.tsx`: header thêm badge riêng cho từng allergy (đỏ) và từng medical
    condition (vàng), cộng badge "Không đến N lần" (vàng) nếu `noShowCount > 0` — đặt cạnh
    badge "Còn nợ" đã có từ Giai đoạn A.
  - `AppointmentsPage.tsx` (dialog tạo/sửa lịch hẹn) — đây là nơi quan trọng nhất về mặt an
    toàn lâm sàng: ngay sau `Select` chọn bệnh nhân, hiện cảnh báo dị ứng/bệnh nền tra trực
    tiếp trong `patients` state đã load (không gọi API riêng, vì list đã có đủ field mới).
    No-show đếm được gọi lười qua `patientsApi.getDetail(patientId)` mỗi lần đổi bệnh nhân
    trong dialog (không tải sẵn cho toàn bộ 1000 bệnh nhân trong list để tránh N+1 — đánh
    đổi giữa việc chỉ tải khi cần và một round-trip nhỏ mỗi lần đổi chọn).
  - `DashboardPage.tsx`: thêm `patientsApi.getRecallList(6)` vào `Promise.allSettled` đã
    có, hiển thị trong khối "Cảnh báo cần chú ý" đã có từ Giai đoạn A (mỗi bệnh nhân cần
    nhắc là 1 dòng link sang trang chi tiết, kèm ngày khám gần nhất + SĐT) — không tạo
    trang riêng, giữ nhất quán với quyết định trước.
- **Test**: 3 test mới trong `PatientAppServiceTests` (tạo bệnh nhân có allergies/medical
  conditions, đếm đúng no-show trong `GetPatientDetailAsync`, và test quan trọng nhất —
  `GetRecallListAsync` trả đúng bệnh nhân có lịch Completed quá 6 tháng không có lịch mới,
  loại đúng bệnh nhân mới khám gần đây, loại đúng bệnh nhân đã có lịch mới dù lần khám
  trước đã quá hạn). Tổng test: 49 → 52 (49 EfCoreTests bao gồm 3 test mới + 1 WebTests),
  tất cả pass.
  **Verify UI thật bằng Playwright**: tạo bệnh nhân với dị ứng Penicillin/Latex + bệnh nền
  tăng huyết áp → badge đỏ "Dị ứng" hiện đúng trên bảng danh sách và badge chi tiết trên
  trang hồ sơ → mở dialog tạo lịch hẹn cho bệnh nhân đó → cảnh báo dị ứng/bệnh nền hiện
  ngay dưới ô chọn bệnh nhân → tạo 1 lịch hẹn NoShow → mở lại dialog tạo lịch hẹn mới cho
  cùng bệnh nhân → cảnh báo "đã không đến 1 lần trước đó" hiện đúng → trang chi tiết hiện
  đúng badge "Không đến 1 lần" + "Còn nợ 600.000đ" → tạo 1 lịch hẹn Completed cách đây 8
  tháng (không có lịch mới) → Dashboard hiện đúng dòng nhắc tái khám cho bệnh nhân này
  trong khối Cảnh báo, cùng với cảnh báo công nợ đã có từ Giai đoạn A. Không lỗi console
  trong toàn bộ luồng (sau khi fix bug migration nêu trên).
- Chưa làm (ngoài phạm vi đã chốt): cấu hình ngưỡng tháng nhắc tái khám qua Settings UI
  (đang hardcode); gửi SMS/email nhắc thật (chỉ hiển thị danh sách, nhân viên tự gọi/gửi
  tay); chính sách chặn/tính phí đặt cọc cho bệnh nhân no-show nhiều lần (chỉ cảnh báo,
  không chặn hành động đặt lịch).

### 2026-07-07 (6) — Rà soát quy trình + Giai đoạn A: bộ lọc, liên kết chéo, Dashboard cảnh báo

User yêu cầu rà soát tổng thể hệ thống, tham khảo chuẩn ngành PMS nha khoa (Dentrix/Open
Dental/Curve Dental/tab32) và xem lại thiết kế giao diện có cần bổ sung/chỉnh sửa để
thuận tiện + đưa nhiều thông tin hơn không. Chạy 3 agent Explore/research song song
(khảo sát backend hiện có, khảo sát frontend hiện có, tổng hợp kiến thức chuẩn ngành),
tổng hợp thành 1 báo cáo Artifact (bảng module hiện có/không tồn tại, đối chiếu ưu tiên
cao/trung/thấp, phát hiện UX theo từng trang, roadmap 4 giai đoạn A/B/C/D). User chọn bắt
đầu triển khai Giai đoạn A ngay — không cần entity mới, chỉ khai thác dữ liệu/API đã có
sẵn ở frontend.

- **Bộ lọc nhất quán cho 4 trang** — theo đúng pattern đã có ở `PatientsPage` (state filter
  + `Input` + nút "Lọc"/"Tìm", không tự động filter khi gõ để tránh spam API):
  - `AppointmentsPage`: filter theo tên bệnh nhân + loại hình khám làm **client-side** (áp
    lên kết quả trả về, vì backend `GetAppointmentListDto`/`ApplyFilters` không có 2 field
    này); filter theo trạng thái + khoảng ngày gửi thẳng lên backend (đã hỗ trợ sẵn từ
    trước, chỉ frontend chưa khai thác).
  - `ExpensesPage`: filter theo danh mục + khoảng ngày gửi thẳng lên backend — backend đã
    hỗ trợ đủ 3 field từ Giai đoạn 3, chỉ là chưa có UI nào gọi tới trước đợt này.
  - `LabWorksPage`: giữ nguyên `getBoard()` (không đổi sang `getList` có phân trang, vì
    Kanban cần thấy toàn bộ trạng thái cùng lúc) — thêm 1 ô tìm kiếm lọc **client-side**
    theo tên bệnh nhân/tên labo trên dữ liệu đã tải.
  - `TasksPage`: filter theo độ ưu tiên gửi backend (đã hỗ trợ sẵn); thêm checkbox "Chỉ
    hiện việc quá hạn" lọc client bằng hàm `isTaskOverdue` — **tách hàm này từ logic cục
    bộ trong `TasksPage.tsx` sang `lib/utils.ts`** để Dashboard dùng lại được (tránh viết
    lại đúng 1 điều kiện ngày ở 2 nơi, dễ lệch nếu sửa 1 chỗ quên chỗ kia).
- **Trang chi tiết bệnh nhân — `/patients/:patientId`** (route mới, KHÔNG xoá route
  `/patients/:patientId/tooth-chart` cũ để không breaking gì đang trỏ tới đó): tabs Lịch
  hẹn/Thanh toán/Ca labo/Sơ đồ răng, tất cả gọi API lọc theo `patientId` đã có sẵn từ
  trước (`appointmentsApi.getList`, `labWorksApi.getList` đều support `patientId` filter
  — chỉ chưa từng có UI nào dùng tới). Header hiện tuổi (tính từ `dateOfBirth`), SĐT,
  badge công nợ đỏ nếu `totalDebt > 0` (từ `patientsApi.getDetail` đã có sẵn), ngày khám
  gần nhất.
  - Tab **Thanh toán** tái dùng nguyên `PaymentHistoryDialog` đã có (component nhận
    `AppointmentDto` đầy đủ, tự xử lý add/remove payment) — copy đúng pattern
    `paymentDialogAppointment`/`handlePaymentChanged` đã dùng trong `AppointmentsPage`,
    không viết lại logic thanh toán lần 2.
  - Tab **Sơ đồ răng** — thay vì link ra route cũ hoặc viết lại từ đầu: **tách phần thân**
    của `ToothChartPage.tsx` (chú giải màu + `ToothChartSvg` + dialog cập nhật/lịch sử)
    thành component dùng chung `components/tooth-chart/PatientToothChartPanel.tsx`, nhận
    `patientId` làm prop (không tự fetch lại `patientsApi.get` vì trang cha đã có patient
    rồi). `ToothChartPage.tsx` (route cũ, vẫn giữ) và tab mới trong trang chi tiết đều
    dùng chung component này — tránh 2 nơi giữ cùng 1 logic cập nhật tình trạng răng.
  - `PatientsPage.tsx`: đổi nút "Sơ đồ răng" (icon `Smile`) thành nút "Xem chi tiết"
    (icon `Eye`) điều hướng sang trang mới — route tooth-chart cũ giờ chỉ truy cập được
    qua gõ URL trực tiếp hoặc từ trong tab, không còn entry point riêng trên bảng danh
    sách (cân nhắc dọn route cũ ở đợt sau khi trang mới đã ổn định, chưa xoá ngay).
- **Dashboard — doanh thu + cảnh báo vận hành**: mở rộng theo đúng pattern
  `Promise.allSettled` + `DashboardData | null` đã có (1 API lỗi không kéo sập cả trang).
  - Doanh thu hôm nay/tháng: gọi `statisticsApi.getRevenueOverview` (đã có sẵn từ đợt
    Thống kê) 2 lần với khoảng ngày khác nhau — tính đúng "tiền thực nhận" (dựa trên
    `Payment.Amount`, không phải giá dịch vụ).
  - Cảnh báo công nợ: gọi thêm 1 lần `appointmentsApi.getList({toDate: now - 7 ngày})` rồi
    lọc client `paymentStatus !== Paid` — chưa có filter `PaymentStatus` ở backend nên
    tạm chấp nhận tải về rồi lọc tay (đủ nhanh ở quy mô 1 phòng khám).
  - Cảnh báo ca labo trễ hạn + công việc quá hạn: **không gọi API mới** — lọc lại chính
    dữ liệu `labWorksApi.getBoard()`/`tasksApi.getOverview()` Dashboard đã tải sẵn từ
    trước, dùng lại `isTaskOverdue` vừa tách ra ở trên.
  - UI: 1 `Card` "Cảnh báo cần chú ý" duy nhất gộp cả 3 loại, đặt sau lưới KPI — **tự ẩn
    hoàn toàn nếu không có cảnh báo nào** (không hiện card rỗng gây nhiễu mắt khi mọi thứ
    đều ổn).
- **Gotcha môi trường gặp lại giữa đợt làm việc này**: Postgres container
  (`giaptechdentify-postgres-1`) từ session trước **biến mất hoàn toàn** (không phải chỉ
  dừng — `docker ps -a` không thấy cả container đã exit), backend liên tục lỗi
  `Npgsql.NpgsqlException: Failed to connect ... Connection refused` và route
  `/.well-known/openid-configuration` trả 500 khiến toàn bộ SPA kẹt mãi ở "Đang xác
  thực...". Fix: `docker compose up -d postgres` tạo lại container mới, chạy lại
  `DbMigrator` (build rồi chạy trực tiếp `.dll` theo đúng bài học đã ghi từ trước, không
  dùng `dotnet run --project` cho migrator), rồi **restart backend Web** (không tự phục
  hồi kết nối cũ, phải kill process cũ và chạy lại `dotnet run --project ... --no-build`
  với `ASPNETCORE_ENVIRONMENT=Development` để nạp đúng dev-cert OpenIddict).
- **Test**: không có test .NET mới (Giai đoạn A không đổi backend/Domain, chỉ thêm tham
  số filter còn thiếu ở lời gọi API frontend và khai thác dữ liệu đã có). Frontend:
  `tsc -b` sạch, `oxlint` chỉ còn 3 warning cũ không liên quan (fast-refresh), `npm run
  build` production thành công.
  **Verify UI thật bằng Playwright** toàn bộ luồng: tạo 1 bệnh nhân + 1 lịch hẹn + 1 ca
  labo mới qua chính UI (vì DB vừa reset) → xác nhận bộ lọc tên trên `AppointmentsPage`
  lọc đúng từ 2 xuống 1 kết quả và số đếm cập nhật khớp → xác nhận thanh filter hiển thị
  đúng trên cả 4 trang (Lịch hẹn/Chi phí/Labo/Công việc) → mở trang chi tiết bệnh nhân,
  xác nhận cả 4 tab hoạt động đúng (Lịch hẹn hiện đúng số lượng trong tên tab, Thanh toán
  hiện đúng cột "Còn nợ" tô đỏ, Ca labo hiện đúng dữ liệu, Sơ đồ răng render SVG đúng ngay
  trong tab không cần chuyển route) → Dashboard hiện đúng doanh thu hôm nay/tháng khớp số
  liệu thật, badge tăng trưởng đúng dấu, "Công nợ cần chú ý" đúng 0đ vì lịch hẹn mới tạo
  chưa quá 7 ngày (xác nhận đúng logic ngưỡng, không phải bug). Không lỗi console trong
  toàn bộ luồng.
- Chưa làm (thuộc Giai đoạn B/C/D theo roadmap đã đề xuất, không nằm trong phạm vi Giai
  đoạn A): cảnh báo dị ứng/bệnh sử có cấu trúc, nhắc tái khám định kỳ, entity Bác sĩ +
  lịch làm việc, danh mục dịch vụ có giá tham chiếu, kế hoạch điều trị nhiều bước, dọn
  route `/patients/:patientId/tooth-chart` cũ, sửa lịch hẹn ngay trong tab (hiện chỉ xem,
  chưa có nút sửa tại chỗ trong trang chi tiết).

### 2026-07-07 (5) — Thanh toán nhiều lần + In hoá đơn + Thống kê

User yêu cầu 3 việc lớn cùng lúc: (1) bệnh nhân thanh toán nhiều lần + xem đã/chưa thanh
toán, (2) in hoá đơn thanh toán/thuốc, (3) thống kê doanh thu + loại hình khám + theo bác
sĩ. Xác nhận phạm vi qua AskUserQuestion trước khi làm: Payment là bảng riêng lưu lịch sử
từng lần thu (không phải 1 field set thẳng); in hoá đơn là trang HTML riêng dùng
`window.print()` của trình duyệt (không thêm thư viện PDF); thống kê làm cả 3 kiểu (biểu
đồ doanh thu theo thời gian, bảng xếp hạng loại hình khám, thống kê theo bác sĩ); thêm hẳn
trường `TreatmentType` (danh mục cố định) vào Appointment vì trước đó không có field nào
phân loại thủ thuật để thống kê theo.

- **Domain — `Payment`**: entity con thật của `Appointment` (giống pattern
  `PrescriptionItem`, không phải aggregate root riêng như `AppointmentPhoto`) — vì luôn
  cần thấy trọn lịch sử thu tiền khi xem 1 lịch hẹn, số lượng bị chặn nhỏ (vài lần thu/lịch
  hẹn), và vòng đời gắn chặt (xoá Appointment thì xoá theo cascade). Constructor + setter
  `internal`, chỉ tạo/xoá qua `Appointment.AddPayment`/`RemovePayment`.
  **Thay đổi phá vỡ có chủ đích**: bỏ hẳn `RecordPayment(decimal paidAmount)` cũ (nhận
  thẳng tổng tiền, set trực tiếp `PaidAmount`) — giờ `PaidAmount` là giá trị **tính lại**
  từ `_payments.Sum(x => x.Amount)` mỗi khi `AddPayment`/`RemovePayment`, không còn set
  được từ bên ngoài. `AddPayment` vẫn giữ nguyên rule cũ (tổng không vượt `Price`, ném
  `PaidAmountCannotExceedPrice`), nhưng kiểm tra trên `PaidAmount + amount` thay vì giá trị
  set thẳng.
- **`TreatmentType`** (enum 10 giá trị: GeneralCheckup/Filling/Extraction/Whitening/
  RootCanal/Orthodontics/Implant/Cleaning/Crown/Other) — field mới trên `Appointment`,
  mặc định `GeneralCheckup`, sửa được qua `SetTreatmentType` độc lập với `Status`.
- **EF Core**: `Payment` map giống hệt pattern `PrescriptionItem` (`HasMany().WithOne()`,
  `Navigation().HasField("_payments")`, cascade delete qua FK). Migration
  `AddPaymentAndTreatmentType`: thêm cột `TreatmentType` (int, default 0) vào
  `AppAppointments`, tạo bảng `AppPayments` mới. `EfCoreAppointmentRepository.
  GetWithDetailsAsync` thêm `.Include(x => x.Payments)` bên cạnh `.Include(x =>
  x.PrescriptionItems)` đã có.
- **Application**: `IAppointmentAppService` bỏ `UpdatePaymentAsync`/`UpdatePaymentDto` cũ,
  thay bằng `AddPaymentAsync(id, CreatePaymentDto)` (route `POST
  .../appointment/{id}/payment`) và `RemovePaymentAsync(id, paymentId)` (route `DELETE
  .../appointment/{id}/payment?paymentId=...` — theo ABP convention, "Remove" map ra
  DELETE giống "Delete", tham số Guid thứ 2 không phải id đầu tiên nên rơi xuống query
  string vì DELETE không nhận body). `AppointmentDto` thêm `payments: PaymentDto[]` và
  `treatmentType`.
- **`IStatisticsAppService` (mới hoàn toàn, permission `Dentify.Statistics` — chỉ có
  `Default`, không có Create/Update/Delete vì đây là API chỉ-đọc)**:
  - `GetRevenueOverviewAsync(fromDate, toDate)` — group `Payment.PaymentDate` theo ngày
    trong khoảng chọn, cộng thêm so sánh với **kỳ liền trước có cùng độ dài** (vd chọn 30
    ngày qua thì so với 30 ngày trước đó nữa) để tính % tăng trưởng. Cố tình dùng
    `Payment.PaymentDate` (tiền thực nhận) chứ không phải `Appointment.Price` (giá dịch
    vụ, có thể chưa thu đủ) — đúng bản chất "doanh thu" là tiền đã vào túi.
  - `GetTreatmentTypeStatisticsAsync`/`GetDoctorStatisticsAsync` — cả 2 đều lọc theo
    `Appointment.ScheduledDateTime` trong khoảng chọn (không phải theo Payment), group và
    đếm số ca + tổng `PaidAmount`. Bác sĩ chưa phân công gộp vào 1 dòng "Chưa phân công"
    (`DoctorId == null`) thay vì loại bỏ, để không mất số liệu.
  - Không cần Mapperly mapper riêng — DTO build tay từ kết quả `GroupBy` nên không có gì
    để tự sinh mapping.
- **Frontend — `PaymentHistoryDialog`** (component mới, thay hẳn dialog "Cập nhật thanh
  toán" cũ chỉ có 1 input số tiền): hiện đủ giá dịch vụ/đã thu/còn lại, danh sách lịch sử
  thanh toán (mỗi dòng có nút xoá riêng), form thêm 1 lần thu mới (chỉ hiện khi còn nợ,
  validate số tiền không vượt phần còn lại ngay trên UI trước khi gọi API), và nút "In hoá
  đơn" mở tab mới. `AppointmentsPage` giờ load full detail (`appointmentsApi.get`) trước
  khi mở dialog thanh toán — vì `GetListAsync` không include `Payments` (giống lý do cũ đã
  áp dụng cho dialog Sửa/đơn thuốc).
- **`InvoicePage`** (route `/appointments/:appointmentId/invoice`, có `ProtectedRoute`
  nhưng KHÔNG bọc `AppLayout` — trang in riêng biệt, không có sidebar): lấy thông tin
  phòng khám qua `clinicSettingsApi.get()` đã có sẵn từ Giai đoạn 4 (logo/tên/địa chỉ/SĐT),
  hiện đơn thuốc + toàn bộ lịch sử thanh toán + tổng kết giá/đã thu/còn lại. Nút "In hoá
  đơn" chỉ gọi `window.print()` — không có logic PDF nào, đúng quyết định đã chốt. CSS
  `print:hidden`/`print:p-0` ẩn nút In khi in thật.
- **`StatisticsPage`** (route `/statistics`, cài mới `recharts` — package biểu đồ đầu tiên
  của dự án): chọn khoảng thời gian nhanh (7 ngày/30 ngày/tháng này), `LineChart` doanh thu
  theo ngày + badge tăng trưởng (mũi tên lên/xuống theo dấu %), `BarChart` ngang top 6 loại
  hình khám kèm bảng đầy đủ, bảng xếp hạng theo bác sĩ. Gọi song song 3 API qua
  `Promise.all` (không cần `allSettled` ở đây vì cùng 1 nhóm chức năng, lỗi 1 API nghĩa là
  lỗi chung đáng để thấy rõ, khác với Dashboard tổng hợp nhiều nhóm độc lập).
- **Môi trường build (riêng máy này)**: máy chỉ có sẵn .NET SDK tới 8.0.203 dù project
  target `net10.0` — khác với các lần trước trong cùng dự án (chắc chạy trên máy có sẵn
  SDK 10). `dotnet build`/`dotnet ef` đều cần SDK 10 mới nhận diện được `.slnx` và target
  framework. Cài .NET 10 SDK **vào thư mục riêng của user** (`~/.dotnet10` qua
  `dotnet-install.sh --install-dir`) vì không có quyền ghi `/usr/local/share/dotnet`
  (global location, cần sudo) — mọi lệnh `dotnet` sau đó phải export
  `PATH="$HOME/.dotnet10:$PATH"` và `DOTNET_ROOT="$HOME/.dotnet10"` trước khi chạy trong
  cùng phiên làm việc này.
- **Test**: 2 test mới trong `AppointmentAppServiceTests` (`Should_Update_Payment_And_
  Recalculate_Payment_Status` viết lại dùng `AddPaymentAsync` nhiều lần thay vì
  `UpdatePaymentAsync` 1 lần, `Should_Remove_Payment_And_Recalculate_Payment_Status` mới)
  + sửa 2 test cũ dùng API `UpdatePaymentAsync`/`UpdatePaymentDto` đã xoá
  (`PatientAppServiceTests.Should_Get_Patient_Detail_With_Last_Appointment_And_Total_Debt`
  chuyển sang `AddPaymentAsync`). Tổng test: 45 → 48 (46 EfCoreTests + 1 WebTests, xem chi
  tiết log), tất cả pass.
  **Verify UI thật bằng Playwright**: login → mở dialog thanh toán 1 lịch hẹn 200.003đ,
  chưa thu gì → thêm 1 lần thu 50.000đ → trạng thái tự đổi "Thanh toán một phần", lịch sử
  hiện đúng dòng vừa thêm → mở tab in hoá đơn mới → thấy đủ thông tin phòng khám/đơn
  thuốc/lịch sử thanh toán/tổng kết. Trang Thống kê hiển thị đúng 0đ doanh thu (chưa có
  payment nào trong DB test lúc đó), sau khi có payment thì cả biểu đồ doanh thu lẫn bảng
  xếp hạng loại hình khám cập nhật đúng số liệu thật. Không lỗi console trong toàn bộ
  luồng. **Bug UI tự phát hiện lúc verify (không có trong audit ban đầu)**: bảng đơn thuốc
  trên trang hoá đơn thiếu khoảng cách ngang giữa cột "SL" (`text-right`) và cột "Hướng
  dẫn" liền sau, khiến 2 giá trị dính liền nhau trong ảnh chụp thật (`15Uống 2 lần/ngày`)
  dù code nhìn qua tưởng đúng — fix bằng thêm `pr-2` cho mọi ô trừ cột cuối ở cả 2 bảng
  (đơn thuốc + chi tiết thanh toán) trên `InvoicePage`.
- Chưa làm (để lại, ngoài phạm vi đã chốt): hoá đơn thuốc **riêng biệt** khỏi hoá đơn thanh
  toán (hiện gộp chung 1 trang in, đơn thuốc là 1 mục trong đó — đủ dùng cho quy mô 1
  phòng khám, tách riêng chỉ cần thiết nếu sau này có yêu cầu in đơn thuốc độc lập không
  kèm thông tin tài chính); export/in danh sách thống kê ra file; lọc thống kê theo bác sĩ
  cụ thể hoặc theo loại hình khám cụ thể (hiện luôn hiện toàn bộ danh sách xếp hạng).

### 2026-07-07 (4) — Polish Calendar/Dashboard/Task vừa làm

User yêu cầu "polish phần vừa làm" ngay sau khi hoàn thành mục (3) bên dưới. Dùng 1
agent Explore audit riêng 3 file mới (không audit lại 7 trang cũ đã polish trước đó),
so sánh với các pattern đã chuẩn hoá (ConfirmDialog, Skeleton, formatCurrency,
aria-label). Audit tìm ra **1 bug thật** + 5 vấn đề mức Cao khác, tổng 18 điểm.

- **Bug thật đã fix**: `AppointmentCalendar.tsx` set `locale="vi"` (string) nhưng
  FullCalendar v6 yêu cầu import locale object riêng
  (`@fullcalendar/core/locales/vi`) — string suông không có tác dụng, calendar vẫn
  hiển thị tên thứ/tháng bằng tiếng Anh dù tưởng đã cấu hình tiếng Việt. Đã verify sau
  fix bằng Playwright: header ngày đổi đúng từ Mon/Tue/Wed sang Thứ 2/Thứ 3/Thứ 4/CN.
- **`TasksPage` — lặp lại đúng lỗi đã từng gặp và fix ở `AppointmentPhotosDialog`**:
  action Sửa/Xoá dùng `opacity-0 group-hover:opacity-100` — trên thiết bị cảm ứng
  (không có hover thật) 2 nút này gần như không thể bấm được. Sửa thành
  `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` (luôn hiện dưới breakpoint
  `sm`, chỉ ẩn-hiện-khi-hover trên màn hình đủ rộng có chuột). Đây là lần thứ 2 gặp
  đúng pattern lỗi này — nên nhớ **bất kỳ action nào ẩn sau hover đều phải xét lại trên
  mobile trước khi coi là xong**, không chỉ riêng ảnh.
  Checkbox tròn (`Circle`/`CheckCircle2` làm nút toggle done) thiếu `role="checkbox"` +
  `aria-checked` — thêm cả 2, verify qua Playwright thấy đúng `aria-checked="false"`.
- **`DashboardPage` — đổi `Promise.all` thành `Promise.allSettled`**: trước đó nếu bất
  kỳ 1 trong 5 API (patients/appointments/labworks/expenses/tasks) lỗi, `Promise.all`
  reject toàn bộ và trang hiện nguyên màn hình lỗi trắng trơn dù 4/5 API kia vẫn thành
  công. Giờ mỗi phần dữ liệu độc lập (`string | null`/`T[] | null`), phần nào lỗi hiển
  thị dấu `—` ở thẻ số liệu và dòng "Không tải được ..." ở khối chi tiết tương ứng,
  không kéo sập toàn trang. Toast báo số lượng phần bị lỗi cụ thể thay vì thông báo
  chung chung. Trạng thái lỗi hoàn toàn (không có `data` nào cả) giờ có nút "Thử lại"
  gọi lại `loadData()` — trước đó là ngõ cụt phải tự reload trang.
- **`AppointmentCalendar` — responsive mobile**: `headerToolbar` 3 cụm nút (điều
  hướng / tiêu đề / chọn view) trước đó ép nằm 1 hàng, tràn ra ngoài trên màn hình hẹp.
  Thêm CSS `.fc-header-toolbar { flex-wrap: wrap }` + giảm cỡ chữ tiêu đề dưới 640px —
  verify bằng Playwright ở viewport 375px thấy toolbar co đúng theo khung, không tràn.
  Cũng thêm `title`/`aria-label` tổng hợp (tên bệnh nhân + trạng thái + giá) cho mỗi ô
  sự kiện — trước đó ở view Tháng chỉ hiện tên, ẩn hoàn toàn trạng thái/giá kể cả khi
  hover hay dùng screen reader.
- **Đã cân nhắc nhưng không sửa (ghi nhận, không phải bỏ sót)**: form Task chưa có
  validate border-đỏ trực quan như G7 của đợt audit trước — nhưng đây không phải vấn đề
  riêng của Task, mọi form trong app đều theo cùng 1 mức (chỉ `required` HTML), sửa
  riêng 1 form sẽ tạo lệch chuẩn thay vì nhất quán hơn. Timezone khi lưu `dueDate` từ
  input `type="date"` (`new Date(dateOnlyString).toISOString()`) có rủi ro lệch ngày ở
  múi giờ âm — nhưng đây là pattern dùng chung trong toàn bộ codebase từ trước
  (ExpensesPage, PatientsPage cũng làm y hệt), không phải lỗi riêng của code mới, và
  rủi ro không xảy ra ở múi giờ Việt Nam (UTC+7, dương). Cả 2 điểm này nên xử lý đồng
  loạt toàn app nếu làm, không vá riêng lẻ ở đây.
- **Verify UI thật bằng Playwright** cho toàn bộ fix: locale tiếng Việt đúng, toolbar
  responsive không tràn ở 375px, Dashboard vẫn hoạt động bình thường sau khi đổi cơ chế
  lỗi, checkbox Task có đúng role/aria-checked, action buttons Task có opacity=1 trên
  viewport mobile (xác nhận bằng `getComputedStyle` thật, không chỉ đọc class). Không
  lỗi console.

### 2026-07-07 (3) — Calendar view + Dashboard trang chủ + Module Công việc

User yêu cầu thêm 3 việc cùng lúc: (1) giao diện calendar cho Lịch hẹn, (2) trang chủ
tổng quan số liệu, (3) module ghi chú/task, tất cả "tham khảo cách hiển thị Notion".
Xác nhận phạm vi qua AskUserQuestion trước khi làm: Calendar đầy đủ Tháng/Tuần/Ngày +
kéo-thả (không phải chỉ xem tĩnh); Task độc lập không gắn Patient/Appointment; "phong
cách Notion" hiểu là thẩm mỹ tối giản/nhiều khoảng trắng, không phải yêu cầu block-based
editor hay multi-view database thật sự của Notion.

- **Calendar — dùng thư viện `@fullcalendar/react` + `daygrid`/`timegrid`/`interaction`
  plugin**, không tự viết lưới ngày/giờ từ đầu (chi phí tự làm kéo-thả + resize + multi-view
  đúng UX quá cao so với lợi ích). `AppointmentsPage` giờ có `Tabs` (Bảng/Lịch, dùng
  `@radix-ui/react-tabs` đã cài sẵn nhưng chưa có wrapper — tạo mới `components/ui/tabs.tsx`)
  — Bảng dùng đúng danh sách phân trang cũ, Lịch dùng riêng `getCalendarView(fromDate,
  toDate)` đã có sẵn từ Giai đoạn 1 (trước đó không có UI nào gọi tới). Kéo-thả sự kiện
  gọi `appointmentsApi.update` với `scheduledDateTime` mới, giữ nguyên mọi field khác
  (bao gồm `prescriptionItems` — lấy từ chính object đang có trong state, không gọi lại
  API); nếu update lỗi thì `arg.revert()` của FullCalendar tự đưa event về vị trí cũ.
  Click vào ô ngày trống mở dialog tạo mới với giờ đã điền sẵn.
  **Giới hạn đã biết và chấp nhận**: `Appointment` domain không có trường thời lượng
  (chỉ có `scheduledDateTime`), nên calendar hiển thị mỗi lịch hẹn với khối thời gian cố
  định 30 phút chỉ để có chiều cao hiển thị trên `timeGrid` — đây là hiển thị thuần tuý,
  không lưu xuống DB, không ảnh hưởng dữ liệu thật.
  CSS tối giản kiểu Notion cho FullCalendar viết riêng trong `index.css` (`.notion-calendar`
  block) — ánh xạ theme variables có sẵn (`--border`, `--muted`, `--accent`) vào biến CSS
  riêng của FullCalendar (`--fc-*`) thay vì để theme mặc định sặc sỡ của thư viện.
- **Dashboard — không thêm endpoint backend mới**, gọi song song 5 API đã có sẵn qua
  `Promise.all`: `patientsApi.getList` (đếm tổng), `appointmentsApi.getCalendarView`
  (lịch hẹn trong ngày, dùng `startOfDay`/`endOfDay` tính range), `labWorksApi.getBoard`
  (lọc bỏ trạng thái `Attached` để ra "đang xử lý"), `expensesApi.getSummary` (tổng chi
  phí tháng hiện tại), `tasksApi.getOverview` (5 việc chưa xong sắp đến hạn nhất). 4 thẻ
  số liệu đầu trang đều là `Link` điều hướng thẳng sang trang chi tiết tương ứng (bấm vào
  "Bệnh nhân" đi tới `/patients`, v.v.) — giữ dashboard làm điểm khởi đầu điều hướng,
  không phải trang xem thụ động. Route `/` đổi từ `<Navigate to="/patients">` (redirect
  cứng) thành route thật cho `DashboardPage`.
- **Module Công việc (`TaskItem`)** — entity mới hoàn toàn độc lập (không FK tới
  Patient/Appointment nào, đúng như đã chốt phạm vi), theo đúng pattern `Expense` đã có:
  `Title`, `Content`, `IsDone`, `Priority` (Low/Medium/High), `DueDate` optional.
  **Đặt tên entity là `TaskItem` chứ không phải `Task`** để tránh xung đột/nhầm lẫn với
  `System.Threading.Tasks.Task` dùng khắp nơi trong signature async của C#
  (`Task<TaskItemDto> GetAsync(...)` sẽ rất dễ đọc nhầm nếu entity cũng tên `Task`).
  `GetOverviewListAsync()` (không phân trang, giới hạn 5, loại `IsDone`, sắp theo
  `DueDate` rồi `Priority` giảm dần) dùng chung cho cả `TasksPage` (không, TasksPage
  dùng `GetListAsync` phân trang đầy đủ) — thực ra endpoint riêng này chỉ phục vụ
  Dashboard, tách biệt vì Dashboard cần gọn+nhanh, còn trang Công việc cần đầy đủ/phân
  trang/filter. `ToggleDoneAsync` là action riêng (không qua `UpdateAsync` chung) vì đây
  là thao tác tần suất cao nhất (check/uncheck liên tục) — tách để FE có thể optimistic-update
  UI ngay (đổi state trước, gọi API sau, rollback nếu lỗi) mà không phải gửi lại toàn bộ
  form.
  **Frontend "phong cách Notion"**: danh sách phẳng (không bảng/không card nặng nề),
  icon tròn rỗng/đặc làm checkbox (`Circle`/`CheckCircle2` từ lucide, không dùng input
  checkbox thô), action Sửa/Xoá **ẩn mặc định, chỉ hiện khi hover** (`opacity-0
  group-hover:opacity-100`) — cùng pattern đã áp dụng cho `AppointmentPhotosDialog`
  trước đó nhưng lần này **chủ đích giữ hover-only** vì đây là thao tác phụ ít dùng trên
  desktop (khác với nút xoá ảnh vốn phải luôn hiện vì hay dùng trên tablet cảm ứng) —
  không phải mâu thuẫn với quyết định trước, mà là áp dụng đúng ngữ cảnh khác nhau.
  Task đã xong hiển thị dưới, chữ gạch ngang mờ màu, tách nhóm rõ với `border-t`.
- **Bài học cũ được áp dụng lại, không lặp lỗi**: nhớ đăng ký `TaskItemMapper` vào
  `DentifyApplicationModule.ConfigureServices` (`AddSingleton`) ngay từ đầu, không đợi
  tới lúc chạy test mới phát hiện thiếu như đã từng xảy ra ở Giai đoạn 3 — build sạch +
  test pass ngay từ lần chạy đầu tiên cho phần Task, không phải fix lại.
- **Test**: 5 test `TaskItemAppServiceTests` (tạo với priority mặc định Medium, toggle
  done 2 chiều, filter theo `IsDone`, overview loại trừ task đã xong, xoá). Tổng test:
  40 → 45, tất cả pass.
  **Verify UI thật bằng Playwright** cả 3 tính năng cùng lúc: Dashboard hiển thị đúng số
  liệu khớp DB (2 bệnh nhân, 1 lịch hẹn hôm nay, 1 ca labo đang xử lý, đúng tổng chi phí
  tháng — đối chiếu bằng ảnh chụp màn hình thật, không chỉ đọc text); Calendar chuyển
  tab Bảng↔Lịch đúng, FullCalendar render đúng lịch hẹn vào đúng ô ngày, tiêu đề
  tháng/nút Tháng-Tuần-Ngày hiển thị tiếng Việt; Task tạo mới → đếm "X việc cần làm · Y
  đã hoàn thành" cập nhật đúng ngay → bấm toggle done → chữ gạch ngang đúng. Không lỗi
  console trong suốt quá trình test cả 3 tính năng.
- Chưa làm (ngoài phạm vi đã chốt): Task gắn với Patient/Appointment (đã hỏi và chốt
  độc lập), Calendar hiển thị theo bác sĩ/phòng khám riêng (multi-resource view của
  FullCalendar — chưa cần vì phòng khám hiện chưa phân theo nhiều bác sĩ song song trên
  UI), block-based editor thật cho nội dung Task (hiện chỉ là `Textarea` phẳng).

### 2026-07-07 (2) — Hoàn thiện UI/UX toàn bộ frontend (không thêm tính năng mới)

Sau khi xong 4 giai đoạn chính, user yêu cầu tập trung hoàn thiện UI/UX của những gì đã
có (không thêm tính năng). Dùng 1 agent Explore đọc toàn bộ 7 trang
(Patients/Appointments/LabWorks/Expenses/Settings/ToothChart/AuthCallback) + component
con để audit trước khi sửa — audit tìm ra **1 bug thật** (không chỉ UI) và hàng loạt vấn
đề UX theo tiêu chí: loading state, empty state, error handling, responsive, form
validation, accessibility, tính nhất quán.

- **Bug thật đã fix**: `AppointmentsPage.openEditDialog` — khi `GetAsync(id)` để lấy chi
  tiết lịch hẹn (kèm đơn thuốc) bị lỗi mạng/server, code cũ vẫn tiếp tục mở dialog dùng
  dữ liệu tóm tắt từ danh sách (thiếu `prescriptionItems`). Nếu người dùng không để ý
  toast lỗi và bấm Lưu, đơn thuốc hiện có của bệnh nhân sẽ bị **xoá sạch** mà không có
  cảnh báo. Fix: đóng dialog + return sớm khi fetch lỗi, thêm state `isLoadingDetail`
  disable nút Lưu trong lúc tải.
- **Component dùng chung mới**: `Skeleton` (loading row/card thay text "Đang tải..."),
  `Tooltip`/`TooltipProvider` (giải thích lý do nút bị disable), `AlertDialog` (Radix,
  thay hoàn toàn `window.confirm()` — không tự custom được message, không đồng bộ theme,
  không có loading state khi xoá), `ConfirmDialog` (wrapper tái dùng AlertDialog cho
  pattern xoá lặp lại ở 5 trang). Cài thêm `@radix-ui/react-tooltip`,
  `@radix-ui/react-alert-dialog` — 2 package Radix duy nhất còn thiếu so với các
  primitive khác đã dùng (`dialog`, `select`, `label`, `tabs`).
- **Sidebar responsive**: `AppLayout` cũ có `<aside className="w-60">` cố định, không
  responsive, phá layout hoàn toàn trên mobile (< md). Sửa: sidebar chính `hidden
  md:flex`, thêm header mobile với nút hamburger mở **drawer** (dùng lại `Dialog`
  Radix có sẵn, style lại thành panel trượt từ trái thay vì modal giữa màn hình) chứa
  cùng nav + nút đăng xuất.
- **Áp dụng đồng loạt cho mọi trang danh sách** (Patients/Appointments/Expenses):
  skeleton loading (5 hàng giả lập đúng số cột), empty state có icon + text + nút CTA
  hành động tiếp theo (thay vì 1 dòng chữ xám nhạt), `AlertDialog` xác nhận xoá có
  state `isDeleting` (disable nút trong lúc xử lý, tránh double-submit), `aria-label`
  mô tả đầy đủ (kèm tên bệnh nhân/khoản chi cụ thể) cho mọi icon-button thay vì chỉ có
  `title` hoặc không có gì, `htmlFor`/`id` liên kết đúng giữa `Label` và `SelectTrigger`
  (trước đó nhiều Select không click-to-focus được từ label).
- **`formatCurrency` helper mới** (`lib/utils.ts`) — trước đó 5 chỗ khác nhau hiện tiền
  bằng `amount.toLocaleString("vi-VN")` không có đơn vị (dễ nhầm số thuần), giờ thống
  nhất `${amount.toLocaleString("vi-VN")} ₫`.
- **AppointmentsPage — sửa riêng**: dialog đơn thuốc mở rộng `sm:max-w-2xl` (từ mặc
  định `max-w-lg` quá hẹp cho 5 field/dòng); grid dòng thuốc đổi từ
  `grid-cols-[2fr_1fr_5rem_2fr_auto]` cố định (vỡ trên màn hẹp) sang responsive
  (`grid-cols-2` xếp dọc trên mobile, 5 cột từ `sm` trở lên); nút "Thêm lịch hẹn" khi
  disabled (chưa có bệnh nhân) bọc trong `Tooltip` giải thích lý do thay vì mờ đi không
  rõ nguyên nhân; dialog thanh toán thêm validate + hiển thị lỗi trực quan khi số tiền
  vượt giá dịch vụ (trước đó im lặng cho nhập, chỉ chặn ở backend).
- **AppointmentPhotosDialog — sửa riêng**: nút xoá ảnh trước đó chỉ hiện khi
  `group-hover` — trên thiết bị cảm ứng (tablet bác sĩ dùng khi khám) **hoàn toàn
  không bấm được** vì không có hover thật. Fix: nút xoá luôn hiển thị. Thêm lightbox
  (dialog phụ) xem ảnh cỡ lớn khi click — trước đó click ảnh không làm gì ngoài xoá.
- **ToothChartSvg — accessibility nghiêm trọng nhất tìm thấy**: mỗi `<g>` đại diện 1
  răng chỉ có `onClick`, không `role`, không `tabIndex`, không `aria-label` riêng —
  người dùng bàn phím/screen reader **không thể chọn từng răng**, tức tính năng cốt lõi
  của trang (ghi nhận tình trạng răng) hoàn toàn không dùng được nếu không có chuột.
  Fix: thêm `role="button"`, `tabIndex={0}`, `aria-label` mô tả số răng + tình trạng
  hiện tại, `onKeyDown` xử lý Enter/Space, `aria-pressed` cho răng đang chọn. **Đã verify
  thật bằng Playwright**: `page.keyboard.press('Enter')` sau khi `focus()` vào 1 răng
  mở đúng dialog cập nhật — xác nhận thao tác bàn phím hoạt động, không chỉ đọc code.
- **ToothChartPage — sửa riêng**: tiêu đề trang mãi hiện "Đang tải..." kể cả khi đã load
  xong nhưng thất bại (dùng `patient ? ... : "Đang tải..."` — sai logic, không phân biệt
  "đang tải" với "tải lỗi"). Toàn bộ nội dung chính cũng trống trơn khi lỗi, chỉ có toast
  tự biến mất — người dùng refresh không hiểu chuyện gì xảy ra. Fix: thêm state
  `loadError` riêng, hiển thị khối lỗi rõ ràng (icon + text + nút "Thử lại" gọi lại
  `loadData()`).
- **LabWorksPage — sửa riêng**: kéo-thả HTML5 (`draggable`) **không hoạt động trên
  touch device** và không có phương án thay thế — bác sĩ dùng tablet sẽ không đổi được
  trạng thái ca labo. Fix: thêm `Select` nhỏ ngay trong mỗi card gọi cùng hàm
  `changeStatus` dùng chung với `handleDrop` — kéo-thả và dropdown đều cập nhật đúng,
  hoạt động trên mọi thiết bị. Cũng tăng kích thước icon-button từ `size-6` lên `size-8`
  (dưới ngưỡng touch-target 44px khuyến nghị), thêm empty-state cho cột rỗng.
- **AuthCallbackPage — sửa riêng**: khi đăng nhập lỗi, trang cũ chỉ hiện text màu xám
  giống hệt trạng thái loading, không có nút nào — người dùng bị **kẹt hoàn toàn, không
  có lối thoát** khỏi trang này nếu OpenIddict callback lỗi. Fix: icon lỗi màu đỏ rõ
  ràng, nút "Về trang chủ" + "Thử đăng nhập lại" (gọi lại `userManager.signinRedirect()`).
- **SettingsPage — sửa riêng**: thêm preview ảnh logo ngay dưới input URL (trước đó nhập
  URL không có cách nào xác nhận đã đúng link trước khi lưu), skeleton cho form lúc tải.
- **Bug tự phát hiện lúc verify (không có trong audit ban đầu)**: sau khi thêm
  `Skeleton` vào `ToothChartPage`, Playwright báo lỗi console "cannot be a descendant of
  `<p>`" — do `<Skeleton>` (render ra `<div>`) bị đặt trong thẻ `<p>` (HTML không cho
  phép block-level element trong `<p>`), gây warning hydration của React. Fix: đổi thẻ
  cha từ `<p>` sang `<div>`, bọc text trong `<span>`. Đây là lý do luôn phải verify bằng
  browser thật thay vì chỉ tin `tsc`/`vite build` — lỗi HTML semantics loại này không
  bị bắt bởi type checker.
- **Không sửa** (audit xếp mức Trung bình/Thấp, ngoài phạm vi "không thêm tính năng"):
  ô tìm kiếm bên trong Select dài (Bệnh nhân), debounce ô filter Patients, dialog xem
  đầy đủ lỗi CSV import (hiện chỉ hiện 3 dòng đầu + "..."), card-view thay bảng trên
  mobile (bảng đã có `overflow-x-auto` sẵn nên chấp nhận được), badge số lượng lịch sử
  răng trước khi bấm xem.
- **Verify UI thật bằng Playwright** (không chỉ đọc code): AlertDialog mở/đóng đúng khi
  xoá bệnh nhân (xác nhận không còn dùng `window.confirm` gốc); sidebar desktop ẩn +
  hamburger hiện đúng ở viewport 390px; mobile nav drawer mở và điều hướng đúng; LabWork
  status Select hoạt động (tạo ca mới, thấy dropdown đổi trạng thái trên card); ToothChart
  đếm đúng 32 phần tử `role="button"` có `aria-label`, focus + Enter mở đúng dialog răng.
  `Console/page errors: []` sau khi fix bug `<Skeleton>` trong `<p>`.

### 2026-07-07 (1) — Giai đoạn 4 (hoàn tất): Import/Export CSV + Backup/Restore + Settings

Xác nhận phạm vi với user trước khi làm (2 vòng AskUserQuestion): (1) CSV chỉ áp dụng cho
Patient + Expense (không làm Appointment); (2) Backup/Restore dùng script
`pg_dump`/`pg_restore` tiện ích thay vì xây tính năng trong app; (3) Settings chỉ cần
thông tin phòng khám (tên/địa chỉ/SĐT/logo), không làm ToothNotationSystem hay cấu hình
nghiệp vụ khác ở giai đoạn này.

- **Import/Export CSV — quyết định xử lý ở frontend, không thêm endpoint backend**: hỏi
  lại user và xác nhận trước khi code vì đây là lựa chọn kiến trúc có đánh đổi rõ —
  Export gọi thẳng API `GetListAsync` đã có (`maxResultCount: 1000`), convert JSON→CSV
  bằng JS thuần (`lib/csv.ts`, tự viết parser/serializer CSV RFC 4180 cơ bản, không thêm
  thư viện ngoài). Import đọc file CSV, validate từng dòng ở client, rồi gọi tuần tự
  `Create()` đã có cho từng dòng hợp lệ — lỗi dòng nào báo dòng đó, dòng hợp lệ vẫn được
  tạo dù có dòng khác lỗi. Lý do chọn cách này thay vì viết `ExportCsvAsync`/
  `ImportCsvAsync` ở backend: tận dụng 100% validation/business rule đã có trong
  AppService (không viết lại lần 2 cho batch), tránh lặp lại vấn đề route POST-only đã
  gặp với `AppointmentPhoto.DownloadAsync` (`IRemoteStreamContent` không hợp với
  `<a download>` browser-native). Đánh đổi: import file rất lớn (hàng nghìn dòng) sẽ chậm
  hơn vì N request tuần tự thay vì 1 bulk insert — chấp nhận được cho quy mô 1 phòng khám.
- **Settings — lần đầu dùng ABP Setting Management thật** (trước đây `App:ClientUrl` chỉ
  là đọc thẳng `appsettings.json`, không phải ABP Setting). `DentifySettings.Clinic.*`
  định nghĩa trong `DentifySettingDefinitionProvider`, đọc qua `SettingProvider` (sẵn có
  trên `ApplicationService`), ghi qua `ISettingManager.SetGlobalAsync` (namespace
  `Volo.Abp.SettingManagement`, khác với `Volo.Abp.Settings.ISettingProvider` chỉ đọc).
  Dùng global scope (không theo tenant/user) vì đây là cấu hình chung cho cả phòng khám.
  Không dùng UI Settings có sẵn của ABP MVC (`Volo.Abp.SettingManagement.Web` — vốn cắm
  vào admin Razor) vì toàn bộ UI nghiệp vụ đã chuyển sang React từ đầu dự án; thay vào đó
  viết 1 trang `/settings` mới trong React gọi qua AppService tự viết
  (`IClinicSettingsAppService`) — không có generic AppService nào của ABP
  SettingManagement module expose custom setting group qua REST, chỉ có sẵn cho nhóm
  Email.
- **Backup/Restore — không code trong app**: 2 script `scripts/backup-db.sh` /
  `restore-db.sh` bọc `pg_dump -F c` / `pg_restore --clean --if-exists`, tự nhận diện
  container Postgres đang chạy (`docker ps --filter name=postgres`) hoặc fallback gọi
  thẳng `pg_dump`/`pg_restore` nếu Postgres cài local (không qua Docker). **Đã tự chạy
  thật cả backup và restore để verify** (không chỉ đọc code): backup DB đang có dữ liệu
  test → đếm số dòng 3 bảng (`AppPatients`, `AppAppointments`, `AppExpenses`) → restore
  lại từ chính file backup đó → đếm lại, khớp 100% với trước khi restore. Phát hiện 1 bug
  lúc verify: truyền đường dẫn tuyệt đối làm output file (`/tmp/foo.dump`) khiến script
  nối nhầm thành `/tmp//tmp/foo.dump` khi copy vào container — fix bằng `basename` trước
  khi ghép đường dẫn trong container, giữ nguyên đường dẫn gốc khi `docker cp` ra ngoài.
- **Test**: 2 test `ClinicSettingsAppServiceTests` (default value đúng lúc chưa set,
  update rồi đọc lại đúng). Tổng test: 39 → 41, tất cả pass. CSV import/export và Settings
  UI **không có test tự động phía frontend** (dự án chưa có test framework nào cho React)
  — đã verify bằng Playwright thật: lưu Settings → reload trang → giá trị vẫn đúng (xác
  nhận qua DB `AbpSettings` bảng); xuất CSV Patient/Expense → tải file thật → đọc nội dung
  đúng định dạng UTF-8 BOM + header tiếng Việt; nhập CSV → dòng mới xuất hiện đúng trong
  bảng, đối chiếu khớp với DB. Không lỗi console trong toàn bộ luồng.
- Chưa làm (để lại, không nằm trong phạm vi đã chốt): CSV cho Appointment, UI Settings
  cho `ToothNotationSystem` (Palmer/Universal — đã nhắc từ Giai đoạn 2, vẫn để dành),
  logo upload trực tiếp (hiện `LogoUrl` chỉ nhận URL ngoài, không có nút upload file như
  AppointmentPhoto).

### 2026-07-06 (4) — Giai đoạn 3 (hoàn tất): LabWork + Expense

Xác nhận phạm vi với user trước khi làm (3 câu hỏi qua AskUserQuestion): (1) LabWork gắn
Patient + Appointment (optional) + số răng liên quan + có field chi phí riêng; (2) Kanban
= chỉ là UI board kéo-thả cho trạng thái LabWork, KHÔNG phải entity/domain riêng; (3)
Expense là sổ chi phí đơn giản theo danh mục, KHÔNG liên kết trực tiếp với
LabWork/Appointment (tránh trùng lặp/phức tạp không cần thiết — nếu sau này cần báo cáo
lợi nhuận chính xác hơn thì làm liên kết lúc đó).

- **Domain — LabWork**: `FullAuditedAggregateRoot`, field: `PatientId` (bắt buộc),
  `AppointmentId` (optional), `LabName`, `WorkType`, `ToothNumberList` (List<int>, tái
  dùng `ToothNumbers.IsValid` từ module ToothChart để validate — **lưu ý đặt tên
  `ToothNumberList` chứ không phải `ToothNumbers`** vì trùng tên với static class
  `GiapTech.Dentify.ToothCharts.ToothNumbers`, gây lỗi biên dịch nếu đặt trùng), `SentDate`/
  `ExpectedReceiveDate`/`ReceivedDate`, `Cost`, `Status` (enum `Sent → InProgress →
  Received → Attached`, hoặc `Cancelled`), `Notes`. `ChangeStatus` tự set `ReceivedDate =
  UtcNow` khi chuyển sang `Received` lần đầu (không ghi đè nếu đã có). Không cần custom
  repository — LabWork không có child collection nào cần `.Include()`.
- **Domain — Expense**: đơn giản, không phụ thuộc entity khác — `ExpenseDate`, `Amount`
  (> 0, `Check.Range(0.01m, decimal.MaxValue)`), `Category` (enum: Lab/Supplies/Salary/
  Rent/Utilities/Marketing/Other), `Description`.
- **Application**: `LabWorkAppService.GetBoardAsync()` trả **toàn bộ** LabWork chưa
  `Cancelled`, không phân trang — chấp nhận được vì quy mô 1 phòng khám số ca lab đang
  active không lớn; dùng riêng cho màn Kanban (khác `GetListAsync` có phân trang/filter
  dùng cho màn danh sách dạng bảng nếu cần sau này). `UpdateStatusAsync` tách riêng khỏi
  `UpdateAsync` — dùng cho thao tác kéo-thả trên Kanban, chỉ đổi 1 field, không phải gửi
  lại toàn bộ form. `ExpenseAppService.GetSummaryAsync` group theo Category tính tổng —
  chuẩn bị sẵn cho báo cáo, chưa có UI biểu đồ (để dành Giai đoạn 4 nếu cần).
  **Bẫy đã gặp (lặp lại từ trước)**: Mapperly (`[Mapper] partial class`) tạo ra class
  **không tự động được ABP đăng ký vào DI** — phải tự thêm
  `context.Services.AddSingleton<XxxMapper>()` thủ công trong
  `DentifyApplicationModule.ConfigureServices` (xem `AppointmentMapper`/`PatientMapper`
  đã có sẵn từ trước). Quên bước này khiến `dotnet build` **vẫn pass** (không lỗi biên
  dịch) nhưng test/runtime crash ngay khi DI cố resolve AppService
  (`Autofac.Core.DependencyResolutionException: Cannot resolve parameter ... XxxMapper`)
  — không phát hiện được cho tới khi chạy `dotnet test`, không phải lúc build.
- **Frontend — Kanban board**: dùng **HTML5 Drag and Drop API gốc** (`draggable`,
  `onDragStart`/`onDragOver`/`onDrop`), không thêm thư viện drag-drop mới — vì nhu cầu chỉ
  là kéo card giữa 4 cột cố định (Sent/InProgress/Received/Attached), không cần
  animation/sort phức tạp mà các thư viện như `dnd-kit` mới cần thiết. Board cập nhật
  optimistic (đổi state ngay khi drop, rollback bằng cách `loadData()` lại nếu API lỗi)
  để cảm giác kéo-thả mượt, không đợi round-trip network.
- **Test**: 5 test `LabWorkAppServiceTests` (tạo mặc định Sent, tooth number không hợp lệ
  → BusinessException, đổi status Received tự set ReceivedDate, board loại trừ Cancelled,
  xoá), 4 test `ExpenseAppServiceTests` (tạo/lấy, filter theo category+khoảng ngày, tổng
  hợp summary group theo category, xoá). Tổng test: 30 → 39, tất cả pass.
  **Verify UI thật bằng Playwright**: tạo Expense mới → hiện đúng trong bảng; tạo LabWork
  mới → card hiện đúng trên cột "Sent" của board; **kéo-thả card sang cột "InProgress"
  bằng `page.mouse.move/down/up`** → toast xác nhận → đối chiếu Postgres thấy
  `Status = 1` (InProgress) đúng — không lỗi console.
- Chưa làm (để lại, không nằm trong phạm vi đã chốt): liên kết Expense ↔ LabWork/
  Appointment (tự sinh Expense từ chi phí LabWork), UI biểu đồ cho `ExpenseSummaryDto`,
  filter/tìm kiếm LabWork theo tên labo trên board.

### 2026-07-06 (3) — Giai đoạn 2 (hoàn tất): Prescription chi tiết (PrescriptionItem)

Cùng máy/phiên làm việc với 2 mục dưới. Xác nhận với user trước khi làm: **xoá hẳn**
field `Prescription` (text tự do) cũ trên `Appointment`, thay hoàn toàn bằng bảng
`PrescriptionItem` — không giữ song song 2 nơi nhập cùng 1 khái niệm. Migration DROP
COLUMN `Prescription` (chấp nhận mất dữ liệu cũ vì DB đang ở giai đoạn test).

- **Domain**: `PrescriptionItem` — khác với `AppointmentPhoto`/`ToothRecordHistory`,
  đây là **child collection thật của `Appointment`** (không phải aggregate root riêng)
  vì: (1) số lượng bị chặn nhỏ (vài chục dòng thuốc/lịch hẹn, không phải log vô hạn),
  (2) luôn cần load cùng lúc khi xem/sửa đơn thuốc của 1 lịch hẹn, (3) vòng đời gắn chặt
  — xoá Appointment thì xoá theo (FK `ON DELETE CASCADE`). Constructor và các setter là
  `internal` (không `public`) — chỉ `Appointment` (cùng assembly Domain) được phép tạo/sửa
  qua `AddPrescriptionItem`/`UpdatePrescriptionItem`/`RemovePrescriptionItem`, giữ đúng
  nguyên tắc DDD "chỉ sửa entity con qua aggregate root".
- **EF Core**: giống pattern `ToothChart.Records` — cần `IAppointmentRepository` custom
  (`GetWithDetailsAsync` với `.Include(x => x.PrescriptionItems)`) vì generic
  `IRepository<Appointment,Guid>.GetAsync()` KHÔNG tự include navigation collection.
  Migration `AddPrescriptionItem`: DROP COLUMN `Prescription` (cảnh báo "may result in
  loss of data" — đã xác nhận trước, chấp nhận được), CREATE TABLE `AppPrescriptionItems`
  với FK cascade delete.
- **Application**: `CreateUpdateAppointmentDto.PrescriptionItems` — danh sách
  `CreateUpdatePrescriptionItemDto` có `Id` **optional**: `Id == null` → dòng thuốc mới
  (thêm), `Id` có giá trị → dòng đã tồn tại (sửa). AppService tự tính diff: dòng nào
  không còn trong danh sách gửi lên thì bị xoá (`ApplyPrescriptionItems` — so sánh
  `HashSet<Guid>` các Id gửi lên với các Id hiện có). Đây là kiểu "lưu toàn bộ danh sách
  1 lần" (như form nhiều dòng), không có API thêm/sửa/xoá từng dòng riêng lẻ — đơn giản
  hơn cho UI vì chỉ có 1 nút Lưu duy nhất cho cả appointment lẫn đơn thuốc.
- **Bug phát hiện qua Playwright, đã fix**: `GetListAsync` (danh sách lịch hẹn trong
  bảng) dùng `GetQueryableAsync()` từ repo generic — **không** include
  `PrescriptionItems`, nên object `AppointmentDto` trong danh sách luôn có
  `prescriptionItems: []` rỗng dù DB có dữ liệu thật. Bug lộ ra khi mở lại dialog Sửa:
  form dùng thẳng object từ danh sách (state cũ) làm nguồn dữ liệu ban đầu → luôn hiển
  thị "chưa có thuốc nào" dù đã lưu trước đó. **Fix**: `openEditDialog` giờ là async,
  gọi `appointmentsApi.get(id)` (route `GetAsync` dùng `GetWithDetailsAsync`, có include
  đầy đủ) để lấy chi tiết thật trước khi điền form, chỉ dùng object từ danh sách làm
  giá trị tạm hiển thị ngay khi dialog vừa mở (tránh giật màn hình trắng). Đây là lý do
  bắt buộc phải test bằng trình duyệt thật (Playwright) thay vì chỉ tin unit test — test
  AppService pass 100% (vì gọi thẳng `GetAsync`/`UpdateAsync` của AppService, không đi
  qua tầng list-rồi-edit của UI) nhưng bug này chỉ lộ ra ở đúng luồng thao tác thật của
  người dùng.
- **Frontend**: `AppointmentsPage` — bỏ hẳn `<Textarea>` Prescription, thay bằng danh
  sách dòng thuốc động (thêm/sửa/xoá dòng ngay trong dialog, mỗi dòng: Tên thuốc/Liều
  lượng/Số lượng/Hướng dẫn). Dùng key tạm phía client (`temp-N`) cho dòng mới chưa có
  `id` để React render list ổn định, tách riêng field `id` (gửi lên server) khỏi `key`
  (chỉ dùng nội bộ UI).
- **Test**: 2 test mới (`Should_Create_Appointment_With_Prescription_Items`,
  `Should_Update_Prescription_Items_Add_Edit_Remove` — verify thêm, sửa số
  lượng/liều dùng, và xoá dòng không còn trong danh sách gửi lên). Tổng test: 28 → 30,
  tất cả pass. **Verify UI thật bằng Playwright**: thêm 2 dòng thuốc → lưu → mở lại dialog
  xác nhận đúng 2 dòng đã lưu (bắt được bug nêu trên ở bước này) → sau khi fix, sửa số
  lượng 1 dòng + xoá dòng còn lại → lưu → mở lại lần 3 xác nhận đúng trạng thái cuối cùng
  khớp với DB — không lỗi console.

### 2026-07-06 (2) — Giai đoạn 2 (tiếp): Photo upload cho Appointment

Cùng máy/phiên làm việc với Tooth Chart (mục dưới). Trước khi làm, phát hiện màn hình
đăng nhập bị treo ("đang xác thực") khi mở lại dự án trên máy này — nguyên nhân:
`frontend/.env` đặt `VITE_API_URL`/`VITE_AUTHORITY=http://localhost:44348` (HTTP) trong
khi backend chỉ lắng nghe **HTTPS** (`https://localhost:44348`, xem
`launchSettings.json`), và chứng chỉ dev-cert của .NET chưa được máy tin cậy. Sửa: đổi
`.env` sang `https://`, chạy `dotnet dev-certs https --trust` (yêu cầu và đã được cấp
quyền ghi Keychain), restart frontend để Vite nạp lại `.env`. Bài học: `.env` không
nằm trong `.gitignore` theo ý đồ ban đầu (SPA cần biết authority lúc build) nên **khi đổi
máy vẫn phải tự kiểm tra scheme HTTP/HTTPS khớp với cách backend đang chạy**, `.env`
không tự đồng bộ qua git theo hạ tầng máy.

- **Domain**: `AppointmentPhoto` — cố ý làm **aggregate root độc lập** (như
  `ToothRecordHistory`), không phải child collection của `Appointment`, để không phải
  sửa `IAppointmentRepository` thành custom repo chỉ vì cần `.Include()`; AppService ảnh
  chỉ cần query theo `AppointmentId`, không cần luôn load kèm Appointment.
  `AppointmentPhotoContainer` — class marker rỗng gắn `[BlobContainerName(...)]`, dùng
  làm generic tham số cho `IBlobContainer<AppointmentPhotoContainer>` (pattern chuẩn của
  ABP BlobStoring để tách các container blob khác nhau theo type-safe key thay vì string).
- **Lưu trữ blob**: dùng **Database provider** có sẵn
  (`Volo.Abp.BlobStoring.Database`, đã có trong Domain/EFCore csproj từ đầu scaffold,
  không cần thêm package) — cấu hình qua
  `AbpBlobStoringOptions.Containers.Configure<AppointmentPhotoContainer>(c => c.UseDatabase())`
  trong `DentifyDomainModule`. Lưu blob thẳng vào bảng `AbpBlobs`/`AbpBlobContainers` của
  Postgres thay vì filesystem — đơn giản hoá backup (1 DB duy nhất) và tương thích tốt
  hơn với triển khai Docker nhiều container/replica (không cần shared volume). Có thể đổi
  sang FileSystem/S3 provider sau chỉ bằng sửa 1 dòng cấu hình, không đụng code nghiệp vụ.
  Giới hạn: JPEG/PNG/WEBP, tối đa 10MB (`AppointmentPhotoConsts`).
- **API dùng `IRemoteStreamContent`** (kiểu chuẩn của ABP cho nội dung nhị phân qua
  AppService) thay vì viết controller MVC tay — `UploadAsync(Guid, IRemoteStreamContent)`
  tự động sinh route nhận `multipart/form-data`; `DownloadAsync(Guid): Task<IRemoteStreamContent>`
  tự động trả file stream. **Lưu ý hành vi ABP**: route download sinh ra là
  `POST /api/app/appointment-photo/{id}/download` (không phải `GET`) — vì mọi action
  không phải đúng tên `Get`/`GetList` mặc định bị coi là "command" nên map sang POST dù
  ngữ nghĩa là đọc. Ảnh hưởng: **không thể** gán thẳng URL này vào `<img src>` (thẻ img
  chỉ tự động gửi GET) — frontend phải tự `fetch(..., {method:'POST'})`, lấy `blob()`,
  tạo `URL.createObjectURL()` rồi gán vào `<img>`, và nhớ `URL.revokeObjectURL()` khi
  đổi/đóng dialog để tránh leak memory.
- **Permissions**: `Dentify.AppointmentPhotos.{Default,Upload,Delete}` (không có
  `Update` vì ảnh không sửa metadata, chỉ upload/xoá).
- **Frontend**: `appointment-photo-api.ts` viết **riêng**, không tái dùng `lib/api.ts`
  — vì `api.ts` luôn set `Content-Type: application/json` và `JSON.stringify(body)`,
  không phù hợp cho `FormData` (upload) hay đọc `blob()` (download). Tự quản lý
  `Authorization` header bằng `userManager.getUser()`. Component
  `AppointmentPhotosDialog` mở từ icon 🖼️ trong bảng Appointments, tự tải trước toàn bộ
  blob URL của ảnh khi mở dialog (danh sách ảnh 1 lịch hẹn thường nhỏ, chấp nhận N request
  song song qua `Promise.all` thay vì lazy-load từng ảnh).
- **Test**: `AppointmentPhotoAppServiceTests` (5 test: upload + list, download đúng nội
  dung, xoá, từ chối content-type không hỗ trợ → `BusinessException`, download ảnh không
  tồn tại → `BusinessException`). Tổng test: 23 → 28, tất cả pass.
  **Đã verify UI thật bằng Playwright**: login PKCE → tạo bệnh nhân + lịch hẹn (vì DB
  đang trống trên máy mới) → mở dialog "Ảnh lịch hẹn" → upload 1 file ảnh giả → toast
  thành công → thumbnail hiển thị đúng (xác nhận luồng blob URL qua POST hoạt động) →
  không có lỗi console.
- **Gotcha môi trường**: `dotnet run --project src/GiapTech.Dentify.DbMigrator` chạy từ
  repo root đôi khi báo lỗi runtime `The ConnectionString property has not been
  initialized` dù `appsettings.json` đúng và design-time (`dotnet ef migrations add`)
  chạy bình thường — nguyên nhân chưa xác định rõ (nghi ngờ liên quan CWD khi
  `dotnet run --project` build+run trong cùng lời gọi trên máy này). **Cách né chắc
  chắn**: build trước (`dotnet build`) rồi chạy thẳng
  `dotnet src/GiapTech.Dentify.DbMigrator/bin/Debug/net10.0/GiapTech.Dentify.DbMigrator.dll`
  từ đúng thư mục đó — luôn chạy đúng.
- Chưa làm (để lại): Prescription chi tiết (`PrescriptionItem`) — phần còn lại cuối cùng
  của Giai đoạn 2. Chưa có UI xoá/thay caption cho ảnh trong bộ ảnh (model đã có field
  `Caption` nhưng chưa có form nhập).

### 2026-07-06 (1) — Giai đoạn 2 (một phần): Tooth Chart module

Làm trên máy mới (clone từ git, VS Code extension) — môi trường chưa có gì, đã tự cài
.NET 10 SDK (`dotnet-install.sh`), Docker Desktop, `Volo.Abp.Studio.Cli` (`abp install-libs`),
`dotnet-ef`. Gặp 1 trở ngại môi trường: npm cache `~/.npm` bị owner sai (do lần cài trước
dùng `sudo npm`) → dùng `npm install --cache /tmp/npm-cache-dentify` thay vì sửa quyền
(không có sudo non-interactive).

- **Domain**: `ToothChart` (FullAuditedAggregateRoot, 1-1 với Patient) chứa collection
  `ToothRecord` (entity con, `Entity<Guid>`, unique theo `(ToothChartId, ToothNumber)`).
  `ToothRecordHistory` — **cố ý làm aggregate root RIÊNG** (không phải child collection
  của ToothChart) vì đây là log append-only sẽ phình to theo thời gian sống của bệnh nhân;
  nhét vào ToothChart sẽ buộc phải load toàn bộ lịch sử mỗi lần chỉ cần xem trạng thái hiện
  tại. `ToothNumbers` (Domain.Shared): danh sách số răng chuẩn ISO 3950 duy nhất dùng trong
  toàn bộ backend — Palmer/Universal chỉ là hiển thị, KHÔNG lưu, convert ở frontend nếu cần
  sau này (chưa làm, hiện chỉ hiển thị số ISO).
  Răng vĩnh viễn: 11-18/21-28/31-38/41-48 (32 răng). Răng sữa: 51-55/61-65/71-75/81-85
  (20 răng) — chọn bộ nào dựa vào `Patient.IsChildPatient` lúc tạo chart lần đầu.
- **EF Core**: `IToothChartRepository` (custom repo interface ở Domain, implement ở
  EntityFrameworkCore) — **bắt buộc** vì cần `.Include(x => x.Records)` khi load
  (navigation dùng private backing field `_records`, phải `HasField` + generic
  `IRepository<ToothChart,Guid>` mặc định của ABP không hỗ trợ include tuỳ ý; Application
  layer không nên biết `Microsoft.EntityFrameworkCore` trực tiếp). Migration
  `AddToothChart`: 3 bảng `AppToothCharts`, `AppToothRecords`, `AppToothRecordHistories`.
- **Application**: `ToothChartAppService.GetAsync(id)` tạo chart **lazy** nếu bệnh nhân
  chưa có (insert toàn bộ `ToothRecord` Healthy cho đúng bộ răng). `UpdateStatusAsync`
  vừa cập nhật `ToothRecord` (ghi đè) vừa insert 1 `ToothRecordHistory` mới (không ghi đè)
  — 2 aggregate khác nhau nên AppService là nơi điều phối (đúng theo DDD, domain method
  của 1 aggregate không được tự ý ghi vào aggregate khác).
  **Lưu ý route ABP convention**: đặt tên method đúng `GetAsync(Guid id)` (tham số phải
  tên "id") thì ABP mới sinh route `{id}` trong path; nếu tên khác ("patientId") sẽ bị
  đẩy xuống query string dù cùng là action Get. Method custom (`UpdateStatusAsync`,
  `GetHistoryAsync`) thì mọi tham số Guid/int đầu vào tự động thành path segment theo thứ
  tự, không cần đặt tên "id". Ban đầu đặt tên method trùng theo kiểu
  `GetToothChartAsync`/`UpdateToothStatusAsync` khiến route bị lặp đoạn
  (`/tooth-chart/tooth-chart/{patientId}`) — đã đổi lại cho gọn.
  **Bẫy đã gặp**: sau khi thêm permission mới (`Dentify.ToothChart.*`) phải **chạy lại
  DbMigrator** (seed lại `AbpPermissionGrants` cho role admin) RỒI **restart backend**
  (permission checker có cache in-memory, không tự invalidate) — nếu không sẽ bị 403 dù
  code đúng.
- **Frontend**: `ToothChartSvg` component tự vẽ (không dùng thư viện SVG dạng răng có sẵn)
  — 2 hàng (hàm trên/dưới), mỗi răng là `<rect>` bo góc tô màu theo `ToothStatus` + label
  số răng bên dưới, click vào `<g>` mở dialog. `ToothChartPage` (route
  `/patients/:patientId/tooth-chart`, link từ nút icon 🙂 trong bảng Patients): dialog
  đổi status + notes, nút "Xem lịch sử" load on-demand (không tự load history khi mở dialog
  để đỡ 1 request không cần thiết cho thao tác đổi status thông thường).
  Enum wire format giữ đúng convention đã ghi trước đó (response = số, request = string).
- **Test**: `ToothChartAppServiceTests` (6 test: tạo lazy đúng bộ răng theo tuổi, không tạo
  lại lần 2, update + ghi history, nhiều lần đổi status không đè lịch sử cũ, tooth number
  không hợp lệ → BusinessException). Tổng test toàn repo: 16 → 22 (EfCoreTests) + 1
  (WebTests) = 23, tất cả pass.
  **Đã verify UI thật bằng Playwright** (không phải chỉ dotnet test): login → tạo bệnh
  nhân → mở sơ đồ răng → click răng 11 → đổi "Sâu răng" + ghi chú → lưu → răng đổi màu đỏ
  trên SVG + toast đúng → mở lại → xem lịch sử → thấy đúng entry vừa tạo. Không có lỗi
  console.
- Chưa làm (để lại cho lần sau): Photo upload (IBlobContainer) + Prescription chi tiết —
  đây là phần còn lại của Giai đoạn 2 theo kế hoạch gốc. Hiển thị theo Palmer/Universal
  notation ở frontend (hiện chỉ có ISO 3950). Không cho chọn `appointmentId` khi cập nhật
  tình trạng răng từ UI (field có trong API nhưng chưa có chỗ chọn lịch hẹn liên quan trên
  form — cần khi làm tích hợp Appointment ↔ ToothChart).

### 2026-07-05 (2) — Đổi kiến trúc: PostgreSQL + React frontend (shadcn) + Docker

Theo yêu cầu: tách frontend riêng (shadcn/React) gọi qua API, đổi DB sang PostgreSQL,
triển khai toàn bộ qua Docker. Đã xác nhận 2 quyết định với user trước khi làm: (1) auth
dùng **OAuth2 Authorization Code + PKCE** (không tự viết endpoint login/JWT riêng), (2)
**giữ nguyên Razor Pages admin** có sẵn của ABP (Identity/Permission/Setting/Tenant
Management), chỉ bỏ phần UI nghiệp vụ (Patient/Appointment) sang React.

- **Database → PostgreSQL**: đổi `Volo.Abp.EntityFrameworkCore.Sqlite` →
  `...PostgreSql`, `UseNpgsql()` trong `DentifyEntityFrameworkCoreModule` +
  `DentifyDbContextFactory`. Xoá migration SQLite cũ, tạo lại `InitialPostgreSql`.
  Bỏ `AddAlwaysDisableUnitOfWorkTransaction()`/`UnitOfWorkTransactionBehavior.Disabled`
  (workaround riêng cho SQLite, Postgres không cần).
  **Gotcha quan trọng**: Postgres `timestamp with time zone` chỉ nhận `DateTime` có
  `Kind=Utc` → set `AbpClockOptions.Kind = DateTimeKind.Utc` trong
  `DentifyDomainSharedModule`, và `Patient.SetDateOfBirth`/`Appointment.Reschedule` tự
  `DateTime.SpecifyKind(..., Utc)` trước khi gán (nếu không sẽ lỗi
  `Cannot write DateTime with Kind=Local/Unspecified... only UTC is supported` khi insert).
  EF Core Tests (SQLite in-memory) giữ nguyên — không cần Postgres thật để chạy test,
  đây là pattern chuẩn của ABP (test double độc lập với DB provider thật).
- **Auth cho SPA (PKCE)**: `DentifyWebModule` thêm
  `PreConfigure<OpenIddictServerBuilder>(b => b.RequireProofKeyForCodeExchange())`
  (bắt buộc PKCE cho MỌI client, vì helper `CreateOrUpdateApplicationAsync` của ABP
  không có tham số per-client cho PKCE). Thêm CORS (`App:CorsOrigins`,
  `app.UseCors()` ngay sau `UseRouting()`). Sửa `OpenIddictDataSeedContributor`: client
  `Dentify_App` đổi từ "Console Test/Angular" placeholder → SPA thật, chỉ còn
  `AuthorizationCode`+`RefreshToken` (bỏ `Password`/`ClientCredentials` — không hợp với
  public client), `RedirectUri = {RootUrl}/auth-callback` (đọc từ
  `OpenIddict:Applications:Dentify_App:RootUrl` trong appsettings của DbMigrator).
- **Bỏ UI nghiệp vụ Razor**: xoá `Pages/Patients`, `Pages/Appointments` + menu item
  tương ứng trong `DentifyMenuContributor`/`DentifyMenus`. Thêm 1 menu item link ra
  app React (đọc từ setting `App:ClientUrl`). AppServices/API giữ nguyên — chính là
  cái frontend mới gọi vào (`/api/app/patient`, `/api/app/appointment`, đã có sẵn từ
  Giai đoạn 1 nhờ `ConventionalControllers.Create(...)` — không cần thêm controller tay).
- **Frontend mới** (`frontend/`): Vite + React 19 + TypeScript + Tailwind v4 +
  shadcn/ui-style components (tự viết trong repo theo convention của shadcn — KHÔNG
  chạy `shadcn init`/CLI vì cần fetch từ ui.shadcn.com, không có trong allowlist mạng
  của sandbox; component thủ công dựa trên `@radix-ui/react-*` primitives, tương đương
  100% với output CLI sinh ra). `oidc-client-ts` cho PKCE flow (`UserManager`,
  `AuthProvider` context, `ProtectedRoute` tự redirect sang trang Login của AuthServer
  khi chưa đăng nhập). Trang Patients (CRUD + tags) và Appointments (CRUD + cập nhật
  thanh toán). **Lưu ý enum wire format**: response trả **số** (ordinal C#, do
  `AbpStringToEnumConverter.Write()` chủ động bỏ qua chính nó, chỉ áp dụng lúc đọc),
  request nhận **tên enum dạng string** — xem comment trong `types/patient.ts`.
- **Đã test end-to-end bằng Playwright thật** (không mock): chạy Postgres +
  backend (`dotnet run`, `ASPNETCORE_ENVIRONMENT=Development`,
  `AuthServer:RequireHttpsMetadata=false` trong `appsettings.Development.json` để
  OpenIddict chấp nhận HTTP khi dev) + frontend (`npm run dev`) thật, browser thật
  (Chromium qua Playwright) login bằng admin/1q2w3E\*, xác nhận redirect PKCE
  (`code_challenge`/`code_challenge_method=S256` trong URL), tạo Patient, tạo
  Appointment, cập nhật thanh toán (badge đổi màu đúng theo `PaymentStatus`) — tất cả
  chạy qua thật, không lỗi console (trừ 1 lỗi vô hại do React StrictMode double-invoke
  callback effect, đã fix bằng `useRef` guard trong `AuthCallbackPage`).
- **Docker**: viết lại `Dockerfile` cho `Web`/`DbMigrator` thành multi-stage build từ
  source (build context = repo root) — bản cũ chỉ COPY từ `bin/Release/.../publish`
  có sẵn, không tự build được. Thêm `Dockerfile`+`nginx.conf` cho `frontend` (build
  Vite rồi serve static qua nginx, SPA fallback `try_files ... /index.html`).
  `docker-compose.yml`: `postgres` + `db-migrator` (chạy 1 lần, seed xong thì thoát)
  + `backend` + `frontend`.
  **Quyết định quan trọng**: container `backend` chạy **Production** (không phải
  Development) — vì `DentifyWebModule.ConfigureVirtualFileSystem`/
  `AddRazorRuntimeCompilation` có nhánh `if (hostingEnvironment.IsDevelopment())` tự
  `ReplaceEmbeddedByPhysical` sang đường dẫn source tree sibling project (không tồn tại
  trong image đã publish) → crash `DirectoryNotFoundException` khi chạy Development
  trong container. Production dùng embedded resources + precompiled Razor views, đúng
  với 1 image chỉ có output publish. Nhưng Production lại cần file `openiddict.pfx`
  (OpenIddict signing cert) — Dockerfile tự sinh 1 cert placeholder bằng
  `dotnet dev-certs https -ep openiddict.pfx -p <passphrase>` ngay trong build stage
  (giống cách `Dockerfile.local` cũ định làm nhưng chưa hoàn thiện), passphrase mặc
  định khớp với `AuthServer:CertificatePassPhrase` đã có trong `appsettings.json`.
  `AuthServer:RequireHttpsMetadata=false` qua env var để OpenIddict chấp nhận HTTP
  (compose này chưa có TLS — cần reverse proxy + cert thật cho production thật sự).
  **Đã tự build và chạy container thật để verify** (dùng `mcr.microsoft.com/dotnet/*`
  images — pull được trong sandbox; `postgres`/`nginx`/`node` từ Docker Hub **bị chặn
  bởi policy mạng của sandbox này** — không phải lỗi Dockerfile, môi trường thật của
  user sẽ pull bình thường). Container `backend`/`db-migrator` build xong chạy được,
  gọi API/swagger/discovery/Account-Login qua container đều trả đúng.
- Chưa làm (để dành cho lần sau nếu cần): production thật (reverse proxy + TLS thật,
  không dùng cert placeholder), lỗi cosmetic health-check tự ping `0.0.0.0` (background
  job có sẵn từ scaffold, không phải do thay đổi lần này, không ảnh hưởng chức năng).

### 2026-07-05 (1) — Giai đoạn 1 (MVP): Patient + Appointment

- **Domain**: `Patient` (FullAuditedAggregateRoot) với `Gender`, `Tags` (List<string>,
  lưu JSON qua ValueConverter), `IsChildPatient` (computed, < 14 tuổi, `[Ignore]` trong EF).
  `Appointment` (FullAuditedAggregateRoot) với `Status`, `Price`/`PaidAmount`/`PaymentStatus`
  (tự tính lại qua `RecordPayment`/`SetPrice`, validate không cho trả vượt giá — business
  exception `Dentify:00003`).
- **EF Core**: thêm `AppPatients`, `AppAppointments` (migration
  `Added_Patient_Appointment`), FK Appointment→Patient. Đã chạy `DbMigrator` thành công
  (SQLite).
- **Application**: `PatientAppService` (CRUD + filter theo tên/SĐT/tag + tổng hợp
  `GetPatientDetailAsync` trả lịch hẹn gần nhất + tổng nợ), `AppointmentAppService`
  (CRUD + `GetCalendarViewAsync` + `UpdatePaymentAsync`, resolve tên bệnh nhân/bác sĩ
  qua repository). Dùng Mapperly cho chiều Entity→Dto (`PatientMapper`,
  `AppointmentMapper`), mapping Dto→Entity làm tay qua domain method để giữ invariant.
  **Bỏ qua `GeneratePatientPortalLinkAsync`** — Patient Portal thuộc Giai đoạn 5
  (tuỳ chọn), không implement dở dang.
- **Permissions**: `Dentify.Patients.{Default,Create,Update,Delete}`,
  `Dentify.Appointments.{Default,Create,Update,Delete,ManagePayment}`.
- **Localization**: thêm `vi.json` (ưu tiên tiếng Việt) + cập nhật `en.json`; đăng ký
  ngôn ngữ `vi` trong `DentifyDomainSharedModule`.
- **Web (MVC Razor Pages)**: menu "Patients"/"Appointments", Razor Pages
  `Pages/Patients` (Index + CreateModal/EditModal) và `Pages/Appointments`
  (Index + CreateModal/EditModal/PaymentModal), DataTables server-side qua JS proxy
  tự sinh của ABP (`giapTech.dentify.application.patients.patient`, `...appointments.appointment`).
  Đã cài `abp install-libs` (yarn cần `--ignore-engines` vì `select2` yêu cầu Node ≥24,
  máy hiện có Node 22 — không phải vấn đề runtime, chỉ là engines check của yarn).
  **Đã test thủ công bằng Playwright** (login admin, tạo/sửa/xoá Patient, tạo Appointment,
  cập nhật thanh toán) — toàn bộ luồng chạy đúng, không có lỗi console.
- **Tests**: `PatientAppServiceTests`/`AppointmentAppServiceTests` (abstract, theo pattern
  generic `<TStartupModule>` có sẵn của scaffold) + concrete `EfCorePatientAppServiceTests`/
  `EfCoreAppointmentAppServiceTests` trong `EntityFrameworkCore.Tests`. 13 test mới, tất cả pass.
- Chưa làm: `IsOperator` trên UserExtension (đánh dấu bác sĩ), Doctor hiện chọn từ toàn bộ
  Identity Users. LabWorkId/Photos trên Appointment chưa có (phụ thuộc module LabWork/Blob
  ở giai đoạn sau).

### 2026-06-29
- Khởi tạo Git repository, thêm `Dentify.db` và `openiddict.pfx` vào `.gitignore`.
- Tạo `CLAUDE.md` (mô tả dự án + cách chạy/quy ước) và `docs/PROGRESS.md` (file này).
- Xác nhận dự án hiện là scaffold ABP thuần — `DentifyDbContext` mới có module ABP
  (Identity, TenantManagement...), chưa có entity riêng; `DentifyPermissions` để trống.

## TODO / việc đang dở

- Giai đoạn 2: đã xong toàn bộ (Tooth Chart, Photo upload, Prescription chi tiết).
  Việc lặt vặt còn sót: UI xoá/sửa `Caption` cho ảnh appointment (field đã có ở domain,
  chưa có form nhập).
- Tooth Chart: hiển thị theo Palmer/Universal notation ở frontend (Setting
  `Clinic.ToothNotationSystem` — hiện chưa có UI Settings, chỉ mới có ISO 3950), cho chọn
  `appointmentId` liên quan khi cập nhật tình trạng răng.
- Cân nhắc thêm `IsOperator` (bool) trên UserExtension để lọc danh sách bác sĩ trong
  Appointment (hiện đang cho chọn từ toàn bộ Identity Users).
- Production thật cho Docker Compose: reverse proxy + TLS thật + `openiddict.pfx` thật
  thay placeholder tự sinh (xem nhật ký 2026-07-05 (2)).
- Giai đoạn 3: đã xong toàn bộ (LabWork + Kanban board + Expense). Việc lặt vặt còn sót
  (không nằm trong phạm vi đã chốt lúc đầu): liên kết Expense ↔ LabWork/Appointment,
  UI biểu đồ cho `ExpenseSummaryDto` (hiện chỉ có API, chưa hiển thị chart), filter/tìm
  kiếm trên board LabWork.
- Giai đoạn 4: đã xong toàn bộ (CSV Patient/Expense, Backup/Restore script, Settings
  phòng khám). Việc lặt vặt còn sót: CSV cho Appointment, upload logo trực tiếp (hiện
  chỉ nhận URL), UI Settings cho `ToothNotationSystem`.

## Cách backup / restore database

```bash
./scripts/backup-db.sh                    # tạo file backup-YYYYMMDD-HHMMSS.dump
./scripts/backup-db.sh my-backup.dump     # hoặc chỉ định tên file

./scripts/restore-db.sh my-backup.dump    # LƯU Ý: ghi đè toàn bộ dữ liệu hiện có
```

Script tự nhận diện container Postgres đang chạy qua `docker ps` (khớp tên chứa
"postgres"); nếu không có container nào thì tự fallback gọi `pg_dump`/`pg_restore` cục
bộ (yêu cầu Postgres cài trên máy, lắng nghe `localhost:5432`). Không cần cấu hình gì
thêm nếu dùng đúng `docker-compose.yml` mặc định của dự án.

## Quyết định kỹ thuật

- **DB dùng PostgreSQL** (đổi từ SQLite ngày 2026-07-05). Local dev: chạy Postgres qua
  `docker compose up -d postgres` hoặc cài local, connection string trong
  `ConnectionStrings:Default`. `AbpClockOptions.Kind = Utc` bắt buộc (xem nhật ký).
- **Kiến trúc 2 phần**: backend ABP (AuthServer + API + admin Razor) và frontend React
  (shadcn) tách rời, giao tiếp qua REST + OAuth2 PKCE — không dùng chung process/host.
  UI nghiệp vụ (Patient/Appointment/...) chỉ còn ở React; Razor chỉ giữ cho
  Identity/Permission/Setting/Tenant Management (built-in của ABP) + Account/Login
  (bắt buộc phải có cho PKCE redirect).
- `Patient.Tags`: dùng `List<string>` map qua `HasConversion` (JSON) thành 1 cột TEXT,
  không tách bảng `PatientTag` riêng — đơn giản hơn cho quy mô 1 phòng khám, dễ nâng cấp
  lên bảng riêng sau nếu cần many-to-many thật (vd tag dùng chung style tag-cloud).
- AppService **không dùng `CrudAppService` generic** của ABP — viết tay từng method, gọi
  domain method (`SetTags`, `RecordPayment`,...) để giữ business invariant, chỉ dùng
  Mapperly cho chiều Entity→Dto (dữ liệu phẳng, không có logic).
- Frontend components trong `frontend/src/components/ui/` là code tự viết theo convention
  shadcn (vendor-in-repo), không phải package npm "shadcn" — đúng triết lý gốc của
  shadcn (copy-paste ownership), và tránh phải gọi CLI cần mạng ra ngoài allowlist.
- `ToothRecordHistory` là aggregate root độc lập, không phải child collection của
  `ToothChart` — log append-only phình to vô hạn theo thời gian, tách riêng để không phải
  load hết lịch sử mỗi lần chỉ cần xem trạng thái hiện tại (xem nhật ký 2026-07-06).
- Số răng dùng **duy nhất chuẩn ISO 3950** trong toàn bộ backend/API; Palmer/Universal (nếu
  làm) chỉ là convert hiển thị ở frontend, không lưu thêm cột nào — tránh phải đồng bộ 3
  hệ ký hiệu mỗi khi đổi trạng thái răng.
- `AppointmentPhoto` là aggregate root độc lập (không phải child collection của
  `Appointment`), lưu blob qua ABP `BlobStoring.Database` provider (blob nằm trong
  Postgres, không phải filesystem) — đơn giản hoá backup/Docker, đổi provider sau chỉ
  cần sửa cấu hình (xem nhật ký 2026-07-06 (2)).
- Upload/download file dùng `IRemoteStreamContent` của ABP qua AppService thay vì viết
  Controller MVC tay — nhất quán với cách các AppService khác tự sinh route, dù cái giá
  là route download bị sinh ra dạng `POST` thay vì `GET` (frontend phải tự fetch bằng
  POST rồi tạo blob URL, không gán thẳng vào `<img src>`).
- `PrescriptionItem` là **child collection thật của `Appointment`** (khác với
  `AppointmentPhoto`/`ToothRecordHistory` — 2 cái đó là aggregate root độc lập) vì số
  lượng bị chặn nhỏ và luôn cần load cùng lúc với appointment; constructor/setter
  `internal`, chỉ sửa qua domain method của `Appointment`
  (`Add/Update/RemovePrescriptionItem`) — đúng nguyên tắc DDD 1 aggregate root kiểm soát
  toàn bộ entity con của nó. Field `Prescription` (text tự do) cũ đã bị xoá hẳn, không
  giữ song song (xem nhật ký 2026-07-06 (3)).
- List views (`GetListAsync`, `GetCalendarViewAsync`) của Appointment **không**
  include `PrescriptionItems` (tránh join thừa cho màn hình danh sách) — bất kỳ màn hình
  nào cần đơn thuốc đầy đủ phải tự gọi `GetAsync(id)` để lấy chi tiết, không được giả định
  object từ danh sách đã có sẵn navigation collection.
- **Kanban chỉ là UI**, không phải entity/domain riêng — board hiển thị dữ liệu `LabWork`
  thật theo trạng thái (`GetBoardAsync`), kéo-thả gọi `UpdateStatusAsync`. Quyết định
  này giữ cho không phải đồng bộ 2 nguồn dữ liệu (LabWork thật + Card/Task ảo) — nếu sau
  này cần Kanban cho quy trình khác (vd luồng khám bệnh nhân trong ngày) thì làm thêm 1
  board render khác trên cùng nguyên tắc, không tạo entity Task chung chung.
- **Expense độc lập, không liên kết trực tiếp với LabWork/Appointment** — chi phí labo
  ghi trên `LabWork.Cost` chỉ để tham khảo, không tự sinh ra 1 dòng `Expense` tương ứng.
  Đơn giản hoá cho quy mô hiện tại; nếu cần báo cáo lợi nhuận chính xác (doanh thu -
  chi phí thật) thì làm liên kết lúc đó, tránh code 2 nơi cùng đại diện 1 khái niệm chi
  phí ngay từ đầu khi chưa rõ nhu cầu báo cáo cụ thể.
- Mapperly `[Mapper] partial class` **không tự động đăng ký DI** — mọi mapper mới phải
  thêm `context.Services.AddSingleton<XxxMapper>()` thủ công trong
  `DentifyApplicationModule.ConfigureServices`. Quên bước này không gây lỗi biên dịch,
  chỉ crash lúc runtime/test khi DI resolve AppService — luôn nhớ kiểm tra bước này khi
  thêm AppService mới dùng Mapperly (xem nhật ký 2026-07-06 (4)).
- **CSV import/export xử lý ở frontend**, không có endpoint backend riêng — Export gọi
  thẳng API list đã có rồi convert JS, Import đọc CSV rồi gọi tuần tự API Create đã có
  cho từng dòng. Tận dụng validation/business rule có sẵn, tránh viết lại lần 2 cho
  batch; đánh đổi là import file rất lớn sẽ chậm hơn bulk insert thật (chấp nhận được ở
  quy mô 1 phòng khám). Xem nhật ký 2026-07-07.
- **Settings dùng `ISettingManager`/`ISettingProvider` thật của ABP**, KHÔNG dùng UI
  Settings có sẵn của `Volo.Abp.SettingManagement.Web` (vốn cắm vào admin Razor) — vì
  toàn bộ UI nghiệp vụ đã chuyển sang React từ đầu dự án. Mỗi nhóm setting mới (ngoài
  Email đã có sẵn AppService của module) cần tự viết AppService riêng expose qua REST,
  không có generic endpoint nào của ABP SettingManagement cho custom setting.
- **Backup/Restore dùng script `pg_dump`/`pg_restore` thuần**, không xây tính năng
  trong app — tin cậy hơn, không phải tự xử lý file lớn/transaction/downtime. Script tự
  nhận diện container Postgres qua `docker ps`, fallback gọi thẳng nếu chạy Postgres
  local không qua Docker.
- **`window.confirm()` bị cấm dùng cho xoá dữ liệu** — luôn dùng `AlertDialog` (Radix,
  qua wrapper `ConfirmDialog`) để có thể custom message, đồng bộ theme, và có state
  loading/disable khi đang xử lý xoá. Mọi trang mới thêm sau này khi cần confirm-xoá
  phải tái dùng `ConfirmDialog`, không tự viết `confirm()` mới.
- **Kéo-thả (drag & drop) trên Kanban luôn phải có phương án thay thế không cần chuột**
  (vd Select đổi trạng thái ngay trên card) — HTML5 `draggable` không hoạt động trên
  thiết bị cảm ứng, và nhân viên phòng khám có thể dùng tablet. Áp dụng cho LabWorks,
  và bất kỳ Kanban nào làm thêm sau này.
- **Mọi phần tử tương tác được (click để mở dialog/đổi trạng thái) phải có `role`,
  `tabIndex`, `aria-label`, và xử lý phím Enter/Space** nếu không phải là `<button>`
  gốc — áp dụng sau khi phát hiện `ToothChartSvg` hoàn toàn không dùng được bằng bàn
  phím (xem nhật ký 2026-07-07 (2)).
- **Calendar dùng thư viện `@fullcalendar/react` thay vì tự viết** — chi phí tự làm
  đúng UX kéo-thả/resize/multi-view (Tháng/Tuần/Ngày) quá cao so với lợi ích, và
  `Appointment.getCalendarView` API đã có sẵn từ Giai đoạn 1 chỉ cần 1 UI thật sự dùng
  tới. Lịch hẹn hiển thị thời lượng cố định 30 phút trên calendar (không lưu DB) vì
  domain hiện không có trường thời lượng — chấp nhận được cho mục đích hiển thị.
- **`TaskItem` là entity độc lập, đặt tên khác `Task`** để không trùng/nhầm với
  `System.Threading.Tasks.Task` dùng khắp AppService async. `ToggleDoneAsync` tách
  riêng khỏi `UpdateAsync` vì đây là thao tác tần suất cao nhất, cần optimistic-update
  ở frontend mà không gửi lại toàn bộ form.
- **Dashboard không có endpoint backend riêng** — gọi song song các API list/summary đã
  có sẵn của từng module qua `Promise.all`. Nếu sau này thêm số liệu tổng hợp phức tạp
  hơn (biểu đồ theo thời gian, so sánh kỳ) thì mới cân nhắc viết 1
  `IDashboardAppService` riêng để tránh N request round-trip.
