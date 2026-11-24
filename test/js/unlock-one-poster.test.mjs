// S8c unit 09: one poster. Nothing under JS/ posts to '/unlock' except api-client.js and
// lock-step.js (which posts through its injected `post`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } };
walk(js);

test('only api-client.js and lock-step.js name the /unlock route', () => {
    const allowed = new Set(['api-client.js', 'systems/lock-step.js']);
    const offenders = files.map((f) => relative(js, f)).filter((rel) => !allowed.has(rel))
        .filter((rel) => /['"`]\/unlock['"`?]/.test(readFileSync(join(js, rel), 'utf8')));
    assert.deepEqual(offenders, []);
});

test('api-client.js posts to /unlock in exactly one place', () => {
    const text = readFileSync(join(js, 'api-client.js'), 'utf8');
    assert.equal((text.match(/post\(\s*['"`]\/unlock['"`]/g) || []).length, 1);
});
