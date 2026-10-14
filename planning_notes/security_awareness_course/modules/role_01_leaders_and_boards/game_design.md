# role_01 game design: Crisis Room

## Concept

It is 02:13 on a Wednesday in November and the player is Larkspur's on-call director this week. Ama Owusu rings: the overnight monitoring partner has found ransomware spreading across the file servers, and she wants to take the whole network offline, which will stop the depots that send cleaning teams to hospitals and care homes in the morning. Gillian Marsh, the chief executive, is on a flight back from Singapore and lands at 07:05. Whatever the player says next is the first entry in the crisis.

The module compresses thirty-six hours into thirty minutes on a crisis board in Larkspur's board room. The "work task" is running the crisis to the board's own objectives: keep the lifeline services going, meet every clock, decide the ransom question properly, and restore safely. The tests arrive as injects inside that work: the insurer asks an awkward question, a respected colleague wants to wait before telling the regulator, a client hears about it from the wrong person, a voice note "from Gillian" asks for a quiet payment. None of them is a trick. Each is a decision a real board has faced, with the advice in the room to make it well.

The hook a board member will talk about at lunch: their own decision log comes back at the end, when the chair plays the regulator and asks, "Show me where you wrote down why."

Boards prefer a workshop, so the facilitated session is the main mode: the board plays together around one screen with a facilitator, pausing to discuss (see Variants). The solo version gives each director the same decisions, a personal record and a certificate for Code action C.3.

## Setting and cast

- **Rooms:** the player's kitchen at night (a conversation background only, for the 02:13 call); Larkspur's board room (`room_zds_conference`, redressed with the Larkspur logo, a canal view and the crisis board on the wall screen); Ama's incident room (`room_security`, with the "Isolate network" button); Gillian's office (`room_ceo`, empty until day two). No new rooms.
- **Faisal Karim** (non-executive director with a cyber background): the mentor for this module. Measured, kind, slightly too fond of his flask of coffee. Explains in short chunks and translates between the security team and the board.
- **Anne-Marie Lambert** (chair): chairs the 09:30 emergency board call and plays the regulator in the debrief. Formal, fair, writes everything down with a fountain pen.
- **Gillian Marsh** (chief executive): on a plane, then on a video call from the airport car, then in the room on day two. Decisive and impatient with process; voices the most tempting misconception ("tell the ICO once, properly").
- **Ama Owusu** (Information Security Manager): leads the technical response from the incident room. Calm, honest about what she doesn't know yet.
- **Tomasz Wiśniewski** (Data Protection Officer): advises on the breach, the clock and telling the people affected.
- **Hassan Qureshi** (Finance Manager): the insurer contact and payroll fallback; receives the fake voice note and brings it straight to the player, because of his own near miss.
- **Owain Jenkins** (IT Service Desk Lead): restoration options on day two. **Kai Murray** (analyst): status updates on the board.
- **Lena Fischer** (Operations Manager): by phone at 06:30, asking what to tell the depots.
- **New: Daniel Kwan**, Head of Communications. 30s, British Korean, quick, dry, allergic to the phrase "fully under control". Drafts every message and insists staff hear things first. Needs art and a voice.
- **New: Leah Brodsky**, the insurer's breach coach (a solicitor on the insurer's panel). 40s, Jewish British, brisk and kind. Phone voice only.
- **New: Gavin Ashworth**, Director of Estates at Kirkmoor Hospitals NHS Trust (a fictional client). 50s, white, from West Yorkshire, worried rather than angry. Phone voice only.
- **The attackers:** never seen or heard. Their demand appears on the ransom screen and as a message on their payment portal, shown as a screenshot Ama prints.

## Structure

The critical path is marked **(CP)**. Times in brackets are crisis time; the minutes are play time.

### 1. Hook: "02:13" (2 minutes)

- **(CP)** Black screen, a phone buzzing, the kitchen at night. The call (MG-04, or a `phone-chat` call until MG-04 exists) with the crisis board's first stamp behind it: "02:13 RANSOMWARE DETECTED: FILE SERVERS".
- Ama: *"Sorry to wake you. Our monitoring partner has found ransomware spreading on the file servers. I want to take the whole network offline, now."*
- Ama: *"That stops the depots this morning. Hospital rotas, school deliveries. Gillian's in the air until seven. It's your call."*
- **Decision H1, contain:** *"Do it. Isolate now, and log that I authorised it."* / *"Can you isolate just the file servers?"* / *"Let's wait until Gillian lands."* / *"What does the plan say?"*
  - The plan (a `notes` page the player can open at any time) says the Information Security Manager may isolate on her own authority and must tell the on-call director at once. Opening it is rewarded, never required.
  - "Just the file servers": *"I can, but it's already on two other systems. I'd rather take the lot down."* The player chooses again.
  - "Wait": *"Every hour it spreads further. By seven it could reach the backups."* If the player still says wait: *"The plan lets me isolate on my own authority. I'm doing it, and I'm logging that you asked me to wait."* Containment happens either way; the log records who decided what.
- **Decision H2, who to wake** (a card on the crisis board, choose any): Tomasz (DPO), Daniel (communications), Hassan (insurer and money), Owain (recovery), Lena (lifeline services), Anne-Marie (chair), a message to Gillian for when she lands, an all-staff email, our IT supplier's account manager. The plan's list is the first seven. An all-staff email at 02:30 goes through a system the attackers may be reading.
- Ama: *"Not on email. Use the crisis group on the backup phones."*
- **First log entry** (MG-24): the board asks *"02:19: what did we decide, and why?"* The player picks a reason ("On Ama's advice, to stop the spread; we accept the loss of depot systems this morning") or types their own. Skipping it is allowed and recorded.
- The baseline for R01-B1 to B3 is recorded: contain on advice, convene the right people, write it down.

### 2. Learn: "Before the room fills up" (4 minutes)

- **(CP)** 06:00 in the board room. Faisal is already there with his flask: *"Morning. Five minutes before everyone arrives. It'll save us hours."*
- Five chunks (EX-01), each under a minute, each with a visual aid in the conversation panel (BE-08):
  1. **Their job and ours.** Two columns: the technical team contains, investigates and rebuilds; leaders decide what to give up, what to say, what to spend and which risks to accept. *"Ama's team fixes the systems. We decide what we're prepared to lose while they do."*
  2. **The clocks.** A timeline from 02:13: the ICO by 02:13 on Saturday where feasible, the insurer within 24 hours under our policy (sooner is better), NHS and council clients within 24 hours under their contracts, the police and the NCSC today. *"The clocks started at 02:13, not when we feel ready."*
  3. **Write it down.** A decision log entry, annotated: time, decision, who, advice, reason, review. *"If it isn't written down, we'll argue about it in three weeks."*
  4. **If they ask for money.** Four facts on one card: no guarantee of a working key; no way to make stolen data safe; it doesn't meet or reduce our duties to the regulator; it may be unlawful. *"And we agreed our stance at last year's exercise. It's in the board pack."*
  5. **Say what you know.** The six-part message formula. *"People forgive 'we don't know yet'. They don't forgive 'all fine' followed by the truth."*
- Check question (MG-20 single item): *"When did the ICO's seventy-two hours start?"* At 02:13, when we became aware (correct) / when forensics confirms what was taken / when the board meets at 09:30.
- **Skip:** *"I've been through a real one."* Faisal: *"Then you know the first day disappears. One question, humour me."* A wrong answer brings back the chunk it tests.
- **Optional topics** in Faisal's hub: *"What does the Code actually ask of us?"* (the five principles on one slide, 45 seconds), *"What does our insurance cover?"* (the NCSC's seven questions), *"What's the government doing about ransom payments?"* (the proposals and their status, 30 seconds).

### 3. Practise: "Whose call? Which clock?" (3 minutes)

- **(CP)** MG-24 practice mode on the wall screen. Ten cards, dealt one at a time, dropped into **Leaders decide**, **Technical team does** or **Not ours to decide**:
  - Leaders: whether to isolate when it stops services; the ransom stance; what to tell clients and when; which service to restore first; paying staff from last month's figures.
  - Technical: which forensic tools to use; resetting every administrator password; scanning backups for the attackers' tools.
  - Not ours: whether the ICO investigates; whether the press runs the story.
  - Feedback from Faisal in one line each, for example on the press card: *"We can't stop the story. We can make sure ours is the first true one."*
- Then four clocks to match: the ICO (72 hours, where feasible), Kirkmoor's contract (24 hours), the insurer (24 hours under Larkspur's policy), the police and the NCSC (today, as soon as you can).
- Two mistakes in a row bring Faisal back with the relevant card from Learn.

### 4. Apply: "Thirty-six hours" (14 minutes)

- **(CP)** The crisis board (MG-24) fills the wall screen. A task bar (BE-18) shows the board's four objectives in order: **Keep lifeline services going. Meet the clocks. Decide and record. Restore safely.** Status rows: Lifeline services, Email (untrusted), Personal data, ICO clock (a countdown), Leak deadline (from inject 4), Press. Each inject arrives as a time skip (BE-16) with the board's stamp jumping forward; each ends with a decision card and a reason prompt for the log.

**Inject 1 (06:30): the depots.** Lena on the phone: *"The rota system's dark. Kirkmoor's wards need cleaning teams by half seven. What do I tell the depots?"*
- *"Use the printed rotas in the depot folders and ring the site managers."* / *"Hold the teams until Owain has the system back."* / *"Ask team leaders to share rotas from their personal email."*
- Lifeline services goes to PAPER FALLBACK, stays DISRUPTED, or goes to PAPER FALLBACK with a new risk on the board ("Staff and resident names in personal mailboxes").

**Inject 2 (08:15): the insurer's question.** Leah Brodsky, the breach coach: *"Please don't contact the attackers or pay anything without us. One question for the claim. Was MFA on all remote access, as the policy requires?"* Ama, quietly: *"All staff, yes. One supplier's remote support server, no. It's on the risk register, accepted until the replacement in March."*
- The policy conditions open in `warranty-checklist` (four rows: MFA on all remote access; offline backups tested quarterly; critical patches within 14 days; plan exercised in the last 12 months). The player marks each compliant, arguable or breached, then tells Leah.
- *"Tell her the truth and send her the risk register entry."* / *"Say we'll check and come back next week."* / *"Say yes, it's all covered."*
- Leah to the truth: *"Thank you. Honest answers keep your options open. I'll talk to the insurer today."* No promise of cover is made.

**Inject 3 (09:30): the emergency board call.** Anne-Marie chairs; Gillian joins by video from the airport car (`person-chat` video-call mode). Tomasz: *"The HR share was copied. Staff records, and care home residents' names in the rota files. That's a personal data breach."* Gillian: *"Can we hold the ICO until Friday? I'd rather tell them once, properly, than look like we don't know what we're doing."*
- *"Tomasz, what does the ICO expect?"* (he answers, and the evidence unlocks the argument) / *"Let's notify today with what we know and update them later."* / *"Fair point. Wait for the forensic report."* / *"We don't know it's personal data yet. No notification."*
- As in sis01's Helen scene, Gillian holds her view until the player brings evidence: Tomasz's advice, or Faisal's clock card from Learn. Tomasz: *"Seventy-two hours where feasible. They'd rather have a first report now and the detail later."* Gillian: *"Fine. Early and honest. Send it."*
- The ICO clock row shows NOTIFIED with the time, or keeps counting down. Waiting until Friday notifies just inside 72 hours in the log and returns in the debrief; "no notification" misses it.

**Inject 4 (11:00): the demand.** Ama brings a printout of the attackers' portal: *"412 GB of your files. Proof attached. Pay within 7 days or we publish."* The samples are HR spreadsheets. The ransom screen (`ransomware-display`) is shown on Ama's laptop, seen and not played. A countdown appears on the board. Daniel: *"If this leaks, it's on social media within the hour."*
- The board's resolution in `coverage-decision-form` (three sections): **Engage?** No direct contact / only through the insurer's specialist, to learn what they hold / directly, to negotiate. **Payment?** No, under our stance / kept open as a last resort, subject to checks / pay now to stop publication. **Before any exception** (choose all that apply): legal and sanctions advice; insurer told; NCSC and police told; full board agreement; reasons minuted.
- Last year's board minute is in the board pack on the table (`notes`). Faisal answers questions but doesn't decide.
- Assessment follows the process, not the verdict (see `assessment.md`). Consequences shown later: in every branch the leak deadline still arrives; in the "pay now" branch the attackers send a decryptor that is slow and partial, and three weeks later part of the data appears on another forum anyway.

**Inject 5 (13:00): the client.** Gavin Ashworth from Kirkmoor Hospitals: *"I heard from our ward manager, not from you. Are your people safe on our sites? Our contract says twenty-four hours."* Daniel offers three drafts on the board:
- A: *"We're dealing with a cyber attack. Here's what we know, what we don't yet, what we've done, what to watch for, and we'll update you at five."*
- B: *"A minor IT issue, fully under control. No impact on your services."*
- C: *"We can't comment until the investigation is finished."*
- A second card: who hears first, staff or clients? *"Staff, or both at once"* is the answer Daniel argues for: *"They'll be asked at every site this afternoon."*
- Gavin's reply depends on the draft. To A: *"Right. That's what I needed. Five o'clock, then."*

**Inject 6 (18:40): the voice note.** Hassan comes in with his personal phone: *"This came to my phone. It's Gillian's voice. I'm not touching anything till you've heard it."* The voice note (`phone-chat` voice message): *"Hassan, it's Gillian. The board's agreed to settle quietly. The adviser needs the first payment tonight. Details to follow. Keep it off email."*
- *"Call Gillian on her number in the crisis group."* / *"Reply to the note and ask her to confirm."* / *"If the board's agreed, pay it."*
- Calling: Gillian: *"I've sent nothing. I'm in the car with Anne-Marie. Report it."* Replying: the reply comes back at once, *"Yes it's me, hurry"*, and Hassan says: *"That's not how she writes. I'm ringing her."* Paying is refused by Hassan, who tells his near-miss story in two lines. Nobody pays on a voice note; the record shows what the player chose.
- Kai logs it and reports it. Ama: *"They're watching the news too. A crisis is perfect cover."*

**Inject 7 (day two, 09:00): restoration.** Owain at the `backup-recovery` console, three cards:
- **Clean rebuild, lifeline first:** the rota and ordering systems from Sunday's offline backup onto rebuilt servers, about 14 hours; Monday's changes re-keyed from paper.
- **Fast restore:** everything from last night's online snapshots, about 4 hours. The snapshots were taken while the attackers were inside.
- **Finance first:** payroll and finance first because Friday is payday; rotas in three days.
- Hassan: *"If payroll's not back, we pay everyone last month's amount by bank file and correct it next month."*
- Consequences: the fast restore is reinfected on day three (a short BE-16 scene: the rota system locks again); finance first leaves hospital sites on paper for three more days; the clean rebuild has rotas back by the evening.

**Inject 8 (day two, 14:00): the deadline.** The countdown reaches zero and a sample is posted (shown as a blurred screenshot). Tomasz: *"Now it's high risk for the people in those files. We tell them ourselves, today, with what to watch for."* Ama: *"My team's been up thirty-one hours."*
- People affected: *"Tell them directly today, with advice and a helpline."* / *"Wait for the ICO to tell us to."* / *"Say nothing. Nobody reads those sites."*
- The team: *"Send half home now, shifts from tonight, and thank them in the all-staff message."* / *"Push on until it's fixed."*

**Three weeks later (BE-16).** The board meets in the same room, with the pastries back. On screen: the ICO's letter (asking for the timeline and the decision log; if the notification was late, asking why); the insurer's position (proceeding, or disputed if the conditions were misstated); Gavin's email (trust kept, or a contract review); staff messages; the cost so far. Anne-Marie: *"Before we close, what will we do differently?"* The player picks one of five commitments, which becomes their reflection (see `assessment.md`).

### 5. Debrief (4 minutes)

- **(CP)** The debrief screen (BE-02), then Anne-Marie and Faisal at the board table.
- **"Show me where you wrote down why."** Anne-Marie plays the regulator and asks three questions. For each, the player answers by choosing an entry from their own decision log: *"When did you become aware?"*, *"When did you tell us, and why then?"*, *"Who decided about payment, and on what advice?"* A missing entry gets: *"There's nothing here. What would you tell the regulator?"*
- Faisal maps the decisions to the Code's five principles on a grid (A risk: the accepted supplier exception; B strategy: legacy systems and rebuild; C people: the voice note, staff first, wellbeing; D incident: containment, clocks, restoration; E assurance: what the board will ask for every quarter now).
- Per-outcome results: Secure, Developing or Not yet.
- **The line to remember:** *"Decide on advice. Write down why. Tell people what you know."*

### 6. Check (2 minutes)

- **(CP)** Six questions on The Lark (MG-20), drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the board's crisis card (BE-09): the ten questions, the first hour, the first day, the ransom card, and the organisation's own contacts and clocks (BE-05). Links to the NCSC's Cyber Governance Training and Board Toolkit.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| H1 Contain (02:13) | Isolate now on advice / file servers only / wait for the CEO / read the plan | LO3 (baseline) | Board stamp "NETWORK ISOLATED (AUTHORISED)" or "(ON ISM AUTHORITY)"; later status of the backups |
| H2 Who to wake | Any of nine | LO3, LO6 | Who is in the room at 06:00; a gap is felt later (no Tomasz means no breach advice until 09:30) |
| H3 First log entry | Reason chosen or typed / skipped | LO3 (baseline) | The entry reappears in the regulator's questions |
| D1 Depots (06:30) | Paper rotas / wait / personal email | LO3 | Lifeline status; Gavin's tone at 13:00; a new data risk on the board |
| D2 Insurer's question (08:15) | Truth with the risk entry / delay / "all covered" | LO2, LO5 | Insurer's position three weeks later |
| D3 ICO (09:30) | Notify today, in phases / wait for Friday / don't notify | LO4 | ICO clock row; the ICO's letter in the time skip |
| D4 Ransom resolution (11:00) | Engagement, payment and checks, in three sections | LO5 | The leak deadline, the decryptor in the pay branch, the second leak three weeks later |
| D5 Client and staff message (13:00) | Draft A, B or C; staff first or clients first | LO6 | Gavin's reply; staff questions on the pressure strip |
| D6 Voice note (18:40) | Call back on a known number / reply to the note / pay | LO6 | Gillian's answer; Kai's report; Hassan's story |
| D7 Restoration (day two) | Clean lifeline-first rebuild / fast restore / finance first | LO3 | Reinfection scene, or days more on paper, or rotas back that evening |
| D8 Deadline (day two) | Tell people directly / wait for the ICO / say nothing; shifts or push on | LO4, LO6 | Messages from affected staff; the team's state in the three-weeks-later scene |

No option shames the player. The worst branch (waiting, saying nothing, paying on a voice note) is stopped or softened by a colleague following the plan, which is itself the lesson: a good plan protects people on their worst night. The debrief frames each choice as "this is how boards get caught out; this is what the plan, the log and the clocks are for".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-24 Crisis decision board** | new (extends `command-board`) | The spine of the module. Config: title "LARKSPUR GROUP: CRISIS BOARD"; pre-seed "02:13 RANSOMWARE DETECTED: FILE SERVERS"; timeline entries keyed to globals (`isolation_authorised`, `crisis_team_convened`, `insurer_notified`, `ico_notified`, `ransom_resolution`, `client_briefed`, `voice_note_verified`, `restore_choice`, `individuals_notified`); status rows for lifeline services, email, personal data, press; countdowns for the ICO clock and the leak deadline; decision cards with options, advice and "whose call"; a reason prompt that writes each decision to the log; the practice mode for "Whose call? Which clock?" |
| `command-board` | existing | Already does the scenario title, pre-seeded entries, entries that stamp themselves when globals change, status rows and typed entries. MG-24 adds the cards, countdowns and injects |
| `esd-pushbutton` | existing | "ISOLATE NETWORK" in Ama's incident room: `authVar` set by H1, confirm modal, `completionActions` set `network_isolated` |
| `warranty-checklist` | existing (header fix needed) | The insurer's four conditions with compliant, arguable or breached verdicts (D2) |
| `coverage-decision-form` | existing (header fix needed) | The board's ransom resolution (D4); `completionActions` write `ransom_engage`, `ransom_payment`, `ransom_checks_complete` |
| `backup-recovery` | existing | The three restoration cards (D7), with `whenAvailable` text once Owain confirms the offline backup is clean |
| `ransomware-display` | existing | The ransom screen on Ama's laptop, seen not played |
| `phone-chat` | existing | The crisis group, the attackers' portal message as a screenshot, Hassan's voice note (TTS voice message) |
| `person-chat` | existing | Board scenes; video-call mode for Gillian at 09:30 (the "SECURE VIDEO LINK" bar must read "Larkspur Meet") |
| `notes` | existing | The incident plan, last year's board minute, the risk register entry, Daniel's drafts |
| MG-04 Voice calls | new (P2) | The 02:13 call, Leah, Gavin. `phone-chat` calls until it exists |
| MG-20 Knowledge check | new | Faisal's check question and the final check |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Their job and ours | Faisal (EX-01) | 40 seconds | Two-column card | none |
| The clocks | Faisal | 45 seconds | Timeline from 02:13 with four clocks | "When did the ICO's seventy-two hours start?" |
| Write it down | Faisal | 30 seconds | An annotated decision log entry | none (assessed in Apply) |
| If they ask for money | Faisal | 45 seconds | The four facts card; last year's board minute | none (assessed in Apply and the check) |
| Say what you know | Faisal | 30 seconds | The six-part message formula | none |
| Optional: what the Code asks | Faisal | 45 seconds | The five principles, one line each | none |
| Optional: the government's proposals | Faisal | 30 seconds | Three proposals and their status, dated | none |
| The regulator's questions | Anne-Marie (debrief) | 90 seconds | The player's own decision log | Three questions answered from the log |
| Optional video: "The first hour" | Recorded in engine (EX-02) | 90 seconds | Plays on the board room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Anne-Marie and Faisal:

1. The crisis timeline with every decision, its time and the reason the player logged (or a gap where none was logged).
2. The hook against Apply: the 02:13 decisions beside the 09:30 notification and the later log entries, as "deciding on advice, under uncertainty, and writing down why".
3. The regulator's three questions, answered from the log.
4. The Code grid: each decision mapped to principles A to E.
5. Per-outcome results.
6. The line to remember: *"Decide on advice. Write down why. Tell people what you know."*

## Variants

- **Micro-drill:** none in the catalogue, because board time is scarce. An optional "quarterly five" (BE-07, 3 minutes) can go in a board pack: five check items drawn from the bank, rotated each quarter, with the organisation's own ten questions.
- **Text route:** each inject as a short scene in text with the same options; the crisis board as an accessible table that updates after each decision; the decision log as a form; the ransom resolution and restoration choices as lists with the same trade-offs. The same record as the game (BE-03). About 15 minutes.
- **Facilitated session (the main mode, 60 to 90 minutes):** the board plays as Larkspur's board on one screen, with a facilitator at the HA-13 console who can pause, skip or swap injects and enter the group's choices (BE-15). Roles can be handed out (on-call director, chair, DPO, communications, finance), or the group decides together. Seven pause points:
  1. After the 02:13 call: *"Who here can switch our network off at 2am without asking anyone? Should they be able to?"*
  2. After the first log entry: *"Where would our decision log live if email and the shared drive were down?"*
  3. After the insurer's question: *"Who here has read our policy's conditions? Do we meet them today?"*
  4. After the ICO debate: *"What would make us wait, and what would waiting cost?"*
  5. After the demand: *"What is our ransom stance? If we don't have one, what would it be, and who must be in the room?"*
  6. After the voice note: *"How would our finance team check an instruction from one of us?"*
  7. After restoration: *"What are our lifeline services, and how long could each run on paper?"*
  The session ends with each director writing one commitment, which the facilitator collects as the exercise's action list (Code D.2 and D.4). A **reverse seniority** rule in the facilitator notes asks the most junior person to answer first at each pause. Printable inject cards give a paper fallback if the screen fails. Organisations can swap Larkspur's plan, stance and clocks for their own (BE-05), which turns the session into their annual exercise.
- **Replay and randomisation:** the entry route (a supplier's remote access without MFA; a service desk reset after a phone call, linking to role_03; a phishing link, linking to core_01); whether the chief executive can be reached; which data was taken (HR files, residents' details, school contacts); which client calls (a hospital trust, a council, a schools trust); and how the fake instruction arrives (voice note, video call or email). The annual edition updates the law cards (UK ransomware measures, the Cyber Security and Resilience Bill) and swaps in the year's lessons from published reviews.

## Alternative concepts

1. **The Board Pack.** A quarterly board meeting rather than a crisis. The player reads Ama's cyber report and the papers around it, and must find the five risks buried there (the accepted supplier exception, a restore that has never been tested, a ransom stance nobody wrote down, a lapsed exercise, a "green" measure that measures nothing) on a detective board with string. A time skip then shows the attack, and which questions would have changed it. Strong on Code principles A and E; less adrenaline.
2. **Ransom Room.** One scene, twenty minutes, one decision: the board in a room with five advisers (legal, insurer, NCSC liaison, communications, a negotiator), each holding one piece of the picture that only appears if the board asks the right question. The board votes, and three different futures play out with BE-16. Good for a board away-day, narrower in scope.
3. **Red Team Briefing.** Jo Fairweather presents the findings of an authorised test to the board (EX-06): the three routes she would use to reach the systems that matter. The board has a fixed budget and must decide which to fix this year, with the attack then replayed against their choices. Teaches risk appetite and strategy (Code A and B) through budget trade-offs; light on incident decisions.

## Art and audio

- **Rooms:** `room_zds_conference` redressed (Larkspur logo, canal view, wall screen for the board, water jugs, a pastry plate that empties as the hours pass and refills three weeks later); `room_security` with the isolation button; a new night-time kitchen conversation background for the hook (`room-pov-background` skill or a simple illustrated background).
- **Characters:** Faisal, Anne-Marie, Gillian, Ama, Tomasz, Hassan, Owain and Kai use their course art. New: Daniel Kwan (art and voice). Leah Brodsky and Gavin Ashworth are voice only. Lena appears by phone only.
- **UI:** MG-24's cards and countdowns in the board's style; the "Larkspur Meet" bar for video calls.
- **Voice:** about 35 lines for Faisal, 20 for Anne-Marie, 20 for Ama, 12 for Gillian, 10 each for Tomasz, Hassan and Daniel, 6 each for Leah, Gavin and Owain, 4 each for Lena and Kai. The fake voice note uses Gillian's voice with a flatter style; the debrief stresses that detection wasn't the defence, checking was. No voiced line prints a variable: times, counts, money and the player's title are on-screen text only.
- **Music:** low, steady and unhurried (BE-21), no countdown sirens.

## Pitfalls

- **Don't lecture senior people.** Every explanation is under a minute, and directors who know it can skip to the question.
- **Don't moralise about paying.** Assess the process. Paying is lawful in most cases; the module shows its limits, not a sermon.
- **Don't drift into technical detail.** No malware names, attack steps or tools. The board sees what a board sees.
- **Don't overload the law.** Three clocks matter most (the ICO, contracts, the insurer); the rest are on the card.
- **No fear without action.** Every alarming inject comes with advice in the room and a doable choice.
- **Don't teach deepfake detection.** The voice note is caught by calling back, not by listening for glitches (core_15).
- **Keep it current.** The ransomware proposals and the Cyber Security and Resilience Bill may change; the cards that mention them carry a "checked on" date.
- **Fictional names only in the game.** The insurer is Fellside (not sis03's Meridian), the client is Kirkmoor Hospitals; real organisations appear only in `concepts.md` and the facilitator notes.
- **Don't let the most senior voice decide everything in a group.** The facilitator notes use the reverse seniority rule.
- **Don't make it about blame.** The supplier exception was accepted by people doing their best; the lesson is to see accepted risks together.
