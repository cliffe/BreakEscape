# role_03 game design: Reset Request

## Concept

It is Monday morning on Larkspur's service desk, the busiest four hours of the week. The player is an analyst a few months into the job, sitting between Owain Jenkins, the desk lead, and Rosa Delgado, the fastest analyst on the floor. The queue board on the wall says fourteen tickets and an average handling time in amber. The work task is to clear the queue by lunch: printers, shared drives, new starters' laptops, people locked out after the weekend.

The security tests arrive inside that queue, sounding like the rest of it. A chief executive at an airport gate, a contractor who "mustn't be blocked", a director's must-have app, a supplier's helpful engineer, a colleague's slip, an alert that only makes sense if someone connects it to a reset made an hour earlier. The module teaches the habit the NCSC asked every service desk to review in 2025: verify through a route the caller doesn't control, however senior or urgent they are, and escalate what doesn't add up.

The hook a player would talk about at lunch: the fake chief executive knows every answer to every security question, and one call back to the number already on record finds the real one upstairs in the board meeting, phone in hand, asking who is in Frankfurt.

## Setting and cast

- **Rooms:** the service desk (`room_IT`, redressed with headset desks, the queue board and a mug that says "Ask us first"); the security office (`room_security`, Kai's desk); the open-plan floor (`room_office`) as a walk-through to the project room where the contractor sits. No new rooms.
- **Owain Jenkins** (IT Service Desk Lead): the mentor for this module. Relaxed, Welsh, backs his analysts every time: *"Nobody on this desk gets in trouble for following the procedure. Not ever."*
- **Kai Murray** (security analyst): watches the sign-ins and takes the escalations; shows what each catch stopped.
- **Jo Fairweather** (Northlight Security's ethical social engineer): a one-minute interlude by video, showing where the caller's answers came from.
- **Gillian Marsh** (chief executive): the real one, reached by the call back in the board meeting, puzzled, then delighted; she thanks the desk on The Lark before lunch.
- **Martin Fletcher** (Sales Director): wants an app for his team. **Kev Sutcliffe** (warehouse supervisor): wants the virus checker off the scanner PC.
- **New: Rosa Delgado**, service desk analyst. 20s, British Colombian, warm, quick, top of the handling-time board. Resets an account after a caller answers the security questions, sees the alert, and reports it within twenty minutes: the module's "slipped, reported, thanked" colleague. Needs art and a voice.
- **Voice or text only:** the fake "Gillian" (a different voice from the real Gillian, with airport noise and a phone filter); Bridget Hennessy, a project manager (email and chat); a caller claiming to be Sam Reilly, the new contractor (phone); Wes Kimber, an engineer at Brightline Label Systems, a supplier (phone); ordinary callers from the generic voice pool. The real Sam appears only as a name in Bridget's reply.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Gate B32" (2 minutes)

- **(CP)** 08:02. The desk (MG-17) opens with the first call. The caller card reads: *Claims to be: Gillian Marsh, Chief Executive. Account: executive (finance approvals). Request: move authenticator to a new phone.* Airport announcements in the background.
- "Gillian": *"It's Gillian Marsh. I'm at the gate in Frankfurt, my phone's been stolen, and I'm boarding in ten minutes."*
- "Gillian": *"Move my authenticator to this number, or the payment run doesn't get approved today. Ask me anything you like."*
- If the player asks the security questions, she answers every one: employee number, date of birth, her assistant's name, the office address, her start date. Each shows "matches HR record" on the card, and a small tag: *findable: yes*.
- **Decision H1:** *"You've passed the questions. I'll move it now."* / *"I'll call you back on your number on record."* / *"Executive MFA changes need ID in person or on video, plus a second check. I can book it for when you land."* / *"Bear with me, I'll ask my lead."*
  - Call back: *"My phone was stolen. That's the point!"* The player ends the call politely (*"I'll ring you straight back on the number we hold"*) and dials Gillian's mobile from the HR directory. The real Gillian answers in a whisper: *"I'm in the board meeting. My phone's in my hand. Who's in Frankfurt?"* Then: *"Somebody's being me, then. Tell Kai. And well done."*
  - Holding the line: *"This is absurd. I'll be speaking to Owain about you."* She hangs up.
  - Moving it: the card shows *Authenticator moved to 07700 900461* (a number from Ofcom's range reserved for drama).
- If the player moved it, the call ends happily and the next ticket appears. The player can turn to Owain (*"I think I've just moved the chief exec's MFA on a phone call"*) or carry on with the queue.
  - Telling Owain: *"Right. No blame. Let's tell Kai now."* Kai, a moment later: *"Her account's just signed in from a new device abroad. Sessions killed. You told me before they'd done anything, which is why this is small."*
  - Carrying on: two tickets later Kai's alert arrives on the team chat and Owain wheels over: *"Was that one of ours? Let's look together."* The same fix, a bigger clean-up, still no blame.
- If the player held the line without calling back, Owain wheels over: *"You said no to the chief exec on the phone. Hardest call on this desk. Let's ring her on the number we hold, just to be sure."* He does, on speaker, and the real Gillian answers from the board meeting as above. In the reset branch, Owain makes the same call while Kai cleans up. Every player hears the call back work.
- No one reads out a code at any point. Larkspur's desk never asks anyone to read out a one-time code; it calls back on the number already held, or sends an approval or reset to details already held.
- The response is the baseline for R03-B1; telling Owain is R03-B2.

### 2. Learn: "Knowing isn't proving" (4 minutes)

- **(CP)** Owain at the desk (EX-01), four chunks with visual aids in the conversation panel (BE-08):
  1. **What a reset is worth.** A key ring: email, files, chat, approvals; for an admin, every door. *"A reset isn't a favour. It's handing someone a set of keys."*
  2. **Knowing isn't proving.** The caller's five answers, each linked to where it can be found. Jo Fairweather drops in by video (EX-06, about 60 seconds) with a corkboard of four cards: the leadership page on Larkspur's website, a conference speaker biography, a birthday post, and a press release naming the chief executive's assistant. *"None of that is hacking. It's reading. What stops me? You ringing back on a number I don't control."*
  3. **The ladder.** The table from `concepts.md` as a picture: account type down the side, request along the top, the minimum check in each square, and the second analyst on everything privileged.
  4. **Pressure is a signal.** The lever cards (seniority, urgency, anger, sympathy, jargon, "your colleague did it last time"). *"The harder someone pushes, the slower we go. And I'll back you, every time."*
- Check question (MG-20 single item, `#trigger_minigame:knowledge_check|r03_knowing_check`): *"The caller knows your employee number, your date of birth and your manager's name. How sure can you be it's you?"* Not at all, all of it can be found (correct) / fairly sure, that's three facts / certain, if the employee number is right.
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

### 4. Apply: "The Monday queue" (10 minutes)

- **(CP)** The queue board shows fourteen tickets (BE-18). Ordinary work fills the gaps between the tests: a printer in Finance, a shared drive request, a laptop for a new starter, a forgotten password from a registered device that self-service sorts. The tests arrive in this order:

**Test 1 (08:40): the contractor.** An email from Bridget Hennessy, a project manager: *"Sam Reilly starts today on the depot system migration. Please give his normal account domain admin so he isn't blocked. Thanks!!"*
- *"A separate admin account for Sam: migration servers only, approved by the system owner, ending with his contract, with a security key."* / *"A separate admin account with domain admin until the migration's done."* / *"Add domain admin to his normal account until the migration's done."* / *"Give him the shared admin login for today."*
- Bridget, to the first: *"Didn't know that was a thing. Fine, as long as he's working by ten."* The privileged access tool's approval arrives at 09:50.

**Test 2 (09:10): the app.** A ticket from Martin Fletcher: *"My team need Inbox Genie. It files client emails automatically. It says an admin has to approve it."* The request opens in `forensic-data-platform` with four tabs: the app (unverified publisher, registered last month), its permissions (read and write every mailbox, send mail as any user, read all files), who asked, and the approved alternative (mail rules that already file by client).
- *"Don't approve it. Offer the approved filing rules, and send the request to the security team for review."* / *"Approve it for Martin's team only."* / *"Approve it. He's a director."*
- Martin, to the first: *"Fine. Can your approved thing do colour coding?"* It can.

**Test 3 (09:40): Rosa's reset.** Rosa, cheerfully, between calls: *"Just reset a lad in Finance, Jamie Lowe. Locked out after his holiday. Knew everything, bless him."* The player can ask whether she called him back (*"Said his phone was dead. Queue's at fourteen."*). Nothing is assessed here; it's the setup for test 4.

**Test 4 (10:05): the alert.** Kai, in the team chat: *"Can someone look at Jamie Lowe's sign-ins? The desk reset him at 09:40."* The log opens in `log-filter` (vpn log type): a failed sign-in from Leeds at 08:55 (the real Jamie, locked out), then a successful sign-in at 09:41 with a new MFA device from France through a residential VPN, then two more from the same address. The player can filter and look up the address and the account's history.
- Flag the 09:41 row and *"Escalate to Kai now"* / *"Ring Jamie on his mobile to ask if he's in France"* / *"Close it. Probably a VPN."*
- Ringing Jamie on the directory number is allowed after escalating; doing it instead of escalating is rated Developing, because the attacker keeps the account while the player waits.
- **Decision on Rosa.** Rosa sees the screen: *"That's my reset. Oh no."* *"Come on, we'll tell Kai together. You've caught it in twenty minutes."* / *"You should tell Kai."* / *"Reset it again quietly. Nobody needs to know."* / *"That's your ticket, not mine."*
- Kai, when they arrive: *"Twenty minutes from reset to report. Sessions killed, the forwarding rule's gone, nothing went out. Thanks, Rosa."* Owain thanks her in the team chat before the end of the shift.

**Test 5 (10:30): the helpful supplier.** A call from Wes Kimber at Brightline Label Systems: *"We've put our remote support tool on the dispatch PC in the warehouse to fix the label printer. Your antivirus keeps closing it. Can you whitelist it?"* The approved tools list and the supplier contract are in `notes`. No change ticket exists.
- *"I can't whitelist it. Let's book a session through the supplier gateway with a change ticket, and I'll have the tool taken off that PC."* / *"Whitelist it for today only."* / *"Ask Kev to leave the PC unlocked so they can get on."*
- Wes: *"Fair enough. That's what your contract says anyway."* He is genuine and in a hurry, which is the point: criminals use the same tools and the same story, so the procedure has to work on both. Kai removes the tool and checks the PC.

**Test 6 (10:55): the scanner PC.** Kev at the desk hatch: *"That virus checker on the scanner PC slows everything down. Turn it off, would you? Just on that one."*
- *"I can't turn it off, but I'll raise a change so the security team can tune it, and I'll look at the scanner settings today."* / *"Off for the week, then back on."* / *"Nothing we can do, sorry."*
- Kev: *"As long as it's quicker by Friday. You'd not believe how many folk ask me for the warehouse door code."*

**Test 7 (11:20): the new contractor.** A call to the desk: *"Hi, it's Sam Reilly, the contractor on the depot migration. My security key's not working on the new laptop."* Then: *"Can you reset the MFA on my admin account? Bridget said you'd sort it. I'm losing the whole morning."* He knows the project, Bridget's name, the migration servers and the new admin account's name, all from this morning's email chain. The record in MG-17 shows the account set up in test 1: in the best branch a separate admin account created at 09:50, MFA enrolled on a security key at 09:55, with the contractor's mobile and line manager on record. In the weaker branches it is his normal account carrying domain admin, which makes this call worth even more to an attacker, and the debrief says so.
- *"I'll check with Bridget on chat first."* / *"I'll call you back on the mobile in your contractor record."* / *"It's a privileged account, so it needs ID in person or on video plus a second check. Where are you sitting?"* / *"You know the project and Bridget's name. I'll reset it."* / *"Can I ask you a few security questions?"*
- Bridget, on chat: *"Sam's sat next to me with his security key in. He hasn't rung anyone. Who's asking?"* The call back reaches the real Sam in the project room, who says the same. Asking where he is sitting gets *"Working from home today"*, which Bridget's reply contradicts.
- The right ending is a polite refusal and an escalation: Kai locks the new admin account's MFA changes for the day and checks its sign-ins. Kai: *"Brand-new admin account, nobody on the desk knows his voice yet. That's exactly who they'd pretend to be."*
- The real Gillian's message appears on The Lark as the player finishes: *"Someone pretended to be me to our service desk this morning. Our desk checked, and it stopped them. Thank you. If the desk checks with you, that's them doing their job."*

- **(CP)** By 11:45 the queue board shows zero, and the handling-time panel shows a note Owain added on Friday: *"Verification time doesn't count."*

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02), then Owain and Kai at the desk.
- **The chain.** A row of links: caller, reset, new device, mailbox, approvals, and for the contractor and the supplier, admin rights and remote tools. Each test lights the link where the player cut it, or shows what came next where they didn't.
- **Kai's view.** The same crew rang the desk three times this morning as three different people: the "chief executive", "Jamie" and "Sam". Kai's line depends on the player's choices. If the player held the line twice: *"Three calls. You said no twice. Rosa said yes and told me in twenty minutes. That's a good Monday."* If the player moved Gillian's MFA and told Owain: *"Two yeses this morning, and both of you told me fast. That's why nothing went out."* Rosa's report, and the player's own if there was one, are shown as thank-yous, not mistakes.
- The hook beside test 7: the same request (an MFA reset on a high-value account, by phone, under time pressure) from a chief executive at a gate and from a contractor nobody knows yet.
- Per-outcome results: Secure, Developing or Not yet.
- **The line to remember:** *"Knowing isn't proving. Call back on a number they don't control."*

### 6. Check (2 minutes)

- **(CP)** Six questions on The Lark (MG-20), drawn from the bank in `assessment.md`.

### 7. Reference

- **(CP)** The Lark opens the reset card (BE-09): the seven steps, the ladder, the admin rules, and the organisation's own procedure names and contacts (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| H1 The airport call | Reset after questions / call back / ID check booked / ask the lead | LO1, LO2 (baseline) | Kai's new-device alert, or the caller hanging up |
| H2 Own slip (if H1 reset) | Tell Owain now / carry on with the queue | LO6 | A quick fix with Kai, or the same fix two tickets later with more to clean up |
| T1 The contractor | Separate, limited, timed admin account / separate account with domain admin and no end date / domain admin on his own account / shared login | LO3 | Bridget's reply; in the debrief, what a phished contractor account could reach in each case |
| T2 The app | Refuse and offer the approved tool / approve for one team / approve | LO4 | Three weeks on (debrief card): the app's publisher on a blocklist, and in the approval branches a forwarding rule found in Martin's team's mailboxes |
| T4 The alert | Escalate / ring the user first / close it | LO5 | What the attacker did in the minutes each option allowed |
| T4 Rosa | Report together / tell her to report / fix quietly / not my ticket | LO6 | Kai's thanks, or the forwarding rule found two days later and Rosa's worry in the debrief |
| T5 The supplier's tool | Gateway and removal / whitelist today / leave the PC unlocked | LO4 | Kai's check of the PC; the debrief's note that the same story is used by criminals |
| T6 The scanner PC | Change and tune / off for a week / nothing | LO4 | Kev's reply; the gap shown on the debrief chain |
| T7 The "contractor" | Check with Bridget / call back on his record / ask for ID in person or on video / reset on what he knows / questions | LO2, LO6 | Bridget's reply and Kai's lock on the new admin account, or Kai finding the new MFA device an hour later |

No option shames the player. A reset in the hook is reported with Owain and treated as the most useful thing to do after a mistake; Rosa is thanked. The worst branches end with Kai or Owain helping and the debrief showing "this is how the real ones started; this is the link that breaks it".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-17 Caller verification desk** | new (shared with role_06) | The hook, Practise and tests 1 and 7, with `skin: "service_desk"`. `queue[]` entries carry the caller's claims, the HR directory record (role, account type, number on record, manager, registered devices, recent changes) and a pressure level driven by NPC influence (shown, never timed). `checklist[]` steps by strength: strong (call back on the directory number, prompt to the registered device, manager on chat, in-person or video ID check, second-analyst approval) and weak (date of birth, employee number, address, anything public: always "matches", always tagged findable). No step asks the caller to read out a code: device checks are approval prompts or reset links sent to details already held. Outcomes: go ahead, call back, refuse politely, escalate. Events: `caller_check_used`, `caller_verified`, `caller_refused`, `caller_escalated`, `caller_actioned`, recording the strongest check used before each action |
| MG-04 Voice calls | new (P2) | The phone under MG-17; `phone-chat` calls until it exists |
| MG-27 Work desktop | new | The analyst's PC: queue, log view, chat and The Lark in one launcher, with BE-18's notifications |
| `log-filter` | existing | Test 4, `logType: "vpn"`, with scenario `logEntries`, an `anomaly` row at 09:41, `threatIntel` for the address and `accountHistory` for Jamie, opened from Kai's message with `#trigger_minigame:log_filter|r03_jamie_signins`. Its country filter only offers UK, RO, US, DE and FR, so the anomaly uses FR; its synthetic timestamps carry a fixed 2025 date, so the module supplies its own `logEntries` |
| `siem` | existing, **bug** | Not used until `startSiemMinigame` passes `alertConfig` (or an inline alert list): today it always shows sis01's hospital alerts (`features/minigames.md`, section 4) |
| `forensic-data-platform` | existing (fix in `features/minigames.md`, section 4) | Test 2's app request; `confirmLabel` "Send to security review", gated on the permissions tab; approving is an ink choice so the record captures it |
| `phone-chat` | existing | Team chat with Kai and Owain; Bridget's follow-up |
| `person-chat` | existing | Owain, Rosa and Kev at the hatch; Jo's interlude in video-call mode |
| `notes` / `text-file` | existing | The reset procedure, the approved tools list, the supplier contract extract, ticket histories |
| MG-20 Knowledge check | new | Owain's check question and the final check |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| What a reset is worth | Owain (EX-01) | 30 seconds | The key ring | none |
| Knowing isn't proving | Owain, with Jo (EX-06) | 90 seconds | Jo's four-card board | "How sure can you be it's you?" |
| The ladder | Owain | 45 seconds | Account type by request grid | none (Practise uses it) |
| Pressure is a signal | Owain | 30 seconds | The lever cards | none |
| Optional: video, caller ID, phishing-resistant MFA | Owain | 30 seconds each | One card each | none |
| What a report stops | Kai (EX-05 scene) | 45 seconds | Jamie's sign-ins before and after the report | none |

## Debrief

Shown on BE-02, then spoken by Owain and Kai:

1. The chain, with each test's link and what the player did.
2. The before and after: the hook against test 7.
3. Rosa's report and what twenty minutes saved.
4. Per-outcome results.
5. The line to remember: *"Knowing isn't proving. Call back on a number they don't control."*

## Variants

- **Micro-drill:** "Prove It" on its own (BE-07): five callers drawn from a bank of about forty (BE-13), varied by account type, lever and what's on record, with a streak counter and one new pretext each month (HA-21). About 4 minutes.
- **Text route:** each call as a transcript with the caller card as a table; the verification actions as a list of buttons with their results described in text; the log as an accessible table with a "flag this row" action. Same decisions and record (BE-03).
- **Facilitated session:** a 45-minute service desk team meeting on one screen. Pause points: after the hook (*"Would we have moved it? What does our procedure actually say for executives?"*); after Jo (*"What could someone find about our executives in ten minutes?"*); after Rosa (*"What makes people skip checks here: targets, queues, fear of senior callers?"*); at the end (*"One change to our procedure, and who'll make it."*). The organisation's own procedure replaces Larkspur's on the cards (BE-05).
- **Replay and randomisation:** callers, pretexts and records come from the bank; the colleague who slips varies; the alert's details change; an outsourced-desk version adds a "client approval" step for privileged accounts. The annual edition adds the year's reported service desk techniques at awareness level.

## Alternative concepts

1. **The Long Con.** The attacker view first (EX-06, BE-11): the player sits with Jo Fairweather on an authorised test as she builds a caller's "answers" from public information, pinning cards to a board (no technique beyond reading). Then the roles flip, the player goes back to the desk, and the next call in the queue is Jo's. Strong lunchtime story; shorter on admin hygiene.
2. **Keys to the Castle.** A puzzle about access design rather than calls. The player rebuilds Larkspur's admin model on a board: tiers, separate accounts, time limits, break-glass, approved tools. A time skip then replays one phished account against their design and shows how far it gets. Good for system administrators; less for the desk.
3. **Desk Wars.** A team game show for service desk away-days (HA-13): teams take the same callers in turn on a shared screen, and the scoreboard rewards correct verification over speed, with a bonus for a polite refusal Owain would put on a poster.

## Art and audio

- **Rooms:** `room_IT` redressed as the desk (headsets, queue board, handling-time screen, the "Ask us first" mug); `room_security` and `room_office` as they are.
- **Characters:** Owain, Kai, Jo, Gillian, Martin and Kev use their course art. New: Rosa Delgado (art and voice).
- **UI:** MG-17's caller card and actions; the queue board; Jo's corkboard as a BE-08 image.
- **Voice:** about 40 lines for Owain, 15 for Kai, 10 for Rosa, 8 for Jo, 4 for the real Gillian (the whispered call back), 6 for the fake one (a different voice, airport ambience, phone filter through voice FX), 5 for the fake Sam, 4 each for Martin, Kev and Wes, and about 15 generic callers. No voiced line prints a variable: names, numbers and account details are on the caller card, not in speech. Phone numbers on screen come from Ofcom's drama range (07700 900000 to 07700 900999).

## Pitfalls

- **Don't train obstruction.** Every "no" comes with the fast route: the call back, the booking, the approved tool. Callers are colleagues.
- **Don't make the desk the villain.** Rosa is good at her job; the targets and the queue pushed her. The fix is the procedure and the backing, not blame.
- **Keep the procedure doable.** Every correct route must finish inside game time, or players learn that doing it right means failing the shift.
- **Don't teach unreliable cues.** The fake Gillian has no slip in her story; the voice, the answers and the airport noise prove nothing either way.
- **Awareness level only.** No detail on how callers spoof numbers, bypass MFA or abuse tools. The module shows what the desk sees and what stops it.
- **No real products.** "Inbox Genie", "Brightline Label Systems" and the remote tool are fictional; check names before release.
- **Don't let the bug ship.** If the `siem` dashboard is used, fix the `alertConfig` pass-through first, or players see hospital alerts on a facilities company's desk.
- **Video isn't proof.** Every video check in the module is paired with a second route.
