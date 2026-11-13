# Dungeon graph for slice 9.3b: code review, round 3

Branch `build/graph-net` against `main` (head 2685322bc). R2 fixes in d4c7abb9d, build log
2685322bc. Round 2: `DUNGEON_GRAPH_9_3B_CODE_REVIEW_R2.md`.

Counts: 0 blocker, 1 major, 4 minor, 3 nit.

## How this was checked

- Read `git diff main...HEAD` for `scripts/generate_dungeon_graph.rb` and the test file, and,
  in `app/models/break_escape/network_access.rb`, `mapped_shares` (987-1010),
  `networks_reachable_from` (857-871), `resource_admits_player?` (945-985) and
  `network_rows`; `Game#login_desktop_contents` and `attempt_login!` for headless hosts.
- `node --test test/js/dungeon-graph-networks.test.mjs`: 35 of 35 pass. Every test writes a
  fixture to a temporary directory and runs the real generator with `ruby`, then reads all three
  output files.
- Regenerated `scenarios/test_access_networks` from a scratch copy with the branch script: the
  `.md`, `.html` and `.json` are byte for byte the committed files. The key occurs in none of
  them, and the token `WIFI_KEY_HIDDEN` occurs in none either (nothing in this scenario needed
  scrubbing).
- Ran about 25 hand-made fixtures against the generator (results quoted under each finding).
  For each output the inline page script was checked with `node --check`.

## Round 2 findings

| R2 | Status | Evidence |
|----|--------|----------|
| M1 share across a link | Fixed | `link_component` (`:600-607`) feeds `signin_hosts` (`:627`) for a mapped file share. Fixtures: two-network link, and a three-network chain office, server, archive with the vault on archive: both give `signin_lena -> resource_vault`. Listed-only shares and open shares keep their old rule, as `mapped_shares` does. See m4 for a headless gap. |
| M2 key in other names | Fixed for the cases named, but see M1 below and m1, m2 | NPC name, container name, objective and task title: key absent, token present in each. |
| m1 key in a share | Fixed | `resource_scanned_inbox -> clue_inbox_note -> wifikey_*`. See m3 for a locked folder on the share. |
| m2 nested NPC item | Fixed | `npc_holder` indexes at any depth (`:674-690`); a note in a held folder hangs from the NPC. |
| m3 missing tests | Fixed | Reverse pivot and share-across-link tests both present and both fail if the fix is reverted (the vault test has a no-link negative control). |
| n1 jack with no device | Fixed | `device_nodes.any?` guard (`:650`); test present. |
| n2 access point in a locked container | Fixed | `object_from` (`:692-703`); test present. See n3. |
| n3, n4 | Left, as agreed | |

## Major

### M1. The key scrub rewrites the whole page source, not just its content

`scripts/generate_dungeon_graph.rb:528-533`, applied at `:1982`, `:2078` and `:2083`.
`scrub_wifi_keys` runs a plain substring `gsub` over the full HTML (CSS, inline script,
template text), the Markdown and the JSON, for the key and its `nid` form, with no word
boundary and no case check beyond `nid`'s lowercasing. Any key that is also a substring of the
template or of a node id corrupts the output. Fixtures (one Wi-Fi network, the key only in its
own psk field and a note's text):

- key `function`: every `function` in the inline script becomes `WIFI_KEY_HIDDEN`;
  `node --check` on the script gives `SyntaxError: Unexpected identifier 'initPanZoom'`. The
  page renders no diagram at all.
- key `fullscreen`: `document.fullscreenElement` becomes `document.WIFI_KEY_HIDDENElement`
  and the `fullscreenchange` listener is renamed, so the fullscreen button misbehaves; the
  `:fullscreen` CSS selectors are broken.
- key `container`: CSS class names, element ids and the legend class are rewritten (happens to
  stay consistent, so the page still works).
- key `office` (a room `office`, a network `office_lan`): in the JSON the room's node id becomes
  `WIFI_KEY_HIDDEN`, the network's `net_WIFI_KEY_HIDDEN_lan` with label `WIFI_KEY_HIDDEN_lan`,
  and `"scenario"` becomes `common_WIFI_KEY_HIDDEN`. The playtest skill reads
  `dungeon_graph.json` to map lock and room ids to the scenario; those ids no longer exist in
  the scenario. Labels such as "Back office" are left alone only because the raw form is
  case-sensitive; "back office" would be rewritten.
- key `password`, `welcome1`: harmless here, but only because the template happens not to
  contain them in lower case.

No rule limits a psk's length or content (the validator and `NetworkModel` have none), and a
weak, dictionary-word key is exactly what a teaching scenario about Wi-Fi might use.

On the questions asked: whole-word matching would not help (`function` and `const` are whole
words in the script) and would miss a key embedded in a longer authored name. A minimum length
does not help either: it only decides which short keys leak (see m1). The scrub should act on
content, not on the file:

1. Scrub the strings that carry authored text before they are templated: node and edge labels
   (in `add_node` / `add_edge`, or once over `$nodes`, `$edges` and the story and contents
   graphs before `emit_mermaid_diagram`), the brief, the critical-path labels and the title.
   `safe_text` already does this for 9.3b's own labels.
2. For ids, pass any id that contains a key's `nid` form through a stable opaque replacement
   (for example `hidden_<n>`) in `nid` itself, so ids that do not contain the key never change.
3. Keep a final check on each output, but as a guard that fails the run (or warns loudly) if a
   key form is still present, not as a silent rewrite of the page.

Add tests with keys `function` and `office`: the script passes `node --check`, and the JSON ids
of rooms and networks not named after the key are unchanged.

## Minor

### m1. Forms the scrub still misses: a key with `"`, and keys under four characters

`:530` and `:1580`. `emit_mermaid_diagram` turns `"` into `'` in every label, a form not in
`WIFI_KEY_FORMS`. Fixture: key `sea"breeze1`, NPC display name `Lena sea"breeze1`: the
Markdown and the HTML each contain `sea'breeze1` once. The `reject { |f| f.length < 4 }`
drops every form of a short key, so key `abc` in an NPC name prints 4 times in each of the
Markdown and the HTML. With the M1 fix (scrubbing labels before emit) the quote case goes away;
for short keys, scrub labels whatever the length (a label scrub cannot break the template) and
propose a validator warning for a psk under 8 characters, the WPA2 minimum.

Checked and not leaking: HTML-escaped (`&`, `<`, `>`), JSON-escaped (`\`), JS template
(backtick, `${`) and `nid` forms. No output URL-encodes or base64-encodes any text (`base64` is
required but unused), so no encoded form exists to leak. Labels are joined with `<br/>` only
between separate fields, never inside an authored string, so no file splits a key across label
lines; Mermaid's own text wrapping happens in the browser, not in the files.

### m2. The truncated brief can print part of a passphrase

`:1766`. The HTML subtitle cuts the brief at 160 characters and drops the last partial word.
For a key with spaces, the cut can fall inside the key, and the words before it survive the
scrub because they are no longer the whole key. Fixture: psk `sea breeze two zero two five`,
brief of 140 characters then ` key: <psk> and then more`: the subtitle ends `key: sea
breeze…`. The Markdown, which prints the full brief, is scrubbed correctly. Fix: scrub
`brief_full` before truncating (falls out of the M1 fix).

### m3. A key note inside a locked folder on a share, or on a PC desktop, skips the folder's lock

`:745-750`. The share branch and the PC branch hang the clue straight from `resource_<id>` or
`lock_<pc>`, ignoring `t[:locks]`. Fixture: open share on `office_lan` holding a PIN-locked
folder `locked_folder` with the key note inside: edges are `net_office_lan -> resource_inbox
-> clue_inbox_note -> wifikey_guest_wifi`, and no node for the folder's lock exists. The
server refuses the item until every folder above it is unlocked
(`resource_item_for_add`, `:1085`). The PC branch has the same shape (read, not run). Fix:
when `t[:locks]` names a locked container inside the share or desktop, hang the clue from that
container's lock node (created with `access_lock_node`, or the existing lock walk's node), fed
from the share or PC.

### m4. A headless host that admits the account draws a share route the server does not have

`:627`. `signin_hosts` includes headless hosts. Fixture: chain office, server, archive; vault on
archive admitting `finance`; the only host is `hot_desk` on office, made headless; no jack or
device. The graph draws `signin_lena -> resource_vault`. The server maps shares only on a
desktop (`login_desktop_contents`), a headless host has no screen and refuses a walk-up sign-in
(`attempt_login!`, `game.rb:1573`), and without a foothold there is no remote session either,
so the vault cannot be opened. The same over-reach exists for 9.3a's own-network rule, so this
is an approximation extended across links rather than new logic. Fix: for the mapped case,
drop headless hosts from `signin_hosts` (a headless session reaches the share only through a
foothold and the network view, which the graph already draws through the network node).

## Nit

### n1. A key in a different letter case is printed

Key `SeaBreeze2025`, NPC name `Lena SEABREEZE2025`: the label prints the upper-case form in the
Markdown and the HTML. WPA keys are case-sensitive, so this is not the key, but it gives it away.
A case-insensitive match in the label scrub would cover it.

### n2. The critical path printed to the terminal is not scrubbed

`:2096`. `puts "Critical path ...: #{path_labels}"` prints room and lock labels unscrubbed. Only
stdout, not a file, but the validator runs the generator and its output lands in logs and agent
transcripts. Use the scrubbed labels (falls out of the M1 fix).

### n3. `object_from` looks one container up

`:692-703`. An access point (or implant prop) in an unlocked box inside a locked safe hangs from
the room, as only `entry[:container]` is checked. `object_reachable?` on the server checks every
container above. Unlikely in a real scenario.

## Tests

The file drives the real generator and reads all three outputs, and each 9.3b test has a
positive control. The gaps match the findings: no key that collides with the template or an id
(M1), no short or quoted key (m1), no locked folder on a share (m3), no headless admitter (m4).
A three-network chain for the share is worth one assertion too: it passes today.
