# m04 Critical Failure: dialogue review, pass 5 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M04_PASS_BRIEF.md`). Alignment, puzzle chains and scenario design are closed and are not re-raised unless a line regressed. No m04 audio exists on 3.8, so no rewrite below costs a re-voice. The SecGen XML and the four listed field guides were not opened.

Finding ids `D5-n`. Tags: **blocker / major / minor**. All findings are mission-local (ink or the erb's dialogue fields) unless marked.

## Severity table

Counts: **0 blockers, 5 majors, 34 minors.** Two lint checks withdrawn (D5-25).

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5-1 | major | `m04_npc_voltage.ink:124-125` | "And not one of my people saw you come." plays whenever no operative is down. Static's room_entered challenge (erb, Static's first mapping, onceOnly, no route skips it while he's up) always fires first, so the line follows "Voltage. Company." on every such route. Seen in r5, r9 and r11. | `- else:` → `{static_stood_aside: And Static let you walk up to my bench. He'll explain that later.|You got past my people.}`. `static_stood_aside` is already a VAR here. |
| D5-2 | major | `m04_closing_debrief.ink:380-450` | The disclosure scene ignores `crew_lost`. With nine of the night crew dead, HaX offers "A maintenance fault, resolved." (:409) and "Nobody hears how close this came." (:422). Vance says "how close it came" (:391). | Add a `crew_lost` branch to each option. Quiet: `We classify what we can. Nine deaths don't go in a drawer, so it's an industrial accident, cause under investigation.` Vance (full, ≥70): `Nine of mine. People will know why.` Partial: `An incident, nine dead, cause withheld. The coroner will want more than that, and get it.` |
| D5-3 | major | `m04_closing_debrief.ink:331-333` | The mission's main moral choice is to sound the alarm or not. When the crew dies, the debrief never links the deaths to the alarm that stayed silent. The vented-by-alarm branch (:336-337) does make that link, and it's the best beat in the scene. | After :332, add `{vance_is_ally and not robert_vance_ko: Agent HaX: Vance had the evacuation alarm on his desk all night.}`. HaX states it and moves on, as the voice bible asks (`voice_bible.md:42`). |
| D5-4 | major | `m04_closing_debrief.ink:215-234` | The "what failed" beat is 11 HaX lines with no player input (the driver reports the debrief's longest run as 11). It ends on three fragments that list the fixes. This is a lecture in the handler's mouth, and the list is the bullet-dialogue anti-pattern (`README_ink_best_practices.md` "Avoid Lists in Dialogue"). | Split it into two runs with a player beat between them. Run 1 covers the weaknesses (:215-225, keep). Add a choice: `+ [And the network?]` / `+ [So what do they fix first?]`. Run 2 puts each fix next to its weakness, in three lines: `A legacy compile service on an OT box, trusting whatever it was sent. That comes off the network.` / `An FTP service handing their cross-cell plan to anyone who looked, and a jump-server account with root it never needed. Somebody reviews those.` / `Encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads.` That is 7 lines in place of 11, and no fragment list. |
| D5-5 | major | `m04_phone_agent0x99.ink:693-695, 737, 780`; `m04_phone_robert_vance.ink:185` | Four lines steer the player to the button before it can arm. HaX's `three_vector_confirmation` ("Press it and the attack's dead."), `capture_vs_speed_guidance` and `final_phase_briefing` ("Then the hardwired shutdown button. Press it.") are all offered on `attack_mechanism_known` alone, with the dial possibly unread. Vance's `safe_disabling_guidance` says "Get to it and press it. That's the mission." whenever the shutdown hasn't happened. This is the same class of bug as alignment round 2 M2. | HaX :695 → `{anomaly_detected: Press it and the attack's dead.|It won't arm till grid control has a real reading. The dial in Hall 1 first.}`. :780 the same condition. Vance :185 → `{attack_mechanism_known and anomaly_detected: Get to it and press it.|It won't arm until grid control believes you. Prove the screens wrong, then prove how.}` (declare `attack_mechanism_known`, which is already a VAR there). |
| D5-6 | minor | `m04_npc_voltage.ink:281` | The narration "…You cannot reach both." prints when the button stance isn't offered, which contradicts his "The button? Press it. Grid control won't shed a megawatt" (:288). The whole block reprints after "Not yet." (:378) and "Then let's finish this." (:92). r3 shows it three times. | Make the last sentence conditional: `{attack_mechanism_known and anomaly_detected: You cannot reach both.}`. Print the narration only on the first visit: `{confrontation_choice == 1: Narrator: …}`. Ink visit counts last for the session. |
| D5-7 | minor | `m04_closing_debrief.ink:251` vs `m04_npc_voltage.ink:191`, debrief :276 | "Social Fabric had disinformation ready in three cities", but Voltage says six, and HaX quotes him two lines later. | `Social Fabric had disinformation ready to turn the fire into a panic.` |
| D5-8 | minor | `m04_closing_debrief.ink:507-508, 535` | Never-met route: "[Just doing my job.]" gets "He'll get it. He'll want to know who was in his plant tonight…", which answers a different choice. | Give it its own knot: `Agent HaX: Then do it again. And somebody should tell Vance you were there.` |
| D5-9 | minor | `m04_closing_debrief.ink:364-469`; erb debrief mapping `background: hq1.png`; phone :419 | HaX says "See you at HQ." and the debrief plays on the HQ background, yet Vance speaks in it with nothing to explain why he's there. | At the top of `disclosure_decision`, in the Vance-present condition: `Narrator: Vance is on the line from the Albion ops desk.` |
| D5-10 | minor | `m04_closing_debrief.ink:352` | "It was still the right call." HaX sums up the moral, which the voice bible rules out (`voice_bible.md:42`). The line before it already gives the cost. | Cut the sentence: `And Vance's alarm had the night crew out before the button went in. It started your clock early.` The fact makes the point on its own. |
| D5-11 | minor | `m04_opening_briefing.ink:312`; `m04_phone_agent0x99.ink:751, 760`; `m04_closing_debrief.ink:154` | HaX gives "Lives first" in three files, plus "Right priorities. If he runs but the attack fails, that's still a win." It's the same moral four times. | Keep the briefing's. Phone :751 → `Good. If he reaches for that laptop, stop him however you have to.` Phone :760 → `Copy. Then the button's your job and he's a bonus.` Debrief :154: cut, because the line before it carries the scene. |
| D5-12 | minor | `m04_npc_security_guard.ink:41/56, 70, 74` | "Bit early for visitors" → "The regulator? This early?" → "Didn't say it'd be this early." That's "early" three times in four lines. "The regulator?" also plays after "Here are my credentials." and "My apologies…", where the player never said "regulator". | :70 → put the narration first, then `Security Guard: Regulator, is it.`. :74 → `Alright, sign in here. Mr Vance said there was an audit today. He's not happy about it, fair warning.` |
| D5-13 | minor | `m04_npc_security_guard.ink:104` | "Inspection?" replies to "Just a routine visit." The player didn't say inspection. | `A visit? Nobody told me about visitors at this hour.` |
| D5-14 | minor | `m04_npc_security_guard.ink` (whole) | No West Country in the words. The voice style asks for Bristol, but every line would read the same in RP. | A light touch, two or three lines: :129 `Oi. Where you to, then?`; :184 `Right you are, my lover.`; :175 `Quiet. That OptiGrid lot came through late on the ninth, but they had cards. Mr Vance is the one to ask.` |
| D5-15 | minor | `m04_npc_security_guard.ink:37-41`; erb `los.challengeOnSight.cooldown: 20000` | The sight challenge repeats every 20 s until he has admitted the player. Each repeat replays "The guard's already on his feet as you come through the door." and the friendly opener. | `{on_sighted > 1: Security Guard: Still need you at the desk, my lover. Badge.|Narrator: … / Security Guard: Morning. …}` |
| D5-16 | minor | `m04_npc_robert_vance.ink:159-161` then `:258-260` | Vance says he never found the order behind the OptiGrid work twice in a row: in `maintenance_question` and again in `optigrid_details_request`, which is only offered after it. | :260 → `They didn't want an escort, either. What's your concern?` This links to "Auditors get escorted, not carded." (:223). |
| D5-17 | minor | `m04_npc_robert_vance.ink:213` vs `:223` | "Staff records, maintenance logs, access to the halls. Whatever it takes." is followed at once by "Auditors get escorted, not carded." | :213 → `Staff records, maintenance logs, whatever you need off this desk.` |
| D5-18 | minor | `m04_npc_robert_vance.ink:462, 485`; `m04_phone_robert_vance.ink:124, 228` | Vance says "He won't wait for eight" and names Voltage on reveal routes where nobody told him either fact. Only "Our intelligence puts the attack at 0800." (:542) gives him the time, and nothing gives him the name. | "He won't wait for eight" → `He won't wait for his timetable.`; "With Voltage on the other side?" → `With whoever's on the other side?`; phone :124 → `Whoever's through there, somebody has to watch the hydrogen.` |
| D5-19 | minor | `m04_npc_robert_vance.ink:460, 462`; `m04_phone_robert_vance.ink:226, 229` | "your workshop job isn't done" is game-speak, and "it costs you nothing now but surprise" is clumsy. These are the cost lines of the night-crew choice, the pass's key new beat. | :462 → `Whoever's in my plant room hears it too. He'll not wait for morning. Half an hour, maybe, and you've not finished in the workshop.` :460 → `Whoever's in my plant room hears it too. Your clock's running anyway. All it costs you now is surprise.` Mirror both on the phone. |
| D5-20 | minor | `m04_npc_robert_vance.ink:311, 621-630` | "[Right. Going.]" and "[I'm going.]" both go to `vance_commits_exit`, which prints nothing. The chat closes on the player's own line. The lint misses it because of the divert. | In `vance_commits_exit`, before the tag: `Robert Vance: Go. I'll be on the desk.` |
| D5-21 | minor | `m04_npc_robert_vance.ink:447` | Once the attack is mapped, Vance opens with "The screens are lying to you.", which the player proved several steps earlier. | `Robert Vance: You know what they did. My hydrogen readout's still climbing.` (keep :448) |
| D5-22 | minor | `m04_npc_robert_vance.ink:377`; `m04_phone_robert_vance.ink:90, 92`; `m04_npc_voltage.ink:87`; `m04_npc_operative_static.ink:77` | Four characters open with "Still here." (Static says "I'm still here."), two of them in the same room. | Static: `ENTROPY Operative 'Static': {&Talk.|Still watching.|From there.}` Voltage: `Voltage: *not looking up* You came back. Nothing you say next will be new.` Vance hub: `{&What do you need?|Go on.|Aye?}` Vance phone :92 → `Vance.` |
| D5-23 | minor | `m04_npc_operative_relay.ink:167`; `m04_npc_voltage.ink:169` | The player says "Then we do this the hard way." to Relay and to Voltage. | Voltage :169 → `[Then I take that laptop off you.]` |
| D5-24 | minor | `m04_npc_operative_static.ink:79`; `m04_npc_security_guard.ink:64` | "[Leave him be.]" shows as the player's spoken bubble to Static. "[(Try to slip past the guard)]" is a third-person menu label. | `[(Leave him be.)]`; `[(Make for the inner door.)]` |
| D5-25 | minor | dialoguelint blank-reentry × 5 (F6 and the four others) | Each was checked against the erb. **Real (3):** `guard_idle` (guard:171), `voltage_captured_end` (voltage:478; this is F6), `vance_commits_choices` (vance:616). **Withdrawn (2):** `cipher_gone` (cipher:134), because Cipher is hidden by his `cipher_walked` setVisible mapping and can't be talked to; and `voltage_escape_success` (voltage:498), because `#remove_npc` (voltage:426) takes him off the board, so its two choices are dead text. Simplify that knot to one `+ [(He's gone.)]`. | guard_idle: `{guard_quiet: ~ guard_quiet = false - else: Security Guard: {&Still about?|Need something?|You again.}}`, with `guard_quiet = true` set at :93 and :182. voltage_captured_end: `{voltage_quiet: ~ voltage_quiet = false - else: Voltage: *flat* {&Still counting?|You've got me. You haven't got him.}}`, with `voltage_quiet = true` set at arrest_taken and the :454 arrest. vance_commits_choices: open with `Robert Vance: Right. What else?` |
| D5-26 | minor | erb:1310 (Vance's 20 s text), erb:1197 (HaX's flags-in text); `m04_phone_agent0x99.ink:573` | Deferred item: two automatic texts name the dial. My verdict: keep HaX's flags-in text, because it fires late to a stalled player and is the right nudge. Vance's text names the wall and the hall 17 s after his own "It's Vance. I'm on the ops desk…" (erb:1326), so two texts in a row open "It's Vance." HaX's first call (:573) also names the dial before the player has looked at anything. Between them, the HMI's "only a standalone instrument in the hall would show it" clue has nothing left to do. | Vance erb:1310 → `Every screen I've got says twenty-eight, and I don't believe one of them. Anything in Hall 1 older than the network, read it.` HaX :573 → `First, prove the screens are lying. Something in Battery Hall 1 that isn't on their feed.` The named dial stays in `hint_dial`, `report_progress`, `vance_priority` and the flags-in text, for a player who asks. |
| D5-27 | minor | see "Structural findings" | Twelve set-but-never-read or never-used VARs. `asked_the_number` (voltage:18) promises a payoff that never comes. | Remove them, or wire `asked_the_number` (D5-32). |
| D5-28 | minor | `m04_phone_agent0x99.ink:671` | "Your flags are landing." is offered only once all four are in (`attack_mechanism_known`). | `Your flags are in. Grid control can see it too.` |
| D5-29 | minor | `m04_phone_agent0x99.ink:606-613` | HaX says the jump server runs through the workshop, then the player's choice tells her "There's a terminal here into the BMS jump server." | Choice → `[Where do I start on it?]` |
| D5-30 | minor | `m04_phone_agent0x99.ink:590` | "Stay sharp. If anyone comes at you, defend yourself. Call if you need me." is three stock phrases. | `Call me when you've read that dial.` |
| D5-31 | minor | `m04_phone_agent0x99.ink:774-780` | "Last stretch. In the plant room:" followed by three list lines. | `Last stretch. Keep him off that laptop and put down anyone standing with him.` / `Then the button.` (conditioned as in D5-5) |
| D5-32 | minor | `m04_phone_agent0x99.ink:720-728`; `m04_npc_voltage.ink:217-219`; `m04_opening_briefing.ink:180-187` | Three stance choices about Voltage are never remembered: "I'll try to take him alive" / "The attack comes first", "How many does the hall take with it?" (`asked_the_number`), and the briefing's alive/quiet stance (`handler_trust` only). | Set a synced `promised_voltage_alive` at phone :723 and briefing :180. Debrief: `{promised_voltage_alive and voltage_captured: You said you'd bring him in breathing. You did.}` / `{promised_voltage_alive and voltage_escaped: You wanted him alive. You chose the button. I'd have chosen the same.}` |
| D5-33 | minor | `m04_closing_debrief.ink:225` | "a gas monitor nobody read" contradicts Vance, who watches the hydrogen readout all night on the ally route. | `The honest instruments were the ones nobody had wired to the bus: a dial on a wall, and a gas monitor off their network.` |
| D5-34 | minor | `m04_closing_debrief.ink:563` | "All three of his crew down. Thorough." repeats Voltage's "Three of my people down. Thorough." (voltage:119), which HaX never heard. | `All three of his crew on the floor. Remind me not to annoy you.` |
| D5-35 | minor | `m04_npc_operative_cipher.ink:71` | "You picked the wrong facility." is a stock villain line. | `Wrong night to be a regulator.` |
| D5-36 | minor | `m04_npc_voltage.ink:151` | "Bold. Conviction never stopped an attack." is a stock aphorism and weaker than its twin "Polite. They train that into you." | `Ja. They all say that on the way in.` |
| D5-37 | minor | `m04_npc_robert_vance.ink:558` | "God. What have I done?" | `Credentials, background checks, the lot. I never rang the firm.` |
| D5-38 | minor | `m04_closing_debrief.ink:422` | "Stability, bought with silence." is a polished aphorism the voice bible rules out. | Cut it. The sentence before carries the cost. |
| D5-39 | minor | `m04_phone_robert_vance.ink:190` | "Rush it and you trip the very thing you're stopping." is vague and untrue, because pressing the ESD can't trip the runaway. | `Steady, though. Watch the hydrogen panel in Hall 2 on your way.` |

## Step 1: compile, validator, lint, runtime

- **Compile.** All 10 ink files compile to the scratchpad with no errors and no loose-end warnings. The committed JSON is newer than every `.ink`.
- **tagdiff against the snapshot** (commit 504a46cc): `STRUCTURE UNCHANGED` for all 10 files, so this review covers exactly the snapshot.
- **Validator** (`--skip-ink --no-graph`): schema passes. Dialogue-facing items:
  - two person-chat cutscenes without `onceOnly`, which are the repeatable sight challenges and were decided in alignment round 1;
  - 12 duplicate-mapping notes on `agent_0x99`, known noise per puzzle chains F5;
  - legacy `hacker-red` sheets on Cipher, Relay and Static, which belong to the character stage.
  Every `Name:` prefix resolves to a displayName.
- **dialoguelint:** 0 errors, 5 blank-reentry checks (D5-25: 3 real, 2 withdrawn). No `exit-no-reply`, though D5-20 is one the lint can't see through a divert.
- **reopencheck:** 0 problems for both m04 phones (1800 reopens each).
- **Route driver, all 19 routes** (`route.js <file>`): every one ends `[result] all expectations met`. The "FAIL" hits in the output are the credits subtitle "CRITICAL FAILURE", not failures. r1 stats: 186 lines, 55 choices, longest run without a choice 11 (debrief, D5-4).
- **loopcheck** on each NPC's `currentKnot` and `on_sighted`, plus these states: Voltage with the button on offer and with Static down, Relay after the alarm, Vance meeting with the dial read, HaX after the shutdown, Vance phone as an ally, debrief with the crew lost, briefing. Clean, no runtime errors.

## Does it play like a TV spy thriller?

Largely yes, and the pass-5 material is the strongest writing in the mission. The night-crew thread works across four characters:
- the briefing seeds it with "He's costed them." (briefing:140);
- Vance turns it into a decision with real weight: "Your contractor wanted the halls clear from midnight. I said no." (vance:454);
- Relay pays it off coldly: "They were told to clear at midnight. If they didn't, that's on them." (relay:120);
- the alarm-clock debrief states the trade without comment (debrief:336-337).

That is subtext and consequence done properly. The rebuilt HaX hub is sharp and in voice ("Then stop talking to me and drop him.", "And Vance is on the floor of his own office.").

Where it falls short:
1. **The ending forgets the worst outcome.** On the crew-lost route the disclosure choice reads as if nothing died (D5-2), and the deaths are never tied to the alarm the player didn't sound (D5-3). That is the one place the mission's central choice should land hardest.
2. **The "what failed" beat lectures** (D5-4). It is eleven HaX lines and a three-item list, against m03's standard of short exchanges with the player.
3. **Voltage's entrance contradicts the scene just played** (D5-1), and the climax narration claims a dilemma the player doesn't have (D5-6).
4. **Older HaX and Vance topics still steer to the button** before it can arm (D5-5).
5. **The accents are in the voice styles, not in the words.** The guard, Cipher, Relay and Voltage would read the same in RP. Only Vance has a couple of markers ("Aye", "I've a plant to keep running"). TTS will carry the accent, but one or two idioms per character would make each voice distinct on the page (see the voice notes).

### The pass-5 material, item by item

- **Night-crew warning and its cost lines:** ship after D5-18 and D5-19. The offer (vance:454-455) is excellent. The cost lines carry game-speak ("your workshop job isn't done"), and Vance assumes knowledge he wasn't given ("eight", "Voltage"). HaX's crew hint (phone:357-381) is right and true to the moment.
- **Sweep-then-call-in ending:** ship. "Once you're out, you don't go back in. Whatever you haven't read stays for forensics." (phone:393) and "Take your time. The banks aren't going anywhere." (:407) are both good. The only snag is the HQ framing with Vance on screen (D5-9).
- **Sight-challenge openers:** Static's is the best ("He doesn't need long. I just need you to be slow."). Cipher's is good (nervy, "Hey. Hey!"); trim "halfway… half out" at cipher:39 to `He's up the rack row, a handset already half out of its clip.` The guard's is serviceable but generic, says "early" three times (D5-12), and replays verbatim on each re-sighting (D5-15).
- **Rebuilt HaX hub:** ship. The gating is sound and the hint lines are short and practical. The weak spots are the surviving pre-rebuild event knots (D5-5, D5-28 to D5-31). Two hints repeat a text word for word: "can't tell a lift from a living thumb" (phone:323 and erb:968) and "Picks and cloner won't touch" (phone:328 and erb:805/812). Vary one of each pair.
- **The debrief's "what failed":** revise (D5-4, D5-33). "The budget let them in as much as the readers did." → "Put that in too. It's the line nobody upstairs will want to read." (debrief:242-243) is the best exchange in the debrief. Build the rest of the beat to that standard.
- **Never-met-Vance branch:** nearly there. "He'll want to know who was in his plant tonight, and why nobody told him." is a good line on the right choice and a non-sequitur on the other (D5-8).
- **Crew-lost branch:** the lines inside it are good ("the number you read tomorrow won't be zero", debrief:333; "Nine of mine. I'll be telling their families myself.", :478). What's around them doesn't account for it (D5-2, D5-3).

## Per-NPC voice notes

| Character | Verdict | Notes |
|---|---|---|
| Agent HaX, phone | light revise | Mostly in voice: short, fact first, dry. The new hints are her best m04 writing. The old event knots (`event_attack_mechanism_identified` through `final_encouragement`) still read as pre-rebuild objective-speak, with "Right priorities", a list, a run of "On it." single-choice clicks, and morals (D5-5, D5-11, D5-28 to D5-31). Fold them or trim them hard. |
| Agent HaX, briefing | ship | "Worse than Ransomware Incorporated. This lot don't want paying." and the PIN-cracker line are good. HaX's "They break the things people live on" (:48) echoes Netherton's opener (:27); swap it for `They don't want paying. They want the lights out, and they've done the sums.` |
| Agent HaX, debrief | revise | D5-2, D5-3, D5-4, D5-7, D5-9, D5-10, D5-33, D5-34, D5-38. Too many sign-offs: "Get some rest." … "Sleep. I'll call." Keep the second. |
| Netherton, Nightshade | ship | Netherton's opener lands. Nightshade's two lines set up the dial call well. |
| Robert Vance | light revise | A real arc from defensive to committed, with good engineer's lines ("That's uncomfortably easy. We were meant to replace those readers this year."; "One finger, no second check. We'll be fixing that."; "We've run this place on hope and gaffer tape for years."). Teesside shows only in "Aye" and "I'll not forget it". Add one or two more (`I'll not have it`, `our lad on the gate`). Fix D5-16 to D5-22 and D5-37. |
| Robert Vance, phone | light revise | Good on facts. The "hardwired, the one thing they can't reach" point is repeated across `charge_control_systems_explanation` (:156-158) and `safe_disabling_guidance` (:183); cut it from one of them. After the shutdown the same news comes three times: the opener (:88), "How bad is it?" (:249) and priority (:200). Vary two of them. D5-5, D5-39. |
| Security Guard | light revise | Polite and grumpy as written, but with no Bristol in the words (D5-14). D5-12, D5-13, D5-15. "Testing my protocols." (:140) is a nice flat echo; keep it. |
| Cipher (Dutch) | ship, polish | Jumpy and fast, as the style asks. "That panel's amber. That panel is not supposed to be amber." is excellent. Give him one Dutch marker: `Verdomme. That panel's amber.` D5-35. |
| Relay (Edinburgh) | ship | The coolest voice in the mission: "I modelled the grid. The casualties were a line in the same spreadsheet." "No. You're really not." (:103) is unclear; use `No. But you're here, and that's enough.` One light Scots touch would help: `Aye. Easy.` at :66. |
| Static (Polish) | ship | The fewest words, as the style asks, and every one does a job. Only the "I'm still here" re-entry line needs fixing (D5-22), plus D5-24. |
| Voltage (Johannesburg) | revise | The strong scene of the mission: "Say their names, then." → "I don't need their names to know the number."; "Somebody has to make that legible."; "Your klaxon… Very humane." Weak spots are D5-1, D5-6, D5-36. "This site is one test run. The Architect has six cities on the go." (:191): "on the go" is too casual for him; use `six cities lined up`. Two "Ja." markers would place the accent on the page (D5-36, and `Ja. The button, or me.` at :286). |

## Best five lines

1. `m04_npc_operative_relay.ink:116`: "I modelled the grid. The casualties were a line in the same spreadsheet." The whole cell's ideology in one cold sentence, in character.
2. `m04_npc_robert_vance.ink:454`: "Nine. The module-swap crew, behind the inverter wall in Hall 2, till six. Your contractor wanted the halls clear from midnight. I said no." Facts first, and a man who was right and didn't know it. Relay pays it off at :120.
3. `m04_npc_voltage.ink:244`: "I don't need their names to know the number." (after "Say their names, then.") The one crack in him, played flat.
4. `m04_closing_debrief.ink:336-337`: "Your alarm started his clock. Bank B and two on the feed are what it cost. / Nine people in Hall 2 are what it bought." A choice's cost and price, stated with no moral.
5. `m04_phone_agent0x99.ink:353`: "Then stop talking to me and drop him." The handler at full pressure, in six words.

Close runners-up: Cipher's "That panel is not supposed to be amber." (cipher:56); "Put that in too. It's the line nobody upstairs will want to read." (debrief:243); "And Vance is on the floor of his own office. Nobody's sounding it now." (phone:363).

## Worst five lines

1. `m04_npc_voltage.ink:125`: "And not one of my people saw you come." It is false on every route where it plays (D5-1).
2. `m04_closing_debrief.ink:409`: "We classify it. A maintenance fault, resolved." This is offered after nine deaths (D5-2).
3. `m04_npc_operative_cipher.ink:71`: "You picked the wrong facility." Stock (D5-35).
4. `m04_npc_voltage.ink:151`: "Bold. Conviction never stopped an attack." A fortune-cookie line in the mission's best-written character (D5-36).
5. `m04_npc_robert_vance.ink:558`: "God. What have I done?" Stock (D5-37).

Dishonourable mentions: "Stability, bought with silence." (debrief:422); "Stay sharp. If anyone comes at you, defend yourself. Call if you need me." (phone:590); "The regulator? This early?" (guard:70).

## Structural findings

**Dead variables** (a script over each file's `VAR`s, checked against the erb and the other inks):
- **Never read anywhere:** `task_force_null_assigned` and `mission_debriefed` (debrief); `revealed_mission`, plus `scada_threat_confirmed`, which is never used at all (Vance); `guard_suspicious` and `entry_method` (guard); `asked_the_number` (Voltage, a promised payoff, see D5-32); `handler_trust` (14 writes), `mission_priority` (never set) and `mission_briefed` (briefing); `guidance_provided` (Vance phone).
- **Declared but unused:** `operatives_defeated` (Vance, Voltage, debrief) and `urgency_stage` (Vance face to face, HaX phone).
- **Values set but never read:** `voltage_dialogue_outcome` takes "fought" and "arrested", which nothing reads; only "escaped" is checked.
- **Not dead:** `vance_trust_level` and `cell_alerted` are synced globals read elsewhere (the debrief and Relay); `disclosure_choice` is read by the credits.

**Fall-through choices:** none found (lint clean; the `{cond:}` choice blocks read by hand all use `- else:` or knot-level conditions).

**Exits with no reply:** D5-20 (Vance "I'm going." / "Right. Going."). Static's "[Leave him be.]" (D5-24) and Voltage's "[Say nothing.]" (voltage:95) are non-verbal and fine once bracketed as actions.

**Stage directions printed as text:** none. All `//` stage notes in the Vance and Voltage inks are comments and don't print. The bracket labels in D5-24 are the only third-person choice text.

**Repeated barks and lines:**
- "Still here." across four characters (D5-22).
- "Then we do this the hard way." (D5-23).
- "It's Vance." on two texts 17 s apart (D5-26).
- HaX hints that repeat her texts word for word (pass-5 notes above).
- Vance's "never found the order" (D5-16).
- The guard's sight opener replaying (D5-15).
- Voltage's climax narration reprinting (D5-6).

**Printed variables in voiced lines:** none. No `{player_name()}` in any m04 ink. The inline conditionals (`debrief:97`, `briefing:326`, `{&…}` in the Vance hub) choose between fixed strings, which the standing rule allows.

**Hub greeting repeats after each topic:** Vance's hub prints a re-entry line after every topic (it is skipped only after an exit). The `{&…}` cycle varies it, but "Still here." straight after an answer reads oddly. D5-22 replaces it.

**Choices that answer what wasn't said:** D5-12 ("The regulator?"), D5-13 ("Inspection?"), D5-18 (Vance knowing "eight" and "Voltage").

**Flat or unremembered choices:**
- Voltage's opener pair (:135-139) converges with no stance recorded. That is legitimate for an immovable antagonist, but it should set a stance (D5-32 covers the related ones).
- Task Force Null can't be declined, and `task_force_null_assigned` is never read. It is acceptable as a set-up, but note it with the deferred m05 item.

**Not checked in a browser:** this review is static plus the route driver. The D5-15 replay and the D5-9 portrait on the HQ background want a look in the next playtest.

## Prioritised action list

**Must fix:** none. No blockers, nothing soft-locks, every route passes.

**Should fix:** D5-1, D5-2, D5-3, D5-4, D5-5 (majors); then D5-6, D5-8, D5-9, D5-12, D5-18, D5-19, D5-20, D5-25 (the three real re-entry lines, which closes F6).

**Polish:** the rest, in order of player visibility: D5-22, D5-26, D5-7, D5-10, D5-11, D5-14, D5-16, D5-17, D5-21, the stock lines (D5-35 to D5-39), D5-27 dead VARs, D5-32 stance payoffs.

Before cutting any line, grep the later missions for it (`grep -rn -i "<phrase>" scenarios/m0[5-8]*/ink/`). I checked "Task Force Null", "Calder Wharf", "six cities", "Albion" and "fingerprint kit". m05's briefing (`m05_insider_trading_opening.ink:218`, "the print kit you brought back from Albion") and m08's ATHENA kit line depend on the debrief's "Keep the crew's fingerprint kit." (debrief:201). Keep that line on every route. Nothing in m05 to m08 depends on the wording changed above.
