# Dungeon graph for slice 9.3b: code review, round 4

Branch `build/graph-net` at e41e213b2. R3 fixes in fa9959eb9, build log e41e213b2. Round 3:
`DUNGEON_GRAPH_9_3B_CODE_REVIEW_R3.md`.

Counts: 0 blocker, 0 major, 5 minor, 5 nit.

## How this was checked

- Read `git show fa9959eb9` for `scripts/generate_dungeon_graph.rb`, the new tests, and on the
  server `NetworkAccess#mapped_shares` (987-1010), `reach_walk` (810-837),
  `host_reachable_through?` (899-905), `desktop_request_allowed?` (911-920),
  `remote_blocked?` (675), `Game#login_desktop_contents` (1460-1467) and `attempt_login!`
  (1561-1575). Read the validator's graph step (`validate_scenario.rb:6931-6944`) and the
  playtest skill's use of `dungeon_graph.json` (step 2).
- `node --test` on every dungeon graph file: networks 43 of 43, workarounds 3, habits 8,
  story gates 1, identities 5, grants 1, all passing.
- Regenerated `scenarios/test_access_networks` from a scratch copy: the `.html`, `.md` and
  `.json` are byte for byte the committed files.
- About 35 hand-made fixtures run against the real generator (scripts in the session
  scratchpad, `r4/f1.mjs` to `r4/f4.mjs`). Results are quoted under each finding.

## Round 3 findings

| R3 | Status | Evidence |
|----|--------|----------|
| M1 whole-file scrub | Fixed | `scrub_label` (`:547-551`) runs on labels in `emit_mermaid_diagram` and the JSON builder; `hide_id` (`:552-556`) on ids. A sweep of 24 keys that are page or Mermaid text (`function`, `const`, `class`, `div`, `style`, `lock`, `room`, `hidden`, `mermaid`, `node`, `true`, `null`, `label`, `wifi`, `Lobby`, `kind`, `edges`, `start`, `Network`, `exposes`, `n0`, `0` and two with punctuation), each also in an NPC name: every run exits 0, every inline script passes `node --check`, and the name is drawn with the stand-in. The tests cover `function`, `fullscreen` and `office`, with ids not holding the key unchanged. See m1, m5 and n1 to n4 for what the new design leaves. |
| m1 quoted and short keys | Fixed | The `'` form is in `WIFI_KEY_FORMS`; no length floor. Tests present. The validator warning for a psk under 8 characters is still only proposed. |
| m2 brief cut | Fixed | `brief_full` is scrubbed before the cut (`:1874`). Test present. |
| m3 folder lock on a share or desktop | Fixed | Fixture: share, locked `outer`, plain folder with no id, password-locked folder with no id, key note. Edges `resource_inbox -> lock_outer -> lock_resources_inbox_contents_0_contents_0_contents_0 -> clue_key_note`, with the inner lock labelled from its name. |
| m4 headless admitter | Partly fixed | `share_host` (`:676`) needs a foothold that reaches the host's network, which matches `attempt_login!`. It does not check the host's remote policy, and the edge still does not depend on the foothold: see m4 below. |
| n1 other letter case | Fixed | Every regex is case-insensitive; test present. |
| n2 terminal line | Fixed | `path_labels` and the props-open warning are scrubbed; test present. |
| n3 containers at any depth | Fixed | `object_from` walks the path up; test present. |

## Minor

### m1. A label built from an id that holds the key prints the key with spaces for its underscores

`:1648`, `:155`, `:375`, `:809`, `:1088` and the room and contents labels, all of the form
`id.tr('_', ' ').split.map(&:capitalize)`. `hide_id` hides the id, but the label derived from it
is no longer any form in `WIFI_KEY_FORMS`, so `scrub_label` leaves it and the final check does
not count it. Fixture: psk `sea_breeze_2025`, a room `sea_breeze_2025_annex` with no door sign
and a safe `sea_breeze_2025_box` with no name. The key as written is in no output, but
`Sea Breeze 2025` is in the HTML 9 times, the Markdown 9 times and the JSON 3 times
(`hidden_1["Sea Breeze 2025 Annex<br/>Key lock"]`, `hidden_3["Sea Breeze 2025 Box<br/>PIN lock"]`).
A key with hyphens has the same problem through its `nid` form (`Harbour-Guest-2025` is
`harbour_guest_2025` in an id, then `Harbour Guest 2025` in the label). WPA keys are exact, so
this is not the key, but it is one step from it, more so than the other-case form R3 n1 covered.

Fix: add one more label form per key, the key with every run of `_` and `-` turned into a single
space (and the same for `nid(k)`), so `scrub_label` and `check_wifi_key_free` both see it. Or
derive every fallback label from `hide_id(id)` when the id holds a key. Add the underscore key to
the test with a room named after it.

### m2. The test switch can be left on without any sign, and the stop message then blames the generator

`:546`. `DUNGEON_GRAPH_TEST_NO_SCRUB=1` turns off `scrub_label` for the whole process and says
nothing. On a scenario where no authored label holds a key, a run with the switch on looks and
behaves exactly like a normal run. On one where a label does, the run stops with
`still holds a Wi-Fi key ... a path scripts/generate_dungeon_graph.rb does not scrub`, which
sends the reader looking for a generator bug instead of at their shell. The validator runs the
generator with `system`, so an exported variable reaches it too, and turns the stop into
"Dungeon graph generation failed (non-fatal)" (see m3). The check still runs with the switch on,
so in practice no key is written (n2 is the exception), which is why this is minor.

Fix: when the switch is set, print one line to stderr on every run (`DUNGEON_GRAPH_TEST_NO_SCRUB
is set: the label scrub is off`), and name the switch in the stop message when it is set. If
wanted, honour it only alongside a second test-only signal (for example `NODE_TEST_CONTEXT`,
which `node --test` sets for its children), so a developer shell cannot set it alone.

### m3. A stopped run leaves the previous graph on disk, and the validator calls it non-fatal

`:2223-2227` and `validate_scenario.rb:6935-6941`. `check_wifi_key_free` aborts before any
`File.write`, so the old `dungeon_graph.html`, `.md` and `.json` stay as they were (fixture: an
old `dungeon_graph.md` holding `OLD GRAPH` is still there after the stop). Those files may come
from a run before this scrub existed, so they can be the very leak the check is there to stop,
and they are committed files. The validator prints only "Dungeon graph generation failed
(non-fatal)" and exits on its own checks. A playtest that regenerates before a run (as the skill
says) then reads a stale graph without knowing.

Fix: on a stop, delete the three outputs (or write a one-line placeholder that names the stop),
and have the validator print the generator's stderr line and count a stop as a failure rather
than "non-fatal". The validator half is for its owner.

### m4. A headless host with remote sign-in blocked still opens a share, and the share edge skips the foothold

`:676` and `:690-706`. `share_host` admits a headless host when a foothold reaches its network,
but a remote sign-in is also refused when the host's policy says `remote: blocked`
(`attempt_login!`, `game.rb:1569`, through `remote_blocked?`). Fixture: one network with an
access point, a headless `door_box` admitting `finance` with policy `hardened`
(`{ remote: 'blocked' }`), an access-listed share for `finance`. The graph draws
`signin_lena -> resource_vault`, as it does with no policy. On the server there is no way to get
a session at the box: walk-up is refused because it is headless, remote because it is blocked,
so the share is never mapped.

Second, where the route does exist, the only edge into the share is `signin_lena`. The foothold
(the access point and its key) is a real prerequisite of a headless session but is not on any
path into `resource_vault`, so a reader or the playtest's ordering check sees the share as open
before the Wi-Fi is joined. The host's own sign-in lock already has `net_office_lan` as an input.

Fix: for a headless host, also require that its policy (`pc['policy']`, else the scenario's
`defaultPolicy`, looked up in `policies` as the habits code does at `:442` and the server's
`effective_policy` does) does not say `remote: 'blocked'`. For the edge, when
every admitting host is headless, draw the share from that host's sign-in lock node
(`lock_<pc>`, fed by the network and the account) instead of from `signin_<npc>`. Add the
blocked-policy case to the headless test.

### m5. Hidden ids give a reader no way back to the scenario, and their numbers move

`:552-556`, `:1037`. The R3 advice was followed: an id that holds a key becomes `hidden_<n>`
and every other id keeps its value. Two things are left for the JSON's readers.

- Nothing says what a hidden node was. With key `office`, the JSON has `hidden_2` labelled
  `WIFI_KEY_HIDDEN` (the room) and `hidden_3` labelled `WIFI_KEY_HIDDEN_lan<br/>Network`. With
  key `Lobby`, `start_room` is `hidden_1`. The playtest skill maps graph ids to rooms and locks
  to decide what must come first; it cannot place these, and no legend line in the Markdown
  explains the token or the ids.
- Numbers are given by first use across the puzzle diagram, the other tabs and the JSON, and
  the props-open warning (`:1037`) calls `hide_id` during the build, before any diagram. So
  adding a node earlier in the walk, or a missing door that triggers the warning, renumbers every
  hidden id after it. The committed graph files churn, and an id quoted in a playtest report or
  review no longer matches the next graph. Runs on the same scenario are stable (tested).

Fix: add `"hidden": true` to a hidden node in the JSON and one legend line to the Markdown
("ids and labels marked hidden held a Wi-Fi key"). Better, have the validator warn when any id
holds a Wi-Fi key, so the author renames it and the graph needs no hidden ids at all. Number by
sorted original id rather than first use, so a new node does not renumber the others.

## Nit

### n1. The generator's own stand-ins can trip the final check

`:534-536`. `key_free` checks the words `hidden`, `WIFI_KEY_HIDDEN` and so on, but not the ids
built from them (`hidden_1`, `hidden_12`) or the stand-in next to the label text around it.
Fixture: psk `den_1`, a room `garden_1`. The room becomes `hidden_1`, which holds `den_1`, so the
check stops the run although nothing authored leaked (control: psk `Garden_12`, room
`garden_12_yard`, passes). Only a short key with an underscore and digits does this. Fix: check
the whole id `"#{WIFI_ID_TOKEN}_#{n}"` against the key forms when handing it out, and skip to
the next number or token.

### n2. The skeleton's counters can hide a leak

`:1723`, `:2221` and `:1648`. The skeleton names nodes `n0`, `n1` and so on, and its start room
label becomes `N0`-style text. The real page has none of these, so for a key of that shape the
skeleton's count is too high and a leak is not counted. Fixture with the scrub off: psk `n1`, NPC
name `Lena n1`: the run exits 0 and writes `Lena n1` 3 times into the HTML and Markdown and once
into the JSON. Psk `N12` and `function` with the same fixture are stopped as they should be.
Unreachable for a WPA-length key (8 or more characters). Fix: number skeleton ids with the same
stand-in scheme as `hide_id` (for example `hidden_<n>` checked by `key_free`), so the skeleton
holds no text the real page lacks.

### n3. A hidden id can collide with an authored id

`:555`. Nothing checks that `hidden_<n>` is free. Fixture: key `office` with a room `office`
and another room authored as `hidden_2`: the JSON has two nodes `hidden_2` (`WIFI_KEY_HIDDEN` and
`Hidden 2`), so Mermaid draws them as one. No scenario today has an id of that shape (grep of
`scenarios/`). Fix: skip any number whose id is already a node id in any of the graphs.

### n4. The `nid` form of a key with punctuation can be very short, and it scrubs labels

`:531`. `nid(k)` is one of the label forms. For a key that is mostly punctuation it can be one
or two characters: psk `!!a!!` has `nid` form `a`, and every `a` in every label is replaced
(the sign-in node for `Lena Hart` is labelled
`LenWIFI_KEY_HIDDEN HWIFI_KEY_HIDDENrt sign-in<br/>(lhWIFI_KEY_HIDDENrt)`), and four unrelated
ids are hidden. Nothing leaks; the graph is unreadable. Fix: use the
`nid` form for ids only, or only when it is at least as long as, say, half the key.

### n5. The terminal names the scenario folder unscrubbed

`:2225-2229`. The JSON's `scenario` field and the page titles are scrubbed, but `Written: <path>`
prints the folder name as it is, and so does the validator's `Dungeon graph:` line. Only an
author who names the folder after the key is affected. Either print the paths relative and
scrubbed, or leave the folder name unscrubbed everywhere (it is not authored text in the same
sense) so the JSON `scenario` field stays the folder name tooling expects.

## On the questions asked

- Text the generator builds from authored values: the derived labels (m1) are the one path
  found. Edge labels (`sticky note at <pc>`, `shared with <npc>`), the sign-in username, resource
  labels, the brief, title and critical path all reach an output through `scrub_label`. There
  are no tooltips; the page's script builds nothing from ids beyond the scrubbed Mermaid source.
  File names are fixed (`dungeon_graph.*`). The terminal carries counts, the scrubbed critical
  path, the scrubbed warning and the folder path (n5).
- False failures when the key is page text: none in the 24-key sweep, because the page text is
  in both the real page and the skeleton. The two false failures found come from the
  generator's own stand-ins (n1).
- Missed leaks: any form not in `WIFI_KEY_FORMS` (m1), and keys shaped like the skeleton's
  counters (n2).
- The test switch: no key is written with it on except through n2, but it can be on unnoticed
  (m2).
- Hidden ids: consistent across the three files and between runs, but opaque to the playtest
  and unstable across edits (m5), and not checked for collisions (n3).
- m4: the foothold rule matches `attempt_login!` except for the remote policy, and the share
  edge does not depend on the foothold (m4).

## Tests

The new tests drive the real generator, read all three outputs and fail on the R2 script. Gaps
that match the findings: no key with underscores or hyphens named in an id (m1), no stop with
an older graph on disk (m3), no headless host with remote sign-in blocked (m4), no check for an
authored `hidden_<n>` id (n3).
