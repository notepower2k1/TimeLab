// Optional real-Chrome integration check. Node 22+, Chrome with Extensions CDP support.
// Uses an isolated temporary browser profile and an in-worker mock of the GitLab API.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
process.env.TZ = 'Asia/Ho_Chi_Minh';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'timelab-browser-test-'));
const root = path.resolve(__dirname, '..');
const apiNow = new Date();
const previous = new Date(apiNow.getFullYear(), apiNow.getMonth() - 1, 15, 12);
const isoDay = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = isoDay(apiNow), month = today.slice(0, 7), previousMonth = isoDay(previous).slice(0, 7);
const fixture = {
    user: { id: 7, username: 'sync-smoke', name: 'Sync Smoke', avatar_url: '', web_url: 'https://gitlab.widosoft.com/sync-smoke' },
    issue: { id: 1042, iid: 42, issue_type: 'task', title: 'Automatic sync smoke task', state: 'closed',
        created_at: apiNow.toISOString(), updated_at: apiNow.toISOString(), web_url: 'https://gitlab.widosoft.com/team/project/-/work_items/42' },
    timelogs: [{ id: '1', spentAt: previous.toISOString(), timeSpent: 36000 }, { id: '2', spentAt: apiNow.toISOString(), timeSpent: 115200 }],
    total: 151200, due: today
};
function mockFetch(raw, options = {}) {
    const url = new URL(raw), data = globalThis.__syncFixture;
    globalThis.__syncCalls.push(url.pathname);
    let result;
    if (url.pathname === '/api/v4/user') result = data.user;
    else if (url.pathname === '/api/v4/issues') {
        const p = url.searchParams, item = data.issue;
        let include = p.get('issue_type') === item.issue_type && p.get('page') === '1';
        if (p.get('state') === 'opened' && item.state !== 'opened') include = false;
        for (const field of ['created', 'updated']) {
            if (p.has(field + '_after') && Date.parse(item[field + '_at']) < Date.parse(p.get(field + '_after'))) include = false;
            if (p.has(field + '_before') && Date.parse(item[field + '_at']) > Date.parse(p.get(field + '_before'))) include = false;
        }
        result = include ? [item] : [];
    } else if (url.pathname.startsWith('/api/v4/projects/')) {
        result = url.searchParams.getAll('iids[]').includes('42') ? [{ ...data.issue, time_stats: { total_time_spent: data.total, time_estimate: 144000 } }] : [];
    } else if (url.pathname === '/api/graphql') {
        if (data.failDetails) return Promise.resolve(new Response('{}', { status: 401 }));
        const query = JSON.parse(options.body);
        result = query.operationName === 'workItemNotesByIid'
            ? { data: { workspace: { workItem: { widgets: [{ type: 'NOTES', discussions: { nodes: [], pageInfo: { hasNextPage: false } } }] } } } }
            : { data: { workspace: { workItem: {
                id: 'gid://gitlab/WorkItem/1042', iid: '42', workItemType: { name: 'Task' }, title: data.issue.title, state: 'closed',
                createdAt: data.issue.created_at, closedAt: data.issue.updated_at, webUrl: data.issue.web_url,
                widgets: [{ type: 'START_AND_DUE_DATE', startDate: data.issue.created_at.slice(0, 10), dueDate: data.due },
                    { type: 'TIME_TRACKING', timeEstimate: 144000, totalTimeSpent: data.total,
                        timelogs: { nodes: data.timelogs, pageInfo: { hasNextPage: false } } }]
            } } } };
        if (query.operationName === 'namespaceWorkItem') result.data.workspace.workItem.widgets.push({ type: 'NOTES', discussions: { nodes: [], pageInfo: { hasNextPage: false } } });
    } else throw new Error('Unexpected GitLab request: ' + url.pathname);
    return Promise.resolve(new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } }));
}
async function main() {
    const child = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
        '--no-first-run', '--enable-unsafe-extension-debugging', '--remote-debugging-port=0', '--user-data-dir=' + profile], { detached: true });
    let ws, closeBrowser = async () => {};
    try {
        const endpoint = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Chrome did not start')), 10000);
            child.once('error', reject);
            child.stderr.on('data', chunk => {
                const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);
                if (match) { clearTimeout(timeout); resolve(match[1]); }
            });
        });
        ws = new WebSocket(endpoint);
        await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
        let counter = 0;
        const pending = new Map(), sessions = new Map(), errors = [], workerSessions = [];
        const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
            const id = ++counter;
            const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 10000);
            timer.unref();
            pending.set(id, { resolve, reject, timer, method });
            ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        });
        closeBrowser = () => send('Browser.close').catch(() => {});
        ws.onmessage = async event => {
            const message = JSON.parse(event.data);
            if (message.id) {
                const request = pending.get(message.id);
                if (!request) return;
                pending.delete(message.id); clearTimeout(request.timer);
                return message.error ? request.reject(new Error(request.method + ': ' + JSON.stringify(message.error))) : request.resolve(message.result);
            }
            if (message.method === 'Runtime.exceptionThrown') {
                errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
            }
            if (message.method === 'Target.attachedToTarget') {
                const { targetInfo, sessionId } = message.params;
                sessions.set(targetInfo.targetId, sessionId);
                try {
                    await send('Runtime.enable', {}, sessionId);
                    if (targetInfo.type === 'service_worker') {
                        workerSessions.push({ sessionId, url: targetInfo.url });
                        await send('Runtime.evaluate', { expression: `globalThis.__syncFixture = ${JSON.stringify(fixture)}; globalThis.__syncCalls = []; globalThis.fetch = ${mockFetch.toString()};` }, sessionId);
                    }
                    await send('Runtime.runIfWaitingForDebugger', {}, sessionId);
                } catch (error) { errors.push(error.message); }
            }
        };
        const evaluate = async (session, expression) => {
            const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, session);
            if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
            return response.result?.value;
        };
        const wait = async condition => {
            const deadline = Date.now() + 12000;
            while (Date.now() < deadline) {
                const result = await condition(); if (result) return result;
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            throw new Error('Browser condition timed out. ' + errors.join('\n'));
        };
        await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
        const { id } = await send('Extensions.loadUnpacked', { path: root });
        const base = `chrome-extension://${id}`;
        const worker = await wait(() => workerSessions.find(worker => worker.url.startsWith(base + '/'))?.sessionId);
        await wait(() => evaluate(worker, `typeof chrome !== 'undefined' && !!chrome.storage?.local && !!globalThis.KpiSync`)).catch(async error => {
            console.error(await evaluate(worker, `({ url: location.href, chromeKeys: Object.keys(globalThis.chrome || {}), hasSync: !!globalThis.KpiSync })`));
            throw error;
        });
        await evaluate(worker, `(async () => { await syncReady; return true; })()`);
        fixture.user.avatar_url = base + '/icon128.png';
        await evaluate(worker, `globalThis.__syncFixture.user.avatar_url = ${JSON.stringify(fixture.user.avatar_url)}`);
        await evaluate(worker, 'chrome.storage.local.set(' + JSON.stringify({
            AccessToken: 'browser-test-token', UserProfile: fixture.user, gitlabServerUrl: 'https://gitlab.widosoft.com', appLanguage: 'en',
            checkInTime: '00:00', checkOutTime: '23:59', KpiSyncSettings: { enabled: false, intervalMinutes: 15 },
            KpiLeaveDays: { [today]: { value: 1, type: 'full', overtime: true } }
        }) + ')');
        const popup = await send('Target.createTarget', { url: base + '/popup/popup.html' });
        const popupSession = await wait(() => sessions.get(popup.targetId));
        await wait(() => evaluate(popupSession, `document.getElementById('kpiSyncStatus')?.dataset.mounted === 'true'`));
        const beforeCalls = await evaluate(worker, `__syncCalls.filter(path => path === '/api/graphql').length`);
        await evaluate(popupSession, `document.querySelector('[data-tab="tools-tab"]').click(); document.getElementById('syncNowBtn').click();`);
        await wait(() => evaluate(popupSession, `document.getElementById('month-spent-time')?.textContent === '32.00h'`));
        assert((await evaluate(popupSession, `document.getElementById('kpiSyncStatus').textContent`)).includes('Last full re-sync:'));
        assert.strictEqual(await evaluate(worker, `__syncCalls.filter(path => path === '/api/graphql').length`) - beforeCalls, 1, 'Chrome full re-sync must use one detail request per Work Item');
        assert((await evaluate(popupSession, `document.getElementById('syncNowBtn').textContent`)).includes('Re-sync all'));
        await evaluate(popupSession, `document.getElementById('kpiAutoSyncEnabled').checked = true; document.getElementById('kpiSyncInterval').value = '5'; document.getElementById('saveKpiSyncBtn').click();`);
        await wait(() => evaluate(worker, `(async () => (await chrome.alarms.get('kpiAutoSync'))?.periodInMinutes === 5)()`));
        console.log('✔ Passed: Real Chrome popup, manual sync, live monthly stats, and settings/alarm updates');

        const dashboard = await send('Target.createTarget', { url: base + '/page/page.html' });
        const pageSession = await wait(() => sessions.get(dashboard.targetId));
        await wait(() => evaluate(pageSession, `document.querySelectorAll('#kpiContainer tbody tr').length === 1`));
        const row = await evaluate(pageSession, `Array.from(document.querySelector('#kpiContainer tbody tr').cells).map(cell => cell.textContent)`);
        assert.strictEqual(row.length, 14); assert.strictEqual(row[7], '32.00'); assert.strictEqual(row[8], '42.00'); assert.strictEqual(row[9], '+2.00h');
        assert(await evaluate(pageSession, `!!document.querySelector('[data-date="${today}"] .timesheet-overtime-badge')`));
        assert(!(await evaluate(pageSession, `!!document.getElementById('getDetailBtn')`)));
        await evaluate(pageSession, `document.getElementById('monthSelect').value = ${JSON.stringify(previousMonth)}; document.getElementById('monthSelect').dispatchEvent(new Event('change'));`);
        await wait(() => evaluate(pageSession, `document.querySelector('#kpiContainer tbody tr')?.cells[7].textContent === '10.00'`));
        await evaluate(worker, `__syncFixture.total += 3600; __syncFixture.timelogs[1].timeSpent += 3600;`);
        await evaluate(popupSession, `document.getElementById('syncNowBtn').click()`);
        await wait(() => evaluate(pageSession, `document.querySelector('#kpiContainer tbody tr')?.cells[8].textContent === '43.00'`));
        assert.strictEqual(await evaluate(pageSession, `document.getElementById('monthSelect').value`), previousMonth);
        console.log('✔ Passed: Real Chrome dashboard updates period/lifetime hours and preserves the selected month');

        await evaluate(pageSession, `globalThis.__anchorClick = HTMLAnchorElement.prototype.click;
            globalThis.__createObjectURL = URL.createObjectURL;
            HTMLAnchorElement.prototype.click = function () { globalThis.__exportFilename = this.download; };
            URL.createObjectURL = function (blob) { globalThis.__exportBlob = blob; return __createObjectURL.call(URL, blob); };
            window.alert = message => { globalThis.__exportAlert = message; };`);
        await evaluate(worker, `__syncFixture.total += 3600; __syncFixture.timelogs[1].timeSpent += 3600;`);
        const beforeExportCalls = await evaluate(worker, `__syncCalls.filter(path => path === '/api/graphql').length`);
        await evaluate(pageSession, `document.getElementById('exportMonthKpiBtn').click()`);
        await wait(() => evaluate(pageSession, `!!globalThis.__exportFilename`));
        assert.strictEqual(await evaluate(worker, `__syncCalls.filter(path => path === '/api/graphql').length`) - beforeExportCalls, 1);
        const exported = await evaluate(pageSession, `(async () => {
            const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await __exportBlob.arrayBuffer());
            const sheet = wb.getWorksheet('Báo cáo công việc');
            let taskRow; sheet.eachRow(row => { if (row.getCell('B').value?.hyperlink) taskRow = row; });
            return { spent: taskRow.getCell('G').value, lifetime: taskRow.getCell('H').value, filename: __exportFilename };
        })()`);
        assert.strictEqual(exported.spent, 10);
        assert.strictEqual(exported.lifetime, 44, 'Excel must use the data fetched by its own re-sync');
        assert(exported.filename.includes(previousMonth.split('-').reverse().join('-')));
        await wait(() => evaluate(pageSession, `!document.getElementById('exportMonthKpiBtn').disabled`));
        console.log('✔ Passed: Real Chrome Excel export re-syncs the selected month and uses fresh data');

        await evaluate(worker, `__syncFixture.failDetails = true`);
        await evaluate(pageSession, `globalThis.__exportFilename = ''; globalThis.__exportAlert = ''; document.getElementById('exportMonthKpiBtn').click()`);
        await wait(() => evaluate(pageSession, `!!globalThis.__exportAlert && !document.getElementById('exportMonthKpiBtn').disabled`));
        assert.strictEqual(await evaluate(pageSession, `__exportFilename`), '');
        assert((await evaluate(pageSession, `__exportAlert`)).includes('401'));
        await evaluate(worker, `__syncFixture.failDetails = false`);
        await evaluate(pageSession, `HTMLAnchorElement.prototype.click = __anchorClick; URL.createObjectURL = __createObjectURL;`);
        console.log('✔ Passed: Real Chrome blocks Excel export when re-sync fails and restores the export button');

        await evaluate(pageSession, `window.confirm = () => true; document.querySelector('#kpiContainer .btn-delete-row').click();`);
        await wait(() => evaluate(worker, `(async () => (await chrome.storage.local.get('KpiInfo')).KpiInfo.length === 0)()`));
        await evaluate(popupSession, `document.getElementById('syncNowBtn').click()`);
        await wait(() => evaluate(popupSession, `!document.getElementById('syncNowBtn').disabled`));
        assert.strictEqual(await evaluate(worker, `(async () => (await chrome.storage.local.get('KpiInfo')).KpiInfo.length)()`), 0);
        assert.deepStrictEqual(errors, [], 'Chrome must not report uncaught JavaScript exceptions');
        console.log('✔ Passed: Real Chrome manual removal stays excluded across sync, without runtime exceptions');
        await send('Browser.close');
    } finally {
        await closeBrowser(); ws?.close();
        try { process.kill(-child.pid, 'SIGTERM'); } catch {}
        child.kill();
        await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve));
        await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
