/* Shared GitLab reads, resumable background sync and its small settings UI. */
const KpiSync = (() => {
    const U = typeof module !== 'undefined' && module.exports ? require('./utils.js') : globalThis;
    const { formatDate, getTimelogDate, isItemLate, parseToIsoDate, isItemClosed, isItemActiveInFilter,
        calculateStats, sanitizeGitlabUrl, cleanGroupName } = U;
    const intervals = [5, 15, 30, 60];
    const settingsOf = data => ({ enabled: data.KpiSyncSettings?.enabled !== false,
        intervalMinutes: intervals.includes(Number(data.KpiSyncSettings?.intervalMinutes)) ? Number(data.KpiSyncSettings.intervalMinutes) : 15 });
    const serverOf = data => sanitizeGitlabUrl(data.gitlabServerUrl || data.gitlabUrl || 'https://gitlab.com');
    const sourceOf = data => `${serverOf(data)}|${data.UserProfile?.id || data.UserProfile?.username || ''}`;
    function itemKey(item) {
        try {
            const url = new URL(item.href || item.taskUrl || item.web_url);
            const parsed = parseGitLabUrl(url.href);
            return parsed ? `${url.origin}|${parsed.projectPath}|${parsed.type === 'merge_request' ? 'mr' : 'task'}|${parsed.iid}` : '';
        } catch { return ''; }
    }
    const discoveryPolicy = 3;
    const isAutomaticItem = item => item?.trackingOrigin === 'auto'
        || (!item?.trackingOrigin && !!item?.syncSource && !!item?.updatedAt
            && !item?.parentTitle && !item?.parentUrl && !item?.parentIid && !item?.title);
    const belongsToSource = (item, data) => item.syncSource ? item.syncSource === sourceOf(data)
        : itemKey(item).startsWith(serverOf(data) + '|');
    function inHours(data, date = new Date()) {
        const minutes = value => /^\d{2}:\d{2}$/.test(value) && Number(value.slice(0, 2)) < 24 && Number(value.slice(3)) < 60
            ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
        const start = minutes(data.checkInTime || '08:30'), end = minutes(data.checkOutTime || '18:00');
        const current = date.getHours() * 60 + date.getMinutes();
        return start < end ? current >= start && current < end : start > end && (current >= start || current < end);
    }
    function activeToday(item, row, date) {
        const today = parseToIsoDate(date);
        return [item.createAt, item.createdAt, item.updatedAt, item.observedChangedAt, row?.createdAt, row?.updatedAt].some(value => value && getTimelogDate({ spentAt: value }) === today)
            || (row?.timelogs || []).some(log => getTimelogDate(log) === today);
    }
    const inSyncHours = (data, date = new Date()) => date.getDay() >= 1 && date.getDay() <= 5 && inHours(data, date);
    function needsDetail(item, row, date, intervalMinutes) {
        if (!row?.syncedAt) return true;
        if ((item.updatedAt && item.updatedAt !== row.updatedAt)
            || Date.parse(item.observedChangedAt) > Date.parse(row.syncedAt)) return true;
        return activeToday(item, row, date) && date.getTime() - Date.parse(row.syncedAt) >= intervalMinutes * 60000;
    }
    function visibleItems(data) {
        const source = sourceOf(data), server = serverOf(data);
        return (Array.isArray(data.KpiInfo) ? data.KpiInfo : []).filter(item => {
            if (item.autoSyncIgnored) return false;
            if (item.syncSource) return item.syncSource === source;
            try { return new URL(item.taskUrl || item.href).origin === server; } catch { return false; }
        });
    }
    const stateOf = data => data.KpiSyncState?.sources?.[sourceOf(data)] || {};
    const yielded = () => Object.assign(new Error('Sync paused'), { syncYield: true });
    const changed = () => Object.assign(new Error('Sync source changed'), { sourceChanged: true });

    function createRunner({ storage, fetchFn = globalThis.fetch, now = () => new Date(), budgetMs = 20000, loadDetails } = {}) {
        let running = null, activeOptions = {}, queuedForce = null, writes = Promise.resolve(), stopped = false;
        const write = action => {
            const result = writes.then(() => action());
            writes = result.catch(() => {});
            return result;
        };
        const isCurrent = (data, snapshot) => data.AccessToken === snapshot.AccessToken && serverOf(data) === serverOf(snapshot);
        function run(options = {}) {
            if (running) {
                if (options.force && (!activeOptions.force || options.month !== activeOptions.month)) {
                    if (!queuedForce) queuedForce = running.then(() => run(options)).finally(() => { queuedForce = null; });
                    return queuedForce;
                }
                return running;
            }
            stopped = false;
            activeOptions = options;
            running = perform(options).finally(() => { running = null; });
            return running;
        }
        async function perform(options) {
            let snapshot = await storage.get(null);
            if (!snapshot.AccessToken) return { status: 'disconnected' };
            const settings = settingsOf(snapshot);
            let state = stateOf(snapshot);
            const manual = options.force === true || (options.continue === true && state.manual && (state.scan || state.pending?.length));
            if (!manual && (!settings.enabled || !inSyncHours(snapshot, now()))) return { status: 'paused' };
            if (state.authError && !options.authChanged && !options.force) return state;
            if (state.retryAt && !options.authChanged && !(options.force && state.authError) && now().getTime() < state.retryAt) return { ...state, status: 'error' };
            const known = [...(snapshot.WorkItemIds || []), ...(snapshot.MergeItemIds || [])];
            const cached = visibleItems(snapshot);
            const missing = known.some(item => !item.autoSyncIgnored && belongsToSource(item, snapshot)
                && !cached.some(row => itemKey(row) === itemKey(item)));
            if (!manual && !state.scan && !state.pending?.length && !missing && state.lastSuccessAt && state.discoveryPolicy === discoveryPolicy && state.carryoverScanned && !options.authChanged
                && now().getTime() - Date.parse(state.lastSuccessAt) < settings.intervalMinutes * 60000) return state;

            const started = now().getTime(), deadline = started + budgetMs;
            let source = sourceOf(snapshot);
            const mayContinue = () => !stopped && now().getTime() < deadline && (manual || inSyncHours(snapshot, now()));
            async function save(extra = {}) {
                Object.assign(state, extra);
                await write(async () => {
                    const data = await storage.get(null);
                    if (!isCurrent(data, snapshot) || sourceOf(data) !== source) throw changed();
                    await storage.set({ KpiSyncState: { activeSource: source, sources: { ...data.KpiSyncState?.sources, [source]: structuredClone(state) } } });
                });
            }
            try {
                const authClient = createGitlabClient(serverOf(snapshot), snapshot.AccessToken, { fetchFn });
                const user = await authClient.request('/api/v4/user');
                if (!user?.id) throw new Error('Invalid GitLab user response');
                await write(async () => {
                    const data = await storage.get(null);
                    if (!isCurrent(data, snapshot)) throw changed();
                    if (data.UserProfile?.id !== user.id) await storage.set({ UserProfile: user });
                });
                snapshot = { ...snapshot, UserProfile: user };
                source = sourceOf(snapshot);
                const fresh = await storage.get(null);
                state = structuredClone(fresh.KpiSyncState?.sources?.[source] || {});
                if (state.retryAt && !options.authChanged && !(options.force && state.authError) && now().getTime() < state.retryAt) return state;
                state.manual = !!manual;
                state.pending = (state.pending || []).filter(job => !fresh.KpiSyncExcludedItems?.[`${source}|${itemKey(job.item)}`]);
                if (options.force) state.scan = null;
                const previousStatus = state.status;
                await save({ status: 'running', error: '', retryAt: 0, authError: false });
                const month = parseToIsoDate(now()).slice(0, 7);
                const monthStart = new Date(now().getFullYear(), now().getMonth(), 1).toISOString();
                if (state.discoveryPolicy !== discoveryPolicy) {
                    // Restart older broad discovery; preserve manually tracked items and cached history.
                    const previousPolicy = state.discoveryPolicy || 0;
                    const ignored = new Set();
                    await write(async () => {
                        const data = await storage.get(null);
                        if (!isCurrent(data, snapshot) || sourceOf(data) !== source) throw changed();
                        const work = (data.WorkItemIds || []).map(item => {
                            if (!belongsToSource(item, snapshot) || !isAutomaticItem(item)) return item;
                            const beforeMonth = (state.discoveryPolicy || 0) < 2
                                && Date.parse(item.createAt || item.createdAt || item.addedAt) < Date.parse(monthStart);
                            const parent = item.issueType && item.issueType !== 'task';
                            if (beforeMonth || parent) ignored.add(itemKey(item));
                            return { ...item, trackingOrigin: 'auto', autoSyncIgnored: !!(item.autoSyncIgnored || beforeMonth || parent) };
                        });
                        const cache = (data.KpiInfo || []).map(item => ignored.has(itemKey(item)) && (!item.syncSource || item.syncSource === source)
                            ? { ...item, trackingOrigin: 'auto', autoSyncIgnored: true } : item);
                        await storage.set({ WorkItemIds: work, KpiInfo: cache });
                    });
                    await save({ discoveryPolicy, discoveryStart: state.discoveryStart || monthStart, scan: null, carryoverScanned: false,
                        ...(previousPolicy < 2 ? { pending: [], watermark: null, discoveryWatermark: null, upper: null,
                            reconciledDay: null, reconcileDay: null } : {}) });
                }

                if (!state.scan && (options.force || !state.pending?.length || !state.carryoverScanned || previousStatus === 'error')) {
                    const upper = now().toISOString();
                    const cursor = state.discoveryWatermark || state.watermark;
                    const lower = cursor ? new Date(Date.parse(cursor) - 5 * 60000).toISOString() : monthStart;
                    const filters = [{ created_after: lower, created_before: upper },
                        { created_before: upper, updated_after: lower, updated_before: upper }];
                    if (!state.carryoverScanned || manual) filters.push({ created_before: monthStart, state: 'opened' });
                    if (manual && /^\d{4}-(0[1-9]|1[0-2])$/.test(options.month || '')) {
                        const [year, monthNum] = options.month.split('-').map(Number);
                        const reportStart = new Date(year, monthNum - 1, 1).toISOString();
                        const reportEnd = new Date(year, monthNum, 1).toISOString();
                        filters.push({ created_after: reportStart, created_before: reportEnd },
                            { created_before: reportEnd, updated_after: reportStart, updated_before: upper });
                    }
                    state.scan = { upper, step: 0, page: 1, found: [], queries: filters.map(filter => ({ scope: 'created_by_me', state: 'all',
                        order_by: 'created_at', sort: 'asc', per_page: 100, ...filter, issue_type: 'task' })) };
                    if (!manual) {
                        // Cheap project lists check activity on older/manual tasks without N detail queries.
                        const data = await storage.get(null), groups = new Map();
                        for (const item of [...(data.WorkItemIds || []), ...(data.MergeItemIds || [])]) {
                            if (item.autoSyncIgnored || !belongsToSource(item, snapshot)) continue;
                            const parsed = parseGitLabUrl(item.href || item.taskUrl);
                            if (!parsed) continue;
                            const path = `/api/v4/projects/${encodeURIComponent(parsed.projectPath)}/${parsed.type === 'merge_request' ? 'merge_requests' : 'issues'}`;
                            if (!groups.has(path)) groups.set(path, []);
                            groups.get(path).push(item);
                        }
                        for (const [path, items] of groups) {
                            for (let i = 0; i < items.length; i += 100) state.scan.queries.push({ _path: path, _tracked: items.slice(i, i + 100), scope: 'all', state: 'all', per_page: 100 });
                        }
                    }
                    await save();
                }
                if (state.scan) {
                    const client = createGitlabClient(serverOf(snapshot), snapshot.AccessToken, { fetchFn });
                    while (state.scan.step < state.scan.queries.length) {
                        if (!mayContinue()) throw yielded();
                        const scan = state.scan;
                        const { _path, _tracked, ...filter } = scan.queries[scan.step];
                        const params = new URLSearchParams({ ...filter, page: scan.page });
                        for (const item of _tracked || []) params.append('iids[]', parseGitLabUrl(item.href || item.taskUrl).iid);
                        const page = await client.request((_path || '/api/v4/issues') + '?' + params);
                        if (!Array.isArray(page)) throw new Error('Invalid GitLab issue list');
                        const found = new Map(scan.found.map(item => [itemKey(item), item]));
                        const metadata = _tracked ? await storage.get(['KpiInfo', 'UserProfile', 'gitlabServerUrl', 'gitlabUrl']) : null;
                        const metadataRows = metadata ? visibleItems(metadata) : [];
                        for (const item of page) {
                            if (_tracked) {
                                const tracked = _tracked.find(row => parseGitLabUrl(row.href || row.taskUrl)?.iid === String(item.iid));
                                if (!tracked) continue;
                                const row = metadataRows.find(row => itemKey(row) === itemKey(tracked));
                                const stats = item.time_stats;
                                const changedSinceRead = row && ((stats?.total_time_spent !== undefined && Number((stats.total_time_spent / 3600).toFixed(2)) !== Number(row.spent))
                                    || (stats?.time_estimate !== undefined && Number((stats.time_estimate / 3600).toFixed(2)) !== Number(row.estimate))
                                    || (item.state && item.state !== row.state));
                                scan.trackedUpdates ||= {};
                                scan.trackedUpdates[itemKey(tracked)] = { ...tracked, updatedAt: item.updated_at,
                                    ...(changedSinceRead ? { observedChangedAt: now().toISOString() } : {}) };
                                continue;
                            }
                            if (item.issue_type && item.issue_type !== 'task') continue;
                            const created = Date.parse(item.created_at);
                            const updated = Date.parse(item.updated_at);
                            if (!Number.isFinite(created) || created > Date.parse(scan.upper)
                                || (filter.created_after && created < Date.parse(filter.created_after))
                                || (filter.created_before && created > Date.parse(filter.created_before))
                                || (filter.updated_after && !(updated >= Date.parse(filter.updated_after)))
                                || (filter.updated_before && !(updated <= Date.parse(filter.updated_before)))
                                || (filter.state === 'opened' && item.state !== 'opened')) continue;
                            if (!itemKey(item)) throw new Error('Unsupported GitLab work item URL');
                            found.set(itemKey(item), { id: String(item.iid), href: item.web_url, createAt: item.created_at, taskTitle: item.title, updatedAt: item.updated_at, syncSource: source, trackingOrigin: 'auto', issueType: 'task' });
                        }
                        scan.found = [...found.values()];
                        if (page.length < 100) { scan.step++; scan.page = 1; } else scan.page++;
                        await save();
                    }
                    await write(async () => {
                        const data = await storage.get(null);
                        if (!isCurrent(data, snapshot) || sourceOf(data) !== source) throw changed();
                        const excluded = data.KpiSyncExcludedItems || {};
                        const belongs = item => belongsToSource(item, snapshot);
                        const trackedUpdates = state.scan.trackedUpdates || {};
                        const work = new Map((data.WorkItemIds || []).filter(item => belongs(item)).map(item => [itemKey(item), trackedUpdates[itemKey(item)] || item]));
                        const candidates = new Map((state.pending || []).filter(job => !excluded[`${source}|${itemKey(job.item)}`]).map(job => [itemKey(job.item), job.item]));
                        for (const item of state.scan.found) {
                            if (excluded[`${source}|${itemKey(item)}`]) continue;
                            const existing = work.get(itemKey(item));
                            const merged = { ...existing, ...item, trackingOrigin: existing && !isAutomaticItem(existing) ? 'manual' : 'auto', autoSyncIgnored: false };
                            work.set(itemKey(item), merged);
                        }
                        const currentCache = visibleItems(data);
                        for (const item of [...work.values(), ...(data.MergeItemIds || []).filter(belongs).map(item => trackedUpdates[itemKey(item)] || item)]) {
                            if (item.autoSyncIgnored || excluded[`${source}|${itemKey(item)}`]) continue;
                            const row = currentCache.find(row => itemKey(row) === itemKey(item));
                            if (manual || needsDetail(item, row, now(), settings.intervalMinutes)) candidates.set(itemKey(item), item);
                        }
                        state.upper = state.scan.upper;
                        state.discoveryWatermark = state.scan.upper;
                        state.carryoverScanned = true;
                        const prior = new Map((state.pending || []).map(job => [itemKey(job.item), job]));
                        state.pending = [...candidates.values()].map(item => {
                            const old = prior.get(itemKey(item));
                            return old && !options.force && old.item.updatedAt === item.updatedAt ? { ...old, item } : { item, progress: {} };
                        });
                        state.scan = null;
                        await storage.set({ WorkItemIds: [...(data.WorkItemIds || []).filter(item => !belongs(item)), ...work.values()],
                            MergeItemIds: (data.MergeItemIds || []).map(item => trackedUpdates[itemKey(item)] || item) });
                    });
                    await save();
                }
                while (state.pending?.length) {
                    if (!mayContinue()) throw yielded();
                    const batch = state.pending.filter(job => !job.retryAt || now().getTime() >= job.retryAt).slice(0, 6);
                    if (!batch.length) {
                        await save({ status: 'error', error: state.pending[0].error || 'Task update failed', retryAt: Math.min(...state.pending.map(job => job.retryAt)) });
                        return state;
                    }
                    const results = await Promise.allSettled(batch.map(async job => {
                        const client = createGitlabClient(serverOf(snapshot), snapshot.AccessToken, {
                            fetchFn, progress: job.progress, checkpoint: () => save(), mayContinue
                        });
                        return loadDetails ? loadDetails(job.item, client) : client.getItem(job.item);
                    }));
                    const successes = results.flatMap((result, index) => result.status === 'fulfilled' ? [{ job: batch[index], detail: result.value }] : []);
                    await write(async () => {
                        const data = await storage.get(null);
                        if (!isCurrent(data, snapshot) || sourceOf(data) !== source) throw changed();
                        const excluded = data.KpiSyncExcludedItems || {};
                        const cache = Array.isArray(data.KpiInfo) ? [...data.KpiInfo] : [];
                        for (const { job, detail } of successes) {
                            if (!detail) throw new Error('Empty GitLab task response');
                            if (excluded[`${source}|${itemKey(job.item)}`]) continue;
                            const index = cache.findIndex(row => itemKey(row) === itemKey(job.item) && (!row.syncSource || row.syncSource === source));
                            const automatic = isAutomaticItem(job.item);
                            const ignoreParent = automatic && detail.workItemTypeName && detail.workItemTypeName.toLowerCase() !== 'task';
                            const row = { ...(index >= 0 ? cache[index] : {}), ...detail, updatedAt: job.item.updatedAt || detail.updatedAt,
                                syncedAt: now().toISOString(), syncSource: source, trackingOrigin: automatic ? 'auto' : 'manual',
                                autoSyncIgnored: !!(detail.autoSyncIgnored || ignoreParent) };
                            if (row.autoSyncIgnored) {
                                const tracked = (data.WorkItemIds || []).find(item => itemKey(item) === itemKey(job.item));
                                if (tracked) { tracked.autoSyncIgnored = true; tracked.trackingOrigin = 'auto'; tracked.workItemTypeName = detail.workItemTypeName; }
                            }
                            if (index >= 0) cache[index] = row; else cache.push(row);
                        }
                        const completed = new Set(successes.map(result => result.job));
                        state.pending = state.pending.filter(job => !completed.has(job) && !excluded[`${source}|${itemKey(job.item)}`]);
                        // Include manual additions made while requests were in flight.
                        const pendingKeys = new Set(state.pending.map(job => itemKey(job.item)));
                        for (const item of [...(data.WorkItemIds || []), ...(data.MergeItemIds || [])]) {
                            const key = itemKey(item);
                            if (!item.autoSyncIgnored && belongsToSource(item, snapshot)
                                && !excluded[`${source}|${key}`] && !pendingKeys.has(key)
                                && !cache.some(row => itemKey(row) === key && (!row.syncSource || row.syncSource === source))) {
                                state.pending.push({ item, progress: {} }); pendingKeys.add(key);
                            }
                        }
                        const rows = visibleItems({ ...data, KpiInfo: cache });
                        const monthly = rows.filter(row => isItemActiveInFilter(row, 'all_month', month));
                        await storage.set({ WorkItemIds: data.WorkItemIds || [], KpiInfo: cache, KpiStats: { ...calculateStats(monthly, 'all_month', month, null, null, now(), data.KpiLeaveDays || {}), month } });
                    });
                    await save();
                    const failures = results.flatMap((result, index) => result.status === 'rejected' ? [{ job: batch[index], error: result.reason }] : []);
                    const fatal = failures.find(({ error }) => error.authError || error.retryAfterMs || error.syncYield || error.sourceChanged);
                    if (fatal) throw fatal.error;
                    for (const { job, error } of failures) { job.error = `${job.item.taskTitle || job.item.title || job.item.href}: ${error.message}`; job.retryAt = now().getTime() + 60000; }
                    await save();
                }
                await write(async () => {
                    const data = await storage.get(null);
                    if (!isCurrent(data, snapshot) || sourceOf(data) !== source) throw changed();
                    const rows = visibleItems(data).filter(row => isItemActiveInFilter(row, 'all_month', month));
                    await storage.set({ KpiStats: { ...calculateStats(rows, 'all_month', month, null, null, now(), data.KpiLeaveDays || {}), month } });
                });
                await save({ status: 'success', watermark: state.upper || state.watermark, lastSuccessAt: now().toISOString(),
                    ...(manual ? { lastFullSyncAt: now().toISOString() } : {}), manual: false, error: '', retryAt: 0 });
                return state;
            } catch (error) {
                if (error.sourceChanged) return { status: 'cancelled' };
                await save(error.syncYield ? { status: 'pending' } : { status: 'error', error: error.message,
                    retryAt: now().getTime() + (error.retryAfterMs || 60000), authError: !!error.authError }).catch(() => {});
                return { ...state, status: error.syncYield ? 'pending' : 'error' };
            }
        }
        async function updateItems({ add = [], remove = [], key = 'WorkItemIds' } = {}) {
            if (!['WorkItemIds', 'MergeItemIds'].includes(key) || !Array.isArray(add) || !Array.isArray(remove)) throw new Error('Invalid tracking update');
            return write(async () => {
                const data = await storage.get(null), source = sourceOf(data);
                const excluded = { ...data.KpiSyncExcludedItems };
                const removed = new Set(remove.map(itemKey).filter(Boolean));
                for (const item of remove) {
                    const id = itemKey(item);
                    if (!id) throw new Error('Invalid task URL');
                    excluded[`${source}|${id}`] = true;
                }
                const belongs = item => !item.syncSource || item.syncSource === source;
                const items = new Map((data[key] || []).filter(item => belongs(item) && !removed.has(itemKey(item))).map(item => [itemKey(item), item]));
                for (const item of add) {
                    const id = itemKey(item);
                    if (!id) throw new Error('Invalid task URL');
                    delete excluded[`${source}|${id}`];
                    const existing = items.get(id);
                    const origin = item.trackingOrigin || (item.updatedAt && existing ? (isAutomaticItem(existing) ? 'auto' : 'manual') : 'manual');
                    items.set(id, { ...existing, ...item, trackingOrigin: origin, autoSyncIgnored: origin === 'auto' ? !!existing?.autoSyncIgnored : false,
                        syncSource: id.startsWith(serverOf(data) + '|') ? source : item.syncSource });
                }
                const cache = (data.KpiInfo || []).filter(item => !removed.has(itemKey(item)) || (item.syncSource && item.syncSource !== source))
                    .map(row => add.some(item => itemKey(item) === itemKey(row)) && items.get(itemKey(row))?.trackingOrigin === 'manual'
                        && (!row.syncSource || row.syncSource === source) ? { ...row, trackingOrigin: 'manual', autoSyncIgnored: false } : row);
                const month = parseToIsoDate(now()).slice(0, 7);
                const monthly = visibleItems({ ...data, KpiInfo: cache }).filter(row => isItemActiveInFilter(row, 'all_month', month));
                await storage.set({ [key]: [...(data[key] || []).filter(item => !belongs(item)), ...items.values()], KpiInfo: cache, KpiSyncExcludedItems: excluded,
                    KpiStats: { ...calculateStats(monthly, 'all_month', month, null, null, now(), data.KpiLeaveDays || {}), month } });
                return [...items.values()];
            });
        }
        return { run, updateItems, pause: () => { stopped = true; } };
    }

    async function requestSync(force = false) {
        const response = await chrome.runtime.sendMessage({ type: 'kpi:sync', force });
        if (response?.error) throw new Error(response.error);
        return response;
    }
    async function syncBeforeExport(month) {
        const initial = await chrome.storage.local.get(null);
        let response = await chrome.runtime.sendMessage({ type: 'kpi:sync', force: true, month });
        while (true) {
            const current = await chrome.storage.local.get(null);
            if (current.AccessToken !== initial.AccessToken || sourceOf(current) !== sourceOf(initial)) throw changed();
            if (response?.error) throw new Error(response.error);
            if (response?.status === 'success' && !response.scan && !response.pending?.length) return;
            if (response?.status !== 'pending') throw new Error(response?.status || 'Sync failed');
            response = await chrome.runtime.sendMessage({ type: 'kpi:sync', continue: true });
        }
    }
    async function updateTrackedItems(key, add = [], remove = []) {
        const response = await chrome.runtime.sendMessage({ type: 'kpi:tracking', key, add, remove });
        if (response?.error) throw new Error(response.error);
        return response?.items || [];
    }
    async function mountUI() {
        if (typeof document === 'undefined' || !chrome?.storage?.local || !chrome.runtime?.sendMessage) return;
        const status = document.getElementById('kpiSyncStatus');
        if (!status || status.dataset.mounted) return;
        status.dataset.mounted = 'true';
        const enabled = document.getElementById('kpiAutoSyncEnabled'), interval = document.getElementById('kpiSyncInterval');
        const tr = (key, params) => typeof globalThis.t === 'function' ? globalThis.t(key, params) : key;
        async function render() {
            const data = await chrome.storage.local.get(null), state = stateOf(data), config = settingsOf(data);
            let key = !data.AccessToken ? 'syncDisconnected' : state.status === 'running' ? 'syncRunning'
                : !config.enabled && !state.manual ? 'syncDisabled' : state.status === 'error' ? 'syncError'
                : !inSyncHours(data) && !state.manual ? 'syncWaiting' : state.status === 'pending' ? 'syncPending' : 'syncReady';
            const last = state.lastSuccessAt ? new Date(state.lastSuccessAt).toLocaleString(document.documentElement.lang || 'vi') : '';
            const full = state.lastFullSyncAt ? new Date(state.lastFullSyncAt).toLocaleString(document.documentElement.lang || 'vi') : '';
            status.textContent = tr(key) + (last ? ` · ${tr('syncLast', { time: last })}` : '')
                + (full ? ` · ${tr('syncLastFull', { time: full })}` : ` · ${tr('syncNeedsFull')}`);
            status.title = state.error || '';
            if (enabled && !enabled.dataset.edited) enabled.checked = config.enabled;
            if (interval && !interval.dataset.edited) interval.value = String(config.intervalMinutes);
        }
        enabled?.addEventListener('change', () => { enabled.dataset.edited = 'true'; });
        interval?.addEventListener('change', () => { interval.dataset.edited = 'true'; });
        document.getElementById('saveKpiSyncBtn')?.addEventListener('click', async () => {
            await chrome.storage.local.set({ KpiSyncSettings: { enabled: enabled.checked, intervalMinutes: Number(interval.value) } });
            delete enabled.dataset.edited; delete interval.dataset.edited; await render();
        });
        document.getElementById('syncNowBtn')?.addEventListener('click', async event => {
            const button = event.currentTarget;
            button.disabled = true;
            try { await requestSync(true); await render(); }
            catch (error) { status.textContent = tr('syncError'); status.title = error.message; }
            finally { button.disabled = false; }
        });
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && ['KpiSyncState', 'KpiSyncSettings', 'AccessToken', 'UserProfile', 'appLanguage', 'checkInTime', 'checkOutTime'].some(key => changes[key])) render().catch(() => {});
        });
        await render();
        requestSync().catch(() => {});
    }

    // GitLab client and the existing detail/normalization routines are inserted below.
    function createGitlabClient(gitlabServerUrl, token, { fetchFn = globalThis.fetch, progress = {}, checkpoint = async () => {}, mayContinue = () => true } = {}) {
        const getAccessToken = async () => token;
        async function request(path, body) {
            if (!mayContinue()) throw yielded();
            const url = new URL(path, gitlabServerUrl);
            if (url.origin !== new URL(gitlabServerUrl).origin) throw new Error('Invalid GitLab request origin');
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            try {
                const response = await fetchFn(url.href, {
                    method: body ? 'POST' : 'GET', signal: controller.signal,
                    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                    ...(body ? { body: JSON.stringify(body) } : {})
                });
                if (!response.ok) {
                    const retry = response.headers?.get('Retry-After');
                    const retryAfterMs = retry ? Math.max(0, /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
                    throw Object.assign(new Error(`GitLab HTTP ${response.status}`), { retryAfterMs, authError: response.status === 401 || response.status === 403 });
                }
                const json = await response.json();
                if (json?.errors?.length) throw new Error('GitLab GraphQL: ' + json.errors.map(error => error.message).join('; '));
                return json;
            } finally { clearTimeout(timeout); }
        }
        function connection(workspace, kind) {
            const item = workspace?.workItem || workspace?.issuable;
            if (kind === 'mr') return item?.timelogs;
            const widget = item?.widgets?.find(widget => widget.type === (kind === 'notes' ? 'NOTES' : 'TIME_TRACKING'));
            return kind === 'notes' ? widget?.discussions : widget?.timelogs;
        }
        async function readGraphqlPages(query, kind) {
            let saved = progress[kind];
            while (!saved?.complete) {
                const json = await request('/api/graphql', { ...query, variables: { ...query.variables, after: saved?.after || null } });
                const workspace = json.data?.workspace;
                if (!workspace || !(workspace.workItem || workspace.issuable)) throw new Error('GitLab task is unavailable');
                const page = connection(workspace, kind);
                if (!saved) saved = progress[kind] = { workspace, after: null, complete: false };
                else {
                    const target = connection(saved.workspace, kind);
                    if (page?.nodes && target) target.nodes.push(...page.nodes);
                }
                const next = page?.pageInfo;
                saved.complete = !next?.hasNextPage;
                if (next?.hasNextPage) {
                    if (!next.endCursor || next.endCursor === saved.after) throw new Error('Invalid GitLab pagination cursor');
                    saved.after = next.endCursor;
                }
                await checkpoint();
            }
            return saved.workspace;
        }
        async function expandLongDiscussions(workspace, query) {
            if (connection(workspace, 'notes')?.nodes?.some(discussion => discussion.notes?.pageInfo?.hasNextPage)) {
                // Issue notes REST pagination also covers long discussions with >100 notes.
                let fallback = progress.noteFallback ||= { page: 1, nodes: [], complete: false };
                while (!fallback.complete) {
                    const rows = await request(`/api/v4/projects/${encodeURIComponent(query.variables.fullPath)}/issues/${query.variables.iid}/notes?per_page=100&page=${fallback.page}&sort=asc&order_by=created_at`);
                    if (!Array.isArray(rows)) throw new Error('Invalid GitLab notes response');
                    fallback.nodes.push(...rows.map(row => ({ notes: { nodes: [{ ...row, author: row.author ? { ...row.author, id: `gid://gitlab/User/${row.author.id}` } : null }] } })));
                    fallback.page++; fallback.complete = rows.length < 100;
                    await checkpoint();
                }
                connection(workspace, 'notes').nodes = fallback.nodes;
            }
        }
        async function readWorkItemPages(query) {
            let saved = progress.workItem;
            while (!saved?.complete) {
                const time = !saved?.timeDone, notes = !saved?.notesDone;
                const json = await request('/api/graphql', { ...query, variables: { ...query.variables,
                    timeAfter: saved?.timeAfter || null, notesAfter: saved?.notesAfter || null,
                    includeTime: time, includeNotes: notes } });
                const workspace = json.data?.workspace;
                if (!workspace?.workItem) throw new Error('GitLab task is unavailable');
                const first = !saved;
                if (!saved) saved = progress.workItem = { workspace, timeDone: false, notesDone: false };
                for (const [kind, active, done, cursor] of [['task', time, 'timeDone', 'timeAfter'], ['notes', notes, 'notesDone', 'notesAfter']]) {
                    if (!active) continue;
                    const page = connection(workspace, kind), target = connection(saved.workspace, kind);
                    if (!first && page?.nodes && target) target.nodes.push(...page.nodes);
                    saved[done] = !page?.pageInfo?.hasNextPage;
                    if (!saved[done]) {
                        const after = page.pageInfo.endCursor;
                        if (!after || after === saved[cursor]) throw new Error('Invalid GitLab pagination cursor');
                        saved[cursor] = after;
                    }
                }
                saved.complete = saved.timeDone && saved.notesDone;
                await checkpoint();
            }
            await expandLongDiscussions(saved.workspace, query);
            return saved.workspace;
        }
    async function getWorkItemDetailNew(createAt, projectUrl, groupName, id = null, isMergeRequest = false, storedData = {}, cachedToken = null) {
        const parsedUrl = parseGitLabUrl(projectUrl);
        if (!parsedUrl) return null;

        const { projectPath, iid, type: itemType } = parsedUrl;
        const token = cachedToken || await getAccessToken();

        let detailData;
        if (itemType === 'merge_request' || isMergeRequest) {
            detailData = await getMergeRequestDetail(token, projectPath, iid);
        } else {
            detailData = await getTaskDetail(token, projectPath, iid);
        }

        if (detailData) {
            const issuable = detailData.issuable || detailData.workItem;
            if (!issuable) return null;

            const workItemTypeName = issuable.workItemType?.name || (storedData.issueType === 'task' ? 'Task' : '');
            if (itemType !== 'merge_request' && isAutomaticItem(storedData) && workItemTypeName && workItemTypeName.toLowerCase() !== 'task') {
                return { taskUrl: issuable.webUrl || projectUrl, title: issuable.title || '', workItemTypeName, autoSyncIgnored: true, isMR: false };
            }

            const closeDateFormat = (issuable.closedAt || issuable.mergedAt) ? parseToIsoDate(new Date(issuable.closedAt || issuable.mergedAt)) : '';

            let esimateTimeTotal = 0;
            let spentTimeTotal = 0;
            let startDate = '';
            let dueDate = '';
            let taskType = "Kế hoạch";
            let assigneeId = null;
            let title = issuable.title;
            let webUrl = issuable.webUrl;
            let parentTitle = '';
            let parentUrl = '';
            let widgetTimeTracking = null;

            if (itemType === 'merge_request' || isMergeRequest) {
                esimateTimeTotal = issuable.timeEstimate;
                spentTimeTotal = issuable.totalTimeSpent;

                if (issuable.labels && issuable.labels.nodes) {
                    issuable.labels.nodes.forEach(label => {
                        if (label.title == "UNPLANNED") {
                            taskType = "Phát sinh";
                        }
                    });
                }
            } else {
                const widgets = issuable.widgets;

                // Start and due date
                const widgetStartDueDate = widgets?.find(widget => widget.type === "START_AND_DUE_DATE");
                if (widgetStartDueDate) {
                    startDate = formatDate(widgetStartDueDate.startDate);
                    dueDate = widgetStartDueDate.dueDate;
                }

                // Time tracking widget
                widgetTimeTracking = widgets?.find(widget => widget.type === "TIME_TRACKING");
                if (widgetTimeTracking) {
                    esimateTimeTotal = widgetTimeTracking.timeEstimate;
                    spentTimeTotal = widgetTimeTracking.totalTimeSpent;
                }

                // Label widget
                const widgetLabel = widgets?.find(widget => widget.type === "LABELS");
                if (widgetLabel) {
                    const labelNodes = widgetLabel.labels?.nodes || [];
                    labelNodes.forEach(label => {
                        if (label.title == "UNPLANNED") {
                            taskType = "Phát sinh";
                        }
                    });
                }

                // Assignee widget
                const widgetAssinee = widgets?.find(widget => widget.type === "ASSIGNEES");
                if (widgetAssinee && widgetAssinee.assignees?.nodes?.length > 0) {
                    assigneeId = widgetAssinee.assignees.nodes[0].id;
                }

                // Hierarchy widget (Parent Issue)
                const widgetHierarchy = widgets?.find(widget =>
                    widget.parent !== undefined ||
                    widget.__typename === "WorkItemWidgetHierarchy" ||
                    (widget.type && String(widget.type).toUpperCase() === "HIERARCHY")
                );

                if (widgetHierarchy && widgetHierarchy.parent) {
                    parentTitle = widgetHierarchy.parent.title || '';
                    if (widgetHierarchy.parent.iid) {
                        parentUrl = `${gitlabServerUrl}/${projectPath}/-/issues/${widgetHierarchy.parent.iid}`;
                    } else if (widgetHierarchy.parent.webUrl) {
                        parentUrl = widgetHierarchy.parent.webUrl;
                    }
                }

                // Fallback to stored parent info if available
                if (!parentTitle && storedData.parentTitle) {
                    parentTitle = storedData.parentTitle;
                }
                if (!parentUrl && storedData.parentUrl) {
                    parentUrl = storedData.parentUrl;
                }
            }

            if (!title && storedData.taskTitle) {
                title = storedData.taskTitle;
            }

            const isLate = (typeof isItemLate === 'function')
                ? isItemLate({ state: issuable.state, closedAt: issuable.closedAt || issuable.mergedAt, closeDate: closeDateFormat, dueDate: dueDate })
                : (closeDateFormat && dueDate ? compareDate(closeDateFormat, dueDate) < 0 : false);
            const progressStatus = isLate ? "Trễ hạn" : "Đúng hạn";

            let reopenTotal = 0;
            if (itemType !== 'merge_request' && !isMergeRequest) {
                const notes = issuable.widgets?.find(widget => widget.type === 'NOTES')?.discussions?.nodes || [];
                for (const discussion of notes) {
                    for (const note of discussion.notes?.nodes || []) {
                        if (note.body === 'reopened' && note.author?.id !== assigneeId) reopenTotal++;
                    }
                }
            }

            const timelogNodes = widgetTimeTracking?.timelogs?.nodes || issuable.timelogs?.nodes || [];
            const timelogs = timelogNodes.map(node => ({
                id: node.id,
                timeSpent: node.timeSpent || 0,
                timeSpentHours: node.timeSpent ? node.timeSpent / 3600 : 0,
                spentAt: getTimelogDate(node),
                spentAtRaw: node.spentAt,
                user: node.user ? { id: node.user.id, name: node.user.name, username: node.user.username } : null,
                note: node.note?.body || ''
            }));

            const returnData = {
                id: id,
                taskUrl: webUrl || projectUrl,
                startDate: startDate,
                dueDate: formatDate(dueDate),
                closeDate: formatDate(closeDateFormat),
                estimate: esimateTimeTotal ? parseFloat((esimateTimeTotal / 3600).toFixed(2)) : 0,
                spent: spentTimeTotal ? parseFloat((spentTimeTotal / 3600).toFixed(2)) : 0,
                reopenTotal: reopenTotal,
                type: taskType,
                progress: progressStatus,
                isLate: isLate,
                groupName: groupName,
                addedAt: createAt,
                createdAt: issuable.createdAt || issuable.created_at || createAt,
                closedAt: issuable.closedAt || issuable.mergedAt || (closeDateFormat ? closeDateFormat : ''),
                timelogs: timelogs,
                title: title || '',
                workItemTypeName,
                parentTitle: parentTitle,
                parentUrl: parentUrl,
                state: issuable.state || (closeDateFormat ? 'closed' : 'opened'),
                isMR: itemType === 'merge_request' || isMergeRequest
            };

            return returnData;
        } else {
            return null;
        }

    }

    async function getTaskDetail(token, fullPath, iid) {
        const queryData = {
            operationName: "namespaceWorkItem",
            variables: {
                fullPath: `${fullPath}`, // fullPath,
                iid: `${iid}`, // iid
            },
            query: `
query namespaceWorkItem($fullPath: ID!, $iid: String!, $timeAfter: String, $notesAfter: String, $includeTime: Boolean!, $includeNotes: Boolean!) {
  workspace: namespace(fullPath: $fullPath) {
    workItem(iid: $iid) {
      id title state createdAt closedAt webUrl
      workItemType { name }
      widgets {
        type __typename
        ... on WorkItemWidgetStartAndDueDate { startDate dueDate }
        ... on WorkItemWidgetAssignees { assignees { nodes { id } } }
        ... on WorkItemWidgetLabels { labels { nodes { title } } }
        ... on WorkItemWidgetHierarchy { parent { iid title webUrl } }
        ... on WorkItemWidgetNotes @include(if: $includeNotes) {
          discussions(first: 40, after: $notesAfter, filter: ALL_NOTES) {
            pageInfo { hasNextPage endCursor }
            nodes { notes(first: 100) { pageInfo { hasNextPage endCursor } nodes { body author { id } } } }
          }
        }
        ... on WorkItemWidgetTimeTracking @include(if: $includeTime) {
          timeEstimate totalTimeSpent
          timelogs(first: 100, after: $timeAfter) {
            pageInfo { hasNextPage endCursor }
            nodes { id timeSpent spentAt user { id name username } note { id body } }
          }
        }
      }
    }
  }
}
`
        };

        return readWorkItemPages(queryData);
    }

    async function getMergeRequestDetail(token, fullPath, iid) {
        const queryData = {
            operationName: "mergeRequestTimeTracking",
            variables: {
                fullPath: `${fullPath}`,
                iid: `${iid}`,
            },
            query: `
query mergeRequestTimeTracking($fullPath: ID!, $iid: String!, $after: String) {
  workspace: project(fullPath: $fullPath) {
    issuable: mergeRequest(iid: $iid) {
      id title state createdAt mergedAt closedAt webUrl timeEstimate totalTimeSpent
      labels { nodes { title } }
      timelogs(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id timeSpent spentAt user { id name username } note { id body } }
      }
    }
  }
}
`
        };

        return readGraphqlPages(queryData, 'mr');
    }


        async function getItem(item) {
            const href = item.href || item.taskUrl;
            const parsed = parseGitLabUrl(href);
            if (!parsed) throw new Error('Unsupported GitLab task URL');
            const group = item.groupName || parsed.projectPath.split('/').pop();
            const result = await getWorkItemDetailNew(item.createAt || item.createdAt || item.addedAt, href,
                group, item.id || parsed.iid, parsed.type === 'merge_request', { ...item, taskTitle: item.taskTitle || item.title }, token);
            if (!result) throw new Error('GitLab task is unavailable');
            return result;
        }
        return { request, getItem };
    }

    function parseGitLabUrl(url) {
        if (!url) return null;
        const cleanUrl = url.split(/[?#]/)[0].replace(/\/+$/, '');

        const workItemMatch = cleanUrl.match(/^https?:\/\/[^/]+\/(.+?)\/(?:-\/)?work_items\/(\d+)$/);
        if (workItemMatch) {
            return {
                type: 'work_item',
                projectPath: workItemMatch[1],
                iid: workItemMatch[2]
            };
        }

        const mrMatch = cleanUrl.match(/^https?:\/\/[^/]+\/(.+?)\/(?:-\/)?merge_requests\/(\d+)$/);
        if (mrMatch) {
            return {
                type: 'merge_request',
                projectPath: mrMatch[1],
                iid: mrMatch[2]
            };
        }

        const issueMatch = cleanUrl.match(/^https?:\/\/[^/]+\/(.+?)\/(?:-\/)?issues\/(\d+)$/);
        if (issueMatch) {
            return {
                type: 'issue',
                projectPath: issueMatch[1],
                iid: issueMatch[2]
            };
        }

        return null;
    }


    return { createRunner, createGitlabClient, itemKey, inHours, inSyncHours, needsDetail, settingsOf, sourceOf, stateOf, visibleItems,
        requestSync, syncBeforeExport, updateTrackedItems, mountUI, belongsToSource, activeToday };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = KpiSync;
else globalThis.KpiSync = KpiSync;
