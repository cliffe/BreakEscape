// shell-x-check open wait: pure condition logic (the in-page sampler is proven live by the full run).
import assert from 'node:assert/strict';
import { unmetConditions, openTimeoutMessage, OPEN_TIMEOUT_MS } from '../../tools/playtest/shell-x-check.mjs';

const ready = { shell: true, visible: true, stable: true, noX: false, hitOk: true, hitHtml: '<button>' };
assert.ok(unmetConditions(ready).length === 0, 'a visible, stable shell with the X on top is ready');
assert.ok(unmetConditions({ shell: false }).length === 1, 'no shell is unmet');
assert.ok(/does not exist/.test(unmetConditions(null)[0]), 'null sample means no shell');
const covered = { ...ready, hitOk: false, hitHtml: '<div id="game-container"></div>' };
assert.ok(/X centre/.test(unmetConditions(covered).join()), 'game-container under the X is unmet');
assert.ok(unmetConditions({ ...ready, stable: false }).length === 1, 'moving rect is unmet');
assert.ok(unmetConditions({ ...ready, visible: false }).length === 1, 'hidden shell is unmet');
assert.ok(unmetConditions({ ...ready, noX: true, hitOk: false }).length === 0, 'a shell with no X skips the hit test');
const msg = openTimeoutMessage('bluetooth-scanner', covered, unmetConditions(covered));
assert.ok(msg.includes('bluetooth-scanner') && msg.includes('X centre') && msg.includes('id="game-container"'), 'message names the scene, the condition and the outerHTML');
assert.ok(OPEN_TIMEOUT_MS === 5000, 'timeout is about 5s');
console.log('playtest-shellx-open-wait ok');
