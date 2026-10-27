# World and cast

**Reconciled with the build on 2026-10-27.** The plan first set the course inside one invented company, Larkspur Group, with a recurring cast. The build went another way, and the build wins (`04_BUILT_SO_FAR.md` R2). This file now describes the built frame and companies, and keeps the plan's cast as a pool of names for future episodes.

Sources of truth for anything built: `../phishing_and_social_engineering/awareness/BRAND_SET.md` (companies, domains, cast), the scenario files `scenarios/awareness_*` (hosts, rooms, items) and `../phishing_and_social_engineering/designs/11_awareness_product_episodes.md` (tone and product rules). Where a design doc and a scenario file differ, the scenario file wins.

Status key: **Built** (on main), **Builds on E# / system X** (extends something built), **New** (plan only).

## Relationship to the Break Escape campaign

**Built.** The awareness product is its own line, "Incident Simulations: Critical Cases" (user decision F2), apart from SAFETYNET. It uses the neutral corporate skin (`ui_theme: "general"`) and the Hacktivity `training` collection. There is no spy framing, no handler and no ENTROPY. The lab's brands (Ledgerwell, Tarnside Assurance, CloudBoxy, friendface) stay in the lab, so a learner who meets both products does not carry answers across (BRAND_SET §1).

## The frame: a training room, a kiosk and a host

**Built.** Every scenario is one training room at a client company:

- **The room.** One room per company: `room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt` and `room_aw_merrin_sallow`. There are no doors, no combat and no VMs. The POV conversation backgrounds are made, wired and approved, and the training-room review cycles C1 to C3 are closed (`awareness/TRAINING_ROOM_PLAN.md`, `HANDOVER.md` §3).
- **The kiosk.** The training kiosk opens the episode runner, which steps through the stages with a step strip: brief, attack, flip, defend, debrief. A check mission runs one triage form at the same kiosk.
- **The host.** One NPC per scenario, a member of the company's staff "minding the training", who welcomes the learner and points them at the kiosk. The host is not a mentor who follows the learner across episodes; the teaching sits in the scope note, the per-item feedback, the concept panels and the debrief.
- **The learner.** The player's display name is "Learner", and they take the role the episode names (finance, hr, helpdesk, executive, general, mobile, or everyone in E7). The chosen avatar always wins and the portrait follows (aw9); the default hooded fallback stays.
- **The scope note.** Every episode opens by saying it is an authorised exercise at a fictional company and that nothing the learner writes leaves the game. So there are no hidden tests and no surprise reveals.

### Hosts per scenario (Built)

| Company and room | Scenario | Host | Host's role |
|---|---|---|---|
| Brightwell Foods, `room_aw_brightwell` | E1 and E1 defend-only | Adaeze Okafor | Finance manager |
| | E7 and E7 defend-only | Agnieszka Duda | Payroll officer |
| | Finance checks, AB pair | Graham Whitfield | Check host (early 60s, white British, Halifax) |
| | Finance checks, BA pair | Joanne Pell | Check host (late forties, white British) |
| Tarrowby Logistics, `room_aw_tarrowby` | E2 and E2 defend-only | Fatima Begum | Recruitment lead |
| | E6 and E6 defend-only | Chidi Okeke | Fleet coordinator |
| | HR checks, AB pair | Jun Watanabe | HR assistant |
| | HR checks, BA pair | Ibrahim Diallo | IT support lead |
| | Mobile checks, AB pair | Lerato Dlamini | Health and safety adviser |
| | Mobile checks, BA pair | Jun Watanabe | HR assistant |
| Quayholt Insurance, `room_aw_quayholt` | E3 and E3 defend-only | Darren Price | Service desk team lead (E3 also has Leila Nassar, the learner's seat in the role swap) |
| | E5 and E5 defend-only | Niamh Doherty | Internal communications officer |
| | Helpdesk checks, AB pair | Anjali Rao | Information security analyst |
| | Helpdesk checks, BA pair | Sofia Marchetti | HR adviser |
| | General checks, AB pair | Owen Treharne | Facilities manager |
| | General checks, BA pair | Pauline Hendry | Payroll officer |
| Merrin & Sallow Architects, `room_aw_merrin_sallow` | E4 and E4 defend-only | Thandiwe Moyo | Studio manager |
| | Executive checks, AB pair | Yasmin Chaudhry | Finance controller |
| | Executive checks, BA pair | Julian Sallow | Co-founding partner |

Host art follows the PixelLab reset (3 Nov), with all 19 concepts approved; today the hosts use placeholder sprites (`HANDOVER.md` §2).

**Note on a doc mismatch.** `HANDOVER.md` §1 lists E7 at Merrin & Sallow. The scenario files put E7 (and its defend-only shell) in `room_aw_brightwell` at Brightwell Foods, reusing E1's emails, as `BRAND_SET.md` §2 says. The scenario files win.

## The four companies (Built)

All four are invented, every domain ends `.example`, and each still needs the pre-ship web search for a real business of the same name (BRAND_SET §1).

| Company | Domain | Region and what it is | Episodes | Check forms |
|---|---|---|---|---|
| Brightwell Foods | `brightwellfoods.example` | East Midlands food manufacturer (oat bars, cereals, a chilled range), about 400 staff, a long supplier list | E1 invoice fraud (flagship), E7 cloned CEO voice | Finance (AB and BA) |
| Tarrowby Logistics | `tarrowby.example` | West Yorkshire haulier and warehousing firm, hiring drivers and warehouse staff all year | E2 CV lures, E6 texts and QR codes | HR and mobile (AB and BA) |
| Quayholt Insurance | `quayholt.example` | Bristol commercial insurer with an in-house IT service desk and single sign-on | E3 help-desk reset and MFA fatigue, E5 fake sign-in pages | Helpdesk and general (AB and BA) |
| Merrin & Sallow Architects | `merrinsallow.example` | London architecture practice whose partners' diaries are partly public | E4 executive whaling | Executive (AB and BA) |

Each company's look-alikes use only the shapes a learner can learn to check: a swapped character, an added hyphen or an added word. There are no homographs in the awareness product. Suppliers, banks, agencies and shared services (Harlow Packaging, Kettlewick Talent, inboxly, DocShare and the rest) are in BRAND_SET §3 and the `_brandAdditions` blocks of each `awareness/e*/defend.json`.

## Larkspur Group: retired

**Larkspur Group is retired as the course's setting.** The plan's single company (a facilities firm in the North of England) and its systems (The Lark, Ledger, Larkspur Chat, Larkspur Vault and so on) are no longer used. Reasons:

1. The build uses a training room at one of four client companies, so a single recurring workplace has no place in the frame (R2).
2. **"Larkspur Travel" is already a built supplier.** It appears in the executive check forms as a genuine supplier and as a look-alike (items `ea_larkspur_bank` and `ea_larkspur_invoice`, on `larkspurtravel.example` and `larkspur-travel.example`, in `awareness_pre_executive_ab` and `awareness_post_executive_ba`). A second "Larkspur" company in the same product would confuse learners and blur a check item.

Module plans that still say "Larkspur" should read as "the brand-set company the episode is set at". Fictional suppliers and products the modules name (Northbeck Supplies, Westmoor Council, DocShift and others) may be reused at a brand-set company, but each must be checked against BRAND_SET and given a `.example` domain before use.

## Proposed new companies for E8 to E13 (New)

`04_BUILT_SO_FAR.md` §4 proposes E8 to E13. Most fit the four companies:

| Episode | Fits | Why |
|---|---|---|
| E8 after the click | Quayholt Insurance | It has a security analyst who receives reports (Anjali Rao) and a service desk |
| E9 passwords and password managers | Merrin & Sallow Architects | A small practice with shared logins and no IT department of its own gives the topic its reason |
| E10 fake downloads and "verify you are human" pages | Tarrowby Logistics | Dispatch and yard staff on shared PCs; builds on E6's cast |
| E12 the visitor and the tailgater | Brightwell Foods | A factory site with visitors, deliveries and a chilled unit (Lindiwe Mokoena's site) |

Two do not fit, and get a new company each:

| Proposed company | Domain | Look-alikes (learnable shapes) | Region and what it is | Episode | Status |
|---|---|---|---|---|---|
| Cobbleford Care | `cobblefordcare.example` | `cobblefordcare-hr.example` (added word), `cobb1efordcare.example` (swapped character) | A group of four care homes in Cumbria, holding residents' care records and family contacts, so a misdirected or overshared record has a real person behind it | E11 misdirected and overshared data (core_05 and core_06, consequence flip) | Proposed, add to BRAND_SET.md after a web search |
| Lintgate Communications | `lintgate.example` | `lintgate-files.example` (added word), `1intgate.example` (swapped character) | A Glasgow PR and communications agency that drafts client copy with an AI writing tool, so data in prompts and an injected instruction in a client brief arise naturally | E13 the AI assistant (core_15, authored, no runtime model) | Proposed, add to BRAND_SET.md after a web search |

"Cobbleford" and "Lintgate" had no hits in the repo on 2026-10-27. Each new company's cast follows the diversity rule below, and its names get the same repo check BRAND_SET used.

## The habit to keep (Built)

The plan's motto *Pause. Check. Report.* is replaced. Every debrief carries the built rule of thumb, word for word, under the heading "The habit to keep" (aw4, set once in `awareness_deploy.py` and enforced by a test):

> "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."

Whether a short tagline should sit alongside it is D14.

### Rules that hold at every brand-set company

- **Builds on the rule of thumb.** No genuine item at a brand-set company asks anyone to read back a one-time code, a password or an MFA approval; verification is a call back on a number already held. New items must keep to this, and any customer whose own process differs is a module-level question (role_06).
- **Builds on E1 and E7.** Bank-detail changes are confirmed by a call back on the number already on record (E1's genuine `e1_bank_confirmed` is the model).
- **Built.** Reporting is never penalised, and a report that turns out harmless is thanked.
- **Built.** Every fictional phone number is in Ofcom's drama ranges (as E7 already does).

## Tone (Built)

From `designs/11` §4.3 and the shipped strings:

- **No blame.** The debrief never says "you fell for it". It says the item was built to look right, and explains why. Every debrief ends with a no-blame line.
- **Reporting is a win.** The report button is always visible, never greyed out, and is thanked. The "team protected" tally counts reports.
- **A miss is a teaching moment.** After a likely miss, the next item is a similar one, not a harder one.
- **Calm and plain.** Threats are shown plainly and answered with a simple action. No sirens, skulls or jump scares. Spoken lines stay short.
- **Openly an exercise.** The scope note says it is authorised and fictional, and nothing leaves the game.
- **No real brands or people, no league tables.** Scores are shown to the learner only; the discrimination figure goes to organisers only (aw3).

## Inclusive casting and art (kept)

- **Built (standing project rule).** Each company's cast varies in age and background, and each entry records what was chosen so the concept prompts can follow it (BRAND_SET §1).
- **Built.** Attackers are shown as ordinary and businesslike, never as a hooded figure in green text. There is no recurring named villain; threats come from fraud gangs, opportunists and the like, mostly as messages, calls and pages.
- **New.** A wheelchair user in any future cast needs a custom movement and animation set, not the standard 8-direction walk (the plan's Precious Adeyemi note).
- **Builds on the host art plan.** A host or staff member who is on screen and speaking needs the full PixelLab pipeline (bust, talk sheet or visemes, 8-direction walk) and a voice; voice-only and email-only people need no art.
- **Built.** Hand edits to sprites go in `tools/pixellab_overrides/`, never on the atlas.

## Pool of names for future hosts and staff (New)

The plan's recurring cast is no longer one workplace. Its names are offered as a pool for hosts and staff at brand-set companies or new ones, keeping the looks and personalities as starting points for concept prompts. Before use, a name must be checked again against BRAND_SET, the scenarios and `public/break_escape/assets/characters/`.

Checked on 2026-10-27 against the built awareness cast (hosts, BRAND_SET and every `_brandAdditions` block) and the other scenarios.

**No clash found** (free to offer):

| Name | Plan's role and look (starting point) |
|---|---|
| Ama Owusu | Information security manager; 40s, Black British (Ghanaian heritage); warm, practical |
| Kai Murray (they/them) | Security analyst; late 20s, white Scottish; quick, shows what happens after a report |
| Leo Brennan | Operations colleague; mid 20s, white Irish-English; slips, reports fast, is thanked |
| Martin Fletcher | Sales director; 50s, white English; king of workarounds |
| Harjit Gill | Procurement lead; 40s, British Sikh; sceptical of glossy pitches |
| Zainab Hussain | Field service engineer; 30s, British Bangladeshi, hijab; works from her van |
| Kev Sutcliffe | Warehouse supervisor; 50s, white Yorkshire, hearing aids; sharp about people |
| Jo Fairweather | Ethical social engineer at a testing firm; 40s, mixed heritage; could host an attack half |
| Anne-Marie Lambert | Chair of a board; 60s, white English; asks a regulator's questions |
| Eleni Markou | Financial controller; 50s, Greek Cypriot British, walks with a stick |
| Bea Thornton | Payroll supervisor; 60s, white English from Lancashire |
| Rosa Delgado | Service desk analyst; 20s, British Colombian |
| Sunil Mehta | QA lead; 40s, British Indian |
| Des Harker | Retiring scheduler; 64, white English from Bradford, flat cap |
| Farida Haidari | Planner; 30s, British Afghan |
| Rodel Bautista | Ward manager; 50s, Filipino-British |
| Lena Fischer | Operations manager; 40s, German-British |
| Bev Quigley | Recruitment agency consultant (email and phone) |
| Arthur Fenwick | Patient or care home resident (bed sprite only) |
| Daniel Kwan | Head of communications; 30s, British Korean (only the given name is shared, with Daniel Osei, a supplier contact in E1 form B) |
| Jas | Night-desk analyst (voice only) |

**Clash found** (rename before use; flagged):

| Plan name | Clashes with | Suggested fix |
|---|---|---|
| Hassan Qureshi | The remaining clash is with m10's Qureshi (m10 has its own Farah Qureshi). The Brightwell finance check host is now Joanne Pell, so that clash no longer applies | New surname |
| Owain Jenkins | Ifan Jenkins, Castell Fruit (E1 form B); Owen Treharne, a Welsh general check host (Owain and Owen read alike) | New given name and surname |
| Mei Lin Zhou | Mei Lin Chau, Brightwell procurement buyer (E1) | New given name |
| Darius Rahimi | Hamid Rahimi, Dunmore Dairy (E1 form A); Darius Petrauskas, E2 candidate | New name |
| Reena Solanki | Nilesh Solanki, Tarrowby service desk (E6) | New surname |
| Ines Carvalho | Tomás Carvalho, the E4 PA (Merrin & Sallow) | New surname |
| Shauna Campbell | Shauna Lofthouse, Tarrowby transport planner (E6) | New given name |
| Dev Kapoor | Dev Acharya (E6 attack side) and the lab's Dev; BRAND_SET already resolved one Dev clash | New given name |
| Callum Reid | Callum Whiteley, Tarrowby warehouse (E6) | New given name |
| Leah Brodsky | Leah Abramson, planning consultant (E4) | New given name |
| Patrick Mulligan | Patrick Kerrigan, Quayholt COO (E3 helpdesk form B) | New given name |
| Kayleigh Rowntree | Kaylee Dunford, the E6 flip-line colleague (reads alike) | New given name |
| Joy Okonjo | Ngozi Okonkwo (E3 pin) and Adaeze Okafor (E1 pin, a host) | New surname |
| Gillian Marsh | Helen Marsh (m05, sis02); also Marsh End Eggs and Fairley Marsh in the E1 sets | New surname |
| Maureen Gallagher | Owen Gallagher (m05); BRAND_SET already avoids Gallagher | New surname |
| Precious Adeyemi | Ruth Adeyemi (lab) | New surname |
| Ruth Hollis | Ray Hollis (m07, m08, m10) | New surname |
| Gavin Ashworth | Ben Ashworth (m05) | New surname |
| Ros Fairbairn | Gareth Fairbairn (lab) | New surname |
| Marta Ferreira | Blake Ferreira (m09, m10) | New surname |
| Dr Faisal Karim | Agent Karim (campaign ink) | New surname |
| Teresa Varga | D. Varga, a handler named in a campaign scenario | New surname |
| Tomasz Wiśniewski | Tomasz Wierzbicki (campaign) and a `tomasz` character asset; only the given name is shared | Keep the surname, consider a new given name |
| "Daniel Hartwell" | Only the given name, shared with Daniel Osei and Daniel Kwan | Low risk; keep if role_05 is built |

Within the built cast, BRAND_SET already flags one clash of its own: Tendai Moyo (E2) and Thandiwe Moyo (E4, a host). Rename one if both episodes ship together.

## Places beyond the training room (New)

The frame is one training room, and every episode so far plays inside it, with the outside world shown through the kiosk (inboxes, pages, calls, the OSINT browser). The plan's places list (reception, car park, café, train, home office, warehouse) is kept only as a list of scenes an episode might show through the kiosk or as a concept panel. E12 (visitor and tailgater) is the first to test this: it uses person-chat inside the training room rather than a new room (04 §4). Any new room type would be a change to the frame and needs the user's go-ahead.

## Organisation profile (Builds on aw1)

The debrief's "On Monday" card has a customer slot (`slot:customer_report_route`, aw1). How a deployment sets it is waiting on the user (the reporting-route options form; see `DECISIONS_PENDING.md`). The wider profile (renamed classification labels, policy names) is still plan (BE-05). Voiced lines stay generic ("report it the way your organisation asks"), because the voice cache is keyed on exact text and a voiced line that printed a customer's name would need fresh audio per customer.
