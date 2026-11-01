# Launch owner calls

Items the owner left open for discussion rather than a build decision, written up so a
call can be made away from the session. One section per call: background, options, a
recommendation and the cost. Nothing here is built; these wait on the owner.

Compiled 2026-11-01 during the launch finishing pass. Sources: `DECISIONS_PENDING.md`
("Waiting on the user", "Open"), the owner's decisions board (2026-10-30) and the three
CyberAware forms (2026-10-31). Where a later form appears to have answered an earlier
board item, that is noted so the owner can confirm the reading.

---

## 1. The in-game "habit to keep" line on episodes that are not about phishing

**Background.** Every episode's debrief shows one set-wide rule of thumb under the heading
"The habit to keep" (`AWARENESS_RULE_OF_THUMB_TEXT` in `awareness_deploy.py`, rendered by
`debrief-view.js`):

> "When a message pressures you to move money, grant access, sign in or read back a code,
> stop and check it yourself through a route you already trust, not the link, number or
> page the message gives you. Taking a minute to confirm is always a fair thing to do."

That line is about messages, money and codes. It reads off-topic on the episodes whose
lesson is not a message: E15 (shadow IT), E17 (acceptable use) and E20 (remote and mobile
working), and to a lesser degree E11 (misdirected data) and E16 (insider risk). The owner's
board note asked: "Should the line be specific to groups of episodes?"

The 2026-10-31 Hacktivity setup form answered the *platform* habit line: one per CyberAware
course, not per episode group, set through a new `awareness_habit` course key, with each
scenario's own line as the fallback. That resolves the course-level line. It does not settle
the in-game debrief line, which is still the single money-and-codes constant on every episode.

**Options.**
- (a) Leave the single set-wide line on every episode. Simplest; the off-topic fit stays.
- (b) Keep the set-wide line as the constant, and add a short per-episode habit line beside
  it only on the episodes where the money-and-codes rule reads off-topic (E15, E17, E20, and
  review E11/E16). Per episode, not per group, which matches the owner's "not per group" pick
  for the course line.
- (c) A per-group line (one for access and physical, one for data handling, and so on).

**Recommendation.** (b). It fixes the off-topic fit on the three episodes that need it and
stays consistent with the owner's course-level decision to avoid grouping. The engine already
has a per-episode string slot pattern (a `strings.moduleLine`-style key was filed as an idea
during the build), so the set-wide line can stay as the shared constant with a per-episode
line layered on top.

**Cost.** Content only, small: author three to five short lines (one per affected episode) and
wire them through the existing debrief slot, or a one-line engine change if a new slot is
preferred. No audio: the debrief habit text is on-screen, not voiced. Half a day.

---

## 2. Renaming the `defend_pass` completion field to `_complete`

**Background.** The owner picked "rename to `_complete` everywhere" on the 2026-10-30 board,
and the 2026-10-31 Hacktivity setup form restated it ("`defend_pass` retired and `done`
renamed `complete`"), but added: "First discuss: why would this require code from Hacktivity?"

`defend_pass` is a completion field in the scoring and awareness-measure layer, not an in-game
global. (The in-game completion global is `episode_<id>_defend_done`, written once by
`role-swap.js`; the `defend_pass` name is the scoring/report field that reads off it.) The
field is written into the learner's saved game state and read by anything that reports
completion. Hacktivity needs its own code change **only if it reads the field by name**: the
external-client progress dashboard (`hacktivity.co.uk/hacktivities/153/progress`) and any
awareness score breakdown that names `defend_pass` would break on a silent rename.

**Options.**
- (a) Do not rename; keep `defend_pass`. Zero risk, but the name misleads facilitators (a
  5% round still shows `defend_pass` true under completion scoring, flagged in E10, E13, E17).
- (b) Rename to `_complete` as a coordinated change across Break Escape's scoring output and
  the Hacktivity reader in one go, after confirming exactly where Hacktivity reads it.

**Recommendation.** (b), but sequence it: first grep the Hacktivity repo for `defend_pass`
(and the progress dashboard code) to list every reader, then rename on both sides together so
no report reads a field that no longer exists. Within Break Escape the rename is low-risk and
mechanical once the readers are enumerated. This is a Hacktivity-touching change, so it needs
the owner's explicit go-ahead before any Hacktivity edit (standing rule).

**Cost.** Moderate. Break Escape side: a mechanical rename across the scoring layer plus a
migration-free check that no saved game is read by the old name. Hacktivity side: a small code
change wherever the field is read, plus the progress dashboard, which the setup form already
says must be updated in line with the scoring changes. Best done inside the scoring-rollout
work rather than on its own. One to two days with the Hacktivity change.

---

## 3. D9 accessibility: what the WCAG 2.2 AA commitment entails

**Background.** The owner recorded a pick (WCAG 2.2 AA for the episode runner's HTML views,
the check forms and the Hacktivity pages; the game accessibility guidelines for the 2D room;
an accessibility statement once a text route exists) and then asked: "Discuss: explain exactly
what this entails." The 2026-10-31 Hacktivity setup form then filed D9 as future work, "not
pursued until there is demand (hard to reach with the game-based approach)", and said the
statement is not published. So the decision is effectively "defer"; this note explains what
was deferred so the owner can confirm.

**What the commitment would entail, by surface.**
- HTML views (episode runner, debrief, check forms): keyboard operation of every control,
  visible focus, accessible names on report and verdict controls, colour contrast at 4.5:1,
  no colour-only cues, text alternatives for the item data, reduced-motion support. Much of
  this is already in as a first slice (keyboard play, accessible names, reduced motion,
  plain-text alternatives in item data).
- The 2D canvas room: this is the hard part. A Phaser canvas has no DOM for a screen reader,
  so WCAG AA there means a parallel text or list route to the same actions, or the "game
  accessibility guidelines" standard instead of strict WCAG. This is the work that is deferred.
- Hacktivity pages: standard web AA, owned on the Hacktivity side.
- An accessibility statement: only meaningful once a text route (BE-03) exists; without one
  the statement would have to admit the canvas is not reachable by screen reader.

**Options.** (a) Defer, keep the built first-slice baseline, revisit on demand (the
2026-10-31 position). (b) Commit to AA on the HTML surfaces now and publish a statement that
scopes out the canvas. (c) Full programme including a canvas text route.

**Recommendation.** (a), matching the 2026-10-31 decision, with one addition: keep and
maintain the HTML-surface baseline that is already built, so that if demand appears the
remaining gap is only the canvas route. Do not publish a statement until a text route exists.

**Cost.** (a) near zero (hold the baseline). (b) moderate: a formal audit of the HTML views
plus fixes, roughly a week. (c) large: a text/list route to the canvas actions and a
screen-reader pass, several weeks, and it reopens the "text route" question the owner already
flagged as possibly out of scope.

---

## 4. The pre-canned reporting-route option table (WP-02)

**Background.** The owner approved building the reporting route and asked for the pre-canned
option table to be drafted for approval first. The 2026-10-31 Hacktivity setup form records
"option table approved as drafted; the route is named in the Report verdict; one primary route
plus optional add-ons; vendor-neutral, organisers type the button name; organisers of the
organisation plus staff edit the default." If that table has already been drafted and approved
(it would live in the Hacktivity repo, `docs/awareness_course/reporting_route_wp02.md`), this
item is closed and only the build remains. If not, the candidate table below is the draft to
approve.

**Candidate option table (vendor-neutral, organiser picks one primary plus any add-ons; the
organiser types the exact button or channel name).**

| Option | Shown as (example) | When it fits |
|---|---|---|
| Report Phishing button in the mail client | "Use the Report Phishing button" | Microsoft 365 / Google Workspace with the add-in enabled |
| IT service desk by email | "Forward it to servicedesk@yourorg" | Most organisations |
| IT service desk by phone | "Call the service desk on <number>" | Where a call is the norm |
| Security team mailbox | "Email security@yourorg" | Where a dedicated security mailbox exists |
| Security channel | "Report it in the #security channel" | Teams/Slack-based teams |
| Intranet report form | "Use the report form on the intranet" | Where a form exists |
| Line manager | "Tell your line manager" | Smaller organisations with no central route |
| Other | organiser types the wording | Anything not listed |

One primary route is named in the Report verdict feedback; optional add-ons appear as "or".
Organisers of the organisation and staff can edit the default.

**Recommendation.** Confirm whether the Hacktivity-repo table is the approved one; if so, close
this and schedule the build (naming the route in the Report verdict). If the owner wants to
adjust the list, the table above is the starting point.

**Cost.** The table itself is drafted (above / in the Hacktivity repo), so near zero. The build
is Hacktivity work (the setting already exists at organisation, course and listing level; this
adds the pre-canned list and the Report-verdict wording) and needs the owner's go-ahead before
any Hacktivity edit. One to two days on the Hacktivity side.
