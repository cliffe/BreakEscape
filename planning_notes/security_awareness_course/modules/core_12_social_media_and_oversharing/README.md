# core_12: Social media and oversharing

**Working game title:** Open Book
**Pitch:** Play the attacker who turns a colleague's public posts into the perfect scam, then flip and close the door you just walked through, on their settings and on yours.

| | |
|---|---|
| Audience | All staff (built role: general) |
| Prerequisites | core_00 recommended; lands best after core_01 and core_02 |
| Full episode | about 13 minutes |
| Defend-only variant | about 8 minutes |
| Pre and post check | 4 to 5 minutes each (general role forms) |
| Priority | Phase 3 (proposed episode E14) |
| Build size | M. Reuses the OSINT browser, intel board, template composer and inbox triage; new work is the privacy-settings surface and the feed drill |

## Build status

**Builds on the OSINT browser and E2 / E4.** Every built attack half already runs an OSINT look-around with a "reduce" note per fact found (the note that tells the learner what to leave off a post), and the intel board records the typed intel facts. E2 (Tarrowby Logistics) uses a social post asking people to email CVs, and E4 (Merrin & Sallow Architects) uses a partner's public diary and travel posts. Against this module, that built work covers:

- **C12-LO1** (what an attacker learns from public posts), through the OSINT stage and reduce notes;
- **C12-LO2** (spotting risky content), through the same stage, E2's social post and E4's diary and travel.

**New in this module:**

- the privacy-settings surface (the defender side of the attack: tighten a profile and watch each found fact close), for **C12-LO3**;
- fake profiles and fake recruiters as triage items, and an impersonation of a senior leader, for **C12-LO4**;
- who speaks for the organisation, for **C12-LO5**.

The episode is proposed as a full attack-then-defend episode in the built shape, at a brand-set company, with a defend-only variant and new items for the general check forms. It is not yet built: the awareness product is on hold (see `../../04_BUILT_SO_FAR.md` §1).

## Why this module

Attackers do their homework, and most of it is free. Public posts tell them who works where and for whom, what systems a company runs (job adverts are a gift), when someone is away, what their manager is called, and the answers to common security questions (a pet's name, a first school, a birthday). A badge in a selfie, a screen in the background of an office photo, a whiteboard behind a team shot: each is a small gift to someone building a convincing phishing email (core_01) or a pretext call (core_02). None of it needs hacking. The defence is equally ordinary: think before you post about work, tighten your privacy settings, keep security-question answers private, and treat strangers who ask about your workplace with care.

Two cases show the range. In 2017 and 2018, a public fitness-app heatmap was found to trace the perimeters and jogging routes of military bases around the world, because individuals' location data added up to something nobody meant to publish. And national security bodies run the "Think Before You Link" campaign after thousands of people in the UK were approached by fake profiles on professional networking sites. Oversharing is rarely one careless post; it is the pattern that builds up, and the stranger who is paid to notice it.

## Target behaviours

1. **Thinks before posting about work:** no badges, screens, whiteboards, system names or "first day at..." detail that helps an attacker, and no answering of work questions from strangers online.
2. **Reviews and tightens privacy settings** on their own accounts, and keeps security-question answers (pet, school, birthday) out of public view.
3. **Recognises and reports** fake-recruiter, impersonation and information-gathering approaches.

## Learning outcomes

After this module, staff can:

- **C12-LO1** Explain what an attacker can learn from public posts and how it is used (spear phishing, pretext calls, impersonation, recruitment scams).
- **C12-LO2** Spot risky content in a post or photo (badges, screens, whiteboards, system names, location tags, holiday and life details).
- **C12-LO3** Review and tighten the privacy settings on a profile, and keep security-question answers private.
- **C12-LO4** Recognise a fake profile or recruiter and an information-gathering approach, and decline and report it.
- **C12-LO5** Judge what is safe to say about work in public, and know who speaks for the organisation.

## Compliance coverage

Contributes to:

- **NIST SP 800-53 Rev 5** AT-2(3) (social engineering and mining, which names social media exploitation).
- **CIS Controls v8.1** 14.2 (recognise social engineering attacks) and 14.6 (recognise and report incidents).
- **ISO/IEC 27001** Annex A 6.3 (awareness) and clause 7.3; A 5.10 (acceptable use of information), where the organisation's social media policy sits.
- **NIS2** Article 21(2)(g) (basic cyber hygiene and training).
- **NCSC CAF** B6 (staff awareness and training).

## Module flow

The episode is one training-room mission: the learner taps the kiosk and the episode runner steps through the stages. The pre-check and post-check are two further missions that an organiser places before and after any run of episodes.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | 10-item general check form, played before the episodes | 4 to 5 |
| Brief and scope note | "Authorised exercise at Merrin & Sallow Architects (fictional). In scope: Oskar's public posts and your own profile." | 1 |
| Attack: OSINT | On a stripped-down OSINT page, pin a staff member's public posts; the intel board ticks each fact, and each carries its reduce note | 3 to 4 |
| Attack: write | Compose one pretext message from a template whose blanks take only facts just found; red-flag meter on; one send | 2 to 3 |
| Flip | The learner's own pretext arrives in a colleague's inbox with its tells highlighted | under 1 |
| Defend | Triage a feed and a short inbox: posts to post, tweak or hold; a fake recruiter; a fake senior profile; and tighten the privacy settings that close each found fact | 3 to 4 |
| Debrief | Per-item reasoning, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line | 1 to 2 |
| Post-check (separate mission) | The parallel general check form, played after the episodes; shows the change from the pre-check | 4 to 5 |

## Setting and host

- **Company:** Merrin & Sallow Architects (`merrinsallow.example`, brand set), whose partners travel and speak at events, so their diaries are partly public. This extends E4's public-diary and travel OSINT at the same company.
- **Host:** Tomás Carvalho (the E4 inbox owner), who welcomes the learner at the kiosk.
- **OSINT subject:** Oskar Berglund, a junior architect who posts a lot (reuse of the E4 cast; his oversharing detail is proposed, consistent with `BRAND_SET.md`).
- **Impersonated senior:** Catherine Merrin (the managing partner impersonated in E4), for the fake-profile item.

## Reuse from existing Break Escape content

- the **OSINT browser** and **intel board** with typed intel facts and reduce notes (all built attack halves);
- the **template composer** and **phish rules engine** for the one pretext message, with the red-flag meter;
- the **flip view**;
- **inbox triage** (the feed and the fake-profile and recruiter cards) under the `awareness` scoring profile, with Report always visible;
- **awareness-measure** records;
- the **look-alike NPC guard** for the fake senior profile.

## New features needed

A privacy-settings surface (tighten a profile; each change closes a found fact on the board) and a feed drill ("Post or Not?"). Both are overlays, so the episode needs no new room beyond the training room.



## Organisation-specific content

- The social media policy: what staff may and may not post about work, and who is authorised to speak for the organisation.
- The reporting route for a fake profile, a suspicious recruiter or an information-gathering approach (fills `slot:customer_report_route`).
- Any rule on connecting work accounts to personal ones, and on posting from client sites.
- Guidance on profile photos that show badges, passes or secure areas.

## Open questions

1. **Real platforms or a generic feed.** A generic, legible feed and professional network, with no real brand, so the lesson transfers and the episode does not date. (Matches the brand-set rule: invented services only.)
2. **Using a named colleague as the subject.** The subject is the fictional Oskar Berglund, with consent in the fiction (the exercise is authorised and stated in the scope note, and Oskar is thanked in the debrief), never a real person or the player's real accounts.
3. **Overlap with core_14 (insider recruitment).** Keep this episode to information-gathering and recruitment scams; point to core_14 for someone being recruited to act against their employer.
