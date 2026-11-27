// Ops S5bc unit 19: reads the real server answers that ops_privilege_scenario_test.rb recorded
// (PRIV_ANSWERS_RECORD=1) into test/fixtures/files/ops_privilege_answers.json. Read by answer
// name only: privilegeAnswer(name) is a deep copy of the body, privilegeStatus(name) its HTTP status.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'files', 'ops_privilege_answers.json');

function load() {
  return JSON.parse(readFileSync(PATH, 'utf8'));
}

function entry(name) {
  const all = load();
  if (!Object.prototype.hasOwnProperty.call(all, name)) throw new Error(`no recorded privilege answer named ${name}`);
  return all[name];
}

export function privilegeAnswerNames() {
  return Object.keys(load());
}

export function privilegeAnswer(name) {
  return structuredClone(entry(name).body);
}

export function privilegeStatus(name) {
  return entry(name).status;
}
