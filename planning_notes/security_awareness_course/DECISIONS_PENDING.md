# Decisions pending

Questions for the user. Each has a recommendation; the plan follows the recommendation until the user says otherwise. When a question is answered, move it to the "Decided" section with the date, the choice and its source.

**Updated 2026-10-27**, when the plan was reconciled with the built awareness product (`04_BUILT_SO_FAR.md`). Where the build has already answered a question, it is closed below with the source. Evidence: `research/built_episodes_vs_plan.md` §3.

## Waiting on the user (from the build)

### The customer's reporting route

- **Background:** the debrief's "On Monday" card has a slot for the customer's own reporting route (`slot:customer_report_route`, aw1, built). The user chose to set it as a Hacktivity setting, then asked for options. A proposal (`../phishing_and_social_engineering/awareness/HACKTIVITY_ROUTE_PROPOSAL.md`) and an options form (linked from `awareness/HANDOVER.md` §5) set out approaches A to F, which settings, their scope and the fallback.
- **Status:** not answered. No Hacktivity change happens without the user's explicit go-ahead (R8).
- **Recommendation:** none added here; the options form is the place to answer. It is the only platform change the plan proposes for now.

## Open

### D6. Market order and localisation

- **Background:** the build is UK-flavoured: UK regions, sterling, Ofcom drama numbers, NCSC grounding. Its voiced lines are cached by exact text, so each language needs its own audio.
- **Recommendation:** UK first, with notes for the EU and the US in each concepts file and the compliance mapping covering both. Translation (BE-06, HA-16) later, and only after the text route exists, since text is cheaper to localise than voiced lines.

### D9. Accessibility commitment

- **Background:** the build has a first-slice baseline: keyboard play of the attack and defend beats, accessible names on the report and verdict controls, reduced motion and plain-text alternatives in the item data (`designs/11`). The full audit and screen-reader work on the canvas surfaces is deferred. There is no equivalent text route (BE-03).
- **Recommendation:** WCAG 2.2 AA for the episode runner's HTML views, the check forms and the Hacktivity pages; the 2D training room follows the game accessibility guidelines, with the text route (BE-03) as the equivalent alternative where it falls short. Publish an accessibility statement once BE-03 is built. See `features/accessibility_and_inclusion.md`.

### D10. Where the Hacktivity plans live

- **Background:** this repo is public; Hacktivity is private. `features/hacktivity.md` is written at feature level. The build's own reporting-route proposal also sits in this public repo, at a more detailed level.
- **Options:** (a) keep both here; (b) move platform-level detail to the Hacktivity repo and leave a pointer.
- **Recommendation:** (a) for `features/hacktivity.md`, which stays at feature level (and is now mostly a later wish list, R8). Consider (b) for the route proposal's code-level detail once the route is decided.

### D11. Compliance gaps the mapping found

`02_COMPLIANCE_MAPPING.md` shows four requirements nothing planned or built meets. The mapping is now re-pointed at the built episodes and checks; the gaps carry over:

1. **Specialised data protection training.** The ICO expects extra training for data protection officers, subject access teams and records managers. *Recommendation:* a role episode and check pair later (role_08, data protection specialists), rather than stretching E11.
2. **Developer and incident-response training under PCI DSS.** The awareness product is awareness level, so it does not meet PCI DSS 6.2.2 or 12.10.4 on its own. *Recommendation:* say so plainly in the sales material, and point to Hacktivity's existing technical labs for those roles.
3. **Exercising the customer's own incident plan.** Cyber Governance Code D2 asks boards to exercise their own plan at least annually. A role_01 board exercise would use a brand-set company's plan. *Recommendation:* let a facilitated version (the runner's unused `facilitated` flag) load the customer's plan headings and contacts from the organisation profile.
4. **Advanced persistent threats.** NIST AT-2(5) is not covered. *Recommendation:* a short optional concept panel in a role_01 or role_03 episode, not an episode of its own.

### D13. Topics with no attacker: consequence flip or defend-only?

- **Background:** core_05 (data protection), core_06 (handling information) and core_16 (acceptable use) have no natural attacker for the attack half. R3 offers two shapes: a **consequence flip** (the learner makes the everyday mistake in a safe sandbox, such as an autocomplete to the wrong address, and the flip shows where it led), or the **defend-only** shape (brief, defend, debrief) on its own.
- **Recommendation:** the consequence flip for E11 (core_05 and core_06), and for core_13 shadow IT later, since there is a natural everyday mistake to make and it keeps the built five-stage shape. core_16 uses defend-only plus check items, since its content is policy knowledge with no single mistake to replay. The consequence flip needs a runner change (an attack half with no target to judge), so it waits on the engine gaps in `04_BUILT_SO_FAR.md` §4 step 2.

### D14. A short tagline alongside the rule of thumb?

- **Background:** the plan's motto *Pause. Check. Report.* is replaced by the built rule of thumb, shown word for word in every debrief under "The habit to keep" (aw4, enforced by a test). The plan used the motto as a memorable three-word tag on reference cards.
- **Options:** (a) no tagline; the heading "The habit to keep" and the rule of thumb are enough; (b) add a short tagline, set once in `awareness_deploy.py` next to the rule of thumb so every shell carries the same words.
- **Recommendation:** (a). The rule of thumb already names the actions; a second phrase adds something to remember and something to keep in step. If the user wants one, it goes in `awareness_deploy.py`, never as plan-only text.

### D15. The order of new episodes E8 to E13

- **Background:** `04_BUILT_SO_FAR.md` §4 proposes E8 after the click (core_04, core_01 LO6), E9 passwords and password managers (core_03), E10 fake downloads and "verify you are human" pages (core_08, core_07), E11 misdirected and overshared data (core_05, core_06), E12 the visitor and the tailgater (core_10), E13 the AI assistant (core_15). Each is a full episode, a defend-only variant and new check items. The built product is on hold and its resume plan comes first.
- **Recommendation:** keep that order. E8 fills the largest gap (what to do next, which every built episode leads into) and reuses the inbox and report systems as they are. E9 and E10 build on E3's MFA stage and E5's landing-page builder. E11 needs the consequence flip (D13), E12 needs person-chat in the training room, and E13 needs an authored assistant, so they come once those runner changes exist. Companies: `03_WORLD_AND_CAST.md` (E11 and E13 at proposed new companies).

### D16. Smaller calls from the reconciliation

Each has a working answer in the plan; confirm or change.

| Item | Working answer | Where |
|---|---|---|
| Induction starter pathway | core_00, then the general check pair with E5, then E1 or E6; about 40 minutes | `00_COURSE_OVERVIEW.md` |
| Facilitated session length | 30 to 45 minutes (was 45 to 60), to fit the shorter episodes; no shell uses the `facilitated` flag yet | `01_LEARNING_DESIGN.md` |
| core_00 and core_17 targets | core_00 about 5 minutes, no defend-only variant; core_17 about 20 minutes (mixed defend set plus the post-check) | `00_COURSE_OVERVIEW.md` |
| Defend-only for every role episode | Recommendation: yes, every episode ships a defend-only variant, as E1 to E7 do (the overview still says "none" for role_01 and role_07) | `00_COURSE_OVERVIEW.md` |
| Secure / Developing / Not yet | Recommendation: drop them as reported bands; keep as descriptive columns only, since the build reports per-item results, not bands | `MODULE_TEMPLATE.md`, assessment files |
| Company picks for E8 to E13 | Quayholt (E8), Merrin & Sallow (E9), Tarrowby (E10), Cobbleford Care (E11, proposed), Brightwell (E12), Lintgate Communications (E13, proposed) | `03_WORLD_AND_CAST.md` |
| Verify in the check forms | The finance, executive, helpdesk and mobile check forms turn Verify on, but `BRAND_SET.md` §6 says the checks measure Trust, Report and Delete only. Confirm which is intended, then update the other (a build question, not plan) | `../phishing_and_social_engineering/awareness/BRAND_SET.md` |
| Platform priorities | Next: HA-11 (the route setting only); P2: HA-05, 09, 14, 03, 15, 19, 23, 01; P3: the rest, including HA-06, 07, 17 and 26 (were MVP) | `features/hacktivity.md` |
| Name of the new-starter path | "the new-starter path" for now (was Induction Essentials) | overview, hacktivity |
| Outcome-rating bands, if ever reported | Starting point only: bands at 80 and 50; pre-check weight 0, post-check weight 2 | `features/assessment_and_evidence.md` |
| "Delivered today" compliance claims | Check they are not overstated before any customer sees them | `02_COMPLIANCE_MAPPING.md` |
| Kids game verdicts and habit | Kids sorter verdicts "Trust" and "Tell a grown-up" (a third, "Leave it", open); fix the kids habit word for word as the adult rule is | `../kids_cyber_game/` |

## Module-level open questions

These are the open questions raised inside individual module READMEs that a stakeholder (rather than an author) should rule on. The plan's cast (Ama, Kai, Hassan and others) is now a pool of names, not a workplace (`03_WORLD_AND_CAST.md`), so the questions are restated without it where they still apply. Questions the build answered are under "Decided".

| Module | Question | Recommendation |
| --- | --- | --- |
| core_03 | A prompt flood at 02:13, outside work: right for all staff? (The training-room frame means it would be a scene inside E9's defend half, not the learner's own night.) | Keep it as one defend item; night is when prompt floods happen and it is memorable. Add a daytime variant for organisations that prefer it. |
| core_04 | Who presses the optional "cut off" step after a report? | The learner, in the E8 debrief or defend half, as a small reward for reporting; it stays optional, and the habit at the learner's own desk is "unplug the cable if we ask you to". |
| core_05 | Can the learner avoid the misdirected email, and what fills the breach slot if they do? | Yes; the autocomplete is visible and catchable, a learner who catches it is thanked, and the flip shows a different breach (personal data received by mistake) so everyone still practises reporting one. Depends on D13. |
| core_14 | How much to say about staff monitoring? | One line from the host ("our tools see files moving, but not why; people see the why"), the organisation's own monitoring notice on the "On Monday" card, and never imply staff are watched covertly. |
| core_14 | The colleague's innocent reason, a parent in hospital: keep this gentle but sensitive detail? | Keep it, told lightly and with no medical detail, with other innocent reasons held for defend items. |
| core_16 | Which policy answers can an organisation not change (the locked answers)? | Six: never share passwords or MFA codes; never use someone else's login; never lend a badge; never look at data you do not need for your job; never switch off security software; always report a suspected incident. |
| role_01 | Should paying the ransom be a real option for the board? | Yes; paying is not generally unlawful in the UK and some boards choose it. Assess the process (advice, sanctions check, insurer told, reasons recorded, board agreement), not the verdict, and show realistic consequences without moralising. |
| role_02 | Should the learner be able to sign off in someone else's name (a password on a sticky note, or leftover approver access)? | Yes, as an ethical choice with a consequence; the finance system cannot tell who was at the keyboard, which is the lesson. |
| role_05 | How specific to be about recruitment fraud, where the advisories name North Korean IT workers? | Name them in `concepts.md` and on the "On Monday" card, but keep the episode's fraudster an unnamed, faceless network, so no candidate's nationality, accent or appearance becomes the clue; the clues are inconsistencies and refusals. |
| role_06 | One-time codes: the rule of thumb tells everyone not to read back a code, yet many contact centres verify callers that way. Which rule wins? | The course default never asks a customer to read back a code (as every brand-set company does). Organisations that verify by read-back can switch it on; the episode then adds the safeguards and explains why their procedure differs from the rule of thumb. |

## Decided

### D1. Its own world, or part of the Break Escape campaign? (closed 2026-10-27)

- **Answer:** its own product line, "Incident Simulations: Critical Cases", apart from SAFETYNET, on the neutral corporate skin. The world is a training room at one of four invented client companies, with a host per scenario. Larkspur Group is retired as the setting.
- **Source:** user decision F2 (`../PHISHING_AND_SE_DECISIONS.md`); `designs/11_awareness_product_episodes.md`; `04_BUILT_SO_FAR.md` R2.

### D2. The organisation's name (closed 2026-10-27)

- **Answer:** superseded. Four invented companies (Brightwell Foods, Tarrowby Logistics, Quayholt Insurance, Merrin & Sallow Architects), every domain on `.example`, look-alikes in learnable shapes only, no real brands, and a pre-ship web search per company. Any name the modules use (Northbeck Supplies, Westmoor Council, DocShift and so on) joins BRAND_SET with a `.example` domain and gets the same check before use.
- **Source:** `awareness/BRAND_SET.md` §1; `04_BUILT_SO_FAR.md` R13.

### D3. The course's name (closed 2026-10-27)

- **Answer:** "Incident Simulations: Critical Cases". Mission titles use "Awareness E*" and "Awareness check".
- **Source:** user decision F2; `04_BUILT_SO_FAR.md` R1.

### D4. Hacktivity as the platform, or inside customers' own LMSs? (closed 2026-10-27)

- **Answer:** Hacktivity first, as ordinary missions in the `training` collection, ordered by the organiser. SCORM, xAPI and LTI are later.
- **Source:** `designs/11` §6.3; the build README's "Defaults taken"; `04_BUILT_SO_FAR.md` R8.

### D5. Phishing simulation (closed 2026-10-27)

- **Answer:** not built. The build measures on matched in-game items (pre and post checks) and makes no real-world click-rate or effectiveness claim. HA-12 stays on the later wish list.
- **Source:** `designs/11` §5.2.

### D7. Explainer videos (closed 2026-10-27)

- **Answer:** no videos. Explanation comes from the host, the scope note, concept panels, feedback strings and text to speech. EX-02, EX-03 and BE-09 drop to P3 or "if a module needs it". The presenter question is moot for the episode format.
- **Source:** the build (all 38 shells); `04_BUILT_SO_FAR.md` R9.

### D8. Test-out for experienced staff (closed 2026-10-27)

- **Answer:** no test-out. The defend-only variant (about 8 minutes: brief, defend, debrief) gives the measured defence without the attack half, and the pre-check is the baseline.
- **Source:** decision V; `04_BUILT_SO_FAR.md` R5 and R6.

### D12. The technical, hands-on phishing lab for specialists (closed 2026-10-27)

- **Answer:** the technical product is `lab_social_engineering` ("Phishing and Social Engineering", `lab_games` collection, browser-only, no VM), built on the same systems. The VM phishing plan is parked. The awareness product and the lab stay separate, and the awareness episodes keep attacker content at templates, pretexts and psychology. Product-level references only in this repo.
- **Residual:** role_03 and role_04 episodes may point specialist learners at the lab as an optional follow-on; recommended, for the user to confirm when those episodes are designed.
- **Source:** `../PHISHING_AND_SE_DECISIONS.md` (A2, A3, I1 to I5 superseded); the lab's `mission.json`.

### Module-level questions the build answered (closed 2026-10-27)

| Module | Question | Answer and source |
| --- | --- | --- |
| core_00 | Is a fake "new manager" message in the first minute too sharp a start? | Overtaken. core_00 becomes a first-play brief inside the kiosk frame, and every episode opens with a scope note saying it is an authorised exercise at a fictional company, so nothing ambushes the learner. Source: episode `scopeNote` strings; `04_BUILT_SO_FAR.md` §3. |
| core_13 | Should the car-park USB stick be a hidden authorised test revealed at the end? | Overtaken: there are no hidden tests or reveals; the whole exercise is declared authorised up front. Source: episode `scopeNote` strings. |
| core_02, core_10, core_12, role_03, role_05, role_06, core_15 | Are the ethical tester's authorised-test reveals fair? | Overtaken in the same way: the frame is an openly authorised exercise, so there are no reveals to judge. Source: episode `scopeNote` strings; `research/built_episodes_vs_plan.md` §3. |
| core_17 | Who sees the learner's year profile? | Scores go to the learner only; the discrimination figure to organisers only, never shown as blame; organiser aggregates are out of scope for now. Source: `FUN_DECISIONS.md` aw3; `designs/11` §4.3 (A4, A7). |
| BE-05 | How do the customer's reporting details reach the game? | The `customer_report_route` slot is built (aw1). How a deployment sets it waits on the user (see "Waiting on the user"). Source: `FUN_DECISIONS.md`; the route proposal. |
