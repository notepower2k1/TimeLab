// --- GitLab Issue Summary Modal Core Logic ---

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function roundToOneDecimal(val) {
    return Math.round((Number(val || 0) + Number.EPSILON) * 10) / 10;
}

let _contentIssueI18n;
function _getI18nEngine() {
    if (typeof t === 'function') return { t, getLanguage: (typeof getLanguage === 'function' ? getLanguage : (() => 'vi')) };
    if (typeof window !== 'undefined' && typeof window.t === 'function') {
        return { t: window.t, getLanguage: (typeof window.getLanguage === 'function' ? window.getLanguage : (() => 'vi')) };
    }
    if (!_contentIssueI18n && typeof require !== 'undefined') {
        try {
            _contentIssueI18n = require('./i18n.js');
        } catch (_) {}
    }
    if (_contentIssueI18n) return _contentIssueI18n;
    return null;
}

function _tr(key, params) {
    const engine = _getI18nEngine();
    if (engine && typeof engine.t === 'function') {
        return engine.t(key, params);
    }
    return key;
}

function calculateChildTaskMetrics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
            totalTasks: 0,
            totalEstimate: 0,
            totalSpent: 0,
            diffHours: 0,
            openTasks: 0,
            closedTasks: 0,
            lateTasks: 0,
            onTimeRate: 100,
            plannedCount: 0,
            unplannedCount: 0
        };
    }

    const validTasks = tasks.filter(Boolean);
    if (validTasks.length === 0) {
        return {
            totalTasks: 0,
            totalEstimate: 0,
            totalSpent: 0,
            diffHours: 0,
            openTasks: 0,
            closedTasks: 0,
            lateTasks: 0,
            onTimeRate: 100,
            plannedCount: 0,
            unplannedCount: 0
        };
    }

    let sumEstimate = 0;
    let sumSpent = 0;
    let openTasks = 0;
    let closedTasks = 0;
    let lateTasks = 0;
    let lateClosedTasks = 0;
    let plannedCount = 0;
    let unplannedCount = 0;

    validTasks.forEach(task => {
        const est = parseFloat(task.estimateHour) || 0;
        const spent = parseFloat(task.spentHour) || 0;

        sumEstimate += est;
        sumSpent += spent;

        const isLate = Boolean(task.isLate);
        if (isLate) {
            lateTasks++;
        }

        const state = (task.state || '').toLowerCase();
        if (state === 'opened') {
            openTasks++;
        } else if (state === 'closed') {
            closedTasks++;
            if (isLate) {
                lateClosedTasks++;
            }
        }

        if (task.isUnplanned) {
            unplannedCount++;
        } else {
            plannedCount++;
        }
    });

    const totalEstimate = roundToOneDecimal(sumEstimate);
    const totalSpent = roundToOneDecimal(sumSpent);
    const diffHours = roundToOneDecimal(totalEstimate - totalSpent);
    const onTimeRate = closedTasks > 0
        ? Math.max(0, Math.round(((closedTasks - lateClosedTasks) / closedTasks) * 100))
        : 100;

    return {
        totalTasks: validTasks.length,
        totalEstimate,
        totalSpent,
        diffHours,
        openTasks,
        closedTasks,
        lateTasks,
        onTimeRate,
        plannedCount,
        unplannedCount
    };
}

function filterMyChildTasks(items, userProfileUrl) {
    if (!Array.isArray(items)) return [];
    if (!userProfileUrl) return [...items];
    return items.filter(item => item && item.assigneeUrl === userProfileUrl);
}

function resolveTaskIid(task) {
    if (!task) return '';
    if (typeof task === 'string' || typeof task === 'number') {
        const str = String(task);
        const match = str.match(/(?:work_items|issues)\/(\d+)/);
        return match ? match[1] : str;
    }
    if (task.href) {
        const match = String(task.href).match(/(?:work_items|issues)\/(\d+)/);
        if (match) return match[1];
    }
    return String(task.id || '');
}

function shouldBackfillParent(currentTasks, backfilledSet, lastTitle, currentTitle) {
    if (!currentTasks || currentTasks.size === 0 || !currentTitle) return false;
    if (lastTitle !== currentTitle) return true;
    for (const taskId of currentTasks.keys()) {
        if (!backfilledSet || !backfilledSet.has(taskId)) {
            return true;
        }
    }
    return false;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const str = String(dateStr).trim();
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return str || '-';
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
}

function filterAndSortTasks(tasks, options = {}) {
    if (!tasks || !Array.isArray(tasks)) return [];
    const query = (options.query || '').trim().toLowerCase();
    const sortKey = options.sortKey || null;
    const sortOrder = options.sortOrder || null; // 'asc' | 'desc'

    let result = tasks.filter(Boolean);

    if (query) {
        result = result.filter(task => {
            const title = (task.title || '').toLowerCase();
            const id = String(task.id || '').toLowerCase();
            return title.includes(query) || id.includes(query);
        });
    }

    if (sortKey && (sortOrder === 'asc' || sortOrder === 'desc')) {
        result = [...result].sort((a, b) => {
            let comp = 0;
            if (sortKey === 'estimate') {
                comp = (a.estimateHour || 0) - (b.estimateHour || 0);
            } else if (sortKey === 'spent') {
                comp = (a.spentHour || 0) - (b.spentHour || 0);
            } else if (sortKey === 'diff') {
                comp = (a.diffHour || 0) - (b.diffHour || 0);
            } else if (sortKey === 'title') {
                comp = (a.title || '').localeCompare(b.title || '');
            } else if (sortKey === 'startDate' || sortKey === 'start') {
                comp = (a.startDate || '').localeCompare(b.startDate || '');
            } else if (sortKey === 'dueDate' || sortKey === 'due') {
                comp = (a.dueDate || '').localeCompare(b.dueDate || '');
            } else if (sortKey === 'createdAt' || sortKey === 'open') {
                comp = (a.createdAt || '').localeCompare(b.createdAt || '');
            } else if (sortKey === 'closedAt' || sortKey === 'close') {
                comp = (a.closedAt || '').localeCompare(b.closedAt || '');
            }
            return sortOrder === 'asc' ? comp : -comp;
        });
    }

    return result;
}

function extractTaskIdentifier(itemOrHref) {
    if (!itemOrHref) return { id: '', iid: '', href: '', normalizedHref: '' };
    let id = '';
    let href = '';
    if (typeof itemOrHref === 'string' || typeof itemOrHref === 'number') {
        const str = String(itemOrHref).trim();
        if (str.includes('/') || str.startsWith('http')) {
            href = str;
        } else {
            id = str;
        }
    } else if (typeof itemOrHref === 'object') {
        id = String(itemOrHref.id || itemOrHref.workItemId || itemOrHref.iid || '').trim();
        href = String(itemOrHref.href || itemOrHref.taskUrl || itemOrHref.webUrl || '').trim();
        if (!href && id && (id.includes('/') || id.startsWith('http'))) {
            href = id;
            id = '';
        }
    }

    let iid = '';
    if (href) {
        const m = href.match(/(?:work_items|issues)\/(\d+)/);
        if (m) iid = m[1];
    }
    if (!iid && id && /^\d+$/.test(id)) {
        iid = id;
    }

    const normalizedHref = href ? href.replace(/\/work_items\//, '/issues/').split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase() : '';
    return { id, iid, href, normalizedHref };
}

function isTaskInList(list, taskOrId, href = '') {
    if (!list) return false;
    const target = extractTaskIdentifier(
        typeof taskOrId === 'object' && taskOrId !== null
            ? taskOrId
            : (String(taskOrId || '').includes('/') ? taskOrId : { id: taskOrId, href })
    );
    if (!target.id && !target.iid && !target.normalizedHref) return false;

    const items = Array.isArray(list) ? list : (list instanceof Set ? Array.from(list) : []);
    return items.some(item => {
        if (!item || item.autoSyncIgnored) return false;
        const current = extractTaskIdentifier(item);
        if (target.normalizedHref && current.normalizedHref) return target.normalizedHref === current.normalizedHref;
        if (target.iid && current.iid && target.iid === current.iid) {
            return true;
        }
        if (target.id && current.id && target.id === current.id) {
            return true;
        }
        return false;
    });
}

const kpiWorkItemPlusSvg = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:-2px;"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const kpiWorkItemMinusSvg = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:-2px;"><path d="M1 8h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const svgAdd = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="green" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    `;
const svgRemove = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="red" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    `;

function syncAllButtonsOnPage(doc = (typeof document !== 'undefined' ? document : null), storedList = (typeof window !== 'undefined' ? window._storedWorkItemIds : [])) {
    if (!doc || !doc.querySelectorAll) return;
    const safeStoredList = Array.isArray(storedList) ? storedList : [];

    // 1. Đồng bộ trạng thái các nút ở danh sách child items trên trang task cha
    const allAddButtons = doc.querySelectorAll('.custom-add-button');
    allAddButtons.forEach(btn => {
        const li = btn.closest ? btn.closest('li.tree-item') : null;
        const anchor = li ? (li.querySelector('a[href*="/work_items/"], a[href*="/issues/"]') || li.querySelector('a')) : null;
        const container = btn.closest ? btn.closest('div[data-testid="links-child"]') : null;
        const href = (btn.getAttribute ? btn.getAttribute('data-task-href') : null) || (anchor ? (anchor.getAttribute('href') || anchor.href) : '') || '';
        const hrefMatch = href.match(/(?:work_items|issues)\/(\d+)/);
        const childIid = hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : '';
        const wid = (btn.getAttribute ? btn.getAttribute('data-work-item-id') : null) || childIid || (container && container.getAttribute ? container.getAttribute('parent-work-item-id') : '') || '';

        const isAdded = isTaskInList(safeStoredList, { id: wid, iid: childIid, href });
        btn.innerHTML = isAdded ? svgRemove : svgAdd;
        btn.title = isAdded ? (typeof t === 'function' ? t('addedToKpi') : '✔ Đã thêm vào KPI') : (typeof t === 'function' ? t('addToKpi') : '➕ Thêm vào KPI');
        if (btn.classList) {
            if (isAdded) {
                btn.classList.remove('btn-success');
                btn.classList.add('btn-danger');
            } else {
                btn.classList.remove('btn-danger');
                btn.classList.add('btn-success');
            }
        }
    });

    // 2. Đồng bộ trạng thái nút trên trang work item riêng hoặc modal work item
    const workItemBtns = doc.querySelectorAll('.custom-work-item-kpi-btn');
    workItemBtns.forEach(btn => {
        const wid = btn.getAttribute ? btn.getAttribute('data-work-item-id') : null;
        const href = (btn.getAttribute ? btn.getAttribute('data-href') : null) || (typeof window !== 'undefined' && window.location ? window.location.href : '');
        const isAdded = isTaskInList(safeStoredList, { id: wid, href });
        btn.className = isAdded
            ? 'btn btn-danger btn-sm gl-button custom-work-item-kpi-btn'
            : 'btn btn-default btn-sm gl-button custom-work-item-kpi-btn';
        const text = isAdded ? _tr('removeFromKpi') : _tr('addToKpi');
        const title = isAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');
        btn.title = title;
        btn.innerHTML = isAdded
            ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${text}</span>`
            : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${text}</span>`;
        if (btn.setAttribute) {
            btn.setAttribute('data-is-added', String(isAdded));
        }
    });

    // 3. Đồng bộ trạng thái các nút từng hàng trong modal Tổng hợp task con nếu đang mở
    const modalRowBtns = doc.querySelectorAll('.gl-kpi-row-add-btn');
    modalRowBtns.forEach(btn => {
        const taskId = btn.getAttribute ? btn.getAttribute('data-task-id') : null;
        const taskHref = btn.getAttribute ? btn.getAttribute('data-task-href') : null;
        const isAdded = isTaskInList(safeStoredList, { id: taskId, href: taskHref });
        btn.className = isAdded
            ? 'btn btn-sm btn-danger gl-button gl-kpi-row-add-btn'
            : 'btn btn-sm btn-default gl-button gl-kpi-row-add-btn';
        if (btn.setAttribute) {
            btn.setAttribute('data-is-added', String(isAdded));
        }
        const text = isAdded ? _tr('removeBtnShort') : _tr('addBtnShort');
        const title = isAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');
        btn.title = title;
        btn.innerHTML = isAdded
            ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${text}</span>`
            : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${text}</span>`;
    });
}

function renderTaskTableRows(tasks, options = {}) {
    const isSyncing = Boolean(options && options.isSyncing);
    const isFiltered = options ? (options.isFiltered !== undefined ? options.isFiltered : true) : true;
    const storedWorkItemIds = (options && (options.storedWorkItemIds || options.storedItems)) || [];

    if (!tasks || tasks.length === 0) {
        const emptyMsg = isSyncing
            ? _tr('syncingDataGitlab')
            : (isFiltered
                ? _tr('noMatchingTasksFound')
                : _tr('noMyTasksFound'));
        return `
            <tr>
                <td colspan="12" class="gl-kpi-empty-cell" style="text-align: center; padding: 24px; color: #64748b;">
                    ${emptyMsg}
                </td>
            </tr>`;
    }

    return tasks.map(task => {
        const id = escapeHtml(String(task.id || ''));
        const title = escapeHtml(task.title || (task.id ? `Task #${task.id}` : _tr('noTitle')));
        const href = escapeHtml(task.href || '#');
        const est = (task.estimateHour !== undefined && task.estimateHour !== null) ? `${task.estimateHour}h` : '-';
        const spent = (task.spentHour !== undefined && task.spentHour !== null) ? `${task.spentHour}h` : '-';

        let diffText = '-';
        let diffClass = '';
        if (task.diffHour !== undefined && task.diffHour !== null) {
            const diffVal = Number(task.diffHour);
            diffText = diffVal > 0 ? `+${diffVal}h` : `${diffVal}h`;
            diffClass = diffVal >= 0 ? 'gl-text-success' : 'gl-text-danger';
        } else if (task.estimateHour != null && task.spentHour != null) {
            const diffVal = roundToOneDecimal(Number(task.estimateHour) - Number(task.spentHour));
            diffText = diffVal > 0 ? `+${diffVal}h` : `${diffVal}h`;
            diffClass = diffVal >= 0 ? 'gl-text-success' : 'gl-text-danger';
        }

        const startDateText = formatDateDisplay(task.startDate);
        const dueDateText = formatDateDisplay(task.dueDate);
        const openDateText = formatDateDisplay(task.createdAt);
        const closeDateText = formatDateDisplay(task.closedAt);

        const state = (task.state || '').toLowerCase();
        const stateBadge = state === 'closed'
            ? `<span class="gl-badge gl-badge-closed">${_tr('statusClosed')}</span>`
            : `<span class="gl-badge gl-badge-opened">${_tr('statusOpen')}</span>`;

        const timelinessBadge = task.isLate
            ? `<span class="gl-badge gl-badge-danger">${_tr('statusLate')}</span>`
            : `<span class="gl-badge gl-badge-success">${_tr('statusOnTime')}</span>`;

        const planBadge = task.isUnplanned
            ? `<span class="gl-badge gl-badge-warning">${_tr('statusUnplanned')}</span>`
            : `<span class="gl-badge gl-badge-info">${_tr('statusPlanned')}</span>`;

        const isAdded = isTaskInList(storedWorkItemIds, task);
        const actionBtnClass = isAdded ? 'btn-danger' : 'btn-default';
        const addRowText = _tr('addBtnShort');
        const removeRowText = _tr('removeBtnShort');
        const actionBtnText = isAdded ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${removeRowText}</span>` : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${addRowText}</span>`;
        const actionBtnTitle = isAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');

        return `
            <tr>
                <td class="gl-kpi-task-title">
                    <a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>
                </td>
                <td class="gl-kpi-num">${est}</td>
                <td class="gl-kpi-num">${spent}</td>
                <td class="gl-kpi-num ${diffClass}">${diffText}</td>
                <td class="gl-kpi-date">${startDateText}</td>
                <td class="gl-kpi-date">${dueDateText}</td>
                <td class="gl-kpi-date">${openDateText}</td>
                <td class="gl-kpi-date">${closeDateText}</td>
                <td class="gl-kpi-status">${stateBadge}</td>
                <td class="gl-kpi-status">${timelinessBadge}</td>
                <td class="gl-kpi-status">${planBadge}</td>
                <td class="gl-kpi-action-cell" style="text-align: center; white-space: nowrap;">
                    <button type="button" class="btn btn-sm gl-button gl-kpi-row-add-btn ${actionBtnClass}"
                        data-task-id="${id}"
                        data-task-href="${href}"
                        data-task-title="${title}"
                        data-is-added="${String(isAdded)}"
                        title="${actionBtnTitle}">
                        ${actionBtnText}
                    </button>
                </td>
            </tr>`;
    }).join('');
}

function renderSummaryModalHtml(metrics, tasks = [], parentTitle = '', options = {}) {
    const isSyncing = Boolean(options && options.isSyncing);
    const safeParentTitle = escapeHtml(parentTitle);
    const safeMetrics = metrics || calculateChildTaskMetrics([]);
    const diffSign = safeMetrics.diffHours > 0 ? `+${safeMetrics.diffHours}h` : `${safeMetrics.diffHours}h`;
    const diffColorClass = safeMetrics.diffHours >= 0 ? 'gl-text-success' : 'gl-text-danger';
    const onTimeColorClass = safeMetrics.onTimeRate >= 80 ? 'gl-text-success' : (safeMetrics.onTimeRate >= 50 ? 'gl-text-warning' : 'gl-text-danger');

    const tableRowsHtml = renderTaskTableRows(tasks, {
        isSyncing,
        isFiltered: false,
        storedWorkItemIds: (options && (options.storedWorkItemIds || options.storedItems)) || []
    });

    const modalTitle = (typeof t === 'function') ? t('summaryModalTitle') : "📊 Tổng hợp Task con của tôi";
    const syncStatusText = (typeof t === 'function') ? t('syncingFromGitlab') : "Đang đồng bộ số liệu mới nhất từ GitLab...";
    const addAllBtnText = (typeof t === 'function') ? t('addAllToKpiModal') : "➕ Thêm tất cả vào KPI";
    const refreshBtnText = (typeof t === 'function') ? t('refreshBtn') : "🔄 Làm mới";
    const cardTotalTasks = (typeof t === 'function') ? t('metricTotalTasks') : "Tổng Task";
    const cardClosed = (typeof t === 'function') ? t('metricClosedTasks', { count: safeMetrics.closedTasks }) : `${safeMetrics.closedTasks} đóng`;
    const cardOpen = (typeof t === 'function') ? t('metricOpenTasks', { count: safeMetrics.openTasks }) : `${safeMetrics.openTasks} mở`;
    const cardTotalEst = (typeof t === 'function') ? t('metricTotalEst') : "Tổng Estimate";
    const cardPlanned = (typeof t === 'function') ? t('metricPlannedTasks', { count: safeMetrics.plannedCount }) : `${safeMetrics.plannedCount} kế hoạch`;
    const cardTotalSpent = (typeof t === 'function') ? t('metricTotalSpent') : "Tổng Spent";
    const cardUnplanned = (typeof t === 'function') ? t('metricUnplannedTasks', { count: safeMetrics.unplannedCount }) : `${safeMetrics.unplannedCount} phát sinh`;
    const cardDiff = (typeof t === 'function') ? t('metricDiff') : "Chênh lệch";
    const cardDiffSub = safeMetrics.diffHours >= 0
        ? ((typeof t === 'function') ? t('diffSurplus') : 'Dư thời gian')
        : ((typeof t === 'function') ? t('diffExceeded') : 'Vượt Estimate');
    const cardOnTime = (typeof t === 'function') ? t('metricOnTimeRate') : "Đúng hạn";
    const cardOnTimeSub = safeMetrics.lateTasks > 0
        ? ((typeof t === 'function') ? t('lateTasksCount', { count: safeMetrics.lateTasks }) : `${safeMetrics.lateTasks} task trễ`)
        : ((typeof t === 'function') ? t('allOnTime') : '100% đúng hạn');
    const searchPlaceholder = (typeof t === 'function') ? t('searchTaskPlaceholder') : "🔍 Tìm kiếm theo tên hoặc #id task...";
    const countShown = tasks ? tasks.length : 0;
    const taskCountText = (typeof t === 'function')
        ? t('showingTasksCount', { shown: `<strong>${countShown}</strong>`, total: countShown })
        : `Hiển thị <strong>${countShown}</strong> / ${countShown} task`;

    const colTask = (typeof t === 'function') ? t('tableHeaderTask') : "Task";
    const colEst = (typeof t === 'function') ? t('tableHeaderEst') : "Estimate";
    const colSpent = (typeof t === 'function') ? t('tableHeaderSpent') : "Spent";
    const colDiff = (typeof t === 'function') ? t('tableHeaderDiff') : "Chênh lệch";
    const colStart = (typeof t === 'function') ? t('tableHeaderStart') : "Bắt đầu";
    const colDue = (typeof t === 'function') ? t('tableHeaderDue') : "Hạn chót";
    const colCreated = (typeof t === 'function') ? t('tableHeaderCreated') : "Ngày mở";
    const colClosed = (typeof t === 'function') ? t('tableHeaderClosed') : "Ngày đóng";
    const colStatus = (typeof t === 'function') ? t('tableHeaderStatus') : "Trạng thái";
    const colProgress = (typeof t === 'function') ? t('tableHeaderProgress') : "Tiến độ";
    const colType = (typeof t === 'function') ? t('tableHeaderType') : "Phân loại";
    const colKpi = (typeof t === 'function') ? t('tableHeaderKpi') : "KPI";

    return `
<div id="gitlabKpiSummaryModal" class="gl-kpi-modal-overlay">
    <div class="gl-kpi-modal-dialog">
        <div class="gl-kpi-modal-header">
            <div>
                <h3 class="gl-kpi-modal-title">${modalTitle}</h3>
                ${safeParentTitle ? `<div class="gl-kpi-modal-subtitle">${safeParentTitle}</div>` : ''}
                ${isSyncing ? `<div class="gl-kpi-sync-status" style="font-size: 12px; color: #1068bf; margin-top: 4px; display: flex; align-items: center; gap: 6px;"><span class="gl-spinner" style="display: inline-block; width: 12px; height: 12px; border: 2px solid #1068bf; border-top-color: transparent; border-radius: 50%; animation: gl-spin 0.8s linear infinite;"></span> ${syncStatusText}</div>` : ''}
            </div>
            <div class="gl-kpi-header-actions">
                <button id="glKpiAddAllBtn" class="btn btn-sm btn-success gl-button"${!tasks || tasks.length === 0 ? ' disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>${addAllBtnText}</button>
                <button id="glKpiRefreshBtn" class="btn btn-sm btn-default gl-button">${refreshBtnText}</button>
                <span id="glKpiCloseBtn" class="gl-kpi-close-icon" title="Đóng">&times;</span>
            </div>
        </div>
        <div class="gl-kpi-modal-body">
            <!-- Summary Metric Cards -->
            <div class="gl-kpi-summary-grid">
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">${cardTotalTasks}</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalTasks}</div>
                    <div class="gl-kpi-card-sub">
                        <span class="gl-badge gl-badge-closed">${cardClosed}</span>
                        <span class="gl-badge gl-badge-opened">${cardOpen}</span>
                    </div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">${cardTotalEst}</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalEstimate}h</div>
                    <div class="gl-kpi-card-sub">${cardPlanned}</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">${cardTotalSpent}</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalSpent}h</div>
                    <div class="gl-kpi-card-sub">${cardUnplanned}</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">${cardDiff}</div>
                    <div class="gl-kpi-card-value ${diffColorClass}">${diffSign}</div>
                    <div class="gl-kpi-card-sub">${cardDiffSub}</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">${cardOnTime}</div>
                    <div class="gl-kpi-card-value ${onTimeColorClass}">${safeMetrics.onTimeRate}%</div>
                    <div class="gl-kpi-card-sub">${cardOnTimeSub}</div>
                </div>
            </div>
            <!-- Search & Count Toolbar -->
            <div class="gl-kpi-toolbar">
                <div class="gl-kpi-search-box">
                    <input type="text" id="glKpiSearchInput" class="gl-kpi-search-input" placeholder="${searchPlaceholder}">
                </div>
                <div id="glKpiTaskCount" class="gl-kpi-task-count">
                    ${taskCountText}
                </div>
            </div>
            <!-- Detailed Task Table -->
            <div class="gl-kpi-table-wrapper">
                <table class="gl-kpi-table">
                    <thead>
                        <tr>
                            <th class="gl-kpi-sortable" data-sort-key="title" style="cursor: pointer; user-select: none;">${colTask} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="estimate" style="cursor: pointer; user-select: none;">${colEst} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="spent" style="cursor: pointer; user-select: none;">${colSpent} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="diff" style="cursor: pointer; user-select: none;">${colDiff} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable" data-sort-key="startDate" style="cursor: pointer; user-select: none;">${colStart} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable" data-sort-key="dueDate" style="cursor: pointer; user-select: none;">${colDue} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable" data-sort-key="createdAt" style="cursor: pointer; user-select: none;">${colCreated} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable" data-sort-key="closedAt" style="cursor: pointer; user-select: none;">${colClosed} <span class="gl-kpi-sort-icon">↕</span></th>
                            <th>${colStatus}</th>
                            <th>${colProgress}</th>
                            <th>${colType}</th>
                            <th style="text-align: center; min-width: 90px;">${colKpi}</th>
                        </tr>
                    </thead>
                    <tbody id="glKpiTableBody">
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`.trim();
}

// --- Modal Styles & Helpers ---

function getModalStyles() {
    return `
#gitlabKpiSummaryModal.gl-kpi-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.45);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    box-sizing: border-box;
}

#gitlabKpiSummaryModal .gl-kpi-modal-dialog {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    width: 92%;
    max-width: 1180px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-size: 14px;
    color: #1f2937;
    border: 1px solid #dcdcde;
    animation: glKpiFadeIn 0.15s ease-out;
}

@keyframes glKpiFadeIn {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
}

#gitlabKpiSummaryModal .gl-kpi-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafafa;
}

#gitlabKpiSummaryModal .gl-kpi-modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

#gitlabKpiSummaryModal .gl-kpi-modal-subtitle {
    margin-top: 3px;
    font-size: 12px;
    color: #6b7280;
    font-weight: normal;
}

#gitlabKpiSummaryModal .gl-kpi-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

#gitlabKpiSummaryModal .gl-kpi-close-icon {
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
    user-select: none;
}

#gitlabKpiSummaryModal .gl-kpi-close-icon:hover {
    color: #111827;
    background: #e5e7eb;
}

#gitlabKpiSummaryModal .gl-kpi-modal-body {
    padding: 18px 20px;
    overflow-y: auto;
    max-height: calc(88vh - 70px);
}

#gitlabKpiSummaryModal .gl-kpi-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

#gitlabKpiSummaryModal .gl-kpi-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    text-align: center;
}

#gitlabKpiSummaryModal .gl-kpi-card-title {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

#gitlabKpiSummaryModal .gl-kpi-card-value {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}

#gitlabKpiSummaryModal .gl-kpi-card-sub {
    font-size: 11px;
    color: #64748b;
    display: flex;
    justify-content: center;
    gap: 4px;
    align-items: center;
}

#gitlabKpiSummaryModal .gl-kpi-table-wrapper {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}

#gitlabKpiSummaryModal .gl-kpi-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
}

#gitlabKpiSummaryModal .gl-kpi-table th {
    background: #f9fafb;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
}

#gitlabKpiSummaryModal .gl-kpi-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #1f2937;
    vertical-align: middle;
}

#gitlabKpiSummaryModal .gl-kpi-table tr:last-child td {
    border-bottom: none;
}

#gitlabKpiSummaryModal .gl-kpi-table tr:hover td {
    background: #f8fafc;
}

#gitlabKpiSummaryModal .gl-kpi-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

#gitlabKpiSummaryModal .gl-kpi-date {
    font-size: 12px;
    color: #4b5563;
    white-space: nowrap;
}

#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(2),
#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(3),
#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(4) {
    text-align: right;
}

#gitlabKpiSummaryModal .gl-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 12px;
    line-height: 1.4;
}

#gitlabKpiSummaryModal .gl-badge-opened {
    background: #e0f2fe;
    color: #0284c7;
}

#gitlabKpiSummaryModal .gl-badge-closed {
    background: #ecfdf5;
    color: #059669;
}

#gitlabKpiSummaryModal .gl-badge-success {
    background: #dcfce7;
    color: #16a34a;
}

#gitlabKpiSummaryModal .gl-badge-danger {
    background: #fee2e2;
    color: #dc2626;
}

#gitlabKpiSummaryModal .gl-badge-warning {
    background: #fef3c7;
    color: #d97706;
}

#gitlabKpiSummaryModal .gl-badge-info {
    background: #e0e7ff;
    color: #4338ca;
}

#gitlabKpiSummaryModal .gl-text-success {
    color: #16a34a !important;
}

#gitlabKpiSummaryModal .gl-text-danger {
    color: #dc2626 !important;
}

#gitlabKpiSummaryModal .gl-text-warning {
    color: #d97706 !important;
}

#gitlabKpiSummaryModal .gl-kpi-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    gap: 12px;
}

#gitlabKpiSummaryModal .gl-kpi-search-box {
    display: flex;
    align-items: center;
    position: relative;
}

#gitlabKpiSummaryModal .gl-kpi-search-input {
    padding: 6px 12px;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    font-size: 13px;
    width: 280px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
}

#gitlabKpiSummaryModal .gl-kpi-search-input:focus {
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.15);
}

#gitlabKpiSummaryModal .gl-kpi-task-count {
    font-size: 12px;
    color: #64748b;
    user-select: none;
}

#gitlabKpiSummaryModal th.gl-kpi-sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s;
}

#gitlabKpiSummaryModal th.gl-kpi-sortable:hover {
    background-color: #f1f5f9;
}

#gitlabKpiSummaryModal th.gl-kpi-sort-active {
    background-color: #e2e8f0;
    color: #0969da;
}

#gitlabKpiSummaryModal .gl-kpi-sort-icon {
    font-size: 11px;
    margin-left: 4px;
    opacity: 0.6;
}

#gitlabKpiSummaryModal th.gl-kpi-sort-active .gl-kpi-sort-icon {
    opacity: 1;
    color: #0969da;
}

.custom-summary-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    vertical-align: middle;
}

.custom-work-item-kpi-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    line-height: 20px !important;
    padding: 0 10px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    cursor: pointer !important;
    vertical-align: middle !important;
    border-radius: 4px !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out !important;
}

.custom-work-item-kpi-btn.btn-default {
    color: #108548 !important;
    border: 1px solid #108548 !important;
    background-color: #ffffff !important;
}

.custom-work-item-kpi-btn.btn-default:hover {
    background-color: #f1fbf5 !important;
    color: #0d6d3b !important;
    border-color: #0d6d3b !important;
}

.custom-work-item-kpi-btn.btn-danger {
    color: #ffffff !important;
    border: 1px solid #dd2b0e !important;
    background-color: #dd2b0e !important;
}

.custom-work-item-kpi-btn.btn-danger:hover {
    background-color: #c92509 !important;
    border-color: #c92509 !important;
}

.custom-work-item-kpi-btn svg {
    flex-shrink: 0 !important;
}

.custom-work-item-kpi-btn .gl-button-text {
    line-height: 20px !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    height: 26px !important;
    min-height: 26px !important;
    padding: 0 8px !important;
    font-size: 12px !important;
    line-height: 24px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    cursor: pointer !important;
    border-radius: 4px !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn.btn-default {
    color: #108548 !important;
    border: 1px solid #108548 !important;
    background-color: #ffffff !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn.btn-default:hover {
    background-color: #f1fbf5 !important;
    color: #0d6d3b !important;
    border-color: #0d6d3b !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn.btn-danger {
    color: #ffffff !important;
    border: 1px solid #dd2b0e !important;
    background-color: #dd2b0e !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn.btn-danger:hover {
    background-color: #c92509 !important;
    border-color: #c92509 !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn svg {
    flex-shrink: 0 !important;
}

#gitlabKpiSummaryModal .gl-kpi-row-add-btn .gl-button-text {
    line-height: 24px !important;
}

@keyframes gl-spin {
    to { transform: rotate(360deg); }
}
`.trim();
}

function ensureModalStyles(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc || !doc.head) return;
    if (doc.getElementById('gitlab-kpi-summary-styles')) return;

    const styleEl = doc.createElement('style');
    styleEl.id = 'gitlab-kpi-summary-styles';
    styleEl.textContent = getModalStyles();
    doc.head.appendChild(styleEl);
}

function createSummaryButton(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return null;
    const button = doc.createElement('button');
    button.id = 'kpiSummaryTasksBtn';
    button.className = 'btn btn-default btn-sm gl-button custom-summary-button';
    button.setAttribute('type', 'button');
    const titleText = (typeof t === 'function') ? t('summaryBtnTooltip') : 'Tổng hợp task con của tôi';
    const labelRaw = (typeof t === 'function') ? t('summaryBtn') : '📊 Tổng hợp task';
    const labelClean = labelRaw.replace(/^📊\s*/, '');
    button.title = titleText;
    button.innerHTML = `<span>📊</span><span>${labelClean}</span>`;
    return button;
}

function findEditButtonPlacement(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return null;

    // 1. Primary: Edit title button or standard edit button
    const editBtn = doc.querySelector(
        '[data-testid="edit-title-button"], button.js-issuable-edit, [data-testid="issue-edit-button"], [data-testid="work-item-actions-dropdown"]'
    );
    if (editBtn) {
        return { target: editBtn, position: 'after' };
    }

    // 2. Secondary: Detail page header actions container button or container
    const headerBtn = doc.querySelector('.detail-page-header-actions .btn-default');
    if (headerBtn) {
        return { target: headerBtn, position: 'after' };
    }
    const headerActions = doc.querySelector('.detail-page-header-actions');
    if (headerActions) {
        return { target: headerActions, position: 'append' };
    }

    // 3. Fallback: Adjacent to issue title
    const titleEl = doc.querySelector('h1.title, [data-testid="issue-title"], .issue-details .title');
    if (titleEl) {
        return { target: titleEl, position: 'after' };
    }

    return null;
}

function injectSummaryButton(doc = (typeof document !== 'undefined' ? document : null), onClickHandler = null) {
    if (!doc) return null;
    const existing = doc.getElementById('kpiSummaryTasksBtn');
    if (existing) {
        return existing;
    }

    const placement = findEditButtonPlacement(doc);
    if (!placement || !placement.target) {
        return null;
    }

    const btn = createSummaryButton(doc);
    if (onClickHandler && typeof btn.addEventListener === 'function') {
        btn.addEventListener('click', onClickHandler);
    }

    if (placement.position === 'after') {
        if (typeof placement.target.after === 'function') {
            placement.target.after(btn);
        } else if (placement.target.parentNode) {
            placement.target.parentNode.insertBefore(btn, placement.target.nextSibling);
        }
    } else if (placement.position === 'append') {
        placement.target.appendChild(btn);
    } else {
        if (placement.target.parentNode) {
            placement.target.parentNode.appendChild(btn);
        }
    }

    return btn;
}

function findWorkItemModal(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc || !doc.querySelectorAll) return null;

    // 1. First try specific testids and classes
    const directSelectors = [
        '[data-testid="work-item-drawer"]',
        '.work-item-drawer',
        '[data-testid="work-item-detail-modal"]',
        '.work-item-detail-modal',
        '#work-item-detail-modal'
    ];
    for (const sel of directSelectors) {
        const el = doc.querySelector ? doc.querySelector(sel) : null;
        if (el) return el;
    }

    // 2. Try generic drawers, modals, or detail containers that contain work-item components
    const candidates = doc.querySelectorAll(
        'aside.gl-drawer, .gl-drawer, .gl-modal, [data-testid="work-item-detail"], .work-item-detail, .work-item-view, div[role="dialog"]'
    );
    for (const el of candidates) {
        if (el.id === 'gitlabKpiSummaryModal') continue;

        const hasWorkItemSignature = el.querySelector && el.querySelector(
            '[data-testid="work-item-title"], #item-title, .work-item-title, ' +
            '[data-testid="work-item-actions-dropdown"], [data-testid="work-item-actions"], ' +
            '[data-testid="work-item-drawer-ref-link"], [data-testid="work-item-drawer-copy-button"], ' +
            'a[href*="/work_items/"], [data-testid="work-item-header"], [data-testid="work-item-state-badge"]'
        );
        if (hasWorkItemSignature) {
            return el;
        }
    }

    return null;
}

function extractWorkItemPageInfo(doc = (typeof document !== 'undefined' ? document : null), win = (typeof window !== 'undefined' ? window : null)) {
    if (!doc || !win || !win.location) return null;
    const pathname = win.location.pathname || '';
    const match = pathname.match(/\/work_items\/(\d+)/);
    if (!match) return null;

    const workItemId = match[1];
    const href = (win.location.origin || '') + pathname;

    const titleEl = doc.querySelector ? doc.querySelector('[data-testid="work-item-title"], #item-title, h1.work-item-title, h1.title, h1') : null;
    let title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : '';
    if (!title && doc.title) {
        title = doc.title.replace(/\s*·.*$/, '').trim();
    }
    if (!title) {
        title = `Task #${workItemId}`;
    }

    const parentAnchor = doc.querySelector ? doc.querySelector(
        '[data-testid="work-item-parent-link"], [data-testid="work-item-parent"] a, [data-testid="work-item-ancestors"] a, a[href*="/issues/"]'
    ) : null;

    let parentTitle = parentAnchor ? (parentAnchor.innerText || parentAnchor.textContent || '').trim() : '';
    let parentUrl = parentAnchor ? (parentAnchor.getAttribute('href') || parentAnchor.href || '') : '';
    let parentIid = parentUrl ? (parentUrl.match(/\/issues\/(\d+)/)?.[1] || '') : '';

    return {
        workItemId,
        href,
        title,
        parentTitle,
        parentUrl,
        parentIid
    };
}

function extractWorkItemModalInfo(modalEl, currentParentInfo = {}, win = (typeof window !== 'undefined' ? window : null)) {
    if (!modalEl) return null;

    let workItemId = '';
    let href = '';

    // Check 1: query parameter in window.location (e.g. ?work_item_iid=2067)
    if (win && win.location && win.location.search) {
        const searchParams = new URLSearchParams(win.location.search);
        const qIid = searchParams.get('work_item_iid') || searchParams.get('iid');
        if (qIid && /^\d+$/.test(qIid)) {
            workItemId = qIid;
        }
    }

    // Check 2: Attributes on modalEl
    if (!workItemId && typeof modalEl.getAttribute === 'function') {
        workItemId = modalEl.getAttribute('data-work-item-id') || modalEl.getAttribute('data-work-item-iid') || modalEl.getAttribute('data-iid') || '';
    }

    // Check 3: data-testid="work-item-drawer-ref-link" or other ref links
    if (modalEl.querySelector) {
        const refLink = modalEl.querySelector('[data-testid="work-item-drawer-ref-link"], [data-testid="work-item-link"], a.work-item-link');
        if (refLink) {
            const h = (typeof refLink.getAttribute === 'function' ? refLink.getAttribute('href') : refLink.href) || '';
            const m = h.match(/\/work_items\/(\d+)/);
            if (m) {
                if (!workItemId) workItemId = m[1];
                href = h;
            }
        }
    }

    // Check 4: Any link inside modal containing /work_items/
    if (modalEl.querySelectorAll) {
        const links = modalEl.querySelectorAll('a');
        for (const a of links) {
            const h = (typeof a.getAttribute === 'function' ? a.getAttribute('href') : a.href) || '';
            const match = h.match(/\/work_items\/(\d+)/);
            if (match) {
                if (!workItemId) workItemId = match[1];
                if (!href) href = h;
                break;
            }
        }
    }

    // Check 5: Look for any child element with data-work-item-id
    if (!workItemId && modalEl.querySelector) {
        const childWithId = modalEl.querySelector('[data-work-item-id], [data-work-item-iid], [parent-work-item-id]');
        if (childWithId && typeof childWithId.getAttribute === 'function') {
            workItemId = childWithId.getAttribute('data-work-item-id') || childWithId.getAttribute('data-work-item-iid') || childWithId.getAttribute('parent-work-item-id') || '';
        }
    }

    // If still no workItemId, we cannot proceed
    if (!workItemId) return null;

    // Construct href if missing
    if (!href) {
        const origin = (win && win.location && win.location.origin) || '';
        const pathname = (win && win.location && win.location.pathname) || '';
        const projectBase = (origin + pathname).replace(/(?:\/-)?\/(issues|work_items)\/.*$/, '');
        href = `${projectBase}/-/work_items/${workItemId}`;
    }

    // Extract title
    let title = '';
    const titleEl = modalEl.querySelector ? modalEl.querySelector('[data-testid="work-item-title"], #item-title, .work-item-title, h1, h2') : null;
    if (titleEl) {
        title = (titleEl.innerText || titleEl.textContent || '').trim();
    }
    if (!title) {
        title = `Task #${workItemId}`;
    }

    // Parent Issue info
    const safeParent = currentParentInfo || {};
    let parentTitle = safeParent.parentTitle || '';
    let parentUrl = safeParent.parentUrl || '';
    let parentIid = safeParent.parentIid || '';

    if (!parentTitle && modalEl.querySelector) {
        const parentAnchor = modalEl.querySelector(
            '[data-testid="work-item-parent-link"], [data-testid="work-item-parent"] a, [data-testid="work-item-ancestors"] a'
        );
        if (parentAnchor) {
            parentTitle = (parentAnchor.innerText || parentAnchor.textContent || '').trim();
            parentUrl = parentAnchor.getAttribute('href') || parentAnchor.href || '';
            parentIid = parentUrl.match(/\/issues\/(\d+)/)?.[1] || '';
        }
    }

    return {
        workItemId,
        href,
        title,
        parentTitle,
        parentUrl,
        parentIid
    };
}

function findWorkItemEditPlacement(container = (typeof document !== 'undefined' ? document : null)) {
    if (!container || !container.querySelector) return null;

    // 1. Look for explicit Edit button in work item header
    const editBtn = container.querySelector(
        '[data-testid="edit-title-button"], [data-testid="work-item-edit-button"], .js-issuable-edit, button.js-issuable-edit, [data-testid="issue-edit-button"]'
    );
    if (editBtn) {
        const wrapper = editBtn.closest ? editBtn.closest('.btn-group, .gl-button-group') : null;
        return { target: wrapper || editBtn, position: 'after' };
    }

    // 2. Header actions container (primary toolbar for actions in Work Items)
    const actionsContainer = container.querySelector(
        '[data-testid="work-item-actions"], .work-item-header-actions, .gl-drawer-actions'
    );
    if (actionsContainer) {
        return { target: actionsContainer, position: 'prepend' };
    }

    // 3. Actions dropdown in work item header (place BEFORE dropdown container wrapper, not inside it!)
    const actionsDropdown = container.querySelector(
        '[data-testid="work-item-actions-dropdown"], [data-testid="work-item-more-actions"]'
    );
    if (actionsDropdown) {
        const dropdownContainer = (actionsDropdown.closest ? actionsDropdown.closest('.gl-new-dropdown, .dropdown, .gl-disclosure-dropdown') : null) || actionsDropdown;
        return { target: dropdownContainer, position: 'before' };
    }

    // 4. Drawer close button
    const closeBtn = container.querySelector(
        '[data-testid="close-button"], .gl-drawer-close-button, button.gl-drawer-close-button'
    );
    if (closeBtn) {
        return { target: closeBtn, position: 'before' };
    }

    // 5. Fallback: title element
    const titleEl = container.querySelector('[data-testid="work-item-title"], #item-title, h1.work-item-title, h1.title, h1');
    if (titleEl) {
        return { target: titleEl, position: 'after' };
    }

    // 6. Fallback: work item header
    const headerEl = container.querySelector('[data-testid="work-item-header"], .work-item-header, .gl-drawer-header');
    if (headerEl) {
        return { target: headerEl, position: 'append' };
    }

    return null;
}

function createWorkItemKpiButton(workItemInfo = {}, isAdded = false, onClickHandler = null, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc || !doc.createElement) return null;

    const button = doc.createElement('button');
    button.id = 'kpiWorkItemAddBtn';
    button.className = isAdded
        ? 'btn btn-danger btn-sm gl-button custom-work-item-kpi-btn'
        : 'btn btn-default btn-sm gl-button custom-work-item-kpi-btn';
    button.setAttribute('type', 'button');
    button.setAttribute('data-is-added', String(isAdded));
    const text = isAdded ? _tr('removeFromKpi') : _tr('addToKpi');
    const title = isAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');
    button.title = title;
    button.innerHTML = isAdded
        ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${text}</span>`
        : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${text}</span>`;

    if (workItemInfo && workItemInfo.workItemId) {
        button.setAttribute('data-work-item-id', String(workItemInfo.workItemId));
    }

    if (onClickHandler && typeof button.addEventListener === 'function') {
        button.addEventListener('click', onClickHandler);
    }

    return button;
}

function injectWorkItemButton(container, workItemInfo, isAdded, onClickHandler, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!container || !workItemInfo || !workItemInfo.workItemId) return null;
    const documentObj = doc || (typeof document !== 'undefined' ? document : null);
    if (!documentObj) return null;

    ensureModalStyles(documentObj);

    const existingBtn = container.querySelector ? (container.querySelector('#kpiWorkItemAddBtn') || container.querySelector('.custom-work-item-kpi-btn')) : null;
    if (existingBtn) {
        const prevId = existingBtn.getAttribute ? existingBtn.getAttribute('data-work-item-id') : null;
        const prevAdded = existingBtn.getAttribute ? existingBtn.getAttribute('data-is-added') : null;
        const isSameTask = (prevId === String(workItemInfo.workItemId));
        const isSameState = (prevAdded === String(isAdded));

        // GUARD: If already injected and unchanged, DO NOT TOUCH DOM AT ALL!
        if (isSameTask && isSameState) {
            return existingBtn;
        }

        if (existingBtn.setAttribute) {
            existingBtn.setAttribute('data-work-item-id', String(workItemInfo.workItemId));
            existingBtn.setAttribute('data-is-added', String(isAdded));
        }
        existingBtn.className = isAdded
            ? 'btn btn-danger btn-sm gl-button custom-work-item-kpi-btn'
            : 'btn btn-default btn-sm gl-button custom-work-item-kpi-btn';
        const text = isAdded ? _tr('removeFromKpi') : _tr('addToKpi');
        const title = isAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');
        existingBtn.title = title;
        existingBtn.innerHTML = isAdded
            ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${text}</span>`
            : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${text}</span>`;
        return existingBtn;
    }

    const placement = findWorkItemEditPlacement(container);
    if (!placement || !placement.target) return null;

    const btn = createWorkItemKpiButton(workItemInfo, isAdded, onClickHandler, documentObj);
    if (!btn) return null;

    if (placement.position === 'after') {
        if (typeof placement.target.after === 'function') {
            placement.target.after(btn);
        } else if (placement.target.parentNode) {
            placement.target.parentNode.insertBefore(btn, placement.target.nextSibling);
        }
    } else if (placement.position === 'before') {
        if (typeof placement.target.before === 'function') {
            placement.target.before(btn);
        } else if (placement.target.parentNode) {
            placement.target.parentNode.insertBefore(btn, placement.target);
        }
    } else if (placement.position === 'prepend') {
        if (typeof placement.target.prepend === 'function') {
            placement.target.prepend(btn);
        } else if (placement.target.firstChild) {
            placement.target.insertBefore(btn, placement.target.firstChild);
        } else {
            placement.target.appendChild(btn);
        }
    } else {
        if (placement.target.appendChild) {
            placement.target.appendChild(btn);
        } else if (placement.target.parentNode) {
            placement.target.parentNode.appendChild(btn);
        }
    }

    return btn;
}

function extractChildTasksFromDom(container = (typeof document !== 'undefined' ? document : null)) {
    if (!container) return [];
    let items = container.querySelectorAll('ul[data-testid="child-items-container"] > li.tree-item');
    if (!items || items.length === 0) {
        items = container.querySelectorAll('#tasks li.tree-item, [data-testid="child-items-container"] li, li[data-testid="work-item-tree-item"]');
    }
    if (!items || items.length === 0) return [];

    const extracted = [];
    items.forEach(li => {
        const linkChild = li.querySelector('div[data-testid="links-child"]');
        const anchor = li.querySelector('a[href*="/work_items/"], a[href*="/issues/"]') || li.querySelector('a');
        const href = anchor ? (anchor.getAttribute('href') || anchor.href || '') : '';
        const hrefMatch = href.match(/(?:work_items|issues)\/(\d+)/);
        const childIid = hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : '';
        const containerId = linkChild?.getAttribute('parent-work-item-id') || '';
        const id = childIid || containerId;

        if (!id && !href) return;

        const title = (anchor?.innerText?.trim() || anchor?.getAttribute('title')?.trim() || (id ? `Task #${id}` : 'Không có tiêu đề'));
        const avatarLink = li.querySelector('div.gl-avatars-inline-child > a, div.gl-avatars-inline-child a, [data-testid="avatar-link"], .gl-avatar-link');
        const assigneeUrl = avatarLink ? (avatarLink.getAttribute('href') || avatarLink.href || '') : '';

        const isClosed = (
            li.classList?.contains('gl-badge-closed') ||
            li.classList?.contains('is-closed') ||
            li.querySelector?.('.gl-badge-closed') !== null ||
            li.querySelector?.('[data-testid="status-closed"]') !== null ||
            (li.getAttribute?.('data-state') === 'closed')
        );
        const state = isClosed ? 'closed' : 'opened';

        extracted.push({
            id: String(id || ''),
            href,
            title,
            assigneeUrl,
            state
        });
    });

    return extracted;
}

function enrichChildTasks(tasks, userProfile, storedKpi = []) {
    if (!Array.isArray(tasks)) return [];
    const userUrl = userProfile?.web_url;
    const filtered = filterMyChildTasks(tasks, userUrl);

    const kpiMap = new Map();
    if (Array.isArray(storedKpi)) {
        storedKpi.forEach(item => {
            if (!item) return;
            if (item.id) kpiMap.set(String(item.id), item);
            if (item.taskUrl) kpiMap.set(item.taskUrl, item);
        });
    }

    return filtered.map(task => {
        const kpi = kpiMap.get(String(task.id)) || (task.href ? kpiMap.get(task.href) : null);
        if (kpi) {
            const est = kpi.estimate != null ? Number(kpi.estimate) : 0;
            const spent = kpi.spent != null ? Number(kpi.spent) : 0;
            const diff = roundToOneDecimal(est - spent);
            const isLate = kpi.progress === 'Trễ hạn' || Boolean(kpi.isLate);
            const isUnplanned = kpi.type === 'Phát sinh' || Boolean(kpi.isUnplanned);
            const state = (kpi.state || task.state || 'opened').toLowerCase();

            return {
                ...task,
                estimateHour: est,
                spentHour: spent,
                diffHour: diff,
                startDate: task.startDate || kpi?.startDate || null,
                dueDate: task.dueDate || kpi?.dueDate || null,
                createdAt: task.createdAt || kpi?.createdAt || null,
                closedAt: task.closedAt || kpi?.closedAt || null,
                isLate,
                isUnplanned,
                state
            };
        }

        return {
            ...task,
            estimateHour: 0,
            spentHour: 0,
            diffHour: 0,
            startDate: task.startDate || null,
            dueDate: task.dueDate || null,
            createdAt: task.createdAt || null,
            closedAt: task.closedAt || null,
            isLate: false,
            isUnplanned: false,
            state: (task.state || 'opened').toLowerCase()
        };
    });
}

function batchAddTasksToStorage(tasks, parentInfo = {}, currentStored = []) {
    const list = Array.isArray(currentStored) ? [...currentStored] : [];
    let addedCount = 0;
    const parentTitle = parentInfo.parentTitle || '';
    const parentUrl = parentInfo.parentUrl || '';
    const parentIid = parentInfo.parentIid || '';

    if (Array.isArray(tasks)) {
        tasks.forEach(task => {
            if (!task || !task.id) return;
            const strId = String(task.id);
            const existingIdx = list.findIndex(item => String(item.id) === strId);

            if (existingIdx === -1) {
                list.push({
                    id: strId,
                    href: task.href || '',
                    createAt: new Date().toISOString(),
                    parentTitle,
                    parentUrl,
                    parentIid,
                    taskTitle: task.title || ''
                });
                addedCount++;
            } else {
                const item = list[existingIdx];
                let changed = false;
                if (!item.parentTitle && parentTitle) {
                    item.parentTitle = parentTitle;
                    changed = true;
                }
                if (!item.parentUrl && parentUrl) {
                    item.parentUrl = parentUrl;
                    changed = true;
                }
                if (!item.parentIid && parentIid) {
                    item.parentIid = parentIid;
                    changed = true;
                }
                if (!item.taskTitle && task.title) {
                    item.taskTitle = task.title;
                    changed = true;
                }
                if (changed) {
                    list[existingIdx] = { ...item };
                }
            }
        });
    }

    return { updatedList: list, addedCount };
}

async function fetchTaskDetail(projectPath, iidOrTask, token, customEndpoint = null) {
    if (!projectPath || !iidOrTask || !token) return null;
    const iid = resolveTaskIid(iidOrTask);
    if (!iid) return null;

    const queryData = {
        operationName: "namespaceWorkItem",
        variables: {
            fullPath: projectPath,
            iid: String(iid),
        },
        query: `
        query namespaceWorkItem($fullPath: ID!, $iid: String!) {
          workspace: namespace(fullPath: $fullPath) {
            id
            workItem(iid: $iid) {
              id
              iid
              title
              state
              createdAt
              closedAt
              widgets {
                type
                ... on WorkItemWidgetStartAndDueDate {
                  dueDate
                  startDate
                }
                ... on WorkItemWidgetTimeTracking {
                  timeEstimate
                  totalTimeSpent
                }
                ... on WorkItemWidgetLabels {
                  labels {
                    nodes {
                      title
                    }
                  }
                }
              }
            }
          }
        }
        `
    };

    const dynamicOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
        ? window.location.origin
        : ['https://gitlab', 'widosoft', 'com'].join('.');
    const endpoint = customEndpoint || `${dynamicOrigin}/api/graphql`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });
        const res = await response.json();
        return res?.data?.workspace?.workItem || null;
    } catch (err) {
        console.warn('Error fetching task detail for iid ' + iid + ':', err);
        return null;
    }
}

function parseGraphQLChildrenNodes(childrenNodes = []) {
    if (!Array.isArray(childrenNodes)) return [];
    return childrenNodes.map(node => {
        if (!node) return null;
        const widgets = node.widgets || [];
        const timeTracking = widgets.find(w => w.type === 'TIME_TRACKING');
        const labels = widgets.find(w => w.type === 'LABELS');
        const startAndDueDate = widgets.find(w => w.type === 'START_AND_DUE_DATE');
        const assignees = widgets.find(w => w.type === 'ASSIGNEES');

        const est = timeTracking?.timeEstimate ? parseFloat((timeTracking.timeEstimate / 3600).toFixed(2)) : 0;
        const spent = timeTracking?.totalTimeSpent ? parseFloat((timeTracking.totalTimeSpent / 3600).toFixed(2)) : 0;
        const diff = roundToOneDecimal(est - spent);
        const isUnplanned = labels?.labels?.nodes?.some(l => l.title?.toLowerCase() === 'unplanned') || false;
        const isLate = (node.state === 'closed' && node.closedAt && startAndDueDate?.dueDate)
            ? (node.closedAt.slice(0, 10) > startAndDueDate.dueDate)
            : false;

        const assigneeUrl = assignees?.assignees?.nodes?.[0]?.webUrl || '';
        const startDate = startAndDueDate?.startDate || null;
        const dueDate = startAndDueDate?.dueDate || null;
        const createdAt = node.createdAt || null;
        const closedAt = node.closedAt || null;

        return {
            id: String(node.iid || node.id || ''),
            href: node.webUrl || '',
            title: node.title || (node.iid ? `Task #${node.iid}` : ''),
            assigneeUrl,
            estimateHour: est,
            spentHour: spent,
            diffHour: diff,
            state: (node.state || 'opened').toLowerCase(),
            startDate,
            dueDate,
            createdAt,
            closedAt,
            isLate,
            isUnplanned
        };
    }).filter(Boolean);
}

async function fetchParentTaskWithChildren(projectPath, parentIid, token, customEndpoint = null) {
    if (!projectPath || !parentIid || !token) return null;
    const iid = String(parentIid);

    const queryData = {
        operationName: "namespaceWorkItemWithChildren",
        variables: {
            fullPath: projectPath,
            iid: iid,
        },
        query: `
        query namespaceWorkItemWithChildren($fullPath: ID!, $iid: String!) {
          workspace: namespace(fullPath: $fullPath) {
            id
            workItem(iid: $iid) {
              id
              iid
              title
              widgets {
                type
                ... on WorkItemWidgetHierarchy {
                  hasChildren
                  children(first: 100) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      state
                      createdAt
                      closedAt
                      webUrl
                      widgets {
                        type
                        ... on WorkItemWidgetTimeTracking {
                          timeEstimate
                          totalTimeSpent
                        }
                        ... on WorkItemWidgetStartAndDueDate {
                          dueDate
                          startDate
                        }
                        ... on WorkItemWidgetLabels {
                          labels {
                            nodes {
                              title
                            }
                          }
                        }
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              name
                              username
                              webUrl
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        `
    };

    const dynamicOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
        ? window.location.origin
        : ['https://gitlab', 'widosoft', 'com'].join('.');
    const endpoint = customEndpoint || `${dynamicOrigin}/api/graphql`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });
        const res = await response.json();
        const workItem = res?.data?.workspace?.workItem;
        if (!workItem) return null;

        const hierarchyWidget = workItem.widgets?.find(w => w.type === 'HIERARCHY' || w.__typename === 'WorkItemWidgetHierarchy');
        const childrenNodes = hierarchyWidget?.children?.nodes || [];
        return parseGraphQLChildrenNodes(childrenNodes);
    } catch (err) {
        console.warn('Error fetching parent task with children for iid ' + iid + ':', err);
        return null;
    }
}

function closeSummaryModal(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return;
    const existing = doc.getElementById('gitlabKpiSummaryModal');
    if (existing) {
        existing.remove();
    }
    if (typeof doc.removeEventListener === 'function' && doc._glKpiEscapeHandler) {
        doc.removeEventListener('keydown', doc._glKpiEscapeHandler);
        doc._glKpiEscapeHandler = null;
    }
    if (typeof window !== 'undefined' && window._glKpiEscapeHandler) {
        window.removeEventListener('keydown', window._glKpiEscapeHandler);
        window._glKpiEscapeHandler = null;
    }
}

let cachedChildTasks = null;

async function refreshSummaryModal(doc = (typeof document !== 'undefined' ? document : null), parentInfo = {}, options = {}) {
    if (!doc || !doc.body) return null;
    const safeParentInfo = parentInfo || {};

    let userProfile = options.userProfile || null;
    let token = options.token || null;
    let storedKpi = options.storedKpi || [];

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        if (!userProfile && typeof getUserProfile === 'function') userProfile = await getUserProfile();
        if (!token && typeof getAccessToken === 'function') token = await getAccessToken();
        if ((!storedKpi || storedKpi.length === 0) && typeof getStoredIds === 'function') storedKpi = await getStoredIds('KpiInfo');
    }

    const userUrl = userProfile?.web_url;
    let refreshedTasks = [];
    let usedGraphQLChildren = false;

    // Strategy 1: Direct GraphQL query to parent work item for all children (fetches up to 100 children without DOM pagination issues)
    if (token && typeof window !== 'undefined' && window.location) {
        const pathname = window.location.pathname || '';
        const matchProject = pathname.replace(/(?:\/-)?\/(issues|work_items)\/.*$/, '').replace(/^\//, '');
        const parentIid = safeParentInfo.parentIid || (pathname.match(/(?:issues|work_items)\/(\d+)/)?.[1]);

        if (matchProject && parentIid) {
            try {
                const apiChildren = await fetchParentTaskWithChildren(matchProject, parentIid, token);
                if (Array.isArray(apiChildren) && apiChildren.length > 0) {
                    refreshedTasks = filterMyChildTasks(apiChildren, userUrl);
                    usedGraphQLChildren = true;
                }
            } catch (err) {
                console.warn('Direct children query failed, falling back to DOM extraction:', err);
            }
        }
    }

    // Strategy 2: Fallback to DOM extraction if direct children query was not available or empty
    if (!usedGraphQLChildren) {
        let rawTasks = extractChildTasksFromDom(doc);
        if (rawTasks.length === 0 && options.waitForDom !== false) {
            const startTime = Date.now();
            while (Date.now() - startTime < 1600) {
                await new Promise(r => setTimeout(r, 200));
                rawTasks = extractChildTasksFromDom(doc);
                if (rawTasks.length > 0) break;
            }
        }

        refreshedTasks = enrichChildTasks(rawTasks, userProfile, storedKpi);

        if (token && typeof window !== 'undefined' && window.location) {
            const pathname = window.location.pathname || '';
            const matchProject = pathname.replace(/(?:\/-)?\/(issues|work_items)\/.*$/, '').replace(/^\//, '');
            if (matchProject && refreshedTasks.length > 0) {
                const livePromises = refreshedTasks.map(async (t) => {
                    try {
                        const childIid = resolveTaskIid(t);
                        const detail = await fetchTaskDetail(matchProject, childIid, token);
                        if (detail) {
                            const timeTracking = detail.widgets?.find(w => w.type === 'TIME_TRACKING');
                            const labels = detail.widgets?.find(w => w.type === 'LABELS');
                            const startAndDueDate = detail.widgets?.find(w => w.type === 'START_AND_DUE_DATE');

                            const est = timeTracking?.timeEstimate ? parseFloat((timeTracking.timeEstimate / 3600).toFixed(2)) : t.estimateHour;
                            const spent = timeTracking?.totalTimeSpent ? parseFloat((timeTracking.totalTimeSpent / 3600).toFixed(2)) : t.spentHour;
                            const diff = roundToOneDecimal(est - spent);
                            const isUnplanned = labels?.labels?.nodes?.some(l => l.title?.toLowerCase() === 'unplanned') || t.isUnplanned;
                            const isLate = (detail.state === 'closed' && detail.closedAt && startAndDueDate?.dueDate)
                                ? (detail.closedAt.slice(0, 10) > startAndDueDate.dueDate)
                                : t.isLate;
                            const startDate = startAndDueDate?.startDate || t.startDate || null;
                            const dueDate = startAndDueDate?.dueDate || t.dueDate || null;
                            const createdAt = detail.createdAt || t.createdAt || null;
                            const closedAt = detail.closedAt || t.closedAt || null;

                            return {
                                ...t,
                                estimateHour: est,
                                spentHour: spent,
                                diffHour: diff,
                                state: detail.state || t.state,
                                startDate,
                                dueDate,
                                createdAt,
                                closedAt,
                                isLate,
                                isUnplanned
                            };
                        }
                    } catch (e) {
                        console.warn('GraphQL enrichment failed for task', t.id, e);
                    }
                    return t;
                });
                refreshedTasks = await Promise.all(livePromises);
            }
        }
    }

    if (refreshedTasks && refreshedTasks.length > 0) {
        cachedChildTasks = refreshedTasks;
        if (typeof window !== 'undefined') {
            window._cachedChildTasks = refreshedTasks;
        }
    }

    // Only update modal if modal is still open
    const currentModal = doc.querySelector ? doc.querySelector('#gitlabKpiSummaryModal') : (doc.getElementById ? doc.getElementById('gitlabKpiSummaryModal') : null);
    if (!currentModal) return null;

    return openSummaryModal(safeParentInfo, refreshedTasks, doc, {
        userProfile,
        storedKpi,
        token,
        autoRefresh: false
    });
}

function openSummaryModal(parentInfo = {}, preloadedTasks = null, doc = (typeof document !== 'undefined' ? document : null), options = {}) {
    if (!doc || !doc.body) return null;
    ensureModalStyles(doc);
    closeSummaryModal(doc);

    const safeParentInfo = parentInfo || {};
    const parentTitle = safeParentInfo.parentTitle || '';

    let tasks = preloadedTasks;
    if (!tasks) {
        const rawTasks = extractChildTasksFromDom(doc);
        const userProfile = options.userProfile || null;
        const storedKpi = options.storedKpi || [];
        tasks = enrichChildTasks(rawTasks, userProfile, storedKpi);
    }

    let currentStoredWorkItemIds = (options && (options.storedWorkItemIds || options.storedItems)) || (typeof window !== 'undefined' ? window._storedWorkItemIds : null) || [];
    const isAutoRefreshing = Boolean(options.autoRefresh && !preloadedTasks);
    const metrics = calculateChildTaskMetrics(tasks);
    const modalHtml = renderSummaryModalHtml(metrics, tasks, parentTitle, {
        isSyncing: isAutoRefreshing,
        storedWorkItemIds: currentStoredWorkItemIds
    });

    let modalOverlay = null;
    if (typeof doc.createElement === 'function') {
        const temp = doc.createElement('div');
        temp.innerHTML = modalHtml;
        modalOverlay = temp.querySelector('#gitlabKpiSummaryModal') || (temp.children && temp.children.find(c => c.id === 'gitlabKpiSummaryModal')) || temp.firstElementChild || temp;
        if (modalOverlay) {
            doc.body.appendChild(modalOverlay);
        }
    }

    if (!modalOverlay) return null;

    // Attach Close handlers
    const closeBtn = modalOverlay.querySelector('#glKpiCloseBtn');
    if (closeBtn && typeof closeBtn.addEventListener === 'function') {
        closeBtn.addEventListener('click', () => closeSummaryModal(doc));
    }

    if (typeof modalOverlay.addEventListener === 'function') {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeSummaryModal(doc);
            }
        });
    }

    // Attach Escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeSummaryModal(doc);
        }
    };
    doc._glKpiEscapeHandler = escapeHandler;
    if (typeof doc.addEventListener === 'function') {
        doc.addEventListener('keydown', escapeHandler);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window._glKpiEscapeHandler = escapeHandler;
        window.addEventListener('keydown', escapeHandler);
    }

    // Attach Add All button handler
    const addAllBtn = modalOverlay.querySelector('#glKpiAddAllBtn');
    if (addAllBtn && typeof addAllBtn.addEventListener === 'function') {
        addAllBtn.addEventListener('click', async () => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const currentStored = (typeof getStoredIds === 'function') ? await getStoredIds('WorkItemIds') : [];
                    const { updatedList } = batchAddTasksToStorage(tasks, safeParentInfo, currentStored);
                    const storedList = typeof updateTrackedItems === 'function' && chrome.runtime?.sendMessage
                        ? await updateTrackedItems('WorkItemIds', updatedList.filter(item => !isTaskInList(currentStored, item)))
                        : (await chrome.storage.local.set({ WorkItemIds: updatedList }), updatedList);
                    currentStoredWorkItemIds = storedList;
                    if (typeof window !== 'undefined') {
                        window._storedWorkItemIds = storedList;
                    }
                }
                addAllBtn.innerText = _tr('addedAllToKpiSuccess');
                if (addAllBtn.classList) {
                    addAllBtn.classList.remove('btn-success');
                    addAllBtn.classList.add('btn-default');
                }
                addAllBtn.disabled = true;

                // Cập nhật tất cả các nút hàng trong bảng modal thành đã thêm
                const rowButtons = modalOverlay.querySelectorAll ? modalOverlay.querySelectorAll('.gl-kpi-row-add-btn') : [];
                rowButtons.forEach(btn => {
                    btn.className = 'btn btn-sm btn-danger gl-button gl-kpi-row-add-btn';
                    if (btn.setAttribute) {
                        btn.setAttribute('data-is-added', 'true');
                    }
                    const removeRowText = _tr('removeBtnShort');
                    btn.title = _tr('removeTaskFromKpiTooltip');
                    btn.innerHTML = `${kpiWorkItemMinusSvg}<span class="gl-button-text">${removeRowText}</span>`;
                });

                if (typeof window !== 'undefined' && typeof window._onChildTasksAddedAll === 'function') {
                    window._onChildTasksAddedAll(tasks);
                }
            } catch (err) {
                console.error('Error batch adding tasks to storage:', err);
            }
        });
    }

    // Attach Refresh button handler
    const refreshBtn = modalOverlay.querySelector('#glKpiRefreshBtn');
    if (refreshBtn && typeof refreshBtn.addEventListener === 'function') {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerText = _tr('refreshing');
            try {
                await refreshSummaryModal(doc, safeParentInfo, {
                    userProfile: options.userProfile,
                    storedKpi: options.storedKpi,
                    token: options.token,
                    storedWorkItemIds: currentStoredWorkItemIds,
                    waitForDom: false
                });
            } catch (err) {
                console.error('Error refreshing summary modal:', err);
                refreshBtn.disabled = false;
                refreshBtn.innerText = _tr('refreshBtn');
            }
        });
    }

    // Search & Column Sorting State & Handlers
    let currentSearchQuery = '';
    let currentSortKey = null;
    let currentSortOrder = null;

    const updateTable = () => {
        const filteredSorted = filterAndSortTasks(tasks, {
            query: currentSearchQuery,
            sortKey: currentSortKey,
            sortOrder: currentSortOrder
        });
        const tableBody = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiTableBody') : null;
        if (tableBody) {
            tableBody.innerHTML = renderTaskTableRows(filteredSorted, {
                isFiltered: Boolean(currentSearchQuery || currentSortKey),
                storedWorkItemIds: currentStoredWorkItemIds
            });
        }
        const countEl = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiTaskCount') : null;
        if (countEl) {
            countEl.innerHTML = _tr('showingTasksCount', {
                shown: `<strong>${filteredSorted.length}</strong>`,
                total: tasks ? tasks.length : 0
            });
        }
        const headers = modalOverlay.querySelectorAll ? modalOverlay.querySelectorAll('th.gl-kpi-sortable') : [];
        if (headers && headers.forEach) {
            headers.forEach(th => {
                const key = th.getAttribute ? th.getAttribute('data-sort-key') : null;
                const icon = th.querySelector ? th.querySelector('.gl-kpi-sort-icon') : null;
                if (key === currentSortKey && currentSortOrder) {
                    if (th.classList && th.classList.add) th.classList.add('gl-kpi-sort-active');
                    if (icon) icon.textContent = currentSortOrder === 'asc' ? '▲' : '▼';
                } else {
                    if (th.classList && th.classList.remove) th.classList.remove('gl-kpi-sort-active');
                    if (icon) icon.textContent = '↕';
                }
            });
        }
    };

    // Attach row button click delegation on tableBody
    const tableBodyEl = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiTableBody') : null;
    if (tableBodyEl && typeof tableBodyEl.addEventListener === 'function') {
        tableBodyEl.addEventListener('click', async (e) => {
            const btn = (e.target && e.target.closest) ? e.target.closest('.gl-kpi-row-add-btn') : null;
            if (!btn) return;
            e.stopPropagation();
            e.preventDefault();
            btn.disabled = true;

            try {
                const taskId = btn.getAttribute('data-task-id') || '';
                const taskHref = btn.getAttribute('data-task-href') || '';
                const taskTitle = btn.getAttribute('data-task-title') || '';

                if (typeof window !== 'undefined' && typeof window._onToggleTaskFromRow === 'function') {
                    const res = await window._onToggleTaskFromRow({
                        id: taskId,
                        href: taskHref,
                        title: taskTitle,
                        parentTitle: safeParentInfo.parentTitle,
                        parentUrl: safeParentInfo.parentUrl,
                        parentIid: safeParentInfo.parentIid
                    });
                    const isNowAdded = typeof res === 'boolean' ? res : (res && res.isAdded);
                    if (res && res.storedList) {
                        currentStoredWorkItemIds = res.storedList;
                    }
                    btn.className = isNowAdded
                        ? 'btn btn-sm btn-danger gl-button gl-kpi-row-add-btn'
                        : 'btn btn-sm btn-default gl-button gl-kpi-row-add-btn';
                    if (btn.setAttribute) {
                        btn.setAttribute('data-is-added', String(isNowAdded));
                    }
                    const text = isNowAdded ? _tr('removeBtnShort') : _tr('addBtnShort');
                    btn.title = isNowAdded ? _tr('removeTaskFromKpiTooltip') : _tr('addTaskToKpiTooltip');
                    btn.innerHTML = isNowAdded
                        ? `${kpiWorkItemMinusSvg}<span class="gl-button-text">${text}</span>`
                        : `${kpiWorkItemPlusSvg}<span class="gl-button-text">${text}</span>`;
                }
            } catch (err) {
                console.error('Error toggling task from summary modal row:', err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    const searchInput = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiSearchInput') : null;
    if (searchInput && typeof searchInput.addEventListener === 'function') {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = (e.target && e.target.value) || '';
            updateTable();
        });
    }

    const sortHeaders = modalOverlay.querySelectorAll ? modalOverlay.querySelectorAll('th.gl-kpi-sortable') : [];
    if (sortHeaders && sortHeaders.forEach) {
        sortHeaders.forEach(th => {
            if (typeof th.addEventListener === 'function') {
                th.addEventListener('click', () => {
                    const key = th.getAttribute ? th.getAttribute('data-sort-key') : null;
                    if (!key) return;
                    if (currentSortKey === key) {
                        if (currentSortOrder === 'asc') {
                            currentSortOrder = 'desc';
                        } else if (currentSortOrder === 'desc') {
                            currentSortKey = null;
                            currentSortOrder = null;
                        }
                    } else {
                        currentSortKey = key;
                        currentSortOrder = 'asc';
                    }
                    updateTable();
                });
            }
        });
    }

    // Auto-refresh in background if requested
    if (isAutoRefreshing) {
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerText = _tr('syncing');
        }
        setTimeout(() => {
            refreshSummaryModal(doc, safeParentInfo, {
                userProfile: options.userProfile,
                storedKpi: options.storedKpi,
                token: options.token,
                waitForDom: true
            }).catch(err => {
                console.error('Auto refresh error:', err);
                if (refreshBtn) {
                    refreshBtn.disabled = false;
                    refreshBtn.innerText = _tr('refreshBtn');
                }
            });
        }, 50);
    }

    return modalOverlay;
}

async function removeTaskFromStorage(key, taskOrId, href = '') {
    if (typeof updateTrackedItems === 'function' && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        const task = typeof taskOrId === 'object' ? taskOrId : { id: taskOrId, href };
        if (task.href || task.taskUrl) return updateTrackedItems(key, [], [task]);
        const stored = await getStoredIds(key);
        return updateTrackedItems(key, [], stored.filter(item => String(item.id) === String(taskOrId)));
    }
    const target = extractTaskIdentifier(typeof taskOrId === 'object' ? taskOrId : { id: taskOrId, href });
    const items = (typeof getStoredIds === 'function') ? await getStoredIds(key) : [];
    const filtered = items.filter(item => {
        const current = extractTaskIdentifier(item);
        if (target.normalizedHref && current.normalizedHref && target.normalizedHref === current.normalizedHref) {
            return false;
        }
        if (target.iid && current.iid && target.iid === current.iid) {
            return false;
        }
        if (target.id && current.id && target.id === current.id) {
            return false;
        }
        return true;
    });
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: filtered });
    }
    return filtered;
}

async function addIdToStorage(key, id, href, createAt, extra = {}) {
    if (typeof updateTrackedItems === 'function' && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        return updateTrackedItems(key, [{ id: String(id || ''), href, createAt, ...extra }]);
    }
    const items = (typeof getStoredIds === 'function') ? await getStoredIds(key) : [];
    const target = extractTaskIdentifier({ id, href });
    const existingIdx = items.findIndex(item => {
        const current = extractTaskIdentifier(item);
        if (target.normalizedHref && current.normalizedHref && target.normalizedHref === current.normalizedHref) return true;
        if (target.iid && current.iid && target.iid === current.iid) return true;
        if (target.id && current.id && target.id === current.id) return true;
        return false;
    });
    if (existingIdx === -1) {
        items.push({ id: String(id || ''), href: String(href || ''), createAt, ...extra });
    } else {
        items[existingIdx] = { ...items[existingIdx], ...extra, href: href || items[existingIdx].href };
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: items });
    }
    return items;
}

// --- Browser Content Script Initialization ---
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.calculateChildTaskMetrics = calculateChildTaskMetrics;
    window.filterMyChildTasks = filterMyChildTasks;
    window.resolveTaskIid = resolveTaskIid;
    window.extractTaskIdentifier = extractTaskIdentifier;
    window.isTaskInList = isTaskInList;
    window.removeTaskFromStorage = removeTaskFromStorage;
    window.addIdToStorage = addIdToStorage;
    window.syncAllButtonsOnPage = syncAllButtonsOnPage;
    window.shouldBackfillParent = shouldBackfillParent;
    window.renderSummaryModalHtml = renderSummaryModalHtml;
    window.getModalStyles = getModalStyles;
    window.ensureModalStyles = ensureModalStyles;
    window.createSummaryButton = createSummaryButton;
    window.findEditButtonPlacement = findEditButtonPlacement;
    window.injectSummaryButton = injectSummaryButton;
    window.extractChildTasksFromDom = extractChildTasksFromDom;
    window.enrichChildTasks = enrichChildTasks;
    window.batchAddTasksToStorage = batchAddTasksToStorage;
    window.fetchTaskDetail = fetchTaskDetail;
    window.parseGraphQLChildrenNodes = parseGraphQLChildrenNodes;
    window.fetchParentTaskWithChildren = fetchParentTaskWithChildren;
    window.formatDateDisplay = formatDateDisplay;
    window.filterAndSortTasks = filterAndSortTasks;
    window.renderTaskTableRows = renderTaskTableRows;
    window.refreshSummaryModal = refreshSummaryModal;
    window.openSummaryModal = openSummaryModal;
    window.closeSummaryModal = closeSummaryModal;
    window.findWorkItemModal = findWorkItemModal;
    window.extractWorkItemPageInfo = extractWorkItemPageInfo;
    window.extractWorkItemModalInfo = extractWorkItemModalInfo;
    window.findWorkItemEditPlacement = findWorkItemEditPlacement;
    window.createWorkItemKpiButton = createWorkItemKpiButton;
    window.injectWorkItemButton = injectWorkItemButton;

    (async () => {
        console.log('Loading content_issue.js');

        if (typeof initLanguage === 'function' && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            try {
                await initLanguage(chrome.storage.local);
            } catch (err) {
                console.warn('Could not initialize i18n in content_issue.js:', err);
            }
        }

        let loadingSuccess = false;
        const WORK_ITEM_KEY = 'WorkItemIds';

        // Cache danh sách task đã thêm vào KPI
        let storedItemsCache = (typeof getStoredIds === 'function') ? await getStoredIds(WORK_ITEM_KEY) : [];
        if (typeof window !== 'undefined') {
            window._storedWorkItemIds = storedItemsCache;
        }
        const userProfile = (typeof getUserProfile === 'function') ? await getUserProfile() : null;

        ensureModalStyles(document);

        // Lắng nghe thay đổi storage từ bất kỳ tab hoặc window nào để tự động đồng bộ ngay lập tức
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (areaName === 'local') {
                    if (changes[WORK_ITEM_KEY]) {
                        storedItemsCache = changes[WORK_ITEM_KEY].newValue || [];
                        if (typeof window !== 'undefined') {
                            window._storedWorkItemIds = storedItemsCache;
                        }
                        syncAllButtonsOnPage(document, storedItemsCache);
                    }
                    if (changes.appLanguage && typeof setLanguage === 'function') {
                        setLanguage(changes.appLanguage.newValue);
                        const summaryBtn = document.getElementById('kpiSummaryTasksBtn');
                        if (summaryBtn) {
                            const titleText = (typeof t === 'function') ? t('summaryBtnTooltip') : 'Tổng hợp task con của tôi';
                            const labelRaw = (typeof t === 'function') ? t('summaryBtn') : '📊 Tổng hợp task';
                            const labelClean = labelRaw.replace(/^📊\s*/, '');
                            summaryBtn.title = titleText;
                            summaryBtn.innerHTML = `<span>📊</span><span>${labelClean}</span>`;
                        }
                        syncAllButtonsOnPage(document, storedItemsCache);
                        const modalOverlay = document.getElementById('gitlabKpiSummaryModal');
                        if (modalOverlay && typeof refreshSummaryModal === 'function') {
                            refreshSummaryModal(document, getParentIssueInfo(), { storedWorkItemIds: storedItemsCache });
                        }
                    }
                }
            });
        }

        async function handleSummaryButtonClick() {
            const parentInfo = getParentIssueInfo();
            const storedKpi = (typeof getStoredIds === 'function') ? await getStoredIds('KpiInfo') : [];
            const profile = (typeof getUserProfile === 'function') ? await getUserProfile() : userProfile;
            const token = (typeof getAccessToken === 'function') ? await getAccessToken() : null;
            const storedTasks = (typeof getStoredIds === 'function') ? await getStoredIds(WORK_ITEM_KEY) : storedItemsCache;
            storedItemsCache = storedTasks;
            if (typeof window !== 'undefined') {
                window._storedWorkItemIds = storedTasks;
            }

            const existingCache = cachedChildTasks || (typeof window !== 'undefined' ? window._cachedChildTasks : null);
            if (existingCache && existingCache.length > 0) {
                openSummaryModal(parentInfo, existingCache, document, {
                    userProfile: profile,
                    storedKpi,
                    token,
                    storedWorkItemIds: storedTasks,
                    autoRefresh: false
                });
            } else {
                openSummaryModal(parentInfo, null, document, {
                    userProfile: profile,
                    storedKpi,
                    token,
                    storedWorkItemIds: storedTasks,
                    autoRefresh: true
                });
            }
        }

        window._onToggleTaskFromRow = async (task) => {
            if (!task) return { isAdded: false, storedList: storedItemsCache };
            const isCurrentlyAdded = isTaskInList(storedItemsCache, task);
            if (isCurrentlyAdded) {
                storedItemsCache = await removeTaskFromStorage(WORK_ITEM_KEY, task);
            } else {
                const today = new Date().toISOString();
                storedItemsCache = await addIdToStorage(WORK_ITEM_KEY, task.id, task.href, today, {
                    parentTitle: task.parentTitle || '',
                    parentUrl: task.parentUrl || '',
                    parentIid: task.parentIid || '',
                    taskTitle: task.title || ''
                });
            }
            if (typeof window !== 'undefined') {
                window._storedWorkItemIds = storedItemsCache;
            }
            syncAllButtonsOnPage();
            return { isAdded: !isCurrentlyAdded, storedList: storedItemsCache };
        };

        window._onChildTasksAddedAll = async (tasks) => {
            if (!Array.isArray(tasks)) return;
            if (typeof getStoredIds === 'function') {
                storedItemsCache = await getStoredIds(WORK_ITEM_KEY);
                if (typeof window !== 'undefined') {
                    window._storedWorkItemIds = storedItemsCache;
                }
            }
            syncAllButtonsOnPage();
        };

        function getParentIssueInfo() {
            const pageUrl = (window.location.origin + window.location.pathname).replace(/\/+$/, '');
            const issueIidMatch = pageUrl.match(/\/issues\/(\d+)/);
            let parentIid = issueIidMatch ? issueIidMatch[1] : '';
            let parentUrl = issueIidMatch ? pageUrl : '';
            const titleEl = document.querySelector('h1.title, [data-testid="issue-title"], .issue-details .title');
            let parentTitle = titleEl ? titleEl.innerText.trim() : '';

            // Nếu đang ở trang work item riêng, kiểm tra link cha (ancestors / parent link)
            if (!parentUrl) {
                const parentAnchor = document.querySelector(
                    '[data-testid="work-item-parent-link"], [data-testid="work-item-parent"] a, [data-testid="work-item-ancestors"] a, a[href*="/issues/"]'
                );
                if (parentAnchor) {
                    parentTitle = parentTitle || (parentAnchor.innerText || parentAnchor.textContent || '').trim();
                    parentUrl = parentAnchor.getAttribute('href') || parentAnchor.href || '';
                    parentIid = parentUrl.match(/\/issues\/(\d+)/)?.[1] || '';
                }
            }

            if (!parentTitle && document.title) {
                parentTitle = document.title.replace(/\s*·.*$/, '').trim();
            }
            if (parentIid && !parentTitle) {
                parentTitle = `Issue #${parentIid}`;
            }
            return { parentTitle, parentUrl, parentIid };
        }

        function createAddButton(workItemId, href, taskTitle = '') {
            const button = document.createElement('button');
            button.className = 'btn btn-default btn-sm gl-button';

            const hrefMatch = href.match(/(?:work_items|issues)\/(\d+)/);
            const childIid = hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : '';

            const updateButtonAppearance = () => {
                const isAdded = isTaskInList(storedItemsCache, { id: workItemId, iid: childIid, href });
                const addTitle = (typeof t === 'function') ? t('addToKpi') : 'Thêm vào KPI';
                const removeTitle = (typeof t === 'function') ? t('addedToKpi') : 'Xóa khỏi KPI';
                button.title = isAdded ? removeTitle : addTitle;
                if (isAdded) {
                    button.innerHTML = svgRemove;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-danger');
                } else {
                    button.innerHTML = svgAdd;
                    button.classList.remove('btn-danger');
                    button.classList.add('btn-success');
                }
            };

            updateButtonAppearance();

            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                button.disabled = true;

                try {
                    const isCurrentlyAdded = isTaskInList(storedItemsCache, { id: workItemId, iid: childIid, href });
                    if (isCurrentlyAdded) {
                        storedItemsCache = await removeTaskFromStorage(WORK_ITEM_KEY, { id: workItemId, iid: childIid, href });
                    } else {
                        const today = new Date().toISOString();
                        const parentInfo = getParentIssueInfo();
                        storedItemsCache = await addIdToStorage(WORK_ITEM_KEY, workItemId, href, today, {
                            parentTitle: parentInfo.parentTitle,
                            parentUrl: parentInfo.parentUrl,
                            parentIid: parentInfo.parentIid,
                            taskTitle: taskTitle
                        });
                    }
                    if (typeof window !== 'undefined') {
                        window._storedWorkItemIds = storedItemsCache;
                    }
                    syncAllButtonsOnPage();
                } catch (error) {
                    console.error('Error handling button click:', error);
                } finally {
                    button.disabled = false;
                }
            });

            return button;
        }

        function createRefreshButton() {
            const taskHeader = document.querySelector('#tasks > .crud-header');
            if (!taskHeader || taskHeader.querySelector('button[title="Refresh"]')) return;

            const button = document.createElement('button');
            button.className = 'btn btn-sm btn-default gl-button';
            button.title = 'Refresh';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';

            button.innerHTML = `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve">
            <path fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" d="M25.7,10.9C23.9,7.4,20.2,5,16,5
                c-4.7,0-8.6,2.9-10.2,7"/>
            <path fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" d="M6.2,21c1.8,3.5,5.5,6,9.8,6c4.7,0,8.6-2.9,10.2-7"
                />
            <polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="26,5 26,11 20,11 "/>
            <polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="6,27 6,21 12,21 "/>
            </svg>
        `;

            button.addEventListener('click', () => {
                processTasks();
            });

            if (!taskHeader.querySelector('button[title="Refresh"]')) {
                taskHeader.append(button);
            }
        }

        let processTasksTimer = null;
        function debouncedProcessTasks(delay = 250) {
            if (processTasksTimer) {
                clearTimeout(processTasksTimer);
            }
            processTasksTimer = setTimeout(() => {
                processTasks();
            }, delay);
        }

        const backfilledTaskIds = new Set();
        let lastBackfilledParentTitle = '';

        function processTasks() {
            const taskSection = document.querySelector('#tasks > .crud-body');
            if (!taskSection) return;

            const taskItems = taskSection.querySelectorAll('ul[data-testid="child-items-container"] > li.tree-item');
            const parentInfo = getParentIssueInfo();
            const currentTasks = new Map();

            taskItems.forEach(li => {
                const container = li.querySelector('div[data-testid="links-child"]');
                const anchor = li.querySelector('a[href*="/work_items/"], a[href*="/issues/"]') || li.querySelector('a');

                if (!anchor) return;

                const href = anchor.getAttribute('href') || anchor.href || '';
                const hrefMatch = href.match(/(?:work_items|issues)\/(\d+)/);
                const childIid = hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : '';
                const containerId = container?.getAttribute('parent-work-item-id') || '';
                const workItemId = childIid || containerId;

                if (!workItemId) return;

                const avatarUrl = li.querySelector('div.gl-avatars-inline-child > a, [data-testid="avatar-link"], .gl-avatar-link')?.getAttribute('href');

                if (userProfile && avatarUrl && userProfile.web_url && avatarUrl != userProfile.web_url) return;

                const taskTitle = anchor.innerText?.trim() || anchor.title?.trim() || '';
                currentTasks.set(workItemId, { href: anchor.href, title: taskTitle, id: workItemId, iid: childIid });

                const position = li.querySelector('div[data-testid="child-contents-container"] > div[data-testid="links-child"]') || container;
                if (!position) return;

                const existingBtn = position.querySelector('.custom-add-button');
                const isAdded = isTaskInList(storedItemsCache, { id: workItemId, iid: childIid, href: anchor.href });

                if (existingBtn) {
                    existingBtn.setAttribute('data-work-item-id', workItemId);
                    existingBtn.setAttribute('data-task-href', anchor.href);
                    existingBtn.innerHTML = isAdded ? svgRemove : svgAdd;
                    const addTitle = (typeof t === 'function') ? t('addToKpi') : 'Thêm vào KPI';
                    const removeTitle = (typeof t === 'function') ? t('addedToKpi') : 'Xóa khỏi KPI';
                    existingBtn.title = isAdded ? removeTitle : addTitle;
                    if (existingBtn.classList) {
                        if (isAdded) {
                            existingBtn.classList.remove('btn-success');
                            existingBtn.classList.add('btn-danger');
                        } else {
                            existingBtn.classList.remove('btn-danger');
                            existingBtn.classList.add('btn-success');
                        }
                    }
                    return;
                }

                const addButton = createAddButton(workItemId, anchor.href, taskTitle);
                addButton.classList.add('custom-add-button');
                addButton.setAttribute('data-work-item-id', workItemId);
                addButton.setAttribute('data-task-href', anchor.href);

                position.prepend(addButton);
            });

            if (shouldBackfillParent(currentTasks, backfilledTaskIds, lastBackfilledParentTitle, parentInfo.parentTitle)) {
                for (const taskId of currentTasks.keys()) {
                    backfilledTaskIds.add(taskId);
                }
                lastBackfilledParentTitle = parentInfo.parentTitle;
                backfillParentInfo(currentTasks, parentInfo);
            }
        }

        async function handleToggleWorkItem(info, btn) {
            if (!info || !info.workItemId) return;
            const wid = String(info.workItemId);
            if (btn) btn.disabled = true;
            try {
                const isCurrentlyAdded = isTaskInList(storedItemsCache, { id: wid, href: info.href });
                if (isCurrentlyAdded) {
                    storedItemsCache = await removeTaskFromStorage(WORK_ITEM_KEY, { id: wid, href: info.href });
                } else {
                    const today = new Date().toISOString();
                    storedItemsCache = await addIdToStorage(WORK_ITEM_KEY, wid, info.href, today, {
                        parentTitle: info.parentTitle || '',
                        parentUrl: info.parentUrl || '',
                        parentIid: info.parentIid || '',
                        taskTitle: info.title || ''
                    });
                }
                if (typeof window !== 'undefined') {
                    window._storedWorkItemIds = storedItemsCache;
                }
                syncAllButtonsOnPage();
            } catch (err) {
                console.error('Error toggling work item in KPI:', err);
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        let workItemTimer = null;
        function debouncedProcessWorkItemButtons(delay = 150) {
            if (workItemTimer) {
                clearTimeout(workItemTimer);
            }
            workItemTimer = setTimeout(() => {
                processWorkItemButtons();
            }, delay);
        }

        function processWorkItemButtons() {
            // Case 1: Standalone work item page (e.g. /-/work_items/123)
            if (window.location && window.location.pathname && window.location.pathname.includes('/work_items/')) {
                const pageInfo = extractWorkItemPageInfo(document, window);
                if (pageInfo && pageInfo.workItemId) {
                    const isAdded = isTaskInList(storedItemsCache, pageInfo);
                    const btn = injectWorkItemButton(document, pageInfo, isAdded, (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const targetBtn = e.currentTarget || document.getElementById('kpiWorkItemAddBtn');
                        handleToggleWorkItem(pageInfo, targetBtn);
                    });
                    if (btn && btn.setAttribute) {
                        btn.setAttribute('data-work-item-id', String(pageInfo.workItemId));
                        btn.setAttribute('data-href', String(pageInfo.href));
                    }
                }
                return;
            }

            // Case 2: Work item modal or drawer popup (opened from any page)
            const modal = findWorkItemModal(document);
            if (modal) {
                const parentInfo = getParentIssueInfo();
                const modalInfo = extractWorkItemModalInfo(modal, parentInfo, window);
                if (modalInfo && modalInfo.workItemId) {
                    const isAdded = isTaskInList(storedItemsCache, modalInfo);
                    const btn = injectWorkItemButton(modal, modalInfo, isAdded, (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const targetBtn = e.currentTarget || modal.querySelector('.custom-work-item-kpi-btn');
                        handleToggleWorkItem(modalInfo, targetBtn);
                    });
                    if (btn && btn.setAttribute) {
                        btn.setAttribute('data-work-item-id', String(modalInfo.workItemId));
                        btn.setAttribute('data-href', String(modalInfo.href));
                    }
                }
            }
        }

        const isStandaloneWorkItem = Boolean(window.location && window.location.pathname && window.location.pathname.includes('/work_items/'));

        // Khởi tạo nút ban đầu
        if (!isStandaloneWorkItem) {
            injectSummaryButton(document, handleSummaryButtonClick);
        }
        processWorkItemButtons();

        // Bắt đầu quan sát từ phần tử gốc (ví dụ: body)
        const observer = new MutationObserver((mutations) => {
            let hasRelevantMutation = false;
            for (const m of mutations) {
                const t = m.target;
                if (t && t.closest && (t.closest('#gitlabKpiSummaryModal') || t.closest('.custom-work-item-kpi-btn') || t.closest('#kpiSummaryTasksBtn'))) {
                    continue;
                }
                hasRelevantMutation = true;
                break;
            }
            if (!hasRelevantMutation) return;

            if (!isStandaloneWorkItem) {
                injectSummaryButton(document, handleSummaryButtonClick);
            }
            debouncedProcessWorkItemButtons(150);

            const targetElement = document.querySelector("ul[data-testid='child-items-container']");
            if (targetElement) {
                debouncedProcessTasks(250);
                createRefreshButton();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        async function backfillParentInfo(currentTasks, parentInfo) {
            try {
                const items = await getStoredIds(WORK_ITEM_KEY);
                let updated = false;
                items.forEach(item => {
                    if (currentTasks.has(item.id)) {
                        const taskMeta = currentTasks.get(item.id);
                        if (!item.parentTitle || !item.parentUrl) {
                            item.parentTitle = item.parentTitle || parentInfo.parentTitle;
                            item.parentUrl = item.parentUrl || parentInfo.parentUrl;
                            item.parentIid = item.parentIid || parentInfo.parentIid;
                            if (!item.taskTitle && taskMeta.title) item.taskTitle = taskMeta.title;
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    if (typeof updateTrackedItems === 'function' && chrome.runtime?.sendMessage) {
                        await updateTrackedItems(WORK_ITEM_KEY, items.filter(item => currentTasks.has(item.id)));
                    } else await chrome.storage.local.set({ [WORK_ITEM_KEY]: items });
                }
            } catch (err) {
                console.error('Error backfilling parent info:', err);
            }
        }

    })();
}

// --- Module Exports for Testing ---
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        roundToOneDecimal,
        calculateChildTaskMetrics,
        filterMyChildTasks,
        resolveTaskIid,
        extractTaskIdentifier,
        isTaskInList,
        removeTaskFromStorage,
        addIdToStorage,
        syncAllButtonsOnPage,
        shouldBackfillParent,
        renderSummaryModalHtml,
        getModalStyles,
        ensureModalStyles,
        createSummaryButton,
        findEditButtonPlacement,
        injectSummaryButton,
        extractChildTasksFromDom,
        enrichChildTasks,
        batchAddTasksToStorage,
        fetchTaskDetail,
        parseGraphQLChildrenNodes,
        fetchParentTaskWithChildren,
        formatDateDisplay,
        filterAndSortTasks,
        renderTaskTableRows,
        refreshSummaryModal,
        openSummaryModal,
        closeSummaryModal,
        findWorkItemModal,
        extractWorkItemPageInfo,
        extractWorkItemModalInfo,
        findWorkItemEditPlacement,
        createWorkItemKpiButton,
        injectWorkItemButton
    };
}
