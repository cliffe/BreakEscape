# m06 Follow the Money: scenario design review, pass 5, round 1

Reviewer: fresh Opus agent, read-only (2026-10-13). Skill: `scenario-design-review`, run in full. Static review: no browser session was started.

Kind of game: a SAFETYNET campaign mission, judged as a TV spy thriller whose VM flags are required and woven into the story. Teaching comes through the VM work and the field guides.

Sources: `scenario.json.erb` and the nine `.ink` files at HEAD 9b00bc1b (puzzle chains closed; the m06 tree is clean), `mission.json`, `IMPROVEMENT_LOOP_LOG.md`, and m04's two scenario design rounds for the bug classes. Engine reads were limited to the music condition evaluator and the conversation-state store. The SecGen XML, the four listed field guides, the exploit detail in `VM_INTEGRATION.md` and the sight-challenge source were not opened. Any VM claim below is "needs checking against SecGen by the user".

## Step 1: the tools

### Route driver (all 18 routes)

`node scripts/ink_runtime_check/m06_routes/route.js <file>` for r1 to r18: every route reports `[result] all expectations met`, exit code 0, and none reports an unsupported condition term. The compiled ink JSON (18:05) is newer than every `.ink` file, so the routes ran the current ink.

Three scratch routes were written for this review (in the session scratchpad, not the repo). Their results are cited as findings below.

### Validator (`--skip-ink --no-graph`)

Schema passed. No unknown fields. Room geometry OK, door alignment OK.

- 20 "multiple onceOnly handlers on one pattern" notes on `agent_0x99_handler`. These are the known per-cause texts and side effects (logged as noise in earlier rounds). I re-checked the two that matter for this round: the three `minigame_failed` console mappings (erb 1302-1321) are disjoint on `console_warned` and `cover_strained`, and the five `npc_ko:irina_volkova` mappings split on fate (erb 1131-1159) plus the strain text.
- 3 "cutscene without onceOnly": the guard's and Kemal's sight challenges. Deliberate (they repeat until a skip global ends them).
- 1 "2 items point to server_room": the checklist and Irina's wordlist. Intended (they are two halves of one clue).
- 2 "no behaviour": Netherton and Nightshade, hidden briefing co-speakers. Deliberate.
- Suggestions: ASSETS and PERSONNEL credit sections have no unconditional line. PERSONNEL always prints one of Satoshi's two complementary lines. ASSETS always prints FROZEN or WATCHED, because the call-in needs `assets_decided`. Both are safe.

### dialoguelint

0 findings ("Totals by rule: none").

### Condition syntax (`||` and nested `data.` paths)

- No NPC `eventMappings` condition in m06 uses `||`, a nested `data.a.b` path, or a nested `globalVars.a.b` path. The console mappings use the bare `data.result` term (erb 1302-1321), which the evaluator supports.
- The only `||` in the file is the music trigger at erb 129 (`typeof restored === 'undefined' || !restored`). Music and credits conditions go through `new Function` (`js/music/scenario-music-events.js:34-48`), which supports full JS, so this is fine. It is not an NPC mapping.
- The route driver's port of the NPC evaluator reported no unsupported terms on any route.

Verdict: clean.

## Verdict

The mission is solvable on every branch I traced, and no NPC knockout at any point strands it. Objective scaffolding is good: a task or a HaX text follows every major beat, with two gaps, both in the late game (R1 and R2 below). The debrief and credits agree on almost every KO and fate combination. Four small disagreements remain, each on a route the existing drivers already reach.

The one major finding is reload resilience. Irina's first meeting is keyed on an ink-local VAR, so a page reload before her fate is settled makes her greet the player as a stranger, and her trust resets to zero. Satoshi has the same bug on the "come back with the keys" route.

**Counts: 0 blockers, 1 major, 12 minors.** There are also 7 items that need checking against SecGen by the user.

## Severity table

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| M1 | **major** | **A page reload replays Irina's first meeting and resets her trust.** `first_meeting`, `irina_trust`, the once-only trust topics and `recruitment_refused` are ink-local. Conversation state is held in an in-memory Map (`npc-conversation-state.js:12`), so a reload loses all of it. Scratch route x1: meet her, reload, talk again. She opens with "You must be the FCA. Dr. Irina Volkova, Chief Technology Officer." and re-offers the three openers. Trust earned before the reload is gone, so the badge loan (trust 25/35) and the pitch (35) have to be re-earned. A refused pitch can be re-tried after a reload. This happens on every reload before her fate is settled (`irina_fate_decided` diverts to `after_choice`), which covers the whole first half of the mission. | Irina ink 44, 53, 88-99; erb 901-904 (`exchange_infiltrated` set on her first close) | In `start`, key the scene on the synced global: declare `VAR exchange_infiltrated = false` and use `{first_meeting and not exchange_infiltrated: -> first_meeting_scene}`. When `first_meeting` is still true but `exchange_infiltrated` is set (a reload), restore a trust floor before the hub: `~ first_meeting = false` then `{irina_suspicious: ~ irina_trust = 0 - else: ~ irina_trust = 15}`. If a refused pitch should stay refused, make `recruitment_refused` synced (declare it in `globalVariables` and in `missions.json`, and write it with `#set_variable` beside the `~`). Add a route with a reload between meeting her and borrowing the badge. Browser check owed. |
| m1 | minor | **R1: a second console strike, with the cover already strained, sends no HaX text.** Strike 2 runs mapping 1 (`console_tripped`, silent) and skips mapping 2 (`cover_strained !== true`). The player was told "One more and somebody's phone goes." and then nothing happens on screen. The cost only shows up in the credits and the debrief. | erb 1302-1321 | Add a mapping **before** mapping 1 (array order matters, as the erb comment explains): `"eventPattern": "minigame_failed"`, condition `data.minigameName === 'PinMinigame' && data.result && globalVars.at_console === true && globalVars.found_architects_fund !== true && globalVars.console_warned === true && globalVars.console_tripped !== true && globalVars.cover_strained === true`, onceOnly, `"sendTimedMessage": { "delay": 2500, "message": "Another wrong slot, and it's logged. They already know we're inside. Now they know where we're looking.", "skipIfGlobal": "assets_decided" }`. Placed first, it can't co-fire with the strain text, because `cover_strained` is read before mapping 2 sets it. The `console_tripped !== true` term keeps it to the second strike. The last sentence matches the debrief's "ENTROPY will know exactly where we looked". New route r19: strain the cover by another cause, strike twice, expect this text and no strain text. |
| m2 | minor | **R2: after Kemal's stand-off with the cover strained, nothing on screen says how to get past him.** With Irina not turned, the stand-off offers "step aside or I'll move you" and "(Back off)". The pick in his blind window is mentioned only in the phone recap, and only to a player who asks. The stand-off itself still hasn't been played in a browser (log, carried R2). | minder ink 78-86, 136-152; phone 329-335 | Add a HaX mapping on `conversation_closed:satoshi_minder`, condition `globalVars.cover_strained === true && globalVars.minder_challenged === true && globalVars.minder_passed !== true && globalVars.minder_hostile !== true && globalVars.minder_ko !== true && globalVars.satoshi_confronted !== true && globalVars.irina_recruited !== true`, onceOnly, delay 2500: "He won't take the FCA from you now. Watch his walk. When his back's turned, that door's an easy lock." Add the stand-off to the browser checklist: back off, then pick unseen; square up and fight. |
| m3 | minor | **A reload replays Satoshi's whole opening.** `confrontation_started` is ink-local. HaX and Satoshi both send the player away to fetch the recovery keys ("Not yet. I'll be back with the recovery keys"), so this route invites a reload. Scratch route x2: defer, reload, return. The narration and "Your paperwork was good. I had you checked anyway." play again, with the four opening choices. | Satoshi ink 14, 50-55 | Change the opening condition to `- not confrontation_started and not satoshi_confronted:` and declare `VAR satoshi_confronted = false` (synced; already written at :55). The re-entry then takes the existing `not asset_choice_made` branch ("Back again." then the decision). |
| m4 | minor | **"Traced through the mixer" is claimed for a player who never had Priya's write-up.** The write-up is required by aim 2 but not by the ending: aim 3 opens on entering the server room, and aim 4 on flag 3. A player who skips the lab and lands the console in one or two tries gets the credit "TRACED THROUGH THE MIXER" and HaX's "You traced the fund yourself. In through the mixer, out by amount and time." The same debrief then says "Without Priya's write-up we're missing a few links." Route r6 prints TRACED and PARTIALLY MAPPED together. | erb 170, 175; debrief 116-122, 449-452 | Credit: add `&& globalVars.found_blockchain_evidence` to the TRACED line, and add "THE ARCHITECT'S FUND: $12.8M — FOUND ON THE CONSOLE" for `found_architects_fund && !found_blockchain_evidence && !console_tripped && !irina_confirmed_slot`. Debrief: add a branch before the `else` at :120, `- not found_blockchain_evidence:` "You found the slot on the console without Priya's write-up. Lucky, or good. The file will say lucky." |
| m5 | minor | **A turned Irina who is then knocked out gets the plain "Turned" credit.** HaX's KO text and the debrief both call it a mistake. The credits say only "Turned — gave up the mixer tonight". Round 2 fixed the same gap for the detained case (R2-m9), but not for this one. Route r6 shows it. | erb 190, 1148-1152; debrief 200-203 | Add `&& !globalVars.irina_ko` to the turned line, and a new line for `irina_recruited && irina_ko`: "DR. IRINA VOLKOVA: Turned, then knocked down — what she gave still stands". |
| m6 | minor | **The debrief talks about the payout in the past tense at 4 a.m. on the same night.** The release fires 72 hours after signing. HaX says "The clock ran down on an empty wallet." (freeze) and "The payout went out on time, and every wallet it reached is tagged." (watch). Later the same debrief says "it goes out with him in a cell. Once it has, the police can have the rest." (future), and "They also have the money." | debrief 103, 105, 149, 315 | 103: "You froze it before the payout. When the clock runs out, it runs out on an empty wallet." 105: "You let it run. When the payout goes, every wallet it reaches gets tagged." 149: "They'll have the money in three days." Spoken lines; no m06 pass-5 audio yet. |
| m7 | minor | **The debrief gets the way in wrong and doesn't reflect on the exposed service.** HaX's own text says "A build service is listening that shouldn't be: that's your way in." The distcc guide's give line says the service "just gets you on the box". The debrief says "One cracked password got you onto their backend". The FCA letter's seven real findings cover passphrases, shared passwords, the door account, the key account, compliance and badges. None covers the service the player came in through, which is the mission's MAT topic (the m04 R1 M1 class, smaller here). | debrief 365; erb 1006; phone 641-646; debrief 377-410 | 365: "A build service nobody had switched off got you onto their backend. One cracked password, and the same password opened a second account." Add one real finding to the FCA letter: `* [A build service on their backend runs whatever it's sent.]` with `~ fca_right += 1`. That makes ten options with three picks, so the knot still can't run dry. Keep the wording at this level, and have the user check it against SecGen (S1). |
| m8 | minor | **"Only Satoshi thought to check" is said to a player who never heard him say it.** With the cover held, the debrief says "Only Satoshi thought to check, and by then you were at his desk." That calls back to Satoshi's opener, "I had you checked anyway". A player who knocks Satoshi down before he speaks never hears the opener (`satoshi_confronted` is set by the KO mapping too, so it can't tell the two cases apart). | debrief 340-343 (scratch route x3 prints it); Satoshi ink 54-65; erb 1174-1181 | Add a synced `satoshi_spoken`: write `#set_variable:satoshi_spoken=true` beside `#complete_task:confront_satoshi` (Satoshi :54), and declare it in `globalVariables`, `missions.json` and the debrief. In the debrief's `else`: `{satoshi_spoken:` the current line `- else:` "And the cover held. Nobody at HashChain thought to ring the FCA." `}`. |
| m9 | minor | **The privilege-escalation guide promises one thing and its sheet is titled another.** The item, the menu label and the give line all say "Privilege Escalation and Credential Reuse". HaX's flag-1 text offers "a credential reuse guide". The sheet at that `labUrl` is titled "SAFETYNET Field Guide: Privilege Escalation via Sudo" (title line only read). The distcc item is "Exploiting distcc" against the sheet's "distcc Exploitation" (cosmetic). Same class as m04 m16. | erb 820-826, 810-816, 1038; phone 618, 650-657 | Rename the item and menu to the sheet title ("Privilege Escalation via Sudo"). Reword the flag-1 text: "First account's yours. People here reuse passwords, so that one opens more than one door. When you need root, I've a guide." Keep the credential-reuse advice in the give line, which already points at the rack sheet. Whether the m06 route needs sudo escalation needs checking against SecGen (S5). |
| m10 | minor | **After a reload, nothing reminds a warned player that the next wrong slot costs something.** Phone history is memory-only, so HaX's first-strike text is gone after a reload (phone 202-204). The recap's console lines say nothing about the strike. The console's observation does mention the on-call phone, which partly covers this. | phone 302-310; erb 1316-1321 | In the recap's `flag3_submitted and not found_architects_fund` block: `{console_warned and not console_tripped: That console's logged one wrong slot already. Another and somebody's phone goes.}`. Declare `console_warned` and `console_tripped` as VARs in the phone ink (both synced). |
| m11 | minor | **The status recap gives the whole passphrase recipe.** "Remind me where we are" is a status topic, not a graded hint. Any player who has the wordlist or the checklist and asks it hears "The checklist at the checkpoint gives the year. The term is whatever tops Volkova's list.", which leaves nothing to work out. | phone 286-289 | Recap: "The server room door follows their house rule. The checklist has the rule; Volkova's list has the words." Leave the explicit version in the passwords hint (`password_help`), where asking for help is the point. Worth considering, not required. |
| m12 | minor | **Other first-meeting openers replay after a reload.** Dani ("You're the regulator, yeah? FCA?"), Priya and the guard (narration and "Evening. Floor's restricted.") are keyed on ink-local VARs. Kemal's `minder_met` and `saw_picks` reset too, so after a reload he takes the FCA line again following a seen pick (the ink comment at :34 accepts this). | trader ink 10, 25; analyst ink 14, 29; guard ink 46-52; minder ink 32-34, 49 | Key each opener on a synced global that already exists: trader `{first_meeting and not trader_spoken:`, analyst `{first_meeting and not analyst_spoken:`, minder `{not minder_met and not minder_challenged:`. Leave the guard and `saw_picks` as accepted. |

### Needs checking against SecGen by the user

These are the in-game claims about the VM. I can't confirm them without the files I was told not to open.

| # | In-game claim | Where |
|---|---|---|
| S1 | The backend's way in is an exposed build service, and it carries no flag | erb 1006 (HaX text), 810-816 (guide), phone 641-646; the m7 line once written |
| S2 | Flag 1 is a password cracked offline from a readable shadow file | erb 346-355 (task title), phone 632-638 (guide give line) |
| S3 | Flag 2 is the same password reused on a second account; the rack sheet says the auth and ledger service accounts share one | erb 357-366, rack sheet (erb 1797), 1041-1047 |
| S4 | Flag 3 is the financial database account, and flag 4 is the vault account that "takes the whole estate" | erb 368-389, 1048-1060 |
| S5 | The "Privilege Escalation via Sudo" sheet matches what the route needs (m9) | erb 820-826 |
| S6 | The debrief's four-flag summary | debrief 362-367 |
| S7 | The flag order: the game lets any flag land first, and the VM side needs checking | erb 1035-1060 |

## Step 2: design review

### 2a. Solvability trace: OK

The critical path, with every alternative I traced, checked against the erb and ink:

1. **Checkpoint.** Talk past the guard (FCA plus the CTO's name gives `#unlock_door:trading_floor`), pick the easy key lock in his blind window, or knock him out (erb 1499-1545). None of these is needed downstream: HaX's `room_entered:trading_floor` sets `guard_resolved` (erb 985-991).
2. **Server room passphrase.** The checklist (checkpoint, erb 1552-1565) gives the rule. Irina's wordlist gives the word, from her, from her desk once she's detained, or as HaX's relayed copy after a KO (Irina ink 192, 602-610; phone 504-508). `find_server_credentials` completes on entry, so a correct guess never strands it (erb 1016-1021).
3. **Backend.** The launcher completes `access_hackme_vm` on use. The four flags have `targetFlags`/`targetCount` (erb 346-389). Each flag global is set by an `objective_task_completed` mapping (erb 1035-1060); nothing relies on `emit_event`.
4. **Data centre.** PIN 3110 is in the door-controller export that flag 3 pays out (erb 1766-1777, 1812).
5. **The fund.** The custody console takes the deduced slot. I re-checked the arithmetic: each ENTROPY deposit, less 1.5%, lands in 4471 at least six hours later (15 Jul 04:20, 30 Jul 05:05, 04 Aug 03:35). Every decoy fails on the fee or the hold. A turned Irina narrows the slot and confirms one the player names. Strikes cost the cover once and the credit; they never block.
6. **Executive badge.** Irina hands it over once the fund is found, whatever her fate (Irina ink 210, 593). A KO drops it beside her; if she's KO'd or taken, HaX relays a copy (phone 164, 516-520).
7. **Satoshi's door.** Kemal's talk-past (cover held), a turned Irina's word, his dropped key after a KO, or a pick in his blind window.
8. **Decisions.** Satoshi's choice, or the phone after his KO (erb 1174-1189, phone 523-561). Irina's fate is settled by a turn, by detention or by a KO.
9. **Call-in.** Once both decisions and all four flags are in, `ready_to_extract` latches. "Bring me in" sets `start_debrief_cutscene`, and the debrief's `hear_debrief` completes the conclusion aim (erb 1405-1425, phone 570-597).

No circular dependencies. Against `SOFTLOCK_PATTERNS.md`:
- S1 (burnt first-call gate): no. HaX's first call is flavour; a late first open goes to the recap.
- S2 (order dependence): flag 4 before or after Satoshi (r15), Irina KO'd before meeting (r6), early-KO badge before the fund (r18). All complete.
- S3 (said but not set): none found.
- S4 (premature `#complete_task`): `meet_irina` and `confront_satoshi` complete at the top of their scenes, which is intended. `hear_debrief` completes on the debrief's last line.
- S5 (sticky options over exhausted content): Irina's and Satoshi's sticky choices lead to resting knots. The FCA letter knot has nine once-only choices for three picks.
- S6 (unreachable setter) and S7 (lock waits on a past event): the call-in latch has 13 trigger patterns, including every room entry, so it can't wait on an event that has already gone.

**Promises the scenario can't keep:** none that affect solvability. The release record, the clipping, the safe, the console, the export and the recovery keys all exist where the ink says they are.

### 2b. Clue distribution: OK

| Secret | Sources (room) | Earliest point |
|---|---|---|
| Server room passphrase | Checklist rule (checkpoint); Irina's wordlist (floor, or HaX's copy); HaX's texts and recap | Checkpoint |
| Data centre PIN | Door-controller export from the flag-3 payout (server room) | Flag 3 |
| The fund's slot | Priya's write-up (lab); settlement log, pool config and custody index (data centre); turned Irina narrows and confirms (floor); HaX's graded nudges | Lab, then data centre |
| Executive badge | Irina (floor), her KO drop, HaX's relay | Fund found |
| Satoshi's door | Kemal's talk-past or key (wing); a pick | Wing |
| Safe 2140 (optional) | Priya's margin (lab), the clipping's motive (wing), Irina's email (her office); turned Irina says it | Lab |
| Signing case (optional) | Satoshi's thumb on the clipping glass (wing) | Wing |

Clues are spread across six rooms and each comes before its lock. The deduction is fair: no item, task or aim names slot 4471 before the console opens it. The fund document's name only appears inside the console, and the release record names `1ARCHITECT9FUND`, not the slot. The flavour readables (brochure, trading report, manifesto, cold-storage procedure, custody index) each carry setting or point at the next step. There are no navigation-only notes.

### 2c. Educational coverage (CyBOK, from `mission.json`)

| KA / topic | Keywords | Taught through | Verdict |
|---|---|---|---|
| MAT Attacks and exploitation | Exploitation, frameworks, distcc, service vulnerabilities, RCE | The VM foothold; distcc and recon guides; HaX's terminal text | Covered in play. The debrief's reflection is wrong (m7) |
| SS Categories of vulnerabilities | Password cracking, credential reuse, shadow file | Flags 1-2; cracking guide; rack sheet; FCA letter | Covered |
| SS | CVEs and CWEs | Nothing names a vulnerability class or identifier | **Thin** |
| SOIM Penetration testing | Software tools, active pen testing | The VM work; recon guide | Covered |
| SOIM | Financial forensics, transaction analysis, follow the money | The console deduction (write-up, settlement log, pool config) | Covered well; this is the mission's best teaching beat |
| AAA Authentication | Brute force, user authentication, password cracking | VM cracking; the passphrase rule; the console punishing brute force | Covered |
| AAA Authorisation | Access-control misconfiguration, bypass | Database account runs the doors; one account holds every key; FCA letter | Covered |
| AB Models / MAT Malware | Kill chains, cyber kill chain | Nothing frames the night's steps as a chain | **Thin** |
| AC Applied cryptography | Cryptocurrency, blockchain analysis, wallets, password hashing | The mixer, cold slots, recovery keys, the freeze or watch choice; cracking guide | Covered |
| AC | Hash functions | Only by implication in password hashing | **Thin** |
| HF Human factors | Undercover ops, FCA cover, social engineering, recruitment | Cover strain; guard, Kemal and Irina talk-pasts; turning Irina | Covered well |
| CPS / AAA Physical and RFID/PIN | Physical access, RFID, PIN | Checkpoint lock, Irina's badge clone, executive badge, data-centre PIN, console, safe | Covered |

Three keyword groups are thin: CVEs/CWEs, kill chains, and hash functions. That's decision D1 below.

### 2c′. Field guides: OK, one naming issue

Six guides, each offered when the player first meets its obstacle, and each handed over on request through one "Send me a field guide" choice:
- lockpicking, on entering the checkpoint;
- RFID, on reaching the floor;
- recon, distcc and cracking, on using the terminal;
- privilege escalation, on flag 1.

The `*_guide_offered` and `*_hint_given` globals are declared and synced. All six `labUrl` files exist in HacktivityLabSheets (only filenames and `title:` lines were read). The one mismatch is the privilege-escalation guide's name and promise (m9). No guide covers the money trail, which is fine: the console has HaX's graded nudges instead.

### 2d. Narrative structure: OK

- The opening briefing is a `timedConversation` that waits for `game_loaded`, with `skipIfGlobal: briefing_played`. HaX's text on its close names the cover, Irina and the guard.
- The ending is the sweep, then the call-in, then the debrief at HQ, then the credits on the debrief's close. The concludeRequires gate (four flags) holds, because the call-in is only offered once `ready_to_extract` is set.
- Every major plot event has a HaX reaction: each flag, the write-up, the fund, each fate, each asset choice, the safe, the signing record, each KO, and each strain cause.

### 2e. Dungeon graph: OK

`dungeon_graph.md` (written after the erb's last edit): 59 puzzle nodes and 66 edges, 6 story nodes and 5 edges. Critical path: Establish Cover → Work The Floor → Crack The Backend → Map The Money → Reach The Top Floor → Settle The Account. There are no backwards edges, and the VM chain is connected.

One polish item, not counted: the lockpick's `puzzle_graph_unlocks` lists only `trading_floor` (erb 581-588), so the graph doesn't draw the pick route into Satoshi's office. Make it `["trading_floor", "satoshi_office"]`.

### 2f. Rooms: OK

Nine rooms, no dead ends. Every room holds a clue, a lock or an NPC that matters. Geometry and doors are validator-clean. Room types fit an exchange: reception, hall, office floor, servers, a CEO office.

### 2g. Objective scaffolding: OK apart from R1 and R2

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Text or chat at the transition |
|---|---|---|---|---|
| Establish Cover | 2 | 2 (briefing; HaX's text names Irina) | None | HaX's text on the briefing's close |
| Work The Floor | 4 (+3 optional) | 4 (checklist, wordlist, lab text, write-up) | Low: aim 3 opens on server room entry, whatever the write-up | Irina's close: texts at 4 s and 9 s |
| Crack The Backend | 5 | 5 (terminal text, a text after each flag) | None | Terminal text; each flag text names the next |
| Map The Money | 3 (+1 optional) | 3 (flag-3 text names the code and door; data-centre text frames the console) | Console strikes: R1 (strike 2, cover strained) and m10 (after a reload) | Fund text names Irina and the badge |
| Reach The Top Floor | 2 (+1 optional) | 2 | Kemal stand-off with the cover strained (R2) | Kemal's sight challenge; recap |
| Settle The Account | 4 (+1 locked optional) | 4 (Satoshi; per-decision texts; call-in text) | None | Per-decision texts; 13.5 s call-in text |

Every task title says what to do. Every aim description matches its tasks.

### 2h. KO resilience: OK (every NPC, at every point)

| Person NPC | Gates something required? | Fallback on KO | KO in debrief and credits | Verdict |
|---|---|---|---|---|
| Checkpoint guard | Trading-floor door | A KO'd guard never interrupts a pick; `guard_resolved` comes from HaX | Debrief staff line; credit "Knocked out at his own door" wins over "waved through" | OK |
| Irina, before meeting | `meet_irina` (opens aim 2) | `taskOnKO: meet_irina`; badges drop; HaX relays the wordlist and badges; fate settled by the KO | "Before we ever talked to her" text; `irina_ko_path` uses `exchange_infiltrated`; "Knocked down… before her part was settled" | OK |
| Irina, turned | Nothing (she has given what she gives) | Items drop; relays | Text and debrief say it was a mistake; **credit doesn't (m5)** | Minor |
| Irina, detained | Nothing | Items drop; relays | Text, debrief and credit all agree (R2-m9) | OK |
| Dani, Priya | Optional tasks only | `taskOnKO` on each | Debrief staff lines; KO credits | OK |
| Kemal | Satoshi's door | Drops `ceo_office_key`; the door is also pickable | Satoshi, debrief and credits agree (KO > hostile > passed > turned back) | OK |
| Satoshi | `confront_satoshi`; the asset decision | `taskOnKO`; HaX puts the decision by phone, with a sticky hub option and a re-open on re-entering his office | Debrief "still out cold…"; KO credit | OK. **m8**: the cover-held line assumes he spoke |

Win-condition independence holds: the call-in is HaX's phone, and the debrief is a hidden NPC. No KO can block either.

### Reload resilience: one major, two minors

Only synced globals survive a reload (conversation state is an in-memory Map, `npc-conversation-state.js:12`; phone history is memory-only).

| State | Synced? | After a reload | Verdict |
|---|---|---|---|
| Every gate global (flags, fund, badges, fates, cover, console strikes, `at_console`, `slot_checked_visit`, call-in, debrief) | Yes | Survives | OK |
| Irina `first_meeting`, `irina_trust`, trust topics, `recruitment_refused` | No | First meeting replays, trust resets | **M1** |
| Satoshi `confrontation_started` | No | Opening replays on the defer route | **m3** |
| Dani, Priya, guard, Kemal openers | No | Openers replay | m12 |
| Kemal `saw_picks` | No | FCA line works again after a seen pick | Accepted in the ink comment |
| HaX timed texts | No (memory-only) | Lost; the recap repeats what still applies, apart from the console warning | m10 |
| HaX `relay_*_sent`, `reacted_*`, `fund_hint_level` | No | Relays stay gated by the synced pickup globals; reactions and nudges can repeat | OK, harmless |
| Call-in confirm step | No | The hub offers the call-in again (r13) | OK |
| Mid-debrief reload | — | `hear_debrief` completes on the next room entry; no credits | Accepted (m03/m04 pattern, m04 R1 m17) |

### 2i. Debrief and credits against every route

I checked each conditional debrief line and credit against the routes that reach it. These agree on every route:
- the fund's three credits (Volkova's confirmation wins over a tripped console);
- the guard's four lines;
- Irina detained, detained then KO'd, and KO'd unsettled;
- Kemal's five lines, in the same order as Satoshi and the debrief;
- the cover held or strained;
- the staff KOs;
- the safe and the signing record;
- freeze or watch.

The four that don't agree are m4 (traced without the write-up), m5 (turned then KO'd), m6 (payout tense) and m8 (Satoshi never spoke). r6 reaches m4 and m5. Scratch route x3 (Satoshi knocked out on entry, cover held) prints the m8 line.

### m02, m03 and m04 lessons

| Lesson | m06 now |
|---|---|
| The deduction answer can't be handed over by a title, toast or NPC | OK. Nothing names 4471 before the console; Irina confirms and never says it; the level-3 nudge is the last resort |
| Red herrings cost something | OK. The first strike warns; the second strains the cover and changes the credit |
| Debrief and credits gated on what was done and seen, and agreeing | Four gaps (m4-m6, m8) |
| Next step on screen after every major beat | Two gaps (R1 = m1, R2 = m2) |
| Mappings exist only once the NPC's room loads | OK. Every story reaction is on HaX, who is always loaded. Irina's and Kemal's own mappings only matter in their rooms, and Irina's hide also re-runs on room entry |
| Two cutscenes on one event | None. The guard's and Kemal's sight challenges are in different rooms |
| Auto-opened phone chat can be closed by a hit (m04 m2) | Satoshi's KO opens the phone by itself. If it's lost, the hub keeps a sticky option and re-entering his office re-opens it, so nothing is stranded |
| An event the engine never emits (m04 n1) | OK. The console's `data.result` term is browser-confirmed. R1's and R2's proposed mappings use events that already fire (`minigame_failed`, `conversation_closed:<npc>`) |
| A character spoken of as met when they weren't (m04 m4) | m8 (Satoshi) |
| A count in the debrief goes stale (m04 n2) | The FCA letter's comment (debrief 373) says "Seven are real findings"; update it to eight if m7 adds one |
| "Under arrest" canon | Fixed. "Arresting officer" (debrief 302) is the police's own officer, which is fine |
| Optional tasks look required (m04 decision 4) | The same engine item applies to m06's six optional tasks; no m06-only action |
| Phone preload runs `start` | OK. HaX's `start` is gated on `guard_resolved` |
| No printed variables in voiced lines | OK. None found |
| Claimed fixes happened | Spot-checked the puzzle-chain fixes: console order and scope (erb 1302-1340), Irina's synced latch (erb 1342-1352), the optional wordlist task (erb 267-278), the signing case on the desk (erb 2220). All present |

## Carried items R1 and R2

- **R1** is m1. The proposed line is "Another wrong slot, and it's logged. They already know we're inside. Now they know where we're looking." It goes in a new mapping placed before the `console_tripped` mapping, so it fires only on the second strike and never alongside the strain text.
- **R2** is m2. The stand-off is reachable and every route out of it works in the driver (r2 fought, r8 pick caught then slip, r12 hostile and slipped past). What's missing is an on-screen pointer to the pick, and a browser run of the stand-off itself.

## Decisions for the user

1. **The thin CyBOK keywords (CVEs/CWEs, kill chains, hash functions).** (a) Add one debrief line in `password_cracking_discussion` that names the night as a chain, at the brief's level, for example "Map it, get on it, crack it, reuse it, move sideways, take the keys. A whole chain, and they'd left every link open." Also trim "Hash functions" and "CVEs and CWEs" from `mission.json` unless the VM teaches them. (b) Leave the play as it is and trim all three groups from `mission.json`. (c) Leave both. **Recommendation: (a).** The kill-chain line costs one spoken line. Whether the VM covers CVEs or hashing needs checking against SecGen.
2. **How to make Irina survive a reload (M1).** (a) Mission-local: key her first meeting on the synced `exchange_infiltrated` and restore a trust floor. (b) Mirror `irina_trust` into a synced global after every change (about 15 `#set_variable` writes, with literal values only, so each branch needs its own). (c) An engine change that saves NPC conversation state with the game, which would fix the whole class in every mission. **Recommendation: (a) now, and file (c) in `docs/IDEAS_BACKLOG.md`.** The same bug class turns up in m04 (Voltage's opener) and in m06's other five NPCs.
3. **SecGen checks S1-S7**, including whether the m06 route needs sudo escalation (m9). If it doesn't, point the guide at a sheet that covers credential reuse, or drop it. **Recommendation:** the user checks them outside the session. Until then, the fixer renames the guide to its sheet's title.

## Browser checklist for this round's fixes

1. **M1:** meet Irina, reload the page, talk to her. Expect no "You must be the FCA", and the badge loan still available at the trust level reached.
2. **m1 (R1):** strain the cover (guard catch), then two wrong slots on the console. Expect the first-strike warning, then the new line. No strain text, and `console_tripped` true.
3. **m2 (R2):** cover strained, Irina not turned. Kemal's stand-off, back off, expect HaX's pointer, then pick the door while his back is turned. A second run: square up and fight.
4. **m3:** confront Satoshi without the keys, defer, take flag 4, reload, return. Expect "Back again." and the decision, not the opening.
5. **m4:** skip Priya's lab, land the console. Check the credit and the debrief line.

## Final count

**0 blockers, 1 major (M1), 12 minors (m1-m12).** Seven SecGen items (S1-S7) and three decisions for the user. Static review only. Tools: 18/18 routes pass, the validator has no errors and no new warnings, dialoguelint is clean, and no NPC mapping condition uses `||` or a nested `data.` path.
