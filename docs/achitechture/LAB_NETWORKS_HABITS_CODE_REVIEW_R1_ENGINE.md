# Lab networks and habits: code review, round 1 (engine and tooling)

Branch `build/lab-networks-habits` against `main`, everything outside `scenarios/`: slice 9.3a
step 9 (lab adopts networks) and slice 9.1 step 8 (lab adopts habits). Commits `0022cd2ec`
(engine), `800ec20b3` and `b3cb03244` (lab, tests only reviewed here), `a30e29ad7` (leak
scanner) and the build log commits. Reviewer: fresh, independent, read-only on code.

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 4 |

## What was checked

- The diff: `app/models/break_escape/network_access.rb`, `network-view-minigame.js`,
  `tools/playtest/lib/access_leak_scanner.rb` and the four test files.
- The paths the engine change touches on the server: `resource_row`, `mapped_shares` and its
  three callers (`mapped_share_stubs`, `find_mapped_share_item`, `share_mapped_at?` through
  `scope_admitted_by_session?`), `session_admits?` for a resource scope, the `GET /container`
  resource branch and `POST /inventory` add with `source_resource_id`.
- The `/unlock` answer path (`games_controller.rb` `unlock`, `Game#validate_unlock`,
  `find_object_in_scenario`, `held_grant_items`), declared grant claims and the bootstrap's
  `strip_all_grant_contents!`.
- Every scenario that declares `resources`: `test_access_networks` (three shares, all with a
  `contents` array, so nothing changes), `test_access_work` (`finance_share` has no `network`, so
  `resources_on` never returns it and nothing changes), and the lab.
- Tests run singly under `RBENV_VERSION=2.7.8`: `access_leak_scanner_test.rb` 24 runs,
  `network_shares_test.rb` 18 runs, `lab_physical_pentest_secrets_test.rb` 35 runs, all 0
  failures; `node --test test/js/network-view.test.mjs` 14 of 14. No Ruby 3-only syntax in the
  Ruby diff (`to_h` with a block, `filter_map`, `index_by` are all 2.7 or ActiveSupport).

## Question 1: the share with no contents

It reveals nothing the server did not already send. `resource_row`
(`network_access.rb:347-351`) has always put `observations` on the row of a resource with no
`contents`, and `GET /network` answers only for a held foothold. The change is that the client now
shows that text (through `textContent`, `showNotice`) where it used to show Open or a padlock.

Server trust holds for a player calling endpoints directly. A share with no contents has nothing
to serve: `GET /container/lw_fs01_records` returns `contents: []` to an admitted player and "not
found" to anyone else, and an inventory add from it finds no item. Dropping it from
`mapped_shares` affects `share_mapped_at?` only for items in that share, and there are none. No
state is added, so reload behaviour is unchanged.

Other scenarios behave as before (see above). The gaps are at the edges of the rule (M1, M2, M5).

## Question 2: the leak scanner and the `/unlock` container answer

It was a false positive, and the change does not hide a server leak. A narrower exemption
would be better (M3), and the reason given for it in the logs and the lab test is partly wrong
(M4).

What the player learns: `records_remote_session` is a declared grant from the
`grant_remote_session` timer (on `kp_usb_foothold`). Its `contents` are stripped from the
bootstrap and room data (`Game#filter_requires_and_contents_recursive`, game.rb:4014), and the
server finds them for `/unlock` or `/container` only while the item is held (`held_grant_items`).
Opening it returns `records_share.txt`, which says the session's account reaches "the client
records share on LW-FS01". The same answer through `GET /container/records_remote_session` is
already exempt from the network rule, along with every other `/container` answer. The `/unlock`
answer carries the same `filter_container_contents` output, so the finding was about authored
item text, not the server leaking network-model data. The network view shows the host and the
share name ("Client-Records") after a drop-box plant, and Sofia's `lord_mapped_drives` profile
file names `\\LW-FS01\Client-Records` to her session.

When: in normal play, after the BadUSB foothold. By direct calls, at any time:
`validate_item_collectible` lets a declared grant be claimed with no trigger check
(`games_controller.rb:2186`, plan section 1.4, existing behaviour). An early claim tells the player
the file server's label and that the intern's account reaches the records share. It gives no
password, no foothold and no share contents, so nothing becomes reachable early. I see no
finding in this change. The grant-claim rule is a known, accepted trade-off.

## Findings

### Blocker

None.

### Major

None.

### Minor

**M1. The client and the server use different tests for "a share with no contents".**
`network_access.rb:350` sends observations when `contents` is nil. `network_access.rb:448` maps
a share only when `contents` is an Array. `network-view-minigame.js:65-68` (`resourceAction`)
offers Look only when the row has `observations`. Two authorable cases fall between them:
- `contents: []`: no observations on the row, Open in the view (an empty folder), and still
  mapped as an empty folder on every admitting desktop, which is the behaviour the change set out
  to remove.
- No `contents` and no `observations`: Open in the view (an empty container), but no desktop
  maps it, so the view and the desktops disagree.

The client also infers the rule from a side effect. If the server ever sends observations for a
share with contents, that share can no longer be opened.
Fix: one server predicate (for example `NetworkModel.listed_only_share?(resource)`: a
`file_share` whose `contents` is not a non-empty Array). Use it in `mapped_shares` and have
`resource_row` send an explicit field (`'listed' => true`, or omit `open`). `resourceAction`
then keys on that field. Add a test for `contents: []` on both sides.

**M2. An access list on a share with no contents now has no effect, and the validator still
treats it as mappable.**
Since the change, such a share is mapped on no desktop. Its row still shows Look with the
observations to every foothold on its network, whatever the list says, where it used to show a
padlock. `scripts/validate_network.rb:301-317` ("Shares nobody can map") and `:388-401`
("Reachable without a foothold: share ... maps on ...") still reason about who maps it, so an
author gets a misleading info line and no warning. No current scenario has this case: the lab's
share has no list, and `test_access_work`'s is on no network.
Fix: the validator warns "share X has an access list and no contents: no desktop maps it, and
every foothold on its network sees its observations". Skip such shares in both existing checks.

**M3. The `/unlock` exemption covers every network string, not just the host label the commit
describes.**
`access_leak_scanner.rb:633` skips the network rule for any string under `$.contents[` of any
`POST /unlock` answer. That includes the network name, resource names and resource observations,
at any depth. The exemption matches `/container` answers, which skip the whole rule
(`:629`), so I do not count it as a hidden leak. It does mean a scenario that pastes a share's
observations or the network name into a locked container's text is never reported on either
route. The new unit test (`access_leak_scanner_test.rb`, the `/unlock` test) checks only a host.
Fix (either one): record which resource field each network string came from in
`collect_network_secrets` and limit the `/unlock` and `/container` exemptions to `host`, or keep
the breadth and say so in the comment at `:37-41` and `:623-626`, with a test showing a network
name in `/unlock` contents is not reported.

**M4. "Host labels are not secret" is true of sign-in hosts, not of resource hosts, and the lab
test relies on it.**
README_scenario_design.md:893 says a sign-in object's `host` is not secret. Plan 9.3 section 6
(the `GET /scenario` row, plan line 665) withholds the resource `host` along with the rest of
`resources`. `lab_physical_pentest_secrets_test.rb:601-606` gives the README rule as the reason to
leave resource hosts out of `hidden`. That test would therefore pass if a regression shipped
`LW-FS01` or `LW-PRN02` in a room or bootstrap answer (only a browser run with the scanner would
catch it). The 9.1 build log (line 569) and the 9.3 build log (line 93) give the same reason.
Fix: add `resources.values.map { |r| r['host'] }` to `hidden`. It should pass, because the
grant's contents are stripped from the bootstrap and the scanner run found no other route. Reword
the comment and the two log entries: the BadUSB note is authored container content, served only
while the grant is held, as `/container` would serve it.

**M5. README not updated for the new share rule.**
README_scenario_design.md:890 says `observations` is "the text of a resource with no contents".
It does not say that a `file_share` with no contents is listed with Look and mapped on no
desktop, which is now engine behaviour authors depend on (the lab's records share).
Fix: one sentence in the `resources` row, and a line in the networks section on choosing between
a listed-only share and an openable one.

### Nit

**N1.** `ACCESS_MODEL_SLICE_9_3_BUILD_LOG.md:92-93` says the timer grant "names the host LW-FS01
in the bootstrap". It does not: grant contents are stripped there and reach the client only
through `/unlock` or `/container` while held. The 9.1 log's later entry has it right.

**N2.** `prove!` (`lab_physical_pentest_secrets_test.rb:28-33`) writes `plantedItems`,
`droppedItems` and `signedInPcs` straight into `player_state`. The two capture-secret tests
therefore check the proof rule, not that the endpoints record the proofs. That is fine for this
file if the engine's E4 tests cover the recording (`record_planted_item!`, the drop and sign-in
paths). Worth a comment naming them.

**N3.** `network-view-minigame.js:19-22` and `access_leak_scanner.rb:623-626` name
`lab_physical_pentest` and "slice 9.1 step 8" in engine and tool comments. Those go stale when
the lab changes. State the rule and keep the example in the tests.

**N4.** `resource_admits_player?` (`network_access.rb` around line 418) still admits a session to a
share with no contents, so `GET /container` answers `[]` for a share no desktop shows. It does no
harm, but it is a third version of the rule from M1. Folding it into the same predicate would
make the "not found" answer consistent.

## Verdict

Approve with minor fixes. The engine change is sound for players and for direct endpoint calls:
it shows only text the server already sent to a foothold holder, serves nothing new, keeps no new
state, and leaves `test_access_networks` and `test_access_work` unchanged. The scanner change
fixed a false positive: the `/unlock` answer carries authored container content, already exempt
on `/container`, served only while the grant is held. Fix M1 and M4 before merge, because those
are where a regression would slip past the tests. M2, M3 and M5 can go to the backlog if time
is short.
