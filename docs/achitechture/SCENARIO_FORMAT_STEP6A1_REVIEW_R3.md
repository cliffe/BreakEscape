# Scenario format hardening step 6a-1 review R3

Date: 2026-11-14. Reviewer branch `build/hard-6a1`, tip `8bc904891`.
Scope: confirm R2's one Major is closed, then an exhaustive secret sweep worked from the server side
(not the plan's list), the reverse sweep of marked fields the client might read, and the standing
rules on the lines added since R2 (`57a31d85c..8bc904891`). Review only. The full corpus scan body
stays held for step 3 (`acknowledgedClues`) and is out of scope.

Reviewed against plan `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` sections 1, 2 and 6a-1,
the server filters in `app/models/break_escape/game.rb`, `app/models/break_escape/network_access.rb`,
`lib/break_escape` (`capture_model.rb`, `network_model.rb`, `social_feed.rb`, `npc_habits.rb`,
`declared_grants.rb`, `item_identity.rb`), `app/controllers/break_escape/games_controller.rb`, the
classifier in `test/models/break_escape/payload_scan_fresh_state_test.rb`, the client JS under
`public/break_escape/js/`, and the prior rounds R1 (0 blockers, 1 major, 4 minors) and R2 (0
blockers, 1 major, 1 minor).

## Counts

- Blockers: 0
- Majors: 1
- Minors: 1
- Observations (not counted): 3

Verdict: **SHIP once the one Major is resolved.** R2's Major (`targetFlags`) is closed and R2's Minor
(em dashes in the R1 review prose) is ruled exempt by the orchestrator and not counted here. The new
Major is the same class as R2's finding, on a third flag-answer secret: a flag station's own
`flags` array (`#/definitions/item.flags`) is a section-2 secret that `filter_requires_and_contents_recursive`
strips from every room and container payload, yet it carries no `x-serverOnly` mark, so a filter
regression that leaks the literal flag answers is classed 3 and passes the scan. The fix is one line
(mark it, served by no route, like `flags`, `roles` and `targetFlags`), or a recorded deferral the
way the capture-secret and `targetFlags` decisions were recorded. No live leak exists today; the
filter strips it on every path.

## R2 Major closure (verified over 57a31d85c..8bc904891)

**Closed.** `#/definitions/task.targetFlags` (`scripts/scenario-schema.json:3937`) now carries
`"x-serverOnly": true` and no `x-servedBy`, with a description naming `Game#filter_target_flags`.
- **Served by no route.** `filter_target_flags` (`game.rb:6065`) deletes `tasks[].targetFlags` on the
  bootstrap (`game.rb:1813`) and on `GET objectives`, whose `objectives_state` (`game.rb:4456-4458`)
  wraps `scenario_data['objectives']` in `strip_objective_notes(filter_target_flags(...))` before
  the controller renders it (`games_controller.rb:1587-1590`). `objectives_state_for_client`
  (`game.rb:4490`) builds only aim and task status from `player_state['objectivesState']` and never
  copies `targetFlags`. No route serves the field, so the empty `x-servedBy` is correct.
- **Client reads it only defensively.** `objectives-manager.js:94` reads
  `if (task.targetCount === undefined && task.targetFlags) task.targetCount = task.targetFlags.length`
  (again at `:193`). The server strips the field, so the client sees `undefined` and falls back to the
  server-supplied `targetCount`. No client path depends on a value being present.
- **The test asserts the mark.** `test/js/validator-declared-top-level.test.mjs:90` asserts
  `schema.definitions.task.properties.targetFlags['x-serverOnly'] === true` (ran the file: 7 pass).

R2's Minor (em dashes on added lines in the R1 review file) is a record, not shipped prose, and is
ruled exempt by the orchestrator. Not counted again.

## Server-side secret sweep (worked from the code, not the plan's list)

Every point where the server strips, filters, withholds or serves-only-by-route an authored field,
and the mark that backs it. Marks confirmed in `scripts/scenario-schema.json`.

| Server strip / withhold | Field(s) | Mark | Verdict |
|---|---|---|---|
| `filter_target_flags` (game.rb:6065) | `task.targetFlags` | `x-serverOnly: true`, no route (:3937) | OK (R2 fix) |
| bootstrap delete (game.rb:1816-1825) | top-level `flags` | `x-serverOnly: true`, no route (:150) | OK |
| bootstrap delete (game.rb:1816-1825) | `accountProfiles` | `x-serverOnly`, `GET /container` (:231) | OK |
| bootstrap delete (game.rb:1816-1825) | `roles` | `x-serverOnly: true`, no route (:318) | OK |
| `NetworkAccess::WITHHELD_SCENARIO_KEYS` (network_access.rb:18) | `networks`, `networkLinks`, `resources` | `x-serverOnly`, `[GET /network, GET /container]` (:266,:290,:296) | OK |
| `strip_lock_answers!` (game.rb:3587-3591) | `cryptexConfig.answer`, `combination` (lockType combination) | `x-serverOnly` leaf; `combination` `whenLockType` (room :5195,:5199; item :4187,:4191) | OK |
| requires rule (game.rb:6141-6143) | `requires` (non biometric/bluetooth/rfid) | `x-serverOnly: { unlessLockType }` (room :5188; item :4180) | OK |
| `strip_capture_secrets!` (game.rb:6100), capture walk | `social...capture.secret`, `usePayload.secret`, `addCapture.secret` | `x-serverOnly`, `GET /capture_secrets` (:612,:4874,:5043) | OK (R1 fix) |
| `withhold_npc_secrets!` / `WITHHELD_NPC_KEYS` (game.rb:6227,6267-6271) | NPC `creds`, `awareness`, `role`, `workarounds` | `x-serverOnly` (creds :4347, awareness :4360, role :4342, workarounds :4832) | OK |
| `WITHHELD_WORK_NPC_KEYS` (game.rb:6231) | NPC `workNeeds`, `frustration`, `feed` | `x-serverOnly` (:4830,:4831,:4835) | OK |
| habits filter, `SHIPPED_HABIT_KEYS` (game.rb:6239,6274-6281) | `habits.*` except `screen`, `print` | `locksScreen/writesDown/password/holdsDoors/passwordPattern/usb` all `x-serverOnly` (:4365-4372) | OK |
| `creds.password` written-down note (game.rb:2044; controller:1340) | `creds.password` | `x-serverOnly`, `[{GET /login_accounts, postitNote}, GET /capture_secrets]` (:4352) | OK (R1 fix) |
| `SocialFeed::POST_KEYS` served on reveal (social_feed.rb:25) | feed `id/text/fact/date/note/replyTo` | `x-servedBy: feedPosts` inside server-only `feed` (:4835) | OK |
| **per-station flags** (game.rb:6187-6189) | **`item.flags`** | **none (:5276)** | **MAJOR (MA1-R3)** |
| `hintOnlyFlags` delete (game.rb:6192) | `item.hintOnlyFlags` | none (:5284) | MINOR (MI1-R3) |
| `NetworkAccess::WITHHELD_OBJECT_FIELDS` (network_access.rb:21; game.rb:6196) | `item.network`, `item.linkName`, `item.linkStoreIn` | none (:5435,:5451,:5452) | Observation O1 |
| `strip_puzzle_graph_keys!` (game.rb:6086) | `puzzle_graph_*` (except role/unlocks) | undeclared (class 4 value check) | sound reason, no finding |
| `strip_forgeable_lock_fields` (game.rb:1085) / `ItemIdentity::FORGEABLE_ITEM_FIELDS` | lock fields on an inventory item copy | identity defence, not a payload strip | sound reason, no finding |
| `saved_cards`, biometric samples, login failures (game.rb:667,834,2686) | runtime player_state | not authored scenario data | sound reason, no finding |

Notes on the "sound reason" rows:
- `puzzle_graph_*` are authoring-only fields for the validator's graph generator. The two the client
  reads (`puzzle_graph_role`, `puzzle_graph_unlocks`) are kept; the rest are undeclared in the schema,
  so a copy that equalled a real secret value would fail the scan on the class 4 value check. They name
  roles and chain ids, not raw lock-skip answers, so leaving them undeclared is defensible.
- `strip_forgeable_lock_fields` removes lock metadata from an item the client presents back, so a
  tampered client cannot forge an opener. It is an anti-forgery defence on the inbound item, not a
  payload-secrecy strip, and no credential check honours a client-added item (code review R1 B1).
- `saved_cards`, biometric samples and login failures are runtime state built into player_state, with
  no authored source path, so they are out of the marks' scope by construction.

### Major

**MA1-R3 (major): a flag station's own `flags` array (`item.flags`) is a section-2 secret with no
server-only mark.** `scripts/scenario-schema.json:5276`, the `flags` property of `#/definitions/item`
(room objects resolve to `#/definitions/item`, :4293-4295), is declared `array of string` with no
`x-serverOnly`. It holds a flag station's ordered flag entries, which may be literal flag answers.
`filter_requires_and_contents_recursive` (`game.rb:6180-6189`) deletes `obj['flags']` from every
object, NPC-held item and table item in room and container payloads and replaces it with a
`flagCount`; the comment at `game.rb:6180` records that this array "rode along in the lazy-loaded room
payload and handed the player every answer". Section 2 lists "flag answer" as a secret, and the 6a-1
marks bullet requires `x-serverOnly` on every section-2 secret. The top-level `flags` key, stripped in
the same family of filters, carries the mark (`:150`); the per-station `flags` array, which carries
the same answers once they rode into a room, does not. The plan's 6a-1 explicit enumeration names the
top-level keys but not the per-station array, so the build followed the enumeration and missed it under
the generic rule, exactly as R2 found for `targetFlags`.

*Failure scenario:* when the held scan is built (step 3), a regression in
`filter_requires_and_contents_recursive` that leaves `flags` on a flag station in a `GET room/:id` or
`GET scenario` rooms subtree is classed 3 by `PayloadLeafClassifier.classify`
(`payload_scan_fresh_state_test.rb`: a declared field with no mark returns `:class3`, which passes).
The literal flag answers ship to the browser and a player submits them through `POST /flags` without
finding them, and the path-based class 3 verdict short-circuits before any value check, so the leak is
invisible. This is the one class of leak this mark set exists to catch. *Fix:* mark `item.flags`
`"x-serverOnly": true` with no `x-servedBy` (served by no route, like `flags`, `roles` and
`targetFlags`), or record a deferral decision in the build log the way the capture-secret and
`targetFlags` decisions are recorded. A one-line test alongside the existing top-level-secret test
would lock it in.

### Minor

**MI1-R3 (minor): `item.hintOnlyFlags` is documented server-only in its own description but carries no
`x-serverOnly` mark.** `scripts/scenario-schema.json:5284` describes the field as "Server-side only,
stripped from the client scenario", and `filter_requires_and_contents_recursive` removes it outright
(`game.rb:6192`, consumed server-side by `find_hint_only_message`, never read by the client). No
`x-serverOnly` mark backs the prose. Its contents are flag references mapped to hint messages: the hint
text is authored clue text that would pass as class 3 even if marked, and the keys are references
rather than raw answers, so the security impact is lower than `item.flags`. *Failure scenario:* a
regression that leaves `hintOnlyFlags` in a room payload is classed 3 and passes, and the schema's own
"server-side only" claim is unenforced. *Fix:* mark `x-serverOnly: true`, served by no route, matching
its description, so the prose and the scan agree.

## Reverse sweep: marked server-only fields the client reads from `window.gameScenario`

No contradiction found.
- **`targetFlags`:** read defensively at `objectives-manager.js:94,193` (the server strips it; the
  client falls back to `targetCount`), see the closure section above.
- **`cryptexConfig.answer` and `combination`:** not read by the client. The cryptex minigame builds
  the guess from wheel indices and sends it to the server (`cryptex-minigame.js:302-311`), with a
  comment at `:35-36` recording that "The answer never reaches the client". The combination minigame
  reads no `combination` field (grep for a `.combination` field read is empty; `combination-wrapper`
  at `:387` is a CSS class). Both answers are validated server-side. `cryptexConfig` itself is
  `x-free-data`, not server-only; the client reads its display keys (`wheelCount`, `alphabets`,
  `hintStrip`), never the marked `answer` leaf.
- **NPC `awareness`, `frustration`, `feed`, `creds`, `role`, `workarounds`, `workNeeds`:** the client
  reads runtime frustration from events and globals (`npc-needs.js`), awareness from the host page's
  `breakEscapeConfig.awareness` and the separate `social.awareness` block (`triage-starter.js`,
  `episode-runner`), not from the marked NPC authored fields on `window.gameScenario`.
- **Capture secrets:** read defensively (`mail-bridge.js`, `captures.js`), server strips them from the
  bootstrap and serves them only by `GET /capture_secrets`, confirmed in R2 (O3).

## Standing rules on the lines added since R2 (57a31d85c..8bc904891)

Shippable and build-log lines only (the R2 review file itself is a record).
- **No em or en dashes:** none on any added line in `scripts/scenario-schema.json`,
  `test/js/validator-declared-top-level.test.mjs` or the build log (checked with a Unicode dash grep,
  no hits).
- **No model names:** none (grep for Claude/Opus/Sonnet/Haiku/GPT/Gemini on added lines, no hits).
- **UK English:** the build log "Review R2 fix" entry and the schema description read clean.

## Observations (not counted)

- **O1: the object-level withheld network fields carry no mark, by the plan's own scope.**
  `NetworkAccess::WITHHELD_OBJECT_FIELDS` (`network_access.rb:21`: `network`, `linkName`, `linkStoreIn`)
  are stripped from every object (`game.rb:6196`) but are unmarked (`scenario-schema.json:5435,5451,5452`).
  They are network membership and link-naming strings, not section-2 secret values, and 6a-1's stated
  mark scope covers section-2 secrets plus the whole-record top-level keys the bootstrap deletes, not
  object-level withheld fields. So a sound reason exists to leave them unmarked. Noted because the
  whole-record `networks`/`networkLinks`/`resources` are marked while their per-object cousins are not,
  which a reader may expect to see mirrored; the orchestrator may wish to mark them `x-servedBy:
  "GET /network"` for coverage symmetry or record that object membership is out of scope.
- **O2: MA1-R3 is also a gap in the plan's 6a-1 enumeration.** As with `targetFlags` (R2 O1), the
  generic "every section-2 secret" rule covers `item.flags`, but the explicit mark list does not name
  it. Resolving MA1-R3 may want a one-line plan amendment alongside the schema mark.
- **O3: both relevant test files are green on this tip.** `validator-declared-top-level.test.mjs`
  (7 pass) and `payload_scan_fresh_state_test.rb` (11 runs, 32 assertions, 1 skip, the held corpus
  scan). Consistent with R2.

## What else is clean (verified, not assumed)

- The whole-record NPC marks match `withhold_npc_secrets!` and the two `WITHHELD_*_NPC_KEYS` lists
  field for field, including `habits` minus `screen` and `print`.
- `creds.password` carries both of its serving routes (`GET /login_accounts` `postitNote`, and
  `GET /capture_secrets`), matching the written-down-note and capture-proof paths.
- The conditional `requires` (`unlessLockType`) and `combination` (`whenLockType`) marks are present on
  both `#/definitions/room` and `#/definitions/item`, and the classifier resolves them by lock type.
- The capture secrets carry `x-serverOnly` with `GET /capture_secrets` on all three descriptor paths,
  and `usePayload.secret` resolves through the schema resolver's declared-property rule.
