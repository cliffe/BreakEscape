// ops-model.js skin exports (Ops S6 unit 02): the lines Panels composed inline, as pure functions.
// Each is checked against the DOM the scene drew before the split (the saved `panels-before` files).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { fixtureNames, loadFixture, FIXTURE_DIR } from './support/network-view-harness.mjs';
import * as T from '../../public/break_escape/js/minigames/network-view/view-texts.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '../../public/break_escape/js/minigames/network-view/ops-model.js');
const M = await import(pathToFileURL(file));
const saved = (name) => new JSDOM(readFileSync(join(FIXTURE_DIR, 'panels-before', `${name}.html`), 'utf8')).window.document;
const rowsOf = (answer) => (answer.footholds || [answer]).flatMap(view => [...(view.hosts || []), ...(view.networks || []).flatMap(b => b.hosts || [])]);
const text = (el) => el.textContent.trim();

test('the module still imports nothing', () => {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /^\s*import\s/m);
});

test('findingLabel, needMark and needLine match every finding the scene drew', () => {
    let seen = 0;
    let needs = 0;
    for (const name of fixtureNames()) {
        const view = loadFixture(name);
        const doc = saved(name);
        for (const row of rowsOf(view)) {
            for (const f of row.findings || []) {
                const li = [...doc.querySelectorAll('li.network-finding')].find(e => e.getAttribute('data-finding') === f.alias);
                if (!li) continue;
                seen++;
                const head = `${text(li.querySelector('.network-finding-class'))} ${text(li.querySelector('.network-finding-severity'))}`;
                assert.equal(M.findingLabel(f), head, `${name} ${f.alias}`);
                const shown = [...li.querySelectorAll('.network-need')];
                const held = M.findingNeeds(f);
                assert.equal(shown.length, held.length, `${name} ${f.alias} needs`);
                held.forEach((n, i) => {
                    needs++;
                    assert.equal(text(shown[i].querySelector('.network-need-mark')), M.needMark(n));
                    assert.equal(text(shown[i].querySelector('.network-need-text')), M.needLine(n));
                });
            }
        }
    }
    assert.ok(seen >= 4, 'findings were compared');
    assert.ok(needs >= 1, 'needs were compared');
});

test('openWho matches the Open control of every held session the scene drew', () => {
    let seen = 0;
    for (const name of fixtureNames()) {
        const doc = saved(name);
        for (const row of rowsOf(loadFixture(name))) {
            const li = [...doc.querySelectorAll('li.network-row-host')].find(e => e.getAttribute('data-host-id') === row.id);
            const who = li?.querySelector('.network-row-who');
            if (!who || !row.session) continue;
            seen++;
            assert.equal(text(who), `(${M.openWho(row.session)})`, `${name} ${row.id}`);
        }
    }
    assert.ok(seen >= 1);
});

test('useResultText says what the scene says after a use', () => {
    const view = { hosts: [{ id: 'h1', host: 'files01', name: 'Files' }, { id: 'h2', name: 'Printer' }] };
    const session = { displayName: 'Ana', username: 'ana' };
    assert.equal(M.useResultText({ success: true, grant: 'credential' }, view, 'h1'), T.CREDENTIAL_GRANT_TEXT);
    assert.equal(M.useResultText({ success: true, grant: 'session', session }, view, 'h1'), T.sessionGrantText('files01', 'Ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session', session: { username: 'ana' } }, view, 'h1'), T.sessionGrantText('files01', 'ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session', session, already: true }, view, 'h1'), T.sessionGrantText('files01', 'Ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session', session }, view, 'h2'), T.sessionGrantText('Printer', 'Ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session', session }, view, 'h3'), T.sessionGrantText('h3', 'Ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session', session }, view), T.sessionGrantText('', 'Ana'));
    assert.equal(M.useResultText({ success: true, grant: 'session' }, view, 'h1'), T.sessionGrantText('files01', ''));
    assert.equal(M.sessionGrantLine('a', 'b'), T.sessionGrantText('a', 'b'));
    assert.equal(M.sessionGrantLine('', ''), T.sessionGrantText('', ''));
});

test('unplugNoticeText: the server\'s sentence, else the plain one', () => {
    assert.equal(M.unplugNoticeText({ message: 'Busy.' }), 'Busy.');
    assert.equal(M.unplugNoticeText(null), 'The port did not respond. Try again.');
    assert.equal(M.unplugNoticeText({ message: '' }), 'The port did not respond. Try again.');
});
