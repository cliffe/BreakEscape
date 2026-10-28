# WP-02: the customer reporting route in Hacktivity (pre-canned options)

Status: the user said **Go now** for WP-02 on 2026-10-27 (`../DECISIONS_PENDING.md`, row "WP-02 Customer reporting route in Hacktivity": "A list of pre-canned options seems useful"). This brief is the implementation plan.

**Update 2026-10-28.** Hacktivity main now has the free-text version of this feature: awareness settings (reporting route, rule of thumb, team size) at organisation, course and listing level, resolved on each Break Escape play page, copied with a course only when the organiser chooses, plus the two seeded awareness courses. What remains is the pre-canned option list (steps 2 onward) on top of the built settings. It covers both repositories, but this file is public, so Hacktivity is described at feature level only.

## Goal

An organiser sets, once per course, how their staff should report a suspicious message. Hacktivity staff set an organisation default that every course in that organisation uses unless the course sets its own. The organiser builds the route from a short list of pre-canned options, each with a few blanks to fill in (an address, a phone number, the name of a button), and can add a line of free text. Every awareness episode's debrief then shows that route in its "How to report here" box, under the "On Monday" card, in place of the generic "find out how" line.

The Break Escape engine side is already built and tested (aw1). This package is almost entirely Hacktivity work, plus one Break Escape test and one paragraph of Break Escape docs.

## Read first

Break Escape (code level, all paths under `/home/user/BreakEscape`):

- `planning_notes/phishing_and_social_engineering/FUN_DECISIONS.md`: `aw1` ("Render the customer's reporting route in the debrief", Do it) and `route_config` ("Hacktivity setting, concrete Hacktivity change to be confirmed with the user before editing").
- `lib/break_escape.rb`: `Configuration#awareness_settings`, the host hook. Contract (from the comment in `initialize`): a callable `->(game) -> Hash or nil` returning `{ report_heading:, report_text:, rule_of_thumb:, team_size: }`, any of which may be nil or blank. It is resolved live on each play page load.
- `app/helpers/break_escape/application_helper.rb`: `break_escape_awareness_config(game)`, `be_plain(value, max)`, `AWARENESS_TEXT_MAX = 600`, `AWARENESS_HEADING_MAX = 80`, `AWARENESS_INVISIBLE`. The engine whitelists keys, folds CRLF to LF, turns tabs into spaces, strips control, zero-width and bidi characters, trims and caps. A heading with no text is dropped. A hook that raises is logged and the key left out.
- `app/views/break_escape/games/show.html.erb` (around lines 216 and 239): `awareness: <%= raw json_escape(_awareness.to_json) %>` inside `window.breakEscapeConfig`, only when the hash is present.
- `public/break_escape/js/minigames/episode-runner/episode-model.js`: `GENERIC_REPORT_ROUTE`, `REPORT_ROUTE_SLOT` (`'slot:customer_report_route'`), `awarenessSettings(social, config)` (host wins key by key over `social.awareness`; text trimmed and capped at 600) and `reportRouteFor(episode, social, config)`.
- `public/break_escape/js/minigames/episode-runner/debrief-view.js`: `textBox()` (around line 279) splits the text on blank lines into one `<p>` per paragraph, all by `textContent`; `renderDebrief()` draws `.aw-report-route` directly after `.aw-monday` (around line 370).
- `public/break_escape/js/minigames/episode-runner/episode-runner-minigame.js` `_renderDebrief()` (around line 507): reads `window.breakEscapeConfig` and passes `reportRoute: reportRouteFor(...)`.
- Tests that already cover the engine: `test/controllers/break_escape/awareness_config_test.rb` (hook, whitelist, `</script>` escaping, caps, a raising hook) and `test/js/social-fun-engine.test.mjs` (the aw1 tests: generic line, scenario route, host route wins, debrief box as plain text).
- `README_scenario_design.md` around line 3089: the paragraph that documents `config.awareness_settings`.

Hacktivity (feature level here; read the code yourself):

- Read the Hacktivity code directly, in a session that has the Hacktivity repository in scope. Find out for yourself how courses and organisations store their settings, how the course edit form and the organisation edit form work and who may use each, how a course is copied, how Hacktivity configures the Break Escape engine at boot, and how a game started from a course listing knows its course. This brief does not record those details, and must not: any code-level notes you want to keep go in the Hacktivity repository, not in this one.

## Depends on

- Nothing new in Break Escape. The hook, the helper, the view and the client reader are built (aw1).
- The user's go-ahead for the Hacktivity change: given ("Go now"), with one condition below (the option list is confirmed with the user before merging).

## Owner model

- Hacktivity implementation (settings store, forms, resolution hook, copy rule, seeding, tests): **general-purpose or Sonnet**, as engine work in `AGENTS.md`.
- The option wording below is learner-facing awareness text. If the user changes it, or you have to change it, have the **`opus48`** agent type review the wording against the no-blame and plain-English rules before it goes to the user.

## Where the work is committed

- **No Hacktivity change is made without the user's go-ahead.** The user has given it for this feature. The implementer still **confirms the option list (ids, labels, sentences and blanks in the table below) with the user before merging**, and does not merge until the user says yes.
- The Hacktivity work is committed in the **Hacktivity repository**. The session that wrote this brief cannot push there. So either:
  - work in a session that has the Hacktivity repository in scope, and commit there; or
  - work on a local checkout and hand the user a patch (a `git format-patch` series or a single diff) to apply.
- Break Escape changes (one test, one docs paragraph) are committed in Break Escape by the orchestrator, as usual. Writers and implementers never run git in this repository unless the orchestrator says so.

## The design

### What the organiser sets

Each course and each organisation has one reporting-route setting with four parts:

1. **Heading** (optional, plain text, at most 80 characters). Blank means the debrief uses "How to report here".
2. **Options**: up to four pre-canned options from the catalogue below, in the order the organiser chooses. Each option may have blanks (placeholders) the organiser fills in.
3. **Anything else** (optional, plain text, at most 600 characters): the existing plain-text fallback. With no options chosen, this alone is the route, exactly as the earlier free-text design.
4. Nothing else. `rule_of_thumb` and `team_size` are separate keys of the same hook and are not part of WP-02. If your checkout already sets them (step 1), leave them working as they are.

The setting stores the option **ids** and the **placeholder values**, not the finished sentences. The sentence is composed when the play page loads. So a wording fix in the catalogue reaches every course at once. Changing what an option **means** needs a new id, never an edited sentence under the old id.

### The option catalogue (draft; confirm with the user before merging)

Placeholders are written `{name}`. "Kind" sets the validation (next section). "Default" is used when the organiser leaves an optional blank empty.

| Id | Organiser's label | Sentence | Placeholders |
|---|---|---|---|
| `report_button` | Use the Report button in your mail app | Use the {button_name} button in {mail_app} to report it. | `button_name`: short text, optional, default "Report". `mail_app`: short text, optional, default "your mail app" |
| `forward_and_delete` | Forward it to an address, then delete it | Forward it to {address}, then delete it. | `address`: email address, required |
| `call_service_desk` | Call the service desk on a number | Call {desk_name} on {phone}. | `desk_name`: short text, optional, default "the service desk". `phone`: phone number, required |
| `log_with_desk` | Log it with the service desk (portal or ticket) | Log it with {desk_name} at {portal}. | `desk_name`: short text, optional, default "the service desk". `portal`: short text, required (shown as text, never as a link) |
| `calls_and_texts` | Where to report suspicious calls and texts | Report suspicious calls and text messages to {contact}. | `contact`: short text, required (a team, a number or an address) |
| `tell_manager` | Tell your manager | Tell your manager straight away. | none |
| `already_clicked` | What to do if someone has already clicked | If you have already clicked a link, opened a file or typed in a password, contact {urgent_contact} straight away, even if you are not sure. | `urgent_contact`: short text, required |

Notes for the user when confirming:

- The first four labels follow the user's own examples ("Use the Report button in your mail app", "Forward it to [address] and delete it", "Call the service desk on [number]", "Tell your manager"). The last three are suggestions: the generic line already says "emails, calls and texts", and the "already clicked" line gives the no-blame route for the case the episodes teach hardest.
- Wording rules for any change: UK spelling, plain English, second person, one sentence, no blame, no effectiveness claims, no em or en dashes, and no real product or brand names in the defaults.

### Composing the text

For a given level (course or organisation):

1. Take the chosen option ids in order. Skip any id the catalogue no longer has (log it at warn level, naming the id, never the values).
2. For each option, fill its template in **one pass over the template**: replace each `{name}` token with the cleaned value, or the default when the blank is optional and empty. Values are never themselves scanned for tokens, so a value containing `{address}` stays literal.
3. Join the sentences with a blank line (`"\n\n"`), then append the "Anything else" text as the last paragraph if it is not blank. The debrief's `textBox()` splits on blank lines, so each option is its own paragraph.
4. The result is the `report_text`. The heading is the `report_heading`.
5. If there are no options and no free text, the level is **unset** and resolution moves to the next level.

The composed text must fit in 600 characters **after** line breaks are folded to LF (the engine counts the same way). The form shows the remaining budget and refuses to save a setting that would compose to more than 600, with a message saying how many characters to cut. The engine's 600 cap is a backstop, not the plan: never rely on it to truncate mid-sentence.

### Validation and escaping

The route is **plain text, never HTML**, at every step.

- **On save (Hacktivity):**
  - Fold CRLF and CR to LF before any length check (review m2), then trim.
  - Strip control characters (keeping LF in the two free-text fields only), and zero-width and bidi characters (the same set as the engine's `AWARENESS_INVISIBLE`, review m3).
  - Placeholder values are single-line. Reject a line break, and reject `{` and `}` in a value.
  - Kinds:
    - *email address*: one address, no spaces, a simple `local@domain.tld` shape, at most 120 characters. Do not try to verify that it exists.
    - *phone number*: digits, spaces and `+ ( ) - .`, an optional trailing "ext" and digits, between 3 and 30 characters, at least 3 digits. Internal short numbers such as "4000" are valid.
    - *short text*: at most 60 characters (120 for `portal`).
  - A required placeholder that is empty is an error that names the option ("Forward it to an address: the address is missing").
  - Reject an option id that is not in the catalogue, and the same id chosen twice. At most four options.
  - Heading at most 80 characters, "Anything else" at most 600, the composed text at most 600.
  - Blank values are stored as absent, so "unset" is unambiguous.
- **On the edit forms:** use the framework's escaping form helpers for every value, including any stored value echoed back into an input. Any live preview or character counter in the browser writes with `textContent`, never `innerHTML`. Values are never turned into links: an address or portal is text the learner reads.
- **On the way to the game:** Hacktivity's hook returns only `report_heading` and `report_text` (plus whatever it already returns for `rule_of_thumb` and `team_size`). The engine helper then whitelists and cleans again, and the view serialises with `raw json_escape(... .to_json)`. Do not build the composed text into a JavaScript string by hand anywhere in Hacktivity.
- **In the game:** `debrief-view.js` uses `textContent` only. Nothing to change.

### Resolution order

First level that composes non-blank text wins. Heading and text always come from the **same** level.

1. **The course** the game was started from (through its listing).
2. **The course's organisation** (the organisation default).
3. **Nothing.** The hook returns nil for the route keys. Break Escape then falls back, client side, to the scenario's own `social.awareness.reportRoute` (no built awareness scenario sets one today), and then to `GENERIC_REPORT_ROUTE`, which shows only when the episode's `debrief.mondayCard` is `slot:customer_report_route` (every built full and defend-only awareness episode, and each new E8+ episode, which keeps the slot; for example `scenarios/awareness_e1_invoice_fraud/scenario.json.erb` `debrief.mondayCard`).

Rules:

- **Never the player's own organisation.** The route follows the course being played. A learner from organisation A playing organisation B's course sees B's route; a learner on a course with no organisation gets the generic line.
- A game with no listing (started directly in the engine, or an older game) gets nothing.
- Resolve from the game being shown only: no global, no per-thread or per-class cache, no "first organisation" guess.
- If your checkout already has a per-listing override from the earlier pass, it may stay, ranked above the course. Do not add one fresh: the user asked for per course with an organisation default.

### Who edits

- **Course setting:** whoever may already edit that course today, organisers included, through the existing course edit form. Add the fields to both the staff and the organiser paths of that form, and nothing else.
- **Organisation default:** Hacktivity staff admins only, through the existing organisation form. Do not widen who may edit an organisation.
- On the course form, show organisers, read only, what their course currently resolves to ("Using your organisation's default: ..." or "Using the generic line: ..."), so a blank course setting is not a mystery. Word the hint so it does not send organisers to a page they cannot edit (review m5): "Leave blank to use your organisation's default, set by Hacktivity staff."

### Copying a course

- A copy into the **same** organisation (both courses have the same, non-empty organisation) carries the course's reporting-route setting unchanged.
- Any other copy (into a different organisation, from or into a course with no organisation) **starts with the setting empty**, so the new course falls through to its own organisation's default (review M1). This applies to every awareness setting the copy carries, not only the route.
- The organisation default is never copied: organisations are not copied.
- The copy form says, in one line, whether the route comes along.

### What the debrief shows

Unchanged engine behaviour, now fed by the composed text:

- An `aside.aw-report-route` directly after `aside.aw-monday`, with `aria-label` "How to report here".
- An `h3.aw-report-route-heading`: the organiser's heading, or "How to report here".
- One `p.aw-report-route-text` per option sentence, then one for "Anything else", in order.
- `data-configured="true"`, and `getState().reportRoute === 'configured'`.
- With nothing set: the generic text, `data-configured="false"`, `getState().reportRoute === 'generic'`.
- It shows in every awareness episode's debrief, full and defend-only. The pre and post checks (`scenarios/awareness_pre_*`, `awareness_post_*`) have only the `check` stage and no debrief, so they show nothing; that is expected.
- An edit applies on the learner's next page load. A tab already open keeps the old text.

Worked example. Options `report_button` (defaults) and `call_service_desk` (`phone` "0161 496 0000"), free text "Do not reply to the sender.", no heading. The hook returns:

```ruby
{ report_heading: nil,
  report_text: "Use the Report button in your mail app to report it.\n\n" \
               "Call the service desk on 0161 496 0000.\n\n" \
               "Do not reply to the sender." }
```

and the debrief shows the heading "How to report here" over three paragraphs. (0161 496 is an Ofcom drama range.)

## Files to create or change

Break Escape (`/home/user/BreakEscape`):

- `test/js/social-fun-engine.test.mjs`: one new aw1 test (step 8).
- `README_scenario_design.md`, the `config.awareness_settings` paragraph around line 3089: one or two sentences (step 9).
- Nothing else. Do not change the hook contract, the helper, the view or the client reader.

Hacktivity: the files you find in step 1. Do not record their paths in this repository.

## Steps

1. **Survey Hacktivity.** In a session with Hacktivity in scope, read how the built awareness settings are stored and edited at organisation, course and listing level, how a course copy carries them, how the Break Escape hook is configured, and how a game finds its course.
   - Build on it: replace its free-text-only route with the options design here, keeping free text as "Anything else". Keep any existing stored free text working: a stored route with no options is just "Anything else".
   - Find how the two seeded awareness courses (the defend-only course and the both-versions course; `../phishing_and_social_engineering/awareness/HANDOVER.md` row "Fun changes") were created, for step 7.
2. **Catalogue.** Add the option catalogue as one frozen constant in Hacktivity: id, organiser label, sentence template, and for each placeholder its name, kind, required flag and default. One place only; the form, the validation and the composer all read it.
3. **Storage and validation.** Store heading, ordered option ids with their placeholder values, and "Anything else" for courses and organisations. Validate and normalise on save as in "Validation and escaping". Unknown or removed ids in old data are skipped at compose time, not an error on load.
4. **Composer.** One method that turns a stored setting into `{ report_heading:, report_text: }` or nil, as in "Composing the text".
5. **Resolution hook.** In Hacktivity's Break Escape configuration, set (or extend) `config.awareness_settings` to return the first non-nil composed route in the order course, then course's organisation. Return nil route keys otherwise. Never read the player's organisation. Keep whatever the hook already returns for `rule_of_thumb` and `team_size`.
6. **Forms and copy.**
   - Course form (staff and organiser paths) and organisation form (staff only): heading, up to four option rows (choose an option, then its blanks appear with the defaults as placeholders), "Anything else", a live character budget, and a read-only "currently resolves to" line on the course form.
   - It must work without JavaScript: with scripting off, show all seven options as checkboxes with their blanks and an order number.
   - Copy: same-organisation copies carry the setting; all others start empty.
7. **Seeded courses.** Give both seeded awareness courses this default, set wherever they are seeded, only if their setting is blank (never overwrite an organiser's edit):
   - heading blank;
   - options `report_button` (defaults: "Use the Report button in your mail app to report it.") then `tell_manager`;
   - "Anything else": "If you are not sure which route your organisation uses, ask your IT or security team today."
   
   This composes to about 180 characters. These courses have no customer, so the default names no address or number; it still gives a learner a concrete first action. A customer who copies a seeded course into their own organisation gets an empty course setting (copy rule) and so their organisation's default. For an environment where the seeded courses already exist, add an idempotent one-off task that fills a blank setting only, and run it in production only after the user says so.

   This step only sets the **reporting-route default** on the two seeded courses. It does not add episodes to them: course membership (which episodes a course lists, including each new E8+ episode) is seeded separately, following `01_PIPELINE.md` P12, at feature level. The two are independent and can run in either order; a route default set here applies to whatever episodes the course lists now or gains later through P12, because every awareness episode keeps the `slot:customer_report_route` Monday card. Do not use `awareness_deploy.py` for either job (it holds only the shared rule of thumb), and do not record Hacktivity internals here.
8. **Break Escape test.** In `test/js/social-fun-engine.test.mjs`, next to "aw1: the debrief draws the route box under the Monday card, as plain text", add a test that a host route `{ heading: '', text: 'Use the Report button in your mail app to report it.\n\nCall the service desk on 4000.\n\nDo not reply.' }` passed through `M.reportRouteFor(slotEpisode, {}, { awareness: { reportRoute: ... } })` and `renderDebrief` draws three `.aw-report-route-text` paragraphs in that order, the heading "How to report here" and `dataset.configured === 'true'`. Use the existing `host()` and `set()` helpers in that file.
9. **Break Escape docs.** In `README_scenario_design.md`, after the sentence about `config.awareness_settings`, add: a blank line in `report_text` starts a new paragraph in the debrief's "How to report here" box; a host may compose the text from its own options, but the engine sees only the two strings.
10. **Confirm with the user.** Send the user the option table (ids, labels, sentences, blanks, defaults) and the seeded default, as they will appear in Hacktivity. Merge only after the user says yes. Record the answer in `../DECISIONS_PENDING.md` (the WP-02 row) and `../phishing_and_social_engineering/awareness/HANDOVER.md` §5.
11. **Hand over.** Commit in Hacktivity from a session that has it in scope, or give the user a patch. Tell the orchestrator which, so the Break Escape commit (steps 8 and 9) can reference it.

## Tests

Hacktivity (write them in Hacktivity; no paths here):

- **Composer unit tests:** each of the seven options with all blanks filled and with optional blanks empty (defaults used); order kept; blank-line joins; "Anything else" last; free text alone; no options and no text gives nil; an unknown id is skipped; a value containing `{address}` stays literal; heading passed through.
- **Validation unit tests:** each kind (good and bad email, phone with "ext", short number "4000", a phone with letters); required blank names the option; a line break or brace in a value is refused; five options refused; duplicate id refused; CRLF counted once (a 600-character text with blank lines saves, review m2); zero-width and bidi characters stripped (review m3); composed text over 600 refused with the cut-by count; blanks stored as absent.
- **Resolution tests:** course wins over organisation; organisation used when the course is unset; heading and text never mixed across levels; nil for a game with no listing and for a course with no organisation and no setting; a player from organisation B playing organisation A's course sees A's route and never B's (review m1); two organisations, two courses, no leakage either way.
- **Authorisation and form tests:** an organiser can set the route on their own course and cannot on another organisation's course; an organiser cannot set the organisation default; a staff admin can set both; a hostile stored value (`"><script>x</script>`) renders back into the edit form escaped, with no extra `script` element (review m4); the form works with scripting off.
- **Copy tests:** same-organisation copy keeps the setting; a staff copy into another organisation starts empty; an organiser's copy of a course with no organisation starts empty (review M1).
- **End to end:** start an awareness episode from a course listing and find the composed route in the play page's `breakEscapeConfig.awareness.reportRoute`, with a `</script>` in a value serialised as `<\/script>` (the forward slash escaped by `json_escape`, so it cannot close the inline script).
- **Seeding:** the seed sets the default on both courses when blank, and leaves an edited setting alone; running it twice changes nothing.

Break Escape:

- `bin/test-js test/js/social-fun-engine.test.mjs`: all pass, including the new paragraph test.
- `npm run test:social`: all pass.
- `bin/rails test test/controllers/break_escape/awareness_config_test.rb`: 0 failures (unchanged; it already proves the hook, whitelist, caps and escaping).

## Acceptance checks

- In a Hacktivity development instance: set a course route from two options and free text; play `awareness_e1_invoice_fraud` and `awareness_e1_invoice_fraud_defend` from that course to the debrief; the "How to report here" box under the "On Monday" card shows the three paragraphs and no generic line. Clear the course route with an organisation default set: the organisation default shows after a reload. Clear both: the generic "Find out today how your organisation wants..." line shows.
- Play the same episode in standalone Break Escape: unchanged (generic line).
- The Hacktivity test suite passes, with the new tests.
- The Break Escape commands under "Tests" pass.
- The user has confirmed the option list, and the confirmation is recorded (step 10).
- Nothing in this repository names a Hacktivity file path, model, column, route, endpoint or credential as a result of this work.

## Do not

- Do not edit Hacktivity before reading its code, and do not merge before the user confirms the option list.
- Do not record Hacktivity file paths, model or column names, routes, endpoints, credentials, or any weakness you notice, in this repository (briefs, logs, commit messages, test names, comments). Code-level notes go in the Hacktivity repository; anything sensitive goes to the orchestrator or the user directly.
- Do not change the Break Escape hook contract, `break_escape_awareness_config`, `be_plain`, the view, `episode-model.js` or `debrief-view.js`.
- Do not render the route as HTML, autolink it, or build it into a JavaScript string by hand.
- Do not resolve from the player's organisation, a global, or a cache.
- Do not widen who may edit an organisation.
- Do not add `reportRoute` to any scenario's `social.awareness`, and do not touch `awareness_deploy.py` or the shell generators.
- Do not run a generator into the repo. Never `git stash`. No attribution lines in commits.

## Stop and ask if

- The built awareness settings differ from this brief in a way that changes the design (for example, it resolves from the player's organisation).
- Hacktivity has no clean way to tell a game's course, or the course's organisation, from the game being shown.
- The seeded awareness courses cannot be found, or are not seeded in code.
- The user wants an option that needs a link, an image or formatting (that would be an engine change, not this package).
- You notice a privacy or security weakness in Hacktivity: report it to the orchestrator or the user, not in this repository.
