// Report footholds panel and revealed credential address (engagement-report/report-model.js
// + pageOutcomeLine/footholdLine in the minigame). Run: node --test test/js/social-report-footholds.test.mjs
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-report-footholds-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/engagement-report/engagement-report-minigame.js',
    'minigames/engagement-report/report-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/captures.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const { buildReportModel } = await import(pathToFileURL(join(dir, 'minigames/engagement-report/report-model.js')));
const { pageOutcomeLine, footholdLine } =
    await import(pathToFileURL(join(dir, 'minigames/engagement-report/engagement-report-minigame.js')));

const social = (extra = {}, reveal = false, results) => ({
    landingPages: [{ id: 'p1', linkText: 'portal' }],
    engagement: { report: { ...(results ? { results } : {}), steps: [], items: [] } },
    ...(reveal ? { captures: { revealSecret: true } } : {}),
    ...extra
});
const victim = { visited: true, submitted: true };
const fh = { targetId: 'intern', roleLabel: 'Finance intern', kind: 'foothold', host: 'FIN-LT-07', note: 'ran an executable', at: 2 };
const cred = { targetId: 'cfo', roleLabel: 'CFO', kind: 'credential', address: 's.lord@ledgerwell.example', secret: 'hunter2', at: 1 };
const globals = (captures) => ({ se_landing_pages: { p1: { victim } }, ...(captures ? { se_captures: captures } : {}) });

test('foothold yields a role-labelled row with host and no name', () => {
    const m = buildReportModel(social(), globals({ intern: { ...fh, name: 'Sam Doe' } }), {});
    assert.equal(m.results.footholds.length, 1);
    const f = m.results.footholds[0];
    assert.equal(f.roleLabel, 'Finance intern');
    assert.equal(f.host, 'FIN-LT-07');
    assert.equal(footholdLine(f), 'Finance intern — foothold on FIN-LT-07 (ran an executable)');
    assert.ok(!JSON.stringify(m.results.footholds).includes('Sam'));
    assert.ok(m.panels.includes('footholds'));
});

test('no footholds -> empty list; credentials are not footholds', () => {
    assert.deepEqual(buildReportModel(social(), globals(), {}).results.footholds, []);
    assert.deepEqual(buildReportModel(social(), globals({ cfo: cred }), {}).results.footholds, []);
});

test('explicit results list without footholds excludes the panel', () => {
    const m = buildReportModel(social({}, false, ['mail', 'pages']), globals({ intern: fh }), {});
    assert.ok(!m.panels.includes('footholds'));
    const m2 = buildReportModel(social({}, false, ['footholds']), globals({ intern: fh }), {});
    assert.deepEqual(m2.panels, ['footholds']);
});

test('credential address appended only when revealSecret is true', () => {
    const g = globals({ cfo: cred });
    const off = buildReportModel(social(), g, {}).results.pages[0];
    assert.equal(off.captured, undefined);
    assert.ok(!pageOutcomeLine(off).includes('captured'));
    const on = buildReportModel(social({}, true), g, {}).results.pages[0];
    assert.equal(pageOutcomeLine(on), 'Visited: yes · Submitted: yes (simulated) · captured s.lord@ledgerwell.example');
    assert.ok(!pageOutcomeLine(on).includes('hunter2'));
});

test('pages panel identical to before with no captures, reveal on or off', () => {
    const expected = { pageId: 'p1', label: 'portal', sent: true, visited: true, submitted: true, noticed: false };
    for (const reveal of [false, true]) {
        const p = buildReportModel(social({}, reveal), globals(), {}).results.pages[0];
        assert.deepEqual(p, expected);
        assert.equal(pageOutcomeLine(p), 'Visited: yes · Submitted: yes (simulated)');
    }
});
