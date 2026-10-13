# m06 Follow the Money: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 and m04 reached in pass 5 (`scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md` is the worked example). Shared agent brief: `docs/agents/M06_PASS_BRIEF.md`. Items for the user: `DECISIONS_PENDING.md`.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review → fix loops), dialogue, room dressing, lighting, POV backgrounds, characters (parked for the user), playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Phase 1 alignment, round 1

Review: `ALIGNMENT_REVIEW_P5_R1.md` (Opus, read-only, static). The file is partial: a safety check stopped the reviewer partway through, and the orchestrator finished it from the hand-back. Before acting, the fixer checked each finding against `scenario.json.erb` and the ink. The fixer was also stopped once by a safety check while reading engine source. It resumed on the orchestrator's instruction and worked from m03's and m04's scenario configs only.

Counts: 0 blockers, 7 majors, 13 minors listed (the review said "about 15"). Outcomes: 7 majors fixed (A6 reworded); 9 minors fixed; 3 minors deferred to later stages; 1 found while fixing, left for a browser check.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| A1 | major | The debrief opened the moment the last decision or flag landed, so a player who confronted Satoshi last lost his safe and the Tesseract file | **Fixed** with m04's sweep-then-call-in. The 13 old debrief triggers moved to HaX; the first to see both decisions and all four flags sets the new `ready_to_extract`, unlocks a new optional, locked task `call_in_after_sweep` and texts "That's both calls made… call me and I'll bring you in." (plus "His safe's still shut, if that matters to you." while `architect_identity_found` is false). HaX's hub gains "I'm done here. Bring me in." → `extract_offer` (names the shut safe) → "Bring me in." → "On my way." → `extract_go`, which completes the task and sets `start_debrief_cutscene`. The debrief opens on that global, and a per-room reload backstop re-emits it if the page reloads before the debrief's first line (`debrief_played`). The existing hear-the-debrief backstop is kept. The concludeRequires gate still holds, because the call-in is only offered once all four flags are in |
| A2 | major | Music forgot the story phase; no `restored` guard; debrief on spy-action; no named credits track | **Fixed** (m03/m04 pattern). Phase conditions `music_day` (fund not found), `music_climax` (fund found, money not settled) and `music_after` (money settled), each with a `game_loaded` and an `all_hostiles_ko` twin. New `assets_decided` → `end` cue; the debrief cue now plays `end`. The hostile cue carries the `restored` guard and is silent once the money is settled. The fund cue doesn't fire after the money is settled. The credits play "Digital Leashes", which no other mission uses |
| A3 | major | The cover was set up as a risk and never paid off | **Fixed** (orchestrator: a visible consequence of moderate weight). New synced `cover_strained`, set by `guard_caught`, by a KO of the guard, Dani, Priya or Irina (`npc_ko:` mappings), or by Irina's first conversation closing with her still suspicious (`irina_suspicious` is now a synced global, set and cleared in her ink with `#set_variable`). Consequences: (1) HaX texts once, "Someone on that floor is going to ring the FCA. Get what you need before they do." (skipped once the money is settled), and the recap repeats it; (2) Irina lends her badge only at trust ≥ 35, not 25, with her own line explaining why, and the cloner route is unchanged; (3) Satoshi's opener branches ("Somebody on my floor rang the FCA an hour ago…" / "Your paperwork was good. I had you checked anyway."); (4) the minder won't take the FCA line (A5); (5) a debrief line and the credits "FCA COVER: held all night" / "strained". Nothing locks the player out and no ending is a failure |
| A4 | major | The choices and the reveal landed in silence; a detained Irina waited for police who never came | **Fixed.** New HaX texts: turned ("She's turned. Whatever she gives you tonight, write it down twice."), detained ("Police are on their way up for her…"), freeze, watch, the safe opened ("Tesseract. ...Bring that page out with you…"), each staff KO, and the minder KO. A detained Irina is collected: on the player's next room entry away from the trading floor, HaX's mapping sets `irina_taken`, and her own mappings hide her (`setVisible`, re-hidden on reload, as m04 does for Cipher). HaX's relayed wordlist, office badge and executive badge are now offered for `irina_ko or irina_taken`, so nothing she held is lost. Her resting narration and the debrief say the police came ("…collected her from her desk while you were still working the building" / "…after you'd gone") |
| A5 | major | No antagonist in the building, no sight challenge | **Fixed** (D1, built on a stand-in). Kemal Aydin (`satoshi_minder`), Satoshi's minder in the executive wing: `los.challengeOnSight` → `on_sighted`, the m04 guard and Cipher shape; skipped once he has let the player in, turned hostile or been knocked out, or once Satoshi has been confronted. While the cover holds, the FCA line talks him round. With `cover_strained`, only a turned Irina's word does ("Dr Volkova sent me up."); otherwise he asks who the player really is, and they can square up (he turns hostile) or back off. He walks a short beat (dwelling 4.5 s at (8,4) under the north door, facing east, and 3.5 s at (4,4) facing the west door), so slipping past while his back is turned always works. Satoshi reacts to him ("Kemal let you in…" / "I heard Kemal hit the floor."); the debrief and credits do too. New ink `m06_npc_minder.ink` |
| A6 | major | Reworded (orchestrator): flag 1 already reacts through its task mapping; flag 2 has no story reaction, and the flag 1/2 `emit_event` rewards had no listener | **Fixed.** Flag 2 gets a HaX text ("Second account. One password, two boxes, just as their own rack sheet admitted…", skipped after flag 3). Flag 1's text was trimmed to story terms and under the 30-word cap. The two `emit_event` rewards are now `set_global` rewards for `flag1_submitted` / `flag2_submitted` (m04 m8), so the drop-site no longer says "Event triggered". The debrief gives each flag a story beat. VM wording goes to `DECISIONS_PENDING.md` D4 for a SecGen check |
| A7 | major | Canon: "You're under arrest" and "with him arrested" | **Fixed.** Satoshi's opening choice is "I'm detaining you. Laundering and terrorist financing."; HaX: "Watching still works with him detained… we keep it quiet until it's gone." Irina's credit is "Detained — collected by the police…"; the endGoal says "detained and handed over". Police lines that describe the police themselves ("the arresting officer") are kept: the police arrest, SAFETYNET hands over |
| m1 | minor | A voiced line printed `{player_name}` (phone first call) | **Fixed.** "You're inside. How's the FCA cover holding?" No m06 voiced line prints a variable now (grepped) |
| m2 | minor | HaX's phone avatar was `npc_helper.png` | **Fixed.** `assets/characters/agent_hax_headshot.png` |
| m3 | minor | "The cells not yet paid go without" contradicts the fund document (all six had advances) | **Fixed.** Credits: "The balances never reach the cells."; Satoshi's narration: "The balances will never reach the cells."; HaX's recommendation: "the balances never reach the cells" |
| m4 | minor | Irina's KO credit "the offer was never made" can be false | **Fixed.** "Knocked down on the trading floor before her part was settled" |
| m5 | minor | The debrief said nothing about the staff KOs the credits list | **Fixed.** New `cover_and_staff` knot: one line each for Dani, Priya and the guard, then "None of them had done anything wrong. That goes in the report." The minder KO has its own line |
| m6 | minor | The guard says "Afternoon" in a night mission | **Fixed.** "Evening." (The briefing gives no time of day; the debrief is at 4 a.m.) |
| m7 | minor | The guard sends the player to an unstaffed reception | **Fixed.** "Go back out to the lobby and come in properly." / "Lobby's that way." The lobby's `room_entered` mapping is what clears his grace, so the wording now matches the mechanism |
| m8 | minor | `mission.json` "compliance auditor" vs the game's "FCA supervisor" | **Fixed.** `mission.json` description and keyword now say "visiting FCA supervisor" / "FCA supervisor cover"; the first aim's description says "visiting FCA supervisor" (was "FCA supervision officer"). The scenario brief and briefing already said FCA supervisor / supervisory visit |
| m9 | minor | Five separate guide options, no lockpicking guide | **Fixed.** One "Send me a field guide." choice, shown while any met guide is unsent, opening a menu of only those. New lockpicking guide (`m06_lockpicking_field_guide`, the published lockpicking sheet), offered on entering the checkpoint |
| m10 | minor | "How do I play Volkova?" retired after one use | **Fixed.** Stays on offer until her part is settled or she is knocked out (`irina_guidance_given` removed) |
| m11 | minor | The executive wing is reached through the data centre; two server rooms back to back | **Deferred** to room dressing, which owns layout |
| m12 | minor | The fingerprint kit is carried but never used | **Deferred** to puzzle chains |
| m13 | minor | The debrief covers the VM work in one generic line | **Fixed** with A6 (three lines, one beat per flag) |
| F1 | found | Irina's badge hand-over tag is `#give_item:keycard:cto_access_badge`, but the held item's id is `m06_cto_badge` (its `opens_lock` is `cto_access_badge`), and the pickup mapping checks `m06_cto_badge` | **Not changed; browser check.** This predates the pass. If the give resolves the item by `opens_lock` the hand-over works; if not, the lend route fails silently and `irina_badge_obtained` never sets (the cloner route and HaX's relay still work). Engine source wasn't read. Check it in the round-2 browser run |

Regression items folded in from `PASS5_REGRESSION_A.md` (Sonnet, game 2223; 0 blockers, 0 majors, 12 minors). The orchestrator passed on M4–M6 and kept the rest out of this round:

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R-M4 | minor | HaX's recap repeats the server-room door lines after the door is open, until flag 1 | **Fixed.** New synced `server_room_entered`, set by HaX's existing `room_entered:server_room` mapping; the recap's door lines now need `not server_room_entered`. Route r1 checks both sides |
| R-M5 | minor | "Police on their way up", "handed to the police" | **Withdrawn after checking; no change** (orchestrator ruling). SAFETYNET detains and hands over, as in m04; the police are who it hands over to. The one place SAFETYNET arrested someone (A7) is fixed |
| R-M6 | minor | The walkthrough says the custody console gives three tries per opening; the run saw five wrong tries with no lockout | **Doc fixed.** The console sets no `maxAttempts` (the field other scenarios use for a limit), and an unlimited PIN fits "fun, not hard" and the deduction puzzle: a wrong slot is refused and says nothing. `TESTING_WALKTHROUGH.md` 17a and the erb comment now say there's no attempt limit. Engine source wasn't read to confirm what a default would be |
| R-M1, R-M3 | minor | Art | **Deferred** to the character stage (orchestrator) |
| R-M2 | minor | Backgrounds | **Deferred** to the POV stage (orchestrator) |
| R-E1–E4 | minor | Engine | **Deferred**: engine issues, already in the backlog (orchestrator) |

Canon checks from the review (m05 → m06 → m07) needed no change. The freeze/watch choice carrying into m07 stays as D2.

### Decisions taken (with reasons)

- **A1: m04's sweep-then-call-in** (orchestrator). The safe and the Tesseract reveal stay reachable whatever order the player takes. The call-in text is sent 13.5 s after the trigger so it can't stack with HaX's other texts on the same events (the validator's 4 s toast rule; the lab text on Irina's close fires at 9 s).
- **A2: phase-aware music with a named credits track** (orchestrator). "Digital Leashes" was the unused vocal track that fitted a money-trail ending. "Cipher Tide" stays free.
- **A3: what strains the cover** (orchestrator: the player's own actions). These count: being caught at the guard's lock, knocking out any member of staff (guard, Dani, Priya, Irina), and leaving Irina's first conversation still suspicious. Not counted: wrong answers to the guard ("IT", "consultant", "the CEO"). He turns those away, but they're honest mistakes and cost the walk already. Knocking out the minder or Satoshi doesn't count either: by then the player is past the cover.
- **A3 weight:** moderate. It makes Irina's badge loan and the minder harder, and it changes Satoshi's opener, one debrief beat and one credit. There's no fail state and no lost route.
- **A4: Irina is collected on the next room entry, not at once.** Hiding her mid-conversation would pull her out from under the player. Once the player has left the floor, the police can plausibly have come and gone. The trading floor is excluded so a reload on the floor doesn't hide her in view.
- **A5: the minder's talk-past needs a turned Irina when the cover is strained,** not some other item, because the turned Irina already exists as the "insider vouches" thread. The fight and the slip-past stay open on every route. He stops challenging once Satoshi has been confronted, so the sweep isn't interrupted.
- **A5: his voice and look.** Kemal Aydin is Turkish-German, late fifties, with a German (Hamburg) accent and the voice Iapetus. He fills the cast's missing age band and adds an origin no one else has (`DECISIONS_PENDING.md` C1). His stand-in sprite is `male_hacker_hood_down_v2`, the Crypto Anarchists' look, hood down so he isn't mistaken for Satoshi.
- **A5: his beat.** `check_door_alignment.py` puts the wing's north door at tile x 8.5. A dwell at (7,4) would have left the door about 63° off his facing, on the cone's edge. At (8,4) the door is about 80° off (outside the 120° cone) and the corridor is behind him. This comes from geometry, not from a browser run.
- **m9: one guide choice** (m04 A5). Six guide choices would crowd the hub late in the mission.

### Checks (static; no browser session was started)

- Ink compiles (9 files, including the new `m06_npc_minder.ink`).
- Validator, full: ERB, JSON, schema, ink, geometry and door alignment all pass. Dialogue lint inside the validator is clean once flag 1's text was cut to under 30 words.
  - 19 warnings. 16 are duplicate-pattern notes on `agent_0x99_handler`. The extra 4 come from the new per-room loops (the `irina_taken` and call-in mappings share the `room_entered` patterns with older backstops). Their conditions use different globals, and firing together is harmless.
  - 2 are the repeatable sight-challenge and lockpick-catch chats, as m04's are.
  - 1 is the pre-existing two-sources-for-the-server-room note.
  - The 4 new toast-stacking warnings were cleared by the 13.5 s delay, and the ink-VAR warning by a "Synced scenario global" comment.
- `dialoguelint`: no findings.
- `reopencheck` (the m06 block of `missions.json` gained the 10 new globals and the minder; rerun after R-M4): m06 HaX phone, 1800 reopens, 0 problems.
- `tagdiff` against HEAD. Every difference comes from the changes above:
  - phone: 81 (the call-in knots, the guide menu, the relays on `irina_taken`, the sticky Volkova guidance, the recap conditions);
  - debrief: 20 (the `cover_and_staff` knot, the minder and Irina-collected conditions);
  - Irina: 8 (`#set_variable:irina_suspicious`, the badge threshold);
  - Satoshi: 7 (the cover and minder openers);
  - guard: structure unchanged.
- `inkcheck` over a state matrix found no errors and no runaways: minder fresh, strained, strained with Irina turned, on_sighted both ways, passed; phone start early, ready to extract, Irina collected with the cover strained; Satoshi strained with the minder knocked out, and with the minder passed; Irina strained, and detained; debrief strained with every KO and Irina collected, and held with Irina turned and the safe opened; guard.
- `loopcheck` (phone hub, minder both ways, Irina hub strained, the FCA letter): no runtime errors.
- `python3 scripts/check_door_alignment.py`: all doors OK.
- New route driver `scripts/ink_runtime_check/m06_routes/route.js`, adapted from m04's. It drops the clock model, because m06 has no timers. It adds `room` and `ko` steps and m06's engine reactions: pickups, `cover_strained`, `ready_to_extract`, `irina_taken`, and the debrief opening. Six routes, all expectations met:
  - `r1_cover_held_recruit_freeze_callin`: cover held, Irina turned, the minder talked past on the FCA line, freeze. The first call-in is declined (names the shut safe); the safe is opened in the sweep; then a page reload, "Bring me in", the re-emit backstop and the debrief (cover held, minder let you in, Tesseract). Credits: FCA COVER held, Kemal talked past.
  - `r2_strained_detain_minder_fought_watch`: guard catch → strained; HaX's recap warns; Irina won't lend her badge at trust 30. She is detained after the fund, collected on the next room entry, and HaX relays her executive badge. The minder: "rang the FCA an hour ago", squared up, hostile, knocked out. Satoshi: strained opener, "heard Kemal hit the floor"; watch. Debrief: collected while you were still working, minder in custody, cover didn't last, safe left shut.
  - `r3_suspicious_opener_irina_vouches`: the unrepaired bad opener strains the cover on her first close. She is turned through her notes; her word gets the player past the minder; his re-entry after a page reload greets the player as let through. The safe is left shut and the call-in says so.
  - `r4_kos_satoshi_fought_reload`: Irina, Dani and Priya knocked out (strained, relays). HaX's recap warns about the minder. The minder is never seen. Satoshi fights on an unbacked "I'm detaining you", is knocked out, and the money is decided by phone. A reload between "Bring me in" and the debrief: re-emit. Debrief: the staff lines, "still out cold". Credits: "Never saw you come up the corridor".
  - `r5_repaired_opener_detain_last`: the bad opener repaired in the same chat, so the cover holds. The minder is backed off, then talked past. Satoshi first, then Irina detained last on the floor (no `irina_taken`), so the debrief says "after you'd gone".
  - `r6_guard_ko_irina_ko_after_recruit`: guard knocked out → strained; Irina turned then knocked out, so she can't vouch, and the minder offers no talk-past (back off). Debrief: the guard line; credits: CHECKPOINT GUARD knocked out.

Not yet checked in a browser: the minder's cone and beat (facing at each dwell, range to the west door, the slip-past window); `#hostile:satoshi_minder` from his chat; Irina's hide on `irina_taken` and its reload re-hide; the phone → debrief handoff after "Bring me in" (the same shape as m04's and m03's, both browser-tested); the music phases; the `set_global` flag rewards; F1.

### Spoken lines changed (old → new)

No m06 audio exists on 3.8 yet as far as this pass knows, so this is the record for re-voicing. Player choices are not voiced and are not listed.

HaX, phone (`m06_phone_agent_0x99.ink`):
- "{player_name}. You're inside. How's the FCA cover holding?" → "You're inside. How's the FCA cover holding?"
- "If you freeze it, the cells still waiting go short, and ENTROPY knows its bank is burned." → "If you freeze it, the balances never reach the cells, and ENTROPY knows its bank is burned."
- "Watching still works with him arrested. The payout's pre-signed; we keep the arrest quiet until it's gone." → "Watching still works with him detained. The payout's pre-signed; we keep it quiet until it's gone."
- "That's everything. Walk out of there and I'll bring you in." → "That's everything. Look round if you want, then tell me to bring you in."
- New lines:
  - recap: "Someone on that floor has a reason to ring the FCA about you now. Don't hang about."; "The spare executive badge was signed out to Volkova, and the police have her now. Ask me for a copy."; "He keeps a minder on that corridor."; "With your cover strained, he won't take the FCA line. Wait for his back, or bring Volkova's word if she's with us."
  - call-in: "Once you're out, you don't go back in. Whatever you haven't read stays for forensics."; "His safe's still shut, for one."; "Car's round the back of the building. Two minutes."; "Take your time. The police can wait a few minutes."; "See you at HQ."
  - guides: "Which one?"; "Lockpicking guide sent."; "The checkpoint door's a cheap lock. The guard's the hard part. Pick while his back's turned."

HaX texts (`scenario.json.erb`):
- Flag 1: "First account's yours. That password was almost certainly reused. Try it everywhere before anything clever. I've a credential reuse guide if you want it." → "First account's yours. People here reuse passwords, so that one opens more than one door. I've a credential reuse guide if you want it."
- New texts:
  - flag 2: "Second account. One password, two boxes, just as their own rack sheet admitted. Next is the financial database. Its account runs their doors."
  - cover: "Someone on that floor is going to ring the FCA. Get what you need before they do."
  - KOs: "The guard was doing his job. That goes in the report, and so does the noise."; "Okonkwo had done nothing. That goes in the report."; "Raghavan drew us the money and had done nothing else. That goes in the report."; "His minder's down. If Satoshi didn't hear that, he's the only one on the floor who didn't."
  - Irina: "She's turned. Whatever she gives you tonight, write it down twice."; "Police are on their way up for her. Leave her where she is; they'll have her out before you're back on the floor."
  - the money: "Transfer's confirmed. The balances are in a wallet we hold. ENTROPY will notice by morning."; "Tags are on. When that release fires, every address it pays lights up on my screen."
  - the safe: "Tesseract. ...Bring that page out with you. Don't read it to anyone else."
  - the call-in: "That's both calls made, and the backend's done. Look round if you want, then call me and I'll bring you in." (and the same plus "His safe's still shut, if that matters to you.")
- Changed behaviour, same words: "That's the money settled. Volkova is still on the trading floor…" now has `skipIfGlobal: irina_fate_decided`.

Satoshi (`m06_satoshi_confrontation.ink`):
- "You're not from the FCA. I had you investigated." → "Somebody on my floor rang the FCA an hour ago. They've never heard of you." (cover strained) / "Your paperwork was good. I had you checked anyway. Old habit." (cover held)
- New: "And I heard Kemal hit the floor. He's guarded money for thirty years. He'll be embarrassed."; "Kemal let you in, so you must have been convincing."
- Narration: "On your phone, the transfer clears. The cells still waiting get nothing." → "On your phone, the transfer clears. The balances will never reach the cells."

Irina (`m06_npc_irina_volkova.ink`):
- New: "Someone on the floor has been asking whether you are who you say you are. Until they stop, my badge stays on my neck."
- Narration: "She sits very still at her desk, waiting for the police, and doesn't look up." → "She sits very still at her desk and doesn't look up. The police are on their way up for her, and she knows it."

Checkpoint guard (`m06_npc_checkpoint_guard.ink`):
- "Afternoon. Floor's restricted. Who are you?" → "Evening. Floor's restricted. Who are you?"
- "Still here. Still not on my list. Try reception." → "Still here. Still not on my list. Lobby's that way."
- "…Go back out to reception and sign in properly." → "…Go back out to the lobby and come in properly."

Debrief (`m06_closing_debrief.ink`):
- "All four flags in. One exposed service to the vault account, one reused password at a time." → "All four flags in." / "One cracked password got you onto their backend, and the same password opened a second account." / "The financial database gave us their doors, and the vault account gave us the keys to every cold wallet they hold."
- "The one thing we didn't get is whatever Satoshi kept in his safe." → "You left Satoshi's safe shut. Whatever he kept in it, the police will open on their schedule, not ours."
- "A man like that keeps insurance. I'd have liked to read it." → "A man like that keeps insurance. I'd have liked to read it first."
- New lines:
  - Irina collected: "The police collected her from her desk while you were still working the building." / "…after you'd gone."
  - the minder: "His minder's in custody too. Thirty years guarding banks, and he finishes the night on a corridor floor."; "His minder let you walk in. I'd like to hear what you said to him."
  - the cover: "Your cover didn't last the night. Somebody on that floor rang the FCA, and the FCA had never heard of you."; "It didn't cost us the job. It might cost us the next one. The FCA will want a word with us."; "And the cover held. Nobody on that floor ever thought to ring the FCA."
  - the staff: "Okonkwo flagged those wallets before we ever did, and got knocked down for it."; "Raghavan drew us the money, and got knocked down for it."; "The guard on the checkpoint was a contractor doing his job."; "None of them had done anything wrong. That goes in the report."

Kemal Aydin (`m06_npc_minder.ink`): all new (16 lines).

### Open after round 1

- The browser checks listed under Checks, for the round-2 playtest (F1 among them).
- The debrief's longest unbroken run is now 13–16 lines (the cover, staff and flag beats after Satoshi's aftermath). Left for the dialogue phase, which can add a choice or trim.
- m11 (layout) goes to room dressing and m12 (the fingerprint kit) to puzzle chains.
- D2 (m07 carry-over), D3/D4 (SecGen checks of the in-game VM wording) and C1 (Kemal's look) are with the user.

### Phase 1 alignment, round 2

Review: `ALIGNMENT_REVIEW_P5_R2.md` (Opus, read-only, static). It confirms every round-1 finding as fixed (A3 with fairness gaps, A5 needing a browser check) and withdraws F1 after reading the give-item code. A browser check of round 1 was running at the same time; this round did not wait for it. The fixer checked each finding against the files before acting.

Counts: 0 blockers, 3 majors, 12 minors. Outcomes: 3 majors fixed; 11 minors fixed (one, R2-m2, with a changed condition); F1 withdrawn and tidied; 2 user-style decisions taken by the orchestrator.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R2-M1 | major | The debrief opened with "That's enough. Come in." and a second [On my way.] after the phone call-in had already sent the car | **Fixed** (orchestrator: m04's shape). The debrief sets `debrief_played` and goes straight to the HQ narration (`debrief_location`). Two spoken lines and one choice removed |
| R2-M2 | major | The guard catch strains the cover for good, but nothing at the catch says so, and HaX's single text blamed "that floor" | **Fixed** (orchestrator, R2-D1 (a): permanent, made readable). The guard's catch now ends "And I'll be ringing whoever you say sent you." The one generic strain text is replaced by one text per cause, sent only by whichever cause strains the cover first (its condition is read before its own setGlobal). Guard catch: "The guard saw your picks. He'll ring the FCA to check on you, and they've never heard of you." Guard KO: "Somebody will find him and ring whoever sent you…". Dani, Priya or Irina KO: "Someone on that floor is going to ring the FCA…". Irina's opener: "Volkova didn't buy you. If she asks around…" |
| R2-M3 | major | The minder gated nothing: Satoshi's office was unlocked, so a refused player could walk in during the cooldown | **Fixed** (orchestrator, R2-D2 (a)). `satoshi_office` is now key-locked (`ceo_office_key`, easy, the m01 key-lock pattern). Kemal holds the key in `itemsHeld`, so a KO drops it. He is `unlockable` for the room, and both talk-pasts (the FCA line, or a turned Irina's word) give `#unlock_door:satoshi_office`, re-issued on re-entry until Satoshi is confronted (the guard's fire-and-forget pattern). Slipping past now means picking the door in his blind window. He has a `lockpick_used_in_view` mapping like the guard's, which is skipped while he is hostile or down. A pick he sees opens `on_lockpick_seen`: "No." leads into the stand-off, where the player can square up, back off, or use Irina's word. Every route stays open: talk, pick, or fight. The browser check the review asked for (walk in during the cooldown) is now moot: the door is locked whatever the cooldown does |
| R2-m1 | minor | Strain texts stacked with the other texts on the same event | **Fixed** with R2-M2. The guard catch text is at 3 s (after his chat closes). KO texts stay at 2.5 s and the strain text moves to 7 s. Irina's strain text is at 17.5 s: her close already sends texts at 4 s and 9 s, and the validator flagged 13 s against the 13.5 s call-in text. No toast-stacking warnings remain |
| R2-m2 | minor | Irina blamed "someone on the floor" for a strain her own suspicion caused; Kemal's line repeated Satoshi's; "trading floor" was wrong when the guard was the cause | **Fixed, condition changed.** The review's condition (strained, trust ≥ 25 and suspicious) can never hold: reaching trust 25 needs the repair topic, which clears the suspicion. Her line "You came in asking for my wallets before my paperwork. My badge stays on my neck." now plays whenever she is still suspicious, at any trust. Kemal: "Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name." Satoshi keeps "an hour ago" |
| R2-m3 | minor | "The cover held. Nobody… thought to ring the FCA" contradicts Satoshi's "I had you checked anyway" | **Fixed.** "And the cover held on the floor. Only Satoshi thought to check, and by then you were at his desk." |
| R2-m4 | minor | "It does tonight, then." didn't follow when Kemal was spoken to first | **Fixed.** Ink-local `sighted_open`, set in `on_sighted` and cleared in `start`. When spoken to first, he says "The FCA. At this hour. Very well." |
| R2-m5 | minor | Kemal's belief never shows | **Fixed.** In the stand-off: "I gave thirty years to banks that stole politely. He at least says what he is." |
| R2-m6 | minor | Guard waved through, then knocked out: the credits said "waved through", the debrief said KO | **Fixed.** The KO credit wins (`guard_ko`); the waved-through credit needs `!guard_ko`. P8 comment updated |
| R2-m7 | minor | Minder credits: talked past then punched printed two lines; turned back then slipped past printed "Never saw you" | **Fixed.** New synced `minder_challenged` (set by his sight-challenge opener, by being spoken to, and by his pick catch). The credits are now mutually exclusive in this order: KO, hostile, talked past, turned back once ("Turned you back once; you got past him anyway", new), never seen |
| R2-m8 | minor | A hostile minder the player got past was in the credits only | **Fixed.** Satoshi: "Kemal's still out there looking for you. Let's be quick." Debrief: "His minder came at you and you went round him. He's in custody now, and furious." Satoshi, the debrief and the credits now use the same order (KO, hostile, passed, turned back). Satoshi and the debrief also get a turned-back line ("Kemal turned you away, I hear. And yet here you are." / "His minder turned you back, and you went through his boss's door anyway.") |
| R2-m9 | minor | Irina detained then knocked out on the floor: the debrief said she was collected "from her desk" | **Fixed.** Debrief: "She went down on the trading floor after you'd detained her. The police carried her out. That's in the report too." New credit "Detained, then knocked down — carried out by the police"; the collected credit needs `!irina_ko`. Satoshi: "And Irina, handcuffed and then knocked flat, I hear…" in place of "in handcuffs as well" |
| R2-m10 | minor | The recap's minder lines stayed after he'd let the player in, turned hostile or been knocked out | **Fixed.** Wrapped in `not minder_passed and not minder_ko and not minder_hostile`, and rewritten for the key: "He keeps a minder on that corridor, and the minder has the key to Satoshi's door." plus a strained or held follow-up (pick the door while his back's turned) |
| R2-m11 | minor | Flag 1 and flag 2 texts could stack | **Fixed.** Flag 2 text at 5.5 s (flag 1's is at 1.2 s) |
| R2-m12 / F1 | minor | The CTO badge give tag named `opens_lock`, not the item id | **F1 withdrawn** (orchestrator, from the review: the give matches on id, `opens_lock`, `key_id` or name, so it worked). Tag tidied to `#give_item:keycard:m06_cto_badge`, matching the other give tags |

#### Decisions taken (with reasons)

- **R2-M1, open on the HQ narration** (orchestrator). The phone call-in is the hand-off now, as in m04. The narration also changes the scene, so no replacement line was needed.
- **R2-D1 (a), the guard catch stays permanent and is made readable** (orchestrator). It keeps the first sight challenge meaningful. The guard now says he'll ring, and HaX names the cause.
- **One strain text per cause, first cause only.** A player who strains the cover twice hears one warning, about the thing that did it. Later causes still get their own KO text.
- **R2-D2 (a), lock Satoshi's door; Kemal holds the key** (orchestrator). Refusals now cost something, and talk, pick and fight all stay open. The pick reuses the checkpoint's mechanic, but Kemal patrols, which makes it a different puzzle.
- **A seen pick ends the FCA line for that visit only** (ink-local `saw_picks`). A synced global would mean another flag the credits don't use. After a page reload he forgets the picks; that's an accepted limit, and the strained-cover gate is unaffected.
- **A pick Kemal sees doesn't strain the cover.** By then the player is at Satoshi's door, and Satoshi's opener already reads `minder_challenged`.
- **R2-m2's condition widened** (fixer). The review's version could never play.
- **Shared precedence for the minder** across the credits, Satoshi and the debrief: KO, hostile, talked past, turned back, never seen.

#### Route driver

`route.js` gains:
- `#unlock_door` handling (a driver-only `door_open_<room>` marker; a pick or the dropped key is a `set`);
- the per-cause strain texts and the staff KO texts;
- a note when Kemal drops his key.

The debrief picks in r1–r13 drop the removed [On my way.]. Existing routes were updated for the new behaviour:
- r1: the door opens on the talk-past, and the debrief opens at HQ;
- r2: the guard's call line, the cause text and Kemal's new line, then the key from the KO;
- r6: the door picked; the credit is now "Turned you back once".

New routes, all passing with r1–r6:
- `r7_minder_passed_then_punched` (R2-m7a): one credit, the hostile one; Satoshi's and the debrief's hostile lines; neither "Talked your way past" nor "Never saw you".
- `r8_minder_catches_pick_then_slip` (R2-M3, R2-m7b): cover held. Turned back; a pick he sees ("The FCA does not carry picks"); the FCA talk-past is withheld for that visit while Irina's word is offered; the door picked unseen. Satoshi and the debrief say he turned the player back. Credit: "Turned you back once".
- `r9_detained_then_ko_on_floor` (R2-m9): `irina_taken` stays false; Satoshi, the debrief and the credits all say detained, then knocked down.
- `r10_guard_waved_then_ko` (R2-m6): the guard KO's own strain text; KO credit only; the debrief's guard line.
- `r11_own_suspicion_badge_refusal` (R2-m2, R2-M2): Irina's own-suspicion line and HaX's "Volkova didn't buy you"; the cloner still works.
- `r12_minder_hostile_slipped_past` (R2-m8, R2-m10): the recap explains the key while Kemal stands, then drops him once he is hostile; Satoshi's, the debrief's and the credits' hostile lines; the trader KO text and strain text.
- `r13_callin_reloads`:
  - The call-in is declined; after a page reload the hub still offers it and the recap says "That's everything".
  - A second page reload lands mid call-in (after "Bring me in.", before "On my way."): the confirm step is lost and the call-in starts again from the hub.
  - The re-emit backstop fires; the debrief opens once, at HQ, with no "That's enough. Come in"; then the hear backstop fires and the hub no longer offers the call-in.

#### Checks (static; no browser session started)

- Ink compiles (9 files).
- Validator, full: ERB, JSON, schema, ink, geometry and door alignment all pass; its dialogue lint is clean. Warnings:
  - 19 duplicate-pattern notes on `agent_0x99_handler`. Three are new: the KO pairs, a KO text plus a first-cause strain mapping, meant to fire together.
  - 3 repeatable-cutscene notes: the guard's catch, and Kemal's sight challenge and pick catch, all deliberate.
  - The pre-existing two-sources note for the server room.
  - No toast-stacking warnings.
- `dialoguelint`: no findings.
- `reopencheck` (m06 block: `minder_challenged` added): m06 HaX phone, 1800 reopens, 0 problems.
- `tagdiff` against HEAD (round 1, ef4d1057):
  - phone: 5 (the three minder VARs, the recap condition);
  - debrief: 8 (the removed opener choice, the KO-first Irina branch, the minder precedence);
  - Irina: 3 (the give tag, the own-suspicion branch);
  - Satoshi: 7 (the minder and Irina branches);
  - minder: 37 (the unlock tags, `minder_challenged`, `sighted_open`, `saw_picks`, `on_lockpick_seen`);
  - guard: structure unchanged.
- `inkcheck` over a state matrix found no errors and no runaways:
  - minder: fresh; strained with Irina turned; `on_sighted`; `on_lockpick_seen` fresh and passed;
  - Satoshi: hostile minder with Irina detained and knocked out; minder challenged;
  - Irina: strained;
  - debrief: detained-then-KO with a hostile minder; challenged with Irina turned;
  - phone: the recap with the badge and a strained cover;
  - the guard's catch.
- `loopcheck` (minder `start` and `on_lockpick_seen`, phone hub): no errors.
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Route driver: r1–r13, all expectations met.

Not yet checked in a browser (added to round 1's list):
- the locked CEO door with Kemal's key: the talk-past unlock, the dropped key, and the pick;
- his `lockpick_used_in_view` catch from his beat (the door is directly above his east dwell, about 80° off his facing, and seen only on his walk east);
- the per-cause texts' timing in play.

#### Spoken lines changed (old → new)

Debrief:
- Removed: "That's enough. Come in." / "I want to hear it in person."
- "And the cover held. Nobody on that floor ever thought to ring the FCA." → "And the cover held on the floor. Only Satoshi thought to check, and by then you were at his desk."
- New: "She went down on the trading floor after you'd detained her. The police carried her out. That's in the report too."; "His minder came at you and you went round him. He's in custody now, and furious."; "His minder turned you back, and you went through his boss's door anyway."

Checkpoint guard, new: "And I'll be ringing whoever you say sent you."

HaX texts (`scenario.json.erb`):
- The single strain text ("Someone on that floor is going to ring the FCA. Get what you need before they do.") now plays only for a Dani, Priya or Irina KO. Same words.
- New: "The guard saw your picks. He'll ring the FCA to check on you, and they've never heard of you."; "Somebody will find him and ring whoever sent you. The FCA has never heard of you."; "Volkova didn't buy you. If she asks around, the FCA will say they've never heard of you."
- Flag 2 text: timing only.

HaX phone recap:
- "He keeps a minder on that corridor." → "He keeps a minder on that corridor, and the minder has the key to Satoshi's door."
- "With your cover strained, he won't take the FCA line. Wait for his back, or bring Volkova's word if she's with us." → "With your cover strained, he won't take the FCA line. Pick the door while his back's turned, or bring Volkova's word if she's with us."
- New: "The FCA line should get him to open it. If it doesn't, pick it while his back's turned."

Satoshi:
- New: "Kemal's still out there looking for you. Let's be quick."; "Kemal turned you away, I hear. And yet here you are."
- "And Irina in handcuffs as well. Whatever she said to you at the end, she built all of this with me." now plays only if she wasn't knocked out. New variant: "And Irina, handcuffed and then knocked flat, I hear. Whatever she said to you at the end, she built all of this with me."

Irina, new: "You came in asking for my wallets before my paperwork. My badge stays on my neck."

Kemal Aydin:
- "It does tonight, then." now plays only after his sight-challenge opener. New alternative: "The FCA. At this hour. Very well."
- "Go in. I will be outside the door." → "There. It is open. I will be outside the door."
- "Somebody on the trading floor rang the FCA an hour ago. They have never heard of you." → "Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name." / (a seen pick, cover held) "The FCA does not carry picks."
- New: "I gave thirty years to banks that stole politely. He at least says what he is."; narration "A hand the size of a shovel closes over yours before the second pin sets."; "No."; "It is open. Put those away."

#### Open after round 2

- Browser checks: round 1's list plus the locked door, Kemal's pick catch and the text timing. The round-1 browser check now running predates this round's door lock.
- The debrief's longest unbroken run goes to the dialogue phase (14 lines in r1 now that the opener is gone).
- Unchanged: m11 (room dressing), m12 (puzzle chains), D2, D3/D4, C1.

### Phase 1 alignment, round 3

Review: `ALIGNMENT_REVIEW_P5_R3.md` (Opus, read-only, static). It confirms every round-2 fix. It rules on the browser findings: N1 (a pick inside Kemal's cone) is a harness artefact, still owed one real pick; N3 (repeat sightings) and N4 (the pick window) are fair. Verdict: close the phase. Counts: 0 blockers, 0 majors, 4 minors, all fixed.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R3-m1 | minor | A repeat sighting replayed the full narrator line | **Fixed.** The narration and the "The FCA does not come up here." line now sit inside the first-meeting branch of `on_sighted`; a repeat is "I told you once. This floor is closed." and the choices. No spoken line changed |
| R3-m2 | minor | Irina's strain text wasn't limited to the first cause | **Fixed.** Her mapping now also needs `cover_strained !== true`, as the guard and KO mappings do. The route driver already modelled first-cause-only |
| R3-m3 | minor | `TESTING_WALKTHROUGH.md` predated pass 5 | **Fixed.** New header note; prerequisites (9 ink files, the warnings, key locks, the route driver); step 1 (catch line and strain); new 2a (cover strain: causes, texts, effects); step 20 and 26 (Irina collected, relays, detained-then-KO); new 21a (Kemal: beat and window from game 2237, sight challenge, locked door, talk / pick / fight, `minder_challenged`, the owed real pick); step 22 (locked door, Satoshi at (5,6)); step 24 ("I'm detaining you."); step 27 rewritten for `ready_to_extract` → "I'm done here. Bring me in." → `extract_go` → debrief at HQ; checklist and edge cases (locked door, Kemal, N1, cover strain, Irina collected, call-in reloads, minder states, guard credit order) |
| R3-m4 | minor | Stale comments on Kemal | **Fixed.** The erb comment and the ink header now say "otherwise the player picks the door in his blind window, squares up (hostile) or backs off", and the erb comment cites the beat measured in game 2237 (`PASS5_ALIGN_R1_BROWSER.md` 1a, 1g) |
| N1 | browser | Kemal's pick catch not seen with a real pick | **Harness artefact (review ruling).** One real pick started inside his cone is owed in the puzzle-chains stage's first browser run: expect "A hand the size of a shovel…", "No.", then the stand-off. It's in `TESTING_WALKTHROUGH.md` 21a and the checklist |

Checks (static; no browser session started):
- ink compiles (9 files);
- validator, full: all passes, no toast-stacking warnings;
- dialoguelint: no findings;
- `check_door_alignment.py`: all doors OK;
- routes r1–r13: all expectations met;
- inkcheck and loopcheck on the minder's `on_sighted`: clean;
- tagdiff on the minder against HEAD: structure unchanged;
- reopencheck: m06 phone, 0 problems.

Spoken lines changed: none (R3-m1 changes only when two existing lines play).

### Phase 1 alignment: CLOSED (2026-10-13)

| Round | Input | Blockers / majors / minors | Outcome |
|---|---|---|---|
| 1 | `ALIGNMENT_REVIEW_P5_R1.md` (partial; finished by the orchestrator) + regression `PASS5_REGRESSION_A.md` (M4–M6) | 0 / 7 / 13; regression 0 / 0 / 12 (3 taken) | 7 majors fixed (A6 reworded); 9 minors fixed, 3 deferred to later stages; R-M4 and R-M6 fixed, R-M5 withdrawn; F1 left for the browser. Built: sweep-then-call-in, phase music, cover strain, reactions to every choice and flag, Irina collected, Kemal Aydin, detain-and-hand-over wording, the guide menu, route driver r1–r6 |
| 2 | `ALIGNMENT_REVIEW_P5_R2.md` | 0 / 3 / 12 | All fixed. The debrief opens at HQ; the guard catch is made readable, with per-cause strain texts; Satoshi's door locked with Kemal's key (talk / pick / fight); debrief, Satoshi and credits agree for every minder, Irina and guard state; R2-m2's condition widened; F1 withdrawn and tidied; routes r7–r13 |
| Browser | `PASS5_ALIGN_R1_BROWSER.md` (Sonnet, games 2232 on round 1, 2235 and 2237 on round 2; keyless :3001) | 0 / 0 / 5 | Every round-1 and round-2 change checked passes: Kemal's beat, cone, sight challenge, talk-past and Irina's word, the locked door and the KO key drop, the strained cover, Irina detained and relayed, the debrief at HQ, music, credits. N1 (real pick in Kemal's cone) owed; N3 and N4 ruled fair in round 3; N2 (stand-in portrait) goes to the character stage |
| 3 | `ALIGNMENT_REVIEW_P5_R3.md` | 0 / 0 / 4 | All fixed (above). Verdict: close |

Open after the phase:
- **N1:** one real pick started inside Kemal's cone, in the puzzle-chains stage's first browser run.
- **Not yet browser-confirmed** (low risk, per round 3): a page reload in the day music phase, and a fight actually fought rather than assisted.
- **Dialogue phase:** the debrief's 13–17-line runs without a choice.
- **Puzzle chains:** m12 (the fingerprint kit is carried but unused). If Kemal's beat is lengthened, set `changeDirectionInterval` as m02 does for Val, and consider a longer east dwell (4500 → 6000 ms) if a real pick shows the glimpse interrupting an open minigame.
- **Room dressing:** m11 (the executive wing reached through the data centre; two server rooms back to back).
- **Character stage:** C1 (Kemal's look, `DECISIONS_PENDING.md`), N2 and R-M1/R-M3 (art); R-M2 (backgrounds) goes to the POV stage.
- **With the user:** D2 (the freeze/watch choice in m07), D3/D4 (needs checking against SecGen by the user: the in-game VM wording).
- Engine items R-E1 to R-E4 are in the backlog.
