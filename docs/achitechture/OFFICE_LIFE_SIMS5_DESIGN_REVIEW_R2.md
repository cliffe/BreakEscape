# SIMS-5 design review, round 2

Scenario `test_needs_sims`, branch `build/ol-sims` at `bc561ae75`. Kind of game: a lab and demo scenario, short and focused on NPC needs and office behaviours that missions m01 to m10 will copy. This round judges the design side of SIMS-5: the README tour of office beats and their levers, V10's warning wording, the staff-room chatter rate, and anything a mission author could copy wrongly. Known owner calls (the mug removal 422, Neil's page click hitting the copier, the KO position on reload, the faint flicker, Jodie's ladder art, the upkeep icon) are not raised again.

## How it was checked

- Read: AGENTS.md; the SIMS-5 section of `OFFICE_LIFE_SIMS_BUILD_PLAN.md` (5.5); the build log's SIMS-5 and "SIMS-5 live proof" sections; the scenario README; `scripts/validate_office_life.rb`; the code reviews R2 and R3.
- V10 wording: the validator run on the seven proof fixtures (`zz_v10_*`) from the SIMS-5 proof scratch folder, reading each warning as a mission author would.
- Live play, headless, keyless server on :3094 from the clean worktree `p-ol-sims5` (checked out at `bc561ae75` for the run, put back to `fd9842b83` after), physics `setFPS(20)` with fixed steps on, viewport 1200 by 800 at the game's own zoom:
  - Game 5019: the README office tour with player levers only, no needs forced (wait for the first coffee, open kitchen and lounge, drop the parcel and the mugs, Deadline Memo, Activity Board, office coffee socket, kitchen cooler chat, Kitchen Rota, cake in the kitchen, spare phone). Every `_pickBark` line and every heard event logged.
  - Game 5020: the staff-room run with the player at the boiler, 12 game minutes.
- Screenshots and dumps: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/s5-design/out/` (shortened below to `out/`). Scripts `tour.mjs`, `s3.mjs`, `lib.mjs` beside it. No page errors in either game.

## What the player saw (game 5019)

| Beat and lever | Seen at game zoom | Matches README |
|---|---|---|
| First coffee, no lever | Amara walks to the office station at 0:55 with the cup icon; Tom then uses it while Marek queues with the hourglass; "Chat in the coffee queue" ticks (`out/tour-01b-tom-coffee-5019.png`) | No: step 1 says Tom waits at his desk (m1 below) |
| Open kitchen and lounge | Both load; Rosa appears at her kettle | Yes |
| Drop the parcel | Amara fetches and opens it; the Activity Board later reads "Amara's parcel: opened. Tom: has eaten." (`out/tour-09-board-read-5019.png`) | Yes |
| Drop the mugs | `see_mugs` ticks | Yes |
| Deadline Memo | Amara takes the office station, Tom walks to the kitchen machine; the overlay shows `leashed` on Amara (`out/tour-08-memo-5019.png`) | Mostly (m4) |
| Activity Board | Sanjay and Rosa meet at the kitchen cooler; `exchange_rosa_rota` heard in full, task ticks (`out/tour-15-cooler-chat-5019.png`) | Yes |
| Office coffee socket | Switched off through the confirm dialog; nobody was walking to the machine at that moment, so no grumble | Not seen (m5) |
| Cake in the kitchen | Tom heads for it; "Watch the word get round" ticks (`out/tour-18b-cake-eaters-5019.png`) | Yes |
| Spare phone | Tom answers at his desk, his side of `call_supplier` is overheard, task ticks (`out/tour-19b-phone-call-5019.png`) | Yes |
| Kitchen Rota | Not judged: the harness failed to reach the note from the kitchen | n/a |

In 10 game minutes of the office tour the engine spent four pool lines (Tom `coffee`, Grace and Rosa `cooler`, Amara `news_cake`), one exchange and one call. Two of the four pool lines were the same line (M4).

## Severity

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 5 | M1 lever tour, M2 lever notes at game zoom, M3 staff-room earshot claim, M4 echoed pool line, M5 V10 reasons name the outcome, not the cause |
| Minor | 8 | m1 to m8 |

## Findings

### M1 (major). There is no tour of the levers; the README spreads them over twenty dated sections

`scenarios/test_needs_sims/README.md:152-1012`. The SIMS-5 aim includes a README tour of the office beats a player can cause with levers. No such section exists. The levers are the Deadline Memo, the Activity Board, the Kitchen Rota, the Coffee Notice, the Print Queue note, two copier sockets and the coffee socket, Tom's open screen, the cake, the spare phone and Neil's print request. Each is described inside a dated "Slice N re-run" section, mixed in with proof tables, game numbers and scratch paths. The spare phone has no "how to watch" text at all: section "Slice 19" (`README.md:756`) is only a results table, and the lever is named only in the objective's own text ("use the spare desk phone to ring his extension while he is at his desk", seen in `out/tour-19b-phone-call-5019.png`). A mission author wanting "which lever makes which beat" has to read about 850 lines of history.

Change: add one section near the top, "Office beats you can cause", one row per lever: the lever and where it sits, who reacts, what the player sees at game zoom, how long it takes, the task that ticks, and the lever's scenario id. Move the dated re-run sections under a "Proof history" heading below it.

### M2 (major). The four lever notes are identical scraps of paper on the office floor

`scenario.json.erb` objects `deadline_memo`, `kitchen_rota`, `coffee_notice`, `print_queue_note` (`notes1`, no position, auto-placed). At game zoom each is a 12 pixel paper square on the carpet, all four alike (`out/crop-notes-08.png`, from `out/tour-08-memo-5019.png`). The player can only tell them apart by hovering each one, and the memo's own text says it is "pinned up" (`scenario.json.erb:508`) while it lies on the floor. The README says "read the Deadline Memo" or "read the Kitchen Rota" with no place given. These notes are the main levers of the showcase, so a viewer cannot find them by looking.

Change: give each note a fixed place that fits its text (the memo pinned on a wall or a desk, the rota in the kitchen, the print queue note by the copier, the coffee notice by the station) and name the place in the M1 table. A mission copying the pattern should place its levers the same way.

### M3 (major). The staff-room "in earshot" result is in earshot of the boiler only

Build log `OFFICE_LIFE_SIMS_BUILD_LOG.md:478` (game 4985) reports 35 staff turns "in earshot" with 7 lines. All 7 lines were `staff_tea`; the 16 `staff_water` turns were all pictures. My rerun (game 5020, same seed, player at the boiler) gives the same split: tea lines at 0:18, 5:51, 5:55, 6:11; the 10:09 cooler break 8 pictures and 0 lines (`out/s3-in-5020.json`). The cooler sits in the room's far south-east corner, well beyond the 160 px earshot from the boiler (`out/s3-in-mid-5020.png`: boiler on the back wall, cooler bottom right behind the HUD bar). A player who settles in the staff room hears the tea pool and never the 12-line water pool.

On the rate itself (design question 3): judged on the tea breaks, it is right. Three or four lines per 30 s break, one about every 5 to 15 s, the rest as chat pictures, a break every four to eight minutes, and no line repeated in 20 minutes. That reads as two colleagues having a brew without becoming background noise, and 0 lines out of earshot is correct. The problem is that the reported 7 of 35 mixes in 16 turns nobody was near.

Change: reword the build log row as "player at the boiler (in earshot of the boiler, not the cooler)" and give the counts per object (tea 7 of 19, water 0 of 16 out of earshot). In the README, say that the cooler beat needs the player to walk to the cooler (step 5 already does this on the crossing) or stand mid-room. A mission copying a two-object break room should keep both objects within one earshot circle of a natural standing spot.

### M4 (major). Two NPCs at one cooler spoke the same line four seconds apart

Game 5019 (`out/tour-5019.json`): Grace at 8:28 "Friday drinks again?" (62 px, heard), then Rosa at 8:32 "Friday drinks again?" (30 px, heard). Both draw from the scenario `cooler` pool, and the shuffle bag is kept per NPC (`_bagNext(s.npcId, topic, ...)` in `_pickBark`, `npc-needs.js:2755-2762`), so nothing stops the partner drawing the line just said. In this run that was half of the office's pool chatter. The showcase recommends the scenario-level pool for office small talk (README: "Why the pair name their own topics"), so every mission that copies it gets this echo.

Change, either side: in the engine, skip a line the partner said in the same chat (or keep the bag per object or per pair for a scenario-level topic); or in the README, say plainly that a shared scenario pool can echo between partners, and that a pair who meet often should have their own lines, as Keith and Jodie do. The first fixes it for every mission; the second only warns.

### M5 (major). V10's commonest warning names the outcome, not the cause

`scripts/validate_office_life.rb`, `check_pools` and `topic_triggerable?` (at `bc561ae75`: lines 547, 556, 600). Four different faults give the same sentence. The avoider, private object, lone NPC and no-queue fixtures all read: "NPC 'a' chatter pool 'cooler' is voiced but nothing can trigger it (no compatible pair of NPCs can share an object with this chatter)". The author is not told which object V10 tried, which partner, or which rule failed (avoids, `private`/`owner`, leash, the need the object satisfies, capacity, queue). That is exactly what they must change. The fix text `POOL_FIX` ("give it a partner or trigger, or remove the lines") is the same for every topic, and "trigger" means nothing concrete for a `grumble` or `phone_message` pool.

Change: for chatter-object topics, name each candidate object and the first rule that stopped each partner, for example "'cool1' (cooler): 'b' avoids 'a'; 'c' has no need it satisfies". Give a fix line per topic family: for a chatter object, a second NPC with a need it satisfies, or capacity 2, or a queue; for `grumble`, `needsCompany.avoids` plus an `avoidRadius` above 0, or remove; for phones, an owned `deskPhone` and something that emits `desk_phone_ring:<id>`. The grumble and phone reasons already come close to this; the chatter one, the one authors will meet most, does not.

### m1 (minor). The first "How to watch it" step is out of date

`README.md:34` says Tom "waits at his desk until Amara finishes". Since slice 10 the station has a queue and Marek joins it: game 5019 shows Tom pouring with Marek queued behind (`out/tour-01b-tom-coffee-5019.png`) and "Chat in the coffee queue" ticking. Rewrite step 1 to the queue.

### m2 (minor). "Voiced" in the warnings

V10 says a pool "is voiced but nothing can trigger it". A new mission has no audio yet, and "voiced" reads as "has TTS files". Say "has N lines" and keep the cost point for the README.

### m3 (minor). V10 repeats warnings another check already gives

On `zz_v10_no_phone_calls`, `validate_npc_needs.rb:213` ("has phoneCalls but owns no desk phone and does not answer others'") and V10's phoneCalls warning say the same thing. On `zz_v10_noqueue_coffee` one missing queue gives three warnings: the capacity check (`validate_npc_needs.rb:916`), V10's pool warning and V10's exchange warning. Either skip the V10 warning when the earlier one has fired, or end it with "see the capacity warning above", so an author fixes one thing, not three.

### m4 (minor). README step 8 says only the walker shows `leashed`

`README.md:41`. In game 5019 Amara, who stayed at the office station, also showed `leashed` (her pick skipped the lounge kettle; `out/tour-08-memo-5019.png`). Say that either NPC whose nearer pick was refused shows it.

### m5 (minor). The socket lever needs a walker at that moment, and the README does not set one up

README "Slice 18a" (`README.md:630`) says to click the socket "while someone is on the way to the machine". In game 5019 the socket was switched off 25 s after the Activity Board was read, nobody was walking by then, and the beat did not happen. In the M1 table, pair it: read the Activity Board (or the Deadline Memo), then switch the socket off within a few seconds, while Amara or Tom is walking over.

### m6 (minor). The lever texts describe the mechanics

`scenario.json.erb:497, 518, 528`: "Reading it releases a job Tom sent and then forgot about", "Reading it reminds Marek that he is parched; as he heads for the cooler, Sanjay decides he fancies a chat too", "Reading it sends Marek to the office machine". Fine for a demo, but these are the texts an author copies. Add one line to the README: in a mission the note's text is in-world, and the lever's effect is told by the briefing or a hint, not the observation.

### m7 (minor). An announce line was spent out of earshot

Game 5019: Amara's `news_cake` line "Cake! It's somebody's birthday." at 465 px from the player (8:40). E7 holds chatter-object lines until someone hears them; the announce path (`_tickNews`, `_pickBark` with `ignoreCooldown`) does not. With voiced announce pools in a mission, these lines are paid for and unheard. Note it for the owner beside E7; V10 needs no change.

### m8 (minor). Three markers stack over one head at the cooler

`out/crop-15.png` (from `out/tour-15-cooler-chat-5019.png`): over Rosa, the chat picture, a speech bubble frame and her rest `zZ` icon overlap, and the bubble is hidden behind the icon. At game zoom it reads as clutter. Hide the need icon while a speech bubble shows, as the action icon already hides for the speaker (slice 8 notes).

## Design questions

1. **README tour against play.** The beats it describes work and are visible at game zoom: the action icons, hourglass, phone call, word of mouth and the Activity Board text all read well. The tour itself is missing as a section (M1); its levers are hard to find on screen (M2); step 1 and step 8 need small corrections (m1, m4); the socket needs a set-up (m5).
2. **V10 wording.** The grumble, phone and exchange warnings tell an author what is missing. The chatter-pool warning, the one authors will see most, does not say which rule failed (M5); "voiced" and the duplicates add noise (m2, m3).
3. **Staff-room rate.** Right for the tea breaks; the cooler breaks are never heard from the reported spot, so the 7 of 35 figure is misleading (M3).
4. **Copy risks.** The shared-pool echo (M4), floor-scattered levers (M2), mechanic-describing lever texts (m6), a two-object break room with only one object in earshot (M3), and unheard announce lines (m7).

## Verdict

No blocker. V10's rules hold and the office beats play live with their levers. Before missions copy the showcase, fix the five majors: write the lever tour (M1), place and name the lever notes (M2), correct the staff-room earshot claim and say where to stand (M3), stop or document the echoed pool line (M4), and make the chatter-pool warning name its cause (M5). The minors can go with them in one pass.

### V10 outcomes

- **M5, fixed** (`scripts/validate_office_life.rb`, `chatter_reason`, `object_blocks`, `pair_block`, `use_block`). A chatter-object warning now names each object and the first rule that stopped each partner there, and each rule brings its own fix naming the NPC or object: the lone NPC ("at 'c1': 'a' is the only NPC the needs engine runs. To fix: add a second NPC with a need 'c1' meets"), the avoider ("'b' avoids 'a'. To fix: drop 'a' from the needsCompany.avoids of 'b'"), the private object, the room leash, no matching need, no shared group, both partners at maxQueue 0, and a one-seat object with no queue. Up to three objects and three partners are named, then "and N more". `POOL_FIX` is gone: every topic family has its own fix (grumble: `needsCompany.avoids` with an `avoidRadius` above 0 or unset; grumble_off, grumble_gone and grumble_printer_off their own; phone: an owned `deskPhone` and the exact `desk_phone_ring:<id>` to emit; phone_message: `answersPhones` in the phone's room; an unknown topic: rename it). The phone reasons now say which rule failed (not run, owns no deskPhone, nothing rings the phone, no answersPhones). The exchange warning uses the same per-object reasons. `can_use?` is now `use_block(...).nil?`, so the reasons cannot drift from the rule.
- **m2, fixed.** "is voiced but" is now "has N lines but ... will never speak them" ("1 line ... it").
- **m3, fixed by pointing.** The pool and exchange reasons for a one-seat object end "as the capacity warning above says" when `validate_npc_needs.rb` gives that warning for the object (same test as its `check_social`), and the phoneCalls warning adds "(the phoneCalls warning above has the same cause)" when the needs check's owns-no-phone warning fires. V10 still warns, so a change to the other check cannot hide it.
- Tests: `test/js/validator-office-life-v10.test.mjs` 34 and 35 pin each new reason and fix. The corpus (180 scenarios) still gives 0 V10 warnings.

### Outcomes (M1 to M4 and the minors)

Fix round 2026-11-15, commits `7dbe11e50` (M4 engine, M2 scenario), `962050a9b` (m8), `0100477ce` (m7), then the docs commit (README, proof history, build log, this section). Live proof on keyless :3093 from the scratch worktree `p-ol-sims5`, games 5044, 5045, 5046 and 5049; details in the build log section "SIMS-5 design R2 fixes".

- **M1, fixed.** The README opens with "Office beats you can cause": fifteen rows, each with the beat, its lever and where it is, where to stand, what you see and hear, and the tasks it ticks. The spare phone has its row (12). The dated sections moved whole to `scenarios/test_needs_sims/PROOF_HISTORY.md`, and the README ends with a one-line-per-section results appendix.
- **M2, fixed with existing art.** Deadline Memo: `notice_board1` on the office's back wall, right of the Activity Board. Print Queue: `aes_clipboard1` on the back wall just left of the copier. Coffee Notice: `notes6`, taped on the east wall above the coffee station's socket. Kitchen Rota: `rota_board1`, moved into the kitchen, on its back wall right of the bookcases. All read in place (`readDisplay: gameDisplay`); each opened alone with no pick-one menu and each mapping fired (game 5044). No art needed. The copiers, the coffee machine and their sockets were not moved.
- **M3, fixed by stating the figure per spot; the cooler stays.** Mid-room, by the table between the boiler and the cooler, the player is within earshot of both (game 5046, 13 minutes: boiler 4 lines of 11 turns and cooler 2 of 7, all at 61 to 76 px, against 7 of 19 and 0 of 16 from the boiler spot). The README's staff-room section and the tour say to stand there, and the build log row now gives the per-object counts for the boiler spot. Why not move the cooler: the room is m02's drawn map, and a break room with its tea point and water cooler on different walls is what a real one looks like; the player finds the conversation by walking to the middle of the room, which is what a person would do. A mission copying a two-object break room should check one natural standing spot is within 160 px of both use cells, as the README now says.
- **M4, fixed in the engine.** `_pickBark` passes over a line that anyone said within `ECHO_WINDOW_MS` (2 minutes) and `ECHO_RADIUS` (320 px) in the same room, while the speaker's bag has another line; the passed-over line keeps its place in the bag. In memory only (`_recentLines`, at most 32, cleared on reset), nothing in `player_state`. Node tests in `npc-voiced-chatter.test.mjs` (five new). Live, game 5045: six cooler meetings, 14 lines, 4 passed over (the first was exactly the reviewed echo: Grace passed over "Friday drinks again?" four seconds after Rosa said it), no line repeated within two minutes.
- **M5, passed on to the V10 fixer** (see "V10 outcomes" above).
- **m1, fixed.** Step 1 now describes the queue: Tom joins it, Marek queues behind him, the queue chat ticks.
- **m2 and m3, passed on to the V10 fixer.**
- **m4, fixed.** Step 8 and tour row 2 say the `leashed` label shows on whichever NPC had a nearer pick refused, often both.
- **m5, fixed.** Tour row 6 pairs the socket with a walker: read the Deadline Memo or the Activity Board, then switch the socket off within a few seconds.
- **m6, fixed.** A paragraph under the tour: in a mission the lever's text is in-world only, the beat is told by the briefing or a hint, and the lever sits where its text says.
- **m7, fixed in the engine rather than only noted.** `_tickNews` now passes `unheard` to `_pickBark` when the player is out of the announce pool's earshot: the telling still happens, as a news picture, and no line is taken or voiced. Node test in `npc-news.test.mjs`; the news fixture now stands the player in earshot by default.
- **m8, fixed.** A speech bubble showing over an NPC hides its action icon and thought bubble in the same frame (`speechCovers`, `NpcActionIcons.hideFor`, `NpcWorldBubbles.showsBubble`); the cause was the bubble pass running after the icon layer's update. Node test in `npc-action-icons.test.mjs`. Game 5045's cooler frame shows a bubble with no icon under it.
