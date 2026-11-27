// Every test-bridge module must at least parse. main.js swallows a failed
// dynamic import of the bridge, so a syntax error there silently removes
// window.__test (commit f4a83f4af shipped one). Checks the files as written,
// so run it against the staged blobs too (git show :<path> | node --check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/test-bridge');
const scratch = mkdtempSync(join(tmpdir(), 'bridge-parse-'));

for (const f of readdirSync(dir).filter(n => n.endsWith('.js'))) {
    test(`test-bridge/${f} parses as an ES module`, () => {
        const copy = join(scratch, f.replace(/\.js$/, '.mjs'));
        writeFileSync(copy, readFileSync(join(dir, f), 'utf8'));
        const r = spawnSync(process.execPath, ['--check', copy], { encoding: 'utf8' });
        assert.equal(r.status, 0, r.stderr);
    });
}
