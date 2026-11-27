# S8b review, round 1: server, model, validator and graph

Branch `ops-helpdesk`, head `08d6d11c1`, every commit since the merge base with `main`. Read-only
review: no code changed. The probes below are scratch Rails tests that drive the real model and the
real route (`request_helpdesk!`, `attempt_login!`, `verify_sign_in_code!`, `approve_sign_in!`,
`POST helpdesk/request`); they were run with
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <file>` and are not committed.

Runs on this head: the twelve Ruby test files of this area, 159 runs, 0 failures;
`bin/ops-golden-compare`, 27 runs, 0 failures; `node --test` on `ops-unchanged-validator`,
`validator-helpdesk`, `dungeon-graph-helpdesk` and `validator-mfa`, 66 pass, 0 fail.

Counts: 0 blockers, 2 majors, 5 minors.

## Findings

### R1-SERVER1 (major): a second step left pending before a password reset still opens the session on the old password, and marks the new one as typed

`app/models/break_escape/helpdesk_access.rb:228-233` (the password branch of `grant_helpdesk!`)
clears lockouts and failures but leaves `mfaPending` alone. `second_step_refusal`
(`app/models/break_escape/mfa_sign_in.rb:37-50`) judges the route and the access list again, not the
password. `mfa_code_passed!` and `mfa_push_passed!` (`mfa_sign_in.rb:316`, `:372`) then call
`note_typed_sign_in!`, which sets `typed` for any account with a password reset.

So: type the old password at an MFA PC (the first step passes and waits), get the desk to reset the
password, then finish the waiting second step. The session opens although the old password is now
refused everywhere else, and `typed` is set although the new password was never typed, which frees
a saved connection made before the reset (`credential_login.rb:92`).

Probe (scenario `HelpdeskReenrolScenario.scenario(kind: 'code')`, fob held):

```
first    = {success: false, mfaRequired: true, mfa: "code", pcId: "sam_pc", npcId: "sam"}
grant    = {granted: true, what: "password"}
old password typed afresh at records_pc = {success: false}
accountResets before verify = {"sam"=>{"password"=>true}}
verify   = ok, success true, session {"id"=>"sam", "via"=>"password"}
accountResets after verify  = {"sam"=>{"password"=>true, "typed"=>true}}
```

This breaks the brief's security point 6 ("the old password fails after a reset; a saved connection
cannot outlive a reset"). The player holds the new password by then, so nothing new is reached; the
fault is that the two rules are not true on this path.

Fix, in `app/models/break_escape/helpdesk_access.rb`, password branch of `grant_helpdesk!`: delete
every `mfaPending` record whose `npcId` is this account (read `player_state['mfaPending']` only
when it is already a Hash, so no key is created). Add a model test in
`test/models/break_escape/helpdesk_sign_in_test.rb`: first step on the old password, grant, then the
right code and an own or held approval are both refused as a sign-in with no pending step, no
session is written and `typed` stays unset. Leave the `mfa` branch alone: a push that was waiting
when the second factor was reset is correctly moved to the own phone (probe E under "sound").

### R1-SERVER2 (major): the dungeon graph draws no `answer` edge for an answer that sits past the 64th character of its text

`scripts/generate_dungeon_graph.rb:1960` matches with
`hm_graph.normalise_answer(t[:text]).include?(want)`. `HelpdeskModel.normalise_answer`
(`lib/break_escape/helpdesk_model.rb:42-46`) cuts to 64 code points, which is right for an answer
and wrong for the text being searched. The validator does not have the fault: it normalises the
text without the cut (`scripts/validate_helpdesk.rb:365-369`).

```
$ ruby -e 'require "./lib/break_escape/helpdesk_model"; hm=BreakEscape::HelpdeskModel
  t="Records staff file. New starters on file: Tess Ama (t.ama), staff number 40517; ..."
  p t.index("40517"); p hm.normalise_answer(t).include?("40517")'
73
false
$ grep -c "|answer|" scenarios/test_ops_helpdesk/dungeon_graph.md
0
```

The stage's own scenario shows it: Tess's staff number is readable in `staff_file` and her line
manager in the feed post, the validator finds both (no "cannot find the answer" warning for Tess),
and the committed graph gives `desk_it_desk_tess_password` one requirement only, the room
(`dungeon_graph.md:129-130`). The unit 06 test passes because its note is 28 characters long
(`test/js/dungeon-graph-helpdesk.test.mjs:39`). The graph block's comment (`:1911-1916`) says the
grant hangs from "the readable homes of the recovery answers"; for any note of normal length it
does not. The graph also searches `readable_texts` only, while the validator adds
`set_member_texts` (feed posts), so a feed-only answer has no home in the graph even after the cut
is fixed.

Fix: add one text normaliser with no cut to `lib/break_escape/helpdesk_model.rb` (scrub, collapse
whitespace, downcase) and use it for the searched text in both
`scripts/generate_dungeon_graph.rb:1960` and `scripts/validate_helpdesk.rb:368`; in the graph block
search the same set of texts the validator searches. Add a case to
`test/js/dungeon-graph-helpdesk.test.mjs` whose answer starts after the 64th character, then
regenerate `scenarios/test_ops_helpdesk/dungeon_graph.*` and check Tess's grant gains its `answer`
edges.

### R1-SERVER3 (minor): after 200 other names a refusal tells an account from a non-account

`app/models/break_escape/helpdesk_access.rb:205-217` drops the oldest non-account entry past 200
and never an account's. The count and the stop of an unknown name can therefore be flushed, and
those of a real account cannot.

```
3 wrong for "zed" (unknown) and 3 wrong for "sokafor" (account): both stopped.
200 further unknown names, one wrong request each.
sokafor -> {reason: "blocked", retryIn: 300}
zed     -> {reason: "refused", triesLeft: 2}
```

The same shows without a stop (two wrong each, then 200 names: `triesLeft: 0` against
`triesLeft: 2`). It costs 200 requests, and usernames are printed on notes in play, so the gain is
small; but the standard for this stage is the same count behaviour for both. The cap is the
brief's own design (section 4.2), so the choice of fix is in "for the owner". The test
`helpdesk_access_test.rb:172` pins the eviction but not what a refusal then says.

### R1-SERVER4 (minor): the rule is not evaluated for an unknown username

`app/models/break_escape/helpdesk_access.rb:95-96`:
`npc = typed.empty? ? nil : account_for_username(typed)` then
`if npc && helpdesk_covers_request?(...)`. A real account runs the rule (answer normalising, or the
inventory scan of the callback rule); an unknown name skips it. The difference is microseconds
beside the save that follows, but it is a branch on "is this an account" that can be seen in code.

Fix, same file: always run the rule. Build the recovery map (empty for no account) and call
`HelpdeskModel.rule_met?` before the `npc &&` test, and for `callback` call
`held_friendface_phone` with the typed name when there is no account, then combine the results.

### R1-SERVER5 (minor): `approve_second_step` defaults `own_form` to true

`app/models/break_escape/mfa_access.rb:135`. The shared subject function accepts an own-phone
approval unless the caller says otherwise; `approve_sign_in!` defaults `own` to false
(`mfa_sign_in.rb:198`) and is today's only caller for a `pc` subject, so nothing is open now. A
later caller for a `pc` subject that forgets the keyword (S8c edits this file) would let a
re-enrolled account be approved with nothing proved.

Fix: default `own_form: false` in `app/models/break_escape/mfa_access.rb`. No S8a test depends on
the default for a re-enrolled `pc` subject (`test/models/break_escape/mfa_access_subject_test.rb`
passes `reenrolled: true` only for a non-pc subject, `:213`); run that file after the change.

### R1-SERVER6 (minor): reading the own phone writes `mfaAccounts` in memory

`app/models/break_escape/mfa_sign_in.rb:108` reads `used` through `mfa_account_for`, which creates
the account's entry (`mfa_access.rb:229-233`). Probe, re-enrolled Sam, after
`mfa_own_device_answer('sam')`: `mfaAccounts` went from `{}` to `{"sam"=>{}}`. The route does not
save, so nothing reaches the database, but the rule is that a read never writes.
`mfa_own_phone_answer` (`mfa_sign_in.rb:247`) also goes through the writing accessor
`account_resets`; its guard makes that harmless today.

Fix, in `mfa_sign_in.rb`: read `used` with
`player_state.dig('mfaAccounts', npc_id.to_s, 'used')` behind an `is_a?(Hash)` check in
`mfa_own_device_answer`, and read `player_state['accountResets']` directly in
`mfa_own_phone_answer`. Add an assertion to
`test/models/break_escape/mfa_sign_in_reenrol_test.rb` that `player_state` is equal before and
after both reads.

### R1-SERVER7 (minor): the docs say the validator ignores two extra ways to open the form; it refuses them

`docs/ACCESS_AND_NETWORKS.md:838`: "The form can also be opened by object type (`helpdesk_form`) or
the `trigger_minigame:helpdesk_form` ink tag; the validator checks only the three above." In fact:

- the ink tag is an error: `scripts/validate_scenario.rb:5438-5443` refuses any
  `#trigger_minigame:` type not in `ValidateSocial::Exercises::REGISTRY_TYPES`
  (`scripts/validate_social/exercises.rb:18-19`), and `helpdesk_form` is not in it
  (`ruby -e '... p REGISTRY_TYPES.include?("helpdesk_form")'` prints `false`);
- an `openMinigame` mapping of that type is an error for the same reason (`exercises.rb:147`);
- a `helpdesk_form` object outside a sign-in PC's contents is an error
  (`scripts/validate_helpdesk.rb:243`).

So a validated scenario has only the three documented ways, which is the safer state. Fix
`docs/ACCESS_AND_NETWORKS.md:838` to say so. Neither extra way gets round the desk in any case: see
"sound" below.

## Checked and found sound

- **Every way to open the form meets the same server rule.** The route never learns how the form
  was opened. Check 3 (`helpdesk_access.rb:148-152`) needs the desk NPC in `encounteredNPCs`, which
  only the server writes when it serves the NPC's room (`games_controller.rb:3148-3184`,
  `game.rb:915`), and no knock-out record. A desk not met or knocked out answers `unavailable` on
  every path (`helpdesk_request_test.rb:113`, `helpdesk_access_test.rb:75`). `pc_id` is optional by
  contract; with one, an open unlocked session is required and a real and an invented id answer
  alike.
- **Tries and stop.** One key per desk and normalised username. `"SOKAFOR "` and `"s\u0000okafor"`
  count on `it_desk|sokafor`; a name of spaces or control characters counts on `it_desk|`; none
  raised or answered 500 through the route. A repeat of a grant between wrong answers does not
  clear the count (wrong, wrong, repeat grant, wrong gives `triesLeft: 0`, then `blocked` even with
  right answers). A first grant of the other reset does clear it, which is A7 and needs the right
  answers. Desk ids are held to `^[a-z][a-z0-9_]{0,63}$` by the schema, so the `|` split of a key
  is safe.
- **Unknown against known name**, apart from R1-SERVER3 and 4: same status, body and row shape
  (`as.typed`, never resolved to an account); the typed name is in no answer.
- **Old phone after re-enrolment.** With a push waiting from before the grant and the old phone
  held: old list `:no_phone`, own list shows the request, old approve and old deny `:no_phone` with
  the record kept, own approve passes with `approvedBy: "own_phone"`. Number matching is covered at
  the route (`helpdesk_reenrol_test.rb:248`, `:272`).
- **`own`** is accepted only as `1`, `"1"`, `true` or `"true"` on `mfa/phone` and `mfa/approve`; an
  array or map value fails. `mfa/device` with both ids, or neither, is the 404.
- **Old password**: typed sign-in, `from` and `foothold` all go through `attempt_login!` and
  `effective_password`; a saved connection is refused `password_changed` until the new password is
  typed; an assist invite and a token are untouched by design. The one gap is R1-SERVER1.
- **Races and replays.** The request and every `/mfa/*` write run inside `with_game_lock`, which
  reloads the row. A second grant writes and logs nothing; a lockout earned after a grant stays.
- **Read-only views** `account_resets_view` and `helpdesk_tries_view` never create a key; every
  shared path guards on the stored key; golden compare is unchanged.
- **Grant body**: `npcId` is the account NPC's id and `deskId` the judged desk; the reset password
  is in the grant answer and the keyring entry only.
- **`device_in_use?`** is a private seam answering false, with one caller (`mfa_sign_in.rb:86`).
- **Log rows**: no answer text in any row; the reset password is a registered secret; identical
  refused and blocked rows merge with a count.
- **Tests**: no stage Ruby test alters an application class (two `define_singleton_method` calls
  are on one instance each).

## For the owner

1. **The 200 cap (R1-SERVER3).** Keeping an account's count while dropping a non-account's is what
   makes the two tell apart; capping both alike would let 200 junk names lift a real account's
   stop. Options: accept the oracle as it stands (it matches the sign-in failure cap this copies),
   or stop creating entries for new unknown names once 200 are held and answer them as stopped.
   The second closes the oracle for stopped names at the cost of a desk that refuses every new
   unknown name for five minutes after 200 of them.
2. **Notes and heard logins after a reset.** `login_postit_for` (`game.rb:3605`), the heard share
   (`npc_frustration.rb:498`) and `account_capture_passwords` (`game.rb:2738`) keep giving the
   authored password after a desk has reset it. It is then refused and counts towards a lockout.
   That reads as a stale note, which may be what is wanted; the brief does not say.
