# Realism skin plan, review round 9

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (1445 lines, as committed at 00d10e87e).
Scope: full adversarial review after the R2-3 rewrite (Terminal shows simulated nmap-style and
Metasploit-style output from per-tool generators; Panels stay plain). Request 3 is judged by its
own text (section 14), not by the core plan, which another agent is editing.

Counts: 0 blocker, 7 major, 12 minor, 4 nit.

Code citations spot-checked with grep: `NV:249-253`, `:687-693`, `:813`, `:829-852`, `:962-976`,
the Tab trap at `minigame-manager.js:362-367`, `pauseKeyboardInput` at `core/player.js:102`, the
VT323 rule at `minigames-framework.css:291-292`, `VN:519` (password rule in
`scripts/validate_network.rb`), and the eight scenarios that declare `networks`. All hold except
the two nits below.

## Major

### M1. Request 3 and section 7 never serve an address on an open network

Lines 877, 1409-1410, 1244.

The plan serves `address` "once the host is discovered by a sweep". The core has two kinds of
network (`OPS_CORE_PLAN.md:275`): `discovery: "open"` (the default, every row listed from the
start, no Sweep offered) and `"scan"`. On an open ops network there is never a sweep, so under the
text of request 3 an authored address is never sent. The version scan, `show options` (RHOSTS),
the framework's `[+] <host>:<port>` lines and address targets then silently fall back to the host
id, although the validator accepted the address. The core also lists held-session PCs on an
unswept discovery network (`OPS_CORE_PLAN.md:506-509`); the text says nothing about those rows.
The leak-collector test ("an address only after the sweep") is ill-defined for both cases.

Fix: in request 3, section 7's table and the 11.3 row, serve `address` "with the host row,
whenever the core lists that row: from the first answer on an open network, after the sweep on a
discovery network". Say whether a held-session row on an unswept discovery network carries it
(recommend not, until the sweep, so the address arrives with the sweep like the other rows). Add
an open-network host to `test_ops_skin` or a fixture, with a golden file and a leak-collector
stage for it.

### M2. The plan changes the core's `perform` but neither owns the change nor asks for it

Lines 312, 397, 411-414, 511, 522, 580-620, 1363, 1388-1396.

The core's `perform(offer)` (`OPS_CORE_PLAN.md:574-580`) takes `{ action, target }` and nothing
else. This plan needs three things from it that the core does not define:

- an echo argument: `ctx` is said to hold `perform(offer)` (397), yet the typed line or the
  quick command's line is "handed to `perform` as the echo" (511, 522) and `recordSent(log,
  offer, echo)` is called from inside `perform` (581);
- two calls inside the core's path, `recordSent` after the guard and before sending, and
  `recordResult` on every ending;
- a fixed ending order: `recordResult`, then the clear of the pending key, then `showResult`
  (613-617).

The plan says K1 "neither builds nor replaces" `perform` (181, 1363) and section 14 lists no
request for these hooks. A builder must either edit core-owned code without a plan entry or ask
mid-build.

Fix: either add request 4 to section 14 (the core's `perform(offer, { echo })`, a no-op hook pair
`onSent(offer, echo)` and `onEnded(offer, answer)` called at the stated points, and the stated
ending order), or state in step 4 of section 12 and the shared-file row for the scene that K2
edits `perform` in exactly those ways, with the core's guard tests rerun unedited. Change the
contract at 397 to `perform(offer, echo)`.

### M3. The validator does not enforce the simulation limits it is cited for

Lines 96-102, 232-233, 960-967, 1243.

Rule 4 promises no payload, shellcode, real credential or real host in the output, and 4.2 says
every authored string is a label. Section 9 enforces this with two rules: a scenario password,
and a shell metacharacter, a leading-dash flag or a path. These miss:

- escaped bytes and encoded blobs: `\x31\xc0...`, long hex runs, base64 runs (a backslash is not
  on the metacharacter list), and non-printable or control characters;
- real credentials that are not scenario passwords: `admin:admin`, `root/toor`, `user=... pass=...`
  in a `banner` or `title`;
- real hosts: a public IPv4 literal, a URL or a domain name in a `banner` or `title` (only
  `range` and `address` are checked for private ranges);
- under option 2 of 15(a), the advisory pattern `ms\d\d-\d{3}` misses the underscore form that
  framework module paths use (`ms17_010`), and `cve-\d{4}-\d+` misses `cve_2017_0144`.

The 11.3 validator tests cover "each check of section 9", so the tests cannot catch what the
table does not list.

Fix: add errors to section 9: every `cli` string is printable ASCII (0x20-0x7E) only; no
backslash; no run of 16 or more hex digits or 24 or more base64 characters; no `user:pass`,
`user/pass` or `pass(word)?=` pattern; any dotted IPv4 literal must be in 10/8, 172.16/12 or
192.168/16; no `://` and no token that looks like a domain (`\w+\.(com|net|org|io|...)` or a
general `[a-z0-9-]+\.[a-z]{2,}` rule, with `module` excepted). Widen the option-2 patterns to
`cve[-_]\d{4}[-_]\d+` and `ms\d\d[-_]\d{3}`. Each gets a failing fragment in the 11.3 tests.

### M4. "Text only" is stated but nothing checks it in the source or with hostile authored data

Lines 399-404, 1029, 1031, 1035.

The renderer contract says authored and server text is set with `textContent` in the Terminal.
The import test (1029) bans `fetch`, `ApiClient` and the openers, but nothing bans `innerHTML`,
`outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` or a string passed to
`setTimeout` in `network-view-terminal.js`, `terminal-grammar.js`, `terminal-format.js` or
`cli-gen/`. The hostile-input cases (1031) cover typed lines only. No fixture puts markup in a
`cli` field, a host name, a service product, a `summary`, `falseBecause` or the unplug message
and checks the Terminal's DOM. The existing scene builds HTML strings (`NV:756`, `:798`), so the
moved Panels code is a likely place for a builder to copy the pattern into the Terminal.

Fix: extend `network-skin-imports.test.mjs` with a source check over the Terminal renderer, the
grammar, the format module and every `cli-gen/` file that fails on those names. Add a hostile
fixture whose every text field, served `cli` field and the unplug message is
`<img src=x onerror=alert(1)>` plus a control character, run it through both skins, and assert
the Terminal's mount root gains no element other than the plan's spans, cells and buttons, and
the Panels output stays escaped.

### M5. Typed targets can name two things, so one line does not map to one offer

Lines 216, 341, 752-756, 961, 1116.

`check` is drawn as `nmap -sV --script vuln -p <port> <host id>` and the grammar picks the service
"whose port `-p` names". The core makes service `name` unique on a host, not `port`
(`OPS_CORE_PLAN.md:289`), and the skin's own `protocol` field invites `53/tcp` beside `53/udp`.
Two services on one port give a `commandFor` line that does not parse back to one offer, so
parity test 3 fails or the grammar picks one silently. Addresses are unique per network only and
ranges may overlap between networks; a view that lists two networks (a pivot) can show two hosts
at `10.20.0.15`, or two blocks with one range.

Fix: a validator error for two services of one host with the same port and the same `protocol`
(default `tcp`); the grammar reads `-sU` as `udp` and, when a port still names two services,
answers locally with both and sends nothing; `commandFor` adds `-sU` for a udp service. A
validator error for overlapping `range` values in one scenario (simplest), or for an address used
twice across networks a single foothold can reach. Grammar and parity cases for each.

### M6. Authored console dress can tell a decoy from a weakness, and only the Terminal shows it

Lines 87-90, 220-230, 964, 1034.

Rule 1 says nothing the player needs is only in the dress. The plan checks that a service's
weaknesses and decoys author the same keys, but not what the text says. `title`, `module` and
`script` are Terminal-only (Panels never show them), so a decoy titled "... (patched build)", a
module under `exploit/` beside weaknesses under `auxiliary/scanner/`, or a script named
`*-false` gives the Terminal player the answer before a confirm. The plan's own example (253-257)
already differs in module category between the weakness and the decoy. The framework golden test
(1034) only says "other than their own authored text", which is exactly where the tell would be.

Fix: apply the core's telltale-word rule (`OPS_CORE_PLAN.md:1336`: decoy, fake, false, real,
true, bait) to every `cli` string of a weakness or a decoy, plus `patched`, `not vulnerable`,
`safe`, `fixed`, as an error. Add a warning when a decoy's `cli` text shares a content word with
its own `falseBecause`. Add a warning when the first path segment of `module` differs between a
service's weaknesses and decoys of the same `class`. Change the example so the decoy and the
weakness do not differ in module category, or say why they may.

### M7. Question 15(a) is not stated fairly

Lines 167-169, 1425-1436.

Not a finding about the answer, which is the user's. The statement leaves out three things the
user needs:

- `OPS_LAYER_BRIEF.md` section 2, rule 4, a binding user decision: "Products, versions and
  organisations are invented. Weaknesses are classes, not real identifiers." Option 1 reverses
  it for the Terminal; the question should say so in those words. (The handover for this
  revision also recommended option 2 for that reason; the plan now recommends option 1 without
  the reason for the change.)
- `module` paths: under option 1 an author may copy a real framework module path verbatim, which
  is the most tool-real string in the output. The question names advisory ids and product names
  only.
- the result of option 1: the `VERSION` column still prints the core's invented `product`, while
  the `banner` and `title` under it may name a real product, so the same row can disagree with
  itself unless the core also changes its rule.

Fix: restate (a) with the brief's rule quoted, list `module` with the other fields, and add the
`VERSION`/banner mismatch as a cost of option 1 (or an option 1b: real names also allowed in the
core's `product`, a core change).

## Minor

### m1. Leftover claim that the skin reuses the real-product and procedure rules

Lines 165-169. The text says the skin's display fields "reuse both rules" (the core's
`real_product_names.txt` and its procedure warning). Section 9 applies the product list only
under option 2 of 15(a) and replaces the procedure warning with its own command-form error.
Fix: say the command-form error replaces the procedure warning for `cli` strings and that the
product list applies only if 15(a) is answered with option 2.

### m2. Shell-mode grammar leaves common shapes undefined

Lines 690-693, 744-765. Not defined: more than one target (`nmap -sV files01 web01`, which real
nmap accepts), pipes and redirects (`| grep open`, `> out.txt`), and `;` in shell mode (the `;`
rule sits under the framework section). A builder may take the last token as the target and send
it. Fix: one rule for every mode: `;` splits commands; more than one request on a line answers
`One action at a time.`; more than one target answers `One target at a time in this simulation.`
and sends nothing; a token `|`, `>`, `>>` or `<` answers `Pipes and redirects are not part of
this simulation.` and sends nothing. Grammar test cases for each.

### m3. The nmap form teaches the wrong flag meanings

Lines 752-755. `nmap -sn files01` (a ping of one host) gives a full version-scan table, and
`nmap -sV 10.20.0.0/24` gives a sweep with no versions. A learner moving to a VM lab carries the
wrong reading. Fix: `-sn` on a host target sends nothing and prints a local note pointing at
`-sV`; a range with `-sV`, `-sS` or `-A` sweeps and prints one note line that versions are listed
per host with `nmap -sV <host>`. Add both to the grammar test.

### m4. Framework commands with no module, and other `show` forms, are undefined

Lines 678-693. `check`, `run`, `info` and `show options` with no module selected have no answer;
`show payloads`, `show targets`, `show advanced` fall into "`show` as `show` with no argument",
which prints the game listing under a payload-shaped command. Fix: with no module, these answer
`Select a module first: use <module>`; `show <anything but options>` answers
`Not part of this simulation.`. Cases in the framework golden or grammar test.

### m5. The "(simulated)" mark is inconsistent, and 15(b) does not show its full cost

Lines 487, 658, 1437-1443. The sketch ends the version scan with `Service detection performed
(simulated).`; the scanner spec (658) prints it without the mark; 15(b) option 1 says the mark is
on the first line of each run. 15(b) also does not say that "in this simulation" local answers
(684, 761-764) stay under every option, or that a cropped screenshot of a table carries no mark
under option 1. Fix: make the sketch match 658, and add both points to 15(b).

### m6. Test 9's failure step omits `scan`

Line 1145. The null-answer steps list `sweep`, `check`, `confirm`, `use` and `unplug`; `scan` is
missing, though section 5.3 and the format test treat all five actions alike. Fix: add `scan`.

### m7. The provenance test allows the player's line in generator output

Lines 633, 1035. Generators never receive the typed text (633), but the provenance test accepts
"the player's line" as a source for a generator span, so a generator that echoed typed input
would pass. Fix: drop the player's line from the generator provenance sources; keep it only for
the renderer's echo lines.

### m8. A test cannot compare against "the list in the plan"

Lines 1186-1187. "The test also fails if the Terminal prints one of its entries that the list in
the plan does not name" asks a test to read this document; it is the leftover of the removed
snapshot-against-plan sentence. Fix: say the test fails on a Terminal piece that matches no
entry of the exported `TERMINAL_ONLY_TEXT`, and that a change to that export needs its reason in
the commit (already stated at 1193).

### m9. Who writes the `cli` schema entries is stated twice, differently

Lines 294, 1358, 1367 against 1405-1406. Section 5.1, step 6 and the shared-file table give the
schema entries to S6's K3; request 3 says "the core's schema gains the `cli` objects". Fix: one
owner. Since the core builds the copying before K3, recommend the core adds the schema entries
with request 3 and K3 adds only the validator rules.

### m10. Loading and load-error states have no owner per skin

Lines 408-409; `NV:302`, `:417`. The scene writes "Connecting..." and "The link did not answer.
Close this and try again." into the container before any renderer exists. The contract says the
scene draws the header switch and nothing else. Fix: say whether these stay scene-drawn pre-mount
states (then name them as the exception) or move into both renderers (then the Terminal prints
them as log lines, and test 9 covers a failed load).

### m11. `window.__test.network` has no node test

Lines 1288-1299, table 11.1. Every other new code item has a node test; the bridge namespace is
used only in live runs. Fix: a node test that `network.state()` is equal in both skins apart from
`skin`, that `run` rejects a path of the other skin, an unlisted offer and a pending offer, and
that `storePick` calls `writePick`.

### m12. "Teaches no attack step beyond the lab sheet" has no check

Lines 101-102. No validator or test can see this. Fix: name where it is checked (the scenario
design review or the lab-sheet step for each scenario that authors `cli` fields), so it does not
read as enforced.

## Nit

- n1. Line 571: `out.message` is at `NV:850`, not `NV:848`.
- n2. Line 965: `VN` is defined in the core plan, not here; spell out `scripts/validate_network.rb:519`.
- n3. Lines 574-578: Panels show the "Scanning" bar for a sweep or scan but nothing for a pending
  check, while the Terminal prints `started` lines for a check too. Say the check is left without
  a bar on purpose (the control is disabled), so a builder does not add one.
- n4. Section 5.3: `check` means a service check in shell mode and a confirm in framework mode.
  `help` in each mode should say which, so a learner reading the log is not misled.

## Checked and found sound

- Nothing runs against a real host; no route, parameter or branch names the skin (5.1, 6, 11.3).
- `show options` has exactly RHOSTS, RPORT and TECHNIQUE; every other `set`, payload options
  included, answers locally (684, 1034).
- `cli` data is absent from the bootstrap and room answers, staged per object, and the same keys
  ride on decoys and weaknesses (7, 11.3), subject to M1.
- Generators are pure, read only the offer, the answer and the view, and are fenced by the import
  test (321-327, 1029).
- `recordSent`/`recordResult`, `REQUEST_FAILED_TEXT`, the separate unplug failure sentence in both
  looks, the three switch orders and the pixel-art progress bar all match the earlier rulings
  (580-629, 810, 1030, 1087-1092), subject to M2 on who owns the hooks.
- Golden tests run with defaults and fully authored for both generators (1033-1034); the eight
  scenarios that declare `networks` are confirmed and covered by section 10.
- No leftover of `SCAN_OUTPUT_TEXT`, the invented tool names or the deny-list test remains.
- 15(b) is stated fairly apart from m5.
