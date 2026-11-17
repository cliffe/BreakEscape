# Phish evidence chunk A review (R1)

Range reviewed: `d0764d4b8..6cd2f2b70` on `build/hard-phish-b`. Scope: Route 2 (`POST se/phish_send`),
`record_phish_send!` / `send_phish!` and the message hygiene helpers, the `CaptureModel` kit/account
lookups, the lock and policy wiring, the send client (`se-phish-send-client.js`), the build-post
registry in `se-landing-page-client.js`, the mail client dynamic import, and the Ruby and node tests.
Checked against plan `PHISH_EVIDENCE_SERVER_PLAN.md` sections 5, 6, 7, 13, 14, 15 (chunk A parts) and
the chunk A build-log section.

Verification run in the worktree: `test/js/social-phish-send-client.test.mjs` (6 pass),
`test/controllers/break_escape/se_phish_send_test.rb` (15 runs, 56 assertions, 0 failures),
`test/controllers/break_escape/game_state_locking_test.rb` (7 runs, 0 failures).

## Counts

- Blocker: 0
- Major: 2
- Minor: 3

## Verdict

SHIP chunk A, conditional. The route, the lock, the store write, the idempotency and the hostile-input
refusals are correct and the chunk does not regress honest play: at this tip the old client-evidence
reader still drives the reveal, so the two offline gaps below cannot refuse anyone yet. Both Major
findings are plan-conformance gaps in the offline wiring that section 11 and section 14 scope into
chunk A. They are not live-breaking now, but each is a permanent honest-player refusal the moment
chunk C switches the reader to the server stores. Treat finding 1 and finding 2 as hard prerequisites
that must land before chunk C merges (at chunk C they are Blockers).

## Findings

### Major 1: the offline queue holds sends but never re-posts the build (the key question)

`public/break_escape/js/systems/se-phish-send-client.js:122` (`recordPhishSend`) and
`public/break_escape/js/systems/se-landing-page-client.js:30` (`recordLandingPageBuild`).

The send client has a bounded re-send queue for sends (`sendQueue`, keyed `targetId/kitId`,
`se-phish-send-client.js:52`) drained on the `online` event. The build POST has no such queue:
`recordLandingPageBuild` is fire-and-forget with `.catch(() => null)` and only records its promise in
`buildPosts`; nothing re-posts it. `recordPhishSend` only awaits the existing build promise
(`awaitBuild`, `se-phish-send-client.js:78`); when that promise is null or resolved-to-null it proceeds.

Failure scenario: the player is offline (or the build route returns 5xx) when they attach, so the build
POST fails and is never retried. The player then sends. `attemptSend` returns `page_not_built_yet`
(retryable); the one retry re-awaits the same failed build promise and re-posts the send, which again
answers `page_not_built_yet`; the send is queued. Every `online` drain re-posts the send alone, which
answers `page_not_built_yet` forever, because no code ever re-posts the build. Today the old reader
lands the secret from client evidence, so nothing visible breaks. Once chunk C reads only
`seLandingPages`/`sePhishSends`, this honest offline-build player is refused `Sofia2026!` permanently.

Plan section 11 explicitly promises the missing half: "re-posts the build from the client page record
if none is pending" and a queue "keyed by pageId (builds) or targetId/kitId (sends) ... builds before
sends." Neither exists. Smallest fix: add a bounded build re-post queue keyed by `pageId` (holding
`{pageId, targetId, choices}`), drained before the send queue on `online` (and on sync, finding 2),
each drain re-posting `recordLandingPageBuild`; and let `recordPhishSend` trigger a build re-post when
`pendingBuildPost(pageId)` is null or settled-to-null, so the send does not queue behind a build that
will never be re-sent.

### Major 2: the queue drains only on `online`, not after a sync, so a 5xx-queued send is stuck

`public/break_escape/js/systems/se-phish-send-client.js:114` and `:148`.

`drainPhishSendQueue` is bound only to the browser `online` event (`bindOnlineDrain`). Its own docstring
and plan section 11 say it is also drained "after a successful sync", but no sync-success path calls it
(grep: the only caller is the `online` listener). A send enqueued when the server was reachable but
errored (`attemptSend` returns null on a 5xx whose body will not parse as JSON, so the send is treated
as offline and queued) is never drained, because `online` fires only on an offline-to-online transition
and the browser never went offline. Failure scenario: a transient 5xx on the send route leaves the send
queued with no trigger to retry it for the rest of the session; under chunk C the capture is withheld.
Fix: call `drainPhishSendQueue()` from the sync-success path (and drain the build queue from finding 1
there too).

### Minor 3: the in-memory queue is lost on reload and not re-driven

`public/break_escape/js/systems/se-phish-send-client.js:52` (`sendQueue` is module-scoped, in memory).

A send queued offline or as not-built, then a tab reload, loses the queued send. The mail UI shows the
message already sent, so the minigame does not re-drive it (plan section 11 only re-drives "the next
time the player attaches or sends", which an already-sent message does not trigger). Harmless at chunk A
(old reader); another honest-refusal path at chunk C. Worth a note for chunk C hardening, for example
persisting the pending-build intent so a reload can re-post it. Keeping the queue out of `player_state`
is correct (the sync size rule), so the fix is a client-side re-drive on reopen, not synced state.

### Minor 4: the superset test is a hand-picked proxy, not the client-judge shared fixtures

`test/controllers/break_escape/se_phish_send_test.rb:214` (superset test).

The test asserts two hand-written messages (`GOOD_MESSAGE`, `WEAK_MESSAGE`) land on one synthetic
scenario. Plan section 7 specifies a stronger superset test: shared fixtures derived from the client
judge (`describeVictimOutcome` returning `submitted`) across the lab kits/targets and one kit/target
from every authored-phish scenario found by a scenario scan, "so the one reader is checked on every
authored phish, not only the lab." The scan and the client-judge cross-check are absent, so the test
does not actually prove "every client-landed case passes the server." The guard test (`:233`, a weak
mis-addressed message over a convincing page still lands) is solid and would fail if the server read any
craft factor. The cross-scenario reader check arguably belongs with chunk C (the reader change), but the
plan scheduled the superset property in chunk A, so this is a coverage gap to close in chunk A or C.

### Minor 5: `headerFrom` and the free-text fields are neither validated nor length-capped

`app/models/break_escape/capture_proofs.rb` (`valid_send_message?`).

Plan section 5 step 3 states "headerFrom and slot values are authored value ids". The implementation
validates `fromAccount`, `link`, `attachment`, `slots` and `templates`, but not `headerFrom`, and
leaves `to`, `subject`, `linkText`, `linkInfo`, `attachmentKind` and `inReplyTo` both unvalidated and
uncapped. This is harmless for the gate, because no message field is stored (the entry persists only
`{targetId, kitId, pageId, landed, at}`), so there is no injection or storage growth, and leaving `to`
unchecked is in fact required for the superset (an email address would fail `valid_choice_id?`). But an
arbitrarily large `subject`/`headerFrom` is accepted and discarded, and the stated hygiene for
`headerFrom` is not met. Low priority; either validate `headerFrom` against authored values and cap the
free-text fields, or adjust the plan wording to match the implemented "store nothing, so hygiene is only
on the fields the gate touches" stance.

## Confirmed clean

- **Forgery (item 1).** Forged target, non-link or unknown kit, unauthored `fromAccount` or
  `attachment`, and oversized `targetId`/slot ids are each refused `invalid` with nothing stored
  (`record_phish_send!` steps 1 to 3; `valid_capture_target_id?` and `valid_choice_id?` cap at 100
  chars; `bounded_string_map?` caps slot/template leaves). An unbuilt page records `landed: false`
  retryable, a built-weak page `landed: false` permanent. The body's `landed` is never read (test
  `a body-asserted landed true ... does not land`). A replay after a landed first returns `:already`
  first-wins, one row, `at` unchanged. `sePhishSends` cannot be forged through `sync_state`: it is not a
  merged section and is never read from the request body (plan section 8, re-confirmed by the chunk-1
  log).

- **Superset honesty (item 2).** No honest client-landed path is refused. On every honest send the
  `fromAccount`, `link`, slot and template values are authored short ids, and `valid_choice_id?` caps
  length only (no character restriction), so authored ids pass; `to` is deliberately unvalidated so real
  addresses pass. The only theoretical refusal is an honest slot/template value over 100 chars, which
  honest play does not produce. The weakness is in test strength, not the code (finding 4).

- **Lock and lost updates (item 4 of brief).** `se_phish_send` is in both the `set_game` before_action
  and the `with_game_lock` around_action (`games_controller.rb:29`, `:105`); `send_phish!` is in the
  locking test's `STATE_WRITERS`; the locking test parses the real controller source and asserts
  `se_phish_send` is in `locked_actions`. Removing the lock fails the test. `send_phish!` reloads under
  the row lock before `record_phish_send!` + `stamp_proven_captures!` + `save!`, so it serialises with
  `performSend`'s `mailState` sync on the same row.

- **Synced state growth (item 5 of brief).** `sePhishSends` is bounded by (phish targets x link kits),
  keyed `targetId/kitId` first-wins, storing five scalar fields; it is never serialised to the client,
  never read from the body. The send client queue is module-scoped in memory and never enters
  `player_state` (`enqueue` stores `{body, deps}` in a `Map`). Net synced growth per send: zero.

- **Re-stamp and captures shape (item 6 of brief).** `send_phish!` diffs `proven_capture_target_ids`
  around `stamp_proven_captures!` (the old client-evidence reader this chunk) and emits
  `body[:captures] = { tid => captures_for_client[tid] }`, the same secret-stripped shape the sync uses
  (`captures_for_client` strips `proven`/`phishGated` and the secret). Correct now, and forward
  compatible: after chunk C the same route re-stamp reads the server stores. The captures answer is not
  yet consumed by the client (the send client reads only `landed`/`retryable`), so it is forward-looking,
  not wrong.

- **Dynamic import (item 7 of brief).** `mail-client-minigame.js:855` does
  `import(...).then(mod => mod.recordPhishSend(...)).catch(() => {})`, so an import error cannot break the
  send UX, and `recordPhishSend` never throws (every path is wrapped, returns null on failure). The send
  client lives in `systems/`, imported dynamically, so the builder folder stays network-free
  (`social-landing-page-render` still passes per the build log).

- **Chunk B parity.** Chunk A's landed rule, `page['built'] == true && page['meetsThreshold'] == true`
  (`record_phish_send!`), is identical to chunk B's private `phish_page_build_landed?`
  (`built == true && meetsThreshold == true`). No divergence.

- **Standing rules.** UK English, no em or en dashes, no model names, no new packages (the client uses
  plain `fetch`, no added dependency).
