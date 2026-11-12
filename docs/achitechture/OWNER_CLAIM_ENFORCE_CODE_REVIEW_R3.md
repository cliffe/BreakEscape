# Owner claim enforcement (q78): code review, round 3

Branch `build/owner-claim`. R2 fixes in `d2b778432` and `920e85210`, reviewed against R2
(`8b4687830`), after merging `main` at `6a834437c` into the branch (`4191c69ad`, no conflicts).
2026-11-12.

The rule is q78: refuse an owner claim only where honest play could never leave the screen open,
and never refuse an honest one. R2 added a cautious layer (`might_leave`): a claim is allowed
wherever the owner has a movement source the precise mirror does not model exactly. This round
reads it from the "never refuse honest" side first.

## Summary

| Grade | Count |
|---|---|
| Blocker | 1 |
| Major | 0 |
| Minor | 1 |
| Nit | 4 |

R2's B1 and B2 are fixed as described, and the cautious layer does what the build log says. One
more way a need source changes room is still missed. The player's drop is covered, but a
knock-out drop of a colleague's held item, or an item a colleague was carrying, lands in the room
where that colleague is, and the mirror judges it on the colleague's authored room (B1). No
scenario has such an item, so no real claim is refused today. Across all 176 scenarios only
`test_access_habits noor_pc` has no route, and the validator warns there and nowhere else.

## How a screen opens

I traced every path from the engine to an open screen. `workstation-state.js` records an away
record in only two places. `onLeft` runs on `npc_left_post:*`, and `onKnockedOut` runs on
`npc_ko:*`. `onInteract` answers `signin` for an owner who is not present and has no away record,
and the client then asks for a password; it never sends a claim from there.

- `npc_left_post` has one emitter: `NPCNeedsSystem._leavePost` (`npc-needs.js:2893`). It fires
  only when `s.atPost` is true and the job is not at the own post. Every caller starts a job:
  `_startJob` from `_select` (use, magnet, social media, carry, errand, borrow), the fallback chain
  in `_turnBack`, `_startVisit` (checks from `_countFailure` and workaround visits from
  `npc-workarounds.js`, the only two `enqueueVisit` callers), `_claimAnswerer` (desk phones) and
  the carry retarget in `_refuseUse` (`npc-needs.js:3328`).
- `npc_ko:<id>` has one emitter: `damageNPC` in `npc-hostile.js:356`. Its only caller in play is
  `player-combat.js:730` (the punch), behind `attacksDisabled()`, and `damageNPC` itself refuses
  a `koImmune` NPC. Neither flag is changed at run time anywhere in the engine or the server.

## Completeness of the movement-path table

| Path | Verdict |
|---|---|
| `npc-needs.js` jobs (use, magnet, social, carry, errand, borrow, visit, phone answer, carry retarget) | All in the table. Precise or cautious allow as stated. |
| USB habit (from `main`: `_usbAttempt`, `usb_refused`) | Precise and not in the table (n1). `AccessWork.can_fail?` returns true through `usb_habit_refused?`, so the failure route (checks and workarounds) counts. The server's test does not ask whether the stick is still held, which only widens it. |
| Interest `noticeRadius` (from `main`) | Narrows the client (`_carryCandidate`). The mirror stays wider. |
| `npc-behavior.js` patrol, multi-room routes, timed `useObject` (from `main`), push-back return home | Never emits `npc_left_post`. Cautious allow for `behavior.patrol`. |
| `npc-manager.js` mappings: `patrolOverride`, `navigateToPlayer`, `needs` (control), `setVisible`, `setPatrolSpeed`, `changeStoryPath`, `delayMs` | Each acts on the mapping's own NPC. Covered as the table says. |
| Ink tags: `patrol_mode`, `personal_space`, `hostile`, `remove_npc`, `trigger_event`, `set_global` | `patrol_mode` is covered (cautious). `personal_space` is missing from the table (n1). It sets a behaviour distance and never emits a leave. `hostile` and `remove_npc` leave no away record. `trigger_event` can only fire the owner's own mappings, which are read statically. `set_global` can switch `offWhen` and `downIf`, which `can_fail?` and the source test already count. |
| Timers (`delayMs`, `timedConversation`, `sendTimedMessage`) | No movement of their own. |
| Combat | Precise (`disableAttacks`, `koImmune`, `open_without_estimate?`). |
| Phones (desk phones, Friendface phone from `main`) | Desk phones as in the table. `friendface-phone.js` moves nobody. |
| Seating | Needs moves only (`owner: 'needs'`). No job, no leave. |
| Objects that change room | `item-drop.js` is covered (R2 B1). The knock-out drop, the NPC carry drop and slot placement are missed (B1 below). |

## Findings

### B1 (blocker). A need source that a colleague drops or carries into another room is missed

R2 B1 made a `droppable: true` object roomless for the leash, because the player decides where it
lands. Three other engine paths also put an object with its affordance into a room other than its
authored one, and none of them needs `droppable`:

- **Knock-out drop.** `dropNPCItems` (`npc-hostile.js`, about line 550) places an NPC's
  `itemsHeld` in "the room the NPC fell in, not its home room" (`fellIn`). It copies the whole
  item (`{ ...item, takeable: true, ... }`), affordance included, and registers it in that room's
  `objects`. A colleague who walks for their own needs, patrols a route or chases the player
  through doors (`chaseAcrossRooms`) can be knocked out in the owner's room.
- **NPC carry drop.** `dropHeld` (`npc-needs.js:5034`) puts a carried item down where the carrier
  stands, in the carrier's current room, when a carry is aborted or refused with nowhere else to
  go (`npc-needs.js:3331`, `3638`). That covers any `needsTag` item that also has `satisfies`.
- **Slot placement.** `placeHeld` (`npc-needs.js:5056`) sets a reveal slot down at an accepting
  place, registered under that place's room.

The needs system judges the leash on the object's room now (`describe(roomId, ...)` keyed by
`window.rooms`). `scenario_objects` gives a nested hash its top-level room, so an item in a
colleague's `itemsHeld` is judged on the colleague's authored room. The cautious `droppable` check
does not catch these, because it requires `droppable: true`.

Probes against `leave_route` (owner Jo, a caffeine need, `needsRooms: ["office"]`, a colleague
authored in the kitchen):

- the colleague holds a coffee (`satisfies: ["caffeine"]`), attacks on, and Jo's
  `screenHabit: { lockIfAwayOverSeconds: 120 }` means a knock-out leave always locks: nil;
- the same with Jo `koImmune`: nil;
- a kitchen coffee with a `needsTag`, Jo `koImmune`: nil;
- control, the colleague's coffee `droppable: true`: `need:caffeine:b_coffee`.

In the first case honest play can open the screen. The player punches the colleague, who chases
them into the office and is knocked out there. The coffee drops on the office floor, and Jo gets
up for it. That leave has a short estimate, under the habit's threshold, so the screen stays
open.

No scenario has such an item. My sweep finds no `itemsHeld` entry and no `needsTag` object whose
affordance satisfies a need, in any of the 176 scenarios. So no claim is refused today.

Fix: treat these objects as roomless for the leash too, as `droppable?` objects are. That means
any object nested inside an NPC record, any object with a `needsTag`, and any object with an
`outputOf` (a slot). Apply it to need sources and to an interest's accepting places, and to the
cautious check's droppable test. Add the three probes above as unit cases that expect a route.
This only adds routes.

### m1 (minor). An unreadable story counts as no ink movement

`leave_route` reads the owner's story (and any `changeStoryPath` story) only to look for
`patrol_mode`. A story the reader cannot read counts as having no tag. That leans towards
refusing, while the module comment and q78 both lean towards allowing.

On the facts the choice is close to safe. `patrol_mode` is handled only in
`person-chat-conversation.js`, not in phone chat. Person-chat stories come only from
`GET /ink?npc=`, which finds the file through `InkStoryFile.find`, the same lookup the server's
reader uses. The one gap is an `INCLUDE`d `.ink` edited since the last compile. The game compiles
it (`compile: true`), but the claim reader takes the stale JSON and only the root `.ink`. Committed
stories are kept fresh by `ink_compiled_staleness_test.rb`, so this only happens in development.

It also cannot refuse an honest claim in today's engine. `patrol_mode` only turns on a patrol,
and a patrol never emits `npc_left_post` (next section), so the ink check is a hedge against a
future engine change. The hedge should still lean the q78 way. A `storyPath` that is set but
cannot be read should return `might:story_unread`. The other choice is to keep the current
behaviour and say in the comment that the check is a hedge only. Either fix is cheap. The first
can only add routes.

### n1 (nit). The movement-path table misses three rows

The build log's table should add the USB habit's refusal (precise, through `can_fail?`), the
`personal_space` ink tag (it moves the NPC back from the player and is never a leave) and the
paths in B1 (knock-out drop, carry drop, slot placement). `main`'s `noticeRadius` could be noted
under the interest row as a client narrowing.

### n2 (nit). The validator's story reader finds fewer files than the server's

`OwnerClaim.default_story_text` reads the `storyPath` and its `.ink`.
`InkStoryFile.compiled_json` also tries the `.ink.json` and plain `.json` spellings. Take a story
stored only under the other spelling, with no `.ink` beside it, and with a `patrol_mode` tag. The
server reads it, so it allows the claim, but the validator does not, so it warns. That is a false
warning, never a refusal. No scenario has one.

### n3 (nit). The cautious droppable test can never change a decision except to allow more

I checked whether the cautious droppable test can refuse an honest case. It cannot. It reads the
same affordance as the precise layer (`AccessWork.affordance`, own fields over the preset), and
magnets take their needs from the same `satisfies` (`_addMagnet`). An interest's droppable
accepting place is already allowed by the cautious `interest` row. Social media is already
allowed by `social_media`.

Once the precise layer has found nothing, the test can only match three kinds of droppable. One is
private to someone else, which `_permitted` refuses. One is a desk for a judged need, which
`_otherDesk` refuses. The last is the owner's own `needsHome`, and a use of that is never a leave.
In each case the client never leaves the post, so the test only ever allows more. Keep it as a
hedge or drop it. Both are safe.

### n4 (nit). `valid_need?` reads fewer values as numbers than `Number()` does

`normaliseNeed` uses `Number(raw.decayPerMin)`. `positive_number?` takes only numerics and numeric
strings. `Number(true)` is 1 and `Number([5])` is 5, so a need written with `true` or a
one-element array is live in the client and ignored by the mirror. Nobody writes that. The same
reader decides `needs_tracked?` (check 3), which predates this branch. Using
`AccessIdentities.js_number` in both would close it.

## Scripted moves and patrols

The fixer is right: neither emits `npc_left_post`. A patrol, a route, a bounds wander and the
push-back return home all move the sprite without calling into the needs system. `s.atPost`
stays true, so a patrolling owner counts as present and the PC answers `attended`.
`goToAndStay` from anyone but the needs system calls `onExternalMove` (`npc-behavior.js:2993`).
That aborts the job, sets `atPost` false and `scriptSuspended` true, and emits nothing. The owner
is then not present and has no away record, so the PC answers `signin`. The client asks for a
password and never sends a claim.

A claim therefore cannot honestly follow a patrol or a scripted move on its own. One works only
after a later needs leave. The `resume` command walks the owner home, `npc_returned_post` fires,
and the normal routes apply again. Those routes are judged on their own merits. The cautious
`patrol`, `scripted_move` and `ink_patrol` rows only allow more: a forged claim succeeds for such
an owner. Under q78 that is the accepted side, and it guards against an engine change. No change
needed.

One case does keep a screen open through a scripted move. An owner already away on a needs job
keeps the away record when a script moves them, because `_abortJob(s, 'script', { cancel: false })`
emits no return. That still needs the earlier needs leave, which the precise layer counts.

## Independent sweep (never block honest play)

My own script (session scratchpad, not the repo) renders every `scenario.json.erb` with the
validator's `render_erb_to_json` (176 of 176, none failed) and prepares each with
`NpcHabits.expanded_copy`. For every sign-in PC with an owner it records claim checks 3 to 7, then
`leave_route`, `precise_route` and `leave_route` with attacks forced off. It also runs
`check_access_model`.

- 16 PCs pass checks 3 to 7: `lab_physical_pentest staff_pc_2`, `test_capture_log mel_pc`, three
  in `test_access_habits` (dana, lena, noor), five in `test_access_sessions` (dana, omar, kai, mei,
  tom), four in `test_access_social` (theo, ruth, sade, and `l2_pc` for hamid) and two in
  `test_access_work` (omar, leo).
- Only `noor_pc` returns nil. Noor has `disableAttacks`, one `work` need with no plan met at her
  own PC, `needsRooms: ["noor_room"]`, a `facePlayer` behaviour, no mappings, no phones, prints or
  interests, and a story with no `patrol_mode`. Her refusal is real.
- The other 15 have precise routes: needs (habits dana and lena, `staff_pc_2`, `mel_pc`) or a
  knock-out with a need or failure route behind it. None depends on the cautious layer.
- `test_access_social` jake and lena reach only `might:social_media`, but check 6 refuses them
  first.
- `check_access_model` gives the never-leaves warning for `noor_pc` only, beside the older
  untracked-owner warning for `test_access_work pat_pc`. No false warning and none missed.
- No scenario has a held or tagged need source (B1), so the blocker refuses nothing today.

## Sync size

Unchanged. Check 10 reads `scenario_data` and, for an owner with no precise route, at most a few
story files at claim time. It writes nothing, and a refusal returns before `save!`. Nothing goes
into `player_state`, and the client sends nothing new.

## Live run

None. Nothing I found changes behaviour in a shipped scenario, and the merge brought in no change
to `workstation-state.js` or to the claim path.

## Tests run

All without the lock, after the merge.

- Rails: `test/unit/owner_claim_test.rb`,
  `test/controllers/break_escape/owner_claim_enforce_test.rb`,
  `test/models/break_escape/npc_habits_loader_test.rb`, `test/unit/access_identities_screen_test.rb`,
  `test/controllers/break_escape/access_model_login_test.rb`,
  `test/controllers/break_escape/capture_proofs_test.rb`,
  `test/controllers/break_escape/npc_lockout_l_test.rb`,
  `test/controllers/break_escape/game_state_locking_test.rb`,
  `test/controllers/break_escape/network_remote_signin_test.rb`,
  `test/models/break_escape/lab_physical_pentest_secrets_test.rb`,
  `test/controllers/break_escape/usb_habit_test.rb` and `test/unit/access_work_usb_habit_test.rb`.
  198 runs, 2253 assertions, 0 failures, 0 errors.
- Node: `test/js/validator-access-model.test.mjs` 35 of 35 pass;
  `test/js/validator-usb-habit.test.mjs` 25 of 25 pass.
- Validator on `test_access_habits`: no errors, and the never-leaves warning for `noor_pc` only.
