# Privacy Policy for TimeLab Chrome Extension

**Last Updated:** October 1, 2026  
**Effective Date:** October 1, 2026

TimeLab ("we", "our", or "the extension") is an open-source productivity extension designed for software engineers and project teams working on GitLab. We respect your privacy and are committed to protecting it. This Privacy Policy details our practices regarding the collection, storage, handling, and protection of information when you use the TimeLab Chrome Extension.

---

## 1. Single Purpose & Scope

TimeLab has a single, well-defined purpose: **to help developers and teams using GitLab track daily timesheets, audit spent hours against estimates, calculate monthly developer KPIs, and manage work items within their development workflow.**

All features—including timesheet aggregation, monthly KPI calculation, issue summary modals, local kanban task management, and workday reminders—strictly serve this single purpose.

---

## 2. 100% Local-First Architecture

TimeLab is built with a **100% local-first architecture**:
- **Zero Remote Servers:** TimeLab does not operate any centralized servers, tracking databases, or external backend infrastructure.
- **Zero Telemetry / Analytics:** We do not track user behavior, feature usage, clicks, session lengths, or performance telemetry. No tools such as Google Analytics, Mixpanel, or Sentry are included.
- **Local Processing:** All calculations (KPI scores, time audits, estimation vs. spent analysis, chart rendering) are executed completely in your local browser runtime.

---

## 3. Data Collection and Usage

We strictly adhere to data minimization principles:

| Data Type | Collected? | How It Is Processed |
| :--- | :--- | :--- |
| **Personal Information (Name, Email, etc.)** | **NO** | Not collected. User profile information (username, avatar) displayed in the popup is retrieved live via GitLab API and is never recorded or transmitted externally. |
| **Web Browsing History** | **NO** | Not collected. Content scripts run strictly on matching GitLab issue, work item, and merge request URLs. The extension does not inspect or monitor other browsing activity. |
| **GitLab Personal Access Token** | **Locally Only** | Stored securely in `chrome.storage.local` on your device. Used solely to authenticate direct HTTPS requests between your browser and your designated GitLab server. Never shared with third parties. |
| **Work Items, Timesheet & Notes** | **Locally Only** | Task IDs, spent hours, notes, and Kanban to-dos are stored solely in `chrome.storage.local`. |
| **Financial / Health / Location Data** | **NO** | Neither requested nor collected. |

---

## 4. Handling of Credentials and Authentication

To query GitLab APIs (REST `/api/v4` and GraphQL `/api/graphql`), TimeLab requires a Personal Access Token created by you with the minimum necessary scopes (`read_api` or `api`).

- **Storage:** The token is kept exclusively in your local browser storage (`chrome.storage.local`).
- **Transmission:** The token is transmitted strictly in the `Authorization: Bearer <TOKEN>` header of direct HTTPS requests sent from your browser to your configured GitLab server URL (e.g. `gitlab.com` or your company's self-hosted domain).
- **No Third-Party Access:** Your token is never logged, never transmitted to any third party, and never accessible to anyone other than your local extension instance.

---

## 5. Explanation of Requested Permissions

TimeLab requests only the minimum permissions required for its functionality:

| Permission | Technical Requirement | Privacy Protection |
| :--- | :--- | :--- |
| **`storage`** | Stores user settings, Personal Access Token, configured GitLab Server URL, annual leave records, local markdown notes, and Kanban tasks. | Data is stored solely on your machine inside `chrome.storage.local`. |
| **`alarms`** | Drives background schedules for workday check-in/out reminders and the end-of-day alert for unadded KPI tasks. | Runs purely local timer events; transmits no data. |
| **`notifications`** | Displays local desktop notification popups when reminders trigger. | Displayed locally using Chrome's native notification system. |
| **`scripting`** | Dynamically registers content scripts on custom enterprise/self-hosted GitLab domains entered by the user in settings. | Only executes the extension's local, audited content scripts (`content_issue.js`, `content_request.js`). |
| **Host Permissions (`gitlab.com`, `gitlab.widosoft.com`)** | Enables direct REST and GraphQL API communication with public GitLab and standard on-premise instances. | Network calls are made exclusively to official GitLab endpoints. |
| **Optional Host Permissions (`https://*/*`, `http://*/*`)** | Allows users with custom enterprise or self-hosted GitLab domains (e.g. `gitlab.mycompany.com`, `192.168.x.x`) to grant permission at runtime. | Prompts user via Chrome's native permission dialog only when a custom domain is saved. Never intercepts unrelated domains. |

---

## 6. Third-Party Vendor Libraries

TimeLab uses two well-established open-source libraries:
1. **Chart.js** (for rendering monthly timesheet and KPI charts).
2. **ExcelJS** (for client-side generation of Excel `.xlsx` spreadsheets).

Both libraries are bundled **100% offline** within the extension package. TimeLab makes **zero calls** to Content Delivery Networks (CDNs) or external script registries, complying with strict Manifest V3 Content Security Policy (CSP).

---

## 7. Data Retention and Deletion

You possess absolute control over all data stored by TimeLab:
- **Instant Logout:** Clicking the "Log out" button in the extension popup immediately clears your stored GitLab Personal Access Token and cached profile info from `chrome.storage.local`.
- **Data Export & Reset:** You can export all local settings and tasks to a JSON file or clear your records at any time.
- **Complete Deletion upon Uninstall:** Removing or uninstalling the extension from `chrome://extensions/` instantly and permanently deletes all data, settings, notes, and cached tasks stored by TimeLab from your device.

---

## 8. Chrome Web Store Policy Compliance Declarations

In compliance with the Google Chrome Web Store Developer Program Policies:
1. **No Data Sale:** We do not sell, rent, or monetize your personal or workspace data under any circumstances.
2. **No Unrelated Data Usage:** We do not use or transfer user data for purposes unrelated to the extension's stated core functionality.
3. **No Lending or Credit Scoring:** We do not use or transfer user data to determine creditworthiness or for any lending/financial assessment.
4. **No Remote Code Execution:** The extension executes only local, reviewed code contained within the packaged distribution.

---

## 9. Contact Us

If you have any questions, suggestions, or concerns regarding this Privacy Policy or TimeLab's security practices, please contact us:

- **Developer:** notepower2k1
- **Email:** contact.notepower2k1@gmail.com
- **Repository:** Open an issue or discussion on the official project repository.
