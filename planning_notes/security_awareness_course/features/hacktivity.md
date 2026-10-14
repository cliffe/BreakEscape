# Hacktivity features (HA)

The platform features the awareness course needs from Hacktivity, so that a customer organisation can give the course to its staff, see who has done it, chase the people who haven't, and show the evidence to an auditor. Each feature is described by what it does, who uses it, the data it keeps, its screens and flows, and how it connects to the game. This file is about features only: it says nothing about how Hacktivity is built inside.

Every feature has the same headings: **Priority and size** (as in `README.md`: MVP, P2 or P3; S is days, M a few weeks, L a month or more, for one developer), **Why**, **What exists today**, **Design**, **Acceptance criteria**, **Depends on**, and **Risks and open questions**. The ids are fixed. The assessment model these features carry is in `assessment_and_evidence.md`. The requirements they answer are in `../02_COMPLIANCE_MAPPING.md`, and its short references ("PCI DSS 12.6.3", "NCSC CAF B6.b") are used here.

## What Hacktivity already gives the course

Hacktivity runs hands-on cyber security courses for universities and organisations. Much of what mandatory training needs is already there (see `../research/current_state_hacktivity.md`):

- **Organisations with seats.** An organisation has a name, a number of seats and a subscription end date. Seats are bought by card through Stripe or set by an administrator, and access stops when a seat is removed.
- **Courses as templates.** A template course can be copied into an organisation's own course with its dates shifted, which is close to "give this organisation the Induction Essentials path".
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
| 3. Assign | Organisation admin | Sets rules: Induction Essentials within 14 days of starting; the annual refresher every 12 months; role paths by job role; exemptions with reasons | HA-03, HA-19 | MVP |
| 4. Play | Staff | Get an invitation, open "My training", play each module (in the browser, or from their own LMS), finish with the debrief, the check, the reference card and any policy to acknowledge, and get a certificate | HA-17, HA-07, HA-06, HA-23, HA-10, HA-20 | MVP (LMS in P2) |
| 5. Chase | Managers and admins | Reminders go out before and after due dates; managers see their team's status and can nudge; overdue cases escalate | HA-04, HA-09 | Dashboards MVP; reminders P2 |
| 6. Prove | Internal and external auditors | Read-only access to records, rules, exemptions and acknowledgements; an audit pack for a period and a framework; certificates that can be checked online | HA-05, HA-06, HA-15, HA-19 | MVP |
| 7. Improve | The security team | Per-outcome results by department (above the privacy threshold) pick next year's spotlight modules; surveys, report-button data and monthly drills | HA-09, HA-14, HA-12, HA-21 | P2 and P3 |

## Principles for every platform feature

1. **The customer is the controller; the Hacktivity operator is its processor.** Every feature helps the customer meet its own duties: telling staff what is recorded, limiting who sees it, deleting it on time (HA-15).
2. **Two kinds of data, kept apart.** *Compliance data* (assigned, due, completed, which version, the check result, acknowledgements) is for chasing and auditing and is seen by name. *Learning data* (what the learner did in the game, per-outcome ratings, the hook baseline) is for the learner, and reaches the organisation only in aggregate above a privacy threshold. Managers never see an individual's decisions, and learning data is never used for discipline (HA-09, `assessment_and_evidence.md`).
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
| HA-01 | Organisations, departments and roles | MVP | L | Partly: organisations and seats; no departments, managers or scoped roles | HA-15, HA-23 |
| HA-02 | Single sign-on and provisioning | P2 | L | None: email and password accounts, invitations | HA-01, HA-03, HA-15 |
| HA-03 | Learning paths and assignments | MVP | L | Partly: courses, release dates, enrolment; no per-person due dates, recurrence or exemptions | HA-01, HA-05, HA-19 |
| HA-04 | Reminders and escalation | P2 | M | Partly: email and a daily scheduler; no due-date reminders | HA-01, HA-03, HA-11, HA-17 |
| HA-05 | Completion records and audit evidence | MVP | M | Partly: status, score and times per game; no version, outcomes, sealed records or audit pack | BE-01, MG-20, HA-03, HA-15, HA-19 |
| HA-06 | Certificates and badges | MVP | S | None | HA-05, HA-11, HA-23 |
| HA-07 | Policy library and acknowledgement | MVP | M | None | HA-01, HA-03, HA-05, BE-09 |
| HA-08 | Question banks | P2 | M | None | MG-20, BE-13, HA-19 |
| HA-09 | Organisation dashboards | MVP | M | Partly: a progress page per course | HA-01, HA-03, HA-05, HA-15 |
| HA-10 | LMS interoperability | P2 | L | None | HA-05, HA-18, HA-19, BE-14, HA-22 |
| HA-11 | Organisation profile and branding | MVP | M | None | BE-05, BE-09, BE-20, HA-07 |
| HA-12 | Phishing simulation and report-button data | P3 | L | None | HA-09, HA-14, HA-15, BE-07 |
| HA-13 | Facilitated sessions | P2 | M | None | BE-15, HA-01, HA-05 |
| HA-14 | Evaluation and surveys | P3 | M | Partly: ratings and comments after a mission | HA-09, HA-12, HA-15 |
| HA-15 | Data protection and platform trust | MVP | M | Partly: MFA, UK hosting | HA-01, HA-05, HA-09 |
| HA-16 | Platform localisation | P3 | M | None: English only | BE-06, HA-04, HA-06, HA-11 |
| HA-17 | Learner home | MVP | M | Partly: a dashboard with "continue where you left off" | HA-03, HA-05, HA-06, HA-07 |
| HA-18 | Licensing and billing | P3 | M | Mostly: Stripe seats, trials, renewals | HA-01, HA-10, HA-15 |
| HA-19 | Content versioning and release notes | P2 | S | None, though each game keeps the scenario it was built from | HA-03, HA-05, BE-13 |
| HA-20 | Video hosting, captions and transcripts | P2 | S | Partly: video links on missions, not tracked | HA-19, HA-23, MG-21 |
| HA-21 | Microlearning schedule | P2 | M | None | BE-07, BE-13, HA-03, HA-04 |
| HA-22 | Learning record store | P2 | M | None | BE-14, HA-05, HA-15 |
| HA-23 | Accessible platform and lab sheet theme | MVP | M | Partly: the progress page is accessible | BE-04 |

The features below are in id order.

### HA-01: Organisations, departments and roles

**Priority and size:** MVP, L.

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

**Priority and size:** P2, L.

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

**Priority and size:** MVP, L.

**Why:** This is the centre of mandatory training. The rules come straight from the requirements:

- **On joining.** PCI DSS 12.6.3 (on hire); CIS 14.1 (at hire); ICO training toolkit (before access to personal data and within one month of starting); NIST AT-2 (on joining); DSPT 2.1.1 (induction). The course's Induction Essentials path is due within the first two weeks, with the window set by the organisation (`00_COURSE_OVERVIEW.md`).
- **On a change of role.** NIST AT-3 (before access or duties); NIS2 IR 8.2 (when staff move into security-relevant roles); PCI DSS 12.6.3 guidance (moving into a role that can affect card data).
- **Every 12 months.** PCI DSS 12.6.3; CIS 14.1; NYDFS 500.14(a)(3); DSPT 3.2.1 (95% trained in the last twelve months).
- **Exemptions with reasons.** Auditors ask why anyone in scope wasn't trained, and a reason recorded at the time is the answer.

**What exists today:** courses with missions in a set order, release dates, a release calendar, and date shifting when a template is copied; enrolment by self sign-up, invitation, automatically on open courses, or on starting a mission. Labs have end times and late penalties; missions have no due dates. Nothing is relative to a person's start date, nothing repeats, and there are no role-based rules, no exemptions, and no use of the prerequisites some `mission.json` files declare.

**Design:**

- **Concepts.**
  - *Module:* a catalogue item with versions (HA-19).
  - *Path:* an ordered set of modules with optional sequencing (core_00 first in Induction Essentials; the rest in any order) and "organisation's choice" slots (the one or two spotlight modules in the annual refresher). The course provides the standard paths; organisations can build their own from the catalogue.
  - *Assignment rule:* who (an audience: everyone, or filters on unit, location, job role, worker type and tags, with exclusions), what (a path or modules), when (a trigger), the due offset, recurrence, and options (test-out allowed, whether the check pass mark differs from the organisation default).
  - *Assignment:* one person, one module or path, the rule that created it, assigned date, due date, cycle number, status (not started, in progress, complete, overdue, exempt, paused, cancelled, superseded) and the completion record that closed it.
- **Triggers.**

| Trigger | Fires when | Default due | Notes |
|---|---|---|---|
| On joining | A member has a start date (from HA-01 or HA-02) | Start date plus 14 days | Modules can be marked "due on day one" (for example core_05 where staff handle personal data from the start). Assignments can be created before the start date and shown from it |
| On role change | A member enters a rule's audience (new job role, unit or tag) | Change date plus 30 days | Skips modules the person completed within the current recertification window |
| Every 12 months | A completion is approaching its expiry | 12 months after the last completion ("rolling"), or a fixed annual date for everyone | A reminder 30 days before (HA-04). A completion stays current until its expiry date |
| Campaign | An admin assigns a module to an audience once | A chosen date | For a spotlight after an incident or a new scam in the news |
| Practice | A learner's outcome is Not yet in a module | 2 to 4 weeks later | A micro-drill on that outcome (BE-07, HA-21). Private: shown to the learner as practice, never to their manager |

- **Recurrence anchors.** Rolling (each person 12 months after their last completion) is the default, because it spreads the load and matches "at least once every 12 months". A fixed date ("everyone by 31 March") suits organisations that report on a financial year; a person who completed within the previous few months can then be carried over by a set rule.
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

- A rule "Induction Essentials, employees and contractors, within 14 days of start date" gives a person imported with a start date six assignments, due on the right day in the organisation's time zone. Changing the start date moves the due dates and logs the change.
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

**Priority and size:** P2, M.

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

- **Settings per organisation.** Each notification on or off, its timings, quiet hours, working days (no weekend sends by default), the time zone, and the sender name ("Larkspur Security Team, via Hacktivity"). Never more than one email to a person in a day: anything else waits for tomorrow's or is folded into the digest.
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

**Priority and size:** MVP, M.

**Why:** Auditors ask for records, and the frameworks are specific about it: ISO 27001 cl. 7.2 (documented information as evidence of competence); NIST AT-4 (individual training records, kept for a period the organisation sets); NCSC CAF B6.b (training records lacking or incomplete means "Not achieved", and each individual's training tracked and refreshed means "Achieved"); the ICO training toolkit (records of completed training, assessment results, completion rates); PCI DSS 12.6.3 (attendance records and acknowledgements); HIPAA 164.316(b) (documentation kept for six years); DSPT 3.2.1 (the share of staff trained in the last twelve months). See `02_COMPLIANCE_MAPPING.md` section 5, "Training records".

**What exists today:** for each game, a status (in progress, completed, abandoned), start and completion times, a score out of 100 (70% tasks, 30% aims) and task and aim counts. A learner can play a listing several times and the best score counts. Per-course progress pages export progress percentages and scores as CSV, without completion dates or status, and a results page can be printed from the browser. Nothing records the module version, time on task, outcome results or acknowledgements, and records can change after the fact (a best score is recalculated).

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
  - results: knowledge check score, the pass mark in force, attempts; a rating per learning outcome (Secure, Developing, Not yet); each critical behaviour as shown, shown after practice, or not applicable; the hook and Apply ratings for the before and after;
  - linked evidence: policy acknowledgements, whether the reference card was opened, the certificate id, the attempt id;
  - integrity: a fingerprint of the record and of the previous record for the organisation, and the server time it was written.
- **Results are worked out on the server.** The game sends the events (what was decided, when); the server applies the module's evidence rules to rate outcomes and decide completion, as today's scoring is already worked out on the server. A learner's browser never sends a final rating.
- **Tamper evidence.** Each organisation's records form a chain: every record carries a fingerprint of its own content and of the record before it. The latest fingerprint is printed in every audit pack, so changing or removing an old record afterwards shows up when the chain is checked. When retention rules (HA-15) remove personal data, the record is redacted rather than deleted: the names go, the fingerprint and the outcome stay, and a deletion entry is added to the chain.
- **Questions it must answer quickly.** Who completed module X (any version, or version Y) between two dates? Who was current for each annual requirement on a given date? Which joiners finished Induction Essentials within their window? Who is in scope but neither complete nor exempt?
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

**Depends on:** BE-01 (decision records), MG-20 (check results), HA-22 (statements, when built; until then the game's existing saves carry the BE-01 log), HA-19 (versions), HA-03 (assignments), HA-07 (acknowledgements), HA-15 (retention, audit log).

**Risks and open questions:**

- **Size.** With the audit pack, framework views and the chain this is nearer L than M. *Recommendation:* MVP is the records, CSV, transcript and a plain audit pack; the chain and framework views follow in P2.
- **Version in the MVP.** HA-19 is P2, but records need a module version from the first pilot. *Recommendation:* the MVP stamps a version number and fingerprint on every attempt; release notes and pinning come with HA-19.
- **Time on task.** Active time stops counting after five minutes without input, which can under-count screen reader users who listen without pressing keys. *Recommendation:* count time while the module is in focus, with a long idle limit, and never use time on task as a pass condition.
- **Which record is the truth when an LMS is involved?** *Recommendation:* the Hacktivity record is the evidence; the LMS gets a summary (HA-10).

### HA-06: Certificates and badges

**Priority and size:** MVP, S.

**Why:** Learners, HR files and some auditors want a certificate. Contractors working for several clients need to show their training to each one. Some organisations want digital badges.

**What exists today:** no certificates; a results page can be printed from the browser. Profile badges and streaks for labs, which suit students rather than staff.

**Design:**

- A certificate for every module completion record and every completed path ("Induction Essentials", "Annual refresher 2026 to 2027").
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

**Priority and size:** MVP, M.

**Why:** PCI DSS 12.6.3 requires personnel to acknowledge, at least every 12 months, that they have read and understood the security policy and procedures. ISO 27001 cl. 7.3, DORA RTS Art 19 and CMMC AT.L2-3.2.1 require staff to know the policies that apply to them, and ISO/IEC 27001:2022 control A.5.1 expects policies to be acknowledged by relevant personnel (wording to verify; A.5.1 is not yet in `02_COMPLIANCE_MAPPING.md`). The course's own completion rule says a module isn't complete until any policy attached to it is acknowledged (`00_COURSE_OVERVIEW.md`). core_16 (Small Print) is built around this, and the intranet terminal in the game (BE-09) is where the policies sit.

**What exists today:** nothing. There is no policy content type and no acknowledgement of anything, Hacktivity's own terms included.

**Design:**

- **Data.**
  - *Policy:* title, category (information security, acceptable use, data protection, remote working and so on), owner, audience (a rule like HA-03's), and the modules it is attached to (for example the acceptable use policy to core_16, the data protection policy to core_05).
  - *Policy version:* version label, effective date, approved by and on (ISO 27001 expects approval by management), next review date, the document, a plain-English summary, a "what changed" note, the change type, and a content fingerprint.
  - *Document formats:* accessible HTML is required (written in the editor or converted from an upload); a PDF can be attached as well. A PDF on its own is flagged until an accessible version exists.
  - *Change type:* **minor** (wording, contacts, formatting: no re-acknowledgement) or **significant** (a change to what people must do: re-acknowledgement due within 14 days by default). The admin must choose and explain.
  - *Acknowledgement:* the person, the policy version and its fingerprint, the exact statement shown, the time, and the method (Hacktivity page, in the game through BE-09, from an LMS, or a paper form entered by an admin). Written to the HA-05 chain and never edited.
- **The statement.** Configurable per policy, defaulting to the PCI DSS wording: "I have read and understood the Acceptable Use Policy, version 3.2, and I will follow it." One button. No timers, no forced scrolling to the bottom: those prove nothing and fail people who use assistive technology. An optional single question from the organisation's bank (HA-08) can check one key point.
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

**Priority and size:** P2, M.

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

**Priority and size:** MVP, M.

**Why:** Managers and admins chase completion; the ICO training toolkit expects completion monitored at all levels; DSPT 3.2.1 sets a 95% figure for many health and care organisations; boards are asked to gain assurance "using suitable metrics" (Cyber Governance Code C4); NCSC CAF B6.b says measuring only how many people were reached is not enough. Per-outcome results by department show where the next year's effort should go.

The same data can do harm. Decision data for a small team identifies individuals. Used for discipline, it would destroy the reporting culture the course exists to build: the NCSC's phishing guidance says plainly that "blaming users for clicking on links doesn't work" and that "employees who are afraid for their jobs will not report mistakes" ([NCSC, Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing)). The ICO's guidance on monitoring workers says employers must be clear about the purpose of monitoring and tell workers about it, and lists monitoring that may lead to performance management as an example of processing likely to need a DPIA ([ICO, Employment practices and data protection: monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/)).

**What exists today:** a progress page per course for training staff, with each person's progress per item, inactivity flags and CSV export, built accessibly. No organisation-wide, department or manager views, no overdue or compliance reports, no scheduled reports.

**Design:**

- **Four views.**

| View | Who | Shows | Never shows |
|---|---|---|---|
| **Compliance** | Organisation admin, compliance viewer, auditor | Percentage current for each requirement (induction within its window, annual refresher, policy acknowledgements), by department and location; overdue and exempt counts; trends; a "trained in the last 12 months" figure with a target line (for example DSPT's 95%); drill-down to named people for chasing | Outcome ratings or decisions |
| **My team** | Manager | Each report's assignments with status and due dates; a reminder button | Scores, outcome ratings, decisions, practice assignments |
| **Learning insight** | Organisation admin (and a security team role the organisation can grant) | Per-outcome distributions (Secure, Developing, Not yet) per module and department; the hook-to-Apply change; the most-missed behaviours; the organisation's own question statistics; all above the privacy threshold | Names, or any group below the threshold |
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

**Priority and size:** P2, L.

**Why:** Many customers already run a learning management system (LMS) and want to assign the course there, alongside their other mandatory training, and see completions in the reports they already use. The plan pilots in Hacktivity first and adds LMS delivery before wider sales (`DECISIONS_PENDING.md`, D4).

**What exists today:** none of SCORM, LTI, xAPI or cmi5; no public API.

**What each standard supports.** Checked on 14 October 2026 against the standards bodies' documents where they could be reached:

| | SCORM 1.2 | SCORM 2004 (4th edition) | cmi5 | LTI 1.3 with LTI Advantage |
|---|---|---|---|---|
| **Body and date** | ADL, October 2001 | ADL, March 2009 | ADL and the AICC; "Quartz" 1st edition, 1 June 2016 | 1EdTech (formerly IMS Global); final release 16 April 2019 |
| **How it launches** | A zip package (with an `imsmanifest.xml`) imported into the LMS; content runs in the LMS's browser window and talks to it through a JavaScript API | As SCORM 1.2 | The LMS launches each unit (an "assignable unit") by URL, which can be hosted anywhere; a course structure file describes the units and can be imported without a zip | The tool stays hosted by its provider; the LMS launches it with an OpenID Connect flow and signed tokens (JWTs) |
| **Completion and success** | One field, `lesson_status`: passed, completed, failed, incomplete, browsed or not attempted | Two fields: `completion_status` (completed, incomplete, not attempted, unknown) and `success_status` (passed, failed, unknown) | Statements with the cmi5 verbs launched, initialized, completed, passed, failed, abandoned, waived, terminated and satisfied; the LMS decides "satisfied" from each unit's moveOn rule (Passed, Completed, CompletedAndPassed, CompletedOrPassed or NotApplicable) | Assignment and Grade Services 2.0: a score (`scoreGiven` out of `scoreMaximum`), a comment, an activity progress (Initialized, Started, InProgress, Submitted, Completed) and a grading progress (FullyGraded, Pending, PendingManual, Failed, NotReady) |
| **Score** | `score.raw`, with min and max | `score.scaled` (from -1 to 1) and raw; the LMS can pass in a `scaled_passing_score` | In passed or failed statements; the LMS passes a masteryScore | As above |
| **Detail per outcome** | `objectives` and `interactions` exist, but LMSs vary in what they store and report | `objectives` (each with its own status and score) and `interactions` | Any other xAPI statements ("cmi5 allowed") between initialized and terminated, which the LMS must record and report; objectives can be listed in the course structure | None beyond the comment |
| **Saved state** | `suspend_data`, 4,096 characters | `suspend_data`, 64,000 characters (4,000 in the 2nd edition) | The xAPI State API | Kept by the tool |
| **Learner identity** | LMS learner id and name | LMS learner id and name | An xAPI account, not an email address | The platform's user id; name, email and roles if the LMS shares them; class lists through Names and Role Provisioning Services 2.0 |
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
- **cmi5:** a course structure file per module, pointing at the unit on Hacktivity, with moveOn CompletedAndPassed and a masteryScore taken from the organisation's pass mark. The launcher meets the unit's obligations (fetch the token, then initialized, completed, passed, terminated). Per-outcome "cmi5 allowed" statements from BE-14 go to the customer's learning record store only if the organisation turns that on, with the same caution as SCORM objectives.

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
- cmi5: a cmi5 LMS marks the unit satisfied under moveOn CompletedAndPassed.

**Depends on:** HA-05, HA-19, HA-18 (licence keys and seats), HA-15 (the data agreement covers LMS data), HA-11, BE-12 (resume); BE-14 and HA-22 for cmi5 and richer data.

**Risks and open questions:**

- **Sessions inside an LMS frame.** Browsers increasingly block cookies set by a site framed inside another site, so a module framed inside an LMS can lose its session. *Recommendation:* launch sessions with tokens rather than cookies, and offer "open in a new window" as a fallback.
- **LMS quirks.** Every LMS implements SCORM a little differently. Budget testing per LMS, and keep a compatibility list.
- **Two copies of the truth.** The LMS and Hacktivity both hold a result. *Recommendation:* Hacktivity's record is the evidence; the LMS gets a summary, and the audit pack says so.
- **Data protection.** Learner ids and names arrive from the LMS. The data processing agreement (HA-15) must cover them, and organisations that switch on per-outcome data in their LMS take on the job of protecting it there.
