<p align="center">
  <img src="thumb.jpg" alt="TimeLab - GitLab KPI & Timesheet Tracker" width="100%">
</p>

[Get extension Now!!!!](https://chromewebstore.google.com/detail/timelab/fioheeakbiikdfdinlakklimplhlicbe?authuser=3&hl=vi)


# TimeLab - GitLab KPI, Timesheet & Spent Time Tracker ⏱️📊

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/version-1.0.6-blue.svg)](manifest.json)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Brave-orange.svg)](https://www.google.com/chrome/)
[![Language](https://img.shields.io/badge/language-Tiếng%20Việt%20%7C%20English-blueviolet.svg)](i18n.js)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20Local--First-success.svg)](PRIVACY.md)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

**TimeLab** là bộ công cụ toàn diện (All-in-One Productivity Suite) dành cho Software Engineers, Tech Leads và các đội ngũ dự án làm việc trên nền tảng **GitLab**. Tiện ích giúp tự động hóa quá trình theo dõi tiến độ công việc, kiểm soát thời gian đã bỏ ra (spent time) so với ước lượng (estimate), chấm công hàng ngày (timesheet audit) và tính toán hiệu suất (KPI) trực quan.

Tiện ích tương thích 100% với cả **GitLab.com** (public) lẫn các máy chủ **GitLab Private / On-Premise** (tự lưu trữ nội bộ).

---

## 📸 Hình ảnh mẫu giao diện (Screenshots)

### 1. Bảng điều khiển KPI & Danh sách công việc (KPI Dashboard & Popup)
Theo dõi tổng hợp thời gian Estimate vs Spent, tỷ lệ hoàn thành đúng hạn, phân loại công việc và thẻ điều khiển nhanh trên popup trình duyệt.

![KPI Dashboard & Work Items](docs/store-assets/screenshot1_dashboard_1280x800.png)

---

### 2. Phân tích tháng & Lưới chấm công (Monthly Analytics & Daily Timesheet Audit)
Dự báo điểm KPI, phân tích biểu đồ trực quan (Chart.js) và lưới lịch 30 ngày giúp phát hiện ngay các ngày thiếu giờ log hoặc chưa ghi nhận công việc.

![Monthly Analytics & Timesheet](docs/store-assets/screenshot2_analytics_1280x800.png)

---

### 3. Modal tóm tắt công việc con nhúng trực tiếp trong GitLab (In-Page Sub-Tasks Summary)
Nút bấm thông minh được nhúng thẳng vào giao diện GitLab Issue / Merge Request, mở modal thống kê chi tiết tiến độ các task con và hỗ trợ thêm vào KPI chỉ với 1 click.

![GitLab In-Page Modal](docs/store-assets/screenshot3_modal_1280x800.png)

---

## 🌟 Tính năng nổi bật

### 1. 📈 Thống kê & Dự báo điểm KPI chuyên sâu
- **Tự động tính toán điểm KPI**: Đánh giá dựa trên độ chính xác ước lượng (estimate accuracy), tốc độ hoàn thành (velocity) và tỷ lệ tuân thủ thời gian log giờ (target 8h/ngày).
- **Phân loại công việc đa chiều**: Kế hoạch (Planned) vs Phát sinh (Unplanned), Đúng hạn (On-time) vs Trễ hạn (Late), đếm số lần Reopen.
- **Biểu đồ trực quan (Offline Chart.js)**:
  - So sánh Estimate vs Spent theo từng tuần.
  - Cơ cấu công việc theo loại (Pie chart: Planned vs Unplanned).
  - Tỉ lệ trạng thái công việc (Doughnut chart: Đúng hạn, Trễ hạn, Đang mở).
  - Đường xu hướng biến động điểm KPI qua các tuần trong tháng.
- **Xuất báo cáo Excel (.xlsx)**: Xuất bảng KPI tuần và tháng ra file Excel chuẩn định dạng chỉ với 1 cú click (tích hợp offline engine ExcelJS).

### 2. 📅 Chấm công hàng ngày (Daily Timesheet Audit)
- **Lưới lịch tháng thông minh**: Hiển thị tổng giờ làm từng ngày so với chỉ tiêu chuẩn (8 giờ/ngày).
- **Cảnh báo thiếu giờ (Unlogged / Deficit)**: Tô màu trực quan các ngày log thiếu giờ hoặc quên log.
- **Quản lý ngày nghỉ**: Hỗ trợ đánh dấu nghỉ phép nguyên ngày (1 ngày) hoặc nửa ngày (0.5 ngày) để hệ thống tự động điều chỉnh chỉ tiêu giờ và tính điểm KPI chuẩn xác nhất.

### 3. 🧩 Nhúng thông minh vào giao diện GitLab (In-Page Integration)
- Tự động thêm nút **"KPI Summary"** ngay trên thanh tác vụ của trang Issue, Work Item và Merge Request trên GitLab.
- Hiển thị cây công việc con (child tasks / task items) kèm thống kê tổng quan: Tổng số task, tổng estimate, tổng spent, chênh lệch (difference) và tỉ lệ đúng hạn.
- Hỗ trợ thêm nhanh từng task hoặc thêm toàn bộ (+ Add All to KPI) vào danh sách theo dõi.

### 4. ⏰ Cảnh báo cuối ngày (End-of-Day Unadded Tasks Reminder)
- Tự động rà soát ngầm các công việc bạn tạo hoặc thực hiện trong ngày trên GitLab.
- Nhắc nhở qua **Desktop Notification** và huy hiệu cảnh báo (`!`) trên icon extension trước giờ tan ca nếu còn công việc chưa được thêm vào bảng KPI.
- Hỗ trợ nút **"Thêm tất cả" (1-click batch add)** ngay trên banner cảnh báo của Popup.

### 5. 🌐 Hỗ trợ GitLab Cloud & Tùy chỉnh máy chủ Self-Hosted
- Hỗ trợ cả **GitLab.com** lẫn các domain doanh nghiệp nội bộ (ví dụ: `https://gitlab.mycompany.com`).
- Bộ chuyển đổi nhanh (Quick Select Pills) và link tạo Personal Access Token tương ứng cho từng server.
- Tự động đăng ký **Dynamic Content Script (Manifest V3)** theo domain máy chủ bạn cấu hình mà không cần sửa code.

### 6. 📝 Bảng việc Kanban & Sổ tay ghi chú đa năng (Kanban & Notepad)
- **Kanban Board**: Quản lý đầu việc hàng ngày qua 4 cột kéo thả (To Do, In Progress, Review, Done).
- **Sticky Notepad**: Sổ tay ghi chú đa thẻ (multi-tab) hỗ trợ định dạng Markdown, tự động lưu (auto-save), backup và restore dữ liệu.
- **Chế độ xem linh hoạt**: Mở được trong popup, mở toàn màn hình (Full Tab) hoặc chạy dưới dạng cửa sổ độc lập (Desktop Window).

### 7. 🔔 Nhắc nhở Check-in / Check-out & Daily Report
- Báo thức thông minh nhắc nhở giờ điểm danh buổi sáng và chấm công buổi chiều từ Thứ 2 đến Thứ 6.
- Liên kết nhanh đến cổng chấm công của công ty.
- **Daily Task Generator**: Tự động tổng hợp danh sách các công việc đã làm trong ngày để gửi báo cáo daily meeting/chat group (tự động copy vào clipboard).

### 8. 🌐 Đa ngôn ngữ (Multilingual VI / EN)
- Hỗ trợ song ngữ hoàn chỉnh **Tiếng Việt 🇻🇳** và **English 🇬🇧**.
- Chuyển đổi ngôn ngữ 1-click tức thì, đồng bộ xuyên suốt từ Popup, Dashboard, Kanban, Note đến Modal nhúng trong trang GitLab.

---

## 🔒 Cam kết Bảo mật & Quyền riêng tư (Privacy-First)

- **100% Local-First**: Toàn bộ dữ liệu, Access Token cá nhân, ghi chú và danh sách công việc đều được lưu trữ trực tiếp trên trình duyệt máy bạn (`chrome.storage.local`).
- **Zero Telemetry**: Extension hoàn toàn **không** gắn mã theo dõi, **không** thu thập thông tin người dùng và **không** có server bên thứ ba.
- **Kết nối trực tiếp**: Mọi kết nối API được thực hiện trực tiếp giữa trình duyệt của bạn và máy chủ GitLab thông qua token của bạn.
- **Tuân thủ Manifest V3 CSP**: Tuyệt đối không nạp mã từ xa (`no remote scripts`), các thư viện (Chart.js, ExcelJS) đều được đóng gói offline bên trong extension.
- **Chính sách chi tiết**: Đọc toàn bộ văn bản [Chính sách quyền riêng tư (Privacy Policy)](PRIVACY.md).

---

## 📥 Hướng dẫn cài đặt

### Cách 1: Cài đặt từ mã nguồn (Developer Mode)

1. Tải repository này về máy tính (hoặc sử dụng `git clone`).
2. Mở trình duyệt Chrome (hoặc Edge, Brave, Cốc Cốc, Opera).
3. Truy cập địa chỉ `chrome://extensions/` trên thanh địa chỉ.
4. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
5. Nhấn nút **Load unpacked** (Tải tiện ích đã giải nén).
6. Chọn thư mục dự án `KPIGitlabExtension`.

### Cách 2: Cài đặt từ gói Release Zip

1. Tải file `timelab-extension-v1.0.6.zip` từ thư mục [release/](release/).
2. Giải nén file zip vào một thư mục cố định trên máy.
3. Mở `chrome://extensions/` -> bật **Developer mode** -> chọn **Load unpacked** đến thư mục vừa giải nén.

---

## 🚀 Hướng dẫn cấu hình & bắt đầu sử dụng

1. **Đăng nhập & Cấu hình máy chủ**:
   - Nhấn vào biểu tượng icon extension trên thanh công cụ trình duyệt.
   - Nhập hoặc chọn URL máy chủ GitLab của bạn (mặc định `https://gitlab.com` hoặc domain công ty).
   - Nhấn vào liên kết *"Lấy Token tại đây"* để mở nhanh trang tạo Personal Access Token trên GitLab (cần cấp quyền `api` hoặc `read_api`).
   - Dán token vào ô và nhấn **Đăng nhập**.

2. **Thu thập công việc**:
   - Khi xem một Issue / Merge Request trên GitLab, nhấn nút **"Add to KPI"** hoặc mở modal **"KPI Summary"** để chọn các task con đưa vào danh sách theo dõi.

3. **Xem Dashboard & Báo cáo**:
   - Nhấn **Open Dashboard** từ popup để mở giao diện phân tích toàn diện.
   - Chọn tháng, tuần hoặc ngày cần xem.
   - Xem lưới chấm công Timesheet, kiểm tra biểu đồ và tải file Excel báo cáo khi cần.

---

## 🛠 Cấu trúc mã nguồn

```text
KPIGitlabExtension/
├── manifest.json              # Cấu hình Chrome Extension (Manifest V3)
├── background.js              # Service Worker: Lập lịch alarms, thông báo, dynamic content scripts
├── utils.js                   # Tiện ích dùng chung: Chuẩn hóa URL, ngày giờ, storage, filter KPI
├── i18n.js                    # Động cơ đa ngôn ngữ & từ điển song ngữ VI / EN
├── content_issue.js           # Content Script nhúng nút & modal KPI vào trang Issue / Work Item
├── content_request.js         # Content Script hỗ trợ trang Merge Request
├── icon16.png, icon32.png...  # Bộ biểu tượng ứng dụng
├── popup/                     # Giao diện Popup Extension
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── page/                      # Giao diện Dashboard chính (Báo cáo & Phân tích)
│   ├── page.html
│   ├── page.css
│   ├── page.js
│   ├── chart.umd.min.js       # Thư viện vẽ biểu đồ offline (Chart.js)
│   ├── exceljs.min.js         # Thư viện xuất Excel offline (ExcelJS)
│   └── kpi_template.xlsx      # Template mẫu xuất KPI
├── todo/                      # Phân hệ bảng việc Kanban To-Do Board
├── note/                      # Phân hệ sổ tay ghi chú Sticky Notepad
├── docs/                      # Tài liệu dự án & Hướng dẫn nộp Chrome Web Store
│   ├── store-assets/          # Ảnh chụp màn hình chuẩn 1280x800 phục vụ deploy
│   └── CHROME_STORE_SUBMISSION.md
└── release/                   # Gói đóng gói sản phẩm (.zip) sẵn sàng upload Store
```

---

## 🧪 Kiểm thử & Đóng gói (Testing & Packaging)

Dự án sở hữu pipeline kiểm thử hồi quy tự động toàn diện:

```bash
# Chạy toàn bộ 12 test suites và kiểm tra 24 chỉ tiêu bảo mật / cú pháp:
node scratch/test_full_suite.js

# Đóng gói tự động bản build sản phẩm sạch cho Chrome Web Store:
node scratch/build_release_zip.js
```

---

---

*TimeLab được phát triển nhằm tối ưu hóa hiệu suất làm việc, tính minh bạch và sự tiện lợi tối đa cho kỹ sư phần mềm khi làm việc với hệ sinh thái GitLab.*
