# core_16 game design: Small Print

## Concept

The frame is the built one: a short training-room mission at Marrowdale Facilities (fictional), a kiosk and a host. The scope note: *"Authorised exercise. Everyday 'can I?' moments, answered from our own rules. Ask first is never the wrong answer."*

Acceptable use has no single attacker, so this is a **consequence-flip** episode (and ships equally well as a **defend-only shell**). The learner meets a handful of ordinary moments, makes a choice, and the flip shows where it led. Then a short defend set drills the everyday "can I?" judgements, each sorted Allowed, Not allowed or Ask first against the organisation's own answer key, with the reason on screen. The thing a learner takes away: *"Ask first is never the wrong answer."* The policy itself is read and acknowledged where the organisation records it; that recording is a later platform option, not built here.

## Setting and cast

- **Room:** the Marrowdale training room (a brand-set room type once the company is added), with the kiosk and the host spot. The desktop, the sort surface and the montage are overlays; no new room.
- **Company:** Marrowdale Facilities, proposed for `BRAND_SET.md` (`marrowdale.example`; look-alikes, accent and cast to be set on addition; pre-ship web search). A facilities firm with a mixed, non-technical workforce.
- **Host:** a proposed Marrowdale coordinator or service-desk lead, who welcomes the learner and gives the reason behind each answer (named on addition to `BRAND_SET.md`).
- **Cast (proposed):** a colleague who guesses "allowed" for everything and comes round; a colleague who guesses "not allowed" for anything with a computer in it; a client contact whose email carries a meeting-link app install. Minimal cast, all proposed and varied in age and background.

Larkspur and its cast (Ama Owusu, Owain Jenkins, Martin Fletcher, Kev Sutcliffe, Leo Brennan, Tomasz Wiśniewski, Mei Lin Zhou, Lena Fischer, Anjali Mistry) are retired or remapped onto the proposed Marrowdale cast. The lunchtime game show survives as a facilitated and team-event option, not the core shape. The intranet is generic.

## Structure

The sandbox is unscored; only the defend half is scored, under the `awareness` profile.

### Brief and scope note (1 minute)

The host welcomes the learner and states the scope. A short line: *"Three answers: Allowed, Not allowed, Ask first. When you're not sure, ask first."*

### The choices (sandbox, 2 to 3 minutes)

Three everyday moments, inside ordinary work:

- **The meeting link.** A client emails a meeting invitation that wants an app installed. The learner can install it, ask the service desk, suggest the organisation's own meeting tool, or ignore it.
- **Personal email.** Under a deadline, the learner can forward a file to their personal address to finish at home, or use the approved remote access.
- **The lookup.** A colleague asks the learner to look up a contact's mobile number in a system "for a personal thing". The learner can look it up or decline and suggest another way.

### Flip: the consequence (1 minute)

A short montage shows where each choice led: a fake meeting app that was a way in; a file lost outside the organisation's protection; a lookup recorded with no work task behind it, which the system flagged. Each ends with the approved route.

### Defend (3 minutes)

Scored under the `awareness` profile:

- **The "can I?" set:** everyday situations sorted Allowed, Not allowed or Ask first against the organisation's answer key, with the reason on screen. The card bank below (Marrowdale defaults) supplies them; the organisation confirms or edits each one, and locked cards cannot be changed.
- **The two triage items** that map onto a verdict: the app-install meeting link (Report or Verify through the service desk) and the data-lookup request (decline and route). These use the inbox-triage surface.

### Debrief (1 minute)

The built debrief view:

1. A per-item reasoning card for each item, with the answer, the reason and the policy section (on screen, from the answer key).
2. Feedback on the genuine items (the real client, a genuinely fine personal-use case).
3. The **team protected** tally.
4. **The habit to keep:** *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* (The debrief adds the plain line: *"Not sure? Ask first. Made a mistake? Report it."*)
5. The **"On Monday"** card: the one person you'd ask when you're unsure.
6. The reporting route (`slot:customer_report_route`).
7. The no-blame line: honest mistakes reported quickly are fixed, not punished.

Then the host points to where the policy is read and acknowledged (the later platform option): the summary first, the full policy one click away, and "I have a question first".

## The card bank (example defaults)

Each card carries an id, the situation, the default answer, the reason and, for "Ask first" cards, who to ask. The organisation confirms or edits each one; cards it hasn't confirmed are never drawn. **Locked** cards cannot be changed.

| Id | Situation | Default answer | Reason (on screen) | Locked |
|---|---|---|---|---|
| S01 | Stream the football on your work laptop at lunch | Allowed | Reasonable personal use in your own time is fine | |
| S02 | Check your own bank account on the work laptop at lunch | Allowed | Personal use in your own time; type the bank's address yourself | |
| S03 | Install a free PDF editor you found online | Ask first (service desk) | There's an approved one; unknown software can carry malware | |
| S04 | Lend your badge to a colleague who left theirs at home | Not allowed | Everything done with your badge looks like you; reception issues day passes | Yes |
| S05 | Use your work email to sign up to a personal shopping site | Not allowed | Work accounts are for work; if the shop leaks, your work address gets the scams | |
| S06 | Forward a client file to your personal email to finish at home | Not allowed | It leaves the organisation's protection; use approved remote access (core_13) | |
| S07 | Post a photo of the team's new office on social media | Allowed | As long as no screens, whiteboards or badges are in shot (core_12) | |
| S08 | Use the company's AI assistant to summarise a public report | Allowed | It's approved, and public information is fine (core_15) | |
| S09 | Paste a customer's complaint into a free public chatbot | Not allowed | Personal data to a firm we have no contract with; use the approved assistant without names (core_15) | |
| S10 | Connect your own phone to the guest Wi-Fi | Allowed | That's what the guest network is for | |
| S11 | Plug in a USB stick a supplier handed you at a fair | Not allowed | Hand it to IT to check (core_13) | |
| S12 | Take your work laptop on holiday abroad | Ask first (manager, then service desk) | Some countries and some data need extra care (core_09) | |
| S13 | Use the team chat to moan about a colleague | Not allowed | Messages are records and the colleague could read it; talk to your manager | |
| S14 | Install a game on your work phone | Ask first (service desk) | Only apps from the company app store go on work devices | |
| S15 | Set an out-of-office saying you're away for a fortnight | Allowed | Fine, but say less: your return date and who to contact, not where you are (core_12) | |
| S16 | Log in as a colleague who's off sick, with their permission | Not allowed | It hides who did what; the service desk can give you access | Yes |
| S17 | Read out the code from your phone to "IT" on a call | Not allowed | IT never asks for codes; hang up and ring the service desk (core_03) | Yes |
| S18 | Turn off the antivirus because it slows your laptop | Not allowed | It's there to stop malware; ask the service desk to fix the slowness | Yes |
| S19 | Look up a famous customer's address, just to see | Not allowed | Looking without a work reason can be a crime (Data Protection Act 2018, s.170) | Yes |
| S20 | Use your own laptop for work while yours is repaired | Ask first (service desk) | Only through the remote desktop service | |
| S21 | You think you've sent a file to the wrong customer | Report it | Reporting suspected incidents is a duty; the sooner the better (core_04) | Yes |
| S22 | Tell a colleague your password to watch your inbox while you're off | Not allowed | Ask the service desk for shared access; your password is yours alone (core_03) | Yes |

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The meeting link | Ask the service desk / suggest our own tool / install it / ignore it | LO2, LO3 | The service desk's quick answer; or the fake-app montage |
| Personal email | Approved remote access / forward to personal | LO2 | The lost-file montage |
| The lookup | Decline and suggest another way / look it up | LO2, LO5 | The recorded-lookup montage; credit for owning up |
| "Can I?" cards | Allowed / Not allowed / Ask first | LO2 | The answer, reason and section on screen |
| The two triage items | Report / Verify / decline | LO2, LO3 | Per-item reasoning and the awareness score |

No option shames the player. "Ask first" always scores at least a point, because punishing caution stops people asking.

## Minigames

| System | Status | Use here |
|---|---|---|
| Inbox triage (`awareness` profile) | built | The app-install link and the data-lookup request; Report always visible |
| Consequence flip (montage) | built | Where each sandbox choice led |
| Organisation answer key | built (organisation profile) | The "can I?" answers and reasons |
| Awareness-measure records | built | Per-item id, verdict, chips, score, stage and time |
| Three-way "sort" surface | new (small) | Allowed / Not allowed / Ask first for the card items |

## Explainers

- A short panel on the **three answers** and **five responsibilities**.
- A short panel on **monitoring and its limits** (what's checked, why, and the limits that protect staff).

No video. No runtime language model. The approved AI assistant in card S08 is the authored one from core_15.

## Debrief

The built episode debrief, as set out under "Structure" above: a reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and the no-blame line.

## Variants

- **Defend-only shell** (`variant: "defendOnly"`, about 6 to 7 minutes): brief, defend (the "can I?" set and the two triage items), debrief. The simplest form, and the recommended default if a consequence flip is more than the organisation wants.
- **Pre and post checks:** general role forms (AB and BA). Acceptable-use items (install an app, a data lookup, a shared login, monitoring fact-or-myth) join the general check pool as mirror pairs; see `assessment.md`.
- **Facilitated session, "Policy Launch Live":** the lunchtime game show (Allowed / Not allowed / Ask first, buzzers or coloured cards), on a presenter screen, for launching a new or changed policy. Pause points: "Which answer surprised you?", "What would you like to know about monitoring?", "Would this rule work in your team?" Answers go to the policy owner.
- **Replay:** each play draws from the confirmed cards, at least one of each answer; when the policy changes, cards linked to the changed sections are drawn first with a "new" badge.

## Alternative concepts

1. **The Small Print Detective.** "Can I...?" sticky notes on the learner's monitor; for each, they find the answering section in the real policy and reply. Teaches the real skill of finding answers, but quieter than the sort.
2. **Rule Rewrite.** The learner joins the policy review group: for each rule people break, keep and explain, change, or make the right way easier. Teaches the reasons and the NCSC's usable-rules idea; also suits role_05 and role_01.
3. **Desk Inspection.** A spot-the-risk sweep of the floor, each risk tagged with the policy heading it breaks. Visual and quick, but overlaps core_10's clean-desk sweep.

## Art and audio

- **Room:** the Marrowdale training room (a brand-set room type once the company is added); no new room.
- **UI:** the three-way sort surface, the montage title cards.
- **Characters:** the host and the proposed cast need Marrowdale cast art (CSS wordmark and placeholder sprites until the company is added and PixelLab art is approved).
- **Voice:** text to speech. No voiced line prints a variable: card answers, reasons, policy sections and the organisation's details are on screen only, because organisations change them.

## Pitfalls

- **Teaching a rule the organisation doesn't have.** Only confirmed cards are drawn; the defaults are suggestions, not answers.
- **Letting an organisation teach something harmful.** Seven cards are locked (S04, S16, S17, S18, S19, S21, S22). No organisation can make any of these "Allowed", or make reporting optional.
- **Policy trivia.** Cards are everyday situations, never "what does section 4.3 say?". The section is a pointer, not asked for.
- **Punishing caution.** "Ask first" always scores.
- **Making monitoring sound sinister, or harmless.** The monitoring panel covers both the checks and the limits that protect staff.
- **Blurring mistakes and misuse.** The debrief keeps the line clear: honest mistakes reported quickly are fixed; deliberate misuse is handled differently.
- **A coerced acknowledgement.** When the acknowledgement platform option is built, no forced scrolling, no countdown, no pre-ticked box; the summary on the page, the full policy one click away, and "I have a question first" as prominent as "I agree".
- **No real brands.** Marrowdale and every tool name are fictional, with `.example` domains; check before build.
