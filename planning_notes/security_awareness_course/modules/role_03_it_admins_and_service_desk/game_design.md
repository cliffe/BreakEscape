# role_03 game design: Reset Request

## Concept

It is Monday morning on Larkspur's service desk, the busiest four hours of the week. The player is an analyst a few months into the job, sitting between Owain Jenkins, the desk lead, and Rosa Delgado, the fastest analyst on the floor. The queue board on the wall says fourteen tickets and an average handling time in amber. The work task is to clear the queue by lunch: printers, shared drives, new starters' laptops, people locked out after the weekend.

The security tests arrive inside that queue, sounding like the rest of it. A chief executive at an airport gate, a contractor who "mustn't be blocked", a director's must-have app, a supplier's helpful engineer, a colleague's slip, an alert that only makes sense if someone connects it to a reset made an hour earlier. The module teaches the habit the NCSC asked every service desk to review in 2025: verify through a route the caller doesn't control, however senior or urgent they are, and escalate what doesn't add up.

The hook a player would talk about at lunch: the fake chief executive knows every answer to every security question, and the real one, two hours later, is the one who has to be talked into the check.

## Setting and cast

- **Rooms:** the service desk (`room_IT`, redressed with headset desks, the queue board and a mug that says "Ask us first"); the security office (`room_security`, Kai's desk); Gillian's office (`room_ceo`) for the in-person check; the open-plan floor (`room_office`) as a walk-through. No new rooms.
- **Owain Jenkins** (IT Service Desk Lead): the mentor for this module. Relaxed, Welsh, backs his analysts every time: *"Nobody on this desk gets in trouble for following the procedure. Not ever."*
- **Kai Murray** (security analyst): watches the sign-ins and takes the escalations; shows what each catch stopped.
- **Jo Fairweather** (Northlight Security's ethical social engineer): a one-minute interlude by video, showing where the caller's answers came from.
- **Gillian Marsh** (chief executive): the real one, at 11:20, impatient with process and won round.
- **Martin Fletcher** (Sales Director): wants an app for his team. **Kev Sutcliffe** (warehouse supervisor): wants the virus checker off the scanner PC.
- **New: Rosa Delgado**, service desk analyst. 20s, British Colombian, warm, quick, top of the handling-time board. Resets an account after a caller answers the security questions, sees the alert, and reports it within twenty minutes: the module's "slipped, reported, thanked" colleague. Needs art and a voice.
- **Voice or text only:** the fake "Gillian" (a different voice from the real Gillian, with airport noise and a phone filter); Bridget Hennessy, a project manager (email); Wes Kimber, an engineer at Brightline Label Systems, a supplier (phone); ordinary callers from the generic voice pool.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Gate B32" (2 minutes)

- **(CP)** 08:02. The desk (MG-17) opens with the first call. The caller card reads: *Claims to be: Gillian Marsh, Chief Executive. Account: executive (finance approvals). Request: move authenticator to a new phone.* Airport announcements in the background.
- "Gillian": *"It's Gillian Marsh. I'm at the gate in Frankfurt, my phone's been stolen, and I'm boarding in ten minutes."*
- "Gillian": *"Move my authenticator to this number, or the payment run doesn't get approved today. Ask me anything you like."*
- If the player asks the security questions, she answers every one: employee number, date of birth, her assistant's name, the office address, her start date. Each shows "matches HR record" on the card, and a small tag: *findable: yes*.
- **Decision H1:** *"You've passed the questions. I'll move it now."* / *"I'll call you back on your number on record."* / *"Executive MFA changes need ID in person or on video, plus a second check. I can book it for when you land."* / *"Bear with me, I'll ask my lead."*
  - Call back: the number on record goes to voicemail, and the caller rings back angrier: *"My phone was stolen. That's the point."* The player chooses again.
  - Holding the line: *"This is absurd. I'll be speaking to Owain about you."* She hangs up.
  - Moving it: the card shows *Authenticator moved to 07700 900461* (a number from Ofcom's range reserved for drama).
- Owain wheels his chair over either way.
  - If the player moved it: *"Hang on. Did we just move the chief exec's MFA on a phone call? No blame. Let's tell Kai now."* Three minutes later Kai: *"Her account's just signed in from a new device abroad. Sessions killed. You told me in five minutes, which is why this is small."*
  - If the player held the line: *"You said no to the chief exec on the phone. Hardest call on this desk. Want to know why it was right?"*
- The response is the baseline for R03-B1.

### 2. Learn: "Knowing isn't proving" (4 minutes)

- **(CP)** Owain at the desk (EX-01), four chunks with visual aids in the conversation panel (BE-08):
  1. **What a reset is worth.** A key ring: email, files, chat, approvals; for an admin, every door. *"A reset isn't a favour. It's handing someone a set of keys."*
  2. **Knowing isn't proving.** The caller's five answers, each linked to where it can be found. Jo Fairweather drops in by video (EX-06, about 60 seconds) with a corkboard of four cards: the leadership page on Larkspur's website, a conference speaker biography, a birthday post, and a press release naming the chief executive's assistant. *"None of that is hacking. It's reading. What stops me? You ringing back on a number I don't control."*
  3. **The ladder.** The table from `concepts.md` as a picture: account type down the side, request along the top, the minimum check in each square, and the second analyst on everything privileged.
  4. **Pressure is a signal.** The lever cards (seniority, urgency, anger, sympathy, jargon, "your colleague did it last time"). *"The harder someone pushes, the slower we go. And I'll back you, every time."*
- Check question (MG-20 single item): *"The caller knows your employee number, your date of birth and your manager's name. How sure can you be it's you?"* Not at all, all of it can be found (correct) / fairly sure, that's three facts / certain, if the employee number is right.
- **Skip:** *"I've done the procedure training."* Owain: *"Tidy. One question, then."* A wrong answer brings back chunk 2.
- **Optional topics** in Owain's hub: *"What about video calls?"* (useful, but faces and voices can be faked, so pair them with a second check; core_15), *"Why can't I just use caller ID?"* (it can be faked; core_02), *"What's phishing-resistant MFA?"* (keys and passkeys only work on the real site; core_03).

### 3. Practise: "Prove It" (4 minutes)

- **(CP)** MG-17 in practice mode: six calls and tickets, one at a time, with instant feedback from Owain. For each, the player picks the checks and an outcome.
  1. A warehouse picker locked out, standard account, ringing from a warehouse phone. *Self-service from the registered phone, or a call back on the warehouse extension in the directory.*
  2. "IT support from your supplier" wants a VPN account for an engineer. *Refuse; supplier access is booked through the supplier gateway with a change ticket.*
  3. A manager asks for a team member's password, because he's off sick and she needs his mailbox. *No password sharing; delegated access through a request approved by the right person.*
  4. A new starter on day one with no MFA yet. *Their manager confirms in person against the HR start list; MFA is set up at the desk.*
  5. A server administrator asks for domain admin "for an hour". *Through the privileged access tool, on their admin account, approved, time-limited.*
  6. A caller whose father is in hospital needs payroll access now. *Sympathy, then a call back on the directory number, and the payroll team's help line.*
- Feedback is one line, for example on item 6: *"Be kind and still check. If it's real, the call back takes two minutes."*
- Two wrong in a row bring Owain back with the ladder.

<!-- continue -->
