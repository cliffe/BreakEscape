// Shared reader for docs/agents/VALIDATOR_DECISIONS.md (SCENARIO_FORMAT_HARDENING_PLAN step 1).
// Each sign-off is a dated heading "## YYYY-MM-DD: <name>" with exactly one fenced json block under
// it restating the identifying fields of the one entry it approves. Three lists name these headings
// in their `approved` field: scripts/validator_known_failures.json (scenario, stage, match, count),
// acknowledgedClues markers (lock, in, reason, from step 3) and
// test/fixtures/files/payload_scan_exceptions.json (scenario, route, paths, from step 6a-1).
// Not a test file itself (bin/test-js runs *.test.mjs only).
import { readFileSync } from 'node:fs';

export const HEADING_RE = /^## (\d{4}-\d{2}-\d{2}): (.+)$/;

// Returns Map(headingText -> { date, jsonBlocks: [parsed or Error], line }).
// headingText is the text after "## ", the form an entry's `approved` field holds.
export function readDecisions(text) {
  const sections = new Map();
  let current = null;
  let inBlock = false;
  let fence = '';
  let buf = [];
  text.split('\n').forEach((line, i) => {
    if (inBlock) {
      if (line.trim() === '```') {
        inBlock = false;
        if (current && fence === 'json') {
          try {
            current.jsonBlocks.push(JSON.parse(buf.join('\n')));
          } catch (e) {
            current.jsonBlocks.push(e);
          }
        }
        buf = [];
      } else {
        buf.push(line);
      }
      return;
    }
    const open = line.match(/^```\s*(\w*)\s*$/);
    if (open) {
      inBlock = true;
      fence = open[1];
      return;
    }
    if (line.startsWith('## ')) {
      const m = line.match(HEADING_RE);
      const key = line.slice(3).trim();
      current = { date: m ? m[1] : null, dated: Boolean(m), jsonBlocks: [], line: i + 1 };
      if (sections.has(key)) current.duplicate = true;
      sections.set(key, current);
    } else if (line.startsWith('# ')) {
      current = null;
    }
  });
  return sections;
}

export function readDecisionsFile(path) {
  return readDecisions(readFileSync(path, 'utf8'));
}

// Problems with one entry's sign-off: [] when its heading exists, is dated, and holds exactly one
// json block whose `fields` equal the entry's.
export function signOffProblems(sections, entry, fields, label) {
  const problems = [];
  const heading = entry.approved;
  if (typeof heading !== 'string' || heading.trim() === '') return [`${label}: no 'approved' heading`];
  const section = sections.get(heading);
  if (!section) return [`${label}: heading '## ${heading}' is not in VALIDATOR_DECISIONS.md`];
  if (!section.dated) problems.push(`${label}: heading '## ${heading}' does not start with a date (YYYY-MM-DD: )`);
  if (section.duplicate) problems.push(`${label}: heading '## ${heading}' appears more than once`);
  if (section.jsonBlocks.length !== 1) {
    problems.push(`${label}: heading '## ${heading}' needs exactly one json block, found ${section.jsonBlocks.length}`);
    return problems;
  }
  const block = section.jsonBlocks[0];
  if (block instanceof Error) return [...problems, `${label}: the json block under '## ${heading}' does not parse: ${block.message}`];
  for (const f of fields) {
    if (JSON.stringify(block[f]) !== JSON.stringify(entry[f])) {
      problems.push(`${label}: '${f}' is ${JSON.stringify(entry[f])} but the json block under '## ${heading}' says ${JSON.stringify(block[f])}`);
    }
  }
  return problems;
}

// Headings named by more than one entry across all lists: [[heading, [labels]]].
export function sharedHeadings(labelled) {
  const by = new Map();
  for (const [label, heading] of labelled) {
    if (!by.has(heading)) by.set(heading, []);
    by.get(heading).push(label);
  }
  return [...by.entries()].filter(([, labels]) => labels.length > 1);
}
