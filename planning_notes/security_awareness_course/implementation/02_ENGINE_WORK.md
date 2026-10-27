# Engine packets for E8 to E17

Each packet is self-contained and sized for one Sonnet agent run (`general-purpose`, `model: "sonnet"`). An engine design question a packet does not settle goes to an Opus agent first (`00_README.md` §6). The packets were derived from the episode needs in the module designs (`../modules/<module>/game_design.md`) and checked against the code on 2026-10-27. Where a packet and the code disagree, the code wins: stop and report.

**Kind of game:** the awareness product (`00_README.md` §1). The same engine also runs the student lab (`scenarios/lab_social_engineering`), the `test_social_*` scenarios and the SAFETYNET missions, so every packet below is opt-in.

## How every packet is guarded

1. **Opt-in on a new key or stage id.** The new behaviour runs only when a scenario authors the new key, stage id or message kind. With the key absent, the old code path runs unchanged. Each packet's tests include a "without the key, the output is exactly as before" case.
2. **Stage ids are authored, never defaulted.** `stagesFor()` in `episode-model.js` keeps only authored ids that are in `STAGE_IDS`, so a new id changes nothing for the 38 built shells and `test_social_episode`. `DEFAULT_STAGES` is never changed.
3. **New attack stages join `ATTACK_STAGES`,** so a `defendOnly` shell drops them whatever is authored (`stagesFor`, the `variant === 'defendOnly'` branch).
4. **Schema and validator in the same packet** (ENG-08 lists them all). `socialAwarenessEpisode` and `socialTriageSet` in `scripts/scenario-schema.json` are `"additionalProperties": false`, so a key the schema lacks fails `--strict-social`.
5. **Fixtures, not live content.** Tests build fixtures (in `test/js/fixtures/social_awareness/` or inline). No test reads `scenarios/awareness_e*` except the two existing guards (parity and rule of thumb).

## Standard engine acceptance (every packet)

Run from the repo root. The packet's own acceptance adds to this list.

```
node --test test/js/<the packet's new test files>
bundle exec bin/test-js -j 4                                        # whole test/js suite, every file passes
for f in scenarios/awareness_*/scenario.json.erb scenarios/lab_social_engineering/scenario.json.erb scenarios/test_social_*/scenario.json.erb; do
  bundle exec ruby scripts/validate_scenario.rb "$f" --strict-social --no-graph --skip-ink >/dev/null || echo "FAIL $f"
done                                                                # no FAIL line
node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json   # passes
bin/rails test                                                      # passes
export NODE=$HOME/.cache/ms-playwright-go/1.57.0/node              # Node 24: "$NODE" --version prints v24.x
for b in e1-full e2-full e3-full e4-full e5-full e6-full e7-full p7-channels p7-episode 6 r4-door; do
  ONLY="$b" tools/playtest/se/run-suite.sh tmp/eng-$b             # one at a time, keyless :3001
done                                                                # every table.md says PASS
git status --porcelain scenarios/                                   # nothing, unless the packet says so
```

Bridges `6` and `r4-door` run `lab_social_engineering`. `p7-episode` runs `test_social_episode`. Together they show that the lab and the runner's own test scenario still work.

## Packet index

| Packet | For | Touches shared code used by the lab or SAFETYNET? |
|---|---|---|
| ENG-01 flip aftermath: the victim's seat | E8, E9 | no (episode runner only) |
| ENG-02 password guessing stage `guess` | E9 | no |
| ENG-03a triage `page` states | E10, check forms | yes: `triage-kinds.js` (guarded by new optional keys) |
| ENG-03b check-page builder | E10 | yes: the landing-page renderer (guarded by `pageType`) |
| ENG-04 consequence sandbox stage `sandbox` | E11, E15, E16 (E14 optional) | no |
| ENG-05a world stage `world` | E12 | no |
| ENG-05b costume | E12 | yes: `core/player.js`, `utils/player-avatar.js` (guarded: a new function, existing ones unchanged) |
| ENG-05c lobby, door and NPC door opening | E12 | no engine change expected (authoring with built features) |
| ENG-05d package-carry sprite state | E12 | art only |
| ENG-05e real `#trigger_minigame` | E12 if needed | yes: `chat-helpers.js` (guarded by an allow-list) |
| ENG-06 authored assistant stage `assistant` | E13 | no, apart from two optional email-card keys in `triage-kinds.js` |
| ENG-07 configurable video-call label | E13 | yes: person-chat, used by m02 (guarded: the default stays "SECURE VIDEO LINK") |
| ENG-08 schema and validator | all | yes: schema and `validate_social/awareness.rb`, `triage.rb` |
| ENG-09a authored-choice triage kind `choice` | E9, E11, E14 to E17, check forms | yes: triage (guarded by the new kind) |
| ENG-09b debrief panel list | E8 and any episode with more than one panel | no |
| ENG-09c in-person triage kind `person` | E12, physical check items | yes: triage (guarded by the new kind) |
| ENG-09d shell-count and parity-list guards | every episode | tests only |

---

## ENG-01 Flip aftermath: the victim's seat, where the account is in use (E8)

**Goal.** After the learner's phish lands, the flip shows the message from the recipient's side (built), then puts the learner "in the seat of the person whose account is now being used" (`../modules/core_04_spotting_and_reporting_incidents/game_design.md`, Flip). It shows the first odd sign, for example a sent-items entry they did not write. E9 reuses the same part for its prompt flood.

**Read first.** `public/break_escape/js/minigames/episode-runner/flip-view.js` (whole file); `episode-runner-minigame.js` `_flipProps()` and `_renderFlip()`; `episode-model.js` `cleanSent()`; `step-strip.js` `STAGE_LABELS`; `inbox-triage/triage-kinds.js` `renderKindSurface()`.

**Depends on.** Nothing. ENG-08 adds the schema entries in the same change.

**Current code.**

- `flip-view.js` `renderFlipView(container, { message, page, call, missed, landedNoTells, templateId, strings, onContinue })` draws up to three parts (`parts.push('message' | 'page' | 'call')`). It has no part for "what happened next".
- `episode-runner-minigame.js` `_flipProps()` returns `{ message, page, call: null, missed, landedNoTells }` for a mail send. It returns `missed: true` when `rec.landed === false`.
- `_stripLabels()` overrides only the call case: `return writeKind(this.episode) === 'call' ? { flip: 'The call' } : undefined;`.

**What `flip-view.js` supports today:** the sent email (in the read-only `MailReader`), a built page (`renderLandingPage` or the triage `page` card), and a call transcript with notes. It has no victim-side view and no list of follow-on signs.

**Change.**

1. New optional episode key `awarenessEpisode.flipAftermath` (episode level, not in `strings`, so the parity test needs no allow-list entry and the defend-only generator never copies it):

   ```json
   "flipAftermath": {
     "heading": "Now you are Kieran, and it is ten past three",
     "intro": "Kieran clicked the link and typed his password. Here is his account a few minutes later.",
     "items": [
       { "id": "fa_sent", "kind": "email", "folder": "sent", "to": "...", "subject": "...", "time": "15:08", "note": "Kieran did not write this." },
       { "id": "fa_push", "kind": "push", "push": { "app": "...", "account": "...", "location": "...", "device": "..." }, "note": "..." }
     ],
     "line": "Most of the damage happens between noticing and reporting."
   }
   ```

   `items[].kind` is `email` (drawn as one read-only sent-items row: folder, to, subject, time and the `note`; no body, no link) or any `NON_EMAIL_KINDS` kind (`sms`, `voicemail`, `qr`, `page`, `call`, `push`), drawn with `renderKindSurface(rec, { showNote, showLink, bodyNode })` as the flip already does for a page. Every string goes in with `textContent`.
2. `flip-view.js`: accept `aftermath` in the props. When it is an object with at least one valid item, after the message, page and call parts and before the defender line, draw a section `.aw-flip-aftermath` with an `h3` (`heading`), a `p.aw-lead` (`intro`), one `.aw-aftermath-item` per item (with `data-id`) and `p.aw-aftermath-line` (`line`). Push `'aftermath'` onto `parts`, so that `getState()` reports it.
3. The aftermath shows only when the attack landed: never with `missed`, never with `landedNoTells`, never with `noSend`. In `_flipProps()`, add `aftermath: this.episode.flipAftermath` only when `message || page` is present and `rec?.landed !== false`. ENG-02, ENG-05a and ENG-06 call the same helper with their own landed test.
4. Put the "landed" decision in a pure helper in `episode-model.js`: `flipAftermathFor(episode, { landed })` returns the block or null. The runner and the tests both use it.
5. Step labels: new optional `awarenessEpisode.stepLabels` (`{ <stageId>: string }`). `_stripLabels()` returns the call default merged with it (authored wins), so E8 can label its flip "The click". The built shells author none, so they are unchanged.

**Tests to add.** `test/js/social-episode-aftermath.test.mjs`, in the jsdom style of `test/js/social-episode-views.test.mjs` (copy its module-staging block):

- with `aftermath` absent, `renderFlipView` gives the same `getState()` as today for the message, page, call, missed and noSend fixtures;
- with `aftermath` and a message, `parts` is `['message', 'aftermath']`, one `.aw-aftermath-item` per item, and the email row shows no body;
- with `missed: true` and `aftermath`, no `.aw-flip-aftermath` is drawn;
- `flipAftermathFor` returns null for `landed: false` and for an episode with no block;
- `stepLabels` overrides `flip` and keeps the call default when not overridden.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-aftermath.test.mjs test/js/social-episode-views.test.mjs test/js/social-episode-runner.test.mjs`. Expected: all pass, and `git status --porcelain scenarios/` is empty.

**Episodes that depend on it.** E8 (its flip), E9 (the prompt flood after a landed guess), and E13 optionally.

**Shared code paths.** Episode runner only. The lab and SAFETYNET never open the runner.

**Do not break.** The E1 to E7 flips (bridges `e1-full` to `e7-full` assert `.aw-flip` and the tells); the `flipDefenderLineByChoice` line (aw2); `test_social_episode` (`p7-episode`).

**Stop and ask if.** The E8 brief needs the aftermath items to be scored. They are not: the flip is unscored. Scored signs belong in the defend set.

---

## ENG-02 Password guessing stage `guess` (E9)

**Goal.** E9's attack half: the learner assembles guesses for a fictional colleague from facts found in OSINT, an authored "guesser" strikes each one through in the order attackers try them, a reused hobby-site password works, and a three-random-words passphrase is still being tried when the rig is switched off (`../modules/core_03_passwords_and_mfa/game_design.md`, E9 attack half). Nothing typed is a password. Every guess is authored data, and the view shows no tool and no method.

**Read first.** `episode-model.js` (`STAGE_IDS`, `ATTACK_STAGES`, `childLaunch`, `cleanSent`, `flipPage`); `episode-runner-minigame.js` (`_render`, `STAGE_COPY`, `_launch`); `scripts/validate_social/awareness.rb` (`STAGES`, `stage_orders`, `BUILD_AFTER`, `call_and_page_checks`); `public/break_escape/js/systems/social-intel.js`.

**Depends on.** ENG-01 (the flip shows the flood through `flipAftermath`). ENG-08 adds the schema and validator rules in the same change.

**Decision: a new stage id, `guess`, not a reuse of `build` or `mfa`.**

> **Not yet written.** The rest of ENG-02, and the packets ENG-03a to ENG-09d, are still to write. The packet index above gives the planned shape of each.

---

## ENG-10 The core_00 first-play brief and completion (WP-12)

**Goal.** Support the core_00 first-play episode described in `11_WP12_FIRST_PLAY_AND_ANNUAL.md`: a brief-only episode (`"stages": ["brief"]`) that shows a short sequence of "how it works" cards, ends on a "Got it" button, is shown only once per learner, and writes a clean done global when it finishes.

**Read first.** `public/break_escape/js/minigames/episode-runner/episode-runner-minigame.js` (`_renderBrief`, `_renderFinished`, `_saveState`, `_complete`); `episode-model.js` (`stateKey`, `defendPrefix`, `completeStage`); `scripts/validate_social/awareness.rb` (`stage_checks`, `STAGES_BY_VARIANT`); `11_WP12_FIRST_PLAY_AND_ANNUAL.md`.

**Depends on.** Nothing. The schema and validator changes are part of this packet (ENG-08 rule).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code (WP-12 writer's findings, confirmed here).**

- `_renderBrief()` draws one panel: the heading (`ep.brand?.name`), `strings.brief`, an optional `scopeNote` and a single "Start" button that calls `this._complete('brief')`. It has no multi-card sequence, no "Got it" gate and no once-per-learner gating.
- `_renderFinished()` draws "Finished" and writes nothing.
- `_saveState(state)` writes only `episode_<id>_state`. The only done global any episode gets is `episode_<id>_defend_done`, and the triage starter writes it, not the runner. So an episode with no triage stage has no completion global for an objective's `concludeRequires` or a host's event mapping.
- The validator accepts only the `full` and `defendOnly` stage lists (and `["check"]` for a check mission). So `"stages": ["brief"]` is rejected today.

**Stopgap (no engine change).** A host NPC event mapping on `global_variable_changed:episode_core_00_first_play_state` can complete the task when the stored state's `done` includes `brief` (`"condition": "value && Array.isArray(value.done) && value.done.includes('brief')"`). This still needs a validator allowance for `["brief"]`. Use it only if ENG-10 is not ready.

**Change.**

1. **Multi-card brief.** New optional `strings.briefCards`: an array of `{ heading?, text }` (plain text; a blank line starts a paragraph, as `buildPanel` in `debrief-view.js` does). When present, `_renderBrief()` shows one card at a time with "Next" and "Back" buttons and a "Card n of m" line. The last card's button is "Got it" (or `strings.briefDone` when set). Without `briefCards`, `_renderBrief()` is exactly as today.
2. **Completion global.** New optional `awarenessEpisode.doneGlobal` (a global name the scenario declares, for example `episode_core_00_first_play_done`). When the episode reaches its last stage (`state.stage` becomes null in `_complete`), the runner writes `doneGlobal = true` through `this.deps.write`, with `{ openChat: false }`, as `_saveState` does. Episodes without the key write nothing new, so the 38 built shells are unchanged.
3. **Once per learner.** New optional `awarenessEpisode.oncePerLearner: true`. When the done global is already true at `init()`, the runner goes straight to `_renderFinished()` with a "You have seen this already" line (`strings.alreadySeen`, with a default). Cross-mission carry-over (so another mission knows it was seen) uses the built `exportGlobals` on the doneGlobal, and needs no engine change.
4. **Validator and schema (`scripts/validate_social/awareness.rb`, `scripts/scenario-schema.json`).** Allow `"stages": ["brief"]` for a new `"variant": "brief"`, or accept it on a full episode only when `doneGlobal` is set. Prefer the new variant, because it keeps the attack checks off. Add `doneGlobal`, `oncePerLearner` and `strings.briefCards`, `strings.briefDone` and `strings.alreadySeen` to the schema. Lint that `doneGlobal` is declared in `globalVariables` and that `briefCards` is a non-empty array of objects with non-empty `text`.

**Tests to add.**

- `test/js/social-episode-brief-cards.test.mjs` (jsdom, in the style of `social-episode-runner.test.mjs`): without `briefCards` the brief panel is unchanged; with three cards Next and Back move between them and "Got it" completes `brief`; `doneGlobal` is written once when the last stage completes and never for an episode without the key; `oncePerLearner` with the global already true renders the finished panel.
- Extend `test/js/validator-social-awareness.test.mjs` with a clean brief-only fixture (`test/js/fixtures/social_awareness/clean_brief_only.json`) giving no issues, and failing cases for a missing `doneGlobal` declaration and an empty `briefCards`.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-brief-cards.test.mjs test/js/validator-social-awareness.test.mjs`. Expected: all pass, and `git status --porcelain scenarios/` is empty.

**Episodes that depend on it.** The core_00 first-play episode (WP-12). Optionally, the core_17 annual edition's intro.

**Shared code paths.** Episode runner and the awareness validator only. The lab and SAFETYNET never open the runner.

**Do not break.** Every built brief (the bridges `e1-full` to `e7-full` click "Start" on the brief); `test_social_episode` (`p7-episode`); the check missions (`["check"]` stays as it is).

**Stop and ask if.** WP-12 wants the first-play brief to be scored or recorded in `se_awareness_records`. It should not be: it is a brief.
