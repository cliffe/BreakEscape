# m06 Follow the Money: puzzle chains review, pass 5 round 3

Read-only review (Opus, static, with probe routes). Kind of game: a SAFETYNET campaign mission, a TV spy thriller about a money trail. Measured against m01_first_contact, m02_ransomed_trust and the `mission-puzzle-chains` skill.

The review started on `9f36d6f5` (round 2's fixes). **Two commits landed during it:** `6c56ad60` (the browser check of round 1) and `8c8ee374` ("puzzle round 2 browser follow-up"). Their findings: mapping conditions resolve only one level of `data.<name>` (`npc-manager.js:35-43`, `resolveLHS`; `DECISIONS_PENDING.md` D5), so at `9f36d6f5` `data.result.maxAttemptsReached` was always false and neither console mapping ever fired. `8c8ee374` keys both on a flat `data.result` and moves the signing case onto the desk's front edge. **Findings below are written against `8c8ee374`.** The routes, the validator and `dialoguelint` were re-run on it. `erb:N` numbers before line 1290 are the same in both commits. From there on, the cited numbers are `9f36d6f5`'s; add 6 for `8c8ee374` (the console mappings are at erb:1299 and 1310 there). Citations: `erb:N` is `scenario.json.erb`; ink files by short name (`irina`, `phone`, `debrief`, `satoshi`).

## Scope

- **Covered:**
  - confirming M-R2-1, M-R2-2 and m-R2-1 to m-R2-6;
  - trying to break the three new gates with probe routes: Irina's per-visit check, the console lockouts with the elimination credit, and the optional wordlist task;
  - one fresh pass with the skill, reporting only real findings.
- **Engine read:**
  - the PIN pad: per-opening attempt count, lockout result, cancel path (`pin-minigame.js:1-60`, `:296-360`, `:570-640`; `base-minigame.js:1-30`, `:85-150`; `minigame-starters.js:515-540`);
  - how a person chat reopens and re-syncs globals (`person-chat-minigame.js:465-540`, `npc-conversation-state.js:20-150`);
  - the `room_entered` emitter (`rooms.js:2930-2985`) and the order mappings run in (`npc-events.js:45-58`, `npc-manager.js:504-552`, `:695-715`);
  - how globals reach the server (`state-sync.js:13, 76`).
- **Not opened:** the SecGen XML, the four exploit guides, the exploit detail in `VM_INTEGRATION.md`, and the sight-challenge source.
- No browser session was started.

Probe routes and a condition probe are in the session scratchpad, `m06-puzzle-r3-reviewer/` (`probe_console_engine.js`, which runs the engine's own `safeEvaluateCondition` against the conditions in both commits; `p2_one_guess_per_opening.json`, `p3_safe_lockout_early_ko.json`, `p4_irina_latch_resets.json`, `p5_late_wordlist_after_door.json`). All four routes end "all expectations met": each expectation records what the build does now, including the two holes below.

## Checks run

| Check | Result |
|---|---|
| Routes r1–r16 (`scripts/ink_runtime_check/m06_routes/`) | 16/16 "all expectations met", on both `9f36d6f5` and `8c8ee374` |
| Validator, `--skip-ink --no-graph` | 0 errors. Schema, geometry and door alignment pass. Same notes as round 2's close: 20 duplicate-pattern warnings on HaX, 3 repeatable-cutscene notes, the two-sources note for the server room, two all-conditional credit sections, two lobby NPCs with no behaviour. The `showProgress` note is gone |
| `dialoguelint` | No findings (both commits) |
| `missions.json` | Parses; the m06 block has `console_tripped` and `slot_checked_visit` (lines 912-913) |
| Side effects | None from the checks. This report file was picked up by a commit while it was still being written; this is its finished version |

## Round-2 confirmation

| # | Round-2 finding | Where it is now | Status |
|---|---|---|---|
| M-R2-1 | Irina's check was once per page load | `slot_checked_visit` is a declared global (erb:689) and in the m06 block of `missions.json` (912-913). Her ink writes it with `~` and `#set_variable` together at each latch point (irina:553-554, 564-565, 572-573). The clear in `start` is gone (irina:88-100). The only thing that writes `false` is HaX's `room_entered:data_center` mapping (erb:1314-1319: `irina_recruited`, fund not found, not onceOnly, cooldown 0). A grep finds no other writer. On a reopen the engine restores the story, syncs globals in and re-navigates to the choices' knot (`person-chat-minigame.js:480-536`), so the option comes back after a clear and stays hidden while the latch holds. The whole globals map goes to the server (`state-sync.js:76`), so a reload keeps both the latch and its clear. The ink comment (irina:74, 595-597) and walkthrough 17a (`TESTING_WALKTHROUGH.md:73`) now describe this. r14 and probe p4 pass | ✅ |
| M-R2-2 | Once the cover was strained, a lockout cost nothing | A second `minigame_failed` mapping (erb:1302-1308) sets `console_tripped` on every lockout before the fund, without the cover clause. Credits: erb:170 needs `!console_tripped`; the new erb:172 "FOUND BY ELIMINATION ON THE CONSOLE" needs `console_tripped && !irina_confirmed_slot`; erb:173 Volkova's line wins. The three lines are mutually exclusive and cover every case. Debrief branch at debrief:116-122. r16 passes, but only because `route.js` models the lockout itself and never evaluates the condition | ⚠️ **Dead at `9f36d6f5`:** the dotted `data.result.maxAttemptsReached` resolves to undefined, so neither console mapping fired. This is round-1 M1's strain as well, and it's the bug class the skill's sweep is for. F1 found it first, so it isn't counted here. **Live in `8c8ee374`** (flat `data.result`, erb:1299/1310 there): `probe_console_engine.js` shows a lockout fires both mappings and a cancel fires neither. The method still has a hole: M-R3-1 |
| m-R2-1 | The signing record printed the slot | erb:2200: "Release: the Fund's cold slot (1ARCHITECT9FUND)". `grep 4471` finds nothing in the record | ✅ |
| m-R2-2 | No warning on the console | erb:1850 adds "It logs every opening to the exchange's on-call phone." | ✅ |
| m-R2-3 | Strain wording | satoshi:63 "Somebody here rang the FCA tonight."; phone:270 "Someone here has a reason…"; debrief:339 "Somebody at HashChain rang the FCA…"; erb:217 "somebody at HashChain rang the FCA". The walkthrough still quotes the old Satoshi line (m-R3-3) | ✅ in game; ⚠️ doc |
| m-R2-4 | Wordlist task required; stale lines | erb:276 `"optional": true`. erb:975 adds `skipIfGlobal: server_room_entered`. phone:177 and phone:279 add `not server_room_entered`. Aim completion skips optional tasks on the client (`objectives-manager.js:847`) and the server (`game.rb:2136`). The in-game text still says the wordlist is for doors, not the VM (erb:997 comment, PASS 4 fix 8). r16 and probe p5 pass | ✅ |
| m-R2-5 | Comments overstated the dusting as a stealth beat | erb:2097 and the case's comment (≈erb:2181) now say "his usual sight challenge applies; nothing reacts to the dusting itself" | ✅ (the browser check is still owed) |
| F1 follow-up (`8c8ee374`) | The console mappings test a flat `data.result` | Both conditions read `data.minigameName === 'PinMinigame' && data.result && …` (erb:1299, 1310). The engine's evaluator, run in `probe_console_engine.js`, fires them on a lockout and on nothing else. **A cancel after one wrong try emits `result: null`.** `gameResult` starts at `null` (`base-minigame.js:12`). Only two places in the pad assign it: success (`pin-minigame.js:579`) and the lockout branch (`:601`). A wrong guess under the limit only shows "Incorrect PIN. N attempts remaining." (`:606-620`). Cancel, the × button and Esc all call `complete(false)` (`base-minigame.js:52-57, 73-78`). That goes through `PinMinigame.complete` → `super.complete(success, this.gameResult)` (`pin-minigame.js:636`) and emits `result: null` (`base-minigame.js:99-104`). So the flat test can't be tripped by a cancel. The same fact is the root of M-R3-1 | ✅ (statically settled; item 1 of the checklist confirms it live) |
| F2 follow-up (`8c8ee374`) | The signing case moved onto the desk | erb:2192 `"position": { "x": 3.6, "y": 3.35, "elevation": 32 }`, with a depth calculation in the comment (front edge of `desk-ceo2`, drawn in front of it; elevation affects render depth only). That's the m05 mug pattern. Nothing in the puzzle depends on the exact position | ✅ statically. The render and interaction-range check is owed (checklist item 6) |
| m-R2-6 | `showProgress` | erb:489 `"showProgress": true`. The validator note is gone | ✅ (the change from `false` is justified in the log) |

## Findings: severity table

Counts: **0 blockers, 1 major, 3 minors.**

| # | Sev. | Finding | File:line | Concrete fix |
|---|---|---|---|---|
| M-R3-1 | major | **One guess per opening never locks the console out, so "TRACED THROUGH THE MIXER" is still open to guessing, for every player** (in `8c8ee374`; at `9f36d6f5` nothing fired at all). The attempt count lives on the pad, not the lock: `this.attemptCount = 0` in the constructor (`pin-minigame.js:57`), so each opening starts at zero. `gameResult` is set only on a lockout (`pin-minigame.js:593-605`). A wrong guess under the limit doesn't touch it (`:606-620`), so a cancel after one wrong slot still sends `result: null` (`base-minigame.js:12, 99-104`). **That settles the open question from F1 statically:** the flat-`data.result` test tells a lockout from every cancel. The flip side is that one guess and a cancel trip nothing. So: key one slot, read "1 attempt remaining", cancel, reopen, key the next. Seven slots, seven openings, no event, no strain, no `console_tripped`. The pad keeps every earlier guess on screen across openings (`pin-minigame.js:7-11, 52-55`), which makes the sweep easy. The game nudges players towards it: "1 attempt remaining" (`:608-612`), and now "It logs every opening" (erb:1850), which tells a careful player to stop at one. The credit then reads "TRACED THROUGH THE MIXER" (erb:170) and the debrief "You traced the fund yourself. In through the mixer, out by amount and time." (debrief:121). Probe p2 shows the end state matches a real deduction exactly. This is round-1 M1 and M-R2-2 again, now for everyone rather than only the strained group. It isn't a soft-lock and nothing breaks, so it's major, not a blocker | `pin-minigame.js:57, 593-620`; erb:1288-1308, 170, 1850; debrief:121 | **Count wrong slots across openings in globals, using only what the evaluator can read** (one level of `data.<name>`, so `data.result.attempts` is out until D5). (a) Set the console's `"maxAttempts": 1` (erb:1849). Every wrong slot then closes the pad with a non-null `result`; a cancel with no guess still sends `null`; and the "wrong, then cancel" state no longer exists. (b) Replace the two mappings with three, **in this order**, because the dispatcher runs listeners in array order (`npc-events.js:45-48`) and `setGlobal` is synchronous (`npc-manager.js:703-707`). All three use `data.minigameName === 'PinMinigame' && data.result && globalVars.at_console === true && globalVars.found_architects_fund !== true`, plus: (1) *second and later strikes*: `&& globalVars.console_warned === true`, not onceOnly, cooldown 0, `setGlobal { console_tripped: true }`; (2) *the strain*: the current mapping, plus `&& globalVars.console_warned === true` (so it fires on the second strike, once); (3) *first strike*: `&& globalVars.console_warned !== true`, onceOnly, `setGlobal { console_warned: true }`, with a text along the lines of "That console just logged a slot that wasn't the fund. One more and somebody's phone goes." (c) `at_console` is the scope that replaces `entered_data_center` (m-R3-1): HaX mappings set it true on `room_entered:data_center` and false on `room_entered:server_room` and `room_entered:executive_wing`, cooldown 0. Declare `console_warned` and `at_console`, and add both to `missions.json`. One honest slip is free and warned. A second costs the strain (once) and the credit. That's the "two strikes" rule M1/D1 meant, without the per-opening reset. (d) Update `route.js` (`lockout` becomes `strike`, with the warned/tripped/at_console model), r14, r16, walkthrough 17a and the console comment. **Alternative:** D5's dotted-path engine change, plus a per-lock count of wrong attempts across openings (`pinAttemptHistory` already keeps the guesses per lock). Both need the user, so the mission-local version above is the default |
| m-R3-1 | minor | **In `8c8ee374`, a lockout at the CEO's safe writes a false credit and debrief line.** Round 2 accepted that a safe lockout on the early-KO route sends the console's strain text. On that route Irina's dropped executive badge opens the wing once the data centre is open; the wing connects west to the data centre (erb:2002-2011). The new `console_tripped` mapping has the same scope. Now that F1's fix makes it live, the same lockout also prints "FOUND BY ELIMINATION ON THE CONSOLE" (erb:172) and "You found the fund by working the console until it gave" (debrief:119), for a player who may then key 4471 first time. `probe_console_engine.js` shows both mappings in `8c8ee374` fire on the safe's lockout. Probe p3 plays the route to that credit. This is a new consequence, so it's raised again here; the accepted strain-text edge isn't re-argued | erb:1299, 1310 (`8c8ee374`); erb:172; debrief:119; erb:2208-2216 (the safe, default 5 tries) | The evaluator can't read `data.result.attempts`, and `minigame_failed` carries no object id, so scope by place: the `at_console` global in M-R3-1 (c), true only between entering the data centre and leaving it for the server room or the wing. The safe is behind the wing, so its lockout no longer matches. This also closes the accepted strain-text edge for free. After D5, `data.result.attempts === 1` would do the same job |
| m-R3-2 | minor | **For a player whose cover is already strained, a console lockout gives no signal until the debrief.** The `console_tripped` mapping has no text (erb:1302-1308), and the strain mapping's text is behind `cover_strained !== true` (erb:1293). So the cost M-R2-2 added can't be seen when it happens, and the player can't learn from it | erb:1302-1308 | Folded into M-R3-1 (the first-strike text fires whatever the cover's state). Without M-R3-1: add a onceOnly text mapping **before** the strain mapping, condition `data.minigameName === 'PinMinigame' && data.result && globalVars.entered_data_center === true && globalVars.found_architects_fund !== true && globalVars.cover_strained === true`, text "That console logs every slot it opens. They'll know exactly where we looked." |
| m-R3-3 | minor | The walkthrough still quotes Satoshi's old strain line: "Somebody on my floor rang the FCA an hour ago…" | `TESTING_WALKTHROUGH.md:45` | Change it to "Somebody here rang the FCA tonight. They've never heard of you." |

**Not counted:**
- **Irina is still a slow oracle.** After she rules out 6120 and the slots inside the six-hour hold, three candidates are left (4471, 5093, 8846). A player can check one per round trip (trading floor → server room → data centre and back), and a right answer earns "CONFIRMED BY VOLKOVA". That's the accepted design: she confirms rather than solves, and each check now costs a real walk. Left as it is.
- **Doorway re-entry.** `room_entered:data_center` fires again if the player steps into the doorway gap and back (`rooms.js:2949-2961`: a gap sets the current room to `null`). That gains nothing, because Irina is two rooms away and the clear only matters once the player walks back to her.
- **Reload while standing in the data centre** re-fires `room_entered` for that room and clears the latch. That counts as a visit anyway.

## Probing the new gates

| Gate | Probe | Result |
|---|---|---|
| Irina's per-visit check: can it be reset another way? | p4: a wrong check, then every other room (lab, her office, server room, floor), a story reload and a page reload, then the data centre | Holds. The option stays away until the data centre is entered. Engine side, the mapping at erb:1314-1319 is the only writer of `false`, the reopen re-syncs globals before re-navigating (`person-chat-minigame.js:513-536`), and the globals map goes to the server whole. "Let me look again." (irina:559) doesn't latch, which is right. Closing the chat at "Which one?" and reopening returns to the same menu without a free check |
| Console lockout and elimination credit: can a player get "TRACED THROUGH THE MIXER" without deducing it? | `probe_console_engine.js` evaluates the conditions in both commits with the engine's own evaluator; p2 plays a one-guess-per-opening run to the credits | **Yes** (M-R3-1). At `9f36d6f5` nothing fires, not even a full lockout (the dotted path). In `8c8ee374` a cancel, and a wrong guess then a cancel, both send `result: null`, so neither mapping fires, and the run ends with "TRACED THROUGH THE MIXER" and the deduction line in the debrief. The safe's 5-try lockout fires both mappings (m-R3-1, p3) |
| The wordlist task now optional | p5: the door guessed, Irina turned afterwards, the wordlist handed over late | Holds. No "Get it from her", no "What do I do with it?", and the pickup text is skipped (erb:975). The aim still completes without it (`objectives-manager.js:847`; `game.rb:2136`). Nothing else keys on `obtain_access_tools` (grep of the ink finds no reference) |

## Fresh pass with the skill

Only the parts the round-2 changes touch. The rest stands as in rounds 1 and 2.

- **Boss-key audit.** No row changes, except that the console's ✅ for a held cover is now ⚠️ for every player until M-R3-1 is fixed: guessing is free one slot at a time. The signing case, the safe and the server-room door stand as round 2 left them.
- **Are the choices required?** Unchanged. The call-in needs both decisions and all four flags. The new consequences are score and story (credit, debrief), not gates. Nothing new is in `concludeRequires`.
- **Silent-failure sweep, new content:**
  - Every new global is declared (erb:688-689) and synced where it's read: `console_tripped` in debrief:47, `slot_checked_visit` in irina:74, both in `missions.json`.
  - The new mappings use patterns that fire (`room_entered:data_center` is emitted on every entry, `rooms.js:2974`; `minigame_failed` from `base-minigame.js:99-104`). Each mapping has its own trigger key, so the duplicate-pattern warnings are harmless (`npc-manager.js:593-614`).
  - The three fund credit lines are mutually exclusive and cover every case.
  - No `[LORE:]`/`[NOTE:]`. No new observation gives its own code away. The signing record no longer names the slot.
  - Rename residue and stale geography: none in the new lines. The neutral strain wording fits every cause. One old text, erb:1278 ("Someone on that floor…"), is the staff-KO text, so it is still accurate.
- **Answers handed over.** Nothing new. The console's warning sentence is in-world and gives nothing away.
- **Over-redundancy.** None added.

## What to do, in order

1. **M-R3-1 with m-R3-1 and m-R3-2:** set the console to one try per opening, add the three-mapping strike count scoped by the `at_console` global (the evaluator can't read `data.result.attempts`), declare `console_warned` and `at_console`, and update `route.js`, r14, r16, walkthrough 17a and the console comment. Add a route for the slip-then-correct case (one strike: the warning text, the credit still "TRACED") and one for the early-KO safe lockout (no `console_tripped`).
2. **m-R3-3:** the walkthrough's Satoshi line.
3. Re-run r1–r16 plus the new routes, `reopencheck`, `tagdiff`, the validator and `dialoguelint`. Then the browser checklist below.

## Final browser checklist for closing the phase

Sonnet, keyless server on :3001, runs of 10–15 minutes with at least one page reload mid-run. Read globals through `window.__test` and confirm progress with `verify-run.rb`. Items 1–3 assume M-R3-1 and m-R3-1 are in; if the orchestrator takes the engine route instead, test the same outcomes.

1. **Console strikes.**
   - **Before any fix (`8c8ee374` as it stands):** key one wrong slot, then press Cancel. Do the same with the × button and with Esc. Log the `minigame_failed` payload each time: it should be `{"result": null}`, and `cover_strained` and `console_tripped` should stay false. Then two wrong slots in one opening: the payload has a non-null `result` (`attempts: 2, maxAttemptsReached: true`), the strain text arrives (cover held), and `console_tripped` is true. This confirms the static reading in the F1 row and shows M-R3-1's bypass live.
   - After M-R3-1: open the console in the data centre and press Cancel with no guess: no text, and `console_warned` and `console_tripped` stay false.
   - Key one wrong slot: the pad closes at once (one try), the payload's `result` is non-null, the warning text arrives, and there is no strain.
   - Reopen and key a second wrong slot: the strain text (cover held) and `console_tripped` true.
   - Reopen and key 4471: the fund opens.
2. **The old bypass is closed.** Fresh game: key a wrong slot, then cancel, reopen and key another. The second one counts. One guess per opening no longer avoids the count.
3. **The safe doesn't count as the console.** Early-KO route: KO Irina, take her dropped executive badge after flag 3, get into Satoshi's office, and lock the safe out (five wrong codes). `console_tripped` stays false, and so does `cover_strained` from this cause.
4. **Irina's per-visit check.**
   - Turn Irina, read the settlement log, and check a wrong slot: "Work it through…".
   - Reopen her: the option is gone.
   - Page reload, reopen: still gone.
   - Walk to the data centre and back: the option is back.
   - Check 4471: `irina_confirmed_slot`. The end credits read "TRACED, CONFIRMED BY VOLKOVA".
5. **Wordlist optional.**
   - Guess `bitcoin2025` without the wordlist. The wordlist task shows as optional (no `*`) and the aim moves on.
   - The recap has no "Get it from her".
   - Take the wordlist late from a turned Irina: no pickup text, and no "What do I do with it?" in the hub.
6. **The signing case (`8c8ee374` position).** The case at (3.6, 3.35), elevation 32, draws on the desk's front edge, in front of the desk. It can be reached and interacted with from the floor in front of the desk; elevation is render-only, but check the range. Dust the clipping, open the case, read the record, reload. The lift persists, the case still opens, and the record names the wallet, not the slot.
7. **Kemal over a dusting.** Whether his sight challenge can open while the dusting minigame is running (m-R2-5; the sight-challenge source isn't read by reviewers).
8. **N1.** One real pick inside Kemal's cone. `6c56ad60` reports this confirmed; re-run it only if Kemal's beat changes.
9. **End credits on three routes.** "TRACED THROUGH THE MIXER" (no strikes or one), "FOUND BY ELIMINATION ON THE CONSOLE" (two strikes, no Volkova), "TRACED, CONFIRMED BY VOLKOVA". Each with the neutral FCA cover line where it applies.
10. *Room dressing, can be deferred to that stage:* the clipping reads as on the wall, and the case's new position sits comfortably beside Satoshi and the manifesto.

The phase closes when a round finds nothing above minor and items 1–6 and 9 pass in the browser. Items 7, 8 and 10 can carry into the scenario-design or room-dressing stage if they are logged as open.

## Verdict

**Not ready to close.** Every round-2 finding is in the files. The console mappings work only since `8c8ee374`'s flat `data.result` test, and a cancel, with or without a wrong guess first, sends `result: null`, so the flat test can't be tripped by one. The signing case's move is fine statically. Irina's per-visit latch now holds against every reset I could find: other rooms, a story reload, a page reload, and closing her at the menu. The wordlist change has no knock-on effects.

One major is left, and it sits under the central console puzzle again. The pad counts attempts per opening, and both console mappings only see a lockout, so keying one slot at a time and cancelling sweeps the slots for free. Every player gets the "traced" credit and debrief line that way. The fix is mission-local: one try per opening, with a strike count carried in globals (one slip free and warned, the second costs). Scoping by place (an `at_console` global) clears m-R3-1, because the evaluator can't read `result.attempts` until D5. m-R3-2 and m-R3-3 are small.

No blockers. No route dead-ends: r1–r16 pass, the validator shows no errors, and `dialoguelint` is clean. The findings keep narrowing (round 1 was structure, round 2 the mechanics of the new pieces, round 3 one engine detail under one of them), so the stage is converging. Round 4 should implement and statically confirm; then the browser checklist above, and a round 5 confirmation if anything above minor turns up.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 3 of the puzzle-chains stage (static, with probe routes; no browser session). Routes: 16/16 pass on `8c8ee374`. Validator (`--skip-ink --no-graph`): no errors. `dialoguelint`: clean.
