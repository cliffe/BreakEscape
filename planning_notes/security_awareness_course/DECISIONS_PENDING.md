# Decisions pending

Questions for the user. Each has a recommendation; the plan follows the recommendation until the user says otherwise. When a question is answered, move it to the "Decided" section with the date and the choice.

## Open

### D1. Its own world, or part of the Break Escape campaign?

- **Background:** the campaign is a spy thriller (SAFETYNET, ENTROPY, combat). The SIS games already have their own standalone world.
- **Options:** (a) a separate world (Larkspur Group) with optional nods to the campaign, such as a poster in the break room; (b) set it inside the campaign universe, with SAFETYNET training staff.
- **Recommendation:** (a). Buyers need staff to recognise their own working day, and the threats have to look like real ones. See `03_WORLD_AND_CAST.md`.

### D2. The organisation's name

- **Background:** "Larkspur Group" is a working name. Any plausible company name may belong to a real business.
- **Recommendation:** keep it as the working name, and run a trademark and domain check before anything is published. Every domain used in the game must be unregistered or reserved.

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

### D8. Test-out for experienced staff

- **Recommendation:** offer it as an organisation setting, off by default. Passing the Apply beat and the check records the module as complete; missing a critical behaviour sends the learner through the full module.

### D9. Accessibility commitment

- **Recommendation:** WCAG 2.2 AA for the text route, the Hacktivity pages and every minigame's HTML interface; the 2D world follows the game accessibility guidelines, and the text route is the equivalent alternative where the 2D world falls short. Publish an accessibility statement. See `features/accessibility_and_inclusion.md`.

### D10. Where the Hacktivity plans live

- **Background:** this repo is public; Hacktivity is private. `features/hacktivity.md` is written at feature level, with no internal detail.
- **Options:** (a) keep it here; (b) move it to the Hacktivity repo and leave a pointer.
- **Recommendation:** (a) for now, since the course plan reads better in one place; move it if you'd rather keep Hacktivity's roadmap private.

## Decided

(None yet.)
