# SIMS-3 review, round 3: server, sync and cheat resistance

Slice: the IT room and Neil (the still NPC who prints by command). Branch `build/ol-sims`, tip
`1665f412a` (SIMS-4 merged at `5118f584d`). Scope: the round-2 server minor (m1) and every R2 fix
that touches sync, in particular the new mirror global `neil_page_on_tray` (set by the
`object_revealed` mapping, cleared by the page's `onRead` and by a `game_loaded` mapping), the
exit `-> END` change and its conversation-state save, the in-story `~ neil_print_asked = true`,
and whether the SIMS-4 merge (the `job_called` VAR and choice in the same ink) changed any of it.

Read-only evidence: saved state of games 4326-4339 (pre-fix), the R2-fix proof games
4364/4385/4394/4396/4398/4410/4413 and the merged-build game 4456, read through
`rails runner` (script in scratch `officelife-sims/s3-review-r3-server/dump_states.rb`). Engine
paths: the scenario eventMapping handler `public/break_escape/js/systems/npc-manager.js:1442-1468`
(`setGlobal` and `completeTask`), the global broadcast
`public/break_escape/js/systems/npc-conversation-state.js:638-665`, the reveal-on-load path
`public/break_escape/js/core/rooms.js:3034-3055` (`isGlobalTrue` / `hideUntilReveal`), the
`game_loaded` emit `public/break_escape/js/core/game.js:2561-2566`, the start-room load and player
respawn `public/break_escape/js/core/game.js:2151-2249`, and the conversation-state save
`public/break_escape/js/systems/npc-conversation-state.js:40-175`. No live server used.

## Verdict

- Blockers: 0
- Majors: 0
- Minors: 3 (m1 the "came back empty" citation for 4394/4396 is contradicted by their own saved
  state; m2 the "eventMapping `setGlobal` calls `_worldChanged`" claim is wrong; m3 within a
  session the mirror is not cleared when another producer recycles the slot)

Counts: 0 blockers, 0 major, 3 minor.

## What was checked and confirmed

**`neil_page_on_tray` reaches the server, and tracks the tray within a session.** The
`object_revealed` mapping (`scenario.json.erb:608`, scoped `data.producerId === 'it_copier' &&
data.npcId === 'neil' && !data.cosmetic`, `onceOnly`) sets the mirror true and completes
`see_neils_page` in the same handler. The `setGlobal` block updates `gameState.globalVariables`,
broadcasts to the loaded inks and emits `global_variable_changed`; the paired `completeTask` does a
server round-trip that carries the whole `globalVariables`, so the mirror persists. Confirmed:
game 4364 (page on the tray, no reload) saved `neil_page_on_tray=true`, `it_out_a_shown=true`. The
take clears it: `it_out_a`'s `onRead.setVariable` (`scenario.json.erb:965`) sets the mirror false
and that reaches the server (game 4385: `neil_page_on_tray=false`, `it_out_a_shown=true`). Leila's
SIMS-5 prints cannot touch the mirror because the mapping requires `data.npcId === 'neil'`.

**The reload path never false-claims, and it holds because Neil's host is the start-room NPC.**
The mapping is on Amara, who lives in the start room `office` (`startRoom: "office"`,
`scenario.json.erb:4`). On every load the engine loads the start room and registers its NPCs during
`game.js` create, then emits `game_loaded` (`game.js:2561`), then respawns the player in the start
room (`game.js:2231-2249`, no `resumeSpawn` in this scenario). So Amara's `game_loaded` listener is
always live when `game_loaded` fires, even when the player reloaded standing at Neil in IT, and the
mirror is cleared to false client-side before the player can walk back and reopen Neil. The ready
line then reads false and gives the neutral "Have a look on the copier tray, pet. It'll be there if
it's come through.", which is true whether the tray re-revealed or came back empty. This only works
because the host is the start-room NPC; see m1 for the caveat a copying mission needs.

**Nothing grows.** `player_state` is 5.4 to 7.4 KB across every game read (4456, the merged build,
is 7114 bytes). `neil_page_on_tray` and `job_called` are each one bounded boolean.
`triggeredEvents` holds the same `onceOnly` keys as R2 (`object_revealed:*`,
`conversation_closed:neil`, the task keys), no per-tick growth.

**Cheat resistance holds to policy.** A forged `neil_page_on_tray=true` only changes which text
branch Neil speaks (ink-gated, best-effort by policy); it grants no item, because the page object
comes from the real reveal and take, not from the flag. A forged `neil_print_asked=true` lets the
`conversation_closed:neil` print mapping fire, which completes the optional `see_neils_page` task
only (plan 6.4). No secret, key or forged item is server-gated on either flag, so the server's hard
enforcement is not in scope here.

**Exit `-> END` and the conversation-state save are clean.** With the exit choice now ending the
story, the conversation-state manager saves variables only (not story progress) for an ended story
and restarts it fresh on the next open (`npc-conversation-state.js:48-56, 160-170`). That is the
intended "no stale farewell" behaviour, and the saved structure is a bounded per-NPC variables
snapshot, so it does not grow with reopens.

**The in-story `~ neil_print_asked = true` is a redundant same-value write.** The ask branch
carries both `#set_global:neil_print_asked:true` (server write via the tag path) and
`~ neil_print_asked = true` (drops the choice inside the running chat, m3 fix). Both write `true`,
so they cannot disagree; game 4335/4410 saved `neil_print_asked=true` cleanly. The R2 server review
already confirmed this global syncs without a stale `false` push back.

**The SIMS-4 merge did not change SIMS-3 sync.** `neil.ink` now declares three VARs
(`neil_print_asked`, `neil_page_on_tray`, `job_called`), all present in the compiled `neil.json`
and in the scenario `globalVariables`. `job_called` follows the same `#set_global` plus `~` pattern
as `neil_print_asked` and is an independent bounded boolean. Merged-build game 4456 saved all of
them false at start, `player_state` bounded. No new sync surface beyond one more boolean.

## Findings

### m1 (minor) - the "came back empty" citation for games 4394/4396 is contradicted by their own saved state
Files: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:371` and `:542`;
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:196` and `:326`.

The reconciled framing says reload is nondeterministic and cites "R2 games 4394/4396 came back
empty" as the empty branch and game 4328 as the revealed branch, the revealed branch being the one
where `it_out_a_shown=true` persisted. But the saved state of 4394 and 4396 both have
`it_out_a_shown=true` (and `neil_page_on_tray=true`). By the doc's own rule those two games are in
the **revealed** branch: `it_out_a` re-reveals on load because `revealOnGlobal: "it_out_a_shown"`
is true (`rooms.js:3034-3055`), so the page comes back on the tray, not empty. The R2 server review
raised exactly this mislabelling (its m1); the fix reconciled the wording but assigned 4394/4396 to
the wrong branch, so m1 is not fully closed. Worse, for Neil's single page the reveal and the
`see_neils_page` completion fire from the **same** `object_revealed` mapping, so the persisting
sync almost always lands with the reveal: the only games that came back genuinely empty are the
pre-fix R1 games (4329) where the reload beat the async `completeTask` round-trip.

Impact: harmless at runtime (the neutral ready line covers both branches), but a mission copying
the pattern is told these games prove the empty branch when their state proves the revealed one.
Suggested fix: re-cite the empty branch from a game whose saved state actually has
`it_out_a_shown=false` after the reload (R1 4329 is one), and note that because Neil's reveal is
bound to the `see_neils_page` completion the empty branch is rare for this specific page.

### m2 (minor) - the "eventMapping `setGlobal` calls `_worldChanged`" recommendation is inaccurate
Files: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:371`, `:393`, `:542`;
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:326`.

Four doc sites tell a copying mission to make a reveal or marker survive a reload by setting it
"through an eventMapping `setGlobal` (which calls `_worldChanged`)". The eventMapping `setGlobal`
path does not call `_worldChanged`: `npc-manager.js:1442-1455` writes `gameState.globalVariables`,
calls `broadcastGlobalVariableChange` (which only updates the in-memory inks,
`npc-conversation-state.js:638-665`) and emits `global_variable_changed`. `_worldChanged` is a
needs-system method (`npc-needs.js:1191`), not reached from here. The empirical proof is in the
saved state: `game_loaded`'s bare `setGlobal: { neil_page_on_tray: false }` is **not** persisted,
so 4394/4396/4398 keep `neil_page_on_tray=true` in the DB; it works only because `game_loaded`
re-clears client-side on every load. `neil_page_on_tray=true` persists at reveal only because the
same mapping also fires `completeTask: see_neils_page`, whose round-trip carries the globals.

Impact: a mission that follows the advice with a bare `setGlobal` eventMapping (no task, no other
sync) will find the global not persisted, the same failure the advice is meant to avoid. Suggested
fix: reword to "an eventMapping that also completes a task (or otherwise triggers a delta sync)",
and drop the "(which calls `_worldChanged`)" parenthetical; note that `game_loaded`'s clear here is
deliberately client-only and relies on the host being the start-room NPC so the listener is always
registered before `game_loaded` fires.

### m3 (minor, not reachable within SIMS-3) - within a session the mirror is not cleared when another producer recycles the slot
Files: `scenarios/test_needs_sims/scenario.json.erb:965` (`onRead`), `:608` (the set mapping).

Within one session the mirror only goes false on the player's take (`onRead`) or on reload
(`game_loaded`). If the IT copier tray fills and a later print by another producer recycles
`it_out_a` (the needs system's `_recyclable` / stow path, which resets the slot's own global but
does not fire `onRead`), the page on the tray is replaced while `neil_page_on_tray` stays true, so
Neil would say "It's on the copier tray, pet. Help yourself." to a page that is no longer his. This
cannot happen in SIMS-3 alone (Neil prints one page and nothing else prints to the IT copier), and
the combined showcase keeps the tray below six slots (plan 420), so it is a forward-looking caveat
for SIMS-5/SIMS-6. Suggested fix: either keep the neutral wording on the on-tray branch too, or
clear the mirror when the slot is recycled.

## Notes

- Read-only throughout; no game state written by this review.
- Pre-fix games 4326-4339 predate the mirror global, so they read `neil_page_on_tray=nil`; the
  mirror evidence is in 4364/4385/4394/4396/4398. Game 4410 saved before the scenario's globals
  were seeded (all nil, 2588 bytes) and is not used for the global checks.
