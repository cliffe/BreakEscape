# Sync stale-but-recent ring: plan review round 1

Verdict: REVISE.

Counts: 1 blocker, 2 major, 4 minor (plus 2 nits).

Target: `docs/achitechture/SYNC_STALE_RING_PLAN.md` on `build/hard-sync-ring-plan`
(worktree `p-hard-sync-ring`, tip d688fc8f0, from train 47 b83696932). Review
only: no code or plan edited, no server run. Every claim below was traced to the
code in this worktree.

## One-line summary of findings

- B1 (blocker): the ring has a fixed size of 4, so when more than four
  last-write-wins requests land within the 60 s window the skip set is
  incomplete, and a stale-but-recent request can overwrite a newer value. That
  is the exact invariant the change exists to protect.
- M1 (major): "the server ring alone closes gap 2 for every client" is false.
  Both gap 2 and gap 3 need the client re-stamp. The gap 2 controller test as
  specified (section 10, with the section 3 stamps) cannot pass.
- M2 (major): the plan files `timedMessages` as a keyed section, but the server
  replaces it whole (`replace_timed_messages!`). A key-by-key pre-filter that
  drops one of its keys and calls the merge wipes the key it kept.
- m1 (minor): keyed deletions / tombstones are not stated to be recorded as key
  claims; recorded wrongly, a stale re-add resurrects a deleted global.
- m2 (minor): appending to the ring on every landed write makes `@game.changed?`
  true, so a no-op resend now saves; this can trip the query/save counters that
  `capture_proofs_test` and the sync size work rely on.
- m3 (minor): "new client against an old server is no worse than today" is wrong
  in one order (harmless in practice: a single-server deploy cannot reach it).
- m4 (minor): equal-stamp cross-tab writes are not skipped (strict `>`), so a
  same-ms older write can win. No worse than today's tie, but undocumented.
- Two nits (snapshot collapse over-skip, live-proof wording) at the end.

## 1. Are the three gaps real, and reachable in honest play?

Yes, all three are real in the code as it stands.

- `stale_sync_request?` (games_controller.rb:2169-2179) orders whole request
  bodies by one scalar, `player_state['lastSyncClientTs']`. A request at or
  below it (and within ten minutes, SYNC_STALE_RESET_MS :2122) returns true and
  skips `merge_last_write_wins_sections` wholesale (:863). Grow-only and capture
  still run. This is the all-or-nothing ordering the gaps describe.
- The client's below-stamping is real: `flush` reserves a stamp below every
  flush (state-sync.js:853-855) and `_changesSinceInFlight` stamps the reduced
  body at `oldest.clientTs - 1` (:971), below the flush in flight.
- Gap 2 (newer content dropped as stale) and gap 3 (a key changed twice, the
  older value wins) both follow from a reduced body stamped below the flush it
  chases. Gap 1 (the unique large body fails after the page is gone) is the
  request-never-arrives residue.

Reachability: all three need the whole delta to exceed the keepalive budget
(KEEPALIVE_BODY_LIMIT 60000, state-sync.js:6) during a hide, show, hide
sequence, so the second flush goes reduced. That needs a single global (or mail)
section in the tens of kilobytes. Landing-page builders and mail missions can
hold object globals that large, so it is reachable, but it is rare: a 30 s
periodic sync usually clears the delta first. The plan's framing of the gaps as
rare is honest.

## 2. The key-by-key stale merge, per section type

### B1 (blocker). A fixed ring of 4 makes the skip set incomplete under bursts

Where: plan section 4 (SYNC_RING_MAX = 4, normalisation steps 2 and 3) and
section 5 (the skip-set definition, "every ring entry with entry.ts > ts").

The stale-but-recent merge is only safe if the ring holds every accepted write
with `ts > D.ts`. The normalisation keeps the newest four entries by ts and
drops entries more than 60 s below the max. Nothing bounds how many
last-write-wins requests land inside the window, and the band that selects the
stale-but-recent path is `0 <= stored - client_ts <= SYNC_RING_WINDOW_MS` (60 s),
not "within the oldest retained entry".

Failure scenario. stored (max ts) = T, with four retained entries at T, T-5 s,
T-10 s, T-15 s. A fifth write at T-18 s that uniquely wrote global `k` has been
evicted (only four are kept). A stale-but-recent request D at ts T-20 s (inside
60 s, so stale-but-recent) carries an older `k`. Its skip set is built from the
four retained entries, none of which wrote `k`, so `k` is not skipped. D writes
its older `k` over the newer value from the evicted T-18 s write. A stale
request has undone a newer one, which is the invariant this plan sets out to
hold. It is reachable whenever more than four last-write-wins writes land in a
short span, which a KO fight (requestSoon, REQUEST_SOON_* 750/1500 ms) plus
periodic syncs plus hide/show flushes can produce.

Fix to require: treat a request as stale-but-recent only when `D.ts` is at or
above the oldest retained ring entry's ts (so the ring is known to hold the
complete set of newer writes); otherwise fall back to fully stale, exactly as
today. Equivalently, bound writes per window, but the guard is simpler and
provable. The plan must state this guard and test it (a burst of more than four
writes, then a stale-but-recent request older than the oldest retained entry,
asserted to fall back to whole-skip).

### M2 (major). timedMessages is whole-replace, not keyed

Where: plan section 5, "Keyed last-write-wins (globalVariables, npcInkVariables,
npcVisibility, npcHostility, mailState, notes, phoneState, timedMessages)".

`replace_timed_messages!` (game.rb:5136-5160) replaces the whole
`player_state['timedMessages']` from the incoming `{ pending, delivered }`; it
does not merge by key. The client sends it whole (state-sync.js:617 analogue:
`body.timedMessages = full.timedMessages`), with one derived ack
(`timedMessagesKey`), not per-key acks. So timedMessages has no per-key client
delta.

Failure scenario. If the recorder files it as keyed (`w.timedMessages =
["pending","delivered"]`) and the pre-filter drops one claimed key, the merge is
called with a partial hash and replaces the whole section, wiping the key it
kept (dropping "pending" leaves `{ delivered }`, and the merge rebuilds
`pending => []`). timedMessages must be a whole-section claim
(`"timedMessages": true`), skipped entirely when a newer entry wrote it.

### The rest of the section types trace clean

- globalVariables: keyed, `null` deletes (merge_global_variables!
  game.rb:833-837). Server-owned (`se_captures`, SERVER_OWNED_GLOBAL_NAMES :2275)
  and read-only globals (imports, worn, `server_credit_global_names`) are dropped
  by the merge (:806-831), so a stale request cannot write them regardless of the
  ring. The revoked-cards key (:812-821) is a grow-only union inside a keyed
  section: filtering it by key stays safe, because dropping it never puts an
  older value over a newer one and the client resends the union. Good, but the
  recorder must record only keys the merge actually landed, not every key in
  params (see m2).
- npcInkVariables, npcVisibility, npcHostility, phoneState: keyed per id, each
  replacing that id's entry whole (game.rb:5105, 4981, 5005, 5198), so dropping a
  claimed id is safe. npcHostility never undoes a KO in the merge itself
  (:5020), so even an applied older entry cannot un-KO. Correct as keyed.
- mailState: keyed by the flattened keys (`mailboxes.<box>.<msg>`,
  `threads.<key>`, `jobs`, `drafts`, `metrics`, game.rb:5494-5528), which is how
  the client sends them and how `merge_mail_state!` applies them. `jobs` is a
  whole-list replace under one key, which is fine. notSaved-over-a-cap is kept by
  running the unchanged merge on the narrowed input. Correct.
- notes: keyed by id (games_controller.rb:2266-2276). Correct.
- playerHealth: a whole-section claim (`"playerHealth": true`). merge_player_health!
  (game.rb:5053-5062) rejects invalid or out-of-range values, so the recorder
  must record it only when it actually wrote. Correct as described.
- currentRoom: whole string with the viaPass credit and notSaved contract
  (games_controller.rb:2188-2218). Recording `true` only when accepted (not when
  `may_sync_current_room?` refused it to notSaved) is correct and is what keeps a
  refused room from blocking a later legitimate one.
- Grow-only (triggeredEvents, scenarioClock, commandBoardLog, biometricSamples,
  scenarioBriefShown): never filtered, correct. Note that the client sends
  triggeredEvents as a KEYED_SECTION (state-sync.js:31) even though the server
  treats it grow-only (merge_triggered_events!), so the recorder must classify by
  the server's handling, not by the client's section list, and must not record
  grow-only sections into `w`. The plan should say this explicitly.

### m1 (minor). Deletions and tombstones

Section 5's keyed bullet ("drop the keys a newer entry claimed") does not say a
deletion counts as a claim. A newer request that deletes global `k` (client
sends `k: null`, state-sync.js:585; merge deletes it, game.rb:834) must record
`k` in `w`, or a stale-but-recent request carrying an older `k` is not skipped
and resurrects the deleted key. The shape example (`"globalVariables": ["g"]`) is
a list of key names, so recording a deleted key's name is the natural reading,
but the plan must state that a deletion is recorded as a claim and test it.

## 3. The client re-stamp

Correct in direction, but the plan mis-attributes which gap each half closes.

- With the re-stamp (reduced body drawn at a plain `nextClientTs`, above every
  in-flight flush), ts order matches content order, and gaps 2 and 3 both close:
  if D lands first it is fresh and applies; if D lands second H is
  stale-but-recent and the ring merges H's unique keys while skipping those D
  wrote. Section 7 states this correctly.
- Could the re-stamp make a fresh body judged stale, or a stale one judged
  fresh? No. `nextClientTs` (state-sync.js:723) is `max(Date.now(), last + 1)`,
  and `last` was advanced when the in-flight flush drew its stamp, so the reduced
  body is strictly above them and above `stored` for its own page: never wrongly
  stale. It carries the newest content, so "fresh" is correct: no false-fresh.
- Why the reservation existed: "leave one clientTs free below every flush"
  (state-sync.js:853-855) reserved a slot so `_changesSinceInFlight` could stamp
  the reduced body at `oldest.clientTs - 1` and still stay above `prevTs`. Once
  the reduced body stamps above instead, no slot below is needed, so removing the
  reservation is safe. Nothing else depends on it (the whole-delta-if-it-fits
  branch, :868-871, already stamps at the flush's own clientTs, which stays above
  `prevTs`).
- Clock skew, 10-minute reset, multiple tabs: the server compares client stamps
  only, `nextClientTs` stays monotonic on a page, and the 60 s ring window sits
  well inside the ten-minute reset, so a reset request (over ten minutes below)
  is fresh and never a stale-but-recent merge. The plan's section 7 is right on
  these.

### M1 (major). "Server ring alone closes gap 2" is false

Where: plan section 8 first paragraph ("the ring closes gap 2 even for an
unchanged old client, because the stale body D (stamped below H) becomes a
stale-but-recent merge instead of a whole-body skip") and Q3 ("The server ring
alone closes gap 2 for every client").

The skip set is keyed by ts, and in the old below-stamp regime ts order is
inverted against content order. Trace gap 2 with the old stamps (H.ts 1002 carries
the pre-hit health 100; D.ts 1001 carries the post-hit health 70; H lands first):
H is fresh, stores 1002, writes health 100, and the ring records H wrote
`playerHealth`. D arrives at 1001, stale-but-recent. Its skip set is the union of
entries with ts > 1001, which includes H, which wrote `playerHealth`. So D's
`playerHealth` 70 is skipped and health stays 100. Gap 2 is not closed by the
server ring; it needs the re-stamp (which makes D fresh, so it applies when it
lands second). The same is true of gap 3: with D below H, D lands first and is
fresh, H lands second and is also fresh (1002 > 1001), so H is never on the
stale-but-recent path at all and overwrites with the older value.

Consequence for the tests: the section 10 gap 2 test ("Gap 2: H then D, assert
playerHealth == 70") combined with the section 3 stamps (tsH 1002, tsD 1001)
cannot pass under the plan's own skip-set rule, because D's `playerHealth` is in
the skip set. The test is self-contradictory. Either it must use the shipped
re-stamped order (D above H, D fresh when it lands second), in which case it is
really exercising the re-stamp and not the ring, or the attribution and the test
must be rewritten. The functional outcome of shipping both server and client
(the plan's recommendation) does close gaps 2 and 3; only the "server-only" claim
and this one test are wrong.

### m3 (minor). New client against old server

Section 8 and Q3 say a new client against an old server is "no worse than
today". It is worse in one order: with D stamped above H, if D lands first the
old server stores D.ts, then H arrives stale and the old server skips all its
last-write-wins sections, losing H's unique content; today (D below H) that same
order has H land second as fresh and apply. The case is not reachable in a
single-server deploy (the served client and the server move together, so a
client is never newer than its server), so it is harmless, but the stated
rationale is wrong and should be corrected or dropped.

## 4. The ring's bound, expiry, never-sent, lock

- Fixed size: bounded to four entries, 60 s window, 32 keys per entry
  (collapsing to `true` when exceeded). Bounded above regardless of session
  length. The byte-cap test is the right pin. The one caveat is B1: fixed size is
  what creates the completeness hole, so the guard there is required alongside the
  bound.
- Never sent to the client: confirmed. The bootstrap composes `filtered` key by
  explicit key (games_controller.rb:320-430); `lastSyncClientTs` is not among
  them and `syncWrites` would not be either. The sync answer is built from fixed
  fields (:883-904). No route serialises the whole of player_state: the only
  whole-slice is `new_session`'s `preserved_keys` (:268-269), server-side and for
  a fresh game, which naturally drops `syncWrites`. Two tests (bootstrap omits
  `syncWrites`, answer omits it) are the right guard.
- Inside the row lock: `sync_state` runs one `Game.transaction` with
  `Game.lock.select(*SYNC_STATE_COLUMNS).find` (:840-841), so a ring read,
  skip-set build, merge and append placed inside that transaction (as the plan
  states) are serialised per game. Correct.

### m2 (minor). Ring append erodes the save-only-when-changed optimisation

`sync_state` saves only when `@game.changed?` (:880). Appending to
`player_state['syncWrites']` on every landed write makes player_state dirty, so a
request that today rebuilds equal data and does not save would now save. For a
request that genuinely wrote a last-write-wins key this is fine (it would save
anyway), but a no-op resend of an unchanged value (the client resends unconfirmed
sections) would now save if the recorder keys off params rather than off what the
merge actually changed. Record only keys whose merge changed a value, both for
skip-set accuracy and to keep the no-op path from saving. The capture_proofs_test
query/save counter and the sync size work may otherwise move.

## 5. Network delay and reordering

A legitimately slow or reordered player does not lose progress once B1's guard is
added and the re-stamp ships: D-first makes H stale-but-recent (merge its unique
keys), H-first makes D fresh. No new refusal is introduced (the stale-but-recent
path returns `{ success: true, stale: true }`, and the client treats a stale
answer as resend, state-sync.js:773). The one remaining loss is gap 1's residue
(a request that never arrives), which no server change reaches, correctly left as
backlog.

### m4 (minor). Equal-stamp cross-tab writes

Within one page stamps strictly increase (`nextClientTs`), but two tabs can draw
the same `Date.now()` ms. The skip set uses `entry.ts > ts` (strict), so a
stale-but-recent request whose ts equals a newer entry's ts does not skip that
entry and can overwrite its value. This is a same-millisecond cross-tab tie whose
order is already undefined, and no worse than today (today an equal stamp is
stale and whole-skipped), but the plan should note it rather than imply strict
safety.

## 6. Row lock and format 409

Correct. The format refusal still runs first and rolls back on a 409
(games_controller.rb:848-851), so a format-refused request writes neither
`lastSyncClientTs` nor the ring. The dormant 403 path (:864) is untouched, and
the stale-but-recent path returns no refusal.

## 7. Chunk order

- Chunk 1 (record-only ring, nothing reads it): safe behaviour-wise, but it
  introduces the save-on-no-op change (m2) before any test covers it, and adds a
  new player_state key that `reload_persistence_test` (which saves every section)
  will now carry. Add the never-sent and no-op-save tests in chunk 1, not only
  chunk 5.
- Chunk 2 (stale-but-recent band and pre-filter, before the client re-stamp in
  chunk 4): with old below-stamping clients the stale-but-recent path neither
  improves gap 2/3 (M1) nor, for same-section keys, regresses them, because an
  older body's keys are skipped where a newer entry wrote them and applied only
  where unique. But B1's incompleteness hole exists from chunk 2 onward, so the
  completeness guard must land in chunk 2, not later. The gap 2 controller test
  placed in chunk 2 will not pass as specified (M1); reorder it to chunk 4 with
  the re-stamp, or respecify it.
- Chunks 3 to 6: fine once M1 and B1 are resolved.

## 8. Open questions and recommendations

- Q1 (player_state vs new column): sound. The migration constraint is real in
  this shared database, the size is bounded, and the never-sent proof is the one
  `lastSyncClientTs` already relies on. Agree.
- Q2 (per-key vs section-level records): per-key is right for gap 1 recovery, but
  the record must be of keys the merge landed (m2), must count deletions (m1), and
  must treat timedMessages and playerHealth as whole-section (M2).
- Q3 (ship client re-stamp with this, or server only): the "server only closes
  gap 2 for every client" premise is false (M1), so the choice is not between
  "gap 2 for all" and "gaps 2 and 3": it is between "neither gap 2 nor gap 3
  without the re-stamp" and "both with it". The recommendation to ship both
  together stands and is in fact required for either gap. Correct the framing.
- Q4 (window 60 s, size 4): the numbers are reasonable for the timing, but size 4
  is exactly what B1 exploits. Keep the numbers only with the oldest-retained
  completeness guard; the byte-cap test does not cover the completeness hole.
- Q5 (gap 1 residue as backlog): agree.

## What I checked

- games_controller.rb: `sync_state` (:833-905), `stale_sync_request?`
  (:2169-2179), `merge_last_write_wins_sections` (:2187-2278),
  `merge_grow_only_sections` (:2285-2308), the capture step (:913-938),
  SYNC_STATE_COLUMNS (:2116), SYNC_STALE_RESET_MS (:2122), the bootstrap
  `filtered` payload (:300-430), the sync answer (:883-904), `new_session`
  preserved_keys (:268-269).
- game.rb: merge_global_variables! (:801-839), replace_timed_messages!
  (:5136-5160), merge_phone_state! (:5198-5222), merge_mail_state! and
  mail_state_updates (:5431-5528), merge_npc_ink_variables! (:5105-5124),
  merge_npc_visibility! (:4981-4994), merge_npc_hostility! (:5005-5045),
  merge_player_health! (:5053-5062), SERVER_OWNED_GLOBAL_NAMES (:2275),
  server_credit_global_names (:267).
- state-sync.js: nextClientTs (:723-726), flush and the reservation (:836-928,
  esp. :851-882), `_sizeFlushBody` (:939-956), `_changesSinceInFlight`
  (:968-981), `_clearHiddenGuard` (:984-989), `_applyAnswer` (:1001-1030),
  `confirm` (:684-701), buildChanges and the section lists (:31-42, :564-669),
  KEEPALIVE_BODY_LIMIT and REQUEST_SOON_* (:6, :16-17).
- Source request: REVIEW_R3.md section "Net against base" (another session's
  data, read as a starting point, re-derived here).

Rules: UK English, no em or en dashes, no model names, no credential or SecGen
files read, no server run.
