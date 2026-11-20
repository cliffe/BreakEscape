# Capture payload secret fix: build log (2026-11-12)

Branch `build/usepayload-secret`, from main at 6a834437c. Source: the access format review
(SCENARIO_FORMAT_REVIEW_ACCESS.md, M2 and recommendation 4) and the structure review's note on
`globalVariables` and `minigameData` (SCENARIO_FORMAT_REVIEW_STRUCTURE.md).

## The claim, and what the code did

The claim was that `usePayload.secret` is withheld only for NPCs with an account, so a secret
captured by watching another NPC reaches the browser before it is earned. It was true, and the
gap was wider than the review said:

| Where the secret sat | Route | Before |
|---|---|---|
| room NPC `usePayload.secret`, no account | GET /room | shipped |
| room NPC `eventMappings[].addCapture.secret`, no account | GET /room | shipped |
| `add_capture` action `capture.secret` on a room object or an NPC's held item | GET /room, GET /container, inventory copies | shipped |
| top-level `phoneNPCs` / `npcs` `usePayload.secret` | GET /scenario | shipped |
| `timers[].actions` `add_capture` `capture.secret` | GET /scenario | shipped |
| a landing page's `capture.secret` | GET /scenario | withheld (the walk was scoped to `social`) |
| account holder `usePayload` and `addCapture` secrets | GET /room | withheld |

`Game#withhold_npc_secrets!` returned early for an NPC without `creds.username`, and
`strip_capture_secrets!` was called only on the bootstrap's `social` block.

Routes checked: GET /scenario (bootstrap), GET /room/:id, GET /container (uses the same object
filter), the inventory canonical item copy, the KO drop and give paths (all through
`filter_requires_and_contents_recursive`), the NPC state endpoints (npc_frustration,
npc_workaround, feed_post: none returns an NPC record; a workaround that opens a room returns it
through `filtered_room_data`), and the Friendface phone (posts and facts only, no NPC record).
GET /ink carries compiled ink, not scenario NPC data.

## Inventory (176 scenarios rendered, 0 failed)

Script: a Rails runner over every `scenarios/*/scenario.json.erb`, listing every NPC capture
writer, every global or `minigameData` value equal to a lock code, password, Wi-Fi key, flag or
capture secret, and every such secret found in a bootstrap or room answer.

Capture writers with a secret:

| Scenario | NPC | Kind | Account | Leaked before |
|---|---|---|---|---|
| lab_physical_pentest | ruth (mapping for Len's records door PIN) | addCapture | no | yes, GET /room briefing_room |
| lab_physical_pentest | hampshire, lord, pierce | usePayload (filled from creds) | yes | no |
| test_capture_log | sofia, ned | usePayload (filled from creds) | yes | no |
| lab_social_engineering | landing page | capture | n/a | no |

Every other `usePayload` (test_clone_left_card, test_needs_sims, test_npc_needs) has no secret.
No scenario has an `add_capture` action with a secret, and none has a capture writer on a
top-level or phone NPC; those routes are fixed anyway.

Client code: nothing reads a secret from a payload on purpose. `npc-manager.js` overlays the
NPC's `usePayload` onto the mapping's `addCapture` and `recordSECapture` stores whatever
`secret` arrives in `se_captures`; `captures.js displaySecret` prefers the GET
/capture_secrets map and uses the entry's own `secret` only as a fallback for old saves. With
the secret withheld the entry is stored without one and the capture log fills it from the
server. No client change was needed.

## The fix (commit c18c1e605)

`app/models/break_escape/game.rb`:
- `withhold_npc_secrets!` strips `usePayload.secret` and every `addCapture.secret` for every NPC.
- `strip_capture_secrets!` covers `capture`, `addCapture` and `usePayload`, and runs over the
  whole bootstrap and at every node of `filter_requires_and_contents_recursive` (room, container,
  inventory copies), as the declared grants strip already does.
- The earned path: `capture_secrets_for_client` now also serves a non-account authored secret
  for an entry the server's `se_captures` record holds (`authored_capture_secret`). A
  `usePayload` with no `targetId` fills the `addCapture` mappings on its own NPC. A writer whose
  address is an account username, or that sits on an account holder, is left to the account
  pass and its capture proofs. A writer with a `proof` is served only once the proof holds; in
  a scenario that declares proofs, a secret that is also a PIN or password lock code is not
  served without one (the same rule `account_capture_served?` applies to accounts). The secret a
  client writes into its own entry is ignored. `revealSecret` still gates everything.

Sync size: nothing new in player_state. A capture entry is now smaller (no secret).

## Tests

- `test/controllers/break_escape/capture_payload_secret_routes_test.rb` (new): GET /scenario and
  GET /room carry none of five planted secrets (room NPC usePayload, mapping addCapture, object
  action, held item action, phone NPC, timer). Run against the unfixed code first: both failed,
  showing the secrets in the response bodies.
- `test/models/break_escape/capture_payload_secret_test.rb` (new): serving rules (nothing before
  the record, served after, a forged client secret ignored, undeclared and foothold entries
  refused, revealSecret off, proof gate, lock-code gate, an account's mapping secret no way round
  its proof) and a scan of every scenario: no capture secret in the bootstrap or any room answer.
- `lab_physical_pentest_secrets_test.rb`: the records door PIN is in no room or bootstrap answer
  until the shoulder-surf is recorded, then served; the earlier assertion that Len's capture was
  never served is updated (it is now the earned route).
- `access_model_withholding_test.rb`: the "today's behaviour" assertion (a non-account
  usePayload keeps its secret) now asserts it is withheld.

Affected files run without the lock: 417 runs, 7278 assertions, 0 failures (the capture,
access model, network, habit, workaround, games controller, filter and lab test files).

## Live proof (keyless server on :3091, headless, setFPS(20), fixed steps on)

- Game 1743 (lab_physical_pentest). Responses captured for the whole run. Before the beat GET
  /capture_secrets answered `{}`. With the pre-fix `game.rb` swapped in, GET /room/briefing_room
  carried the PIN on Ruth's mapping; with the fix, 0 occurrences.
- The beat: Len's gate globals (`len_at_door`, `len_keying`) were set from the console and
  `player_watched_reader` emitted, the event the ledger shelves click sends. Exercised, not
  earned: the walk to open_plan and Len's routine were not played. Ruth's mapping fired, the
  `se_captures` entry was stored with no secret, `kp_pin_surfed` set, and GET /capture_secrets
  then answered with Len's PIN. The capture log (Harvested Credentials) showed it in the row.
- The 16 captured responses: the PIN appears only in the two GET /capture_secrets answers after
  the beat. `tools/playtest/access-leak-check.rb 1743` over the file: no leaks found.
- Game 1748 (m08_the_mole): GET /scenario carries `globalVariables.suite_code`, 4 digits, at game
  start, while the interrogation room's `requires` is stripped. See below.

## The other categories (same pattern of a deny list missing a case)

Scanned across all 176 scenarios, bootstrap and every room answer:
- Wi-Fi PSKs and network keys: none in any bootstrap (withheld with the network keys).
- `creds` and the other withheld NPC keys: none on any NPC record in a bootstrap. The only hits
  are `social.phishTargets[].role`, a job label, not the access model role.
- Feed facts: none shipped in `social.intelFacts`.
- `requires`: no PIN or password `requires` survives. 17 objects carry `requires` with no
  `lockType`; their values are the literal placeholder "password" (crypto1 to crypto4, ceo_exfil)
  or a card id on a door (lab_physical_pentest, test_gate_tailgate). Not secrets, but the
  structure review's proposed error would flag them.
- `globalVariables` and `minigameData` equal to a secret:
  - **m08_the_mole `suite_code`: a real leak.** The global equals the interrogation suite's PIN and
    ships in the bootstrap and every sync. It exists because Netherton speaks the code in voiced
    ink. Not changed (a design call). Proposal: a scenario-level list of server-held globals
    (for example `serverGlobals: { "suite_code": { "revealWhen": ... } }`) whose values the
    bootstrap and sync send as an empty string until a condition the server can check holds
    (the code card served from the Director's safe, or the server's own flags-submitted
    record), after which the sync answer carries the value. Ink reads the global only in
    Netherton's late knots, so the line still prints. The other route is to accept it under the
    cheat policy, as honest play reaches the code; the policy says PINs are hard-enforced.
  - m06_follow_the_money: three `withdrawals[].slot` values in the transaction server's
    `minigameData` equal the custody console PIN. This is the deduction itself (trace the
    withdrawals to the slot), shown on screen in the unlocked object, so not a leak.
- The structure review's other claim, that `globalVariables` and `minigameData` are never
  stripped by either filter, holds. No engine change is clearly safe there: the client needs the
  globals for ink and conditions, and `minigameData` is puzzle content.

## Not done, and proposals

- Validator: warn when a non-account `usePayload` has a secret but no `targetId` and no
  `addCapture` mapping on its NPC (the server could never serve it), and when a capture secret
  is a lock code with no `proof` in a scenario that declares proofs (it will not be served).
- Validator: the structure review's secret-in-global check, as a warning rather than an error,
  so m08 does not fail the merge-batch validator before its design call, with m06's puzzle data
  allowed by an explicit marker.
- `tools/playtest/lib/access_leak_scanner.rb` does not know non-account capture secrets; adding
  them as a rule would let every live run check this class.
- No scenario was touched, so no validator run was needed.

## R1 fixes (2026-11-12)

Code review R1 (USEPAYLOAD_SECRET_CODE_REVIEW_R1.md) raised 0 blockers, 0 majors, 3 minors and
2 nits, all latent (no shipped scenario trips them). All closed.

- Minor 1: a non-account usePayload with no targetId that fills an addCapture mapping now keeps
  the mapping's own gate. `usepayload_target_ids` is replaced by `usepayload_captures`, which
  returns [target_id, capture] pairs, each the mapping's addCapture overlaid with the payload
  (mapping as base, payload overrides), the same merge npc-manager.js applies. So the mapping's
  `proof` and `address` hold unless the payload carries its own; the payload's absent proof no
  longer drops the mapping's. The payload's own-targetId case is unchanged.
- Minor 2: the non-account gate now matches the account gate. `authored_capture_secret` withholds
  any secret that is a hard-access value, whether or not the scenario declares proofs. The set is
  `CaptureModel.hard_access_values`: a password or PIN lock code, an RFID or biometric `requires`,
  a Wi-Fi PSK, or a flag value. A secret that opens nothing (Len's 4471) is not in the set and
  still serves on the capture record, the best-effort bucket under q78. No shipped capture route
  breaks: the inventory's only non-account secret is 4471, which is not a lock code, PSK, flag or
  RFID/biometric requires (the records door is badge-only), and the lab_physical_pentest secrets
  test still proves it served after the beat.
- Minor 3: the all-scenario scan now also asserts GET /container (every object's `contents`
  filtered through `filter_requires_and_contents_recursive`) and the inventory copy of every held
  item, the two routes a nested capture descriptor can ride that the room/bootstrap scan misses
  (the room answer drops locked contents wholesale), plus the Friendface phone body. GET /mail
  serves client-synced player_state and GET /ink serves compiled static ink; neither carries a
  scenario-authored capture descriptor, noted in the test.
- Nit 1: `scripts/validate_scenario.rb` (check_access_model) now warns when a non-account capture
  secret (a usePayload or addCapture mapping) is also a password or PIN lock code with no proof,
  so an author is told it will be withheld and never served.
- Nit 2: `authored_capture_secrets` is memoised per request (`@authored_capture_secrets`), and the
  hard-access set is memoised too (`@hard_access_capture_values`), so a poll no longer re-walks
  the whole scenario each call.

Files: app/models/break_escape/game.rb, lib/break_escape/capture_model.rb,
scripts/validate_scenario.rb, test/models/break_escape/capture_payload_secret_test.rb, this log.

Tests (no lock, affected files only): capture_payload_secret_test (12 runs), the capture and
access-model files (capture_payload_secret_routes, lab_physical_pentest_secrets,
access_model_withholding, capture_secret, access_model_rules, capture_proofs,
capture_secret_endpoint: 97 runs), npc_workaround_h (34 runs): 0 failures. Validator on
lab_physical_pentest, test_capture_log and lab_social_engineering: 0 ❌ each, no false-positive
capture warning. The new nit-1 warning fires on a crafted non-account lock-code capture.

## Handover

Done. Files: app/models/break_escape/game.rb, the four test files above, this log. Commits:
c18c1e605 (engine and tests), plus this log. Server on :3091 and the session were stopped by PID.
