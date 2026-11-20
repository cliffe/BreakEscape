# P6-B — Engagement report builder

Packet P6-B (IMPLEMENTATION_PLAN.md §4): report builder, design `10` N1/N2, `00` §11. Sonnet.
Not committed (orchestrator commits).

## What was built

The report builder minigame in `minigames/engagement-report/`, plus its stylesheet and a Node test.
It is display-only for the campaign results and interactive for the two report steps.

- **`report-model.js`** (pure, no DOM, no writes). `buildReportModel(social, globals, mailState)`:
  - **Mail** results from `mailState.metrics[targetId]` (`00` §10a): sent, failed, landed,
    firstTryLanded. Target names resolve from `phishTargets` → `mailClient.contacts` → `people`.
  - **Pages** from `se_landing_pages[pageId].victim` (`00` §11a), one line per `social.landingPages`
    entry: visited / submitted / noticed, with "no page sent" when the record carries no `victim`.
  - **Calls** from the pretext globals (`06` N8), one per `social.pretextNpcs` entry: `pretext_call_done`,
    the character's `<character>_reported`, and the latest call's `pretext_<callId>_outcome` / `_lowest`.
  - Completion follows the board's step-binding rule: the `results` step is done when every `confirm`
    item bound to it is pressed, the `findings` step when every finding bound to it has a correct root
    cause and control; a step's `onCompleteGlobal` is set when its items are done, the block's
    `onCompleteGlobal` (`report_filed`) when all steps are.
  - `readReportState` / `STATE_KEY`: `se_report_state` holds ids only — a `confirmed` list of confirm-item
    ids (an item's `id`, or its `step` when it has none) and a `findings` map of finding id → `{cause, control}`
    option ids. Anything else in the stored object is dropped.
- **`engagement-report-minigame.js`** extends `SocialOverlayScene` like the intel board. Rebuilds from the
  records on open (and re-applies a due step/block global that never landed, the board's reopen pattern);
  renders the results table, page and call panels, the "cannot see staff reports" line, the Confirm
  control, and the findings cards with a root-cause group and a control group each. A wrong pick shows its
  `why`; a blame option is flagged "Blaming staff" and shown why rather than failed (stage 6, Ch. 9); a
  finding locks only when both parts are correct. Writes `se_report_state` through `writeGlobal` and
  `stateSync.sync()` as the board does. Close/Esc are a normal exit (`complete(true)`), completion keys on
  the globals, not the completed event. All player-facing text is `textContent`.
- **`css/engagement-report-minigame.css`**: report surface, results table, findings cards, feedback
  colours (good / not-quite / blame), a narrow (<768px) layout and a reduced-motion rule. Source Sans 3
  via `--se-font-readable`.

## Files changed (all new, in scope)

- `public/break_escape/js/minigames/engagement-report/report-model.js`
- `public/break_escape/js/minigames/engagement-report/engagement-report-minigame.js`
- `public/break_escape/css/engagement-report-minigame.css`
- `test/js/social-engagement-report.test.mjs`
- `test/js/fixtures/social/engagement-report-social.json`

`git status --porcelain` for the scope shows only these five paths (all untracked). No shared file touched
(the wiring — registration, starter, interaction branch, CSS `<link>`, sprite, preload line, schema entry —
is P6-W).

## Tests

`bundle exec node --test test/js/social-engagement-report.test.mjs` — 15 tests, all pass. Covers:
mail results from `mailState.metrics` with resolved names and the first-send flag; the empty-mail panel;
the page line (submitted / below-threshold noticed) and "no page sent" with an empty and with an absent
record; the call line from the pretext globals; the unseen-reports note; the Confirm press setting
`report_results_done` and recording ids only; a wrong/blame pick showing its `why` and not locking;
a finding locking only when both parts are correct; full completion setting `report_filed` (steps first);
`se_report_state` holding ids only; a reopen re-applying globals that never landed; model purity; and
Close as a normal exit. The file is picked up by the `test:social` glob (`social-*.test.mjs`).

## Not done / blocked

- **Bridge gate.** The packet row ends "bridge gate after P6-T0 … report rows of
  `tools/playtest/se/bridge-6.jsonl` pass". `bridge-6.jsonl` does not exist yet (P6-T0 writes it after
  P6-W, and it runs against the lab scenario `scenarios/lab_social_engineering/`, which is still at the
  plan/review stage — only `PLAN.md` and `REVIEW_R*.md` are present). So the bridge rows could not be run.
  The minigame exposes the state the bridge will need via `getTestState().report` (steps, results,
  items, findings with `cause`/`control`/`done` and the picked `why`/`blame`).

## Decisions worth a flag

- `social.engagement.report.items` confirm entries carry no `id` in the authored fragment (`10` §5), so a
  confirm item's stored id is its `step`. If an author later adds two confirm items to one step, they need
  explicit `id`s; `confirmId()` prefers an authored `id` when present.
- The call panel is derived from `social.pretextNpcs` plus the naming conventions
  (`pretext_<callId>_outcome`/`_lowest`, `pretext_call_done`, `<character>_reported`), matching the lab's
  globals in `10` §"Global variables". No per-report call config is read, since the design names fixed
  globals; if a future scenario needs different call globals the block would want an explicit pointer.
- Target display names: `phishTargets[].name|displayName` is read if present, though the lab's targets
  carry none, so names resolve through the contact/person chain.
