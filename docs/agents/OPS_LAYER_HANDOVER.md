# Ops layer planning: orchestrator handover

Written 2026-11-19, about 12:15, by the orchestrating session (Fable). From here the deep planning
work moves to Opus: an Opus session orchestrates, and Opus agents write and revise the plans. This
note is everything the next orchestrator needs that is not already in a plan file. Read it with
`docs/agents/OPS_LAYER_BRIEF.md` (the shared brief every agent reads) and `AGENTS.md`.

## 0. Picking this up (status 2026-11-21)

The planning is finished. All seven plans have nothing open above nit level (confirm delta
`docs/agents/ops_layer/reviews/OPS_CONFIRM_DELTA_R14.md`), and they are on main from train T280.
The build is on hold until the owner says go (D233). To start it:
1. Read `docs/agents/OPS_LAYER_BRIEF.md`, `AGENTS.md` and `docs/achitechture/OPS_CORE_PLAN.md`.
   The core plan sets the slice order, starting at L1a.
2. Each plan's section 14 lists what it relies on from the others. The plans are written as final
   design, so you do not need the review files to build.
3. Read the NEWEST blocks below for the rulings made since the plans were last revised.

## 1. The job

The user asked for plans, not builds, for a set of access-control, sign-in and abstract network
features, so that a later game can replace real VMs with simulated mechanics. Standing instruction:
task subagents to plan the features, consider the existing code carefully so the additions fit,
run several agents in parallel, use Haiku for retrieval, and do iterative adversarial review
rounds. AC0 (the usual integrating session) is parked; this stream's orchestrator commits its own
branch.

Nothing is built until the user says so (their pick Q8). Parked by the user and out of scope: S0,
S4, S10, S12 (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`) and S11 (`VM_OR_GAME_BACKING_PLAN_OUTLINE.md`).

## 2. Where things are

- Worktree `.claude/worktrees/ops-plan`, branch `docs/ops-layer-plan`. Never commit on main. Stage
  explicit paths, check `git diff --cached --stat`, no attribution lines in commit messages.
  Subagents never commit; the orchestrator does.
- Plans: `docs/achitechture/OPS_*_PLAN.md`. Outline: `docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`.
- Findings and declined items: `docs/agents/ops_layer/reviews/<PLAN>_R<n>.md` and
  `<PLAN>_DECISIONS.md`. Cross-plan review: `CROSS_PLAN_R1.md`.
- Code digests (Haiku, with `file:line`): `docs/agents/ops_layer/digests/` D1 to D6. D6 line 149 is
  wrong about door lock fields: they live on the room (`scripts/scenario-schema.json` near 4171).
- Running log of the session: `docs/agents/OPS_LAYER_RESUME.md` (long; this note replaces it as the
  starting point).
- Picks page for the user's decisions: https://claude.ai/artifact/NJ3CMZUUG6wKE2S9VtEg5e. Its
  source lived in the old session's scratchpad and may be gone; read the page back with the
  Artifact tool (`action: read`) to get the HTML, and republish to the same URL. It saves answers
  under localStorage key `be-ops-plan-picks-v1` with stable question ids in a `GROUPS` array; keep
  the ids so the user's saved answers survive.

## 3. State of each plan

**NEWEST-9, read this first.** Confirm delta R14 settled 0/0/0/3 (`02c825bd7`): R13 and R8 fixes
resolved, leftover privilege/MFA/log-rows minors were already fixed, two citation nits fixed. N1
(append-only ids) stays as is (AC0, 2026-11-21). Plans branch training as T279; build go-ahead is
D233 on the owner's page. Nothing running.
D233 (corrected 2026-11-21): the build is ON HOLD until the owner says so. It is not tied to the CA
work, and it may start on another Claude account. Do not build anything without the owner's word.

**NEWEST-8.** ROUND 3 SETTLED ACROSS ALL SEVEN PLANS. Skin R12 fixed
`c04b2bf95` (generated `docs/REALISM_CATALOG_INDEX.md`, append-only ids, catalog task owns the
content check); core loader fails closed with a fault list `332e2f005`; skin R13 delta 0/5/3
`d1ecba417`, fixed `caa6640bd`, `9052beca8`; cross-plan R8 0/3/4 `0332427ad`, fixed `780b2cc95`.
Bug fix R3-6: `fix/knockout-drop-item-id` `b3749f058` (worktree p-knockout-drop), Rails 3571/0
fail, test-js 886/0; sent to AC0 for a train (2026-11-19). R3-7 noted only.
Nothing else running. Next: wait for the user (build go-ahead, or further rounds).

**NEWEST-7.** Skin catalog done `b0ccefae4` (1811); core took requests 3 and 5
(2110). RUNNING: opus55 skin R12 delta → `OPS_REALISM_SKIN_R12.md`; opus55 knock-out drop fix
(tests). SKIN FIX ROUND must also take the core agent's three gaps: (a) the catalog "does not
validate" error only for scenarios with links; (b) the network-id-clash rule limited to scenarios
with `services` (or accept: no clash in today's 8 networks scenarios); (c) skin validator tests
use test catalog folder `test/fixtures/realism_catalog/` (core's name). Then cross-plan delta.

**NEWEST-6.** Lock round 3 `72fa1a349` (G4 plain carried containers) and
cracking round 3 `61a8bc8bc` (`crack.difficulty`) committed; delta `35d1064b3` passed both with
fixes. RUNNING: Sonnet lock+cracking delta fixer (id-less carriers warning; `passwordDifficulty`
NPC habit parameter, record's `crack.difficulty` wins); opus55 skin catalog part 2 from
`ops_layer/HANDOVER_OPS_SKIN_catalog.md` (part 1 `095f1fe02`: catalog in
`config/break_escape/realism_catalog/*.json`, link `realism: "<id>"`, named keys copied into
`cli` at check; banners stay scenario-side, no real ids (my ruling); default module
`auxiliary/scanner/...` stands); opus55 bug fix `p-knockout-drop` (no report yet). NEXT: commit
each; apply skin requests 3 and 5 to core; opus55 skin delta (catalog serving); cross-plan delta;
fix-branch hash → AC0.

**NEWEST-5.** Round 3 answered and recorded (`f5ee445a0`, picks file "Round 3";
brief rule 4 changed: real ids allowed only in a separate realism catalog). RUNNING: opus55 skin
reviser (realism catalog outside scenarios/ linked by plain id; no "(simulated)" mark; new core
requests in skin section 14 → apply to core after); opus55 cracking (salt confirmed, `common`
recipe-only, optional author difficulty design); Sonnet lock (R3-5 wording only, R3-8 extend
Rule D to plain carried containers as a final stage); opus55 bug fix in worktree
`.claude/worktrees/p-knockout-drop` branch `fix/knockout-drop-item-id` from main 98284ca85 (R3-6;
hash → AC0 train). R3-7 noted only (timer/object-action claims not trigger-checked). NEXT: commit
each, apply skin's core requests, deltas (opus55 for skin catalog serving), cross-plan delta.

**NEWEST-4.** ALL SEVEN PLANS AND THE CROSS-PLAN CHECK SETTLED (`dd7dc92ea`;
R7 nits left: CRACK:419/:720 "any source", PRIV keyringRev test row, CORE:2005 "thirteenth").
Nothing running. Waiting on round 3 answers; then apply them (Sonnet per plan, opus55 delta where
security), and act on R3-6/7/8 bug picks (new small branch → AC0 train).

**NEWEST-3.** Cross-plan R6 done and fixed (`3c3970c31`, `6634e49f8`,
`474292bd3`); Sonnet cross-plan R7 delta check running → `CROSS_PLAN_R7.md`. Bug-fix branch
8aac59791 sent to AC0; AC0 queued it in the pre-release train (waits on AC1/AC4 items; AC0
re-runs the two chatter JS tests if they fail again). Then: wait for round 3 answers on the
picks page and apply them.

**NEWEST-2 (late night 2026-11-19).** SETTLED: core (R10 `ec281cf60`, 4 nits
left), lock (R12 `20461519b`), cracking (R4 `7566a4055`; Sonnet fixing F1/F2 minors now), priv,
MFA, log. Skin: R10 fixes `7b4dd6309`, Sonnet R11 delta running. Core 9.1 took skin request 5
(`d335b4f6f`). ROUND 3 page published (same artifact, key `be-ops-plan-picks-r3`, source
scratchpad `ops_plan_picks.html`, r2 backup `ops_plan_picks_r2_backup.html`, groups in
`r3_groups.js`): R3-1 skin 15(a), R3-2 15(b), R3-3 salt, R3-4 `common`, R3-5 carriedGone,
R3-6 knock-out drop credential bug, R3-7 timer/object-action claim bug, R3-8 plain carried
container bug. Bug-fix branch reviewer still not reported (p-keyring-fix head 8aac59791).
NEXT: skin settles → cross-plan R6 (opus55; check priv `common` recipe vs cracking Q2, stale
line cites, cli ownership), then wait for round 3 answers.

**NEWEST (night 2026-11-19).** Reviews committed: lock R10 `f2a0d0566` (0B/5M),
skin R9 `ef99e1cdc` (0B/7M), core R8 `186396c27` (0B/1M/6m), cracking R2 `fbecdc5a3` (1B/4M).
RUNNING fixers (no commits by them): opus55 lock R10 fixer (Rule D redesign, section 15 tidy, adds
MAJOR-1 carriedGone question); opus55 skin R9 fixer (M1 address serving → change to core request
3; M2 perform hook → new core request; M3 cli validator; M4 no-innerHTML test; M5 unique targets;
M6 decoy labels; M7 restated 15(a)); Sonnet core R8 fixer (cli schema rows move to skin K3; range
kept, skin validator to own "every discovery network has a range or none" rule: ADD TO NEXT SKIN
ROUND; leak collector; cli.hosts key pattern); opus55 cracking R2 fixer (B1 no facts from
timer/object-action item adds; revealsFacts in FORGEABLE_ITEM_FIELDS; crackFacts inside
keyring_rev; grant_fact in process_flag_rewards; validator tests).
Bug-fix branch `p-keyring-fix` now has 3 commits (8aac59791 head, from the reviewer); reviewer
still running tests. When it passes, send the hash to AC0 (LIVE AC0 socket) for a train.
Core R8 fixes DONE (1996 lines; n6 declined, log key stays `technique`). NEXT SKIN ROUND must
adopt: range on every discovery network or none (validator), `cli.hosts` keys plain strings ≤64
chars, `cli` schema rows declared at K3 (core refuses `cli` until then).
LATER (night): lock R10 fixed `9441dcce0` (1268; opus55 R11 delta running); skin R9 fixed
`7461ad773` (1584; Sonnet aligning skin with core: K3 owns cli schema, range rule, cli.hosts
keys); cracking R2 fixed `4edaa255b` (824; opus55 R3 delta running; Sonnet applying its priv
requests + cachedAccounts shape check); opus55 applying skin requests 3 (address serving) and 4
(perform hooks) to core, NOT the "core declares cli schema" clause. PENDING for core after that:
cracking's request "S7 makes core `connectsTo` warning skip hashes". Then skin R10 delta, core R9
delta, cross-plan R6.
Priv took cracking requests (1390). CROSS-PLAN R6 must check: priv lists `common` among recipe
classes; cracking Q2 asks about `common` in the habit enum (rec no). Same list or different?
SECOND existing-code bug (cracking R3 M1, game.rb 1135-1137 + 765-770): a forged NPC knock-out
drop of a held item with no id keeps the client's id, and the restamp then finds another item's
definition by that id, so it can re-stamp `credential` and mint a `held` proof. Ask on round 3
alongside the trigger gap (add to bug-fix branch?).
ROUND 3 picks additions: the existing-code gap from cracking R2 B1 (games_controller.rb 3384-3399:
a client can claim a timer/object-action item at any time with no trigger check); add to the
bug-fix branch? Then: apply skin's new core requests to core, deltas, cross-plan R6.

**LATEST (late 2026-11-19).** Round 2 applied. Commits: core/priv/MFA picks
`30e757197`; cracking revised `c22d57701` (619 lines; facts from item revealsFacts via
canonical_inventory_item, served feed posts, grant_fact flag rewards; orchestrator verified only
process_flag_rewards writes flag_rewards_claimed and /api controller is unrouted); priv answers
cracking requests `7b3203e1b`; lock round 2 `0ec4379a9` (1184 lines, carried items 5.5, Rule D in
G1); skin realism `00d10e87e` (1445 lines, cli-gen generators, request 3 to core).
RUNNING (agent → output): opus55 cracking R2 review → `OPS_CRACKING_R2.md`; opus55 lock R10 →
`OPS_LOCK_SECOND_STEP_R10.md` (also sorts its 6 section-15 questions); opus55 skin R9 →
`OPS_REALISM_SKIN_R9.md`; Sonnet core applies skin request 3 (cli fields served by stage); Sonnet
bug fixes in worktree `p-keyring-fix` branch `fix/keyring-revocation-validator-cards` (hash → AC0
for a train, uncommitted on our side).
NEXT: commit each; fix loops (Sonnet fixes, opus55 deltas for server-output/security); cross-plan
R6 (check priv `cachedAccounts {npc:..}` vs schema); then a ROUND 3 picks page (new artifact path
or same file `ops_plan_picks.html` with new key `be-ops-plan-picks-r3`, republish to
https://claude.ai/artifact/Kovtq5LNnBVNGrAYttEg97) with: skin 15(a) real advisory ids/products in
cli labels (rec allow, no payloads), 15(b) "(simulated)" mark (rec first line), cracking Q1 salt
model (rec timed wait), cracking Q2 `common` in habit enum (rec no), lock remaining section-15
questions, and the THIRD BUG: crafted /unlock opens a carried container after it left the
inventory (existing code; ask whether to add it to the bug-fix branch).

**Round 2 answered (picks file end, `3a879f440`). Running, each on its own files: opus55
cracking reviser (brief file); opus55 skin realism revision (simulated nmap/msf-style output from
per-tool JS generators; deny-list withdrawn; may file core requests in skin section 14); opus55
lock round 2 (R2-5 b inventory-path audit + carried-item step); Sonnet core/priv/MFA picks (R2-6 b
revert se_technique, R2-7/8/9 to decisions); Sonnet bug fixes in worktree
`.claude/worktrees/p-keyring-fix` branch `fix/keyring-revocation-validator-cards` from main
98284ca85 (hash goes to AC0 for a train). Next: commit each, route skin's core requests, delta
reviews (opus55 for skin realism, lock audit and cracking; Sonnet for the picks tidy), then a
cross-plan delta.**

**Earlier, evening 2026-11-19: ALL SIX revised plans settled (core R7 fixed, 1948 lines; cross-plan
R5 fixed `185becfb7`). Two log-plan wording nits left as noted (lock R8 n4, core R7 n4, LOG:607,
:939, :992). Waiting on the user: round 2 page answers (then apply them, Sonnet delta per touched
plan) and R2-1 (cracking route). Nothing running.**

**Earlier, about 16:00: privilege (R8 settled, 1382 lines, `6976eef98`), lock (R9 settled, 1063,
`4ef605036`) and skin (R8 settled, 1121, `7d427911c`) are settled pending round 2 answers. Core:
R6 0B/3M/7m fixes part 1 at `420319505` (handover `ops_layer/HANDOVER_OPS_CORE_R6_fixer.md`);
an opus55 part-2 fixer is running (M2 rest, m1 NA:498, m6 log rows in core AND log plan, m7,
decisions log). Next: commit it, Sonnet/opus55 core R7 delta, then a short cross-plan delta over
today's revisions. Round 2 page: https://claude.ai/artifact/Kovtq5LNnBVNGrAYttEg97. The table
below is older.**

The user answered the 41-question picks page on 2026-11-19; rulings in
`docs/agents/ops_layer/USER_PICKS_2026-11-19.md`. Plans revised to them, then reviewed again.

| Plan | Lines | Round state | Next |
|---|---|---|---|
| `OPS_CORE_PLAN.md` | 1771 | Revised to picks (display-only discovery, free loop, remote desktop at the keyboard, compromise marks, keys `technique_card`/`se_technique`, every technique use logged, needsSession keyboard-only) | **Opus review `OPS_CORE_R6.md` running** (diff `a7b31abad..HEAD`) → fix → Sonnet delta |
| `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` | 1215 | Picks (always a hash, any admin session overrides planting); R6 1B/3M fixed `68382fce1`; R7 0B/2M `02d623ef4` | **Opus R7 fixer running** (remove_item waits, needs-session keyed on grant's pc, needs_console question) → Sonnet delta R8 |
| `OPS_LOCK_SECOND_STEP_PLAN.md` | 953 | Lock types audit applied; R7 0B/5M fixed `def243b4a` | **Opus R8 delta review running** → fix → Sonnet delta |
| `OPS_REALISM_SKIN_PLAN.md` | 1031 | Removed loop features dropped; scan progress bar and fictional terminal output added `70952c6db` | **Sonnet R6 delta review running** → fix if needed |
| `OPS_MFA_HELPDESK_PLAN.md` | 1178 | Picks applied (helpdesk stop lifts after 5 min) `7e0b6c703`; no open questions | Done unless a check asks |
| `OPS_LOG_ROWS_PLAN.md` | 1278 | Cross-plan R4 fixes; harvest row counts hashes; badge rows keyed on card used | Done unless a check asks |
| `OPS_CRACKING_PLAN.md` | 357 | First draft. sonnet-cvp retry was **blocked by the auto-mode permission classifier** ("Unauthorized Access") before it ran | User to choose: allow the relay command, run it themselves, or leave at first draft. Brief ready: `docs/agents/ops_layer/BRIEF_cracking_reviser.md` |

Cross-plan R2, R3 and R4 are settled (R4 found nothing above minor). After the current plan
reviews settle: one more short cross-plan delta over the picks revisions.
Also committed: `LOCK_TYPES_COEXISTENCE.md` (the user's LOCK-3 question: all lock types coexist
with the keyring; two existing-code bugs out of scope, listed in the lock plan section 14).

## 4. Model routing from here

- Opus (`opus55`) writes plans and does full reviews, and delta reviews that touch secrets or
  access checks. Fable is no longer used. Every review goes to a fresh agent that did not write or
  revise that plan.
- Sonnet (`general-purpose`, model sonnet) applies explicit fix lists and does other delta reviews.
- Haiku (`haiku-reader`) for code retrieval and digests. Sonnet for well-defined edits such as
  applying a rename list.
- `opus48` only for CTF or VM solution work and social-engineering content, and for one retry when
  a safeguard stops a task. If a safeguard stops an `opus48` task, stop and offer the user the
  retry choice; never rerun it on a third model, never do it yourself, never use grok or qwen for
  it. This is what happened to the cracking reviser.
- Every multi-step brief tells the agent to write a handover note and stop at about 150k tokens.
  Revisers have hit that limit several times on plans over 1200 lines: tell them to read in ranges
  under 200 lines, start editing within ten calls, and use the Edit tool only.
- No agent opens SecGen XML or the exploit-detail field guides.

## 5. Rulings in force

These were settled by the orchestrator between plans. Plans already carry most of them; the list is
here so a reviewer's finding that contradicts one can be declined quickly. None is a user decision
unless marked.

**Shape (user decisions, brief section 2).** Each stage is its own feature with its own routes; no
shared moves registry, act route or actors. Neutral schema terms. The skin is only a skin. MFA uses
a real in-game device. Game-design prose only.

**Sign-in and sessions.** Order: password match, PC admission, second step, session write. A
session gained by a technique card meets no sign-in checks and no second step. Step-up to admin
uses core's shapes. Session answers carry `access: "admin"` only when the computed level is admin.
A refusal reason is a code, with one client text table. A policy's kind is public; its answers are
not. No `actor` field anywhere.

**Core.** Card item type is `technique_card` (placeholder PNG copied from `qr_card.png`; art is a
later task, generate nothing). `fixed: true` appears only on a confirmed finding. A technique
session used at the PC's own keyboard gets 403 `network_only`, handled once in `loadLoginDesktop`
before `fromReturn` and the catch-all; it keeps the copy, raises no sign-out event and shows the
plain sign-in screen. Quiet `no_grant` is checked just after status. Noise keys are stated once in
5.3 and never appear on unswept blocks. Panels show no quiet/noisy note. Core owns and builds the
scene's `perform` path and one pending-request guard keyed by action and target (`use` keyed by
card and finding), with the existing unplug guard folded in; the skin only routes through it. Core
draws the "admin" tag. `data-action` hooks go on ops controls only. Beat tables stay in the core
plan; its length is accepted.

**Skin.** The control list is private to the network-view folder, on core's `ops-model.js`. The
switch shows only on `ops: true` networks. A late answer after a skin switch is drawn by the
mounted renderer. `network_only` never reaches a network-view renderer. Playtests set the skin
through the bridge's `network.storePick()`.

**Privilege.** The collect route answers the same 404 for an unknown PC and a PC with no admin
session, and passes `desktop_request_allowed?`. `keyboard_admin?` is `session_admin?` (power term
included) plus two route terms. `accountOnly` NPCs get no tile, have a key allow-list (`id`,
`displayName`, `npcType`, `creds`, `role`, `accountOnly`, `staff` as an explicit true or false,
`_`-prefixed keys), and are skipped by `NpcHabits.expand!` and `awareness_level`. Reader manifest
`test/models/account_only_readers.yml`; `bin/ops-golden-compare`. The collect action and the
`harvestedAccounts` marker belong to privilege; the proof kind `harvested` belongs to cracking.

**Log rows.** Event names are snake_case and the log plan's names win: `usb_install_overridden`,
`credentials_harvested`, `admin_profile_read`, `signin_refused`, `share_folder_opened`,
`network_swept`, `host_scanned`, `service_checked`, `finding_confirmed`, `technique_refused`,
`technique_used`, `network_alerted`, `mfa_code_ok`, `mfa_code_wrong`, `mfa_code_locked`,
`mfa_prompt_sent`, `mfa_challenge`, `account_password_reset`, `helpdesk_request`. Stage L1a (the
helper and the event list) lands before every other ops stage; L1b is the log plan's own rows.
`write_log_row!` never saves by itself, returns a result with `stored?`, takes `once:` and
`save_limit:` (a count over a window of real server time, with reclaimed entries; there is no
`merge_limit`), and returns nil when the scenario has no `logSources`. Callers on routes that do
not otherwise save do so only when `stored?`. Storage is in `player_state`: 400 bytes a row, 128 KB
in all; ids at most 40 characters and account names at most 32 in scenarios with logs. Place kinds
include `pc`, `host`, `foothold`, `object`, `door`. Identity forms include `{ typed: }` and
`{ npc: }`. The detail once called `by` is `approver`. One shared `route` list: `keyboard`,
`foothold`, `from`, `relay`. The only number in a detail is `{ count: }`, clamped at 9. The log
module builds its own secret registry; L1a registers only today's secrets, each sibling registers
its own in its stage, and issued codes are registered for the life of the request. Helpdesk rows
are always `as: { typed: }` and bounded per desk. Cracking writes no log rows. Open: whether noisy
refusals spend the same per-host `save_limit` count as quiet ones (the core plan leaves it to the
log plan).

**MFA and helpdesk.** No scenario may be left stranded by the wrong-code limit or by helpdesk
`maxTries` (validator warning or error). A remembered code is tied to its device. A saved
connection after a password reset is refused (`typeToSignIn: "password_changed"`). Saved
connections through a second step and approve-from-the-phone-menu are later slices.

**Lock second step (S8c).** Its own plan. One gate keyed on the object's real id; the validator
refuses a `secondStep` object whose name or id collides with another's. The `npc` unlock method
does not skip the step (the browser asserts it); a `flag_reward` does. The attribute lives where a
door's lock really is, on the room. A pending lock request is approved only from the prompt the
attempt opens, or by the player holding the owner's phone while that prompt is live. Log rows reuse
the `mfa_*` events with place kinds `object` and `door`.

The user's wording for S8c, the only user input on it: "MFA should (also?) be flexible to apply to
various kinds of locks as a push accept, for example: the player walks up to a locked PC, or even
open an encrypted zip file -- as an attribute to the object." Reading it as "an attribute on any
lockable object, in addition to the sign-in policy, push as the main case" is mine, not confirmed.

## 6. Work owed that no agent is doing

1. **Round 2 picks page: PUBLISHED 14:25** at https://claude.ai/artifact/Kovtq5LNnBVNGrAYttEg97
   (the round 1 artifact was deleted). Source `ops_plan_picks.html` in the session scratchpad
   (round 1 copy `ops_plan_picks_r1_backup.html`), key `be-ops-plan-picks-r2`, ids R2-1..R2-11
   (R2-10 approval prompt waits for the chat to close; R2-11 fix the two existing-code bugs).
   Waiting on the user's pasted answers. Questions asked:
   - BLOCK-1 follow-up: the relay command was blocked; allow it, run it yourself, or leave.
   - BLOCK-2 confirm: cracker reads only server-granted facts and needs server proof the hash
     was collected (options b and c together).
   - BLOCK-4 re-asked: one private control table drawn by both skins vs a list per skin.
   - LOCK-1 re-asked: NPC unlock on a gated door (a step still due, recommended; b skip; c owner only).
   - LOCK-7 re-asked: a step on a carried item (refused for now, recommended).
   - CORE pretext key: rename `technique` to `se_technique` in six shipped SE scenarios with the old
     key still read (a), or keep `technique` (b). The user's note named the keys; option a said no rename.
   - PRIV implant: session-type implants keyboard-only (recommended) vs any admin session.
   - PRIV needs_console: accept the new visible message in test_access_networks and demo_access_tour.
   - MFA helpdesk: a request made over a PC needs an open session there; in person none.
   - Anything new from the running reviews.
2. **Two existing-code bugs** found by the lock types audit (keycard credential still signs in after
   revocation; validator counts fob/rfid as cards): reported to the user; not ops-plan work.
3. Housekeeping: `.claude/worktrees/docs-access-networks` is on `fix/access-validator-followups` with
   uncommitted dungeon-graph edits; probably another session's. Leave it.

## 7. Waiting on the user

- The cracking route (above). Everything else proceeds on recommendations until round 2.
- Outside this stream, already reported: the sis01 and sis02 log terminal tints its anomaly row
  (`log-filter-minigame.css:336-342`).
