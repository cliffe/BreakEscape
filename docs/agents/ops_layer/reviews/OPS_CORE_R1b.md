# OPS_CORE_PLAN review, round 1b (remaining checks)

Reviewer: Opus 5.5, adversarial. Continues `OPS_CORE_R1.md` (ids M1-M4, m1-m11, n1-n4 used there).
New ids here start at M5, m12, n5. Plan cited by section only (a reviser is editing it). Code as
`file:line` in the `ops-plan` worktree.

**Status: complete.** All three remaining checks done: (1) routes one by one, (2) JSON examples against the schema,
(3) completeness and shippability.

## Findings

### Check 1: routes, one by one (plan sections 5.2 to 5.4 and 6)

Compared with `plant_device!` and `unplug_device!` (`app/models/break_escape/network_access.rb:233-334`)
and their actions (`app/controllers/break_escape/games_controller.rb:1758-1823`). Those routes
answer 400 with `error: 'Missing jack_id'` before the model runs, every refusal body carries
`success: false, reason, error` (a player-facing string), a repeat answers `already: true` with
the same fields (NA:251-256), and `delta: true` governs only the inventory fields of the answer
(GC:2360-2365, NA:224). M3 in R1 already covers the 403-before-404 order on all four routes and is
not repeated.

#### M5 (major). `/network/technique` does not say what makes a request a repeat, and the obvious reading opens a desktop that refuses

Plan 5.4: "Both add the finding id to `opsUsed`. A repeat use answers `already: true` with the same
fields; if the session has since ended (an unplug, a newer sign-in at that PC), a repeat use grants
it again after the same checks." Three cases are not settled:
1. Repeat through a different foothold. The player used the card through foothold A, holds
   foothold B that also reaches the host, and uses it again from B's view. If "repeat" means
   `opsUsed` holds the finding, the answer is `already: true` with the A-session, the client calls
   `openRemoteDesktop(pcId, B)` (plan 5.4, `NV:880`), and `desktop_request_allowed?` refuses it
   with 403 `unreachable` on a blocked host (the plan's own table row "naming a different held
   foothold"). The route has answered success for something the next request refuses.
2. Whether a repeat runs the checks. "Same fields" suggests the stored answer; the next clause says
   only a re-grant runs "the same checks". A repeat after `fixedIf` came true, after the card was
   dropped, or with the host off would then answer success where a first use is refused, which
   section 5.4's table ("A new use is refused") contradicts.
3. A credential grant has no session to end, so "already" is the only answer, but the plan does
   not say whether `keyringChanged` is repeated.
Fix: define the repeat in section 5.4 as "`sessions[pcId]` is a technique session whose
`technique` is this finding id and whose `foothold` is the foothold named" (session grant) or
"`opsUsed` holds the finding id" (credential grant). Run checks 1 to 3 (finding held, reach and
responding through the named foothold, card held) before the repeat test, so a repeat never answers
more than a first use would; then answer `already: true` with the live session answer. Anything
else is a new use and runs every check. Add the two-foothold case to `network_technique_test.rb`.

#### m12 (minor). A repeat `/network/check` can wipe a confirm

Plan 5.3: "A check ... adds an `unconfirmed` entry for each weakness not fixed and each decoy of
that service". Section 6 says the same ("adds findings") and gives `/check` no `already`. Written
as an assignment, a second check after a confirm resets `c` or `f` to `u` in `opsFindings`
(section 8), and the card then refuses `not_confirmed`. Fix: say a check writes `u` only for ids
not already in `opsFindings`, answers each finding with its stored status, and sets `already: true`
when it added nothing. Test: confirm, check again, status kept.

#### m13 (minor). Refusal codes and bodies are missing for several checks

- `/check` and `/confirm`: "reachable, responding" has no status or reason. `/scan` uses 403
  `unreachable` and 403 `not_responding`; say the same here.
- `/check` does not validate `service`: an unknown service name on a scanned host, or a service
  whose host is fine but which the scenario turns off, has no answer. Suggest 404 for an unknown
  name (the service list is known to the player after the scan, so 404 leaks nothing).
- `/technique` (plan 5.4): "the item is held, not forged, and carries a technique in the
  registry" has no reason codes. Suggest 422 `no_card` for all three, so a forged copy and a
  non-card answer alike.
- Every existing network refusal carries an `error` string beside `reason` (NA:236-247, NA:297);
  the plan's bodies (`{ success: false, reason, need? }`) do not, and the refusal texts move to
  `ops-model.js` (plan 5.5). Say which: the client maps `reason` to text (then the server need not
  send `error`), or the server sends `error` as today.
- Missing params: the existing actions answer 400 `Missing <param>` before the model runs
  (GC:1762, :1816). Section 6 lists no 400. `/scan` with both `network_id` and `host_id`, or
  neither, needs one too.
Fix: one line per route in section 6 with the 400, and the codes above.

#### m14 (minor). `/scan` on a host checks `services` before `responding`, so an off host tells whether it has services

Section 6, `/scan` for a host: "host declares `services` (422 `not_needed`), host responding (403
`not_responding`)". A host that is off answers `not_needed` when it has no services and
`not_responding` when it has some, so a player learns which off hosts are worth coming back to
without a scan. Small, but section 7 says nothing about services reaches the browser before a
scan. Fix: test `responding` before `services`.

#### m15 (minor). The sweep and technique answers are not one body the view can render

- A sweep answers `{ network: { id, hosts: [rows] } }`. Plan 5.2 says a sweep also brings the
  network's resource rows and sets `swept` on the block, and the same network can appear as a
  block in every held foothold's view and as the flat `hosts` of the foothold whose own network it
  is (`network_view`, NA:767-771; `network_blocks`, NA:804-810). The answer covers one of those
  places. Sweeping also makes every host on the network pass `host_reachable_through?` (plan 5.2),
  which changes the Open controls and account tiles in other views and the keyring's routes.
- The technique session grant changes the host row (session listed, `access`), may end pivot
  sessions (`endedPcIds`, so other blocks go down), and a credential grant asks for a `GET
  /keyring` refetch (plan 5.4).
Fix: say in section 6 that after every ops success the view does its existing `GET /network`
refetch (the network view already refetches after sign-in and unplug), and keep the route answers
to what the click needs to animate (the changed rows). Or answer the full `network_view` body from
`/scan` and `/technique`. Either is fine; the plan should pick one and test it in
`api-client-network-ops.test.mjs`.

#### m16 (minor). Policy methods and their role tests are missing

Each action calls `authorize @game` (GC:1751, :1759) and `pundit` is a hard dependency
(`break_escape.gemspec:17`), so `network_scan` with no `network_scan?` in
`app/policies/break_escape/game_policy.rb` (network methods at `:146-166`) raises. The role tests
list every network action by name (`test/unit/break_escape/policy_test.rb:124`). Section 12.2 lists
neither file and section 11 has no policy test. Fix: four `?` methods returning `show?`, the four
names added to `DEVICE_ACTIONS`, and `game_policy.rb` and `policy_test.rb` added to section 12.2
(every ops plan adds lines there).

#### n5 (nit). `delta: true` means nothing on these routes

Section 6: "All four ... take `delta: true`". The flag selects the inventory part of an answer
(GC:2360-2365, `inventory_answer_fields`, NA:224); none of the four routes changes the inventory.
Drop it, or say the technique route answers the inventory delta (empty) so the client's network
calls stay uniform.

#### n6 (nit). A confirm on a fixed finding

Plan 5.3 now says a repeat confirm of a settled finding answers `already: true`, is quiet and
writes nothing (section 6's table does not yet say so; copy it there). Neither says what a first
confirm on a finding whose `fixedIf` now holds answers, nor whether it is a probe that adds noise.
Suggest: it still confirms (the player learns it was real), shows "Fixed", and is quiet, since
section 1 makes a refusal for a fixed service quiet.

Note on m12: plan 5.3 now also "gives each the next alias" on a check, so a repeat check written
as an assignment would hand out new aliases (`f3`, `f4`) for findings already shown as `f1`, `f2`.
The fix is the same: only ids not yet in `opsFindings` get an entry and an alias.

Seeding and repeatability: no finding. Plan 5.6 has no rolls; every answer is a function of the
scenario and server state, ordered by id.

### Check 2: JSON examples against `scripts/scenario-schema.json` as it is today (plan section 4)

How the schema reports today: a closed block (`additionalProperties: false`) makes json-schema
report an unknown key as an error; an open block (the top level, `definitions.item`) gets a
validator warning per undeclared key (`scripts/validate_scenario.rb:789-830`). Item `type` must be
a PNG in `public/break_escape/assets/objects/` (`validate_scenario.rb:75-82`, `:3259-3272`).

| Example (plan section) | Property | Today | After plan 9.1 |
|---|---|---|---|
| 4.1 `networks.office_lan` | `discovery` | rejected: `networks.<id>` is closed (`SC:317-338`) | added |
| 4.1 top level | `hosts` | warned as unknown (top level open, no `hosts` property) | added |
| 4.1 `hosts.print01` | `sprite: "printer"` | n/a | accepted; no `printer.png` in `assets/objects/` (only `printer_3d2.png`; `printer.png` is in `objects.old/`), and the network view draws no sprite at all (no `sprite` read in `network-view-minigame.js`) |
| 4.1 `files01` object | `name` | **missing, required** (`definitions.item.required` is `["type", "name"]`) | still missing |
| 4.1 `files01` object | `services` | warned as unknown on an item | added |
| 4.2 service | `weaknesses`, `decoys` | n/a (inside `services`) | added |
| 4.2 weakness | `grants.credential: "print_admin"` | names a `credentials` entry the example does not show | needs `credentials.print_admin` with `kind`, `account`, `proof`, `connectsTo` |
| 4.3 top level | `techniques` | warned as unknown | added |
| 4.3 card | `type: "technique_card"` | **validator error or warning: no `technique_card.png`** | still flagged; section 9 does not mention it |
| 4.3 card | `technique` | warned as unknown on an item | added |
| 4.3 (prose) | `credentials.<id>.proof.technique` | rejected: `proof` is closed (`SC:293-306`); `CM:36` `PROOF_KINDS` lacks it | added |

#### m17 (minor). The `files01` example is missing the required `name`

`definitions.item` requires `type` and `name` (`scripts/scenario-schema.json`, item definition at
`:5144`). The 4.1 sign-in object has `id`, `type`, `lockType`, `headless`, `host`, `network`,
`services` and no `name`, so it fails the schema as printed. It also shows no account or `access`
list, which a session grant on that PC (4.3: "an `account` ... that the host's `access` list
admits") needs. Fix: add `"name": "File server"` and an `access` list, so the S3 grant has a
complete host to point at.

#### m18 (minor). `technique_card` has no sprite, and the plan does not say what draws a card

The 4.3 card is `type: "technique_card"`. An item's `type` is its sprite (`definitions.item.type`
description) and the validator flags a type with no PNG in `assets/objects/`
(`validate_scenario.rb:3259-3272`); there is no `technique_card*.png`. Section 0 says a card is "any
tray item type", which contradicts the example. Fix, pick one: (a) the example uses an existing
paper sprite (`notes1` and its siblings exist) and the plan says any item type may carry
`technique`; or (b) `technique_card` is an engine type with its own art, listed in section 12 as an
art request and exempted in the validator the way `capture_log` is (`:3263-3267`) until the art
lands. (a) needs no art and no validator change.

#### m19 (minor). The credential grant has no example, and it leans on keyring fields the plan does not show

4.2 grants `credential: "print_admin"`; 4.3 says the entry is a `saved_connection` whose `proof` is
`{ "technique": "<findingId>" }`. A complete entry also needs `account` (required,
`SC:314`) and `connectsTo` (required for connecting kinds, `SC:307`), and the PC named by
`connectsTo` must take `saved_connection` under its policy (`CM:30` `DEFAULT_ACCEPTS` includes it,
but a named policy may not). None is shown, and S3's first playtest beat uses this grant. Fix: add
the credential entry to the 4.3 example:
`"print_admin": { "kind": "saved_connection", "account": "<npcId>", "connectsTo": "files01",
"proof": { "technique": "print01.admin_page.factory_login" } }`, and say the validator checks the
`connectsTo` PC's policy accepts `saved_connection` (the existing rule, if there is one, cited).

#### m20 (minor). Section 9.1 leaves the shapes of `needs` and `grants` to "the fields and enums of section 0"

Section 0 gives `grants` as "exactly one" of two forms and `needs.item` as "`<itemType or itemId>`".
JSON Schema needs `grants` written as a closed object with `minProperties: 1, maxProperties: 1` (or a
`oneOf`), and `needs.item` meaning either a type or an id cannot carry an `x-ref`, so the validator
cannot report a dangling name. The `needs.global` requireGlobal form needs the same `oneOf` as
`offWhen`. Fix: write the three definitions in 9.1 (`weakness`, `decoy`, `needs`), and split
`needs.item` into `item` (an id, `x-ref`) and `itemType` (a type), or pick one.

#### n7 (nit). Finding ids do not match the id pattern section 0 states

Section 0: "Ids match `^[a-z][a-z0-9_]{0,63}$`." A finding id is
`<hostId>.<serviceName>.<weaknessId>`, with dots and up to about 194 characters, and it is the
value of `credentials.<id>.proof.technique`. Say the pattern applies to authored ids only, give the
finding id its own pattern, and have the proof's schema description say so.

#### n8 (nit). `access` now has two meanings on a sign-in PC

On a room object `access` is an `accessList` (`definitions.accessList`: `roles`, `people`; who may
sign in). The plan adds `access: "user" | "admin"` on the session record and in
`grants.session.access`. The brief fixes the word, so keep it, but section 0 should say the PC's
`access` list and a session's `access` level are unrelated, and the validator's messages should say
"access level" for the new one.

Cross-plan fields the examples rely on: `access` level semantics (S5a, said in section 0);
`accepts` and MFA not applying to a technique session (S8, said in 5.4). `needs.session: "user" |
"admin"` relies on S5a's reading of a session with no `access` key, which section 0 leaves to S5a:
a step-up need cannot be validated or tested in S3 until S5a says whether a password session counts
as `user`. Recorded as part of m20's fix: state the S3 default (a session without `access` counts as
`user`) so S3 can test it alone.

#### m21 (minor). The 4.2 `evidence` and `networks.<id>.alert` fields have no schema row

The 4.2 example now carries `evidence` on a weakness and a decoy and `alert: { after, sets }` on
`networks.office_lan`. `networks.<id>` is closed today (`SC:317-338`), so `alert` is a schema error
until added; section 3's early-field table counts on exactly that. Section 9.1's table has rows
for `discovery`, `hosts`, `services`, `weaknesses`, `decoys`, `techniques`, the item's
`technique` and the proof kind, and none for `evidence`, `alert` (`after` 1 to 20, `sets` an
`x-ref` to a declared global) or a finding `alias`. Fix: add the rows, and the validator checks
in 9.2 (an `evidence.item` that exists and can be held, `alert.sets` declared and not written by
any ink or event the client runs).

### Check 1 addendum: the routes after the noise rule (plan sections 1, 5.3, 6)

#### M6 (major). Noise makes refusals and confirms write state, but section 6, section 8 and the tests still say they write nothing

Section 1 and 5.3 now say a probe (a confirm without evidence) and a card "used where reading would
have ruled it out" (wrong class, product or version, or any card on a false finding) each add one
to `opsNoise[network]`, and reaching `alert.after` sets a global returned through `serverGlobals`
(`GM:193-243`). Elsewhere the plan has not caught up:
- Section 6 lists no noise write and no `noise`, `alerted` or `serverGlobals` in any answer, so
  `/confirm` and a refused `/technique` give the client no way to update the block's "Noise 2 of
  5" without a refetch, and no way to learn the alert global in the same answer.
- 5.4's refusal order puts `false_positive` (noisy) before `fixed` (quiet) and the match reasons
  (noisy) after `fixed`; that is fine, but the plan should say per reason whether it adds noise,
  in the 5.4 list itself, since a refusal that writes is the exception the route tests must check.
- Section 8 still lists three keys and "`ACCESS_STATE_DEFAULTS` (three keys)" in 12.2; `opsNoise`
  (and wherever aliases live) is missing from the table, its bound and its reset behaviour (does
  an unplug clear noise? a reload keeps it?).
- Section 11.2: `network_technique_test.rb` asserts "every refusal ... each asserting nothing was
  written", which is now false for four reasons. 11.4's `test_ops_access` beats 3 and 4 say "row
  only" for uses that add noise. No unit, controller, node or playtest row covers a quiet confirm
  with evidence, a probe, the count capping at 99, the alert setting its global once, or the
  global being refused from a sync body.
- Idempotence: a refused wrong-card request repeated by a client retry adds noise twice. Say the
  client does not retry these POSTs (check `api-client.js`'s retry rule) or that the count is
  per distinct (finding, card) pair, which also stops one careless double-click costing two.
Fix: carry noise through sections 6, 8, 11 and 12.2, add `noise`/`alerted`/`serverGlobals` to the
confirm and technique answers, and add a `test_ops_findings` run with an `alert` that reaches its
limit and a `fixedIf` on the alert global (the patch-on-alarm pattern section 1 promises).

### Check 3: completeness and shippability

**Template.** All fifteen sections of brief section 7 are present (plus a section 0 of shared
shapes). Section 15 gives options and a recommendation for each question. No finding on the
headings themselves; the gaps are in content, below.

#### M7 (major). S2 cannot ship alone: a weakness's required `grants` names S3 machinery

Section 0 makes `grants` part of every weakness ("exactly one"), and section 9.1 builds the
weakness definition in S2 "with the fields ... of section 0". A `grants.credential` must name a
credential whose `proof` is `{ "technique": ... }` (4.3; the validator "requires the two to name
each other"), and `proof.technique` is added in S3 (9.1's S3 row); a `grants.session` needs a
sign-in host and a `via: "technique"` session, also S3. `test_ops_findings` (11.4) has weaknesses on
the printer and the camera recorder, which are hosts with no sign-in, so their only legal grant is
a credential, which is a schema error at S2. Either S2's scenario fails the validator, or the
author leaves `grants` out and S2's schema must not require it.
Fix: in S2, `grants` is optional and the "not built yet" table of section 3 makes a `grants` key
an error ("not built yet: N15") until S3 lands; S3 makes it required. Say so in 9.1 and section 3,
and have `test_ops_findings` carry no `grants`.

#### M8 (major). Every stage's playtest asserts log rows that S9 writes, and S9 lands after this plan

The 11.4 beat tables check `network_swept`, `host_scanned`, `service_checked`,
`finding_confirmed`, `technique_refused` and `technique_used` rows ("one `host_scanned` row", "row
only"). Section 13 lists them as this plan's rows, section 14 asks S9 for the helper ("must accept
a row with no NPC actor"), and 12.2 says "This plan should land first among the six: S5a, S6, S7
and S9 all read shapes it creates". So when S1 ships, there is no log helper and no table to
assert against. Fix, pick one and write it into section 12.1: (a) S1 ships the one-function log
helper the brief allows (section 2.1: "one function that writes a log row") and S9 builds its
table on it; or (b) the rows are S9's to write and test, and the 11.4 "server records" column drops
them until S9 lands, with S9's plan adding the assertions. (a) keeps each stage's playtest whole.

#### m22 (minor). The playtests' server-side reader is not named or extended

11.4: "reads the server's record with the playtest's state reader". That reader is
`tools/playtest/verify-run.rb <game_id> --access` (`scenarios/test_access_networks/PLAYTEST.md:43`),
and its `ACCESS_KEYS` (`tools/playtest/verify-run.rb:68`) do not include `opsDiscovered`,
`opsFindings`, `opsUsed` or the noise key, so the "server records" column cannot be read as
written. The client side, `window.__test.access.networkView(id)`, returns `{ id, via, name,
network, hosts }` (`docs/test-bridge.md:443`), with no `networks` blocks, so `swept`, `ops`,
`noise` and the per-block rows are visible only through the view's `getTestState` while the view
is open. Fix: add `verify-run.rb` (the ops keys, printed in id order) and
`systems/test-bridge/access.js` (`networkView` returning `networks` too) to section 12.2 and
`docs/test-bridge.md` to the docs step; state that hostile beats are sent with `eval` and
`fetch` carrying the `X-CSRF-Token` header, as `scenarios/test_access_habits/PLAYTEST.md:308`
does, and captured into the responses file for the leak check.

#### m23 (minor). Several beats cannot be scripted exactly as written

- `test_ops_findings` beats 5 and 7 and `test_ops_access` beat 6: "waits for the refetch". The view
  refetches every five seconds only while open (`network-view-minigame.js:85`, `:274`); picking up
  the manual and flipping the switch happen in the world with the view closed. Write "reopens the
  view" (a fresh `GET /network`) so the beat has one deterministic trigger.
- `test_ops_access` beat 1 "scans and checks everything" and beat 3 "confirms all": with the noise
  rule, confirming every finding without evidence probes each one, and the beat's outcome now
  depends on whether the scenario sets `alert`. Say which findings have evidence in the room and
  what the noise count is at the end of each beat.
- `test_ops_access` beat 4 expects `wrong_class` "then `wrong_version`" from two cards on the same
  weakness, but the 5.4 order checks status before the match, and the first weakness of `vault01`
  must be confirmed first (beat 3 "confirms all" does this; say so in beat 4).
- `getTestState` (plan 5.5) lists `scanned`, `services`, `findings`, `techniques`,
  `selectedFinding`; add `noise`, `noiseLimit`, `alerted`, each finding's `alias` and `evidence`,
  and the selector for Probe versus Confirm, or the S2 beats have nothing to read.

#### m24 (minor). S1's view tests depend on S2's fields being absent, but S1's no-change proof does not say so

Section 10's golden answers prove an old scenario unchanged. S1 also changes every discovery
network block (`swept`, `ops`) and adds device rows; nothing in 11.2 proves an S1 scenario with
services but no `weaknesses` sends no `findings: []` key on a row (5.3 puts findings "beside
`services`"), which would be a byte change between S1 and S2 for the same scenario. Fix: one
assertion in `network_findings_test.rb`: a host with services and no weaknesses or decoys carries
no `findings` key, scanned or not.

#### Open questions (section 15): which are the user's and which the plan should settle

| Q | Topic | Verdict |
|---|---|---|
| 1 | Where a host with no sign-in is declared | Settle: an authoring-shape choice with a clear winner (a). Move to a stated default in 4.1 |
| 2 | Discovery enforced or display | User's: it decides whether scanning is a real step. Keep, recommend (a) |
| 3 | What a technique card is | Settle: brief section 2.3 already names "technique (the card that grants access)"; (a) is the brief's own model |
| 4 | Does a wrong card cost anything | User's, but **stale**: it still recommends (a) "nothing, but it is logged", while section 1 now says the plan "is written to its recommendation" of noise. Rewrite the options as (a) noise per network with an optional alert (the plan as written), (b) nothing, (c) a per-host lockout, and recommend (a) |
| 5 | Technique session ignores `remote: "blocked"` and lockouts | User's: it is the teaching point of S3 and touches S8 |
| 6 | Game time | Settle: no server clock exists; "no cost in S1 to S3" is a default, not a choice |
| 7 | Sweep needs a tool | Settle: default (a), with `scanNeeds` noted as a later field (or in `docs/IDEAS_BACKLOG.md`) |
| 8 | Technique session counts as signed in | Settle (a): no code change and consistent with every other session; the user need not be asked |
| 9 | Password from a technique | Settle (a) for S3; (b) is S5b's or S7's to raise |
| 10 | Sign-in replaces a technique session | Settle (a): the existing one-slot rule |
| 11 | Referred to in 4.3 ("question 11") | **Missing**: section 15 ends at 10. Add it (the README wording for the two meanings of "technique") or drop the reference; it is a settle-with-default item |

#### n9 (nit). Open questions 4 and 6 point at "the parked defence work" and "the parked patch-window work"

Neither is named in `docs/IDEAS_BACKLOG.md` by the plan, so a reader cannot find them. Name the
backlog entry or drop the clause.

## Counts

Blocker 0, major 4 (M5-M8), minor 13 (m12-m24), nit 5 (n5-n9).
