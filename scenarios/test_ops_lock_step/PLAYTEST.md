# test_ops_lock_step: scripted playtest (a second step on any lock, S8c, feature A25)

Feature scenario for the second step on a lock. One fresh game for beats 1 to 12, about 40 minutes. Each beat is one click-level step per line, then what the browser shows and what the server record says. Judge each beat by the server record (the ops log terminal rows, `verify-run.rb --ops-log`), not by a client event.

The scenario is for testing, not play: no sign names a password, PIN, code or number. First factors are on the notes in the Office; the six digits and the two-digit number are only ever read off the screen, never computed. No beat sends a hand-built request (those checks are Rails tests).

**Things that hold all through the run.**
- The second-step pane opens by itself over the lock pad (or alone over a door) when the first factor is right. Never click a button to open it. Its X closes only the pane: no reject sound, no line. The pad beneath closes itself about 2 seconds later, as a cancel with no message; click the lock again to start over.
- A reload puts the player at the start point in the Office (inventory and the server's record of a pending step are kept; no pane reopens by itself, click the lock again). A pending step is dropped after five minutes, so do not leave one pending longer.
- "Send again" is greyed for 2 seconds after each request (the server's gap), then works. Moira approves the third request (patience 3): on that request the pane closes at once, so the count never shows 3.
- A denial or an expiry (a wrong number, Deny, a step that ran out) shows one toast, "Not approved." (type error, no title), with the reject tone once, and opens nothing. The player's own X shows neither.
- The pane names the owner by the NPC's display name ("Moira Hale", "Gordon Pike", "Priya Nair") and falls back to the id (`moira`) when the NPC is not loaded. The title is the lock's name (the object's name, or a door's sign). Every line below is what the pane's `getTestState()` and the push part show.

**Known blocker found by the unit 27 tests (not yet fixed when this was written).** The game's click path calls `handleUnlock(sprite, 'item')` for every object lock, so the pad posts `targetType: "item"`. The server's gate answers only for `"object"` or `"door"`, so a gated object answers 422 "Invalid attempt" (no pane) in a real game, and every object beat below (2 to 10, 13) fails at its first step until the server accepts `item` as `object` (or the client sends `object`). The two door beats (11, 12) are not affected. Check this first: if the pad shows its ordinary wrong-code line for a right first factor, this is why.

## Scripted tester: the `__test.lockStep` bridge

`window.__test.lockStep` reads and drives only the pane, by real clicks and key events on its own controls (JSON in and out):

- `__test.lockStep.state()` returns `{ open, kind, title, lines, fields, controls, text }`: `kind` is `push`, `push_number_match` or `code`; `controls` is `[{ label, disabled }]` in order (the X is `"X"`); `text` is everything the pane shows, run together. With no pane open it returns `{ open: false }`. `lines` holds only the code pane's own lines; for a push the status, the number, the count and the card are in `text`.
- `__test.lockStep.click(label)` clicks the button with that label (exact, ignoring case and spacing; the X also answers to `"close"`); it throws when there is none or it is disabled.
- `await __test.lockStep.type(text, { enter })` types into the code field one key at a time; `enter: true` then presses Enter in the field.
- `__test.lockStep.close()` clicks the X.

"Send again" is greyed for 2 seconds, so wait for it first:
`await __test.waitUntil(() => { const b = __test.lockStep.state().controls?.find(c => c.label === 'Send again'); return !!b && !b.disabled; })`.
The pads, the chat and the world are driven with the other bridge calls (`__test.interact`, `__test.minigame.*`, `__test.openInventoryItem`); a pad's field index comes from `__test.minigame.getState().controls`.

## The places and the people (ids for the tester)

| Where | Id | Name on screen | Lock | Step kind | Owner | Owner's device |
|---|---|---|---|---|---|---|
| Office, object | `moira_pc` | Moira's PC | password (note: Records PC login) | push | moira | none needed: she approves the third request |
| in `moira_pc` | `audit_zip` | quarterly_export.zip | password (note: Archive password) | push_number_match | gordon | Gordon's phone (borrow from Gordon) |
| Office, object | `moira_locker` | Staff locker | pin (note: Staff locker code) | push | moira | none needed |
| Office, object | `priya_safe` | Wall safe | pin (note: Wall safe code) | code | priya | Priya's code device (borrow from Priya) |
| Office, object | `dana_cabinet` | Finance cabinet | password (note: Finance cabinet password) | push_number_match | dana | none: this one never passes (Dana's phone cannot be got, she cannot be knocked out) |
| Door north | `records_room` | Records room | rfid, card `records_card` ("Spare card", on the Office floor) | push | moira | none needed |
| Door east | `plant_room` | Plant room | key (no key in the scenario); Gordon opens it | push | moira | none needed |
| Carried by Gordon | `gordon_briefcase` | Gordon's briefcase | pin (note: Briefcase code), droppable | push | gordon | Gordon's phone; he never approves, so only the borrowed phone passes it |
| Office, object | `courier_box` | Courier box | none (`locked: false`) | none | none | removes the briefcase by id |
| Office, object | `audit_log_pc` | Audit log terminal | none | none | none | reads the ops log |

People: `moira` Moira Hale (low awareness, approves when pestered, keeps her phone, nothing to borrow), `gordon` Gordon Pike (high awareness; his chat hands over his phone, the briefcase and the plant room door as three separate lines), `priya` Priya Nair (her chat hands over her code device), `dana` Dana Reeve (high awareness, cannot be knocked out, will not lend her phone).
Items: `records_card` (take it from the floor), `gordon_phone`, `gordon_briefcase` (from Gordon), `priya_device` (from Priya), `dana_phone` (never obtainable), `board_minutes` (inside the briefcase).

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3001, :3002, :3085 or :3086). The scenario has no Mission row until it is seeded, so make the game with the swap script on a host scenario, as `test_ops_mfa` does:

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3011 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_lock_step   # prints GAME_ID=
```

Then start the session and bootstrap as in `scenarios/test_ops_mfa/PLAYTEST.md` (decline the tutorial, new game).

## Beats

Every "See" line is what the code puts on screen. `S()` below is `__test.lockStep.state()`.

### 1. Wrong first factor
1. Click "Moira's PC" in the Office.
2. In the password pad type `wrong`, press Enter (`__test.minigame.type(<field index>, 'wrong', { submit: true })`).
- See: the pad's own line "Incorrect password. 4 attempts remaining." and the reject tone. No pane (`S()` is `{ open: false }`).
- Server: no `mfa_challenge` row.

### 2. Pane (push over a password pad)
1. Click "Note: Records PC login" and read it, close it.
2. Click "Moira's PC", type the password from that note, press Enter.
- See: a pane opens over the pad. `S()`: `open: true`, `kind: "push"`, `title: "Moira's PC"`, `controls: [X, "Send again" (disabled)]`, and `text` containing "A request was sent to Moira Hale's phone." and "Requests sent: 1". No "Check ... phone" button (the player holds no phone of hers). No toast. Nothing inside the PC is listed.
- Server: one `mfa_challenge` and one `mfa_prompt_sent` row.
- Bridge: `S()` (check `kind`, `title`, `text`).

### 3. Pestered owner (push, owner approves by habit)
1. Wait for "Send again" to enable (2 seconds), click it. See "Requests sent: 2".
2. Wait again, click "Send again" once more.
- See: the third request is approved at once: the pane closes (the count never shows 3), the pad shows "Password accepted! Access granted.", then a toast "Correct password! The item is now unlocked." (title "Password Accepted"), then the PC opens listing "Records note" and "quarterly_export.zip".
- Server: `mfa_prompt_approved` (approver `owner`).
- Bridge: `__test.lockStep.click('Send again')` twice, each after the wait above; then `S().open` is `false`.

### 4. Number lock with no phone
1. Click "Note: Archive password" and read it, close it.
2. Click "quarterly_export.zip" in the open PC, type its password, press Enter.
- See: `S()`: `kind: "push_number_match"`, `title: "quarterly_export.zip"`, `text` with "A request was sent to Gordon Pike's phone.", "Number: NN" (two digits) and "Requests sent: 1"; `controls`: X and "Send again" only (no "Check Gordon Pike's phone": the player holds no phone of his).
3. Click the pane's X.
- See: no reject sound, no toast. About 2 seconds later the pad closes itself, with no message.
- Bridge: `__test.lockStep.close()`.

### 5. Reload
1. Reload the page.
2. Click "Moira's PC" (it is still open, no password), click "quarterly_export.zip", type the password, press Enter.
- See: the pane with the same "Number: NN" as beat 4, and "Requests sent: 2" (the new request on the same record; if you reopen within 2 seconds of the last one the pane says "Wait a moment before sending another request." and counts from the next request).

### 6. Wrong number (number match, held phone)
1. Click the pane's X (`__test.lockStep.close()`).
2. Click "Gordon Pike", choose "Could I borrow your phone for a minute?". The inventory shows "Gordon's phone". End the chat ("Nothing, thanks.").
3. Click "Moira's PC", "quarterly_export.zip", type the password, press Enter.
4. In the pane click "Check Gordon Pike's phone" (`__test.lockStep.click("Check Gordon Pike's phone")`).
- See: a card named "quarterly_export.zip" with three number buttons in ascending order (for example "31", "47", "82") and "Deny". `S().controls` now ends `..., "31", "47", "82", "Deny"`.
5. Click a number that is not the one the pane shows (`__test.lockStep.click('31')` when the pane shows 47).
- See: the toast "Not approved." once with the reject tone; the pane closes; the pad closes itself about 2 seconds later; the archive is still shut. The pad shows no wrong-password line.

### 7. Right number
1. Click "quarterly_export.zip", type the password, press Enter, click "Check Gordon Pike's phone" (a new pane, a new request).
2. Click the number the pane shows (read it from `S().text`, "Number: NN"; then `__test.lockStep.click('NN')`).
- See: the pane closes; the pad shows "Password accepted! Access granted." and the toast "Correct password! The item is now unlocked."; the archive lists "export_summary.txt".

### 8. Code (code device, over a PIN pad)
1. Click "Priya Nair", choose "Could I borrow your code device?". The inventory shows "Code device". End the chat.
2. Click "Note: Wall safe code", read it, close it.
3. Click "Wall safe", type the PIN, press Enter.
- See: `S()`: `kind: "code"`, `title: "Wall safe"`, `lines: ["Enter the code from Priya Nair's device."]`, a field `lock-step-code` (6 digits, label "Code:"), `controls`: X, "Read code", "Verify".
4. Click "Read code": the strip shows six digits and "(60s left)" (counting down) and the button now reads "Use this code". Click "Use this code" (it fills the field, it does not submit). Click "Verify".
- See: the pane closes; the pad shows "PIN Correct! Access Granted.", the toast "Correct PIN! The item is now unlocked." (title "PIN Accepted"), and the safe lists "Safe memo". Server: one `mfa_code_ok` row at `priya_safe`.
- A wrong code shows "Incorrect code" and keeps the pane open; a used code "That code has been used. Wait for the next one."; an old one "That code has expired."; too many wrong codes "Too many wrong codes. Try again in N minutes." (or seconds).
- Bridge: `__test.lockStep.click('Read code')`, `__test.lockStep.click('Use this code')`, `__test.lockStep.click('Verify')`. Or type it: `await __test.lockStep.type('<the six digits>', { enter: true })`.

### 9. Close and reopen (push, locker)
1. Click "Note: Staff locker code" and read it. Click "Staff locker", type the PIN, press Enter. Pane opens, "Requests sent: 1".
2. Click the pane's X. See: silent (`__test.lockStep.close()`).
3. Click "Staff locker", type the PIN again, press Enter. See: "Requests sent: 2" (a new request on the same record; within 2 seconds of the last it says "Wait a moment before sending another request.").
4. Wait for "Send again", click it: the third request is approved. See: the pane closes; the pad shows "PIN Correct! Access Granted."; the locker lists "Locker memo".

### 10. Never passes
1. Read "Note: Finance cabinet password". Click "Finance cabinet", type the password, press Enter.
- See: `S()`: `kind: "push_number_match"`, `title: "Finance cabinet"`, a "Number: NN" line, no "Check ... phone" button; nothing ever approves however often "Send again" is clicked. Close it with X (silent).
- Also: `ruby scripts/validate_scenario.rb` warns for `dana_cabinet`; the dungeon graph draws its edge dashed (see the notes at the end).

### 11. Card door (rfid door, push, no pad)
1. Click "Spare card" in the Office and pick it up.
2. Click the door in the north wall (to the Records room).
- See: the pane opens alone (no pad): `title: "Records room"`, "A request was sent to Moira Hale's phone.", "Requests sent: 1". Server: a gate answer, no room data. No "Access Granted" toast yet.
3. Wait for "Send again" and click it until approved (the third request).
- See: only then does the door open and the Records room load, with the toast "Door opened with Spare card" (title "Access Granted") and the door-release sound.
- Denied or expired instead: one "Not approved." and the door stays shut.

### 12. NPC-opened door (key door, Gordon opens it)
**12a.** Click "Gordon Pike", choose "Could you let me into the plant room?". See the toast "Second step pending. It opens when you finish here." during the chat. Choose "Nothing, thanks." to end the chat. See: the pane opens only after the chat has closed (`title: "Plant room"`, "A request was sent to Moira Hale's phone.").
**12b.** Click the pane's X (`__test.lockStep.close()`). See: silent; the door is shut.
**12c.** Click the door in the east wall (to the Plant room). See: the pane reopens with no conversation and no key prompt.
**12d.** Reload the page, then click the east door. See: the pane again (the opener came from the bootstrap).
**12e.** Wait for "Send again" and click it until approved. See: the door opens and the Plant room loads. Server: `door_unlocked_by_npc` fired exactly once, with `retry: true`. A denial shows "Not approved." once and no "Access denied".

### 13. Carried gated item (briefcase, held), then a plain carried container
**13a.** (Gordon's phone must be in the inventory: beat 6 step 2 if it is a fresh game.) Click "Gordon Pike", choose "Could I take your briefcase?". See: "Gordon's briefcase" in the inventory, locked.
**13b.** Click "Note: Briefcase code" and read it. Click the briefcase in the inventory tray, type its PIN, press Enter. See: the pane: `title: "Gordon's briefcase"`, "A request was sent to Gordon Pike's phone.", "Requests sent: 1", and "Check Gordon Pike's phone".
**13c.** Click the pane's X. Drop the briefcase from its inventory menu, click it on the floor to pick it up, click it in the tray, type the PIN, press Enter. See: "Requests sent: 2" (the count carries on from 13b).
**13d.** Click "Check Gordon Pike's phone": a card named "Gordon's briefcase" with "Approve" and "Deny". Click "Approve" (`__test.lockStep.click('Approve')`). See: the pane closes, the pad shows "PIN Correct! Access Granted.", and the briefcase lists "Board minutes".
**13e (fresh game).** Do 13a, then click "Courier box" and confirm "Put it in". See: the briefcase leaves the inventory; nothing in the tray or the room opens it.

## Not played in the browser
Hand-built requests, a forged sync body, the exact-second expiry of a pending step, and the cap on wrong codes are Rails tests (unit 15 and unit 26).

## Expected validator warnings (`ruby scripts/validate_scenario.rb scenarios/test_ops_lock_step/scenario.json.erb`: 0 errors, 4 warnings)
1. "a lock requires key 'plant_room_key', but no item declares opens_lock": intended, the plant room opens only through Gordon's chat.
2. "item 'gordon_briefcase' is droppable without a needsTag": intended, the briefcase must be droppable for beat 13c; no NPC is meant to react to it.
3. "lock step: ... (dana_cabinet): the second step never passes": intended (beat 10).
4. "lock step: rooms.plant_room: 'plant_room' is named in an NPC's unlockable": intended (beat 12; the step is still asked).

Notes on the build: Dana carries a phone but is not `koImmune` here, the scenario sets `disableAttacks: true` instead. The access-work validator refuses a phone held by a `koImmune` NPC with no give, so the brief's `koImmune` could not be kept; the effect (no route to her phone) is the same.
