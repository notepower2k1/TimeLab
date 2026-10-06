/**
 * Test Suite for i18n Core Engine & Complete Dictionary (Task 1)
 */

const assert = require('assert');
const path = require('path');

console.log('=== Running Suite: i18n Core Engine & Complete Dictionary ===');

let i18n;
try {
    i18n = require('../i18n.js');
} catch (err) {
    console.error('Failed to load ../i18n.js (Expected in RED phase):', err.message);
}

// 1. Verify Module Exports
console.log('\n--- 1. Module Exports & Signature Verification ---');
assert.ok(i18n, 'i18n module must be exported');
assert.strictEqual(typeof i18n.t, 'function', 'i18n.t must be a function');
assert.strictEqual(typeof i18n.detectBrowserLanguage, 'function', 'i18n.detectBrowserLanguage must be a function');
assert.strictEqual(typeof i18n.getLanguage, 'function', 'i18n.getLanguage must be a function');
assert.strictEqual(typeof i18n.setLanguage, 'function', 'i18n.setLanguage must be a function');
assert.strictEqual(typeof i18n.initLanguage, 'function', 'i18n.initLanguage must be a function');
assert.strictEqual(typeof i18n.applyI18n, 'function', 'i18n.applyI18n must be a function');
assert.ok(i18n.I18N_DICTIONARIES, 'i18n.I18N_DICTIONARIES must exist');
assert.ok(i18n.I18N_DICTIONARIES.vi, 'i18n.I18N_DICTIONARIES.vi must exist');
assert.ok(i18n.I18N_DICTIONARIES.en, 'i18n.I18N_DICTIONARIES.en must exist');
console.log('✔ Passed: All core functions and dictionaries exported');

// 2. Verify 100% Dictionary Parity & Placeholders
console.log('\n--- 2. Dictionary Completeness & Parity ---');
const viDict = i18n.I18N_DICTIONARIES.vi;
const enDict = i18n.I18N_DICTIONARIES.en;

const viKeys = Object.keys(viDict).sort();
const enKeys = Object.keys(enDict).sort();

console.log(`Found ${viKeys.length} Vietnamese keys and ${enKeys.length} English keys.`);
assert.ok(viKeys.length >= 80, `Expected at least 80 dictionary keys, found ${viKeys.length}`);

// Every VI key must exist in EN
const missingInEn = viKeys.filter(k => !(k in enDict));
assert.deepStrictEqual(missingInEn, [], `Keys present in 'vi' but missing in 'en': ${missingInEn.join(', ')}`);

// Every EN key must exist in VI
const missingInVi = enKeys.filter(k => !(k in viDict));
assert.deepStrictEqual(missingInVi, [], `Keys present in 'en' but missing in 'vi': ${missingInVi.join(', ')}`);

// Verify Placeholder Token Parity for every key
function extractTokens(str) {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    return matches.sort();
}

const tokenMismatches = [];
for (const key of viKeys) {
    const viTokens = extractTokens(viDict[key]);
    const enTokens = extractTokens(enDict[key]);
    if (JSON.stringify(viTokens) !== JSON.stringify(enTokens)) {
        tokenMismatches.push({ key, viTokens, enTokens });
    }
}
assert.deepStrictEqual(tokenMismatches, [], `Placeholder tokens mismatch: ${JSON.stringify(tokenMismatches, null, 2)}`);
console.log(`✔ Passed: 100% Dictionary Parity between VI and EN (${viKeys.length} keys, identical tokens)`);

// 3. Category Coverage Verification
console.log('\n--- 3. Required Category Coverage Verification ---');
const requiredKeys = [
    // Navigation & Tabs
    'tabHome', 'tabNotes', 'tabTodo', 'tabTools', 'tabWorkItems', 'tabAnalytics', 'tabMonth',
    // Auth & Login
    'welcomeTitle', 'welcomeDesc', 'tokenPlaceholder', 'connectBtn', 'tutorialBtn', 'logoutBtn', 'tokenRequired', 'connectFailed',
    // Banner & Unadded Tasks
    'syncSettingsTitle', 'syncNow', 'syncLast', 'syncReady', 'syncHoursHint',
    // Check-in/out Card
    'checkinCardTitle', 'checkinLabel', 'checkoutLabel', 'workdayBadge', 'snoozeLabel', 'snooze5m', 'snooze10m', 'snooze15m', 'snoozeNone',
    'urlLabel', 'urlPlaceholder', 'testSoundBtn', 'saveSettingsBtn', 'saveSettingsSuccess', 'minutesUnit',
    // Tools
    'storageTitle', 'noteWindowBtn', 'noteTabBtn', 'todoWindowBtn', 'todoTabBtn', 'exportBtn', 'importBtn', 'openDashboardBtn',
    // Kanban Board
    'kanbanTitle', 'colTodo', 'colProcessing', 'colDone', 'addTaskPlaceholder', 'deadlinePlaceholder', 'addTaskBtn',
    'editTaskModalTitle', 'saveChangesBtn', 'cancelBtn', 'deleteTaskBtn', 'windowModeBtn', 'tabModeBtn',
    // Notepad
    'notesTitle', 'untitledNote', 'autoSaved', 'saving', 'addNoteBtn', 'notePlaceholder',
    // KPI Dashboard
    'pageTitle', 'filterWeek', 'filterMonth', 'filterAll', 'kpiHealthScore', 'onTimeRate', 'attitudeScore', 'volumeScore', 'qualityScore',
    'tableTasks', 'tableWorkItemName', 'tableParentIssue', 'tableStartDate', 'tableDueDate', 'tableClosedDate',
    'tableEst', 'tableSpent', 'tableLifetimeSpent', 'tableDiff', 'tableStatus', 'tableAction', 'statusDoing', 'statusDone', 'statusCarryOver',
    'timesheetTitle', 'timesheetStandardHours', 'timesheetOvertime', 'timesheetLate',
    // GitLab In-Page Summary
    'summaryBtn', 'summaryModalTitle', 'metricTotalTasks', 'metricTotalEst', 'metricTotalSpent', 'metricDiff', 'metricOnTimeRate', 'refreshBtn', 'addAllToKpiModal',
    // Desktop Notifications
    'notifCheckinTitle', 'notifCheckinMsg', 'notifCheckoutTitle', 'notifCheckoutMsg'
];

const missingRequired = requiredKeys.filter(k => !(k in viDict));
assert.deepStrictEqual(missingRequired, [], `Missing required keys: ${missingRequired.join(', ')}`);
console.log(`✔ Passed: All required category keys verified present`);

// 4. Test Translation Function t(key, params, lang)
console.log('\n--- 4. Translation Function Behavior ---');
// Direct translation
assert.strictEqual(i18n.t('connectBtn', null, 'vi'), 'Kết nối ngay');
assert.strictEqual(i18n.t('connectBtn', null, 'en'), 'Connect Now');

// Parameter interpolation
assert.strictEqual(
    i18n.t('syncLast', { time: '10:30' }, 'vi'),
    'Sync thường lần cuối: 10:30'
);
assert.strictEqual(
    i18n.t('syncLast', { time: '10:30' }, 'en'),
    'Last synced: 10:30'
);

// Fallback to EN if missing in requested lang
viDict['__testOnlyKey'] = undefined;
enDict['__testOnlyKey'] = 'English Only Value';
assert.strictEqual(i18n.t('__testOnlyKey', null, 'vi'), 'English Only Value');
delete enDict['__testOnlyKey'];

// Fallback to raw key if missing in both
assert.strictEqual(i18n.t('completely_non_existent_key', null, 'vi'), 'completely_non_existent_key');
assert.strictEqual(i18n.t('completely_non_existent_key', null, 'en'), 'completely_non_existent_key');

// Default to in-memory active language when lang argument omitted
i18n.setLanguage('vi');
assert.strictEqual(i18n.t('connectBtn'), 'Kết nối ngay');
i18n.setLanguage('en');
assert.strictEqual(i18n.t('connectBtn'), 'Connect Now');

console.log('✔ Passed: t() function correctly handles direct translation, interpolation, and fallbacks');

// 5. Language Detection & State Management
console.log('\n--- 5. Language Detection & Storage Persistence ---');

// Browser detection with mock chrome
global.chrome = {
    i18n: {
        getUILanguage: () => 'vi-VN'
    }
};
assert.strictEqual(i18n.detectBrowserLanguage(), 'vi', 'detectBrowserLanguage should detect vi-VN as vi');

global.chrome.i18n.getUILanguage = () => 'en-US';
assert.strictEqual(i18n.detectBrowserLanguage(), 'en', 'detectBrowserLanguage should detect en-US as en');

delete global.chrome;

// Browser detection with mock navigator
const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
try {
    Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'vi' },
        configurable: true
    });
    assert.strictEqual(i18n.detectBrowserLanguage(), 'vi', 'detectBrowserLanguage should detect navigator.language vi as vi');

    Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'ja-JP' },
        configurable: true
    });
    assert.strictEqual(i18n.detectBrowserLanguage(), 'en', 'detectBrowserLanguage should fallback ja-JP to en');
} finally {
    if (originalNavigatorDesc) {
        Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
    } else {
        delete globalThis.navigator;
    }
}

// Storage interaction test
let mockStorageData = {};
const mockStorage = {
    get: async (keys) => {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
            if (k in mockStorageData) result[k] = mockStorageData[k];
        }
        return result;
    },
    set: async (obj) => {
        mockStorageData = { ...mockStorageData, ...obj };
    }
};

(async () => {
    // Test setLanguage with storage
    await i18n.setLanguage('vi', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'vi');
    assert.strictEqual(mockStorageData.appLanguage, 'vi');

    await i18n.setLanguage('en', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'en');
    assert.strictEqual(mockStorageData.appLanguage, 'en');

    // Test invalid language normalization
    await i18n.setLanguage('fr', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'en', 'Invalid language should normalize to en');

    // Test initLanguage
    mockStorageData.appLanguage = 'vi';
    const initLang = await i18n.initLanguage(mockStorage);
    assert.strictEqual(initLang, 'vi');
    assert.strictEqual(i18n.getLanguage(), 'vi');

    console.log('✔ Passed: Language detection, setter, and storage persistence work correctly');

    // 6. Test DOM Translation applyI18n
    console.log('\n--- 6. DOM Translation applyI18n ---');

    class MockElement {
        constructor(tagName = 'div', attributes = {}) {
            this.tagName = tagName.toUpperCase();
            this.attributes = { ...attributes };
            this.textContent = '';
            this.placeholder = '';
            this.title = '';
            this.children = [];
        }
        getAttribute(name) {
            return this.attributes[name] !== undefined ? this.attributes[name] : null;
        }
        setAttribute(name, val) {
            this.attributes[name] = String(val);
        }
        hasAttribute(name) {
            return name in this.attributes;
        }
        querySelectorAll(selector) {
            const results = [];
            function traverse(node) {
                for (const child of node.children) {
                    if (selector.includes('[data-i18n]') && child.hasAttribute('data-i18n')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-placeholder]') && child.hasAttribute('data-i18n-placeholder')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-title]') && child.hasAttribute('data-i18n-title')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-aria]') && child.hasAttribute('data-i18n-aria')) {
                        results.push(child);
                    }
                    traverse(child);
                }
            }
            traverse(this);
            return results;
        }
    }

    const root = new MockElement('div');
    const titleEl = new MockElement('h2', { 'data-i18n': 'welcomeTitle' });
    const inputEl = new MockElement('input', { 'data-i18n-placeholder': 'tokenPlaceholder' });
    const btnEl = new MockElement('button', { 'data-i18n': 'connectBtn', 'data-i18n-title': 'connectBtn' });
    const ariaEl = new MockElement('button', { 'data-i18n-aria': 'logoutBtn' });

    root.children.push(titleEl, inputEl, btnEl, ariaEl);

    // Apply Vietnamese
    i18n.applyI18n(root, 'vi');
    assert.strictEqual(titleEl.textContent, 'Chào bạn 👋');
    assert.strictEqual(inputEl.placeholder, 'Nhập Personal Access Token...');
    assert.strictEqual(btnEl.textContent, 'Kết nối ngay');
    assert.strictEqual(btnEl.title, 'Kết nối ngay');
    assert.strictEqual(ariaEl.getAttribute('aria-label'), 'Đăng xuất');

    // Apply English
    i18n.applyI18n(root, 'en');
    assert.strictEqual(titleEl.textContent, 'Welcome 👋');
    assert.strictEqual(inputEl.placeholder, 'Enter Personal Access Token...');
    assert.strictEqual(btnEl.textContent, 'Connect Now');
    assert.strictEqual(btnEl.title, 'Connect Now');
    assert.strictEqual(ariaEl.getAttribute('aria-label'), 'Log out');

    console.log('✔ Passed: applyI18n correctly translates textContent, placeholder, title, and aria-label');

    // 7. Test Dual Export Simulation
    console.log('\n--- 7. Dual Export Environment Simulation ---');
    global.window = {};
    // Re-evaluating dual export binding in browser context
    if (typeof i18n._bindWindow === 'function') {
        i18n._bindWindow(global.window);
        assert.ok(global.window.i18n, 'window.i18n must be defined in browser context');
        assert.strictEqual(typeof global.window.i18n.t, 'function', 'window.i18n.t must be a function');
        assert.strictEqual(typeof global.window.t, 'function', 'window.t must be directly accessible');
    }
    delete global.window;
    console.log('✔ Passed: Dual export correctly handles browser window binding');

    // =========================================================================
    // TASK 2: POPUP INTERFACE & BACKGROUND NOTIFICATIONS INTEGRATION TESTS
    // =========================================================================
    console.log('\n=============================================================');
    console.log('--- Running Task 2: Popup Interface & Background Integration ---');
    console.log('=============================================================');

    const fs = require('fs');

    // 8. Verify popup/popup.html Markup & Declarative Attributes
    console.log('\n--- 8. Testing popup/popup.html Markup & i18n Wiring ---');
    const popupHtmlPath = path.resolve(__dirname, '../popup/popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

    // 8.1 Script tag for i18n.js
    assert.ok(
        popupHtml.includes('src="../i18n.js"') || popupHtml.includes("src='../i18n.js'"),
        'popup.html must include script tag for ../i18n.js'
    );

    // 8.2 Login Screen Language Switcher
    assert.ok(
        popupHtml.includes('login-lang-switch') || popupHtml.includes('loginLangSelect'),
        'popup.html must include a language switcher container on login screen'
    );
    assert.ok(
        popupHtml.includes('data-lang="vi"') && popupHtml.includes('data-lang="en"'),
        'Language switcher must include buttons or options for "vi" and "en"'
    );

    // 8.3 Login Screen Declarative i18n Attributes
    const requiredLoginAttrs = [
        'data-i18n="welcomeTitle"',
        'data-i18n="welcomeDesc"',
        'data-i18n-placeholder="tokenPlaceholder"',
        'data-i18n="connectBtn"',
        'data-i18n="tutorialBtn"'
    ];
    requiredLoginAttrs.forEach(attr => {
        assert.ok(popupHtml.includes(attr), `popup.html #login-screen must contain ${attr}`);
    });

    // 8.4 User Screen Header & Tabs Declarative Attributes
    assert.ok(popupHtml.includes('data-i18n-title="logoutBtn"'), 'Logout button must have data-i18n-title="logoutBtn"');
    assert.ok(!popupHtml.includes('data-i18n="tabWeek"'), 'Popup must not display a weekly KPI tab');
    assert.ok(popupHtml.includes('class="tab-btn active" data-tab="month-tab"'), 'Monthly KPI must be the default popup tab');
    assert.ok(popupHtml.includes('data-i18n="tabMonth"'), 'Tab navigation must have data-i18n="tabMonth"');
    assert.ok(!popupHtml.includes('month-estimate-time'), 'Popup must not aggregate whole-task estimates as a monthly target');
    assert.strictEqual(i18n.t('tableEst', null, 'vi'), 'Estimate toàn task (h)');
    assert.strictEqual(i18n.t('tableSpent', null, 'en'), 'Spent in period (h)');
    assert.strictEqual(i18n.t('tableLifetimeSpent', null, 'vi'), 'Spent toàn task (h)');
    assert.strictEqual(i18n.t('tableLifetimeSpent', null, 'en'), 'Lifetime spent (h)');
    assert.strictEqual(i18n.t('tableDiff', null, 'en'), 'Whole-task variance');
    assert.ok(popupHtml.includes('data-i18n="tabTools"'), 'Tab navigation must have data-i18n="tabTools"');

    // 8.5 Unadded KPI Banner Declarative Attributes

    // 8.6 Check-in Card Language Switcher & Controls
    assert.ok(popupHtml.includes('id="appLangSelect"'), 'Check-in settings card must include select #appLangSelect');
    assert.ok(popupHtml.includes('data-i18n="languageLabel"'), 'Check-in settings card must have label with data-i18n="languageLabel"');
    assert.ok(popupHtml.includes('data-i18n="checkinLabel"'), 'Check-in row must have data-i18n="checkinLabel"');
    assert.ok(popupHtml.includes('data-i18n="checkoutLabel"'), 'Check-out row must have data-i18n="checkoutLabel"');
    assert.ok(popupHtml.includes('data-i18n="snoozeLabel"'), 'Snooze row must have data-i18n="snoozeLabel"');
    assert.ok(popupHtml.includes('data-i18n="urlLabel"'), 'URL row must have data-i18n="urlLabel"');
    assert.ok(popupHtml.includes('data-i18n="testSoundBtn"'), 'Test sound button must have data-i18n="testSoundBtn"');
    assert.ok(popupHtml.includes('data-i18n="saveSettingsBtn"'), 'Save settings button must have data-i18n="saveSettingsBtn"');

    // 8.7 Tools Grid Buttons
    const requiredToolsAttrs = [
        'data-i18n="noteWindowBtn"',
        'data-i18n="noteTabBtn"',
        'data-i18n="todoWindowBtn"',
        'data-i18n="todoTabBtn"',
        'data-i18n="exportBtn"',
        'data-i18n="importBtn"'
    ];
    requiredToolsAttrs.forEach(attr => {
        assert.ok(popupHtml.includes(attr), `popup.html tools grid must contain ${attr}`);
    });
    console.log('✔ Passed: popup/popup.html contains all required i18n tags, selectors, and declarative attributes');

    // 9. Verify popup/popup.css Styling
    console.log('\n--- 9. Testing popup/popup.css Styles ---');
    const popupCssPath = path.resolve(__dirname, '../popup/popup.css');
    const popupCss = fs.readFileSync(popupCssPath, 'utf8');

    assert.ok(popupCss.includes('.login-lang-switch'), 'popup.css must style .login-lang-switch');
    assert.ok(popupCss.includes('.lang-btn'), 'popup.css must style .lang-btn');
    assert.ok(popupCss.includes('.lang-btn.active') || popupCss.includes('.lang-btn:active'), 'popup.css must style active state of .lang-btn');
    assert.ok(
        popupCss.includes('#appLangSelect') || popupCss.includes('.lang-select'),
        'popup.css must style language selector in settings'
    );
    console.log('✔ Passed: popup/popup.css contains language switcher styling rules');

    // 10. Verify background.js Localized Desktop Notifications
    console.log('\n--- 10. Testing background.js Localized Desktop Notifications ---');

    let bgStorage = {};
    let bgNotifications = [];
    global.chrome = {
        runtime: {
            onInstalled: { addListener: () => {} },
            onStartup: { addListener: () => {} },
            getURL: (p) => `chrome-extension://mock-id/${p}`
        },
        alarms: {
            create: () => {},
            onAlarm: { addListener: () => {} }
        },
        notifications: {
            create: (id, opts) => {
                bgNotifications.push({ id, ...opts });
            },
            clear: () => {},
            onClicked: { addListener: () => {} }
        },
        action: {
            setBadgeText: () => {},
            setBadgeBackgroundColor: () => {},
            openPopup: async () => {}
        },
        storage: {
            local: {
                get: async (keys) => {
                    if (typeof keys === 'string') return { [keys]: bgStorage[keys] };
                    if (Array.isArray(keys)) {
                        const res = {};
                        keys.forEach(k => { if (bgStorage[k] !== undefined) res[k] = bgStorage[k]; });
                        return res;
                    }
                    return { ...bgStorage };
                },
                set: async (obj) => {
                    Object.assign(bgStorage, obj);
                }
            }
        },
        tabs: {
            create: () => {}
        }
    };

    // Clear module cache to test fresh background.js
    delete require.cache[require.resolve('../background.js')];
    const background = require('../background.js');

    // 10.1 Check-in Alert in VI
    {
        bgStorage = {
            appLanguage: 'vi',
            checkInEnabled: true,
            checkInTime: '08:30',
            checkInOutSnoozeMinutes: 5,
            checkInState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T08:30:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkin-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckinTitle', null, 'vi')),
            `Check-in alert title in VI should match: expected "${i18n.t('notifCheckinTitle', null, 'vi')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes('08:30'),
            'Check-in alert message should include target time'
        );
    }

    // 10.2 Check-in Alert in EN
    {
        bgStorage = {
            appLanguage: 'en',
            checkInEnabled: true,
            checkInTime: '08:30',
            checkInOutSnoozeMinutes: 5,
            checkInState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T08:30:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkin-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckinTitle', null, 'en')),
            `Check-in alert title in EN should match: expected "${i18n.t('notifCheckinTitle', null, 'en')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes("It's time to start work"),
            'Check-in alert message in EN should be in English'
        );
    }

    // 10.3 Check-out Alert in VI
    {
        bgStorage = {
            appLanguage: 'vi',
            checkInEnabled: false,
            checkOutEnabled: true,
            checkOutTime: '18:00',
            checkInOutSnoozeMinutes: 5,
            checkOutState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T18:00:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkout-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckoutTitle', null, 'vi')),
            `Check-out alert title in VI should match: expected "${i18n.t('notifCheckoutTitle', null, 'vi')}", got "${bgNotifications[0].title}"`
        );
    }

    // 10.4 Check-out Alert in EN
    {
        bgStorage = {
            appLanguage: 'en',
            checkInEnabled: false,
            checkOutEnabled: true,
            checkOutTime: '18:00',
            checkInOutSnoozeMinutes: 5,
            checkOutState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T18:00:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkout-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckoutTitle', null, 'en')),
            `Check-out alert title in EN should match: expected "${i18n.t('notifCheckoutTitle', null, 'en')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes("It's time to check out"),
            'Check-out alert message in EN should be in English'
        );
    }

    console.log('✔ Passed: Localized Check-in and Check-out notifications remain available');

    // 11. Verify popup.js Localization Logic
    console.log('\n--- 11. Testing popup/popup.js Localization Logic ---');
    const popupJsContent = fs.readFileSync(path.resolve(__dirname, '../popup/popup.js'), 'utf8');

    assert.ok(popupJsContent.includes('initLanguage'), 'popup.js must call initLanguage');
    assert.ok(popupJsContent.includes('applyI18n'), 'popup.js must call applyI18n');
    assert.ok(popupJsContent.includes('setLanguage'), 'popup.js must call setLanguage when user toggles language');

    assert.ok(!popupHtml.includes('unaddedKpiBanner'), 'Old KPI reminder banner must be removed');
    for (const key of ['syncSettingsTitle', 'syncEnabledLabel', 'syncIntervalLabel', 'syncNow']) {
        assert.ok(popupHtml.includes(`data-i18n="${key}"`));
        assert.notStrictEqual(i18n.t(key, null, 'vi'), key);
        assert.notStrictEqual(i18n.t(key, null, 'en'), key);
    }
    assert.strictEqual(i18n.t('syncLast', { time: '10:30' }, 'en'), 'Last synced: 10:30');
    console.log('✔ Passed: Popup sync UI is localized in VI and EN');

    // =========================================================================
    // TASK 3: DASHBOARD, KANBAN, NOTEPAD & GITLAB INTEGRATION TESTS
    // =========================================================================
    console.log('\n=============================================================');
    console.log('--- Running Task 3: Dashboard, Kanban, Notepad & In-Page GitLab ---');
    console.log('=============================================================');

    // 12. Verify manifest.json includes i18n.js in content_scripts
    console.log('\n--- 12. Testing manifest.json content_scripts configuration ---');
    const manifestPath = path.resolve(__dirname, '../manifest.json');
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const issueScript = manifestJson.content_scripts.find(cs =>
        cs.js && (cs.js.includes('content_issue.js') || cs.matches.some(m => m.includes('issues') || m.includes('work_items')))
    );
    assert.ok(issueScript, 'manifest.json must have content_script for issues/work_items');
    assert.ok(issueScript.js.includes('i18n.js'), 'content_scripts for issues/work_items must include "i18n.js"');
    console.log('✔ Passed: manifest.json includes i18n.js in content_scripts');

    // 13. Verify page/page.html & page/page.js Localization
    console.log('\n--- 13. Testing page/page.html & page/page.js Localization ---');
    const pageHtmlPath = path.resolve(__dirname, '../page/page.html');
    const pageHtml = fs.readFileSync(pageHtmlPath, 'utf8');

    assert.ok(pageHtml.includes('src="../i18n.js"') || pageHtml.includes("src='../i18n.js'"), 'page.html must include script tag for ../i18n.js');
    assert.ok(pageHtml.includes('data-i18n="kpiDashboardTitle"') || pageHtml.includes('data-i18n="pageTitle"'), 'page.html must have dashboard title data-i18n');
    assert.ok(pageHtml.includes('data-i18n="tabWorkItems"'), 'page.html must have tabWorkItems');
    assert.ok(pageHtml.includes('data-i18n="tabAnalytics"'), 'page.html must have tabAnalytics');
    assert.ok(pageHtml.includes('data-i18n="quickControlsTitle"'), 'page.html must have quickControlsTitle');
    assert.ok(pageHtml.includes('data-i18n="timesheetTitle"'), 'page.html must have timesheetTitle');
    assert.ok(pageHtml.includes('data-i18n="chartEstSpentTitle"'), 'page.html must have chartEstSpentTitle');
    assert.ok(pageHtml.includes('data-i18n="chartTaskTypeTitle"'), 'page.html must have chartTaskTypeTitle');
    assert.ok(pageHtml.includes('data-i18n="chartTaskStatusTitle"'), 'page.html must have chartTaskStatusTitle');
    assert.ok(!pageHtml.includes('chartKpiTrend'), 'Dashboard must not display a weekly KPI chart');

    const pageJsContent = fs.readFileSync(path.resolve(__dirname, '../page/page.js'), 'utf8');
    assert.ok(pageJsContent.includes('initLanguage'), 'page.js must call initLanguage');
    assert.ok(pageJsContent.includes('applyI18n'), 'page.js must call applyI18n');
    assert.ok(pageJsContent.includes('statusDoing'), 'page.js must reference statusDoing');
    assert.ok(pageJsContent.includes('statusDone'), 'page.js must reference statusDone');
    assert.ok(pageJsContent.includes('statusCarryOver'), 'page.js must reference statusCarryOver');

    // Test getStatusBadgeText
    const pageModule = require('../page/page.js');
    assert.strictEqual(typeof pageModule.getStatusBadgeText, 'function', 'page.js must export getStatusBadgeText');
    i18n.setLanguage('vi');
    assert.strictEqual(pageModule.getStatusBadgeText('doing'), 'Đang làm');
    assert.strictEqual(pageModule.getStatusBadgeText('done'), 'Hoàn thành');
    assert.strictEqual(pageModule.getStatusBadgeText('carryOver'), 'Tồn đọng');
    i18n.setLanguage('en');
    assert.strictEqual(pageModule.getStatusBadgeText('doing'), 'Doing');
    assert.strictEqual(pageModule.getStatusBadgeText('done'), 'Done');
    assert.strictEqual(pageModule.getStatusBadgeText('carryOver'), 'Carry Over');
    console.log('✔ Passed: page.html & page.js correctly wired for i18n');

    // 14. Verify todo/todo.html & todo/todo.js Localization
    console.log('\n--- 14. Testing todo/todo.html & todo/todo.js Localization ---');
    const todoHtmlPath = path.resolve(__dirname, '../todo/todo.html');
    const todoHtml = fs.readFileSync(todoHtmlPath, 'utf8');

    assert.ok(todoHtml.includes('src="../i18n.js"') || todoHtml.includes("src='../i18n.js'"), 'todo.html must include script tag for ../i18n.js');
    assert.ok(todoHtml.includes('data-i18n="kanbanTitle"'), 'todo.html must have data-i18n="kanbanTitle"');
    assert.ok(todoHtml.includes('data-i18n="colTodo"'), 'todo.html must have data-i18n="colTodo"');
    assert.ok(todoHtml.includes('data-i18n="colProcessing"'), 'todo.html must have data-i18n="colProcessing"');
    assert.ok(todoHtml.includes('data-i18n="colDone"'), 'todo.html must have data-i18n="colDone"');
    assert.ok(todoHtml.includes('data-i18n-placeholder="addTaskPlaceholder"'), 'todo.html must have addTaskPlaceholder');
    assert.ok(todoHtml.includes('data-i18n-placeholder="deadlinePlaceholder"'), 'todo.html must have deadlinePlaceholder');
    assert.ok(todoHtml.includes('data-i18n="addTaskBtn"'), 'todo.html must have addTaskBtn');
    assert.ok(todoHtml.includes('data-i18n="editTaskModalTitle"'), 'todo.html must have editTaskModalTitle');
    assert.ok(todoHtml.includes('data-i18n="taskTitleLabel"') || todoHtml.includes('data-i18n="taskNameLabel"'), 'todo.html must have task title label');
    assert.ok(todoHtml.includes('data-i18n="deadlineLabel"'), 'todo.html must have deadlineLabel');
    assert.ok(todoHtml.includes('data-i18n="saveChangesBtn"'), 'todo.html must have saveChangesBtn');
    assert.ok(todoHtml.includes('data-i18n="cancelBtn"'), 'todo.html must have cancelBtn');

    const todoJsContent = fs.readFileSync(path.resolve(__dirname, '../todo/todo.js'), 'utf8');
    assert.ok(todoJsContent.includes('initLanguage'), 'todo.js must call initLanguage');
    assert.ok(todoJsContent.includes('applyI18n'), 'todo.js must call applyI18n');
    console.log('✔ Passed: todo.html & todo.js correctly wired for i18n');

    // 15. Verify note/note.html & note/note.js Localization
    console.log('\n--- 15. Testing note/note.html & note/note.js Localization ---');
    const noteHtmlPath = path.resolve(__dirname, '../note/note.html');
    const noteHtml = fs.readFileSync(noteHtmlPath, 'utf8');

    assert.ok(noteHtml.includes('src="../i18n.js"') || noteHtml.includes("src='../i18n.js'"), 'note.html must include script tag for ../i18n.js');
    assert.ok(noteHtml.includes('data-i18n="notesTitle"') || noteHtml.includes('data-i18n-title="notesTitle"'), 'note.html must have notesTitle');
    assert.ok(noteHtml.includes('data-i18n-placeholder="notePlaceholder"'), 'note.html must have notePlaceholder');
    assert.ok(noteHtml.includes('data-i18n="addNoteBtn"') || noteHtml.includes('data-i18n-title="addNoteBtn"'), 'note.html must have addNoteBtn');

    const noteJsContent = fs.readFileSync(path.resolve(__dirname, '../note/note.js'), 'utf8');
    assert.ok(noteJsContent.includes('initLanguage'), 'note.js must call initLanguage');
    assert.ok(noteJsContent.includes('applyI18n'), 'note.js must call applyI18n');
    assert.ok(noteJsContent.includes('autoSaved') || noteJsContent.includes('saving'), 'note.js must localize save status with i18n');
    console.log('✔ Passed: note.html & note.js correctly wired for i18n');

    // 16. Verify content_issue.js Summary Modal & KPI Button Localization
    console.log('\n--- 16. Testing content_issue.js Summary Modal & In-Page Localization ---');
    const contentIssuePath = path.resolve(__dirname, '../content_issue.js');
    const contentIssueContent = fs.readFileSync(contentIssuePath, 'utf8');
    assert.ok(contentIssueContent.includes('initLanguage'), 'content_issue.js must call initLanguage on startup');
    assert.ok(contentIssueContent.includes('summaryBtn'), 'content_issue.js must use summaryBtn key');

    // Test renderSummaryModalHtml in VI and EN
    const contentIssueModule = require('../content_issue.js');
    const sampleMetrics = {
        totalTasks: 3,
        totalEstimate: 10,
        totalSpent: 8,
        diffHours: 2,
        openTasks: 1,
        closedTasks: 2,
        lateTasks: 0,
        onTimeRate: 100,
        plannedCount: 2,
        unplannedCount: 1
    };
    const sampleTasks = [
        { id: '1', iid: '1', title: 'Task 1', estimateHour: 5, spentHour: 4, state: 'closed', isLate: false, isUnplanned: false }
    ];

    // Render in VI
    i18n.setLanguage('vi');
    const viModalHtml = contentIssueModule.renderSummaryModalHtml(sampleMetrics, sampleTasks, 'Parent VI');
    assert.ok(viModalHtml.includes('Tổng Task'), 'VI modal must contain "Tổng Task"');
    assert.ok(viModalHtml.includes('Tổng Estimate'), 'VI modal must contain "Tổng Estimate"');
    assert.ok(viModalHtml.includes('Tổng Spent'), 'VI modal must contain "Tổng Spent"');
    assert.ok(viModalHtml.includes('Chênh lệch'), 'VI modal must contain "Chênh lệch"');
    assert.ok(viModalHtml.includes('Đúng hạn'), 'VI modal must contain "Đúng hạn"');
    assert.ok(viModalHtml.includes('Làm mới'), 'VI modal must contain "Làm mới"');
    assert.ok(viModalHtml.includes('Thêm tất cả vào KPI'), 'VI modal must contain "Thêm tất cả vào KPI"');

    // Render in EN
    i18n.setLanguage('en');
    const enModalHtml = contentIssueModule.renderSummaryModalHtml(sampleMetrics, sampleTasks, 'Parent EN');
    assert.ok(enModalHtml.includes('Total Tasks'), 'EN modal must contain "Total Tasks"');
    assert.ok(enModalHtml.includes('Total Estimate'), 'EN modal must contain "Total Estimate"');
    assert.ok(enModalHtml.includes('Total Spent'), 'EN modal must contain "Total Spent"');
    assert.ok(enModalHtml.includes('Difference') || enModalHtml.includes('Diff'), 'EN modal must contain Difference/Diff');
    assert.ok(enModalHtml.includes('On-time Rate') || enModalHtml.includes('On-Time Rate'), 'EN modal must contain On-time Rate');
    assert.ok(enModalHtml.includes('Refresh'), 'EN modal must contain "Refresh"');
    assert.ok(enModalHtml.includes('Add All to KPI') || enModalHtml.includes('Add all to KPI'), 'EN modal must contain "Add All to KPI"');

    console.log('✔ Passed: content_issue.js renderSummaryModalHtml produces localized markup for VI and EN');

    console.log('\n🎉 ALL TASK 1, TASK 2 & TASK 3 TESTS PASSED SUCCESSFULLY! 🎉\n');
})();

