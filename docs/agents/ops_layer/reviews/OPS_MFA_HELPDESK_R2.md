# OPS_MFA_HELPDESK_PLAN, review round 2

Plan reviewed: `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` at commit 1ac5579be (1013 lines).
The plan and the code were read in ranges. Grades: blocker, major, minor, nit.

Status: all five checks done.

## Check 1: closure of round 1

| R1 finding | Grade | Status | Note |
|---|---|---|---|
| F2 route re-judge | major | closed | `second_step_refusal` with `typed_route_refusal` and `credential_login_checks` (plan 5.2) |
| F6 200 `success:false` answer becomes a generic error | major | closed | `mfaRequired` tested first (5.3) |
| F7 one minigame at a time | major | partly closed | Child hand-over is designed. The X claim does not hold for `code-device` as written (R2-2) |
| F10 offer rule keyed to the phone only | major | partly closed | List at three sites. The room-site test now blocks the "left lying about" route (R2-1) |
| F12 `policies.*.mfa` ships | major | closed (by ruling) | Option (b) declared public. Sound |
| F14 own-phone re-enrolment entry | major | closed | "My phone" + `own=1`. One generation gap (R2-8) |
| F24 reset leaves lockouts | major | closed | Cleared at every PC. Repeat-grant gap (R2-6) |
| F3 screen unlock | minor | closed | `mfa_step_for` none for own locked session |
| F8 authenticator live mode | minor | partly closed | Subclass designed. The proof targets the wrong scenarios (R2-4), and `init` cannot call `super` (R2-5) |
| F11 knock-out best-effort | minor | closed | Stated in 5.2 and 7 |
| F13 code guessing with no `maxAttempts` | minor | partly closed | Cap is per attempt only (R2-6) |
| F15 derived nonce | minor | closed | `mfaAccounts.started` |
| F16 reusable code | minor | closed, new trap | Single use. A used code counts as wrong (R2-3) |
| F17 `>=` and held-phone count | minor | closed | Different fix, sound |
| F18 helpdesk key, reach | minor | closed | Different fixes, sound |
| F19 answers in ink | minor | closed | Different fix, sound |
| F20 real time | minor | closed | `codeExpired`, open question 1 |
| F21 presets resolved at read | minor | closed | `PRESETS` untouched, read at request time |
| F22 schema and pretext-judge entries | minor | closed | Section 9 and section 12 |
| F26 settle defaults | minor | closed | Section 5.5 |
| F27 decided silently | minor | closed | F27.4 info line in section 9. F27.5 different fix (below) |
| F29 stage split, foothold beat | minor | closed | M1a/M1b; beat F8 |

Counts: 7 majors, 5 closed and 2 partly closed. Of the 15 minors in the table, 13 are closed and 2 partly closed.

**The eight different fixes.**

- F12: sound. Rule 4 and section 7 state it, and the same rule binds other plans' policy fields.
- F14: sound. Reusing the two child scenes costs less than a new pane. It leaves the generation
  question in R2-8.
- F17: sound and simpler. A held-phone request tiring nobody is easy to teach.
- F18.1: sound. One key per typed name keeps `blocked` and `refused` from telling known
  accounts from unknown ones. The 200-key cap bounds it.
- F18.2: sound under the cheat policy. "Met and not knocked out" is the sanity check; a room
  check would break phone-contact desks.
- F19: sound. Only the `recovery` map is secret.
- F20: sound. The clock stays a user choice (Q1).
- F27.5: sound as a deferral. Q4 is honest that no tag hands an item back. A nit: office-life
  NPCs can already pick up a dropped item whose `needsTag` matches (`systems/npc-needs.js:3177`),
  so Q4(b) might reuse that instead of a new ink tag.

## Check 2: new material against the code

### R2-1 (major) The room-site gate refuses a device the scenario left in a room

Plan 5.2 table, row 2, and section 1 ("found where a careless owner left it"), 4.1 ("in a room
object ... if the owner leaves it lying about"), beat F6.

`find_accessible_item` returns an authored room object as `location: { type: 'room' }`
(`games_controller.rb:3645-3660`), the same type as a stored drop from `objects_added`
(`:3608-3613`). The room branch's owner test (`games_controller.rb:3439-3448`) runs on any room
item with an `owner` and asks `npc_room_drop_allowed?(owner, item)` (`game.rb:2152-2158`): the
owner is knocked out, or met and offers that type. With `OWNER_BOUND_TYPES` at that site, a
`code_device` with `owner: "moira"` placed on a desk in room `objects` is refused unless Moira's
story gives one or she is knocked out. That is one of the four routes in 5.2 ("the scenario left
it somewhere the player can reach"). The phone gets away with this today only because no
scenario authors an owned phone loose in a room. A device inside a container's `contents` is
unaffected (location `container`).

Fix: at `:3443` apply the owner test only to a stored drop (the item came from `objects_added`;
`find_accessible_item` can mark it, for example `location: { type: 'room', added: true }`), and
leave authored room objects under the ordinary room rule. Add a controller case: authored loose
device, owner unmet, pickup allowed; stored drop of a non-offered device, refused.

### R2-2 (major) A `code-device` child's X does not end as a normal exit unless the plan picks its base class

Plan 5.3, "A child started this way always ends as a normal exit, X included".

The framework's own X and Esc call `closeByPlayer()` → `complete(false)`
(`framework/base-minigame.js:125-133`, `:319-341`). `isNormalExit` needs `success === true`
(`minigame-manager.js:604-606`), so the suspended sign-in screen is released, its `onComplete`
runs once as `(false, { aborted: true, viaChild: true, ... })` (`:641-655`), and it does not
reopen. The claim holds only for a `SocialOverlayScene` child with the default `closeMode`
`'close'`: its own X calls `requestClose()` → `close()` → `complete(true)`
(`framework/social-overlay.js:127-142`), and it turns the framework X off with `disableClose`
(`:24-26`). `authenticator-live` inherits this, since `AuthenticatorMinigame extends
SocialOverlayScene` (`authenticator-minigame.js:65`), and `requestClose`'s lock applies only in
decision mode (`:437-441`), so the live phone is fine. The plan does not say what `code-device`
extends. As a plain `MinigameScene` with the device-frame X it breaks the flow: X on the device
drops the player out of the sign-in screen.

Fix: say `code-device` extends `SocialOverlayScene` (default `closeMode`, `mountThemedCloseControl`
for the steel X), or overrides `closeByPlayer()` to `complete(true)` when `params.returnTo` is
set. Also say what the sign-in screen's starter does with `onComplete(false, { viaChild: true })`
after a forced close of the child (a hit, a knock-out, a forced conversation). It must be a quiet
close, with no "Sign-in failed" toast. Add a node test: X on each child reopens `password`; a
forced child close releases it once.

### R2-3 (minor) A used code counts as a wrong code, and the pane pre-fills it

Plan 5.2 "Used once", section 6 `/mfa/verify` ("Window already used ... : wrong"), beat F4,
5.3 (code field filled from `lastRead`).

A code from the used window is refused as wrong: `tries += 1` and `record_login_failure!` on the
never-expiring lockout counter (`game.rb:4333-4353`). The device keeps showing that code until
the window turns. The second pane pre-fills `lastRead`. So the plan's own beat F4 (same code at a
second PC within the minute) costs a counted failure, and a player who signs in at two PCs
quickly walks towards a lockout through no guess at all. This is the mirror of the slow-typist
case the plan already exempts.

Fix: answer a code equal to the used window's code `codeUsed: true`, uncounted, like
`codeExpired`. Have `GET /mfa/device` return `used: true` (no new secret: the player used it)
so the device shows "wait for the next code" and `lastRead` is not pre-filled with it.

### R2-4 (minor) The authenticator snapshot proof names six scenarios that never open the scene

Plan 2.3 and section 10 proof 5.

`ca06_texts_and_qr`, `ca06_texts_and_qr_defend`, `ca09_passwords`, `ca09_passwords_defend`,
`ca_pre_general_v2_ab` and `ca_post_general_v2_ba` mention "authenticator" only in prose (for
example `ca09_passwords/scenario.json.erb:319`, `:507`). None carries `pushes`, `approvesAt`,
`pushTemplate` or an episode `mfa`. The only scenario that drives the scene is
`ca03_helpdesk_reset`, through its episode's `mfa` block (`scenario.json.erb:160`, `:174`
onwards, decision mode with `choice`) and the episode runner (`episode-model.js:518-547`).
`startAuthenticatorDevice` (`minigame-starters.js:1334-1350`) serves room-object phones; no
scenario uses one now. Decision mode is exactly where the extracted shell must keep
`phone.hidden = !!this.choice` (`authenticator-minigame.js:129-131`). The proof as written would
pass on six no-ops and miss the one real user.

Fix: snapshot `init` output for ca03's episode `mfa` params (decision mode), for a
`{ pushes, approvesAt }` timeline set, and for the fixtures in
`test/js/social-reuse-authenticator.test.mjs`. Rerun ca03 scripted, not ca06/ca09. Commit the
snapshot before the shell moves.

### R2-5 (minor) `authenticator-live` cannot call `super.init()` and cannot skip it

Plan 5.3. The parent `init` (`authenticator-minigame.js:106-170`) draws the intro, the choice
panel, the Send control and the controls row. A subclass that calls `super.init()` gets all of
it. One that does not loses `SocialOverlayScene`/`MinigameScene` init (frame, header, container
wiring) unless it calls `SocialOverlayScene.prototype.init.call(this)`, skipping a level, which
is fragile. Fix: keep the parent `init` as the one entry and split its body into hooks:
`_buildPhoneShell()` plus `_buildAttackerParts()` (intro, choice panel, Send, controls). The
subclass overrides `_buildAttackerParts()` to draw its own cards and calls `super.init()` as
normal. This is a second extraction in the shared scene, so the plan's "nothing else is edited"
line changes, and the snapshot (R2-4) is what proves the parent's DOM is unchanged.

### R2-6 (minor) Code guessing is still unbounded where there is no `maxAttempts`, and repeat grants can wipe lockouts

Plan 5.2, section 6, 5.5 row 1.

`tries` lives on the pending record and a new first step overwrites it. The shared counter is
per PC (`"<pcId>|<username>"`). With no `maxAttempts` (`record_login_failure!` never locks,
`game.rb:4346-4350`) the five-per-attempt cap costs a script one extra password post per five
guesses: about 600,000 posts for even odds. With `maxAttempts`, each PC under the policy gives
its own allowance. A password grant clears every lockout for the account, and a repeat of a
granted request "answers the same body again" (section 6). The plan does not say whether a
repeat clears lockouts again; if it does, a `none` desk becomes an unlimited lockout eraser for
code guessing.

Fix: add `MAX_CODE_WRONG_TOTAL` (for example 30) per account in `mfaAccounts[npc].wrong`; at the
cap `/mfa/verify` refuses for that account for the rest of the game (or until a second-factor
reset). Say a repeat grant returns the stored body and clears nothing.

### R2-7 (minor) The lockout key is built in four places and parsed in two; the helpers cover two

Plan 5.2 "The lockout key", cross-plan request 3.

Built: `game.rb:3482` (`attempt_login!`), `game.rb:3580` (`account_locked_out_at?`),
`lib/break_escape/access_work.rb:1393` (`AccessWork.locked_out_at?`, NPC frustration and feed
posts, plain Ruby with no `Game`). Parsed: `game.rb:3591` (`lockout_pcs_for_client`),
`game.rb:4323` (`account_login_key?`). The privilege plan counts six readers
(`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 2, Q6). `login_lockout_key` on `Game` cannot serve
`AccessWork`, so "change those two helpers and nothing else moves" is not true.

Fix: put `lockout_key(pc_id, username)` and `lockout_key_parts(key)` in a plain-Ruby module
(`AccessIdentities` already holds `normalise_username`); have all five sites call it, and
build `login_lockout_keys_for(npc)` on the parser. Add `access_work.rb` to the shared-files
table.

### R2-8 (minor) After re-enrolment, which generation does the old device's route serve?

Plan 5.1 `code(..., device_id, generation, window)`, 5.2 "Second factor", beat F18.

If `GET /mfa/device?item_id=` computes with the account's current generation, the old device
shows generation-1 codes and those verify, which is the reverse of beat F18. The own phone has no
`device_id`. Fix: state that verify for a re-enrolled account compares against
`code(key, game, "own:<npcId>", 1, window)`; the item route for a re-enrolled account answers
403 (the device is no longer enrolled), or serves generation 0, which never verifies.

### R2-9 (minor) A stale `takeCompleted` and the wrong-owner device

Plan 5.3. (a) "Approving with no sign-in screen open" also goes through `completeSecondStep`;
if that records `takeCompleted(pcId)`, the next time the player opens that PC, maybe much later
and after the session ended, the screen runs the accepted path and `teachAfter` on an old
session. Set `takeCompleted` only while a sign-in screen for that PC is suspended, or check it
against the mirror. (b) "a wrong owner's device simply shows a code that fails": that failure is
counted (R2-3, R2-6). The player proved the password, so the `mfaRequired` answer can carry the
account's `npcId` and the pane can show only that owner's device. That gives away nothing new.

### R2-10 (minor) "Story offers it" is a static text test

Plan 5.2 and 7 ("the device leaves its owner only on a story offer"). `npc_offers_item?`
(`social_feed.rb:265-273`) passes when a give tag for the type, or an unfiltered
`give_npc_inventory_items`, appears anywhere in the owner's ink or record. It does not check
that the player reached that knot. A crafted `POST /inventory` with the owner as source takes
the device right after meeting. That sits inside the cheat policy (ink-gated steps are
best-effort), but section 7 lists it as hard-enforced. Fix: list it under best-effort. Add a
validator warning when a device owner's ink has an unfiltered `give_npc_inventory_items`, and one
when a `code_device` is a declared grant (`games_controller.rb:3384-3399`: claimable at any time,
no trigger check).

### Verified with no finding

- `held_code_device` following `credential_held_proof_holds?`: sound. A client item cannot carry
  `owner` (`games_controller.rb:3304-3308`), and a sourceless room add is refused at
  `game.rb:1171` once the list applies there.
- `PcSessions`: the `mfaRequired` test placed before `pc-sessions.js:552` is right. Wrong codes
  come back as 422 through `record_login_failure!`, and the catch branch at `:525-541` maps them.
  `completeSecondStep` must add `mfaIncorrect`, `codeExpired` and `expired` to that mapping;
  the plan's reasons list covers it.
- State: five flat `{}` defaults copied with `dup` (`game.rb:7576`), never synced, bounded per
  PC or per account; `started` only reshuffles numbers the owner never approves, and
  `mfaPrompts` resets only on an approval. Nothing can be farmed beyond what pestering gives.
  Reload behaviour is as stated.
- "My phone" with no item: `/mfa/device?npc_id`, `/mfa/phone?own=1` and `/mfa/approve` all gate
  on `accountResets[npc].mfa`, which only a grant writes. Sound, apart from R2-8.

## Check 3: size

The plan grew from 617 to 1013 lines. Most of the growth answers round 1. Three blocks are more
mechanism than the outline (`OPS_LAYER_PLAN_OUTLINE.md:121-128`) asks for:

- **R2-11 (minor) Move M4 (keyring `saved_connection` second step) to a later slice.** The
  outline does not mention the keyring. M4 carries the `credential_login_checks` factoring, a
  second resume path in `MfaClient` (credential id), and the `via: 'credential'` branch of the
  re-judge. Until it lands, a saved connection to an MFA PC can be refused by the validator
  (error: `saved_connection` credential for a PC whose policy has `mfa`), which is honest and
  small. This also removes the M1a dependency on half of the factoring.
- **Approve from a held phone's own menu with no screen open** (5.3, beat F12, toast, stale
  `takeCompleted`). The child route from the push pane already teaches "the phone is the
  factor". The menu entry and the no-screen approval can wait.
- **`codeExpired` for the two windows before the accepted pair.** Once R2-3 adds `codeUsed`, a
  simpler rule covers both: only a code matching none of the last four windows counts as wrong.
  One sentence instead of two mechanisms.

What must stay: the device as an item with the owner-bound gate, the three kinds, the count
threshold, number matching, the route re-judge for typed sign-ins, the helpdesk with `questions`
and `callback`, lockouts cleared on a reset.

Stages: M1a is provable by controller tests alone, as the plan says. M1b, M2 and M3 are each
playable alone. H1 needs none of S8a. H2 needs M1b to M3 as stated. With M4 moved out, M1a drops
from "M" to a comfortable M. No stage is unprovable.

## Check 4: other plans

| Request | Other plan | Status |
|---|---|---|
| 1 sign-in order | Privilege plan section 2 and 14: "account-kind check inside step 6, then your second step" | Same sequence, different numbering. **R2-12 (nit):** the privilege plan's step 6 is admission; this plan's is the session write (5.2 list). Name the steps ("after admission") in both |
| 2 account kind does not change the step | Privilege plan `:313-314`, `:615-617` | Matches |
| 3 lockout key | Privilege plan Q6 leaves per-PC lockouts and counts six readers | No conflict on scope, but see R2-7: the helper must be the one place the privilege plan's own count describes |
| 4 keyring checks in one method | Privilege plan `:579`: "this plan changes only `pc_admits_account?`" | Compatible. If M4 moves (R2-11), say so in both |
| 6 recovered passwords | Privilege plan `:290` reads `effective_password(npc)` for a harvest once S8b lands | **R2-13 (minor):** this plan says "Only `attempt_login!` changes to call it" and an earlier capture keeps the authored value on purpose (5.2). The privilege plan's harvest calls it. Pick one: a harvest after a reset should yield the new password (the PC holds it), so list the harvest as a second caller here |
| 8 log rows | Log plan 13.1, 13.7 | **R2-14 (minor), mismatches:** event names `mfa_code` with result `ok/wrong/expired` (here) against `mfa_code_ok` / `mfa_code_wrong` with `ok/fail` (log 13.7); `by: own_phone` missing from the log's `mfa_prompt_approved`; `mfa_expired` detail `prompts`/`codes` missing there; `who` is "NPC id and username" here against `as: { account: username }` there; `helpdesk_request` for an unknown username: this plan says no who, and the log row says `{ account: }` (should be `as: nil`, since this plan bans logging a typed non-account name); detail key `agent` (log) against "desk NPC id" (here); `mfa_challenge` route code `credential` here is a separate `credential` key there. The log plan already merges repeats, which answers this plan's question in request 8. Align section 13 to log plan 13.7 or send the differences to S9 |
| 5, 7, 9, 10 | Core, any, S1, names | No conflict found in the parts read |

## Check 5: the six open questions

- Q1 (clock): a real user choice. It is the one real-time dependency in the ops layer, and the
  log plan (13.4) already notes S8 runs on wall time. Keep it.
- Q2 (careful owner reacts): a scope choice that touches the parked defence work. Keep it, or
  settle it as (a) in 5.5, since it adds nothing to build.
- Q3 (talk an owner into a code): the cheat policy decides it (codes are credentials, so they
  are hard-enforced). The plan's to settle as (a). Move to 5.5.
- Q4 (give back): a real choice about a follow-up slice. Keep it.
- Q5 (owner reacts to reset): same footing as Q2. Settle as (a) or merge with Q2 into one
  question about NPC reactions.
- Q6 (typed form): a real design choice with a teaching effect. Keep it.

Net: four real questions (Q1, Q4, Q6, and Q2 and Q5 merged); Q3 is the plan's.

## Summary

| Grade | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | R2-1, R2-2 |
| Minor | 11 | R2-3, R2-4, R2-5, R2-6, R2-7, R2-8, R2-9, R2-10, R2-11, R2-13, R2-14 |
| Nit | 2 | R2-12, the F27.5 note in check 1 |
