// Pass-3 client engine fixes: E7 (dual-auth text), E8 (influence toast), E14 (RFID clonable),
// E15 (timer HUD clears), E17 (room display name).
// Run with: node test/js/engine-fixes-pass3.test.mjs   (no dependencies; exits non-zero on failure)
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'be-pass3-'));
// The game's .js files are browser ES modules (no "type": "module"), so copy each one
// to a temp .mjs, rewriting its relative imports to point at the copies (or stubs).
function copy(p, rewrites = {}) {
    let code = readFileSync(src(p), 'utf8');
    for (const [from, to] of Object.entries(rewrites)) code = code.split(from).join(to);
    const out = join(tmp, basename(p).replace(/\.js$/, '.mjs'));
    writeFileSync(out, code);
    return pathToFileURL(out).href;
}
const js = (p) => {
    if (p.endsWith('rfid-data.js')) {
        writeFileSync(join(tmp, 'api-stub.mjs'), 'export const ApiClient = {};');
        copy('minigames/rfid/rfid-protocols.js');
        return copy(p, { "'./rfid-protocols.js'": "'./rfid-protocols.mjs'", "'../../api-client.js'": "'./api-stub.mjs'" });
    }
    if (p.endsWith('rfid-ui.js')) {
        copy('minigames/rfid/rfid-protocols.js');
        return copy(p, { "'./rfid-protocols.js'": "'./rfid-protocols.mjs'" });
    }
    return copy(p);
};

// Minimal browser stubs (set before the modules that touch them are used)
function makeEl() {
    const classes = new Set();
    return {
        style: {}, textContent: '', children: [], parentNode: null,
        classList: { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)), contains: x => classes.has(x) },
        appendChild(c) { this.children.push(c); c.parentNode = this; },
        removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; },
    };
}
globalThis.window = { gameState: { globalVariables: {} }, location: { origin: 'http://x' } };
globalThis.document = { getElementById: () => null, createElement: makeEl, body: makeEl() };

test('E17: room display name uses door_sign, then name, then a tidied id', async () => {
    const { getRoomDisplayName } = await import(js('utils/room-display-name.js'));
    const sc = { rooms: { trading_floor: { door_sign: 'Trading Floor' }, vault: { name: 'The Vault' }, server_room: {} } };
    assert.equal(getRoomDisplayName('trading_floor', sc), 'Trading Floor');
    assert.equal(getRoomDisplayName('vault', sc), 'The Vault');
    assert.equal(getRoomDisplayName('server_room', sc), 'Server Room');
    assert.equal(getRoomDisplayName('unknown_room', sc), 'Unknown Room');
    assert.equal(getRoomDisplayName('', sc), '');
});

test('E8: influence toast uses the NPC display name, not an id', async () => {
    const { getInfluenceMessage } = await import(js('minigames/helpers/influence-message.js'));
    const npc = { id: 'priya_r', displayName: 'Priya Raghavan' };
    assert.equal(getInfluenceMessage('influence_gained', 10, 'gained', npc), 'Priya Raghavan really likes that');
    assert.equal(getInfluenceMessage('influence_gained', 3, 'gained', npc), 'Priya Raghavan appreciates that');
    assert.equal(getInfluenceMessage('influence_lost', 10, 'lost', npc), 'Priya Raghavan is disappointed');
    assert.equal(getInfluenceMessage('influence_lost', 3, 'lost', npc), 'Priya Raghavan seems uncertain');
    // an id of dr_chen with a different display name must not say "Dr. Chen"
    assert.ok(!getInfluenceMessage('influence_gained', 10, 'gained', { id: 'dr_chen', displayName: 'Someone Else' }).includes('Chen'));
    // no display name: generic text
    assert.equal(getInfluenceMessage('influence_gained', 10, 'gained', { id: 'x' }), 'Influence significantly increased');
});

test('E7: dual-auth text defaults to sis01 and can be overridden', async () => {
    const { resolveDualAuthText, escapeHtml } = await import(js('minigames/dual-auth/dual-auth-text.js'));
    const d = resolveDualAuthText({});
    assert.equal(d.itsec_name, 'Ravi Anand');
    assert.equal(d.clinical_name, 'David Osei');
    assert.equal(d.heading, 'NETWORK ISOLATION — DUAL AUTHORISATION REQUIRED');
    const o = resolveDualAuthText({ itsec_name: 'A B', clinical_label: 'FINANCE' }, { clinical_name: 'C D' });
    assert.equal(o.itsec_name, 'A B');
    assert.equal(o.clinical_label, 'FINANCE');
    assert.equal(o.clinical_name, 'C D');
    assert.equal(o.authorise_label, 'AUTHORISE NETWORK ISOLATION');
    assert.equal(escapeHtml('<b>&'), '&lt;b&gt;&amp;');
});

test('E14: a MIFARE Classic card with no keys is neither "Clonable" nor saveable', async () => {
    const { RFIDDataManager } = await import(js('minigames/rfid/rfid-data.js'));
    const m = new RFIDDataManager();
    const noKeys = { card_id: 'c1', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Badge' };
    assert.equal(m.canClone(noKeys), false);
    const clonableRow = (c) => m.getCardDisplayData(c).fields.find(f => f.label === 'Clonable').value;
    assert.equal(clonableRow(noKeys), 'No');
    const withKeys = { ...noKeys, rfid_data: { uid: 'AABBCCDD', sectors: { 0: 'FFFFFFFFFFFF' } } };
    assert.equal(m.canClone(withKeys), true);
    assert.equal(clonableRow(withKeys), 'Yes ✓');
    assert.equal(m.canClone({ rfid_protocol: 'MIFARE_Classic_Custom_Keys', rfid_data: { uid: 'AA', sectors: {} } }), false);
    // other protocols are unaffected
    assert.equal(m.canClone({ rfid_protocol: 'EM4100', rfid_hex: '0102030405' }), true);
    assert.equal(m.canClone({ rfid_protocol: 'MIFARE_DESFire', card_id: 'd' }), true);
});

test('E14: keyless MIFARE read screen offers "Crack keys first" with a persistent explanation, not Save', async () => {
    const { RFIDUIRenderer } = await import(js('minigames/rfid/rfid-ui.js')).then(m => ({ RFIDUIRenderer: m.RFIDUIRenderer || m.RFIDUI || Object.values(m).find(v => typeof v === 'function') }));
    const { RFIDDataManager } = await import(js('minigames/rfid/rfid-data.js'));
    const mk = (tag) => {
        const el = { tag, children: [], style: {}, listeners: {}, className: '', textContent: '', _html: '',
            appendChild(c) { this.children.push(c); return c; },
            insertBefore(c, ref) { const i = this.children.indexOf(ref); if (i < 0) throw new Error("NotFoundError: ref not a child"); this.children.splice(i, 0, c); return c; },
            addEventListener(t, f) { this.listeners[t] = f; } };
        Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; if (v === '') this.children = []; } });
        return el;
    };
    const screen = mk('div');
    const prevDoc = globalThis.document;
    globalThis.document = { createElement: mk, getElementById: () => screen };
    try {
        const calls = [];
        const dm = new RFIDDataManager();
        const ui = new RFIDUIRenderer({ dataManager: dm, handleSaveCard: () => calls.push('save'), complete: () => {} });
        ui.dataManager = dm;
        ui.showProtocolInfo = () => calls.push('attack-menu');
        const flat = (e) => [e, ...e.children.flatMap(flat)];
        const card = { card_id: 'c', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Badge' };
        ui.showCardDataScreen(card);
        let btns = flat(screen).filter(e => e.tag === 'button');
        assert.deepEqual(btns.map(b => b.textContent), ['Crack keys first', 'Cancel']);
        assert.ok(flat(screen).some(e => /dictionary attack/i.test(e.textContent) && /Darkside/.test(e.textContent)));
        btns[0].listeners.click();
        assert.deepEqual(calls, ['attack-menu']);
        // with keys: plain Save as before
        ui.showCardDataScreen({ ...card, rfid_data: { uid: 'AABBCCDD', sectors: { 0: 'FFFFFFFFFFFF' } } });
        btns = flat(screen).filter(e => e.tag === 'button');
        assert.equal(btns[0].textContent, 'Save');
        // EM4100 unchanged
        ui.showCardDataScreen({ card_id: 'e', rfid_protocol: 'EM4100', rfid_hex: '0102030405', name: 'Fob' });
        assert.equal(flat(screen).filter(e => e.tag === 'button')[0].textContent, 'Save');
    } finally { globalThis.document = prevDoc; }
});

test('E15: timer HUD clears its text when the last timer fires or is cancelled', async () => {
    const { ScenarioTimerUI } = await import(js('ui/scenario-timer.js'));
    const ui = new ScenarioTimerUI({}, { timers: [{ id: 't1', label: 'Voltage — the laptop', delayMs: 60000, showCountdown: true }] });
    ui._tick();
    assert.equal(ui.displayElement.style.display, 'block');
    assert.equal(ui.labelElement.textContent, 'Voltage — the laptop');
    assert.match(ui.clockElement.textContent, /^\d\d:\d\d$/);
    ui.markFired('t1');
    assert.equal(ui.displayElement.style.display, 'none');
    assert.equal(ui.labelElement.textContent, '');
    assert.equal(ui.clockElement.textContent, '');
    ui._tick();
    assert.equal(ui.labelElement.textContent, '');

    // cancelled: its condition stops passing
    window.gameState.globalVariables.live = true;
    const ui2 = new ScenarioTimerUI({}, { timers: [{ id: 't2', label: 'Live', delayMs: 60000, showCountdown: true, condition: 'globalVars.live' }] });
    ui2._tick();
    assert.equal(ui2.labelElement.textContent, 'Live');
    window.gameState.globalVariables.live = false;
    ui2._tick();
    assert.equal(ui2.labelElement.textContent, '');
    assert.equal(ui2.clockElement.textContent, '');
    ui.destroy(); ui2.destroy();
});

// ScenarioTimerUI starts a setInterval; don't let a failed test leave the process hanging.
test.after(() => setTimeout(() => process.exit(process.exitCode || 0), 50).unref?.());
