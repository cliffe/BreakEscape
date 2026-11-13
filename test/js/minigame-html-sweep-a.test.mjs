// Scenario text that these minigames write into HTML is plain text: a hostile string
// (an img with onerror, a marked element, an ampersand, quotes) must render as text in the
// alarm panel, ESD pushbutton, ransomware display, SIS threshold table and the drug library
// terminal (every tab, the source modals and the pump log). The alarm panel title and footer
// keep one piece of markup, <br>, which sis02 and lab_tesseract_trials use.
// The real modules run against jsdom.
// Run with: node test/js/minigame-html-sweep-a.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { AlarmPanelMinigame } = await imp('minigames/alarm-panel/alarm-panel-minigame.js');
const { EsdPushbuttonMinigame } = await imp('minigames/esd-pushbutton/esd-pushbutton-minigame.js');
const { RansomwareDisplayMinigame } = await imp('minigames/ransomware-display/ransomware-display-minigame.js');
const { SisConfigThresholdMinigame } = await imp('minigames/sis-config-threshold/sis-config-threshold-minigame.js');
const { DrugLibraryIntegrityMinigame } = await imp('minigames/drug-library-integrity/drug-library-integrity-minigame.js');

const HOSTILE = 'Hx <img src=x onerror="window.__pwned=1"> <u class="pwn">u</u> & "q" \'s\'';
const MARK = '<u class="pwn">u</u>';

function fresh() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameState = { globalVariables: {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    return document.getElementById('mg');
}

// Nothing from the hostile string became an element, and it reads back as typed
function assertPlain(root, label, times = 1) {
    assert.equal(root.querySelector('[onerror]'), null, `${label}: no onerror element`);
    assert.equal(root.querySelector('.pwn'), null, `${label}: no injected element`);
    const count = root.textContent.split(MARK).length - 1;
    assert.ok(count >= times, `${label}: the text reads back ${times} time(s), got ${count}`);
    assert.ok(!root.textContent.includes('&amp;'), `${label}: escaped once, not twice`);
}

const lockable = (minigameData) => ({ scenarioData: { minigameData } });

test('alarm panel: title, footer, lamp label and status are text; <br> still breaks the title', () => {
    const el = fresh();
    const mg = new AlarmPanelMinigame(el, { lockable: lockable({
        panelTitle: `${HOSTILE}<br>LINE TWO`, footer: HOSTILE,
        lamps: [{ label: HOSTILE, offStatus: HOSTILE, variable: 'x' }]
    }) });
    mg.init();
    assertPlain(el, 'alarm panel', 4);
    const title = el.querySelector('.ap-panel-title');
    assert.equal(title.querySelectorAll('br').length, 1, 'the allowed <br> still renders');
    assert.ok(title.textContent.endsWith('LINE TWO'));
});

test('ESD pushbutton: label and confirm text are text', () => {
    const el = fresh();
    const mg = new EsdPushbuttonMinigame(el, { lockable: lockable({ label: HOSTILE, confirmDesc: HOSTILE }) });
    try { mg.init(); } catch { /* past the render */ }
    assertPlain(el.querySelector('.esd-panel').parentElement, 'ESD', 2);
});

test('ransomware display: every scenario field is text', () => {
    const el = fresh();
    const mg = new RansomwareDisplayMinigame(el, { lockable: lockable({
        organisation: HOSTILE, encryptedSystems: HOSTILE, ransomAmount: HOSTILE, ransomBitcoin: HOSTILE,
        walletAddress: HOSTILE, supportPortal: HOSTILE, extraLines: [HOSTILE, HOSTILE]
    }) });
    mg.init();
    mg.render();
    assertPlain(el, 'ransomware', 8);
});

test('SIS threshold: table rows, buttons, detail and compare overlays are text', () => {
    const el = fresh();
    const row = { parameter: `A_${HOSTILE}`, currentValue: HOSTILE, certifiedValue: HOSTILE, status: HOSTILE,
        lastModified: HOSTILE, modifiedBy: HOSTILE, detailText: HOSTILE };
    const mg = new SisConfigThresholdMinigame(el, { rows: [row], compareTitle: HOSTILE, confirmLabel: HOSTILE });
    mg.init();
    const root = el.querySelector('.sis-threshold');
    assertPlain(root, 'SIS table', 6); // status is shown upper-cased
    mg.showDetail(row);
    assertPlain(mg.overlayEl, 'SIS detail', 2);
    mg.showCompare();
    assertPlain(mg.overlayEl, 'SIS compare', 5);
    assert.ok(mg.overlayEl.querySelector('wbr'), 'parameter names still wrap at underscores');
});

function dliParams() {
    const sources = [
        { id: 'paper_mar_charts', label: HOSTILE, requiresGlobal: 'g_a', lockedMessage: HOSTILE,
          content: { title: HOSTILE, drug: HOSTILE, patient: HOSTILE, dose: HOSTILE, note: HOSTILE, prescriber: HOSTILE, verified: HOSTILE } },
        { id: 'rows_src', label: HOSTILE, requiresGlobal: 'g_b', content: { rows: [{ key: HOSTILE, value: HOSTILE }], warning: HOSTILE } },
        { id: 'datasheet', label: HOSTILE, requiresGlobal: 'g_c', content: { title: HOSTILE, drug: HOSTILE, value: HOSTILE, unit: HOSTILE, warning: HOSTILE } }
    ];
    return { sprite: { scenarioData: { minigameData: {
        consoleTitle: HOSTILE, consoleSubtitle: HOSTILE, libraryFile: HOSTILE, backupFile: HOSTILE, hashFile: HOSTILE,
        drugLibrary: [
            { name: HOSTILE, concMgPerMl: HOSTILE, doseMin: HOSTILE, doseMax: HOSTILE, unit: HOSTILE, rateMaxMlHr: HOSTILE },
            { name: 'PLAIN', concMgPerMl: HOSTILE, doseMin: HOSTILE, doseMax: HOSTILE, unit: HOSTILE, rateMaxMlHr: HOSTILE }
        ],
        tamperedEntry: { drug: HOSTILE, field: 'DOSE_MAX', tamperedValue: HOSTILE, correctValue: HOSTILE, modifiedAt: HOSTILE, backupDate: HOSTILE },
        verificationSources: sources,
        fleetReport: {
            affectedPumps: [{ serial: HOSTILE, ward: HOSTILE, bed: HOSTILE, lastActive: HOSTILE, activeToday: true },
                            { serial: HOSTILE, ward: HOSTILE, bed: HOSTILE, lastActive: HOSTILE }],
            closingLines: [HOSTILE, HOSTILE],
            activePumpGlobals: { linkedDrugGlobal: 'drug_g', linkedDoseCorrectGlobal: 'ok_g' },
            outcomeText: { safe: HOSTILE }
        }
    } } } };
}

test('drug library terminal: header, every tab, source modals and pump log are text', () => {
    const el = fresh();
    const mg = new DrugLibraryIntegrityMinigame(el, dliParams());
    mg.init();
    assertPlain(el.querySelector('.dli-console-header'), 'DLI header', 5);
    const panel = el.querySelector('#dli-panel');
    mg._phase = 'failed';
    mg._renderIntegrityTab(panel);
    assertPlain(panel, 'DLI integrity tab', 10);
    mg._renderDiffTab(panel);
    assertPlain(panel, 'DLI diff tab', 12);
    mg._renderVerifyTab(panel);
    assertPlain(panel, 'DLI verify tab', 4);
    for (const s of mg._sources) {
        mg._openSourceModal(s);
        const overlay = el.querySelector('.dli-modal-overlay:last-of-type');
        assertPlain(overlay, `DLI source modal ${s.id}`, 2);
        overlay.remove();
    }
    window.gameState.globalVariables = { drug_g: HOSTILE, ok_g: true };
    mg._renderFleetTab(panel);
    assertPlain(panel, 'DLI fleet tab', 8);
    const pump = { ...mg._fleet.affectedPumps[0], lastActive: HOSTILE, _programmedNow: false };
    mg._showPumpActivityLog(pump, panel);
    assertPlain(panel.querySelector('.dli-activity-log'), 'DLI pump log', 5);
    assert.equal(window.__pwned, undefined, 'no handler ran');
});

test('drug library terminal: the restore button label (textContent) is not double escaped', () => {
    const el = fresh();
    const mg = new DrugLibraryIntegrityMinigame(el, dliParams());
    mg.init();
    assert.equal(mg._changesText('backup', false, true), `DOSE_MAX: ${HOSTILE}`);
    assert.ok(!mg._changesText('backup').includes('<'), 'the HTML form is escaped');
});
