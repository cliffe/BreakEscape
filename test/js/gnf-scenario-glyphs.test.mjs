// q105 R1 m7: speech bubbles draw GNF from its bitmap sheet, and utils/pixel-text.js turns any
// character the sheet lacks (and has no plain letter or stand-in for) into "?". This walks every
// scenario's lines that reach a bubble (bark fields, the chatter pools, every lockedHint, event
// mapping messages that are not phone messages, and the ink knots named by exchanges, phone calls
// and event mappings) and fails on any such character, so an emoji in a bark is caught
// at commit time rather than seen as "?" in play.
// Run with: bin/test-js test/js/gnf-scenario-glyphs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const scenariosDir = join(root, 'scenarios');
const { pixelSafe } = await import(pathToFileURL(join(root, 'public/break_escape/js/utils/pixel-text.js')).href);

const xml = readFileSync(join(root, 'public/break_escape/assets/fonts/gnf-bitmap/gnf.xml'), 'utf8');
const CHARS = {};
for (const m of xml.matchAll(/<char id="(\d+)"/g)) CHARS[Number(m[1])] = { width: 1 };

const STRING = /"((?:[^"\\]|\\.)*)"/g;
const unjson = (s) => { try { return JSON.parse(`"${s}"`); } catch (e) { return s; } };

/** The text inside the balanced braces or brackets that open at `at`. */
function balanced(src, at) {
    const open = src[at], close = open === '{' ? '}' : ']';
    let depth = 0, inStr = false;
    for (let i = at; i < src.length; i++) {
        const c = src[i];
        if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
        if (c === '"') inStr = true;
        else if (c === open) depth++;
        else if (c === close && --depth === 0) return src.slice(at, i + 1);
    }
    return '';
}

/** Spoken lines of an ink knot: its body up to the next knot, less code, choices' brackets, tags and comments. */
function knotLines(ink, knot) {
    const m = ink.match(new RegExp(`^===\\s*${knot}\\s*===\\s*$`, 'm'));
    if (!m) return [];
    const rest = ink.slice(m.index + m[0].length);
    const end = rest.search(/^===/m);
    const body = end >= 0 ? rest.slice(0, end) : rest;
    const out = [];
    for (let line of body.split('\n')) {
        line = line.replace(/\/\/.*$/, '').trim();
        if (!line || /^(~|->|=|VAR|CONST|INCLUDE|EXTERNAL|TODO)/.test(line)) continue;
        line = line.replace(/^[*+\-\s]+/, '').replace(/#.*$/, '').replace(/\{[^}]*\}/g, '').replace(/->.*$/, '').replace(/[[\]]/g, '').trim();
        if (line) out.push(line);
    }
    return out;
}

function scenarioLines(dir) {
    const lines = [];
    const file = ['scenario.json.erb', 'scenario.json'].map(f => join(dir, f)).find(existsSync);
    if (!file) return lines;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/"bark"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) lines.push({ where: 'bark', text: unjson(m[1]) });
    for (const m of src.matchAll(/"chatter"\s*:\s*\{/g)) {
        const block = balanced(src, m.index + m[0].length - 1);
        for (const s of block.matchAll(STRING)) lines.push({ where: 'chatter', text: unjson(s[1]) });
    }
    // A lockedHint is said in the guard's bubble (npc-barks.js)
    for (const m of src.matchAll(/"lockedHint"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) lines.push({ where: 'lockedHint', text: unjson(m[1]) });
    // Knots that reach a bubble: any knot named in an exchanges, phoneCalls or eventMappings entry,
    // whatever its name (R2 m2: coffee_exchange), plus the exchange_ and call_ knots named anywhere
    const knots = new Set([...src.matchAll(/"knot"\s*:\s*"((?:exchange|call)_[A-Za-z0-9_]+)"/g)].map(m => m[1]));
    for (const m of src.matchAll(/"(exchanges|phoneCalls|eventMappings)"\s*:\s*\[/g)) {
        let block = balanced(src, m.index + m[0].length - 1);
        for (const k of block.matchAll(/"knot"\s*:\s*"([A-Za-z0-9_.]+)"/g)) knots.add(k[1]);
        if (m[1] !== 'eventMappings') continue;
        // An event mapping's message is shown as a bark (npc-manager.js: config.bark || config.message);
        // a sendTimedMessage's message goes to the phone, so leave those out
        for (let at; (at = block.search(/"sendTimedMessage"\s*:\s*\{/)) >= 0;) {
            const open = block.indexOf('{', at);
            block = block.slice(0, at) + block.slice(open + balanced(block, open).length);
        }
        for (const s of block.matchAll(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) lines.push({ where: 'mapping message', text: unjson(s[1]) });
    }
    const inkDir = join(dir, 'ink');
    if (knots.size && existsSync(inkDir)) {
        for (const f of readdirSync(inkDir).filter(f => f.endsWith('.ink'))) {
            const ink = readFileSync(join(inkDir, f), 'utf8');
            for (const k of knots) for (const t of knotLines(ink, k)) lines.push({ where: `${f} ${k}`, text: t });
        }
    }
    return lines;
}

test('every bark, chatter and exchange line in the scenarios draws in GNF without a "?" stand-in', () => {
    const bad = [];
    const count = { bark: 0, chatter: 0, ink: 0 };
    let checked = 0;
    const qs = (t) => t.split('?').length;
    for (const name of readdirSync(scenariosDir)) {
        const dir = join(scenariosDir, name);
        if (!statSync(dir).isDirectory()) continue;
        for (const { where, text } of scenarioLines(dir)) {
            checked++;
            count[where in count ? where : 'ink']++;
            if (qs(pixelSafe(text, CHARS)) > qs(text)) {
                const lost = [...new Set([...text].filter(ch => ch !== '\n' && pixelSafe(ch, CHARS) === '?' && ch !== '?'))];
                bad.push(`${name} (${where}): ${lost.join(' ')}`);
            }
        }
    }
    assert.ok(count.bark > 50 && count.chatter > 20 && count.ink > 5, `lines found ${JSON.stringify(count)}: the walk has stopped finding them`);
    assert.ok(checked > 100, `only ${checked} lines found: the walk has stopped finding them`);
    assert.deepEqual(bad, [], 'characters GNF lacks would show as "?" in a speech bubble');
});

test('the walk reaches knots by where they are named, lockedHints and mapping messages (R2 m2)', () => {
    const lines = scenarioLines(join(scenariosDir, 'lab_physical_pentest'));
    assert.ok(lines.some(l => / coffee_exchange$/.test(l.where)), 'coffee_exchange is an exchange knot without the exchange_ prefix');
    const all = readdirSync(scenariosDir).filter(n => statSync(join(scenariosDir, n)).isDirectory()).flatMap(n => scenarioLines(join(scenariosDir, n)));
    assert.ok(all.filter(l => l.where === 'lockedHint').length >= 5, 'lockedHints scanned');
    assert.ok(!all.some(l => l.where === 'mapping message' && /field note on request/i.test(l.text)), 'sendTimedMessage messages are phone messages, not bubbles');
});

test('the walk catches an emoji in a bark', () => {
    const text = 'Coffee time ☕';
    assert.ok(pixelSafe(text, CHARS).split('?').length > text.split('?').length);
    assert.equal(pixelSafe('Wiśniewski', CHARS), 'Wisniewski', 'a letter with a plain form is not a failure');
});
