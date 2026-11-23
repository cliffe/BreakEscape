# m06 Follow the Money: trailer scout

Stage 1 of `docs/video/edits/M06_TRAILER60_OUTLINE.md`, method from `.claude/skills/video-scout/SKILL.md`. Nothing was recorded, generated or changed in the repo. Scratch files are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m06/` (`lines.json`, `picked1.json`, `route.json`, `tts1.tsv`, `tts_route.tsv`, `clips/`).

## Headline

- **Lines.** 77 unique lines tested live on game 12252 (82 requests). 75 returned 200 `audio/mpeg`, 1 returned 503 (no cached audio), 1 returned 403 (text not in the ink). Three control lines were all refused with 403, so the check is live.
- **Decided lines.** The ending ("Murder's what they call it...") is cached, 4.66 s. The hook (Netherton) is cached, but at 11.86 s it is the whole ink line, so the cut point is an edit decision and was not measured.
- **Blocker on the route.** Every route I traced from the Satoshi hub to the final-words menu goes through `philosophy_challenge`, whose line "Take me in if you like..." has no cached audio (503). The one route that avoids it (the "privacy" branch) has lines I did not test (see Not done).
- **Not verified.** I did not play the mission or check any frame. Every "answer on screen" cell in Part B is therefore unknown, not "no".

## Environment

- Keyless server on `127.0.0.1:3033`, started by the scout at `nice -n 19`. **Stopped at the end**; port 3033 has no listener. No other port was used. Postgres was already running and was not touched.
- Game `12252`, created with `tools/playtest/new-game.sh m06_follow_the_money` (fresh, no flags XML, stand-in flags).
- No `db:*` commands, no edits to any existing game row, no SecGen XML, no exploit field guides, no `SOLUTION_GUIDE.md` read.
- Gotchas for the next scout (these differ from the skill text):
  - `BE_DB_USER=root` fails here ("role does not exist"). Leave `BE_DB_USER` unset: the default `deploy` role connects.
  - Do not set `BUNDLE_FORCE_RUBY_PLATFORM=true`. It hides the installed `x86_64-linux` gems and bundler then fails with GemNotFound.
  - Use `RBENV_VERSION=2.7.8` and `BUNDLE_PATH=<main checkout>/vendor/bundle`. `new-game.sh` sets the bundle path itself.

## Part A: voiced lines

Conversation paths are from the ink. The line text is the exact pool text. The live result is from `tts-test.mjs`.

| Slot | NPC id | Exact text | Ink file and knot | Path from start and entry | Spoken | Live |
|---|---|---|---|---|---|---|
| Hook (decided) | `director_netherton` | Agent 0x00. Every cell we have hit is being paid by someone. Tonight we chase the money. HaX. | `m06_opening_briefing.json` `start[0]` | Fresh game, opening briefing. No choice needed. | 11.86 s | 200 |
| Hook fallback | `opening_briefing_npc` | Somebody is keeping the books for all of them. | `money_explanation` (`:71`) | Briefing > "Which payments?" | 3.02 s | 200 |
| Threat | `opening_briefing_npc` | HashChain Exchange. A trading platform on paper. In practice, the bank for every ENTROPY cell we know. The Crypto Anarchists run it. | `hashchain` (`:80`) | Briefing > "Which exchange?". Cut before "The Crypto Anarchists run it." | 8.42 s | 200 |
| Guard | `checkpoint_guard` | Evening. Floor's restricted. Who are you? | `start` (first talk) | At `security_checkpoint`, first talk (`guard_asked_name` unset). | 4.66 s | 200 |
| Irina | `irina_volkova` | Satoshi is paranoid about doors and careless about passwords. Exactly backwards. | `discuss_badges` (`:329`) | Trading floor, after her first meeting (`exchange_infiltrated`). Hub choice "Tell me about your door access." | 7.82 s | 200 |
| Priya | `blockchain_analyst` | You can't see through Monero. You don't need to. Watch what goes in and what comes out. | `mixer_matching` | Blockchain lab. Hub choice "How would you follow money through a mixer?". The dungeon graph has no lock on this room; confirm its door in the take. | 5.26 s | 200 |
| Kemal 1 | `satoshi_minder` | The FCA does not come up here. | `on_sighted` (`:115`) | Executive wing (`--unlock executive_wing`), walk into his sight, first challenge. Cover not strained. | 3.74 s | 200 |
| Kemal 2 | `satoshi_minder` | Then come and move me. | `goes_hostile` | Sight > challenge "The FCA. Routine supervisory visit." (needs `cover_strained` or `saw_picks`) > `cover_blown` > choice "Then step aside, or I'll move you." Easiest is the lockpick caught in view (`on_lockpick_seen` sets `saw_picks`). Sight and lockpick in one take. The choice is the player's, not voiced. | 2.45 s | 200 |
| Ending (decided) | `satoshi_nakamoto` | Murder's what they call it when you lose. The winners get statues. | `ideology_rejection` (`:566`) | Monitoring route, see the step list below. Film the line only. | 4.66 s | 200 |
| Ending fallback 2 | `satoshi_nakamoto` | Whoever controls the money controls the people. We'd like nobody to. | `ideology_discussion` | Start > funding choice > evidence > "Need it most? They're terrorists." | 5.21 s | 200 |
| Ending fallback 3 | `satoshi_nakamoto` | Nobody says that name in this building. | `ghost_name` | Needs `found_architects_fund`. Start > "Or should I call you Satoshi's Ghost?". The next knot, `casualties_discussion`, speaks a figure (see Not done). | 2.09 s | 200 |
| Alt (outline ranks 4th) | `satoshi_nakamoto` | The Architect calls them lessons. I just pay the invoices. | `calculated_cruelty` | Start > "You're paying for people to die." > `casualties_discussion` (no figure when the fund is unfound) > "You worked out how many would die, and went ahead." | 5.06 s | 200 |
| Proposed (pick 1) | `satoshi_nakamoto` | Take me in if you like. The money already knows where it's going. | `philosophy_challenge` (in the ink) | Every branch from `ideology_discussion` that reaches the hub passes this knot, except the privacy branch. `#delivery: relaxed, a little amused, entirely sure` | 0 | **503, no cached audio** |
| Proposed (pick 2) | `satoshi_nakamoto` | Every ransom, every blackout, every riot. It all clears through my signature. | not in the ink | Not authored. | n/a | **403, not in ink** |

Not voiced, so no test: "Then step aside, or I'll move you." (a player choice). The narrator line "Kemal takes off his watch and pockets it." (`goes_hostile`) was not tested.

Full Satoshi route pool (68 lines including 6 narrator lines, the ones the ending passes through): 67 at 200, 1 at 503 ("Take me in"). The list is in `route.json`.

## The ending, step by step (monitoring route)

The "Murder" menu is the last point at which the player chooses. Film the line only; keep the three-option menu and the wrists out of frame.

Entry: game 12252 (fresh) with `--unlock executive_wing --unlock satoshi_office --set found_architects_fund=true`. The monitoring route needs only the fund flag. (`found_wallet_keys` is needed only for the freeze branch.)

1. Walk into `satoshi_office`, talk to Satoshi (`start`, first time). Lines heard: narrator "A man in his early forties leans on the front of an executive desk..." (200), "Your paperwork was good. I had you checked anyway. Old habit." (200), a minder line by his state, "SAFETYNET, right? So you've worked out what this place is for." (200).
2. Choose "You're funding ENTROPY. Every cell we've hit runs its money through this exchange." > `evidence_reveal`. Lines: "You mapped the network. Impressive." (200), "Sure. HashChain is ENTROPY's bank. Every cell." (200), "You'd call it laundering. I call it financial freedom for people who need it most." (200).
3. Choose "Need it most? They're terrorists." > `ideology_discussion`. Line: "Whoever controls the money controls the people. We'd like nobody to." (200).
4. **Choose the privacy branch**: "Privacy has honest uses. You threw them away." > `corrupted_ideals` > (else branch) `irina_conflict` > `choice_presentation`. **Not tested**, see Not done.
   - The alternative, "You're a criminal with a manifesto." > `criminal_accusation` ("By whose law?..", 200; "I don't accept it..", 200) > `philosophy_challenge`, plays "Take me in..." (**503**). This is the blocked route.
5. `choice_presentation` (first time): "Let's talk about my money." (200), "Twelve point eight million, signed and waiting." (200), "Though you don't know which wallet is mine. Do you?" (200), "You could freeze it..." (200), "Or you let it run..." (200). Choose "I'm leaving it running. Every cell that touches it goes on a list." > `enable_monitoring`: "You'll let it run. I didn't expect that from SAFETYNET." (200).
6. Choose "The map's worth more than one payout." > `intelligence_value_response`: "You've costed it. So have I." (200), "We just disagree about which system gets saved." (200). Then `arrest_finale`: narrator "You tell him he's coming with you..." (200), narrator "He stands and holds out his wrists." (200), "They'll convict me. They'll want an example." (200), "And the wallet you left running? Enjoy the map while it's fresh." (200, `monitoring_enabled`). The Irina variants (200, four of them) play only if her state matches.
7. `final_words`: "One question before they come. Do you ever wonder if we're right?" (200). Choose "No. Your ideology doesn't cover murder." > `ideology_rejection`: **"Murder's what they call it when you lose. The winners get statues." (200, 4.66 s).** Cut to a close framing that keeps the wrists out of frame.

## Part B: set pieces and minigames

Sources: `dungeon_graph.json` (lock and item nodes) and `scenario.json.erb` (object types). Object ids are from the graph. Room lighting is from `scripts/lighting_lookup.rb`.

| Room | Lock (graph) | Minigame or device | Entry | Answer on screen? | Notes |
|---|---|---|---|---|---|
| Reception | none | Lab workstations (field guides), keycard relays, notes | fresh | not checked | the guides carry examples; check for codes |
| Trading floor | Key lock | Lockpick (`lock_pick_kit`), PCs, desk phones (`lerato_phone` decoy, `tomasz_laptop`) | `--unlock trading_floor` or the guard waves through | not checked | pizza bait is in the blockchain lab, not here |
| Server room | Password lock | Password screen, vm-launcher, flag station | `--unlock server_room` | not checked | **vm-launcher and flag-station need a VM: "needs VM", stand-in required** |
| Data centre | PIN lock | Settlement Tracer (`blockchain_explorer` on `transaction_server`), PIN pad, custody console, notes | `--unlock data_center` | not checked | the tracer's completion text names a slot: cut before it. **Motion lights.** |
| Irina's office | RFID lock | RFID cloner (`rfid_cloner`), notes | `--unlock irina_office` | not checked | |
| Executive wing | RFID lock | Kemal (minder), lighting none | `--unlock executive_wing` | not checked | the minder's sight and lockpick routes are in Kemal 1 and 2 |
| Satoshi's office | Key lock (CEO's office key) | Briefcase (`crypto_anarchist_manifesto`), biometric and fingerprint kit (`satoshi_signing_case`), safe | `--unlock satoshi_office` | not checked | biometric and PIN here are spoilers |
| Blockchain lab | none | PCs, pizza bait (`pizza_boxes`, magnet) | fresh | not checked | the pizza box is the crescendo flash |

**Minigame inventory (distinct types in the mission):** lockpick, RFID cloner, fingerprint kit, key lock, PIN pad, password screen, RFID lock, Settlement Tracer, flag station (VM), vm-launcher (VM), briefcase, safe, phone chat, keycard, lab workstation, PC desktop, pizza bait. Crescendo candidates. For each, "answer on screen" is unknown (not played).

**New mechanics as the outline names them.** Settlement Tracer is the only `blockchain_explorer` in this scenario (checked here). The desk-phone decoy (`deskPhone: true`) and the pizza bait magnet are from the outline; not diffed against m01 to m05.

**Lighting.** `server_room` and `data_center` are motion-mode, dark until entered. `trading_floor` has a screen tint that turns red when `assets_seized` is true.

**VM shots.** Real-hacking footage (server room password and analytics) is "needs VM", with a stand-in. The graph has four VM flag nodes (`vmch_submit_flag1` to `4`).

**Music.** The three outline tracks exist on disk: `SpyAction/Midnight Double Agent.mp3`, `Noir/Shadowline Protocol.mp3`, `SpyAgro/Shadow Cipher.mp3`. None is in `tools/video/edits/music/summary.json`, so no BPM is recorded for them. The summary's own top pick is `Noir/Midnight Cipher Chase.mp3` (120 BPM, window 107.0 to 137.0 s), which is not in the outline. I did not read the mission-to-music table in `docs/video/recipes/README.md`, so "not used by m01 to m03" is unchecked.

## Gates

- Lines: every outline line has a live result. Control refused: 3 of 3.
- Spoilers: no code, PIN, password or flag value is in this report. The outline's keep-off list (safe code line, slot lines, fund figures) was not tested and is not repeated here.
- Coverage: Part B "answer on screen" cells are unknown for every row (not played), so the gate is not met.
- Environment: server stopped, port 3033 free, game 12252 left in the dev database (new game only).

## Not done

- No frame checks. The "answer on screen" column is unknown everywhere.
- Privacy branch lines not tested: `corrupted_ideals`, `irina_conflict`, `irina_betrayal_reaction`, `terrorism_rebuttal`, `justification_rejection`, `honest_response`, `dismissal`. This is the only tested-capable route that avoids the 503 line. It must be live-tested before a take.
- `casualties_discussion` figure line ("Three hundred and fifty to six hundred...", 8.06 s, 200) is on the `ghost_name` route. It is a stakes figure, so the relaxed rule allows it, but it is in the take if that route is used.
- Kemal's narrator line and the Irina first-meeting lines were not tested.
- Music: no BPM for the three outline tracks; README music table not read.
- Not played through: every entry state is from the ink and the graph.

## Questions for the orchestrator

1. "Take me in if you like. The money already knows where it's going." has no cached audio (503, 1 line). Voicing it needs your yes through AC0.
2. "Every ransom, every blackout, every riot. It all clears through my signature." is not in the ink (403). It needs authoring before it can be tested or voiced.
3. The hook clip is 11.86 s. Where "Tonight we chase the money." ends inside the clip has not been measured.

Assumption: the privacy branch (`corrupted_ideals`) is cached: unknown, untested.
Assumption: `--set found_architects_fund=true` alone is enough for the monitoring path: read from the ink, not played.
