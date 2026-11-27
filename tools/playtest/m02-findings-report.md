# m02_ransomed_trust — investigation of run-3 Findings 2 and 3

Follow-up to `tools/playtest/m02-run3-report.md` (game 993, log `tools/playtest/m02-run3-session.jsonl`).

**Verification session:** `tools/playtest/m02-findings-session.jsonl`, game 994. This was a
targeted code-path probe, not a playthrough — `verify-run.rb 994` correctly reports
`BOOTSTRAP ONLY`. Nothing in this report claims a walkthrough step was played. Everything
below is either read from the run-3 log, read from source, or executed as a probe in the
live client, and each claim says which.

---

## Finding A — mission completion lags the terminal

**Verdict: real engine defect in `phone-chat-minigame.js`, not a harness artefact. Not fixed —
that file is on the do-not-touch list. Recommendation below.**

### Root cause (proved from source)

`public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js`, `handleChoice()`:

- Lines 751–798: the choice is made and the Ink story is advanced **all the way** to the next
  choice or to `DONE`, accumulating every line into `accumulatedMessages` and every tag into
  `accumulatedTags`. By line 798 the story is already finished; `#complete_task`,
  `#set_global:exposed_hospital`, `#set_global:mission_complete` and `#exit_conversation` are
  all sitting in `accumulatedTags`.
- Lines 800–811: those messages are then animated one at a time —
  `showTypingIndicator()` → `await delay(TYPING_DELAY_MS)` → per-character `addMessage()` →
  `await delay(INTER_MESSAGE_MS)`. `TYPING_DELAY_MS = 1000`, `INTER_MESSAGE_MS = 400`
  (lines 729–730).
- Line 825: **`processGameActionTags(accumulatedTags, this.ui)` runs only after that entire
  loop finishes.**

`do_upload` in `scenarios/m02_ransomed_trust/ink/m02_object_press_terminal.ink:129-159` emits
roughly 14 message lines and ~1300 characters, and puts all four tags at the very end. So the
fixed cost before `mission_complete` can be set is ~14 × 1400 ms ≈ 20 s of inter-message delay
plus the per-character typing of 1300 characters. The observed >35 s is exactly this, not a
race, not a poll artefact.

The same ordering exists in the non-choice path at lines 676–698.
`person-chat-minigame.js` does **not** have this shape — it calls `processGameActionTags` per
line as it goes (lines 965, 1235, 1376). The defect is specific to phone-chat.

### The part that makes it player-visible

Line 810, inside the animation loop:

```js
if (!this.isConversationActive) return;
```

If the conversation is closed while messages are still being typed, `handleChoice` returns
**before** line 825 — so no tag is ever processed. Meanwhile `saveStoryState()` already ran at
line 754, immediately after the choice, so the Ink story is persisted *past* `do_upload`.

Evidence from the run-3 log:

- seq 1712 (02:13:50): terminal still typing, cursor `█` visible mid-line, text length 1306.
- seq 1716 (02:14:21): still typing, length 1668. `TRANSMISSION COMPLETE.` is already on screen
  at this point — well before the last line.
- seq 1718: `{"exposed_hospital":false,"mission_complete":false}`.
- seq 1719–1720 (02:14:38): `mg close` — closed mid-animation.
- seq 1722: still `{"exposed_hospital":false,"mission_complete":false}`.
- seq 1731–1732 (02:16:02): `decide_hospital_exposure` still not in `completedTasks`.

That is the defect in one sequence: the player reads "TRANSMISSION COMPLETE", closes the
terminal, and the mission does not complete. A player who walks away at the words that say the
job is done gets a game stuck one tag short of its ending.

### The typewriter anomaly on reopen (partly unexplained)

seq 1735–1744: reopening the terminal produced a transcript in which the whole `[SENT]` block
appears a **second time**, after the "Forty-three other hospitals…" line — i.e. `do_upload`'s
output is duplicated in the visible transcript, and the second pass took another ~90 s to type
(seq 1736 at 02:16:31 → tags finally applied between seq 1752 at 02:17:52 and seq 1754 at
02:18:08, when `#exit_conversation` fired and the closing debrief `person-chat` opened by
itself). So the ending *does* recover on a reopen, at the cost of a duplicated transcript and
another full typeout.

I proved the duplication and the recovery from the log. I did **not** determine whether the
second pass re-executes the Ink knot or merely re-renders saved history — the state save at
line 754 argues for a re-render, the duplicated content argues for a replay, and I did not
reproduce it in a controlled way. Treat that specific mechanism as unresolved.

### Recommendation (not applied)

In `phone-chat-minigame.js`, move `processGameActionTags(accumulatedTags, this.ui)` to run
**before** the message-animation loop in both `handleChoice` (line 825 → before line 800) and
the continue path (line 698 → before line 676), keeping the `shouldExit` check after the
animation so the text still finishes on screen. The tags are fully known before the loop
starts, so this is a pure reordering; it makes state changes atomic with the choice and immune
to a mid-animation close.

Blast radius: this changes behaviour for every phone-chat conversation, m01 included (m01's
Agent 0x99 phone uses phone-chat). The change makes globals land *sooner* rather than never,
which should be strictly safer, but any m01 ink that relies on a `#set_global` landing *after*
its own text has been read would shift. I did not audit m01's phone ink for that, and per the
constraints I have not touched the file. Your call.

Separately, consider shortening `do_upload` or splitting its tags earlier in the knot — but
note that will **not** fix the mid-animation close, because tags are accumulated across the
whole continue-through regardless of where they sit in the knot. Only the engine reordering
fixes it.

---

## Finding B — item pickup fires no client event

**Verdict: an engine gap plus a scenario-authoring mismatch. Fixed scenario-side in
`m02_ransomed_trust` only; the engine gap is reported, not patched.**

### What the two items have in common

Both are declared `"type": "notes"` and both are targeted by an `eventPattern` written against
the item's **`id`**:

- `scenarios/m02_ransomed_trust/scenario.json.erb:1664` — `password_sticky_note`
  (`type: notes`, `readable: true`, has `text`)
- `scenarios/m02_ransomed_trust/scenario.json.erb:1983` — `offline_backup_encryption_keys`
  (`type: notes`, **no `readable`, no `text`**)

### Two independent defects (both proved from source)

**B1 — the engine emits `item_picked_up:<type>`, never `item_picked_up:<id>`.**
All three emit sites use the item's `type`:

- `public/break_escape/js/systems/interactions.js:1436`
- `public/break_escape/js/systems/inventory.js:563` (and `:640` for keys, always
  `item_picked_up:key`)
- `public/break_escape/js/minigames/container/container-minigame.js:496`

`npc-manager.js:459` subscribes with `this.eventDispatcher.on(eventPattern)` — literal name
matching. So every `eventPattern` written against an item id is dead on arrival.

Confirmed against the run-3 log: the only pickup events emitted in 1955 lines are
`item_picked_up:` `id_badge`, `key`, `lockpick`, `notepad`, `notes` (×6), `phone` — all type
names. `password_sticky_note` *did* fire, as `item_picked_up:notes`; its handler never matched.

This is not confined to m02. Across `scenarios/*/scenario.json*`, the id-shaped and therefore
dead patterns are: `offline_backup_encryption_keys` (×2, m02), `password_sticky_note` (m02),
`gary_vindication_email` (m02), `ghost_terminal_device` (m02), `contractor_lanyard` and
`bank_staff_lanyard` (m02 `key_id`s — keys only ever emit `item_picked_up:key`),
`personal_journal` and `medical_bills` (m05), `cyberchef_workstation` (m01/m03/m08),
`contingency_files` (m01), `entropy_launch_device`.

**B2 — a `notes`-type item with no `text` gets no pickup event and no `onPickup` at all.**
This is what made the offline keys different from the sticky note:

- `container-minigame.js:436-449` `isInteractiveItem()` requires `readable && text` for a notes
  item. The offline keys had neither, so it fell through to `takeItem()` (line 552 → 673).
- `takeItem()` calls `addToInventory()` (inventory.js), which POSTs the item to the server —
  **this is why the item is in the persisted inventory** — and then hits the guard at
  `inventory.js:475-478`:

  ```js
  // ... We skip the visual slot and the item_picked_up event here (interactions.js
  // already emitted it before opening the notes minigame).
  if (/^notes\d*$/.test(sprite.scenarioData?.type)) { return true; }
  ```

  That comment's assumption only holds for *readable* notes routed through interactions.js. A
  textless notes item taken straight from a container gets no UI slot, no event, and no
  `onPickup` processing.
- `onPickup.setVariable` is in fact never processed on any take path anywhere in the engine —
  grep for `onPickup` returns only three sites (interactions.js:1364, interactions.js:1417,
  container-minigame.js:477) and all three are *read* paths.

That resolves run 3's contradiction exactly: server POST happened (item persists), client
event and `onPickup` did not (`offline_keys_recovered` stayed false, inventory UI empty).

### Does it actually hurt a player? Yes, but it does not block the mission

`offline_keys_recovered` gates:

- `ink/m02_npc_sarah_kim.ink:222, 459`
- `ink/m02_npc_ward_nurse.ink:168, 314`
- `ink/m02_phone_agent0x99.ink:177, 181, 185, 698, 703`
- the HUD entry at `scenario.json.erb:168`
- Agent 0x99's guidance message at `scenario.json.erb:962`

All of those silently fail to appear. I checked
`public/break_escape/js/minigames/backup-recovery/backup-recovery-minigame.js:125-150`: the
recovery console's sources are unconditional and do **not** gate on
`offline_keys_recovered`, so the offline-keys ending route is still reachable. The loss is
dialogue and guidance, not solvability. Same for `password_sticky_note`:
`obtain_password_hints` has Gary's rapport route as a redundant path, which is why run 3 still
passed that step.

### What I fixed (m02 scenario only, no engine change)

In `scenarios/m02_ransomed_trust/scenario.json.erb`:

1. `offline_backup_encryption_keys` — added `"readable": true` and a short in-fiction `text`
   (key escrow manifest), and renamed `onPickup` → `onRead`. It now satisfies
   `isInteractiveItem()`, so the container routes it through `handleInteractiveItem` →
   `onRead.setVariable` → `offline_keys_recovered: true`, and it still reaches inventory.
2. `password_sticky_note` — added `"onRead": { "setVariable": { "password_hints_found": true } }`.
3. Added `"password_hints_found": false` to the `globalVariables` block.
4. Rewired the three dead handlers from `item_picked_up:<id>` onto
   `global_variable_changed:<var>` with `"condition": "value === true"` — the pattern already
   proven working in this scenario (`cover_restored`, `pin_cracker_found`, `ransom_decision_made`
   all fire this way, per run 3). Removed the now-redundant
   `setGlobal: { offline_keys_recovered: true }` from the handler that is triggered by that
   variable.

**Verification (executed, log `tools/playtest/m02-findings-session.jsonl`, game 994):**
`password_hints_found: false` is present in the fresh game's globals (the new declaration
renders). Driving each item's real `scenarioData` through `window.handleObjectInteraction`:

```
{"okr":true,"phf":false}   → ["global_variable_changed:offline_keys_recovered", "item_picked_up:notes", ...]
{"okr":true,"phf":true}    → [..., "global_variable_changed:password_hints_found", "item_picked_up:notes"]
```

Both globals now set and both emit the `global_variable_changed:` event the rewired handlers
subscribe to. **Proved by execution:** the room-level interaction path. **Read from source, not
executed:** that the container path reaches the same code — `container-minigame.js:477` applies
`item.onRead` and line 505+ delegates to `handleObjectInteraction`, so the safe route runs the
same handler with the same data. I did not walk to the safe.

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — schema
passes, no new warnings, dungeon graph regenerated.
`bin/rails test test/models/break_escape/ test/controllers/break_escape/` — 203 runs, 471
assertions, 0 failures.

m01 untouched.

### What I did not fix, and why

**The engine gap (B1/B2).** The obvious fix is to also emit `item_picked_up:<id>` when an id
exists and differs from the type, and to process `onPickup.setVariable` on the take path
(fixing the `inventory.js:475` early return so a textless notes item is not silently dropped).
I held off because it would newly wake m01's `item_picked_up:contingency_files` and
`item_picked_up:cyberchef_workstation` handlers, which have never fired in production — that is
a live behaviour change to a deployed mission, which the constraints put out of my hands.

If you want it, I'd suggest doing it as one change (id-based emit + `onPickup` on take), then
re-playtesting m01 specifically around Derek's filing cabinet and the CyberChef workstation,
since those two handlers would start firing. It would also fix the same dead patterns in m05
and m08 for free. Until then, every scenario should be written with `eventPattern`
`item_picked_up:<type>` or, better, `global_variable_changed:<var>` — the id form looks correct
and does nothing.
