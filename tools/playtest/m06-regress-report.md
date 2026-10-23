# m06 regression playtest (engine changes, uncommitted)

Questions answered: 1 (plumbing, two focused checks only; not a solvability run). Steps taken from the brief and `scenarios/m06_follow_the_money/TESTING_WALKTHROUGH.md`.
Session log: `tools/playtest/m06-regress-session.jsonl` (game 1191). Flags XML: `m06_follow_the_money-flags-game1191.xml` (flags never submitted).

## Verifier output (game 1191)

```
game            1191  (mission 50)
created         2026-10-01 06:28:55 UTC
last write      2026-10-01 06:32:46 UTC
played for      232s of wall clock
current room    "reception_lobby"
unlocked rooms  4: reception_lobby, security_checkpoint, trading_floor, elena_office
unlocked objs   0: 
inventory       4: Your Phone, Notepad, IT New Starter Checklist, RFID Badge Cloner
NPCs met        7: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, elena_volkov, trader_npc
flags submitted 0: 
globals set     8: briefing_played, exchange_infiltrated, final_choice, mission_priority, player_approach, player_name, rfid_guide_offered, server_passphrase_known

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

Not played to completion, so `status` stays in progress (not required for these checks).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT checklist | read for the `server_passphrase_known` global | Security Checkpoint, IT New Starter Checklist | read before Irina | yes |
| CTO badge | cloned `cto_badge` | Irina Volkova, "(Read her badge with the cloner while she talks.)" | save at log 155 | yes |
| All flags, PINs, `bitcoin2025`, 3110, 2140 | not used | — | — | not used (focused run) |

Everything downstream of the first rooms is unexercised here.

## Results

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 9 | Clone card, reload, card persists | **PASS** (route note below) | `executive_badge` is a rack-drawer pickup in the data centre, not a clone target, so I used the route that does use the cloner: Irina's `cto_badge` (EM4100 screen: HEX 15F0F5A4FD, Save at log 155). `.minigame-container` count 0 afterwards and walking worked. After reload (log 180): server `saved_cards` held `CTO Access Badge`, and the cloner's Saved list showed it; emulating it opened Irina's office. |
| 10 | HaX first call plays once, no replay after reload | **FAIL** | First open: contact preview "You're in. Remember the cover..." and the first call transcript with choices. I chose "I'll call if I need help" (log 19-21) and the call ended. After reload (log 180) the phone showed a fresh `first_call` ("Agent 0x00, you're inside HashChain Exchange. How's the FCA cover holding up?") with all three opening choices again. |

## Defect

**D1 (same as m03): NPC-local ink variables are not persisted.** `npcInkVariables` stored for `agent_0x99_handler` and `opening_briefing_npc` is
`{"patch":null,"_batchObservingVariableChanges":false,"_changedVariablesForBatchObs":null}`
(browser `npcConversationStateManager.exportNpcInkVariables()` returns the same), so `first_contact` in `m06_phone_agent_0x99.ink` resets to `true` on reload and `first_call` replays. Cause suspected in `npc-conversation-state.js` (`recordInkVariables` and `saveNPCState` iterate `Object.entries(story.variablesState)`, which yields the inkjs VariablesState object's own fields rather than the story variables). Human to confirm.

**Regressions:** none seen. The opening briefing did not replay after reload (`briefing_played` skip worked), and cloner cards persist.

## Not checked
The `POST objectives/unlock` endpoint was not hit (no `#unlock_aim` tag run in either mission), so I cannot say whether it 404s.
