// The one source of server answers for S8c client tests: test/fixtures/files/lock_step/answers.json.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/files/lock_step/answers.json');
const all = JSON.parse(readFileSync(file, 'utf8'));

export const answerNames = Object.keys(all);

// A fresh deep copy of one entry: { route, status, body, varies, from? }
export function loadAnswer(name) {
    if (!Object.prototype.hasOwnProperty.call(all, name)) throw new Error(`no lock-step answer named ${name}`);
    return JSON.parse(JSON.stringify(all[name]));
}
