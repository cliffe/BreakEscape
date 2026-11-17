# Scenario format hardening, step 3, review R3

Reviewed `build/hard-step3` at `360dedeea`, with the R2 fixes `bfa720b4e` (runtime door-entry
strip, rfid mismatch normalise, merge note) and `360dedeea` (live proof 27/27 and test results).
Read `SCENARIO_FORMAT_STEP3_REVIEW_R1.md` and `_R2.md`, the R2 fix diffs, the live-proof tool, the
`test_secret_leaks` fixture, `strip_door_entry_requires!`, `door_entry_issues`, and the build-log
merge note. A keyless server on port 3678 was used to fetch the real cold bootstrap; no code was
changed.

- Blocker: 0
- Major: 1
- Minor: 1

Verdict: **FIX**. The runtime door-entry strip (Focus 2) is sound on every path and safe against
in-place mutation; m3 and m4 (Focus 3) are genuinely closed. But the reported cold-start "flake"
(Focus 1) is a real leak, not a flake: the `test_secret_leaks` fixture ships all three secrets to
the browser in `scenario_brief`, and the live proof masks this by excluding `scenario_brief` from
its scan. The withholding code is correct; the fixture and the proof's method are not.

---

## Focus 1 (top priority). The cold-start "flake" is a real leak in the fixture and in the proof

### What actually happens

`scenario_brief` ships to the browser verbatim in `GET /games/:id/scenario`.
`Game#filtered_scenario_for_bootstrap` (`game.rb:1737`) never removes it, and the `scenario`
controller action (`games_controller.rb:295`) sends the filtered bootstrap as-is. The fixture's
`scenario_brief` writes all three secrets out in plain English:

> "The strongbox is a combination padlock (12-30-5)... Rhea's account password is the cryptex
> answer WOLF... Tess the tipster's usePayload carries the vault door PIN 4821..."

Reproduced on a cold server (port 3678, fresh `test_secret_leaks` game 5022 through
`swap-scenario-game.rb`, raw bootstrap on the first request):

```
scenario_brief present: True
'12-30-5' in full bootstrap JSON: True   (only in scenario_brief)
'WOLF'    in full bootstrap JSON: True   (only in scenario_brief)
'4821'    in full bootstrap JSON: True   (only in scenario_brief)
```

Each secret appears in exactly one shipped field: `scenario_brief`. No secret appears in any room,
object, door entry, or capture payload, so the structured withholding that step 3 hardens is
working. The leak is the brief text itself.

### Why cold looked different from warm

It is not a server-state difference. `filtered_scenario_for_bootstrap` deep-dups `scenario_data`
every call and the brief is static ERB text, so the bootstrap carries the secrets on every request,
cold or warm. The real sequence: the proof's first run scanned the whole bootstrap, hit the three
secrets in `scenario_brief`, and failed. The builder then added `bootWithoutNarrative()` to the
proof (`secret-leak-withholding-live-proof.mjs`), which deletes `scenario_brief`, `scenario_name`,
`endGoal` and `scenario_id` before the raw-secret scan, and the next ("warm") run passed. The
builder's own note in the proof records the reasoning: "test_secret_leaks' brief documents its own
codes, so the raw secret scan excludes those narrative fields". So the "warm re-run was clean"
because the proof was changed to skip the field that ships the secrets, not because the server
behaved differently. There is no caching bug, render race, or first-request path involved; there is
no timing bug. The diagnosis "the secrets sit only in `scenario_brief`, which the scan skips" is
correct about the location and wrong to treat the skip as the fix.

### M1 (Major). The fixture leaks three secrets in its brief; the proof skips the field that ships them

Evidence. `scenarios/test_secret_leaks/scenario.json.erb:4` puts `12-30-5`, `WOLF` and `4821` in
`scenario_brief`. That field ships unfiltered (reproduced above). The live proof's
`bootWithoutNarrative()` deletes `scenario_brief` before scanning, so its "before-proof: secret
absent from every payload" assertions pass although the brief holds all three. No other test touches
the fixture's brief: `test/controllers/break_escape/secret_leak_withholding_test.rb` builds its own
inline `lock_scenario` (no secret-bearing brief), and `validate_secret_leaks.rb` scans only the
copy-sinks (globalVariables, minigameData, scenarioData), not narrative strings. So nothing catches
it, and the headline "27/27 live proof" asserts a clean fixture that ships three secrets.

A fixture named `test_secret_leaks`, whose stated purpose is to prove the server withholds secrets,
that ships all three of its secrets in a shipped field, is self-contradictory; a proof that reaches
its clean verdict by deleting that field is unsound. A player who opens the Mission Brief popup in
this fixture reads the three answers.

Impact. No shipped mission leaks: real mission briefs do not contain their own lock answers, and the
structured withholding code is correct. The damage is to the verification. The live proof is cited
as the live evidence for step 3, and on its own fixture it reports clean while three secrets ship.
Any reader trusting the proof is being told the wrong thing about the one scenario built to exercise
the leak paths.

Suggested fix. Rewrite the fixture's `scenario_brief` so it describes the structure without the
literal values (for example: "the strongbox is a combination padlock whose code is also Mara's
usePayload secret, gated by a dropped-USB proof"), then delete `bootWithoutNarrative()` and scan the
whole bootstrap JSON for each secret. The proof must not skip a field that ships. With a clean brief,
the scan over the full bootstrap is both honest and stronger (it would catch a future leak into any
narrative field). `scenario_name`, `endGoal` and `scenario_id` carry no secrets once the brief is
fixed, so excluding them is no longer needed either.

---

## Focus 2. Runtime door-entry strip (`strip_door_entry_requires!`, `game.rb:6220`)

No findings. Verified sound and safe.

- **Every path a room's doors reach the client is covered.** Bootstrap: `doors` is not in the
  room keep-list (`filtered_scenario_for_bootstrap`, `game.rb:1768-1772` keeps `connections` but
  not `doors`), so a door entry never ships in the bootstrap. Room route: `filtered_room_data`
  (`game.rb:2064`) deep-dups the room and runs `filter_requires_and_contents_recursive`, which calls
  `strip_door_entry_requires!(obj)` at `game.rb:6191`. Unlock and move responses reach the client's
  room data through the same `filtered_room_data` (`games_controller.rb:569, 1189, 2643`). Sync
  (`sync_state`, `games_controller.rb:833`) ships player-state deltas and embeds no room `doors`
  array. So the only two channels that carry `doors` both pass through the strip.
- **Resolved-type logic is right.** The entry's own `lockType` wins, else the connected room's
  (`rooms[entry['connectedRoom']]['lockType']`), matching `doors.js`. Checked cases: a bare entry to
  a pin/password/combination/cryptex room resolves to that secret kind and is stripped; a bare entry
  whose connected room is missing resolves to `nil`, which is not a card kind, so `requires` is
  stripped (safe, no leak); an entry with its own secret `lockType` resolves to that and is stripped;
  an rfid/biometric/bluetooth resolved type is kept, so the clone-as-entry card id survives. An entry
  `NpcHabits.doorway_problem` flags (no direction, or no matching `connections`) is one the client
  never reads, and is left alone, matching `each_lock_answer`. A two-way door resolves each side
  independently against its own connected room.
- **No legitimate card flow broken.** `CARD_REFERENCE_LOCK_TYPES` keeps rfid, biometric and
  bluetooth `requires` intact. The live proof shows the rfid entry (`badge01`) kept and a bare PIN
  entry stripped on the real `GET /room/office`, and m01 and lab PIN safes still open.
- **No in-place mutation of shared scenario data.** `filtered_room_data` operates on
  `room_data(room_id).deep_dup`, so the strip mutates a copy. `strip_door_entry_requires!` only
  *reads* `scenario_data['rooms']` to resolve the connected room's lock type; it never writes to the
  stored scenario. The next request re-dups, so no bleed. The strip also runs (harmlessly) on
  non-room objects during recursion, where `doors.is_a?(Array)` is false and it returns at once.
- **Client-code claim checked.** The commit cites `unlock-system.js` (pad locks validate
  server-side) and `doors.js` (resolved-type rule); both match the implemented behaviour. The pad
  lock never needs a door's `requires` on the client, only the card kinds do.

Focused re-runs here: `test/controllers/break_escape/secret_leak_withholding_test.rb` 15/15 (0
failures), `test/js/validator-secret-leaks.test.mjs` 26/26.

---

## Focus 3. R2 m3 and m4

Both closed.

- **m3 (card-reference normalisation) is closed.** `door_entry_issues`
  (`validate_secret_leaks.rb:353`) now computes `requires_differs` by normalising both sides with
  `Array(...)` when `resolved` is a card-reference kind, and keeps the raw comparison for secret
  kinds (`validate_secret_leaks.rb:378-386`). `resolved = own_lock_type || room_lock_type` is the
  governing type. The R2 false-positive case (a bare rfid entry `"badge"` against a room `["badge"]`)
  now compares `["badge"] == ["badge"]` and raises no warning. The node fixtures cover it (26/26).
- **m4 (merge-sequencing note) is closed.** The build log records the self-activating tripwire in
  two places (`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md:3731-3736` and `:3979-3981`): step 3's
  `acknowledgedClues` schema declaration flips `schema_declares_acknowledged_clues?` true, so on
  merge with 6a-1 the held `payload_scan_fresh_state_test` self-activates and flunks `SCAN_READY`
  until its corpus-scan body is written, and both must land in the same batch.

### Fresh pass over the R2 delta

Nothing new beyond M1 and m1 below. The R2 commits touch `game.rb` (the strip), the validator (m3),
the build log (m4), the controller test, the node test, and two playtest tools. The strip is sound
(Focus 2); the validator change is a pure widening of the no-mismatch case; the test and tool
additions are correct. The `payload_scan_fresh_state_test.rb` failure on `SCAN_READY` is the
expected, out-of-scope tripwire being built on another branch and is not counted.

### m1 (Minor). No check guards an always-shipped narrative field, so the brief leak is invisible

Evidence. `validate_secret_leaks.rb` compares answers against the copy-sinks (globalVariables,
minigameData, scenarioData) only; it never scans `scenario_brief`, `endGoal`, `door_sign`,
`lockedHint`, `observations` or note `text`, all of which ship. So the fixture's brief leak (M1)
raises no validator error, and an author pasting a lock answer into any shipped narrative string
would leak it unflagged. This is the root the proof's skip rests on.

Impact. Low in practice: authors rarely write the literal answer into prose, and the field is
author-controlled flavour. But it is an unguarded channel, and it is why the M1 leak went unnoticed.

Suggested fix. After the M1 fixes, have the leak check also scan the always-shipped narrative strings
for an exact secret substring and warn (not error, since a clue can legitimately hint). At minimum,
fixing the fixture and scanning the full bootstrap in the proof (M1's fix) closes the hole for
`test_secret_leaks`; this Minor generalises the guard to every mission.

---

## Notes and things I was unsure of

- I reproduced the leak with a raw `curl` of the cold bootstrap rather than re-running the full
  browser proof; the proof's 27/27 is the builder's own run and I did not re-run it. The raw fetch is
  sufficient to show `scenario_brief` ships the three secrets on the first request.
- Severity call: M1 is a Major, not a Blocker, because no shipped mission leaks and the withholding
  code is correct; the defect is in the fixture and in the proof's verification method. If the owner
  treats "the live proof must be honest about its own fixture" as ship-blocking, it reads as a
  Blocker; I ranked it on code impact.
- I did not re-run the full Rails or corpus suites (out of scope). The two focused suites I ran pass.
