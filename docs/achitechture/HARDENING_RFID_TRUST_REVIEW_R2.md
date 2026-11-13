# Adversarial review R2: RFID requires-only trust gap (follow-up)

Branch `build/hard-rfid`, commits `2f5471209..e58ff2474`. This round re-ran R1's tests,
reviewed the new scenario change in `e58ff2474` (the multiprotocol Level 4 UID demo), drove
Levels 3 and 4 in a headless browser with the real test bridge, and took a fresh pass over
the whole branch.

## Verdict

REQUEST CHANGES. One blocker, in the R1-follow-up scenario/ink wiring (`e58ff2474`): the
restructured demo cannot be completed in honest play, because no clone of the DESFire card it
now requires can be produced. The server fix in `app/models/break_escape/game.rb` is itself
sound and I confirm R1's APPROVE of the server change: the blocker is in the scenario, not the
server, and no deployed mission is affected.

## Counts

- Blocker: 1
- Major: 0
- Minor / informational: 3

## R1 outcomes and tests (confirmed)

- `test/controllers/break_escape/access_model_rfid_test.rb`: 53 runs, 212 assertions, 0 failures.
- `test/integration/unlock_system_test.rb`: 46 runs, 153 assertions, 0 failures.
- `test/models/break_escape/game_test.rb`: 99 runs, 413 assertions, 0 failures.
- Validator (`scenarios/test-rfid-multiprotocol/scenario.json.erb --no-graph`): 0 errors, 23
  warnings (all pre-existing: unknown note fields, decoy keycard credentials, an ink VAR read
  but never set). No line with a cross.

All counts match R1. The server change (`rfid_lock_passes?` / `rfid_requires_held?` /
`held_keycard_ref_ids`, removal of `rfid_requires_revoked?`) is unchanged since R1 and R1's
audit of it holds; see "Fresh branch pass" below for the re-check.

## BLOCKER 1 — Level 4 is unreachable by honest play; the demo does not complete in order

`scenarios/test-rfid-multiprotocol/scenario.json.erb:211` (desfire_room `requires:
["executive_card"]`, `acceptsUIDOnly: true`), against `scenarios/ink/rfid-security-guard-fixed.ink:37-69`.

`e58ff2474` moved `guard_high` (card `executive_card`, protocol `MIFARE_DESFire`) into the
Level 3 room and re-gated the Level 4 door from `corporate_badge` to `executive_card` with
`acceptsUIDOnly: true`, so that a UID-only clone would open the weak reader. The one and only
source of `executive_card` is `guard_high`. But a clone is produced solely by the
`#clone_keycard` dialogue tag, and `guard_high`'s ink offers no choice that reaches it:

- For `MIFARE_DESFire`, `card_instant_clone` is false and `card_needs_attack` is false
  (`public/break_escape/js/systems/npc-conversation-state.js:719-732`, mirrored in
  `public/break_escape/js/minigames/person-chat/person-chat-conversation.js:232-239`:
  instant-clone is EM4100 / MIFARE_Classic_Weak_Defaults only, needs-attack is
  MIFARE_Classic_Custom_Keys only, and `card_uid_only` is the DESFire flag).
- The hub in `rfid-security-guard-fixed.ink` gates its two clone options on
  `card_instant_clone` (line 50, `#clone_keycard`) and `card_needs_attack` (line 57). There is
  no `card_uid_only` branch anywhere in the file, so for a DESFire card the hub shows only
  "Ask about the keycard security", "Ask about the keycard" and "Just browsing".

No other clone route exists: `#clone_keycard` is the only path to the cloner minigame
(`public/break_escape/js/minigames/helpers/chat-helpers.js:366`), and there is no
scan-nearby-NPC action. The Level 4 door therefore cannot be opened, and the "All Levels
Passed" end-goal note is unreachable. This contradicts the build log and R1's Outcome for
minor 2 ("the UID clone now opens the weakly-configured Level 4 reader, teaching the intended
lesson"): the server would credit such a clone, but honest play can never make one.

Live proof (keyless server :3636, game 3207, real `window.__test`, started via
`tools/playtest/new-game.rb --start-room mifare_custom_room`):

- `guard_high` (DESFire) dialogue choices: `["Ask about the keycard security", "Ask about the
  keycard", "Just browsing"]` — no scan/clone option.
- `guard_custom` (custom keys, control) dialogue choices: `["Ask about badge security", "Try
  to scan their badge", "Chat about security", "Leave"]` — the scan option appears when the ink
  supports it, so the method is sound and the absence above is the content.
- Forced server unlock of `desfire_room` with no clone and no `card_ids` (the real page's own
  fetch, client step-1 shape) -> 422 `{success:false,"Invalid attempt"}`. The R1 gap stays
  closed on this scenario's own door, so the door is genuinely gated; it is just ungateable-open
  by honest play.

Suggested fix: add a UID branch to the hub of `scenarios/ink/rfid-security-guard-fixed.ink`
(then recompile to `rfid-security-guard-fixed.json`, which the scenario loads), e.g.

    { has_keycard and has_rfid_cloner and card_uid_only:
      + [Clone the UID (emulation only)] #clone_keycard:{card_card_id}
        # speaker:player
        You capture only the card's UID -- enough for a weak reader.
        -> cloned_success
    }

The cloner minigame already produces a UID-only clone of a DESFire card ("Save UID",
`rfid-ui.js:1227`, `rfid-minigame.js:432`), which `record_card_clone!` records `uidOnly:true`
and which `rfid_requires_held?` credits at an `acceptsUIDOnly` lock. Re-validate and re-drive
Levels 3-4 after the ink change.

## Minor / informational

1. **Minor — Level 3's custom-keys protocol is now decorative.** Re-gating Level 4 to
   `executive_card` orphaned `corporate_badge`: no lock requires it, so cloning
   `guard_custom`'s card is no longer needed to finish. `mifare_custom_room` was never a locked
   room (in the base too), so the Level 3 "You cracked MIFARE Classic with custom keys" note
   (`scenario.json.erb:188`) and "Proceed north" overstate what completion requires. Before the
   change the Level 4 door required `corporate_badge`, so the custom-keys level was exercised;
   now it is not. The demo at most teaches EM4100 + MIFARE-weak + (intended) DESFire, with
   MIFARE-custom unused. Not deployed, no automated tests. Suggested: once the blocker is fixed,
   either keep Level 3 as a locked `corporate_badge` gate before `desfire_room`, or soften the
   Level 3 note so it does not claim a step the player skips.

2. **Minor (pre-existing) — inert physical DESFire keycard.** `desfire_room` holds a keycard
   object `executive_card_physical` (`scenario.json.erb:229`), `takeable:false`, whose id does
   not match any `requires` and which sits inside the very room it would open. The validator
   warns on it (and on `corporate_badge_physical` and `master_override`). Decoy/flavour only;
   unchanged by this branch. No action needed beyond a comment if the decoys are deliberate.

3. **Informational — the in-scenario UID-only negative is not expressible.** The task's
   "a non-UID-only requires lock still refuses a UID-only clone" cannot be shown through this
   scenario's own doors: `desfire_room` is its only lock keyed to the DESFire card and it is
   `acceptsUIDOnly`, so there is no `executive_card` lock without `acceptsUIDOnly` to try the
   UID clone against. The real-controller negative is covered by `access_model_rfid_test`
   ("refuses a UID-only clone unless acceptsUIDOnly", re-run green, 53/212 on the `/unlock`
   path). If an in-browser negative is wanted, the scenario would need a second `executive_card`
   lock without `acceptsUIDOnly`.

## Fresh branch pass (item 3)

Re-checked the whole `2f5471209..e58ff2474` diff (game.rb + the scenario + three test files;
no other ink or client change). No new server finding beyond R1:

- CHEAT POLICY: `serverClones[card_id].uidOnly` is derived server-side from the scenario
  definition's `rfid_protocol` (`record_card_clone!`, `game.rb:2677`), never from client input,
  and `serverClones` is not merged by `sync_state`, so a client cannot forge a non-UID clone of
  a DESFire card to open a non-`acceptsUIDOnly` lock. `held_keycard_ref_ids` skips
  `client_forged?` items and reads only the server inventory, and `/inventory` strips
  `card_id`/`opens_lock`/`key_id`, so no minted keycard id. Honest play of every deployed
  requires-only rfid lock is provable from server-held state (R1's audit table; all deployed
  cloned cards are EM4100 / MIFARE_Classic, none DESFire, so no deployed mission needs the UID
  path and none is blocked).
- SYNC SIZE: no new per-game field. `serverClones` is keyed by `card_id`, so it is bounded by
  the scenario's distinct cards and does not grow unboundedly or re-send a growing blob;
  `card_ids` is request-only. Payload size and shape unchanged.
- HONEST-PLAY RULE: the server change itself blocks only dishonest no-card opens; the honest
  blockage found here is in the scenario's ink wiring, not the server.

## Browser run

Game 3207 (`test-rfid-multiprotocol`), keyless server :3636, stopped after the run. Results
as under BLOCKER 1. No screenshots; the dialogue-choice and unlock-response captures are the
proof.
