// Scenario and server text that these minigames put into HTML is plain text: a hostile
// value (an img with onerror, tags, quotes) must render as text and run nothing. Covers the
// forensic data platform (block content through its small allow-list, chrome escaped), the
// network architecture diagram, the segmentation map, the SIEM queue, flag station rewards,
// the VM launcher card, the RFID cloner screens and both Bluetooth scanners.
// The real modules run against jsdom.
// Run with: node test/js/minigame-html-sweep-c.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
// SWEEP_JS_ROOT points at a copy of the engine (used to show the tests fail on old code)
const js = process.env.SWEEP_JS_ROOT || join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { ForensicDataPlatformMinigame, sanitizeRich } = await imp('minigames/forensic-data-platform/forensic-data-platform-minigame.js');
const { NetworkArchitectureMinigame } = await imp('minigames/network-architecture/network-architecture-minigame.js');
const { NetworkSegmentationMapMinigame } = await imp('minigames/network-segmentation-map/network-segmentation-map-minigame.js');
const { SiemDashboardMinigame } = await imp('minigames/siem/siem-dashboard-minigame.js');
const { FlagStationMinigame } = await imp('minigames/flag-station/flag-station-minigame.js');
const { VmLauncherMinigame } = await imp('minigames/vm-launcher/vm-launcher-minigame.js');
const { RFIDUIRenderer } = await imp('minigames/rfid/rfid-ui.js');
const { BleScannerMinigame } = await imp('minigames/ble-scanner/ble-scanner-minigame.js');
const { BluetoothScannerMinigame } = await imp('minigames/bluetooth/bluetooth-scanner-minigame.js');

const IMG = '<img src=x onerror="window.__pwned=1">';
const HOSTILE = `Vault <b>bold</b> ${IMG} & "q" 's'`;
// For attribute values: a quote that would close the attribute and add a handler
const ATTR = 'x" onmouseover="window.__pwned=1" data-y="';

function fresh() {
    window.__pwned = undefined;
    window.gameState = { globalVariables: {} };
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    return document.getElementById('mg');
}

function initQuietly(mg) {
    try { mg.init(); } catch { /* past the part under test */ }
}

// Nothing injected anywhere under root, no handler attribute, no handler ran
function assertClean(root, label) {
    assert.equal(root.querySelector('img[onerror]'), null, `${label}: no img with onerror`);
    assert.equal(root.querySelector('b'), null, `${label}: no injected <b>`);
    assert.equal(root.querySelector('[onmouseover]'), null, `${label}: no onmouseover attribute`);
    assert.equal(window.__pwned, undefined, `${label}: no handler ran`);
}

// A plain-text field: clean, and the hostile text reads back as typed
function assertText(el, label) {
    assert.ok(el, `${label}: the element renders`);
    assertClean(el, label);
    const t = el.textContent;
    assert.ok(t.includes('<b>bold</b>'), `${label}: tags read back as typed`);
    assert.ok(t.includes(IMG), `${label}: the img reads back as text`);
    assert.ok(t.includes('& "q" \'s\''), `${label}: entities and quotes read back as typed`);
}

test('forensic platform: block content keeps the allowed markup and drops the rest', () => {
    const rich = '<strong style="color:#f85149">Red</strong><br><p style="margin-top:6px">Para</p> <code>c.ellison</code> 21&deg;C &mdash; ok';
    const tabs = [{ id: 'tab1', label: HOSTILE, heading: HOSTILE, blocks: [
        { type: 'p', html: HOSTILE },
        { type: 'p', html: rich },
        { type: 'timeline', steps: [{ label: HOSTILE, desc: HOSTILE }] },
        { type: 'log-table', columns: [HOSTILE], rows: [{ cells: [HOSTILE, { class: ATTR, html: HOSTILE }] }] },
        { type: 'setpoint-table', rows: [{ label: HOSTILE, value: HOSTILE }] },
        { type: 'document-excerpt', body: HOSTILE, source: HOSTILE },
        { type: 'list', items: [HOSTILE] },
        { type: 'callout', style: 'evidence-gap', style2: ATTR, title: HOSTILE, body: HOSTILE }
    ] }];
    const mg = new ForensicDataPlatformMinigame(fresh(), {
        tabs, caseRef: HOSTILE, confirmLabel: HOSTILE, confirmHint: HOSTILE
    });
    initQuietly(mg);
    mg._renderTabContent('tab1');
    const root = document.getElementById('mg');
    assertClean(root, 'forensic platform');
    assertText(root.querySelector('.fdp-case'), 'forensic case ref');
    assertText(root.querySelector('.fdp-tab'), 'forensic tab label');
    assertText(root.querySelector('#fdp-confirm-btn'), 'forensic confirm label');
    assertText(root.querySelector('#fdp-confirm-hint'), 'forensic confirm hint');
    const panel = root.querySelector('#fdp-panel');
    assert.ok(panel.textContent.includes('bold'), 'unwrapped tag keeps its text');
    assert.equal(panel.querySelector('.fdp-evidence-gap').hasAttribute('style'), false, 'a style2 with no allowed declaration is dropped');
    const strong = [...panel.querySelectorAll('strong')].find(s => s.textContent === 'Red');
    assert.ok(strong, 'author <strong> still renders');
    assert.equal(strong.getAttribute('style'), 'color:#f85149', 'its style is kept');
    assert.ok(panel.querySelector('p p, p br, br'), 'author <br> still renders');
    assert.ok([...panel.querySelectorAll('code')].some(c => c.textContent === 'c.ellison'), 'author <code> still renders');
    assert.ok(panel.textContent.includes('21°C — ok'), 'entities still decode');
});

test('forensic allow-list: handlers, script, links and unsafe styles go', () => {
    const out = sanitizeRich('<strong onclick="x()" style="background:url(javascript:x)">a</strong>'
        + '<script>window.__pwned=1</script><a href="javascript:x">link</a><svg onload="x()"></svg>'
        + '<p style="color:red">ok</p><!-- c -->');
    const box = document.createElement('div');
    box.innerHTML = out;
    assert.equal(box.querySelector('[onclick], script, a, svg'), null, out);
    assert.equal(box.querySelector('strong').hasAttribute('style'), false, 'a url() style is dropped');
    assert.equal(box.querySelector('p').getAttribute('style'), 'color:red', 'a plain style is kept');
    assert.equal(box.textContent, 'alinkok');
});

// Review R4 m2: styles keep only text styling and spacing, in the rich text and in style2
const OVERLAY = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000';

test('forensic allow-list: an overlay style is cut down to its allowed properties', () => {
    const box = document.createElement('div');
    box.innerHTML = sanitizeRich(`<strong style="${OVERLAY};color:#f85149">a</strong><p style="${OVERLAY}">b</p>`);
    assert.equal(box.querySelector('strong').getAttribute('style'), 'color:#f85149', 'only color survives');
    assert.equal(box.querySelector('p').hasAttribute('style'), false, 'nothing allowed: the style goes');
    assert.equal(box.querySelector('[style*="position"], [style*="z-index"], [style*="width"]'), null);
});

test('forensic callout: style2 goes through the same allow-list', () => {
    const tabs = [{ id: 'tab1', label: 'T', heading: 'H', blocks: [
        { type: 'callout', style: 'evidence-gap', style2: `${OVERLAY};margin-top:10px`, title: 't', body: 'b' },
        { type: 'callout', style: 'evidence-gap', style2: 'background:url(https://example.invalid/x.png)', title: 't', body: 'b' }
    ] }];
    const mg = new ForensicDataPlatformMinigame(fresh(), { tabs });
    initQuietly(mg);
    mg._renderTabContent('tab1');
    const callouts = document.querySelectorAll('#fdp-panel .fdp-evidence-gap');
    assert.equal(callouts[0].getAttribute('style'), 'margin-top:10px', 'sis03 margin kept, overlay dropped');
    assert.equal(callouts[1].hasAttribute('style'), false, 'a url() background is dropped');
});

test('forensic p block: an authored <p> inside it is unwrapped, so the output is stable when re-parsed', () => {
    const tabs = [{ id: 'tab1', label: 'T', heading: 'H', blocks: [
        { type: 'p', html: '<p>one</p><p><button><p>two</p></button></p>' }
    ] }];
    const mg = new ForensicDataPlatformMinigame(fresh(), { tabs });
    initQuietly(mg);
    mg._renderTabContent('tab1');
    const panel = document.getElementById('fdp-panel');
    const before = panel.innerHTML;
    assert.equal(panel.querySelectorAll('p').length, 1, 'one paragraph, no empty siblings');
    assert.equal(panel.querySelector('p').textContent, 'onetwo');
    panel.innerHTML = before;
    assert.equal(panel.innerHTML, before, 're-parsing gives the same markup');
});

test('network architecture: SVG labels, attributes and the detail panel are text', () => {
    const node = { id: 'n1', label: HOSTILE, sublabel: HOSTILE, zone: 'z1', x: 10, y: 10, w: 80, h: 30,
        paths: ['p1'], desc: HOSTILE, vuln: HOSTILE, warn: true };
    const mg = new NetworkArchitectureMinigame(fresh(), {
        viewBox: ATTR,
        zones: [{ id: 'z1', label: HOSTILE, y: 0, h: 100, fill: ATTR, stroke: ATTR }],
        nodes: [node, { ...node, id: 'n2', x: 200 }],
        lines: [{ from: 'n1', to: 'n2', type: 'legacy', paths: [ATTR], label: HOSTILE }],
        attackPaths: [{ id: 'p1', label: HOSTILE, claim: HOSTILE, desc: HOSTILE }],
        externalOrgs: [{ id: 'o1', label: HOSTILE, label2: HOSTILE, x: 0, y: 0, w: 10, h: 10, nodes: [] }]
    });
    initQuietly(mg);
    mg._renderDetail(node);
    const root = document.getElementById('mg');
    assertClean(root, 'network architecture');
    assertText(root.querySelector('.nad-node-label'), 'node label');
    assertText(root.querySelector('.nad-zone-label'), 'zone label');
    assertText(root.querySelector('.nad-line-label'), 'line label');
    assertText(root.querySelector('.nad-detail-desc'), 'detail description');
    assertText(root.querySelector('.nad-detail-vuln-text'), 'detail vulnerability');
    assertText(root.querySelector('.nad-path-label'), 'detail attack path');
    assert.equal(root.querySelector('.nad-zone').getAttribute('fill'), ATTR, 'fill reads back as typed');
});

test('segmentation map: zones, modal, authorisation lines and consequences are text', () => {
    const mg = new NetworkSegmentationMapMinigame(fresh(), {
        severButtonLabel: HOSTILE,
        zones: [{ slot: ATTR, label: HOSTILE, devices: [HOSTILE] }],
        modalConsequences: [HOSTILE],
        auth: { itsecLabel: HOSTILE, clinicalLabel: HOSTILE, claimRef: HOSTILE },
        rules: [],
        defaultConsequences: [{ section: HOSTILE, items: [{ severity: ATTR, text: HOSTILE, isAttackPath: true }] }]
    });
    initQuietly(mg);
    try { mg._openModal(); } catch { /* past the modal text */ }
    const root = document.getElementById('mg');
    assertClean(root, 'segmentation map');
    assertText(root.querySelector('.nsm-zone-label'), 'zone label');
    assertText(root.querySelector('.nsm-device'), 'zone device');
    assertText(root.querySelector('#nsm-sever-btn'), 'sever button');
    assertText(root.querySelector('#nsm-auth-itsec'), 'IT security line');
    assertText(root.querySelector('#nsm-auth-clinical'), 'clinical line');
    assertText(root.querySelector('#nsm-auth-warning'), 'authorisation warning');
    assertText(root.querySelector('.nsm-modal-body'), 'modal consequences');
    assertText(root.querySelector('.nsm-cons-section'), 'consequence section');
    assertText(root.querySelector('.nsm-cons-item'), 'consequence item');
});

test('SIEM: an escalated alert in the queue shows its source and description as text', () => {
    const div = () => document.createElement('div');
    const ctx = {
        alerts: [{ status: 'escalated', severity: 'HIGH', timestamp: '1', source: HOSTILE, description: HOSTILE }],
        queueListEl: div(), queueCountEl: div(),
        renderSeverityChart: div, renderSeverityLegend: div, renderTopSources: div,
        calculateAlertScore: () => '0'
    };
    window.__pwned = undefined;
    SiemDashboardMinigame.prototype.renderQueue.call(ctx);
    assertClean(ctx.queueListEl, 'SIEM queue');
    assertText(ctx.queueListEl.querySelector('.siem-queue-text'), 'SIEM queue text');
});

test('flag station: reward lines show server item names and room ids as text', () => {
    const mg = new FlagStationMinigame(fresh(), { acceptsVms: [] });
    const el = document.createElement('div');
    mg.showRewards(el, [{ type: 'give_item', item: { name: HOSTILE } }, { type: 'unlock_door', room_id: HOSTILE }]);
    assertClean(el, 'flag rewards');
    const items = el.querySelectorAll('.reward-item');
    assertText(items[0], 'give_item reward');
    assertText(items[1], 'unlock_door reward');
    assert.equal(mg.escapeHtml('"\''), '&quot;&#39;', 'the helper escapes quotes for attributes');
});

test('VM launcher: title, IP and console link are text, and the href stays one attribute', () => {
    window.breakEscapeConfig = { vmPanelUrl: `/panel${ATTR}` };
    const mg = new VmLauncherMinigame(fresh(), { vm: { title: HOSTILE, ip: HOSTILE }, hacktivityMode: true });
    delete window.breakEscapeConfig;
    const box = document.getElementById('mg');
    box.innerHTML = mg.buildVmDisplay();
    assertClean(box, 'VM launcher');
    assertText(box.querySelector('.vm-title'), 'VM title');
    assertText(box.querySelector('.vm-ip-value'), 'VM IP');
    const a = box.querySelector('a.vm-action-btn');
    assert.ok(a.getAttribute('href').startsWith(`/panel${ATTR}`), 'href reads back as typed');
});

test('RFID cloner: card fields and result messages are text', () => {
    const container = fresh();
    container.innerHTML = '<div id="rfid-screen"></div>';
    const data = {
        protocol: 'EM4100', protocolName: 'EM4100', frequency: '125kHz', security: 'low', color: '#fff', icon: '',
        fields: [{ label: 'HEX', value: HOSTILE }, { label: 'Card', value: HOSTILE }]
    };
    const ui = new RFIDUIRenderer({ gameContainer: container,
        dataManager: { getCardDisplayData: () => data, canClone: () => true } });
    const screen = () => document.getElementById('rfid-screen');
    try { ui.showCardDetails({ name: 'Card' }); } catch { /* past the fields */ }
    assertClean(screen(), 'card details');
    assertText(screen().querySelector('.flipper-card-data div'), 'card details field');
    try { ui.showProtocolInfo({ name: 'Card' }); } catch { /* past the fields */ }
    assertClean(screen(), 'protocol info');
    assertText(screen().querySelector('.flipper-card-data div'), 'protocol info field');
    assert.equal(screen().querySelector('.flipper-card-data div strong').textContent, 'HEX:', 'the label stays bold');
    ui.showSuccess(HOSTILE);
    assertText(screen().querySelector('.flipper-success-message'), 'success message');
    ui.showError(HOSTILE);
    assertText(screen().querySelector('.flipper-error-message'), 'error message');
});

test('BLE scanner: a device row and the action panel show name, MAC and UUIDs as text', () => {
    const mg = new BleScannerMinigame(fresh(), {});
    const device = { name: HOSTILE, mac: HOSTILE, uuids: [ATTR + IMG], nearby: false, lastSeen: 0 };
    const row = mg.renderDeviceRow(device);
    document.getElementById('mg').appendChild(row);
    assertClean(row, 'BLE row');
    assertText(row.querySelector('.ble-device-name span'), 'BLE name');
    assertText(row.querySelector('.ble-device-mac'), 'BLE MAC');
    assert.equal(row.querySelector('.ble-uuid-chip').getAttribute('title'), ATTR + IMG, 'UUID title reads back');
    mg.gameContainer = document.getElementById('mg');
    mg.gameContainer.insertAdjacentHTML('beforeend', '<div id="ble-action-info"></div>');
    try { mg.updateActionPanel(device); } catch { /* past the info block */ }
    assertText(document.querySelector('.ble-action-mac'), 'BLE action MAC');
});

test('Bluetooth scanner: a device shows name, MAC and details as text', () => {
    const mg = new BluetoothScannerMinigame(fresh(), {});
    mg.gameContainer = document.getElementById('mg');
    mg.gameContainer.innerHTML = '<div id="bluetooth-device-list"></div>';
    mg.bluetoothDevices = [{ id: 'd1', name: HOSTILE, mac: HOSTILE, details: HOSTILE, nearby: false, lastSeen: 0 }];
    try { mg.updateBluetoothPanel(); } catch { /* past the list */ }
    const list = document.getElementById('bluetooth-device-list');
    assertClean(list, 'Bluetooth list');
    assertText(list.querySelector('.bluetooth-device-name span'), 'Bluetooth name');
    assertText(list.querySelector('.bluetooth-device-details'), 'Bluetooth details');
});
