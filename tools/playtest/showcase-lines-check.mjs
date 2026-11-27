#!/usr/bin/env node
// office_life_showcase: check every spoken line in PLAN section 7 against the scenario data and inks.
//
//   node tools/playtest/showcase-lines-check.mjs            (from the repo root or anywhere)
//
// Reads the plan tables (7a to 7d), the pool bullets (7e) and the per-NPC extras, then checks each
// line word for word against:
//   - ink lines (A, C, J, G, N, Z, X): the NPC's .ink source and its compiled .json
//   - barks (B): the speaker's eventMappings `bark` field in scenario.json.erb (rendered by the
//     validator's -o switch) and the erb source line
//   - pools (7e) and per-NPC extras (P): the scenario `chatter` and each NPC's own `chatter`
// and applies the caps in PLAN section 7: ink lines 30 words, choices 15 words, chatter and exchange
// lines 40 characters, barks 50 characters and 12 words. The plan table's own Chars and Words columns
// are also compared with the real counts. Exit 1 on any mismatch. The ink "unplanned lines" list at the
// end is information only. Text-only host lines are included.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'scenarios/office_life_showcase');
const planPath = join(dir, 'planning/PLAN.md');
const erbPath = join(dir, 'scenario.json.erb');
const rel = p => p.replace(root + '/', '');

// dialoguelint's word count, so the caps are measured the same way
const countWords = text => {
  const t = text.replace(/\*[^*]*\*/g, ' ').replace(/\s--\s|\s—\s/g, ' ').trim();
  return t ? t.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length : 0;
};

const fails = [];
const infos = [];
const fail = (where, msg) => fails.push(`${where}: ${msg}`);

// ---------- plan ----------
const plan = readFileSync(planPath, 'utf8').split('\n');
const s7 = plan.findIndex(l => l.startsWith('## 7. Spoken lines'));
const s8 = plan.findIndex(l => l.startsWith('## 8.'));
const sec = plan.slice(s7, s8);
const base = s7 + 1;
const rows = [];
let table = '';
sec.forEach((line, i) => {
  if (line.startsWith('### 7')) table = line.slice(4, 6);
  const m = line.match(/^\| ([A-Z]\d+) \|/);
  if (!m) return;
  const cells = line.split('|').slice(1, -1).map(c => c.trim());
  // text is the cell before the first purely numeric cell after the id
  const numIdx = cells.findIndex((c, k) => k > 1 && /^\d+$/.test(c));
  rows.push({ id: cells[0], table, planLine: base + i + 1, speaker: cells[1], text: cells[numIdx - 1],
    chars: Number(cells[numIdx]), words: /^\d+$/.test(cells[numIdx + 1] || '') ? Number(cells[numIdx + 1]) : null, cells });
});

// ---------- scenario ----------
const raw = execFileSync('ruby', [join(root, 'scripts/validate_scenario.rb'), erbPath, '-o'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const scenario = JSON.parse(raw.slice(raw.indexOf('\n{\n') + 1, raw.indexOf('\n}\n') + 2));
const erbLines = readFileSync(erbPath, 'utf8').split('\n');
const erbAt = text => {
  const hits = [];
  erbLines.forEach((l, i) => { if (l.includes(JSON.stringify(text).slice(1, -1))) hits.push(i + 1); });
  return hits;
};
const npcs = {};
const walk = o => {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') {
    if (o.id && o.npcType !== undefined || (o.id && (o.eventMappings || o.storyPath))) npcs[o.id] = o;
    Object.values(o).forEach(walk);
  }
};
walk(scenario.rooms);
const who = { Ama: 'ama_owusu', Chidi: 'chidi_okeke', Jun: 'jun_watanabe', Graham: 'graham_whitfield', Agnieszka: 'agnieszka_duda', Zainab: 'zainab_hussain' };
const full = { Graham: 'Graham Whitfield', Agnieszka: 'Agnieszka Duda' };

// ---------- inks ----------
const inks = {};
for (const id of Object.values(who)) {
  const src = join(dir, 'ink', id + '.ink');
  const cj = join(dir, 'ink', id + '.json');
  const strings = [];
  if (existsSync(cj)) {
    const walkJ = o => {
      if (typeof o === 'string') { if (o.startsWith('^')) strings.push(o.slice(1)); }
      else if (Array.isArray(o)) o.forEach(walkJ);
      else if (o && typeof o === 'object') Object.values(o).forEach(walkJ);
    };
    walkJ(JSON.parse(readFileSync(cj, 'utf8')));
  }
  inks[id] = { src, srcLines: existsSync(src) ? readFileSync(src, 'utf8').split('\n') : [], cj, compiled: strings };
}

const checkInkLine = (r, npcKey, isChoice) => {
  const ink = inks[npcKey];
  const prefix = r.table === '7c' ? `${full[r.speaker]}: ` : '';
  const want = prefix + r.text;
  // source: the text must be a whole spoken line (or the visible part of a choice)
  const hits = [];
  ink.srcLines.forEach((l, i) => {
    const t = l.trim();
    if (t === want || (r.table === '7c' && t.includes(want))) hits.push(i + 1);
  });
  if (!hits.length) fail(`${rel(ink.src)}`, `${r.id} (plan line ${r.planLine}) not found word for word: "${want}"`);
  else if (hits.length > 1) infos.push(`${r.id} appears on ${hits.length} source lines (${hits.join(', ')}) in ${rel(ink.src)}`);
  // compiled: a string equal to the text (compiled strings may carry a trailing space or newline marker)
  const ok = ink.compiled.some(s => s.replace(/\\n$/, '').trim() === want);
  if (!ok) fail(`${rel(ink.cj)}`, `${r.id} (plan line ${r.planLine}) not found word for word in the compiled json: "${want}"`);
  const w = countWords(r.text);
  if (w > 30) fail(`${rel(ink.src)}:${hits[0] || '?'}`, `${r.id} is ${w} words, over the 30 word cap`);
  if (r.table === '7c' && r.text.length > 40) fail(`${rel(ink.src)}:${hits[0] || '?'}`, `${r.id} is ${r.text.length} characters, over the 40 character exchange cap`);
};

const spokenBy = r => {
  if (r.table === '7a') return 'ama_owusu';
  if (r.table === '7b') return who[r.speaker];
  if (r.table === '7c') return 'graham_whitfield';
  return who[r.speaker];
};

let checked = 0;
for (const r of rows) {
  const npc = spokenBy(r);
  checked++;
  // plan self-consistency
  if (r.text.length !== r.chars) fail(`${rel(planPath)}:${r.planLine}`, `${r.id} table says ${r.chars} characters, text has ${r.text.length}`);
  if (r.words !== null && countWords(r.text) !== r.words) fail(`${rel(planPath)}:${r.planLine}`, `${r.id} table says ${r.words} words, text has ${countWords(r.text)}`);
  if (r.table === '7a' || r.table === '7b' || r.table === '7c') { checkInkLine(r, npc); continue; }
  if (r.table === '7d') {
    const n = npcs[npc];
    const marks = (n?.eventMappings || []).filter(m => m.bark === r.text);
    if (!marks.length) fail(`${rel(erbPath)}`, `${r.id} (plan line ${r.planLine}) no ${npc} eventMapping has bark "${r.text}"`);
    const at = erbAt(r.text);
    if (!at.length) fail(`${rel(erbPath)}`, `${r.id} text not found in the erb source`);
    if (r.text.length > 50) fail(`${rel(erbPath)}:${at[0] || '?'}`, `${r.id} is ${r.text.length} characters, over the 50 character bark cap`);
    if (countWords(r.text) > 12) fail(`${rel(erbPath)}:${at[0] || '?'}`, `${r.id} is ${countWords(r.text)} words, over the 12 word bark cap`);
    continue;
  }
  if (r.id.startsWith('P')) {
    const pool = r.cells[2];
    const n = npcs[npc];
    const arr = n?.chatter?.[pool] || [];
    if (!arr.includes(r.text)) fail(`${rel(erbPath)}`, `${r.id} (plan line ${r.planLine}) ${npc} chatter.${pool} lacks "${r.text}"`);
    if (r.text.length > 40) fail(`${rel(erbPath)}:${erbAt(r.text)[0] || '?'}`, `${r.id} is ${r.text.length} characters, over the 40 character chatter cap`);
  }
}

// ---------- 7e scenario pools ----------
const e0 = sec.findIndex(l => l.startsWith('### 7e'));
let poolLines = 0;
for (let i = e0; i < sec.length; i++) {
  const m = sec[i].match(/^- `(\w+)` \((\d+)\):(.*)$/);
  if (!m) continue;
  const [, name, count, rest] = m;
  const quoted = [...rest.matchAll(/"([^"]+)"/g)].map(x => x[1]);
  if (name === 'cake') {
    const have = scenario.chatter?.cake || [];
    if (have.length !== Number(count)) fail(`${rel(erbPath)}`, `pool cake: plan says ${count} lines, scenario has ${have.length}`);
    poolLines += have.length;
    have.forEach(t => { if (t.length > 40) fail(`${rel(erbPath)}:${erbAt(t)[0]}`, `cake line over 40 characters: "${t}"`); });
    continue;
  }
  const have = scenario.chatter?.[name] || [];
  if (quoted.length !== Number(count)) fail(`${rel(planPath)}:${base + i + 1}`, `pool ${name}: plan names ${count} lines but quotes ${quoted.length}`);
  quoted.forEach(t => {
    poolLines++;
    if (!have.includes(t)) fail(`${rel(erbPath)}`, `pool ${name} lacks "${t}" (plan line ${base + i + 1})`);
    if (t.length > 40) fail(`${rel(erbPath)}:${erbAt(t)[0] || '?'}`, `pool ${name} line over 40 characters: "${t}"`);
  });
  have.forEach(t => { if (!quoted.includes(t)) fail(`${rel(erbPath)}:${erbAt(t)[0] || '?'}`, `pool ${name} has a line the plan does not list: "${t}"`); });
}
// scenario pools the plan does not mention at all
for (const name of Object.keys(scenario.chatter || {})) {
  if (!sec.some(l => l.includes('`' + name + '`'))) fail(rel(erbPath), `scenario pool ${name} is not in plan 7e`);
}
// NPC extras the plan does not list
for (const [id, n] of Object.entries(npcs)) {
  for (const [pool, arr] of Object.entries(n.chatter || {})) {
    for (const t of arr) if (!rows.some(r => r.text === t)) fail(`${rel(erbPath)}:${erbAt(t)[0] || '?'}`, `${id} chatter.${pool} line not in plan 7: "${t}"`);
  }
  for (const m of n.eventMappings || []) {
    if (m.bark && !rows.some(r => r.table === '7d' && r.text === m.bark)) fail(`${rel(erbPath)}:${erbAt(m.bark)[0] || '?'}`, `${id} bark not in plan 7d: "${m.bark}"`);
  }
}

// ---------- ink lines the plan does not list (information) and choice caps ----------
const planTexts = new Set(rows.map(r => r.text));
const extras = [];
for (const [id, ink] of Object.entries(inks)) {
  ink.srcLines.forEach((l, i) => {
    const t = l.trim();
    if (!t || /^(\/\/|===|VAR|~|->|#|\{|\}|-\s*\(|INCLUDE|EXTERNAL)/.test(t)) return;
    const ch = t.match(/^[*+]\s*(?:\{[^}]*\}\s*)*\[(.*)\]/);
    if (ch) {
      if (countWords(ch[1]) > 15) fail(`${rel(ink.src)}:${i + 1}`, `choice over 15 words: "${ch[1]}"`);
      return;
    }
    if (/^[*+]/.test(t)) return;
    const plain = t.replace(/^(?:Graham Whitfield|Agnieszka Duda): /, '');
    if (!planTexts.has(plain) && !planTexts.has(t)) extras.push(`${rel(ink.src)}:${i + 1}: ${t}`);
    else if (countWords(plain) > 30) fail(`${rel(ink.src)}:${i + 1}`, `ink line over 30 words`);
  });
}

console.log(`Plan section 7 lines checked: ${checked} table rows (${rows.filter(r => r.table === '7a').length} Ama, ${rows.filter(r => r.table === '7b').length} staff, ${rows.filter(r => r.table === '7c').length} exchange, ${rows.filter(r => r.table === '7d').length} barks, ${rows.filter(r => r.id.startsWith('P')).length} extras) plus ${poolLines} scenario pool lines.`);
if (extras.length) { console.log(`\nInk lines the plan does not list (${extras.length}, information; includes narration-free logic text):`); extras.forEach(e => console.log('  ' + e)); }
infos.forEach(i => console.log('note: ' + i));
if (fails.length) { console.log(`\nFAIL: ${fails.length} mismatch(es)`); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('\nPASS: every plan line matches the data word for word, caps hold.');
