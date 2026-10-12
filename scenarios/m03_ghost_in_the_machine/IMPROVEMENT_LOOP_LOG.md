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

### Round 2 review (fresh Opus script editor)

Verdict: revise (short). Round 1: 35 closed, 1 justified, 3 partly (P4-8, 15, 39), 3 made worse (P4-19, 28, 42). New: 1 blocker, 2 majors, 19 minors (6 optional). Ship: Danny, guard, HaX phone, narrator and night transition. Revise (mostly light): briefing, receptionist, Victoria, debrief. Read-through: the receptionist is a convincing Cardiff voice without caricature; Victoria's afternoon isn't thin after the cuts ("We find it, we price it, and we find the somebody." is the pass's best new line); her night scene is still the mission's best; the debrief paces better.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P4-43 | blocker | Round 1 cut Nightshade's "One day it'll be our badge somebody clones. Remember how easy it was."; m08 pays it off (m08 erb:744-749) | to writer: restore verbatim |
| P4-44 | major | First Victoria choice became a question; her reply still opens "Exactly." | to writer |
| P4-45 | major | Receptionist's "Back again? How's it going in there?" plays before most players have been in | to writer ("Back again? Forgotten something?") |
| P4-46..P4-64 | minor | Stale "hates being kept waiting" after the meeting; "Sable" then "Victoria Sterling is in custody"; vague "some of the paper"; a choice repeating her own line; unnamed "third option"; "refreshing"/"Good" stutter; "Just Ms. Sterling" vs Danny's evenings; brochure line; "Intense, is she?" echo; "the consultants"; "supply" three times; three "And" openers; stale comment; optional polish | to writer |

Process note: the round-1 reviewer recommended a cut without knowing a later mission quotes the line. Lesson for reviewers: grep later missions before cutting a line that sounds like a set-up.

### Round 2 fix (writer, resumed)

All items done (commit after acbe10e). P4-43 restored verbatim (orchestrator grepped it). Voiced: 1 restored, 19 changed, 3 cut. One structural change: the P4-48 condition in the debrief. Checks clean; four lint warnings justified.

### Round 3 review (fresh Opus script editor) and touch-up

P4-1..P4-64: 63 closed, 1 justified (P4-37). Every character "ship". Every cut line grepped against m04-m08: nothing else is paid off later. New: 0 blockers, 0 majors, 8 minors (3 recommended, 5 optional). **Verdict: Phase 4 closed.** All 8 taken (no audio cost yet): two repeats in Victoria's lines, two in the debrief, "stayed in" for the history and catalogue, the receptionist's echo, one surviving dash in the guard's line; five unread ink VARs removed (checked not synced or read anywhere). Orchestrator grepped two of the lines; validator schema passes.

### Phase 4 summary

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 9 | 33 |
| 2 (new) | 1 | 2 | 19 |
| 3 (new) | 0 | 0 | 8 |

All static. The dialogue playtest is part of Phase 5 (receptionist first and return visits, guard bribe and police routes, briefing hub, debrief on each ending).

## User rule (2026-10-04): no printed variables in voiced lines

A voiced line that prints `{player_name()}` or a count can't be cached by TTS. Recorded in `AGENTS.md` (standing rules) and the loop brief. m03 has 11 such voiced lines (10 `{player_name()}`, one `{guard_detection_count}`); they go to the fixer with the Phase 5 round 1 findings. Outside m03 (open item for the user): m02 has 7 and m04 has 4 `{player_name()}` uses in person-chat ink (other missions' phone text and choice labels can keep variables).

## Phase 5: playtests

Script: `PASS5_PLAYTEST.md` (two regression runs and 18 carried browser checks C1-C18); `TESTING_WALKTHROUGH.md` updated to pass 5. All runs headless on :3001. Testers' Writes to the scratchpad were refused in this round, so the orchestrator saved their reports from their final messages.

### Round 1 playtests (Sonnet)

| Run | Game | Result | Counts (tester) |
|---|---|---|---|
| A, day regression | 5005 | All day steps pass: reader refusal before the clone choice, reload at the refusal (no brief replay, state held), return greeting, both clones earned, night turn shows only the server-room aim. C6, C15 pass; C17 partial | 0 / 0 / 7 |
| B, night regression | 5003 | Partial: stopped when the permission layer refused a phone click at the drive step. Flags, no reward panel for 1-3 (C8), station stays open (C11), hub replay of the distcc call (C12, half), reload after flag 4, whiteboard, office and PC pass | 0 / 0 / 5 |
| Struggling player | 5004 | Roughest route (receptionist and Victoria KO'd, texts ignored, flags supplied with the VM unopened) still reaches the debrief and credits; KO lines fair | 0 / 2 / 5 |
| B2, night endgame | 5006 | Partial: stopped when a shell decode was refused. Plaque year then Sterling2010 earned; guard catch, cover story, retry and timed pass; Danny protect route; Perfect Stealth hidden after a catch | 0 / 0 / 5 |
| B3, finale | 5007 | PIN and quiz answer supplied (exercised). Wall safe, quiz wrong-then-right (C7), arrest ending with all her final lines (C9), debrief and full credits agree, guesser gets "decoded at HQ" (C2 not-earned case, C18 pass). C10/C14 reload window not caught | 0 / 0 / 3 |

Merged list with rulings: scratch `m03-pt-r1-merged.md` (R1-1..R1-21). Raised by the orchestrator: R1-20 major, the guard's patrol reaches Sterling's office door and the door is always in his sight, so all three night testers were caught on the first pick and Perfect Stealth is close to unearnable.

Orchestrator rulings so far: struggling S1 (flags accepted without the VM) withdrawn: standalone runs supply flags by design and the real check is the VM itself (D1); S2 (Victoria KO'd in the afternoon skips her choice) is the designed KO route, but the empty objectives panel after it (S3, also A4 after a normal clone) is real.

### Round 1 fix (fixer; commit a787228)

| Row | Outcome |
|---|---|
| R1-1 | New task "Walk out with the visitors and come back after dark" unlocks with a toast when Victoria's card is saved (every route, incl. the afternoon KO) and completes at the night turn. The old "Card's saved" text sat on a hidden person NPC, so its toast would have been voiced and clicking it would open the debrief story in the phone; moved to HaX |
| R1-2 | Night narration knows Victoria is unconscious |
| R1-3 | Debrief: "Not cleanly" line when the receptionist, guard or Danny was KO'd; neutral drive line; "map" choice gated on seeing the drive; credit "FOUND IN STERLING'S DESK BY THE SEARCH TEAM" |
| R1-5 | No change: the engine prints cues as written, as in m02 |
| R1-7, R1-8, R1-11, R1-12, R1-16, R1-21 | Fixed (VM address now 192.168.100.3, the target host in the proposed XML; receptionist's first chat offers the clone choice once HaX has explained it) |
| R1-10 | No change: the on-screen panel hides locked tasks; the harness lists them (engine/harness item E-G) |
| R1-15 | No change: a pushable chair inside Danny's door blocks the harness pathfinder, not a player |
| R1-20 | Guard loop re-timed (geometry and LOS unchanged): about 7.5 s unseen per 12 s loop, starting when he turns his back and walks west; HaX's "pick only when his back's turned" hint matches |
| Voice rule | 11 voiced lines rewritten without variables (e.g. "Afternoon! You'll be the three o'clock, is it?", "You must be the candidate."); the detection count is now "twice / more than twice"; phone text keeps `{player_name()}` |

New engine items: E-F a timed message on a person NPC makes a voiced toast that opens that NPC's story in the phone; E-G the harness `openTasks` lists locked tasks (skill code).

Confirmation runs (Sonnet, three in parallel): day, night (incl. the C10/C14 reload window), KO route.

### Round 1 confirmation (Sonnet, three runs)

| Run | Games | Result | Counts |
|---|---|---|---|
| Day | 5010 | Both clones earned; R1-1, R1-7, R1-8, R1-16, C6, two reloads, voice rule all pass | 0 / 0 / 4 |
| Night | 5009 (to credits), 5011 | R1-10, R1-11, R1-12, R1-20 (caught at his post, clean pick as he walks off, first try), R1-21, C7, C8, C11, C12, C18, C2 (PERFECT STEALTH credit on a clean run), escape ending, reload after flag 4 all pass; reload in the window keeps the fate and the debrief opens once on the next room entry (C10 behaviour differs from the script's description; C14 unreachable) | 0 / 0 / 7 (one setup artifact, one harness) |
| KO route | 5008 | R1-1 KO variant, R1-2, R1-3, R1-12 pass; debrief and credits agree on a messy run | 0 / 0 / 1 (harness) |

Leftover minors for round 2: clone choice label "Lean in to read the building directory." doesn't say it copies her badge; HaX's thread opens "Agent. What do you need?" above the interview text; grace line plays while the guard is already walking off; debrief "You did the technical work and still saw the people in it" for a player who never met Danny; C10/C14 description in PASS5_PLAYTEST.md; "Anything else, love?" straight after cloning. Engine-side: first reload went to the title screen, the second to the resume overlay (both recover).

### Round 2 fix (commit a73492c)

All six leftover minors fixed: clone label "[Lean in by her lanyard and let the cloner read her badge.]"; HaX phone opener "On the line, {player_name()}." (phone text); guard grace pair true at his post or walking off; "saw the people in it" gated on meeting Danny; a beat after cloning before her hub; C10/C14 rewritten (C14 not reachable). Static checks clean. No confirmation run for these (wording and one gate); the blind runs play through them.

### Blind playtests (Sonnet, two personas, fresh games)

Brief in scratch `m03-blind-brief.md`: testers read only the harness skill, housekeeping and what the game shows; no scenario files, reviews or scripts; flags supplied by the session policy with in-game prerequisites earned; one reload at a risky moment; scores for fun, pacing, clarity, openness and teaching.

### Blind playtest results

| Persona | Game | Outcome | Fun | Pacing | Clarity | Openness | Teaching | Counts (tester) |
|---|---|---|---|---|---|---|---|---|
| Do your best (reload after Danny's decision) | 5012 | Finished everything in ~24 min: both clones, every document decoded in the in-game CyberChef, password first try from slip + plaque, safe 5829 from the decoded email, Danny protected, Victoria turned, Perfect Stealth | 4 | 4 | 3 | 4 | 4 | 0 / 1 / 6 |
| Struggling player (reload after Victoria's rebuff) | 5013 | Finished in ~18 min skipping the paper trail; arrest ending; debrief judged fair | 3 | 3 | 3 | 4 | 4 (cloning) / 2 (rest) | 0 / 5 / 5 |

Worst stuck moments: the conference card reader (~5 min, struggling: nothing at the door says "cloner"; only the phone's unread count); starting Victoria's clone (~3 min, struggling: reachable only through one branch, and a blunt player is rebuffed with no hint how to retry); finding Sterling after the evidence (~2 min, best); losing a read by clicking the cloner as the cloning conversation went blank (~2 min, struggling).

Best lines (testers): "Ghost pulled the trigger. Someone handed them the gun."; "I priced the urgency in. Hospitals pay fast, and they pay quietly. That isn't cruelty. It's arithmetic."; "I sleep perfectly. That's the part people like you can never forgive."; "Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that."; "Forty per cent extra for a hospital. You priced the bodies in."

Merged with rulings in scratch `m03-blind-merged.md` (B-1..B-14): majors B-1 Victoria's clone reachable from any branch, B-2 visible cue at the reader, B-3 Sterling's location, B-4 blank dialogue at the end of the cloning conversation (ink or engine); minors B-5..B-12; B-13 (optional trail skippable) by design; B-14 (flags without the VM) withdrawn. Engine items noted by testers: flipper "Cancel" aborts the read; dictionary attack sometimes 15/16; tutorial prompt over the brief notes; identical phone timestamps; reload respawns in the lobby (known E2/P10).

### Blind-run fix pass (commit 0b49bc8)

| # | Outcome |
|---|---|
| B-1 | "[Is that your training lab on the whiteboard?]" is on Victoria's hub from the start, whatever branch and after a rebuff; task "Clone Victoria's keycard at her whiteboard" |
| B-2 | New optional task "Copy the receptionist's staff badge with your cloner" unlocks with a toast when the player tries the conference reader |
| B-3 | The panel task already named the room (the tester read harness ids); HaX's hub choice and answer now name the conference room too |
| B-4 | Engine, not ink: the flipper opens one Continue after the cloner buzzes; a cloner click from the inventory while the flipper is open starts a new reader and ends the open one (`interactions.js:877-889`, `minigame-manager.js:21-27`). Engine item E-H for approval |
| B-5..B-9 | Debrief and credits reworded and gated ("The drive wasn't the only paper you left behind."; "It's done. Get some rest. We'll need you soon." unless the history and catalogue came out; stealth credit "past the night guard unseen, with no excuses and no bribes"; catalogue advisories credit matches the debrief; flag-3 text no longer stale or naming the cipher) |
| B-10, B-12 | No change: the cabinet is reachable (tester got `inRange: true`); the second file is the harness `take` |
| B-11 | "Sable" said by the player only once they've heard it (new global `sable_named`); otherwise "[SAFETYNET. And I've read your approvals.]" with a new reply |

Targeted browser check (Sonnet, games 5015 day and 5016 night; night state console-set): B-1, B-2, B-3, B-4, B-5, B-9 pass on screen; B-11 pass for the "not heard" variant. Not reached in the browser, checked statically by the orchestrator (grep of the erb and ink): B-6 ("Clean enough" only with history and catalogue out; otherwise "It's done. Get some rest."), B-7 (stealth credit wording), B-8 (catalogue credit matches the debrief), the "Sable" variant. B-10 confirmed reachable on foot (harness path detours). 0 blockers, 0 majors, 4 minors (harness or wording-note only). Final static checks at the close: validator schema pass, dialoguelint 0 errors (4 justified warnings), reopencheck 0 problems.

**Phase 5 closed. Loop closed.**

### Phase 5 summary

| Round | Runs | Blockers | Majors | Minors |
|---|---|---|---|---|
| 1 | A, B (partial), B2 (partial), B3, struggling | 0 | 1 (guard window, orchestrator; struggling's 2 majors ruled by design / withdrawn) | 21 |
| 1 confirm | day, night, KO | 0 | 0 | 12 (incl. harness) |
| 2 (fix only) | - | - | - | 6 fixed |
| Blind | best, struggling | 0 | 4 (merged: B-1..B-4) | 8 |
| Blind fixes check | targeted | 0 | 0 | 4 |

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
- Cut: HaX "They charge more to attack hospitals…"; the three `topic_learn` lines; the three `final_instructions` reaction lines; "One rule that always holds…"; "Stay focused. Don't let the stakes crowd your head." (dead); Nightshade "One day it'll be our badge somebody clones. Remember how easy it was." (RESTORED in round 2: m08 pays it off)

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

### Phase 4 round 2 (voiced)

Restored 1 (Nightshade, above). Changed 19, cut 3, added 0.
- Victoria: "Exactly. But there's a third option most won't discuss." → "Neither. There's a third option most won't discuss."; "Systems fail. What matters is who knows first." → "Systems fail. What matters is who knows first, and who pays them for knowing."; "*coolly* Does it. Well. Most people don't bother to walk it back." → "*coolly* Do you. Well. Most people don't bother to walk it back."
- Receptionist: "Back again? How's it going in there?" → "Back again? Forgotten something?"; "Go on through. She hates being kept waiting." → "Go on, then. Shout if you need anything."; "Just Ms. Sterling, if she's working late. And the night guard. Does his rounds, drinks a lot of tea." → "Ms. Sterling, if she's working late. Danny, some evenings. And the night guard. Does his rounds, drinks a lot of tea."; "WhiteHat Security was founded in 2010 by Victoria Sterling." → "Ms. Sterling started it in 2010."; "Oh, completely. Lives for it, she does." → "Ha. She can be. Lives for it, she does."
- Guard: "Ms. Sterling's office, north side. The consultants are across from her." → "Ms. Sterling's office, north side. Mr Foster's across from her."; "Round the executive wing, mostly. Sterling's office, the consultants' rooms, back down the corridor." → "Round the executive wing, mostly. Sterling's office, Mr Foster's, back down the corridor."
- Briefing, HaX: "Two stages. Reception first. Her staff badge opens the conference area. …" → "Two stages. Reception first. The receptionist's badge opens the conference area. Weak defaults, so it cracks in seconds. Talk to her and lean in by her lanyard."; "And {player_name()} -- whatever the count turns out to be at St. Catherine's, people died on the back of what Zero Day sold." → "{player_name()}. Whatever the count turns out to be at St. Catherine's, people died on the back of what Zero Day sold."
- Debrief, HaX: "Victoria Sterling is in custody. The CPS are looking at …" → "In custody. The CPS are looking at conspiracy, supplying articles for use in fraud and computer misuse, and her part in the deaths at St. Catherine's."; "Her lawyers are already reaching for "information freedom" and "market forces". It won't hold." → "Her lawyers are already calling it "market-driven research". It won't hold."; "The cells that leaned on Zero Day's supply are scrambling, and the Architect has one fewer supplier." → "The cells that bought from them are scrambling. The Architect will have to shop elsewhere."; "Clean enough. Get some rest; we'll need you soon." → "Clean enough. We'll need you soon."; "We'll brief the next one when you're ready." → "Go home, {player_name()}. We'll brief the next one when you're ready."
- Cut: Victoria "That's refreshing."; receptionist "We do penetration testing, security audits and advanced research training."; guard "Get out. Now."

### Phase 4 touch-up (voiced, 8 changed)

- Victoria: "The lab teaches the craft. The money is in knowing who'll pay, and how much." → "The money is in knowing who'll pay, and how much."; "FTP, a web host, some legacy services -- there's a distcc box on there we keep telling the students not to touch. Real targets, not textbook ones." → "FTP, a web host, some legacy services. There's a distcc box on there we keep telling the students not to touch."
- Debrief, HaX: "They are. And every one of them bought from Zero Day." → "They are. Now we know who sells to them."; "When we know who they are. We're closer than we were. Every operation narrows it, and one day they slip." → "When we know who they are. We're closer than we were, and one day they slip."; "Their own history of the firm is still in Sterling's filing cabinet." → "...stayed in Sterling's filing cabinet."; "The exploit catalogue is still in the wall safe." → "The exploit catalogue stayed in the wall safe."
- Receptionist: "Ha. She can be. Lives for it, she does." → "Ha. You're not wrong. Lives for it, she does."
- Guard: "...And stay in the executive area - don't wander." → "...And stay in the executive area. Don't wander."

### Phase 5 round 1 (voiced)

- briefing: "{player_name()}. Zero Day Syndicate. You heard of them?" → "Right. Zero Day Syndicate. You heard of them?"; "...Tonight we get the seller's own ledger." → "...Now we go after the seller's own ledger."; "{player_name()}. Whatever the count..." → "Listen. Whatever the count..."; "And {player_name()}? Come back in one piece." → "And one more thing. Come back in one piece."
- receptionist: "Afternoon! {player_name()}, is it?" → "Afternoon! You'll be the three o'clock, is it?"
- Victoria: "You must be {player_name()}." → "You must be the candidate."; "And {player_name()}? I think..." → "Off the record? I think..."; "Understand what this is, {player_name()}." → "Understand what this is."; "We're done, {player_name()}." → "We're done here."
- debrief: "{player_name()}. Sit down..." → "There you are. Sit down..."; "clocked you {guard_detection_count} times" → "clocked you {twice|more than twice}"; "You left the drive in her desk. The search team pulled it out..." → "The search team went through Sterling's desk this morning and found a drive. Our people had it read..."; new "It is. Next time, bring it out yourself."; new "It got done. Not cleanly. Some people who never signed up for this will remember last night. We'll still need you soon."; "Go home, {player_name()}." → "Go home and get some sleep."
- night transition (KO variant): "Sterling is out cold on the conference room floor. You pull the door shut behind you." / "You walk out with the last of the afternoon's visitors. Nobody goes looking for her before the building shuts."
- guard: grace line → "He'll walk on in a moment. Step back, wait until his back's turned, then try again." (narration)

### Phase 5 round 2 (voiced)

- guard: "I'm still stood here, you know. Away from the door." → "I can still see you, you know. Away from the door."; narrator "He'll walk on in a moment. Step back, wait until his back's turned, then try again." → "Step back from the door. Wait until his back's turned, then try again."
- receptionist (new, after a clone): "Sorry, I was miles away. Where were we?"
- debrief (new): "Good work last night. We'll need you soon."

### Blind-run fixes (voiced)

- debrief (new variant): "The drive wasn't the only paper you left behind."
- debrief (new variant): "It's done. Get some rest. We'll need you soon." (instead of "Clean enough. We'll need you soon." when the history or the catalogue stayed behind)
- Victoria (new): "Then you've read more than most of my staff. You really have been thorough."

## Open items

- E-1 (engine, optional, for approval): on reload the server doesn't re-derive aims whose `unlockCondition` is a globalVariable; it relies on the recorded unlock. Works for m03 today; a derived check would make story gates robust if a recorded unlock were ever lost.
- D1 SecGen m03 XML (user).
- Other missions' voiced-line variables: DONE, commit 94716a0 (user-approved exception): 56 lines in 23 ink files (m02 7, m04 4, m05 5, m06 9, m07 2, m08 4, nine lab instructors 25); tagdiff unchanged; JSON recompiled. m02's 7 lines lose cached clips. Left for the user: m01 (frozen) has 4 voiced hits (closing debrief :59, :120, :724, and `{lore_collected}` at :896); m08 Netherton speaks `{suite_code}` (constant 5386, cacheable as is); sis03 Eleanor speaks `{archive_pin_value}` (6767 today but marked `@random_pin`, so uncacheable if randomised); demo/test/unused library ink not changed. A dialoguelint check for this is still on offer.
- E-A..E-D (Phase 3 round 1), E-E flag station silent drop, E-F person-NPC timed message voiced and opening the NPC story, E-G harness lists locked tasks, E-H a cloner click from the inventory while the flipper is open ends the open reader and loses the read; tester-noticed: flipper "Cancel" aborts the read, dictionary attack sometimes 15/16, tutorial prompt over the brief notes, identical phone timestamps, reload respawns in the lobby: engine items for approval.
- E-2 (superseded for m03 by P2-15; still a schema inconsistency) (engine/schema, for approval): `scenario-schema.json` forbids the hash form of `flagRewards` that `games_controller.rb` prefers, so m03 keeps three dead `emit_event` rewards to preserve index pairing.

# Pass 2 (2026-10-12)

Brief: `docs/agents/M03_PASS2_BRIEF.md`. Stages approved by the user: regression playtest, dialogue review round 2 (~5 cycles), room dressing (~5), lighting (~5), POV chat backgrounds, character pipeline for every NPC, fresh blind playtest. Later: lab sheet, audio, engine triage, SecGen.

## Room dressing, cycle 1 (2026-10-12)

Full record, per-room before/after and screenshots: `ROOM_DRESSING.md` (cycle 1), `build_evidence/dressing_c1/`.

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 2 | 2 | 0 |
| Major | 10 | 10 | 0 |
| Minor | 8 | 7 | 1 |

- Decision: m03 gets its own map types (`room_zds_reception`, `_conference`, `_office`, `_ceo`, `_servers`, builder rooms in `scripts/generate_rooms.py`, sheets from `scripts/room_gen/make_zds_tileset.py`) because m01 and 15 other scenarios share the old maps. Existing maps untouched.
- Decision: receptionist (6, 3) → (7.1, 4.9) and Danny (5, 4) → (6.5, 4), onto clear floor; no ink or mapping reads either position.
- Deferred: Server Room Whiteboard stays a notebook-page read; `readDisplay: "gameDisplay"` would skip its `onRead.setVariable` (`whiteboard_seen`) in `interactions.js`. Engine change, for approval.
- Spend: two PixelLab prop batches (~40 generations); 12 props kept.

## Dialogue cycle 1 fixes (2026-10-12)

Review acted on: `DIALOGUE_REVIEW_P2_C1.md` (0 blockers, 5 majors, 21 minors, 20 line rewrites, 7 missing or flat scenes). Fixer: Opus, to be resumed for cycles 2-5. Ink snapshot before editing: session scratchpad `m03-dialogue/snapshot_c1/` (tagdiff baseline). Line numbers below are in the new files.

| Severity | Found | Fixed | Withdrawn | Deferred |
|---|---|---|---|---|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 5 | 5 | 0 | 0 |
| Minor | 21 | 21 | 0 | 0 |
| Line rewrites | 20 | 20 (some reworded further) | 0 | 0 |
| Missing/flat scenes | 7 | 6, plus #7 as a HaX beat (orchestrator) | 0 | 0 |

### Renames (D2-23, orchestrator decision)

- Receptionist → **Ffion Rees**: id `receptionist_npc` → `ffion_rees`; ink `m03_npc_receptionist.ink` → `m03_npc_ffion_rees.ink`; `#speaker:ffion_rees`; event pattern `npc_ko:ffion_rees` (`scenario.json.erb:795`, `:802`); credits line `:185`. She introduces herself ("I'm Ffion.", `m03_npc_ffion_rees.ink:39`).
- Night guard → **Terry Mott**: id `night_guard` → `terry_mott`; ink `m03_npc_guard.ink` → `m03_npc_terry_mott.ink`; `#hostile:terry_mott` (6 tags); hostile-state condition `data.npcId === 'terry_mott'` (`scenario.json.erb:1167`); credits line `:184`. He gives his name when asked about Sterling ("It's Terry, since you didn't ask.", `m03_npc_terry_mott.ink:357`), which sharpens "never learnt my name". Victoria still never says it (`m03_npc_victoria.ink` meeting_end, "the guard gets territorial").
- Also updated: `scripts/ink_runtime_check/missions.json` (ids, storyPaths), the voice bible's m03 rows, the m03 header in `docs/agents/ENGINE_REGRESSION_SCRIPTS.md`. A dated rename note was added to the top of 32 stale docs that mention the old ids (m03 plans and reviews, playtest reports in `tools/playtest/`, planning notes, `PASS3_VOICE_AUDIT.md`, `PASS2_APPROVAL_LOG.md`, m06's plan).
- Decision: role-word globals stay (`receptionist_ko`, `guard_*`, the `receptionist_badge` card id). They name the job, which hasn't changed, not the old display name; renaming them would touch five inks and the objectives for no reader benefit. Overrule if wanted.
- Decision: names checked against every scenario and the story bible; no collisions. Ffion is a Cardiff name; Terry Mott fits an Essex contract guard in his fifties.
- The old compiled `m03_npc_receptionist.json` and `m03_npc_guard.json` are left on disk for now, because games snapshot `scenario_data` at creation (`app/models/break_escape/game.rb:25`) and the night tester's game still points at them. Delete both (`git rm`) once that run ends; any game created before this change needs a new game.
- Lobby sign: the cover name stays **WHITEHAT** (WhiteHat Security in every ink and the erb). No redraw needed.

### Majors

- **D2-1, fixed.** `the_reckoning` (`m03_npc_victoria.ink:570`) now offers a second stance: "[Ten thousand for target selection. It's on your invoice. You picked the hospital.]". She answers with the survey and "That's consultancy." A follow-up knot `target_followup` (`:588`) lets the player press with Danny (gated on having met him) or with "Is that what you'll call it in court?"; both reach `the_reckoning_close` (`:597`). The choice is gated on `transaction_log_read or revelation_heard`, because submitting the flag doesn't mean reading the printed log; HaX's revelation call now names the line item (`m03_phone_agent0x99.ink:444`), so nearly every player has it. New synced global `named_target_selection` (declared in the erb and missions.json); the debrief's arrested branch reads it (`m03_closing_debrief.ink:170`).
- **D2-2, fixed.** By day she deflects: lines #1-#6 rewritten (`m03_npc_victoria.ink:148`, `:160`, `:225`, the "Wilful" line, `:249`, `:260`, the ethics replies). `moral_rationalization` is now about money and talent ("The vendors pay them in T-shirts... I pay them properly."), which also seeds Danny's raise and the test question. No day line now makes the buyer's-responsibility argument; it is first said straight at night (`:466` old numbering, unchanged). "market-driven research" kept for the debrief callback.
- **D2-3, fixed (orchestrator: yes).** New knot `the_question` (`m03_npc_victoria.ink:304`), Victoria-initiated: after the first topic the hub diverts there once (`:173-179`), never after the read starts, sticky choices, all three answers return to the hub with the whiteboard on offer. Answers stored in local `victoria_test_answer` ("sold" +10 influence, "hedged" +5, "asked" +5 suspicion with the existing suspicion narration). Quoted back at night (`:528-533`).
- **D2-4, fixed.** Sticky fallback `+ [What do the students find hardest?]` in `clone_rfid_distraction` (`m03_npc_victoria.ink:388`). Proof: loopcheck with `recruitment_discussed=true rfid_clone_started=true asked_lab_services=true asked_lab_access=true asked_lab_praise=true` fails 4/6 strategies on the snapshot ink ("ran out of content") and passes 6/6 on the new.
- **D2-5, fixed.** `danny_discussion` reads Victoria's fate: protected + recruited (the sealed statement, Danny "off sick with stress", "It should be you"), protected + arrested, protected + escaped ("I said 'not yet'"), exposed + recruited (the deal and the court date), exposed + escaped (alone in the dock) (`m03_closing_debrief.ink:299-326`). The recruit-route plot hole (a consultant vanishing the night she's turned) is answered by the "off sick" line.

### Minors

| # | Outcome | Where |
|---|---|---|
| D2-6 | Fixed: pricing line made oblique ("Some sectors can't afford to lose anything."); the night line now reveals it. | `m03_npc_victoria.ink:405` |
| D2-7 | Fixed: Danny verdict lines cut (#16), "Keep doing both" replaced (#17), "Knowing it's coming is everything" replaced (#20); the "left" branch's "fair principle" line also made concrete ("He chose to switch his phone off."). | `m03_closing_debrief.ink:294`, `:333`, `:412`, `:250` |
| D2-8 | Fixed: escape route "She told you St. Catherine's was a proof of concept. She wasn't showing off."; other routes "the test run... the order book". | `m03_closing_debrief.ink:242-244` |
| D2-9 | Fixed: credit "PROTECTED — came in on his own, not charged". | `scenario.json.erb:178` |
| D2-10 | Fixed: dead `player_approach = "direct"` write removed; skip route sets local `skipped_background`, gives the compressed stakes line and sets `knows_m2_connection`. | `m03_opening_briefing.ink:46`, `:55-61` |
| D2-11 | Fixed: "SAFETYNET. Never heard of you. Is that meant to make me feel better?" | `m03_npc_terry_mott.ink:237` |
| D2-12 | Fixed: three answers to "Is Ms. Sterling expecting you this late?" in a choices-only `night_answer` knot; new synced global `ffion_night_story`; "notebook" makes Terry's challenge open on "Ffion said there'd be someone about. Notebook, was it?" and "So what are you doing in my corridor?". | `m03_npc_ffion_rees.ink:276-312`; `m03_npc_terry_mott.ink:49`, `:97` |
| D2-13 | Fixed: day greeting varies on return (`day_greeted`); "knock off" retires on its own day flag `asked_knock_off`, so it no longer spends the night's `topic_shift`. | `m03_npc_terry_mott.ink:73-90` |
| D2-14 | Fixed: phone greets once (`greeted`). reopencheck: 0 re-greets (was 60). | `m03_phone_agent0x99.ink:92-95` |
| D2-15 | Fixed: night hub line "Found it. Charger was in the biscuit tin, don't ask." then "I'm going, I'm going."; the night choice is now "[Night, Ffion.]". | `m03_npc_ffion_rees.ink:136`, `:141` |
| D2-16 | Fixed: low-influence night opener "You were rude this afternoon...". | `m03_npc_victoria.ink:525` |
| D2-17 | Fixed: gated on `sterling_on_call_seen` (VAR added): she saw the player in the doorway and let them go; her associates offered to deal with them. Night-call narration now "She doesn't seem to have heard you come in." so the reveal is honest. | `m03_npc_victoria.ink:513-516`, `:666` |
| D2-18 | Fixed: `victoria_recruited/arrested/escaped` tags and globals removed (no reader anywhere, grep of repo). | `m03_npc_victoria.ink` confrontation knots; erb globals; missions.json |
| D2-19 | Fixed: Victoria cut *warmly*, *evenly*, the first *coolly*, the second *slight pause*, *a beat*, *unhurried* (12 → 7 cues). Terry cut *pauses*, *sceptical*, *sharply*, *wary*, *stunned*. Lint density warnings gone for both. | |
| D2-20 | Fixed: buyer/seller paperwork now said only in the revelation call; briefing "Now we want their side of it."; debrief "Now it's in their own books." and "Turns out they kept the invoice." | `m03_opening_briefing.ink:83`; `m03_closing_debrief.ink:111-113` |
| D2-21 | Fixed: debrief arrested option is now the targeting stance ("She picked the ward off a survey of two hundred and fourteen." → "Targeting. That's the word the CPS will use."); KO reply now "She'll wake up to a charge sheet." "Pricing proves intent" stays with the phone. | `m03_closing_debrief.ink:173-174`, `:199` |
| D2-22 | Fixed: "had a packed bag under her desk since Tuesday". | `m03_npc_terry_mott.ink:275` |
| D2-23 | Fixed: see Renames. | |
| D2-24 | Fixed: idle choice "[Thanks again for your time.]"; reply varied with `{&...}`. "[Pick the conversation back up]" also made spoken ("[Sorry. One more question.]"). | `m03_npc_victoria.ink:114`, idle knot |
| D2-25 | Fixed: "[Freelance. Small jobs, mostly. I'm told she's hard to impress.]", which also earns a tip ("Let her do the talking. She likes an audience."). Corrected in cycle 2 (D3 Part 1): the tip is flavour and nothing reads it; the choice set is only mildly consequential, through the influence that opens `ask_building_layout` at 15. | `m03_npc_ffion_rees.ink:110-116` |
| D2-26 | Fixed by cutting: the awards wall and coffee maker are gone from Ffion's lines (replaced with "she'd tell you it's barely started" and the 2 a.m. taxi). Nothing handed to room dressing. | `m03_npc_ffion_rees.ink:92`, `:180` |

### Line rewrites and scenes

- All 20 weakest lines changed. Kept as proposed: #1-#3, #5-#16, #18-#20. Reworded: #4 (second half became the nuance reply plus a turned-back question), #17 (adds "We'll need you soon." to match its sibling lines), #19 ("No badge, a face I've never seen, and here at eleven at night. Pull the other one.", because the knot is reached from two different lies). Also rewritten outside the list: Victoria's "Who typically buys" reply, her three goodbye replies, `meeting_end`'s brochure line.
- Scenes #1-#5: built (D2-1, D2-3, D2-5, D2-17, D2-12).
- Scenes #6, goodbye stance: built. Local `afternoon_goodbye` ("keen" / "undecided" / "thanked"), read back at night when no sharper read applies.
- Night opener order (one read-back only, so the scene doesn't stack callbacks): receptionist KO → suspicion ("Twice is an inventory", protected line) → low influence (D2-16) → test answer → goodbye stance → "very easy to like".
- Scenes #7 (orchestrator: no Netherton line): HaX carries his payoff as one shown fact per fate: recruited "He had me write 'she priced a hospital' on the cover sheet" (`m03_closing_debrief.ink:161`), arrested "taking the file to the CPS himself" (`:188`), escaped "put her on every watch list... before I'd finished the sentence" (`:209`). No moral summing-up.
- Decision: the test is not quoted in the debrief; the night already pays it off and the debrief grew with D2-5.

### Checks run

- Compile: 8/8 files, no warnings (`./scripts/compile-ink.sh m03_ghost_in_the_machine`).
- Validator (full, with ink): schema passes, no errors. Remaining warnings are the known, justified ones (4 `npc_ko:victoria_sterling` handlers; the guard's repeatable lockpick catch; `night_transition` visemes suggestion; two cutscene NPCs with no behaviour).
- dialoguelint: 2 warnings, both pre-existing and justified in the review: `m03_npc_victoria.ink:561` not-x-but-y ("That isn't cruelty. It's arithmetic.", the villain's one) and `:606` choice-len 18 (P4-37). The two new findings this round (a 17-word debrief choice, a cue on a line with a number) were fixed. Stage-cue density warnings: gone.
- tagdiff `--old` against the snapshot, per file: every difference is listed in this entry (new VARs, knots `the_question`, `target_followup`, `the_reckoning_close`, `night_answer`; removed fate tags; renamed `#speaker`/`#hostile` tags; `skipped_background` for the dead "direct" write; `greeted`; `day_greeted`/`asked_knock_off` replacing the day `topic_shift` write). Danny and the night transition: structure unchanged.
- reopencheck: total problems 0; m03 phone "0 greeted again then the hub" (was 60).
- loopcheck: 32 states, all clean. Victoria at start, mid-read with all lab questions spent (D2-4), read dropped, test pending and answered, card cloned, night with each test answer, each goodbye, low influence, `sterling_on_call_seen`, Danny met/KO, after each fate; Ffion day and night (first and return, each story); Terry day (first/return), night (with and without the notebook story, after a warning), `on_lockpick_detected`; phone; Danny.
- inkcheck, debrief: 150 states (5 Victoria fates × 5 Danny fates × target named or not × {none, danny_ko, handler_trust 80}), 0 failing. Note: passing `danny_fate=""` literally to inkcheck fails on the old ink too (the harness reads the two quote marks as the value); the default empty state passes. Briefing: clean (800 paths, capped).
- No browser run this cycle.

### Spoken lines changed (old → new)

m03 has no audio, so none of this costs anything. Player choices aren't voiced and aren't listed. Every Ffion and Terry line also changed speaker name (prefix only); only wording changes are listed. Pairs come from a line diff, so a new line sometimes sits beside an unrelated cut line.

#### m03_npc_victoria.ink

- Victoria Sterling: We covered the main points. I'll be in touch about the training programme.
  -> Victoria Sterling: {&I'll be in touch.|Reception will see you out.|Was there something else, or are you lost?}
- Victoria Sterling: Neither. There's a third option most won't discuss.
  -> Victoria Sterling: Neither. Both assume the vendor deserves it for free.
- Victoria Sterling: *warmly* Good. You'd be amazed how many people choke on that sentence.
  -> Victoria Sterling: Good. You'd be amazed how many people choke on that sentence.
- Victoria Sterling: "Selling" is such a crude term. Think of it as market-driven research incentives.
  -> Victoria Sterling: "Selling." You say it like a confession. Call it market-driven research and the same room applauds.
- Victoria Sterling: That's not our concern. We're security professionals, not moralists.
  -> Victoria Sterling: Everyone asks that in their first week. Nobody asks it in their second.
- Victoria Sterling: It's recognising the reality of how markets work.
  -> Victoria Sterling: Wilful. Yes. It's the only kind of ignorance worth paying for.
- Victoria Sterling: Exploit sales happen with or without us.
  -> Victoria Sterling: The people who find these holes are the best in the world at it. The vendors pay them in T-shirts and thank-you emails.
- Victoria Sterling: So either the researcher gets paid, or the criminal does. I know which I'd rather fund.
  -> Victoria Sterling: I pay them properly. You'd be amazed what loyalty that buys.
- Victoria Sterling: *evenly* That's on the buyer, not the researcher who discovered the vulnerability.
  -> Victoria Sterling: Hospitals. You've done your reading. Most candidates wait for the second interview.
- Victoria Sterling: Interesting question.
  -> Victoria Sterling: Interesting question. Where would you draw it?
- Victoria Sterling: Tools have utility. People choose how to use them.
  -> Victoria Sterling: Ask me again once you've signed something. I answer that question for staff, not guests.
- Victoria Sterling: The line is intent. We don't build exploits to hurt anyone. We find holes that are already there.
  -> Narrator: She waits. When you don't fill the silence, she does.
- Victoria Sterling: If someone uses a crowbar to break into a house, you don't blame the crowbar manufacturer.
  -> Victoria Sterling: Most people draw it wherever they stop understanding the work.
- (none: new line)
  -> Victoria Sterling: I don't make holes. I find them, and I'm honest about the invoice.
- (none: new line)
  -> Victoria Sterling: My turn. One question. I ask everyone, and most people get it wrong.
- (none: new line)
  -> Victoria Sterling: You find a hole in an NHS trust's patient records. The vendor offers you a T-shirt and a thank-you. A buyer offers forty thousand. What do you do?
- (none: new line)
  -> Victoria Sterling: Quickly said. I'll remember that.
- (none: new line)
  -> Victoria Sterling: Wanting both. Honest, at least. It won't make you rich.
- (none: new line)
  -> Victoria Sterling: Nobody tells you. And if you need to know, you can't afford to.
- (none: new line)
  -> Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
- Victoria Sterling: *coolly* How thoughtful.
  -> Victoria Sterling: How thoughtful.
- Victoria Sterling: The training network uses real vulnerable services. Much more effective than theoretical exercises.
  -> Victoria Sterling: Everything on that board is real, and everything on it is broken. On purpose.
- (none: new line)
  -> Victoria Sterling: Patience. They want root in the first minute. The good ones wait.
- Victoria Sterling: CVSS is the baseline. Then a sector premium based on how well the target can defend itself. Hospitals can't, so hospitals cost more.
  -> Victoria Sterling: CVSS is the floor. After that, it's what the buyer's target can't afford to lose. Some sectors can't afford to lose anything.
- Victoria Sterling: *slight pause* Clients who need access to specialised research. I can't discuss specifics.
  -> Victoria Sterling: People who'd rather I didn't say. That's most of what they're paying for.
- Victoria Sterling: You're asking good questions. Technical competence is common. Strategic thinking is rare.
  -> Victoria Sterling: You ask questions like someone taking notes. I like that in staff. I watch for it in guests.
- Victoria Sterling: Exactly. That's why most security researchers stay poor while we thrive.
  -> Victoria Sterling: Exactly. Which is why my researchers are paid like surgeons.
- Victoria Sterling: We don't believe in traditional certifications. Results speak louder than paper.
  -> Victoria Sterling: Certificates are for people who want permission. My students don't ask.
- Victoria Sterling: I think that covers the basic philosophy. The training programme starts next month if you're interested.
  -> Victoria Sterling: That's enough philosophy for one afternoon. The programme starts next month. I'll know by Friday whether you're on it.
- Victoria Sterling: Excellent. I'll have my assistant send you the enrolment details.
  -> Victoria Sterling: Good. I'll have the enrolment details sent over.
- Victoria Sterling: Of course. Take your time. Reach out when you've decided.
  -> Victoria Sterling: Do. The good ones always want a night on it.
- Victoria Sterling: My pleasure.
  -> Victoria Sterling: I'm always straight with people. It's the cheapest way to be believed.
- Victoria Sterling: Feel free to look around the office if you'd like. Reception area, main hallway. Get a feel for the company culture.
  -> Victoria Sterling: Have a look round on your way out. Reception, the main hallway. Not the executive wing; the guard gets territorial.
- (none: new line)
  -> Victoria Sterling: You looked in on me earlier, while I was on the phone. That window shows the whole doorway.
- (none: new line)
  -> Victoria Sterling: My associates offered to deal with you. I told them I'd do it myself. I wanted to see what you'd bring back.
- (none: new line)
  -> Victoria Sterling: You were rude this afternoon. I put it down to nerves. Nerves don't come back at eleven at night.
- (none: new line)
  -> Victoria Sterling: You told me you'd take the forty. You said it very quickly. The ones who mean it take longer.
- (none: new line)
  -> Victoria Sterling: You asked what the buyer wanted it for. I should have ended the interview there.
- (none: new line)
  -> Victoria Sterling: Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open.
- (none: new line)
  -> Victoria Sterling: You told me this was exactly the work you'd been looking for. I believed you. That's the part I mind.
- (none: new line)
  -> Victoria Sterling: You said you'd think it over. I suppose you did.
- (none: new line)
  -> Victoria Sterling: You thanked me for being straight with you. I was. Pity it only went one way.
- Victoria Sterling: *a beat* Then you understand how far past me this runs. And how little arresting me changes it.
  -> Victoria Sterling: Then you understand how far past me this runs. And how little arresting me changes it.
- (none: new line)
  -> Victoria Sterling: Danny's survey. Two hundred and fourteen sites, and one with the oldest FTP box on the list.
- (none: new line)
  -> Victoria Sterling: Ghost wanted somewhere that would pay. I told them where. That's consultancy.
- (none: new line)
  -> Narrator: It's the first answer tonight she's had to think about.
- (none: new line)
  -> Victoria Sterling: Danny was paid a great deal of money to stop asking. He's the one who agreed the price.
- (none: new line)
  -> Victoria Sterling: In court I'll call it whatever my barrister tells me to. You'll have to get me there first.
- Victoria Sterling: *unhurried* A professional to the end. I could almost have used you.
  -> Victoria Sterling: A professional to the end. I could almost have used you.
- Narrator: She hasn't heard you come in. You ease back out before she turns round.
  -> Narrator: She doesn't seem to have heard you come in. You ease back out before she turns round.

#### m03_npc_ffion_rees.ink

- Ffion Rees: Afternoon! You'll be the three o'clock, is it?
  -> Ffion Rees: Afternoon! You'll be the three o'clock, is it? I'm Ffion.
- Ffion Rees: We also have a research division - Zero Day training programmes. Very cutting-edge stuff.
  -> Ffion Rees: There's the training side too. Zero Day. Don't ask me what they do in there, I only order the pizzas.
- Ffion Rees: Oh, very much so. She has a whole wall of awards in her office.
  -> Ffion Rees: Oh, very much so. Mind, she'd tell you it's barely started.
- Ffion Rees: Oh, lovely. Don't let her scare you. She's like that with everyone.
  -> Ffion Rees: She is. Don't let her scare you, she's like that with everyone.
- (none: new line)
  -> Ffion Rees: Tip? Let her do the talking. She likes an audience.
- Ffion Rees: I'm just off, honestly.
  -> Ffion Rees: {Found it. Charger was in the biscuit tin, don't ask.|I'm going, I'm going.}
- Narrator: The receptionist is back at her desk, rummaging in a drawer.
  -> (cut)
- (none: new line)
  -> Ffion Rees: Night, then. Don't let the guard scare you.
- Ffion Rees: She has a whole setup in her office - coffee maker, the works.
  -> Ffion Rees: Rings for a taxi at two in the morning and still beats me in.
- Ffion Rees: He's been a bit stressed lately, though. I think he's working on a big project.
  -> Ffion Rees: He's been off it lately, mind. Hasn't touched a doughnut in weeks.
- Ffion Rees: Penetration testing, mostly. He goes on-site to client locations for security audits.
  -> Ffion Rees: Site visits, mostly. Hospitals, loads of them this year. Came back from one and sat in his car for an hour.
- Ffion Rees: Card readers on the conference room and the server room. Ms. Sterling is very particular about access control.
  -> Ffion Rees: Ms. Sterling had them fitted herself. Says a door's only as good as whoever's holding the card.
- Ffion Rees: Still looking for that charger. Night!
  -> (cut)
- Ffion Rees: Night, then. Don't let the guard scare you.
  -> Ffion Rees: Sounds like her. She does her best talking after hours. Night, then.
- (none: new line)
  -> Ffion Rees: Go on, then. I'll tell the guard you're about, so he doesn't jump on you.
- (none: new line)
  -> Ffion Rees: Right. Well. Night, then.

#### m03_npc_terry_mott.ink

- (none: new line)
  -> Terry Mott: Ffion said there'd be someone about. Notebook, was it? Conference room's the other end of the building.
- (none: new line)
  -> Terry Mott: {&Still staff only, mate.|Back again? Still staff only.|Conference room's the other way. Still.}
- (none: new line)
  -> Terry Mott: So what are you doing in my corridor?
- Terry Mott: *pauses* Ms. Sterling mentioned a potential recruit... alright.
  -> Terry Mott: Ms. Sterling mentioned a potential recruit... alright.
- Terry Mott: *sceptical* New hires don't usually have after-hours access...
  -> Terry Mott: New hires don't usually have after-hours access...
- Terry Mott: This doesn't add up. You're not making sense.
  -> Terry Mott: No badge, a face I've never seen, and here at eleven at night. Pull the other one.
- Terry Mott: *sharply* Are you trying to bribe me?
  -> Terry Mott: Are you trying to bribe me?
- Terry Mott: *wary* SAFETYNET. The people off the news?
  -> Terry Mott: SAFETYNET. Never heard of you. Is that meant to make me feel better?
- Terry Mott: *stunned* Right. Yeah. Whatever you need.
  -> Terry Mott: Right. Yeah. Whatever you need.
- Terry Mott: And Ms. Sterling's been more stressed. Snapping at people.
  -> Terry Mott: And Ms. Sterling's had a packed bag under her desk since Tuesday. Didn't think anything of it till now.
- Terry Mott: Ms. Sterling? She's the boss. Signs my wages, never learnt my name.
  -> Terry Mott: Ms. Sterling? She's the boss. Signs my wages, never learnt my name. It's Terry, since you didn't ask.

#### m03_closing_debrief.ink

- Agent HaX: The receptionist's fine, before you ask. Concussed, and still trying to work out what she did to deserve it.
  -> Agent HaX: The receptionist, Ffion Rees, is fine, before you ask. Concussed, and still trying to work out what she did to deserve it.
- Agent HaX: At the hospital we had the buyer's paperwork. Now we have the seller's own books.
  -> Agent HaX: Now it's in their own books.
- Agent HaX: You called it murder with an invoice. Now the seller's ledger says it too.
  -> Agent HaX: You called it murder with an invoice. Turns out they kept the invoice.
- (none: new line)
  -> Agent HaX: Netherton signed off at six this morning. He had me write "she priced a hospital" on the cover sheet, so nobody forgets who we're in business with.
- Agent HaX: That's the line that closes it.
  -> Agent HaX: Not with "target selection, ten thousand" on her own invoice. And you got her to call it consultancy on an open line.
- (none: new line)
  -> Agent HaX: Targeting. That's the word the CPS will use.
- (none: new line)
  -> Agent HaX: Netherton's taking the file to the CPS himself. He doesn't, usually.
- Agent HaX: Hard to argue. The pricing alone proves intent.
  -> Agent HaX: Hard to argue. She'll wake up to a charge sheet.
- (none: new line)
  -> Agent HaX: Netherton put her on every watch list we can reach. Did it himself, before I'd finished the sentence.
- Agent HaX: St. Catherine's was the proof of concept. This is the scale-up.
  -> Agent HaX: She told you St. Catherine's was a proof of concept. She wasn't showing off.
- (none: new line)
  -> Agent HaX: St. Catherine's was the test run. This is the order book.
- Agent HaX: We're already moving. Stopping a distributed strike is hard. Knowing it's coming is everything.
  -> Agent HaX: We're already moving. For once we've got the head start.
- Agent HaX: Danny Foster. You gave him the way in and he took it -- came to us on his own last night. Cooperating fully.
  -> Agent HaX: Danny Foster. You gave him the way in and he took it.
- Agent HaX: I read his file and your notes. He drew a map under a lie.
  -> Agent HaX: Our people collected him at two this morning. He brought a box file and the photo off his desk, and he hasn't stopped talking since.
- Agent HaX: When he understood what it was for, it broke him. Sterling used him. He's no conspirator.
  -> (cut)
- Agent HaX: He won't be charged. But he'll carry it. That's its own sentence.
  -> Agent HaX: He won't be charged. He'll carry it anyway.
- (none: new line)
  -> Agent HaX: Here's the knot. Danny thinks Sterling's going down. She isn't. She's ours, and his statement stays sealed or she's burned inside a week.
- (none: new line)
  -> Agent HaX: As far as Zero Day knows, he's off sick with stress. Which isn't even a lie.
- (none: new line)
  -> Agent HaX: Somebody has to tell him she's walking. It should be you.
- (none: new line)
  -> Agent HaX: He asked which floor they're holding Sterling on. I didn't tell him.
- (none: new line)
  -> Agent HaX: You told him she'd answer for it. She's in the wind. He asked me this morning if that was still true. I said "not yet".
- (none: new line)
  -> Agent HaX: So the woman who lied to him gets a deal, and he gets a court date. I'll sign off on it. I won't pretend it's tidy.
- (none: new line)
  -> Agent HaX: And with Sterling in the wind, he's the only one from Zero Day standing in the dock. Juries notice that.
- Agent HaX: Letting people choose is a fair principle. It also means they sometimes choose to vanish.
  -> Agent HaX: You let him choose. He chose to switch his phone off.
- Agent HaX: You did the technical work and still saw the people in it. Keep doing both.
  -> Agent HaX: I read your notes on Foster twice. That's not a complaint. We'll need you soon.

#### m03_opening_briefing.ink

- Agent HaX: We need the client roster and the operational logs. Proof of who they arm, and how.
  -> Agent HaX: Short version: the exploit that took down St. Catherine's came from this shop. We want their books.
- (none: new line)
  -> Agent HaX: The client roster and the operational logs. Proof of who they arm, and how.
- Agent HaX: They did. An invoice turned up at St. Catherine's with Zero Day's name on the sale, the paper the buyer left behind. Now we go after the seller's own ledger.
  -> Agent HaX: They did. An invoice turned up at St. Catherine's with Zero Day's name on the sale. Now we want their side of it.

#### m03_phone_agent0x99.ink

- (none: new line)
  -> And a line under it: "Target Selection Consultation", ten thousand. They chose the ward for Ghost.
- HaX (phone text): It does. ENTROPY procurement, in writing. Ironclad.
  -> HaX (phone text): It does. One ENTROPY cell invoicing another. I may have it framed.

## Room dressing, cycle 2 (2026-10-12)

Record: `ROOM_DRESSING.md` (cycle 2), screenshots `build_evidence/dressing_c2/`.

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 7 | 7 | 0 |
| Minor | 7 | 7 | 0 |

- Decision: new `room_zds_hall` map for both hallways (was the shared purple `hall_1x2gu`); scenario edit is the two `type` lines only.
- Decision: `exec_laptop1` kept and used on the boardroom table rather than unregistered.
- Still deferred (not approved): Server Room Whiteboard read-in-place.
- Spend: two PixelLab prop batches (balance 3230 → 3202); 15 props kept.

## Room dressing, cycle 3 (2026-10-12)

Record: `ROOM_DRESSING.md` (cycle 3), screenshots `build_evidence/dressing_c3/`. Inputs: regression B2 (F-1 to F-3) and a fresh critique.

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 4 | 4 | 0 |
| Minor | 4 | 4 | 0 |

- F-1 fixed: plaque moved from x 70 (22 px from the lobby exit) to x 230, east of the slat wall.
- F-2/F-3 fixed: swivel chairs replaced by `exec_chair_back1`, a static copy, so decor never joins a pick-one menu; in game only the 16 scenario objects are interactable.
- New map `room_zds_hall_exec` for the executive wing (no third WHITEHAT sign). Scenario edits: that `type`, and `ffion_rees` position (7.1, 4.9) → (7.5, 4.9).
- No PixelLab spend this cycle.

## Room dressing, cycle 4 (2026-10-12)

Record: `ROOM_DRESSING.md` (cycle 4), screenshots `build_evidence/dressing_c4/`. Inputs: coordinator's notes on the cycle-3 sheet and a fresh critique.

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 2 | 2 | 0 |
| Minor | 5 | 5 | 0 |
| Optional | 1 | 0 | 1 (main hall left sparse: it is the walking route) |

- Danny's rug replaced by a small kilim under the camp bed; burgundy runner and console in the executive corridor; RESTRICTED redrawn as a plate on the back wall; AV panel, Danny's desk lamp, USB bowl on the reception counter.
- Withdrawn by me: CEO floor lamps (read as garden lamps).
- No scenario edits, no PixelLab spend.

## Dialogue cycle 2 fixes (2026-10-12)

Review acted on: `DIALOGUE_REVIEW_P2_C2.md` (revise, light: 0 blockers, 4 majors, 19 minors, 15 line rewrites W-1..W-15, 4 local flat scenes, 4 cycle-1 items not fully fixed). Fixer: the same Opus agent, resumed. Ink snapshot: scratchpad `m03-dialogue/snapshot_c2/` (taken after commit adee101b). Line numbers are in the new files. Scene #5 (Sterling and Danny threads in later missions) went to `docs/IDEAS_BACKLOG.md` (orchestrator); no other mission touched.

| Severity | Found | Fixed | Withdrawn | Deferred |
|---|---|---|---|---|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 4 | 4 | 0 | 0 |
| Minor | 19 | 19 | 0 | 0 |
| Line rewrites | 15 | 15 | 0 | 0 |
| Flat scenes (local) | 4 | 4 | 0 | 0 |
| C1 items not fully fixed | 4 | 4 | 0 | 0 |

### Cycle-1 items reopened

- **D2-17 regression:** closed by D3-1. The doorway reveal left the opener, so "Nor do they leave my receptionist..." follows "Recruits don't do that." again.
- **D2-12:** closed by D3-2. All three of Ffion's answers now reach Terry.
- **D2-3:** closed by D3-3 and D3-21. The test pays off ahead of the general suspicion line, and players who skip the topics get it after the clone.
- **D2-25:** log wording corrected in the cycle-1 entry. The tip is flavour; the choice matters only through influence. No ink change.

### Majors

- **D3-1, fixed.** Doorway reveal moved from the opener to `the_reckoning_close` (`m03_npc_victoria.ink:620-624`): "You stood in my doorway earlier. At night that window's a mirror." / "My associates offered to deal with you. I said I'd do it myself. I still might." The opener is now the arrival line, one read-back and, at most, the guard's call.
- **D3-2, fixed.** Terry reads every value of `ffion_night_story` (`m03_npc_terry_mott.ink:47-58`): "sterling" ("Ffion reckons Ms. Sterling's expecting you. She never said nothing to me."), "brushoff" ("Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?"), "notebook" (as before). The notebook story has its own answer, "[Wrong turn. I'll find it.]" (`:110`). A different story from the one Ffion heard costs 5 influence and gets "Funny. Ffion said notebook." or "That's not what you told Ffion." (`:117-156`). The "sterling" story makes the files excuse land ("Ffion said the same. Still nobody told me. Go on, then.").
- **D3-3, fixed.** Night read-back order (`m03_npc_victoria.ink:535-552`): `read_dropped` (the protected "Twice is an inventory", now always true) → test "asked" → "sold" → "hedged" → general suspicion, with a new line that is true for every suspicion route ("You asked me the questions a prosecutor asks. Recruits ask about the salary.") → low influence → goodbye stance → default. The review's proving route now plays the "asked" line.
- **D3-4, fixed.** The player answers HaX after the Danny lines: four choices-only knots, `danny_reply_protected/exposed/left/ko` (`m03_closing_debrief.ink:359-423`).
  - There are two or three stance choices per (Danny fate, Victoria fate) pair. Each gets a one-line reply and sets nothing.
  - Recruited + protected: "[I'll tell him.]" / "[Not yet. Let him have a week.]" / "[He was told she'd answer for it. She will. Just not to him.]".
  - Exposed + recruited: "[She's worth more to us than he is. That's the arithmetic.]" → "Careful. That's her word."
  - `architect_investigation` is cut from three lines to two (`:285-286`).
  - Split into four knots so the lint's crowded-hub check passes. The conditions were already exclusive.

### Minors

| # | Outcome | Where |
|---|---|---|
| D3-5 | Fixed: "[Consultancy. Is that the story you tell yourself so you can sleep?]" → "I sleep perfectly..." on the target route; the court option stays. | `m03_npc_victoria.ink:609-611` |
| D3-6 | Fixed: "Danny Foster's survey. One of mine." | `:598` |
| D3-7 | Fixed: the narrator line is cut; the pause is in her mouth (`*after a moment*`). The figure went to its own line to keep the cue off a line with a number. | `:598-600` |
| D3-8 | Fixed: "Then you'd never sell anything. The buyer who explains himself is the one you should worry about." | `:327` |
| D3-9 | Fixed: "Told you, I just do the pizzas..." / "Turned away a lad who'd been on the telly last spring." The cue is cut. | `m03_npc_ffion_rees.ink:97-98` |
| D3-10 | Fixed: "Go on, I'm locking the drawer..." and "Right. Well. Suit yourself." | Ffion `:145`, `:310` |
| D3-11 | Fixed: "If Ms. Sterling wanted you back here, she'd have told me. She hasn't." | Terry `:84` |
| D3-12 | Fixed: inline choice between fixed strings, "Told you this afternoon. On till six." when `asked_knock_off`. | Terry `:360` |
| D3-13 | Fixed: the laminate line, "Not even her. Right. I'm going to regret this.", and "Obstructing. Lovely. Fine. I'm not in your way." | Terry `:287`, `:293`, `:299` |
| D3-14 | Fixed: "He rang us just after midnight. Our people collected him at two." The credit and "came in by himself" now hold. | debrief `:300` |
| D3-15 | Fixed: gated choices, "[She'll call it consultancy in court too.]" or "[She picked St. Catherine's off a survey of two hundred and fourteen.]". | debrief `:174-179` |
| D3-16 | Fixed: the line ends at "on the cover sheet." | debrief `:161` |
| D3-17 | Fixed: "He took the raise after he knew. A court will care about the date." | debrief `:323` |
| D3-18 | Fixed: "[She priced in how fast hospitals pay. She'd earned the file.]" | debrief `:203` |
| D3-19 | Fixed: "I have another meeting..." cut; the scene closes on the phone buzz. | Victoria meeting_end |
| D3-20 | Fixed: varied re-entry lines for Victoria, Ffion and Terry. | Victoria `:108`, Ffion `:47`, Terry `:73` |
| D3-21 | Fixed: `clone_debrief` diverts once to `the_question` when no answer is stored (`:488-490`). The opener there is "Before you go. One question..." New `question_done` (`:335`) returns to the goodbye after the clone, else to the hub. The card is already saved at this point. | `m03_npc_victoria.ink` |
| D3-22 | Fixed: Ffion's three cues cut, including `*gestures at the wall*`. She now has 0. | Ffion |
| D3-23 | Fixed: `hint_confrontation` adds "And if you want to see her stop and think, ask her about the ten thousand." when `revelation_heard`. | phone `:171-174` |

### Line rewrites and scenes

- W-1 to W-15: all applied as proposed, with these changes:
  - W-9: the follow-up choice "[Midnight work sessions?...]" became "[Does she work late?]", because the player no longer hears "midnight" first.
  - W-11: "Ms. Sterling started it." was added so the founder fact survives.
  - W-15: "Smart." kept; "Agreed." cut from "That's the mission." and "Good." from "Right to business."
- Scene #1 (the cloner's light): built in `clone_check_2` (`m03_npc_victoria.ink:437-441`), gated `victoria_suspicious >= 5 and not read_dropped`. Narration only.
- Scenes #2-#4: D3-1, D3-2, D3-4.
- Also changed: `architect_investigation`'s "anonymous advisory" became "goes out unsigned", so the phrase isn't used twice in the debrief (the catalogue line keeps it).

### Checks run

- Compile: 8/8, no warnings.
- Validator (full, with ink): no errors. Only the known, justified warnings remain, unchanged from cycle 1.
- dialoguelint: 2 warnings, both pre-existing and justified (Victoria's "That isn't cruelty. It's arithmetic." and the P4-37 choice length). A crowded-hub check on the first version of the Danny reply knot was cleared by splitting it.
- tagdiff `--old snapshot_c2`, every difference intended:
  - Victoria: knot `question_done`; the_question returns and opener; `clone_debrief` divert; read-back conditions reordered; `sterling_on_call_seen` moved to the close; `target_followup` gains a choice; cloner-light condition.
  - Debrief: four `danny_reply_*` knots with 18 gated choices; the arrested choice split in two.
  - Terry: opener branches; the notebook choice; mismatch influence changes.
  - Ffion, briefing, phone: prose only, plus one phone condition.
  - Danny and the night transition: unchanged.
- reopencheck: total problems 0; m03 phone 0 re-greets.
- loopcheck: 40 runs, 0 failing. They cover every state the review named, plus:
  - D3-21 (`clone_debrief` and `the_question` with the card saved, answer pending or given);
  - the cloner-light state;
  - the night with `read_dropped`, each test answer, suspicion only, low influence, the goodbye stance and the stacked opener, with `sterling_on_call_seen` at the close;
  - Terry with each Ffion story and with `asked_knock_off`;
  - Ffion at a high-influence day and at night.
- inkcheck, debrief: 150 states, 0 failing. Briefing clean.
- Text walks (inkjs driver) of five routes:
  - the review's D3-3 route;
  - the target route ending in the close with the reveal;
  - D3-21, straight to the whiteboard, then the test and the goodbye;
  - Terry on the "sterling" story with a mismatched excuse;
  - the debrief on recruited + protected with the player's reply.
- No browser run.

### Spoken lines changed (old → new)

No audio exists for m03. Player choices are not listed. Pairs come from a line diff, so a new line sometimes sits beside an unrelated cut line. The three night read-back lines show as moved (cut and re-added), not changed.

#### m03_npc_victoria.ink

- Victoria Sterling: Back for more conversation?
  -> Victoria Sterling: {&Forgotten something?|Reconsidering?|Sit, then.}
- Victoria Sterling: To see if you understand the philosophy behind real security research.
  -> Victoria Sterling: To find out what you're worth. Your CV only tells me what you cost.
- Victoria Sterling: *slight pause* We push boundaries, yes. Let me explain our approach.
  -> Victoria Sterling: Unconventional. That's the polite word. Sit down and I'll tell you the other one.
- Victoria Sterling: The traditional security model is broken. Researchers find vulnerabilities, report them to vendors, wait months for patches.
  -> Victoria Sterling: You find a hole and do the decent thing. The vendor sits on it for six months. Somebody less decent finds it in three.
- Victoria Sterling: Meanwhile, those same vulnerabilities get discovered by others. Sold on dark markets. Exploited.
  -> (cut)
- Victoria Sterling: I think you'd be a good fit for our training programme. I'll be in touch.
  -> Victoria Sterling: You'll do. Reception will have the details by Friday.
- Victoria Sterling: We'll review your application. Thank you for your time.
  -> Victoria Sterling: You're harder to read than most. I'll let you know which way it falls.
- Victoria Sterling: I'm not sure you're the right fit for Zero Day's culture. We'll be in touch.
  -> Victoria Sterling: You argue with the person interviewing you. Brave. Not useful.
- (none: new line)
  -> Victoria Sterling: Before you go. One question. I ask everyone, and most people get it wrong.
- Victoria Sterling: Nobody tells you. And if you need to know, you can't afford to.
  -> Victoria Sterling: Then you'd never sell anything. The buyer who explains himself is the one you should worry about.
- Victoria Sterling: Of course, what students learn in the lab is just the beginning.
  -> Victoria Sterling: The lab's the easy part. The money is in knowing who'll pay, and how much.
- Victoria Sterling: The money is in knowing who'll pay, and how much.
  -> (cut)
- Victoria Sterling: Security research is as much economics as it is code.
  -> Victoria Sterling: That's why I don't hire coders. I hire people who can count.
- (none: new line)
  -> Narrator: Her eyes drop to your jacket, where the cloner's light shows through the cloth. Then back to the board.
- Victoria Sterling: Worth every penny. Our students go operational faster than any university programme.
  -> Victoria Sterling: It paid for itself in a quarter. Universities teach them to write it up. I teach them what it's worth.
- Victoria Sterling: Off the record? I think you'd fit in well here. We need more pragmatists.
  -> Victoria Sterling: Off the record, you didn't flinch once. People who don't flinch do well here.
- Victoria Sterling: I have another meeting in a few minutes. But we'll be in touch.
  -> (cut)
- Victoria Sterling: You looked in on me earlier, while I was on the phone. That window shows the whole doorway.
  -> (cut)
- Victoria Sterling: My associates offered to deal with you. I told them I'd do it myself. I wanted to see what you'd bring back.
  -> (cut)
- (none: new line)
  -> Victoria Sterling: You asked what the buyer wanted it for. I should have ended the interview there.
- (none: new line)
  -> Victoria Sterling: You told me you'd take the forty. You said it very quickly. The ones who mean it take longer.
- (none: new line)
  -> Victoria Sterling: Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open.
- (none: new line)
  -> Victoria Sterling: You asked me the questions a prosecutor asks. Recruits ask about the salary.
- Victoria Sterling: You told me you'd take the forty. You said it very quickly. The ones who mean it take longer.
  -> (cut)
- Victoria Sterling: You asked what the buyer wanted it for. I should have ended the interview there.
  -> (cut)
- Victoria Sterling: Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open.
  -> (cut)
- Victoria Sterling: Danny's survey. Two hundred and fourteen sites, and one with the oldest FTP box on the list.
  -> Victoria Sterling: *after a moment* Danny Foster's survey. One of mine.
- (none: new line)
  -> Victoria Sterling: Two hundred and fourteen sites, and one with the oldest FTP box on the list.
- Narrator: It's the first answer tonight she's had to think about.
  -> (cut)
- (none: new line)
  -> Victoria Sterling: I sleep perfectly. That's the part people like you can never forgive.
- (none: new line)
  -> Victoria Sterling: You stood in my doorway earlier. At night that window's a mirror.
- (none: new line)
  -> Victoria Sterling: My associates offered to deal with you. I said I'd do it myself. I still might.

#### m03_npc_ffion_rees.ink

- Ffion Rees: Back again? Forgotten something?
  -> Ffion Rees: {&Back again? Forgotten something?|Hiya again.|You're getting to be a regular.}
- Ffion Rees: *slightly evasive* Advanced penetration testing techniques. For serious researchers.
  -> Ffion Rees: Told you, I just do the pizzas. Advanced something. She picks them herself, mind.
- Ffion Rees: Ms. Sterling is very selective about who gets into the programme.
  -> Ffion Rees: Turned away a lad who'd been on the telly last spring.
- Ffion Rees: Night, then. Don't let the guard scare you.
  -> Ffion Rees: Go on, I'm locking the drawer. Don't let the guard scare you.
- Ffion Rees: Oh, she's brilliant. Speaks at all the big conferences, writes the papers, the lot.
  -> Ffion Rees: Oh, she's brilliant. Does the big conferences, gets quoted in the papers. Bit terrifying, mind.
- Ffion Rees: And she really cares about the work. Sometimes she's here until midnight.
  -> Ffion Rees: Between you and me, I've never seen her lose an argument. Not once.
- Ffion Rees: Between you and me, she can be intense. Very particular about her research.
  -> Ffion Rees: She remembers everyone's birthday, though. Which is more than my last place did.
- Ffion Rees: But she's fair. If you're good at what you do, she'll respect you.
  -> (cut)
- Ffion Rees: WhiteHat Security was founded in 2010 by Victoria Sterling.
  -> Ffion Rees: Since 2010. Ms. Sterling started it.
- Ffion Rees: There's actually a plaque right over there *gestures at the wall* with the founding year and mission statement.
  -> Ffion Rees: Says so on the plaque, there, look. "Security Through Economics."
- Ffion Rees: "Security Through Economics" - that's our motto.
  -> Ffion Rees: Something about paying people properly? Ask her. Actually, don't, you'll be here till six.
- Ffion Rees: *uncertain* Something about market-driven security research? Ms. Sterling explains it better than I can.
  -> (cut)
- Ffion Rees: She has strong opinions about how the security industry should work.
  -> (cut)
- Ffion Rees: Right. Well. Night, then.
  -> Ffion Rees: Right. Well. Suit yourself.

#### m03_npc_terry_mott.ink

- (none: new line)
  -> Terry Mott: Ffion reckons Ms. Sterling's expecting you. She never said nothing to me.
- (none: new line)
  -> Terry Mott: Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?
- Terry Mott: You again. I'm keeping my eye on you.
  -> Terry Mott: {&You again.|Still here, then.|You're making my night very long.}
- Terry Mott: If Ms. Sterling wants you back here, she'll walk you through herself.
  -> Terry Mott: If Ms. Sterling wanted you back here, she'd have told me. She hasn't.
- (none: new line)
  -> Terry Mott: Other end, mate. And it's a long way round to a notebook, through the executive wing.
- (none: new line)
  -> Terry Mott: Funny. Ffion said notebook.
- (none: new line)
  -> Terry Mott: That's not what you told Ffion.
- (none: new line)
  -> Terry Mott: Funny. Ffion said notebook.
- (none: new line)
  -> Terry Mott: Ms. Sterling did mention a recruit... alright.
- (none: new line)
  -> Terry Mott: Ffion said the same. Still nobody told me. Go on, then.
- (none: new line)
  -> Terry Mott: Funny. Ffion said notebook.
- (none: new line)
  -> Terry Mott: That's not what you told Ffion.
- Terry Mott: Alright. But be quick about it. And stay in the executive area. Don't wander.
  -> Terry Mott: Ten minutes. Then I come looking.
- Terry Mott: Right. Yeah. Whatever you need.
  -> Terry Mott: That's a lot of laminate for people nobody's heard of. Go on, then.
- Terry Mott: Yeah, understood. I... I won't say anything.
  -> Terry Mott: Not even her. Right. I'm going to regret this.
- Terry Mott: I'm not getting in the way. Do what you need to do.
  -> Terry Mott: Obstructing. Lovely. Fine. I'm not in your way.
- Terry Mott: I'm keeping an eye on you. Don't make me regret this.
  -> Terry Mott: I've got your face now. Don't make me use it.
- Terry Mott: Alright. Stay out of trouble.
  -> Terry Mott: Mind how you go.
- Terry Mott: Double shift tonight. On till six. Quiet, most nights.
  -> Terry Mott: {asked_knock_off:Told you this afternoon. On till six.|Double shift tonight. On till six.} Quiet, most nights.
- Terry Mott: That's it. I'm calling the police. Don't move.
  -> Terry Mott: Right. That's the police, then. Stay where you are.
- Terry Mott: Security! I have an intruder!
  -> Terry Mott: Oi! Get back here!

#### m03_closing_debrief.ink

- Agent HaX: Netherton signed off at six this morning. He had me write "she priced a hospital" on the cover sheet, so nobody forgets who we're in business with.
  -> Agent HaX: Netherton signed off at six this morning. He had me write "she priced a hospital" on the cover sheet.
- (none: new line)
  -> Agent HaX: Targeting. That's the word the CPS will use.
- Agent HaX: The Phase 2 target list won't go out with our name on it.
  -> Agent HaX: The Phase 2 target list goes out unsigned, from an outfit nobody's heard of.
- Agent HaX: It reaches the operators as an anonymous advisory from an outfit nobody's heard of. They'll act on it -- they always do.
  -> Agent HaX: Substations get hardened. Hospitals get assessed. We'll be standing where they meant to strike.
- Agent HaX: Substations get hardened. Hospitals get emergency assessments. We can't unmake ENTROPY, but we can be standing where they meant to strike.
  -> (cut)
- Agent HaX: Our people collected him at two this morning. He brought a box file and the photo off his desk, and he hasn't stopped talking since.
  -> Agent HaX: He rang us just after midnight. Our people collected him at two.
- (none: new line)
  -> Agent HaX: He brought a box file and the photo off his desk, and he hasn't stopped talking since.
- Agent HaX: He's been arrested. Deceived at the start, complicit by the end, and the second part is a choice a court can name.
  -> Agent HaX: He's been arrested. He took the raise after he knew. A court will care about the date.
- (none: new line)
  -> Agent HaX: Do it before Counter-intelligence does. They'll make it sound like a favour.
- (none: new line)
  -> Agent HaX: A week, then. After that he hears it from someone who doesn't care how it lands.
- (none: new line)
  -> Agent HaX: That's the version I'd use. He won't thank you for it.
- (none: new line)
  -> Agent HaX: I did. He asked again an hour later.
- (none: new line)
  -> Agent HaX: He'll see her in court. That's the one meeting I can't cancel.
- (none: new line)
  -> Agent HaX: You're the second person to say that this morning. He was the first.
- (none: new line)
  -> Agent HaX: He won't. I wouldn't.
- (none: new line)
  -> Agent HaX: He did. Don't tell him I said so.
- (none: new line)
  -> Agent HaX: He tried that for months. You saw where it put him.
- (none: new line)
  -> Agent HaX: Careful. That's her word.
- (none: new line)
  -> Agent HaX: He's already started. They've sent out for more tape.
- (none: new line)
  -> Agent HaX: Put it in writing. It counts for more than you'd think.
- (none: new line)
  -> Agent HaX: He agrees with you. He said as much to the arresting officer.
- (none: new line)
  -> Agent HaX: I'll put it in the file. Whether anyone reads that page is another matter.
- (none: new line)
  -> Agent HaX: Then I hope he's quicker about it than Zero Day.
- (none: new line)
  -> Agent HaX: Maybe. He'd have hated you for it, and he'd be safe.
- (none: new line)
  -> Agent HaX: It's one way. Write down why, before you forget.
- (none: new line)
  -> Agent HaX: Then say so in the report. It reads better than a reason.

#### m03_opening_briefing.ink

- Agent HaX: Right to business. Good.
  -> Agent HaX: Right to business.
- Agent HaX: Agreed. That's the mission.
  -> Agent HaX: That's the mission.
- Agent HaX: Your call. I trust your read.
  -> Agent HaX: Your call.
- Agent HaX: Good answer. Evidence first.
  -> Agent HaX: Then get the facts. He'll still be there.

#### m03_phone_agent0x99.ink

- (none: new line)
  -> HaX (phone text): And if you want to see her stop and think, ask her about the ten thousand.

## Lighting cycle 1 (2026-10-12)

Skill `mission-room-lighting`; plan `LIGHTING_PLAN.md`; screenshots `build_evidence/lighting_c1/` (day game 2121, night game 2122, Danny re-shot 2123). Config only; no ink, tags, NPC or layout fields touched; no spoken lines changed.

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 2 | 1 | 1 |
| Minor | 4 | 4 | 0 |

- **M1 (deferred, needs approval):** the engine can't change a room's mode or brightness when night falls (`lighting.js:297-353` reads the room block once). Proposal E1, room `variants` with a condition, in `LIGHTING_PLAN.md` §7 and `DECISIONS_PENDING.md` L1. Cycle 1 ships one state per room: day for reception, the executive wing and the conference room; night for the server room and Danny's office; the main hallway on motion. Glows already switch: Danny's lamp is on only at night.
- **M2 (fixed by workaround; engine bug filed):** a `floorTint` stamp as the last draw of a frame blanks the light map (reception mean 156 with it, 26-28 without, same ambient; game 2120). The counter's `floorTint` removed. Engine fix proposal E2 (`DECISIONS_PENDING.md` L2); it may affect m01/m02/sis01/sis02 rooms that use `floorTint`.
- m1 marketplace board lost beside the racks: intensity 0.7 → 1.0, radius 56.
- m2 call points pulsed red in the conference room and reception at night: off in every m03 room (no lamp in the art; a lone red pulse reads as a clue).
- m3 Danny's lamp pool smeared up the west wall: radius 72 → 64, offsetX 4 → 10, intensity 0.7, warmer.
- m4 CEO desk lamp too white beside her PC: `#ffd9a0` → `#ffc880`.
- Tooling: the stock lighting tour shows only m03's opening briefing (the brief, then the tutorial prompt, pause the scene and the light map stops drawing). Scratch tour `build_evidence/lighting_c1/tour.py` closes both, checks the map is drawing, and has a night mode (night globals, rooms re-registered from `night_cfg.json` to preview E1, Danny shown). Worth folding into `tools/playtest/lighting-tour.sh` (tooling, not done).
- Decisions taken without asking: night keyed on `clone_call_done` (not `mission_phase`, which flips in the afternoon); Danny's office `dark` (story: "sitting in the dark"; nothing there needs map reading), at the cost of a dark office by day until E1; CEO's office `motion` both halves (four things to search), its lamp and cabinets carrying the view through the door; no flicker and no brownout (nothing in the story; the guard beat owns the corridors).

## Dialogue cycle 3 fixes (2026-10-12)

Review acted on: `DIALOGUE_REVIEW_P2_C3.md` (revise: 1 blocker, 3 majors, 18 minors, 10 rewrites W3-1..W3-10, 2 noted lines, 3 flat scenes, all local). Fixer: the same Opus agent, resumed. Ink snapshot: scratchpad `m03-dialogue/snapshot_c3/`. Line numbers are in the new files. No change to `scenario.json.erb` this cycle (the lighting agent is editing it). Evidence this cycle is the route driver, `scripts/ink_runtime_check/m03_routes/route.js`, which re-enters a conversation at the knot that owns its saved choices, as the engine does.

| Severity | Found | Fixed | Withdrawn | Deferred |
|---|---|---|---|---|
| Blocker | 1 | 1 | 0 | 0 |
| Major | 3 | 3 | 0 | 0 |
| Minor | 18 | 18 | 0 | 0 |
| Line rewrites | 10 + 2 noted | 12 | 0 | 0 |
| Flat scenes | 3 | 3 | 0 | 0 |

### Blocker and the "scene behind start" sweep

- **D4-1, fixed.** At the top of Ffion's `hub` (`m03_npc_ffion_rees.ink`): `{ mission_phase == "act2_infiltration" and not night_greeted: -> closing_up }`. The new route r9 (day talk, then night without a reload) now plays "Oh! You made me jump..." and the notebook answer, then "Found it. Charger was in the biscuit tin" on the next reopen. Terry opens "Ffion said there'd be someone about." Before this, the night scene played only after a page reload.
- **Sweep of every m03 NPC for the same pattern** (a reopen lands on the saved-choice knot, so a scene reachable only through `start` can be skipped):
  - **Ffion:** besides `hub`, her seven day knots with choices (`badge_process`, `company_overview`, `first_impression_choice`, `ask_victoria`, `ask_danny`, `ask_company_history`, `ask_building_layout`) now hand over to `start` at night. A chat closed mid-topic by day can't replay day content at eleven.
  - **Victoria:** ten day knots with choices (`hub`, `first_impression`, `philosophy_intro`, `zero_day_philosophy`, `ethics_discussion`, `the_question`, `clone_rfid_distraction`, `clone_check_1`, `clone_check_2`, `clone_debrief`) hand over to `start` once `clone_call_done`. That fixes D4-12; r8 now plays her night call, not "Before you go". Her `idle` already routes every night state.
  - **Terry:** `daytime` hands over to `start` at night. `guard_idle` sends the first night meeting straight to his challenge (D4-8). The check sits inside the quiet-flag else, so it runs on a reopen and never on an exit.
  - **Danny:** no change needed. His scene exists only at night, so no reopen crosses a phase.
  - **Phone:** no change needed. It ends on DONE and restarts at `start` on every open; reopencheck covers it.
  - **Briefing, debrief:** no change needed. One-shot, `disableClose`.

### Majors

- **D4-2, fixed, option (a).** Night read-back (`m03_npc_victoria.ink`, nighttime_confrontation), in this order:
  1. `read_dropped`.
  2. Heavy suspicion (`>= 20`, the prosecutor line).
  3. Low influence (the rude line, which keeps "Brave. Not useful." paid off).
  4. The test answer.
  5. Else, the default line, which plays only after a reload or a chat closed before the test.
  - The goodbye stance adds a second line only for "keen" with "sold".
  - Deleted the "undecided" and "thanked" night lines and their writes.
  - Decision: the rude line stays live, above the test, rather than being deleted. It is true wherever it plays and keeps a cycle-1 consequence.
  - Routes now show four different read-backs (r1 sold + keen, r2 inventory, r3 hedged, r6 asked).
- **D4-3, fixed.** Terry reads `day_greeted`:
  - opener: "You. The three o'clock. Building's shut, and you're a long way from the conference room.";
  - work excuse: "You don't work here. You were in reception at three with a visitor badge.";
  - suspicious path: "No badge, a visitor this afternoon, and back at eleven. Pull the other one.";
  - files excuse: "Ms. Sterling told me nothing about it. She told me nothing this afternoon either.", at +5 rather than +10.
  - Shown on r9b.
- **D4-4, fixed.** Debrief:
  - `what_made_it_possible` became `security_recap`, asked for from a new `aftermath_choices` ("[What should they have locked down?]"), which returns to the remaining choices.
  - The catalogue is folded to one line per branch.
  - The rest lines are cut (D4-6), and "Let's go through it." and "Now it's in their own books." are gone.
  - These pairs are folded into single lines: the two recruited-branch lines, the Phase 2 header with its drive line, the two target-list lines, the first two Danny lines, the two paper-trail lines, the two aftermath lines, the guard-call pair and the bribe pair.
  - Longest debrief run: see the table below.

### Minors

| # | Outcome |
|---|---|
| D4-5 | "...riding on a woman who invoices by the body." |
| D4-6 | "It's done. We'll need you soon."; "We see where ENTROPY surfaces..."; "Go home and get some sleep." kept as the only rest line. |
| D4-7 | Diplomatic line now "You didn't push. He noticed." |
| D4-8 | `guard_idle` routes the first night meeting to `start` (one torch, no extra click). |
| D4-9 | Notebook story + files excuse: "Notebook, files. Make your mind up. Five minutes, and I'm stood at the end of the corridor." Goes to the hub instead of accepting the excuse. |
| D4-10 | "Then you've taken the scenic route. Through the executive wing." |
| D4-11 | `the_question` opens "Now one of mine..." after the ethics topic. |
| D4-12 | Fixed by the sweep (night hand-over on `the_question`, `clone_debrief` and the other day knots). |
| D4-13 | "Her eyes drop to your pocket..." |
| D4-14 | Local `came_via_hospital`; the_reckoning skips the "professional who logs the sale" line on that route. |
| D4-15 | "One more thing. You stood in my doorway earlier..." |
| D4-16 | Catch then KO: "The guard caught you once, and then you put him on the floor. The log's mostly about that now." (worded to avoid a not-x-but-y). |
| D4-17 | Bribe: "...because you'd paid your way past him. Five hundred pounds of ours. Finance will want a receipt." The separate receipt line now plays only with a detection or a KO, so it isn't said twice. |
| D4-18 | Skip route: the cover name is folded into the short-version line and the two background lines are skipped. `{skipped_background:Three things.\|Three things, then.}` |
| D4-19 | "[I'll give evidence for him. She lied to him first.]" |
| D4-20 | "Counter-intelligence is running her now." (folded, see D4-4). |
| D4-21 | Ffion's code comment corrected. |
| D4-22 | Phone: "Danny's made his call."; "They chose the hospital for Ghost." |

Also: the exposed-branch line "He took the raise after he knew" repeated "the raise" from the line before it on r10, so it became "He'd worked out what it was for before he took it." The target-list line says "goes out unsigned", so "anonymous advisory" isn't used twice.

### Rewrites and scenes

- All applied as proposed: W3-1 to W3-10. W3-9 is folded with the aftermath lines.
- Noted lines: Ffion "First time at a place like this, is it?"; Victoria's whiteboard sarcasm only at `victoria_suspicious >= 5`, otherwise "The training lab. Have a look."
- Scene #1 (the reckoning without the ledger): new ungated choice "[You could have walked away from that sale.]" → "I did walk away. With twenty-five thousand."
- Scenes #2 and #3: D4-1 and D4-3.
- Terry's hub greeting is cold while `guard_suspicious` ("Well?" / "Go on." / "I'm listening.").

### Routes

- New, kept in `scripts/ink_runtime_check/m03_routes/`:
  - `r9_ffion_day_night.json`: Ffion and Terry by day, then both at night without a reload.
  - `r9b_ffion_sterling.json`: the "sterling" story with the files excuse, and Terry's recognition lines.
  - `r10_guard_ko_bribe.json`: the bribe route and the catch-then-KO route, each into the debrief.
- Old routes updated to the new flow: r1, r5, r6, r7. "[Talk to the guard]" picks were removed (D4-8 skips that click), Ffion's night picks now answer her question, and r5's "run the whole cell" pick, which never matched, was corrected.
- Remaining stops are where the review's probes end: r2, r4, r8, the r6 grace-line probe and the r7 already-warned probe.

| Route | Longest run without a choice, before → after | Lines / choices after |
|---|---|---|
| r1 smooth | 13 (debrief) → 9 | 244 / 65 |
| r2 suspicious | 13 → 9 | 193 / 49 |
| r3 skip | 12 → 9 | 149 / 32 |
| r4 KO | 12 → 9 | 127 / 29 |
| r5 recruit + expose | 13 → 8 (briefing; debrief 8) | 188 / 47 |
| r6 escape | 12 → 9 | 217 / 67 |
| r7 notebook | 3 → 3 | 17 / 6 |
| r8 closed at the question | 6 → 5 | 28 / 6 |
| r9 Ffion day/night (new) | 6 | 36 / 12 |
| r9b Ffion "sterling" (new) | 3 | 26 / 10 |
| r10 guard KO / bribe (new) | 9 | 77 / 16 |

### Checks run

- Compile: 8/8, no warnings.
- Validator with ink, `--no-graph` (the lighting agent is editing the erb, so the shared dungeon graph wasn't rewritten): no errors, same known warnings.
- dialoguelint: the 2 justified warnings only. One new not-x-but-y (D4-16's first wording) was reworded.
- tagdiff `--old snapshot_c3`, all intended:
  - Victoria: hand-overs to `start` in 10 knots; the read-back conditions; `came_via_hospital`; the new reckoning choice; the D4-11 and whiteboard conditions; the removed goodbye writes.
  - Debrief: `security_recap` and `aftermath_choices`; 20 diverts retargeted from `what_made_it_possible` to `final_assessment`; the guard-line conditions; the catalogue and aftermath branches folded.
  - Terry: opener branches, recognition conditions, the D4-9 hub divert, the idle and daytime hand-overs.
  - Ffion: the D4-1 hub divert and 7 hand-overs.
  - Briefing: the skip-route block moved above the background lines.
  - Phone, Danny, night transition: structure unchanged.
- reopencheck: 0 problems.
- loopcheck: 71 runs, 0 failing. These include every Victoria and Ffion day knot entered at night, Terry's `guard_idle` and `daytime` at night with each Ffion story, the night read-back states, and `came_via_hospital`.
- inkcheck, debrief: 125 states (5 Victoria fates × 5 Danny fates × 5 extras covering the KO, bribe, catch+KO, SAFETYNET and target-named states), 0 failing. Briefing clean, normal and skip.
- Route driver: 11 routes, as above.
- No browser run.

### Spoken lines changed (old → new)

No audio exists for m03. Player choices aren't listed. Pairs come from a line diff; the night read-back lines show as moved, not changed, and folded debrief lines show beside the lines they replaced.

#### m03_npc_victoria.ink

- Victoria Sterling: You must be the candidate. Welcome to WhiteHat Security.
  -> Victoria Sterling: Victoria Sterling. Sit down. Let's see if you match your file.
- Victoria Sterling: I'm Victoria Sterling, CEO. Have a seat.
  -> (cut)
- Victoria Sterling: Go ahead. I've heard every argument.
  -> Victoria Sterling: Go on. Everyone brings a speech about it.
- Victoria Sterling: Interesting question. Where would you draw it?
  -> Victoria Sterling: You tell me. Where would you draw it?
- (none: new line)
  -> Victoria Sterling: Now one of mine. I ask everyone, and most people get it wrong.
- (none: new line)
  -> Victoria Sterling: The training lab. Have a look.
- Narrator: Her eyes drop to your jacket, where the cloner's light shows through the cloth. Then back to the board.
  -> Narrator: Her eyes drop to your pocket, where the cloner's light shows through the cloth. Then back to the board.
- (none: new line)
  -> Victoria Sterling: You asked me the questions a prosecutor asks. Recruits ask about the salary.
- (none: new line)
  -> Victoria Sterling: You were rude this afternoon. I put it down to nerves. Nerves don't come back at eleven at night.
- (none: new line)
  -> Victoria Sterling: And you told me this was exactly the work you'd been looking for. I believed you. That's the part I mind.
- Victoria Sterling: You asked me the questions a prosecutor asks. Recruits ask about the salary.
  -> (cut)
- Victoria Sterling: You were rude this afternoon. I put it down to nerves. Nerves don't come back at eleven at night.
  -> (cut)
- Victoria Sterling: You told me this was exactly the work you'd been looking for. I believed you. That's the part I mind.
  -> (cut)
- Victoria Sterling: You said you'd think it over. I suppose you did.
  -> (cut)
- Victoria Sterling: You thanked me for being straight with you. I was. Pity it only went one way.
  -> (cut)
- Victoria Sterling: Then you've read more than most of my staff. You really have been thorough.
  -> Victoria Sterling: Then you've read more than my accountant. He'll be disappointed.
- (none: new line)
  -> Victoria Sterling: I did walk away. With twenty-five thousand.
- Victoria Sterling: You stood in my doorway earlier. At night that window's a mirror.
  -> Victoria Sterling: One more thing. You stood in my doorway earlier. At night that window's a mirror.

#### m03_npc_ffion_rees.ink

- Ffion Rees: Is this your first time working with a Cyber Security firm?
  -> Ffion Rees: First time at a place like this, is it?

#### m03_npc_terry_mott.ink

- Terry Mott: Hey! What are you doing here? Building's closed for the night.
  -> Terry Mott: You. The three o'clock. Building's shut, and you're a long way from the conference room.
- (none: new line)
  -> Terry Mott: Building's shut, mate. So you're either lost or you're trouble.
- Terry Mott: Other end, mate. And it's a long way round to a notebook, through the executive wing.
  -> Terry Mott: Then you've taken the scenic route. Through the executive wing.
- Terry Mott: Ms. Sterling did mention a recruit... alright.
  -> Terry Mott: Notebook, files. Make your mind up. Five minutes, and I'm stood at the end of the corridor.
- (none: new line)
  -> Terry Mott: Ms. Sterling told me nothing about it. She told me nothing this afternoon either.
- (none: new line)
  -> Terry Mott: You don't work here. You were in reception at three with a visitor badge.
- Terry Mott: Just surprised to see someone here this late.
  -> Terry Mott: Didn't have you down as a night person.
- Terry Mott: Ms. Sterling does sometimes have late requests.
  -> Terry Mott: She does ring down at odd hours. Which files?
- Terry Mott: What files are you supposed to grab?
  -> (cut)
- (none: new line)
  -> Terry Mott: No badge, a visitor this afternoon, and back at eleven. Pull the other one.
- (none: new line)
  -> Terry Mott: {&Well?|Go on.|I'm listening.}

#### m03_closing_debrief.ink

- Agent HaX: There you are. Sit down before you fall down. You've earned it.
  -> Agent HaX: There you are. Sit down before you fall down.
- (none: new line)
  -> Agent HaX: The guard never logged you, because you'd paid your way past him. Five hundred pounds of ours. Finance will want a receipt.
- (none: new line)
  -> Agent HaX: The guard caught you once, and then you put him on the floor. The log's mostly about that now.
- Agent HaX: You told Sterling's own guard who you work for. He rang her.
  -> Agent HaX: You told Sterling's own guard who you work for. He rang her.{victoria_fate != "ko": That's one reason she had her coat on when you walked in.}
- Agent HaX: That's one reason she had her coat on when you walked in.
  -> (cut)
- Agent HaX: Let's go through it.
  -> (cut)
- Agent HaX: Now it's in their own books.
  -> (cut)
- Agent HaX: If she delivers. If she isn't burned. If the Architect doesn't smell it. A lot of ifs riding on someone who priced a hospital.
  -> Agent HaX: If she delivers. If she isn't burned. If the Architect doesn't smell it. A lot of ifs riding on a woman who invoices by the body.
- Agent HaX: Counter-intelligence has her. First package is already in -- comms protocols for the Architect, the payment rails, contacts at the other cells.
  -> Agent HaX: Counter-intelligence is running her now. She stays at Zero Day, and the first package is already in: the Architect's comms protocols, the payment rails, contacts at the other cells.
- Agent HaX: She stays at Zero Day so nothing looks wrong, and she reports to us. For the first time we have eyes inside ENTROPY's supply line.
  -> (cut)
- Agent HaX: Now the part that kept me up. Phase 2.
  -> Agent HaX: Now Phase 2, the part that kept me up. You brought out the drive and read both layers yourself. The Architect's directive.
- Agent HaX: You brought out the drive from her desk, and you read what was under both layers yourself. The Architect's directive.
  -> Agent HaX: Now Phase 2, the part that kept me up. Your drive was Base64 over ROT13; our people had it off in ten minutes. The Architect's directive.
- Agent HaX: You brought out the drive from her desk. Base64 over ROT13; our people had both layers off in ten minutes. Underneath, the Architect's directive.
  -> Agent HaX: Now Phase 2, the part that kept me up. The search team found a drive in Sterling's desk this morning. Base64 over ROT13. The Architect's directive.
- Agent HaX: The search team went through Sterling's desk this morning and found a drive. Our people had it read in ten minutes. Base64 over ROT13. The Architect's directive.
  -> (cut)
- Agent HaX: The Phase 2 target list goes out unsigned, from an outfit nobody's heard of.
  -> Agent HaX: The Phase 2 target list goes out unsigned. Substations get hardened, hospitals get assessed, and we'll be standing where they meant to strike.
- Agent HaX: Substations get hardened. Hospitals get assessed. We'll be standing where they meant to strike.
  -> Agent HaX: Danny Foster took the way in you gave him. He rang us just after midnight, and our people collected him at two.
- Agent HaX: Danny Foster. You gave him the way in and he took it.
  -> (cut)
- Agent HaX: He rang us just after midnight. Our people collected him at two.
  -> (cut)
- Agent HaX: You gave him room to come in by himself. That's why he did.
  -> Agent HaX: You didn't push. He noticed.
- Agent HaX: He's been arrested. He took the raise after he knew. A court will care about the date.
  -> Agent HaX: He's been arrested. He'd worked out what it was for before he took it. A court will care about the date.
- Agent HaX: For the report, here's what let you in.
  -> Agent HaX: Their badges. MIFARE Classic, read from arm's length. A card anyone can read from a step away is a key you've handed out.
- Agent HaX: Their badges run on MIFARE Classic, and you copied them from arm's length. A card anyone can read from a step away is a key you've handed out.
  -> Agent HaX: The CEO's password was the house reset default, printed on a slip on her own monitor.
- Agent HaX: The CEO's password was the house reset default, printed on a slip on her own monitor. Nobody made her change it.
  -> Agent HaX: And their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful.
- Agent HaX: Their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful to them.
  -> Agent HaX: And you brought the whole paper trail out -- the history, the catalogue, the directive. Their case and their plan, in their own words.
- Agent HaX: And you brought the whole paper trail out -- the history, the catalogue, the directive.
  -> (cut)
- Agent HaX: We've got their case and their plan now, in their own words.
  -> (cut)
- Agent HaX: What you brought out is enough to prosecute and enough to warn people. More would have helped. It usually does.
  -> Agent HaX: Enough to charge and enough to warn. Not everything. It never is.
- Agent HaX: The catalogue goes out as an anonymous advisory. Every product on it, flagged to the people who run it.
  -> Agent HaX: The catalogue goes out as an anonymous advisory, and every buyer on it learns we've read it.
- Agent HaX: A price list patches nothing, but it tells them where to look.
  -> Agent HaX: The catalogue trickles out as routine advisories, so nothing points back at her.
- Agent HaX: The catalogue gets folded into routine advisories over the next few months, a product at a time, so nothing points back at her.
  -> (cut)
- Agent HaX: A price list patches nothing, but it tells the people who run those systems where to look.
  -> (cut)
- Agent HaX: And word will reach their buyers that the list is in our hands. Every sale off that shelf just got riskier.
  -> (cut)
- Agent HaX: It's done. Get some rest. We'll need you soon.
  -> Agent HaX: It's done. We'll need you soon.
- Agent HaX: Here's where it stands. Zero Day's exploit line is exposed.
  -> Agent HaX: Here's where it stands. Zero Day's exposed, its buyers are scrambling, and the Architect has to shop elsewhere.
- Agent HaX: Here's where it stands. Zero Day doesn't know it's been read.
  -> Agent HaX: Here's where it stands. Zero Day doesn't know it's been read, and nor do its buyers or the Architect.
- Agent HaX: The cells that bought from them are scrambling. The Architect will have to shop elsewhere.
  -> Agent HaX: Ghost's still out there. The people who armed them are on paper now.
- Agent HaX: The cells that buy from Zero Day still think it's safe. So does the Architect.
  -> Agent HaX: We see where ENTROPY surfaces. Take one cell down and it shows you the next.
- Agent HaX: Ghost's still out there. But last night you put the people who armed them on paper. That's ENTROPY's supply chain.
  -> (cut)
- Agent HaX: Rest first. Then we see where ENTROPY surfaces. Take one cell down and it shows you the next.
  -> (cut)

#### m03_opening_briefing.ink

- (none: new line)
  -> Agent HaX: Short version: the exploit that took down St. Catherine's came from Zero Day, behind a pentest front called WhiteHat. We want their books.
- (none: new line)
  -> Agent HaX: The client roster and the operational logs. Proof of who they arm, and how.
- Agent HaX: Short version: the exploit that took down St. Catherine's came from this shop. We want their books.
  -> (cut)
- Agent HaX: The client roster and the operational logs. Proof of who they arm, and how.
  -> (cut)
- Agent HaX: Three things, then. One: get inside and clone Victoria Sterling's executive keycard. She's the front's CEO, and she runs this end of the cell for 0day.
  -> Agent HaX: {skipped_background:Three things.|Three things, then.} One: get inside and clone Victoria Sterling's executive keycard. She's the front's CEO, and she runs this end of the cell for 0day.

#### m03_phone_agent0x99.ink

- HaX (phone text): Network's stripped, the case is made, and Danny's dealt with. Sterling's your last move.
  -> HaX (phone text): Network's stripped, the case is made, and Danny's made his call. Sterling's your last move.
- HaX (phone text): And a line under it: "Target Selection Consultation", ten thousand. They chose the ward for Ghost.
  -> HaX (phone text): And a line under it: "Target Selection Consultation", ten thousand. They chose the hospital for Ghost.

## Lighting cycle 2 (2026-10-12)

Engine work at the coordinator's instruction, in four change sets (patches in `build_evidence/lighting_c2/patches/`, they apply in order from HEAD): L2 white-map fix, L1 room `variants`, L3 NPC torch, tour flags. Then m03's night blocks moved into variants. Plan §10; screenshots `build_evidence/lighting_c2/`.

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 2 | 1 | 1 |
| Minor | 3 | 3 | 0 |

- **M1 (fixed):** reception, the main hallway and the executive wing stayed in their day state at night, and Danny's office was dark by day. Now variants on `clone_call_done`; Danny's office on by day, dark at night.
- **M2 (deferred, needs a tester):** a page reload at night staying night isn't proven in a browser. My reload run was blocked by the permission classifier (it syncs game state to the :3001 server). Node tests cover the resolution; the engine resolves at load from saved globals.
- m1 the night reception at the cycle-1 probe level (`#808aa0`) still read as lit: `#545c70`, counter pool 0.3.
- m2 the night hallway was a touch bright: `#3a4258` → `#323a50`.
- m3 the night lobby's only accent was a pool with no source: a warm cove wash on the slat wall (a concealed strip, so no fixture needed from dressing).
- Terry carries a torch at night (`behavior.torch`, night only); a guard on the floor drops it (KO check).
- Checks: node suite 481 tests, 475 pass; the 6 failures are pre-existing or not lighting (credits-theme, scada-historian-data, a state-sync wiring test; engine-fixes-pass3 passes alone; two npc-ink-variables tests read m03's Victoria ink, which the dialogue fixer is editing). Validator schema passes for m03, m01, m02, sis01, sis02, Tesseract. Rails suite not run (nothing server-side changed).
- Not recorded by me: the approval status of L1–L3 in `DECISIONS_PENDING.md` (the coordinator records user decisions).

## Dialogue cycle 4 fixes (2026-10-12)

Review acted on: `DIALOGUE_REVIEW_P2_C4.md` (revise, light: 0 blockers, 2 majors, 19 minors, 10 rewrites W4-1..W4-10, 2 noted lines, 3 flat scenes). This is the last full fix cycle; a light confirmation read follows. Fixer: the same Opus agent, resumed. Ink snapshot: scratchpad `m03-dialogue/snapshot_c4/`. The erb was not touched (lighting and sprite agents are editing it).

| Severity | Found | Fixed | Withdrawn | Deferred |
|---|---|---|---|---|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 2 | 2 | 0 | 0 |
| Minor | 19 | 19 | 0 | 0 |
| Line rewrites | 10 + 2 noted | 12 | 0 | 0 |
| Flat scenes | 3 | 3 | 0 | 0 |
| Part 3 optional callbacks | 2 | 0 | 0 | 2 (need new scenario globals) |

### Terry's night corridor, rewritten as one scene (D5-1 to D5-5, D5-11, D5-12, D5-17, D5-18, W4-1 to W4-4)

- **Opener order** (`m03_npc_terry_mott.ink`, start):
  1. Caught picking already (D5-3): "You. The one with the picks. Let's hear it, then."
  2. Ffion's story, with the afternoon face folded into each line as an inline choice between fixed strings (D5-2):
     - "Notebook, was it? Should've known it'd be you.";
     - "The three o'clock, back again.";
     - "Didn't say it was the three o'clock." in place of "That you?".
  3. The face alone.
  4. A stranger.
- **His question.** "Go on, then. Why are you here?" (W4-1). It isn't asked when the picks opener has already asked, and on the default route there is now only one "Well?".
- **New choices-only `excuse_menu`.** It re-asks "Still waiting." on a reopen or reload before the player has answered. A new local `excuse_given` means a reload at his question no longer skips to "You again." (D5-11).
- **The card (D5-1).** If he met the player by day: "A visitor badge at three and her card at eleven. / Either she's taken a shine to you or I'm in trouble. Ten minutes." (+5, still suspicious). Otherwise: "That's one of the exec cards. ...Right. Carry on." (W4-3, +15, no longer suspicious).
- **D5-4.** All six excuse exits into his hub set `hub_quiet`, so no greeting follows a dismissal. An excuse that landed clears `guard_suspicious`: enrolment forms when he didn't place the face, or the sterling story. So "Mind how you go." now plays (r9b), and the cold greeting is no longer universal. Its variants are "Well?" / "I'm listening." / "Something else?".
- **Small fixes:**
  - D5-5: "Maintenance? At eleven at night?"
  - W4-2: "No work order, and you're not our usual lot. / Who's your supervisor, then?"
  - W4-4: "New starters don't get nights. Not here."
  - D5-17: "Go on, then." cut on the sterling-story files line.
  - D5-18: "[Wrong turn. I'll find it.]" now ends the chat with "Back the way you came."
- **D5-12.** The detection is counted in a new choice-free knot, `hostile_count`, before `hostile_confrontation`, so a reopen there doesn't count twice.
- **Idle.** `guard_idle`'s night hand-over also covers "warned but not answered" and skips a bribed guard.

### Route fixes and the rest

| # | Outcome |
|---|---|
| D5-6 | Victoria's `idle` plays the first night look-in at once (inside the quiet-flag else, so on a reopen only). "Sterling hasn't left." |
| D5-7 | Phone status by Danny outcome: out cold (fate ko or `danny_ko`, new synced VAR) / on his way in / on the record / his choice is his now. |
| D5-8 | "Careful. You're starting to sound like her." |
| D5-9 | The 214 choice is gated on `transaction_log_read or roster_seen` (VAR `transaction_log_read` added to the debrief; global already declared). |
| D5-10 | Ffion: `closing_up` re-asks when `night_greeted` but no answer; `night_answer` prints "Well? Is she expecting you?" on any reopen or reload (quiet flag on the first pass). The hub check also covers `ffion_night_story == ""`. Comment corrected. r12 shows it surviving a reload. |
| D5-11, D5-12 | See Terry. |
| D5-13 | New `danny_reply_none`: "[Find him before they do.]" / "[He wasn't my job.]". r14's longest run is 10 → 8. |
| D5-14 | Recap line starts "Their" when it is the whole answer. |
| D5-15 | "Every buyer downstream just lost their supplier. They'll pay more for worse." |
| D5-16 | "We'll need you soon" cut from all five `final_assessment` lines; the closing line carries "what's next". |
| D5-19 | Ffion: "Let me get you checked in." cut; the directions print once (not again on the return from `company_overview`, which now gets "Anyway. Sign in when you're ready."); "Sign in for me, and I'll print you a badge." |
| D5-20 | Skip route: "The client roster, the logs, and whatever they're planning next. There's a Phase 2." |
| D5-21 | Routes r2, r7 and r8 repaired. r2 does the cooperation questions as a second visit. r7's mismatch variant resets `player_warned`/`excuse_given`. r8 now ends on the night call, marked as a probe end. Also updated after the Terry rewrite: r9, r12, r14, r16. |
| W4-5 to W4-10 | All applied: Ffion "Keep it on show, or the guard has kittens."; Victoria "Competent is cheap."; "Some of what they bought from me is already installed."; "The sensible answer."; HaX "Until last night the Architect was a rumour. Now it's a signature on a plan."; "Conspiracy, computer misuse, and they want St. Catherine's on the charge sheet." |
| Noted lines | debrief "...will remember last night." (no tail); Ffion's sign-in line. |

**Deferred: the two Part 3 callbacks** (the debrief remembering a St. Catherine's opener, and "Danny drew that survey"). Each needs a new scenario global (`came_via_hospital` is local to Victoria's ink), and the erb is off-limits this cycle. One line each when the erb is free.

### Route stats (longest run without a choice; lines/choices; stops)

Remaining stops are deliberate "close the chat here" probe steps (r2, r4, r6, r8, r11, r12, r15).

| Route | Longest run, before → after | Lines, choices | Stops |
|---|---|---|---|
| r1_smooth | 9 → 9 | 244/65 → 243/65 | 0 → 0 |
| r2_suspicious | 9 → 9 | 193/49 → 200/53 | 2 → 1 |
| r3_skip | 9 → 9 | 149/32 → 149/32 | 0 → 0 |
| r4_ko | 9 → 9 | 127/29 → 126/29 | 2 → 2 |
| r5_recruit_expose | 8 → 8 | 188/47 → 186/47 | 0 → 0 |
| r6_escape | 9 → 9 | 217/67 → 217/67 | 1 → 1 |
| r7_notebook | 3 → 4 | 17/6 → 22/6 | 1 → 0 |
| r8_closed | 5 → 5 | 28/6 → 30/7 | 2 → 1 |
| r9_ffion_day_night | 6 → 5 | 36/12 → 38/13 | 0 → 0 |
| r9b_ffion_sterling | 3 → 3 | 26/10 → 25/10 | 0 → 0 |
| r10_guard_ko_bribe | 9 → 9 | 77/16 → 77/16 | 0 → 0 |
| r11_rude | 8 → 8 | 175/41 → 174/41 | 4 → 4 |
| r11b_rude_lowinfluence | 5 → 5 | 59/15 → 59/15 | 0 → 0 |
| r12_reload_everywhere | 9 → 9 | 133/26 → 137/28 | 8 → 8 |
| r13_sold_then_protect | 9 → 9 | 119/28 → 118/28 | 0 → 0 |
| r14_no_danny_no_drive | 10 → 8 | 101/27 → 102/28 | 0 → 0 |
| r15_ko_heavy | 9 → 9 | 83/18 → 83/18 | 2 → 2 |
| r16_terry_probes | 3 → 3 | 24/7 → 27/9 | 1 → 0 |

Proof the reviewer asked for:
- r16 (a) shows recognition, then the D5-1 card line.
- r16 (b) opens "You. The one with the picks."
- r16 (c) opens "Should've known it'd be you."
- No greeting follows a dismissal on r1, r9b or r16.
- r14 has the no-Danny reply.
- r12 shows Ffion's question ("Well? Is she expecting you?") and Terry's ("Still waiting.") surviving reloads.

### Checks run

- Compile: 8/8, no warnings.
- Validator with ink, `--no-graph`: no errors, known warnings only.
- dialoguelint: the 2 justified warnings only.
- tagdiff `--old snapshot_c4`, all intended:
  - Terry: 132 differences, mostly his excuse choices moving from `first_excuse` into the new `excuse_menu`, plus `excuse_given`/`excuse_menu_quiet`, `hostile_count`, the opener branches and the `hub_quiet`/`guard_suspicious` writes on the exits.
  - Victoria: the idle hand-over.
  - Debrief: `danny_reply_none`, the D5-9 gate, the recap condition, VAR `transaction_log_read`.
  - Ffion: `night_answer_quiet`, the re-ask, the badge-knot branch.
  - Phone: the Danny-outcome branches and VAR `danny_ko`.
  - Briefing, Danny, night transition: structure unchanged.
- reopencheck: 0 problems.
- loopcheck: 38 runs, 0 failing:
  - Terry: each Ffion story × day-met, picks first, warned/unanswered, `excuse_menu`, `hostile_confrontation` re-entry, idle states, lockpick.
  - Victoria: idle at night first and repeat, the confrontation, D2-4.
  - Ffion: `night_answer` re-entry, the badge knot.
  - Phone: report for every Danny outcome.
- inkcheck, debrief: 125 states, 0 failing. Briefing clean, normal and skip.
- Route driver: 18 routes, as above.
- No browser run.

### Spoken lines changed (old → new)

No audio exists for m03. Player choices aren't listed. Pairs come from a line diff, so the Terry opener lines show shifted by one.

#### m03_npc_victoria.ink

- Victoria Sterling: I reviewed your background. Freelance pen testing, some CTF competition work.
  -> Victoria Sterling: Freelance pen testing. Some CTF work. Competent.
- Victoria Sterling: Solid technical skills. But that's not why you're here.
  -> Victoria Sterling: Competent is cheap. That's not why you're here.
- Victoria Sterling: The window opens in weeks. The assets are already moving into position.
  -> Victoria Sterling: The window opens in weeks. Some of what they bought from me is already installed.
- Victoria Sterling: A professional to the end. I could almost have used you.
  -> Victoria Sterling: The sensible answer. I could almost have used you.
- Narrator: Sterling hasn't left. The light's still on in the conference room.
  -> Narrator: Sterling hasn't left.

#### m03_npc_ffion_rees.ink

- Ffion Rees: Let me get you checked in.
  -> (cut)
- Ffion Rees: I just need you to sign in here, and I'll print you a visitor badge.
  -> Ffion Rees: Sign in for me, and I'll print you a badge.
- (none: new line)
  -> Ffion Rees: Anyway. Sign in when you're ready.
- Ffion Rees: Here's your badge. Please keep it visible while you're in the building.
  -> Ffion Rees: There you go. Keep it on show, or the guard has kittens.
- (none: new line)
  -> Ffion Rees: Well? Is she expecting you?

#### m03_npc_terry_mott.ink

- Terry Mott: Ffion said there'd be someone about. Notebook, was it? Conference room's the other end of the building.
  -> Terry Mott: You. The one with the picks. Let's hear it, then.
- Terry Mott: Ffion reckons Ms. Sterling's expecting you. She never said nothing to me.
  -> Terry Mott: Ffion said there'd be someone about. Notebook, was it?{day_greeted: Should've known it'd be you.} Conference room's the other end of the building.
- Terry Mott: Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?
  -> Terry Mott: Ffion reckons Ms. Sterling's expecting you.{day_greeted: The three o'clock, back again.} She never said nothing to me.
- (none: new line)
  -> Terry Mott: Ffion rang. Said someone come in at eleven and wouldn't say what for.{day_greeted: Didn't say it was the three o'clock.| That you?}
- Terry Mott: Well? What's your explanation for being here after hours?
  -> Terry Mott: Go on, then. Why are you here?
- (none: new line)
  -> Terry Mott: Still waiting.
- (none: new line)
  -> Terry Mott: Back the way you came.
- Terry Mott: Ffion said the same. Still nobody told me. Go on, then.
  -> Terry Mott: Ffion said the same. Still nobody told me.
- Terry Mott: Maintenance? I didn't get a work order notice.
  -> Terry Mott: Maintenance? At eleven at night?
- Terry Mott: That's... that's an executive-level card. Alright, carry on.
  -> Terry Mott: A visitor badge at three and her card at eleven.
- (none: new line)
  -> Terry Mott: Either she's taken a shine to you or I'm in trouble. Ten minutes.
- (none: new line)
  -> Terry Mott: That's one of the exec cards. ...Right. Carry on.
- Terry Mott: New hires don't usually have after-hours access...
  -> Terry Mott: New starters don't get nights. Not here.
- Terry Mott: No work order, and you don't look like our usual maintenance crew.
  -> Terry Mott: No work order, and you're not our usual lot.
- Terry Mott: I'm going to need to verify this.
  -> Terry Mott: Who's your supervisor, then?
- Terry Mott: {&Well?|Go on.|I'm listening.}
  -> Terry Mott: {&Well?|I'm listening.|Something else?}

#### m03_closing_debrief.ink

- Agent HaX: In custody. The CPS are looking at conspiracy, supplying articles for use in fraud and computer misuse, and her part in the deaths at St. Catherine's.
  -> Agent HaX: In custody. Conspiracy, computer misuse, and they want St. Catherine's on the charge sheet.
- Agent HaX: Ransomware Incorporated, Critical Mass, the rest -- all of them just got more expensive to run.
  -> Agent HaX: Every buyer downstream just lost their supplier. They'll pay more for worse.
- Agent HaX: The directive proves they exist and proves they plan at this scale. Command's had it since first thing.
  -> Agent HaX: Until last night the Architect was a rumour. Now it's a signature on a plan. Command's had it since first thing.
- Agent HaX: Careful. That's her word.
  -> Agent HaX: Careful. You're starting to sound like her.
- (none: new line)
  -> Agent HaX: That's the plan. You could have saved us the trouble.
- (none: new line)
  -> Agent HaX: He was somebody's. Now he's mine.
- Agent HaX: And their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful.
  -> Agent HaX: {reception_badge_cloned or victoria_card_cloned or draft_seen or roster_seen:And their|Their} records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful.
- Agent HaX: It got done. Not cleanly. Some people who never signed up for this will remember last night. We'll still need you soon.
  -> Agent HaX: It got done. Not cleanly. Some people who never signed up for this will remember last night.
- Agent HaX: I read your notes on Foster twice. That's not a complaint. We'll need you soon.
  -> Agent HaX: I read your notes on Foster twice. That's not a complaint.
- Agent HaX: Good work last night. We'll need you soon.
  -> Agent HaX: Good work last night.
- Agent HaX: Clean enough. We'll need you soon.
  -> Agent HaX: Clean enough.
- Agent HaX: It's done. We'll need you soon.
  -> Agent HaX: It's done.

#### m03_opening_briefing.ink

- Agent HaX: The client roster and the operational logs. Proof of who they arm, and how.
  -> Agent HaX: The client roster, the logs, and whatever they're planning next. There's a Phase 2.

#### m03_phone_agent0x99.ink

- HaX (phone text): Network's stripped, the case is made, and Danny's made his call. Sterling's your last move.
  -> HaX (phone text): Network's stripped, the case is made, and Danny's out cold in his office. Sterling's your last move.
- (none: new line)
  -> HaX (phone text): Network's stripped, the case is made, and Danny's on his way in. Sterling's your last move.
- (none: new line)
  -> HaX (phone text): Network's stripped, the case is made, and Danny's on the record. Sterling's your last move.
- (none: new line)
  -> HaX (phone text): Network's stripped, the case is made, and Danny's choice is his now. Sterling's your last move.

## Dialogue sign-off tidy (2026-10-12)

After the cycle-5 sign-off (`DIALOGUE_REVIEW_P2_C5.md`). One new spoken line, no other new text.

- **C5-1.** `ink/m03_npc_terry_mott.ink:232` (cloned-card excuse) and `:259` (enrolment-forms excuse) now clear `guard_suspicious` only when `guard_detection_count == 0`. A player he caught with picks gets "I've got your face now." instead of "Mind how you go.".
- **Danny survey callback.** New global `defended_danny`: set by `#set_global:defended_danny:true` on the "Danny drew that survey for you" choice (`ink/m03_npc_victoria.ink:671-673`), declared in `scenario.json.erb:1848` and as a VAR in `m03_npc_victoria.ink:62` and `m03_closing_debrief.ink:45`. Gated HaX line in the debrief at `m03_closing_debrief.ink:314` (protected, after "He'll carry it anyway.") and `:339` (exposed, after "But he serves."): "He knows you spoke up for him in front of Sterling. He mentioned it twice." The line sits before the Sterling-fate lines, including "He asked which floor they're holding Sterling on.". Same text in both places, so one TTS entry.
- **Validator.** `torch` added to the known NPC behaviour fields (`scripts/validate_scenario.rb:284`); Terry's warning is gone.
- **Routes** (`scripts/ink_runtime_check/m03_routes/`): r1 drops the extra "Look in" pick; r6 sets `guard_grace:false` before the second lockpick step; r11 and r15 drop the briefing picks that no longer exist; r12 drops the "St. Catherine's" debrief pick. New: `r17_caught_then_excuses.json` (C5-1: card and enrolment forms after a catch both end on "I've got your face now.") and `r18_danny_callback.json` (callback plays with the global set, absent in the control).
- **Checks.** Ink compiles; validator (with ink, `--no-graph`) passes with known items only; dialoguelint 0 errors, the 2 known Victoria warnings; reopencheck 0 problems; all 20 routes run, and every route that ends does so at its intended end.

## Lighting cycle 3 (2026-10-12)

Config only (`scenario.json.erb` lighting fields); plan §11; screenshots `build_evidence/lighting_c3/` (options game 2148, day 2151, night 2152). Reload checks and the real night turn are with the Sonnet tester (coordinator).

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 1 | 1 (mitigated) | 1 engine proposal |
| Minor | 4 | 3 | 1 |

- **M1 (mitigated; engine E4 proposed):** Terry's vision cone draws under the light map (`npc-los.js:385`, depth 9999), so the night corridor dimmed it. Exec wing night ambient `#343a50` → `#424a62`; the real fix (cone at `overlayDepth`) is a one-line engine change awaiting approval.
- m1 main hallway at night: the corridor competed with the threat map. Darker (`#262c40`, pools 0.2) and a night-only threat-map variant (r 76, 0.9): chosen over two other options by looking.
- m2 Danny's lamp a touch hot on the wall: 0.7 → 0.6.
- m3 Terry's beam short in the three-tile corridor: reads; start point and width are engine (E5, optional), left.
- m4 server-room player torch faint against the racks: withdrawn as a lighting issue. The room strikes on within about 0.9 s of entry, so the torch is barely seen there.
- Fresh look at every cycle-2 shot: nothing above minor.
- Validator schema passes. No engine files touched this cycle.

## Room dressing, cycle 5 (2026-10-12): polish and confirmation

Record: `ROOM_DRESSING.md` (cycle 5), screenshots `build_evidence/dressing_c5/` (day and night).

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 0 | 0 | 0 |
| Minor | 5 | 5 | 0 |
| Observation | 1 | 1 | 0 |

- R-2 fixed with margin (directory in range for any approach from y 104 to 160, best 12 px); R-4, RESTRICTED plate padding, Danny's book pile, distinct corridor sideboard, planter off Terry's patrol.
- Final checks clean (slot audit, validator, door alignment, wall heights). No scenario edits.
- **Room dressing is final; the layout is ready for the POV-background stage.** Still open, engine side only: Server Room Whiteboard read-in-place; F-4 dialog titles.
- **F1 (night lighting check).** `ink/m03_npc_ffion_rees.ink:310-313`: `clone_badge_debrief` now hands over to `start` once it is night (the D4-1 pattern on her other day knots), so a chat closed at "The badge is in the cloner." by day opens at night with only "Oh! You made me jump." No new text. Route `r19_clone_debrief_closed_by_day.json`.

## Lighting cycle 4 (2026-10-12, final)

E4 as its own change set (`public/break_escape/js/systems/npc-los.js` only), then m03 config. Plan §12; screenshots `build_evidence/lighting_c4/`.

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 1 | 1 | 0 |
| Minor | 4 | 2 | 0 (2 accepted) |

- **M1 (fixed, E4):** Terry's cone dimmed by night lighting. Cone above the light map; exec wing back to `#343a50`.
- m1 slat-wall accent indistinguishable from day (tester L1): two amber downlights; counter pool lowered off the wall.
- m2 Danny's new dark sprite lost in the dark: `darkAmbient` `#1e2740`.
- m3 CEO/server stay lit after leaving (tester L3): accepted, rooms the player searches keep their light.
- m4 Terry's cone drawn over the wall into Danny's office now it's above the map: accepted.
- Checks: node suite 481 / 475 pass, the same 6 known failures as cycles 2-3; LOS-related tests (engine-fixes-pass4, -pass4c, lockpick-catch, npc-sight-challenge) 50/50. Validator schema passes. m02 lockpick catch not driven in a browser.
- Lighting stage closed after four cycles: nothing above minor in the final day and night tours with the final maps and sprites.

## Room dressing, cycle 6 (2026-10-12): fresh eyes, final lighting and sprites

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 1 | 1 | 0 |
| Minor | 2 | 1 | 1 (Danny's centre floor kept open on purpose: the walk to his desk and the night lamp's pool) |

- VM Access Terminal: pink `vm-launcher` sprite replaced by a black monitor (`pc10`, `as-type:pc`, one scenario field). Conference: flip chart to the table's east end, drinks trolley by the E wall.
- Reception untouched. Checks clean. Shots `build_evidence/dressing_c6/`.

## Room dressing, cycle 7 (2026-10-12): confirmation

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 0 | 0 | 0 |
| Minor | 1 | 0 | 1 (KVM cart's decor screen beside the usable terminals; kept for realism) |

- Conference trolley and flip chart, and the server room's VM terminal, read correctly day and night. No changes.
- **Room dressing closed after seven cycles; the layout is final.** Shots `build_evidence/dressing_c7/`.

## Blind-run fixes (2026-10-12)

From `PASS2_BLIND_B.md` (struggling player, complete), `PASS2_BLIND_A.md` and `PASS2_BLIND_A2.md` (partial "do your best" runs). User decisions of 2026-10-12: allow a final sweep after a Victoria KO; offer the whiteboard again straight after a dropped clone read; the polish list; the executive PC lockout (B F3) declined. Mission-local edits only; ink snapshot taken first (session scratchpad `m03-blindfix/ink_snapshot/`), tagdiff run against HEAD.

| Severity | Found | Fixed | Engine / by design | Declined |
|---|---|---|---|---|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 3 | 2 (B F1, B F2) | 0 | 1 (B F3, user) |
| Minor | 11 (those in the brief) | 6 | 5 (B F5 partly fixed mission-side) | 0 |

### Outcomes

- **B F1 (major), Victoria KO ends the mission with tasks open: fixed.** A KO no longer sets `victoria_choice_made`. Night KO with all four flags in (HaX `npc_ko:victoria_sterling` mapping): her task ticks, the new optional task `call_in_after_sweep` ("Finish your sweep, then call HaX to bring you in", `scenario.json.erb:464`) opens, and HaX texts "She's down. Finish the sweep and get out. Call me when you want bringing in." (`:1048`). KO before the last flag: a `closing_debrief` mapping on `night_confrontation_ready` does the same (`:1159`); the four "all flags in" texts now say "call me" instead of "go and settle it"; the conference-room entry mapping that ended the mission is gone. The way out is a new first choice in HaX's hub, "I'm done in here. Bring me in." (`m03_phone_agent0x99.ink:112`), then `extract_offer` (warns that what's unread stays behind and names the safe if still shut), "Not yet" back to the hub, or "Bring me in." → "On my way." → `extract_go` sets `victoria_choice_made` and completes the task, and the existing `closing_debrief` mapping opens the debrief. Debrief KO lines unchanged. Reload: the existing `night_transition` backstops re-emit `victoria_choice_made` if the page reloads between the call and the debrief's first line; a reload during the sweep keeps the hub choice (gated on synced globals). "Where do I stand?" no longer says "see him before Sterling" or "Sterling's your last move" after a KO.
- **B F2 (major), clone retry hidden behind the walk-back line: fixed.** "Drift back to the whiteboard" is offered whenever the read has dropped (`m03_npc_victoria.ink:216`); the walk-back line stays as an optional repair. The drop now ends on "You'll need her back at the whiteboard for a fresh read." and skips the hub filler. HaX's clone hint matches.
- **B F3 (major), PC password has no lockout: declined by the user.**
- **A/A2, the night turn isn't signalled as one-way: fixed.** Task `leave_until_dark` is now "Step out to the main hallway to end the day" with a description that says it happens at once (`scenario.json.erb:237`); HaX's "Card's saved" text, the KO-card call and "Where do I stand?" all say the hallway ends the day.
- **A #4 / B, wrong card at a reader shows no denial: fixed mission-side, engine item noted.** The cloner does show "Access Denied" (`rfid-minigame.js:186-198`) but only for 1.5 s before returning to the list. HaX now texts once on a failed emulation of the reception badge ("That's the reception badge. The server room reader wants Sterling's executive card.", `scenario.json.erb:823`). The physical-card tap path emits no event, so it isn't covered.
- **B F5, toast stack over the objectives and a stale day toast at 11 pm: engine.** Toasts live 60 s (`npc-barks.js:29`, `:381`) and nothing in a scenario can clear them. Mission-side, the "Card's saved" text now reads less wrong after the turn; the rest needs an engine change (below).
- **B F8, transaction log task stays open after HaX reads it out: fixed.** Renamed "Find out what the transaction log says"; completes on reading the log or at the end of HaX's revelation call (`scenario.json.erb:307`, `:1152`).
- **B F10, `decode_client_roster` completes with no decode: fixed.** Now "Take Sterling's client roster", described as raw hex that CyberChef will read (`scenario.json.erb:336`). Completion unchanged (`roster_seen`); id kept for save compatibility.
- **A #5, `*shakily*` printed in Danny's line: fixed.** All asterisk cues checked: Danny had four in 26 lines; three cut (`*voice cracks*`, `*shakily*`, `*quietly*` on his re-entry line). Victoria's long `*low, into her phone, back to the door*` is now a narrator line. The other cues (Victoria `*curtly*`, `*coolly*`, `*drily*`, `*after a moment*`, `*quietly*`; Terry `*flatly*`, `*scoffs*`; Danny `*quietly*`; HaX `*quietly*`) are short and read as delivery, so kept (README_ink_best_practices rule 6).
- **Weak lines (A, A2, B): fixed where agreed.** See the table below. "Guides on request" kept (each guide offer names a different guide). Ffion's "Sorry, I was miles away" kept (it plays only by day, straight after the lean-in, where it fits).
- **B F6, guard warnings have no teeth: by design, not changed.** Terry catches a pick in his cone (`lockpick_used_in_view`), not presence; B walked up and knocked him out without picking in view. Giving him `los.challengeOnSight` would add presence detection but changes the stealth puzzle and Perfect Stealth, so it is a design question for the user, not a fix.
- **B F7, KO'd body gone after a reload, items stay; respawn at reception: engine** (below).
- **B F9, credits replay after a reload: by design.** `conclusionScreen` re-opens the visualiser on a reload after conclusion (README_scenario_design.md "conclusionScreen"); it is closable the second time.
- **A2, Mission Brief panel and tutorial prompt straight after the briefing: engine/framework, not changed.**

### Engine items for approval (not built)

1. **Toast lifetime and placement** (`public/break_escape/js/systems/npc-barks.js:29`, `:381`, `:432-448`): toasts last 60 s and stack over the objectives panel. Proposal: a scenario-level `clearBarks: true` mapping action (or `#clear_barks` ink tag) used on `conversation_closed:night_transition`, and/or auto-dismiss a phone contact's older toasts when a newer one from the same contact arrives; keep the stack clear of the objectives panel.
2. **Denial screen length** (`public/break_escape/js/minigames/rfid/rfid-minigame.js:186-198`, `:113-120`): "Access Denied" shows for 1.5 s, then the list returns. Proposal: hold it until the player taps (or 3 s), and emit `door_unlock_failed` with the door's room so scenarios can react to the physical-tap path too.
3. **KO state after a reload for start-room NPCs** (`public/break_escape/js/systems/npc-lazy-loader.js:97-107` restores `isKO` for lazily loaded rooms; B saw Ffion, in the start room, vanish while her drops stayed). Needs a look at the start-room registration path.
4. **Respawn at reception after a reload** (known backlog item).

### Spoken lines changed (old → new)

No audio exists for m03 yet.

| File:line | Old | New |
|---|---|---|
| `m03_npc_victoria.ink:200` | "{&Go on.\|What else?\|Ask.}" | "{&What else would you like to know?\|You keep looking at that board. Ask about it, if you like.\|Ask. I'll tell you if it's above your pay grade.}" |
| `m03_npc_victoria.ink:429` | "Everything on that board is real, and everything on it is broken. On purpose." | "Real kit, every box of it. We leave the holes in on purpose." |
| `m03_npc_victoria.ink:490` | (new) | Narrator: "You'll need her back at the whiteboard for a fresh read." |
| `m03_npc_victoria.ink:508` | Narrator: "Nearly there. Keep her talking." | Narrator: "Against your leg, the cloner is still working. A few seconds more." |
| `m03_npc_victoria.ink:768-769` | "\*low, into her phone, back to the door\* No. Not tonight. I said I'd deal with it myself." | Narrator: "Sterling is on the phone by the window, her back to the door, voice low." / Victoria: "No. Not tonight. I said I'd deal with it myself." |
| `m03_danny_choice.ink:48` | "\*voice cracks\* I know. I know what my map was for." | "I know. I know what my map was for." |
| `m03_danny_choice.ink:64` | "A stranger in my office at night, and me trying to explain I'm not what the map makes me look like." | "And now there's a stranger in my office at night, and I'm trying to explain the map." |
| `m03_danny_choice.ink:75` | "\*shakily\* You'd do that." | "You'd do that. For me." |
| `m03_danny_choice.ink:119` | "\*quietly\* I've made the call." | "I've made the call." |
| `m03_opening_briefing.ink:230` | "Listen. Whatever the count turns out to be at St. Catherine's, people died on the back of what Zero Day sold." | "Listen. Every life St. Catherine's lost, it lost to something Zero Day sold." (keeps m02's count open without reading as a placeholder) |
| `m03_npc_ffion_rees.ink:161` | "{&Anything else, love?\|Anything else?\|Go on.}" | "{&Anything else, love?\|What else can I do for you?\|Still here? I don't mind.}" |
| `m03_phone_agent0x99.ink:299` | "If the read drops, walk the suspicion back first, then drift to the board again." | "If the read drops, take her back to the board and start again." |
| `m03_phone_agent0x99.ink:359` | "Sterling's card is saved. Walk out with the visitors and come back after dark." | "Sterling's card is saved. Step out into the main hallway when you're done: that ends the day, and we come back after dark." |
| `m03_phone_agent0x99.ink:363` | "Nightshade's copy of her card is in your kit. Walk out and come back after dark." | "Nightshade's copy of her card is in your kit. Step out into the main hallway: that ends the day, and we come back after dark." |
| `m03_phone_agent0x99.ink:376` | "The case is made. If Danny Foster matters to you, see him before Sterling." | "... see him {victoria_ko:before you leave\|before Sterling}." |
| `m03_phone_agent0x99.ink:381-387` | "Network's stripped, ... Sterling's your last move." (four Danny variants) | same, with "Sterling's your last move." dropped after a KO |
| `m03_phone_agent0x99.ink:390` | "Sterling's still in the conference room where you left her. Go and settle it." | "Sterling's still out cold. Finish your sweep, then call me and I'll bring you in." |
| `m03_phone_agent0x99.ink:467` | "{player_name()}, I've got the distcc logs you just submitted." | "{player_name()}, your distcc flag just landed, and the logs came through with it." |
| `m03_phone_agent0x99.ink:588` | "Walk out with the visitors before anyone finds her. Come back after dark." | "Step out into the main hallway before anyone finds her. That ends the day; come back after dark." |
| `m03_phone_agent0x99.ink:595-621` | (new) | `extract_offer` / `extract_choices` / `extract_go`: "Once you're out, you don't go back in. Anything you haven't read stays for the search team." / "The server room safe's still shut, for one." / "Car's at the side door. Two minutes." / "Take your time. She isn't going anywhere." / "See you at HQ." |
| `scenario.json.erb:823` (text) | (new) | "That's the reception badge. The server room reader wants Sterling's executive card." |
| `scenario.json.erb:864` (text) | "Card's saved. Thank her, walk out with the visitors, and come back after dark." | "Card's saved. Thank her. Once you step out into the hallway the day's over: you leave with the visitors, and we come back after dark." |
| `scenario.json.erb:1048` (text) | (new) | "She's down. Finish the sweep and get out. Call me when you want bringing in." |
| `scenario.json.erb:1055`, `:1080` (texts) | "Everything's off their network. Sterling's still in the conference room where you left her. Want a say in what happens to Danny? His office first." | "Everything's off their network, and Sterling's still out cold. Want a say in Danny's fate? His office first. Then call me to come in." |
| `scenario.json.erb:1061`, `:1086` (texts) | "Everything's off their network. Sterling's still in the conference room where you left her. Go and settle it." | "Everything's off their network, and Sterling's still out cold. Finish your sweep, then call me and I'll bring you in." |

### Checks run

- Ink compile: 8/8.
- Validator (full): schema passes; objective wiring shows the one pre-existing warning (`npc_ko:victoria_sterling` handlers fire together on purpose). The two new task mappings sit on `closing_debrief` so they don't add shared-pattern warnings on HaX. Other issues unchanged from HEAD.
- dialoguelint: 2 warnings, both on untouched lines that predate this round (`m03_npc_victoria.ink:645` not-x-but-y, `:708` choice length).
- tagdiff vs HEAD: Victoria 3 differences (the retry condition, `hub_quiet` after the drop); phone 30 (new VAR `victoria_choice_made`, the hub choice and four extraction knots, five `victoria_ko` conditions in the recap); the rest prose only.
- reopencheck: 0 problems (m03 HaX 523 reopens).
- Route driver: new `r20_ko_sweep.json` (night KO, "Not yet", sweep, call in, KO debrief) and `r21_clone_retry.json` (dropped read, retry offered at once and after a close and reload, read completes). All 23 routes run with no missing picks; `r2_suspicious` now stops on a menu that offers "Drift back to the whiteboard" straight after the drop.
- Browser (headless, keyless :3001, game 2190, session log `tools/playtest/m03-blindfix-check-session.jsonl`): rooms opened with `tools/playtest/unlock-all-rooms.rb` and the night/flag globals set by console, so the run is "exercised, not earned". After `debugKO victoria_sterling` in the conference room: no debrief, `victoria_choice_made` false, HaX's "She's down" toast shown, `victoria_choice_made` task completed, `call_in_after_sweep` active. Clicking the toast opened the phone at the hub with "I'm done in here. Bring me in." first; "Bring me in." → "On my way." closed the phone and opened the `closing_debrief` person-chat at once ("SAFETYNET headquarters. The morning after..."), with `victoria_choice_made` and `debrief_played` true and the call-in task completed. No errors in the bridge log.

## Blind-run fixes 2 (2026-10-12)

User decision on Terry (2026-10-12), relayed by the orchestrator, plus the minors from `PASS2_BLIND_A3.md`. Mission-local edits only. The engine files another agent is changing (toasts, RFID denial, KO-body reload) were not touched. tagdiff is against HEAD (a465dc29).

| Severity | Found | Fixed | By design / no change |
|---|---|---|---|
| Blocker | 0 | 0 | 0 |
| Major | 0 | 0 | 0 |
| Minor | 8 (A3 #3-#9 and the worst lines) + the Terry decision | 8 + Terry | A3 #1, #2, #10 (backlog, by design, harness) |

### Terry at night (user decision)

- **Seen at night means a challenge.** Terry's `los` now has `challengeOnSight` (`scenario.json.erb:1609`). `requireGlobal: "clone_call_done"` limits it to the night, because by day the player is a signed-in visitor. It is skipped once he has waved the player on (`guard_waved_on`, a new global set when his hub is reached, `m03_npc_terry_mott.ink:440`), and also after he has been paid, been told SAFETYNET, turned hostile (`guard_attacking`), been knocked out, or the debrief has played. The 20 s cooldown gives a player he has ordered out time to leave. The engine supports this gate from scenario data, so no engine change was needed.
- **The sighting** (`player_spotted:terry_mott`, `erb:1618`) opens the new knot `on_sighted` (`terry:101`), which routes in three ways:
  - a first sighting, or one before the player has answered him, goes to `start`: his recognition of the afternoon recruit, Ffion's story, the card line and `excuse_menu`, all unchanged;
  - a player he has ordered out (new local `ordered_out`, set by "Wrong turn" and by "Alright, I'm going", `:178`, `:534`) gets "I told you to leave. You didn't." and the police threat (`hostile_confrontation`);
  - a player he has already threatened gets `#hostile:terry_mott`.
- **Seen picking a lock means a fight.** `on_lockpick_detected` (`terry:580`) now counts the detection, plays one line ("Picks. Right. We're done talking.") and carries `#hostile:terry_mott`. The one-strike grace system is gone: `guard_grace` VAR and global, the two clearing mappings on `closing_debrief`, and the knots `lockpick_still_here`, `lockpick_again` and `lockpick_final`. The catch mapping also skips a guard who is already chasing (`guard_attacking`, `erb:1625`). His hostile re-entry line no longer says "I told you to leave" after a lockpick catch (`terry:43`).
- **Wording to match:**
  - HaX's exec-wing text: "If he sees you, he stops you. If he sees you picking, he won't stop at talking." (`erb:800`)
  - HaX's guard hint, lockpicking hint and recap (`phone:132`, `:270`, `:321`, `:430`)
  - the debrief's single run-in line (`debrief:97`)
- **Perfect Stealth:** a sighting runs `start`, which sets `guard_challenged`, and the credit, the debrief's "the guard never once saw you" and the `zero_detection` gate all already exclude `guard_challenged`. "Never seen by Terry" is therefore what they now mean, and they read true. Unchanged.

### A3 minors

- **#3** Victoria's "You keep looking at that board." is now "There's a board behind me, if you've run out of questions." (`victoria:202`).
- **#4** The transaction log now matches m02's invoice ("TOTAL: $55,000 (15% ENTROPY discount applied)", m02 `scenario.json.erb:2886`). The total stays $55,000 and the line reads "(all prices net of the 15% ENTROPY affiliate discount)", so the line items add up, and HaX's and Victoria's "twenty-five thousand" is the backdoor's line item (`erb:68`). The continuity note at the top of the erb says so.
- **#5** Decision objectives reworded so they don't announce the choice: "Talk to the consultant, Danny Foster" (`erb:346`), "Face Sterling in the conference room" (`:459`), and the Settle Accounts aim's description "Sterling signed the sale. Go and face her." (`:431`). I chose rewording over reveal-on-meeting because it needs no new wiring.
- **#6** Danny's follow-ups each offer two options (`danny:76-103`): commit to what you said, or reconsider after seeing how he takes it (protect → expose, expose → protect, leave → protect). The fate is set once, in the new `protect_done`, `expose_done` and `left_done` knots. Choices stay sticky.
- **#7** VM panel vs fiction: the panel's VirtualBox instructions are engine standalone text (`vm-launcher-minigame.js:436`) and the VM work is real. The fiction now explains them: the terminal observation (`erb:1484`) and HaX's server-room text (`:807`) say Nightshade has bridged the isolated lab to the player's own kit.
- **#9** Runbook: kept in the server-room cabinet. The cabinet now reads "The label on the top drawer reads TRAINING LAB -- STUDENT MATERIALS." (`erb:1430`), so a player stuck on the VM has a reason to pick it. The old text said "not where the sensitive material lives", which sent players away from it.
- **Worst lines:**
  - Ffion names Zero Day. By canon this is Sterling's in-house name for the training side (Victoria and the recruit both say it by day), so she now says it that way: "Ms. Sterling calls it Zero Day." (`ffion:101`).
  - Victoria's "Entropy, if you like." is now "Everything breaks in the end. Some people call that entropy. I call it stock." (`victoria:182`).
  - Her phone buzz and "Excuse me, I need to take this." are now one narrator beat (`victoria:589`). The tester saw the line twice on advancing; I couldn't find a replay in `person-chat-minigame.js`, so it is probably the harness double-advancing. One line now, either way.
  - Danny's folder note is now neutral: "Danny's hospital assessment, the email he sent with it, and Sterling's one-line reply." (`erb:1784`).
- **Not changed:** A3 #1 respawn (backlog), #2 Ffion and Victoria at night (by design), #10 harness `interact` reporting.

### Spoken lines changed (old → new)

| File:line | Old | New |
|---|---|---|
| `terry:43` | "I told you to leave. I'm calling the police." | "{ordered_out:I told you to leave.\|Not another word.} I'm calling the police." |
| `terry:on_sighted` | (new) | "Right. I warned you." / Narrator "The torch finds you again." / "I told you to leave. You didn't." |
| `terry:~176` | "Back the way you came." | "Back the way you came. And if I see you in here again, I won't be asking." |
| `terry:~533` | "Good. Off you go." | "Good. Off you go. I see you in here again, I'm not talking." |
| `terry:on_lockpick_detected` | "Oi. Away from the door. Now." + three choices and their replies; `lockpick_still_here`, `lockpick_again`, `lockpick_final` lines | "Picks. Right. We're done talking." (torch narration kept); the old lines are removed |
| `victoria:182-183` | "Every system tends towards disorder. Entropy, if you like." / "Systems fail. What matters is who knows first, and who pays them for knowing." | "Everything breaks in the end. Some people call that entropy. I call it stock." / "What matters is who knows first, and who pays them for knowing." |
| `victoria:202` | "You keep looking at that board. Ask about it, if you like." | "There's a board behind me, if you've run out of questions." |
| `victoria:589` | Narrator "Victoria's phone buzzes. She glances at it." / "Excuse me, I need to take this." | Narrator "Her phone buzzes. She glances at it, then at the door, and the meeting is over." |
| `ffion:101` | "There's the training side too. Zero Day. Don't ask me..." | "There's the training side too, in the back. Ms. Sterling calls it Zero Day. Don't ask me..." |
| `danny:76-103` | (new second options and replies) | "Don't thank me yet. Thinking about it, the map's yours. You'll answer for it." / "...Right. For a second there I thought I'd got away with it." / "You went to her when you worked it out. That counts. Come in and testify." / "You mean that? ...Then yes. Whatever they need." / "Fine. Then here's mine: come in, tell them everything, and I'll vouch for you." / "Thank you. I don't think I could have done it on my own." |
| `phone:270-271` | "Never work a lock in his sightline. Watch his loop, wait for his back to turn, then pick." / "If he's already looking, break off. Step out to the main hallway or into Danny's office until he's moved on." | "At night he stops anyone his torch finds. Watch his loop and move while his back's turned." / "And never pick a lock where he can see you. If he catches the picks, he stops talking." |
| `phone:321` | "Get caught at it and that's a detection you don't get back." | "Get caught at it and he won't argue. He'll come for you." |
| `phone:430` | "The guard's caught you at a lock. Only pick when he's turned away." | "The guard's had trouble with you once already. Don't give him a second go." |
| `debrief:97` | "Security flagged one run-in with the guard. You recovered, but you left a mark on the log." | "Security flagged one run-in with the guard that turned ugly. You got clear of him, but it's on the log." |
| `erb:800` (text) | "Sterling's office is keyed, not carded -- that's your pick kit. A guard works this corridor; pick only when his back's turned, or you're made. Lockpicking guide if you want it." | "Sterling's office is keyed -- that's your pick kit. A guard works this corridor. If he sees you, he stops you. If he sees you picking, he won't stop at talking." |
| `erb:807` (text) | "You're at their VM terminal. Scan first, then work the services. Submit each flag at the drop-site terminal. Guides on request." | "You're at their VM terminal. Nightshade's bridged it to your kit. Scan first, then work the services, and submit each flag at the drop-site." |

### Checks run

- Ink compile 8/8.
- Validator: schema passes. The objective-wiring warning is the same one as before. Two new advisory warnings on Terry's sighting mapping (no background, no `onceOnly`) are the same as on his lockpick mapping and are deliberate: the challenge must repeat, and the room's own chat background applies.
- dialoguelint: the two pre-existing warnings only (`victoria:647`, `:710`).
- tagdiff vs HEAD: Terry 76 differences (VAR `guard_grace` → `ordered_out`, knot `on_sighted`, three lockpick knots removed, the `guard_waved_on` tag in the hub, the `ordered_out` assignments, the catch reduced to one hostile beat). Danny 63 (the outcome code moved into the `*_done` knots, two choices per follow-up). The other files changed prose only.
- reopencheck: 0 problems.
- Routes: all 24 run with no missing picks. New `r22_terry_on_sight.json`: first sighting → challenge → waved on; ordered out → police threat → ordered out again → fight; by day hands straight back. `r16` and `r17` now expect hostility after a catch; `r6`, `r10` and `r15` updated for the one-beat catch.
- Browser (headless, keyless :3001, game 2193, session log `tools/playtest/m03-blindfix2-check-session.jsonl`; night globals set by console, so "exercised, not earned"):
  - Entering the executive wing at night, Terry's cone found the player within 3 s. `player_spotted:terry_mott` fired, his challenge opened ("Building's shut, mate…", "Go on, then. Why are you here?") and set `guard_challenged`.
  - The Sterling-files story and the enrolment forms reached his hub and set `guard_waved_on`. He did not challenge again over the next 25 s in the corridor.
  - Picking Sterling's door while he stood at his post facing it (real line of sight, no shortcut) opened "Picks. Right. We're done talking." He came out of it hostile (`isNPCHostile` true, `guard_attacking` true, `guard_detection_count` 1). No errors in the bridge log.

## A4 fix pass (2026-10-13)

Fixes for blind playtest A4 (`PASS2_BLIND_A4.md`), items approved by the user. Static checks only; no browser run (the orchestrator runs that next).

### Changes

- **S6, Terry's route question.** "What's your route?" now leads to a new knot `route_reply` (`terry:~500`) with three answers: "So I'm not under your feet…" (back to his hub, "Fifteen minutes, I'm back past this door"), "No reason! Just… making conversation." (influence −5, back to his hub colder) and "Forget I asked…" (ends the chat at `guard_idle`). A reopen there re-asks the question (local `route_quiet`). Nothing here changes `on_sighted` or `excuse_menu`: he has already waved the player on, and the hub's exits and suspicion stay as before.
- **S8, the cloner glow.** New synced global `cloner_glimpsed`, set where "Her eyes drop to your pocket" plays (`victoria` `clone_check_2`). Each of the three replies after it records a local `cloner_deflection` (flattery / diagram / certs). The night opener adds one line after her read-back, varied by the reply, with a fallback; not after a receptionist KO.
- **S3, approach and NHS payoff.**
  - The briefing writes `cautious` ("I'll be thorough"), `aggressive` ("I move fast…") and `diplomatic` ("I'll stay flexible"). `last_advice`'s "If he did the recon, he's part of it." used to overwrite this with `aggressive`. It no longer does, because the debrief now quotes the pick back.
  - The debrief's two scattered approach lines in the Sterling branches are gone. `final_assessment` now carries one line for each value that names the briefing choice, varied by outcome (paper trail for thorough, guard record for fast, Sterling's fate for flexible). The three Danny-branch approach lines are unchanged.
  - `victoria_test_answer` (the NHS answer) is now a synced global, with `#set_global` on each answer.
  - Credits: three APPROACH lines and three STERLING'S NHS QUESTION lines at the top of DECISIONS (`erb:~171`).
- **Worst lines.** The briefing option, HaX's three approach replies, both `defended_danny` lines (now "the part of the comms log where you told Sterling what drawing that survey had cost him", which matches what the player actually said) and Danny's "God, yes" line, as in the table below.
- **Ffion's options.** The topic knots' "Thanks." returns are now "Good to know.", "I'll look out for him." and "Fair enough."; "That's helpful, thanks." is now "That helps." Only the leave option starts with "Thanks".
- **S7, Ffion at night.** A new bark mapping on Ffion: `room_entered:reception_lobby` when `clone_call_done`, not KO'd, and before she has had her night answer (`!ffion_night_story`), `onceOnly`. Text: "Charger, charger... I know I left it here somewhere." Her chat opens with different words. m03 had no barks before this; the mapping follows m02's pattern.
- `TESTING_WALKTHROUGH.md`: the debrief callback line updated, four checklist items added.

### Decided against

- Renaming `called_it_murder` to match the new wording: it would mean renaming the id in two ink files and the globals for no change in play. A comment in the briefing records it.
- New approach payoffs in Danny's branches: they already react to the approach in three places. One named line in the final assessment, which every player hears, does what the item asked without stacking lines.
- The player's new briefing option first read "…and charged extra for it", but that echoes the phone revelation option "They charged extra to hit a hospital" (`phone:482`), so it now reads "…and put a price on that".

### New globals

`victoria_test_answer` ("" / sold / hedged / asked), `cloner_glimpsed` (bool). Both are in `globalVariables`, declared as VARs in `m03_npc_victoria.ink` and written with `#set_global`.

### Spoken lines changed (old → new)

No audio exists for m03. Player choices aren't listed.

| File | Old | New |
|---|---|---|
| briefing `mission_stakes` | "That's the case we're building. And there's a Phase 2 behind it." | "They knew, and they billed for knowing. That's the case we're building. And there's a Phase 2 behind it." |
| briefing `mission_approach` (thorough) | "Smart. Zero Day leaves paper. Find it, connect it." / "And there's a guard on nights. Stealth counts." | "Good. Zero Day invoices everything, so somewhere in that building St. Catherine's is on paper. Bring me the paper." / "Thorough takes time, though, and there's a guard on nights. Don't let him find you reading." |
| briefing (fast) | "Less time for things to go wrong. But don't blow past the distcc logs -- that's the case." | "Less time in the building, less time for it to go wrong. Just don't sprint past the distcc logs. They're the case." |
| briefing (flexible) | "Then watch her, not the room. Call if you need me." | "Then watch Sterling, not the furniture. Whatever she wants most is your way in. Call if you need me." |
| debrief `mission_impact` | "You called it murder with an invoice. Turns out they kept the invoice." | "In the briefing you said they'd put a price on it being a hospital. Now we can prove they knew." |
| debrief `victoria_recruited_path` | "You read the moment and took it. That's the whole reason this was on the table." | (removed; see final_assessment) |
| debrief `victoria_arrested_path` | "Your evidence did that. Clean collection, clean prosecution." | (removed; see final_assessment) |
| debrief Danny protected | "He knows you spoke up for him in front of Sterling. He mentioned it twice." | "I played him the part of the comms log where you told Sterling what drawing that survey had cost him. He asked to hear it again." |
| debrief Danny exposed | (same old line) | "His solicitor's heard the part of the comms log where you told Sterling what drawing that survey had cost him. She'll use it. It won't change the charge." |
| debrief `final_assessment` | (new) | thorough: "You told me you'd be thorough and document everything. You did. I've had to borrow a second evidence locker." / "…Most of it. Next time, the drawers you skipped." fast: "You said you'd move fast, grab the objectives and get out. You did, and nobody kept up with you." / "…Fast got it done. Fast also left marks, and you've heard about them." flexible: "You said you'd stay flexible and read the situation." + "Sterling's deal only happened because you did." / "You read it, and it said handcuffs. Fair." / "You read it as letting her walk. I'd have read it differently." / "In the end the situation was a woman on the floor." |
| danny `protect` | "Everything. Yes. God, yes." | "Everything. I've carried it round for months. I'd like to put it down." |
| terry `route_reply` | (new) | "Considerate. Fifteen minutes, I'm back past this door. Be done by then." / "Making conversation. At eleven at night. About my route." / "I'll be making mine past this corridor a lot more often, then." / "Best idea you've had tonight." / re-entry "I asked you a question. My route. Why?" |
| victoria `nighttime_confrontation` | (new) | "Your pocket lit up this afternoon, and you chose that moment to flatter me. I enjoyed the flattery. I should have looked at the pocket." / "Your pocket lit up this afternoon, and my network diagram suddenly fascinated you. I checked my card was still in my bag. It was. That's the trick, isn't it?" / "Your pocket lit up this afternoon, and you asked me about certificates. Nobody cares about certificates. You wanted me looking anywhere else." / "Something in your pocket lit up this afternoon. I told myself it was a phone." |
| erb Ffion bark | (new) | "Charger, charger... I know I left it here somewhere." |

### Checks run

- Ink compile 8/8 (`scripts/compile-ink.sh m03_ghost_in_the_machine`).
- Validator `--skip-ink --no-graph`: schema passes, no errors. The warnings are the known ones (the objective-wiring warning on `npc_ko:victoria_sterling`, Terry's two cutscene mappings). A run with ink checks is clean once the route answers moved into their own knot (nested `**` choices were flagged as markdown bold).
- dialoguelint: the 2 known warnings only (`victoria:673`, `:736`).
- tagdiff vs HEAD, all intended: Terry 24 (VAR `route_quiet`, knot `route_reply`, its choices, diverts and tags); Victoria 15 (VARs `cloner_glimpsed`, `cloner_deflection`, the four `#set_global` tags, the night conditions); debrief 13 (two approach conditions moved into `final_assessment`); briefing 2 (the `last_advice` overwrite removed); Ffion and Danny prose only.
- reopencheck: 0 problems.
- loopcheck: 29 runs, 0 failing (Terry `ask_shift`, `route_reply` quiet and re-entry, hub, idle; Victoria `clone_check_2` with and without the glimpse, the confrontation for each deflection with and without a receptionist KO; Ffion day and night; briefing `start`, `mission_approach`, `last_advice`; Danny).
- inkcheck: debrief 240 states (4 Victoria fates × 5 Danny fates × 4 approaches × 3 extras) and 80 more with the callbacks on, 0 failing; briefing clean (capped).
- Route driver: 27 routes, 0 missing picks. The intended mid-chat stops are the same as at HEAD. r1 and r5 now pick the new briefing option; r5 also answers Terry's route question. New routes: `r23_a4_terry_route` (each reply, a reopen, a reload at the question), `r24_a4_cloner_callback` (each deflection, and no glimpse), `r25_a4_debrief_approaches` (each approach into the debrief, plus flexible with Sterling KO'd).
- No browser run.
