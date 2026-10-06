(async () => {
    console.log('Loading content_request.js');

    const MERGE_ITEM_KEY = 'MergeItemIds';
    const addedLinks = new Set();
    const svgAdd = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="green" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        `;

    const svgRemove = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="red" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        `;

    // Sử dụng hàm từ utils.js
    const storedItems = await getStoredIds(MERGE_ITEM_KEY);
    storedItems.forEach(item => addedLinks.add(item.id));
    const userProfile = await getUserProfile();

    function createAddButton(mergeRequestId, href) {
        const button = document.createElement('button');
        button.className = 'btn btn-default btn-sm gl-button';
        button.style.marginRight = '5px';

        const updateButtonAppearance = () => {
            if (addedLinks.has(mergeRequestId)) {
                button.innerHTML = svgRemove;
                button.classList.remove('btn-success');
                button.classList.add('btn-danger');
            } else {
                button.innerHTML = svgAdd;
                button.classList.remove('btn-danger');
                button.classList.add('btn-success');
            }
        };

        updateButtonAppearance();

        button.addEventListener('click', async (e) => {
            e.stopPropagation(); // chặn sự kiện lan lên DOM gốc
            e.preventDefault();  // tránh hành vi mặc định
            // Ngăn spam nút bằng cách vô hiệu hóa nó ngay khi nhấn
            button.disabled = true;

            try {
                // Get group name
                if (addedLinks.has(mergeRequestId)) {
                    await removeIdFromStorage(MERGE_ITEM_KEY, mergeRequestId);
                    addedLinks.delete(mergeRequestId);
                } else {
                    const today = new Date().toISOString();
                    const titleEl = document.querySelector('h1.title, [data-testid="mr-title"], .issue-details .title');
                    let mrTitle = titleEl ? titleEl.innerText.trim() : '';
                    if (!mrTitle && document.title) {
                        mrTitle = document.title.replace(/\s*·.*$/, '').trim();
                    }
                    await addIdToStorage(MERGE_ITEM_KEY, mergeRequestId, href, today, { title: mrTitle });
                    addedLinks.add(mergeRequestId);
                }
            } catch (error) {
                console.error('Error handling button click:', error);
            } finally {
                // Cho phép người dùng nhấn lại sau khi xử lý xong
                button.disabled = false;
            }

            updateButtonAppearance();
        });

        return button;
    }

    function processTasks() {
        // Handle for issue
        const mergeRequestSection = document.querySelector('.merge-request > .is-merge-request');

        if (!mergeRequestSection) return;

        const fullPath = window.location.origin + window.location.pathname;
        const match = fullPath.match(/^(https?:\/\/[^\/]+)(\/.*?\/-\/merge_requests\/(\d+))/);

        if (!match) return;

        const baseUrl = match[1] + match[2]; // https://gitlab.widosoft.com/path/to/project/-/merge_requests/123
        const id = match[3];

        const headerAction = mergeRequestSection.querySelector('.detail-page-header-actions');
        const addButton = createAddButton(id, baseUrl);
        headerAction.prepend(addButton);
    }

    processTasks();

    async function addIdToStorage(key, id, href, createAt, extra = {}) {
        if (typeof updateTrackedItems === 'function' && chrome.runtime?.sendMessage) {
            return updateTrackedItems(key, [{ id, href, createAt, ...extra }]);
        }
        const items = await getStoredIds(key);
        const existingIdx = items.findIndex(item => item.id === id);
        if (existingIdx === -1) {
            items.push({ id, href, createAt, ...extra });
        } else {
            items[existingIdx] = { ...items[existingIdx], ...extra };
        }
        await chrome.storage.local.set({ [key]: items });
    }

})();
