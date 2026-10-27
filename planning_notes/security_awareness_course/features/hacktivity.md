# Hacktivity features (HA)

The platform features the awareness course needs from Hacktivity, so that a customer organisation can give the course to its staff, see who has done it, chase the people who haven't, and show the evidence to an auditor. Each feature is described by what it does, who uses it, the data it keeps, its screens and flows, and how it connects to the game. This file is about features only: it says nothing about how Hacktivity is built inside.

Every feature has the same headings: **Priority and size** (now "Next", P2 or P3 against the built product, see Build status; the plan used MVP, P2 or P3 as in `README.md`; S is days, M a few weeks, L a month or more, for one developer), **Why**, **What exists today**, **Design**, **Acceptance criteria**, **Depends on**, and **Risks and open questions**. The ids are fixed. The assessment model these features carry is in `assessment_and_evidence.md`. The requirements they answer are in `../02_COMPLIANCE_MAPPING.md`, and its short references ("PCI DSS 12.6.3", "NCSC CAF B6.b") are used here.

## Build status

**Read this first.** This file was written before main built an awareness product. The build wins (`../04_BUILT_SO_FAR.md`, R8), so everything below this section is a **wish list**, and every HA id is **Not built**. No Hacktivity change happens without the user's go-ahead.

### How the course runs on Hacktivity today (Built)

- **Ordinary missions in the `training` collection.** Each episode (E1 to E7), each defend-only variant and each of the 24 pre and post check missions is a normal Break Escape mission. An organiser adds them to a course like any other mission and puts them in order.
- **The organiser does the ordering.** The organiser places a role's pre-check first, the episodes in the middle and the post-check last, and puts half the cohort on the AB pair and half on the BA pair. The platform does not order missions or assign pairs.
- **The post-check reads the pre-check.** The post-check mission picks up the learner's pre-check percent, report rate and done flag from their newest finished run of the paired pre mission, using the platform's existing way of carrying values between missions. No platform change was needed.
- **Completion and score come back as for any mission,** and show on the course's existing progress page.
- **The game reads a customer reporting-route value.** Every debrief has a "how to report here" box. The game takes its text from a value the host page can supply, falling back to the scenario's own route and then a generic line. Today that value comes from the scenario, so every customer sees the same route unless the scenario is edited.
- **What stays in the game.** The awareness-measure records (one block per check or defend round: ids, verdicts, chips, scores, times, the stage and variant, and the discrimination figure) live with the learner's game. They hold no free text and no learner identity. Nothing sends them to a platform report yet.

### The only platform change proposed: the reporting-route setting

At feature level (from the build's route proposal):

- **What it is.** A plain-text "how to report suspicious messages here" setting, with an optional heading and a length cap, shown in the debrief of every awareness episode and check.
- **Who sets it.** Organisers set it on their own course. Administrators can set an organisation default.
- **Which one wins.** It is resolved live each time a game opens: the course's value, then the course's organisation's default, then (an open choice) the player's own organisation. If none is set, the game falls back to the scenario's route and then the generic line. A changed value shows from the next page load, including for games already started.
- **It travels with the course.** Copying a course copies its route.
- **Safety.** It is plain text only, never markup, and each customer only ever sees the route for the course being played.
- **Status: waiting on the user.** The user chose "a Hacktivity setting" and was sent an options form, which is unanswered. Nothing is built on the platform side.

### Re-prioritised against the built product

The old MVP list assumed the platform carried the whole course. It doesn't: the built product already runs as ordinary missions. Priorities are now relative to the built product, and all are wish list.

| Tier | Ids | Why now |
|---|---|---|
| **Next** (once the user agrees) | HA-11, as the reporting-route setting only | The one platform change proposed; it is what makes each debrief end on the customer's own route |
| **P2** (if the awareness product is offered to organisations) | HA-05, HA-09, HA-14, HA-03, HA-15, HA-19, HA-23, HA-01 | HA-05, HA-09 and HA-14 build on the awareness-measure records and the discrimination figure, which already exist in the game. HA-03 replaces the organiser's manual ordering and AB/BA split. HA-15 must come before any staff data is loaded. HA-19 versions the episodes for records. HA-23 is the platform half of accessibility. HA-01 adds the groups the aggregate views need |
| **P3** | HA-02, HA-04, HA-06, HA-07, HA-08, HA-10, HA-12, HA-13, HA-16, HA-17, HA-18, HA-20, HA-21, HA-22, HA-24, HA-25, HA-26 | Useful at scale, not needed to run the built product. HA-13 builds on the runner's existing facilitated flag; HA-21 would schedule defend-only variants as drills; HA-10 and HA-22 build on records already shaped for xAPI; HA-20 is kept only if a module ever needs video (the build has none) |

**How the three evidence features build on the build:**

- **HA-05** starts from the awareness-measure blocks, not from a new in-game event log: a completion record per learner per path cycle, holding the pre and post results and the episodes completed, with the learner's identity added by the platform, never by the game.
- **HA-09** shows organisers cohort pre and post change, report rate and the **discrimination figure, for organisers only**, in aggregate above the privacy threshold. Learners never see the discrimination figure; they get detailed feedback on the genuine items instead. No league tables.
- **HA-14** starts from the built pre and post checks as its level 2 measure, adds the surveys and behaviour measures, and keeps the build's rule: **no effectiveness claims**, only a before and after change on matched items for a cohort.

The ids, headings and designs below are unchanged except where they named the retired world or pathway names: the course is **Incident Simulations: Critical Cases**, settings use the brand-set companies, and "the new-starter path" means a role's pre-check, the general and role episodes, and the post-check.

## What Hacktivity already gives the course

Hacktivity runs hands-on cyber security courses for universities and organisations. Much of what mandatory training needs is already there (see `../research/current_state_hacktivity.md`):

- **Organisations with seats.** An organisation has a name, a number of seats and a subscription end date. Seats are bought by card through Stripe or set by an administrator, and access stops when a seat is removed.
- **Courses as templates.** A template course can be copied into an organisation's own course with its dates shifted, which is close to "give this organisation the new-starter path".
- **Break Escape missions in courses.** A course lists missions in order, with release dates and score weights. Starting a mission resumes the learner's game or starts a new one, and the game's status, score and completion time come back to the platform as they change.
- **Progress tracking.** Training staff see a progress page per course, with each person's progress per item, inactivity flags and a CSV export. The page is accessible (screen reader labels, focus handling, AA contrast, reduced motion), which is the pattern for the new dashboards.
- **Sign-in with MFA.** Every sign-in needs a second factor (an emailed code or an authenticator app).
- **Email.** Invitations from a pasted list of addresses, announcements to a course's participants, a daily scheduled job that already sends onboarding emails to organisation members, and email categories that people can unsubscribe from.
- **Feedback.** A 1 to 5 rating and comments after each mission, visible to administrators.
- **A copy of what each learner played.** Each game keeps the scenario it was generated from, so the content a learner saw can be reconstructed.

## The main gaps

1. **Assignment by rule, with due dates per person**: on joining, on a change of role and every 12 months, with exemptions (HA-03), and the reminders that go with them (HA-04).
2. **Departments, managers and auditors** (HA-01), and dashboards for them that protect privacy (HA-09).
3. **An audit-ready record** per learner per module version (HA-05, HA-19), certificates (HA-06) and policy acknowledgement (HA-07).
4. **Sign-in and staff lists from the customer's own directory** (HA-02).
5. **Delivery inside a customer's own LMS** (HA-10).
6. **The organisation's own details in the game**, and its branding (HA-11).
7. **What a customer expects of a processor holding staff training records**: terms, retention, deletion, export and an audit log (HA-15).
8. **A learner home** that shows what is due (HA-17), and an accessibility pass over every page a learner or administrator uses (HA-23).

## How a customer uses it

| Step | Who | What happens | Features | When |
|---|---|---|---|---|
| 1. Buy and set up | The buyer, who becomes the first organisation admin | Signs the order form and the data processing agreement; creates the organisation; uploads the logo; fills in the organisation profile (the name of the Report button, the service desk number, the policies); chooses the pathways | HA-18, HA-15, HA-01, HA-11, HA-07 | MVP (billing by hand until HA-18) |
| 2. Bring in staff | Organisation admin, or the customer's IT team | Uploads a CSV of staff with departments, managers, job roles and start dates; later, single sign-on and automatic provisioning keep the list current and suspend leavers | HA-01, HA-02 | CSV in MVP; directory sync in P2 |
| 3. Assign | Organisation admin | Sets rules: the new-starter path within 14 days of starting; the annual refresher every 12 months; role paths by job role; exemptions with reasons | HA-03, HA-19 | MVP |
| 4. Play | Staff | Get an invitation, open "My training", play each module (in the browser, or from their own LMS), finish with the debrief, the check, the reference card and any policy to acknowledge, and get a certificate | HA-17, HA-07, HA-06, HA-23, HA-10, HA-20 | MVP (LMS in P2) |
| 5. Chase | Managers and admins | Reminders go out before and after due dates; managers see their team's status and can nudge; overdue cases escalate | HA-04, HA-09 | Dashboards MVP; reminders P2 |
| 6. Prove | Internal and external auditors | Read-only access to records, rules, exemptions and acknowledgements; an audit pack for a period and a framework; certificates that can be checked online | HA-05, HA-06, HA-15, HA-19 | MVP |
| 7. Improve | The security team | Per-outcome results by department (above the privacy threshold) pick next year's spotlight modules; surveys, report-button data and monthly drills | HA-09, HA-14, HA-12, HA-21 | P2 and P3 |

## Principles for every platform feature

1. **The customer is the controller; the Hacktivity operator is its processor.** Every feature helps the customer meet its own duties: telling staff what is recorded, limiting who sees it, deleting it on time (HA-15).
2. **Two kinds of data, kept apart.** *Compliance data* (assigned, due, completed, which version, the check result, acknowledgements) is for chasing and auditing and is seen by name. *Learning data* (what the learner did in the game, per-outcome ratings, the pre-check baseline) is for the learner, and reaches the organisation only in aggregate above a privacy threshold. Managers never see an individual's decisions, and learning data is never used for discipline (HA-09, `assessment_and_evidence.md`).
3. **Evidence is append-only.** Records are added, never edited. A correction is a new entry that points at the one it corrects (HA-05).
4. **A pilot needs nothing from the customer's IT team.** CSV import and email invitations work before single sign-on.
5. **Everything an administrator does to people or records is logged** (HA-15).
6. **Every learner and administrator page meets WCAG 2.2 AA** (HA-23).
7. **One record, many views.** The learner's page, the manager's dashboard, the certificate, the audit pack and the result sent to an LMS all come from the same record.

## Roles

Today each account has one site-wide role (free user, paid seat holder, training staff, account manager, administrator) and belongs to one organisation. The course needs several roles per person, each scoped to an organisation or part of one.

| Role | Who | Can | Can't |
|---|---|---|---|
| **Learner** | Everyone with a seat, including directors, contractors and volunteers | See their own assignments, records, certificates, reference cards and learning detail; download their own data | See anyone else's records |
| **Manager** | Derived from the "manager" field, not granted | See the compliance status of the people who report to them (directly, and indirectly if the organisation allows); send a reminder | See scores, outcome ratings or decisions for individuals; see learning data for a group below the threshold |
| **Organisation admin** | The customer's training, security or HR lead | Manage people, departments, roles, rules, exemptions, the profile, policies and notifications; see compliance data for everyone; see learning data in aggregate; export | See an individual's learning detail without recording a reason (HA-09) |
| **People admin** | HR or IT staff who keep the staff list | Import and edit people and departments | Change rules, policies or records |
| **Content editor** | The customer's security or policy team | Edit the organisation profile, policies, custom content and organisation questions (HA-08) | Manage people |
| **Compliance viewer** | Internal audit, risk and compliance staff | Read compliance data, rules and their history, exemptions, acknowledgements; generate audit packs | Change anything |
| **Auditor** | An external auditor | As compliance viewer, for a set period (default 30 days), then the account expires | Change anything; see learning data except in aggregate |
| **Facilitator** | Security champions and trainers | Run facilitated sessions and record attendance (HA-13) | See individual records outside their sessions |
| **Platform admin** | The operator's staff | Support every customer, through a logged support mode with a ticket reference (HA-15) | Read a customer's learning data outside a logged support case |

## Summary

| Id | Feature | Priority | Size | Today | Depends on |
|---|---|---|---|---|---|
| HA-01 | Organisations, departments and roles | Wish list: P2 (was MVP) | L | Partly: organisations and seats; no departments, managers or scoped roles | HA-15, HA-23 |
| HA-02 | Single sign-on and provisioning | Wish list: P3 (was P2) | L | None: email and password accounts, invitations | HA-01, HA-03, HA-15 |
| HA-03 | Learning paths and assignments | Wish list: P2 (was MVP) | L | Partly: courses, release dates, enrolment; no per-person due dates, recurrence or exemptions | HA-01, HA-05, HA-19 |
| HA-04 | Reminders and escalation | Wish list: P3 (was P2, part MVP) | M | Partly: email and a daily scheduler; no due-date reminders | HA-01, HA-03, HA-11, HA-17 |
| HA-05 | Completion records and audit evidence | Wish list: P2 (was MVP, part P2) | L | Partly: status, score and times per game; no version, outcomes, sealed records or audit pack | BE-01, MG-20, HA-03, HA-15, HA-19 |
| HA-06 | Certificates and badges | Wish list: P3 (was MVP) | S | None | HA-05, HA-11, HA-23 |
| HA-07 | Policy library and acknowledgement | Wish list: P3 (was MVP) | M | None | HA-01, HA-03, HA-05, BE-09 |
| HA-08 | Question banks | Wish list: P3 (was P2) | M | None | MG-20, BE-13, HA-19 |
| HA-09 | Organisation dashboards | Wish list: P2 (was MVP) | M | Partly: a progress page per course | HA-01, HA-03, HA-05, HA-15 |
| HA-10 | LMS interoperability | Wish list: P3 (was P2) | L | None | HA-05, HA-18, HA-19, BE-14, HA-22 |
| HA-11 | Organisation profile and branding | Wish list: Next (was MVP) | M | None | BE-05, BE-09, BE-20, HA-07 |
| HA-12 | Phishing simulation and report-button data | Wish list: P3 (was P3) | M | None | HA-09, HA-14, HA-15, BE-07 |
| HA-13 | Facilitated sessions | Wish list: P3 (was P2) | M | None | BE-15, HA-01, HA-05 |
| HA-14 | Evaluation and surveys | Wish list: P2 (was P3) | M | Partly: ratings and comments after a mission | HA-09, HA-12, HA-15 |
| HA-15 | Data protection and platform trust | Wish list: P2 (was MVP) | L | Partly: MFA, UK hosting | HA-01, HA-05, HA-09 |
| HA-16 | Platform localisation | Wish list: P3 (was P3) | M | None: English only | BE-06, HA-04, HA-06, HA-11 |
| HA-17 | Learner home | Wish list: P3 (was MVP) | M | Partly: a dashboard with "continue where you left off" | HA-03, HA-05, HA-06, HA-07 |
| HA-18 | Licensing and billing | Wish list: P3 (was P3) | M | Mostly: Stripe seats, trials, renewals | HA-01, HA-10, HA-15 |
| HA-19 | Content versioning and release notes | Wish list: P2 (was P2) | S | None, though each game keeps the scenario it was built from | HA-03, HA-05, BE-13 |
| HA-20 | Video hosting, captions and transcripts | Wish list: P3 (was P2) | S | Partly: video links on missions, not tracked | HA-19, HA-23, MG-21 |
| HA-21 | Microlearning schedule | Wish list: P3 (was P2) | M | None | BE-07, BE-13, HA-03, HA-04 |
| HA-22 | Learning record store | Wish list: P3 (was P2) | M | None | BE-14, HA-05, HA-15 |
| HA-23 | Accessible platform and lab sheet theme | Wish list: P2 (was MVP) | M | Partly: the progress page is accessible | BE-04 |
| HA-24 | Public API and webhooks | Wish list: P3 (was P2) | M | None: records leave only as files | HA-01, HA-05, HA-09, HA-15 |
| HA-25 | Partner role | Wish list: P3 (was P3) | M | None: roles are scoped to one organisation | HA-01, HA-09, HA-11, HA-15, HA-18 |
| HA-26 | Setup checklist | Wish list: P3 (was MVP) | S | None | HA-01, HA-03, HA-05, HA-06, HA-07, HA-11, HA-15 |

The features below are in id order.

### HA-01: Organisations, departments and roles

**Priority and size:** Not built, wish list. P2 (the plan said MVP), L.

**Why:** Assignment rules (HA-03), reminders (HA-04) and dashboards (HA-09) all work by department, location, manager and job role. Frameworks expect training to reach everyone, in a way that fits their job: ISO 27001 A.6.3 ("as relevant for their job function"), NIST AT-3 (role-based training), NCSC CAF B6.b (no team without training, "from executives to the most junior"), DSPT 3.2.1 (staff, directors, trustees and volunteers). Contractors and temporary staff must be in scope too (`02_COMPLIANCE_MAPPING.md` section 5). Auditors need read-only access that expires.

**What exists today:** organisations with a name, seats and a subscription end date; one organisation per account; an organisation page listing training staff, members and former members; site-wide roles (free user, paid seat holder, training staff, account manager, administrator). Training staff see their organisation's members only on courses they are enrolled in. No departments, locations, managers or job roles; teams exist but are site-wide and managed by Hacktivity's administrators; each course acts as a cohort. Hacktivity's community features (public profiles, scoreboards, the handle and team lists) are site-wide, which suits students but not staff on a compliance course.

**Design:**

- **Data.**
  - *Organisation:* display name, legal name, sector, country, hosting region (HA-15), time zone, working days, default language, privacy threshold (HA-09), settings.
  - *Organisation units:* a tree of departments, with locations and cost centres as separate optional dimensions. Each unit has a name, a type, a parent and an external id.
  - *Membership* (a person in an organisation): work email, name, preferred name, employee id, job title, job role code (which drives role paths), worker type (employee, contractor, agency, volunteer, trustee or director), start date, end date, status (invited, active, suspended, left), manager (another member), primary department, location, tags, and external ids (from SSO, SCIM or an LMS).
  - *Role grants:* a role plus a scope (the whole organisation or a unit and everything below it) plus an optional expiry. A person can hold several.
  - Learners' accessibility settings (text route by default, captions, text size) belong to the learner and are not shown to administrators.
- **Screens.**
  - *People:* a list with filters (unit, location, status, worker type, role, overdue) and bulk actions; a person page with details, assignments, records and roles.
  - *Structure:* the unit tree, editable with buttons as well as drag and drop (WCAG 2.2 2.5.7), and importable from CSV.
  - *Roles and access:* who holds which role, where, until when, and when they last used it.
- **CSV import** (the MVP route in; HA-02 adds directory sync).
  - Columns: email and name required; employee id, department path ("Operations/Field teams"), location, manager email, job title, job role, worker type, start date and end date optional.
  - A preview maps columns to fields, validates each row and shows a dry run ("214 new, 1,030 updated, 12 not in this file") before anything changes.
  - Re-imports match on employee id, then email. In a "full list" import, people missing from the file are flagged as possible leavers for the admin to confirm, never deleted.
- **Seats.** An active member with at least one assignment uses a seat; suspended and departed members free theirs (HA-18 counts them).
- **Separation between customers.** Organisation learners have no public profile, appear on no public scoreboard, handle list or team list, and can see no one outside their organisation. Course scoreboards are off for awareness courses.
- **Reuse.** Each organisation's awareness course is a course copied from a template, as today, so launching, resuming and the progress page keep working. The assignment layer (HA-03) sits above it.
- **Groups of companies.** A parent organisation can hold subsidiaries as top-level units in MVP. A partner role scoped to several customer organisations (a managed service provider running the course for its clients) is a P3 extension.

**Acceptance criteria:**

- An organisation admin creates a three-level department tree and imports 500 people with departments, managers and start dates from CSV in under five minutes, seeing the dry-run summary before committing.
- One person can be a learner, the manager of their team and a compliance viewer for their division at the same time.
- A manager sees only the people who report to them (and their reports' reports, if the organisation turns that on).
- An auditor account is read-only and stops working on its expiry date.
- In a test with two organisations, no person, record or count from one is visible to the other, and no organisation learner appears on any public page.
- Every change to a person's role, unit or status is in the audit log (HA-15).

**Depends on:** HA-15 (audit log, privacy notice), HA-23 (accessible admin pages). HA-02, HA-03, HA-04 and HA-09 build on it.

**Risks and open questions:**

- **One account, several organisations.** A contractor may work for two customers. *Recommendation:* one sign-in with a membership per organisation, and records kept per organisation, so neither customer sees the other's data.
- **Existing roles.** Training staff and account managers run Hacktivity's labs today. *Recommendation:* keep them for labs and university courses, and add the scoped roles above for organisation customers, so nothing changes for current users.
- **Size.** L is right. Moving existing organisations onto the new model is part of the work.

### HA-02: Single sign-on and provisioning

**Priority and size:** Not built, wish list. P3 (the plan said P2), L.

**Why:** Organisations of more than a few hundred people won't keep a separate list of passwords for training, and their IT teams expect joiners and leavers to flow from the directory. Joiners need their induction from day one (PCI DSS 12.6.3 on hire; the ICO training toolkit asks for induction training before access to personal data and within a month of starting). Leavers must lose access and stop counting in seats and dashboards. Provisioning also supplies the start dates, departments, managers and job roles that HA-03's rules need.

**What exists today:** email and password accounts with confirmation and MFA at every sign-in; email invitations; a Microsoft sign-in link used only to attach a university student id to an existing account. No SAML or OpenID Connect sign-in, no SCIM, no scheduled import; removing a seat is manual.

**Design:**

- **Sign-in.**
  - SAML 2.0 ([OASIS, 2005](https://docs.oasis-open.org/security/saml/v2.0/)) and [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), configured per organisation: identity provider metadata (by URL or upload), signing certificate, attribute mapping (email, name, employee id, department, manager, job title, start date), allowed email domains, and whether accounts are created on first sign-in.
  - An organisation must prove it controls a domain (a DNS record) before it can claim that domain's users for single sign-on.
  - When the organisation enforces single sign-on, its members can't use a Hacktivity password, and their second factor comes from the organisation's identity provider. Two named organisation admins keep a password and MFA sign-in for when single sign-on breaks.
- **Provisioning.**
  - A SCIM 2.0 service ([RFC 7643](https://www.rfc-editor.org/rfc/rfc7643) and [RFC 7644](https://www.rfc-editor.org/rfc/rfc7644)) for users and groups: create, update and deactivate, with the enterprise extension for employee number, department and manager. Groups can map to organisation units or to tags that drive role paths. One credential per organisation, which the admin can rotate.
  - For customers without SCIM, a scheduled CSV (uploaded or collected nightly) runs through the HA-01 import.
- **Leavers and movers.**
  - Deactivation suspends the person at once: no sign-in, no reminders, seat freed. Their records stay under the retention rules (HA-15), and reactivation within 90 days restores everything.
  - A change of department or job role fires HA-03's "on role change" rules.
- **Screens.** A set-up wizard with a test sign-in and a preview of the attributes received; a provisioning page with the last sync, counts and errors; a provisioning log.
- **Integrations.** Tested with Microsoft Entra ID and Okta, which both provision to SCIM 2.0 apps ([Microsoft](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups), [Okta](https://developer.okta.com/docs/concepts/scim/)), and with Google Workspace for SAML sign-in.

**Acceptance criteria:**

- An organisation admin sets up SAML with Microsoft Entra ID from the wizard and signs in a test user without help from the operator.
- Users created, changed and deactivated in Entra ID or Okta appear in Hacktivity within one provisioning cycle; deactivated people can't sign in and their seats are freed.
- A department or job title change from the directory triggers the matching HA-03 rule within an hour.
- With single sign-on enforced, members can't sign in with a password; the named break-glass admins can.
- Every provisioning change is in the audit log.

**Depends on:** HA-01, HA-03, HA-15.

**Risks and open questions:**

- **Every identity provider has its quirks.** Budget testing time for each one a pilot customer uses.
- **Sign-on without SCIM.** Some customers will turn on single sign-on but not provisioning. Accounts created at first sign-in, plus the scheduled CSV, cover them, but leavers then depend on the CSV.
- **LMS learners.** Learners launched from a customer's LMS (HA-10) may never need a Hacktivity sign-in at all. See HA-10.

### HA-03: Learning paths and assignments

**Priority and size:** Not built, wish list. P2 (the plan said MVP), L.

**Why:** This is the centre of mandatory training. The rules come straight from the requirements:

- **On joining.** PCI DSS 12.6.3 (on hire); CIS 14.1 (at hire); ICO training toolkit (before access to personal data and within one month of starting); NIST AT-2 (on joining); DSPT 2.1.1 (induction). The course's new-starter path (a role's pre-check, the general and role episodes, the post-check) is due within the first two weeks, with the window set by the organisation (`00_COURSE_OVERVIEW.md`).
- **On a change of role.** NIST AT-3 (before access or duties); NIS2 IR 8.2 (when staff move into security-relevant roles); PCI DSS 12.6.3 guidance (moving into a role that can affect card data).
- **Every 12 months.** PCI DSS 12.6.3; CIS 14.1; NYDFS 500.14(a)(3); DSPT 3.2.1 (95% trained in the last twelve months).
- **Exemptions with reasons.** Auditors ask why anyone in scope wasn't trained, and a reason recorded at the time is the answer.

**What exists today:** courses with missions in a set order, release dates, a release calendar, and date shifting when a template is copied; enrolment by self sign-up, invitation, automatically on open courses, or on starting a mission. Labs have end times and late penalties; missions have no due dates. Nothing is relative to a person's start date, nothing repeats, and there are no role-based rules, no exemptions, and no use of the prerequisites some `mission.json` files declare.

**Design:**

- **Concepts.**
  - *Module:* a catalogue item with versions (HA-19).
  - *Path:* an ordered set of modules with optional sequencing (the pre-check first and the post-check last in the new-starter path, which is the order organisers set by hand today; the episodes in any order) and "organisation's choice" slots (the one or two spotlight modules in the annual refresher). The course provides the standard paths; organisations can build their own from the catalogue.
  - *Assignment rule:* who (an audience: everyone, or filters on unit, location, job role, worker type and tags, with exclusions), what (a path or modules), when (a trigger), the due offset, recurrence, and options (test-out allowed, an optional pass mark on the post-check; there is none by default).
  - *Assignment:* one person, one module or path, the rule that created it, assigned date, due date, cycle number, status (not started, in progress, complete, overdue, exempt, paused, cancelled, superseded) and the completion record that closed it.
- **Triggers.**

| Trigger | Fires when | Default due | Notes |
|---|---|---|---|
| On joining | A member has a start date (from HA-01 or HA-02) | Start date plus 14 days | Modules can be marked "due on day one" (for example core_05 where staff handle personal data from the start). Assignments can be created before the start date and shown from it |
| On role change | A member enters a rule's audience (new job role, unit or tag) | Change date plus 30 days | Skips modules the person completed within the current recertification window |
| Every 12 months | A completion is approaching its expiry | 12 months after the last completion ("rolling"), or a fixed annual date for everyone | A reminder 30 days before (HA-04). A completion stays current until its expiry date |
| Campaign | An admin assigns a module to an audience once | A chosen date | For a spotlight after an incident or a new scam in the news |
| Practice | A learner's outcome is Not yet in a module | 2 to 4 weeks later | A micro-drill on that outcome (BE-07, HA-21). Private: shown to the learner as practice, never to their manager |

- **Recurrence anchors.** Rolling (each person 12 months after their last completion) is the default, because it spreads the load and matches requirements set as "every 12 months" (PCI DSS 12.6.3, NYDFS 500.14(a)(3)). A fixed date ("everyone by 31 March") suits organisations that report on a financial year; a person who completed within the previous few months can then be carried over by a set rule.
- **Credit for earlier completion.** A person who completed the same module (any version) within its validity period isn't assigned it again, unless the new version is marked "retake required" (HA-19). Training done elsewhere can be recorded by an admin as "completed elsewhere", with an evidence file, and shows as an imported record (HA-05).
- **Exemptions.**

| Type | Needs | Effect |
|---|---|---|
| Not applicable to this role | Reason; end date (at most 12 months, then reviewed) | Shown as exempt, not complete |
| Equivalent training elsewhere | Reason; evidence file; approval by a second admin | Shown as exempt with evidence |
| Alternative arrangement (for example a facilitated session for someone without a computer) | Reason; the arrangement | Closed when the alternative is recorded (HA-13) |
| Leaving within 30 days | End date | Cancelled on leaving |
| Absence | Start and expected return dates only | Paused: due dates move by the length of the absence, then resume |
| Other | Reason; approval by a second admin; end date | Shown as exempt |

  Absences carry no reason. Training records must never become a place where health or family circumstances are written down.
- **Status at any date.** Every assignment change (assigned, due date changed and why, exempted, paused, completed, cancelled) is kept as an append-only history, so "who was current for annual training on 31 March?" can be answered later exactly as it stood that day (HA-05).
- **Evaluation.** Rules are evaluated when a person is created or changed, when a completion arrives, and in a daily run. Evaluation is idempotent: running it twice creates nothing new.
- **Screens.**
  - *Paths:* the provided and custom paths, with estimated minutes.
  - *Rule builder:* audience filters with a live count ("matches 1,243 people"), the path, trigger, due offset and recurrence, and a preview of who gets what and when. When a rule is first switched on it asks what to do about existing staff: assign to everyone now with due dates spread over a chosen number of weeks, or only to joiners from now on.
  - *Assignments:* per person and per module, with bulk actions (extend due dates with a reason, exempt with a reason, cancel).
  - *Exemption requests:* managers and learners can request one; an admin approves or declines it.

**Acceptance criteria:**

- A rule "new-starter path, employees and contractors, within 14 days of start date" gives a person imported with a start date one assignment per mission in the path, due on the right day in the organisation's time zone. Changing the start date moves the due dates and logs the change.
- A rolling annual rule creates the next assignment 30 days before the previous completion expires and marks it overdue the day after it is due.
- Moving a person into Finance assigns role_02 due in 30 days, unless they completed it in the last 12 months.
- An exemption can't be saved without its required fields; an "equivalent training" exemption can't be saved without evidence; the audit pack lists every exemption in its period.
- An absence pause moves due dates by its length and stores no reason.
- For any past date, each person's status on every assignment can be reproduced from the history and matches what the dashboard showed that day.
- Rules for an organisation of 10,000 people evaluate in a few minutes, and a second run changes nothing.

**Depends on:** HA-01 (people, units, roles, start dates), HA-19 (versions and the "retake required" flag), HA-05 (completions), HA-04 (notifications), HA-09 (status views).

**Risks and open questions:**

- **A new module version in the middle of a cycle.** *Recommendation:* the learner takes the version in force when they start; a release marked "retake required" (HA-19) is the only thing that reassigns completed learners.
- **Switching on for the first time.** Assigning the whole organisation on one day floods the service desk with questions. *Recommendation:* spread first due dates by department over four to eight weeks.
- **Practice assignments must stay private.** If a manager could see that someone was sent extra practice, it would reveal their result. *Recommendation:* practice shows only in the learner's own home, and is never overdue.
- **People without start dates** (some contractors, volunteers). *Recommendation:* use the date the account was created.
- **Hold access until training is done?** The ICO training toolkit mentions removing access when refreshers are missed, as an option. Hacktivity can't control access to the customer's systems; it can send the overdue list to the customer's IT team (HA-04) or to their own systems through an API (proposed at the end of this file).

### HA-04: Reminders and escalation

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** Completion depends on reminders. The ICO training toolkit expects completion to be monitored and non-completers followed up; NCSC CAF B6.b expects each person's training to be tracked and refreshed. Managers need to chase without spreadsheets, and the chasing itself is evidence that the programme is run.

**What exists today:** account emails, sign-in codes, course invitations, announcements to a course's participants or a segment, and newsletters; a daily scheduled job that sends onboarding emails, including two for organisation members; email categories that people can unsubscribe from; inactivity reminders for individual subscribers only. No reminders tied to due dates, no escalation to managers, no Teams or Slack messages.

**Design:**

- **Notifications.**

| Notification | To | Default timing |
|---|---|---|
| New assignment | Learner | When assigned (or on the start date for joiners) |
| Due soon | Learner | 7 days and 1 day before; also 30 days before an annual renewal |
| Overdue | Learner | 1, 7 and 14 days after the due date |
| Escalation | Manager | 7 days overdue |
| Escalation | Organisation admin | 21 days overdue |
| Team digest | Manager | Weekly, only if someone in the team has something due or overdue |
| Policy to acknowledge | Learner | When a policy is assigned or changes significantly (HA-07) |
| Exemption decision | Requester | When decided |
| Certificate ready | Learner | On completion (HA-06) |
| This month's drill | Learner | Monthly, if drills are on (HA-21) |

- **Settings per organisation.** Each notification on or off, its timings, quiet hours, working days (no weekend sends by default), the time zone, and the sender name (for example "Brightwell Foods Security Team, via Hacktivity"). Never more than one email to a person in a day: anything else waits for tomorrow's or is folded into the digest.
- **Service messages, not marketing.** Reminders for required training are service messages. Learners can switch from separate emails to one weekly digest, but can't turn required reminders off. Organisation learners never receive Hacktivity's newsletters or marketing.
- **Reminders that practise what the course teaches.** A training reminder that looks like a phish teaches the wrong habit. Reminders never ask for a password or a code, use the same sender every time, have no shortened links, name the organisation's training admin, and tell the learner they can always go to "My training" from their own bookmark instead of the link. Customers get a short note for their IT team on allowing the sender.
- **Content.** Plain text first, with an accessible HTML version; branding from HA-11; no open-tracking pixels. Escalations name people and their status only, never scores or outcomes.
- **Manager action.** A "remind my team" button, limited to once a week per person, which is logged.
- **Log.** Every notification is recorded (type, recipient, time, delivery result) so an admin can show an auditor that non-completers were followed up.
- **Chat (later).** Microsoft Teams and Slack messages for organisations that prefer them, sent through an app the customer installs.

**Acceptance criteria:**

- With default settings, a learner with an assignment due on a Friday gets reminders 7 days and 1 day before, an overdue notice the next working day, and their manager gets an escalation 7 days after the due date. Nothing is sent at the weekend or after completion.
- Managers receive at most one digest a week.
- Every notification is logged; an admin can export "reminders sent between two dates".
- A learner can switch to the weekly digest but can't switch off required reminders.
- No organisation learner receives marketing email.

**Depends on:** HA-03 (due dates), HA-01 (managers), HA-11 (branding), HA-17 (where links lead), HA-15 (log).

**Risks and open questions:**

- **Deliverability.** Mail filters may hold reminders from a shared sending domain. *Recommendation:* the IT note above, and a custom sending domain for larger customers in P3.
- **Tone.** Escalation can feel like blame. Wording is supportive ("Your team has two modules overdue; here's who and how to help"), and managers can see who is paused or exempt so they don't chase them.
- **Priority.** Reminders are P2, but a sellable MVP needs managers to chase. *Recommendation:* bring the assignment, due-soon and overdue emails forward into the MVP, leaving escalation, digests and chat for P2.

### HA-05: Completion records and audit evidence

**Priority and size:** Not built, wish list. P2 (the plan said MVP), M.

**Why:** Auditors ask for records, and the frameworks are specific about it: ISO 27001 cl. 7.2 (documented information as evidence of competence); NIST AT-4 (individual training records, kept for a period the organisation sets); NCSC CAF B6.b (training records lacking or incomplete means "Not achieved", and each individual's training tracked and refreshed means "Achieved"); the ICO training toolkit (records of completed training, assessment results, completion rates); PCI DSS 12.6.3 (attendance records and acknowledgements); HIPAA 164.316(b) (documentation kept for six years); DSPT 3.2.1 (the share of staff trained in the last twelve months). See `02_COMPLIANCE_MAPPING.md` section 5, "Training records".

**Builds on the build:** the awareness-measure records already hold one block per check or defend round (set, form, stage, variant, verdicts, chips, scores, times and the discrimination figure), with no free text and no identity. A completion record for the awareness product is built from those blocks, with the learner's identity added by the platform. It does not need the in-game event log (BE-01) or the knowledge check (MG-20) the design below assumes; those become extensions (`assessment_and_evidence.md`, sections 3, 4 and 6).

**What exists today:** for each game, a status (in progress, completed, abandoned), start and completion times, a score out of 100 (70% tasks, 30% aims) and task and aim counts. A learner can play a listing several times and the best score counts. Per-course progress pages export progress percentages and scores as CSV, without completion dates or status, and a results page can be printed from the browser. Nothing records the module version, time on task, outcome results or acknowledgements, and the score kept is the best of several plays rather than a fixed record of each.

**Design:**

- **Record types.**
  - *Attempt:* one learner playing one module version by one route, from launch to finish, over one or more sittings. It holds the evidence (the BE-01 decision log, via HA-22 when it exists), active time and knowledge check attempts. It can change while open and is sealed when it ends.
  - *Completion record:* written once, when the completion rules in `assessment_and_evidence.md` are met. One per learner, per module version, per assignment cycle. Never edited.
  - *Correction:* a later entry that amends or voids a completion record (wrong person, data error, superseded by an exemption), with the reason, who made it and when. The original stays, marked as corrected.
  - *Other evidence records:* policy acknowledgements (HA-07), facilitated session attendance (HA-13), training completed elsewhere and imported, and drill results (HA-21, kept lighter).
- **What a completion record holds** (the sample in `assessment_and_evidence.md` shows one in full):
  - who: learner id, and the name and employee id at the time;
  - what: module id, title, version and content fingerprint (HA-19), organisation profile version (HA-11);
  - why it was due: the assignment, the rule that created it, the due date, the cycle;
  - how: route (game, text route, test-out, facilitated, LMS, imported), language;
  - when: first started, completed, sittings, active minutes, completed on time or late;
  - results: knowledge check score, the pass mark in force if the organisation set one (none by default), attempts; a rating per learning outcome (Secure, Developing, Not yet); each critical behaviour as shown, shown after practice, or not applicable; the pre-check and post-check results for the before and after (built today);
  - linked evidence: policy acknowledgements, whether the reference card was opened, the certificate id, the attempt id;
  - integrity: a fingerprint of the record and of the previous record for the organisation, and the server time it was written.
- **Results are worked out on the server.** The game sends the events (what was decided, when); the server applies the module's evidence rules to rate outcomes and decide completion, as today's scoring is already worked out on the server. A learner's browser never sends a final rating.
- **Tamper evidence.** Each organisation's records form a chain: every record carries a fingerprint of its own content and of the record before it. The latest fingerprint is printed in every audit pack, so changing or removing an old record afterwards shows up when the chain is checked. When retention rules (HA-15) remove personal data, the record is redacted rather than deleted: the names go, the fingerprint and the outcome stay, and a deletion entry is added to the chain.
- **Questions it must answer quickly.** Who completed module X (any version, or version Y) between two dates? Who was current for each annual requirement on a given date? Which joiners finished the new-starter path within their window? Who is in scope but neither complete nor exempt?
- **Exports.**
  - *CSV:* one row per record or per person and module, with a data dictionary.
  - *Person transcript (PDF):* everything one person has completed, for HR files, leavers and subject access requests.
  - *Audit pack* (PDF summary plus a ZIP of CSVs), for a date range and, optionally, a framework:
    1. cover: organisation, period, framework, who generated it and when, the chain fingerprint;
    2. the programme: paths and assignment rules in force during the period, with their change history; the module versions used, their outcomes, and the requirements each covers (from `02_COMPLIANCE_MAPPING.md`);
    3. coverage: people in scope, completed on time, late, overdue, exempt, by department;
    4. joiners: start date, induction due date, induction completed date;
    5. exemptions with reasons and approvers;
    6. policy acknowledgements: for each required policy, each person's latest acknowledgement and whether it is within 12 months;
    7. reminders sent (summary, from HA-04);
    8. a random sample of individual records in full, since auditors usually sample;
    9. method: how completion is decided and what Secure, Developing and Not yet mean.
  - *Framework views* preset the audit pack: PCI DSS 12.6.3 (on hire, every 12 months, acknowledgement), DSPT 3.2.1 (95% of staff, directors, trustees and volunteers in the last twelve months), NCSC CAF B6.b, ISO 27001 cl. 7.2 and A.6.3.
- **Who sees what.** Organisation admins, compliance viewers and auditors see compliance fields for everyone. Managers see status only. Learners see their own full record. Outcome ratings for named individuals appear in exports and audit packs only if the organisation turns that on, and the export is logged (see HA-09 and `assessment_and_evidence.md`, "Ethics and privacy of decision data").

**Acceptance criteria:**

- Finishing core_01 writes exactly one completion record with every required field filled, including the module version and fingerprint. No screen or interface can change it; a correction creates a new, linked record.
- Checking the chain for a period succeeds; changing one value in a test copy makes the check fail and points to the record.
- An audit pack for one year and 5,000 people, with the PCI DSS view, generates in under two minutes and lists people in scope, induction on hire within the window, annual completions, acknowledgements and exemptions.
- "Status at 31 March" reproduces the figures the dashboard showed on 31 March.
- A learner can download their own transcript.

**Depends on:** BE-01 (the rated records and the per-game summary), MG-20 (check results), HA-19 (versions), HA-03 (assignments), HA-07 (acknowledgements), HA-15 (retention, audit log); HA-22 from P2.

**Risks and open questions:**

- **Size.** With the audit pack, framework views and the chain this is nearer L than M. *Recommendation:* MVP is the records, CSV, transcript and a plain audit pack; the chain and framework views follow in P2.
- **Version in the MVP.** HA-19 is P2, but records need a module version from the first pilot. *Recommendation:* the MVP stamps a version number and fingerprint on every attempt; release notes and pinning come with HA-19.
- **Time on task.** Active time stops counting after five minutes without input, which can under-count screen reader users who listen without pressing keys. *Recommendation:* count time while the module is in focus, with a long idle limit, and never use time on task as a pass condition.
- **Which record is the truth when an LMS is involved?** *Recommendation:* the Hacktivity record is the evidence; the LMS gets a summary (HA-10).

### HA-06: Certificates and badges

**Priority and size:** Not built, wish list. P3 (the plan said MVP), S.

**Why:** Learners, HR files and some auditors want a certificate. Contractors working for several clients need to show their training to each one. Some organisations want digital badges.

**What exists today:** no certificates; a results page can be printed from the browser. Profile badges and streaks for labs, which suit students rather than staff.

**Design:**

- A certificate for every module completion record and every completed path ("New-starter path: finance", "Annual refresher 2026 to 2027").
- **Content:** learner name, organisation, module or path title and version, completion date, valid until (for annual requirements), certificate id, and a verification link and QR code. No scores or outcome ratings, by default.
- **Format:** a tagged, accessible PDF (reading order, text alternatives, real text rather than an image), printable on A4 and US Letter, with the organisation's logo (HA-11). The wording says "completed", never "certified".
- **Verification page:** opening the link shows the same facts as the certificate and its status (valid, expired, or revoked if the record was voided by a correction). Certificate ids can't be guessed. An organisation can turn public verification off, or ask the verifier to type the learner's surname first.
- **Open Badges 3.0** (optional, P2): for path completions, a badge issued as a signed credential in the format 1EdTech's [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0) defines (aligned with the W3C Verifiable Credentials data model), which the learner can keep in a wallet. Off unless the organisation turns it on.

**Acceptance criteria:**

- Every completion record has a certificate within a minute; its verification link shows the right status; voiding the record shows "revoked".
- The PDF passes an automated accessibility check and reads correctly with a screen reader.
- The verification page shows nothing that isn't printed on the certificate.

**Depends on:** HA-05, HA-11, HA-23.

**Risks and open questions:**

- A certificate can make people think "certificate equals competence". The wording and the verification page show what was completed and when, nothing more.
- Names on public verification pages are personal data. Unguessable ids, minimal content and the organisation's switch handle this; the organisation decides.

### HA-07: Policy library and acknowledgement

**Priority and size:** Not built, wish list. P3 (the plan said MVP), M.

**Why:** PCI DSS 12.6.3 requires personnel to acknowledge, at least every 12 months, that they have read and understood the security policy and procedures. ISO 27001 cl. 7.3, DORA RTS Art 19 and CMMC AT.L2-3.2.1 require staff to know the policies that apply to them, and ISO/IEC 27001:2022 control A.5.1 expects policies to be acknowledged by relevant personnel (wording to verify; A.5.1 is not yet in `02_COMPLIANCE_MAPPING.md`). The course's own completion rule says a module isn't complete until any policy attached to it is acknowledged (`00_COURSE_OVERVIEW.md`). core_16 (Small Print) is built around this, and the intranet terminal in the game (BE-09) is where the policies sit.

**What exists today:** nothing. There is no policy content type and no acknowledgement of anything, Hacktivity's own terms included.

**Design:**

- **Data.**
  - *Policy:* title, category (information security, acceptable use, data protection, remote working and so on), owner, audience (a rule like HA-03's), and the modules it is attached to (for example the acceptable use policy to core_16, the data protection policy to core_05).
  - *Policy version:* version label, effective date, who approved it and when, next review date, the document, a plain-English summary, a "what changed" note, the change type, and a content fingerprint.
  - *Document formats:* accessible HTML is required (written in the editor or converted from an upload); a PDF can be attached as well. A PDF on its own is flagged until an accessible version exists.
  - *Change type:* **minor** (wording, contacts, formatting: no re-acknowledgement) or **significant** (a change to what people must do: re-acknowledgement due within 14 days by default). The admin must choose and explain.
  - *Acknowledgement:* the person, the policy version and its fingerprint, the exact statement shown, the time, and the method (Hacktivity page, in the game through BE-09, from an LMS, or a paper form entered by an admin). Written to the HA-05 chain and never edited.
- **The statement.** Configurable per policy, with a default based on the PCI DSS requirement: "I have read and understood the Acceptable Use Policy, version 3.2, and I will follow it." One button. No timers, no forced scrolling to the bottom: those prove nothing and fail people who use assistive technology. An optional single question from the organisation's bank (HA-08) can check one key point.
- **When acknowledgement is asked for.** On joining (with the induction path); every 12 months (rolling, like HA-03); within 14 days of a significant change; and as part of any module the policy is attached to.
- **In the game.** The intranet terminal (BE-09) shows the summary of the version that applies to this learner, links to the full text, and sends the acknowledgement, which the platform records with the method "in game". The game can't record an acknowledgement for a version the platform didn't give it.
- **Screens.**
  - *For learners:* "Policies to acknowledge" in HA-17, and a library of every current policy that applies to them, with the dates they acknowledged each.
  - *For admins:* the policy list with acknowledgement rates per version and department; version history with summaries and the change notes; an overdue list; exports.
- **Evidence.** The audit pack (HA-05) lists, for each person in scope, their latest acknowledgement of each required policy, its version, and whether it is within 12 months.

**Acceptance criteria:**

- Publishing a significant new version creates re-acknowledgement assignments for the policy's audience, due in 14 days; a minor version creates none.
- Each acknowledgement shows the exact version, fingerprint and statement. Replacing the policy file later changes no earlier acknowledgement.
- An acknowledgement made in the game appears in the platform within a minute, marked "in game".
- A module with an attached policy isn't complete until the policy is acknowledged.
- The audit pack's acknowledgement list matches the policy screens for the same date.
- Policies display as accessible HTML, and a PDF-only upload is flagged.

**Depends on:** HA-01, HA-03, HA-04, HA-05, HA-11, HA-23, BE-09.

**Risks and open questions:**

- **Acknowledging isn't understanding.** It is what PCI DSS asks for, but it changes little by itself. The course pairs it with core_16, the reference cards and the optional check question.
- **Legal weight.** How much a click-through acknowledgement counts in an employment dispute is for the customer's HR and lawyers. The platform records enough to show who acknowledged which exact text, and when.
- **Long policies.** Staff skim them. Every version needs a plain-English summary, and the summary is what the game shows first.

### HA-08: Question banks

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** A retake needs fresh questions, or the check measures memory of the last attempt. Organisations want to add questions about their own policies and procedures. Weak questions should be found from the data and retired. The ICO training toolkit expects an assessment at the end of training, possibly with a pass mark. MG-20 (the knowledge check) needs somewhere to draw its items from.

**What exists today:** nothing. There are no quizzes anywhere: not in Hacktivity, not in the game, not in the lab sheets.

**Design:**

- **Item.** Id; module; learning outcome ids; type (single choice, multiple choice, hotspot with a list alternative, ordering, true or false with a reason); stem; options, each with its own feedback; the answer key (and accepted alternatives, as in core_01's ordering item); difficulty; tags (role, sector, organisation specific); language; status (draft, in review, live, retired); version; author and reviewer; parameters (slots such as a domain name filled per play from BE-13); accessibility notes (text alternatives for images).
- **Two sources.** The *central bank* is written by the course team with each module (8 to 12 items at launch, at least two per outcome, growing over the first year) and versioned with it (HA-19). *Organisation items* are written by the customer's content editors, mapped to a module outcome or to one of their policies, and reviewed by a second editor before going live.
- **Drawing a sitting** (MG-20 asks; the bank answers). Six items by default, at least one per outcome, at most two organisation items, none seen in the learner's previous attempt while unseen items remain for that outcome, options shuffled except in ordering items. The rules are in `assessment_and_evidence.md`.
- **Item statistics** (for the course team and, for organisation items, the organisation): how often it is answered correctly, how well it separates learners who do well on the rest of the check from those who don't, how often each option is chosen, and the median time. Shown once an item has 200 responses; central items pool responses across organisations, anonymously. Flags: correct more than 95% of the time (too easy to tell us anything), less than 30% (too hard, or a wrong key), negative discrimination (probably flawed), an option nobody chooses.
- **Learner reports.** A "report a problem with this question" link on every item, going to whoever owns it.
- **Retirement.** A retired item is never drawn again but stays in history, because old records refer to it.
- **Import and export.** CSV and JSON. 1EdTech's QTI format later, if customers ask.

**Acceptance criteria:**

- A content editor adds a question about the organisation's acceptable use policy, mapped to a core_16 outcome; a second editor approves it; it then appears in at most one slot per sitting.
- A retake never repeats an item from the previous attempt while unseen items remain for each outcome.
- Statistics appear after 200 responses, and an item with negative discrimination is flagged for review.
- Every item has feedback for every option, and passes the accessibility checks (text alternatives, keyboard operation, a list alternative for hotspots).

**Depends on:** MG-20, BE-13, HA-19, HA-05.

**Risks and open questions:**

- **Organisation questions of uneven quality.** Writing guidance, the review step and the statistics help; the course team can't review every customer's items.
- **Small organisations** never reach 200 responses on their own items. *Recommendation:* show their statistics as "too few responses yet", and rely on review.
- **MVP.** HA-08 is P2, but MG-20 needs items from the first module. *Recommendation:* in the MVP, the central items ship inside each module version; the editor, organisation items and statistics come with HA-08.

### HA-09: Organisation dashboards

**Priority and size:** Not built, wish list. P2 (the plan said MVP), M.

**Why:** Managers and admins chase completion; the ICO training toolkit expects completion monitored at all levels; DSPT 3.2.1 sets a 95% figure for many health and care organisations; boards are asked to gain assurance "using suitable metrics" (Cyber Governance Code C4); NCSC CAF B6.b says measuring only how many people were reached is not enough. Per-outcome results by department show where the next year's effort should go.

The same data can do harm. Decision data for a small team identifies individuals. Used for discipline, it would destroy the reporting culture the course exists to build: the NCSC's phishing guidance says plainly that "blaming users for clicking on links doesn't work" and that "employees who are afraid for their jobs will not report mistakes" ([NCSC, Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing)). The ICO's guidance on monitoring workers says employers must be clear about the purpose of monitoring and tell workers about it, and lists monitoring that may result in financial loss, such as performance management, as an example of high-risk processing that needs a DPIA ([ICO, Employment practices and data protection: monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/)).

**Builds on the build:** the first learning-insight view is the built measurement: cohort pre and post percent and report rate per role pair, and the **discrimination figure, shown to organisers only** and never as blame (aw3). Learners never see it; they get detailed feedback on genuine items instead. Per-outcome distributions come later, once items carry outcome ids. The privacy thresholds below apply to all of it.

**What exists today:** a progress page per course for training staff, with each person's progress per item, inactivity flags and CSV export, built accessibly. No organisation-wide, department or manager views, no overdue or compliance reports, no scheduled reports.

**Design:**

- **Four views.**

| View | Who | Shows | Never shows |
|---|---|---|---|
| **Compliance** | Organisation admin, compliance viewer, auditor | Percentage current for each requirement (induction within its window, annual refresher, policy acknowledgements), by department and location; overdue and exempt counts; trends; a "trained in the last 12 months" figure with a target line (for example DSPT's 95%); drill-down to named people for chasing | Outcome ratings or decisions |
| **My team** | Manager | Each report's assignments with status and due dates; a reminder button | Scores, outcome ratings, decisions, practice assignments |
| **Learning insight** | Organisation admin (and a security team role the organisation can grant) | Per-outcome distributions (Secure, Developing, Not yet) per module and department; the pre-check to post-check change and the discrimination figure (built today, organisers only); the most-missed behaviours; the organisation's own question statistics; all above the privacy threshold | Names, or any group below the threshold |
| **Board report** | Generated for the organisation admin | A one-page quarterly PDF: completion and overdue, outcome trends, the reporting-culture measures where HA-12 and HA-14 supply them, and a text box for the security lead's commentary | Names |

- **Privacy thresholds** (for learning insight and every other aggregate of learning, survey or simulation data):
  - **Minimum group size.** A cell is shown only if at least *k* people contributed. Default *k* = 10; an organisation can raise it, or lower it to 5 at the lowest, with a warning. Smaller groups are shown as "fewer than 10 people" or folded into a combined group.
  - **No working it out by subtraction.** If a department of 40 is shown and a sub-team of 34 is shown, the other 6 can be worked out. The dashboard checks the difference between any two groups a user can see, and suppresses one of them whenever the difference is a group smaller than *k*.
  - **Filters can't narrow below *k*.** The size check runs on the final group after every filter (department, location, job role, worker type, period), not on each filter alone.
  - **Small periods widen.** If a month has too few completions, the view switches to the quarter or the year rather than showing a small group.
  - **Rounding.** Percentages for groups of fewer than 50 are rounded to the nearest 5.
  - **No route from a cell to names.** Learning insight has no drill-down to individuals, and its exports are aggregates with the same rules.
  - **Who the threshold protects against.** The ICO's anonymisation guidance asks whether colleagues' own knowledge could be enough to identify someone ([ICO, How do we ensure anonymisation is effective?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/)). A manager knows who in their team was on leave in March, so the rules apply to managers' and admins' views alike.
  - Thresholds don't apply to compliance status, which has to be seen by name to be chased.
- **Individual learning detail.**
  - The learner always sees their own.
  - The organisation can turn on "support access" for named admins. Each view of one person's learning detail needs a reason from a fixed list (the learner asked for help; arranging an adjustment; a subject access request), is written to the audit log, and appears in the learner's "My data" page (HA-17) as "viewed by [admin] on [date] for [reason]".
- **No discipline from decision data.**
  - *In the product:* no rankings of individuals, no "worst performers" list, no named list of people who clicked in the game, and managers can't see decisions.
  - *In the contract:* the order form and the data processing agreement (HA-15) say the customer won't use learning data from the course for disciplinary or performance decisions.
  - *To learners:* the privacy notice and the first screen of core_00 say the same, in plain words.
  - Not completing mandatory training by its due date is a different matter: that is compliance data, and how the customer handles it is the customer's policy.
- **Freshness.** Compliance views update within the hour; learning insight daily.
- **Scheduled reports.** The weekly manager digest (HA-04), a monthly summary for admins, the quarterly board report.
- **Accessibility.** Every chart has a table alternative; colour is never the only signal; keyboard and screen reader support follows the existing progress page.

**Acceptance criteria:**

- A manager of four people sees each person's status, and no learning insight for the team. A manager of 30 sees per-outcome distributions for the team and no names.
- No combination of filters returns learning data for fewer than *k* people; the test suite includes subtraction attempts (a department minus its visible sub-teams) and narrow periods.
- An admin who opens one person's learning detail must give a reason; the view is logged and appears on the learner's "My data" page.
- The compliance view's figures for a date match the audit pack (HA-05) for the same date.
- Every view passes the WCAG 2.2 AA checks in HA-23.

**Depends on:** HA-01, HA-03, HA-05, HA-15, HA-23; BE-01 for learning data.

**Risks and open questions:**

- **Ten or five.** *Recommendation:* 10 by default, because a manager knows their team well; 5 only for organisations that accept the warning.
- **Small organisations** (under about 30 staff) will see little learning insight. *Recommendation:* offer anonymous benchmarks across organisations of a similar size and sector instead, once there are enough customers.
- **Customers asking for named lists** ("show me who clicked the phish in the game"). *Recommendation:* decline for course data, and explain why with the NCSC's guidance. Simulation data follows HA-12's rules.

### HA-10: LMS interoperability

**Priority and size:** Not built, wish list. P3 (the plan said P2), L.

**Why:** Many customers already run a learning management system (LMS) and want to assign the course there, alongside their other mandatory training, and see completions in the reports they already use. The plan pilots in Hacktivity first and adds LMS delivery before wider sales (`DECISIONS_PENDING.md`, D4).

**What exists today:** none of SCORM, LTI, xAPI or cmi5; no public API.

**What each standard supports.** Checked on 14 October 2026 against the standards bodies' documents where they could be reached:

| | SCORM 1.2 | SCORM 2004 (4th edition) | cmi5 | LTI 1.3 with LTI Advantage |
|---|---|---|---|---|
| **Body and date** | ADL, October 2001 | ADL, March 2009 | ADL and the AICC; "Quartz" 1st edition, 1 June 2016 | 1EdTech (formerly IMS Global); final release 16 April 2019 |
| **How it launches** | A zip package (with an `imsmanifest.xml`) imported into the LMS; content runs in the LMS's browser window and talks to it through a JavaScript API | As SCORM 1.2 | The LMS launches each unit (an "assignable unit") by URL, which can be hosted anywhere; a course structure file describes the units and can be imported without a zip | The tool stays hosted by its provider; the LMS launches it with an OpenID Connect flow and signed tokens (JWTs) |
| **Completion and success** | One field, `cmi.core.lesson_status`: passed, completed, failed, incomplete, browsed or not attempted | Two fields: `cmi.completion_status` (completed, incomplete, not attempted, unknown) and `cmi.success_status` (passed, failed, unknown) | Statements with the cmi5 verbs launched, initialized, completed, passed, failed, abandoned, waived, terminated and satisfied; the LMS decides "satisfied" from each unit's moveOn rule (Passed, Completed, CompletedAndPassed, CompletedOrPassed or NotApplicable) | Assignment and Grade Services 2.0: a score (`scoreGiven` out of `scoreMaximum`), a comment, an activity progress (Initialized, Started, InProgress, Submitted, Completed) and a grading progress (FullyGraded, Pending, PendingManual, Failed, NotReady) |
| **Score** | `cmi.core.score.raw`, with min and max | `cmi.score.scaled` (from -1 to 1) and raw; the LMS can pass in a `cmi.scaled_passing_score` | In passed or failed statements; the LMS passes a masteryScore | As above |
| **Detail per outcome** | `cmi.objectives` and `cmi.interactions` exist, but LMSs vary in what they store and report | `cmi.objectives` (each with its own status and score) and `cmi.interactions` | Any other xAPI statements ("cmi5 allowed") between initialized and terminated, which the LMS must record and report; objectives can be listed in the course structure | None beyond the comment |
| **Saved state** | `cmi.suspend_data`, 4,096 characters | `cmi.suspend_data`, 64,000 characters (4,000 in the 2nd edition) | The xAPI State API | Kept by the tool |
| **Learner identity** | LMS learner id and name | LMS learner id and name | An xAPI account, not an email address | A stable user id and the user's roles in the course; name and email only if the LMS shares them; class lists through Names and Role Provisioning Services 2.0 |
| **Other** | The most widely supported ("the industry workhorse") | Adds sequencing and navigation between units | An xAPI profile: the data travels as xAPI statements to the LMS's learning record store | Deep Linking 2.0 lets an LMS administrator pick modules from the tool. 1EdTech ended support for LTI 1.0 to 1.2 and 2.0 on 30 June 2022 |

Sources: [cmi5 specification (Quartz)](https://github.com/AICC/CMI-5_Spec_Current); [LTI Core 1.3](https://www.imsglobal.org/spec/lti/v1p3), [Assignment and Grade Services 2.0](https://www.imsglobal.org/spec/lti-ags/v2p0), [Names and Role Provisioning Services 2.0](https://www.imsglobal.org/spec/lti-nrps/v2p0), [Deep Linking 2.0](https://www.imsglobal.org/spec/lti-dl/v2p0) and [1EdTech's legacy LTI deprecation schedule](https://www.imsglobal.org/lti-security-announcement-and-deprecation-schedule). ADL's SCORM pages (adlnet.gov) didn't respond on 14 October 2026, so the SCORM rows were checked against Rustici Software's [run-time reference](https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/) and [version history](https://scorm.com/scorm-explained/business-of-scorm/scorm-versions/), the usual secondary reference; check them against ADL's documents before quoting them to a customer.

**Design:**

- **One delivery model for every standard: the module always runs from Hacktivity.** The LMS gets a small package or a registration, never the game itself. So updates (HA-19), the organisation profile (HA-11), records (HA-05) and accessibility fixes reach every customer at once; the game's assets and voice files never sit in a customer's LMS; and the text route and resume work the same everywhere.
- **SCORM 1.2 and SCORM 2004 (4th edition)**, built together:
  - A per-organisation package containing a small launcher page. The launcher finds the LMS's SCORM API, reads the learner's id and name, opens the module from Hacktivity with a signed launch token (the package's licence key plus the LMS learner id), and passes results back through the API.
  - *Results sent:* SCORM 1.2 sends `incomplete` until the module is complete, then `passed` with the check score. SCORM 2004 sends `completion_status` completed when the module is complete, `success_status` passed when the check is passed, the scaled score, and the session time.
  - *Never "failed".* The course never fails anyone: a learner who hasn't passed yet is "incomplete" or "unknown" until they do.
  - *Per-outcome objectives* in SCORM 2004 are off by default, because LMS reports rarely protect small groups. The thresholded view stays in Hacktivity (HA-09). An organisation can turn them on, knowing that.
  - *Saved state:* `suspend_data` holds only a pointer; the game's own save stays in Hacktivity.
- **Identity without a second sign-in.** A learner launched from an LMS never sees a Hacktivity sign-in. Hacktivity creates a learner for each (organisation, LMS learner id), named from the LMS, who counts as a seat and gets records with the source "LMS". An admin can link them to HA-01 people by employee id or email when the LMS passes one.
- **Licence control.** Each package carries an organisation-specific key; launches with an unknown or revoked key are refused with a clear message; seats are counted as distinct learners per licence year (HA-18).
- **LTI 1.3:** Hacktivity as an LTI tool, registered per LMS platform; Deep Linking to add modules or paths to an LMS course; Assignment and Grade Services to send the score (0 to 100) with activity progress Completed and grading progress FullyGraded at completion; Names and Role Provisioning Services (optional) to read the class list for reminders.
- **cmi5:** a course structure file per module, pointing at the unit on Hacktivity, with moveOn Completed by default (there is no pass mark by default), or CompletedAndPassed with a masteryScore if the organisation set a pass mark. The launcher meets the unit's obligations (fetch the token, then initialized, completed, passed, terminated). Per-outcome "cmi5 allowed" statements from BE-14 go to the customer's learning record store only if the organisation turns that on, with the same caution as SCORM objectives.

**Recommended order:**

1. **SCORM 1.2 and SCORM 2004 (4th edition) together** (one launcher, two API adapters). This reaches the most workplace LMSs, and completion, pass and score is what their compliance reports use.
2. **LTI 1.3 with Deep Linking and Assignment and Grade Services, then Names and Role Provisioning.** No package to upload, cleaner identity, and it is how universities (Hacktivity's existing customers) connect tools. It carries less data than SCORM 2004, which matters little because the evidence stays in Hacktivity.
3. **cmi5, when a customer's LMS supports it and they want the richer data.** It reuses the xAPI statements built for HA-22 and BE-14, so it is cheap once those exist.

Before building, check each pilot customer's LMS and which of these it supports; that can change the order.

**Acceptance criteria:**

- A SCORM 1.2 package for core_01 imports into Moodle and into the LMSs of two pilot customers, launches, resumes after closing the window, and records `passed` with the score after completion (`incomplete` before).
- The SCORM 2004 package records completion and success separately, and sends per-outcome objectives only when the organisation has turned them on.
- A learner launched from an LMS never sees a Hacktivity sign-in, and their completion record appears in HA-05 with the source "LMS".
- Revoking a package's key stops new launches with a clear message.
- LTI: a Moodle course adds core_01 through Deep Linking, and the score appears in its gradebook after completion.
- cmi5: a cmi5 LMS marks the unit satisfied under its moveOn rule (Completed by default).

**Depends on:** HA-05, HA-19, HA-18 (licence keys and seats), HA-15 (the data agreement covers LMS data), HA-11, BE-12 (resume); BE-14 and HA-22 for cmi5 and richer data.

**Risks and open questions:**

- **Sessions inside an LMS frame.** Browsers increasingly block cookies set by a site framed inside another site, so a module framed inside an LMS can lose its session. *Recommendation:* launch sessions with tokens rather than cookies, and offer "open in a new window" as a fallback.
- **LMS quirks.** Every LMS implements SCORM a little differently. Budget testing per LMS, and keep a compatibility list.
- **Two copies of the truth.** The LMS and Hacktivity both hold a result. *Recommendation:* Hacktivity's record is the evidence; the LMS gets a summary, and the audit pack says so.
- **Data protection.** Learner ids and names arrive from the LMS. The data processing agreement (HA-15) must cover them, and organisations that switch on per-outcome data in their LMS take on the job of protecting it there.

### HA-11: Organisation profile and branding

**Priority and size:** Not built, wish list. Next (the reporting-route setting only; the rest of the profile P2) (the plan said MVP), M.

**Why:** The game must show each organisation's own details: the name and place of its Report button, its service desk number, its simulation policy, its approved way to sign in (BE-05; each module's "Organisation-specific content" lists them, as core_01's does). Several requirements ask for training that reflects the organisation's own policies and risks: NYDFS 500.14(a)(3) and FTC 314.4(e) (the risk assessment), PCI DSS 12.6.3.2 (its acceptable use policies), ISO 27001 cl. 7.3 (its own policy). Buyers also expect their logo and colours.

**What exists today:** nothing per customer: no logo, colours, domain, email sender or organisation values.

**Builds on the build:** the game already reads a customer reporting-route value for every awareness debrief, with the scenario's route as the fallback (see Build status). **HA-11 starts there.** Its first and only proposed step is the reporting-route setting described in Build status: plain text, set by organisers per course, with an organisation default, waiting on the user's answer. The game's debrief also already accepts a rule-of-thumb and team-size value from the same source, so those are the natural next slots; the rule of thumb stays word for word unless the user decides otherwise. Everything else in this design (the full slot list, branding, versions, preview) is wish list and comes later.

**Design:**

- **Profile slots.** A typed list built from every module's "Organisation-specific slots" table in its `concepts.md`. Each slot has an id, a label, help text, a type (text, phone number, email, link, image, choice, short rich text), the scenario's default (today, the route each awareness scenario authors), validation (phone format, secure links only), a maximum length (so it fits on screen), whether it is required, and the modules that use it. Examples: the Report button's name and where it is on desktop and mobile; the security team's contact; the service desk number and hours; how to report a lost device; the payment verification rule; whether the organisation runs simulated phishing, and its policy text; the external sender banner wording; the approved way to sign in to company systems; the password manager's name; the DPO's contact; and the customer's own incident-plan headings, crisis roles and contacts (role_01's own-plan version, Cyber Governance Code D2), held as short rich-text slots.
- **Voiced lines stay generic.** Slot values appear on screen, in documents, on the intranet and on reference cards, never in voiced lines (the voice cache is keyed on exact text; see `01_LEARNING_DESIGN.md` and BE-05).
- **Branding.** Logo (with alt text), one accent colour (checked for AA contrast before it is accepted), display name, the email sender name, a welcome message, and the logo on the course's title screen (BE-20).
- **Module selection.** Which modules and paths are offered, and switches for optional parts (dropping core_01's simulation question when the organisation runs no simulations).
- **Custom content.** An addendum to each reference card (short, accessible rich text, no scripts or embedded content); links to the organisation's own intranet pages; an optional welcome from a leader (text, or a video through HA-20).
- **Versions.** Every saved change makes a new profile version, and each completion record stores the version in force. If an auditor asks what a learner was told about reporting on a given day, the answer is exact.
- **Preview.** "See it as a learner" renders the reference cards and the key game screens with the organisation's values before anything goes live.
- **Gaps.** Required slots left empty block launches for learners (admins can still preview), with a list of what is missing.
- **Delivery to the game.** When a game is created, the profile version's values are passed to the scenario (BE-05 reads them).

**Acceptance criteria:**

- An admin fills in the profile using a form with help text and previews core_01's reference card with their own Report button name; in the game the name appears on the inbox toolbar, on the intranet and on the reference card, and in no voiced line.
- A colour that fails AA contrast is refused, with the reason.
- Every completion record links to the profile version in force when it was made.
- With a required slot empty, learners can't launch the module and the admin sees what is missing.

**Depends on:** BE-05, BE-09, BE-20, HA-07, HA-19, HA-23.

**Risks and open questions:**

- **Renaming the brand-set companies or their staff.** Customers may ask. *Recommendation:* no. The invented companies (Brightwell Foods, Tarrowby Logistics, Quayholt Insurance, Merrin & Sallow Architects) and their voices are fixed; the customer's name appears on screen where the learner's own organisation is meant ("Report it the way we do at [organisation name]").
- **Values that change.** Phone numbers and procedures change. Versioning keeps old evidence accurate; a yearly "check your profile" reminder to the admin keeps it current.

### HA-12: Phishing simulation and report-button data

**Priority and size:** Not built, wish list. P3 (the plan said P3), L.

**Why:**

- **Behaviour, not just knowledge.** How often staff report suspicious email, and how fast, is the most useful measure of whether the course changes behaviour (Kirkpatrick level 3; see `assessment_and_evidence.md`). It needs data from the customer's mail system.
- **Customers ask for simulations.** NIST AT-2(1) includes practical exercises such as no-notice spear phishing; PCI DSS 12.6.3.1's guidance suggests periodic tests of how often staff report; the NYDFS industry letter on AI suggests simulated phishing and impersonation exercises (`02_COMPLIANCE_MAPPING.md`). None makes simulation mandatory.
- **The evidence on simulation is mixed.** A 15-month study of more than 14,000 employees found that embedded training during simulated phishing, as commonly deployed in industry, didn't make employees more resilient and could make them more susceptible, while employee reporting detected new campaigns quickly ([Lain, Kostiainen and Čapkun, 2022](https://arxiv.org/abs/2112.07498)). Ho and others (2025) found similarly little benefit from the usual training approaches (see `01_LEARNING_DESIGN.md`).
- **The NCSC is wary.** Its guidance ([Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing), reviewed February 2024) says no training package, "including phishing simulations", can teach users to spot every phishing attempt; that simulations "can also create legal risk", because "punishing people for clicking on emails you've sent starts to resemble entrapment", so "you should always check with your HR department before undertaking any phishing simulations"; that simulations "erode trust between employees and security"; and that "as well as measuring how many people clicked on a phishing email", organisations should "focus on how many people reported it". It suggests an alternative: staff crafting their own phishing emails in a friendly competition between peers.

**What exists today:** nothing.

**Design:**

*The recommendation: integrate, don't build a sender*, matching `DECISIONS_PENDING.md` (D5):

1. **First (P3): bring the customer's data in.** Import results from the simulation tool the customer already uses, and counts of reported emails from their mail platform. For example, Microsoft's Attack simulation training (which needs Microsoft 365 E5 or Defender for Office 365 Plan 2) has [an API](https://learn.microsoft.com/en-us/graph/api/resources/attacksimulationroot?view=graph-rest-1.0) for simulation results, and Microsoft 365's built-in Report button can send reported messages to a reporting mailbox the customer controls ([Attack simulation training](https://learn.microsoft.com/en-us/defender-office-365/attack-simulation-training-get-started), [user reported settings](https://learn.microsoft.com/en-us/defender-office-365/submissions-user-reported-messages-custom-mailbox)). Any other tool can use a CSV template.
2. **Later, only if customers need it: partner.** A referral or reseller arrangement with a simulation provider, or the open-source [Gophish](https://github.com/gophish/gophish) toolkit (MIT licence) run by the customer, with Hacktivity importing its results.
3. **Not recommended: Hacktivity sending phishing emails itself.** Each customer would have to allow the simulations through their mail filters (Microsoft 365 has an advanced delivery policy for this: [configuring it](https://learn.microsoft.com/en-us/defender-office-365/advanced-delivery-policy-configure)). A service that sends convincing phishing at scale is a target for misuse, puts the operator's sending reputation at risk, and adds a support load the course doesn't need.

*Step 1 in detail:*

- **Data in.**
  - *Per simulation campaign:* date, a theme category (not the email itself), a difficulty rating, audience size, delivered, clicked, entered data, reported, the time of the first report, and how long reports took.
  - *Real reports:* weekly counts of user-reported messages (total, confirmed malicious, harmless), and the time from delivery to first report for confirmed campaigns where the customer's security team records it.
  - *Per person:* off by default. If the customer turns it on, it is used only to offer the learner a practice drill (below), and kept for 12 months (HA-15).
- **Difficulty.** Click rates depend heavily on how hard the lure is, so each campaign is tagged with a difficulty rating; the [NIST Phish Scale](https://csrc.nist.gov/pubs/tn/2276/final) (NIST TN 2276, November 2023) is a published method. The dashboard never compares click rates across campaigns of different difficulty.
- **Measures shown** (by department, above the HA-09 threshold): report rate; click rate; reports per click; time to first report; and the trend for real reported emails. Report rate comes first on every screen.
- **Link to the course.** A learner who clicked a simulation can be offered (never forced) the core_01 micro-drill (core_01's open question 3). No "you failed" page, no message to the manager, no escalation.
- **The ethics checklist.** The integration can't be switched on until an organisation admin confirms each point, and the confirmation goes in the audit log:
  1. HR has agreed to the simulation programme (NCSC), and staff representatives have been consulted where there are any (the ICO's monitoring guidance says employers should seek and document the views of workers or their representatives).
  2. Staff have been told that the organisation runs simulations, why, and what happens if they click: nothing punitive. The policy text is in the organisation profile (HA-11) and core_01 shows it.
  3. Nobody is punished, named or ranked for clicking.
  4. Reporting is measured and thanked, not just clicking.
  5. Lures are fair: no fake pay rises, bonuses, redundancies, health scares, bereavements or personal money troubles; no real brands used without permission; landing pages never store anything typed into them.
  6. Each campaign has a recorded difficulty rating, and results are compared only like for like.
  7. A DPIA covers the programme (the ICO expects one before monitoring likely to be high risk, and gives monitoring that may result in financial loss, such as performance management, as an example).
  8. The organisation has considered the NCSC's alternative of staff writing their own phishing emails in a friendly competition (core_01's alternative concept, "The Phish Tank", is built on it).

**Acceptance criteria:**

- An admin imports a campaign from the CSV template, or connects Microsoft's simulation results, and the dashboard shows report rate, click rate and time to first report by department, above the threshold, with the difficulty rating beside each campaign.
- No manager can see any individual's simulation result; the learner sees their own and the drill offer.
- The integration stays off until the checklist is confirmed, and the confirmation is in the audit log.

**Depends on:** HA-09, HA-14, HA-15, HA-11, BE-07 and HA-21 (the drill offer).

**Risks and open questions:**

- **Customers may want a built-in simulator.** *Recommendation:* the partner route, revisited after the pilots (D5).
- **Access to mail data.** Reading the customer's simulation or report data needs permissions in their tenant. Keep the integration read-only, with the narrowest permissions, and let customers upload CSVs instead.
- **"Repeat clickers".** Some tools list them by name. *Recommendation:* Hacktivity doesn't, and the drill offer goes to the learner privately.

### HA-13: Facilitated sessions

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** A team can play a module together on one screen with a facilitator, pausing to discuss (`01_LEARNING_DESIGN.md`, delivery modes). This is how staff who rarely use a computer get trained (`02_COMPLIANCE_MAPPING.md` section 5, "Everyone can complete it"), how boards exercise together (role_01; Cyber Governance Code D2), and how security champions run team events (core_01's "Inbox Defence"). Attendance has to be recorded as evidence.

**What exists today:** nothing for this. Some `mission.json` files hold facilitator notes, which Hacktivity doesn't read. The built awareness product will have one facilitator guide for the whole course, in the lab-sheet system, written last; per-episode notes are at most an extension.

**Design:**

- **Session:** facilitator, module and version, date, place or online, expected attendees (from HA-01, or walk-ins added by name and employee id), and the pause points and questions from the module's facilitator notes.
- **Two screens.** The shared screen shows the game in group mode (BE-15). The facilitator's own device shows the notes: timings, pause points, discussion questions, and a record of the group's decisions (vote counts, never names).
- **Attendance** by ticking names, by attendees scanning a code on their phones, or by uploading a signed sheet.
- **Completion for attendees.** Each attendee who stays to the end and passes the knowledge check gets a completion record with the route "facilitated", linked to the session. The check is done individually, on phones or on paper (the facilitator enters paper answers). Where someone can't take the check at all, the organisation can record the session as an alternative arrangement (HA-03), and the record says so.
- **Debrief slides** generated from the group's decisions (BE-02 data) for the discussion.
- **Own-plan exercise output.** For a board or team exercise that works through the organisation's own incident plan (role_01, Cyber Governance Code D2), the facilitator console stores and can export an action list (who will do what, by when) and an exercise report (what was decided, and what the plan is missing). This pairs with BE-15 in `break_escape_engine.md`.
- **Session record** in HA-05: facilitator, attendees, length, version, group decisions.

**Acceptance criteria:**

- A facilitator runs core_01 for 12 people on one screen, records attendance in under two minutes, enters paper check answers, and every attendee who passes gets a completion record linked to the session.
- The facilitator's view shows every pause point with its questions and timing.
- Group decisions are stored as counts only.

**Depends on:** BE-15, HA-01, HA-03, HA-05.

**Risks and open questions:**

- **Weaker individual evidence.** A session shows each person's attendance and check result, not their own decisions in play. PCI DSS 12.6.3's testing names attendance records, and the record shows the route, so an auditor can judge.

### HA-14: Evaluation and surveys

**Priority and size:** Not built, wish list. P2 (the plan said P3), M.

**Why:** Programmes are expected to show that training works, not just that it happened: NCSC CAF B6.b (routinely evaluated for reach and effectiveness), NIS2 IR 8.1 (tested for effectiveness), DSPT 3.1.3 (evaluation), Cyber Governance Code C4 (suitable metrics), NIST SP 800-50r1 (metrics and evaluation). The levels are set out in `assessment_and_evidence.md`.

**Builds on the build:** level 2 already exists in the game: role-based pre and post checks on parallel forms (AB and BA pairs), a report rate, and the discrimination figure for organisers. HA-14 reports them and adds the surveys and behaviour measures. It keeps the build's rule: no effectiveness claims, only a before and after change on matched items for a cohort, with the caveats printed alongside. No pilot is planned.

**What exists today:** a 1 to 5 rating and comments after a mission or lab, visible to administrators.

**Design:**

- **After each module (Kirkpatrick level 1):** at most three questions, skippable: how relevant this was to my job (1 to 5); how confident I am that I know what to do (1 to 5); one free-text "What would make this better?".
- **Confidence before and after (level 2):** an optional single confidence question with the pre-check and again with the post-check.
- **Annual culture pulse (level 3 indicators):** six to eight statements about reporting and help-seeking, aligned with NCSC CAF B6.a ("I know how to report something suspicious"; "If I clicked a phishing link I'd report it straight away"; "I'd feel safe reporting a mistake").
- **Behaviour data (level 3):** report-button and simulation data (HA-12); security-related service desk tickets; password manager and MFA take-up from the customer's own systems, entered as monthly figures or imported by CSV.
- **Results (level 4):** incidents and their causes, and fraud attempts stopped, entered by the security team with a short note.
- **Quarterly evaluation report** combining the levels, with the caveats in `assessment_and_evidence.md` printed alongside, and a list of the measures that have no data yet.
- **Privacy.** Survey answers are anonymous to the organisation: they are shown only in aggregate above the HA-09 threshold and never linked to a named record in any organisation view. Free-text answers are shown for groups at or above the threshold, without names, and the question asks people not to name colleagues.

**Acceptance criteria:**

- Survey results appear only for groups at or above the threshold, and no organisation view links an answer to a person.
- A quarterly report generates with levels 1 to 3 where data exists and says plainly what is missing.

**Depends on:** HA-09, HA-12, HA-15.

**Risks and open questions:**

- **Survey fatigue.** Three questions at most per module, and the annual pulse once a year.
- **Self-report isn't behaviour.** Confidence and culture answers are indicators; the report says so.

### HA-15: Data protection and platform trust

**Priority and size:** Not built, wish list. P2 (the plan said MVP), M.

**Why:** For the course, each customer organisation is the controller of its staff's training data, and the operator of Hacktivity is its processor. UK GDPR Art 28 (the same article number in EU GDPR) sets what the contract between them must say, and that a processor may use another processor only with the controller's prior written authorisation, specific or general, with notice of changes so the controller can object. Art 30(2) requires the processor to keep records of its processing; Art 32 requires security appropriate to the risk; Art 33(2) requires the processor to notify the controller "without undue delay after becoming aware of a personal data breach"; Art 5(1)(e) requires personal data to be kept no longer than necessary ([UK GDPR on legislation.gov.uk](https://www.legislation.gov.uk/eur/2016/679/contents)). Customers' procurement and security teams ask for a data processing agreement, a sub-processor list, the hosting location, a retention schedule, deletion and export on request, and an audit log, before any staff data is loaded.

**What exists today:** MFA at every sign-in; Hacktivity's public privacy statement says personal data is held on UK-based servers; organisation customers sign Hacktivity's general organisation terms. In the product, deletion is a manual administrator task, and there is no retention schedule, no export of a person's data and no audit log yet (`../research/current_state_hacktivity.md`). What the course needs on top: a data processing agreement written for staff training records, a published sub-processor list, and those product features.

**Design:**

- **The data processing agreement** (DPA), with the terms Art 28(3) requires:
  - process only on the customer's documented instructions;
  - staff who handle the data are bound to confidentiality;
  - the security measures, listed in an annex;
  - sub-processors only under the customer's general written authorisation, with a published list and 30 days' notice of changes so the customer can object;
  - help with requests from staff exercising their rights;
  - help with security, breach notification and DPIAs (Arts 32 to 36);
  - deletion or return of all personal data at the end of the contract;
  - all the information needed to show compliance, and audits.
  - Annexes: a description of the processing (below); the security measures; the sub-processors (hosting, email delivery, video hosting if HA-20 uses one, Stripe for the customer's billing contact); and the transfer mechanism if any data leaves the UK. EU customers can rely on the EU's adequacy decision for the UK, which the European Commission renewed on 19 December 2025 ([adequacy decisions](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en)).
- **The operator's own use.** Learner data from customer organisations is used only to provide the service. Product improvement uses aggregated, anonymised figures only, and the DPA says so. Research use needs the customer's written agreement and the operator's research ethics approval. No learner data from a customer organisation goes to advertising or marketing analytics services, and no page or email an organisation learner sees carries them.
- **What the course holds** (the description of processing):

| Data | About | Purpose |
|---|---|---|
| Name, work email, employee id | Learners, managers, admins | Accounts, assignments, records |
| Department, location, manager, job role, worker type, start and end dates | Learners | Assignment rules, dashboards |
| Assignments and their history | Learners | Compliance |
| Completion records, certificates, policy acknowledgements | Learners | Compliance evidence |
| Learning data: decisions, per-outcome ratings, check answers, time on task | Learners | Feedback to the learner; aggregate insight |
| Notifications sent | Learners, managers | Evidence of follow-up |
| Simulation results (if HA-12 is on) | Learners | Aggregate behaviour measures; drill offers |
| Survey answers | Learners | Evaluation, anonymous to the organisation |
| Audit log | Admins, learners | Security and accountability |

  The course needs no special category data and avoids collecting it: absence pauses carry no reason (HA-03), and accessibility settings belong to the learner and aren't shown to admins (HA-01).
- **Retention.** Defaults below; the customer can set its own within the limits, and every change is logged.

| Data | Default | Customer can set | Why |
|---|---|---|---|
| Completion records, acknowledgements, exemptions, certificates | While the person is active, then 6 years after they leave | 1 to 10 years after leaving | Evidence for audits and disputes. Six years matches HIPAA 164.316(b) and the six-year limit for claims founded on contract in England and Wales ([Limitation Act 1980, section 5](https://www.legislation.gov.uk/ukpga/1980/58/section/5)), the usual reason HR records are kept that long; customers with no such need should choose less |
| Learning detail (decision events, per-behaviour ratings, check answers) | 2 years from the attempt, or 90 days after the person leaves, whichever is sooner | 1 to 3 years | Long enough for two annual cycles of before and after; aggregates are kept |
| Raw xAPI statements (HA-22) | 12 months | 3 to 24 months | Records keep the results derived from them |
| Saved games of unfinished attempts | 90 days after last activity | 30 to 365 days | Resume |
| Notification log | 2 years | 1 to 6 years | Evidence of follow-up |
| Simulation results per person (HA-12) | 12 months | 3 to 12 months | Drill offers; aggregates are kept |
| Audit log | 2 years | 1 to 7 years | Accountability |

- **Deletion.**
  - Per person, when the customer asks (for example on an erasure request). Deletion reaches every store that holds the person's data: account, memberships, assignments, records, saved games, statements, notifications, survey links. Completion records are redacted rather than removed (HA-05) where the customer needs the counts to stay right, and log entries are pseudonymised. A deletion report lists what was removed.
  - Per organisation at the end of the contract: an export is offered for 30 days, then everything is deleted within 90 days (backups age out on their normal cycle, whose length the DPA states), and a deletion certificate is issued.
- **Export.**
  - Per person: everything held about them in that organisation, as JSON and as a readable PDF, for the customer to answer a subject access request.
  - Per organisation: people, units, rules, assignments, records, acknowledgements and the audit log, as CSV and JSON with a data dictionary.
- **Audit log.** Append-only, with the same chain of fingerprints as HA-05. It records admin sign-ins; role grants and removals; imports and changes to people; changes to rules, exemptions and due dates; record corrections; exports and downloads; every view of an individual's learning detail, with the reason; profile and policy changes; retention and deletion runs; and every support access by the operator's staff, with its ticket reference. Organisation admins can read and export their organisation's log.
- **Support access.** The operator's staff reach a customer's data only through a support mode that needs a ticket reference, expires after a set time, and shows in the customer's audit log.
- **Hosting.** UK hosting is the default, as today. An EU-hosted deployment is a P3 option for customers whose own policies require it. Sub-processors are chosen to process data in the UK or EU wherever possible.
- **Breach notification.** The DPA commits to telling the customer without undue delay; the operator's own target is within 24 hours of confirming that a breach affects the customer's data, with what is known, and updates as more is learned.
- **The customer's pack.** The DPA, the sub-processor list, the security measures, a DPIA template covering the course's processing (including learning data and optional simulation data), a privacy notice template for learners, the accessibility statement (HA-23), and the operator's security assurance (for example Cyber Essentials Plus certification, and an annual independent penetration test with a summary letter).
- **Telling learners.** A privacy notice written for learners, which the customer adopts: what is recorded, who sees what, how long it is kept, and that decisions in the game are for learning and are not used for discipline. Shown at first sign-in, linked from every page, and summarised on the "My data" page (HA-17).

**Acceptance criteria:**

- Before a customer's first learner is invited, the DPA is signed and the sub-processor list, security measures, retention schedule, DPIA template and learner privacy notice template have been given to the customer.
- Retention runs on schedule: in a test organisation with back-dated data, records past their period are deleted or redacted, and a deletion report is produced.
- A per-person export contains everything in the data inventory for that person, and nothing about anyone else.
- After a person is deleted, a search of every store for their id finds nothing but redacted records and pseudonymised log entries.
- Every event listed for the audit log is recorded with who, what, when and (for views of learning detail) why; the log exports; operator support access appears in it.
- No page or email that an organisation learner sees loads advertising or third-party analytics, checked by an automated scan of the learner journey.
- An organisation's data is fully deleted within 90 days of the contract ending, with a certificate.

**Depends on:** nothing to start: the DPA and the audit log come first. Its retention, deletion and export rules must cover the data that HA-01, HA-05, HA-09 and HA-22 hold, and every other feature depends on it.

**Risks and open questions:**

- **The six-year default.** It suits regulated customers but is longer than many need. *Recommendation:* keep six years as the default only after the operator's data protection officer agrees; otherwise default to three and let regulated customers extend it.
- **Size.** M is light once the DPA work, deletion across every store and the audit log are counted. *Recommendation:* treat it as L, and build the audit log first, because other features write to it.
- **EU hosting** costs a second deployment. *Recommendation:* wait for a customer who needs it.

### HA-16: Platform localisation

**Priority and size:** Not built, wish list. P3 (the plan said P3), M.

**Why:** Multinational customers, EU customers under NIS2 and DORA, and staff whose first language isn't English need the platform in their language, alongside the game's own localisation (BE-06).

**What exists today:** English only, with text written into the page templates. The game's voice generation already takes a language setting.

**Design:**

- All learner and admin text moved into translation files; dates, times and numbers formatted per locale; right-to-left layouts supported.
- Each person's language comes from their identity provider or their own choice, falling back to the organisation default, then English (with a note on the page when a translation is missing).
- Translated notification templates (HA-04), certificates (HA-06) and privacy notices (HA-15).
- A translation workflow: strings exported to a translation tool, professional translation, review by a native speaker who knows the subject, and a check that the translated pages still meet HA-23.
- The module catalogue shows which modules exist in which languages (BE-06), and records keep the language a module was taken in (HA-05).
- Locale-specific reference content (the national reporting routes, such as 7726 for scam texts in the UK) belongs to the module's localisation, not to the platform strings.

**Acceptance criteria:**

- A learner whose language is French sees the learner pages, emails and certificates in French; any missing string falls back to English and is logged for the translators.
- A completion record shows the language the module was taken in.

**Depends on:** BE-06, HA-04, HA-06, HA-11, HA-15, HA-23.

**Risks and open questions:**

- **Cost and upkeep.** Every new string needs translating. *Recommendation:* start with the learner journey only; admin pages later.
- **Welsh.** Some public bodies in Wales have duties to offer services in Welsh. *To verify* whether those duties would cover a customer's staff training before promising it.

### HA-17: Learner home

**Priority and size:** Not built, wish list. P3 (the plan said MVP), M.

**Why:** Staff need one page that tells them what is due and lets them start or carry on in one click. Modules are short and can be split over sittings (BE-12), so resuming has to be effortless. The reference cards, certificates and policies need a home.

**What exists today:** a personal dashboard with the learner's courses, "continue where you left off", the next mission, recent completions, stats, streaks, badges and CyBOK charts. It is built for students and lab users: no due dates, no difference between required and optional, no certificates, reference cards or policies.

**Design:**

- **"My training"** is where organisation learners land after signing in. The student panels (labs, streaks, CyBOK charts, public profile) are hidden for them unless their organisation also uses the labs.
- **Sections:**
  - *Due now:* in due-date order, each with its status, estimated minutes and due date, and a Start or Resume button.
  - *Coming up:* assignments not yet due, and annual renewals.
  - *Policies to acknowledge* (HA-07).
  - *Completed:* each with its date, valid-until date and certificate (HA-06).
  - *Reference cards:* every card from the learner's completed modules, with the organisation's own details, viewable and printable.
  - *Practice:* this month's drill (HA-21) and any practice assigned after a Not yet outcome, never shown as overdue.
  - *My data:* the learner's records and learning detail, who has viewed their learning detail and why (HA-09), and a download (HA-15).
- **Settings:** play the text route by default (BE-03), captions on, reduced motion, text size. They belong to the learner and aren't shown to admins.
- **Phones.** The page works at 320 pixels wide. Modules that need a larger screen say so before starting, and offer the text route on a phone.
- **Help.** The organisation's training contact (HA-11), and a "request an adjustment" form that sends a private note to the organisation admin (for example asking for a facilitated session); the form says not to include health details.
- **Sign-in.** Through single sign-on (HA-02) or email, password and MFA; links in reminders lead straight to the module after sign-in.

**Acceptance criteria:**

- A learner with three assignments sees them in due-date order with time estimates, and starts or resumes each in one click.
- Completed modules show their certificate links; reference cards print cleanly on A4 and Letter.
- The page meets WCAG 2.2 AA (HA-23) and works at 320 pixels wide.
- Organisation learners see none of the student panels unless their organisation uses the labs.

**Depends on:** HA-03, HA-05, HA-06, HA-07, HA-23, BE-03, BE-12.

**Risks and open questions:**

- **Two audiences in one product.** Streaks and badges suit students on optional courses; on mandatory training they can feel like pressure. *Recommendation:* separate home pages by membership type rather than one page with switches.

### HA-18: Licensing and billing

**Priority and size:** Not built, wish list. P3 (the plan said P3), M.

**Why:** The course is sold to organisations per seat: pilots need free trials, and larger customers pay against an invoice and a purchase order rather than by card. Seats used through an LMS (HA-10) have to be counted too.

**What exists today:** most of the machinery. Organisation subscriptions through Stripe, with seats, extra seats charged pro rata, monthly or annual billing in pounds or dollars, annual and volume discounts, VAT handling and trials; seats can also be set by an administrator with an end date.

**Design:**

- **A separate plan for the awareness course**, so buying it doesn't buy the labs and the other way round: an annual price per seat, with tiers by number of seats, and add-ons where they cost the operator more (LMS delivery, EU hosting).
- **What a seat is.** An active member of the organisation (HA-01) in the licence year, or a distinct LMS learner per package (HA-10). Leavers free their seat for reuse.
- **Never block mandatory training for a billing reason.** At 90% and 100% of seats, admins are warned; learners can still start what they have been assigned, and the difference is settled at renewal.
- **Invoices.** Quotes, invoices with purchase order numbers, payment by bank transfer, renewal reminders to the billing contact 60 and 30 days before the end, and optional automatic renewal.
- **Pilot organisations:** a free pilot (for example 60 days and up to 50 learners) set up by the operator, with the same features and the same data agreement as a paid organisation.
- **Contract records:** the order form, the DPA version signed (HA-15), and the start and end dates, shown to the operator and the customer's admin.

**Acceptance criteria:**

- An organisation buys 250 seats for a year by invoice with a purchase order number.
- At 100% of seats, admins are warned and learners can still start their assignments.
- Renewal reminders go to the billing contact 60 and 30 days before the end of the term.

**Depends on:** HA-01, HA-10, HA-15.

**Risks and open questions:**

- **Pricing model** (per seat, per active learner, or by organisation size band) is a commercial decision for the operator.
- **Resellers and managed service providers** who run the course for several clients need their own terms and the partner role in HA-01.

### HA-19: Content versioning and release notes

**Priority and size:** Not built, wish list. P2 (the plan said P2), S.

**Why:** Each record must show which version of a module a learner took (HA-05). Content has to be reviewed and kept current: PCI DSS 12.6.2 (review at least every 12 months), CIS 14.1, NIST AT-2 (keep content current), NIS2 IR 8.1 (planned intervals). Auditors ask what changed and when. core_17 gets a new edition each year (BE-13).

**What exists today:** missions are read from each scenario's `mission.json`, with no version number or release notes; a listing points at the current mission. Each game keeps a copy of the scenario it was generated from, which shows what that learner saw but has no version label.

**Design:**

- **A module version** has a number (major.minor.patch), a content fingerprint (over the scenario, the ink, the concepts and the question bank), a release date, a status (draft, pilot, released, retired), release notes for admins and a one-line summary for learners, and the version of the compliance mapping it was checked against.
- **What each kind of release means:**
  - *patch:* fixes (typos, bugs); never reassigns anyone;
  - *minor:* new or changed content or questions with the same outcomes; never reassigns anyone;
  - *major:* changed outcomes or changed advice; the operator marks whether a retake is required, and each organisation decides whether to reassign (HA-03).
- **Organisations choose how updates arrive.** Patch and minor releases arrive automatically by default; major releases wait for the admin to accept them. An organisation can pin a module to a version for up to 90 days (during an audit, say), and new attempts then use that version.
- **Every attempt records its version** at launch (HA-05); a learner who resumes keeps the version they started.
- **Release notes** per module, a feed for admins, and a monthly digest email.
- **Annual editions.** Each year's core_17 is a new major version, and the annual refresher path points at the current edition.

**Acceptance criteria:**

- Releasing core_01 1.3.0 publishes its notes; new attempts use 1.3.0; existing records keep the versions they were made with.
- An organisation that pinned 1.2.4 keeps launching 1.2.4 until the pin expires.
- A major release marked "retake required" reassigns completed learners in organisations that accept it, and only those.

**Depends on:** HA-03, HA-05, BE-13.

**Risks and open questions:**

- **The MVP needs versions.** *Recommendation:* the MVP stamps a version number and fingerprint on every attempt (see HA-05); notes, pinning and the release types arrive with this feature.
- **What the fingerprint covers.** Customer profile values are versioned separately (HA-11), so a change of phone number doesn't create a module version.

### HA-20: Video hosting, captions and transcripts

**Priority and size:** Not built, wish list. P3 (the plan said P2), S.

**Why:** Explainer videos (EX-02, EX-03) play in the game (MG-21) and on the learner's pages. WCAG 2.2 AA needs captions for prerecorded video (1.2.2) and audio description (1.2.5); the transcript is the equivalent for anyone who prefers to read. Watching needs a record when a video is part of a module.

**What exists today:** YouTube links attached to labs and missions. Watching isn't tracked, and there are no caption files or transcripts of Hacktivity's own.

**Design:**

- **Videos hosted as files**, served by Hacktivity or a UK or EU video sub-processor named in the DPA (HA-15); no YouTube for learner content, so no third-party tracking or adverts.
- **Each video has** WebVTT captions per language, a transcript as accessible HTML, and audio description (a described version, or descriptions in the transcript where the visuals carry meaning).
- **The player** works with a keyboard and a screen reader, has a captions switch and playback speed, shows the transcript alongside, and respects reduced motion. MG-21 uses the same player in the game.
- **Watched.** A video counts as watched when 90% has played or the transcript has been opened; reading the transcript counts the same as watching, so nobody is disadvantaged.
- **Versioned with its module** (HA-19).

**Acceptance criteria:**

- Every published video has captions, a transcript and audio description (or a described transcript).
- The player passes keyboard and screen reader checks.
- Opening the transcript records the same "watched" evidence as playing the video.

**Depends on:** HA-19, HA-23, MG-21, EX-02.

**Risks and open questions:**

- **Storage and bandwidth cost.** Videos are short (60 to 120 seconds); start with plain file hosting and add a delivery network only if needed.

### HA-21: Microlearning schedule

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** One sitting a year is quickly forgotten; spaced practice works better (Cepeda and others, 2006, in `01_LEARNING_DESIGN.md`). Frameworks ask for reminders through the year: HIPAA 164.308(a)(5)(ii)(A) (security reminders), NCSC CAF B6 (ongoing reminders and top-up training), NIS2 IR 8.1 (activities repeated over time). The course's monthly drills pathway needs a schedule.

**What exists today:** nothing for drills. The daily email job shows that scheduled sending already works.

**Design:**

- **A schedule per organisation:** monthly by default, on a chosen working day.
- **What each month's drill is.** Drills rotate through the core outcomes so each comes back every few months; the rotation leans towards the organisation's weakest outcomes (from HA-09's aggregates); and the operator can push a spotlight drill when a scam is in the news.
- **Delivery:** an email or chat message with one link, and "This month's drill" in the learner home.
- **Content:** drills from BE-07, drawn from the content banks (BE-13), 3 to 5 minutes, never the same set twice in 12 months for the same person.
- **Required or optional.** Optional by default. An organisation can require a number of drills a year, which adds to its "multiple methods" evidence (PCI DSS 12.6.3).
- **Personal spacing.** A learner with a Not yet outcome gets a drill on it 2 to 4 weeks later, privately (HA-03, "Practice").
- **Records.** Drill results are kept as light records (HA-05) and counted in dashboards in aggregate.

**Acceptance criteria:**

- With monthly drills on, every active learner gets one drill a month, on the chosen day.
- A learner with a Not yet outcome gets the matching drill within four weeks.
- No learner gets the same drill content twice within 12 months.

**Depends on:** BE-07, BE-13, HA-03, HA-04, HA-09.

**Risks and open questions:**

- **Fatigue.** Monthly is the maximum; organisations can choose every two months.

### HA-22: Learning record store

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** The game's evidence, as standard xAPI statements (BE-14), needs somewhere to live: for reporting and analysis, for learners launched through cmi5 from a customer's LMS (HA-10), and for customers who want it in their own learning record store.

**What exists today:** nothing. The game saves its state and objective changes to the server (story globals every 30 seconds and when the page is hidden), stored with the game; there is no statement store.

**Design:**

- **A learning record store** for xAPI statements and state documents, separated by organisation. The statements are generated on the server from BE-01's records (BE-14), so no store credentials ever reach a learner's browser.
- **Validation** against the course's xAPI profile (the verbs, activity types and extensions for outcome ids, behaviour ids and ratings that BE-14 defines). Malformed statements are rejected; a statement sent twice is stored once.
- **No names in statements.** The actor is an xAPI account with an opaque learner id per organisation, never an email address; Hacktivity alone holds the link to the person.
- **Processing.** The store keeps the statements for reporting, forwarding and cmi5; the completion record itself is built from BE-01's summary (HA-05), so the two always agree.
- **Forwarding** (per organisation, optional): copies of statements to the customer's own learning record store, filtered (module-level only, or everything), with retries. Switching it on shows the same privacy caution as HA-10.
- **Read access** for the organisation through an API key, for their own analysis.
- **Versions.** BE-14 targets the current xAPI base standard, which ADL's [specification repository](https://github.com/adlnet/xAPI-Spec) points to as xAPI 2.0, maintained with IEEE (BE-14 gives the IEEE reference). Many learning record stores still speak version 1.0.3, so statements should keep to what both accept.

**Acceptance criteria:**

- A core_01 attempt's statements are accepted and validated, and agree with the completion record built from BE-01's summary.
- Duplicate statements are ignored.
- Forwarding to a test learning record store works, with retries after an outage.
- No statement contains a name or an email address.

**Depends on:** BE-14, HA-05, HA-15.

**Risks and open questions:**

- **Volume.** A module may produce a few hundred statements per attempt. Raw statements are kept for 12 months (HA-15); records keep the results.
- **Build or embed?** An open-source learning record store could be run alongside Hacktivity instead of building one. *Recommendation:* compare the two at the start of P2, against the validation and separation needs above.

### HA-23: Accessible platform and lab sheet theme

**Priority and size:** Not built, wish list. P2 (the plan said MVP), M.

**Why:** The course commits to WCAG 2.2 AA (`DECISIONS_PENDING.md`, D9). Mandatory training has to be completable by everyone (DSPT 3.2.1's 95% includes directors, trustees and volunteers; NCSC CAF B6.b "from executives to the most junior"). UK public sector customers must meet the [Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps), which cover intranets and extranets and require an accessibility statement; content they pay for is not exempt as third-party content.

**What exists today:** the progress page is well built (screen reader labels, focus handling, AA contrast, reduced motion). Elsewhere there are a few accessibility attributes and a light and dark theme, and no accessibility statement. The HacktivityLabSheets theme, used for field guides and facilitator notes, removes focus outlines, has a theme switch with no accessible name, YouTube frames with no title, callout types shown only by colour or emoji, no skip link and no reduced-motion handling, and most images have empty alt text (`../research/current_state_lab_sheets.md`).

**Design:**

- **Scope.** Every page and email in the learner journey (invitation, sign-in, learner home, launch, records, certificates, policies, "My data") and every admin page an organisation uses (people, rules, dashboards, reports, profile, policies); the lab sheet theme pages used for field guides and facilitator notes, including inside the game's intranet terminal (BE-09). The 2D game itself is covered by BE-04 and the text route (BE-03).
- **Method.** An audit against WCAG 2.2 AA: automated checks plus manual testing with a keyboard; NVDA with Firefox and Chrome; VoiceOver on macOS and iOS; zoom to 400% and reflow at 320 CSS pixels (1.4.10); forced colours; reduced motion. Then fixes, then automated accessibility checks on the key pages in continuous integration so it stays fixed.
- **The criteria new in WCAG 2.2** that matter most here: focus not hidden behind sticky headers (2.4.11); a button alternative to every drag, such as moving units in the department tree (2.5.7); targets at least 24 by 24 pixels (2.5.8); help in the same place on every page (3.2.6); not asking for the same information twice (3.3.7); sign-in without a memory or puzzle test, with pasting and password managers allowed for passwords and MFA codes (3.3.8).
- **Lab sheet theme fixes.** Restore focus outlines; give the theme switch a name; title every frame; show callout types in text, not only colour and emoji; add a skip link; honour reduced motion; require alt text on every image in new pages.
- **An accessibility statement** for Hacktivity and for the course, in the GOV.UK model, so public sector customers can point to it.
- **Testing with disabled staff** in the first pilot, paid for their time.

**Acceptance criteria:**

- An audit of the learner journey and the organisation admin pages finds no WCAG 2.2 A or AA failures.
- Automated accessibility checks run on the key pages in continuous integration and fail the build on a new A or AA failure.
- The lab sheet theme fixes above are live, and a field guide opened in the game's intranet terminal passes the same checks.
- The accessibility statement is published.

**Depends on:** every feature with a page; BE-04 for the game.

**Risks and open questions:**

- **Older pages outside the journey** (labs, student features) will lag. *Recommendation:* fix the course journey first, list the rest in the accessibility statement with dates.

### HA-24: Public API and webhooks

**Priority and size:** Not built, wish list. P3 (the plan said P2), M.

**Why:** Larger customers run HR, governance, risk and compliance (GRC) and identity systems that want the training record without someone exporting a file every month. They also want to act the moment something changes: open a case when a module goes overdue, or hold access when a refresher lapses (the open question at the end of HA-03). Keyed access the customer's own systems can read, and events they can subscribe to, make the training record something the rest of their tooling can use.

**What exists today:** nothing. Records leave only as CSV, PDF transcripts and audit packs (HA-05), downloaded by hand.

**Design:**

- **Read access.** Keyed, read-only access to the compliance data a customer already sees in the dashboards and exports: people, assignments and due dates, completion records, certificates, exemptions and policy acknowledgements. Scoped to the one organisation the key belongs to, never to another customer's data. Learning data stays out, or comes only as the same above-threshold aggregates HA-09 shows, so decision data can't be pulled out by name.
- **Events (webhooks).** The customer registers where to send events and chooses which to receive: assignment created, completed, overdue, exemption decided, certificate issued, policy acknowledged. Each event carries the identifiers and compliance fields a receiving system needs, never learning detail. Deliveries are signed so the receiver can tell they came from Hacktivity, retried if the receiver is down, and listed with their delivery result.
- **Scope and roles.** A key is issued by an organisation admin, carries a role no wider than compliance viewer, can be limited to parts of the organisation, and can be rotated or revoked. Every key, and every change to one, is in the audit log (HA-15).
- **Use it to hold access.** The overdue event lets a customer's identity system react (the HA-03 open question): Hacktivity reports who is overdue; what the customer does about access is the customer's to decide in their own systems.
- **Screens.** A page to issue, name, scope, rotate and revoke keys; a list of registered event destinations with their recent deliveries and failures; a description of the data each call and event returns, for the customer's own developers.

**Acceptance criteria:**

- An organisation admin issues a scoped read key, pulls the current assignments and completion records for their organisation, and can reach no other organisation's data.
- A completion and an overdue each fire a signed event to a registered destination within a few minutes; a failed delivery is retried and shown in the delivery list.
- No API call or event returns a named individual's outcome ratings or decisions.
- Issuing, rotating and revoking a key is in the audit log.

**Depends on:** HA-01, HA-05, HA-09, HA-15.

**Risks and open questions:**

- **Another way out for personal data.** Keyed access makes it easier to move staff records. *Recommendation:* read-only, compliance data only, scoped and logged, with the same aggregate rules as HA-09 for anything drawn from learning data.
- **Customers asking for write access.** Creating assignments or people this way. *Recommendation:* read and events first; provisioning already has its own path (HA-02), so writing can wait until a customer needs it.

### HA-25: Partner role

**Priority and size:** Not built, wish list. P3 (the plan said P3), M.

**Why:** Resellers and managed service providers (MSPs) run the course for several client organisations and want one place to set them up and support them, without a separate sign-in per client and without seeing each client's staff by name. HA-01 keeps every customer's data apart; a partner role lets one trusted outside party work across several of them within limits the customer sets. HA-01 already notes this as a P3 extension.

**What exists today:** nothing. Roles are scoped to one organisation (HA-01); account managers are the operator's own staff, not an outside partner.

**Design:**

- **Partner.** An organisation marked as a partner, with its own people, holding a relationship to each client organisation it looks after. A client admits a partner, and can end the relationship at any time.
- **What a partner can do, by default.** Set a client up and support it: build the profile (HA-11), load policies (HA-07), draft paths and assignment rules (HA-03), run the setup checklist (HA-26), and see compliance status in aggregate to show the client is on track. A partner does not see learners' learning detail, individual outcome ratings or decisions, and sees named compliance data only where the client turns that on for the people the partner supports.
- **What the client controls.** Which partner, over which parts of the organisation, with which role (from a setup-only role up to compliance viewer), and for how long. The grant can be narrowed or withdrawn, and the client always keeps its own admin.
- **Billing.** A partner can hold seats across its clients (HA-18), so it can buy in bulk and assign seats to each client.
- **Screens.** For the partner: a list of its client organisations with each one's setup state and headline compliance figures, and a way into each client within the granted scope. For the client: who at the partner can act for them, over what, until when, and when they last did.
- **Logging.** Everything a partner does in a client organisation is in that client's audit log (HA-15), attributed to the partner's person.

**Acceptance criteria:**

- A partner sets up three client organisations from one sign-in, and sees no learner's learning detail in any of them.
- A client narrows a partner's scope to one division, and the partner can then act only there.
- A client ends the relationship and the partner loses all access at once, while the client keeps every record.
- Every partner action in a client organisation is in that client's audit log, named as the partner's.

**Depends on:** HA-01, HA-09, HA-11, HA-15, HA-18.

**Risks and open questions:**

- **A partner is another processor.** A partner acting on staff data sits under the customer's data processing agreement (HA-15). *Recommendation:* the relationship is admitted in writing, scoped, time-boxed and logged, and the DPA covers partners as it covers the operator.
- **Scope creep.** Partners will ask for more than setup. *Recommendation:* start at setup and aggregate status, and widen only with the client's explicit grant.

### HA-26: Organisation setup checklist

**Priority and size:** Not built, wish list. P3 (the plan said MVP), S.

**Why:** The first time an organisation goes live, several things must be in place before staff are invited, or the first learners meet an empty profile, a missing policy or a rule that assigns the wrong people. A short go-live checklist that holds invitations until each step is done stops a botched launch, and gives the admin (or the partner in HA-25) one page that says what is left.

**What exists today:** nothing. An admin sets each piece up on its own screen, with nothing joining them and nothing holding staff invitations until it is ready.

**Design:**

- **The steps**, each linking to the screen that completes it, each either done or not:
  - the data processing agreement is signed and the hosting region chosen (HA-15);
  - the organisation profile is complete, with every required slot filled and the reporting routes set, previewed as a learner (HA-11);
  - the policies the chosen paths need are loaded as accessible versions (HA-07);
  - the paths and assignment rules are chosen and previewed, so the admin has seen who would be assigned what and when (HA-03);
  - people are imported and spot-checked (HA-01), with the reminder sender and working days set (HA-04);
  - a test learner has run the first module end to end, and a completion record and certificate came back (HA-05, HA-06).
- **It holds the right thing.** Inviting staff is held until the steps that must come first are done; the admin can still preview and run the test learner. What is missing is listed, as HA-11 lists empty required slots.
- **Reusable.** The checklist is run again for a new path, a new department going live, or the annual refresher, as a lighter list.
- **Screens.** One checklist page with each step's state, a link to finish it, and a single "ready to invite" state that turns on only when the holding steps are done.

**Acceptance criteria:**

- With the profile incomplete or no policy loaded, staff can't be invited, and the checklist shows exactly what is missing.
- A test learner completes the first module, and the checklist shows the completion record and certificate came back.
- When every holding step is done, the checklist turns to "ready to invite" and invitations can go out.

**Depends on:** HA-01, HA-03, HA-05, HA-06, HA-07, HA-11, HA-15.

**Risks and open questions:**

- **Too rigid.** A hard hold can frustrate a customer who knows what they are doing. *Recommendation:* hold only the few steps that cause real harm if skipped (no profile, no policy, no test run), and let the rest be warnings.

## Build order

Replaces the old MVP slice. The built product already runs on Hacktivity as ordinary missions, so nothing here blocks it.

1. **Nothing, until the user says so.** No Hacktivity change happens without the user's go-ahead.
2. **Next: the reporting-route setting** (the first step of HA-11), once the user answers the route options form. It is small, the game side is already built, and it makes every debrief end on the customer's own route.
3. **If the awareness product is offered to organisations (P2):** HA-15 first (before any staff data is loaded), then HA-01 and HA-03 (groups, and assignment that replaces the organiser's manual ordering and AB/BA split), HA-19 (episode versions), HA-05 (completion records built from the awareness-measure blocks), HA-09 and HA-14 (organiser views of pre and post change, report rate and the discrimination figure, in aggregate, with no effectiveness claims), and HA-23 throughout.
4. **Then, at scale (P3):** HA-02, HA-04, HA-06, HA-07, HA-08, HA-10, HA-12, HA-13, HA-16, HA-17, HA-18, HA-20, HA-21, HA-22, HA-24, HA-25 and HA-26.

## Proposed additions to the catalogue

Public API and webhooks, a partner role and the organisation setup checklist are now catalogued as HA-24, HA-25 and HA-26 above.

## Sources

Standards and guidance checked on 14 October 2026:

- NCSC, [Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing) (published 5 February 2018, reviewed 13 February 2024).
- ICO, [Employment practices and data protection: monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/) (under review following the Data (Use and Access) Act 2025), and [How do we ensure anonymisation is effective?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/).
- [UK GDPR on legislation.gov.uk](https://www.legislation.gov.uk/eur/2016/679/contents): Articles 5, 28, 30, 32 and 33.
- European Commission, [adequacy decisions](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en) (renewal for the UK, 19 December 2025).
- [Limitation Act 1980, section 5](https://www.legislation.gov.uk/ukpga/1980/58/section/5).
- OASIS, [SAML 2.0](https://docs.oasis-open.org/security/saml/v2.0/); OpenID Foundation, [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html); IETF, [RFC 7643](https://www.rfc-editor.org/rfc/rfc7643) and [RFC 7644](https://www.rfc-editor.org/rfc/rfc7644) (SCIM 2.0).
- 1EdTech, [LTI Core 1.3](https://www.imsglobal.org/spec/lti/v1p3), [Assignment and Grade Services 2.0](https://www.imsglobal.org/spec/lti-ags/v2p0), [Names and Role Provisioning Services 2.0](https://www.imsglobal.org/spec/lti-nrps/v2p0), [Deep Linking 2.0](https://www.imsglobal.org/spec/lti-dl/v2p0), the [legacy LTI deprecation schedule](https://www.imsglobal.org/lti-security-announcement-and-deprecation-schedule), and [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0).
- [cmi5 specification, Quartz edition](https://github.com/AICC/CMI-5_Spec_Current); ADL's [xAPI specification repository](https://github.com/adlnet/xAPI-Spec).
- SCORM 1.2 and 2004: Rustici Software's [run-time reference](https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/) and [version history](https://scorm.com/scorm-explained/business-of-scorm/scorm-versions/) (ADL's own site was unavailable; to verify against ADL's documents).
- W3C, [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (Recommendation, 12 December 2024 update); GOV.UK, [accessibility requirements for public sector websites and apps](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps).
- Microsoft, [Attack simulation training](https://learn.microsoft.com/en-us/defender-office-365/attack-simulation-training-get-started), [user reported settings](https://learn.microsoft.com/en-us/defender-office-365/submissions-user-reported-messages-custom-mailbox), [advanced delivery policy](https://learn.microsoft.com/en-us/defender-office-365/advanced-delivery-policy-configure) and [SCIM provisioning with Entra ID](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups); Okta, [SCIM](https://developer.okta.com/docs/concepts/scim/).
- NIST, [NIST Phish Scale User Guide, TN 2276](https://csrc.nist.gov/pubs/tn/2276/final) (November 2023).
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) [Phishing in organizations: findings from a large-scale and long-term study](https://arxiv.org/abs/2112.07498), IEEE Symposium on Security and Privacy.
- [Gophish](https://github.com/gophish/gophish), open-source phishing toolkit (MIT licence).

Compliance references (PCI DSS, ISO 27001, NIST, CIS, NCSC CAF, DSPT, the ICO training toolkit, HIPAA, NYDFS, the Cyber Governance Code) follow `../02_COMPLIANCE_MAPPING.md`, which records how each was checked.
