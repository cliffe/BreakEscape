# Access model slice 9.1 plan: adversarial review, round 2

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` as rewritten after round 1 (commit
`8ad5fa825`, unchanged since) against the code on branch `claude/break-escape-access-design-090sjx`.
Nothing was run against a server and nothing on :3000 or :3001 was touched. `bin/rails` cannot start
in the review environment (two gems are not installed), so every finding is from reading code, and
the one Rails task discussed (n5) was read from the installed gem's source, not run.

**The sibling plans moved during this review.** The slice 9.2 plan was rewritten and committed
(`d1ca882b9`) while this was being written; the slice 9.3 plan and the engine feedback plan have
uncommitted rewrites in the working tree, and each now has a round 1 review
(`ACCESS_MODEL_SLICE_9_3_PLAN_REVIEW_R1.md`, `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE_REVIEW_R1.md`).
Where a sibling is quoted, it is the copy on disc at the end of this review. The 9.1 plan was
written against the earlier drafts, so several of its statements about its neighbours are now out
of date. Those are findings N-M1 and N-M2.

**Counts: 0 blockers, 2 majors, 16 minors.**

**Verdict: the plan can be built, in two parts.** Three of the four habits (`locksScreen`,
`writesDown`, `password`) are ready to build once the two majors are written into the plan: that
is streams F, A, B, E, S (without beat H9) and L. The fourth, `holdsDoors`, must not start, in
step 1 or anywhere else, until the engine feedback plan's item 3 is settled and committed, and the
plan has to say so in its build steps and not only in a fallback paragraph (N-M1). Every round 1
blocker and major is resolved in the text. One more round is needed only to confirm the two majors
are closed; nothing found here needs a design decision from the user beyond the one the plan
already lists.

What was checked and holds (no finding): every `file:line` in section 2 (`game.rb:799`, `:824`,
`:895`, `:1397`, `:1406`, `:1900`, `:3968-3975`, `:3990`, `:4029`, `:4055`;
`games_controller.rb:306-308`, `:1106-1114`, `:1637-1639`; `workstation-state.js:72`, `:79`, `:92`;
`unlock-system.js:268-321`; `door-gates.js:75`, `:335-340`, `:410-418`, `:447-487`;
`validate_scenario.rb:20-21`, `:414-422`, `:5827`, `:6064-6095`, `:6498`;
`access_identities.rb:102-106`; `lib/break_escape/engine.rb:14`); the lab's two hand-set fields
and its guard test (`scenarios/lab_physical_pentest/scenario.json.erb:1077`, `:1165`,
`lab_physical_pentest_secrets_test.rb:58`, `:353`); that no scenario has `awareness` or `habits` on
an NPC, a top-level `roles`, or a gate without `playerMayPassIf`; that notes reach
`player_state['notes']` only from the client (`game.rb:371` has no caller); that a reset clears
them (`game.rb:89-106`); that a reload ends claims and keeps password sessions
(`games_controller.rb:384`, `game.rb:1495-1505`); that the sign-in screen's test state carries the
note's text for a scripted tester (`base-minigame.js`, `text`); that `notes_postit1` is preloaded
(`core/game.js:1320`).

## Round 1 blockers and majors

| # | Round 1 finding | Resolved? | Evidence in the rewritten plan, checked against the code |
|---|---|---|---|
| B1 | A `noHold` gate stopped barring once the guard left the radius | **Resolved in the design, conditional on item 3.** | 5.4 now bars on `lastGuards` (who the gate opened for), cleared in `close`, and step 5 and H9 test the approach after the guard has gone. That closes the hole at `door-gates.js:484-485`. The test wording no longer matches item 3 as rewritten (N-M1), and two small gaps remain (n9). |
| M1 | A soft bar gave a puzzle nothing to rely on | **Resolved by dependency, not by this plan.** | 5.4 stands `holdsDoors` on the hard bar of the feedback plan's item 3 and says the habit is dropped if item 3 is not built. Sound as a design. The build order does not follow it: step 1 builds the gate fill before item 3 is decided (N-M1). |
| M2 | The `low` preset turned on `writesDown` | **Resolved.** | 4.2: `false` in all three presets; section 3 records the decision; the lab's suggested third desk writes it by name (section 12). |
| M3 | A saved note puts the password in `savedNotes`, which section 6 and the scanner denied | **Resolved.** | Section 6 has the row; the scanner gets an order-dependent exception; step 2 tests both sides of the save; H3 saves before the reload. Confirmed in code that `savedNotes` is only ever what the client sent (`games_controller.rb:1637-1647`, `:306-308`), so the exception cannot hide a server leak. Three details are loose (n1, n3, n4). |
| M4 | The `guessable` check passed on one word | **Resolved.** | 7.2: every letter part and digit part must be sourced; step 3 has the three fixtures round 1 asked for; the lab recipe no longer marks Chris `guessable` (section 12, step 3). The matching rule still lets some false passes through (n10). |
| M5 | Library files did not fit the autoloader | **Resolved.** | `lib/break_escape/npc_habits.rb` and `lib/break_escape/npc_habits/clues.rb` are named for their constants and hold no `require_relative`; the scripts require them in order. This matches `engine.rb:14` and how `declared_grants.rb` is found. The `zeitwerk:check` step does not prove it on this Rails version (n5). |
| M6 | `verify-run.rb` could not produce the "not applied" lines | **Resolved.** | Step 6 prints values only; 5.1 and section 17 say why the report is not saved; the H4 and H9 "server record" cells now hold values and the "why" lines moved to the validator's expected output. |
| M7 | The premise rested on a locked look the user said was not showing | **Resolved.** | Step 0 probes it before anything is built; 4.3 says what each state shows, including the away and open screen; section 2 records the feedback plan's finding that the look works on this branch. Confirmed the indicator dots 4.3 names exist (`systems/lighting.js:102-109`). |

Round 1's twelve minors were all taken up in the rewrite (order of the loader, the social fields
removed, the roll severities, the expanded copy as an argument, the plain `ruby` subprocess test,
`no-store`, the reload wait, one note wording, malformed input, the gate route pattern, "shared
with"). None is reopened here.

## New findings: major

### N-M1. `holdsDoors` is built in step 1 before its dependency is decided, and its tests describe a version of item 3 that no longer exists

Three things, one fix.

**The build order contradicts the fallback.** 5.4 and section 15 say that if item 3 is not built,
"`holdsDoors` leaves the tables in 4.1 and 4.2, and `noHold` leaves the schema" and the library.
But step 1 (stream F, "first, alone") builds the gate fill in `npc_habits.rb`, puts `noHold` in the
schema, puts `holdsDoors` in `PRESETS`, and writes eight gate cases into `npc_habits_test.rb`
(plan lines 685-707). Stream D, the only consumer, cannot start until item 3 is committed. So for
however long that takes, the engine accepts `holdsDoors`, the `high` preset writes `noHold` onto
gate doors, and the client throws it away (`normaliseGate`, `door-gates.js:75-88`, keeps four keys
only). That is exactly what the plan's own principle rules out ("nothing is accepted in a scenario
that the engine does not yet act on", section 1), and if item 3 is declined the foundation has to
be taken apart again.

**Item 3 is not what 5.4 says it is.** The plan describes "a player-only body in the doorway" and
a bar that stays up through `holdMs` (5.4, step 5, H9). The feedback plan's round 1 review raised
three blockers and reopened the mechanism (its B3, M1, M2 and M11), and the rewrite of item 3 in
the working tree now reads differently
(`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, "Design: a gate is solid for a player it is not open
to"):

- the bar is the door's own body, driven by a pure predicate `blocksPlayer(g, { playerRoom, now })`,
  not a new body;
- while `blocksPlayer` is true for a player within the radius, the `holdMs` wait is skipped and the
  gate shuts as soon as no guard is near or crossing;
- the bump emits `door_gate_denied` at most once every 4 s per gate (`bumpDue`);
- the secured side is `g.securedRoom`, and a player inside it is never blocked;
- its stream owns `test/js/door-gates*.test.mjs`, a glob that takes in this plan's
  `door-gates-no-hold.test.mjs`.

Against that, step 5's bold test ("the guard walks through and out of the radius, the player comes
within it inside `holdMs`, and `openToPlayer` is still false and the bar still on") and H9's
("approaching one second after she has gone through, while the gate is still open, the player is
still stopped") describe a state item 3 now ends at once: the gate shuts, `close` clears
`lastGuards`, and there is nothing left to assert. H9's "each bump or click fires
`door_gate_denied`" is also no longer true.

**The decision is recorded in two places with two owners.** Section 16 asks the user whether the
hard bar is approved. The feedback plan's working copy records it as an orchestrator decision (its
X1) and its review says the same. Neither is built or re-reviewed.

Fix:

1. Move everything about `holdsDoors` out of step 1 and into step 5: the `PRESETS` row, the gate
   fill in `expand!`, the `noHold` schema property, the gate unit tests, the validator's two gate
   warnings and the graph label. Step 1 ships three habits ("all four keys" in 4.4, 5.1 and the
   tests becomes "every habit the build has"). Stream D then owns those lines of `npc_habits.rb`
   and the schema, after F, A and B have committed. Nothing else in the slice changes whether D is
   built or not.
2. Replace 5.4's description of item 3 with the contract this slice needs from it, in five lines,
   and make D's start condition "item 3 committed and meeting these": (a) `openToPlayer(g, now)`
   is the only question the bar asks; (b) while it answers no, a player outside the secured room
   cannot cross, by waiting or dashing, so `room_entered` means a permitted entry; (c) a refused
   bump emits `door_gate_denied`; (d) a clone hold answers yes first; (e) `close` is the one place
   a gate's open period ends.
3. Rewrite step 5's tests and H9 in item 3's final terms: call `blocksPlayer`, not "the bar";
   assert that after a `noHold` guard has gone the gate either still blocks or has shut, never
   that it is open and passable; one `door_gate_denied` per 4 s.
4. Section 16, question 1: say who decides and where it is recorded, to match the feedback plan.

### N-M2. The plan's build order and shared-file list are out of date against all three sibling plans

The plan says it "is complete without" the others for a builder, so what it says about order and
files is what a 9.1 builder will follow.

- **Order.** 14.5: "The first slice plan's order stands (9.1, then 9.2, then 9.3)". The 9.2 plan
  now opens with "The expected build order is 9.3, then 9.1, then this slice" and lists 9.1's line
  as one to correct (its section 15, item 4). The 9.3 plan's decision 1 is to build first, and its
  review agrees (section 5.1, item 1). The feedback plan's order has its doors stream before this
  plan's stream D and 9.3's server stream before 9.1's edits to `game.rb`.
- **Files.** Section 15: "No other file is shared between streams" and 14.5 names three shared
  files. The feedback plan's table "Files shared with the sibling plans" lists what 9.1's streams
  share with builds that are expected to land first or alongside:

  | File | 9.1 stream | Also edited by |
  |---|---|---|
  | `systems/unlock-system.js` | A (`openLoginSignIn`) | 9.3 (the remote sign-in branch in the same function), 9.2, the feedback doors stream |
  | `app/models/break_escape/game.rb` (`attach_login_accounts!`, `:1900`) | A | 9.3 adds `host` and a network pass in the same few lines (9.3 review, 5.1 item 7) |
  | `games_controller.rb`, `pc-sessions.js`, `api-client.js`, `core/game.js` | A | 9.2 and 9.3 |
  | `systems/door-gates.js`, `test/js/door-gates*.test.mjs` | D | the feedback doors stream owns both |
  | `tools/playtest/lib/access_leak_scanner.rb`, `verify-run.rb` | E | 9.3, then the feedback capture stream, then 9.1 |
  | `scripts/validate_scenario.rb`, `scenario-schema.json`, `generate_dungeon_graph.rb` | F, B | 9.2, 9.3 and three feedback streams |
  | `scenarios/lab_physical_pentest/`, `lab_physical_pentest_secrets_test.rb` | L | the feedback content pass and 9.3's lab step, which turns `usb_target_pc` into a sign-in PC |

- **Effect.** If 9.3 lands first, as all three siblings expect, the line numbers this plan gives
  for `openLoginSignIn`, `attach_login_accounts!` and the scanner will have moved, and section 12
  ("When") names only the feedback pass as the edit the lab step must follow.

Fix: in 14.5 and 15, state the order the siblings agree (9.3, then 9.1, then 9.2; the feedback
doors stream before stream D; the lab step after both the feedback content pass and 9.3's lab
step); replace "no other file is shared" with the table above or a pointer to the feedback plan's
table; keep the rule the plan already has (re-read just before editing, own block only); and say
in section 2 that its line numbers are as of `210e48eec` and are to be found again by method name.

## New findings: minor

**n1. The `/login_accounts` exception in the leak scanner is under-specified.** Plan section 6 and
step 6: "a password in a `/login_accounts` answer is allowed for a PC whose owner has
`writesDown`". Four things a builder would guess. (a) The scanner strips the query string
(`access_leak_scanner.rb:277`), so the PC id must come from the answer's own `pc_id`
(`games_controller.rb:1113`). (b) The exception should hold only at `$.postitNote`, not anywhere in
the body. (c) Findings are raised per owner of a password value (`:306`); when two NPCs share a
password, a correct answer for Omar's PC would still raise a finding for the other NPC. The
exception has to cover the value, for that answer. (d) The scanner is built from scenario data
alone (`:51`, `access-leak-check.rb:27`); once 9.2 adds "or a done workaround" the truth is in
`player_state`. Fix: pass the game, and ask `game.written_down?(owner)`; write (a) to (c) into
step 6 with a fixture for the shared password.

**n2. The scanner's new "withheld key" finding needs a definition of an NPC record.** Section 6:
"any response that holds an NPC record with a `creds`, `role`, `awareness`, `habits` or
`workarounds` key". `social.characters` entries carry `"role"` and ship in the bootstrap as
authored (`scenarios/lab_social_engineering/scenario.json.erb:638-644`); capture rows carry a role
label; `social.awareness` is a top-level block in every awareness course scenario. A loose rule
raises findings on correct builds of existing scenarios, and section 11's "no `habits` or
`awareness` key in any response" read literally would too. Fix: an NPC record is a hash with
`npcType`, or an element of an array under a key named `npcs`; add one fixture with a social
character that has `role` and must not be reported.

**n3. Two wording slips about saved notes.** Section 6 and step 6 allow the password "inside
`savedNotes` or a notes sync". The sync answer holds no notes (`games_controller.rb:770-773`), and
the scanner reads responses only, so there is nothing to allow there. And "reads the earlier lines
of the same responses file" should be "an earlier line of any file given, in the order given",
since `access-leak-check.rb:15-33` takes several. Without that, a run resumed in a second capture
file reports the tester's own saved note.

**n4. Saving the note closes the sign-in screen, which H3 does not allow for.** "Add to Notepad"
starts the notes minigame, and starting a minigame ends the one that is running
(`minigame-manager.js:61-68`); the state kept for a return is written to
`window.pendingPasswordReturn` (`password-minigame.js:771`) and read nowhere. So after the save the
tester is back in the room and must click `omar_pc` again (a second `pc_signin_shown` and a second
`/login_accounts`). Fix: say so in H3 and `PLAYTEST.md`, or the regression tester reports a stuck
beat. Not this slice's bug to fix; worth a line in `docs/IDEAS_BACKLOG.md`.

**n5. `bin/rails zeitwerk:check` does not check `lib/` on this Rails version.** The engine is on
Rails 7.0.4 (`Gemfile.lock:133`). That version's task eager loads only eager load paths and lists
autoload-only paths, which `lib/` is (`engine.rb:14`), under "will only be checked if you
configure them to be eager loaded" (`railties-7.0.4/lib/rails/tasks/zeitwerk.rake`). It passes
whether or not the new files are named correctly. Fix: keep it, but make the proof a Rails test
that reaches `BreakEscape::NpcHabits` and `BreakEscape::NpcHabits::Clues` by name with no
`require` of either file (the loader test already does the first; add one line for the second).

**n6. Ownership by `needsHome` matches nil to nil on data with no ids.** `AccessIdentities.owner_id`
compares `npc['needsHome'] == obj['id']` (`access_identities.rb:144-149`), so an object with no id
is "owned" by the first NPC with no `needsHome`. The server runs after stamping, so it is safe
there. The validator's expanded copy is not stamped (plan 7.2), so a `workstation: true` object
with no authored id and no `screenOwner` would be filled from an unrelated NPC's habit and the
report would say so. Plan 5.2's rule for "a workstation by its own fields" also drops the id that
`isWorkstation` and `workstation?` both require. Fix: rule 1 in 5.2 requires a non-empty string
`id`; `expand!` never matches a missing id; one unit test.

**n7. `level_of` does not say whether the implicit `staff` role counts.** Section 4: "the first
of its roles (in the order written) that has one under the top-level `roles`". Every NPC with
`creds` also has an implicit `staff` (`identity_roles`, `access_identities.rb`, `game.rb`), and
`"roles": { "staff": { "awareness": "medium" } }` is the obvious way to set a site default. Fix:
say it uses `AccessIdentities.identity_roles(npc)`, authored roles first and implicit `staff` last,
and test it. 9.2 should resolve its own role defaults the same way.

**n8. The note picture is not specified enough to build once.** (a) 5.3 says "a PC's sprite when
its data has `hasPostit` or an authored `postitNote` that is shown"; section 13 says sign-in PCs
only. Authored notes sit on password locks in m01 to m04 and sis01, so the wider reading changes
shipped missions. State `lockType: "login"` only. (b) "The top corner": the workstation indicator
dot is at the top-right corner with a 10 to 14 px glow (`lighting.js:102-109`), the picture is 9 by
9 px on a 36 by 24 px monitor, and the feedback plan's padlock icon rises from the same monitor. Say
top-left, with a depth above the monitor and below the dot. (c) Add "did you notice the note on
the monitor before you clicked?" to the persona questions: at 9 px it may not read as a tell.

**n9. Two gaps in `lastGuards`.** `_npcNear` returns a boolean at the first match
(`door-gates.js:399-407`), so the builder needs a new helper that returns the ids; say so. And ids
are added "where `lastNpcNear` is set", which runs while the gate is shut too (`:452`): a holding
guard who stands near a gate kept shut by `closeNow` (`forcedUntil`) stays in the set, and the next
`noHold` guard's opening then lets the player through. Fix: reset the set in `open()` to the ids
near on that tick, and keep the clear in `close()`.

**n10. The `guessable` matching rule still passes passwords nobody could work out.** 7.2: a part
is sourced when it "appears" in readable text. (a) As a substring, the digit part `26` is sourced
by any `2026` or `126` in the scenario and `Spring` by "offspring". Match whole words, and whole
digit runs or the last two digits of a four-digit year. (b) Text that can be read only after
signing in as that account (its own profile, the contents of a PC only it can open) should not
count; exclude the account's own profile and own PC contents at least. (c) The server compares
passwords exactly, case included (`game.rb:1428`), and symbols, capitals and order have no source.
The report should count them ("2 capitals and 1 symbol have no source"), and the README section
should tell authors to give the pattern in the world (a password policy memo, a help desk note),
which is also the lesson.

**n11. `password` in the presets makes a claim the engine cannot make true.** The habit has no
run-time effect, so a preset value is only a statement about a password the author already wrote.
Every `low` NPC with an account then draws "guessable, not backed" and every `medium` one "reused,
nothing shares it", for ever: section 11 expects four such suggestions and the lab recipe tells
the builder to "accept the suggestion". Recommend `password` is explicit only, like `writesDown`
(the same reasoning as round 1's M2), or that a preset value prints in the habits report and
raises nothing. Also unspecified: the severity of a preset `strong` whose password is reused.

**n12. No warning for `never` on a plain workstation whose mapping needs a lock.** 7.2 warns for
`sometimes` on a workstation that a `workstation_owner_returned:<id>` mapping reads. With `never`
(a `low` owner, lockChance 0) the same mapping's `data.wasLocked` is false on every leave and the
capture never fires at all. The lab's keylogger is this shape (`scenario.json.erb:837`). Fix: warn
when lockChance resolves to 0 and a mapping on that PC has `wasLocked` in its condition.

**n13. The "sticky note" graph edge closes a loop.** 7.3 draws it from the owner's PC to the
account's node; the first slice already draws the account's node to that PC
(`generate_dungeon_graph.rb:338`). The graph's own legend says it is for spotting circular
dependencies (`:1417`). Draw the note edge from the PC's room, as the "unlocked screen" edge is.

**n14. A gate door is not "a door the server checks".** 5.3 says a puzzle that must not be
passable early keeps the PC behind one. A gated room is unlocked on the server by the guard's
first pass and its data is loaded into the browser then (`npc-behavior.js:664-672`,
`doors.js:651-656`), so `/login_accounts` answers for a `writesDown` PC behind a `noHold` gate from
that moment, to a modified client. The feedback plan now says the same in general ("a gate keeps a
player out of a room; it does not keep a secret"). Add that sentence to 5.3 and 5.4.

**n15. Delete the whole of `roles` from the bootstrap.** 5.2 deletes only `awareness` under each
role, leaving `roles: { front_desk: {} }` in the browser. Nothing on the client reads `roles`, and
9.2 deletes the whole key. One line, one rule for both slices.

**n16. Scripted run details.** (a) H8 records "the sequence for this seed"; if the first three
rolls come out the same the beat proves nothing. Say the builder picks the seed or PC id so that
both outcomes appear. (b) H9's timed approach depends on a 2.5 s default hold; give Sara's gate a
longer `holdMs` in the fixture so the script has a window (and see N-M1 for what it should assert).
(c) Step 6's `hasPostit` line in `verify-run.rb` needs `login_postit_for` to be public. (d) The
`habits` block and the validator's habits report name who never locks; persona testers must not
be shown either. Say so in section 12.

## Interfaces with slices 9.2 and 9.3

The 9.1 plan lists two disagreements with 9.2 (14.2) and none with 9.3 (14.3). 9.2's rewrite has
since taken 9.1's side on both; what is left is 9.1's own text.

| Question | 9.1 plan | 9.2 and 9.3 as they now stand | Recommended resolution |
|---|---|---|---|
| Where sticky note text is served | Only in `GET /login_accounts` for the owner's reachable PC, `no-store`; room data carries `hasPostit` only (5.3, 14.2 disagreement 1) | 9.2 section 6.1 and its section 15 table: "9.1's channel and helpers, exactly"; its workaround answers `{ pcId, hasPostit: true }`. 9.3's remote sign-in screen skips `/login_accounts`, so it shows no note | **Adopt 9.1's rule; treat as settled.** The code supports it: room data for a room is fetched before the player stands in it, on a door transition and when a guard's route loads it (`npc-behavior.js:664-672`), so text in room data is in the browser early. Rewrite 14.2 from "disagreement, proposed" to "agreed". Add one sentence, which neither plan has: a written-down password is never shown on a remote sign-in screen, because a note on a monitor cannot be read over a network (9.3 review, 5.1 item 5). |
| Whether the browser may read `locksScreen` | No habit reaches the browser; the server sends one boolean, "for example `locksBorrowed`" (14.2 disagreement 2) | 9.2 section 6.4 and routes table: the server sends `leavesOpen: false` in the `borrow_session` hand-over when `npc_habit(npc, "locksScreen")` is `always`, and its guest claim refuses on the same test (its check 7) | **The browser may not read the habit; the server decides and sends `leavesOpen`.** Take 9.2's name and sense in 14.2. Keep it in the hand-over, not in the NPC's standing plan, so it reaches the browser only when the borrow happens. `sometimes` counts as leaving open, with no roll at a borrowed PC. 9.1 provides `npc_habit` and nothing else. |
| `roles` in the bootstrap (not listed in 14.2) | Deletes `roles.<role>.awareness` | 9.2 deletes the whole of `roles` | 9.1 deletes the whole key (n15). |
| How a role default is resolved (not listed) | "First of its roles in the order written" | 9.2 gives role defaults under the same key | Both use `identity_roles` order, implicit `staff` last (n7). |
| Build order (not listed) | 9.1, 9.2, 9.3 | 9.3, 9.1, 9.2 | The siblings' order; fix 14.5 (N-M2). |
| The Wi-Fi key as a reused secret | `secret_homes` gains `networks.<id>.wifi.psk`, whichever lands second | 9.3 12.2 agrees; in the expected order 9.1 lands second | 9.1's step 3 adds the home and its fixture if `networks` is in the schema when it is built. Say so in step 3. |
| Feed posts as clues | 9.2 adds post text to `Clues.readable_texts` | 9.2 does so in its step C-2 | Settled. |

## The dependency on item 3

Covered in N-M1. In short: the design is right to stand on a hard bar, and the feedback plan's
rewrite of item 3 names this slice, keeps `openToPlayer` as the one question and gives 9.1 its one
clause. But item 3 is not approved in a form both plans agree on, not re-reviewed and not built;
its mechanism changed during this review; and 9.1's step 1, step 5 and H9 are written for the
earlier mechanism. `holdsDoors` should leave step 1 and wait whole.

## Fun, education and chaining

- **`locksScreen` is the strongest habit and is ready.** A real behaviour, a visible tell, a claim
  that ends when the owner comes back (time pressure), and a desktop that leads on. The control
  (lock on leaving, an auto lock policy) is something a student can do the same day. The `never`
  case is free once noticed, which is the point; the craft is in what the desktop then gives.
- **`writesDown` is one beat alone and a chain link with company.** Now that it is explicit, it is
  an author's choice, and the plan's own pairing (locks every time, password on the monitor) is the
  good version. Two things would make it land: the picture has to be seen (n8), and the account
  should open something other than its own PC, which the report line "opens only its own PC"
  rightly flags. The drawer note in section 17 is the version that chains best and should be
  scheduled with the first mission that uses the habit.
- **`password: guessable` is the best puzzle here and the easiest to make unfair.** Every part
  sourced is right. But the answer is checked exactly and a counted policy locks the username for
  the rest of the game, so an unsourced capital or symbol turns deduction into guessing. n10 and a
  pattern clue in the world fix that, and the pattern is itself what a cyber security awareness
  lesson teaches about predictable passwords.
- **`password: reused` chains well** (a locker, a Wi-Fi key or a captured sign-in opens an
  account) and "shared with" is correctly kept apart as a different lesson.
- **`holdsDoors` will be fair only if the door shows it.** With no stat on screen, a careful
  guard's gate and a careless one's look the same until the player walks into something solid.
  Item 3's rewrite helps: the gate does not linger open for a barred player, and the bump is
  answered at once by the refusal and the guard's bark. 9.1 should lean on that in 4.3 ("the door
  shuts on their heels") and give the feature scenario a bark on `door_gate_denied`. As a chain
  step it is good: it sends the player to copy a badge or find the colleague who holds doors.
- **Chaining for authors** is well served by the habits report and the labelled graph edges, once
  the note edge stops drawing a loop (n13). One gap: nothing lets a scenario credit "worked the
  password out" apart from "signed in by password"; that is acceptable for this slice.
- **Presets.** `low`, `medium` and `high` now mean something only for the screen (and, later, the
  door). That is honest and simple. Taking `password` out of the presets (n11) would make one word
  on an NPC do exactly what the validator says it did, with no standing suggestions.

## What to change before building

1. N-M1: move all of `holdsDoors` to step 5, state the contract with item 3, rewrite step 5 and H9
   in item 3's final terms.
2. N-M2: the sibling order and the shared-file table in 14.5 and 15.
3. 14.2: mark both disagreements settled, with `leavesOpen` and the remote sign-in sentence.
4. The minors a builder would otherwise guess: n1, n2, n6, n7, n8, n9.

With 1 to 3 written in, streams F, A, B, E, S (without H9) and L can be built from this plan.
