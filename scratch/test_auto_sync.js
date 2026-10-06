const assert = require('assert');
process.env.TZ = 'Asia/Ho_Chi_Minh';
const sync = require('../sync.js');
const utils = require('../utils.js');
const server = 'https://gitlab.example.test';
const source = `${server}|7`;
const date = (day = 6, hour = 9) => new Date(2026, 9, day, hour, 0, 0);
function memory(initial = {}) {
    let values = structuredClone(initial);
    return {
        get: async keys => structuredClone(keys === null ? values : Object.fromEntries(keys.map(key => [key, values[key]]))),
        set: async update => { values = { ...values, ...structuredClone(update) }; }
    };
}
const defaults = () => ({ AccessToken: 'test-token', UserProfile: { id: 7 }, gitlabServerUrl: server,
    checkInTime: '08:30', checkOutTime: '18:00', WorkItemIds: [], MergeItemIds: [], KpiInfo: [] });
const issue = (iid, extra = {}) => ({ iid, id: 1000 + iid, web_url: `${server}/team/project/-/work_items/${iid}`,
    title: `Task ${iid}`, created_at: '2026-10-06T01:00:00Z', updated_at: '2026-10-06T01:30:00Z', state: 'opened', issue_type: 'task', ...extra });
const detail = item => ({ id: item.id, taskUrl: item.href, addedAt: item.createAt, createdAt: item.createAt,
    state: 'opened', estimate: 40, spent: 42, type: 'Kế hoạch', startDate: '01/10/2026', dueDate: '31/10/2026',
    timelogs: [{ spentAt: '2026-09-15', timeSpentHours: 10 }, { spentAt: '2026-10-05', timeSpentHours: 32 }] });
function discovery(records, onRequest = () => {}) {
    return async (raw, options) => {
        const url = new URL(raw); onRequest(url, options);
        if (url.pathname === '/api/v4/user') return { ok: true, json: async () => ({ id: 7, username: 'me' }) };
        const metadata = url.pathname.startsWith('/api/v4/projects/');
        assert(metadata || url.pathname === '/api/v4/issues');
        const p = url.searchParams;
        assert.strictEqual(p.get('scope'), metadata ? 'all' : 'created_by_me');
        const rows = records.filter(row => {
            if (metadata && !p.getAll('iids[]').includes(String(row.iid))) return false;
            if (!metadata && p.get('issue_type') !== row.issue_type) return false;
            if (p.get('state') === 'opened' && row.state !== 'opened') return false;
            for (const field of ['created', 'updated']) {
                const value = Date.parse(row[field + '_at']);
                if (p.has(field + '_after') && value < Date.parse(p.get(field + '_after'))) return false;
                if (p.has(field + '_before') && value > Date.parse(p.get(field + '_before'))) return false;
            }
            return true;
        });
        const offset = (Number(p.get('page')) - 1) * 100;
        return { ok: true, json: async () => rows.slice(offset, offset + 100) };
    };
}
async function run() {
    assert(sync.inHours(defaults(), date()));
    assert(!sync.inHours(defaults(), date(6, 20)));
    assert(sync.inHours({ checkInTime: '22:00', checkOutTime: '06:00' }, date(6, 23)));
    assert(sync.inHours({ checkInTime: '22:00', checkOutTime: '06:00' }, date(6, 2)));
    assert(!sync.inHours({ checkInTime: '22:00', checkOutTime: '06:00' }, date(6, 12)));
    assert(!sync.inHours({ checkInTime: '24:00', checkOutTime: '18:00' }, date()));
    assert(sync.inSyncHours(defaults(), date(2)), 'Friday is an automatic sync day');
    assert(!sync.inSyncHours(defaults(), date(3)), 'Saturday must not run automatic sync');
    assert(!sync.inSyncHours(defaults(), date(4)), 'Sunday must not run automatic sync');
    let weekendRequests = 0;
    const weekend = sync.createRunner({ storage: memory(defaults()), now: () => date(3),
        fetchFn: discovery([issue(1)], () => weekendRequests++), loadDetails: async item => detail(item) });
    assert.strictEqual((await weekend.run()).status, 'paused');
    assert.strictEqual(weekendRequests, 0, 'Paused automatic sync must make no API requests');
    assert.strictEqual((await weekend.run({ force: true })).status, 'success', 'Manual Re-sync works on weekends');
    assert.strictEqual(sync.settingsOf({}).intervalMinutes, 15);
    assert.strictEqual(sync.settingsOf({ KpiSyncSettings: { intervalMinutes: 2 } }).intervalMinutes, 15);
    assert.strictEqual(sync.itemKey(issue(1)), sync.itemKey({ href: `${server}/team/project/-/issues/1?x=1` }));
    assert.notStrictEqual(sync.itemKey(issue(1)), sync.itemKey({ href: `${server}/other/project/-/issues/1` }));
    console.log('✔ Passed: Sync settings, local and overnight hours, project-scoped identity');

    // Historical data is filled on first use; inactive older closed tasks remain out of scope.
    const records = [issue(1, { state: 'closed' }), issue(2, { created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z', state: 'closed' }),
        issue(9, { issue_type: 'issue' })];
    const storage = memory({ ...defaults(), WorkItemIds: [{ id: '7', href: issue(7).web_url, createAt: '2026-09-01T00:00:00Z' }], KpiLeaveDays: { '2026-10-05': { value: 1, type: 'full', overtime: true } } });
    const runner = sync.createRunner({ storage, fetchFn: discovery(records), now: () => date(), loadDetails: async item => detail(item) });
    const a = runner.run(), b = runner.run();
    assert.strictEqual(a, b, 'Overlapping requests share the same run');
    await a;
    const light = await storage.get(null);
    assert.strictEqual(light.KpiInfo.length, 2, 'Routine sync fills missing data even for older manually tracked tasks');
    await runner.run({ force: true });
    const saved = await storage.get(null);
    assert.strictEqual(saved.WorkItemIds.length, 2);
    assert.strictEqual(saved.KpiInfo.length, 2);
    assert(saved.KpiInfo.some(row => row.id === '1'));
    assert(saved.KpiInfo.some(row => row.id === '7'), 'Older manually tracked tasks remain available');
    assert(!saved.KpiInfo.some(row => row.id === '2' || row.id === '9'), 'Older untracked tasks and parent issues are not discovered');
    assert.strictEqual(Number(saved.KpiStats.totalSpent), 64, 'Monthly stats use only October logs');
    assert.strictEqual(saved.KpiInfo[0].spent, 42);
    assert.strictEqual(saved.KpiLeaveDays['2026-10-05'].overtime, true);
    assert.strictEqual(sync.stateOf(saved).watermark, date().toISOString());
    await runner.run();
    assert.strictEqual((await storage.get(null)).WorkItemIds.length, 2);
    console.log('✔ Passed: Monthly Task-only discovery, manual history, coalescing, monthly stats and day flags');

    // Catch-up after closing the browser uses the prior watermark, including late-night work.
    let clock = date(5, 9), requestedLower;
    const catchStorage = memory({ ...defaults(), KpiSyncState: { sources: { [source]: { discoveryPolicy: 3, discoveryStart: '2026-09-30T17:00:00.000Z', watermark: date(2, 17).toISOString(), lastSuccessAt: date(2, 17).toISOString() } } } });
    const late = issue(3, { created_at: date(2, 22).toISOString(), updated_at: date(2, 22).toISOString(), state: 'closed' });
    await sync.createRunner({ storage: catchStorage, now: () => clock, fetchFn: discovery([late], url => {
        if (url.searchParams.has('created_after') && !url.searchParams.has('updated_after')) requestedLower = url.searchParams.get('created_after');
    }), loadDetails: async item => ({ ...detail(item), state: 'closed' }) }).run();
    assert.strictEqual(requestedLower, new Date(date(2, 17).getTime() - 300000).toISOString());
    assert.strictEqual((await catchStorage.get(null)).WorkItemIds.length, 1);
    assert.strictEqual((await catchStorage.get(null)).KpiInfo.length, 1, 'Monday routine sync fills Friday late-night work without Re-sync');
    assert(!sync.stateOf(await catchStorage.get(null)).lastFullSyncAt);
    console.log('✔ Passed: Next-day catch-up includes outside-hours tasks and keeps discovery overlap');

    const bootstrapRecords = [
        issue(31, { created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-15T00:00:00Z' }),
        issue(32, { created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-15T00:00:00Z', state: 'closed' }),
        issue(33, { created_at: '2026-09-01T00:00:00Z', updated_at: date(2).toISOString(), state: 'closed' })
    ];
    const bootstrap = memory(defaults());
    await sync.createRunner({ storage: bootstrap, now: () => date(), fetchFn: discovery(bootstrapRecords), loadDetails: async item => detail(item) }).run();
    assert.deepStrictEqual((await bootstrap.get(null)).WorkItemIds.map(item => item.id).sort(), ['31', '33'],
        'First sync includes older open tasks and older tasks updated this month, but not all closed history');

    const ignored = memory({ ...defaults(), WorkItemIds: [{ id: '31', href: issue(31).web_url, createAt: bootstrapRecords[0].created_at,
        trackingOrigin: 'auto', syncSource: source, autoSyncIgnored: true }],
        KpiInfo: [{ ...detail({ id: '31', href: issue(31).web_url, createAt: bootstrapRecords[0].created_at }), autoSyncIgnored: true, syncSource: source }],
        KpiSyncState: { sources: { [source]: { discoveryPolicy: 2, watermark: date(5).toISOString() } } } });
    await sync.createRunner({ storage: ignored, now: () => date(), fetchFn: discovery([bootstrapRecords[0]]), loadDetails: async item => detail(item) }).run();
    assert.strictEqual(sync.visibleItems(await ignored.get(null)).length, 1, 'Policy migration restores an older open task ignored by the previous month-only policy');
    console.log('✔ Passed: Initial carry-over discovery and migration preserve active older work');

    const septemberEnd = new Date(2026, 8, 30, 17).toISOString();
    const septemberLate = issue(38, { created_at: new Date(2026, 8, 30, 22).toISOString(),
        updated_at: new Date(2026, 8, 30, 23).toISOString(), state: 'closed' });
    const monthUpgrade = memory({ ...defaults(), KpiSyncState: { sources: { [source]: {
        discoveryPolicy: 2, discoveryStart: new Date(2026, 8, 1).toISOString(), watermark: septemberEnd, lastSuccessAt: septemberEnd
    } } } });
    await sync.createRunner({ storage: monthUpgrade, now: () => date(1), fetchFn: discovery([septemberLate]),
        loadDetails: async item => detail(item) }).run();
    assert.strictEqual((await monthUpgrade.get(null)).KpiInfo.length, 1, 'Upgrading across a month boundary preserves the old discovery cursor');
    console.log('✔ Passed: Policy upgrade keeps missed closed tasks from the previous month');

    const queuedItem = { id: '34', href: issue(34).web_url, createAt: date(2, 22).toISOString(), updatedAt: date(2, 22).toISOString(), syncSource: source };
    const overnightQueue = memory({ ...defaults(), WorkItemIds: [queuedItem], KpiSyncState: { sources: { [source]: {
        discoveryPolicy: 3, pending: [{ item: queuedItem, progress: { savedPage: true } }], upper: date(2, 23).toISOString()
    } } } });
    await sync.createRunner({ storage: overnightQueue, now: () => date(5), fetchFn: discovery([]), loadDetails: async (item, client) => detail(item) }).run({ continue: true });
    assert.strictEqual((await overnightQueue.get(null)).KpiInfo.length, 1, 'Automatic pending jobs survive the weekend');
    assert.strictEqual(sync.stateOf(await overnightQueue.get(null)).pending.length, 0);
    console.log('✔ Passed: Automatic queues resume across days and weekends');

    const prior = { ...detail({ id: '35', href: issue(35).web_url, createAt: '2026-09-01T00:00:00Z' }), state: 'closed',
        updatedAt: date(2, 16).toISOString(), syncedAt: date(2, 17).toISOString(), syncSource: source,
        timelogs: [{ spentAt: '2026-10-02', timeSpentHours: 2 }] };
    const changedOnSaturday = issue(35, { created_at: prior.createdAt, updated_at: date(3).toISOString(), state: 'closed' });
    const deltaStore = memory({ ...defaults(), WorkItemIds: [{ id: '35', href: prior.taskUrl, createAt: prior.createdAt, updatedAt: prior.updatedAt, syncSource: source }], KpiInfo: [prior],
        KpiSyncState: { sources: { [source]: { discoveryPolicy: 3, discoveryStart: '2026-09-30T17:00:00Z', watermark: date(2, 17).toISOString(), lastSuccessAt: date(2, 17).toISOString() } } } });
    let deltaClock = date(5), deltaReads = 0;
    const deltaRunner = sync.createRunner({ storage: deltaStore, now: () => deltaClock, fetchFn: discovery([changedOnSaturday]),
        loadDetails: async () => { deltaReads++; return { ...prior, spent: 3, timelogs: [{ spentAt: '2026-10-02', timeSpentHours: 3 }] }; } });
    await deltaRunner.run();
    assert.strictEqual(deltaReads, 1, 'Monday sync refreshes older closed tasks changed over the weekend');
    assert.strictEqual(Number((await deltaStore.get(null)).KpiStats.totalSpent), 3);
    deltaClock = date(6); await deltaRunner.run();
    assert.strictEqual(deltaReads, 1, 'An unchanged historical task is not read again');

    const previousReport = memory(defaults());
    const historical = [issue(36, { created_at: '2026-09-02T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', state: 'closed' }),
        issue(37, { created_at: '2026-08-01T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', state: 'closed' })];
    const reportRunner = sync.createRunner({ storage: previousReport, now: () => date(), fetchFn: discovery(historical), loadDetails: async item => detail(item) });
    await reportRunner.run();
    assert.strictEqual((await previousReport.get(null)).KpiInfo.length, 0, 'Routine first sync does not import unrelated closed history');
    await reportRunner.run({ force: true, month: '2026-09' });
    assert.deepStrictEqual((await previousReport.get(null)).WorkItemIds.map(item => item.id).sort(), ['36', '37'],
        'Export re-sync discovers the selected month and older work updated since that month');
    console.log('✔ Passed: Weekend changes are caught once, and export can discover a previous month');

    // Discovery is persisted page-by-page, including datasets larger than 100 tasks.
    const many = Array.from({ length: 101 }, (_, i) => issue(i + 1));
    const paged = memory(defaults());
    let elapsed = date();
    const pagedFetch = discovery(many, () => { elapsed = new Date(elapsed.getTime() + 10); });
    const interrupted = sync.createRunner({ storage: paged, fetchFn: pagedFetch, now: () => elapsed, budgetMs: 25, loadDetails: async item => detail(item) });
    assert.strictEqual((await interrupted.run()).status, 'pending');
    assert(sync.stateOf(await paged.get(null)).scan || sync.stateOf(await paged.get(null)).pending.length);
    const resumed = sync.createRunner({ storage: paged, fetchFn: pagedFetch, now: () => elapsed, loadDetails: async item => detail(item) });
    assert.strictEqual((await resumed.run()).status, 'success');
    assert.strictEqual((await paged.get(null)).KpiInfo.length, 101);
    console.log('✔ Passed: More than 100 tasks and worker restart resume without losing pages');

    const groupRecords = Array.from({ length: 205 }, (_, i) => issue(100 + i, {
        created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z', state: 'closed'
    }));
    const groupItems = groupRecords.map(row => ({ id: String(row.iid), href: row.web_url, createAt: row.created_at, updatedAt: row.updated_at, syncSource: source }));
    const groupStore = memory({ ...defaults(), WorkItemIds: groupItems,
        KpiInfo: groupItems.map(item => ({ ...detail(item), state: 'closed', updatedAt: item.updatedAt, syncedAt: date(5).toISOString(), syncSource: source })),
        KpiSyncState: { sources: { [source]: { discoveryPolicy: 3, carryoverScanned: true, watermark: date(5).toISOString() } } } });
    const checkedIds = new Set(); let groupReads = 0;
    await sync.createRunner({ storage: groupStore, now: () => date(), fetchFn: discovery(groupRecords, url => {
        if (url.pathname.startsWith('/api/v4/projects/')) {
            assert(url.searchParams.getAll('iids[]').length <= 100);
            url.searchParams.getAll('iids[]').forEach(id => checkedIds.add(id));
        }
    }), loadDetails: async item => { groupReads++; return detail(item); } }).run();
    assert.strictEqual(checkedIds.size, 205, 'Metadata batching checks every tracked task, not just the first 100');
    assert.strictEqual(groupReads, 0, 'Unchanged historical tasks need no GraphQL detail requests');
    console.log('✔ Passed: Metadata groups cover all 205 tracked tasks without unnecessary detail reads');

    // Keep old data on failures and do not advance the cursor past unfinished tasks.
    const old = detail({ id: '4', href: issue(4).web_url, createAt: issue(4).created_at });
    const failureStore = memory({ ...defaults(), WorkItemIds: [{ id: '4', href: old.taskUrl, createAt: old.createdAt }], KpiInfo: [old] });
    const failureRunner = sync.createRunner({ storage: failureStore, fetchFn: discovery([issue(4)]), now: () => date(), loadDetails: async () => { throw new Error('Temporary network error'); } });
    const failure = await failureRunner.run();
    assert.strictEqual(failure.status, 'error');
    const failed = await failureStore.get(null);
    assert.deepStrictEqual(failed.KpiInfo, [old]);
    assert(!sync.stateOf(failed).watermark);
    assert.strictEqual(sync.stateOf(failed).pending.length, 1);
    console.log('✔ Passed: Failed tasks retain cached data and unfinished cursor/queue');
    let failureClock = new Date(date().getTime() + 90000);
    const later = issue(44, { created_at: new Date(date().getTime() + 30000).toISOString(), updated_at: new Date(date().getTime() + 30000).toISOString() });
    const recovering = sync.createRunner({ storage: failureStore, now: () => failureClock, fetchFn: discovery([issue(4), later]),
        loadDetails: async item => { if (item.id === '4') throw new Error('Task remains inaccessible'); return detail(item); } });
    await recovering.run();
    assert((await failureStore.get(null)).KpiInfo.some(item => item.id === '44'), 'One permanently failing task must not block newly discovered tasks');
    assert.strictEqual((await failureStore.get(null)).KpiInfo.find(item => item.id === '4').spent, 42);
    console.log('✔ Passed: New tasks still sync while an older tracked task remains inaccessible');


    // A manual removal during a request must win over the stale response.
    const removedStore = memory(defaults());
    let release, entered;
    const fetching = new Promise(resolve => { entered = resolve; });
    const wait = new Promise(resolve => { release = resolve; });
    const removalRunner = sync.createRunner({ storage: removedStore, now: () => date(), fetchFn: discovery([issue(5)]),
        loadDetails: async item => { entered(); await wait; return detail(item); } });
    const active = removalRunner.run(); await fetching;
    await removalRunner.updateItems({ remove: [{ href: issue(5).web_url }] });
    release(); await active;
    assert.strictEqual((await removedStore.get(null)).KpiInfo.length, 0);
    await removalRunner.run({ force: true });
    assert.strictEqual((await removedStore.get(null)).WorkItemIds.length, 0);
    await removalRunner.updateItems({ add: [{ id: '5', href: issue(5).web_url, createAt: issue(5).created_at }] });
    await removalRunner.run({ force: true });
    assert.strictEqual((await removedStore.get(null)).KpiInfo.length, 1);
    console.log('✔ Passed: In-flight deletion, excluded-item rediscovery, and explicit re-add');

    // Source/token changes invalidate an in-flight result.
    const sourceStore = memory(defaults());
    let sourceRelease, sourceEntered;
    const sourceWait = new Promise(resolve => { sourceRelease = resolve; });
    const sourceFetching = new Promise(resolve => { sourceEntered = resolve; });
    const sourceRunner = sync.createRunner({ storage: sourceStore, now: () => date(), fetchFn: discovery([issue(6)]),
        loadDetails: async item => { sourceEntered(); await sourceWait; return detail(item); } });
    const oldRun = sourceRunner.run(); await sourceFetching;
    await sourceStore.set({ AccessToken: 'different-token', UserProfile: { id: 8 } });
    sourceRelease(); assert.strictEqual((await oldRun).status, 'cancelled');
    assert.strictEqual((await sourceStore.get(null)).KpiInfo.length, 0);
    console.log('✔ Passed: Account/token changes cannot commit stale source data');

    // Auto sync respects hours and the toggle; explicit sync remains available.
    const offStore = memory({ ...defaults(), KpiSyncSettings: { enabled: false, intervalMinutes: 5 } });
    let calls = 0;
    const offRunner = sync.createRunner({ storage: offStore, now: () => date(6, 22), fetchFn: discovery([issue(7)], () => calls++), loadDetails: async item => detail(item) });
    assert.strictEqual((await offRunner.run()).status, 'paused'); assert.strictEqual(calls, 0);
    const pausedAuto = offRunner.run();
    const forced = offRunner.run({ force: true });
    assert.strictEqual((await pausedAuto).status, 'paused');
    assert.strictEqual((await forced).status, 'success', 'A manual request arriving during a paused automatic request must still run');
    console.log('✔ Passed: Auto-sync toggle/hours and explicit outside-hours sync');

    // Exercise actual extracted GraphQL queries and normalization across two pages.
    const gqlCalls = [];
    const client = sync.createGitlabClient(server, 'test-token', { fetchFn: async (url, options) => {
        const query = JSON.parse(options.body); gqlCalls.push(query);
        const second = !!query.variables.timeAfter;
        const count = second ? 2 : 100;
        return { ok: true, json: async () => ({ data: { workspace: { workItem: {
            title: 'Paginated task', workItemType: { name: 'Task' }, state: 'closed', createdAt: issue(8).created_at, closedAt: '2026-10-05T03:00:00Z', webUrl: issue(8).web_url,
            widgets: [{ type: 'NOTES', discussions: { nodes: [{ notes: { nodes: [{ body: 'reopened', author: { id: 'gid://gitlab/User/8' } }] } }],
                pageInfo: { hasNextPage: !query.variables.notesAfter, endCursor: query.variables.notesAfter ? null : 'notes-next' } } }, { type: 'HIERARCHY', parent: { iid: '99', title: 'Parent issue', webUrl: `${server}/team/project/-/issues/99` } }, { type: 'ASSIGNEES', assignees: { nodes: [{ id: 'gid://gitlab/User/7' }] } },
                { type: 'TIME_TRACKING', timeEstimate: 40 * 3600, totalTimeSpent: 51 * 3600, timelogs: {
                    nodes: Array.from({ length: count }, (_, i) => ({ id: `${second}-${i}`, timeSpent: 1800, spentAt: '2026-10-04T18:00:00Z', user: { id: 'gid://gitlab/User/7', username: 'me' } })),
                    pageInfo: { hasNextPage: !second, endCursor: second ? null : 'time-next' }
                } }]
        } } } }) };
    } });
    const result = await client.getItem({ id: '8', href: issue(8).web_url, createAt: issue(8).created_at });
    assert.strictEqual(result.taskUrl, issue(8).web_url, 'The Task URL must not be replaced with its parent Issue');
    assert.strictEqual(result.parentTitle, 'Parent issue');
    assert.strictEqual(result.parentUrl, `${server}/team/project/-/issues/99`);
    assert.strictEqual(gqlCalls.length, 2, 'Two simultaneous paginated connections need two combined calls, not four separate calls');
    assert.strictEqual(result.timelogs.length, 102);
    assert.strictEqual(result.timelogs[0].spentAt, '2026-10-05');
    assert.strictEqual(result.timelogs[0].user.username, 'me');
    assert.strictEqual(result.reopenTotal, 2);
    assert.strictEqual(result.spent, 51);
    assert.strictEqual(utils.getItemEstimateVariance(result), 11);
    assert(gqlCalls.some(query => query.variables.timeAfter === 'time-next'));
    assert(gqlCalls.some(query => query.variables.notesAfter === 'notes-next'));
    console.log('✔ Passed: Real query extraction, paginated timelogs/reopens, local dates and lifetime spent');
    let singleCalls = 0;
    const single = sync.createGitlabClient(server, 'test-token', { fetchFn: async (url, options) => {
        singleCalls++;
        const query = JSON.parse(options.body);
        assert(query.query.includes('WorkItemWidgetNotes'));
        assert(query.query.includes('WorkItemWidgetTimeTracking'));
        return { ok: true, json: async () => ({ data: { workspace: { workItem: {
            title: 'Single page', state: 'opened', createdAt: issue(8).created_at, webUrl: issue(8).web_url,
            widgets: [{ type: 'TIME_TRACKING', totalTimeSpent: 3600, timeEstimate: 7200, timelogs: { nodes: [], pageInfo: { hasNextPage: false } } },
                { type: 'NOTES', discussions: { nodes: [{ notes: { nodes: [{ body: 'reopened', author: { id: 'other' } }] } }], pageInfo: { hasNextPage: false } } }]
        } } } }) };
    } });
    const singleResult = await single.getItem({ href: issue(8).web_url });
    assert.strictEqual(singleCalls, 1, 'A one-page work item and its reopen history require exactly one request');
    assert.strictEqual(singleResult.reopenTotal, 1);
    console.log('✔ Passed: One combined GraphQL request per single-page Work Item');

    const inactive = { ...detail({ id: '30', href: issue(30).web_url, createAt: '2026-10-01T00:00:00Z' }), state: 'closed',
        syncSource: source, updatedAt: '2026-10-02T00:00:00Z', syncedAt: date(5).toISOString() };
    const oldStore = memory({ ...defaults(), WorkItemIds: [{ id: '30', href: inactive.taskUrl, createAt: inactive.createdAt, syncSource: source, trackingOrigin: 'manual' }], KpiInfo: [inactive],
        KpiSyncState: { sources: { [source]: { discoveryPolicy: 3, discoveryStart: '2026-09-30T17:00:00Z', watermark: date(5).toISOString() } } } });
    let oldClock = date(), updated = '2026-10-02T00:00:00Z', requested = [];
    const readOld = sync.createRunner({ storage: oldStore, now: () => oldClock,
        fetchFn: (url, options) => discovery([issue(30, { created_at: inactive.createdAt, updated_at: updated, state: 'closed' })])(url, options),
        loadDetails: async item => { requested.push(item.id); return { ...inactive, updatedAt: updated }; } });
    await readOld.run();
    assert.deepStrictEqual(requested, [], 'Routine sync must not fetch the details of inactive historical Work Items');
    updated = date().toISOString(); oldClock = new Date(date().getTime() + 16 * 60000);
    await readOld.run();
    assert.deepStrictEqual(requested, ['30'], 'Lightweight metadata detects when an older tracked Work Item changes today');
    assert(!sync.stateOf(await oldStore.get(null)).lastFullSyncAt, 'A daily sync must not be reported as a full re-sync');
    console.log('✔ Passed: Daily activity selection, metadata checks, and separate full-sync status');

    const parentClient = sync.createGitlabClient(server, 'test-token', { fetchFn: async () => ({ ok: true, json: async () => ({ data: { workspace: {
        workItem: { title: 'Parent Issue', state: 'opened', webUrl: issue(99).web_url, workItemType: { name: 'Issue' }, widgets: [] }
    } } }) }) });
    const parent = await parentClient.getItem({ id: '99', href: issue(99).web_url, trackingOrigin: 'auto' });
    assert.strictEqual(parent.autoSyncIgnored, true, 'GraphQL type guards against a parent Issue even if REST filtering fails');
    console.log('✔ Passed: Work Item type validation rejects auto-discovered parent Issues');

    const legacy = memory({ ...defaults(),
        WorkItemIds: [
            { id: '20', href: issue(20).web_url, createAt: '2026-09-01T00:00:00Z', syncSource: source, updatedAt: date().toISOString() },
            { id: '21', href: issue(21).web_url, createAt: issue(21).created_at, syncSource: source, updatedAt: date().toISOString() },
            { id: '22', href: issue(22).web_url, createAt: '2026-09-01T00:00:00Z', syncSource: source, updatedAt: date().toISOString(), parentTitle: 'Manual parent metadata' }
        ],
        KpiInfo: [20, 21, 22].map(id => ({ ...detail({ id: String(id), href: issue(id).web_url, createAt: id === 21 ? issue(21).created_at : '2026-09-01T00:00:00Z' }), syncSource: source })),
        KpiSyncState: { sources: { [source]: { lastSuccessAt: date().toISOString(), scan: { queries: [{ issue_type: 'issue', state: 'opened' }], step: 0, page: 1, found: [] } } } }
    });
    const migrating = sync.createRunner({ storage: legacy, now: () => date(), fetchFn: discovery([]), loadDetails: async item => ({
        ...detail(item), workItemTypeName: item.id === '21' ? 'Issue' : 'Task', autoSyncIgnored: item.id === '21'
    }) });
    await migrating.run();
    const migrated = await legacy.get(null);
    assert.strictEqual(migrated.KpiInfo.length, 3, 'Migration preserves cached history rather than deleting it');
    assert.deepStrictEqual(sync.visibleItems(migrated).map(row => row.id), ['22'], 'Old auto-imported tasks and parent Issues are ignored, manual history is preserved');
    assert.strictEqual(sync.stateOf(migrated).discoveryPolicy, 3);
    assert.strictEqual(sync.stateOf(migrated).scan, null);
    await migrating.updateItems({ add: [{ id: '20', href: issue(20).web_url, createAt: '2026-09-01T00:00:00Z' }] });
    await migrating.run({ force: true });
    assert(sync.visibleItems(await legacy.get(null)).some(row => row.id === '20'), 'Explicit re-add restores an ignored old task as manual tracking');
    console.log('✔ Passed: Migration abandons broad scans, hides incorrect auto imports, and keeps manual/history data');


    const bad = sync.createGitlabClient(server, 'test-token', { fetchFn: async () => ({ ok: true, json: async () => ({ data: {}, errors: [{ message: 'Denied' }] }) }) });
    await assert.rejects(() => bad.request('/api/graphql', { query: '{}' }), /Denied/);
    const limited = sync.createGitlabClient(server, 'test-token', { fetchFn: async () => ({ ok: false, status: 429, headers: { get: () => '42' } }) });
    await assert.rejects(() => limited.request('/api/v4/issues'), error => error.retryAfterMs === 42000);
    console.log('✔ Passed: GraphQL partial errors and HTTP Retry-After are surfaced');
    let authCalls = 0;
    const authStore = memory(defaults());
    const authRunner = sync.createRunner({ storage: authStore, now: () => date(), fetchFn: async () => {
        authCalls++; return { ok: false, status: 401, headers: { get: () => null } };
    } });
    await authRunner.run(); await authRunner.run();
    assert.strictEqual(authCalls, 1, 'Invalid credentials must not be retried automatically');
    assert.strictEqual(sync.stateOf(await authStore.get(null)).authError, true);
    await authRunner.run({ force: true });
    assert.strictEqual(authCalls, 2, 'Explicit sync can recheck corrected credentials');
    assert.strictEqual(utils.getItemCloseDate({ closedAt: '2026-10-05T18:30:00Z' }), '2026-10-06');
    assert.strictEqual(utils.getItemOriginDate({ createdAt: '2026-09-30T18:30:00Z' }), '2026-10-01');
    assert(utils.isItemLate({ state: 'closed', closedAt: '2026-10-05T18:30:00Z', dueDate: '05/10/2026' }));
    console.log('✔ Passed: Invalid-token retry guard and local lifecycle dates at midnight');

    const previousChrome = global.chrome;
    try {
        const exportStorage = memory(defaults()), messages = [];
        global.chrome = { storage: { local: exportStorage }, runtime: { sendMessage: async message => {
            messages.push(message);
            return messages.length === 1 ? { status: 'pending', scan: { page: 2 }, manual: true } : { status: 'success', pending: [] };
        } } };
        await sync.syncBeforeExport('2026-09');
        assert.deepStrictEqual(messages, [{ type: 'kpi:sync', force: true, month: '2026-09' }, { type: 'kpi:sync', continue: true }],
            'Export waits for a pending full scan without restarting it');
        chrome.runtime.sendMessage = async () => ({ status: 'error', error: 'Task unavailable', pending: [{}] });
        await assert.rejects(() => sync.syncBeforeExport('2026-09'), /Task unavailable/);
        chrome.runtime.sendMessage = async () => ({ status: 'disconnected' });
        await assert.rejects(() => sync.syncBeforeExport('2026-09'), /disconnected/);
        chrome.runtime.sendMessage = async () => { await exportStorage.set({ AccessToken: 'different-token' }); return { status: 'success' }; };
        await assert.rejects(() => sync.syncBeforeExport('2026-09'), /Sync source changed/);
    } finally {
        if (previousChrome === undefined) delete global.chrome;
        else global.chrome = previousChrome;
    }
    console.log('✔ Passed: Export waits for completed full sync and rejects errors, disconnected accounts and source changes');
    const recovery = memory({ KpiSyncState: { sources: {
        [source]: { status: 'running', pending: [{ item: { href: issue(1).web_url }, progress: { task: { complete: true } } }] },
        old: { status: 'running', pending: [], lastSuccessAt: '2026-10-05T01:00:00Z' }
    } } });
    global.chrome = { storage: { local: recovery } };
    try {
        const background = require('../background.js');
        await background.recoverSyncState();
        const recovered = (await recovery.get(null)).KpiSyncState.sources;
        assert.strictEqual(recovered[source].status, 'pending');
        assert.strictEqual(recovered[source].pending[0].progress.task.complete, true);
        assert.strictEqual(recovered.old.status, 'ready');
        assert.strictEqual(recovered.old.lastSuccessAt, '2026-10-05T01:00:00Z');
    } finally { global.chrome = previousChrome; }
    console.log('✔ Passed: Background startup recovers stale running status and preserves queued progress');

    const RealDate = Date, fridayEvening = new Date(2026, 9, 2, 18, 1).getTime(), alarms = [];
    const scheduleStorage = memory({ ...defaults(), KpiSyncSettings: { enabled: true, intervalMinutes: 15 },
        KpiSyncState: { sources: { [source]: { status: 'pending', pending: [{ item: queuedItem }] } } } });
    try {
        global.Date = class extends RealDate {
            constructor(...args) { super(...(args.length ? args : [fridayEvening])); }
            static now() { return fridayEvening; }
        };
        global.chrome = { storage: { local: scheduleStorage }, alarms: {
            get: async () => null, create: async (name, options) => { alarms.push({ name, ...options }); }
        } };
        await require('../background.js').configureSyncAlarm();
        assert.strictEqual(alarms.find(alarm => alarm.name === 'kpiSyncContinue').when, new RealDate(2026, 9, 5, 8, 30).getTime(),
            'An unfinished Friday automatic sync resumes at Monday check-in');
    } finally { global.Date = RealDate; global.chrome = previousChrome; }
    console.log('✔ Passed: Background continuation skips weekends and resumes Monday morning');


}
run().catch(error => { console.error(error); process.exitCode = 1; });
