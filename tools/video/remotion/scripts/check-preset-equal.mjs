#!/usr/bin/env node
// check-preset-equal.mjs <old-inline-edit.json> <edit-with-presets.json>: exits 0 when the resolved edit deep-equals the old inline one.
import fs from 'node:fs'; import { isDeepStrictEqual } from 'node:util';
import { loadEdit } from './load-edit.mjs';
const [oldFile, newFile] = process.argv.slice(2);
if (!oldFile || !newFile) { console.error('usage: check-preset-equal.mjs <old.json> <new.json>'); process.exit(2); }
const a = JSON.parse(fs.readFileSync(oldFile, 'utf8')), b = loadEdit(newFile);
const same = isDeepStrictEqual(a, b);
console.log(same ? `EQUAL: ${newFile} resolves to the old inline edit (${a.shots.length} shots, id ${a.id})` : 'DIFFERENT');
process.exit(same ? 0 : 1);
