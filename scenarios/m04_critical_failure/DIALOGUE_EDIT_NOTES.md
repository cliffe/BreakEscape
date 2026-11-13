# m04 Critical Failure — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m04-dialogue/ink-before/` (ink) and `scenario-before.json.erb`.
The current files were compared against it line by line. Line numbers are the **current** files unless
marked "before". References: `docs/agents/PASS4_BRIEF.md`, the dialogue style guide, the voice bible, the
humanizer rules, `DIALOGUE_REVIEW.md`, and the m07 notes as the bar.

The short version: a good pass on HaX, the briefing and Voltage. HaX's phone voice is fixed, the briefing
leads with the first action, and the stealth route, the VM-first pointers and the 61°C turn all survive.
Three problems stop it shipping as is: one guide line now describes a cloner mechanic the game doesn't
have, Vance's debrief reactions were left in corporate register (with "240,000" in figures and "duct
tape"), and the first hub question asks about a term nobody has said yet. The writer also called one
narration tell fixed when it wasn't. Verdict at the end: **revise** (light).

## 1. Logic safety (mechanical checks)

All run by me in this session; output in `<scratchpad>/m04-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 10 ink files | **STRUCTURE UNCHANGED** in all 10. Cipher, Relay, Static and the guard: 0 prose lines changed, as the writer said. Prose: briefing 103→99, HaX phone 153→148, Vance 111→111, Vance phone 42→44, Voltage 80→81, debrief 118→111. `You:` lines 0→0 everywhere. (The review says HaX phone went to 146; it's 148. Doesn't matter.) |
| Compiled JSON in step with the ink | Recompiled all 10 with `bin/inklecate` into scratch; every JSON matches the committed one. |
| `dialoguelint.mjs scenarios/m04_critical_failure/` | 0 errors, 0 warnings (18 before). Medians: briefing 12, HaX phone 11, Vance 9, Vance phone 11, Voltage 9, debrief 14. Timed texts max 30. |
| `reopencheck.mjs … m04_critical_failure` | Both phone inks, 1800 reopens each, **0 problems**. |
| `loopcheck.js` matrix (22 runs) | Briefing and debrief (clean, vented, trigger-vented, Vance KO, captured, print on bypass, cloned cards, Cipher walked) all reach a clean end; HaX phone and Vance phone hubs loop in every urgency/KO/ally state tried; Vance (`initial_meeting`, `vance_hub`, met and ally), Voltage (fresh and resumed), the three operatives and the guard: 0 runtime errors. |
| erb diff | Three timed texts trimmed (distcc, work order, Vance's ally text) and Vance's sprite block. Nothing else. |

Nothing here blocks. The pass changed words, not logic.

**One claim in `DIALOGUE_REVIEW.md` is wrong.** §2a says the phone inks carry HaX's and Vance's lines
unprefixed "as the brief requires". They don't: `m04_phone_robert_vance.ink` has 35 `Robert Vance:` lines
(33 before; the pass added two), and `m04_phone_agent0x99.ink` still has 18 `Agent HaX:` lines (for example
`:132`–`:233`, the guide handovers, the Relay KO and the 61°C turn). The phone strips a matching prefix, so
the player sees no difference, but the brief asks for them to go. See S1.

## 2. Information: what the player needs, and where it is now

Walked the critical path and each optional branch against the before-copy. "erb" means a timed text in
`scenario.json.erb`.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Gate: show the regulator badge | Briefing `m04_opening_briefing.ink:325-327`; guard choices `m04_npc_security_guard.ink:39-46` | Guard hub |
| Find Vance in the operations office | Briefing `:331` ("Find Vance first"); guard `:66`, `:76`, sticky `:156`; aim text | Yes |
| Copy Vance's Level 1 card | Clone choice `m04_npc_robert_vance.ink:215`, sticky retry `:355`/`:358`; briefing `:176` ("your cover and that cloner"); erb `:642` RFID guide offer | Yes |
| RFID guide | HaX `m04_phone_agent0x99.ink:132` | **Wrong mechanic**, see M1 |
| Workshop needs Level 2; Relay has it (quiet route seed) | erb `:647` "old prox, like his. She walks the inverter room." (unchanged); HaX `:692-700`, `:728`; briefing `:174` | Yes |
| Relay's card copied mid-standoff | `m04_npc_operative_relay.ink:85` (sticky) and last chance `:151`; erb `:727` after the clone ("She won't chase far. Cross when she's at the far end."); debrief payoff `m04_closing_debrief.ink:184-185` | Yes |
| Relay down: her card, or HaX's relayed copy | HaX `:182`, `:203`, `:697` | Yes |
| Plant door is biometric; someone used it on the ninth | erb `:680`/`:687`; access export document | Yes |
| Whose print, and where | Vance `:401` (sticky hub, ally); Vance phone `m04_phone_robert_vance.ink:108` (once); erb `:716` (VM-first branch names the Hall 1 panel); HaX `:705-710` | Yes, but HaX `:710` lost "every round", see S9 |
| Kit is in the workshop tool case | erb `:762`; VM-first door refusal erb `:697` ("Check what they left in the workshop"); HaX `:710` | Yes |
| VM: what to do and where flags go | Briefing objective Two `:268` (workshop + drop-site, better than before); erb `:755`; HaX `:386-389`, `:623`, `:744-748`; Vance phone `:145-151` | Yes. `:389` reads awkwardly, see O |
| The screens lie; check a real instrument | erb `:994` | "in the hall" lost "battery", see S12 |
| Dial in Hall 1 reads 61 (the turn) | Vance phone `:201`; HaX `:219-233`; Vance reveal choice `:381` | Yes |
| The hardwired shutdown is the answer | Briefing `:270-272`; HaX `:452-461`, `:538-544`, `:628`; Vance phone `:132-138`, `:161-163` | Yes. Naming drift with "ESD", see S10 |
| Voltage alive if possible; lives first | Briefing `:178`, `:311-315`; HaX `:472-525` | Yes |

Losses by severity:

- **M1.** HaX's RFID guide line (`:132`) now says "Read it, write it to a blank, show it to the reader."
  The game's cloner saves and emulates a card (`rfid-minigame.js:5-6`, `handleEmulate`); there are no blank
  cards in the player's kit. Before (`:132`) it said "Read it, save it, play it back at the reader", which is
  what the player does. A player new to the cloner now looks for a blank. Revert.
- **S9.** HaX `navigation_help` `:710` (no-kit branch) dropped "every round". That word is the pointer to the
  Duty Round Panel; the kit-found branch at `:708` keeps it. Put it back.
- **S12.** erb `:994` lost "battery" from "the battery hall", so "a physical instrument in the hall" has no
  clear hall. The dial is in Hall 1 (erb `:1501`); say so.

Everything else the cuts removed was colour, or is on paper (the access export, the procedures, the work
order). The briefing's objectives are clearer than before: objective Two now names the workshop and the
drop-site terminal, and the last line points at Vance.

**The four EXTRA checks.**

- **Stealth route still signposted.** Yes. Relay's two clone choices (`m04_npc_operative_relay.ink:85`,
  `:151`) are unchanged and say plainly what they do. The Hall 1 seed (erb `:647`, "Relay has, and it's old
  prox, like his") and the post-clone text (erb `:727`) are unchanged. HaX's hub still names Relay's card
  (`:697-700`, `:728`), and the briefing still says the cover and the cloner beat fists (`:176`).
- **VM-first player pointed to the kit and the print.** Yes. The reader refusal sends them to the workshop
  (erb `:697`); picking up the kit after the VM names the Hall 1 panel (erb `:716`); HaX's hub covers both
  (`:705-710`, S9 aside).
- **The 61°C call is still the turn.** Yes. `on_anomaly_confirmed` (`:219-233`) pays off Nightshade's
  briefing ask ("Get me a real reading off that floor", briefing `:34`), says the number aloud as
  "sixty-one", and gets out in two lines and one reply. Two small notes in O: "won't sit still" is weaker than
  the old "won't stay put", and Nightshade promised to say "how much time we actually have", which the call
  never quite answers.
- **Vance's new sprite.** No clash on screen in m04. The cast is the player and briefing HaX on `hacker`,
  debrief HaX on `female_spy_v2`, Netherton `male_spy_v2`, Nightshade `male_scientist_v2`, the guard and all
  four operatives on `hacker-red`, Vance on `male_telecom_v2` (hard hat, hi-vis). The assets exist. Three
  things to log, none blocking: (a) the phone contact `robert_vance_phone` still has the generic
  `npc_helper.png` avatar (erb `:1029`), so his phone face no longer matches his face in person (S16);
  (b) the same sprite is Owen Gallagher in m05 and Thomas Park in m07, so the next mission opens with
  Vance's face on a Manchester sysadmin (backlog); (c) pre-existing: the gate guard shares `hacker-red` with
  the four ENTROPY operatives, so the one person the debrief scolds you for hitting (`m04_closing_debrief.ink:103`)
  looks exactly like the enemy (backlog).

## 3. Character

**HaX.** The pass did what the voice bible asked. The two flagged lines are gone: `vm_guidance` now opens
on the next action (`:386`), and "Vance's cooperation will be valuable" is now "Lean on Vance when you need
to." (`:266`). Hints open on the action, she says "Sent." and gets out, there are no exclamation marks, and
the debrief has stopped grading ("Excellent" ×2 gone). Her best new lines are the briefing opener
("Worse than Ransomware Incorporated. This lot don't want paying.", `:42`) and "Take him, and we're closer to
whoever's holding the watch." (`:245`). Fixes:

- **S2.** Debrief `:118` "Good. Voltage is worth more to us than anyone else in that building." In a
  mission about people who costed the night crew, HaX ranking a terrorist above everyone in the building is
  the wrong line, and it contradicts her own "Lives first. Intelligence second." Replace: "Good. Nobody else
  in that building knows the chain above Blackout."
- **S18 (part).** Debrief `:285` "That's the job, when it works." is one of the tidy enders the style guide
  lists by name ("That's the job."). Cut it and end on `:284` ("Forty-odd on that feed never knew they were on
  it."), which is the stronger line.
- **Optional.** Briefing `:122` "That's the whole job." same habit; "Yes." does the work. Phone `:576` "Bring
  it home." is stock; end on "Two hundred and forty thousand people are on that grid." "That's the case made"
  is said twice (`:435`, `:641`); change `:435` to "your flags are landing. Grid control can see it too."

**Netherton.** Few contractions now ("Nightshade has read the control systems"), two short lines, clean
hand-over. One problem:

- **S3.** Briefing `:28` "ENTROPY have stopped stealing things and started breaking the things people stand
  under." The trim added a second "things", and the line still echoes Nightshade's "stops being a hack and
  starts being a body count" four lines later. Replace: "Agent 0x00. ENTROPY used to steal. Now they break
  the things people stand under."

**Nightshade.** The approved m08 seed ("The physics doesn't lie and neither do I.") is kept word for word,
and splitting his line in two lets it land on its own. No change.

**Vance.** Better in the field: "You regulator lot keep strange hours", "Cards worked, they quoted an order
number", "I log every round on the Hall 1 panel." Clipped, factual, no corporate filler. But the pass stopped
at the debrief door:

- **M2 (must-fix). Vance's debrief reactions were left as they were, and they're the flattest lines in the
  mission.** `m04_closing_debrief.ink:319`, `:321`, `:343`, `:345`, `:367`, `:369`, `:406`, `:410`, `:412`,
  `:415`, `:436`, `:438`, `:445`. They read as a press office ("The public backlash will be severe. But I
  understand the reasoning.", "Probably the most politically viable option.", "I'll begin implementing
  security overhauls immediately."), not as the brisk Teesside engineer in the voice bible. `:406` still has
  "240,000" in figures in a spoken line, and `:436` says "duct tape" (UK: gaffer tape). Every non-KO player
  hears two or three of these, at the point where the disclosure choice should pay off. Replacements, same
  conditions, one line each:
  - `:319` (full, trusted): "It'll hurt us. People should still know how close it came."
  - `:321` (full): "There'll be hell to pay for this place. Fair enough."
  - `:343` (quiet, trusted): "I'll keep my mouth shut. Doesn't mean I like it. Those people are on our feed."
  - `:345` (quiet): "Good. One more headline and they'd close us."
  - `:367` (partial, trusted): "Something, not everything. I can live with that."
  - `:369` (partial): "That'll go down well upstairs, I suppose."
  - `:406`: "Nobody in that hall died, and two hundred and forty thousand never lost the lights."
  - `:410`: "You did right by this place." · `:412`: "I'll not forget it."
  - `:415`: "I don't know what you are. I know what you did."
  - `:436`: "We've run this place on hope and gaffer tape for years." · `:438`: "That stops on my shift."
  - `:445`: "I'll have those card readers out by the end of the week." (ties to the what-failed beat)
- **S4.** `m04_npc_robert_vance.ink`: the reveal path says "two hundred and forty thousand" twice in one
  scene (`:453`, `:520`), and `:128` says it a third time on the reluctant path. Keep `:453` (the shock). Replace `:520`: "Not on my
  site. We're stopping this."
- **Optional.** Vance phone `:106` "High-voltage." on its own is stiff, and the in-person hub still says "HV
  room" (`m04_npc_robert_vance.ink:363`). An engineer says HV; revert the phone line to "HV room. Authorised
  persons only, and tonight that's me." "I've a plant to run" (`:388`) reads Scots or Irish more than
  Teesside; "I've got a plant to run." Vance's rhythm now matches HaX's three-fragment lines; give him one
  longer engineer's line somewhere, for example phone `:132` "Three rack banks, A, B and C, and each one's got
  its own management unit and its own cooling loop."

**Voltage.** Still the best-written villain voice in m04. The 34-word line is now two lines that each move,
and "I wrote it." after "[Someone wrote that speech for you.]" is a good beat. Two notes:

- **M3 (part, must-fix).** `m04_npc_voltage.ink:215` Narrator "Not doubt. Irritation, at being slowed down."
  The review says the "It isn't doubt. It's irritation" tell was "de-tell'd". It wasn't: it's the same "Not X.
  Y." shape with the verbs removed, in narration, which the style guide doesn't allow (villains may, the
  narrator may not). It also tells the player what he feels. Replace with what the camera sees: "For the
  first time something moves behind his face. His eyes go to the laptop clock."
- **Optional.** `:211` "Somebody has to make people see that." lost the word that made the line his.
  Restore "Somebody has to make that legible." "You'll never find him" (`:229`, was "them") is fine: the voice
  bible makes the Architect male.

**The one-mission cast, and the four files left untouched.** Cover the names and you can still tell them
apart: Cipher nervy and loud, Relay cool and costed, Static in fragments, the guard polite and put out. The
writer's "already tight" holds for Cipher and Static's lines, but not for every line in those files:

- **Cipher** (`m04_npc_operative_cipher.ink`): agree. Optional: `:107` "He wants it to be a lie." reads his
  mind; the next sentence ("His eyes go to the Hall 2 door, and stay there.") already shows it. Cut the first.
- **Relay** (`m04_npc_operative_relay.ink`): disagree on two narrator lines.
  - **M3 (part).** `:103` "There is no flinch in it. She is not a technician who was lied to; she costed this
    and came anyway." is a narrator "not X; Y" the lint missed because of the semicolon, and the player's
    next choice (`:105`, "You modelled the casualties and came anyway.") then repeats it. Keep "There is no
    flinch in it." and cut the rest.
  - **S5.** `:61` "She had not expected anyone to have looked in the cabinets." is mind-reading, and her own
    line at `:62` ("...You've been in the cabinets.") says it better. Cut the sentence; keep "That stops her
    harder than a raised voice would."
  - **Optional.** `:70` "…with the unhurried confidence of someone who expects to win this." → "She clips the
    radio back on her belt, unhurried." `:93` "No, you're really not going to be able to do that." → "No.
    You're really not."
- **Static** (`m04_npc_operative_static.ink`): **S6.** The sticky choice `:48` "[Move him.]" is spoken to
  Static and reads as an order to move Voltage. Replace: "[Out of my way.]"
- **Guard** (`m04_npc_security_guard.ink`): **S7.** `:39` "[State grid-safety regulator…]" and `:51` "State
  auditor? This early?" are American civil-service words; the player's cover is the grid-safety regulator
  (briefing `:208`). Vance's reveal narration repeats it (`m04_npc_robert_vance.ink:432`, "Not a state auditor
  — SAFETYNET."), which is also a "Not X — Y". Replace: `:39` "[Grid-safety regulator. I'm here for the
  audit.]"; `:51` "The regulator? This early?"; Vance `:432` "You drop the cover and tell him who you work
  for. ENTROPY operatives are inside his facility, and his battery storage is the target." Optional: `:39`
  and `:42` are the same move (both "I'm here for an inspection"); make `:42` "[Just a routine visit. Won't
  take long.]".

## 4. Craft

**Choices.** First person throughout, no echoes, and the menu-speak is mostly gone ("[Understood. Infiltrate,
investigate, neutralise, capture. Moving out now.]" is now "[Got it. I'm on my way.]"). One choice no longer
has anything to stand on:

- **M4 (must-fix). The first hub question asks about a term nobody has said.** Briefing `:89` "[Thermal
  runaway. What does that actually mean?]" is the first option every player sees in `briefing_hub`, but
  "thermal runaway" isn't spoken anywhere before it (`:26-72`: Netherton, Nightshade's "safety interlocks",
  HaX's four facts). The old wording had the same gap; "What does that actually mean?" makes it worse, because
  the player is now asking for the meaning of a word they've just heard. Replace the choice (condition and
  divert untouched): "[What happens if they set those batteries off?]". Or add the term to `:70`: "They own the
  SCADA network now, and they've set the racks up for thermal runaway."
- **Optional.** Debrief disclosure choices `:302` and `:305` are still menu labels, and HaX's `:361` "A
  controlled line." echoes the choice's "Controlled narrative." Replace: `:302` "[Keep it classified. Let them
  patch it quietly.]", `:305` "[Say there was an incident. Keep the details back.]".

**The debrief.** It leads with the outcome, reads back the clone route, the print on the bypass module,
Cipher walking, Calder Wharf, the KO'd guard and Vance, and the what-failed beat is the best scene in the
file: three weaknesses, three framings, and "A print names you. It can't prove you're the one standing
there." Four lines don't fit their paths:

- **S13.** `:245` "Hunt the coordination, not the cells." then, after the player asks "[What would Task Force
  Null do?]", `:258` says the same thing again ("We're not chasing cells one at a time anymore. We go after
  the network. The Architect. The thing that coordinates them."). Two contrast shapes back to back, a
  three-fragment list, and "anymore" (UK: "any more"). Replace `:258`: "Find whoever sends the directives.
  Every cell we've hit so far was working from the same ones."
- **S14.** `:271` "When he says so. Not tonight." answers "When do we start?", but the explanation path
  (`:249` → `:255` → `:264`) reaches it without the player asking. Replace with a line that works on both
  paths: "He'll call when he's ready. Not tonight."
- **S15.** `:141` "So far he's told us what he told you: the number." Voltage only states the number in
  `voltage_states_the_number` (`m04_npc_voltage.ink:198-205`), which is reached only through the optional
  "[Why infrastructure? Why civilians?]" (`:173`); a player who fought him straight away never heard it. Replace: "So far he's given us one thing: the number."
- **S17.** `:216` "Now we know how the cells fit together, not only that they do." is the "not just X" cousin.
  End at "together".
- **S18 (rest).** `:478` "This is just the start." is a stock last line, after a mission that has already
  set up Task Force Null. Replace: "Sleep. I'll call." Optional: `:262` "You're ready for this." is the same
  habit; cut it.

**The briefing.** Opens on the situation, states the stakes once in a spoken number, gives four objectives
one per line, and ends on "Find Vance first." That's the shape the style guide asks for. Three fixes:

- **S8.** `:210` "The man to find is Robert Vance, the duty engineer. He knows an audit's due. Not before
  dawn." Vance is "the facility manager" in HaX's phone choice (`m04_phone_agent0x99.ink:248`) and twice in
  the debrief (`:100`, `:454`), and "the OT engineer on shift" in the aim text (erb `:200`). "Not before dawn."
  is also a tailing fragment. Replace: "Credentials are in your kit. Find Robert Vance. He runs the site, and
  he's on shift. He isn't expecting anyone before dawn." (24 words)
- **S10.** The pass renamed the ESD "the shutdown" in every spoken line, but the timed texts still say "ESD"
  (erb `:945`, `:962`/`:969`/`:976`, `:1035`, `:2023`), and the player now never hears what it stands for.
  Introduce it once at `:270`: "Three. The plant room has a hardwired Emergency Shutdown button, the ESD. No
  network path, so it's the one control they couldn't take." Optional: let Vance, the engineer, keep "the ESD"
  in one phone line (`m04_phone_robert_vance.ink:194`, "built for exactly this").
- **S11.** erb `:626`, the first text after the briefing, still opens "Critical infrastructure threat." (the
  stock opener the pass removed from the briefing) and restates the stakes the player heard thirty seconds
  ago. Make it the first action: "Gate first. Regulator badge, routine audit, came early. Then find Vance in
  the operations office."
- **Optional.** `:49` "Power, water, transport. On purpose." and `:135` "Power storage, generation,
  transport." are two lists of three a minute apart. `:49`: "They break the things people live on, and they
  mean to."

**Subtext.** Good where it counts. Cipher's "That panel is not supposed to be amber." Relay's "The casualties
were a line in the same spreadsheet." HaX's "The screens lie because they have to." Voltage's "I don't need
their names to know the number." Nobody explains their own feelings.

**The 61°C turn.** It lands: it arrives as a call rather than a text, it names Nightshade and pays off his
briefing ask, and it's two lines. Optional tightening of `:221`: "won't sit still" sounds fidgety for a
battery fire, and Nightshade promised "how much time we actually have". Suggested: "Nightshade's got your
sixty-one. His words: those cells are past safe, and the time we thought we had is gone, trigger or no
trigger." (24 words)

**Debrief payoffs.** Every choice-setting global the debrief declares is read: disclosure, Vance's trust and
KO, the guard's KO, both cloned cards, the print on the bypass, Cipher walking, the three lore flags, captured
or escaped, vented and trigger-vented, and the crew count. The one weak payoff is Vance's reaction to the
disclosure choice (M2).

**The m08 seed.** Kept, and kept subtle. Nightshade gets one double-edged line, and HaX quotes him once more
in the 61°C call without comment. Right weight.

## 5. AI tells and UK English

A hand search for the banned words, the transitions and the "not X, Y" shapes found nothing the lint
should have caught, apart from these:

- **Disguised "Not X. Y." in narration**: Voltage `:215`, Relay `:103`, Vance `:432` (M3, S7). Heroes and
  narration don't get this shape; villains get one per scene, and Voltage's own ("We didn't make it fragile.
  We just stopped pretending it wasn't.") is the right one to keep.
- **Contrast cousins**: debrief `:216` "not only that they do", `:245`/`:258` (S13, S17).
- **Tidy endings**: debrief `:285` "That's the job, when it works.", `:478` "This is just the start.", `:262`
  "You're ready for this."; briefing `:122` "That's the whole job." (S18, optional).
- **Rhythm.** HaX's clipped three-fragment lines are right for her ("No contact yet. They're here. Be
  ready."). The pass gave Vance the same cadence ("Three of them, here two days.", "Cards and an order
  number."), so the two voices you hear most now sound alike. One longer line for Vance fixes it (see
  optional under Vance).
- **UK English.** "Duct tape" (M2) and "state auditor" (S7) are American. "Anymore" at `:258` should be "any
  more" (goes with S13). "Alright" (guard `:55`, Vance `:417`) is common in British dialogue; leave it.
  Numbers are spoken except Vance's debrief `:406` (M2). "Cyber Security" doesn't occur.

## 6. Findings list

**Must-fix**

- **M1.** HaX `m04_phone_agent0x99.ink:132`: the RFID guide line describes writing to a blank card, which the
  game's cloner doesn't do. Revert to "Sent. Old prox cards just shout their number. Read it, save it, play it
  back at the reader."
- **M2.** Vance's debrief reactions, `m04_closing_debrief.ink:319`–`:445` (13 lines): rewrite in his voice;
  "240,000" in figures at `:406`; "duct tape" at `:436`. Replacements in section 3.
- **M3.** Narration "Not X. Y." and mind-reading: Voltage `:215` → "For the first time something moves behind
  his face. His eyes go to the laptop clock."; Relay `:103` → "There is no flinch in it."
- **M4.** Briefing `:89`: the first hub choice asks about "thermal runaway" before anyone says it. → "[What
  happens if they set those batteries off?]"

**Should-fix** (replacement lines in sections 1–4)

S1 drop the contact's own prefix on the phone inks (HaX 18 lines, Vance 35; no audible change) · S2 debrief
`:118` Voltage "worth more than anyone in that building" · S3 Netherton `:28` · S4 Vance `:520` third
"two hundred and forty thousand" · S5 Relay `:61` narrator · S6 Static `:48` "[Move him.]" · S7 "state
auditor" (guard `:39`, `:51`; Vance `:432`) · S8 briefing `:210` Vance's role and the "Not before dawn."
fragment · S9 HaX `:710` restore "every round" · S10 introduce "ESD" once at briefing `:270` · S11 erb `:626`
first text → first action · S12 erb `:994` "in Hall 1" · S13 debrief `:258` repeats `:245` · S14 debrief
`:271` answers an unasked question · S15 debrief `:141` "what he told you" · S16 erb `:1029` give
`robert_vance_phone` the `male_telecom_headshot.png` avatar so his phone face matches · S17 debrief `:216`
"not only" · S18 debrief `:285`, `:478` tidy enders.

**Optional**

HaX `:122`, `:435`, `:576`; Vance phone `:106` "HV room", `:132` one longer line, `:388` "I've got";
Voltage `:211` "legible"; Cipher `:107`; Relay `:70`, `:93`; guard `:42`; briefing `:49`; debrief `:262`,
`:302`, `:305`; the 61°C wording at `:221`; Vance keeping "ESD" at phone `:194`.

**Lines this would touch.** About 40 spoken lines, 4 choices and 2 timed texts across 8 ink files and the erb,
plus one erb avatar path. S1 removes about 53 speaker prefixes without changing any spoken text. m04 audio
isn't generated yet, so none of it costs anything. All of it is prose inside existing lines; no tag, knot,
condition or divert changes.

## 7. Verdict

**Revise** (light). The structure is unchanged and every runtime check is clean. The pass makes m04 tighter
and fixes the HaX voice the bible flagged, and it should stand. The stealth route, the VM-first pointers and
the 61°C turn all survive in words. Fix M1–M4 before it ships: M1 because a stuck player is told to do
something the game can't do; M2 because the debrief's one non-HaX voice turns into a press release just as
the disclosure choice pays off; M3 because the pass claimed to fix a narration tell it only disguised; M4
because the first thing the player asks makes no sense. Take the should-fix items in the same edit; they're
one-line swaps. Then rerun tagdiff against the same snapshot, dialoguelint, reopencheck and the loopcheck
matrix. Nothing here needs a new playtest. A look at Vance's portrait on the phone and in the debrief would
confirm S16 and the sprite swap.

## Ideas for the backlog

- **Sprite reuse across missions.** `male_telecom_v2` is Vance (m04), Owen Gallagher (m05) and Thomas Park
  (m07). m05 follows m04, so the player meets Vance's face as a different man straight away. A per-mission
  tint or an alternative engineer sprite would fix it.
- **Guard and operatives share `hacker-red`.** The gate guard looks like the four ENTROPY operatives, and the
  debrief criticises a player who hits him. A distinct guard sprite (as m02 and m03 have) would remove the
  trap.
- **Lint rule.** `dialoguelint.mjs` missed "She is not X; she Y" (semicolon) and "Not X. Y." with no verb. A
  narration-only rule for `Narrator: … Not [a-z]+\. ` and `is not a .*;` would have caught M3.

Scratch output: `<scratchpad>/m04-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `loop.txt`, `json/`).

