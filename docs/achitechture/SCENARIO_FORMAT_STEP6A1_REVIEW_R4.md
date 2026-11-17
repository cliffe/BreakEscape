# Scenario format hardening step 6a-1 review R4

Date: 2026-11-14. Reviewer branch `build/hard-6a1`, tip `0524e1cbf`.
Scope: confirm R3's one Major and one Minor are closed (over `8bc904891..0524e1cbf`), an independent
server-side secret sweep rebuilt from the code (not R3's table), the reverse check that the client does
not read any newly marked field from `window.gameScenario`, and the standing rules on the lines added
since R3. Review only. The held full-corpus payload scan (step 3, `acknowledgedClues`) stays out of scope.

Reviewed against the server filters in `app/models/break_escape/game.rb`,
`app/models/break_escape/network_access.rb`, `app/models/break_escape/social_feed.rb`,
`app/controllers/break_escape/games_controller.rb`, `lib/break_escape` (`author_notes.rb`,
`declared_grants.rb`, `item_identity.rb`, `access_work.rb`), the marks in `scripts/scenario-schema.json`,
the test `test/js/validator-declared-top-level.test.mjs`, the client JS under `public/break_escape/js/`,
and the prior rounds R1, R2 and R3.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 0
- Observations (not counted): 3

Verdict: **SHIP.** R3's Major (`item.flags` unmarked) and Minor (`item.hintOnlyFlags` unmarked) are both
closed, with the two withheld network fields and `room.network` marked in the same commit and asserted by
the test. The independent sweep finds zero unmarked section-2 secrets and zero unmarked withheld fields;
every remaining strip is marked, served by a declared route, a progressive reveal of client-visible clue
data, a note-stripping pass, a dedup, a computed field, an inbound identity defence or runtime
player_state. No `.rb` changed over `8bc904891..0524e1cbf`, so the server strip behaviour is unchanged
since R3 and the payload-scan classifier it feeds is unaffected. The standing rules pass on every
shippable added line.

## R3 closure (verified over 8bc904891..0524e1cbf)

**MA1-R3 closed.** `#/definitions/item.flags` (`scenario-schema.json:5276`) now carries
`"x-serverOnly": true` and no `x-servedBy`, with a description naming `filter_requires_and_contents_recursive`.
`filter_requires_and_contents_recursive` (`game.rb:6187`) deletes `obj['flags']` from every room and
container object and replaces it with `flagCount`; no route serves the field, so the empty `x-servedBy` is
correct.

**MI1-R3 closed.** `#/definitions/item.hintOnlyFlags` (`scenario-schema.json:5286`) now carries
`"x-serverOnly": true`, matching its own "server-side only" prose. `game.rb:6192` deletes it outright
(consumed server-side by `find_hint_only_message`, never read by the client).

**R3 O1 resolved.** The object-level withheld network fields and `room.network`, which R3 noted were
unmarked by the plan's own scope, are now marked: `item.network` (`:5438`), `item.linkName` (`:5454`),
`item.linkStoreIn` (`:5455`), `room.network` (`:4177`), all `"x-serverOnly": true` with no route. They
are deleted from every object and room payload (`NetworkAccess::WITHHELD_OBJECT_FIELDS`, `game.rb:6196`;
`game.rb:2094`) and no route serves the authored field (the link item carries its own name and holder), so
server-only with no route is the correct mark, and the scan now fails closed on them.

**The test asserts every mark.** `test/js/validator-declared-top-level.test.mjs:91-95` loops
`['flags','hintOnlyFlags','network','linkName','linkStoreIn']` over `schema.definitions.item.properties`
and asserts `room.network`, alongside the existing `flags`, `targetFlags`, `roles` and `accountProfiles`
assertions (ran the file: 7 pass).

**The validator still accepts every scenario carrying these keys.** The validator never reads
`x-serverOnly` (no hit in `validate_scenario.rb` or `validator_report.rb`), so the annotation cannot
change acceptance. Ran `validate_scenario.rb --no-graph --skip-ink` over every scenario that authors one
of the keys (found by grep): `hintOnlyFlags` in m01, m09, m10; `linkName`/`networks` in
lab_physical_pentest; `room`/object `network` in test_access_networks and
ca20_remote_and_mobile_working; flag stations in m05, m07. All exit 0, 0 errors.

**The client reads none of the marked fields from `window.gameScenario`.** Grepped the engine JS for
`flagCount`, `hintOnlyFlags`, `linkName`, `linkStoreIn` and `.network`:
- `flags`/`flagCount`: the only flag-station reads are `interactions.js:1441` and
  `flag-station-minigame.js:37`, both `scenarioData.flagCount ?? (scenarioData.flags || []).length`, a
  defensive fallback behind the server-supplied count (the comment at `flag-station-minigame.js:35` says
  `params.flags` "is retained purely as a fallback"). Every other `.flags` read is phishing "tells"
  (`truth.flags`, `templates[].flags`) or awareness flags, a different concept, not the flag station.
- `hintOnlyFlags`: one hit, a comment at `flag-station-minigame.js:826`. No read.
- `linkName`/`linkStoreIn`: every `linkName` hit builds the name from `window.networkLinks.get(footholdId).name`
  or a `remote` descriptor (runtime), never the authored object field; `linkStoreIn`: no hit.
- `.network`: every read is `foothold.network` / `view.network` (an `{id,name}` object from the network
  API) or an error code, never the authored `network` string on an object or room.

## Independent server-side sweep (rebuilt from the code)

Every point in `app/models/break_escape`, `app/controllers/break_escape` and `lib/break_escape` that
removes authored scenario data from a client payload, with its schema node and mark. Marks confirmed by
loading `scenario-schema.json`.

| Strip / withhold | Field(s) | Mark | Verdict |
|---|---|---|---|
| bootstrap delete (game.rb:1816,1821,1825) | top-level `flags`, `accountProfiles`, `roles` | `x-serverOnly` (flags/roles no route; accountProfiles `GET /container`) | OK |
| `withhold_network_keys!` (network_access.rb:24) | `networks`, `networkLinks`, `resources` | `x-serverOnly`, `[GET /network, GET /container]` (:265,:289,:295) | OK |
| `filter_target_flags` (game.rb:6065,6072) | `task.targetFlags` | `x-serverOnly`, no route | OK (R2) |
| `strip_lock_answers!` (game.rb:3590,3591) | `combination`, `cryptexConfig.answer` | `x-serverOnly` leaf; `combination` `whenLockType` | OK |
| requires rule (game.rb:6143; controller:2650; game.rb:1339) | `requires` (non biometric/bluetooth/rfid) | `x-serverOnly: { unlessLockType }` | OK |
| `strip_capture_secrets!` (game.rb:6100) + usePayload/addCapture (game.rb:6287,6294) | capture `secret`, `usePayload.secret`, `addCapture.secret` | `x-serverOnly`, `GET /capture_secrets` | OK (R1) |
| `withhold_npc_secrets!` / `WITHHELD_NPC_KEYS` (game.rb:6227,6271) | NPC `creds`, `awareness`, `role`, `workarounds` | `x-serverOnly` | OK |
| `WITHHELD_WORK_NPC_KEYS` (game.rb:6231,6272) | NPC `workNeeds`, `frustration`, `feed` | `x-serverOnly` | OK |
| habits allow-list, `SHIPPED_HABIT_KEYS` (game.rb:6239,6279) | `habits.*` except `screen`, `print` | the six stripped habit keys `x-serverOnly` | OK |
| `creds.password` written-down note (game.rb:2044; controller:1340) | `creds.password` | `x-serverOnly`, `[{GET /login_accounts, postitNote}, GET /capture_secrets]` | OK (R1) |
| `SocialFeed::POST_KEYS` on reveal (social_feed.rb:25) | feed `id/text/fact/date/note/replyTo` | `x-servedBy: feedPosts` inside server-only `feed` | OK |
| **`item.flags`** (game.rb:6187) | **`item.flags`** | **`x-serverOnly`, no route (:5276)** | **OK (R3 fix)** |
| **`hintOnlyFlags`** (game.rb:6192) | **`item.hintOnlyFlags`** | **`x-serverOnly` (:5286)** | **OK (R3 fix)** |
| **`WITHHELD_OBJECT_FIELDS`** (network_access.rb:21; game.rb:6196; room 2094) | **`item.network`, `linkName`, `linkStoreIn`, `room.network`** | **`x-serverOnly`, no route (:5438,:5454,:5455,:4177)** | **OK (R3 fix)** |
| `withhold_feed_facts!` (social_feed.rb:306) | `social.intelFacts[feed ids]` | `intelFacts` unmarked (:429) | sound reason (O1) |
| `contents` lazy-load (game.rb:6152,6163,6172; controller:2900) | `item.contents` on locked/login/usb | `contents` unmarked (:5330) | sound reason (O2) |
| `strip_notes!` (author_notes.rb:57); `strip_objective_notes` (game.rb:4466) | `_`-prefixed author notes | note convention, not a secret | sound reason (O3) |
| `filtered.delete('startItemsInInventory')` (controller:463) | `startItemsInInventory` | served on fresh start; deleted only once live inventory ships | sound reason, no finding |
| `compile_npc_plan!` (game.rb:6257,6263) | `work`, `hasFeed` | computed/injected, not authored | sound reason, no finding |
| `strip_forgeable_lock_fields` (game.rb:1085); forgeable copy (controller:2970) | lock fields on an inbound item copy | inbound identity defence, not a payload strip | sound reason, no finding |
| `strip_grant_contents!` (declared_grants.rb:73) | grant node `contents` | validator-time grant expansion, not a client payload | sound reason, no finding |
| saved_cards / login_failures / se_captures / footholds (game.rb:667,2686; capture_proofs.rb:488; network_access.rb:291) | runtime player_state | no authored source path | sound reason, no finding |

Reasons for the "sound reason" rows (zero unmarked section-2 secrets, zero unmarked withheld secrets):
- **`withhold_feed_facts!`** deletes the feed-sourced entries from `social.intelFacts` so they are earned
  by reading the feed (`grantFact`) rather than seen upfront. `intelFacts` is otherwise client-visible
  (the intel board and OSINT browser read it), so it cannot be marked server-only; the withheld entries
  are narrative clue text (class 3 in the scan), not a flag answer, password or lock-skip value. A
  progressive reveal of client data, not a secret strip.
- **`item.contents`** is a conditional lazy-load: deleted only when the container is locked, a login PC or
  a habit USB, and served by `GET /container`; an unlocked in-room container ships its contents, and each
  content item is itself recursively filtered of its own secrets. Legitimately client-visible, so no
  whole-field mark applies.
- **author and objective notes** are `_`-prefixed documentation stripped by the `note?` convention, which
  is false everywhere inside free data; they carry no answer.

## Standing rules on the lines added since R3 (8bc904891..0524e1cbf)

Shippable and build-log lines only (the R3 review file is a record).
- **No em or en dashes:** none on any added line (Unicode dash grep, no hits).
- **No model names:** none on any shippable line. The only `Opus`/`Sonnet`/`Haiku` strings in the diff are
  inside the R3 review prose that lists the grep terms, which is a record and excluded by the prior rounds'
  convention.
- **UK English:** the build-log "Review R3 fixes" entry and the four schema descriptions read clean; no US
  spellings.

## Observations (not counted)

- **O1: `social.intelFacts` feed entries are withheld but the block is unmarked, by design.**
  `withhold_feed_facts!` (`social_feed.rb:306`) removes the feed-sourced fact ids from a block the client
  needs for the facts the player has earned (`scenario-schema.json:429`). A whole-field mark would hide
  facts the intel board must show. The withheld entries are class-3 clue text, so a sound reason exists to
  leave the block unmarked; recorded so the held scan's authors know this withhold is intentional and not a
  gap.
- **O2: `item.contents` is withheld on locked containers but served on unlocked ones, so it is unmarked.**
  The lazy-load (`game.rb:6152-6172`) is served by `GET /container`; an unlocked in-room container ships
  it. Noted for the same reason as O1: a reader comparing strips to marks will see `contents` stripped and
  unmarked, and the reason is conditional serving, not an oversight.
- **O3: both test paths are consistent with R3.** `validator-declared-top-level.test.mjs` is green (7
  pass). No `.rb` changed over `8bc904891..0524e1cbf` (diff is schema, this family of review files, the
  build log and the test only), so `payload_scan_fresh_state_test.rb` and the server strips it exercises are
  unchanged since R3, where they were green.

## What else is clean (verified, not assumed)

- Every marked server-only field is read by the client only defensively or not at all; the reverse sweep
  found no contradiction (flag count, foothold network objects and runtime link names are distinct from the
  authored fields).
- The whole-record NPC marks still match `withhold_npc_secrets!` and the two `WITHHELD_*_NPC_KEYS` lists
  field for field, including `habits` minus `screen` and `print`.
- The four R3 fixes carry `x-serverOnly: true` with no `x-servedBy`, correct for fields served by no route.
