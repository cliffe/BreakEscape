# Handover: OPS_CRACKING_PLAN.md (S7), planner

Status: plan file NOT started. Reading done, then the run stopped: a safety classifier cut a turn
while the planner was reading the keyring code, and context passed 150k. A fresh planner continues
from this note. Not committed.

## Done (read and verified in code)

- Brief, outline S7, digests D2, D3, D4 (sections 0 to 4), D5, D5b.
- `password-guesser` scene and model, read in full:
  `public/break_escape/js/minigames/password-guesser/password-guesser-model.js` (339 lines),
  `password-guesser-minigame.js` (258 lines). Every row's outcome (`struck`, `opens`, `missing`,
  `holds`) is authored in the config and decided in the browser. `landedGlobal` is written on the
  client through `writeGlobal` and `stateSync.sync()` (`minigame.js:227-237`); no server check.
  A pattern-slot row is built only when `se_intel_<factId>` is true (`model.js:115-129`), and
  `slotGuess` (`model.js:101-104`) fills the template. It is a `SocialOverlayScene` launched by
  the episode runner; `scripts/validate_social/awareness.rb:1298` pins the shape of
  `awarenessEpisode.guess`.
- `habits.password`: the digest's "no reader" holds for runtime only. There is no reader on the
  server or the client. It is read at authoring time by `scripts/validate_npc_habits.rb:253-298`
  (`check_password`) and `:565-598` (`password_effects`), by `scripts/generate_dungeon_graph.rb:427-450`
  (edges for `reused` and backed `guessable`), and by `lib/break_escape/npc_habits/clues.rb`
  (`backing` `:427-497`, `parts_all_sourced?` `:500-513`, `reuse_homes` `:516-521`). The clues.rb
  header (`:9-13`) says it is never used by the server. Allowed values: `npc_habits.rb:24`.
  `passwordPattern` is a parameter (`npc_habits.rb:29`, `:55-57`). Neither ships to the browser:
  `SHIPPED_HABIT_KEYS = %w[screen print]` allow list, `game.rb:7335-7345`.
- Keyring: `lib/break_escape/credential_model.rb:21-27` already reserves kind `hash` with
  `built: false` ("phase 3"). The validator refuses kinds that are not built. `PROOF_KINDS` is at
  `:36`, `MAX_ENTRIES` 64 at `:39`. `credential_keyring.rb:21-36` handles proofs.
  `implicit_keyring_entries` (password per captured account, `:263-285`) is the path a cracked
  account should go through.

## Leaning decisions (for the fresh planner to check and write up)

1. Build a new minigame beside `password-guesser` and leave the guesser alone. The guesser's
   contract has the browser hold each outcome, and the awareness lint pins its config. Reuse its
   row vocabulary, CSS classes and `slotGuess`/`textFor` helpers from the model.
2. The server decides the crack. A new route (for example `POST /crack`) takes a hash record id and
   the candidate set the player built (fact ids only, never words). The server checks that the
   hash is held, that each fact is held, and the NPC's `password` habit, then returns a yield or a
   reason. The browser never receives `creds.password`.
3. Hash record: a server-only top-level map (as `credentials` is), with an account NPC id, a `salted`
   flag and a source (a share file from N4, or an S5a dump). The token shown to the player is an
   invented, seeded string. Using the reserved `hash` keyring kind is one option; another is to
   grant the existing implicit password entry. Pick one and justify it.
4. Effort without a server clock (D4 3.3: none exists): count crack runs or attempts on the server,
   with `salted` costing more runs. Put game minutes in Open questions.
5. What failing teaches: a `strong` habit never yields, whatever the facts; a `guessable` one yields
   only once the facts its pattern needs are held, and a fail names how many missing facts there
   are, not which. A `reused` one yields from a secret found elsewhere.

## Open (not yet done)

- Write the whole plan (sections 1 to 15 of brief section 7), headings first, then Edit section
  by section.
- Still to read: `credential_keyring.rb:250-400` (implicit entries and registry builders),
  `check_credentials` (`scripts/validate_scenario.rb:7304`), the N4 share file shape (D1), and
  S5a's dump source (ask the privilege planner or the orchestrator).
- Cross-plan requests to raise: S5a (dump effect shape and admin check), S9 (log rows: hash
  obtained, crack run, crack yield), S1 or N4 (a hash file on a share), and the keyring kind
  decision with S3 and S5b.

## Gotchas

- The classifier stopped a turn during code reading. Keep the plan abstract: invented tokens, no
  real hash formats, no tool names, no procedure. Memory note: retry on opus48 first if it stops
  again.
- Files touched: this note only.
