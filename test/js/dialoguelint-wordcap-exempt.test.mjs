// Word-cap exemption for lines that already have cached voice audio (dialoguelint.mjs,
// scripts/ink_runtime_check/wordcap_audio_exempt.json). Fixtures plus a shape check of the live list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { capFinding, lintInk, lintTexts, lintTargets, normalisedMd5, WORD_CAP_AUDIO_EXEMPT } = await import(join(root, 'scripts/ink_runtime_check/dialoguelint.mjs'));

const LONG = 'The quick brown fox jumps over the lazy dog while the cat watches from the fence and the farmer counts every single hen twice before supper time ends and the dusk comes down over the hills behind them.';
const list = [{ file: 'm/ink/x.ink', text_md5: normalisedMd5(LONG), start: 'the quick brown fox jumps over', reason: 'cached' }];

test('capFinding turns an over-cap line with cached audio into a warn, and only that line', () => {
    const f = { level: 'error', rule: 'line-len', line: 3, words: 31, cap: 30, text: LONG };
    const hit = capFinding(f, 'scenarios/m/ink/x.ink', list);
    assert.equal(hit.level, 'warn');
    assert.match(hit.note, /cached voice audio/);
    assert.equal(capFinding(f, 'scenarios/m/ink/other.ink', list).level, 'error');
    assert.equal(capFinding({ ...f, text: 'A different long line ' + LONG }, 'scenarios/m/ink/x.ink', list).level, 'error');
});

test('an edit to the tail of a listed line, or the same opening in a new line, is an error again', () => {
    const f = { level: 'error', rule: 'line-len', line: 3, words: 31, cap: 30, text: LONG };
    assert.equal(capFinding(f, 'scenarios/m/ink/x.ink', list).level, 'warn');
    assert.equal(capFinding({ ...f, text: LONG.replace(/hills behind them\.$/, 'hills behind us.') }, 'scenarios/m/ink/x.ink', list).level, 'error');
    assert.equal(capFinding({ ...f, text: LONG + ' And more.' }, 'scenarios/m/ink/x.ink', list).level, 'error');
    // punctuation and case do not matter (the TTS normalisation), words do
    assert.equal(capFinding({ ...f, text: LONG.toUpperCase().replace(/\./g, '!') }, 'scenarios/m/ink/x.ink', list).level, 'warn');
});

test('the file match is the whole path under the mission, not the basename', () => {
    const l = [{ file: 'm/scenario.json.erb', text_md5: normalisedMd5(LONG), start: 'x', reason: 'cached' }];
    const f = { level: 'error', rule: 'text-len', line: 3, words: 31, cap: 30, text: LONG };
    assert.equal(capFinding(f, '/abs/scenarios/m/scenario.json.erb', l).level, 'warn');
    assert.equal(capFinding(f, '/abs/scenarios/other/scenario.json.erb', l).level, 'error');
    assert.equal(capFinding(f, '/abs/scenarios/xm/scenario.json.erb', l).level, 'error');
});

test('lintInk keeps an unlisted over-cap line as an error', () => {
    const r = lintInk(`=== k ===\nGary: ${LONG}\n-> END\n`, { file: 'nolist.ink' });
    const f = r.findings.filter(x => x.rule === 'line-len');
    assert.equal(f.length, 1);
    assert.equal(f[0].level, 'error');
});

test('lintTexts takes the same exemption for timed texts', () => {
    const t = [{ line: 5, text: LONG }];
    assert.equal(lintTexts(t, 'zzz/scenario.json.erb').findings.find(x => x.rule === 'text-len').level, 'error');
});

test('the live exemption list is narrow and well formed', () => {
    assert.ok(WORD_CAP_AUDIO_EXEMPT.length > 0);
    for (const e of WORD_CAP_AUDIO_EXEMPT) {
        assert.match(e.file, /^[\w.-]+\/([\w.-]+\/)?[\w.-]+\.(ink|erb)$/, `entry file must be a path under scenarios/: ${e.file}`);
        assert.match(e.text_md5, /^[0-9a-f]{32}$/);
        assert.ok(e.start.split(' ').length >= 6, `start too short: ${e.start}`);
        assert.equal(e.start, e.start.toLowerCase().replace(/[^\w\s]/g, ''));
        assert.match(e.reason, /tts_cache\//);
    }
    const keys = WORD_CAP_AUDIO_EXEMPT.map(e => `${e.file}|${e.text_md5}`);
    assert.equal(new Set(keys).size, keys.length, 'duplicate entries');
});

test('every exemption still matches a live over-cap line (no stale entries)', () => {
    const dirs = readdirSync(join(root, 'scenarios')).filter(d => existsSync(join(root, 'scenarios', d, 'scenario.json.erb'))).map(d => join(root, 'scenarios', d));
    const rep = lintTargets(dirs);
    const seen = new Set();
    for (const x of [...rep.files, ...rep.texts]) for (const f of x.findings) {
        if (f.level === 'warn' && f.exemptMd5) seen.add(f.exemptMd5);
    }
    const stale = WORD_CAP_AUDIO_EXEMPT.filter(e => !seen.has(e.text_md5));
    assert.deepEqual(stale.map(e => `${e.file}: ${e.start}`), [], 'stale exemption entries: the line was changed or split, remove the entry');
});
