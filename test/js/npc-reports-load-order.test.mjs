// Access slice 9.2, review R1 m2 and R2 m4: the report queue and the reload's frustration must
// exist before the needs system's first tick. core/game.js imports npc-reports.js statically and
// installs it, then restores frustration, in the same task as installNpcNeeds(). No node test can
// load game.js (Phaser), so this reads its source: a move back to a dynamic import, or the
// restore after a .then or an await, fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'public/break_escape/js/core/game.js'), 'utf8');

test('npc-reports.js and npc-work.js are static imports, never dynamic ones', () => {
    assert.match(src, /^import \{ installNpcReports \} from '\.\.\/systems\/npc-reports\.js';/m);
    assert.match(src, /^import '\.\.\/systems\/npc-work\.js';/m);
    assert.doesNotMatch(src, /import\(\s*['"]\.\.\/systems\/npc-reports\.js['"]\s*\)/);
    assert.doesNotMatch(src, /import\(\s*['"]\.\.\/systems\/npc-work\.js['"]\s*\)/);
});

test('installNpcReports and restoreFrustration run after installNpcNeeds() with no .then or await between', () => {
    const install = src.indexOf('needs.installNpcNeeds();');
    assert.ok(install > 0, 'installNpcNeeds() call found');
    const reports = src.indexOf('installNpcReports(', install);
    const restore = src.indexOf('restoreFrustration?.(', install);
    assert.ok(reports > install && restore > reports, 'both follow the install, the queue first');
    const between = src.slice(install, restore);
    assert.doesNotMatch(between, /\.then\(|\bawait\b|setTimeout\(|queueMicrotask\(/, 'no task boundary between the install and the restore');
});
