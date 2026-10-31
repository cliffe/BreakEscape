/**
 * LogFilterMinigame — VM-02 / MG-06
 *
 * Generic access-log analyser minigame.
 * Controlled entirely by scenarioData — no scenario-specific code here.
 *
 * logType: "vpn"     — VPN auth log (MG-06, sis01_healthcare)
 *          "ics_rdp" — Jump server session log (VM-02, sis02_energy)
 *
 * Expected scenarioData fields:
 *   title, logType, logEntries[], anomaly, threatIntel, accountHistory,
 *   flagActionLabel, flagConfirmTitle, flagConfirmBody, flagRejectedBody (optional),
 *   additionalTabs[], requireAllTabs, completionActions[], progressActions[]
 *
 * Optional wording (defaults are built from the scenario's own labels):
 *   completeBanner  — shown once the investigation is complete
 *   nextTabPrompt   — shown after flagging when requireAllTabs still needs a tab
 *   nextTabButton   — the button that opens that tab
 *   completedGlobal — global that marks the investigation done on reopen
 *                     (default: the first set_global true in completionActions)
 * A tab counts as visited on reopen when the progressActions entry with
 * trigger "tab_viewed" for its tabId has already set its global.
 *
 * Lookups follow the SELECTED row. threatIntel / accountHistory may each be one
 * object or an array; a record is used when its `ip` / `account` matches the row.
 * A row with no record gets a "no match" result built from the log itself.
 * Only the real anomaly row can be flagged successfully; other rows get feedback.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

export class LogFilterMinigame extends MinigameScene {

    // ── Column schemas ─────────────────────────────────────────────────────

    static LOG_FIELDS = {
        vpn: [
            { key: 'timestamp',   label: 'TIMESTAMP',   width: '148px' },
            { key: 'user',        label: 'USER',         width: '120px' },
            { key: 'ip',          label: 'IP',           width: '120px' },
            { key: 'country',     label: 'COUNTRY',      width: '70px'  },
            { key: 'mfa',         label: 'MFA',          width: '44px'  },
            { key: 'result',      label: 'RESULT',       width: '70px'  }
        ],
        ics_rdp: [
            { key: 'timestamp',   label: 'TIMESTAMP',   width: '140px' },
            { key: 'sessionId',   label: 'SESSION_ID',   width: '90px'  },
            { key: 'account',     label: 'ACCOUNT',      width: '100px' },
            { key: 'sourceIp',    label: 'SOURCE_IP',    width: '130px' },
            { key: 'duration',    label: 'DURATION',     width: '72px'  },
            { key: 'status',      label: 'STATUS',       width: '72px'  },
            { key: 'accessLevel', label: 'ACCESS_LEVEL', width: '100px' }
        ]
    };

    static FILTER_CATEGORIES = {
        vpn: [
            { id: 'country',  label: 'COUNTRY =',   type: 'enum',   values: ['UK', 'RO', 'US', 'DE', 'FR'] },
            { id: 'mfa',      label: 'MFA =',        type: 'enum',   values: ['YES', 'NO'] },
            { id: 'result',   label: 'RESULT =',     type: 'enum',   values: ['ACCEPT', 'REJECT'] },
            { id: 'user',     label: 'USER =',       type: 'text',   placeholder: 'username or prefix' },
            { id: 'time',     label: 'TIME =',       type: 'enum',   values: ['00-06', '06-12', '12-18', '18-24'] }
        ],
        ics_rdp: [
            { id: 'status',      label: 'STATUS =',       type: 'enum', values: ['ACTIVE', 'CLOSED', 'FAILED'] },
            { id: 'accessLevel', label: 'ACCESS_LEVEL =', type: 'enum', values: ['ENGINEER', 'CONTRACTOR', 'ADMIN'] },
            { id: 'account',     label: 'ACCOUNT =',      type: 'text', placeholder: 'account name or prefix' },
            { id: 'sourceIp',    label: 'SOURCE_IP =',    type: 'text', placeholder: 'IP prefix (e.g. 185.)' },
            { id: 'time',        label: 'TIME =',         type: 'enum', values: ['00-06', '06-12', '12-18', '18-24'] }
        ]
    };

    // ── Synthetic VPN log generation ──────────────────────────────────────

    static _pad2(v) { return String(v).padStart(2, '0'); }

    static _formatVpnTimestamp(totalMinutes) {
        const clamped = Math.max(0, Number(totalMinutes) || 0);
        const h = Math.floor(clamped / 60);
        const m = clamped % 60;
        return `2025-11-03 ${LogFilterMinigame._pad2(h)}:${LogFilterMinigame._pad2(m)}`;
    }

    static _buildSyntheticVpnLog(data) {
        const entryCount = Math.max(10, Number(data.entryCount) || 50);
        const anomaly = data.anomaly || {};
        const anomalyPos = Math.min(entryCount, Math.max(1, Number(anomaly.position) || 21));

        const users = [
            'f.rahman', 'd.chen', 'k.wilson', 'a.patel', 'e.nguyen',
            'j.okafor', 'r.james', 't.bergstrom', 's.murphy', 'p.whitmore',
            'b.marshall', 'g.robinson', 'l.foster', 'm.hassan', 'v.osei',
            'n.taylor', 'j.anderson', 'a.thompson', 'h.walker', 'c.morris'
        ];
        const ips = [
            '81.182.23.9', '90.193.44.72', '82.24.117.8', '91.108.4.12', '193.56.147.23',
            '79.77.215.4', '80.6.88.191', '194.44.12.88', '212.159.9.40', '88.97.183.4',
            '92.78.14.102', '81.99.44.23', '90.147.88.12', '86.155.249.78', '77.68.4.192',
            '178.62.44.12', '81.137.22.9', '90.215.143.7', '82.36.17.8', '86.44.122.3'
        ];

        const entries = [];
        for (let i = 0; i < entryCount; i++) {
            const minuteOffset = 4 + Math.floor((i * 442) / Math.max(1, entryCount - 1));
            entries.push({
                timestamp: LogFilterMinigame._formatVpnTimestamp((7 * 60) + minuteOffset),
                user: users[i % users.length],
                ip: ips[i % ips.length],
                country: 'UK',
                mfa: 'YES',
                result: 'ACCEPT'
            });
        }

        const prior = data.impossibleTravel?.priorEntry || {};
        const priorTs = String(prior.timestamp || '2025-11-03 08:22');
        const priorIp = String(prior.ip || '82.15.4.29');
        const anomalyTs = String(anomaly.timestamp || '2025-11-03 08:52');
        const anomalyUser = String(anomaly.user || anomaly.account || 'm.blake');
        const anomalyIp = String(anomaly.ip || '185.220.101.47');
        const anomalyCountry = String(anomaly.country || 'RO').toUpperCase();
        const anomalyMfa = String(anomaly.mfa || 'NO').toUpperCase();
        const anomalyResult = String(anomaly.result || 'ACCEPT').toUpperCase();

        // Inject prior (same-user UK) entry just before anomaly for impossible-travel evidence
        const historyIdx = Math.max(0, anomalyPos - 2);
        entries[historyIdx] = {
            timestamp: priorTs, user: anomalyUser, ip: priorIp,
            country: 'UK', mfa: 'YES', result: 'ACCEPT'
        };

        // Inject anomalous entry
        entries[anomalyPos - 1] = {
            timestamp: anomalyTs, user: anomalyUser, ip: anomalyIp,
            country: anomalyCountry, mfa: anomalyMfa, result: anomalyResult
        };

        // Inject noise entries (distractor rows with off-pattern values)
        const noise = Array.isArray(data.noise) ? data.noise : [];
        if (noise.length > 0) {
            noise.forEach((n, idx) => {
                const ti = Math.min(entryCount - 1, Math.max(0, 15 + idx));
                entries[ti] = {
                    timestamp: String(n.timestamp || LogFilterMinigame._formatVpnTimestamp((8 * 60) + 44 + idx)),
                    user: String(n.user || 'w.price'),
                    ip: String(n.ip || '91.108.14.4'),
                    country: String(n.country || 'UK').toUpperCase(),
                    mfa: String(n.mfa || 'NO').toUpperCase(),
                    result: String(n.result || 'ACCEPT').toUpperCase()
                };
            });
        } else {
            entries[16] = {
                timestamp: '2025-11-03 08:44', user: 'w.price',
                ip: '91.108.14.4', country: 'UK', mfa: 'NO', result: 'ACCEPT'
            };
        }

        return entries;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(container, params) {
        super(container, params);

        const raw = params.sprite?.scenarioData || {};
        const sd = raw.minigameData || raw;

        this._logType          = sd.logType || 'vpn';
        this._title            = sd.title || sd.consoleTitle || 'ACCESS LOG ANALYSER';
        this._logEntries       = sd.logEntries || [];
        this._anomaly          = sd.anomaly || null;
        this._threatIntel      = sd.threatIntel || null;
        this._accountHistory   = sd.accountHistory || null;
        this._flagActionLabel  = sd.flagActionLabel  || 'FLAG SESSION';
        this._flagConfirmTitle = sd.flagConfirmTitle || 'CONFIRM SESSION FLAG';
        this._flagConfirmBody  = sd.flagConfirmBody  || '';
        this._flagRejectedBody = sd.flagRejectedBody || '';   // optional text shown when a non-anomalous row is flagged
        this._additionalTabs   = sd.additionalTabs   || [];
        this._requireAllTabs   = sd.requireAllTabs   || false;
        this._completionActions = sd.completionActions || [];
        this._flagActions       = sd.flagActions       || [];  // Actions fired immediately when the session is flagged
        this._progressActions   = sd.progressActions  || [];
        this._stateOverrides    = sd.stateOverrides   || [];  // [{ whenGlobal, whenValue, matchEntry, setFields, setAnomaly }]

        // Wording and reopen state come from the scenario, so nothing here is
        // specific to one mission
        const firstTab = this._additionalTabs[0];
        const firstTabLabel = firstTab ? (firstTab.label || firstTab.title || firstTab.id) : '';
        const reviewed = this._requireAllTabs && this._additionalTabs.length > 0
            ? ` ${this._additionalTabs.map(t => t.label || t.title || t.id).join(', ')} reviewed.`
            : '';
        this._completeBanner = sd.completeBanner || `✓ INVESTIGATION COMPLETE: Session flagged.${reviewed}`;
        this._nextTabPrompt  = sd.nextTabPrompt  || `► Session flagged. Open the ${firstTabLabel} tab to complete your investigation.`;
        this._nextTabButton  = sd.nextTabButton  || `[VIEW ${firstTabLabel} →]`;
        const completionGlobal = this._completionActions.find(a => a && a.type === 'set_global' && a.value === true);
        this._completedGlobal = sd.completedGlobal || completionGlobal?.key || null;

        // Synthetic VPN log generation — activates when logType is 'vpn' and no explicit logEntries provided
        if (this._logType === 'vpn' && this._logEntries.length === 0) {
            this._logEntries = LogFilterMinigame._buildSyntheticVpnLog(sd);
            // Normalise anomaly.account from anomaly.user so _isAnomalyEntry() works
            if (this._anomaly && !this._anomaly.account && this._anomaly.user) {
                this._anomaly = { ...this._anomaly, account: this._anomaly.user };
            }
        }

        // UI state
        this._activeFilters     = [];
        this._sessionFlagged    = false;
        this._tabsVisited       = new Set();
        this._currentTab        = 'session_log';
        this._selectedEntry     = null;
        this._overlayMode       = null;   // null | 'threat_intel' | 'account_history' | 'flag_confirm' | 'audit_detail'
        this._selectedAuditEntry = null;
        this._filterPickerOpen  = false;
        this._filterPickerCat   = null;  // currently expanded category id
        this._closeTimer        = null;
        this._completionFired   = false;

        // DOM node references (set during render)
        this._dom = {};
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    start() {
        super.start();
        this._resumeStateFromGlobals();
        this._renderLayout();
        this._switchTab('session_log');
    }

    /** Resume partial state if player previously visited and set globals. */
    _resumeStateFromGlobals() {
        const globals = window.gameState?.globalVariables || {};

        // Apply stateOverrides — mutate log entries and anomaly based on current global state.
        // Used to reflect real-world actions (e.g. cable severed → session CLOSED) in the log display.
        for (const override of this._stateOverrides) {
            if (globals[override.whenGlobal] === override.whenValue) {
                if (override.matchEntry && override.setFields) {
                    for (const entry of this._logEntries) {
                        const matches = Object.entries(override.matchEntry).every(
                            ([k, v]) => entry[k] === v
                        );
                        if (matches) Object.assign(entry, override.setFields);
                    }
                }
                if (override.setAnomaly && this._anomaly) {
                    Object.assign(this._anomaly, override.setAnomaly);
                }
            }
        }

        if (this._anomaly && this._completedGlobal && globals[this._completedGlobal] === true) {
            this._sessionFlagged = true;
            this._completionFired = true;
        }
        // Tabs whose "tab_viewed" progress action has already fired count as visited
        for (const a of this._progressActions) {
            if (a && a.trigger === 'tab_viewed' && a.tabId && a.key && globals[a.key] === true) {
                this._tabsVisited.add(a.tabId);
            }
        }
    }

    // ── Top-level layout ───────────────────────────────────────────────────

    _renderLayout() {
        const c = this.container;
        c.innerHTML = '';

        // Outer wrapper
        const wrap = this._el('div', 'lf-wrapper');
        c.appendChild(wrap);
        this._dom.wrap = wrap;

        // Header
        const header = this._el('div', 'lf-header');
        const titleEl = this._el('div', 'lf-header-title');
        titleEl.textContent = displayDashes(this._title);
        const closeBtn = this._el('button', 'lf-close-btn');
        closeBtn.textContent = '[CLOSE]';
        closeBtn.addEventListener('click', () => this.complete(false));
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        wrap.appendChild(header);

        // Tab bar
        const tabBar = this._el('div', 'lf-tab-bar');
        wrap.appendChild(tabBar);
        this._dom.tabBar = tabBar;

        // Body
        const body = this._el('div', 'lf-body');
        wrap.appendChild(body);
        this._dom.body = body;

        // Status bar
        const statusBar = this._el('div', 'lf-status-bar');
        wrap.appendChild(statusBar);
        this._dom.statusBar = statusBar;

        this._rebuildTabBar();
    }

    _rebuildTabBar() {
        const bar = this._dom.tabBar;
        bar.innerHTML = '';

        // Session log tab
        const btn0 = this._el('button', 'lf-tab-btn');
        btn0.textContent = 'SESSION LOG';
        btn0.dataset.tabId = 'session_log';
        btn0.addEventListener('click', () => this._switchTab('session_log'));
        bar.appendChild(btn0);

        // Additional tabs
        for (const tab of this._additionalTabs) {
            const btn = this._el('button', 'lf-tab-btn');
            btn.textContent = displayDashes(tab.label);
            btn.dataset.tabId = tab.id;
            if (!this._tabsVisited.has(tab.id)) {
                btn.classList.add('lf-tab-unread');
            }
            btn.addEventListener('click', () => this._switchTab(tab.id));
            bar.appendChild(btn);
        }

        this._updateTabActiveClass();
    }

    _updateTabActiveClass() {
        const bar = this._dom.tabBar;
        bar.querySelectorAll('.lf-tab-btn').forEach(btn => {
            btn.classList.toggle('lf-tab-active', btn.dataset.tabId === this._currentTab);
        });
    }

    _switchTab(tabId) {
        this._currentTab = tabId;
        this._overlayMode = null;
        this._updateTabActiveClass();

        const body = this._dom.body;
        body.innerHTML = '';

        if (tabId === 'session_log') {
            this._renderSessionLogTab(body);
        } else {
            const tab = this._additionalTabs.find(t => t.id === tabId);
            if (tab) {
                this._onAdditionalTabVisited(tab);
                if (tab.type === 'audit_log') {
                    this._renderAuditLogTab(body, tab);
                }
            }
        }

        this._updateStatusBar();
    }

    // ── Session Log Tab ────────────────────────────────────────────────────

    _renderSessionLogTab(body) {
        // Left pane: filter builder
        const filterPane = this._el('div', 'lf-filter-pane');
        body.appendChild(filterPane);
        this._dom.filterPane = filterPane;
        this._renderFilterPane(filterPane);

        // Right pane: log
        const logPane = this._el('div', 'lf-log-pane');
        body.appendChild(logPane);
        this._dom.logPane = logPane;
        this._renderLogTable(logPane);

        // Session detail (rendered below log table inside logPane)
        if (this._sessionFlagged && this._completionFired) {
            const banner = this._el('div', 'lf-complete-banner');
            banner.textContent = displayDashes(this._completeBanner);
            logPane.appendChild(banner);
        } else if (this._selectedEntry) {
            this._renderSessionDetail(logPane);
        }
    }

    // ── Filter Pane ────────────────────────────────────────────────────────

    _renderFilterPane(pane) {
        pane.innerHTML = '';

        const label = this._el('div', 'lf-filter-pane-label');
        label.textContent = 'FILTER BUILDER';
        pane.appendChild(label);

        // ADD FILTER button
        const addBtn = this._el('button', 'lf-add-filter-btn');
        addBtn.textContent = '[+ ADD FILTER]';
        addBtn.addEventListener('click', () => {
            this._filterPickerOpen = !this._filterPickerOpen;
            if (!this._filterPickerOpen) this._filterPickerCat = null;
            this._renderFilterPane(pane);
        });
        pane.appendChild(addBtn);

        // Picker dropdown
        if (this._filterPickerOpen) {
            this._renderFilterPicker(pane);
        }

        // Active filters label
        const activeLabel = this._el('div', 'lf-active-filters-label');
        activeLabel.textContent = `Active filters: (${this._activeFilters.length})`;
        pane.appendChild(activeLabel);

        // Token pills
        if (this._activeFilters.length > 0) {
            const tokensWrap = this._el('div', 'lf-filter-tokens');
            for (let i = 0; i < this._activeFilters.length; i++) {
                const f = this._activeFilters[i];
                const token = this._el('div', `lf-filter-token lf-token-${f.category.toLowerCase()}`);
                const label2 = document.createTextNode(`${f.category.toUpperCase()}=${f.value}`);
                const rmBtn = this._el('button', 'lf-filter-token-remove');
                rmBtn.textContent = '×';
                rmBtn.addEventListener('click', () => {
                    this._activeFilters.splice(i, 1);
                    this._onFiltersChanged();
                });
                token.appendChild(label2);
                token.appendChild(rmBtn);
                tokensWrap.appendChild(token);
            }
            pane.appendChild(tokensWrap);
        }

        // Command preview
        const previewLabel = this._el('div', 'lf-command-preview-label');
        previewLabel.textContent = 'COMMAND PREVIEW';
        pane.appendChild(previewLabel);

        const preview = this._el('div', 'lf-command-preview');
        preview.textContent = this._buildCommandPreview();
        pane.appendChild(preview);
        this._dom.commandPreview = preview;

        // Clear all
        const clearBtn = this._el('button', 'lf-clear-filters-btn');
        clearBtn.textContent = '[CLEAR ALL FILTERS]';
        clearBtn.addEventListener('click', () => {
            this._activeFilters = [];
            this._filterPickerOpen = false;
            this._filterPickerCat = null;
            this._onFiltersChanged();
        });
        pane.appendChild(clearBtn);
    }

    _renderFilterPicker(pane) {
        const picker = this._el('div', 'lf-filter-picker');
        const categories = LogFilterMinigame.FILTER_CATEGORIES[this._logType] || [];

        for (const cat of categories) {
            const catEl = this._el('div', 'lf-filter-category');
            catEl.textContent = cat.label;
            if (this._filterPickerCat === cat.id) {
                catEl.classList.add('lf-filter-category-open');
            }
            catEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this._filterPickerCat = (this._filterPickerCat === cat.id) ? null : cat.id;
                this._renderFilterPane(pane);
            });
            picker.appendChild(catEl);

            // Values panel for this category
            if (this._filterPickerCat === cat.id) {
                const valuesDiv = this._el('div', 'lf-filter-values');

                if (cat.type === 'enum') {
                    for (const val of cat.values) {
                        const item = this._el('div', 'lf-filter-value-item');
                        item.textContent = val;
                        item.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this._addFilter(cat.id, val);
                        });
                        valuesDiv.appendChild(item);
                    }
                } else if (cat.type === 'text') {
                    const input = this._el('input', 'lf-filter-text-input');
                    input.type = 'text';
                    input.placeholder = cat.placeholder || '';
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && input.value.trim()) {
                            this._addFilter(cat.id, input.value.trim());
                        }
                    });
                    input.addEventListener('click', e => e.stopPropagation());
                    valuesDiv.appendChild(input);
                }

                picker.appendChild(valuesDiv);
            }
        }

        pane.appendChild(picker);
    }

    _addFilter(category, value) {
        // Replace existing filter for same category (single-select per category)
        this._activeFilters = this._activeFilters.filter(f => f.category !== category);
        this._activeFilters.push({ category, value });
        this._filterPickerOpen = false;
        this._filterPickerCat = null;
        this._onFiltersChanged();
    }

    _onFiltersChanged() {
        if (this._dom.filterPane) {
            this._renderFilterPane(this._dom.filterPane);
        }
        if (this._dom.logPane) {
            this._renderLogTable(this._dom.logPane);
            if (this._selectedEntry) {
                this._renderSessionDetail(this._dom.logPane);
            }
        }
        this._updateStatusBar();
    }

    // ── Command Preview ────────────────────────────────────────────────────

    _buildCommandPreview() {
        if (this._activeFilters.length === 0) {
            if (this._logType === 'ics_rdp') {
                return '$ cat /var/log/js-albion-01/access.log';
            }
            return '$ cat /var/log/vpn/auth.log';
        }

        const filters = this._activeFilters;

        if (this._logType === 'ics_rdp') {
            // Column index map for awk (1-based)
            const COL = { timestamp: 1, sessionId: 2, account: 3, sourceIp: 4, duration: 5, status: 6, accessLevel: 7 };
            const lines = [];
            for (let i = 0; i < filters.length; i++) {
                const f = filters[i];
                const isFirst = i === 0;
                const prefix = isFirst ? '$ ' : '  | ';

                if (f.category === 'account') {
                    // Use grep for account text match
                    lines.push(`${prefix}grep "${f.value}" /var/log/js-albion-01/access.log`);
                } else if (f.category === 'sourceIp') {
                    const escaped = f.value.replace('.', '\\.');
                    lines.push(`${prefix}awk -F'|' '$${COL.sourceIp} ~ /^${escaped}/' /var/log/js-albion-01/access.log`);
                } else if (f.category === 'time') {
                    const hourRange = this._timeRangeToHour(f.value);
                    lines.push(`${prefix}awk -F'|' '${hourRange}' /var/log/js-albion-01/access.log`);
                } else {
                    const colIdx = COL[f.category];
                    if (colIdx) {
                        lines.push(`${prefix}awk -F'|' '$${colIdx} == "${f.value}"' /var/log/js-albion-01/access.log`);
                    }
                }
                // Continuation lines use pipe
                if (i === 0 && filters.length > 1) {
                    lines[lines.length - 1] += ' \\';
                } else if (i > 0 && i < filters.length - 1) {
                    lines[lines.length - 1] += ' \\';
                }
            }
            return lines.join('\n');
        }

        // VPN: grep-based
        const lines = [];
        for (let i = 0; i < filters.length; i++) {
            const f = filters[i];
            const isFirst = i === 0;
            const prefix = isFirst ? '$ grep ' : '  | grep ';
            let term = '';
            if (f.category === 'country') term = `"COUNTRY=${f.value}"`;
            else if (f.category === 'mfa')     term = `"MFA=${f.value}"`;
            else if (f.category === 'result')  term = `"RESULT=${f.value}"`;
            else if (f.category === 'user')    term = `"${f.value}"`;
            else if (f.category === 'time')    {
                const hourRange = this._timeRangeToHour(f.value);
                term = `"${hourRange}"`;
            }
            const suffix = isFirst ? ` /var/log/vpn/auth.log` : '';
            const cont = (i < filters.length - 1) ? ' \\' : '';
            lines.push(`${prefix}${term}${suffix}${cont}`);
        }
        return lines.join('\n');
    }

    _timeRangeToHour(rangeStr) {
        // "00-06" → awk condition or grep pattern
        const map = { '00-06': '00|01|02|03|04|05', '06-12': '06|07|08|09|10|11', '12-18': '12|13|14|15|16|17', '18-24': '18|19|20|21|22|23' };
        if (this._logType === 'ics_rdp') {
            // Return awk hour condition based on col 1 (timestamp)
            const hours = (map[rangeStr] || '').split('|');
            return hours.map(h => `substr($1,12,2)=="${h}"`).join(' || ');
        }
        return map[rangeStr] || rangeStr;
    }

    // ── Log Table ──────────────────────────────────────────────────────────

    _renderLogTable(pane) {
        // Remove old table if present
        const oldTable = pane.querySelector('.lf-log-table-wrap');
        if (oldTable) oldTable.remove();

        const wrap = this._el('div', 'lf-log-table-wrap');
        // Insert before session-detail if it exists
        const detail = pane.querySelector('.lf-session-detail');
        if (detail) {
            pane.insertBefore(wrap, detail);
        } else {
            pane.appendChild(wrap);
        }
        this._dom.logTableWrap = wrap;

        const fields = LogFilterMinigame.LOG_FIELDS[this._logType] || [];
        const filtered = this._applyFilters(this._logEntries);

        const table = this._el('table', 'lf-log-table');
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const f of fields) {
            const th = document.createElement('th');
            th.textContent = f.label;
            th.style.width = f.width;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        const isAnomaly = (entry) => {
            if (!this._anomaly) return false;
            return entry.account === this._anomaly.account ||
                   entry.user === this._anomaly.account ||
                   (entry.status === this._anomaly.status && entry.sourceIp === this._anomaly.sourceIp);
        };

        for (const entry of this._logEntries) {
            const tr = document.createElement('tr');
            tr.classList.add('lf-log-row');
            const visible = filtered.includes(entry);
            if (!visible) tr.classList.add('lf-row-dim');
            if (isAnomaly(entry)) tr.classList.add('lf-anomaly-row');
            if (this._selectedEntry === entry) tr.classList.add('lf-row-selected');

            for (const f of fields) {
                const td = document.createElement('td');
                td.classList.add(`lf-field-${f.key.toLowerCase().replace('_', '-')}`);
                this._renderCellValue(td, f.key, entry[f.key] || '', entry, isAnomaly(entry));
                tr.appendChild(td);
            }

            tr.addEventListener('click', () => this._selectEntry(entry));
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
    }

    _renderCellValue(td, key, val, entry, anomalyRow) {
        if (key === 'status') {
            if (val === 'ACTIVE') {
                const span = this._el('span', 'lf-badge lf-status-active');
                span.textContent = val;
                td.appendChild(span);
            } else if (val === 'CLOSED') {
                const span = this._el('span', 'lf-status-closed');
                span.textContent = val;
                td.appendChild(span);
            } else if (val === 'FAILED') {
                const span = this._el('span', 'lf-status-failed');
                span.textContent = val;
                td.appendChild(span);
            } else if (val === 'ACCEPT') {
                const span = this._el('span', 'lf-status-accept');
                span.textContent = val;
                td.appendChild(span);
            } else if (val === 'REJECT') {
                const span = this._el('span', 'lf-status-reject');
                span.textContent = val;
                td.appendChild(span);
            } else {
                td.textContent = val;
            }
        } else if (key === 'accessLevel') {
            const cls = { ENGINEER: 'lf-level-engineer', CONTRACTOR: 'lf-level-contractor', ADMIN: 'lf-level-admin' }[val];
            if (cls) {
                const span = this._el('span', cls);
                span.textContent = val;
                td.appendChild(span);
            } else {
                td.textContent = val;
            }
        } else if (key === 'duration' && anomalyRow && val.includes('+')) {
            const span = this._el('span', 'lf-duration-growing');
            span.textContent = val;
            td.appendChild(span);
        } else if (key === 'sessionId') {
            td.classList.add('lf-field-session-id');
            td.textContent = val;
        } else if (key === 'timestamp') {
            td.classList.add('lf-field-timestamp');
            td.textContent = val;
        } else {
            td.textContent = val;
        }
    }

    _applyFilters(entries) {
        if (this._activeFilters.length === 0) return entries;
        return entries.filter(entry => {
            return this._activeFilters.every(f => {
                const cat = f.category;
                const val = f.value.toLowerCase();
                if (cat === 'status')      return (entry.status      || '').toLowerCase() === val;
                if (cat === 'accessLevel') return (entry.accessLevel || '').toLowerCase() === val;
                if (cat === 'account')     return (entry.account     || entry.user || '').toLowerCase().includes(val);
                if (cat === 'user')        return (entry.user        || '').toLowerCase().includes(val);
                if (cat === 'sourceIp')    return (entry.sourceIp    || entry.ip   || '').toLowerCase().startsWith(val);
                if (cat === 'country')     return (entry.country     || '').toLowerCase() === val;
                if (cat === 'mfa')         return (entry.mfa         || '').toLowerCase() === val;
                if (cat === 'result')      return (entry.result      || '').toLowerCase() === val;
                if (cat === 'time')        return this._matchesTimeRange(entry.timestamp || '', f.value);
                return true;
            });
        });
    }

    _matchesTimeRange(timestamp, range) {
        const match = timestamp.match(/\d{2}:(\d{2})|\s(\d{2}):\d{2}/);
        const hourStr = timestamp.slice(11, 13);
        const hour = parseInt(hourStr, 10);
        if (isNaN(hour)) return true;
        const ranges = { '00-06': [0, 5], '06-12': [6, 11], '12-18': [12, 17], '18-24': [18, 23] };
        const [lo, hi] = ranges[range] || [0, 23];
        return hour >= lo && hour <= hi;
    }

    _selectEntry(entry) {
        this._selectedEntry = entry;
        if (this._dom.body) this._closeOverlay();
        this._overlayMode = null;

        // Re-render log table selection highlights
        if (this._dom.logTableWrap) {
            this._dom.logTableWrap.querySelectorAll('.lf-log-row').forEach((tr, i) => {
                tr.classList.toggle('lf-row-selected', this._logEntries[i] === entry);
            });
        }

        // Remove existing session detail / banners
        if (this._dom.logPane) {
            const existing = this._dom.logPane.querySelectorAll('.lf-session-detail, .lf-complete-banner');
            existing.forEach(el => el.remove());
            this._renderSessionDetail(this._dom.logPane);
        }
    }

    // ── Session Detail Panel ───────────────────────────────────────────────

    _renderSessionDetail(pane) {
        const entry = this._selectedEntry;
        if (!entry) return;

        // Only one Session Detail card at a time: a new render replaces the old one.
        pane.querySelectorAll('.lf-session-detail').forEach(el => el.remove());

        const panel = this._el('div', 'lf-session-detail');
        this._dom.sessionDetail = panel;

        const header = this._el('div', 'lf-detail-header');
        header.textContent = 'SESSION DETAIL';
        panel.appendChild(header);

        const grid = this._el('div', 'lf-detail-grid');

        const fields = LogFilterMinigame.LOG_FIELDS[this._logType] || [];
        for (const f of fields) {
            const lbl = this._el('div', 'lf-detail-label');
            lbl.textContent = f.label + ':';
            const val = this._el('div', 'lf-detail-value');
            val.textContent = displayDashes(entry[f.key] || '-');
            grid.appendChild(lbl);
            grid.appendChild(val);
        }
        panel.appendChild(grid);

        // Action buttons
        const actions = this._el('div', 'lf-detail-actions');
        panel.appendChild(actions);

        const anomalyEntry = this._isAnomalyEntry(entry);

        // [LOOK UP IP] — always shown
        const ipBtn = this._el('button', 'lf-detail-btn');
        ipBtn.textContent = '[LOOK UP IP]';
        ipBtn.addEventListener('click', () => {
            this._openOverlay('threat_intel');
            // Progress only counts when the lookup hit the configured threat-intel record
            // for the anomaly, not when the player looked up some other row.
            if (this._intelMatchesAnomaly(entry)) this._fireTriggerActions('threat_intel_opened');
        });
        actions.appendChild(ipBtn);

        // [INVESTIGATE ACCOUNT] — always shown
        const accBtn = this._el('button', 'lf-detail-btn');
        accBtn.textContent = '[INVESTIGATE ACCOUNT]';
        accBtn.addEventListener('click', () => {
            this._openOverlay('account_history');
            if (this._accountMatchesAnomaly(entry)) this._fireTriggerActions('account_history_opened');
        });
        actions.appendChild(accBtn);

        // [FLAG SESSION] — available on every row. Flagging the anomaly follows the
        // confirm path; flagging any other row gives "not this one" feedback.
        if (anomalyEntry && this._sessionFlagged) {
            const flagged = this._el('div', 'lf-session-flagged-banner');
            flagged.textContent = '✓ SESSION FLAGGED';
            actions.appendChild(flagged);

            if (this._requireAllTabs && !this._allAddlTabsVisited()) {
                this._renderTab2Prompt(panel);
            }
        } else {
            const flagBtn = this._el('button', 'lf-detail-btn lf-detail-btn-flag');
            flagBtn.textContent = displayDashes(`[${this._flagActionLabel}]`);
            flagBtn.addEventListener('click', () => {
                this._openOverlay(anomalyEntry ? 'flag_confirm' : 'flag_rejected');
            });
            actions.appendChild(flagBtn);
        }

        pane.appendChild(panel);
    }

    _renderTab2Prompt(panel) {
        const prompt = this._el('div', 'lf-tab2-prompt');
        const text = document.createTextNode(displayDashes(this._nextTabPrompt));
        const goBtn = this._el('button', 'lf-tab2-prompt-btn');
        goBtn.textContent = displayDashes(this._nextTabButton);
        goBtn.addEventListener('click', () => {
            if (this._additionalTabs.length > 0) {
                this._switchTab(this._additionalTabs[0].id);
                this._rebuildTabBar();
            }
        });
        prompt.appendChild(text);
        prompt.appendChild(goBtn);
        panel.appendChild(prompt);
    }

    _entryIp(entry) {
        return String(entry?.ip || entry?.sourceIp || '');
    }

    _entryAccount(entry) {
        return String(entry?.account || entry?.user || '');
    }

    _anomalyAccount() {
        return String(this._anomaly?.account || this._anomaly?.user || '');
    }

    /** The anomalous session itself: the anomaly's account on the anomaly's IP (when it names one). */
    _isAnomalyEntry(entry) {
        if (!this._anomaly || !entry) return false;
        const account = this._anomalyAccount();
        if (!account || this._entryAccount(entry) !== account) return false;
        const anomalyIp = String(this._anomaly.ip || this._anomaly.sourceIp || '');
        return !anomalyIp || this._entryIp(entry) === anomalyIp;
    }

    static _asList(v) {
        if (Array.isArray(v)) return v.filter(Boolean);
        return v ? [v] : [];
    }

    /** Threat-intel record for the selected row's IP, or null. `threatIntel` may be one object or an array. */
    _lookupThreatIntel(entry) {
        const ip = this._entryIp(entry);
        for (const ti of LogFilterMinigame._asList(this._threatIntel)) {
            if (ti.ip ? ti.ip === ip : this._isAnomalyEntry(entry)) return ti;
        }
        return null;
    }

    /** Account profile for the selected row's account, or null. `accountHistory` may be one object or an array. */
    _lookupAccountHistory(entry) {
        const acc = this._entryAccount(entry);
        for (const ah of LogFilterMinigame._asList(this._accountHistory)) {
            if (ah.account ? ah.account === acc : this._isAnomalyEntry(entry)) return ah;
        }
        return null;
    }

    _intelMatchesAnomaly(entry) {
        const ti = this._lookupThreatIntel(entry);
        if (!ti || !this._anomaly) return false;
        const anomalyIp = String(this._anomaly.ip || this._anomaly.sourceIp || '');
        return ti.ip ? ti.ip === anomalyIp : this._isAnomalyEntry(entry);
    }

    _accountMatchesAnomaly(entry) {
        const ah = this._lookupAccountHistory(entry);
        if (!ah || !this._anomaly) return false;
        return (ah.account || this._anomalyAccount()) === this._anomalyAccount();
    }

    /** Summary of an account built from the log itself, for rows with no profile configured. */
    _summariseAccount(entry) {
        const acc = this._entryAccount(entry);
        const rows = this._logEntries.filter(e => this._entryAccount(e) === acc);
        const ips = [...new Set(rows.map(e => this._entryIp(e)).filter(Boolean))];
        const countries = [...new Set(rows.map(e => e.country).filter(Boolean))];
        const noMfa = rows.filter(e => e.mfa && String(e.mfa).toUpperCase() === 'NO').length;
        const hasMfa = rows.some(e => e.mfa);
        const times = rows.map(e => e.timestamp).filter(Boolean).sort();
        return { account: acc, count: rows.length, ips, countries, noMfa, hasMfa, last: times[times.length - 1] || '' };
    }

    // ── Overlays ───────────────────────────────────────────────────────────

    _openOverlay(mode) {
        this._overlayMode = mode;
        this._renderOverlay();
    }

    _closeOverlay() {
        this._overlayMode = null;
        const existing = this._dom.body.querySelector('.lf-overlay');
        if (existing) existing.remove();
    }

    _renderOverlay() {
        // Remove existing overlay
        const existing = this._dom.body.querySelector('.lf-overlay');
        if (existing) existing.remove();

        const overlay = this._el('div', 'lf-overlay');
        this._dom.body.appendChild(overlay);

        const panel = this._el('div', 'lf-overlay-panel');
        overlay.appendChild(panel);

        switch (this._overlayMode) {
            case 'threat_intel':    this._renderThreatIntelOverlay(panel); break;
            case 'account_history': this._renderAccountHistoryOverlay(panel); break;
            case 'flag_confirm':    this._renderFlagConfirmOverlay(panel); break;
            case 'flag_rejected':   this._renderFlagRejectedOverlay(panel); break;
            case 'audit_detail':    this._renderAuditDetailOverlay(panel); break;
        }
    }

    _overlayHeader(panel, title) {
        const hdr = this._el('div', 'lf-overlay-header');
        const t = this._el('span');
        t.textContent = displayDashes(title);
        const closeBtn = this._el('button', 'lf-overlay-close');
        closeBtn.textContent = '[✕]';
        closeBtn.addEventListener('click', () => this._closeOverlay());
        hdr.appendChild(t);
        hdr.appendChild(closeBtn);
        panel.appendChild(hdr);
        const body = this._el('div', 'lf-overlay-body');
        panel.appendChild(body);
        return body;
    }

    _addGridRows(grid, rows, labelCls, valueCls) {
        for (const [lbl, val] of rows) {
            const l = this._el('div', labelCls); l.textContent = lbl;
            const v = this._el('div', valueCls); v.textContent = displayDashes(val);
            grid.appendChild(l); grid.appendChild(v);
        }
    }

    _renderThreatIntelOverlay(panel) {
        const entry = this._selectedEntry;
        const ti = entry ? this._lookupThreatIntel(entry) : null;
        const body = this._overlayHeader(panel, 'THREAT INTELLIGENCE: IP LOOKUP');
        const grid = this._el('div', 'lf-threat-grid');

        if (!ti) {
            // No intel for this row's IP: report what the log says and that nothing matched.
            const rows = [
                ['IP:', this._entryIp(entry) || '-'],
                ['Result:', 'No match in threat-intelligence feeds']
            ];
            if (entry?.country) rows.push(['Country:', entry.country]);
            this._addGridRows(grid, rows, 'lf-threat-label', 'lf-threat-value');
            body.appendChild(grid);
            const clean = this._el('div', 'lf-threat-no-match');
            clean.textContent = '✓ No known-bad record for this IP';
            body.appendChild(clean);
            return;
        }

        this._addGridRows(grid, [
            ['IP:', ti.ip || this._entryIp(entry)],
            ['ASN:', ti.asn],
            ['Type:', ti.type],
            ['Location:', ti.location],
            ['Last flagged:', ti.lastFlagged]
        ], 'lf-threat-label', 'lf-threat-value');
        body.appendChild(grid);

        if (ti.knownBad) {
            const badge = this._el('div', 'lf-threat-known-bad');
            badge.textContent = displayDashes(`⚠ KNOWN BAD: YES${ti.type ? `: ${ti.type}` : ''}`);
            body.appendChild(badge);
        }
    }

    _renderAccountHistoryOverlay(panel) {
        const entry = this._selectedEntry;
        const ah = entry ? this._lookupAccountHistory(entry) : null;
        if (!ah) {
            this._renderAccountSummaryOverlay(panel, entry);
            return;
        }
        const body = this._overlayHeader(panel, `ACCOUNT INVESTIGATION: ${ah.account}`);

        const divider1 = this._el('hr', 'lf-overlay-divider');
        body.appendChild(divider1);

        const grid = this._el('div', 'lf-account-grid');
        const rows = [
            ['Full name:', ah.fullName],
            ['Contractor:', ah.contractor],
            ['Role:', ah.role],
            ['Access level:', ah.accessLevel],
            ['Account status:', ah.status],
        ];
        for (const [lbl, val] of rows) {
            const l = this._el('div', 'lf-account-label'); l.textContent = lbl;
            const v = this._el('div', 'lf-account-value');
            if (val === 'DEPROVISIONED' || (val && val.startsWith('DEPROVISIONED'))) {
                v.classList.add('lf-account-deprovisioned');
            }
            v.textContent = displayDashes(val);
            grid.appendChild(l); grid.appendChild(v);
        }

        // Deprovision note (special — shows gap)
        if (ah.deprovisionNote) {
            const lbl = this._el('div', 'lf-account-label'); lbl.textContent = '';
            const val = this._el('div', 'lf-account-value lf-account-gap-note');
            val.textContent = displayDashes(ah.deprovisionNote);
            grid.appendChild(lbl); grid.appendChild(val);
        }
        body.appendChild(grid);

        const divider2 = this._el('hr', 'lf-overlay-divider');
        body.appendChild(divider2);

        const grid2 = this._el('div', 'lf-account-grid');
        const rows2 = [
            ['Last legit session:', ah.lastLegitimateSession],
            ['Current session:', ah.currentSession]
        ];
        for (const [lbl, val] of rows2) {
            const l = this._el('div', 'lf-account-label'); l.textContent = lbl;
            const v = this._el('div', 'lf-account-value'); v.textContent = displayDashes(val);
            grid2.appendChild(l); grid2.appendChild(v);
        }
        body.appendChild(grid2);

        if (ah.anomalyBadge) {
            const badge = this._el('div', 'lf-account-anomaly-badge');
            badge.textContent = displayDashes(`⚠ ${ah.anomalyBadge}`);
            body.appendChild(badge);
        }
    }

    /** Account view for a row with no configured profile: facts drawn from the log itself. */
    _renderAccountSummaryOverlay(panel, entry) {
        const sum = this._summariseAccount(entry || {});
        const body = this._overlayHeader(panel, `ACCOUNT INVESTIGATION: ${sum.account || 'UNKNOWN'}`);
        body.appendChild(this._el('hr', 'lf-overlay-divider'));

        const rows = [
            ['Account status:', 'No profile flags on record'],
            ['Sessions in this log:', String(sum.count)]
        ];
        if (sum.countries.length) rows.push(['Source countries:', sum.countries.join(', ')]);
        if (sum.ips.length) rows.push(['Source IPs:', sum.ips.join(', ')]);
        if (sum.hasMfa) {
            rows.push(['MFA:', sum.noMfa === 0 ? 'Used on every session'
                : `Not used on ${sum.noMfa} of ${sum.count} session${sum.count !== 1 ? 's' : ''}`]);
        }
        if (sum.last) rows.push(['Last session:', sum.last]);
        const grid = this._el('div', 'lf-account-grid');
        this._addGridRows(grid, rows, 'lf-account-label', 'lf-account-value');
        body.appendChild(grid);
    }

    _renderFlagRejectedOverlay(panel) {
        const body = this._overlayHeader(panel, 'NOT THIS ONE');
        const entry = this._selectedEntry || {};
        const who = this._entryAccount(entry) || 'this account';
        const ip = this._entryIp(entry);

        const text = this._el('div', 'lf-flag-confirm-body');
        text.textContent = displayDashes(this._flagRejectedBody
            || `The session for ${who}${ip ? ` from ${ip}` : ''} does not match the pattern you are looking for. Nothing has been escalated. Check the IP lookup and account history, then try another row.`);
        body.appendChild(text);

        const actions = this._el('div', 'lf-flag-confirm-actions');
        const ok = this._el('button', 'lf-flag-cancel-btn');
        ok.textContent = '[BACK TO LOG]';
        ok.addEventListener('click', () => this._closeOverlay());
        actions.appendChild(ok);
        body.appendChild(actions);
    }

    _renderFlagConfirmOverlay(panel) {
        const body = this._overlayHeader(panel, this._flagConfirmTitle);

        const text = this._el('div', 'lf-flag-confirm-body');
        text.textContent = displayDashes(this._flagConfirmBody);
        body.appendChild(text);

        const actions = this._el('div', 'lf-flag-confirm-actions');

        const cancel = this._el('button', 'lf-flag-cancel-btn');
        cancel.textContent = '[CANCEL]';
        cancel.addEventListener('click', () => this._closeOverlay());

        const confirm = this._el('button', 'lf-flag-confirm-btn');
        confirm.textContent = '[CONFIRM: FLAG ACTIVE SESSION]';
        confirm.addEventListener('click', () => this._onFlagConfirmed());

        actions.appendChild(cancel);
        actions.appendChild(confirm);
        body.appendChild(actions);
    }

    _onFlagConfirmed() {
        this._sessionFlagged = true;
        this._executeActions(this._flagActions);
        this._closeOverlay();

        // Re-render session detail to show flagged state
        if (this._dom.logPane) {
            const existing = this._dom.logPane.querySelectorAll('.lf-session-detail');
            existing.forEach(el => el.remove());
            if (this._selectedEntry) {
                this._renderSessionDetail(this._dom.logPane);
            }
        }

        this._checkCompletion();
    }

    // ── Additional Tabs ────────────────────────────────────────────────────

    _onAdditionalTabVisited(tab) {
        if (this._tabsVisited.has(tab.id)) return;
        this._tabsVisited.add(tab.id);

        // Remove unread indicator
        const btn = this._dom.tabBar.querySelector(`[data-tab-id="${tab.id}"]`);
        if (btn) btn.classList.remove('lf-tab-unread');

        // Fire onView setVariable
        if (tab.onView?.setVariable) {
            for (const [key, val] of Object.entries(tab.onView.setVariable)) {
                this._setGlobalAndNotify(key, val);
            }
        }

        // Fire matching progressActions
        this._fireTriggerActions('tab_viewed', tab.id);

        this._checkCompletion();
    }

    _allAddlTabsVisited() {
        return this._additionalTabs.every(t => this._tabsVisited.has(t.id));
    }

    // ── Audit Log Tab ──────────────────────────────────────────────────────

    _renderAuditLogTab(body, tab) {
        const pane = this._el('div', 'lf-audit-pane');
        body.appendChild(pane);

        // Header bar
        const headerBar = this._el('div', 'lf-audit-header-bar');
        const titleEl = this._el('div', 'lf-audit-title');
        titleEl.textContent = displayDashes(tab.title || 'AUDIT LOG');
        const subtitleEl = this._el('div', 'lf-audit-subtitle');
        subtitleEl.textContent = displayDashes(tab.subtitle || '');
        headerBar.appendChild(titleEl);
        headerBar.appendChild(subtitleEl);
        pane.appendChild(headerBar);

        const tableWrap = this._el('div', 'lf-audit-table-wrap');
        pane.appendChild(tableWrap);

        const table = this._el('table', 'lf-audit-table');
        const thead = document.createElement('thead');
        const hRow = document.createElement('tr');
        const auditFields = [
            { key: 'timestamp', label: 'TIMESTAMP',  width: '140px' },
            { key: 'operator',  label: 'OPERATOR',   width: '110px' },
            { key: 'command',   label: 'COMMAND',    width: '120px' },
            { key: 'parameter', label: 'PARAMETER',  width: '160px' },
            { key: 'result',    label: 'RESULT',     width: '60px'  }
        ];
        for (const f of auditFields) {
            const th = document.createElement('th');
            th.textContent = f.label;
            th.style.width = f.width;
            hRow.appendChild(th);
        }
        thead.appendChild(hRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const entries = tab.auditEntries || [];
        for (const entry of entries) {
            const tr = document.createElement('tr');
            tr.classList.add('lf-audit-row');

            const isAnomalyEntry = entry.operator && entry.operator !== '[SYSTEM]' &&
                this._anomaly && entry.operator === this._anomaly.account;
            const isError = entry.errorClass === true || entry.result === 'ERR';

            if (isAnomalyEntry) tr.classList.add('lf-audit-anomaly-row');
            if (isError)        tr.classList.add('lf-audit-error-row');

            for (const f of auditFields) {
                const td = document.createElement('td');
                if (f.key === 'operator') {
                    td.classList.add('lf-audit-operator');
                    td.textContent = entry[f.key] || '-';
                    if (isAnomalyEntry && entry.command === 'WRITE_CONFIG') {
                        const chev = this._el('span', 'lf-audit-chevron');
                        chev.textContent = ' ►';
                        td.appendChild(chev);
                    }
                } else {
                    td.textContent = entry[f.key] || '-';
                }
                tr.appendChild(td);
            }

            if (isAnomalyEntry && entry.detail) {
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', () => {
                    this._selectedAuditEntry = entry;
                    this._openOverlay('audit_detail');
                });
            }

            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        tableWrap.appendChild(table);
    }

    _renderAuditDetailOverlay(panel) {
        const entry = this._selectedAuditEntry;
        if (!entry) return;

        const body = this._overlayHeader(panel, `COMMAND DETAIL: ${entry.timestamp}`);

        const grid = this._el('div', 'lf-audit-detail-grid');
        const rows = [
            ['Operator:', entry.operator],
            ['Command:', entry.command],
            ['Parameter:', entry.parameter],
            ['Old value:', entry.oldValue || '-'],
            ['New value:', entry.newValue || '-'],
            ['Result:', entry.result],
            ['Session:', entry.sessionRef || '-']
        ];
        for (const [lbl, val] of rows) {
            if (!val || val === '-') continue;
            const l = this._el('div', 'lf-audit-detail-label'); l.textContent = lbl;
            const v = this._el('div', 'lf-audit-detail-value'); v.textContent = displayDashes(val);
            grid.appendChild(l); grid.appendChild(v);
        }
        body.appendChild(grid);

        if (entry.detail) {
            const detail = this._el('div', 'lf-audit-critical');
            detail.textContent = displayDashes(entry.detail);
            body.appendChild(detail);
        }
    }

    // ── Completion ─────────────────────────────────────────────────────────

    _checkCompletion() {
        if (this._completionFired) return;

        const sessionDone = this._sessionFlagged;
        const tabsDone = !this._requireAllTabs || this._allAddlTabsVisited();

        if (sessionDone && tabsDone) {
            this._completionFired = true;
            this._onComplete();
        }
    }

    _onComplete() {
        this._executeActions(this._completionActions);

        // Show completion banner in session log
        if (this._currentTab === 'session_log' && this._dom.logPane) {
            const existing = this._dom.logPane.querySelectorAll('.lf-complete-banner, .lf-session-detail');
            existing.forEach(el => el.remove());
            const banner = this._el('div', 'lf-complete-banner');
            banner.textContent = displayDashes(this._completeBanner);
            this._dom.logPane.appendChild(banner);
        }

        // Auto-close
        this._closeTimer = setTimeout(() => this.complete(true), 1400);
    }

    // ── Action execution ───────────────────────────────────────────────────

    _executeActions(actions) {
        if (!Array.isArray(actions)) return;
        for (const action of actions) {
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            } else if (action.type === 'complete_task') {
                window.objectivesManager?.completeTask(action.taskId);
            }
        }
    }

    _fireTriggerActions(trigger, tabId) {
        for (const action of this._progressActions) {
            if (action.trigger !== trigger) continue;
            if (trigger === 'tab_viewed' && action.tabId !== tabId) continue;
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            }
        }
    }

    // ── Global state ───────────────────────────────────────────────────────

    _setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables[name] = value;
        }
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }

    // ── Status bar ─────────────────────────────────────────────────────────

    _updateStatusBar() {
        if (!this._dom.statusBar) return;
        if (this._currentTab !== 'session_log') {
            this._dom.statusBar.textContent = '';
            return;
        }
        const filtered = this._applyFilters(this._logEntries);
        const sb = this._dom.statusBar;
        sb.innerHTML = '';
        const countEl = this._el('span', 'lf-status-bar-count');
        countEl.textContent = `RESULTS: ${filtered.length} entries visible`;
        const filtersEl = document.createTextNode(` · ${this._activeFilters.length} filter${this._activeFilters.length !== 1 ? 's' : ''} active`);
        sb.appendChild(countEl);
        sb.appendChild(filtersEl);
    }

    // ── DOM helpers ────────────────────────────────────────────────────────

    _el(tag, classList) {
        const el = document.createElement(tag);
        if (classList) {
            for (const cls of classList.split(' ')) {
                if (cls) el.classList.add(cls);
            }
        }
        return el;
    }

    // ── Cleanup ────────────────────────────────────────────────────────────

    cleanup() {
        if (this._closeTimer) clearTimeout(this._closeTimer);
        super.cleanup();
    }
}
