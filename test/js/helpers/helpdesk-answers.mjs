// S8b unit 04: the one source of server answers for every client test of the helpdesk stage.
// answer(name) is a deep copy of { status, body }; answerWith(name, patch) changes ONLY the
// body paths the entry lists in `vary` (dotted keys, array positions as [0]) and throws on any
// other path. Run with a test that imports it; this file has no tests of its own.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'files', 'helpdesk_answer_shapes.json');
let cache = null;

export function loadShapes() {
  if (!cache) {
    const all = JSON.parse(readFileSync(FILE, 'utf8'));
    cache = Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith('_')));
  }
  return cache;
}

export function answerNames() {
  return Object.keys(loadShapes());
}

function entryFor(name) {
  const entry = loadShapes()[name];
  if (!entry) throw new Error(`no answer shape named ${name}`);
  return entry;
}

export function answer(name) {
  const { status, body } = entryFor(name);
  return structuredClone({ status, body });
}

export function varyPaths(name) {
  return [...(entryFor(name).vary || [])];
}

// patch: { 'body.code': '123456', ... }. Every key must be a vary path of the entry.
export function answerWith(name, patch) {
  const entry = entryFor(name);
  const out = answer(name);
  for (const [path, value] of Object.entries(patch || {})) {
    if (!(entry.vary || []).includes(path)) throw new Error(`${name}: ${path} is not a vary path`);
    setPath(out, path, value);
  }
  return out;
}

export function pathExists(root, path) {
  try {
    walk(root, path);
    return true;
  } catch {
    return false;
  }
}

function steps(path) {
  return path.split('.').flatMap((part) => {
    const m = /^([^[\]]*)((?:\[\d+\])*)$/.exec(part);
    if (!m) throw new Error(`bad path ${path}`);
    const out = m[1] ? [m[1]] : [];
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) out.push(Number(idx[1]));
    return out;
  });
}

function walk(root, path) {
  let at = root;
  for (const s of steps(path)) {
    if (at === null || typeof at !== 'object' || !(s in at)) throw new Error(`no ${path}`);
    at = at[s];
  }
  return at;
}

function setPath(root, path, value) {
  const list = steps(path);
  const last = list.pop();
  let at = root;
  for (const s of list) at = at[s];
  if (at === null || typeof at !== 'object' || !(last in at)) throw new Error(`no ${path}`);
  at[last] = value;
}
