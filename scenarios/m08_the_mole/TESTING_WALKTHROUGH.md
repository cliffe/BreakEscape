# m08 "The Mole" — QA Walkthrough (PASS 4 design)

Matches `scenario.json.erb` after the pass-4 design fixes (2026-10-02). See
`DESIGN_REVIEW.md` ("Changes made (pass 4 design)") for what changed and why,
`PUZZLE_CHAINS_PLAN.md` (pass 3) and `PASS2_IMPROVEMENTS.md` (pass 2) for the
earlier work. Pass 4 in one line: the Director's card is cloned, not handed
over, and only after the three interviews; the USB stick carries a print; the
suite code has its own task.

Codes: safe PIN **2407** (the Director's service number; 4719 is Nightshade's
and fails), interrogation suite PIN **5386** (ERB `suite_code`; card in the safe,
or Netherton after the door-audit check), archives password **TrustNoOne**
(break-room post-it only), badge printer PIN **0311**. Flags arrive through the
Evidence Relay Terminal in the server room. Start kit: phone, picks, RFID cloner,
fingerprint kit; no PIN cracker.

Clock (all UTC; the Citadel keeps UTC): plan opened D-2 10:38–11:25. Door audit
CL-1: 07:52 IN 0x3C; 10:15 IN 0x47; 10:24 IN / 10:32 OUT 0x23; 11:43 OUT 0x47.
LIB-2: 10:35 IN 0x23. Phantom airborne 10:09–11:54.

## Critical path

| # | Action | Expected |
|---|---|---|
| 1 | Load the mission | ATHENA's opening cutscene plays once (`briefing_played`) over the cutscene playlist; she logs the kit and says the PIN device is in Technical Analysis. It does not replay on resume. When it closes, the music moves to noir and HaX's first message arrives (~2.5 s). |
| 2 | Go north to the Director's office and talk to Netherton | `brief_with_netherton` completes and `brief_taken` is set on the **first line** of the meeting. The aims `work_the_suspects` and `get_into_the_repo` unlock. He says he has run field operations for five years. "[I'll need access.]" (sticky) before the interviews: "Not yet. Talk to all three first…" plus one line naming each suspect not yet seen. Close and re-talk: the hub returns, not "(End of conversation)". |
| 3 | Interview Cipher (ops floor), Phantom (intel analysis, north of ops), Nightshade (Crypto Lab, west of the lobby) | `<name>_interviewed` is set on the first line. The interview task completes then if the brief is taken, otherwise the moment it is (brief-gated mappings, lesson 27). Re-talk returns to the hub. A KO counts as seen for the Director's card. When the last of the three is seen (and the player has no way in yet and the Director is up), HaX texts once: "That's all three. Now go and see the Director about the server room. Take the cloner." (`access_nudge_sent`, via the `<name>_seen` latches). (PASS 3: the interviews are required for "Work The Three Suspects"; a KO also completes the interview once the brief is taken.) |
| 3a | Back to Netherton: "[I'll need access.]" | He won't hand the card over; he turns to the maps with his lanyard in reach (`access_offered`, local). "[Step up beside him and let the cloner read his card.]" → narration → the RFID minigame in clone mode on "Director Netherton Keycard" (EM4100, `card_id` `server_zone_badge`). **Save** the clone: `card_cloned` sets `netherton_card_cloned` and `netherton_card_taken` (mapping on `agent_0x99`), HaX texts about EM4100 and Nightshade's m03 line, and Netherton gives the directions and says "Whatever you are carrying, Agent, I did not see it"; "[Understood, Director.]" closes the conversation (round 2: the exit no longer swallows that line). Cancel before Save: "The cloner did not get a clean read" and the clone option stays in his hub. |
| 4 | Ops floor → east: present the clone at the server-room reader | The reader opens the cloner's menu: Saved → Director Netherton Keycard → Emulate (HaX's clone text and her server-room answer both say so); `server_room_entered` is set; `breach_server_room` completes (after the brief). HaX offers the recon guide. |
| 5 | Exploit GitList; submit flags 1 and 2 at the relay | First use of the launcher: HaX offers the scanning **and** vulnerability-analysis guides. Flag 1: the secrets-in-git-history guide (moved from flag 2 in pass 4). Flag 2: no guide. Music stays noir. `get_into_the_repo` completes. |
| 6 | Log in with the recovered credentials; get root; submit flags 3 and 4 | Flag 3's text ties the mail to the safetynet.gov sender stripped off the m07 intercept. Flag 4: `mole_identified`, `database_theft_understood`, music → threat; if `named_on_evidence` is already set, HaX's text says the box agrees with your door audit. If flags 1–3 aren't all in, a second text 5 s later asks for the rest (skipped at delivery once `all_flags_submitted`). When all four are in, `all_flags_submitted` latches (on `closing_debrief`), HaX sends "That's the whole chain" (the "Security have walked him down…" version if Netherton is KO'd), the Crypto Lab Nightshade is hidden and the suite copy is shown at the table. The task "Get the interrogation-suite code" appears under "Confront The Mole", already ticked if the code card was read or the audit check passed. |
| 7 | Ops floor: read the personnel printout | Its "Requested by" line gives the Director's service number, 2407. The margin says every safe opens on its owner's service number (it no longer adds "The Director's included"). |
| 8 | Director's office: open the safe with 2407 | Holds the Interrogation Suite Code Card (5386; `suite_code_found` on reading; `get_suite_code` ticks once all four flags are in; four mappings) and the sealed psych evaluation. |
| 9 | Crypto Lab → south: key 5386 into the suite keypad | The door opens. Picks are not offered (PIN lock). |
| 10 | Enter the interrogation room with all four flags in | Nightshade stands at the table (the narration says stands, round 2). The confrontation opens (hq2, **cannot be closed**). `get_suite_code` completes if it hadn't; `confront_nightshade` completes on the first line. |
| 11 | Work the hub; choose the fate | `decide_the_fate` completes at the choice, which sets `fate_decided` plus `nightshade_arrested` XOR `nightshade_triple_agent`. If Tomb Gamma wasn't asked about, he gives it anyway (`tomb_gamma_location_known`). |
| 12 | The confrontation closes | The debrief opens straight away (hq3, cannot be closed). `debrief_played` is set on line 1. `take_the_debrief` completes on the **last** line. Then victory music, credits, and the bond visualiser. |

## The investigation (optional, scored)

| # | Action | Expected |
|---|---|---|
| I1 | Break room: post-it on the coffee machine | Archives password and printer PIN. ATHENA only hints ("near the kettle"). |
| I2 | Break room: the timeline (or the server room's auth excerpt) | `found_timeline` (or `found_access_logs_hint`). Opened D-2 10:38–11:25 UTC. |
| I3 | Break room: talk to the off-duty agent | Testimony: in from before eight; someone at the bench, just gone twenty past ten; "build of the nerdy one, Cipher. Or not." `witness_heard`. On re-talk or after a reload: "Still here…" and a hub option repeats the testimony. |
| I4 | Archives (TrustNoOne): Badge Audit Printout | `found_badge_audit`; `read_the_archives` completes after the brief. |
| I5 | Ask each suspect "where were you" first, then the audit beat | Cipher: "Eight minutes… token cabinet" (`cipher_audit_confirmed`). Nightshade: "I'm always here… Bring me the account." (`nightshade_audit_confirmed`). Phantom: "So it printed." Cipher's and Nightshade's beats need `asked_alibi`; Phantom's doesn't. |
| I6 | Netherton: "[I've been through the door audit, sir.]" | No clock read → "Bring me a clock" (free). Clock but no confirmation → "take it to the people on it" (free). Otherwise: 10:38 → Nightshade → "out of the lab at 10:32" → "The people on it confirm their own rows". `name_the_mole` completes, `named_on_evidence`; he says the code (5386) and points at the safe. "[The suite code again, sir?]" repeats it. |
| I7 | Wrong answers | Each sends you back to the hub with a correction, restarts from the first question, and sets `audit_misread`. The third closes the check (`audit_closed`; the option disappears). "[Let me read it again.]" is free at every step. If Cipher and Nightshade are both KO'd unconfirmed, the check passes in three steps. |
| I8 | Nightshade's locker (break room) | Picks; or ask Nightshade "[Your locker…]" after his audit or Okafor beat (he gives the key); or KO him (key drops). Holds the USB stick (PERSONAL_BACKUP.enc; HaX offers the CyberChef guide), the 'Deep State' brief and the go-bag (flight to Helena, unused). The stick's observation no longer names the encodings, and says there is a thumbprint on the casing. |
| I8a | Click the USB stick in the inventory (fingerprint kit in the start kit) | The dusting panel opens first (dark gloss surface: silver powder). Lift the print; the compare step offers some of Cipher, Phantom, Director Netherton, Facilities (it narrows by pattern) and Nightshade. Any lift: HaX "A print off the stick…". Only the **match** (`fingerprint_identified:nightshade`) sets `nightshade_print_lifted` (round 2). "Use normally" in the panel reads the file instead. Payoff: a confrontation line ("And you printed the stick…") and a RECOVERED credit. |
| I9 | CyberChef (Crypto Lab) | ROT13, then From Base64: the sent mail from `nightshade_deep_state`. Optional; nothing records it. |
| I10 | Cipher: "[Cipher. Same handle as the ENTROPY operative at the battery hall.]" | He had the handle first and wants to know who told ENTROPY it was his (`asked_handle`, local). |
| I11 | Accuse Nightshade before flag 4 | HaX: "You told him. He knows now…" In the confrontation: "I had the whole night to tidy up after that, and I didn't. Think about why." Plays alongside the door-log line if both apply. |

## Order variants (must all work)

- **Suite opened before the flags (code from the safe or Netherton):** the room is empty, the evidence wall reads "Awaiting evidence", and the disposition screen reads "No detainee". The confrontation opens on the first entry after all four flags are in.
- **Netherton's check reopened mid-way:** End Conversation at a step, then re-talk: **the step's question is asked again** above its answers (pass 4) and no misread is added. If flag 4 lands in between, the re-talk lands on the hub.
- **Flag 4 submitted before flags 1–3:** HaX names Nightshade but asks for the rest of the chain. No confrontation yet. HaX hub: "Why isn't he in the interrogation room yet?"
- **Badge printer route (the earned early way in):** break room post-it → PIN 0311 → reception printer (a `pc` container) → "Printed Server-Zone Badge" (`badge_cloned`). HaX: "…Everything we tell clients not to do, in our own lobby." Opens the server room before any interview. Netherton's "[I'll need access.]" no longer shows once you hold it; HaX's server-room answer says you already have what the reader wants.
- **Archives:** post-it password only (ATHENA hints). Optional; `read_the_archives` sits in `work_the_suspects`.
- **Nightshade's desk:** a bare `pc` that reads "0x47 -- SESSION LOCKED." and opens no container.
- **Confrontation interrupted (pass 4: the engine now hides End Conversation under disableClose, so only a reload does this):** before the choice, HaX nudges you to step out and go back in, and re-entry reopens the scene from the start. After the choice, the outcome (fate, `fate_decided`, Tomb Gamma) is already written, and the debrief opens on the close.
- **Netherton KO'd:** his physical keycard drops beside him (KO drops `itemsHeld`); picking it up sets `netherton_card_taken`. This works before the interviews too: the KO is the costly shortcut. HaX's KO text and her server-room answer say so, then give the printer route; her all-flags text becomes "Security have walked him down…"; the confrontation's countersign lines change.
- **Reload after the clone:** the clone lives in the cloner's saved cards and `netherton_card_taken` is a saved global, so the server-room reader still opens and Netherton's hub shows neither access option.
- **Reload after the print lift:** lifted prints are saved with the game; `nightshade_print_lifted` stays set.
- **Reload mid-confrontation (before the choice):** re-entering the interrogation room reopens it. After the choice, it skips to `after_choice`.
- **Reload mid-debrief:** the debrief does not replay. The next room entry completes `take_the_debrief` and sets `debrief_backstop_fired` (backstops on `opening_briefing_cutscene`, gated on `!mission_complete`), which plays the victory track and the same credits as a normal close (PASS 3, playtest E7). The rest of the debrief is not heard.
- **Aim ladder (lesson 27):** do everything you can before seeing Netherton: interview all three, open the archives (post-it password), print a badge and enter the server room. No later aim should appear. After the brief, those tasks tick at once. Residual: a flag *submitted* before the brief still reveals its aim, because `submit_flags` can't be gated.

## Branch variants

- **Fate arrest vs triple agent:** debrief `disposition`, the disposition screen, and credits differ.
- **Accused Cipher and/or Phantom to his face** (`accused_cipher`/`accused_phantom`): debrief `the_hunt` line and credits. After flag 4, each offers an apology beat.
- **suspect_theory** cipher/phantom/nightshade/unset: debrief and credits.
- **Door-audit check:** `named_on_evidence` (± `audit_misread`) or `audit_closed`: debrief `the_hunt`, the confrontation's door-log line, and THE CASE credit.
- **Go-bag read:** HaX in person's line, the confrontation's Montana question, GO-BAG credit.
- **nightshade_suspected:** confrontation opener and debrief line.
- **debrief_stance** defended/owned: debrief and credits.
- **Netherton KO'd:** opening joke in the debrief, plus a credits line.

## Knockout matrix

| KO'd NPC | Expected |
|---|---|
| Director Netherton | `brief_with_netherton` completes (taskOnKO). His physical keycard drops (whether or not it was cloned). HaX (`npc_ko:director_netherton`) mentions the card, the printer route and that the name waits. The door-audit check and the clone are lost; the safe still gives the suite code. |
| Cipher / Phantom | HaX reacts; the interview and audit beat are lost. The check needs one confirmation (Cipher or Nightshade); if both Cipher and Nightshade are down unconfirmed, it passes in three steps. |
| Nightshade (Crypto Lab) | HaX reacts; his locker key drops; the confrontation opens with "You put me on the floor of my own lab"; credits line. Hidden when all flags are in. |
| HaX in person | `hax_ko`; HaX texts from the floor; credits line. |
| Give → reload → KO (E22) | Netherton's card or Nightshade's key may drop a second copy. Expected and harmless: nothing ticks on pickup and the give isn't re-offered. |
| Nightshade (confrontation) | Visible at the table once all four flags are in (pass 4), but the scene opens on entry and can't be closed, so a KO is only possible after the scene or after a reload. A KO after the fate sets `nightshade_confront_ko` only; the 'knocked down before he could answer' credit and debrief line read `nightshade_ko_before_fate`, which only the safety net sets (round 2). Safety net: `npc_ko:nightshade_confrontation` sets arrest + `fate_decided` and completes `decide_the_fate`; the debrief's no-coordinates branch covers it. |

## Automated checks

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 1 warning (the confrontation cutscene is deliberately not onceOnly; see PASS2_IMPROVEMENTS).
- `./scripts/compile-ink.sh m08_the_mole`: 12/12.
- `inkcheck.js` on every entry knot and the re-entry states; `loopcheck.js` on every hub.
- `ruby tools/pass2/render.rb … && python3 tools/pass2/door_align.py …`: 8/8 OK.

## Pass-3 static checks (2026-10-01)

- Validator 0 errors, 1 warning (as pass 2); doors 8/8; ink 12/12; rendered-JSON assertions
  (`scratchpad/m08_assert.py`): times agree, one code source, no "maximum", no narrator verdicts,
  E18 clean. inkcheck/loopcheck over the state matrix in `PUZZLE_CHAINS_PLAN.md` §7.

## Pass-4 static checks (2026-10-02)

- Validator: 0 errors, 2 warnings (both pre-existing and intended: the brief-gated co-fire on `closing_debrief`, and the confrontation cutscene without `onceOnly`); doors 8/8; ink compiled; rendered-JSON assertions (`scratchpad/m08-fixer/m08_assert.py`, 37/37 after round 2); reopencheck m08 0 problems; tagdiff differences listed in DESIGN_REVIEW.md.

## Known follow-ups

- SecGen flag order vs a real build (see the approval log, m08 §2). If the build numbers the flags differently, swap the four `flagRewards` descriptions and the task titles; keep `targetFlags`.
- Browser playtest of the pass-3 changes: scripts in the session scratchpad (`m08_playtest_scripts.md`).
- Object placement: the locker (break room, top-left 4.4, 7.45) and the audit (archives, 4.6, 3.4, on the floor between the desks) were checked on template renders with the sprites overlaid (no overlap with furniture, NPCs, walls or doors). Confirm in the live game.
