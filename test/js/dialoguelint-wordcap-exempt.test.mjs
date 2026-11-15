// Word-cap exemption for lines that already have cached voice audio (dialoguelint.mjs,
// scripts/ink_runtime_check/wordcap_audio_exempt.json). Fixtures plus a shape check of the live list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { capFinding, lintInk, lintTexts, WORD_CAP_AUDIO_EXEMPT } = await import(join(root, 'scripts/ink_runtime_check/dialoguelint.mjs'));

const LONG = 'The quick brown fox jumps over the lazy dog while the cat watches from the fence and the farmer counts every single hen twice before supper time ends and the dusk comes down over the hills behind them.';
const list = [{ file: 'x.ink', start: 'the quick brown fox jumps over', reason: 'cached' }];

test('capFinding turns an over-cap line with cached audio into a warn, and only that line', () => {
    const f = { level: 'error', rule: 'line-len', line: 3, words: 31, cap: 30, text: LONG };
    const hit = capFinding(f, 'scenarios/m/ink/x.ink', list);
    assert.equal(hit.level, 'warn');
    assert.match(hit.note, /cached voice audio/);
    assert.equal(capFinding(f, 'scenarios/m/ink/other.ink', list).level, 'error');
    assert.equal(capFinding({ ...f, text: 'A different long line ' + LONG }, 'x.ink', list).level, 'error');
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
        assert.match(e.file, /^[\w.-]+\.(ink|erb)$/);
        assert.ok(e.start.split(' ').length >= 6, `start too short: ${e.start}`);
        assert.equal(e.start, e.start.toLowerCase().replace(/[^\w\s]/g, ''));
        assert.match(e.reason, /tts_cache\//);
    }
    const keys = WORD_CAP_AUDIO_EXEMPT.map(e => `${e.file}|${e.start}`);
    assert.equal(new Set(keys).size, keys.length, 'duplicate entries');
});
