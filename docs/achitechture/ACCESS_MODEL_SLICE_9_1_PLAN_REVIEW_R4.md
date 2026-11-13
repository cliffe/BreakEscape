# Access model slice 9.1 plan: adversarial review, round 4

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` as re-grounded on the merged `main`
(commit `2bd7ea23d` on branch `claude/break-escape-access-design-090sjx`), against the code on the
same branch and against `ACCESS_MODEL_SLICE_9_2_PLAN.md` and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` (section 3, the door work) as they stand at the time of
reading. Nothing was run and no server was touched; every finding is from reading code and
documents. Line numbers below are for the current tree unless a plan line is meant (written
"plan :N").

**Counts: 0 blockers, 0 majors, 10 minors.**

**Verdict in short.** The re-grounding is sound. The `locksScreen` habit now fills the field the
client already reads (the owner's `screenHabit`), never overrides an authored one, and writes
nothing onto objects, so it cannot turn an ordinary object into a workstation. The server's claim
gap is real and the fix (`AccessIdentities.screen_always_locks?`) matches `decideLocked` and the
office life validator's `habit_leaves_open?` case by case. The `screen_habits:` keyword on
`ValidateNpcNeeds.check` is the right size and touches the one line that needs it. Step 5's gate
contract is restated correctly against the owner's turn-back rule. Both round 3 majors are closed.
What is left is wording, one test scope and cross-plan text the orchestrator should correct.
Steps 0 to 4, 6 and 7 can be built now, in the sequence 14.5 gives; step 5 waits for the engine
plan's door work (E1 item 3, not built); step 8 waits for the lab's feedback pass and 9.3's lab
step.

## 1. Round 3 findings

| # | Round 3 finding | Now | Evidence |
|---|---|---|---|
| R3-M1 | `guessable` let short runs through | **Resolved** | 7.2 test 1 now splits into four kinds of piece (plan :923-943): word parts and number parts need a source, fixed pieces (one or two letters, one digit) and symbols must be in the pattern clue's own text, and at least one word or number part must come from outside the clue. Every character is accounted for. Step 3's fixtures cover `Rex2019!`, `Jo1987!`, `Biscuit7!` and the capitals split (plan :1253-1267) |
| R3-M2 | Lock severities contradicted each other | **Resolved** | `check_access_model` is left unchanged and reads authored data only (plan :815-820); a habit-sourced roll is one line from `ValidateNpcHabits` (warning by name, suggestion from `medium`); the screen state mapping rule reads the effective lock in `decideLocked`'s order with the policy first and treats a late lock as silencing (plan :893-918). H5 and `test_access_sessions`' `priya_pc` draw nothing; H8's task is on `pc_signed_in`, so the expected output (one suggestion, plan :1497-1505) holds |
| R3-m1 | `passwordPattern` described as a habit | Resolved | 5.1 (plan :439-443), `PARAMETERS` |
| R3-m2 | Mapping detection rule | Resolved | 7.2 "Screen state mappings" (plan :875-918): exact `<event>:<pcId>` patterns, both `wasLocked` polarities, `workstation_screen_changed`, the effective lock order |
| R3-m3 | Entry points | Resolved | `ValidateNpcHabits.check(json_data, expanded:, report:, scenario_dir:)` and the test's loading (plan :786-826) |
| R3-m4 | Stream D's edges | Resolved | D owns the `verify-run.rb` gate line and its test case (plan :1341-1342, :1769); step 5 waits for S (plan :1325-1327) |
| R3-m5 | The careful guard's tell outside the contract | Resolved | Contract item 6 (plan :633-643) and H9's "shut within one tick" |
| R3-m6 | H9 mappings need two entries | Resolved | H9 (plan :1491) and section 2 (plan :185-188) |
| R3-m7 | Stream D's edit understated | Resolved | Seven places listed (plan :603-612) |
| R3-m8 | `roles.staff.awareness` reach | Resolved | Section 4 (plan :325-332), step 1 tests (plan :1116-1118) |
| R3-m9 | Stamped `needsHome` ids | Resolved | `expanded_copy` stamps by the server's rule (plan :437); the id warning (plan :828-832). See R4-m3 for a scope gap in its test |
| R3-m10 | Table rows and sibling text | Resolved for this plan | E2b row (plan :1784). New stale sibling text: R4-m1 |
| R3-m11 | Clue behind its own account | Resolved | "behind lock" mark (plan :944-949) and graph clue edges |
| R3-m12 | Symbol test | Resolved | Common punctuation marked; README tells authors to write symbols literally (plan :958-960, :1431-1435) |

## 2. The new design checked against the code

**`locksScreen` fills `screenHabit`.** `decideLocked`
(`public/break_escape/js/systems/workstation-state.js:119-140`) reads the owner's habit only when
the object has no numeric `lockChance` and no `locksScreenOnLeave` key (`:122-129`); a habit with a
numeric `lockChance` and no `lockIfAwayOverSeconds` rolls with salt `habit:<id>:<leaves>`
(`:134-139`). `{ lockChance: 0 }`, `0.5` and `1` therefore give never, a seeded roll and always,
exactly as 4.1 says. The habit is read through `habitOf` (`:105-109`) from `env.npcs()`, which is
the NPC manager's live records (`:466-473`); `registerNPC` copies every field
(`systems/npc-manager.js:253`), so a filled `screenHabit` in room data is read the same as an
authored one. Nothing else in the client reads `screenHabit` (only `workstation-state.js:107`).
Correct.

**`screen_always_locks?` against `decideLocked` and `habit_leaves_open?`.** Case by case with the
plan's rule (plan :493-499):

| Input | `decideLocked` | `screen_always_locks?` | `!habit_leaves_open?` (`scripts/validate_npc_needs.rb:512-517`) |
|---|---|---|---|
| PC `lockChance` 1 / 0.5 / 0 | lock / roll / open | true / false / false | n/a (PC wins) |
| PC `locksScreenOnLeave` true, false, `null` | lock, open, lock (`!== false`) | true, false, true (`!= false`) | n/a |
| no PC field, no owner or no habit | lock (`:129`) | true | true |
| habit not a hash | lock (`habitOf` returns null) | true | true |
| habit `{ lockIfAwayOverSeconds: 20 }` | open on a short trip, else lock | false | false |
| habit `{ lockChance: 0.5 }` / `0` / `1` | roll / open / lock | false / false / true | false / false / true |

They agree. The one difference that remains is deliberate: a habit with `lockIfAwayOverSeconds`
answers "can leave open" whether or not the owner's trips are ever short, so the server may grant
a claim the client never offers (the client offers a claim only on an open screen). That is
harmless and is the same direction as the late locks today.

**The claim check.** Today `pc_always_locks?(pc)` (`app/models/break_escape/game.rb:1433-1439`)
reads only the PC and is called once (`:1512`); nothing else in `app`, `lib`, `scripts`, `tools`
or `test` calls it. The new signature with a default owner is safe. No scenario has a sign-in PC
whose owner has a `screenHabit` today (`test_needs_sims` has the only habits, on plain
workstations, `scenarios/test_needs_sims/scenario.json.erb:150-151, 218, 455, 593`; no scenario
has `lockType: "login"` there), so section 13's claim that no existing claim changes holds.

**The validator keyword.** `ValidateNpcNeeds.check(json)` takes one positional argument
(`scripts/validate_npc_needs.rb:16`); the `autoLockSeconds` rule reads the authored owner habit at
`:563` and judges "always" at `:564`, exactly the line the plan names. A keyword with default `{}`
keeps today's output for every existing caller. See R4-m5 for a pre-existing quirk the fixture
must avoid.

**Withholding, loader and autoload.** `WITHHELD_NPC_KEYS` already holds `awareness` and `habits`
(`game.rb:4048`); `prepare_scenario_data!` is normalise then stamp (`:802-807`), and the plan adds
the expansion after both; `lib/` is an autoload path. All as stated.

**Office life's cues and the locked look.** `onScreenChanged`
(`systems/npc-office-visuals.js:376-397`), `lockCuePlan` (`:90`), `cueLog` (`:256`, capped at 100,
`:395-396`) and the hand-off of sound from `screen-states.js` (`:99-107`) are as section 2 says. A
filled habit feeds `workstation_screen_changed` like any other, so the tells in 4.3 need no
client change.

**Step 5 against the merged gate.** `_playerBarred` (`systems/door-gates.js:531-539`),
`_holdGuards` (`:503-518`), `GUARD_TURN_BACK_MS` (`:64`), `update` (`:569-595`, barred shut at
`:589`, keep-open tests at `:586-588`), `open` (`:302-325`), `close` (`:420-433`), `openToPlayer`
(`:398-403`) and `playerOpen` going through `open()` (`:381-385`) are as contract items 1 and 4 to
6 say. Item 2 is unmet on `main`, as the plan says. Putting the `noHold` bar into `_playerBarred`
gives the keep-shut, the turn-back and the skipped hold through the branches that already read it
(`:581-582`, `:589`), which is the least code; it is also what makes a careful guard visibly
different (she turns back). The engine plan's own skipped-hold clause for "an `openToPlayer` that
says no for another reason" (its section 3, "Three narrowings") covers the same case a second way;
the two agree and neither breaks the other.

## 3. New findings

### Minor

**R4-m1. The engine plan's text on 9.1 is stale in three places, and step 5's clause has two
placement constraints the plan should state.**
*Where:* plan 5.4 "Who owns what" (:598-612) and step 5; engine plan section 3 ("**Slice 9.1
owns** one thing: who `openToPlayer(g)` says yes to"), its shared-files row for
`systems/door-gates.js` ("adds `noHold`, `lastGuards` and one clause in `openToPlayer`"), and its
item 1 ("Slice 9.1 later replaces `locksScreenOnLeave` with `lockChance`").
*Evidence:* 9.1 now adds a clause to `_playerBarred` as well, and fills the owner's `screenHabit`
rather than any PC field. Separately, today's `_playerBarred` returns false at once for a gate with
no `playerMayPassIf` (`door-gates.js:532-533`), and the door work adds a room test to it ("The
barred rule gains the room": false while `playerRoom === g.securedRoom`).
*Fix:* the orchestrator corrects the three engine plan sentences. In 5.4, say the `noHold` clause
goes before the `playerMayPassIf` early return and under the door work's room test, so a player
inside the secured room is never barred by a careful guard either.

**R4-m2. H9's "walks into it, is stopped, the refusal toast shows, `door_gate_denied` fires"
depends on timing.**
*Where:* H9 (plan :1491), the task row (plan :1471).
*Evidence:* with `noHold` in `_playerBarred`, the open gate shuts on the first tick the player is
within the radius and nobody is in the doorway (`door-gates.js:588-589`). Unless Sara is still in
the doorway, the door is shut before the player reaches its body, and a bump on a shut gate stays
silent (engine plan section 3, "The bump"). So the walk produces no toast and no
`door_gate_denied`, and the task never completes from a walk. A click on a shut gate does emit
`door_gate_denied` (the gate branch of `handleDoorInteraction`).
*Fix:* in H9, say the denial is produced by a click on the shut door (or by a walk only while she
is still in the doorway), and have the scripted run click.

**R4-m3. `expanded_copy` stamps fewer ids than the server, so step 1's equality test needs a
scope.**
*Where:* 5.1 `expanded_copy` (plan :437), step 1 "The scripts' copy agrees with the server" (plan
:1160-1164).
*Evidence:* `stamp_scenario_object_ids!` also stamps resource contents (`stamp_resource_content_ids!`,
9.3a) and account profile contents (`game.rb:4146-4160`). The plan's copy stamps room objects and
their contents only. "Every object id ... equals the same field in the scenario data of a game"
fails on a fixture with profiles or resources.
*Fix:* scope the test to `rooms.<id>.objects` and their contents, or have `expanded_copy` stamp all
four kinds by the same rule.

**R4-m4. Section 13 says the loader's order changes; it does not.**
*Where:* plan :1667-1669.
*Evidence:* `prepare_scenario_data!` already runs normalise then stamp (`game.rb:805-806`); 5.2
appends the expansion. Nothing is reordered.
*Fix:* reword as "the loader gains a third step after stamping".

**R4-m5. The office life validator does not treat a sign-in PC as a workstation, so the keyword's
fixture must be a plain workstation.**
*Where:* 7.2 "The office life lock check sees filled habits" (plan :807-815), step 3 fixture (plan
:1295-1299).
*Evidence:* `ValidateNpcNeeds.workstation?` is `workstation: true` or a lock field
(`scripts/validate_npc_needs.rb:501-503`), not `lockType: "login"`, unlike the client
(`workstation-state.js:89-93`) and `AccessIdentities.workstation?`. For `autoLockSeconds` on a
sign-in PC without `workstation: true` the rule warns "not a workstation: it never locks"
(`:558-559`) and never reaches `:563`. That warning is false today (the client idles such a PC
out) and is outside this slice.
*Fix:* say the fixture's PC is `workstation: true`. Log the false warning for office life's owner
(not for this slice to repair).

**R4-m6. A guest with no `screenHabit` "always locks" by `screen_always_locks?`; 14.2 should say
how 9.2 is meant to read that.**
*Where:* 14.2, "A guest and `locksScreen`" (plan :1708); 5.2 (plan :493-497).
*Evidence:* by the rule as written, an owner with no habit is "not an object, true". 9.2 calls the
function "with no PC field" for a guest, so every guest with no habit sends `leavesOpen: false` and
leaves nothing to claim. 9.2's own wording lists only a filled `always` or an authored
`lockChance` 1 as the careful cases (9.2 plan :724-730). This is a defect in 9.2's use (major there,
9.2 review R3-M5), but the interface row is in this plan.
*Fix:* in 14.2 state the guest rule explicitly: a guest is careful only when it has a
`screenHabit` object and `screen_always_locks?({}, guest)` is true; no habit leaves a borrowed PC
open (or, if the orchestrator prefers the other reading, say so and have 9.2's feature scenario
give its borrowers `locksScreen: never`).

**R4-m7. The graph's "unlocked screen" edge depends on where the habit came from, not on whether
the claim exists.**
*Where:* 7.3 (plan :1004-1008); step 4 tests (plan :1316-1319).
*Evidence:* the edge is drawn for a `locksScreen` of `never` or `sometimes`. After step 1, a
sign-in PC whose owner has an authored `screenHabit` of `{ lockChance: 0 }` is claimable on the
server, and so is one with PC `lockChance: 0`, but neither gets an edge. A builder will ask
whether to draw it for every PC where `screen_always_locks?` is false.
*Fix:* say it is drawn only when the owner has a `locksScreen` habit (so `dungeon-graph-identities.test.mjs`
stays unchanged), and list "edges for authored lock fields" as a later idea; or draw it for all
and accept the test change. Either is fine; pick one.

**R4-m8. Lab recipe step 7 asks "the server's claim check" about a plain workstation.**
*Where:* plan :1593-1601.
*Evidence:* Chris's `staff_pc` is `workstation: true` with no `lockType`
(`scenarios/lab_physical_pentest/scenario.json.erb:1376-1377`); `claim_login_session!` finds only
sign-in PCs (`find_login_pc`), so the claim check never sees it.
*Fix:* assert `Game#pc_always_locks?(staff_pc)` (or `screen_always_locks?`) directly, and keep the
claim assertion for `staff_pc_2` only.

**R4-m9. Cited line numbers have drifted since `5122a9c92`.**
*Where:* section 2 and elsewhere.
*Evidence:* later 9.3a commits moved `game.rb` by about three lines (`pc_always_locks?` :1433, not
:1430; `claim_login_session!` :1489; the refusal :1512; `WITHHELD_NPC_KEYS` :4048) and
`games_controller.rb` by about fourteen (`login_accounts` :1142). The plan already says to find
places by method name, so nothing is wrong; a builder should not be surprised.
*Fix:* none needed beyond the existing note; refresh at build time.

**R4-m10. Section 16 repeats a paragraph.**
*Where:* plan :1820-1825 ("Recorded, not asked" twice).
*Fix:* delete the second.

## 4. Existing scenarios

- **No scenario has `awareness`, `habits` or a top-level `roles` object.** The `awareness` hits
  under `scenarios/ca*` are `social.awareness` blocks; every top-level-looking `roles` is an access
  list (`"roles": [...]`). Step 1's one-off check will confirm.
- **`test_needs_sims`**: its authored `screenHabit`s (Amara `{ lockIfAwayOverSeconds: 20 }`,
  Sanjay `{ lockChance: 0 }`) are on plain workstations and are never overridden. Its
  `autoLockSeconds` warning output is unchanged when the keyword is not passed, and unchanged when
  it is, because no habit is filled there.
- **The lab** keeps `locksScreenOnLeave` until step 8; at step 8 the recipe's swap gives the same
  leaves (Chris locks every time, the keylogger capture's `wasLocked === true` at erb:1070 still
  fires; Melanie never locks and the claim at `staff_pc_2` is kept by the claim fix).
- **`test_access_sessions`, `test_access_signin`, `test_access_doors`**: no habits, explicit
  fields, claims unchanged; `priya_pc` under `instant_lock` draws no new warning.
- **Gates**: untouched until step 5; `test_gate_tailgate` and the lab's gate have
  `playerMayPassIf`, which the `noHold` clause ignores.

## 5. Fairness and chaining

- `locksScreen` remains the clearest chain: a visible tell (padlock look, office life's flash or
  glyph and chime, the indicator dot), a wait, a claimed desktop, and what it holds. Moving the
  choice onto the person without changing the client is the right shape.
- `writesDown` is fair: the note picture shows before the owner leaves, and the text is read only
  at the desk.
- `guessable` is now fair by construction: the validator refuses any character the player would
  have to guess, and the pattern clue is the lesson.
- `holdsDoors: false` is something a puzzle can stand on once the body rule lands; the careful
  guard's turn-back is a visible tell the student can learn from, and R4-m2 keeps the bark beat
  reliable.

## 6. Verdict by step

| Step | Ready? | Notes |
|---|---|---|
| 0 Confirm the locked look | Yes | Read-only, on :3001 |
| 1 Foundation | Yes | R4-m3 (test scope) and R4-m4 (wording) are one-line fixes |
| 2 Sticky note | Yes | After 9.3a's client stream C2 commits its `openLoginSignIn` branch (14.5) |
| 3 Validator | Yes | R4-m5 (fixture shape) |
| 4 Dungeon graph | Yes | Decide R4-m7 first |
| 5 `holdsDoors` | No, waits | For the engine plan's E1 item 3 (unbuilt); then R4-m1 and R4-m2 |
| 6 Playtest tooling | Yes | |
| 7 Feature scenario | Yes, after 1 to 3 and 6 | H9 added with step 5 |
| 8 Lab | No, waits | For the feedback pass and 9.3's lab step; R4-m8 |
| 9 Documents | Last | |

The orchestrator should also correct the engine plan's three stale sentences (R4-m1) and settle
the guest rule with 9.2 (R4-m6) before 9.2's sub-slice H is built.
