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

### D12. A technical, hands-on-keyboard phishing lab for specialists?

- **Background:** the "learning by doing" research (Chothia, Paiu and Oultram, 2018) has learners build spear-phishing attacks end to end against a simulated company in an isolated VM, including crafting payloads with offensive tooling and capturing flags. That changed learners' understanding more than being shown examples, but it was run with computer science and penetration-testing students, not all staff. The awareness course takes only the pretext-and-psychology half, at awareness level, in the optional attacker-view beat (MG-30).
- **Question:** should the full technical version exist as well, as a Hacktivity technical lab for developers, security staff and penetration-testing learners (role_04 and the existing technical labs), separate from the awareness course?
- **Options:** (a) keep it out of scope, point specialist audiences at Hacktivity's existing technical labs; (b) build a dedicated sandboxed technical phishing lab as a Hacktivity lab, reusing the labs' existing isolation, and keep it entirely separate from the all-staff awareness course; (c) partner for it.
- **Recommendation:** (a) for now. The awareness course's goal is behaviour change for everyone, and MG-30 already carries the paper's key lesson safely. A technical lab is a different product for a different, consenting, technical audience; if there is demand, scope it as a Hacktivity lab under option (b), never as part of a mandatory all-staff path, and keep the awareness/technical line clear so the course stays safe to assign to anyone. This is a product-scope decision, not a change to any awareness module.

## Decided

(None yet.)
