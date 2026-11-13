// playtest harness brief: openTasks matches the objectives panel, which hides locked tasks
// (public/break_escape/js/ui/objectives-panel.js). Run with: node --test test/js/playtest-brief-tasks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { briefTasks } = require('../../.claude/skills/playtest-scenario/scripts/brief-tasks.js');

const aims = [
  { status: 'active', tasks: [
    { id: 'talk_to_victoria', status: 'active' },
    { id: 'copy_badge', status: 'locked', optional: true },
    { id: 'leave_until_dark', status: 'locked' },
    { id: 'clone_card', status: 'completed' },
    { id: 'old_route', status: 'skipped' },
    { id: 'bonus_read', status: 'active', optional: true },
  ] },
  { status: 'locked', tasks: [{ id: 'submit_flag', status: 'active' }] },
  { status: 'completed', tasks: [{ id: 'arrive', status: 'completed' }] },
];

test('openTasks lists only tasks the panel shows as to do; locked ones go to lockedTasks', () => {
  assert.deepEqual(briefTasks(aims), {
    openTasks: ['talk_to_victoria', 'bonus_read (opt)'],
    lockedTasks: ['copy_badge (opt)', 'leave_until_dark'],
  });
});

test('lockedTasks is omitted when nothing is locked; empty input is safe', () => {
  assert.deepEqual(briefTasks([{ status: 'active', tasks: [{ id: 'a', status: 'active' }] }]), { openTasks: ['a'] });
  assert.deepEqual(briefTasks(undefined), { openTasks: [] });
});
