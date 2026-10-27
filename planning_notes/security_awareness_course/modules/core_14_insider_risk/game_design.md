# core_14 game design: Notice Period

## Concept

The frame is the built one: a training room at Quayholt Insurance (fictional), a kiosk, and the host Anjali Rao, the information security analyst. The scope note sets the week: *"Authorised exercise. It's a leaver's last week. In scope: your own choices, and what you notice. You are not being asked to investigate anyone."*

This is a **consequence-flip** episode: the learner's own habits are most of the topic, so there is no write-a-phish beat. The week is compressed into a short sandbox. An account manager, Ross, is leaving on Friday to a competitor: liked, generous with the biscuits, and quietly sure the clients are "his". A colleague, Samira, is having a strange week (in early, on the phone in the stairwell, visiting HR), and the office has decided she's leaving with Ross and taking the client list. The learner's job is not to solve anything. It is to keep their own access to themselves, report what is offered to them, notice what they actually see, and pass facts to the right person while staying fair, including to the colleague the whole office is whispering about.

The learner can take the ordinary shortcuts in the sandbox (lend a login, nibble at an offer, join the rumour). The flip shows the chain each one started. The defend half then drills the recognising-and-reporting behaviours, and a short "raise a concern" step rewards facts over conclusions. The debrief is the built one; the fair-concern line lands at the end.

## Setting and cast

- **Room:** the Quayholt training room (`room_aw_quayholt` type), with the kiosk and the host spot. The week plays out in the desktop, chat and phone overlays; no new room.
- **Host:** Anjali Rao, information security analyst, who welcomes the learner, runs the teaching through the per-item feedback, and takes the concern.
- **Cast (proposed, consistent with `BRAND_SET.md`; surname clash check before release):**
  - **Ross Garside**, senior account manager, on his notice period; liked, passed over last spring, joining a competitor, not a villain ("they're my contacts").
  - **Samira Haddad**, a long-serving colleague; the false lead, whose father is in hospital this week.
  - **Craig Pickering**, a colleague who loves a theory; he is the rumour, not malicious.
  - **Reuben Ofori** (Quayholt, from E3) as the locked-out colleague who asks to borrow a login.
  - an **HR partner** and a **DPO** as concern routes; a **line manager** who sets the work by chat.
  - **"Alex, Talent Partner"**, an unknown contact on a messaging app: text only, never voiced, a smiling stock-style avatar.

Larkspur and its cast (Ama Owusu, Mei Lin Zhou, Tomasz Wiśniewski, Leo Brennan, Martin Fletcher, Kai Murray, Lena Fischer, Owain Jenkins) are retired or remapped onto the Quayholt cast above. The mentor's teaching moves into the host's welcome, the per-item feedback and the debrief. The intranet is generic.

## Structure

The sandbox is unscored; only the defend half is scored, under the `awareness` profile.

### Brief and scope note (1 minute)

Anjali welcomes the learner and states the scope, including the line that they are not being asked to investigate anyone. The work task bar shows ordinary jobs for the week.

### The week (sandbox, 4 to 5 minutes)

The everyday choices arrive inside the work. For each, the learner chooses; nothing is scored yet.

- **The login (the counterpart of the leaver's last-day request).** Reuben is locked out, a report due at ten: *"Can I just use yours? Two minutes."* The learner can ring the service desk with him, say no, or log in for him.
- **Ross's screen.** Walking past, the learner can see a copy running to a folder called "RW personal". They can note it, say something to Ross, search his desk, or photograph the screen.
- **Craig's theory.** At lunch Craig floats that Samira is leaving with Ross and taking the client list. The learner can add to it, deflect, point Craig to the right route, or say nothing.
- **The offer.** At home, an unknown contact: *"We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?"* The learner can screenshot and report without replying, reply, block and delete, or ask how it would work.
- **The prompt storm.** Later that night, sign-in approval prompts arrive one after another (the authenticator demo). Deny them all and ring the service desk, deny and report in the morning, or approve one.
- **Ross's favour and his last-day login request.** Ross asks the learner to export his accounts to his personal email "for the handover", and, on his last day, to log in for him because his access has gone.
- **Samira.** The learner can offer a kind word, tell her manager privately they seem to be having a hard week, report her as a suspect, or ask her outright if she's going with Ross.

### Flip: the chain (1 to 2 minutes)

A short montage shows where each choice led, with the learner's own choices marked:

- a shared login opens the HR drive "under your name" when Reuben clicks the wrong shortcut (harmless, but on the record until explained);
- an engaged offer draws more pressure and the prompt storm;
- a rumour reaches Samira, who has been at the hospital every night;
- a kind word and a fair concern lead to a discreet resolution: the copies are recovered, Ross signs to say so, and nobody is humiliated.

### Defend (3 to 4 minutes)

Scored under the `awareness` profile, Report always visible:

- **The offer message** (`sms` or email card): Report without replying.
- **The shared-login request** (`call` or email card): decline and route to the service desk; refusing a genuine locked-out colleague without offering the safe route is worth fewer points.
- **Unexpected sign-in prompts** (`push` cards): Deny and report (tell `unrequested_mfa_push`).
- **A leaver's favour** (email card): decline and route; never export data to a personal address.
- **"Raise a concern":** a short form built from fact chips the learner noticed (what, when, where, who) and conclusion chips from the week ("Ross is stealing", "Craig thinks Samira's involved"); the feedback favours facts and flags conclusions, and offers a route (security team, manager, HR, Speak Up line, DPO). Posting it in the team chat instead counts as spreading it, not raising it.

### Debrief (1 to 2 minutes)

The built debrief view:

1. A per-item reasoning card for each defend item, including a "seen, said, true" row for Samira (seen: in early, calls in the stairwell, visits to HR; said: "going with Ross"; true: her father was in hospital).
2. Feedback on the genuine items (the real locked-out colleague, an honest concern that turned out to be nothing).
3. The **team protected** tally.
4. **The habit to keep:** *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* (The debrief adds the plain line: *"Your login is you. Offers get reported. Concerns go to the right person, as facts."*)
5. The **"On Monday"** card: who, here, you would tell if you noticed something.
6. The reporting route (`slot:customer_report_route`).
7. The no-blame line: a well-made offer or a plausible rumour fools decent people; raising an honest concern that turns out to be nothing is never a failure.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Reuben's login (C14-B1) | Ring the service desk with him / say no / log in for him | C14-LO2 | The service desk fixes it; or the HR drive opened under the learner's name |
| Samira's week (C14-B2) | A kind word / a private word to her manager / report her as a suspect / ask if she's going | C14-LO3, LO6 | Samira's Friday line; Anjali's private, kind correction |
| Craig's theory (C14-B3) | Add to it / deflect / point to the right route / say nothing | C14-LO5, LO6 | How far the rumour travels, and whether it reaches Samira |
| Ross's screen (C14-B4) | Note it / say something / search his desk / photograph it | C14-LO3, LO5 | Searching or photographing is explained in the debrief (the photo put customer data on the learner's own phone) |
| The offer (C14-B5) | Screenshot and report / reply then report / block and delete / ask how it works | C14-LO4 | The chain of pressure; the debrief shows the same message reached others |
| The prompts (C14-B6) | Deny and ring now / deny and report in the morning / approve one | C14-LO4 | The account paused and reset; or a sign-in to contain |
| Ross's favour (C14-B7) | Ask what the handover needs / to his work email / to his personal email | C14-LO2, LO3 | If sent to personal email, it becomes part of the chain |
| Raising the concern (C14-B8) | A proper route by Thursday, as facts / late / as conclusions / only the team chat | C14-LO5 | The discreet resolution; or the late consequence |
| Ross's last-day login (C14-B9) | Say no and point to HR / say no / log in for him | C14-LO2 | The debrief shows what Ross opened under the learner's name |

No option shames the player. Ross is not a monster and Craig is not malicious; Samira is never punished for being suspected, and the learner is never punished for an honest concern that turns out to be nothing. The only behaviours the game marks down are the ones that harm people: sharing access, engaging with criminals, investigating colleagues and spreading rumours.

## Minigames

| System | Status | Use here |
|---|---|---|
| Inbox triage (`awareness` profile) | built | The offer, shared-login, prompt and favour cards; Report always visible |
| Influence global and thresholds | built | How Ross and Samira respond to the learner |
| MFA authenticator demo | built (E3's `mfa` stage) | The night-time prompt storm, one decision |
| Consequence flip (montage) | built | The chain, driven by the learner's choices |
| Awareness-measure records | built | Per-item id, verdict, chips, score, stage and time |
| "Raise a concern" fact-chip form | new (small) | What, when, where, who; conclusions flagged; a route picker |

The night-shift insider deduction board of design 12 use case B is a separate, later, richer build on the intel board, not part of this episode.

## Explainers

- A short panel on the **spectrum of intent** (accidental, careless, deliberate), with three examples.
- A short panel on **whistleblowing or leaking** (protected routes against leaking), opened also by Ross's "I'm a whistleblower" claim.

No video. No runtime language model. The offer message, the replies and the feedback are authored data or ink.

## Debrief

The built episode debrief, as set out under "Structure" above: a reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and the no-blame line.

## Variants

- **Defend-only variant** (`variant: "defendOnly"`, about 8 minutes): brief, defend, debrief. It keeps the same defend set and the concern step, so the measurement is unchanged; it drops the week-long sandbox and the chain montage.
- **Pre and post checks:** general role forms (AB and BA). Insider-risk items (an outside offer, a shared-login request, a fair-concern wording, a rumour) join the general check pool as mirror pairs; see `assessment.md`.
- **Facilitated session:** the `facilitated` flag; the team votes at each choice. Pause points after the login, the rumour, the offer and the favour. Facilitators get a note on handling the topic sensitively, because people in the room may have raised concerns, or been the subject of them.
- **Replay:** who is leaving and from which team, what they take, the false lead's real reason, and the channel of the offer all draw from a bank.

## Alternative concepts

1. **Whisper Network.** The office as a network of desks: a rumour starts and changes as it is retold; the learner chooses who to tell, what to say, and whether to pass a fact to the right person. Score: how much truth reached someone who could act, against how much rumour reached everyone. Playful; best for the defend-only shell and team sessions.
2. **Two Desks.** The learner alternates between Ross (feeling passed over, told to "bring his book") and the colleague who notices, showing how a decent person talks themselves across a line in small steps, and where a word would have stopped him. Builds empathy; strongest facilitated.
3. **The night shift (design 12 use case B).** One of four staff let an intruder in; the learner weighs evidence against a published insider profile and raises a report. The richer, later deduction-board version; noted, not built here.

## Art and audio

- **Room:** the Quayholt training room; no new room.
- **Characters:** Anjali (host) and the proposed cast need the Quayholt cast art (CSS wordmark and placeholder sprites until PixelLab art is approved). The talent partner needs only a chat avatar.
- **Voice:** text to speech. No voiced line prints a variable: times, file names and the organisation's details are on screen only.

## Pitfalls

- **Don't build a culture of watching each other.** The episode never rewards snooping, never shows a "suspicion meter", and never asks the learner to investigate. The temptations to search a desk or photograph a screen exist so they can be explained, not used.
- **Don't make stress a risk factor to be watched.** Every mention of grievance, debt or illness comes with support. Samira's thread teaches kindness and fairness.
- **Watch the casting.** Who is suspected and who is guilty must not echo stereotypes; the gossip is likeable and ordinary, and the debrief notes that rumours tend to land on people already under strain.
- **Keep the law light and right.** The whistleblowing summary follows `concepts.md` and points to the protected routes; it is not legal advice.
- **No how-to in the offer.** The talent partner offers money and asks for "access"; nothing technical is ever explained.
- **No real names in the game.** Real cases stay in `concepts.md` and the field guide.
- **Respect confidentiality.** The learner sees only a discreet resolution.
- **No gotchas.** Samira's innocence is easy to find with a kind word, and an honest concern about her is handled kindly, never marked as a failure.
