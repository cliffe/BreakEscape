# core_00 game design: First Day

## Concept

It's the player's first morning at Larkspur Group. They arrive at reception at 08:52, a little early, to collect a badge, a laptop and a desk in the Operations team. The morning is a guided walk round the building that doubles as the controls tutorial: Maureen signs them in, Precious shows them round, Ama and Kai explain what the security team is for, Owain sets up the laptop, and Leo waves from the next desk.

The module teaches through the most ordinary moment there is: being new. A new starter doesn't know who anyone is or what normal looks like, so the first lesson is the most useful one: you're allowed to ask. A message from a fake version of their new manager arrives before they've even signed in, and a fake payroll email is waiting in their brand-new inbox. Between the two, they learn the motto, the reporting route, and that the security team thanks people. The point a player should take to lunch: on day one, a fake version of their boss messaged them, and the receptionist spotted it in two seconds.

The Hook is chosen to be the one scam that only a new starter can meet (someone they have never met, claiming to be their manager), so it previews core_12's fake profiles without restaging core_02's "chief executive on a new number" scene.

## Setting and cast

- **Rooms:** reception and the badge gate (`room_reception`), the Operations floor with the player's desk (`room_office`), the kitchen with the motto poster (`room_break`), the security office (`room_security`) and the IT service desk (`room_IT`). Reception opens onto the office; the kitchen, security office and service desk lead off it. No new rooms.
- **Maureen Gallagher** (reception, 25 years) signs the player in, prints the badge and spots the fake message.
- **Precious Adeyemi** (Facilities and Building Security Manager, wheelchair user) leads the walk round. The route uses the lift and level floors; nothing about it is remarked on.
- **Ama Owusu** (Information Security Manager, the mentor) explains the few things everyone must know.
- **Kai Murray** (security analyst) shows what happens to a report, and thanks the player in the team chat.
- **Owain Jenkins** (IT Service Desk Lead) hands over the laptop and runs the practice.
- **Leo Brennan** (desk neighbour) welcomes the player and admits he nearly fell for the payroll email in his own first week.
- **Lena Fischer** (the player's manager) appears twice, both on screen only: as a fake profile on the player's phone, and as herself in the team chat. **Gillian Marsh** (chief executive) posts one welcome message in the team chat, on screen only.
- **Optional cameos:** Tomasz Wiśniewski (DPO) at the kettle; Martin Fletcher (Sales Director) passing through reception. No new characters.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 0. Before the game (outside the 10 minutes)

- **(CP)** The player sets a name and an avatar in the existing preferences modal. The course limits avatars to its workplace set (`validSprites`; see the proposed avatar set in `README.md`).
- **(CP)** The course title screen (BE-20) shows the organisation's logo and "First Day", then one choice: **Start** or **Use the text version** (BE-03), with a **Settings** button (BE-04) that works before any sound plays. A line under them: *"Nothing in this course will ever ask for your real password or bank details."*
- **(CP)** Before the first scene, a short notice, **What we record when you play** (the suggested text in `features/assessment_and_evidence.md`, section 11): what is recorded, who sees it, that choices are practice and never used for discipline, and where "My data" is. One button: **Got it**. It appears once per learner for the whole course, here.

### 1. Hook: "Message request" (1 minute)

- **(CP)** 08:52, reception. Maureen is on the phone ("Two minutes, love, I'm on with the depot") and waves the player to wait. The first tutorial step (BE-20) is movement: walk to the desk.
- **(CP)** The player's own phone buzzes (a phone NPC with a `timedMessages` arrival, shown in a generic, unbranded networking-app skin; MG-05 later). A message request from **"Lena Fischer, Operations Manager at Larkspur Group"**: the player's new manager, whom they have never met, with a friendly profile photo.
  > *Welcome to the team! So glad you're joining us. Before you're in, can you send me your personal mobile and email? I'll add you to our team group so you don't miss anything.*
- The tutorial's second step (BE-20) points at the phone: *"Your phone has a new message. Open it."* After that the player can do anything: send the details (the reply is pre-filled with made-up ones; the game never uses real details), reply warmly without them (*"Thanks! I'll come and find you when I'm in."*), ignore it, tap through to the profile (a week old, nine connections), or walk over to Maureen and talk to her (talking is the third tutorial step).
- What they do in the next 40 seconds is the **baseline** for C00-B1. Then Maureen hangs up and looks over:
  - **Showed her:** *"Lena? On one of those sites? She's not on any of them. Says she gets enough messages at work."* / *"They watch for people posting about new jobs. Don't send anything. We'll show Ama, she collects these."*
  - **Sent the details:** the thread answers at once: *"Perfect, thanks! I'll text you later about something urgent. Keep it between us for now."* Maureen, seeing the player's face: *"Who's that? Lena? She's not on there, love. Don't fret, it happens to half our new starters. We'll tell Ama."*
  - **Replied without details, or ignored it:** *"Everything alright? You looked at that phone like it owed you money."* The player can show it or say it's nothing. If they keep it to themselves, Ama gives a second chance later.
- Nobody is told off. Maureen's last line in every branch: *"When something's odd, you stop and ask someone who'd know. Ama will give you the posh version."*

### 2. Learn on the move: the badge and the walk round (2 minutes)

- **(CP)** Maureen prints the badge (the player's chosen name and photo appear on it, on screen only) and hands it over. One line, no more: *"Wear it inside, put it away when you leave, and don't lend it. Not even to me."* The badge lands in the inventory, and the tutorial's next step is *"Open your inventory and look at your badge."*
- **(CP)** The player taps the badge on the gate (a keycard door) and meets Precious on the other side: *"Precious Adeyemi, Facilities. Doors, badges, and anyone who props the fire door open. Follow me."*
- Precious leads the way to the security office, waiting at each door (event mappings with `patrolOverride` and barks). The walk teaches the rest of the controls in context: click to move, interact with an object (the motto poster in the kitchen), open the task list (desktop). Three short stops:
  - **The Finance door.** The badge doesn't open it. *"Your badge won't open that one. You get the doors your job needs. Same goes for files."* (A light preview of need to know; nothing assessed.)
  - **The kitchen poster** (EX-04): *Pause. Check. Report.* Precious: *"Ama's motto. You'll hear it a lot."*
  - **The side door to the smoking shelter**, propped open with a fire extinguisher. *"That door's alarmed. It is not a doorstop. If you see it propped, close it and tell me."* The player can close it (Precious: *"Thank you. You'll do."*). Recorded as a core_10 baseline, not assessed here.
- **Optional:** Tomasz at the kettle: *"Tomasz, DPO. Behind every row in a spreadsheet is a person. Remember that and we'll get on."*

### 3. Learn: "What we're for", with Ama and Kai (2 minutes)

- **(CP)** In the security office, Ama opens differently depending on the Hook:
  - **Showed Maureen:** *"Maureen says you brought her a fake Lena before you'd even got your badge. Thank you."*
  - **Sent the details, then Maureen stepped in:** *"Maureen says a fake Lena found you this morning. Don't worry. They try it on every new starter."* Then one line of what to expect: *"If someone texts your mobile claiming to be a colleague, check with us first."*
  - **Kept it quiet:** *"A few new starters had a message from a fake 'Lena' this morning. If you did, I'd love to see it."* (Second chance to show it: recorded as Developing.)
- **(CP)** Ama explains in four short chunks (EX-01, about 25 seconds each, one visual aid each, BE-08). The player can say *"I've done security training before"*; Ama replies *"Then you can tell me the motto,"* and goes straight to the check question.
  1. **Why us?** Aid: five icons (an inbox, a key, a spreadsheet, a pound sign, a badge). *"Most attackers are criminals after money. They don't want you. They want what you can open."* / *"Most attacks start with a message, a call or a stolen password. Usually while you're busy."*
  2. **The motto.** Aid: the top of the reference card. *"Pause when it's unexpected, urgent, secret, or asks for money, data, codes or access."* / *"Check through a route you already trust. The directory, a colleague, The Lark."* / *"Then report it. Even if you're not sure."*
  3. **How to report here.** Aid: a screenshot of the organisation's own mail toolbar with the Report button ringed, and the contacts from the reference card (BE-05, on screen). *"Emails: the Report button. Anything else: ring us. The number's on the card."*
  4. **No blame.** No aid; Ama turns from the screen. *"My first security job, I typed my password into a fake page."* / *"I told my boss, bright red. She said thanks, and we fixed it in ten minutes."* / *"So if you slip up, tell us fast. You'll get a thank you, not a telling-off."*
- **(CP)** Kai swivels round from the report queue (EX-05 light, 20 seconds; aid: the queue board with "pull from all inboxes" and "block sender"): *"Your report lands with me. If it's bad, I pull it from every inbox and block it."* / *"Nights and weekends, our monitoring partner does the same. Someone's always there."*
- **(CP)** Ama's check question (MG-20 single item, opened by BE-19): *"Something feels off, but you're not sure. What do you do?"* A wrong answer brings back chunk 2 in one line, then the question again.
- **Sticky choice** (EX-01 pattern): *"What should I actually do?"* always gives the motto and the route in three lines.

### 4. Practise: Owain's desk (1.5 minutes)

- **(CP)** At the service desk: *"Laptop, charger, and one rule: ask us first. We'd rather help than clean up."*
- **(CP)** **The Report button.** The laptop's work desktop (MG-27) shows four icons: the inbox, chat, The Lark and Settings; the tutorial step is *"Open your inbox from the desktop."* Owain: *"I've sent you a test email. Find the Report button and give it a go."* The inbox (MG-01) opens with one message, "Test: please report me". Reporting it brings Kai's chat: *"Got your test. Button works!"* Owain: *"That's all reporting is. One click."* If the player can't find it, Owain points (Developing).
- **(CP)** **A passphrase** (MG-08, light). *"Your password manager needs one good passphrase. Three random words. Roll some."* The builder deals random word tiles from a game word list (no free typing); the player can re-roll until they like it, and a meter shows how long it would take to guess. *"Long beats clever. The manager remembers everything else."* Nothing typed leaves the game.
- **(CP)** **MFA** (MG-07, light). The player signs in on a pre-filled page; their phone shows a prompt asking for the two-digit number on screen. They enter it and approve. Owain: *"Only approve when you've just signed in yourself. Now I'll send one you didn't ask for."* A second prompt arrives with no sign-in. **Deny** offers **Report this**. Owain: *"Spot on. Out of the blue means no."* If they approve it: *"That's the one to say no to. Deny it and tell us."* Immediate feedback; recorded for core_03's baseline.
- **Settings.** Owain: *"Display settings, while I'm here. Bigger text? Captions?"* Opens the game's settings (BE-04). Optional.

### 5. Apply: "Welcome to Larkspur!" (1.5 minutes)

- **(CP)** Leo at the next desk: *"You're next to me! Welcome. Don't worry, week one's mostly lanyards and passwords."* The real Lena's chat (on screen): *"Welcome! Stuck in a meeting till 11. Have a look round The Lark, and Leo will show you the ropes. PS: I'm not on any social sites, so if 'I' message you on one, it isn't me."* The task list shows one task: **Check your inbox.**
- **(CP)** The inbox (MG-01) has three new messages:
  1. **Lena Fischer**, "Welcome!": genuine, with a link to The Lark's new starter page.
  2. **IT Service Desk**, "Your laptop is ready": genuine, with the service desk's contacts (from BE-05).
  3. **"Larkspur People Team"** from a lookalike address (generated per game, for example `people@larkspur-payroll.co`, and checked as unregistered): *"Welcome aboard! To make sure your first salary arrives on time, confirm your bank details by 17:00 today."* Button: **Confirm my details**.
- The player can report it, ignore it, delete it, or open the link. The link opens a form in the inbox's browser panel, **pre-filled with made-up details** and a **Confirm** button. The game never asks for real data.
- Consequences, inside the module:
  - **Reported:** Kai's chat a few seconds later (on screen, not voiced): *"Thank you! That one went to every new starter this month. Pulled from all their inboxes, and the fake page is blocked."*
  - **Opened the form, then closed it:** nothing happens; Leo glances over: *"The payroll one? I got that in my first week. Nearly did it, then reported it."* Reporting now is thanked the same way.
  - **Confirmed the form:** a "Thanks!" page. A minute later Leo spots it: *"Happened to me too. Report it now, honestly. Kai's lovely about it."* If the player reports it: Kai: *"Thanks for telling us so fast. I've asked payroll to lock your bank details for now. That's exactly what we needed."* If they don't, the debrief shows the payroll team catching a change request in the player's name the following week, and says what a report would have changed. No scolding in either case.
- **(CP)** Gillian's real message lands in the team chat as the player finishes (on screen only; the organisation can replace it with its own leader's words): *"Welcome to everyone starting this week. None of us will ever message you for favours, codes, gift cards or personal details. If 'we' do, it isn't us: tell Ama's team."*

### 6. Debrief (30 seconds)

- **(CP)** The debrief screen (BE-02), "Your first morning", then one line from Ama in the conversation panel.

### 7. Check (1 minute)

- **(CP)** "Ama's welcome quiz" opens on The Lark (MG-20): five items drawn from the bank in `assessment.md`, at least one each on the motto, the route, being unsure and reporting a mistake.

### 8. Reference and the course map (30 seconds)

- **(CP)** The Lark (BE-09) shows the reference card with the organisation's own contacts, a "Who's who" page with the cast, an "About your training record" page, and the learner's course map: the modules assigned to them with due dates (HA-03), each with its working title and the colleague who leads it.
- **(CP)** One last task on the list: **Find the number you'd ring out of hours.** The player finds it on the reference card or the contacts page and pins the card (C00-B7). If they look in the wrong place for a while, The Lark's search box suggests "reporting".
- **(CP)** The end screen (BE-20): *"First day: done."* and the next module on the learner's map.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The fake "Lena" message request (Hook) | Show Maureen / reply without details / send the details / ignore it | LO3, LO4 (baseline) | Maureen's line differs; sending the details brings a "keep it between us" reply, then Maureen steps in; keeping quiet gets a second chance from Ama |
| Show the message to Ama | Show it / say nothing | LO4 | Ama thanks the player; Kai adds it to the "welcome scams" board shown in the debrief |
| The test email | Report it / ask Owain where the button is | LO1, LO4 | Kai's "button works" in the team chat |
| An MFA prompt they didn't start | Deny and report / approve | LO3 | Owain's immediate feedback; recorded for core_03 |
| The fake payroll email (Apply) | Report / ignore or delete / open and close the form / confirm the form | LO3, LO4 | Kai's thank-you and the inbox pull; or Leo's nudge and a later report; or the debrief's "next week" scene |
| Their own slip, if they confirmed the form | Report now / report after Leo's nudge / say nothing | LO4, LO5 | Kai's thank-you and the bank details lock; or the debrief scene, framed as "what a report would have changed" |
| The propped side door (optional) | Close it / walk past | (core_10 baseline, not assessed) | Precious's thanks |

No option shames the player. The worst branch (sending the fake "Lena" their details, confirming the form and saying nothing) still ends with colleagues helping and a debrief that says what reporting would have changed.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| `person-chat` | existing | Maureen, Precious, Ama, Kai, Owain, Leo; Ama's chunks use BE-08 aids |
| `phone-chat` | existing | The fake "Lena" message request (a contact with `timedMessages`) and the team chat with the real Lena, Kai and Gillian. MG-05's chat-app skins later |
| MG-27 Work desktop | new (MVP) | The laptop as one launcher for the inbox, chat, The Lark and Settings; the tutorial's desktop steps |
| MG-01 Inbox | new (MVP) | Minimal use: the test email, then three messages and a pre-filled form behind the fake link |
| MG-08 Password manager and passphrase builder | new (MVP) | Light: word tiles, re-roll, a guess-time meter, store in the manager |
| MG-07 MFA prompts | new (MVP) | Light: one prompt to approve with number matching, one to deny and report |
| MG-20 Knowledge check | new (MVP) | Ama's single check question and the five-item quiz |
| `notes` / `lab-workstation` | existing | The Lark's pages until BE-09 exists |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Spotting the fake Lena | Maureen (in the Hook) | 20 seconds | The message and the profile behind it | none (baseline only) |
| What we're for: why us, the motto, how to report here, no blame | Ama (EX-01) | 100 seconds | Five icons; the reference card's heading; the organisation's Report button and contacts | "Something feels off, but you're not sure. What do you do?" |
| What happens to a report | Kai (EX-05 light) | 20 seconds | The report queue board | none |
| One rule from IT | Owain | 10 seconds | none | the Practise tasks |
| Optional video: "Welcome to the course" | Recorded in engine (EX-02) or presented (EX-03, see `DECISIONS_PENDING.md` D7) | 60 seconds | Plays on The Lark's home page (MG-21) | none |

## Debrief

Shown on BE-02 as "Your first morning", then one closing line from Ama:

1. **The fake "Lena" message:** what the player did, what good looks like (send nothing; show someone who'd know; tell the security team), and the three things that gave it away (someone you've never met, on a site you weren't expecting, asking for personal details and to keep it quiet). The real Lena's "PS" sits beside it, and one line says what personal details are used for (texts and calls pretending to be colleagues: core_02).
2. **The test report and the MFA prompt:** a tick for each, with the one-line rule ("one click"; "out of the blue means no").
3. **The fake payroll email:** what the player did, what checking would have looked like (the HR system on The Lark, or asking Leo), how HR really asks for bank details (organisation slot), and what the report did (pulled from every new starter's inbox).
4. **Before and after:** the message in the Hook beside the email in Apply, the same habit in two places.
5. **Per-outcome results** (Secure, Developing, Not yet), and Kai's "welcome scams" board, with the player's reports highlighted.
6. **The line to remember:** *"Pause. Check. Report. Reporting is never wrong."* Ama, voiced: *"That's day one. If anything feels odd, you know where we are."*

## Variants

- **Micro-drill:** none. core_00 is taken once (and by existing staff when they first join the course). Its reporting moment is practised again in every module.
- **Text route:** the morning as an interactive story (BE-03). The message request arrives as a quoted message with the choices *Show Maureen*, *Send my details*, *Reply without them*, *Look at the profile*, *Ignore it*. Ama's chunks are text with each visual aid described in alt text. The inbox is a list with a **Report** action on each message; the form behind the link is shown as text with its made-up details. The passphrase builder offers three random words with *Use these* and *Roll again*. The MFA prompts are text with *Approve* and *Deny*. The quiz and The Lark pages are accessible HTML. Same decisions, same record. About 7 minutes.
- **Facilitated session:** for an induction group on their first day, run by HR or the security team (BE-15, HA-13), one screen, about 30 minutes. Pause points: after the Hook ("Has anyone had a message like this since accepting the job?"); after Ama ("What might stop you reporting something here, and what would help?"); after the payroll email ("How do you really change your bank details here?", where the facilitator shows the real route). If the organisation's own security lead runs it, they can introduce themselves in place of Ama's chunk 4.
- **Replay and randomisation:** the Hook message comes from a small bank of new-starter approaches (a fake manager wanting your personal mobile; a fake "HR" asking you to fill in a starter form at a link; a fake "IT" asking you to install the company app from a link before you arrive), and so does the Apply email (bank details for payroll; "finish your IT induction: sign in here"; "pay £5 for your parking permit"). Domains are generated per game. Existing staff get the "new badge day" opening (`README.md`, open question 3). There is no annual edition; content is refreshed when facts change (for example, a reporting service is renamed).

## Alternative concepts

1. **First Day Bingo.** Maureen hands the player a bingo card with the badge: nine squares of things every new starter should find on day one (the Report button, the security team's number, the motto poster, the DPO's name, the propped door, who to ask about software, the reference card, the fake "Lena", the out-of-hours number). Each square is found by exploring and talking, and fills with a one-line explanation. A full house unlocks the course map. It's a scavenger hunt, so it's fun to explore and good at teaching where things are, but it gives less control over the order of teaching than the guided walk.
2. **Groundhog Morning.** The first morning loops. Each time the clock reaches 11:00 the day rewinds to 08:52, until the player has found the five things a new starter needs (the motto, the route, the no-blame promise, the reference card, the colleague to ask). Characters notice ("Déjà vu? You look like you know where the kitchen is."), and the fake message and payroll email play out differently as the player learns. A memorable mechanic and a good lunchtime story. The risk: a loop can feel like punishment, so each loop must add, never take away, and it never loops because of a "wrong" choice.
3. **Shadow Kai.** The player spends the morning in the security office with Kai, watching reports arrive from around the building: Leo's suspicious email, Maureen's odd caller, a slip someone owned up to. Each report shows what it let the team do. Then Kai sends them to their own desk, where the payroll email is waiting. It sells the "report it" habit through the receiving end, though it shows less of the building and fewer of the cast.

## Art and audio

- **Rooms:** existing reception, office, kitchen, security office and IT room. Larkspur's own conversation backgrounds come later (`room-pov-background`); m01's office set works until then.
- **Characters:** first appearances of Maureen, Precious, Owain, Ama, Kai and Leo, so their PixelLab art (bust, talk sheet or visemes, 8-direction walk) is first needed here and shared with many modules. Precious's walk cycle uses a wheelchair (a custom PixelLab animation set, not the standard walk). Gillian and Lena appear on screen only. Tomasz and Martin are optional cameos.
- **Props:** a badge printer on the reception desk, a card reader on the gate, the motto poster in the kitchen, the propped side door with an extinguisher, a laptop and charger on the service desk. Most exist in `assets/objects/`; the motto poster is new artwork (EX-04).
- **New UI art:** the course title screen and end screen (BE-20) in the course's own style; The Lark's home page, course map, who's who and reference card (BE-09); the printed badge showing the player's name and avatar.
- **Voice:** about 20 lines for Ama, 12 for Owain, 10 for Maureen, 8 for Precious, 6 for Kai and 5 for Leo. **No voiced line prints a variable**: Maureen never says the player's name (it's on the badge), and nobody says the organisation's name ("here", "this place" instead). Kai's thank-you with counts, Lena's and Gillian's messages are on-screen chat, not speech.
- **Music:** a calm morning-office bed from the workplace set (BE-21), not the campaign's spy playlist.

## Pitfalls

- **Turning day one into a lecture.** Every topic except the motto and the route is a one-line preview. If a line is teaching phishing or passwords in depth, cut it and point to core_01 or core_03.
- **A gotcha in the first minute.** Answering a friendly message from your new "manager" is common and human. Maureen's warmth, the second chance from Ama and the debrief's framing make sure nobody's first experience of the course is being caught out.
- **The wrong tone on screen.** The title screen, tutorial and avatars must not say "Hacktivity Games", type terminal-style, or offer hooded hackers and spies (BE-20, proposed avatar set). This is the first impression for staff who may never have played a game.
- **A generic reporting route.** The module is pointless if the route on screen isn't the organisation's own. A filled-in reporting slot (BE-05, HA-11) is an item on the setup checklist (HA-26), so the module can't be assigned without it.
- **Promising what the organisation won't deliver.** The no-blame message is only credible if the organisation backs it. The setup checklist (HA-26) should ask the organisation to confirm a short statement ("honest mistakes reported quickly are not disciplined"), shown on The Lark; if it won't, Ama's chunk 4 needs rewording with the organisation.
- **Asking for anything real.** The passphrase is built from game word tiles; sign-in pages and the payroll form are pre-filled with made-up details. Say so on the title screen.
- **Locking anyone out.** As the first module, it must work fully by keyboard and as the text route, with settings visible from the first screen and no timer that matters.
- **Making the security team look like police.** Ama and Kai thank, help and explain. The notice before the first scene and The Lark's "About your training record" page say plainly what is recorded, who sees it, and that choices are never used for discipline.
