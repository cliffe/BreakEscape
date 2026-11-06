# Finale educational review, round 2: m09 Digital Archaeology and m10 Full Disclosure

Date: 2026-10-23. Reviewer: subagent (educational quality, confirmation round). Read-only on game files; nothing committed.

## Scope and method

Browser-side teaching only, at concept level. Read: both `scenario.json.erb` files (objectives, VM finds, flag stations, HaX's text mappings, documents), the ink of every HaX phone file, both debriefs, the Asante, Kowalczyk, Tesseract and Netherton files where round 1 touched them, `CONTRACT.md` §15 (m09) and §11 (m10), and the `PLAYTEST_*.md` reports (blind, struggling and regression runs in particular). Re-ran the CyBOK checker on both `mission.json` files.

Not opened: SecGen, anything under `planning_notes/overall_story_plan/mission_initializations/finale/`, the exploit-detail field guides, any VM-technique document. Every VM remark below is about what the game says to the student. Any wording that sits next to VM content is marked for an opus48 check.

Every fix claimed in the two CONTRACT sections was checked against the shipped line in the ink or the erb rather than taken from the CONTRACT. Line numbers are for the working tree on 2026-10-23.

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 9 |

Round 1 had 4 majors, 11 minors and 8 nits. All four majors are resolved in the shipped text. Of the 11 minors, 10 are resolved and E-m10 is mostly resolved (the label row was declined, for a stated reason). Of the 8 nits, 4 are resolved, 2 are still open (E-n3, E-n5) and 2 are deferred to the lab sheets by design (E-n4, E-n8). Nothing was made worse. Both CyBOK blocks now pass the checker with 0 errors and 0 warnings (verified this round: m09 10 entries / 22 keywords, m10 12 entries / 25 keywords).

The new findings are smaller than round 1's. Most are about the moment after a VM flag goes in: m09 doesn't say where to submit, and m10's flags 1 and 3 never tell the student what they got. One teaching line overstates what a Vigenère key protects.

**Top three**

1. **R2-m3. m10 flag 3: the kill config is promised before and never mentioned again.** The student breaks out of the container, and nothing afterwards says what the kill config showed or ties it to "Stop it" at his console.
2. **R2-m1. m09's four flag tasks never say where to submit**, and there are two stations, one of which refuses the other's flags. The struggling playtest got confused at exactly this point.
3. **R2-m4. "Without the key, nobody reads it"** is too strong for Vigenère, the season's first keyed cipher. One clause fixes it.

## 1. Round 1 findings: status

| ID | R1 sev | Status | Shipped evidence |
|---|---|---|---|
| E-M1 full disclosure defined wrongly | Major | **Resolved** | m09 `m09_phone_agent0x99.ink:600-601`; m10 `m10_director_netherton.ink:139`. Both say "to everyone" and "usually" |
| E-M2 Vigenère taught as a tool step | Major | **Resolved** (see R2-m4 for one accuracy clause) | Tier 2 `m09_phone_agent0x99.ink:764`, tier 3 `:767`, Gary `m09_phone_gary.ink:30`, text A3-37 `m09 scenario.json.erb:314` |
| E-M3 insider levers never named | Major | **Resolved** | A3-38 `m09 erb:398`, A3-39 `erb:400` (a text, not the in-scene voiced line). The optional debrief line and the m10 Kowalczyk motive fallback were not taken; both were optional |
| E-M4 credential lifecycle never stated | Major | **Resolved** | m09 hub `m09_phone_agent0x99.ink:721` and identity scene `:407-408`, `:513-515`; m10 door log `m10_phone_agent0x99.ink:279`; Citadel file item 5 `m10 erb:223` |
| E-m1 coordinated disclosure lacks its last step | Minor | **Resolved** | m09 `:601`; m10 `m10_tesseract.ink:1130`, and the menu button "[Coordinated disclosure. Wipe theirs, and send ours to the vendors, on a schedule.]" `:1161` |
| E-m2 keeping a flaw not named as real practice | Minor | **Resolved** | `m09_phone_agent0x99.ink:902` |
| E-m3 incident vs vulnerability disclosure | Minor | **Resolved** | `m09_phone_agent0x99.ink:708-713`, worded by m04 route |
| E-m4 Asante's patch claim unanswered | Minor | **Resolved, gated narrowly** | `m10_asante.ink:42-45`; see R2-n1 |
| E-m5 Base64 recognition rung | Minor | **Resolved** | T-60 `m10 erb:1901`, `1903`, split on m02. The cold form adds "encoded, not encrypted", which is good |
| E-m6 m10 flags 1 and 4 have no steer | Minor | **Resolved** | `monitor_topic` `m10_phone_agent0x99.ink:585-594`, `box_topic` `:596-607` |
| E-m7 cracker skips every reasoning route | Minor | **Resolved** (soft option) | T-59 `m10 erb:1897-1899`; the outer lock stays a PIN lock by ruling |
| E-m8 supply chain never named | Minor | **Resolved** | `m10_six_oclock.ink:190`, reachable via the bench-log answer at `:169` and `m10_kowalczyk.ink:98`, `:266` |
| E-m9 safe text credits the cracker | Minor | **Resolved** | A3-12b `m09 erb:297` |
| E-m10 shutter told, not done; wrong wording | Minor | **Mostly resolved** | Elena, Vance and Voltage now say "takes the row off their board" (`m10_elena_phone.ink:57`, `m10_vance_phone.ink:52`, `m10_voltage.ink:162`); the player pulls the breaker at the isolator (`m10 erb:3458-3461`). The label row was declined so it wouldn't contradict the camera toggle. See R2-n4 for the concept |
| E-m11 CyBOK blocks fail checker | Minor | **Resolved** | Re-run this round: 0 errors, 0 warnings on both |
| E-n1 guard's log | Nit | **Resolved** | A3-41 `m09 erb:404` |
| E-n2 keyspace on the dusted plate | Nit | **Resolved** | `m10 erb:4093`, `4097` |
| E-n3 Malhotra's unattended badge | Nit | **Open** | R2-n6 |
| E-n4 PIN-cracker feedback is fiction | Nit | Deferred to lab sheet (by design) | Not counted |
| E-n5 player never learns which points landed | Nit | **Open** | R2-n7 |
| E-n6 HaX gives the verdict early | Nit | **Resolved** | `m10_tesseract.ink:489` ends "Wrong about the answer." |
| E-n7 chart house rule | Nit | **Resolved** | `m09 erb:2299`: "each keypad's code is keyed to its own bay's word" |
| E-n8 season-end skills summary | Nit | Deferred to lab sheet (by design) | Not counted |

Nothing from round 1 was made worse. A3-38's list changed from "Money, a son..." to "A son, a drink, boredom, a lonely night". That is better, because it now matches what the notes column actually says.

## 2. VM steps: does the game tell the student enough?

The columns are question 2's four parts. "Find" means the in-game object that lets the step begin. A tick means the game says it clearly in a task title, a HaX line, a text or a find. All eight steps now print a host on their find (the blind m10 tester's O1 is fixed: `Host:` lines at `m10 erb:2659`, `3740`, `3753`, `4327`; `m09 erb:1622`, `2478`).

### m09

| Flag | What and why | Find | Host / where to submit | What the result means |
|---|---|---|---|---|
| 1 Catalogue | ✓ Dock call: "get me into their catalogue. It's how we find out what Sorensen's burning" (`m09_phone_agent0x99.ink:186`); hub "Find the part that isn't public" (`:844`) | ✓ Login slip, drop desk (`erb:1622`) | Host ✓ (slip). Station: only in the terminal's observation (`erb:1575`); the task says "submit the flag" (`erb:706`). **R2-m1** | ✓ `flag1_read`: Series R, bay ten, the ledger, Tomb Beta (`:211-227`) |
| 2 Ledger | ✓ Aim text "see who's still on their books" (`erb:731`); hub "where only the machine's keeper can reach" (`:816`) | Flag 1's own call ("The catalogue keeps something else live", `:213`). Same host; no physical find, which is reasonable here | Host ✓ "Same box". Station: as flag 1. **R2-m1** | ✓ `ledger_read`: WREN, twenty-three placements, HL2015-0477 (`:242-266`) |
| 3 Owner | ✓ Property label text "One of ours signed this out and never handed it back. Find out who." (`erb:420`) | ✓ Enrolment binder, BETA crate (`erb:2478`); hub and status name it (`:741`, `:980`) | Host ✓ (binder). Station: only in the drop link's observation (`erb:2405`). **R2-m1** | ✓ Identity scene: "A SAFETYNET staff credential. Issued before he left us. Never revoked." (`:407-408`) |
| 4 Control | ✓ Aim "read what it's mirroring" (`erb:760`); hub "Something on there is set to copy to Tomb Gamma" (`:736`) | Flag 3 (same box) | As flag 3. **R2-m1** | ✓ `hour_read`: the mirror job, the key, the cells, the casualty range (`:592-614`). Concept steer thin: **R2-n2** |

### m10

| Flag | What and why | Find | Host / where to submit | What the result means |
|---|---|---|---|---|
| 1 Monitoring | ✓ Aim (`erb:1407`); `monitor_topic`: "It's still software, and software has holes ... their own eyes work for us" (`:587-588`) | ✓ Maintenance tag on the gate terminal (`erb:2659`); hub names it (`:593`, `:179`) | ✓ Task "submit the flag at the gate terminal" (`erb:1413`) | Partial. The texts at the moment go to the power room and the door log (`erb:1877-1878`); the payoff ("Inner door's on their monitoring. I've got it.", `:721`) comes a room later. **R2-m2** |
| 2 Staging copy | ✓ "How it goes out is on their system somewhere below. Find it before four" (`:251`); aim (`erb:1447`) | ✓ Sign-in card on the console desk (`erb:3740`) | ✓ Task "at the release console" (`erb:1453`). The card's host is the monitoring host, which no line says aloud: **R2-n9** | ✓ "It's set for four. It goes when the outer lock opens." and the targets (`erb:1783-1785`), then the console |
| 3 Out of the container | ✓ `hatch_topic`: "The release service runs in a container on the host under it. Get out of the container onto that host." (`:577-579`) | ✓ Operator's duty sheet (`erb:3753`); hatch-click text (`erb:1657`) | ✓ Task "at the sealed section's hatch" (`erb:1454`) | **Missing.** The kill config is promised at `:581` and never mentioned again. **R2-m3** |
| 4 Core host | ✓ `box_topic` (`:604-606`); aim (`erb:1462`) | ✓ The CORE envelope (`erb:4327`) | ✓ Task "at its terminal" (`erb:1469`) | ✓ `flag4_lines`: the unsent notice, the feed, the vault line (`m10_tesseract.ink:192-206`) |

The blind m10 tester gave teaching 3 of 5 because the VM half couldn't be judged. The browser framing for those steps is now in place on every step except the two result gaps above. It still needs a run with live VMs before anyone can call it confirmed.

## 3. Non-VM puzzles: real ideas, and are they named?

| Puzzle | Idea | Named? |
|---|---|---|
| m09 salvage keypad (Vigenère) | Keyed cipher vs encoding; a key kept next to the lock | Yes: tier 2, tier 3, A3-37. One clause overstates it (R2-m4) |
| m09 RFID cloning (Noor, Sorensen) | Low-frequency proximity cards read and replay | Reinforcement only ("You've done this before"). m10's door-log line ("A door log proves a card was there") supplies the lesson for the season. Fine |
| m09 plan cabinet (lifted print) | A biometric is not a secret and cannot be changed | **Not named.** "That cabinet takes a print. She stamps everything." (`erb:241`) is a clue, not the idea. **R2-m5** |
| m09 handwriting match | Attribution needs corroboration | Yes: "I want it from two directions before anyone says a word." (`:941`); "Two samples. One pen." |
| m09 safe from the lease date | Memorable numbers as PINs | Yes: A3-12b |
| m09 guard's log | Logging without review | Yes: A3-41 |
| m09 recruitment levers | Insider-threat spotting and assessment | Yes: A3-38, A3-39; "Insider Threat Initiative" in the aim text |
| m09 vendor notice | Coordinated vs full disclosure; keeping a flaw | Yes: `hour_read`, `notice_ask`, the 2017 draft notice (`erb:2429`) is a textbook coordinated-disclosure letter (90 days or until a fix ships, whichever is sooner) |
| m10 sleeper deduction | Audit-trail reasoning; a badge read is not a person | Yes: door-log reply, Citadel file item 5, alibi Socratic question |
| m10 Base64 margin | Encoding, recognised by its shape | Yes: T-60 |
| m10 outer lock (dusted keys, rota) | Wear as a side channel; keyspace | Yes: dusted plate text, T-59 |
| m10 cracker and Citadel stores | Supply-chain compromise | Yes, on the bench-log answer branch (`m10_six_oclock.ink:190`) |
| m10 shutter | Take a remote-controlled device off the remote board, then isolate its power | Told well, done by the player now. Why the key comes first isn't said: **R2-n4** |
| m10 database choice | Hoard, coordinate or destroy | Yes, with costs before and after |
| m10 evidence handling | Seized material kept as evidence | Light but accurate: "Their copy's evidence. Ours stays in the vault." (`m10_tesseract.ink:1157`); Netherton on the 12.8 million kept "as evidence" (`m10_six_oclock.ink:379`) |

## 4. Debriefs and endings: reflection without lecture

**m09** (`m09_closing_debrief.ink`). The ethics comes back well. The memo stance is asked and paid off at the pen ("Then I sign for him too" / "he can make that argument in court, and lose it", `:296-301`), and the notice is costed one last time ("Hold it, and he can call us hoarders, and be right", `:140-143`). Nobody lectures. The technical lessons are reflected where they happen (HaX's texts) and not in the debrief, which is the right place for them. One optional voiced line could bring back the account lesson as a consequence rather than a moral (R2-n5).

**m10** (`m10_six_oclock.ink`). Consequences carry the teaching here, and they work. Coordinated disclosure: "Forty vendors have acknowledged. Patch windows, ninety days. It'll be a year before most of them are fitted." and "Three water utilities went to manual at five. There's no patch for their old controllers." (`:397-403`). Hoarding: "Two maps now." (`:392`). Season line: "Forty hospitals patched after St. Catherine's. The pumps on his list were not among them." (`:657-661`). The player is shown what each choice cost and never told what to think. The one gap is the argument (R2-n7, carried from E-n5).

## 5. Terms and spelling

- Definitions now correct: full disclosure, coordinated disclosure (ends in publication), keeping a flaw for use, encoding vs encryption, container (escape), supply chain, audit trail, "a badge read proves a card, not a person".
- One overstatement: R2-m4 (Vigenère).
- "Cyber Security" is two words wherever the player can read it (Gary, `m09_phone_gary.ink:34`, `m10_gary.ink:26`). "CyberChef" is a product name and correct as written.
- UK English: the HaX, Netherton, narrator, choice and credit text checked is UK. The US spellings found ("gray", "labeled" in `m10_elena_phone.ink:41`; "civil defense" in the lease abstract; "data center" in the Social Fabric story) are in American speakers' or American paperwork's words, which `m10 CONTRACT.md` §5.2 allows. Not counted.

## Findings

"Unvoiced" means hub ink, a HaX text, document text or a Narrator line, so no TTS regeneration is needed.

### Minor

**R2-m1. m09's flag tasks don't say where to submit, and the two stations refuse each other's flags.**
`m09_digital_archaeology/scenario.json.erb:706`, `736`, `767`, `770`.
m10's four tasks each name their station ("submit the flag at the gate terminal"). m09's say only "submit the flag" or "submit it". The drop terminal (reading room) takes flags 1-2 and the Tomb Beta Drop Link (salvage cage) takes flags 3-4, refusing the others by ownership. The struggling playtest stumbled here (`PLAYTEST_PHASE5_STRUGGLING.md` m-4). This matters for learning because the student needs to know a flag counts once it is handed in at the right place, and a refusal at the wrong station reads as a wrong flag. Fix, task titles (unvoiced):
> Get into the catalogue server and submit the flag at the drop terminal
> Pull the Initiative's ledger off the catalogue server and submit it at the drop terminal
> Find out who owns Tomb Beta's server and submit it at the drop link in the salvage cage
> Take full control of Tomb Beta's server and submit it at the drop link

**R2-m2. m10 flag 1: what the foothold bought isn't said when it goes in.**
`m10_full_disclosure/scenario.json.erb:1877-1878`; `m10_phone_agent0x99.ink:721`.
`monitor_topic` sets the idea up well ("their own eyes work for us"). When the flag goes in, the first text is "Whoever's in the power room runs your lights." The payoff, "Inner door's on their monitoring. I've got it.", plays a room later, after the breach. The student finishes the step without being told that owning the defenders' monitoring is the point. Fix, a new unvoiced text on `global_variable_changed:flag1_submitted`, `delay` about 1500, before the power-room text (move that to about 5000):
> I'm in their monitoring. Their cameras and doors answer to me now, and their desk sees what I let it.

**R2-m3. m10 flag 3: the kill config is promised and then dropped.**
`m10_phone_agent0x99.ink:581`; `m10 scenario.json.erb:1761-1763` (the only texts that fire after flag 3); `m10_tesseract.ink:933`.
HaX says before the step: "The host holds the release's kill config: how six o'clock is armed, and what stops it. The disarm's on his console, in the core." After flag 3 the only lines are about the shutter and the stair. At the console, "[Stop it.]" plays "The release goes dead under your hands." with no link back. The student did the hardest technical step of the finale and isn't told what it showed or why the stop now works. Fix, two unvoiced lines (opus48 to confirm against the built VM, since they describe what the host held):
- A HaX text on `global_variable_changed:flag3_submitted`, `delay` about 2500, `!hax_jammed`, before the stair texts:
> His kill config's on my screen. Six o'clock stops at his console and nowhere else. That's where we're going.
- `m10_tesseract.ink:933`, the Narrator line:
> Narrator: The release goes dead under your hands, the way his kill config said it would. He doesn't try to stop you.

**R2-m4. "Without the key, nobody reads it" overstates a Vigenère key.**
`m09_digital_archaeology/ink/m09_phone_agent0x99.ink:764` (hub, unvoiced).
This is the season's first keyed cipher, so the student's mental model is set here. Vigenère has been breakable without its key since the nineteenth century (repeated-key analysis). A student who carries "keyed means unreadable" into later work has the wrong model, and A3-37's correct line ("A cipher is only as safe as its key") is weakened by it. Fix:
> It's Vigenère. A cipher this time, not an encoding: it needs a key. It can be broken without one, but not tonight.

**R2-m5. The lifted print opens the cabinet, and the biometric lesson is never said.**
`m09 scenario.json.erb:241` (cage-entry text), `1960` (plan cabinet).
The puzzle teaches by doing: lift her print off her own rubber stamp, present it to a reader she fitted herself. The texts give the clue ("She stamps everything") and stop there. The idea worth one line is that a biometric is left on everything you touch and can't be changed after it leaks, unlike a PIN. That is also the reason the CyBOK block lists BIOMETRICS. Fix, a new unvoiced HaX text on `objective_task_completed:open_plan_cabinet`, once, `delay` about 2000:
> She can change a PIN tomorrow. She can't change her thumb, and she's left it on every stamp she owns.

### Nits

**R2-n1. Asante's follow-up waits on a second, unrelated question.** `m10_asante.ink:42`. The reply to "Every vendor patches in a week" needs `asan_wrote and asan_shown`, so a player who asks who built the release and leaves still hears the wrong claim unanswered, which is what E-m4 set out to stop. Change the guard to `{asan_wrote and not asan_unpatched}`.

**R2-n2. m09 flag 4 has no concept steer.** `m09_phone_agent0x99.ink:736`, `:970`. "Take the whole box and we'll see what" says what, not why it needs full control. A concept-level line (opus48 to confirm it fits the VM before use), as the second line of the `flag3_submitted` arm:
> The copy job runs as the box's keeper. To read it, you have to be the keeper.

**R2-n3. The core envelope says "access code"; HaX says "login".** `m10 erb:4327` ("CORE. HOST ACCESS CODE."), `m10_phone_agent0x99.ink:604`, `erb:1663`. A student matching HaX's word to the find looks for a login and holds a code. Pick one word. Document fix: "CORE. HOST LOGIN. ONE HOLDER." (opus48 to confirm it describes the credential correctly).

**R2-n4. The shutter never says why the key comes before the breaker.** `m10_phone_agent0x99.ink:801`. "That takes the row off their board" is correct. One more clause names the cyber-physical idea, local control before isolation, without adding a step (unvoiced hub knot):
> Turn the key a quarter. That takes the row off their board, so nobody upstairs can put it back.

**R2-n5. The m09 debrief doesn't bring back the account lesson.** `m09_closing_debrief.ink:270-301`. Optional and voiced, so only if the debrief is regenerated anyway. In `spine`, after the order:
> Director Magnus Netherton: A staff credential, seven years live. Every leaver's account is being checked before Monday.

**R2-n6 (E-n3, open). Malhotra's unattended badge is the root of the clone and nobody remarks on it.** `m10 erb:2238`, `2640`. The van observation shows "A headset and a SAFETYNET badge on the step" and nothing pays it off. Cheapest fix (unvoiced): append to the bench-log clone text or T-59's neighbour, a HaX text on `clue_bench_log`:
> Malhotra's badge sat on the van step for ten minutes. That's all a cloner needs.

**R2-n7 (E-n5, open). The player never learns which of their three answers landed.** `m10_tesseract.ink:964`. "You've beaten me" plays only on the Join path. A Narrator line after exchange 3 (unvoiced), by `landed_count()`:
> Narrator: Two of your answers landed. He hasn't conceded the third.

**R2-n8. CONTRACT §15 records a different E-M4 line from the one that shipped.** `m09_digital_archaeology/CONTRACT.md:912` quotes "His were never revoked. Seven years on, the credential still works."; the hub says "When someone leaves, we take back their kit and shut their accounts the same day. Not his." (`m09_phone_agent0x99.ink:721`). The shipped line is better; update the CONTRACT so the next reviewer doesn't chase it.

**R2-n9. Nobody says the staging copy is on the monitoring host the student already holds.** `m10 erb:3740` (the card's host line), `3692` ("on their monitoring host", the terminal's observation), `m10_phone_agent0x99.ink:146`. The card prints the host and the terminal says it, so a careful reader has it. HaX's rung would teach the idea worth having, that one box can hold separate stores behind separate sign-ins. Fix, `where_are_we` row `server_hall_entered` (opus48 to confirm):
> The console takes the staging copy. It sits on their monitoring host, behind its own sign-in. The card's on the desk beside it.

## For the user

- Lines next to VM content, concept-level only, need an opus48 check against the built VMs before they ship: R2-m3 (both lines), R2-n2, R2-n3, R2-n9.
- Voiced lines touched: only R2-n5 (optional). Everything else is a task title, hub ink, a HaX text, document text or a Narrator line.
- Lab sheets, when written: HaX's hints promise content in the field guides ("Read the part about old accounts nobody closed", `m09_phone_agent0x99.ink:1097`; "One worked example", `:1102`). The m09 archive-codes guide should open on encoding vs encryption, link ROT13 and say Vigenère can be broken without its key (R2-m4). E-n4 (what the PIN cracker stands in for) and E-n8 (a season skills summary) belong there too.

## Verdict

**m09 Digital Archaeology.** It teaches well and names what it teaches. The cipher, the recruitment levers, account lifecycle, the guard's log and coordinated disclosure all get a plain line now, at the moment the player meets them, and the debrief keeps the ethics without preaching. What's left is small: say where each flag goes, soften one claim about Vigenère, and name the biometric lesson. Ready once R2-m1, R2-m4 and R2-m5 are in.

**m10 Full Disclosure.** The browser teaching is strong: the sleeper deduction, the Base64 rung, the casualty model and the database choice with its costs shown before and after. Every VM step now says why it matters, where its find is, which host and where to submit. The two gaps are both about what a VM step showed once it was done, flags 1 and 3, and two unvoiced texts close them. The teaching score of 3 from the blind tester was about the VM half being unplayable in that run, and the framing for it is now there. Ready for a live-VM playtest once R2-m2 and R2-m3 are in.
