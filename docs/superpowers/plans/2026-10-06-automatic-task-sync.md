# Kế hoạch tự động đồng bộ task

Ngày: 06/10/2026. Trạng thái: đã triển khai và kiểm thử hồi quy/Chrome với API giả lập. Chưa kiểm chứng trên máy chủ GitLab thực tế.

## 1. Hành vi mục tiêu

- Người dùng đăng nhập, thiết lập giờ check-in/check-out và chu kỳ sync. Extension tự tìm task, thêm vào danh sách theo dõi, cập nhật dữ liệu và tính lại thống kê.
- Chu kỳ chọn được: **5 / 15 / 30 / 60 phút**, mặc định **15 phút**. Có công tắc bật/tắt auto-sync; mặc định bật sau khi đăng nhập hợp lệ.
- Sync tự động chạy trong khoảng check-in → check-out theo giờ địa phương. Khi mở popup/Dashboard, chỉ yêu cầu sync nếu auto-sync đang bật, đang trong khoảng giờ và dữ liệu đã đến hạn cập nhật.
- Giờ check-in/check-out là giờ chạy nền, không phải bộ lọc thời gian tạo task hay log giờ. Công việc ngoài giờ, cuối tuần hoặc ngày nghỉ được lấy trong lượt sync tiếp theo. Các cờ bật/tắt thông báo check-in/check-out và thiết lập nghỉ phép không tắt auto-sync.
- Sync bù từ mốc đã hoàn tất gần nhất; không chỉ tìm task tạo trong ngày hiện tại. Ngày hiển thị công việc vẫn là ngày tạo/log thực tế.
- Bỏ nút **Thống kê** và chức năng **Nhắc KPI cuối ngày**, gồm banner task chưa thêm. Giữ cảnh báo thiếu giờ trong Daily Timesheet Audit.
- Trong phần cài đặt có **Đồng bộ ngay**, hoạt động cả khi ngoài giờ hoặc auto-sync đang tắt. Đây là thao tác chủ động lấy dữ liệu, không phải một bước bắt buộc để xem báo cáo.
- Popup/Dashboard hiển thị trạng thái và thời điểm sync thành công gần nhất. Ngoài khung giờ có thể hiển thị “Chờ đến giờ đồng bộ”; lỗi không thay thế dữ liệu đã có.

## 2. Phạm vi dữ liệu của bản đầu

**Tự phát hiện:** chỉ Task/Work Item con do tài khoản đang đăng nhập tạo; dùng `issue_type=task` và đối chiếu `workItemType.name` từ GraphQL. Issue cha chỉ giữ làm tham chiếu trên task con, không tự thêm thành một dòng KPI.

**Tiếp tục theo dõi:** mọi task và MR đã thêm thủ công trên máy chủ đang hoạt động. Các nút thêm/bỏ theo dõi thủ công vẫn hữu ích cho task do người khác tạo. Bản đầu chưa tự mở rộng nguồn phát hiện sang task được giao hay MR mới.

**Lần đầu:** chỉ tìm Task được tạo từ đầu tháng hiện tại đến lúc bắt đầu lượt sync, gồm opened/closed. Không tìm task cũ chỉ vì còn mở hoặc được sửa trong tháng. Những task đã theo dõi thủ công được giữ và cập nhật; dữ liệu lưu trước đó không bị xóa.

**Các lượt sau:** phát hiện task mới từ mốc đã hoàn tất, lấy thay đổi liên quan và cập nhật các task cần theo dõi. Khóa nhận diện phải chứa máy chủ, loại item, project và IID; không dùng riêng IID vì nhiều project có cùng số task.

Giữ các quy tắc tính giờ đã thống nhất:

- `spent`: số giờ trong kỳ đang xem, tính từ timelog theo ngày địa phương.
- Spent toàn task: tổng giờ toàn bộ vòng đời; Estimate giữ nguyên toàn task.
- Chênh lệch: Spent toàn task − Estimate, chỉ hiện khi task đã closed.
- Ngày nghỉ và dấu overtime thủ công được giữ trong `KpiLeaveDays`, không bị dữ liệu GitLab ghi đè.
- Không tự thay đổi phạm vi tác giả timelog hoặc công thức KPI trong lần refactor này. Dữ liệu timelog vẫn giữ thông tin người log để có thể phân biệt KPI cá nhân với tổng công việc về sau.

## 3. Điểm cần thay đổi trong code hiện tại

| Vị trí | Hiện tại | Cần thay đổi |
|---|---|---|
| `utils.js` | Có API nhắc task tạo hôm nay, giới hạn task đang mở và một trang kết quả | Tái sử dụng helper nhận diện item, ngày tháng và thống kê; thay luồng nhắc bằng discovery có phân trang |
| `page/page.js` | Nút `getDetailBtn` gọi API chi tiết theo nhóm 6 task; hàm gọi API nằm trong IIFE gắn với DOM | Chuyển phần fetch/chuẩn hóa dữ liệu sang module dùng được trong worker; Dashboard đọc dữ liệu đã sync |
| `background.js` | Đã có `chrome.alarms`, thông báo check-in/check-out và nhắc KPI cuối ngày | Thêm điều phối sync; bỏ riêng nhắc KPI, giữ các lịch/notification khác |
| `popup/` | Setting nhắc KPI, banner task chưa thêm và thẻ thống kê | Thay bằng setting sync, trạng thái và Đồng bộ ngay; cập nhật thẻ khi storage đổi |
| `content_issue.js`, `content_request.js`, các hàm xóa trong Dashboard | Thao tác thêm/xóa ghi trực tiếp danh sách theo dõi | Phối hợp với worker để thao tác thủ công không bị lượt sync đang chạy ghi đè |
| `i18n.js`, `scratch/`, README | Nội dung và kiểm thử luồng thủ công/nhắc cuối ngày | Bổ sung Việt/Anh, kiểm thử sync và cập nhật hướng dẫn |

Tạo **một file `sync.js`** chứa phần API dùng chung và điều phối sync, giữ vanilla JS và Chrome APIs hiện có. Không cần backend hoặc dependency mới.

## 4. Luồng một lượt sync

1. Đọc settings, token, máy chủ, tài khoản và trạng thái lần trước. Kiểm tra giờ chạy, thời điểm đến hạn và lượt sync đang chạy.
2. Nếu có lượt chưa hoàn tất, tiếp tục phần đang chờ. Nếu chưa có, chốt thời điểm bắt đầu lượt làm giới hạn trên cho discovery.
3. Tìm task mới trong khoảng cần lấy, đọc hết các trang, chuẩn hóa URL/ID và gộp danh sách. Quét chồng lấn khoảng 5 phút với lượt trước rồi loại trùng để xử lý ranh giới thời gian.
4. Tạo danh sách cần cập nhật. Ưu tiên task mới, task đang mở và task có thay đổi/hoạt động trong tháng. Task closed lâu được đối soát một lần mỗi ngày theo nhóm, thay vì tải lại toàn bộ lịch sử mỗi 15 phút. Không dựa duy nhất vào `updated_at` để khẳng định timelog không đổi.
5. Lấy chi tiết theo nhóm tối đa 6 item như luồng hiện tại. Timelog và discussion dùng cho số lần reopen phải đọc đủ trang; HTTP thành công nhưng GraphQL có `errors` vẫn phải được xử lý là lỗi.
6. Gộp phần dữ liệu đã lấy thành công vào storage mới nhất; giữ bản cũ của item lỗi. Kiểm tra lại danh sách bỏ theo dõi và nguồn đăng nhập trước khi ghi.
7. Tính lại KPI tháng bằng helper trong `utils.js`. Dashboard tự render lại bảng, biểu đồ và Daily Timesheet Audit khi `KpiInfo` đổi.
8. Mốc discovery chỉ tiến khi đã đọc đủ trang và lưu toàn bộ task tìm được cùng phần việc chờ. Mốc hoàn tất lượt sync/thời điểm thành công chỉ tiến khi phần việc bắt buộc đã xong. Lỗi một task không ngăn phát hiện và cập nhật các task mới khác.

Đây là các bước xử lý, không phải cam kết “mỗi lượt đúng hai request”. REST/GraphQL có thể cần nhiều trang và nhiều request chi tiết.

## 5. Trạng thái và cách chạy bù

Thêm các khóa storage tối thiểu:

- `KpiSyncSettings`: `enabled`, `intervalMinutes`. Giờ chạy dùng `checkInTime` và `checkOutTime` hiện có.
- `KpiSyncState`: nhận diện nguồn máy chủ/tài khoản, trạng thái, thời điểm sync thành công, mốc discovery đã lưu bền vững, mốc lượt sync đã hoàn tất, giới hạn trên của lượt chưa xong, phần việc đang chờ và lỗi gần nhất.
- `KpiSyncExcludedItems`: item người dùng đã bỏ theo dõi, gắn với nguồn máy chủ/tài khoản.

Giữ `WorkItemIds`, `MergeItemIds`, `KpiInfo` và `KpiStats` để tránh migration dữ liệu công việc không cần thiết.

Ví dụ: lượt cuối đã quét đến 05/10 lúc 17:45, trình duyệt đóng lúc 17:50. Lượt tiếp theo ngày 06/10 tiếp tục từ mốc đã quét, gồm task/log tối 05/10; chúng vẫn nằm ở ngày 05/10 trong báo cáo.

Các quy tắc bảo toàn dữ liệu:

- Chỉ một luồng sync chạy tại một thời điểm trong worker; yêu cầu từ alarm, popup và Dashboard cùng dùng luồng đó.
- Lưu phần việc chờ theo nhóm để worker khởi động lại có thể tiếp tục. Mỗi đợt xử lý có thời gian giới hạn; nếu còn việc, hẹn một alarm tiếp tục ngắn trong khung giờ cho phép, không phải chờ toàn bộ chu kỳ 15 phút.
- Hết khung giờ thì giữ phần việc chưa xong cho lượt hợp lệ tiếp theo. Đồng bộ ngay được phép chạy ngoài khung giờ.
- Mất mạng, timeout, HTTP 429/5xx: giữ dữ liệu và phần chờ; tôn trọng `Retry-After` nếu có. Lỗi token không đánh dấu thành công hay biến phản hồi lỗi thành danh sách task rỗng.
- Khi token, máy chủ hoặc tài khoản đổi, lượt cũ không được ghi kết quả vào nguồn mới. Mốc discovery và danh sách loại trừ phải được phân biệt theo máy chủ/tài khoản.
- Các thao tác thêm/bỏ theo dõi và commit kết quả sync được worker điều phối, tránh ghi toàn bộ một snapshot đã cũ đè lên thay đổi của người dùng.
- Bỏ theo dõi thêm item vào danh sách loại trừ; sync không tự thêm lại. Thêm thủ công lại item sẽ gỡ loại trừ và đưa item vào lượt cập nhật.

## 6. Thứ tự triển khai

### Bước 1 — Tách API khỏi Dashboard

- [x] Tách `getWorkItemDetailNew`, API task, API MR, activity log và chuẩn hóa dữ liệu sang `sync.js`; truyền token/máy chủ vào hàm thay vì phụ thuộc DOM.
- [x] Giữ hình dạng dữ liệu đang lưu, metadata parent/title, estimate, lifetime spent, timelog gốc và thông tin user.
- [x] Thêm phân trang timelog/discussion và phân biệt lỗi với kết quả rỗng.
- [x] Kiểm tra API/chuẩn hóa dữ liệu đã tách bằng các ca hồi quy; Dashboard đã chuyển hoàn toàn sang đọc cache, bỏ luồng Thống kê cũ.

### Bước 2 — Discovery và sync dữ liệu

- [x] Xây discovery theo người tạo, có task opened/closed, phân trang và khoảng thời gian cố định cho từng lượt.
- [ ] Đối chiếu Issue/Task/Work Item trên máy chủ GitLab thực tế. Đã giữ query/schema từ code hiện có và thêm phân trang; kiểm thử tự động dùng API giả lập.
- [x] Gộp item không trùng, bootstrap Task tạo trong tháng hiện tại; giữ lịch sử theo dõi thủ công.
- [x] Lưu state/phần việc chờ, merge kết quả thành công và bảo toàn dữ liệu item lỗi.
- [x] Tính lại KPI tháng từ dữ liệu lưu, giữ nguyên cách tính Spent theo kỳ và chênh lệch toàn task.

### Bước 3 — Lịch chạy và điều phối trong worker

- [x] Nạp `sync.js` trong service worker, thêm alarm riêng cho sync và alarm tiếp tục nếu còn phần việc.
- [x] Kiểm tra/khôi phục alarm khi worker khởi động; cập nhật lịch khi settings đổi.
- [x] Kiểm tra giờ địa phương, khoảng giờ qua nửa đêm, đến hạn sync và trạng thái đã có lượt chạy.
- [x] Thêm message để popup/Dashboard yêu cầu sync đến hạn hoặc Đồng bộ ngay.
- [x] Điều phối ghi dữ liệu và thao tác thêm/xóa; thêm danh sách loại trừ cho mọi đường bỏ theo dõi, gồm xóa theo tuần/tháng.

### Bước 4 — Setting và UI tự cập nhật

- [x] Thêm công tắc auto-sync, select 5/15/30/60 phút và Đồng bộ ngay trong phần cài đặt.
- [x] Hiển thị chờ/đang sync/hoàn tất/lỗi và thời điểm hoàn tất gần nhất bằng Việt/Anh.
- [x] Popup và Dashboard nghe thay đổi `KpiInfo`/sync state để cập nhật mà không cần reload, giữ tháng và bộ lọc đang chọn.
- [x] Bỏ `getDetailBtn`, spinner/badge chỉ phục vụ Thống kê và các nhãn yêu cầu bấm Thống kê, kể cả trong thông báo xuất Excel.
- [x] Xuất Excel dùng dữ liệu đã sync; lọc ngày/tháng chỉ đọc cache, không tự gọi lại API cho từng lần lọc.

### Bước 5 — Gỡ nhắc KPI cuối ngày và cập nhật dữ liệu cũ

- [x] Bỏ scanner/notification nhắc KPI, banner task chưa thêm và setting nhắc KPI.
- [x] Dọn riêng trạng thái/notification/badge của nhắc KPI cũ khi migration; không dọn dữ liệu công việc, ngày nghỉ, overtime hay nhắc check-in/check-out.
- [x] Giữ nút thêm/bỏ theo dõi trên GitLab cho thao tác chủ động.
- [x] Chỉ xóa helper và key i18n của luồng nhắc nếu không còn caller.
- [x] Cập nhật README và các bài kiểm thử đang yêu cầu UI nhắc KPI/nút Thống kê.

### Bước 6 — Kiểm thử và nghiệm thu

- [x] Thêm `scratch/test_auto_sync.js`, tích hợp vào `scratch/test_full_suite.js`; thay kiểm thử nhắc KPI đã nghỉ bằng kiểm thử sync, giữ kiểm thử check-in/check-out.
- [x] Chạy toàn bộ bộ hồi quy, kiểm tra cú pháp và `git diff --check` với cấu hình CRLF của repo.
- [ ] Chạy smoke test với máy chủ GitLab thực tế và task thật. Đã chạy Chrome 149 unpacked với profile riêng/API giả lập: Đồng bộ ngay, setting/alarm, live Dashboard và bỏ theo dõi; khôi phục worker được kiểm thử bằng module background với trạng thái đã lưu; không sử dụng tài khoản GitLab thật.
- [x] Kiểm tra bỏ theo dõi giữa lúc sync, token sai, trình duyệt đóng/mở lại, đổi setting và dữ liệu cũ có nhiều trang timelog.

## 7. Các ca bắt buộc phải đúng

1. Task tạo rồi closed giữa hai lượt vẫn được tự thêm.
2. Task tạo từ tháng trước, hôm nay log giờ, vẫn cập nhật trong báo cáo hôm nay/tháng này.
3. Task/log ngoài khung giờ hoặc ngày nghỉ được lấy bù, giữ nguyên ngày thực tế và dấu overtime thủ công.
4. Mở lại trình duyệt ngày hôm sau tiếp tục đúng mốc; không tạo task trùng.
5. Task tạo hoặc thay đổi trong lúc sync được xử lý trong lượt hiện tại hoặc lượt tiếp theo; không bị bỏ qua do lấy thời điểm kết thúc làm mốc quét.
6. Discovery hoặc timelog có hơn một trang phải được đọc đủ.
7. Một item lỗi không làm mất dữ liệu cũ; phần việc chưa xong vẫn còn sau khi worker khởi động lại.
8. Alarm và Đồng bộ ngay đến cùng lúc không tạo hai lượt chạy.
9. Xóa/bỏ theo dõi trong lúc sync không bị tự thêm lại; thêm lại thủ công vẫn hoạt động.
10. Đổi máy chủ/tài khoản không dùng nhầm mốc hoặc ghi kết quả của lượt cũ vào nguồn mới.
11. Popup/Dashboard đang mở cập nhật ngay sau sync, không đổi tháng/bộ lọc người dùng đang xem.
12. Estimate 40h, Spent tháng 32h, Spent toàn task 42h vẫn cho chênh lệch +2h khi closed; task mở vẫn là `—`.

## 8. Tài liệu API đã đối chiếu

- [GitLab Issues API](https://docs.gitlab.com/api/issues/): lọc người tạo, thời điểm tạo/cập nhật, loại issue/task và phân trang. Cần đối chiếu phiên bản GitLab thực tế khi triển khai.
- [GitLab GraphQL pagination](https://docs.gitlab.com/api/graphql/getting_started/#pagination): connection trả kết quả theo trang; cần đọc `pageInfo` và cursor thay vì coi `nodes` đầu tiên là toàn bộ dữ liệu.
- [Chrome Alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms): alarm có thể trễ và không đánh thức máy đang ngủ; cần chạy bù và kiểm tra alarm khi worker khởi động.

## Hoàn tất khi

Người dùng không phải tự thêm các task thuộc nguồn auto-discovery hay bấm Thống kê. Dữ liệu được cập nhật theo setting, có sync bù, giữ thay đổi thủ công và hiển thị trạng thái rõ ràng. Nút Thống kê và nhắc KPI cuối ngày chỉ được gỡ sau khi luồng sync và UI tự cập nhật đã chạy đúng.

## Kết quả triển khai

- Module `sync.js` dùng chung API/chuẩn hóa, có cursor theo trang, queue theo task, đồng bộ bù và khóa ghi trong worker.
- API được rút xuống các trường cần dùng; dữ liệu từng task lỗi giữ nguyên, credential lỗi dừng retry tự động, HTTP 429 tôn trọng `Retry-After`.
- Metadata `syncedAt`/`updatedAt` tránh tải lại các task vừa cập nhật khi đang retry task khác; task archived đối soát hằng ngày và toàn bộ task đã theo dõi có thể cập nhật chủ động bằng Đồng bộ ngay.
- Bản dịch Việt/Anh, popup/Dashboard cập nhật qua storage, chênh lệch/lifetime spent, ngày nghỉ và overtime được giữ đúng.
- Script đóng gói đã thêm `sync.js`. Bộ hồi quy thay bài nhắc KPI cũ bằng `test_auto_sync.js`; smoke test Chrome nằm ở `scratch/test_browser_sync.js`.

## Điều chỉnh phạm vi ngày 06/10/2026

Theo yêu cầu người dùng, discovery phiên bản 2 chỉ bootstrap Task tạo trong tháng, bỏ nguồn Issue và bỏ quét task cũ đang mở. Các scan rộng cũ được khởi tạo lại. Mục tự động sai phạm vi/loại được đánh dấu bỏ qua, giữ dữ liệu đã lưu; loại công việc được xác nhận qua `workItemType.name`. Nguồn thêm thủ công được đánh dấu riêng để tiếp tục theo dõi; thêm lại thủ công có thể khôi phục mục đã bị bỏ qua.

## Tối ưu sync nhẹ trong ngày và Re-sync toàn bộ

- Theo lựa chọn người dùng, "trong ngày" gồm Work Item tạo/sửa/log giờ hôm nay, không chỉ ngày tạo. Lượt thường chỉ lấy chi tiết nhóm này; bỏ đối soát toàn bộ tự động hằng ngày.
- Discovery tháng và mốc sync bù giữ nguyên để không mất danh sách task. Mục ngoài ngày có thể chưa có chi tiết hoặc vẫn là bản cũ; UI nêu rõ và hiển thị riêng thời điểm Re-sync toàn bộ.
- Metadata các mục đã theo dõi được kiểm tra theo nhóm project/IID (tối đa 100 mục mỗi query REST), giúp phát hiện thay đổi trên task cũ và task do người khác tạo mà không đọc GraphQL cho mọi mục.
- Nút Re-sync toàn bộ chủ động lấy chi tiết tất cả các mục đã theo dõi. Tiến độ full sync và dấu thời gian thành công được lưu riêng.
- Query GraphQL Work Item gộp metadata, timelog, hierarchy và lịch sử reopen; một trang dữ liệu dùng đúng một request. Hai connection có cursor độc lập; trang bổ sung chỉ lấy phần chưa hoàn tất. MR tiếp tục dùng query một connection.
- Đã bổ sung kiểm thử số request, phân trang gộp, lọc hoạt động trong ngày, metadata cho task cũ và trạng thái full sync.

## Hoàn thiện đồng bộ hằng ngày và KPI tháng

Các quyết định mới thay thế điều kiện chỉ tải chi tiết trong ngày ở mục trước:

- Giữ phạm vi `created_by_me` theo yêu cầu người dùng.
- Auto sync chạy thứ Hai–thứ Sáu trong giờ check-in/check-out. Continuation ngoài giờ/cuối tuần chuyển đến ngày làm việc tiếp theo; Re-sync thủ công không chịu giới hạn này.
- Tải chi tiết task chưa có cache, thay đổi so với lần đọc trước hoặc hoạt động hôm nay. Hàng đợi tự động không bị bỏ khi sang ngày mới; task tối thứ Sáu và thay đổi cuối tuần được lấy bù thứ Hai.
- Discovery phiên bản 3 bổ sung task cũ còn mở và task cũ cập nhật trong tháng khi bootstrap; query delta cập nhật không còn giới hạn ngày tạo. Migration từ phiên bản 2 giữ cursor và queue để không bỏ lỡ task tháng trước. Mục cũ bị bỏ qua nhưng đang mở được khôi phục khi tìm thấy; mục đã bỏ theo dõi vẫn giữ exclusion.
- Người dùng chọn **Re-sync trước khi xuất Excel là đủ**, không thêm snapshot/khóa tháng. Nút Excel gọi full sync, tiếp tục scan/queue đến khi thành công, tìm thêm task của tháng đang xuất; lỗi hoặc đổi nguồn thì dừng xuất. Nút khóa trong lúc xử lý và có bản dịch Việt/Anh.
- Kiểm thử bổ sung: thứ Sáu → thứ Hai, queue qua ngày, nâng cấp qua tháng, 205 task trong các nhóm metadata, carry-over/closed history, xuất tháng cũ, hoàn tất continuation trước xuất và lỗi không tạo file. Smoke test Chrome kiểm tra workbook thật dùng dữ liệu vừa sync và phục hồi nút sau lỗi API giả lập.
