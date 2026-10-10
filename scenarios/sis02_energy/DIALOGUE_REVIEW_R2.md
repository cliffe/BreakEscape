# sis02 Albion Battery Hall: Code Red, dialogue review round 2

Reviewed 5 October 2026, read-only, against the four ink files in `ink/` (Helen Marsh, Priya S., Marcus Webb, Tom Hadley), Helen's and Priya's barks and timed lines and Marcus's and Tom's timed texts in `scenario.json.erb`, `labsheet.md` (Q1-Q20, E1-E9), `CAST_DESIGN.md`, and the Decisions at the top of `DIALOGUE_REVIEW.md`. `information_pack.md` was searched, not read whole. Nothing was edited apart from this file.

Settled decisions respected throughout: the pack's attack story (printer firmware, CastleTech's account, c.ellison on the jump server, 23:12 / 01:47 / 03:22); Saturday 21 March 2026; the ESD never gated on anyone; the four arguable views (Marcus logs-first and air-gap, Helen's eight weeks, Priya's cable view); NIS to Ofgem with DESNZ, NCSC told alongside and helping; hydrogen in per cent by volume, evacuation never a failure; Trent Water as duty of care; "Priya S." on screen, "Priya" in speech; Helen in a Nottingham accent on Aoede, Priya on sis01's Leda style.

**Verdict.** The script is ready to voice after a short fix pass. Spoken aloud, Helen sounds like a Nottingham SCADA engineer at half six on a Saturday, with no policy-speak, no codes and just enough dialect. Priya sounds like sis01's officer. The debrief asks real questions and reads back what the player did. Marcus and Tom read like texts from people with their own jobs. Four rounds of fixes show: no shared greetings, no dashes, no printed variables, no spoken codes or "Priya S.", and every line over 25 words is already split into short sentences. What remains:

1. **One core lesson can be missed.** The ESD wiping the attacker's register writes reaches only players who argue with Marcus first, yet lab-sheet Q8 asks every student about it (PRI2-1, LAB-1).
2. **One factual slip in Helen's mouth.** She says the patch deferral never had a review date; the document in the cabinet says March 2025, not reviewed (HEL2-1).
3. **The same moral from two or three people**, nearly all on Marcus's free side: Priya's closing, the review date, "somebody's writing it", the NCSC's role.
4. **Small spoken-clarity fixes**: "Tom Marcus" heard as one name, "went with the reset", "inside that", "the control-system security standard".
5. **Lab sheet**: Q20 ("contained") and Q12 ("aware") have no moment in play. Both can be added in free Marcus text. Priya's cable view is a good moment the sheet doesn't use.

3 majors, 25 minors. **12 voiced lines proposed** (Helen 3, Priya 9, one of them new). Only 4 of them (PRI2-1, HEL2-1, PRI2-3) carry most of the teaching value. All Marcus, Tom and lab-sheet changes are free.

Severity: **major** means a learning objective muddled or a fact a site engineer would catch, or a lab-sheet question most players can't answer from their run; **minor** means polish. Line numbers are file-local. "Spoken: yes" means a voiced line (Helen, Priya, or a bark/timed line from either) whose TTS entry would be regenerated. Marcus's and Tom's phone texts are never voiced (`npc-manager.js:1099`, `:1576`: `useTTS` only for `npcType === 'person'`), and nor is player choice text, so those changes are free.

## 1. Checks run

All from the repo root with `BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8`, with no side effects.

- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/`: no findings. Spoken lines: Helen median 17 words, max 25; Priya median 17, p90 26, max 30. Every line over 25 words (Priya `:139`, `:153`, `:181`, `:222`, `:224`, `:236`, `:293`, `:295`, `:312`, `:339`) is already two or three short sentences, so none is hard to say. No dashes in any spoken line; no printed variables (Helen `:310` is an inline conditional choosing a fixed string, which is fine).
- `bundle exec ruby scripts/validate_scenario.rb ... --skip-ink --no-graph`: no errors. The dialogue-facing warnings are the overlapping-mapping warnings on Helen's `historian_flatline_found`, `esd_activated`, `hydrogen_alarm` and `facility_safe_state` radios. I checked the conditions by hand: the radios that speak are disjoint (the overlaps are with `setGlobal`, `completeTask` or `skipTask` mappings that say nothing). No action.
- Every compiled `.json` is newer than its `.ink`.
- Runtime checks with the compiled ink (inkjs from `public/break_escape/assets/vendor/ink.js`, scratch script, not checked in):
  - Priya `the_hall` with `anomaly_detected`, `early_esd_activation`, `esd_activated`, `gauge_verdict = "dial"`, `shutdown_argument = "hazard"` and nothing from Marcus: she says nothing about the registers. This is the path of a player who agrees with Helen and presses the ESD without messaging Marcus (PRI2-1).
  - Marcus `current_status` with ESD in, network isolated, `isolation_scope = "watch"`, SIS confirmed: "Contained. Now the notification..." and, once notified, "Contained and notified. The NCSC are sending someone. Talk to them when they arrive." Priya is already visible by then (MAR2-1, MAR2-2).

Nothing in the mechanical checks blocks play.

## 2. Findings by character

IDs are new for this round. Each item: severity, location, whether it's spoken, current line, replacement.

### 2.1 Helen Marsh, SCADA engineer (`ink/npc_helen_marsh.ink`, barks and timed lines in `scenario.json.erb`; Aoede, Nottingham)

Helen is the strongest voice in the game. She speaks in short, concrete sentences, says numbers the way an engineer says them aloud ("twenty-eight point nought", "three twenty-two", "twelve minutes past eleven"), and never uses a code: the workstation is "the engineering workstation", the historian is "on the operator screen", c.ellison is "the Ellison account". The East Midlands colour is light and steady: "duck" (`:105`), "nowt" (`:244`), "mind" (`:167`, `:328`), "the lot booked for" (`:61`), "been on about" (`:206`), "have a breather" (`:336`), "That's our notification clock run out" (bark, `scenario.json.erb:780`). That's about one line in eight, which reads as a Nottingham engineer rather than a dialect turn. Nothing in her script sounds like a policy document: the modification procedure at `:273` ("Impact analysis, retest, sign-off") is how an engineer would say it. Three items.

**HEL2-1 (major; Spoken: yes): the patch line contradicts the risk assessment.** `:271`
- Now: "Mr Whitworth signed the deferral. What nobody signed was a date to look at it again."
- The deferral did have a review date. The risk assessment in the filing cabinet says "REVIEW DATE: March 2025 [NOT REVIEWED]" (`scenario.json.erb:1966`), the pack says "The review date, March 2025, passed without a review" (`information_pack.md:848`), and lab-sheet Q2 asks "What should the March 2025 review have checked?" A student who heard Helen and then read the document finds two stories. Helen's line also delivers Priya's closing moral early ("never looked at again", `ink/npc_priya_s.ink:372`); the fact is enough.
- Replace with: "Mr Whitworth signed the deferral. It was due a review last March. Nobody did one."

**HEL2-2 (minor; Spoken: yes): "inside that" is hard to follow by ear.** `:243`
- Now: "We trip at fifty-five because it's well short of where cells start heating themselves. Eighty-five puts the trip inside that."
- Heard once, "inside that" has nothing to attach to: the listener hasn't been told where self-heating starts. This is the safety point of the whole SIS scene (lab sheet Q16, E3), so give the number. The pack puts self-heating at about 80 to 120°C (`labsheet.md:54`).
- Replace with: "We trip at fifty-five, well short of eighty, where cells can start heating themselves. At eighty-five, it trips too late."

**HEL2-3 (minor; Spoken: yes): "see if ours wobble" is unclear.** `:162`
- Now: "Have a look at the historian and see if ours wobble."
- "Ours" (our readings) is ambiguous spoken, and "wobble" is only explained later, at `:202`. A player who backed the screen needs a plain instruction.
- Replace with: "Have a look at the historian. See if my numbers have moved at all."

**Considered, no change proposed.**
- The briefing says the screen hasn't moved three times in three lines (`:62` "Too normal for a night on charge", `:63` "Nothing moved all night", `:64` "On a charge cycle, something always moves"). It's the first thing the player hears and the repetition helps orientation. Keep.
- The historian radio (`scenario.json.erb:659`, `:665`, "Dead flat since twelve minutes past eleven. Somebody's writing it.") and Helen's historian knot (`:201-202`, "That's somebody writing a number and holding it there") make the same point a minute apart. Her knot is the better teaching line ("Real sensors wobble"), and the radio carries the ESD nudge, so both stay. The third telling is Marcus's text, which is free to change (MAR2-6).
- "Half the site ... a penalty every hour" at `:179` and `:225`: two different questions, and the second adds "fifty megawatts" and "it doesn't feel cheap at six in the morning". Keep.
- "Hall 1's the fire service's now" recurs in `:286`, `:306`, `:308`, `:310`; each is on a different branch and only one plays per conversation. Keep.

### 2.2 Priya S., NCSC incident manager (`ink/npc_priya_s.ink`, bark `scenario.json.erb:899`; Leda, neutral southern English)

Priya sounds like the same calm officer as in sis01, and the debrief is well built. Each section opens on a verdict about what the player actually did, then asks one question. Claim, argument and evidence are named once, by the person whose job is naming them (`:184-185`). The safety question at `:157` and its follow-up at `:170-171` are the best teaching lines in the game. She never says "Priya S." aloud, and avoids codes: "the engineering workstation", "Ellison's", "sixty-two four four three". Seven items.

**PRI2-1 (major; Spoken: yes, 1 new line): the evidence-versus-safety trade-off is missing for the most common good run.** `:147-156`
- The register beat (pressing the ESD wipes what the attacker wrote into the battery controller) is one of the scenario's core lessons. It's in the lab sheet (Q8), the overview, E6 and sis03's evidence gap. But it reaches the player only through Marcus's optional `evidence_scene` (`ink/npc_marcus_webb.ink:168-184`), which needs the player to message him and argue the shutdown first (`:109-112`). A player who agrees with Helen ("Then press it. The dial is enough.", `ink/npc_helen_marsh.ink:180`) and presses the ESD from her console never hears about it. Priya's evidence block has no branch for them (runtime check, section 1), and nor do the credits (`scenario.json.erb:518-520` all need `evidence_before_esd` or `bms_registers_saved`). That player then meets Q8, "Did you save it?", about a choice they were never offered.
- Add a last branch to the block at `:147`, after `- evidence_before_esd == "press":`:
  ```
  - esd_activated:
      Priya S.: The ESD also wiped what they'd written into the battery controller. Ten seconds at the operator screen would have saved a copy.
  ```
- She says "the operator screen", not "OPS-01", and doesn't judge: the player pressed for the right reason. (Optional, not voiced: a matching credits entry, "ESD pressed; nobody knew the registers would be lost", for the same condition.)

**PRI2-2 (minor; Spoken: yes): two names run together.** `:236`
- Now: "You told Tom Marcus had signed it off before he had. Tom rang him to check. That check is what stops a stranger talking a supplier into opening your firewall."
- Heard aloud, "You told Tom Marcus had signed..." sounds like one person, "Tom Marcus". Add "that". The line is also 30 words; dropping "is what" makes it shorter without losing anything.
- Replace with: "You told Tom that Marcus had signed it off before he had. Tom rang him to check. That check stops a stranger talking a supplier into opening your firewall."

**PRI2-3 (minor; Spoken: yes, 2 lines): "went with the reset" names the wrong mechanism.** `:153`, `:155`
- Marcus tells the player that the ESD "makes the BMS run its shutdown routine. That overwrites whatever they've written into its registers" (`ink/npc_marcus_webb.ink:173`), and the lab sheet says the same (`labsheet.md:56`, Q8). Helen uses "reset" for something else: releasing the ESD afterwards at the hall panel (`ink/npc_helen_marsh.ink:230`). Priya's "went with the reset" mixes the two, in the one place the mechanism is being taught.
- `:153` now: "You meant to save the registers first, and the ESD went in before anyone did. What they wrote went with the reset. The hall came first."
- Replace with: "You meant to save the registers first, and the ESD went in before anyone did. Its shutdown routine wrote over them. The hall came first."
- `:155` now: "You pressed it without saving the registers. What they wrote went with the reset. The historian kept the screen values, so forensics will cope."
- Replace with: "You pressed it without saving the registers. Its shutdown routine wrote over them. The historian kept the screen values, so forensics will cope."

**PRI2-4 (minor; Spoken: yes): Helen didn't press it "on her way out".** `:101`
- Now: "The gas reached two per cent before anyone pressed the ESD. Helen pressed it on her way out."
- Helen stays in the control room and says "I've hit the ESD on my console" (`ink/npc_helen_marsh.ink:355`). Students who drew the barriers for E3 will notice which station was used.
- Replace with: "The gas reached two per cent before anyone pressed the ESD. Helen pressed it from her console as everyone came out."

**PRI2-5 (minor; Spoken: yes): "on the day" sounds written from later.** `:181`
- Now: "You didn't confirm the SIS change on the day. Helen's team did afterwards: the trip at eighty-five, the hydrogen alarm at three point eight per cent."
- Priya is speaking the same morning, so "on the day" is report language. "Helen's team" is odd too: Helen is the only Albion engineer on site (`CAST_DESIGN.md`, "Who is where").
- Replace with: "You didn't get to the SIS panel this morning. Helen did, afterwards: the trip at eighty-five, the hydrogen alarm at three point eight per cent."

**PRI2-6 (minor; Spoken: yes, 2 lines): "the control-system security standard" is a written circumlocution, and one branch never names it.** `:291`, `:293`
- `:291` (deferral) now: "Your own zone and someone watching is what the control-system security standard asks for. One way in, and only one."
- `:293` (patch) now: "Patched or not, I'd put it in its own zone, with one way in and someone watching it. The control-system security standard, sixty-two four four three, asks for that."
- An NCSC officer would just say the standard's number, as she does elsewhere. The appositive in `:293` reads as written, and on the deferral branch the student never hears which standard (Q17, Q18 and E8 all ask for IEC 62443). Say "IEC" as letters, and the number in words so TTS doesn't read sixty-two thousand.
- `:291` replace with: "Its own zone, one way in, and someone watching it. That's what IEC sixty-two four four three asks for."
- `:293` replace with: "Patched or not, I'd put it in its own zone, with one way in and someone watching it. That's what IEC sixty-two four four three asks for."

**PRI2-7 (minor; Spoken: yes): "The second was right" doesn't work by ear.** `:308`
- Now: "You held the NIS notification for the full picture, then sent what you knew. The second was right."
- "The second" makes the listener count back through the sentence.
- Replace with: "You held the NIS notification for the full picture, then sent what you knew. Sending it was the right call."

**Considered, no change proposed.**
- "Defensible" four times (`:280`, `:329`, `:331`, `:333`) and "fair" three times (`:129`, `:170`, `:255`). At most two play in one debrief. Keep.
- The bark (`scenario.json.erb:899`, "Priya, from the NCSC...") and her first line (`:77`, "Priya. I'm here to help...") both introduce her. The bark can be missed if the player is in a conversation when she appears, so `:77` should keep the name. Keep.
- "The NCSC helps, it doesn't regulate" is said at `:77`, `:318` and by Marcus (`ink/npc_marcus_webb.ink:217`). Priya's two lines answer different things: who she is, and why the notification goes to Ofgem (Q12). Fix Marcus's copy instead (MAR2-7).
- "Locked on the domain when he left, still alive on the jump server, with its default password" (`:357`) nearly repeats Marcus's text (`ink/npc_marcus_webb.ink:194`). It's the root-cause recap, and Marcus's version is optional. Keep.

### 2.3 Marcus Webb, OT Security Manager (`ink/npc_marcus_webb.ink`, timed texts `scenario.json.erb:937-975`; phone, not voiced)

Marcus reads like a security manager texting from his kitchen table: clipped, a little impatient, precise about hosts and times ("ALB-SRV-02. That's a print server. Nobody logs in from a print server."). Codes and clock times are right in a text. His arguable views (logs first, air-gap) are put plainly and given real weight. All of the items below are free. Most of them stop him repeating someone else's line.

**MAR2-1 (minor; Spoken: no): a stale line once Priya has arrived.** `:378`
- Now: "Contained and notified. The NCSC are sending someone. Talk to them when they arrive."
- This branch needs the ESD in and the network isolated, so the safe state has fired and Priya is already in the control room (`scenario.json.erb:738-743`). Runtime check in section 1.
- Replace with: "Contained and notified. Priya from the NCSC is with you. Go through it with her."

**MAR2-2 (minor; Spoken: no): give lab-sheet Q20 its moment.** `current_status`, `:347-379`
- Q20 asks students to "find one moment" where "safe", "isolated" or "contained" caused or nearly caused a wrong decision. The material is there, but nobody notices it. If the player left the historian connected (`isolation_scope == "watch"`), Helen's safe-state radio still says "That's the hall safe and them out of our network" (`scenario.json.erb:749-767`), and Marcus still says "Contained." (`:372-378`), although his own warning was that the historian might be their second way in (`:226`, `:237`).
- Add after the switch, before `-> hub` at `:380`:
  ```
  { network_isolated and isolation_scope == "watch" and not facility_evacuated:
      Helen's calling it contained. With the historian still connected, I'd call it watched.
  }
  ```
- Then Q20 has a moment students can quote, at no audio cost (see LAB-2).

**MAR2-3 (minor; Spoken: no): Marcus delivers Priya's closing moral first.** `:319`
- Now: "A commissioning link nobody closes. A patch that's always next quarter. I've seen it everywhere I've worked."
- This is Priya's closing (`ink/npc_priya_s.ink:371`, "A commissioning link nobody closed, a dead account nobody removed, a patch nobody rescheduled"), and lab-sheet Q1 quotes hers. One person delivers each moral.
- Replace with: "I've seen it at every site I've worked. Nobody gets thanked for closing a link that still works."

**MAR2-4 (minor; Spoken: no): a third "review date" moral.** `:312`
- Now: "Accepting a risk's fine. It's meant to come back on a date. Ours never did."
- Helen makes the review-date point (HEL2-1) and Priya the moral (`ink/npc_priya_s.ink:285`, `:372`). The line before it, "Both times the board noted it and moved on" (`:309`), is the one Q3 quotes, and it's enough.
- Delete `:312`.

**MAR2-5 (minor; Spoken: no): a stock line shared with Helen.** `:245`
- Now: "Don't think too long." Helen says exactly this at `ink/npc_helen_marsh.ink:170`.
- Replace with: "Not too long. Those cells won't wait."

**MAR2-6 (minor; Spoken: no): the third "somebody's writing it".** `:76`
- Now: "Dead flat? Nothing real does that. Somebody's writing that value."
- Helen's radio says "Dead flat ... Somebody's writing it" and her knot "That's somebody writing a number" (section 2.1). Marcus's job here is the security conclusion.
- Replace with: "Seven hours without a flicker? That's no sensor fault. That's someone on our network."

**MAR2-7 (minor; Spoken: no): the NCSC moral, again.** `:217`
- Now: "I'm ringing the NCSC too. They help. They don't regulate."
- Priya says it in person twice (`ink/npc_priya_s.ink:77`, `:318`).
- Replace with: "I'm ringing the NCSC too. They'll send someone to help."

**MAR2-8 (minor; Spoken: no): lab-sheet Q12 asks "When did Albion become aware?" and no line answers it.** `:256`
- Only the "wait" route hints at it (`:265`, "the clock runs from when we knew, not from when we're sure").
- Now: "Without undue delay, seventy-two hours at the outside. The form's on the clipboard by the workshop door. Read it, then message me."
- Replace with: "Without undue delay, seventy-two hours at the outside, from when we became aware. For us, that's this morning. The form's on the clipboard by the workshop door. Read it, then message me."

**MAR2-9 (minor; Spoken: no): phone-call openers in a text thread.** `:64`, `:72`
- The player messages Marcus ("Message Marcus Webb", `scenario.json.erb:237`, `:922`), but he answers "Webb." and then "Fifty-one. Say that again.", which is how you answer a phone call. Tom has the same problem (TOM2-1).
- `:64` "Webb.": delete. `:65` already opens the thread well.
- `:72` now: "Fifty-one. Say that again." Replace with: "Fifty-one? On the dial?"

**MAR2-10 (minor; Spoken: no): the evacuation text repeats his own reply.** `scenario.json.erb:969`
- Now: "Helen's told me. Everyone out and counted? Good. The hall's the fire service's. The network's still ours."
- If the player messages him after the evacuation, he has already said "I've heard from Helen. The hall's the fire service's. Whoever did this is still on our network." (`:79`). Twenty seconds later this arrives, saying the same thing.
- Replace with: "Everyone out and counted? Good. Now the network. Cable first, then Tom."

Keep: `:87` ("Helen's gut has a better record than our monitoring"), `:183` ("Fine. Forensics will cope. The hall won't."), `:196`, `:226-228` (the isolation trade-off in three lines), `:265`, `:324-325` (the air-gap view, put with conviction), `:337-339` ("That's partly on me", "risk pretence", which Q2 quotes).

### 2.4 Tom Hadley, CastleTech SOC (`ink/npc_tom_hadley.ink`, timed texts `scenario.json.erb:995-1013`; phone, not voiced)

Tom is credible: a careful SOC analyst who knows what he can't see ("Which is either good news, or it's somewhere I can't see") and won't be talked into a firewall change. Two small items, both free.

**TOM2-1 (minor; Spoken: no): "Tom speaking" in a text.** `:43`
- Now: "CastleTech SOC, Tom speaking."
- Replace with: "Tom, CastleTech SOC." This matches his first unprompted text ("Tom at CastleTech.", `scenario.json.erb:1013`).

**TOM2-2 (minor; Spoken: no): "your call" is everyone's phrase.** `:186`
- "Your call" or "It's your call" comes from Helen (`ink/npc_helen_marsh.ink:328`, bark `scenario.json.erb:761`), Marcus (`:237`, `:266`) and Tom.
- Now: "It's your incident, so it's your call whether I tell them. Say the word."
- Replace with: "It's your incident, so I need your say-so to tell them. Say the word." This also sets up Priya's "Tom needed your say-so" (`ink/npc_priya_s.ink:344-346`).

Keep: `:56`, `:59`, `:103-104` ("You can contract out the watching. You can't contract out knowing what we're not watching.", quoted in Q4), `:107-108`, `:134`, `:199` ("If someone's driving it, I've got an incident of my own").

## 3. Voice and pronunciation (cross-cutting)

**V1: greetings.** These are fine. Helen: "What else, duck? / Anything else? / Right. What else?" and "Shout if you need me. / I'm not going anywhere." Priya: "Ready now? / When you are." and "We're done here. / That's everything from me." Marcus: "Don't be long." Tom: "I'll shout if anything moves." Nobody shares a hub line. The stock phrases that are shared are "Don't think too long" (MAR2-5) and "your call" (TOM2-2), both fixed on the free side.

**V2: one person per moral.** After MAR2-3, MAR2-4, MAR2-6 and MAR2-7, each idea has one owner:
- "nothing that failed was new / never looked at again": Priya (`:371-372`);
- "a risk the board only notes hasn't been decided": Priya (`:285`);
- "real sensors wobble / somebody's writing it": Helen;
- "the NCSC helps, Ofgem regulates": Priya;
- "a supplier who checks is what you want": Tom in the moment (`:134`), Priya in the debrief (`:236`). That pair stays, because Tom gives the reason on the night and Priya says what it was worth.

**V3: spoken codes, times and names.** Clean. No spoken line contains ENG-02, OPS-01, ALB-SRV-02, c.ellison, "Priya S." or a clock time written in digits. Those appear only in Marcus's and Tom's texts and in choice text, where they belong. Spoken times are in words ("twelve minutes past eleven", "three twenty-two"); "Rack A2", "Hall 1", "September 2024" and "2017" are safe for TTS.

**V4: acronyms to listen for at the audio stage (no text change now).**
- "SIS" (Helen `:324`; Priya `:181`, `:266`) and "NIS" (Helen `:332`; Priya `:306-316`, `:339`) could come out as words ("siss", "niss"). Engineers do say "siss", and "niss" is common for NIS, so either reading is acceptable. Listen to the first take of Helen `:324` and Priya `:339`. If one sounds wrong, spell it "S I S" or "N I S". Priya's "a NIS one" (`:339`) assumes "niss"; if TTS spells the letters out, change it to "an N I S one".
- "IEC" (PRI2-6), "ESD", "BMS", "NCSC", "HSE", "SCADA", "PLC", "Ofgem", "Triton": standard readings, low risk.

**V5: accent fit.** Helen's style string names Nottingham and forbids drift (`scenario.json.erb:597`). Her word choice supports it without overdoing it (section 2.1). Two cautions for the audio stage: "nowt" (`:244`) and "duck" (`:105`) are the lines where Aoede is most likely to slide into a generic northern voice, so listen to those two first. Priya's style is identical to sis01's, and none of her lines carry regional colour. No clash: Helen (Aoede), Priya (Leda) and the Narrator (Charon, no lines in sis02) are three distinct voices. Marcus and Tom share Charon, which has no effect while their texts are unvoiced (`CAST_DESIGN.md`, Voices).

**V6: stage cues and printed variables.** None in spoken text. The tags (`#give_item`, `#set_global`, `#exit_conversation`) are on their own lines.

## 4. Lab sheet against play

Every quotation in the lab sheet matches the ink: Q2 "risk pretence" (Marcus `:339`), Q3 "the board noted it and moved on" (`:309`), Q4 (Tom `:104`), Q7 (Priya `:157`), Q15 "and the reason is evidence" (Priya `:205`), Q18 (Marcus `:324`, Priya `:288`, `:295`). The questions below have a hook that most players will not meet, and one good moment in play the sheet doesn't use.

**LAB-1 (major): Q8 assumes a conversation many players never have.** `labsheet.md:164`
- "Before the ESD, Marcus asked for ten seconds to export the PLC-BMS register table..." That happens only on Marcus's optional shutdown argument (PRI2-1). PRI2-1 gives every player who pressed the ESD the fact in the debrief. Also reword the question's opening (lab-sheet owner, free): "Pressing the ESD makes the BMS run its shutdown routine, which overwrites what the attacker wrote. If you messaged Marcus before pressing it, he asked for ten seconds to export the register table on HMI-OPS-01; if not, Priya told you what was lost. Did anyone save it? ..."

**LAB-2 (minor): Q20 has no moment to point to.** `labsheet.md:202`
- As in sis01 (its L2, Q16), the material exists but nobody in the game notices it. MAR2-2 adds the moment. Then add to Q20: "For example, if you left the historian connected, compare Helen's radio, 'them out of our network', with what Marcus says."

**LAB-3 (minor): Q12 "When did Albion become aware?" has no line in play.** `labsheet.md:172`
- MAR2-8 adds it in Marcus's text. No lab-sheet change is needed.

**LAB-4 (minor): a good moment the sheet doesn't use: Priya's cable view.** `ink/npc_priya_s.ink:251-258`, Marcus `scenario.json.erb:944`
- Decision 4d gave Priya an arguable view, with a push-back for the player: you pulled the jump server cable before telling Marcus, and "Cut someone mid-write to a safety controller and you can leave it half-configured." It's the clearest place where fast containment and safety disagree. Add to Q10 or Q11: "If you pulled the jump server cable before telling Marcus, Priya said she'd have wanted him told first, because cutting a session mid-write can leave a safety controller half-configured. Was she right, and who should decide on the night?"

**LAB-5 (minor): another unused moment: the supplier's own account.** `ink/npc_tom_hadley.ink:197-199`
- Tom: "svc.deploy? ... It's ours. ... If someone's driving it, I've got an incident of my own." Q4 asks about the risk transferred to CastleTech, but not the risk the supplier brought in. Optional addition to Q4: "The account that wrote the file to the shared server was CastleTech's own. What does that say about a managed service provider's access as a risk (IEC 62443-2-4)?"

**LAB-6 (minor): the intro quotes a line most players don't hear.** `labsheet.md:62`
- "...and that she doesn't believe a word of it" is from Helen's fallback `start` (`ink/npc_helen_marsh.ink:85`), which plays only if the opening cutscene was missed. The cutscene says "while that screen's telling us fairy stories" (`:69`). Suggest: "...has been normal all night, and that the screen is telling fairy stories."

**Checked and fine:** Q1 (the three records exist where named), Q2, Q3, Q4, Q5 (Priya recaps Helen's eight weeks whether or not the player heard them, `ink/npc_priya_s.ink:267-271`), Q6, Q7, Q9 (Marcus `:198-203`; Helen's next steps keep sending the player to Marcus), Q10 (Priya `:228` covers a player who never chose), Q11 (Priya `:235-240`, every route), Q13, Q14, Q15, Q16-Q19 (pack and documents).

## 5. Best lines (keep as they are)

Helen:
- `:69` "I'm staying on this desk while that screen's telling us fairy stories. Read the dial and come straight back."
- `:152` "Fifty-one on the dial. Twenty-eight on my screen. One of them's lying to us. Which would you bet the hall on?"
- `:188` "Five. Not six." and `:191` "Nor am I. That's the trouble."
- `:201-202` "...exactly twenty-eight point nought. Not a flicker. / Real sensors wobble. That's somebody writing a number and holding it there."
- `:216-218` "No software gets a vote." / "That's only true if the wiring's still as drawn." / "It's the one thing in here I'd stake my name on."
- `:226` "Against a hall fire, that's cheap. It doesn't feel cheap at six in the morning."
- `:244` "So nothing automatic will save that hall now. It's the ESD or nowt."
- `:255` "The safety controller keeps no log of changes. We only know three twenty-two because the engineering workstation kept its own history."
- `:270` "I'd have been walking those rounds at three in the morning. I'm not sure I'd have said yes either."
- Bark `scenario.json.erb:686` "ESD's in, and nobody's read the dial yet. Well. Go and see if we needed it."

Priya:
- `:157` "When one mistake costs money and the other costs the building, how sure do you need to be?"
- `:170-171` "Wait to be certain and you'll be watching it from the car park." / "You don't need to be certain. You need to know which mistake you can live with."
- `:192` "It broke at commissioning, when that port went on. The attackers just found it."
- `:197` "The logic worked. The claim didn't."
- `:253` "Cut someone mid-write to a safety controller and you can leave it half-configured."
- `:288` "Air gaps get bridged, usually by a laptop or a USB stick."
- `:371-372` the closing.
- `:383` "Helen didn't trust a perfect screen. Look after people like that."

Marcus `:87`, `:183`, `:338`; Tom `:56`, `:104`, `:107-108`.

## 6. Counts and prioritised fix list

### Counts

| | Major | Minor | Spoken lines changed |
|---|---|---|---|
| Helen | 1 (HEL2-1) | 2 | 3 |
| Priya S. | 1 (PRI2-1) | 6 | 9 (8 changed, 1 new) |
| Marcus (text) | 0 | 10 | 0 |
| Tom (text) | 0 | 2 | 0 |
| Lab sheet | 1 (LAB-1, the lab-sheet side of PRI2-1) | 5 | 0 |
| **Total** | **3** | **25** | **12** |

Free changes (texts and lab sheet): 12 text items (one a deletion, one a new conditional line) and 6 lab-sheet items. Notes with no change proposed: V4 (acronyms, check at the audio stage), V5 (accent, listen to "nowt" and "duck" first).

### Prioritised fix list

1. **PRI2-1 + LAB-1**: one new Priya line so every player who pressed the ESD learns what it wiped (spoken: 1 new). Reword Q8.
2. **HEL2-1**: Helen's review-date line agrees with the document and the pack (spoken: 1).
3. **PRI2-3**: "went with the reset" becomes the shutdown routine (spoken: 2).
4. **MAR2-2 + LAB-2**: give Q20 its "contained" moment (free).
5. **MAR2-1**: Marcus stops saying the NCSC are on their way after Priya arrives (free).
6. **HEL2-2**: say where self-heating starts (spoken: 1).
7. **PRI2-2**: "You told Tom that Marcus..." (spoken: 1).
8. **PRI2-6**: name IEC 62443 on both patch branches (spoken: 2).
9. **MAR2-3 to MAR2-10, TOM2-1, TOM2-2**: one owner per moral, no call openers in texts (free).
10. **PRI2-4, PRI2-5, PRI2-7, HEL2-3**: smaller spoken polish (spoken: 4). These are the first to drop if the audio budget is tight.
11. **LAB-3 to LAB-6**: lab-sheet additions (free, lab-sheet owner).

If audio cost has to be cut further, items 1 to 3 (4 spoken lines) carry nearly all of the teaching value. Since Helen and Priya are due to be re-voiced in full anyway (`CAST_DESIGN.md`, Voices), all twelve cost nothing extra if they're made before the audio phase.
