# Chrome Web Store Submission Guide & Privacy Policy: TimeLab

This document contains the complete metadata, single-purpose declaration, reviewer permission justifications, privacy policy, and step-by-step submission walkthrough for publishing **TimeLab** on the Google Chrome Web Store.

---

## 1. Store Listing Metadata

### General Info
- **Extension Name:** `TimeLab - GitLab KPI, Timesheet & Spent Time Tracker`
- **Short Name:** `TimeLab`
- **Current Version:** `1.0.7`
- **Primary Category:** `Productivity`
- **Secondary Category:** `Developer Tools`
- **Primary Language:** `English` (with built-in Vietnamese & English runtime toggle)
- **Pricing:** `Free`

### Summary / Short Description (Maximum 132 characters)
> `Track GitLab timesheets, calculate monthly developer KPIs, audit daily spent time, manage tasks with Kanban & smart alarms.`
*(Exact length: 124 characters)*

---

### Detailed Description (Plain Text - Copy & Paste directly into Chrome Web Store Console)

```text
TimeLab is an all-in-one developer productivity suite built specifically for software engineers and project teams working on GitLab. Seamlessly track timesheets, calculate monthly KPI performance, audit spent time against estimates, and streamline your daily workflow across both public GitLab.com and private self-hosted GitLab instances.

KEY CAPABILITIES:

1. COMPREHENSIVE TIMESHEET & DAILY AUDIT
• Visual monthly calendar grid showing daily spent time vs. working hours (8h standard).
• Instant detection of missed or under-logged days with color-coded status indicators.
• Support for 1-day and 0.5-day annual leave or holidays to keep KPI percentages accurate.
• One-click export of timesheets and KPI performance reports to formatted Excel spreadsheets (.xlsx).

2. ADVANCED KPI & PERFORMANCE ANALYTICS
• Automated KPI percentage calculation combining task estimation accuracy, delivery velocity, and total logged hours.
• Monthly visual charts: Weekly Spent vs. Estimated hours, Task Type distribution, Task Status breakdown, and KPI trend charts.
• Offline vendor libraries (Chart.js & ExcelJS) ensure instant rendering without remote dependencies or external tracking.

3. IN-PAGE GITLAB ISSUE SUMMARY MODAL
• Directly injects a lightweight "KPI Summary" button into GitLab Issue, Work Item, and Merge Request pages.
• Displays real-time child task progress, assignee breakdown, total spent time, and overdue alerts right inside GitLab.
• Fast toggle to include or exclude specific child tasks from your monthly KPI calculations.

4. END-OF-DAY UNADDED TASKS REMINDER
• Automatic background scan before your shift ends to detect tasks you created or worked on today that are not yet added to your KPI list.
• Native desktop notification and badge alerts ensure you never miss logging your daily work before clocking out.

5. INTEGRATED KANBAN TO-DO & STICKY NOTEPAD
• Drag-and-drop Kanban board (To Do, In Progress, Review, Done) to manage daily priorities.
• Multi-tab markdown-enabled Sticky Notepad for quick code snippets, meeting minutes, and scratchpads.
• Open boards and notes in a popup modal, standalone browser tab, or separate desktop window.

6. WORKDAY CHECK-IN & CHECK-OUT ALARMS
• Configurable workday reminders (Monday to Friday) for morning check-in and evening check-out.
• Customizable alarm sounds and quick links to your company's attendance or time-tracking portal.

7. FULL SUPPORT FOR PUBLIC & SELF-HOSTED GITLAB
• Works seamlessly with gitlab.com and custom enterprise/on-premise GitLab domains (e.g., gitlab.company.com).
• Dynamic content script registration enables in-page features on your custom domains with zero configuration.

PRIVACY & SECURITY FIRST:
• 100% Local-First Architecture: All data, settings, notes, and tasks stay on your local computer.
• Zero Telemetry: No analytics, no user tracking, no third-party servers, and zero remote scripts.
• Direct Communication: API calls connect directly and exclusively between your browser and your designated GitLab instance using your Personal Access Token.
```

---

### Detailed Description (Markdown Format for Repository & Docs)

```markdown
# TimeLab - GitLab KPI, Timesheet & Spent Time Tracker

**TimeLab** is an all-in-one developer productivity suite built specifically for software engineers and project teams working on GitLab. Seamlessly track timesheets, calculate monthly KPI performance, audit spent time against estimates, and streamline your daily workflow across both public **GitLab.com** and **self-hosted GitLab** instances.

### 🌟 Key Capabilities

#### 1. Comprehensive Timesheet & Daily Audit
- **Visual Monthly Calendar Grid:** Daily spent time vs. working hours (8h standard).
- **Audit Indicators:** Instant visual detection of missed, under-logged, or overtime days.
- **Leave Day Management:** Support for full-day and half-day (0.5-day) annual leave or holidays.
- **Excel Export:** One-click export of timesheets and KPI performance reports to formatted `.xlsx` spreadsheets.

#### 2. Advanced KPI & Performance Analytics
- **Automated KPI Scores:** Calculates real-time KPI performance based on estimation accuracy, completion velocity, and logged hours.
- **Visual Charts:** Interactive monthly charts (Weekly Spent vs. Estimated hours, Task Types, Status breakdown, KPI Trends).
- **100% Offline Libraries:** Chart.js and ExcelJS are bundled locally inside the extension.

#### 3. In-Page GitLab Issue Summary Modal
- **In-Page Injection:** Injects a "KPI Summary" button into GitLab Issue, Work Item, and Merge Request pages.
- **Live Hierarchy Progress:** Real-time child task progress, assignee breakdown, total spent time, and overdue task alerts.
- **Quick Include/Exclude:** Toggle child tasks in or out of your monthly KPI with a single click.

#### 4. End-of-Day Unadded Tasks Reminder
- **Automated Scan:** Automatically checks for tasks created or updated today that haven't been added to your KPI sheet.
- **Desktop Alerts:** Gentle notifications and badge alerts before your shift ends so no work goes unlogged.

#### 5. Integrated Kanban To-Do & Sticky Notepad
- **Drag-and-Drop Kanban Board:** Organize tasks into To Do, In Progress, Review, and Done.
- **Multi-Tab Notepad:** Local markdown notes for meeting summaries, code snippets, and daily logs.
- **Dual-Mode Display:** Use tools inside the extension popup, in a full tab, or in an independent desktop window.

#### 6. Workday Check-In & Check-Out Alarms
- **Workday Automation:** Morning and evening workday alerts (Monday - Friday).
- **Quick Attendance Link:** Configurable direct link to your organization's attendance portal.

#### 7. Full Support for Public & Self-Hosted GitLab
- Supports both `gitlab.com` and enterprise on-premise GitLab CE/EE installations (e.g. `gitlab.mycompany.com`).
- Dynamic content script registration activates in-page features on any custom GitLab domain without code modifications.
```

---

## 2. Store Assets & Visual Media Requirements

| Asset Type | Dimensions | Required Format | Description / Location |
| :--- | :--- | :--- | :--- |
| **Extension Icon** | 128x128 px | PNG (transparent background) | `icon128.png` in project root |
| **Small Promo Tile** | 440x280 px | PNG or JPEG | High-contrast branding with TimeLab logo & subtitle |
| **Marquee Promo Tile** | 1400x560 px (or responsive) | JPEG | Hero banner featuring dashboard mockup, popup, modal and key value propositions (`thumb.jpg` / `docs/store-assets/thumb.jpg`) |
| **Screenshot 1** | 1280x800 px | PNG | Monthly KPI Dashboard & Work Items (`docs/store-assets/screenshot1_dashboard_1280x800.png` / `ui1_1280x800.png`) |
| **Screenshot 2** | 1280x800 px | PNG | Monthly Analytics, KPI Cards & Timesheet Grid (`docs/store-assets/screenshot2_analytics_1280x800.png` / `ui2_1280x800.png`) |
| **Screenshot 3** | 1280x800 px | PNG | GitLab Issue Page with Injected Sub-Tasks Summary Modal (`docs/store-assets/screenshot3_modal_1280x800.png` / `ui3_1280x800.png`) |

---

## 3. Single-Purpose Policy Declaration (Mục đích duy nhất)

**Chrome Web Store Single-Purpose Requirement:**
*"An extension must have a single purpose that is narrow and easy to understand."*

### Official Single-Purpose Statement (Copy & Paste vào ô Single Purpose):
```text
TimeLab has a single purpose: enabling software developers and project teams using GitLab to audit daily spent time, evaluate monthly performance against KPI targets, and maintain accurate work logs within their GitLab development workflow.
```

*(Bản dịch tiếng Việt tham khảo):*
> TimeLab có một mục đích duy nhất: cho phép các kỹ sư phần mềm và đội ngũ dự án sử dụng GitLab kiểm toán thời gian đã dành ra hàng ngày, đánh giá hiệu suất hàng tháng so với chỉ tiêu KPI, và duy trì nhật ký công việc chính xác ngay trong quy trình phát triển trên GitLab.

---

## 4. Permissions Justification (Lý do yêu cầu quyền)

Khi điền vào tab **Thực hành về quyền riêng tư (Privacy practices)** trên Chrome Developer Dashboard, Google sẽ yêu cầu giải trình cho từng quyền được khai báo trong `manifest.json`. Hãy copy chính xác các đoạn văn tiếng Anh dưới đây vào ô tương ứng:

| Quyền (Permission) | Lý do giải trình cho Chrome Reviewer (Copy & Paste) | Giải thích tiếng Việt |
| :--- | :--- | :--- |
| **`storage`** | `Required to store user settings, the user's GitLab Personal Access Token, configured GitLab server URL, leave day records, local sticky notes, and Kanban to-do items locally on the device using chrome.storage.local. No user data is ever transmitted to external servers.` | Lưu cài đặt, token GitLab, cấu hình server, ngày nghỉ, ghi chú và task Kanban ngay trên máy (`chrome.storage.local`). Không gửi ra ngoài. |
| **`alarms`** | `Required to schedule background timers for morning check-in and evening check-out alerts, as well as the end-of-day reminder that scans for tasks created today that have not yet been added to the user's KPI sheet.` | Đặt hẹn giờ chạy ngầm nhắc nhở điểm danh sáng, chấm công chiều và cảnh báo công việc chưa add vào KPI cuối ngày. |
| **`notifications`** | `Required to display native desktop notifications reminding developers to check in, check out, or log time on unadded GitLab tasks before leaving work.` | Hiển thị thông báo màn hình (desktop notification) nhắc check-in, check-out và task chưa log giờ. |
| **`scripting`** | `Required to dynamically register and unregister content scripts on custom, enterprise, or self-hosted GitLab domains entered by the user in settings, enabling the in-page KPI summary button without requiring extension updates.` | Đăng ký động content script trên các server GitLab riêng của công ty do người dùng cấu hình mà không cần cập nhật extension. |
| **Host Permissions (`gitlab.com`, `gitlab.widosoft.com`)** | `Required to perform REST API (/api/v4/issues, /api/v4/user) and GraphQL API queries against standard GitLab Cloud (gitlab.com) and on-premise instances to fetch task metrics, spent hours, and timesheets.` | Gọi API REST và GraphQL đến GitLab để lấy thông tin task, giờ làm và bảng chấm công. |
| **Optional Host Permissions (`https://*/*`, `http://*/*`)** | `Required to support enterprise or self-hosted GitLab instances (e.g., gitlab.company.com). Instead of requesting broad permissions upfront, TimeLab requests host access at runtime only when the user explicitly saves a custom GitLab URL in settings.` | Hỗ trợ server GitLab nội bộ của doanh nghiệp. Chỉ xin cấp quyền khi người dùng nhập domain cụ thể trong cài đặt (Least-Privilege). |

---

## 5. Data Usage Disclosures (Khai báo sử dụng dữ liệu)

Trong mục **Data usage (Sử dụng dữ liệu)** trên Chrome Developer Dashboard:

### 1. Thu thập dữ liệu (Data Collection):
- **"Do you collect or transmit user data?"**: Chọn **NO**.
- Nếu có danh sách các loại dữ liệu:
  - **Personally identifiable information**: KHÔNG thu thập (Not collected).
  - **Authentication information (Personal Access Token)**: Chỉ xử lý cục bộ trên thiết bị của người dùng (`chrome.storage.local`) để xác thực trực tiếp với GitLab của người dùng. Tuyệt đối không gửi về máy chủ của nhà phát triển hay bên thứ ba.
  - **Web history / Browsing activity**: KHÔNG thu thập (Not collected). Script chỉ kích hoạt trên URL Issue/MR của GitLab.
  - **Financial / Health / Location data**: KHÔNG thu thập (Not collected).

### 2. Tuyên bố cam kết của nhà phát triển (Bắt buộc tích chọn cả 4 ô):
- [x] **Developer Program Policies:** *"I certify that my extension complies with the Developer Program Policies."* (Chứng nhận tuân thủ chính sách của Google).
- [x] **No Data Sale:** *"I certify that my extension does not sell data to third parties."* (Cam kết không bán dữ liệu cho bên thứ ba).
- [x] **Single Purpose Alignment:** *"I certify that my extension does not use or transfer data for purposes that are unrelated to the item's single purpose."* (Cam kết không dùng dữ liệu ngoài mục đích duy nhất).
- [x] **No Credit Scoring / Lending:** *"I certify that my extension does not use or transfer data to determine creditworthiness or for lending purposes."* (Cam kết không dùng để chấm điểm tín dụng hoặc cho vay).

---

## 6. Complete Privacy Policy Draft (Chính sách quyền riêng tư)

Văn bản chính sách quyền riêng tư đã được tạo hoàn chỉnh tại file [PRIVACY.md](file:///D:/CodingTime/KPIGitlabExtension/PRIVACY.md).
Bạn có thể dùng đường dẫn file này trên GitHub/GitLab repository để dán vào ô **Privacy policy URL** trên Chrome Developer Dashboard:
`https://github.com/<username>/<repo>/blob/main/PRIVACY.md`

*(Nội dung rút gọn phục vụ kiểm duyệt viên Chrome Web Store)*:

```markdown
# Privacy Policy for TimeLab Chrome Extension
Last Updated: October 1, 2026

TimeLab ("the extension") is a local-first developer productivity tool designed for GitLab users. 

1. LOCAL-FIRST PROCESSING: All data, settings, personal access tokens, notes, and task lists are stored strictly in local browser storage (chrome.storage.local).
2. NO DATA COLLECTION: We do not operate any tracking servers, analytics services, or external databases. No user data, web history, or telemetry is ever collected, stored, or transmitted to the developer or any third party.
3. CREDENTIAL SECURITY: Your GitLab Personal Access Token is used solely to authenticate direct HTTPS requests between your browser and your designated GitLab server. It is never transmitted anywhere else.
4. PERMISSIONS: Permissions (storage, alarms, notifications, scripting, host permissions) are used strictly and exclusively for local storage, workday reminders, desktop alerts, and in-page GitLab issue summary features.
5. USER CONTROL: Users can log out, export, or permanently delete all local data at any time by uninstalling the extension.
```

---

## 6. Chrome Web Store Developer Dashboard Walkthrough

Follow these step-by-step instructions to publish the extension:

### Step 1: Generate the Release Package
From your repository root, run the automated release packager:
```bash
node scratch/build_release_zip.js
```
The script will:
1. Run all 12 regression test suites and 23 security/syntax validations.
2. Stage only production files (excluding `scratch/`, `docs/`, `.git/`, markdown files).
3. Generate the distribution archive at `release/timelab-extension-v1.0.7.zip`.
4. Verify package integrity and display archive size (~1.0 MB).

### Step 2: Open Chrome Web Store Developer Dashboard
1. Navigate to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Log in with your Google Developer account (pay the one-time $5 registration fee if this is your first extension).

### Step 3: Upload the Package
1. Click the **"New Item"** button at the top-right.
2. Drag and drop `release/timelab-extension-v1.0.7.zip` (or browse to `D:\CodingTime\KPIGitlabExtension\release\timelab-extension-v1.0.7.zip`).
3. The dashboard will parse `manifest.json` and create the draft item.

### Step 4: Fill Store Listing Details
1. **Title:** `TimeLab - GitLab KPI, Timesheet & Spent Time Tracker`
2. **Summary:** Copy from Section 1 above.
3. **Description:** Copy the plain text description from Section 1 above.
4. **Icons & Media:**
   - Upload `icon128.png` as the store icon.
   - Upload the promotional tile images and at least 3 screenshots (1280x800 recommended).
5. **Category:** Select `Productivity` (and `Developer Tools` if secondary category is requested).
6. **Language:** Select `English` (the UI will adapt to Vietnamese or English based on user settings).

### Step 5: Complete Privacy Practices Tab
1. **Single Purpose:** Paste the single-purpose statement from Section 3.
2. **Permission Justifications:** Copy each entry from the Permission Justification Table in Section 4.
3. **Host Permission Justification (`<all_urls>`):** Paste the detailed justification from Section 4 explaining self-hosted GitLab support.
4. **Data Usage Disclosures:**
   - Check **"No"** to all data collection options (TimeLab does NOT collect user data).
   - Check the compliance certification checkbox.
5. **Privacy Policy URL:** Paste your hosted Privacy Policy URL (from Section 5).

### Step 6: Distribution Settings
1. **Visibility:** Select `Public` (or `Unlisted` for internal beta testing).
2. **Regions:** Select `All regions` (or target regions).

### Step 7: Submit for Review
1. Click **"Submit for Review"**.
2. **Review Timeline:**
   - Because Manifest V3 and `<all_urls>` are declared with detailed justifications, reviews typically take between **24 to 72 hours**.
3. Once approved, the extension will be live on the Chrome Web Store!
