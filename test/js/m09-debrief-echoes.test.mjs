// m09 closing debrief: echoes for the Lantern thanks, the old_coyote truth and the hatch bins (D165).
// Each new line plays only under its condition; the two-line archive cap and the KO line still hold.
// Run with: node test/js/m09-debrief-echoes.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const json = readFileSync(join(root, 'scenarios/m09_digital_archaeology/ink/m09_closing_debrief.json'), 'utf8').replace(/^﻿/, '');

function run(path, vars = {}) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(path);
    const lines = [];
    while (s.canContinue) lines.push(s.Continue().trim());
    return lines;
}

const THANKS = 'Director Magnus Netherton: You thanked her for her cracker. Good. Go on thanking her.';
const TOLD = "Director Magnus Netherton: Your night guard sat in his truck until it was over, as you told him. He went to his lineman's course this morning.";
const KO = 'Director Magnus Netherton: Your night guard wants to climb power lines for a living. He will. Not this week.';
const LETTERS = "Director Magnus Netherton: Teresa Villanueva left Butte before midnight with two of Arakawa's people. The letters did that.";
const DEREK = "Director Magnus Netherton: Mr Lawson's file is with Analysis. The letters went in the feed, and nobody has warned Teresa Villanueva.";
const CLOSER = 'Director Magnus Netherton: We take her at the briefing';

test('Lantern thanks: only warm with sleeper_named, and the closer stays last', () => {
    const l = run('spine', { sleeper_named: true, kowalczyk_reply: 'warm' });
    const i = l.indexOf(THANKS);
    assert.ok(i >= 0, 'plays');
    const c = l.findIndex((x) => x.startsWith(CLOSER));
    assert.ok(c === i + 1, 'closer directly after');
    assert.ok(!l.slice(c + 1).some((x) => x.startsWith('Director Magnus Netherton:')), 'closer is the last spoken line');
    for (const v of [{ sleeper_named: true, kowalczyk_reply: 'flat' }, { sleeper_named: true, kowalczyk_reply: '' },
        { sleeper_named: false, kowalczyk_reply: 'warm' },
        { sleeper_named: true, kowalczyk_reply: 'warm', recruiter_offer: 'double_crossed' }]) {
        assert.ok(!run('spine', v).includes(THANKS), JSON.stringify(v));
    }
});

test('old_coyote: told plays only when not knocked out; KO wins', () => {
    assert.ok(run('the_archive', { old_coyote_told: true }).includes(TOLD));
    assert.ok(!run('the_archive', { old_coyote_told: true, old_coyote_ko: true }).includes(TOLD));
    assert.ok(run('the_archive', { old_coyote_told: true, old_coyote_ko: true }).includes(KO));
    assert.ok(run('the_archive', { old_coyote_ko: true }).includes(KO));
    const none = run('the_archive', {});
    assert.ok(!none.includes(TOLD) && !none.includes(KO));
});

test('old_coyote: the two-line cap holds', () => {
    const spoken = (l) => l.filter((x) => x.startsWith('Director Magnus Netherton:') && !x.includes('Ask me what you need'));
    // Noor always speaks (1), so told is the second line.
    const alone = run('the_archive', { old_coyote_told: true });
    assert.ok(alone.includes(TOLD));
    assert.equal(spoken(alone).length, 2);
    // Sorensen + Noor fill the cap: told is dropped, as the KO line is.
    for (const v of [{ old_coyote_told: true, sorensen_fate: 'talked' }, { old_coyote_ko: true, sorensen_fate: 'talked' },
        { old_coyote_told: true, legacy_files_saved: true }]) {
        const l = run('the_archive', v);
        assert.ok(!l.includes(TOLD) && !l.includes(KO), JSON.stringify(v));
        assert.equal(spoken(l).length, 2);
    }
});

test('hatch bins: letters and derek_file arms, outside the cap', () => {
    assert.ok(run('the_archive', { cage_bin: 'letters' }).includes(LETTERS));
    assert.ok(!run('the_archive', { cage_bin: 'letters' }).includes(DEREK));
    assert.ok(run('the_archive', { cage_bin: 'derek_file' }).includes(DEREK));
    assert.ok(!run('the_archive', { cage_bin: 'derek_file' }).includes(LETTERS));
    assert.ok(!run('the_archive', { cage_bin: 'derek_file', m08_nightshade_tidied: true }).includes(DEREK));
    for (const v of ['', 'nightshade_copy']) {
        const l = run('the_archive', { cage_bin: v });
        assert.ok(!l.includes(LETTERS) && !l.includes(DEREK), v);
    }
    const full = run('the_archive', { cage_bin: 'letters', sorensen_fate: 'talked', legacy_files_saved: true });
    assert.ok(full.includes(LETTERS), 'plays even with the cap full');
});
