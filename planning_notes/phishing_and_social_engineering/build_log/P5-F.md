# P5-F — landing-page persistence and the state-sync shape guard

Packet P5-F of Phase 5 (IMPLEMENTATION_PLAN.md §4 and "Phase 5 detail"; `07` N4, §5; `00` §11, §11a).
The N4 shape guard for `se_landing_pages` and `se_landing_drafts` at the sync boundary, plus the
`social-landing-page-state` test. Routed to opus48 (builder packets to opus48, user decision
2026-10-21). Done 2026-10-21. Not committed.

## Files changed (my scope only)

- `public/break_escape/js/state-sync.js` — shared engine code (m01 to m08). Added only the landing
  guard: a constants/helpers block after `WHOLE_SECTIONS` and one `guardLandingState(...)` call in
  `buildSharedSections`. Nothing else touched; no existing line changed.
- `test/js/social-landing-page-state.test.mjs` (new) — 8 jsdom-free Node cases.

Not mine, left untouched: `landing-page-model.js` (P5-A), the overlay (P5-D/P5-E), the slice fixture
and declarations (P5-G), the schema (`se_landing_pages`/`se_landing_drafts` already listed in
`scripts/scenario-schema.json:135` by P5-C).

## What the guard does

`se_landing_pages[<pageId>]` holds one closed record (`07` §5; `00` §11a); `se_landing_drafts[<pageId>]`
holds one pre-Score choice set. Both are plain globals in `gameState.globalVariables`, so they ride the
`globalVariables` keyed section to the server; a new top-level game-state section would be dropped by
the fixed permitted parameters in `games_controller.rb`, which is why the design uses globals.

The builder overlay already writes only closed keys (`buildRecord` / `applyScore` / `setBuilt` and
`_pick7`, P5-A/P5-D). The guard is the defence-in-depth half N4 asks for: it enforces the closed shapes
again at the one choke point every send passes through, so a hand-edited or older save can never push
an unknown key to the server.

- Location: `buildSharedSections`, right after the shallow copy `out.globalVariables = { ...globals }`.
  Both the periodic diff sync and the `pagehide` flush build their body from `buildChanges` →
  `buildPayload` → `buildSharedSections`, so sanitising there covers "synced" and "flushed" in one place.
- It mutates only the shallow copy, replacing each key with a fresh object (`pickKeys` returns a new
  object), so `window.gameState` is left exactly as the overlay wrote it (tested).
- `se_landing_pages`: each record is reduced to the nine `RECORD_KEYS`; `choices` to the seven
  `CHOICE_KEYS`; `victim` to `{visited, submitted, noticed}`; `tellsFound` filtered to the nine
  `TELL_IDS`. A non-object record becomes `{}`.
- `se_landing_drafts`: each value reduced to the seven `CHOICE_KEYS`. A non-object draft becomes `{}`.
- Keys are only touched when present (`hasOwnProperty`): a mission with no landing state carries
  neither global, so its payload is unchanged.

The closed key sets are defined locally in `state-sync.js` (not imported) on purpose: the module is
core engine and every `*.test.mjs` that copies it rewrites only the `api-client`/`config` imports, so a
new import of a minigame module would break those copies and pull a minigame file into the core graph
for every mission. The local sets mirror `landing-page-model.js`'s `RECORD_KEYS`, `CHOICE_KEYS`, victim
keys and `TELL_IDS`; the test imports the model's exported constants and asserts a model-built record and
draft pass the guard byte-for-byte unchanged, so drift between the two is caught.

## Tests

`bundle exec node --test test/js/social-landing-page-state.test.mjs` → **8 pass, 0 fail**. Covers:
- `se_landing_pages`/`se_landing_drafts` default to `{}` for a non-object value (and a non-object record
  or draft inside the map collapses to `{}`);
- a key outside the closed record set dropped on write (`buildRecord` emits only `RECORD_KEYS`) and on
  sync (injected `serialize`/`password`/`__proto__hack` and an inner `choices.injected` and
  `victim.extra` all stripped);
- a `tellsFound` id outside the nine dropped on write and on sync, every surviving id in `TELL_IDS`;
- a draft key outside the seven choice keys dropped;
- a model-built record and draft pass the guard unchanged (closed sets in step with the model);
- a full record for all six domain ids inside the 60 KB flush share (the whole `buildChanges` body is
  under 4 KB — six id-and-boolean records are tiny);
- a mission with no landing state unchanged (neither global invented; `deepEqual` to the input);
- the guard replaces, never mutates, the live `gameState` globals.

Regression (every test that copies `state-sync.js`, `--test-concurrency=1`):
`bundle exec node --test --test-concurrency=1 test/js/state-sync.test.mjs
test/js/social-state-sync-confirmed.test.mjs test/js/social-mail-scheduler.test.mjs
test/js/social-mail-state-export.test.mjs test/js/social-triage-starter.test.mjs
test/js/player-health-persistence.test.mjs test/js/npc-hostility-persistence.test.mjs
test/js/engine-fixes-round4.test.mjs test/js/social-landing-page-state.test.mjs`
→ **89 pass, 0 fail**.

## R4 sync regression (m01 and m05)

`node tools/playtest/sync-state-regress.js <url> tmp/keyless-3001.log 65000`, keyless :3001, cached
chromium 1148 via `CHROMIUM=`, Node v24.11.1. Fresh games m01=2958, m05=2959.

Both missions: **unchanged, pass**.

- **m01 (game 2958).** Reload round-trip: `lostOrChangedGlobals: []`, notes kept, phone thread
  `agent_0x99` 1→1, triggered events kept, the flush-only global (set after the last confirmed sync)
  came back as 7. The `pagehide` flush carried only `globalVariables`, `scenarioClock`, `timedMessages`,
  `clientTs`; the first sync after reload carried `globalVariables` (72), `npcInkVariables`, `notes`,
  `playerHealth`, `phoneState`, `scenarioClock`, `timedMessages`. Idle 65 s: `pageRequests: 0`. One
  global changed → 1 request, `globalVariables` holding only `regress_one`. No `se_landing_pages`,
  `se_landing_drafts` or `mailState` key in any request body.
- **m05 (game 2959).** Same shape: `lostOrChangedGlobals: []`, notes kept, phone `agent_0x99_handler`
  4→4, triggered 2→2, flush-only global 7. First sync carried `globalVariables` (101),
  `triggeredEvents`, `npcInkVariables`, `notes`, `playerHealth`, `phoneState`, `scenarioClock`,
  `timedMessages`. Idle 65 s: `pageRequests: 0`, `serverLogRequests: 0`. One global changed → 1
  request, only `regress_one`. No `se_landing_*` or `mailState` key anywhere.

m01 and m05 declare neither landing global, so `guardLandingState` never runs for them; the reload
round-trip, the idle count and the "no mailState in a mission with no mail" invariant are all as before
the edit. Raw JSON in `scratchpad/se-P5-F/r4-m01.json` and `r4-m05.json`.

## Left undone / for later packets

- The `{}` default *declaration* in a scenario's `globalVariables` is authored data: the slice fixture
  page is P5-G (`07` §5 "declared with default `{}`"), the schema entry is P5-C (already present). P5-F
  owns the runtime guard, which makes the value default to `{}` at the sync boundary regardless.
- Bridge step 7 (`se_landing_pages`/`se_landing_drafts` persist across a reload and a junk key never
  reaches the server) is P5-T, and needs the P5-G wiring and fixture page first.
