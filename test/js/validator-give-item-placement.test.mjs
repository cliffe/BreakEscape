// scripts/validate_scenario.rb give_item_placement_issues (DOCS_GAPS gap 24, 2026-10-22).
// An own-line ink tag attaches to the next line of text below it, so #give_item between two
// lines of text fires with the second: the README's "above the line it belongs to". The check
// warned on that too; now it warns only when no line of text follows the tag (a divert,
// choice, gather, brace or end of file next), where the tag fires late or not at all.
// Run with: node --test test/js/validator-give-item-placement.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

function warnedLines(ink) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      lines = JSON.parse(STDIN.read).map { |l| l + "\\n" }
      puts JSON.generate(give_item_placement_issues(lines, 'fx.ink'))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(ink.split('\n')), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    return issues.map(s => Number(s.match(/line (\d+)/)[1]));
}

const skip = ruby.status !== 0 && 'ruby not found';

test('a tag between two lines of text belongs to the second line: no warning', { skip }, () => {
    assert.deepEqual(warnedLines([
        '=== hand_over ===',
        "Mara: Recon's done, then.",
        '#give_item:key:soc_key',
        "Mara: Here's the SOC key.",
        '-> hub'
    ].join('\n')), []);
});

test('blank lines and other tags between the tag and the text are skipped', { skip }, () => {
    assert.deepEqual(warnedLines([
        'Mara: First line.',
        '',
        '#give_item:key:soc_key',
        '#complete_task:get_key',
        '',
        'Mara: Second line.'
    ].join('\n')), []);
});

test('a tag at the top of the knot, or after a choice or code, is not checked', { skip }, () => {
    assert.deepEqual(warnedLines([
        '=== hand_over ===',
        '#give_item:key:soc_key',
        "Mara: Here's the SOC key.",
        '~ key_offered = true',
        '#give_item:notes:memo',
        '-> hub'
    ].join('\n')), []);
});

test('a tag after the last line of text, before a divert, gather, brace or end, warns', { skip }, () => {
    assert.deepEqual(warnedLines([
        'Tom: That one is yours.',            // 1
        '#give_item:workstation:laptop',       // 2  divert next
        '#set_global:laptop_given:true',
        '-> hub',
        '{has_lockpick:',
        '    Here is a lockpick set.',
        '    #give_item:lockpick',             // 7  gather (- else:) next
        '- else:',
        '    You have one already.',
        '}',
        'Tom: Field note coming up.',
        '#give_item:notes:field_note',         // 12 choice next
        '* [Thanks] -> hub',
        'Tom: Last one.',
        '#give_item:notes:last'                // 15 end of file
    ].join('\n')), [2, 7, 12, 15]);
});
