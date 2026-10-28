# Engine packets for E8 to E17

Each packet is self-contained and sized for one Sonnet agent run (`general-purpose`, `model: "sonnet"`). An engine design question a packet does not settle goes to an Opus agent first (`00_README.md` §6). The packets were derived from the episode needs in the module designs (`../modules/<module>/game_design.md`) and checked against the code (the line and symbol anchors below were re-read on 2026-10-28). Where a packet and the code disagree, the code wins: stop and report.

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
| ENG-02b organisation-scale `guess` modes (`spray`, `stuff`) | E18 | no |
| ENG-03a triage `page` states | E10, check forms | yes: `triage-kinds.js` (guarded by new optional keys) |
| ENG-03b fake-check builder mode (`pageType: "fakeCheck"`) | E10 | yes: the landing-page model, renderer and `flipPage` (guarded by `pageType`) |
| ENG-04 consequence-flip `mistake` stage + montage flip | E11, E15, E16 | no |
| ENG-05a world-play modifier `world` (not a new stage id) | E12 | no |
| ENG-05b costume | E12 | yes: `core/player.js`, `utils/player-avatar.js` (guarded: a new function, existing ones unchanged) |
| ENG-05c lobby, door and NPC door opening | E12 | no engine change expected (authoring with built features) |
| ENG-05d package-carry sprite state | E12 | art only |
| ENG-05e real `#trigger_minigame` | E12 if needed | yes: `chat-helpers.js` (guarded by an allow-list) |
| ENG-06 authored assistant overlay (runs in the flip region; no new stage id) | E13 | no, apart from two optional email-card keys in `triage-kinds.js` |
| ENG-07 configurable video-call label | E13 | yes: person-chat, used by m02 (guarded: the default stays "SECURE VIDEO LINK") |
| ENG-08 schema and validator | all | yes: schema and `validate_social/awareness.rb`, `triage.rb` |
| ENG-09a authored-choice triage kind `choice` | E9 password cards, check-form choice items | yes: triage (guarded by the new kind) |
| ENG-09b debrief panel list | E8 and any episode with more than one panel | no |
| ENG-09c in-person triage kind `person` | E12, physical check items | yes: triage (guarded by the new kind) |
| ENG-09d shell-count and parity-list guards | every episode | tests only |
| ENG-10 brief-only episode + completion global | core_00 first play (WP-12) | episode runner + awareness validator only |
| ENG-11 reusable sort drill (N bins + answer key) | E14 "Post or Not?", E15 Swap Shop, E17 "can I?" | no (a new overlay; built triage untouched) |
| ENG-12 "raise a concern" fact-chip form | E16 | no (a new overlay) |
| ENG-13 privacy-settings panel over the OSINT board | E14 | yes: osint-browser / intel-board (guarded by a new optional key) |

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
     "victimName": "Kieran",
     "intro": "Kieran clicked the link and typed his password. Here is his account a few minutes later.",
     "items": [
       { "id": "fa_sent", "kind": "email", "folder": "sent", "to": "...", "subject": "...", "time": "15:08", "note": "Kieran did not write this." },
       { "id": "fa_push", "kind": "push", "push": { "app": "...", "account": "...", "location": "...", "device": "..." }, "note": "..." }
     ],
     "line": "Most of the damage happens between noticing and reporting."
   }
   ```

   All fields are authored inline at episode level. The optional fields are: `heading` (the section title), `victimName` (the colleague whose account is now in use, so the view can name them in its own labels without the episode repeating the name in `strings`; drawn with `textContent`), `intro` (the lead line), `items[]` (the follow-on signs) and `line` (the closing line). `victimName` and `intro` carry everything E8 needs to re-seat the learner "in the victim's seat"; no `strings` entry is used.

   **E8's "first odd sign" maps onto `items[0]`, not onto a defend-set id.** E8 earlier proposed `flip.firstSign` pointing at a defend-set message; that shape does not exist. Instead E8 authors the opening sign inline as `items[0]` of `kind: "email"`, `folder: "sent"`, reconstructed from the sent record (to, subject, time, note), with no `body` and no link. A sign may also appear as a defend item, but with a different id and its own inline copy: the flip item and the defend item never share an id.

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

`build` today launches the landing-page builder (`childLaunch`, `episode-model.js:187`), so reusing `build` would open the wrong child. `mfa` opens the authenticator. Neither fits an authored guesser. A new id `guess` keeps both intact and is dropped from a `defendOnly` shell automatically (point 3 below).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Scope line.** ENG-02 owns the **attack-half** guesser/reuse rig only. E9's **defend-half** password-practice cards (E9 §11 rows 4 to 7) are authored decisions inside the scored triage set and are delivered by the `choice` triage kind in **ENG-09a**, not here. This packet does not touch the triage defender.

**Content level (hard rule, carried from the user's decision).** The guesser is an authored, abstract model of guessing and reuse, at the build's level, exactly as the landing-page builder is "a scored model, never a working page". No real password is ever typed or stored. No password list, cracking tool, command, rule syntax or working technique appears. Every guess, every strike-through and every line of reasoning is authored data drawn from the collected OSINT facts and from game words. The view shows no tool and no method. A line on screen says so (`strings.guessNote`, drawn into the surface).

**Current code.**

- `STAGE_IDS` (`episode-model.js:27`) is frozen at `['brief','osint','build','write','mfa','flip','defend','debrief','check']`; `ATTACK_STAGES` (`:28`) is `['osint','build','write','mfa','flip']`; `DEFAULT_STAGES.full` (`:32`) is `['brief','osint','write','flip','defend','debrief']` (no `build`, no `mfa`).
- `stagesFor` (`:60`) keeps only authored ids that are in `STAGE_IDS`, drops any `ATTACK_STAGES` id for a `defendOnly` variant (`:68`), and otherwise preserves authored order.
- `childLaunch` (`:180`) has no `guess` branch, so a `guess` stage would draw nothing and the runner would call `_renderFinished` for it (`episode-runner-minigame.js:336`).
- The validator pins the full stage list exactly: `awareness.rb` `STAGES` (`:18`) lists the nine ids; `STAGES_BY_VARIANT['full']` (`:20`) is `brief osint write flip defend debrief`; `stage_orders` (`:157`) allows only that order with `build` inserted after `osint` and/or `mfa` after `write`/`flip`. There is no order that ends `osint -> guess -> flip` with no `write`, so E9's `["brief","osint","guess","flip","defend","debrief"]` is rejected today (E9 §7, §19). ENG-08 relaxes this.
- `flipAftermathFor` (ENG-01) already lets the flip show a prompt flood after a landed guess; E9's flood reuses the built authenticator watch-only shape, so no new flip engine is needed (E9 §10).

**Change.**

1. **New stage id `guess`.** Add `'guess'` to `STAGE_IDS` and to `ATTACK_STAGES` (so a `defendOnly` shell drops it without any extra code, `stagesFor:68`). Do not change `DEFAULT_STAGES`: the 38 built shells and `test_social_episode` author their own stage lists and never name `guess`, so they are unchanged.
2. **New child launch.** In `childLaunch`, add a `guess` branch that returns `{ kind: 'guess', sceneType: 'password-guesser', params: { config: episode.guess ?? null } }`, guarded so it returns `null` when `episode.guess` is absent (a `guess` stage with no config then draws nothing, which the validator forbids, point 6). A new minigame module `public/break_escape/js/minigames/password-guesser/password-guesser-minigame.js` renders the rig from the config and, on close, writes a landed global (point 4). Register it in the minigame framework the way the other episode child scenes are registered (follow `landing-page-builder`); the runner launches it through `_launch` exactly as it launches `build` (`episode-runner-minigame.js:548`), completing the stage with `_completeWhileAway('guess')` on a normal close.
3. **Config key `awarenessEpisode.guess`.** The shape E9 passes (E9 §9), authored data only:

   ```jsonc
   "guess": {
     "target": "colin",                       // a social.people id, display only
     "commonList": ["123456", "password", "qwerty", "tarrowby"],   // shown struck through as "already tried"
     "patternSlots": [                         // each reads ONE collected OSINT fact (se_intel_<factId> true)
       { "id": "team", "factId": "tarrowby_mather_team", "template": "{team}1" },
       { "id": "pet",  "factId": "tarrowby_mather_pet",  "template": "{pet}!" }
     ],
     "reuseStep": {                            // the lever the flip leans on (aw2)
       "site": "RiverReach Angling", "domain": "riverreachangling.example",
       "factId": "tarrowby_mather_forum", "landsOn": "work",
       "note": "One breach of a small site opened the work account."
     },
     "passphraseDemo": { "words": ["otter","ladder","crimson"], "neverLands": true },
     "landedGlobal": "guess_e9_landed",        // written true when the reuse step lands
     "note": "No real password is typed here; every guess is made up."
   }
   ```

   The guesser assembles each pattern slot only from facts the learner actually collected (the slot's `factId` resolves to a true `se_intel_<factId>` global); an uncollected fact leaves its slot struck through as "not found". A slot's `template` interpolates **only the slot's own fact value**: the single token in the template (written as the slot `id` in braces, for example `{team}` or `{pet}`) is replaced by that fact, and any other characters are authored literals. Tokens never cross slots, so a template references one fact and nothing else. The common list is always shown struck through first. The reuse step "lands" (opens the work account in the authored view) and sets `landedGlobal`. The passphrase demo renders as "still being tried" and never lands.
4. **Landed global, reusing ENG-01.** On close the scene writes `config.landedGlobal = true` through the runner's write dep (as `_launchCall` writes state, `episode-runner-minigame.js:648`). `flipAftermathFor(episode, { landed })` (ENG-01) is called with `landed = globals[config.landedGlobal] === true`, so the prompt-flood aftermath shows only when the reuse step landed. The flip's own props come from `_flipProps`; add a `sent?.kind === 'guess'` branch there returning `{ message: null, page: null, call: null, missed: !landed }` so the flip narration matches (mirrors the mail/call branches).
   **`cleanSent` must learn the `guess` record, or the branch never fires.** `cleanSent` (`episode-model.js:81`) today keeps only a call record (`{ kind: 'call', callId, outcome }`) or a mail record (`{ recordId, targetId, templateId, blankIds }`); anything else is reshaped into an empty mail record. `readState` (`:129`) runs `src.sent` through `cleanSent` on every read, so a `{ kind: 'guess' }` record is discarded and `_flipProps`'s new `sent?.kind === 'guess'` branch is dead. So, in the same packet: add a `if (raw.kind === 'guess') return { kind: 'guess' };` branch to `cleanSent` (above the mail fallback, beside the `call` branch), and have the guesser record it with `_completeWhileAway('guess', { sent: { kind: 'guess' } })` on a normal close. `completeStage`/`readState` already pass the `sent` patch key through and the flip clears `sent` at `episode-model.js:160`, so no further patch-key change is needed for `guess`. Add a test that `readState(episode, { sent: { kind: 'guess' } }).sent` is `{ kind: 'guess' }`, not an empty mail record.
5. **Step label.** `guess` needs a strip label. Reuse ENG-01's `stepLabels` (`{ guess: "Guess list" }`); the built shells author none, so nothing else changes. `STAGE_COPY.guess` gets a launch-panel entry (`{ heading: 'Guess list', text: '...', button: 'Open the guesser' }`), matching the built entries' voice.
6. **Schema and validator (in ENG-08).** Add `guess` to the `stages` enum and to `awareness.rb` `STAGES`; add an `awarenessEpisode.guess` object to the schema (`additionalProperties: false`); add a `stage_orders` branch so a full episode may author `brief, osint, guess, flip, defend, debrief` (guess after osint, before flip, with no `write`); lint that a `guess` stage has a `guess` block, that `patternSlots[].factId` and `reuseStep.factId` name a declared `se_intel_*` fact, that `landedGlobal` is a declared global, and that nothing in the block looks like a credential field (no `password`/`secret` keys).

**Tests to add.** `test/js/social-password-guesser.test.mjs` (jsdom, copy the module-staging block from `test/js/social-landing-page-builder.test.mjs`):

- the common list renders struck through; no editable text field exists anywhere in the surface (assert no `input`/`textarea` of a password type);
- a pattern slot whose `factId` global is true assembles from the fact; one whose global is false renders "not found", struck through;
- the reuse step lands and sets `landedGlobal`; the passphrase demo renders and never lands;
- with `episode.guess` absent, `childLaunch(ep, 'guess')` returns `null` (opt-in guard);
- extend `test/js/social-episode-runner.test.mjs`: a full episode with `guess` advances `osint -> guess -> flip`; a `defendOnly` episode drops `guess` (`stagesFor` omits it).
- extend `test/js/validator-social-awareness.test.mjs` with a clean `guess` fixture and failing cases (a `guess` stage with no block; a `patternSlots[].factId` that is not a declared fact).

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-password-guesser.test.mjs test/js/social-episode-runner.test.mjs test/js/validator-social-awareness.test.mjs`. Expected: all pass, `git status --porcelain scenarios/` empty.

**Episodes that depend on it.** E9 (attack half only). The defend-only variant needs ENG-09a, not ENG-02: it has no `guess` stage (`guess` is an `ATTACK_STAGES` id, dropped from a `defendOnly` shell), and its password-practice cards are the ENG-09a `choice` kind.

**Shared code paths.** Episode runner and a new child scene only. The lab and SAFETYNET never open the runner and never author `guess`.

**Do not break.** The E1 to E7 attack stages (bridges `e1-full` to `e7-full`); the frozen `STAGE_IDS` order for the 38 shells; `test_social_episode` (`p7-episode`); the lab bridges `6` and `r4-door`.

**How it is guarded.** New stage id (authored, never defaulted, `stagesFor` guard); new `childLaunch` branch that returns `null` without the key; new schema key under `additionalProperties: false`; a new validator `stage_orders` branch that adds the guess order and removes none. No built shell authors `guess`, so every existing path is byte-for-byte unchanged.

**Stop and ask if.** The orchestrator wants the guesser in `build` after all (it would then clash with the landing-page builder; do not). Note the split for the E9 defend-only variant: it does not need ENG-02's `guess` stage (ENG-02 is attack-half only, and `guess` is dropped from a `defendOnly` shell), but it does need ENG-09a for the password cards.

---

## ENG-02b Organisation-scale guessing modes for the `guess` stage: spray and stuff (E18)

**Goal.** E18's attack half is the organisation-scale version of E9: instead of guessing one colleague's
password from his personal facts, the learner runs an authored campaign console against the **whole
practice**. The console harvests a staff roster from public sources (the team page names plus the email
address pattern), builds a candidate word list from the company's own website (project names, the
practice motto, place names, plus the season and the year), then shows two org-scale techniques as
authored, abstract models: **password spraying** (one likely password tried once against every account
in the roster, so no single account locks) and **credential stuffing** (a breach list of address and
password pairs tried automatically across many services, the ones that open being where a staff member
reused a breached password at work). A three-random-words passphrase account is still holding out when
the rig is switched off, to make the length-and-uniqueness point. Nothing typed is a password; every
account, word and pair is authored data and the view shows no tool, no command and no method. A line on
screen says so (`strings.guessNote`, as in ENG-02).

This packet **extends** the `guess` stage that ENG-02 adds; it does not add a stage id, a child scene or
a new stage order. It adds one optional selector, `guess.mode`, plus the `spray` and `stuff` config
sub-blocks, and the two org-scale views in the `password-guesser` minigame. It is guarded so that E9's
config, which carries no `mode`, is byte-for-byte unaffected (`mode` defaults to `target`, the E9 path).

**Read first.** ENG-02 (this file, the `guess` stage, the `password-guesser` minigame, the
`landedGlobal`/`cleanSent`/`_flipProps` wiring and all its line anchors); ENG-01 (`flipAftermath`, reused
for E18's flip the same way E9 reuses it); ENG-08 (schema and validator collection); `episode-model.js`
(`STAGE_IDS:27`, `ATTACK_STAGES:28`, `stagesFor:60`, `childLaunch:180`, `cleanSent:81`, `readState:129`,
`completeStage:153`, all verified 2026-10-28); `episode-runner-minigame.js` (`STAGE_COPY:79`, `_launch:548`,
`_completeWhileAway:656`, `watchCall:760`, `_flipProps:466`); `scripts/validate_social/awareness.rb`
(`STAGES:18`, `STAGES_BY_VARIANT:19`, `stage_orders:157`, `attack_checks:182`); `scripts/scenario-schema.json`
(`socialAwarenessEpisode` `additionalProperties: false` at `:31`/`:53`; the `guess` object is the one
ENG-02 adds, so `mode`/`spray`/`stuff` are added to **that** object, not a new one); `episodes/E18_credential_attacks_at_scale.md`
§9 (the content this config carries).

**Depends on.** **ENG-02** (the `guess` stage, the minigame, the `landedGlobal` wiring, `cleanSent`'s
`guess` branch; ENG-02b has nothing to build on without it). ENG-01 (E18's flip reuses `flipAftermath`,
exactly as E9 does; no new flip engine). ENG-08 collects the schema/validator additions (listed in the
"ENG-08 additions" block at the end of this draft; carry them here if ENG-08 has not landed).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Scope line.** ENG-02b owns the **attack-half** spray/stuff org-scale rig only, as two added render
modes of ENG-02's `guess` stage. It does **not** touch the triage defender: E18's defend half is ordinary
`email` and `page` triage cards (no `choice` kind), so ENG-02b does **not** depend on ENG-09a. It adds no
new stage id and no new stage order (E18 authors the same stage list as E9, which ENG-08 already allows
for ENG-02).

**Content level (hard rule, carried from the user's decision).** The spray and stuff views are authored,
abstract models at the build's level, exactly as ENG-02's single-target guesser is. **No real password
list, no breach dump, no tool name, no command, no rule syntax, no lockout threshold or timing, and no
working technique appears.** Spraying is explained only as the concept ("one likely password tried once
on every account, so no single account locks"); stuffing only as the concept ("a list of address and
password pairs from a breach of another site, tried automatically across many services"). Every candidate
password is a game word or an authored string drawn from the collected OSINT facts; every breach-list row
shows a masked password (`......`), never a value. The view shows no tool and no method.

### Decision: a `mode` selector on the existing `guess` block, not a new stage

ENG-02's `guess` stage renders one single-target guesser (E9). E18 needs the same stage to render an
organisation-scale campaign. Rather than add a second stage id (which would need a new `STAGE_IDS` entry,
a new `childLaunch` branch and a new validator stage order, all for the same conceptual stage), ENG-02b
adds an optional `guess.mode` that selects the render:

- `mode: "target"` (**default**, used by E9): the ENG-02 single-target guesser, **unchanged**. E9's
  `guess` block carries no `mode`, so it resolves to `target` and runs byte-for-byte as ENG-02 built it.
- `mode: "spray"` (used by E18): the org-scale campaign console (roster, word list, spray passes and the
  credential-stuffing panel).
- `mode: "stuff"`: a credential-stuffing-only console, for a future episode that wants stuffing without a
  spray. **E18 does not use this standalone mode**: its one artefact is the `spray`-mode console, which
  already shows the stuffing panel via `guess.stuff` (below), because the request groups spraying and
  stuffing as the one organisation-scale attack. `mode: "stuff"` is defined for completeness and renders
  the same `guess.stuff` panel on its own; building it is optional and E18 does not exercise it (mark it
  "ship only if a later episode needs it" if the implementer prefers to defer it).

The stage id stays `guess`; the child scene stays `password-guesser`; the stage order stays
`brief osint guess flip defend debrief` (ENG-08 already added it for ENG-02). So E18 adds **no** new stage
id and **no** new stage order: this packet is a render-mode extension only.

### Current code

- ENG-02 adds the `guess` stage to `STAGE_IDS`/`ATTACK_STAGES`, the `childLaunch` `guess` branch returning
  `{ kind: 'guess', sceneType: 'password-guesser', params: { config: episode.guess ?? null } }`, the
  `password-guesser` minigame that renders the single-target rig and writes `config.landedGlobal` on close,
  the `cleanSent` `guess` branch (`if (raw.kind === 'guess') return { kind: 'guess' };`), the `_flipProps`
  `sent?.kind === 'guess'` branch, the `STAGE_COPY.guess` launch panel, and the `guess` `stepLabels`
  default. Verified 2026-10-28: none of this is in `main` yet (`STAGE_IDS` at `episode-model.js:27` is still
  `['brief','osint','build','write','mfa','flip','defend','debrief','check']`, with no `guess`; `childLaunch`
  at `:180` branches only osint/build/write-or-call/mfa; `awareness.rb` `STAGES` at `:18` has no `guess`).
  So ENG-02 must land first; ENG-02b builds on its anchors.
- Without ENG-02b, the `password-guesser` minigame has one render path (single target). A `guess` block with
  `mode: "spray"` would have no renderer for the roster/word-list/spray/stuff panels.

### Change

1. **`guess.mode`, defaulting to `target`.** Where the `password-guesser` minigame reads `config` (the block
   ENG-02 passes through `childLaunch`), resolve `const mode = config?.mode ?? 'target';`. When `mode ===
   'target'` the minigame renders exactly the ENG-02 single-target rig and nothing in this packet runs. The
   resolution is the only line ENG-02's render path gains; everything below is additive, in new branches.
2. **`mode: "spray"` render (new branch).** The campaign console draws four authored panels in order, each a
   static authored block, every string via `textContent`, no editable field anywhere (assert no password-type
   `input`/`textarea`, as ENG-02's test does):
   - **Roster.** From `guess.roster`: the staff list is assembled from the two OSINT facts it names
     (`namesFactId`, the team-page names, and `patternFactId`, the address pattern), shown as a list of
     `firstname.lastname@<domain>` built from `roster.sample` and `roster.domain`. The panel's reasoning text
     (authored in `roster.note`) says the roster came from the public staff list and the address pattern, not
     from any password. If either fact's `se_intel_<id>` global is false (not collected), that half of the
     roster renders struck through as "not found", mirroring ENG-02's uncollected-fact behaviour.
   - **Word list.** From `guess.wordList`: each `slots[]` entry reads **one** collected OSINT fact by `factId`
     and interpolates the single brace token (named by the slot `id`, e.g. `{project}`) into its `template`,
     exactly as ENG-02's `patternSlots` do (one fact per slot, no cross-slot tokens, fixed characters are
     authored literals). The `seasonYear` strings are appended as authored literals (the season and year the
     attacker always tries). The assembled list is the candidate passwords, shown as the words the site gave
     up. `wordList.note` carries the on-screen line that these are built from the practice's own website words.
   - **Spray.** From `guess.spray`: each `passes[]` entry is **one** candidate password (either `fromSlot`,
     naming a word-list slot, or `literal`, an authored string such as a season-plus-year) tried **once**
     against **every** roster account in that pass. The panel animates the pass as one row per account with
     the single candidate, and marks `spray.opensCount` accounts as opening (authored; the accounts that used a
     company-word password). The reasoning text (`spray.note`) says one candidate is tried once per account, so
     no single account locks. No account is named as a careless person; the opened accounts are shown as a
     count (no-blame, E18 §12).
   - **Stuff.** From `guess.stuff`: an authored, abstract credential-stuffing panel. `stuff.rows[]` are masked
     rows (`label` plus a masked password `......`), each flagged `opens: true|false`; the true rows are where a
     staff member reused a breached password at work. The reasoning text (`stuff.note`) explains stuffing as a
     concept (a breach list of address and password pairs tried automatically across many services) and names
     the defence (a different password for every account). No real pair, address or password is shown.
   - A passphrase hold-out, reused from ENG-02's `passphraseDemo` shape if `guess.passphraseDemo` is present:
     a three-random-words account still being tried and never landing, to make the length-and-uniqueness point.
3. **`mode: "stuff"` render (optional branch).** Draws the Stuff panel alone (same `guess.stuff` renderer as
   spray mode, factored into one function). E18 does not use it; build it only if a later stuffing-only episode
   is scheduled.
4. **Landed global, reusing ENG-01 and ENG-02.** On a normal close the minigame writes
   `config.landedGlobal = true` through the runner's write dep and records the stage with
   `_completeWhileAway('guess', { sent: { kind: 'guess' } })`, exactly as ENG-02 does for the single target.
   The "landed" test is `spray.opensCount > 0 || any guess.stuff.rows[].opens` (some account opened). ENG-02's
   `cleanSent` `guess` branch, `_flipProps` `sent?.kind === 'guess'` branch and `flipAftermathFor(episode,
   { landed })` are reused unchanged: E18's flip shows its `flipAftermath` only when the campaign landed, the
   same path E9 uses. **No change to `cleanSent`, `_flipProps`, `watchCall` or the flip view is needed** beyond
   what ENG-02 already built: ENG-02b only adds render branches inside the `password-guesser` minigame.
5. **Step label and launch copy.** Reuse ENG-02's `STAGE_COPY.guess` and `guess` `stepLabels` default. E18 may
   override the strip label through ENG-01's `stepLabels` (`{ guess: "Campaign" }`) if the single-target
   "Guess list" label reads wrong for an org-scale console; the built shells author none, so nothing else
   changes. `STAGE_COPY.guess` already exists (ENG-02); its launch-panel text is kind-neutral, so no new
   `STAGE_COPY` entry is needed.
6. **Schema and validator (in ENG-08, or carry here if ENG-08 has not landed).** See the "ENG-08 additions"
   block below. In short: add `mode` (enum `target`/`spray`/`stuff`) and the `spray`/`stuff`/`roster`/`wordList`
   sub-objects to the `guess` object the ENG-02 schema adds (all optional, under `additionalProperties: false`);
   lint that `mode: "spray"` carries `roster`, `wordList` and `spray`; that `roster.namesFactId`,
   `roster.patternFactId` and every `wordList.slots[].factId` name a declared `se_intel_*` fact; that each
   `spray.passes[]` entry has exactly one of `fromSlot` (naming a real word-list slot) or `literal`; that
   `landedGlobal` is a declared global; and that nothing in the block looks like a credential field (no
   `password`/`secret` keys, and `stuff.rows[]` carry no password value, only a masked label). The existing
   ENG-02 lints (`patternSlots`/`reuseStep`) apply only when `mode` is `target` or absent; the spray/stuff
   lints apply only when `mode` is `spray`/`stuff`, so E9's block is linted exactly as ENG-02 lints it.

### Tests to add

`test/js/social-password-guesser-spray.test.mjs` (jsdom, copy the module-staging block from
`test/js/social-password-guesser.test.mjs`, the file ENG-02 adds):

- **E9 is unchanged:** a `guess` block with no `mode` (ENG-02's E9 fixture) renders exactly the single-target
  rig; `getState()` matches ENG-02's fixture byte-for-byte (the guard: `mode` defaults to `target`).
- the spray console renders the roster from the two named facts; a fact whose `se_intel_<id>` is false renders
  its half of the roster struck through as "not found";
- each word-list slot assembles from its one fact and interpolates only its own token; `seasonYear` literals
  are appended;
- a spray pass tries one candidate against every roster account and opens exactly `spray.opensCount`; the
  console shows a count, never a named careless person;
- the stuff panel renders masked rows and never a password value (assert no row shows an unmasked string from a
  password field; assert `navigator.clipboard.writeText` is never called);
- no editable password field exists anywhere in the spray or stuff surface;
- the campaign writes `landedGlobal` true when any account opens and false when none does;
- `mode: "stuff"` (if built) renders the stuff panel alone.

Extend `test/js/social-episode-runner.test.mjs`: a full E18-shaped episode with `guess` + `mode: "spray"`
advances `osint -> guess -> flip` and its flip shows `flipAftermath` only when `landedGlobal` is true (reusing
ENG-01's `flipAftermathFor`); a `defendOnly` shell drops `guess` (it is an `ATTACK_STAGES` id, `stagesFor:68`).

Extend `test/js/validator-social-awareness.test.mjs`: a clean `mode: "spray"` fixture; failing cases (a
`mode: "spray"` block with no `roster`/`wordList`/`spray`; a `wordList.slots[].factId` that is not a declared
fact; a `spray.passes[]` entry with both `fromSlot` and `literal`; a `stuff.rows[]` entry that carries a
password value).

### Acceptance

The standard engine acceptance (the block at the top of `02_ENGINE_WORK.md`), plus
`node --test test/js/social-password-guesser-spray.test.mjs test/js/social-password-guesser.test.mjs
test/js/social-episode-runner.test.mjs test/js/validator-social-awareness.test.mjs`. Expected: all pass, and
`git status --porcelain scenarios/` is empty. In particular ENG-02's own single-target test
(`social-password-guesser.test.mjs`) passes unchanged, proving E9's config is byte-for-byte unaffected.

### Episodes

E18 (attack half only; `mode: "spray"`). E9 is unaffected (`mode` defaults to `target`). No other episode
authors `guess.mode`.

### Shared code paths

The `password-guesser` child scene (ENG-02's, episode-runner only) and the awareness validator only. The lab,
`test_social_*` and SAFETYNET never open the runner and never author `guess`, so they are untouched.

### Do not break

ENG-02's single-target guesser and its test (`social-password-guesser.test.mjs`); E9's `guess` config
(must stay byte-for-byte: `mode` defaults to `target`); the frozen `STAGE_IDS` order for the built shells
(no new id); `test_social_episode` (`p7-episode`); the lab bridges `6` and `r4-door`; ENG-01's `flipAftermath`
(reused, not changed).

### How it is guarded

`guess.mode` is a new optional key defaulting to `target`; the spray/stuff renderers are new branches inside
the `password-guesser` minigame that run only when `mode` is `spray`/`stuff`; the new schema keys are optional
under `additionalProperties: false`; the new validator lints fire only for `mode: "spray"`/`"stuff"`. No built
shell and no other episode authors `guess.mode`, so every existing path, including E9's, is byte-for-byte
unchanged. No new stage id and no new stage order are introduced, so the `STAGE_IDS` freeze and the stage-order
lint are untouched.

### Stop and ask if

- ENG-02 has not landed: ENG-02b cannot build (there is no `guess` stage or `password-guesser` minigame to
  extend). Build ENG-02 first.
- The orchestrator wants spraying and stuffing as **two separate attack artefacts** (two `guess` stages, or a
  `guess` plus a second stage): do not; E18's brief is one attack artefact, and the `spray`-mode console shows
  both techniques as panels of the one campaign.
- A later episode wants a stuffing-only artefact: build the `mode: "stuff"` standalone branch then (it reuses
  the `guess.stuff` renderer), and give it its own fixture.
- The spray/stuff views are asked to be **scored**: do not; the attack half is unscored (as E9's guesser is),
  and the measurement lives in the defend half.

---

## ENG-08 additions (stage order, schema keys and tell rows E18 needs)

These are the schema, stage-order and tell rows E18 adds, written in the style of ENG-08's sections and
following its tell rule. They are to be folded into ENG-08 (or carried in ENG-02b if ENG-08 has not landed).

### Stage order

- **None new.** E18 authors the full stage order `brief osint guess flip defend debrief`, which ENG-08 already
  adds for ENG-02 (the `guess`-after-`osint`, no-`write` order). E18 reuses it unchanged. The defend-only shell
  is `brief defend debrief`, the built `defendOnly` order (`guess` is an `ATTACK_STAGES` id, dropped by
  `stagesFor:68`). So ENG-08 needs no new `stage_orders` branch for E18.

### Schema keys (added to the `guess` object ENG-02 adds to `socialAwarenessEpisode`)

The `guess` object is `additionalProperties: false` (it sits inside `socialAwarenessEpisode`, which is
`additionalProperties: false` at `scenario-schema.json:31`/`:53`). Add, all optional:

- `mode`: string, enum `["target", "spray", "stuff"]` (default `target`; E9 authors none).
- `roster`: object `{ namesFactId (string), patternFactId (string), domain (string), sample (array of
  string), note (string) }`, `additionalProperties: false`.
- `wordList`: object `{ slots (array of { id, factId, template }, each `additionalProperties: false`),
  seasonYear (array of string), note (string) }`, `additionalProperties: false`.
- `spray`: object `{ passes (array of { id, fromSlot?, literal? }, each `additionalProperties: false`),
  opensCount (number), note (string) }`, `additionalProperties: false`.
- `stuff`: object `{ rows (array of { label (string), opens (boolean) }, each `additionalProperties: false`),
  note (string) }`, `additionalProperties: false`.

ENG-02's existing `guess` keys (`target`, `commonList`, `patternSlots`, `reuseStep`, `passphraseDemo`,
`landedGlobal`, `note`) are unchanged; `mode` and the five objects above are added beside them. No credential
field (`password`, `secret`, a password value on a `stuff.rows[]` entry) is allowed; the schema holds only the
masked `label`/`opens` shape for `stuff.rows[]`.

### Validator lints (`scripts/validate_social/awareness.rb`, in the `guess`-block check ENG-02 adds)

Added to the `guess`-block lint, gated on `mode`:

- when `mode` is absent or `"target"`: the ENG-02 lints run (a `guess` block exists for a `guess` stage;
  `patternSlots[].factId` and `reuseStep.factId` name declared `se_intel_*` facts; `landedGlobal` is a declared
  global; no credential key). Unchanged.
- when `mode` is `"spray"`: require `roster`, `wordList` and `spray`; `roster.namesFactId`,
  `roster.patternFactId` and every `wordList.slots[].factId` name a declared `se_intel_*` fact; every
  `spray.passes[]` entry has exactly one of `fromSlot` (naming a real `wordList.slots[].id`) or `literal`;
  `landedGlobal` is a declared global; no `stuff.rows[]` entry carries a password value (only `label`/`opens`).
- when `mode` is `"stuff"`: require `stuff`; `landedGlobal` is a declared global; the same no-credential check.
- the "nothing looks like a credential field" check (no `password`/`secret` keys anywhere in the block) applies
  in every mode.

### Tell rows (E18 defend set)

E18's defend set (`e18_atscale_inbox`, E18 §11) scores five tells. Two are shared-library ids already present;
three are **scenario-local**, by ENG-08's rule (a tell is shared only when a `10_CHECK_FORMS.md` check-form
item actually scores it, and no `10` item scores any of these: `general_v2`'s scored flags are
`lookalike_domain`, `padlock_myth`, `unrequested_mfa_push`, `senderTrust`, `linkCredible`, `reply_to_differs`,
none of them E18's new ids). So **all three are local**, declared only in E18's set `channelTells` with a
`flagChips` label and a `factorStrings.<id>.redFlag` sentence on each flagging message, with **no**
`CHANNEL_TELLS`/`SKILL_NAMES` append in `phish-rules.js`/`triage.rb`/`triage-flags.js` and no library change.
`channelTells` holds only channel-tell ids (never a factor); `factorStrings` sits at message level (a sibling
of `truth`, never inside it); and a tell is local to this one set unless a `10` item scores it.

| Id | Used by today | Shared or local | Reason |
|---|---|---|---|
| `fake_lockout_notice` | E18 (defend) only | **local** | one set; no `10` item scores it; close to a generic lure but means specifically a forced "your account is locked, unlock here" message, so keep the id distinct |
| `fake_signin_alert` | E18 (defend) only | **local** | one set; no `10` item scores it; a sign-in alert that steers to a link or page to "review/confirm", distinct from `unrequested_mfa_push` (a prompt to approve, which E9 owns) |
| `fake_breach_alert` | E18 (defend) only | **local** | one set; no `10` item scores it; a breach warning that asks for a password "to check", distinct from `secrecy_or_bypass` |

E18 also flags the shared-library ids `lookalike_domain` and `secrecy_or_bypass` (in the twelve already); these
need no change and are enabled per set through `channelTells`.

Suggested `factorStrings.<id>.redFlag` wording (authored inline on each flagging message in E18's `defend.json`;
these are the final sentences):

- `fake_lockout_notice`: "A message saying your account is locked and giving you a link or number to unlock it."
- `fake_signin_alert`: "A sign-in alert that asks you to confirm or reject it by signing in on a linked page."
- `fake_breach_alert`: "A breach warning that asks you to type your password to check whether it has leaked."

Short `flagChips` labels (noun phrases, as the built library labels are, not full sentences): `fake_lockout_notice`
"Fake lockout message"; `fake_signin_alert` "Fake sign-in alert"; `fake_breach_alert` "Fake breach check".

**Tests to add (tells): none**, because no id is promoted to shared (the two `CHANNEL_TELLS` loop tests,
`social-triage-weakest.test.mjs:201` and `social-gap-triage-flags-comparison.test.mjs:89`, pass unchanged, as
no `SKILL_NAMES` entry is added). When a later check item scores one of E18's three ids, promote it to the
shared library by ENG-08's Rule then (append to both `CHANNEL_TELLS`, add a `SKILL_NAMES` entry, move the
`redFlag` wording into `phish-rules.js`).

---

## ENG-03a Triage `page` browser-screen states (E10)

**Goal.** E10's defend half is "a morning of browser screens": the built E5 `page` triage card extended with new states (fake "verify you are human" check with a clipboard reveal, fake update banner, full-screen alarm, extension-permission prompt, dangerous download bar, genuine browser warning and relaunch bar), and a three-way browser verdict (E10 §11). Every state is authored data; nothing runs on the computer and nothing writes to the real clipboard (E10 §18).

**Read first.** `inbox-triage/triage-kinds.js` (`page()` `:364`, `renderKindSurface()` `:514`, `NON_EMAIL_KINDS` `:23`, `actionsFor()` `:66`, `VERDICT_ACTIONS` `:40`, `kindVerdictLine()` `:93`); `triage-flags.js` (`chipIdsFor` `:154`, `KIND_TELL_EXCLUDE` `:90`, `redFlagString` `:196`); the built E5 page items in `awareness/e5/defend.json`; E10 §11.

**Depends on.** ENG-08 (the five new channel tells, §11 of E10, and the schema additions). ENG-03b (the attack-side fake-check builder) is independent of this packet: ENG-03b owns E10's attack half, ENG-03a its defend half, and neither blocks the other.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.**

- `page(rec, h)` (`triage-kinds.js:364`) draws a browser chrome (padlock/not-secure, address button, optional certificate panel) and a view (heading, body, optional sign-in form with a password-manager autofill cue). It reads `rec.page` (`url`, `padlock`, `heading`, `fields`, `button`, `certificate`, `autofill`). There is no fake-check, download, alarm, extension-permission, update or warning state.
- `actionsFor('page', verifyEnabled)` returns the three verdict buttons (Trust/Report/Delete) plus Verify when enabled (`:69`). The labels are fixed to "Trust" / "Report" / "Delete" in `VERDICT_ACTIONS` (`:40`). There is no per-set relabel.
- `renderKindSurface` dispatches by kind through `SURFACES` (`:507`); the flip reuses it (`flip-view.js:164`).

**Decision: the three-way browser verdict is a label change, not a new verdict.** Trust -> "Carry on", Report -> "Close and report", Delete -> "Go the trusted way". The verdict ids (`trust`/`report`/`delete`) and the `awareness` scoring are unchanged, so the measurement is identical to E5's page set and no scorer change is needed. The labels are configured per set with a new optional `triageSet.verdictLabels` (ENG-08 schema), read by `actionsFor` so the buttons and the review-card wording follow. With the key absent, the built labels stand (E5 unchanged).

**Change.**

1. **New optional `page.state`.** `page()` reads `p.state` (one of `fakeCheck`, `fakeUpdate`, `fullScreenAlarm`, `extensionPermission`, `downloadBar`, `browserWarning`, `relaunchBar`); absent means the ordinary page as today. Each state draws an authored, static block inside the existing browser chrome, every string via `textContent`:
   - `fakeCheck`: the "verify you are human" panel over a faded site copy, with the pasted-instruction lines as **plain text** (never real shortcuts) and a browser-side **"What did this page copy?"** reveal button that shows one authored line from `p.clipboardReveal` (a harmless description such as "A hidden command that would run a program on your computer"); the command itself is never shown and nothing is written to the real clipboard.
   - `fakeUpdate`: a page banner "Your browser is out of date" with a Download button that does nothing but record the choice.
   - `fullScreenAlarm`: a full-screen overlay, silent by default (a muted "this page is trying to play a loud alarm" note, honouring `prefers-reduced-motion`: no flashing, no shake), an authored support number as text, always a visible way out, and a hint after 30 seconds (`p.alarm.hintAfterMs`, default 30000).
   - `extensionPermission`: a store listing (stars, user count) and an "It can: ..." permission list from `p.permissions` (array of strings).
   - `downloadBar`: a download row showing `p.download.filename` (e.g. `Fernside_pricelist.pdf.exe`), no open action that does anything.
   - `browserWarning`: a genuine red "Deceptive site ahead" interstitial with a "Go back" affordance (a true warning; the correct move is Carry on/Go back).
   - `relaunchBar`: the browser's own menu-bar "An update is ready. Relaunch to finish." (browser UI, not a web page; the genuine mirror of `fakeUpdate`).
2. **`verdictLabels`.** `actionsFor(kind, verifyEnabled, labels)` takes an optional `{ trust, report, delete, verify }`; when present, each action's `label` is overridden. The triage renderer passes `set.verdictLabels`. The review card uses the same labels.
3. **Schema and `triage.rb` changes for `page.state` (ENG-08; both halves required).** The schema `page` object (`scripts/scenario-schema.json:1706`) is `"additionalProperties": false` and `"required": ["url"]` (verified 2026-10-28), so every new `page` sub-key must be added or the card fails `--strict-social`, and a stateful page with no address bar fails the `url` requirement. A scratch copy of an E5 `page` card with `state` and `clipboardReveal` fails today with `page contains additional properties ["state", "clipboardReveal"]`, and one with no `url` fails the schema and `triage.rb`'s `page.url is missing` (`triage.rb:393-395`). So:
   - **Add to the `page` object:** `state` (enum of the seven ids `fakeCheck`, `fakeUpdate`, `fullScreenAlarm`, `extensionPermission`, `downloadBar`, `browserWarning`, `relaunchBar`), `clipboardReveal` (string), `alarm` (`{ hintAfterMs }`, number), `permissions` (array of strings), `download` (`{ filename }`, string). All optional, under `"additionalProperties": false`.
   - **Relax the `url` requirement.** The web-page states (`fakeCheck`, `fakeUpdate`, `downloadBar`, `browserWarning`) and the ordinary page (no `state`) draw an address bar and still require `url`. The chrome/overlay states have no meaningful address (`relaunchBar` is the browser's own menu-bar UI; `fullScreenAlarm` and `extensionPermission` are overlays), so `url` is optional for them and the card draws no address bar. Make the schema require `url` only when `state` is absent or a web-page state, and change the `triage.rb` page check (`:393-395`, `page.url is missing`) to the same rule (require `url` only for the web-page states). Lint that `state` is one of the seven ids.
4. **Chip exclusions and where each tell lives.** By the ENG-08 table (authoritative) all five new web tells are **local to E10's set**: `fake_check_paste`, `fake_update_prompt`, `dangerous_download`, `fake_alarm_callback` and `browser_permission_grab` are each used by one set only (`10`'s `general_v2` scores none of them), so each is declared only in E10's `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence, with no edit to `phish-rules.js`/`triage.rb` and no `SKILL_NAMES` entry. All five are offered on a `page` card because they are not in `KIND_TELL_EXCLUDE.page` (`triage-flags.js:90`). No exclude-list change is needed. If a later check item scores one of the first three, promote it to the shared library by the ENG-08 Rule then.

**Tests to add.** `test/js/social-triage-page-states.test.mjs` (jsdom, copy the staging block from `test/js/social-triage-kinds.test.mjs`):

- a page with no `state` renders exactly as today (same DOM as a built E5 page fixture);
- each `state` renders its block; the `fakeCheck` reveal shows `clipboardReveal` and never a command, and no real clipboard write happens (assert `navigator.clipboard.writeText` is never called);
- the full-screen alarm has a way out and, under a mocked `prefers-reduced-motion`, adds no shake/flash class;
- `actionsFor('page', false, { trust:'Carry on', report:'Close and report', delete:'Go the trusted way' })` yields those labels; without the arg, the built labels;
- extend `test/js/social-triage-ui.test.mjs` to assert the verdict ids still score as `trust`/`report`/`delete`.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-triage-page-states.test.mjs test/js/social-triage-kinds.test.mjs test/js/social-triage-ui.test.mjs`. Expected: all pass, `git status --porcelain scenarios/` empty.

**Episodes that depend on it.** E10 (defend half, both variants). The `general_v2` check form's `page` item (`10_CHECK_FORMS.md` item 2) uses only the built page shape, so it does not need the new states.

**Shared code paths.** `triage-kinds.js` and `triage-flags.js`, used by the lab and every triage mission. Guarded: a page with no `state` and a set with no `verdictLabels` render exactly as before.

**Do not break.** E5's page set (bridges `e5-full`, `p7-channels`); the lab's page items (bridges `6`, `r4-door`); E1 to E7 flips that reuse `renderKindSurface`; the `page` padlock/certificate/autofill cues.

**How it is guarded.** `page.state` and `verdictLabels` are new optional keys; absent, the old render and the built verdict labels run unchanged. Each test includes the "without the key" case. Verdict ids and scoring are untouched, so measurement across every existing set is identical.

**Stop and ask if.** The orchestrator wants a genuinely new verdict (a fourth action) rather than relabelling the three; that would change the scorer and the measurement baseline and needs a `05` decision.

---

## ENG-03b Fake-check builder mode `pageType: "fakeCheck"` (E10)

**Goal.** E10's attack half builds, in a scored builder, the same "verify you are human" check its defend half then tests (E10 §9, §10; §20 Q4 resolved). The page sits on a genuine but **compromised** familiar site, so there is no look-alike domain to score: the lesson is the trust borrowed from the real site, not a typo-squat. This packet adds a **fake-check mode** to the built landing-page builder: a new `landingPages[].pageType: "fakeCheck"` that reuses the builder's overlay, step strip, preview, send and flip wiring and all its safety rules (`designs/07` §1), but swaps the seven-factor sign-in scorer for a four-factor **persuasion** scorer. It is **required** for E10's full episode (no longer optional). The defend-half browser screens are ENG-03a; this packet is the attack-half builder only.

**Read first.** `landing-page-builder/landing-page-model.js` (`scorePage:332`, `guardDomain:195`, `findDomainOption:148`, `FACTOR_ORDER:38`, `CHOICE_KEYS:43`, `RECORD_KEYS:46`, `TELL_IDS:51`, `DEFAULT_POINTS:59`, `points():175`, `normChoices:415`, `buildRecord:450`, `applyScore:471`, all verified 2026-10-28); `landing-page-render.js` (`renderLandingPage({ pageDef, choices, mode }):117`, and the safety header: no form controls, no serialise, no `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`); `episode-runner/episode-model.js` (`childLaunch` `build` branch `:187`, `flipPage:266`, its host derivation `:278-288`); `episode-runner/flip-view.js` (the `renderLandingPage` call `:159`); `inbox-triage/triage-kinds.js` `page()` for ENG-03a's `fakeCheck` surface, which this builder's preview should match; `designs/07_landing_page_builder.md` §1 (safety), §4 (the scorer shape), §6 (wiring); E10 §9, §10, §11 row 1.

**Depends on.** The built landing-page builder (`designs/07`, shipped). ENG-08 adds the schema and validator changes (collected in the "ENG-08 additions" block below; carry them here if ENG-08 has not landed). ENG-03a is independent (it owns the defend-half `page.state` surfaces); this builder's fake-check preview reuses ENG-03a's `fakeCheck` visual shape so the attack and defend halves draw the same page, but neither packet blocks the other.

**Owner model.** `general-purpose`, `model: "sonnet"`.

### Decision: a new scorer mode, not a reskin of the sign-in scorer

`scorePage` (`landing-page-model.js:332`) scores a page on seven factors (`FACTOR_ORDER:38`: brand, purpose, domain, logo, wording, form, padlock), and `domain` (35 of 100 points, `DEFAULT_POINTS:59`) is the dominant one. `guardDomain` (`:195`) first refuses any page whose chosen domain is not a look-alike option on the authored menu. A fake check on a genuine compromised site has **no** look-alike domain: its address is the real one. So the sign-in scorer does not fit, and reusing it would teach the wrong lesson (that the giveaway is the address). ENG-03b therefore adds a parallel scorer selected by `pageDef.pageType === "fakeCheck"`, scoring the levers that actually make a fake check work:

- `borrowedTrust` (35): hosting on the familiar site's genuine (compromised) page scores full; a look-alike host scores partial; an unrelated page scores low. This is the inversion of the sign-in `domain` factor: borrowing a real site's trust beats any look-alike.
- `pretext` (25): the check's reason fits what the visitor came to do ("continue to the order portal") full; a generic reason partial; an off-topic one zero.
- `stepWording` (25): the paste-and-run steps read as a smooth, plausible check full; clumsy wording zero.
- `urgency` (15): a calm one-step check full; heavy pressure scores lower (it makes a careful visitor pause).

Points sum to 100 and are authored defaults (`check.points`), overridable per page. The one tell every fake check carries, however it scores, is `fake_check_paste`: the page must tell the visitor to paste and run something. It is surfaced in the step-6 inspection and the flip, with the `clipboardReveal` line, and it is the one consequential choice the flip quotes (aw2, E10 §9).

### Current code

- `scorePage(pageDef, choices, target)` (`:332`) calls `guardDomain` first (`:333`), then scores the seven factors and returns `{ credibility, gatesPassed, meetsThreshold, factors[], gates[], tells[], verdict, gateLines[], blocked }`. There is no `pageType` branch.
- `normChoices` (`:415`) emits exactly the seven sign-in choice keys (`CHOICE_KEYS:43`: brand, purpose, domainId, logo, wording, fields, padlock); `buildRecord`/`applyScore` run every record through it.
- `renderLandingPage({ pageDef, choices, mode })` (`landing-page-render.js:117`) draws the sign-in preview; no fake-check body.
- `flipPage` (`episode-model.js:266`) rebuilds the flip page from `episode.attack.landingPageId` and the `se_landing_pages` record, deriving the host from the chosen domain option (`:278-288`); it returns null when no host resolves, so a page with no look-alike domain would currently show no flip page.
- `childLaunch` `build` branch (`:187`) forwards `{ landingPageId, targetId }` to the `landing-page-builder` scene unchanged; no change is needed there (the builder reads `pageType` from the page def).
- The schema `landingPages` item (`scenario-schema.json:229`) is `additionalProperties: false` with `required: ["id", "targets", "brands"]` (`:234`); a fake-check page has no `brands`, so it fails today.
- `validate_social/landing.rb` requires, for **every** page, a non-empty `brands` array (`:160`) and every `targets` key to be a phish target whose required factors include `linkCredible` (`targets_block:203`, `:214`); a fake-check page has neither, so it fails today.

### Change

1. **New optional `landingPages[].pageType`** (`"signin"` default, or `"fakeCheck"`). Read once where the builder, model and renderer start. Absent or `"signin"` is the current path, byte-for-byte.
2. **Model: a `fakeCheck` scorer branch in `scorePage`.** When `pageDef.pageType === "fakeCheck"`, return early (before `guardDomain`, which does not apply) from a new pure `scoreFakeCheck(pageDef, choices, target)` that returns the **same result shape** (`credibility`, `meetsThreshold`, `factors[]`, `tells[]`, `verdict`, plus `gatesPassed: true`, `gates: []`, `gateLines: []`, `blocked: false`), so the builder UI and the flip read it unchanged. It reads the choices from `choices.check` (point 3), scores the four factors above from `pageDef.check` menus (a menu entry's `trust`/`match`/`slips` flags decide full/partial/zero, mirroring how `scoreWording` reads `match`/`slips` at `:266`), sums against `check.points` (default `{ borrowedTrust: 35, pretext: 25, stepWording: 25, urgency: 15 }`), takes the convincing threshold from `targets[targetId].linkThreshold`, and appends the always-present `fake_check_paste` tell with its authored defender line. Factor and verdict strings come from `pageDef.check.strings` (optional overrides) with built defaults, exactly as the sign-in path reads `pageDef.strings` through `str()` (`:160`).
3. **Model: fake-check choices.** Add an optional `check` sub-object to the choice shape, `{ hostId, pretextId, urgencyId, stepsId }`. `normChoices` (`:415`) emits `check` **only when it is present**, so a sign-in page's record is byte-identical (no `check` key, the N2 and parity tests unaffected). Add `check` to `CHOICE_KEYS` (`:43`) and to the N4 closed-choice-key guard (`designs/07` N4), so the persisted record keeps it. `scoreFakeCheck` and the fake-check render read `choices.check`.
4. **Renderer: a `fakeCheck` preview.** In `renderLandingPage`, branch on `pageDef.pageType === "fakeCheck"` to draw the "verify you are human" panel over a faded copy of the genuine site, with the paste-and-run steps as **inert DOM text** (never real shortcuts) and the step-6 "What did this page copy?" reveal showing `pageDef.check.clipboardReveal` (one authored line; the command is never shown; nothing is written to the real clipboard). Match ENG-03a's `fakeCheck` surface so the attack and defend halves draw the same page. The safety constraints hold unchanged: no `<form>`/`<input>`/`<button>`/`<a>`/`<script>` element, no `contenteditable`, no serialise, no network. The existing `social-landing-page-render.test.mjs` DOM-safety and network greps must pass for a `fakeCheck` fixture as they do for a sign-in page.
5. **Flip: a `fakeCheck` branch in `flipPage`.** When the built page's `pageDef.pageType === "fakeCheck"`, derive the host from `pageDef.check.host` (the authored genuine site) instead of a chosen domain option (`:278-288`), set `heading` from `check.heading`, pass `pageDef` and `choices` through so `flip-view.js` draws it with `renderLandingPage` (`:159`), and set `tells: ["fake_check_paste"]`. The flip's `flipPageIntro` and the paste-step defender line are authored on the page (E10 §10).
6. **Schema and validator (ENG-08; both halves).** See the "ENG-08 additions" block below. In short: add `pageType` and the `check` object to the `landingPages` item; drop `brands` from the static `required` and move "a sign-in page needs `brands`" into `landing.rb`; gate the `linkCredible`-required-target check (`landing.rb:214`), the `brands` check (`:160`) and the `pretext.brandId` check (`pretext_block:187`) on `pageType !== "fakeCheck"`; add fake-check structure checks (a `fakeCheck` page needs a `check` block with `host`, the four menus and `clipboardReveal`; `check.host` passes the host-only `.example` and denylist lint; `clipboardReveal` is a non-empty plain description and must not contain shell metacharacters or look like a command).

### Tests to add

`test/js/social-landing-page-fakecheck.test.mjs` (jsdom, copy the staging block from `test/js/social-landing-page-model.test.mjs`):

- a `fakeCheck` page scores the four persuasion factors from `choices.check`: the genuine host scores `borrowedTrust` full, a look-alike host partial, an unrelated host low; the fitting pretext/calm urgency/smooth steps score full, the off/pushy/clumsy ones low; the total matches `check.points`;
- `meetsThreshold` reads `targets[tid].linkThreshold`; the result carries `fake_check_paste` in `tells` for every choice set, and `clipboardReveal` is surfaced as the one-line description, never a command (assert `navigator.clipboard.writeText` is never called, and no result string matches a shell command pattern);
- a page with no `pageType` (or `"signin"`) scores exactly as today, and `normChoices` on a sign-in record emits no `check` key (byte-identity guard);
- extend `test/js/social-landing-page-render.test.mjs`: a `fakeCheck` fixture renders the verify panel and the reveal, with no forbidden element and no network call; a sign-in page renders byte-for-byte as today;
- extend `test/js/social-episode-views.test.mjs` (or the flip test): `flipPage` on a built `fakeCheck` page returns a page whose host is `check.host` and whose `tells` is `["fake_check_paste"]`; on a sign-in page the host still comes from the domain option.
- extend `test/js/validator-landing-pages.test.mjs`: a clean `fakeCheck` fixture (no `brands`, a non-`linkCredible` target, a `check` block) passes; failing cases (a `fakeCheck` page with no `check`; a `check.host` that is not `.example`; a `clipboardReveal` holding a command-like string; a `signin` page with no `brands` still fails).

### Acceptance

The standard engine acceptance (the block at the top of this file), plus `node --test test/js/social-landing-page-fakecheck.test.mjs test/js/social-landing-page-model.test.mjs test/js/social-landing-page-render.test.mjs test/js/validator-landing-pages.test.mjs`. Expected: all pass, and `git status --porcelain scenarios/` is empty. In particular the sign-in model and render tests pass unchanged, proving E5's build and the lab's builder are byte-for-byte unaffected.

### Episodes that depend on it

E10 full episode (the attack half). E10's defend-only variant has no `build` stage and does **not** need ENG-03b. No other episode authors `pageType: "fakeCheck"`.

### Shared code paths

`landing-page-model.js`, `landing-page-render.js` and `episode-model.js` `flipPage`, used by E5 and the lab's builder scenes. Guarded: a page with no `pageType` (or `"signin"`) runs the current scorer, render and flip exactly as before.

### Do not break

E5's build and flip (bridges `e5-full`); the lab's builder scenes (bridges `6`, `r4-door`); the landing-page builder's sign-in scoring and its closed record (N2, N4); the DOM-safety and network tests (`social-landing-page-render.test.mjs`); the schema/validator for every built page (dropping `brands` from the static `required` must still fail a sign-in page that omits `brands`, via the `landing.rb` move).

### How it is guarded

`pageType` is a new optional key defaulting to `"signin"`; the fake-check scorer, render and flip branches run only when it is `"fakeCheck"`; the new schema keys are optional under `additionalProperties: false`; `brands` moves from the schema's static `required` to a `landing.rb` check that still fires for a sign-in page; the relaxed validator checks are gated on `pageType`. No built page and no other episode authors `pageType`, so every existing path, including E5's, is byte-for-byte unchanged.

### Stop and ask if

- The builder cannot be put in a fake-check mode at all (the overlay or the scorer cannot branch): stop and report. Do not ship E10's attack half as an E5 sign-in clone, because the learner would then not build the page the defend half tests (E10 §9, §19).
- The orchestrator wants the fake check's persuasion factors scored differently from the four here (E10 §20.8): adjust `check.points` and the factor set in this packet, not in the episode.
- The attack lure is asked to carry a page link (E10 §20.7): that needs a `fakeCheck` branch in `linkInfoFor` and the mail client; E10 avoids it by sending a link-less lure and reading the built page from the record in `flipPage`.

### ENG-08 additions (schema keys and validator changes ENG-03b needs)

Folded into ENG-08 (or carried here if ENG-08 has not landed). No new stage id, no new stage order (E10 authors the built E5 order `brief osint build write flip defend debrief`), and no new shared or scenario-local **check-form** tell: `fake_check_paste` is already the E10 defend-set scenario-local tell declared in ENG-08's table and the defend set's `channelTells` (E10 §11); the attack-side flip reuses that id with its defender line authored on the landing page, so no `CHANNEL_TELLS`/`SKILL_NAMES` append and no stage-order branch are made for ENG-03b.

**Schema (`scripts/scenario-schema.json`, the `landingPages` item at `:229`).**

- Add `pageType`: string, enum `["signin", "fakeCheck"]` (default `signin`; built pages author none).
- Add `check`: object, `additionalProperties: false`, all optional, `{ host (string), heading (string), clipboardReveal (string), hosts (array of { id, label, trust }), pretexts (array of { id, label, match?, slips? }), urgencies (array of { id, label, match? }), steps (array of { id, label, match?, slips? }), points (object { borrowedTrust, pretext, stepWording, urgency }, numbers), strings (object, string values) }`.
- **Remove `brands` from the item's static `required`** (`:234`, leaving `["id", "targets"]`); the "a sign-in page needs `brands`" rule moves to `landing.rb` (below), so a sign-in page with no `brands` still fails, and a fake-check page validates.

**Validator (`scripts/validate_social/landing.rb`).**

- In `page_checks` (`:153`), branch on `pg['pageType']`. For `"fakeCheck"`:
  - do **not** run `brands_block` (`:160`) or `pretext_block` (`:176`); instead require a `check` block with `host`, the four menus (`hosts`, `pretexts`, `urgencies`, `steps`, each a non-empty array) and `clipboardReveal`;
  - `check.host` passes the host-only `.example`, ASCII and denylist lint (reuse `Osint::HostLint`, as `realDomain` does);
  - `clipboardReveal` is a non-empty string that is a plain description: reject a value containing shell metacharacters (`| & ; $ > < \`` backtick) or that reads as a command (a leading `curl`/`powershell`/`cmd`/`bash`/`mshta`/`/c ` token), so no working command can be authored;
  - in `targets_block` (`:203`), accept a `targets` key that is a phish target **without** `linkCredible` when the page is `fakeCheck` (the `:214` requirement is gated on `pageType !== "fakeCheck"`); the `expected_link` cross-check (`:116`) already skips a target with no `linkCredible`/`expectedLink` (`requires_link_credible?:100`), so it needs no change.
  - For a `"signin"` page (or none) every current check runs unchanged, including a new explicit "a sign-in page needs a non-empty `brands` array" error that replaces the schema `required` entry.
- Lint that `pageType`, when present, is one of the two ids.

---

## ENG-04 Consequence-flip `mistake` stage + montage flip (E11, E15, E16)

**Goal.** A consequence-flip episode has no attacker and no target to judge: in place of an attack half the learner makes a few ordinary choices in a safe sandbox (`mistake`), then the flip runs as a montage showing where each choice led. The normative config shape is in this packet (below); E11 §10a mirrors it with worked content, and E15 and E16 use the same shape and differ only in content. E14 and E17 do **not** use ENG-04.

**Read first.** `episode-model.js` (`STAGE_IDS:27`, `ATTACK_STAGES:28`, `DEFAULT_STAGES:31`, `stagesFor:60`, `childLaunch:180`, `readState:129`, `completeStage:153`, `stateKey:41`); `episode-runner-minigame.js` (`STAGE_COPY:79`, `_render:327`, `_renderFinished:532`, `_flipProps:466`, `_renderFlip:489`, `_launch:548`); `step-strip.js` (`STAGE_LABELS:9`); `flip-view.js` (`renderFlipView:91`); `awareness.rb` (`STAGES:18`, `STAGES_BY_VARIANT:19`, `stage_orders:157`, `string_checks:296`, `flip_by_choice_checks:334`); the parity test `STRINGS_ERB_ONLY_OK` (`social-awareness-fragment-erb-parity.test.mjs:59`). The normative config shape is in this packet (below); E11 §10a is the content mirror, so the engine agent does not need the content spec.

**Depends on.** ENG-08 for the schema and lints (or carry them here). Nothing else: the montage reuses the built flip view with a new mode.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.**

- No `mistake` id in `STAGE_IDS`; no `montage` flip mode; `_flipProps` (`:466`) handles only mail and call sends. `flipDefenderLineByChoice` (aw2) is keyed on the chosen pretext template id; there is no per-beat montage.
- `stagesFor` drops `ATTACK_STAGES` ids for a `defendOnly` variant; `flip` is already an `ATTACK_STAGES` member, so a `defendOnly` shell already drops `flip`.
- The validator pins the full stage list (`stage_orders:157`); `brief mistake flip defend debrief` is not an allowed order today.

**Normative config shape (authoritative; E11 §10a mirrors it with worked content).**

Config lives in a new `awarenessEpisode.mistake` block (sibling of the built `awarenessEpisode.mfa`), plus `flip.mode` and `strings.flipMontageByChoice`:

```jsonc
"mistake": {
  "scored": false,                            // always false; the sandbox is never scored
  "beats": [
    {
      "id": "overtime_sheet",                 // stable beat id; the montage and the analytics record key on it
      "situation": "<on-screen prompt for this everyday choice>",
      "options": [
        { "id": "send_wrong_sam",  "label": "<on screen>", "safe": false },
        { "id": "check_then_send", "label": "<on screen>", "safe": true, "approvedRoute": true }
      ]
    }
    // one object per everyday choice, in order
  ],
  "flipBeat": "overtime_sheet"                 // the ONE consequential choice quoted back in the flip (aw2)
},
"flip": { "mode": "montage" },
"strings": {
  "flipHeading": "<montage headline, e.g. Six months later>",
  "flipMontageByChoice": {
    "overtime_sheet": {
      "send_wrong_sam":  "<the line shown when the learner took the unsafe option>",
      "check_then_send": "<the line shown when the learner took the safe option: the version where it went wrong instead>"
    }
  }
}
```

Fields: each `beats[]` entry has `id`, `situation` and `options[]`; each `option` has `id`, `label`, `safe` (true = the approved route, **exactly one per beat**) and an optional `approvedRoute: true` marking the single modelled best move. `flipBeat` names the beat whose branch is the montage headline (the montage still shows every beat). The learner's chosen option per beat is stored, then discarded after the flip; nothing is scored (the measurement store may record beat id and option id for in-episode analytics only, never shown).

**Change.**

1. Add `'mistake'` to `STAGE_IDS` and to `ATTACK_STAGES`, placed before `flip` (so a `defendOnly` shell drops both `mistake` and `flip`, `stagesFor:68`). `DEFAULT_STAGES` is not changed.
2. `childLaunch` gains a `mistake` branch returning `{ kind: 'mistake', sceneType: 'consequence-sandbox', params: { config: episode.mistake ?? null } }`, `null` when `episode.mistake` is absent. A new child module `minigames/episode-runner/consequence-sandbox.js` (kept beside the runner, episode-only) is a registered child scene launched through `launchChild` exactly as `build`/`osint` are; it renders the `beats` one at a time, stores the chosen option id per beat into `episode_<id>_state`, and never scores. Store the beat choices under a `mistakeChoices` field: because `readState` (`episode-model.js:129`) builds its state object from `{ v, variant, stage, done, sent, defend }` only, and `completeStage` (`:153`, clears `sent` on `flip` at `:160`) only merges the `sent` and `defend` patch keys, `mistakeChoices` must be added to the state object in `readState` (via a `cleanMistake(src.mistakeChoices)` helper) and to the patch-key allow-list in `completeStage`, and cleared on `flip` the same way `sent` is.
2a. **Runner wiring for the `mistake` stage (or it renders "Finished").** `_render` (`episode-runner-minigame.js:327`) draws a launch panel only at `else if (stage && STAGE_COPY[stage]) this._renderLaunch(stage)` (`:335`), else `_renderFinished()` (`:336`); `_launch` (`:548`) has an explicit branch per `spec.kind` and does nothing for an unlisted kind. So, in this packet:
   - add `STAGE_COPY.mistake = { heading: '<on screen>', text: '<on screen>', button: 'Make the choices' }` (`STAGE_COPY` at `:79`), so `_render` draws the launch panel instead of "Finished";
   - add a `mistake` default strip label `STAGE_LABELS.mistake = 'Choices'` to `step-strip.js` (`STAGE_LABELS` at `:9`; it holds no `mistake`/`guess` today), overridable per episode through ENG-01's `stepLabels` the way `guess` is;
   - add a `mistake` branch to the `_launch` `spec.kind` chain (beside `osint`/`mail`/`build`/`mfa`/`call`/`triage`): `child = this.launchChild(spec.sceneType, { ...spec.params, onComplete: (success, result) => { if (isNormal(success, result)) this._completeWhileAway('mistake', { mistakeChoices: result?.mistakeChoices ?? {} }); } });`, matching how ENG-02 wires `guess` and how `build` is wired at `:577`.
3. **Montage flip.** Add `flip.mode: "montage"` on the episode block, read by `_flipProps`: when set, return `{ montage: true, beats, flipBeat, lines }` where `lines` come from `strings.flipMontageByChoice[beatId][optionId]`, using the learner's own option when it has a line, else the beat's unsafe option (the "taken instead" view, so a careful learner still sees the cost). `renderFlipView` gains a montage branch that draws `flipHeading`, one `.aw-montage-beat` per beat (the `flipBeat` first/as the headline), and `getState().shown === 'montage'`.
4. **Validator and schema (ENG-08).** Add `mistake` to `stages` enum and `awareness.rb` `STAGES`; add `awarenessEpisode.mistake` (`scored`, `beats[]`, `flipBeat`), `flip.mode` and `strings.flipMontageByChoice` to the schema (`additionalProperties: false`); a `stage_orders` branch for `brief mistake flip defend debrief` (full) with no `osint`/`write`; lints: every beat has exactly one `safe: true` option; `flipBeat` names a real beat; every `flipMontageByChoice` outer key is a real beat and every inner key a real option of that beat; non-empty strings; a `mistake` block present whenever `stages` includes `mistake`; `mistake`/`flip` absent on a `defendOnly` episode. Add `flipMontageByChoice` to `STRINGS_ERB_ONLY_OK` in the parity test with the reason (the defend-only shell has no `mistake`/`flip`, so the generated shell never carries it, exactly like `flipDefenderLineByChoice`).
5. **Relax `attack_checks` for a `mistake` episode.** Today `awareness.rb:53` runs `attack_checks(ctx, ep) if full?(ep)`, and `attack_checks` (`:182`) demands an `attack` block (`target`, `siteIds`, `accountIds`, `maxMessages: 1`, `scored: false`, a real `phishTargets` target). A consequence-flip episode is `variant: "full"` but has no attacker and no target, so it fails today. Change the guard so `attack_checks` runs only when the stage list contains an attack-artefact stage (`osint`, `build`, `write`, `mfa` or `guess`): for a `mistake` episode (no `osint`/`write`) `attack_checks` is skipped. Add the paired lint that for a `mistake` episode the `attack` block must be **absent** (so a stray `attack` block is still caught). This is the single change that lets E11, E15 and E16 validate; it must land before any of the three is validated.

**Tests to add.** `test/js/social-episode-sandbox.test.mjs` (jsdom): the sandbox renders each beat and stores the chosen option; with `episode.mistake` absent, `childLaunch(ep,'mistake')` is `null`; a full consequence episode sitting at stage `mistake` draws a launch panel with a button (not `_renderFinished`'s "Finished"), and the button calls `_launch('mistake')`; the montage draws every beat, the `flipBeat` first, falling back to the unsafe-option line for an untaken beat; `getState().shown === 'montage'`. Extend `social-episode-runner.test.mjs` (a full consequence episode runs `brief -> mistake -> flip -> defend -> debrief`; a `defendOnly` drops `mistake` and `flip`) and `validator-social-awareness.test.mjs` (a clean `mistake` fixture; failing cases: a beat with no/two `safe` options, a `flipBeat` that is not a beat, a montage key that is not a beat/option). Add `flipMontageByChoice` to the parity test's allow-list; a parity fixture confirms the full erb carries it and the defend-only shell does not.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-sandbox.test.mjs test/js/social-episode-runner.test.mjs test/js/social-episode-views.test.mjs test/js/validator-social-awareness.test.mjs test/js/social-awareness-fragment-erb-parity.test.mjs`. Expected: all pass, `git status --porcelain scenarios/` empty.

**Episodes that depend on it.** E11, E15, E16 (full variants; the defend-only variants drop `mistake`/`flip` and do not need ENG-04 at runtime, but the shared schema/validator changes must be in before any of the three validate).

**Shared code paths.** Episode runner, flip view and the awareness validator only. The lab and SAFETYNET never open the runner.

**Do not break.** The E1 to E7 flips and `flipDefenderLineByChoice` (aw2); `test_social_episode`; the frozen `STAGE_IDS` order for the 38 shells; the parity test (add the allow-list entry, do not change the test's logic).

**How it is guarded.** New stage id (authored, dropped from `defendOnly`); new `childLaunch` and `_flipProps` branches both gated on `episode.mistake` / `flip.mode === 'montage'`; new schema keys under `additionalProperties: false`; the montage branch in `renderFlipView` runs only when `montage` is passed. No built shell authors `mistake` or `flip.mode`, so every existing flip is unchanged.

**Stop and ask if.** The built shape as implemented differs from E11 §10a (a different stage id or a flip mode other than `montage`): stop, report, and tell the E15/E16 writers so they do not redefine it.

---

## ENG-05a World-play attack modifier `world` (E12)

**Goal.** E12's attack half is the first awareness episode played in the game world: the learner walks a lobby room in a costume, carries a parcel, and runs an in-person pretext on the influence bar, which buzzes a badge door open (E12 §9). The pretext machinery is the built E3 path (pretext-prep -> person-chat); ENG-05a is the world wrapper and the hand-back to the flip.

**Read first.** `episode-model.js` (`writeKind:166`, `childLaunch:204` the `write`/call branch); `episode-runner-minigame.js` (`_launchCall:629`, `watchCall:760`, `_reopenParams:661`); `core/rooms.js` (`loadRoom:773`, exposed as `window.loadRoom`, the async room-move function; used by `doors.js:721` and `npc-behavior.js:643`); `pretext-prep/pretext-card.js` (`callLaunch` picks person-chat for a `person` NPC, `:240`); `person-chat/person-chat-pretext.js`; E3's `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb` and `ink/leila_servicedesk.ink`; E12 §9.1.

**Depends on.** ENG-05b (costume), ENG-05c (lobby/door), ENG-08 (schema/validator). ENG-05d (the parcel sprite) is **art only, not a wiring prerequisite**: E12 is wired and bridged with the stock costume sprite and gets the baked-in parcel after the PixelLab reset. ENG-05e is needed only if the hand-back cannot reuse `watchCall` (it can; see below), and ENG-09c is **not** needed (E12's reception items are the built `call` kind). So the wiring prerequisites are ENG-05a, ENG-05b, ENG-05c and ENG-08.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Decision: the flip hand-back reuses `watchCall`, so E12 needs no real `#trigger_minigame`.** `watchCall` (`episode-runner-minigame.js:760`) already waits for `pretext_<callId>_outcome` to change and for every overlay to close, then reopens the runner for the flip. The world-play pretext is a `person` NPC pretext call (E12 uses `attack.callId: "merrin_front_desk"`, so `writeKind` returns `'call'` and `childLaunch` opens pretext-prep). The only new behaviour is placing the player in the lobby with the costume before the call and reverting on the flip. ENG-05e (a real `#trigger_minigame`) is therefore **not required for E12** and is written only as an optional, separately-useful engine fix.

**Current code.** A call attack opens pretext-prep from the kiosk (`_launchCall:629`), whose Begin opens person-chat; `watchCall` reopens the runner when the call ends. There is no world placement, no costume and no start-in-lobby behaviour tied to the episode.

**Change.**

1. **New optional `awarenessEpisode.world` block** describing the attack-world placement: `{ "room": "lobby", "startRoom": "training_room", "costume": { ... } }` (the costume shape is ENG-05b's). The two room fields have distinct, defined meanings:
   - **`world.startRoom`** is the room the learner **starts and returns to**: the kiosk room. It must equal the scenario's top-level `startRoom`, which for E12 is `training_room` (ENG-05c keeps the kiosk room named `training_room` so `apply_training_room.py --refresh` still works). The learner spawns here, and the kiosk is here, so the brief stage can always start.
   - **`world.room`** is the room the in-world attack is **played in**: the lobby. It is a temporary placement, never the scenario's `startRoom`.
2. **How the player moves, and where they end up.** The move is done with `window.loadRoom(roomId)` (`core/rooms.js:773`, async, verified; the same function the door and NPC-behaviour code use). When `world` is present on a full episode whose `write` is a call attack, the runner:
   - before launching the call: `await window.loadRoom(world.room)` to place the player in the lobby, then applies the costume (ENG-05b);
   - on the call write outcome (`reported`, `walked_away` or `got_it`) and on any early exit, and before the flip reopens: `await window.loadRoom(world.startRoom)` to return the player to the kiosk room, then removes the costume (ENG-05b). `watchCall` (`:760`) already waits for `pretext_<callId>_outcome` to change and for every overlay to close, then reopens the runner for the flip; the room move and costume revert happen on that hand-back.
   This makes a **failed con never strand the learner**: whatever the outcome, the runner moves them back to `world.startRoom` (the kiosk room) and the flip/defend run there. A **reload never strands them** either, because the scenario's top-level `startRoom` is the kiosk room, so the game respawns the learner at the kiosk, not in the lobby behind the badge door. The badge door between the lobby and the kiosk room (ENG-05c) is therefore narrative only (the in-world payoff of a successful con); the runner's `loadRoom` hand-back does not depend on it, so the door's locked state never gates episode progress.
3. The attack is still the `write` stage with `attack.callId` (no new stage id is strictly needed); `world` is a modifier on it. Name the modifier `world` rather than a new stage so the validator's stage list is unchanged for E12 (its stages are the built `brief osint write flip defend debrief`, all in `STAGE_IDS`). The index's "world stage" is this `world` modifier on the call `write` stage, not a new `STAGE_IDS` entry. The costume lives under `world.costume`, **never** under `attack` (the schema's `attack` block has no `costume` key; it is `additionalProperties: false`).
4. Schema and validator (ENG-08): add `awarenessEpisode.world` (`room`, `startRoom`, `costume`); lint that `world.room` and `world.startRoom` are declared rooms, that **`world.startRoom` equals the scenario's top-level `startRoom`** (so the learner always starts and returns at the kiosk room), that the episode's `write` is a call attack when `world` is present, and that the costume sprite/talk assets are named.

**Tests to add.** `test/js/social-episode-world.test.mjs`: with `world` present the runner requests the costume apply before the call and the revert on flip (assert via injected deps/spies, in the style of `social-episode-runner.test.mjs`); with `world` absent the call attack is launched exactly as the E3 path (no costume calls). Extend `validator-social-awareness.test.mjs` with a clean `world` fixture and a failing case (`world.room` not a declared room).

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-world.test.mjs test/js/social-episode-runner.test.mjs test/js/validator-social-awareness.test.mjs`, and the E12 bridge once wired.

**Episodes that depend on it.** E12 only.

**Shared code paths.** Episode runner only (the pretext/person-chat path is reused unchanged). The lab and SAFETYNET never open the runner.

**Do not break.** E3's phone pretext (`e3-full`); `watchCall` (used by E3); the kiosk-only call attacks.

**How it is guarded.** `awarenessEpisode.world` is a new optional key; absent, the call attack is the built E3 path. No change to `watchCall`, pretext-prep or person-chat.

**Stop and ask if.** ENG-05's world-play cannot have the lobby NPC drive the done event from the kiosk room (`training_room`), so the host must be split into two NPCs (E12 §20.1). If the hand-back cannot reuse `watchCall` for any reason, build ENG-05e and wire `#trigger_minigame` (E12 §9.1 item 5).

---

## ENG-05b Costume that respects aw9 (E12)

**Goal.** Swap the player's world sprite and talk portrait to a hi-vis courier for the attack, then restore the player's **chosen** avatar afterwards, never the scenario's `player.spriteSheet` (aw9: the chosen avatar always wins). E12 §9.1 item 1.

**Read first.** `utils/player-avatar.js` (`chosenPlayerSprite:26`, `playerTalkPath:41`, `syncScenarioPlayer:55`); `core/player.js` (`updatePlayerSprite:118`); E12 §9.1 item 1.

**Depends on.** ENG-05a (the `world` block carries the costume). ENG-08 (schema).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** `chosenPlayerSprite()` resolves the learner's chosen avatar (config over scenario). `updatePlayerSprite(key)` swaps the live sprite. `syncScenarioPlayer(scenario, sprite)` keeps person-chat's self-view and the HUD in agreement. Nothing stores a pre-costume sprite or reverts to the chosen one.

**Change.** A new function (for example `utils/player-costume.js` `applyCostume(costume)` / `removeCostume()`): `applyCostume` reads `chosenPlayerSprite()` first, stores it, then calls `updatePlayerSprite(costume.sprite)` and sets the talk path from `costume.talk`; `removeCostume` calls `updatePlayerSprite(storedKey)` and `syncScenarioPlayer(scenario, storedKey)`, so the restore is always to the chosen avatar, never `player.spriteSheet`. The existing functions are not changed. Costume shape: `{ "sprite": "aw_hivis_courier_v2", "talk": "assets/characters/aw_hivis_courier_talk.png" }`.

**Tests to add.** `test/js/social-player-costume.test.mjs`: `applyCostume` stores `chosenPlayerSprite()` and swaps to the costume; `removeCostume` restores the stored chosen key (assert it is the chosen avatar, not `player.spriteSheet`), and calls `syncScenarioPlayer`. A stub for `updatePlayerSprite` and `chosenPlayerSprite` in jsdom.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-player-costume.test.mjs`.

**Episodes that depend on it.** E12 only.

**Shared code paths.** `core/player.js` and `utils/player-avatar.js` are used by every world scenario (including SAFETYNET). Guarded: a **new** function is added; the existing `updatePlayerSprite`, `chosenPlayerSprite` and `syncScenarioPlayer` are unchanged, and costume code runs only when E12 calls it.

**Do not break.** The chosen-avatar rule (aw9) in every mission; the player sprite in m01/m02 and the lab; person-chat's self-view.

**How it is guarded.** New module, new functions; no existing avatar function changed; invoked only by ENG-05a when `world.costume` is set.

**Stop and ask if.** The costume must also change the person-chat self-view mid-call and that cannot be done without touching person-chat (then note it; E12 reverts on the flip, so the self-view only needs to be right while the costume is applied).

---

## ENG-05c Lobby room, door and NPC door opening (E12)

**Goal.** A lobby room (`room_aw_merrin_lobby`) connected to the kiosk room (`training_room`) by a badge door that starts locked; the front-of-house NPC opens it on a successful pretext using the **existing** `# unlock_door:<room>` mechanism (E12 §9.1 items 3 and 4). No new door-opening engine.

**Read first.** `minigames/helpers/chat-helpers.js` (`unlock_door` tag handling, around `:71`); `systems/npc-game-bridge.js` (`unlockDoor:77`, which clears `doorProperties.locked = false` at `:117-118`); `systems/apply-actions.js` (`unlock_door` action); `app/models/break_escape/game.rb` (`validate_unlock:1043`, the NPC branch at `:1071` that honours an NPC's `unlockable`); `scripts/room_gen/build_aw_rooms.py`; `01_PIPELINE.md` P5c (the lobby-map build recipe); `awareness/training_room.py`, `apply_training_room.py`; `scenarios/m02_ransomed_trust/scenario.json.erb` (the `security_office` locked room and the `security_guard_patrol` NPC's `unlockable`); E12 §5 (rooms), §9.1 items 3 and 4, §15.

**Depends on.** ENG-05a (startRoom/world). ENG-08 (accept a lobby room type and a locked connection).

**Owner model.** `general-purpose`, `model: "sonnet"` (room build is mechanical; the ink tag is authoring).

**Current code.** NPCs already open doors: an ink line tagged `# unlock_door:<room>` is handled at `chat-helpers.js:71`, which calls `NPCGameBridge.unlockDoor(roomId)` (`npc-game-bridge.js:77`); the server validates the NPC's permission (`game.rb` `validate_unlock:1043`, the NPC branch `:1071`, which honours the NPC record's `unlockable` list) and the client clears `doorProperties.locked = false` on every door sprite to the room (`npc-game-bridge.js:117-118`), then emits `door_unlocked_by_npc`. `apply-actions.js` has the action-list equivalent. So the opening itself is built.

**Room naming (so the room tooling still works).** Name E12's kiosk room **`training_room`** (not `studio`) in both shells, and the lobby **`lobby`**. The scenario top-level `startRoom` is `training_room` (ENG-05a). Keeping the kiosk room id `training_room` is required because `apply_training_room.py --refresh` (the P13 lighting stage) globs `scenarios/awareness_*` and reads `rooms.training_room.type` unguarded (`apply_training_room.py:204`), then `refresh_text` (`:159-196`) re-splices only `rooms.training_room`'s lighting, chatBackground and host position by text anchors. So a shell whose kiosk room is not `training_room` raises `KeyError`. Place the `training_room` block **before** the `lobby` block so the room-lighting anchor (`'      "lighting": '`) resolves to `training_room`; `--refresh` leaves the `lobby` block untouched. Both E12 shells use `training_room`, so full and defend-only agree on the kiosk room id. The badge-door tag is then `# unlock_door:training_room`. The build recipe for the lobby map is in `01_PIPELINE.md` P5c.

**Change (authoring with built features; no new door engine).**

1. **Build the lobby map `room_aw_merrin_lobby`** by the P5b recipe (`01_PIPELINE.md` P5c), with these differences from a full new-company map: reuse the existing Merrin & Sallow tile sheet (no new `make_aw_tileset.py` `SHEETS` entry and no `register_object.py` props), dress it as a reception/lobby (desk, entrance, a badge door to `training_room`), and give it no kiosk or host slot (the kiosk and host live in the `training_room` room). It needs only a `build_aw_rooms.py` layout, a `game.js` tilemap load (the tile-image load reuses `room_aw_merrin_sallow.png`), the schema `type` enum entry and the `generate_rooms.py` comment. Do not hand-draw a map.
2. **The locked badge door and the NPC permission, with the exact keys.** The badge door between `lobby` and `training_room` starts locked, and the lobby's front-of-house NPC (the pretext mark) opens it on a successful pretext. Copy the exact lock keys from m02's `security_office` room block (`scenarios/m02_ransomed_trust/scenario.json.erb:3104-3122`, verified 2026-10-28), onto the locked room's block (`rooms.training_room`):

   ```json
   "locked": true,
   "lockType": "key",
   "requires": "merrin_studio_badge",
   "keyPins": [40, 30, 55, 35],
   "difficulty": "easy"
   ```

   `requires` names a key id that **no object in the shell holds**, so the only way through from the lobby side is the NPC buzz-in. Give the lobby NPC the m02 guard's permission key `"unlockable": ["training_room"]` (copy from the `security_guard_patrol` NPC, `:3238`), and a granting ink line tagged `# unlock_door:training_room` (the m02 guard pattern, `ink/m02_npc_security_guard.ink` around `:309`). Because a `key` door is also lock-pickable, and the learner starts inside `training_room` and the runner moves them room-to-room with `loadRoom` (ENG-05a), the lock is narrative only (the in-world payoff of the con) and never gates progress; leaving it pickable at `difficulty: "easy"` is fine, or set a harder `keyPins`/`difficulty` if a stray pick should be discouraged.
3. Schema/validator (ENG-08): accept the new room type `room_aw_merrin_lobby` in the room `type` enum and a locked connection between `lobby` and `training_room`, and keep the host-NPC lint (N16) happy for a two-room shell. The `locked`/`lockType`/`requires`/`keyPins` keys are the built room-lock schema (m02 uses them), so the door itself needs no new schema key.

**Tests to add.** No new engine test (the mechanism is built and tested). Add a validator fixture (in `validator-social-awareness.test.mjs` or the schema test) that a two-room awareness shell with a locked lobby->training_room connection and an NPC with unlock permission validates clean. The E12 bridge asserts the door opens on `got_it`.

**Acceptance.** The standard engine acceptance, plus the E12 bridge reaching the door-open and the `ink` compile showing the `# unlock_door:training_room` tag on the granting line (E12 §17).

**Episodes that depend on it.** E12 only.

**Shared code paths.** None in the engine (built features). Room-gen and training-room scripts gain a new entry; the existing maps are untouched.

**Do not break.** The existing `room_aw_*` maps; the built `unlock_door` path used across missions; the N16 host-NPC done event.

**How it is guarded.** A new room type and a new shell; no engine change to door opening. The built `unlock_door` is reused verbatim.

**Stop and ask if.** The host cannot be both the lobby pretext target and the kiosk host with the N16 done event (E12 §20.1): then split into two front-of-house NPCs.

---

## ENG-05d Package-carry sprite state (E12)

**Goal.** The courier visibly carries a parcel. E12 §9.1 item 2.

**Read first.** `.claude/skills/pixellab-character-animations/SKILL.md` (the six stock templates: `breathing-idle, walk, cross-punch, lead-jab, taking-punch, falling-back-death`); `CLAUDE.md` (hand edits go in `tools/pixellab_overrides/`, never on the atlas); E12 §9.1 item 2.

**Depends on.** ENG-05b (the costume names the sprite).

**Owner model.** PixelLab pipeline (art), not engine code.

**Current code / decision.** There is **no stock "carry" animation**, and the pipeline forbids off-model `action_description` custom animations. So the parcel is **baked into the costume sprite's design**: `aw_hivis_courier_v2` is drawn holding a parcel across its `walk` and `breathing-idle` frames, made with the standard `pixellab_pipeline.py` route (parcel as part of the character, not a separate animation state). This is an art note, not engine code. Hand edits go in `tools/pixellab_overrides/`.

**Change.** None in engine. Produce the `aw_hivis_courier_v2` walk atlas and `aw_hivis_courier_talk.png` with the parcel baked in, through the PixelLab pipeline, with any hand edits under `tools/pixellab_overrides/`.

**Tests to add.** None (art asset).

**Acceptance.** The asset loads as the costume sprite in E12 and reverts cleanly (ENG-05b tests cover the revert).

**Episodes that depend on it.** E12 only.

**Shared code paths.** None.

**Do not break.** The atlas-override rule (re-imports rebuild from PixelLab plus overrides; `pixellab_drift_audit.py` finds untracked edits).

**How it is guarded.** Art only; no engine or shared code touched.

**Stop and ask if.** A separate carry animation state is wanted after all (it is off-model and costly; the baked-in parcel is the decided approach).

---

## ENG-05e Real `#trigger_minigame` (E12 only if needed)

**Goal.** Make `# trigger_minigame:<name>` actually start the named minigame instead of only showing a notification. **E12 does not need this** (ENG-05a reuses `watchCall` for the flip hand-back); build it only if ENG-05a's hand-back cannot reuse `watchCall`.

**Read first.** `minigames/helpers/chat-helpers.js` (`trigger_minigame` around `:190`, today "Actual minigame triggering would be game-specific"); `systems/MinigameFramework` (`startMinigame`); E12 §9.1 item 5.

**Depends on.** Nothing. ENG-08 if a schema allow-list is added.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** `# trigger_minigame:<name>` shows a notification and logs; it starts nothing (`chat-helpers.js:190-201`).

**Change.** Make the tag call `MinigameFramework.startMinigame(name, ...)` for a name on a small **allow-list** (so untrusted ink cannot launch arbitrary scenes). With the tag unused, nothing changes. The allow-list keeps the lab and SAFETYNET safe.

**Tests to add.** `test/js/social-tag-processor.test.mjs` (extend): an allow-listed `trigger_minigame` tag calls `startMinigame`; a name not on the list only notifies, as today.

**Acceptance.** The standard engine acceptance, plus the extended tag-processor test.

**Episodes that depend on it.** E12 only, and only if `watchCall` cannot be reused (it can; prefer not to build this).

**Shared code paths.** `chat-helpers.js`, used by every scenario with NPC dialogue. Guarded by the allow-list and by the tag being unused elsewhere.

**Do not break.** Every scenario that uses ink tags; the lab; m01/m02.

**How it is guarded.** The tag is already parsed; the change only adds a guarded launch for allow-listed names. No existing scenario uses the tag to launch, so behaviour is unchanged for all of them.

**Stop and ask if.** ENG-05a confirms `watchCall` is reused: then skip ENG-05e entirely (E12 §19).

---

## ENG-06 Authored AI-assistant overlay (E13)

**Goal.** An authored assistant surface for E13's flip-region beats: a chat window with authored replies only (no runtime language model), a strike-out paste panel, information-class tags, a "Check source" action, and a "summarise my emails" mode that surfaces a planted hidden instruction (E13 §9.1, §9.2). Everything is authored; identical replies on repeat (E13 §17, decision P).

**Read first.** `episode-runner-minigame.js` (`_renderFlip:489`, `_flipProps:466`, `watchCall:760` as the reopen pattern); `flip-view.js` (`renderFlipView:91`); `inbox-triage/triage-kinds.js` (the email card, for the "show hidden text" reveal on item `e13_supplier_injection`); E13 §7 (the attack-first justification), §9.2, §11, §20.1.

**Depends on.** ENG-07 (the announced video-call demo's label), ENG-08 (the assistant config schema; the two scenario-local tells need no library change, see change 3). The mail-client template write stage and the triage kinds are built.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Decision: the assistant runs in the flip region as an overlay, not a new `STAGE_IDS` stage.** E13's attack-first shape (the learner plants the hidden instruction with the built mail-client write stage; the assistant beats are the flip's "now it is aimed at you" empathy and defence teaching) keeps the episode inside the frozen `STAGE_IDS` with no `childLaunch` or stage-order change. This is better guarded than a new `assistant` stage (which would change `STAGE_IDS`, `stagesFor`, `childLaunch` and the validator stage lists and risk the 38 shells).

**Current code.** The flip region is drawn by `_renderFlip` (`:489`) through `renderFlipView`. There is no assistant surface. The email card (`triage-kinds.js`) has no "show hidden text" reveal.

**Change.**

1. **New child scene `assistant-chat`** (`minigames/assistant-chat/assistant-chat-minigame.js`), opened from the flip region (after the scripted flip line, before `_complete('flip')`), reusing the `watchCall` reopen pattern so the runner reopens for the rest of the flip/defend. It reads `awarenessEpisode.assistant` config: authored exchanges, a paste panel with strike-out lines and information-class tags, a "Check source" action that opens an authored document, a "summarise my emails" mode that shows the learner's planted line as a suggestion, and a "show hidden text" reveal. Every reply is authored data keyed to the learner's input choices; there is no language model and no network call (E13 §18). The scene declares one object-valued state global (E13 names it `e13_assistant_state`).
2. **Two optional email-card keys** in `triage-kinds.js`: `page`-independent `hiddenText` (the white-text line) and a "show hidden text" reveal button on the email surface, both optional; absent, the email card renders exactly as today. These serve the scored item `e13_supplier_injection` in the defend set.
3. Schema/validator (ENG-08): add `awarenessEpisode.assistant` (authored exchanges, paste lines with class tags, documents, the summarise mode) and the two optional email-card keys. The two scenario-local tells `hidden_instruction` and `deepfake_request` need **no** ENG-08 library or validator change: they are declared on E13's set in `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence per flagging message, which `triage.rb` `flag_universe` (`:209`) already accepts for a labelled non-factor (the pattern E9, E10 and E12 use). Do not add them to the shared `CHANNEL_TELLS` and do not add a `SKILL_NAMES` entry. Lint that the assistant config has no free-text/model field and that every reply is a literal string.

**Tests to add.** `test/js/social-assistant-chat.test.mjs` (jsdom): the assistant returns the same authored reply on repeat (no randomness, no network); the paste panel strikes out a line and the summary omits it; "Check source" opens the authored document; the "summarise my emails" mode surfaces the planted line; with `awarenessEpisode.assistant` absent the flip is drawn exactly as today. Extend `social-triage-kinds.test.mjs`: the email card with no `hiddenText` renders as today; with it, the reveal shows the white line. Extend `validator-social-awareness.test.mjs` / `validator-social-triage.test.mjs` for the config and the two new tells.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-assistant-chat.test.mjs test/js/social-triage-kinds.test.mjs test/js/validator-social-awareness.test.mjs`. Expected: all pass, `git status --porcelain scenarios/` empty.

**Episodes that depend on it.** E13 only (the full variant; the defend-only variant drops the assistant beats).

**Shared code paths.** A new child scene plus two optional email-card keys in `triage-kinds.js` (shared with the lab, guarded by the new optional keys). The flip-region hook runs only when `awarenessEpisode.assistant` is set.

**Do not break.** The E1 to E7 flips; the email card in every triage mission and the lab; `test_social_episode`.

**How it is guarded.** No `STAGE_IDS` change. The assistant opens only when `awarenessEpisode.assistant` is authored; the email-card keys are optional and absent on every built item. Identical authored replies (no model, no network) keep the scene deterministic for the bridge.

**Stop and ask if.** ENG-06 would rather own a dedicated `STAGE_IDS` stage after `write` (E13 §20.1): that is a `STAGE_IDS` + `childLaunch` + validator change and is **not** the design here; confirm before changing it.

---

## ENG-07 Configurable video-call label (E13)

**Goal.** Replace the hard-coded `SECURE VIDEO LINK` label (`person-chat-ui.js:264`) with the organisation's meeting-tool name ("Brightwell Meet") and an **External** participant tag, and expose that label to the triage `call` card that carries the Project Heron deepfake (E13 §9.2, §11, §20.2).

**Scope (so it is not confused with ENG-03a).** ENG-07 is only the person-chat video-call **bar label** and the triage `call` card's meeting-tool name and participant tag. It is **not** the per-set verdict/action relabel, which is ENG-03a's `triageSet.verdictLabels`. Any spec that wants to relabel the triage action buttons per set points at ENG-03a, not ENG-07.

**Read first.** `person-chat/person-chat-ui.js` (the video-call chrome, `initVideoCallOverlay:255`, the hard-coded label `:264`); `systems/npc-manager.js` (`conversationMode: "video-call"`, around `:911` and `:1110`); `inbox-triage/triage-kinds.js` (`call()` `:449`); E13 §9.2, §11.

**Depends on.** ENG-08 (schema). Nothing else.

**Current code.** `initVideoCallOverlay` writes a fixed `<span class="person-chat-vc-link">SECURE VIDEO LINK</span>` (`:264`). The peer name is already set from the NPC's `displayName` via `textContent`. The triage `call` card (`call()` `:449`) shows `callerId`, `from.address`, `time` and the transcript; it has no meeting-tool label or External tag.

**Change.**

1. **Person-chat label.** Read an optional label and tag from the conversation config (for example `conversationMode: "video-call"` with `videoLabel: "Brightwell Meet"` and `participantTag: "External"`); when absent, the default stays **"SECURE VIDEO LINK"** (m02 unchanged). Set via `textContent`.
2. **Triage `call` card.** A new optional `call.videoLabel` and `call.participantTag` on a `call` message: when present, the card shows the meeting-tool name and the tag (so the scored Project Heron item reads "Brightwell Meet / External"); absent, the card is exactly as today. This keeps the scored deepfake a triage `call` (E13 §11: there is no `video-call` triage kind; the person-chat video-call is only the unscored announced demo).
3. Schema/validator (ENG-08): add the optional label/tag fields to the person-chat conversation config and to a `call` triage message; keep the default.

**Tests to add.** `test/js/social-video-call-label.test.mjs`: with no label the person-chat chrome shows "SECURE VIDEO LINK"; with `videoLabel`/`participantTag` it shows those (via `textContent`). Extend `social-triage-kinds.test.mjs`: a `call` card with `videoLabel`/`participantTag` shows them; without, it is as today.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-video-call-label.test.mjs test/js/social-triage-kinds.test.mjs`, and the m02 video-call still shows the default label (`r4-door` / m02 bridge).

**Episodes that depend on it.** E13 (the announced demo and the scored Project Heron item). If ENG-07 slips, E13's item ships with the default `call` banner and moves the "Brightwell Meet / External" wording into the item's `callerId`/transcript text (E13 §19, degraded).

**Shared code paths.** person-chat (used by m02's video call) and the triage `call` card (used by the lab). Guarded: the default label stays "SECURE VIDEO LINK" and the `call` card is unchanged without the new keys.

**Do not break.** m02's video call label; the built `call` cards (E3, E7, the helpdesk forms); the person-chat self-view.

**How it is guarded.** The label and tag are new optional keys; absent, the hard-coded default and the built `call` card render unchanged.

**Stop and ask if.** ENG-07 cannot expose the label to the triage `call` card (only to the person-chat bar): then the Project Heron item ships degraded as above (E13 §19).

---

## ENG-08 Schema and validator changes (all packets)

ENG-08 collects every schema (`scripts/scenario-schema.json`) and validator (`scripts/validate_social/awareness.rb`, `triage.rb`) change the packets above need, in one place, so a single change keeps `--strict-social` green. `socialAwarenessEpisode` and `socialTriageSet` are `"additionalProperties": false`, so every new key must be added to the schema or it fails validation.

**Owner model.** `general-purpose`, `model: "sonnet"`.

### New stage ids and stage orders

- Add `guess` (ENG-02) and `mistake` (ENG-04) to the `stages` enum in the schema (`socialAwarenessEpisode.stages.items.enum`) and to `awareness.rb` `STAGES` (`:18`). Add both to `episode-model.js` `STAGE_IDS` and `ATTACK_STAGES` (owned by ENG-02/ENG-04; listed here so the validator matches).
- Extend `awareness.rb` `stage_orders` (`:157`) so a full episode may author, in addition to the built orders:
  - `brief osint guess flip defend debrief` (ENG-02; guess after osint, no `write`);
  - `brief mistake flip defend debrief` (ENG-04; no `osint`, no `write`);
  - `brief write flip defend debrief` (E13; `osint` optional, the attack is a mail write with no recon).
  State each new order with a comment naming its episode, as the built `MFA_AFTER`/`BUILD_AFTER` comments do.
- **Relax `attack_checks` (ENG-04).** `awareness.rb:53` runs `attack_checks` for every `full?` episode. Change the guard so it runs only when the stage list contains an attack-artefact stage (`osint`, `build`, `write`, `mfa` or `guess`), and add the lint that a `mistake` episode has no `attack` block. This lets a consequence-flip full episode (E11, E15, E16, stages `brief mistake flip defend debrief`) validate with no `attack` block. Owned by ENG-04; listed here so the validator change is tracked in one place.

### New episode keys

Add to `socialAwarenessEpisode` (all optional, `additionalProperties: false`): `flipAftermath` and `stepLabels` (ENG-01), `guess` (ENG-02), `mistake` and `flip` (object `{ mode }`, ENG-04), `world` (ENG-05a), `assistant` (ENG-06), `doneGlobal` and `oncePerLearner` (ENG-10), `sortDrill` (ENG-11), `concernForm` (ENG-12), `privacyPanel` (ENG-13). `flipAftermath` is `{ heading?, victimName?, intro?, items[], line? }` (ENG-01); `stepLabels` is a `{ <stageId>: string }` map. Add to `strings`: `flipMontageByChoice` (ENG-04), `briefCards`, `briefDone`, `alreadySeen` (ENG-10), `guessNote` (ENG-02). Add to a `call` triage message: `videoLabel`, `participantTag` (ENG-07), and the email-card `hiddenText` reveal (ENG-06). Add to a `page` triage message (ENG-03a): `state` (enum of the seven ids `fakeCheck`, `fakeUpdate`, `fullScreenAlarm`, `extensionPermission`, `downloadBar`, `browserWarning`, `relaunchBar`), `clipboardReveal` (string), `alarm` (`{ hintAfterMs }`), `permissions` (array of strings) and `download` (`{ filename }`); and **relax the `page.url` requirement** in both the schema and `triage.rb` (`page.url is missing`, `:393-395`) so `url` is required only for the web-page states (no `state`, `fakeCheck`, `fakeUpdate`, `downloadBar`, `browserWarning`) and optional for the chrome/overlay states (`relaunchBar`, `fullScreenAlarm`, `extensionPermission`). Add to `socialTriageSet`: `verdictLabels` (ENG-03a), `choice`-kind support (ENG-09a), `person`-kind support (ENG-09c). Add to `landingPages[]`: `pageType` (enum `signin`/`fakeCheck`) and the `check` object, and **remove `brands` from the item's static `required`** (leaving `["id", "targets"]`), the "a sign-in page needs `brands`" rule moving to `landing.rb`; gate the `brands`, `pretext.brandId` and `linkCredible`-required-target checks in `landing.rb` on `pageType !== "fakeCheck"` (all ENG-03b, with the full list in that packet's "ENG-08 additions" block).

### New message kinds

Add `choice` (ENG-09a) and `person` (ENG-09c) to the triage message `kind` enum and to `NON_EMAIL_KINDS` handling in `triage.rb`; add their field lints (ENG-09a/c own the exact lints).

### New tells: scenario-local or shared?

A tell id can come from three places:

- **The shared library.** `CHANNEL_TELLS` in `systems/phish-rules.js` (`:52`, 12 ids) and the matching Ruby list `CHANNEL_TELLS` in `triage.rb` (`:38`, the same 12). Both are shared with the lab.
- **A scenario-local tell.** `triage.rb` `flag_universe` (`:209`) accepts an id in a set's `channelTells` that is not in the shared list, provided the set's `flagChips` gives it a label and it is not one of the seven `FACTORS` (`:35`). `triage-flags.js` `chipIdsFor` (`:154`) treats it the same on the JS side (`local(id)` = a `flagChips` label and not a factor).
- **Its sentence.** `triage-flags.js` `redFlagString(id, message)` (`:196`) uses the message's `factorStrings[id].redFlag`, then `CANONICAL`, then `CHANNEL_TELLS`, else the raw id. The flip's `tellSentence()` (`flip-view.js:85`) falls back to `PAGE_TELLS`, then a generic line.

**Rule.** A tell is **shared** only when a `10_CHECK_FORMS.md` check-form item **actually scores it**. Otherwise it is **local** to each set that uses it, declared in that set's `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence per flagging message (without that sentence the debrief prints the raw id), with no library, `SKILL_NAMES` or validator change, **even when two sets use the same id**, because the sets are never merged. Promoting a tell to the shared library (only for the form-scored case) means, in the same change: append the id and its sentence to `CHANNEL_TELLS` in `phish-rules.js`, append the id to `CHANNEL_TELLS` in `triage.rb`, **and add a short skill name for the id to `SKILL_NAMES` in `triage-flags.js`** (`:47`). The `SKILL_NAMES` entry is not optional: two tests loop over every `CHANNEL_TELLS` id and assert a skill name (`test/js/social-triage-weakest.test.mjs:201` and `test/js/social-gap-triage-flags-comparison.test.mjs:89`, both `for (const id of Object.keys(F.CHANNEL_TELLS)) assert.ok(F.SKILL_NAMES[id])`), and the on-screen weakest-skill chip would otherwise show the raw id. **Append only**: never rename or remove an id (the lab's sets and the 38 shells reference the existing twelve). A shared-list tell is still off in every set until the set lists it in `channelTells`, so the lab is unaffected.

**Every new tell the E8 to E17 specs use is listed below, each marked local or shared.** On the rule above, **all are local**: `10`'s two pairs score only shared-library ids, none of the new ones (`general_v2`'s scored flags are `lookalike_domain`, `padlock_myth`, `unrequested_mfa_push`, `senderTrust`, `linkCredible`, `reply_to_differs`; `data_conduct`'s are `senderTrust`, `pretextRelevant`, `secrecy_or_bypass`, `vish_callback_pressure`, `reply_to_differs`). So no `CHANNEL_TELLS`/`SKILL_NAMES` append is made and the two loop tests above pass unchanged. `unapproved_tool` is the only id used by **two** sets (E15 and E17); it stays **local in each**, because the sets are never merged and no `10` item scores it.

| Id | Used by today | Shared or local | Reason |
|---|---|---|---|
| `unexpected_sent_item` | E8 (defend) only | **local** | one set; `10`'s `general_v2` does not score it, so it stays local to E8's set; promote to shared only if a later check item scores it |
| `unrequested_reset` | E8 (defend) only | **local** | one set; not in `general_v2`'s scored flags |
| `ransomware_note` | E8 (defend) only | **local** | one set; E13 does **not** use it (E13's tells are `hidden_instruction`/`deepfake_request`), so promote only when a second set adopts it |
| `mfa_number_relay` | E9 (defend) only | **local** | one set; E3 uses `unrequested_mfa_push`, not this id, so no second set uses it today; close to `unrequested_mfa_push` but means a different thing (reading a number back, not approving a prompt), so keep the id distinct |
| `fake_check_paste` | E10 (defend) only | **local** | one set; `general_v2` item 2 scores `lookalike_domain`/`padlock_myth`, not this id |
| `fake_update_prompt` | E10 (defend) only | **local** | one set; `general_v2` does not score it |
| `dangerous_download` | E10 (defend) only | **local** | one set; `general_v2` item 8 scores `senderTrust`/`reply_to_differs`, not this id |
| `fake_alarm_callback` | E10 (defend) only | **local** | one set uses it; close to `vish_callback_pressure` but it is a page, not a caller, so keep separate as a local chip |
| `browser_permission_grab` | E10 (defend) only | **local** | one set uses it; no check form item uses it |
| `tailgating` | E12 (defend) only | **local** | one set (E12 reception); physical-security check items are a later form, not yet built |
| `no_escort` | E12 (defend) only | **local** | one set |
| `uniform_pretext` | E12 (defend) only | **local** | one set |
| `not_expected` | E12 (defend) only | **local** | one set |
| `hidden_instruction` | E13 (defend) only; E13 §14 proposes a general-pool check item later | **local** | one shipped set today; promote to shared when the general-pool AI item (E13 §14) is built |
| `deepfake_request` | E13 (defend) only; E13 §14 and `general_v2` item 6 touch the topic | **local** | `general_v2` item 6 scores on `senderTrust`/`linkCredible`, not `deepfake_request`, so only E13 uses this id today; promote if a check item later scores on it |
| `fake_profile` | E14 (defend) only | **local** | one set; `data_conduct` does not score it |
| `recon_request` | E14 (defend) only | **local** | one set; `data_conduct` does not score it |
| `found_media` | E15 (defend) only | **local** | one set; `general_v2` does not score it |
| `unapproved_tool` | **E15 and E17** (two sets) | **local in each** | two sets use the id, but the E15 set (`e15_shortcuts_inbox`) and the E17 set (`e17_acceptable_use_inbox`) are never merged and no `10` item scores it, so it stays local in each set with its own `flagChips` label; **not** promoted to the shared library (no `CHANNEL_TELLS`/`SKILL_NAMES` append) |
| `insider_offer` | E16 (defend) only | **local** | one set; `data_conduct` does not score it |

E14, E16 and E17 also flag the shared-library ids `lookalike_domain` and/or `secrecy_or_bypass` (already in the twelve); these need no change and are enabled per set through `channelTells`, not through this table.

All the ids above are declared only in their own set's `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence on each message that flags them; no library change and no `SKILL_NAMES` change. Suggested `factorStrings.<id>.redFlag` wording for the E8 to E10 ids (the set authors it inline; E8 §11, E10 §11 and WP-15 hold the final wording for the E8 to E10 ids, and E12 to E17 §11 the rest):

- `unexpected_sent_item`: "A message or item in your own Sent folder that you did not send"
- `unrequested_reset`: "A password reset or security change you did not ask for"
- `ransomware_note`: "A message or on-screen note claiming your files are locked and demanding payment"
- `mfa_number_relay`: "A message asking you to type or read back a sign-in number or code"
- `fake_check_paste`: "A page telling you to paste or run something to prove you are human or to fix an error"
- `fake_update_prompt`: "A web page saying your browser or software is out of date and offering the update"
- `dangerous_download`: "A download you did not ask for, or a program pretending to be a document"

When a second set later adopts one of these ids, promote it to the shared library by the Rule above (append to both `CHANNEL_TELLS`, add a `SKILL_NAMES` entry), moving the wording above into `phish-rules.js` `CHANNEL_TELLS`.

**WP-15 (core_02) note.** WP-15 asks for no new tells: the chat-app "it's me, new number" item uses `senderTrust` + `secrecy_or_bypass`, and the remote-access item uses `vish_callback_pressure` + `borrowed_authority`, all shared-library ids already present. If the user later wants `new_number_itsme` or `remote_access_request` chips, those are shared-library additions by this same rule.

**Tests to add.** None, because no id is promoted to shared. When an id is later promoted: extend `validator-social-triage.test.mjs` with a set listing the new id in `channelTells` without `flagChips` giving no error; add a `social-channel-tells-e8-e13.test.mjs` asserting `redFlagString('<id>', {})` returns the new sentence, not the id, for each promoted id; and confirm the two `CHANNEL_TELLS` loop tests (`social-triage-weakest.test.mjs:201`, `social-gap-triage-flags-comparison.test.mjs:89`) still pass, which requires the promoted id's `SKILL_NAMES` entry.

**Acceptance.** The standard engine acceptance, which runs `test/js/social-triage-weakest.test.mjs` and `test/js/social-gap-triage-flags-comparison.test.mjs` as part of `bin/test-js`; with no shared-list append, both pass unchanged. The lab bridges `6` and `r4-door` must pass unchanged (no shared-list id is enabled in any lab set).

**How it is guarded.** Every schema addition is an optional key under `additionalProperties: false`; every stage-order addition adds an order and removes none; every shared-list append is additive and off until a set opts in. The 38 shells, the lab and the six built check forms author none of the new keys or ids, so they are unchanged.

---

## ENG-09a Authored-choice triage kind `choice` (E9 password cards, check-form choice items)

**Goal.** A scored authored-decision card inside a triage set: a short situation with two or three authored options, one correct, scored under the `awareness` profile. It carries E9's password-practice cards (E9 §11 rows 4 to 7: stronger passphrase, reuse-vs-unique sign-up, the sign-in ladder, the shared-PC choice) and any check-form choice item. It is an abstract, authored model (E9's content level: no real password, no working technique).

**Read first.** `triage-kinds.js` (`NON_EMAIL_KINDS:23`, `SURFACES:507`, `renderKindSurface:514`, `actionsFor:66`); `triage-flags.js` (`chipIdsFor:154`); `triage-scoring.js` (`KIND_VERDICT_POINTS:43`, `VERDICT_POINTS:70`, `verdictPoints:88`, `FULL_VERDICT_POINTS:103`, the `perMessage` record at `:285`); E9 §11, §14; `10_CHECK_FORMS.md`.

**Depends on.** ENG-08 (the kind enum and the schema).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** `NON_EMAIL_KINDS` is `['sms','voicemail','qr','page','call','push']`; there is no `choice` kind, and the verdict actions are tied to Trust/Report/Delete/Verify or the call/push actions. A multiple-choice "which is stronger?" card has no surface.

**Change.** Add `choice` to `NON_EMAIL_KINDS` and a `choice(rec, h)` surface to `SURFACES` that renders `rec.choice` = `{ prompt, options: [{ id, label, verdict }], note? }` as a short authored question with one option button per option. A `choice` card holds **one decision only**, so it offers its own option buttons instead of the standard Trust/Report/Delete/Verify action row (`actionsFor` is not called for a `choice` card, and there is no Verify button).

**Scoring (authoritative). Each option maps to one of the four built verdicts, and the chosen option is scored exactly as that verdict is scored, through the existing scorer, with no bespoke choice point values.** Every `options[].verdict` is one of `trust`/`report`/`delete`/`verify`. The card carries a `truth` block like any triage message: `truth.isPhish` (and optional `truth.critical`), plus `truth.correct` naming the verdict of the right option. When the learner picks an option, its `verdict` is fed to the scorer as that message's verdict, scored under the `awareness` profile by `verdictPoints(/* profile */ 'awareness', truth.isPhish, verdict, /* kind */ 'choice')` (`triage-scoring.js:88`): the chosen verdict reads `KIND_VERDICT_POINTS` then `VERDICT_POINTS` exactly as every other card does. A `choice` kind has no `KIND_VERDICT_POINTS` entry (that table holds `call` only, `:43`), so it falls through to `VERDICT_POINTS` (`:70`). The author therefore sets `truth.isPhish` and the options' verdicts so the right option lands on the full-marks verdict for that truth (under `awareness`, `report`/`verify` score 60 on a phish and 60 on a genuine item; `delete` 30; `trust` 0 on a phish, 60 on a genuine item): a correct choice earns `FULL_VERDICT_POINTS` (60) and records `handledRight: true`, a wrong choice earns fewer points and records `handledRight: false`. The record written into `se_awareness_records` is the standard `perMessage` entry (`triage-scoring.js:285`): `{ id, isPhish, verdict, verdictPoints, flagPoints: 0, score, caught: [], missed: [], falseClaims: [], answered: true, units: [], handledRight, critical }`. A `choice` card authors no flags, so `flagPoints` is 0 and the flag arrays are empty. No free text. The card shows `rec.choice.note` ("these are made up; no real password is typed").

Schema (ENG-08): a `choice` object on a triage message with `prompt`, `options[]` (each `id`, `label`, `verdict`), and a `truth` with `isPhish` and `correct`; lint that every `options[].verdict` is a built verdict, that exactly one option's verdict equals `truth.correct`, that `truth.correct` is the verdict scoring full marks for `truth.isPhish` (so the "right" option really is the full-marks one), that the card has exactly one decision, and that no option value looks like a credential.

**Tests to add.** `test/js/social-triage-choice.test.mjs`: the card renders the prompt and one button per option; picking the option whose `verdict` equals `truth.correct` scores `FULL_VERDICT_POINTS` and records `handledRight: true`, and a wrong option scores fewer points and `handledRight: false`, both through the shared `verdictPoints`/`scoreTriage` path (assert the recorded verdict and score, not a bespoke value); the record has empty flag arrays and `flagPoints: 0`; no text input exists and there is no Verify button; with no `choice` object the message is handled as before (a set that never authors `choice` is unchanged). Extend `validator-social-triage.test.mjs` (clean choice item; failing cases: an option with a non-built `verdict`, no option matching `truth.correct`, two options matching `truth.correct`, a `truth.correct` that is not the full-marks verdict for `truth.isPhish`).

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-triage-choice.test.mjs test/js/validator-social-triage.test.mjs`.

**Episodes that depend on it.** E9 (defend-half password cards). Optionally a check-form choice item.

**Shared code paths.** Triage, used by the lab and every triage mission. Guarded by the new kind: a set with no `choice` message is unchanged.

**Do not break.** Every built triage set and the lab; the six built check forms; the scorer's existing kinds.

**How it is guarded.** New kind, opt-in; absent, triage is byte-for-byte as today.

**Stop and ask if.** The password cards need a strength meter or a vault-health view beyond a plain choice (E9 §11 rows 4 to 5 mention a meter): keep it as an authored choice with the meter drawn as static authored bands (no live scoring of typed input); if a live meter is wanted, that is a separate surface, not `choice`.

---

## ENG-09b Debrief panel list (E8 and any episode with more than one concept panel)

**Goal.** Let the debrief show more than one concept panel. E8 and others want several short concept cards; the built `strings.conceptPanel` is a single panel (string or `{heading,text}`).

**Read first.** `episode-runner/debrief-view.js` (`buildPanel`, the `conceptPanel` render); the schema `strings.conceptPanel` (`scenario-schema.json:1898`); E8 §12.

**Depends on.** ENG-08 (schema).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** `strings.conceptPanel` is one panel (string or `{heading,text}`), rendered once by the debrief view.

**Decision.** The built `strings.conceptPanel` is a single panel (a string or `{ heading, text }`), confirmed in `debrief-view.js` `buildPanel` and the schema (`scenario-schema.json:1898`). E8, E9 and E10 each need more than one short concept card, so ENG-09b is required for them. E13 ships a single concept panel and uses the built one-panel form, so it does not depend on ENG-09b. There is **one** new shape, not two: widen the existing `strings.conceptPanel` to also accept an **array** of `{ heading?, text }`. Do not add a second `strings.conceptPanels` key. An episode with a single panel keeps the string/object form and is unchanged; an episode with several authors the array. An episode that needs only one panel does not depend on ENG-09b.

**Change.** Accept an **array** of `{ heading?, text }` for `strings.conceptPanel`, rendered as successive panels in order. A string or single object is still accepted and renders exactly as today. The change has **two halves, both required**; the schema half alone is not enough.

1. **Schema (ENG-08):** widen `conceptPanel` to also allow an array of the panel object.
2. **Validator lint (`scripts/validate_social/awareness.rb` `string_checks`, `:296`; the `conceptPanel`/`voicePanel` loop at `:305-310`).** That loop today reads `text = v.is_a?(Hash) ? v['text'] : v` and errors `strings.conceptPanel has no text` whenever `text` is not a non-empty String. An **array** value is neither a Hash nor a String, so it takes the `else v` branch and errors today (verified against the current code, 2026-10-28): a two-entry-array `conceptPanel` raises both the schema error and `strings.conceptPanel has no text`. So widen the loop for `conceptPanel`: when `v` is an Array, require at least one entry and error on any entry whose `text` is missing or empty (for example `err("strings.conceptPanel entry N has no text; the debrief would show an empty panel")`); the String and `{heading,text}` branches are unchanged. Without this lint half, the packet's own array fixture fails `--strict-social` even after the schema is widened.

Because `conceptPanel` is already in `STRINGS_VALUE_EXEMPT` and `STRINGS_ERB_ONLY_OK` in the parity test, the array form needs no new allow-list entry.

**Tests to add.** Extend `social-episode-views.test.mjs`: a single-panel `conceptPanel` renders as today; an array renders one panel per entry in order. Extend `validator-social-awareness.test.mjs` for the array shape (non-empty `text` per entry).

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-views.test.mjs test/js/validator-social-awareness.test.mjs`.

**Episodes that depend on it.** E8, E9, E10 (any with more than one concept card).

**Shared code paths.** Debrief view (episode runner only). The lab and SAFETYNET never open it.

**Do not break.** Every built debrief (E1 to E7) with a single `conceptPanel`.

**How it is guarded.** The single-panel shapes still validate and render identically; the array is a new accepted form.

**Stop and ask if.** The panels need per-panel art or layout beyond heading+text (then it is a bigger debrief change).

---

## ENG-09c In-person triage kind `person` (E12 physical items; optional)

**Goal.** A visibly distinct in-person visitor card for physical-security triage. **E12 ships without it**: E12 §11 decides the six reception items are the built `call` kind (a visitor maps onto Comply/Escalate/Refuse/Ring back), which is scored and mirror-pairable. ENG-09c is only for a later physical-security check form that wants a visitor card visually distinct from a phone call.

**Read first.** `triage-kinds.js` (`call()` `:449`, `NON_EMAIL_KINDS:23`); E12 §11, §14.

**Depends on.** ENG-08.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** A visitor is drawn with the `call` surface today (E12's decision). There is no `person` kind.

**Change.** Add an optional `person` kind mirroring `call` (same four actions, relabelled "Let in / Report / Turn away / Check the list") for an in-person visitor, if a later physical-security form wants it. E12 does not need it.

**Tests to add.** Only if built: `social-triage-person.test.mjs` mirroring the `call` tests.

**Acceptance.** The standard engine acceptance if built.

**Episodes that depend on it.** None required; a later physical check form optionally.

**Shared code paths.** Triage, guarded by the new kind.

**Do not break.** E12's `call`-kind reception set; the lab.

**How it is guarded.** New opt-in kind; unused by E12 and every built set.

**Stop and ask if.** E12 is asked to use `person` for its scored defend beat: do not; 11 N15 says person-chat/person is unscored, and E12's scored beat is the triage `call` kind.

---

## ENG-09d Shell-count and parity-list guards (every new episode)

**Goal.** Keep the test guards that pin the shell count and the parity allow-lists honest as E8 to E17 and the new check pairs land, so a new shell cannot silently drop out of a guard or slip past parity.

**Read first.** `test/js/social-awareness-fragment-erb-parity.test.mjs` (the shell list, `STRINGS_ERB_ONLY_OK:59`, `SET_ERB_ONLY_OK:61`); `test/js/social-awareness-rule-of-thumb.test.mjs` (the rule-of-thumb guard across all shells); `awareness/CHECK_PARITY_AUDIT.md`.

**Depends on.** Nothing engine-side; tests only.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** The parity test iterates a known set of awareness shells and the rule-of-thumb test asserts the shared string is byte-identical across all 38 shells. New shells must join both.

**Change (tests only).** As each new episode/check pair ships: add its shells to the parity test's shell list and the rule-of-thumb guard; add `flipMontageByChoice` to `STRINGS_ERB_ONLY_OK` (ENG-04); add any new erb-only string key with a reason. Update the `social-awareness-rule-of-thumb.test.mjs` count assertion (`assert.equal(shells.length, 38, ...)` today) to the new total each time, counting +2 folders per full episode, +1 for E17, and +4 per new check role (01 P6 holds the same math); the `n` path logic in the parity test needs no change (`e${n}` already yields `e10`). No engine change. The path formatting in the parity test is not touched; only the `EPISODES` list, the allow-lists and the count grow.

**Tests to add.** The guard updates themselves; a count assertion that fails if a new shell is not registered.

**Acceptance.** The standard engine acceptance; the parity and rule-of-thumb tests cover the new shells.

**Episodes that depend on it.** Every new episode and check pair.

**Shared code paths.** Tests only.

**Do not break.** The existing parity and rule-of-thumb guards for the 38 shells.

**How it is guarded.** Tests only; no runtime change.

**Stop and ask if.** A new episode needs an erb-only string not yet allow-listed: add it with a reason, do not loosen the test's logic.

---

## ENG-10 The core_00 first-play brief and completion (WP-12)

**Goal.** Support the core_00 first-play episode described in `11_WP12_FIRST_PLAY_AND_ANNUAL.md`: a brief-only episode (`"stages": ["brief"]`) that shows a short sequence of "how it works" cards, ends on a "Got it" button, is shown only once per learner, and writes a clean done global when it finishes.

**Read first.** `public/break_escape/js/minigames/episode-runner/episode-runner-minigame.js` (`_renderBrief`, `_renderFinished`, `_saveState`, `_complete`); `episode-model.js` (`stateKey`, `defendPrefix`, `completeStage`); `scripts/validate_social/awareness.rb` (`episode_checks:44`, the defend-set group `:57-66`, `stage_checks`, `STAGES_BY_VARIANT:19`, `full?:88`, `defend_set:359`, `conclusion_checks:444`); `11_WP12_FIRST_PLAY_AND_ANNUAL.md`.

**Depends on.** Nothing. The schema and validator changes are part of this packet (ENG-08 rule).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.**

- `_renderBrief()` draws one panel: the heading (`ep.brand?.name`), `strings.brief`, an optional `scopeNote` and a single "Start" button that calls `this._complete('brief')`. It has no multi-card sequence, no "Got it" gate and no once-per-learner gating.
- `_renderFinished()` draws "Finished" and writes nothing.
- `_saveState(state)` writes only `episode_<id>_state`. The only done global any episode gets is `episode_<id>_defend_done`, and the triage starter writes it, not the runner. So an episode with no triage stage has no completion global for an objective's `concludeRequires` or a host's event mapping.
- The validator accepts only the `full` and `defendOnly` stage lists (and `["check"]` for a check mission). So `"stages": ["brief"]` is rejected today.

**Stopgap (no engine change).** A host NPC event mapping on `global_variable_changed:episode_core_00_first_play_state` can complete the task when the stored state's `done` includes `brief` (`"condition": "value && Array.isArray(value.done) && value.done.includes('brief')"`). This still needs a validator allowance for `["brief"]`. Use it only if ENG-10 is not ready.

**Change.**

1. **Multi-card brief.** New optional `strings.briefCards`: an array of `{ heading?, text }` (plain text; a blank line starts a paragraph, as `buildPanel` in `debrief-view.js` does). When present, `_renderBrief()` shows one card at a time with "Next" and "Back" buttons and a "Card n of m" line. The last card's button is "Got it" (or `strings.briefDone` when set). Without `briefCards`, `_renderBrief()` is exactly as today.
2. **Completion global.** New optional `awarenessEpisode.doneGlobal` (a global name the scenario declares, for example `episode_core_00_first_play_done`). When the episode reaches its last stage (`state.stage` becomes null in `_complete`), the runner writes `doneGlobal = true` through `this.deps.write`, with `{ openChat: false }`, as `_saveState` does. Episodes without the key write nothing new, so the 38 built shells are unchanged.
3. **Once per learner.** New optional `awarenessEpisode.oncePerLearner: true`. When the done global is already true at `init()`, the runner goes straight to `_renderFinished()` with a "You have seen this already" line (`strings.alreadySeen`, with a default). Cross-mission carry-over (so another mission knows it was seen) uses the built `exportGlobals` on the doneGlobal, and needs no engine change.
4. **Validator and schema (`scripts/validate_social/awareness.rb`, `scripts/scenario-schema.json`).** Allow `"stages": ["brief"]` for a new `"variant": "brief"`, or accept it on a full episode only when `doneGlobal` is set. Prefer the new variant, because it keeps the attack checks off. **Extend the schema `variant` enum** (`socialAwarenessEpisode.variant`, currently `["full", "defendOnly"]`) with `"brief"`, or the schema rejects the new variant before the validator sees it. In `awareness.rb`, add a `STAGES_BY_VARIANT["brief"] = ["brief"]` entry (and keep `attack_checks` off for it, which the ENG-04 guard already does because the stage list holds no attack-artefact stage). Add `doneGlobal`, `oncePerLearner` and `strings.briefCards`, `strings.briefDone` and `strings.alreadySeen` to the schema. Lint that `doneGlobal` is declared in `globalVariables` and that `briefCards` is a non-empty array of objects with non-empty `text`.
   **Skip the defend-set group of checks for a brief-only episode.** A `brief` episode has no `defend` block, but `episode_checks` (`awareness.rb:57-66`) always runs `set = defend_set(ctx, ep, issues)`, which returns `err('defend.setId is missing')` at `:362` when `defend.setId` is absent, and then `set_checks`, `call_checks`, `result_global_checks` and (via `done`) `conclusion_checks` all key off that set. So a `brief` episode must take a branch that **skips the whole defend-set group** (`defend_set`, `set_checks`, `call_checks`, `result_global_checks`, `player_sent_auth_checks`, and the `conclusion_checks if done` that depends on the set's `done_global`): gate that block on `!brief?(ep)` (add a `brief?(ep)` helper beside `full?`/`check_mission?`, true when `ep['variant'] == 'brief'`). In its place, for a `brief` episode add a conclusion lint that the `missionConclusion` aim's `concludeRequires.globals` names `doneGlobal` (so "the objective concludes on `doneGlobal`" is actually checked; `conclusion_checks` today only runs `if done`, and `done` comes from the set, which a `brief` episode has none of). Confirm the runner's `defendSet` getter is never read on a brief-only run (no `defend`/`check` stage, so `_launchTriage` is never reached). This is the change that lets `scenarios/awareness_core_00_first_play` pass `--strict-social`, which WP-12's acceptance requires.

**Tests to add.**

- `test/js/social-episode-brief-cards.test.mjs` (jsdom, in the style of `social-episode-runner.test.mjs`): without `briefCards` the brief panel is unchanged; with three cards Next and Back move between them and "Got it" completes `brief`; `doneGlobal` is written once when the last stage completes and never for an episode without the key; `oncePerLearner` with the global already true renders the finished panel.
- Extend `test/js/validator-social-awareness.test.mjs` with a clean brief-only fixture (`test/js/fixtures/social_awareness/clean_brief_only.json`) giving no issues, and failing cases for a missing `doneGlobal` declaration and an empty `briefCards`.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-episode-brief-cards.test.mjs test/js/validator-social-awareness.test.mjs`. Expected: all pass, and `git status --porcelain scenarios/` is empty.

**Episodes that depend on it.** The core_00 first-play episode (WP-12) only. **The core_17 annual edition needs no engine packet:** it is built as a `defendOnly` shell whose defend set holds 8 messages (the `EPISODE_MESSAGES` cap), drawn from E1 to E7 with a mirror pair and the required channels, so it validates on the built `defendOnly` path with no `brief` variant, no new stage order and no cap change. The annual sitting is that shell followed by the learner's existing role post-check. Do not build ENG-10 for core_17; `11_WP12_FIRST_PLAY_AND_ANNUAL.md` Part B owns its content.

**Shared code paths.** Episode runner and the awareness validator only. The lab and SAFETYNET never open the runner.

**Do not break.** Every built brief (the bridges `e1-full` to `e7-full` click "Start" on the brief); `test_social_episode` (`p7-episode`); the check missions (`["check"]` stays as it is).

**Stop and ask if.** WP-12 wants the first-play brief to be scored or recorded in `se_awareness_records`. It should not be: it is a brief.

---

## ENG-11 Reusable sort drill (N bins + optional answer key) (E14, E15, E17)

**Goal.** One reusable "sort" surface that serves the three-way and multi-way teaching drills the E14, E15 and E17 specs each asked for as a separate surface. It runs inside the `defend` stage as a sub-activity (not a new stage id): a bank of authored cards, each sorted into one of a few authored bins, with the reason on screen. The bins and an optional answer key are config, so one surface covers:

- **E17 "can I?" sort:** bins **Allowed / Not allowed / Ask first**, scored by the organisation answer key, org-confirmable card bank with locked cards (E17 §11a).
- **E14 "Post or Not?" feed drill:** bins **Post / Tweak / Hold**, unscored teaching (E14 §11).
- **E15 "Swap Shop" match drill:** bins are the approved ways (match each shortcut to its approved route), scored or unscored (E15 §11). A match-to-one-of-N is a sort into N bins, so it folds here.

This replaces the three bespoke surfaces those specs each raised. The specs that must change say so in "Stop and ask if".

**Read first.** `episode-runner/debrief-view.js` and `_renderFlip`/`_renderDebrief` in the runner (how a defend-stage sub-activity is hosted); `inbox-triage` starter (how the scored set is launched, for the "runs inside defend" placement); E17 §11a (the card bank, locked cards, "Ask first always scores a point"), E14 §11 ("Post or Not?"), E15 §11 (Swap Shop).

**Depends on.** ENG-08 (schema). The organisation answer-key profile (built, used by E17) for scoring; unscored mode needs no profile.

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** There is no sort/drill surface. E14's feed drill, E15's Swap Shop and E17's can-I sort are each flagged in their specs as "needs a new ENG packet".

**Change.** A new child module `minigames/sort-drill/sort-drill-minigame.js`, opened inside the `defend` stage (alongside the scored triage set) when `awarenessEpisode.sortDrill` is authored. Config:

```jsonc
"sortDrill": {
  "bins": [ { "id": "allowed", "label": "Allowed" }, { "id": "not", "label": "Not allowed" }, { "id": "ask", "label": "Ask first" } ],
  "scored": true,                       // E17 true (answer key); E14/E15 false (teaching)
  "answerKeyProfile": "organisation",   // E17 only; omitted when scored:false
  "alwaysScoresBin": "ask",             // E17: "Ask first" always earns at least a point
  "cards": [
    { "id": "S01", "situation": "Stream the football on your work laptop at lunch", "answer": "allowed", "reason": "Reasonable personal use in your own time is fine", "locked": false, "confirmed": true, "new": false }
  ],
  "drawRules": { "oneOfEachAnswer": true, "newFirst": true }
}
```

- `bins` sets the labels, so the same surface is Allowed/Not allowed/Ask first, Post/Tweak/Hold, or the approved-way bins.
- `scored: true` scores against each card's `answer` via `answerKeyProfile` (E17's organisation key); `scored: false` is pure teaching (E14, E15), recorded for in-episode analytics only, never shown as a mark.
- `confirmed`/`locked`/`new` carry E17's org-confirmable bank: unconfirmed cards are never drawn; locked cards cannot be reparented and no org can move them to a softer bin or make reporting optional; `drawRules` enforce "at least one of each answer" and "changed-section cards first with a new badge".
- `alwaysScoresBin` gives E17's "caution always earns a point" rule.

Schema/validator (ENG-08): add `awarenessEpisode.sortDrill` (`additionalProperties: false`); lint that `bins` has 2 to 4 entries, every `cards[].answer` names a real bin, `alwaysScoresBin` (if set) names a real bin, and a scored drill names an `answerKeyProfile`.

**Tests to add.** `test/js/social-sort-drill.test.mjs` (jsdom): cards render into the authored bins; a correct drop scores (scored mode) and `alwaysScoresBin` always earns a point; unconfirmed cards are not drawn and locked cards cannot be moved to a softer bin; unscored mode records nothing as a mark; with `sortDrill` absent the defend stage runs exactly the scored triage set as today. Extend `validator-social-awareness.test.mjs` for the config and the lints.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-sort-drill.test.mjs test/js/validator-social-awareness.test.mjs`.

**Episodes that depend on it.** E14 ("Post or Not?"), E15 (Swap Shop), E17 (the "can I?" sort).

**Shared code paths.** A new child scene hosted in the `defend` stage (episode runner only); the built triage set runs beside it unchanged. The lab and SAFETYNET never open it.

**Do not break.** The built defend halves (the scored triage set is untouched; the drill is additive); `test_social_episode`.

**How it is guarded.** `awarenessEpisode.sortDrill` is a new optional key; absent, the defend stage runs only the scored triage set, exactly as the 38 shells do.

**Stop and ask if.** The user wants Swap Shop to feel like a matching game rather than an N-bin sort: raise it as its own packet; the sort covers the teaching either way. (This one packet folds the three surfaces the specs each asked for: E14 §11 "Post or Not?", E15 §11 Swap Shop and E17 §11a the "can I?" sort each use `sortDrill` with its own `bins`, not a bespoke surface.)

---

## ENG-12 "Raise a concern" fact-chip form (E16)

**Goal.** E16's defend half includes a short "raise a concern" step: build a brief report from fact chips (what, when, where, who) and conclusion chips, where the feedback favours facts over a verdict (E16 §11). This is a chip-composition interaction, not a sort, so it does not fold into ENG-11; it is its own small overlay.

**Read first.** `episode-runner/debrief-view.js` (chip rendering patterns); E16 §11 (the fact-chip form, the feedback rule "facts, not a verdict").

**Depends on.** ENG-08 (schema). ENG-04 (E16 is a consequence-flip episode; the fact-chip form runs in its `defend` stage).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** No chip-composition surface exists.

**Change.** A new child module `minigames/concern-form/concern-form-minigame.js`, opened inside the `defend` stage when `awarenessEpisode.concernForm` is authored. Config: `{ factChips: [{ id, label, kind: "what|when|where|who" }], conclusionChips: [{ id, label }], guidance }`. The learner picks fact chips and (optionally) a conclusion; the authored feedback favours a report built from facts and gently discourages jumping to a verdict (E16's tone rules). Unscored teaching, recorded for analytics only. Schema/validator (ENG-08): add `awarenessEpisode.concernForm`; lint non-empty `factChips` with a valid `kind`.

**Tests to add.** `test/js/social-concern-form.test.mjs`: chips render by kind; a fact-based selection is affirmed and a verdict-only selection draws the "facts, not a verdict" feedback; with the key absent the defend stage is unchanged.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-concern-form.test.mjs test/js/validator-social-awareness.test.mjs`.

**Episodes that depend on it.** E16 only.

**Shared code paths.** A new child scene in the `defend` stage (episode runner only).

**Do not break.** The built defend halves; E16's scored triage set (runs beside the form unchanged).

**How it is guarded.** New optional key; absent, the defend stage is unchanged.

**Stop and ask if.** The concern form is wanted as a scored item rather than teaching (E16 §11 keeps it unscored; scoring a report-building step is a measurement change).

---

## ENG-13 Privacy-settings panel over the OSINT board (E14)

**Goal.** E14's defend half includes a privacy-settings panel: tighten a profile's settings and watch each change visibly close a found OSINT fact (E14 §11). It acts on the OSINT board, so it is a board-linked panel, not a sort; it does not fold into ENG-11.

**Read first.** `minigames/osint-browser/` and `minigames/intel-board/` (how found facts are held and shown); E14 §11 (the privacy panel; each setting closes a found fact).

**Depends on.** ENG-08 (schema).

**Owner model.** `general-purpose`, `model: "sonnet"`.

**Current code.** The OSINT board shows found facts; there is no panel that closes a fact by tightening a setting.

**Change.** A new optional `awarenessEpisode.privacyPanel` block listing settings, each naming the found fact(s) it closes: `{ settings: [{ id, label, closesFacts: ["se_intel_..."], default: "open" }], note }`. Opened inside the `defend` stage; toggling a setting marks its facts closed in the panel's view (a teaching effect; unscored). It reads the same found-fact state the board uses, guarded by the new key so the board and osint-browser are unchanged when it is absent. Schema/validator (ENG-08): add `awarenessEpisode.privacyPanel`; lint that `closesFacts` name declared `se_intel_*` facts.

**Tests to add.** `test/js/social-privacy-panel.test.mjs`: toggling a setting closes its named fact in the panel view; with the key absent the board/osint-browser render as today.

**Acceptance.** The standard engine acceptance, plus `node --test test/js/social-privacy-panel.test.mjs test/js/validator-social-awareness.test.mjs`.

**Episodes that depend on it.** E14 only.

**Shared code paths.** osint-browser / intel-board, used by the lab and the built episodes. Guarded by the new optional key; absent, both are unchanged.

**Do not break.** The lab's OSINT board; the built episodes' OSINT stages.

**How it is guarded.** New optional key; the panel reads board state read-only and runs only when E14 authors it.

**Stop and ask if.** The panel must change the real found-fact globals (not just a teaching view): that would affect any later stage that reads those globals, so keep it a view-only teaching effect unless the user asks otherwise. E14 §11 keeps it unscored.
