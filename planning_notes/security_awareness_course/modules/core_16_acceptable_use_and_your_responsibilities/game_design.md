# core_16 game design: Small Print

## Concept

Lunchtime at Larkspur. The acceptable use policy has just been updated, everyone has to sign it off again, and Ama knows that most people will click "I agree" without reading a word. So she and Owain have hijacked Owain's monthly kitchen quiz: this month it's a game show, **Allowed, Not Allowed, or Ask First?**, with three novelty buzzers, a whiteboard scoreboard and a cardboard Golden Lanyard on top of the fridge. The player is pulled in as a contestant alongside Leo, Martin and Kev.

The module teaches the rules through everyday "can I?" questions, and the reasons through the banter: Martin buzzes "Allowed" for everything ("It is if nobody finds out"), Kev buzzes "Not allowed" for anything with a computer in it and wins the questions about people, and Leo finds out mid-round that his office photo had the whiteboard in it. Every answer comes from the organisation's own policy (HA-11), so the same show teaches a council's rules to the council and a retailer's to the retailer. Back at the desk, two situations the show didn't cover turn up without warning. Then the player reads the five-point summary of the real policy on The Lark and signs it off, or asks a question first, and the platform records it (HA-07).

The thing a player would tell someone at lunch: "Ask first is never the wrong answer. It's worth points."

## Setting and cast

- **Rooms:** the player's desk on the Operations floor (`room_office`) and the kitchen (`room_break`), dressed for the show: tables pushed back, the whiteboard as a scoreboard, three buzzers on a table (green **Allowed**, red **Not allowed**, amber **Ask first**, each with a label and an icon as well as a colour), bunting, and the Golden Lanyard. No new rooms.
- **Hosts:** **Ama Owusu** (warm, precise, reads the policy section aloud) and **Owain Jenkins** (relaxed, dad jokes, works the audience).
- **Contestants:**
  - **Leo Brennan:** wants everything to be allowed; learns live that his "new office" photo showed the whiteboard.
  - **Martin Fletcher** (Sales Director, king of workarounds): buzzes Allowed on everything and is a good sport about it. He comes round by the end.
  - **Kev Sutcliffe** (Warehouse Supervisor, hearing aids): buzzes Not allowed on anything with a computer, wins the "Who do you ask?" round. The buzzers light up as well as sound, and the show is captioned; Owain: *"Light's on for you, Kev."* Nobody makes anything of it.
- **Guest adjudicators:** **Tomasz Wiśniewski** (DPO) for "Fact or myth?" on monitoring, and **Mei Lin Zhou** (HR Business Partner) for one card on mistakes and misuse.
- **By chat or email:** Lena Fischer (the player's manager); Anjali Mistry, business manager at Hollins Lane Primary School, a Larkspur client (new minor character: 40s, British Indian; email only, so no art needed).
- **The audience:** staff with sandwiches, generic office sprites, with barks ("Ooh!", "He's never getting that one").

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Can I stream the match?" (1 minute)

- **(CP)** 12:25 at the desk. Leo swivels round: *"There's a match on at one. Can I stream it on my work laptop? You've read the policy, right?"*
- The player answers before anyone has told them anything:
  - *"Course you can. It's lunch."*
  - *"No way. Not on a work laptop."*
  - *"No idea. Let's check The Lark."*
  - *"Ask Owain. He'll know."*
- **Let's check:** The Lark's policy search opens on the personal use line from the organisation's summary (Larkspur: reasonable personal use in your own time is fine). Leo: *"Result. Hang on, does the warehouse share our Wi-Fi?"* **Ask Owain:** Owain, passing: *"Fine at lunch. Just not in HD on the warehouse Wi-Fi."* The two guesses get a shrug from Leo: *"Reckon you're right."*
- Whatever they said is the **baseline** for C16-B1: did they check or ask, or guess? Then Owain calls across the floor: *"Quiz in the kitchen in five! This month: the small print. There's a prize."*

### 2. Learn: Owain's warm-up (1 minute)

- **(CP)** In the kitchen, Owain to the audience (EX-01, aid BE-08: the card of ten headings from `concepts.md`, stepping through them):
  - *"The policy's twelve pages. You don't need to learn it."*
  - *"You need to know what's in it, why, and who to ask."*
  - *"Three buzzers. Allowed. Not allowed. Ask first."*
- Ama: *"Ask first is never the wrong answer. It always scores. Remember that."*
- The card's last step shows the five responsibilities. Ama: *"And five things are yours to do, whatever the policy says."* One line each, on the aid, not read out in full.
- **Skip:** a player who says *"I know our policy"* gets Owain's *"Then you'll walk it,"* and goes straight to the show, which is the practice anyway.

### 3. Practise: the show (4 minutes)

- **(CP)** **Allowed, Not Allowed, or Ask First?** runs in MG-20's game show presentation, mostly with "sort into groups" items (`features/minigames.md`). For each card: Owain reads the situation; the player locks in an answer with a buzzer (click, or keys 1, 2, 3); the contestants' answers flip up; the hosts reveal the organisation's answer with a voiced reaction (*"Allowed!"*, *"Not allowed!"*, *"Ask first!"*), and the one-line reason and the policy section appear on the whiteboard (on screen, from the answer key). There is no timer and speed scores nothing.
- **Scoring:** 2 points for the organisation's answer. "Ask first" scores 1 when the answer was "Not allowed" or "Allowed", because asking would have got you there. Nothing scores below zero.
- **(CP) Round 1, "Buzz":** five cards from the bank (below), with at least one of each answer.
- **(CP) Round 2, "Why?":** three cards where the answer is shown and the player picks the best reason from three. The wrong reasons are gently silly ("Because badges are expensive"), the right one names the real harm ("Everything done with your badge looks like you did it, and it lets in someone who might not be allowed").
- **(CP) Round 3, "Who do you ask?":** three "Ask first" situations. The player picks the service desk, the security team, the DPO, their manager or HR. Kev, who never touches a computer, wins this round: *"You just ask the person who'd know. Always worked for me."*
- **(CP) "Fact or myth?" with Tomasz** (C16-LO4): three statements about monitoring from the bank. Tomasz rules on each with one line and The Lark's monitoring page as his aid. His closing line: *"Write every message as if the person it's about could read it. One day they might."*
- **Mei Lin's card** (C16-LO5), no buzzers: *"Two people. One clicked a dodgy link and owned up straight away. One looked up a celebrity's address in a customer system. Same treatment?"* The player says yes or no; Mei Lin: *"Mistakes, you report and we fix together. Doing it on purpose is different, and the policy says what happens."*
- **The jackpot** (C16-LO6): put four steps in order before signing a policy: read the summary; open the full policy for anything you're unsure of; ask about anything unclear; then acknowledge.
- **Prize-giving.** The Golden Lanyard goes to the top score. Every contestant gets something: "Best Reasons", "Most Improved", and Martin's "Most Honest Answer" for *"It is if nobody finds out."* Leo: *"I'm framing this lanyard."* The record shows the real per-outcome result; the show makes sure nobody leaves as the loser.

The comic beats are written into specific cards so they always land:

| Card | Beat |
|---|---|
| Forward a client spreadsheet to your personal email | Martin buzzes Allowed. Owain: *"Not allowed, Martin."* Martin: *"It is if nobody finds out."* Ama: *"That's not one of the buzzers, Martin."* |
| Lend your badge to a colleague | Kev slams Not allowed: *"I wouldn't lend my badge to my own mother."* |
| Use the company's AI assistant to summarise a public report | Kev: Not allowed, *"Robots."* Owain: *"Allowed, Kev. It's the approved one."* Kev: *"Hmph."* |
| Post a photo of the team's new office | Leo gets it right, then goes pale: *"Is the whiteboard in mine?"* Ama: *"We'll have a look after. Together."* |

#### The card bank (Larkspur defaults)

Each card carries an id, the situation, the default answer, the reason, the policy section and, for "Ask first" cards, who to ask. The organisation confirms or edits each card's answer and reason in HA-11; cards it hasn't confirmed are never drawn. **Locked** cards can't be changed (see Pitfalls).

| Id | Situation | Default answer | Reason (on screen) | Locked |
|---|---|---|---|---|
| S01 | Stream the football on your work laptop at lunch | Allowed | Reasonable personal use in your own time is fine; keep it off the warehouse Wi-Fi | |
| S02 | Check your own bank account on the work laptop at lunch | Allowed | Personal use in your own time; type the bank's address yourself | |
| S03 | Install a free PDF editor you found online, to finish a report | Ask first (service desk) | There's an approved one in the software portal; unknown software can carry malware | |
| S04 | Lend your badge to a colleague who left theirs at home | Not allowed | Everything done with your badge looks like you; Reception issues day passes | Yes |
| S05 | Use your work email to sign up to a personal shopping site | Not allowed | Work accounts are for work; if the shop leaks, your work address gets the scams | |
| S06 | Forward a client spreadsheet to your personal email to finish at home | Not allowed | It leaves the organisation's protection; use the approved remote access (core_13) | |
| S07 | Post a photo of the team's new office on social media | Allowed | As long as no screens, whiteboards or badges are in shot, and you don't speak for us (core_12) | |
| S08 | Use the company's AI assistant to summarise a public report | Allowed | It's approved, and public information is fine to use (core_15) | |
| S09 | Paste a customer's complaint into a free public chatbot to tidy the wording | Not allowed | Personal data would go to a company we have no contract with; use the approved assistant without names (core_15) | |
| S10 | Connect your own phone to the guest Wi-Fi | Allowed | That's what the guest network is for | |
| S11 | Plug in a USB stick a supplier handed you at a trade fair | Not allowed | Hand it to IT to check; unknown sticks can carry malware (core_13) | |
| S12 | Take your work laptop on holiday abroad | Ask first (your manager, then the service desk) | Some countries and some data need extra care (core_09) | |
| S13 | Use the team chat to moan about a colleague | Not allowed | Messages are records and the colleague could one day read it; talk to your manager | |
| S14 | Install a game on your work phone | Ask first (service desk) | Only apps from the company app store go on work devices | |
| S15 | Set an out-of-office saying you're in Tenerife for a fortnight | Allowed | Fine, but say less: your return date and who to contact, not where you are (core_12) | |
| S16 | Log in as a colleague who's off sick, with their permission, to send their report | Not allowed | It hides who did what and gets round access controls; the service desk can give you access | Yes |
| S17 | Read out the code from your phone to "IT" on a call | Not allowed | IT never asks for codes. Hang up and ring the service desk (core_03) | Yes |
| S18 | Turn off the antivirus because it slows your laptop down | Not allowed | It's there to stop malware; ask the service desk to fix the slowness | Yes |
| S19 | Look up a famous customer's address in the customer portal, just to see | Not allowed | Looking without a work reason can be a crime (Data Protection Act 2018, section 170) | Yes |
| S20 | Use your own laptop for work while yours is being repaired | Ask first (service desk) | Only through the remote desktop service, set up by IT | |
| S21 | You think you've sent a file to the wrong customer | Report it (the card shows the report route instead of buzzers) | Reporting suspected incidents is a duty; the sooner, the better (core_04) | Yes |
| S22 | Tell a colleague your password so they can watch your inbox while you're on leave | Not allowed | Ask the service desk to set up shared access; your password is yours alone (core_03) | Yes |

"Fact or myth?" statements (C16-LO4): "IT can read anyone's messages whenever they fancy" (myth); "Our email is scanned for threats, and The Lark says how" (fact, from the organisation's monitoring statement); "If someone asks for their data, emails about them can be part of what they get" (fact); "Work chat is private between you and the person you sent it to" (myth); "The organisation can't check anything without asking each of us first" (myth: it can check for legitimate reasons, but it must tell you).

### 4. Apply: back at the desk (1.5 minutes)

- **(CP)** Two situations arrive, unannounced, in a random order:
  - **The meeting link** (C16-LO2, LO3). An email from Anjali Mistry at Hollins Lane Primary, a real client: *"Can we catch up at 2 about the cleaning rota? Here's the link. You'll need to download MeetFlow first."* (A fictional video app Larkspur doesn't use.) The player can install it from the link (a `confirm_action` dialog), ask the service desk in chat, reply suggesting the organisation's own meeting tool, or ignore it. Asking gets Owain within seconds: *"You can join that one in the browser, no install. Or send her one of ours."* Installing gets a friendly note from Owain a minute later: *"Saw MeetFlow go on your laptop. It's a real app, no harm done. Next time ask first: fake meeting apps are a favourite way in."*
  - **Martin's favour** (C16-LO2, LO5). Martin perches on the desk: *"Quick one. Can you look up the business manager at Moorfield Primary in the portal? Her mobile. Old friend, personal thing."* The player can decline and say why, decline and suggest he asks her another way, say they'll check with Tomasz, or look it up. If Martin pushes (*"Oh, come on. It's just a number."*), the player gets a second chance to hold the line. If they look it up, the portal shows a banner, *"Access recorded"*, and ten minutes later Tomasz drops by: *"The portal flagged a lookup with no work task behind it. Anything you want to tell me?"* Owning up gets *"Thanks for telling me. I'll have a word with Martin."* Martin, later, sheepish: *"Fair cop. I'll message her myself."*
- **(CP)** Lena's chat when both are done (on screen): *"The updated policy's on The Lark. Can you sign it off before 3? Everyone has to."*

### 5. Debrief (30 seconds)

- **(CP)** The debrief screen (BE-02), then one line from Ama.

### 6. Check (1 minute)

- **(CP)** Five items from the bank in `assessment.md`, answered from the organisation's answer key (MG-20), opened on The Lark.

### 7. Reference: the policy and the acknowledgement (1 minute)

- **(CP)** The Lark's policy page (BE-09, showing the HA-07 record):
  - the policy's name, version, date and owner, and, on a re-acknowledgement, "What changed in this version";
  - the five-point summary (HA-11);
  - **Read the full policy** (accessible HTML inside The Lark, or in a new tab);
  - two buttons of equal size: **I have read and understood the Acceptable Use Policy, version 4.2, and I will follow it** (HA-07's statement, with the organisation's policy name and version) and **I have a question first**. No pre-ticked box, no timer, no forced scrolling.
- **Acknowledge:** a confirmation shows what was recorded (policy, version, date and time) and when it will be asked again (in a year, or sooner if the policy changes). The platform keeps the record (HA-07, HA-05).
- **I have a question first:** a short form (which section, and the question) goes to the policy owner. The acknowledgement stays open; the learner can come back from The Lark or the learner home (HA-17) when it's answered, with reminders (HA-04). The module completes when the policy is acknowledged.
- If the organisation attaches more than one policy (for example its information security policy), each has its own summary and its own acknowledgement.
- **(CP)** The reference card, **Small print, big reasons**, stays pinned: the procedure, the five-point summary and the contacts by question type.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Leo's question (Hook) | Check The Lark / ask Owain / guess allowed / guess not allowed | LO2, LO3 (baseline) | Leo's reaction; the answer appears either way |
| Buzz cards | Allowed / Not allowed / Ask first | LO2 | The reveal, the reason and the section on the whiteboard; points |
| Why? cards | Three reasons | LO2, LO5 | The right reason named; bonus point |
| Who do you ask? cards | Service desk / security team / DPO / manager / HR | LO3 | Kev's commentary; points |
| Fact or myth? | Fact / myth | LO4 | Tomasz's one-line ruling |
| Mei Lin's card | Same treatment / different | LO5 | Mei Lin's line |
| The meeting link (Apply) | Ask the service desk / suggest our own tool / install it / ignore it | LO2, LO3 | Owain's quick answer; or his friendly note after an install; Anjali's meeting happens either way |
| Martin's favour (Apply) | Decline and explain / decline and suggest another way / check with Tomasz / look it up | LO2, LO5 | Martin takes no for an answer; or the "Access recorded" banner and Tomasz's visit, with credit for owning up |
| The policy (Reference) | Acknowledge / ask a question first | LO6 | The record shown on screen; or the question sent and the acknowledgement held open |

No option shames the player. Looking up the number ends with Tomasz thanking them for being straight with him and Martin taking it on the chin; installing the app ends with Owain saying "no harm done".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-20 Knowledge check** | new (MVP) | The show's cards and the final check, from one bank keyed to the organisation's answer key (HA-11) |
| MG-20's game show presentation | planned in `features/minigames.md` | Hosts, buzzers with labels and icons, "sort into groups" items. This module also needs: contestants' answers revealed after the player locks in, the whiteboard scoreboard, rounds, prize-giving, and "Ask first" scoring at least one point. No speed scoring. Keys 1, 2 and 3 for the buzzers |
| `warranty-checklist` | existing (sis03), needs generalising | Fallback for the Buzz round before the game show presentation exists: one row per card with three verdict buttons. Its labels, globals and alert text are hard-coded today. MG-20's plain spot check look is the other fallback |
| `person-chat` | existing | The hosts, contestants, Tomasz and Mei Lin as multi-speaker scenes; Leo and Martin at the desk |
| `phone-chat` | existing | Lena and Owain in the team chat |
| MG-01 Inbox | new (MVP) | Anjali's email with the meeting link |
| `confirm_action` (`systems/apply-actions.js`) | existing | The "Install MeetFlow?" dialog, and the portal search in Martin's favour |
| BE-09 and HA-07 | new (MVP) | The policy page, the acknowledgement and "I have a question first"; `notes` and a `lab-workstation` page until they exist |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| The small print on one card | Owain, with Ama (EX-01) | 45 seconds | The ten headings, then the five responsibilities | "Which answer is never wrong?" (MG-20 single item) |
| The reveals | Ama and Owain | 5 seconds a card | The whiteboard: answer, reason, policy section | The next card |
| Fact or myth? Monitoring | Tomasz | 45 seconds | The Lark's monitoring page, and three ticks: tell staff, have a purpose, be necessary | His closing line |
| Mistakes and misuse | Mei Lin | 20 seconds | none | none |
| Rules that don't work | Ama (optional, in the debrief) | 15 seconds | The policy page's "I have a question first" button | none |

## Debrief

Shown on BE-02, then one line from Ama:

1. **The scoreboard and the awards,** with the player's points by round.
2. **Before and after:** Leo's question in the Hook beside the meeting link in Apply. Did the player check or ask both times?
3. **The two Apply situations,** each with what the player did and what good looks like: ask the service desk (or use the organisation's own tool); say no to Martin kindly, and if he pushes, point him to Tomasz.
4. **The five responsibilities,** each ticked where the player showed it during the module.
5. **Per-outcome results** (Secure, Developing, Not yet).
6. **The line to remember:** *"Not sure? Ask first. Made a mistake? Report it."* Ama, voiced: *"Small print, big reasons. And if a rule doesn't work, tell us."*

## Variants

- **Micro-drill:** none. When the organisation changes its policy, though, the cards tied to the changed sections can be sent as an optional three-minute refresher with the re-acknowledgement (BE-07, HA-07).
- **Text route:** the show as a text quiz: Owain's card, three labelled answer buttons, the contestants' answers shown after the player locks in, then the answer and reason as text. The Apply situations are text choices; the policy page is accessible HTML with the same two buttons. Same record. About 7 minutes.
- **Facilitated session, "Policy Launch Live":** a real lunchtime quiz for a team (BE-15, HA-13), on a presenter screen, about 30 minutes. Teams hold up coloured cards instead of buzzers; the facilitator reveals the organisation's answers and asks, for each surprise, "Would this rule work in your team?" The answers to that go to the policy owner. Pause points: after Buzz ("Which answer surprised you?"), after "Fact or myth?" ("What would you like to know about monitoring here?"), after Mei Lin's card ("What makes someone hide a mistake?"). Everyone acknowledges on their own device at the end, so each acknowledgement is individual.
- **Replay and randomisation:** each play draws from the confirmed cards (22 in the Larkspur bank), at least one of each answer per round. When the policy changes, cards linked to the changed sections are drawn first with a "New" badge, and the policy page shows what changed. The annual re-acknowledgement goes through HA-07, and core_17 offers it at the end of its day.

## Alternative concepts

1. **The Small Print Detective.** Colleagues leave "Can I...?" sticky notes on the player's monitor. For each, the player searches the real policy on The Lark, finds the section that answers it and highlights it, then replies to the colleague. A final note asks something the policy doesn't cover, and the right move is to ask the service desk. It teaches the real skill of finding answers in your own policy, but it's quieter and less social than the show.
2. **Rule Rewrite.** The player joins the policy review group with Ama, Mei Lin, Owain and Martin. Anonymous staff feedback shows which rules people break and why. For each, the group decides: keep it and explain it better, change it, or make the right way easier. It teaches the reasons behind the rules and the NCSC's idea of usable rules, and the learner's own suggestions can be sent to the organisation (HA-14). It would also suit role_05 and role_01.
3. **Desk Inspection.** A spot-the-risk sweep of the Operations floor (BE-10) where every risk (a password on a sticky note, a personal USB stick, an unapproved app on a screen, an unlocked laptop) is tagged with the policy heading it breaks and fixed. Visual and quick, but it overlaps core_10's clean desk sweep.

## Art and audio

- **Room dressing:** the kitchen as a game show set: whiteboard scoreboard, three buzzers that light and sound (new props), bunting, the cardboard Golden Lanyard (new prop), audience extras with sandwiches. The rooms themselves exist.
- **Characters:** Ama, Owain, Leo, Martin, Kev, Tomasz and Mei Lin from the recurring cast; generic office extras for the audience. Anjali appears by email only.
- **New UI:** the game show overlay (cards, buzzers, scoreboard, contestants' answers), and the policy page in The Lark (BE-09).
- **Voice:** about 12 lines for Owain, 10 for Ama, 8 for Martin, 6 each for Kev and Leo, 5 for Tomasz and 2 for Mei Lin. The reveal lines (*"Allowed!"*, *"Not allowed!"*, *"Ask first!"*, *"Lock it in."*, *"Let's see what the policy says."*) are fixed and voiced once per host, then reused. **No voiced line prints a variable:** card reasons, policy sections, scores and the organisation's answers are on screen only, because organisations change them.
- **Sound:** three distinct buzzer tones, always paired with a light, a label and an icon (tick, cross, question mark), so colour and sound are never the only cue. Applause and the workplace music set (BE-21).

## Pitfalls

- **Teaching a rule the organisation doesn't have.** Only cards the organisation has confirmed are drawn, and at least 12 must be confirmed before the module can be assigned (an item on the setup checklist, HA-26). The Larkspur defaults are suggestions, not answers.
- **Letting an organisation teach something harmful.** Seven cards are locked, covering the six locked rules in `README.md` (open question 3): S17 and S22 (passwords and codes), S16 (someone else's login), S04 (badges), S19 (data without a work reason), S18 (security software) and S21 (reporting). No organisation can make any of these "Allowed", or make reporting optional.
- **Policy trivia.** Cards are everyday situations, never "what does section 4.3 say?". The policy section is shown as a pointer, not asked for.
- **Punishing caution.** "Ask first" always scores. People who are afraid of being wrong stop asking.
- **Making monitoring sound sinister, or harmless.** Tomasz's round covers both the checks and the limits that protect staff.
- **Blurring mistakes and misuse.** Mei Lin's card keeps the line clear, and nothing in the module suggests that a slip reported quickly leads to discipline.
- **A coerced acknowledgement.** No forced scrolling, no countdown, no pre-ticked box. The summary is on the page, the full policy is one click away, and "I have a question first" is as big as "I agree".
- **Speed pressure.** Buzzers lock in an answer; speed scores nothing; every control works by keyboard.
- **Martin as a villain.** His favour is the kind of thing nice people ask. He takes no for an answer, and he comes round.
- **Running long.** The show is four minutes. If an organisation adds its own cards (HA-08), they replace cards, they don't add rounds.
