// m05 blind finding #2: the Compare step can show 2 to 4 reference cards when the object sets
// fingerprintCandidateCount (m05's Torres mug asks for 4), whatever its difficulty gives.
// Run with: node test/js/dusting-candidate-count.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-count-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const mod = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { generatePrint } = await import(pathToFileURL(join(root, 'js/minigames/dusting/fingerprint-generator.js')).href);
const { patternForOwner } = await import(pathToFileURL(join(root, 'js/minigames/dusting/fingerprint-generator.js')).href);
const { DIFFICULTY } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
const Game = mod.DustingMinigame;

const build = (data, level = 'easy') => {
    const g = Object.create(Game.prototype);
    Object.assign(g, {
        data, objectId: 'mug', owner: 'David Torres', ownerName: 'David Torres', diff: DIFFICULTY[level],
        print: generatePrint({ owner: 'David Torres', pattern: 'whorl', variant: 'panel' })
    });
    g._buildCandidates();
    return g;
};
const names = ['Lisa Park', 'Owen Gallagher', 'Patricia Morgan', 'Dr Ruth Halloran'];

test('easy gives two cards by default', () => {
    assert.equal(build({ fingerprintCandidates: names }).candidates.length, 2);
});

test('fingerprintCandidateCount 4 gives four cards, one correct, owner among them', () => {
    const g = build({ fingerprintCandidates: names, fingerprintCandidateCount: 4 });
    assert.equal(g.candidates.length, 4);
    assert.equal(g.candidates.filter(c => c.correct).length, 1);
    assert.equal(g.candidates[g.correctIndex].label, 'David Torres');
    assert.equal(new Set(g.candidates.map(c => c.label)).size, 4);
    // easy: no decoy shares the lift's pattern class
    for (const c of g.candidates) if (!c.correct) assert.notEqual(c.pattern, 'whorl');
});

test('out-of-range counts are ignored', () => {
    assert.equal(build({ fingerprintCandidates: names, fingerprintCandidateCount: 9 }).candidates.length, 2);
    assert.equal(build({ fingerprintCandidates: names, fingerprintCandidateCount: 1 }).candidates.length, 2);
});

// The real m05 mug data, read from the scenario file (ERB tags stripped; the field sits in plain JSON).
const mug = (() => {
    const src = readFileSync(join(here, '../../scenarios/m05_insider_trading/scenario.json.erb'), 'utf8');
    const at = src.indexOf('"id": "torres_mug"');
    const from = src.lastIndexOf('{', at);
    let depth = 0, end = from;
    for (let i = from; i < src.length; i++) { if (src[i] === '{') depth++; if (src[i] === '}' && --depth === 0) { end = i; break; } }
    return JSON.parse(src.slice(from, end + 1));
})();
const buildMug = () => {
    const g = Object.create(Game.prototype);
    Object.assign(g, {
        data: mug, objectId: mug.id, owner: mug.fingerprintOwner, ownerName: mug.fingerprintOwner, diff: DIFFICULTY[mug.fingerprintDifficulty],
        print: generatePrint({ owner: mug.fingerprintOwner, pattern: patternForOwner(mug.fingerprintOwner), variant: 'panel' })
    });
    g._buildCandidates();
    return g;
};

test('the real mug builds the same four cards every time, with the owner correct', () => {
    const a = buildMug(), b = buildMug();
    assert.equal(a.candidates.length, 4);
    assert.deepEqual(a.candidates.map(c => [c.label, c.pattern, c.correct]), b.candidates.map(c => [c.label, c.pattern, c.correct]));
    assert.equal(a.candidates.filter(c => c.correct).length, 1);
    assert.equal(a.candidates[a.correctIndex].label, 'David Torres');
});

test('the real mug has a forced decoy in the lift class, so class alone is not enough', () => {
    const g = buildMug();
    const lift = g.print.pattern;
    const same = g.candidates.filter(c => !c.correct && c.pattern === lift);
    assert.equal(same.length, 1);
    assert.equal(same[0].label, 'Owen Gallagher');
    // fair: it still differs from the lift in a feature, so the minutiae step rejects it with a reason
    const g2 = buildMug();
    g2._renderPanel = () => {}; g2._drawCard = () => {}; g2.announce = () => {}; g2.viewing = null;
    const i = g2.candidates.findIndex(c => c.label === 'Owen Gallagher');
    g2._chooseRef(i);
    assert.equal(g2.candidates[i].rejected, true);
    assert.ok(g2.message && g2.message.length > 0);
    assert.notEqual(g2.identified, true);
});

test('key 4 picks the fourth card in the Compare step', () => {
    const g = buildMug();
    const picked = [];
    g._chooseRef = i => picked.push(i);
    Object.assign(g, { gameState: { isActive: true }, step: 'compare', patternOk: true, identified: false });
    const press = key => g._onKeyDown({ key, target: { tagName: 'DIV' }, preventDefault() {} });
    press('4'); press('5'); press('1');
    assert.deepEqual(picked, [3, 0]);
    // with two cards, 3 is out of range
    const h = build({ fingerprintCandidates: names });
    const got = [];
    h._chooseRef = i => got.push(i);
    Object.assign(h, { gameState: { isActive: true }, step: 'compare', patternOk: true, identified: false });
    h._onKeyDown({ key: '3', target: { tagName: 'DIV' }, preventDefault() {} });
    assert.deepEqual(got, []);
});

test('medium: a forced arch card does not displace the same-class decoy', () => {
    const data = { fingerprintCandidates: ['Lisa Park', { name: 'Owen Gallagher', pattern: 'arch' }, 'Patricia Morgan', 'Dr Ruth Halloran'], fingerprintCandidateCount: 4 };
    const g = build(data, 'medium');
    const decoys = g.candidates.filter(c => !c.correct);
    assert.equal(decoys.length, 3);
    assert.equal(decoys.find(c => c.label === 'Owen Gallagher').pattern, 'arch');
    assert.equal(decoys.filter(c => c.pattern === 'whorl').length, 1);
    // a forced lift-class card is itself the same-class decoy, so no second one is dealt
    const h = build({ ...data, fingerprintCandidates: [{ name: 'Owen Gallagher', pattern: 'whorl' }, ...names.filter(n => n !== 'Owen Gallagher')] }, 'medium');
    assert.equal(h.candidates.filter(c => !c.correct && c.pattern === 'whorl').length, 1);
    // hard: every non-forced decoy shares the class
    const k = build(data, 'hard');
    assert.equal(k.candidates.filter(c => !c.correct && c.pattern === 'whorl').length, 2);
});
