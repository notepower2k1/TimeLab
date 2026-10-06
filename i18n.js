/**
 * Core i18n Engine & Complete Multilingual Dictionaries (VI / EN)
 * GitLab Productivity Extension
 */

const I18N_DICTIONARIES = {
    vi: {
        // Automatic GitLab task sync
        syncSettingsTitle: "🔄 Tự động đồng bộ",
        syncEnabledLabel: "Bật tự động đồng bộ",
        syncIntervalLabel: "Chu kỳ đồng bộ:",
        syncEvery5: "Mỗi 5 phút",
        syncEvery15: "Mỗi 15 phút",
        syncEvery30: "Mỗi 30 phút",
        syncEvery60: "Mỗi 60 phút",
        syncHoursHint: "Auto sync chạy thứ Hai–thứ Sáu trong giờ check-in → check-out, lấy Work Item hoạt động hôm nay và dữ liệu mới/thay đổi bị bỏ lỡ. Re-sync cập nhật toàn bộ mục đã theo dõi.",
        syncNow: "🔄 Re-sync toàn bộ",
        syncDisconnected: "Chưa kết nối GitLab",
        syncRunning: "🔄 Đang đồng bộ…",
        syncError: "⚠️ Đồng bộ lỗi — xem chi tiết khi rê chuột",
        syncPending: "🔄 Đồng bộ sẽ tiếp tục…",
        syncDisabled: "Tự động đồng bộ đang tắt",
        syncWaiting: "Chờ đến giờ đồng bộ",
        syncReady: "Tự động đồng bộ đã sẵn sàng",
        syncLast: "Sync thường lần cuối: {time}",
        syncLastFull: "Re-sync toàn bộ: {time}",
        syncNeedsFull: "Chưa Re-sync toàn bộ",
        syncEmpty: "Đang chờ dữ liệu đồng bộ. Chọn Re-sync toàn bộ trong cài đặt để lấy đầy đủ lịch sử.",

        // --- Language Switcher ---
        langVi: "Tiếng Việt",
        langEn: "English",
        langSwitcherTitle: "Đổi ngôn ngữ giao diện",
        languageLabel: "Ngôn ngữ:",

        // --- Navigation & Tabs ---
        tabMonth: "📊 Tháng",
        tabTools: "🛠️ Công cụ",
        tabHome: "Trang chủ",
        tabNotes: "Ghi chú",
        tabTodo: "Việc cần làm",
        tabWorkItems: "Chi tiết công việc",
        tabAnalytics: "Phân tích & Biểu đồ Tháng",

        // --- Auth & Login ---
        welcomeTitle: "Chào bạn 👋",
        welcomeDesc: "Nhập Personal Access Token để bắt đầu",
        gitlabServerUrlLabel: "GitLab Server URL:",
        gitlabServerUrlPlaceholder: "https://gitlab.com hoặc server riêng...",
        invalidServerUrl: "Vui lòng nhập GitLab Server URL hợp lệ",
        serverUrlSaved: "Đã lưu GitLab Server URL thành công",
        hostPermissionRequired: "Cần cấp quyền truy cập vào máy chủ GitLab này để tiếp tục!",
        getTokenHelp: "Lấy Access Token tại server này",
        tokenPlaceholder: "Nhập Personal Access Token...",
        connectBtn: "Kết nối ngay",
        tutorialBtn: "Hướng dẫn sử dụng",
        logoutBtn: "Đăng xuất",
        tokenRequired: "Vui lòng nhập token",
        connectSuccess: "Kết nối thành công!",
        connectFailed: "Token không hợp lệ!",
        invalidToken: "Token không hợp lệ hoặc đã hết hạn",

        // --- Banner & Unadded Tasks ---
        addedSuccess: "✔ Đã thêm",
        alreadyAdded: "Đã tồn tại trong KPI",

        // --- Popup Stats Cards ---
        statsMonthTitle: "⭐ Thống kê tháng",
        statTotalTasks: "Tổng Task",
        statEstimate: "Estimate",
        statSpent: "Spent trong kỳ",
        progressDaily: "Tiến trình ngày:",
        progressMonth: "Tiến trình tháng:",
        metricOnTime: "Đúng hạn",
        metricKpiForecast: "Dự báo KPI",

        // --- Check-in / Out Card & Settings ---
        storageTitle: "📦 Bộ nhớ",
        checkinCardTitle: "⏰ Nhắc Check-in / Out",
        workdayBadge: "T2 - T6",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
        minutesUnit: "phút",
        snoozeLabel: "Nhắc lại:",
        snooze5m: "Mỗi 5 phút (Tối đa 3 lần)",
        snooze10m: "Mỗi 10 phút (Tối đa 3 lần)",
        snooze15m: "Mỗi 15 phút (Tối đa 3 lần)",
        snoozeNone: "Không nhắc lại",
        urlLabel: "Link chấm công:",
        urlPlaceholder: "https://chamcong.congty.com...",
        testSoundBtn: "🔔 Thử chuông",
        testSoundBtnTitle: "Bấm để thử thông báo ngay lập tức",
        testSoundTooltip: "Bấm để thử thông báo ngay lập tức",
        saveSettingsBtn: "💾 Lưu",
        saveSettingsSuccess: "✔ Đã lưu cài đặt!",

        // --- Tools Grid & Quick Links ---
        noteWindowBtn: "Ghi chú (Cửa sổ) 🗗",
        noteWindowBtnTitle: "Mở ghi chú trong cửa sổ rời",
        noteTabBtn: "Ghi chú (Tab) 📑",
        noteTabBtnTitle: "Mở ghi chú trong tab mới",
        todoWindowBtn: "Việc cần làm (Cửa sổ) 🗗",
        todoWindowBtnTitle: "Mở việc cần làm trong cửa sổ rời",
        todoTabBtn: "Việc cần làm (Tab) 📑",
        todoTabBtnTitle: "Mở việc cần làm trong tab mới",
        exportBtn: "Xuất dữ liệu 💿",
        importBtn: "Nhập dữ liệu 📀",
        importSuccess: "Nhập dữ liệu thành công!",
        importError: "Đọc file thất bại hoặc file không hợp lệ.",
        quickGitlabTitle: "🦊 Mở nhanh trên GitLab",
        quickIssuesBtn: "📋 Issues",
        quickIssuesTooltip: "Issues được giao cho bạn",
        quickMRsBtn: "🚀 MRs",
        quickMRsTooltip: "Merge Requests của bạn",
        quickTodosBtn: "📝 To-Do",
        quickTodosTooltip: "Việc cần làm trên GitLab",
        openDashboardBtn: "Mở Dashboard 📊",

        // --- Kanban Board ---
        kanbanTitle: "📋 Kanban Board",
        totalTodoActive: "{count} công việc đang thực hiện",
        windowModeBtn: "🗗 Cửa sổ rời",
        tabModeBtn: "📑 Mở dạng Tab",
        modeSwitchTooltip: "Chuyển đổi chế độ cửa sổ",
        clearAllBtn: "Xóa tất cả",
        confirmClearAll: "Bạn có chắc muốn xóa tất cả công việc?",
        addTaskPlaceholder: "Việc cần làm là gì? (Nhấn Enter để thêm)",
        deadlinePlaceholder: "Hạn chót",
        reminderSettingsTooltip: "Cài đặt nhắc việc",
        reminderBeforeLabel: "⏰ Trước (phút):",
        reminderRepeatLabel: "🔁 Lặp (phút):",
        saveReminderSettingsTooltip: "Lưu cài đặt nhắc việc",
        addTaskBtn: "➕ Thêm công việc",
        colTodo: "CẦN LÀM",
        colProcessing: "ĐANG LÀM",
        colDone: "HOÀN THÀNH",
        editTaskModalTitle: "Chỉnh sửa công việc",
        taskNameLabel: "Tên công việc:",
        deadlineLabel: "Hạn chót:",
        cancelBtn: "Hủy",
        saveChangesBtn: "Lưu thay đổi",
        deleteTaskBtn: "Xóa",

        // --- Notepad ---
        notesTitle: "Notepad - Ghi chú cá nhân",
        untitledNote: "Ghi chú {index}",
        closeTabTooltip: "Đóng tab",
        newTabTooltip: "Thêm tab mới (+)",
        addNoteBtn: "+",
        deleteNoteBtn: "×",
        privacyTooltip: "Bật/Tắt che mờ riêng tư",
        copyAllTooltip: "Sao chép toàn bộ ghi chú",
        copiedTooltip: "Đã sao chép!",
        themeToggleTooltip: "Đổi giao diện Sáng / Tối",
        notePlaceholder: "Bắt đầu ghi chú...",
        autoSaved: "Đã lưu ✔",
        saving: "Đang lưu...",
        wordsCount: "{count} từ",
        charsCount: "{count} ký tự",

        // --- KPI Dashboard ---
        pageTitle: "GitLab Productivity 📊",
        deleteWeekBtn: "🗑️ Xóa tuần",
        deleteWeekTooltip: "Xóa toàn bộ Task và Merge Request trong tuần đang chọn",
        deleteMonthBtn: "🗑️ Xóa tháng",
        deleteMonthTooltip: "Xóa toàn bộ Task và Merge Request trong tháng đang chọn",
        exportMonthKpiBtn: "📊 Xuất KPI Tháng",
        exportMonthKpiTooltip: "Re-sync đầy đủ rồi xuất báo cáo KPI tháng ra Excel",
        exportMonthSyncing: "⏳ Đang đồng bộ trước khi xuất…",
        alertSyncBeforeExportFailed: "Chưa xuất Excel vì đồng bộ chưa hoàn tất: {error}. Vui lòng thử lại khi kết nối ổn định.",
        alertExportFailed: "Không thể xuất Excel: {error}",
        dailyReportBtn: "📋 Xuất Daily report",
        dailyReportTooltip: "Sao chép báo cáo daily 3 phần",
        monthSelectLabel: "🗓️ Chọn Tháng",
        timeFilterSelectLabel: "📅 Lọc theo Tuần / Ngày",
        filterWeek: "Tuần này",
        filterMonth: "Tháng này",
        filterAll: "Tất cả",
        customRangeFrom: "Từ ngày",
        customRangeTo: "Đến ngày",
        applyRangeBtn: "🔍 Áp dụng",
        tabWorkItemsTitle: "Chi tiết công việc",
        tabAnalyticsTitle: "Phân tích & Biểu đồ Tháng",
        quickControlsTitle: "Tìm kiếm & Lọc nhanh",
        quickControlsTooltip: "Bấm để mở rộng / thu gọn bộ lọc",
        searchPlaceholder: "Tìm kiếm theo tên task, #iid, URL, issue cha, dự án...",
        clearSearchTooltip: "Xóa tìm kiếm",
        openFilteredTabsBtn: "🌐 Mở tab",
        openFilteredTabsTooltip: "Mở các task đang lọc trong danh sách trên các tab mới",
        chipAll: "Tất cả",
        chipMR: "🚀 Merge Requests",
        chipLate: "🔴 Trễ hạn",
        chipMissingTime: "⚠️ Thiếu Est/Spent",
        chipMissingDate: "📅 Thiếu Ngày",
        chipReopen: "🔄 Bị Reopen",
        chipUnplanned: "⚡ Phát sinh",
        chipOpen: "⏳ Đang mở",
        kpiHealthScore: "Dự Báo KPI Tháng & Sức Khỏe Hiệu Suất",
        kpiHealthAssessmentPeriod: "Kỳ đánh giá:",
        kpiHealthScoreScale: "Dự báo điểm KPI (Thang 5.0)",
        attitudeScore: "Thái độ",
        volumeScore: "Khối lượng",
        qualityScore: "Chất lượng",
        onTimeRate: "Tỉ lệ đúng hạn",
        hoursProgressTitle: "⌛ Tiến độ giờ làm việc",
        hoursStandardTarget: "tiêu chuẩn",
        hoursPlanned: "Kế hoạch:",
        hoursUnplanned: "Phát sinh:",
        healthAlertsTitle: "🛡️ Sức khỏe KPI & Lối tắt xử lý",
        tableTasks: "Tasks",
        tableWorkItemName: "Tên Work Item",
        tableParentIssue: "Issue cha",
        tableStartDate: "Start date",
        tableDueDate: "Due date",
        tableClosedDate: "Closed date",
        tableEst: "Estimate toàn task (h)",
        tableSpent: "Spent trong kỳ (h)",
        tableLifetimeSpent: "Spent toàn task (h)",
        tableDiff: "Chênh lệch toàn task",
        tableDiffTooltip: "Spent toàn task ({spent}h) − Estimate ({estimate}h). Chỉ đánh giá task đã đóng.",
        tableDiffPending: "Task chưa đóng hoặc chưa có estimate.",
        tableReopen: "Số lần bị reopen",
        tableTaskType: "Loại task",
        tableProgress: "Tiến độ",
        tableStatus: "Trạng thái",
        tableAction: "Thao tác",
        statusDoing: "Đang làm",
        statusDone: "Hoàn thành",
        statusCarryOver: "Tồn đọng",
        statusLate: "Trễ hạn",
        statusInTime: "Đúng hạn",
        timesheetTitle: "Bảng Kiểm Tra Log Time Hàng Ngày",
        timesheetSubtitle: "Định mức chuẩn 8.0h/ngày làm việc (Thứ 2 - Thứ 6)",
        timesheetStandardHours: "Giờ chuẩn",
        timesheetOvertime: "Tăng ca",
        timesheetLate: "Đi muộn / Thiếu giờ",
        timesheetLogged: "Thời gian đã log:",
        timesheetTarget: "Chỉ tiêu ngày:",
        chartWeeklyEstSpentSub: "Phân bổ giờ đã log theo từng tuần trong tháng đã chọn",
        chartTaskTypeTitle: "Cơ cấu Kế hoạch vs Phát sinh (Planned vs Unplanned)",
        chartTaskTypeSub: "Tỷ lệ công việc dự kiến và ngoài dự kiến",
        chartTaskStatusTitle: "Tình trạng Công việc (In-time / Late / Open)",
        chartTaskStatusSub: "Tỷ lệ công việc đúng hạn, trễ hạn và đang mở",
        modalDayTitle: "Chi tiết ngày làm việc",
        leaveSettingTitle: "🏖️ Thiết lập ngày nghỉ phép / Nghỉ lễ:",
        leaveDayNormal: "💼 Ngày làm việc bình thường (Chỉ tiêu 8h)",
        leaveDayHalf: "🌓 Nghỉ nửa ngày (0.5 ngày - Chỉ tiêu 4h)",
        leaveDayFull: "🏖️ Nghỉ cả ngày (1.0 ngày - Chỉ tiêu 0h)",
        leaveReasonLabel: "Lý do nghỉ (tùy chọn):",
        leaveReasonPlaceholder: "VD: Nghỉ phép năm, khám bệnh, việc cá nhân, nghỉ lễ...",
        saveLeaveBtn: "💾 Lưu thiết lập ngày",
        dayOvertimeLabel: "🌙 Có overtime",
        recordedTasksTitle: "📋 Công việc đã ghi nhận trong ngày",

        // --- Monthly KPI Analytics Summary Cards ---
        monthlyKpiForecastLabel: "Dự báo Điểm KPI Tháng",
        totalLoggedHoursTargetLabel: "Tổng Giờ Đã Log / Chỉ Tiêu",
        achievementSub: "Đạt <strong>{pct}%</strong> chỉ tiêu ({days} ngày làm việc{leaveStr})",
        deductedLeaveSub: " • Đã trừ {days}d nghỉ",
        onTimeRateLabel: "Tỷ lệ đúng hạn",
        onTimeCountSub: "{inTime}/{total} công việc đúng hạn",
        totalMergeRequestsLabel: "Tổng Merge Requests",
        mrsClosedSub: "{closed}/{total} đã merge/đóng",
        mrsMonthSub: "{total} MRs trong tháng",
        plannedVsUnplannedLabel: "Kế hoạch / Phát sinh",
        plannedVsUnplannedSub: "{planned} kế hoạch • {unplanned} phát sinh",

        // --- Rating Badges ---
        ratingExcellent: "Xuất sắc",
        ratingGood: "Tốt",
        ratingAverage: "Khá",
        ratingAttention: "Cần chú ý",
        ratingNoData: "Chưa có dữ liệu",

        // --- Monthly Charts ---
        chartLabelEstimate: "Ước tính (Estimate)",
        chartLabelSpent: "Thực tế (Spent)",
        chartLabelPlanned: "Kế hoạch (Planned)",
        chartLabelUnplanned: "Phát sinh (Unplanned)",
        chartLabelInTime: "Đúng hạn (In-time)",
        chartLabelLate: "Trễ hạn (Late)",
        chartLabelOpen: "Đang mở (Open)",
        chartAxisHours: "Số giờ (h)",
        chartTooltipTasks: " {label}: {val} công việc ({pct}%)",

        // --- Timesheet Daily Audit Badges & Tooltips ---
        timesheetLeave: "Nghỉ",
        timesheetLeaveFullDay: "Nghỉ cả ngày",
        timesheetLeaveHalf: "Nghỉ (0.5d)",
        timesheetLeaveHalfSuccess: "Nghỉ 0.5d (Đủ 4h)",
        timesheetSuccess: "Đạt chuẩn",
        timesheetSuccessStandard: "Đạt chuẩn (>= 8h)",
        timesheetDeficitHours: "Thiếu {hours}h",
        timesheetNotLogged4h: "Chưa log (-4h)",
        timesheetNotLogged8h: "Chưa log (-8h)",
        timesheetNotLogged0h: "Chưa log (0h)",
        timesheetWeekend: "Cuối tuần",
        timesheetFuture: "Chưa tới",
        timesheetDayTooltip: "{dayName}, ngày {dayNum}/{month} - Đã log: {spent}h ({count} công việc):",
        modalDayDetailTitle: "Chi tiết ngày {date} ({day})",
        leaveDayHalfBadge: "Nghỉ 0.5 ngày",
        leaveDayFullBadge: "Nghỉ cả ngày (1.0d)",

        // --- Pagination & Table Controls ---
        paginationShowing: "Hiển thị <strong>{start}</strong> - <strong>{end}</strong> trong tổng số <strong>{total}</strong> công việc <span style=\"color:var(--text-muted);margin-left:4px;\">(Trang {page}/{pages})</span>",
        paginationPerPage: "Mỗi trang:",
        paginationAllOption: "Tất cả",
        paginationFirst: "Trang đầu",
        paginationPrev: "Trang trước",
        paginationNext: "Trang sau",
        paginationLast: "Trang cuối",
        emptyNoMatchingTitle: "Không tìm thấy công việc phù hợp",
        emptyNoMatchingSub: "Không có công việc nào khớp với bộ lọc \"<strong>{filter}</strong>\"{query} trong kỳ này.",
        emptyQuerySub: " hoặc từ khóa \"<strong>{query}</strong>\"",
        btnResetFilters: "✕ Đặt lại bộ lọc",
        emptyNoTasksInPeriod: "Không có task hoặc Merge Request nào trong khoảng thời gian đã chọn.",
        paginationPageTooltip: "Trang {page}",
        statusUnclosed: "Chưa đóng",
        statusUnclosedTitle: "Task này hiện chưa được đóng trên GitLab",
        tableTotalLabel: "TỔNG CỘNG",
        actionDeleteTaskTitle: "Xóa task này khỏi danh sách",
        clickToViewDetailOrLeave: "👉 Bấm để xem chi tiết hoặc thiết lập ngày nghỉ",
        deleteThisWeekBtn: "🗑️ Xóa tuần này",
        deleteThisWeekTitle: "Xóa toàn bộ Task và Merge Request trong {title}",
        lastStatsUpdatedPrefix: "Lần thống kê cuối: ",
        lastStatsPreviousWeekSuffix: " (Tuần trước)",
        noDataToStat: "Không có dữ liệu để thống kê.",
        workItemsUnit: "công việc",
        ongoingSuffix: "tiếp diễn",
        confirmDeleteItem: "Bạn có chắc muốn xóa {type} \"{label}\" khỏi danh sách?",
        alertNoTasksInWeekToDelete: "Không có công việc nào trong tuần này để xóa.",
        confirmDeleteWeekItems: "Bạn có chắc muốn xóa toàn bộ {count} công việc (bao gồm cả Task và Merge Request) trong \"{title}\"?",
        alertNoItemsInRangeToDelete: "Không có công việc hoặc Merge Request nào trong khoảng thời gian này để xóa.",
        groupOther: "Khác",
        dateRangePrefix: "Khoảng ngày",
        clickToSortByColumn: "Bấm để sắp xếp theo {column}",
        mrSectionTitle: "DANH SÁCH MERGE REQUEST",
        mrOpenTitle: "Merge Request đang mở (Open)",
        deleteMRTitle: "Xóa MR này khỏi danh sách",
        totalMRsFooterLabel: "TỔNG MERGE REQUEST",

        // --- Filters & Time Selects ---
        filterScopeMain: "Phạm vi xem",
        filterScopeAllMonth: "📅 Cả tháng ({month}/{year})",
        filterScopeCustomRange: "🗓️ Tùy chọn khoảng ngày...",
        filterWeeksInMonth: "── Các tuần trong tháng ──",
        filterSpecificDays: "── Lọc theo ngày cụ thể ──",
        todaySuffix: " (Hôm nay)",
        thisWeekSuffix: " (Tuần này)",
        thisMonthSuffix: " (Tháng này)",
        currentWeekPrefix: "⭐ Tuần hiện tại ({start} - {end})",
        weekNumLabel: "Tuần {num} ({start} - {end})",
        monthBadgeLabel: "Tháng {month}/{year}",
        filterSummaryPrefix: "Lọc:",
        searchSummaryPrefix: "Tìm:",
        searchFoundZero: "Tìm thấy <strong>0</strong> task",
        searchFoundCount: "Tìm thấy <strong>{found}</strong> / <strong>{total}</strong> task",
        searchFoundWithRows: "Tìm thấy <strong>{found}</strong> task <span class=\"search-repeat-count\" title=\"Công việc lặp lại ở nhiều tuần khác nhau do tiếp diễn\">({rows} dòng)</span> / <strong>{total}</strong>",

        // --- KPI Health Card Alerts ---
        kpiLateAlert: "🔴 Có <strong>{count}</strong> công việc trễ hạn ({rate}%)",
        viewErrorsAction: "Xem lỗi ➔",
        allInTimeAlert: "🟢 100% công việc đúng hạn",
        missingTimeAlert: "⚠️ Thiếu Estimate: <strong>{est}</strong> • Thiếu Spent: <strong>{spent}</strong>",
        allTimeProvidedAlert: "🟢 Đầy đủ Estimate và Spent",
        missingDateAlert: "📅 Có <strong>{count}</strong> công việc thiếu Ngày",
        reopenAlert: "🔄 Có <strong>{count}</strong> công việc bị reopen ({rate}%)",
        clickToFilterAlertTitle: "Bấm để lọc các công việc này",

        // --- KPI Performance Overview ---
        statsOverviewTitle: "📈 TỔNG QUAN HIỆU SUẤT",
        statPlannedUnplanned: "Kế hoạch / Phát sinh",
        statInTimeLate: "Đúng hạn / Trễ hạn",
        statReopen: "Task Reopen",
        statDailySpent: "Daily Spent",
        typePlanned: "Kế hoạch",
        typeUnplanned: "Phát sinh",

        // --- GitLab In-Page Summary ---
        summaryBtn: "📊 Tổng hợp task",
        summaryBtnTooltip: "Tổng hợp task con của tôi",
        summaryModalTitle: "📊 Tổng hợp Task con của tôi",
        syncingFromGitlab: "Đang đồng bộ số liệu mới nhất từ GitLab...",
        addAllToKpiModal: "➕ Thêm tất cả vào KPI",
        refreshBtn: "🔄 Làm mới",
        metricTotalTasks: "Tổng Task",
        metricClosedTasks: "{count} đóng",
        metricOpenTasks: "{count} mở",
        metricTotalEst: "Tổng Estimate",
        metricTotalSpent: "Tổng Spent",
        metricPlannedTasks: "{count} kế hoạch",
        metricUnplannedTasks: "{count} phát sinh",
        metricDiff: "Chênh lệch",
        diffSurplus: "Dư thời gian",
        diffExceeded: "Vượt Estimate",
        metricOnTimeRate: "Đúng hạn",
        allOnTime: "100% đúng hạn",
        lateTasksCount: "{count} task trễ",
        searchTaskPlaceholder: "🔍 Tìm kiếm theo tên hoặc #id task...",
        showingTasksCount: "Hiển thị {shown} / {total} task",
        tableHeaderTask: "Task",
        tableHeaderEst: "Estimate",
        tableHeaderSpent: "Spent",
        tableHeaderDiff: "Chênh lệch",
        tableHeaderStart: "Bắt đầu",
        tableHeaderDue: "Hạn chót",
        tableHeaderCreated: "Ngày mở",
        tableHeaderClosed: "Ngày đóng",
        tableHeaderStatus: "Trạng thái",
        tableHeaderProgress: "Tiến độ",
        tableHeaderType: "Phân loại",
        tableHeaderKpi: "KPI",
        btnAddSingleToKpi: "➕ Thêm vào KPI",
        btnAddedToKpi: "✔ Đã thêm vào KPI",
        kpiDashboardTitle: "Bảng Điều Khiển KPI",
        tableTask: "Công việc",
        tableAssignee: "Người thực hiện",
        chartEstSpentTitle: "Giờ đã log theo tuần",
        taskTitleLabel: "Tên công việc:",
        addToKpi: "➕ Thêm vào KPI",
        addedToKpi: "✔ Đã thêm vào KPI",
        tableColIid: "#IID",
        tableColTitle: "Tiêu đề",
        tableColAssignee: "Người thực hiện",
        tableColEst: "Estimate",
        tableColSpent: "Spent",
        tableColDiff: "Chênh lệch",
        tableColStatus: "Trạng thái",
        tableColTimeline: "Thời gian",
        tableColAction: "Thao tác",

        // --- Desktop Notifications ---
        notifCheckinTitle: "🔔 Nhắc nhở chấm công vào ca",
        notifCheckinMsg: "Đã đến giờ bắt đầu làm việc ({time}). Nhấn vào đây để mở link chấm công!",
        notifCheckoutTitle: "🔔 Nhắc nhở chấm công về",
        notifCheckoutMsg: "Đã đến giờ kết thúc ca làm ({time}). Nhấn vào đây để mở link chấm công!",
        notifTodoReminderTitle: "🔔 Nhắc nhở công việc",
        notifTodoReminderMsg: "👉 \"{title}\" {status} lúc {time}",
        notifTodoOverdue: "đã quá hạn",
        notifTodoUpcoming: "sắp đến hạn",
        notifTestSoundTitle: "🔔 Kiểm tra chuông nhắc việc",
        notifTestSoundMsgUrl: "Thông báo hoạt động tốt! Nhấn vào đây để thử mở link chấm công.",
        notifTestSoundMsgNoUrl: "Thông báo hoạt động tốt! Bạn có thể lưu lại cài đặt.",

        // --- Kanban Card Actions & States ---
        noDeadline: "Không có hạn",
        moveBack: "Trở lại",
        moveForward: "Tiến hành",
        editBtn: "Chỉnh sửa",
        deleteBtn: "Xóa",

        // --- KPI Health Forecast ---
        kpiHealthForecastTitle: "Dự Báo KPI Tháng & Sức Khỏe Hiệu Suất",
        evaluationPeriod: "Kỳ đánh giá",
        kpiForecastScale: "Dự báo điểm KPI (Thang 5.0)",
        kpiBadgeNoData: "Chưa có dữ liệu",
        kpiBadgeAttention: "Cần chú ý",
        kpiBadgeExcellent: "Xuất sắc",
        kpiBadgeGood: "Tốt",
        kpiBadgeFair: "Khá",

        // --- Timesheet Summary ---
        workingDaysLabel: "Ngày làm việc",
        totalHoursLabel: "Tổng giờ",
        achievementRateLabel: "Tỷ lệ đạt",
        noDeficitLabel: "Không thiếu giờ",
        deficitDaysLabel: "Thiếu giờ",
        leaveDaysLabel: "Nghỉ phép/Lễ",
        daysUnit: "ngày",

        // --- GitLab In-Page Actions & Badges ---
        removeFromKpi: "Xóa khỏi KPI",
        removeBtnShort: "Xóa",
        addBtnShort: "Thêm",
        syncingDataGitlab: "⏳ Đang quét danh sách task con và đồng bộ số liệu từ GitLab...",
        noMatchingTasksFound: "Không tìm thấy task con nào phù hợp",
        noMyTasksFound: "Không tìm thấy task con nào thuộc về bạn trên trang này.",
        noTitle: "Không có tiêu đề",
        statusClosed: "Đã đóng",
        statusOpen: "Đang mở",
        statusOnTime: "Đúng hạn",
        statusUnplanned: "Phát sinh",
        statusPlanned: "Kế hoạch",
        removeTaskFromKpiTooltip: "Xóa task này khỏi KPI",
        addTaskToKpiTooltip: "Thêm task này vào KPI",
        addedAllToKpiSuccess: "✔ Đã thêm tất cả vào KPI",
        refreshing: "⏳ Đang làm mới...",
        syncing: "⏳ Đang đồng bộ...",

        // --- KPI Forecast, Health & Prompts Extras ---
        toggleHealthBtnTitle: "Bấm để mở rộng / thu gọn chi tiết dự báo KPI",
        attitudeTooltip: "Thái độ (Estimate, Spent, Ngày tháng): Hệ số 1.0",
        volumeTooltip: "Khối lượng (Giờ làm việc): Hệ số 3.0",
        qualityTooltip: "Chất lượng (Đúng hạn & Reopen): Hệ số 6.0",
        reachPrefix: "Đạt",
        confirmOpenMultipleTabs: "Bạn có muốn mở đồng thời {count} tab công việc trên trình duyệt không?",
        alertNoFilteredUrlsToOpen: "Không có công việc nào trong danh sách đang lọc để mở.",
        noStoredTasksOrMrs: "Chưa có task hoặc Merge Request nào được lưu trữ.",
        alertNoItemsToDelete: "Không có công việc nào để xóa.",
        taskOpenTitle: "Task chưa đóng (Open)",
        noTasksRecordedForDay: "Chưa có công việc nào ghi nhận trong ngày này.",
        deleteRangeConfirm: "Bạn có chắc muốn xóa toàn bộ {count} công việc (bao gồm cả Task và Merge Request) trong \"{target}\"?",
        deleteMonthConfirm: "⚠️ CẢNH BÁO: Bạn có chắc muốn xóa TOÀN BỘ {count} công việc (bao gồm cả Task và Merge Request) trong {target}?",
        alertNoTasksInMonthToDelete: "Tháng {month} không có công việc nào để xóa.",
        alertInvalidSelection: "Lựa chọn không hợp lệ.",
        alertUndeterminedWeekRange: "Không xác định được phạm vi tuần cần xóa.",
        selectWeekToDeletePrompt: "Chọn tuần trong tháng {month} bạn muốn xóa:\n\n",
        enterWeekPrompt: "\nNhập số thứ tự tuần (1 - {total}) hoặc nhấn Hủy:",
        alertNoItemsInRangeOrMonth: "Không có công việc hoặc Merge Request nào trong \"{target}\" để xóa.",
        alertNoTasksInMonthToDeleteGeneral: "Không có công việc hoặc Merge Request nào trong tháng này để xóa.",
        alertNoActiveWeeksInMonth: "Tháng {month} không có tuần nào có dữ liệu công việc.",
        selectWeekToExportPrompt: "Chọn tuần bạn muốn xuất KPI trong tháng {month}:\n\n",
        alertNoKpiDataToExport: "Chưa có dữ liệu KPI. Vui lòng chờ đồng bộ hoàn tất trước khi xuất file!",
        alertNoMonthDataToExport: "Tháng {month} không có dữ liệu công việc.",
        alertOnlyAvailableForWidosoft: "Chức năng xuất KPI mẫu Excel chỉ áp dụng cho máy chủ gitlab.widosoft."
    },

    en: {
        // Automatic GitLab task sync
        syncSettingsTitle: "🔄 Automatic sync",
        syncEnabledLabel: "Enable automatic sync",
        syncIntervalLabel: "Sync interval:",
        syncEvery5: "Every 5 minutes",
        syncEvery15: "Every 15 minutes",
        syncEvery30: "Every 30 minutes",
        syncEvery60: "Every 60 minutes",
        syncHoursHint: "Auto sync runs Monday–Friday between check-in and check-out, refreshing today's activity and missed new/changed data. Re-sync refreshes all tracked items.",
        syncNow: "🔄 Re-sync all",
        syncDisconnected: "GitLab is not connected",
        syncRunning: "🔄 Syncing…",
        syncError: "⚠️ Sync failed — hover for details",
        syncPending: "🔄 Sync will continue…",
        syncDisabled: "Automatic sync is off",
        syncWaiting: "Waiting for sync hours",
        syncReady: "Automatic sync is ready",
        syncLast: "Last synced: {time}",
        syncLastFull: "Last full re-sync: {time}",
        syncNeedsFull: "No full re-sync yet",
        syncEmpty: "Waiting for synced data. Choose Re-sync all in settings to load the complete history.",

        // --- Language Switcher ---
        langVi: "Tiếng Việt",
        langEn: "English",
        langSwitcherTitle: "Switch interface language",
        languageLabel: "Language:",

        // --- Navigation & Tabs ---
        tabMonth: "📊 Month",
        tabTools: "🛠️ Tools",
        tabHome: "Home",
        tabNotes: "Notes",
        tabTodo: "To-Do",
        tabWorkItems: "Work Items",
        tabAnalytics: "Monthly Analytics & Charts",

        // --- Auth & Login ---
        welcomeTitle: "Welcome 👋",
        welcomeDesc: "Enter Personal Access Token to get started",
        gitlabServerUrlLabel: "GitLab Server URL:",
        gitlabServerUrlPlaceholder: "https://gitlab.com or self-hosted server...",
        invalidServerUrl: "Please enter a valid GitLab Server URL",
        serverUrlSaved: "GitLab Server URL saved successfully",
        hostPermissionRequired: "Permission to access this GitLab server is required to continue!",
        getTokenHelp: "Get Access Token from this server",
        tokenPlaceholder: "Enter Personal Access Token...",
        connectBtn: "Connect Now",
        tutorialBtn: "User Guide",
        logoutBtn: "Log out",
        tokenRequired: "Please enter a token",
        connectSuccess: "Connected successfully!",
        connectFailed: "Invalid Token!",
        invalidToken: "Token is invalid or expired",

        // --- Banner & Unadded Tasks ---
        addedSuccess: "✔ Added",
        alreadyAdded: "Already added to KPI",

        // --- Popup Stats Cards ---
        statsMonthTitle: "⭐ Monthly Stats",
        statTotalTasks: "Total Tasks",
        statEstimate: "Estimate",
        statSpent: "Spent in period",
        progressDaily: "Daily Progress:",
        progressMonth: "Monthly Progress:",
        metricOnTime: "On-Time",
        metricKpiForecast: "KPI Forecast",

        // --- Check-in / Out Card & Settings ---
        storageTitle: "📦 Storage",
        checkinCardTitle: "⏰ Check-in / Out Alerts",
        workdayBadge: "Mon - Fri",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
        minutesUnit: "min",
        snoozeLabel: "Snooze:",
        snooze5m: "Every 5 min (Max 3 times)",
        snooze10m: "Every 10 min (Max 3 times)",
        snooze15m: "Every 15 min (Max 3 times)",
        snoozeNone: "Do not snooze",
        urlLabel: "Attendance URL:",
        urlPlaceholder: "https://attendance.company.com...",
        testSoundBtn: "🔔 Test Bell",
        testSoundBtnTitle: "Click to test notification immediately",
        testSoundTooltip: "Click to test notification immediately",
        saveSettingsBtn: "💾 Save",
        saveSettingsSuccess: "✔ Settings saved!",

        // --- Tools Grid & Quick Links ---
        noteWindowBtn: "Notes (Window) 🗗",
        noteWindowBtnTitle: "Open notes in a pop-out window",
        noteTabBtn: "Notes (Tab) 📑",
        noteTabBtnTitle: "Open notes in a new tab",
        todoWindowBtn: "To-Do (Window) 🗗",
        todoWindowBtnTitle: "Open to-do in a pop-out window",
        todoTabBtn: "To-Do (Tab) 📑",
        todoTabBtnTitle: "Open to-do in a new tab",
        exportBtn: "Export Data 💿",
        importBtn: "Import Data 📀",
        importSuccess: "Data imported successfully!",
        importError: "Failed to read file or invalid format.",
        quickGitlabTitle: "🦊 Quick Access on GitLab",
        quickIssuesBtn: "📋 Issues",
        quickIssuesTooltip: "Issues assigned to you",
        quickMRsBtn: "🚀 MRs",
        quickMRsTooltip: "Your Merge Requests",
        quickTodosBtn: "📝 To-Do",
        quickTodosTooltip: "To-Do items on GitLab",
        openDashboardBtn: "Open Dashboard 📊",

        // --- Kanban Board ---
        kanbanTitle: "📋 Kanban Board",
        totalTodoActive: "{count} active task(s)",
        windowModeBtn: "🗗 Pop-out Window",
        tabModeBtn: "📑 Open in Tab",
        modeSwitchTooltip: "Toggle window mode",
        clearAllBtn: "Clear All",
        confirmClearAll: "Are you sure you want to clear all tasks?",
        addTaskPlaceholder: "What needs to be done? (Press Enter to add)",
        deadlinePlaceholder: "Deadline",
        reminderSettingsTooltip: "Reminder settings",
        reminderBeforeLabel: "⏰ Before (min):",
        reminderRepeatLabel: "🔁 Repeat (min):",
        saveReminderSettingsTooltip: "Save reminder settings",
        addTaskBtn: "➕ Add Task",
        colTodo: "TO DO",
        colProcessing: "IN PROGRESS",
        colDone: "DONE",
        editTaskModalTitle: "Edit Task",
        taskNameLabel: "Task Name:",
        deadlineLabel: "Deadline:",
        cancelBtn: "Cancel",
        saveChangesBtn: "Save Changes",
        deleteTaskBtn: "Delete",

        // --- Notepad ---
        notesTitle: "Notepad - Personal Notes",
        untitledNote: "Note {index}",
        closeTabTooltip: "Close tab",
        newTabTooltip: "Add new tab (+)",
        addNoteBtn: "+",
        deleteNoteBtn: "×",
        privacyTooltip: "Toggle privacy blur",
        copyAllTooltip: "Copy entire note",
        copiedTooltip: "Copied!",
        themeToggleTooltip: "Toggle Light / Dark mode",
        notePlaceholder: "Start typing notes here...",
        autoSaved: "Saved ✔",
        saving: "Saving...",
        wordsCount: "{count} word(s)",
        charsCount: "{count} character(s)",

        // --- KPI Dashboard ---
        pageTitle: "GitLab Productivity 📊",
        deleteWeekBtn: "🗑️ Delete Week",
        deleteWeekTooltip: "Delete all Tasks and Merge Requests in selected week",
        deleteMonthBtn: "🗑️ Delete Month",
        deleteMonthTooltip: "Delete all Tasks and Merge Requests in selected month",
        exportMonthKpiBtn: "📊 Export Monthly KPI",
        exportMonthKpiTooltip: "Fully re-sync, then export the monthly KPI report to Excel",
        exportMonthSyncing: "⏳ Syncing before export…",
        alertSyncBeforeExportFailed: "Excel was not exported because sync did not finish: {error}. Please retry when the connection is stable.",
        alertExportFailed: "Unable to export Excel: {error}",
        dailyReportBtn: "📋 Export Daily Report",
        dailyReportTooltip: "Copy 3-part daily report",
        monthSelectLabel: "🗓️ Select Month",
        timeFilterSelectLabel: "📅 Filter by Week / Day",
        filterWeek: "This Week",
        filterMonth: "This Month",
        filterAll: "All",
        customRangeFrom: "From date",
        customRangeTo: "To date",
        applyRangeBtn: "🔍 Apply",
        tabWorkItemsTitle: "Work Items Detail",
        tabAnalyticsTitle: "Monthly Analytics & Charts",
        quickControlsTitle: "Quick Search & Filters",
        quickControlsTooltip: "Click to expand / collapse filters",
        searchPlaceholder: "Search by task name, #iid, URL, parent issue, project...",
        clearSearchTooltip: "Clear search",
        openFilteredTabsBtn: "🌐 Open Tabs",
        openFilteredTabsTooltip: "Open filtered tasks in new browser tabs",
        chipAll: "All",
        chipMR: "🚀 Merge Requests",
        chipLate: "🔴 Overdue",
        chipMissingTime: "⚠️ Missing Est/Spent",
        chipMissingDate: "📅 Missing Dates",
        chipReopen: "🔄 Reopened",
        chipUnplanned: "⚡ Unplanned",
        chipOpen: "⏳ Open",
        kpiHealthScore: "Monthly KPI Forecast & Performance Health",
        kpiHealthAssessmentPeriod: "Evaluation period:",
        kpiHealthScoreScale: "KPI Score Forecast (5.0 Scale)",
        attitudeScore: "Attitude",
        volumeScore: "Volume",
        qualityScore: "Quality",
        onTimeRate: "On-Time Rate",
        hoursProgressTitle: "⌛ Working Hours Progress",
        hoursStandardTarget: "standard",
        hoursPlanned: "Planned:",
        hoursUnplanned: "Unplanned:",
        healthAlertsTitle: "🛡️ KPI Health & Quick Fixes",
        tableTasks: "Tasks",
        tableWorkItemName: "Work Item Name",
        tableParentIssue: "Parent Issue",
        tableStartDate: "Start date",
        tableDueDate: "Due date",
        tableClosedDate: "Closed date",
        tableEst: "Whole-task estimate (h)",
        tableSpent: "Spent in period (h)",
        tableLifetimeSpent: "Lifetime spent (h)",
        tableDiff: "Whole-task variance",
        tableDiffTooltip: "Lifetime spent ({spent}h) − Estimate ({estimate}h). Evaluated only for closed tasks.",
        tableDiffPending: "Task is open or has no estimate.",
        tableReopen: "Reopen Count",
        tableTaskType: "Task Type",
        tableProgress: "Progress",
        tableStatus: "Status",
        tableAction: "Action",
        statusDoing: "Doing",
        statusDone: "Done",
        statusCarryOver: "Carry Over",
        statusLate: "Overdue",
        statusInTime: "In-time",
        timesheetTitle: "Daily Timesheet Audit",
        timesheetSubtitle: "Standard target 8.0h/workday (Monday - Friday)",
        timesheetStandardHours: "Standard Hours",
        timesheetOvertime: "Overtime",
        timesheetLate: "Under-logged / Late",
        timesheetLogged: "Logged time:",
        timesheetTarget: "Daily target:",
        chartWeeklyEstSpentSub: "Distribution of logged hours by week within the selected month",
        chartTaskTypeTitle: "Planned vs Unplanned Task Composition",
        chartTaskTypeSub: "Ratio of planned versus unplanned work items",
        chartTaskStatusTitle: "Task Status Breakdown (In-time / Late / Open)",
        chartTaskStatusSub: "Ratio of in-time, overdue, and open tasks",
        modalDayTitle: "Workday Details",
        leaveSettingTitle: "🏖️ Leave & Holiday Configuration:",
        leaveDayNormal: "💼 Normal workday (8.0h target)",
        leaveDayHalf: "🌓 Half-day leave (0.5 day - 4.0h target)",
        leaveDayFull: "🏖️ Full-day leave (1.0 day - 0.0h target)",
        leaveReasonLabel: "Leave reason (optional):",
        leaveReasonPlaceholder: "e.g. Annual leave, doctor visit, personal, public holiday...",
        saveLeaveBtn: "💾 Save Day Configuration",
        dayOvertimeLabel: "🌙 Overtime",
        recordedTasksTitle: "📋 Recorded tasks for this day",

        // --- Monthly KPI Analytics Summary Cards ---
        monthlyKpiForecastLabel: "Monthly KPI Score Forecast",
        totalLoggedHoursTargetLabel: "Total Logged Hours / Target",
        achievementSub: "Reached <strong>{pct}%</strong> of target ({days} workdays{leaveStr})",
        deductedLeaveSub: " • Deducted {days}d leave",
        onTimeRateLabel: "On-time Rate",
        onTimeCountSub: "{inTime}/{total} on-time work items",
        totalMergeRequestsLabel: "Total Merge Requests",
        mrsClosedSub: "{closed}/{total} merged/closed",
        mrsMonthSub: "{total} MRs in month",
        plannedVsUnplannedLabel: "Planned / Unplanned",
        plannedVsUnplannedSub: "{planned} planned • {unplanned} unplanned",

        // --- Rating Badges ---
        ratingExcellent: "Excellent",
        ratingGood: "Good",
        ratingAverage: "Average",
        ratingAttention: "Needs Attention",
        ratingNoData: "No data",

        // --- Monthly Charts ---
        chartLabelEstimate: "Estimate",
        chartLabelSpent: "Spent",
        chartLabelPlanned: "Planned",
        chartLabelUnplanned: "Unplanned",
        chartLabelInTime: "In-time",
        chartLabelLate: "Overdue",
        chartLabelOpen: "Open",
        chartAxisHours: "Hours (h)",
        chartTooltipTasks: " {label}: {val} work items ({pct}%)",

        // --- Timesheet Daily Audit Badges & Tooltips ---
        timesheetLeave: "Leave",
        timesheetLeaveFullDay: "Full-day leave",
        timesheetLeaveHalf: "Leave (0.5d)",
        timesheetLeaveHalfSuccess: "0.5d Leave (4h Target Met)",
        timesheetSuccess: "Standard Met",
        timesheetSuccessStandard: "Standard Met (>= 8h)",
        timesheetDeficitHours: "Deficit {hours}h",
        timesheetNotLogged4h: "Unlogged (-4h)",
        timesheetNotLogged8h: "Unlogged (-8h)",
        timesheetNotLogged0h: "Unlogged (0h)",
        timesheetWeekend: "Weekend",
        timesheetFuture: "Upcoming",
        timesheetDayTooltip: "{dayName}, {month}/{dayNum} - Logged: {spent}h ({count} work items):",
        modalDayDetailTitle: "Day Details: {date} ({day})",
        leaveDayHalfBadge: "0.5-day leave",
        leaveDayFullBadge: "Full-day leave (1.0d)",

        // --- Pagination & Table Controls ---
        paginationShowing: "Showing <strong>{start}</strong> - <strong>{end}</strong> of <strong>{total}</strong> work items <span style=\"color:var(--text-muted);margin-left:4px;\">(Page {page}/{pages})</span>",
        paginationPerPage: "Per page:",
        paginationAllOption: "All",
        paginationFirst: "First page",
        paginationPrev: "Previous page",
        paginationNext: "Next page",
        paginationLast: "Last page",
        emptyNoMatchingTitle: "No matching work items found",
        emptyNoMatchingSub: "No work items match filter \"<strong>{filter}</strong>\"{query} for this period.",
        emptyQuerySub: " or keyword \"<strong>{query}</strong>\"",
        btnResetFilters: "✕ Reset filters",
        emptyNoTasksInPeriod: "No tasks or Merge Requests in the selected time range.",
        paginationPageTooltip: "Page {page}",
        statusUnclosed: "Unclosed",
        statusUnclosedTitle: "This task is not yet closed on GitLab",
        tableTotalLabel: "TOTAL",
        actionDeleteTaskTitle: "Remove this task from list",
        clickToViewDetailOrLeave: "👉 Click to view details or configure leave",
        deleteThisWeekBtn: "🗑️ Delete this week",
        deleteThisWeekTitle: "Delete all Tasks and Merge Requests in {title}",
        lastStatsUpdatedPrefix: "Last calculated: ",
        lastStatsPreviousWeekSuffix: " (Previous week)",
        noDataToStat: "No data to calculate statistics.",
        workItemsUnit: "work items",
        ongoingSuffix: "ongoing",
        confirmDeleteItem: "Are you sure you want to remove {type} \"{label}\" from the list?",
        alertNoTasksInWeekToDelete: "No work items in this week to delete.",
        confirmDeleteWeekItems: "Are you sure you want to delete all {count} work items (including Tasks and Merge Requests) in \"{title}\"?",
        alertNoItemsInRangeToDelete: "No work items or Merge Requests in this date range to delete.",
        groupOther: "Other",
        dateRangePrefix: "Date range",
        clickToSortByColumn: "Click to sort by {column}",
        mrSectionTitle: "MERGE REQUEST LIST",
        mrOpenTitle: "Merge Request is open",
        deleteMRTitle: "Remove this MR from list",
        totalMRsFooterLabel: "TOTAL MERGE REQUESTS",

        // --- Filters & Time Selects ---
        filterScopeMain: "View Scope",
        filterScopeAllMonth: "📅 Whole Month ({month}/{year})",
        filterScopeCustomRange: "🗓️ Custom Date Range...",
        filterWeeksInMonth: "── Weeks in Month ──",
        filterSpecificDays: "── Filter by Specific Day ──",
        todaySuffix: " (Today)",
        thisWeekSuffix: " (This week)",
        thisMonthSuffix: " (This Month)",
        currentWeekPrefix: "⭐ Current week ({start} - {end})",
        weekNumLabel: "Week {num} ({start} - {end})",
        monthBadgeLabel: "Month {month}/{year}",
        filterSummaryPrefix: "Filter:",
        searchSummaryPrefix: "Search:",
        searchFoundZero: "Found <strong>0</strong> tasks",
        searchFoundCount: "Found <strong>{found}</strong> of <strong>{total}</strong> tasks",
        searchFoundWithRows: "Found <strong>{found}</strong> tasks <span class=\"search-repeat-count\" title=\"Tasks repeated across multiple weeks due to continuity\">({rows} rows)</span> / <strong>{total}</strong>",

        // --- KPI Health Card Alerts ---
        kpiLateAlert: "🔴 <strong>{count}</strong> overdue work item(s) ({rate}%)",
        viewErrorsAction: "View errors ➔",
        allInTimeAlert: "🟢 100% work items on time",
        missingTimeAlert: "⚠️ Missing Estimate: <strong>{est}</strong> • Missing Spent: <strong>{spent}</strong>",
        allTimeProvidedAlert: "🟢 All Estimate and Spent logged",
        missingDateAlert: "📅 <strong>{count}</strong> work item(s) missing Dates",
        reopenAlert: "🔄 <strong>{count}</strong> work item(s) reopened ({rate}%)",
        clickToFilterAlertTitle: "Click to filter these work items",

        // --- KPI Performance Overview ---
        statsOverviewTitle: "📈 PERFORMANCE OVERVIEW",
        statPlannedUnplanned: "Planned / Unplanned",
        statInTimeLate: "In-time / Overdue",
        statReopen: "Reopened Tasks",
        statDailySpent: "Daily Spent",
        typePlanned: "Planned",
        typeUnplanned: "Unplanned",

        // --- GitLab In-Page Summary ---
        summaryBtn: "📊 Task Summary",
        summaryBtnTooltip: "Summary of my sub-tasks",
        summaryModalTitle: "📊 My Sub-Tasks Summary",
        syncingFromGitlab: "Syncing latest metrics from GitLab...",
        addAllToKpiModal: "➕ Add All to KPI",
        refreshBtn: "🔄 Refresh",
        metricTotalTasks: "Total Tasks",
        metricClosedTasks: "{count} closed",
        metricOpenTasks: "{count} open",
        metricTotalEst: "Total Estimate",
        metricTotalSpent: "Total Spent",
        metricPlannedTasks: "{count} planned",
        metricUnplannedTasks: "{count} unplanned",
        metricDiff: "Difference",
        diffSurplus: "Hours saved",
        diffExceeded: "Exceeded estimate",
        metricOnTimeRate: "On-time Rate",
        allOnTime: "100% on-time",
        lateTasksCount: "{count} overdue task(s)",
        searchTaskPlaceholder: "🔍 Search by task title or #id...",
        showingTasksCount: "Showing {shown} / {total} task(s)",
        tableHeaderTask: "Task",
        tableHeaderEst: "Estimate",
        tableHeaderSpent: "Spent",
        tableHeaderDiff: "Difference",
        tableHeaderStart: "Start Date",
        tableHeaderDue: "Due Date",
        tableHeaderCreated: "Created Date",
        tableHeaderClosed: "Closed Date",
        tableHeaderStatus: "Status",
        tableHeaderProgress: "Progress",
        tableHeaderType: "Classification",
        tableHeaderKpi: "KPI",
        btnAddSingleToKpi: "➕ Add to KPI",
        btnAddedToKpi: "✔ Added to KPI",
        kpiDashboardTitle: "KPI Dashboard",
        tableTask: "Task",
        tableAssignee: "Assignee",
        chartEstSpentTitle: "Logged hours by week",
        taskTitleLabel: "Task Title:",
        addToKpi: "➕ Add to KPI",
        addedToKpi: "✔ Added to KPI",
        tableColIid: "#IID",
        tableColTitle: "Title",
        tableColAssignee: "Assignee",
        tableColEst: "Estimate",
        tableColSpent: "Spent",
        tableColDiff: "Difference",
        tableColStatus: "Status",
        tableColTimeline: "Timeline",
        tableColAction: "Action",

        // --- Desktop Notifications ---
        notifCheckinTitle: "🔔 Check-in Reminder",
        notifCheckinMsg: "It's time to start work ({time}). Click here to open attendance link!",
        notifCheckoutTitle: "🔔 Check-out Reminder",
        notifCheckoutMsg: "It's time to check out ({time}). Click here to open attendance link!",
        notifTodoReminderTitle: "🔔 Task Reminder",
        notifTodoReminderMsg: "👉 \"{title}\" {status} at {time}",
        notifTodoOverdue: "is overdue",
        notifTodoUpcoming: "is due soon",
        notifTestSoundTitle: "🔔 Test Reminder Bell",
        notifTestSoundMsgUrl: "Notifications work great! Click here to test opening attendance link.",
        notifTestSoundMsgNoUrl: "Notifications work great! You can now save your settings.",

        // --- Kanban Card Actions & States ---
        noDeadline: "No deadline",
        moveBack: "Back",
        moveForward: "Proceed",
        editBtn: "Edit",
        deleteBtn: "Delete",

        // --- KPI Health Forecast ---
        kpiHealthForecastTitle: "Monthly KPI Forecast & Performance Health",
        evaluationPeriod: "Evaluation Period",
        kpiForecastScale: "KPI Score Forecast (5.0 Scale)",
        kpiBadgeNoData: "No data",
        kpiBadgeAttention: "Needs attention",
        kpiBadgeExcellent: "Excellent",
        kpiBadgeGood: "Good",
        kpiBadgeFair: "Fair",

        // --- Timesheet Summary ---
        workingDaysLabel: "Working Days",
        totalHoursLabel: "Total Hours",
        achievementRateLabel: "Achievement Rate",
        noDeficitLabel: "No deficit hours",
        deficitDaysLabel: "Deficit Days",
        leaveDaysLabel: "Leave/Holiday",
        daysUnit: "days",

        // --- GitLab In-Page Actions & Badges ---
        removeFromKpi: "Remove from KPI",
        removeBtnShort: "Delete",
        addBtnShort: "Add",
        syncingDataGitlab: "⏳ Scanning child tasks and syncing data from GitLab...",
        noMatchingTasksFound: "No matching child tasks found",
        noMyTasksFound: "No child tasks assigned to you found on this page.",
        noTitle: "No title",
        statusClosed: "Closed",
        statusOpen: "Open",
        statusOnTime: "On time",
        statusUnplanned: "Unplanned",
        statusPlanned: "Planned",
        removeTaskFromKpiTooltip: "Remove this task from KPI",
        addTaskToKpiTooltip: "Add this task to KPI",
        addedAllToKpiSuccess: "✔ Added all to KPI",
        refreshing: "⏳ Refreshing...",
        syncing: "⏳ Syncing...",

        // --- KPI Forecast, Health & Prompts Extras ---
        toggleHealthBtnTitle: "Click to expand / collapse KPI forecast details",
        attitudeTooltip: "Attitude (Estimate, Spent, Dates): Weight 1.0",
        volumeTooltip: "Volume (Working hours): Weight 3.0",
        qualityTooltip: "Quality (On-time & Reopen): Weight 6.0",
        reachPrefix: "Reached",
        confirmOpenMultipleTabs: "Do you want to open {count} work item tabs simultaneously in your browser?",
        alertNoFilteredUrlsToOpen: "No work items in the filtered list to open.",
        noStoredTasksOrMrs: "No tasks or Merge Requests stored yet.",
        alertNoItemsToDelete: "No work items to delete.",
        taskOpenTitle: "Task is not closed (Open)",
        noTasksRecordedForDay: "No work items recorded on this day.",
        deleteRangeConfirm: "Are you sure you want to delete all {count} work items (including Tasks and Merge Requests) in \"{target}\"?",
        deleteMonthConfirm: "⚠️ WARNING: Are you sure you want to delete ALL {count} work items (including Tasks and Merge Requests) in {target}?",
        alertNoTasksInMonthToDelete: "Month {month} has no work items to delete.",
        alertInvalidSelection: "Invalid selection.",
        alertUndeterminedWeekRange: "Unable to determine week range to delete.",
        selectWeekToDeletePrompt: "Select the week in month {month} you want to delete:\n\n",
        enterWeekPrompt: "\nEnter week number (1 - {total}) or click Cancel:",
        alertNoItemsInRangeOrMonth: "No tasks or Merge Requests in \"{target}\" to delete.",
        alertNoTasksInMonthToDeleteGeneral: "No tasks or Merge Requests in this month to delete.",
        alertNoActiveWeeksInMonth: "Month {month} has no weeks with work item data.",
        selectWeekToExportPrompt: "Select the week you want to export KPI for in month {month}:\n\n",
        alertNoKpiDataToExport: "No KPI data yet. Please wait for sync to finish before exporting.",
        alertNoMonthDataToExport: "Month {month} has no work item data.",
        alertOnlyAvailableForWidosoft: "The KPI Excel export feature is only available for gitlab.widosoft server."
    }
};

let currentLanguage = 'en';

/**
 * Detect browser preferred language. Defaults to 'vi' if starts with 'vi', otherwise 'en'.
 */
function detectBrowserLanguage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
            const uiLang = chrome.i18n.getUILanguage();
            if (uiLang && typeof uiLang === 'string' && uiLang.toLowerCase().startsWith('vi')) {
                return 'vi';
            }
        }
    } catch (e) {
        // ignore
    }

    try {
        if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
            if (navigator.language.toLowerCase().startsWith('vi')) {
                return 'vi';
            }
        }
    } catch (e) {
        // ignore
    }

    return 'en';
}

/**
 * Returns currently active in-memory language code ('vi' | 'en').
 */
function getLanguage() {
    return currentLanguage || 'en';
}

/**
 * Sets active language, normalizes invalid inputs to 'en', and optionally persists to storage.
 * @param {string} lang - 'vi' | 'en'
 * @param {object} [storage] - Optional storage engine with .set({ appLanguage })
 */
async function setLanguage(lang, storage = null) {
    const normalized = (lang === 'vi' || lang === 'en') ? lang : 'en';
    currentLanguage = normalized;

    const targetStorage = storage || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    if (targetStorage && typeof targetStorage.set === 'function') {
        try {
            const res = targetStorage.set({ appLanguage: normalized });
            if (res && typeof res.then === 'function') {
                await res;
            }
        } catch (e) {
            console.error('Failed to persist appLanguage:', e);
        }
    }
    return currentLanguage;
}

/**
 * Initializes language from storage if present, otherwise auto-detects from browser.
 * @param {object} [storage]
 */
async function initLanguage(storage = null) {
    const targetStorage = storage || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    let storedLang = null;

    if (targetStorage && typeof targetStorage.get === 'function') {
        try {
            const data = await targetStorage.get(['appLanguage']);
            if (data && (data.appLanguage === 'vi' || data.appLanguage === 'en')) {
                storedLang = data.appLanguage;
            }
        } catch (e) {
            console.error('Failed to read appLanguage from storage:', e);
        }
    }

    if (!storedLang) {
        storedLang = detectBrowserLanguage();
    }

    currentLanguage = storedLang;
    return currentLanguage;
}

/**
 * Translates a key into current or specified language with optional placeholder substitution.
 * @param {string} key
 * @param {object} [params]
 * @param {string} [lang]
 */
function t(key, params = null, lang = null) {
    if (!key || typeof key !== 'string') return '';
    let targetLang = lang;
    let actualParams = params;
    // Support t(key, 'vi') overload where second argument is the language code
    if (typeof params === 'string') {
        targetLang = params;
        actualParams = null;
    }
    if (targetLang && typeof targetLang === 'string') {
        targetLang = targetLang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
    } else {
        targetLang = getLanguage();
    }
    const dict = I18N_DICTIONARIES[targetLang] || I18N_DICTIONARIES.en;
    let text = dict[key];

    // Fallback to English dictionary if key is missing in requested language
    if (text === undefined && targetLang !== 'en' && I18N_DICTIONARIES.en) {
        text = I18N_DICTIONARIES.en[key];
    }

    // Fallback to raw key if missing in both
    if (text === undefined) {
        return key;
    }

    if (actualParams && typeof actualParams === 'object') {
        return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramName) => {
            return actualParams[paramName] !== undefined ? String(actualParams[paramName]) : match;
        });
    }

    return text;
}

/**
 * Declaratively translates DOM elements having data-i18n* attributes.
 * @param {HTMLElement|Document} rootElement
 * @param {string} [lang]
 */
function applyI18n(rootElement, lang = null) {
    const root = rootElement || (typeof document !== 'undefined' ? document : null);
    if (!root) return;

    const targetLang = (lang === 'vi' || lang === 'en') ? lang : getLanguage();

    function translateElement(el) {
        if (!el || typeof el.getAttribute !== 'function') return;

        const textKey = el.getAttribute('data-i18n');
        if (textKey) {
            el.textContent = t(textKey, null, targetLang);
        }

        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            el.placeholder = t(placeholderKey, null, targetLang);
        }

        const titleKey = el.getAttribute('data-i18n-title');
        if (titleKey) {
            el.title = t(titleKey, null, targetLang);
        }

        const ariaKey = el.getAttribute('data-i18n-aria');
        if (ariaKey && typeof el.setAttribute === 'function') {
            el.setAttribute('aria-label', t(ariaKey, null, targetLang));
        }
    }

    // Translate root element itself if it contains attributes
    translateElement(root);

    // Translate all descendants with data-i18n*
    if (typeof root.querySelectorAll === 'function') {
        const elements = root.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria]');
        elements.forEach(translateElement);
    }
}

// Initial detection
currentLanguage = detectBrowserLanguage();

// Bind to window for browser context
function _bindWindow(win) {
    if (!win) return;
    const i18nObj = {
        I18N_DICTIONARIES,
        t,
        detectBrowserLanguage,
        getLanguage,
        setLanguage,
        initLanguage,
        applyI18n,
        _bindWindow
    };
    win.i18n = i18nObj;
    win.t = t;
}

const globalScope = typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined'
        ? self
        : (typeof globalThis !== 'undefined' ? globalThis : null));

if (globalScope) {
    _bindWindow(globalScope);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        I18N_DICTIONARIES,
        t,
        detectBrowserLanguage,
        getLanguage,
        setLanguage,
        initLanguage,
        applyI18n,
        _bindWindow
    };
}
