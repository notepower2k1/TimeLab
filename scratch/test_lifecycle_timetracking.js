// scratch/test_lifecycle_timetracking.js
// Comprehensive Unit Tests for GitLab Lifecycle & Timelogs-based KPI & Timesheet Tracking

const assert = require('assert');
const utils = require('../utils.js');
const pageModule = require('../page/page.js');

console.log('--- Running GitLab Lifecycle & Timelogs Tracking Unit Tests ---');

// =========================================================================
// TEST SUITE 1: Lifecycle Date Resolution & Week/Month Filtering in utils.js
// =========================================================================
(() => {
    console.log('▶ [TEST 1] Lifecycle Date Resolution & Carry-Over in utils.js...');

    // Week range: Week 40 of 2026 (2026-09-28 to 2026-10-04)
    const wStart = '2026-09-28';
    const wEnd = '2026-10-04';

    // 1. Task created in this week, still open
    const taskInWeekOpen = {
        id: '1',
        createdAt: '2026-09-29T10:00:00Z',
        state: 'opened'
    };
    assert.strictEqual(utils.isItemActiveInWeek(taskInWeekOpen, wStart, wEnd), true, 'Task created in week should be active in week');
    assert.strictEqual(utils.isItemCarryOver(taskInWeekOpen, wStart), false, 'Task created in week is not carry-over');

    // 2. Task created in previous week, still open (Carry-over)
    const taskCarryOver = {
        id: '2',
        createdAt: '2026-09-15T08:00:00Z',
        state: 'opened'
    };
    assert.strictEqual(utils.isItemActiveInWeek(taskCarryOver, wStart, wEnd), true, 'Open task from previous week should be active in current week (carried over)');
    assert.strictEqual(utils.isItemCarryOver(taskCarryOver, wStart), true, 'Open task created before week start is carry-over');

    // 3. Task created in previous week and CLOSED in previous week
    const taskClosedPast = {
        id: '3',
        createdAt: '2026-09-10T08:00:00Z',
        closeDate: '2026-09-20',
        state: 'closed'
    };
    assert.strictEqual(utils.isItemActiveInWeek(taskClosedPast, wStart, wEnd), false, 'Task closed before week start should NOT be active');

    // 4. Task created in previous week, but CLOSED in this week
    const taskClosedThisWeek = {
        id: '4',
        createdAt: '2026-09-10T08:00:00Z',
        closeDate: '2026-09-30',
        closedAt: '2026-09-30T15:00:00Z',
        state: 'closed'
    };
    assert.strictEqual(utils.isItemActiveInWeek(taskClosedThisWeek, wStart, wEnd), true, 'Task closed in this week should be active in this week');

    // 5. Task created months ago, closed months later, but HAS TIMELOG in this week
    const taskWithTimelogInWeek = {
        id: '5',
        createdAt: '2026-07-01T08:00:00Z',
        closeDate: '2026-11-01',
        state: 'opened',
        timelogs: [
            { spentAt: '2026-09-29', timeSpent: 10800, timeSpentHours: 3.0 }
        ]
    };
    assert.strictEqual(utils.isItemActiveInWeek(taskWithTimelogInWeek, wStart, wEnd), true, 'Task with timelog in week should be active in week');

    // 6. Backward compatibility: Task with only addedAt / createAt
    const legacyTask = {
        id: '6',
        addedAt: '2026-09-30T10:00:00Z',
        state: 'opened'
    };
    assert.strictEqual(utils.isItemActiveInWeek(legacyTask, wStart, wEnd), true, 'Legacy task with addedAt should remain active');
    assert.strictEqual(utils.isItemCarryOver(legacyTask, wStart), false);

    console.log('   ✔ Passed: Lifecycle date resolution and carry-over logic in utils.js');
})();

// =========================================================================
// TEST SUITE 2: isItemActiveInFilter for Months and Days
// =========================================================================
(() => {
    console.log('▶ [TEST 2] isItemActiveInFilter for all_month and day:YYYY-MM-DD...');

    const selMonth = '2026-10';

    // 1. Task created in October
    const taskOct = { id: '10', createdAt: '2026-10-02T10:00:00Z', state: 'opened' };
    assert.strictEqual(utils.isItemActiveInFilter(taskOct, 'all_month', selMonth), true);

    // 2. Task created in September, still open in October
    const taskSepOpen = { id: '11', createdAt: '2026-09-20T10:00:00Z', state: 'opened' };
    assert.strictEqual(utils.isItemActiveInFilter(taskSepOpen, 'all_month', selMonth), true);

    // 3. Task created in September, closed in September
    const taskSepClosed = { id: '12', createdAt: '2026-09-10T10:00:00Z', closeDate: '2026-09-25', state: 'closed' };
    assert.strictEqual(utils.isItemActiveInFilter(taskSepClosed, 'all_month', selMonth), false);

    // 4. Task with timelog on specific day
    const taskDay = {
        id: '13',
        createdAt: '2026-09-15T10:00:00Z',
        timelogs: [
            { spentAt: '2026-10-02', timeSpentHours: 3.5 }
        ]
    };
    assert.strictEqual(utils.isItemActiveInFilter(taskDay, 'day:2026-10-02', selMonth), true, 'Task with timelog on day should match day filter');
    assert.strictEqual(utils.isItemActiveInFilter(taskDay, 'day:2026-10-03', selMonth), false, 'Task without timelog on day should not match');

    console.log('   ✔ Passed: isItemActiveInFilter for month and day filters');
})();

// =========================================================================
// TEST SUITE 3: Daily Timesheet Audit with Timelogs
// =========================================================================
(() => {
    console.log('▶ [TEST 3] calculateMonthlyTimesheet with Timelogs Distribution...');

    // Task A: Total spent = 7h, but split across 2 days: 3h on 2026-10-02, 4h on 2026-10-03
    const taskA = {
        id: '201',
        title: 'Feature X',
        spent: 7.0,
        createdAt: '2026-10-01T08:00:00Z',
        timelogs: [
            { spentAt: '2026-10-02T09:00:00Z', timeSpent: 10800, timeSpentHours: 3.0 },
            { spentAt: '2026-10-03T14:00:00Z', timeSpent: 14400, timeSpentHours: 4.0 }
        ]
    };

    // Task B: Legacy task without timelogs (spent = 5.0h on 2026-10-05)
    const taskB = {
        id: '202',
        title: 'Legacy Bug',
        spent: 5.0,
        addedAt: '2026-10-05T08:00:00Z'
    };

    const timesheet = pageModule.calculateMonthlyTimesheet([taskA, taskB], 2026, 10, new Date('2026-10-31'));

    // Check day 2 (2026-10-02): Should have exactly 3.0h from Task A
    const day2 = timesheet.days.find(d => d.dateIso === '2026-10-02');
    assert.ok(day2, 'Day 2026-10-02 must exist in timesheet');
    assert.strictEqual(day2.spentHours, 3.0, `Day 2 spentHours should be 3.0h, got ${day2.spentHours}`);

    // Check day 3 (2026-10-03): Should have exactly 4.0h from Task A
    const day3 = timesheet.days.find(d => d.dateIso === '2026-10-03');
    assert.ok(day3, 'Day 2026-10-03 must exist in timesheet');
    assert.strictEqual(day3.spentHours, 4.0, `Day 3 spentHours should be 4.0h, got ${day3.spentHours}`);

    // Check day 5 (2026-10-05): Should have exactly 5.0h from Task B
    const day5 = timesheet.days.find(d => d.dateIso === '2026-10-05');
    assert.ok(day5, 'Day 2026-10-05 must exist in timesheet');
    assert.strictEqual(day5.spentHours, 5.0, `Day 5 spentHours should be 5.0h, got ${day5.spentHours}`);

    // Total monthly spent should be 3 + 4 + 5 = 12.0h
    assert.strictEqual(timesheet.totalHours, 12.0, `Total monthly hours should be 12.0h, got ${timesheet.totalHours}`);

    console.log('   ✔ Passed: calculateMonthlyTimesheet accurately distributes timelogs per day');
})();

// =========================================================================
// TEST SUITE 4: Monthly Chart Weekly Spent Distribution with Timelogs
// =========================================================================
(() => {
    console.log('▶ [TEST 4] calculateMonthlyChartData with Timelogs across Weeks...');

    // Task spanning 2 weeks in September 2026:
    // Week 1 (2026-08-31 to 2026-09-06): Logged 5h on 2026-09-02
    // Week 2 (2026-09-07 to 2026-09-13): Logged 8h on 2026-09-09
    const spanningTask = {
        id: '301',
        title: 'Spanning Feature',
        spent: 13.0,
        estimate: 12.0,
        createdAt: '2026-09-01T08:00:00Z',
        isUnplanned: false,
        isLate: false,
        state: 'closed',
        closeDate: '2026-09-10',
        timelogs: [
            { spentAt: '2026-09-02', timeSpent: 18000, timeSpentHours: 5.0 },
            { spentAt: '2026-09-09', timeSpent: 28800, timeSpentHours: 8.0 }
        ]
    };

    const chartData = pageModule.calculateMonthlyChartData([spanningTask], 2026, 9);
    assert.ok(chartData && chartData.weeklyData, 'Chart data must have weeklyData');

    // Week 1 should receive 5.0h spent
    // Week 2 should receive 8.0h spent
    const spentByWeek = chartData.weeklyData.spentHours;
    assert.strictEqual(spentByWeek[0], 5.0, `Week 1 spent hours should be 5.0h, got ${spentByWeek[0]}`);
    assert.strictEqual(spentByWeek[1], 8.0, `Week 2 spent hours should be 8.0h, got ${spentByWeek[1]}`);

    console.log('   ✔ Passed: calculateMonthlyChartData assigns spent hours to weeks by timelogs');
})();

console.log('\n--- ALL GITLAB LIFECYCLE & TIMETRACKING TESTS PASSED! 🎉 ---');
