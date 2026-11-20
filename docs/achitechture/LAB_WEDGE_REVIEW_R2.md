# Lab wedge review, round 2

Scope: `build/lab-wedge`, the R1 fixes 1fc5f8ee2..27be05acf (commits 6f27be98a, 2c1c71429 and the two build-log commits), read against `LAB_WEDGE_REVIEW_R1.md`, the build log and shots `ux-shots/lab-wedge-r1fix/r1-01` to `r1-12`. Read only. No server was run.

Checks run:
- Validator (`--no-graph`) on `lab_physical_pentest`: 0 ❌. The two warnings this branch adds are the intended two `room_entered:hall` mappings on `ruth_phone` and the two extinguishers 0 px apart.
- `inklecate` on `kieran.ink`, `dev.ink`, `ruth_phone.ink` and `ruth_debrief.ink`: all compile, and each output equals the committed `.json`.
- `lab_physical_pentest_wedge_test.rb`, `lab_physical_pentest_secrets_test.rb` and `lab_physical_pentest_network_test.rb`: 48 runs, 1333 assertions, 0 failures.

Paths are relative to the worktree. `SCN` = `scenarios/lab_physical_pentest/scenario.json.erb`.

## Verdict

No blockers and no M findings. Every R1 fix is real. The courier choice meets the cheat policy as a best-effort ink step: the server checks the NPC, the door and the encounter, but not the hi-vis. That is acceptable here because honest play always reaches P1 (the wedge follows the first walk into the hall, and a staff card opens it by role). The remaining findings are wording and documentation. m1 to m3 are voiced lines, so fix them before the TTS pass.

## R1 fixes: are they real?

| R1 | Real? | Evidence |
|---|---|---|
| M1 jam clears | Yes | `SCN:751` clears `lw_post_printer_jammed` once the door is propped. The wedge test runs a real workaround and checks that `AccessWork.cause_holds?` is false afterwards. Live (game 2997): 0 failed uses and 0 mutters in the 301 s after the wedge, with a successful use every 25 s. The readable was open for the whole watch, but with the cause gone no failure can be judged, so the result does not depend on the modal. |
| M2 lesson readable | Yes | `__test.interact('post_door_wedge')` from the hall reported `approached-then-interacted`, with the player in `hall`. A real click picks the revealed object: the tap filter in `game.js` keeps only `o.interactable` objects, so `hall_extinguisher` (`interactable: false`) never takes the click. |
| m1 Ruth and Dev | Partly | Neither line now promises an open door. The new wording raises two smaller problems; see m2 and m3. |
| m2 debrief | Partly | The propped-door line is added and its condition and VAR are in place. The disposal line still overclaims on two of its three routes; see m1. |
| m3 toast and title | Yes | `SCN:447` and `SCN:409`; shot r1-03. |
| m4 bark pools | Yes | The pools are on Kieran's record (`SCN:1203` to `1207`) and the test checks they are not scenario-wide. "Twenty times" now appears only in `wk_prop_door`. |
| m5 courier | Yes, best effort | See question 2. |
| m6 jam trigger | Yes | Test `the jam is set once…` and the ERB comment at `SCN:743`. |
| m7 withheld checks | Yes | See question 3. |
| m8 extinguisher | Yes | Shots r1-01 and r1-04; the backlog line is added. See question 4. |
| m9 clone | Yes | The build log is corrected; the test pins no `rfidCard` and no clone tag. |
| m10 reload | Yes | `reload_r1.mjs`: the extinguisher shows, the door draws open, no toast refires, Kieran stays put, and the walk-in credits `opt_propped`. |

## The questions

**2. Courier choice.** `validate_unlock` (`app/models/break_escape/game.rb`) accepts `method: 'npc'` for P1 when `kieran` is in `encounteredNPCs` and `unlockable` holds `P1` (`game.rb:3078`, then `validate_npc_unlock` at `game.rb:3488`). Nothing on the server reads `courier_ready` or the ink state. `encounteredNPCs` is filled whenever reception's room data loads (`track_npc_encounters`), so a client that posts `unlock door P1 kieran npc` can open P1 at any point after reception has loaded, hi-vis or not.

Under the policy this is the "ink-gated step with an NPC sanity check" bucket. q78 also applies: honest play reaches the same access, because the wedge always follows the first walk into the hall (about 50 s), and a pocketed or issued staff card opens P1 by role. P1 holds only optional findings, and `opt_propped` still needs a walk-in after the door is propped (`SCN:752`), so the shortcut does not earn the beat's credit. m02, m06 and m10 use the same unguarded `unlockable` pattern. One difference here: `courier_ready` is a server-owned wearable global (`SCN:1023`), so a server gate would actually be sound if one were ever wanted. See m4.

The real hi-vis path should work. The vest's wear goes through `wearables.js`, which writes `courier_ready` locally through `global-writer.js` once the server says yes, and Kieran's ink declares `VAR courier_ready`, as `dev.ink` does for its courier branch. `dev.ink`'s branch already plays on the real vest. The vest is `unseenOnly`, so the player puts it on in the hall or the briefing room and then walks into reception, which suits this choice. Still, the only live proof set the global directly; see m5.

**3. Withheld checks.** Before the wedge, the tests hid every resource id, name, host and observation. Now they hide the same set less one id, `lw_post_printer`, excluded by id. That id is served in Kieran's work plan by design, and the printer's name is still checked (`assert_includes hidden, all['lw_post_printer']['name']`). So the check matches the pre-wedge one except for one id served on purpose, and it is stronger than R1's version (no property filter for a typo to slip through, plus `compact`). The old name "Post-room printer" no longer appears anywhere as a resource name. The lower-case story phrase "post-room printer" is still used in the coffee chatter (`SCN:44`), Chris's coffee exchange (`ink/hampshire.ink:45`), `kieran_laptop`'s observations (`SCN:1237`) and comments. That is correct: they are story text. The match is case-sensitive, and the ink is not part of the bootstrap or room answers.

**4. Two extinguishers.** The pairing is load-bearing. The engine has `revealOnGlobal` but no hide-on-global, so the plain one gives the before picture and the revealed one gives the click target afterwards. Moving them a tile apart, as the warning advises, would put two extinguishers in the doorway. The click is safe: both the tap filter (`game.js`, `o.interactable`) and the proximity pass (`interactions.js:216`) skip the plain one. The test pins the shared position and type. The warning must not go in `validator_known_failures.json`: that list matches ❌ lines only (`validator_report.rb` `emit`), so an entry for a warning would always count 0 and raise a "stale known failure" ❌. See m6 for the fix.

**5. Shot r1-07a.** It shows the extinguisher readable still open on the hall, and it was taken when `__test.enterRoom('P1')` returned `blocking-ui`. "Reader" here means the text reader (the readable), not the RFID reader. `dismiss()` in `lwr1/lib.mjs` calls `__test.dismissBlockingUi()` with no label. The readable has two buttons (the X and Close), and the bridge refuses to guess between them (`ambiguous-blocking-ui`, `docs/test-bridge.md:261`), so the modal stayed open. This is a fault in the proof script, not in the game: a player closes the readable and walks in, and the reload run then made the same walk-in and got the credit (r1-07). There is no game problem. See m9 for the script.

**6. New and reworded lines.** All of them are TTS-voiceable:
- Kieran's lines carry the exact `Kieran Doyle:` displayName prefix (`SCN:1178`), print no variables, have no inline stage directions and are under 30 words.
- The hub's `{&…}` sequence is a form the line walker expands (`ink_line_walker.rb:663`).
- Dev's lines are prefixed. Ruth's phone line follows her phone-self-prefix rule. Both debrief lines carry the `Ruth Adeyemi:` prefix.
- Kieran's chatter is on his record, where `ScenarioBarkValidator` reads NPC pools.

The choice `[Parcel for the post room. Can you let me in?]` is first-person speech with a real consequence, which is the guide's preferred shape. Two lines break "Dialogue must be supported by the scenario" in small ways (m3), and one hint lost its pointer (m2).

**7. Debrief and Ruth hint by route.**

| Route to the finding | Ruth's hint | Debrief |
|---|---|---|
| Floor printer (`floor_printout`) | Fits | The disposal line says "the open recycling", but this route has no recycling (m1) |
| Melanie's desk printout (`pierce_printout`) | Fits | The line says "printer trays", but this is a desk tray (m1) |
| P1 copier or waste console | Fits | Fits |
| Wedge walk-in | "Watch who uses it" fits before the wedge. After it, nobody is using the reader. The hint disappears once `kp_doc_disposal` is set, even if the door was never found (m2) | Fits |
| Courier let-in | Fits | No line, which is correct: `kp_propped_door` needs a walk-in after the prop |

The doc-disposal capture (`SCN:836`) still names "post & print room" as the host, and "client paper in open recycling", for every source.

## Findings

### m1. The disposal line and capture still describe the post room on two of three routes
`ink/ruth_debrief.ink:181` and the `doc_disposal` capture at `SCN:836` (roleLabel "Ledgerwell Ltd, post & print room", host "Post & print room", note "…client paper in open recycling"). A player who read only the floor printer or Melanie's desk printout hears about recycling they never saw, and their report shows the post room as the place. With P1 locked until the wedge, more players now take one of those routes.
Fix: debrief `Ruth Adeyemi: Payroll and client paper left out where anyone passing could read it. Secure print release, a clear desk and a locked waste bin shut that down.` Capture: roleLabel `Ledgerwell Ltd, print points and desks`, host `Print points`, note `Sensitive paper left for the taking: uncollected printouts and paper left out where staff and visitors pass. A finding on its own; nothing was removed.` The debrief line is voiced, so it goes on the TTS list.

### m2. Ruth's hint lost what to look at, and it ties the door beat to the paper beat
`ink/ruth_phone.ink:98`. The old line said what to look at ("the printer tray and the bins"). The new one says where, then adds a pointer to the badge door. That choice is gated on `not kp_doc_disposal`, so a player who reads the floor printer loses the door pointer as well. After the wedge, "watch who uses it" points at a reader nobody uses.
Fix: keep the hint about paper and leave the door to the toast: `Look where the paper goes: printer trays and bins, on the floor and in the post room off the corridor.` (19 words, under the 25-word phone limit.) Voiced, so it goes on the TTS list.

### m3. Dev promises an escort, and he says it after the door is already open
`ink/dev.ink:59`: "he'll take you through". Kieran buzzes the door from his desk and does not walk (`kieran.ink:36`). Dev's branch is also gated only on `courier_ready` and `not pretext_used`, so after the wedge he still sends the player to Kieran, who no longer offers the choice.
Fix: `Dev Malhotra: Oh, the parcel! Kieran does the post, he'll let you in. He's on the desk next to me.` Optionally add `{ lw_post_door_propped: … }` with "Post room's off the hall, door's open anyway", which needs `VAR lw_post_door_propped` in `dev.ink`. Voiced.

### m4. Write the accepted client-trust gap down where the next reviewer will look
`SCN:1208`: the ERB comment on `unlockable` (`SCN:1210`) says only that the tag needs it. The build log records the policy call, but the scenario file and the backlog do not, so the next review will raise it again.
Fix: extend the comment: "Best effort under the cheat policy: the server checks Kieran, the encounter and P1, not the hi-vis. Accepted (q78): the wedge always opens P1 later, and a staff card opens it by role; opt_propped still needs a walk-in after the prop." Add a backlog line: an optional per-room server gate on `unlockable` (for example `unlockableWhen: { "P1": "courier_ready" }`), sound only for server-owned globals such as wearables. Build it only if a mission ever puts non-optional content behind such an unlock.

### m5. The courier choice has no proof on the real vest
The build log's game 2996 set `courier_ready` by hand. The code path matches Dev's working branch, so the risk is low, but the live-proof rule asks for the real path.
Fix: in the next live run, take `kit_hivis` in the briefing room, accept the wear prompt, walk into reception (do not set the global), talk to Kieran, pick the choice, then `enterRoom('P1')`. Record `courier_ready` before and after, and the toast.

### m6. Silence the 0 px warning in the validator, not the known-failures list
Validator rule 6 (`scripts/validate_scenario.rb`, the "two pinned objects inside one interaction range" block, line 4980) warns because "one click can open the other". That reason does not hold when either object is `interactable: false`. The engine's tap and proximity passes both skip such objects.
Fix: add `next if a['interactable'] == false || b['interactable'] == false` next to the existing `outputOf` skip, with a validator test. Until then, add a sentence to the comment at `SCN:1299`: "The validator's 0 px warning for this pair is expected; do not move them apart." A known-failures entry would not work, because that list covers ❌ lines only and an unused entry turns into a stale-entry ❌. The validator is shared tooling, so either do this in a small follow-up branch, or put the comment in this branch now.

### m7. The lab's walkthrough has no row for the new beat
`scenarios/lab_physical_pentest/PLAYTEST.md` has no row for Kieran, the jam, the wedge, `opt_propped` or the courier choice. It does have a row for every other optional.
Fix: add rows for the jam on the first walk into the hall, the wedge at about 50 s, `post_door_wedge` in the hall, the walk-in crediting `opt_propped` and `kp_propped_door`, and the courier choice (hi-vis on, reception, Kieran) with the `#unlock_door:P1` toast.

### m8. The lesson repeats P2's fire-door readable
The new readable's text in `post_door_wedge` (`SCN:1327`), "This is the commonest way an access control fails…" with door-held-open alarm and self-closer, teaches what `p2_fire_door` (`SCN:2597`) already teaches with nearly the same controls. This predates R2 and R1 did not raise it. A player who sees both reads the same lesson twice.
Fix: point the P1 text at what is new about it: an internal badge door, a member of staff, and a nuisance that outlives its cause. For example, replace the "commonest way" paragraph with "Unlike the fire door, this one was propped by someone with a badge, and it stayed wedged after the printer was fixed: the habit outlived the reason." This is not voiced.

### m9. The proof script cannot close a readable
`lwr1/lib.mjs` `dismiss()` (session scratchpad) calls `dismissBlockingUi()` with no label. The game-display readable has two buttons, so the bridge refuses (`ambiguous-blocking-ui`), and the next `enterRoom` returns `blocking-ui` (shot r1-07a). This is tooling only, not this branch's code.
Fix: call `dismissBlockingUi('Close')` for a `game-display-dialog`, and rerun the M2 to walk-in step without the reload.

## Counts

B 0, M 0, m 9.

## Merge verdict

Merge once m1 to m3 (voiced wording, before any TTS) and the comment halves of m4 and m6 are done. These are text edits plus the matching `inklecate` recompiles. m5 and m7 can go with the next live run. m6's validator change, m8 and m9 can follow on their own.

## For the user

1. **Courier unlock trust (question 2).** A client that has loaded reception can open the post room through Kieran without the hi-vis. I judge this acceptable under the cheat policy: honest play always gets there (the wedge, or a staff card), P1 is optional, and the propped-door credit still needs the walk-in. Do you want it left as best effort, with a comment and a backlog line, or a server gate on the hi-vis now?
2. **Voiced lines after these fixes.** On top of the build log's list, the fixes change Ruth's debrief disposal line (m1), Ruth's phone hint (m2) and Dev's first courier line (m3, plus one optional line). Nothing has been generated yet, so this costs nothing until the TTS pass.
3. **Validator rule for non-interactable pairs (m6).** This is a small change to shared tooling: pinned objects where one is `interactable: false` stop warning. Approve it as its own small branch, or keep the comment-only workaround.
4. **Two propped-door lessons (m8).** P2's fire door and P1's wedge teach the same control. Keep both, with P1 reworded to cover a staff habit that outlived its cause, or drop P2's readable now that the live beat exists.
