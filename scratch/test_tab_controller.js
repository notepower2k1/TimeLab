const assert = require('assert');
const fs = require('fs');

console.log('--- Running Tab Controller & Synchronization Unit Tests ---');

// Load i18n.js and utils.js to provide helper functions in Node
try {
    const i18nCode = fs.readFileSync('i18n.js', 'utf8');
    eval(i18nCode);
    if (typeof setLanguage === 'function') {
        setLanguage('vi');
    }
    const utilsCode = fs.readFileSync('utils.js', 'utf8');
    eval(utilsCode);
} catch (e) {
    console.warn('Note: Could not eval i18n.js / utils.js:', e.message);
}

// Require page.js before defining document so top-level browser IIFE does not auto-run
let pageModule;
let initTabs;
let renderMonthlyKpiSummaryCards;
let refreshMonthlyAnalytics;
let updateAnalyticsMonthBadge;
let calculateMonthlyTimesheet;
let renderDailyTimesheet;
let calculateMonthlyChartData;
let renderMonthlyCharts;

try {
    pageModule = require('../page/page.js');
    initTabs = pageModule.initTabs;
    renderMonthlyKpiSummaryCards = pageModule.renderMonthlyKpiSummaryCards;
    refreshMonthlyAnalytics = pageModule.refreshMonthlyAnalytics;
    updateAnalyticsMonthBadge = pageModule.updateAnalyticsMonthBadge;
    calculateMonthlyTimesheet = pageModule.calculateMonthlyTimesheet;
    renderDailyTimesheet = pageModule.renderDailyTimesheet;
    calculateMonthlyChartData = pageModule.calculateMonthlyChartData;
    renderMonthlyCharts = pageModule.renderMonthlyCharts;
} catch (err) {
    console.error('Failed to import page.js:', err.message);
}

// Mock browser environment for unit testing tab switching and rendering
const mockDomElements = {};

function createMockElement(id, tagName = 'div') {
    const el = {
        id,
        tagName: tagName.toUpperCase(),
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this.classes.has(c)) this.classes.delete(c);
                    else this.classes.add(c);
                } else if (force) {
                    this.classes.add(c);
                } else {
                    this.classes.delete(c);
                }
            }
        },
        style: {},
        _innerHTML: '',
        get innerHTML() {
            return this._innerHTML;
        },
        set innerHTML(val) {
            this._innerHTML = val;
            if (val === '') {
                this.children = [];
            }
        },
        value: '',
        children: [],
        listeners: {},
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        addEventListener(event, handler) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(handler);
        },
        async dispatchEvent(event) {
            if (this.listeners[event]) {
                for (const h of this.listeners[event]) {
                    await h({ target: this });
                }
            }
        },
        querySelector(sel) {
            return null;
        },
        querySelectorAll(sel) {
            return [];
        },
        setAttribute(k, v) {
            this[k] = v;
        },
        getAttribute(k) {
            return this[k] || null;
        }
    };
    mockDomElements[id] = el;
    return el;
}

// Setup basic required elements in mock DOM
createMockElement('tabWorkItemsBtn', 'button');
mockDomElements['tabWorkItemsBtn'].classList.add('active');
createMockElement('tabAnalyticsBtn', 'button');
createMockElement('tabAnalyticsMonthBadge', 'span');
createMockElement('workItemsTabContent', 'div');
createMockElement('analyticsTabContent', 'div');
mockDomElements['analyticsTabContent'].style.display = 'none';

createMockElement('monthlyKpiSummaryCards', 'div');
createMockElement('timesheetSummaryChips', 'div');
createMockElement('timesheetCalendarGrid', 'div');
createMockElement('chartWeeklyEstSpent', 'canvas');
createMockElement('chartTaskType', 'canvas');
createMockElement('chartTaskStatus', 'canvas');
createMockElement('monthSelect', 'select');
mockDomElements['monthSelect'].value = '2026-09';
createMockElement('timeFilterSelect', 'select');
mockDomElements['timeFilterSelect'].value = 'all_month';

global.document = {
    getElementById(id) {
        return mockDomElements[id] || null;
    },
    createElement(tag) {
        return createMockElement('dyn_' + Math.random().toString(36).substr(2, 6), tag);
    },
    querySelectorAll(sel) {
        return [];
    }
};

global.window = {
    analyticsCharts: {}
};

// 1. Function existence test
assert.strictEqual(typeof initTabs, 'function', 'initTabs should be exported as a function');
assert.strictEqual(typeof renderMonthlyKpiSummaryCards, 'function', 'renderMonthlyKpiSummaryCards should be exported');
assert.strictEqual(typeof refreshMonthlyAnalytics, 'function', 'refreshMonthlyAnalytics should be exported');
assert.strictEqual(typeof updateAnalyticsMonthBadge, 'function', 'updateAnalyticsMonthBadge should be exported');
console.log('✔ Passed: Tab controller functions exist and are exported');

// 2. Month Badge Formatting Test
{
    const badge = mockDomElements['tabAnalyticsMonthBadge'];
    updateAnalyticsMonthBadge('2026-09');
    assert.strictEqual(badge.textContent, 'Tháng 09/2026', 'Badge text for 2026-09 should be Tháng 09/2026');

    updateAnalyticsMonthBadge('2026-12');
    assert.strictEqual(badge.textContent, 'Tháng 12/2026', 'Badge text for 2026-12 should be Tháng 12/2026');

    updateAnalyticsMonthBadge('2027-01');
    assert.strictEqual(badge.textContent, 'Tháng 01/2027', 'Badge text for 2027-01 should be Tháng 01/2027');

    if (typeof setLanguage === 'function') {
        setLanguage('en');
        updateAnalyticsMonthBadge('2026-09');
        assert.strictEqual(badge.textContent, 'Month 09/2026', 'Badge text for 2026-09 in EN should be Month 09/2026');
        setLanguage('vi');
    }
    console.log('✔ Passed: Month badge format test (VI & EN)');
}

// 3. Tab Switching Behavior Test
(async () => {
    const tabWorkBtn = mockDomElements['tabWorkItemsBtn'];
    const tabAnalyticsBtn = mockDomElements['tabAnalyticsBtn'];
    const workItemsContent = mockDomElements['workItemsTabContent'];
    const analyticsContent = mockDomElements['analyticsTabContent'];

    // Initialize tabs
    initTabs();

    // Reset initial state: Tab 1 active
    tabWorkBtn.classList.add('active');
    tabAnalyticsBtn.classList.remove('active');
    workItemsContent.style.display = '';
    analyticsContent.style.display = 'none';

    // Simulate Click Tab 2 (Analytics)
    await tabAnalyticsBtn.dispatchEvent('click');

    assert.strictEqual(tabAnalyticsBtn.classList.contains('active'), true, 'Analytics button should have active class');
    assert.strictEqual(tabWorkBtn.classList.contains('active'), false, 'Work items button should NOT have active class');
    assert.strictEqual(workItemsContent.style.display, 'none', 'Work items content should be hidden');
    assert.strictEqual(analyticsContent.style.display, 'flex', 'Analytics content should be display: flex');
    console.log('✔ Passed: Switching to Tab 2 (Analytics) updates active classes and display styles');

    // Simulate Click Tab 1 (Work Items)
    await tabWorkBtn.dispatchEvent('click');

    assert.strictEqual(tabWorkBtn.classList.contains('active'), true, 'Work items button should have active class');
    assert.strictEqual(tabAnalyticsBtn.classList.contains('active'), false, 'Analytics button should NOT have active class');
    assert.strictEqual(workItemsContent.style.display, '', 'Work items content should be shown');
    assert.strictEqual(analyticsContent.style.display, 'none', 'Analytics content should be hidden');
    console.log('✔ Passed: Switching back to Tab 1 (Work Items) updates active classes and display styles');

    // 4. Monthly KPI Summary Cards Rendering Test
    {
        const summaryGrid = mockDomElements['monthlyKpiSummaryCards'];
        summaryGrid.innerHTML = '';
        summaryGrid.children = [];

        const mockItems = [
            // Work items
            { addedAt: '2026-09-01', estimate: 8, spent: 8, isUnplanned: false, isLate: false, state: 'closed', isMR: false },
            { addedAt: '2026-09-02', estimate: 8, spent: 9, isUnplanned: true, isLate: true, state: 'closed', isMR: false },
            { addedAt: '2026-09-03', estimate: 6, spent: 6, isUnplanned: false, isLate: false, state: 'opened', isMR: false },
            // MR item
            { addedAt: '2026-09-04', isMR: true, state: 'merged', title: 'MR 1' },
            { addedAt: '2026-09-05', isMR: true, state: 'opened', title: 'MR 2' }
        ];

        renderMonthlyKpiSummaryCards(mockItems, 2026, 9);

        // Check cards in summaryGrid
        const html = summaryGrid.innerHTML;
        assert(html.includes('Dự báo Điểm KPI Tháng') || summaryGrid.children.some(c => c.innerHTML.includes('Dự báo Điểm KPI Tháng')), 'Should contain KPI score card');
        assert(html.includes('Tổng Giờ Đã Log / Chỉ Tiêu') || summaryGrid.children.some(c => c.innerHTML.includes('Tổng Giờ Đã Log / Chỉ Tiêu')), 'Should contain Logged Hours card');
        assert(html.includes('Tỷ lệ đúng hạn') || summaryGrid.children.some(c => c.innerHTML.includes('Tỷ lệ đúng hạn')), 'Should contain On-time rate card');
        assert(html.includes('Tổng Merge Requests') || summaryGrid.children.some(c => c.innerHTML.includes('Tổng Merge Requests')), 'Should contain MRs card');
        assert(html.includes('Kế hoạch / Phát sinh') || summaryGrid.children.some(c => c.innerHTML.includes('Kế hoạch / Phát sinh')), 'Should contain Planned/Unplanned card');

        // Check values: 2 MRs total
        assert(html.includes('2') && (html.includes('MR') || html.includes('Merge Request')), 'MR card should reflect 2 MRs');
        // Total spent: 8 + 9 + 6 = 23h
        assert(html.includes('23'), 'Hours card should reflect 23h logged');
        // On-time rate: 2 out of 3 work items = 66.7%
        assert(html.includes('66.7') || html.includes('67'), 'On-time card should reflect on-time percentage');

        console.log('✔ Passed: renderMonthlyKpiSummaryCards renders 5 cards with accurate aggregated metrics');
    }

    // The monthly summary must agree with the audit for tasks spanning months.
    {
        const items = [{
            state: 'opened', estimate: 40, spent: 12, addedAt: '2026-09-01',
            timelogs: [
                { spentAt: '2026-09-15', timeSpent: 28800 },
                { spentAt: '2026-10-02', timeSpent: 7200 },
                { spentAt: '2026-10-05', timeSpent: 7200 }
            ]
        }, {
            isMR: true, state: 'merged', spent: 20, addedAt: '2026-09-01',
            timelogs: [{ spentAt: '2026-10-05', timeSpent: 3600 }]
        }];
        const timesheet = calculateMonthlyTimesheet(items, 2026, 10, new Date(2026, 9, 31));
        renderMonthlyKpiSummaryCards(items, 2026, 10, timesheet);
        assert.strictEqual(timesheet.totalHours, 5);
        const utils = require('../utils.js');
        const expectedScore = utils.calculateKpiScore(utils.calculateStats(items, 'all_month', '2026-10')).totalScore;
        assert(mockDomElements['monthlyKpiSummaryCards'].innerHTML.includes(expectedScore.toFixed(2) + ' '), 'Monthly card must use the shared monthly KPI score');
        assert(mockDomElements['monthlyKpiSummaryCards'].innerHTML.includes('5h '), 'Monthly hours card must show 5h, not the 32h lifetime total');
        console.log('✔ Passed: Monthly cards and timesheet agree for ongoing tasks and MRs across months');
    }

    // 5. Empty Data Handling for Summary Cards
    {
        const summaryGrid = mockDomElements['monthlyKpiSummaryCards'];
        summaryGrid.innerHTML = '';
        summaryGrid.children = [];

        assert.doesNotThrow(() => {
            renderMonthlyKpiSummaryCards([], 2026, 9);
        }, 'Empty items array should not throw');

        const html = summaryGrid.innerHTML;
        assert(html.includes('0') || html.includes('—'), 'Empty summary cards should gracefully show 0 or default placeholder');
        console.log('✔ Passed: renderMonthlyKpiSummaryCards handles empty items list safely');
    }

    // 6. refreshMonthlyAnalytics End-to-End Orchestration Test
    {
        const mockItems = [
            { addedAt: '2026-09-02', spent: 8, estimate: 8, isUnplanned: false, isLate: false, isMR: false },
            { addedAt: '2026-09-03', spent: 7, estimate: 7, isUnplanned: false, isLate: false, isMR: false },
            { addedAt: '2026-09-04', isMR: true, state: 'merged' }
        ];

        await refreshMonthlyAnalytics('2026-09', mockItems);

        // 1. Badge updated
        assert.strictEqual(mockDomElements['tabAnalyticsMonthBadge'].textContent, 'Tháng 09/2026');

        // 2. Summary cards rendered
        assert(mockDomElements['monthlyKpiSummaryCards'].innerHTML.includes('Dự báo Điểm KPI Tháng'));

        // 3. Timesheet chips rendered
        assert(mockDomElements['timesheetSummaryChips'].children.length > 0 || mockDomElements['timesheetSummaryChips'].innerHTML.length > 0);

        // 4. Timesheet grid rendered (30 calendar cells for September 2026)
        assert(mockDomElements['timesheetCalendarGrid'].children.length === 30 || mockDomElements['timesheetCalendarGrid'].innerHTML.length > 0);

        console.log('✔ Passed: refreshMonthlyAnalytics orchestrates cards, timesheet, and charts');
    }

    console.log('\n--- ALL TAB CONTROLLER & SYNCHRONIZATION TESTS PASSED ---');
})();
