# Decisions pending

Questions for the user. Each has a recommendation; the plan follows the recommendation until the user says otherwise. When a question is answered, move it to the "Decided" section with the date and the choice.

## Open

### D1. Its own world, or part of the Break Escape campaign?

- **Background:** the campaign is a spy thriller (SAFETYNET, ENTROPY, combat). The SIS games already have their own standalone world.
- **Options:** (a) a separate world (Larkspur Group) with optional nods to the campaign, such as a poster in the break room; (b) set it inside the campaign universe, with SAFETYNET training staff.
- **Recommendation:** (a). Buyers need staff to recognise their own working day, and the threats have to look like real ones. See `03_WORLD_AND_CAST.md`.

### D2. The organisation's name

- **Background:** "Larkspur Group" is a working name. Any plausible company name may belong to a real business.
- **Recommendation:** keep it as the working name, and run a trademark and domain check before anything is published. Every domain used in the game must be unregistered or reserved. The same check applies to the fictional suppliers, clients and products the modules name (for example Northbeck Supplies, Ridgeway Pallets, Fernside Catering, Ashby Cleaning Supplies, Pagewright, Westmoor Council, Calderbrook Borough Council, Thornby Hygiene Supplies, BoxBounce, TallyGrid, DocShift, ChatHelper, MeetFlow) and to domains such as `thelark.larkspur.co.uk`.

### D3. The course's name

- **Options:** "Break Escape: At Work"; "Pause. Check. Report." (the motto as the title); "Larkspur" (the setting as the title); something else.
- **Recommendation:** decide before the first customer pilot; the plan uses "the awareness course" until then.

### D4. Hacktivity as the platform, or inside customers' own LMSs?

- **Background:** many organisations already run an LMS and expect training as SCORM packages or LTI tools. Hacktivity has neither today (HA-10).
- **Options:** (a) pilot in Hacktivity only, add SCORM and LTI in phase 2; (b) build LMS delivery in phase 1.
- **Recommendation:** (a). The first pilots run in Hacktivity, which already has organisations, seats and progress tracking; LMS delivery comes before wider sales.

### D5. Phishing simulation

- **Options:** (a) leave it out; (b) integrate with a partner or an open-source tool; (c) build it into Hacktivity.
- **Recommendation:** (b), later (HA-12). The course stands without it, and the research on simulation with landing-page training is weak; report-button data is the more useful measure.

### D6. Market order and localisation

- **Recommendation:** UK first (NCSC, ICO, UK law), with notes for the EU and the US in each concepts file and the compliance mapping covering both. Translation (BE-06, HA-16) in phase 3.

### D7. Explainer videos

- **Background:** videos can be recorded from the engine with the course's own characters and voices (EX-02), or produced outside it (EX-03). There is an existing character set for the project lead (`assets/characters/cliffe_schreuders*`).
- **Question:** would you like to front the course introduction, either as your existing pixel character or on camera?
- **Recommendation:** engine-recorded videos first (cheap, consistent, easy to update); one presenter-led introduction if you're willing.
- **Related:** videos stay the same for every customer, with the organisation's own details shown on the page and the reference card around them (as with voiced lines). Rendering a version per customer would multiply the cost. Confirm this is acceptable.

### D8. Test-out for experienced staff

- **Recommendation:** offer it as an organisation setting, off by default. Passing the Apply beat and the check records the module as complete; missing a critical behaviour sends the learner through the full module.

### D9. Accessibility commitment

- **Recommendation:** WCAG 2.2 AA for the text route, the Hacktivity pages and every minigame's HTML interface; the 2D world follows the game accessibility guidelines, and the text route is the equivalent alternative where the 2D world falls short. Publish an accessibility statement. See `features/accessibility_and_inclusion.md`.

### D10. Where the Hacktivity plans live

- **Background:** this repo is public; Hacktivity is private. `features/hacktivity.md` is written at feature level, with no internal detail.
- **Options:** (a) keep it here; (b) move it to the Hacktivity repo and leave a pointer.
- **Recommendation:** (a) for now, since the course plan reads better in one place; move it if you'd rather keep Hacktivity's roadmap private.

### D11. Compliance gaps the mapping found

`02_COMPLIANCE_MAPPING.md` shows four requirements no planned module meets:

1. **Specialised data protection training.** The ICO expects extra training for data protection officers, subject access teams and records managers. *Recommendation:* add a role module later (role_08, data protection specialists) rather than stretching core_05.
2. **Developer and incident-response training under PCI DSS.** role_03 and role_04 are awareness level, so they don't meet PCI DSS 6.2.2 (secure coding training for developers) or 12.10.4 (incident response staff) on their own. *Recommendation:* say so plainly in the sales material, and point to Hacktivity's existing technical labs as the route for those roles.
3. **Exercising the customer's own incident plan.** Cyber Governance Code D2 asks boards to exercise their own plan at least annually; role_01 exercises Larkspur's. *Recommendation:* let the facilitated version of role_01 load the customer's plan headings and contacts from the organisation profile.
4. **Advanced persistent threats.** NIST AT-2(5) isn't covered (it sits in no NIST baseline, so few customers will ask). *Recommendation:* a short optional explainer in role_01 or role_03, not a module.

### D12. The technical, hands-on-keyboard phishing lab for specialists

- **Background:** the "learning by doing" research (Chothia, Paiu and Oultram, 2018) has learners build spear-phishing attacks end to end against a simulated company in an isolated VM, including crafting payloads with offensive tooling and capturing flags. That changed learners' understanding more than being shown examples, but it was run with computer science and penetration-testing students, not all staff. The awareness course takes only the pretext-and-psychology half, at awareness level, in the optional attacker-view beat (MG-30).
- **Already exists:** the project already has this technical version adapted to Hacktivity and SecGen, as a hands-on lab for a consenting technical audience. So there is nothing to build here; the open points are about the line between the two products, not whether to make one.
- **Settled direction:** keep the all-staff awareness course and the technical SecGen/Hacktivity lab as separate products with a clear line between them. The awareness course (MG-30) stays at pretext and psychology, sandboxed, optional, and safe to assign to anyone; the technical lab stays for developers, security staff and penetration-testing learners who opt in. Awareness modules should point specialist learners at the existing lab rather than deepen their own attacker content.
- **For the user to confirm:** (1) whether role_04 (developers) and role_03 (IT and service desk) should link out to the existing SecGen/Hacktivity phishing lab as optional follow-on, and under what heading; (2) the lab's name and where it sits, so the course can reference it correctly; (3) that nothing about the lab's internals should be written into this public repo (as with Hacktivity, keep references at product level only).

## Module-level open questions

These are the open questions raised inside individual module READMEs that a stakeholder (rather than an author) should rule on, gathered here so they are not buried in the module folders. Each is drawn from the module's own "## Open questions" section; the module's recommendation is quoted briefly. Nothing already covered by D1 to D12 is repeated.

| Module | Question | Recommendation |
| --- | --- | --- |
| core_00 | The scam in the first minute: is a fake "new manager" message on a new starter's own phone too sharp a start? | Keep it; it is a pattern new starters really meet, it is caught warmly by Maureen and nobody is marked down, with an organisation setting to move it later in the morning. |
| core_03 | The cold open at 02:13, outside work: is it right for all staff? | Keep it; night is when prompt floods happen (the Uber case) and it is the scene people will talk about, with a daytime variant in the bank for organisations that prefer it. |
| core_04 | Who presses the optional "Cut off" button? | The player, on Kai's screen and at Kai's invitation, as a small reward for reporting; it is optional and Kai does it off-screen if the player does not visit, and at the player's own desk the rule is "unplug the cable if we ask you to". |
| core_05 | Can the player avoid the misdirected email, and what fills the breach slot if they do? | Yes; the autocomplete is visible and catchable, a player who catches it is thanked, and the breach slot fills with a different breach (personal data received by mistake) so everyone still practises reporting one. |
| core_13 | Should the car-park USB stick be an authorised test by Jo's firm, revealed at the end, and is that fair? | Yes; the stick holds only a harmless file that records it was opened, the reveal shows results without naming anyone, and customers who run their own USB tests can switch the reveal off (organisation setting). |
| core_14 | How much to say about staff monitoring (tools such as data loss prevention may have spotted Ross's copy)? | One line from Ama ("our tools see files moving, but not why; people see the why"), the organisation's own monitoring notice on the reference card, and never imply staff are watched covertly. |
| core_14 | Samira's reason, a parent in hospital: keep this gentle but sensitive detail? | Keep it, told lightly and with no medical detail, with other innocent reasons held in the bank for replays. |
| core_16 | Which policy answers can an organisation not change (the locked answers)? | Six: never share passwords or MFA codes; never use someone else's login; never lend a badge; never look at data you do not need for your job; never switch off security software; always report a suspected incident. |
| core_17 | Who sees the learner's year profile? | The learner only, by name; the organisation sees areas in aggregate above the HA-09 threshold, plus completion, the check and critical behaviours as for any module; never used for discipline. |
| role_01 | Should paying the ransom be a real option for the board? | Yes; paying is not generally unlawful in the UK and some boards choose it. Assess the process (advice, sanctions check, insurer told, reasons recorded, board agreement), not the verdict, and show realistic consequences without moralising. |
| role_02 | Should the player be able to sign off in someone else's name (Hassan's sticky-note password, or Bea's leftover approver access)? | Yes, as an ethical choice with a consequence; Ledger cannot tell who was at the keyboard, which is the lesson. |
| role_05 | How specific to be about recruitment fraud, where the advisories name North Korean IT workers? | Name them in `concepts.md` and on the reference card, but keep the game's fraudster an unnamed, faceless network, so no candidate's nationality, accent or appearance becomes the clue; the clues are inconsistencies and refusals. |
| role_06 | One-time codes: the course tells everyone never to read a code out, yet many contact centres verify callers that way. Which rule wins? | Larkspur's default never asks a customer to read out a code; organisations that do verify by read-back can switch it on, and the module then adds the safeguards and explains why their procedure differs from the course-wide rule. |
| core_02, core_10, core_12, role_03, role_05, role_06, core_15 | Are Jo Fairweather's authorised-test reveals fair across the attacker-view modules (and the announced deepfake demo in core_15)? | Yes; it mirrors real practice, the reveal is warm, and nothing about it is rated differently (core_17). Tests are authorised in the fiction, named colleagues such as Leo are in on the debrief and thanked (core_12), and the core_15 fake is announced in advance and explained straight away. |

## Decided

(None yet.)
