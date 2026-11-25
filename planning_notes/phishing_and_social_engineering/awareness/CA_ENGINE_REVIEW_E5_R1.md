# CA engine review: E5 flip line by global, round 1

Commit: `64fa593d7` "E5: flip defender line chosen by global + unit tests"
Spec: `CA_PILOT_MECHANICS_PLAN.md` E5 (lines 137-140), ca12 strings (156-164), checks 454 and 466(k).
Reviewer: Opus 5.5, 2026-11-25. Code not edited.

**Totals: 1 B, 2 M, 4 m**

The `defenderLine()` change itself matches the E5 text: precedence NoSpray > ByHost > ByGlobal > ByChoice > flipDefenderLine, list order decides, malformed entries skipped, an absent field changes nothing. The line goes through `el()` (`flip-view.js:84-89`), which sets `textContent`, so no HTML injection. `this.globals` (`episode-runner-minigame.js:289-291`) is `params.globals || window.gameState.globalVariables`; `startEpisodeRunner` (`systems/episode-starter.js:59-70`) never sets `params.globals`, so the flip reads the live map by reference at render time, and after a reload that map is the server-restored one (`core/game.js:1749`). The two touched test files pass (55/55). Other CA shells: none of them carries the new key, the call site only adds a prop, and the ByHost/NoSpray/ByChoice paths are unchanged, so existing flips render as before.

## Blockers

**B1. Three of ca12's six endings never reach `defenderLine()`, so their ByGlobal lines cannot show.**
`episode-runner-minigame.js:812-813` builds a call flip as `{ call, missed: !call }`, and `flipCall()` (`episode-model.js:838-839`) returns null unless `sent.outcome === 'got_it'`. With `call` null, `renderFlipView` has no `parts` (`flip-view.js:341-347`), takes the `missed` branch, and shows `flipMissedHeading` + `flipMissed`; the defender line (and so E5) is never consulted. In ca12:
- `walked_away` + follow Jun (`ca12_tailgated`): shows "The door stayed shut" / "Delphine stopped you and went to check..." (ca12 erb `:634-635`), the opposite of what happened.
- `reported` (`ca12_guard_alerted`): shows the same flipMissed text instead of the alerted line.
- `walked_away` timeout (neutral fallback): shows flipMissed instead of the new neutral `flipDefenderLine`.
Only the `got_it` endings (desk pass, challenged, door missed) work. Plan checks 454 ("each route then checks that the flip's defender line is the one its globals choose") and 466(k) cannot pass. The spec text in E5 is the root cause (it only extends `defenderLine()`), so the plan needs the same correction.
*Fix:* in the `missed || landedNoTells` branch of `renderFlipView` (`flip-view.js:343-347`), check `flipDefenderLineByGlobal` first (factor the loop out of `defenderLine()` as `globalLine(strings, globals)`); when it matches, render that line in place of `flipMissed`/`flipLandedNoTells` (same `aw-defender-line` class so playtests can read one selector), and either let an entry carry an optional `heading` or require the ca12 shell to author a neutral `flipMissedHeading`. For the timeout, the neutral line then has to come from an explicit entry (e.g. a last `{ global: "ca12_world_done", line: "You never got past the lobby..." }`), since `flipDefenderLine` is not read on the missed path. Add a call-kind test: `sent = { kind: 'call', outcome: 'walked_away' }` through `_flipProps()` and `renderFlipView`, with a ByGlobal global set, asserting the ByGlobal line and not flipMissed. Update E5 in the plan to say the missed path reads ByGlobal too.

## Majors

**M1. The schema rejects the new key; no validator checks.**
`scripts/scenario-schema.json`, `definitions/socialAwarenessEpisode/properties/strings` has `additionalProperties: false` (only `^_` allowed) and no `flipDefenderLineByGlobal` property (next to `flipDefenderLineByHost`, `:3257`). The ca12 shell will fail validation as soon as it carries the key. E5 also specifies 5-10 validator lines ("each `global` is declared, each `line` is a non-empty string with no `{variables}`"); `scripts/validate_social/awareness.rb` has nothing for it (compare `flip_by_choice_checks`, `:529`, `:609`).
*Fix:* add to the schema `"flipDefenderLineByGlobal": {"type": "array", "items": {"type": "object", "required": ["global", "line"], "properties": {"global": {"type": "string", "minLength": 1}, "line": {"type": "string", "minLength": 1}}, "additionalProperties": false}}` with a description; add `flip_by_global_checks` in `awareness.rb` (declared in `globalVariables`, non-empty line, no `\{\w+\}`, warn on duplicate globals); a validator test with one good and three bad entries.

**M2. The tests do not exercise the real path.**
`social-episode-views.test.mjs:660-709` call `defenderLine()` and `renderFlipView()` directly with a `page` prop. Nothing covers the runner: `_renderFlip` (`episode-runner-minigame.js:841-851`) passing `this.globals`, the getter falling back to `window.gameState.globalVariables`, or a `call`-kind flip, which is the only kind ca12 uses. A call-kind runner test would have caught B1, and deleting the one-line `globals: this.globals` would still leave every test green.
*Fix:* add a runner-level test (the stubbed-deps pattern in `social-concern-form.test.mjs:327` captures the props passed to `renderFlipView`) that sets `window.gameState.globalVariables`, starts no `params.globals`, puts the runner at the flip with a `call` sent record, and asserts the rendered `.aw-defender-line` text for one `got_it` and one `walked_away` ending. Per the live-proof rule, the ca12 routes in check 454 remain the real proof once the shell lands.

## Minors

**m1. Inherited keys count as truthy.** `globals[e.global]` (`flip-view.js:110`) reads through the prototype, so an entry with `global: "constructor"` or `"toString"` matches every run. The validator's "declared" check (M1) would stop this in authored data; add `Object.hasOwn(globals, e.global) &&` for safety.

**m2. The doc comment is stale.** `flip-view.js:95-100` still describes only ByChoice and flipDefenderLine. List the full order (NoSpray, ByHost, ByGlobal, ByChoice, flipDefenderLine) and note that `globals` is read live at render time, so a later global change does not redraw an open flip.

**m3. "Truthy" is wider than the ca12 globals need.** The spec says truthy, and the code matches; the ca12 globals are all booleans. If any future shell points an entry at a counter or a pretext state object (`pretext_<id>_state` is an object and always truthy once a call starts), the line wins unexpectedly. Either note this in the schema description or compare `=== true`; pick one and say it in E5.

**m4. Parity exemption with no erb user yet.** `social-awareness-fragment-erb-parity.test.mjs:82` adds `flipDefenderLineByGlobal` to `STRINGS_ERB_ONLY_OK` before any erb uses it. Harmless, but the comment block above the set should say which shell needs it (ca12) so a later clean-up does not drop it.
