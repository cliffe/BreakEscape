# usePayload / capture secret fix: code review round 1 (2026-11-12)

Counts: 0 blockers, 0 majors, 3 minors, 2 nits.

Branch `build/usepayload-secret` (c18c1e605 engine and tests, c75096c5e build log), reviewed against
`main`. Scope: `app/models/break_escape/game.rb` and the four test files. The fix withholds every
capture secret from every NPC on every route and serves a non-account authored secret from
GET /capture_secrets once the server's own `se_captures` record holds the capture.

## Verdict

The withholding is complete for the current corpus and the serve path is sound. A live earned-path
run (below) confirmed the records-door PIN reaches the browser only through GET /capture_secrets and
only after the shoulder-surf is played, never in the bootstrap or a room answer. No blocker or major.
The three minors are latent gaps that no shipped scenario triggers today; they matter the moment a
non-account capture secret is added that is proof-gated on its mapping, or is a hard-access value that
is not a password or PIN lock code.

## Completeness (check 1)

The strip runs in three places and they overlap safely:

- `filtered_scenario_for_bootstrap` walks the whole bootstrap tree (`strip_capture_secrets!(filtered)`,
  game.rb:1178), stripping `capture`, `addCapture` and `usePayload` secrets wherever they sit
  (top-level `npcs`, `phoneNPCs`, `timers`, landing pages).
- `filter_requires_and_contents_recursive` strips every object it descends into (game.rb:4626), which
  covers GET /room, GET /container, the inventory canonical copy, the KO drop and give paths, and the
  `npc_workaround` reply (it returns `filtered_room_data`).
- `withhold_npc_secrets!` strips `usePayload.secret` and every mapping `addCapture.secret` for every
  NPC, account or not (game.rb:4771-4776).

Routes that return no NPC or capture record are unaffected: `sync_state` renders `{ success: true }`
only (games_controller.rb:807), the Friendface phone serves posts and facts, `npc_frustration` and
`feed_post` return no NPC record, and GET /ink carries compiled ink. A grep of the compiled and source
ink for the one real non-account secret (`4471`) found it only in `scenario.json.erb` (stripped) and
markdown notes (never served). The dungeon graph keys are removed by `strip_puzzle_graph_keys!`.

The all-scenario inventory (176 rendered) shows the only non-account capture secret in the whole
corpus is lab_physical_pentest's Len PIN; every other `usePayload`/`addCapture` secret sits on an
account holder and is served by the account pass. No live completeness gap.

## The serve path (check 2)

`capture_secrets_for_client` serves a non-account authored secret only when the client's `se_captures`
holds an entry whose `target_id` is a declared capture target, whose `kind` is `credential`, and that
passes `authored_capture_secret`. Account holders and addresses that match an account username are
excluded from `authored_capture_secrets` (game.rb:1277-1286, 1294-1296), so the new path can never
serve an account password around its proof. The test `an account capture keeps its proof rule`
confirms this, and the client's own written `secret` is ignored (the server reads the authored value).

On the cheat policy: a tampered client can write `se_captures["len"]` and be served `4471` without
playing the shoulder-surf. This is acceptable. The records door is badge-only, so the PIN opens
nothing; it is an event-gated finding, which the policy keeps best-effort, and it grants no hard
access. The lock-code backstop (`authored_capture_secret`, game.rb:1269) is what hard-enforces a
non-account secret that would open a password or PIN lock: in a scenario that declares proofs, such a
secret is refused until its proof holds. The q78 refinements (a no-`targetId` `usePayload` fills its
NPC's mappings, a proof writer waits for its proof, a lock-code secret waits in a proof-declaring
scenario) are all present and tested.

## Regressions (check 3)

- lab_physical_pentest Len PIN: live-proved working through the earned route (below).
- test_capture_log (sofia, ned) and the lab accounts (hampshire, lord, pierce): account `usePayload`
  secrets, served by the unchanged account pass; excluded from the new path.
- lab_social_engineering landing page: its `capture` is a landing-page capture, served by the
  `by_address` / single-secret fallback, not an NPC writer, so the new path does not touch it.
- Every scenario in the inventory: only these three carry capture secrets; the rest have none.
- Capture log UI: GET /capture_secrets returned `{"len":"4471"}` after the earned beat, which
  `captures.js displaySecret` prefers over the (now empty) stored `secret`.

## Sync size (check 4)

No player_state growth. `sync_state` echoes no scenario data, and a stored capture entry is now
smaller because the client no longer receives or stores the secret. `se_captures` remains bounded by
the declared capture targets. Compliant with the q77 rule.

## Findings

### Minor 1 - the usePayload fallback inherits the payload's proof, not the target mapping's

`app/models/break_escape/game.rb:1285` and `:1294-1299`

`authored_capture_secrets` records `proof: capture['proof']` from whichever writer fills a target id.
When a non-account NPC's `usePayload` (no `targetId`) fills one of its `addCapture` mappings
(`usepayload_target_ids`, game.rb:1303), the entry stored is `{ secret: payload.secret, proof:
payload['proof'] }` - the payload's proof, which is usually absent - because the mapping, having no
secret of its own, was skipped by the earlier `each_capture_writer` pass (its `add.call` returns on
`next unless secret`). The mapping's own `proof` is dropped.

Failure scenario: a non-account NPC with `usePayload: { secret: "..." }` (no proof) and an
`eventMappings[].addCapture: { targetId: "x", proof: { dropped: "qr" } }` (no secret). The author
intends the capture to need the dropped-QR proof. The server would serve the payload secret with no
proof check. No shipped scenario has this split on a non-account NPC (the lab's proof-bearing
`usePayload` NPCs are all accounts, which are excluded), so it is latent. The lock-code backstop still
catches the case where the secret is a password or PIN lock code; only a non-lock-code secret slips.

Fix: when the `usePayload` fills a mapping target, inherit that mapping's `proof` (and `address`)
rather than the payload's. Record the mapping's proof in `each_capture_writer`'s pass even when the
mapping carries no secret, so the payload-filled entry can pick it up, or merge the two in
`usepayload_target_ids`.

### Minor 2 - the non-account lock-code gate is narrower than the account gate, and conditional

`app/models/break_escape/game.rb:1269`

`authored_capture_secret` refuses a proofless secret only when `scenario_declares_capture_proofs?` is
true and the secret is a `CaptureModel.lock_codes` value (password or PIN lock codes). The account
path (`account_capture_served?` via `account_password_opens_something?`) is broader: it also gates a
password that admits at a login PC or a network share. Two consequences:

1. In a scenario that declares no proofs, a non-account capture secret that is a password or PIN lock
   code is served on the client's `se_captures` claim alone, with no proof. This is a cheat for a hard
   lock code.
2. A non-account capture secret that opens something by a route other than a password/PIN lock (a
   Wi-Fi PSK, an RFID or biometric `requires` value, a flag value) is never gated.

Failure scenario: add a non-account capture whose secret is a safe PIN (`lockType: pin`) in a scenario
with no `captureProof` or mapping `proof` anywhere. A tampered client writes the `se_captures` entry
and is served the PIN without reaching the beat. This is justified today only because the sole
non-account secret (`4471`) opens nothing and the lab declares proofs; the protection relies on both
facts holding.

Fix: make the gate unconditional on a hard-access secret - refuse a proofless non-account secret that
is any lock code or network key regardless of whether the scenario declares proofs - or, at minimum,
add the validator warning the build log proposes (a non-account capture secret that is a lock code with
no proof) so this is caught at authoring time.

### Minor 3 - the all-scenario test scan covers only the bootstrap and room answers

`test/models/break_escape/capture_payload_secret_test.rb:130-134`

The scan renders `filtered_scenario_for_bootstrap` and `filtered_room_data` for each room, but not
GET /container (locked container contents), the inventory copy, the phone, mail or ink. A capture
descriptor nested inside a locked container's `contents` is stripped only on the container route, which
the test never exercises, so a future regression there would pass. The code path is covered (the
container route runs `filter_requires_and_contents_recursive`); the test is not.

Fix: extend the scan to also render each locked object's GET /container answer (and an inventory copy
where a scenario holds a capture-bearing item), so every serve route a secret can ride is asserted.

### Nit 1 - Len's capture is silently fragile to `4471` becoming a lock code

`scenarios/lab_physical_pentest/scenario.json.erb:906`

The records-door PIN is served because `4471` is not a password or PIN lock code anywhere in the
scenario. If a future edit makes `4471` a lock code, `authored_capture_secret` would refuse it (the lab
declares proofs and Len's mapping has none) and the capture would stop being served with no error.
Fix: add the validator warning from the build log so an author is told when a non-account capture
secret is a lock code with no proof.

### Nit 2 - `authored_capture_secrets` is recomputed on every poll

`app/models/break_escape/game.rb:1276`

GET /capture_secrets is polled, and each call re-walks the whole scenario (`each_capture_writer`,
`scenario_room_npcs` twice) plus `account_capture_passwords`. It is read-only and small, but it could
be memoised per request alongside the account pass. Low priority.

## Note (out of scope)

Capture secrets are not the only secret an author can inline into ink or a global: m08's `suite_code`
(a PIN spoken in voiced ink) ships in the bootstrap and every sync. The build log records it as a
separate design call. This review confirms it is not a capture secret and is untouched by this fix.

## Live proof (earned path, keyless server on :3098, headless)

- Keyless confirmed (boot log: "GEMINI_API_KEY ... is not set"). Game 1752, lab_physical_pentest,
  driven through the `session-start.sh --headless` harness.
- Walked briefing_room to reception to hall to open_plan (real pathfinding, no teleport), stood at the
  ledger shelves without the courier hi-vis (`courier_ready` false), then waited on Len's own routine:
  `waitForGlobal("len_keying", true)` returned after 13.8 s when Len reached the badge reader and keyed
  his PIN (not a console-set global), with `len_at_door` already true. Clicking the ledger shelves then
  emitted `player_watched_reader`, `global_variable_changed:kp_pin_surfed`,
  `global_variable_changed:se_captures` and `objective_task_completed:opt_pin`.
- After the beat, GET /games/1752/capture_secrets returned `{"secrets":{"len":"4471"},"accounts":{}}`.
  GET /room/open_plan and GET /scenario each contained `4471` zero times.
- A fresh game (1761) returned `{"secrets":{},"accounts":{}}` from capture_secrets and zero `4471` in
  its room answer, so the PIN is withheld until earned.
- Server and session stopped by PID afterwards.

## Tests run (no lock, affected files only)

- capture_payload_secret_test.rb, capture_payload_secret_routes_test.rb,
  lab_physical_pentest_secrets_test.rb, access_model_withholding_test.rb: 64 runs, 1188 assertions,
  0 failures.
- capture_secret_test.rb, access_model_rules_test.rb, capture_proofs_test.rb,
  capture_secret_endpoint_test.rb: 42 runs, 224 assertions, 0 failures.
