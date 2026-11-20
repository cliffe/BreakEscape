# Phish evidence chunks A and B: review R2 (combined)

Review only, in worktree `.claude/worktrees/p-hard-phish-b`, branch `build/hard-phish-b`, tip
`5c6405e34` (a merge of main `bb0a458b1` on top of `ea8cd807f`). Range reviewed:
`git diff d0764d4b8 ea8cd807f` (chunk A Route 2 and client wiring, chunk B legacy migration, the
A/B reconcile, and the chunk A review-R1 fixes). The main merge was checked separately
(`git diff ea8cd807f 5c6405e34`): it touches none of the phish files (capture_proofs.rb,
games_controller.rb, capture_model.rb, the two se-*-client.js, state-sync.js, main.js,
mail-client-minigame.js, routes.rb all return empty in that range), so it disturbed none of this work.
Spec: `PHISH_EVIDENCE_SERVER_PLAN.md`; prior reviews `..._CHUNK_A_REVIEW_R1.md` (2 majors, 3 minors)
and `..._CHUNK_B_REVIEW_R1.md` (4 minors). Build log `..._SERVER_BUILD_LOG.md`.

Verification run at the worktree tip (single files only, no suites, no server; the live proof on
:3664 was not touched): `test/js/social-phish-send-client.test.mjs` 14/14 pass;
`test/models/break_escape/phish_superset_test.rb` + `test/controllers/break_escape/se_phish_send_test.rb`
25 runs, 89 assertions, 0 failures; `se_phish_send_test.rb` alone 21 runs, 76 assertions, 0 failures.

## Counts

- Blocker: 0
- Major: 0
- Minor: 4

## Verdict

SHIP chunks A and B. Every R1 finding is closed in the code (chunk A majors 1 and 2 and minors 3, 4,
5; chunk B minors 1, 2 and the cross-chunk reconcile minor 3). The fresh pass found no forge: the
reload re-drive and the two queues give a tampered client nothing the two routes would not already
grant by a direct POST, the routes recompute every build verdict server-side and compute `landed`
only from the server store, and no honest send is refused by the new message hygiene. The four Minors
are a latent coupling to harden before chunk C (the reload re-drive trusts the client global and
Route 1 is last-wins), two test-strength notes, and one stale build-log tally. None blocks the merge.

Chunk B minor 4 (an oversized but on-menu `fields` array stored whole) is unchanged and is correctly
left as a shared-Route-1 note, not a chunk A/B defect.

---

## Part 1: R1 findings confirmed closed

### Chunk A

- **Major 1 (build re-post queue, drained before sends).** CLOSED.
  `se-landing-page-client.js:41` holds a bounded `buildQueue` (one entry per page id, in memory).
  A build POST that returns non-ok or throws is enqueued (`recordLandingPageBuild:158,161`;
  `attemptBuild` returns `{ok:false}` on a thrown fetch, `:93`). `drainBuildQueue` (`:125`) re-posts
  each and refreshes `buildPosts` to a landed promise. `drainPhishQueues` (`:139`) drains builds
  then sends. `recordPhishSend` triggers a build re-post on a retryable answer when the build POST is
  missing or settled not-ok (`pendingBuildFailed` + `drainBuildQueue`, `se-phish-send-client.js:143-149`).
- **Major 2 (drain on sync, not only `online`).** CLOSED. `state-sync.js:793` calls `notifySyncOk`,
  which dispatches `break-escape:sync-ok` (guarded, `:14-23`). `ensurePhishDrainBound`
  (`se-landing-page-client.js:110`) binds the combined drain to both `online` and that event.
- **Minor 3 (reload re-drive).** CLOSED. `main.js:191` on `game_loaded` dynamically imports and runs
  `redrivePhishEvidence` (`se-phish-send-client.js:200`), re-posting each built page's build from the
  durable `globalVariables.se_landing_pages` and, where `victim.submitted`, the send.
- **Minor 4 (cross-scenario superset scan).** CLOSED. `phish_superset_test.rb` scans
  `scenarios/*/scenario.json.erb` (finds lab_social_engineering, test_social_slice, ca05_signin_pages),
  derives convincing choices from each page's own menus, checks `PhishScore.meets_threshold`, then
  drives the real `record_landing_page_build!` + `record_phish_send!` and asserts `landed: true`.
- **Minor 5 (headerFrom + free-text caps).** CLOSED. `valid_send_message?` now calls
  `valid_header_from?` (`capture_proofs.rb:415`) and length-caps `to`, `subject`, `linkText`,
  `attachmentKind`, `inReplyTo` (`:405`), with `bounded_info_map?` for `linkInfo` (`:441`).

### Chunk B

- **Minor 1 (em dashes in build log).** CLOSED. No em or en dash on any added line in the range
  (checked over app/lib/public/test/config and the build log).
- **Minor 2 (stale assertion tallies).** CLOSED. The build log now reads "9 runs, 48 assertions" and
  "4 runs, 19 assertions" (lines 604, 610), matching the committed tests. (One later handover tally
  is still off: see Minor 3 below.)
- **Minor 3 (cross-chunk reconcile).** CLOSED. Route 2 computes `landed` through the shared
  `phish_page_build_landed?` helper (`record_phish_send!:315`), the same method the migration uses
  (`:583`). `sePhishSends` is first-wins on `landed: true` (`:320`), so a migration `landed: false`
  is upgraded by a later genuine send; the key form matches (migration keys `targetId/kit_ids.min`,
  `:582,584`; Route 2 keys `targetId/kitId`, `:318`; for a single-link-kit page the two are the same
  key). The reconciliation test (`se_phish_send_test.rb:279`) proves the upgrade in one row, not two.

### Route 2 shape (brief item 1 last bullet)

Confirmed: `record_phish_send!` uses `phish_page_build_landed?` (`:315`), first-wins on `landed:true`
(`:320`), keys `"#{target_id}/#{kit_id}"` (`:318`) matching the migration's key for the single-kit
case. The body's `landed` is never read. Target must be an authored phish target (`:301`) and kit an
authored `link` kit (`:305-306`).

---

## Part 2: fresh pass

### Minor 1: the reload re-drive trusts the client global and Route 1 is last-wins; a future client desync would silently downgrade the server build chunk C reads

Files: `se-phish-send-client.js:200-226` (`redrivePhishEvidence`), `capture_proofs.rb:259`
(`record_landing_page_build!` is `store[page_id] = entry`, last-wins, not first-wins).

The brief's premise that `seLandingPages` is first-wins holds only for the migration (`||=`, `:569`)
and for the send store; the live build route is last-wins and replaces the entry on every POST. That
is correct for an honest rebuild (improving a weak page re-posts and the better verdict replaces the
weak one, so the better build is recorded). The coupling to flag is on reload: `redrivePhishEvidence`
re-posts the build for every page using the choices held in the untrusted client global
`globalVariables.se_landing_pages[pageId].choices`, unconditionally, even when the server already
holds a correct build. Because Route 1 is last-wins, the reload makes the client global authoritative
for the recorded server build.

No honest reproducer exists today: `attach()` writes the global and posts the build from the same
choices, and the honest send path preserves choices (`mail-bridge.js:419`,
`buildLandingRecord({ ...rec, victim: next })` spreads the record and changes only `victim`); the
lost-update that reverted the client `built` flag was closed by putting Route 1 under the game lock.
So the global's choices equal the server-recorded choices, and the re-post re-derives the same
verdict. Rate: Minor, defensive. The exposure is latent, not live: chunk C reads only the server
store, so any later desync bug (a global whose choices drift weaker than a correct server build) would
be silently laundered into the server store on the next reload and withhold an honest secret. A
tamper to weaker choices only lowers the attacker's own build (no forge: the server recomputes the
verdict, so a global with stronger on-menu choices is just an honest build the builder UI could make
anyway). Hardening options: have the re-drive skip a build re-post when `pendingBuildPost(pageId)`
already landed, or keep the higher-credibility verdict on a Route 1 rebuild.

Forgery, bounding, idempotence (brief item 2, re-drive): no capability beyond the routes. One build
POST plus at most one send POST per authored page, once per reload (`eventDispatcher.once`,
`main.js:192`), bounded by the authored page count (one for the lab). A page with no stored choices
posts nothing (`:208` `continue` before any POST), so it never sends for a choiceless page. The build
route recomputes the verdict; the send route lands only on a server build that meets threshold; the
send re-post carries `message: {}`, which passes hygiene (all fields nil) and is never judged.

### Minor 2: the superset scan is an exact-substring match and tests one page per scenario with maximal choices

File: `phish_superset_test.rb:28` (`raw.include?('"kind": "link"')`), `:70-84` (`link_case` returns
the first matching kit), `:45-61` (`convincing_choices` takes the best option per factor).

The scan matches the literal string `"kind": "link"` with that exact spacing. All three current
link-kit scenarios use that spacing, so none is missed today, but a future scenario whose JSON writes
`"kind":"link"` or other spacing would be silently skipped and gain no coverage. `link_case` returns
only the first link kit per scenario, so a scenario with two link-kit pages tests one (the R1 spec
asked for one kit/target per scenario, so this matches intent). `convincing_choices` uses the
strongest page the menus allow, so the test catches gross server-stricter drift (a convincing page
the server refuses fails loudly) but not threshold-boundary drift (a server that rejected only
just-above-threshold pages would still pass, because the test never builds a marginal case). Rate:
Minor, test strength. Either match `"kind"` tolerant of whitespace, or add a marginal-threshold case.

### Minor 3: a build-log handover tally is stale

File: `PHISH_EVIDENCE_SERVER_BUILD_LOG.md:746`, "se_phish_send (25)". That file runs 21 tests at this
tip (76 assertions); the 25 is the combined count with `phish_superset` (4), which the same line also
lists separately, so the 4 is double-counted or `se_phish_send` is mislabelled. Mirrors the chunk B
minor 2 pattern. Rate: Minor, documentation. Correct to `se_phish_send (21)`.

### Minor 4: concurrent drains across `online` and `sync-ok` have no re-entrancy guard

Files: `se-landing-page-client.js:115-116` (both events call `drainPhishQueues`),
`drainBuildQueue:127` and `drainPhishSendQueue:170`.

`online` and `break-escape:sync-ok` each bind a listener that calls the async `drainPhishQueues`, and
`sync-ok` fires on every successful sync, so two drains can overlap (a sync-ok while an online drain
is in flight). There is no in-flight guard. It is safe: each drain snapshots with
`Array.from(queue.entries())` before iterating, and the server records are first-wins idempotent, so
an overlapping drain cannot double-credit or corrupt the Map; a `Map.delete` of an already-deleted key
is a no-op. The only cost is a few redundant in-flight POSTs, bounded by the queue size. Rate: Minor,
and arguably just an observation; a single in-flight flag would remove the redundant posts.

---

## Confirmed clean

- **The `break-escape:sync-ok` event does not change sync behaviour.** `notifySyncOk`
  (`state-sync.js:16`) is fully guarded (checks `window`, `dispatchEvent`, `CustomEvent`, wrapped in
  try/catch that swallows) and is called after the sync-success bookkeeping, dispatching a bare event
  with no payload. It cannot fail a sync and the headless sync tests (no `CustomEvent`) are
  unaffected.
- **The dynamic imports fail safe.** `main.js:195` `.catch` logs and swallows; the mail client
  (`mail-client-minigame.js:853`) `.catch(() => {})`; both `recordPhishSend` and
  `redrivePhishEvidence` never throw (every path wrapped, return on failure). An import error cannot
  break the send UX or the reload.
- **headerFrom accepts every honest send.** The real composer (`mail-composer.js:852-860`) only ever
  emits the object form: `{ account: true }`, or `{ name, address }` where each is a slot value or
  `null` (`slotValue || null`, never the empty string). `valid_header_from?` accepts nil, boolean,
  and a non-empty string id for object values (`:424-429`), so the honest object passes; the string
  form (which the composer never sends) is checked against authored accounts and only bites a forged
  body. Tested at `se_phish_send_test.rb:204,221` (honest object and authored-account string pass) and
  `:212,237` (unauthored string and 5000-char name refused). `MAX_CAPTURE_TARGET_CHARS` is 100; an
  honest display name is well under it.
- **Queues stay in memory and add no synced state.** `buildQueue` and `sendQueue` are module-scoped
  Maps, one entry per page / per target-kit, holding only the body plus the fetch/window deps
  (`enqueue:113`, `enqueueBuild:101`), never `player_state`. The drain order is builds before sends
  (`drainPhishQueues:139`). `sePhishSends` / `seLandingPages` are never serialised to the client (R1,
  re-confirmed: not in any sync merge section, not in the bootstrap allowlist).
- **Lock and lost updates.** `se_phish_send` is under `with_game_lock` (R1 locking test);
  `send_phish!` reloads under the row lock and runs `record_phish_send!` + `stamp_proven_captures!` +
  `save!` in one pass, serialising with the mailState sync on the same row.
- **Main merge.** `git diff ea8cd807f 5c6405e34` over every phish file is empty; the merge brought
  unrelated UI, sprite and scenario work and left this work intact.
- **Standing rules.** UK English; no em or en dash on any added line; no model names (the build log's
  GEMINI reference is the `GEMINI_API_KEY` env var); no new packages (client uses plain `fetch`).
