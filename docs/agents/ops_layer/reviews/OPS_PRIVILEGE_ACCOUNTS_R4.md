# OPS_PRIVILEGE_ACCOUNTS_PLAN: round 4 review (delta only)

Plan reviewed: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` at `e6a0ae290` (1007 lines),
delta from `10aa30ea8`. Status: complete, with the gaps under "Not checked".

`GM` is `app/models/break_escape/game.rb`, `NA` is `app/models/break_escape/network_access.rb`,
`NF` is `app/models/break_escape/npc_frustration.rb`, `GC` is
`app/controllers/break_escape/games_controller.rb`, `LOG` is
`docs/achitechture/OPS_LOG_ROWS_PLAN.md` (committed text, unmodified in the working tree). Plan
references are line numbers in the current file.

Totals: 0 blockers, 0 majors, 6 minors, 7 nits.

---

## Status of the round 3 items

| R3 item | State | Note |
|---|---|---|
| M1 log rows and the "once" rule | closed | Section 13 (l.866-884) matches `LOG:1115-1117` on event names, `as`, `where`, result, detail keys, bound and save rule; `signin_refused` with the optional `kind` matches `LOG:1128-1131`, `:1158`. One wrong sentence about the helper remains (N4) |
| m1 collect tells a sessionless client whether a PC exists | closed | Same 404 for both (l.525-528); the desktop's reach gate is reused (l.529-532). See n1, n2 |
| m2 `keyboard_admin?` on an off PC | partly | The stick can no longer be lost, but the stated agreement of client and server is wrong (N1) |
| m3 `pcs_accepting` is not the run-time keyring | closed | l.150-156, l.414, l.559-561 |
| m4 sign-in forced by the borrow | closed | l.30-32, l.750-752, l.808-810. See n3 |
| m5 `after: "borrow"` on a headless host | closed | l.223-225, l.645-646; matches `NF:354-356` |
| m6 `accountOnly` named where a person is expected | closed | l.660-664 |
| m7 collect answer cannot draw its panel | closed | `portrait`, `avatar` added (l.541-544). See n4 |
| m8 whose profiles an admin sees | declined, reason holds | Flat merge kept; the new warning needs a gate (N5) |
| m9 org-text rule for `domain` | closed | Pattern in schema and validator, `textContent`, hostile-value JS test |
| m10 "never re-recorded" | closed in design | The script needs three things stated (N6) |
| m11 tests | mostly closed | Stage tags done, vacuous case removed, the listed cases added. One JS case missing (N1) |
| m12 open questions | closed | Questions 1 and 5 now carry both choices |
| n1 to n6 | n1, n2, n4, n5 closed; n3 and n6 partly | See n5, n6 |

Decisions (round 3 section of the decisions file):

- **m8, flat merge.** Holds. `login_desktop_contents` and `find_login_item` already agree on one
  flat list, and a server-built folder per account would be new structure for a cosmetic gain.
- **m2, first option.** The choice is fine; the logged reason ("so client and server agree") is
  not true as the plan stands (N1).
- **Plan length.** Holds, with the cuts listed at the end.

---

## New findings

### N1 (minor). On an off PC the client and the server still disagree, and the plan says they agree

Plan: l.307-314 ("the client's check ... which knows nothing of power, agrees with it"), l.495-496
("Neither side reads power, so a PC that goes off changes neither answer"), l.783 (JS test: "true
for an admin entry on a PC shown as off").

The client does read power, indirectly. Every session answer fills `access` from
`session_access(pc_id)` (l.602-604), and `session_access` answers nil at step 4 when the PC's
service is off (l.284; `session_route_up?`, `NA:1163-1164`). The plan's own unit test asserts
`access` is "absent from the next answer after the route drops or the PC goes off" (l.729-730).
So after the first answer that follows power-off, the mirror entry has no `access`,
`keyboardAdmin` is false and the client refuses the stick, while `keyboard_admin?` (which skips
step 4) would accept it. The case the server now allows, and that `admin_usb_test` proves
(l.739-740), is reachable by an honest client only in the gap before the next answer.

Nothing is lost (the client is the narrower side), so this is the plan's "client narrower" case,
but three passages state the opposite, and the JS test passes on a hand-built entry that real
play does not produce.

Fix, one of:
- (a) Keep the skip and say the truth: add the off PC as a second "client narrower" case at
  l.499, delete the two agreement sentences, and change the JS test to "an answer without
  `access` clears it from the mirror entry, and `keyboardAdmin` is then false".
- (b) Put the power term back in `keyboard_admin?`. Client and server then agree once the answer
  arrives, and the stale-mirror gap becomes the "client wider" case the plan already accepts at
  l.504-507. This is the smaller design: the predicate is `session_admin?` plus two route terms.

Either way add the missing JS case from R3 m11: a later answer for the same PC with no `access`
removes it from the mirror (level computed, not cached). The decisions file line for m2 should
then give the real reason.

### N2 (minor). The reader-count guard is brittle and misses readers; a manifest keyed by method is the workable form

Plan: l.448-452, l.761-763.

The grep gives 118 hits today. As a count it has four faults:
- It moves for reasons that need no decision: a comment that says `room_npcs`
  (`GC:3578-3585` sits under one), a refactor that merges two loops, a rename.
- It stays level when one loop is added and another removed, which is the case it exists for.
- It counts definitions and callers of helpers as readers (`AccessIdentities.room_npcs`,
  `lib/break_escape/access_identities.rb:21`; `CredentialModel.room_npcs`,
  `lib/break_escape/credential_model.rb:135`), and misses any reader that goes through a helper
  with another name (`account_npcs`, `GM:3873`; `headless_npc_records`, `GM:5117`).
- It shells out to `rg`, which the test suite does not otherwise need.

Fix: check in a manifest (a YAML file beside the test) of `file#method: group` for every method
whose body matches the pattern, found by a plain Ruby scan of `app` and `lib`. The test fails when
a matching method is not in the manifest or a manifest entry no longer matches. That survives
line moves and comments and names the method that needs a decision. The "notes each hit's group
beside it" build step (l.448-449) becomes that file.

### N3 (minor). The three groups leave out readers of other person fields, and one of them is inherited from a role

Plan: l.432-446, l.658-664.

The third group ("find nothing, because the validator refuses `itemsHeld`, a phone and a story")
covers three fields. Sampled readers that act on other fields of a room NPC, none of which the
validator refuses on an `accountOnly` NPC:

| Reader | Field it acts on |
|---|---|
| `NpcHabits.expand!` (`lib/break_escape/npc_habits.rb:131-143`) | `habits`, and `awareness` taken from the NPC **or from its role** (`level_with_source`, `:60-70`) |
| `usb_habit_sticks` (`lib/break_escape/access_work.rb:1249-1255`) | the NPC's habit stick |
| feed posts and reactors (`access_work.rb:345`, `:848`, `:991`) | the NPC's own posts |
| `Mission.voice_configs_from` (`app/models/break_escape/mission.rb:292`), `TtsLineExtractor#each_room_npc` (`app/services/break_escape/tts_line_extractor.rb:120-157`) | `voice`, bark fields |
| clue placement (`lib/break_escape/npc_habits/clues.rb:93-131`, `:348`) | the account's secrets as clue sources |

The role case matters most. A shared local administrator is likely to carry a role, because
`access` lists and profile `for` rules admit by role. If that role has an `awareness` level, the
habit expansion runs for the account as if a person sat at a desk. I did not trace what it then
writes for an NPC with no workstation; the plan should not leave that to chance.

Fix: replace the deny-list with an allow-list. An `accountOnly` NPC may carry `id`,
`displayName`, `creds`, `role` and `accountOnly`; any other key is a validator error (position
and sprite included, which also settles n4). Add `NpcHabits.expand!` to the first group, since a
role's `awareness` cannot be refused on the NPC. State a fourth group in l.432-446 ("readers of
other person fields: find nothing, by the allow-list") and add one assertion to
`account_only_readers_test.rb`: an `accountOnly` NPC whose role has `awareness` gets no habits.

### N4 (minor). The log helper refuses long ids, it does not cut them

Plan: l.879-880 ("Account names in rows are cut to 32 characters and ids to 40 by the helper").

`LOG:545-548`: an id longer than 40 characters or outside `[A-Za-z0-9_.:-]`, or an account
username longer than 32, "makes the call malformed: no row, a raise in test and development".
Only a username the player types is cut (`LOG:541-544`). The validator refuses such ids only in
a scenario with `logSources`.

Consequences here: the collect route accepts a `pc_id` up to 64 characters (l.519-520), and
`creds.username` has no stated length limit in this plan, so a scenario can pass this plan's
checks and have its three rows dropped in production, or raise inside `GET /container`, the
implant action or the collect in development.

Fix: correct the sentence. Say that the PC id, profile id and account username in these rows
fall under the log plan's limits (40, 40, 32), and that the validator check there covers them
when `logSources` is set. Add a test case to `admin_profiles_test.rb`: a profile id of 41
characters stores no row and the folder still opens.

### N5 (minor). The same-name profile warning is not gated on a new field, against the "no new warning" promise

Plan: l.339-340, l.668, against l.719 ("A validator snapshot over every shipped scenario shows no
new error, warning or info line").

"Two profiles that can appear on the same PC" is already true today for any account admitted to
two profiles (its own and a role profile), with no admin anywhere. If a shipped scenario has two
such profiles with a top-level "Documents", the snapshot gains a warning and the stage's own
proof fails. The plan does not say the snapshot was checked for this.

Fix: gate the warning on what this feature adds: warn only for a pair of profiles that meet on a
PC solely through an admin session (the scenario has a `creds.admin` account or an admin
technique grant that can hold that PC). State the gate at l.668.

### N6 (minor). `bin/ops-golden-compare` needs its parent, its test version and its database rule stated

Plan: l.705-710, l.831.

The two-commit design answers R3 m10. Three gaps would make it fail or mislead in use:
- **Which parent.** Branches merge `main` after each landing. If `<parent>` is the branch point
  and the stage has since merged `main`, the comparison includes unrelated changes and fails for
  the reason m10 raised. Define `<parent>` as the tip of `main` that the stage commit contains
  (`git merge-base main <stage>` after the last merge), and run it on the hash that is merged.
- **Which test file.** A stage edits the test's strip rules (S5b adds `cachedAt` and
  `harvestedAccounts`, l.711-713). Recording at the parent with the parent's test file and
  comparing with the stage's file compares two different normalisations. State that the script
  copies the stage's test and helper into the scratch worktree and records with them against the
  parent's engine code. This also covers S5a's first stage, whose parent has no such test.
- **Shared state.** A scratch worktree shares the Postgres databases with every other worktree.
  State that the script runs the one test file only, runs no `db:` task, and refuses to run when
  the two commits differ in `db/`. Say where the worktree lives and that it is removed with
  `git worktree remove`.

Also add the script to the "To all ops plans" request at l.927, since the golden helper asked
for there and this script are one piece of work.

---

## Nits

- n1. l.526-527 and l.771-772: the 404 body echoes the id (`Container not found: <pc_id>`,
  `GC:644`, `render_error` at `GC:3856-3858`), so two different ids cannot be "byte-identical".
  Say "same status and the same body once the id is replaced", or use a fixed message with no
  echo on this new route. The status and shape are otherwise the same in every branch I traced:
  step 1 does not depend on the id's existence, and steps 3 to 7 are reached only with a session
  record the player holds.
- n2. l.529-531 "→ 403 `PC not reachable`, as the desktop answers": the desktop answers five
  different bodies by reason (`off`, `not_responding`, `expired`, `no_session`, `unreachable`,
  `GC:3149-3162`). The collect gives one. Say so. Step 5's "(expired, route down)" at l.535 is
  now reached only for a session whose account is gone, since `desktop_request_allowed?` already
  refuses an expired token and a dead route (`NA:1500`, `:1503-1512`); reword or drop the list.
- n3. l.750-752 and l.808-810: after a borrow "done" the player's session is ended and the
  guest's is held in `guestSessions`, not in the session records (`NF:402-407`). Until the player
  opens the desk and the guest claim writes a record, a collect answers 404, not 422. Name the
  claim step in both tests and assert the 404 before it.
- n4. l.543-544 "null for an `accountOnly` account": `npc_talk_portrait(npc)` (`GM:3878`) reads
  the NPC's own fields, and the validator only warns on a sprite (l.659-660), so the builder must
  force null or the allow-list of N3 must apply. The `portrait` and `avatar` keys reveal nothing
  unearned: both are asset keys the sign-in tile already sends, and the player holds an admin
  session and receives that account's password in the same step. One line in section 7 should
  note that on a PC with `loginPicker: "known"` or `false` (`GM:3869-3875`) the collect is the
  first place an unmet account's name and picture appear, by design.
- n5. l.82 still says the USB policy is read in "four player-side places"; l.175-176 and
  question 6 say three.
- n6. Lines far over the wrap width remain at l.411-414 and l.870-872 (tables, acceptable) and
  l.541, l.544, l.488, l.786 (prose).
- n7. l.499-503 "Client narrower" (settled session): the keyboard desktop answer that settles
  the record also carries the fresh session (`GC:3166-3169`), so the mirror is corrected by the
  same answer and the case barely exists. One sentence is enough.

---

## Open questions (check 4)

- Question 1 (l.944-956): a real choice, two options for the account marker plus the added
  choice of which sessions may start a step up, each with a recommendation. The second belongs
  to the core plan's `needs.session` check; l.889 already asks for it there.
- Question 5 (l.982-993): two real choices, options and a recommendation each.
- Decided this round without a question: the USB override working on a PC that is off
  (l.310-312). It is logged in the decisions file, so it is not silent, but its stated reason
  fails (N1). If option (a) of N1 is kept, add one line to question 6, since "an admin session on
  a machine with no power overrides its device policy" is a design call a user may want to see.
- Nothing else new was decided without a record.

## Contradictions introduced by the edits (check 5)

- l.495-496 against l.729-730 and l.602-604 (N1).
- l.668 against l.719 (N5).
- l.879-880 against `LOG:545-548` (N4).
- l.82 against l.175-176 (n5).

## Passages that could be cut

- l.150-156 (section 2, keyring and `pcs_accepting`), l.414 (table row) and l.559-561 (section 7)
  say the same thing three times. Keep section 7's bullet and the table row; cut l.153-156 to one
  clause.
- l.499-503: one sentence (n7).
- l.874-878: the paragraph restates the table's "Saved by" column and `LOG:885-888`. Keep only
  "Nothing in this feature reads a log row back" and the `hashes` sentence.
- l.448-452: replaced by one line once the manifest of N2 exists.
- l.307-314: four lines shorter under option (b) of N1.

About 20 lines in all.

## Not checked

- What `NpcHabits.expand!` writes for an NPC with no workstation (N3 states the risk only).
- Whether any shipped scenario would raise the same-name warning (N5).
- The 47 hits in `game.rb` one by one; I read the named first-group readers' line ranges from
  the grep and sampled `GM:4950`, `:5086`, `:5743`, `:5776`, `:2778` and `GC:3585`, none of which
  is in a wrong group (identity or held-item readers, or run on the filtered room).
- The `once:` digest's inputs in the log plan (whether "per PC and profile" also varies by
  account); both plans use the same words.
- OPS_CORE's added terms in `desktop_request_allowed?` for a technique session on a
  `remote: "blocked"` host, which decide whether a headless host's collect passes step 3.

## Verdict

Not ready to stop at this round: six minors remain, no major and no blocker. All six are
wording or small-scope fixes (one predicate choice, one manifest, one allow-list, one corrected
sentence, one gate, one script contract), and none changes the design. A fifth round on the delta
should close them. The cross-plan point to pass on now is the last "Not checked" item: whether the
core plan's gate lets a technique admin session on a blocked headless host through, because the
collect now depends on it.
