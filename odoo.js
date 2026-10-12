/**
 * Odoo Attendance (v17+) Integration Module for TimeLab Extension
 * (Company Internal Edition)
 *
 * Provides:
 * - Odoo connection validation & URL normalization
 * - Attendance data parsing (hours today, last check-in, state)
 * - JSON-RPC client for /hr_attendance/attendance_user_data & /hr_attendance/systray_check_in_out
 * - Attendance milestone & reminder window calculator (Mon - Fri, UTC+7)
 */

/* @company-start */
const Odoo = (() => {
    const ODOO_TIMES = ['08:30', '12:00', '13:30', '18:00'];

    function parseDay(dateStr) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Invalid date format');
        return new Date(`${dateStr}T00:00:00+07:00`);
    }

    function todayString(date = new Date()) {
        const d = new Date(date.getTime() + 7 * 3600000);
        return d.toISOString().slice(0, 10);
    }

    function validateOdooConfig(input = {}) {
        const address = String(input.url || '').trim();
        if (!address) throw new Error('Vui lòng nhập địa chỉ máy chủ Odoo.');

        let url;
        try {
            url = new URL(address.startsWith('http://') || address.startsWith('https://') ? address : `https://${address}`);
        } catch (_) {
            throw new Error('Địa chỉ Odoo không hợp lệ.');
        }

        const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        if (url.protocol !== 'https:' && !isLocal) {
            throw new Error('Địa chỉ Odoo phải sử dụng giao thức HTTPS (ngoại trừ localhost).');
        }
        if (url.username || url.password || url.search || url.hash) {
            throw new Error('Địa chỉ Odoo không được chứa tham số truy vấn hoặc thông tin đăng nhập.');
        }

        const times = input.times || ODOO_TIMES;
        if (!Array.isArray(times) || times.length !== 4 || times.some((time, i) =>
            typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || (i > 0 && time <= times[i - 1]))) {
            throw new Error('Vui lòng nhập 4 mốc thời gian chấm công hợp lệ theo thứ tự tăng dần.');
        }

        return {
            url: url.origin,
            enabled: true,
            reminders: input.reminders !== false,
            times,
            snoozeMinutes: Number.isFinite(Number(input.snoozeMinutes)) ? Number(input.snoozeMinutes) : 10
        };
    }

    function formatHoursMinutes(hours) {
        if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0) return '—';
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${String(m).padStart(2, '0')}m`;
    }

    function parseAttendance(data, now = new Date()) {
        if (!data || typeof data !== 'object') throw new Error('unavailable');
        if (!data.id) throw new Error('no_employee');
        if (!['checked_in', 'checked_out'].includes(data.attendance_state)) throw new Error('unavailable');

        function parseOdooUtcDate(val) {
            if (!val) return null;
            const str = String(val).trim();
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
                const parsed = new Date(str.replace(' ', 'T') + 'Z');
                return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
            }
            const parsed = new Date(str);
            return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
        }

        let lastCheckInIso = parseOdooUtcDate(data.last_check_in);
        const lastCheckOutIso = parseOdooUtcDate(data.last_check_out);

        if (data.attendance_state === 'checked_in' && !lastCheckInIso) {
            lastCheckInIso = now.toISOString();
        }

        const todayStr = todayString(now);
        const workedToday = lastCheckInIso ? todayString(new Date(lastCheckInIso)) === todayStr : false;

        let state = 'not_today';
        if (data.attendance_state === 'checked_in') {
            state = 'checked_in';
        } else if (workedToday) {
            state = 'checked_out';
        }

        const hours = typeof data.hours_today === 'number' && Number.isFinite(data.hours_today) && data.hours_today >= 0
            ? data.hours_today
            : 0;

        return {
            employeeId: data.id,
            employeeName: data.display_name || '',
            lastCheckIn: lastCheckInIso,
            lastCheckOut: lastCheckOutIso,
            hoursToday: hours,
            state,
            checkedAt: now.toISOString(),
            error: null
        };
    }

    async function attendanceRequest(config, route, now = new Date(), fetchFn = (typeof fetch === 'function' ? fetch : null)) {
        if (!fetchFn) throw new Error('Fetch API is not available');
        const started = Date.now();
        const endpoint = `${config.url}/hr_attendance/${route}`;

        let response;
        try {
            response = await fetchFn(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {},
                    id: Date.now()
                })
            });
        } catch (netErr) {
            throw new Error('unavailable');
        }

        if ([401, 403].includes(response.status)) throw new Error('login_required');
        if (!response.ok) throw new Error('unavailable');

        let payload;
        try {
            payload = await response.json();
        } catch (_) {
            throw new Error('unavailable');
        }

        if (payload?.error) {
            const errName = String(payload.error.data?.name || payload.error.message || '');
            if (/SessionExpired|AccessDenied/i.test(errName) || payload.error.code === 100) {
                throw new Error('login_required');
            }
            throw new Error('unavailable');
        }

        const elapsed = Date.now() - started;
        return parseAttendance(payload?.result, new Date(now.getTime() + elapsed));
    }

    function readAttendance(config, now = new Date(), fetchFn = (typeof fetch === 'function' ? fetch : null)) {
        return attendanceRequest(config, 'attendance_user_data', now, fetchFn);
    }

    function changeAttendance(config, now = new Date(), fetchFn = (typeof fetch === 'function' ? fetch : null)) {
        return attendanceRequest(config, 'systray_check_in_out', now, fetchFn);
    }

    // Active for 30 minutes after milestone time on weekdays (Mon-Fri, UTC+7)
    function attendanceWindow(config, now = new Date()) {
        if (!config || !config.enabled || !config.reminders) return null;
        const vnDate = new Date(now.getTime() + 7 * 3600000);
        const weekday = vnDate.getUTCDay();
        if (weekday === 0 || weekday === 6) return null; // Skip weekends

        const day = todayString(now);
        const times = config.times || ODOO_TIMES;
        const deadlines = times.map(time => Date.parse(`${day}T${time}:00+07:00`));

        let slot = -1;
        deadlines.forEach((deadline, index) => {
            if (now.getTime() >= deadline) slot = index;
        });

        // 30 minute window
        if (slot < 0 || now.getTime() >= deadlines[slot] + 30 * 60000) {
            return null;
        }
        return slot;
    }

    function attendanceReminder(config, data, now = new Date()) {
        if (!data || data.error || !data.employeeId) return null;
        if (todayString(new Date(data.checkedAt)) !== todayString(now)) return null;

        const slot = attendanceWindow(config, now);
        if (slot === null) return null;

        // Slot 1 (12:00) & Slot 3 (18:00) -> Check-out slots. Remind if still checked_in.
        if (slot % 2 === 1) {
            return data.state === 'checked_in' ? slot : null;
        }

        // Slot 0 (08:30) & Slot 2 (13:30) -> Check-in slots.
        const day = todayString(now);
        const times = config.times || ODOO_TIMES;
        const windowStart = Date.parse(`${day}T${slot === 0 ? '00:00' : times[slot - 1]}:00+07:00`);
        const isCheckedInAfterWindow = data.lastCheckIn && Date.parse(data.lastCheckIn) >= windowStart;
        return isCheckedInAfterWindow ? null : slot;
    }

    return {
        ODOO_TIMES,
        validateOdooConfig,
        formatHoursMinutes,
        parseAttendance,
        attendanceRequest,
        readAttendance,
        changeAttendance,
        attendanceWindow,
        attendanceReminder
    };
})();
/* @company-end */

/* @public-start
const Odoo = {};
@public-end */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Odoo;
} else {
    globalThis.Odoo = Odoo;
}
