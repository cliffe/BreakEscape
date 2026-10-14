# Current state: Hacktivity

What Hacktivity already offers for running mandatory training for organisations, and what it lacks, as found in the code in October 2026. This is a feature-level summary to ground `features/hacktivity.md`; it deliberately leaves out implementation detail.

Key: **exists**, **partly**, **not found**.

## Users and identity

| Area | State | Notes |
|---|---|---|
| Sign-up and login | exists | Self-registration with email confirmation; strong password check |
| MFA for users | exists | Required at every login: emailed token or authenticator app |
| Roles | partly | Free user, paid seat holder, training staff, account manager, admin. No learner, line manager or auditor roles |
| Single sign-on (SAML, OIDC) | not found | An Azure AD OAuth link exists only to attach a university student id to an existing account |
| Bulk user import (CSV) | not found | Staff can paste a list of email addresses to invite people to an event |
| Provisioning (SCIM) and automatic leavers | not found | Removing a seat is manual |

## Organisations

| Area | State | Notes |
|---|---|---|
| Organisations | exists | Name, seats, subscription end date; an organisation page lists training staff, members and historical members |
| Departments, groups, cohorts | not found | Each event (a copy of a course) acts as a cohort. Teams exist but are site-wide and admin-managed |
| Who can manage whom | partly | Training staff and account managers see only their own organisation's members, and only on events they are enrolled in. They can't create events or mission listings |
| Tenant separation | partly | One shared database filtered by organisation. Some profile information is visible across organisations, which suits a public training community but not an employer's staff |
| Course templates | exists | "Pool" courses can be copied into an organisation's own course with a date offset |
| Seats and subscriptions | exists | Seats set by an admin or bought through Stripe; access is cut when a seat is removed |
| Branding per customer | not found | No organisation logo, colours, domain or email sender |

## Learning structures

| Area | State | Notes |
|---|---|---|
| Events and courses | exists | Event types: event, course, experience, pool (template), game |
| Content inside an event | partly | Two content types only: a VM lab and a Break Escape mission listing ("game slot"). No page, reading or policy content type |
| Ordering and release dates | exists | Manual position, release dates, a release calendar, shift dates |
| Enrolment | exists | Self sign-up when eligible, invitation, automatic on open events, or on starting a mission |
| Prerequisites | not found | Some `mission.json` files declare them; nothing reads them |
| Due dates | partly | Labs have end times and late penalties. Missions have no due date. Nothing relative to a person (such as "within 30 days of joining") and no annual recertification |

## Break Escape integration

| Area | State | Notes |
|---|---|---|
| Mission catalogue | exists | Missions are read from each scenario's `mission.json` |
| Mission listings | exists | Position, release date, weight, scoreboard, brief, lab sheet URL, optional VM lab. Admin-only to create |
| Launch and resume | exists | Starting a mission resumes the active game or creates a new one, enrols the user, and opens the game |
| What comes back | partly | Status (in progress, completed, abandoned), a score out of 100 (70% tasks, 30% aims), task and aim counts, start and completion times, flags. Updates are pushed live |
| Decisions and choices | partly | The game's saved state holds the player's story globals and task history, but Hacktivity never reads or shows them |
| Time on task | not found | Only start, end and last-update times |
| Lab Sheet and Walkthrough labels | exists | The listing shows "Walkthrough" in game events and "Lab Sheet" elsewhere, loaded into an iframe on the listing page |
| `mission.json` fields used | partly | Display name, description, difficulty, SecGen scenario, collection, CyBOK, lab sheet URL. Ignored: estimated duration, prerequisites, facilitator notes, learning objectives, branches |

## Assessment and records

| Area | State | Notes |
|---|---|---|
| Scoring and scoreboards | exists | Mission and lab scores, weighted event totals, optional scoreboards |
| Quizzes and question banks | not found | Nowhere: not in Hacktivity, the game or the lab sheets |
| Completion records | exists | Mission status and conclusion time; lab flag completion dates |
| Progress tracking | exists | A staff progress page per event with per-person, per-item progress, inactivity flags and CSV export |
| Attempts | exists | Several games per listing; the best counts |
| Certificates | not found | A results page can be printed from the browser |
| Badges | partly | Profile badges for completed labs; weekly streaks; CyBOK charts |
| Feedback | exists | A 1 to 5 rating and comments after a mission or lab, visible to admins |

## Reporting

| Area | State | Notes |
|---|---|---|
| Per-event progress dashboard | exists | Accessible design: screen reader labels, focus handling, AA contrast, reduced motion |
| CSV export | exists | Progress percentages and scores per person; no completion dates or status |
| PDF export | not found | |
| Organisation-wide, department or manager views | not found | |
| Overdue or compliance-status reports, scheduled reports | not found | |

## Communications

| Area | State | Notes |
|---|---|---|
| Email | exists | Account emails, login tokens, event invitations, announcements, newsletters, a short onboarding sequence |
| Announcements | exists | Admin only; to an event's participants or a segment; optional banner |
| Reminders for due or overdue training | not found | Inactivity reminders exist only for individual subscribers |
| Messaging a cohort from inside the app | not found | A mailto link only |
| Slack or Teams | not found | Discord links only |

## Standards and integrations

| Area | State |
|---|---|
| LTI, SCORM, xAPI, cmi5 | not found |
| Public API with keys | not found |
| Outgoing webhooks | not found |

## Content

| Area | State | Notes |
|---|---|---|
| Embedded video | exists | YouTube links attached to labs or missions; watching is not tracked |
| Policy content for a customer | not found | |
| Acknowledgements and sign-offs | not found | Not even for Hacktivity's own terms |

## Accessibility and localisation

| Area | State | Notes |
|---|---|---|
| Localisation | not found | English only; text written into templates |
| Accessibility | partly | The progress page is well built; elsewhere a few attributes and a light and dark theme; no accessibility statement |

## Data protection

| Area | State | Notes |
|---|---|---|
| Retention schedule in code | not found | |
| Deletion | partly | Admin only; doesn't yet cover every related record |
| Export of a person's data | not found | |
| Audit log | not found | |

## What this means for the course

Hacktivity already has the bones: organisations with seats, courses as templates that can be copied per organisation, mission listings with release dates, progress tracking with CSV export, mandatory MFA, Stripe billing and email. The gaps that matter most for selling mandatory training are:

1. **Assignment and due dates per person**, including on joining and every 12 months (HA-03), with **reminders** (HA-04).
2. **Departments and manager views** (HA-01, HA-09).
3. **Knowledge checks** (MG-20, HA-08) and **certificates** (HA-06).
4. **Policy acknowledgement** (HA-07).
5. **Audit-ready records**: dates, versions, time on task, decisions per outcome, exports (HA-05, HA-19).
6. **Single sign-on and provisioning** for anything beyond a pilot (HA-02).
7. **LMS interoperability** for customers who already have an LMS (HA-10).
8. **Per-customer branding and content** (HA-11).
9. **Data protection features** expected of a processor holding staff training records (HA-15).
