# OPS_MFA_HELPDESK_PLAN, review round 1

Reviewer: Opus, adversarial. Plan: `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` (617 lines).
Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 2, 3, 5, 7, 8.

Grades: blocker, major, minor, nit. Pointers: `plan:N` is a line in the plan; code pointers are
paths in this worktree.

## Findings

Check numbers follow the brief for this round. "Verified" entries record a check that passed.

### Check 2: sign-in order and other session paths

**F1 (verified, no finding).** The insert point is right. `attempt_login!` checks the route,
lockout (`game.rb:3483`), password (`:3487`), `pc_admits_account?` (`:3489-3492`), then
`login_failures.delete(key)` (`:3494`) and `start_login_session!` (`:3496`). Between 3492 and 3494
is the correct seam. `start_login_session!` (`game.rb:4388`) is the only writer of a session record;
callers are `attempt_login!`, `attempt_credential_login!` (`credential_login.rb:76`), the owner
claim (`game.rb:3569`) and the guest claim (`game.rb:3653`). There is no separate borrow writer:
a borrow leaves a guest record that `claim_guest_session!` turns into a session.

**F2 (major) The pending record cannot re-judge a credential route "with the same helpers
`attempt_login!` uses".** Plan 5.2 (`plan:258-263`) stores `via`, `credential`, `foothold`, `from`
and says every later route "re-judges that route ... with the same helpers `attempt_login!`
uses". A `saved_connection` attempt is judged by different checks: `provable_connecting_credential`
(step 2), `connectsTo` (step 3), `credential_route_refusal(kind, pc, route)` (step 4), policy
`accepts?` (step 5) and `honours_lockout?` (step 7), all in `credential_login.rb:28-66`. Between
the first and second step the player can drop the planted device that proves the saved
connection, or the proof can lapse; the plan as written would still open a `via: 'credential'`
session at `/mfa/verify`. Fix: for a pending record with `credential`, re-run steps 2 to 7 of
`attempt_credential_login!` at verify/prompt/approve (factor them into one
`credential_login_checks` method returning a refusal or nil), and call `start_login_session!` with
`via: 'credential'`, the credential id and the right route; say whether `stamp_token_clock!`
(`:79`) can apply (it cannot, tokens skip) and that the answer carries `route` as at `:83-87`.

**F3 (minor) Screen lock and the way back in.** `session_lockable?` (`game.rb:3824-3830`) allows
locking any `via: 'password'` session because the player can type the password again. Under an
MFA policy the way back in is `attempt_login!` again, which now asks the second step; a player who
has since given the device back, or dropped the owner's phone, has locked themselves out of a PC
they held. The plan does not mention locking at all. Fix: state the rule. Either (a) an unlock of
the player's own locked session asks only the password (real systems vary; simplest is to treat
unlock as "session already open", like a claim), implemented by checking for a locked session of
the same account at that PC before the second step, or (b) keep the step and have the client warn
on lock. Recommend (a), and add a controller case.

**F4 (verified, no finding with a note).** Claims: `claim_login_session!` (`game.rb:3527-3572`) and
`claim_guest_session!` open a session someone else already signed in to; skipping the step is
right and teaches the plan's point. Both refuse a foothold, so they cannot be used remotely to skip
it. `token` and `assist_invite` skipping is consistent with them not honouring lockouts
(`credential_model.rb:24-26`). Note for the plan: an owner claim at an MFA PC becomes the cheapest
way round the step, and the validator warning at `plan:432-434` should list claimable owners among
"ways through", as it already lists tokens.

**F5 (nit) The `password` keyring kind meets the step; say so in 5.2.** The
keyring `password` kind is `connects: false` (`credential_model.rb:22`); the client types it into
`POST /login`, so it meets `attempt_login!` and the step. Plan 14.4 (`plan:574-575`) is right; say
so in 5.2 too so a builder does not add an `mfa` flag to `password`.

### Check 1: the code the plan did not read (plan 2.4, `plan:99-110`)

**F6 (major) `pc-sessions.js` turns a 200 `{ success: false }` into a generic error, and the
second step has no way to update the session mirror.** `api.login` only throws on non-2xx; the
plan's `mfaRequired` answer is status 200 (`plan:362-364`), so it reaches
`pc-sessions.js:552-554`, which returns `{ ok: false, reason: 'error', message: 'Sign-in failed' }`
and the password screen shows it as an error (`password-minigame.js:2492-2495`). The same applies
to `signInWithCredential` (`pc-sessions.js:619-621`, screen at `password-minigame.js:2349-2370`).
The design survives, but the plan must say: (1) both `signIn` and `signInWithCredential` return a
new `{ ok: false, reason: 'mfa_required', mfa, number, pcId }` before the `success === false`
test; (2) the answers of `/mfa/verify`, `/mfa/prompt` (approved) and `/mfa/approve` are the normal
sign-in answer, so they must go through the same `_replace(pcId, session)` and
`_dropEnded(body.endedPcIds, ...)` that `signIn` runs (`pc-sessions.js:555-562`), and emit the
same `pc_signed_in`. Put that in one new public `PcSessions#completeSecondStep(pcId, body, via)`;
`mfa-client.js` must not write the mirror itself. (3) the password screen's `signInAccepted` side
effects, including `teachAfter('in_file', ...)` (`password-minigame.js:2480-2485`), run after the
second step, not after the first. Name the new `pc_signin_failed` reason for a wrong code.

**F7 (major) One minigame at a time: the device, the held phone and the sign-in screen cannot be
open together.** `MinigameFramework.startMinigame` ends any running minigame before starting
another (`minigames/framework/minigame-manager.js:66-99`), unless the running one opted in to
being suspended (`params.suspended`, the S12 parent/child hand-over). Plan 5.3 (`plan:320-336`)
has the player read a code on the `code-device` scene and approve on the `authenticator` scene
while the sign-in screen waits, and says X on the sign-in screen "abandons the attempt". As
written, opening the device from the inventory closes the sign-in screen, and approving on a held
phone happens with no sign-in screen open, so nothing on screen learns the session now exists.
Fix: (a) the code pane and the waiting pane each show a "Use <device name>" / "Check phone"
button when the inventory holds the owner's device or phone, which opens the scene as an S12
child of the suspended sign-in screen and returns to it (the code typed or the approval
answered); (b) state that closing the sign-in screen leaves the server's pending record alone
(it expires), so approving on a phone opened later from the inventory still signs in, and that
case updates the mirror through F6's `completeSecondStep` and shows a toast; (c) add both orders
to the scripted playtest.

**F8 (minor) `authenticator` live mode cannot be added without editing the shared branches, and
`mode` is already taken.** The scene already reads `params.mode` as a free role label (default
`'attacker'`, `authenticator-minigame.js:77`) and returns it in its result and test state
(`:445`, `:455`); the two existing "modes" are chosen by whether `choice` is present (`:9-18`).
The card builder `_appendCard(event, manual)` (`:408-429`) draws Approve and Deny as
`aria-hidden` spans, not buttons; `init` (`:106-170`) always draws the attacker intro and the
Send button and builds a timeline from params; `start` (`:172-189`) schedules playback. A live
mode needs branches in `init`, `start`, `_appendCard` and `closeResult`, so the plan's "its
other branches are not edited" (`plan:457`) is not true of a mode flag. Six scenarios use the
scene, not two (`ca06_texts_and_qr`, `ca06_texts_and_qr_defend`, `ca09_passwords`,
`ca09_passwords_defend`, `ca_pre_general_v2_ab`, `ca_post_general_v2_ba`), plus the episode
runner (`minigames/episode-runner/episode-runner-minigame.js`). Fix: a subclass
`AuthenticatorLiveMinigame extends AuthenticatorMinigame`, registered as its own scene
(`authenticator-live`), that overrides `init`, `start` and the card builder; extract only the
phone shell (`:129-149`) into a method both call, with a byte-identical DOM for the old scene.
Proof (5) in plan 10 then lists all six scenarios and the episode-runner tests.

**F9 (verified, with one requirement) `held_friendface_phone`.** `social_feed.rb:190-198` reads
the server inventory, matches `type == 'phone_friendface'` and `owner`, and requires the id and
owner to equal a declared phone. It does not call `ItemIdentity.client_forged?` or unwrap
`scenarioData` (contrast `credential_keyring.rb:50-61`); that is safe only because a client-built
item cannot carry `owner` (`games_controller.rb:3304-3306`). The plan can call it unchanged for
the push checks. Two consequences the plan must state: `held_friendface_phone(nil)` (the
"player's own" phone, `plan:371`) needs an ownerless `phone_friendface` item in the inventory,
which conflicts with open question 10 (see F14); and the new `held_code_device` should follow
`credential_held_proof_holds?` (forged test and unwrap), as `plan:266` already says.

**F10 (major) The NPC-offer rule is keyed to the phone only at the direct give path, so any met
owner's code device can be pulled with a crafted add.** Two places decide an NPC-sourced add:
`npc_room_drop_allowed?` (`game.rb:2152-2158`), which is type-generic (KO, or met and the NPC's
story offers that item type), and the direct NPC-held add in the inventory controller
(`games_controller.rb:3464-3475`), which applies the offer rule only when
`found_item['type'] == FRIENDFACE_PHONE`; "other held items keep the old rule" (met only). A
`code_device` in an owner's `itemsHeld` is therefore handed over to a player who has merely met
the owner. This defeats S8a's whole gate. Fix: in M1, change the controller test to a set,
`OFFER_GATED_TYPES = [FRIENDFACE_PHONE, 'code_device']`, used at `games_controller.rb:3470`,
with controller cases: met owner with no offer refused; offer in story accepted; KO accepted.
The validator should also warn when a `code_device` sits in `itemsHeld` of an NPC whose story
offers no give and who is `koImmune` (no way to get it).

**F11 (minor) The knock-out record is client-claimed, so "steal after a knock-out" is
best-effort; say so.** A KO is `room_states.*.npc_states.<id>.isKO` or `npcHostility.<id>.ko`
from the browser's sync (`game.rb:2008-2020`), accepted only for a met, non-`koImmune` room NPC
(`npc_ko_claimable?`, `game.rb:2029-2033`). A forged KO therefore yields any met, non-immune
owner's device or phone. That matches the existing phone and the user's cheat policy (combat is
client-side), but the plan should state it in section 7 and recommend authors set `koImmune` on
an owner whose device must be won in conversation. The plan's use of the KO only to refuse an
approval (`plan:294-295`) is right.

### Check 3: secrecy and cheat resistance

**F12 (major) Policies ship in the bootstrap, so `policies.*.mfa` is sent; section 7 says the
opposite.** `filtered_scenario_for_bootstrap` keeps `policies` and `defaultPolicy` on purpose
("hold no secrets and ship as authored (5.5)", `game.rb:2471-2473`); the schema says the same
(`scripts/scenario-schema.json:263`), and three client modules read `gameScenario.policies`
(`systems/pc-policy.js:33`, `systems/workstation-state.js:685`, `systems/npc-reports.js:334`).
Plan 7 (`plan:382`) says the policy map "stays server only, as today" and the kind "appears only
in the `mfaRequired` answer". As planned, every PC's MFA kind reaches the browser at load. Not a
secret that grants anything, but the plan's withheld-list and its no-exposure test would be
wrong, and `mfaDeclared` is redundant. Fix: decide. Either (a) strip `mfa` from each policy in
the bootstrap copy (one `except('mfa')` per entry beside `game.rb:2474`) and keep the plan's
claim, with a test; or (b) accept that the kind ships (a sign-in screen in real life tells you a
second step exists only after the password, so (a) teaches better). Recommend (a). Update the
schema description of `policies` to say `mfa` is server only.

**F13 (minor) A six digit code can be guessed when the policy has no `maxAttempts`.** Plan 5.2
puts wrong codes on the sign-in failure counter (`plan:268-270`); with no `maxAttempts`,
`record_login_failure!` never locks (`game.rb:4344-4350`) and two windows are valid, so a script
needs about 500,000 posts on average. The plan makes this a validator warning only
(`plan:437-438`). The server is meant to hard-enforce keys. Fix: a fixed cap of wrong codes per
pending record (for example 5, then the record is dropped and the password must be typed again),
independent of `maxAttempts`, in `MfaModel`; keep the shared-counter rule on top of it.

**F14 (major) The re-enrolled "player's own phone" has no client entry point, and the server
check contradicts open question 10.** H2 ends playable when "a re-enrolled account's second step
is answered from the player's own phone" (`plan:123`). Section 5.3 gives an entry only for a
held NPC phone ("Sign-in requests" beside its Friendface entry, `plan:334-336`); nothing says
where the own-phone requests or the own-phone code (`GET /mfa/device?npc_id=`) appear. Section 6
says `GET /mfa/phone` with a null `npc_id` uses the Friendface held-phone test (`plan:371`), which
for `nil` needs an ownerless `phone_friendface` in the inventory (`social_feed.rb:186-197`),
while question 10 recommends no phone item (`plan:612-614`). Fix: pick one. Simplest that fits
the code: the own-phone requests and code appear in the same push/code panes on the sign-in
screen itself ("Approve on your phone" button, "Your code: ...") with no item, so H2 needs no
new scene; then `GET /mfa/phone` serves only NPC phones. Otherwise require an ownerless phone
item and say the validator errors when `resets` includes `mfa` and the scenario gives none.

**F15 (minor) The number-match nonce and the two distractors must be derived, not drawn.**
`number(key, game_id, pc_id, nonce)` (`plan:220`) does not say where `nonce` comes from; a
`SecureRandom` nonce is a random draw, against "No random draw is added" (`plan:352`) and the
brief's seeded-rolls rule (brief 3). The three choices in `GET /mfa/phone` (`plan:371`) also need
an order and two wrong values. Fix: nonce is a per-game counter in `mfa` (attempts started), and
the distractors and their order come from the same HMAC.

**F16 (minor) A code is reusable for the whole window at every PC.** Verify accepts current and
previous windows and keeps nothing (`plan:231-236`, `plan:369`), so one read code opens every
`code` PC that admits the account for up to two minutes. That is a fair model of a weak
verifier, but real ones refuse a code already used. Fix: record `mfa.used[npcId] = window` on a
right code and refuse the same window again for that account (one integer per account, bounded);
or state the reuse as intended.

**F17 (minor) Push: say `>=` and what a held-phone prompt does to the count.** Decision 5
(`plan:282-283`) says the owner approves when `prompts[npcId]` "has reached" `promptPatience`.
Prompts sent while the player holds the phone (decision 2) or while the phone lies in a room
(decision 3) still increment the count (`plan:275`), so after the phone is put back the owner
approves on the next request at once. That may be intended (fatigue from earlier buzzing), but
the plan should say so and use `>=`. The patience count cannot be reset except by an approval;
it cannot be farmed for anything beyond what pestering already gives. Verified: `/mfa/prompt`
trusts only `pc_id`, and every input to the decision is server state.

**F18 (minor) Helpdesk: the typed username is stored, the desk can be reached from anywhere, and
the dialogue gate is best-effort.** (1) `helpdeskTries` is keyed `"deskId|username"` with typed
usernames for non-accounts (`plan:403`), yet the tests promise hostile `username` text is "stored
nowhere" (`plan:486-487`). Fix: count every unknown username under one key per desk
(`"deskId|?"`), which also keeps unknown and known names answering alike, or normalise and cap
the stored name at 64 code points. (2) The only presence check is that the desk NPC is in
`encounteredNPCs` (`plan:298-299`); a player who met the desk once can post requests from any
room. State it as best-effort under the cheat policy, or check that the player is in the desk
NPC's current room or the desk is a phone contact. (3) With `verify: "none"`, the conversation
decides nothing on the server; say that a `none` desk is a scenario choice to show a careless
desk, and that the ink only paces it. The verification of `questions` against `creds.recovery`
on the server is sound, and per-question rightness is not told apart (`plan:386`).

**F19 (minor) Recovery answers "learned from conversation" are banned by the plan's own
validator.** Plan 1 (`plan:33-34`) lists conversation as a source of answers; the validator
makes any `recovery` value that appears in ink an error (`plan:429-430`). Fix: drop
"conversation" from section 1, or allow answers in ink and keep the error for `resetPassword`
only.

### Check 4: server wall clock

**F20 (minor) Real time is acceptable here, but the plan should remove the two ways it can
strand a player.** The server already uses wall-clock time for token expiry and feed floors
(plan 2.2, checked at `credential_keyring.rb:114-125`), outcomes never depend on the digits, and
scripted runs read the code from the route, so determinism holds. The risks are play ones:
(1) a stale code typed just after the window turns counts as a wrong password towards a
lockout that never expires (`game.rb:4344-4350`); at `maxAttempts: 3` two slow typists lose the
account at that PC for the whole game; (2) `PENDING_SECONDS = 300` real seconds runs while the
game is paused or a menu is open. A simpler mechanic does exist and fits the code better: an
attempt-bound code (the device shows the code for the account's live pending record, derived
from the pending nonce, like a text-message code), which needs no clock, is single use, and
cannot be read early. It teaches less about time-based codes. Fix: keep (a) if the user wants the
ticking device, but do not count a code that matches either of the two windows before the valid
pair as a lockout failure (answer "code expired"), and pause nothing on the server; put the
attempt-bound code in open question 1 as option (b) instead of the button-press counter, which
can be pressed until a wanted code appears and has no learning value.

### Check 5: reuse and existing scenarios

**F21 (minor) Putting `approvesPrompts` into `PRESETS` changes the expansion of every awareness
NPC.** `expand!` writes `PRESETS[level].merge(own)` back into each NPC (`npc_habits.rb:103`,
`:158`) and its report carries the habits (`:159-161`). Existing fixtures and tests pin that
output: `test/fixtures/format_8c/test_access_habits.old.loaded.json`,
`test/unit/npc_habits_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`. Plan 10
concedes the extra key is written (`plan:455`) but proof (2) only compares bootstraps. Fix: do
not add the habit to `PRESETS`; resolve it at read time in `mfa_owner_approves?` from
`NpcHabits.level_of` with a separate `PROMPT_PRESETS` table, so the saved scenario of a game
without MFA is byte-identical. Also, `valid_parameter?` is hard-wired to `passwordPattern` as a
non-empty string (`npc_habits.rb:55-57`); `promptPatience` (an integer 2 to 9) needs a
per-parameter check there and in `validate_npc_habits.rb`, which the plan does not mention.

**F22 (minor) `ca03_helpdesk_reset` stays unchanged; two entries are missing.** S8b adds a top-level `helpdesks` and
an optional `helpdesk` on a pretext ask; ca03 has neither, its grant stays the client global at
`scenario.json.erb:760-772`. The new ask key is missing from plan 9's schema list (the ask is
`#/definitions/socialPretextAsk`, reached from `scenario-schema.json:3725-3729`), and
`pretext-judge.js` (which would open the form on a granted ask) is missing from the shared files
table (`plan:533-545`). Add both.

### Check 6: state

**F23 (verified, one nit) State is bounded and never sent.** `mfa.pending` is keyed by PCs the
server finds (`find_login_pc` first in every route), `prompts` and `accountResets` by accounts,
`helpdeskTries` capped. All are server-owned keys beside `ACCESS_STATE_DEFAULTS`
(`game.rb:3021`), so the sync body cannot write them. Nit: say expired pending records are
dropped on write as well as on read, so a game with many abandoned attempts does not keep them.

### Further design gaps

**F24 (major) A helpdesk password reset leaves the account's lockouts in place.** Lockouts never
expire (`game.rb:4344-4350`, `add_login_lockout!` at `:4366`), and `attempt_login!` refuses a
locked key before it reads the password (`game.rb:3483`). The classic recovery story (the player
guesses, locks the account, rings the desk) therefore fails at the locked PC even after a grant,
and the plan is silent on it (5.2 at `plan:305-316`, question 8). Fix: a `password` grant clears
`loginFailures` and `loginLockouts` for that account's username at every PC (and the client's
"lockout seen" mark through `lockout_pcs_for_client`, `game.rb:3586`); add a lockout-then-reset step to the plan's scenario beats F12 and F13 (`plan:508-509`) and a
controller case. If the user might want "a reset does not unlock", that is a real choice for
section 15 with this as the recommendation.

**F25 (nit) Authorisation.** Each new route needs its own `GamePolicy` method delegating to
`show?` (pattern `login?`, `friendface_phone?` at `app/policies/break_escape/game_policy.rb:85`,
`:121`), and the six action names go on the `set_game` list (`games_controller.rb:27-29`). The
plan's "authorised as `show?`" (`plan:357-358`) should name the policy methods so the per-role
access tests are written.

### Check 7: open questions (`plan:582-617`)

Real choices for the user, fine as asked: 1 (clock, with F20's option (b)), 5 (careful owner
reacts), 6 (talk an owner into reading a code), 9 (reset owner reacts), 11 (typed form or
dialogue choices).

**F26 (minor) Questions the plan should settle with a stated default.** 2 (wrong code on the
shared counter) follows from F13's cap and the existing lockout rule; 3 (count, not chance) is
settled by the brief's seeded-rolls rule and the plan's own design rule 3 (`plan:44`); 4 (presets)
is tuning and can be a default noted in the decisions file; 8 (old password stops) is what a reset
is; 10 (re-enrolment target) is an implementation choice and, as F14 shows, the plan's own
sections disagree on it. Move these to the body as decisions; keep the user's list to the five
real ones plus F12 and F24 if the orchestrator rates them as choices.

**F27 (minor) Decided silently.** (1) Whether a policy's `mfa` reaches the browser (F12). (2) That
fatigue carries across PCs and attempts and only resets on approval (`plan:285-287`): a tuning
choice with a teaching effect, should be a stated default. (3) Unlocking the player's own locked
session asks the second step again (F3). (4) That an owner claim skips the step (`plan:250-251`):
right, but it makes the claim the cheapest route round MFA in any scenario with a claimable owner,
which authors need warning of (validator info line, F4). (5) Question 7 recommends no engine rule
for giving a device back, though binding decision 6 says the player may *borrow* the device
(brief 2.6). Borrowing needs at least the existing give path to return a `code_device` and the
device route to then refuse; state that it works with the current give tag and test it (beat F3
could return the device afterwards and check `GET /mfa/device` answers 403).

### Check 8: completeness, stages, log rows, cross-plan

**F28 (verified) All 15 template sections are present** (sections 1 to 15, `plan:10-617`), with
per-field browser exposure, state, validator, graph, effect proof and tests.

**F29 (minor) Stage testability.** M1 is sized M but carries the device item, two routes, the
sign-in pane, a new scene, the validator, the schema and the graph; with F6, F7 and F10 it is
larger. Split M1 into M1a (server: policy, pending record, device item, offer gate, both routes,
controller tests, validator and schema) and M1b (client: pane, device scene, S12 child, mirror,
graph, scenario beats F1 to F5, live proof). M4 depends on F2's factoring and should say so. The
feature scenario has no beat for a foothold sign-in to an MFA PC, nor for unplugging the foothold
between steps (a controller case only, `plan:480`); add a scripted beat, since the route
re-judge is the riskiest server path.

**F30 (nit) Log rows.** The table (`plan:549-558`) is usable by S9. Name the `who` field as the
NPC id plus username (S9 rows elsewhere key on the NPC), and add `helpdesk_blocked` as its own
event or say it is `helpdesk_request` with result `blocked`. Rows from `/mfa/prompt` at 2 second
gaps up to 20 per attempt are many; say whether S9 should collapse a run into one row.

**F31 (verified) Cross-plan requests are reasonable** (`plan:563-580`). Request 2 (order S5c,
then S8, then S5a inside `attempt_login!`) fits the code: admission is already before the seam
and the session write is after it. Request 5 (rows without a session) is a fair ask of S9. Note
for request 2: S5c's account kinds may add their own lockout or admission branch to
`attempt_credential_login!` steps 5 to 7; F2's factored checks should be the one place both
plans extend.

## Summary

| Grade | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 7 | F2, F6, F7, F10, F12, F14, F24 |
| Minor | 15 | F3, F8, F11, F13, F15, F16, F17, F18, F19, F20, F21, F22, F26, F27, F29 |
| Nit | 3 | F5, F25, F30 (F23 carries one nit) |

Verified with no change needed: F1, F4, F9 (one requirement), F23, F28, F31.
