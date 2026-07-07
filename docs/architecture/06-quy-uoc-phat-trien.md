# 06 — Quy ước phát triển

> Quy trình chuẩn khi thêm 1 tính năng mới, và các bài học đã rút ra qua nhiều lần lặp
> lại lỗi tương tự trong lịch sử dự án. Đọc file này TRƯỚC khi bắt đầu code — mục tiêu là
> không lặp lại đúng những lỗi đã từng xảy ra.

## Quy trình thêm entity mới (chuẩn ABP DDD, theo đúng thứ tự)

1. **Entity** trong `Domain` — kế thừa `AggregateRoot<Guid>` hoặc
   `FullAuditedAggregateRoot<Guid>` (có soft-delete + full audit) hoặc
   `CreationAuditedAggregateRoot<Guid>` (chỉ audit tạo, dùng cho entity không cần sửa sau
   khi tạo như `Payment`, `AppointmentPhoto`). Nếu là entity con thật (chỉ tồn tại trong
   1 aggregate, ví dụ `PrescriptionItem`) — constructor và setter đặt `internal`, chỉ
   expose domain method qua aggregate root chứa nó.
2. **EF Core**: thêm `DbSet<>` + cấu hình trong `DentifyDbContext.OnModelCreating` (max
   length, FK, index). Nếu thêm `List<string>`/`List<int>` — dùng `HasConversion` JSON +
   `ValueComparer` theo mẫu `Patient.Tags`, **`defaultValue` phải là JSON hợp lệ** (`"[]"`
   cho list rỗng, không phải `""` — xem bug đã fix ở `04-kien-truc-ky-thuat.md`). Sau đó:
   ```bash
   dotnet ef migrations add <Tên> --project src/GiapTech.Dentify.EntityFrameworkCore --startup-project src/GiapTech.Dentify.DbMigrator
   ```
   rồi chạy `DbMigrator` (xem `05-trien-khai-van-hanh.md` mục Gotcha #1 — build trước,
   chạy `.dll` trực tiếp, không dùng `dotnet run --project`).
3. **DTOs + interface AppService** trong `Application.Contracts`.
4. **Permissions**: khai báo trong `DentifyPermissions` + đăng ký ở
   `DentifyPermissionDefinitionProvider`. **Chạy lại DbMigrator VÀ restart backend** sau
   khi thêm permission mới — cache permission-check không tự invalidate.
5. **AppService** trong `Application`. **Nếu tạo Mapperly mapper mới** (`[Mapper]
   partial class`) — **ngay lập tức** thêm
   `context.Services.AddSingleton<XxxMapper>()` vào `DentifyApplicationModule.
   ConfigureServices`. Đây là lỗi đã lặp lại nhiều lần: build vẫn pass nếu quên, chỉ
   crash lúc runtime khi DI resolve AppService — đừng đợi tới lúc test mới phát hiện.
6. **UI**: trang mới trong `frontend/src/pages` gọi `/api/app/...`. Nếu là màn quản trị
   dùng module có sẵn của ABP (Identity/Permission/Setting/Tenant) thì không cần làm gì
   thêm ở `Web` — Razor Pages có sẵn đã đủ, không viết lại bằng React.

## Quy tắc frontend cần tuân theo

- **Danh sách (`GetListAsync`) không include navigation collection nặng** (ví dụ
  `PrescriptionItems`, `Payments` không có trong `AppointmentDto` khi lấy từ bảng danh
  sách) — nếu cần mở form sửa 1 entity có child collection, **phải gọi lại
  `GetAsync(id)`** để lấy dữ liệu đầy đủ trước khi điền form. Bỏ qua bước này đã từng gây
  bug mất dữ liệu thật (mở form sửa dùng object cụt từ danh sách, lưu lại xoá sạch đơn
  thuốc hiện có) — xem `docs/PROGRESS.md` Giai đoạn 2.
- **`window.confirm()` bị cấm dùng cho xoá dữ liệu** — luôn dùng `ConfirmDialog`
  (`components/ConfirmDialog.tsx`, wrapper AlertDialog của Radix).
- **Kéo-thả (drag & drop) luôn cần phương án thay thế không cần chuột** — HTML5
  `draggable` không hoạt động trên thiết bị cảm ứng. Pattern chuẩn: cùng 1 hàm xử lý
  (`changeStatus`) được gọi cả từ `onDrop` và từ 1 `Select` hiển thị song song trên UI
  (xem `LabWorksPage`).
- **Mọi phần tử tương tác không phải `<button>` gốc** phải có `role`, `tabIndex`,
  `aria-label`, xử lý `onKeyDown` cho Enter/Space (xem `ToothChartSvg` — mỗi `<g>` đại
  diện 1 răng).
- **Action ẩn-khi-hover** (`opacity-0 group-hover:opacity-100`) **luôn phải xét lại trên
  mobile** — đổi thành `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` (luôn hiện
  dưới breakpoint `sm`, chỉ ẩn/hiện theo hover trên màn hình đủ rộng có chuột thật). Đã
  xảy ra 2 lần trong lịch sử dự án (`AppointmentPhotosDialog`, `TasksPage`).
- **`Skeleton` (render ra `<div>`) không được lồng trong `<p>`** — HTML không cho phép
  block-level element trong `<p>`, gây warning hydration của React. Đổi thẻ cha sang
  `<div>`, bọc text trong `<span>` nếu cần. Lỗi loại này chỉ lộ ra qua console log khi
  chạy trình duyệt thật, **không bị bắt bởi `tsc`/`vite build`**.
- **Dashboard/trang tổng hợp nhiều nguồn dữ liệu độc lập** — dùng `Promise.allSettled`
  (không phải `Promise.all`), mỗi phần dữ liệu kiểu `T | null` riêng biệt, 1 API lỗi chỉ
  làm phần đó hiện "—"/thông báo cục bộ, không kéo sập toàn trang.

## Verify tính năng mới — luôn qua 3 bước

1. **`dotnet build` + `dotnet test`** (in-memory, không cần Postgres/Docker — xem
   `04-kien-truc-ky-thuat.md`).
2. **`npx tsc -b` + `npx oxlint` + `npm run build`** (frontend).
3. **Verify UI thật bằng Playwright** — cài tạm, xoá ngay sau khi verify xong:
   ```bash
   npm install -D playwright --cache /tmp/npm-cache-dentify   # hoặc scratchpad session
   npx playwright install chromium
   # ... viết script .cjs verify, chạy node script.cjs ...
   npm uninstall playwright
   rm verify-*.cjs
   ```
   Đăng nhập qua PKCE thật (điền form login của AuthServer), dùng
   `page.waitForFunction` để chờ điều kiện thay vì `waitForURL` cứng (route SPA sau login
   redirect về `/patients`, không phải `/`). Đây là bước **bắt buộc** — nhiều bug thật
   (mất dữ liệu, lỗi HTML hydration, migration default value sai) chỉ lộ ra qua browser
   thật, không bị bắt bởi build/test tự động. Không tin "build xanh" là đủ.

## Gotcha môi trường (máy chạy agent/CI khác máy dev thường)

- Nếu máy chỉ có .NET SDK cũ hơn 10, cài SDK 10 vào thư mục riêng
  (`~/.dotnet10`, xem `05-trien-khai-van-hanh.md`) — không cần quyền ghi global.
- Nếu Postgres container "biến mất" giữa session (không phải chỉ dừng — `docker ps -a`
  không thấy cả container đã exit, thường do Docker Desktop restart hoặc dọn volume):
  chạy lại `docker compose up -d postgres` (tạo container mới) rồi **chạy lại
  DbMigrator** để tái tạo schema + seed — dữ liệu test cũ sẽ mất theo, cần tạo lại qua UI
  nếu cần verify.

## Quy trình làm việc theo giai đoạn (cách dự án đã vận hành, tiếp tục áp dụng)

Với mỗi tính năng/nhóm tính năng lớn: `EnterPlanMode` → khảo sát bằng agent Explore (đọc
code thật, không suy diễn) → viết plan cụ thể (Context + phần cần sửa + verification) →
duyệt qua `ExitPlanMode` → code → build/test → verify Playwright → dọn dẹp file/package
tạm → cập nhật `docs/PROGRESS.md` (nhật ký) và các file `docs/architecture/*.md` liên
quan (nếu kiến trúc/chức năng đổi) → hỏi user trước khi `git commit`/`push` (không tự
commit nếu không được yêu cầu rõ).

## Quy ước đặt tên & mã lỗi

- Localization: `Localization/Dentify/*.json` trong `Domain.Shared` (2 file: `en.json`,
  `vi.json`).
- Mã lỗi nghiệp vụ: `DentifyDomainErrorCodes` (format `Dentify:000NN`, tăng dần theo thứ
  tự thêm mới, không tái sử dụng số đã bỏ).
- Namespace gốc: `GiapTech.Dentify`.
- Entity con tên có thể trùng khái niệm với `System.Threading.Tasks.Task` — đã đổi thành
  `TaskItem` để tránh nhầm lẫn trong signature async (`Task<TaskItemDto>` dễ đọc hơn
  `Task<TaskDto>`).

## Đồng bộ giữa các máy

- Code qua **Git remote** — `git pull` trước khi làm, `git push` sau khi xong (khi được
  yêu cầu).
- Tiến độ/quyết định theo thời gian: `docs/PROGRESS.md` (nhật ký, commit chung repo).
- Kiến trúc/chức năng hiện tại: `docs/architecture/*.md` (6 file này — ảnh chụp trạng
  thái, cập nhật lại khi đổi kiến trúc, không phải nhật ký).
- Memory cục bộ của Claude (`~/.claude/.../memory`) **không đi theo git** — thông tin
  dùng chung phải nằm trong `CLAUDE.md`, `docs/PROGRESS.md`, hoặc `docs/architecture/`.
