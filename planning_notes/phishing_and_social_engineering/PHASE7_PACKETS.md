# Phase 7 work packets: awareness episodes

Status: plan, 2026-10-22. It replaces the `P7-*` placeholder row in `IMPLEMENTATION_PLAN.md` §4.
The user brought Phase 7 forward to run in parallel with the remaining lab work. Eldritch Hacker
stays held (P9-deferred is unchanged). Audio waits for the user: `11` N7 (the deepfake TTS style)
and the audio half of N12 (the voicemail player) are held packets. Until they land, every voice
item is a transcript-only stand-in, which the triage `voicemail` kind already draws.

**Kind of game.** The awareness product: short attack-then-defend episodes for non-technical staff,
on a neutral corporate skin (`ui_theme: "general"`). It is a separate product line from the lab
and from SAFETYNET. Put that in every prompt.

Read with: `SE_BUILD_BRIEF.md` (rules for every agent), `designs/11_awareness_product_episodes.md`
(the items N1 to N16 and E1 to E7), `designs/05_inbox_triage_defender.md` "Extensions for the
awareness episodes", `designs/00_data_contract.md` §11 (kiosk pointer, shells, sync then emit),
README_scenario_design.md "Inbox triage" and "Messages that aren't email".

Paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/`, `test/`,
`tools/`, `scenarios/`, `planning_notes/` or a dot.

## 1. What is already built (checked in the code, 2026-10-22)

Most of `05`'s awareness extensions landed in 90d00ec5 (the mechanics batch). An episode reuses all
of this unchanged.

| Item | State | Evidence |
|------|-------|----------|
| Non-email kinds `sms`, `voicemail`, `qr`, `page` (`05` N1) | Built, Node and bridge tested | `minigames/inbox-triage/triage-kinds.js:23` (kinds), `:229` sms thread, `:255` voicemail card (static waveform and transcript, **no audio**), `:284` QR notice ("Where does this code go?"), `:307` page card (clickable address bar, padlock note); `test/js/social-triage-kinds.test.mjs`; `scenarios/test_social_p7_channels/`; `tools/playtest/se/bridge-p7-channels.jsonl` |
| `call` and `push` kinds with their own actions (`05` N10) | Built | `triage-kinds.js:48` (`CALL_ACTIONS`: comply, escalate, refuse, verify_callback), `:56` (`PUSH_ACTIONS`), `:347` call transcript card, `:360` one MFA prompt card. Lint: `call` only in an `awareness` set with `verifyVerdict`, `push` only in `awareness` (`scripts/validate_social/triage.rb`) |
| Verify verdict | Built, used only by the P7 fixture | `triage-scoring.js:21`; schema `verifyVerdict` |
| Comparison panel and no-baseline gate (`05` N11) | Built | `minigames/inbox-triage/triage-comparison.js:47` (`comparisonFor`), `:71` (`comparisonText`); `requireGlobal` carries `pre_check_completed`; `test/js/social-triage-comparison.test.mjs`; lint `triage.rb:424-434` |
| `playerSent` kind (`05` N9) | Built | `triage-messages.js:153` `resolvePlayerSent(entry, set, mailState, social, opts)` returns `{ message }` or `{ skipped }`; `test/js/social-player-sent.test.mjs` |
| Starter: `stage` parameter, `conclusionTaskId`, sync then emit, reopen re-emit, read-only reopen (`05` N6, N7; `11` N16 starter half) | Built | `systems/triage-starter.js:333` `startInboxTriageMinigame(lockable, options)` reads `options.triageSetId`, `options.stage`, `options.conclusionTaskId`, `options.onComplete`; `lockable` may be null; Rails `social_sync_then_emit_test` |
| `answers[].ms` | Built, in memory only | `inbox-triage-minigame.js:493`, `:721-726` |
| `awareness` scoring profile (N9) | Built | `triage-scoring.js:20` `PROFILES` |
| Narrow mail layout (`01` N1, P1-N) | Built for small viewports only | media query at 767 px (`mail-client-minigame.js:1064`, `test/js/social-mail-narrow.test.mjs:283`). There is **no forced phone frame** on a desktop viewport, which E6 needs |
| Red-flag meter in the composer | Built | `mail-composer.js:446` (per-target `redFlagMeter`, default `mailClient.showRedFlagMeter`) |
| Per-target reply delay | Built | `systems/mail-scheduler.js:386` (`emailReplyDelay` seconds, default 20) |
| Return-to for nested overlays | Built | `minigames/framework/minigame-manager.js:19-24`, `:317` |
| Channel tells in the library (N10) | Done | `triage-flags.js:17` `CHANNEL_TELLS` |

**Not built:** the episode runner (N1), the flip view (N2), every defend set and check form (N3),
the measurement store (N4), the facilitated flag (N5), the forced phone frame (N6), the brand set
(N8), the push stream (N11), the voicemail audio slot (N12), the certificate check on the page card
(N13 rest), the role swap (N15), the host NPC shells and their lints (N16 rest), the `kiosk`
object branch, the `social.awarenessEpisode` schema entry, and a one-send cap on the mail client
(`maxMessages: 1`; nothing in `minigames/mail-client/` reads it). A grep for `kiosk`,
`awarenessEpisode` and `episodeId` across `public/break_escape/js`, `scripts` and `app` finds only
the container minigame's sprite list.

**Schema blocker.** `social` in `scripts/scenario-schema.json` is closed
(`additionalProperties: false`, MECHANICS_AUDIT M3), so no shell validates until
`awarenessEpisode` is added. That is P7-D's first job.

## 2. Pinned interfaces

These are fixed now so that packets in the same wave can code against each other. A packet that
needs to change one asks the orchestrator first, and the orchestrator updates this section.

### 2.1 The episode definition (`social.awarenessEpisode`)

From `11` §5.1, with the fields the build needs added (marked *new*). P7-D writes the schema.

```jsonc
"awarenessEpisode": {
  "id": "e1_invoice_fraud",               // defend-only: "<full id>_defend"
  "role": "finance",
  "company": "brightwell_foods",
  "brand": { "name": "Brightwell Foods", "logoText": "BRIGHTWELL", "accent": "#2f6f5e" },  // new (N8)
  "variant": "full",                       // or "defendOnly"
  "durationTargetMin": 13,
  "scopeNote": "...",
  "stages": ["brief","osint","write","flip","defend","debrief"],   // check missions: ["check"]
  "conclusionTaskId": "finish_episode",    // new: the task the host NPC's mapping completes; passed to the triage starter
  "attack": { "target": "supplier_contact", "siteIds": [...], "accountIds": ["analyst"],
              "defaultAccount": "analyst", "showRedFlagMeter": true, "maxMessages": 1, "scored": false },
  "defend": { "setId": "e1_payments_inbox", "stage": null,       // new: "pre" | "post" on a check mission
              "reportAlwaysVisible": true },
  "strings": {                              // new: every learner-facing line, data not code
    "brief": "...", "flipHeading": "...", "flipIntro": "...", "flipDefenderLine": "...",
    "flipNoSend": "...", "noBlameLine": "...", "mondayCard": "...", "defendOnly": "..."
  },
  "debrief": { "mondayCard": "slot:customer_report_route", "noBlameLine": true },
  "facilitated": false                      // N5, read from wave 2
}
```

Stage ids are a closed list: `brief`, `osint`, `write`, `flip`, `defend`, `debrief`, `check`.
Wave 3 adds `mfa` (E3). Derived names, never authored:

- `episode_<id>_state`, the runner's state global (object, default `{}`);
- `episode_<id>_defend_`, the defend set's `outcome.setGlobalPrefix`, so its done global is
  `episode_<id>_defend_done`;
- `se_awareness_records`, the measurement global (object, default `{}`).

### 2.2 The runner state (`episode_<id>_state`)

Ids and numbers only, well inside the 60 KB `pagehide` budget:

```jsonc
{ "v": 1, "variant": "full", "stage": "flip", "done": ["brief","osint","write"],
  "sent": { "recordId": "...", "targetId": "supplier_contact", "templateId": "...", "blankIds": ["..."] },
  "defend": { "percent": 80, "reportRate": 0.5, "verifyCount": 1 } }
```

`sent` is set when the write stage closes after a send, and is set back to `null` once the flip has
been shown (`11` §5.2: held to feed the flip, then discarded). A reopen resumes at `stage`.

### 2.3 The runner and its children

- `systems/episode-starter.js` (P7-A) exports `startEpisodeRunner(lockable, options = {})`. It reads
  `lockable.scenarioData.minigameData.episodeId` and `window.gameScenario.social.awarenessEpisode`.
  If the ids differ or the block is missing, it shows a `gameAlert` and returns `null`. Otherwise it
  starts the scene `'episode-runner'` with `{ episode, state, requiresKeyboardInput: true,
  disableClose: true }` and returns the params. P7-H puts it on `window` and registers the scene.
- `minigames/episode-runner/episode-runner-minigame.js` (P7-A) exports
  `EpisodeRunnerMinigame extends SocialOverlayScene`, with `getTestState()` returning
  `{ episode: { id, variant, stage, done, sentHeld: boolean } }`.
- Children, one at a time, each reopening the runner when it ends. The runner's params come back
  as `{ resume: true }` and the state global says where it is:
  - OSINT: `startMinigame('osint-browser', null, { siteIds, returnTo })`;
  - mail: `startMinigame('mail-client', null, { accountIds, defaultAccount, maxSends: 1, layout, returnTo })`.
    `maxSends` and `layout` are P7-G's. Until P7-G lands they are ignored, the runner still works,
    and the one-send cap is not enforced. From P7-G on, the mail client's result carries
    `sentIds: string[]` (this session's sent record ids, oldest first);
  - triage: `window.startInboxTriageMinigame(null, { triageSetId, stage, conclusionTaskId, onComplete })`,
    which needs no change to the starter. The runner reopens itself from `onComplete`.
- Every child launch passes the episode's own ids. The runner never reads another mission's data.

### 2.4 Views (P7-B), all in `minigames/episode-runner/`

```js
// step-strip.js
renderStepStrip(container, { stages, current, done, labels }) -> { update({ current, done }), destroy() }
// flip-view.js. `message` is resolvePlayerSent(...).message, or null when nothing usable was sent
renderFlipView(container, { message, strings, onContinue }) -> { destroy(), getState() }
// getState(): { shown: 'message' | 'noSend', tells: string[] }
// debrief-view.js. `result` is the triage gameResult (answers, perFactor, verifyCount, reportRate)
renderDebrief(container, { result, set, strings, variant, onFinish }) -> { destroy(), getState() }
// getState(): { items: number, mondayCard: boolean, noBlame: boolean }
```

The flip draws the message with the shared `MailReader` (read-only) and lists its tells with
`redFlagString(id, message)` from `triage-flags.js`. On `variant: "defendOnly"` the runner never
calls `renderFlipView`, and `renderDebrief` shows `strings.defendOnly` with the no-blame line. Classes
are `aw-*`, and the skin's tokens (`--aw-accent`, `--aw-ink`, `--aw-surface`) live in
`css/awareness-skin.css`. The brand comes from `episode.brand`. All text goes in with `textContent`.

### 2.5 Measurement (P7-C), `systems/awareness-measure.js`

```js
export const RECORDS_GLOBAL = 'se_awareness_records';
buildBlock(result, ctx) -> Block            // pure
recordTriageResult(result, ctx, deps = {}) -> { written: boolean, reason?: 'already-recorded' | 'read-only' | 'aborted' }
readBlocks(globals) -> Block[]              // pure
toXapi(block, actor) -> object[]            // pure; actor is pluggable (11 §6.3)
// ctx:   { setId, form, stage: 'pre' | 'post' | 'episode', episodeId, variant, now }
// Block: { v: 1, key, setId, form, stage, episodeId, variant, at, percent, reportRate,
//          items: [{ itemId, verdict, action, chips, score, ms }] }
```

`key` is `<stage>:<setId>`. The first answer is the one recorded (`11` §4.1). A key that is already
present is never overwritten, and a read-only reopen writes nothing. The write goes through
`writeGlobal` from `systems/global-writer.js` and is not deferred, since nothing listens on this
global. No free text is stored. The runner calls `recordTriageResult` from the triage `onComplete`.

### 2.6 Content fragments (P7-E, P7-F)

Scenario files cannot include other files (no ERB include exists in `app/models/break_escape/mission.rb:123-135`),
so content is authored first as fragments of the `social` block. In wave 2 a shell packet copies
them in. Each fragment must pass the validator when wrapped in a throwaway scenario in the
packet's scratch folder.

- `planning_notes/phishing_and_social_engineering/awareness/e1/defend.json` (P7-E):
  `{ "triageSets": [ ... ], "awarenessEpisode": { "strings": { ... }, "scopeNote": "...", "brand": { ... } } }`
- `planning_notes/phishing_and_social_engineering/awareness/e1/attack.json` (P7-F):
  `{ "phishTargets": [ ... ], "templates": { ... }, "osint": { ... }, "intelFacts": [ ... ], "mailClient": { ... } }`
  Plus any `people` the OSINT pages need.

**E1 pins**, so the two writers agree without reading each other's file. All names are fictional,
and P7-E's `BRAND_SET.md` may add to these but not change them:

| Id | Value |
|----|-------|
| Company | Brightwell Foods, `brightwellfoods.example`; lookalike `brightwel1foods.example` (`11` §4.2) |
| Supplier | Harlow Packaging Ltd, `harlowpackaging.example`; contact id `supplier_contact` |
| Finance manager | Adaeze Okafor, `adaeze.okafor@brightwellfoods.example` |
| Accounts payable clerk (the attack target's colleague role) | Tom Reilly, `tom.reilly@brightwellfoods.example` |
| Learner's mail account | `analyst` |
| OSINT site ids | `brightwell_site`, `brightwell_social` |
| Required factors on the attack target | `senderTrust`, `pretextRelevant`; `urgencyCalibrated` advisory; no attachment factor (`11` §3.2) |
| Tells that cross from attack to defend | `senderTrust`, `pretextRelevant`, `urgencyCalibrated`, `changed_bank_details`, `secrecy_or_bypass` |
| Defend set ids | `e1_payments_inbox` (5 items); check forms `finance_form_a`, `finance_form_b` (10 each, `pairedWith` each other, prefix `triage_{stage}_`) |

## 3. Packets

Each row: scope, the files it owns, what it consumes and provides, the model, what it waits on, and
the proof. "After X" means X's code has landed with its unit tests passing (plan §4 rule). Every
implementation packet ends with `git diff --stat` limited to the files it owns. Tests follow the
brief's naming (`test/js/social-<module>.test.mjs`, `test/js/validator-<area>.test.mjs`), run per
file with `bundle exec node --test`, on fixtures and never on live content. The validator runs with
`--strict-social --no-graph --skip-ink`.

### Wave 1: can start now, in parallel (6 packets)

| Id | Scope | Owns | Consumes / provides | Model | After | Proof |
|----|-------|------|---------------------|-------|-------|-------|
| **P7-A** Episode runner | `11` N1: the `episode-runner` scene, stage sequencing for `full`, `defendOnly` and `check`, the state global and resume-on-reopen, child launches (§2.3), the Close and Esc rules (`requiresKeyboardInput`, own Close, Esc), and the measurement call after the triage round. Views and measurement are injected as `deps` with real defaults. Its tests use stubs, so the packet does not wait on P7-B or P7-C | `minigames/episode-runner/episode-runner-minigame.js`, `minigames/episode-runner/episode-model.js`, `systems/episode-starter.js`, `css/episode-runner.css`, `test/js/social-episode-model.test.mjs`, `test/js/social-episode-runner.test.mjs` | Consumes §2.1, §2.4, §2.5; `startInboxTriageMinigame`; `SocialOverlayScene`; `writeGlobal`; return-to. Provides `startEpisodeRunner`, `EpisodeRunnerMinigame`, `stagesFor(episode)`, `nextStage(episode, state)`, `stateKey(id)`, `defendPrefix(id)` | Opus | — | Node: stage order for all three variants; a reopen at every stage resumes there; `sent` is cleared after the flip; a `defendOnly` episode never launches OSINT or mail; a check mission launches triage with `defend.stage`; a triage abort leaves the stage unchanged; the measurement dep is called once per finished round and never on a read-only reopen (jsdom, real `episode-model.js`). Bridge check on `test_social_episode` waits for P7-H (gate checked in wave 2) |
| **P7-B** Episode views and neutral skin | `11` N2 (flip view), stage 6 debrief (per-item reasoning, the Monday card, the no-blame line, the `defendOnly` string), N8 skin half (step strip, `aw-*` tokens, a wordmark logo drawn in CSS from `brand.logoText`, the Report button's positive animation with reduced motion). No image generation | `minigames/episode-runner/step-strip.js`, `minigames/episode-runner/flip-view.js`, `minigames/episode-runner/debrief-view.js`, `css/awareness-skin.css`, `test/js/social-episode-views.test.mjs` | Consumes `MailReader` (read-only), `redFlagString`, `resolvePlayerSent`'s `message` shape, the triage `gameResult`. Provides §2.4 | Sonnet | — | Node (jsdom): the flip lists exactly the message's stored tells with their canonical strings; `message: null` shows `flipNoSend`; the debrief shows one card per answer and the Monday card; `defendOnly` shows its string and no flip wording; every string goes through `textContent` (an HTML-like string renders as text); reduced motion turns the animation off |
| **P7-C** Measurement store | `11` N4 and §5.2 "Recorded per item": §2.5, local first, first answer only, the xAPI mapping kept pure | `systems/awareness-measure.js`, `test/js/social-awareness-measure.test.mjs` | Consumes the triage `gameResult`, `writeGlobal`. Provides §2.5 | Sonnet | — | Node: a block from the `05` worked example; a second round on the same key writes nothing; a read-only result writes nothing; the stage and variant are carried; no field holds free text; a 10-item block serialises under 4 KB; `toXapi` gives one statement per item plus one for the round |
| **P7-D** Awareness validator, schema and test shell | `11` N16 validator half and N3/N9 lints: the `awarenessEpisode` schema (§2.1) and the `kiosk` entry `{ episodeId }` in `minigame-data-schemas.json`. Shell lints: one `kiosk` whose `episodeId` equals the episode id; the stages list valid for the variant; a `_defend` id suffix on `defendOnly`; `attack.target`, `siteIds` and `accountIds` resolve; `maxMessages: 1` and `scored: false`; the target's `emailReplyDelay` between 5 and 8 (warning); `defend.setId` resolves to an `awareness` set with `passPercent: 0`; the episode prefix is `episode_<id>_defend_`; the defend set has 5 to 8 messages, or 10 on a check; one aim with `missionConclusion` and `concludeRequires` on the done global; a host NPC mapping on `global_variable_changed:<done>` completes `conclusionTaskId`; `episode_<id>_state` and `se_awareness_records` declared as `{}`; on check missions the pre mission exports, and the post mission imports with `as` equal to the name and `completed: "pre_check_completed"`. Also a minimal fixture shell for bridge checks | `scripts/validate_social/awareness.rb`, `test/js/validator-social-awareness.test.mjs`, `test/js/fixtures/social_awareness/`, `scenarios/test_social_episode/` (mission.json `collection: "testing"`, inline stub content of 2 items). **Shared-file owner for wave 1:** `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `scripts/validate_social.rb` (the area line) | Consumes §2.1, the `05` N5 lints already in `triage.rb`. Provides `ValidateSocial::Awareness.check(ctx)` and the schema the content packets validate against | Sonnet | — | `validator-social-awareness` (one failing fixture per lint, one clean); `test_social_episode` and the existing `test_social_*` and lab scenarios still exit 0; `validator-social-schema` passes |
| **P7-E** E1 defend content and brand roster | `11` N3 and N9 for E1: `e1_payments_inbox` (5 items: 2 phish, 3 genuine; one genuine item carries a "confirmed by phone" note; Verify on), the finance parallel forms A and B (10 each, matched on phish count, factor counts and difficulty; `feedbackMode: "end"`), every learner-facing episode string for both variants (brief, scope note, flip lines, debrief, Monday card, `defendOnly`), and N8's content half: `BRAND_SET.md`, a roster of 3 or 4 fictional companies with `.example` domains, lookalikes and a cast varied in age and background, with E1's pins from §2.6 | `planning_notes/phishing_and_social_engineering/awareness/e1/defend.json`, `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` | Consumes `05`, `11` §3.2 and §4, the §2.6 pins. Provides the defend fragment | Opus | — | The validator on a scratch wrapper (fragment inside a copy of `test_social_p7_channels`) exits 0, including the parallel-form balance lint. A scratch script runs the real `scoreTriage` on the `11` §4.2 item and gets 100, 80, 70 and 0 for the four worked answers. Copy review against `11` §4.3 (no blame language) is recorded in the report |
| **P7-F** E1 attack content | The attack half of E1 (`11` §3.2 E1 row, §3.1 stages 2 and 3): the `supplier_contact` target with its factors, `factorStrings`, `templateSets` with one or two blanks, `replies` and `emailReplyDelay: 6`; the two OSINT sites giving 3 to 5 facts; the `intelFacts` and the contact whose `revealedBy` an OSINT fact grants; the `analyst` account | `planning_notes/phishing_and_social_engineering/awareness/e1/attack.json` | Consumes `04`, `01`, `02`, the §2.6 pins. Provides the attack fragment and a short list of the tells a good send stores (for the flip) | opus48 | — | The validator on a scratch wrapper exits 0. A scratch script on the real `phish-rules.js` shows that a send using the found facts lands, and that one with the wrong sender misses with the meter's guidance. No landing page, no attachment |

**Shared files in wave 1.** P7-D alone edits `scripts/scenario-schema.json`,
`scripts/minigame-data-schemas.json` and `scripts/validate_social.rb`. No wave 1 packet edits
`systems/interactions.js`, `minigames/index.js`, `systems/minigame-starters.js`, `core/game.js`,
`app/views/break_escape/games/show.html.erb`, `README_scenario_design.md`, `00_data_contract.md`,
`systems/triage-starter.js`, anything under `minigames/inbox-triage/` or anything under
`minigames/mail-client/`. Packets put their README and contract notes in their report, under
"Docs hand-off", for P7-O. Nobody touches `minigames/framework/base-minigame.js` or
`systems/test-bridge/minigames.js`, which another session is editing (the harness fixes).

**Proof that waits for later waves.** The P7-A and P7-B bridge checks need the wiring (P7-H). The
orchestrator checks them in wave 2, so no wave 1 gate waits on another packet.

### Wave 2: E1 end to end (after wave 1)

| Id | Scope | Owns | Consumes / provides | Model | After | Proof |
|----|-------|------|---------------------|-------|-------|-------|
| **P7-G** Mail client episode options | The one-send cap (`maxSends`: after that many sends this session, Compose is disabled and a line says the message has gone; Close carries on); `sentIds` in the close result; `11` N6, a `layout: "phone"` parameter that puts the existing narrow layout in a phone frame on any viewport (for E6) | `minigames/mail-client/mail-client-minigame.js`, `minigames/mail-client/mail-composer.js`, the mail client CSS, `test/js/social-mail-episode-options.test.mjs` | Provides the §2.3 mail parameters. No change to `mailState` or the rules engine | Sonnet | — (can start with wave 1 if a slot is free) | Node (jsdom): a second Compose is refused after one send; `sentIds` matches `mailState`; with no `maxSends` the client behaves as before (`social-mail-*` tests unchanged); the phone layout at 1400 px has no horizontal scroll and every control can be reached by Tab |
| **P7-H** Wiring | The `kiosk` branch in `interactions.js` (calls `window.startEpisodeRunner(sprite)`, or a `gameAlert` when it is missing); registration of `episode-runner` in `minigames/index.js`; `window.startEpisodeRunner` in `minigame-starters.js` (imported from `systems/episode-starter.js`, as triage does); CSS links for `episode-runner.css` and `awareness-skin.css`; a placeholder `objects/kiosk.png` copied from `checkin_kiosk1.png` only if no `kiosk.png` exists; its `preload()` line | **Shared-file owner for wave 2:** `systems/interactions.js`, `minigames/index.js`, `systems/minigame-starters.js`, `core/game.js`, `app/views/break_escape/games/show.html.erb`; `assets/objects/kiosk.png` | Consumes P7-A's exports and P7-B's CSS | Sonnet | P7-A, P7-B (code) | `git diff --stat` limited to those blocks; the kiosk in `test_social_episode` opens the runner; the full `social-*` Node set still passes; m01 loads (smoke) |
| **P7-I** Runner integration and facilitated flag | P7-A resumed. Swap the stub deps for the real P7-B and P7-C modules; pass `maxSends` and `sentIds` through once P7-G lands; `11` N5 `facilitated: true` (stage prompts from `strings.facilitator`, the score hidden on the shared screen, a pause between stages) | P7-A's files (owner of `minigames/episode-runner/episode-runner-minigame.js`, `episode-model.js`, `systems/episode-starter.js` and `css/episode-runner.css` in wave 2) | As P7-A | Opus | P7-B, P7-C; P7-G for the cap | `social-episode-runner` extended with the real views and store; the facilitated cases; then the bridge script (P7-T0) on `test_social_episode` |
| **P7-J** E1 shells: defend-only and checks | Five mission folders, each a one-room kiosk map (`ui_theme: "general"`, `collection: "training"`, `disableAttacks: true`) with a host NPC (one line of ink, `eventMappings` on the done global), one aim with `missionConclusion` and `concludeRequires`, and the globals: `awareness_e1_invoice_fraud_defend` (defend-only, `id` `e1_invoice_fraud_defend`); `awareness_pre_finance_ab`, `awareness_post_finance_ab`, `awareness_pre_finance_ba`, `awareness_post_finance_ba` (exports and imports as `11` §5.2). Defend sets copied from P7-E's fragment. Cast varied; sprite keys reuse existing placeholders (no image generation) | `scenarios/awareness_e1_invoice_fraud_defend/`, `scenarios/awareness_pre_finance_ab/`, `scenarios/awareness_post_finance_ab/`, `scenarios/awareness_pre_finance_ba/`, `scenarios/awareness_post_finance_ba/`; their own blocks in `scripts/ink_runtime_check/missions.json` (re-read before editing, validate the JSON after) | Consumes P7-D's lints, P7-E's fragment | Opus | P7-D, P7-E | Validator exits 0 on all five; ink compiled in scratch; `reopencheck` passes with the new blocks; listed under the training label after `db:seed` on the dev database |
| **P7-K** E1 full episode shell | `scenarios/awareness_e1_invoice_fraud/`, built from P7-J's defend-only shell plus P7-F's attack fragment and P7-E's strings (`variant: "full"`, all six stages, the attack block) | `scenarios/awareness_e1_invoice_fraud/` and its block in `missions.json` | Consumes P7-J's shell layout, both fragments | opus48 | P7-J, P7-F | Validator exits 0; ink compiled in scratch; `reopencheck` passes |
| **P7-L** Triage surfaces | `11` N13 rest: a certificate check on the `page` card ("issued to" host, a line on what it does not prove) and an optional "password manager did not fill this in" cue. `11` N14 polish: a phone frame for `sms`, a printed-poster look for `qr`. `11` N12 transcript half: an optional `audio: { clipId }` field on `voicemail` that is ignored until N12-audio, so content can name its clip now. `reportAlwaysVisible` checked on the sort step. Art stays CSS only; any PixelLab icon (`11` §8) is asked for separately | `minigames/inbox-triage/triage-kinds.js`, `minigames/inbox-triage/inbox-triage-minigame.js`, `css/inbox-triage-minigame.css`, `test/js/social-triage-kinds.test.mjs`, `tools/playtest/se/bridge-p7-channels.jsonl`, `scenarios/test_social_p7_channels/` | Hands its schema fields (`page.certificate`, `page.autofill`, `voicemail.audio`) to P7-N | Sonnet | — | `social-triage-kinds` extended; `bridge-p7-channels` passes on :3001; existing `social-triage-*` tests unchanged |
| **P7-M** Mock authenticator (push stream) | `11` N11: a phone-shaped overlay that plays unrequested approve and deny prompts on a timeline, with the odd-hour push and the target's eventual approval at a set time. It is the E3 attack beat's demonstration, so it is not scored. Code only; P7-W3 wires it | `minigames/authenticator/` (new), `css/authenticator-minigame.css`, `test/js/social-authenticator.test.mjs` | Provides the scene `authenticator` with params `{ pushes: [{ at, app, account, location, device }], approvesAt, mode: "attacker" }` and the result `{ approvedAt, sent }`. Overlay rules as N1 | opus48 | — | Node (jsdom): the timeline order, the approval at `approvesAt`, Esc and Close giving no `minigame_failed`; a bridge check once wired (wave 3) |
| **P7-N** Validator owner, wave 2 | P7-D resumed: the schema fields from P7-L, any lint gaps P7-J and P7-K report, and the `05` N5 rule that `setGlobalPrefix` names count as written for `exportGlobals` (check it is already true, `validate_scenario.rb:4394-4400`) | **Shared-file owner for wave 2:** `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `scripts/validate_social.rb`, `scripts/validate_social/awareness.rb`, its tests and fixtures | — | Sonnet | P7-L hands its fields | Validator tests pass; every `test_social_*`, the lab and the six E1 shells exit 0 |
| **P7-O** Docs | README_scenario_design.md: an "Awareness episodes" section (the episode block, kiosk, shells, host NPC, check missions and carry-over, measurement global, the Docs hand-off from each packet); the new `kiosk` row and the new triage fields; `00` §11 rows for `se_awareness_records`, the `awarenessEpisode` additions (§2.1) and the `maxSends` parameter | **Shared-file owner for wave 2:** `README_scenario_design.md`, `designs/00_data_contract.md`, `designs/11_awareness_product_episodes.md` (a dated "built" note only) | Consumes every wave 1 and 2 report | Sonnet | P7-A, P7-C, P7-D (code) | A fresh reader builds `test_social_episode` from the README alone in a scratch copy, and the validator exits 0 on it |

**Wave 2 gate** (orchestrator): **P7-T0** (Sonnet) writes `tools/playtest/se/bridge-p7-episode.jsonl`
after P7-H and P7-I: the kiosk opens the runner; Space and E do nothing while it is open; each stage
starts its child and returns; the flip shows the sent message and its tells; defend-only skips three
stages; a reload at each stage resumes; Esc and Close give no `minigame_failed`. **P7-R** (Opus,
read-only) reviews all P7 diffs. **P7-T** (Sonnet, keyless :3001) runs: E1 full; E1 defend-only;
the pre, episode and post sequence on the AB pair (comparison shown); the post check with no pre
(no baseline shown); a closed tab after the done global saved, so the reopen re-emits and completes
the task once (`count-task-posts.sh`); the blocked-sync and 403 runs on an episode shell. This is
Phase 7 "Done when (first episode)".

### Wave 3: E5 and E3 (after the wave 2 gate)

| Id | Scope | Owns | Model | After | Proof |
|----|-------|------|-------|-------|-------|
| **P7-P** Role swap | `11` N15: convert `defend.calls[]` (`{ id, genuine, callerId, claims: [{ fact, value }], tells, transcript, notes }`) into `call` messages (`truth.isPhish = !genuine`, `truth.flags = tells`); show the claims on the call card, so the facts the learner used in the attack are the ones they now check; the starter takes `options.set` (a ready-made set) so the runner can pass the merged set; the runner's `mfa` stage launches `authenticator`. The scoring row is unchanged: refusing a genuine caller scores as Delete, and the review card says what the safe route was | `minigames/episode-runner/role-swap.js` (new), the runner files, `systems/triage-starter.js`, `triage-kinds.js` (the `call` surface only), `test/js/social-role-swap.test.mjs` | Opus | wave 2 | Node: the conversion, the merged set, the starter override with the existing `social-triage-starter` tests unchanged, the scores for the four actions on a genuine and an impostor call |
| **P7-Q** E3 attack content | The helpdesk pretext call from `06` data (the locked-out manager, `knows` and `lines`); the push stream timeline for P7-M | `planning_notes/.../awareness/e3/attack.json` | opus48 | P7-M | Validator on a wrapper; the `06` judge on the call |
| **P7-S** E3 defend content | 4 calls (2 impostor, 2 genuine, one of them awkward), whose claims are drawn from P7-Q's `knows` ids (pinned in the P7-Q report), plus 1 `push` item; helpdesk forms A and B; strings | `planning_notes/.../awareness/e3/defend.json` | Opus | P7-Q's id list | Validator on a wrapper; scoring script |
| **P7-U** E5 attack content | The look-alike sign-on page for `07`'s builder (invented brands, `generic` or `parody` look, nothing captured). Only opus48 or Haiku open `07` (brief) | `planning_notes/.../awareness/e5/attack.json` | opus48 | — | Validator with `landing.rb` on a wrapper |
| **P7-V** E5 defend content | 5 URL and page items (3 phish, 2 genuine) using P7-L's certificate and autofill fields; general-staff forms A and B | `planning_notes/.../awareness/e5/defend.json` | Opus | P7-L | Validator on a wrapper; scoring script |
| **P7-W3** Wiring | Register `authenticator` (P7-M), its CSS link | Shared-file owner for wave 3: `interactions.js`, `minigames/index.js`, `minigame-starters.js`, `core/game.js`, `show.html.erb` | Sonnet | P7-M | The overlay opens from the runner's `mfa` stage on a fixture |
| **P7-X** Validator owner, wave 3 | The `defend.calls[]` schema and lints (claims resolve to `06` `knows` ids, tells are channel tells), the `mfa` stage, the push stream data | Shared-file owner for wave 3: the schema files, `validate_social.rb`, `awareness.rb` | Sonnet | P7-P's shapes as pinned here | Validator tests |
| **P7-Y1** E3 and E5 shells, defend-only and checks | As P7-J, for the helpdesk and general-staff roles | the defend-only and check mission folders | Opus | P7-S, P7-V, P7-X | Validator, ink, reopencheck |
| **P7-Y2** E3 and E5 full shells | As P7-K | `scenarios/awareness_e3_*`, `scenarios/awareness_e5_*` (full) | opus48 | P7-Y1, P7-Q, P7-U | Validator, ink, reopencheck |
| **P7-O3** Docs | README and `00` for the role swap, `mfa` and the push stream | Shared-file owner for wave 3: README, `00` | Sonnet | P7-P, P7-X | — |

The wave 3 gate repeats wave 2's: a bridge script, an Opus review, and Sonnet playtests of each
episode, its defend-only shell and its check pair.

### Wave 4: E2, E4, E6, E7 with transcript stand-ins

Each episode is the same four-way split: defend content (Opus), attack content (opus48),
defend-only and check shells (Opus), full shell (opus48). E6 uses P7-G's `layout: "phone"`. E4 and
E7 use the `voicemail` kind with transcripts and an `audio.clipId` named but not yet made. E7 is
optional (`11` A1) and has no attack score. The shared-file owners are named again when the wave is
scheduled.

### Held for the user

| Id | Item | Stand-in until then |
|----|------|---------------------|
| **P7-Z1** | `11` N7: the "cloned voice" style entry in the TTS config (`tts-audio` skill; a style variant of an in-world fictional voice, never a real person) | Transcripts in the voicemail card |
| **P7-Z2** | `11` N12 audio: a play control on the `voicemail` card that plays the clip named by `audio.clipId`, plus generating the clips (VO6 to VO8, metered) | P7-L reserves the field; the card stays transcript-only |
| **P7-Z3** | PixelLab art for the episodes (`11` §8: office backgrounds, cast portraits, padlock, QR poster, SMS bubble, push card icons; ASSETS NPC11, NPC12, BG6, LOGO7 to LOGO10) | CSS wordmark and placeholder sprite keys |

## 4. Shared-file owners by wave

| File | Wave 1 | Wave 2 | Wave 3 |
|------|--------|--------|--------|
| `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `scripts/validate_social.rb` | P7-D | P7-N | P7-X |
| `systems/interactions.js`, `minigames/index.js`, `systems/minigame-starters.js`, `core/game.js`, `show.html.erb` | nobody | P7-H | P7-W3 |
| `README_scenario_design.md`, `designs/00_data_contract.md` | nobody (hand-off notes in reports) | P7-O | P7-O3 |
| `minigames/inbox-triage/*`, `css/inbox-triage-minigame.css` | nobody | P7-L | P7-P (`call` surface only) |
| `systems/triage-starter.js` | nobody | nobody | P7-P |
| `minigames/mail-client/*` | nobody | P7-G | nobody |
| Runner files (`episode-runner-minigame.js`, `episode-model.js`, `episode-starter.js`, `episode-runner.css`) | P7-A | P7-I | P7-P |
| View files (`step-strip.js`, `flip-view.js`, `debrief-view.js`, `awareness-skin.css`) | P7-B | P7-B resumed for fixes only | P7-B resumed for fixes only |
| `scripts/ink_runtime_check/missions.json` | nobody | each shell packet, its own block only | the same |
| `IMPLEMENTATION_PLAN.md`, `SE_BUILD_LOG.md`, this file | orchestrator | orchestrator | orchestrator |

A packet that needs a change in a file it does not own puts the exact addition in its report, and
the orchestrator passes it to that wave's owner.

## 5. Coverage

| Item | Packet |
|------|--------|
| `11` N1 runner | P7-A, P7-I |
| N2 flip view | P7-B |
| N3 defend sets | P7-E (E1), P7-S (E3), P7-V (E5), wave 4 |
| N4 measurement store | P7-C |
| N5 facilitated flag | P7-I |
| N6 phone-shaped mail layout | P7-G |
| N7 TTS style | P7-Z1 (held) |
| N8 brand set | P7-B (skin), P7-E (roster and strings), P7-Z3 (art, held) |
| N9 `awareness` profile | built; selected by the content packets, linted by P7-D |
| N10 channel tells | built |
| N11 authenticator | P7-M, wired by P7-W3 |
| N12 voicemail player | P7-L (field and transcript), P7-Z2 (audio, held) |
| N13 `page` card | built in part; the rest in P7-L |
| N14 `qr` and `sms` surfaces | built in part; the rest in P7-L |
| N15 role swap | P7-P |
| N16 host NPC and flushed done | starter built; lints P7-D; host NPCs P7-J, P7-K |
| `kiosk` branch | P7-H |
| `awarenessEpisode` schema | P7-D |
| `maxMessages: 1` | P7-G (cap), P7-A (passes it) |
| E1, its defend-only shell, its check missions | P7-E, P7-F, P7-J, P7-K; gate P7-T |
| E5, E3 | wave 3 |
| E2, E4, E6, E7 | wave 4 |
| Eldritch Hacker | held (P9-deferred) |

## Wave 1 hand-offs (2026-10-22)
- **P7-B:** the Report button's positive animation is CSS only. Wave 2 must add `aw-report-win` and show `aw-report-thanks` (triage UI or runner).
- **P7-A (runner):**
  - It reads an optional `attack.layout` (needs a schema entry in P7-D or P7-N).
  - The stage-intro text is fixed English in `STAGE_COPY`. An optional `strings.stageIntro` would need schema support.
  - Its mail launch params are `{ accountIds, defaultAccount, maxSends: 1, layout? }`, which P7-G must honour.
  - The flip needs the defend set's `playerSentAuth.accounts.analyst` (P7-E content).
- **P7-C:** the `se_awareness_records` block shape is for P7-O to document.
- **P7-D, for P7-N and P7-J:**
  - The triage `unlaunched` lint warns about episode defend sets; teach it about `awarenessEpisode.defend.setId`.
  - Episode defend sets omit `stage`, so the passPercent-0 warning doesn't fire. Either keep that, or exempt episode sets.
  - The defendOnly prefix doubles to `episode_e1_invoice_fraud_defend_defend_`; decide whether to drop the doubled suffix.
  - `test_social_episode` fails strict only on the missing `kiosk.png`, which is P7-H's.
  - The lint wants 5–8 defend messages (the packet row said 2).
- **P7-E, for P7-J, P7-N and the orchestrator:**
  - The defendOnly shell must change the set prefix to `..._defend_defend_`.
  - The defend-only brief and scopeNote are in `awarenessEpisode._defendOnly`; P7-J copies them into `strings`.
  - The P7-B views also read `heading`, `finish` and `continue` strings, which are not in the schema (P7-N decides whether to add them).
  - The Monday card is generic until a report-route slot exists.
- **P7-M, for P7-W3 and P7-X:**
  - Register `authenticator` and launch it from the runner's `mfa` stage via `socialOverlayParams({ pushes, approvesAt, mode })`. It must pass `requiresKeyboardInput` and `disableClose`.
  - Add a CSS link for `authenticator-minigame.css`.
  - The lint shape is `pushes[{at, app, account, location, device}]` plus `approvesAt`, where `at` is "HH:MM" or a number.
  - The optional "Send another push" button counts towards `sent`.
- **P7-G:** `sentIds` and its new test fields appear only in episode mode (`maxSends`, a phone layout, or carried ids).
- **P7-L:** its schema fields went to P7-N. The Report-button animation was left for P7-I.
- **P7-F, for P7-K and P7-O:**
  - **Target and sender:** the target `supplier_contact` is the recipient Adaeze Okafor, the finance manager. The spoofed sender is Derek Mason, Harlow.
  - **Globals the shell must declare:** `se_intel_brightwell_finance_manager`, `_harlow_supplier_contact`, `_brightwell_open_invoice`, `_brightwell_quarter_end`, `se_osint_state`, `phish_supplier_contact_landed` and `_attempts`. Something must read `_landed`.
  - **New slot type:** `reference`.
  - **Tells:** a good send stores `[senderTrust, urgencyCalibrated]`. The channel tells (`changed_bank_details`, `secrecy_or_bypass`) are on the defend side only.
- **P7-N:**
  - The doubled defendOnly prefix is kept, because it matches `defendPrefix()`.
  - The optional strings (`stageIntro`, `heading`, `finish`, `continue`) are NOT in the schema until the runner and views read them.
  - `attack.layout` (phone) is in.
- **P7-X, for P7-P, P7-W3 and P7-S:**
  - `mfa` must sit after `write` or after `flip`. Pass `episode.mfa` `{pushes, approvesAt, mode}` to the authenticator.
  - The call conversion copies `notes` into `truth` (`perFlagNote`, `whyFine`).
  - Claims resolve against every `pretextNpcs` `knows` id, unless `defend.callsFrom` names one call.
- **P7-V, for P7-Y1, P7-Y2, the runner and P7-O3:**
  - **Prefix:** the E5 defend-only prefix is `episode_e5_signin_pages_defend_defend_`.
  - **Ids:** `e5_signin_pages`, `e5_links_inbox`, `general_form_a` and `general_form_b`.
  - **Flip view:** E5's flip shows a built page, not an email, so the flip view needs a page path.
  - **Red flags:** "session expired" and "password manager didn't fill in" are not library tells, so they are left out of the chips. They would need adding to `00` §2 and `triage-flags.js` to become scored chips.
- **P7-U: GAP, the runner has no build stage.** E5's attack needs the landing-page builder between OSINT and write, but the runner's child launches cover only OSINT, mail and triage. Add a `build` stage (launch `landing-page-builder` with the episode's `landingPageId` and target) in the runner (P7-P or a new packet), with schema and lint (stage order `osint` → `build` → `write`), before P7-Y2.
  - **Globals the E5 shell must declare:** `phish_sso_staff_landed` and `_attempts`; `se_intel_quayholt_sso_portal`, `_it_desk`, `_sso_migration` and `_staff_claims`; `landing_sso_login_built` and `_domain`.
  - **Tells:** a good send stores the landing tells `domain`, `formOrigin` and `hoverMismatch`, plus `senderTrust` and `linkCredible`.
- **P7-Q, for P7-S, P7-P, P7-Y2 and P7-X:**
  - **The `knows` ids P7-S must use:**
    - `who` (`gordon_full`)
    - `team` (`claims`)
    - `manager` (`okonkwo_full`)
    - `staffId` (`gordon_staffid`)
  - **The attack-to-defend tell map:**
    - `name_drop_director` → `borrowed_authority`
    - `cant_callback` → `vish_callback_pressure`
    - `skip_verification` → `secrecy_or_bypass`
    - the push stream → `unrequested_mfa_push`
  - **Character:** the helpdesk character is `leila`, Leila Nassar. The learner attacks her, then sits in her seat for the defend.
  - **GAP, two mismatches the runner and schema must reconcile before P7-Y2:**
    - **Call stage:** E3's attack is a pretext call, but its stage list uses `write`, which launches mail. The runner needs a call stage that launches pretext-prep with the episode's `callId`, or `write` has to choose mail or call from the attack block.
    - **Naming:** P7-Q authored `attack.pushStream`, while P7-X's schema has `awarenessEpisode.mfa`. Pick one; `mfa` is the one validated now.
  - **Order:** together with P7-U's `build` gap, the runner needs `osint → build? → write(mail|call) → mfa? → flip → defend → debrief`.
- **P7-I:**
  - `strings.facilitator` is `{ <stageId>: string, pause: string }`. It needs a schema entry before a facilitated shell validates.
  - The flip shows "You did not send a message this time" after a send that missed. It needs its own string (`flipMissed`).
  - The Report animation belongs in the triage overlay: add `aw-report-win` and `aw-report-thanks`.
  - `se_awareness_records` is an array, but shells declare it as `{}`. The reader accepts both; docs to say so.
  - The P7-I bridge is in scratch (`se-P7-I/bridge-p7-i.jsonl`) for P7-T0 to adopt.
- **P7-J: lint gaps for the next validator pass (P7-X2):**
  1. Exempt the `setGlobalPrefix` and `PRE_NAMES` names (for example `triage_pre_reportRate`) from the carry-over name lint.
  2. The `clean_check_post` fixture declares names it also imports, which the validator rejects as a collision.
  3. `runs_as_post?` must see a kiosk check whose `defend.stage` is post.
  4. Check missions need three lints: the set's `stage` must equal `defend.stage`; the set must have no `pairedWith` partner in the same game; a pre export must not be redeclared on the post side.
  5. `variant` should be optional on check missions.
  6. The lint wants `se_awareness_records` declared `{}`, but the store writes `[]`. Accept `[]`, and make the shells declare `[]`.
  7. Awareness shells should be exempt from the conclusionScreen warning. Decide this against the user's ending rule: does a training episode end in credits?
- **P7-J, other notes:**
  - **Runner minors:** the defend stage says "on the receiving end" on a defend-only run, and the Finished panel shows two Close buttons.
  - **Kiosk text:** it still says "Five messages are waiting" after the round is done.
  - **Cast:** Graham Whitfield and Farah Qureshi go into BRAND_SET.
- **P7-W3:** `window.startAuthenticator(params)` is wired. In one run the Mission Brief showed after Esc closed the overlay; check this when the runner launches it. Use a fresh game for each run.
- **P7-P, the schema and lint needs for the next validator pass (P7-X2, after the success-screen agent finishes with the schema):**
  - **Stages:** a `build` stage, ordered osint → build → write, with `attack.landingPageId`, which names a landingPages id whose `targets` contains `attack.target`.
  - **Call attacks:** `attack.callId` must be a pretextNpcs callId. When it is set, the mail account fields aren't needed.
  - **Strings:** `strings.flipMissed`, `flipPageIntro`, `flipCallIntro` and an optional `continue`. Also `strings.facilitator {stage: string, pause: string}`.
  - **Claim labels:** an optional warning when a `defend.calls` claim value has no intelFacts `provides` label.
  - **Shell globals:** E5 shells declare `se_landing_pages: {}` and `landing_<id>_built` and `_domain`. E3 shells declare `pretext_<callId>_outcome` and `_state`.
  - **Known gaps left:**
    - The call watcher waits if a second call ends with the same outcome; opening the kiosk resumes anyway.
    - "Try the other set" inside an episode drops the calls.
- **P7-Y2:**
  - Use `awarenessEpisode.mfa`, not `attack.pushStream`.
  - E3 sets `attack.callId` and keeps `write` in its stages.
- **P7-Y1:**
  - **Decision (orchestrator), the defendOnly E3 claims gap:** each `defend.calls[].claims[]` entry may carry its own `label`. The lint resolves claims against `pretextNpcs` `knows` when the shell has them. In a defendOnly shell without them, it requires a `label` on each claim and skips `callsFrom`. `role-swap.js` prefers `claim.label`, then the intelFacts label. P7-S's defend.json and the E3 defendOnly shell get labels added.
  - **Strings:** the runner's fixed defend text ("Go through the inbox…") reads wrongly for page and call sets. It needs a per-set or per-episode `strings.defendIntro`.
  - **Generator drift:** `gen_e1_shells.py` still redeclares the imported names on post shells, which the committed shells don't. Fix it with the conclusionScreen change.
  - **conclusionScreen:** all ten Y1 shells need the training success screen, through `gen_e3_e5_shells.py`.
- **E7 attack (wave 4):** the cloned-voice call script is modelled as an unscored mail write. A faithful E7 needs two things:
  - a voice-script stage;
  - audio flip playback (`flipAudioClipId: vo7_ceo_clone`).

  Both depend on the held audio items (P7-Z1, P7-Z2). The E7 full shell waits for the user's audio decision. Its defend-only shell and check missions can go ahead with transcripts.
  - **Globals the shell must declare:** `se_intel_brightwell_ceo`, `_ceo_travel`, `_payments_clerk`, `_open_payment`, `se_osint_state`, `phish_ceo_voice_target_landed` and `_attempts`.
  - **Not validated yet:** this fragment has had no validator run.
- **E7 defend:**
  - **Ids:** the episode is `e7_voice_ceo`. The attack fragment pins `ceo_voice_target` as its target, but no episode id, so the shell uses `e7_voice_ceo`.
  - **Checks:** E7's role is everyone, so it gets no checks of its own; it reuses `general_form_a` and `_b`.
  - **Lint:** the full-episode lint must allow E7's unscored script attack. Relax it for `scored: false`, or wait for the voice-script stage.
  - **Library:** no tell exists for "voice alone is not proof", or for urgency on non-email items.
