// The social influence service: a call boundary announces itself even as a no-op
// (lab R5 F1). person-chat-pretext resets influence to the character's start with
// reason 'new_call' when a fresh call opens. When the previous call ended on the
// start value, that reset is 0 -> 0. The service must still emit npc_influence_changed
// with reason 'new_call' (and log the boundary row), so a bar mounted before the reset
// clears its stale "Last change" from the call before. A plain no-op (not a boundary)
// still emits nothing.
// Run with: bundle exec node --test test/js/social-influence-new-call.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-influence-newcall-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

const imp = (name) => import(pathToFileURL(join(dir, name)).href);
const { installSocialInfluence, uninstallSocialInfluence } = await imp('social-influence.mjs');

const quiet = (fn) => {
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; }
};

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted, listeners,
        on(n, cb) { listeners.set(n, [...(listeners.get(n) || []), cb]); },
        off(n, cb) { listeners.set(n, (listeners.get(n) || []).filter((f) => f !== cb)); },
        emit(n, d) { emitted.push([n, d]); (listeners.get(n) || []).slice().forEach((cb) => cb(d)); }
    };
}

function scenario() {
    return {
        globalVariables: { dev_influence: 0, dev_latched: '' },
        social: {
            characters: {
                dev: {
                    displayName: 'Dev',
                    channels: { phone: 'dev_service_desk' },
                    influence: { global: 'dev_influence', min: -100, max: 100, start: 0 },
                    thresholds: [{ id: 'wary', at: -40, icon: 'wary', effects: [] }]
                }
            }
        }
    };
}

function setup() {
    const dispatcher = makeDispatcher();
    const s = scenario();
    globalThis.window = {
        gameScenario: s,
        gameState: { globalVariables: { ...s.globalVariables } },
        eventDispatcher: dispatcher
    };
    const service = quiet(() => installSocialInfluence({ scenario: s, dispatcher }));
    return { dispatcher, service };
}

const influenceEvents = (d) => d.emitted.filter(([e]) => e === 'npc_influence_changed').map(([, x]) => x);

test('F1: a new_call reset at the start value (0 -> 0) still emits npc_influence_changed and logs the boundary', () => {
    const { dispatcher, service } = setup();
    // The character starts at 0 and the previous call ended at 0: the reset is a no-op.
    assert.equal(service.getInfluence('dev'), 0);
    quiet(() => service.setInfluence('dev', 0, 'new_call', {}));

    const evs = influenceEvents(dispatcher);
    const boundary = evs.find((e) => e.reason === 'new_call');
    assert.ok(boundary, 'a new_call npc_influence_changed is emitted even though the value did not change');
    assert.equal(boundary.character, 'dev');
    assert.equal(boundary.value, 0);
    assert.equal(boundary.delta, 0);

    const log = service.getLog('dev');
    assert.equal(log[log.length - 1].reason, 'new_call', 'the boundary row is in the service log for the bar seed');
    uninstallSocialInfluence();
});

test('F1 stays narrow: a non-boundary no-op write still emits nothing', () => {
    const { dispatcher, service } = setup();
    quiet(() => service.setInfluence('dev', 0, 'ink', {}));
    assert.equal(influenceEvents(dispatcher).length, 0, 'a 0 -> 0 write that is not a call boundary is silent');
    uninstallSocialInfluence();
});

test('F1 regression: a real new_call reset (-30 -> 0) still behaves as before', () => {
    const { dispatcher, service } = setup();
    window.gameState.globalVariables.dev_influence = -30;
    // seed lastSeen to -30 as a prior call would have
    quiet(() => service.setInfluence('dev', -30, 'urgency', {}));
    const before = influenceEvents(dispatcher).length;
    quiet(() => service.setInfluence('dev', 0, 'new_call', {}));
    const evs = influenceEvents(dispatcher);
    assert.equal(evs.length, before + 1);
    assert.equal(evs[evs.length - 1].reason, 'new_call');
    assert.equal(evs[evs.length - 1].value, 0);
    assert.equal(evs[evs.length - 1].delta, 30);
    uninstallSocialInfluence();
});
