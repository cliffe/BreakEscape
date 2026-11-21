# OPS_PRIVILEGE_ACCOUNTS_PLAN: round 5 review (delta only)

Plan reviewed: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` at `48b0ec89f` (1027 lines),
delta from `e6a0ae290` (109 lines added, 89 removed). Status: complete, with the gaps under
"Not checked".

`GM` is `app/models/break_escape/game.rb`, `NA` is `app/models/break_escape/network_access.rb`,
`GC` is `app/controllers/break_escape/games_controller.rb`, `AI` is
`lib/break_escape/access_identities.rb`, `NH` is `lib/break_escape/npc_habits.rb`, `IX` is
`public/break_escape/js/systems/interactions.js`. Plan references are line numbers in the current
file.

Totals: 0 blockers, 0 majors, 2 minors, 5 nits.

---

## Status of the round 4 items

| R4 item | State | Note |
|---|---|---|
| N1 `keyboard_admin?` on an off PC | closed in design | Now `session_admin?` plus the two route terms (l.305-310). The three wrong sentences are gone, the unit test says "refused" (l.752-753), the JS case for an answer with no `access` is added (l.796-797), question 6 notes the off PC (l.1019-1020), the decisions file gives the real reason. One honest-play gap remains (M1) |
| N2 reader-count guard | closed | Manifest `test/models/account_only_readers.yml`, `file#method: group`, checked both ways by a plain Ruby scan (l.449-455). See n2 |
| N3 readers of other person fields | closed | Allow-list in section 9 (l.663-670), fourth group stated (l.445-447), `NpcHabits.expand!` in the first group with the reason, assertion added, file list updated (l.857). One key is missing from the list (M2) |
| N4 the helper refuses, it does not cut | closed | l.890-896 now matches the log plan; the collect `pc_id` cap is 40 (l.521); 41-character cases in the unit and controller tests. See n1 |
| N5 same-name warning not gated | closed | Gate stated in section 9 (l.673-675) and pointed to from section 5 (l.335-336). No shipped scenario has `creds.admin` or an admin technique grant, so the snapshot cannot gain the line |
| N6 `bin/ops-golden-compare` contract | closed | Parent, test file, single-file run, no `db:` task, refusal on a `db/` difference, worktree place and removal all stated (l.714-721); added to "To all ops plans" (l.946-947). See n3 |
| n1 "byte-identical" | closed | l.530, l.785-786 |
| n2 one body where the desktop gives five | closed | l.532-535; step 5 now reads "(the account is gone)" (l.538) |
| n3 404 before the guest claim | closed | l.763-765, l.822-824 |
| n4 portrait null, first sight of an unmet account | closed | l.547-548, l.562-563 |
| n5 "four player-side places" | closed | l.82 |
| n6 long prose lines | closed | Only tables (l.407-410, l.886-888) and two unchanged lines (l.90, l.261) exceed the width |
| n7 "client narrower" too long | closed | l.503-505 |
| Cross-plan point (core's gate on a blocked headless host) | passed on | l.915-917 |
| Suggested cuts | applied | l.152-154, l.449-455, l.891-896 |

---

## The changes against the code (check 2)

- **`keyboard_admin?`.** `remote_route_session?` covers relay and `from` (`NA:1544-1546`); the
  implant path already refuses those two and a non-blank foothold (`NA:497-502`), and
  `session_route_up?` answers false for an off PC before it looks at relay or foothold
  (`NA:1158-1165`). So the predicate is `session_admin?` and two terms, as the plan says. The
  client mirror carries `remote: true` for both a foothold session and a `from` session
  (`GM:4451-4460`), `relay` for a relay, and `locked` (`GM:3789`), so the client's four terms
  (l.497-499) cover every server term. Locked: the server answers nil at step 3 and the client
  tests `locked`; they agree, and a locked admin session still takes a stick the policy allows
  (`NA:503`, plan l.957-958). Off: they agree only after an answer that carries the session, and
  the honest player may not get one (M1).
- **`NpcHabits.expand!`.** The plan's account is correct. A role's `awareness` reaches an NPC with
  no `awareness` of its own (`NH:60-70`); `expanded` then returns the preset (`NH:99-107`);
  `expand!` writes it to `npc['habits']` (`NH:157`), counts the NPC's `holdsDoors` in the gate
  fills (`NH:148-149`, `:166-169`), and only the screen fill stops at `:no_workstation`
  (`NH:201-202`). Skipping `account_only?` inside the `plans` filter (`NH:137-146`) removes all
  three, and `expanded_copy` (`NH:315-319`) runs the same `expand!`, so the validator and the
  graph follow. No other file in `app` or `lib` calls `expanded` or `level_of`.
- **Allow-list.** The account and identity readers need `id`, `creds`, `role` and `displayName`
  (`AI:60-73`, `GM:3876-3881`, `GM:4435-4437`), and the schema requires `id`, `displayName` and
  `npcType`. All are in the list. `identity_roles` also reads `staff` (M2).
- **`pc_id` cap of 40.** All 82 sign-in PCs in `scenarios/*/scenario.json(.erb)` have an authored
  id; the longest is 16 characters (`store_controller`, `lab_physical_pentest`). The 15 ids over
  40 in `scenarios/` are documents, items and graph nodes. A derived id is
  `<room>_<type>_<index>` (`NH:321-333`) and no shipped sign-in PC relies on one.
- **Manifest and test, warning gate, golden compare.** Workable as written; small gaps in n1 to n3.

---

## New findings

### M1 (minor). After power-off an honest player's mirror can stay "admin", and the stick is then lost

Plan: l.307-309 ("agrees once the next answer arrives"), l.499-500, l.506-509 ("The next room
answer corrects the mirror"), l.796-797.

The answer the player gets at an off PC is the desktop's 403 `reason: 'off'`, which carries no
session ("the session is kept, the desktop refused", `GC:3151-3153`). A room answer comes only on
a room load. So a player who holds a keyboard admin session, causes the PC to go off (an
`offWhen` global, `NA:981-986`) and stays in the room keeps `access: "admin"` in the mirror for as
long as they stay. `plantRefusal` then lets a refused stick through, the client fires the
object's actions and removes the item (`IX:1081-1088`), and the plant proof records nothing
(`capture_proofs.rb:52`). The plan files this under "client wider", described as a tampered
client or a short gap; here it is ordinary play with no bound on the gap, and it costs the player
an item and may fire a scenario's `triggerOnInteract` for a plant the server never saw.

Fix (client only, two small terms):
- `pc-sessions.js` drops `access` from the entry when a desktop request for that PC is refused
  with `serverReason` `'off'` or `'not_responding'` (the reasons already reach it,
  `pc-sessions.js:509-547`, `:665-667`).
- State at l.506-509 that this refusal, like a room answer, corrects the mirror, and add the JS
  case: after a 403 `off` for the PC, `keyboardAdmin` is false and a refused stick stays in the
  tray.

### M2 (minor). The allow-list leaves out `staff`, so an account with no person is always "staff"

Plan: l.663-666.

`identity_roles` gives every NPC with `creds` the implicit role `staff` unless the NPC says
`"staff": false` (`AI:63-64`; `staff` is a schema property). Under the allow-list `staff` is an
error on an `accountOnly` NPC, so a built-in or service account always carries the staff role:
every `access` list and every profile `for` that admits `roles: ["staff"]` admits it. For a
`local` account `localTo` narrows the PCs, but not the profiles, and an account with no
`accountKind` is admitted to every staff PC. The plan's own hardened example (`lab1Admin`) would
open the staff profile on `lab1`.

Fix: add `staff` to the allowed keys. While there, allow the comment keys scenario files use
(`_comment` appears 621 times in `scenarios/*/scenario.json.erb`, and the NPC schema does not
close additional properties), or say that an `accountOnly` NPC takes none.

---

## Nits

- n1. l.521 against l.893-896: the route refuses a `pc_id` over 40 in every scenario, while the
  validator refuses such an id only where `logSources` is set. A PC with `cachedAccounts` and a
  41-character id in a scenario without `logSources` validates and can never be collected. Make
  an id over 40 on a PC with `cachedAccounts` a validator error whatever `logSources` says. No
  shipped PC is near the limit.
- n2. l.449-452: "every method ... whose body matches" needs one clause on how the scan finds a
  method's bounds (Ripper, or `def` to the next `def` at the same indent) and what it does with a
  match outside any method, so two implementers write the same manifest.
- n3. l.714-721: say where the stage-side run happens and that the recorded golden files do not
  overwrite the checked-in ones in the caller's tree (a second scratch worktree, or a directory
  passed by an environment variable).
- n4. Question 3 (l.990-991) states only the recommended answer. Name the other one in a clause
  ("or a fixed cost per collect, which needs a server clock") so it reads as a choice.
- n5. `scripts/validate_access_work.rb:1520-1526` reads `NpcHabits.level_of` directly, so it may
  still treat an `accountOnly` NPC with a role level as a person with awareness. One line in
  section 9: that helper skips `account_only?` too.

---

## Contradictions introduced by the edits (check 3)

None found. The R4 pairs (l.495-496 against the unit test, l.668 against the snapshot promise,
l.879-880 against the log plan, l.82 against question 6) are all resolved, and the new "refused
under keyboard admin on a PC whose service is off" (l.752-753), the JS case (l.796-797), section
5 and question 6 say the same thing. The stale phrases ("skips step 4", "knows nothing of power",
"byte-identical", "64 characters", "three groups", "reader count") no longer appear.

## Section 15 (check 4)

Seven questions; each is a user choice with a recommendation.

| Q | Options | Recommendation | Note |
|---|---|---|---|
| 1 admin by password | (a), (b), plus which sessions may start a step up | (a); any live session | |
| 2 how accounts become cached | (a) to (d) | (d) | |
| 3 cost or detection | only the recommended answer is written | no cost now | n4 |
| 4 domain-wide lockout | (a), (b) | (a) now | |
| 5 admin tiles | two sub-choices, two and three options | (a), (a) | |
| 6 remote admin and USB | this plan, (b) | (a) | Notes the off PC |
| 7 owner collectable | (a), (b), (c) | (b) | |

The three "defaults this plan settles" (l.951-958) are consequences, not choices; that holds.

## Not checked

- What the validator does with `awareness_level` for an NPC that carries no `awareness` (n5).
- Whether the room a player stands in is ever re-fetched without a reload, which would shorten
  the gap in M1; I found no such fetch in the files opened, and did not search further.
- The 118 reader hits one by one (as in R4); the manifest test is what will decide them.
- OPS_CORE's answer to the request at l.915-917.

## Verdict

Not "ready" by the strict rule: two minors remain, no major and no blocker. Both are one-line
additions that change no design (a client term that clears `access` on the desktop's `off`
refusal, and `staff` in the allow-list). With those and the five nits applied, the plan is ready
to build; they do not need a sixth review round, a read of the two edited passages by the
integrator is enough.
