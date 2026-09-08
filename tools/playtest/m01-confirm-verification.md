# m01 confirmation run — verification notes (2026-09-07)

The Haiku run on game 954 was a real run: 423 log entries, `verify-run.rb` exit 1
reported honestly rather than written around. Its conclusion ("Sarah's
interaction is broken") was wrong, but its evidence was sound and led to three
harness defects, all now fixed.

## What actually happens

Reception has three interactables clustered together: Sarah O'Brien (128,41),
the Visitor Sign-In Log (135,54) and the Building Directory (160,55).

The engine selects an interaction target in two stages — nearest candidate by
**plain centre distance**, then range-check that one candidate with the facing
offset applied. From (140,72) the bridge reported Sarah nearest on
`interactDistance` (11.8 vs 15), but on plain distance the sign-in log wins
(18.4 vs 33.0). The engine therefore opens the sign-in log, correctly and by
design. `interactNearest` — the keyboard `i` path — does the same.

## Defects found and fixed (harness only)

1. **`solveStandingPoint` ignored candidate selection.** It optimised only for
   the range check, so `moveToNear` could park the player where the target is in
   range but can never be selected. It now rejects points where another
   interactable is plainly nearer, and returns `contested: true` when no such
   point exists.
2. **`moveToNear` judged the point it aimed at, not the one it reached.**
   `moveTo` stopped 30px short on the reception desk collider and it still
   returned `ok: true`. It now re-checks after arrival via `plainNearestEntity()`
   and fails with `arrived-but-another-target-is-nearer`, naming the winner.
3. **`interact` returned `ok: true` alongside `mismatch: true`.** A caller
   checking only `ok` recorded opening the wrong thing as a pass. Now
   `ok: false`, `reason: 'wrong-target-opened'`.
4. **`moveTo` called a 32px miss "reached".** `reachedTarget` used a full tile;
   a tile of drift is enough to change which interactable wins selection.
   Tightened to 8px, with `shortfall` reported.

## Still open

- **Sarah may be unreachable by plain `interact`.** (111,58) is the nearest
  uncontested standing point and the player cannot walk there — the reception
  desk blocks it. If so the disambiguation menu is the only route, which is
  fine for a human (who sees the menu) but must be the harness's default for
  clustered NPCs. Not yet confirmed.
- **`moveTo` issues a real canvas click, which can itself trigger an
  interactable it lands on.** Moving to (111,58) opened the sign-in log. Movement
  is not side-effect-free and the harness treats it as though it is.
- **Bootstrap is non-deterministic.** Game 954 dismissed the opening cutscene as
  "close notes"; games 955-959 played 8 cutscene choices. Same code, same
  mission. Unexplained.
- The three items from the earlier Sonnet run (`inform_safetynet_operation_shatter`,
  the server-room collider, the debrief visualiser) remain **not reached**.

## Resolved (same session)

The reception blocker is fixed and verified on game 963: `moveToNear` →
`interact` opens Sarah's conversation, and the reception desk phone too.

5. **`moveTo` triggered interactions.** A world click inside the 32px gather
   radius acts on that interactable instead of moving — it opened the sign-in
   log unasked and blocked the rest of the session. `moveTo` now walks on the
   keyboard when the destination is near an interactable
   (`via: "keyboard(avoids-click-trigger)"`).
6. **`solveStandingPoint` used the wrong range measure.** Gathering uses plain
   centre distance; the solver used the offset minimum, so it aimed at points
   1px outside the gather radius. Now requires plain range, and treats a
   contested point as fine — the menu resolves it.

Sarah was never unreachable: from (123,67), plain 26.1px, the click raises the
menu and `interact` picks her by name.

## Run 2 (game 964) — harness fixes held, driving failed

Log seq 6-10 show `moveToNear` → `interact` → `mode: "via-interaction-menu"` →
person-chat opening exactly as intended. The run then never closed the
conversation and sent ~200 further commands into `minigame-active` refusals
without reacting to any of them. It also restarted the session process four
times. Harness correct; driving at fault.

This also explains the "bootstrap non-determinism": those repeated bootstraps
were separate sessions against the same game, so the opening cutscene had
already been consumed. Not a defect.

## Further fixes

7. **`converse` command** — opens a conversation and drives it to completion in
   one call, exhausting unseen branches and always closing. Removes the failure
   mode above. Verified on Sarah: 46 turns, 10 branches, badge + Main Office Key
   obtained, main world usable afterwards.
8. **Phone contact list was invisible to the bridge.** `getTestState` exposed
   only dialogue, which is empty until a contact is opened, so the phone looked
   broken. Now exposes `contacts` and `awaitingContactSelection`.
9. **`clickText` only matched `<button>`-like elements.** Contact rows are plain
   divs with click handlers; the selector now includes them. Kevin's voicemail —
   the in-game source of the IT room PIN 2468 — is reachable for the first time.

## Run 3 (game 970) — furthest yet; new gap found

`converse` worked (46 turns, badge + Main Office Key). Reached main_office_area:
verify-run exit 0, 1 room beyond the first. Blocked on "object discovery" — the
Maintenance Checklist was not in the nearby list from the doorway.

10. **No way to enumerate a room.** `scanNearby` is capped at 6 tiles / 25
    entries, so an agent at a room edge cannot see the room's contents and
    concludes the object does not exist. Added `{"cmd":"room"}` —
    `roomContents()` lists every object, door and NPC in a room at any distance,
    with `visible:false` marking content that exists but is not yet revealed.
    (First cut returned `room: null`; `window.currentRoom` is not the room id —
    `currentRoomId()` is. Fixed and verified.)

## Run 4 (game 973) — blocked at the key lock; classification overstepped

Run 4 reached the main office door, opened the key-lock minigame, and could not
complete it. It then reported "a game-engine issue", which it was explicitly
told not to do — and which run 3 contradicts: run 3 got **through** that same
door (verify-run: 2 rooms unlocked). The door is passable.

### Open item: the key-lock minigame has no reliable test affordance

`mg getState` on the key lock returns:

    keyMode: true, keySelection: [{x:100, y:310, width:108, height:20,
    label:"Main Office Key"}], keyTarget: null, nestedCanvas: true
    hint: "clickCanvas on the chosen keySelection[i] first; keyTarget appears afterwards"

Following that hint exactly — `clickCanvas(154, 320)`, the centre of the stated
box — returns `ok:true` but the state is unchanged: still "Select a key to
begin", `keyTarget` still null. Verified twice on clean games (975, 976).

Not a coordinate-scaling problem: the minigame's Phaser canvas is 600x400 and
its bounding rect is exactly 600x400, so `clickCanvas` maps 1:1.

**Correction: the affordance does work.** `keySelection[i].x/.y` are the
element's CENTRE (`b.centerX`/`b.centerY`), and I clicked as though they were a
top-left corner. Clicking (100,310) selects the key and `keyTarget` appears. The
run-4 failure and my own investigation both came from the same misreading — which
is the argument for not having agents compute canvas coordinates at all.

11. **`lock` command** — solves the open lock minigame end to end: waits for it
    to become actionable, picks the key (or types a `code`), clicks the keyhole
    once, waits for the unlock. Verified: two steps, door unlocked.
12. **`enter` command** — walks through to an adjacent room. Rooms load lazily
    and an unlocked door is REMOVED from the scene, so `moveToNear("door:...")`
    fails with `unknown-entity` after you unlock it. The session now caches
    doorways seen in `room` results and walks through the remembered gap.

Verified chain on game 982: `converse` (Main Office Key) → `interact` door →
`lock` → `enter` → `room` listing the main office, its safe and its four doors.

## Baseline achieved (game 983)

Sonnet, one session, 947 commands, 33 minutes. verify-run exit 0: 13 rooms,
9 containers, 4 real flags, 37 items, 36 globals. Blocked only at the final
abort/launch confirmation, so the debrief never ran.

Earn-before-use is provable from the log independently of the report:
voicemail seq 20 → PIN 2468 used seq 60; Anniversary Card seq 138 → 0419 used
seq 540; "My Passwords" seq 638 → first flag seq 707.

Old blockers: (1) `inform_safetynet_operation_shatter` NOT reproduced — clears
when the conversation is played to its last line. (2) Server-room collider
REPRODUCED on three objects (59.7px, 53.6px, 32.5px short). (3) Debrief
visualiser NOT reached.

## Friction fixes (13-18), all verified on game 984

13. `lock` handles keypad PIN locks (no text field — digits are tapped).
14. `mg type(submit:true)` clicks a submit button when Enter does nothing.
    Flag stations ignore Enter, so submitted flags silently never arrived.
15. `clickControl` accepts a label, not just an index; failures list what was there.
16. `mg getState` waits out a container's "Loading contents..." render.
17. `enter` opens an unlocked-but-closed door before walking through it.
18. `converse` stops when the dialogue stops saying anything new.
