function openNoteWindow() {
    if (typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({
            url: chrome.runtime.getURL("note/note.html"),
            type: "popup",
            width: 520,
            height: 640
        });
    }
}

function openNoteTab() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("note/note.html")
        });
    }
}

function openTodoWindow() {
    if (typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({
            url: chrome.runtime.getURL("todo/todo.html"),
            type: "popup",
            width: 540,
            height: 680
        });
    }
}

function openTodoTab() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("todo/todo.html")
        });
    }
}

function _resolveSanitizeUrl() {
    if (typeof sanitizeGitlabUrl === 'function') return sanitizeGitlabUrl;
    if (typeof window !== 'undefined' && typeof window.sanitizeGitlabUrl === 'function') return window.sanitizeGitlabUrl;
    if (_utils && typeof _utils.sanitizeGitlabUrl === 'function') return _utils.sanitizeGitlabUrl;
    return (u, def = 'https://gitlab.com') => (u && typeof u === 'string' && u.trim()) ? u.trim() : def;
}

function _resolveGetTokenGenUrl() {
    if (typeof getTokenGenerationUrl === 'function') return getTokenGenerationUrl;
    if (typeof window !== 'undefined' && typeof window.getTokenGenerationUrl === 'function') return window.getTokenGenerationUrl;
    if (_utils && typeof _utils.getTokenGenerationUrl === 'function') return _utils.getTokenGenerationUrl;
    const sFn = _resolveSanitizeUrl();
    return (u) => `${sFn(u)}/-/user_settings/personal_access_tokens`;
}

function _resolveGetServerUrl() {
    if (typeof getGitlabServerUrl === 'function') return getGitlabServerUrl;
    if (typeof window !== 'undefined' && typeof window.getGitlabServerUrl === 'function') return window.getGitlabServerUrl;
    if (_utils && typeof _utils.getGitlabServerUrl === 'function') return _utils.getGitlabServerUrl;
    return async () => 'https://gitlab.com';
}

function updateTokenHelpLink(serverUrl, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return;
    const sanitize = _resolveSanitizeUrl();
    const getTokenGen = _resolveGetTokenGenUrl();
    const sanitized = sanitize(serverUrl);
    const tokenHelpLink = doc.getElementById('tokenHelpLink');
    if (tokenHelpLink) {
        const genUrl = getTokenGen(sanitized);
        tokenHelpLink.href = genUrl;
        if (typeof tokenHelpLink.setAttribute === 'function') {
            tokenHelpLink.setAttribute('href', genUrl);
        }
    }
    const pills = doc.querySelectorAll ? doc.querySelectorAll('.quick-url-pill') : [];
    if (pills && pills.length) {
        pills.forEach(pill => {
            const pillUrl = pill.getAttribute ? pill.getAttribute('data-url') : '';
            if (pillUrl === sanitized) {
                if (pill.classList && pill.classList.add) pill.classList.add('active');
            } else {
                if (pill.classList && pill.classList.remove) pill.classList.remove('active');
            }
        });
    }
}

async function requestHostPermissionIfNeeded(serverUrl) {
    if (typeof chrome === 'undefined' || !chrome.permissions || typeof chrome.permissions.request !== 'function') {
        return true;
    }
    try {
        const sanitize = _resolveSanitizeUrl();
        const origin = sanitize(serverUrl);
        if (origin === 'https://gitlab.com' || origin === 'https://gitlab.widosoft.com') {
            return true;
        }
        const matchPattern = `${origin}/*`;
        if (typeof chrome.permissions.contains === 'function') {
            const hasPerm = await chrome.permissions.contains({ origins: [matchPattern] });
            if (hasPerm) return true;
        }
        const granted = await chrome.permissions.request({ origins: [matchPattern] });
        return !!granted;
    } catch (e) {
        console.warn('Host permission request failed or rejected:', e);
        return false;
    }
}

async function handleSaveServerUrl(rawUrl, storageArea = null) {
    const sanitize = _resolveSanitizeUrl();
    const sanitized = sanitize(rawUrl);
    await requestHostPermissionIfNeeded(sanitized);
    const targetStorage = storageArea || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    if (targetStorage && typeof targetStorage.set === 'function') {
        const res = targetStorage.set({ gitlabServerUrl: sanitized });
        if (res && typeof res.then === 'function') {
            await res;
        }
    }
    return sanitized;
}

async function saveUserProfile(userProfile) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ ['UserProfile']: userProfile });
    }
}

async function addAccessToken(accessToken) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ ['AccessToken']: accessToken });
    }
}

async function fetchUserProfile(token, serverUrl = 'https://gitlab.com', fetchFn = (typeof fetch !== 'undefined' ? fetch : null)) {
    if (!token) return null;
    const sanitize = _resolveSanitizeUrl();
    const baseUrl = sanitize(serverUrl);
    const doFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!doFetch) return null;

    try {
        const res = await doFetch(`${baseUrl}/api/v4/user`, {
            headers: { 'PRIVATE-TOKEN': token }
        });
        if (!res || !res.ok) {
            return null;
        }
        const response = await res.json();
        if (response && (response.message === '401 Unauthorized' || response.error)) {
            return null;
        }
        await saveUserProfile(response);
        return response;
    } catch (e) {
        return null;
    }
}

(async () => {
    if (typeof document === 'undefined') {
        return;
    }

    // Khởi tạo i18n
    let currentLang = 'vi';
    if (typeof initLanguage === 'function') {
        const storageLocal = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
        currentLang = await initLanguage(storageLocal);
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLang;
    }
    if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
        applyI18n(document, currentLang);
    }
    syncLanguageUI(currentLang);

    function syncLanguageUI(lang) {
        document.querySelectorAll('.login-lang-switch .lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        const langSelect = document.getElementById('appLangSelect');
        if (langSelect && langSelect.value !== lang) {
            langSelect.value = lang;
        }
    }

    async function changeAppLanguage(newLang) {
        if (!newLang || (newLang !== 'vi' && newLang !== 'en')) return;
        const storageLocal = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
        if (typeof setLanguage === 'function') {
            await setLanguage(newLang, storageLocal);
        }
        currentLang = newLang;
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = newLang;
        }
        syncLanguageUI(newLang);
        if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
            applyI18n(document, newLang);
        }
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            try {

            } catch (e) {}
        }
    }

    // Gắn sự kiện cho nút chọn ngôn ngữ tại màn hình đăng nhập
    document.querySelectorAll('.login-lang-switch .lang-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetLang = btn.getAttribute('data-lang');
            await changeAppLanguage(targetLang);
        });
    });

    // Gắn sự kiện cho select ngôn ngữ tại tab cài đặt
    const appLangSelect = document.getElementById('appLangSelect');
    if (appLangSelect) {
        appLangSelect.value = currentLang;
        appLangSelect.addEventListener('change', async (e) => {
            await changeAppLanguage(e.target.value);
        });
    }

    syncLanguageUI(currentLang);

    // Lắng nghe thay đổi appLanguage qua storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area === 'local' && changes.appLanguage) {
                const newLang = changes.appLanguage.newValue;
                if (newLang && newLang !== currentLang) {
                    currentLang = newLang;
                    syncLanguageUI(newLang);
                    if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
                        applyI18n(document, newLang);
                    }

                }
            }
        });
    }

    // Khởi tạo Server URL và các liên kết
    const getServerUrlFn = _resolveGetServerUrl();
    const currentServerUrl = await getServerUrlFn();

    const loginServerUrlInput = document.getElementById('gitlabServerUrlInput');
    if (loginServerUrlInput) {
        loginServerUrlInput.value = currentServerUrl;
        loginServerUrlInput.addEventListener('input', (e) => {
            updateTokenHelpLink(e.target.value, document);
        });
        loginServerUrlInput.addEventListener('change', (e) => {
            updateTokenHelpLink(e.target.value, document);
        });
    }

    document.querySelectorAll('.quick-url-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const pillUrl = pill.getAttribute('data-url');
            if (pillUrl && loginServerUrlInput) {
                loginServerUrlInput.value = pillUrl;
                updateTokenHelpLink(pillUrl, document);
            }
        });
    });

    updateTokenHelpLink(currentServerUrl, document);

    // Cài đặt Server URL trong tab settings
    function initServerUrlSettings(initialUrl) {
        const settingsInput = document.getElementById('settingsServerUrlInput');
        const saveBtn = document.getElementById('saveServerUrlBtn');
        const saveMsg = document.getElementById('saveServerUrlMsg');

        if (settingsInput) {
            settingsInput.value = initialUrl;
        }

        if (saveBtn && !saveBtn._hasServerUrlListener) {
            saveBtn._hasServerUrlListener = true;
            saveBtn.addEventListener('click', async () => {
                const rawVal = settingsInput ? settingsInput.value : '';
                const sanitized = await handleSaveServerUrl(rawVal);
                if (settingsInput) {
                    settingsInput.value = sanitized;
                }
                if (loginServerUrlInput) {
                    loginServerUrlInput.value = sanitized;
                }
                updateTokenHelpLink(sanitized, document);

                if (saveMsg) {
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    saveMsg.textContent = (typeof t === 'function') ? t('serverUrlSaved', null, curL) : '✔ Đã lưu GitLab Server URL thành công';
                    saveMsg.style.display = 'block';
                    setTimeout(() => {
                        saveMsg.style.display = 'none';
                    }, 2500);
                }
            });
        }
    }
    initServerUrlSettings(currentServerUrl);

    if (typeof getUserProfile !== 'function' || typeof document === 'undefined') {
        return;
    }
    const userProfile = await getUserProfile();

    if (userProfile) {
        renderUserProfile(userProfile);
    } else {
        document.getElementById("user-screen").style.display = "none";
    }

    document.getElementById("login-btn").addEventListener("click", async () => {
        const tokenInput = document.getElementById("token");
        const token = tokenInput ? tokenInput.value.trim() : '';
        const urlInput = document.getElementById("gitlabServerUrlInput");
        const rawServerUrl = urlInput ? urlInput.value : '';
        const sanitize = _resolveSanitizeUrl();
        const serverUrl = sanitize(rawServerUrl);

        if (!token) {
            alert(typeof t === 'function' ? t('tokenRequired') : "Vui lòng nhập token");
            return;
        }

        const permOk = await requestHostPermissionIfNeeded(serverUrl);
        if (!permOk) {
            const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
            alert(typeof t === 'function' ? t('hostPermissionRequired', null, curL) : "Cần cấp quyền truy cập vào máy chủ GitLab này để tiếp tục!");
            return;
        }

        const user = await fetchUserProfile(token, serverUrl);
        if (user) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ gitlabServerUrl: serverUrl });
            }
            await addAccessToken(token);
            renderUserProfile(user);
        } else {
            alert(typeof t === 'function' ? t('connectFailed') : "Token không hợp lệ!");
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        document.getElementById("user-screen").style.display = "none";
        document.getElementById("login-screen").style.display = "block";

        deletelocalStorage('AccessToken');
        deletelocalStorage('UserProfile');
    });

    document.getElementById("tutorial-btn").addEventListener("click", () => {
        // Open new tab
        // chrome.tabs.create({ url: "https://gitlab.widosoft.com/-/user_settings/personal_access_tokens" });
        chrome.tabs.create({ url: chrome.runtime.getURL("tutorial/tutorial.html") });
    })


    async function renderUserProfile(user) {
        // Hiện user info
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("user-screen").style.display = "block";

        // Cập nhật thông tin
        document.getElementById("avatar").src = user.avatar_url;
        document.getElementById("username").textContent = user.username;
        document.getElementById("avatar-link").href = user.web_url;

        document.getElementById("manage-btn").onclick = () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("page/page.html") });
        };

        const gitlabUsername = user?.username || '';
        const getServerUrlFn = _resolveGetServerUrl();
        const serverUrl = await getServerUrlFn();
        const gitlabBaseUrl = serverUrl || 'https://gitlab.com';
        initServerUrlSettings(gitlabBaseUrl);

        const quickIssuesBtn = document.getElementById("quickIssuesBtn");
        const quickMRsBtn = document.getElementById("quickMRsBtn");
        const quickTodosBtn = document.getElementById("quickTodosBtn");

        if (quickIssuesBtn) {
            quickIssuesBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                const url = gitlabUsername
                    ? `${baseUrl}/dashboard/issues?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${baseUrl}/dashboard/issues`;
                chrome.tabs.create({ url });
            };
        }

        if (quickMRsBtn) {
            quickMRsBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                const url = gitlabUsername
                    ? `${baseUrl}/dashboard/merge_requests?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${baseUrl}/dashboard/merge_requests`;
                chrome.tabs.create({ url });
            };
        }

        if (quickTodosBtn) {
            quickTodosBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                chrome.tabs.create({ url: `${baseUrl}/dashboard/todos` });
            };
        }

        const noteBtn = document.getElementById("note-btn");
        const noteWindowBtn = document.getElementById("note-window-btn");
        const noteTabBtn = document.getElementById("note-tab-btn");

        if (noteBtn) noteBtn.onclick = openNoteWindow;
        if (noteWindowBtn) noteWindowBtn.onclick = openNoteWindow;
        if (noteTabBtn) noteTabBtn.onclick = openNoteTab;

        const todoBtn = document.getElementById("todo-btn");
        const todoTabBtn = document.getElementById("todo-tab-btn");

        if (todoBtn) todoBtn.onclick = openTodoWindow;
        if (todoTabBtn) todoTabBtn.onclick = openTodoTab;

        // Xử lý chuyển tab
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                // Xoá class active khỏi tất cả
                document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                // Thêm class active cho tab hiện tại
                btn.classList.add("active");
                document.getElementById(btn.dataset.tab).classList.add("active");
            });
        });


        document.getElementById("exportTask-btn").addEventListener("click", () => {
            chrome.storage.local.get(null, (allData) => {
                // Backup everything
                const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const date = new Date().toISOString().slice(0, 10);

                const a = document.createElement("a");
                a.href = url;
                a.download = `gitlab_productivity_backup_${date}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        });

        document.getElementById("importTask-btn").addEventListener("click", () => {
            document.getElementById("importFile").click();
        });

        document.getElementById("importFile").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const text = await file.text();
            try {
                const data = JSON.parse(text);

                if (typeof data === 'object' && data !== null) {
                    if (confirm("Hành động này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?")) {
                        await chrome.storage.local.set(data);
                        alert("Import thành công! Vui lòng tải lại trang Dashboard nếu đang mở.");
                        window.location.reload(); // Reload popup to reflect changes
                    }
                } else {
                    alert("File không đúng định dạng JSON.");
                }
            } catch (err) {
                console.error(err);
                alert("Đọc file thất bại hoặc file không hợp lệ.");
            }
        });

        // Cài đặt Nhắc Check-in & Check-out
        async function initCheckInOutSettings() {
            const checkInEnabledEl = document.getElementById("checkInEnabled");
            const checkInTimeEl = document.getElementById("checkInTime");
            const checkOutEnabledEl = document.getElementById("checkOutEnabled");
            const checkOutTimeEl = document.getElementById("checkOutTime");
            const checkInOutSnoozeEl = document.getElementById("checkInOutSnooze");
            const checkInOutUrlEl = document.getElementById("checkInOutUrl");
            const saveBtn = document.getElementById("saveCheckInOutBtn");
            const testBtn = document.getElementById("testCheckInOutBtn");
            const saveMsg = document.getElementById("checkInOutSaveMsg");

            if (!checkInEnabledEl || !saveBtn) return;

            // Đọc cài đặt đã lưu
            const settings = await chrome.storage.local.get([
                'checkInEnabled',
                'checkInTime',
                'checkOutEnabled',
                'checkOutTime',
                'checkInOutSnoozeMinutes',
                'checkInOutUrl',
            ]);

            if (settings.checkInEnabled !== undefined) checkInEnabledEl.checked = settings.checkInEnabled;
            if (settings.checkInTime) checkInTimeEl.value = settings.checkInTime;
            if (settings.checkOutEnabled !== undefined) checkOutEnabledEl.checked = settings.checkOutEnabled;
            if (settings.checkOutTime) checkOutTimeEl.value = settings.checkOutTime;
            if (settings.checkInOutSnoozeMinutes !== undefined) checkInOutSnoozeEl.value = String(settings.checkInOutSnoozeMinutes);
            if (settings.checkInOutUrl) checkInOutUrlEl.value = settings.checkInOutUrl;

            // Xử lý lưu cài đặt
            saveBtn.addEventListener("click", async () => {
                const newSettings = {
                    checkInEnabled: checkInEnabledEl.checked,
                    checkInTime: checkInTimeEl.value || '08:30',
                    checkOutEnabled: checkOutEnabledEl.checked,
                    checkOutTime: checkOutTimeEl.value || '18:00',
                    checkInOutSnoozeMinutes: parseInt(checkInOutSnoozeEl.value, 10) || 0,
                    checkInOutUrl: checkInOutUrlEl.value.trim(),
                };

                await chrome.storage.local.set(newSettings);

                if (saveMsg) {
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    saveMsg.textContent = (typeof t === 'function') ? t('saveSettingsSuccess', null, curL) : "✔ Đã lưu cài đặt!";
                    saveMsg.style.display = "block";
                    setTimeout(() => {
                        saveMsg.style.display = "none";
                    }, 2500);
                }
            });

            // Xử lý thử chuông thông báo
            if (testBtn) {
                testBtn.addEventListener("click", () => {
                    const notifId = 'test-checkin-alert-' + Date.now();
                    const url = checkInOutUrlEl.value.trim();
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    const notifTitle = (typeof t === 'function')
                        ? t('notifTestSoundTitle', null, curL)
                        : "🔔 Kiểm tra chuông nhắc việc";
                    const notifMessage = url
                        ? ((typeof t === 'function')
                            ? t('notifTestSoundMsgUrl', null, curL)
                            : "Thông báo hoạt động tốt! Nhấn vào đây để thử mở link chấm công.")
                        : ((typeof t === 'function')
                            ? t('notifTestSoundMsgNoUrl', null, curL)
                            : "Thông báo hoạt động tốt! Bạn có thể lưu lại cài đặt.");

                    chrome.notifications.create(notifId, {
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("icon48.png"),
                        title: notifTitle,
                        message: notifMessage,
                        priority: 2,
                        requireInteraction: true
                    });
                });
            }
        }

        await initCheckInOutSettings();

        // Keep monthly stats in step with background sync.
        async function refreshMonthStats() {
            const data = await chrome.storage.local.get(['KpiInfo', 'UserProfile', 'gitlabServerUrl', 'gitlabUrl', 'KpiLeaveDays']);
            const storedKpi = typeof KpiSync !== 'undefined' ? KpiSync.visibleItems(data) : (data.KpiInfo || []);

            const today = new Date();
            const currentMonthIso = (typeof parseToIsoDate === 'function' ? parseToIsoDate(today) : today.toISOString().slice(0, 10)).slice(0, 7);
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const y = today.getFullYear();

            // 2. Dữ liệu tháng
            const currentMonthData = storedKpi.filter(item => isItemActiveInFilter(item, 'all_month', currentMonthIso));
            const monthStats = calculateStats(currentMonthData, 'all_month', currentMonthIso, null, null, today, data.KpiLeaveDays || {});

            const monthStatsCard = document.querySelector("#month-tab .stats-card");
            if (monthStatsCard) monthStatsCard.style.display = "block";
            const monthTimeEl = document.getElementById("month-stats-time");
            if (monthTimeEl) monthTimeEl.textContent = `${m}/${y}`;

            document.getElementById("month-total-tasks").textContent = monthStats.totalTask || 0;
            document.getElementById("month-spent-time").textContent = (monthStats.totalSpent || 0) + 'h';

            // Đúng hạn
            document.getElementById("month-ontime-val").textContent = `${monthStats.onTimeRate || 0}%`;

            // Dự báo KPI
            const kpiResult = calculateKpiScore(monthStats);
            const badgeKey = !monthStats.totalTask ? 'kpiBadgeNoData' : kpiResult.totalScore >= 4.5 ? 'kpiBadgeExcellent' : kpiResult.totalScore >= 3.8 ? 'kpiBadgeGood' : kpiResult.totalScore >= 3 ? 'kpiBadgeFair' : 'kpiBadgeAttention';
            if (typeof t === 'function') kpiResult.badge.text = t(badgeKey);
            const kpiScoreEl = document.getElementById("month-kpi-score");
            if (kpiScoreEl) {
                kpiScoreEl.innerHTML = `
                    <span>${kpiResult.totalScore}/5.0</span>
                    <span class="kpi-score-badge ${kpiResult.badge.class}">${kpiResult.badge.icon} ${kpiResult.badge.text}</span>
                `;
            }

            const dailySpent = parseFloat(monthStats.dailySpentTime) || 0;
            document.getElementById('estimate-time-daily').textContent = `${dailySpent}h / 8h`;
            document.getElementById('progress-fill-daily').style.width = `${Math.min((dailySpent / 8) * 100, 100)}%`;

            // Monthly target follows the daily audit calendar and leave days.
            const monthSpent = parseFloat(monthStats.totalSpent) || 0;
            const monthTarget = monthStats.workingHours ?? 0;
            const monthProgress = monthTarget > 0 ? Math.min((monthSpent / monthTarget) * 100, 100) : 0;
            document.getElementById("month-spent-total").textContent = `${monthSpent}h / ${monthTarget}h`;
            document.getElementById("month-progress-fill").style.width = `${monthProgress}%`;
        }
        await refreshMonthStats();
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && ['KpiInfo', 'KpiLeaveDays', 'UserProfile', 'gitlabServerUrl', 'appLanguage'].some(key => changes[key])) refreshMonthStats().catch(console.error);
        });
        if (typeof KpiSync !== 'undefined') await KpiSync.mountUI();

    }

    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        const usedKB = (bytesInUse / 1024).toFixed(2);
        const maxKB = (chrome.storage.local.QUOTA_BYTES / 1024).toFixed(0);
        const storageProgress = Math.min((bytesInUse / chrome.storage.local.QUOTA_BYTES) * 100, 100);

        document.getElementById("used-bytes").textContent = usedKB + ' KB';
        document.getElementById("max-bytes").textContent = (maxKB / 1024).toFixed(1) + ' MB';
        const storageFill = document.getElementById("storage-fill");
        if (storageFill) storageFill.style.width = `${storageProgress}%`;
    });
})();

if (typeof window !== 'undefined') {
    window.updateTokenHelpLink = updateTokenHelpLink;
    window.handleSaveServerUrl = handleSaveServerUrl;
    window.fetchUserProfile = fetchUserProfile;
    window.requestHostPermissionIfNeeded = requestHostPermissionIfNeeded;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openNoteWindow,
        openNoteTab,
        openTodoWindow,
        openTodoTab,
        updateTokenHelpLink,
        handleSaveServerUrl,
        fetchUserProfile,
        requestHostPermissionIfNeeded
    };
}

