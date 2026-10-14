# core_02 game design: The Caller

## Concept

The Operations team is in a monthly meeting all morning, so the player is asked to cover the phone line and log the delivery queries that come in from schools and care homes. It is an ordinary, slightly dull job: answer the phone, take the details, tick the query off a list. That ordinariness is the point. Most callers that morning are exactly who they say they are and want a simple answer. A few are not, and they arrive in the same queue, using the same friendly voice, on a line the player has been told to answer helpfully. The player learns to stay helpful to real callers while spotting the handful who want a code, a payment, remote access, or a quick favour, and to check back before acting, all without being rude to the school business manager who genuinely needs next week's schedule.

The hook is a cold open with a twist the player can see: "Owain from IT" rings about a security alert on the account and asks the player to read back the code that has just arrived and to install a quick support tool. The twist is that Owain is standing in the kitchen with a cup of tea, in view. The player can walk over, or ring his real extension, and the whole thing unravels. That image, the caller who is not where they say they are, carries the module's one big idea: check back on a route you already trust.

## Setting and cast

- **Rooms:** `room_office` (the Operations phone desk, the player's base for the morning), `room_break` (the kitchen, where Owain really is, and where a QR sticker sits on the coffee machine), `room_reception` (Maureen, and the side-door visitor), `room_security` (Ama's explainer and Jo's debrief). No new rooms.
- **Ama Owusu** (mentor) explains the channels and levers and hands over the bingo card.
- **Maureen Gallagher** (receptionist) is the building's best social-engineer spotter; she unpicks Jo's recorded test call.
- **Owain Jenkins** (IT) is the impersonated caller at the hook, and is cheerfully findable in the kitchen.
- **Jo Fairweather** (ethical social engineer, Northlight Security) gives the attacker view: a recording of an authorised test call she made to reception last year. Authorised test only; she always says what would have stopped her; nothing is a how-to.
- **Gillian Marsh** (Chief Executive) is impersonated by a chat message from a new number.
- **New minor characters (voice and generic sprite only):** Priya Oduya, a genuine school business manager who rings about a real delivery; Dawn at Northbeck, by phone, who confirms she sent nothing. Lena Fischer sets the task by chat.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "It's Owain from IT" (1 to 2 minutes)

- **(CP)** The player settles at the phone desk. Lena's chat: *"Thanks for covering the line. Just log the delivery queries, I'll be out by twelve."* The phone rings (MG-04, or a `phone-chat` call until MG-04 exists).
- The caller: *"Morning, it's Owain from IT. We've flagged a sign-in on your account from abroad. I've pushed a code to your phone, can you read it back so I can confirm it's really you? And I'll pop a support tool on to secure the laptop."* The phone shows a six-digit code arriving.
- The player can do anything: read the code and agree to the tool, refuse, ask a question, hang up, or check (walk to the kitchen, or ring Owain's directory extension). The first action is the **baseline** for C02-LO4.
- Whatever they choose, the thread resolves kindly. If they check, they find Owain in the kitchen: *"Me? I've not called anyone. I'm on my second brew. Good that you checked, though. That's exactly it."* If they shared the code, Owain is still in the kitchen, and Ama arrives: *"Someone used my name. Happens a lot. You're not in trouble; let's lock it down and report it."* No fake page ever asks for a real password or a real code.
- Into Learn.

### 2. Learn: "Same con, different doorbell" (3 minutes)

- **(CP)** Ama explains at the desk (EX-01), using the hook call as the worked example and visual aids (BE-08):
  1. The channels: a call, a text, a chat message, a QR code, a visitor; same fraud as a phishing email.
  2. Why a number or a familiar name proves nothing (spoofing, new "it's me" numbers).
  3. The requests that mean stop: a code, remote access, a payment, information, an urgent favour.
  4. The defence: **Pause. Check back on a number you already have. Never share a code. Report.**
- She hands over the **social engineer bingo card** (BE-22, or the notes UI): a grid of tactics (authority, urgency, fear, helpfulness, flattery, insider jargon, "new number", "wants a code", "wants remote access", "wants a payment", "QR code", "keep it quiet"). The player ticks each as they hear it in the Apply beat.
- Check question (MG-20): *"A caller says they are from your bank and the number on your phone matches the bank's. What is the safest next step?"* Answer: hang up and call the number on the back of your card (or 159).
- **Skip:** experienced players say *"I know this one."* Ama: *"Then you'll fill the bingo card fast."* Straight to the check question; a wrong answer brings the explanation back.

### 3. Practise: "Caller or Con?" (3 to 4 minutes)

- **(CP)** A drill (MG-04 and MG-05 practice, BE-07 for the stand-alone micro-drill). Eight short contacts, one at a time. For each the player chooses **Deal with it normally**, **Check back** (opens the directory or a known number), or **Report**. Feedback is immediate: the lever named, the right route, one line of why.
- The eight, getting harder:
  1. A genuine school asking when next week's delivery arrives (answer normally).
  2. A text: "Your parcel could not be delivered, pay 1.99 pound to reschedule" with a link (report; forward to 7726 at home).
  3. A caller "from the bank fraud team" wanting you to move money to a "safe account" (hang up, call 159 or the card number).
  4. A chat from "Gillian" on a new number: "In a meeting, need you to sort something quietly" (check back on her known number).
  5. A genuine delivery driver calling from the gate (answer normally: calibration).
  6. A caller "from IT" wanting you to install AnyDesk so they can "clear a virus" (refuse, report; genuine IT does not cold-call for this).
  7. A QR code texted "to confirm your details for the staff benefits portal" (do not scan; check The Lark).
  8. A caller who already knows your manager's name and the finance system, asking you to confirm a supplier's bank details (check back; information plus insider jargon is the warning, not reassurance).
- Getting several wrong in a row brings Ama back for a one-line nudge, never a lecture. Over-caution on the genuine callers is met with "no harm in checking; this one was real, and here is the quick way you could have told".

### 4. Apply: "Covering the line" (6 to 8 minutes)

- **(CP)** The work task bar (BE-18): **Log the morning's delivery queries** (a short queue of schools and care homes). Genuine queries arrive and are ticked off; the task cannot be failed by the threats.
- Over about six minutes, contacts arrive on different channels, scheduled as interruptions (BE-18), drawn from the bank (BE-13). Most are ordinary. Each threat is one slot:

| Slot | What arrives | What it tests | Best response |
|---|---|---|---|
| **Vishing: authority + code** | "IT Security" calls about a "mailbox migration" and needs the code now to "keep your email working". | Refusing to read a code, however official | End the call; report. Never read the code |
| **Vishing: tech support** | An outside caller says the laptop is "sending error reports" and wants to install a support tool and take a small payment. | Remote access and payment to a cold caller | Hang up; report. Do not install anything |
| **Smishing** | A text: "HMRC: you are due a rebate, confirm your details" with a link. | A link and personal data by text | Do not tap; report; 7726 at home |
| **Chat impersonation** | "Gillian" on a new number: "Can you buy three 100 pound gift cards for a client thank-you? I'll expense it. Keep it to yourself." | A new-number favour, secrecy, money (nods to core_11) | Check back on Gillian's known number; report. Do not buy |
| **Quishing** | A sticker on the coffee machine: "Join the free coffee club, scan here." MG-06 shows the real destination is a sign-in page on a lookalike domain. | Judging a QR code before scanning | Do not sign in; report the sticker to facilities |
| **Pretext at the door** | A friendly visitor at the side door "from the printer company, here for the quarterly service", name-dropping and using jargon, who wants to be pointed to the print room and left to it. | A believable story and insider jargon | Direct them to reception to sign in and be escorted (point to core_10); report if pushy |

- **A genuine call mid-way:** Priya, a school business manager, rings with a real query and a real deadline. Handling her well (politely, taking the details, not over-interrogating) is scored as calibration (C02-B7). The directory confirms her school if the player checks.
- **The "Northbeck accounts" call:** a caller chasing a payment and offering "updated bank details". This belongs to core_11, so keep it light: the right move is not to action any change by phone, to say it goes through the finance process, and to verify Northbeck on the directory number (Dawn confirms she called about nothing). A line points the player to core_11 in the debrief.
- **Consequences** play out inside the module:
  - Each report earns a thank-you in the team chat from Kai or Ama, with what it achieved ("warned the floor about the fake IT caller", "facilities pulled three of those stickers").
  - If the player reads out the code or installs the tool, a short time-skip scene (BE-16) shows the account being used to message colleagues, then Ama's calm call: reporting now still contains it, and the debrief credits the report.
  - If the visitor is left unescorted, a line in the debrief notes what a real tester would have reached, and points to core_10, without blame.
- **(CP)** At the end of the morning the queries are logged and the team comes back from the meeting. The debrief shows the security side.

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02), then Ama and Jo in the security office.
- The **bingo card** is scored: which tactics the player spotted, shown against the ones that were actually used.
- Each threat replayed: the channel, the lever, what the player did, and what checking back would have looked like.
- **Jo's recorded test call (EX-06, EX-05):** Jo plays a recording of an authorised test she ran on reception last year, posing as the fire-alarm company needing the panel code "for Monday's inspection", leaning on urgency and jargon. Maureen explains how she caught it: *"I said I'd ring your firm back on the number on our contract. You told me not to bother, we were busy. That's when I knew."* Jo closes: *"One call back on a number I didn't give her, and I'm finished. That's all it takes."* Authorised test; the defence is always named; no method is taught.
- Per-outcome results: Secure, Developing, Not yet.
- **The line to remember:** *"If a call or a message wants a code, a payment or a favour, check back on a number you already have."*

### 6. Check (2 minutes)

- **(CP)** Kai's spot check on The Lark (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark reference card (BE-09): Pause, Check back, Never share a code, Report. The organisation's own reporting route, and the home lines (7726, 159, Report Fraud; Police Scotland 101).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook "IT" call | Read the code and install the tool / refuse / check back | LO2, LO4 (baseline) | Owain found in the kitchen; or the account-use time skip and Ama's help |
| Vishing authority + code | End and report / read the code / stay on and argue | LO1, LO4, LO6 | Thank-you and floor warning; or the time skip |
| Tech support scam | Hang up and report / install the tool / pay | LO2, LO4 | Reported and blocked; or a "refund" call-back asking for more |
| Smishing | Report / tap the link / reply | LO1, LO6 | Pulled and warned; or a fake sign-in (no real credentials) and a tip |
| Chat impersonation (Gillian) | Check back on known number / buy the cards / reply on the new number | LO2, LO3 | Gillian confirms she sent nothing; replying gets a smooth answer from the attacker, explained in the debrief |
| Quishing sticker | Report to facilities / scan and sign in / scan and leave | LO5 | Stickers pulled; or the lookalike page and a tip |
| Door pretext | Send to reception and report / point them to the print room / fetch what they ask | LO1, LO2 | Signed in and escorted; or the core_10 pointer |
| Genuine callers | Help them / over-interrogate / refuse | LO3 (calibration) | Helping is scored well; being rude to a real caller gets a gentle note |

No option shames the player. The worst branch (sharing a code) still ends with Ama helping and the debrief framing it as "this is how most of these start, and reporting is what changes the ending".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-04 Voice calls** | new | The core of the module. Ringing phone, answer or decline, a directory to call back on a known number, hold and transfer, events on every action. Until it exists, run calls as `phone-chat` NPC conversations |
| **MG-05 Messaging apps** | new | The parcel and HMRC texts and the "Gillian" chat; SMS and chat-app skins on `phone-chat`, unknown numbers, links |
| **MG-06 QR code scanner** | new | The coffee-machine sticker: scan, reveal the real destination, choose to open or not |
| **MG-20 Knowledge check** | new | Ama's check question and the final spot check |
| `person-chat` | existing | Ama, Maureen, Owain, Jo, the door visitor |
| `phone-chat` | existing | Calls, texts and the chat app; `timedMessages`, terminal theme, TTS voice messages |
| `phone` voicemail object | existing | Jo's recorded test call (type `phone` with `voice` and `ttsVoice`) |
| `notes` / `text-file` | existing | The staff directory and The Lark's benefits-portal page, as in-world documents to check against |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Same con, different doorbell | Ama (EX-01) | 90 seconds | The hook call; the levers grid; the bingo card | "A caller says they are from your bank and the number matches: what next?" |
| Never share a code | Ama (EX-01) | 30 seconds | A code on a phone with a red "do not read aloud" mark | none (assessed in Apply) |
| Jo's test call | Jo and Maureen (EX-06, EX-05) | 60 seconds | The recording; Maureen's "I'll ring you back" line | none |
| What happens to a report | Kai (EX-05 scene) | 30 seconds | The report queue; "warned the floor" | none |

## Debrief

Shown on BE-02, then spoken by Ama, Maureen and Jo:

1. The bingo card score: tactics spotted against tactics used.
2. Each threat: channel, lever, what the player did, what checking back looked like, the outcome.
3. Jo's recorded test call and what would have stopped her.
4. The genuine callers, and that helping them well is the job.
5. Per-outcome results and the line to remember.

## Variants

- **Micro-drill:** "Caller or Con?" on its own (BE-07): six short contacts drawn from the bank, optional timer, one new theme a month (a seasonal parcel scam, a tax-season call). About 4 minutes.
- **Text route:** each call and message as accessible text (who, number shown, what they want), with a "call back on a known number" action that reveals the real person. The QR item shows the code's destination as text. Same decisions, same bingo card, same debrief (BE-03).
- **Facilitated session:** the phone line on a shared screen; the team decides each contact. Pause points: after the hook ("How would you check, right now, without being rude?"), after the chat impersonation ("What makes a 'new number' message so convincing?"), after Jo's recording ("What is our version of 'I'll ring you back'?"). About 45 minutes.
- **Replay and randomisation:** the bank holds callers, texts and chats tagged by channel, lever and difficulty; each play draws a different set, and numbers and names are generated per game so colleagues cannot pass on answers.

## Alternative concepts

1. **Switchboard (arcade drill).** For the micro-drill, a *Papers, Please* take: calls queue on an old switchboard and the player routes each one, Connect, Call back, or Flag, checking the caller against the directory and a "we will never ask you to" card pinned above the desk. Speeds up through the shift. Fun and quick, best as a drill rather than the main module.
2. **Build the pretext with Jo (attacker view).** The player shadows Jo as she plans a test call against a role, using only what is public about the team (a bridge to core_12). She shows how a manager's name and a system name turn a cold call into a convincing one, then the roles flip and a test call lands on the player. Teaches the levers by seeing them assembled. Kept to psychology and public information, never a how-to.
3. **The Favour (branching drama).** A single, slow-burn "new number" conversation that starts warm and ordinary and tightens into urgency and secrecy, with the player able to check back at any point. Good for showing how the "Hi, it's me" scam feels from the inside, and how one call back ends it.

## Art and audio

- **Rooms:** existing office, kitchen, reception and security office.
- **Characters:** Ama, Maureen, Owain and Jo need their own art (shared across modules). Gillian appears by chat only. Priya and Dawn are voice and generic-sprite only. Jo's look: 40s, mixed heritage (white British and Black Caribbean), ex-police, relaxed and funny.
- **New UI art:** MG-04 the calling screen and directory; MG-05 the message and chat skins; MG-06 the QR scanner and a reveal panel; the bingo card overlay.
- **Voice:** about 30 lines for Ama, 12 for Maureen, 10 for Owain, 10 for Jo, plus short lines for Priya and Dawn. No voiced line prints a variable (player name, organisation name, counts): the reporting numbers and the "pulled three stickers" counts are on-screen text, not speech. Jo's recorded test call is a fixed script.

## Pitfalls

- **Never ask for a real code or password.** The hook shows a code arriving but never asks the player to type a real one; fake pages are pre-filled with the in-game account.
- **Do not teach a how-to.** Jo's attacker view stays at "this is how little I need" and always ends with the defence. The recording is a fixed, non-instructional script.
- **Do not make caller ID the lesson.** The point is that a right-looking number proves nothing, so the teaching cue is "check back", not "watch the number".
- **Keep the genuine callers genuinely helpful.** If every caller is a trap, players learn to be rude to real people. Calibration callers are rewarded for good service.
- **Mind the boundaries.** Payments and bank-detail changes point to core_11; the physical door points to core_10; MFA setup points to core_03; deepfake voices point to core_15. Keep each light and signpost it.
- **No gotchas.** Every threat is catchable with Pause, Check back, Report, as taught in Learn and drilled in Practise.
- **Calm, not scary.** The pushy caller is firm, not a cartoon villain; the fix is always one simple action.
