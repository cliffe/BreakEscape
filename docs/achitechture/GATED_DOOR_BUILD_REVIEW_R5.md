# Gated-door server check: adversarial review, round 5 (final)

Scope: the R4-minors fold (`9d4258732`), reviewed read-only in the worktree, plus a last
whole-branch pass over `git diff fc4b4d8a5..9d4258732` on `build/hard-tailgate-plan`. R4 said
ship with two latent minors; `9d4258732` folds both and changes the sync contract for a refused
`currentRoom`, so this round checks that change end to end. Reviewed against
GATED_DOOR_SERVER_CHECK_PLAN.md (sections 3.3a, 7, 8), the build log, and R2 to R4.

## Verdict

SHIP.

A `currentRoom` that `may_sync_current_room?` rejects no longer rolls the batch back. The guarded
controller skips only the `currentRoom` write and its `credit_via_pass_on_sync!`, lists `currentRoom`
in `notSaved`, and returns 200 so the rest of the batch commits. The client confirms the refused room
so it is not re-sent until `window.currentPlayerRoom` changes. A refused room is never saved or
credited, the other sections commit exactly as before, Chunk F `player_reached_room?` is untouched by
this commit, and no honest player is refused (the room-load invariant R4 established is unchanged, as
`may_sync_current_room?` was not altered). The fixer's `ok:false`-once judgement is safe for every
caller of `syncConfirmed`/`sync()`: each either retries to success or ignores the boolean.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 1 (cosmetic, forge-only)
- Observations: 1

## What the fold changed, traced

### A refused room is never saved or credited

`merge_last_write_wins_sections` (`app/controllers/break_escape/games_controller.rb:2146-2176`): the
accept branch (`:2158-2164`) writes `currentRoom` and calls `credit_via_pass_on_sync!`; the else
branch (`:2165-2174`) does neither, it only appends `'currentRoom'` to `@not_saved`. So on a refusal
both the save and the viaPass credit are skipped. The acceptance predicate `may_sync_current_room?`
is unchanged, so the accept/refuse split is identical to R4; only the refuse action changed.

### The rest of the batch commits as before

The old refusal returned a string, which the caller turned into `refusal` and `raise
ActiveRecord::Rollback` (`:853-854`), dropping the whole batch and rendering 403 (`:882-883`). The
else branch now returns nothing special; the method falls through `globalVariables`, `npcInkVariables`,
`timedMessages`, `phoneState`, `mailState`, visibility/hostility/health and notes (`:2178-2234`) and
ends with `nil` (`:2235`). A `nil` return means no rollback, `@game.save!` runs (`:870`), and the
response is the 200 branch with `body[:notSaved] = @not_saved` (`:889-890`). `currentRoom` now behaves
exactly like the existing `phoneState`/`mailState` refusals (`:2192`, `:2199`), which already appended
to `@not_saved` without a rollback. Confirmed there is no other early string return on the
currentRoom path.

### The client confirms the refused room, so no forever-loop (SYNC SIZE)

`state-sync.js` `confirm()` (`:565-582`): the keyed-section loop (`:567-574`) skips any section in
`notSaved` (the re-send meaning). `currentRoom` is not a `KEYED_SECTION` (`:13`) nor a `WHOLE_SECTION`
(`:24`); it is confirmed by the explicit list at `:577` whenever `ack.currentRoom !== undefined`,
regardless of `notSaved`. The `ack` passed is the client's own `changes.ack` built in `buildChanges`
(`:489`, `ack.currentRoom = full.currentRoom`), not the server body, so a refused room is marked
confirmed to the room the client just sent. `buildChanges` then re-sends `currentRoom` only when
`full.currentRoom !== this.confirmed.currentRoom` (`:487`), so the same refused room is not re-sent;
a new room is sent only on an actual move. The delta baseline on reload is seeded from the server's
real saved room (`savedCurrentRoom`, `:130`), so there is no spurious re-send after a reload either.
The added node test (`test/js/state-sync.test.mjs`, "a notSaved currentRoom does not loop") asserts
exactly this: a global riding in the same batch is confirmed, nothing is re-sent, and a new room is
sent only when it changes. All 27 state-sync tests pass.

### Nothing else reads `notSaved` in a way that misbehaves

The only consumers of `notSaved`: `confirm()` (handled above), the once-per-section console log
(`:661-666`), and the `ok` computation `notSaved.length === 0 && !this._partsPending()` (`:679`).
For keyed sections the re-send semantics are unchanged. For `currentRoom` the only effect is that
`ok` is false for one run on a refusal (see judgement below).

### The `ok:false`-once judgement is safe for every caller

On a refusing run `ok` is false because `currentRoom` is in `notSaved` (`:679`), even though the room
is confirmed. The next run re-sends nothing (the room is confirmed, the player has not moved), so
`buildChanges` returns null and `ok` is true (`:649`). Traced every caller:

- `syncConfirmed` (`:694-707`): retries on `ok:false` (the error is null, not a 403), up to 6
  attempts with back-off, so a one-run false recovers on the next attempt. Honest players never hit
  a refusal (invariant), so they never pay even the one retry.
- `game-menu.js:296` (conclude/leave): calls `syncConfirmed()` default 6 attempts; recovers to
  `saved=true`. The only way `saved` stays false is a client that forges a fresh refused room on
  every attempt, i.e. a cheat, and even then "Leave anyway" is offered, no hard block.
- `objectives-manager.js` enter_room pre-flush (`:776`, `:799`) and `drainEnterRoomQueue` use
  `safeSyncOnce` (`:660-664`), which awaits `sync()` for ordering only and swallows the result. The
  "Sync Pending" badge (`:819-821`) fires on the completion POST's `transient||retryable`
  (`player_reached_room?`), never on the currentRoom sync boolean. A skipped currentRoom does not
  stall the queue: `player_reached_room?` passes on durable `unlockedRooms`/`npcRouteRooms`, and for
  an honest player the room is accepted and saved anyway.
- `format-guard.js:126` (`attempts:1`): the return is only raced against a 3 s timeout and ignored;
  a false result has no effect.
- The periodic timer (`:328`), `game-over-screen.js:175`, `biometric-samples.js:118` and other
  `sync()` callers ignore the boolean.

No honest player can see a stall, a pending badge or a failed conclude from this change.

### Chunk F unchanged

`9d4258732` does not touch `app/models/break_escape/game.rb`, so `player_reached_room?` and the
enter_room validation are byte-identical to what R2 to R4 reviewed.

## Whole-branch last pass (fc4b4d8a5..9d4258732)

R4 did the thorough whole-branch pass and found no blocker or major; the only delta since is this
fold, traced above. Re-checked the honest-player-never-refused bar against the fold: the acceptance
set (`may_sync_current_room?`) is unchanged, so the invariant that only server-accessible rooms can
be named by feet-detection still holds for every brief scenario, and the fold only softens the
consequence of a refusal from "drop the batch and 403" to "skip one field and keep going". Under
network delay an honest player is still never refused, and even a spurious refusal now loses nothing.
R4 MINOR 2 (the unrouted `Api::GamesController`) is closed by the header comment extension
(`api/games_controller.rb:3-11`); the controller stays unrouted, so it is not a live hole.

## Findings (round 5)

### MINOR 1 (cosmetic, forge-only) - the notSaved log calls a refused room "over a cap"

`state-sync.js:665`: the once-per-section `console.warn` reads `the server did not save currentRoom
(over a cap); resending it with each sync`. For `currentRoom` the cause is a guard refusal, not a
cap, and the client does not resend it. The message is a `console.warn` only, no UI, and fires only
for a client that forged a refused room (honest players never reach it). Cosmetic. Optional fix:
special-case the `currentRoom` wording, or drop it from this log. Not required to merge.

### Observation 1 - client/server currentRoom divergence after a forge is harmless

After a refusal the client holds the refused room as confirmed while the server kept its previous
room, so the two diverge. This is by design and self-heals: the next genuine move sends a new room
(`full !== confirmed`) which the server accepts and saves, and the baseline is re-seeded from the
server's real room on reload. Only a cheating client ever reaches this state. No change needed.

## What I checked

- The fold diff end to end: `games_controller.rb:2146-2176` accept/else split, `:2235` nil return,
  `:853-854`/`:882-890` rollback-vs-200 branches; `state-sync.js` `confirm()` (`:565-582`),
  `buildChanges` currentRoom (`:487-489`), `_syncOnce` ok/notSaved (`:661-679`), `syncConfirmed`
  (`:694-707`); `api/games_controller.rb:3-11` header.
- A refused room is never saved or credited: else branch skips both the write and
  `credit_via_pass_on_sync!`.
- Section constants: `currentRoom` is neither KEYED nor WHOLE, confirmed via the explicit list, so
  `notSaved` does not force a re-send of it.
- Every caller of `syncConfirmed`/`sync()`/`safeSyncOnce`: `game-menu.js`, `format-guard.js`,
  `objectives-manager.js` (enter_room pre-flush, drain, Sync Pending), `game-over-screen.js`,
  periodic timer, `biometric-samples.js`.
- Chunk F: `game.rb` not in the commit, so `player_reached_room?` is unchanged.
- Honest-player bar: `may_sync_current_room?` acceptance set unchanged from R4; invariant holds.
- Ran `test/js/state-sync.test.mjs`: 27 pass, 0 fail (includes the new no-loop test).
