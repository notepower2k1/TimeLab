const assert = require('assert');

console.log('--- Running GitLab Issue Summary Unit Tests ---');

let i18nModule;
try {
    i18nModule = require('../i18n.js');
    if (i18nModule && typeof i18nModule.setLanguage === 'function') {
        i18nModule.setLanguage('vi');
    }
} catch (_) {}

let contentIssueModule;
try {
    contentIssueModule = require('../content_issue.js');
} catch (err) {
    console.error('Failed to import content_issue.js:', err.message);
}

const {
    calculateChildTaskMetrics,
    filterMyChildTasks,
    resolveTaskIid,
    shouldBackfillParent,
    renderSummaryModalHtml,
    getModalStyles,
    createSummaryButton,
    findEditButtonPlacement,
    extractChildTasksFromDom,
    enrichChildTasks,
    batchAddTasksToStorage,
    fetchTaskDetail,
    parseGraphQLChildrenNodes,
    fetchParentTaskWithChildren,
    formatDateDisplay,
    filterAndSortTasks,
    renderTaskTableRows,
    refreshSummaryModal,
    openSummaryModal,
    closeSummaryModal,
    injectSummaryButton,
    findWorkItemModal,
    extractWorkItemPageInfo,
    extractWorkItemModalInfo,
    findWorkItemEditPlacement,
    createWorkItemKpiButton,
    injectWorkItemButton,
    extractTaskIdentifier,
    isTaskInList,
    removeTaskFromStorage,
    addIdToStorage,
    syncAllButtonsOnPage
} = contentIssueModule || {};

// 1. Function existence tests
assert.strictEqual(typeof calculateChildTaskMetrics, 'function', 'calculateChildTaskMetrics should be exported as a function');
assert.strictEqual(typeof filterMyChildTasks, 'function', 'filterMyChildTasks should be exported as a function');
assert.strictEqual(typeof resolveTaskIid, 'function', 'resolveTaskIid should be exported as a function');
assert.strictEqual(typeof shouldBackfillParent, 'function', 'shouldBackfillParent should be exported as a function');
assert.strictEqual(typeof renderSummaryModalHtml, 'function', 'renderSummaryModalHtml should be exported as a function');
assert.strictEqual(typeof getModalStyles, 'function', 'getModalStyles should be exported as a function');
assert.strictEqual(typeof createSummaryButton, 'function', 'createSummaryButton should be exported as a function');
assert.strictEqual(typeof findEditButtonPlacement, 'function', 'findEditButtonPlacement should be exported as a function');
assert.strictEqual(typeof extractChildTasksFromDom, 'function', 'extractChildTasksFromDom should be exported as a function');
assert.strictEqual(typeof enrichChildTasks, 'function', 'enrichChildTasks should be exported as a function');
assert.strictEqual(typeof batchAddTasksToStorage, 'function', 'batchAddTasksToStorage should be exported as a function');
assert.strictEqual(typeof fetchTaskDetail, 'function', 'fetchTaskDetail should be exported as a function');
assert.strictEqual(typeof parseGraphQLChildrenNodes, 'function', 'parseGraphQLChildrenNodes should be exported as a function');
assert.strictEqual(typeof fetchParentTaskWithChildren, 'function', 'fetchParentTaskWithChildren should be exported as a function');
assert.strictEqual(typeof formatDateDisplay, 'function', 'formatDateDisplay should be exported as a function');
assert.strictEqual(typeof filterAndSortTasks, 'function', 'filterAndSortTasks should be exported as a function');
assert.strictEqual(typeof renderTaskTableRows, 'function', 'renderTaskTableRows should be exported as a function');
assert.strictEqual(typeof refreshSummaryModal, 'function', 'refreshSummaryModal should be exported as a function');
assert.strictEqual(typeof openSummaryModal, 'function', 'openSummaryModal should be exported as a function');
assert.strictEqual(typeof closeSummaryModal, 'function', 'closeSummaryModal should be exported as a function');
assert.strictEqual(typeof injectSummaryButton, 'function', 'injectSummaryButton should be exported as a function');
assert.strictEqual(typeof findWorkItemModal, 'function', 'findWorkItemModal should be exported as a function');
assert.strictEqual(typeof extractWorkItemPageInfo, 'function', 'extractWorkItemPageInfo should be exported as a function');
assert.strictEqual(typeof extractWorkItemModalInfo, 'function', 'extractWorkItemModalInfo should be exported as a function');
assert.strictEqual(typeof findWorkItemEditPlacement, 'function', 'findWorkItemEditPlacement should be exported as a function');
assert.strictEqual(typeof createWorkItemKpiButton, 'function', 'createWorkItemKpiButton should be exported as a function');
assert.strictEqual(typeof injectWorkItemButton, 'function', 'injectWorkItemButton should be exported as a function');
assert.strictEqual(typeof extractTaskIdentifier, 'function', 'extractTaskIdentifier should be exported as a function');
assert.strictEqual(typeof isTaskInList, 'function', 'isTaskInList should be exported as a function');
assert.strictEqual(typeof removeTaskFromStorage, 'function', 'removeTaskFromStorage should be exported as a function');
assert.strictEqual(typeof addIdToStorage, 'function', 'addIdToStorage should be exported as a function');
assert.strictEqual(typeof syncAllButtonsOnPage, 'function', 'syncAllButtonsOnPage should be exported as a function');
console.log('✔ Passed: Exported functions existence check');

// 2. Metric calculation: standard scenarios
{
    const sampleTasks = [
        { id: '101', title: 'Implement login', estimateHour: 4, spentHour: 3.5, state: 'closed', isLate: false, isUnplanned: false },
        { id: '102', title: 'Fix bug in auth', estimateHour: 2, spentHour: 3, state: 'closed', isLate: true, isUnplanned: false },
        { id: '103', title: 'Refactor session', estimateHour: 5, spentHour: 1.5, state: 'opened', isLate: false, isUnplanned: true }
    ];

    const metrics = calculateChildTaskMetrics(sampleTasks);

    assert.strictEqual(metrics.totalTasks, 3, 'totalTasks must be 3');
    assert.strictEqual(metrics.totalEstimate, 11, 'totalEstimate must be 4 + 2 + 5 = 11');
    assert.strictEqual(metrics.totalSpent, 8, 'totalSpent must be 3.5 + 3 + 1.5 = 8');
    assert.strictEqual(metrics.diffHours, 3, 'diffHours must be 11 - 8 = 3');
    assert.strictEqual(metrics.openTasks, 1, 'openTasks must be 1');
    assert.strictEqual(metrics.closedTasks, 2, 'closedTasks must be 2');
    assert.strictEqual(metrics.lateTasks, 1, 'lateTasks must be 1');
    assert.strictEqual(metrics.onTimeRate, 50, 'onTimeRate must be (2 - 1) / 2 * 100 = 50%');
    assert.strictEqual(metrics.plannedCount, 2, 'plannedCount must be 2');
    assert.strictEqual(metrics.unplannedCount, 1, 'unplannedCount must be 1');
    console.log('✔ Passed: Standard metric calculations');
}

// 3. Floating point precision & string parsing
{
    const decimalTasks = [
        { estimateHour: 0.1, spentHour: 0.2, state: 'opened' },
        { estimateHour: 0.2, spentHour: 0.4, state: 'closed', isLate: false },
        { estimateHour: '2.5', spentHour: '1.2', state: 'closed', isLate: false }
    ];

    const metrics = calculateChildTaskMetrics(decimalTasks);

    assert.strictEqual(metrics.totalTasks, 3);
    assert.strictEqual(metrics.totalEstimate, 2.8, '0.1 + 0.2 + 2.5 = 2.8');
    assert.strictEqual(metrics.totalSpent, 1.8, '0.2 + 0.4 + 1.2 = 1.8');
    assert.strictEqual(metrics.diffHours, 1, '2.8 - 1.8 = 1.0');
    assert.strictEqual(metrics.onTimeRate, 100, '2 closed tasks, 0 late = 100%');
    console.log('✔ Passed: Floating point precision and string value handling');
}

// 4. Edge cases: empty list, null/undefined, 0 closed tasks, all late
{
    const emptyMetrics = calculateChildTaskMetrics([]);
    assert.strictEqual(emptyMetrics.totalTasks, 0);
    assert.strictEqual(emptyMetrics.totalEstimate, 0);
    assert.strictEqual(emptyMetrics.totalSpent, 0);
    assert.strictEqual(emptyMetrics.diffHours, 0);
    assert.strictEqual(emptyMetrics.openTasks, 0);
    assert.strictEqual(emptyMetrics.closedTasks, 0);
    assert.strictEqual(emptyMetrics.lateTasks, 0);
    assert.strictEqual(emptyMetrics.onTimeRate, 100, 'Default onTimeRate with 0 closed tasks should be 100');
    assert.strictEqual(emptyMetrics.plannedCount, 0);
    assert.strictEqual(emptyMetrics.unplannedCount, 0);

    const nullMetrics = calculateChildTaskMetrics(null);
    assert.strictEqual(nullMetrics.totalTasks, 0);
    assert.strictEqual(nullMetrics.onTimeRate, 100);

    // Only open tasks (closed = 0)
    const openOnlyTasks = [
        { estimateHour: 5, spentHour: 2, state: 'opened', isLate: false }
    ];
    const openMetrics = calculateChildTaskMetrics(openOnlyTasks);
    assert.strictEqual(openMetrics.closedTasks, 0);
    assert.strictEqual(openMetrics.onTimeRate, 100, 'When no closed tasks exist, onTimeRate is 100%');

    // All closed tasks are late
    const allLateTasks = [
        { estimateHour: 3, spentHour: 4, state: 'closed', isLate: true },
        { estimateHour: 2, spentHour: 2, state: 'closed', isLate: true }
    ];
    const lateMetrics = calculateChildTaskMetrics(allLateTasks);
    assert.strictEqual(lateMetrics.closedTasks, 2);
    assert.strictEqual(lateMetrics.lateTasks, 2);
    assert.strictEqual(lateMetrics.onTimeRate, 0, 'When all closed tasks are late, onTimeRate is 0%');
    console.log('✔ Passed: Edge cases (empty, null, open only, all late)');
}

// 5. Child task filtering tests
{
    const items = [
        { id: '1', title: 'Task 1', href: '/tasks/1', assigneeUrl: 'https://gitlab.com/john' },
        { id: '2', title: 'Task 2', href: '/tasks/2', assigneeUrl: 'https://gitlab.com/alice' },
        { id: '3', title: 'Task 3', href: '/tasks/3', assigneeUrl: 'https://gitlab.com/john' },
        { id: '4', title: 'Task 4', href: '/tasks/4' } // unassigned
    ];

    const johnTasks = filterMyChildTasks(items, 'https://gitlab.com/john');
    assert.strictEqual(johnTasks.length, 2);
    assert.strictEqual(johnTasks[0].id, '1');
    assert.strictEqual(johnTasks[1].id, '3');

    const aliceTasks = filterMyChildTasks(items, 'https://gitlab.com/alice');
    assert.strictEqual(aliceTasks.length, 1);
    assert.strictEqual(aliceTasks[0].id, '2');

    // When userProfileUrl is null or empty, returns all items
    const allItems = filterMyChildTasks(items, null);
    assert.strictEqual(allItems.length, 4);

    const allItemsEmptyUrl = filterMyChildTasks(items, '');
    assert.strictEqual(allItemsEmptyUrl.length, 4);

    // Empty list or invalid items
    assert.deepStrictEqual(filterMyChildTasks([], 'https://gitlab.com/john'), []);
    assert.deepStrictEqual(filterMyChildTasks(null, 'https://gitlab.com/john'), []);
    console.log('✔ Passed: Child task filtering by assignee');
}

// 6. Modal HTML rendering tests
{
    const sampleTasks = [
        {
            id: '101',
            title: 'Task Alpha <script>',
            href: 'https://gitlab.com/group/project/-/work_items/101',
            estimateHour: 4,
            spentHour: 3.5,
            diffHour: 0.5,
            state: 'closed',
            isLate: false,
            isUnplanned: false
        },
        {
            id: '102',
            title: 'Task Beta & Gamma',
            href: 'https://gitlab.com/group/project/-/work_items/102',
            estimateHour: 2,
            spentHour: 3,
            diffHour: -1,
            state: 'opened',
            isLate: false,
            isUnplanned: true
        }
    ];

    const metrics = calculateChildTaskMetrics(sampleTasks);
    const parentTitle = 'Parent Epic "Core Feature"';

    const html = renderSummaryModalHtml(metrics, sampleTasks, parentTitle);

    // Structural elements
    assert.ok(html.includes('id="gitlabKpiSummaryModal"'), 'Must contain modal overlay id');
    assert.ok(html.includes('class="gl-kpi-modal-overlay"'), 'Must have modal overlay class');
    assert.ok(html.includes('id="glKpiAddAllBtn"'), 'Must contain Add All button');
    assert.ok(html.includes('id="glKpiRefreshBtn"'), 'Must contain Refresh button');
    assert.ok(html.includes('id="glKpiCloseBtn"'), 'Must contain Close button');
    assert.ok(html.includes('id="glKpiTableBody"'), 'Must contain Table Body container');

    // Content & metrics assertions
    assert.ok(html.includes('Parent Epic &quot;Core Feature&quot;') || html.includes('Parent Epic &#39;Core Feature&#39;') || html.includes('Parent Epic "Core Feature"') || html.includes('Core Feature'), 'Must display parent title');
    assert.ok(html.includes('6h') || html.includes('6.0h') || html.includes('6'), 'Must display total estimate');
    assert.ok(html.includes('6.5h') || html.includes('6.5'), 'Must display total spent');
    assert.ok(html.includes('100%'), 'Must display on-time rate for closed tasks (1 closed, 0 late)');

    // Row contents & XSS safety
    assert.ok(html.includes('&lt;script&gt;'), 'Must sanitize XSS characters in title');
    assert.ok(!html.includes('<script>'), 'Must NOT contain raw script tag');
    assert.ok(html.includes('Task Beta &amp; Gamma') || html.includes('Task Beta & Gamma'), 'Must render Task Beta');
    assert.ok(html.includes('https://gitlab.com/group/project/-/work_items/101'), 'Must include task link');

    // Empty tasks rendering
    const emptyHtml = renderSummaryModalHtml(calculateChildTaskMetrics([]), [], 'Empty Parent');
    assert.ok(emptyHtml.includes('id="gitlabKpiSummaryModal"'));
    assert.ok(emptyHtml.includes('id="glKpiTableBody"'));
    assert.ok(
        emptyHtml.toLowerCase().includes('không tìm thấy') ||
        emptyHtml.toLowerCase().includes('không có task') ||
        emptyHtml.toLowerCase().includes('no matching') ||
        emptyHtml.toLowerCase().includes('no child tasks'),
        'Empty state message'
    );

    console.log('✔ Passed: Modal HTML rendering and escaping');
}

// 7. Reviewer polish: onTimeRate does not drop from open late tasks, and handles sparse arrays
{
    // 2 closed tasks (both on-time: isLate = false) and 1 open task (isLate = true)
    const mixedTasks = [
        { id: '1', state: 'closed', isLate: false, estimateHour: 2, spentHour: 2 },
        { id: '2', state: 'closed', isLate: false, estimateHour: 3, spentHour: 3 },
        { id: '3', state: 'opened', isLate: true, estimateHour: 1, spentHour: 1 }
    ];
    const metrics = calculateChildTaskMetrics(mixedTasks);
    assert.strictEqual(metrics.closedTasks, 2, 'Closed tasks count should be 2');
    assert.strictEqual(metrics.openTasks, 1, 'Open tasks count should be 1');
    assert.strictEqual(metrics.lateTasks, 1, 'Total late tasks count should be 1');
    assert.strictEqual(metrics.onTimeRate, 100, 'onTimeRate must be 100% since both closed tasks finished on time');

    // Sparse array with undefined / null items
    const sparseTasks = [
        null,
        { id: '1', state: 'closed', isLate: false, estimateHour: 2, spentHour: 1.5 },
        undefined,
        { id: '2', state: 'opened', isLate: false, estimateHour: 1, spentHour: 0.5 }
    ];
    const sparseMetrics = calculateChildTaskMetrics(sparseTasks);
    assert.strictEqual(sparseMetrics.totalTasks, 2, 'Total tasks should count only valid items');
    assert.strictEqual(sparseMetrics.totalEstimate, 3);
    assert.strictEqual(sparseMetrics.totalSpent, 2);

    // renderSummaryModalHtml safely handles 0h estimate and spent
    const zeroTask = [{ id: '0', title: 'Zero task', estimateHour: 0, spentHour: 0, state: 'opened' }];
    const zeroHtml = renderSummaryModalHtml(calculateChildTaskMetrics(zeroTask), zeroTask, 'Parent Zero');
    assert.ok(zeroHtml.includes('0h') || zeroHtml.includes('+0h'), 'Must display 0h for 0 estimate and spent');

    console.log('✔ Passed: Reviewer polish tests (open late tasks, sparse arrays, zero hours)');
}

// Lightweight Mock DOM for Node.js testing
class MockElement {
    constructor(tagName, options = {}) {
        this.tagName = (tagName || 'div').toUpperCase();
        this.id = options.id || '';
        this.className = options.className || '';
        this.attributes = { ...(options.attributes || {}) };
        this.children = [];
        this.parentNode = null;
        this._innerHTML = options.innerHTML || '';
        this.innerText = options.innerText || '';
        this.style = {};
        this.eventListeners = {};
        if (options.innerHTML) {
            this.innerHTML = options.innerHTML;
        }
    }

    get firstElementChild() {
        return this.children[0] || null;
    }

    get innerHTML() {
        return this._innerHTML || '';
    }

    set innerHTML(val) {
        this._innerHTML = val;
        this.children = [];

        if (typeof val !== 'string') return;

        // If val contains #gitlabKpiSummaryModal, make it the root child
        if (val.includes('id="gitlabKpiSummaryModal"') && this.id !== 'gitlabKpiSummaryModal') {
            const modalRoot = new MockElement('div', { id: 'gitlabKpiSummaryModal' });
            modalRoot.parentNode = this;
            this.children.push(modalRoot);
            modalRoot.innerHTML = val;
            return;
        }

        const idMatches = [...val.matchAll(/id="([^"]+)"/g)];
        for (const m of idMatches) {
            const childId = m[1];
            if (childId !== this.id) {
                const child = new MockElement('div', { id: childId });
                child.parentNode = this;
                this.children.push(child);
            }
        }

        const rowBtnMatches = [...val.matchAll(/<button[^>]*class="([^"]*gl-kpi-row-add-btn[^"]*)"[^>]*data-task-id="([^"]+)"[^>]*data-task-href="([^"]*)"[^>]*data-is-added="([^"]+)"/g)];
        for (const m of rowBtnMatches) {
            const btn = new MockElement('button', {
                className: m[1],
                attributes: {
                    'data-task-id': m[2],
                    'data-task-href': m[3],
                    'data-is-added': m[4]
                }
            });
            btn.parentNode = this;
            this.children.push(btn);
        }
    }

    getAttribute(name) {
        if (name === 'id') return this.id || null;
        if (name === 'class') return this.className || null;
        return this.attributes[name] !== undefined ? this.attributes[name] : null;
    }

    setAttribute(name, val) {
        if (name === 'id') this.id = String(val);
        else if (name === 'class') this.className = String(val);
        else this.attributes[name] = String(val);
    }

    get classList() {
        return {
            contains: (cls) => this.className.split(/\s+/).filter(Boolean).includes(cls),
            add: (cls) => {
                if (!this.classList.contains(cls)) {
                    this.className = (this.className + ' ' + cls).trim();
                }
            },
            remove: (cls) => {
                this.className = this.className.split(/\s+/).filter(c => c !== cls).join(' ');
            }
        };
    }

    closest(selector) {
        let curr = this;
        while (curr) {
            if (selector.startsWith('.') && curr.classList && curr.classList.contains(selector.slice(1))) {
                return curr;
            }
            if (selector.startsWith('#') && curr.id === selector.slice(1)) {
                return curr;
            }
            if (selector.includes('data-testid="')) {
                const m = selector.match(/data-testid="([^"]+)"/);
                if (m && curr.getAttribute && curr.getAttribute('data-testid') === m[1]) {
                    return curr;
                }
            }
            if (curr.tagName && curr.tagName.toLowerCase() === selector.toLowerCase()) {
                return curr;
            }
            curr = curr.parentNode;
        }
        return null;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    append(...children) {
        children.forEach(c => this.appendChild(c));
    }

    prepend(child) {
        child.parentNode = this;
        this.children.unshift(child);
    }

    remove() {
        if (this.parentNode) {
            const idx = this.parentNode.children.indexOf(this);
            if (idx !== -1) {
                this.parentNode.children.splice(idx, 1);
            }
            this.parentNode = null;
        }
    }

    after(el) {
        if (!this.parentNode) return;
        const idx = this.parentNode.children.indexOf(this);
        el.parentNode = this.parentNode;
        this.parentNode.children.splice(idx + 1, 0, el);
    }

    before(el) {
        if (!this.parentNode) return;
        const idx = this.parentNode.children.indexOf(this);
        el.parentNode = this.parentNode;
        this.parentNode.children.splice(idx, 0, el);
    }

    addEventListener(event, fn) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(fn);
    }

    removeEventListener(event, fn) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(h => h !== fn);
        }
    }

    async dispatchEvent(event) {
        const list = this.eventListeners[event.type || event] || [];
        for (const fn of list) {
            await fn(event);
        }
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const results = [];
        const match = (el) => {
            const selList = selector.split(',').map(s => s.trim());
            for (const s of selList) {
                if (s.startsWith('#') && el.id === s.slice(1)) return true;
                if (s.startsWith('.') && el.classList.contains(s.slice(1))) return true;
                if (s.startsWith('[data-testid="') && s.endsWith('"]')) {
                    const tid = s.slice(14, -2);
                    if (el.getAttribute('data-testid') === tid) return true;
                }
                if (s.toLowerCase() === el.tagName.toLowerCase()) return true;
                if (s.includes('.') && !s.includes('>') && !s.includes('[')) {
                    const dotParts = s.split('.');
                    const tag = dotParts[0];
                    const cls = dotParts[1];
                    if ((!tag || el.tagName.toLowerCase() === tag.toLowerCase()) && el.classList.contains(cls)) return true;
                }
                if (s === 'button.js-issuable-edit') {
                    if (el.tagName === 'BUTTON' && el.classList.contains('js-issuable-edit')) return true;
                }
                if (s === 'h1.title') {
                    if (el.tagName === 'H1' && el.classList.contains('title')) return true;
                }
                if (s === 'div.gl-avatars-inline-child > a') {
                    if (el.tagName === 'A' && el.parentNode && el.parentNode.tagName === 'DIV' && el.parentNode.classList.contains('gl-avatars-inline-child')) return true;
                }
                if (s === 'ul[data-testid="child-items-container"] > li.tree-item') {
                    if (el.tagName === 'LI' && el.classList.contains('tree-item') && el.parentNode && el.parentNode.getAttribute('data-testid') === 'child-items-container') return true;
                }
                if (s === 'div[data-testid="links-child"]') {
                    if (el.tagName === 'DIV' && el.getAttribute('data-testid') === 'links-child') return true;
                }
                if (s.includes('[href*="') && s.endsWith('"]')) {
                    const matchPattern = s.match(/^(?:([a-zA-Z0-9_-]+))?\[href\*="([^"]+)"\]$/);
                    if (matchPattern) {
                        const tag = matchPattern[1];
                        const val = matchPattern[2];
                        const href = el.getAttribute('href') || el.href || '';
                        if ((!tag || el.tagName.toLowerCase() === tag.toLowerCase()) && href.includes(val)) return true;
                    }
                }
            }
            return false;
        };

        const traverse = (node) => {
            for (const child of node.children) {
                if (match(child)) results.push(child);
                traverse(child);
            }
        };
        traverse(this);
        return results;
    }
}

class MockDocument {
    constructor() {
        this.head = new MockElement('head');
        this.body = new MockElement('body');
        this.documentElement = new MockElement('html');
        this.documentElement.appendChild(this.head);
        this.documentElement.appendChild(this.body);
        this.eventListeners = {};
    }
    createElement(tag) {
        return new MockElement(tag);
    }
    getElementById(id) {
        return this.querySelector('#' + id);
    }
    querySelector(selector) {
        if (selector === 'head') return this.head;
        if (selector === 'body') return this.body;
        return this.documentElement.querySelector(selector);
    }
    querySelectorAll(selector) {
        return this.documentElement.querySelectorAll(selector);
    }
    addEventListener(event, fn) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(fn);
    }
    removeEventListener(event, fn) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(h => h !== fn);
        }
    }
    dispatchEvent(event) {
        const list = this.eventListeners[event.type || event] || [];
        for (const fn of list) {
            fn(event);
        }
    }
}

// 8. Scoped Modal CSS test
{
    const css = getModalStyles();
    assert.ok(typeof css === 'string' && css.length > 50, 'CSS string should be non-empty');
    assert.ok(css.includes('#gitlabKpiSummaryModal') || css.includes('.gl-kpi-modal-overlay'), 'Should style overlay');
    assert.ok(css.includes('.gl-kpi-modal-dialog'), 'Should style dialog');
    assert.ok(css.includes('.gl-kpi-summary-grid'), 'Should style summary grid');
    assert.ok(css.includes('.gl-kpi-card'), 'Should style cards');
    assert.ok(css.includes('.gl-kpi-table'), 'Should style table');
    assert.ok(css.includes('.custom-summary-button'), 'Should style injected button');
    console.log('✔ Passed: Scoped modal CSS generation');
}

// 9. Summary Button Creation
{
    const mockDoc = new MockDocument();
    const btn = createSummaryButton(mockDoc);
    assert.strictEqual(btn.id, 'kpiSummaryTasksBtn', 'Button id must be kpiSummaryTasksBtn');
    assert.ok(btn.classList.contains('gl-button'), 'Button should have gl-button class');
    assert.ok(btn.classList.contains('custom-summary-button'), 'Button should have custom-summary-button class');
    assert.ok(btn.innerHTML.includes('Tổng hợp task'), 'Button content should contain "Tổng hợp task"');
    console.log('✔ Passed: Summary button element creation');
}

// 10. Placement Resolver & Button Injection
{
    // Test resolving [data-testid="edit-title-button"]
    const doc1 = new MockDocument();
    const editBtn1 = new MockElement('button', { attributes: { 'data-testid': 'edit-title-button' } });
    doc1.body.appendChild(editBtn1);

    const placement1 = findEditButtonPlacement(doc1);
    assert.strictEqual(placement1.target, editBtn1);

    // Test resolving button.js-issuable-edit
    const doc2 = new MockDocument();
    const editBtn2 = new MockElement('button', { className: 'btn js-issuable-edit' });
    doc2.body.appendChild(editBtn2);

    const placement2 = findEditButtonPlacement(doc2);
    assert.strictEqual(placement2.target, editBtn2);

    // Test resolving fallback header actions container
    const doc3 = new MockDocument();
    const headerActions = new MockElement('div', { className: 'detail-page-header-actions' });
    doc3.body.appendChild(headerActions);

    const placement3 = findEditButtonPlacement(doc3);
    assert.strictEqual(placement3.target, headerActions);

    // Test resolving fallback title
    const doc4 = new MockDocument();
    const titleEl = new MockElement('h1', { className: 'title', innerText: 'Sample Issue' });
    doc4.body.appendChild(titleEl);

    const placement4 = findEditButtonPlacement(doc4);
    assert.strictEqual(placement4.target, titleEl);

    // Test injectSummaryButton
    const injectedBtn = injectSummaryButton(doc1);
    assert.ok(injectedBtn, 'Should return injected button');
    assert.strictEqual(doc1.getElementById('kpiSummaryTasksBtn'), injectedBtn);

    // Duplicate injection guard
    const secondCall = injectSummaryButton(doc1);
    assert.strictEqual(secondCall, injectedBtn, 'Second injection call should return existing button without duplicating');
    const allButtons = doc1.body.querySelectorAll('#kpiSummaryTasksBtn');
    assert.strictEqual(allButtons.length, 1, 'There must only be 1 summary button in the DOM');

    console.log('✔ Passed: Button placement resolution & duplicate-guarded injection');
}

// 11. Child Tasks Extraction from DOM
{
    const doc = new MockDocument();
    const ul = new MockElement('ul', { attributes: { 'data-testid': 'child-items-container' } });
    doc.body.appendChild(ul);

    // Item 1: Closed child task assigned to Alice
    const li1 = new MockElement('li', { className: 'tree-item gl-badge-closed' });
    const linkChild1 = new MockElement('div', { attributes: { 'data-testid': 'links-child', 'parent-work-item-id': '201' } });
    const a1 = new MockElement('a', { attributes: { href: 'https://gitlab.com/grp/prj/-/work_items/201' }, innerText: 'Child Feature A' });
    const avatarContainer1 = new MockElement('div', { className: 'gl-avatars-inline-child' });
    const avatarLink1 = new MockElement('a', { attributes: { href: 'https://gitlab.com/alice' } });
    avatarContainer1.appendChild(avatarLink1);
    li1.appendChild(linkChild1);
    li1.appendChild(a1);
    li1.appendChild(avatarContainer1);
    ul.appendChild(li1);

    // Item 2: Open child task assigned to Bob
    const li2 = new MockElement('li', { className: 'tree-item' });
    const linkChild2 = new MockElement('div', { attributes: { 'data-testid': 'links-child', 'parent-work-item-id': '202' } });
    const a2 = new MockElement('a', { attributes: { href: 'https://gitlab.com/grp/prj/-/work_items/202' }, innerText: 'Child Bugfix B' });
    const avatarContainer2 = new MockElement('div', { className: 'gl-avatars-inline-child' });
    const avatarLink2 = new MockElement('a', { attributes: { href: 'https://gitlab.com/bob' } });
    avatarContainer2.appendChild(avatarLink2);
    li2.appendChild(linkChild2);
    li2.appendChild(a2);
    li2.appendChild(avatarContainer2);
    ul.appendChild(li2);

    const extracted = extractChildTasksFromDom(doc);
    assert.strictEqual(extracted.length, 2, 'Should extract 2 child tasks');
    assert.strictEqual(extracted[0].id, '201');
    assert.strictEqual(extracted[0].title, 'Child Feature A');
    assert.strictEqual(extracted[0].assigneeUrl, 'https://gitlab.com/alice');
    assert.strictEqual(extracted[0].state, 'closed');

    assert.strictEqual(extracted[1].id, '202');
    assert.strictEqual(extracted[1].title, 'Child Bugfix B');
    assert.strictEqual(extracted[1].assigneeUrl, 'https://gitlab.com/bob');
    assert.strictEqual(extracted[1].state, 'opened');

    console.log('✔ Passed: Child tasks extraction from DOM');
}

// 12. Child Tasks Enrichment
{
    const rawTasks = [
        { id: '201', href: 'https://gitlab.com/grp/prj/-/work_items/201', title: 'Task 1', assigneeUrl: 'https://gitlab.com/alice', state: 'closed' },
        { id: '202', href: 'https://gitlab.com/grp/prj/-/work_items/202', title: 'Task 2', assigneeUrl: 'https://gitlab.com/bob', state: 'opened' },
        { id: '203', href: 'https://gitlab.com/grp/prj/-/work_items/203', title: 'Task 3', assigneeUrl: 'https://gitlab.com/alice', state: 'opened' }
    ];

    const storedKpi = [
        { id: '201', estimate: 4, spent: 3.5, progress: 'Đúng hạn', type: 'Kế hoạch', state: 'closed' }
        // Task 203 is missing from cache
    ];

    const userProfile = { web_url: 'https://gitlab.com/alice' };

    const enriched = enrichChildTasks(rawTasks, userProfile, storedKpi);
    assert.strictEqual(enriched.length, 2, 'Should only include Alice tasks (201 and 203)');

    // 201: Cached
    assert.strictEqual(enriched[0].id, '201');
    assert.strictEqual(enriched[0].estimateHour, 4);
    assert.strictEqual(enriched[0].spentHour, 3.5);
    assert.strictEqual(enriched[0].diffHour, 0.5);
    assert.strictEqual(enriched[0].isLate, false);
    assert.strictEqual(enriched[0].isUnplanned, false);

    // 203: Not in cache, has safe defaults
    assert.strictEqual(enriched[1].id, '203');
    assert.strictEqual(enriched[1].estimateHour, 0);
    assert.strictEqual(enriched[1].spentHour, 0);
    assert.strictEqual(enriched[1].diffHour, 0);
    assert.strictEqual(enriched[1].isLate, false);

    console.log('✔ Passed: Child tasks enrichment with storage cache');
}

// 13. Batch Add Tasks to Storage Logic
{
    const userTasks = [
        { id: '301', href: '/tasks/301', title: 'Task 301' },
        { id: '302', href: '/tasks/302', title: 'Task 302' }
    ];
    const parentInfo = { parentTitle: 'Parent Epic #10', parentUrl: '/issues/10', parentIid: '10' };
    const currentStored = [
        { id: '301', href: '/tasks/301', createAt: 'yesterday', parentTitle: '' }
    ];

    const result = batchAddTasksToStorage(userTasks, parentInfo, currentStored);
    assert.strictEqual(result.addedCount, 1, 'Should add 1 new task (302)');
    assert.strictEqual(result.updatedList.length, 2, 'Total list length should be 2');

    // 301 should have parentTitle updated
    const task301 = result.updatedList.find(t => t.id === '301');
    assert.strictEqual(task301.parentTitle, 'Parent Epic #10');

    // 302 should be newly added with parent metadata
    const task302 = result.updatedList.find(t => t.id === '302');
    assert.strictEqual(task302.id, '302');
    assert.strictEqual(task302.parentTitle, 'Parent Epic #10');
    assert.strictEqual(task302.parentUrl, '/issues/10');
    assert.strictEqual(task302.taskTitle, 'Task 302');

    console.log('✔ Passed: Batch add tasks calculation & parent backfilling');
}

// 14. Modal Lifecycle (Open, Close, Backdrop, Escape)
{
    const doc = new MockDocument();
    const parentInfo = { parentTitle: 'Sprint Epic', parentUrl: '/issues/99', parentIid: '99' };
    const sampleTasks = [
        { id: '401', title: 'Task 401', href: '/tasks/401', estimateHour: 4, spentHour: 2, state: 'closed', isLate: false }
    ];

    // Open modal
    const modalEl = openSummaryModal(parentInfo, sampleTasks, doc);
    assert.ok(modalEl, 'Modal element must be returned');
    assert.strictEqual(doc.body.children[0].id, 'gitlabKpiSummaryModal', 'Modal should be attached to body');

    // Close modal
    closeSummaryModal(doc);
    assert.strictEqual(doc.getElementById('gitlabKpiSummaryModal'), null, 'Modal should be removed from body');

    // Re-open and test Escape key dispatch
    openSummaryModal(parentInfo, sampleTasks, doc);
    assert.ok(doc.getElementById('gitlabKpiSummaryModal') !== null);
    doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert.strictEqual(doc.getElementById('gitlabKpiSummaryModal'), null, 'Modal should close on Escape key');

    console.log('✔ Passed: Modal open, close, and Escape key lifecycle');
}

// 15. Robust IID Resolution Tests
{
    // Extract IID from work_items href
    const taskWithWorkItem = { id: 'gid://gitlab/WorkItem/9999', href: 'https://gitlab.example.com/team/app/-/work_items/456' };
    assert.strictEqual(resolveTaskIid(taskWithWorkItem), '456', 'Should extract IID 456 from work_items href');

    // Extract IID from issues href
    const taskWithIssue = { id: 'gid://gitlab/WorkItem/8888', href: '/team/app/-/issues/789' };
    assert.strictEqual(resolveTaskIid(taskWithIssue), '789', 'Should extract IID 789 from issues href');

    // Fall back to task.id when href is absent or lacks work_items/issues
    const taskFallback = { id: '101', href: 'https://gitlab.example.com/team/app' };
    assert.strictEqual(resolveTaskIid(taskFallback), '101', 'Should fall back to task.id when href has no issue/work_item segment');

    const taskNoHref = { id: '202' };
    assert.strictEqual(resolveTaskIid(taskNoHref), '202', 'Should fall back to task.id when href is undefined');

    // Primitive number / string inputs
    assert.strictEqual(resolveTaskIid(303), '303', 'Should handle numeric input');
    assert.strictEqual(resolveTaskIid('/issues/505'), '505', 'Should extract IID from raw issue path');
    assert.strictEqual(resolveTaskIid('work_items/606'), '606', 'Should extract IID from raw work_items path');

    // Null / empty edge cases
    assert.strictEqual(resolveTaskIid(null), '', 'Should return empty string for null');
    assert.strictEqual(resolveTaskIid(undefined), '', 'Should return empty string for undefined');

    console.log('✔ Passed: Robust IID resolution (href regex priority over task.id)');
}

// 16. Parent Backfill Cache Guard Tests
{
    const tasksMap = new Map([
        ['10', { href: '/tasks/10', title: 'Task 10' }],
        ['20', { href: '/tasks/20', title: 'Task 20' }]
    ]);
    const backfilledSet = new Set(['10', '20']);

    // Case 1: All tasks already backfilled and same parent title -> should NOT backfill
    assert.strictEqual(
        shouldBackfillParent(tasksMap, backfilledSet, 'Parent Issue A', 'Parent Issue A'),
        false,
        'Should skip backfill when all tasks are cached and title matches'
    );

    // Case 2: New task ID not yet backfilled -> SHOULD backfill
    const newTasksMap = new Map([
        ['10', { href: '/tasks/10', title: 'Task 10' }],
        ['30', { href: '/tasks/30', title: 'Task 30' }]
    ]);
    assert.strictEqual(
        shouldBackfillParent(newTasksMap, backfilledSet, 'Parent Issue A', 'Parent Issue A'),
        true,
        'Should trigger backfill when a new task ID is present'
    );

    // Case 3: Parent title changed -> SHOULD backfill
    assert.strictEqual(
        shouldBackfillParent(tasksMap, backfilledSet, 'Parent Issue A', 'Parent Issue B (Renamed)'),
        true,
        'Should trigger backfill when parent title changed'
    );

    // Case 4: Empty current tasks or empty title -> should NOT backfill
    assert.strictEqual(shouldBackfillParent(new Map(), backfilledSet, 'A', 'A'), false);
    assert.strictEqual(shouldBackfillParent(tasksMap, backfilledSet, 'A', ''), false);

    console.log('✔ Passed: Parent backfill cache guard (prevents repeated storage queries on continuous mutations)');
}

// 17. GraphQL Dynamic Origin & Custom Endpoint Tests
(async () => {
    let fetchCalls = [];
    const originalFetch = global.fetch;
    const originalWindow = global.window;

    global.fetch = async (url, options) => {
        fetchCalls.push({ url, options });
        return {
            json: async () => ({
                data: {
                    workspace: {
                        workItem: {
                            id: 'gid://gitlab/WorkItem/999',
                            iid: '999',
                            title: 'Live Task',
                            state: 'opened'
                        }
                    }
                }
            })
        };
    };

    try {
        // Test 1: Dynamic origin from window.location.origin
        global.window = {
            location: {
                origin: 'https://gitlab.custom-domain.org'
            }
        };

        const resDynamic = await fetchTaskDetail('my-group/my-project', { href: '/my-group/my-project/-/work_items/555' }, 'dummy-token-123');

        assert.strictEqual(fetchCalls.length, 1);
        assert.strictEqual(fetchCalls[0].url, 'https://gitlab.custom-domain.org/api/graphql', 'Should use dynamic origin + /api/graphql');
        const body1 = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(body1.variables.iid, '555', 'Should extract IID from href in GraphQL query variables');
        assert.strictEqual(body1.variables.fullPath, 'my-group/my-project');
        assert.strictEqual(resDynamic.iid, '999');

        // Test 2: Fallback when window is undefined
        fetchCalls = [];
        delete global.window;

        await fetchTaskDetail('my-group/my-project', '777', 'dummy-token-456');
        assert.strictEqual(fetchCalls.length, 1);
        assert.strictEqual(fetchCalls[0].url, 'https://gitlab.widosoft.com/api/graphql', 'Should fall back to default origin');
        const body2 = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(body2.variables.iid, '777');

        // Test 3: Custom endpoint override
        fetchCalls = [];
        await fetchTaskDetail('my-group/my-project', '888', 'dummy-token-789', 'https://test-gitlab.internal/api/graphql');
        assert.strictEqual(fetchCalls.length, 1);
        assert.strictEqual(fetchCalls[0].url, 'https://test-gitlab.internal/api/graphql', 'Should support custom endpoint parameter');

        // Test 4: Network error resilience
        global.fetch = async () => {
            throw new Error('Network timeout');
        };
        const originalWarn = console.warn;
        console.warn = () => {};
        const errorResult = await fetchTaskDetail('my-group/my-project', '999', 'token');
        console.warn = originalWarn;
        assert.strictEqual(errorResult, null, 'Should catch network errors and return null safely');

    } finally {
        global.fetch = originalFetch;
        global.window = originalWindow;
    }

    console.log('✔ Passed: GraphQL dynamic endpoint origin, custom endpoints, and error handling');

    // 18. Auto-Sync Status & refreshSummaryModal Tests
    {
        // Test 1: renderSummaryModalHtml shows syncing status when isSyncing: true
        const syncHtml = renderSummaryModalHtml(null, [], 'My Epic', { isSyncing: true });
        assert.ok(syncHtml.includes('gl-kpi-sync-status'), 'Should contain gl-kpi-sync-status when isSyncing is true');
        assert.ok(syncHtml.includes('Đang quét danh sách task con'), 'Should show scanning message when isSyncing is true and tasks are empty');

        // Test 2: refreshSummaryModal function contract
        assert.strictEqual(typeof refreshSummaryModal, 'function');
        const nullResult = await refreshSummaryModal(null);
        assert.strictEqual(nullResult, null, 'Should return null gracefully if doc is null');

        // Test 3: refreshSummaryModal returns null if modal is closed
        const doc = new MockDocument();
        const closedResult = await refreshSummaryModal(doc, { parentTitle: 'Test' }, { waitForDom: false });
        assert.strictEqual(closedResult, null, 'Should return null if modal is not currently in DOM');

        console.log('✔ Passed: Auto-sync status rendering and refreshSummaryModal lifecycle');
    }

    // 19. Multi-page Hierarchy WorkItem Children GraphQL Extraction & Parsing
    {
        // Test 1: parseGraphQLChildrenNodes with various widgets, assignees, dates, unplanned labels
        const mockChildrenNodes = [
            {
                id: 'gid://gitlab/WorkItem/301',
                iid: '301',
                title: 'Child Task One',
                state: 'closed',
                closedAt: '2026-10-02T10:00:00Z',
                webUrl: 'https://gitlab.widosoft.com/grp/prj/-/work_items/301',
                widgets: [
                    {
                        type: 'TIME_TRACKING',
                        timeEstimate: 14400, // 4 hours
                        totalTimeSpent: 10800 // 3 hours
                    },
                    {
                        type: 'START_AND_DUE_DATE',
                        dueDate: '2026-10-01' // closedAt is 2026-10-02 > dueDate -> isLate = true
                    },
                    {
                        type: 'LABELS',
                        labels: {
                            nodes: [
                                { title: 'Bug' },
                                { title: 'UNPLANNED' }
                            ]
                        }
                    },
                    {
                        type: 'ASSIGNEES',
                        assignees: {
                            nodes: [
                                { id: 'gid://gitlab/User/1', name: 'Alice', username: 'alice', webUrl: 'https://gitlab.widosoft.com/alice' }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'gid://gitlab/WorkItem/302',
                iid: '302',
                title: 'Child Task Two',
                state: 'opened',
                closedAt: null,
                webUrl: 'https://gitlab.widosoft.com/grp/prj/-/work_items/302',
                widgets: [
                    {
                        type: 'TIME_TRACKING',
                        timeEstimate: 7200, // 2 hours
                        totalTimeSpent: 7200 // 2 hours
                    },
                    {
                        type: 'START_AND_DUE_DATE',
                        dueDate: '2026-10-05'
                    },
                    {
                        type: 'LABELS',
                        labels: {
                            nodes: [
                                { title: 'Feature' }
                            ]
                        }
                    },
                    {
                        type: 'ASSIGNEES',
                        assignees: {
                            nodes: [
                                { id: 'gid://gitlab/User/2', name: 'Bob', username: 'bob', webUrl: 'https://gitlab.widosoft.com/bob' }
                            ]
                        }
                    }
                ]
            }
        ];

        const parsed = parseGraphQLChildrenNodes(mockChildrenNodes);
        assert.strictEqual(parsed.length, 2, 'Should parse 2 child items');

        // Check task 1
        assert.strictEqual(parsed[0].id, '301');
        assert.strictEqual(parsed[0].title, 'Child Task One');
        assert.strictEqual(parsed[0].estimateHour, 4);
        assert.strictEqual(parsed[0].spentHour, 3);
        assert.strictEqual(parsed[0].diffHour, 1);
        assert.strictEqual(parsed[0].state, 'closed');
        assert.strictEqual(parsed[0].isLate, true, 'Task 1 closed after due date should be late');
        assert.strictEqual(parsed[0].isUnplanned, true, 'Task 1 with UNPLANNED label should be unplanned');
        assert.strictEqual(parsed[0].assigneeUrl, 'https://gitlab.widosoft.com/alice');

        // Check task 2
        assert.strictEqual(parsed[1].id, '302');
        assert.strictEqual(parsed[1].title, 'Child Task Two');
        assert.strictEqual(parsed[1].estimateHour, 2);
        assert.strictEqual(parsed[1].spentHour, 2);
        assert.strictEqual(parsed[1].diffHour, 0);
        assert.strictEqual(parsed[1].state, 'opened');
        assert.strictEqual(parsed[1].isLate, false);
        assert.strictEqual(parsed[1].isUnplanned, false);
        assert.strictEqual(parsed[1].assigneeUrl, 'https://gitlab.widosoft.com/bob');

        // Test 2: Edge cases for parseGraphQLChildrenNodes
        assert.deepStrictEqual(parseGraphQLChildrenNodes(null), []);
        assert.deepStrictEqual(parseGraphQLChildrenNodes([]), []);
        assert.deepStrictEqual(parseGraphQLChildrenNodes([null, undefined]), []);

        // Test 3: fetchParentTaskWithChildren network mock
        let parentFetchCalls = [];
        const originalFetch = global.fetch;
        global.fetch = async (url, options) => {
            parentFetchCalls.push({ url, options });
            return {
                json: async () => ({
                    data: {
                        workspace: {
                            id: 'gid://gitlab/Project/123',
                            workItem: {
                                id: 'gid://gitlab/WorkItem/100',
                                iid: '100',
                                title: 'Parent Epic Issue',
                                widgets: [
                                    {
                                        type: 'HIERARCHY',
                                        children: {
                                            nodes: mockChildrenNodes
                                        }
                                    }
                                ]
                            }
                        }
                    }
                })
            };
        };

        try {
            const result = await fetchParentTaskWithChildren('my-group/my-project', '100', 'mock-token', 'https://mock-gitlab.com/api/graphql');
            assert.strictEqual(parentFetchCalls.length, 1);
            assert.strictEqual(parentFetchCalls[0].url, 'https://mock-gitlab.com/api/graphql');
            const reqBody = JSON.parse(parentFetchCalls[0].options.body);
            assert.strictEqual(reqBody.operationName, 'namespaceWorkItemWithChildren');
            assert.strictEqual(reqBody.variables.fullPath, 'my-group/my-project');
            assert.strictEqual(reqBody.variables.iid, '100');
            assert.strictEqual(result.length, 2, 'Should fetch and parse children from hierarchy query');
            assert.strictEqual(result[0].id, '301');

            // Test 4: Missing arguments or invalid response
            const emptyRes = await fetchParentTaskWithChildren('', '', '');
            assert.strictEqual(emptyRes, null, 'Should return null for missing parameters');

            // Test 5: Error handling
            global.fetch = async () => {
                throw new Error('GraphQL query failure');
            };
            const originalWarn = console.warn;
            console.warn = () => {};
            const errorRes = await fetchParentTaskWithChildren('prj', '100', 'token');
            console.warn = originalWarn;
            assert.strictEqual(errorRes, null, 'Should handle network exceptions gracefully and return null');
        } finally {
            global.fetch = originalFetch;
        }

        console.log('✔ Passed: Multi-page Hierarchy WorkItem Children GraphQL extraction & parsing');
    }

    // 20. Search & Column Sorting for Child Tasks Table
    {
        const sampleTasks = [
            { id: '101', title: 'Fix login button alignment', estimateHour: 2, spentHour: 1.5, diffHour: 0.5, state: 'opened' },
            { id: '102', title: 'Implement OAuth refresh token', estimateHour: 6, spentHour: 8, diffHour: -2, state: 'closed' },
            { id: '103', title: 'Refactor database schema for user profiles', estimateHour: 4, spentHour: 4, diffHour: 0, state: 'closed' },
            { id: '104', title: 'Fix notification badge counter', estimateHour: 1, spentHour: 0.5, diffHour: 0.5, state: 'opened' }
        ];

        // 1. Search by name (case-insensitive substring)
        const searchLogin = filterAndSortTasks(sampleTasks, { query: 'login' });
        assert.strictEqual(searchLogin.length, 1);
        assert.strictEqual(searchLogin[0].id, '101');

        const searchFix = filterAndSortTasks(sampleTasks, { query: 'FIX' });
        assert.strictEqual(searchFix.length, 2);
        assert.deepStrictEqual(searchFix.map(t => t.id), ['101', '104']);

        // Search by task ID
        const searchById = filterAndSortTasks(sampleTasks, { query: '103' });
        assert.strictEqual(searchById.length, 1);
        assert.strictEqual(searchById[0].title, 'Refactor database schema for user profiles');

        // Search with no match
        const searchNoMatch = filterAndSortTasks(sampleTasks, { query: 'nonexistent-task-query' });
        assert.strictEqual(searchNoMatch.length, 0);

        // 2. Sorting by Estimate
        const sortEstAsc = filterAndSortTasks(sampleTasks, { sortKey: 'estimate', sortOrder: 'asc' });
        assert.deepStrictEqual(sortEstAsc.map(t => t.estimateHour), [1, 2, 4, 6]);

        const sortEstDesc = filterAndSortTasks(sampleTasks, { sortKey: 'estimate', sortOrder: 'desc' });
        assert.deepStrictEqual(sortEstDesc.map(t => t.estimateHour), [6, 4, 2, 1]);

        // 3. Sorting by Spent time
        const sortSpentAsc = filterAndSortTasks(sampleTasks, { sortKey: 'spent', sortOrder: 'asc' });
        assert.deepStrictEqual(sortSpentAsc.map(t => t.spentHour), [0.5, 1.5, 4, 8]);

        const sortSpentDesc = filterAndSortTasks(sampleTasks, { sortKey: 'spent', sortOrder: 'desc' });
        assert.deepStrictEqual(sortSpentDesc.map(t => t.spentHour), [8, 4, 1.5, 0.5]);

        // 4. Sorting by Difference (diff)
        const sortDiffAsc = filterAndSortTasks(sampleTasks, { sortKey: 'diff', sortOrder: 'asc' });
        assert.deepStrictEqual(sortDiffAsc.map(t => t.diffHour), [-2, 0, 0.5, 0.5]);

        const sortDiffDesc = filterAndSortTasks(sampleTasks, { sortKey: 'diff', sortOrder: 'desc' });
        assert.deepStrictEqual(sortDiffDesc.map(t => t.diffHour), [0.5, 0.5, 0, -2]);

        // 5. Sorting by Title
        const sortTitleAsc = filterAndSortTasks(sampleTasks, { sortKey: 'title', sortOrder: 'asc' });
        assert.strictEqual(sortTitleAsc[0].title, 'Fix login button alignment');
        assert.strictEqual(sortTitleAsc[3].title, 'Refactor database schema for user profiles');

        // 6. Combined Search and Sort
        const searchAndSort = filterAndSortTasks(sampleTasks, { query: 'fix', sortKey: 'estimate', sortOrder: 'desc' });
        assert.strictEqual(searchAndSort.length, 2);
        assert.deepStrictEqual(searchAndSort.map(t => t.id), ['101', '104']); // 2h then 1h

        // 7. Edge cases
        assert.deepStrictEqual(filterAndSortTasks(null), []);
        assert.deepStrictEqual(filterAndSortTasks([], { query: 'test' }), []);
        assert.deepStrictEqual(filterAndSortTasks(sampleTasks, {}).length, 4);

        // 8. renderTaskTableRows
        const emptyRowsHtml = renderTaskTableRows([]);
        assert.ok(
            emptyRowsHtml.includes('Không tìm thấy task con nào phù hợp') ||
            emptyRowsHtml.includes('No matching child tasks'),
            'Should render empty message when tasks array is empty'
        );

        const populatedRowsHtml = renderTaskTableRows(sampleTasks.slice(0, 1));
        assert.ok(populatedRowsHtml.includes('Fix login button alignment'), 'Should render task title link');
        assert.ok(populatedRowsHtml.includes('2h'), 'Should render estimate hours');
        assert.ok(populatedRowsHtml.includes('1.5h'), 'Should render spent hours');
        assert.ok(populatedRowsHtml.includes('+0.5h'), 'Should render formatted positive diff');
        assert.ok(populatedRowsHtml.includes('gl-text-success'), 'Should render positive diff with success class');

        // 9. renderSummaryModalHtml includes search input & sortable headers
        const modalHtml = renderSummaryModalHtml(null, sampleTasks, 'Parent Issue Title');
        assert.ok(modalHtml.includes('id="glKpiSearchInput"'), 'Modal HTML must include search input');
        assert.ok(modalHtml.includes('id="glKpiTaskCount"'), 'Modal HTML must include task counter');
        assert.ok(modalHtml.includes('data-sort-key="estimate"'), 'Modal table header must include sort key estimate');
        assert.ok(modalHtml.includes('data-sort-key="spent"'), 'Modal table header must include sort key spent');
        assert.ok(modalHtml.includes('data-sort-key="diff"'), 'Modal table header must include sort key diff');

        console.log('✔ Passed: Search & column sorting for child tasks table');
    }

    // 21. Date Extraction (Start, Due, Open, Close), Formatting & Date Sorting
    {
        // 1. formatDateDisplay tests
        assert.strictEqual(formatDateDisplay('2026-09-15T08:30:00Z'), '15/09/2026');
        assert.strictEqual(formatDateDisplay('2026-10-01'), '01/10/2026');
        assert.strictEqual(formatDateDisplay(null), '-');
        assert.strictEqual(formatDateDisplay(undefined), '-');
        assert.strictEqual(formatDateDisplay(''), '-');

        // 2. parseGraphQLChildrenNodes date fields extraction
        const mockNodesWithDates = [
            {
                id: 'gid://gitlab/WorkItem/401',
                iid: '401',
                title: 'Task with full dates',
                state: 'closed',
                createdAt: '2026-09-10T08:00:00Z',
                closedAt: '2026-09-25T16:00:00Z',
                webUrl: 'https://gitlab.com/grp/prj/-/work_items/401',
                widgets: [
                    {
                        type: 'START_AND_DUE_DATE',
                        startDate: '2026-09-12',
                        dueDate: '2026-09-24'
                    }
                ]
            },
            {
                id: 'gid://gitlab/WorkItem/402',
                iid: '402',
                title: 'Task without start/due dates',
                state: 'opened',
                createdAt: '2026-09-15T09:00:00Z',
                closedAt: null,
                webUrl: 'https://gitlab.com/grp/prj/-/work_items/402',
                widgets: []
            }
        ];

        const parsedDates = parseGraphQLChildrenNodes(mockNodesWithDates);
        assert.strictEqual(parsedDates.length, 2);
        assert.strictEqual(parsedDates[0].startDate, '2026-09-12');
        assert.strictEqual(parsedDates[0].dueDate, '2026-09-24');
        assert.strictEqual(parsedDates[0].createdAt, '2026-09-10T08:00:00Z');
        assert.strictEqual(parsedDates[0].closedAt, '2026-09-25T16:00:00Z');

        assert.strictEqual(parsedDates[1].startDate, null);
        assert.strictEqual(parsedDates[1].dueDate, null);
        assert.strictEqual(parsedDates[1].createdAt, '2026-09-15T09:00:00Z');
        assert.strictEqual(parsedDates[1].closedAt, null);

        // 3. Sorting by dates via filterAndSortTasks
        const sortCreatedAsc = filterAndSortTasks(parsedDates, { sortKey: 'createdAt', sortOrder: 'asc' });
        assert.strictEqual(sortCreatedAsc[0].id, '401');
        assert.strictEqual(sortCreatedAsc[1].id, '402');

        const sortCreatedDesc = filterAndSortTasks(parsedDates, { sortKey: 'createdAt', sortOrder: 'desc' });
        assert.strictEqual(sortCreatedDesc[0].id, '402');
        assert.strictEqual(sortCreatedDesc[1].id, '401');

        // 4. renderTaskTableRows includes date cells formatted as DD/MM/YYYY
        const rowsHtml = renderTaskTableRows(parsedDates);
        assert.ok(rowsHtml.includes('12/09/2026'), 'Should render formatted start date');
        assert.ok(rowsHtml.includes('24/09/2026'), 'Should render formatted due date');
        assert.ok(rowsHtml.includes('10/09/2026'), 'Should render formatted open/created date');
        assert.ok(rowsHtml.includes('25/09/2026'), 'Should render formatted close date');

        // 5. renderSummaryModalHtml includes date header columns
        const modalHtml = renderSummaryModalHtml(null, parsedDates, 'Parent');
        assert.ok(modalHtml.includes('data-sort-key="startDate"'), 'Modal must have sortable startDate header');
        assert.ok(modalHtml.includes('data-sort-key="dueDate"'), 'Modal must have sortable dueDate header');
        assert.ok(modalHtml.includes('data-sort-key="createdAt"'), 'Modal must have sortable createdAt header');
        assert.ok(modalHtml.includes('data-sort-key="closedAt"'), 'Modal must have sortable closedAt header');

        console.log('✔ Passed: Date extraction (Start, Due, Open, Close), formatting & date sorting');
    }

    // 22. Work Item Standalone Page & Modal Popup KPI Button Injection
    {
        // 1. extractWorkItemPageInfo
        const mockDocPage = new MockDocument();
        const titleEl = new MockElement('h1', { attributes: { 'data-testid': 'work-item-title' }, innerText: 'Implement SSO Auth' });
        const parentLink = new MockElement('a', { attributes: { 'data-testid': 'work-item-parent-link', href: 'https://gitlab.widosoft.com/grp/prj/-/issues/50' }, innerText: 'Epic Auth System' });
        mockDocPage.body.appendChild(titleEl);
        mockDocPage.body.appendChild(parentLink);

        const mockWinPage = {
            location: {
                origin: 'https://gitlab.widosoft.com',
                pathname: '/grp/prj/-/work_items/501',
                href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/501'
            }
        };

        const pageInfo = extractWorkItemPageInfo(mockDocPage, mockWinPage);
        assert.ok(pageInfo, 'Should extract page info for work_items URL');
        assert.strictEqual(pageInfo.workItemId, '501');
        assert.strictEqual(pageInfo.title, 'Implement SSO Auth');
        assert.strictEqual(pageInfo.parentTitle, 'Epic Auth System');
        assert.strictEqual(pageInfo.parentIid, '50');
        assert.strictEqual(pageInfo.parentUrl, 'https://gitlab.widosoft.com/grp/prj/-/issues/50');

        // Not on work_items page
        const notWorkItem = extractWorkItemPageInfo(mockDocPage, { location: { pathname: '/grp/prj/-/issues/50' } });
        assert.strictEqual(notWorkItem, null, 'Should return null when not on a work_items URL');

        // 2. findWorkItemModal
        const docWithModal = new MockDocument();
        const genericDialog = new MockElement('div', { attributes: { role: 'dialog' } });
        docWithModal.body.appendChild(genericDialog);
        assert.strictEqual(findWorkItemModal(docWithModal), null, 'Generic empty dialog should not match work item modal');

        const kpiModal = new MockElement('div', { id: 'gitlabKpiSummaryModal' });
        docWithModal.body.appendChild(kpiModal);
        assert.strictEqual(findWorkItemModal(docWithModal), null, 'gitlabKpiSummaryModal should not match work item modal');

        const realDrawer = new MockElement('aside', { className: 'gl-drawer' });
        const drawerTitle = new MockElement('h1', { attributes: { 'data-testid': 'work-item-title' }, innerText: 'Drawer Task' });
        realDrawer.appendChild(drawerTitle);
        docWithModal.body.appendChild(realDrawer);
        assert.strictEqual(findWorkItemModal(docWithModal), realDrawer, 'Should detect drawer containing work item title');

        // 3. extractWorkItemModalInfo
        // Case A: Info extracted via window.location.search (?work_item_iid=502)
        const mockModalA = new MockElement('div', { attributes: { 'data-testid': 'work-item-drawer' } });
        const modalTitleA = new MockElement('h1', { attributes: { 'data-testid': 'work-item-title' }, innerText: 'Modal Child Task' });
        mockModalA.appendChild(modalTitleA);
        const winWithSearch = { location: { origin: 'https://gitlab.widosoft.com', pathname: '/grp/prj/-/issues/100', search: '?work_item_iid=502' } };
        const currentParent = { parentTitle: 'Parent Issue Title', parentUrl: 'https://gitlab.widosoft.com/grp/prj/-/issues/100', parentIid: '100' };

        const modalInfoA = extractWorkItemModalInfo(mockModalA, currentParent, winWithSearch);
        assert.ok(modalInfoA, 'Should extract modal info via URL search param');
        assert.strictEqual(modalInfoA.workItemId, '502');
        assert.strictEqual(modalInfoA.title, 'Modal Child Task');
        assert.strictEqual(modalInfoA.parentTitle, 'Parent Issue Title');
        assert.strictEqual(modalInfoA.parentIid, '100');
        assert.strictEqual(modalInfoA.href, 'https://gitlab.widosoft.com/grp/prj/-/work_items/502');

        // Case B: Info extracted via data-testid="work-item-drawer-ref-link"
        const mockModalB = new MockElement('div');
        const refLink = new MockElement('a', { attributes: { 'data-testid': 'work-item-drawer-ref-link', href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/503' } });
        mockModalB.appendChild(refLink);
        const modalInfoB = extractWorkItemModalInfo(mockModalB, currentParent);
        assert.ok(modalInfoB, 'Should extract modal info via ref link');
        assert.strictEqual(modalInfoB.workItemId, '503');

        // 4. findWorkItemEditPlacement
        // Priority 1: Edit button
        const container1 = new MockElement('div');
        const editBtn = new MockElement('button', { attributes: { 'data-testid': 'edit-title-button' } });
        container1.appendChild(editBtn);
        const p1 = findWorkItemEditPlacement(container1);
        assert.strictEqual(p1.target, editBtn);
        assert.strictEqual(p1.position, 'after');

        // Priority 2: Actions dropdown
        const container2 = new MockElement('div');
        const actionsDropdown = new MockElement('button', { attributes: { 'data-testid': 'work-item-actions-dropdown' } });
        container2.appendChild(actionsDropdown);
        const p2 = findWorkItemEditPlacement(container2);
        assert.strictEqual(p2.target, actionsDropdown);
        assert.strictEqual(p2.position, 'before');

        // Priority 3: Header actions container
        const container3 = new MockElement('div');
        const actionsContainer = new MockElement('div', { attributes: { 'data-testid': 'work-item-actions' } });
        container3.appendChild(actionsContainer);
        const p3 = findWorkItemEditPlacement(container3);
        assert.strictEqual(p3.target, actionsContainer);
        assert.strictEqual(p3.position, 'prepend');

        // Priority 4: Drawer close button
        const container4 = new MockElement('div');
        const closeBtn = new MockElement('button', { className: 'gl-drawer-close-button' });
        container4.appendChild(closeBtn);
        const p4 = findWorkItemEditPlacement(container4);
        assert.strictEqual(p4.target, closeBtn);
        assert.strictEqual(p4.position, 'before');

        // 5. createWorkItemKpiButton
        const mockDoc = new MockDocument();
        const addBtn = createWorkItemKpiButton({ workItemId: '501' }, false, null, mockDoc);
        assert.ok(addBtn.innerHTML.includes('Thêm vào KPI'));
        assert.strictEqual(addBtn.getAttribute('data-is-added'), 'false');
        assert.strictEqual(addBtn.getAttribute('data-work-item-id'), '501');

        const removeBtn = createWorkItemKpiButton({ workItemId: '501' }, true, null, mockDoc);
        assert.ok(removeBtn.innerHTML.includes('Xóa khỏi KPI'));
        assert.strictEqual(removeBtn.getAttribute('data-is-added'), 'true');
        assert.ok(removeBtn.className.includes('btn-danger'));

        // 6. injectWorkItemButton with Anti-Infinite-Loop Guard
        const testContainer = new MockElement('div');
        const targetEdit = new MockElement('button', { attributes: { 'data-testid': 'work-item-edit-button' } });
        testContainer.appendChild(targetEdit);

        const injected = injectWorkItemButton(testContainer, { workItemId: '501' }, false, null, mockDoc);
        assert.ok(injected, 'Should inject button');
        assert.strictEqual(testContainer.querySelector('.custom-work-item-kpi-btn'), injected);
        assert.strictEqual(injected.getAttribute('data-is-added'), 'false');

        // Anti-loop guard test: Calling with same state returns existing button WITHOUT DOM changes
        let innerHtmlTouched = false;
        Object.defineProperty(injected, 'innerHTML', {
            get() { return this._ih || '<span>➕</span><span>Thêm vào KPI</span>'; },
            set(val) { innerHtmlTouched = true; this._ih = val; }
        });
        const idempotentCall = injectWorkItemButton(testContainer, { workItemId: '501' }, false, null, mockDoc);
        assert.strictEqual(idempotentCall, injected);
        assert.strictEqual(innerHtmlTouched, false, 'Anti-loop guard must not touch innerHTML if state is unchanged');

        // State update test: Calling with isAdded=true updates text and class
        const reinjected = injectWorkItemButton(testContainer, { workItemId: '501' }, true, null, mockDoc);
        assert.strictEqual(reinjected, injected, 'Second injection should reuse existing button');
        assert.strictEqual(reinjected.getAttribute('data-is-added'), 'true');
        assert.ok(reinjected.innerHTML.includes('Xóa khỏi KPI'), 'Should update text to remove');
        assert.ok(reinjected.className.includes('btn-danger'), 'Should update class to danger');

        console.log('✔ Passed: Work item standalone page & modal popup KPI button injection');
    }

    // 23. Individual Task KPI Toggle in Summary Modal & Cross-Page State Synchronization
    {
        // 1. extractTaskIdentifier
        assert.deepStrictEqual(extractTaskIdentifier('2067'), { id: '2067', iid: '2067', href: '', normalizedHref: '' });
        assert.deepStrictEqual(extractTaskIdentifier(2067), { id: '2067', iid: '2067', href: '', normalizedHref: '' });
        assert.deepStrictEqual(
            extractTaskIdentifier('https://gitlab.widosoft.com/group/proj/-/work_items/2067'),
            { id: '', iid: '2067', href: 'https://gitlab.widosoft.com/group/proj/-/work_items/2067', normalizedHref: 'https://gitlab.widosoft.com/group/proj/-/issues/2067' }
        );
        assert.deepStrictEqual(
            extractTaskIdentifier({ id: 'legacy-12345', href: 'https://gitlab.widosoft.com/group/proj/-/work_items/2067' }),
            { id: 'legacy-12345', iid: '2067', href: 'https://gitlab.widosoft.com/group/proj/-/work_items/2067', normalizedHref: 'https://gitlab.widosoft.com/group/proj/-/issues/2067' }
        );
        assert.deepStrictEqual(
            extractTaskIdentifier({ id: '2067', iid: '2067' }),
            { id: '2067', iid: '2067', href: '', normalizedHref: '' }
        );
        assert.deepStrictEqual(extractTaskIdentifier(null), { id: '', iid: '', href: '', normalizedHref: '' });

        // 2. isTaskInList robust matching
        const storedList = [
            {
                id: '2067',
                href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067',
                taskTitle: 'Feature Auth'
            },
            {
                id: 'legacy-parent-id-888',
                href: 'https://gitlab.widosoft.com/grp/prj/-/issues/100',
                taskTitle: 'Issue Task'
            }
        ];

        // Direct ID match
        assert.strictEqual(isTaskInList(storedList, '2067'), true);
        assert.strictEqual(isTaskInList(storedList, 2067), true);

        // Matching work_item standalone page format against child item format
        assert.strictEqual(
            isTaskInList(storedList, {
                id: 'legacy-child-id-44621',
                href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067'
            }),
            true,
            'Should match by extracted work_items IID even if stored id format differed'
        );

        // Matching by normalized path
        assert.strictEqual(
            isTaskInList(storedList, 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067'),
            true
        );

        // Negative match
        assert.strictEqual(isTaskInList(storedList, '9999'), false);
        assert.strictEqual(isTaskInList([], '2067'), false);
        assert.strictEqual(isTaskInList(null, '2067'), false);

        // 3. Storage add and remove helpers (mocking chrome.storage.local)
        let mockStorage = {};
        const originalChrome = global.chrome;
        global.chrome = {
            storage: {
                local: {
                    get: async (key) => ({ [key]: mockStorage[key] || [] }),
                    set: async (obj) => { Object.assign(mockStorage, obj); }
                }
            }
        };

        try {
            // Add new item
            const afterAdd = await addIdToStorage('WorkItemIds', '2067', 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067', '2026-10-01', {
                parentTitle: 'Parent Epic',
                parentUrl: 'https://gitlab.widosoft.com/grp/prj/-/issues/50'
            });
            assert.strictEqual(afterAdd.length, 1);
            assert.strictEqual(afterAdd[0].id, '2067');
            assert.strictEqual(afterAdd[0].parentTitle, 'Parent Epic');

            // Add duplicate item updates metadata without duplicating
            const afterUpdate = await addIdToStorage('WorkItemIds', '2067', 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067', '2026-10-01', {
                taskTitle: 'Updated Title'
            });
            assert.strictEqual(afterUpdate.length, 1);
            assert.strictEqual(afterUpdate[0].taskTitle, 'Updated Title');

            // Remove item by matching href/iid even if id differs
            const afterRemove = await removeTaskFromStorage('WorkItemIds', {
                id: 'diff-id-44621',
                href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067'
            });
            assert.strictEqual(afterRemove.length, 0);
        } finally {
            global.chrome = originalChrome;
        }

        // 4. renderTaskTableRows with storedWorkItemIds
        const sampleTasksForRows = [
            { id: '2067', href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067', title: 'Task Added', estimateHour: 4, spentHour: 2, state: 'opened' },
            { id: '2068', href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2068', title: 'Task Not Added', estimateHour: 2, spentHour: 1, state: 'opened' }
        ];

        const rowsHtml = renderTaskTableRows(sampleTasksForRows, {
            storedWorkItemIds: [{ id: '2067', href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067' }]
        });

        // Column count check: empty row should have colspan="12"
        const emptyRowsHtml = renderTaskTableRows([], { isFiltered: true });
        assert.ok(emptyRowsHtml.includes('colspan="12"'), 'Empty state must span 12 columns including KPI column');

        // Added row check
        assert.ok(rowsHtml.includes('data-task-id="2067"'));
        assert.ok(rowsHtml.includes('btn-danger'), 'Added row must have btn-danger');
        assert.ok(rowsHtml.includes('data-is-added="true"'));
        assert.ok(rowsHtml.includes('Xóa'));

        // Not-added row check
        assert.ok(rowsHtml.includes('data-task-id="2068"'));
        assert.ok(rowsHtml.includes('btn-default'), 'Not added row must have btn-default');
        assert.ok(rowsHtml.includes('data-is-added="false"'));
        assert.ok(rowsHtml.includes('Thêm'));

        // 5. openSummaryModal row button delegation & Add All button
        const mockDocModal = new MockDocument();
        const testParent = { parentTitle: 'Parent Epic Issue', parentUrl: 'https://gitlab.widosoft.com/grp/prj/-/issues/10', parentIid: '10' };
        let toggledTaskPayload = null;
        global.window = global.window || {};
        window._onToggleTaskFromRow = async (taskPayload) => {
            toggledTaskPayload = taskPayload;
            return { isAdded: true, storedList: [{ id: taskPayload.id, href: taskPayload.href }] };
        };

        let childTasksAddedAllPayload = null;
        window._onChildTasksAddedAll = (tasks) => {
            childTasksAddedAllPayload = tasks;
        };

        const modalEl = openSummaryModal(testParent, sampleTasksForRows, mockDocModal, {
            storedWorkItemIds: []
        });
        assert.ok(modalEl, 'Modal element must be created');

        // Test row button click delegation
        const tableBody = modalEl.querySelector('#glKpiTableBody');
        assert.ok(tableBody, 'Table body must exist');
        const firstRowBtn = modalEl.querySelector('.gl-kpi-row-add-btn');
        assert.ok(firstRowBtn, 'Row add button must exist');

        // Simulate click on row button
        await tableBody.dispatchEvent({
            type: 'click',
            target: firstRowBtn,
            stopPropagation: () => {},
            preventDefault: () => {}
        });

        assert.ok(toggledTaskPayload, '_onToggleTaskFromRow must have been triggered');
        assert.strictEqual(toggledTaskPayload.id, '2067');
        assert.strictEqual(firstRowBtn.getAttribute('data-is-added'), 'true');
        assert.ok(firstRowBtn.className.includes('btn-danger'));

        // Test Add All button click
        const addAllBtn = modalEl.querySelector('#glKpiAddAllBtn');
        assert.ok(addAllBtn, 'Add All button must exist');
        await addAllBtn.dispatchEvent({ type: 'click' });
        assert.strictEqual(addAllBtn.innerText, '✔ Đã thêm tất cả vào KPI');
        assert.ok(childTasksAddedAllPayload, '_onChildTasksAddedAll must have been called');

        // 6. syncAllButtonsOnPage across child items, work item pages, and summary modal
        const syncDoc = new MockDocument();
        
        // Child item button in tree list
        const treeLi = new MockElement('li', { className: 'tree-item' });
        const treeLinkChild = new MockElement('div', { attributes: { 'data-testid': 'links-child', 'parent-work-item-id': 'legacy-child-id-123' } });
        const treeAnchor = new MockElement('a', { attributes: { href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067' }, innerText: 'Child Task 2067' });
        const treeAddBtn = new MockElement('button', { className: 'btn btn-default btn-sm custom-add-button', attributes: { 'data-task-href': 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067', 'data-work-item-id': '2067' } });
        treeLinkChild.appendChild(treeAddBtn);
        treeLi.appendChild(treeAnchor);
        treeLi.appendChild(treeLinkChild);
        syncDoc.body.appendChild(treeLi);

        // Work item page button
        const standaloneBtn = new MockElement('button', { className: 'btn btn-default btn-sm custom-work-item-kpi-btn', attributes: { 'data-work-item-id': '2067', 'data-href': 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067' } });
        syncDoc.body.appendChild(standaloneBtn);

        // Modal row button
        const rowSyncBtn = new MockElement('button', { className: 'btn btn-sm btn-default gl-button gl-kpi-row-add-btn', attributes: { 'data-task-id': '2067', 'data-task-href': 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067' } });
        syncDoc.body.appendChild(rowSyncBtn);

        // Initial sync when task is added
        syncAllButtonsOnPage(syncDoc, [{ id: '2067', href: 'https://gitlab.widosoft.com/grp/prj/-/work_items/2067' }]);
        assert.ok(treeAddBtn.classList.contains('btn-danger'), 'Tree button should be danger when added');
        assert.ok(standaloneBtn.classList.contains('btn-danger'), 'Standalone button should be danger when added');
        assert.ok(standaloneBtn.innerHTML.includes('Xóa khỏi KPI'));
        assert.ok(rowSyncBtn.classList.contains('btn-danger'), 'Row button should be danger when added');
        assert.strictEqual(rowSyncBtn.getAttribute('data-is-added'), 'true');

        // Sync when task is removed
        syncAllButtonsOnPage(syncDoc, []);
        assert.ok(treeAddBtn.classList.contains('btn-success'), 'Tree button should be success when not added');
        assert.ok(standaloneBtn.classList.contains('btn-default'), 'Standalone button should be default when not added');
        assert.ok(standaloneBtn.innerHTML.includes('Thêm vào KPI'));
        assert.ok(rowSyncBtn.classList.contains('btn-default'), 'Row button should be default when not added');
        assert.strictEqual(rowSyncBtn.getAttribute('data-is-added'), 'false');

        console.log('✔ Passed: Individual task KPI toggle in summary modal & cross-page state synchronization');
    }

    console.log('\n--- ALL GITLAB ISSUE SUMMARY TESTS PASSED ---');
})().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});

