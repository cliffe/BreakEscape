// The UI rules audit's --ops-view surfaces (tools/playtest/ui-rules-audit.mjs): the open code reads
// the held footholds from window.__test.access.footholds() (the call the test bridge really has),
// opens the view for it and switches skin with window.__test.network.setSkin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { opsViewSurfaces } = await import(pathToFileURL(join(here, '../../tools/playtest/ui-rules-audit.mjs')).href);
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

function run(surface, bridge) {
    const calls = [];
    const win = {
        __test: bridge(calls),
        startNetworkViewMinigame: (id) => calls.push(['start', id])
    };
    const fn = new AsyncFunction('window', 'setTimeout', surface.open);
    return fn(win, (f) => f()).then(() => calls);
}

test('both surfaces are required and named for their skin', () => {
    const s = opsViewSurfaces(null);
    assert.deepEqual(s.map(x => x.name), ['network-view-gui', 'network-view-cli']);
    assert.ok(s.every(x => x.required));
});

test('with no id given, the first foothold of access.footholds() is opened, then the skin is set', async () => {
    for (const surface of opsViewSurfaces(null)) {
        const skin = surface.name.endsWith('cli') ? 'cli' : 'gui';
        const calls = await run(surface, (log) => ({
            access: { footholds: () => [{ id: 'jack_office_port' }, { id: 'other' }] },
            network: { setSkin: async (n) => log.push(['skin', n]) }
        }));
        assert.deepEqual(calls, [['start', 'jack_office_port'], ['skin', skin]]);
    }
});

test('an id after --ops-view wins over the held list', async () => {
    const [gui] = opsViewSurfaces('given_one');
    const calls = await run(gui, (log) => ({ access: { footholds: () => [] }, network: { setSkin: async (n) => log.push(['skin', n]) } }));
    assert.deepEqual(calls[0], ['start', 'given_one']);
});

test('the old window.__test.footholds call is not read, and no foothold throws', async () => {
    const [gui] = opsViewSurfaces(null);
    await assert.rejects(run(gui, () => ({ footholds: () => [{ id: 'x' }], network: { setSkin: async () => {} } })), /no foothold held/);
    await assert.rejects(run(gui, () => ({ access: { footholds: () => [] }, network: { setSkin: async () => {} } })), /no foothold held/);
});
