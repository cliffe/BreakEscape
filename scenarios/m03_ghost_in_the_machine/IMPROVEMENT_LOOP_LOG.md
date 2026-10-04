# m03 Ghost in the Machine: improvement loop

Started 2026-10-04. Method: the m02 playtest loop (`scenarios/m02_ransomed_trust/PLAYTEST_LOOP_LOG.md`) and the sis01 playbook (`docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md`), under `AGENTS.md`. Shared agent brief: `docs/agents/M03_LOOP_BRIEF.md`. Branch: `claude/m03-improvement-loop`.

Phases, each at least three rounds (review → fix → fresh re-review), at most five: (1) mission alignment, (2) puzzle chains, (3) scenario design, (4) dialogue, (5) playtest loop ending in a blind playtest.

Scratch: `/tmp/claude-0/-home-user/2edb2328-aac7-5a76-b90c-d4a259c5be46/scratchpad/m03-<phase>-<role>/` (lost when the session ends; anything that matters is copied here).

## Environment (cloud session, 2026-10-04)

| Check | Status | Notes |
|---|---|---|
| Ink compile (`bin/inklecate`) | works | |
| Validator | works | needs `BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8` and `bundle exec` (gem setup: libpq-dev installed, gems built for the ruby platform because the locked x86_64 sqlite3/nokogiri builds don't support Ruby 3.3) |
| dialoguelint, tagdiff, reopencheck, inkcheck, loopcheck | work | |
| Node tests | 300 pass, 1 fail | `engine-fixes-pass4.test.mjs` fails before any test runs: Node 22 makes `globalThis.navigator` a getter. Pre-existing, environmental |
| Rails suite | 491 runs, 0 failures, 1 skip | local Postgres 16 started, `deploy` role, peer auth relaxed to trust for local sockets |
| Keyless server :3001 | works | started with `bin/rails server` directly; `start-keyless-server.sh` misfires here because `ss` is missing (it then truncates its own log). Dev DB seeded; a `DemoUser` and a player preference created by hand (`new-game.rb` creates users with a `username` column that no longer exists, which only bites on an empty DB) |
| Browser harness | works headless | needs `--headless true` (no X server); Playwright pinned to 1.56.1 (`npm i --no-save`) to match the pre-installed Chromium 1194; the session proxy's CA added to Chromium's NSS store so Phaser loads from jsDelivr. Smoke test: game 1 reached the title screen with 4 flags configured |
| SecGen m03 XML | **missing** | `scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` is not on SecGen master (master has m01, m02, m05, m06, m08). Game-side VM references can't be checked against a VM definition; proposals are written as text in "SecGen" below |

So browser playtests run in this session; every report says which checks were static and which were in a browser.

## Decisions (orchestrator, with reasons)

- Branch `claude/m03-improvement-loop`, as the task asks (the session default was `claude/practical-planck-fvt3ha`).
- Game ids in this session's database start at 5001, so flag XMLs written here can't collide with the user's committed game ids.

## Phase 1: mission alignment

### Round 1 review (fresh Opus, read-only)

Review copied to `m03-align-r1-review/REVIEW.md` in scratch. Counts: 1 blocker, 9 major, 11 minor.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P1-1 | major | "Ghost's logs named Zero Day" contradicts m02 (the invoice and analysts did) | to fixer |
| P1-2 | major | m02 Ghost claims they wrote their own exploit build; m03 never answers it | to fixer (Victoria says it at the confrontation) |
| P1-3 | major | Healthcare premium "on top" of $25,000 contradicts m02's invoice and m03's own catalogue | to fixer |
| P1-4 | minor | "Whether anyone died" contradicts m02 (every ending has a death); obituary line assumes several | to fixer |
| P1-5 | minor | Missed callbacks (214 hospitals survey, target selection, Ghost at large, supply chain) | to fixer |
| P1-6 | major | Four aims unlock at once mid-meeting | to fixer (act 2 unlocks at night) |
| P1-7 | major | Danny's choice reveals "Settle Accounts" early via reveal-on-progress; texts ignore Danny already settled | to fixer |
| P1-8 | minor | `find_operational_logs` is a duplicate tick | to fixer |
| P1-9 | minor | Perfect Stealth visible and open after being caught | to fixer (hidden until earned) |
| P1-10 | minor | Two lore titles name the find | to fixer |
| P1-11 | major | HaX hub not progress-gated; four guide choices at once | to fixer (m02 pattern) |
| P1-12 | major | Five stuck points with no hint | to fixer |
| P1-13 | minor | Debrief/credits gating checked: agree | no change needed |
| P1-14 | minor | No credit for the directive | to fixer |
| P1-15 | minor | Day KO of Victoria settles her fate only on re-entry, phone-only | to fixer |
| P1-16 | minor | No music cue for night or revelation; action track under the debrief | to fixer |
| P1-17 | minor | Exec wing has little line-of-sight cover | deferred to the playtest phase |
| P1-18 | major | Five beats land only as phone lines | to fixer |
| P1-19 | blocker | No SecGen m03 XML, so the flags can't be earned on a real VM | needs the user (D1 in `DECISIONS_PENDING.md`). Review's claim that a distcc module must be written is **withdrawn**: SecGen has `modules/vulnerabilities/unix/misc/distcc_exec` |
| P1-20 | minor | No top-level `flags` block with `vm_flags_json` | to fixer, if safe standalone |
| P1-21 | minor | Validator duplicate-mapping warnings, cutscene background, blank re-entry; lint items | to fixer; spoken lint items deferred to Phase 4 |

Decisions: night staging option (a); all canon fixes now, worded for every m02 ending; Perfect Stealth hidden until earned; Ghost's "own build" callback through Victoria. Reason: each is mission-local and reversible, and matches m02.

### Round 1 fix (Opus fixer)

Plan appended to `ALIGNMENT_PLAN.md` ("Pass 5 alignment"). Outcomes: P1-1 to P1-12, P1-14, P1-16, P1-18, P1-20 fixed; P1-15 covered by P1-18; P1-21 fixed except the four `npc_ko:victoria_sterling` handlers, which are meant to fire together (justified in an ERB comment); P1-13 no change; P1-17 deferred; P1-19 open (D1). Act-2 aims are story-gated on `clone_call_done` and unlocked live by a mapping; "Settle Accounts" gated on `night_confrontation_ready`; Perfect Stealth hidden until the debrief's `#unlock_aim`; HaX hub rebuilt on m02's pattern with five gated hints. Static checks: ink compiles, validator schema pass with 1 justified warning, reopencheck 0 problems, door alignment OK, inkcheck/loopcheck clean. Browser: not yet (playtest phase).

Orchestrator check: grepped the briefing, revelation, Victoria and debrief lines and the unlock gates; all present. Correction made by the orchestrator: Victoria's new line called Ghost "he"; m02 uses "they" throughout, so the line now uses "they".

### Round 2 review (fresh Opus, read-only)

Counts (new): 0 blockers, 0 majors, 15 minors. Round 1: 13 closed, 6 partly closed (P1-5, 6, 10, 12, 18, 21: remainders minor), P1-19 open (user), P1-17 deferred. Confirmed in the engine: act-2 aims can't move in the day and the unlock is recorded server-side so it survives reload; "Settle Accounts" can't show before four flags; `#unlock_aim` works from person-chat; music triggers and the `end` playlist exist; debrief and credits agree.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P1-22/23/24 | minor | Canon-fix lines read badly: "invoice ... invoice"; "An invoice did." doesn't answer the question; "tonight" in a morning-after scene; Nightshade warning only some m02 players heard | to fixer |
| P1-25/26 | minor | Two hints show before the situation exists | to fixer |
| P1-27 | minor | Hints ignore a KO'd Victoria or guard | to fixer |
| P1-28 | minor | No hint for a hostile guard | to fixer |
| P1-29 | minor | Danny's task sits under "Breach the Server Room" | to fixer (office aim) |
| P1-30 | minor | Three aims open at once at night | to fixer (stagger if clean) |
| P1-31 | minor | Night music drops back to day noir after reload or a guard KO | to fixer |
| P1-32 | minor | Directive-decoded text repeats HaX; decoding has no task | to fixer |
| P1-33 | n/a | Folded into the P1-10 row by the reviewer | n/a |
| P1-34 | minor | ERB comment wrongly says the server re-derives globalVariable unlocks on reload | to fixer (comment); engine item E-1 logged |
| P1-35 | minor | New lines use "--" as a dash; spoken lines not listed by the fixer | to fixer (rule: no dashes in new text) |
| P1-36 | minor | `missions.json` lacks three m03 globals; two dead VARs | to fixer |
| P1-37 | minor | Two hints never retire | to fixer |

### Round 2 fix (same Opus fixer, resumed)

All round-2 items fixed: canon lines reworded (P1-22/23/24); hints gated on the situation existing (new synced globals `clone_read_dropped`, `sterling_on_call_seen`, `guard_hostile`, `guard_knocked_out`, `exec_office_entered`) and retired on progress; new hostile-guard hint; Danny's task moved to the office aim; night aims staggered (server room on the night turn, office on the first night entry to the exec wing, paper trail on the first night entry to either); music in four phases (day noir, night cutscene, confrontation spy-action, after the choice end), each with a `game_loaded` cue so a reload keeps it; new optional task "Decode the drive and tell HaX what it says"; lore titles made spoiler-free; target-selection callback put in Sterling's encoded client roster (not spoken); dead VARs removed; nine m03 globals added to `missions.json`; no dashes in any new text. Static checks: validator 1 justified warning, dialoguelint 0 errors (deferred lint only), reopencheck 0 problems over 439 reopens, inkcheck/loopcheck clean over ten states, tagdiff explained. Commit 48dc4c4 (WIP).

Orchestrator: fixed the hard-coded home path in `inkcheck.js`, `loopcheck.js` and `predict_door_sides.py` (tooling commit), so agents no longer need patched copies.

### Round 3 review (fresh Opus, confirmation)

P1-1..P1-37: 33 closed, P1-17 deferred (playtests), P1-19 open (D1), P1-33 n/a, lint items deferred to Phase 4, P1-28 reopened as P1-38. New: 0 blockers, 1 major, 2 minors. Verdict: another round needed (short).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P1-38 | major | Round-2 regression: new scenario global `guard_hostile` collides with the guard ink's VAR of the same name (set on a peaceful telling-off), so HaX says "stand and fight" after a scolding and hides the sightline hint | to fixer (rename, and check every new global for collisions) |
| P1-39 | minor | Clearing Sterling's office by day and skipping the wing at night leaves "Search Sterling's Office" never shown | to fixer |
| P1-40 | minor | `hint_password` shows at the night turn before the office aim exists | to fixer |

### Round 3 fix and round 4 confirmation

Fixer: `guard_hostile` renamed `guard_attacking` (set only by the engine's `npc_hostile_state_changed`); a collision sweep of every new global against every m03 ink VAR found no others; P1-39 mapping on `closing_debrief` (clone_call_done + exec_office_entered); `hint_password` gated on `exec_office_entered`, `hint_guard` shows by day with its talk-or-pay line night-only. No spoken lines changed.

Round 4 (fresh Opus): P1-38, P1-39, P1-40 closed. New: 0 blockers, 0 majors, 2 minors. **Verdict: Phase 1 closed.**

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| N-1 | minor | `player_approach` "aggressive" never set, so a debrief line can't play; briefing's "direct" never read; Victoria overwrites it (pre-existing) | deferred to Phase 4 (dialogue: dead variables) |
| N-2 | minor | `hint_password`'s wall-safe line can show by day before the server room exists for the player | fixed by the orchestrator: line wrapped in `{whiteboard_seen or clone_call_done:}` (text unchanged, no TTS cost); ink recompiled, validator clean, inkcheck clean |

### Phase 1 summary

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 1 | 9 | 11 |
| 2 (new) | 0 | 0 | 15 |
| 3 (new) | 0 | 1 | 2 |
| 4 (new) | 0 | 0 | 2 |

Open from Phase 1: P1-19 (D1, SecGen, user); P1-17 (exec-wing cover, playtests); lint items and N-1 (Phase 4); E-1 (engine, optional). Checks: all static. Nothing in this phase was tested in a browser; the playtest phase covers the night aim stagger, the four music phases after reload, the decode task, the hostile-guard hint and Perfect Stealth appearing only at the debrief.

Tooling item (optional, for approval): a validator check for a scenario global sharing its name with an unrelated ink VAR (would have caught P1-38).

## Phase 2: puzzle chains

### Round 1 review (fresh Opus, read-only)

Counts: 0 blockers, 4 majors, 9 minors. No unambiguous factual bugs found (CVE claims right: the ProFTPD 1.3.3c source backdoor has no CVE; distcc CVE-2004-2687 on port 3632). Good already: three boss-key locks (server room, wall safe, office PC) with two cross-building hunts; the wall-safe decode chain is the strongest puzzle; Victoria's fate is required; `concludeRequires` lists only the four flags; all four VM flags are required and carry act 2. Draft SecGen XML written (scratch `m03-puzzle-r1-review/m03_ghost_in_the_machine.xml`; all four modules exist in SecGen).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P2-1 | major | Catalogue and transaction log re-itemise invoice ZDS-2024-0847 and contradict m02's invoice (premium vs discount, missing lines) | to fixer: align non-spoken lore to m02; premium stays as Zero Day's list-price logic so spoken lines hold |
| P2-2 | major | RFID cloner (m03's new kit) is in the start bag and used at the first carded door; no wall felt first | orchestrator decision: mission-local light fix (fail a carded door, then HaX introduces the cloner). Reason: the arc wants the absence felt; reversible |
| P2-3 | major | Flag 1 "network scan" has no source on a real VM (nmap emits no flag) | to fixer: banner/index placement as in the draft XML; task and hints say read the banners |
| P2-4 | major | Three `emit_event` flagRewards nobody listens to | to fixer |
| P2-5 | minor | "distcc holds the case" has six sources | to fixer (trim to two or three) |
| P2-6 | minor | Office-PC password handed over (format plus worked example; year in five places) | to fixer (small deduction) |
| P2-7 | minor | Phase-2 directive quiz free to brute-force | to fixer |
| P2-8 | minor | ERB comment calls the draft MIME; it is plain Base64 | to fixer |
| P2-9 | minor | `[NOTE]` tag in a text file | to fixer (reviewer judged it diegetic; fixer to confirm) |
| P2-10 | minor | Perfect Stealth lost via `guard_challenged` without a detection | to fixer |
| P2-11 | minor | Main hallway empty, the only day-night pacing beat | to fixer |
| P2-12 | minor | Briefing's "PIN cracker left with Nightshade" assumes an optional m02 pickup | no change: holds as rationing fiction (orchestrator agrees) |
| P2-13 | minor | `player_approach` overwrite (same as N-1) | deferred to Phase 4 with N-1 |

### Round 1 fix (fixer, resumed)

Plan appended to `PUZZLE_CHAINS_PLAN.md` ("Pass 5 puzzle chains"). No ink changed, so no spoken lines. P2-1 fixed (transaction log itemised as m02's invoice: ProFTPD $25,000, recon of 214 hospitals $15,000, target selection $10,000, deployment guide $5,000, total $55,000 after the 15% affiliate discount; the premium is a margin note and stays in the catalogue as list-price logic, so the Phase 1 spoken lines hold). P2-2 light version: the opening message no longer pre-arms the cloner; HaX introduces it on the first `door_unlock_attempt` at the conference room (the engine opens the cloner minigame rather than a hard refusal when the cloner is held, so a true "fail, then grant" needs engine work). P2-3, P2-5, P2-6, P2-8, P2-10 fixed. P2-4 left: the schema allows only the array form of `flagRewards`, which is index-paired with the flags, so the three dead `emit_event` rewards can't be dropped without moving the distcc reward (engine/schema item E-2). P2-7 marked deferred by the fixer without a ruling; sent to round 2 to judge. Credits keep their existing em-dash house format (25 lines already use it). Static checks clean; commit 5a95140 (WIP).

### Round 2 review (fresh Opus; rerun after a container restart lost the first attempt)

Verdict: implementable, converging. Round 1: P2-1, 5, 6, 8, 10 closed; P2-2 works but few players will meet the door before cloning (P2-16); P2-3 partly closed (P2-17); P2-4 worse than logged: each dead `emit_event` shows "Rewards Unlocked / Event triggered" at the flag station; P2-7 judged a puzzle issue (guessing earns the decode credit and debrief line). New: 0 blockers, 1 major, 4 minors.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P2-4 | minor | Dead rewards visible as "Event triggered" | via P2-15 |
| P2-7 | minor | Directive quiz guessable; guess earns the "decoded" credit and line | to fixer (`directive_guessed`; credit and line for a first-try answer only) |
| P2-14 | major (SecGen draft) | Round 1's draft XML generated flag 1 twice (shifting flags) and put it where the runbook says nothing matters | fixed in the round 2 draft: flag 1 generated once into the FTP banner and a web-index comment; flag 3 price list and flag 4 log copied from the game text |
| P2-15 | minor | Replace `emit_event` rewards with `set_global` (schema allows it; no reward panel) | to fixer, option B (fresh unread keys, zero risk). E-2 no longer needed for m03 |
| P2-16 | minor | Cloner named before the player meets the reader; "Reception first." and "not your visitor pass" wrong | to fixer: reword (A) and offer the receptionist's clone choice only after the door attempt or asking HaX (B) |
| P2-17 | minor | Recon guide line still says the scan flag comes off a clean sweep | to fixer |
| P2-18 | minor | Log lacks m02's "Target" line; TOTAL line wraps | to fixer; XML to re-sync |

Correction to the spoken-lines list: the engine voices a phone line only when it starts with `voice:` (`phone-chat-ui.js` ~568) and HaX's phone ink has none, so the Phase 1 phone lines (revelation call, hints) are on-screen text and cost no TTS. Person-chat lines (briefing, Victoria, debrief, night transition) are voiced.

### Round 2 fix (fixer, resumed)

All ruled items in (commit 5ea9d78, WIP): `set_global` rewards on write-only keys `vm_flag1..3_reward` (index pairing kept); `directive_guessed` set on a wrong answer, so the "decoded by the agent" credit and debrief line need a first-try answer (debrief and credits agree; the optional task still completes); cloner no longer named before the reader (aim, task title "Get through the conference room's card reader", opening text, door text reworded); receptionist's clone choice needs `conference_reader_tried` (door mapping) or `cloner_explained` (briefing tag, HaX hint, RFID guide); recon guide line and HaX's day progress line reworded; transaction log gains the Target line and a separate discount line; post-it reads "Surname plus the year the firm was founded". No voiced line changed (four phone text lines changed, listed below). Static checks clean.

### Round 3 review (fresh Opus, confirmation)

P2-1..P2-18 all closed or ruled; nothing broken by round 2 (door handler sits on the start-room phone contact; the receptionist re-reads globals on reopen; no player left without a next step after reload, a receptionist KO, or never opening the phone). New: 0 blockers, 0 majors, 2 minors. **Verdict: Phase 2 closed.**

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P2-19 | minor | Task "Get through the conference room's card reader" ticks before the player goes through; aim says "card readers" (plural) | fixed by the orchestrator: "Find a way past the conference room's card reader"; aim "Get past the card reader" (non-spoken; validator clean) |
| P2-20 | minor | Round-2 browser checks not yet run | carried to Phase 5: door then clone choice (incl. after reload); wrong-then-right directive (credit and debrief line); all four flags with no reward panel for 1-3 |

Note: a game saved before 5ea9d78 might only pass the reader by a receptionist KO in rare cases; dev saves only, no action.

SecGen draft: `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` (flag 4 log matches `operational_log_content` exactly; four flag generators; validates against SecGen's schema). Linked from D1.

### Phase 2 summary

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 4 | 9 |
| 2 (new) | 0 | 1 | 4 |
| 3 (new) | 0 | 0 | 2 |

All checks static. Browser checks carried to Phase 5 (P2-20). Capability arc note for the user: m04 should show the fingerprint kit's wall before granting it.

## Phase 3: scenario design review

### Round 1 review (fresh Opus, read-only)

Counts: 0 blockers, 3 majors, 15 minors. Solvable on every branch checked (each fate for Victoria and Danny, every guard outcome, each NPC KO, receptionist KO, day office raid); one soft-lock on a reload between Victoria's choice and the debrief (P3-1). All static; P3-1 and P3-3 are read from engine code and need a browser check.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P3-1 | major | `victoria_choice_made` is set by a tag that runs before her final lines; the debrief opens and cuts them; reload in between strands the mission | to fixer: set on her `conversation_closed`; room-entry backstops |
| P3-2 | major | Wall-safe catalogue is word for word the flag-3 price list, so the best chain pays out nothing new; "catalogue not recovered" credits contradict HaX | to fixer: split content (price list loses buyers; safe keeps SOLD ledger and Phase 2 stock); proposed XML updated |
| P3-3 | major | HaX's automatic calls close what the player just opened (catalogue, draft, roster, drive, flag station; m02's A7) | to fixer: m02 text-that-opens-the-call pattern |
| P3-4 | minor | Opening an encoded file counts as reading it; Victoria's choice and a voiced roster line name undecoded content | to fixer |
| P3-5 | minor | Nothing says leave after Sterling's card is saved | to fixer (HaX text) |
| P3-6..P3-10, P3-12, P3-15..P3-17 | minor | Clone hint says "lean in" not "talk to her"; stale "Where do I stand?"; one incident counted as two detections; credits miss Danny/guard/player KO; reloaded guard hostile in ink not engine; decode recipe given three times; HaX receptionist-KO text wrong at night; drive call doesn't say where the laptop is; guard ignores torch beam | to fixer (mission-local parts); engine parts logged |
| P3-11 | minor | Brief `on_resume` (m02 uses `once`) | to fixer |
| P3-13 | minor | `mission.json` has a stray "EXPLOITATION" keyword; "Zero-day marketplace" and "Evidence correlation" told, not done | to fixer (drop the keyword); optional voiced n-day line skipped |
| P3-14 | minor | Dungeon graph draws no globalVariable gates ("0 hops") | engine/tooling item E-C |
| P3-18 | minor | P2-11 (empty hallway) outcome not logged | logged: no change, the empty hub carries the act break |

CyBOK: RFID, social engineering, ethics and pricing exercised on the required path; network and exploitation keywords exercised but need the VM (D1); Base64/hex/multi-layer decoding, lockpicking, PIN safe and default passwords optional only. Field guides: all six lab sheet links resolve.

Engine items from this round, for approval: E-A CyberChef decode event; E-B NPC hostility kept across reload; E-C graph generator draws globalVariable gates; E-D "player in sight" event so a guard can challenge on sight.

### Round 1 fix (fixer, resumed)

All ruled items in (commit 90437d6, WIP). Engine finding confirmed by the fixer: person-chat runs a batch's tags before its lines (`person-chat-minigame.js` ~1005), so P3-1 was real; `victoria_choice_made` now comes from a mapping on `conversation_closed:victoria_sterling`, with reload backstops on the always-loaded night_transition NPC. Four HaX calls are now texts that open the call when clicked. Safe catalogue keeps buyers and adds Critical Mass reserved stock; the VM price list (proposed XML flag 3) has no buyers. Danny KO after his choice gets its own debrief knot (2 new voiced lines) and credit; guard KO credit added; `game_loaded` clears `guard_attacking` (mitigation for E-B); brief `once`; "EXPLOITATION" dropped. Static checks clean. Needs browser: Victoria's final lines, the backstop, the four call texts, the reloaded-guard hint.

Round 2 runs two ways at once: a fresh Opus static re-review and a Sonnet browser probe of P3-1 and P3-3.

### Round 2 static review (fresh Opus)

Counts (new): 0 blockers, 1 major, 6 minors. P3-1 holds when traced (handlers registered from the start room; debrief opens 500 ms after her chat closes; can't play twice; backstops need a room entry and `clone_call_done`). Closed: P3-4..9, 11, 12, 13, 15, 16, 18; P3-2 closed in game with leftover wording; P3-3, P3-10 partly closed; P3-14 waits on E-C; P3-17 waits on E-D.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P3-19 | major | Revelation call opens only from a notification that can expire, be dismissed or be dropped when several pile up; then `revelation_heard` never sets and all six end-of-network texts (where Sterling is) never arrive | to fixer: hub option to replay a missed call (m02 pattern); "Where do I stand?" names the conference room, with a KO variant |
| P3-20 | minor | After reload the once-only setter of `guard_attacking` is spent; guard ink still treats a peaceful reloaded guard as hostile | to fixer |
| P3-21 | minor | Gated roster debrief line can never play | to fixer (delete) |
| P3-22 | minor | Leftover split wording: credit says buyers unknown though the log names Ghost; proposed XML "STAFF ONLY" vs "clients only" and stale line refs; two voiced debrief lines call the catalogue "a price list" | to fixer (credit, XML); voiced lines left as they are (cost) |
| P3-23 | minor | Victoria's new choice echoes her voiced reply | deferred to Phase 4 |
| P3-24 | minor | "Knocked out on his rounds" credit also shows for a day-desk KO | to fixer |
| P3-25 | minor | Reload after her fate is set but before her chat closes: she's visible, and a KO overwrites the fate | to fixer |

### Round 2 browser probe (Sonnet, games 5001 and 5002, headless; late-game globals set by console, so exercised, not earned)

| Check | Result |
|---|---|
| P3-1 recruit ending: Victoria's final lines all show, then the chat closes, then the debrief and credits | PASS (game 5001; arrest and escape endings not played) |
| P3-1 backstop: reload after the choice, debrief opens once | PASS (game 5002; opened at once on load, once only) |
| P3-3 flag station stays open after flag 4 | PASS |
| P3-3 HaX text opens the revelation call | PASS from the toast only; the contact-list entry opens the hub |
| P3-3 document stays open while a text arrives | PASS (tested on the whiteboard, not a Sterling document) |
| Pointer to Sterling if the revelation is never opened | PARTIAL: only the generic task; no text (agrees with P3-19) |

Harness note to check: typing flags 1-3 back-to-back once dropped flag 2 silently; resubmitting worked. Sent to the fixer to classify (harness or engine).

### Round 2 fix (fixer, resumed)

Commit e44d22d (WIP). P3-19: three hub choices replay a missed call (distcc revelation, catalogue, PC), each retiring once heard; "Where do I stand?" and the confrontation task name the conference room (KO variant too). P3-20: `guard_attacking` setter no longer onceOnly; the guard's hostile lines need both his ink VAR and the scenario global (behaviour change: a player ordered out without a fight who returns hears "You again. I'm keeping my eye on you." rather than "I told you to leave. I'm calling the police."; sent to round 3 to judge). P3-21 dead roster line deleted. P3-22 credit and proposed XML wording fixed. P3-24 credit "SECURITY GUARD: KNOCKED OUT ON SHIFT". P3-25 KO handler can't overwrite a set fate; Victoria hidden on room entry once her fate is set. No voiced line changed. Static checks clean.

Flag station (classified by the fixer from `flag-station-minigame.js`): real minor engine bug. Enter during an in-flight submission returns silently (`:613`), and the first submission's success clears the input (`:705`), so a flag typed during the round-trip is dropped with no feedback. Engine item E-E for approval: say "Still checking the last flag" and clear the input only if it still holds the submitted value.

### Round 3 review (fresh Opus, confirmation) and closing fix

P3-1..P3-25 closed, ruled or deferred (P3-14 waits on E-C, P3-17 on E-D, P3-23 to Phase 4). Nothing broken by round 2: replays gated and retired, `revelation_heard` set on both paths, the "Sterling's waiting" texts fire once in any flag order, the room-entry hide can't fire early, every KO route still sets a fate. New: 0 blockers, 0 majors, 4 minors. **Verdict: Phase 3 closed**, provided the guard-ink half of P3-20 is reverted.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P3-26 | minor | The engine never opens a conversation with a hostile NPC, so requiring `guard_attacking` in the guard's ink made his hostile lines dead and gave ordered-out players the friendly hub | fixed: guard ink conditions restored to plain `guard_hostile` (match a7036c5 apart from P3-8); scenario setter change and `game_loaded` clear kept |
| P3-27 | minor | A lingering toast could replay a call already heard from the hub | fixed: each of the three calls diverts to the hub when already heard |
| P3-28 | minor | Task says "Confront" for a KO'd Sterling | fixed: "Settle Victoria's fate in the conference room" (text) |
| P3-29 | minor | Stale line references in the proposed XML header | fixed: references now name what they point to |

Orchestrator check: grepped the guard ink (no `guard_attacking`), the task title and the revelation-call guard. Fixer's checks: validator, dialoguelint, reopencheck (0 problems), inkcheck/loopcheck clean; tagdiff explained.

### Phase 3 summary

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 3 | 15 |
| 2 (static + browser probe, new) | 0 | 1 | 6 (+3 from the probe, overlapping) |
| 3 (new) | 0 | 0 | 4 |

Browser-tested in this phase: P3-1 (recruit ending, reload backstop), P3-3 (station stays open, text opens the call). Static only: everything else. Carried to Phase 5: the hub replays and a lingering toast; the arrest and escape endings; guard after player KO and reload; reload between Victoria's fate and her chat closing; plus P2-20's list.

## Phase 4: dialogue

Ink snapshot of 3726cf4 (Phase 3 close) kept in scratch `m03-dialogue-snapshot/` for `tagdiff --old`.

### Round 1 review (fresh Opus, read-only)

Counts: 0 blockers, 9 majors, 33 minors (P4-1..P4-42). Per character: ship Danny and HaX's phone ink (small text fixes); light revise briefing, guard, narrator; revise receptionist, Victoria's afternoon interview, debrief. Already good: Danny's scene, Victoria's night confrontation, the guard's best dry lines, the debrief opening, the night transition, HaX's hub.

Top items: Victoria's afternoon makes the same two arguments five times with four stock analogies and spends her night payoff early (P4-1); her mission-statement lines read as AI-written (P4-3); the receptionist talks like an American brochure though cast as a Cardiff local, and her greeting repeats Victoria's (P4-8); the hospital premium has seven voices and "encoding isn't encryption" is taught seven times, including a course-outline briefing topic (P4-4/5/6); the debrief has three "now we have the proof" lines in a row, re-reads fates just heard, and on the recruited branch says the Architect "has one fewer supplier" while Zero Day still supplies (P4-24/29/7). Structure: dead `handler_trust` lines, unread `mission_priority` and five globals, a missing influence tag, a repeated and self-contradicting police threat, an unenforced bribe "hour", stale geography in the guard's lines, the briefing's "lean in near her desk", "Evening." at a morning briefing, a night choice answering an unasked question. Deferred items: N-1 partly closed (P4-23 remains); P3-23 → P4-9; choice length (trim Danny :77, justify Victoria :493); keep Victoria's one "not X but Y"; cut four stage cues.

Recommended voiced changes: 37 rewrites, 32 cuts, 7 optional (lean set 24).

Decision: take the full set. Reason: m03 has no audio generated yet (no `tts_cache/m03_*` in the repo), so a rewritten voiced line replaces nothing that was paid for; every m03 line is voiced fresh when its audio is generated.

### Round 1 fix (writer: the same Opus fixer, resumed)

Commit acbe10e (WIP). All 42 findings acted on (P4-37 justified: Victoria's 18-word offer and her one "not X but Y"). Edit notes in `DIALOGUE_EDIT_NOTES.md` ("Pass 5"). Voiced: 51 changed, 33 cut, 0 added (full list under "Spoken lines changed"). tagdiff vs snapshot: Danny, receptionist, phone, night transition structurally unchanged; briefing (learn topic, dead writes, `mission_priority`), Victoria (stance overwrite), guard (influence tag) and debrief (dead blocks, fate re-reads) changes all intended. dialoguelint 0 errors, 4 justified warnings. Orchestrator check: grepped sample lines; no new dashes in any .ink.

## SecGen

m03 XML missing on SecGen master. Proposed file: `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` (D1). No SecGen edits made.

## Spoken lines changed (old → new)

### Phase 1

Changed:
- HaX (briefing): "Ghost's logs say so. That's the buyer's word. Tonight we get the seller's." → "An invoice did. It surfaced at St. Catherine's with Zero Day's name on the sale -- the paper the buyer left behind. Tonight we get the seller's own ledger."
- HaX (briefing): "...Whether anyone died came down to a recovery call." → "...How many died came down to a recovery call."
- HaX (briefing): "...Twenty-five thousand on the invoice, with a healthcare premium on top." → "...Twenty-five thousand on the invoice, healthcare premium already built into the price."
- HaX (phone, revelation): "Ghost's logs named Zero Day. Now their own ledger says it back -- timestamped, Sable's approval on it. A case with a name." → "At the hospital we had the invoice -- the buyer's end. Now their own ledger says it back. A case with a name."
- Victoria: "I read every obituary. I can recite them in order. It changed nothing I believe." → "I read what that ward cost, down to the number. It changed nothing I believe."
- HaX (debrief): "At the hospital we had the buyer's word for where the exploit came from. Now we have the seller's own books saying it back." → "At the hospital we had the invoice -- the buyer's end of the sale. Now we have the seller's own books saying it back."

Added:
- Victoria: "Your Ghost liked to tell people they wrote that exploit themselves. They didn't. They bought it from me, twenty-five thousand, hospital premium and all."
- HaX (debrief): "Ghost's still out there -- the operator who ran that ward. But tonight you put the hand that armed them on paper. That's the supply chain Nightshade kept warning us about."
- HaX (phone): five new hint knots (hint_sterling_night, hint_danny, hint_guard, hint_safe, hint_clone), 3–4 lines each.
- Narrator (night transition re-entry): "The hallway's still on its night lights. Off to the east, the guard goes round again."

Round 2 (replacing round-1 wording where noted):
- HaX (briefing), round-1 line replaced: → "They did. An invoice turned up at St. Catherine's with Zero Day's name on the sale, the paper the buyer left behind. Tonight we get the seller's own ledger."
- HaX (debrief), round-1 line replaced: → "At the hospital we had the buyer's paperwork. Now we have the seller's own books."
- HaX (debrief): "You called it murder with an invoice. Now we have the invoice." → "You called it murder with an invoice. Now the seller's ledger says it too."
- HaX (debrief), round-1 addition replaced: → "Ghost's still out there. But last night you put the people who armed them on paper. That's ENTROPY's supply chain."
- HaX (phone revelation), round-1 line replaced: → "St. Catherine's gave us the buyer's invoice. This is the seller's own ledger, saying the same thing. A case with a name."
- HaX hints (new in round 1, reworded to drop dashes): hint_sterling_night "Finish the network first: recon, the services, the distcc box. Once the case is made she'll turn round."; hint_danny "One. Danny Foster, a consultant, in the south office off the executive wing. He drew the recon that made the hospital job possible."; hint_guard "If he's already looking, break off. Step out to the main hallway or into Danny's office until he's moved on."; hint_safe "So it's on her office machine, an unsent message saved as raw source. Decode it at the CyberChef workstation for the four digits."; hint_clone "Her card's custom keys. It takes about half a minute to read, and she steps away when she's wary."
- Added, HaX hint_guard_hostile: "He's hostile now. Keep moving and stay out of his reach, or stand and fight." / "He goes down if you fight him, but it goes on the record and it ends any claim to a quiet night."

### Phase 2 (all phone text, not voiced)

- HaX `directive_wrong`: "That's not what's on there. You're still a layer down. Run it again." → "That's not what's on there. I'm logging that one as a guess. Run it again."
- HaX `directive_right` (guesser variant added): "That's it, after a couple of goes. We take it to Command tonight." (the original "Two layers, and you peeled both..." plays on a first-try answer)
- HaX recon guide: "...nmap the subnet, read the versions, then pick your target. The scan flag comes off a clean sweep." → "...nmap the subnet and read the versions. The scan flag's in what the services say when you connect."
- HaX day progress: "Day one still. Reception's badge first, then Sterling's card in the meeting." → "Day one still. Get through the conference reader to reach Sterling. Stuck on the reader? Ask me how to clone a card."

### Phase 3

Voiced (new): debrief `danny_ko_after_choice`: "Danny Foster. You talked to him, and then somebody left him out cold in his own office." / "We picked him up this morning. Whatever he'd decided, he'll be explaining it from a hospital bed first." Voiced debrief roster line unchanged in wording, now gated so it effectively never plays.

Text only: Victoria's choice "[Phase 2. Critical Mass. The grid. You're already sourcing the targets.]" → "[I've been through your office, Sable. Your desk. Your files.]"; HaX phone lines (`hint_rfid`, `hint_encoding`, recap, PC call, directive call, catalogue call; three new recap branches); four call teasers; door text; night receptionist-KO text; "Card's saved" text; two catalogue credits reworded; two new KO credits.

### Phase 4 round 1 (voiced; m03 has no audio yet, so these replace nothing paid for)

Totals: 51 changed, 33 cut, 0 added.

Victoria (14 changed, 9 cut):
- "Every system tends towards disorder. That's thermodynamics - entropy is inevitable." → "Every system tends towards disorder. Entropy, if you like."
- "The question isn't whether systems will fail. It's who benefits from that knowledge." → "Systems fail. What matters is who knows first."
- "Zero Day's mission is simple: recognise that vulnerability knowledge has inherent value." → "Zero Day is simple. A vulnerability is worth something to somebody."
- "We discover, we price according to demand, we connect buyers with opportunities." → "We find it, we price it, and we find the somebody."
- "Precisely. Supply and demand. Transparent economics." → "Precisely."
- "Real Zero Day research requires understanding market dynamics, pricing models, buyer relationships." → "The lab teaches the craft. The money is in knowing who'll pay, and how much."
- "Interesting question. Most people don't even acknowledge there is a line to discuss." → "Interesting question."
- "That's refreshing. Most people lead with moral indignation." → "That's refreshing."
- "Security research is as much economics as it is code. Most researchers don't grasp that." → "Security research is as much economics as it is code."
- "My pleasure. It's rare to meet someone who actually wants to understand rather than judge." → "My pleasure."
- "The line is intent. We don't create exploits TO hurt people. We discover vulnerabilities that already exist." → "The line is intent. We don't build exploits to hurt anyone. We find holes that are already there."
- "*a beat* So you've been through my office. Then you understand how far past me this runs. And how little arresting me changes it." → "*a beat* Then you understand how far past me this runs. And how little arresting me changes it."
- "*considering* Not immunity. At least you're honest…" and "*amused* In exchange for what? …": stage cue removed, words unchanged.
- Cut: "We provide liquidity to the vulnerability market."; "A gun manufacturer isn't responsible for every shooting."; "We live in a world where vulnerabilities exist whether we like it or not."; "Do you hold pharmaceutical companies responsible when someone overdoses on painkillers?"; "Do you blame car manufacturers for drunk driving fatalities?"; "The truth is, I sleep fine at night because I believe in information freedom."; "Vulnerabilities are facts about reality. Suppressing facts doesn't make anyone safer."; "Let me guess - you want to ask about the "morality" of selling exploits."; narrator "You have the logs. That is the case."

Narrator in Victoria's scene (2 changed): "She settles the bag on her shoulder. The coat, the bag -- she has been ready to leave since before you crossed the threshold." → "She settles the bag on her shoulder."; "She's past you and gone before the lift doors settle. The evidence stays. So does she, somewhere out beyond it." → "She's past you and gone before the lift doors settle."

Receptionist (11 changed, 3 cut):
- "Good afternoon! You must be {player_name()}." → "Afternoon! {player_name()}, is it?"
- "Hi again! How's your visit going?" → "Back again? How's it going in there?"
- "Of course! We're a Cyber Security research and penetration-testing firm." → "Oh, we break into places. For money. Companies pay us to find the holes before somebody nasty does."
- "Well, you're in the right place! Ms. Sterling is brilliant." → "You've come to the right place, then. She doesn't see just anyone, mind."
- "That's exciting! Everyone here is very passionate about security." → "Oh, lovely. Don't let her scare you. She's like that with everyone."
- "Of course! Up the hallway, first door on the left." → "Go on, then. Up the hallway, first door on the left."
- "{&What else can I help with?|Anything else?|Ask away.}" → "{&Anything else, love?|Anything else?|Go on.}"
- "Have a great visit!" → "Go on through. She hates being kept waiting."
- "Ms. Sterling is amazing. She's a DEFCON speaker, published researcher, the whole package." → "Oh, she's brilliant. Speaks at all the big conferences, writes the papers, the lot."
- "Absolutely. Cyber Security is her passion." → "Oh, completely. Lives for it, she does."
- "Usually just Ms. Sterling if she's working late. And we have a night security guard - makes rounds to keep the place safe." → "Just Ms. Sterling, if she's working late. And the night guard. Does his rounds, drinks a lot of tea."
- Cut: "And welcome to WhiteHat Security!"; "Absolutely! Ms. Sterling is very proud of everything we've built since then."; "Sure! It's a pretty straightforward layout."

Guard (9 changed, 1 cut):
- "You've still got your hour. Use it, then you're gone." → "We had a deal. Get on with it."
- "Knock off? Not till six tomorrow morning. Double shift -- afternoon on the desk here, then the night rounds." → "Knock off? Not till six tomorrow morning. Double shift. Afternoons in here, then the night rounds."
- "*nods* Alright. But be quick about it…": cue removed.
- "Wrong answer. You're trespassing. Leave now or I'm calling the police." → "Wrong answer."
- "*flatly* I'm not ringing the boss at this hour on your say-so. You need to leave. Now." → "*flatly* I'm not ringing the boss at this hour on your say-so."
- "*scoffs* No favours. Leave or I'm calling the police." → "*scoffs* No favours."
- "One hour. You finish whatever you're doing and you're gone. I never saw you." → "You finish whatever you're doing and you're gone. I never saw you."
- "Ms. Sterling's office, mostly. Some storage. Conference room for high-level meetings." → "Ms. Sterling's office, north side. The consultants are across from her."
- "Between you and me, she's a bit intense. Very particular about security protocols." → "Between you and me, I keep out of her way. Everyone does."
- Cut: "One hour. After that, you're trespassing and I'm doing my job."
- Narrator: "The guard looks up from his desk." → "The guard stops his round and looks you over."

Danny (1 changed): "*defeated* Then I'll cooperate. For what it's worth. Just -- in whatever you write…" → "Then I'll cooperate. For what it's worth. Just... in whatever you write, say I didn't know at the start. Please."

Briefing (3 changed, 10 cut):
- Narrator: "A SAFETYNET briefing room. Director Netherton stands by the screen, Agent HaX has the file open in front of her, and a man in a lab coat sits half-buried in a laptop he clearly built himself." → "A SAFETYNET briefing room. Netherton by the screen, HaX with the file open, and a man in a lab coat half-buried in a laptop he built himself."
- Nightshade: "Evening. Whatever they've built…" → "Morning. Whatever they've built…"
- HaX: "Two stages. Reception first -- her staff badge opens the conference area. Weak defaults, so it cracks in seconds. Lean in near her desk to read it." → "Two stages. Reception first. Her staff badge opens the conference area. Weak defaults, so it cracks in seconds. Talk to her and lean in by her lanyard."
- Cut: HaX "They charge more to attack hospitals…"; the three `topic_learn` lines; the three `final_instructions` reaction lines; "One rule that always holds…"; "Stay focused. Don't let the stakes crowd your head." (dead); Nightshade "One day it'll be our badge somebody clones. Remember how easy it was."

Debrief, HaX (10 changed, 10 cut):
- "The guard stopped you and you lied your way on. He never caught you at a lock…" → "The guard stopped you once. He never caught you at a lock, but he'll remember your face."
- "The network first. You stripped their training lab and submitted the full set -- recon, FTP, pricing, and the distcc logs." → "The network first. All four flags, and the distcc logs are the case."
- "That last one is the case. The ProFTPD backdoor, sold to Ghost…" → "The ProFTPD backdoor, sold to Ghost, invoice ZDS-2024-0847, St. Catherine's on the target line, Sable's sign-off on the approval."
- "Victoria Sterling. Sable. Cover-CEO of the front and Zero Day's operational lead. She answered to 0day and the Architect, not the other way round." → "Victoria Sterling. Sable."
- "I agree. I also want you clear-eyed about it. She's a believer, not a mercenary. Turning someone who thinks they're right is the hardest asset to hold." → "I agree. Just stay clear-eyed. Someone who thinks they're right is the hardest asset to hold."
- "Her lawyers are already reaching for "information freedom" and "market forces". It won't hold. The healthcare premium proves she knew exactly what she was pricing." → "...It won't hold."
- "A trade, and you made it. Evidence secured, intelligence gone." → "A trade, and you made it."
- "…We take it to Command today." → "…Command's had it since first thing."
- "Phase 2 targets are being hardened. The cells that leaned on Zero Day's supply are scrambling. And the Architect has one fewer supplier." → "The cells that leaned on Zero Day's supply are scrambling, and the Architect has one fewer supplier."
- "Phase 2 targets are being hardened, quietly. The cells that lean on Zero Day's supply still think it's safe. And the Architect has one fewer supplier." → "The cells that buy from Zero Day still think it's safe. So does the Architect."
- Cut: "You walked in there knowing what it was. You came out with the paper that proves it."; narrator "Agent HaX's expression hardens."; the encoding lesson ("And they treated encoding as if it were a lock..."); "The drive in her desk, you left for the search team."; "We got the result. The execution was rough in places…" (dead); "Sterling's been charged."; "Sterling's reporting to us."; "Sterling's under guard."; "Sterling's gone to ground."; "{player_name()}. You put an arms dealer's books on the record last night."

Text only (round 1): receptionist, Victoria (5) and guard ("air con") choice labels; Danny's choice trimmed; HaX phone lines (bribe status, flags progress, keyed office, directive line, confrontation hint); timed texts ("Price list's in. ROT13, filed as confidential."; "Want a say in what happens to Danny? His office first." x2).

## Open items

- E-1 (engine, optional, for approval): on reload the server doesn't re-derive aims whose `unlockCondition` is a globalVariable; it relies on the recorded unlock. Works for m03 today; a derived check would make story gates robust if a recorded unlock were ever lost.
- D1 SecGen m03 XML (user).
- E-A..E-D (Phase 3 round 1) and E-E flag station silent drop: engine items for approval.
- E-2 (superseded for m03 by P2-15; still a schema inconsistency) (engine/schema, for approval): `scenario-schema.json` forbids the hash form of `flagRewards` that `games_controller.rb` prefers, so m03 keeps three dead `emit_event` rewards to preserve index pairing.
