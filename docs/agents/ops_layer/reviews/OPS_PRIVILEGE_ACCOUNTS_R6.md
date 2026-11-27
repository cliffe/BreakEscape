# OPS_PRIVILEGE_ACCOUNTS_PLAN: delta review R6 (commit bcb5be471)

Scope: the two applied rulings (cached accounts are always a hash; any admin session on the PC
overrides the USB planting policy), checked against the code in this worktree. Plan path below is
`docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (PP). Counts: 1 blocker, 3 major, 4 minor, 3 nit.
The review stopped at the context limit. Not checked: the item-consume path at
`games_controller.rb:1458` in full, and the cracking plan beyond its draft sections 3 to 9 and 14.

## Blocker

**B1. An `accountOnly` account can never have its hash record, so the S5c lesson cannot be built.**
PP:259-266 requires one `hash` record per `cachedAccounts` candidate. The cracking plan's validator
refuses a hash record whose account NPC has no `password` habit
(`OPS_CRACKING_PLAN.md:248-249`), and its crack reads that habit (`:151-154`). PP:717-722 makes
`habits` on an `accountOnly` NPC an error, and PP:466-471 and :488 make sure no role preset
writes habits onto one. `deskAdmin` and `lab1Admin` (PP:275-280) are `accountOnly`, so neither
can be a cached account. That breaks the shared local administrator lesson (PP:291-293), the S5c
playtest step "collect `deskAdmin`'s hash on `pc01`, crack it" (PP:893) and `account_kind_test.rb`
("collected and cracked on `pc01`", PP:833-834). The facts the crack needs (`se_intel_<factId>`)
also come from clue sources tied to a person, and an `accountOnly` account has none.
*Fix:* allow exactly `habits.password` (with `passwordPattern`) on an `accountOnly` NPC, as the
one allowed habit key, and keep every other habit reader skipping it (`NpcHabits.expand!`,
`awareness_level`). State where its pattern facts come from: a find or an item, never a
conversation. Add a validator check that each cached `accountOnly` candidate's pattern facts have
a non-person source. Ask the cracking plan, under cross-plan requests, to accept this case. An
alternative is to drop `accountOnly` from the cached-account examples, but that loses the weak
setup's built-in administrator.

## Major

**M1. The `harvested` proof shape is not a shape the code reads.** PP:261, :418-421, :701 and
:243-250 write the proof as an object, `{ "harvested": { "pc": "<pcId>" } }`.
`CredentialModel.proof_kind` accepts only string values (`credential_model.rb:62-67`:
`present_string?(proof[k])`). The schema's proof properties are all strings
(`scenario-schema.json:293-305`), and `check_credentials` errors when `proof_kind` is nil
(`validate_scenario.rb:7523-7525`). Adding `harvested` to `PROOF_KINDS` and one branch to
`credential_proof_holds?` (PP:418, :920-929) would leave every harvested proof malformed: the
validator would refuse it and the keyring would never list the hash.
*Fix (preferred):* use the string form `"proof": { "harvested": "<pcId>" }`, like `session` and
`foothold`. The account comes from the entry's `account.npc`, which the plan already reads. Then
add `harvested` to the schema's proof properties (PP section 9 schema list and section 12 file
list). If the object form stays, list the changes to `proof_kind`, the schema and
`check_credentials`. Either way, update the cross-plan request to S7 (PP:1009-1010).

**M2. A session-shaped implant under a remote admin session now fails without a word, where today
the player sees the USB refusal.** The client override is `sessionAdmin(pcId)` for any non-locked
entry with `access: "admin"`, remote and technique entries included (PP:533-537).
`interactions.js:1052` runs `plantRefusal` for every `requiresItem` object, including a BadUSB
whose action is `grant_foothold` with `needsSession` (`apply-actions.js:443-449`). So on a
USB-blocked PC held through a remote or technique admin session, the client now lets the stick
through. The server implant path then refuses with `not_ready` before it reads the policy
(`network_access.rb:498-501`), and `network-links.js:498-501` treats `not_ready` as quiet. Today
the same player gets the authored USB refusal line. The plan's own test expects `not_ready` there
(PP:808-809) but never says what the player sees.
This also contradicts the core plan: its table says a technique session "counts for
`needsSession`: yes" (`OPS_CORE_PLAN.md:771`, and `:166`). PP:999-1001 tells the core plan the
opposite.
*Fix:* see the recommendation at the end. Whichever way is chosen, the client predicate passed to
`plantRefusal` for a `needsSession` implant must match the server's implant rule, a refused
implant must show a line, and one of the two plans changes its table or request so they agree.

**M3. The wider override makes a lost device likelier for an honest player.** PP:542-546 accepts
that when client and server disagree, "the item leaves the tray with no plant recorded". Under
keyboard-only, only a tampered client or a narrow hand-over race met this. Now remote sessions
override too, and their admin can lapse with no client event: a token session expires on the
server clock (step 2, PP:305), a foothold is unplugged by an NPC, an outage (N7) or a `from`
source drops. A player standing at the PC with a stale mirror plants a blocked stick, the stick
is consumed, nothing is recorded, and nothing is said. If the stick is the mission's only one,
the game is stuck.
*Fix:* when the plant proof refuses for the policy, keep the item. Either make the consume
conditional on the proof, or have the server answer with the USB refusal line so the client puts
the item back and shows it. Add a JS and server test for an expired token admin session planting
a blocked stick.

## Minor

**m1. The registry ids in the S5b example break the id pattern.** `hotDesk_priyaN` and the other
ids (PP:243-250) fail `ID_PATTERN = /\A[a-z][a-z0-9_]{0,63}\z/` (`credential_model.rb:40`;
validator error at `validate_scenario.rb:7368`). Authors will copy the example.
*Fix:* use lowercase ids (`hotdesk_priyan`) and note that the hash id needs no fixed relationship
to the PC or NPC ids.

**m2. The plan is unclear about where the player learns a collected account's username.** PP:625
says an `accountOnly` username appears "in a collect answer", but the collect answer (PP:591) has
`npcId, displayName, portrait, avatar, hashId` and no username. PP:529 says the username is on the
keyring row, which is the cracking plan's hash row, and no cross-plan request asks that row to
carry it. Until the crack, a player may not be able to type the account (PP:496 relies on the
collect to teach it).
*Fix:* either add `username` to the collect answer and the panel (it is earned at that point),
or ask S7 under section 14 to show the username on the hash row. Correct PP:625 either way.

**m3. A shared local administrator collected on two PCs leaves an uncrackable-looking second row.**
PP:263-264 gives one hash record per PC. After cracking one, the other record still lists with a
Crack button, and `crackRuns` keys by `hashId` (`OPS_CRACKING_PLAN.md:228`), so the second record
is a fresh puzzle for a password the player already has.
*Fix:* ask S7 to show a hash whose account's `<npcId>.password` row is already granted as cracked,
or say the second crack succeeds at once.

**m4. The 64-pair cap and the 64-entry registry cap overlap.** PP:707 caps declared pairs at 64,
and PP:703 counts their hash records toward the registry's 64 (`MAX_ENTRIES`,
`credential_model.rb:39`; `validate_scenario.rb:7366`). So any other credential at 64 pairs is an
error, and the pair cap never binds alone.
*Fix:* say the pair cap is the registry cap minus the scenario's other entries, or drop the
separate pair cap and rely on the registry's.

## Nit

**n1.** PP:505 "the lesson is about the password collected" is left over from the old rule. Make
it "the hash collected and cracked".

**n2.** PP:534 names `sessionAdmin(pcId)`, but `interactions.js:1052-1056` has no `pcId`, only
`sprite.scenarioData.id`. Say the argument is the object's id. For a governed non-login object
(`usb_governed?`, `access_work.rb:1181-1187`), the mirror then has no entry and the answer is
false, which matches the server's "else false" (PP:369-370).

**n2b (standalone).** PP:96 "by ruling" and PP:375 "(the existing ruling)" name a decision
process. Cite the code comment's behaviour instead ("by design, `:502`"). Nothing else mentions
reviews, rounds or picks.

**n3. Stage order.** The order statements agree: PP:170-174, :904, :955-956, :1016 and the outline
(`OPS_LAYER_PLAN_OUTLINE.md:147-149`). PP:183 "S5a does not need S3" beside PP:170 "S5a (after
the core plan's S3)" reads oddly. Add "it is ordered after S3 so the answer parameter exists".

## Checked and sound

- `session_admin?` at the server checks: relay and every claim stop at step 5 (PP:308). Step 4,
  `session_route_up?`, refuses a PC whose service is off for every session kind, the keyboard
  included (`network_access.rb:1158-1164`). Step 3 refuses a locked session. So "off" and
  "locked" are enforced at both server sites. Token sessions are admin by design, and expiry is
  step 2. At the implant path the earlier session-shape refusal (`:498-501`) means the override
  only ever meets keyboard sessions there.
- The hash path: the registry is withheld from the bootstrap (`game.rb:2483`), so `hashId`
  reaches the browser only in the collect answer and the keyring once the proof holds. No
  password or token goes in the collect answer. `harvestedAccounts` and `cachedAt` are bounded,
  server-only and survive a reload. The keyring rides `rev`. S7's crack route checks that the
  proof holds (`OPS_CRACKING_PLAN.md:180`), which matches the server-held proof of collection.

## Recommendation on the implant question (not a decision)

Keep the session-shaped implant at the keyboard only. A device that types into a PC reaches the
console session, and a remote or technique session is not at that console. This is the more
accurate lesson, and it is what the code does today. Make it visible and consistent:
1. The client passes `admin` to `plantRefusal` for a `needsSession` object only when the mirror
   entry is a keyboard session (not `remote`, `relay` or technique), so the USB refusal line
   still shows there.
2. The server answers a remote-session BadUSB with a distinct reason (for example
   `needs_console`) and an authored line ("Nobody is signed in at this keyboard"), shown through
   `network-links.js` rather than kept quiet.
3. The core plan changes its `needsSession: yes` cell for technique sessions
   (`OPS_CORE_PLAN.md:771`, `:166`), or the orchestrator settles which plan's rule wins.

The other option is to let any admin session take the implant. That honours "any admin session
overrides" to the letter, but it needs the implant path's session rule changed in both plans.
