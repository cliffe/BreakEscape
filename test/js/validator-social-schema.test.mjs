// scripts/scenario-schema.json: the closed `social` schema (MECHANICS_AUDIT packet M3).
// Every social block names the keys the engine or the validator reads, so a mistyped key or a
// wrong shape fails. The base fixture (test/js/fixtures/social_schema/base.json) is valid; each
// case mutates a copy of it. Schema errors under #/social are reported as "❌ SOCIAL: schema:"
// issues, fatal under --strict-social like the other social errors.
// Run with: bundle exec node --test test/js/validator-social-schema.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const base = JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_schema/base.json'), 'utf8'));
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const clone = () => structuredClone(base);
const first = (map) => map[Object.keys(map).find((k) => !k.startsWith('_'))];

// One case per block (at least one typo each), plus wrong shapes. Each mutates a clone of base;
// `path` must appear in the resulting schema error.
const CASES = [
  // typos: an unknown key in each block
  ['social: a mistyped block name', (s) => { s.mailClinet = {}; }, "'#/social'", 'mailClinet'],
  ['characters: mirrorToBehaviour', (s) => { first(s.characters).mirrorToBehaviour = true; }, '#/social/characters/', 'mirrorToBehaviour'],
  ['characters.influence: a typo', (s) => { first(s.characters).influence.strat = 0; }, '/influence', 'strat'],
  ['characters.thresholds[].effects[]: a typo', (s) => { first(s.characters).thresholds[0].effects.push({ type: 'toast', txt: 'x' }); }, '/effects/', 'txt'],
  ['influenceDisplay: bars', (s) => { s.influenceDisplay = { bars: true }; }, '#/social/influenceDisplay', 'bars'],
  ['people[]: froms', (s) => { s.people[0].froms = {}; }, '#/social/people/0', 'froms'],
  ['intelFacts: txt', (s) => { first(s.intelFacts).txt = 'x'; }, '#/social/intelFacts/', 'txt'],
  ['intelFacts.provides[]: a typo', (s) => { first(s.intelFacts).provides.push({ type: 'name', valeu: 'x' }); }, '/provides/', 'valeu'],
  ['conceptCards[]: titel', (s) => { s.conceptCards[0].titel = 'x'; }, '#/social/conceptCards/0', 'titel'],
  ['intelBoard: readinesSlots', (s) => { s.intelBoard.readinesSlots = {}; }, '#/social/intelBoard', 'readinesSlots'],
  ['intelBoard.readinessSlots: needIntel', (s) => { first(s.intelBoard.readinessSlots)[0].needIntel = []; }, '#/social/intelBoard/readinessSlots/', 'needIntel'],
  ['templates: slot', (s) => { first(s.templates).slot = []; }, '#/social/templates/', 'slot'],
  ['mailClient: checklistTimeing', (s) => { s.mailClient.checklistTimeing = 'onSend'; }, '#/social/mailClient', 'checklistTimeing'],
  ['mailClient.accounts[]: a typo', (s) => { s.mailClient.accounts[0].spoofFrom = true; }, '#/social/mailClient/accounts/0', 'spoofFrom'],
  ['mailClient.contacts[]: a typo', (s) => { s.mailClient.contacts[0].revealBy = 'x'; }, '#/social/mailClient/contacts/0', 'revealBy'],
  ['mailClient.seededMessages[]: a typo', (s) => { s.mailClient.seededMessages[0].subjet = 'x'; }, '#/social/mailClient/seededMessages/0', 'subjet'],
  ['phishTargets[]: hintsByFactr', (s) => { s.phishTargets[0].hintsByFactr = {}; }, '#/social/phishTargets/0', 'hintsByFactr'],
  ['phishTargets[].hintsByFactor: a factor typo', (s) => { s.phishTargets[0].hintsByFactor = { senderTrsut: 'x' }; }, '/hintsByFactor', 'senderTrsut'],
  ['phishTargets[].primedFor: a typo', (s) => { s.phishTargets[0].primedFor.trust = []; }, '/primedFor', 'trust'],
  ['triageSets[]: a typo', (s) => { s.triageSets[0].feedbackMod = 'end'; }, '#/social/triageSets/0', 'feedbackMod'],
  ['triageSets[].messages[]: truht', (s) => { s.triageSets[0].messages[0].truht = {}; }, '#/social/triageSets/0/messages/0', 'truht'],
  ['pretextNpcs[]: a typo', (s) => { s.pretextNpcs[0].charcter = 'x'; }, '#/social/pretextNpcs/0', 'charcter'],
  ['pretextNpcs[].knows: grde', (s) => { first(s.pretextNpcs[0].knows).grde = 'identity'; }, '#/social/pretextNpcs/0/knows/', 'grde'],
  ['pretextNpcs[].asks: a typo', (s) => { first(s.pretextNpcs[0].asks).grant = {}; }, '#/social/pretextNpcs/0/asks/', 'grant'],
  ['osint: a typo', (s) => { s.osint.site = []; }, '#/social/osint', 'site'],
  ['osint.sites[].pages[]: blcks', (s) => { s.osint.sites[0].pages[0].blcks = []; }, '#/social/osint/sites/0/pages/0', 'blcks'],
  ['osint.tools[].unlockedBy: a typo', (s) => { s.osint.tools[0].unlockedBy = { visted: 'x' }; }, '/unlockedBy', 'visted'],
  ['landingPages[]: a typo', (s) => { s.landingPages[0].linktext = 'x'; }, '#/social/landingPages/0', 'linktext'],
  ['landingPages[].brands[].domains[]: teir', (s) => { s.landingPages[0].brands[0].domains[0].teir = 1; }, '#/social/landingPages/0/brands/0/domains/0', 'teir'],
  ['engagement: a typo', (s) => { s.engagement.reprot = {}; }, '#/social/engagement', 'reprot'],
  ['engagement.report: labelby', (s) => { s.engagement.report.labelby = 'role'; }, '#/social/engagement/report', 'labelby'],
  ['engagement.defender.factMitigations[]: a typo', (s) => { s.engagement.defender.factMitigations[0].intell = 'x'; }, '/factMitigations/0', 'intell'],
  // wrong shapes and values
  ['mailClient.checklistTiming: an unknown value', (s) => { s.mailClient.checklistTiming = 'never'; }, '#/social/mailClient/checklistTiming', 'onSend, withReply'],
  ['engagement.report.labelBy: an unknown value', (s) => { s.engagement.report.labelBy = 'roles'; }, '#/social/engagement/report/labelBy', 'name, role'],
  ['characters.mirrorToBehavior: a string', (s) => { first(s.characters).mirrorToBehavior = 'yes'; }, '/mirrorToBehavior', 'boolean'],
  ['phishTargets[].hintsByFactor: not an object', (s) => { s.phishTargets[0].hintsByFactor = 'x'; }, '/hintsByFactor', 'object'],
  ['phishTargets[].hintsByFactor: an unknown variant', (s) => { s.phishTargets[0].hintsByFactor = { senderTrust: { spoof: 'a', owned: 'b' } }; }, '/hintsByFactor/senderTrust', 'owned'],
  ['phishTargets[].requiredFactors: an unknown factor', (s) => { s.phishTargets[0].requiredFactors = ['senderTrsut']; }, '/requiredFactors/0', 'senderTrust'],
  ['characters.influence.display: a non-boolean', (s) => { first(s.characters).influence.display = { bar: 'no' }; }, '/display/bar', 'boolean'],
  ['triageSets[].messages[].auth.spf: an unknown value', (s) => { s.triageSets[0].messages[0].auth = { spf: 'maybe', dkim: 'pass', dmarc: 'pass' }; }, '/auth/spf', 'pass, fail, none'],
  ['pretextNpcs[].lines.technique: an unknown technique', (s) => { first(s.pretextNpcs[0].lines).technique = 'flattery'; }, '/technique', 'urgency'],
  ['landingPages[].brands[].domains[].tier: out of range', (s) => { s.landingPages[0].brands[0].domains[0].tier = 7; }, '/tier', 'maximum'],
  ['intelFacts: a list instead of a map', (s) => { s.intelFacts = []; }, '#/social/intelFacts', 'object'],
  ['templates[].slots: three slots', (s) => { const t = first(s.templates); t.slots = [{ id: 'a', type: 'name' }, { id: 'b', type: 'name' }, { id: 'c', type: 'name' }]; }, '/slots', 'more items'],
];

// Runs the schema on several scenario objects in one Ruby process; returns the social issue
// strings (ValidateSocial.split_schema_errors) and the other schema errors per scenario.
function schemaRun(list) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    out = JSON.parse($stdin.read).map do |j|
      social, other = ValidateSocial.split_schema_errors(validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
      { social: social, other: other }
    end
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(list), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('the base fixture has every social block and passes the schema', { skip }, () => {
  assert.deepEqual(Object.keys(base.social).sort(), ['characters', 'conceptCards', 'engagement', 'influenceDisplay',
    'intelBoard', 'intelFacts', 'landingPages', 'mailClient', 'osint', 'people', 'phishTargets', 'pretextNpcs',
    'templates', 'triageSets']);
  const [r] = schemaRun([base]);
  assert.deepEqual(r, { social: [], other: [] });
});

test('a note key (leading underscore) is allowed in a closed block', { skip }, () => {
  const j = clone();
  j.social._comment = 'note';
  j.social.mailClient._comment = 'note';
  j.social.phishTargets[0]._note = 'note';
  first(j.social.characters)._comment = 'note';
  const [r] = schemaRun([j]);
  assert.deepEqual(r, { social: [], other: [] });
});

test('every block rejects a typo, and the late options reject a wrong shape', { skip }, () => {
  const scenarios = CASES.map(([, mutate]) => { const j = clone(); mutate(j.social); return j; });
  const results = schemaRun(scenarios);
  CASES.forEach(([name, , path, detail], i) => {
    const { social, other } = results[i];
    assert.deepEqual(other, [], `${name}: an error outside #/social\n${other.join('\n')}`);
    assert.ok(social.length >= 1, `${name}: no schema error`);
    assert.ok(social.every((e) => e.startsWith('❌ SOCIAL: schema: ')), `${name}: ${social.join('\n')}`);
    assert.ok(social.some((e) => e.includes(path) && e.includes(detail)),
      `${name}: no error naming ${path} and ${detail}\n${social.join('\n')}`);
    assert.ok(social.every((e) => !/ in schema [0-9a-f-]{36}/.test(e)), `${name}: the schema uuid tail was not stripped`);
  });
});

test('lockedHint: the room and item schemas take a non-empty string only', { skip }, () => {
  const ok = clone();
  ok.rooms.office.lockedHint = 'Ask Ruth.';
  ok.rooms.office.objects.push({ type: 'safe', name: 'Safe', lockedHint: 'The caretaker has it.' });
  const bad = clone();
  bad.rooms.office.lockedHint = 42;
  const blank = clone();
  blank.rooms.office.lockedHint = '';
  const [a, b, c] = schemaRun([ok, bad, blank]);
  assert.deepEqual(a.other.filter((e) => e.includes('lockedHint')), []);
  assert.ok(b.other.some((e) => e.includes("'#/rooms/office/lockedHint'") && e.includes('string')), b.other.join('\n'));
  assert.ok(c.other.some((e) => e.includes("'#/rooms/office/lockedHint'")), c.other.join('\n'));
});

test('the CLI: a social typo prints as a social error, and fails the run under --strict-social', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'social-schema-'));
  try {
    const j = clone();
    j.social.mailClient.checklistTimeing = 'onSend';
    const file = join(dir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify(j));
    writeFileSync(join(dir, 'mission.json'), JSON.stringify({ display_name: 'Schema fixture', description: 'Test only', difficulty_level: 1 }));
    const run = (...flags) => spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), file,
      '--no-graph', '--skip-ink', '--no-lint', ...flags], { encoding: 'utf8', env, cwd: root });
    const strict = run('--strict-social');
    assert.equal(strict.status, 1, strict.stdout + strict.stderr);
    assert.match(strict.stdout, /❌ SOCIAL: schema: The property '#\/social\/mailClient' contains additional properties \["checklistTimeing"\]/);
    assert.match(strict.stdout, /--strict-social: \d+ social lint error/);
    assert.match(strict.stdout, /✓ Schema validation passed!/); // nothing outside #/social failed
    const plain = run();
    assert.equal(plain.status, 0, plain.stdout + plain.stderr);
    assert.match(plain.stdout, /❌ SOCIAL: schema: .*checklistTimeing/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
