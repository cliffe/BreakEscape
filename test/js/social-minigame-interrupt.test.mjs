// N-02 (SE Phase 0 round 2, scheduled into P1-F): when an interrupting minigame
// (a forced call, the phone) replaces a running child, the teardown can run a
// suspended parent's onComplete, which may open its own minigame. That minigame
// must not be orphaned when the interrupting scene installs itself.
// Run with: bundle exec node --test test/js/social-minigame-interrupt.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// Copy the manager with a stub base class (its only import) so relative
// resolution works without pulling in Phaser.
const dir = mkdtempSync(join(tmpdir(), 'social-interrupt-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'framework'), { recursive: true });
writeFileSync(join(dir, 'framework/base-minigame.js'), 'export class MinigameScene {}\n');
writeFileSync(join(dir, 'framework/minigame-manager.js'),
    readFileSync(join(js, 'minigames/framework/minigame-manager.js'), 'utf8'));
const { MinigameFramework } = await import(pathToFileURL(join(dir, 'framework/minigame-manager.js')));

console.log = () => {};
console.warn = () => {};

// A minimal DOM so startMinigame/endMinigame run.
function stubElement() {
    return {
        className: '', dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {}, appendChild() {}, remove() {}, hasAttribute() { return false; },
        querySelector() { return null; }, querySelectorAll() { return []; }
    };
}
globalThis.document = {
    body: { classList: { toggle() {} }, appendChild() {} },
    createElement: () => stubElement(),
    querySelector: () => null,
    querySelectorAll: () => []
};
globalThis.window = {
    pauseKeyboardInput() {}, resumeKeyboardInput() {},
    cancelClickToMove() {}, holdRecentNotifications() {},
    barkSystem: { drainDeferredBarks() {} }
};

// A scene stub recording its lifecycle. Its container is a stub element.
function sceneFactory(log) {
    return class Scene {
        constructor(container, params) { this.container = container || stubElement(); this.params = params || {}; }
        init() { log.push(`init:${this._sceneType}`); }
        start() { log.push(`start:${this._sceneType}`); }
        cleanup() { log.push(`cleanup:${this._sceneType}`); this.cleaned = true; }
    };
}

function freshManager() {
    const log = [];
    const fw = Object.create(MinigameFramework);
    fw.currentMinigame = null;
    fw.registeredScenes = {};
    fw._releasedParents = new WeakSet();
    const Scene = sceneFactory(log);
    for (const t of ['parent', 'child', 'parentReplacement', 'interrupt', 'plain']) fw.registerScene(t, Scene);
    return { fw, log };
}

test('a minigame opened during an interrupt teardown is ended, not orphaned', () => {
    const { fw, log } = freshManager();
    let parentOnComplete = 0;
    let replacementInstance = null;

    // 1. The parent is running and suspends itself to launch a child, whose
    //    returnTo points back at the parent. The parent's onComplete opens its
    //    own replacement minigame (the orphan risk).
    const parentParams = {
        suspended: true,
        requiresKeyboardInput: true,
        onComplete: () => {
            parentOnComplete += 1;
            replacementInstance = fw.startMinigame('parentReplacement', null, {});
        }
    };
    fw.startMinigame('parent', null, parentParams);
    fw.startMinigame('child', null, { returnTo: { sceneType: 'parent', params: {} }, requiresKeyboardInput: true });
    assert.equal(fw.currentMinigame._sceneType, 'child');

    // 2. A forced call interrupts the child.
    const interrupt = fw.startMinigame('interrupt', null, {});

    // The interrupt is what is running now, and it is not the orphaned replacement.
    assert.equal(fw.currentMinigame._sceneType, 'interrupt');
    assert.equal(fw.currentMinigame, interrupt);
    // The suspended parent's onComplete ran once (released through the child).
    assert.equal(parentOnComplete, 1);
    // The replacement it opened was cleaned up before the interrupt installed.
    assert.ok(replacementInstance, 'parent onComplete opened a replacement');
    assert.equal(replacementInstance.cleaned, true, 'the replacement was ended, not orphaned');
    assert.ok(log.includes('cleanup:parentReplacement'));
    assert.ok(log.includes('init:interrupt'));
});

test('a normal S12 child launch is unaffected (no stray teardown)', () => {
    const { fw, log } = freshManager();
    const parentParams = { suspended: true, onComplete() {} };
    fw.startMinigame('parent', null, parentParams);
    // Launching the child ends the suspended parent without its onComplete and
    // leaves the child running; nothing is cleaned up twice.
    fw.startMinigame('child', null, { returnTo: { sceneType: 'parent', params: {} } });
    assert.equal(fw.currentMinigame._sceneType, 'child');
    assert.equal(log.filter((l) => l === 'cleanup:child').length, 0);
    assert.equal(log.filter((l) => l === 'init:child').length, 1);
});
