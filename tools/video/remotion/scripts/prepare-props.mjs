#!/usr/bin/env node
// prepare-props.mjs <edit.json> <aspect> <out.json>: bundles the edit plus which synced takes exist into Remotion input props.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const [editFile, aspect, out] = process.argv.slice(2);
const edit = JSON.parse(fs.readFileSync(editFile, 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(here, '../public/manifest.json'), 'utf8'));
const available = {}; for (const k of Object.keys(man.takes)) available[`takes/${k}`] = true;
  for (const k of Object.keys(man.clips || {})) available[`clips/${k}`] = true;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ edit, aspect, available }));
