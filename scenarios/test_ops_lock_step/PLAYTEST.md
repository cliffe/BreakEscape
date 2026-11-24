# test_ops_lock_step: scripted playtest (a second step on any lock, S8c, feature A25)

Feature scenario for the second step on a lock. One fresh game for beats 1 to 12, about 40 minutes. Each beat is one click-level step per line, then what the browser shows and what the server record says. Judge each beat by the server record (the ops log terminal rows, `verify-run.rb --ops-log`), not by a client event.

The scenario is for testing, not play: no sign names a password, PIN, code or number. First factors are on the notes in the Office; the six digits and the two-digit number are only ever read off the screen, never computed. No beat sends a hand-built request (those checks are Rails tests).

**Three things that hold all through the run.**
- The second-step pane opens by itself over the lock pad (or alone over a door) when the first factor is right. Never click a button to open it. Its X closes only the pane: no reject sound, no line.
- A reload puts the player at the start point in the Office (inventory and the server's record of a pending step are kept; no pane reopens by itself, click the lock again). A pending step is dropped after five minutes, so do not leave one pending longer.
- "Send again" works only after its short delay (about 3 seconds). Moira approves the third request (patience 3).

## The places and the people (ids for the tester)

| Where | Id | Name on screen | Lock | Step kind | Owner | Owner's device |
|---|---|---|---|---|---|---|
| Office, object | `moira_pc` | Moira's PC | password (note: Records PC login) | push | moira | none needed: she approves when pestered |
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

### 1. Wrong first factor
1. Click "Moira's PC" in the Office.
2. In the password pad type `wrong`, press Enter.
- See: today's refusal in the pad. No pane. Server: no `mfa_challenge` row.

### 2. Pane (push over a password pad)
1. Click "Note: Records PC login" and read it, close it.
2. Click "Moira's PC", type the password from that note, press Enter.
- See: a pane opens over the pad, titled with the PC's name: "A request was sent to Moira's phone." with a count of 1. Nothing inside the PC is listed.
- Server: one `mfa_challenge` and one `mfa_prompt_sent` row.

### 3. Pestered owner (push, owner approves by habit)
1. In the pane click "Send again" (after its delay). Count 2.
2. Click "Send again" again. Count 3.
- See: the pane closes and the PC opens, listing "Records note" and "quarterly_export.zip".
- Server: `mfa_prompt_approved` (approver `owner`).

### 4. Number lock with no phone
1. Click "quarterly_export.zip" in the open PC.
2. Click "Note: Archive password" first if needed, then type its password, press Enter.
- See: the pane shows a two-digit number and no "Check phone" button.
3. Click the pane's X.
- See: no reject sound, no line.

### 5. Reload
1. Reload the page.
2. Click "Moira's PC" (it is still open, no password), click "quarterly_export.zip", type the password, press Enter.
- See: the same two-digit number as beat 4.

### 6. Wrong number (number match, held phone)
1. Click the pane's X.
2. Click "Gordon Pike", choose "Could I borrow your phone for a minute?". The inventory shows his phone. End the chat.
3. Click "Moira's PC", "quarterly_export.zip", type the password, press Enter.
4. In the pane click "Check Gordon's phone".
5. Click a number that is not the one the pane shows.
- See: "Not approved." once with the reject tone; the pane closes; the archive is still shut.

### 7. Right number
1. Click "quarterly_export.zip", type the password, press Enter, click "Check Gordon's phone".
2. Click the number the pane shows.
- See: the pane closes; the archive's file "export_summary.txt" is listed.

### 8. Code (code device, over a PIN pad)
1. Click "Priya Nair", choose "Could I borrow your code device?". The inventory shows "Code device". End the chat.
2. Click "Note: Wall safe code", read it, close it.
3. Click "Wall safe", type the PIN, press Enter.
- See: the pane shows a code field and a device strip.
4. In the pane click "Read code", then "Use this code", then "Verify".
- See: the safe opens and lists "Safe memo". Server: one `mfa_code_ok` row at `priya_safe`.

### 9. Close and reopen (push, locker)
1. Click "Note: Staff locker code" and read it. Click "Staff locker", type the PIN, press Enter. Pane opens, count 1.
2. Click the pane's X. See: silent.
3. Click "Staff locker", type the PIN again, press Enter. See: the same request (count continues, 2).
4. Click "Send again" until it approves. See: the pane closes; the locker opens and lists "Locker memo".

### 10. Never passes
1. Read "Note: Finance cabinet password". Click "Finance cabinet", type the password, press Enter.
- See: a pane with a two-digit number and no phone button; nothing ever approves. Close it with X (silent).
- Also: `ruby scripts/validate_scenario.rb` warns for `dana_cabinet`; the dungeon graph draws its edge dashed (see the notes at the end).

### 11. Card door (rfid door, push, no pad)
1. Click "Spare card" in the Office and pick it up.
2. Click the door in the north wall (to the Records room).
- See: the pane opens alone (no pad): a push to Moira. Server: a gate answer, no room data.
3. Click "Send again" until approved.
- See: only then does the door open and the Records room load.

### 12. NPC-opened door (key door, Gordon opens it)
**12a.** Click "Gordon Pike", choose "Could you let me into the plant room?". See the toast "Second step pending. It opens when you finish here." during the chat. Choose "Nothing, thanks." to end the chat. See: the pane opens only after the chat has closed.
**12b.** Click the pane's X. See: silent; the door is shut.
**12c.** Click the door in the east wall (to the Plant room). See: the pane reopens with no conversation and no key prompt.
**12d.** Reload the page, then click the east door. See: the pane again (the opener came from the bootstrap).
**12e.** Click "Send again" until approved. See: the door opens and the Plant room loads. Server: `door_unlocked_by_npc` fired exactly once, with `retry: true`.

### 13. Carried gated item (briefcase, held), then a plain carried container
**13a.** (Gordon's phone must be in the inventory: beat 6 step 2 if it is a fresh game.) Click "Gordon Pike", choose "Could I take your briefcase?". See: "Gordon's briefcase" in the inventory, locked.
**13b.** Click "Note: Briefcase code" and read it. Click the briefcase in the inventory tray, type its PIN, press Enter. See: the pane: one request to Gordon's phone (push).
**13c.** Click the pane's X. Drop the briefcase from its inventory menu, click it on the floor to pick it up, click it in the tray, type the PIN, press Enter. See: the request count carries on from 13b.
**13d.** Click "Check Gordon's phone", then Approve. See: the briefcase opens and lists "Board minutes".
**13e (fresh game).** Do 13a, then click "Courier box" and confirm "Put it in". See: the briefcase leaves the inventory; nothing in the tray or the room opens it.

## Not played in the browser
Hand-built requests, a forged sync body, the exact-second expiry of a pending step, and the cap on wrong codes are Rails tests (unit 15 and unit 26).

## Expected validator warnings (`ruby scripts/validate_scenario.rb scenarios/test_ops_lock_step/scenario.json.erb`: 0 errors, 4 warnings)
1. "a lock requires key 'plant_room_key', but no item declares opens_lock": intended, the plant room opens only through Gordon's chat.
2. "item 'gordon_briefcase' is droppable without a needsTag": intended, the briefcase must be droppable for beat 13c; no NPC is meant to react to it.
3. "lock step: ... (dana_cabinet): the second step never passes": intended (beat 10).
4. "lock step: rooms.plant_room: 'plant_room' is named in an NPC's unlockable": intended (beat 12; the step is still asked).

Notes on the build: Dana carries a phone but is not `koImmune` here, the scenario sets `disableAttacks: true` instead. The access-work validator refuses a phone held by a `koImmune` NPC with no give, so the brief's `koImmune` could not be kept; the effect (no route to her phone) is the same.
