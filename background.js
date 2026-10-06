/**
 * Background Service Worker for GitLab KPI Extension
 * Handles:
 *   1. Periodic to-do reminder notifications
 *   2. Workday check-in & check-out alert notifications with snooze & URL integration
 *   3. Automatic GitLab task discovery and resumable KPI synchronization
 */

// --- Helper Integration for Utils & i18n ---
if (typeof importScripts === 'function') {
    try {
        importScripts('utils.js', 'i18n.js', 'sync.js');
    } catch (e) {
        console.warn('Failed to importScripts:', e);
    }
} else if (typeof require !== 'undefined') {
    try {
        const u = require('./utils.js');
        // Assign helpers if not globally present
        if (typeof sanitizeGitlabUrl === 'undefined') global.sanitizeGitlabUrl = u.sanitizeGitlabUrl;
        if (typeof getGitlabServerUrl === 'undefined') global.getGitlabServerUrl = u.getGitlabServerUrl;

        const i18n = require('./i18n.js');
        if (typeof t === 'undefined') global.t = i18n.t;
        if (typeof detectBrowserLanguage === 'undefined') global.detectBrowserLanguage = i18n.detectBrowserLanguage;
        if (typeof getLanguage === 'undefined') global.getLanguage = i18n.getLanguage;
    } catch (e) {}
}

const _sanitizeGitlabUrl = (typeof sanitizeGitlabUrl === 'function') ? sanitizeGitlabUrl : ((typeof global !== 'undefined' && global.sanitizeGitlabUrl) || (typeof require !== 'undefined' && require('./utils.js').sanitizeGitlabUrl));
const _getGitlabServerUrl = (typeof getGitlabServerUrl === 'function') ? getGitlabServerUrl : ((typeof global !== 'undefined' && global.getGitlabServerUrl) || (typeof require !== 'undefined' && require('./utils.js').getGitlabServerUrl));
const _t = (typeof t === 'function') ? t : ((typeof global !== 'undefined' && global.t) || ((typeof require !== 'undefined') ? require('./i18n.js').t : (k => k)));
const _detectBrowserLanguage = (typeof detectBrowserLanguage === 'function') ? detectBrowserLanguage : ((typeof global !== 'undefined' && global.detectBrowserLanguage) || ((typeof require !== 'undefined') ? require('./i18n.js').detectBrowserLanguage : (() => 'en')));

function resolveLanguage(appLanguage) {
    if (appLanguage === 'vi' || appLanguage === 'en') return appLanguage;
    if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        return (typeof _detectBrowserLanguage === 'function') ? _detectBrowserLanguage() : 'en';
    }
    return 'vi';
}

// --- Check-in & Check-out Helper Functions ---

function isWorkday(date) {
    const d = date || new Date();
    const day = d.getDay(); // 0: Sunday, 6: Saturday
    return day >= 1 && day <= 5;
}

function sanitizeAttendanceUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
        return 'https://' + trimmed;
    }
    return trimmed;
}

function evaluateAlertState(now, settings, state = {}) {
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let curState = { ...state };
    if (curState.lastDate !== todayDateStr) {
        curState = {
            lastDate: todayDateStr,
            count: 0,
            done: false,
            lastNotified: null
        };
    }

    if (!settings.enabled || !settings.targetTime || curState.done) {
        return { shouldNotify: false, nextState: curState };
    }

    const maxRepeats = settings.maxRepeats || 3;
    if (curState.count >= maxRepeats) {
        return { shouldNotify: false, nextState: curState };
    }

    const [targetHour, targetMinute] = settings.targetTime.split(':').map(Number);
    const targetTotalMins = targetHour * 60 + targetMinute;
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();

    if (currentTotalMins < targetTotalMins) {
        return { shouldNotify: false, nextState: curState };
    }

    // Initial alert
    if (curState.count === 0) {
        // Allow initial notification within a 60-minute window
        if (currentTotalMins - targetTotalMins <= 60) {
            return {
                shouldNotify: true,
                isSnooze: false,
                repeatIndex: 0,
                nextState: {
                    ...curState,
                    count: 1,
                    lastNotified: now.toISOString()
                }
            };
        }
        return { shouldNotify: false, nextState: curState };
    }

    // Snooze repeat alerts
    const snoozeMinutes = Number(settings.snoozeMinutes);
    if (!snoozeMinutes || snoozeMinutes <= 0) {
        return { shouldNotify: false, nextState: curState };
    }

    if (!curState.lastNotified) {
        return { shouldNotify: false, nextState: curState };
    }

    const lastNotifiedTime = new Date(curState.lastNotified).getTime();
    const minsSinceLast = (now.getTime() - lastNotifiedTime) / (60 * 1000);

    if (minsSinceLast >= snoozeMinutes) {
        return {
            shouldNotify: true,
            isSnooze: true,
            repeatIndex: curState.count,
            nextState: {
                ...curState,
                count: curState.count + 1,
                lastNotified: now.toISOString()
            }
        };
    }

    return { shouldNotify: false, nextState: curState };
}

async function checkCheckInOutAlerts(now = new Date()) {
    if (!isWorkday(now)) return;

    const data = await chrome.storage.local.get([
        'checkInEnabled',
        'checkInTime',
        'checkOutEnabled',
        'checkOutTime',
        'checkInOutSnoozeMinutes',
        'checkInOutUrl',
        'checkInState',
        'checkOutState',
        'appLanguage'
    ]);

    const lang = resolveLanguage(data.appLanguage);

    const checkInSettings = {
        enabled: data.checkInEnabled !== false,
        targetTime: data.checkInTime || '08:30',
        snoozeMinutes: Number(data.checkInOutSnoozeMinutes ?? 5),
        maxRepeats: 3
    };

    const checkOutSettings = {
        enabled: data.checkOutEnabled !== false,
        targetTime: data.checkOutTime || '18:00',
        snoozeMinutes: Number(data.checkInOutSnoozeMinutes ?? 5),
        maxRepeats: 3
    };

    let updatedCheckInState = data.checkInState || {};
    let updatedCheckOutState = data.checkOutState || {};
    let stateChanged = false;

    // 1. Evaluate Check-in
    const inEval = evaluateAlertState(now, checkInSettings, updatedCheckInState);
    if (inEval.nextState.lastDate !== updatedCheckInState.lastDate || inEval.shouldNotify) {
        stateChanged = true;
    }
    updatedCheckInState = inEval.nextState;

    if (inEval.shouldNotify) {
        const title = _t('notifCheckinTitle', null, lang);
        const message = _t('notifCheckinMsg', { time: checkInSettings.targetTime }, lang);

        chrome.notifications.create('checkin-alert', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon48.png'),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
        });
    }

    // 2. Evaluate Check-out
    const outEval = evaluateAlertState(now, checkOutSettings, updatedCheckOutState);
    if (outEval.nextState.lastDate !== updatedCheckOutState.lastDate || outEval.shouldNotify) {
        stateChanged = true;
    }
    updatedCheckOutState = outEval.nextState;

    if (outEval.shouldNotify) {
        const title = _t('notifCheckoutTitle', null, lang);
        const message = _t('notifCheckoutMsg', { time: checkOutSettings.targetTime }, lang);

        chrome.notifications.create('checkout-alert', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon48.png'),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
        });
    }

    if (stateChanged) {
        await chrome.storage.local.set({
            checkInState: updatedCheckInState,
            checkOutState: updatedCheckOutState
        });
    }
}

// --- Dynamic Content Script Registration for Custom GitLab Domains ---

async function syncDynamicContentScript(serverUrl) {
    if (typeof chrome === 'undefined' || !chrome.scripting) {
        return false;
    }
    let targetUrl = serverUrl;
    if (!targetUrl && typeof _getGitlabServerUrl === 'function') {
        try {
            targetUrl = await _getGitlabServerUrl();
        } catch (e) {
            targetUrl = 'https://gitlab.com';
        }
    }
    const sanitized = _sanitizeGitlabUrl ? _sanitizeGitlabUrl(targetUrl || 'https://gitlab.com') : (targetUrl || 'https://gitlab.com');

    // Unregister existing custom dynamic scripts first to avoid duplication
    try {
        if (typeof chrome.scripting.unregisterContentScripts === 'function') {
            await chrome.scripting.unregisterContentScripts({ ids: ['custom-gitlab-scripts', 'custom-gitlab-mr-scripts'] });
        }
    } catch (e) {
        // Ignored if not previously registered
    }

    try {
        const parsed = new URL(sanitized);
        const origin = parsed.origin;
        const hostname = parsed.hostname.toLowerCase();

        // Static domains already covered in manifest.json
        if (hostname === 'gitlab.com' || hostname === 'gitlab.widosoft.com') {
            return true;
        }

        // Custom domain: register content scripts
        if (typeof chrome.scripting.registerContentScripts === 'function') {
            await chrome.scripting.registerContentScripts([
                {
                    id: 'custom-gitlab-scripts',
                    matches: [
                        `${origin}/*/-/issues/*`,
                        `${origin}/*/-/work_items/*`
                    ],
                    js: ['utils.js', 'i18n.js', 'content_issue.js'],
                    runAt: 'document_idle'
                },
                {
                    id: 'custom-gitlab-mr-scripts',
                    matches: [
                        `${origin}/*/-/merge_requests/*`
                    ],
                    js: ['utils.js', 'content_request.js'],
                    runAt: 'document_idle'
                }
            ]);
        }
        return true;
    } catch (err) {
        console.error('Error syncing dynamic content script:', err);
        return false;
    }
}

// --- Automatic Task Sync ---

const syncModule = typeof KpiSync !== 'undefined' ? KpiSync : (typeof require === 'function' ? require('./sync.js') : null);
let syncRunner;
let syncReady = Promise.resolve();
function getSyncRunner() {
    if (!syncRunner) syncRunner = syncModule.createRunner({ storage: {
        get: keys => chrome.storage.local.get(keys), set: values => chrome.storage.local.set(values)
    } });
    return syncRunner;
}
async function recoverSyncState() {
        const data = await chrome.storage.local.get(['KpiSyncState']);
        const sources = data.KpiSyncState?.sources || {};
        const recovered = Object.fromEntries(Object.entries(sources).map(([key, state]) => [key, state?.status === 'running'
            ? { ...state, status: state.scan || state.pending?.length ? 'pending' : 'ready' } : state]));
        if (Object.values(sources).some(state => state?.status === 'running')) await chrome.storage.local.set({ KpiSyncState: { ...data.KpiSyncState, sources: recovered } });
}
async function configureSyncAlarm() {
    const data = await chrome.storage.local.get(['KpiSyncSettings', 'KpiSyncState', 'UserProfile', 'gitlabServerUrl', 'gitlabUrl', 'AccessToken']);
    if (!data.KpiSyncSettings) await chrome.storage.local.set({ KpiSyncSettings: syncModule.settingsOf(data) });
    const settings = syncModule.settingsOf(data);
    if (!settings.enabled || !data.AccessToken) await chrome.alarms.clear?.('kpiAutoSync');
    else {
        const alarm = await chrome.alarms.get?.('kpiAutoSync');
        if (!alarm || alarm.periodInMinutes !== settings.intervalMinutes) {
            await chrome.alarms.create('kpiAutoSync', { periodInMinutes: settings.intervalMinutes });
        }
    }
    const state = syncModule.stateOf(data);
    if (state.scan || state.pending?.length) await scheduleSyncContinuation(state);
}
async function scheduleSyncContinuation(state) {
    if (state?.authError || (!state?.scan && !state?.pending?.length)) return;
    const data = await chrome.storage.local.get(['KpiSyncSettings', 'checkInTime', 'checkOutTime']);
    if (!syncModule.settingsOf(data).enabled && !state.manual) return;
    let when = Math.max(Date.now() + 30000, state.retryAt || 0);
    if (!state.manual && !syncModule.inSyncHours(data, new Date(when))) {
        const [hour, minute] = (data.checkInTime || '08:30').split(':').map(Number);
        const next = new Date(when); next.setHours(hour, minute, 0, 0);
        if (next.getTime() <= when) next.setDate(next.getDate() + 1);
        while (!isWorkday(next)) next.setDate(next.getDate() + 1);
        when = next.getTime();
    }
    await chrome.alarms.create('kpiSyncContinue', { when });
}
async function runTaskSync(options = {}) {
    await syncReady;
    const state = await getSyncRunner().run(options);
    await scheduleSyncContinuation(state);
    return state;
}

// --- Lifecycle Event Listeners ---

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(async () => {
        chrome.alarms.create("checkTodos", { periodInMinutes: 1 });

        // Cấu hình mặc định cho Check-in & Check-out
        const checkInOutDefaults = await chrome.storage.local.get([
            'checkInEnabled',
            'checkInTime',
            'checkOutEnabled',
            'checkOutTime',
            'checkInOutSnoozeMinutes',
            'checkInOutUrl'
        ]);
        const toSet = {};
        if (checkInOutDefaults.checkInEnabled === undefined) toSet.checkInEnabled = true;
        if (!checkInOutDefaults.checkInTime) toSet.checkInTime = '08:30';
        if (checkInOutDefaults.checkOutEnabled === undefined) toSet.checkOutEnabled = true;
        if (!checkInOutDefaults.checkOutTime) toSet.checkOutTime = '18:00';
        if (checkInOutDefaults.checkInOutSnoozeMinutes === undefined) toSet.checkInOutSnoozeMinutes = 5;
        if (checkInOutDefaults.checkInOutUrl === undefined) toSet.checkInOutUrl = '';
        if (Object.keys(toSet).length > 0) {
            await chrome.storage.local.set(toSet);
        }

        // Retire only the old end-of-day reminder state.
        await chrome.storage.local.remove?.(['UnaddedTodayTasks', 'kpiReminderState', 'kpiReminderEnabled', 'kpiReminderMinutesBefore']);
        await chrome.notifications?.clear?.('kpi-unadded-alert');
        chrome.action?.setBadgeText?.({ text: '' });
        await configureSyncAlarm();
        runTaskSync().catch(error => console.error('Task sync failed:', error.message));

        // Đồng bộ content script động cho domain GitLab tùy chỉnh
        const serverUrlData = await chrome.storage.local.get(['gitlabServerUrl']);
        if (serverUrlData && serverUrlData.gitlabServerUrl) {
            await syncDynamicContentScript(serverUrlData.gitlabServerUrl);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(async () => {
        chrome.alarms.create("checkTodos", { periodInMinutes: 1 });
        await configureSyncAlarm();
        runTaskSync().catch(error => console.error('Task sync failed:', error.message));
        const serverUrlData = await chrome.storage.local.get(['gitlabServerUrl']);
        if (serverUrlData && serverUrlData.gitlabServerUrl) {
            await syncDynamicContentScript(serverUrlData.gitlabServerUrl);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local' && ['KpiSyncSettings', 'checkInTime', 'checkOutTime', 'AccessToken', 'gitlabServerUrl', 'UserProfile'].some(key => changes[key])) {
            getSyncRunner().pause();
            await configureSyncAlarm();
            runTaskSync({ authChanged: !!(changes.AccessToken || changes.gitlabServerUrl || changes.UserProfile) }).catch(error => console.error('Task sync failed:', error.message));
        }
        if (area === 'local' && changes.gitlabServerUrl) {
            await syncDynamicContentScript(changes.gitlabServerUrl.newValue);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener(async alarm => {
        if (alarm.name === 'checkTodos') await checkCheckInOutAlerts();
        if (alarm.name === 'kpiAutoSync' || alarm.name === 'kpiSyncContinue') {
            await runTaskSync({ continue: alarm.name === 'kpiSyncContinue' });
        }
    });
}
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, respond) => {
        if (!['kpi:sync', 'kpi:tracking'].includes(message?.type)) return;
        const action = message.type === 'kpi:sync'
            ? runTaskSync({ force: message.force === true, continue: message.continue === true,
                month: message.force === true ? message.month : undefined })
            : getSyncRunner().updateItems(message).then(items => ({ items }));
        action.then(respond, error => respond({ error: error.message }));
        return true;
    });
}
// Alarms can disappear across updates/restarts; ensure them on each worker startup.
if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.alarms && chrome.storage?.local) {
    syncReady = recoverSyncState().then(configureSyncAlarm).catch(error => console.error('Sync scheduling failed:', error.message));
}

// Notification click handler: opens attendance URL, KPI popup, or to-do page
async function handleNotificationClick(notifId) {
    if (!notifId || typeof notifId !== 'string') return;
    if (notifId === 'checkin-alert' || notifId === 'checkout-alert' || notifId.startsWith('test-checkin-alert')) {
        const stateKey = notifId === 'checkin-alert' ? 'checkInState' : (notifId === 'checkout-alert' ? 'checkOutState' : null);
        const data = await chrome.storage.local.get(['checkInOutUrl', ...(stateKey ? [stateKey] : [])]);

        if (stateKey) {
            const curState = data[stateKey] || {};
            curState.done = true;
            await chrome.storage.local.set({ [stateKey]: curState });
        }

        chrome.notifications.clear(notifId);

        if (data.checkInOutUrl && data.checkInOutUrl.trim()) {
            const url = sanitizeAttendanceUrl(data.checkInOutUrl);
            if (url) {
                chrome.tabs.create({ url });
            }
        }
    } else {
        // To-do reminder notification clicked:
        chrome.notifications.clear(notifId);
        chrome.tabs.create({ url: chrome.runtime.getURL("todo/todo.html") });
    }
}

if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.onClicked) {
    chrome.notifications.onClicked.addListener(handleNotificationClick);
}

// Exports for Node testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isWorkday,
        sanitizeAttendanceUrl,
        evaluateAlertState,
        checkCheckInOutAlerts,
        handleNotificationClick,
        recoverSyncState,
        configureSyncAlarm,
        runTaskSync,
        syncDynamicContentScript
    };
}
