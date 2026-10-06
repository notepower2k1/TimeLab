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

// =========================================================================
// TEST SUITE 5: Open Overdue Tasks & isItemLate Evaluation
// =========================================================================
(() => {
    console.log('▶ [TEST 5] isItemLate & Progress Status for Open Overdue Tasks...');

    const refDate = new Date('2026-10-04'); // Reference today = 2026-10-04

    // 1. Closed on time: closedAt 2026-09-25, dueDate 2026-09-28
    const closedOnTime = {
        state: 'closed',
        closedAt: '2026-09-25T10:00:00Z',
        dueDate: '28/09/2026'
    };
    assert.strictEqual(utils.isItemLate(closedOnTime, refDate), false, 'Closed on time should not be late');
    assert.strictEqual(utils.getItemProgressStatus(closedOnTime, refDate), 'Đúng hạn');

    // 2. Closed late: closedAt 2026-09-30, dueDate 2026-09-28
    const closedLate = {
        state: 'closed',
        closedAt: '2026-09-30T10:00:00Z',
        dueDate: '2026-09-28'
    };
    assert.strictEqual(utils.isItemLate(closedLate, refDate), true, 'Closed after due date should be late');
    assert.strictEqual(utils.getItemProgressStatus(closedLate, refDate), 'Trễ hạn');

    // 3. Open task with future dueDate: dueDate 2026-10-10 (refDate 2026-10-04)
    const openFutureDue = {
        state: 'opened',
        dueDate: '10/10/2026'
    };
    assert.strictEqual(utils.isItemLate(openFutureDue, refDate), false, 'Open task with future due date should not be late');
    assert.strictEqual(utils.getItemProgressStatus(openFutureDue, refDate), 'Đúng hạn');

    // 4. Open task with PAST dueDate: dueDate 2026-09-28 (refDate 2026-10-04)
    const openOverdue = {
        state: 'opened',
        dueDate: '28/09/2026'
    };
    assert.strictEqual(utils.isItemLate(openOverdue, refDate), true, 'Open task with past due date MUST BE LATE (Trễ hạn)');
    assert.strictEqual(utils.getItemProgressStatus(openOverdue, refDate), 'Trễ hạn');

    // 5. Open task without dueDate
    const openNoDueDate = {
        state: 'opened'
    };
    assert.strictEqual(utils.isItemLate(openNoDueDate, refDate), false, 'Open task without due date should not be late');
    assert.strictEqual(utils.getItemProgressStatus(openNoDueDate, refDate), 'Đúng hạn');

    console.log('   ✔ Passed: isItemLate accurately identifies open overdue tasks');
})();

// =========================================================================
// TEST SUITE 6: Stored DD/MM/YYYY Dates & Same-Day Deadline Regression
// =========================================================================
(() => {
    console.log('▶ [TEST 6] Stored dates and tasks closed on their due date...');

    // These are the mixed date formats persisted by getWorkItemDetailNew.
    const closedOnDueDate = {
        state: 'closed',
        createdAt: '2026-10-05T08:00:00Z',
        addedAt: '2026-10-05T08:00:00Z',
        closedAt: '2026-10-05T16:30:00Z',
        closeDate: '05/10/2026',
        dueDate: '05/10/2026',
        progress: 'Đúng hạn',
        isLate: false
    };
    const today = new Date('2026-10-05T10:00:00Z');

    assert.strictEqual(utils.parseToIsoDate(closedOnDueDate.dueDate), '2026-10-05');
    assert.strictEqual(utils.isItemLate(closedOnDueDate, today), false, 'Closed on the due date must be on time');
    assert.strictEqual(utils.getItemProgressStatus(closedOnDueDate, today), 'Đúng hạn');
    assert.strictEqual(utils.isItemActiveInFilter(closedOnDueDate, 'day:2026-10-05', '2026-10'), true);

    for (let day = 1; day <= 12; day++) {
        const dd = String(day).padStart(2, '0');
        const task = { ...closedOnDueDate, closedAt: `2026-10-${dd}T16:30:00Z`, closeDate: `${dd}/10/2026`, dueDate: `${dd}/10/2026` };
        assert.strictEqual(utils.isItemLate(task, today), false, `Day ${day} must not be interpreted as a month`);
        assert.strictEqual(utils.isItemLate({ ...task, closedAt: '', closeDate: `${dd}/10/2026` }, today), false, 'Legacy formatted close date must agree with ISO closedAt');
    }

    assert.strictEqual(utils.isItemLate({ ...closedOnDueDate, closedAt: '2026-10-04T16:30:00Z' }, today), false);
    assert.strictEqual(utils.isItemLate({ ...closedOnDueDate, closedAt: '2026-10-06T00:01:00Z' }, today), true);
    assert.strictEqual(utils.isItemLate({ state: 'opened', dueDate: '05/10/2026' }, today), false, 'Open task due today is not overdue');
    assert.strictEqual(utils.isItemLate({ state: 'opened', dueDate: '04/10/2026' }, today), true);
    assert.strictEqual(utils.parseToIsoDate('16:30:00 05/10/2026'), '2026-10-05');
    assert.strictEqual(utils.parseToIsoDate('10/15/2026'), '2026-10-15', 'Unambiguous US dates remain supported');

    const chartData = pageModule.calculateMonthlyChartData([closedOnDueDate], 2026, 10, today);
    assert.strictEqual(chartData.taskStatusData.inTimeCount, 1, 'Monthly statistics must count the task as on time');
    assert.strictEqual(chartData.taskStatusData.lateCount, 0, 'Monthly statistics must not count the task as late');

    console.log('   ✔ Passed: DD/MM/YYYY deadlines, same-day completion, and monthly statistics');
})();

// =========================================================================
// TEST SUITE 7: Timelog Dates in the Browser's Timezone
// =========================================================================
(() => {
    console.log('▶ [TEST 7] Timelogs on 02/10 and 05/10 in the local timezone...');
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    try {
        const task = {
            id: '401',
            state: 'closed',
            createdAt: '2026-09-01T08:00:00Z',
            closedAt: '2026-09-30T08:00:00Z',
            addedAt: '2026-09-01T08:00:00Z',
            spent: 4,
            // Existing cache stores the UTC date plus the original timestamp.
            timelogs: [
                { id: 'log1', spentAt: '2026-10-01', spentAtRaw: '2026-10-01T17:00:00Z', timeSpent: 7200 },
                { id: 'log2', spentAt: '2026-10-04', spentAtRaw: '2026-10-04T17:00:00Z', timeSpent: 7200 }
            ]
        };
        const today = new Date('2026-10-05T10:00:00Z');
        const timesheet = pageModule.calculateMonthlyTimesheet([task], 2026, 10, today);
        assert.strictEqual(timesheet.days[0].spentHours, 0, 'No time should be assigned to 01/10');
        assert.strictEqual(timesheet.days[1].spentHours, 2, '02/10 must receive its 2h log');
        assert.strictEqual(timesheet.days[3].spentHours, 0, 'No time should be assigned to 04/10');
        assert.strictEqual(timesheet.days[4].spentHours, 2, '05/10 must receive its 2h log');
        assert.strictEqual(timesheet.days[4].taskItems[0].timelogId, 'log2');
        assert.strictEqual(timesheet.totalHours, 4);

        assert.strictEqual(utils.getTimelogDate({ spentAt: '2026-10-01T17:00:00Z' }), '2026-10-02');
        assert.strictEqual(utils.getTimelogDate({ spentAt: '2026-10-02' }), '2026-10-02', 'Date-only values must stay unchanged');
        assert.strictEqual(utils.getTimelogDate({ spent_at: '2026-10-02T00:00:00+07:00' }), '2026-10-02');
        assert.strictEqual(utils.getTimelogDate({ spentAt: '02/10/2026' }), '2026-10-02');
        assert.strictEqual(utils.getTimelogDate(null), '');
        assert.strictEqual(utils.isItemActiveInFilter(task, 'day:2026-10-02', '2026-10'), true);
        assert.strictEqual(utils.isItemActiveInFilter(task, 'day:2026-10-01', '2026-10'), false);
        assert.strictEqual(utils.isItemActiveInWeek(task, '2026-10-05', '2026-10-11'), true);

        const chart = pageModule.calculateMonthlyChartData([task], 2026, 10, today);
        assert.strictEqual(chart.weeklyData.spentHours[0], 2);
        assert.strictEqual(chart.weeklyData.spentHours[1], 2, '05/10 log must belong to the second week');

        const monthBoundaryTask = { ...task, timelogs: [{ spentAt: '2026-09-30', spentAtRaw: '2026-09-30T17:00:00Z', timeSpent: 7200 }] };
        assert.strictEqual(utils.isItemActiveInFilter(monthBoundaryTask, 'all_month', '2026-10'), true, 'Local timelog date must determine month membership');
        const oldLog = { timelogs: [{ spentAt: '2019-12-31', spentAtRaw: '2019-12-31T17:00:00Z' }] };
        assert.ok(utils.getAvailableMonths([oldLog]).some(month => month.value === '2020-01'), 'Available months must include the local timelog month');
        console.log('   ✔ Passed: Local timelog dates, cached timestamps, daily filters, and weekly charts');
    } finally {
        if (previousTimezone === undefined) delete process.env.TZ;
        else process.env.TZ = previousTimezone;
    }
})();

// =========================================================================
// TEST SUITE 8: Ongoing Tasks Must Only Contribute Hours Logged in the Period
// =========================================================================
(() => {
    console.log('▶ [TEST 8] Day/week/month spent for an ongoing task...');
    const task = {
        id: '501', state: 'opened', estimate: 40, spent: 12,
        createdAt: '2026-09-01', addedAt: '2026-09-01',
        startDate: '01/09/2026', dueDate: '30/10/2026',
        type: 'Kế hoạch', progress: 'Đúng hạn',
        timelogs: [
            { spentAt: '2026-09-15', timeSpent: 28800 },
            { spentAt: '2026-10-02', timeSpent: 7200 },
            { spentAt: '2026-10-05', timeSpent: 7200 }
        ]
    };
    const today = new Date(2026, 9, 5, 12);
    const periods = [
        ['week:2026-09-28:2026-10-04', 2],
        ['week:2026-10-05:2026-10-11', 2],
        ['week:2026-10-12:2026-10-18', 0],
        ['current_week', 2],
        ['day:2026-10-02', 2],
        ['all_month', 4],
        ['custom_range', 4]
    ];
    for (const [filter, expectedSpent] of periods) {
        const stats = utils.calculateStats([task], filter, '2026-10', '2026-10-01', '2026-10-05', today);
        assert.strictEqual(Number(stats.totalSpent), expectedSpent, `${filter} must sum only its timelogs`);
        assert.strictEqual(Number(stats.totalSpentPlannedTask), expectedSpent);
        assert.strictEqual(Number(stats.totalEstimate), 40, 'Estimate remains the whole-task estimate');
        assert.strictEqual(stats.totalTask, 1, 'The open task remains included');
        assert.strictEqual(Number(stats.dailySpentTime), 2, 'Daily spent follows the log date, not the date the task was added');
    }
    assert.strictEqual(utils.calculateStats([task], 'week:2026-10-05:2026-10-11', '2026-10').workingHours, 48);
    assert.strictEqual(utils.calculateStats([task], 'all_month', '2026-10').workingHours, 176);
    assert.strictEqual(Number(utils.calculateStats([], 'current_week').totalSpent), 0);
    assert.strictEqual(Number(utils.calculateStats([task], 'day:2026-10-03').dailySpentTime), 0);
    assert.strictEqual(Number(utils.calculateStats([task], 'custom_range', null, '2026-10-03', '2026-10-05').totalSpent), 2);
    assert.strictEqual(Number(utils.calculateStats([task], 'month:2026-09').totalSpent), 8);

    const legacy = { ...task, timelogs: undefined, addedAt: '2026-10-02', spent: 3 };
    assert.strictEqual(Number(utils.calculateStats([legacy], 'week:2026-09-28:2026-10-04').totalSpent), 3);
    assert.strictEqual(Number(utils.calculateStats([legacy], 'week:2026-10-05:2026-10-11').totalSpent), 0, 'Legacy hours must not repeat in every carry-over week');
    assert.strictEqual(Number(utils.calculateStats([legacy], 'day:2026-10-03').totalSpent), 0);

    const mr = { ...task, isMR: true, spent: 99, timelogs: [{ spentAt: '2026-10-05', timeSpentHours: 1.5 }] };
    const withMr = utils.calculateStats([task, mr], 'all_month', '2026-10');
    assert.strictEqual(Number(withMr.totalSpent), 5.5);
    assert.strictEqual(withMr.totalTask, 1);

    const boundaryTask = { ...task, timelogs: [
        { spentAt: '2026-09-30', timeSpentHours: 8 },
        { spentAt: '2026-10-02', timeSpentHours: 2 },
        { spentAt: '2026-10-05', timeSpentHours: 2 },
        { spentAt: '2026-11-01', timeSpentHours: 8 }
    ] };
    const chart = pageModule.calculateMonthlyChartData([boundaryTask], 2026, 10, today);
    assert.strictEqual(chart.weeklyData.spentHours.reduce((sum, hours) => sum + hours, 0), 4, 'Monthly charts must exclude adjacent-month logs');
    assert.strictEqual(chart.weeklyData.spentHours[0], 2);
    assert.strictEqual(chart.weeklyData.spentHours[1], 2);

    const monthStats = utils.calculateStats([{ ...task, spent: 120 }], 'all_month', '2026-10');
    assert.strictEqual(utils.calculateKpiScore(monthStats).totalScore, 3.8, 'Monthly KPI must use 4h logged in October');
    const leaveDays = { '2026-10-02': { value: 1 }, '2026-10-05': { value: 0.5 } };
    const withLeave = utils.calculateStats([task], 'all_month', '2026-10', null, null, today, leaveDays);
    assert.strictEqual(withLeave.workingHours, 164);
    assert.strictEqual(withLeave.workingHours, pageModule.calculateMonthlyTimesheet([task], 2026, 10, today, leaveDays).totalTargetHours);
    assert.strictEqual(Number(task.spent), 12, 'Period reporting must not overwrite stored lifetime spent');
    console.log('   ✔ Passed: Ongoing tasks, legacy data, MRs, custom ranges, and month boundaries');
})();

// =========================================================================
// TEST SUITE 9: Whole-Task Estimate vs Lifetime Spent, Independent of Period
// =========================================================================
(() => {
    const task = {
        state: 'closed', estimate: 40, spent: 42, closeDate: '05/10/2026',
        addedAt: '2026-09-01',
        timelogs: [
            { spentAt: '2026-09-15', timeSpentHours: 10 },
            { spentAt: '2026-10-02', timeSpentHours: 30 },
            { spentAt: '2026-10-05', timeSpentHours: 2 }
        ]
    };
    assert.strictEqual(utils.getItemEstimateVariance(task), 2);
    for (const filter of ['all_month', 'week:2026-10-05:2026-10-11', 'day:2026-10-05']) {
        const range = utils.getPeriodDateRange(filter, '2026-10');
        const displayed = { ...task, lifetimeSpent: utils.getItemSpentInRange(task), spent: utils.getItemSpentInRange(task, range.start, range.end) };
        assert.strictEqual(utils.getItemEstimateVariance(displayed), 2, 'Variance must use lifetime spent, regardless of the period');
        const projectedAgain = { ...displayed, lifetimeSpent: utils.getItemSpentInRange(displayed), spent: utils.getItemSpentInRange(displayed, '2026-10-05', '2026-10-05') };
        assert.strictEqual(projectedAgain.spent, 2);
        assert.strictEqual(utils.getItemEstimateVariance(projectedAgain), 2, 'Repeated period projections must preserve lifetime spent');
    }
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, state: 'opened' }), null, 'Reopened task with a stale close date must remain unevaluated');
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, state: 'opened', closeDate: '' }), null);
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, estimate: 0 }), null);
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, state: 'merged', isMR: true }), 2);
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, state: undefined }), 2, 'Legacy close dates must be supported');
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, spent: 38 }), -2);
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, spent: 40 }), 0);
    assert.strictEqual(utils.getItemEstimateVariance({ ...task, spent: undefined }), 2, 'Timelogs supply lifetime spent when the total is absent');
    assert.strictEqual(utils.calculateStats([task], 'all_month', '2026-10').spentTimeVsEstimateRate, undefined, 'Period stats must not compare period spent with whole-task estimates');
    assert.strictEqual(task.spent, 42, 'Reporting must preserve stored totals');

    const originalDocument = global.document;
    global.document = {
        createElement: () => ({ className: '', classList: { add() {} } })
    };
    try {
        const displayed = { ...task, lifetimeSpent: 42, spent: 32 };
        const cell = pageModule.createEstimateVarianceCell(displayed);
        assert.strictEqual(cell.textContent, '+2.00h');
        assert(cell.title.includes('42h') && cell.title.includes('40h'), 'Tooltip must explain the lifetime comparison');
        assert.strictEqual(pageModule.createEstimateVarianceCell({ ...displayed, state: 'opened' }).textContent, '—');
        assert.strictEqual(pageModule.createEstimateVarianceCell({ ...displayed, lifetimeSpent: 38 }).textContent, '-2.00h');
    } finally {
        global.document = originalDocument;
    }
    console.log('   ✔ Passed: Closed-task variance, period projections, reopened tasks, legacy totals, and UI cells');
})();

// Run the real monthly export against the bundled workbook and template.
(async () => {
    const fs = require('fs');
    const vm = require('vm');
    const path = require('path');
    const ExcelJS = require('../page/exceljs.min.js');
    const source = fs.readFileSync(path.join(__dirname, '../page/page.js'), 'utf8');
    const start = source.indexOf('    async function exportMonthlyKPIExcel() {');
    const end = source.indexOf('    async function saveKpiInfo', start);
    const template = fs.readFileSync(path.join(__dirname, '../page/kpi_template.xlsx'));
    const items = [
        { taskUrl: 'https://gitlab.widosoft.com/team/project/-/work_items/1', groupName: 'Project', state: 'closed', estimate: 40, spent: 42, addedAt: '2026-09-01', closeDate: '2026-10-05', timelogs: [
            { spentAt: '2026-09-15', timeSpentHours: 10 }, { spentAt: '2026-10-05', timeSpentHours: 32 }
        ] },
        { taskUrl: 'https://gitlab.widosoft.com/team/project/-/work_items/2', groupName: 'Project', state: 'opened', estimate: 20, spent: 4, addedAt: '2026-10-01', timelogs: [{ spentAt: '2026-10-05', timeSpentHours: 4 }] },
        { taskUrl: 'https://gitlab.widosoft.com/team/project/-/merge_requests/3', isMR: true, state: 'merged', estimate: 2, spent: 3, addedAt: '2026-10-01', timelogs: [{ spentAt: '2026-10-05', timeSpentHours: 3 }] }
    ];
    let exported, synced = false;
    items[0].spent = 41; // Stale cached data must be refreshed before building the workbook.
    const context = vm.createContext({
        ...utils, ExcelJS, console,
        gitlabServerUrl: 'https://gitlab.widosoft.com',
        monthSelect: { value: '2026-10' },
        getStoredIds: async () => items,
        KpiSync: { syncBeforeExport: async month => { assert.strictEqual(month, '2026-10'); items[0].spent = 42; synced = true; } },
        getDashboardItems: async () => { assert(synced, 'Export must read the refreshed cache after full sync'); return items; },
        calculateStats: data => utils.calculateStats(data, 'all_month', '2026-10'),
        _tr: (key, params) => require('../i18n.js').t(key, params, 'vi'),
        fetch: async () => ({ ok: true, arrayBuffer: async () => template }),
        alert: message => { throw new Error(message); },
        triggerExcelDownload: buffer => { exported = buffer; }
    });
    assert(start >= 0 && end > start, 'Monthly export must be available');
    await vm.runInContext(source.slice(start, end) + '\nexportMonthlyKPIExcel()', context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exported);
    const sheet = workbook.getWorksheet('Báo cáo công việc');
    const rows = [];
    sheet.eachRow(row => {
        if (row.getCell('B').value?.hyperlink) rows.push(row);
    });
    assert.strictEqual(rows.length, 3, 'Monthly Excel must contain one row per task/MR');
    const closed = rows.find(row => row.getCell('B').value.hyperlink === items[0].taskUrl);
    const open = rows.find(row => row.getCell('B').value.hyperlink === items[1].taskUrl);
    const mr = rows.find(row => row.getCell('B').value.hyperlink === items[2].taskUrl);
    assert.strictEqual(closed.getCell('F').value, 40);
    assert.strictEqual(closed.getCell('G').value, 32);
    assert.strictEqual(closed.getCell('H').value, 42);
    assert.strictEqual(closed.getCell('L').value, 2);
    assert.strictEqual(open.getCell('H').value, 4);
    assert.strictEqual(open.getCell('L').value, '—');
    assert.strictEqual(mr.getCell('E').value, 3);
    assert.strictEqual(mr.getCell('F').value, 1);
    assert.strictEqual(sheet.getCell('N9').value, 39);
    assert.strictEqual(sheet.getCell('M8').value, null);
    assert.strictEqual(sheet.getCell('N8').value, null);
    assert.strictEqual(sheet.getCell('M33').value, null);
    assert.strictEqual(sheet.getCell('N33').value, null, 'Excel must not compare monthly spent with total estimates');
    assert.strictEqual(sheet.getCell(`F${closed.number - 1}`).value, 'Estimate toàn task (h)');
    assert.strictEqual(sheet.getCell(`G${closed.number - 1}`).value, 'Spent trong kỳ (h)');
    assert.strictEqual(sheet.getCell(`H${closed.number - 1}`).value, 'Spent toàn task (h)');
    assert.strictEqual(sheet.getCell('N3').isMerged, true, 'Summary title must remain merged after moving it');
    assert.notStrictEqual(sheet.getCell('M3').value, null);
    assert(sheet.pageSetup.printArea.includes('N'), 'Print area must include the moved summary');
    assert.strictEqual(sheet.getCell('N32').value.formula, 'N9/N7*100');
    let syncAlert;
    exported = undefined;
    context.KpiSync.syncBeforeExport = async () => { throw new Error('GitLab is offline'); };
    context.alert = message => { syncAlert = message; };
    await vm.runInContext('exportMonthlyKPIExcel()', context);
    assert.strictEqual(exported, undefined, 'A failed re-sync must not export stale or incomplete data');
    assert(syncAlert.includes('GitLab is offline'));
    console.log('   ✔ Passed: Monthly Excel refreshes before export and blocks incomplete sync');
    console.log('   ✔ Passed: Real monthly Excel export preserves lifetime variance, period hours, and one row per item');
    console.log('\n--- ALL GITLAB LIFECYCLE & TIMETRACKING TESTS PASSED! 🎉 ---');
})().catch(error => { console.error(error); process.exitCode = 1; });
