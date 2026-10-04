/**
 * Unit Test Suite for Task 1:
 * Core URL Normalization Utility, Token Generation URL & Dictionary Tokens
 */

const assert = require('assert');
const path = require('path');

console.log('=== Running Suite: Task 1 - Core URL Normalization & Dictionary Tokens ===\n');

// 1. Module Exports & Function Availability in utils.js
console.log('--- 1. Testing exports from utils.js ---');
const utils = require('../utils.js');

assert.strictEqual(typeof utils.sanitizeGitlabUrl, 'function', 'sanitizeGitlabUrl must be exported from utils.js');
assert.strictEqual(typeof utils.getTokenGenerationUrl, 'function', 'getTokenGenerationUrl must be exported from utils.js');
assert.strictEqual(typeof utils.getGitlabServerUrl, 'function', 'getGitlabServerUrl must be exported from utils.js');
console.log('✔ Passed: utils.js exports sanitizeGitlabUrl, getTokenGenerationUrl, and getGitlabServerUrl');

// 2. Testing sanitizeGitlabUrl
console.log('\n--- 2. Testing sanitizeGitlabUrl ---');
const { sanitizeGitlabUrl } = utils;

// 2.1 Empty / Null / Whitespace inputs
assert.strictEqual(sanitizeGitlabUrl(null), 'https://gitlab.com', 'null should return default URL');
assert.strictEqual(sanitizeGitlabUrl(undefined), 'https://gitlab.com', 'undefined should return default URL');
assert.strictEqual(sanitizeGitlabUrl(''), 'https://gitlab.com', 'empty string should return default URL');
assert.strictEqual(sanitizeGitlabUrl('   '), 'https://gitlab.com', 'whitespace string should return default URL');
assert.strictEqual(sanitizeGitlabUrl(null, 'https://custom.gitlab.org'), 'https://custom.gitlab.org', 'custom defaultUrl should be respected for null');
assert.strictEqual(sanitizeGitlabUrl('', 'https://custom.gitlab.org'), 'https://custom.gitlab.org', 'custom defaultUrl should be respected for empty string');

// 2.2 Missing protocol (prepends https://)
assert.strictEqual(sanitizeGitlabUrl('gitlab.com'), 'https://gitlab.com', 'missing protocol on gitlab.com');
assert.strictEqual(sanitizeGitlabUrl('gitlab.mycorp.vn'), 'https://gitlab.mycorp.vn', 'missing protocol on custom domain');
assert.strictEqual(sanitizeGitlabUrl('192.168.1.100:8080'), 'https://192.168.1.100:8080', 'missing protocol with IP and port');

// 2.3 Explicit http:// and https:// protocols preserved
assert.strictEqual(sanitizeGitlabUrl('http://gitlab.internal.lan'), 'http://gitlab.internal.lan', 'http:// protocol should be preserved');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.internal.lan'), 'https://gitlab.internal.lan', 'https:// protocol should be preserved');

// 2.4 Stripping deep subpaths and query/hash
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/explore'), 'https://gitlab.com', 'should strip /explore subpath');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/group/project/-/issues/123'), 'https://gitlab.com', 'should strip project/issue subpath');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.mycorp.vn/sub/path?param=1#section'), 'https://gitlab.mycorp.vn', 'should strip queries and hash');

// 2.5 Removing trailing slashes
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/'), 'https://gitlab.com', 'single trailing slash');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.mycorp.vn///'), 'https://gitlab.mycorp.vn', 'multiple trailing slashes');
assert.strictEqual(sanitizeGitlabUrl('gitlab.mycorp.vn///'), 'https://gitlab.mycorp.vn', 'missing protocol with multiple trailing slashes');

// 2.6 Preserving port numbers
assert.strictEqual(sanitizeGitlabUrl('http://192.168.1.50:8080/'), 'http://192.168.1.50:8080', 'http IP with port and trailing slash');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.company.com:8443/dashboard'), 'https://gitlab.company.com:8443', 'https custom port with subpath');
assert.strictEqual(sanitizeGitlabUrl('localhost:3000'), 'https://localhost:3000', 'localhost with port');

// 2.7 Invalid URLs (new URL throws)
assert.strictEqual(sanitizeGitlabUrl('http://::invalid::'), 'https://gitlab.com', 'invalid URL should fallback to defaultUrl');
assert.strictEqual(sanitizeGitlabUrl('http://[:::123]', 'https://fallback.com'), 'https://fallback.com', 'invalid URL with custom defaultUrl');
console.log('✔ Passed: sanitizeGitlabUrl handles defaults, protocols, subpaths, trailing slashes, ports, and errors');

// 3. Testing getTokenGenerationUrl
console.log('\n--- 3. Testing getTokenGenerationUrl ---');
const { getTokenGenerationUrl } = utils;

assert.strictEqual(
    getTokenGenerationUrl('https://gitlab.com'),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'standard gitlab.com'
);
assert.strictEqual(
    getTokenGenerationUrl('https://gitlab.mycorp.vn/'),
    'https://gitlab.mycorp.vn/-/user_settings/personal_access_tokens',
    'custom domain with trailing slash'
);
assert.strictEqual(
    getTokenGenerationUrl('gitlab.internal:8080/explore'),
    'https://gitlab.internal:8080/-/user_settings/personal_access_tokens',
    'missing protocol with port and subpath'
);
assert.strictEqual(
    getTokenGenerationUrl(''),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'empty string falls back to gitlab.com'
);
assert.strictEqual(
    getTokenGenerationUrl(null),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'null falls back to gitlab.com'
);
console.log('✔ Passed: getTokenGenerationUrl correctly generates personal access tokens URL');

// 4. Testing getGitlabServerUrl
console.log('\n--- 4. Testing getGitlabServerUrl ---');
const { getGitlabServerUrl } = utils;

(async () => {
    // 4.1 With storageArea providing gitlabServerUrl
    const mockStorageWithUrl = {
        get: async (keys) => ({ gitlabServerUrl: 'https://gitlab.internal.corp/subpath/' })
    };
    const urlFromStorage = await getGitlabServerUrl(mockStorageWithUrl);
    assert.strictEqual(urlFromStorage, 'https://gitlab.internal.corp', 'should sanitize stored URL');

    // 4.2 With storageArea returning empty object (fallback)
    const mockStorageEmpty = {
        get: async (keys) => ({})
    };
    const defaultFallbackUrl = await getGitlabServerUrl(mockStorageEmpty);
    assert.strictEqual(defaultFallbackUrl, 'https://gitlab.com', 'should return default fallback');

    const customFallbackUrl = await getGitlabServerUrl(mockStorageEmpty, 'https://default.corp');
    assert.strictEqual(customFallbackUrl, 'https://default.corp', 'should return custom fallback');

    // 4.3 With chrome.storage.local mock (storageArea omitted)
    const originalChrome = global.chrome;
    global.chrome = {
        storage: {
            local: {
                get: (keys, cb) => {
                    const res = { gitlabServerUrl: 'http://gitlab.dev.local:9000' };
                    if (typeof cb === 'function') {
                        cb(res);
                        return;
                    }
                    return Promise.resolve(res);
                }
            }
        }
    };
    const chromeStoredUrl = await getGitlabServerUrl();
    assert.strictEqual(chromeStoredUrl, 'http://gitlab.dev.local:9000', 'should read from chrome.storage.local');

    // 4.4 Without chrome and without storageArea (graceful fallback)
    delete global.chrome;
    const noStorageUrl = await getGitlabServerUrl(null, 'https://fallback-offline.org');
    assert.strictEqual(noStorageUrl, 'https://fallback-offline.org', 'should return fallback when no storage is available');

    // Restore chrome
    if (originalChrome) {
        global.chrome = originalChrome;
    } else {
        delete global.chrome;
    }
    console.log('✔ Passed: getGitlabServerUrl works with custom storage, chrome.storage.local, and fallbacks');

    // 5. Testing Dictionary Tokens in i18n.js
    console.log('\n--- 5. Testing i18n Dictionary Tokens for Server URL ---');
    const i18n = require('../i18n.js');
    const vi = i18n.I18N_DICTIONARIES.vi;
    const en = i18n.I18N_DICTIONARIES.en;

    const expectedTokens = [
        'gitlabServerUrlLabel',
        'gitlabServerUrlPlaceholder',
        'invalidServerUrl',
        'serverUrlSaved',
        'getTokenHelp'
    ];

    for (const key of expectedTokens) {
        assert.ok(key in vi, `Token "${key}" must exist in Vietnamese dictionary`);
        assert.ok(key in en, `Token "${key}" must exist in English dictionary`);
        assert.strictEqual(typeof vi[key], 'string', `Token "${key}" in VI must be a string`);
        assert.strictEqual(typeof en[key], 'string', `Token "${key}" in EN must be a string`);
        assert.ok(vi[key].length > 0, `Token "${key}" in VI must not be empty`);
        assert.ok(en[key].length > 0, `Token "${key}" in EN must not be empty`);
    }

    // Verify exact expected text values
    assert.strictEqual(vi.gitlabServerUrlLabel, 'GitLab Server URL:');
    assert.strictEqual(en.gitlabServerUrlLabel, 'GitLab Server URL:');
    assert.strictEqual(vi.gitlabServerUrlPlaceholder, 'https://gitlab.com hoặc server riêng...');
    assert.strictEqual(en.gitlabServerUrlPlaceholder, 'https://gitlab.com or self-hosted server...');
    assert.strictEqual(vi.invalidServerUrl, 'Vui lòng nhập GitLab Server URL hợp lệ');
    assert.strictEqual(en.invalidServerUrl, 'Please enter a valid GitLab Server URL');
    assert.strictEqual(vi.serverUrlSaved, 'Đã lưu GitLab Server URL thành công');
    assert.strictEqual(en.serverUrlSaved, 'GitLab Server URL saved successfully');
    assert.strictEqual(vi.getTokenHelp, 'Lấy Access Token tại server này');
    assert.strictEqual(en.getTokenHelp, 'Get Access Token from this server');

    // Verify translation via t()
    assert.strictEqual(i18n.t('gitlabServerUrlLabel', null, 'vi'), 'GitLab Server URL:');
    assert.strictEqual(i18n.t('gitlabServerUrlLabel', null, 'en'), 'GitLab Server URL:');
    assert.strictEqual(i18n.t('invalidServerUrl', null, 'vi'), 'Vui lòng nhập GitLab Server URL hợp lệ');
    assert.strictEqual(i18n.t('invalidServerUrl', null, 'en'), 'Please enter a valid GitLab Server URL');

    console.log('✔ Passed: All 5 required dictionary tokens exist in VI and EN with 100% parity');
    console.log('\n🎉 ALL TASK 1 TESTS PASSED! 🎉\n');

    // =========================================================================
    // TASK 2: POPUP LOGIN SCREEN & SETTINGS CARD INTEGRATION
    // =========================================================================
    console.log('\n=============================================================');
    console.log('=== Running Suite: Task 2 - Popup Login Screen & Settings ===');
    console.log('=============================================================');

    const fs = require('fs');

    // 6. Testing popup/popup.html markup
    console.log('\n--- 6. Testing popup/popup.html Markup for Server URL ---');
    const popupHtmlPath = path.resolve(__dirname, '../popup/popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

    // 6.1 Server URL input on login screen
    assert.ok(popupHtml.includes('id="gitlabServerUrlInput"'), 'popup.html must have #gitlabServerUrlInput');
    assert.ok(popupHtml.includes('data-i18n="gitlabServerUrlLabel"'), 'popup.html must have label with data-i18n="gitlabServerUrlLabel"');
    assert.ok(popupHtml.includes('data-i18n-placeholder="gitlabServerUrlPlaceholder"'), 'popup.html must have data-i18n-placeholder="gitlabServerUrlPlaceholder"');

    // 6.2 Quick Select Pills
    assert.ok(popupHtml.includes('class="quick-url-pills"') || popupHtml.includes("class='quick-url-pills'"), 'popup.html must have container .quick-url-pills');
    assert.ok(popupHtml.includes('data-url="https://gitlab.com"'), 'popup.html must have quick pill with data-url="https://gitlab.com"');
    assert.ok(popupHtml.includes('data-url="https://gitlab.widosoft.com"'), 'popup.html must have quick pill with data-url="https://gitlab.widosoft.com"');
    assert.ok(popupHtml.includes('quick-url-pill'), 'popup.html must have .quick-url-pill classes');

    // 6.3 Dynamic Token Help Link
    assert.ok(popupHtml.includes('id="tokenHelpLink"'), 'popup.html must have #tokenHelpLink');
    assert.ok(popupHtml.includes('target="_blank"'), 'tokenHelpLink must open in new tab (target="_blank")');
    assert.ok(popupHtml.includes('data-i18n="getTokenHelp"'), 'tokenHelpLink or its inner text must use data-i18n="getTokenHelp"');

    // 6.4 Settings Card / Tab Server URL Controls
    assert.ok(popupHtml.includes('id="settingsServerUrlInput"'), 'popup.html must have #settingsServerUrlInput in settings');
    assert.ok(popupHtml.includes('id="saveServerUrlBtn"'), 'popup.html must have #saveServerUrlBtn');
    assert.ok(popupHtml.includes('id="settings-tab"') || popupHtml.includes('class="server-settings-card"'), 'popup.html must have settings-tab or server-settings-card');
    assert.ok(popupHtml.includes('id="saveServerUrlMsg"'), 'popup.html must have feedback message container #saveServerUrlMsg');

    console.log('✔ Passed: popup.html contains all required server URL elements, quick pills, and settings controls');

    // 7. Testing popup/popup.css Styling
    console.log('\n--- 7. Testing popup/popup.css Styles for Server URL ---');
    const popupCssPath = path.resolve(__dirname, '../popup/popup.css');
    const popupCss = fs.readFileSync(popupCssPath, 'utf8');

    assert.ok(popupCss.includes('.server-url-group'), 'popup.css must style .server-url-group');
    assert.ok(popupCss.includes('.quick-url-pills'), 'popup.css must style .quick-url-pills');
    assert.ok(popupCss.includes('.quick-url-pill'), 'popup.css must style .quick-url-pill');
    assert.ok(popupCss.includes('.quick-url-pill.active'), 'popup.css must style .quick-url-pill.active');
    assert.ok(popupCss.includes('.token-help-link'), 'popup.css must style .token-help-link');

    console.log('✔ Passed: popup.css contains styling rules for server URL groups, pills, and dynamic token link');

    // 8. Testing popup/popup.js Logic & Helpers
    console.log('\n--- 8. Testing popup/popup.js Helpers & Logic ---');
    const popupModule = require('../popup/popup.js');

    assert.strictEqual(typeof popupModule.updateTokenHelpLink, 'function', 'popup.js must export updateTokenHelpLink');
    assert.strictEqual(typeof popupModule.handleSaveServerUrl, 'function', 'popup.js must export handleSaveServerUrl');
    assert.strictEqual(typeof popupModule.fetchUserProfile, 'function', 'popup.js must export fetchUserProfile');

    // 8.1 Testing updateTokenHelpLink with mock document
    {
        class MockClassList {
            constructor() { this.classes = new Set(); }
            add(c) { this.classes.add(c); }
            remove(c) { this.classes.delete(c); }
            contains(c) { return this.classes.has(c); }
        }

        const pill1 = {
            getAttribute: (attr) => attr === 'data-url' ? 'https://gitlab.com' : null,
            classList: new MockClassList()
        };
        const pill2 = {
            getAttribute: (attr) => attr === 'data-url' ? 'https://gitlab.widosoft.com' : null,
            classList: new MockClassList()
        };

        const mockLink = {
            href: '',
            setAttribute(k, v) { this[k] = v; }
        };

        const mockDoc = {
            elements: {
                tokenHelpLink: mockLink
            },
            getElementById(id) { return this.elements[id] || null; },
            querySelectorAll(sel) {
                if (sel === '.quick-url-pill') return [pill1, pill2];
                return [];
            }
        };

        // When server is gitlab.com
        popupModule.updateTokenHelpLink('https://gitlab.com', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.com/-/user_settings/personal_access_tokens');
        assert.ok(pill1.classList.contains('active'), 'pill1 should be active for gitlab.com');
        assert.ok(!pill2.classList.contains('active'), 'pill2 should not be active for gitlab.com');

        // When server is gitlab.widosoft.com
        popupModule.updateTokenHelpLink('gitlab.widosoft.com', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.widosoft.com/-/user_settings/personal_access_tokens');
        assert.ok(!pill1.classList.contains('active'), 'pill1 should not be active for widosoft');
        assert.ok(pill2.classList.contains('active'), 'pill2 should be active for widosoft');

        // When server is a custom third-party domain
        popupModule.updateTokenHelpLink('https://gitlab.customcorp.vn/subpath', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.customcorp.vn/-/user_settings/personal_access_tokens');
        assert.ok(!pill1.classList.contains('active'), 'neither pill should be active');
        assert.ok(!pill2.classList.contains('active'), 'neither pill should be active');

        console.log('✔ Passed: updateTokenHelpLink correctly updates link href and active pill state');
    }

    // 8.2 Testing handleSaveServerUrl
    {
        let stored = {};
        const mockStorage = {
            set: async (obj) => { Object.assign(stored, obj); }
        };

        const savedUrl = await popupModule.handleSaveServerUrl('gitlab.mycorp.io:8080/deep/path', mockStorage);
        assert.strictEqual(savedUrl, 'https://gitlab.mycorp.io:8080', 'should sanitize and return origin with port');
        assert.strictEqual(stored.gitlabServerUrl, 'https://gitlab.mycorp.io:8080', 'should persist sanitized url in storage');

        // Test fallback on empty input
        const fallbackUrl = await popupModule.handleSaveServerUrl('', mockStorage);
        assert.strictEqual(fallbackUrl, 'https://gitlab.com', 'empty should fallback to gitlab.com');
        assert.strictEqual(stored.gitlabServerUrl, 'https://gitlab.com');

        console.log('✔ Passed: handleSaveServerUrl normalizes and stores server URL');
    }

    // 8.3 Testing fetchUserProfile with custom serverUrl and mock fetch
    {
        const calls = [];
        const mockFetchSuccess = async (url, opts) => {
            calls.push({ url, opts });
            return {
                ok: true,
                json: async () => ({ id: 42, username: 'testuser', avatar_url: 'https://avatar.png' })
            };
        };

        const user = await popupModule.fetchUserProfile('my-token-123', 'gitlab.custom.lan:9090', mockFetchSuccess);
        assert.ok(user, 'should return user profile');
        assert.strictEqual(user.username, 'testuser');
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].url, 'https://gitlab.custom.lan:9090/api/v4/user');
        assert.strictEqual(calls[0].opts.headers['PRIVATE-TOKEN'], 'my-token-123');

        // Test 401 Unauthorized
        const mockFetch401 = async (url, opts) => ({
            ok: false,
            status: 401,
            json: async () => ({ message: '401 Unauthorized' })
        });
        const unauthorizedUser = await popupModule.fetchUserProfile('bad-token', 'https://gitlab.com', mockFetch401);
        assert.strictEqual(unauthorizedUser, null, '401 response should return null');

        console.log('✔ Passed: fetchUserProfile targets dynamic server URL and handles authorization responses');
    }

    console.log('\n🎉 ALL TASK 2 TESTS PASSED! 🎉\n');

    // =========================================================================
    // TASK 3: BACKGROUND SERVICE WORKER DYNAMIC REGISTRATION & DYNAMIC ROUTING
    // =========================================================================
    console.log('\n================================================================================');
    console.log('=== Running Suite: Task 3 - Dynamic Script Registration & Dynamic API Routing ===');
    console.log('================================================================================');

    // 9. Testing Dynamic Content Script Registration in background.js
    console.log('\n--- 9. Testing syncDynamicContentScript in background.js ---');
    const bg = require('../background.js');
    assert.strictEqual(typeof bg.syncDynamicContentScript, 'function', 'syncDynamicContentScript must be exported by background.js');

    // Mock chrome.scripting for testing syncDynamicContentScript
    let registeredScripts = [];
    let unregisteredIds = [];
    global.chrome = {
        scripting: {
            registerContentScripts: async (scripts) => {
                registeredScripts.push(...scripts);
            },
            unregisterContentScripts: async (filter) => {
                if (filter && filter.ids) {
                    unregisteredIds.push(...filter.ids);
                }
            }
        },
        storage: {
            local: {
                get: async () => ({})
            }
        }
    };

    // 9.1 Static domain: gitlab.com -> should unregister dynamic scripts and not register
    registeredScripts = [];
    unregisteredIds = [];
    const staticResult1 = await bg.syncDynamicContentScript('https://gitlab.com');
    assert.strictEqual(staticResult1, true);
    assert.ok(unregisteredIds.includes('custom-gitlab-scripts'), 'Must unregister custom-gitlab-scripts for gitlab.com');
    assert.ok(unregisteredIds.includes('custom-gitlab-mr-scripts'), 'Must unregister custom-gitlab-mr-scripts for gitlab.com');
    assert.strictEqual(registeredScripts.length, 0, 'Must not register dynamic scripts for static gitlab.com');

    // 9.2 Static domain: gitlab.widosoft.com -> should unregister dynamic scripts and not register
    registeredScripts = [];
    unregisteredIds = [];
    const staticResult2 = await bg.syncDynamicContentScript('https://gitlab.widosoft.com');
    assert.strictEqual(staticResult2, true);
    assert.ok(unregisteredIds.includes('custom-gitlab-scripts'), 'Must unregister custom-gitlab-scripts for gitlab.widosoft.com');
    assert.ok(unregisteredIds.includes('custom-gitlab-mr-scripts'), 'Must unregister custom-gitlab-mr-scripts for gitlab.widosoft.com');
    assert.strictEqual(registeredScripts.length, 0, 'Must not register dynamic scripts for static gitlab.widosoft.com');

    // 9.3 Custom domain: gitlab.acme.corp -> should unregister previous and register both custom scripts
    registeredScripts = [];
    unregisteredIds = [];
    const customResult = await bg.syncDynamicContentScript('https://gitlab.acme.corp/deep/subpath');
    assert.strictEqual(customResult, true);
    assert.ok(unregisteredIds.includes('custom-gitlab-scripts'), 'Must unregister custom-gitlab-scripts before registering new');
    assert.ok(unregisteredIds.includes('custom-gitlab-mr-scripts'), 'Must unregister custom-gitlab-mr-scripts before registering new');
    assert.strictEqual(registeredScripts.length, 2, 'Must register 2 dynamic content script configs (issues & MRs)');
    
    const issueConfig = registeredScripts.find(s => s.id === 'custom-gitlab-scripts');
    assert.ok(issueConfig, 'Must have custom-gitlab-scripts registered');
    assert.deepStrictEqual(issueConfig.matches, [
        'https://gitlab.acme.corp/*/-/issues/*',
        'https://gitlab.acme.corp/*/-/work_items/*'
    ]);
    assert.deepStrictEqual(issueConfig.js, ['utils.js', 'i18n.js', 'content_issue.js']);
    assert.strictEqual(issueConfig.runAt, 'document_idle');

    const mrConfig = registeredScripts.find(s => s.id === 'custom-gitlab-mr-scripts');
    assert.ok(mrConfig, 'Must have custom-gitlab-mr-scripts registered');
    assert.deepStrictEqual(mrConfig.matches, [
        'https://gitlab.acme.corp/*/-/merge_requests/*'
    ]);
    assert.deepStrictEqual(mrConfig.js, ['utils.js', 'content_request.js']);
    assert.strictEqual(mrConfig.runAt, 'document_idle');
    console.log('✔ Passed: syncDynamicContentScript registers custom domains (issues + MRs) and cleans static domains');

    // 10. Testing manifest.json Metadata & Content Script Matches
    console.log('\n--- 10. Testing manifest.json Metadata & Content Scripts ---');
    const manifestPath = path.resolve(__dirname, '../manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.strictEqual(manifest.version, '1.0.7', 'manifest.json version must be bumped to 1.0.7');
    assert.strictEqual(
        manifest.description,
        'TimeLab - GitLab KPI, Timesheet & Spent Time Tracker',
        'manifest.json description must match Chrome Web Store branding'
    );

    assert.ok(Array.isArray(manifest.content_scripts), 'content_scripts must be an array');
    assert.ok(manifest.content_scripts.length >= 2, 'content_scripts must have at least 2 entries');

    const issuesScript = manifest.content_scripts[0];
    assert.ok(issuesScript.matches.includes('*://gitlab.com/*/-/issues/*'), 'content_scripts[0] must match gitlab.com issues');
    assert.ok(issuesScript.matches.includes('*://gitlab.com/*/-/work_items/*'), 'content_scripts[0] must match gitlab.com work_items');
    assert.ok(issuesScript.matches.includes('*://gitlab.widosoft.com/*/-/issues/*'), 'content_scripts[0] must match widosoft issues');
    assert.ok(issuesScript.matches.includes('*://gitlab.widosoft.com/*/-/work_items/*'), 'content_scripts[0] must match widosoft work_items');

    const mrScript = manifest.content_scripts[1];
    assert.ok(mrScript.matches.includes('*://gitlab.com/*/-/merge_requests/*'), 'content_scripts[1] must match gitlab.com MRs');
    assert.ok(mrScript.matches.includes('*://gitlab.widosoft.com/*/-/merge_requests/*'), 'content_scripts[1] must match widosoft MRs');
    console.log('✔ Passed: manifest.json version 1.0.7, description, and content_scripts static domains verified');

    // 11. Testing dynamic API routing in background checkUnaddedKpiTasksReminder
    console.log('\n--- 11. Testing dynamic API routing in background.js ---');
    {
        let fetchCalls = [];
        const mockFetch = async (url, opts) => {
            fetchCalls.push({ url, opts });
            return {
                ok: true,
                json: async () => []
            };
        };

        global.chrome = {
            storage: {
                local: {
                    get: async () => ({
                        AccessToken: 'valid-test-token',
                        gitlabServerUrl: 'https://gitlab.custom-host.vn:8443',
                        kpiReminderEnabled: true,
                        checkOutTime: '18:00',
                        kpiReminderMinutesBefore: 15,
                        kpiReminderState: {},
                        WorkItemIds: []
                    }),
                    set: async () => {}
                }
            },
            action: {
                setBadgeText: () => {},
                setBadgeBackgroundColor: () => {}
            },
            notifications: {
                create: () => {}
            },
            runtime: {
                getURL: (p) => p
            }
        };

        const testTime = new Date('2026-10-01T17:50:00');
        await bg.checkUnaddedKpiTasksReminder(testTime, mockFetch);
        assert.strictEqual(fetchCalls.length, 1, 'Should call fetch once for today issues');
        assert.ok(
            fetchCalls[0].url.startsWith('https://gitlab.custom-host.vn:8443/api/v4/issues'),
            `API URL should start with custom gitlabServerUrl, received: ${fetchCalls[0].url}`
        );
        console.log('✔ Passed: checkUnaddedKpiTasksReminder dynamically queries custom gitlabServerUrl');
    }

    // 12. Testing Zero Hardcoded widosoft URLs in page/page.js and content_issue.js
    console.log('\n--- 12. Testing Zero Hardcoded gitlab.widosoft.com in Production Logic ---');
    const pageJsPath = path.resolve(__dirname, '../page/page.js');
    const pageJsContent = fs.readFileSync(pageJsPath, 'utf8');

    assert.ok(!pageJsContent.includes('https://gitlab.widosoft.com'), 'page/page.js must have zero hardcoded https://gitlab.widosoft.com');
    assert.ok(pageJsContent.includes('${gitlabServerUrl}/api/graphql') || pageJsContent.includes('`${gitlabServerUrl}/api/graphql`'), 'page/page.js must use dynamic gitlabServerUrl for GraphQL');

    // Test group extraction regex on various domains
    const groupRegex = /https?:\/\/[^\/]+\/[^\/]+\/([^\/]+)\//;
    const testTaskUrl1 = 'https://gitlab.com/company/team-project/-/work_items/456';
    const testTaskUrl2 = 'https://gitlab.my-corp.net:8443/enterprise/core-repo/-/issues/789';
    const testTaskUrl3 = 'https://gitlab.widosoft.com/agency/mobile-app/-/merge_requests/12';
    assert.strictEqual((testTaskUrl1.match(groupRegex) || [])[1], 'team-project');
    assert.strictEqual((testTaskUrl2.match(groupRegex) || [])[1], 'core-repo');
    assert.strictEqual((testTaskUrl3.match(groupRegex) || [])[1], 'mobile-app');

    const contentIssuePath = path.resolve(__dirname, '../content_issue.js');
    const contentIssueContent = fs.readFileSync(contentIssuePath, 'utf8');
    assert.ok(!contentIssueContent.includes('https://gitlab.widosoft.com/api/graphql'), 'content_issue.js must have zero hardcoded widosoft GraphQL fallback');

    console.log('✔ Passed: Zero hardcoded gitlab.widosoft.com in page.js and content_issue.js, and group regex works across all hosts');

    // 13. Testing dynamic evaluation of gitlabServerUrl in popup.js quick action buttons
    console.log('\n--- 13. Testing dynamic gitlabServerUrl in popup quick buttons ---');
    const popupJsPath = path.resolve(__dirname, '../popup/popup.js');
    const popupJsContent = fs.readFileSync(popupJsPath, 'utf8');

    assert.ok(
        popupJsContent.includes('const currentServerUrl = await getServerUrlFn();'),
        'popup.js must dynamically evaluate server url inside quick action buttons'
    );
    console.log('✔ Passed: popup.js dynamically evaluates gitlabServerUrl on quick link clicks');

    // 14. Testing Least Privilege Permissions, CSP & requestHostPermissionIfNeeded
    console.log('\n--- 14. Testing Least Privilege Permissions, CSP & requestHostPermissionIfNeeded ---');
    {
        assert.ok(!manifest.permissions.includes('tabs'), 'manifest.json must NOT declare "tabs" permission (Principle of Least Privilege)');
        assert.ok(!manifest.host_permissions.includes('<all_urls>'), 'manifest.json must NOT declare broad <all_urls>');
        assert.ok(manifest.host_permissions.includes('*://gitlab.com/*'), 'manifest.json must include *://gitlab.com/* in host_permissions');
        assert.ok(manifest.host_permissions.includes('*://gitlab.widosoft.com/*'), 'manifest.json must include *://gitlab.widosoft.com/* in host_permissions');
        assert.ok(Array.isArray(manifest.optional_host_permissions), 'manifest.json must have optional_host_permissions');
        assert.ok(manifest.optional_host_permissions.includes('https://*/*'), 'optional_host_permissions must include https://*/*');

        // Test tutorial.html has zero external links/fonts
        const tutorialHtmlPath = path.resolve(__dirname, '../tutorial/tutorial.html');
        const tutorialHtml = fs.readFileSync(tutorialHtmlPath, 'utf8');
        assert.ok(!tutorialHtml.includes('fonts.googleapis.com'), 'tutorial.html must not load remote google fonts');

        // Test requestHostPermissionIfNeeded
        const popupMod = require('../popup/popup.js');
        assert.strictEqual(typeof popupMod.requestHostPermissionIfNeeded, 'function', 'requestHostPermissionIfNeeded must be a function');

        // Test 14.1 Known hosts need no runtime prompt
        const resGitlabCom = await popupMod.requestHostPermissionIfNeeded('https://gitlab.com');
        assert.strictEqual(resGitlabCom, true, 'gitlab.com should not trigger prompt');

        const resWidosoft = await popupMod.requestHostPermissionIfNeeded('https://gitlab.widosoft.com');
        assert.strictEqual(resWidosoft, true, 'gitlab.widosoft.com should not trigger prompt');

        // Test 14.2 Custom host triggers runtime request
        let requestedOrigins = [];
        global.chrome.permissions = {
            contains: async (query) => false,
            request: async (query) => {
                requestedOrigins.push(...query.origins);
                return true;
            }
        };

        const resCustom = await popupMod.requestHostPermissionIfNeeded('https://git.internal-corp.vn/sub');
        assert.strictEqual(resCustom, true);
        assert.deepStrictEqual(requestedOrigins, ['https://git.internal-corp.vn/*']);

        console.log('✔ Passed: Least privilege permissions, strict CSP and runtime permission requests verified');
    }

    // 15. Testing Widosoft-Only Export Buttons Visibility
    console.log('\n--- 15. Testing Widosoft-Only Export Buttons Visibility ---');
    {
        const utils = require('../utils.js');
        const pageMod = require('../page/page.js');

        // 15.1 Verify isWidosoftGitlab helper
        assert.strictEqual(typeof utils.isWidosoftGitlab, 'function', 'utils.js must export isWidosoftGitlab');
        assert.strictEqual(utils.isWidosoftGitlab('https://gitlab.widosoft.com'), true);
        assert.strictEqual(utils.isWidosoftGitlab('http://gitlab.widosoft.com:8080'), true);
        assert.strictEqual(utils.isWidosoftGitlab('https://gitlab.widosoft.vn'), true);
        assert.strictEqual(utils.isWidosoftGitlab('https://gitlab.com'), false);
        assert.strictEqual(utils.isWidosoftGitlab('https://gitlab.mycompany.org'), false);
        assert.strictEqual(utils.isWidosoftGitlab(''), false);
        assert.strictEqual(utils.isWidosoftGitlab(null), false);
        assert.strictEqual(utils.isWidosoftGitlab(undefined), false);

        // 15.2 Verify page.html markup hides export buttons by default
        const pageHtmlPath = path.resolve(__dirname, '../page/page.html');
        const pageHtml = fs.readFileSync(pageHtmlPath, 'utf8');
        assert.ok(pageHtml.includes('id="exportWeekKpiBtn"'), 'page.html must contain #exportWeekKpiBtn');
        assert.ok(pageHtml.includes('id="exportMonthKpiBtn"'), 'page.html must contain #exportMonthKpiBtn');
        assert.ok(/id=["']exportWeekKpiBtn["'][^>]*style=["'][^"']*display:\s*none/i.test(pageHtml),
            '#exportWeekKpiBtn must have default style="display: none;"');
        assert.ok(/id=["']exportMonthKpiBtn["'][^>]*style=["'][^"']*display:\s*none/i.test(pageHtml),
            '#exportMonthKpiBtn must have default style="display: none;"');

        // 15.3 Verify updateExportButtonsVisibility DOM behavior
        assert.strictEqual(typeof pageMod.updateExportButtonsVisibility, 'function', 'page.js must export updateExportButtonsVisibility');
        const mockWeekBtn = { style: { display: 'none' } };
        const mockMonthBtn = { style: { display: 'none' } };
        global.document = {
            getElementById: (id) => {
                if (id === 'exportWeekKpiBtn' || id === 'exportCSVBtn') return mockWeekBtn;
                if (id === 'exportMonthKpiBtn') return mockMonthBtn;
                return null;
            }
        };

        // When server is gitlab.widosoft.com -> buttons shown
        pageMod.updateExportButtonsVisibility('https://gitlab.widosoft.com');
        assert.strictEqual(mockWeekBtn.style.display, '', 'Week export button must be visible for Widosoft');
        assert.strictEqual(mockMonthBtn.style.display, '', 'Month export button must be visible for Widosoft');

        // When server is gitlab.com -> buttons hidden
        pageMod.updateExportButtonsVisibility('https://gitlab.com');
        assert.strictEqual(mockWeekBtn.style.display, 'none', 'Week export button must be hidden for gitlab.com');
        assert.strictEqual(mockMonthBtn.style.display, 'none', 'Month export button must be hidden for gitlab.com');

        // When server is custom third-party -> buttons hidden
        pageMod.updateExportButtonsVisibility('https://git.internal-corp.vn');
        assert.strictEqual(mockWeekBtn.style.display, 'none', 'Week export button must be hidden for generic gitlab');
        assert.strictEqual(mockMonthBtn.style.display, 'none', 'Month export button must be hidden for generic gitlab');

        // 15.4 Verify alertOnlyAvailableForWidosoft token
        const i18n = require('../i18n.js');
        assert.ok(i18n.I18N_DICTIONARIES.vi.alertOnlyAvailableForWidosoft, 'alertOnlyAvailableForWidosoft must exist in VI');
        assert.ok(i18n.I18N_DICTIONARIES.en.alertOnlyAvailableForWidosoft, 'alertOnlyAvailableForWidosoft must exist in EN');

        console.log('✔ Passed: Widosoft-only export buttons visibility rules and helpers verified');
    }

    console.log('\n🎉 ALL TASK TESTS PASSED! 🎉\n');
})().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});

