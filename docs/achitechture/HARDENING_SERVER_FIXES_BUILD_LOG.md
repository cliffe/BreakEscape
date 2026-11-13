# Hardening server fixes build log (2026-11-13)

Branch `build/hard-fixes`. A batch of small server/engine items from the ideas backlog.
Worktree `.claude/worktrees/p-hard-fixes`, ports 3620/3621.

## Item 1 — Hot-desk guest claim mismatch (autoLockMin 0)

Status: clear bug, fixed.

Reproduced on the code: with a hot-desk policy of `autoLockMin: 0` the guest claim is
refused (`app/models/break_escape/game.rb:2307-2308`), but `record_borrow_done!`
(`app/models/break_escape/npc_frustration.rb`) still wrote a `guestSessions` record (it
checked only `careful_guest?` and `account_locked_out_at?`), so `borrow_body` answered
`guest: true` and the client `onGuestLeft` (`public/break_escape/js/systems/workstation-state.js`)
opened the session. The player saw an open session whose claim was then refused.

Fix: a policy with `autoLockMin: 0` locks the screen the instant anyone leaves, so no guest
session is open there (the owner-leave roll already locks outright on such a policy).
- Server: new `policy_locks_guest_outright?(pc)` helper; `record_borrow_done!` now deletes the
  guest record for such a PC, so `borrow_body` reads no record and answers `guest: false`.
- Client: `onGuestLeft` locks the screen outright and opens no guest session when
  `autoLockMin === 0`, mirroring `guestClaimRefused`'s publish/emit. (R1 minor 1: it now also calls
  `_changed(..., 'auto')` so the `workstation_screen_changed` event fires and the office-visuals lock
  cue plays, as the sibling `guestClaimRefused` and `_autoLock` paths do.)

R1 minor 2: the server's `autoLockMin 0` guest-claim refusal (game.rb) now purges any stale guest
record before refusing, matching the locked-out and timed-out branches, so no record can linger for a
later read if a runtime policy flip to `autoLockMin 0` is ever introduced.

Tests:
- `test/controllers/break_escape/npc_workaround_h_test.rb` — new test: a kiosk (`autoLockMin 0`)
  hot desk leaves no guest record and the borrow answers `guest: false`; the claim is refused.
- `test/js/workstation-state.test.mjs` — new test: `autoLockMin 0` locks the hot desk on the
  leave, opens no guest session, emits `workstation_auto_locked`, next click is the sign-in screen.

## Item 5 — grant_foothold_actions skips `_` note keys

Status: already implemented (step 2b), confirmed, no change needed.

`NetworkModel.grant_foothold_actions` (`lib/break_escape/network_model.rb:256`) already walks the
scenario with `AuthorNotes.each_live`, which skips `_` note keys, so a grant parked in a note never
widens the server's allow list while a grant in free data (a minigame action list) is honoured.
Tests prove it: `test/controllers/break_escape/network_notes_not_live_test.rb` (a grant inside a
`_draft` note is not enumerated and its implant is refused `no_action`; an `_annex` room id is
honoured) and `test/unit/network_model_test.rb`. Both green (31 runs).

## Item 6 — dismissBlockingUi carried on while still blocked

Status: clear bug, fixed (test bridge).

`__test.dismissBlockingUi` (`public/break_escape/js/systems/test-bridge/index.js`) clicked the
button then answered `ok: true` with `stillBlocked: !!detectBlockingUi()`. A caller that trusts
`ok` (a scripted `dismiss` step) carried on against a page that was still blocked, for instance
after dismissing the tutorial prompt that sits over the session-resume overlay at startup.

Fix: when a blocker remains after the click, return `fail('still-blocked-after-dismiss', { clicked,
stillBlocked: true, blocker })`; return `ok: true, stillBlocked: false` only when the page is clear.
The `.claude/skills/*` playtest bootstrap loop ignores the return value and re-reads blocking each
pass, so it is unaffected; the `dismiss` step command and the `tools/` callers now see the failure.

Proof: browser proof on :3620 (game 3138, m01), real bridge + DOM, three cases:
- dismiss a blocker that reveals a second → `ok:false`, reason `still-blocked-after-dismiss`;
- dismiss that second while the mission's own UI still covers the canvas → `ok:false` (no carry-on);
- dismiss an overlay over a clear canvas → `ok:true`, `stillBlocked:false`.
Script `scratchpad/hard-fixes/dismiss-proof.mjs` (PROOF PASS). Doc updated: `docs/test-bridge.md`.
R1 minor 3: a committed regression test now guards the branch, `test/js/test-bridge-dismiss.test.mjs`
(3 tests): over a stubbed state.js/DOM, a click that leaves a second blocker returns `ok:false`
reason `still-blocked-after-dismiss`, a click that clears returns `ok:true stillBlocked:false`, and
nothing-to-dismiss returns `ok:true`. Fails on the old `ok:true` behaviour (verified by mutation).
Related, left open: backlog line of 2026-11-13 (barkDelay R2 n2) covers the wider pressKey/_pick
"no change" reporting and getState hiding blockingUi during a minigame; out of scope here.

## Item 3 — A cut exchange keeps its hold

Status: clear bug, fixed (engine).

`_startExchange` holds both NPCs' `useUntil` out to the knot's end (capped). On a cut (`_endChat`
cut branch, `complete: false`), `_finishExchange` ran but nothing lowered `useUntil`, so an NPC
stood at the object for the rest of the lines that will not play while anyone queued behind it
waited. A frozen NPC (a player conversation) carried the same inflated hold as `useRemaining`.

Fix (`public/break_escape/js/systems/npc-needs.js`):
- `_startExchange` records the pre-hold use end for each held side (`ex.aUseBefore`, `ex.bUseBefore`;
  B only when it is not a queue front, which `_holdExchange` does not hold).
- New `_releaseExchangeHold(state, before)` lowers a still-using NPC's `useUntil` to that pre-hold
  end (never below now) and takes the same amount off `useRemaining` when it is set (the frozen
  case, whose `useUntil` is recomputed from `useRemaining` on unfreeze).
- `_endChat`'s cut branch calls it for both NPCs. A completed exchange is untouched.

Tests (`test/js/npc-exchange-heard.test.mjs`, 2 new, 17 pass): a cut by a knock-out restores the
still-using NPC's `useUntil` to its own pre-hold end (< the knot-end hold); a cut while an NPC is
frozen in a player conversation hands the hold back off `useRemaining`. Re-ran the npc-needs
importer suites: 693 further node tests pass.

## Item 4 — A locked start item can never be opened

Status: BUILT (option A, orchestrator decision 2026-11-13).

Decision (reason): option A, enable it. Hardening should not block intended play; a locked start
item an author ships should open, and the answer stays server-side (the user may overrule). Option B
(a validator error forbidding the feature) was the fallback and is not taken.

Built:
- `Game#find_scenario_object` (game.rb) now adds `scenario_data['startItemsInInventory']` as a source
  after the released-NPC-container source, iterating each authored start item through
  `find_object_in_contents`. This is the lookup `validate_unlock`, `pin_cracker_feedback` and
  `password_case_mismatch?` share, so all three resolve a locked start item's answer. The answer is
  read from the authored scenario copy (which keeps `requires`), never the stored inventory copy
  (`initialize_player_state` strips it) and never a synced payload.
- The two controller contents lookups mirror the same source so an opened start item serves its
  contents: `find_object_in_scenario` (unlock reply) and `find_container_in_scenario` (GET /container).
- Security property holds unchanged: the bootstrap strips the answer via `filter_requires_recursive`
  (key/pin/password `requires`, plus `strip_lock_answers!` for combination/cryptex), and the stored
  inventory copy via `filter_requires_and_contents_recursive`. The new source only reads the raw
  server scenario, which never ships.

Tests (`test/controllers/break_escape/combination_cryptex_unlock_test.rb`, Rails integration on the
real routes): existing "a locked start item is stored without its answer and ships none" already
proved the no-leak property; new "a locked start item opens with the right answer and is refused
with a wrong one" drives POST /unlock (cryptex and combination), GET /container and GET /scenario:
the item opens only with the right answer, serves its contents through both the unlock reply and the
container route, and neither the answer nor any client payload carries it. Full file green (14 runs,
118 assertions). The start-items source is possession-independent: a locked start item the player has
dropped or given away can still be opened by someone who knows its answer. The answer stays
server-enforced, so this is within the cheat policy, but confiscating such an item does not hide its
contents. Related tests re-run green: `npc_container_unlock_test.rb`,
`unlock_response_filter_test.rb`, `access_model_desktop_test.rb`, `game_test.rb` (138 runs together).

Browser proof (PASS): no shipped scenario holds a locked start item, so one was added to the small
test scenario `test_unlock_gaps` (a cryptex-locked "Pocket Cryptex" in `startItemsInInventory`,
answer POCKET, holding a note). The validator stays at 0 errors for it. On the keyless server on
:3622 (worktree server, headless chromium), a fresh game was opened and the real page's `ApiClient`
was driven exactly as the lock minigame does on submit (`ApiClient.unlock('object',
'test_start_cryptex', <attempt>, 'cryptex')`): the start item is in the client tray, a wrong answer
is refused ("Invalid attempt"), the right answer opens the item and serves the note contents
(`test_start_note`), and the answer does not appear in the reply. Proof script kept in the agent
scratchpad (hard-fixes-2/locked-start-item-proof.mjs); the one-off mission registration (one row,
not a re-seed) was done with hard-fixes-2/register_mission.rb.

### Original decision write-up (kept for reference)

Status: needs a decision (not built).

Confirmed on the code. A start item lives in two places: the stored inventory copy in
`player_state['inventory']`, which `initialize_player_state` now runs through
`filter_requires_and_contents_recursive` (game.rb ~5744-5754), so its lock answer and contents are
stripped; and the authored `scenario_data['startItemsInInventory']`, which keeps the answer. The
server's object unlock path (`validate_unlock`, game.rb:3155), `pin_cracker_feedback` (3250) and
`password_case_mismatch?` (3262) all resolve the lock through `find_scenario_object` (3316), which
walks rooms, account profiles, resources, held grants, held USB sticks and released NPC containers,
but not `startItemsInInventory`. So a locked start item is found nowhere with its answer: its
`/unlock` can never pass. No shipped scenario has a locked start item (checked the corpus), so this
is latent.

Options:
- A. Enable it: add `scenario_data['startItemsInInventory']` as a source in `find_scenario_object`
  (iterate each authored start item through `find_object_in_contents`, after the existing sources).
  The answer is read server-side only, never synced, so the stripped client copy is unaffected and
  the security property (no answer reaches the client) holds. Pattern-matches the held-grant and
  held-USB sources already there, and fixes the pin-cracker and password-case paths at the same
  time. Small and low risk; adds the locked-start-item feature. Needs: a Rails test that opens a
  locked start item (cryptex/key) and a test that no lock answer reaches the client by any sync.
- B. Forbid it: a validator error on a `startItemsInInventory` item (at any depth) with
  `locked: true`, so authors cannot ship an unopenable item. Smaller, but removes the capability.

Recommendation: A. Hardening should not block intended play, a locked start item an author ships
should open, and the answer stays server-side. B is the fallback if locked start items are judged
out of scope. Left for the orchestrator to greenlight before building.

## Item 2 — Re-issuing a revoked card id stays refused

Status: BUILT (validator warning only; option A, orchestrator decision 2026-11-13).

Decision (reason): the server stays grow-only. Un-revoking a card would be a cheat route past a
captured credential, so the stickiness is correct and must stay (the user may overrule). No server
change. Built the optional validator warning (option A) as an authoring aid.

Built (`scripts/validate_scenario.rb`, `check_revoke_card_globals`): the existing check already
required `globalVariables.revoked_card_ids` to be a declared array whenever a `revoke_card` action is
present. It now also collects every `card_id` a `revoke_card` action cancels and every `card_id`
handed to the player (a `give_item` action's item, or a `startItemsInInventory` item, including a
nested `rfidCard`/`card`/`contents` card_id), and warns on the intersection: the card is grow-only
once revoked, so a re-issued card under the same id would be dead; give a re-issued card a fresh
card_id. World-object cards the player clones or takes (the intended revoke mechanic) are not
"handed over", so they do not warn. Advisory only; no `validator_known_failures.json` entry.

Tests (`test/js/validator-revoked-card-reissue.test.mjs`, 6 tests, all pass): a give_item re-issuing a
revoked id warns; a start item with a revoked id (including a nested rfidCard) warns; a revoked
world-object card the player clones does not warn; a given card never revoked does not warn; the
declared-array error still fires; no revoke_card action means no checks. Corpus run: no re-issue
warning and 0 errors on `test_clone_left_card` and `lab_physical_pentest` (the two revoke_card
scenarios), so the warning fires on nothing shipped.

### Original decision write-up (kept for reference)

Status: needs a decision (no server change; working as intended).

Confirmed on the code. `revoked_card_ids` is grow-only: `merge_global_variables!` (game.rb:341)
unions it on every sync, and `held_rfid_cards` excludes revoked ids, so once a `card_id` is revoked
it stays refused for the rest of the game. There is no un-revoke path (the revoked-cards review R1
found none). A scenario that revoked a card and later gave the player the same `card_id` again would
leave that card dead.

Decision under the cheat policy: the grow-only stickiness is correct and must stay. An RFID card is
a captured access credential; letting a client un-revoke one (through any sync, key, type,
carry-over, format or reload path) would be a cheat vector past a revoked secret. No shipped scenario
re-issues a revoked id, so no honest unlock is blocked today. The review itself concluded "no code
change needed now".

Options for the authoring foot-gun (a future validator aid, not a game-behaviour change):
- A. Add a validator warning on a `give_item` (or a start item) whose `card_id` some `revoke_card`
  action in the same scenario cancels, so the boundary is explicit. Fires on nothing in the corpus,
  so no known-failures entry is needed; purely advisory. Needs a corpus run to confirm no false
  positives and a small validator test.
- B. Do nothing; document that authors give a re-issued card a fresh `card_id` (already in the
  review).

Recommendation: keep the server behaviour; A is a low-value nicety the orchestrator can greenlight
if the authoring guard is wanted. Not built.

## Item 7 — Record the landing-page build and phish send server-side (DESIGN ONLY, not built)

Context (sync deltas 6b review R1 M1, accepted best effort under q78). The phish part-2 evidence
that gates a credential's reveal is read from client-written, client-synced state: the landing-page
record in `globalVariables.se_landing_pages` (per page: `built`, `meetsThreshold`,
`victim.submitted`) and the landed sent mail in `mailState` (per message: `targetId`, `link.kitId`,
`landed`). `CaptureProofs#capture_evidence_holds?` -> `phish_page_evidence_holds?` reads exactly
these, so a tampered client can forge a built page and a landed send and be served a phished
`capture.secret` that may be a hard-access value (a lock code, PSK or flag) without running the
minigame. There is no server route for a page build or a phish send today: both are client minigame
outcomes that reach the server only through the `sync_state` player_state merge.

What would be recorded (server-owned, the way footholds/plants are in network_access.rb):
- One append-only record per landing-page build, keyed by `page_id`, written by a new gated route
  the build minigame calls on completion. The gate verifies the page is authored
  (`CaptureModel`/scenario), that the chosen capture address and link kits are the authored ones,
  and stamps `built` server-side. `meetsThreshold` (enough convincing elements) is a minigame score
  the server cannot recompute without the minigame rules. Which path is allowed is not a free choice:
  when the served `capture.secret` is a protected value (see cheat bucket) the threshold check must
  move server-side, so the gate is fully server-owned. Only when the secret is not a hard-access
  value may the route record the client's asserted score with a bound and let the reveal gate treat
  it as a client control-flow step.
- One append-only record per phish send that landed, keyed by `targetId/kitId` (or a send id),
  written by a new gated route the mail-send path calls. The gate verifies the target is an authored
  phish target, the kit is one of the authored page's link kits, and the message was actually sent
  (not just drafted). `victim.submitted` (the simulated victim entering the credential) is a
  scripted minigame result; the server can record that the send to an authored target happened, but
  the victim's submission is a client outcome unless that logic also moves server-side. The same
  conditionality applies: when the served `capture.secret` is a protected value, `victim.submitted`
  must be decided server-side, because it is one of the two gates on the reveal.
- `capture_evidence_holds?` then reads these server records instead of `se_landing_pages` /
  `mailState`; the client copies stay for UI only. `phish_evidence_fingerprint` and the sync-skip
  machinery are retired for this path (the server no longer trusts the synced evidence).

Sync size: the records live in a server-written sub-store of player_state that the client never
writes back (like `footholds`), so nothing in the client's re-sent payload grows. The store is
bounded by (authored pages) + (authored phish targets x kits); both are fixed per scenario, so it is
a delta, never an ever-growing re-send. The reveal gate stops depending on the client re-sending
`se_landing_pages`/`mailState`, which shrinks what has to be trusted on each sync.

Cheat-policy bucket (the gate's decisive rule, review R1 major): the phished `capture.secret` can be
a hard-access value (a lock code, PSK or flag), so under the cheat policy the secret itself must be
server-hard-enforced. Recording the page build and the landed send as server facts, gated on
authored pages/targets/kits, moves part of the gate from "client said so" to "server saw an authored
build and an authored landed send". That is necessary but not sufficient, because the reveal is gated
on `rec['meetsThreshold'] == true` and `victim['submitted'] == true`, which are the exact values a
tampered client would forge.

The rule the build must follow, not a preference:

- When `capture.secret` is itself a protected value, a server-side threshold check and victim check
  are MANDATORY. The server must decide `meetsThreshold` and `victim.submitted` from what it has
  verified, never from a client-asserted outcome. A client that has not run the phish minigame must
  not be served the secret. Recording only the authored build and landed send, while still reading
  the two gate values from the client, leaves the very cheat this item closes open, so it is not an
  acceptable build for a protected secret.
- The client-control-flow fallback (keeping `meetsThreshold`/`victim.submitted` as client steps
  behind the server sanity check of an authored page and an authored landed send) is allowed ONLY
  where those two values are deterministic consequences of what the server has already verified, so
  that an authored build and an authored landed send to an authored target can reach the reveal by no
  path other than honest play. In practice that holds only when the served `capture.secret` is not a
  hard-access value: if the server records the build/send but cannot derive the two gate values from
  them, the fallback is a client-asserted gate and is ruled out by the clause above.

Honest play must still work: an SE lab that intends the phished credential to then sign in reads the
served `capture.secret`, so the server-owned gate must serve it the moment it has verified an
authored build and an authored landed send and (server-side) that the threshold and victim conditions
hold. The hardening closes the forge without blocking the intended solve.

Size estimate: M to L. Two new gated routes, a server-written store plus its gates (mirroring the
foothold/plant recording), reader changes in `capture_proofs.rb`, retiring the client-evidence
fingerprint for this path, and the server-side threshold/victim logic wherever a scenario phishes a
protected secret (mandatory there, per the cheat-policy bucket above, not an open decision), and
Rails tests (forged client page/send AND a forged `meetsThreshold`/`victim.submitted` refused for a
protected secret; honest build+send served; the SE sign-in still works) plus a hostile-input test.
Comparable in shape to the foothold-recording work already in network_access.rb. Not built here per
the brief.
