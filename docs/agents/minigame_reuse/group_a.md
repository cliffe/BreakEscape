# Reusability review, group A: inbox-triage, sort-drill, concern-form, privacy-panel

Read-only review, 2026-10-30. Paths are relative to the BreakEscape repo root. JS is under
`public/break_escape/js/`, CSS under `public/break_escape/css/`.

## Shared context (applies to all four)

- All four extend `SocialOverlayScene` (`minigames/framework/social-overlay.js:33`), which extends
  `MinigameScene`. It owns the Esc handler (added at :43, removed in `cleanup()` :163-169), the
  layer stack and close/abort. Listeners go through `this.addEventListener`, so base cleanup
  removes them. Lifecycle is sound for all four (see each section for the small exceptions).
- **Launch parity is an engine-wide gap, not a per-minigame one.** The ink tag `#trigger_minigame`
  is a stub that only logs (`minigames/helpers/chat-helpers.js:190-201`, "Actual minigame
  triggering would be game-specific"), and there is no generic eventMapping action that opens a
  minigame. Notes and container are object-only too. So "object interaction" is the only
  scenario-JSON launch path for any minigame; the question below is whether each of these four
  has even that.
- No `docs/*_USAGE.md` exists for any of the four (compare `docs/NOTES_MINIGAME_USAGE.md`,
  `docs/CONTAINER_MINIGAME_USAGE.md`). Their schemas live in `scripts/scenario-schema.json`
  (with descriptions) and in each file's header comment.
- CSS: all four files are loaded on every game page (`app/views/break_escape/games/show.html.erb:81-89`),
  so namespacing matters. Sort-drill (`sd-`), concern-form (`cf-`) and privacy-panel (`pp-`) are
  fully namespaced and read `--aw-*` tokens only with literal fallbacks (e.g.
  `sort-drill-minigame.css:27-32`), so they render without `awareness-skin.css`.

---

## inbox-triage

**Verdict: reusable now for mission use from scenario JSON; small fixes needed for wording and skin.**
It already runs outside the awareness course: `scenarios/lab_social_engineering/scenario.json.erb:931,945,1745-1754`
(an `analyst` set, prefix `triage_`, launched from a `triage-workstation` object with
`conclusionTaskId`). Also `scenarios/test_social_slice`, `test_social_p7_channels`, `test_social_docs_proof`.

What is already right (checked):
- Content is all data: `social.triageSets[]`, launched by an object of type `triage-workstation`
  with `minigameData.triageSetId` (`systems/interactions.js:1094-1097`, `systems/triage-starter.js:356-361`).
- Results go to four generic globals built from the set's own `outcome.setGlobalPrefix`
  (`triage-starter.js:83-93`) plus the event `inbox_triage_completed` (`:49`), so an objective or
  eventMapping in any mission can key on them. No awareness global, NPC or episode id is hardcoded.
- Awareness measurement is in the episode runner (`episode-runner-minigame.js:55,217`), not in the
  triage. Missing `stateSync`, `mailState` or `gameState` degrade with a warning
  (`triage-starter.js:169-173, 247-251`; `triage-messages.js` skips unreplayable `playerSent`).
- Validator and schema know the keys: `socialTriageSet` in `scripts/scenario-schema.json:2870`
  with `additionalProperties: false`; `scripts/validate_social/triage.rb` lints sets and
  `triage-workstation` objects (e.g. :1277-1282, :1393-1400); `scripts/minigame-data-schemas.json:116-118`.
- Tests: `test/js/social-reuse-triage.test.mjs` exercises the override keys with default-unchanged
  and override cases; `social-triage-starter.test.mjs`, `social-triage-ui.test.mjs` and others use
  inline fixtures, not awareness scenarios.

### Findings, by severity

1. **Medium: a lot of learner-facing English cannot be overridden.** `set.labels` covers kind words,
   verdict/call/push actions, queue wording, choice cards, `scoreLine`, `next`, `phishCaughtLabel`
   (documented at `triage-kinds.js:45-55`), but many lines are literals:
   `inbox-triage-minigame.js:59` (step names), `:60` (stage labels "Pre-assessment" etc.),
   `:61,63` (report thanks, "A colleague will check it"), `:513`, `:524-531` (brief timing lines),
   `:536-538` (restart note), `:543` "Start", `:772,779` "What made you say that?", `:1280`
   "Review: how each message went", `:1310` "See result", `:1637`, `:1656` "Try again",
   `:1662`, `:1686` "Item by item", `:1832-1834`; in `triage-kinds.js` the page/QR chrome, e.g.
   `:513` "Where does this code go?", `:524-529` padlock note, `:745-750` alarm text; starter
   `triage-starter.js:320,380` "Inbox triage". Blocks: an Eldritch Hacker or in-fiction SAFETYNET
   console that wants its own voice ("Pre-assessment", "colleague") or another language.
   *Smallest fix (safe refactor):* add a `labels.ui` map read through one `uiText(key, default)`
   helper, with today's literals as the defaults; add `ui` to the `labels` schema. Preserves
   awareness behaviour exactly.

2. **Medium: behaviour switches are tied to a skin a scenario cannot set.** `params.skin` comes only
   from the starter's `options.skin` (`triage-starter.js:392`); a `triage-workstation`'s
   `minigameData` cannot request it. The skin gates behaviour, not just colour: the team tally
   (`inbox-triage-minigame.js:229-233`), the report thank-you and pop (`:678, :714-716`), the report
   sound (`:929-932`), hidden header tells (`:741-745`), relevant-first chips (`:753`), the weakest
   line (`:1348`). A non-awareness mission that wants these cannot get them from JSON.
   *Smallest fix (safe refactor):* let the starter also read `minigameData.skin` (and/or add set
   keys `reportCelebration`, `teamTally`), defaulting to today's values. Awareness unchanged.

3. **Low-medium: mid-round resume is runner-only.** `onProgress`/`restoreAnswers` are accepted only as
   starter options (`triage-starter.js:397-398`), which only the episode runner passes. A mission
   workstation restarts the round on reload (the brief says so, `inbox-triage-minigame.js:536-538`).
   Results themselves survive (globals; pre/post reopen read-only, `triage-starter.js:103-117, 365-366`).
   *Fix (design choice):* an opt-in `minigameData.saveProgress` that stores answers in a
   `<prefix>progress` global. Needs the owner because it adds a fifth result global and validator work.

4. **Low: the default scoring profile is `awareness`.** `inbox-triage-minigame.js:135`,
   `triage-scoring.js:291,508`. A set that omits `scoringProfile` gets awareness scoring, hidden
   header tells and the zero-skills band cap (`triage-scoring.js:411`). The validator also allows
   `call`/`push` messages and Verify only in awareness sets (`validate_social/triage.rb:8-9, :200-202`;
   code gate `inbox-triage-minigame.js:143`), so a SOC-analyst set in m01-m10 cannot use a vishing
   call. *Design choice:* keep, but document the default; or rename the profile to something neutral
   ("learner") with "awareness" as an alias. Lifting the call/push restriction needs scoring review.

5. **Low: two unnamespaced selectors.** `inbox-triage-minigame.css:110-112` (`.mail-row-badge*`) and
   `:338` (`.mail-row-tag`) style elements the shared `MailReader` draws (`mail-client/mail-reader.js:206-222`).
   Today only triage passes tags/badges, so nothing leaks, but the mail client would inherit these if
   it ever did. *Safe refactor:* prefix with `.triage-client`. No visual change.

6. **Low: one uncleared timer.** `triage-kinds.js:753` sets a `setTimeout` (default 30 s) for the alarm
   hint and never clears it; after close it touches a detached node only. Harmless; *safe fix:* track
   and clear in `cleanup()`.

7. **Info: no usage doc.** The schema descriptions are thorough but there is no
   `docs/INBOX_TRIAGE_USAGE.md`. Raw `el.addEventListener` calls in `header-panel.js:78,103` and
   `triage-kinds.js:516-663,934` are on nodes inside the overlay and go with the DOM; not a leak.

---

## sort-drill

**Verdict: reusable component, awareness-only in practice: it cannot be placed in a mission by scenario JSON today.**
No non-awareness scenario uses it (only `scenarios/awareness_e15_*`, `e16_*`, `e17_*`, `e14_*` via `social.awarenessEpisode.sortDrill`).

The component itself is clean: no product, NPC or id names (`sort-drill-model.js:1-3`); every
string has a default and a `config.strings` override (`sort-drill-model.js:33-71`); takes
`params.config` directly (`sort-drill-minigame.js:72`); fully namespaced CSS; result is a plain record
with an optional `recap` (`:334-357`). Tests (`test/js/social-sort-drill.test.mjs`, 27 tests) cover the
model and the overlay standalone with inline configs, plus runner hosting.

### Findings, by severity

1. **High: no launch path outside the episode runner, and the result goes nowhere.** The only caller is
   `episode-runner-minigame.js:816` (via `episode-model.js:154-157`). There is no object type in
   `systems/interactions.js` or `scripts/minigame-data-schemas.json`, no `window.start*` starter, and
   nothing writes a global or emits an event on completion; the runner keeps the record in its own
   state (`episode-model.js:159-162`). A SAFETYNET mission cannot open it or gate a door/objective on it.
   *Smallest fix (safe refactor):* a `sort-drill` object type (e.g. `"type": "sort-drill-station"`,
   `minigameData: { drillId }` or an inline `config`) plus a small starter that writes
   `<setGlobalPrefix>done/percent` and emits `sort_drill_completed`, modelled on `triage-starter.js`.
   Configs could live in `social.sortDrills[]` or top-level. Awareness path untouched.

2. **Medium: schema and validator only know it inside an awareness episode.** Schema:
   `/definitions/socialAwarenessEpisode/properties/sortDrill` (`scenario-schema.json:2153`).
   Validator: `validate_social/awareness.rb:75, 1584-1690`, which also errors if the episode has no
   `defend` stage (`:1593`). *Safe refactor with fix 1:* move the definition to its own
   `sortDrill` definition and reuse the existing lints for the new location.

3. **Low: three hardcoded English bits.** `sort-drill-minigame.js:86` "Close" and the `' or '` join at
   `:212, :269, :350`. *Safe refactor:* `strings.close` and `strings.orJoin`, defaults unchanged.

4. **Info: state restore.** Progress is deliberately not kept (`sort-drill-minigame.js:146-150`,
   `reloadNote`); a host must keep the result. Fine once fix 1 writes globals.

---

## concern-form

**Verdict: reusable component, awareness-only in practice (same launch gap as sort-drill).**
No non-awareness scenario uses it (only `scenarios/awareness_e16_*` and peers via `concernForm`).

Component checks: model says it knows nothing of episodes (`concern-form-model.js:1-4`); all wording in
`DEFAULT_TEXT` with `config.strings` overrides (`:34-80`); `params.config` accepted
(`concern-form-minigame.js:53`); namespaced CSS; tests in `test/js/social-concern-form.test.mjs`
(26 tests, inline fixtures plus runner hosting).

### Findings, by severity

1. **High: no launch path or result output outside the runner.** Only caller
   `episode-runner-minigame.js:825` via `episode-model.js:288-291`; record kept in runner state only
   (`:293-311`). *Fix:* as sort-drill fix 1 (object type, starter, `<prefix>done` global, event).
   Safe refactor.

2. **Medium: schema/validator scoped to the awareness episode.** `scenario-schema.json:2084`;
   `validate_social/awareness.rb:84, 1695-1735`, with the same defend-stage requirement (`:1704`).
   *Safe refactor:* standalone definition, reuse lints.

3. **Low: fact kinds are fixed to what/when/where/who** (`concern-form-model.js:31, :93`); chips of any
   other kind are silently dropped. Headings are overridable (`kindWhat` etc., `:43-46`), so a mission
   can relabel them but not add, say, "how". *Design choice:* allow `config.kinds`; the default list
   keeps today's behaviour.

4. **Low: "Close"** at `concern-form-minigame.js:65`. *Safe refactor:* `strings.close`.

---

## privacy-panel

**Verdict: awareness/SE-engine specific as it stands; reusable with small fixes.**
No non-awareness scenario uses it (only `scenarios/awareness_e14_social_media*`).

Component checks: all wording overridable (`privacy-model.js:23-38`); `params.config` accepted
(`privacy-panel-minigame.js:55`); read-only towards globals; namespaced CSS; tests in
`test/js/social-privacy-panel.test.mjs` (17 tests).

### Findings, by severity

1. **High: no launch path or result output outside the runner.** Only caller
   `episode-runner-minigame.js:834` via `episode-model.js:370-373`. *Fix:* as sort-drill fix 1. Safe refactor.

2. **Medium: fact text comes only from the OSINT engine.** `buildView` reads `social.intelFacts[id].text`
   and the `se_intel_<id>` globals (`privacy-model.js:18, 88-108`). Without `social.intelFacts` (any
   mission that is not an SE/OSINT episode) each fact shows its raw id, e.g. "pet_name"
   (`:103`). *Smallest fix (safe refactor):* accept inline facts in the config
   (`config.facts: { <id>: { text, reduceNote } }`, or `closesFacts` entries as objects), used before
   `social.intelFacts`. Awareness unchanged because its configs keep string ids.

3. **Medium: schema/validator scoped to the awareness episode.** `scenario-schema.json:2206`;
   `validate_social/awareness.rb:85` (`privacy_panel_checks`). *Safe refactor* as above.

4. **Low: "Close"** at `privacy-panel-minigame.js:67`; the "on the board" badge (`:158`) assumes an
   intel board exists, but it shows only when an `se_intel_` global is true, so it stays hidden
   elsewhere. *Safe refactor:* `strings.close`.

---

## Fix lists

### Safe refactors (defaults keep today's awareness behaviour)
- inbox-triage: `labels.ui` overrides for the literal strings (finding 1); `minigameData.skin` or
  per-feature set keys (2); prefix `.mail-row-*` selectors with `.triage-client` (5); clear the alarm
  timer (6); a `docs/INBOX_TRIAGE_USAGE.md`.
- sort-drill, concern-form, privacy-panel: one shared object type + starter that opens the scene with
  an inline or id-referenced config, writes `<prefix>done` (plus `percent` for a scored drill) and emits
  a completion event; lift each schema definition out of `socialAwarenessEpisode` and point the
  existing lints at both locations; `strings.close` (and `orJoin` for sort-drill).
- privacy-panel: inline fact text in the config.

### Design choices for the owner
- inbox-triage: opt-in mid-round save for mission workstations (adds a progress global).
- inbox-triage: whether `awareness` stays the default scoring profile, and whether `call`/`push` and
  Verify should be allowed in `analyst` sets (SAFETYNET SOC use).
- concern-form: configurable fact kinds.
- Where standalone configs live (`social.sortDrills[]` etc. vs top-level), and the global-prefix
  convention for their results.
- Engine-wide: a real `#trigger_minigame` ink tag and an eventMapping action, which would serve every
  minigame, not only these four.
