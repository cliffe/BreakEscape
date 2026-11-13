# P5-R — Phase 5 implementation review (Opus)

Packet P5-R (IMPLEMENTATION_PLAN.md §4; "Phase 5 detail" Done-when). A fresh, read-only review of
all Phase 5 work: the landing-page builder (model, renderer, inspection, overlay, lint,
persistence), the wiring, the mail `link` kind and the send-path victim record. Reviewed against
the P5-A..P5-G build logs, commits `1f385696` and `d355d553`, and the `07` §1 safety list (read, not
only run). Nothing changed outside this file.

Scope note from the brief: this review gives extra weight to anything a player of m01–m08 could
see, i.e. the shared files `state-sync.js`, `interactions.js`, `core/game.js`, `minigames/index.js`,
`game.rb` and the mail bridge/composer.

## What was verified

- **m01–m08 isolation (the main concern).** Every shared-file change is gated on a social-only key
  or object type and is inert for the shipped missions:
  - `state-sync.js` `guardLandingState` runs only when `se_landing_pages`/`se_landing_drafts` are
    present in `globalVariables` (`hasOwnProperty` guards, `:82`, `:85`); m01–m08 declare neither, so
    the payload is untouched. P5-F's R4 sync regression on m01 (game 2958) and m05 (game 2959)
    confirms an unchanged reload round-trip, idle request count and "no landing/mailState key" body.
  - `interactions.js:1078` `page-builder` branch is gated on `sprite.scenarioData.type ===
    'page-builder'`; no shipped mission has that type.
  - `core/game.js:305` adds one `this.load.image('page-builder', ...)` preload; the placeholder PNG
    exists, so no shipped mission's preload breaks.
  - `game.rb:2062` adds `pendingMessage` to `MAIL_MESSAGE_KEYS`; the mail sanitiser runs only on a
    `mailState`, which m01–m08 never have.
  - `minigames/index.js` statically imports the builder for every mission, but the builder, model,
    renderer and inspect module define only classes/pure functions with no top-level side effects,
    and all four imports resolve (`social-overlay.js`, `concept-card.js`, the three builder files
    all present). Import is safe for every mission.
- **Safety design (`07` §1), enforced by code, not convention.** The preview renderer
  (`landing-page-render.js`) creates only `div`, `h3`, `img`, `p`, `span` (grep of every `make('<tag>'`
  call); no `a`/`form`/`input`/`textarea`/`select`/`button`/`iframe`/`script`/`contenteditable`.
  `img.src` is set only to local asset paths (`/break_escape/assets/icons/padlock_32.png`,
  `logo-<brand>.png`), never a network URL. No `fetch`/`XHR`/`WebSocket`/`sendBeacon`/`innerHTML`/
  `document.write`/`download`/`serialize` anywhere in the builder folder (only the two documenting
  comments). `landing-page-model.js` and `landing-page-inspect.js` touch no DOM, window or global.
  No password or typed value is ever read or stored: `describeVictimOutcome` returns booleans only;
  `linkInfoFor` returns domain metadata only; the victim record is `{visited, submitted, noticed}`.
- **State closed-shape guard** reduces records to the nine `RECORD_KEYS`, choices to seven, victim
  to three, `tellsFound` to the nine ids, and mutates only the shallow copy (fresh objects), leaving
  live `gameState` as written. Closed sets mirror `landing-page-model.js`; the state test asserts
  they stay in step.
- **Send path** fills `message.linkInfo` from the saved record before judging; after a built-page
  send it writes the best victim outcome with `betterVictim` (a worse later send cannot erase an
  earlier success, `victimRank` submitted > noticed > nothing) and adds the capture note once via
  `captureGranted` (first `submitted` only), wrapped in try/catch. `pendingMessage` is deleted when
  the verdict shows (`mail-client-minigame.js:204`).
- **Tests and validator, run against the current shared tree (not just the logs).**
  - `social-landing-page-*` + `validator-landing-pages` + `social-mail-link-victim`: **97 pass, 0 fail**.
  - `state-sync` + `social-mail-bridge` + `-composer` + `-client-shell` + `-narrow`: **70 pass, 0 fail**.
  - `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social
    --no-graph --skip-ink` → **exit 0**, "Validation complete!", no SOCIAL errors; validator rewrote
    no tracked file under `scenarios/test_social_slice/` (the `dungeon_graph.*` there were already
    untracked before this review).

## Findings

| id | severity | file:line | finding | evidence | suggested fix |
|----|----------|-----------|---------|----------|---------------|
| F1 | minor | `minigames/mail-client/mail-bridge.js:354-357` | `betterVictim` returns `next` on a rank tie (`>=`), and the bridge writes the record back whenever `next !== before`. A repeated below-threshold send (both outcomes `noticed`, rank 1) therefore re-writes `se_landing_pages` and re-syncs each time with identical data. | `landing-page-model.js:511` `victimRank(next) >= victimRank(existing) ? next : existing`; on a tie `next` is a fresh object, so `next !== before` at `mail-bridge.js:355` is always true. | Skip the write-back when `victimRank(next) === victimRank(before)` (no improvement), or have `betterVictim` return `existing` on an exact tie. Correctness is unaffected; this only avoids redundant syncs. Lab-only. |
| F2 | minor | `mail-bridge.js:335`, `game.rb:2062` | In `withReply` mode the full composed message (including `linkInfo` and `slots`) is stored on `record.pendingMessage` and persisted to the server, now that `pendingMessage` is whitelisted. The server whitelists the key but does not key-sanitise the nested message object. | `record.pendingMessage = message` (`:335`); `MAIL_MESSAGE_KEYS << pendingMessage` (`game.rb:2062`). | No credential or typed value is in the message (README T holds), so no safety breach; but the nested blob is unbounded by the per-key sanitiser and only `MAX_MAIL_STATE_BYTES` caps it. Consider storing only the fields the checklist rebuild needs, or documenting that `pendingMessage` rides u-sanitised. Lab-only. |
| F3 | minor (note) | `systems/interactions.js:633-670` | The `grantsHeld`/`everyAskHeld` "you already have what they can tell you" refusal in `startPretextCall` is Phase 4 pretext work that landed inside the reviewed commit `d355d553`, not Phase 5 builder work. | Functions added at `:633`/`:642`, called at `:662`. | Out of P5 scope; noted for completeness. It is gated on `social.pretextNpcs`, so it is inert for m01–m08. No change needed for Phase 5. |

## Reconciled during the phase (no finding)

- The defender-string key clash P5-C/P5-E flagged is resolved: the model's `defDomainTier<N>` keys
  win, the lint's `tier_defender_key` and the clean fixture were renamed to match (P5-G §4). The
  landing tests pass with the renamed keys.
- The `social.landingPages` array-vs-object shape is handled in both the bridge (`findLandingPage`)
  and the lint.
- D5's third target (`lord` + `payroll_login`) was added to `test_social_slice` so a `linkCredible`
  target exists for the bridge checks; the slice validates clean under `--strict-social`.

## Open items that are not P5-R blockers (owned elsewhere)

- **P5-T** (browser bridge steps 1–8 on :3001) is still owed; steps 1–6 are exercised only in jsdom.
  This is the one outstanding gate item from the Phase 5 "Done when" list. Not a review finding, but
  the phase is not fully confirmed until P5-T runs green in a real browser.

## Verdict

**PASS. No blocker or major finding open.** Three minor findings (two lab-only efficiency/hygiene,
one scope note). The m01–m08 shared-file changes are provably inert for the shipped missions, the
`07` §1 safety constraints are enforced by code and tests rather than convention, and the Node and
validator checks pass against the current shared tree. The phase meets the "P5-R has no blocker or
major finding open" gate. The only outstanding work for a full Phase 5 sign-off is the P5-T browser
playtest.
