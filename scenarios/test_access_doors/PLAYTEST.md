# test_access_doors: scripted playtest (D1 to D5)

The scripted run for access model step 7 (`docs/achitechture/ACCESS_MODEL_PLAN.md`, "How the slice
is tested" and step 7's beat table). One numbered step per beat, in order, with a reload after D4.
After every beat, check what is on screen, what the server recorded and what reached the browser.

The scenario is for testing, not play: no needs, no passwords, no story. Every card the run uses is
picked up or copied in the game, so the earned-secrets table has no typed secrets (see the end).

## Setup

Keyless server on :3001 (never touch :3000). In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_doors
S=<scratchpad>/test_access_doors-haiku
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/test_access_doors-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/test_access_doors-responses.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat. Compare the `serverClones` line
with the record each beat expects below.

## Harness notes for this scenario

- **Copying a card in conversation.** `converse` closes the card copier screen when the clone tag
  opens it, so the copy is lost. Instead: `{"cmd":"converse","id":"<npc>"}` with no choices (it
  stops at the hub, `stopped-at-choice`), then `{"cmd":"mg","action":"chooseIndex","args":[1]}` for
  "Can I scan your badge/card with this card copier?". Wait about 5 s for the read, then click Save:
  `{"cmd":"eval","fn":"() => { const b = Array.from(document.querySelectorAll('.rfid-minigame-container button')).find(x => x.innerText.trim().startsWith('Save')); if (!b) return null; b.click(); return b.innerText; }"}`
  (the button reads "Save" for an EM4100 card and "Save UID" for Priya's DESFire card). The chat
  comes back after the copier closes; leave it with `{"cmd":"converse","choices":["let you get on"]}`.
- **Copying a held keycard.** `{"cmd":"openInventoryItem","item":"ian_spare_badge"}` opens the
  card copier in clone mode; click Save the same way.
- **Door answers.** `interact` on a door reports the events: `door_unlocked` when it opens,
  `door_unlock_failed` when it refuses. The toast text is on screen (take a screenshot when the
  step says to read it).
- **Client state.** `{"cmd":"eval","fn":"() => window.__test.access.savedCards()"}` lists the card
  ids saved on the copier.

## Beats

Room layout: `lobby` (start) with Finance north, IT east, Security south and Plant west. The
visitor room is north of the IT lobby. Every beat room has a sign ("Sign: D<n> ..."); read it first.

### 1. D1 Fallback

Room: `it_lobby`, door north to `visitor_room` (`requires: ["VISITOR-07"]` only).

1. Before taking anything: `enter` `it_lobby`, read `sign_d1`, `moveToNear` and `interact`
   `door:it_lobby->visitor_room`. Expect `door_unlock_failed` and the toast "Requires RFID keycard".
2. Back to `lobby`, take `visitor_card` (Visitor card 07). Return and try the door again. Expect
   `door_unlocked`, the toast "Door opened with Visitor card 07", task `d1_fallback` complete.

Server record afterwards: `visitor_room` in unlocked rooms (full `verify-run.rb`); `serverClones` 0.

### 2. D2 Copy in conversation

Room: `finance_lobby` (Dana Reyes, role `finance`, EM4100 card `FIN-DANA-01`). Door north to
`finance_office` (`access: { roles: ["finance"] }`), which holds `finance_cabinet` (an `rfid`
object, role-only `access`).

1. In `lobby`, take `card_copier`.
2. `enter` `finance_lobby`, read `sign_d2`, try `door:finance_lobby->finance_office`. Expect
   `door_unlock_failed` and the toast "Access denied" (the visitor card is sent and refused).
3. Copy Dana's badge (harness notes). `savedCards()` lists `FIN-DANA-01`.
4. Try the door again: `door_unlocked`, toast "Card accepted". `enter` `finance_office`,
   `interact` `finance_cabinet`: it opens (`item_unlocked`), task `d2_copy_in_conversation` complete.
   The cabinet's contents window opens at once and blocks movement: close it (`mg close`, or click its close button) before moving on.

Server record afterwards: `serverClones 1: FIN-DANA-01 from npc dana`; `finance_office` and
`finance_cabinet` unlocked.

### 3. D3 Copy from a held keycard

Room: `it_lobby` (Ian Shaw, role `it`, card `IT-IAN-01`). Door east to `server_room`
(`access: { roles: ["it"] }`).

1. Read `sign_d3`. Try `door:it_lobby->server_room`: `door_unlock_failed`, "Access denied".
2. `converse` with `ian`, choices `["borrow your spare", "let you get on"]`. "Ian's spare badge"
   (`ian_spare_badge`) is in the inventory.
3. Copy it from the inventory (harness notes), click Save.
4. Try the door: `door_unlocked`, task `d3_copy_from_keycard` complete. (The held badge would open
   it on its own as well; the beat's point is the server record.)

Server record afterwards: `serverClones` now also has `IT-IAN-01 from object ian_spare_badge`;
`server_room` unlocked.

### 4. D4 UID-only copy

Room: `security_lobby` (Priya Nair, role `security`, `MIFARE_DESFire` card `SEC-PRIYA-01`). Doors
south to `cctv_room` (`access: { roles: ["security"] }`, `acceptsUIDOnly: true`) and east to
`evidence_store` (same `access`, no `acceptsUIDOnly`).

1. Read `sign_d4`. Copy Priya's badge (harness notes; the button reads "Save UID").
2. Try `door:security_lobby->cctv_room`: `door_unlocked`, toast "Card accepted".
3. Try `door:security_lobby->evidence_store`: `door_unlock_failed` and the toast "Reader requires
   full authentication"; it stays locked. Task `d4_uid_only` completes once both doors have
   answered (either order).

Server record afterwards: `serverClones` now also has `SEC-PRIYA-01 from npc priya (UID-only)`;
`cctv_room` unlocked, `evidence_store` not.

### Reload (after D4)

`{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about
15 s, then `{"cmd":"bootstrap"}`. Check:

- the doors opened so far stay open (walk through `finance_office`, `server_room`, `cctv_room`
  without a reader);
- `savedCards()` still lists `FIN-DANA-01`, `IT-IAN-01`, `SEC-PRIYA-01`;
- `verify-run.rb --access` shows the same three `serverClones` as before the reload;
- tasks `d1` to `d4` are still complete; `evidence_store` still refuses ("Reader requires full
  authentication").

### 5. D5 Shared card

Room: `plant_lobby` (Gary Whitlock, role `facilities`, and Imran Siddiqui, role `maintenance`, both
carrying `PLANT-SHARED-01`). Door west to `plant_room` (`access: { people: ["imran"] }`).

1. Read `sign_d5`. Optionally talk to Imran: he refuses a scan.
2. Copy Gary's card (harness notes). This proves a copy made after a reload records as before.
3. Try `door:plant_lobby->plant_room`: `door_unlocked`, task `d5_shared_card` complete.

Server record afterwards: `serverClones` now also has `PLANT-SHARED-01 from npc gary`;
`plant_room` unlocked.

## At the end

`{"cmd":"sync"}`, the full `verify-run.rb <game_id>`, the leak check over the whole responses
file, and the report: each step's result with its session log lines, the earned-secrets table and
both checks per beat. All five tasks complete; `serverClones` has four entries (Dana, Ian's badge,
Priya UID-only, Gary).

## Earned secrets

No passwords or PINs in this scenario. Each card is earned in game: the visitor card picked up in
the lobby, Dana's, Priya's and Gary's cards copied in conversation, Ian's spare badge given in
conversation and copied from the inventory. Clicking Save by `eval` drives the copier's own button
and counts as earned. Nothing is set from the console.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_access_doors/scenario.json.erb` (with
`LANG=C.UTF-8`) is clean apart from one expected warning: card `PLANT-SHARED-01` is carried by
`gary` and `imran` and used at the access lock `plant_room` (D5 tests exactly that). It also prints
the identity reach lines and the generic suggestions every small test scenario gets.
