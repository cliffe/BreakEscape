import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

// ── Static drug library data (fallback if scenarioData not provided) ──────────
// Full 23-entry library. Entry at index 5 (MORPHINE) is the tampered one.
const DEFAULT_LIBRARY = [
    { name: 'PARACETAMOL',           concMgPerMl: 10,    doseMin: 500,   doseMax: 1000,  unit: 'mg',       rateMaxMlHr: 100 },
    { name: 'AMOXICILLIN 500MG',     concMgPerMl: 5,     doseMin: 500,   doseMax: 3000,  unit: 'mg',       rateMaxMlHr: 60  },
    { name: 'HEPARIN',               concMgPerMl: 1000,  doseMin: 1000,  doseMax: 24000, unit: 'units',    rateMaxMlHr: 24  },
    { name: 'NORADRENALINE',         concMgPerMl: 0.08,  doseMin: 0.01,  doseMax: 0.3,   unit: 'mcg/kg/m', rateMaxMlHr: 40  },
    { name: 'FUROSEMIDE',            concMgPerMl: 10,    doseMin: 20,    doseMax: 80,    unit: 'mg',       rateMaxMlHr: 10  },
    { name: 'MORPHINE',              concMgPerMl: 1,     doseMin: 0.5,   doseMax: 40,    unit: 'mg/hr',    rateMaxMlHr: 40  },
    { name: 'METRONIDAZOLE',         concMgPerMl: 5,     doseMin: 500,   doseMax: 1500,  unit: 'mg',       rateMaxMlHr: 100 },
    { name: 'INSULIN (ACTRAPID)',    concMgPerMl: 100,   doseMin: 0.5,   doseMax: 50,    unit: 'units/hr', rateMaxMlHr: 50  },
    { name: 'VANCOMYCIN',            concMgPerMl: 5,     doseMin: 500,   doseMax: 2000,  unit: 'mg',       rateMaxMlHr: 120 },
    { name: 'PIPERACILLIN/TZB',      concMgPerMl: 9,     doseMin: 2250,  doseMax: 4500,  unit: 'mg',       rateMaxMlHr: 60  },
    { name: 'GENTAMICIN',            concMgPerMl: 1,     doseMin: 60,    doseMax: 240,   unit: 'mg',       rateMaxMlHr: 30  },
    { name: 'POTASSIUM CHLORIDE',    concMgPerMl: 20,    doseMin: 10,    doseMax: 20,    unit: 'mmol/hr',  rateMaxMlHr: 1   },
    { name: 'MAGNESIUM SULFATE',     concMgPerMl: 500,   doseMin: 1,     doseMax: 5,     unit: 'g',        rateMaxMlHr: 10  },
    { name: 'FENTANYL',              concMgPerMl: 0.05,  doseMin: 0.5,   doseMax: 2,     unit: 'mcg/kg/hr',rateMaxMlHr: 40  },
    { name: 'MIDAZOLAM',             concMgPerMl: 1,     doseMin: 0.5,   doseMax: 10,    unit: 'mg/hr',    rateMaxMlHr: 10  },
    { name: 'PROPOFOL 1%',           concMgPerMl: 10,    doseMin: 0.3,   doseMax: 4,     unit: 'mg/kg/hr', rateMaxMlHr: 40  },
    { name: 'LABETALOL',             concMgPerMl: 1,     doseMin: 20,    doseMax: 160,   unit: 'mg/hr',    rateMaxMlHr: 160 },
    { name: 'AMIODARONE',            concMgPerMl: 1.5,   doseMin: 150,   doseMax: 900,   unit: 'mg',       rateMaxMlHr: 120 },
    { name: 'DOBUTAMINE',            concMgPerMl: 0.5,   doseMin: 2.5,   doseMax: 20,    unit: 'mcg/kg/m', rateMaxMlHr: 40  },
    { name: 'DOPAMINE',              concMgPerMl: 0.8,   doseMin: 2,     doseMax: 15,    unit: 'mcg/kg/m', rateMaxMlHr: 15  },
    { name: 'CEFUROXIME',            concMgPerMl: 7.5,   doseMin: 750,   doseMax: 1500,  unit: 'mg',       rateMaxMlHr: 100 },
    { name: 'ONDANSETRON',           concMgPerMl: 0.16,  doseMin: 4,     doseMax: 8,     unit: 'mg',       rateMaxMlHr: 50  },
    { name: 'DEXAMETHASONE',         concMgPerMl: 1,     doseMin: 2,     doseMax: 24,    unit: 'mg',       rateMaxMlHr: 20  },
];

const HEX_CHARS = '0123456789abcdef';

function randomHex(len) {
    let s = '';
    for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
    return s;
}

// ──────────────────────────────────────────────────────────────────────────────

export class DrugLibraryIntegrityMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title:      'Drug Library Integrity Terminal',
            showCancel: true,
            cancelText: 'Close',
        });

        const sd = params.sprite?.scenarioData?.minigameData || {};
        this._lib      = sd.drugLibrary      || DEFAULT_LIBRARY;
        this._tampered = sd.tamperedEntry    || { drug: 'MORPHINE', field: 'DOSE_MAX', tamperedValue: 40, correctValue: 4, modifiedAt: '2025-11-03 02:47', backupDate: '2025-11-01 09:12' };
        // A tamper may change more than one field of the row (e.g. a raised DOSE_MIN
        // needs DOSE_MAX raised with it). tamperedEntry.changes lists them; without it
        // the single field/tamperedValue/correctValue triple is used, as before.
        const t0 = this._tampered;
        this._changes = (Array.isArray(t0.changes) && t0.changes.length)
            ? t0.changes
            : [{ field: t0.field, tamperedValue: t0.tamperedValue, correctValue: t0.correctValue }];
        this._sources  = sd.verificationSources || [];
        this._fleet    = sd.fleetReport      || null;
        this._data     = sd;

        // Phase: 'idle' | 'scanning' | 'failed' | 'restored'
        this._phase            = 'idle';
        this._tabsEnabled      = new Set(['integrity']);
        this._sourcesConsulted = new Set();
        this._compromisedFired = false;
        this._scanTimers       = [];   // track for cleanup

        // Tampered row index (match by name)
        this._tamperedIdx = this._lib.findIndex(e => e.name === this._tampered.drug);
        if (this._tamperedIdx === -1) this._tamperedIdx = 5; // fallback
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('dli-minigame-container');
        this.gameContainer.classList.add('dli-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        const g = window.gameState?.globalVariables || {};

        if (g.drug_library_restored) {
            this._phase = 'restored';
            this._applyRestoredValues();
            this._tabsEnabled = new Set(['integrity', 'diff', 'verify', 'fleet']);
            if (g.mar_charts_drug_referenced)        this._sourcesConsulted.add('paper_mar_charts');
            if (g.manufacturer_datasheet_referenced) this._sourcesConsulted.add('manufacturer_datasheet');
            this._compromisedFired = true;
            this._updateAllTabStates();
            this._refreshStatusBar('restored');
            this._switchTab('fleet');
        } else if (g.drug_library_compromised) {
            this._phase = 'failed';
            this._tabsEnabled = new Set(['integrity', 'diff', 'verify']);
            if (g.mar_charts_drug_referenced)        this._sourcesConsulted.add('paper_mar_charts');
            if (g.manufacturer_datasheet_referenced) this._sourcesConsulted.add('manufacturer_datasheet');
            this._compromisedFired = true;
            this._updateAllTabStates();
            this._refreshStatusBar('failed');
            this._switchTab('verify');
        } else {
            this._switchTab('integrity');
        }
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    _renderLayout() {
        const sd = this._data;
        const title    = sd.consoleTitle    || 'PUMP FLEET MANAGEMENT CONSOLE';
        const subtitle = sd.consoleSubtitle || '';
        const libFile  = sd.libraryFile     || 'drug_library.csv';
        const bakFile  = sd.backupFile      || 'drug_library.bak';
        const hashFile = sd.hashFile        || 'drug_library.sha256';

        this.gameContainer.innerHTML = `
<div class="dli-console-header">
  <div class="dli-console-title">${displayDashes(title)}</div>
  ${subtitle ? `<div class="dli-console-subtitle">${displayDashes(subtitle)}</div>` : ''}
  <div class="dli-console-files">
    <span>${libFile}</span><span>${bakFile}</span><span>${hashFile}</span>
  </div>
</div>
<div class="dli-tab-bar" id="dli-tab-bar">
  <button class="dli-tab" data-tab="integrity">INTEGRITY CHECK</button>
  <button class="dli-tab dli-tab-disabled" data-tab="diff">DIFF VIEW</button>
  <button class="dli-tab dli-tab-disabled" data-tab="verify">VERIFICATION</button>
  <button class="dli-tab dli-tab-disabled" data-tab="fleet">FLEET REPORT</button>
</div>
<div class="dli-status-bar dli-status-not-verified" id="dli-status-bar">
  LIBRARY INTEGRITY STATUS: NOT VERIFIED
</div>
<div class="dli-progress-wrap" id="dli-progress-wrap" style="display:none">
  <div class="dli-progress-bar" id="dli-progress-bar"></div>
</div>
<div class="dli-panel" id="dli-panel"></div>`;

        this.gameContainer.querySelectorAll('.dli-tab').forEach(btn => {
            this.addEventListener(btn, 'click', () => this._onTabClick(btn.dataset.tab));
        });
    }

    // ── Tab logic ─────────────────────────────────────────────────────────────

    _onTabClick(tabId) {
        if (!this._tabsEnabled.has(tabId)) return;
        this._switchTab(tabId);
    }

    _switchTab(tabId) {
        this.gameContainer.querySelectorAll('.dli-tab').forEach(btn => {
            const t = btn.dataset.tab;
            btn.classList.toggle('dli-tab-active', t === tabId);
            btn.classList.remove('dli-tab-seen');
            if (this._tabsEnabled.has(t) && t !== tabId) btn.classList.add('dli-tab-seen');
        });

        const panel = this.gameContainer.querySelector('#dli-panel');
        if (!panel) return;

        switch (tabId) {
            case 'integrity': this._renderIntegrityTab(panel); break;
            case 'diff':      this._renderDiffTab(panel);      break;
            case 'verify':    this._renderVerifyTab(panel);    break;
            case 'fleet':     this._renderFleetTab(panel);     break;
        }
    }

    _enableTab(tabId) {
        this._tabsEnabled.add(tabId);
        const btn = this.gameContainer.querySelector(`[data-tab="${tabId}"]`);
        if (btn) btn.classList.remove('dli-tab-disabled');
    }

    _updateAllTabStates() {
        this.gameContainer.querySelectorAll('.dli-tab').forEach(btn => {
            const t = btn.dataset.tab;
            if (this._tabsEnabled.has(t)) {
                btn.classList.remove('dli-tab-disabled');
            } else {
                btn.classList.add('dli-tab-disabled');
            }
        });
    }

    // ── Tab 1: Integrity Check ────────────────────────────────────────────────

    _renderIntegrityTab(panel) {
        const rows = this._lib.map((drug, i) => {
            const isTampered = (i === this._tamperedIdx);
            let statusCell = '<span class="dli-badge-scanning">&mdash;</span>';
            let rowClass   = '';

            if (this._phase === 'failed' || this._phase === 'restored') {
                if (isTampered && this._phase === 'failed') {
                    statusCell = '<span class="dli-badge-fail">&#x2717; FAIL</span>';
                    rowClass   = 'dli-row-fail';
                } else {
                    statusCell = '<span class="dli-badge-pass">&#x2713; PASS</span>';
                    rowClass   = 'dli-row-pass';
                }
            }

            return `<tr class="${rowClass}" id="dli-row-${i}">
  <td class="dli-col-drug">${displayDashes(drug.name)}</td>
  <td class="dli-col-conc">${drug.concMgPerMl}</td>
  <td class="dli-col-dmin">${drug.doseMin}</td>
  <td class="dli-col-dmax">${drug.doseMax}</td>
  <td class="dli-col-unit">${drug.unit}</td>
  <td class="dli-col-rate">${drug.rateMaxMlHr}</td>
  <td class="dli-col-status" id="dli-status-${i}">${statusCell}</td>
</tr>`;
        }).join('');

        const alreadyFailed   = this._phase === 'failed' || this._phase === 'restored';
        const alreadyRestored = this._phase === 'restored';

        panel.innerHTML = `
<table class="dli-lib-table">
  <thead>
    <tr>
      <th class="dli-col-drug">Drug Name</th>
      <th class="dli-col-conc">Conc</th>
      <th class="dli-col-dmin">Dose Min</th>
      <th class="dli-col-dmax">Dose Max</th>
      <th class="dli-col-unit">Unit</th>
      <th class="dli-col-rate">Rate Max</th>
      <th class="dli-col-status">SHA-256 Status</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
${alreadyRestored ? this._buildRestoredBanner() : alreadyFailed ? this._buildResultBanner() : ''}
${alreadyFailed && !alreadyRestored ? this._buildHashDetail(false) : ''}
${!alreadyFailed ? `<button class="dli-run-btn" id="dli-run-btn">[ RUN INTEGRITY VERIFICATION ]</button>` : ''}`;

        if (!alreadyFailed) {
            const runBtn = panel.querySelector('#dli-run-btn');
            if (runBtn) this.addEventListener(runBtn, 'click', () => this._runVerification(panel));
        } else {
            this._attachHashDetailListeners(panel);
        }

        // Status bar
        this._refreshStatusBar(alreadyRestored ? 'restored' : alreadyFailed ? 'failed' : 'idle');
    }

    // After a restore the check passes again; the earlier change stays in the record.
    _buildRestoredBanner() {
        const total = this._lib.length;
        return `
<div class="dli-result-banner dli-result-banner-restored" id="dli-result-banner" style="border-color:#33cc66;background:#0d2a16">
  <div class="dli-result-banner-title" style="color:#33cc66">&#x2713; Integrity Check Complete</div>
  <p>${total} entries verified: <strong style="color:#33cc66">PASS</strong></p>
  <p>${displayDashes(this._tampered.drug)} restored from ${this._data.backupFile || 'drug_library.bak'}. The change made ${this._tampered.modifiedAt} (${this._changesText('current')}) is kept in the audit record.</p>
</div>`;
    }

    _buildResultBanner() {
        const total = this._lib.length;
        const pass  = total - 1;
        return `
<div class="dli-result-banner" id="dli-result-banner">
  <div class="dli-result-banner-title">&#x26A0; Integrity Check Complete</div>
  <p>${pass} entries verified: <strong style="color:#33cc66">PASS</strong></p>
  <p>1 entry: <strong style="color:#cc3333">HASH MISMATCH</strong> &mdash; DRUG LIBRARY MAY HAVE BEEN MODIFIED</p>
</div>`;
    }

    _buildHashDetail(restored) {
        const t = this._tampered;
        const prefix = '3a7f4bc9d85e2f1a946cb0d3';
        const expSuffix = '3c8b1e4f7d2a9c5e6b1f3d8a0c7e2b5f';
        const cmpSuffix = '7d3e9f1c4b8a2e6f5c0d1b7a3e8f9c2d';

        const backupBtn = restored ? '' : `<button class="dli-backup-btn" id="dli-backup-btn">[COMPARE TO BACKUP &rarr;]</button>`;
        return `
<div class="dli-hash-detail" id="dli-hash-detail">
  <div class="dli-hash-detail-title">&#x26A0; Hash Mismatch &mdash; ${displayDashes(t.drug)}</div>
  <div class="dli-hash-meta">
    <span>File: <strong>${this._data.libraryFile || 'drug_library.csv'}</strong></span>
    <span>Modified: <span class="dli-ts">${t.modifiedAt}</span></span>
  </div>
  <div class="dli-hash-row">
    <span class="dli-hash-label">EXPECTED:</span>
    <span class="dli-hash-match">${prefix}</span><span class="dli-hash-exp-diff">${expSuffix}</span>
  </div>
  <div class="dli-hash-row">
    <span class="dli-hash-label">COMPUTED:</span>
    <span class="dli-hash-match">${prefix}</span><span class="dli-hash-cmp-diff">${cmpSuffix}</span>
  </div>
  <div class="dli-hash-note">
    Hash values differ &mdash; file content does not match the reference.<br>
    Difference detected using <span class="dli-sha-label" title="SHA-256 produces a unique 64-character fingerprint for any file. Even changing a single digit changes the entire hash.">SHA-256</span> cryptographic hash.
  </div>
  <div class="dli-hash-actions">
    ${backupBtn}
  </div>
</div>`;
    }

    _attachHashDetailListeners(panel) {
        const backupBtn = panel.querySelector('#dli-backup-btn');
        if (backupBtn) {
            this.addEventListener(backupBtn, 'click', () => {
                this._enableTab('diff');
                this._enableTab('verify');
                this._switchTab('diff');
            });
        }
        // Clicking the MORPHINE row also jumps to hash detail (already visible) or scrolls to it
        const failRow = panel.querySelector(`#dli-row-${this._tamperedIdx}`);
        if (failRow) {
            this.addEventListener(failRow, 'click', () => {
                const detail = panel.querySelector('#dli-hash-detail');
                if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }
    }

    // ── Verification animation ────────────────────────────────────────────────

    _runVerification(panel) {
        if (this._phase === 'scanning') return;
        this._phase = 'scanning';

        const runBtn = panel.querySelector('#dli-run-btn');
        if (runBtn) runBtn.disabled = true;

        // Show progress bar
        const wrap = this.gameContainer.querySelector('#dli-progress-wrap');
        const bar  = this.gameContainer.querySelector('#dli-progress-bar');
        if (wrap) wrap.style.display = 'block';
        if (bar)  setTimeout(() => { bar.style.width = '100%'; }, 50);

        const total = this._lib.length;
        let completed = 0;

        const onRowDone = () => {
            completed++;
            if (completed === total) {
                const t = setTimeout(() => this._onScanComplete(panel), 400);
                this._scanTimers.push(t);
            }
        };

        // Process rows in groups of 4 with 180ms stagger between groups
        for (let i = 0; i < total; i++) {
            const groupDelay = Math.floor(i / 4) * 180;
            const isTampered = (i === this._tamperedIdx);
            const hexDuration = isTampered ? 2200 : 700;

            const t = setTimeout(() => {
                this._animateRow(i, isTampered, hexDuration, onRowDone);
            }, groupDelay);
            this._scanTimers.push(t);
        }
    }

    _animateRow(rowIdx, isTampered, hexDuration, onDone) {
        const cell = this.gameContainer.querySelector(`#dli-status-${rowIdx}`);
        if (!cell) { onDone(); return; }

        cell.innerHTML = '<span class="dli-badge-scanning" id="hex-' + rowIdx + '">........</span>';
        const span = cell.querySelector('#hex-' + rowIdx);

        const intervalId = setInterval(() => {
            if (span) span.textContent = randomHex(8);
        }, 60);
        this._scanTimers.push(intervalId);

        const snapTimer = setTimeout(() => {
            clearInterval(intervalId);
            const row = this.gameContainer.querySelector(`#dli-row-${rowIdx}`);
            if (isTampered) {
                // Extra pause before FAIL
                const pauseTimer = setTimeout(() => {
                    if (cell) cell.innerHTML = '<span class="dli-badge-fail">&#x2717; FAIL</span>';
                    if (row)  row.classList.add('dli-row-fail');
                    onDone();
                }, 350);
                this._scanTimers.push(pauseTimer);
            } else {
                if (cell) cell.innerHTML = '<span class="dli-badge-pass">&#x2713; PASS</span>';
                if (row)  row.classList.add('dli-row-pass');
                onDone();
            }
        }, hexDuration);
        this._scanTimers.push(snapTimer);
    }

    _onScanComplete(panel) {
        this._phase = 'failed';

        // Update status bar
        this._refreshStatusBar('failed');

        // Hide progress bar
        const wrap = this.gameContainer.querySelector('#dli-progress-wrap');
        if (wrap) wrap.style.display = 'none';

        // Remove run button
        const runBtn = panel.querySelector('#dli-run-btn');
        if (runBtn) runBtn.remove();

        // Inject result banner + hash detail
        const table = panel.querySelector('.dli-lib-table');
        if (table) {
            const bannerDiv = document.createElement('div');
            bannerDiv.innerHTML = this._buildResultBanner() + this._buildHashDetail(false);
            table.insertAdjacentElement('afterend', bannerDiv);
            this._attachHashDetailListeners(panel);
        }

        // Enable diff tab
        this._enableTab('diff');

        // Fire drug_library_compromised
        if (!this._compromisedFired) {
            this._compromisedFired = true;
            this._executeActions(this._data.onCompromisedDetected || [
                { type: 'set_global', key: 'drug_library_compromised', value: true }
            ]);
        }
    }

    _refreshStatusBar(state) {
        const bar = this.gameContainer.querySelector('#dli-status-bar');
        if (!bar) return;
        bar.className = 'dli-status-bar';
        if (state === 'failed') {
            bar.classList.add('dli-status-compromised');
            bar.textContent = 'LIBRARY INTEGRITY STATUS: COMPROMISED \u2014 DO NOT DEPLOY';
        } else if (state === 'restored') {
            bar.classList.add('dli-status-verified');
            bar.textContent = `LIBRARY INTEGRITY STATUS: VERIFIED \u2014 ${this._lib.length}/${this._lib.length} PASS`;
        } else {
            bar.classList.add('dli-status-not-verified');
            bar.textContent = 'LIBRARY INTEGRITY STATUS: NOT VERIFIED';
        }
    }

    // ── Tab 2: Diff View ──────────────────────────────────────────────────────

    _renderDiffTab(panel) {
        const t = this._tampered;

        // Enable verify tab when diff is first viewed
        this._enableTab('verify');

        // Fire timestamp-noted global once
        if (!window.gameState?.globalVariables?.library_tamper_timestamp_noted) {
            this._executeActions(
                (this._data.progressActions?.onTimestampViewed) ||
                [{ type: 'set_global', key: 'library_tamper_timestamp_noted', value: true }]
            );
        }

        const leftRows  = this._lib.map((drug, i) => this._buildDiffRow(drug, i, 'current')).join('');
        const rightRows = this._lib.map((drug, i) => this._buildDiffRow(drug, i, 'backup')).join('');

        panel.innerHTML = `
<div class="dli-diff-split">
  <div class="dli-diff-panel">
    <div class="dli-diff-panel-header">
      <div class="dli-diff-panel-file">${this._data.libraryFile || 'drug_library.csv'}</div>
      <div class="dli-diff-panel-meta">${this._phase === 'restored' ? `Restored from backup &nbsp;<span class="dli-verified-ok">&#x2713; HASH MATCH</span>` : `Modified: <span class="dli-modified-at">${t.modifiedAt}</span>`}</div>
    </div>
    <table class="dli-diff-table"><tbody>${leftRows}</tbody></table>
  </div>
  <div class="dli-diff-panel">
    <div class="dli-diff-panel-header">
      <div class="dli-diff-panel-file">${this._data.backupFile || 'drug_library.bak'}</div>
      <div class="dli-diff-panel-meta">Backup: ${t.backupDate} &nbsp;<span class="dli-verified-ok">&#x2713; HASH MATCH</span></div>
    </div>
    <table class="dli-diff-table"><tbody>${rightRows}</tbody></table>
  </div>
</div>
<div class="dli-diff-summary">
  ${this._phase === 'restored'
    ? `<div class="dli-diff-summary-title">0 differences: the live library matches the backup.</div>
  Restored from backup. Earlier change (${t.modifiedAt}): ${displayDashes(t.drug)} ${this._changesText('current')}, kept in the audit record.`
    : `<div class="dli-diff-summary-title">${this._changes.length} difference${this._changes.length === 1 ? '' : 's'} found:</div>
  ${this._changes.map(c => `Row: <strong>${displayDashes(t.drug)}</strong> &nbsp;|&nbsp; Field: <strong>${c.field}</strong>
  &nbsp;|&nbsp; Current: <strong style="color:#cc3333">${c.tamperedValue}</strong>
  &nbsp;|&nbsp; Backup: <strong style="color:#33cc66">${c.correctValue}</strong>`).join('<br>')}`}
</div>`;
    }

    _buildDiffRow(drug, i, side) {
        const isTampered = (i === this._tamperedIdx);
        if (isTampered) {
            const cls  = side === 'current' ? 'dli-diff-val-tampered' : 'dli-diff-val-correct';
            const rowCls = side === 'current' ? 'dli-diff-row-current' : 'dli-diff-row-backup';
            const cell = (field, rowValue) => {
                const c = this._changes.find(ch => ch.field === field);
                if (!c) return `${rowValue}`;
                if (this._phase === 'restored') return `${c.correctValue}`;
                const v = side === 'current' ? c.tamperedValue : c.correctValue;
                return `<span class="dli-diff-value-large ${cls}">${v}</span>`;
            };
            return `<tr class="${rowCls}">
  <td><strong>${displayDashes(drug.name)}</strong></td>
  <td>${drug.concMgPerMl}</td>
  <td>${cell('DOSE_MIN', drug.doseMin)}</td>
  <td>${cell('DOSE_MAX', drug.doseMax)}</td>
  <td>${drug.unit}</td>
  <td>${cell('RATE_MAX', drug.rateMaxMlHr)}</td>
</tr>`;
        }
        return `<tr class="dli-diff-unchanged">
  <td>${displayDashes(drug.name)}</td><td>${drug.concMgPerMl}</td>
  <td>${drug.doseMin}</td><td>${drug.doseMax}</td><td>${drug.unit}</td><td>${drug.rateMaxMlHr}</td>
</tr>`;
    }

    // ── Tab 3: Verification ───────────────────────────────────────────────────

    _renderVerifyTab(panel) {
        const t = this._tampered;
        const sources = this._sources.length
            ? this._sources
            : [
                { id: 'paper_mar_charts',       label: 'Paper MAR Charts',       requiresGlobal: 'paper_charts_collected',         lockedMessage: 'Paper medication charts not collected \u2014 return to Ward 7 nursing station.' },
                { id: 'manufacturer_datasheet', label: 'Manufacturer Datasheet', requiresGlobal: 'manufacturer_datasheet_available', lockedMessage: 'Manufacturer documentation not yet available \u2014 speak to David Osei (Clinical Engineering).' },
            ];

        const sourceRows = sources.map(s => this._buildSourceRow(s)).join('');
        const allConsulted = sources.every(s => this._sourcesConsulted.has(s.id));
        const restored     = this._phase === 'restored';

        let restoreClass = 'dli-restore-btn';
        if (restored)     restoreClass += ' dli-restore-btn-done';
        else if (allConsulted) restoreClass += ' dli-restore-btn-active';

        const restoreLabel = restored
            ? `\u2713 LIBRARY RESTORED \u2014 ${this._changesText('backup', true)}`
            : allConsulted
                ? `[ RESTORE FROM BACKUP \u2014 ${this._changesText('backup', true)} \u2713 confirmed by backup + ${sources.length} sources ]`
                : `[ RESTORE FROM BACKUP \u2014 ${this._changesText('backup', true)} ]`;

        const restoreHint = restored
            ? `<div class="dli-restore-hint" style="color:#33cc66">\u2713 Library restored successfully.</div>`
            : allConsulted
                ? `<div class="dli-restore-hint">All sources consulted \u2014 restore authorised.</div>`
                : `<div class="dli-restore-hint">Verify correct value from independent sources before restoring.</div>`;

        panel.innerHTML = `
<div class="dli-verify-title">VERIFY CORRECT VALUE${this._changes.length === 1 ? '' : 'S'} &mdash; ${displayDashes(t.drug)} ${this._changes.map(c => c.field).join(' / ')}</div>
<div class="dli-verify-values">
  <span class="dli-verify-backup-val">&#x25B6; Backup shows: <strong>${this._changesText('backup', true)}</strong></span>
  <span class="dli-verify-tampered-val">&#x2717; Current (tampered): <strong>${this._changesText('current', true)}</strong></span>
</div>
<div class="dli-verify-instruction">
  Before restoring, confirm the correct value from two independent sources:
</div>
${sourceRows}
<button class="${restoreClass}" id="dli-restore-btn" ${(!allConsulted && !restored) ? 'disabled' : ''}>${restoreLabel}</button>
${restoreHint}`;

        // Attach source button listeners
        sources.forEach(s => {
            const btn = panel.querySelector(`#dli-src-btn-${s.id}`);
            if (btn && !btn.disabled) {
                this.addEventListener(btn, 'click', () => this._openSourceModal(s));
            }
        });

        // Attach restore button
        if (allConsulted && !restored) {
            const restoreBtn = panel.querySelector('#dli-restore-btn');
            if (restoreBtn) this.addEventListener(restoreBtn, 'click', () => this._onRestore());
        }
    }

    _buildSourceRow(source) {
        const g = window.gameState?.globalVariables || {};
        const isConsulted = this._sourcesConsulted.has(source.id);
        const isAvailable = g[source.requiresGlobal];

        const indicatorClass = isConsulted ? 'dli-source-indicator dli-source-indicator-done' : 'dli-source-indicator';
        const indicatorText  = isConsulted ? '&#x2713;' : '';

        let btnHtml;
        if (isConsulted) {
            btnHtml = `<span class="dli-source-consulted">CONSULTED &#x2713;</span>`;
        } else if (!isAvailable) {
            btnHtml = `<button class="dli-source-btn" id="dli-src-btn-${source.id}" disabled>[REFERENCE]</button>`;
        } else {
            btnHtml = `<button class="dli-source-btn" id="dli-src-btn-${source.id}">[REFERENCE]</button>`;
        }

        const sublabel = isConsulted
            ? ''
            : (!isAvailable ? `<small>${displayDashes(source.lockedMessage || '')}</small>` : '');

        return `
<div class="dli-source-row">
  <div class="${indicatorClass}">${indicatorText}</div>
  <div class="dli-source-label">
    SOURCE ${this._sources.indexOf(source) >= 0 ? this._sources.indexOf(source) + 1 : ''} &mdash; ${displayDashes(source.label)}
    ${sublabel}
  </div>
  ${btnHtml}
</div>`;
    }

    _getUnit(t) {
        // Get unit from the tampered library entry
        const entry = this._lib[this._tamperedIdx];
        return entry ? entry.unit : 'mg/hr';
    }

    // "DOSE_MIN: 0.5, DOSE_MAX: 4" for the backup side, or the tampered side.
    _changesText(side, withUnit = false) {
        return this._changes
            .map(c => {
                const unit = withUnit ? ` ${c.unit || this._getUnit(this._tampered)}` : '';
                return `${c.field}: ${side === 'current' ? c.tamperedValue : c.correctValue}${unit}`;
            })
            .join(', ');
    }

    // After a restore the library row shows the verified values again.
    _applyRestoredValues() {
        const row = this._lib[this._tamperedIdx];
        if (!row) return;
        const key = { DOSE_MIN: 'doseMin', DOSE_MAX: 'doseMax', RATE_MAX: 'rateMaxMlHr' };
        this._changes.forEach(c => { if (key[c.field]) row[key[c.field]] = c.correctValue; });
    }

    // ── Source modal ──────────────────────────────────────────────────────────

    _openSourceModal(source) {
        const c = source.content || {};
        let bodyHtml = '';

        if (source.id === 'paper_mar_charts') {
            bodyHtml = `
<div class="dli-modal-row"><span class="dli-modal-key">Title:</span><span class="dli-modal-val">${displayDashes(c.title || 'MEDICATION ADMINISTRATION RECORD \u2014 WARD 7')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Drug:</span><span class="dli-modal-val">${displayDashes(c.drug || 'Morphine Sulphate (IV)')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Prescribed:</span><span class="dli-modal-val">${displayDashes(c.patient || 'Patient D. [anonymised] \u2014 Bed 2')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Dose:</span><span class="dli-modal-val">${c.dose ? `<span class="dli-modal-val-green">${displayDashes(c.dose)}</span>` : `2 mg/hr standard; <span class="dli-modal-val-green">max ${c.value || 4} ${c.unit || 'mg/hr'}</span>`}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Note:</span><span class="dli-modal-val">${displayDashes(c.note || '')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Prescriber:</span><span class="dli-modal-val">${displayDashes(c.prescriber || 'Dr. K. Mahmoud')} (signed)</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Pharmacy:</span><span class="dli-modal-val">Verified &mdash; ${displayDashes(c.verified || 'J. Chen (23 Oct 2025)')}</span></div>`;
        } else if (Array.isArray(c.rows)) {
            // Scenario-supplied rows: [{ key, value, tone: 'amber'|'green'|undefined }]
            const toneCls = (tone) => tone === 'amber' ? 'dli-modal-val-amber' : tone === 'green' ? 'dli-modal-val-green' : 'dli-modal-val';
            bodyHtml = c.rows.map(r =>
                `<div class="dli-modal-row"><span class="dli-modal-key">${displayDashes(r.key)}:</span><span class="${toneCls(r.tone)}">${displayDashes(r.value)}</span></div>`
            ).join('\n') + (c.warning ? `\n<div class="dli-modal-warning">${displayDashes(c.warning)}</div>` : '');
        } else {
            bodyHtml = `
<div class="dli-modal-row"><span class="dli-modal-key">Title:</span><span class="dli-modal-val">${displayDashes(c.title || 'ALARIS GP \u2014 DRUG LIBRARY CONFIGURATION GUIDE')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Drug:</span><span class="dli-modal-val">${displayDashes(c.drug || 'Morphine Sulphate / Diamorphine')}</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Concentration:</span><span class="dli-modal-val">1 mg/mL (standard)</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Dose range:</span><span class="dli-modal-val">0.5 &ndash; ${c.value || 4.0} ${c.unit || 'mg/hr'} (standard ward)</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">DOSE_MAX:</span><span class="dli-modal-val-amber">${c.value || 4.0} ${c.unit || 'mg/hr'} &larr; DO NOT EXCEED without specialist pharmacist override</span></div>
<div class="dli-modal-row"><span class="dli-modal-key">Rate max:</span><span class="dli-modal-val">${c.value || 4.0} mL/hr</span></div>
${c.warning ? `<div class="dli-modal-warning">${displayDashes(c.warning)}</div>` : ''}`;
        }

        const overlay = document.createElement('div');
        overlay.className = 'dli-modal-overlay';
        overlay.innerHTML = `
<div class="dli-modal">
  <div class="dli-modal-title">${displayDashes(source.label)}</div>
  <div class="dli-modal-body">${bodyHtml}</div>
  <button class="dli-modal-confirm-btn" id="dli-modal-confirm">CONFIRM &mdash; Value noted</button>
</div>`;

        this.gameContainer.style.position = 'relative';
        this.gameContainer.appendChild(overlay);

        const confirmBtn = overlay.querySelector('#dli-modal-confirm');
        this.addEventListener(confirmBtn, 'click', () => {
            this._onSourceConfirmed(source, overlay);
        });

        // Click outside to close without confirming
        this.addEventListener(overlay, 'click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    _onSourceConfirmed(source, overlay) {
        overlay.remove();
        this._sourcesConsulted.add(source.id);

        // Fire progress action
        const actionKey = source.onConsulted;
        if (actionKey && this._data.progressActions?.[actionKey]) {
            this._executeActions(this._data.progressActions[actionKey]);
        } else {
            // Fallback: map known source IDs to globals
            if (source.id === 'paper_mar_charts')       this._setGlobalAndNotify('mar_charts_drug_referenced', true);
            if (source.id === 'manufacturer_datasheet') this._setGlobalAndNotify('manufacturer_datasheet_referenced', true);
        }

        // Re-render verify tab to update indicator + button state
        const panel = this.gameContainer.querySelector('#dli-panel');
        if (panel) this._renderVerifyTab(panel);
    }

    // ── Restore flow ──────────────────────────────────────────────────────────

    _onRestore() {
        if (this._phase === 'restored') return;

        // Update restore button immediately
        const restoreBtn = this.gameContainer.querySelector('#dli-restore-btn');
        if (restoreBtn) {
            restoreBtn.disabled = true;
            restoreBtn.className = 'dli-restore-btn dli-restore-btn-done';
            restoreBtn.textContent = `\u2713 LIBRARY RESTORED \u2014 ${this._changesText('backup', true)}`;
        }

        // Fire completion globals
        this._executeActions(this._data.completionActions || [
            { type: 'set_global', key: 'drug_library_verified', value: true },
            { type: 'set_global', key: 'drug_library_restored', value: true },
        ]);

        this._phase = 'restored';
        this._applyRestoredValues();

        // Refresh status bar on integrity tab if we switch back
        this._refreshStatusBar('restored');

        // Enable fleet tab, show it briefly, then complete the minigame so
        // the engine can process debrief_started without a minigame blocking it.
        this._enableTab('fleet');
        const t1 = setTimeout(() => this._switchTab('fleet'), 700);
        this._scanTimers.push(t1);
        const t2 = setTimeout(() => this.complete(true), 3500);
        this._scanTimers.push(t2);
    }

    // ── Tab 4: Fleet Report ───────────────────────────────────────────────────

    _renderFleetTab(panel) {
        const fr = this._fleet || { affectedPumps: [] };
        const pumps = fr.affectedPumps || [];
        const t = this._tampered;

        const pumpRows = pumps.map(p => {
            if (p.activeToday) {
                return `<tr class="dli-fleet-row-active">
  <td class="dli-serial-bold">${p.serial}</td>
  <td>${p.ward}, ${p.bed}</td>
  <td>${p.lastActive}</td>
  <td><span class="dli-badge-active-today">&#x26A0; ACTIVE TODAY</span></td>
</tr>`;
            }
            return `<tr class="dli-fleet-row-inactive">
  <td>${p.serial}</td>
  <td>${p.ward}, ${p.bed}</td>
  <td>${p.lastActive}</td>
  <td><span class="dli-badge-inactive">&#x25CB; inactive</span></td>
</tr>`;
        }).join('');

        const activePump = pumps.find(p => p.activeToday);

        panel.innerHTML = `
<div class="dli-fleet-title">FLEET IMPACT ANALYSIS</div>
<div class="dli-fleet-subtitle">
  ${this._phase === 'restored' ? 'Pumps that loaded the TAMPERED library version, now restored' : 'Pumps loaded with TAMPERED library version'} (${displayDashes(t.drug)} ${this._changesText('current')})
</div>
<table class="dli-fleet-table">
  <thead>
    <tr>
      <th>Serial</th>
      <th>Ward / Bed</th>
      <th>Last Active</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>${pumpRows}</tbody>
</table>
${activePump ? `
<p style="margin-top:10px;font-size:11px;color:#ccaa00">
  <strong>${activePump.serial}</strong> was last programmed at ${activePump.lastActive} this morning.
</p>
<button class="dli-view-log-btn" id="dli-view-log-btn">[ VIEW ${activePump.serial} ACTIVITY LOG ]</button>
<div id="dli-activity-log-wrap"></div>` : ''}
<div class="dli-fleet-closing">
  ${Array.isArray(fr.closingLines)
      ? fr.closingLines.map((l, i) => i === fr.closingLines.length - 1 ? `<p><strong>${displayDashes(l)}</strong></p>` : `<p>${displayDashes(l)}</p>`).join('\n  ')
      : `<p>This pump was operating under a compromised drug library for at least 37 hours.</p>
  <p>The modification predates the ransomware deployment by 37 hours.</p>
  <p><strong>This was not an opportunistic side-effect of the ransomware.</strong></p>`}
</div>`;

        const logBtn = panel.querySelector('#dli-view-log-btn');
        if (logBtn) this.addEventListener(logBtn, 'click', () => this._showPumpActivityLog(activePump, panel));
    }

    _showPumpActivityLog(pump, panel) {
        const g   = window.gameState?.globalVariables || {};
        const fr  = this._fleet || {};
        const apg = fr.activePumpGlobals || {};
        const t   = this._tampered;

        const drugName = g[apg.linkedDrugGlobal] || 'MORPHINE SULPHATE';

        let outcomeLine = '';
        const ot = fr.outcomeText || {};
        if (g[apg.linkedDoseCorrectGlobal]) {
            outcomeLine = `<div class="dli-outcome-safe">
  <strong>Patient outcome: stable.</strong><br>
  ${ot.safe ? displayDashes(ot.safe) : `Dose entered was within safe range. Note: the drug library safety limit was not the protective factor &mdash;
  the pump did not alarm because of the library guardrail, the dose happened to be correct.`}
</div>`;
        } else if (g[apg.linkedDoseErrorGlobal]) {
            outcomeLine = `<div class="dli-outcome-risk">
  <strong>Patient outcome: at risk.</strong><br>
  ${ot.risk ? displayDashes(ot.risk) : `Dose entered exceeded correct safe limit (${t.correctValue} mg/hr). Pump did NOT alarm &mdash;
  tampered library prevented the hard-stop from triggering.`}
</div>`;
        } else {
            outcomeLine = `<div class="dli-outcome-unknown">
  Pump activity recorded. Dose outcome not yet determined.
</div>`;
        }

        const logWrap = panel.querySelector('#dli-activity-log-wrap');
        const logBtn  = panel.querySelector('#dli-view-log-btn');
        if (logBtn) logBtn.remove();

        if (logWrap) {
            logWrap.innerHTML = `
<div class="dli-activity-log">
  <div class="dli-activity-log-title">Pump Event Log &mdash; ${pump.serial}</div>
  <div class="dli-log-row"><span class="dli-log-ts">${fr.logDate || '2025-11-05'} ${pump.lastActive}</span> &nbsp;<span class="dli-log-event">NEW RATE PROGRAMMED</span></div>
  <div class="dli-log-row"><span class="dli-log-field">Drug:</span> <span class="dli-log-val">${drugName}</span></div>
  <div class="dli-log-row"><span class="dli-log-field">Library version:</span> <span class="dli-log-tampered">${t.modifiedAt} (tampered)</span></div>
  <div class="dli-log-row"><span class="dli-log-field">Limits enforced during programming:</span> <span class="dli-log-tampered">${this._changesText('current', true)}</span></div>
  <div class="dli-log-row"><span class="dli-log-field">Limits (correct values):</span> <span class="dli-log-correct">${this._changesText('backup', true)}</span></div>
  ${outcomeLine}
</div>`;
        }
    }

    // ── Action executor ───────────────────────────────────────────────────────

    _executeActions(actions) {
        if (!Array.isArray(actions)) return;
        for (const action of actions) {
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            }
            // complete_task is handled via eventMapping in scenario.json.erb
        }
    }

    // ── Global state ──────────────────────────────────────────────────────────

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

    cleanup() {
        // Clear all pending scan timers
        this._scanTimers.forEach(id => { clearTimeout(id); clearInterval(id); });
        this._scanTimers = [];
        super.cleanup();
    }
}
