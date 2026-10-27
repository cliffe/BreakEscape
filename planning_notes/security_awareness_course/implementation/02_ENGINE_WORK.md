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

**Decision: a new stage id, `guess`. Do not reuse `build` with a new builder.** Here is how `build` and `mfa` are wired, and why reusing them would break things:

- `build` is bound to the landing-