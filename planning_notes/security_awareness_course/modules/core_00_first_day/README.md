# core_00: First day

**Working game title:** First Play
**Pitch:** The first time you open a training kiosk, a short brief tells you how the exercise works, that nothing real is ever asked of you, what is recorded and who sees it, and the one habit the whole course runs on.

| | |
|---|---|
| Audience | All staff, the first time they play any episode in the "Incident Simulations: Critical Cases" line |
| Prerequisites | None. This is the first-play brief inside the kiosk frame |
| Full module | About 2 to 3 minutes, shown once per learner |
| Defend-only variant | Not applicable: core_00 is a brief, not an episode |
| Pre and post check | None of its own; it opens the frame the checks and episodes use |
| Text route | A gap in the build (BE-03), still to come |
| Priority | New, MVP: the orientation the built product does not yet have |
| Build size | S, driven by BE-20 (an authorable title and tutorial; today the shell still shows the platform title) |

## Build status

**Not built** (`research/built_episodes_vs_plan.md` §2: core_00 None). Every shell already has a brief, a scope note and a host welcome, but there is no first-play orientation, no "how it works", and no single place that states what is recorded and names the habit. This plan adds one.

| Outcome | Covered by | Status |
|---|---|---|
| C00-LO1 use the kiosk and the episode runner | the step strip and the defend verdicts exist, but are not introduced | **New (first-play brief)** |
| C00-LO2 why you are targeted, how attacks begin | the attack half shows it, episode by episode | **New here as a one-screen brief; Built as experience in every episode** |
| C00-LO3 apply the habit to an unexpected request | the habit to keep in every debrief | **Builds on every episode; stated first here** |
| C00-LO4 report, and find the route again | the report verdict and the customer report route in every debrief | **Builds on every episode; introduced here** |
| C00-LO5 what the team does with a report; no blame | the team-protected tally and the no-blame line in every debrief | **Builds on every episode; introduced here** |

**What is new:** a first-play "how it works" brief inside the kiosk frame, shown once per learner, hosted by whichever episode's host the learner opens first. It is not a separate episode and has no attack, flip or defend half. It carries the habit to keep, and it sets the expectations the rest of the product relies on. Its home in the roadmap is the authorable title and tutorial work (BE-20), which also replaces the platform title the shell still shows.

## Why this module

Every episode assumes three things: the learner can use the kiosk and the episode runner, they know the one habit the course comes back to, and they trust what the product records about them. The first-play brief makes sure of all three in two to three minutes, and makes the first impression: a product that respects people's time and treats them as the defence, not the problem.

The risk it addresses is silence. Staff who don't know how to report, or who think reporting will get them into trouble, keep quiet, and delay is what turns a small incident into a large one. The NCSC's Cyber Assessment Framework treats exactly this as a failing: an organisation does not achieve B6.a (a positive cyber security culture) if "people believe that reporting issues may get them into trouble" or "do not know how to raise a concern".

Attacks are common and ordinary. In the UK government's Cyber Security Breaches Survey 2025/2026, 43% of businesses and 28% of charities identified a breach or attack in the previous year; phishing was by far the most common kind (38% of businesses). Only 19% of businesses had run staff training or awareness activities in that year.

- **Marks and Spencer, 2025.** The chairman told MPs the attackers got in through "sophisticated impersonation" involving a third party; reports describe calls to IT support posing as staff to get passwords reset. M&S estimated the hit to operating profit at about £300m before insurance and other mitigation (check the company's own statement before quoting the figure).
- **British Library, 2023.** The Library's own review found the most likely way in was a compromised account belonging to a third party, on a remote access server that had no multi-factor authentication. The attackers were inside for at least three days before anyone knew.

Neither started with clever technology. Both started with a person, a password or a phone call, which is why the brief starts with people.

## Target behaviours

1. **Reports** anything suspicious through the organisation's route straight away, even when unsure, and including their own mistakes.
2. **Stops and checks** an unexpected request through a route they already trust before acting on it.

## Learning outcomes

After the first-play brief, staff can:

- **C00-LO1** Use the kiosk and the episode runner (the step strip, the defend verdicts Trust, Report, Delete and Verify, the flag chips, the report button and the concept cards), and find the settings that suit them.
- **C00-LO2** Explain in a sentence or two why criminals would want what they have access to, and how most attacks begin (a message, a call or a stolen password).
- **C00-LO3** Apply the habit to keep to an unexpected request: stop and check it yourself through a route you already trust, not the link, number or page the message gives you.
- **C00-LO4** Report a suspicious message through the organisation's route, including when unsure, and find the reporting route again (the customer report route, shown in every debrief).
- **C00-LO5** Describe what the security team does with a report, and why reporting a mistake quickly is welcomed rather than punished.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **ISO 27001 cl. 7.3** (aware of the policy, their own contribution and the consequences of not following it) and **ISO 27001 A.6.3**.
- **NIST AT-2** (literacy training on joining, including what users do when they suspect an incident).
- **CIS 14.1** (training at hire) and **CIS 14.6** (recognising and reporting incidents).
- **PCI DSS 12.6.1** (a programme that makes everyone aware of the policy and their role), and the "on hire" part of **PCI DSS 12.6.3** when the brief opens the learner's first episode.
- **NCSC CAF B6.a** and **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **DORA Art 13(6)** and **DORA RTS Art 19**, for EU customers.
- **ICO training toolkit** (induction for all staff before they access personal information and within one month of starting). core_00 opens the pathway; core_05 carries the data protection content.
- **DSPT 2.1.1** and **DSPT 3.2.1** (categories 3 and 4), with the rest of the induction pathway.
- **FTC 314.4(e)** and **SOC 2 CC2.2**, for US customers.

## Module flow

The first-play brief is not an episode: it has no attack, flip or defend half. It runs inside the kiosk, before the learner's first episode brief, as a few short cards. It appears once per learner.

| Card | What it says | Format |
|---|---|---|
| Welcome | The host welcomes the learner and names the exercise: an authorised exercise at a fictional company | Host line in the kiosk |
| How it works | The stages the runner steps through (brief, attack, flip, defend, debrief), the step strip, and the defend verdicts | Concept card |
| Nothing real | The product never asks for a real password, bank details or personal information; sign-in pages and forms are models | Concept card |
| What is recorded | What is recorded (ids, verdicts, times), who sees it, that the attack half is never scored, and that choices are never used for discipline | Concept card and a "Got it" button |
| Why you | Why criminals want your access, and how most attacks begin | Concept card |
| The habit | The habit to keep, quoted word for word | Concept card |
| Report, and no blame | How to report here (the customer report route) and that reporting a mistake is welcomed | Concept card |

## Reuse from existing Break Escape content

Built on the awareness systems on main:

- the episode runner and its kiosk frame, in whichever company's training room the learner opens first;
- the host NPC and the scope note (the "authorised exercise at a fictional company" line is already in every shell);
- concept cards (the vehicle for the brief);
- the "what we record" notice, which the brief shows once per learner;
- the customer report-route slot and the no-blame line, previewed here and shown in every debrief;
- the player's chosen avatar, which always wins, and the portrait that follows it.

## New features needed

- **BE-20** an authorable title and tutorial: the course's own opening in place of the platform title the shell still shows, and the first-play brief steps tied to the kiosk.
- **BE-03** a text route, and **BE-04 and BE-26** accessibility (settings reachable before any sound plays), so the first thing a learner meets works by keyboard and as text.
- **BE-25** Unicode name entry, so the chosen name shows correctly.

No runtime language model is used; the brief is authored data. No video.

## Organisation-specific content

- The customer reporting route (the `customer_report_route` slot), shown in the brief and in every debrief. Its deployment setting is a proposed Hacktivity feature awaiting the user's answer (described at feature level only).
- The organisation's name and logo on the title and in the room (BE-20, BE-05).
- What the organisation can see in training records, shown on the "what we record" card.
- The organisation's statement that honest mistakes reported quickly are not disciplined, if it will give one.

## Open questions

1. **Where the brief lives.** It is the first-play orientation inside the kiosk, not a separate mission. *Recommendation: show it once per learner, hosted by whichever episode's host they open first (for example Adaeze Okafor if they start E1), so there is no separate induction mission to assign.*
2. **A short tagline.** The build uses the habit to keep and no motto. *Recommendation: keep it that way; a three-word tag would be a user decision (D14), added to the deploy script, not a plan-only phrase. (Candidate for DECISIONS_PENDING.)*
3. **Existing staff.** *Recommendation: the same brief serves everyone; it is short, and the "what we record" card matters most for people who have never played.*
