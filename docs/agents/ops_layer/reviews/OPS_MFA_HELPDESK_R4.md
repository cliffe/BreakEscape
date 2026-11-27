# OPS_MFA_HELPDESK_PLAN, review round 4 (full)

Reviewer: adversarial, round 4, 2026-11-19. Plan as in the worktree `docs/ops-layer-plan`
(1400 lines). Line numbers are plan lines unless a file is named. Code pointers are to the
worktree tree.

## Findings (written as found; graded and ordered in the summary at the end)

### S8c against the unlock code

**F1 (major). The `npc` method is a client claim, not a server record, so skipping the step on it
is a bypass a player can trigger.** Plan 740-742 skips the gate for `npc` and `flag_reward`
"which the server grants from its own records and which stand to a lock as a token stands to
sign-in". For `flag_reward` that is true: `flag_reward_unlocks_object?` reads
`player_state['flag_rewards_claimed']`, which `process_flag_rewards` writes
(`game.rb:4539-4574`). For `npc` it is not. On an object, `validate_npc_unlock` checks only that
the NPC was met and that `npc['unlockable']` names the target (`game.rb:5051-5077`); nothing
records that the conversation reached the unlock. On a door, `npc_mapping_unlocks_door?` has no
encounter check at all (`game.rb:5037-5048`). The player posts `method: "npc", attempt:
"<npc id>"` to `/unlock` (`games_controller.rb:1226`, `game.rb:4623-4626`, `4719-4722`) at
any time after meeting the NPC, and the plan's gate would let that skip the second step too.
Today this is the accepted best-effort dialogue gate on the first factor; S8c sells the second
step as the part the server enforces (plan 762-763), and it is not on any lock that an NPC can
open. The most natural author pattern (the owner "lets you in" to her own PC, so she lists it in
`unlockable`) is exactly where the step would vanish.
Fix: say so in 5.6 and section 7 in one sentence ("a lock an NPC may open by `unlockable` or
`unlockDoor` is best-effort as today; the step does not harden it"), and add a validator warning
when a `secondStep` target is named in any NPC's `unlockable` or `eventMappings[].unlockDoor`
(the author probably meant the NPC to be the approval). Alternatively do not skip on `npc`:
treat an NPC-opened lock as the owner approving only when that NPC is the step's owner, and run
the gate otherwise. Ask the user which (new question, see Q section).

**F2 (major). "Contents leave the server from one place only" (plan 755-756, 869) is false for
a room object that shares a name with another lock.** `filtered_room_data` marks a room object
`locked: false` when `unlockedObjects` holds its id, its **name** or its client-generated id
(`game.rb:2999-3010`), and the filter then keeps its `contents`, because it strips them only
from an object still marked locked (`game.rb:7226-7232`). `/unlock` writes whatever `targetId`
the client posted (`games_controller.rb:1315`, `game.rb:691-695`), and `find_scenario_object`
resolves an id, a name or a generated id (`game.rb:4700-4702`). So a plain lock named "Office PC"
that the player opens adds "Office PC" to `unlockedObjects`, and the next room load ships the
contents of a different `secondStep` PC with the same name, with neither factor given for it.
This is an old aliasing gap for first factors too, but S8c's promise is a hard server gate, and
duplicate names ("PC", "Laptop", "Safe") are common.
Fix: in 5.6, key `lockSteps` and the gate on the found object's `id` (not the posted string),
write that `id` to `unlockedObjects` for a `secondStep` object, and have the room-data marker
match a `secondStep` object by id only. Add a validator error for a `secondStep` object whose
`name` equals another lockable object's `name` or id in the scenario, and a no-exposure test for
the twin-name case.

**F3 (major, L2). A door with `secondStep` has openers outside `/unlock` that the plan does not
list.** `serve_opened_room` is called by a finished `prop_door` workaround
(`games_controller.rb:1702`, `2926-2932`, `npc_frustration.rb:143`); a flag-station door reward
calls `unlock_room!` directly (`games_controller.rb:4011-4020`); route-room promotion by pass or
credential calls `unlock_room!` (`game.rb:470-478`, `510`); and the `npc` door route records the
room in `npcRouteRooms` and serves it (`games_controller.rb:1282-1291`). None goes through the
step gate. Some of these are right in the fiction (a propped door or tailgating skips a door's
second step as a token skips sign-in), but the plan must say which skip and which do not, or a
builder will either miss them or block them by accident.
Fix: add a short table to 5.6 for L2 listing each door opener and whether it skips the step
(suggest: prop_door, tailgating, npc route and flag reward skip, and the validator notes it on a
`secondStep` door; credential promotion goes through `/unlock` and so meets it).

**F4 (minor). The kinds-per-lock restriction is a design choice, not a fact, and it rules out
the most familiar two-factor door: card plus PIN.** Plan 254-263 limits `code` to `password` and
`pin` locks "because the lock has nowhere to type a code". An `rfid` door with a code pane after
the card is the everyday badge-plus-PIN reader, and the `password` scene opened with
`secondStepOnly: true` (plan 781-786) already gives every pad a place to type. Likewise `key` and
`lockpick` with a push ("a latch that asks its owner") is odd fiction for a picked lock.
Fix: put this to the user as a question: (a) as planned; (b) `code` also on `rfid`, `biometric`,
`bluetooth`, `ble` through the `secondStepOnly` pane (recommended, no new scene); (c) also drop
push from `key`/`lockpick`.

**F5 (minor). The phone listing lock requests with no pane open contradicts "Later slices".**
Plan 790-793 and 842-843 have a held phone list waiting lock requests and approve them after the
pane is closed or after a reload; plan 157-159 names exactly that (a phone menu listing waiting
requests with the screen closed) as a later slice, not designed, for sign-in. Either the phone
lists requests on its own or it does not.
Fix: decide once. Simplest: for both sign-in and locks, `GET /mfa/phone` lists live records
whatever the pane state, and a pass with the pane closed is finished by giving the first factor
again (as 790-793 already says for locks); delete the later slice or narrow it to "a sign-in
finished from the phone without re-typing".

**Verified claims (no finding).** `owner` reaches the browser: nothing in the filter deletes it
(`game.rb:7169-7260`; schema `scripts/scenario-schema.json:5511` allows a string or a list). A
locked object's own `text` ships: the filter removes `requires` and `contents` only
(`game.rb:7200-7202`, `7229-7232`). `zip_archive` is used with a password lock and `contents`
(`scenarios/test_access_signin/scenario.json.erb:78-95`, also `lab_social_engineering`) and has
a sprite, but it is a generic object type: no engine or schema code names it, so "an existing
container type" means only "any object with `contents`" (nit N1 below). `flag_reward` is a
server record (`game.rb:4539-4574`), so skipping the step on it is sound. `GET /container` for a
plain container tests `unlockedObjects` by id only (`games_controller.rb:3119-3126`), so a
`passed` record alone opens nothing there.

**F6 (major, L2). `secondStep` on a `doors[]` entry would never be read.** Plan 246 lists "a room
or a `doors[]` entry" as homes for the attribute, and 248 says the owner is "required on a
door". The schema says the game never reads lock fields on a door entry: they belong on the room
the door leads into (`scripts/scenario-schema.json:4171-4173`). `validate_unlock` reads the
door's lock from `room_data(target_id)`, the room itself (`game.rb:2304-2306`, `4607-4613`),
and `lock_second_step` is to find the door "as `validate_unlock` does" (plan 708-709). The D6
digest's line "`doors[]` entries carry their own lock fields" (D6 line 149) is what misled the
planner.
Fix: in 4.3 and 9, the door home is the room (`rooms.<id>.secondStep`, beside its `lockType`),
and the validator errors on `secondStep` in a `doors[]` entry as it would on any lock field
there. Correct D6 line 149 in the same change.

**F7 (nit, L2). A room's `secondStep` does not reach the browser before the room loads.** The
bootstrap keeps only an allowlist of room fields (`game.rb:2425-2427`); `secondStep` is not on
it. Plan 868 says the attribute ships "with the object or door, as authored". For a door pad
that is false until the room is open, which is after the step. Nothing breaks (the client learns
of the step from the `/unlock` answer), but the table is wrong and a builder may expect the pad
to know in advance, for example to pick the frame.
Section 12's L2 row (plan 1234) already lists "the door payload at `game.rb:2400-2455`", so the
build is covered; only 4.3 and section 7 do not say so.
Fix: in 4.3 or section 7, say L2 adds `secondStep` to the bootstrap room allowlist
(`game.rb:2425-2427`).

**F8 (minor, L2). One rfid path does not post through `unlockWithRouteRoomRetry`.** Plan 773-776
puts `secondStepDue` in the pads that post through that helper and in `notifyServerUnlock`. The
access-list rfid post calls `apiClient.unlock` directly with `card_ids`
(`public/break_escape/js/systems/unlock-system.js:177`), and the NPC door posts do too
(`npc-game-bridge.js:108`, `person-chat-conversation.js:464`; those are `npc`, which skips the
gate). The rfid one would treat the 200 `secondStep` body as success or failure by its own test.
Fix: name `unlock-system.js:177` in L2's client list, with a JS test for an access-list rfid
door that carries `secondStep`.

**F9 (minor). Log rows for a lock: three wording slips.** Plan 1255 says `where` is a `pc` or a
`desk`; 1282 adds `object` and `door` without amending it. Plan 1281 says "the same seven
`mfa_*` events"; the table lists eight (`mfa_challenge`, `mfa_code_ok`, `mfa_code_wrong`,
`mfa_code_locked`, `mfa_prompt_sent`, `mfa_prompt_approved`, `mfa_prompt_denied`,
`mfa_expired`), and request 12 (1327-1328) repeats "seven". Plan 1283 keys `where.id` on "the id
the unlock was posted for", which by F2 may be a name or a generated id, so two rows for one lock
can carry different ids.
Fix: amend 1255 to list all four kinds, say "eight" in 1281 and 1328, and use the found object's
`id` (F2).

**F10 (minor). The right-first-factor oracle is stated for sign-in but not for a lock.** Plan
826-827 says the `mfaRequired` answer tells the player the password was right, as a real second
prompt does. Section 5.6 step 1 (733-735) says only that a wrong guess learns nothing. For a lock
the `secondStep` body equally confirms the first factor before the second is given, and for
`biometric`, `bluetooth` and `ble` (client-trusted first factors, `game.rb:4652-4657`,
`4757-4760`) it is sent to any well-formed post. That is acceptable and teaches the real
behaviour, but it should be written down. `number` in that answer is the player's own screen
(as for sign-in) and `ownPhone` follows a reset the player caused, so neither grants anything
unearned; `npcId` names the owner, which `owner` already ships.
Fix: one sentence in 5.6 step 3 or section 7: "the `secondStep` answer confirms the first factor,
as `mfaRequired` does; it carries nothing else the player has not earned".

**F11 (minor). A `passed` record is not tied to a first factor, and that is fine, but say why
the order cannot be reversed.** The brief asked whether a player can pass the step first and
then try first factors freely, or pass once and reuse it. From plan 738-753: a record is only
written by the gate, which runs only after `validate_unlock` is true (`games_controller.rb:1226`,
`1228-1253`), so the step cannot come first; a pass is spent by the open and the lock then stays
open (`object_unlocked?`, `room_unlocked?`), so nothing is reused. A `passed` record left behind
when the re-post is refused (scope lapsed, route room unpromoted) lasts until a right first
factor opens the lock, which only ever asks the player for what they had already given. The
bound is one record per `secondStep` lock (plan 914). The plan never says "the step cannot be
taken first"; add it to 5.6, since it is the property a reader looks for. No other change.

**F12 (minor). Beat ids clash with stage ids, and two S8c beats do not follow from the cast.**
The S8c beats are named L1 to L7 (plan 1188-1194) while the stages are L1 and L2 (146-147); "L7
(stage L2)" shows the clash. Beat L5 says an archive with the high-awareness owner "never opens",
but in F11 (1143) the player has taken that owner's phone, and a held phone approves a push
(plan 22-23, 720-721): if L5's kind is `push` the player can open it. L5 does not name its kind.
Beat L4 uses code owner A's device, which the player dropped in F5 (1137); L4 needs a pick-up
step. L6 names no owner.
Fix: rename the beats K1 to K7 (or F19 to F25); give L5 an owner the player never holds a phone
for (the low-awareness push owner has none, but approves when pestered, so add a ninth, careful
owner with no phone, or make L5 a number-matching lock on the F13 owner before the knock-out);
add the pick-up to L4 and an owner to L6.

**F13 (minor). The section 3 M1a row still omits the code-step closure** (handover item 1).
Plan 140 lists M1a's additions and its done-when; it names neither `closedAt`, the
`codeLocked` refusal nor the `mfa_code_locked` row, which section 13 assigns to M1a (1265) and
section 11 tests (1087).
Fix: add "the thirty-code closure (`closedAt`, `codeLocked`, `mfa_code_locked`)" to the M1a row.

**F14 (minor). The S8c feature id is missing from the landing docs line.** Plan 1207-1208 names
feature index rows A22 and A23 only; S8c's id is request 11 (1325-1326).
Fix: "rows A22, A23 and the S8c id (request 11)".

**F15 (minor). Section 12's `game.rb` row does not carry F2's change.** If F2 is accepted, the
`filtered_room_data` unlocked-object marker (`game.rb:2999-3010`) and `unlock_object!`'s write
become shared-file edits; plan 1221 lists neither.

**F16 (minor). Question 8 is two unrelated questions.** Plan 1393-1400 asks whether a lock's
approval lapses and, in the same item, whether a helpdesk's `maxTries` stop lifts. They have
different owners (S8c, S8b) and different recommendations' reasons, and section 9 (962) cites
"open question 8" for the desk half only.
Fix: split into 8 (lock approval) and 9 (desk stop), and point 962 at 9.

**F17 (minor). Choices made silently that the user should be asked.** None of these is in
section 15:
- Whether an NPC that may open a lock (`unlockable`, `unlockDoor`) skips its second step (F1).
- Which lock families take `code` (F4).
- Whether a held phone lists and approves requests with no pane open, for sign-in as for locks
  (F5).
- Which door openers outside `/unlock` skip a door's step (F3), when L2 is built.
Fix: add them as questions 10 to 13 with options and a recommendation each, or settle the
low-stakes ones (F5, F3) in 5.5 and ask only F1 and F4.

**N1 (nit).** Plan 266-267: "`zip_archive` exists and already locks this way" is true of the
scenario (`test_access_signin/scenario.json.erb:78-95`), not of the engine: nothing in `app/`,
`public/break_escape/js` or the schema names the type. Say "any object with `contents` and a
`password` lock; `zip_archive` is the sprite and type name scenarios already use".

**N2 (nit).** Plan 1174 tests "an NPC mapping ... opens the lock with no step" for an object;
`unlockDoor` mappings open doors only (`game.rb:5041-5048`), an object's NPC route is
`unlockable` (`game.rb:5068-5073`). Name both.

**N3 (nit).** Plan 1204 "L1 adds no file outside its tests" reads as "edits no file"; section 12
then lists three L1 edits (1234). Say "no new file".

## R3 items

| R3 item | Status | Where |
|---|---|---|
| N1 thirty wrong codes, decided silently | Closed: a five-minute closure on server time, asked as question 5, consistent at 470-477, 726-729, 820, 1087, 1265, 1367-1379 | M1a row still silent (F13) |
| N2 remembered code tied to its device | Closed: `lastRead` keyed by `npcId` and `source`, `codeFor` matches the enrolled device; a re-enrolled device answers `enrolled: false` (589-594, 644-651, 819) | |
| N3 helpdesk rows tell accounts apart | Closed: every `helpdesk_request` row is `as: { typed: }` (1250-1254, 1270); S9 asked to recompute the row ceiling (request 8) | depends on S9's answer |
| N4 blocked branch saves every post | Closed: `once: true`, `save!` only when stored (1270) | |
| N5 merge rule paraphrase | Closed (1247-1249) | |
| N6 `typeToSignIn` mapping | Closed as far as read (394-409, 575); client branch not re-read | partly checked |
| N7 proof 6 one-off scan | Closed as a standing validator warning (960, proof 4 at 1051-1053) | |
| N8 saved connection outlives a reset | Closed: `password_changed` until a typed sign-in, `accountResets.typed` (398-406, 912, F17 beat) | |
| Helpdesk `maxTries` no-stranding | Closed: warning, error when the graph marks the grant as the only key (962), question 8 second half | Q8 should be split (F16) |
| N9 to N13 nits | Not re-checked one by one; no stale wording found by grep | unchecked |

## Binding rules

Sign-in order is Route, Lockout, Password, Admission, second step, Session (plan 340-355):
matches the agreed order. The device is a real item, opened from the inventory or the sign-in
screen (651, 787-789). A policy's kind is public and its answers are not (849-869), and S8c
follows it for `secondStep`. Spoken lines stay in ink or bark fields (229, 794-795, question 2).
No runtime LLMs anywhere. Log rows go through `write_log_row!`, snake_case events, no secret in
any detail (1290-1291); S8c's `method` detail is the method name, never the attempt (1285-1286).
Pixel-art rules: the frames named (device frame, monitor frame, VT323) are consistent with the
UI rules; X closes (786). No breach found; F9 is wording only.

## Length and structure

The plan is 1400 lines, 300 over its own 1000-line target before S8c was added. Trim list
(nothing a builder needs is lost):

| Lines | Cut |
|---|---|
| 33-37 | "Which ways in" repeats 380-386 of 5.2; keep one sentence pointing at 5.2 |
| 117-131 (2.4) | the first two bullets repeat 5.3's client description (handover item 2) |
| 153-161 | keep the three later slices as one line each; the flag-lock one repeats 261 |
| 254-263 | the kinds table and 5.6's `CODE_LOCK_TYPES`/`PUSH_LOCK_TYPES` (702-706) say the same; keep the table, cite it from 5.6 |
| 265-271 | the archive paragraph repeats question 6 and section 7's last row; keep two sentences |
| 686-699 | merge 5.4 and 5.5 into one short section (handover item 3) |
| 755-760 | restates step 5 and section 7; keep the reach sentence only |
| 1016-1031 | rows that only say "read only when the field is set" (1020, 1024, 1027, 1028, 1031) collapse into one line |
| 1095-1111 | the JS test paragraph as a table (handover item 2) |
| 1297-1310 | requests 1 to 6 are "as agreed" or already settled; one line each |

That is about 90 to 110 lines.

**Split recommendation: split S8c into `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md`.**
For: S8c has its own feature id (request 11), its own stages (L1, L2), its own touch points
(`/unlock`, the pads, `lock-scope-refusal.js`, `lock_key_diff.rb`) and its own risks (F1 to F3,
F6 are all S8c), and its sections are spread through ten of fifteen sections of this file, which
is why the planner who added it did not re-read the rest. On its own it would be about 250
lines: 4.3, 5.6, its rows of 6, 7, 8, 9, 10, 11, 13 and questions 6 to 8. This plan would drop
to about 1150 lines, near its target after the trims. Against: S8c reuses `MfaAccess`,
`MfaModel`, the `/mfa/*` routes and the phone and device scenes, so the new file must cite
sections 5.1, 5.2, 6 and 7 here rather than repeat them, and a change to the shared functions
must be checked in both. That cost is small because 5.2 already defines the functions by owner
and subject (331-338), which is the seam a split needs. Keep in this plan only the subject
sentence in 5.2 and one row in section 3's "Later slices" pointing at the new file.

## Not checked

- Whether a `secondStep` archive inside a declared grant (`held_grant_items`, `game.rb:4886-4891`,
  `DeclaredGrants.strip_all_grant_contents!` at `game.rb:7176`) has a contents route other than
  `/unlock` and `GET /container`.
- The client: whether the `password` and `pin` pads open locally on a 200 `success: false`
  answer, and how `notifyServerUnlock` callers (`unlock-system.js:1120-1526`) treat it (L2).
- Section 5.2 from 416 to 560 and 5.3 from 561 to 686 were read only in part; R3 N6 and N9 to
  N13 were not re-checked one by one.
- The log plan's helper wording (handover gotcha 2) was not re-read against S9.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 4 | F1 `npc` skip is a client-triggerable bypass; F2 name aliasing ships a `secondStep` object's contents; F3 door openers outside `/unlock`; F6 `doors[]` entries never read |
| Minor | 12 | F4, F5, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17 |
| Nit | 4 | F7, N1, N2, N3 |

**Verdict: not ready to build S8c. Fix F1, F2 and F6 (and F3 before L2), ask the questions in
F17, and split S8c into its own plan. S8a and S8b need only the minor fixes.**
