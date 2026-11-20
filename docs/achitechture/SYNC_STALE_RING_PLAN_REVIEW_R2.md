# Sync stale-but-recent ring: plan review round 2

Verdict: READY TO BUILD.

Counts: 0 blockers, 0 majors, 4 minors.

Target: `docs/achitechture/SYNC_STALE_RING_PLAN.md` on `build/hard-sync-ring-plan`
(worktree `p-hard-sync-ring`, tip 8bbc58833, cut from integration train 47
b83696932). Review only: no code or plan edited, no server run. Every claim below
was traced to the code in this worktree. Read the plan fresh as a standalone
document, then checked it against the server, the model merges and the client.

## Every round 1 finding is closed in the design

Not reworded. Each is a real change to the mechanism:

- B1 (fixed ring of 4, incomplete skip set): closed. Section 5 adds the
  completeness guard (the stale-but-recent path runs only when `D.ts` is at or
  above the oldest retained ring entry's `ts`, else it falls back to today's
  whole-skip). The ring is raised to 8 with the burst arithmetic in section 5
  and Q4, and the guard is tested (chunk 2, section 10, "a burst of more than
  eight writes ... falls back to whole-skip"). This is the guard R1 demanded, and
  I re-derived its soundness below.
- M1 ("server ring alone closes gap 2 for every client" false): closed. Section 8
  now opens "The server ring alone closes neither gap 2 nor gap 3", traces both
  gaps under the old below-stamp regime to show the ts order is inverted, and Q3
  is reframed to "neither gap without the re-stamp, both with it". Section 3
  labels its stamps as "today's below-stamp regime, the bug the fix removes" and
  states the controller tests drive the re-stamped order.
- M2 (timedMessages is whole-replace, not keyed): closed. Section 5's table and
  its "two whole-section claims matter" paragraph record timedMessages and
  playerHealth as whole-section `true`, with the partial-hash wipe spelled out.
  Q2 updated to match.
- m1 (deletions as claims): closed. Section 5 "Deletions are claims" records a
  deleted global by its key name, with a test (section 10).
- m2 (no-op resend now saves): closed. Section 4's "Record only what the merge
  changed" appends nothing when nothing changed, and section 10 tests the
  no-op-no-UPDATE path.
- m3 (new client against old server): closed. Section 8's last paragraph now
  states it is worse in the D-first order but unreachable on a single server, and
  Q3's diagram says the same. Corrected, not dropped.
- m4 (equal-stamp cross-tab, strict `>`): closed. Section 5's skip set uses `>=`
  and explains the same-ms cross-tab choice.
- The two R1 nits (snapshot collapse over-skip, live-proof wording): addressed in
  section 4 ("Collapsing a section to `true` is conservative") and section 10
  ("Driving the real re-stamp, not crafted stamps").

## The completeness guard is sound (brief question 1)

I traced the guard against the ring's append/expiry (section 4) and the stale
bands (section 5).

- Own writes. The request's entry is appended only after its merges run, so it is
  never in its own skip set. A request cannot skip its own writes.
- Evicted newer write undone? No. If a write W with `W.ts > D.ts` had been
  evicted while the guard holds (`D.ts >= oldest.ts`), then W is newer than the
  oldest retained entry, so size-eviction (keep newest 8) would drop the oldest
  before W, and window-eviction cannot reach W because `W.ts > D.ts >= oldest.ts
  >= max - 60s`. So guard-holding implies no newer write is missing, and an older
  stale-but-recent request can never overwrite an evicted newer one. When the
  guard fails it falls back to whole-skip, which is also safe.
- Ring entirely expired / only old entries. The skip set is `entry.ts >= D.ts`;
  entries older than D are not skipped, which is correct (D is newer, it wins).
  If every retained entry is older than D, the skip set is empty and D applies
  all its keys, which is safe because any newer write would still be retained
  (above argument).
- Format 409 rollback. `sync_state` raises `ActiveRecord::Rollback` on a format
  refusal before any merge (games_controller.rb:848-851), so neither
  `lastSyncClientTs` nor the ring is written. The ring change adds nothing to that
  path. Confirmed.
- 10-minute reset. A request over ten minutes below stored takes the fresh reset
  branch (stale_sync_request? games_controller.rb:2175-2178) and never reaches the
  skip set, so a reset is never a stale-but-recent merge against a stale window,
  as section 7 states.
- Two tabs sharing one game. Everything runs under the one `Game.lock`
  transaction (games_controller.rb:840-841), so two tabs' ring reads and appends
  serialise; reordering is only across the network before the lock, which is what
  the ring is for. A same-ms cross-tab entry is skipped by the `>=` rule. A
  skewed-clock cross-tab write with a lower `ts` than its real-time-newer
  counterpart falls back to whole-skip under the guard (the lower-ts tab's request
  is below the higher-tab's retained entries), so no invariant break; this is the
  pre-existing single-scalar limitation, no worse than today.

The empty-ring branch is the one gap in the statement (m1 below), but it is safe
either way.

## The guard never weakens gaps 2 and 3 (brief question 2)

Traced with the shipped re-stamp (D stamped above H).

- Gap 2. D (health 70, higher ts) lands first, fresh, writes 70, records
  `playerHealth: true`. H (health 100, lower ts) lands second. If the guard holds,
  H is stale-but-recent and its `playerHealth` is in the skip set (D's entry has
  ts >= H.ts), so it is dropped and health stays 70. If the guard fails, H is
  whole-skipped, so its `playerHealth` never lands and health stays 70. Both
  branches keep 70.
- Gap 3. D (g 7, higher ts) fresh first, writes 7, records `globalVariables:[g]`.
  H (g 5) second: stale-but-recent skips `g`, or fall-back whole-skips H. Either
  way g stays 7.

So the guard governs only gap 1's shrink (whether H's unique keys are recovered),
never the protection of gaps 2 and 3, exactly as section 5 claims.

## Ring size, byte ceiling, fixed-size, never sent, inside the lock (question 3)

- Fixed size. `SYNC_RING_MAX = 8`, `SYNC_RING_WINDOW_MS = 60_000`,
  `SYNC_RING_KEYS_PER_ENTRY = 32`. Normalisation steps 2 and 3 run on every
  append and never drop the just-appended entry below the max, so the ring is
  bounded at eight entries and stays non-empty once anything is recorded. The
  size-8 arithmetic (section 5, Q4) is reasonable: a KO burst (requestSoon
  REQUEST_SOON_DEBOUNCE_MS 750 / REQUEST_SOON_MAX_MS 1500, state-sync.js:16-17)
  plus a periodic sync plus D is about six entries ahead of a 3 s in-flight H, so
  eight keeps the guard holding where four would fall back.
- Byte ceiling. Eight entries of at most 32 short key names plus a few section
  names and a `ts` is about 8 KB of jsonb. Bounded regardless of session length.
  The byte-cap test (section 10) is the right pin. The delta-sync rule is met:
  the ring holds no values, only stamps and key names, so it cannot become a
  second copy of player_state, and it does not grow and is not re-sent.
- Never sent. The bootstrap builds `filtered` key by explicit key, with
  `lastSyncClientTs` and `syncWrites` both absent; the sync answer is built from
  fixed fields (sync_state :883-904). The only whole-slice copy is `new_session`'s
  `preserved_keys` (games_controller.rb:268-269), which is `%w[vm_set_id vm_ips
  flags_by_vm standalone_flags]` and drops `syncWrites`. The two pinning tests
  (section 4) are the right guard.
- Inside the lock. The ring read, guard, skip-set build, merges and append all
  sit inside the one `Game.transaction`/`Game.lock` (games_controller.rb:840-880),
  as section 6 states.

## The section merge table (question 4)

Each row traced against the model merges and the controller.

- globalVariables: per key, `null` deletes (game.rb:833-837). Deletions recorded
  as key claims. Server-owned `se_captures` and read-only globals (imports, worn,
  `server_credit_global_names`) are dropped inside the merge (game.rb:806-831)
  regardless of the ring; the revoked-cards key is a grow-only union, safe to
  record as a key. Correct.
- npcInkVariables (game.rb:5105-5124), npcVisibility (game.rb:4981-4994): per id,
  whole-update size cap returns without writing, so a cap-rejected update records
  nothing. Correct.
- npcHostility (game.rb:5005-): per id, a KO is never undone by the merge
  (game.rb:5020). Correct.
- mailState (game.rb:5431-), phoneState (game.rb:5198-): per flattened key,
  notSaved over a cap (games_controller.rb:2232-2248). A notSaved key is not
  recorded. Correct, with the pre-filter caveat in m3 below.
- notes: per id in the controller (games_controller.rb:2266-2276). Correct.
- playerHealth (game.rb:5053-5062): whole section `true`, only when it landed
  (out-of-range values are rejected whole). Correct.
- timedMessages (game.rb:5136): whole section replaced, recorded `true` not per
  key; the partial-hash wipe is correctly avoided. Correct.
- currentRoom (games_controller.rb:2188-2218): whole string with
  `may_sync_current_room?` acceptance, `credit_via_pass_on_sync!` and the notSaved
  refusal at :2216. Recorded `true` only when accepted and written, never on a
  notSaved refusal. Correct.
- triggeredEvents, scenarioClock, commandBoardLog, biometricSamples,
  scenarioBriefShown: grow-only, never recorded. The plan correctly notes the
  client sends triggeredEvents in `KEYED_SECTIONS` (state-sync.js:31) while the
  server treats it grow-only, and classifies by the server merge. Correct.

## Record only changed keys (question 5)

Implementable. `merge_global_variables!` mutates `player_state['globalVariables']`
in place (game.rb:802, 836), so the recorder must snapshot the stored value before
the merge (or mirror the merge's accept/drop test per key) to record only keys the
merge changed; both are feasible inside the lock. The whole-section merges
(playerHealth, timedMessages) and per-id merges return enough to compare before
and after. The no-op resend path: when the merge changes nothing, no entry is
appended, player_state is not dirtied by the ring, and `@game.save! ... if
@game.changed?` (games_controller.rb:880) issues no UPDATE. A fresh request that
only moves `lastSyncClientTs` already dirties player_state today, so the ring adds
no new save there. Consistent with the reload_persistence and capture_proofs
counters.

## The client re-stamp (question 6)

The re-stamp draws the reduced flush body at a fresh `nextClientTs`
(state-sync.js:723-726), which is `max(Date.now(), last + 1)` and so strictly
above every in-flight flush (each advanced `lastClientTs` when it drew its stamp)
and above `stored` for its own page. So the reduced body is never wrongly judged
stale and carries the newest content, so "fresh" is correct. With D above H, ts
order matches content order; H-first makes D fresh, D-first makes H
stale-but-recent (ring merges H's unique keys, skips what D wrote). Safe for a
slow, reordered or offline player: no new refusal, a stale answer is a resend
(state-sync.js), and anything resent is unchanged or newer. The `_applyAnswer`,
`confirm`, notSaved, mailTrimmed and hidden-guard paths are untouched, as section
8 states. See m4 for a line-precision point on where the old stamping lives.

## Tests, chunk order, questions (question 7)

The test list covers the guard (burst fall-back), the whole-section claims, the
deletion claim, the no-op-no-UPDATE path, the never-sent pins, the byte cap, and
the three gaps under the re-stamped order, with the controller gap tests placed in
chunk 4 with the client change (not chunk 2), which resolves R1's test-placement
note. The live browser proof drives the real re-stamp on an assigned port, never
:3000. Chunk order is sound: chunk 1 record-only with its save-path tests, chunk 2
the guard with the read path it protects, chunk 4 the client re-stamp with the gap
tests. Q1 through Q5 are answered consistently with the body.

## Findings (4 minors)

### m1 (minor). The empty-ring guard branch is undefined

Where: plan section 5, "the stale-but-recent path runs only when `D.ts` is at or
above the oldest retained ring entry's `ts`".

When the ring holds no entries there is no "oldest retained entry", so the guard
expression is undefined and the implementer must choose. Both choices are safe: an
empty ring can only occur before the first last-write-wins write is recorded
(normalisation never drops the just-appended entry and eviction always leaves at
least one), so there is no unrecorded newer write to protect, and merging against
an empty skip set cannot put an older value over a newer one. Falling back is also
safe but forgoes gap-1 recovery. The plan should state the empty-ring branch
explicitly (recommend: merge with an empty skip set, so a reduced body that chases
the very first flush still recovers its unique keys), so the implementer does not
pick the fall-back by reflex and quietly lose the first-flush recovery. Safe
either way, hence minor.

### m2 (minor). A ten-minute reset leaves the ring stuck on pre-reset stamps

Where: plan section 4 (append/expiry) and section 7 (the reset paragraph).

`stale_sync_request?` takes the fresh reset branch when `stored - client_ts >
SYNC_STALE_RESET_MS` and stores the lower `client_ts` (games_controller.rb:2175-
2178). This branch is reachable: `lastClientTs` starts at 0 on a fresh page and
`nextClientTs` floors at `Date.now()` (state-sync.js:304, 723-724), so a system
clock set back more than ten minutes between a reload's old and new page (the case
the nextClientTs comment at :718-721 describes) lands a request far below stored.
After such a reset, `stored` drops to the low value but the ring still holds the
pre-reset high-ts entries, which remain the largest `ts` present. Every later
low-ts append is then immediately dropped by normalisation step 2 (more than 60 s
below the lingering max), so the ring records nothing new and the oldest retained
entry stays above every new request, so the completeness guard always fails and
the stale-but-recent merge never engages for the rest of the session. The invariant
is not broken (the guard falls back to today's safe whole-skip), but the fix goes
dormant after a backward-clock reset. Recommend clearing `syncWrites` (or dropping
entries with `ts > client_ts`) when the reset branch fires, and a test for it.
Rare and safe, hence minor.

### m3 (minor). The mailState and phoneState pre-filter crosses a nesting boundary

Where: plan section 5, "the stale-but-recent path removes from the incoming params
any key a newer entry claimed", against the section-5 table rows that record
mailState and phoneState "per flattened key".

For globalVariables the recorded claim keys are the top-level params keys, so
dropping a claimed key from params is direct. For mailState and phoneState the
claim keys are the flattened paths (`mailboxes.<box>.<msg>`, `threads.<key>`,
`jobs`, ... built by `mail_state_updates`, game.rb:5435), while
`params[:mailState]` and `params[:phoneState]` arrive nested
(games_controller.rb:2239, 2232). The plan does not say the pre-filter must flatten
the incoming params, drop the claimed flattened keys and re-nest (or filter at the
`mail_state_updates` level before the merge consumes it). A naive implementation
that treats mailState as one top-level params key would under-filter and let an
older mail or phone key overwrite a newer one, which is the invariant. The design
is consistent (record flattened, filter flattened); the gap is that the "how" for
nested sections is unstated and is the one place a wrong implementation would break
the invariant rather than just degrade. Worth one explicit line. Minor.

### m4 (minor). The re-stamp line references miss where the old stamping lives

Where: plan section 8, which cites the `_changesSinceInFlight` path at
state-sync.js:875-881 and the reservation at :853-855.

The actual `oldest.clientTs - 1` stamping is at state-sync.js:971, inside
`_changesSinceInFlight`, with a `if (clientTs <= oldest.prevTs) return null` guard
at :972 that suppresses the reduced body when there is no slot below the oldest
flush. Removing only the reservation at :853-855 and re-stamping in the caller is
not enough: the :971 stamping must change to a fresh stamp above, and the :972
null-return must be neutralised, or a legitimate reduced body is still suppressed
when `oldest.clientTs - 1 <= oldest.prevTs` even though a valid stamp above exists.
The plan's intent is clear, but it should name :971-972 so the implementer updates
the suppression path too. Minor, precision only.

## What I checked

- games_controller.rb: `sync_state` (:833-905), the format rollback (:848-851),
  `stale_sync_request?` (:2169-2179), `merge_last_write_wins_sections` (:2187-2278)
  including currentRoom acceptance/credit/notSaved (:2199-2217) and mailState
  notSaved/trimmed (:2232-2248), `merge_grow_only_sections` (:2285-),
  `apply_capture_sync_step` (:913-), `SYNC_STATE_COLUMNS` (:2116),
  `SYNC_STALE_RESET_MS` (:2122), the sync answer (:883-904), `new_session`
  preserved_keys (:268-269).
- game.rb: merge_global_variables! (:801-839), merge_player_health! (:5053-5062),
  merge_npc_ink_variables! (:5105-5124), replace_timed_messages! (:5136-),
  merge_npc_visibility! (:4981-4994), merge_npc_hostility! (:5005-),
  merge_mail_state! and mail_state_updates (:5431-), SERVER_OWNED_GLOBAL_NAMES
  (:2275), server_credit_global_names (:267), may_sync_current_room? and
  credit_via_pass_on_sync! (:415, :492).
- state-sync.js: nextClientTs (:723-726), lastClientTs init (:304), flush and the
  reservation (:836-928, esp. :851-882), `_sizeFlushBody` (:939-956),
  `_changesSinceInFlight` (:968-981), KEYED_SECTIONS / WHOLE_SECTIONS (:31, :42),
  KEEPALIVE_BODY_LIMIT and REQUEST_SOON_* (:6, :16-17).
- The round 1 review (SYNC_STALE_RING_PLAN_REVIEW_R1.md), to confirm each finding
  is closed in the design rather than reworded.

Rules: UK English, no em or en dashes, no model names, no credential or SecGen
files read, no server run, no db commands, no full suites.
