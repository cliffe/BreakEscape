# demo_ops_terminal: guided tour implementation review, round 1

Reviewer: Opus, read-only (only this file written). Branch `ops-showcase-tour` at `b8cf2c394` (U4 is `24414fb41`, then main merged in). Read: `SHOWCASE_TOUR_PLAN.md` 1.4, 1.5, 2.1, 2.2, 2.4, 2.7 and 4; `SHOWCASE_TOUR_PLAN_REVIEW_R4.md`; the U4 build report in the tour build reports; `planning/BUILD_REPORT.md`, `PLAYTEST.md`, `planning/VOICED_LINES.md`, `mission.json`; `scenario.json.erb`, the four ink files and `test/controllers/break_escape/demo_ops_terminal_scenario_test.rb`; the engine code cited below.

## Verdict: not clean

1 blocker, 1 major, 9 minors.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_terminal/scenario.json.erb --no-graph` | 0 errors, 4 warnings (the four the build report explains) |
| `scripts/compile-ink.sh demo_ops_terminal` | 4 compiled, 0 failed; the committed JSON did not change |
| `dialoguelint.mjs scenarios/demo_ops_terminal/` | no findings |
| `bin/rails test test/controllers/break_escape/demo_ops_terminal_scenario_test.rb` (under the lock) | **15 runs, 0 failures, 1 error**: the whole-run leak scan (B1) |

## Coverage against the plan

Every feature the plan gives this showcase (1.4, 1.5, 2.4) is on the guided path, in the plan's order, and the objectives, board and "What's next?" all list it in the same order:

- the realism text: T4 (scanner write-up, reference ids), T5 (console search and info), T7 (typed `use`)
- the Terminal skin and its tables: T1 and T2
- the Terminal staying open for the life of the view: T8
- a relay session, admin because Graham is one, ended by its owner: T9 and T9b
- the timed token: T3 and T10
- the keystroke device refused over a remote session: T11
- whole verbs to end a trip: T12

The ticks match the plan: T1 on `network_foothold_gained:rack_jack`, T3 on `token === true`, T6 through ordered mappings, T7 on Graham's `npcId`, T9 on `relay === true`, T10 two ways, T12 gated on `token_expired_done && shared_screen_done`. The T3r way back, the hidden spare port and the declared globals (R4 n1) are built as the plan says.

The "what you just saw" lines I checked against the code are true:
- The false finding "says why": `framework-console.js:126-127` prints `Because:` from `falseBecause`.
- Zainab's line that her card "only fits a weakness that is real, and that you've tested": `ops-model.js:26` `not_confirmed`.
- The short form is refused: `terminal-grammar.js:262-263`.
- The relay is admin because the account is: `pc-sessions.js:1187`.

No line meant for voicing prints a variable or carries a stage direction. Voiced lines are at most 30 words.

## Findings

### Blocker

**B1. The whole-run leak scan errors on this branch, so the claim "leak scan 0" no longer holds.**
- `test 'the whole played run reports nothing to the leak scanner'` (`demo_ops_terminal_scenario_test.rb:446`) raises `ArgumentError: run.jsonl row 10 holds a login tag: the recorder writes none, so it was added by hand`. The error comes from `tools/playtest/lib/access_leak_scanner.rb:402`, `:628`.
- The cause is the scanner hardening that came in with the merge of main (`41c063295`, "R1-m5 drop hand_tag_problem"). The test adds hand-made `login` tags at `:408` and `:435`.
- Fix: record the run untagged and pass the two sign-ins as `signins:` entries, the way `demo_ops_passwords_scenario_test.rb:760` and `:1150` do. Then rerun and confirm that the scan still finds 0.
- Until this is fixed, the tour has no passing server-side leak proof.

### Major

**M1. Seven of the twelve beats, and the way back, were never played live, and the token wait was not measured.**
- PLAYTEST "Measured seconds" says T5, T7 to T10 and T12 were not run in a browser. The T3r way back was not run either.
- Plan 4.1 "Done" asks for a short live check of each new tick and bark, with measured seconds.
- These beats depend on client-only behaviour that the Rails test cannot see:
  - the relay bark comes from the client's `pc_signed_in` event;
  - the T9b lever's `#set_global` has to end the relay through sync;
  - the unplug works only in a view opened at the jack (see m1);
  - barks are held while the view is open, and dropped as stale;
  - the spare port appears on `spare_port_offered`.
- Fix: run these beats on the unit's own keyless port and record what happened and the seconds. Or say plainly that the Haiku guided playthrough (4.2) is the first live run of them, and do not call U4 done until it has run.

### Minors

**m1. T12: following the pointer from the inventory fails, and the bark can be untrue.**
- The view has an Unplug only when it was opened by a click on the box at its jack. From the inventory, typing the whole `unplug` answers "There is no box to unplug here." (`network-view-minigame.js:23-26`, `terminal-grammar.js:78`). The only guidance is the hint "You can unplug the box at its port (...)" (`:807-814`, shown by `terminal-format.js:431`).
- The pointer and the board say only "unplug from the Terminal".
- The tick also fires on the Unplug button, or on a physical unplug at the port. In both cases the bark "You have to type the whole word" describes something the player did not do.
- Fix: the pointer should say "Go to the box at the server room port, click it, and type unplug: try a short form first."

**m2. The pointers on the way back stop short.**
- Case: T3 is done, the session was held, and the token lapses before T11. The mapping sets `token_ran_out`. "What's next?" then still says "While the token's live, plug the keystroke device..." with a dead token, and does not point to "Can I have another go?".
- After the spare port is offered:
  - nothing tells the player to sign in again with the spare token before T11, because T3 has already ticked, so its bark never comes again;
  - the spare-port bark says only "Its token's clock starts now".
- The reply to "Can I have another go?" begins "If your token's greyed out before you used it", which is wrong for a player who did use it (T3 done).
- Fix:
  - when `token_ran_out` is set and T3 or T11 is undone, "What's next?" names the spare port;
  - the spare-port bark adds "Sign in to the backup PC with the spare token";
  - the reply loses "before you used it".

**m3. The T3 and T5 pointers leave out what a first-time player needs.**
- T3: the token works only through the box (`credential_login.rb:263-268`: the route must be the proof foothold). The keyring marks it `accepted` at the backup PC's own keyboard (`credential_keyring.rb:598`), and the PC sits in the same room as the port. So a player who walks up to it gets a plain refusal.
  - Fix: say "from the Terminal, sign in to the backup PC with the token".
- T5: "Open the console" does not name `msfconsole`. There is no quick command for it; only `help` lists it (`terminal-format.js:33`). Also, `info` needs a module selected first, or it prints only the select-first note (`framework-console.js:107-109`).
  - Fix: say "Type msfconsole, search, pick one with use, then info."

**m4. The board and the objectives never say "tell Ama" for the three self-report ticks.**
- T5, T8 and T10 tick only on what the player tells Ama.
- The board says "Open the console and search...", "Switch to Panels and back." and "Watch the token run out.". The panel's task titles say the same, and the aim description says a task "ticks when you have done it". A player who does these from the board sees no tick.
- The remote aim's description, "A shared screen and a token both run out", is also wrong for the screen: Graham ends it.

**m5. The short version names "a saved link", which this showcase never shows.**
- Plan 1.6 leaves saved connections to `test_ops_mfa`.
- Fix: drop it, or say "a token and a shared screen".

**m6. "Same as the recon day, typed." (T7 bark) assumes recon was played first.**
- Plan 2.2 says each showcase stands alone. Leave this for the dialogue review (4.3) to judge, but flag it there.

**m7. The PLAYTEST prose quotes the invented id prefix `CVE-0000-...` ("Measured seconds").**
- Plan 2.1 rule 6 keeps catalog text out of PLAYTEST prose. Fix: say "the invented reference ids".

**m8. The whole-run leak scan leaves out the way back and the unplug, and PLAYTEST does not say so.**
- `play_whole_run` (`:390-444`) covers T1 to T10 on the first token. It has no spare port and no unplug. BUILD_REPORT item 5 explains why the unplug is left out; PLAYTEST says nothing.
- Fix: say in PLAYTEST that the browser leak check (`access-leak-check.rb` after every beat) is what covers T3r and T12.

**m9. The client test the plan asks for (4.1 U4) is not written.**
- The plan wants a test that a click on the greyed row sends no request and emits no `pc_signin_failed`. BUILD_REPORT says "covered by the existing keyring JS tests" but names none.
- Fix: name the test file and the test case that covers it, or add the test.

## Not findings (checked)

- T6 count: confirming the same real finding twice counts twice. This is a documented known limit and not a guided path. The mapping order (link before update) works with the in-order evaluation shown live.
- Needs targets in another room (validator warnings 25 and 27): the engine prefers the NPC's own `needsHome` (`npc-needs.js:1850`), and Graham sitting at his own PC keeps the relay (`pc-sessions.js:335-338`).
- The globals the ink writes are all declared. The two VAR/global warnings are the intended sync.
- No line names a password, code or catalog text. The three `creds` passwords appear only in the scenario file, and the Rails test refutes them in the recorded run.
