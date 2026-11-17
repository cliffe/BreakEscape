// Shared reader for the acknowledgedClues markers (SCENARIO_FORMAT_HARDENING_PLAN step 3).
// A marker is a top-level `acknowledgedClues` array in a scenario template. The key never ships
// (the server strips it in filtered_scenario_for_bootstrap), so the markers are read from the
// templates' raw text, not from a rendered payload. Each entry names a dated heading in
// docs/agents/VALIDATOR_DECISIONS.md whose one json block restates its lock, in and reason, the
// same sign-off discipline the known-failures and payload-scan-exception lists use.
//
// Not a test file (bin/test-js runs *.test.mjs only). validator-acknowledged-clues.test.mjs uses
// it; when build/hard-6a1 merges, its validator-known-failures.test.mjs can import
// acknowledgedApproved() as its third otherApproved list (6a-1 handover item 5).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The `acknowledgedClues` array in one template's raw text, parsed, or [] when there is none.
// Bracket-matches from the key's opening `[` to its close; the markers are plain JSON with no ERB.
export function markersInText(text) {
  const key = text.indexOf('"acknowledgedClues"');
  if (key < 0) return [];
  const open = text.indexOf('[', key);
  if (open < 0) return [];
  let depth = 0;
  let end = -1;
  let inStr = false;
  let esc = false;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth += 1;
    else if (ch === ']') { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return [];
  return JSON.parse(text.slice(open, end + 1));
}

// Every marker across the corpus: [{ scenario, index, entry }]. scenario is the template path
// relative to the repo root (the form a known-failures `scenario` field holds).
export function readAcknowledgedClues(root) {
  const dir = join(root, 'scenarios');
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name, 'scenario.json.erb');
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    if (!text.includes('"acknowledgedClues"')) continue;
    const markers = markersInText(text);
    markers.forEach((entry, index) => out.push({ scenario: `scenarios/${name}/scenario.json.erb`, index, entry }));
  }
  return out;
}

// [label, heading] pairs for the shared-heading rule (sharedHeadings in the decisions reader).
export function acknowledgedApproved(root) {
  return readAcknowledgedClues(root)
    .filter(({ entry }) => entry && typeof entry.approved === 'string')
    .map(({ scenario, index, entry }) => [`acknowledged clue ${index} (${scenario})`, entry.approved]);
}
