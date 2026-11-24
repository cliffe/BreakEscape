// A view with no ops block draws as it always did, whatever skin was chosen (Ops S6 unit 15). Every DOM saved in
// fixtures/network-view/unchanged/ is mounted through the scene's own starter with a stored pick of the Terminal,
// a `?net_skin=cli` value (when this page can hold one), a scenario default of the Terminal and a press of the switch
// all set at once: it equals the snapshot byte for byte, has no switch, and the Terminal is never built.
// Run with: node test/js/network-skin-unchanged.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE_DIR, mount, unchangedCases, imp } from './support/network-view-harness.mjs';

const NV = 'minigames/network-view/';
const { TerminalRenderer } = await imp(`${NV}network-view-terminal.js`);
const choice = await imp(`${NV}skin-choice.js`);

let mounts = 0;
const realMount = TerminalRenderer.prototype.mount;
TerminalRenderer.prototype.mount = function (...a) { mounts += 1; return realMount.apply(this, a); };
const built = () => Number(new TerminalRenderer()._id.split('-').pop());

const store = { [choice.STORAGE_KEY]: 'cli' };
Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } }
});
let urlSet = false;
try { window.history.replaceState(null, '', `?${choice.URL_PARAM}=cli`); urlSet = window.location.search.includes('cli'); } catch (e) { urlSet = false; }
window.gameScenario = { networkView: { defaultSkin: 'cli' } };
choice.rememberPress('cli', { urlValue: 'cli', storage: window.localStorage });

test('the stored pick, the scenario default and a press all name the Terminal', async () => {
    assert.equal(choice.readPick(window.localStorage), 'cli');
    assert.equal(choice.pressed(), 'cli');
    // The page URL carries ?net_skin=cli only where jsdom lets this page change it; the press stands in for it otherwise
    if (urlSet) assert.equal(choice.readUrlValue(window.location.search), 'cli');
});

test('every saved view with no ops block draws as saved, with no switch and no Terminal', async () => {
    const cases = unchangedCases();
    assert.ok(cases.length > 0);
    const before = built();
    const mountsBefore = mounts;
    for (const c of cases) {
        const h = await mount(c.body, { footholdId: c.footholdId, starter: true });
        const dom = h.dom();
        assert.equal(dom, readFileSync(join(FIXTURE_DIR, 'unchanged', `${c.key}.html`), 'utf8'), c.key);
        assert.ok(!dom.includes('data-skin-switch'), c.key);
        assert.ok(!('skin' in h.view().getTestState()), c.key);
        h.end();
    }
    assert.equal(mounts, mountsBefore, 'the Terminal was never mounted');
    assert.equal(built(), before + 1, 'the Terminal was never constructed (only the probe above)');
});
