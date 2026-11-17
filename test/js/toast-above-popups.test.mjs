// Toasts must stack above the full-screen workstation popups. #notification-container and
// #lab-popup were both z-index 2000, so DOM order put the lab sheet over every toast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = (f) => readFileSync(new URL(`../../public/break_escape/css/${f}`, import.meta.url), 'utf8');
const zOf = (src, sel) => {
  const m = src.match(new RegExp(`${sel.replace('#', '\\#')}\\s*\\{[^}]*?z-index:\\s*(\\d+)`));
  assert.ok(m, `no z-index for ${sel}`);
  return Number(m[1]);
};

test('toast container stacks above the laptop, lab and VM popups', () => {
  const toast = zOf(css('notifications.css'), '#notification-container');
  for (const sel of ['#laptop-popup', '#lab-popup']) assert.ok(toast > zOf(css('main.css'), sel), sel);
  const vm = [...css('hud.css').matchAll(/#vm-controls-overlay\s*\{[^}]*?z-index:\s*(\d+)/g)].map(m => Number(m[1]));
  assert.ok(vm.length > 0, 'no z-index for #vm-controls-overlay');
  for (const z of vm) assert.ok(toast > z, '#vm-controls-overlay');
});
