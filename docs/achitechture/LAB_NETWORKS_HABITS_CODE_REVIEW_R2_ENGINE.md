# Lab networks and habits: code review, round 2 (engine and tooling)

Branch `build/lab-networks-habits` against `main` (`git diff main...build/lab-networks-habits`),
everything outside `scenarios/`: slice 9.3a step 9 (lab adopts networks) and slice 9.1 step 8
(lab adopts habits), with the round 1 fixes in `4ba0bb5ed`, `8c698b10d` (tests only reviewed
here) and `14200f06a`. Reviewer: fresh, independent, read-only on code. A second reviewer covers
the lab scenario.

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 |
| Nit | 4 |

## What was checked

- The code diff: `lib/break_escape/network_model.rb`, `app/models/break_escape/network_access.rb`,
  `network-view-minigame.js`, `pc-sessions.js`, `scripts/validate_network.rb`,
  `tools/playtest/lib/access_leak_scanner.rb`, and the seven test files.
- Paths the change relies on but does not touch: `GamesController#scenario` and
  `filter_requires_recursive`, `Game#filtered_scenario_for_bootstrap`,
  `Game#filter_requires_and_contents_recursive`, `DeclaredGrants`, `Game#attempt_login!`,
  `record_login_failure!`, `add_login_lockout!`, the `login` action and its `with_game_lock`,
  `sync_state`'s writable sections, the captured sign-ins filler (`unlock-system.js`,
  `password-minigame.js`), `NetworkLinks#unplug` and `showNotification`.
- Every place in the lab file, its ink and `mission.json` that names `LW-FS01`, `LW-PRN02`,
  `Client-Records`, `Print room printer` or `Ledgerwell office LAN`.
- Tests run singly under `RBENV_VERSION=2.7.8`, all passing:
  `lab_physical_pentest_network_test.rb` 4 runs, `network_shares_test.rb` 18 runs,
  `lab_physical_pentest_secrets_test.rb` 36 runs, `access_leak_scanner_test.rb` 24 runs;
  `node --test` on `network-view.test.mjs` 14 of 14, `pc-sessions.test.mjs` 25 of 25,
  `validator-network-model.test.mjs` 29 of 29 (Ruby found, so none skipped).
- Ruby 3-only syntax: none. `Hash#except` in the secrets test is ActiveSupport on 2.7;
  `filter_map`, `to_h` with a block and `index_by` are 2.7 or ActiveSupport.

## Round 1 findings: closed in the code?

| R1 | Status | Evidence |
|---|---|---|
| M1 two tests for "no contents" | Closed | `NetworkModel.resource_contents?` and `listed_only_share?` (`network_model.rb:63-71`). `resource_row` sends `listed: true` by that rule and observations by `resource_contents?` (`network_access.rb:347-353`); `mapped_shares` uses it (`:452`); `resourceAction` keys on `listed` only (`network-view-minigame.js:65-68`), and `getTestState` uses the same function. Rails test covers missing, `[]` and bare; JS covers `listed` with no observations and observations without `listed` |
| M2 access list on a listed-only share | Closed | Warning at `validate_network.rb:301-307`; both older checks skip such shares (`:312`, `:400`). JS test covers missing and `[]` |
| M3 `/unlock` exemption breadth | Closed (by documenting it) | Header `access_leak_scanner.rb:37-44` and method comment `:626-630` state the breadth; test shows a network name in `/unlock` contents passes and is reported in a room answer |
| M4 resource hosts in the lab test | Closed | `hidden` includes every resource host (`lab_physical_pentest_secrets_test.rb:613-616`), and the new HTTP test checks the real GET /scenario and every room answer (`lab_physical_pentest_network_test.rb:87-104`). See m1 below for what this uncovered |
| M5 README | Closed | `resources` row and the Shares paragraph |
| N1 | Closed | Build log reworded |
| N2 | Closed | `prove!` comment names `capture_proofs_test.rb` |
| N3 | Closed | Engine and scanner comments state the rule; the lab is named only in tests |
| N4 | Closed | `resource_admits_player?` refuses a listed-only share (`network_access.rb:425-426`); GET /container answers 404, the same as an invented id, so there is no existence oracle |

## The round 1 fixes, reviewed afresh

**One definition of "no contents".** Server and client now agree. The server has one predicate
for "holds something" (`resource_contents?`) and one for "listed-only share"
(`listed_only_share?`), used by the row, the mapping, the admission check and the validator. The
client never infers: it reads `listed`. A non-share resource with `contents` is a validator error
(`validate_network.rb:188`), so the remaining combinations are all defined. Reload: `listed` is
derived on every GET /network, so no state is involved. One edge is left: see n3.

**The leak scanner's exemption.** It skips network strings under `$.contents[` of any
`POST /unlock` answer, matching the existing blanket skip for `/container` answers. Both serve
authored container text that the server releases by its own rules, and the server-side release
rules are checked by the scanner's other rules (held grants, container release). I see no server
leak hidden by it. The cost is that author-pasted network strings inside container text are never
reported on either route, which is now stated in the header and tested.

**The bootstrap strip of timer-grant contents.** The real GET /scenario strips every declared
grant's `contents` through `filter_requires_recursive` (`games_controller.rb:1841`), which walks
every hash, so `timers[].actions[].item.contents` goes. Room answers strip through
`filter_requires_and_contents_recursive` (`game.rb:4014`). The HTTP test fails if either strip
regresses, because `records_share.txt` names `LW-FS01`. The model method on its own still ships
them (m1).

*Is anything else left that names a resource host before the player earns it?* Not in GET
/scenario or a room answer. Every other `LW-FS01` is in `accountProfiles.lord_desktop` (stripped
from the bootstrap, served only to a session). `LW-PRN02`, `Client-Records`, `Print room printer`
and the network name appear only in the top-level `networks` and `resources` blocks, which
`withhold_network_keys!` removes. The ink and `mission.json` name none of them. `LW-DOOR01` in
`store_controller` and the capture note is a sign-in host label, public by the README rule. The
one route that reveals `LW-FS01` early is the known grant-claim trade-off from R1: `POST
/inventory` accepts a declared grant with no trigger check (`validate_item_collectible`, `games_controller.rb:2132`), and
an `/unlock` of the held grant returns the file. That is existing, accepted behaviour; it gives
no foothold, password or share contents.

**The unplug toast.** `linkDropped` collects the ended sessions whose desktop is not open, checks
`desktops.has` before `_closeDesktop` (the right order), and raises one toast through
`window.gameAlert` guarded by `?.` and `try`. The open desktop keeps its own "The link dropped"
message, so nothing is said twice. No other code or scenario toasts on unplug (only
`test_access_networks` maps the event, to a task). `NetworkLinks#unplug` emits the event only on a
server success, with the server's `endedPcIds`, so the toast cannot name a session the server did
not end. `host` comes from the server's `login_session_answer` for every remote session and
survives reload through `remoteFields`. Small points in n1.

**The remote sign-in limit at the door controller (`door_controller` policy, `maxAttempts: 5`).**

- *Can a player lock it out by direct requests without trying?* No. A failure is counted only
  after `attempt_login!` has passed the reachability gate: a foothold that reaches the host, and a
  policy that allows remote sign-in (`game.rb:1506-1518`). With no foothold, a headless host
  returns "PC not reachable" before the counter. Every counted request is a password guess for a
  named username. The lock is per PC and normalised username (`"store_controller|c.hampshire"`), so
  a wrong username ("chris", "Chris Hampshire") burns its own key, never hers. The client never
  submits for the player: Captured sign-ins only fills the form, and `ApiClient.login` does not
  retry.
- *Can a player bypass the count?* No route found. `login` is under `with_game_lock`
  (`games_controller.rb:93-94`), so parallel requests serialise and none loses an increment. The key
  uses the PC's id whichever of id or name the request gave, and the same `normalise_username` as
  the account lookup; a Unicode or whitespace variant that escapes normalisation also fails to
  match the account, so it cannot sign in. `loginFailures` and `loginLockouts` are not among the
  sections `sync_state` lets the client write. Unplug and re-plant do not reset it (the key has no
  foothold). Only `reset` clears it, which restarts the game.
- *What a correct password for a non-admitted account does.* It answers "not permitted" without
  counting (`game.rb:1527-1530`). That tells a guesser the guess was right for that account. Wrong
  guesses for that username still count under its own key, so this does not lift the limit; it is
  existing engine behaviour.
- Engine tests cover the remote counter shared with the keyboard and the lock at the limit
  (`network_remote_signin_test.rb:90-104`) and that unreachable or blocked attempts count nothing
  (`:56-85`). The lab test checks only that the policy gives 4 left after one miss (n4).

**Server trust, generally.** Nothing new trusts the client. `listed`, the observations and the
404 are all computed from scenario data. The toast reads only the server's `endedPcIds` and the
host the server sent. The validator change is authoring-time only.

**Reload.** No new state. `listed` is recomputed per request; the toast has none; lockouts and
failures persist in `player_state` as before.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. `Game#filtered_scenario_for_bootstrap` still ships declared-grant contents; only the
controller strips them.**
`game.rb:834-930` builds the bootstrap without `DeclaredGrants.strip_all_grant_contents!`; the
strip happens in `GamesController#filter_requires_recursive` (`games_controller.rb:1841`). The round
1 fix found this and worked around it in the test (`lab_physical_pentest_secrets_test.rb:617`
applies the strip itself before checking). The served answer is safe today and the new HTTP test
guards it. The risk is elsewhere: the model method is what the withholding tests exercise
(`network_withholding_test.rb`, `access_model_withholding_test.rb`, `filtered_scenario_test.rb`),
so none of them can see a grant's contents, and the lab test's own strip means it would still pass
if the controller strip were removed. Any future caller of the model method (a second endpoint,
a host app, a tool) gets the contents. The model also describes itself as the bootstrap's
withholding point (it strips `flags`, `accountProfiles`, `roles`, network keys and capture
secrets there).
Fix: call `BreakEscape::DeclaredGrants.strip_all_grant_contents!(filtered)` at the end of
`filtered_scenario_for_bootstrap`, keep the controller call as a second line of defence, and drop
the manual strip at `lab_physical_pentest_secrets_test.rb:617` so the model test checks the model.
Add one line to `filtered_scenario_test.rb`: a timer `give_item` with `contents` comes back with
`hasContents: true` and no `contents`.

### Nit

**n1. The unplug toast.** (a) `showNotification` builds the message with `innerHTML`
(`notifications.js:203`), so the scenario's host labels go in as markup, where the network view
shows the same strings with `textContent`. Labels are author text, so the risk is low, but the
engine's rule for author text is plain text. Escape the host labels in `unplugEndedMessage`, or
give `showNotification` a plain-text path as `gameConfirm` has. (b) `previous.host || pcId`
(`pc-sessions.js:392`) falls back to an internal object id. The server always sends `host` for a
remote session, so this is a dead path today; "a remote PC" would be a safer fallback than
`store_controller`.

**n2.** The HTTP leak test's `hidden` (`lab_physical_pentest_network_test.rb:89`) leaves out the
resource ids, which the model test includes (`lab_physical_pentest_secrets_test.rb:613`). Add
`resources.keys` so the real answers are held to the same list.

**n3.** `listed_only_share?` reads any non-Array `contents` (an object, a string) as "none", so
an authoring typo silently turns an openable share into a listed one with no validator message.
`validate_network.rb:187-190` could error on a `contents` that is present and not an Array.

**n4.** The lab tests do not exercise the lab's own lockout end to end: five wrong passwords
through the box lock `c.hampshire` at `store_controller`, her right password is then refused, and
the no-foothold attempt in `lab_physical_pentest_secrets_test.rb` (the "her right password with no
foothold is refused" step) leaves `loginFailures` empty. The engine tests cover each rule on the
fixture, so this only guards the lab's wiring (the `policy` name, the headless flag). Two or
three lines in `lab_physical_pentest_network_test.rb`.

## Verdict

Approve. Every round 1 engine finding is closed in the code, the new predicates give one rule on
server and client, the scanner's wider exemption is documented and tested and hides no server
leak, the toast is correct and cannot name a session the server did not end, and the controller's
attempt limit can be neither triggered without guessing nor bypassed (the `login` action holds the
row lock, the key is normalised, and the client cannot write the counters). No GET /scenario or
room answer names a resource host before a foothold; the only early route is the accepted
grant-claim trade-off. m1 is worth doing before merge because it moves the strip to where the
model's tests can see it; the nits can go to the backlog.
