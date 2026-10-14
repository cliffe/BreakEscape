# core_04 game design: The Golden Hour

## Concept

A Thursday afternoon on the Operations floor. The player has an ordinary job to finish: Northfield Council's monthly service report, due at half past two, which means pulling figures from the shared drive, collecting a signed printout from Meeting Room 2, getting Martin's sign-off and sending it through the customer portal. Around that job, small things go wrong, none of them announced: files that won't open, a laptop that isn't where it should be, a sign-in prompt nobody started, a colleague's embarrassed confession.

Each incident has a **blast radius** that grows with game time until someone reports it: more emails sent, more folders locked, a laptop opened somewhere unknown, an email forwarded on. The player never sees a gauge; they see what a colleague would see (a phone ringing again, Finance complaining, Martin looking pale). Reporting freezes the spread, and Kai's team pulls it back. After each report, Kai shares their screen for a few seconds to show how far it had got. At the end, Kai replays the whole afternoon on one map: when each sign appeared, when it was reported, and what each report let the team do.

The hook (Leo's account) shows the mechanic once with Ama and Kai's help; the Apply beat is the afternoon; the debrief is the reveal. The lunch-table story is the replay: *"I spent four minutes finishing a spreadsheet, and Finance lost their whole shared drive in that time."* The lesson is the module's title. Ama: *"First aiders talk about a golden hour. Incidents have one too, and ours is mostly the first few minutes."*

## Setting and cast

- **The Operations floor** (`room_office`): the player's desk, Leo's desk next to it, Lena's corner, a team screen. The game clock starts at Thursday 13:48 (`gameClock`) and runs at real speed.
- **Meeting Room 2** (`room_meeting`): the team laptop's dock and cable, and the printout the player needs.
- **The Finance office** (`small_office_room3_1x1gu`): Hassan's team; its PCs tint amber as the locked folders spread.
- **Kai's security office** (`room_security`): the response board (`command-board`) and the map screen.
- **The corridor to the comms room** (`hall_1x2gu`, with the `room_servers` door): the optional stranger.
- **Ama Owusu** (mentor) explains, and thanks people.
- **Kai Murray** (security analyst, they/them) shows what happens behind the scenes after every report.
- **Leo Brennan** (desk neighbour) is the hook: his account is sending emails he didn't write.
- **Martin Fletcher** (Sales Director) sent the wrong spreadsheet to a prospective client, and would rather not make a fuss.
- **Tomasz Wiśniewski** (DPO), **Precious Adeyemi** (facilities), **Owain Jenkins** (service desk) and **Hassan Qureshi** (Finance) have a line or two each.
- **Lena Fischer** (the player's manager) appears by chat only and sets the task.
- **The stranger:** a generic contractor sprite in hi-vis with a toolbag; unnamed, one short conversation.
- Off-screen: Brookfield Primary's business manager (who rang Leo), Moorside Care Home (whose residents' contacts Martin sent), Northfield Council (the client). All fictional.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Did you send me something?" (1 to 2 minutes)

- **(CP)** 13:50. The player is at their desk with the council report open. Leo rolls his chair over, phone still in his hand: *"Weird one. The business manager at Brookfield Primary just rang to ask why I'd sent her an invoice link. I haven't sent anyone anything."* He turns his screen: a dozen identical emails in his sent items from the last ten minutes. *"Should I say something, or is that overreacting?"* One of those emails lands in the player's own inbox at the same moment (MG-01, light).
- The player chooses (the baseline, C04-B1):
  - *"Ring the security team now. I'll stay with you."* Leo rings 4444, and the player hears his side of a good report: *"Hi, it's Leo in Operations. My email's sending invoices I didn't write. Started about ten minutes ago. A school's had one. I haven't touched anything."*
  - *"I'll report it. You ring the school back and tell them not to click."* MG-09 opens (BE-19).
  - *"Change your password. That should stop it."* Leo does, and nothing else. (A new password doesn't sign out sessions an attacker already has, or remove a rule they've set up, and nobody who can do that has been told.)
  - *"Probably spam pretending to be you. I'd ignore it."* Leo goes back to his desk.
- **The spread runs while they decide** (timers from `inc_leo_started`): at +45 seconds, the emails reach a second batch of customers; at +90 seconds, a school's finance officer types her password into the fake page. If it isn't reported, Leo's phone rings again at +60 seconds: *"Now Brookfield say three parents have had it."* That is a second chance to report, recorded as late.
- At about +2 minutes Ama arrives with Kai, who carries a laptop. Reported: *"Thanks for telling us, both of you."* Not reported: *"Leo, Kai's just seen your account emailing half the county. Let's sort it."* Leo reports with them. Nobody is told off.

### 2. Learn: "What two minutes looks like" (3 minutes)

- **(CP)** At the player's desk. Kai turns the laptop round to show the blast radius for Leo's account (BE-08 frames until the map exists): the first email at 13:40, Brookfield's call at 13:49, the report, and the rings in between. Kai's voiced line is chosen by the stage reached, with the exact times and counts on screen only:
  - **Reported before the second batch:** *"Reported inside a couple of minutes. It barely got going, and nobody clicked. That's about as good as it gets."*
  - **Reported later:** *"It got out to a lot of customers, and one school typed their password in. So now we're helping them too."*
- **(CP)** Ama explains (EX-01), stepping through aids in the conversation panel (BE-08):
  1. **What counts.** Aid: five icons (accounts, devices, files, data, people). *"Anything that might put information, systems, money or people at risk. Near misses count. Your own mistakes count."*
  2. **The signs.** Aid: the signs table from the reference card, one row lit at a time. *"You don't have to know what it is. You only have to notice it's odd."*
  3. **How to report here.** Aid: the organisation's routes (BE-05). *"Emails, the Report button. Anything else, ring us or use the form. Nights and weekends, the 24/7 desk."*
  4. **What to include.** Aid: two reports side by side, *"Leo's email is being weird"* and Leo's own call from the hook (or a model call, if he didn't make one). *"What, when, where, who, and what you've done. That's it."*
  5. **What not to do.** Aid: four crossed-out icons. *"Don't investigate. Don't delete. Don't switch it off unless we ask. Don't forward it round the office."*
  6. **No blame.** *"Leo did nothing wrong. And if he had, he'd still get a thank you. Fast and honest is all we ask."*
- **(CP)** Kai (EX-05, 30 seconds), with the response board on the laptop: *"Here's what a report lets me do. Lock the account. Sign out every session. Pull the emails out of every inbox. Warn the customers."*
- Ama closes with one check question (MG-20 single item): *"Which of these reports helps Kai most?"* (four sample reports; the right one has what, when, where, who and what's been done).
- **Skip:** *"I've done this before."* Ama: *"Then you'll ace this."* The check question runs; a wrong answer brings the explanation back.
- **Optional topics** in Ama's hub (each under a minute): *"What if I'm wrong?"*; *"What if it's the middle of the night?"*; *"What happens to the person who made the mistake?"*; *"Why can't I just fix it myself?"*; and *"Why is it called the golden hour?"*

### 3. Practise: "Report it or not?" (3 minutes)

- **(CP)** On the player's PC, MG-09 in practice mode. Feedback is immediate; Ama adds a one-line comment.
  1. **Report it or not?** Eight situations, each answered *Report it now* or *Deal with it the normal way*:
     1. A password reset email you didn't ask for. *(Report.)*
     2. The printer says "paper jam". *(Normal. If reported: "Fine to check. That one's a normal ticket.")*
     3. You left your work phone on the bus this morning. *(Report now: it can be locked remotely.)*
     4. A colleague's laptop shows a security warning they've closed twice. *(Report.)*
     5. You sent a list of staff names to the wrong colleague, who deleted it straight away. *(Report: a near miss, and the DPO decides.)*
     6. Your laptop asks to restart for updates. *(Normal: restart it. See core_07.)*
     7. A visitor without a badge is alone in the Finance office. *(Report.)*
     8. A supplier emails asking you to update their bank details. *(Report the email with the Report button. See core_11.)*
     Over-reporting is never marked wrong.
  2. **Two practice reports** on the full form, with each field marked after sending and the ideal report shown alongside:
     - *A USB stick labelled "Payroll" on the car park floor. You've picked it up but not plugged it in.*
     - *The team's shared mailbox has a rule forwarding everything to an outside address nobody recognises. You haven't changed anything.*
     Typical feedback: *"You didn't say where. The team would have to ring you back first."* / *"Good: you said you hadn't changed anything."*
  3. **First moves** (one ordering item): *"Your screen fills with files you can't open and a note asking for payment."* Put in order: leave everything as it is; ring the security team; tell them what you see and what you've done; follow their instructions (such as unplugging the network cable).
