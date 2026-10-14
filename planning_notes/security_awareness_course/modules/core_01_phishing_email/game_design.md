# core_01 game design: Inbox Zero

## Concept

It is Monday morning in the player's second week at Larkspur. Their manager needs the week's delivery schedule sent out to the field teams by 10:00, and the schedule depends on an updated file from Northbeck Supplies, one of Larkspur's oldest suppliers. So the player has a real job to do in their inbox, against the clock, while the messages that matter to the job arrive alongside messages that only look like they do.

The module teaches through that tension. The phishing that works in real life arrives when you are expecting something like it: a "Northbeck" email when you are waiting for Northbeck, a "service desk" email in your second week when everything is new. The player learns to pause, check another way and report while still getting the schedule out on time, which is the habit we want them to take back to their own desk.

## Setting and cast

- **Rooms:** the Operations area of the open-plan office (`room_office`), the player's desk with a monitor, the kitchen (`room_break`) for an optional chat, and the security office (`room_security`) for Kai's behind-the-scenes scene. No new rooms.
- **Ama Owusu** (mentor) explains, and reappears if the player clicks something.
- **Leo Brennan** (desk neighbour) is chatty, clicks a phish during the Apply beat and asks the player what to do.
- **Kai Murray** (security analyst) thanks reporters in the team chat and shows what happens to a report.
- **Lena Fischer** (the player's manager, Operations Manager) appears only by email and chat in this module. A new minor character; she needs art only if a later module brings her on screen.
- **Northbeck Supplies** (fictional supplier): its real contact, Dawn at Northbeck, appears only by email and on a phone call if the player rings to check.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Mailbox almost full" (1 to 2 minutes)

- **(CP)** The player sits at their desk. The inbox (MG-01) opens with three messages: a welcome note from Lena, the canteen menu, and **"Action required: your mailbox is 98% full"** from "IT Service Desk", sent from a lookalike domain, with a "Re-validate mailbox" button.
- The player can do anything: read, hover, click, report, delete, ignore. Their first action on the phish is recorded as the **baseline** for C01-LO5.
- If they click the button, a fake sign-in page opens in the inbox's built-in browser panel with the in-game account already filled in and a **Sign in** button. The game never asks for a real password.
- Whatever they did, Kai posts in the team chat a minute later: *"Heads up, a fake 'mailbox full' email is going round. Thanks to the people who reported it, it's been pulled from 140 inboxes."*
- Branches into Learn:
  - **Reported it:** Ama stops by: *"Kai says you reported that one in your second week. Nice. Want to know what gave it away?"*
  - **Ignored or deleted it:** Ama stops by: *"You didn't fall for it, which is good. Reporting it is even better: it's how we pulled it from everyone else's inbox."*
  - **Clicked, did not sign in:** Ama: *"You clicked, then stopped. Good instinct. Let's report it and I'll show you what to look for."* The player reports it with her.
  - **Signed in:** Ama calls: *"Saw the sign-in. No harm done if we move now."* She walks the player through the "if you clicked" steps (change the password through The Lark, tell the service desk), then into Learn. Tone: calm, practical, no blame.

### 2. Learn: "Anatomy of a phish" (3 minutes)

- **(CP)** Ama explains at the player's desk (EX-01), using the hook email as the worked example, shown in the conversation panel with highlights stepping through it (BE-08):
  1. What it asked for (your password) and how it made you feel (rushed, worried).
  2. The sender: display name versus actual address.
  3. The link: where it really goes, and how to read a web address from the right-hand end of the domain.
  4. The defence: **Pause. Check another way. Report.**
- She closes with one check question: *"Which part of this address is the real domain?"* (MG-20 single item).
- **Skip:** players can say *"I've done phishing training before."* Ama replies *"Then this'll take ten seconds,"* and goes straight to the check question. A wrong answer brings the explanation back.
- **Optional topics** in Ama's hub (each under a minute): *"What if I clicked?"* (the procedure), *"Can't MFA stop this?"* (session-stealing kits, in one breath), *"What does the security team do with my report?"* (leads to Kai's scene, below).

### 3. Practise: "Phish or Fine?" (3 to 4 minutes)

- **(CP)** A drill in the inbox (MG-01 practice mode, BE-07 for the stand-alone version). Ten emails, one at a time. For each, the player chooses **Report**, **Deal with it normally**, or **Check another way** (which opens the directory, The Lark or a colleague to confirm). Feedback is immediate: the clue highlighted, the right route, one line of why.
- The ten get harder:
  1. Bulk parcel-delivery phish with a shortened link.
  2. Fake "shared document" from an unknown external sender.
  3. Lookalike domain: `larksper.co.uk`.
  4. Decorated domain: `larkspur.co.uk.account-verify.net`.
  5. A **genuine** IT notice about planned maintenance, announced on The Lark. (Reporting it gets *"Fine to report if unsure. This one was real: here's how you could have checked."*)
  6. A callback phish: a fake software renewal invoice with a phone number to cancel.
  7. A link pointing at a real file-sharing service, from a stranger, about "invoice 2231".
  8. A **genuine** email from Lena with an attachment she mentioned in person yesterday.
  9. "Chief Executive" asking everyone to fill in a survey by noon.
  10. A reply inside a real thread with a known supplier, asking you to sign in to a "secure portal" to see a document.
- Three items include the link and domain drill inline (MG-03): pick the real domain out of the address.
- Getting several wrong in a row brings Ama back for a one-line nudge, never a lecture.

### 4. Apply: "The 10:00 deadline" (6 to 8 minutes)

- **(CP)** Lena's chat: *"Can you get the delivery schedule out to the field teams by 10? Northbeck are sending an updated file this morning."* A work task bar appears (BE-18): **Get Northbeck's schedule → Check it against last week's → Send it to the field teams.**
- The inbox fills over about six minutes of game time with around twelve messages, scheduled as interruptions (BE-18). Most are ordinary work. Four are threats, drawn from the bank (BE-13), one from each slot:

| Slot | What arrives | What it tests | Best response |
|---|---|---|---|
| **Expected sender** | "Northbeck Supplies" from `northbeck-supplies.co` (the real one is `northbeck.co.uk`): "Updated schedule: view online", link to a sign-in page. Arrives before the real file, while the player is waiting for it. | Lookalike domain under pressure | Report; wait for or ask for the real file |
| **Hijacked thread** | A reply from Dawn's **real** address inside last week's real thread: "Our new portal: please sign in to download the updated schedule." | Judging the request when the sender is genuine | Check another way: call Northbeck on the number in the supplier directory. Dawn says she sent no such email. Then report |
| **Authority and social proof** | "From the Chief Executive" to all of Operations: "Complete the staff wellbeing survey by 12:00. 80% of your colleagues already have." Link to a form asking for network sign-in. | Authority, urgency, social proof | Report; check The Lark (no such survey listed) |
| **Callback** | "Your PDF Pro subscription has renewed: £399.99 charged. To cancel, call 0800 ..." | Call the number in the message | Report; don't call. Any real subscription is checked through the service desk |

- **The genuine schedule** arrives from Dawn's real address with an expected attachment, mid-way through. Opening it is correct; the task can't finish without it.
- **Leo's slip.** About two-thirds of the way through, Leo leans over (or sends a chat): *"Did you get the Northbeck portal one? I signed in before I noticed the address. Do I need to say anything?"* The player chooses:
  - *"Report it now and ring the service desk. They'll sort it."* (Best: Leo reports, Kai locks his account, nothing spreads.)
  - *"Change your password and keep an eye on it."* (Partly right: he changes it but doesn't report; the debrief shows the session the attacker already had.)
  - *"Delete it. Least said."* (Leo keeps quiet; consequence below.)
- **Consequences** play out inside the module:
  - Each report gets a thank-you in the team chat from Kai, with what it achieved ("pulled from 38 inboxes", "blocked the fake site").
  - If the player signs in on any fake page, twenty game-minutes later the player's own account starts sending the same phish to colleagues (BE-16 short scene: the sent folder fills). Ama calls. Reporting at that point still contains it, and the debrief credits the late report.
  - If Leo isn't told to report, at the end of the module Kai finds his account sending invoices to Northbeck's other customers. Leo says: *"I thought I'd get in trouble."* Ama: *"You'd have been thanked. Now it's a bigger job."*
- **(CP)** The player sends the schedule. The task completes whatever they did with the threats; the debrief shows the security side.

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02), then Ama and Kai in the security office (or in the conversation panel for the text route).
- For each threat: a thumbnail of the email, what it was, the clue, what the player did, what checking another way would have looked like, and the outcome.
- The hook and the expected-sender phish shown side by side: "before" and "after".
- Kai's report board (EX-05, 30 seconds): how many people reported each email today, and how fast the first report came in. The player's reports are highlighted.
- Per-outcome results: Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"If it asks for your password, money or data, check another way. If in doubt, report it."*

### 6. Check (2 minutes)

- **(CP)** Kai's "spot check" on The Lark (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09): Pause, Check another way, Report; what to do if you clicked; where the Report button is in the organisation's own mail client (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook phish | Report / delete or ignore / click / click and sign in | LO5 (baseline), LO6 | Kai's chat message; Ama's opening line differs; sign-in leads into the "if you clicked" steps |
| Expected-sender phish | Report / open and sign in / wait or ask for the real file | LO2, LO3, LO5 | Thank-you and inbox pull; or the account-takeover scene |
| Hijacked thread | Check another way by phone / sign in / reply to ask "is this you?" | LO3, LO4 | Dawn confirms by phone; replying to the thread gets a reassuring answer from the attacker, which the debrief explains |
| Authority survey | Report / check The Lark / fill it in | LO1, LO3, LO5 | Pulled from inboxes; or the sign-in consequence |
| Callback phish | Report / call the number / ignore | LO3, LO4 | A call leads to a friendly "refund agent" asking for remote access; the player can still hang up and report |
| Leo's slip | Report and call / change password only / keep quiet | LO5, LO6 | Leo's outcome at the end |
| Genuine emails | Open / report / ignore | LO3 (calibration) | Reporting a genuine email is thanked, with a tip on how it could have been checked |

No option shames the player. The worst branch (signing in and saying nothing) still ends with Ama helping, and the debrief frames it as "this is how most real incidents start; this is what reporting would have changed".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-01 Inbox** | new | The whole module. Needs: message list with unread state, reading pane with sender name and address visible on click, link hover showing the real destination, attachments, a built-in browser panel for fake sign-in pages (pre-filled, never real credentials), Report button, reply and forward, scheduled arrivals, events emitted for every action |
| **MG-03 Link and domain drill** | new | Inline in three practice emails |
| **MG-20 Knowledge check** | new | Ama's check question and the final spot check |
| `phone-chat` | existing | Team chat with Lena, Leo and Kai (or a chat-app skin from MG-05 later) |
| `person-chat` | existing | Ama at the desk, Leo leaning over, Kai in the security office |
| MG-04 Voice calls | new (P2) | Calling Northbeck on the directory number; calling the callback number. Until MG-04 exists, these can run as phone NPC conversations in `phone-chat` |
| `notes` / `text-file` | existing | The supplier directory and The Lark's survey list, as in-world documents |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Anatomy of a phish | Ama (EX-01) | 90 seconds | The hook email with four highlights stepped through; an address with the domain highlighted | "Which part is the real domain?" |
| What if I clicked? | Ama (EX-01) | 45 seconds | The four steps from the reference card | none (procedure is assessed in Apply) |
| Can't MFA stop this? | Ama (EX-01) | 30 seconds | A three-box diagram: you, fake site, real site | none |
| What happens to a report | Kai (EX-05 scene) | 45 seconds | The report queue; "pull from all inboxes" | none |
| Optional video: "Sixty-second phish" | Recorded in engine (EX-02) | 60 seconds | Plays on the meeting room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Ama and Kai:

1. The four threats and the hook, each with what it was, the clue, what the player did, what checking another way looked like, and the outcome.
2. The before and after: the hook against the expected-sender phish.
3. Leo's outcome, and why reporting fast mattered more than the click.
4. Per-outcome results.
5. The line to remember.

## Variants

- **Micro-drill:** "Phish or Fine?" on its own (BE-07): eight emails drawn from the bank, optional timer, streak counter, one new lure theme each month (BE-13, HA-21). About 3 to 4 minutes.
- **Text route:** each email shown as accessible text (sender name, address, subject, body; links as text with a "check where this goes" action revealing the destination). The same decisions, the same chat messages, the same debrief as text (BE-03).
- **Facilitated session:** the inbox on a shared screen; the team votes on each email in the Apply beat. Pause points: after the hook ("Who would have clicked? Be honest. Why?"), after the hijacked thread ("If the address is right, what else can you check?"), after Leo's slip ("What stops people reporting their own mistakes here?"). 45 minutes with discussion.
- **Replay and randomisation:** the bank holds about 60 emails tagged by slot, lever and difficulty. Each play draws a different set of threats and genuine emails, and fictional domains are generated per game, so colleagues can't pass on answers. The annual edition swaps in the year's common lures (tax season, AI tools, new parcel scams).

## Alternative concepts

1. **The Phish Tank (attacker view).** Jo Fairweather has been hired to run Larkspur's authorised phishing test and asks the player to help design it (EX-06, BE-11). The player picks a pretext from public information about a team, chooses levers (authority, urgency, curiosity) and sees which characters would probably fall for each and why. Then the roles flip: the test lands in the player's own inbox. Teaches the levers by using them. Kept at the level of pretexts and psychology; no technical delivery.
2. **Post Room.** An arcade take for the micro-drill, in the style of *Papers, Please*: emails arrive as envelopes on a conveyor in the post room, and the player stamps them DELIVER or REPORT, checking each against the supplier directory and the staff list pinned to the wall. Speeds up as the shift goes on. Fun and quick, but further from a real inbox, so better as a drill than as the main module.
3. **Inbox Defence (team mode).** A facilitated competition for a team-building session: small groups each play the Apply beat on their own screen, and Kai's report board shows which team reported first and with the fewest misses. Good for security champions' events in Hacktivity (HA-13).

## Art and audio

- **Rooms:** existing office, kitchen and security office.
- **Characters:** Ama, Leo and Kai need their own art (shared with many modules). Lena appears by email and chat only.
- **New UI art:** the inbox (MG-01) and its browser panel, in the game's pixel style but legible at small sizes; email avatars for senders.
- **Voice:** about 40 lines for Ama, 10 for Kai, 10 for Leo. No voiced line prints a variable (the player's name, the organisation's name, counts). Kai's counts ("pulled from 140 inboxes") are on-screen chat text, not speech.

## Pitfalls

- **Never ask for a real password.** Fake sign-in pages come pre-filled with the in-game account and have a Sign in button. Say so in the game's opening.
- **Never use a real domain.** Every domain in the bank must be checked as unregistered or reserved, and links must not work outside the game.
- **Don't teach spelling mistakes as the main clue.** The hijacked thread and the expected-sender phish are designed to be caught only by the request and by checking another way.
- **Don't punish over-reporting.** Reporting a genuine email is thanked, with a tip. People who are afraid of being wrong stop reporting.
- **No gotchas.** Every threat in Apply must be catchable with the procedure taught in Learn and practised in Practise.
- **Keep the deadline gentle.** The 10:00 clock adds realism, not stress: it can't be failed, and BE-04 lets players turn the clock display off.
- **Don't imply the attacker is clever and the victim stupid.** Leo is likeable and competent; he was busy and expecting that email.
