# P6-M: live red-flag meter + mail UI debt from Phase 1

Packet P6-M (opus48). Carried the live red-flag meter and the Phase 1 mail UI
deferrals listed in `build_log/P1-T2_review.md` (fix round 2) and the
orchestrator's screenshot check. The A1 next-step cues are explicitly out of
this packet (they belong to the lab's own design). No commit.

## What changed

### 1. Live red-flag meter while composing (`01`, `04`; on for Hampshire, off for Pierce/Lord)

`minigames/mail-client/mail-composer.js`
- The composer takes two new opts: `meterDefault` (= `mailClient.showRedFlagMeter`)
  and `evaluate` (the shell's bias-aware live judge). The meter shows for a target
  when `target.redFlagMeter` is a boolean, else `meterDefault` (`_meterOn`).
- `_liveResult()` judges the current draft: the shell's `evaluate` when given
  (so `boostIfGlobal`/`strictIfGlobal` apply), else `evaluateMessage` from
  phish-rules directly, so the composer still works standalone (tests).
- `_meterData()` collects the draft's red flags: the open-check line when it would
  not be opened, plus every failed factor's `redFlag` string (required and
  advisory), de-duped — the same `redFlags` definition as `00` §2/§13 and the
  §3 gameResult transform. It never names a fact the player has not found.
- `_renderMeter()` draws `.mail-redflag-meter`: a `role=status` `aria-live=polite`
  side panel with a "Red flags" header, a count badge, a cross-marked list, or a
  tick + "No red flags right now — this reads clean so far." when the count is 0.
  Mounted after Attach, before the send bar. The meter is in `getState()` too.

`minigames/mail-client/mail-client-minigame.js`
- `openCompose` passes `meterDefault: config.showRedFlagMeter === true` and
  `evaluate: (m) => this._liveJudge(m)`.
- `_liveJudge(message)` judges the live draft with the same bias (`applyFactorBias`)
  and ctx (`accounts`, `people`, `templates`, `payloadKit`, `priorFailures`) the
  send path uses, but with no side effects.

`css/mail-client-minigame.css` — the `.mail-redflag-meter` styles (red left edge
and count for flags; green when the count is 0).

The slice already ships the per-target flags (`hampshire.redFlagMeter: true`,
`teague.redFlagMeter: false`, `mailClient.showRedFlagMeter: true`), so no scenario
edit was needed. The meter includes advisory factors, so the slice's Hampshire
keeps the "Unexpected urgency…" tell even on a landing draft (her only ask template,
`ask_review_cv`, is `urgency: medium` against her `advisoryMax: low`). That is a
deliberate teaching cue, not a bug; the fully-clean (0-flag) state is covered by the
composer test against the Hampshire fixture whose ask does not overshoot.

### 2. A4: template selects show the filled sentence, not raw `{placeholders}`

`minigames/mail-client/mail-composer.js` — `_fillPreview(tpl)` renders a template's
text with its blanks resolved: a chosen blank reads as its evidence label, an
unfilled blank as its slot label in brackets (`[name to greet them by]`, never a
value the player has not found), and `{account_name}`/`{account_address}` as the
sending account. Used for the part-select options (`_renderPartSelect`) and the
fixed single-option wording (`_renderBody`). No raw braces reach the screen.

### 3. A2: influence change reasons read in words, not factor ids

`ui/influence-bar.js` — a `REASON_WORDS` map turns the canonical judge factor ids
into plain words in the "Last change" line (`senderTrust` → "sender trust",
`attachmentPlausible` → "the attachment", …). A reason that is not a factor id (a
phrase the ink already wrote, e.g. "missing attachment") passes through unchanged.
Bar tests and `bridge-1b.jsonl` K4 updated to expect "+10 sender trust".

### 4. Toolbar labels Contacts and Close no longer clip at 1400 px

`css/mail-client-minigame.css` — the toolbar buttons, the folders group, the
actions group and the Close control are now `flex: none` with `white-space: nowrap`,
so they keep their whole label; only the account label (min-width 0, ellipsis) gives
way when the row is tight. Screenshot at 1400 px: Contacts, Compose and Close all
`scrollWidth == clientWidth` (unclipped) and the toolbar does not overflow.

### 5. T2-6: the withReply teaching checklist survives a reload

`minigames/mail-client/mail-bridge.js`
- `performSend` stores the composed `message` on the Sent record as
  `record.pendingMessage` in withReply mode (alongside the transient `judgePending`),
  so the checklist can be rebuilt after a reload drops the in-memory hold.
- `rejudgeForChecklist(scene, record)` re-judges `record.pendingMessage` with the
  live globals and returns a sendInfo-shaped object — purely to render the checklist,
  nothing counted, recorded or scheduled.
- `resolveClaimedFrom` extracted and shared by the send path and the rebuild.

`minigames/mail-client/mail-client-minigame.js` — `_onJobDone` now, when the
in-memory hold is gone but the record kept its `pendingMessage` and the timing is
withReply, rebuilds the checklist via `rejudgeForChecklist` and clears the field.
The held path also clears `pendingMessage` once shown.

Persistence of `pendingMessage`:
- `systems/mail-scheduler.js`: `pendingMessage` added to `MAIL_MESSAGE_FIELDS` (the
  client-side record whitelist), so `addMessage` keeps it.
- `app/models/break_escape/game.rb`: `pendingMessage` added to `MAIL_MESSAGE_KEYS`
  (the server sanitiser whitelist); it is sanitised with the generic
  `sanitize_mail_json` (depth/entry capped). `judgePending` is deliberately **not**
  whitelisted on either side — the job queue is the truth for "verdict pending", so
  only `pendingMessage` (what the rebuild needs) persists.

## Tests

New/updated:
- `test/js/social-mail-composer.test.mjs` (+3): A4 filled-sentence selects; the
  meter lists a draft's red flags and clears them; the meter is off when neither the
  target nor the default turns it on, and the per-target flag overrides the default.
- `test/js/social-mail-bridge.test.mjs` (+2): withReply holds the verdict until the
  job runs then shows it; withReply + reload rebuilds the checklist from the
  persisted `pendingMessage`.
- `test/js/social-mail-narrow.test.mjs`: the existing "verdict hidden after a reload"
  test (which encoded the T2-6 deferral) now asserts the checklist is rebuilt.
- `test/js/social-influence-bar.test.mjs`: A2 "sender trust" wording.
- `test/models/break_escape/mail_state_test.rb` (+1): a withReply record keeps
  `pendingMessage` but drops `judgePending`.
- `tools/playtest/se/bridge-1b.jsonl`: K4 regex "+10 sender trust".

Results:
- `bundle exec node --test` over the mail/influence scope (composer, bridge,
  client-shell, narrow, accounts, scheduler, state-export, influence-bar, runner):
  **132/132 pass**.
- Full `test/js/*.test.mjs`: 1471/1477. The 6 failures are **not** from this packet:
  `engine-fixes-pass3`, `engine-fixes-round4`, `social-mail-runner` and
  `event-mapping-unlock-door` are the known Node-18 full-run structured-clone flaky
  (all pass alone; the first two are the named CI quarantine); `finale-voiced-calls`
  (1/16) is an m09/m10 finale voice test outside this scope and untouched here;
  `validator-social-triage` R0 was a transient while another session was mid-edit on
  the slice (a `lord` target added before its readiness slot) and now passes.
- `bin/rails test`: **723 runs, 0 failures, 1 skip** (pre-existing skip).
- Slice validator `ruby scripts/validate_scenario.rb
  scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink`:
  **exit 0** (and plain `--strict-social` exit 0).

## Screenshots (1400x1000, keyless :3001, slice game 2971)

Under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P6-M/shots/`:
- `p6m-toolbar-1400.png` — Contacts, Compose, Close all unclipped at 1400 px.
- `p6m-meter-flags.png` — Hampshire, wrong pretext + no attachment: 3 red flags
  listed with cross marks and the count badge.
- `p6m-meter-clean.png` — right pretext + CV: the count drops to 1 (the residual
  advisory urgency tell on her ask template); the message lands.
- `p6m-a4-teague.png` — Teague composer: "Here is [which file] you wanted [when they
  asked for it]." and "Hi [name to greet them by]," with no raw braces; the meter is
  off for Teague (per-target off confirmed).

All four looked at by me; they match the intended behaviour.

## Notes for the orchestrator

- **Shared-tree breakage from P5-G (landing-page builder).** The working-tree
  `mail-bridge.js` now statically imports
  `../landing-page-builder/landing-page-model.js` (P5-G's uncommitted `link`-kind
  work). That broke the jsdom harnesses in `social-mail-composer`, `social-mail-bridge`,
  `social-mail-client-shell` and `social-mail-narrow`, which copy a fixed file list
  into a temp ESM folder and did not include that module. I added
  `minigames/landing-page-builder/landing-page-model.js` (self-contained, no imports)
  to each of those four copy lists so they load. If P5's own test packet also touches
  these harness lists, that is a trivial, additive overlap.
- **Files with concurrent other-agent edits.** `mail-bridge.js` and `mail-composer.js`
  also carry P5-G's uncommitted landing-page blocks; I added only my own blocks and
  did not touch theirs. `scenarios/test_social_slice/scenario.json.erb`,
  `mission.json`, the brandt/quinn ink, `validate_social/landing.rb` and
  `validate_social/osint.rb` are being edited by other sessions and were not touched
  here.
- **Server change.** `MAIL_MESSAGE_KEYS` gained `pendingMessage` (game.rb). Inert for
  m01–m08 (no mailState). Run the Rails suite before the engine commit (done: green).
