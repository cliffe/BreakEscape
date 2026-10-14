# core_14 game design: Notice Period

## Concept

It is Ross Whitaker's last week. Ross is a senior account manager in Sales, nine years at Larkspur, generous with the biscuits, and off on Friday to a competitor. The player is an operations coordinator whose desk sits between Operations and the Sales pod, with an ordinary week of work to get through: a delivery schedule, a rota, a supply order, and on Friday the job of moving Ross's customers' delivery contacts across to his successor.

The module is a week compressed into about six minutes of play, Monday to Friday, with a title card for each day (BE-16). Small things happen in it. Some matter: a copy running on Ross's screen, a favour he asks, a stranger on a messaging app with an offer, a colleague who wants to borrow a login. Some don't: Nadia from Operations is in at seven, printing, taking calls in the stairwell and visiting HR, and Wes from Sales has decided she's leaving with Ross and taking the client list with her. The player's job is not to solve anything. It is to keep their own access to themselves, report what is offered to them, notice what they actually see, and pass the facts to the right person while staying fair to everyone, including the colleague the whole office is whispering about.

The twist players talk about afterwards is the rumour map in the debrief: the office lit up desk by desk as Wes's theory travelled (or didn't, depending on the player), beside what was really going on.

## Setting and cast

**Places** (existing rooms):

- **Operations and the Sales pod** (`room_office`): the player's desk, Nadia's desk, Ross's desk at the end of the Sales pod with a second screen facing the walkway, and the shared printer by the door.
- **The kitchen** (`room_break`): Monday's "Coffee with Security", Wes's theory at lunch, Friday's leaving drinks.
- **Mei Lin's quiet room** (`room_meeting`): where concerns can be raised in person.
- **The stairwell** (`hall_1x2gu`): where Nadia takes her calls.
- **Home, Wednesday night:** a phone-only scene over a dark title card, or core_09's `room_home_office` if it has been built.

**Recurring cast** (from `03_WORLD_AND_CAST.md`):

- **Ama Owusu** (Information Security Manager) and **Mei Lin Zhou** (HR Business Partner) run Monday's coffee session and take concerns. Mei Lin carries most of the fairness and support teaching; Ama carries logins and outside offers.
- **Tomasz Wiśniewski** (DPO) explains what the customer list really is.
- **Leo Brennan** (desk neighbour) needs a login on Monday morning.
- **Martin Fletcher** (Sales Director) is Ross's manager. He gives the leaving speech and, if the concern was raised, has a quiet, honest moment with the player.
- **Kai Murray** (security analyst) and **Owain Jenkins** (IT Service Desk Lead) appear by chat and phone. **Lena Fischer** (Operations Manager) sets the work by chat and is one of the routes for a concern.

**New characters:**

| Id | Name | Who | Age and look | Notes |
|---|---|---|---|---|
| `ross_whitaker` | Ross Whitaker | Senior Account Manager, Sales; on his notice period | 40s, white English, broad ex-rugby build, rolled shirtsleeves, a lanyard crowded with client event badges | Liked by everyone. Passed over for promotion last spring. Joining "Stonecrop Facilities". Not a villain: he has talked himself into it ("my contacts") |
| `nadia_haddad` | Nadia Haddad | Operations Scheduler, fifteen years at Larkspur | 50s, British Lebanese, reading glasses on a beaded chain, cardigan | The false lead. Her father is in hospital this week; she comes in early to leave by four, and has been to HR about compassionate leave |
| `wes_pickering` | Wes Pickering | Sales Coordinator | 30s, white English from Hull, always has a true-crime podcast in one ear | Not malicious, just loves a theory. He is the rumour |
| `talent_partner` | "Alex, Talent Partner" | An unknown contact on a messaging app | No art: a smiling stock-style avatar | Text only, never voiced |

Names for the competitor ("Stonecrop Facilities") and the Speak Up provider are fictional defaults; the competitor name needs a clash check before release.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Can I just use yours?" (1.5 minutes)

- **(CP)** Title card: *Monday, 08:55.* The player sits down at their desk. The work task bar shows Monday's job: send the delivery schedule (BE-18).
- Leo rolls his chair over:
  - Leo: *"Morning. Disaster. My password expired over the weekend and the reset link's broken."*
  - Leo: *"My report's due at ten. Can I just use yours? Two minutes. I'll be careful."*
- **Baseline (C14-B1).** The player chooses:
  - *"Can't, sorry. Let's ring Owain, he'll have you back in no time."* The player rings the service desk (`phone-chat`, MG-04 later). Owain: *"Give me three minutes, Leo. And thanks for not swapping logins, you two."*
  - *"Sorry, no."* Leo sighs and goes to find Owain himself.
  - *"Go on, I'll log in for you."* The player types their password and slides the laptop over.
  - *"It's on the sticky note under my keyboard."*
- If the player's login was used, a consequence lands on Wednesday morning (see Decisions and consequences).

### 2. Learn: "Coffee with Security" (2.5 minutes)

- **(CP)** Title card: *Monday, 09:30.* Ama and Mei Lin run their monthly drop-in in the kitchen (EX-01, BE-08). The opening line depends on the hook:
  - Helped Leo to the service desk: Ama: *"Owain says you sent Leo to him instead of lending your login. That's most of today's talk done."*
  - Lent the login: Ama: *"Leo's back in, which is good. Let's talk about how, because that's most of today's talk."*
- Five short chunks with aids:
  1. **Ama, "It's mostly ordinary"** (30 seconds). Aid: a spectrum bar from accidental to careless to deliberate, with three Larkspur examples on it: an email to the wrong Sam, a borrowed login, a leaver taking the customer list. *"Insider risk sounds like spies in the stationery cupboard. Mostly it's people like us having a busy day."*
  2. **Ama, "Your login is you"** (20 seconds). *"Whatever happens on your login happens in your name. There's always another way in. It's called Owain."*
  3. **Ama, "Offers"** (20 seconds). Aid: a mocked-up message with "screenshot, report" stamped on it. *"Now and then, someone outside offers staff money for access. If it's you: don't reply, screenshot it, send it to us. You won't be in trouble."*
  4. **Mei Lin, "Notice, note, pass it on"** (40 seconds). Aid: the routes card (security team, manager or HR, Speak Up line, DPO) with the organisation's own details (BE-05). *"If something worries you, notice it, write down the facts, and pass it on. Then let us do the rest."* And: *"Don't go digging, don't confront anyone, and don't share it round the office. You don't have to be sure. You do have to be fair."*
  5. **Mei Lin, "A kind word first"** (15 seconds). *"And sometimes a colleague's just having a hard week. That needs a kind word, not a report."*
- Check question (MG-20): *"You see a colleague copying the customer list to a folder called 'personal'. What do you do first?"* (Write down what you saw and tell the security team or your manager.)
- **Skip:** *"I've done this before."* Mei Lin: *"Then you'll fly through this one."* Straight to the check question; a wrong answer brings the chunks back.
- **Optional topics** in the hub, each under a minute: *"What happens after I raise something?"* (Mei Lin: it's looked at fairly and confidentially; you may not hear the outcome; nobody is in trouble for an honest concern); *"Doesn't IT just watch everything?"* (Ama: *"Our tools see files moving. They don't see why. People do."* with the organisation's monitoring notice); *"What's whistleblowing, then?"* (Mei Lin, see Explainers).

### 3. Practise: "Fact or Feeling?" (2.5 minutes)

- **(CP)** Ama deals a deck of cards on the kitchen table: *"Quick game. Eight cards. For each one, what would you do?"* (MG-20 practice mode, instant feedback, getting harder).
- Each card is a one-line situation with a small picture. The player chooses one response: **Security team**, **Manager or HR**, **A kind word**, **Help them to the proper route**, or **Nothing to report**. Some cards accept two answers.
  1. *"Sam's been in early every day this week."* Nothing to report (a kind word if they seem stressed).
  2. *"A colleague asks for your login because theirs has expired."* Help them to the proper route (the service desk).
  3. *"Someone on a networking site offers you £5,000 for 'a chat about your company's systems'."* Security team.
  4. *"A leaver is forwarding a folder of customer contracts to a personal email address."* Security team, or their manager.
  5. *"A colleague is crying in the stairwell."* A kind word; their manager or HR if you're worried about them.
  6. *"Someone in the kitchen says Dan's been sacked for stealing."* Nothing to report, and don't pass it on.
  7. *"A contractor asks you to export the full customer list because 'their access hasn't come through yet'."* Help them to the proper route, and tell the security team if they push.
  8. *"A colleague's name is signed in on the shared PC while they're on holiday."* Security team.
- **The fairness card** comes last: *"Which is the fairest way to describe what you saw?"*
  - *"Ross is stealing our clients."*
  - *"Ross is up to something. Everyone thinks so."*
  - **"Tuesday 17:40: Ross's second screen showed 'Customer master 2026.xlsx' copying to a folder called 'RW personal'."**
  - *"Wes says Ross and Nadia are taking the client list."*
- Two wrong answers in a row bring Mei Lin back with one line: *"What did you actually see? Start there."*

### 4. Apply: "Ross's last week" (6 minutes)

**(CP)** Each day opens with a title card and a line on the work task bar (BE-18): Tuesday, finish the schools rota; Wednesday, the quarterly supply order; Thursday, tidy the customer portal's delivery contacts; Friday, move Ross's customers' contacts to his successor. Everything below happens around that work, unannounced. Facts the player notices are added to their Notepad with the time (the `#add_note` fix), and become the fact chips in the concern form.

#### 4a. Tuesday (2 minutes)

- **07:50, the printer (Nadia).** The player arrives early to finish the rota. Nadia is at the printer with a thick document. She gathers it quickly, looks flustered and goes to the stairwell, phone already at her ear. One page is still in the printer tray.
  - The player can say *"Morning! You OK?"* as she passes; Nadia: *"Fine, fine. Long week."*
  - The player can **examine** the page left in the tray (`examine`). It is a hospital discharge plan for a Mr K. Haddad. Reading it records the player as having looked into a colleague's private papers.
- **12:30, the kitchen (Wes).** Wes, mid-sandwich:
  - Wes: *"Have you noticed Nadia? In at seven, printing stuff, whispering on the stairs. In with HR twice."*
  - Wes: *"Reckon she's off to Stonecrop with Ross. Bet they're taking the client list between them."*
  - The player chooses (C14-B3): *"Could be. She looked shifty this morning."*; *"Don't know. Maybe she's got stuff going on."*; *"If you've actually seen something, tell Ama or Lena. Not the kitchen."*; or says nothing and leaves.
  - Each choice sets how far the rumour travels (the rumour map): adding to it lights up six desks by Thursday and the rumour reaches Nadia; saying nothing leaves Wes to spread it to two; declining stops it at Wes.
- **17:40, Ross's desk.** Walking past the Sales pod, the player can see Ross's second screen. Examining it (`examine`, a close-up of the screen) shows a copy window: *Copying "Customer master 2026.xlsx" to "RW personal (cloud)", 64%.* Ross, cheerful:
  - Ross: *"Nine years of stuff. You'd not believe the rubbish in here."*
  - The player chooses (C14-B4): carry on home (the fact goes in the Notepad); *"Isn't that the customer list? I don't think that can go to a personal drive"* (Ross: *"They're my contacts, mate. I'm the one who took them to lunch."*); wait until he's gone and look through his desk drawer and files (`container`); or take a photo of his screen on their phone.

#### 4b. Wednesday night (1 minute)

- **Wednesday 09:15** (only if the player lent Leo their login on Monday): Kai messages: *"Your account opened the HR shared drive on Monday at 09:12. Was that you?"* It was Leo, clicking the wrong shortcut. Harmless, but on the player's record until it's explained. Ama, later: *"That's why your login is you."*
- **21:30, at home.** A message from an unknown contact on a messaging app (MG-05), text only:
  - *"Hi! Saw you work at Larkspur Group. Quick one: we pay people at companies like yours for remote access to their systems. You'd get 25% of whatever we make. Could be six figures. Totally anonymous, nobody would ever know. Interested?"*
  - The player chooses (C14-B5): screenshot it and send it to the security team without replying; reply *"Not interested"*, then decide whether to report; block and delete it; or reply *"How would it work?"* (the contact answers with nothing technical: *"Easy. We'll talk you through it. 24 hours to decide."*, then waits).
- **02:10.** The phone buzzes with sign-in approval prompts, one after another (MG-07), as happened after the real 2025 approach.
  - The player chooses (C14-B6): deny them all and ring the 24/7 service desk; deny them and report in the morning; or approve one to make it stop.

#### 4c. Thursday (1.5 minutes)

- **08:30.** Kai's chat (text): *"Saw the prompts at 02:10. We've reset your password and paused your account overnight, just in case. Thanks for the screenshot: the same message went to a few others here."* If the player approved a prompt, Kai's message is about the sign-in it let through, and his tone is the same: thanks for telling us, here's what we've done.
- **11:00, Ross's favour (C14-B7).** Ross at the player's desk:
  - Ross: *"Do us a favour? Export my accounts from the portal, with the contract values. For my handover."*
  - Ross: *"Send it to my personal email. My work one's playing up."*
  - The player chooses: *"Let's ask Lena what your handover needs. It'll go in the shared folder for whoever takes over."*; *"I'll send it to your work email"*; or *"Sure"* (the export goes to his personal address).
  - If the player declines, Ross pushes once: *"Come on. Larkspur's been overcharging the council for years. If anyone asks, I'm a whistleblower."* This opens Mei Lin's optional "whistleblowing or leaking" explainer if the player goes to her.
- **Raising the concern (C14-B8)**, available from Tuesday 17:40 until the end of the module. Routes: Ama in the security office, Mei Lin in her quiet room, a message to Lena, Martin (Ross's manager), The Lark's "Raise a concern" page (MG-09 in concern mode), or the Speak Up line. Mei Lin, if the player comes to her:
  - Mei Lin: *"Thank you. What did you see, exactly? Times help."*
  - Mei Lin: *"I can't tell you what happens next, but we'll look at it properly. And it stays with us."*
  - The concern form offers fact chips from the player's Notepad and conclusion chips from the week ("Ross is stealing", "Wes thinks Nadia's involved"); feedback favours facts.
  - Posting it in the team chat instead is possible, and counts as spreading it, not raising it.
- **14:00, Nadia (C14-B2).** Nadia is at her desk, staring at her phone. The player can: offer a brew (*"Fancy a cuppa? You look like you need one."*); message Lena privately that Nadia seems to be having a rough week; report her to the security team as possibly involved with Ross; or ask her *"Are you going to Stonecrop with Ross?"*
  - Offered a brew: Nadia: *"Sorry. Dad's in hospital. I'm in early so I can get there by four."* And: *"HR have been brilliant. Don't tell the whole floor, will you?"*

#### 4d. Friday (1.5 minutes)

- **12:00.** An email to the team: *"Ross's accounts close at 12:00 today as part of the leaver process. Leaving drinks in the kitchen at three."*
- **15:00, the kitchen.** Martin's speech: *"Nine years. Half our book, he built. We'll miss him."* Then Ross takes the player aside (C14-B9, the counterpart of the hook):
  - Ross: *"My access went at twelve and I forgot my personal folder. Pop your login in for me? Two minutes. I'll be right here."*
  - The player chooses: *"Sorry, Ross, I can't. Mei Lin can sort out anything that's yours."*; *"Sorry, no."*; or logs in for him on the kitchen laptop.
- **Nadia's ending.** If the player checked in on her: *"Thanks for Thursday. Dad's home."* If the rumour reached her: *"Wes asked if I'm 'going with Ross'. I've been at the hospital every night."* If the player reported her to security as a suspect, Ama, privately and kindly: *"Thanks for telling me. I looked at the facts, and there's nothing there. She's got a lot on. Next time, start with what you actually saw."*
- **Consequences** (BE-16):
  - **Concern raised by Thursday:** Friday 16:30. Mei Lin: *"It's been dealt with. The copies are gone, and he's signed to say so."* Martin, quietly: *"I'd have given him a reference for anything. But the book's ours."* Ross's last message to the player, if they spoke up to him on Tuesday: *"Fair enough. I honestly thought they were mine."*
  - **Concern raised on Friday:** the same ending, with a beat where Mei Lin says it was close: one copy had already been opened at home.
  - **No concern raised:** *"Two months later."* Lena takes a call from a school business manager: *"Stonecrop quoted us four per cent under your price, two weeks before our renewal. How did they know our dates?"* Tomasz, to the player: *"That list was four thousand people who trusted us with their details. If anyone saw anything, now is still better than never."* The player can raise it now; the debrief credits a late report.

### 5. Debrief: "Seen, said, true" (1.5 minutes)

- **(CP)** The debrief screen (BE-02), then Ama, Mei Lin and Tomasz in the kitchen (or the conversation panel for the text route). See Debrief, below.

### 6. Check (1.5 minutes)

- **(CP)** Mei Lin's spot check on The Lark (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09) with the organisation's own routes, Speak Up line and policy names (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Leo's login (B1) | Ring the service desk with him / say no / log in for him / point to the sticky note | LO2 (baseline) | Owain fixes it in minutes; or Kai's Wednesday question about the HR drive opened under the player's name |
| Nadia's week (B2) | A kind word / a private word to Lena / report her to security as a suspect / ask if she's going with Ross / read the page in the printer tray | LO3, LO6 | Nadia's Friday line; Ama's private, kind correction; the debrief notes that the page was her father's discharge plan |
| Wes's theory (B3) | Add to it / "maybe she's got stuff going on" / "tell Ama or Lena, not the kitchen" / say nothing | LO5, LO6 | The rumour map: six desks, two or none; whether the rumour reaches Nadia |
| Ross's screen (B4) | Note it and go / say something to Ross / search his desk and files / photograph his screen | LO3, LO5 | Searching or photographing is recorded and explained in the debrief (the photo put customer data on the player's own phone) |
| The offer (B5) | Screenshot and report / reply, then report / block and delete / ask how it works | LO4 | Kai's Thursday thanks; the debrief shows the same message reached other staff |
| The prompts (B6) | Deny and ring now / deny and report in the morning / approve one | LO4 | Kai's Thursday message: account paused and password reset, or a sign-in to contain |
| Ross's favour (B7) | Ask Lena what the handover needs / send to his work email / send to his personal email | LO2, LO3 | If sent to his personal email, it becomes part of the "two months later" story |
| Raising the concern (B8) | Security team, Mei Lin, Lena, Martin, the Lark form or the Speak Up line, by Thursday / on Friday / after the time skip / never; facts or conclusions; or the team chat | LO5 | Friday's discreet resolution, or the school business manager's call two months later |
| Ross's last-day login (B9) | Say no and point to Mei Lin / say no / log in for him | LO2 | If the player logs in, the debrief shows what Ross opened under the player's name in two minutes |

No option shames the player. Ross isn't a monster and Wes isn't malicious; Nadia is never punished for being suspected, and the player is never punished for raising an honest concern that turns out to be nothing. The only behaviours the game marks down are the ones that harm people: sharing access, engaging with criminals, investigating colleagues and spreading rumours.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-20 Knowledge check** | new | "Fact or Feeling?" in practice mode (eight cards and the fairness card, instant feedback), the Learn check question, and the final spot check |
| **MG-09 Incident report form**, concern mode | new | The Lark's "Raise a concern" page and Mei Lin's conversation: fields for what, when, where and who, filled from Notepad fact chips; conclusion chips are allowed but flagged in feedback; a route picker (security team, manager, HR, Speak Up line, DPO) |
| **MG-05 Messaging apps** | new | The "talent partner" message from an unknown contact, with a screenshot action and a Report button |
| **MG-07 MFA prompts** | new | The 02:10 prompt storm, one decision |
| `examine` | existing | The page in the printer tray and Ross's second screen |
| `container` | existing | Ross's desk drawer and files (the temptation to investigate) |
| `notes` | existing | The player's Notepad of dated facts (needs `#add_note` fixed) |
| `person-chat` | existing | Everyone on screen |
| `phone-chat` | existing | Lena, Kai, Owain; the messaging app until MG-05 exists |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| It's mostly ordinary; your login is you; offers | Ama (EX-01) | 70 seconds | The spectrum bar with three Larkspur examples; a mocked-up offer stamped "screenshot, report" | none (assessed in Apply) |
| Notice, note, pass it on; a kind word first | Mei Lin (EX-01) | 55 seconds | The routes card with the organisation's own details | "You see a colleague copying the customer list to a folder called 'personal'. What do you do first?" |
| What happens after I raise something? | Mei Lin (optional) | 30 seconds | A three-step diagram: you raise it; the right team looks at it fairly; it stays confidential | none |
| Doesn't IT watch everything? | Ama (optional) | 20 seconds | The organisation's monitoring notice | none |
| Whistleblowing or leaking? | Mei Lin (optional, also opened by Ross's claim) | 45 seconds | Two columns: protected routes (Speak Up line, a regulator, a lawyer) and leaking (to a competitor, the press, online); Protect's details | none |
| What was in the list | Tomasz (in the debrief) | 30 seconds | One row of the customer list, zoomed: a school business manager's name, direct line and renewal date | none |

## Debrief

Shown on BE-02, then talked through by Ama, Mei Lin and Tomasz:

1. **Seen, said, true.** A board with one row per thread (Leo, Nadia, Ross, the offer) and columns for what the player saw, what the office said, what was really happening, what the player did, and what followed. Nadia's row is the one players remember: *Seen: printing at 07:50, calls in the stairwell, two visits to HR. Said: "going to Stonecrop with Ross". True: her father was in hospital.*
2. **The rumour map** (proposed): the office floor, with the desks Wes's theory reached lit up day by day.
3. **Before and after:** Leo's login on Monday beside Ross's on Friday.
4. **Tomasz on the list:** *"Behind every row is a person. These were people who trusted us with their numbers."*
5. **Per-outcome results:** Secure, Developing or Not yet (see `assessment.md`).
6. **The line to remember:** *"Your login is you. Offers get reported. Concerns go to the right person, as facts."* Mei Lin closes: *"You didn't have to be a detective this week. You had to be fair."*

## Variants

- **Micro-drill:** "Fact or Feeling?" (BE-07): six cards drawn from a bank of about forty, plus one fairness card, in about 3 minutes. A new card theme each month (a leaver, an outside approach, a shared login, a colleague under pressure).
- **Text route:** the week as an interactive story with the same title cards and choices. The printer page and Ross's screen are described, with the same option to look closer. The rumour map becomes a list of who heard the theory. The concern form keeps its fact and conclusion chips as checkboxes (BE-03).
- **Facilitated session:** the team plays on one screen and votes at each decision. Pause points: after the hook (*"When did someone last ask to borrow your login? What did you say?"*), after Wes's theory (*"How do rumours start here, and who do they land on?"*), after the offer (*"Would people here report a message like this, or quietly delete it? Why?"*), after Ross's favour (*"Where's the line between helping a leaver and helping them take data?"*). About 45 minutes. Facilitators get a note on handling the topic sensitively, because some people in the room may have raised concerns, or been the subject of them.
- **Replay and randomisation:** who is leaving and from which team (Sales, Finance, Operations); what they take (the customer list, pricing, a supplier contract, code); the false lead's real reason, drawn from a bank (a parent in hospital, a second job cleared with HR, a medical appointment, organising the leaving collection); the channel of the offer (a messaging app, a professional networking site, a phone call, someone at the gym). Annual editions add the year's approaches (fake job interviews, bribes for support staff).

## Alternative concepts

1. **Whisper Network.** The office as a network of desks. Each day a rumour starts somewhere, and each time it's retold it changes a little ("Nadia was in with HR" becomes "Nadia's been suspended"). The player chooses who to tell, what to say, and whether to pass a fact to the right person instead. Score: how much truth reached someone who could act on it, against how much rumour reached everyone else. A playful, quick way to teach fairness and routes, best suited to the micro-drill and to team sessions.
2. **Two Desks.** The player alternates between two people through the same week: Ross, feeling passed over, with a new employer asking him to "bring his book", telling himself the contacts are his; and the colleague who notices. Ross's half shows how a decent person talks themselves across a line in small steps, and where a word from a friend, a fair manager or a clear rule would have stopped him. It builds empathy and teaches the motivations without making anyone a villain. Strongest in a facilitated session.
3. **Exit Interview.** After Ross has gone, Ama and Tomasz review what happened, the proper way, and ask the player to help pin up only what counts as evidence: dated facts from people who saw them. Rumours, guesses and "everyone knows" cards bounce off the board. It uses the corkboard idea from MG-13 to teach what a fair concern contains and who gets to investigate, without ever asking the player to investigate a colleague.

## Art and audio

- **Rooms:** existing `room_office` (dressed with a Sales pod and a printer by the door), `room_break`, `room_meeting` and `hall_1x2gu`; a dark title card and the phone for Wednesday night. Lighting: early morning for Tuesday's printer scene, late afternoon for Ross's screen.
- **Props:** Ross's second screen with a readable copy window (an `examine` close-up), a page in the printer tray, a leaving card and cake for Friday, a "Coffee with Security" sign, a deck of "Fact or Feeling?" cards.
- **Characters:** Ross, Nadia and Wes are new and need dialogue busts, talk sheets and walk sprites. Ama, Mei Lin, Tomasz, Leo and Martin are recurring. The talent partner needs only a chat avatar. Kai, Owain and Lena appear by chat or phone.
- **Voice:** about 15 lines for Ama, 15 for Mei Lin, 12 for Ross, 6 for Nadia, 5 for Wes, 5 for Leo, 4 for Tomasz, 3 for Martin and 2 for Owain. The talent partner and Kai are text only. No voiced line prints a variable: times, file names, desk counts and the organisation's details are on screen only. Tomasz's "four thousand" is fixed text, not a count from the game.
- **Music and sound** (BE-21): the ordinary office soundscape, a kitchen at lunchtime, a quiet flat at night with the phone's buzz.

## Pitfalls

- **Don't build a culture of watching each other.** The module never rewards snooping, never shows a "suspicion meter", and never asks the player to investigate. The temptations to search a desk or photograph a screen are there so they can be explained, not used.
- **Don't make stress a risk factor to be watched.** Every mention of grievance, debt or illness comes with support. Nadia's thread exists to teach kindness and fairness.
- **Watch the casting.** Who is suspected and who is guilty must not echo stereotypes; the gossip is a likeable, ordinary person, and the debrief notes that rumours tend to land on people who are already under strain.
- **Keep the law light and right.** The whistleblowing summary follows `concepts.md` and points to Protect and the organisation's policy; it is not legal advice.
- **No how-to in the offer.** The talent partner's messages offer money and ask for "access"; nothing technical is ever explained.
- **No real names in the game.** Real cases stay in `concepts.md` and the field guide.
- **Respect confidentiality.** The player learns only a discreet resolution, as a real member of staff would.
- **No gotchas.** Nadia's innocence is easy to find with a kind word, and an honest concern about her is handled kindly rather than marked as a failure.
- **Don't let Ross become a cartoon.** He's likeable and wrong, which is the realistic and more useful lesson.