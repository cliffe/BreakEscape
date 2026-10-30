# Decisions pending

Questions for the user. Each has a recommendation; the plan follows the recommendation until the user says otherwise. When a question is answered, move it to the "Decided" section with the date, the choice and its source.

**Updated 2026-10-27**, when the plan was reconciled with the built awareness product (`04_BUILT_SO_FAR.md`). Where the build has already answered a question, it is closed below with the source. Evidence: `research/built_episodes_vs_plan.md` §3.

## Waiting on the user (from the build)

### The customer's reporting route

- **Background:** the debrief's "On Monday" card has a slot for the customer's own reporting route (`slot:customer_report_route`, aw1, built). The user chose to set it as a Hacktivity setting, then asked for options. A proposal and an options form (linked from `awareness/HANDOVER.md` §5) set out approaches A to F, which settings, their scope and the fallback.
- **Status:** not answered. No Hacktivity change happens without the user's explicit go-ahead (R8).
- **Recommendation:** none added here; the options form is the place to answer. It is the only platform change the plan proposes for now.

### E8 to E20 build questions (2026-10-29, `implementation/BUILD_LOG.md`)

- **E13 deepfake demo call:** wired but gated on `e13_demo_offered`, which nothing sets. Reviewer proposal: open it as a spoken debrief once the kiosk work is done (set the flag on the defend-done change); else cut it, since the scored video call already teaches the lesson.
- **Debrief "habit to keep" outside phishing:** every episode shows the set-wide rule of thumb (`AWARENESS_RULE_OF_THUMB_TEXT`, about money and codes). On E17 acceptable use, E15 shadow IT and E20 Wi-Fi it reads off-topic. Options: keep the one constant everywhere; or let an episode carry its own habit line beside it.
- **Inboxly:** an invented mail product in built E1, E2 and E4 that matches a live email product. Rename or keep.
- **Title-screen name:** the title screen shows each episode's `mission.json` `display_name` ("Awareness E20: Remote and mobile working (full episode)"), the convention on all built episodes. Blind testers read it as an internal code. Options: keep it (it is also the Hacktivity listing name); or show the `scenario_name` ("Remote and mobile working: two days on the road") on the title screen and keep `display_name` for listings.
- **E20 host art:** new host art after the 3 Nov PixelLab reset, or reuse a built host.
- **Verdict button colours (2026-10-30):** a blind tester said the green Trust, amber Report and red Delete marks hint at the answer. They are the engine default in every episode. Keep, or make them neutral course-wide?
- **"Confirm with nothing ticked" prompt (2026-10-30):** batch 11's `set.confirmPrompt` is on in E11, E12, E13, E15 and E16 only. Turn it on in every episode, or keep it where testers hit the problem?
- **E17 team counter (2026-10-30):** batch 10 updates it after the feedback card draws (same tick). Holding it until Next means rewriting the team-tally tests. Is the reorder enough?
- **`defend_pass` name (2026-10-30):** it marks completion (no default pass mark), but three testers read it as a pass at 5-35% rounds. Rename to `_complete` (touches records and any reporting that reads it), or keep?
- **core_17's E3 impostor call (2026-10-30):** the visible-tell fix scored `secrecy_or_bypass` on the annual's copy of E3's impostor call ("No sense ringing the desk" is on screen); E3's own item, outside the E8-E20 scope, still scores two tells. Backport the tell to E3 (an E1-E7 edit), or accept that the annual scores it more fully?
- **E12 badge-less colleague (2026-10-30):** "Let them in" scores full marks because the card now shows them on the staff list. Or should a person without a badge always need a check?
- **Orchestrator rulings you may overrule:** E12 §20.2 relabel the reception buttons (now Let them in / Report / Turn away / Check first) and §20.5 keep seven items; E20 home working gets a sixth concept card, brief kept; E19 content note widened to the learner's own machine; E10 high-harm pages count as critical misses.

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

### D13. Topics with no attacker: consequence flip or defend-only? (decided 2026-10-27, see Decided)

- **Background:** core_05 (data protection), core_06 (handling information) and core_16 (acceptable use) have no natural attacker for the attack half. R3 offers two shapes: a **consequence flip** (the learner makes the everyday mistake in a safe sandbox, such as an autocomplete to the wrong address, and the flip shows where it led), or the **defend-only** shape (brief, defend, debrief) on its own.
- **Recommendation:** the consequence flip for E11 (core_05 and core_06), and for core_13 shadow IT later, since there is a natural everyday mistake to make and it keeps the built five-stage shape. core_16 uses defend-only plus check items, since its content is policy knowledge with no single mistake to replay. The consequence flip needs a runner change (an attack half with no target to judge), so it waits on the engine gaps in `04_BUILT_SO_FAR.md` §4 step 2.

### D14. A short tagline alongside the rule of thumb? (decided 2026-10-27, see Decided)

- **Background:** the plan's motto *Pause. Check. Report.* is replaced by the built rule of thumb, shown word for word in every debrief under "The habit to keep" (aw4, enforced by a test). The plan used the motto as a memorable three-word tag on reference cards.
- **Options:** (a) no tagline; the heading "The habit to keep" and the rule of thumb are enough; (b) add a short tagline, set once in `awareness_deploy.py` next to the rule of thumb so every shell carries the same words.
- **Recommendation:** (a). The rule of thumb already names the actions; a second phrase adds something to remember and something to keep in step. If the user wants one, it goes in `awareness_deploy.py`, never as plan-only text.

### D15. The order of new episodes E8 to E13 (decided 2026-10-27, see Decided)

- **Background:** `04_BUILT_SO_FAR.md` §4 proposes E8 after the click (core_04, core_01 LO6), E9 passwords and password managers (core_03), E10 fake downloads and "verify you are human" pages (core_08, core_07), E11 misdirected and overshared data (core_05, core_06), E12 the visitor and the tailgater (core_10), E13 the AI assistant (core_15). Each is a full episode, a defend-only variant and new check items. The built product is on hold and its resume plan comes first.
- **Recommendation:** keep that order. E8 fills the largest gap (what to do next, which every built episode leads into) and reuses the inbox and report systems as they are. E9 and E10 build on E3's MFA stage and E5's landing-page builder. E11 needs the consequence flip (D13), E12 needs person-chat in the training room, and E13 needs an authored assistant, so they come once those runner changes exist. Companies: `03_WORLD_AND_CAST.md` (E11 and E13 at proposed new companies).

### D16. Smaller calls from the reconciliation

Each has a working answer in the plan; confirm or change.

| Item | Working answer | Where |
|---|---|---|
| Induction starter pathway | core_00, then the general check pair with E5, then E1 or E6; about 53 minutes now that episodes run about 15 and checks about 9 | `00_COURSE_OVERVIEW.md` |
| Facilitated session length | Partly answered: the user chose one facilitator guide for the whole course, written last (FUN_DECISIONS q_facil). Still open: the session length the guide recommends; working answer 30 to 45 minutes | `01_LEARNING_DESIGN.md` |
| core_00 and core_17 targets | core_00 about 5 minutes, no defend-only variant; core_17 about 20 minutes (mixed defend set plus the post-check) | `00_COURSE_OVERVIEW.md` |
| Defend-only for every role episode | Recommendation: yes, every episode ships a defend-only variant, as E1 to E7 do (the overview still says "none" for role_01 and role_07) | `00_COURSE_OVERVIEW.md` |
| Secure / Developing / Not yet | Recommendation: drop them as reported bands; keep as descriptive columns only, since the build reports per-item results, not bands | `MODULE_TEMPLATE.md`, assessment files |
| Company picks for E8 to E13 | Quayholt (E8), Merrin & Sallow (E9), Tarrowby (E10), Cobbleford Care (E11, proposed), Brightwell (E12), Lintgate Communications (E13, proposed) | `03_WORLD_AND_CAST.md` |
| Verify in the check forms | The finance, executive, helpdesk and mobile check forms turn Verify on, but `BRAND_SET.md` §6 says the checks measure Trust, Report and Delete only. Confirm which is intended, then update the other (a build question, not plan) | `../phishing_and_social_engineering/awareness/BRAND_SET.md` |
| Platform priorities | Next: HA-11 (the route setting only); P2: HA-05, 09, 14, 03, 15, 19, 23, 01; P3: the rest, including HA-06, 07, 17 and 26 (were MVP) | `features/hacktivity.md` |
| Name of the new-starter path | "the new-starter path" for now (was Induction Essentials) | overview, hacktivity |
| Outcome-rating bands, if ever reported | Starting point only: bands at 80 and 50; pre-check weight 0, post-check weight 2 | `features/assessment_and_evidence.md` |
| "Delivered today" compliance claims | Check they are not overstated before any customer sees them | `02_COMPLIANCE_MAPPING.md` |
| Companies for E8 to E13 disagree between files | The module designs say E8 Quayholt, E9 Tarrowby, E10 Quayholt, E11 Carrholme Services (proposed), E12 Merrin & Sallow, E13 Brightwell; `03_WORLD_AND_CAST.md` and `features/explainers_video_and_npc.md` give a different set. Recommendation: adopt the module designs (they hold the detail) and align the other two files. Asked on the build review page | modules, 03, explainers |
| Proposed new names to add to `BRAND_SET.md` after a web search | Carrholme Services (E11), Cobbleford Care and Lintgate Communications (03 alternatives), Marrowdale Facilities (core_16), Harbreck Facilities Group (role_01 board crisis), Stavely Software (role_04), Beckside Hospitals NHS Trust (sector_01), "Deskmate" (the authored AI assistant), `brightwell-support.example` | modules, minigames |
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

### Build review page answers (2026-10-27, https://claude.ai/artifact/KgNmWofGssh2LfPYpLuL3r)

| Item | Verdict | User's note |
|---|---|---|
| WP-01 Finish and ship E1 to E7 | Later | Waits on the PixelLab reset for character art; continue with other features meanwhile, building on the foundation |
| WP-02 Customer reporting route in Hacktivity | Go now | A list of pre-canned options seems useful |
| WP-03 Engine gaps | Drop | No spy theme in the awareness courses; Hacktivity is the brand, so its name on the title screen does no harm. The offensive beat before the defence, and games-based learning, are possible USPs |
| WP-04 Accessible route | Later | For discussion: how would a text route work? Fold into the lab-sheet walkthroughs? Make the existing more accessible? Maybe out of scope |
| WP-05 to WP-10 (E8 to E13) | Go now | E12: swap the player's avatar to a hi-vis one in the attack half to gain influence; a held package as a PixelLab state; an NPC opening a door is a small add |
| WP-11 E14 to E17 | Go now | |
| WP-12 First-play brief and annual edition | Go now | |
| WP-13 Role extensions | Later | |
| WP-14 New roles | Later | |
| WP-15 core_02 missing-channel defend items | Go now | |
| WP-16 Spaced drills and session plans | Later | |
| WP-17 Kids game prototype | Later | |
| D13 | Consequence flip for E11 and shadow IT; defend-only for acceptable use | |
| D14 | No tagline | |
| D15 | Keep the order E8 to E13 | |
| D16 companies | The module designs' set: E8 Quayholt, E9 Tarrowby, E10 Quayholt, E11 Carrholme Services (new), E12 Merrin & Sallow, E13 Brightwell | |
| Verify in the check forms | The scenarios are right; update the brand-set notes | |
| Seeding new episodes | Every new episode ships both versions and joins both seeded courses | |


### Decided on main since the first reconciliation (2026-10-27, `../phishing_and_social_engineering/FUN_DECISIONS.md`)

- **aw7 (E6 and E7 defend-only by default):** both versions stay listed, with organiser guidance; two courses are seeded in Hacktivity, one with the defend-only episodes and one with both versions.
- **Episode length:** say "about 15 minutes" (E6 and E7 "about 16"); recommend defend-only for sessions under 30 minutes; human timing runs later.
- **E3 MFA fatigue:** one learner decision (how many pushes, and when); the debrief explains why fatigue works.
- **Facilitation:** one facilitator guide for the whole course, in the lab-sheet system, written last.
- **Hosts and art:** all 19 host concepts approved; the Brightwell finance host is renamed Joanne Pell (m10 has its own Farah Qureshi); POV backgrounds approved and wired; PixelLab characters after the 3 November reset.
- **E7 mirror pair:** the existing voicemail mirror stays; closed.
- Still open on main: the reporting-route options form (route_config).

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
