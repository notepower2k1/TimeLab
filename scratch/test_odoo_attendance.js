/**
 * Test Suite: Odoo Attendance & Check-in/out Subsystem
 *
 * Validates:
 * 1. Odoo config validation & URL normalization
 * 2. formatHoursMinutes formatting
 * 3. parseAttendance parser for states (checked_in, checked_out, not_today)
 * 4. JSON-RPC request dispatcher (readAttendance, changeAttendance, error handling)
 * 5. Milestone attendanceWindow & reminder logic
 * 6. HTML, CSS, i18n & background integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const Odoo = require(path.join(ROOT_DIR, 'odoo.js'));
const i18n = require(path.join(ROOT_DIR, 'i18n.js'));
const background = require(path.join(ROOT_DIR, 'background.js'));

console.log('\n=============================================================');
console.log('--- Testing Odoo Attendance Subsystem ---');
console.log('=============================================================');

// 1. Config Validation
console.log('\n--- 1. validateOdooConfig ---');
assert.throws(() => Odoo.validateOdooConfig({ url: '' }), /Vui lòng nhập/);
assert.throws(() => Odoo.validateOdooConfig({ url: 'http://odoo.example.com' }), /HTTPS/);
assert.throws(() => Odoo.validateOdooConfig({ url: 'https://odoo.com?token=123' }), /không được chứa/);
assert.throws(() => Odoo.validateOdooConfig({ url: 'https://odoo.com', times: ['10:00', '09:00', '13:00', '18:00'] }), /thứ tự tăng dần/);

const validConfig = Odoo.validateOdooConfig({
    url: 'https://odoo.example.com/web',
    reminders: true,
    times: ['08:30', '12:00', '13:30', '18:00']
});
assert.strictEqual(validConfig.url, 'https://odoo.example.com');
assert.strictEqual(validConfig.enabled, true);
assert.strictEqual(validConfig.reminders, true);
assert.deepStrictEqual(validConfig.times, ['08:30', '12:00', '13:30', '18:00']);

const localConfig = Odoo.validateOdooConfig({ url: 'http://localhost:8069' });
assert.strictEqual(localConfig.url, 'http://localhost:8069');
console.log('✔ Passed: validateOdooConfig checks URLs, protocols, ports, and milestone times');

// 2. formatHoursMinutes
console.log('\n--- 2. formatHoursMinutes ---');
assert.strictEqual(Odoo.formatHoursMinutes(null), '—');
assert.strictEqual(Odoo.formatHoursMinutes(undefined), '—');
assert.strictEqual(Odoo.formatHoursMinutes(-5), '—');
assert.strictEqual(Odoo.formatHoursMinutes(0), '0h 00m');
assert.strictEqual(Odoo.formatHoursMinutes(4.75), '4h 45m');
assert.strictEqual(Odoo.formatHoursMinutes(8.5), '8h 30m');
assert.strictEqual(Odoo.formatHoursMinutes(7.1), '7h 06m');
console.log('✔ Passed: formatHoursMinutes accurately formats decimals into Xh Ym');

// 3. parseAttendance
console.log('\n--- 3. parseAttendance ---');
assert.throws(() => Odoo.parseAttendance(null), /unavailable/);
assert.throws(() => Odoo.parseAttendance({}), /no_employee/);
assert.throws(() => Odoo.parseAttendance({ id: 10, attendance_state: 'invalid' }), /unavailable/);

const testDate = new Date('2026-10-09T08:30:00Z');
const parsedIn = Odoo.parseAttendance({
    id: 15,
    display_name: 'Tran Van B',
    attendance_state: 'checked_in',
    last_check_in: '2026-10-09 01:30:00',
    hours_today: 4.5
}, testDate);

assert.strictEqual(parsedIn.employeeId, 15);
assert.strictEqual(parsedIn.employeeName, 'Tran Van B');
assert.strictEqual(parsedIn.state, 'checked_in');
assert.strictEqual(parsedIn.hoursToday, 4.5);
assert.strictEqual(parsedIn.lastCheckIn, '2026-10-09T01:30:00.000Z');

const parsedOut = Odoo.parseAttendance({
    id: 15,
    attendance_state: 'checked_out',
    last_check_in: '2026-10-09 01:30:00',
    hours_today: 8.0
}, testDate);
assert.strictEqual(parsedOut.state, 'checked_out');
assert.strictEqual(parsedOut.hoursToday, 8.0);

const parsedYesterday = Odoo.parseAttendance({
    id: 15,
    attendance_state: 'checked_out',
    last_check_in: '2026-10-08 01:30:00',
    hours_today: 0
}, testDate);
assert.strictEqual(parsedYesterday.state, 'not_today');
console.log('✔ Passed: parseAttendance parses employee info, UTC timestamps, and daily states');

// 4. JSON-RPC Client Calls
console.log('\n--- 4. readAttendance and changeAttendance ---');
(async () => {
    let calledUrl = '';
    let calledOpts = null;
    const mockFetch = async (url, opts) => {
        calledUrl = url;
        calledOpts = opts;
        return {
            ok: true,
            status: 200,
            json: async () => ({
                jsonrpc: '2.0',
                id: 1,
                result: {
                    id: 99,
                    attendance_state: 'checked_in',
                    last_check_in: '2026-10-09 01:30:00',
                    hours_today: 3.5
                }
            })
        };
    };

    const readRes = await Odoo.readAttendance(validConfig, testDate, mockFetch);
    assert.strictEqual(calledUrl, 'https://odoo.example.com/hr_attendance/attendance_user_data');
    assert.strictEqual(calledOpts.credentials, 'include');
    assert.strictEqual(calledOpts.headers['Content-Type'], 'application/json');
    const readBody = JSON.parse(calledOpts.body);
    assert.strictEqual(readBody.method, 'call');
    assert.strictEqual(readRes.employeeId, 99);
    assert.strictEqual(readRes.state, 'checked_in');

    const changeRes = await Odoo.changeAttendance(validConfig, testDate, mockFetch);
    assert.strictEqual(calledUrl, 'https://odoo.example.com/hr_attendance/systray_check_in_out');
    assert.strictEqual(changeRes.employeeId, 99);

    // Error handling (Session Expired / 401)
    const mockAuthFail = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 100 } })
    });
    await assert.rejects(Odoo.readAttendance(validConfig, testDate, mockAuthFail), /login_required/);

    const mockRpcError = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ error: { data: { name: 'odoo.http.SessionExpiredException' } } })
    });
    await assert.rejects(Odoo.readAttendance(validConfig, testDate, mockRpcError), /login_required/);
    console.log('✔ Passed: JSON-RPC read & toggle requests, credentials, and session expiry error handling');

    // 5. Attendance Window & Reminder Logic
    console.log('\n--- 5. attendanceWindow and attendanceReminder ---');
    // Friday 2026-10-09 at 08:40 UTC+7 (01:40 UTC)
    const fridayMorning = new Date('2026-10-09T01:40:00Z');
    const slotMorning = Odoo.attendanceWindow(validConfig, fridayMorning);
    assert.strictEqual(slotMorning, 0, '08:40 should fall into Slot 0 window (08:30 - 09:00)');

    // Friday 2026-10-09 at 12:10 UTC+7 (05:10 UTC)
    const fridayNoon = new Date('2026-10-09T05:10:00Z');
    const slotNoon = Odoo.attendanceWindow(validConfig, fridayNoon);
    assert.strictEqual(slotNoon, 1, '12:10 should fall into Slot 1 window (12:00 - 12:30)');

    // Outside window: 09:15 UTC+7 (02:15 UTC)
    const fridayOutside = new Date('2026-10-09T02:15:00Z');
    assert.strictEqual(Odoo.attendanceWindow(validConfig, fridayOutside), null, '09:15 is past 30-min window');

    // Weekend check: Saturday 2026-10-10 at 08:35 UTC+7
    const saturday = new Date('2026-10-10T01:35:00Z');
    assert.strictEqual(Odoo.attendanceWindow(validConfig, saturday), null, 'Weekend must not have attendance windows');

    // Reminder checks:
    // When morning slot is active and user is NOT checked in -> should remind slot 0
    const mockDataUnchecked = {
        employeeId: 99,
        state: 'not_today',
        lastCheckIn: null,
        checkedAt: fridayMorning.toISOString()
    };
    assert.strictEqual(Odoo.attendanceReminder(validConfig, mockDataUnchecked, fridayMorning), 0);

    // When morning slot is active and user IS already checked in -> do not remind
    const mockDataCheckedIn = {
        employeeId: 99,
        state: 'checked_in',
        lastCheckIn: '2026-10-09T01:32:00.000Z',
        checkedAt: fridayMorning.toISOString()
    };
    assert.strictEqual(Odoo.attendanceReminder(validConfig, mockDataCheckedIn, fridayMorning), null);

    // When noon checkout slot is active and user is STILL checked_in -> should remind checkout (slot 1)
    const mockDataNoon = {
        employeeId: 99,
        state: 'checked_in',
        lastCheckIn: '2026-10-09T01:32:00.000Z',
        checkedAt: fridayNoon.toISOString()
    };
    assert.strictEqual(Odoo.attendanceReminder(validConfig, mockDataNoon, fridayNoon), 1);
    console.log('✔ Passed: attendanceWindow accurately computes weekday slots and reminder triggers');

    // 6. UI, HTML & i18n Integration Check
    console.log('\n--- 6. UI Structure & i18n Verification ---');
    const popupHtml = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.html'), 'utf8');
    assert.ok(popupHtml.includes('id="odooCard"'), 'popup.html must contain #odooCard');
    assert.ok(popupHtml.includes('id="odooStatusPill"'), 'popup.html must contain #odooStatusPill');
    assert.ok(popupHtml.includes('id="odooToggleAttendanceBtn"'), 'popup.html must contain #odooToggleAttendanceBtn');
    assert.ok(popupHtml.includes('id="odooHoursVal"'), 'popup.html must contain #odooHoursVal');
    assert.ok(popupHtml.includes('id="odooServerUrlInput"'), 'popup.html must contain #odooServerUrlInput');
    assert.ok(popupHtml.includes('id="odooSaveBtn"'), 'popup.html must contain #odooSaveBtn');
    assert.ok(popupHtml.includes('src="../odoo.js"'), 'popup.html must include script odoo.js');

    const popupCss = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.css'), 'utf8');
    assert.ok(popupCss.includes('.odoo-card'), 'popup.css must style .odoo-card');
    assert.ok(popupCss.includes('.odoo-status-pill'), 'popup.css must style .odoo-status-pill');
    assert.ok(popupCss.includes('.btn-odoo-action'), 'popup.css must style .btn-odoo-action');

    const viDict = i18n.I18N_DICTIONARIES.vi;
    const enDict = i18n.I18N_DICTIONARIES.en;
    const requiredKeys = [
        'odooTitle', 'odooCardTitle', 'odooSettingsTitle', 'odooUrlLabel',
        'odooRemindersLabel', 'odooHoursToday', 'odooSaveBtn', 'odooCheckInBtn',
        'odooCheckOutBtn', 'odooStatusCheckedIn', 'odooStatusCheckedOut'
    ];
    requiredKeys.forEach(k => {
        assert.ok(viDict[k], `VI dictionary must contain ${k}`);
        assert.ok(enDict[k], `EN dictionary must contain ${k}`);
    });

    assert.strictEqual(typeof background.checkOdooAttendanceAndReminders, 'function', 'background.js must export checkOdooAttendanceAndReminders');
    console.log('✔ Passed: HTML DOM elements, CSS classes, i18n dictionaries, and background worker hooks verified');

    console.log('\n=============================================================');
    console.log('🎉 ALL ODOO ATTENDANCE TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=============================================================');
})();
