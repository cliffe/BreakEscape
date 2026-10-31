# What is built, and how the plan now builds on it

**Written 2026-10-27, after merging main; updated the same day after a second merge (main had resumed the product and closed most stages).** This plan was drafted before main gained a working social-engineering build and an awareness product. This file records what exists, how the plan maps onto it, and how each conflict was settled. **Where the plan and the build disagree, the build wins**, and the plan is rewritten to extend it rather than replace it.

Full evidence, with paths:

- `research/built_episodes_vs_plan.md`: the 38 awareness scenarios against the 26 planned modules;
- `research/current_state_social_engineering_build.md`: every catalogue id (BE, MG, EX, HA) against the code on main.

The build's own documents live in `../phishing_and_social_engineering/`. Start with `README.md` (key decisions A to AA), `designs/11_awareness_product_episodes.md`, `awareness/HANDOVER.md`, `awareness/BRAND_SET.md` and `FUN_DECISIONS.md`. Those files and the scenario files are the source of truth for anything already built.

## 1. What exists

**Product line: "Incident Simulations: Critical Cases".** This is the user's decision F2, and it sits apart from SAFETYNET. It uses a neutral corporate skin (`ui_theme: "general"`) and the Hacktivity `training` collection.

**The frame.** Every scenario is one training room with a kiosk and a host NPC. The kiosk opens the episode runner, which steps through the stages with a step strip. There are no doors, no combat and no VMs. The player's chosen avatar always wins (aw9).

**Seven full episodes**, each about 15 minutes (E6 and E7 about 16):

| Episode | Topic | Company | Role |
|---|---|---|---|
| E1 | Invoice and bank-detail fraud | Brightwell Foods | finance |
| E2 | CV and recruitment lures | Tarrowby Logistics | hr |
| E3 | Help-desk reset by phone, then MFA fatigue, with a role swap | Quayholt Insurance | helpdesk |
| E4 | Executive whaling | Merrin & Sallow Architects | executive |
| E5 | Fake sign-in pages | Quayholt Insurance | general |
| E6 | Texts and QR codes | Tarrowby Logistics | mobile |
| E7 | Cloned CEO voice | Brightwell Foods | everyone |

E3's target is about 15 minutes. Its MFA-fatigue beat is now a learner decision: the learner picks how many pushes to send and when, and the debrief explains why fatigue works. For sessions under 30 minutes, organisers are told to use the defend-only versions.

Every episode follows the same shape:

1. **Brief and scope note.**
2. **Attack half.** Look at public sources, then build one attack from templates whose blanks only take facts the learner has found. This part is unscored.
3. **Flip.** The learner's own message arrives in a defender's inbox with its tells highlighted.
4. **Defend half.** Triage messages with Trust, Report, Delete or Verify. This part is scored.
5. **Debrief.** A reasoning card per item, feedback on the genuine items, a "team protected" tally, the shared rule of thumb, an "On Monday" card, the customer's reporting route and a no-blame line.

**Defend-only variants.** There are seven, each about 8 minutes: brief, defend, debrief.

**Pre and post checks.** There are 24 of them: six roles (finance, hr, helpdesk, executive, general, mobile), each with two 10-item forms played in AB and BA order. Each takes about 9 minutes (finance about 8 to 10) and has no pass mark. Under the awareness scoring profile, two zero skills cap the grade at "Getting there". The post-check shows the change from the newest pre-check. Measurement records hold ids, verdicts and times, never free text and never the learner's identity. A discrimination figure goes to organisers only (aw3), and the product makes no effectiveness claims.

**The student lab** (`lab_social_engineering`) is the browser-only technical product. It uses the same systems.

**Systems on main** that the plan did not have ids for:

- the episode runner and flip view;
- the OSINT browser;
- the intel board and typed intel facts;
- the phish rules engine and the pretext judge;
- pretext prep and the template composer;
- the influence global per character, with a bar and thresholds;
- one ink story per channel, with synced globals;
- the mail client (accounts, devices, scheduler);
- the landing-page builder (a scored model, never a working page);
- inbox triage (email, call, voicemail, push, page, SMS and QR cards, the report button, Verify);
- awareness-measure records;
- concept cards;
- the look-alike NPC guard;
- the social validator (`--strict-social`) and its CI job.

**Status (2026-10-27).** The user resumed the product on 2026-10-27, and most stages are now closed: design, check forms, engine (rounds 1 to 5 plus the P6 and P7 rounds), data and dialogue (C1 to C5), playtests P6 and P7, training rooms C1 to C3, the four POV conversation backgrounds (made, wired, approved) and the light puzzle-chain pass. A closing check is running. What remains, in order: host character art after the PixelLab reset on 3 November (all 19 concepts approved; the Brightwell finance host is now Joanne Pell), a short playtest of the new sprites, human timing runs when the user asks, and one facilitator guide for the whole course, written last. aw7 is settled: E6 and E7 keep both versions with organiser guidance, and two courses are seeded in Hacktivity (defend-only episodes; both versions). The current status is the "Status 2026-10-27" block in `../phishing_and_social_engineering/awareness/HANDOVER.md`.

## 2. How each conflict is settled (build wins)

| # | Topic | The plan said | Settled as (from the build) | Where the plan now changes |
|---|---|---|---|---|
| R1 | Name | D3 open; "Induction Essentials" pathway | **Incident Simulations: Critical Cases** (F2). D3 closed | README, overview, decisions |
| R2 | World | One company, Larkspur Group, a recurring cast led by Ama Owusu, the player as a new starter | **A training room at a client company.** It uses the brand set (Brightwell, Tarrowby, Quayholt, Merrin & Sallow, all on `.example` domains) with a host per scenario. Larkspur is retired as a setting. "Larkspur Travel" survives only as a supplier inside the executive check forms. New companies go into `BRAND_SET.md` and get a web search before release. The plan's cast names may be reused as hosts or staff at a brand-set company, but not as a single recurring workplace | 03_WORLD_AND_CAST, every module |
| R3 | Shape | Seven beats: Hook, Learn, Practise, Apply, Debrief, Check, Reference | **Brief, attack, flip, defend, debrief, with pre and post checks around the episodes.** The beats map as: Hook = brief plus attack; Learn = flip plus concept cards; Practise and Apply = defend; Debrief = debrief; Reference = the "On Monday" card and the habit; Check = the post-check. Topics with no natural attacker (core_05, core_06, core_16) use a **consequence flip**: the learner makes the everyday mistake in a safe sandbox and the flip shows where it led. They can also use the defend-only shape; see D13 | 01_LEARNING_DESIGN, MODULE_TEMPLATE, every module |
| R4 | Habit | Motto *Pause. Check. Report.* | **The built rule of thumb, word for word, in every debrief** (aw4, enforced by a test): *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* Any short tagline is a new decision for the user (D14) | All docs |
| R5 | Attacker view | MG-30 pretext workshop: optional, P3, fragment bank, nothing sent | **Attack-first is the default; defend-only is the opt-out** (V). Messages use templates with blanks filled only from facts the learner holds (D, M). Sends reach fictional characters who reply through ink (C, N). Links, pages and attachments are abstract models, never working ones (S, T). MG-30 and EX-06 are **delivered** by these systems | minigames, explainers, modules |
| R6 | Assessment | MG-20 question bank, 80% pass mark, Secure/Developing/Not yet, critical-behaviour loop-backs, certificates | **Role-based pre and post checks with no pass mark, scored only in the defend half and in the checks, plus awareness-measure records.** Each module's question bank becomes a pool of candidate items for check forms and defend sets. Critical behaviours become paired items (a mirror pair, aw5). A pass mark or certificate is a later organisation option on the post-check percent, not a default | assessment.md files, assessment_and_evidence |
| R7 | Roles | role_01 to role_07, sector_01 | **Six built check roles:** finance, hr, helpdesk, executive, general and mobile. role_02 builds on finance, role_03 on helpdesk, role_05 on hr and role_01 on executive. general and mobile cover the core topics. role_04, role_06, role_07 and sector_01 stay as later roles, each needing its own check form pair | overview, role modules |
| R8 | Platform | 26 new Hacktivity features (HA-01 to HA-26) | **Ordinary missions in the `training` collection, ordered by the organiser.** The customer reporting-route setting is now built on Hacktivity main (free text, at organisation, course and listing level, with the two seeded courses); its pre-canned options are WP-02. The rest of the HA list is a later wish list, and no Hacktivity change happens without the user | hacktivity.md |
| R9 | Explainers | Mentor NPC, produced and engine-recorded video, intranet terminal | **Host NPC, concept cards, feedback strings and text to speech.** No video. EX-02, EX-03 and BE-09 drop to P3 or "if a module needs it" | explainers, engine |
| R10 | AI | MG-16 simulated assistant | **No language model at runtime** (P). Any AI assistant in an episode is authored data or ink | core_15, minigames |
| R11 | Avatars | BE-25 "no hooded hackers" | **The chosen avatar always wins, and the portrait follows** (aw9). The default hooded fallback stays | engine |
| R12 | Timings | 15 to 20 minute modules, 3 to 5 minute drills | **About 15 minutes per episode** (E6 and E7 about 16), about 8 minutes defend-only and about 9 per check. A pre-check, one episode and a post-check come to about 33 minutes; under 30 minutes, use defend-only. The defend-only shell is the micro-drill | overview |
| R13 | Domains and brands | D2 open | **`.example` domains, invented brands with learnable look-alike shapes only, and no real brands** (S, BRAND_SET). D2 closed | decisions |

## 3. Coverage today

| Module | Built coverage | What the plan still adds |
|---|---|---|
| core_00 | None | A first-play "how it works" brief inside the kiosk frame, plus the habit |
| core_01 | **Large**: E1, E2, E4, E5 and every check | What to do after a click (LO6), more defend items |
| core_02 | Part: E3, E6, E4 and E7 voicemail | In-person approaches, chat apps, remote-access scams, the UK personal-scam routes (7726, 159, Report Fraud) |
| core_03 | Narrow: E3 MFA stage | Passphrases, password managers, passkeys |
| core_04 | Part: report button, tally, route box and no-blame line in every debrief | What counts as an incident, what to report, the first steps, what happens next |
| core_05, core_06 | None | Whole episodes (consequence flip) |
| core_07 | Touch: E2 macro panel | Ransomware and updates episode |
| core_08 | Part: E5 address bar and padlock myth | Downloads, fake "verify you are human" pages, browser warnings, extensions |
| core_09 | Touch: E6 | Remote and mobile working episode |
| core_10 | None | Physical episode (tailgating, visitors) |
| core_11 | **Large**: E1, E7, E4, finance checks | Confirmation of Payee, what to do once money has gone |
| core_12 | Part: OSINT "reduce" notes, E2 and E4 posts | Privacy settings, fake profiles |
| core_13, core_14, core_16 | None | Whole episodes |
| core_15 | Narrow: E7, E4 voice | AI tool use, data in prompts, prompt injection |
| core_17 | Touch: post-checks | An annual mixed edition built from the existing defend sets |
| role_01 | Touch: E4, executive checks | Board crisis exercise |
| role_02 | Part: E1, E7, finance checks | Payment run review, payroll diversion, the first hour after a fraud |
| role_03 | **Large** (service desk half): E3 role swap, helpdesk checks | Least privilege, app consent, alerts after a reset |
| role_05 | Part: E2, hr checks | Joiners, movers and leavers; fake candidates |
| role_04, role_06, role_07, sector_01 | None or touch only | Whole role episodes and check pairs |

## 4. What comes next (replaces the old roadmap)

The build plan now lives in **`implementation/`**: start at `implementation/00_README.md`. It holds the work order, the dependency table, the engine packets (`02_ENGINE_WORK.md`), the pipeline (`01_PIPELINE.md`), the new check forms (`10_CHECK_FORMS.md`), WP-12, WP-15 and WP-02, and one implementation spec per new episode (`implementation/episodes/E08` to `E17`). Those briefs were checked against the code and the built content over several adversarial review rounds (`implementation/reviews/`), and they win over this file and the module plans wherever they differ.

In short (user decisions of 2026-10-27):

1. The built product finishes on its own track (host art after 3 November, timing runs, one facilitator guide).
2. New episodes E8 to E17 are built in the built shape, pilot first (E8), with the engine packets each needs. The separate "engine gaps" package was dropped; the small fixes an episode needs are folded into its packets.
3. Two new check-form pairs (`general_v2`, `data_conduct`) cover the new topics; the six role forms stay unchanged.
4. WP-12 (core_00 first-play brief, core_17 annual edition), WP-15 (core_02 defend items) and WP-02 (the reporting-route setting with pre-canned options) run alongside.
5. Later, by user decision: role extensions, new roles, accessibility, drills and the kids game.

## 5. What the plan keeps

The build does not replace these, and they stay as plan:

- **The topic-boundary table.** It matters more now that E1, E4 and E7 all touch payment fraud.
- **Every module's `concepts.md`** as the source of truth for new episodes and for check items.
- **The compliance mapping.** It is re-pointed at the built episodes and checks; see `02_COMPLIANCE_MAPPING.md`.
- **The accessibility plan,** including the text route and WCAG 2.2 AA. These are gaps in the build.
- **Facilitation.** The user chose one facilitator guide for the whole course, written last (FUN_DECISIONS q_facil). The runner's `facilitated` flag is still unused; a facilitated shell or per-episode notes are at most an extension.
- **Spaced drills,** delivered as defend-only shells.
- **The organisation profile** beyond the reporting route.
