# m02 Ransomed Trust — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m02-dialogue/ink-before/` and `scenario-before.json.erb`. The snapshot already includes the design-stage changes (it differs from HEAD for ten of the fifteen inks), so the comparison isolates the dialogue pass. Line numbers are the **current** files unless marked "before". For the two phone inks I stripped the old `Agent HaX:` / `Ghost:` prefixes from the snapshot before diffing, so the diff shows real rewrites only.

The short version: the pass is careful where it counts. Every code, credential and PIN clue survives, the deduction chain still works, the four restore routes still read as before, and the cast still sounds like eleven different people. What went wrong is concentrated in the **timed texts**, where four of the thirty-word cuts removed the one sentence that carried a pointer (a field-guide offer, the inside-job inference, the "find out who" on the drill board). The Ghost edits left more rhetorical contrasts than the writer counted, and one rewording now repeats Ghost's next line almost word for word. Separately, the Bed 4 death toll doesn't add up (that one predates this pass). Verdict at the end: **revise** (light).

## 1. Logic safety (mechanical checks)

All run by me; output in `<scratchpad>/m02-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `loop.txt`, `matrix.sh`, `json/`, and normalised diffs `hax.diff`, `ghost.diff`, `debrief.diff`, `erb.diff`).

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, all 15 inks | **6 STRUCTURE UNCHANGED** (debrief, asset, roaming nurse, briefing, HaX phone, Ghost phone). **9 structural**, every difference one of: the `hub_quiet` re-entry pattern (VAR, assignments, the `{hub_quiet: … - else: …}` head); hub re-checks of an existing state (Bernie `cover_burned_entry`, Val `cover_challenge` / `open_after_vouch`, Doyle `burned_entry`, Kim's burn greeting, Bed 4 `deceased_state` / `emergency`); Bernie's `met_after_burn`; the terminal's resting knots diverting to themselves instead of `start`. No tag, knot name, VAR default, existing choice condition or sticky/once-only mark changed. All match the writer's account in `DIALOGUE_REVIEW.md`. |
| Hub re-check logic, read by hand | Correct. Each re-check sits in the `- else:` branch, so it runs on a re-talk and not straight after an answer; each target knot sets `hub_quiet` and returns, so nothing loops. Bed 4's hub now reaches the save for a player who spoke to him before the alarm, which fixes a real gap. |
| Compiled JSON in step | Recompiled all 15 with `bin/inklecate` into scratch: every JSON identical to the committed one. |
| `dialoguelint.mjs` | 0 errors. 3 `not-x-but-y` warnings (Ghost ×2, Reeves ×1) and 1 allowed `you-after-choice` (Ghost "[Say nothing.]"). Phone HaX 205 lines median 15 max 25; Ghost 179 lines median 14 max 25; debrief median 16 max 30; timed texts 48, median 28, max 30. **The lint misses at least a dozen "not X, Y" shapes**: two-line and "Not X. Y." forms in HaX's phone and debrief and in Ghost's first call (section 5). |
| `reopencheck.mjs … m02_ransomed_trust` | 0 problems (terminal: 1800 reopens). |
| `loopcheck.js`, my own 52-state matrix (every person-chat at `start`, re-entry `hub`s with burn / vouch / keys / Bed 4 states, every Ghost event knot, the debrief across six outcome mixes, the terminal's three gate states) | **52/52 clean**, no runtime errors or runaways. |
| `inkcheck.js` spot runs (Bernie, Val burned, Bed 4) | 0 failing, 0 runaway. |
| `validate_scenario.rb` | JSON valid; only the 8 pre-existing objective-wiring warnings and 1 ink note. |
| `check_door_alignment.py` | All OK. |

Nothing here blocks. The writer's structural additions are right.

**Size of the pass.** Real rewrites (prefix strips excluded): HaX phone 33 lines, Ghost 36, debrief 41, the other inks about 560 changed prose lines between them, and 36 erb strings. Most HaX phone lines were only unprefixed; the hint and guide replies that most needed the voice treatment were left as they were (section 3).

## 2. Information: what the player needs, and where it is now

Walked the critical path and every optional branch against the before-copy.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Stakes: 47 on generators, 12 h fuel, vote in 4 | Briefing `m02_opening_briefing.ink:41`, `:144`; HaX first call `m02_phone_agent0x99.ink:92`; Kim `m02_npc_sarah_kim.ink:62`; Doyle `m02_npc_ward_nurse.ink:91`, `:217` | Yes |
| No badge opens anything; three routes (person / credential / picks) | Briefing `:198-222`; HaX `:101-103`; Kim `:165-177`; erb text "No badge opens anything tonight…" (`scenario.json.erb:799`) | Yes |
| Bernie has the IT override key; route to IT | HaX `hint_start` `:382-383`; Kim `:173`; Bernie hands it over with directions `m02_npc_receptionist.ink:228` | Inventory |
| Server room = Gary's card only; Val's office is the way in | Bernie, Kim `:175-181`, Val `m02_npc_security_guard.ink:127-128`, HaX `hint_lockpick` `:401-407` | Yes |
| SSH credentials (Emma2018 / Hospital1987 / StCatherines, try the middle one) | Gary `m02_npc_gary_whitlock.ink:274`, `:381`, `:536`; sticky note; erb `:919`; HaX `:434` | Yes |
| Cabinet with Gary's warnings (leverage) | Gary `:397-403`; HaX `:416-417` | Object |
| Cover burn: what happened | erb `:850` ("internal extension"); Bernie `:269`; Val `:156-158`; Kim `:520` | Yes |
| Cover burn: **who might have done it** | erb `:855` **lost it** (before: "Someone in that building watched you get as far as IT…"); now only on the optional HaX choice `cover_burned_who` `:268-274` | **Blurred**, see M2 |
| Cover burn: the routes past Val (lanyard from Gary / Doyle / handover room; Bernie's vouch or ring Bernie; earn it; pick in her blind spot; KO) | HaX `:244-251`, `:255-257`; erb `:855`; Val `cover_challenge_options` `:169-184`, `the_argument` `:309-318`; Bernie `bernie_vouches` / `bernie_hesitates`; Gary `lanyard_given` / `lanyard_refused_out`; Doyle `lanyard_given` / `lanyard_refused`; KO text erb `:937` | Yes, every route still pointed at from at least two places |
| Drill board: "somebody held the doors open, signed N/S Supervisor" | erb `:887` keeps the fact, **lost "Find out who signs himself that"** and "the first thing on paper that says the help came from inside" | **Blurred**, see M3 |
| The deduction: badge SC-4471 → duty sheet / post log → name with a reason | erb `:1062`, `:1075`, `:1081`, `:1087`; HaX `name_the_badge` / `badge_reason_choices` `:495-556` (reason step intact, pushback lines intact); general advice `:859-864`; Reeves `name_him` `m02_npc_asset.ink:82` | Yes. Naming drift: the object is "Night Security Post Log", the texts and HaX say "duty sheet" (S12) |
| Val's notebook / drill evidence (`insider_evidence_partial`) | Val `:528-560`; Kim `fire_drill` `:347-353`; Bernie `reeves_confirmed` | Yes |
| Boardroom PIN 0417 | Kim `boardroom_code` `:391`, `:394` | Diary object |
| Safe PIN = founding year 1987 | Doyle `:229` (empathy) / `:232` (cold); Kim `:373`, `:379`; HaX `hint_pin_safe` `:696-698`; erb `:894`; briefing `:214` "Same way they did in 1987"; lobby plaque | Yes |
| Noisy route to the safe (the case behind the rack, the oracle) | HaX `:705-706`; erb `:1114` | Yes |
| Field-guide offers | Lockpicking erb `:799`; recon + SSH `:966`; scanning-exploitation `:973`; vuln / ProFTPD / privesc `:979`; infoleak `:1114`. **CyberChef: the offer sentence was cut from erb `:912`**; the guide is still in HaX's list but nothing tells the player it exists | **Lost**, see M1 |
| Restore routes and times: paid <1 h; Ghost's keys <1 h; combined 4 h; escrow alone 12 h | Console (erb `:2205-2320`); HaX `:720`, `:749`, `:764-769`, `:888`; erb `:1013`, `:1107`; Ghost `:549`; debrief `:280`, `:310`, `:327`, `:340` | Yes, consistent |
| Ghost's deal and its cost (publish; the foothold) | Ghost `ghost_states_terms` `:562-578`; console `:2306`, `:2319`; HaX `:749-750`, `:768-769`; erb `:950`; Ghost `ghost_keys_response` `:303-304`; debrief `:315-318`; credits `:180` | Yes |
| Death toll by route | Paid 2 (debrief `:282`, credits `:173`); Ghost's keys 1 (`:313`, `:172`); combined 2 (`:329`, `:173`); escrow 6 (`:342`, `:368`, `:892`, `:174`) | Consistent across console, HaX, debrief and credits, **except Bed 4** (M4) |
| Bed 4 slow path (save by hand or through Raval) | erb `:1179`; HaX `bed4_help` `:215-218` and `general_advice` `:848`; Bed 4 `emergency` `:121`; Raval `bed4_assist` `:46-55`; erb `:1185` | Yes. Bed 4 is now reachable on a re-talk too (hub re-check) |
| Press terminal: gated on investigation + decision | Terminal `:95-99`, `:126-128`; HaX `hint_press_terminal` `:814-820`, `general_advice` `:897` | Yes |

Everything else the cuts removed was colour or was said elsewhere: Ghost's "wrapped, useless on its own" (the object text keeps it), the nurses "pinned at Bed 2", Netherton's "I am not going to brief you myself". The briefing trim is right; the debrief kept every figure verbatim.

**Losses, by severity**

- **M1. CyberChef guide offer gone** (erb `:912`). The text sets `cyberchef_guide_offered` but no longer says the guide exists, and HaX only lists it behind "Send me a field guide." Replace the message (27 words): "Their operator's handwriting. Word lengths kept, every letter shifted a fixed number of places. Thirteen's the usual. Decode it on the CyberChef workstation. CyberChef guide on request."
- **M2. The inside-job inference left the cover-burn text** (erb `:855`). The before-copy was the moment HaX first says the call came from inside and that it means they're close. Now it's on an optional phone choice. Replace (29 words): "Someone inside watched you reach IT. Val can disprove your cover now, and her office is your only way to the server room. Get a lanyard, or a vouch."
- **M3. The drill board text lost its instruction** (erb `:887`). It now states the facts and stops. Replace (26 words): "Friday's 'drill': half two to three, doors on free egress. The estate went dark at 02:47. Somebody held the doors open. Signed N/S Supervisor. Who's that?"
- **M4 (pre-existing, structural): the Bed 4 save doesn't change the toll.** Manual route, Pryce dies: "Six people died… One of the six was Mr Pryce" (`m02_closing_debrief.ink:342`, `:349`). Pryce saved: "Six people died… It would have been seven" (`:342`, `:354`). Credits read 6 either way (erb `:174`). A player who saves him, or replays, sees that it changed nothing. Base the toll on six with Pryce, five without:
  - `:342` "Agent HaX: {bed4_manually_stabilised:Five|Six} people died in that window. Ventilator complications, a dialysis failure, two cardiac arrests that nobody was watching a screen for."
  - `:354` "Agent HaX: It would have been six. Mr Pryce in Bed 4 went into a high-pressure alarm with nothing to carry it to the station."
  - `:368` "Agent HaX: {bed4_manually_stabilised:Five|Six} people died in a crisis Ghost built. You were the one carrying buckets."
  - `:373` choice "[Ghost said those deaths would be on my conscience.]"
  - `:892` "Agent HaX: {bed4_manually_stabilised:Five|Six} people died in the downtime. That also matters."
  - credits erb `:174`: add `&& !globalVars.bed4_manually_stabilised` and a second entry "PATIENT DEATHS: 5 (ventilator and dialysis complications — extended downtime; Bed 4 saved by hand)" with `&& globalVars.bed4_manually_stabilised`.
  - `:370` "four of them were already very ill" works for either number.

  This adds inline conditionals and a credits entry, so it's a logged change, not prose. It is the single place where the mission's emotional centre (the save) fails to register.
- **S1.** `m02_npc_patient_bed4.ink:96` "Tonight it waits for a nurse…": "it" is the dark monitor, which can't wait. Replace: "Tonight the next reading waits for a nurse to get back down the row."

## 3. Character

**HaX.** The rewritten lines are in voice: the first call leads with the numbers (`m02_phone_agent0x99.ink:92`), the cover-burn advice is fact first, and "Trust your training" (on her never-say list) is now "Go." (`:900`). The debrief keeps her best lines and every figure, and "Forty-five didn't. I'm not going to dress either of those numbers up for you" (`m02_closing_debrief.ink:284`) is untouched. Two problems.

- **S2. The guide replies are still corporate objective-speak.** The pass only stripped their prefixes. `request_scanning_guide` `:621` "map live hosts, enumerate services, and confirm the backup server attack surface" is almost the voice bible's own never-say example ("Identify compromised systems, enumerate services", `voice_bible.md:43`). Replacements:
  - `:621` "Use it to find what's alive on that network and what the backup server's running. Then decide how you go in."
  - `:624` "Good. Map first, then move."
  - `:635` "You're in. This one helps you work out which of those services will actually give."
  - `:638` "Go for what's open now. Ignore the noise."
  - `:664` "Module, payload, listener, and what to check once you're in. It's all there."
  - `:667` "Adapt it to whatever the box gives you."
  - `:653` is fine. The two "[Thanks, I needed this]" choices (`:652`, `:666`) could be "[Got it.]".
- **S3.** `ghost_deal_reaction` `:337` "You took resources from a terrorist to save lives and deny them funding simultaneously." reads like a report. Replace: "I don't know. You took a terrorist's keys to save lives, and kept the money off them."
- **Optional.** `discuss_ideology` `:796-799` is a lecture ("Frustrating timeline. But that's what works against ideological movements."). Cut `:799`. `hint_encoding` `:674` "Important distinction." can go.

**Netherton.** Right: formal, a quick hand-over, one dry turn. Optional: `m02_opening_briefing.ink:31` is the voice bible's quoted example line (`voice_bible.md:103`) and the pass dropped "We have not met". Revert to "We have not met, and I would rather it were under better circumstances, but circumstances are rather the point tonight." or update the bible's quote.

**Nightshade.** The debrief cameo (`:133-142`) is warm, gadget-pleased and correctly seeded: "for people they trust with buildings" reads differently after m08, without a wink. HaX's "*quietly* He's not wrong. He usually isn't." is a good irony. Keep.

**Ghost.** Still the best voice in the mission: precise, unhurried, numbers as weapons. The splits into phone bubbles help ("Less than five per cent of what they spent on the scanner. Sit with that.", `m02_phone_ghost.ink:166`). The ten emote lines that had to move:

| Line | Before | Now | Verdict |
|---|---|---|---|
| `:55` | `*the pause is deliberate*` before "Somebody agreed with me" | `*unhurried*` mid-line | Fine |
| `:64` | `*after a long moment*` | cut | Fine; the `You: ...` carries the silence |
| `:103` | `*without any hurry at all*` | cut | Fine |
| `:153` | `*a pause, and the courtesy has thinned…*` | trailing `*the courtesy gone from it now*` | "Gone" overstates it: his next line is still courteous. Optional: `*cooler now*` |
| `:265` | `*a pause, and something shifts in it*` | trailing `*something shifts*` | Fine |
| `:311` | `*a pause*` | cut | Fine |
| `:326` | `*no change in tone whatsoever*` | cut | The one that mattered: it steers the TTS on Ghost's reply to "People died tonight." Optional: "I know. *no change in tone* I know which, I know their ages, and I'm not going to perform being sorry for you." |
| `:331` | `*the first real interest in that voice all night*` | trailing | Fine |
| `:400` | `*and there is something almost warm in it*` | mid-line `*almost warm*` | Good |
| `:556` | `*unhurried*` | cut | Fine |

None lost information. Ghost problems:

- **M5. A rewording now duplicates the next line.** `:485` "Call it a capability demonstration, not a threat. I want you clear about where you're standing." The reply to "[Was that meant to frighten me?]" at `:489` is "I wanted you accurate about where you're standing." The before-copy didn't repeat itself. `:485` is also a third rhetorical contrast. **Cut `:485`**: the header `> CAPABILITY DEMONSTRATION` (`:479`) already says it, and `:488-489` do the work.
- **S4.** The act 1 / act 2 bursts still carry the old, generic Ghost: `:450` "We know everything that's happened in this building tonight." is a stock villain line, and the three names before it (`:448`) already show it. Cut `:450`. `:444` "Nobody patches what they don't understand." and `:506` "Paying without publishing teaches nothing." are mottos; optional cuts.
- **Optional.** "Rather" appears 8 times in Ghost's file. Two of them are "rather the point" (`:202`, `:535`), which is also Netherton's phrase in the briefing. Change `:535` to "That was the idea."

**Reeves.** Right: courteous, then cold, then sure of himself. Folding his four scripted `You:` lines into the scene works, especially `choice_arrest` (`m02_npc_asset.ink:264-266`). The kept "That's not a counter-argument. That's my closing statement." (`:225`) is earned: it answers the player's best objection, and it's the only contrast on any path through the scene.

- **S5 (pre-existing).** `:163` and `:343` "I rang control at ten to four". The player reaches Bernie's desk at "Ten past four" (`m02_npc_receptionist.ink:66`), and the burn comes after Gary hands over the card. Drop the time: `:163` "I rang control from that phone and told them there was no consultant booked. That was all. Eleven words." `:343` "And the telephone call, which I imagine cost you a good deal of your evening."

**Narrator.** Mostly camera now. In Bed 4, the cut lines included "Narrator: He watches you read it." (before `:80`), which was camera rather than comment and gave the chart beat its weight. Optional: restore it before `Mr Pryce: Fourteen minutes.` (`m02_npc_patient_bed4.ink:98`). S1 (section 2) fixes the "it waits" line.

**The one-mission cast.** Still distinct: Bernie quick and dry ("Forget the money. This place has forgotten everybody in it."), Doyle clipped Belfast ("Aye. Do."), Raval curt, Gary bitter and funny ("Turns out you can be furious and useful. Who knew."), Kim controlled RP, Val jokes until she stops. Two good voice fixes in the pass: Bernie's "Aye" (Northern) became "Yeah", and "four other men" became "four others".

- **S6. "Eleven years" belongs to Bernie and now three people have it.** Bernie says it four times and Val and HaX both cite it about her. That's the right repetition. But Val claims eleven years of her own (`m02_npc_security_guard.ink:269`, `:583`) and so does Gary (`m02_npc_gary_whitlock.ink:637`), which blurs them into one shift. Replace:
  - Val `:269` "I've stood in a lot of corridors. That counts for something."
  - Val `:583` "I've had him in my notebook eight weeks. I know exactly what he looks like."
  - Gary `:637` "Contractor pass. Blank, real hospital stock. Nobody's ever questioned one in all my time here."
- **S7 (pre-existing).** Val says "Contractor pass" whatever lanyard the player shows (`m02_npc_security_guard.ink:201`), including Doyle's green-ribbon agency lanyard (`bank_staff_lanyard`). Replace: "Hospital pass. Blank, no photo. Could have come out of anybody's drawer."
- **Optional.** "Love" is said by Bernie (`m02_npc_receptionist.ink:131`), Val (`:103`), Raval (`m02_npc_roaming_nurse.ink:22`) and Mrs Hargreaves (`m02_npc_patient_bed2.ink:14`, `:46`). All fit their accents, but four is a lot. Val could take "pal" or nothing.
- **Optional.** Bernie and Val describe Val's complaint in near-identical words ("crisis protocol… Twice… won't put it in writing / an email", `m02_npc_receptionist.ink:432` and `m02_npc_security_guard.ink:523`). It's hearsay, so a match is fine, but Bernie could say it her own way: "Got told it was crisis protocol and to leave it. Twice."

**The patients.** The weight survives. Pryce in fragments ("...you the one." / "Fixing it."), the chart and "Long time... fourteen minutes.", Mrs Hargreaves's "Me and this machine have an understanding.", Ms Chen watching the screen for her neighbour, and the deceased state ("Someone has half-drawn the curtain.") all land. The debrief still names Pryce, says Doyle "asked me to make sure that was written down", and owns a struck patient. Cutting every `*breath*` cue is fine: the ellipses and the fragment lengths carry it.

## 4. Craft

**Choices.** First person throughout, no echo lines, distinct intents (Bernie's three approaches, Gary's three openings, Val's routes, Kim's three advice options, Reeves's four stances). The shortened choices kept their intent: Gary's "[It's a paper trail. Tonight it's the most useful thing in this building.]" lost a hero "isn't X" and is better for it. Bernie's "[That's on him. His whole job was to be believed.]" is too. Two choices don't fit every route into them:

- **S8 (introduced).** Ms Chen's hub choice `m02_npc_patient_bed5.ink:46` "[Thank you for keeping an eye on her.]", and her reply "I'm in the same room as her.", need the player to have heard about Mrs Hargreaves. Only the first of her two opening branches (`:27-32`) mentions her. On the "[How are you holding up?]" route, "her" has no antecedent. Before, it was "[Thank you for watching out for your neighbours.]". Replace the choice with "[Thank you for watching the others.]" and the reply with "I'm in the same room as them. What else would I do?"
- **S9 (pre-existing).** Briefing `:45-46`: "[Who did this?]" gets "I'll give you the name, then the part that matters." and then the hub, without the name. The player has to ask again. Replace `:46`: "Agent HaX: There's a name, and there's the part that matters. Ask me in that order." The hub already offers both.

**Debrief payoffs.** Every choice-setting global is still read back by name: Bernie's vouch, her KO and the disciplinary; Val's log, the pick-catch and the KO; Doyle; Kim's KO and all four advise-the-board branches; Gary protected or not, exposed or quiet, and his KO; Pryce saved, dead, or struck; Reeves arrested, KO'd, flagged, escaped or missed; the Ghost deal kept or broken; Nightshade's oracle. Three problems:

- **S10 (pre-existing).** `m02_closing_debrief.ink:658` and `:675` "Remember what I said about the injustice that makes people." HaX only said it on the `gary_unprotected_quiet` branch (`:585`). On every other route the player hears a callback to nothing. Cut the sentence from both lines: `:658` "Agent HaX: Underpaid, ignored, radicalised by the same negligence he helped punish." (and drop "He's the proof."). `:675` the same.
- **S11 (pre-existing). Two lines make the player a man.** The writer fixed one ("four other men"); two more remain: Ghost `m02_phone_ghost.ink:86` "a very precise number for a man who's telling me numbers are the problem" → "for someone who's telling me numbers are the problem"; debrief `:777` "as an unidentified man in a hospital corridor" → "as an unidentified stranger in a hospital corridor".
- **S12. "Duty sheet" or "post log"?** The object is "Night Security Post Log" (erb `:2814`). The texts that send the player to it say "duty sheet" (erb `:1062`, `:1087`), and so do HaX's deduction choice (`m02_phone_agent0x99.ink:548`) and three of her lines (`:523`, `:555`, `:860`). This is the one object the deduction depends on. Pick one: change the six strings to "post log" (e.g. `:548` "[The boardroom post log puts badge SC-4471 on their post.]", `:523` "Then go and look. Every post keeps a log.").

**The ending.** The debrief's last beats are where the old summarising voice survives (untouched by this pass):

- **S13.** `debrief_close` `:941-943`: "You saved lives. You stopped an ENTROPY operation. You gathered intelligence on their network. / That's what you came in there to do." That's a rule-of-three summary and a tidy ending, and on the paid route "You stopped an ENTROPY operation" isn't true. Cut both lines. "Get some rest, {player_name()}." then "We'll brief the next operation when you're ready." is enough.
- **S14.** `final_reflection` `:871` "ENTROPY creates impossible dilemmas on purpose…" restates `:862-864` ("Ghost built that choice so that it couldn't be got right") two lines later. Cut `:871`.
- **S15.** `ghost_status` `:598-609` reads like a report: "Ghost Protocol anonymity architecture performed exactly as designed.", a hero "That's not failure.", and a rule-of-three "Calculated harm, ideological certainty, coordinated cells. That matters." Replace `:598` "Agent HaX: Ghost's gone. Clean exit. No trace, no leads.", `:603` "Agent HaX: We disrupted them, and we learned how they work. I'll take that.", and cut `:609`.

**Small craft.**

- **S16 (introduced).** Briefing `:205` "A badge is card with your name on it." reads as a typo. The trim cut "a piece of". Replace: "A badge is a bit of card with your name on it."
- **Optional.** HaX `hint_start` `:383` "The first lock in this mission is a person, not a door." is gamey ("in this mission") and a contrast. Replace: "The first lock tonight is a person."
- **Optional (pre-existing).** Gary's daughter "turned seven in May" (`m02_npc_gary_whitlock.ink:557`, `:496`) and the password is Emma2018, in 2024. If the 2018 is her birth year, she's six.
- **Optional (pre-existing).** The same room is "the boardroom" (Bernie, Kim, Val, Reeves, erb `:1185`) and "the conference room" (HaX, Ghost, terminal). It's the same room, `conference_room`. The press-terminal pointers would be clearer with one name.

**Subtext and the villains.** Better than before. Ghost and Reeves each want something from the player in every beat (to be understood, to be put on trial, to get the evidence out), and each beat brings something new. Reeves's monologue lost its "I did not… I did not… I did not…" triple and is stronger. The echo between Ghost's "Somebody agreed with me" (`m02_phone_ghost.ink:55`) and Reeves's "They agreed with me. That's all." (`m02_npc_asset.ink:229`) reads as cell doctrine. Keep it.

## 5. AI tells and UK English

**"Not X, Y" the lint can't see.** `dialoguelint` reports three, all villains. A hand search finds more, because the pass often split one contrast across two lines or two bubbles, and the lint matches within a line.

*Ghost, first call (one scene: `start` → `ghost_introduction` / `player_threatens` → … → `ghost_philosophy` → `ransom_demand`).* Every path through it carries two contrasts:

- path via `ghost_confirms_calculations`: `:107-109` "The interesting part isn't that I did. / It's that in March…" and `:139` "Not ignorant. Warned.";
- path via `ghost_justification`: `:128` "I'm not justifying anything. I'm invoicing." and `:139`.

- **M6.** Cut "Not ignorant. Warned." from `:139`, leaving "There is always a Gary Whitlock. There is always a file of emails." The split at `:135-137` already ends on "And every one of them was warned about it in writing.", so the kept signature now just repeats the line before it. Each path then keeps exactly one contrast, and both of those are earned: "I'm invoicing" is Ghost's thesis in two words, and "The interesting part isn't that I did" turns the player's accusation back on the board.

*Ghost, the offer (`on_recovery_console` → `ghost_states_terms` → `act3_accept`).* `:568` "Not the money. The lesson." is the scene's one kept contrast and it's earned: it's the reveal of what Ghost wants. The accept path adds a second:

- **S17.** `:597` "Not just the cover-up memo -- the timeline." Replace: "Include Gary Whitlock's emails. All six months, in order." and keep `:598` "The lesson requires the complete picture."

*Ghost, act 2:* `:485` is M5.

*Reeves:* the one kept contrast is earned (section 3).

*HaX, phone (hero; none allowed):*

- **S18.**
  - `:273-274` "That's not a hacker. … / That's somebody standing in the building…" → `:273` "If Ghost wanted you stopped, Ghost had cleaner ways." `:274` "This is somebody standing in the building with a telephone and a working knowledge of the procedures."
  - `:355` "That's past negligence. That's a deliberate cover-up of what created this crisis." → "That's a deliberate cover-up of what created this crisis."
  - `:730` "Not because they're comforting. Because nobody can tell you…" → "Nobody can tell you how many a six-hour delay kills on a specific ward on a specific night."
  - `:793` "Not opportunistic criminals. True believers with risk models." → "True believers, with risk models."
  - Optional: `:306` "Ghost isn't wrong about St. Catherine's negligence. That doesn't make their methods right." is the two-line pivot; "Ghost's right about St. Catherine's. Their methods are still theirs to answer for."

*HaX, debrief:*

- **S19.**
  - `:189` "To Ghost, the patients weren't victims. They were the argument." → "To Ghost, the patients were the argument."
  - `:206` "That's a method, not a coincidence." → "That's a method."
  - `:214` "We don't win this by catching operatives. We win it by finding the one who trains them." → "We win this by finding the one who trains them."
  - `:287` "That's the job, not a consolation prize." → "They did. That's the job." (The writer reordered the old contrast without removing it.)
  - Optional, earned and kept by me: `:773` "That is not the same as it not having happened." and `:819` "That's a debt, not an acquittal.". Both are hard, specific lines about the player's own violence. `:747` "…and it isn't crime" could end at "what we're actually fighting".

*Timed texts:*

- **S20.** erb `:781` "A debt, not a betrayal." → "That's a debt. Know it's there." (keeps the before-copy's "just know it's there").
- Optional: erb `:823` "Not a demand, a note about Gary's emails." It's information more than rhetoric. Keep or make it "No demand. A note about Gary's emails."

**Rhythm.** Much better than m07's draft. Ghost's long sentences survive next to short ones, and Doyle, Bernie and Gary each keep one or two long lines a scene. The debrief is the exception. Splitting every long line at its full stops has produced runs of two-word fragments ("Reputation intact. Public unaware.", "Vanished. No trace.", "Four hours. Systems back well inside the window."). Most of those were already there; S13–S15 remove the worst. Let HaX run one line long in each debrief section.

**Tidy endings.** Mostly gone from the scenes. They're left in the debrief close (S13), `q_architect` `:224` "That's more than we had a week ago. Because of you." (optional: cut "Because of you."), `exposure_reflection` `:458` "I know it was consequential." (optional: "I know it mattered."), and `final_reflection` `:872` "You acted. That counts.", which can stay once `:871` goes.

**UK English.** Clean: "per cent", "Cyber Security" (three fixed), British idiom per accent. No US spellings in the ink or texts.

**Doc drift (for the log).** `voice_bible.md` still lists m02 as "frozen, audio cached" (`:264`) and quotes the old Netherton line (`:103`). The editorial log says m02 audio is regenerated after this pass, so both entries are stale. About 670 m02 spoken lines and 36 texts changed; with S-items, about 45 more.

## 6. Findings list

**Must-fix**

- **M1.** erb `:912`: restore the CyberChef guide offer (replacement in section 2).
- **M2.** erb `:855`: restore "someone inside watched you reach IT" in the cover-burn text (section 2).
- **M3.** erb `:887`: restore the "who's that?" pointer on the drill-board text (section 2).
- **M4.** Debrief `:342`, `:354`, `:368`, `:373`, `:892` and credits erb `:174`: saving Pryce has to lower the toll (six → five). Pre-existing; it adds inline conditionals and a credits entry, so log it as a deliberate change (section 2).
- **M5.** Ghost `m02_phone_ghost.ink:485`: cut. The rewording repeats `:489` and adds a third contrast.
- **M6.** Ghost `:139`: cut "Not ignorant. Warned.". It repeats `:137` after the split and gives every path through the first call two contrasts.

**Should-fix** (replacement lines above)

S1 Bed 4 `:96` "it waits" · S2 HaX guide replies `:621`, `:624`, `:635`, `:638`, `:664`, `:667` · S3 HaX `:337` · S4 Ghost `:450` · S5 Reeves "ten to four" `:163`, `:343` · S6 "eleven years" for Val `:269`, `:583` and Gary `:637` · S7 Val's "Contractor pass" `:201` · S8 Ms Chen's choice and reply `:46-47` · S9 briefing `:46` · S10 debrief `:658`, `:675` callback · S11 gendered player: Ghost `:86`, debrief `:777` · S12 "duty sheet" vs "post log", six strings · S13 debrief close `:941-943` · S14 debrief `:871` · S15 `ghost_status` `:598`, `:603`, `:609` · S16 briefing `:205` · S17 Ghost `:597` · S18 HaX phone contrasts `:273-274`, `:355`, `:730`, `:793` · S19 debrief contrasts `:189`, `:206`, `:214`, `:287` · S20 erb `:781`.

**Optional**

Netherton `:31` revert (or update the voice bible) · HaX `:383`, `:306`, `:674`, `:796-799` · Ghost cues `:153`, `:326`; "rather the point" `:535`; mottos `:444`, `:506` · Bed 4 restore "He watches you read it." · "love" ×4 · Bernie's "crisis protocol" wording · Emma's age · boardroom / conference room · debrief `:224`, `:458`, `:747` · erb `:823`.

**Lines this would touch.** About 45 spoken lines and choices across 9 ink files, 4 erb texts and one credits entry. All prose inside existing lines except M4 (inline conditionals plus a credits entry). m02 audio is generated after this pass, so there's no extra cost now.

**For the log / backlog.** (1) `dialoguelint`'s `not-x-but-y` rule misses contrasts split across consecutive lines and the "Not X. Y." form after a full stop at line start ("Not opportunistic criminals. True believers…", "Not because… Because…"). It's worth a two-line window. (2) A lint check for a choice that quotes or refers to something only one route into its knot has said (S8, S10) would have caught two of these.

## 7. Verdict

**Revise** (light). The structure is sound: every tag, knot and condition is as it was, apart from the writer's hub re-checks, which are correct and fix a real Bed 4 gap. Every runtime check is clean, and the scripts are tighter and more in voice without losing the cast's differences or the ward's weight. Fix M1–M6 before it ships. M1–M3 because the timed-text cuts took out the one sentence that pointed the player somewhere. M4 because the Bed 4 save, the mission's emotional centre, doesn't change the number HaX reads out. M5–M6 because Ghost's contrasts are meant to be rationed, and the pass left two per scene and a near-duplicate line. Take the should-fix items in the same edit; most are one-line swaps.

After the edit: recompile, rerun `tagdiff` against the same snapshot (expect differences only from M4's conditionals), `dialoguelint`, `reopencheck` and the loopcheck matrix in `<scratchpad>/m02-scripted/matrix.sh`, and the validator for the credits change. No new playtest is needed for prose of this size. A quick on-screen read of the escrow-route debrief, with and without the Bed 4 save, would confirm M4.
