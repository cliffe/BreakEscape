# Handover: office life slice 15, voiced chatter and scripted exchanges (2026-11-06)

**Status: code, server change, validator, schema, showcase, unit tests and dialogue review are done and
committed. Live proof, the two regressions and most docs are left (below).** Plan: `OFFICE_LIFE_PLAN.md`
section 11. The user approved this session changing the server TTS code (limited to 11.3).

## Done (commits on main, in order; look them up with `git log --oneline --grep "slice 15"` after a rebase)

- c6288e3be server (shared, approved): `ScenarioBarkValidator.bark_texts` reads the NPC's `chatter` pools
  (arrays or `{lines}`); new `validate_shared(scenario, text)` and `chatter_texts`; `games_controller#tts`
  tries `shared_chatter_line?` (voiced NPC + `validate_shared`) in both the storyPath and the voice-only
  branch; `TtsExpectedLines#requestable_text?` accepts shared lines; `TtsLineExtractor.new(..., chatter:)`
  (nil reads the scenario's `ttsPregenerateChatter`) adds chatter entries per voiced NPC only when opted in,
  while `keys` (read by `tts:wasted`) always include them. Tests in `scenario_bark_validator_test.rb`,
  `tts_controller_test.rb` (4), `tts_cache_pruner_test.rb` (2, fixture gains NPC and scenario chatter),
  `ink_line_walker_test.rb` (extractor opt-in). Relevant Rails files: 116 runs, 0 failures.
- c4949a517 engine:
  - `npc-needs.js`: `DEFAULT_CHATTER` removed; `PICTURE_CHATTER` (topic -> icon names) and `pictureIcons`; `chatterPool` has no built-in lines and returns `pictures` (false when the scenario sets `"chatter": false`); `bagOrder`, `_bagNext` (seeded per seed/NPC/topic/round, a refill never starts with the last line), `_cooldownMs` (`chatterCooldownMin`, default `CHATTER_COOLDOWN_MIN` 5), `_pickBark` (bark if lines, off cooldown and the lock is free; else picture), `_speak` and the global speech lock `_speechUntil`.
  - Exchanges: `_findExchange` (lower id's list first, `with` id or `group:`, `requireGlobal`, not heard, all speakers in the pair, `{pending}` while the story loads), `_audience`, `_startExchange` (extends the uses by the knot, capped at `EXCHANGE_MAX_MS` 60 s), `_finishExchange` (`setGlobal heard_<knot>`, log `exchange_heard`, event `npc_exchange_heard:<knot>`).
  - `_tickChats` order: exchange, then bark, then picture. Exchange lines emit `npc_chatted` with `exchange`; pictures emit with `line: null, picture`. `_grumble` uses the bag, cooldown and lock (picture `avoid` otherwise). `_talking` returns `picture` and `knot`.
  - Adapter: `speak`, `exchangeLines`, `setGlobal` (to `window.npcChatterVoice`), and `playerHears` is now false in a dark room (the plan's "lit").
  - New `npc-needs-chatter.js` (dynamic import in `core/game.js`, so no harness copy lists changed): `NpcChatterVoice` (separate `inkjs.Story` per exchange run from `npcManager.storyCache` or `/ink?npc=`, prefix -> id or displayName like the server, voice queue per line through a per-NPC `TTSManager`, only in the player's room, muted when `npcBarkSystem.soundEnabled === false`, a `log` of every say for live proof).
  - `npc-world-bubbles.js` draws picture chat (`icons/npc-<name>.png`, loaded on first use).
  - Existing tests adapted (pairing, avoidance, queues).
  - Showcase: per-NPC `cooler` and `grumble` pools, `exchange_rosa_rota` in `sanjay.ink` (`exchanges` on Sanjay, with rosa), `exchange_tom_parcel` in `amara.ink` (on Amara, with tom, `requireGlobal: amara_opened_parcel`), globals `heard_exchange_*`, tasks `hear_rota_exchange` and `hear_parcel_exchange`.
- d6dc1f5b1 validator (`check_exchanges`, `{ }` in chatter is an error, picture-only warning), schema
  (`exchanges`, `chatterCooldownMin`, `ttsPregenerateChatter`), known fields in `validate_scenario.rb`,
  `test/js/npc-voiced-chatter.test.mjs` (12 tests).
- 5222d2d3f social pairing validator test expects the picture-only warning.
- da3387e92 dialogue review fixes: Tom's parcel line says "on the floor" (the player drops it on the floor,
  not by a door); Grace's cooler line is to one person; Marek's voice Charon -> Orus (he shared Tom's voice;
  no sims audio is cached, so nothing to regenerate).
- This commit: tts-audio skill paragraph ("How it works"), the lab log line (server change notice), this file.
- `bin/test-js`: 396 files, all pass (after 5222d2d3f).

## Choices made without asking (put them in the plan 11 Built line)

1. The extractor opt-in is the scenario flag `ttsPregenerateChatter` (plus a `chatter:` keyword); `keys`
   always include chatter, so `tts:wasted` never reports chatter clips as unrequested.
2. A bag is per NPC and topic over the pool that NPC speaks (shared plus own lines). It refills when empty,
   and the refill never starts with the line just said. Bags are in memory only.
3. The cooldown starts on a spoken line; pictures never start or wait for it. A grumble on cooldown, or with
   the lock busy, shows the `avoid` picture.
4. The speech lock is global, across rooms. Bark and exchange turns wait for it ("queue"); a turn that
   waits past the overlap ends the chat as before. `npc-needs-chatter.js` keeps its own audio queue as well,
   because real clips can outrun the bubble. A queued line older than 8 s is dropped.
5. An exchange plays only if every line's speaker is one of the pair; a `group:` partner is matched by
   `needsCompany.groups`. The audience is checked on every turn, so the player can walk up mid-meeting.
   A meeting interrupted mid-exchange leaves it unplayed. After the exchange the same meeting carries on
   with barks, then pictures.
6. Exchange bubbles use `exchangeLineMs` (as `bubbleMs`, capped at 6 s).
7. Picture icons from the existing set: coffee `caffeine/social/work`, cooler `thirst/social/work`, greet
   `social`, grumble `avoid` (no weather icon exists; no new art).
8. Distance volume sets the element volume (0.35 to 1) after play; with Web Audio routing Chrome may
   ignore it. Not verifiable on keyless `:3001`.
9. `playerHears` now also needs the NPC's room lit (`roomLevel >= 0.5`, as `roomIsDark`).

## Left (exact next steps)

1. **Live proof**, headless on :3001. Screenshots go in the scratchpad `s15/`. Steps:
   - `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims` (use the `:3001` URL), then `session-start.sh --headless`, then `bootstrap {"tutorial":"decline","resume":"new"}`.
   - Open the kitchen and lounge doors. Read the Activity Board (`moveToNear`/`interact`; close its overlay with its Close button). Sanjay and Rosa go to the water cooler (kitchen).
   - Stand within 160 px of the cooler with a clear line. Expect five bubbles alternating sanjay/rosa, `npc_chatted` events with `exchange: exchange_rosa_rota`, then `npc_exchange_heard:exchange_rosa_rota`, global `heard_exchange_rosa_rota` true and task `hear_rota_exchange` complete. Then one bark each, then pictures.
   - `window.npcChatterVoice.log` lists every say. The network log should show `POST /break_escape/games/<id>/tts` with `npc_id` sanjay/rosa and the stripped text, each a 503 (keyless).
   - Reload, re-bootstrap with `resume` (not new), and drive another meeting. No exchange should play, only barks or pictures.
   - Optionally the parcel exchange: drop the parcel, wait for Amara to open it, then read the Activity Board for the coffee queue.
   - Make a contact sheet of nearest-neighbour crops and check every caption against its frame.
   - Freeze the clock (`npcNeedsSystem.manualClock = true`) for bubble shots.
   - The s14 driver `scratchpad/s14/drive.py` is a good base.
2. **Regressions:** `test_needs_leash` (`scratchpad/leash.py`), then the lab (`scratchpad/lab.py`, Haiku).
   - The lab must score 100.
   - The lab has no chatter pools or exchanges, so its barks must be unchanged: compare with game 693.
3. **Docs:**
   - The plan 11 Built line (commits, games, the choices above).
   - A slice 15 row in `OFFICE_LIFE_HANDOVER_SESSION.md`.
   - `NPC_NEEDS_SYSTEM.md`: 5.6 chatter (bag, cooldown, lock, pictures, exchanges), events `npc_exchange_heard`, `npc_chatted.picture/exchange`, log `exchange_started/heard`, and the fields `exchanges`, `chatterCooldownMin`.
   - The sims README section and its live table.
   - Update the lab log slice 15 line with the lab game id and score.

## Gotchas

- `office()` test helpers default `chatter` with `= POOL`, so `undefined` does not mean "no scenario
  pools": pass `{}`.
- The validator's picture-only warning appears for any cooler preset with no lines (expected, by design).
- The stub world pairs NPCs only if their homes are spaced (200 px in the two-pair lock test).
