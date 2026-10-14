# core_12: Social media and oversharing

**Working game title:** Open Book
**Pitch:** Help an ethical tester turn a colleague's public posts into the perfect scam, then turn it around and lock the door she just walked through, on his profile and on yours.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended; lands best after core_01 and core_02 |
| Full module | 12 minutes |
| Micro-drill | 3 minutes ("Post or Not?") |
| Text route | 10 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the social media and OSINT board minigame (MG-13) |

## Why this module

Attackers do their homework, and most of it is free. Public posts tell them who works where and for whom, what systems a company runs (job adverts are a gift), when someone is on holiday, what their manager is called, and the answers to common security questions (a pet's name, a first school, a birthday). A badge in a selfie, a screen in the background of an office photo, a whiteboard behind a team shot: each is a small gift to someone building a convincing phishing email (core_01) or a pretext call (core_02). None of it needs hacking. The defence is equally ordinary: think before you post about work, tighten your privacy settings, keep security-question answers private, and treat strangers who ask about your workplace with care.

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

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Leo's "first day with the new kit" post appears, with his badge, screen and a whiteboard in shot; the player's response is the baseline | Game | 1 |
| Learn | With Jo, on an authorised test, the player builds an OSINT board from Leo's public posts and sees it become a pretext | Attacker-view interlude (EX-06, BE-11, MG-13) | 3 to 4 |
| Practise | "Post or Not?": a feed of draft posts and photos to mark as safe, tweak or don't post | Minigame (MG-13, BE-10) | 2 to 3 |
| Apply | Lock down Leo's profile and the player's own, and handle a fake recruiter asking about company systems | Game (MG-13) | 3 to 4 |
| Debrief | The board shown again, now with each thread cut by a setting changed or a post removed; Jo's "what would have stopped me" | Debrief screen (BE-02), NPCs | 1 to 2 |
| Check | Five scenario questions | Quiz (MG-20) | 1 to 2 |
| Reference | Reference card on The Lark: think before you post, privacy settings, who speaks for the organisation | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the player's desk), `room_break` (where Leo is), `room_security` (Jo and Ama's debrief). The social feeds and the OSINT board are overlays, so the module is light on rooms. No new rooms.
- **Conversations:** `person-chat` for Jo, Ama and Leo; `phone-chat` or a chat-app skin (MG-05, from core_02) for the recruiter's direct message.
- **Patterns:** the attacker-view framing and Jo's "what would have stopped me" close are shared with core_02 and core_10; the pretext call that the OSINT board produces nods to core_02's call-back lesson. m05 and m08 have insider and recruiter material (a recruiter leaflet, a spreadsheet of staff with a pressure column): reuse the idea of a profile built from scraps, not the spy tone.

## New features needed

- **MG-13 Social media profile and OSINT board**: connect public posts into an attacker's picture of a person (a corkboard with string), then flip to the privacy-settings side and tighten a profile.
- **BE-11 Role switch**: shadow Jo for the OSINT build, then return to the player to lock things down.
- **EX-06 Attacker-view interlude**: the OSINT board and the pretext it produces, kept at "this is what was already public", never a how-to.
- **BE-10 Spot-the-risk mode**: "Post or Not?" marking risks in a feed.
- **BE-01 Assessed decisions**, **BE-02 Debrief**, **MG-20 Knowledge check**, **BE-09 Intranet terminal**, **BE-05 Organisation profile** (the social media policy and reporting route), **BE-19 Open minigames from conversations and events**.
- **MG-05 Messaging apps** (shared with core_02) for the recruiter DM, if built.

## Organisation-specific content

- The social media policy: what staff may and may not post about work, and who is authorised to speak for the organisation.
- The reporting route for a fake profile, a suspicious recruiter or an information-gathering approach.
- Any rule on connecting work accounts to personal ones, and on posting from client sites.
- Guidance on profile photos that show badges, passes or secure areas.

## Open questions

1. **Real platforms or a generic feed.** Should MG-13 mimic known social networks or use a generic feed and a generic professional network? *Recommendation: generic and legible, with no real brand, so the lesson transfers to whatever the learner uses, and so the module does not date.*
2. **Using a named colleague (Leo).** Is it fair to build the OSINT board on Leo? *Recommendation: yes, with consent in the fiction (Jo's test is authorised and Leo is in on the debrief and thanked), because Leo is the course's likeable "posts everything, reports fast" role model, and it keeps the player from building a board on a real person.*
3. **Overlap with core_14 (insider recruitment).** The fake recruiter can shade into insider recruitment. *Recommendation: keep it to information-gathering and recruitment scams here, and point to core_14 for someone being recruited to act against their employer.*
