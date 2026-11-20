/**
 * brief-tasks.js — the task lists in playtest-session.js's `brief` result.
 *
 * `openTasks` matches what the on-screen objectives panel shows as still to do
 * (public/break_escape/js/ui/objectives-panel.js skips locked tasks): tasks in
 * active or completed aims that are neither completed, locked nor skipped. A
 * completed aim can still hold an open optional task (the aim finishes on its
 * required tasks; the panel keeps listing the optional one, collapsed), and the
 * server record keeps it "active", so leaving such aims out made the brief and
 * the saved record disagree (m09 cross_reference_wren). Locked tasks in
 * active aims are hidden from the player; they're listed apart in
 * `lockedTasks` (omitted when empty) so a tester never reports one as visible.
 *
 * Kept apart from the session script so node tests can load it without
 * Playwright (test/js/playtest-brief-tasks.test.mjs).
 */

/** @param {Array<{status:string, tasks:Array<{id:string,status:string,optional?:boolean}>}>} aims */
function briefTasks(aims) {
  const label = t => `${t.id}${t.optional ? ' (opt)' : ''}`;
  const active = (aims || []).filter(a => a.status === 'active' || a.status === 'completed');
  const openTasks = active.flatMap(a => (a.tasks || [])
    .filter(t => !['completed', 'locked', 'skipped'].includes(t.status)).map(label));
  const lockedTasks = active.flatMap(a => (a.tasks || []).filter(t => t.status === 'locked').map(label));
  return lockedTasks.length ? { openTasks, lockedTasks } : { openTasks };
}

module.exports = { briefTasks };
