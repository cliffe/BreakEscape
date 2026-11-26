# demo_ops_passwords: tour implementation review R1

Reviewer: implementation review round 1 (read-only apart from this file). Branch `ops-showcase-tour` at `b8cf2c394` (includes main). Unit under review: U2, commit `de0664f8e`. Sources: `docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` 1.2, 2.1, 2.5, 2.7, 4; `SHOWCASE_TOUR_PLAN_REVIEW_R4.md`; the U2 entry in the tour build reports; `planning/BUILD_REPORT.md` ("Showcase tour U2"); `PLAYTEST.md`; `scenario.json.erb`; the seven ink files; `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`. No SecGen XML, realism catalog or field guide was opened.

**Verdict: not clean.** 0 blockers, 3 majors, 8 minors.

## Checks run

| Check | Result |
|---|---|
| `scripts/compile-ink.sh demo_ops_passwords` | 7/7 compiled, 0 failed; compiled JSON unchanged against the commit (git status clean) |
| `ruby scripts/validate_scenario.rb .../scenario.json.erb --no-graph` | 0 errors, 27 warnings (as BUILD_REPORT lists) |
| `dialoguelint.mjs scenarios/demo_ops_passwords/` | 0 ERROR, 1 CHECK (`crowded-hub`, explained in BUILD_REPORT) |
| `tools/check_mapping_index_drift.rb main` (this scenario) | 0 failures |
| Rails `demo_ops_passwords_scenario_test.rb` (under the shared lock) | 52 runs, 1455 assertions, 0 failures, 0 errors |

## What holds

- Aim order morning 0, midday 1, afternoon 2, evening 3 (`scenario.json.erb:312`, `:322`, `:351`, `:341`); the midday aim ends with `stick_override` (`:333`); the afternoon tasks run `collect_partner`, `collect_hot_desk`, `see_borrow`, `collect_after_borrow`, `crack_cached`, `local_account`, `local_refused` (`:353-359`). "What's next?" (`ink/ama_owusu.ink:130-226`) walks the same order. Objectives and "What's next?" agree.
- The day-end gate (`ama_owusu.ink:376-405`) waits for all 18 morning, midday and afternoon tasks and not for `read_log`; "Skip them and call it a day anyway." sets `skip_tour`. Pinned in the test (`:533-549`).
- P8b: `desk_usb_port` has `portOf: "delphine_pc"` (`:437`); the confirm's `remove_item` is a gated remove, and the rest of the list (the `set_global stick_override`) runs only on the server's success (`systems/apply-actions.js:373-384`), so the tick cannot fire on a refused plant. The client lets the stick through only for an admin session at the port's PC (`systems/pc-sessions.js:499-508`, `systems/interactions.js:1113-1120`). The server logs `usb_install_overridden`, which is in `signin_log.events` (`:294`). The Rails case at `:580` proves the refusal with no session and a user session, and the override in Graham's session.
- P11a and P11c lines are true to the server: a collect adds only pairs not already held, and an `after: "borrow"` account is cached only once the borrow pair is recorded (`app/models/break_escape/cached_credentials.rb:22-63`); so the first collect gives Niamh alone and the second Jun alone. The toast gets a Crack button only for exactly one hash find (`systems/keyring.js:589-595`).
- The barks follow 2.1 rule 1: appended at the end of Ama's mappings (`:627-633`), once-only, with a stale-step condition; `writeGlobal` emits no `oldValue` (`systems/global-writer.js:192-197`), so `data.oldValue !== true` passes as the plan expects; barks are held while a minigame is open (`systems/npc-barks.js:247-259`).
- No printed variable, inline conditional or stage direction in any voiced line (ink and barks scanned); no password, hash token or fact value in ink, barks, board or PLAYTEST prose.
- The three new globals are declared in `globalVariables` and as ink VARs (R4 n1), pinned at test `:528-535`.

## Findings

### Major

**M1. The "Things to try" board is not in the tour order and misses two beats.** Plan 2.1 rule 2 and 2.5 ("What's next?" and the board follow the same order). `tour_notice` (`scenario.json.erb:542`) is the pre-tour text:
- Midday has no line for P8b (the stick at Delphine's port in Graham's session), though the objectives panel and "What's next?" both end midday with it.
- Afternoon says "Ask Ama to switch Jun's PC off, watch him borrow the hot desk, then sign in there as Graham and collect again." That is the old order (borrow first, one collect). The tour collects at the hot desk before the borrow (P11a), and the Jun lever is not even offered until that first collect is told (`ama_owusu.ink:118`), so a player following the board asks for a lever that is not there.
- Fix: add a midday line ("Send them for coffee, then sign in at Delphine's PC as Graham and try the stick in her port again.") and replace the afternoon line with the P11a, P11b, P11c order (collect at the hot desk as Graham; ask Ama to switch Jun's PC off and watch him borrow it; collect there again). Add a test that the board names each afternoon step in panel order, if cheap.

**M2. P13's pointer sends the player to a PC its owner is sitting at.** "Graham's rota talks about a shared desk account... Crack it, then sign in at Delphine's PC." (`ama_owusu.ink:207-211`; PLAYTEST P13 `:113`). In the afternoon Delphine is back at her desk; a click on an owned PC with its owner present stops at "Delphine Arvanitis is using this PC." (`systems/unlock-system.js:688-691`, `:646`) and never shows the sign-in screen. The pre-tour PLAYTEST said "At Delphine's PC (while she is away from it, with Ama's coffee lever)" (`git show de0664f8e^:scenarios/demo_ops_passwords/PLAYTEST.md`, line 117); the tour rewrite dropped that, and Ama's pointer never had it. The beat is not lost (the coffee lever is repeatable), but the guided path as written leads to a refusal with no hint of the way round, and P6 and P8b both name the coffee lever, so the omission reads as "coffee not needed".
- Fix: Ama's P13 second line becomes, for example, "Ask me to send them for coffee, then type the name and password under Other user."; PLAYTEST P13's Do column names the coffee lever again. (The tick also accepts `jun_pc` and `hot_desk`, `scenario.json.erb:625-626`, but the bark says Delphine's PC: see m8.)

**M3. No live check of the new beats; tour timings not measured.** Plan 4.1 "Done" for U2 asks for "a short live check in the unit's own keyless game of each new tick and bark, with the measured seconds of every tuned routine", and 2.1 rule 3 asks for measured seconds in PLAYTEST. The build report says no browser run was made (BUILD_REPORT "Not done here"), and PLAYTEST "Expected timings" (`:149-151`) still reads "Not yet measured". Unproven in a browser:
- The six new barks on `global_variable_changed:<task>_done` (a mapping's `setGlobal` firing another mapping of the same NPC) and the P8b bark.
- P8b's window: the player must reach Delphine's PC, sign in as Graham, close the desktop and plug the stick inside one coffee trip (about 28 s in an earlier run, `PLAYTEST.md:68`); if she sits down first her return displaces the session (`pc-sessions.js:138`, `:953`) and the plant is refused. Recoverable with another coffee press, but it should be measured and, if tight, PLAYTEST should say "press coffee again".
- The P11a/P11c toasts in the browser order (the toast shows only after the desktop closes, per the pre-tour PLAYTEST P10).
- This can be closed by the draft guided playthrough of plan 4.2 if the orchestrator prefers, but until then the build does not meet its own Done list.

### Minor

**m1. "Names one record" is not what the toast does.** The P11a line "The toast has a Crack button when it names one record." and the late line "No Crack button when a toast names two." (`ama_owusu.ink:285`, `:293`): the find toast reads "Hash collected" or "Hash collected (2)" (`utils/remote-host-text.js:172`, `:213-219`); it names nobody. The rows in the Cached accounts panel carry the names. Suggest "The toast has a Crack button when it's a single record." and "No Crack button when a toast has two." Same wording in PLAYTEST `:63`, `:109`, `:111` and CRACKER_RUNBOOK `:170-172`.

**m2. P7's bark points at a taskbar that is no longer on screen.** "Graham is an administrator, so this session is one. Look at the taskbar." (`scenario.json.erb:631`): the tick comes while the desktop is open, and barks are held until the minigame closes (`npc-barks.js:247-259`), so the player hears "Look at the taskbar" after closing it. Suggest "...so this session is one. The taskbar said Administrator." P6's "And no Administrator on the taskbar." (`:629`) reads acceptably after the fact.

**m3. P11c's pointer and PLAYTEST describe the hot desk wrongly after the borrow.** Jun's borrow displaces the player's session and Jun then leaves the hot desk signed in (`habits.screen.lockChance: 0`, `:704`; Jun's own line "I never log out of borrowed PCs"). A click then opens Jun's open screen, not a sign-in; Cached accounts on a user session is refused (`cached_credentials.rb:38`). The pre-tour PLAYTEST P11 said "Start, 'Switch user', the Graham tile". PLAYTEST P11c (`:111`) says "Jun's session was displaced by the borrow", which has it backwards. Ama's "Collect at the hot desk again, then tell me." (`ama_owusu.ink:203`) drops "as Graham". Suggest "Collect at the hot desk again, as Graham, then tell me." and restore "Start, Switch user" in PLAYTEST. Also add the PLAYTEST P11b advice ("switch his PC back on, or he keeps coming back") to Ama's P11c pointer or the P11b bark's second sentence, since the guided player does not read PLAYTEST.

**m4. The borrow-first branch is chosen at telling time, not at collecting time.** `tell_collect_hot_desk` diverts to the late knot whenever `see_borrow_done` is true when the player talks (`ama_owusu.ink:281-283`). A player who collects before the borrow (one record, Niamh's), then uses Jun's wall socket (not gated like the lever, `:568-590`) and tells Ama only after the borrow hears "Two records this time, Niamh's and Jun's... No Crack button when a toast names two." (false for what they saw), and `collect_after_borrow` is ticked with no second collect. The self-report limit is accepted (plan 4.2), but here the line itself is wrong. A cheap guard: offer "I collected at the hot desk." only while `not see_borrow_done`, plus a separate borrow-first choice "I collected at the hot desk after Jun borrowed it." to the late knot; or keep it and note it in PLAYTEST.

**m5. The whole-run leak scan does not include P8b.** The scanned runs (`play_whole_run` `:682-748`, `play_afternoon` `:1097-1141`) never sign in as Graham at `delphine_pc` or plant the stick in his session; the P8b cases (`:580`, `:607`) check behaviour but scan nothing. The claim "whole-run leak scan 0 findings" is true of the run it scans but that run is not the whole tour. Suggest adding the P8b sign-in and gated remove to `play_whole_run` after P8 (with its `@signins` entry) so the scanner judges those answers.

**m6. P14's pointer does not say to sign out of Graham's session at the partner's PC.** "Now try the same account at Julian's PC." (`ama_owusu.ink:214`). The player has held Graham's admin session there since P7/P10; a click opens his desktop, not the sign-in screen with Other user and the "Domain:" line the P14 line asks them to read. PLAYTEST says so (`:114`); Ama does not. Suggest "Sign out of Graham's session there first, then try the same account at Julian's PC."

**m7. Out of order, P8b spends the stick and P6b can never tick.** The admin plant's confirm removes `kit_stick` (`:449`); `usb_refused` needs it held. A player who does P8b first is then held by the day-end gate until they skip. The guided order prevents it; a PLAYTEST free-play note or a guard on the confirm (`condition: "globalVars.usb_refused_done"`, with a hint otherwise) would stop it.

**m8. P13's bark names Delphine's PC whatever PC ticked it.** "A shared desk account, cracked like any other. It works on Delphine's PC." (`:633`) follows the `local_account` tick, which also fires on `jun_pc` and `hot_desk` (`:625-626`). Suggest "It works on the desks it covers." or condition the bark's mapping on the Delphine tick only.

## Not findings

- Self-report ticks (P3, P4, P5, P7b, P10, P11a, P11c, P12, P14) are not checked by the engine: the plan's known limit (4.2).
- The P11a fallback for a borrow before the first collect is present and ticks both beats as the plan says (`ama_owusu.ink:291-298`), apart from m4.
- Delphine's tour voice keeps the "light Mediterranean lilt": the builder's note that the plan was wrong there is for the dialogue review (4.3), not this one.
