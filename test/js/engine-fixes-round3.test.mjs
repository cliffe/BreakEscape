// Engine fixes, round 3 (2026-10-17): hostile toast names the NPC, stale toasts leave when
// a minigame opens, nothing opens while knocked out, the fine-brush coach line, and the
// fingerprint art probes only request PNGs that exist.
// Run with: node --test test/js/engine-fixes-round3.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const js = join(pub, 'js');
const dir = mkdtempSync(join(tmpdir(), 'engine-round3-'));
const load = async (rel, name) => {
    writeFileSync(join(dir, name), readFileSync(join(js, rel), 'utf8'));
    return import(pathToFileURL(join(dir, name)).href);
};

test('m06 F1: the hostile toast uses the display name and a matching pronoun', async () => {
    const { hostileTurnMessage } = await load('systems/combat-input.js', 'combat-input.mjs');
    assert.equal(hostileTurnMessage({ displayName: 'Kemal Aydin', gender: 'male' }, 'satoshi_minder'),
        "Kemal Aydin turns on you. He's coming for you!");
    assert.equal(hostileTurnMessage({ displayName: 'Dr. Irina Volkova', spriteSheet: 'female_scientist' }, 'irina'),
        "Dr. Irina Volkova turns on you. She's coming for you!");
    assert.equal(hostileTurnMessage(null, 'guard_1'), "guard_1 turns on you. They're coming for you!");
    const helpers = readFileSync(join(js, 'minigames/helpers/chat-helpers.js'), 'utf8');
    assert.doesNotMatch(helpers, /\$\{npcId\} is now hostile/);
    assert.match(helpers, /hostileTurnMessage\(hostileNpc, npcId\)/);
});

test('m06 F2: older info toasts are dismissed, not left over, when a minigame opens', async () => {
    const src = readFileSync(join(js, 'systems/notifications.js'), 'utf8');
    assert.match(src, /pickStaleHoldable\(shown, now\)\.forEach/);
    // pure picker, extracted so the module's DOM imports aren't needed
    const body = src.slice(src.indexOf('export function pickStaleHoldable'), src.indexOf('export function pickRecentHoldable'));
    const mod = `const HOLDABLE_TYPES = new Set(['info', 'success']); const RECENT_TOAST_MS = 1500;\n${body}`;
    writeFileSync(join(dir, 'stale.mjs'), mod);
    const { pickStaleHoldable } = await import(pathToFileURL(join(dir, 'stale.mjs')).href);
    const now = 10000;
    const picked = pickStaleHoldable([
        { type: 'success', shownAt: now - 400 },
        { type: 'info', shownAt: now - 2200 },
        { type: 'warning', shownAt: now - 3000 },
        { type: 'info' }
    ], now);
    assert.deepEqual(picked.map((e) => e.shownAt), [now - 2200]);
});

test('m04 R2 N1: nothing opens while knocked out, and the KO screen closes what is open', async () => {
    const { playerIsKnockedOut, closeMinigameForKnockout } = await load('systems/player-damage-interrupt.js', 'interrupt.mjs');
    assert.equal(playerIsKnockedOut({ playerHealth: { isKO: () => true } }), true);
    assert.equal(playerIsKnockedOut({ playerHealth: { isKO: () => false } }), false);
    assert.equal(playerIsKnockedOut({ playerHealth: null }), false);

    const fw = { currentMinigame: null, forced: 0 };
    fw.endMinigame = () => { fw.currentMinigame = null; };
    fw.forceCloseMinigame = () => { fw.forced++; fw.endMinigame(); };
    fw.currentMinigame = { _sceneType: 'phone-chat', complete() { fw.endMinigame(); } };
    assert.equal(closeMinigameForKnockout({ framework: fw }), true);
    assert.equal(fw.currentMinigame, null);
    assert.equal(fw.forced, 0);

    // a complete() that doesn't close is forced
    fw.currentMinigame = { complete() {} };
    assert.equal(closeMinigameForKnockout({ framework: fw }), true);
    assert.equal(fw.currentMinigame, null);
    assert.equal(fw.forced, 1);
    assert.equal(closeMinigameForKnockout({ framework: fw }), false, 'nothing open');

    const mgr = readFileSync(join(js, 'minigames/framework/minigame-manager.js'), 'utf8');
    const start = mgr.slice(mgr.indexOf('startMinigame(sceneType'), mgr.indexOf('If there\'s already a minigame running'));
    assert.match(start, /if \(window\.playerIsKnockedOut\?\.\(\)\) \{[\s\S]*?return null;/);
    const over = readFileSync(join(js, 'ui/game-over-screen.js'), 'utf8');
    assert.match(over, /this\.isShowing = true;[\s\S]*?window\.closeMinigameForKnockout\?\.\(\)/);
    // isKO is set before the hit closes the minigame, so its onComplete can't reopen one
    const health = readFileSync(join(js, 'systems/player-health.js'), 'utf8');
    assert.ok(health.indexOf('if (knockedOut) state.isKO = true;') < health.indexOf('closeMinigameOnDamage(amount'));
});

test('m05 blind B #7: after six fine strokes below the threshold the coach suggests the feather', async () => {
    const src = readFileSync(join(js, 'minigames/dusting/dusting-game.js'), 'utf8');
    const body = src.slice(src.indexOf('export const FINE_SWITCH_AFTER_STROKES'), src.indexOf('const FORENSIC = {'));
    writeFileSync(join(dir, 'feather.mjs'), body);
    const { shouldSuggestFeather, FINE_SWITCH_AFTER_STROKES, FEATHER_SUGGESTION } = await import(pathToFileURL(join(dir, 'feather.mjs')).href);
    const base = { tool: 'fine', strokes: FINE_SWITCH_AFTER_STROKES, coverage: 0.3, minCoverage: 0.4, tools: ['fine', 'broad'] };
    assert.equal(shouldSuggestFeather(base), true);
    assert.equal(shouldSuggestFeather({ ...base, strokes: FINE_SWITCH_AFTER_STROKES - 1 }), false);
    assert.equal(shouldSuggestFeather({ ...base, coverage: 0.4 }), false, 'threshold reached');
    assert.equal(shouldSuggestFeather({ ...base, tool: 'broad' }), false);
    assert.equal(shouldSuggestFeather({ ...base, tool: 'wand', tools: ['wand'] }), false);
    assert.match(FEATHER_SUGGESTION, /feather brush \(B\)/);
    assert.match(src, /if \(this\._suggestFeather\(\)\) return FEATHER_SUGGESTION;/);
});

test('fingerprint art: only PNGs that exist are requested', async () => {
    const dusting = readFileSync(join(js, 'minigames/dusting/dusting-art.js'), 'utf8');
    const reader = readFileSync(join(js, 'minigames/biometrics/fingerprint-art.js'), 'utf8');
    const names = (s) => [...s.match(/PRESENT_ART = new Set\(\[([^\]]*)\]\)/)[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    for (const n of [...names(dusting), ...names(reader)]) {
        assert.ok(existsSync(join(pub, 'assets/minigames/fingerprint', `${n}.png`)), `${n}.png exists`);
    }
    const slots = [...dusting.slice(dusting.indexOf('export const ART_SLOTS'), dusting.indexOf('export const PRESENT_ART'))
        .matchAll(/'([a-z-]+)': \{ w:/g)].map((m) => m[1]);
    for (const n of slots) {
        if (!names(dusting).includes(n)) {
            assert.equal(existsSync(join(pub, 'assets/minigames/fingerprint', `${n}.png`)), false,
                `${n}.png now exists: add it to PRESENT_ART`);
        }
    }
    // the text-file and bluetooth icons point at real images ("create me" placeholders are text)
    for (const rel of ['minigames/text-file/text-file-minigame.js', 'minigames/bluetooth/bluetooth-scanner-minigame.js']) {
        const src = readFileSync(join(js, rel), 'utf8');
        for (const m of src.matchAll(/\/break_escape\/assets\/(icons\/[a-z_-]+\.png)/g)) {
            const file = join(pub, 'assets', m[1]);
            assert.ok(existsSync(file), `${m[1]} exists`);
            assert.equal(readFileSync(file).subarray(1, 4).toString(), 'PNG', `${m[1]} is a PNG`);
        }
    }
});
