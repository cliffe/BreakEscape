# OPS_MFA_HELPDESK_PLAN, review round 3

Plan reviewed: `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` at commit 92a4c6d60 (1125 lines).
Plan read end to end in ranges; code read at the lines each design point rests on. The diff from
1ac5579be was not read separately, since the whole plan was. Grades: blocker, major, minor, nit.

## Check 1: internal consistency

A grep for review ids, "changed", `M4`, `codeExpired`, `codeUsed`, `credential_login_checks`
and old question numbers is clean. Beat ids F1 to F18 are used consistently (open question 3
cites F5 correctly). Section 4.1's field table, section 7's table, section 8's reload paragraph
and section 9's graph paragraph no longer assume a saved connection takes the step or a phone
menu exists. Section 5.5's "read code" row (668) matches the `used` rule (611-612). Five state
keys are counted the same in 5.2, 8 and 10. Leftovers and contradictions found are N9 to N12
below.

## Check 2: R2 items

| R2 item | Grade | Status | Evidence |
|---|---|---|---|
| R2-1 room-site gate | major | closed | Plan 413, 421-424; beat F6; tests 896-902. Holds against the code: a player drop keeps the held copy with `owner` (`game.rb:1153-1157`) and is the only writer of `droppedItems` (`:1165-1166`); a stored NPC drop is already gated when stored (`game.rb:1122`); authored room objects come from priority 1 and 2 of `find_accessible_item` (`games_controller.rb:3644-3660`), stored drops from priority 0 (`:3607-3616`). The existing pre-rule test (`test/controllers/break_escape/friendface_phone_test.rb:332-343`) seeds `objects_added` with no `droppedItems`, so it still refuses |
| R2-2 child X | major | closed | 605-608 (`CodeDeviceMinigame extends SocialOverlayScene`, default `closeMode`), quiet release 594-598, JS test 937-940 |
| R2-3 used code counted | minor | closed | `code_state` 278-280, 450-455; `used` on the device route 443-445, 691; scene 611-612 |
| R2-4 snapshot targets | minor | closed | 105-110, proof 5 (867-874) names ca03's episode block, a timeline set and the reuse fixtures |
| R2-5 `super.init()` | minor | closed | 617-627 hook split; shared files row 1006 |
| R2-6 guessing and repeat grants | minor | closed, new issue | 461-466 per-account cap; 540-542 and 925-926 repeat clears nothing. The cap's permanence is N1 |
| R2-7 lockout key sites | minor | closed | 338-354. Count verified: built at `game.rb:3483`, `:3580`, `lib/break_escape/access_work.rb:1393`; split at `game.rb:3591`, `:4323`. Other readers (`npc_frustration.rb:816`, `social_feed.rb:66`, `:369`) pass the list to `AccessWork` and neither build nor split. No JS reads the key |
| R2-8 re-enrolment generation | minor | closed, one gap | 276-277, 468-470, 691. The old device still feeds `lastRead` (N2) |
| R2-9 stale `takeCompleted`, wrong-owner device | minor | closed | 589-598, 578-583 |
| R2-10 offer is static | minor | closed | 431-436, 734-737, warnings 809-812 |
| R2-11 saved connections | minor | closed | 175-176, 378-387, 914-917. Reset gap is N8 |
| R2-12 step names | nit | closed | 321-333, 1047-1050 |
| R2-13 harvest reads `effective_password` | minor | closed | 522-524, 1067-1073 |
| R2-14 log row mismatches | minor | closed by request | 1025-1033; request 8 (1077-1082) sends the three differences. The log plan still lists `request`, `credential` and no `own_phone` (`OPS_LOG_ROWS_PLAN.md:962-966`), which is S9's to copy. New log issues N3 to N5 |
| F27.5 note | nit | declined | Acceptable; Q3 stays with the user |

## Check 3 onward: new findings

### N1 (major) Thirty wrong codes close the account's code step for the rest of the game, decided silently, with no way back in most scenarios

Plan 461-466, 5.5 row 657, 538-539, 1039.

Once `mfaAccounts[npc].wrong` reaches 30, `/mfa/verify` refuses even a right code, at every PC.
The only thing that lifts it is a second-factor reset at a helpdesk (H2). A scenario with no desk,
or a desk with `resets: ["password"]` only, has no way back: a password reset clears lockouts
(529-534) but not `wrong`. If that account is on the critical path, the run is stranded. The
per-PC lockout already strands in the same way (lockouts never expire, `game.rb:4344-4350`), but
the plan answers that with the password reset; this new strand has no answer for most scenarios.
The plan reaches 30 only with no `maxAttempts` or several PCs, which is exactly the classroom
case of a student typing codes from the wrong device (see N2). Nothing in the validator warns,
and a closed step writes no log row (1039), so a defender's trace and the teacher's view both
miss it.

This is a user choice (how hard a soft lock may be), not a default. Fix: move it to section 15
with options: (a) permanent, as now, plus a validator warning for a `code` account a sign-in lock
needs where no desk resets `mfa`; (b) a password reset also returns `wrong` to 0; (c) the closure
lasts a fixed span of real time (the code already runs on real time, Q1) or of later code
windows; (d) per PC rather than per account. Recommend (c) with a short span, or (b) plus the
warning if real time is ruled out by Q1. Also write a `mfa_code_locked` row once, when the cap is
reached.

### N2 (minor) `lastRead` is one unkeyed value, so the pane can pre-fill a code that counts as wrong

Plan 566, 592, 612, 583, 691.

`lastRead` is "the last code a device scene showed that was not marked `used`", with no account
or device attached. The pane fills it in for whatever account is pending. Two ways it leads to a
counted wrong code, against the plan's own promise at 583: the player reads Moira's device, then
signs in as another `code` account; or the account was re-enrolled, the player opens the old
device from the inventory (still served, 691), and its code is noted and pre-filled. Each wrong
code costs a lockout count (`record_login_failure!`, `game.rb:4333-4353`) and one of the thirty
(N1). Fix: key `lastRead` by `npcId` and source (`deviceId` or own phone) and pre-fill only when
it matches the pending account and, for `ownPhone`, only an own-phone read. Have the item form of
`GET /mfa/device` add `enrolled: false` for a re-enrolled account's old device (no secret: the
player caused the re-enrolment), so the scene shows "no longer in use" and notes nothing. Add a
`mfa-signin-pane` JS case.

### N3 (minor) `helpdesk_request` rows tell accounts from non-accounts

Plan 1032, 1038, against 505-506.

A refused request for a real account is written `as: { account: username }`; one for an unknown
username `as: nil`. The answer bodies are the same on purpose, so the route cannot list accounts,
but a scenario whose log source covers the desk lets a player who can open that log reader read
the difference row by row. Fix: refused and blocked rows carry `as: nil` whatever was typed; only
`granted` (and the two `account_*` rows) name the account. The log plan's own `signin_denied`
with `as: { typed: }` (`OPS_LOG_ROWS_PLAN.md:288-294`) should be checked for the same question
by the orchestrator.

### N4 (minor) The blocked branch saves on every post

Plan 1032. "Blocked changes nothing else, so that branch calls `save!` for the row." The log plan
gates any added save on the helper's answer and caps repeats with `merge_limit`
(`OPS_LOG_ROWS_PLAN.md:247-249`, 13.2 step 8, `:650`). As written, hammering a blocked desk
rewrites the whole `player_state` per post. Fix: save only when the helper reports it stored
something, and pass a `merge_limit` (10, as `badge_swipe` does, `:328-329`).

### N5 (minor) The merge rule is paraphrased wrongly

Plan 1035: "merges an exact repeat of a source's newest row". The log plan merges any identical
repeat, alternating ones included (`OPS_LOG_ROWS_PLAN.md:645-648`: A, B, A, B leaves two rows).
A builder testing "newest row only" writes a wrong assertion. Fix: cite log plan 13.2 instead of
restating it.

### N6 (minor) The `typeToSignIn` client mapping points at the wrong branch and shows the wrong line

Plan 552-553. `pc-sessions.js:525-541` is `signIn`'s catch. `signInWithCredential`'s 422 branch
is at `pc-sessions.js:598-612` and maps through `credentialRefusalReason(b)`; it falls back to
`b.message || 'Incorrect username or password'` (`:607`). The server body in 382 carries no
`message`, so unless `credentialRefusalReason` learns the flag and the line is supplied, the
player is told the password is wrong. No JS test covers it (933-943). Fix: name
`credentialRefusalReason`, put the line in the server body or the screen, add a
`pc-sessions-mfa` case.

### N7 (minor) Proof 6's scan is a one-off claim, not a check

Plan 844, 876-878. My own grep agrees with the claim: `phone_friendface` appears only in
`scenarios/test_access_social/scenario.json.erb` (room object `player_phone` with no `owner`,
`:603`; owned phones only in `itemsHeld`, `:759`, `:861`, `:1192`) and
`scenarios/test_author_notes/scenario.json` (a start item and a `phoneOf` item). But a grep of
`.erb` sources cannot see generated objects, and nothing stops a later scenario. Fix: a unit test
that renders every scenario and asserts no item of an `OWNER_BOUND_TYPES` type with an `owner`
sits in room `objects` or container `contents`, or a validator information line ("this owned
device is takeable without its owner") so authors see the new behaviour.

### N8 (minor) A saved connection outlives a password reset

Plan 522, 664. `attempt_credential_login!` never compares a password (`credential_login.rb:22-89`),
and only `attempt_login!` reads `effective_password`. So at a PC with no `mfa`, a saved connection
captured before a helpdesk reset still signs in, while 5.5 says the old password "stops working"
and 378 says a saved connection stands for a password. Fix: a saved connection whose account has
`accountResets[npc].password` is refused as `ended: true` (step 8 already has that answer for
invites), or state that it survives and why. Add a keyring controller case.

### N9 (nit) Graph stage

Plan 829-832: graph work is "in scope for M1b and H1", but the push and number-matching edges
cannot land before M2 and M3. Say each stage adds its own edges.

### N10 (nit) Feature scenario cast

Plan 945: "three rooms, six accounts". The beats need at least eight distinct accounts unless
some are reused (two `code` owners, the exempt service account, low and high awareness push
owners, a number-matching owner, the locked helpdesk account, the `maxTries` account, the F18
account), and two `code` PCs (F4). List the cast and PCs.

### N11 (nit) Section 1 undersells the routes

Plan 18-19: the server "hands the device over only when the owner's story offers it or the owner
is knocked out", while 426-428 lists four routes, including a device left loose and a start item.
Say "takes it from its owner only when ...".

### N12 (nit) Section 2.1 row 80

"all three apply the rule to the phone type only" reads as if NPC drops are ungated for other
types. `add_item_to_room!` already applies `npc_room_drop_allowed?` to every NPC drop
(`game.rb:1122`); 418 says it right. Align the row, or cut it (trim list).

### N13 (nit) Proof 1 needs a baseline

Plan 854-856: "asserts byte-equal answers" does not say against what. Capture golden answers on
the base commit with time frozen, committed before the change, as proof 5 does for the snapshot.

## Check 4: what reaches the browser

No answer reveals a code, a matching number or a recovery answer before it is earned. Codes come
only from `GET /mfa/device` behind `held_code_device` or `accountResets[npc].mfa` (691); the
number reaches only the player's own sign-in screen and a held phone, unmarked (720); the
`mfaRequired` answer names `npcId` only after the password is proven (578-579, 698). Account
existence: the helpdesk answers are the same for unknown and wrong (505-506, 696); the leak is in
the log rows (N3). The 404 versus 403 on `/mfa/device` (691) tells only whether a policy has `mfa`,
which is public by ruling. The new keys stay out of the bootstrap, which is an allow list
(`credential_login.rb:107`).

## Check 5: `player_state`

Five flat `{}` keys (751-762), copied with `dup` (`game.rb:7576`), all server-owned, never synced
or sent. `mfaPending` one per PC with expiry pruning; `mfaPrompts` and `mfaAccounts` one entry per
account that reached the password step (bounded by authoring); `accountResets` per account;
`helpdeskTries` capped at 200 non-account keys. Route answers carry single values. Reload
(764-768) is right: the next password step overwrites the record and bumps `started`, which only
reshuffles numbers. Sound.

## Check 6: unchanged scenarios

Proofs 2, 3, 5 and 7 are real. Proof 1 needs a baseline (N13), proof 6 a standing check (N7).
Proof 4 ("no new error or warning line") holds since every new warning needs an `mfa` or desk
field.

## Check 7: tests

Mostly sound: the device gate cases would catch a gate on the wrong site (896-902); the stale and
cap cases would catch counting stale codes (905-908); the child hand-over test runs against the
real manager (937-940). Gaps: `typeToSignIn` mapping (N6), `lastRead` keying (N2), saved
connection after reset (N8), no guard that no site still builds the key inline (a grep-style
unit test would do).

## Check 8: binding rulings

Sign-in order (321-333): matches. Technique session meets no step (369, 1063); recovered and
collected passwords do (373, 1067). Kind public, answers not (55-57, 703-713). Device is a real
item, usable from the inventory alone (613). Spoken lines stay in scenario files (260, 635-642).
No runtime LLM. Log rows: snake_case, through the helper, no secret in detail (1042); the save
and merge wording breaks the helper's rules in two places (N4, N5).

## Check 9: open questions

The four questions are real, each with options and a recommendation. Decided silently and worth
asking: the permanence of the code-step closure (N1). N8 can be settled by the plan.

## Passages to trim

The plan can lose roughly 120 to 150 lines with nothing a builder needs:

- 2.1 table rows 71, 74, 80 and 82: restated at 367-371, 360-363, 410-424 and 419-420/724. Row 80
  is the longest and least accurate (N12).
- 2.3 authenticator bullet (95-112) repeats 617-629 and proof 5 (867-874): keep the pointers, cut
  the description to three lines.
- 2.4 last two bullets (139-155) repeat 584-598 and 605-608.
- 5.2 prose after the gate table (416-424) restates the table; 426-436 and section 7's best-effort
  list (734-743) say the same thing twice. Keep one, in section 7.
- 5.2 "Ways in that never reach / that do" (367-376) repeats section 1 (32-37) and requests 5-6
  (1063-1073).
- The saved-connection rule appears in section 1 (35-37), 3 (175-176), 5.2 (378-387), 5.5 row 659,
  9 (813-814), 14.4 (1059-1062). Keep 5.2 and pointers.
- Section 7 opening paragraph (703-713) repeats rule 4 (54-57) and 14.7 (1074-1076).
- 5.5 rows 657-658 restate 450-466.
- Section 9 warnings 804-812: four bullets on one device; one is an information line (807-808).
- Section 11 controller bullets (896-931) repeat the beats table and 5.2; keep only cases no beat
  covers.
- Requests 14.1 to 14.3 (1047-1058) restate 5.2; one line each pointing there.

## Summary

| Grade | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 1 | N1 |
| Minor | 7 | N2, N3, N4, N5, N6, N7, N8 |
| Nit | 5 | N9, N10, N11, N12, N13 |

Not checked: pointers the reviser took on trust (`episode-model.js:518-547`,
`minigame-starters.js:1334-1350`, `social_feed.rb:186-246` walk, `credential_keyring.rb:42-64`),
`password-minigame.js` line pointers, schema lines (`scenario-schema.json:261-280`, `:3725-3729`),
`validate_npc_habits.rb`, the leak scanner path, harness copy lists.

**Verdict:** the next round can be a delta review, once N1 is put to the user as an open question
(or ruled by the orchestrator) and the trim pass is done.
