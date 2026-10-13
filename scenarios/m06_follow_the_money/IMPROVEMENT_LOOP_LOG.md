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

## Phase 2: puzzle chains

### Phase 2 puzzle chains, round 1

Review: `PUZZLE_CHAINS_REVIEW_P5_R1.md` (Opus, read-only, static; it read only the PIN-minigame lines of the engine to settle the console's attempt limit). The fixer checked each finding against the files before acting. Counts: 0 blockers, 3 majors, 10 minors, plus three decisions (D1–D3), settled by the orchestrator. Outcomes: all 13 findings fixed; D1–D3 built; one correction to an earlier log entry.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | The follow-the-money deduction could be skipped: the console had no `maxAttempts`, so the engine default (5, reset on each opening) let every slot be tried in two openings; a turned Irina was a second free oracle | **Fixed** (orchestrator, D1 a + c). The console has `"maxAttempts": 2`. A HaX mapping on `minigame_failed`, scoped by condition (`PinMinigame`, `maxAttemptsReached`, in the data centre, before the fund, cover not yet strained), strains the cover once: "That console logs every slot it opens. Somebody's phone just buzzed." **Browser check owed**: that a cancel doesn't carry `maxAttemptsReached`, and that the event's data matches. Irina checks one slot per visit (ink-local `slot_checked_visit`, cleared in `start`; "Let me look again" doesn't use it up), and a wrong answer adds "Work it through before you ask me again." |
| M2 | major | Irina turned before she handed over the wordlist could never hand it over; a required task stayed open | **Fixed.** `after_choice` offers "I still need that wordlist." (turned) → `#give_item` and "Of course. Here."; a detained Irina still on the floor gets "(Take the wordlist from her desk.)" with narration. Route r14 |
| M3 | major | An unasked toast on the checklist pickup stated the passphrase recipe | **Fixed** (orchestrator). Now a pointer: "That's their house rule for door passphrases. Volkova keeps the list of words her people pick." The recap, which the player asks for, keeps the recipe |
| m1 | minor | The safe's number hung on the corridor wall | **Fixed** with D3 |
| m2 | minor | The print kit was promised and never used | **Fixed** with D2 |
| m3 | minor | A late flag 4 gave stale lines (the flag-4 text; the hub's "whole estate" beat) | **Fixed** (orchestrator: any order). The flag-4 text skips on `assets_decided`. `on_network_complete` gates the wing/badge line on `not satoshi_confronted and not irina_exec_badge_given` and the Volkova line on `not irina_fate_decided`, and returns to the hub without the choices once the money is settled; "[I'm going up.]" only shows before Satoshi is confronted ("[Understood.]" after). Route r15 |
| m4 | minor | Flag 1's text didn't skip once flag 2 was in | **Fixed.** `skipIfGlobal: flag2_submitted`. Whether the VM allows that order needs checking against SecGen by the user |
| m5 | minor | The recap's Kemal lines checked how he was dealt with, not whether the door was open | **Fixed** (orchestrator). They also need `not resolve_aim_open` (declared in the phone ink; already in `missions.json`) |
| m6 | minor | The "no attempt limit" note was wrong | **Fixed.** The erb comment and `TESTING_WALKTHROUGH.md` 17a now give the two-try limit and the strain. **Correction to round 1's R-M6 entry above:** the console did have a limit (the engine default of 5, reset on each opening); the regression run's five wrong tries were exactly that limit |
| m7 | minor | Aims can reveal out of order on the early-KO route; the comment claimed they couldn't | **Fixed (comment).** The comment now says what happens: the wing is behind the flag-3 PIN, not the fund, so a player with a KO'd Irina's dropped badge can reveal "Reach The Top Floor" early; HaX's text and Satoshi's deferral cover it. No structural change |
| m8 | minor | Priya's notes named the Fund before it was found | **Fixed** with D3: "5. Into one wallet? Every cell draws on something." |
| m9 | minor | A turned Irina could no longer lend her office badge | **Fixed.** `after_choice`: "Can I borrow your office badge?" → `#give_item:keycard:m06_cto_badge`, "Take it. There's nothing in there I'm proud of any more." |
| m10 | minor | Tidy-ups: two `_comment` keys on the server-room mapping; the guard ink said "cooldown 0" | **Fixed.** The two comments are merged onto the backstop mapping; the guard ink says 250 ms |
| D1 | decision | What a wrong slot costs | **(a) + (c)**, as M1 |
| D2 | decision | The print kit | **(b), built.** New optional `satoshi_signing_case` in Satoshi's office: a `briefcase` with a `biometric` lock enrolled to "Satoshi Nakamoto II" (`biometric_breach`'s biometric safe shape). The press clipping in the corridor is now the print surface (`hasFingerprint`, easy, candidates Kemal, Irina, Dani; made non-takeable as the m05 mug is), and it sits inside Kemal's beat, so dusting it is a stealth beat. Contents: the Release Signing Record (`onPickup: signing_record_found`). Payoffs: a HaX text, a recap hint once the player has seen the office, a debrief line in `evidence_review`, the credit "THE RELEASE: signed on Satoshi's own thumb, off the glass of his press clipping", and the optional task `open_signing_case`. That task is a collect task because the validator can't confirm a biometric lock emits `item_unlocked`. The freeze/watch outcome is unchanged. No engine change. The case's position (3,3) is provisional for room dressing |
| D3 | decision | The safe clue | **(a), built.** The clipping keeps the motive ("Until the last coin."); Irina's email keeps the meaning; Priya's mixing notes carry the number ("21M cap. Last coin due around 2140. Not our problem."). The clue now spans three rooms; a turned Irina still says it outright |

#### Decisions taken (with reasons)

- **D1, two tries and a once-only strain** (orchestrator). It uses a consequence the player already understands, with no fail state. The condition does the scoping because the event carries no object id. While `entered_data_center` is true and the fund isn't found, the only other PIN pad the player can open is the CEO's safe on the early-KO route, which is an acceptable edge.
- **Irina's per-visit check doesn't cost trust** (fixer). The orchestrator asked only for one check per visit. A trust cost would punish the player for asking the ally they turned.
- **No passphrase hint in the turned Irina's wordlist line** (fixer). A first draft added "Bitcoin's at the top", which would have undone M3.
- **D2, a biometric case, not a biometric safe.** This keeps the 2140 ego deduction. The print is on an object the player already reads, inside Kemal's beat, so the print kit and the stealth beat meet. The payoff keys on the record's pickup rather than on a print event, so it doesn't depend on how the engine slugs the owner's name.
- **D2, the task as `collect_items`:** this cleared the validator's warning about whether biometric locks emit `item_unlocked`, and it completes from the same pickup the debrief reads.
- **D3:** Priya's margin is a natural home for the number (an analyst noting the supply cap), and it gives the lab a second reason to be read.

#### Route driver

`route.js` gains a `{"lockout": true}` step (the console lockout with HaX's condition; the event-data scoping is a browser check). New routes, all passing with r1–r13:
- `r14_turned_before_wordlist_console`: turned before the wordlist; "I still need that wordlist." and the office badge from `after_choice`, both retiring once given; a console lockout strains the cover once (a second lockout is silent); one slot check per visit, another after a new visit.
- `r15_watch_then_flag4_signing_case`: watch decided before flag 4; the recap's signing-case hint; the "whole estate" beat after flag 4 says only the keys line and returns to the hub; the signing record's debrief line and credit.

#### Checks (static; no browser session started)

- Ink compiles (9 files).
- Validator, full: all passes; its dialogue lint is clean.
  - 20 duplicate-pattern notes on HaX: one new, `minigame_failed`, where the lockout mapping shares the pattern with the call-in triggers; disjoint conditions.
  - The deliberate repeatable-cutscene notes and the two-sources note.
  - No toast-stacking warnings; the biometric-task warning is cleared.
- `dialoguelint`: no findings.
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD:
  - phone: 16 (the two VARs, the `on_network_complete` gates, the recap gates);
  - Irina: 22 (`slot_checked_visit`, the three new `after_choice` options);
  - debrief: 2 (the VAR and the signing line);
  - guard, Satoshi, minder: structure unchanged.
- inkcheck (Irina `start` turned and detained, the phone's `on_network_complete` after the decision, the phone recap in Satoshi's office, the debrief with the record) and loopcheck (Irina's `after_choice` turned and detained): no errors.
- `reopencheck` (m06 block: `signing_record_found` added): m06 HaX phone, 1800 reopens, 0 problems.
- Routes r1–r15: all expectations met.

Browser checks owed:
- the console lockout's `minigame_failed` scoping, including that a cancel doesn't trip it;
- dusting the clipping and opening the case (the print's owner name matching the lock);
- the case's position;
- N1, a real pick inside Kemal's cone.

#### Spoken lines changed (old → new)

HaX texts (`scenario.json.erb`):
- Checklist pickup: "House rule: a crypto term and a year. The checklist's own date is the year. The term tops the list people here use. Volkova keeps one." → "That's their house rule for door passphrases. Volkova keeps the list of words her people pick."
- New: "That console logs every slot it opens. Somebody's phone just buzzed."; "His own thumb on his own release. That's the difference between running the exchange and signing the payout. Bring it out."
- Flag 1 and flag 4 texts: the same words, now skipped when stale.

HaX phone:
- "She's yours to decide about too. Don't leave it to the police by default." → "Volkova's yours to decide about too. Don't leave it to the police by default." (it no longer always follows the badge line)
- New recap line: "His desk has a signing case on a thumb reader. He'll have left that thumb on something he's proud of."

Irina:
- New: "Work it through before you ask me again."; "Of course. Here."; narration "Her audit wordlist is in the top tray, under a mug. She watches you take it and says nothing."; "Take it. There's nothing in there I'm proud of any more."

Debrief, new: "And his signing case. You lifted his thumb off his own press clipping and opened it. The release has one signer, and it's him."

Document text (not voiced): the press clipping's last line and observation, Priya's mixing notes (step 5 and a margin line), the new Release Signing Record and signing-case observation.

#### Open after round 1

- The browser checks above.
- Round 2 should confirm M1–M3, m3–m5 and D2.
- Room dressing: confirm the signing case's position (3,3) and that the clipping (now non-takeable) reads well on the wall.

### Phase 2 puzzle chains, round 2

Review: `PUZZLE_CHAINS_REVIEW_P5_R2.md` (Opus, read-only, static). It confirms round 1's fixes, apart from the two below. The browser check of round 1 was running at the same time; this round did not wait for it. Counts: 0 blockers, 2 majors, 6 minors, all fixed (m-R2-6 with one change).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M-R2-1 | major | Irina's "one check per visit" was one per page load. A reopen re-navigates to `after_choice` and never runs `start`, so the latch only cleared on a reload: a wrong check lost the option for good, and reloading reset the oracle | **Fixed** (orchestrator). `slot_checked_visit` is now a synced global, written with `#set_variable` beside each `~` in her ink, with its clear in `start` removed. A HaX mapping on `room_entered:data_center` (while she is turned and the fund isn't found; not onceOnly, cooldown 0) clears it, so each further check costs a trip back to the console, which makes "Work it through before you ask me again" true. r14 now shows the latch surviving a page reload, then clearing after a walk to the data centre. Ink comment and walkthrough 17a updated |
| M-R2-2 | major | Once the cover was already strained, a console lockout cost nothing, and the deduction could be skipped again | **Fixed** (orchestrator). The strain stays once-only. A second mapping on the same event and condition, minus the cover clause, sets the new synced `console_tripped` on every lockout before the fund. Credits: "TRACED THROUGH THE MIXER" now needs `!console_tripped`; new "THE ARCHITECT'S FUND: $12.8M — FOUND BY ELIMINATION ON THE CONSOLE" for a tripped console without Volkova's confirmation (her confirmation still wins). Debrief: "You found the fund by working the console until it gave. It logged every slot you tried, so ENTROPY will know exactly where we looked." New route r16 |
| m-R2-1 | minor | The signing record printed the fund's slot, which the early-KO route can reach before the console | **Fixed.** "Release: the Fund's cold slot (1ARCHITECT9FUND), …" |
| m-R2-2 | minor | Nothing warned that a lockout costs anything | **Fixed.** The console's observation adds "It logs every opening to the exchange's on-call phone." |
| m-R2-3 | minor | The strain's wording ("on that floor", "an hour ago") didn't fit a console lockout | **Fixed** (orchestrator: neutral wording for every cause). Satoshi: "Somebody here rang the FCA tonight. They've never heard of you."; recap: "Someone here has a reason to ring the FCA about you now."; debrief: "Somebody at HashChain rang the FCA…"; credit: "strained — somebody at HashChain rang the FCA" |
| m-R2-4 | minor | A player who guessed the passphrase had a required wordlist task open all night, and HaX's three wordlist lines went stale | **Fixed** (orchestrator). `obtain_access_tools` is optional (the required step is `find_server_credentials`, which completes on entry). The pickup text skips on `server_room_entered`; the hub's "What do I do with it?" and the recap's "Get it from her" both need `not server_room_entered`. r16 checks both |
| m-R2-5 | minor | The comments called dusting the clipping a stealth beat; nothing reacts to dusting | **Fixed (comments).** The clipping's and the case's comments now say "inside Kemal's hall, where his usual sight challenge applies; nothing reacts to the dusting itself". The round-1 D2 row above overstated this; this row corrects it. Browser check added: whether his sight challenge can open over a running dusting minigame |
| m-R2-6 | minor | The new collect task had no `showProgress` | **Fixed, one change.** The review proposed `false`, but the validator checks for a truthy value. `true`, as the mission's other one-item collect tasks (`find_transaction_records`, `discover_architects_fund`) use |

#### Decisions taken (with reasons)

- **M-R2-1, a visit means a trip to the console** (orchestrator). The latch lives in a synced global because the engine doesn't re-run `start` on a reopen. The data centre is where the player gathers the evidence she checks against.
- **M-R2-2, a score cost on every lockout, the strain once** (orchestrator). The cover strain is a story beat and shouldn't repeat. The credit and debrief line make brute force visible in the outcome without gating anything. Volkova's confirmation still wins the credit, because her check is the reasoning route.
- **m-R2-3, neutral wording** (orchestrator). One wording now fits every cause (guard, staff KO, Irina, console).
- **m-R2-4, the wordlist optional** (orchestrator). The door's own task carries the requirement, so a correct guess is never left with an open required task.
- **m-R2-6, `showProgress: true`** (fixer). The validator's rule and the mission's own convention both point that way.

#### Route driver

`route.js`:
- `{"room": "data_center"}` now clears `slot_checked_visit` (HaX's mapping);
- `{"lockout": true}` sets `console_tripped` on every lockout before the fund.

Updated routes:
- r14: the latch survives a page reload, then clears on a real visit; Volkova's credit beats the elimination one;
- r2, r3, r4: Satoshi's neutral strain line.

New `r16_strained_lockout_elimination`:
- the cover strained first (guard catch);
- the door guessed, so the wordlist lines stay quiet;
- two lockouts: no second strain text, `console_tripped` set;
- the debrief and credits say "found by elimination", with neutral strain wording throughout.

#### Checks (static; no browser session started)

- Ink compiles (9 files).
- Validator, full: all passes. 14 issues and suggestions (20 duplicate-pattern notes on HaX: the new `room_entered:data_center` and `minigame_failed` mappings share patterns with the existing ones and have disjoint or harmless conditions). The `showProgress` note is cleared, and there are no toast-stacking warnings.
- `dialoguelint`: no findings.
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD:
  - phone: 4 (the wordlist gates);
  - Irina: 4 (the `#set_variable` tags; the clear in `start` removed);
  - debrief: 2 (`console_tripped`);
  - Satoshi: structure unchanged.
- inkcheck (Irina turned in the slot phase; debrief with `console_tripped`; phone recap with the door open) and loopcheck (Irina's `after_choice`): no errors.
- `reopencheck` (m06 block: `console_tripped`, `slot_checked_visit` added): m06 HaX phone, 1800 reopens, 0 problems.
- Routes r1–r16: all expectations met.

Browser checks owed:
- the console lockout's `minigame_failed` scoping, and that a cancel doesn't trip it (the review reads the cancel as carrying `result: null`);
- whether Kemal's sight challenge can open over a running dusting minigame;
- the dusting-and-case beat itself;
- N1.

#### Spoken lines changed (old → new)

- Satoshi: "Somebody on my floor rang the FCA an hour ago. They've never heard of you." → "Somebody here rang the FCA tonight. They've never heard of you."
- HaX recap: "Someone on that floor has a reason to ring the FCA about you now. Don't hang about." → "Someone here has a reason to ring the FCA about you now. Don't hang about."
- Debrief: "Your cover didn't last the night. Somebody on that floor rang the FCA, and the FCA had never heard of you." → "Your cover didn't last the night. Somebody at HashChain rang the FCA, and the FCA had never heard of you."
- Debrief, new: "You found the fund by working the console until it gave. It logged every slot you tried, so ENTROPY will know exactly where we looked."
- HaX texts: the wordlist pickup text, same words, now skipped once the door is open.

Not voiced: the console's observation, the signing record's release line, the credits.

#### Open after round 2

- The browser checks above.
- Room dressing: the signing case's position (3,3) and the clipping on the wall.

### Phase 2 puzzle chains, round 2: browser follow-up

Input: `PASS5_PUZZLE_R1_BROWSER.md` (Sonnet, games 2247 and 2256, keyless :3001). It confirms N1: a real pick inside Kemal's cone gives "A hand the size of a shovel…", "No." and the stand-off, and "Dr Volkova sent me up" then gets the player in. It also confirms that cancelling the console without a try doesn't trip the lockout. It found two majors and one minor wording item.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F1 | major | The console lockout never fired: neither the cover strain nor `console_tripped`. Mapping conditions resolve only one level of `data.<name>` (`safeEvaluateCondition`, npc-manager.js), so `data.result.maxAttemptsReached === true` is an unsupported term and always false | **Fixed by a workaround, no engine change** (orchestrator). Both mappings now key on a bare `data.result`, a supported truthiness term. The run recorded `result: null` on a cancel and `{"success":false,"attempts":2,"maxAttemptsReached":true}` on a lockout; `data.minigameName === 'PinMinigame'` stays. I read the evaluator (npc-manager.js:15-100) to confirm the bare term is supported and that `null` parses. **Browser check still owed:** a cancel *after* one wrong try, whose event data the run didn't record (if it carries a result, it would trip the mapping). Route driver mirrored: `{"lockout": "cancel"}` fires nothing, and r14 asserts it. Engine item logged as `DECISIONS_PENDING.md` D5, recommending dotted-path support |
| F2 | major | The signing case drew under Satoshi's desk (depth -1038.5 against the desk's -1004.5), so nobody could see it | **Fixed (needs a render check).** Moved onto the desk's front edge at (3.6, 3.35) with `elevation: 32`, the m05 mug pattern (`docs/test-bridge.md`: elevation feeds render depth only, not interaction range). From the run's numbers, depth is the top-left y plus height plus 0.5. That gives -1044.8 + 17.5 = -1027.3, plus 32 ≈ -995, in front of the desk. x 435-458 is inside the desk's 399-477. It's about 70 px from Satoshi (5,6) and the manifesto (2,6); a render and tap check is owed |
| F4 | minor | The dusting compare showed only Irina and Satoshi, while the log and walkthrough said Kemal, Irina and Dani | **Doc aligned; scenario unchanged.** Easy difficulty shows the owner plus one decoy from `fingerprintCandidates`, picked by a fixed seed (the same behaviour as m04 R-M3). The candidates list is right; the walkthrough and an ERB comment now say so |

#### Decisions taken (with reasons)

- **F1, flatten the condition rather than change the engine** (orchestrator). It's mission-local and reversible, and the same evaluator handles every mapping in the game. D5 asks for the proper fix.
- **F2, lift the case on the desk with elevation rather than move it off the desk.** Its observation says "on the desk", and m05's mug proved the pattern.

#### Checks (static; no browser session started)

- Ink compiles (9 files; no ink changed this step).
- Validator, full: all passes; no unknown fields (the position and candidates notes are ERB comments).
- `dialoguelint`: no findings.
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD: structure unchanged.
- `reopencheck`: m06 phone, 1800 reopens, 0 problems.
- Routes r1–r16: all expectations met (r14 now includes a cancel).

Spoken lines changed: none.

#### Browser checks still owed

- A console cancel after one wrong try.
- A first console lockout: the strain, HaX's text, `console_tripped`, and the "FOUND BY ELIMINATION" credit.
- The signing case visible on the desk, and tappable without catching Satoshi or the manifesto.
- Whether Kemal's sight challenge can open over a running dusting minigame.

### Phase 2 puzzle chains, round 3

Review: `PUZZLE_CHAINS_REVIEW_P5_R3.md` (Opus, read-only, static, with an engine-evaluator probe `probe_console_engine.js`). It settles the open F1 question statically: a cancel after one wrong try also emits `result: null`, because the pad sets `gameResult` only on success or lockout. The flat `data.result` test is therefore safe from cancels, but it misses the "one guess, cancel, reopen" sweep. Counts: 0 blockers, 1 major, 3 minors, all fixed with the reviewer's mission-local fix.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M-R3-1 | major | One guess per opening never locked the console out (the pad's count resets on every opening, and a wrong guess under the limit leaves `result` null), so "TRACED THROUGH THE MIXER" was open to guessing for every player | **Fixed** (orchestrator, the reviewer's fix). The console is `maxAttempts: 1`, so every wrong slot closes the pad with a non-null `result`. Strikes are counted across openings by three `minigame_failed` mappings in a deliberate order (the dispatcher runs listeners in array order and `setGlobal` is synchronous): (1) second and later strikes, `console_warned === true` → `console_tripped`; (2) second strike, once, if the cover isn't already strained → the cover strain with "That console logs every slot it opens. Somebody's phone just buzzed."; (3) first strike, `console_warned !== true`, once → `console_warned` and "That console just logged a slot that wasn't the fund. One more and somebody's phone goes." All three need `data.minigameName === 'PinMinigame' && data.result && globalVars.at_console === true && globalVars.found_architects_fund !== true`. New synced globals `console_warned` and `at_console` (in `missions.json`). The erb comment explains the order |
| m-R3-1 | minor | A lockout at the CEO's safe (early-KO route) wrote a false "found by elimination" credit and debrief line | **Fixed** with M-R3-1's scope: `at_console` is set on `room_entered:data_center` and cleared on `room_entered:server_room` and `room_entered:executive_wing` (cooldown 0, not onceOnly), replacing `entered_data_center`, so the safe never matches. This also closes the strain-text edge round 2 had accepted. Route r18 |
| m-R3-2 | minor | A player whose cover was already strained got no signal at a console lockout | **Fixed** with M-R3-1: the first-strike warning fires whatever the cover's state. r16 checks it |
| m-R3-3 | minor | The walkthrough quoted Satoshi's old strain line | **Fixed.** "Somebody here rang the FCA tonight. They've never heard of you." |

#### Decisions taken (with reasons)

- **Count strikes in globals, not with the engine** (orchestrator). The pad keeps its count per opening, and the condition evaluator can't read `data.result.attempts` (D5). With one try per opening, every strike is visible as a flat non-null `result`. One honest slip is free and warned; a second costs the strain once and the credit. That is the "two strikes" D1 meant, without the per-opening reset.
- **Scope by place (`at_console`)** (orchestrator). `minigame_failed` carries no object id; the data centre is the only room where the console can be open, and leaving it by either door clears the scope.
- **The warning skips once the fund is found**, so a stray PIN failure afterwards says nothing.

#### Route driver

The driver now evaluates the scenario's real mappings, as the reviewer asked:
- A port of the engine's condition rules (`&&`-terms; `value`, `name`, `data.<one name>`, `globalVars.<name>`; negation; comparison with a literal; bare truthiness). It reports unsupported terms, as the engine logs them.
- It reads every literal `eventPattern` mapping out of the erb, in file order.
- `{"strike": "wrong" | "cancel"}` fires the real `minigame_failed` mappings.
- `{"room": x}` fires the real `room_entered:x` mappings (setGlobals and texts). These replace the hand-modelled data-centre and latch logic.
- ERB-generated mappings (the per-room loops, the call-in) are still modelled.

Routes:
- r14 and r16 are rewritten with strikes.
- New `r17_one_slip_then_correct`: one strike warns; leave, return, cancel; no strain, no `console_tripped`; credit TRACED THROUGH THE MIXER.
- New `r18_early_ko_safe_lockout`: two failed attempts at the CEO's safe with `at_console` false trip nothing; the credit stays TRACED.

#### Checks (static; no browser session started)

- Ink compiles (9 files; no ink changed).
- Validator, full: all passes; no unknown fields, no toast-stacking warnings. 20 duplicate-pattern notes; the new `room_entered` scope mappings share patterns with the existing ones and only set `at_console`.
- `dialoguelint`: no findings.
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD: structure unchanged.
- `reopencheck` (m06 block: `console_warned`, `at_console` added): m06 HaX phone, 1800 reopens, 0 problems.
- Routes r1–r18: all expectations met, with no unsupported condition terms reported.

#### Spoken lines changed (old → new)

- HaX text, new: "That console just logged a slot that wasn't the fund. One more and somebody's phone goes."
- "That console logs every slot it opens. Somebody's phone just buzzed." is unchanged in wording; it now plays on the second strike.

#### Next

The reviewer's ten-item browser checklist (`PUZZLE_CHAINS_REVIEW_P5_R3.md`, "Final browser checklist for closing the phase"). Item 1's "before any fix" half no longer applies to this build. The rest covers: the strikes, the old bypass closed, the safe not counting, Irina's per-visit check, the signing case's render and tap area, and Kemal's sight challenge over dusting.

### Phase 2 puzzle chains: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors | Browser |
|---|---|---|---|---|
| 1 | 0 | 3 | 10 | PASS5_PUZZLE_R1_BROWSER: 2 majors (nested-path lockout, hidden case), fixed in the follow-up; N1 real pick confirmed |
| 2 | 0 | 2 | 6 | — |
| 3 | 0 | 1 | 3 | PASS5_PUZZLE_R3_BROWSER: checklist items 1–7 and 9 pass (4 games), 0 blockers, 0 majors |

Carried into phase 3:
- **R1:** a second console strike when the cover is already strained sets `console_tripped` and sends no HaX text. Add a short line.
- **R2:** with the cover strained and Irina not turned, the only ways past Kemal are a pick or a fight. That's by design, but the stand-off itself hasn't been played in a browser.

Engine item D5 (dotted paths) is with the user.

## Phase 3: scenario design

### Phase 3 scenario design, round 1

Review: `SCENARIO_DESIGN_REVIEW_P5_R1.md` (Opus, read-only, static). Counts: 0 blockers, 1 major, 12 minors, three decisions and seven SecGen items. Outcomes: M1 and 11 minors fixed; m11 left by decision; decisions 1–3 acted on; S1–S7 to the user.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | A page reload replayed Irina's first meeting and reset her trust and once-only topics (ink-local state is lost on reload) | **Fixed in the mission** (orchestrator; an engine-level fix that saves NPC conversation state is the backlog item). Her first meeting is keyed on the synced `exchange_infiltrated` (`{first_meeting and not exchange_infiltrated:`; a reload goes straight to "Back again."). `irina_trust` and the once-only flags that matter are now scenario globals of the same names, so the engine's ink-to-global observer (`npc-conversation-state.js:468-490`) syncs every `~` change and they survive a reload: `asked_research`, `asked_paperwork`, `asked_passwords`, `given_time`, `badge_discussion`, `shown_casualties`, `shown_architects_fund`, `moral_conflict_revealed`, `recruitment_offered` and `recruitment_refused`. A refused pitch stays refused, and the trust topics can't be farmed by reloading. Route r20 (`"reload": "page"`): trust 35 survives, the badge loan works, no "You must be the FCA" |
| m1 | minor | A second console strike with the cover already strained sent no text | **Fixed.** A mapping placed before the strike mappings (it reads `cover_strained` before anything could set it), once only: "Another wrong slot, and it's logged. They already know we're inside. Now they know where we're looking." Route r19 |
| m2 | minor | After Kemal's stand-off with the cover strained, nothing said how to get past him | **Fixed.** HaX mapping on `conversation_closed:satoshi_minder` (strained, challenged, not passed, hostile or down, Satoshi not yet confronted, Irina not turned), once only: "He won't take the FCA from you now. Watch his walk. When his back's turned, that door's an easy lock." Route r19 |
| m3 | minor | A reload replayed Satoshi's opening on the defer route | **Fixed.** The opening also needs `not satoshi_confronted` (synced, declared in his ink), so a return goes to "Back again." and the decision. Route r20 |
| m4 | minor | "Traced through the mixer" was claimed without Priya's write-up | **Fixed.** The TRACED credit needs `found_blockchain_evidence`; new "THE ARCHITECT'S FUND: $12.8M — FOUND ON THE CONSOLE" for no write-up, no strikes and no confirmation. Debrief branch "You found the slot on the console without Priya's write-up. Lucky, or good. The file will say lucky.", placed after the elimination branch so it matches the credits' order. Route r21 |
| m5 | minor | A turned-then-KO'd Irina got the plain "Turned" credit | **Fixed.** "DR. IRINA VOLKOVA: Turned, then knocked down — what she gave still stands"; the plain line needs `!irina_ko`. Route r21 |
| m6 | minor | The debrief spoke of a payout three days off in the past tense | **Fixed.** Freeze: "When the clock runs out, it runs out on an empty wallet."; watch: "When the payout goes, every wallet it reaches gets tagged."; "They'll have the money in three days." Routes r21, r22 |
| m7 | minor | The debrief got the way in wrong, and the FCA letter didn't cover it | **Fixed.** "A build service nobody had switched off got you onto their backend. One cracked password, and the same password opened a second account." A tenth FCA option, a real finding: "A build service on their backend runs whatever it's sent." Ten options, three picks. The wording needs checking against SecGen by the user (D6, S1). Route r21 |
| m8 | minor | "Only Satoshi thought to check" could be said to a player who never heard him | **Fixed.** New synced `satoshi_spoken`, set beside `#complete_task:confront_satoshi`; without it: "And the cover held. Nobody at HashChain thought to ring the FCA." Route r22 |
| m9 | minor | The privilege-escalation guide's name didn't match its sheet | **Fixed.** The item is now "SAFETYNET Field Guide: Privilege Escalation via Sudo", the menu label "Privilege escalation via sudo.", and the give line "Privilege escalation guide sent." Flag 1's text: "…When you need root, I've a guide." Whether the route needs sudo: D6, S5 |
| m10 | minor | After a reload nothing reminded a warned player about the console | **Fixed.** Recap: "That console's logged one wrong slot already. Another and somebody's phone goes." (warned, not tripped). Route r19 |
| m11 | minor | The status recap gives the whole passphrase recipe | **Left as it is** (orchestrator). The player asks for the recap, and minigames aren't meant to be hard |
| m12 | minor | Other first-meeting openers replayed after a reload | **Fixed where cheap.** Dani's and Priya's openers key on the synced `trader_spoken` / `analyst_spoken`. Kemal's keys on `minder_challenged`, now set with `~` after the opener check in `start` and `on_sighted` (it was a tag set before the check). The guard and Kemal's `saw_picks` are left, as accepted. Route r20 |
| Decision 1 | CyBOK | Thin keywords | **(a).** Debrief line in `password_cracking_discussion`: "Map it, get on it, crack it, reuse it, move sideways, take the keys. A whole chain, and they'd left every link open." Removed "CVEs and CWEs" (SS) and "Hash functions" (AC) from `mission.json`, because nothing in the erb or ink teaches them. "Password hashing" and the kill-chain keywords stay. `DECISIONS_PENDING.md` D7: the user may restore them if the VM covers them |
| Decision 2 | Reload | How Irina survives a reload | **(a) plus synced trust and topics**, as M1 |
| Decision 3 | SecGen | S1–S7 | **To the user.** `DECISIONS_PENDING.md` D6, with each item and the lines they touch |

#### Decisions taken (with reasons)

- **M1, synced globals rather than a trust floor** (orchestrator). Syncing keeps the exact trust and the once-only topics, and costs only the global declarations, since the observer syncs `~` writes. The engine-level fix stays in the backlog.
- **m4, the elimination branch before the no-write-up branch** (fixer). The debrief then follows the credits' precedence (confirmed, tripped, no write-up, traced).
- **m12, Kemal's `minder_challenged` set with `~` after the check** (fixer). A tag before the check doesn't change the ink variable during that run, so it couldn't gate the opener.
- **m11 unchanged** (orchestrator).

#### Route driver

`route.js` also fires the erb's real literal `conversation_closed:<npc>` mappings when a talk closes; the hand-modelled ones run first.

New routes, all passing with r1–r18:
- `r19_strained_two_strikes_kemal_pointer` (m1, m10, m2);
- `r20_reloads_keep_openers` (M1, m3, m12: Irina, Dani, Priya, Kemal and Satoshi across page reloads);
- `r21_no_writeup_turned_then_ko` (m4, m5, m6, m7, decision 1);
- `r22_satoshi_ko_unspoken_cover_held` (m8, m6).

#### Checks (static; no browser session started)

- Ink compiles (9 files).
- Validator, full: all passes; no unknown fields; no toast-stacking warnings; dialogue lint clean; 20 duplicate-pattern notes.
- `dialoguelint`: no findings.
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD: phone 3, Irina 4, debrief 9, Satoshi 4, trader 3, analyst 3, minder 10. Every one is a change listed above.
- inkcheck (Irina after a reload and fresh; Satoshi after a reload; Dani and Priya after a reload; Kemal re-sighted; debrief tripped with Irina turned then KO'd) and loopcheck (Irina's hub after a reload, the ten-option FCA letter, Kemal): no errors.
- `reopencheck` (m06 block: `satoshi_spoken`, `irina_trust` and the ten topic flags added): m06 HaX phone, 1800 reopens, 0 problems.
- Routes r1–r22: all expectations met; no unsupported condition terms.

Browser checks owed (the review's list): M1 (meet Irina, reload, talk); m1 (two strikes with the cover strained); m2 (Kemal's stand-off, back off, the pointer, pick unseen; a second run that squares up); m3 (defer Satoshi, reload, return); m4 (skip the lab, land the console).

#### Spoken lines changed (old → new)

HaX texts (`scenario.json.erb`):
- Flag 1: "First account's yours. People here reuse passwords, so that one opens more than one door. I've a credential reuse guide if you want it." → "First account's yours. People here reuse passwords, so that one opens more than one door. When you need root, I've a guide."
- New: "Another wrong slot, and it's logged. They already know we're inside. Now they know where we're looking."; "He won't take the FCA from you now. Watch his walk. When his back's turned, that door's an easy lock."

HaX phone:
- "Privilege escalation and credential reuse guide sent." → "Privilege escalation guide sent."
- New recap line: "That console's logged one wrong slot already. Another and somebody's phone goes."

Debrief:
- "You froze it before the payout. The clock ran down on an empty wallet." → "You froze it before the payout. When the clock runs out, it runs out on an empty wallet."
- "You let it run. The payout went out on time, and every wallet it reached is tagged." → "You let it run. When the payout goes, every wallet it reaches gets tagged."
- "They also have the money. Whatever it buys goes ahead unless we get there first." → "They'll have the money in three days. Whatever it buys goes ahead unless we get there first."
- "One cracked password got you onto their backend, and the same password opened a second account." → "A build service nobody had switched off got you onto their backend. One cracked password, and the same password opened a second account."
- New: "Map it, get on it, crack it, reuse it, move sideways, take the keys. A whole chain, and they'd left every link open."; "You found the slot on the console without Priya's write-up. Lucky, or good. The file will say lucky."; "And the cover held. Nobody at HashChain thought to ring the FCA." (when Satoshi never spoke)

Not voiced: the guide item and menu names, the FCA letter's new option, the credits, the `mission.json` keywords.

#### Open after round 1

- The browser checks above.
- D6 (S1–S7) and D7 (CyBOK keywords) are with the user.

### Phase 3 scenario design, round 2

Review: `SCENARIO_DESIGN_REVIEW_P5_R2.md` (Opus, read-only, static). Counts: 0 blockers, 0 majors, 5 minors. Outcomes: n2–n4 fixed; n1 and n5 left by the orchestrator's decision. The stage closes after these fixes and a browser check.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| n1 | minor (tooling, docs) | The engine already saves ink-local variables with the game (only visit counts, `TURNS()` and position are lost), so round 1's M1 premise looks wrong, and the route driver's `"reload": "page"` is harsher than the engine | **Left for the orchestrator** (orchestrator). The browser check settles whether ink locals survive a reload; the orchestrator handles the driver, the backlog entry and Kemal's "(resets on a page reload)" comment after it. Round 1's synced globals do no harm either way: they reach the same result by a second route |
| n2 | minor | Once Irina had refused and been given time, "I need an answer" could leave a single choice: detain her | **Fixed.** The refusal branch adds `+ {given_time} [Then I'll leave you to it. For now.]`, with a one-line reply, "For now." (`dialoguelint` asks for a reply before an exit). Her hub topics can still raise trust, so the turn stays open. Route r23: brusque opener, pitch, time, ask again; two choices, back out, fate still open |
| n3 | minor | The FCA-letter comment still counted nine options | **Fixed.** "Three picks from ten. Eight are real findings from tonight; two are not. … seven are always left" |
| n4 | minor | The renamed privilege-escalation guide's observation still described the old guide | **Fixed.** "Taking an ordinary account up to root, once you have a foothold". Not voiced. Folds into D6/S5 if the user repoints the guide |
| n5 | minor (dialogue stage) | Irina's hub lists her late topics last | **Deferred to the dialogue phase** (orchestrator). Ink order only, no tag change |

#### Checks (static; no browser session started)

- Ink compiles (9 files).
- Validator, full: all passes; no unknown fields; dialogue lint clean.
- `dialoguelint`: no findings (the first draft of n2 flagged exit-no-reply, cleared by "For now.").
- `check_door_alignment.py`: all doors OK.
- `tagdiff` against HEAD: Irina 6 (the new choice and its exit; the rest are round 1's synced-trust changes not yet committed); debrief structure unchanged.
- inkcheck (Irina's `recruitment_decision` with time given and low trust) and loopcheck (her hub after a refusal): no errors.
- `reopencheck`: m06 HaX phone, 1800 reopens, 0 problems.
- Routes r1–r23: all expectations met.

#### Spoken lines changed (old → new)

- Irina, new: "For now." (reply to the new back-out choice).

#### Open

- The closing browser check: round 1's list, plus n2's back-out and the reload question in n1.
- n1 (tooling and backlog) is with the orchestrator; n5 goes to the dialogue phase.

**Closing browser check (PASS5_DESIGN_R2_BROWSER, games 2304, 2310, 2315):** all six checks pass, with 0 mission findings. It also settles n1: ink-local variables DO survive a page reload, because the engine saves `npcInkVariables` after each choice. Only visit counts, `TURNS()` and story position are lost. Round 1's M1 premise was wrong, but the synced-globals fix is harmless.

### Phase 3 scenario design: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 1 | 12 |
| 2 | 0 | 0 | 5 |
| Browser | 0 | 0 | 0 |

Next: phase 4 dialogue (with n5, the hub order, and the debrief's long runs without a choice), alongside room dressing (m11 layout, the signing case and clipping placement).

## Phase 4: dialogue

Snapshot for `tagdiff --old`: the session scratchpad's `m06-dialogue-snapshot/ink/` (commit 7a1a829a's ink).

### Phase 4 dialogue, cycle 1

Review: `DIALOGUE_REVIEW_P5_C1.md` (Opus, static plus the route driver; 0 blockers, 6 majors, 38 minors). Fixer: Opus, resumed between cycles. Every finding was checked against the ink before it was acted on. No browser session was started, the do-not-open rule held, and `scenario.json.erb` was not edited (no finding needed it: D6-8 keeps the texts).

User decisions this cycle: D6-1 and D6-2 take the reviewer's branches and subtext beat; D6-3 adds the two player beats and the cut, no debrief run over 9, a `maxRun` assertion in the route driver and routes for the worst debrief paths; D6-4 the single replacement line; D6-5 re-entry lines for Dani and Priya; D6-7 trim Satoshi's finale; D6-6 newest-first hub order; D6-13 a light Hamburg touch for Kemal; Satoshi's stock villain lines rewritten so he argues rather than sneers; D6-31 Priya's question paid off; D6-42 dead locals removed.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D6-1 | major | Direct reveal answers evidence she never saw | **Fixed** as proposed: without the write-up or the fund page, the reveal shows the fund at the casualty line ("*reads it twice* I wrote the mixer so nobody could see where money went. Not so nobody could see this.") and marks it shown |
| D6-2 | major | Badge scene shows the deaths and she reacts only to the signature | **Fixed** as proposed: new local `shown_signature`; "You show her the authorisation line on the fund page, and nothing else."; the subtext line "You're not from the FCA. ...No. Don't tell me yet." while no pitch has been made. `shown_architects_fund` is no longer set there, so the evidence scene's "They costed the deaths" is her one reaction |
| D6-3 | major | Debrief runs of 14–18 lines | **Fixed.** Player beat after the Satoshi block ("[He'll be making speeches at the trial.]" / "[Did he give anything up?]", both into a new knot `exchange_aftermath`); "[Walk me through it.]" / "[I was there. Just the letter.]" after "All four flags in."; "The police and the lawyers decide…" cut. Two further trims were needed to hold 9 on every route: each asset outcome is now one line, and the strained-cover lines are one ("Your cover didn't last the night. The FCA had never heard of you, and that might cost us the next job."). Also D6-39's cut of "We let it run." keeps the run before the Irina choice at 9. Longest debrief run on any route: 9 (r6, r21, r24, r25), from 18 |
| D6-4 | major | Kill-chain list | **Fixed**: "That's the whole chain, from outside to the keys, and they'd left every link open." (in the walk-through branch; CyBOK decision 1 kept) |
| D6-5 | major | Dani and Priya don't notice Irina | **Fixed, placed differently.** A reopen re-enters the resting knot (`hub`), not `start`, so a line in `start`'s `- else:` would only play after a page reload (checked in the driver: the first draft never printed). The reactions are in each hub's re-entry line, once per change (new local `irina_news`); `start`'s reload branch hands over to the hub when news is pending. Dani: detained at her desk, walked out, knocked down (reviewer's lines, with `--` cut-offs). Priya: "Someone said Irina's been detained. Was it the graph? Was it my graph?" / "Someone said Irina's out cold on the trading floor. Was that to do with my graph?" (the review's "taken out" reads as killed). Dani's "What's Dr. Volkova like to work for?" is hidden once Irina is detained or down. Declared `irina_arrested`, `irina_taken`, `irina_ko` (Dani) and `irina_arrested`, `irina_ko` (Priya) |
| D6-7 | major | Four villain closers | **Fixed** as proposed: "Enjoy the map while it's fresh."; "The idea will outlive her…", "ENTROPY has no head to cut off…" and "you'll find out what it cost" cut. Satoshi's longest run 8, from 10 |
| D6-6 | minor | Irina's hub order | **Fixed** (user: newest first), the reviewer's order; conditions unchanged |
| D6-8 | minor | "That goes in the report" ×7 | **Fixed** as proposed in the debrief (A&E line, "None of them knew what HashChain was.", "I'll be explaining that one upstairs."); texts kept |
| D6-9 | minor | Refusal replays, mentions a graph that wasn't there | **Fixed** as proposed; the second line plays on the first ask only |
| D6-10 | minor | "For now." echo | **Fixed**: "Don't take too long. He notices when I'm quiet." |
| D6-11 | minor | "Someone on the floor has been asking…" | **Fixed** as proposed |
| D6-12 | minor | Same re-entry for a turned Irina | **Fixed**, with "Ask, then." for the review's "Still here." (the guard already says "Still here." twice) |
| D6-13 | minor | No Hamburg in Kemal's words | **Fixed** (user: light touch): "Moin." on the first meeting, "Na gut. Go in." after Volkova vouches. Two uses |
| D6-14 | minor | Narration of his accent | **Fixed** |
| D6-15 | minor | "I hoped you would say that." | **Fixed**: "*takes off his watch and pockets it* Then come and move me." |
| D6-16 | minor | "Thirty years" ×4 | **Fixed** as proposed (Kemal :148, debrief); his first speech and Satoshi's kept |
| D6-17 | minor | "Casualties are inevitable…" | **Fixed**: "People die when systems change. They die when they don't, too. You just never count yours." ("invoice" would clash with "I just pay the invoices" on the same route) |
| D6-18 | minor | The same argument twice | **Fixed**: "Everything justifies something. You just don't like my arithmetic." then, for "We just make it visible.", a concrete argument: "Your side freezes a country's reserves and the hospitals run out of insulin. Nobody writes that up as a casualty projection." |
| D6-19 | minor | Filler before his best line | **Fixed** (cut) |
| D6-20 | minor | Asks about a KO'd Irina | **Fixed** (`not irina_ko`) |
| D6-21 | minor | The pitch replays on every return | **Fixed.** New local `pitch_heard`; a return gets one line: "Found my wallet yet? No?" (no fund), "You found the keys. So, which is it?", or "Freeze or watch. I'm still waiting." |
| D6-22 | minor | "the door only opens one way" | **Fixed** as proposed |
| D6-23 | minor | "You can't win…" | **Fixed** (cut) |
| D6-24 | minor | Slow clap | **Fixed**: "He watches it land, and smiles as if he'd sent it himself." (shortened, since the line before already has the transfer clearing) |
| D6-25 | minor | Awkward choice | **Fixed** |
| D6-26 | minor | "People tonight over people later" | **Fixed** as proposed |
| D6-27 | minor | "Patient" twice; "Bold." | **Fixed** as proposed |
| D6-28 | minor | "deckchairs" | **Fixed**, differently: "Murder's what they call it when you lose. The winners get statues." (shorter than the review's, and not a history-books lecture) |
| D6-29 | minor | "Both of them." | **Fixed** |
| D6-43 | minor | Unreachable branch | **Fixed** (deleted; reaching it from `corrupted_ideals` would double the finale's "Irina in handcuffs as well") |
| D6-30 | minor | Priya says the same fact twice | **Fixed** as proposed |
| D6-31 | minor | Priya's question never answered | **Fixed**, worded so it holds on every route that sets the condition: `analyst_walked_through and not analyst_ko` → "Raghavan will want to know what she was drawing. Somebody from the police will tell her. I'd rather it was you." (the review's "Raghavan asked you…" claims a question she asks only after "[I can't talk about that.]", and there's no global for that; adding one would mean editing `globalVariables` in the shared erb) |
| D6-32 | minor | "Eight hundred million" quoted untold | **Fixed** |
| D6-33 | minor | First call ignores a strained cover | **Fixed**, with a third case the review didn't cover: a knocked-out guard also strains the cover, so "[The guard caught me at his door.]" would be false. Options: holding fine (cover intact) / caught ("Then he'll ring the FCA. Get to Volkova before the answer comes back.") / "[The guard's down. It was him or the cover.]" ("Then somebody finds him soon. Get to Volkova before they do."). `guard_ko` declared in the phone ink (already in `missions.json`) |
| D6-34 | minor | "before anything clever" ×3 | **Fixed** as proposed (:383, :663); the recap's use kept |
| D6-35 | minor | Letter set-up ignores the strain; muddled verdict | **Fixed** as proposed |
| D6-36 | minor | Flat Tesseract pair | **Fixed** as proposed |
| D6-37 | minor | `mission_conclusion` restates the confession | **Fixed** (knot cut; m07/m08 grepped by the reviewer) |
| D6-38 | minor | "She never looked…" untrue on two routes | **Fixed** as proposed |
| D6-39 | minor | Minder line wrong after Volkova vouches; "You/We let it run"; doubled ending | **Fixed.** "His minder took Volkova's word for you, on the phone, with his boss behind the door." when `minder_passed and cover_strained and irina_recruited` (one line, for the run limit; the review's "twice tonight" didn't say what the first time was). Edge left: a player who talks past Kemal and strains the cover afterwards hears the Volkova line; it needs a new global to tell apart. :154 cut; :553 "If they do, we won't get much warning." |
| D6-40 | minor | Colon after six words | **Fixed** as proposed |
| D6-41 | minor | `TURNS()` latch after a reload | **Fixed**: cleared at the top of `start` and on every reopen of `hub` and `after_choice` (the `hub_quiet` branch), because a reopen re-enters the resting knot, not `start` |
| D6-42 | minor | Dead locals | **Fixed**: `analyst_talked`, `trader_talked`, `asked_about_irina`, `mission_accepted`, `ideology_discussed` and their writes removed |
| D6-44 | minor | "[Start with the fund.]" skips two lines | **Left as it is** (fixer, as the review allows): `cell_disruption` gives the same outcome on that route, and folding the lines in would lengthen the fund route's run |

Satoshi beyond the numbered findings (user: a man with a real argument): "midwives" → "Look, every crash so far, the banks got rescued and everybody else got the bill. This time I'd like to choose who pays."; "You protect the status quo" → "You won't agree. You work for the people who'd lose the most if I'm right."; "Too much conscience for an anarchist" → "She wanted the privacy without the customers. Most people do."; "Not everybody has the stomach." → "Most people want the freedom and none of the bookkeeping."; the freeze sneer → "Twelve point eight million, gone on one agent's say-so. No court, no hearing." / "That's the state I've been warning people about."; "more dangerous to us than the true believers" → "Hold on to that. It's how I started."; "Systems that can't question themselves don't." → "Sure. Nobody at your agency gets paid to wonder."; aftermath "Come to gloat…" → "Still waiting on your police. You want to argue some more, or just look?"; "Time will tell." → "You made a call. I made mine a long time ago." American turns: "Look,", "waiting on", "Sure.". His one rhetorical contrast per scene is now "You'd call it laundering. I call it financial freedom…".

Found while fixing:
- **A direct reveal, then the write-up.** "There's something you need to see" stayed on offer after a direct reveal (it keys on `shown_casualties`), and `evidence_pivot` always went to `reveal_identity`, so she was shown the credentials a second time. It now goes to her answer when the pitch has been made, and with the fund already shown she says "The hospital money as well. All of it through my mixer, and all of it to that page." instead of reading the casualty line again. Route r27.
- **An ink gotcha.** A `//` comment between `{` and the first `- case:` of a multi-line conditional made ink skip the first case without any compile warning (seen in `evidence_pivot`; the comment now sits above the `{`). Comments between later cases are fine. Worth adding to `README_ink_best_practices.md` (orchestrator).
- **Route driver.** A `said` step cleared the heard lines, so a `notSaid` step straight after it checked nothing: every old `notSaid` that followed a `said` was vacuous. Consecutive `said`/`notSaid` steps now check the same lines. Re-running showed one stale check (r2's `notSaid: "reception"` matched the briefing), now narrowed to the guard's wording. Every other old `notSaid` passes.

#### Routes

Driver: `{"maxRun": 9}` (as m04's) asserts the longest run without a choice so far; every route now ends with it. The said/notSaid fix above.

Updated for the new debrief picks (both branches of each beat are used across the set), the renamed Satoshi choice, and expectations that quoted changed lines: r1–r10, r12, r13, r15–r17, r21, r22.

New:
- `r24_worst_debrief_watch_strained_two_kos.json`: watch, strained, guard and Dani down, Priya walked through, Irina turned (cloned, notes) then down, Kemal passed on Volkova's word, stance "wondered", the ideology pick. Two runs of exactly 9 (before the Irina choice and after the Satoshi beat).
- `r25_worst_debrief_three_kos_detained_seized.json`: freeze, all three staff down (no Priya line), Kemal down, Irina detained and collected (lent badge, notes), Satoshi down, safe and signing case open; the other branch of each new beat. One run of 9.
- `r26_direct_reveal_exec_badge_floor_reacts.json`: D6-2 badge scene, D6-1 direct reveal, Dani and Priya after the detention and the collection (D6-5), Satoshi's pitch once, then the one-line returns across page reloads (D6-21), the freeze sneer rewrite and the trimmed finale.
- `r27_refused_then_evidence_after_reveal.json`: direct reveal, refusal (D6-9), time, back out (D6-10), then the write-up goes to her answer, not a second reveal; the turned re-entry after a reload (D6-12).

27 of 27 routes: all expectations met, including `maxRun` 9 on each. Longest runs: debrief 9 (was 18), Irina 9 (r3, unchanged), briefing 8, Satoshi 8 (was 10).

#### Checks (static; no browser session)

- Ink compiles (9 files, 0 failed, no loose ends).
- Validator with ink, `--no-graph`: schema passed, all ink valid, geometry and doors OK; the same warnings as before (three repeatable cutscenes, 20 duplicate-pattern notes, credits suggestions). The erb wasn't touched by this cycle.
- dialoguelint: no findings (`Totals by rule: none`). The first pass flagged Priya's cue density at 5 in 69; the new "*quietly*" was cut.
- reopencheck: m06 HaX phone, 1800 reopens, 0 problems.
- tagdiff `--old` against the snapshot: guard and minder structure unchanged; debrief 37, Irina 19, trader 15, analyst 10, phone 9, Satoshi 12, briefing 4 differences. Every one is in the table above: the new `exchange_aftermath` knot and the two choice pairs, `mission_conclusion` gone, the moved minder and asset conditions, the strained-cover letter branch and the Priya condition; Irina's `shown_signature`, latch clears, reveal and refusal branches and the evidence re-route; the `irina_news` reactions and their declarations; the phone's three first-call options; `pitch_heard`; the removed dead locals.
- inkcheck (debrief strained and turned; Irina with fund and evidence; Satoshi with fund and keys) and loopcheck over 40 entry-and-state runs (three debrief extremes; Irina fresh, low-trust with fund, refused with time, hub after the signature, turned, detained; Dani and Priya at `start` and `hub` in four Irina states each; Satoshi with fund, turned Irina, Irina KO'd, a return after the pitch; Kemal three entries; the phone fresh, strained, guard down; briefing; guard): no runtime errors.

#### Spoken lines changed (old → new)

No m06 audio exists yet; listed for the record. Choice text isn't voiced.

HaX, debrief:
- Cut: "We let it run. What's on that document is ours to stop now." / "The police and the lawyers decide what happens to her now. She knows that." / "The man in the corner office was Satoshi's Ghost. The Crypto Anarchists' own leader."
- "And then she went down on the trading floor. That's in the report as a mistake." → "…I'll be explaining that one upstairs."
- "She never looked at what it paid for until you put it in front of her." → "She'd looked. She just hadn't let herself read it. You made her."
- New: "Let him. The jury will have the allocation." / "Nothing his safe hadn't already told us." / "Not a word about The Architect. That's what his safe was for."
- "HashChain's finished. The police have the building and the mixer's dark." + "Every cell needs a new bank now, and they won't trust the next one for months." → "HashChain's finished and the mixer's dark. Every cell needs a new bank, and they won't trust the next one for months."
- "The exchange stays open for now, under watch. Shutting it would tell ENTROPY exactly what we're doing." + "The payout was pre-signed, so it goes out with him in a cell. Once it has, the police can have the rest." → "The exchange stays open under watch. His payout was pre-signed, so it still goes, and then the police get the rest."
- "His minder's in custody too. Thirty years guarding banks, and he finishes the night on a corridor floor." → "His minder's in custody too. He finishes a long career on a corridor floor."
- New: "His minder took Volkova's word for you, on the phone, with his boss behind the door."
- "Your cover didn't last the night. Somebody at HashChain rang the FCA, and the FCA had never heard of you." + "It didn't cost us the job. It might cost us the next one. The FCA will want a word with us." → "Your cover didn't last the night. The FCA had never heard of you, and that might cost us the next job."
- "The guard on the checkpoint was a contractor doing his job." → "The guard on the checkpoint has a wife who wants to know why he's in A&E."
- "None of them had done anything wrong. That goes in the report." → "None of them knew what HashChain was."
- New: "Raghavan will want to know what she was drawing. Somebody from the police will tell her. I'd rather it was you."
- "Map it, get on it, crack it, reuse it, move sideways, take the keys. A whole chain, and they'd left every link open." → "That's the whole chain, from outside to the keys, and they'd left every link open."
- New: "Short version, then. They left every link open." / "One more thing. The FCA wants to know who was using its name tonight, and it wants a letter. Three findings."
- "Their people will be glad you wrote it and not someone from the FCA. Read it again before it goes." → "One of those would stand up. Read it again before it goes."
- "Ours. He trained half the agents in the field." + "Satoshi only rates it eighty-seven per cent. Treat it as a lead." → "Ours. He wrote the training I gave you."
- "Eighty-seven per cent, by Satoshi's sum. Treat it as a lead." + "It fits, though. Tesseract trained half the agents in the field." → "Eighty-seven per cent, by Satoshi's sum. Satoshi doesn't round up."
- "If they do, we won't get much warning. Some of them are already paid for." → "If they do, we won't get much warning."

HaX, phone:
- New: "Then he'll ring the FCA. Get to Volkova before the answer comes back." / "Then somebody finds him soon. Get to Volkova before they do."
- "Try that password on every other account before anything clever. Someone will have reused it." → "Someone will have reused it. Try it on the other accounts first."
- "Try the password you have everywhere before anything clever." → "The password you have is the place to start."
- "The wallet is still yours to decide: freeze it, or leave it running and watch it." → "The wallet's still yours to decide. Freeze it, or leave it running and watch it."

Dr. Irina Volkova:
- Narrator "You put the fund allocation in front of her. She reads the per-cell lines, then the casualty line, then the signature." → "You show her the authorisation line on the fund page, and nothing else."
- New: "*quietly* You're not from the FCA. ...No. Don't tell me yet." / Narrator "Then the fund allocation, open at the casualty line." / "*reads it twice* I wrote the mixer so nobody could see where money went. Not so nobody could see this." / "The hospital money as well. All of it through my mixer, and all of it to that page."
- "Someone on the floor has been asking whether you are who you say you are. Until they stop, my badge stays on my neck." → "There's been talk about you tonight. Until it stops, my badge stays on my neck."
- "I won't turn on Satoshi on the strength of one conversation and a graph." → "I won't turn on Satoshi because a stranger put a badge on my desk." (first ask) / "I said I'd think. I'm thinking. It's slower than you'd like." (return)
- "For now." → "Don't take too long. He notices when I'm quiet."
- "What else do you need?" → cycle "What else do you need?" / "Ask, then." / "Quickly. He calls down at odd hours."

Dani Okonkwo, new: "Irina's on the floor and nobody's-- did you-- *stops* Don't answer that." / "*barely above a whisper* She's just sitting there. Are you allowed to tell me what's going on?" / "They walked Irina out past my desk. Am I next? Honestly, you can tell me."

Priya Raghavan:
- New: "Someone said Irina's been detained. Was it the graph? Was it my graph?" / "Someone said Irina's out cold on the trading floor. Was that to do with my graph?"
- "Big round sums, late evening, straight into the mixer. Same habit every time." → "Same habit every time. In, mixed, and gone by midnight."

Kemal Aydin:
- "This floor is closed. Who let you up?" → "Moin. This floor is closed. Who let you up?"
- Narrator "…A short exchange in German-accented English, then…" → "…A short exchange, then a longer silence on the other end."
- "Go in." (after the call) → "Na gut. Go in."
- "I gave thirty years to banks that stole politely. He at least says what he is." → "I guarded banks that stole politely. He at least says what he is."
- "I hoped you would say that." → "*takes off his watch and pockets it* Then come and move me."

Satoshi Nakamoto II:
- "Casualties are inevitable in any revolution." → "People die when systems change. They die when they don't, too. You just never count yours."
- "The system you protect kills people too. Slowly, with paperwork." / "We just make it visible." → "Everything justifies something. You just don't like my arithmetic." / "Your side freezes a country's reserves and the hospitals run out of insulin. Nobody writes that up as a casualty projection."
- Cut: "You don't understand our philosophy, do you?" / "You can't win. You can only choose how you lose." / "You'll let the money go to see where it lands. Bold." / "The idea will outlive her. It'll outlive me." / "ENTROPY has no head to cut off. The Architect will adapt." / "Whatever you chose tonight, you'll find out what it cost. So will I." / "She refused you, I presume? Good. Her loyalty held." (unreachable)
- "We're not terrorists. We're midwives." → "Look, every crash so far, the banks got rescued and everybody else got the bill. This time I'd like to choose who pays."
- "Too much conscience for an anarchist. I always knew." → "She wanted the privacy without the customers. Most people do."
- "Not everybody has the stomach." → "Most people want the freedom and none of the bookkeeping."
- "But I don't expect you to agree. You're SAFETYNET. You protect the status quo." → "You won't agree. You work for the people who'd lose the most if I'm right."
- New (returns): "Found my wallet yet? No?" / "You found the keys. So, which is it?" / "Freeze or watch. I'm still waiting."
- "The vault account. Of course. I'll be here; the door only opens one way for me now." → "The vault account. Of course. Go on. I'm not going anywhere, and neither is the money."
- Narrator "He claps, slowly." → "He watches it land, and smiles as if he'd sent it himself."
- "Short-term thinking. SAFETYNET's speciality." → "Twelve point eight million, gone on one agent's say-so. No court, no hearing."
- "The state takes your coins whenever it likes. You just proved it for me." → "That's the state I've been warning people about. You just proved it for me."
- "People tonight over people later. That's human. Wrong, but human." → "The names on that page over whoever my martyrdom recruits. That's human. Wrong, but human."
- "Patient. I didn't expect that from SAFETYNET." → "You'll let it run. I didn't expect that from SAFETYNET."
- "And the wallet you left running? We'll adapt. Your map gets older every day." → "And the wallet you left running? Enjoy the map while it's fresh."
- "Ask me in fifty years. You might find you were rearranging deckchairs." → "Murder's what they call it when you lose. The winners get statues."
- "That makes you more dangerous to us than the true believers." → "Hold on to that. It's how I started."
- "Of course not. Systems that can't question themselves don't." → "Sure. Nobody at your agency gets paid to wonder."
- "Still waiting for your police. Come to gloat, or having second thoughts?" → "Still waiting on your police. You want to argue some more, or just look?"
- "Time will tell." → "You made a call. I made mine a long time ago."

Not voiced (choices): "[He'll be making speeches at the trial.]", "[Did he give anything up?]", "[Walk me through it.]", "[I was there. Just the letter.]", "[How much goes through here in a day?]", "[The guard caught me at his door.]", "[The guard's down. It was him or the cover.]", "[Whatever hadn't gone out stays put.]", "[I made the right call.]".

#### Open after cycle 1

- Browser checks: Dani's and Priya's re-entry lines after a real detention, collection and KO (the reopen re-enters `hub`; the driver models that, the browser should confirm); Irina's badge scene and direct reveal; Satoshi's one-line return after a deferral and a reload; HaX's first call after a checkpoint catch and after a guard KO.
- D6-39 edge: talk past Kemal, then strain the cover, and the debrief credits Volkova. Needs a new global (`globalVariables` in the shared erb) if it's worth closing.
- The ink-comment gotcha for `README_ink_best_practices.md` (orchestrator; a shared doc).
- The user: the debrief's VM lines are unchanged in substance and still at the brief's level.

### Phase 4 dialogue, cycle 2

Review: `DIALOGUE_REVIEW_P5_C2.md` (Opus, read-only; 0 blockers, 1 major, 21 minors; cycle 1 confirmed: 42 fixed, D6-44 rightly left, D6-39 partly closed). Fixer: the same Opus agent, resumed. Each finding was checked against the ink first. No browser session; the do-not-open rule held. The erb got two small exact edits (re-read first): a `globalVariables` entry and the credits (D6-63, allowed this cycle).

**Correction to cycle 1's "ink gotcha".** It wasn't real. I edited `evidence_pivot`, then ran the routes and a direct inkjs test without recompiling, so both read the old JSON. The next compile came only after I'd moved the comment, which made the move look like the fix. inklecate compiles both forms identically (the orchestrator and the reviewer both confirmed this), and the README entry has been removed. Lesson: recompile before any runtime test.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D6-45 | major | Freeze branch makes "your freeze recruits for me" four times | **Fixed.** "Thank you. That'll recruit…" cut. `immediate_impact_response` is now one line, "The balances, sure. The advances went out a week ago, and nobody's asking for them back.", and "everyone on the fence…" is cut with it, since the review's replacement already carries its first sentence. The argument is kept, plus the casualty answer and the forum closer |
| D6-46 | minor | "[Just the letter.]" before the letter is mentioned | **Fixed**: "[I was there. Skip it.]" |
| D6-47 | minor | "None of them knew what HashChain was." contradicts Dani | **Fixed**: "None of them were in on it." |
| D6-48 | minor | Two "got knocked down for it" | **Fixed** (Priya: "woke up on the lab floor") |
| D6-49 | minor | "too" with nothing before it | **Fixed** (cut) |
| D6-50 | minor | "already paid for" before the credits stinger | **Fixed** |
| D6-51 | minor | Two "And…" lines | **Fixed** |
| D6-52 | minor | "never heard of you" ×4 | **Fixed** as proposed (Kemal, Satoshi, debrief); texts kept |
| D6-66 | minor | Watch outcome twice after "What's left of that clock?" | **Fixed** as proposed (`{operation_disrupted:` visit count; the debrief is one sitting) |
| D6-57 | minor | No-fund casualty line doubles the argument | **Fixed**: "You haven't seen the numbers. I have. They're smaller than you'd think." Route r29 |
| D6-58 | minor | Two stock compliments; "guess… guessed" | **Fixed** as proposed |
| D6-59 | minor | Present tense about a detained or downed Irina | **Fixed**: a new case in `corrupted_ideals` ("Irina thought so too. Look where it got her." → `choice_presentation`), made a multi-case conditional. A turned Irina keeps the recruited case first |
| D6-60 | minor | "neither is the money" vs "The money doesn't wait" | **Fixed** as proposed |
| D6-61 | minor | "map goes stale" then "map while it's fresh" | **Fixed** as proposed. r28(b) asserts it |
| D6-53 | minor | First meeting after Irina's fate | **Fixed** as proposed, with `irina_news` set to the matching level so the hub doesn't react again (asserted in r29). Priya's first-meeting line drops the cue (the lint counted it, 5 in 71). Her exit "[I'll find Dr Volkova, then.]" is hidden in that case, so a new exit "[I'll leave you to it.]" → "Cheers." keeps the meeting closable |
| D6-54 | minor | Dani and Priya share phrases | **Fixed** ("like clockwork") |
| D6-55 | minor | Three reactions to the deaths; subtext never paid off | **Fixed** as proposed: "I told myself this was about privacy… Not... this." cut from the fund branch, and "I asked you not to tell me." after the credentials when `shown_signature`. r26 asserts it |
| D6-56 | minor | "through the mixer she wrote" twice | **Fixed** |
| D6-62 | minor | "start" two lines running | **Fixed** |
| D6-64 | minor | "Dr." in choices | **Fixed** (three choices) |
| D6-63 | minor | Kemal precedence edges (a) and (b) | **Fixed** as proposed. New synced global `minder_vouched` (erb `globalVariables`, and m06's block of `missions.json`), set in `irina_vouches`. Debrief case `- minder_vouched:`. Satoshi opener "Kemal rang Irina, and she vouched for you. So that's where she's gone." Credits: "Talked your way past him" now needs `!minder_vouched`, and there's a new entry "KEMAL AYDIN (MINDER): Let you in on Volkova's word" |
| D6-65 | minor (test gap) | No route for the no-fund casualties line or the Kemal edges | **Fixed**: r28, r29 |

#### Routes

New:
- `r28_kemal_vouch_edges.json` covers two cases. (a) The FCA talk-past, then Dani KO'd with Irina turned: Satoshi says "you must have been convincing", the debrief says "I'd like to hear what you said to him", the credits say "Talked your way past him", and nothing credits Volkova. (b) The cover holds, picks are caught, Volkova vouches: the Satoshi opener, "took Volkova's word", and the new credit, with "Talked your way past him" absent. Also asserts the D6-45 and D6-61 lines.
- `r29_no_fund_satoshi_casualties.json`: Irina down early. Dani's and Priya's first meetings, with no second reaction on the reopen (D6-53). Satoshi without the fund (D6-57, D6-58, D6-59), then a deferral.

Updated for the new choice wording and lines: r3 (now Kemal's vouch route: new opener and credit), r4, r7, r13, r16, r17, r22 (D6-66), r23, r24 (`minder_vouched` added to its globals, since it models Volkova's word), r25, r26 (D6-60 line, D6-55 payoff).

29 of 29 routes pass, each with `maxRun` 9. Longest run: 9 (debrief on r6, r21, r24 and r25; Irina on r3).

#### Checks (static; no browser session)

- Ink compiles (9 files, 0 failed, no loose ends).
- Validator with ink, `--no-graph`: schema passed, all ink valid, the same 14 warnings and suggestions as before.
- dialoguelint: no findings (after the Priya cue cut).
- reopencheck: m06 HaX phone, 1800 reopens, 0 problems.
- tagdiff against HEAD (cycle 2 only): debrief 5, Priya 14, Dani 10, Satoshi 4, Kemal 3, Irina 1; guard, briefing and phone unchanged. All are listed above: `minder_vouched` declared in four files and set in `irina_vouches`; the debrief's `minder_vouched` case and the D6-66 condition; the first-meeting branches, `irina_news` assignments and the guarded or new first-meeting choices (D6-53); Satoshi's `corrupted_ideals` case; Irina's `shown_signature` payoff condition. Against the snapshot: debrief 40, Dani 25, Priya 24, Irina 20, Satoshi 16, phone 9, briefing 4, Kemal 3.
- loopcheck on Dani and Priya at `start` with Irina detained, collected and knocked out; Priya fresh; Satoshi with Irina detained, and with `minder_vouched`; Kemal's `on_lockpick_seen` with Irina turned; Irina's hub after the signature; the debrief with `minder_vouched` and fresh. inkcheck on the debrief (watch) and on Satoshi (Irina KO'd). No runtime errors.

#### Spoken lines changed (old → new)

No m06 audio exists yet.

Satoshi Nakamoto II:
- "Somebody here rang the FCA tonight. They've never heard of you." → "Somebody here rang the FCA tonight. You're not on their books."
- New: "Kemal rang Irina, and she vouched for you. So that's where she's gone." / "Irina thought so too. Look where it got her."
- "You've seen enough of my exchange to guess. You haven't found my wallet, but you've guessed." → "You haven't found my wallet. But you've seen enough of my exchange to guess."
- "You found the allocation. Thorough." → "You found the allocation."
- "People die when systems change. They die when they don't, too. You just never count yours." → "You haven't seen the numbers. I have. They're smaller than you'd think."
- "…Go on. I'm not going anywhere, and neither is the money." → "…Go on. I'm not going anywhere. The money is, in three days."
- Cut: "Thank you. That'll recruit better than anything I could write." / "And everyone on the fence just climbed down on my side."
- "The balances, sure. The advances went out a week ago." → "…a week ago, and nobody's asking for them back."
- "Maybe. Or we open new channels and your map goes stale." → "Maybe. Cells move house. We've done it before."

HaX, debrief:
- New (watch, after the clock): "They don't know we're watching. Whatever the money buys goes ahead unless we get there first."
- "She went down on the trading floor after you'd detained her. The police carried her out. That's in the report too." → "…The police carried her out."
- "And you read her notes first. Good. Know what they've already told themselves." → "Reading her notes first was good work. Know what they've already told themselves."
- "Your cover didn't last the night. The FCA had never heard of you, and that might cost us the next job." → "Your cover didn't last the night. HashChain rang the FCA, and that might cost us the next job."
- "Raghavan drew us the money, and got knocked down for it." → "Raghavan drew us the money, and woke up on the lab floor."
- "None of them knew what HashChain was." → "None of them were in on it."
- "We find out which of them moves first. Some of them are already paid for." → "We find out which of them moves first, and get there before it does."

HaX, phone: "The password you have is the place to start." → "Try the password you already have."

Kemal Aydin: "Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name." → "…The FCA has no file on you."

Dr. Irina Volkova:
- Cut (fund branch of the evidence scene): "I told myself this was about privacy. Financial freedom. Not... this."
- New: "I asked you not to tell me."
- Narrator "You lay Priya's write-up on her desk. Money in from the cells, money back out, all of it through the mixer she wrote." → "…money back out."

Dani Okonkwo:
- New: "You're the regulator? Is this about Irina? *glances at her desk* I don't know anything. Honestly."
- "…Big round sums going in late at night. Same wallets, same habit." → "…Same wallets, like clockwork."

Priya Raghavan: new "If you're here about Irina, I just draw the pictures."

Not voiced: choices "[I was there. Skip it.]", "[I'll leave you to it.]" (Priya), "[I need an answer, Dr Volkova.]", "[There's something you need to see, Dr Volkova.]", "[What's Dr Volkova like to work for?]"; the credit "KEMAL AYDIN (MINDER): Let you in on Volkova's word".

#### Open after cycle 2

- Browser checks (carried over, plus Kemal's vouch): Dani's and Priya's reactions after a real detention, collection and KO, and a first meeting after one; Irina's badge scene, direct reveal and the new payoff line; Satoshi's return after a deferral and a reload; HaX's first call after a catch and after a guard KO; Kemal's vouch route and its credit.
- The user: the debrief's VM lines are still unchanged in substance and at the brief's level.

### Phase 4 dialogue, cycle 3 fixes

Review: `DIALOGUE_REVIEW_P5_C3.md` (0 blockers, 1 major, 1 minor; all 22 cycle-2 findings confirmed). Verdict: close once these are fixed and the browser checklist passes. Fixer: the same agent, resumed. No browser session; no erb edit.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D6-67 | major | A direct reveal never set `moral_conflict_revealed`, so a detention straight after "*reads it twice*…" got "This is the state overreach we warned people about." (9 routes) | **Fixed** as proposed. `~ moral_conflict_revealed = true` in `reveal_identity`'s direct branch, and `detain_irina` collapsed to "*offers her wrists* I really did think I was building something good." (the defiant line is cut; it could no longer play anywhere it fit). r2, r5, r7, r9, r12, r16, r17, r22 and r26 now assert the wrists line and `notSaid: "state overreach"` |
| D6-68 | minor | Two "You haven't…" openers, and the wallet point twice, on the no-fund route | **Fixed**: "You've seen enough of my exchange to guess." r29 updated, with `notSaid` on the old opener |

Side effect: with the defiant branch gone, nothing reads `moral_conflict_revealed`, and the validator now gives a 💡 suggestion (set, never read). It's harmless. Removing it would mean dropping the two ink writes, the `VAR`, and the erb `globalVariables` entry; that's left for the orchestrator.

#### Checks (static; no browser session)

- Ink compiles (9 files, 0 failed, no loose ends).
- tagdiff against HEAD: Irina 3 differences (the new assignment in `reveal_identity`, and `detain_irina`'s two conditions removed); every other file's structure unchanged. That matches the review's expectation.
- Routes: 29 of 29 pass, each with `maxRun` 9.
- dialoguelint: no findings. reopencheck: m06 phone, 1800 reopens, 0 problems. Validator with ink, `--no-graph`: schema passed, all ink valid; the one new suggestion is noted above.
- loopcheck: Irina (low trust, fund found) and Satoshi (fresh): no runtime errors.

#### Spoken lines changed (old → new)

- Irina, cut: "This is the state overreach we warned people about." (every detention now gets the existing wrists line).
- Satoshi: "You haven't found my wallet. But you've seen enough of my exchange to guess." → "You've seen enough of my exchange to guess."

## Phase art: room dressing

The full log is in `ROOM_DRESSING.md`, with evidence in `build_evidence/dressing_c1..c5`.
- Cycles 1–5 gave m06 its own HashChain Exchange building: nine `room_hce_*` maps at the old sizes.
- Every scenario object sits on a fixture (`slot_audit`: 0 problems, down from 5).
- The m11 layout needed no connection change. The data centre carries an EXECUTIVE SUITE plate, and the two server rooms now look different.
- The orchestrator approved two changes:
  - the press clipping is read in place, and in game 2328 it stays on the wall through read, then dust, then the Signing Case;
  - Priya moved to (6,4).
- The guard's and Kemal's sight windows are unchanged (`dressing_c1/cone.py`).

### Phase art: room dressing CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 | 1 | 6 | 2 |
| 2 | 0 | 7 | 13 |
| 3 | 0 | 2 | 8 |
| 5 (review and interaction walk) | 0 | 1 | 13 |

Nothing above minor remains. The first-room sign-off is still pending (D8). Next: lighting, then POV backgrounds.

**Dialogue closing browser check (PASS5_DIALOGUE_BROWSER, games 2331, 2335, 2343, 2347, 2351):** 7 of 7 pass, with 0 blockers, 0 majors and 0 minors. Two nits are carried to the playtest stage:
- P5D-2: HaX's first-call preload says "You're inside." at the checkpoint.
- P5D-3: Priya's credit wording.

The black conversation backgrounds are expected; the POV stage comes after lighting.

### Phase 4 dialogue: CLOSED (2026-10-13)

| Cycle | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 6 | 38 |
| 2 | 0 | 1 | 21 |
| 3 | 0 | 1 | 1 |
| Browser | 0 | 0 | 0 |

29 routes, each run limited to 9 lines without a choice.


## Lighting (2026-10-13)

The full log is in `LIGHTING_PLAN.md`, with evidence in `build_evidence/lighting_c0..c4`.
- A night at the exchange:
  - a warm lobby;
  - a trading floor carried by the market wall and screens;
  - Irina's office dark with her lamp (motion);
  - mining-rig glows in the lab;
  - a cyan server room and data centre (motion), with the custody cage lit;
  - a low-lit gallery in the executive wing;
  - Satoshi's lamp and block screen.
- Phases:
  - The custody console answers strikes: amber, then red, then green when the fund opens.
  - Freezing the money turns the ticker, the market wall and the block screen red.
  - Watching the money changes nothing, on purpose.
  - The design review dropped a `cover_strained` light change, because the building gives it no cause.
- No engine change. The rack-style LEDs proposal is D9.

### Phase art: lighting CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| Design review | 0 | 3 | 9 |
| 2 | 0 | 3 | 8 |
| 3 | 0 | 0 | 6 |
| 4 | 0 | 0 | 6 |

Two visual reviews in a row found nothing above minor. Next: POV backgrounds.
