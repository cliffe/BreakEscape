// Every line a compiled ink story shows, with the #delivery: note person-chat would send
// for it, found by playing the story with inkjs the way the client does: InkEngine#continue
// (Continue() until a line has text, keeping the tags of the empty lines before it) and
// deliveryFromTags on the result's tags. Every choice path is explored (depth-bounded, each
// story state once). Prints JSON: [[line text, note or null], ...] (unique, sorted).
//
// Used by the Ruby parity test (tts_delivery_test.rb) to check that InkLineWalker gives
// each line the note the client sends (review R1 M2).
// Run with: node test/support/ink_delivery_lines.mjs <story.json> [name=value ...]
// Each name=value (value read as JSON) sets an ink variable before play, so a fixture's
// conditional lines can be played both ways.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const { deliveryFromTags } = await import(pathToFileURL(join(REPO, 'public/break_escape/js/systems/tts-delivery.js')).href);

const json = readFileSync(process.argv[2], 'utf8').replace(/^﻿/, '');
const story = new inkjs.Story(json);
for (const pair of process.argv.slice(3)) {
    const at = pair.indexOf('=');
    story.variablesState[pair.slice(0, at)] = JSON.parse(pair.slice(at + 1));
}
const found = new Map();
const seen = new Set();
const MAX_DEPTH = 12;

function explore(depth) {
    for (let guard = 0; guard < 200 && story.canContinue; guard++) {
        let text = '';
        let tags = [];
        while (story.canContinue) {
            const t = story.Continue();
            tags = tags.concat(story.currentTags || []);
            if (t.trim()) { text = t.trim(); break; }
        }
        if (text) {
            const note = deliveryFromTags(tags);
            found.set(JSON.stringify([text, note]), [text, note]);
        }
    }
    const choices = story.currentChoices.length;
    if (!choices || depth >= MAX_DEPTH) return;
    const saved = story.state.ToJson();
    if (seen.has(saved)) return;
    seen.add(saved);
    for (let i = 0; i < choices; i++) {
        story.state.LoadJson(saved);
        story.ChooseChoiceIndex(i);
        explore(depth + 1);
    }
}

explore(0);
console.log(JSON.stringify([...found.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))));
