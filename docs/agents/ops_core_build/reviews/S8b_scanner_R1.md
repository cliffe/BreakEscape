# S8b leak scanner review, round 1 (early)

Scope: commit `4d8ef43ec` (unit 17): `tools/playtest/lib/helpdesk_leak_rules.rb` (new), five added lines in
`tools/playtest/lib/access_leak_scanner.rb`, the `verify-run.rb` edits, and the two test files. Review only; nothing was
fixed. Read against the server as built up to `3270cc574` (unit 18 has landed since: the own-phone approval now answers
`approvedBy: "own_phone"` on `POST mfa/approve?own=1`).

Every finding below marked "probe" was run: rows built with the builder's own test helpers and scanned by the real scanner
(a scratch test outside the repo, run through `bin/rails test` under the shared lock). The probe ids (P1 to P6) are quoted
so unit 24 can turn each into a test.

Counts: 1 blocker, 5 major, 7 minor.

## What holds

- **The copy is deep enough.** `hd_strip_own` (`helpdesk_leak_rules.rb:496-504`) removes `code` only from the root of an
  exact six-key own-device answer, `ownPhone` only from the root of an exact `mfaRequired` answer, and `numbers` only from
  entries of an exact `{requests: [...]}` answer; the original body is never changed (a `dup`, and new entry hashes). Each
  of the three forms needs an exact key set and scalar values, so no second key can sit beside the stripped one. The three
  forms are on three different routes, so no body gets two strips. Nothing after `scan_mfa` in the row loop reads `body`.
- **Missing proof passes the body through unchanged, and both rule sets report.** From the builder's passing tests
  (`access_leak_scanner_helpdesk_test.rb:305-387`), my P1 output and the code: own code with no grant
  (`helpdesk:own:device` and `mfa:key:code`); own code before its grant; own code with only a password grant; own code for
  an account no desk covers; `ownPhone` with no grant (`helpdesk:own:ownPhone`, `mfa:answer:mfaRequired`, `mfa:key:number`,
  and the step is not opened, so the later pass is `mfa_session`); own list with no grant, with a wrong username, with a
  second query parameter, with `own=2`. Read from the code only, not run: a held-device answer on `?npc_id=` and an own
  answer on `?item_id=` (the ids disagree at `:399` and at `access_leak_scanner.rb:3679`, so nothing is stripped and
  `mfa:key:code` reports, in a scenario that has a code device: see R1-L5).
- **Grant credit.** A grant for an account no desk covers, a password two accounts share, a callback desk with the phone
  not held, taken after the grant or dropped before it, a stop on a row with no time: none is credited (builder's tests at
  `access_leak_scanner_helpdesk_test.rb:257-303`, re-read against the code at `:278-307`). A `granted` body on another
  route or path earns nothing (P6f).
- **Inert without a helpdesk.** `scan_helpdesk` returns the same body object when the scenario has no `helpdesks`, no
  `resetPassword` and no `recovery` (`:144`). The scanner diff is five added lines and no removed line; `verify-run.rb` is
  three added, one changed (the `if` that decides whether the access section prints). No existing test file is in the
  commit.
- **Existing tests.** `flock … bin/rails test test/unit/access_leak_scanner*.rb
  test/controllers/break_escape/access_leak_scanner*_test.rb`: 408 runs, 4450 assertions, 0 failures, 0 errors (seed
  60363). The same set without the helpdesk test: 384 runs, 0 failures, 0 errors. Two earlier runs gave 47 and 59
  `ActiveRecord::AssociationTypeMismatch` errors (two `BreakEscape::Mission` class objects) in the `*_real_test` files; the
  second of those, re-run with its own seed (48617), passed 88 of 88. I could not reproduce it and did not find the cause.
  It happened while other builders were working in the tree. It is not explained by this commit, but it is not explained
  at all: see "for the owner".

## Findings

### R1-L1 (blocker): the playtest, played in its written order, cannot scan clean

`helpdesk_leak_rules.rb:280`, `:302-307`, `:316-317`. A stop on any desk for any username stops credit for every grant for
300 seconds. `PLAYTEST.md` beat 2 ends with `triesLeft: 0` then `blocked` for `it_desk|u.reyes`; beat 5 (Tess's password),
beat 8 (the repeat), beat 9 (Wim's second step) and beat 12 (Vera's) are grants that follow. The script says the run never
waits five minutes.

Probe P5a (the real `test_ops_helpdesk` scenario; refused 2, 1, 0 at 100 s, 110 s, 120 s; `blocked` `retryIn: 290` at 130 s;
Tess's `granted_password` at 200 s; then beats 6 to 14): 18 findings, starting `helpdesk_grant helpdesk:grant:password`
and `helpdesk_secret helpdesk:reset:tess` on the grant row, then the keyring entry, both second-step grants and every own
form after them. P5b (the same rows with the reset at 520 s): one finding only (R1-L4).

No value leaks here; the rule fails closed as written and the builder listed it as a limit. It is a blocker because the
stage's own scripted run meets it at beat 5, and the next move under pressure would be to loosen the stop rule.

Smallest fix that keeps the scanner closed: do not touch the rule. Move beats 2 and 3 (refused, stopped, unknown name) to
after beat 14 in `PLAYTEST.md`, and have unit 23 record its capture in that order, so no grant follows a stop inside its
window. The scanner then never has to judge "a grant for another username while one username is stopped". Whether it ever
should is an owner question (below): no answer names the username, and the brief forbids both an echo and any further key
on a refusal.

### R1-L2 (major): one grant row credits two accounts' number choices in one own-phone list

`helpdesk_leak_rules.rb:447-449`. `hd_own_phone_entries` asks `hd_account_earned?` once per owner, each against the
accounts allowed so far, and only then adds all the owners. Two owners new to the set each match the one row.

Probe P2 (builder's grafted `test_ops_mfa`, `code_pc1` pointed at the number-match policy so two such PCs exist): rows
`grant_mfa`; `POST login` `mfaRequired` for `nia` at `match_pc` number 47 (no `ownPhone`); the same for `hana` at `code_pc1`
number 55; `GET mfa/phone?own=1` with `requests` for `nfaraday` `[31,47,62]` and for hana `[12,55,90]`. Result: 0
findings; both `numbers` arrays are stripped before `scan_mfa`. Control P2b (the same two entries as two separate lists):
the second is reported by both rule sets. The server's own list really does carry several owners
(`mfa_sign_in.rb`, `mfa_own_phone_answer`), so the shape is a live one.

Fix: replace the per-owner test at `:447` with one test over the whole answer,
`hd_rows_match?(@hd_own_accounts | owners)`, keeping the per-owner enrolled and covered checks. This goes away entirely
once a grant names its account (R1-L6).

### R1-L3 (major): stripping `ownPhone` hides the own-phone step from the older rules, which then accept an owner's approval

`helpdesk_leak_rules.rb:425-432`, `:501`; `access_leak_scanner.rb:4061-4062`. After the strip, `scan_mfa` opens an ordinary
step. An ordinary `push` step may be closed by `POST mfa/prompt` with `approvedBy: "owner"`. The server never does that for
a re-enrolled account (it answers `waiting: "own_phone"`), so this is a session with no proof the server could have
produced it.

Probe P1 (`test_ops_mfa`, `cal` given recovery answers so the desk covers him; his prompt habit is `pestered`): rows
`grant_mfa`; `POST login` 200 `{success:false, mfaRequired:true, mfa:"push", pcId:"push_pc", npcId:"cal", ownPhone:true}`;
`POST mfa/prompt` 200 `{success:true, npcId:"cal", username, displayName, via:"password", approvedBy:"owner"}`. Result: 0
findings. By the same code path (read, not run) an `approvedBy: "player"` approval is accepted when the run happens to
hold the old phone, which the server now refuses (`bd8c1bf27`).

Fix (in the helpdesk file, no existing rule touched): when `flags[:required]` is set, record the PC and account of the
own-phone step; while that step is open, a 200 success answer on `mfa/prompt`, or on `mfa/approve` with `approvedBy` other
than `"own_phone"`, for that account is a `helpdesk_secret` finding (`helpdesk:own:pass`). Drop the record when the step
closes (a pass, a cancel, an expiry, a new `mfaRequired` at that PC).

### R1-L4 (major): the honest own-phone approval is reported, and the session it opens is never held

`access_leak_scanner.rb:4062`. The approve rule needs `approvedBy == "player"` and the owner's phone taken. The server now
answers `approvedBy: "own_phone"`. Probe P5b line 15: `mfa_session mfa:session:wim` on beat 10's approval. Because the pass
is not credited, the step stays open and the session at `ops_pc` is not held, so later desktop rows for Wim would be
reported too. The builder listed the first half.

Fix: one hook clause in `mfa_pass_pc`'s `approve` branch, the predicate living in the helpdesk file:
`… && ((body['approvedBy'] == 'player' && mfa_phone_taken?(npc)) || hd_own_approval?(body, info, pc, npc))`.
`hd_own_approval?` is true only when all of these hold: `approvedBy == "own_phone"`; the row's query is exactly `own=1`;
the open step at that PC was opened by an allowed `ownPhone` answer for that account (the record from R1-L3); the account
is still earned. It adds an allowance to an existing rule, so it needs the owner's word (a sixth line in a file shared with
S8c). Rewriting the copy so the old rule passes it (changing `approvedBy`) would be forging proof and must not be done.

### R1-L5 (major): a scenario with no authored code device: an unearned code passes both rule sets, and the honest own-code step is reported

`helpdesk_leak_rules.rb:393-405` (no `code` rule of its own), `:428-429`; `access_leak_scanner.rb:3574`, `:3654`, `:3760`.
The older rules treat a code as impossible when the scenario authors no code device, and give kind `none` to a `code` PC
for an account with no device. The server changed both for a re-enrolled account (`mfa_sign_in.rb`, `mfa_step_for`:
`… device_for(…).nil? && !mfa_reenrolled?(…)`).

Probe P3 (`test_ops_mfa` with every code device removed, desk grafted on):
- no grant; `GET mfa/device?npc_id=hana` 200 `{deviceId:"spare", displayName:"x", npcId:"hana", code:"482916",
  secondsLeft:9, used:false}`: 0 findings. Only a `deviceId` starting `own:` is watched, and `mfa:key:code` is off.
- honest: `grant_mfa`, `login.mfa_required_own_code` for hana at `code_pc1`, own device, verify pass: 3 findings
  (`helpdesk:own:ownPhone`, `mfa:answer:mfaRequired`, `mfa:session:hana`).

Fix: (a) in the helpdesk file, when any desk has `mfa` in `resets`, a `code` key whose value is six digits (however
spaced) is a `helpdesk_secret` finding unless it is the root `code` of an allowed own-device answer, whatever
`@mfa_code_possible` says; an authored non-six-digit code stays clean as today. (b) The honest half cannot be fixed inside
the helpdesk file, because the stripped answer is still refused by `mfa_required_answer_ok?`. Until a grant names its
account, leave it reported and say so; then a hook in `mfa_kind_at` (`… device_for(…).nil? && !hd_reenrolled?(npc_id)`) is
the tied fix. `test_ops_helpdesk` does not meet this (Vera has a device).

### R1-L6 (major): a second-step grant names no account, so a repeat answer or a grant for A allows B's own forms

`helpdesk_leak_rules.rb:288-289`, `:315`, `:470-493`. Listed by the builder; measured here.

- Probe P4: `grant_mfa`, `grant_mfa`, own device for hana, `ownPhone` login for nia: 0 findings. The server sends the
  identical body for a repeat request (`helpdesk_access.rb`, `grant_helpdesk!`, first line), and `PLAYTEST.md` beat 8 does
  exactly that for a password; a double click on Send does it for a second step. So in an honest run this is likely, not
  rare.
- Probe P4b: `grant_mfa` (for hana), `ownPhone` login for nia: 0 findings. One grant, any one covered account.
- The scanner also cannot tell which desk answered: in `test_ops_helpdesk` the questions desk covers Vera for `mfa`, so the
  callback condition is never the deciding one (P5c: the run with the phone row removed scans the same).

Nothing in the capture can tie it more tightly today. The password grant is already tied as tightly as it can be: by a
value one account owns. The keyring `.reset` entry adds nothing (it is judged from that same credit) and `lockoutPcIds` is
every PC with any lockout left (`game.rb:3801`), not the account's. Fix: the server answer, below.

### R1-L7 (minor): the keyring reset entry accepts any `label`, `how` and `displayName`

`:355-361`. Probe P6a: after a credited grant, `{…, label:"staff no 40612, manager Pia Hart", how:"two of two right",
account:{…, displayName:{x:"y"}}}`: 0 findings. The fixture does not vary `label` or `how`, and the server sends
`npc['displayName'] || npc['id']`. Fix: `label == "Reset"`, `how == "issued"`, `displayName` equal to that value.

### R1-L8 (minor): a form entry accepts any label text and a subset of `resets`

`:216-221`. Probe P6b: `questionLabels: {staff_no: "needs 2 of 2; verify questions"}`, `resets: ["mfa"]` for a desk that
resets both: 0 findings. Fix: the entry equals `HelpdeskModel.forms(@data)[desk_id]` exactly.

### R1-L9 (minor): `retryIn: 0` and `triesLeft` up to 8 are accepted for any desk

`:246`, `:250`. Probe P6c: 0 findings. The server sends `retryIn` 1 to 300 (a stop at 300 s is lifted first) and
`triesLeft` at most the largest `maxTries` less one. Fix: `between?(1, DESK_STOP_SECONDS)`; `triesLeft` at most the largest
`maxTries` among the scenario's desks, less one.

### R1-L10 (minor): the old device's code and the old phone's list stay allowed after an own form was allowed for the same account

`access_leak_scanner.rb:3669-3695` (unchanged, correctly), no rule in the helpdesk file. Probe P6e: `grant_mfa`, own device
for hana, take `hana_device`, `GET mfa/device?item_id=hana_device` with a code: 0 findings. The server answers
`enrolled: false` there and 403 on the old phone. Fix, once a grant names its account: for a re-enrolled account, a code on
its held device or a list on its held phone is a `helpdesk_secret` finding. (S8c's `device_in_use?` seam will need the
exception when it lands.)

### R1-L11 (minor): a callback grant's own forms stop being allowed when the phone is handed back

`:472` (`hd_desk_covers?` asked again at the time of the own form). Borrow the phone, get the grant, drop the phone, sign
in: reported, though earned. Fails closed. Fix: ask the cover at the grant only (the row's set already holds it).

### R1-L12 (minor): recovery answers are caught only as `{<question id>: <answer>}`

`:188`. Probe P6d: `{hints:[{id:"staff_no", answer:"40612"}], answers:{hana:["40612","Pia Hart"]}}`: 0 findings. The brief
calls the answers public facts and the `recovery` key is caught everywhere, so this is a limit to state, not a hole to
close; a hash holding a question id as a VALUE beside an authored answer for it could be added cheaply.

### R1-L13 (minor): file name and hook count differ from the brief

The brief names `access_leak_scanner_helpdesk.rb` and four lines; the commit has `helpdesk_leak_rules.rb` and five (the
rule text table entry), and no hook "where the device answer is judged" (the strip replaces it). Harmless, but the S8c
merge note ("keep both") should name the real file and lines, and R1-L4 would add a sixth.

## Instructions for the second scanner unit (24)

1. Apply R1-L2, R1-L3, R1-L5(a), R1-L7, R1-L8, R1-L9 and R1-L11 as written. Each is inside the helpdesk file and each
   narrows.
2. Make P1, P2, P3 and P6a to P6c tests that fail before and pass after. Keep P2b, P6f and the builder's near misses.
3. R1-L4 needs the hook clause; ask the owner first. Do not rewrite the copy to satisfy the old rule.
4. When the grant answers carry `npcId` and `deskId` (next section): replace `@hd_mfa_rows` and the matching
   (`:470-493`) with a set of earned account ids; credit a grant only when `npcId` is an account, `deskId` is a desk,
   `HelpdeskModel.covers?(that desk, that account, what)` holds, and for a `callback` desk the account's phone is held at
   that row; for a password, `npcId` must also be the one owner of the value. A grant answer without both keys is not a
   shape (finding). Then do R1-L5(b) and R1-L10, and delete limits (1) and (3) from the file header.
5. Do not narrow the stop rule (R1-L1) without the owner's ruling. Run the real capture in the reordered beat order.
6. Check in the real capture, and report rather than assume: that Vera's phone hand-over in beat 12 is a `POST inventory`
   add row with an `inv` tag (else `mfa_phone_taken?` is false and only the questions desk covers her); that
   `POST mfa/approve?own=1` keeps its query in `path` or `query`; that the bootstrap's `helpdeskForms` is at `$`; that the
   audit log rows (`HELPDESK`, typed name `z.nobody`) pass the existing log-row rules; that no bootstrap or feed hash has
   a key `staff_no` or `manager`.
7. The stripped copy must stay the only thing one rule set hides from another. Any new strip needs its own "exact key set,
   scalar values, one route" proof and a test that the unearned form reaches `scan_mfa` whole.

## What the server answers should carry

For the builder who owns the grant body (`HelpdeskAccess#helpdesk_grant_body`, `app/models/break_escape/helpdesk_access.rb`;
the route in `helpdesk_actions.rb` renders it unchanged) and the owner of `helpdesk_answer_shapes.json`:

- Both `granted` answers gain exactly two keys, on the first grant and on every repeat:
  - `npcId`: the scenario NPC id of the account the grant is for (`npc['id']`), a string. Never the typed username, never
    the normalised username.
  - `deskId`: the key of `helpdesks` the request was judged against (the server's own key, not the raw parameter).
  - So: `{ granted: true, what: "mfa", npcId: "wim", deskId: "it_desk" }` and
    `{ granted: true, what: "password", password: "…", lockoutPcIds: […], npcId: "tess", deskId: "it_desk" }`.
- No other answer changes. `refused`, `blocked`, `unavailable`, `not_found` and `bad_request` stay exactly as they are, so
  an unknown username and a wrong answer remain the same bytes.
- Why this reveals nothing unearned: the player has just met the desk's rule for that account; the same id is in the next
  `mfaRequired` answer for it and in the keyring entry's `account.npcId`; the desk id is already a key of `helpdeskForms`.
  It is not an echo of the typed username (brief section 3).
- The client must ignore both keys. `SHAPES` gains them with `vary` on both paths.
- Already done and needed: the own-phone approval answers `approvedBy: "own_phone"` and is asked with `own=1`.

## For the owner: limits that would remain

1. **The stop names no username.** Even with `deskId` on grants, a refusal names nothing, so "Ugo is stopped at the IT
   desk, Tess is granted there two minutes later" stays unprovable and reported. Choices: (a) keep the rule and keep
   stops after grants in every scripted run (recommended now); (b) allow the recorder to tag a `helpdesk/request` row with
   the request's `desk_id` and normalised `username`, as it tags `inv` and `login` today (the brief forbids relying on a
   recorder change, and a tag is the browser's word, used here in the loosening direction); (c) let `refused` with
   `triesLeft: 0`, `blocked` and `granted` carry an opaque per-key reference, which breaks "a refusal carries reason and
   triesLeft or retryIn and nothing else".
2. **Right answers and the typed username are never checked.** The scanner proves only that some desk could have granted
   it. A server that granted on wrong answers scans clean; that is for the Rails tests.
3. **A code's value is never checked.** With a grant for Vera, the old device's real code served in the own-device shape
   scans clean.
4. **A resumed game.** A stop, a grant or a phone taken before the first captured row is unknown: earlier grants make own
   forms findings (closed); an earlier stop is not seen (open, by at most 300 s).
5. **Authoring the scanner relies on but the validator does not enforce** (`scripts/validate_helpdesk.rb:152-156` checks
   only `resetPassword != password` for the same account): reset passwords unique across accounts; no reset password equal
   to, or a substring of, any other password or reset password; no keyring credential id ending `.reset`; no question id
   that is also an ordinary key in a served hash. Each breach fails closed (an honest run is reported), but a validator
   error would be kinder.
6. **The flaky class-mismatch errors** in the `*_real_test` files (see "What holds") need someone to find the cause; a
   scanner test run that sometimes errors is a bad base for "every existing test passes".

## Assumptions the rules make that the brief does not require

1. Every row has a readable ISO `t`, rows are in time order, and the recorder's clock agrees with the server's to well
   under a second (the stop window is `t` plus 300 s or plus `retryIn`).
2. Nothing but time lifts a stop, and the server's clock is wall time (true today: `mfa_now` is `Time.current`).
3. A stop on one desk and username is treated as a stop on all (the brief says per desk and username).
4. Each granted answer is a new grant (the brief says a repeat gets the same body).
5. `lockoutPcIds` holds only sign-in PC ids of the scenario; it may be empty.
6. The own device's `displayName` is the fixed text `My phone`; `secondsLeft` is 1 to the step length; the code is six
   digits.
7. `GET mfa/device?npc_id=` and `GET mfa/phone?own=1` carry exactly one query parameter; `own` is exactly `1`.
8. An own-phone list entry needs an open step the scanner saw opened at that PC for that account, and its `numbers` hold
   the number that sign-in showed (inherited from S8a's entry rule).
9. A `code` PC owes an account a step only if the account has an authored device (false for a re-enrolled account: R1-L5).
10. An own-phone step is closed by the same answers as an ordinary one (false: R1-L3, R1-L4).
11. A username belongs to exactly one account (the own list is matched by `creds.username`, unnormalised).
12. A callback desk's cover is judged by the phone being in the scanner's taken set, which only a tagged
    `POST inventory` add row fills.
13. `helpdeskForms` appears only at the root of `GET …/scenario`, never in a sync or room answer.
14. A keyring answer is `GET …/keyring` with `entries` at the root; any entry there with `source: "helpdesk"` or an id
    ending `.reset` is a desk entry.
15. The items in section 5 of "for the owner".
