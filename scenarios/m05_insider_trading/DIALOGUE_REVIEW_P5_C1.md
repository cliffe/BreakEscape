# m05 Insider Trading: dialogue review, pass 5 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission judged as a TV spy thriller (`docs/agents/M05_PASS_BRIEF.md`). Gold standard: m04 and m06 after their three dialogue cycles (`DIALOGUE_REVIEW_P5_C1..C3.md` in each). Alignment, puzzle chains and scenario design are closed, so their decisions aren't reopened here unless a line has gone wrong. Two items were handed on to this phase: B3 (the debrief's long runs without a choice) and P10 (HaX's hub can show 14 choices). I didn't open the SecGen XML or the four listed field guides.

`tts_cache/m05_insider_trading/` holds 8 clips, so none of the rewrites below costs much in re-voicing.

**Snapshot for `tagdiff --old`:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-dialogue-snapshot/ink/` (ten `.ink` and ten `.json` files), taken at commit `f65b3336` with nothing uncommitted in the m05 folder. The commit is recorded in `COMMIT` beside the folder.

Finding ids are `D5-n`, tagged **blocker / major / minor**. Every fix is mission-local (the ink, or the erb's text fields).

## Step 1: compile, validator, lint, runtime

- **Compile.** All ten files compile into the scratchpad with no errors and no loose-end warnings. The compiled JSON matches the committed JSON for every file, so the routes test exactly this ink.
- **Validator** (`--skip-ink --no-graph`): no blockers, no invalid speaker prefixes, no `#give_item` mismatches. It gave the same 12 same-pattern notes on HaX's mappings that the earlier phases logged as intended, the `object_interacted` text pair, and the credits suggestions (all-conditional sections), which belong to scenario design.
- **Voices.** Every speaking NPC has a voice block that names an accent and says "consistent … throughout": Patricia (Cardiff), Owen (Manchester), Halloran (Dublin), Lisa (south-west London, British-Korean), Torres (light Castilian in British English), the Recruiter (Mid-Atlantic, Washington DC), HaX, Netherton and Nightshade (RP, with identity parts word for word from the voice bible), and the narrator (noir). No two characters who share a scene share a voice name.
- **dialoguelint:** 0 errors. One `you-after-choice` check (Recruiter L87, the non-verbal "Say nothing", which is allowed) and one `not-x-but-y` warning (Recruiter L361, the villain's one kept use). Maximum line length is 30 words.
- **reopencheck:** HaX, the Recruiter and Patricia's phone each ran 1800 reopens with 0 problems.
- **Routes, all 28** (`route.js <file>`): every one ends `[result] all expectations met`.
- **loopcheck** (200 steps × 6 strategies) on every `currentKnot` (Patricia, Owen, Halloran accused, Lisa after the naming, Torres at `start` and `post_ko_choice`, the Recruiter, the debrief, the briefing, and HaX with every topic open): no runtime errors.
- **Visit-count openers:** none. No `TURNS()`, `READ_COUNT` or knot-name condition appears anywhere. Every opener is keyed on a synced global or a saved ink local (`first_meeting`, `hub_quiet`, `accused_acknowledged`, `reinstated_said`), so nothing replays after a reload. The only once-only `*` choices are in the Recruiter's linear first call, which reopencheck covers.
- **Printed variables in voiced lines:** none. `player_name` is declared in every file and read in none. The only inline conditional in a voiced line (Recruiter :181) chooses between fixed strings.
- **Stage directions as text:** two asterisk cues in 840 lines (Halloran :299 `*quietly*`, Torres :336 `*a beat*`), well under m01's density. Neither sits on a number.
- **Longest run without a choice, per conversation** (worst over the 28 routes, counted from the route transcripts):

| Conversation | Longest run | Where | Target ≤ 9 |
|---|---|---|---|
| debrief | **37** (r2, r18); 36 (r15, r16); 27 (r12); 24–25 (r3, r8, r20) | `start` to the first choice in the Torres path; the deal path (r2) has **no choice at all** | fails (D5-1) |
| patricia (in person) | **13** (r8); 12 on ten routes | `significant_findings` | fails (D5-4) |
| briefing | **10** (every route) | `start`, Netherton and Nightshade, up to HaX's first question | fails by one (D5-28) |
| patricia_phone | 9 | `phone_significant_findings` | at target |
| torres | 8 | `torres_rationalization` → `evidence_revelation` | passes |
| recruiter | 7 | the casualty reply into `recruiter_deal` | passes |
| phone (HaX) | 6 | `on_owen_ko_relay` | passes |
| owen, halloran | 5 | — | passes |
| lisa | 3 | — | passes |

## Severity table

Counts: **0 blockers, 8 majors, 26 minors.** No lint finding was withdrawn, and the lint had nothing structural to report.

### Majors

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-1 | major | `m05_closing_debrief.ink:177-367, 554-560, 670-752` | **B3.** The longest run without a choice is 37 lines (r2, r18), 36 on r15 and r16, and 24–27 elsewhere. On the hand-over-with-deal ending (r2) the player never chooses anything. The pass-5 "what failed" beat added three lines to that run. The tail after the last choice runs 13–16 lines, and it ends on two summing-up morals and three "one more/last thing"s. m04 and m06 reached 9 or fewer. | See **Structural findings: how to fix B3** below. In short: four player beats (a reaction to the bar, varied by route; a portal beat that hands the remedy to Owen; a beat in the deal path; a beat at the revelation), a choice that replaces the summing-up line in the tail, and four cuts (:180 merged into :178, :242, :252, :746's "One more thing."). Every run comes out at 9 or fewer. |
| D5-2 | major | `m05_phone_agent_0x99.ink:168-224` | **P10.** After the naming and before the fate, the hub can show 14 choices: confrontation, Recruiter, pamphlet, leverage, journal, Architect, four flags, moral board, guides, "Where do I stand?" and the exit. The four flag topics label flags by number ("First flag's in"), but since P3 the flags can arrive in any order and the texts name them ("Login flag", "Foothold flag"). `topic_flag4` (:390-392) still says "before you face Torres" after the fate. | See **Structural findings: how to fix P10**. Fold the four flags into one choice that answers the newest flag, and fold leverage, journal and the moral board into one "About Torres" choice with a choices-only follow-up. The pamphlet topic retires once Torres is named. That gives at most 9 choices. |
| D5-3 | major | `m05_npc_patricia_morgan.ink:391, 417`; `m05_phone_patricia.ink:198, 217`; `m05_phone_agent_0x99.ink:519, 537` | The deduction plays as a quiz, and someone else gets the moment of seeing it. The right reason is phrased as an instruction, "[Check who comes in the front door just before the spare is used.]", and Patricia (or HaX) then reads the pattern out: "…His badge at the front door, then Ruth's spare at the server hallway six minutes on." The player picks an answer from seven, and the line that cracks the case is someone else's. | Let the player state what they found, and let the listener react to it. Choice on all three surfaces: `[His badge comes in the front door six minutes before her spare. Every night.]`. Patricia :417 → `Patricia Morgan: *runs a finger down the sheet* …Every night. And Ruth's own badge never comes in after seven.` then `Patricia Morgan: I sign that log off every Monday. I never once read the front door.` (this pays off her "I let a polite email stop me" arc). Phone :217 the same two lines without the cue. HaX :537 → `Six minutes, every night. That's the pattern.` Keep :421 and :538. The change is wording only; the tags and conditions stay as they are. |
| D5-4 | major | `m05_npc_patricia_morgan.ink:435-495` | `significant_findings` runs 12–13 lines with no choice, and reads as an evidence checklist: Money. His own journal. The staging manifest. And a firm called TalentStack. Then she gives four lines of orders. The mission's best human beat ("I sat three desks from him at the Christmas party. His kids drew on the tablecloth.") is buried in the middle. | Put a player beat after `…Damn.` (:460): `+ [You knew him.]` → `Patricia Morgan: I sat three desks from him at the Christmas party. His kids drew on the tablecloth.` / `+ [I'm sorry. He's one of yours.]` → `Patricia Morgan: He's Ruth's. But I vetted him. I sat three desks from him at the Christmas party.` Both then go to a new stitch holding :464-494. Cut :472's second sentence ("I'll keep the building quiet and the CEO out of your way."), because :492 already says what she'll do. The runs become about 6 and 7. |
| D5-5 | major | `m05_phone_recruiter.ink:200-203, 296-308`; `m05_closing_debrief.ink:625-627` | Hanging up on the offer ("[I'm done talking. This call's over.]") leaves the deal undecided. When the player rings back, `mid_mission_contact_choices` offers "[I already told you. No deal.]", which quotes a refusal that was never made. It doesn't set `recruiter_deal_decided`, she still answers "Think it over. I'm not in a hurry.", and the debrief then says "You never gave her an answer." The ring-back also offers no way to take the deal. | Rewrite the three ring-back choices: `+ [No deal.]` → `~ recruiter_deal_decided = true` → `Then we're done. I'll be more careful with the next one.` → `-> hangs_up`. `+ [Run the terms past me again.]` → `-> recruiter_deal_terms`. `+ [I'm done talking.]` → `-> end_contact`. The spoken refusal then counts, the debrief agrees with it, and a player who hung up to think can still take the deal. |
| D5-6 | major | Patricia :91, 96, 101, 131, 232, 263, 286, 353, 404, 468; Owen :73-281 (11 sites); Halloran :75-217 (10); Lisa :51-187 (11) | m05 has **no** `#influence_increased` or `#influence_decreased` tags (grep: 0; m04 Vance has 17, m06 Irina 16). Influence gates real hand-overs: Halloran's spare (≥ 25), Owen's office spare (≥ 30), Patricia's confession and the CEO email (≥ 6, ≥ 7), and Lisa's car-park and treatment-cost lines. A player who is rude to Halloran never learns why she won't hand over the badge. | Put the tag on its own line directly above the next line the NPC speaks after each change (never above a `Narrator:` line or a divert). For example, Halloran :112-113: `~ halloran_influence += 10` / `#influence_increased` / `Dr Ruth Halloran: Thank you. Not many in your line would say that.`. Owen :73: put the tag above network_situation's first line. Where the change comes after a branch's last spoken line (Owen :161, :178; Halloran :99, :181, :194; Lisa :130, :149, :163), move the change and its tag above that line. Owen :193 has no line at all (D5-26). |
| D5-7 | major | `m05_phone_agent_0x99.ink:251, 280, 785-787, 793-794` | One moral, delivered three times by HaX, and once more, better, by the Recruiter. "The ideology comes later, once the casualties stop feeling like the point" (:251). "ENTROPY rarely recruits believers. They recruit desperate people and sell them the belief afterwards" (:280). "ENTROPY weaponises suffering. They find someone drowning and throw a rope with a hook in it." (:785). Then "None of that excuses him… he could have walked into Patricia's office. He didn't." (:787), which is the Recruiter's closing point ("the price was real, and he still took it", :361). The voice bible says HaX "states the cost and lets it sit". Here she lectures. | Keep :280, so the leverage topic owns "desperate, then sold the belief". :251 → `She finds someone in trouble and makes an offer. By the time they read the small print, they've already spent the money.` :785-787 → `You've read what he's carrying. I won't tell you what he deserves.` / `Ask me what you want to ask.`. :793-794 → `Maybe it changes what's fair. It doesn't change the upload.` That leaves "he still chose" to the Recruiter, and the person who sold him the deal delivering it is the sharper choice. |
| D5-8 | major | `m05_npc_patricia_morgan.ink:166-200`; `m05_npc_dr_halloran.ink:161, 288-301`; `m05_npc_lisa_park.ink:109, 185`; `m05_npc_owen_gallagher.ink:141, 327` | After the fate (the sweep and call-in phase invites a walk back through the building) nobody has noticed. Patricia, who called the police, greets the player with "Go on." and still offers "[Anything else I should know before I go in?]". Halloran's "What happens to him now?" gets "[That depends on whether he helps us.]". Lisa's "[I don't know yet. I'm trying to find a way that doesn't wreck them.]" and Owen's "[Keep it to yourself until it's over.]" are still offered. None of these files declares `final_choice`. | Declare `VAR final_choice = ""` in all four files. Patricia's hub re-entry: `{ - final_choice == "arrest": Patricia Morgan: Police are on their way up. I've given them the side door. Nobody in this building needs to watch. - final_choice == "public_exposure": Patricia Morgan: You let him walk out of my building. I hope you know what you've started. - final_choice == "combat_nonlethal": Patricia Morgan: Ambulance is in the car park. I'll go down with them. - final_choice == "combat_lethal": Patricia Morgan: There's a crew in my data centre. Tell me you didn't walk past him. - final_choice == "turn_double_agent": Patricia Morgan: I'm told he's gone home. I'm told nothing else, and I'm not asking. - else: (the existing re-entry) }`. Gate :192 with `final_choice == ""`. Halloran: gate `[That depends on whether he helps us.]` with `final_choice == ""`, else `+ [It's out of my hands now.]` → `Dr Ruth Halloran: It was never in yours. Mine, maybe.`. Lisa :185: `final_choice == ""`, else `+ [It's done. I'm sorry.]` → `Lisa Park: Don't be. Just… don't tell me which way.`. Owen :327: `final_choice == ""`. |

### Minors: the briefing and HaX

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-28 | minor | `m05_insider_trading_opening.ink:25-47` | The opening runs 10 lines (narration, Netherton ×3, Nightshade ×3, Netherton, HaX ×2) before the player says anything. That is one over target. | After Netherton's Task Force Null line (:33): `+ [Bought a person how?]` → `Director Magnus Netherton: That is what you are going to tell me.` / `+ [Then we find out who sold.]` → `Director Magnus Netherton: Quite.`. Both continue to Nightshade. The runs become 4 and 7. **Keep Nightshade's "calm" line word for word:** m08 quotes it back (`m08_suspect_nightshade.ink:64`). |
| D5-31 | minor | `m05_insider_trading_opening.ink:278, 283, 304` | The approach replies are thin. "Speed's good." says nothing. For the cautious player, "Give it the time it needs" (:278) is followed two lines later by "Just watch the clock while you're at it" (:304), which pulls the other way. | :278 → `Agent HaX: Good. Write it all down. The police will want every page.`; :283 → `Agent HaX: Fast's fine. Sloppy isn't.` Keep :304. |
| D5-14 | minor | `m05_phone_agent_0x99.ink:149, 155` | In the first call, "one person who made a terrible choice under terrible pressure" gives away the motive before any evidence, against the briefing's "Don't decide the insider's story until you've seen all of it". Separately, "Then you lose any chance of turning them" is false: on the accused route the turn ending is still open, and the real cost (D2) is a shorter clock. | :149 → `Nobody in there is your enemy by default. It's an office, and one person in it has made a very bad trade.`; :155 → `Then you're racing a clock that's just got shorter.` |
| D5-12 | minor | `m05_phone_agent_0x99.ink:947` | The hint ladder's second rung, "That log says Halloran's spare. Ask her where it lives.", is stale after puzzle R2-2: the spare doesn't live anywhere, it's signed out through her. | `That log says Halloran's spare. Ask her who signs it out.` |
| D5-16 | minor | erb:945 then `m05_phone_agent_0x99.ink:272` | The bills text says "Three hundred and eighty thousand dollars, and the insurer walked away." A call straight afterwards opens `topic_leverage` with "Three hundred and eighty thousand dollars for a trial abroad, an insurer that walked away…". The player hears the same fact twice in a row. | :272 → `A trial abroad, a wife with Stage 3 cancer, and nobody left to ask.` Keep :273. |
| D5-15 | minor | `m05_phone_agent_0x99.ink:390-392` | `topic_flag4` says "Read the number on it before you face Torres. He's seen it too." It's reachable after the fate (no `final_choice` guard), when it's wrong. P10's fold covers it; if the flags stay separate: | `{final_choice == "": Read the number on it before you face Torres. He's seen it too.\|That's the number he read, and kept going.}` |
| D5-17 | minor | `m05_phone_agent_0x99.ink:360`; erb:959 | `topic_flag1` opens with "Somebody's sloppy handover note got you that login." The flag text has just said "An admin login, left lying about in a handover note." | Covered by P10's fold. Otherwise :360 → `Now use it.` |

### Minors: Patricia, Owen, Halloran, Lisa

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-11 | minor | `m05_npc_dr_halloran.ink:247-261` | The wrong-accusation cost misses its best moment. A suspended Halloran gives her Zurich alibi to the person who had her suspended in exactly the words she'd use to anyone. The suspension greeting (:242) bites; the alibi scene that follows doesn't. | First line of `spare_badge`: `{halloran_accused and not torres_identified: Dr Ruth Halloran: You could have asked me this before you rang Security.}` |
| D5-33 | minor | `m05_npc_dr_halloran.ink:277` | "I failed him. As his manager, and as his friend." tells us what she feels in stock words. Her Dublin voice is precise and concrete everywhere else. | `Dr Ruth Halloran: I signed his overtime every week and never once asked what it was for.` |
| D5-25 | minor | `m05_npc_owen_gallagher.ink:262-263` | "[Fair enough. I'll be back.]" goes to the hub, which then prints "What else?" or "Yeah?" after the player has said they're leaving. | `Owen Gallagher: I'll be here. Always am.` / `~ hub_quiet = true` / `#exit_conversation` / `-> hub` |
| D5-26 | minor | `m05_npc_owen_gallagher.ink:192-194` | The influence ≥ 25 branch in `ask_security` adds influence and says nothing, so the threshold rewards nobody. | Give it a line: `Owen Gallagher: Off the record? Half the office spares open more than they should. Nobody's audited the cards since I started.` Or delete the branch. |
| D5-27 | minor | `m05_phone_patricia.ink:103-104, 291-300` | "[He's in the data centre.]" gets "I know. Ring me when it's done." and a one-choice close: a whole exchange that adds nothing. | `I know. I'm watching his badge on the vault log. He hasn't moved.` / `Ring me when it's done.` |
| D5-35 | minor | `m05_npc_patricia_morgan.ink` (whole) | Patricia's Cardiff voice is carried by the voice style and by a little phrasing ("Go on, then", "tidy"). That's enough. No change needed. If one word is wanted, put it in a line already under strain, never in a greeting. | Optional: :460 `Patricia Morgan: …Duw. Damn.`. Don't add more than one. |

### Minors: the Recruiter and Torres

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-9 | minor | `m05_phone_recruiter.ink:83, 114, 120, 177, 179, 208, 219, 225, 249, 292, 340, 363`; `m05_torres_confrontation.ink:283-284` | "Forty-seven" comes up six times in the Recruiter's first call and ten times over a route (r11, r12). It's her best number, and saying it this often wears it out. | Keep :83, :179 (the envelope), :249 and :363 (her closer). :114 → `He was a line item, agent. There are more like him in the pipeline right now.`; :120 → `And it won't help the others, unless you move faster than I do.`; :177 → `But I'd rather you didn't spend the next six months chasing the rest of my pipeline.`; :208 → `Nothing dramatic. You forget the envelope.`; choice :219 → `[Fine. The envelope goes to Reading. I never saw it.]`; :340 → `It changes nothing about the rest. I'll simply be more careful with whoever's next.` |
| D5-10 | minor | `m05_torres_confrontation.ink:283-284` | The narrator says the Recruiter has "forty-seven more names lined up behind him", and Torres answers "Forty-seven...". The echo tells us nothing new and wastes his last unguarded moment before he agrees. | Narrator :283 → `Narrator: You tell him the Recruiter rang you tonight, and that he isn't her only one.`; :284 → `David Torres: She told me I was the only one.` |
| D5-24 | minor | `m05_phone_recruiter.ink:138-142, 147` | Two choices go to the same knot with no variable set. The second asks "Why does ENTROPY want control of emergency dispatch?", and her reply answers the first ("I'm talking about a forty-to-seventy-minute failover window…"). | Give the second its own first line in the choice body: `Control? Nobody wants to run it. We want the minutes.`, then divert. Change :147's opener to `A forty-to-seventy-minute failover window…` so it reads after either choice. |
| D5-36 | minor | `m05_phone_recruiter.ink:233, 325` | On the deal route, both calls open on "Sensible." | :325 → `We're square, then. The file's forgotten on my end too.` |
| D5-22 | minor | `m05_torres_confrontation.ink:487` | After "I'm going public", the only follow-up the player gets is the cruellest line in the game ("You'll be named. Elena will read it. The kids will see your face."). The ending can be chosen for the programme without wanting to hurt the family, and the player can't say so. | Add `+ [I'll keep your name out of it if I can. I can't promise.]` → `David Torres: You can't. They'll find it. They always find it.` → `-> public_exposure_consequence`. Keep the cruel choice as the other option. |
| D5-23 | minor | `m05_torres_confrontation.ink:172-174` | "He opens his mouth to answer, then stops himself." is followed at once by a four-line answer. | `Narrator: He almost laughs.` |
| D5-13 | minor | `m05_torres_confrontation.ink:107`; "properly" at `m05_phone_agent_0x99.ink:480, 590`, `m05_npc_patricia_morgan.ink:294, 500`, `m05_phone_patricia.ink:285`, `m05_closing_debrief.ink:278` | The early-naming reward, "You're early. Somebody read Owen's sheet properly.", makes Torres know which document gave him away. "Read it properly" also turns up six times across HaX, Patricia, Torres and the debrief, twice in a row on r2 (Torres, then the debrief). | Torres :107 → `David Torres: You're early. I thought I had until the server gave me up.` (the reward condition stays the same). HaX :480 → `Six minutes before her spare, every night. That's the one.`; Patricia :500 and phone :285 → `…Six minutes before her spare, every night. I should have seen that myself.`; debrief :278 → `You read the whole badge log, not just her line. Her spare on the server hallway, his badge on the front door six minutes before, every night.` Keep :294 and :590. |
| D5-32 | minor | `m05_torres_confrontation.ink:562` | "Operation Schrödinger is stopped." is the first time any spoken line names the operation. Only the upload-schedule document (erb:1959) and the credits use the name, so a player who never read the schedule meets it here. | Plant it once, early, in the Recruiter's reveal (:131): `We keep it. We integrate it. Operation Schrödinger, if your file needs a name.` Keep :562. |

### Minors: the debrief and structure

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-18 | minor | `m05_closing_debrief.ink:310-314` | The new "what failed" beat lands at the right level (no commands, no versions). Its last line, "Patch it, rotate the logins, trim the rights. QDC's own staff could have done all three.", is a three-item checklist. It's the one place the debrief lectures. | Hand the remedy to a person the player has met (Owen: "Budget cuts", and a password that has been "temporary for a year"). Built into the B3 fix as a choice: `+ [Whose job was that?]` → `Agent HaX: Owen's, on paper. He asked for the budget twice. The CEO wanted a clean file more than a safe one.`. Cut :314. Needs checking against SecGen by the user only as far as D12 already covers :310-312. |
| D5-19 | minor | `m05_closing_debrief.ink:645, 717, 746` | The tail says "One more thing." (:645), "One last thing." (:717) and "One more thing." (:746). On r2, the last two come four lines apart. | :746 → `Agent HaX: The people who'd have waited too long for that ambulance will never know your name. But they're alive.` (drop the opener). :717 goes in the B3 tail rewrite. |
| D5-20 | minor | `m05_closing_debrief.ink:251-253`; `m05_insider_trading_opening.ink:300` | "That was thirty to forty-five people, in the first wave alone." plays on every route, because `knows_full_stakes` is set without a condition at opening :300, so its guard does nothing. It repeats the briefing and is said again by the closing line (:746). | Cut :251-253. The closer carries the number's weight. The guard on :745 can stay; it's harmless. |
| D5-21 | minor | `m05_closing_debrief.ink:717-719` | "There was never a clean way to handle Torres. How you handled him tells me what kind of agent you are." sums up the scene, which the voice bible says HaX never does. It then leads into two more verdict lines. | Replaced by the B3 tail choice (below). |
| D5-30 | minor | `m05_phone_recruiter.ink:14, 153`; `m05_phone_agent_0x99.ink:38, 640, 646`; erb:624; `m05_npc_dr_halloran.ink:44-45`; `m05_torres_confrontation.ink:42`; `m05_npc_patricia_morgan.ink:40` | Dead variables. `recruiter_persuasion_attempted` (a local) is set and never read. `torres_fate_by_phone` is a declared global, set twice in HaX's ink and read nowhere (no ink, no erb condition, no credit). Some synced VARs are declared but never read in their file: Halloran's `torres_suspected` and `door_log_reasoned`, Torres' `door_log_reasoned`, Patricia's `found_incident_log`. | Delete the local and its assignment. Either drop `torres_fate_by_phone` (VAR, two assignments, the erb global) or use it in the debrief (`{torres_fate_by_phone: Agent HaX: You made that call on the phone, standing over him. I heard you make it.}` in `torres_killed_path`). Delete the four unread declarations. |

D5-29 (Nightshade's "calm") was withdrawn while I was drafting: it's an m08 plant, noted under D5-28. D5-34 was folded into D5-7.

## Does it play like a TV spy thriller?

Mostly, and the strongest scenes are among the best in the campaign. Torres' confrontation is the best-written climax so far. He never raises his voice. His rationalisation breaks off halfway ("Because thirty to forty-five people is... is... / Is thirty to forty-five families. Like mine."), and every ending gives him a short line that hurts: "They're eight and eleven." on exposure, "Where would I go?" on the hand-over, "I didn't think anyone would give me a way out." on the turn. The briefing gets dramatic irony for nothing: Netherton brings in Nightshade "because catching a mole is precisely his trade", and m08 pays that off. The Recruiter is a properly chilling phone voice ("You're describing the outcome as though I invented the cancer.").

It falls short in four places:

1. **The deduction is a menu.** The player picks the right reason from seven, and Patricia or HaX says the line that cracks the case (D5-3). The case summary then reads as a checklist (D5-4). This is the scene the mission is named for. It should be the player's moment, with Patricia reacting.
2. **The debrief talks for 37 lines** before the player says anything, and on the deal ending it never lets them speak at all (D5-1). It ends on HaX summing the player up, which isn't her (D5-21).
3. **HaX lectures.** She delivers the "desperation, then the belief" moral three times, and then the Recruiter's moral before the Recruiter can (D5-7).
4. **The building doesn't react to the ending** (D5-8), the same gap m06's cycle 1 found with Dani and Priya.

### Endings

- **Turn.** It lands. The Elena argument is always available. The journal and flag-4 arguments reward evidence, and Torres' reply to each is in character ("I just never let myself finish the sum."). The one weak spot is "Forty-seven..." (D5-10).
- **Hand over, with the deal.** It lands in the scene ("And the court? *a beat* No. You can't promise that."). In the debrief it has no player beat at all (D5-1c).
- **Hand over, without the deal.** It lands: "I'm not a social worker, David." / "No. Of course not." is the coldest exchange in the mission, and the debrief follows through ("That's what the review board will want to hear. I'm not sure I do.").
- **Fight, then stay.** It's clean. The "Detained at the terminal" split for the unprovoked KO is honest.
- **Fight, then leave (lethal).** This is the best-handled ending. The choice text doesn't soften it ("Leave him bleeding on the floor."). The narration is two short sentences. HaX's texts go cold ("If you're leaving him there, take what's on that desk and go."), and the call-in's "Your call. He hasn't got long." makes the player choose to delay knowing what it means. The debrief's "The pathologist thinks twenty minutes would have been enough." is the hardest line in the game. No changes.
- **Exposure.** It lands, but the player is forced to say the cruellest line (D5-22).

### The pass-5 material

- **Hint ladder.** Sound, and the order is right. The second rung is stale since R2-2 (D5-12). "Her spare goes in at night. Look at who comes through the front door just before it." is a good last rung: it gives the method without giving the name.
- **Wrong-accusation cost.** Well wired: the nudge text, Torres at 99 per cent, "One region's schedule went an hour ago", the East of England in the debrief, the AT A COST title. Patricia's "That's on both of us now." is right. Halloran's alibi scene is where the cost should hurt most, and it doesn't (D5-11). HaX's first call misstates the cost (D5-14).
- **Early-naming reward lines.** The debrief's "You had him before the server did." is exactly right. Torres' "Somebody read Owen's sheet properly." makes him know too much (D5-13).
- **Retry reactions.** "Again? Fine. Convince me this time." and "Second go. Make it count." are both in voice and short. No changes.
- **Lethal-ending texts.** Good (see Endings). No changes.
- **The call-in.** It's in m04's shape and well written. "Once you're out, QDC's own people go through that vault before ours do. Whatever you haven't read could walk." gives the sweep a reason inside the story, and "Ring her if you want to hear her lose." is the best line HaX has. No changes.
- **The "what failed" beat.** It's pitched at the right level until its last line, which is a checklist (D5-18). It also lengthened the worst run (D5-1).
- **Reinstated Halloran.** "Patricia's given me my access back. I'll want an apology from you. Not tonight." is very good: dry, Irish and wounded in three short sentences. The suspended greeting ("I'm to wait here for the police. On your say-so, I gather. Ask what you came to ask.") is as good.
- **The Recruiter's call-backs.** "We have an arrangement. Don't ring this number again." and "You said no once. I heard you." are good, and "She hangs up first." is the right close. The hang-up-then-ring-back path is broken (D5-5), and "forty-seven" is worn out (D5-9).

## Voice notes, per NPC

- **Patricia Morgan (Cardiff, ex-military police).** Distinct and well held. She's brisk and dry ("Direct. Good.", "Then we can skip a step."), and her warmth comes through in what she notices ("His kids drew on the tablecloth."). Her arc (a polite email stopped her, and she's eager to act) shows in "I've waited three weeks to do something. All right." when the player accuses Halloran, which is the best character beat on the wrong-accusation path. Her accent is carried by the voice style and a little phrasing; that's enough (D5-35). Weak spots: the checklist summary (D5-4), the moment of seeing it given to her (D5-3), and no reaction after the fate (D5-8).
- **Owen Gallagher (Manchester sysadmin).** The most consistent voice in the mission: "Alright.", "that lad", "Give us a sec", "cheers", and the running joke about the password that's been "temporary for a year". The clone scene ("Did your bag just beep? …You read my badge. Fair.") is light without being silly. His "He stood in that hallway looking wrecked and I just... walked past him." pays off his own earlier line, so a player who heard both gets a reward. Only the small fixes D5-25 and D5-26.
- **Dr Ruth Halloran (Dublin research lead).** Sharp and precise, with Irish turns that never tip into caricature ("Go on, so.", "You'll not lift anything of mine in here."). "That's a problem for the 2030s. Tonight's problem is simpler." and "I've done the arithmetic. I try not to look at it." are her best. She drops into stock words once (D5-33). The suspension and reinstatement lines are among the best in the mission. The alibi after an accusation needs her edge (D5-11).
- **Lisa Park (south-west London, marketing).** Warm and chatty, with real observation: "like it's a game of Cluedo", "poor lamb", "I saw him crying in the car park last month. I pretended I hadn't. Still feel awful." Her reaction to the naming ("What happens to Sofia and Miguel?") is the human cost said by someone outside the case, which is her job in the story. Only D5-8.
- **David Torres (Castilian Spanish, twenty years in England).** The voice is exhausted, not angry, as the style asks, and his short lines carry it. The accent rests on the style alone, which is right for a fluent speaker. Fixes: D5-10, D5-13, D5-22, D5-23. His opening ("I know you're there. Patricia sent you.", "'Security consultant.' You're not an auditor.") sets up the scene in two lines.
- **The Recruiter (Mid-Atlantic, Washington DC).** Corporate American vocabulary does the accent's work: "placements", "line item", "disposition", "acceptable cost of acquisition", "iron in the fire". She's patient and never raises her voice. Her final statement ("He signed anyway. Everyone I recruit signs anyway.") is where the mission's moral belongs (D5-7). Fixes: D5-5, D5-9, D5-24, D5-36.
- **Agent HaX (RP handler).** On the phone she's mostly on model: short, fact first, dry ("It's efficient. Some nights that's worse.", "Owen's down. That wasn't how I'd have done it."), and she refuses to choose for the player ("I'm not going to answer that. You've seen what he's carrying. It's your call."). Two drifts: lecturing (D5-7), and the debrief's summing-up and "one more thing" tail (D5-19, D5-21). No exclamation marks, no catchphrases, no "great job".
- **Director Netherton (RP).** On model: designation first, short declaratives, and one dry line ("three people and a whiteboard"). He hands over fast ("Sound advice. HaX -- the detail."). His contractions ("we've", "it's") are within the m04–m06 range the bible accepts. D5-28 gives him one more line, in his register.
- **Nightshade (RP analyst).** Three lines, each medium length and then quotable, as the bible describes. Keep them word for word: the "calm" line is quoted in m08.
- **Narrator (noir).** Spare and well judged: "20:14. The data centre. The racks roar.", "He doesn't turn around.", "You step over him. He doesn't move." About one narrator line per scene beat. No line promotes a delivery cue to narration.

## Best and worst lines

**Five best**

1. `m05_phone_agent_0x99.ink:832`, HaX at the call-in: "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose."
2. `m05_torres_confrontation.ink:183-185`, Torres: "Because thirty to forty-five people is... is... / Is thirty to forty-five families. Like mine."
3. `m05_torres_confrontation.ink:493`, Torres on the exposure path: "They're eight and eleven."
4. `m05_closing_debrief.ink:433`, HaX on the lethal ending: "The pathologist thinks twenty minutes would have been enough."
5. `m05_npc_patricia_morgan.ink:462`, Patricia: "I sat three desks from him at the Christmas party. His kids drew on the tablecloth."

Close behind: the Recruiter's "You're describing the outcome as though I invented the cancer." (:79); Halloran's "I'll want an apology from you. Not tonight." (:234); Netherton's "This time it's bought a person." (opening :33); HaX's "It's efficient. Some nights that's worse." (:286).

**Five worst**

1. `m05_phone_agent_0x99.ink:785`, HaX: "ENTROPY weaponises suffering. They find someone drowning and throw a rope with a hook in it." A lecture, a laboured metaphor, and the third time she has made the point (D5-7).
2. `m05_closing_debrief.ink:314`, HaX: "Patch it, rotate the logins, trim the rights. QDC's own staff could have done all three." A checklist in a debrief (D5-18).
3. `m05_phone_agent_0x99.ink:794`, HaX: "Both are true at once. Nobody's philosophy handles that cleanly." Filler that makes a point the line before it already made (D5-7).
4. `m05_torres_confrontation.ink:284`, Torres: "Forty-seven..." An echo in place of a reaction, at his last unguarded moment (D5-10).
5. `m05_npc_dr_halloran.ink:277`, Halloran: "I failed him. As his manager, and as his friend." She names her feeling instead of showing it (D5-33).

Dishonourable mention: "Speed's good." (opening :283).

## Structural findings

### Skill checks, one line each

- **2a attribution.** OK. Every `Name:` prefix resolves (validator). Phone inks carry no self-prefix. The `#speaker:` tags are all redundant with prefixes, and none names a third party without a prefix.
- **2a-bis, supported by the scenario.** OK. The movements the dialogue describes (Torres shown on naming and waiting in the vault, the Lab Rules notice, the visitor spare) were checked in the earlier phases.
- **2b choice phrasing.** OK. Every bracket is the player's own words. The one `You: ...` (Recruiter :87) follows a non-verbal choice, which is the allowed exception.
- **2c hub structure.** OK. Every person-chat has a sticky exit with a one-line reply. No hard `END` except the briefing and debrief cutscenes.
- **2c-bis starved knots.** None: loopcheck is clean on every entry knot.
- **2d choices that matter.** Mostly good. The briefing stance (`player_approach`) and Torres' stance (`confront_stance`) are both read back in the debrief. Flat pair: Recruiter :138/:141 (D5-24). Single-choice beats in the turn path (:272, :287) are pacing, not decoration, so they're OK.
- **2e cross-file state.** OK, with D5-30's dead global. Only one `#set_global` remains (`mission_complete`, declared). Everything else goes through `~` on synced VARs, and reopencheck confirms it.
- **2f influence.** Must fix: D5-6.
- **2g syntax.** OK. No `**`, no bullet dialogue, no line starting with `*`.
- **2h KO.** Covered by alignment. The debrief and credits branch on every friendly KO.
- **2i recurring bugs.** "Where do I stand?" stays current at every stage on the routes. Choices that quote unsaid lines: D5-5. The same fact twice: D5-13, D5-16, D5-17. Hub greetings vary (`{&…}`) in all four person-chats. Credit and debrief lines agree on every route (checked by the routes' `said` and `notSaid`).
- **Fall-through choices, exits with no reply, stage cues printed, printed variables, visit-count openers:** none (see Step 1). The one near-miss is Owen :262 (D5-25).

### How to fix B3 (the debrief's runs)

The run starts at `start` and doesn't stop until the first choice inside a Torres path. On the deal ending (`torres_arrested_with_treatment_path`) there's no choice at all, and the tail runs 13–16 lines. Five beats and five cuts bring every route to 9 or fewer. I checked the counts by hand against r2, r3, r6, r12 and r15; the fixer should re-measure with the route transcripts.

1. **Open faster** (`start`, :178-183). Merge the two narrator lines: `Narrator: SAFETYNET headquarters, Thursday, nine o'clock. HaX has your report up on the screen.` Keep "Let's go through it."
2. **Trim the bar** (:236-253). Accused: merge :238 and :239 (`…stopped at ninety-nine per cent. Most of the rotation windows were in the last of it, and they never went.`) and cut :242. Cut :251-253 (D5-20).
3. **Beat 1: a reaction to the bar, varied by route.** A new choices-only knot after `mission_outcome_assessment`:
   ```ink
   === bar_reaction ===
   + {halloran_accused} [One region. Because I named the wrong person.]
       Agent HaX: Yes. That goes in the file next to your name.
       -> the_night
   + {halloran_accused} [How bad is the East of England?]
       Agent HaX: A month of overtime for the Home Office. Nobody dies of it, because they moved first.
       -> the_night
   + {not halloran_accused} [How close was it?]
       Agent HaX: {named_before_portal: Nine per cent of room. You bought that yourself.|Three per cent. I'd rather not do that again.}
       -> the_night
   + {not halloran_accused} [Then it worked.]
       Agent HaX: It worked.
       -> the_night
   ```
   The run to here is at most 8 (accused).
4. **Beat 2: the portal, with the remedy in Owen's hands** (:303-314). After "It's why nobody saw him." (:305): `+ [And the research portal?]` → :310 as is / `+ [Nobody was watching the logs?]` → `Agent HaX: Owen was, on his own. The portal was worse: old software nobody had patched, and an admin login in a handover note.`. Then :312, then `+ [Whose job was it to fix that?]` → `Agent HaX: Owen's, on paper. He asked for the budget twice. The CEO wanted a clean file more than a safe one.` / `+ [QDC won't thank me for that part.]` → `Agent HaX: The board won't. Owen might.`. Cut :314 (D5-18). The run from beat 1 is at most 9, and only with all four friendly KOs. Two lines sit between the two choices.
5. **Shorten the signs and the hand-off** (:316-350). Fold the header into the first sign (`Agent HaX: For the training file: money. Debts he didn't declare, and treatment no insurer would touch.`, with the next lines starting `Hours.`, `An approach.` as now). Cut :350 "And David Torres..." because every path's first line names what happened to him. The run into each path's first choice becomes at most 9. To keep exposure inside it, merge :571 and :573 (`Agent HaX: You went public. The Initiative is front-page news, TalentStack's offices are empty, and the police picked Torres up the next morning.`).
6. **Beat 3: the deal path** (:554-560). After :556: `+ [Will the court know he talked?]` → `Agent HaX: It'll know he helped the police. Not us. He made that deal with his eyes open.` / `+ [And the family?]` → `Agent HaX: Sofia and Miguel get their mother through this, and a father on remand. It's more than they had at eight o'clock last night.`. Cut :558. Then :560. That gives r2 its first choice.
7. **Trim the exposure aftermath** (:591-611). Cut :611 ("Expect them to hit back…"), which says the same thing as `future_implications` :703 ("We'll be watching for their reply."). Merge :599 and :601 (`…nobody hears about us at all. This week, three newspapers are asking who their source was.`). The run after the exposure choice becomes 8 or fewer.
8. **Beat 4: the revelation** (:675). After the authorisation line: `+ [Same hand as the other cells?]` → `-> cells` / `+ [Who signs off on a number like that?]` → `Agent HaX: Someone who never has to hear the ambulance not come.` → `-> cells`, where the stitch `cells` holds :677-685. This is convergent by design: two stances on the same facts.
9. **Beat 5: the tail** (:714-752). Replace :717-719 (D5-21) with a choice after `future_implications`: `+ [Did I get him right?]` → `Agent HaX: There wasn't a right. There was what you did with him.` / `+ [I'd do it the same way again.]` → `Agent HaX: I know. I read the report.`. Then the stance line, the trust line, :743, :746 without "One more thing." (D5-19), and :752. The tail becomes 6 lines.

None of this changes a condition or a global, so the routes' `said` checks need updating only where they quote a cut line.

### How to fix P10 (HaX's 14-choice hub)

```ink
// support_hub, replacing the four flag choices (:197-207)
+ {(flag1_submitted and not flag1_discussed) or (flag2_submitted and not flag2_discussed) or (flag3_submitted and not flag3_discussed) or (flag4_submitted and not flag4_discussed)} [About that flag.]
    -> flag_news

// replacing leverage (:188) and the moral board (:209); the journal keeps its own choice,
// because its pickup text says "Call me once you've read it"
+ {torres_suspected and has_motive() and final_choice == ""} [About Torres. What ENTROPY did to him.]
    -> about_torres

// pamphlet (:184): retire once he's named
+ {found_pamphlet and not recruitment_method_discussed and not torres_identified} [...]

=== flag_news ===
// The newest flag answers; older advice is stale once a later flag is in, so it retires too.
{
- flag4_submitted and not flag4_discussed:
    ~ flag1_discussed = true
    ~ flag2_discussed = true
    ~ flag3_discussed = true
    ~ flag4_discussed = true
    {final_choice == "": Read the number on that sign-off before you face Torres. He's seen it too.|That's the number he read, and kept going.}
- flag3_submitted and not flag3_discussed:
    ~ flag1_discussed = true
    ~ flag2_discussed = true
    ~ flag3_discussed = true
    His name's on the manifest. Root's the last door. Start with what that account is allowed to run.
- flag2_submitted and not flag2_discussed:
    ~ flag1_discussed = true
    ~ flag2_discussed = true
    You're on the box. Their home directory will tell you who's been living on it.
- else:
    ~ flag1_discussed = true
    Now use it. The upload flaw needs you logged in, and you are.
}
-> support_hub

=== about_torres ===
+ {not leverage_discussed} [Is the debt the hook?]
    -> topic_leverage
+ [Does knowing why change what he deserves?]
    -> moral_sounding_board
+ [Not now.]
    -> support_hub
```

The most the hub can show at once becomes 9, in either of two states. After the naming: confrontation, Recruiter, Torres, journal, Architect, flag, guides, "Where do I stand?", exit. With Patricia down before the naming: the naming, pamphlet, Torres, journal, Architect, flag, guides, "Where do I stand?", exit. `moral_sounding_board` keeps D5-7's shorter lines. reopencheck must be re-run, because `flag_news` prints text and then returns to a choices-only hub (the phone rule is satisfied, since the hub prints nothing). `flag1_discussed`..`flag4_discussed` are ink locals, so nothing in `missions.json` changes.

### Other structure

- **Dead variables:** D5-30.
- **Reload safety:** clean (no visit counts, no `TURNS()`).
- **Printed variables:** clean.
- **Lint:** clean apart from the two known, allowed findings.

## Prioritised action list

**Must fix**
- D5-5 (the ring-back refusal isn't recorded, and the debrief contradicts it).
- D5-6 (no influence feedback on four rapport-gated NPCs).

**Should fix**
- D5-1 (B3) and D5-2 (P10), as specified above.
- D5-3 and D5-4: the deduction scene becomes the player's.
- D5-7: HaX stops lecturing, and the Recruiter owns the moral.
- D5-8: the building notices the ending.

**Polish**
- Every minor. In order of payoff: D5-11, D5-13, D5-10, D5-22, D5-9, D5-12, D5-14, D5-18, then the rest.

## Spoken lines this review would change

All are listed with old → new wording in the tables above. The m05 cache holds 8 clips, and the briefing and debrief lines named in D5-1, D5-19, D5-20 and D5-28 are new this pass or uncached, so the re-voicing cost is negligible. The fixer should still keep the old → new list in the log, as the earlier phases did.
