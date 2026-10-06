const assert = require('assert');
const fs = require('fs');

console.log('--- Running Monthly Chart Data Aggregation & Rendering Unit Tests ---');

// Load utils.js to provide getWeeksOfMonth if needed in Node
try {
    const utilsCode = fs.readFileSync('utils.js', 'utf8');
    eval(utilsCode);
} catch (e) {
    console.warn('Note: Could not eval utils.js:', e.message);
}

let pageModule;
let calculateMonthlyChartData;
let renderMonthlyCharts;
let analyticsCharts;

try {
    pageModule = require('../page/page.js');
    calculateMonthlyChartData = pageModule.calculateMonthlyChartData;
    renderMonthlyCharts = pageModule.renderMonthlyCharts;
    analyticsCharts = pageModule.analyticsCharts;
} catch (err) {
    console.error('Failed to import page.js:', err.message);
}

// 1. Function existence
assert.strictEqual(typeof calculateMonthlyChartData, 'function', 'calculateMonthlyChartData should be exported');
assert.strictEqual(pageModule.calculateWeeklyKpiScore, undefined, 'Weekly KPI scoring must be removed');
assert.strictEqual(typeof renderMonthlyCharts, 'function', 'renderMonthlyCharts should be exported');
assert(analyticsCharts !== undefined, 'analyticsCharts should be exported');

// 2. September 2026 Calendar Weeks Structure Test
{
    const chartData = calculateMonthlyChartData([], 2026, 9);
    assert(chartData.weeklyData, 'chartData must have weeklyData');
    assert(chartData.taskTypeData, 'chartData must have taskTypeData');
    assert(chartData.taskStatusData, 'chartData must have taskStatusData');

    const { labels, spentHours } = chartData.weeklyData;
    // September 2026 has 5 weeks (Aug 31 - Oct 4)
    assert.strictEqual(labels.length, 5, 'September 2026 should have 5 weeks');
    assert.strictEqual(spentHours.length, 5, 'spentHours should have 5 entries');

    assert.deepStrictEqual(spentHours, [0, 0, 0, 0, 0], 'Empty items should yield 0 spent hours');

    // Week 1 should start on 31/08 and end on 06/09
    assert(labels[0].includes('Tuần 1'), 'First label should be Tuần 1');
    assert(labels[0].includes('31/08'), 'First label should include 31/08');

    console.log('✔ Passed: September 2026 empty chart structure test');
}

// 3. Parameter flexibility: (items, '2026-09') vs (items, 2026, 9)
{
    const dataStr = calculateMonthlyChartData([], '2026-09');
    const dataNum = calculateMonthlyChartData([], 2026, 9);
    assert.strictEqual(dataStr.weeklyData.labels.length, dataNum.weeklyData.labels.length, 'Both argument forms should give same number of weeks');
    assert.strictEqual(dataStr.weeklyData.labels[0], dataNum.weeklyData.labels[0], 'Both argument forms should give identical week labels');
    console.log('✔ Passed: Parameter flexibility test (string vs numbers)');
}

// 4. Weekly Grouping & Hours Aggregation
{
    const mockItems = [
        // Week 1: 2026-08-31 to 2026-09-06
        { addedAt: '2026-09-01T09:00:00', timeEstimate: 10, totalSpentTime: 8, isUnplanned: false, isLate: false, state: 'closed' },
        { addedAt: '2026-09-03T10:00:00', timeEstimateHour: 6, spentTime: 6, isUnplanned: false, isLate: false, state: 'closed' },
        // Week 2: 2026-09-07 to 2026-09-13
        { addedAt: '2026-09-08T09:00:00', estimateHour: 15, spent: 16.5, isUnplanned: true, isLate: true, state: 'closed' },
        // Week 3: 2026-09-14 to 2026-09-20
        { addedAt: '2026-09-15T09:00:00', estimate: 8, spent: 7, isUnplanned: false, isLate: false, state: 'opened' },
        // Week 4: 2026-09-21 to 2026-09-27
        { addedAt: '2026-09-22T09:00:00', timeEstimate: 4, totalSpentTime: 4, type: 'Phát sinh', isLate: true, state: 'opened' }
        // Week 5: No items
    ];

    const chartData = calculateMonthlyChartData(mockItems, 2026, 9);

    // Week 1: 10 + 6 = 16 est, 8 + 6 = 14 spent
    assert.strictEqual(chartData.weeklyData.spentHours[0], 14, 'Week 1 spent should be 14');

    // Week 2: 15 est, 16.5 spent
    assert.strictEqual(chartData.weeklyData.spentHours[1], 16.5, 'Week 2 spent should be 16.5');

    // Week 3: 8 est, 7 spent
    assert.strictEqual(chartData.weeklyData.spentHours[2], 7, 'Week 3 spent should be 7');

    // Week 4: 4 est, 4 spent
    assert.strictEqual(chartData.weeklyData.spentHours[3], 4, 'Week 4 spent should be 4');

    // Week 5: 0 est, 0 spent
    assert.strictEqual(chartData.weeklyData.spentHours[4], 0, 'Week 5 spent should be 0');

    console.log('✔ Passed: Weekly grouping and hours aggregation test');
}

// 5. Planned vs Unplanned Counts Test
{
    const mockItems = [
        { addedAt: '2026-09-01', isUnplanned: false },
        { addedAt: '2026-09-02', isUnplanned: false },
        { addedAt: '2026-09-03', isUnplanned: true },
        { addedAt: '2026-09-04', type: 'Phát sinh' },
        { addedAt: '2026-09-05', type: 'Kế hoạch' }
    ];

    const chartData = calculateMonthlyChartData(mockItems, 2026, 9);
    // Planned: items 1, 2, 5 = 3
    // Unplanned: items 3, 4 = 2
    assert.strictEqual(chartData.taskTypeData.plannedCount, 3, 'Planned count should be 3');
    assert.strictEqual(chartData.taskTypeData.unplannedCount, 2, 'Unplanned count should be 2');

    console.log('✔ Passed: Planned vs Unplanned distribution test');
}

// 6. Task Status Distribution Test (In-time, Late, Open)
{
    const mockItems = [
        // In-time: closed and not late
        { addedAt: '2026-09-01', isLate: false, state: 'closed' },
        { addedAt: '2026-09-02', isLate: false, state: 'merged' },
        // Late: isLate true
        { addedAt: '2026-09-03', isLate: true, state: 'closed' },
        { addedAt: '2026-09-04', isLate: true, state: 'opened' },
        // Open: not late, state opened or isOpen
        { addedAt: '2026-09-05', isLate: false, state: 'opened' },
        { addedAt: '2026-09-06', isLate: false, isOpen: true }
    ];

    const chartData = calculateMonthlyChartData(mockItems, 2026, 9);
    assert.strictEqual(chartData.taskStatusData.inTimeCount, 2, 'In-time count should be 2');
    assert.strictEqual(chartData.taskStatusData.lateCount, 2, 'Late count should be 2');
    assert.strictEqual(chartData.taskStatusData.openCount, 2, 'Open count should be 2');

    console.log('✔ Passed: Task status distribution test (In-time / Late / Open)');
}

// A carry-over task with no logs this month still belongs in the monthly task counts.
{
    const data = calculateMonthlyChartData([{
        addedAt: '2026-08-01', state: 'opened', type: 'Kế hoạch', spent: 40,
        timelogs: [{ spentAt: '2026-08-15', timeSpentHours: 40 }]
    }], 2026, 9);
    assert.strictEqual(data.taskTypeData.plannedCount, 1);
    assert.strictEqual(data.taskStatusData.openCount, 1);
    assert.strictEqual(data.weeklyData.spentHours.reduce((sum, hours) => sum + hours, 0), 0);
}

// Weekly charts describe hours; they must never create a separate KPI score.
{
    const data = calculateMonthlyChartData([], 2026, 9);
    assert.strictEqual(data.weeklyData.kpiScores, undefined);
    assert.strictEqual(data.weeklyData.estimateHours, undefined);
    console.log('✔ Passed: Weekly charts only contain logged hours');
}

// 9. renderMonthlyCharts & Lifecycle Management Test
{
    // Test graceful handling when Chart is undefined
    const globalChartBackup = global.Chart;
    delete global.Chart;
    assert.doesNotThrow(() => {
        renderMonthlyCharts({
            weeklyData: { labels: [], spentHours: [] },
            taskTypeData: { plannedCount: 0, unplannedCount: 0 },
            taskStatusData: { inTimeCount: 0, lateCount: 0, openCount: 0 }
        });
    }, 'renderMonthlyCharts must not throw when Chart is undefined');

    // Mock Chart.js and DOM environment
    const createdCharts = [];
    class MockChart {
        constructor(ctx, config) {
            this.ctx = ctx;
            this.config = config;
            this.destroyed = false;
            createdCharts.push(this);
        }
        destroy() {
            this.destroyed = true;
        }
    }
    MockChart.getChart = (ctx) => null;
    global.Chart = MockChart;

    const mockCanvases = {
        chartWeeklyEstSpent: { id: 'chartWeeklyEstSpent', getContext: () => ({}) },
        chartTaskType: { id: 'chartTaskType', getContext: () => ({}) },
        chartTaskStatus: { id: 'chartTaskStatus', getContext: () => ({}) },
    };

    global.document = {
        getElementById: (id) => mockCanvases[id] || null
    };

    const sampleChartData = {
        weeklyData: {
            labels: ['Tuần 1', 'Tuần 2'],
            spentHours: [8, 18]
        },
        taskTypeData: { plannedCount: 8, unplannedCount: 2 },
        taskStatusData: { inTimeCount: 7, lateCount: 2, openCount: 1 }
    };

    // First render: creates 3 charts
    renderMonthlyCharts(sampleChartData);

    assert.strictEqual(analyticsCharts.kpiTrend, undefined, 'No weekly KPI chart');
    assert.strictEqual(analyticsCharts.weeklyEstSpent?.config.data.datasets.length, 1, 'Only logged hours are plotted');
    assert(analyticsCharts.weeklyEstSpent instanceof MockChart, 'weeklyEstSpent chart instance created');
    assert(analyticsCharts.taskType instanceof MockChart, 'taskType chart instance created');
    assert(analyticsCharts.taskStatus instanceof MockChart, 'taskStatus chart instance created');

    const firstRunInstances = [
        analyticsCharts.weeklyEstSpent,
        analyticsCharts.taskType,
        analyticsCharts.taskStatus,
    ];

    // Check responsive and maintainAspectRatio
    firstRunInstances.forEach(inst => {
        assert.strictEqual(inst.config.options.responsive, true, 'responsive must be true');
        assert.strictEqual(inst.config.options.maintainAspectRatio, false, 'maintainAspectRatio must be false');
    });

    // Second render: must destroy previous instances
    renderMonthlyCharts(sampleChartData);

    firstRunInstances.forEach(oldInst => {
        assert.strictEqual(oldInst.destroyed, true, 'Old chart instance must be destroyed on re-render');
    });

    // Cleanup globals
    if (globalChartBackup) {
        global.Chart = globalChartBackup;
    } else {
        delete global.Chart;
    }
    delete global.document;

    console.log('✔ Passed: renderMonthlyCharts lifecycle and destroy management test');
}

console.log('\n--- ALL MONTHLY CHART AGGREGATION & RENDERING TESTS PASSED ---');
