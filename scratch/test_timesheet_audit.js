const assert = require('assert');

// Test Daily Timesheet Audit Calculation & Rendering
console.log('--- Running Daily Timesheet Audit Unit Tests ---');

let calculateMonthlyTimesheet;
let renderDailyTimesheet;

try {
    const pageModule = require('../page/page.js');
    calculateMonthlyTimesheet = pageModule.calculateMonthlyTimesheet;
    renderDailyTimesheet = pageModule.renderDailyTimesheet;
} catch (err) {
    console.error('Failed to import page.js:', err.message);
}

// 1. Function existence test
assert.strictEqual(typeof calculateMonthlyTimesheet, 'function', 'calculateMonthlyTimesheet should be exported as a function');

// 2. September 2026 Calendar Structure Test (30 days, 22 working days, 8 weekends)
{
    const items = [];
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-30T23:59:59'));

    assert.strictEqual(result.days.length, 30, 'September 2026 must have 30 days');
    assert.strictEqual(result.totalWorkingDays, 22, 'September 2026 must have 22 working days');
    assert.strictEqual(result.totalTargetHours, 176, 'Target hours must be 22 * 8 = 176h');

    const weekends = result.days.filter(d => d.isWeekend);
    assert.strictEqual(weekends.length, 8, 'September 2026 must have 8 weekend days');

    // Sep 1, 2026 is Tuesday (T3)
    const day1 = result.days[0];
    assert.strictEqual(day1.dateIso, '2026-09-01');
    assert.strictEqual(day1.dayNum, 1);
    assert.strictEqual(day1.dayOfWeek, 2);
    assert.strictEqual(day1.dayName, 'T3');
    assert.strictEqual(day1.isWeekend, false);

    // Sep 5, 2026 is Saturday (T7)
    const day5 = result.days[4];
    assert.strictEqual(day5.dateIso, '2026-09-05');
    assert.strictEqual(day5.dayOfWeek, 6);
    assert.strictEqual(day5.dayName, 'T7');
    assert.strictEqual(day5.isWeekend, true);

    // Sep 6, 2026 is Sunday (CN)
    const day6 = result.days[5];
    assert.strictEqual(day6.dateIso, '2026-09-06');
    assert.strictEqual(day6.dayOfWeek, 0);
    assert.strictEqual(day6.dayName, 'CN');
    assert.strictEqual(day6.isWeekend, true);
    console.log('✔ Passed: September 2026 calendar structure test');
}

// 3. Threshold & Status Tests (success, warning, danger, weekend)
{
    const mockItems = [
        // Sep 1 (Tue): 8.5h -> success
        { addedAt: '2026-09-01T08:00:00', spent: 8.5, title: 'Feature A' },
        // Sep 2 (Wed): two tasks 4h + 4h = 8.0h -> success
        { addedAt: '2026-09-02', spent: 4.0, title: 'Task B1' },
        { addedAt: '2026-09-02', spent: 4.0, title: 'Task B2' },
        // Sep 3 (Thu): 6.0h -> warning (diff = -2.0h)
        { addedAt: '2026-09-03', spent: 6.0, title: 'Task C' },
        // Sep 4 (Fri): 0h logged (no items) -> danger (diff = -8.0h)
        // Sep 5 (Sat): 3.5h logged on weekend -> weekend status, counted in total
        { addedAt: '2026-09-05', spent: 3.5, title: 'Weekend overtime' },
        // Sep 6 (Sun): 0h on weekend -> weekend status (not danger!)
    ];

    const result = calculateMonthlyTimesheet(mockItems, 2026, 9, new Date('2026-09-06T23:59:59'));

    const day1 = result.days.find(d => d.dateIso === '2026-09-01');
    assert.strictEqual(day1.spentHours, 8.5);
    assert.strictEqual(day1.status, 'success');
    assert.strictEqual(day1.diffHours, 0.5);

    const day2 = result.days.find(d => d.dateIso === '2026-09-02');
    assert.strictEqual(day2.spentHours, 8.0);
    assert.strictEqual(day2.status, 'success');
    assert.strictEqual(day2.diffHours, 0);
    assert.strictEqual(day2.taskItems.length, 2);

    const day3 = result.days.find(d => d.dateIso === '2026-09-03');
    assert.strictEqual(day3.spentHours, 6.0);
    assert.strictEqual(day3.status, 'warning');
    assert.strictEqual(day3.diffHours, -2.0);

    const day4 = result.days.find(d => d.dateIso === '2026-09-04');
    assert.strictEqual(day4.spentHours, 0);
    assert.strictEqual(day4.status, 'danger');
    assert.strictEqual(day4.diffHours, -8.0);

    const day5 = result.days.find(d => d.dateIso === '2026-09-05');
    assert.strictEqual(day5.spentHours, 3.5);
    assert.strictEqual(day5.isWeekend, true);
    assert.strictEqual(day5.status, 'weekend');
    assert.strictEqual(day5.diffHours, 3.5);

    const day6 = result.days.find(d => d.dateIso === '2026-09-06');
    assert.strictEqual(day6.spentHours, 0);
    assert.strictEqual(day6.isWeekend, true);
    assert.strictEqual(day6.status, 'weekend');
    assert.strictEqual(day6.diffHours, 0);

    console.log('✔ Passed: Threshold & status classification test');
}

// 4. Future Days Test (Mid-month reference date)
{
    const items = [
        { addedAt: '2026-09-01', spent: 8.0 },
        { addedAt: '2026-09-10', spent: 8.0 },
    ];
    // Reference date: Sep 10, 2026
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-10T12:00:00'));

    const day10 = result.days.find(d => d.dateIso === '2026-09-10');
    assert.strictEqual(day10.isFuture, false);
    assert.strictEqual(day10.isPastOrToday, true);
    assert.strictEqual(day10.status, 'success');

    const day11 = result.days.find(d => d.dateIso === '2026-09-11');
    assert.strictEqual(day11.isFuture, true);
    assert.strictEqual(day11.isPastOrToday, false);
    assert.strictEqual(day11.status, 'future');
    // Future days must NOT be danger even if spent == 0
    assert.notStrictEqual(day11.status, 'danger');

    // Deficit days should only count past/today weekdays
    // Sep 1 to Sep 10 has 8 weekdays: Sep 1, 2, 3, 4, 7, 8, 9, 10.
    // Only Sep 1 and Sep 10 have 8h. Other 6 weekdays have 0h.
    assert.strictEqual(result.deficitDaysCount, 6, 'Deficit days must only count past/today weekdays');

    console.log('✔ Passed: Future days handling test');
}

// 5. Monthly Summary Stats Test
{
    const items = [
        { addedAt: '2026-09-01', spent: 8.0 },
        { addedAt: '2026-09-02', spent: 8.0 },
        { addedAt: '2026-09-03', spent: 6.0 },
        { addedAt: '2026-09-04', spent: 0 },
        { addedAt: '2026-09-05', spent: 4.0 }, // weekend 4h
    ];
    // Reference date: end of month (Sep 30)
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-30T23:59:59'));

    // totalSpent = 8 + 8 + 6 + 0 + 4 = 26.0h
    assert.strictEqual(result.totalSpentHours, 26.0);
    assert.strictEqual(result.totalTargetHours, 176);
    // achievementRate = (26 / 176) * 100 = 14.77... -> 14.8%
    assert.strictEqual(result.achievementRate, 14.8);
    // deficit days: 22 working days in month, 2 met 8h (Sep 1, Sep 2), 20 did not (Sep 3 + remaining 19)
    assert.strictEqual(result.deficitDaysCount, 20);

    console.log('✔ Passed: Monthly summary stats calculation test');
}

// 6. DOM Rendering Test
{
    // Minimal mock DOM elements
    const mockElements = {
        timesheetSummaryChips: { innerHTML: '', appendChild(el) { this.children.push(el); }, children: [] },
        timesheetCalendarGrid: { innerHTML: '', appendChild(el) { this.children.push(el); }, children: [] }
    };

    global.document = {
        getElementById(id) {
            return mockElements[id] || null;
        },
        createElement(tag) {
            return {
                tagName: tag,
                className: '',
                classList: {
                    add(c) { this.classes.push(c); },
                    classes: []
                },
                style: {},
                textContent: '',
                innerHTML: '',
                children: [],
                appendChild(c) { this.children.push(c); },
                setAttribute(k, v) { this[k] = v; },
                addEventListener() {}
            };
        }
    };

    assert.strictEqual(typeof renderDailyTimesheet, 'function', 'renderDailyTimesheet should be a function');

    const sampleData = calculateMonthlyTimesheet([
        { addedAt: '2026-09-01', spent: 8.0, title: 'Sample Task' }
    ], 2026, 9, new Date('2026-09-30T23:59:59'));

    renderDailyTimesheet(sampleData);

    assert(mockElements.timesheetSummaryChips.innerHTML.length > 0 || mockElements.timesheetSummaryChips.children.length > 0, 'Summary chips should be rendered');
    assert(mockElements.timesheetCalendarGrid.innerHTML.length > 0 || mockElements.timesheetCalendarGrid.children.length === 30, 'Calendar grid should render 30 day cells');

    console.log('✔ Passed: DOM rendering test');
}

// 7. Edge Cases: Different date formats, string spent values, and leap year
{
    // Leap year February 2024: 29 days
    const feb2024 = calculateMonthlyTimesheet([], 2024, 2, new Date('2024-02-29'));
    assert.strictEqual(feb2024.days.length, 29, 'Feb 2024 (leap year) must have 29 days');
    // Feb 2026: 28 days
    const feb2026 = calculateMonthlyTimesheet([], 2026, 2, new Date('2026-02-28'));
    assert.strictEqual(feb2026.days.length, 28, 'Feb 2026 (non-leap year) must have 28 days');

    // Various date formats and spent representations
    const diverseItems = [
        { addedAt: '01/09/2026 08:30:00', spent: '8.5' }, // DD/MM/YYYY + string spent
        { createAt: new Date(2026, 8, 2, 10, 0, 0), spentTime: 7.5 }, // Date obj + spentTime
        { dateIso: '2026-09-03', totalSpentTime: '9.0' }, // dateIso + totalSpentTime string
        { spentAt: '2026-09-04T12:00:00.000Z', spent: 0 } // ISO string with T and Z
    ];

    const result = calculateMonthlyTimesheet(diverseItems, 2026, 9, new Date('2026-09-04T23:59:59'));
    assert.strictEqual(result.days[0].spentHours, 8.5);
    assert.strictEqual(result.days[0].status, 'success');

    assert.strictEqual(result.days[1].spentHours, 7.5);
    assert.strictEqual(result.days[1].status, 'warning');

    assert.strictEqual(result.days[2].spentHours, 9.0);
    assert.strictEqual(result.days[2].status, 'success');

    assert.strictEqual(result.days[3].spentHours, 0);
    assert.strictEqual(result.days[3].status, 'danger');

    console.log('✔ Passed: Edge cases (date formats, string spent, leap year) test');
}

// Manual overtime is independent of leave and must survive the existing day-save flow.
(async () => {
    const { getLeaveDays, openDayDetailModal, initDayDetailModal } = require('../page/page.js');
    const originalDocument = global.document;
    const originalChrome = global.chrome;
    const originalWindow = global.window;
    let stored = {};
    let saveDay;
    let leaveType = 'full';
    const controls = {
        dayDetailModal: { style: {}, addEventListener() {} },
        modalDayOvertime: { checked: false },
        saveLeaveDayBtn: { addEventListener(event, handler) { saveDay = handler; } },
        monthSelect: { value: '2026-09' }
    };
    global.window = {};
    global.chrome = { storage: { local: {
        get(keys, callback) {
            const result = structuredClone(stored);
            if (callback) callback(result);
            return Promise.resolve(result);
        },
        set(data, callback) {
            stored = { ...stored, ...structuredClone(data) };
            if (callback) callback();
            return Promise.resolve();
        }
    } } };
    global.document = {
        getElementById: id => controls[id] || null,
        querySelector: () => ({ value: leaveType })
    };
    try {
        const items = [{ addedAt: '2026-09-01', spent: 2 }];
        const calculate = map => calculateMonthlyTimesheet(items, 2026, 9, new Date(2026, 8, 30), map);
        assert.strictEqual(calculateMonthlyTimesheet([{ addedAt: '2026-09-01', spent: 10 }], 2026, 9, new Date(2026, 8, 30)).days[0].isOvertime, false, 'Excess hours must not automatically mark overtime');
        const weekend = calculate({ '2026-09-05': { value: 0, type: 'none', overtime: true } }).days[4];
        assert.strictEqual(weekend.isOvertime, true);
        assert.strictEqual(weekend.status, 'weekend');
        assert.strictEqual(weekend.targetHours, 0);
        initDayDetailModal();
        openDayDetailModal(calculate({}).days[0]);
        assert.strictEqual(controls.modalDayOvertime.checked, false);
        controls.modalDayOvertime.checked = true;
        await saveDay();
        let daysMap = await getLeaveDays();
        let report = calculate(daysMap);
        const leaveDay = report.days[0];
        assert.strictEqual(leaveDay.isOvertime, true);
        assert.strictEqual(leaveDay.status, 'leave');
        assert.strictEqual(leaveDay.targetHours, 0);
        assert.strictEqual(leaveDay.spentHours, 2);
        openDayDetailModal(leaveDay);
        assert.strictEqual(controls.modalDayOvertime.checked, true, 'Saved overtime must be restored when the day is reopened');

        // Verify the marker renders beside the existing full-day leave status.
        global.document = originalDocument;
        const grid = global.document.getElementById('timesheetCalendarGrid');
        grid.children = [];
        renderDailyTimesheet(report);
        const header = grid.children[0].children[0];
        assert(header.children.some(child => child.className === 'timesheet-overtime-badge' && child.textContent === '🌙 OT'));
        assert(!grid.children[1].children[0].children.some(child => child.className === 'timesheet-overtime-badge'));
        global.document = { getElementById: id => controls[id] || null, querySelector: () => ({ value: leaveType }) };

        controls.modalDayOvertime.checked = false;
        await saveDay();
        daysMap = await getLeaveDays();
        assert.strictEqual(calculate(daysMap).days[0].isOvertime, false);
        assert.strictEqual(daysMap['2026-09-01'].value, 1, 'Removing overtime must preserve full-day leave');

        leaveType = 'none';
        controls.modalDayOvertime.checked = true;
        await saveDay();
        daysMap = await getLeaveDays();
        report = calculate(daysMap);
        assert.strictEqual(report.days[0].isOvertime, true);
        assert.strictEqual(report.days[0].isLeave, false, 'Overtime on a normal day must not be treated as leave');
        assert.strictEqual(report.totalTargetHours, calculate({}).totalTargetHours);
        assert.strictEqual(report.totalSpentHours, calculate({}).totalSpentHours);

        controls.modalDayOvertime.checked = false;
        await saveDay();
        assert.strictEqual((await getLeaveDays())['2026-09-01'], undefined);
        console.log('✔ Passed: Manual overtime persists, renders, toggles independently of leave, and preserves hours');
        console.log('\n--- ALL TIMESHEET AUDIT TESTS PASSED ---');
    } finally {
        global.document = originalDocument;
        global.chrome = originalChrome;
        global.window = originalWindow;
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

