function getStatusBadgeText(status) {
    switch (status) {
        case 'doing':
            return (typeof t === 'function') ? t('statusDoing') : 'Đang làm';
        case 'done':
            return (typeof t === 'function') ? t('statusDone') : 'Hoàn thành';
        case 'carryOver':
            return (typeof t === 'function') ? t('statusCarryOver') : 'Tồn đọng';
        default:
            return status;
    }
}

function createEstimateVarianceCell(item) {
    const cell = document.createElement('td');
    cell.className = item.isMR ? 'col-mr-time text-center' : 'text-center';
    const variance = getItemEstimateVariance(item);
    cell.textContent = variance === null ? '—' : `${variance > 0 ? '+' : ''}${variance.toFixed(2)}h`;
    cell.title = variance === null ? _tr('tableDiffPending') : _tr('tableDiffTooltip', {
        spent: getItemSpentInRange(item), estimate: item.estimate
    });
    if (variance !== null) cell.classList.add(variance > 0 ? 'text-danger' : 'text-success');
    return cell;
}

function _tr(key, params = {}, fallback = '') {
    if (typeof t === 'function') {
        const res = t(key, params);
        if (res !== key) return res;
    }
    if (typeof window !== 'undefined' && typeof window.t === 'function') {
        const res = window.t(key, params);
        if (res !== key) return res;
    }
    if (typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
        const res = i18n.t(key, params);
        if (res !== key) return res;
    }
    if (typeof require === 'function') {
        try {
            const i18nModule = require('../i18n.js');
            if (i18nModule && typeof i18nModule.t === 'function') {
                const res = i18nModule.t(key, params);
                if (res !== key) return res;
            }
        } catch (e) {
            try {
                const i18nModule = require('./i18n.js');
                if (i18nModule && typeof i18nModule.t === 'function') {
                    const res = i18nModule.t(key, params);
                    if (res !== key) return res;
                }
            } catch (e2) {}
        }
    }
    return fallback || key;
}

async function getDashboardItems() {
    if (typeof KpiSync !== 'undefined') {
        const data = await chrome.storage.local.get(['KpiInfo', 'UserProfile', 'gitlabServerUrl', 'gitlabUrl']);
        return KpiSync.visibleItems(data);
    }
    return typeof getStoredIds === 'function' ? (await getStoredIds('KpiInfo') || []) : [];
}

async function getDashboardTrackedItems(key) {
    const data = await chrome.storage.local.get([key, 'UserProfile', 'gitlabServerUrl', 'gitlabUrl']);
    return (data[key] || []).filter(item => KpiSync.belongsToSource(item, data));
}

if (typeof isItemLate === 'undefined' && typeof require === 'function') {
    try {
        const _utils = require('../utils.js');
        if (_utils && typeof _utils.isItemLate === 'function') {
            globalThis.isItemLate = _utils.isItemLate;
            globalThis.getItemProgressStatus = _utils.getItemProgressStatus;
        }
    } catch (e) {
        try {
            const _utils = require('./utils.js');
            if (_utils && typeof _utils.isItemLate === 'function') {
                globalThis.isItemLate = _utils.isItemLate;
                globalThis.getItemProgressStatus = _utils.getItemProgressStatus;
            }
        } catch (e2) {}
    }
}

function isWidosoftGitlab(url) {
    if (!url || typeof url !== 'string') return false;
    return url.toLowerCase().includes('gitlab.widosoft');
}

function updateExportButtonsVisibility(serverUrl) {
    if (typeof document === 'undefined') return;
    const isWido = isWidosoftGitlab(serverUrl);
    const exportMonthBtn = document.getElementById('exportMonthKpiBtn');
    if (exportMonthBtn) {
        exportMonthBtn.style.display = isWido ? '' : 'none';
    }
}

if (typeof document !== 'undefined') {
(async () => {
    console.log('Loading page.js');
    if (typeof initLanguage === 'function') {
        const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
        await initLanguage(storageLocal);
    }
    if (typeof applyI18n === 'function') {
        applyI18n(document);
    }

    let gitlabServerUrl = 'https://gitlab.com';
    if (typeof getGitlabServerUrl === 'function') {
        try {
            gitlabServerUrl = await getGitlabServerUrl();
        } catch (e) {
            gitlabServerUrl = 'https://gitlab.com';
        }
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
            const storedUrl = await chrome.storage.local.get(['gitlabServerUrl']);
            if (storedUrl && storedUrl.gitlabServerUrl) {
                gitlabServerUrl = (typeof sanitizeGitlabUrl === 'function')
                    ? sanitizeGitlabUrl(storedUrl.gitlabServerUrl)
                    : storedUrl.gitlabServerUrl;
            }
        } catch (e) {}
    }

    updateExportButtonsVisibility(gitlabServerUrl);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName === 'local' && changes.appLanguage) {
                const newLang = changes.appLanguage.newValue;
                if (typeof setLanguage === 'function') {
                    setLanguage(newLang);
                }
                if (typeof applyI18n === 'function') {
                    applyI18n(document);
                }
                if (typeof populateMonthOptions === 'function') {
                    await populateMonthOptions();
                }
                if (typeof updateTimeFilterOptions === 'function') {
                    updateTimeFilterOptions();
                }
                if (typeof updateControlsSummary === 'function') {
                    updateControlsSummary();
                }
                if (typeof updateAnalyticsMonthBadge === 'function') {
                    updateAnalyticsMonthBadge(monthSelect ? monthSelect.value : null);
                }
                if (typeof applyFilter === 'function') {
                    await applyFilter();
                }
                const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
                if (tabAnalyticsBtn && tabAnalyticsBtn.classList.contains('active') && typeof refreshMonthlyAnalytics === 'function') {
                    await refreshMonthlyAnalytics();
                }
            }
            if (areaName === 'local' && changes.KpiLeaveDays) await applyFilter();
            if (areaName === 'local' && changes.gitlabServerUrl) {
                gitlabServerUrl = (typeof sanitizeGitlabUrl === 'function')
                    ? sanitizeGitlabUrl(changes.gitlabServerUrl.newValue)
                    : (changes.gitlabServerUrl.newValue || 'https://gitlab.com');
                updateExportButtonsVisibility(gitlabServerUrl);
            }
        });
    }
    let today = new Date();

    const toIsoDate = dateStr => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let allTaskInfo = [];
    let allDailyTaskInfo = [];
    let monthLeaveDays = {};

    let allMergeRequestInfo = [];

    const WORK_ITEM_KEY = 'WorkItemIds';
    const MERGE_ITEM_KEY = 'MergeItemIds';

    const monthSelect = document.getElementById('monthSelect');
    const timeFilterSelect = document.getElementById('timeFilterSelect');
    const customRangeCard = document.getElementById('customRangeCard');
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const applyRangeBtn = document.getElementById('applyRangeBtn');

    let currentPage = 1;
    let pageSize = 25;
    let groupSortStates = {};
    let currentMRSort = { column: null, direction: null };

    let currentSearchQuery = '';
    let currentQuickFilter = 'all';
    let currentFilteredUrls = [];
    let isControlsCollapsed = true;
    let isHealthCollapsed = true;

    const kpiSearchInput = document.getElementById('kpiSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchResultCount = document.getElementById('searchResultCount');
    const filterChips = document.querySelectorAll('.filter-chip');
    const openFilteredTabsBtn = document.getElementById('openFilteredTabsBtn');
    const openTabsCountBadge = document.getElementById('openTabsCountBadge');

    const toggleControlsBtn = document.getElementById('toggleControlsBtn');
    const controlsBody = document.getElementById('controlsBody');
    const controlsCollapseArrow = document.getElementById('controlsCollapseArrow');
    const controlsActiveSummary = document.getElementById('controlsActiveSummary');

    function updateControlsSummary() {
        if (!controlsActiveSummary) return;
        const _tr = (typeof t === 'function' ? t : (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t : (k => k)));
        const filterText = currentQuickFilter !== 'all' ? getFilterLabel(currentQuickFilter) : '';
        const searchText = currentSearchQuery ? `"${currentSearchQuery}"` : '';

        const filterPrefix = _tr('filterSummaryPrefix');
        const searchPrefix = _tr('searchSummaryPrefix');

        if (filterText && searchText) {
            controlsActiveSummary.textContent = `${filterPrefix} ${filterText} • ${searchText}`;
            controlsActiveSummary.style.display = 'inline-flex';
        } else if (filterText) {
            controlsActiveSummary.textContent = `${filterPrefix} ${filterText}`;
            controlsActiveSummary.style.display = 'inline-flex';
        } else if (searchText) {
            controlsActiveSummary.textContent = `${searchPrefix} ${searchText}`;
            controlsActiveSummary.style.display = 'inline-flex';
        } else {
            controlsActiveSummary.style.display = 'none';
        }
    }

    function updateControlsCollapsed(collapsed) {
        isControlsCollapsed = collapsed;
        setControlsCollapsed(collapsed, { controlsBody, controlsCollapseArrow });
    }

    if (toggleControlsBtn) {
        toggleControlsBtn.addEventListener('click', () => {
            updateControlsCollapsed(!isControlsCollapsed);
        });
    }

    async function populateMonthOptions() {
        today = new Date();
        const storedTasksForMonths = await getStoredIds(WORK_ITEM_KEY);
        const storedMRsForMonths = await getStoredIds(MERGE_ITEM_KEY);
        const storedKpiForMonths = await getDashboardItems();

        const activeLang = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
        const availableMonths = getAvailableMonths(storedTasksForMonths, storedMRsForMonths, storedKpiForMonths, activeLang);
        const previousVal = monthSelect.value;
        const currentMonthIso = parseToIsoDate(today).slice(0, 7);

        monthSelect.innerHTML = '';
        availableMonths.forEach(m => {
            const option = document.createElement('option');
            option.value = m.value;
            option.textContent = m.label;
            monthSelect.appendChild(option);
        });

        if (previousVal && Array.from(monthSelect.options).some(o => o.value === previousVal)) {
            monthSelect.value = previousVal;
        } else {
            monthSelect.value = currentMonthIso;
        }
    }

    await populateMonthOptions();
    initTabs();
    updateAnalyticsMonthBadge(monthSelect.value);

    function updateTimeFilterOptions() {
        const _tr = (typeof t === 'function' ? t : (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t : (k => k)));
        const activeLang = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
        const isEn = activeLang === 'en';
        const previousVal = timeFilterSelect.value;
        timeFilterSelect.innerHTML = '';
        const selectedMonth = monthSelect.value;
        const [selYear, selMonth] = selectedMonth.split('-').map(Number);
        const currentMonthVal = parseToIsoDate(today).slice(0, 7);
        const isCurrentMonth = (selectedMonth === currentMonthVal);

        // Group 1: Phạm vi chính
        const mainGroup = document.createElement('optgroup');
        mainGroup.label = _tr('filterScopeMain');

        if (isCurrentMonth) {
            const cw = getCurrentWeekRange(today, activeLang);
            const curWeekOpt = document.createElement('option');
            curWeekOpt.value = 'current_week';
            curWeekOpt.textContent = cw.label;
            mainGroup.appendChild(curWeekOpt);
        }

        const allMonthOpt = document.createElement('option');
        allMonthOpt.value = 'all_month';
        allMonthOpt.textContent = _tr('filterScopeAllMonth', { month: String(selMonth).padStart(2, '0'), year: selYear });
        mainGroup.appendChild(allMonthOpt);

        const customRangeOpt = document.createElement('option');
        customRangeOpt.value = 'custom_range';
        customRangeOpt.textContent = _tr('filterScopeCustomRange');
        mainGroup.appendChild(customRangeOpt);

        timeFilterSelect.appendChild(mainGroup);

        // Group 2: Các tuần trong tháng
        const weeksGroup = document.createElement('optgroup');
        weeksGroup.label = _tr('filterWeeksInMonth');
        const weeks = getWeeksOfMonth(selYear, selMonth, activeLang);
        weeks.forEach(w => {
            const opt = document.createElement('option');
            opt.value = `week:${w.start}:${w.end}`;
            opt.textContent = w.label;
            weeksGroup.appendChild(opt);
        });
        timeFilterSelect.appendChild(weeksGroup);

        // Group 3: Các ngày trong tháng
        const daysGroup = document.createElement('optgroup');
        daysGroup.label = _tr('filterSpecificDays');
        const lastDayOfMonth = new Date(selYear, selMonth, 0).getDate();
        const todayIso = parseToIsoDate(today);

        const dateLocale = isEn ? 'en-US' : 'vi-VN';
        const todaySuffix = _tr('todaySuffix');
        for (let d = 1; d <= lastDayOfMonth; d++) {
            const dateObj = new Date(selYear, selMonth - 1, d);
            const dayIso = parseToIsoDate(dateObj);
            const isToday = (dayIso === todayIso);
            const dayName = dateObj.toLocaleDateString(dateLocale, { weekday: 'short', day: '2-digit', month: '2-digit' });
            const opt = document.createElement('option');
            opt.value = `day:${dayIso}`;
            opt.textContent = `${dayName}${isToday ? todaySuffix : ''}`;
            daysGroup.appendChild(opt);
        }
        timeFilterSelect.appendChild(daysGroup);

        // Default or restore
        if (previousVal && Array.from(timeFilterSelect.options).some(o => o.value === previousVal)) {
            timeFilterSelect.value = previousVal;
        } else {
            timeFilterSelect.value = 'all_month';
        }

        if (customRangeCard) {
            customRangeCard.style.display = timeFilterSelect.value === 'custom_range' ? 'block' : 'none';
        }

        if (startDateInput && !startDateInput.value) {
            startDateInput.value = `${selYear}-${String(selMonth).padStart(2, '0')}-01`;
        }
        if (endDateInput && !endDateInput.value) {
            endDateInput.value = parseToIsoDate(today);
        }
    }

    updateTimeFilterOptions();

    if (openFilteredTabsBtn) {
        openFilteredTabsBtn.addEventListener('click', () => {
            if (!currentFilteredUrls || currentFilteredUrls.length === 0) {
                alert(_tr('alertNoFilteredUrlsToOpen', {}, 'Không có công việc nào trong danh sách đang lọc để mở.'));
                return;
            }

            const count = currentFilteredUrls.length;
            if (count > 5) {
                const confirmed = confirm(_tr('confirmOpenMultipleTabs', { count }, `Bạn có muốn mở đồng thời ${count} tab công việc trên trình duyệt không?`));
                if (!confirmed) return;
            }

            currentFilteredUrls.forEach(url => {
                window.open(url, '_blank');
            });
        });
    }

    if (kpiSearchInput) {
        let searchDebounceTimer = null;
        kpiSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            const val = e.target.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = val ? 'inline-flex' : 'none';
            }
            searchDebounceTimer = setTimeout(async () => {
                currentSearchQuery = val;
                currentPage = 1;
                updateControlsSummary();
                await applyFilter();
            }, 150);
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', async () => {
            if (kpiSearchInput) {
                kpiSearchInput.value = '';
            }
            clearSearchBtn.style.display = 'none';
            currentSearchQuery = '';
            currentPage = 1;
            updateControlsSummary();
            await applyFilter();
        });
    }

    if (filterChips) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', async () => {
                const filterKey = chip.getAttribute('data-filter') || 'all';
                currentQuickFilter = filterKey;
                currentPage = 1;

                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                updateControlsSummary();
                await applyFilter();
            });
        });
    }

    function isItemOpen(item) {
        return !!item && !isItemClosed(item);
    }

    function getFilterLabel(key) {
        const _tr = (typeof t === 'function' ? t : (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t : (k => k)));
        switch (key) {
            case 'mr': return '🚀 Merge Requests';
            case 'late': return _tr('chipLate');
            case 'missing_time': return _tr('chipMissingTime');
            case 'missing_date': return _tr('chipMissingDate');
            case 'reopen': return _tr('chipReopen');
            case 'unplanned': return _tr('chipUnplanned');
            case 'open': return _tr('chipOpen');
            default: return _tr('filterAll');
        }
    }

    function setQuickFilter(filterKey) {
        currentQuickFilter = filterKey;
        currentPage = 1;
        if (filterChips) {
            filterChips.forEach(c => {
                if (c.getAttribute('data-filter') === filterKey) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });
        }
        updateControlsSummary();
        updateControlsCollapsed(false); // Mở rộng thanh điều khiển để người dùng thấy rõ filter đang active
    }

    function updateChipCounts(items) {
        const counts = {
            all: (items || []).length,
            mr: 0,
            late: 0,
            missing_time: 0,
            missing_date: 0,
            reopen: 0,
            unplanned: 0,
            open: 0
        };

        (items || []).forEach(it => {
            if (it.isMR) {
                counts.mr++;
                return;
            }

            const isLate = (typeof isItemLate === 'function') ? isItemLate(it) : (it.progress === 'Trễ hạn' || it.isLate === true);
            if (isLate) counts.late++;
            if (!it.estimate || Number(it.estimate) === 0 || !it.spent || Number(it.spent) === 0) counts.missing_time++;
            if (!it.startDate || !it.dueDate) counts.missing_date++;
            if ((it.reopenTotal || 0) > 0) counts.reopen++;
            if (it.type === 'Phát sinh') counts.unplanned++;
            if (isItemOpen(it)) counts.open++;
        });

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setVal('chipCountAll', counts.all);
        setVal('chipCountMR', counts.mr);
        setVal('chipCountLate', counts.late);
        setVal('chipCountMissingTime', counts.missing_time);
        setVal('chipCountMissingDate', counts.missing_date);
        setVal('chipCountReopen', counts.reopen);
        setVal('chipCountUnplanned', counts.unplanned);
        setVal('chipCountOpen', counts.open);
    }

    function calculateKpiScore(stats) {
        const result = calculateKpiScoreForStats(stats);
        const key = !stats?.totalTask ? 'kpiBadgeNoData'
            : result.totalScore >= 4.5 ? 'kpiBadgeExcellent'
            : result.totalScore >= 3.8 ? 'kpiBadgeGood'
            : result.totalScore >= 3 ? 'kpiBadgeFair' : 'kpiBadgeAttention';
        return { ...result, badge: { ...result.badge, text: _tr(key, {}, result.badge.text) } };
    }

    function renderKpiHealthCard(periodStats, periodLabel, baseItemsCount) {
        const container = document.getElementById('kpiHealthContainer');
        if (!container) return;

        if (!baseItemsCount || baseItemsCount === 0) {
            container.innerHTML = '';
            return;
        }

        const scoreInfo = calculateKpiScore(periodStats);
        const spentVal = parseFloat(periodStats.totalSpent) || 0;
        const targetHours = periodStats.workingHours ?? 0;
        const spentPercent = targetHours > 0 ? (spentVal / targetHours) * 100 : 0;

        let hoursBarClass = 'bar-red';
        if (spentPercent >= 90) hoursBarClass = 'bar-green';
        else if (spentPercent >= 75) hoursBarClass = 'bar-blue';
        else if (spentPercent >= 50) hoursBarClass = 'bar-amber';

        const _tr = (typeof t === 'function' ? t : (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t : (k => k)));
        // Build actionable checklist items
        const alerts = [];

        if (periodStats.totalTaskLate > 0) {
            alerts.push({
                type: 'danger',
                filter: 'late',
                text: _tr('kpiLateAlert', { count: periodStats.totalTaskLate, rate: periodStats.lateRate }),
                actionText: _tr('viewErrorsAction')
            });
        } else {
            alerts.push({
                type: 'success',
                text: _tr('allInTimeAlert')
            });
        }

        const missingEstCount = periodStats.totalTaskNoEstimate || 0;
        const missingSpentCount = periodStats.totalTaskNoSpent || 0;
        if (missingEstCount > 0 || missingSpentCount > 0) {
            alerts.push({
                type: 'warning',
                filter: 'missing_time',
                text: _tr('missingTimeAlert', { est: missingEstCount, spent: missingSpentCount }),
                actionText: _tr('viewErrorsAction')
            });
        } else {
            alerts.push({
                type: 'success',
                text: _tr('allTimeProvidedAlert')
            });
        }

        const missingDateCount = Math.max(periodStats.totalTaskNoStartDate || 0, periodStats.totalTaskNoDueDate || 0);
        if (missingDateCount > 0) {
            alerts.push({
                type: 'warning',
                filter: 'missing_date',
                text: _tr('missingDateAlert', { count: missingDateCount }),
                actionText: _tr('viewErrorsAction')
            });
        }

        if (periodStats.totalTaskReopen > 0) {
            alerts.push({
                type: 'info',
                filter: 'reopen',
                text: _tr('reopenAlert', { count: periodStats.totalTaskReopen, rate: periodStats.reopenRate }),
                actionText: _tr('viewErrorsAction')
            });
        }

        const alertsHtml = alerts.map(a => {
            const isClickable = Boolean(a.filter);
            return `
                <div class="health-alert-item alert-${a.type} ${isClickable ? 'clickable' : ''}" ${isClickable ? `data-alert-filter="${a.filter}"` : ''} title="${isClickable ? _tr('clickToFilterAlertTitle') : ''}">
                    <span>${a.text}</span>
                    ${isClickable ? `<span class="alert-action-pill">${a.actionText}</span>` : ''}
                </div>
            `;
        }).join('');

        const isExpanded = !isHealthCollapsed;
        container.innerHTML = `
            <div class="kpi-health-card">
                <div class="kpi-health-header ${isExpanded ? 'expanded' : ''}" id="toggleHealthBtn" role="button" tabindex="0" title="${_tr('toggleHealthBtnTitle', {}, 'Bấm để mở rộng / thu gọn chi tiết dự báo KPI')}">
                    <div class="kpi-health-title">
                        <span class="health-icon">🎯</span>
                        <div class="health-title-text">
                            <h3>${_tr('kpiHealthForecastTitle')}</h3>
                            <span>${_tr('evaluationPeriod')}: <strong>${periodLabel}</strong></span>
                        </div>
                    </div>
                    <div class="kpi-health-header-right">
                        <div class="kpi-health-badge ${scoreInfo.badge.class}">
                            ${scoreInfo.badge.icon} ${scoreInfo.badge.text} (${scoreInfo.totalScore} / 5.0)
                        </div>
                        <span class="collapse-arrow health-collapse-arrow">${isExpanded ? '▲' : '▼'}</span>
                    </div>
                </div>

                <div class="kpi-health-body" id="kpiHealthBody" style="${isExpanded ? 'display: block;' : 'display: none;'}">
                    <div class="kpi-health-grid">
                        <!-- Col 1: Điểm dự báo -->
                        <div class="health-card-item">
                            <div class="score-header-label">${_tr('kpiForecastScale')}</div>
                            <div class="big-score-display">
                                <span class="big-score">${scoreInfo.totalScore}</span>
                                <span class="score-scale">/ 5.0</span>
                            </div>
                            <div class="score-pills">
                                <div class="score-pill" title="${_tr('attitudeTooltip', {}, 'Thái độ (Estimate, Spent, Ngày tháng): Hệ số 1.0')}">
                                    <span class="pill-label">${_tr('attitudeScore')}</span>
                                    <span class="pill-val">${scoreInfo.attitudeScore}/5</span>
                                </div>
                                <div class="score-pill" title="${_tr('volumeTooltip', {}, 'Khối lượng (Giờ làm việc): Hệ số 3.0')}">
                                    <span class="pill-label">${_tr('volumeScore')}</span>
                                    <span class="pill-val">${scoreInfo.volumeScore}/5</span>
                                </div>
                                <div class="score-pill" title="${_tr('qualityTooltip', {}, 'Chất lượng (Đúng hạn & Reopen): Hệ số 6.0')}">
                                    <span class="pill-label">${_tr('qualityScore')}</span>
                                    <span class="pill-val">${scoreInfo.qualityScore}/5</span>
                                </div>
                            </div>
                        </div>

                        <!-- Col 2: Tiến độ giờ làm việc -->
                        <div class="health-card-item">
                            <div class="hours-meta-top">
                                <span class="hours-title">${_tr('hoursProgressTitle', {}, '⌛ Tiến độ giờ làm việc')}</span>
                                <span class="hours-numbers"><strong>${periodStats.totalSpent}h</strong> / ${targetHours}h</span>
                            </div>
                            <div class="hours-track">
                                <div class="hours-bar ${hoursBarClass}" style="width: ${Math.min(100, spentPercent)}%;"></div>
                            </div>
                            <div class="hours-meta-bottom">
                                <span>${_tr('reachPrefix', {}, 'Đạt')} <strong>${spentPercent.toFixed(1)}%</strong> ${_tr('hoursStandardTarget', {}, 'tiêu chuẩn')}</span>
                                <span>${_tr('hoursPlanned', {}, 'Kế hoạch:')} ${periodStats.totalSpentPlannedTask}h • ${_tr('hoursUnplanned', {}, 'Phát sinh:')} ${periodStats.totalSpentUnplannedTask}h</span>
                            </div>
                        </div>

                        <!-- Col 3: Cảnh báo & Đề xuất xử lý -->
                        <div class="health-card-item">
                            <div class="alerts-title">${_tr('healthAlertsTitle', {}, '🛡️ Sức khỏe KPI & Lối tắt xử lý')}</div>
                            <div class="health-alerts-list">
                                ${alertsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const toggleHealthBtn = container.querySelector('#toggleHealthBtn');
        const healthBody = container.querySelector('#kpiHealthBody');
        const healthArrow = container.querySelector('.health-collapse-arrow');

        if (toggleHealthBtn) {
            toggleHealthBtn.addEventListener('click', () => {
                isHealthCollapsed = !isHealthCollapsed;
                if (healthBody) healthBody.style.display = isHealthCollapsed ? 'none' : 'block';
                if (healthArrow) healthArrow.textContent = isHealthCollapsed ? '▼' : '▲';
                toggleHealthBtn.classList.toggle('expanded', !isHealthCollapsed);
            });
        }

        container.querySelectorAll('.health-alert-item.clickable').forEach(item => {
            item.addEventListener('click', async () => {
                const targetFilter = item.getAttribute('data-alert-filter');
                if (targetFilter) {
                    setQuickFilter(targetFilter);
                    await applyFilter();
                    const kpiTable = document.getElementById('kpiContainer');
                    if (kpiTable) {
                        kpiTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    async function applyFilter() {
        today = new Date();
        const items = await getDashboardItems();
        document.getElementById('kpiContainer').innerHTML = '';
        await renderKpi(items || []);
        return items.length > 0;
    }

    monthSelect.addEventListener('change', async () => {
        currentPage = 1;
        updateTimeFilterOptions();
        updateAnalyticsMonthBadge(monthSelect.value);
        const hasData = await applyFilter();
        const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
        // renderKpi called inside applyFilter already synchronizes Tab 2 via refreshMonthlyAnalytics.
        // Only trigger an empty-state refresh if there was no stored KPI data to process.
        if (!hasData && tabAnalyticsBtn && tabAnalyticsBtn.classList.contains('active')) {
            await refreshMonthlyAnalytics(monthSelect.value, []);
        }
    });

    timeFilterSelect.addEventListener('change', async () => {
        currentPage = 1;
        if (timeFilterSelect.value === 'custom_range') {
            if (customRangeCard) customRangeCard.style.display = 'block';
            await applyFilter();
        } else {
            if (customRangeCard) customRangeCard.style.display = 'none';
            await applyFilter();
        }
    });

    if (applyRangeBtn) {
        applyRangeBtn.addEventListener('click', async () => {
            if (!startDateInput.value || !endDateInput.value) {
                alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc!');
                return;
            }
            if (startDateInput.value > endDateInput.value) {
                alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
                return;
            }
            currentPage = 1;
            await applyFilter();
        });
    }

    // Khởi tạo trang: kiểm tra dữ liệu và render KPI nếu đã có

    await applyFilter();

    if (typeof KpiSync !== 'undefined') {
        let refreshTimer;
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !['KpiInfo', 'UserProfile', 'gitlabServerUrl'].some(key => changes[key])) return;
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(async () => {
                await populateMonthOptions();
                updateTimeFilterOptions();
                await applyFilter();
                updateAnalyticsMonthBadge(monthSelect.value);
            }, 50);
        });
        await KpiSync.mountUI();
    }

    async function deleteKpiItems(itemsToDelete, confirmMsg = null) {
        if (!itemsToDelete || itemsToDelete.length === 0) {
            alert(_tr('alertNoItemsToDelete', {}, 'Không có công việc nào để xóa.'));
            return;
        }

        if (confirmMsg) {
            const confirmed = confirm(confirmMsg);
            if (!confirmed) return;
        }

        const isMr = item => item.isMR || /merge_requests\//.test(item.href || item.taskUrl || '');
        const tasks = itemsToDelete.filter(item => !isMr(item));
        const mrs = itemsToDelete.filter(isMr);
        if (tasks.length) await KpiSync.updateTrackedItems(WORK_ITEM_KEY, [], tasks);
        if (mrs.length) await KpiSync.updateTrackedItems(MERGE_ITEM_KEY, [], mrs);

        currentPage = 1;
        await applyFilter();
    }

    async function deleteKpiItem(itemToDelete) {
        const itemLabel = itemToDelete.title || itemToDelete.taskUrl;
        const typeLabel = itemToDelete.isMR ? 'Merge Request' : 'Task';
        const msg = _tr('confirmDeleteItem', { type: typeLabel, label: itemLabel }, `Bạn có chắc muốn xóa ${typeLabel} "${itemLabel}" khỏi danh sách?`);
        await deleteKpiItems([itemToDelete], msg);
    }

    async function deleteWeekItems(wb) {
        if (!wb || !wb.items || wb.items.length === 0) {
            alert(_tr('alertNoTasksInWeekToDelete', {}, 'Không có công việc nào trong tuần này để xóa.'));
            return;
        }
        const cleanTitle = wb.title.replace(/^📦\s*/, '');
        const count = wb.items.length;
        const msg = _tr('confirmDeleteWeekItems', { count, title: cleanTitle }, `Bạn có chắc muốn xóa toàn bộ ${count} công việc (bao gồm cả Task và Merge Request) trong "${cleanTitle}"?`);
        await deleteKpiItems(wb.items, msg);
    }

    async function deleteByDateRange(startIso, endIso, confirmMsg = null) {
        const storedTasks = await getDashboardTrackedItems(WORK_ITEM_KEY);
        const storedMRs = await getDashboardTrackedItems(MERGE_ITEM_KEY);
        const storedKpi = await getDashboardItems();

        const inRange = (dStr) => isDateInWeek(dStr, startIso, endIso);

        const tasksToDelete = (storedTasks || []).filter(item => inRange(item.createAt || item.addedAt));
        const mrsToDelete = (storedMRs || []).filter(item => inRange(item.createAt || item.addedAt));
        const kpiToDelete = (storedKpi || []).filter(item => inRange(item.addedAt || item.createAt));

        const totalCount = Math.max(tasksToDelete.length + mrsToDelete.length, kpiToDelete.length);
        if (totalCount === 0) {
            alert(_tr('alertNoItemsInRangeToDelete', {}, 'Không có công việc hoặc Merge Request nào trong khoảng thời gian này để xóa.'));
            return;
        }

        if (confirmMsg) {
            const confirmed = confirm(confirmMsg);
            if (!confirmed) return;
        }

        const itemsToDeleteList = [...tasksToDelete, ...mrsToDelete, ...kpiToDelete];
        await deleteKpiItems(itemsToDeleteList);
    }

    async function deleteByMonth(monthIso, confirmMsg = null) {
        const storedTasks = await getDashboardTrackedItems(WORK_ITEM_KEY);
        const storedMRs = await getDashboardTrackedItems(MERGE_ITEM_KEY);
        const storedKpi = await getDashboardItems();

        const inMonth = (dStr) => {
            const iso = parseToIsoDate(dStr);
            return iso && iso.startsWith(monthIso);
        };

        const tasksToDelete = (storedTasks || []).filter(item => inMonth(item.createAt || item.addedAt));
        const mrsToDelete = (storedMRs || []).filter(item => inMonth(item.createAt || item.addedAt));
        const kpiToDelete = (storedKpi || []).filter(item => inMonth(item.addedAt || item.createAt));

        const totalCount = Math.max(tasksToDelete.length + mrsToDelete.length, kpiToDelete.length);
        if (totalCount === 0) {
            alert(_tr('alertNoTasksInMonthToDeleteGeneral', {}, 'Không có công việc hoặc Merge Request nào trong tháng này để xóa.'));
            return;
        }

        if (confirmMsg) {
            const confirmed = confirm(confirmMsg);
            if (!confirmed) return;
        }

        const itemsToDeleteList = [...tasksToDelete, ...mrsToDelete, ...kpiToDelete];
        await deleteKpiItems(itemsToDeleteList);
    }

    const deleteWeekBtn = document.getElementById('deleteWeekBtn');
    if (deleteWeekBtn) {
        deleteWeekBtn.addEventListener('click', async () => {
            const selectedMonth = monthSelect.value;
            const filterVal = timeFilterSelect.value;
            const [selYear, selMonth] = selectedMonth.split('-').map(Number);
            const monthWeeks = getWeeksOfMonth(selYear, selMonth);

            let targetStart = null;
            let targetEnd = null;
            let targetLabel = '';

            if (filterVal === 'current_week') {
                const cw = getCurrentWeekRange();
                targetStart = cw.start;
                targetEnd = cw.end;
                targetLabel = cw.label;
            } else if (filterVal.startsWith('week:')) {
                const parts = filterVal.split(':');
                targetStart = parts[1];
                targetEnd = parts[2];
                const found = monthWeeks.find(w => w.start === targetStart && w.end === targetEnd);
                const weekPrefix = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en') ? 'Week' : 'Tuần';
                targetLabel = found ? found.label : `${weekPrefix} (${formatDate(targetStart)} - ${formatDate(targetEnd)})`;
            } else if (filterVal.startsWith('day:')) {
                const dayIso = filterVal.replace('day:', '');
                targetStart = dayIso;
                targetEnd = dayIso;
                const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en');
                targetLabel = (isEn ? 'Day ' : 'Ngày ') + formatDate(dayIso);
            } else if (filterVal === 'custom_range') {
                targetStart = startDateInput?.value;
                targetEnd = endDateInput?.value;
                if (!targetStart || !targetEnd) {
                    alert(_tr('customRangePrompt', {}, 'Vui lòng chọn ngày bắt đầu và kết thúc ở bộ lọc khoảng ngày.'));
                    return;
                }
                targetLabel = `${_tr('dateRangePrefix', {}, 'Khoảng ngày')} ${formatDate(targetStart)} - ${formatDate(targetEnd)}`;
            } else if (filterVal === 'all_month') {
                const storedKpi = await getDashboardItems();
                const monthItems = (storedKpi || []).filter(item => matchesFilter(item.addedAt, 'all_month', selectedMonth, '', ''));
                const activeWeeks = monthWeeks.filter(w => monthItems.some(item => isDateInWeek(item.addedAt, w.start, w.end)));

                if (activeWeeks.length === 0) {
                    alert(_tr('alertNoTasksInMonthToDelete', { month: `${String(selMonth).padStart(2, '0')}/${selYear}` }, `Tháng ${String(selMonth).padStart(2, '0')}/${selYear} không có công việc nào để xóa.`));
                    return;
                }

                if (activeWeeks.length === 1) {
                    targetStart = activeWeeks[0].start;
                    targetEnd = activeWeeks[0].end;
                    targetLabel = activeWeeks[0].label;
                } else {
                    let promptText = _tr('selectWeekToDeletePrompt', { month: `${String(selMonth).padStart(2, '0')}/${selYear}` }, `Chọn tuần trong tháng ${String(selMonth).padStart(2, '0')}/${selYear} bạn muốn xóa:\n\n`);
                    activeWeeks.forEach((w, idx) => {
                        const itemsCount = monthItems.filter(item => isDateInWeek(item.addedAt, w.start, w.end)).length;
                        promptText += `${idx + 1}. ${w.label} (${itemsCount} ${_tr('workItemsUnit', {}, 'công việc')})\n`;
                    });
                    promptText += _tr('enterWeekPrompt', { total: activeWeeks.length }, `\nNhập số thứ tự tuần (1 - ${activeWeeks.length}) hoặc nhấn Hủy:`);
                    const choice = prompt(promptText);
                    if (!choice) return;
                    const chosenIdx = parseInt(choice, 10) - 1;
                    if (chosenIdx >= 0 && chosenIdx < activeWeeks.length) {
                        targetStart = activeWeeks[chosenIdx].start;
                        targetEnd = activeWeeks[chosenIdx].end;
                        targetLabel = activeWeeks[chosenIdx].label;
                    } else {
                        alert(_tr('alertInvalidSelection', {}, 'Lựa chọn không hợp lệ.'));
                        return;
                    }
                }
            }

            if (!targetStart || !targetEnd) {
                alert(_tr('alertUndeterminedWeekRange', {}, 'Không xác định được phạm vi tuần cần xóa.'));
                return;
            }

            const storedTasks = await getStoredIds(WORK_ITEM_KEY);
            const storedMRs = await getStoredIds(MERGE_ITEM_KEY);
            const storedKpi = await getDashboardItems();

            const inRange = (dStr) => isDateInWeek(dStr, targetStart, targetEnd);
            const taskCount = (storedTasks || []).filter(it => inRange(it.createAt || it.addedAt)).length;
            const mrCount = (storedMRs || []).filter(it => inRange(it.createAt || it.addedAt)).length;
            const kpiItems = (storedKpi || []).filter(it => inRange(it.addedAt || it.createAt));

            const totalCount = Math.max(taskCount + mrCount, kpiItems.length);
            if (totalCount === 0) {
                alert(_tr('alertNoItemsInRangeOrMonth', { target: targetLabel }, `Không có công việc hoặc Merge Request nào trong "${targetLabel}" để xóa.`));
                return;
            }

            const msg = _tr('deleteRangeConfirm', { count: totalCount, target: targetLabel }, `Bạn có chắc muốn xóa toàn bộ ${totalCount} công việc (bao gồm cả Task và Merge Request) trong "${targetLabel}"?`);
            await deleteByDateRange(targetStart, targetEnd, msg);
        });
    }

    const deleteMonthBtn = document.getElementById('deleteMonthBtn');
    if (deleteMonthBtn) {
        deleteMonthBtn.addEventListener('click', async () => {
            const selectedMonth = monthSelect.value;
            const [selYear, selMonth] = selectedMonth.split('-').map(Number);
            const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en');
            const monthLabel = (isEn ? 'Month ' : 'Tháng ') + `${String(selMonth).padStart(2, '0')}/${selYear}`;

            const storedTasks = await getStoredIds(WORK_ITEM_KEY);
            const storedMRs = await getStoredIds(MERGE_ITEM_KEY);
            const storedKpi = await getDashboardItems();

            const inMonth = (dStr) => {
                const iso = parseToIsoDate(dStr);
                return iso && iso.startsWith(selectedMonth);
            };

            const taskCount = (storedTasks || []).filter(it => inMonth(it.createAt || it.addedAt)).length;
            const mrCount = (storedMRs || []).filter(it => inMonth(it.createAt || it.addedAt)).length;
            const kpiItems = (storedKpi || []).filter(it => inMonth(it.addedAt || it.createAt));

            const totalCount = Math.max(taskCount + mrCount, kpiItems.length);
            if (totalCount === 0) {
                alert(_tr('alertNoItemsInRangeOrMonth', { target: monthLabel }, `Không có công việc hoặc Merge Request nào trong ${monthLabel} để xóa.`));
                return;
            }

            const msg = _tr('deleteMonthConfirm', { count: totalCount, target: monthLabel }, `⚠️ CẢNH BÁO: Bạn có chắc muốn xóa TOÀN BỘ ${totalCount} công việc (bao gồm cả Task và Merge Request) trong ${monthLabel}?`);
            await deleteByMonth(selectedMonth, msg);
        });
    }

    const exportMonthBtn = document.getElementById('exportMonthKpiBtn');
    if (exportMonthBtn) {
        exportMonthBtn.addEventListener('click', async () => {
            exportMonthBtn.disabled = true;
            exportMonthBtn.textContent = _tr('exportMonthSyncing');
            try { await exportMonthlyKPIExcel(); }
            catch (error) { alert(_tr('alertExportFailed', { error: error.message })); }
            finally {
                exportMonthBtn.disabled = false;
                exportMonthBtn.textContent = _tr('exportMonthKpiBtn');
            }
        });
    }

    document.getElementById('getDailyTaskBtn').addEventListener('click', async () => {
        if (allDailyTaskInfo.length === 0) {
            alert('Chưa thống kê hoặc chưa có task nào trong ngày!!!');
            return;
        }

        // Group task theo groupName
        const groupedTasks = {};

        allDailyTaskInfo.forEach(item => {
            const groupName = cleanGroupName(item.groupName || 'Khác');
            if (!groupedTasks[groupName]) {
                groupedTasks[groupName] = [];
            }
            let rawTitle = item.title ? item.title.trim() : (item.taskUrl ? item.taskUrl.split('/').pop() : 'Task');
            rawTitle = rawTitle.replace(/\s*\((?:Done|\d+%)\)$/i, '').trim();

            const isClosed = Boolean(
                (item.state && ['closed', 'merged'].includes(String(item.state).toLowerCase())) ||
                (item.closeDate && String(item.closeDate).trim() !== '')
            );
            const statusLabel = isClosed ? '(Done)' : '(0%)';
            const formattedLine = `+ ${rawTitle} ${statusLabel}`;

            if (!groupedTasks[groupName].includes(formattedLine)) {
                groupedTasks[groupName].push(formattedLine);
            }
        });

        // Tạo danh sách task đã format
        let taskListStr = '';
        Object.entries(groupedTasks).forEach(([groupName, lines]) => {
            taskListStr += `- [${groupName}]\n`;
            lines.forEach(line => {
                taskListStr += `${line}\n`;
            });
        });

        // Ghép thành định dạng daily theo yêu cầu
        const filterVal = (typeof timeFilterSelect !== 'undefined' && timeFilterSelect) ? timeFilterSelect.value : '';
        const dayIso = (filterVal && filterVal.startsWith('day:')) ? filterVal.replace('day:', '') : (typeof parseToIsoDate === 'function' ? parseToIsoDate(new Date()) : '');
        const reportDate = (typeof formatDate === 'function' ? formatDate(dayIso || new Date()) : new Date().toLocaleDateString('vi-VN'));
        const dailyTask = `Daily report ${reportDate}\nWhat did I do today?\n${taskListStr}What will I do Tomorrow?\n${taskListStr}What problems are hindering my progress?\n- None\n`;

        // copy to clipboard and show alert
        navigator.clipboard.writeText(dailyTask);
        alert('Daily task copied to clipboard');
    });

    const NUMERIC_SORT_COLS = new Set(['estimate', 'spent', 'lifetimeSpent', 'estimateVariance', 'reopenTotal']);

    function getItemSortValue(item, col) {
        if (!item) return '';
        switch (col) {
            case 'tasks': {
                if (!item.taskUrl) return 0;
                const match = item.taskUrl.match(/\/(\d+)$/);
                return match ? parseInt(match[1], 10) : item.taskUrl;
            }
            case 'title':
                return (item.title || '').trim();
            case 'parentTitle':
                return (item.parentTitle || '').trim();
            case 'startDate':
                return parseToIsoDate(item.startDate) || '';
            case 'dueDate':
                return parseToIsoDate(item.dueDate) || '';
            case 'closeDate':
                return parseToIsoDate(item.closeDate) || '';
            case 'estimate':
                return Number(item.estimate) || 0;
            case 'spent':
                return Number(item.spent) || 0;
            case 'lifetimeSpent':
                return getItemSpentInRange(item);
            case 'estimateVariance':
                return getItemEstimateVariance(item);
            case 'reopenTotal':
                return Number(item.reopenTotal) || 0;
            case 'type':
                return (item.type || '').trim();
            case 'progress':
                return (item.progress || '').trim();
            default:
                return '';
        }
    }

    function compareKpiItems(a, b, col, dir) {
        const isNum = NUMERIC_SORT_COLS.has(col);
        const isDate = ['startDate', 'dueDate', 'closeDate'].includes(col);
        const valA = getItemSortValue(a, col);
        const valB = getItemSortValue(b, col);

        if (isDate) {
            if (!valA && !valB) return 0;
            if (!valA) return 1;
            if (!valB) return -1;
            const res = valA.localeCompare(valB);
            return dir === 'desc' ? -res : res;
        }

        if (col === 'estimateVariance') {
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;
        }

        if (isNum) {
            const numA = Number(valA) || 0;
            const numB = Number(valB) || 0;
            return dir === 'desc' ? numB - numA : numA - numB;
        }

        if (col === 'tasks') {
            if (typeof valA === 'number' && typeof valB === 'number') {
                return dir === 'desc' ? valB - valA : valA - valB;
            }
            const sA = String(valA);
            const sB = String(valB);
            const res = sA.localeCompare(sB, 'vi', { numeric: true, sensitivity: 'base' });
            return dir === 'desc' ? -res : res;
        }

        const sA = String(valA || '');
        const sB = String(valB || '');
        if (!sA && !sB) return 0;
        if (!sA) return 1;
        if (!sB) return -1;
        const res = sA.localeCompare(sB, 'vi', { numeric: true, sensitivity: 'base' });
        return dir === 'desc' ? -res : res;
    }

    function sortItems(items, col, dir) {
        if (!col || !dir || !items || items.length <= 1) return items;
        return [...items].sort((a, b) => compareKpiItems(a, b, col, dir));
    }

    async function handleGroupHeaderSort(groupName, colKey) {
        if (!colKey || !groupName) return;
        const isNum = NUMERIC_SORT_COLS.has(colKey);
        if (!groupSortStates[groupName]) {
            groupSortStates[groupName] = { column: null, direction: null };
        }
        const sortState = groupSortStates[groupName];

        if (sortState.column === colKey) {
            if (isNum) {
                if (sortState.direction === 'desc') {
                    sortState.direction = 'asc';
                } else {
                    sortState.column = null;
                    sortState.direction = null;
                }
            } else {
                if (sortState.direction === 'asc') {
                    sortState.direction = 'desc';
                } else {
                    sortState.column = null;
                    sortState.direction = null;
                }
            }
        } else {
            sortState.column = colKey;
            sortState.direction = isNum ? 'desc' : 'asc';
        }

        currentPage = 1;
        await applyFilter();
    }

    async function handleMRHeaderSort(colKey) {
        if (!colKey) return;
        const isNum = NUMERIC_SORT_COLS.has(colKey);

        if (currentMRSort.column === colKey) {
            if (isNum) {
                if (currentMRSort.direction === 'desc') {
                    currentMRSort.direction = 'asc';
                } else {
                    currentMRSort.column = null;
                    currentMRSort.direction = null;
                }
            } else {
                if (currentMRSort.direction === 'asc') {
                    currentMRSort.direction = 'desc';
                } else {
                    currentMRSort.column = null;
                    currentMRSort.direction = null;
                }
            }
        } else {
            currentMRSort.column = colKey;
            currentMRSort.direction = isNum ? 'desc' : 'asc';
        }

        currentPage = 1;
        await applyFilter();
    }

    function calculateStats(data, customFilterVal = null, customMonth = null) {
        return calculateStatsForPeriod(
            data, customFilterVal || timeFilterSelect.value, customMonth,
            startDateInput ? startDateInput.value : '', endDateInput ? endDateInput.value : '', today, monthLeaveDays
        );
    }

    async function renderKpi(kpiData, isSaveKpiStats = false) {
        const container = document.getElementById('kpiContainer');
        const selectedMonth = monthSelect.value;
        const filterVal = timeFilterSelect.value;
        allDailyTaskInfo = [];

        const activeLang = (typeof getLanguage === 'function') ? getLanguage() : 'vi';

        monthLeaveDays = await getLeaveDays();
        const monthItems = kpiData.filter(item => isItemActiveInFilter(item, 'all_month', selectedMonth));
        const monthlyStats = calculateStats(monthItems, 'all_month', selectedMonth);
        if (isSaveKpiStats) await saveKpiStats({ ...monthlyStats, month: selectedMonth });

        // 2. Base data for current period filter (independent of search / chip filters)
        const cStart = startDateInput ? startDateInput.value : '';
        const cEnd = endDateInput ? endDateInput.value : '';
        const periodRange = getPeriodDateRange(filterVal, selectedMonth, cStart, cEnd, today);
        const baseFiltered = kpiData
            .filter(item => isItemActiveInFilter(item, filterVal, selectedMonth, cStart, cEnd))
            .map(item => ({ ...item, lifetimeSpent: getItemSpentInRange(item), spent: getItemSpentInRange(item, periodRange.start, periodRange.end) }));

        // Label for the selected detail period
        const [selYear, selMonth] = selectedMonth.split('-').map(Number);
        let periodLabel = _tr('monthBadgeLabel', { month: String(selMonth).padStart(2, '0'), year: selYear }, `Tháng ${String(selMonth).padStart(2, '0')}/${selYear}`);
        if (filterVal === 'current_week') {
            const cw = getCurrentWeekRange(today, activeLang);
            periodLabel = activeLang === 'en' ? `This week (${cw.label})` : `Tuần này (${cw.label})`;
        } else if (filterVal.startsWith('week:')) {
            const parts = filterVal.split(':');
            periodLabel = (activeLang === 'en' ? 'Week' : 'Tuần') + ` (${formatDate(parts[1])} - ${formatDate(parts[2])})`;
        } else if (filterVal.startsWith('day:')) {
            const dayIso = filterVal.replace('day:', '');
            periodLabel = (activeLang === 'en' ? 'Day ' : 'Ngày ') + formatDate(dayIso);
        } else if (filterVal === 'custom_range') {
            periodLabel = `${formatDate(cStart)} - ${formatDate(cEnd)}`;
        }

        // Update Quick Filter Chip Badges
        updateChipCounts(baseFiltered);

        // Render KPI Health Card (Widget)
        renderKpiHealthCard(monthlyStats, _tr('monthBadgeLabel', { month: String(selMonth).padStart(2, '0'), year: selYear }), monthItems.length);

        // Fill allDailyTaskInfo for the "What did I do today?" button based on selected day or today
        const compareDailyDate = (filterVal.startsWith('day:') ? filterVal.replace('day:', '') : parseToIsoDate(today));
        kpiData.forEach(item => {
            if (isItemActiveInFilter(item, `day:${compareDailyDate}`, selectedMonth)) {
                allDailyTaskInfo.push({ ...item, lifetimeSpent: getItemSpentInRange(item), spent: getItemSpentInRange(item, compareDailyDate, compareDailyDate) });
            }
        });

        // 3. Apply Quick Filter Chip: chỉ áp dụng lọc nhanh với Work Items, hoặc riêng Merge Request
        let filteredData = baseFiltered;
        if (currentQuickFilter !== 'all') {
            filteredData = filteredData.filter(it => {
                if (currentQuickFilter === 'mr') {
                    return !!it.isMR;
                }
                if (it.isMR) return false; // Không áp dụng tiêu chí lọc nhanh cho Merge Request
                if (currentQuickFilter === 'late') {
                    return (typeof isItemLate === 'function') ? isItemLate(it) : (it.progress === 'Trễ hạn' || it.isLate === true);
                }
                if (currentQuickFilter === 'missing_time') {
                    return !it.estimate || Number(it.estimate) === 0 || !it.spent || Number(it.spent) === 0;
                }
                if (currentQuickFilter === 'missing_date') {
                    return !it.startDate || !it.dueDate;
                }
                if (currentQuickFilter === 'reopen') {
                    return (it.reopenTotal || 0) > 0;
                }
                if (currentQuickFilter === 'unplanned') {
                    return it.type === 'Phát sinh';
                }
                if (currentQuickFilter === 'open') {
                    return isItemOpen(it);
                }
                return true;
            });
        }

        // 4. Apply Quick Search Query
        if (currentSearchQuery) {
            const q = currentSearchQuery.toLowerCase();
            filteredData = filteredData.filter(item => {
                const title = (item.title || '').toLowerCase();
                const parentTitle = (item.parentTitle || '').toLowerCase();
                const groupName = (item.groupName || '').toLowerCase();
                const url = (item.taskUrl || '').toLowerCase();
                const type = (item.type || '').toLowerCase();
                const progress = (item.progress || '').toLowerCase();
                const normUrl = (typeof normalizeGitLabUrl === 'function') ? normalizeGitLabUrl(url) : url;
                const iidMatch = normUrl.match(/\/(?:issues|work_items|merge_requests)\/(\d+)$/i) || normUrl.match(/\/(\d+)$/);
                const iid = iidMatch ? iidMatch[1] : '';
                return title.includes(q) ||
                       parentTitle.includes(q) ||
                       groupName.includes(q) ||
                       url.includes(q) ||
                       type.includes(q) ||
                       progress.includes(q) ||
                       (`#${iid}`).includes(q) ||
                       (`!${iid}`).includes(q) ||
                       (iid && iid === q);
            });
        }

        // Update URLs for "Mở các task đang lọc"
        currentFilteredUrls = Array.from(new Set(filteredData.map(it => it.taskUrl).filter(Boolean)));
        if (openTabsCountBadge) {
            openTabsCountBadge.textContent = currentFilteredUrls.length;
        }

        const displayData = filteredData;

        // Keep monthly analytics current even when the detail filters have no matches.
        await refreshMonthlyAnalytics(selectedMonth, kpiData);

        // Check empty states
        if (baseFiltered.length === 0) {
            const emptyNotice = document.createElement("div");
            emptyNotice.className = "report-section";
            emptyNotice.style.textAlign = "center";
            emptyNotice.style.padding = "40px";
            emptyNotice.style.color = "var(--text-muted)";
            emptyNotice.textContent = _tr('emptyNoTasksInPeriod', {}, "Không có task hoặc Merge Request nào trong khoảng thời gian đã chọn.");
            container.appendChild(emptyNotice);
            await renderKpiStats(calculateStats([], filterVal, selectedMonth));
            return;
        }

        if (displayData.length === 0) {
            if (searchResultCount) {
                if (currentSearchQuery) {
                    searchResultCount.style.display = 'inline-flex';
                    searchResultCount.innerHTML = _tr('searchFoundZero', {}, `Tìm thấy <strong>0</strong> task`);
                } else {
                    searchResultCount.style.display = 'none';
                }
            }

            const emptyQueryText = currentSearchQuery ? _tr('emptyQuerySub', { query: currentSearchQuery }, ` hoặc từ khóa "<strong>${currentSearchQuery}</strong>"`) : '';
            const emptySubtitle = _tr('emptyNoMatchingSub', { filter: getFilterLabel(currentQuickFilter), query: emptyQueryText }, `Không có công việc nào khớp với bộ lọc "<strong>${getFilterLabel(currentQuickFilter)}</strong>"${emptyQueryText} trong kỳ này.`);

            const emptyState = document.createElement("div");
            emptyState.className = "filter-empty-state";
            emptyState.innerHTML = `
                <div class="filter-empty-icon">🔍</div>
                <div class="filter-empty-title">${_tr('emptyNoMatchingTitle', {}, 'Không tìm thấy công việc phù hợp')}</div>
                <div class="filter-empty-subtitle">${emptySubtitle}</div>
                <button id="btnResetFilters" class="btn-reset-filters">${_tr('btnResetFilters', {}, '✕ Đặt lại bộ lọc')}</button>
            `;
            container.appendChild(emptyState);

            const resetBtn = emptyState.querySelector('#btnResetFilters');
            if (resetBtn) {
                resetBtn.addEventListener('click', async () => {
                    setQuickFilter('all');
                    if (kpiSearchInput) kpiSearchInput.value = '';
                    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                    currentSearchQuery = '';
                    currentPage = 1;
                    await applyFilter();
                });
            }

            await renderKpiStats(calculateStats([], filterVal, selectedMonth));
            return;
        }

        function renderProjectSection(groupName, items, parentEl, weekStart = null) {
            const section = document.createElement("div");
            section.className = "report-section";

            const groupTitle = document.createElement('h3');
            const urlLink = document.createElement('a');
            const firstItem = items[0];
            const newUrl = firstItem.taskUrl ? firstItem.taskUrl.replace(/\/work_items\/\d+/, "/issues") : '#';

            urlLink.href = newUrl;
            urlLink.target = '_blank';
            urlLink.textContent = cleanGroupName(groupName);
            groupTitle.appendChild(document.createTextNode("📁 "));
            groupTitle.appendChild(urlLink);
            section.appendChild(groupTitle);

            const table = document.createElement("table");
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            const taskColumns = [
                { label: (typeof t === 'function' ? t('tableTasks') : "Tasks"), key: "tasks", center: false },
                { label: (typeof t === 'function' ? t('tableWorkItemName') : "Tên Work Item"), key: "title", center: false },
                { label: (typeof t === 'function' ? t('tableParentIssue') : "Issue cha"), key: "parentTitle", center: false },
                { label: (typeof t === 'function' ? t('tableStartDate') : "Start date"), key: "startDate", center: true },
                { label: (typeof t === 'function' ? t('tableDueDate') : "Due date"), key: "dueDate", center: true },
                { label: (typeof t === 'function' ? t('tableClosedDate') : "Closed date"), key: "closeDate", center: true },
                { label: (typeof t === 'function' ? t('tableEst') : "Estimate toàn task (h)"), key: "estimate", center: true },
                { label: _tr('tableSpent'), key: "spent", center: true },
                { label: _tr('tableLifetimeSpent'), key: "lifetimeSpent", center: true },
                { label: _tr('tableDiff'), key: "estimateVariance", center: true },
                { label: (typeof t === 'function' ? t('tableReopen') : "Số lần bị reopen"), key: "reopenTotal", center: true },
                { label: (typeof t === 'function' ? t('tableTaskType') : "Loại task"), key: "type", center: true },
                { label: (typeof t === 'function' ? t('tableProgress') : "Tiến độ"), key: "progress", center: true },
                { label: (typeof t === 'function' ? t('tableAction') : "Thao tác"), key: null, center: true }
            ];

            const gSort = groupSortStates[groupName] || { column: null, direction: null };

            taskColumns.forEach(col => {
                const th = document.createElement("th");
                if (col.key === null) {
                    th.className = "col-action text-center";
                    th.textContent = col.label;
                } else {
                    if (col.center) th.className = "text-center";
                    th.classList.add("sortable-th");
                    th.title = _tr('clickToSortByColumn', { column: col.label }, `Bấm để sắp xếp theo ${col.label}`);

                    const contentSpan = document.createElement("span");
                    contentSpan.className = "th-content";
                    contentSpan.appendChild(document.createTextNode(col.label));

                    const iconSpan = document.createElement("span");
                    iconSpan.className = "sort-icon";
                    if (gSort.column === col.key) {
                        iconSpan.classList.add("sort-active");
                        iconSpan.textContent = gSort.direction === 'asc' ? "▲" : "▼";
                        th.classList.add("th-sorted");
                    } else {
                        iconSpan.textContent = "↕";
                    }
                    contentSpan.appendChild(iconSpan);
                    th.appendChild(contentSpan);

                    th.addEventListener("click", () => {
                        handleGroupHeaderSort(groupName, col.key);
                    });
                }
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            let groupTotalSpent = 0;
            let groupTotalReopen = 0;

            const sortedItems = (gSort.column && gSort.direction)
                ? sortItems(items, gSort.column, gSort.direction)
                : items;

            sortedItems.forEach(item => {
                groupTotalSpent += item.spent || 0;
                groupTotalReopen += item.reopenTotal || 0;

                const row = document.createElement("tr");

                // 1. Tasks
                const taskTd = document.createElement("td");
                const isUnclosed = !isItemClosed(item);
                if (isUnclosed) {
                    const redDot = document.createElement("span");
                    redDot.className = "badge-dot-red";
                    redDot.textContent = "🔴";
                    redDot.title = _tr('taskOpenTitle', {}, "Task chưa đóng (Open)");
                    taskTd.appendChild(redDot);
                    row.classList.add("row-unclosed");
                }

                if (isItemCarryOver(item, weekStart)) {
                    const carryBadge = document.createElement("span");
                    carryBadge.className = "badge-carryover";
                    carryBadge.textContent = "🔄 " + getStatusBadgeText('carryOver');
                    const originDate = (item.createdAt || item.addedAt) ? formatDate(parseToIsoDate(item.createdAt || item.addedAt)) : '';
                    const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en');
                    carryBadge.title = isEn
                        ? `Work item carried over from the previous period${originDate ? ` (Created on ${originDate})` : ''}`
                        : `Công việc chuyển tiếp từ kỳ trước${originDate ? ` (Tạo ngày ${originDate})` : ''}`;
                    taskTd.appendChild(carryBadge);
                }

                const link = document.createElement('a');
                link.href = item.taskUrl;
                link.textContent = '#' + item.taskUrl.split('/').pop();
                link.title = item.taskUrl;
                link.target = '_blank';
                taskTd.appendChild(link);
                row.appendChild(taskTd);

                // 2. Tên Work Item
                const titleTd = document.createElement("td");
                const titleSpan = document.createElement("span");
                titleSpan.className = "cell-truncate text-truncate-task";
                const displayTitle = item.title ? item.title.trim() : '—';
                titleSpan.textContent = displayTitle;
                if (item.title) titleSpan.title = item.title;
                titleTd.appendChild(titleSpan);
                row.appendChild(titleTd);

                // 3. Issue cha
                const parentTd = document.createElement("td");
                if (item.parentTitle) {
                    if (item.parentUrl) {
                        const parentLink = document.createElement("a");
                        parentLink.href = item.parentUrl;
                        parentLink.target = '_blank';
                        parentLink.className = "cell-truncate link-parent";
                        parentLink.textContent = `🔗 ${item.parentTitle}`;
                        parentLink.title = item.parentTitle;
                        parentTd.appendChild(parentLink);
                    } else {
                        const parentSpan = document.createElement("span");
                        parentSpan.className = "cell-truncate";
                        parentSpan.textContent = item.parentTitle;
                        parentSpan.title = item.parentTitle;
                        parentTd.appendChild(parentSpan);
                    }
                } else {
                    const noParent = document.createElement("span");
                    noParent.textContent = "—";
                    noParent.style.color = "var(--text-muted)";
                    parentTd.appendChild(noParent);
                }
                row.appendChild(parentTd);

                // 4. Start date
                const startTd = document.createElement("td");
                startTd.className = "text-center";
                startTd.textContent = item.startDate || '';
                row.appendChild(startTd);

                // 5. Due date
                const dueTd = document.createElement("td");
                dueTd.className = "text-center";
                dueTd.textContent = item.dueDate || '';
                row.appendChild(dueTd);

                // 6. Closed date
                const closeTd = document.createElement("td");
                closeTd.className = "text-center";
                if (!isUnclosed) {
                    closeTd.textContent = item.closeDate || formatDate(getItemCloseDate(item)) || '—';
                } else {
                    const unclosedBadge = document.createElement("span");
                    unclosedBadge.className = "badge-unclosed";
                    unclosedBadge.innerHTML = "🔴 " + _tr('statusUnclosed', {}, 'Chưa đóng');
                    unclosedBadge.title = _tr('statusUnclosedTitle', {}, 'Task này hiện chưa được đóng trên GitLab');
                    closeTd.appendChild(unclosedBadge);
                }
                row.appendChild(closeTd);

                // 7. Estimate
                const estTd = document.createElement("td");
                estTd.className = "text-center";
                estTd.textContent = item.estimate !== undefined ? item.estimate : '';
                row.appendChild(estTd);

                // 8. Spent
                const spentTd = document.createElement("td");
                spentTd.className = "text-center";
                spentTd.textContent = item.spent !== undefined ? Number(item.spent).toFixed(2) : '';
                row.appendChild(spentTd);
                const lifetimeSpentTd = document.createElement('td');
                lifetimeSpentTd.className = item.isMR ? 'col-mr-time text-center' : 'text-center';
                lifetimeSpentTd.textContent = getItemSpentInRange(item).toFixed(2);
                row.appendChild(lifetimeSpentTd);
                row.appendChild(createEstimateVarianceCell(item));

                // 11. Reopen
                const reopenTd = document.createElement("td");
                reopenTd.className = "text-center";
                reopenTd.textContent = item.reopenTotal || 0;
                if (item.reopenTotal > 0) reopenTd.classList.add('text-danger');
                row.appendChild(reopenTd);

                // 12. Loại task
                const typeTd = document.createElement("td");
                typeTd.className = "text-center";
                let typeDisplay = item.type || '';
                if (item.type === 'Kế hoạch') {
                    typeDisplay = _tr('typePlanned', {}, 'Kế hoạch');
                    typeTd.classList.add('text-success');
                } else if (item.type === 'Phát sinh') {
                    typeDisplay = _tr('typeUnplanned', {}, 'Phát sinh');
                    typeTd.classList.add('text-accent');
                }
                typeTd.textContent = typeDisplay;
                row.appendChild(typeTd);

                // 13. Tiến độ
                const progTd = document.createElement("td");
                progTd.className = "text-center";
                const isLate = (typeof isItemLate === 'function') ? isItemLate(item) : (item.progress === 'Trễ hạn' || item.isLate === true);
                let progDisplay = isLate ? _tr('statusLate', {}, 'Trễ hạn') : _tr('statusInTime', {}, 'Đúng hạn');
                if (isLate) {
                    progTd.classList.add('text-danger');
                } else {
                    progTd.classList.add('text-success');
                }
                progTd.textContent = progDisplay;
                row.appendChild(progTd);

                // 14. Thao tác (Xóa 🗑️)
                const actionTd = document.createElement("td");
                actionTd.className = "col-action text-center";
                const delBtn = document.createElement("button");
                delBtn.className = "btn-delete-row";
                delBtn.innerHTML = "🗑️";
                delBtn.title = _tr('actionDeleteTaskTitle', {}, "Xóa task này khỏi danh sách");
                delBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await deleteKpiItem(item);
                });
                actionTd.appendChild(delBtn);
                row.appendChild(actionTd);

                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            const tfoot = document.createElement("tfoot");
            const totalRow = document.createElement("tr");

            // colSpan 6: Tasks, Tên Work Item, Issue cha, Start date, Due date, Closed date
            const totalLabel = document.createElement("td");
            totalLabel.colSpan = 6;
            totalLabel.textContent = _tr('tableTotalLabel', {}, "TỔNG CỘNG");
            totalLabel.style.fontWeight = "600";
            totalLabel.style.textAlign = "right";
            totalLabel.style.paddingRight = "16px";
            totalRow.appendChild(totalLabel);

            ['—', groupTotalSpent, '—', '—', groupTotalReopen].forEach(val => {
                const td = document.createElement("td");
                td.className = "text-center";
                td.textContent = typeof val === 'number' ? val.toFixed(2) : val;
                td.style.fontWeight = "600";
                totalRow.appendChild(td);
            });

            // colSpan 3: Loại task, Tiến độ, Thao tác
            const endTd = document.createElement("td");
            endTd.colSpan = 3;
            totalRow.appendChild(endTd);

            tfoot.appendChild(totalRow);
            table.appendChild(tfoot);
            section.appendChild(table);
            parentEl.appendChild(section);
        }

        function renderMRSection(items, parentEl, weekStart = null) {
            if (!items || items.length === 0) return;
            const section = document.createElement("div");
            section.className = "report-section";
            const groupTitle = document.createElement('h3');
            groupTitle.textContent = "🚀 " + _tr('mrSectionTitle', {}, "DANH SÁCH MERGE REQUEST");
            section.appendChild(groupTitle);

            const mrColumns = [
                { label: (typeof t === 'function' ? t('tableTasks') : "Tasks"), key: "tasks", center: false, className: "col-mr-task" },
                { label: (typeof t === 'function' ? t('tableWorkItemName') : "Tên Merge Request"), key: "title", center: false, className: "col-mr-title" },
                { label: (typeof t === 'function' ? t('tableEst') : "Estimate toàn task (h)"), key: "estimate", center: true, className: "col-mr-time" },
                { label: _tr('tableSpent'), key: "spent", center: true, className: "col-mr-time" },
                { label: _tr('tableLifetimeSpent'), key: "lifetimeSpent", center: true, className: "col-mr-time" },
                { label: _tr('tableDiff'), key: "estimateVariance", center: true, className: "col-mr-time" },
                { label: (typeof t === 'function' ? t('tableAction') : "Thao tác"), key: null, center: true, className: "col-action" }
            ];
            const table = document.createElement("table");
            table.className = "table-mr";
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            mrColumns.forEach(col => {
                const th = document.createElement("th");
                if (col.className) th.classList.add(col.className);
                if (col.key === null) {
                    th.className = "col-action text-center";
                    th.textContent = col.label;
                } else {
                    if (col.center) th.classList.add("text-center");
                    th.classList.add("sortable-th");
                    th.title = _tr('clickToSortByColumn', { column: col.label }, `Bấm để sắp xếp theo ${col.label}`);

                    const contentSpan = document.createElement("span");
                    contentSpan.className = "th-content";
                    contentSpan.appendChild(document.createTextNode(col.label));

                    const iconSpan = document.createElement("span");
                    iconSpan.className = "sort-icon";
                    if (currentMRSort.column === col.key) {
                        iconSpan.classList.add("sort-active");
                        iconSpan.textContent = currentMRSort.direction === 'asc' ? "▲" : "▼";
                        th.classList.add("th-sorted");
                    } else {
                        iconSpan.textContent = "↕";
                    }
                    contentSpan.appendChild(iconSpan);
                    th.appendChild(contentSpan);

                    th.addEventListener("click", () => {
                        handleMRHeaderSort(col.key);
                    });
                }
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            let mrTotalSpent = 0;

            const sortedMRs = (currentMRSort.column && currentMRSort.direction)
                ? sortItems(items, currentMRSort.column, currentMRSort.direction)
                : items;

            sortedMRs.forEach(item => {
                mrTotalSpent += item.spent || 0;
                const row = document.createElement("tr");

                // 1. Tasks
                const taskTd = document.createElement("td");
                taskTd.className = "col-mr-task";
                const isMROpen = !isItemClosed(item);
                if (isMROpen) {
                    const redDot = document.createElement("span");
                    redDot.className = "badge-dot-red";
                    redDot.textContent = "🔴";
                    redDot.title = _tr('mrOpenTitle', {}, "Merge Request đang mở (Open)");
                    taskTd.appendChild(redDot);
                    row.classList.add("row-unclosed");
                }

                if (isItemCarryOver(item, weekStart)) {
                    const carryBadge = document.createElement("span");
                    carryBadge.className = "badge-carryover";
                    carryBadge.textContent = "🔄 " + getStatusBadgeText('carryOver');
                    const originDate = (item.createdAt || item.addedAt) ? formatDate(parseToIsoDate(item.createdAt || item.addedAt)) : '';
                    carryBadge.title = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en')
                        ? `Merge Request carried over from the previous period${originDate ? ` (Created on ${originDate})` : ''}`
                        : `Merge Request chuyển tiếp từ kỳ trước${originDate ? ` (Tạo ngày ${originDate})` : ''}`;
                    taskTd.appendChild(carryBadge);
                }

                const link = document.createElement('a');
                link.href = item.taskUrl;
                link.textContent = '!' + item.taskUrl.split('/').pop();
                link.title = item.taskUrl;
                link.target = '_blank';
                taskTd.appendChild(link);
                row.appendChild(taskTd);

                // 2. Tên Merge Request
                const titleTd = document.createElement("td");
                titleTd.className = "col-mr-title";
                const titleSpan = document.createElement("span");
                titleSpan.className = "cell-truncate text-truncate-task text-truncate-mr";
                const displayTitle = item.title ? item.title.trim() : '—';
                titleSpan.textContent = displayTitle;
                if (item.title) titleSpan.title = item.title;
                titleTd.appendChild(titleSpan);
                row.appendChild(titleTd);

                // 3. Estimate
                const estTd = document.createElement("td");
                estTd.className = "col-mr-time text-center";
                estTd.textContent = item.estimate !== undefined ? item.estimate : '';
                row.appendChild(estTd);

                // 4. Spent
                const spentTd = document.createElement("td");
                spentTd.className = "col-mr-time text-center";
                spentTd.textContent = item.spent !== undefined ? Number(item.spent).toFixed(2) : '';
                row.appendChild(spentTd);
                const lifetimeSpentTd = document.createElement('td');
                lifetimeSpentTd.className = item.isMR ? 'col-mr-time text-center' : 'text-center';
                lifetimeSpentTd.textContent = getItemSpentInRange(item).toFixed(2);
                row.appendChild(lifetimeSpentTd);
                row.appendChild(createEstimateVarianceCell(item));

                // 7. Thao tác
                const actionTd = document.createElement("td");
                actionTd.className = "col-action text-center";
                const delBtn = document.createElement("button");
                delBtn.className = "btn-delete-row";
                delBtn.innerHTML = "🗑️";
                delBtn.title = _tr('deleteMRTitle', {}, "Xóa MR này khỏi danh sách");
                delBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await deleteKpiItem(item);
                });
                actionTd.appendChild(delBtn);
                row.appendChild(actionTd);

                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            const tfoot = document.createElement("tfoot");
            const totalRow = document.createElement("tr");

            // colSpan 2: Tasks, Tên Merge Request
            const totalLabel = document.createElement("td");
            totalLabel.colSpan = 2;
            totalLabel.textContent = _tr('totalMRsFooterLabel', {}, "TỔNG MERGE REQUEST");
            totalLabel.style.fontWeight = "600";
            totalLabel.style.textAlign = "right";
            totalLabel.style.paddingRight = "16px";
            totalRow.appendChild(totalLabel);

            ['—', mrTotalSpent, '—', '—'].forEach(val => {
                const td = document.createElement("td");
                td.className = "text-center";
                td.textContent = typeof val === 'number' ? val.toFixed(2) : val;
                td.style.fontWeight = "600";
                totalRow.appendChild(td);
            });

            // colSpan 1: Thao tác
            const endTd = document.createElement("td");
            endTd.colSpan = 1;
            totalRow.appendChild(endTd);

            tfoot.appendChild(totalRow);
            table.appendChild(tfoot);
            section.appendChild(table);
            parentEl.appendChild(section);
        }

        // 3. Render one monthly list or the selected detail period:
        const monthWeeks = getWeeksOfMonth(selYear, selMonth);

        let weekBlocks = [];
        if (filterVal === 'all_month') {
            weekBlocks.push({ title: `📊 ${periodLabel}`, start: periodRange.start, end: periodRange.end, items: displayData });
        } else if (filterVal === 'current_week') {
            const cw = getCurrentWeekRange(today, activeLang);
            weekBlocks.push({
                title: `📦 ${cw.label}`,
                start: cw.start,
                end: cw.end,
                items: displayData
            });
        } else if (filterVal.startsWith('week:')) {
            const parts = filterVal.split(':');
            const foundWeek = monthWeeks.find(w => w.start === parts[1] && w.end === parts[2]);
            const weekPrefix = activeLang === 'en' ? 'Week' : 'Tuần';
            const title = foundWeek ? `📦 ${foundWeek.label}` : `📦 ${weekPrefix} (${formatDate(parts[1])} - ${formatDate(parts[2])})`;
            weekBlocks.push({
                title: title,
                start: parts[1],
                end: parts[2],
                items: displayData
            });
        } else if (filterVal.startsWith('day:')) {
            const dayIso = filterVal.replace('day:', '');
            const dObj = new Date(dayIso);
            const dayLabel = !isNaN(dObj.getTime())
                ? dObj.toLocaleDateString(activeLang === 'en' ? 'en-US' : 'vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                : formatDate(dayIso);
            weekBlocks.push({
                title: `📅 ${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}`,
                start: dayIso,
                end: dayIso,
                items: displayData
            });
        } else if (filterVal === 'custom_range') {
            const customWeeks = getWeeksForRange(cStart, cEnd);
            if (customWeeks.length > 1) {
                customWeeks.forEach(w => {
                    const itemsInWeek = displayData.filter(item => isItemActiveInWeek(item, w.start, w.end));
                    if (itemsInWeek.length > 0) {
                        weekBlocks.push({
                            title: `📦 ${w.label}`,
                            start: w.start,
                            end: w.end,
                            items: itemsInWeek
                        });
                    }
                });
                const matchedIds = new Set(weekBlocks.flatMap(b => b.items.map(it => it.taskUrl || it.addedAt)));
                const remaining = displayData.filter(it => !matchedIds.has(it.taskUrl || it.addedAt));
                if (remaining.length > 0) {
                    weekBlocks.push({
                        title: '📦 ' + _tr('groupOther', {}, 'Khác'),
                        start: null,
                        end: null,
                        items: remaining
                    });
                }
            } else {
                const startDisp = cStart ? formatDate(cStart) : '...';
                const endDisp = cEnd ? formatDate(cEnd) : '...';
                weekBlocks.push({
                    title: `🗓️ ${_tr('dateRangePrefix', {}, 'Khoảng ngày')}: ${startDisp} - ${endDisp}`,
                    start: cStart,
                    end: cEnd,
                    items: displayData
                });
            }
        }

        weekBlocks.forEach(block => {
            let start = block.start || periodRange.start;
            let end = block.end || periodRange.end;
            if (periodRange.start && (!start || start < periodRange.start)) start = periodRange.start;
            if (periodRange.end && (!end || end > periodRange.end)) end = periodRange.end;
            block.items = block.items.map(item => ({ ...item, lifetimeSpent: getItemSpentInRange(item), spent: getItemSpentInRange(item, start, end) }));
        });

        // 4. Pagination calculation & slicing:
        const hasAnyGroupSort = Object.values(groupSortStates).some(s => s && s.column && s.direction);
        const hasMRSort = currentMRSort.column && currentMRSort.direction;

        if (hasAnyGroupSort || hasMRSort) {
            weekBlocks.forEach(wb => {
                const projectMap = {};
                const mrs = [];
                wb.items.forEach(it => {
                    if (it.isMR) {
                        mrs.push(it);
                    } else {
                        const g = it.groupName || 'Khác';
                        if (!projectMap[g]) projectMap[g] = [];
                        projectMap[g].push(it);
                    }
                });

                const sortedProjectItems = [];
                Object.keys(projectMap).forEach(g => {
                    const gSort = groupSortStates[g];
                    const sortedGroup = (gSort && gSort.column && gSort.direction)
                        ? sortItems(projectMap[g], gSort.column, gSort.direction)
                        : projectMap[g];
                    sortedProjectItems.push(...sortedGroup);
                });

                const sortedMRs = hasMRSort
                    ? sortItems(mrs, currentMRSort.column, currentMRSort.direction)
                    : mrs;
                wb.items = [...sortedProjectItems, ...sortedMRs];
            });
        }

        const allOrderedItems = weekBlocks.flatMap(b => b.items);
        const totalItems = allOrderedItems.length;

        // Cập nhật nhãn đếm kết quả tìm kiếm chính xác
        if (searchResultCount) {
            if (currentSearchQuery) {
                searchResultCount.style.display = 'inline-flex';
                const uniqueFound = filteredData.length;
                const scopeTotal = currentQuickFilter === 'all'
                    ? baseFiltered.length
                    : baseFiltered.filter(it => {
                        if (currentQuickFilter === 'mr') return !!it.isMR;
                        if (it.isMR) return false;
                        if (currentQuickFilter === 'late') return (typeof isItemLate === 'function') ? isItemLate(it) : (it.progress === 'Trễ hạn' || it.isLate === true);
                        if (currentQuickFilter === 'missing_time') return !it.estimate || Number(it.estimate) === 0 || !it.spent || Number(it.spent) === 0;
                        if (currentQuickFilter === 'missing_date') return !it.startDate || !it.dueDate;
                        if (currentQuickFilter === 'reopen') return (it.reopenTotal || 0) > 0;
                        if (currentQuickFilter === 'unplanned') return it.type === 'Phát sinh';
                        if (currentQuickFilter === 'open') return isItemOpen(it);
                        return true;
                    }).length;

                if (totalItems > uniqueFound) {
                    searchResultCount.innerHTML = _tr('searchFoundWithRows', { found: uniqueFound, rows: totalItems, total: scopeTotal }, `Tìm thấy <strong>${uniqueFound}</strong> task <span class="search-repeat-count" title="Công việc lặp lại ở nhiều tuần khác nhau do tiếp diễn">(${totalItems} dòng)</span> / <strong>${scopeTotal}</strong>`);
                } else {
                    searchResultCount.innerHTML = _tr('searchFoundCount', { found: uniqueFound, total: scopeTotal }, `Tìm thấy <strong>${uniqueFound}</strong> / <strong>${scopeTotal}</strong> task`);
                }
            } else {
                searchResultCount.style.display = 'none';
            }
        }

        const effectivePageSize = pageSize === 'all' ? totalItems : Number(pageSize);
        const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        let startIdx = 0;
        let endIdx = totalItems;
        let pagedItemSet = null;

        if (pageSize !== 'all') {
            startIdx = (currentPage - 1) * effectivePageSize;
            endIdx = Math.min(startIdx + effectivePageSize, totalItems);
            const pagedSlice = allOrderedItems.slice(startIdx, endIdx);
            pagedItemSet = new Set(pagedSlice);
        }

        // Filter week blocks to only show items belonging to current page
        const displayWeekBlocks = weekBlocks.map(b => {
            const items = pageSize === 'all' ? b.items : b.items.filter(it => pagedItemSet.has(it));
            return {
                title: b.title,
                start: b.start,
                end: b.end,
                items: items
            };
        }).filter(b => b.items.length > 0);

        displayWeekBlocks.forEach(wb => {
            const weekSection = document.createElement("div");
            weekSection.className = "week-section";

            const weekHeader = document.createElement("div");
            weekHeader.className = "week-header";

            const h2 = document.createElement("h2");
            h2.textContent = wb.title;
            weekHeader.appendChild(h2);

            let weekSpent = 0;
            wb.items.forEach(it => { weekSpent += (it.spent || 0); });

            const weekActions = document.createElement("div");
            weekActions.className = "week-actions";
            weekActions.style.display = "flex";
            weekActions.style.alignItems = "center";
            weekActions.style.gap = "10px";

            const carryCount = wb.items.filter(it => isItemCarryOver(it, wb.start)).length;
            const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en');
            const carryText = carryCount > 0 ? (isEn ? ` (${carryCount} ongoing)` : ` (${carryCount} tiếp diễn)`) : '';

            const badge = document.createElement("span");
            badge.className = "week-badge";
            badge.textContent = `${weekSpent.toFixed(2)}h spent / ${wb.items.length} ${_tr('workItemsUnit', {}, 'công việc')}${carryText}`;
            weekActions.appendChild(badge);

            const delWeekBtn = document.createElement("button");
            delWeekBtn.className = "btn-delete-week";
            delWeekBtn.textContent = filterVal === 'all_month'
                ? _tr('deleteMonthBtn', {}, "🗑️ Xóa tháng")
                : _tr('deleteThisWeekBtn', {}, "🗑️ Xóa tuần này");
            delWeekBtn.title = _tr('deleteThisWeekTitle', { title: wb.title }, `Xóa toàn bộ Task và Merge Request trong ${wb.title}`);
            delWeekBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await deleteWeekItems(wb);
            });
            weekActions.appendChild(delWeekBtn);

            weekHeader.appendChild(weekActions);
            weekSection.appendChild(weekHeader);

            const weekTaskGroups = {};
            const weekMRs = [];

            wb.items.forEach(item => {
                if (item.isMR) {
                    weekMRs.push(item);
                } else {
                    const group = item.groupName || 'Khác';
                    if (!weekTaskGroups[group]) weekTaskGroups[group] = [];
                    weekTaskGroups[group].push(item);
                }
            });

            for (const [groupName, items] of Object.entries(weekTaskGroups)) {
                renderProjectSection(groupName, items, weekSection, wb.start);
            }

            if (weekMRs.length > 0) {
                renderMRSection(weekMRs, weekSection, wb.start);
            }

            container.appendChild(weekSection);
        });

        // 5. Render Pagination Bar
        if (totalItems > 0) {
            renderPaginationBar(container, totalItems, startIdx, endIdx, currentPage, totalPages, pageSize);
        }

        // 6. Update Dashboard Stats (based on whatever is displayed)
        const dashboardStats = calculateStats(displayData, filterVal, selectedMonth);
        await renderKpiStats(dashboardStats);

    }

    function getPaginationPages(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const pages = [];
        pages.push(1);

        let start = Math.max(2, current - 1);
        let end = Math.min(total - 1, current + 1);

        if (current <= 3) {
            end = 4;
        } else if (current >= total - 2) {
            start = total - 3;
        }

        if (start > 2) {
            pages.push('...');
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (end < total - 1) {
            pages.push('...');
        }
        pages.push(total);
        return pages;
    }

    function renderPaginationBar(container, totalItems, startIdx, endIdx, curPage, numPages, curPageSize) {
        const bar = document.createElement("div");
        bar.className = "pagination-bar";

        // Left side: Info & page size dropdown
        const infoDiv = document.createElement("div");
        infoDiv.className = "pagination-info";

        const textSpan = document.createElement("span");
        const displayStart = totalItems === 0 ? 0 : startIdx + 1;
        textSpan.innerHTML = _tr('paginationShowing', {
            start: displayStart,
            end: endIdx,
            total: totalItems,
            page: curPage,
            pages: numPages
        }, `Hiển thị <strong>${displayStart}</strong> - <strong>${endIdx}</strong> trong tổng số <strong>${totalItems}</strong> công việc <span style="color:var(--text-muted);margin-left:4px;">(Trang ${curPage}/${numPages})</span>`);
        infoDiv.appendChild(textSpan);

        const sizeWrapper = document.createElement("label");
        sizeWrapper.style.display = "inline-flex";
        sizeWrapper.style.alignItems = "center";
        sizeWrapper.style.gap = "6px";
        sizeWrapper.style.marginLeft = "8px";

        const sizeLabel = document.createElement("span");
        sizeLabel.textContent = _tr('paginationPerPage', {}, "Mỗi trang:");
        sizeWrapper.appendChild(sizeLabel);

        const sizeSelect = document.createElement("select");
        sizeSelect.className = "pagination-size-select";
        const sizes = [
            { value: "15", label: "15" },
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
            { value: "all", label: _tr('paginationAllOption', {}, "Tất cả") }
        ];
        sizes.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.value;
            opt.textContent = s.label;
            if (String(curPageSize) === s.value) opt.selected = true;
            sizeSelect.appendChild(opt);
        });

        sizeSelect.addEventListener("change", async (e) => {
            pageSize = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
            currentPage = 1;
            await applyFilter();
            const c = document.getElementById("kpiContainer");
            if (c) c.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        sizeWrapper.appendChild(sizeSelect);
        infoDiv.appendChild(sizeWrapper);
        bar.appendChild(infoDiv);

        // Right side: Pagination controls
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "pagination-controls";

        const createBtn = (label, targetPage, isDisabled, isActive, title) => {
            const btn = document.createElement("button");
            btn.className = "pagination-btn" + (isActive ? " active" : "");
            btn.textContent = label;
            if (title) btn.title = title;
            if (isDisabled) {
                btn.disabled = true;
            } else {
                btn.addEventListener("click", async () => {
                    if (currentPage === targetPage) return;
                    currentPage = targetPage;
                    await applyFilter();
                    const c = document.getElementById("kpiContainer");
                    if (c) c.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            }
            return btn;
        };

        // « Đầu
        controlsDiv.appendChild(createBtn("«", 1, curPage <= 1, false, _tr('paginationFirst', {}, "Trang đầu")));
        // ‹ Trước
        controlsDiv.appendChild(createBtn("‹", curPage - 1, curPage <= 1, false, _tr('paginationPrev', {}, "Trang trước")));

        // Page buttons
        const pages = getPaginationPages(curPage, numPages);
        pages.forEach(p => {
            if (p === "...") {
                const ellipsis = document.createElement("span");
                ellipsis.className = "pagination-ellipsis";
                ellipsis.textContent = "…";
                controlsDiv.appendChild(ellipsis);
            } else {
                controlsDiv.appendChild(createBtn(String(p), p, false, p === curPage, _tr('paginationPageTooltip', { page: p }, `Trang ${p}`)));
            }
        });

        // › Sau
        controlsDiv.appendChild(createBtn("›", curPage + 1, curPage >= numPages, false, _tr('paginationNext', {}, "Trang sau")));
        // » Cuối
        controlsDiv.appendChild(createBtn("»", numPages, curPage >= numPages, false, _tr('paginationLast', {}, "Trang cuối")));

        bar.appendChild(controlsDiv);
        container.appendChild(bar);
    }

    async function renderKpiStats(kpiStats) {
        const container = document.getElementById('kpiStatsContainer');
        container.innerHTML = '';

        const section = document.createElement("div");
        section.className = "report-section";

        const groupTitle = document.createElement('h3');
        groupTitle.textContent = _tr('statsOverviewTitle', {}, "📈 TỔNG QUAN HIỆU SUẤT");
        section.appendChild(groupTitle);

        const statsData = [
            { label: _tr('statTotalTasks', {}, "Tổng số công việc"), value: kpiStats.totalTask, icon: "📋" },
            { label: _tr('statPlannedUnplanned', {}, "Kế hoạch / Phát sinh"), value: `${kpiStats.totalPlannedTask} / ${kpiStats.totalUnplannedTask}`, icon: "⚖️" },
            { label: _tr('statSpent', {}, 'Spent trong kỳ'), value: `${kpiStats.totalSpent}h`, icon: "⌛" },
            { label: _tr('statInTimeLate', {}, "Đúng hạn / Trễ hạn"), value: `${kpiStats.totalTaskInTime} / ${kpiStats.totalTaskLate}`, icon: "🎯" },
            { label: _tr('statReopen', {}, "Task Reopen"), value: kpiStats.totalTaskReopen, icon: "🔄" },
            { label: _tr('statDailySpent', {}, "Daily Spent"), value: `${kpiStats.dailySpentTime}h`, icon: "📅" }
        ];

        const grid = document.createElement("div");
        grid.className = "stats-grid";

        statsData.forEach(stat => {
            const card = document.createElement("div");
            card.className = "stat-card";

            const labelEl = document.createElement("div");
            labelEl.className = "stat-card-label";
            labelEl.textContent = `${stat.icon} ${stat.label}`;

            const valueEl = document.createElement("div");
            valueEl.className = "stat-card-value";
            valueEl.textContent = stat.value;

            card.appendChild(labelEl);
            card.appendChild(valueEl);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }

    function getAttitudeScore(percent) {
        if (percent >= 80) return 1;
        if (percent >= 50) return 2;
        if (percent >= 30) return 3;
        if (percent >= 10) return 4;
        return 5;
    }

    function getVolumeScore(percent) {
        if (percent < 70) return 1;
        if (percent < 80) return 2;
        if (percent < 90) return 3;
        if (percent < 100) return 4;
        return 5;
    }

    function getQualityScore(percent) {
        if (percent >= 80) return 1;
        if (percent >= 50) return 2;
        if (percent >= 30) return 3;
        if (percent >= 10) return 4;
        return 5;
    }

    function triggerExcelDownload(buffer, fileName) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    }

    async function exportMonthlyKPIExcel() {
        const isWido = (typeof isWidosoftGitlab === 'function')
            ? isWidosoftGitlab(gitlabServerUrl)
            : (gitlabServerUrl && typeof gitlabServerUrl === 'string' && gitlabServerUrl.toLowerCase().includes('gitlab.widosoft'));
        if (!isWido) {
            alert(_tr('alertOnlyAvailableForWidosoft', {}, 'Chức năng xuất KPI mẫu Excel chỉ áp dụng cho máy chủ gitlab.widosoft.'));
            return;
        }

        if (typeof ExcelJS === 'undefined') {
            alert('Thư viện ExcelJS chưa sẵn sàng. Vui lòng tải lại trang!');
            return;
        }

        const selectedMonth = monthSelect.value;
        try { await KpiSync.syncBeforeExport(selectedMonth); }
        catch (error) {
            alert(_tr('alertSyncBeforeExportFailed', { error: error.message }));
            return;
        }

        const storedKpi = await getDashboardItems();
        if (!storedKpi || storedKpi.length === 0) {
            alert(_tr('alertNoKpiDataToExport', {}, 'Chưa có dữ liệu thống kê KPI. Vui lòng chờ đồng bộ hoàn tất trước khi xuất file!'));
            return;
        }

        const [selYear, selMonth] = selectedMonth.split('-').map(Number);

        // Lọc tất cả task/MR của tháng
        const monthItems = storedKpi.filter(item => isItemActiveInFilter(item, 'all_month', selectedMonth, '', ''));
        if (monthItems.length === 0) {
            alert(_tr('alertNoMonthDataToExport', { month: `${String(selMonth).padStart(2, '0')}/${selYear}` }, `Tháng ${String(selMonth).padStart(2, '0')}/${selYear} không có dữ liệu công việc.`));
            return;
        }

        // Tính toán thống kê KPI cho tháng
        const stats = calculateStats(monthItems, 'all_month', selectedMonth);

        // Tải template KPI
        let templateBuffer;
        try {
            const resp = await fetch('kpi_template.xlsx');
            if (!resp.ok) throw new Error('Không thể tải file mẫu kpi_template.xlsx');
            templateBuffer = await resp.arrayBuffer();
        } catch (err) {
            console.error('Lỗi tải template KPI:', err);
            alert('Lỗi: Không tìm thấy file kpi_template.xlsx trong extension.');
            return;
        }

        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(templateBuffer);

        const ws1 = wb.getWorksheet('Báo cáo công việc');
        const ws2 = wb.getWorksheet('Chấm điểm KPI');

        // Make room for lifetime spent; move the template's summary one column right.
        ws1.unMergeCells('L3:M3');
        ws1.unMergeCells('L22:M22');
        ws1.spliceColumns(12, 0, []);
        ws1.mergeCells('M3:N3');
        ws1.mergeCells('M22:N22');
        ws1.getColumn('L').width = 15;


        // 1. Xóa toàn bộ dữ liệu và định dạng cũ ở cột B đến L trong Sheet 1 (giữ nguyên cột M và N)
        for (let r = 1; r <= ws1.rowCount; r++) {
            const row = ws1.getRow(r);
            for (let c = 2; c <= 12; c++) {
                const cell = row.getCell(c);
                cell.value = null;
                cell.style = {};
            }
        }
        // Xóa sạch toàn bộ các dòng phía dưới dòng 36 (tránh dữ liệu và định dạng rác của tháng cũ)
        for (let r = 37; r <= ws1.rowCount; r++) {
            const row = ws1.getRow(r);
            row.height = undefined;
            for (let c = 1; c <= 26; c++) {
                const cell = row.getCell(c);
                cell.value = null;
                cell.style = {};
            }
        }

        // 2. Monthly work items: one row per task, with only this month's spent.
        let curRow = 1;
        const headers = ['Tasks', 'Start date', 'Due date', 'Closed date', _tr('tableEst'), _tr('tableSpent'), _tr('tableLifetimeSpent'), 'Số lần bị reopen', 'Loại task', 'Tiến độ', _tr('tableDiff')];
        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

        const monthRange = getPeriodDateRange('all_month', selectedMonth);
        const monthTasks = monthItems.filter(item => !item.isMR)
            .map(item => ({ ...item, lifetimeSpent: getItemSpentInRange(item), spent: getItemSpentInRange(item, monthRange.start, monthRange.end) }));
        const monthTitle = ws1.getCell(`B${curRow}`);
        monthTitle.value = _tr('monthBadgeLabel', { month: String(selMonth).padStart(2, '0'), year: selYear });
        monthTitle.style = { font: { name: 'Times New Roman', size: 12, bold: true } };
        curRow += 3;

        // Group tasks theo groupName
        const grouped = {};
        monthTasks.forEach(it => {
            const gName = cleanGroupName(it.groupName || 'Khác');
            if (!grouped[gName]) grouped[gName] = [];
            grouped[gName].push(it);
        });

        Object.entries(grouped).forEach(([gName, items]) => {
            const grpCell = ws1.getCell(`B${curRow}`);
            grpCell.value = gName;
            grpCell.style = {
                font: { name: 'Arial', size: 11, bold: true }
            };
            curRow++;

            headers.forEach((h, idx) => {
                const cell = ws1.getCell(`${cols[idx]}${curRow}`);
                cell.value = h;
                cell.style = {
                    font: { name: 'Times New Roman', size: 12, bold: true },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
                };
            });
            ws1.getRow(curRow).height = 48;
            curRow++;

            items.forEach(it => {
                const taskCell = ws1.getCell(`B${curRow}`);
                taskCell.value = { text: it.taskUrl, hyperlink: it.taskUrl };
                taskCell.style = {
                    font: { name: 'Arial', size: 11, color: { argb: 'FF0000FF' }, underline: true },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { vertical: 'middle' }
                };

                const rowVals = [
                    it.startDate ? formatDate(it.startDate) : '',
                    it.dueDate ? formatDate(it.dueDate) : '',
                    it.closeDate ? formatDate(it.closeDate) : '',
                    typeof it.estimate === 'number' ? it.estimate : (it.estimate ? parseFloat(it.estimate) : 0),
                    typeof it.spent === 'number' ? it.spent : (it.spent ? parseFloat(it.spent) : 0),
                    getItemSpentInRange(it),
                    it.reopenTotal || 0,
                    it.type || it.taskType || 'Kế hoạch',
                    it.progress || 'Đúng hạn',
                    getItemEstimateVariance(it) ?? '—'
                ];

                rowVals.forEach((val, idx) => {
                    const cell = ws1.getCell(`${cols[idx + 1]}${curRow}`);
                    cell.value = val;
                    cell.style = {
                        font: { name: 'Times New Roman', size: 12 },
                        border: {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        },
                        alignment: { horizontal: 'center', vertical: 'middle' }
                    };
                });
                curRow++;
            });
            curRow += 2;
        });
        curRow++;

        // 3. Danh sách Merge Request của cả tháng
        const monthMRs = monthItems.filter(item => item.isMR)
            .map(item => ({ ...item, lifetimeSpent: getItemSpentInRange(item), spent: getItemSpentInRange(item, monthRange.start, monthRange.end) }));
        if (monthMRs.length > 0) {
            const mrTitleCell = ws1.getCell(`B${curRow}`);
            mrTitleCell.value = 'DANH SÁCH MERGE REQUEST';
            mrTitleCell.style = {
                font: { name: 'Arial', size: 11, bold: true }
            };
            curRow++;

            const mrHeaders = ['Tasks', _tr('tableEst'), _tr('tableSpent'), _tr('tableLifetimeSpent'), _tr('tableDiff')];
            const mrCols = ['B', 'C', 'D', 'E', 'F'];
            mrHeaders.forEach((h, idx) => {
                const cell = ws1.getCell(`${mrCols[idx]}${curRow}`);
                cell.value = h;
                cell.style = {
                    font: { name: 'Times New Roman', size: 12, bold: true },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
                };
            });
            ws1.getRow(curRow).height = 48;
            curRow++;

            monthMRs.forEach(mr => {
                const taskCell = ws1.getCell(`B${curRow}`);
                taskCell.value = { text: mr.taskUrl, hyperlink: mr.taskUrl };
                taskCell.style = {
                    font: { name: 'Arial', size: 11, color: { argb: 'FF0000FF' }, underline: true },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { vertical: 'middle' }
                };

                const estCell = ws1.getCell(`C${curRow}`);
                estCell.value = typeof mr.estimate === 'number' ? mr.estimate : (mr.estimate ? parseFloat(mr.estimate) : 0);
                estCell.style = {
                    font: { name: 'Times New Roman', size: 12 },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { horizontal: 'center', vertical: 'middle' }
                };

                const spentCell = ws1.getCell(`D${curRow}`);
                spentCell.value = typeof mr.spent === 'number' ? mr.spent : (mr.spent ? parseFloat(mr.spent) : 0);
                spentCell.style = {
                    font: { name: 'Times New Roman', size: 12 },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: { horizontal: 'center', vertical: 'middle' }
                };
                const lifetimeSpentCell = ws1.getCell(`E${curRow}`);
                lifetimeSpentCell.value = getItemSpentInRange(mr);
                lifetimeSpentCell.style = spentCell.style;
                const diffCell = ws1.getCell(`F${curRow}`);
                diffCell.value = getItemEstimateVariance(mr) ?? '—';
                diffCell.style = spentCell.style;
                curRow++;
            });
        }

        // 4. Cập nhật số liệu Thống Kê & Tỉ lệ ở Cột M & N (Sheet 1)
        ws1.getCell('N4').value = stats.totalTasks;
        ws1.getCell('N5').value = stats.totalPlannedTasks;
        ws1.getCell('N6').value = stats.totalUnplannedTasks;
        ws1.getCell('N7').value = stats.workingHours;
        ws1.getCell('M8').value = null;
        ws1.getCell('N8').value = null;
        ws1.getCell('N9').value = parseFloat(stats.totalSpentTime);
        ws1.getCell('N10').value = parseFloat(stats.totalPlannedSpentTime);
        ws1.getCell('N11').value = parseFloat(stats.totalUnplannedSpentTime);
        ws1.getCell('N12').value = stats.tasksNoStartDate;
        ws1.getCell('N13').value = stats.tasksNoDueDate;
        ws1.getCell('N14').value = stats.tasksNoEstimate;
        ws1.getCell('N15').value = stats.tasksNoSpent;
        ws1.getCell('N16').value = stats.tasksOnTime;
        ws1.getCell('N17').value = stats.tasksLate;
        ws1.getCell('N18').value = stats.tasksNoReopen;
        ws1.getCell('N19').value = stats.tasksReopen;

        ws1.getCell('N23').value = { formula: 'N12/N4*100', result: parseFloat(stats.noStartDateRate) };
        ws1.getCell('N24').value = { formula: 'N13/N4*100', result: parseFloat(stats.noDueDateRate) };
        ws1.getCell('N25').value = { formula: 'N14/N4*100', result: parseFloat(stats.noEstimateRate) };
        ws1.getCell('N26').value = { formula: 'N15/N4*100', result: parseFloat(stats.noSpentRate) };
        ws1.getCell('N27').value = { formula: 'N16/N4*100', result: parseFloat(stats.onTimeRate) };
        ws1.getCell('N28').value = { formula: 'N17/N4*100', result: parseFloat(stats.lateRate) };
        ws1.getCell('N29').value = { formula: 'N18/N4*100', result: parseFloat(stats.noReopenRate) };
        ws1.getCell('N30').value = { formula: 'N19/N4*100', result: parseFloat(stats.reopenRate) };
        ws1.getCell('N31').value = { formula: 'N6/N4*100', result: parseFloat(stats.unplannedTaskRate) };
        ws1.getCell('N32').value = { formula: 'N9/N7*100', result: parseFloat(stats.spentTimeVsWorkingHoursRate) };
        ws1.getCell('M33').value = null;
        ws1.getCell('N33').value = null;
        ws1.getCell('N34').value = { formula: 'N10/N9*100', result: parseFloat(stats.plannedSpentTimeVsTotalSpentTimeRate) };
        ws1.getCell('N35').value = { formula: 'N11/N9*100', result: parseFloat(stats.unplannedSpentTimeVsTotalSpentTimeRate) };

        // 5. Cập nhật Sheet 2 ("Chấm điểm KPI")
        if (ws2) {
            ws2.getCell('F15').value = parseFloat(stats.noEstimateRate) / 100;
            ws2.getCell('G15').value = getAttitudeScore(parseFloat(stats.noEstimateRate));

            ws2.getCell('F20').value = parseFloat(stats.noStartDateRate) / 100;
            ws2.getCell('G20').value = getAttitudeScore(parseFloat(stats.noStartDateRate));

            ws2.getCell('F25').value = parseFloat(stats.noDueDateRate) / 100;
            ws2.getCell('G25').value = getAttitudeScore(parseFloat(stats.noDueDateRate));

            ws2.getCell('F30').value = parseFloat(stats.noSpentRate) / 100;
            ws2.getCell('G30').value = getAttitudeScore(parseFloat(stats.noSpentRate));

            ws2.getCell('F35').value = parseFloat(stats.spentTimeVsWorkingHoursRate) / 100;
            ws2.getCell('G35').value = getVolumeScore(parseFloat(stats.spentTimeVsWorkingHoursRate));

            ws2.getCell('F40').value = parseFloat(stats.lateRate) / 100;
            ws2.getCell('G40').value = getQualityScore(parseFloat(stats.lateRate));

            ws2.getCell('F45').value = parseFloat(stats.reopenRate) / 100;
            ws2.getCell('G45').value = getQualityScore(parseFloat(stats.reopenRate));

            const totalScore = (
                ws2.getCell('G15').value * 0.25 +
                ws2.getCell('G20').value * 0.25 +
                ws2.getCell('G25').value * 0.25 +
                ws2.getCell('G30').value * 0.25 +
                ws2.getCell('G35').value * 3 +
                ws2.getCell('G40').value * 3 +
                ws2.getCell('G45').value * 3
            ) / 10;
            ws2.getCell('G50').value = {
                formula: '(E15*G15+E20*G20+E25*G25+E30*G30+E35*G35+E40*G40+E45*G45)/10',
                result: parseFloat(totalScore.toFixed(2))
            };
        }

        ws1.pageSetup.printArea = `A1:N${Math.max(ws1.rowCount, curRow - 1)}`;
        const buffer = await wb.xlsx.writeBuffer();
        triggerExcelDownload(buffer, `KPI_Thang_${String(selMonth).padStart(2, '0')}-${selYear}.xlsx`);
    }


    async function saveKpiInfo(params) {
        await chrome.storage.local.set({ ['KpiInfo']: params });
    }

    async function removeKpiInfo() {
        await chrome.storage.local.remove('KpiInfo');
    }

    async function saveKpiStats(params) {
        await chrome.storage.local.set({ ['KpiStats']: params });
    }


})();
}

// Collapsible Section Controls
function setControlsCollapsed(collapsed, customElements = null) {
    const body = customElements?.controlsBody || (typeof document !== 'undefined' ? document.getElementById('controlsBody') : null);
    const arrow = customElements?.controlsCollapseArrow || (typeof document !== 'undefined' ? document.getElementById('controlsCollapseArrow') : null);
    if (body) {
        body.style.display = collapsed ? 'none' : 'flex';
    }
    if (arrow) {
        arrow.textContent = collapsed ? '▼' : '▲';
    }
    return collapsed;
}

// Daily Timesheet Audit Calculation & Rendering functions
function normalizeDateToIso(dateVal) {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return '';
        const y = dateVal.getFullYear();
        const m = String(dateVal.getMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    const str = String(dateVal).trim();
    const isoMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
    }
    const dmyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        const first = parseInt(dmyMatch[1], 10);
        const second = parseInt(dmyMatch[2], 10);
        const y = dmyMatch[3];
        if (first <= 12 && second > 12) {
            return `${y}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        }
        return `${y}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return '';
}

function calculateMonthlyTimesheet(items = [], selYear, selMonth, refDate = new Date(), leaveDaysMap = null) {
    let year, month;
    if (typeof selYear === 'string' && selYear.includes('-')) {
        const parts = selYear.split('-');
        year = Number(parts[0]);
        month = Number(parts[1]);
        if (selMonth && typeof selMonth === 'object' && !(selMonth instanceof Date)) {
            leaveDaysMap = selMonth;
        } else if (selMonth instanceof Date) {
            refDate = selMonth;
        }
    } else {
        year = Number(selYear);
        month = Number(selMonth);
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    const refIso = normalizeDateToIso(refDate || new Date());

    // Index items by date
    const itemsByDate = new Map();
    (items || []).forEach(item => {
        if (!item) return;
        if (Array.isArray(item.timelogs) && item.timelogs.length > 0) {
            item.timelogs.forEach(tl => {
                const dateIso = getTimelogDate(tl);
                if (!dateIso) return;
                if (!itemsByDate.has(dateIso)) {
                    itemsByDate.set(dateIso, []);
                }
                itemsByDate.get(dateIso).push({
                    ...item,
                    spent: tl.timeSpentHours !== undefined ? tl.timeSpentHours : (tl.timeSpent ? tl.timeSpent / 3600 : 0),
                    timelogId: tl.id
                });
            });
        } else {
            const rawDate = item.dateIso || item.addedAt || item.createAt || item.spentAt || item.createdAt;
            const dateIso = getTimelogDate({ spentAt: rawDate });
            if (!dateIso) return;
            if (!itemsByDate.has(dateIso)) {
                itemsByDate.set(dateIso, []);
            }
            itemsByDate.get(dateIso).push(item);
        }
    });

    const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof window !== 'undefined' && window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en');
    const dayNames = isEn ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month - 1, d);
        const dateIso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = dateObj.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const dayName = dayNames[dayOfWeek];
        const isFuture = dateIso > refIso;
        const isPastOrToday = !isFuture;
        let isLeave = false;
        let leaveValue = 0;
        let leaveType = 'none';
        let leaveReason = '';
        let targetHours = isWeekend ? 0 : 8.0;

        if (leaveDaysMap && leaveDaysMap[dateIso]) {
            const leave = leaveDaysMap[dateIso];
            leaveValue = typeof leave === 'number' ? leave : (leave.value !== undefined ? leave.value : (leave.type === 'half' ? 0.5 : 1.0));
            isLeave = leaveValue > 0;
            leaveType = leave.type || (leaveValue === 0.5 ? 'half' : leaveValue > 0 ? 'full' : 'none');
            leaveReason = leave.reason || '';
            if (!isWeekend) {
                targetHours = Math.max(0, Math.round((8.0 - (leaveValue * 8.0)) * 10) / 10);
            }
        }

        const dayTasks = itemsByDate.get(dateIso) || [];
        let totalSpentOnDay = 0;
        dayTasks.forEach(task => {
            const val = typeof task.spent === 'number'
                ? task.spent
                : (typeof task.spentTime === 'number'
                    ? task.spentTime
                    : (parseFloat(task.spent || task.spentTime || task.totalSpentTime) || 0));
            totalSpentOnDay += val;
        });
        const spentHours = Math.round(totalSpentOnDay * 10) / 10;

        let status;
        let diffHours = 0;

        if (isFuture) {
            status = 'future';
            diffHours = 0;
        } else if (isWeekend) {
            status = 'weekend';
            diffHours = Math.round(spentHours * 10) / 10;
        } else if (leaveValue >= 1.0) {
            status = 'leave';
            diffHours = spentHours;
        } else if (leaveValue === 0.5) {
            diffHours = Math.round((spentHours - 4.0) * 10) / 10;
            if (spentHours >= 4.0) {
                status = 'leave-half-success';
            } else if (spentHours > 0) {
                status = 'warning';
            } else {
                status = 'danger';
            }
        } else {
            diffHours = Math.round((spentHours - 8.0) * 10) / 10;
            if (spentHours >= 8.0) {
                status = 'success';
            } else if (spentHours > 0) {
                status = 'warning';
            } else {
                status = 'danger';
            }
        }
        if (Object.is(diffHours, -0)) diffHours = 0;

        days.push({
            dateIso,
            dayNum: d,
            dayOfWeek,
            dayName,
            spentHours,
            targetHours,
            isWeekend,
            isFuture,
            isPastOrToday,
            isLeave,
            leaveValue,
            leaveType,
            leaveReason,
            isOvertime: leaveDaysMap?.[dateIso]?.overtime === true,
            status,
            diffHours,
            taskItems: dayTasks
        });
    }

    const baseWorkingDays = days.filter(d => !d.isWeekend).length;
    const totalLeaveDays = Math.round(days.filter(d => !d.isWeekend && d.isLeave).reduce((sum, d) => sum + d.leaveValue, 0) * 10) / 10;
    const totalWorkingDays = Math.max(0, Math.round((baseWorkingDays - totalLeaveDays) * 10) / 10);
    const totalTargetHours = Math.round(days.filter(d => !d.isWeekend).reduce((sum, d) => sum + d.targetHours, 0) * 10) / 10;
    const totalSpentHours = Math.round(days.reduce((sum, d) => sum + d.spentHours, 0) * 10) / 10;
    const deficitDaysCount = days.filter(d => d.isPastOrToday && !d.isWeekend && d.spentHours < d.targetHours && d.targetHours > 0).length;
    const achievementRate = totalTargetHours > 0
        ? Math.round((totalSpentHours / totalTargetHours) * 1000) / 10
        : (totalSpentHours > 0 ? 100 : 0);

    return {
        days,
        totalWorkingDays,
        totalTargetHours,
        totalSpentHours,
        totalHours: totalSpentHours,
        totalLeaveDays,
        deficitDaysCount,
        achievementRate
    };
}

function renderDailyTimesheet(timesheetData) {
    if (!timesheetData || typeof document === 'undefined') return;

    const chipsContainer = document.getElementById('timesheetSummaryChips');
    const gridContainer = document.getElementById('timesheetCalendarGrid');

    const _tr = (typeof t === 'function' ? t : (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t : (k => k)));
    const daysUnit = _tr('daysUnit');

    if (chipsContainer) {
        chipsContainer.innerHTML = '';
        const { totalWorkingDays, totalTargetHours, totalSpentHours, deficitDaysCount, achievementRate } = timesheetData;

        // 1. Ngày làm việc
        const chipDays = document.createElement('div');
        chipDays.className = 'timesheet-chip chip-info';
        chipDays.innerHTML = `📅 ${_tr('workingDaysLabel')}: <strong>${totalWorkingDays} ${daysUnit}</strong>`;
        chipsContainer.appendChild(chipDays);

        // 2. Tổng giờ / Chỉ tiêu
        const chipHours = document.createElement('div');
        chipHours.className = 'timesheet-chip chip-info';
        chipHours.innerHTML = `⏱️ ${_tr('totalHoursLabel')}: <strong>${totalSpentHours}h / ${totalTargetHours}h</strong>`;
        chipsContainer.appendChild(chipHours);

        // 3. Tỷ lệ đạt
        const chipRate = document.createElement('div');
        let rateClass = 'chip-success';
        if (achievementRate < 80) rateClass = 'chip-danger';
        else if (achievementRate < 100) rateClass = 'chip-warning';
        chipRate.className = `timesheet-chip ${rateClass}`;
        chipRate.innerHTML = `🎯 ${_tr('achievementRateLabel')}: <strong>${achievementRate}%</strong>`;
        chipsContainer.appendChild(chipRate);

        // 4. Số ngày thiếu giờ
        const chipDeficit = document.createElement('div');
        if (deficitDaysCount === 0) {
            chipDeficit.className = 'timesheet-chip chip-success';
            chipDeficit.innerHTML = `✅ ${_tr('noDeficitLabel')}`;
        } else {
            chipDeficit.className = 'timesheet-chip chip-danger';
            chipDeficit.innerHTML = `⚠️ ${_tr('deficitDaysLabel')}: <strong>${deficitDaysCount} ${daysUnit}</strong>`;
        }
        chipsContainer.appendChild(chipDeficit);

        // 5. Số ngày nghỉ phép / lễ (nếu có)
        if (timesheetData.totalLeaveDays > 0) {
            const chipLeave = document.createElement('div');
            chipLeave.className = 'timesheet-chip chip-leave';
            chipLeave.innerHTML = `🏖️ ${_tr('leaveDaysLabel')}: <strong>${timesheetData.totalLeaveDays} ${daysUnit} (-${Math.round(timesheetData.totalLeaveDays * 8 * 10) / 10}h)</strong>`;
            chipsContainer.appendChild(chipLeave);
        }
    }

    if (gridContainer) {
        gridContainer.innerHTML = '';
        (timesheetData.days || []).forEach(day => {
            const cell = document.createElement('div');
            cell.className = `timesheet-day-cell day-${day.status}`;
            cell.setAttribute('data-date', day.dateIso);
            cell.style.cursor = 'pointer';

            const header = document.createElement('div');
            header.className = 'timesheet-day-cell-header';

            const numSpan = document.createElement('span');
            numSpan.className = 'timesheet-day-num';
            numSpan.textContent = String(day.dayNum);

            const weekdaySpan = document.createElement('span');
            weekdaySpan.className = 'timesheet-day-weekday';
            weekdaySpan.textContent = day.dayName;

            header.appendChild(numSpan);
            if (day.isOvertime) {
                const overtimeBadge = document.createElement('span');
                overtimeBadge.className = 'timesheet-overtime-badge';
                overtimeBadge.textContent = '🌙 OT';
                overtimeBadge.title = _tr('dayOvertimeLabel', {}, '🌙 Có overtime');
                header.appendChild(overtimeBadge);
            }
            header.appendChild(weekdaySpan);
            cell.appendChild(header);

            const body = document.createElement('div');
            body.className = 'timesheet-day-body';

            const spentDiv = document.createElement('div');
            spentDiv.className = 'timesheet-day-spent';
            spentDiv.textContent = day.isFuture ? '—' : `${day.spentHours}h`;

            const diffDiv = document.createElement('div');
            diffDiv.className = 'timesheet-day-diff';
            if (day.isFuture) {
                diffDiv.textContent = '';
            } else if (day.isWeekend) {
                diffDiv.textContent = day.spentHours > 0 ? `+${day.spentHours}h` : '';
            } else if (day.status === 'leave') {
                diffDiv.textContent = day.spentHours > 0 ? `+${day.spentHours}h` : '';
            } else {
                if (day.diffHours > 0) {
                    diffDiv.textContent = `+${day.diffHours}h`;
                } else if (day.diffHours < 0) {
                    diffDiv.textContent = `${day.diffHours}h`;
                } else {
                    diffDiv.textContent = `+0h`;
                }
            }

            body.appendChild(spentDiv);
            body.appendChild(diffDiv);
            cell.appendChild(body);

            const statusDiv = document.createElement('div');
            statusDiv.className = 'timesheet-day-status';

            let statusIcon = '';
            let statusLabel = '';
            switch (day.status) {
                case 'leave':
                    statusIcon = '🏖️';
                    statusLabel = day.leaveReason ? `${_tr('timesheetLeave', {}, 'Nghỉ')}: ${day.leaveReason}` : _tr('timesheetLeaveFullDay', {}, 'Nghỉ cả ngày');
                    break;
                case 'leave-half-success':
                    statusIcon = '🌓';
                    statusLabel = day.leaveReason ? `${_tr('timesheetLeaveHalf', {}, 'Nghỉ (0.5d)')}: ${day.leaveReason}` : _tr('timesheetLeaveHalfSuccess', {}, 'Nghỉ 0.5d (Đủ 4h)');
                    break;
                case 'success':
                    statusIcon = '✅';
                    statusLabel = _tr('timesheetSuccess', {}, 'Đạt chuẩn');
                    break;
                case 'warning':
                    statusIcon = '⚠️';
                    statusLabel = _tr('timesheetDeficitHours', { hours: Math.abs(day.diffHours) }, `Thiếu ${Math.abs(day.diffHours)}h`);
                    break;
                case 'danger':
                    statusIcon = '❌';
                    statusLabel = day.targetHours === 4 ? _tr('timesheetNotLogged4h', {}, 'Chưa log (-4h)') : _tr('timesheetNotLogged8h', {}, 'Chưa log (-8h)');
                    break;
                case 'weekend':
                    statusIcon = '☕';
                    statusLabel = day.spentHours > 0 ? `+${day.spentHours}h` : _tr('timesheetWeekend', {}, 'Cuối tuần');
                    break;
                case 'future':
                default:
                    statusIcon = '⏳';
                    statusLabel = _tr('timesheetFuture', {}, 'Chưa tới');
                    break;
            }

            statusDiv.innerHTML = `<span>${statusIcon}</span> <span>${statusLabel}</span>`;
            cell.appendChild(statusDiv);

            const clickPrompt = _tr('clickToViewDetailOrLeave', {}, '👉 Bấm để xem chi tiết hoặc thiết lập ngày nghỉ');
            if (day.taskItems && day.taskItems.length > 0) {
                const headerLine = _tr('timesheetDayTooltip', {
                    dayName: day.dayName,
                    dayNum: day.dayNum,
                    month: day.dateIso.slice(5, 7),
                    spent: day.spentHours,
                    count: day.taskItems.length
                }, `${day.dayName}, ngày ${day.dayNum}/${day.dateIso.slice(5, 7)} - Đã log: ${day.spentHours}h (${day.taskItems.length} công việc):`);
                const tooltipLines = [
                    headerLine,
                    '─────────────────────────',
                    ...day.taskItems.map((it, idx) => {
                        const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof getLanguage === 'function' && getLanguage() === 'en');
                        const title = it.title || it.taskUrl || (isEn ? `Work item #${idx + 1}` : `Công việc #${idx + 1}`);
                        const sp = typeof it.spent === 'number' ? it.spent : (parseFloat(it.spent) || 0);
                        return `• [${sp}h] ${title}`;
                    }),
                    '─────────────────────────',
                    clickPrompt
                ];
                cell.title = tooltipLines.join('\n');
            } else {
                cell.title = `${day.dayName}, ${day.dayNum}/${day.dateIso.slice(5, 7)}\n${clickPrompt}`;
            }

            cell.addEventListener('click', () => {
                if (typeof openDayDetailModal === 'function') {
                    openDayDetailModal(day);
                }
            });

            gridContainer.appendChild(cell);
        });
    }
}

// --- Leave Days & Day Detail Modal ---

async function getLeaveDays() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => {
            chrome.storage.local.get(['KpiLeaveDays'], result => {
                resolve(result['KpiLeaveDays'] || {});
            });
        });
    } else if (typeof window !== 'undefined') {
        return window._kpiLeaveDays || {};
    }
    return {};
}

async function saveLeaveDay(dateIso, leaveInfo) {
    if (!dateIso) return {};
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => {
            chrome.storage.local.get(['KpiLeaveDays'], result => {
                const leaveMap = result['KpiLeaveDays'] || {};
                if (!leaveInfo || (!leaveInfo.overtime && (leaveInfo.type === 'none' || leaveInfo.value === 0))) {
                    delete leaveMap[dateIso];
                } else {
                    leaveMap[dateIso] = leaveInfo;
                }
                chrome.storage.local.set({ 'KpiLeaveDays': leaveMap }, () => {
                    if (typeof window !== 'undefined') window._kpiLeaveDays = leaveMap;
                    resolve(leaveMap);
                });
            });
        });
    } else if (typeof window !== 'undefined') {
        if (!window._kpiLeaveDays) window._kpiLeaveDays = {};
        if (!leaveInfo || (!leaveInfo.overtime && (leaveInfo.type === 'none' || leaveInfo.value === 0))) {
            delete window._kpiLeaveDays[dateIso];
        } else {
            window._kpiLeaveDays[dateIso] = leaveInfo;
        }
        return window._kpiLeaveDays;
    }
    return {};
}

function openDayDetailModal(day) {
    if (!day || typeof document === 'undefined') return;
    const modal = document.getElementById('dayDetailModal');
    if (!modal) return;

    window._currentModalDateIso = day.dateIso;

    // Header title
    const titleEl = document.getElementById('modalDayTitle');
    if (titleEl) {
        titleEl.textContent = _tr('modalDayDetailTitle', { date: day.dateIso, day: day.dayName }, `Chi tiết ngày ${day.dateIso} (${day.dayName})`);
    }

    // Stats
    const spentEl = document.getElementById('modalDaySpent');
    if (spentEl) spentEl.textContent = `${day.spentHours}h`;

    const targetEl = document.getElementById('modalDayTarget');
    if (targetEl) targetEl.textContent = `${day.targetHours}h`;

    const badgeEl = document.getElementById('modalDayStatusBadge');
    if (badgeEl) {
        if (day.isLeave) {
            badgeEl.textContent = day.leaveType === 'half' ? _tr('leaveDayHalfBadge', {}, 'Nghỉ 0.5 ngày') : _tr('leaveDayFullBadge', {}, 'Nghỉ cả ngày (1.0d)');
            badgeEl.style.background = 'rgba(168, 85, 247, 0.15)';
            badgeEl.style.color = '#7e22ce';
        } else if (day.status === 'success') {
            badgeEl.textContent = _tr('timesheetSuccessStandard', {}, 'Đạt chuẩn (>= 8h)');
            badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
            badgeEl.style.color = '#047857';
        } else if (day.status === 'warning') {
            badgeEl.textContent = _tr('timesheetDeficitHours', { hours: Math.abs(day.diffHours) }, `Thiếu ${Math.abs(day.diffHours)}h`);
            badgeEl.style.background = 'rgba(245, 158, 11, 0.15)';
            badgeEl.style.color = '#b45309';
        } else if (day.status === 'danger') {
            badgeEl.textContent = _tr('timesheetNotLogged0h', {}, 'Chưa log (0h)');
            badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
            badgeEl.style.color = '#b91c1c';
        } else if (day.status === 'weekend') {
            badgeEl.textContent = _tr('timesheetWeekend', {}, 'Cuối tuần');
            badgeEl.style.background = 'rgba(100, 116, 139, 0.15)';
            badgeEl.style.color = '#475569';
        } else {
            badgeEl.textContent = _tr('timesheetFuture', {}, 'Chưa tới');
            badgeEl.style.background = 'rgba(148, 163, 184, 0.15)';
            badgeEl.style.color = '#64748b';
        }
    }

    // Radio
    const radioNone = document.getElementById('radioLeaveNone');
    const radioHalf = document.getElementById('radioLeaveHalf');
    const radioFull = document.getElementById('radioLeaveFull');
    if (day.isLeave && day.leaveType === 'half') {
        if (radioHalf) radioHalf.checked = true;
    } else if (day.isLeave && (day.leaveType === 'full' || day.leaveValue === 1.0)) {
        if (radioFull) radioFull.checked = true;
    } else {
        if (radioNone) radioNone.checked = true;
    }

    const overtimeInput = document.getElementById('modalDayOvertime');
    if (overtimeInput) overtimeInput.checked = day.isOvertime === true;

    // Reason
    const reasonInput = document.getElementById('modalLeaveReason');
    if (reasonInput) {
        reasonInput.value = day.leaveReason || '';
    }

    // Task list
    const countEl = document.getElementById('modalTasksCount');
    if (countEl) countEl.textContent = String(day.taskItems ? day.taskItems.length : 0);

    const listEl = document.getElementById('modalTasksList');
    if (listEl) {
        listEl.innerHTML = '';
        if (day.taskItems && day.taskItems.length > 0) {
            day.taskItems.forEach(it => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'modal-task-item';
                const sp = typeof it.spent === 'number' ? it.spent : (parseFloat(it.spent) || 0);
                const title = it.title || it.taskUrl || _tr('tableTasks', {}, 'Công việc');
                const titleSpan = document.createElement('span');
                titleSpan.className = 'task-item-title';
                titleSpan.title = title;
                titleSpan.textContent = title;
                const spentSpan = document.createElement('span');
                spentSpan.className = 'task-item-spent';
                spentSpan.textContent = `${sp}h`;
                itemDiv.appendChild(titleSpan);
                itemDiv.appendChild(spentSpan);
                listEl.appendChild(itemDiv);
            });
        } else {
            listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px; text-align: center;">' + _tr('noTasksRecordedForDay', {}, 'Chưa có công việc nào ghi nhận trong ngày này.') + '</div>';
        }
    }

    modal.style.display = 'flex';
}

function initDayDetailModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('dayDetailModal');
    if (!modal || modal._modalInitialized) return;
    modal._modalInitialized = true;

    const closeBtn = document.getElementById('closeDayModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    const saveBtn = document.getElementById('saveLeaveDayBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const dateIso = window._currentModalDateIso;
            if (!dateIso) return;

            const selectedRadio = document.querySelector('input[name="modalLeaveType"]:checked');
            const selectedType = selectedRadio ? selectedRadio.value : 'none';
            const reasonInput = document.getElementById('modalLeaveReason');
            const reason = reasonInput ? reasonInput.value.trim() : '';

            let leaveInfo = null;
            if (selectedType === 'full') {
                leaveInfo = { value: 1.0, type: 'full', reason: reason };
            } else if (selectedType === 'half') {
                leaveInfo = { value: 0.5, type: 'half', reason: reason };
            } else {
                leaveInfo = { value: 0, type: 'none', reason: '' };
            }

            leaveInfo.overtime = document.getElementById('modalDayOvertime')?.checked === true;
            await saveLeaveDay(dateIso, leaveInfo);
            modal.style.display = 'none';

            // Refresh analytics
            const monthSelectEl = document.getElementById('monthSelect');
            await refreshMonthlyAnalytics(monthSelectEl ? monthSelectEl.value : null);
        });
    }
}

// --- Monthly Chart.js Data Aggregation & Rendering ---

const analyticsCharts = {
    weeklyEstSpent: null,
    taskType: null,
    taskStatus: null
};

function getWeeksForMonth(selYear, selMonth, lang) {
    const isEn = (lang === 'en') || (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof window !== 'undefined' && window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en');
    if (typeof getWeeksOfMonth === 'function') {
        return getWeeksOfMonth(selYear, selMonth, isEn ? 'en' : 'vi');
    }
    const weeks = [];
    const firstDay = new Date(selYear, selMonth - 1, 1);
    const lastDay = new Date(selYear, selMonth, 0);

    const getMon = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };
    const toIso = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
    };

    let currentMonday = getMon(firstDay);
    let weekNum = 1;
    while (currentMonday <= lastDay) {
        const sunday = new Date(currentMonday);
        sunday.setDate(sunday.getDate() + 6);

        const start = toIso(currentMonday);
        const end = toIso(sunday);
        const startDisplay = `${String(currentMonday.getDate()).padStart(2, '0')}/${String(currentMonday.getMonth() + 1).padStart(2, '0')}`;
        const endDisplay = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;
        const weekPrefix = isEn ? 'Week' : 'Tuần';
        const label = `${weekPrefix} ${weekNum} (${startDisplay} - ${endDisplay})`;

        weeks.push({ weekNum, start, end, startDisplay, endDisplay, label });
        currentMonday.setDate(currentMonday.getDate() + 7);
        weekNum++;
    }
    return weeks;
}

function calculateMonthlyChartData(items = [], selYear, selMonth, refDate = new Date()) {
    let year, month;
    if (typeof selYear === 'string' && selYear.includes('-')) {
        const parts = selYear.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        if (selMonth instanceof Date || (typeof selMonth === 'string' && selMonth.includes('-'))) {
            refDate = selMonth;
        }
    } else if (selYear && selMonth !== undefined) {
        year = parseInt(selYear, 10);
        month = parseInt(selMonth, 10);
    } else if (selYear && !selMonth) {
        year = parseInt(selYear, 10);
        month = new Date().getMonth() + 1;
    } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
    }


    const isEn = (typeof activeLang !== 'undefined' && activeLang === 'en') || (typeof window !== 'undefined' && window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en');
    const monthRange = getPeriodDateRange('all_month', `${year}-${String(month).padStart(2, '0')}`);
    const weeks = getWeeksForMonth(year, month, isEn ? 'en' : 'vi').map(week => ({
        ...week,
        start: week.start < monthRange.start ? monthRange.start : week.start,
        end: week.end > monthRange.end ? monthRange.end : week.end
    }));
    const labels = weeks.map(w => {
        if (w.label) {
            return w.label.replace(' (Tuần này)', '').replace(' (This week)', '');
        }
        return isEn ? `Week ${w.weekNum}` : `Tuần ${w.weekNum}`;
    });
    const spentHours = new Array(weeks.length).fill(0);

    let plannedCount = 0;
    let unplannedCount = 0;
    let inTimeCount = 0;
    let lateCount = 0;
    let openCount = 0;

    const safeItems = Array.isArray(items) ? items : [];

    safeItems.forEach(item => {
        if (!item) return;

        // Determine if item belongs to the selected month
        const rawDate = item.dateIso || item.addedAt || item.createAt || item.spentAt || item.startDate || item.createdAt;
        const itemIso = normalizeDateToIso(rawDate);
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const firstWeekStart = weeks.length > 0 ? weeks[0].start : '';
        const lastWeekEnd = weeks.length > 0 ? weeks[weeks.length - 1].end : '';
        const hasTimelogs = Array.isArray(item.timelogs) && item.timelogs.length > 0;
        const hasTimelogInMonth = hasTimelogs && item.timelogs.some(tl => {
            const tlIso = getTimelogDate(tl);
            return tlIso && (tlIso.startsWith(monthPrefix) || (firstWeekStart && lastWeekEnd && tlIso >= firstWeekStart && tlIso <= lastWeekEnd));
        });

        // If item has a date, verify it's within the month or month weeks
        if (itemIso && !hasTimelogInMonth) {
            const inMonthRange = itemIso.startsWith(monthPrefix) || (firstWeekStart && lastWeekEnd && itemIso >= firstWeekStart && itemIso <= lastWeekEnd);
            if (!inMonthRange && !isItemActiveInFilter(item, 'all_month', monthPrefix)) return;
        }

        // Planned vs Unplanned counts
        const isUnplanned = Boolean(item.isUnplanned || (item.type && item.type.toLowerCase().includes('phát sinh')));
        if (isUnplanned) {
            unplannedCount++;
        } else {
            plannedCount++;
        }

        // Status counts:
        // inTimeCount: completed on time (item.isLate === false && item.state !== 'opened')
        // lateCount: late items (item.isLate === true)
        // openCount: open items (item.state === 'opened' || item.isOpen)
        const isLate = (typeof isItemLate === 'function') ? isItemLate(item) : ((item.isLate === true) || (item.progress === 'Trễ hạn'));
        const isOpen = (item.state === 'opened') || (item.isOpen === true) || (item.progress === 'Đang thực hiện');

        if (isLate) {
            lateCount++;
        } else if (isOpen) {
            openCount++;
        } else {
            inTimeCount++;
        }

        weeks.forEach((week, index) => {
            spentHours[index] += getItemSpentInRange(item, week.start, week.end);
        });
    });

    // Format numbers
    for (let i = 0; i < weeks.length; i++) {
        spentHours[i] = parseFloat(spentHours[i].toFixed(2));
    }

    return {
        weeklyData: {
            labels,
            spentHours
        },
        taskTypeData: {
            plannedCount,
            unplannedCount
        },
        taskStatusData: {
            inTimeCount,
            lateCount,
            openCount
        }
    };
}

function renderMonthlyCharts(chartData) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded. Skipping monthly charts rendering.');
        return;
    }

    if (!chartData || !chartData.weeklyData || !chartData.taskTypeData || !chartData.taskStatusData) {
        console.warn('Invalid chartData provided to renderMonthlyCharts.');
        return;
    }

    // Safely destroy existing chart instances before re-creating
    ['weeklyEstSpent', 'taskType', 'taskStatus'].forEach(key => {
        if (analyticsCharts[key]) {
            try {
                analyticsCharts[key].destroy();
            } catch (err) {
                console.warn(`Failed to destroy chart instance ${key}:`, err);
            }
            analyticsCharts[key] = null;
        }
    });

    if (typeof document === 'undefined') return;

    // Helper to safely get canvas and destroy any attached Chart instance
    const getCanvas = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        if (typeof Chart.getChart === 'function') {
            const existing = Chart.getChart(el);
            if (existing) {
                try { existing.destroy(); } catch (e) {}
            }
        }
        return el;
    };

    // 1. Grouped Bar Chart: Estimate vs Spent by Week
    const canvasEstSpent = getCanvas('chartWeeklyEstSpent');
    if (canvasEstSpent) {
        analyticsCharts.weeklyEstSpent = new Chart(canvasEstSpent, {
            type: 'bar',
            data: {
                labels: chartData.weeklyData.labels,
                datasets: [
                    {
                        label: _tr('chartLabelSpent', {}, 'Thực tế (Spent)'),
                        data: chartData.weeklyData.spentHours,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.raw}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: _tr('chartAxisHours', {}, 'Số giờ (h)') }
                    }
                }
            }
        });
    }

    // 2. Doughnut Chart: Planned vs Unplanned
    const canvasType = getCanvas('chartTaskType');
    if (canvasType) {
        analyticsCharts.taskType = new Chart(canvasType, {
            type: 'doughnut',
            data: {
                labels: [_tr('chartLabelPlanned', {}, 'Kế hoạch (Planned)'), _tr('chartLabelUnplanned', {}, 'Phát sinh (Unplanned)')],
                datasets: [{
                    data: [
                        chartData.taskTypeData.plannedCount,
                        chartData.taskTypeData.unplannedCount
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(245, 158, 11, 0.85)'
                    ],
                    borderColor: ['#3b82f6', '#f59e0b'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw || 0;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return _tr('chartTooltipTasks', { label: context.label, val, pct }, ` ${context.label}: ${val} công việc (${pct}%)`);
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. Doughnut Chart: Task Status (In-time vs Late vs Open)
    const canvasStatus = getCanvas('chartTaskStatus');
    if (canvasStatus) {
        analyticsCharts.taskStatus = new Chart(canvasStatus, {
            type: 'doughnut',
            data: {
                labels: [_tr('chartLabelInTime', {}, 'Đúng hạn (In-time)'), _tr('chartLabelLate', {}, 'Trễ hạn (Late)'), _tr('chartLabelOpen', {}, 'Đang mở (Open)')],
                datasets: [{
                    data: [
                        chartData.taskStatusData.inTimeCount,
                        chartData.taskStatusData.lateCount,
                        chartData.taskStatusData.openCount
                    ],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                        'rgba(99, 102, 241, 0.85)'
                    ],
                    borderColor: ['#10b981', '#ef4444', '#6366f1'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw || 0;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return _tr('chartTooltipTasks', { label: context.label, val, pct }, ` ${context.label}: ${val} công việc (${pct}%)`);
                            }
                        }
                    }
                }
            }
        });
    }

}

function updateAnalyticsMonthBadge(selectedMonth) {
    const badge = document.getElementById('tabAnalyticsMonthBadge');
    if (!badge) return;
    const monthSelectEl = document.getElementById('monthSelect');
    let monthVal = selectedMonth || (monthSelectEl ? monthSelectEl.value : '');
    if (!monthVal) {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthVal = `${d.getFullYear()}-${m}`;
    }
    const parts = monthVal.split('-');
    if (parts.length >= 2) {
        badge.textContent = _tr('monthBadgeLabel', { month: parts[1].padStart(2, '0'), year: parts[0] }, `Tháng ${parts[1].padStart(2, '0')}/${parts[0]}`);
    }
}

function initTabs() {
    const tabWorkItemsBtn = document.getElementById('tabWorkItemsBtn');
    const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
    const workItemsContent = document.getElementById('workItemsTabContent');
    const analyticsContent = document.getElementById('analyticsTabContent');

    if (!tabWorkItemsBtn || !tabAnalyticsBtn) return;
    if (tabWorkItemsBtn._tabsInitialized) return;
    tabWorkItemsBtn._tabsInitialized = true;

    if (typeof initDayDetailModal === 'function') {
        initDayDetailModal();
    }

    tabWorkItemsBtn.addEventListener('click', () => {
        tabWorkItemsBtn.classList.add('active');
        tabAnalyticsBtn.classList.remove('active');
        if (workItemsContent) workItemsContent.style.display = '';
        if (analyticsContent) analyticsContent.style.display = 'none';
    });

    tabAnalyticsBtn.addEventListener('click', async () => {
        tabAnalyticsBtn.classList.add('active');
        tabWorkItemsBtn.classList.remove('active');
        if (workItemsContent) workItemsContent.style.display = 'none';
        if (analyticsContent) analyticsContent.style.display = 'flex';

        await refreshMonthlyAnalytics();
    });
}

function renderMonthlyKpiSummaryCards(monthItems = [], selYear, selMonth, timesheetData = null) {
    const container = document.getElementById('monthlyKpiSummaryCards');
    if (!container) return;

    let year = Number(selYear);
    let month = Number(selMonth);
    if (typeof selYear === 'string' && selYear.includes('-')) {
        const parts = selYear.split('-');
        year = Number(parts[0]);
        month = Number(parts[1]);
    } else if (!year || !month) {
        const monthSelectEl = document.getElementById('monthSelect');
        const monthVal = monthSelectEl ? monthSelectEl.value : new Date().toISOString().slice(0, 7);
        const parts = monthVal.split('-');
        year = Number(parts[0]);
        month = Number(parts[1]);
    }

    const monthRange = getPeriodDateRange('all_month', `${year}-${String(month).padStart(2, '0')}`);
    const items = Array.isArray(monthItems) ? monthItems : [];
    const workItems = items.filter(it => !it.isMR);
    const mrItems = items.filter(it => !!it.isMR);

    const totalWorkItems = workItems.length;
    const totalMRs = mrItems.length;

    let totalSpent = 0;
    let plannedCount = 0;
    let unplannedCount = 0;
    let inTimeCount = 0;

    workItems.forEach(item => {
        const spent = getItemSpentInRange(item, monthRange.start, monthRange.end);
        totalSpent += spent;

        const isUnplanned = item.isUnplanned === true || item.type === 'Phát sinh' || item.taskType === 'Phát sinh';
        if (isUnplanned) {
            unplannedCount++;
        } else {
            plannedCount++;
        }

        const isLate = (typeof isItemLate === 'function') ? isItemLate(item) : (item.isLate === true || item.progress === 'Trễ hạn');
        if (!isLate) inTimeCount++;
    });

    let mrClosedCount = 0;
    mrItems.forEach(mr => {
        const spent = getItemSpentInRange(mr, monthRange.start, monthRange.end);
        totalSpent += spent;
        const state = (mr.state || '').toLowerCase();
        if (state === 'closed' || state === 'merged') {
            mrClosedCount++;
        }
    });

    const daysInMonth = (year && month) ? new Date(year, month, 0).getDate() : 30;
    let workingDays = timesheetData ? timesheetData.totalWorkingDays : 0;
    if (!timesheetData) {
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
        }
    }
    const targetHours = timesheetData ? timesheetData.totalTargetHours : (workingDays * 8.0);
    const achievementRate = targetHours > 0 ? Math.round((totalSpent / targetHours) * 1000) / 10 : 0;

    const onTimeRate = totalWorkItems > 0 ? Math.round((inTimeCount / totalWorkItems) * 1000) / 10 : (totalWorkItems === 0 ? 100 : 0);
    const plannedRate = totalWorkItems > 0 ? Math.round((plannedCount / totalWorkItems) * 1000) / 10 : 0;
    const unplannedRate = totalWorkItems > 0 ? Math.round((unplannedCount / totalWorkItems) * 1000) / 10 : 0;

    const monthStats = calculateStatsForPeriod(items, 'all_month', `${year}-${String(month).padStart(2, '0')}`);
    monthStats.spentTimeVsWorkingHoursRate = targetHours > 0 ? parseFloat(((totalSpent / targetHours) * 100).toFixed(2)) : 0;
    const scoreInfo = calculateKpiScoreForStats(monthStats);
    const totalScore = scoreInfo.totalScore;
    const badge = { ...scoreInfo.badge };
    const ratingKey = totalWorkItems === 0 ? 'ratingNoData' : totalScore >= 4.5 ? 'ratingExcellent' : totalScore >= 3.8 ? 'ratingGood' : totalScore >= 3 ? 'ratingAverage' : 'ratingAttention';
    badge.text = _tr(ratingKey, {}, badge.text);

    const roundSpent = Math.round(totalSpent * 10) / 10;
    const leaveStr = (timesheetData && timesheetData.totalLeaveDays > 0)
        ? _tr('deductedLeaveSub', { days: timesheetData.totalLeaveDays }, ` • Đã trừ ${timesheetData.totalLeaveDays}d nghỉ`)
        : '';
    const mrSubtext = mrClosedCount > 0
        ? _tr('mrsClosedSub', { closed: mrClosedCount, total: totalMRs }, `${mrClosedCount}/${totalMRs} đã merge/đóng`)
        : _tr('mrsMonthSub', { total: totalMRs }, `${totalMRs} MRs trong tháng`);

    container.innerHTML = `
        <div class="analytics-stat-card stat-card-kpi">
            <div class="analytics-stat-icon">🎯</div>
            <div class="analytics-stat-info">
                <span class="analytics-stat-label">${_tr('monthlyKpiForecastLabel', {}, 'Dự báo Điểm KPI Tháng')}</span>
                <span class="analytics-stat-value">${totalWorkItems > 0 ? totalScore.toFixed(2) : '0.00'} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">/ 5.0</span></span>
                <span class="analytics-stat-sub">${badge.icon} ${badge.text} (${Math.round(totalScore * 20)}/100)</span>
            </div>
        </div>

        <div class="analytics-stat-card stat-card-hours">
            <div class="analytics-stat-icon">⏱️</div>
            <div class="analytics-stat-info">
                <span class="analytics-stat-label">${_tr('totalLoggedHoursTargetLabel', {}, 'Tổng Giờ Đã Log / Chỉ Tiêu')}</span>
                <span class="analytics-stat-value">${roundSpent}h <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">/ ${targetHours}h</span></span>
                <span class="analytics-stat-sub">${_tr('achievementSub', { pct: achievementRate, days: workingDays, leaveStr }, `Đạt <strong>${achievementRate}%</strong> chỉ tiêu (${workingDays} ngày làm việc${leaveStr})`)}</span>
            </div>
        </div>

        <div class="analytics-stat-card stat-card-intime">
            <div class="analytics-stat-icon">✅</div>
            <div class="analytics-stat-info">
                <span class="analytics-stat-label">${_tr('onTimeRateLabel', {}, 'Tỷ lệ đúng hạn')}</span>
                <span class="analytics-stat-value">${totalWorkItems > 0 ? onTimeRate + '%' : '—'}</span>
                <span class="analytics-stat-sub">${_tr('onTimeCountSub', { inTime: inTimeCount, total: totalWorkItems }, `${inTimeCount}/${totalWorkItems} công việc đúng hạn`)}</span>
            </div>
        </div>

        <div class="analytics-stat-card stat-card-mrs">
            <div class="analytics-stat-icon">🚀</div>
            <div class="analytics-stat-info">
                <span class="analytics-stat-label">${_tr('totalMergeRequestsLabel', {}, 'Tổng Merge Requests')}</span>
                <span class="analytics-stat-value">${totalMRs} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">MRs</span></span>
                <span class="analytics-stat-sub">${mrSubtext}</span>
            </div>
        </div>

        <div class="analytics-stat-card stat-card-plan">
            <div class="analytics-stat-icon">⚖️</div>
            <div class="analytics-stat-info">
                <span class="analytics-stat-label">${_tr('plannedVsUnplannedLabel', {}, 'Kế hoạch / Phát sinh')}</span>
                <span class="analytics-stat-value">${totalWorkItems > 0 ? `${plannedRate}% / ${unplannedRate}%` : '—'}</span>
                <span class="analytics-stat-sub">${_tr('plannedVsUnplannedSub', { planned: plannedCount, unplanned: unplannedCount }, `${plannedCount} kế hoạch • ${unplannedCount} phát sinh`)}</span>
            </div>
        </div>
    `;
}

async function refreshMonthlyAnalytics(selectedMonth = null, kpiData = null) {
    const monthSelectEl = document.getElementById('monthSelect');
    let monthVal = selectedMonth;
    if (!monthVal) {
        monthVal = monthSelectEl ? monthSelectEl.value : '';
    }
    if (!monthVal) {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthVal = `${d.getFullYear()}-${m}`;
    }

    const parts = monthVal.split('-');
    const selYear = Number(parts[0]);
    const selMonth = Number(parts[1]);

    updateAnalyticsMonthBadge(monthVal);

    // Retrieve items for the month
    let allItems = kpiData;
    if (!allItems) {
        if (typeof getStoredIds === 'function') {
            try {
                allItems = await getDashboardItems();
            } catch (e) {
                console.warn('Could not load KpiInfo for analytics:', e);
            }
        } else if (typeof window !== 'undefined' && window._lastKpiInfo) {
            allItems = window._lastKpiInfo;
        }
    }
    if (!Array.isArray(allItems)) allItems = [];

    // Filter items for the selected month
    const monthItems = allItems.filter(item => {
        if (!item) return false;
        if (typeof isItemActiveInFilter === 'function') {
            return isItemActiveInFilter(item, 'all_month', monthVal, '', '');
        }
        const addedIso = (item.addedAt || item.createAt || item.dateIso || '').slice(0, 10);
        return addedIso.startsWith(monthVal);
    });

    // 1. Load leave days from storage
    let leaveDaysMap = {};
    if (typeof getLeaveDays === 'function') {
        try {
            leaveDaysMap = await getLeaveDays();
        } catch (e) {
            console.warn('Could not load leave days:', e);
        }
    }

    // 2. Timesheet calculation and rendering
    let timesheetData = null;
    if (typeof calculateMonthlyTimesheet === 'function') {
        timesheetData = calculateMonthlyTimesheet(monthItems, selYear, selMonth, new Date(), leaveDaysMap);
        if (typeof renderDailyTimesheet === 'function') {
            renderDailyTimesheet(timesheetData);
        }
    }

    // 3. Render Monthly KPI Summary Cards
    renderMonthlyKpiSummaryCards(monthItems, selYear, selMonth, timesheetData);

    // 4. Chart data calculation and rendering
    if (typeof calculateMonthlyChartData === 'function' && typeof renderMonthlyCharts === 'function') {
        const chartData = calculateMonthlyChartData(monthItems, selYear, selMonth);
        renderMonthlyCharts(chartData);
    }
}

if (typeof window !== 'undefined') {
    window.setControlsCollapsed = setControlsCollapsed;
    window.initTabs = initTabs;
    window.updateAnalyticsMonthBadge = updateAnalyticsMonthBadge;
    window.renderMonthlyKpiSummaryCards = renderMonthlyKpiSummaryCards;
    window.refreshMonthlyAnalytics = refreshMonthlyAnalytics;
    window.calculateMonthlyTimesheet = calculateMonthlyTimesheet;
    window.renderDailyTimesheet = renderDailyTimesheet;
    window.calculateMonthlyChartData = calculateMonthlyChartData;
    window.renderMonthlyCharts = renderMonthlyCharts;
    window.analyticsCharts = analyticsCharts;
    window.getLeaveDays = getLeaveDays;
    window.saveLeaveDay = saveLeaveDay;
    window.openDayDetailModal = openDayDetailModal;
    window.initDayDetailModal = initDayDetailModal;
    window.getStatusBadgeText = getStatusBadgeText;
    window.isWidosoftGitlab = isWidosoftGitlab;
    window.updateExportButtonsVisibility = updateExportButtonsVisibility;
    window.isItemLate = typeof isItemLate === 'function' ? isItemLate : (window.isItemLate || null);
    window.getItemProgressStatus = typeof getItemProgressStatus === 'function' ? getItemProgressStatus : (window.getItemProgressStatus || null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getStatusBadgeText,
        setControlsCollapsed,
        initTabs,
        updateAnalyticsMonthBadge,
        renderMonthlyKpiSummaryCards,
        refreshMonthlyAnalytics,
        calculateMonthlyTimesheet,
        createEstimateVarianceCell,
        renderDailyTimesheet,
        calculateMonthlyChartData,
        renderMonthlyCharts,
        analyticsCharts,
        getLeaveDays,
        saveLeaveDay,
        openDayDetailModal,
        initDayDetailModal,
        isWidosoftGitlab,
        updateExportButtonsVisibility,
        isItemLate: typeof isItemLate === 'function' ? isItemLate : null,
        getItemProgressStatus: typeof getItemProgressStatus === 'function' ? getItemProgressStatus : null
    };
}

