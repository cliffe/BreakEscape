# Realism skin plan, review round 10 (delta)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` at c22d8434e (1588 lines). Delta reviewed:
`git diff ef99e1cdc HEAD` on that file, against the R9 findings and the "R9 fixes" and
"Aligned with core" entries of `OPS_REALISM_SKIN_DECISIONS.md`. The core plan is judged as
committed at HEAD (`git show HEAD:docs/achitechture/OPS_CORE_PLAN.md`), cited as `core:<line>`.
`NV` is `public/break_escape/js/minigames/network-view/network-view-minigame.js`.

Counts: 0 blocker, 2 major, 11 minor, 3 nit.

Code citations spot-checked: `NV:302` ("Connecting..."), `NV:417` (load error), `NV:813` (unplug
hint), `NV:850` (unplug sentence), `NV:854-858` (`setUnplugNotice` uses `textContent`), the Tab
trap at `minigame-manager.js:367`. All hold.

## R9 majors: status

| R9 | Status | Note |
|---|---|---|
| M1 address serving | Closed | 7 table (953), request 3 (1513-1518), collector row (1343). Core agrees in its table (core:1194) and held-session text (core:496-497). See m10 for two core-side gaps |
| M2 perform hooks | Closed in this plan | Request 4 (1531-1546) matches the core's described `perform`: key added and redraw done synchronously before the first `await`, request after (core:572-575). The core's committed text has not yet taken the request (no `echo`, `onSent` or `onEnded` in core); step 4 (1458) correctly waits for it. See m1 for the echo at K1 |
| M3 validator rules | Partly open | Major 1 (slash rules), m6, m7, m8, m11 |
| M4 source ban, hostile tests | Closed | 420-427, 1126, 1127. Nit n1 |
| M5 unique targets, round trip | Closed for ports, addresses, ranges | The round trip still fails on prefixes and id collisions: m2, m3, m4 |
| M6 decoy labels | Partly open | Major 2 (rules are per service only); m7 |
| M7 15(a) fairness | Closed apart from 1b | m9 |

## Major

### MA1. The slash rules misfire on legitimate text, and the "path" error has no matcher

Plan lines 1056, 1059, 1068, 1342.

- Line 1056 refuses "a path other than the `module` field" but never says what a path is. A
  builder who reads it as any `/` outside `module` refuses `SMB/CIFS`, `TCP/IP` and the usual
  nmap banner shape `ShareServe/3.1`. Yet line 1068 tells authors that `TCP/IP` is "the plain
  form that passes". 11.3 lists no passing fragment that holds a `/`, so the tests cannot pin the
  intended reading either.
- Line 1059's narrowed `/`-pair rule reads every `cli` string, `module` included. Its account
  words (`admin`, `user`, `service`, `test`, `guest`, `operator`) are also ordinary module path
  segments. `auxiliary/admin/smb/...`, a common real framework category, holds the pair
  `admin/smb` and fails as a credential. So would `auxiliary/scanner/guest/...`. In titles and
  banners, `Guest/anonymous access enabled` (a plain title for the example's own `default_creds`
  weakness) and `Service/1.0` fail too.

Failure: an author writes the module path shape the plan teaches and gets a credential error.
Or K3's builder picks the broad reading of "path" and every product/version banner fails.

Fix: define a path as a token that starts with `/`, `~/`, `./` or `../`, or holds a drive
letter and colon, plus a `/` token of three or more segments in a `banner` or `title`. Apply the
`/`-pair rule only to `banner` and `title`; `module` keeps its own pattern and the equal-sides
check. Add passing fragments `SMB/CIFS`, `TCP/IP`, `ShareServe/3.1`,
`auxiliary/admin/brackley/x` and `Guest/anonymous access enabled`. Add failing fragments
`/etc/shadow`, `../../x` and `C:/Windows`. If `Guest/anonymous` should fail, say so and give
the passing form in the error message.

### MA2. The decoy-form rules hold per service only; a decoy-only service is still a tell

Plan lines 233-240, 1052, 1053; core:34-36 (`weaknesses[]?`, `decoys[]?` are both optional).

The core allows a service with decoys and no weakness. The uneven-authoring rule and the
module-category rule compare findings within one service, so they never see such a service.
Here is a scenario that passes every check. All weaknesses author `cli.module` under
`exploit/...`. One decoy-only service on another host authors nothing, so it prints the default
`simulated/unpatched/f4`, or it authors `auxiliary/scanner/...`. A Terminal player learns
"`simulated/` (or `auxiliary/`) means decoy" before any confirm. Panels show nothing like it.
This breaks the plan's own rule at 233 ("indistinguishable in form") in the way R9 M6 described.

Fix: make both rules scenario-wide. For each of `title`, `module` and `script`, either every
weakness and decoy in the scenario authors it or none does. The set of (first segment, depth)
pairs used by decoy modules must be a subset of the pairs used by weakness modules. Keep the
per-service rule as well. Add a failing fragment with a decoy-only service on default labels
beside authored weaknesses.

## Minor

### m1. Panels cannot pass `commandFor` at K1

Lines 413, 639-641, 187, 1456, 1458. The contract says Panels pass `commandFor(offer)` as the
echo. `commandFor` lives in `terminal-grammar.js`, which step 4 (K2) builds, while the Panels
renderer is built at K1. Fix: renderers that do not type pass no echo, and the scene's `onSent`
hook uses `echo ?? commandFor(offer)` from K2. Panels then never import the grammar.

### m2. Prefix matching breaks "one line, one request" and teaches the wrong address

Lines 803-807, 850-851, 731. "Any prefix that is unique among what is on offer" has no
exact-match rule. With hosts `web` and `web01`, `nmap -sV web` (which `commandFor` writes) is
ambiguous, so the round trip test at 1130 fails. With `f1` and `f10`, `f1` is ambiguous. The
same holds for a technique id `phish` beside `phish_sms`. Addresses and ranges are also matched
by prefix, so `nmap -sV 10.20.0.1` scans `10.20.0.15` when no other address starts that way,
which no real scanner would do. Fix: an exact match beats a prefix, and addresses and ranges
match exactly only. Add grammar cases for `web`/`web01`, `f1`/`f10` and a near-miss address.

### m3. "One target at a time" does not say what a target is

Lines 794, 799-800, 46, 1130. The game verb `use <card> on f2` takes two operands, and the
game verb `check` needs a host and a service. Its typed form is never given; only the nmap form
is in `CONTROLS`. Read literally, the new line rule refuses both. Separately, nothing stops a
network id from equalling a host id: the core's one id space (core:33, :1326) covers hosts,
objects and resources, not networks. `nmap -sn x` then matches a sweep and a host, so the
`commandFor` line of a sweep cannot parse back. Fix: define the operand shape per verb (`use`:
technique and finding; `check`: host and service, or the nmap form only), and count a target as
one operand set. Add a validator error for a network id equal to a host, object or resource id.

### m4. `-sU` is written by `commandFor` but is not a known flag

Lines 223, 822-825, 833-835. The known-flag list leaves out `-sU`, so the line `commandFor`
writes for a udp check prints `Ignored in this simulation: -sU` when typed or pasted. That
contradicts "accepted and changes nothing". `-sU` on a tcp port also resolves to the tcp
service, which is the wrong reading. Fix: add `-sU` to the known flags. When `-sU` names a tcp
port, or no `-sU` names a udp port, print one note line that gives the service's real protocol.

### m5. The open-network `sweep` answer: sound, but incomplete

Lines 815-819. Answering locally is right: Panels draw no Sweep there, it sends nothing, and it
prints only rows already listed. It leaves three gaps:

- A swept discovery block and a non-ops block also offer no sweep, and for them `nmap -sn`
  falls to the "status text of the row" rule, which a block does not have. Give them the same
  local answer.
- "The same answer whether or not a host on it is up" reads as if down hosts print `Host is
  up.` Say the per-host lines follow the sweep result's down-state rule and only the note is
  unconditional, and say whether a `Nmap done` line closes it.
- `Every host here is already listed.` and the grammar's notes on lines that do resolve
  (`Ignored in this simulation:`, the `-p` and `-sV` notes, `-sn only finds hosts...`,
  `Name a port with -p:`) match no `TERMINAL_ONLY_TEXT` entry. "Parse messages" covers only
  lines that do not resolve (788). Widen that entry to the grammar's fixed answers and notes.

### m6. The option 1 version rule fails the plan's own passing fragment and common titles

Lines 1061, 1342. Under option 1 an error fires on any `\d+(\.\d+)+` that differs from the
service's `version`. `10.20.0.15` in a banner, listed in 11.3 as a passing fragment, matches.
So do `Weak TLS 1.0 enabled`, `HTTP/1.1` and `SSH-2.0`. Fix: skip dotted quads inside the
scenario's ranges, check a version only where it follows the service's product name or a word
from the real-product list, and add `TLS 1.0` as a passing fragment.

### m7. The added telltale words hit ordinary security vocabulary

Line 1054. `fixed` names real weakness classes (fixed session id, fixed IV, fixed key). `real`
fails `Real-time`, `true` fails `True` in a product name, and `safe` fails `safe mode`. The core
uses its list as a warning on ids (core:1354); here it is an error on free text with four more
words. Fix: keep `decoy`, `fake`, `bait`, `false`, `patched` and `not vulnerable` as errors, and
make `real`, `true`, `fixed` and `safe` warnings, or keep them as errors and add passing
fragments that show the reworded form. Either way, say which.

### m8. Under option 2, named vulnerabilities and other advisory schemes slip through

Line 1061. Only CVE and MS bulletin forms are caught. `KB4013389`, `RHSA-2020:1234`,
`GHSA-...`, `ZDI-...`, `USN-...` and named vulnerabilities (`eternalblue`, `heartbleed`,
`shellshock`, `log4shell`) are real public identifiers that pass. Fix: widen the pattern
(`kb\d{6,7}`, `(rhsa|dsa|usn|ghsa|zdi)[-_]`, `can[-_]\d{4}`), and under option 2 read a short
nickname list beside `real_product_names.txt`.

### m9. Option 1b is not needed here, and its statement leaves out Panels

Lines 1559-1566. The core's `product` is drawn in the Panels' service tile as well as in the
`VERSION` column. So 1b reverses rule 4 for both skins and the whole ops layer, not "for the
Terminal" as option 1 is framed. Option 1 is self-consistent without it, because the version and
product checks stop the disagreement. Fix: drop 1b and say a change to `product` is a question
for the core plan. If it stays, state that Panels would show real products too.

### m10. Two core-side gaps behind request 3

core:493 (5.2) says an address is served "only once the network is swept (the row exists only
then)", with no open-network case. `network_cli_fields_test` (core:1503) tests only the
before-sweep and after-sweep cases. The core's table (core:1194) does say an open network's
address arrives with the first answer. core:1294 also describes the skin's address rule as
"unique on its network", while this plan enforces "used twice anywhere in the scenario" (1047),
and the round trip depends on that. Fix: request 3 asks the core to add an open-network address
case to `network_cli_fields_test`, add the open-network exception to 5.2's text, and correct the
uniqueness wording.

### m11. The `:` and key-word credential rules catch common banner text

Line 1059. `10.20.0.15:445` (ip:port, the form the framework lines print) fails "two runs
joined by `:`". `SSH host key:` and `API key:` fail the key-word rule. Fix: exempt
`<private IPv4>:<port>`. Require the key-word rule's `=` or `:` to be followed directly by a
non-space token, and add both as passing fragments.

## Nit

- n1. Lines 425-427: also replace the bidi controls (U+202A-U+202E, U+2066-U+2069). Authored
  `cli` strings are ASCII-only, but core text fields (names, summaries) are not, and a
  right-to-left override can reorder a log line on screen.
- n2. Line 797: `use f2; set TECHNIQUE phish; run` is a framework-mode line. In shell mode
  `use f2` is the game verb with no card. Mark the example's mode.
- n3. Lines 966, 1343: name the collector tag for an open network's address (`listed`, the tag
  the core uses for `range`, core:1679). The core's own collector skips open-network addresses,
  so `test_ops_skin`'s entry is the only check.

## Checked and found sound

- Delta sync: nothing is added to `player_state`, the sync sections or any answer (8, 1004;
  core:502-503). The log, history, mode state and pick are page memory or `localStorage`.
- Markup: Terminal text goes through `textContent` with control characters replaced. A source
  ban covers the Terminal, grammar, format and `cli-gen/` files, and the hostile fixture runs
  every text and `cli` field in both skins. The scene-drawn states (302, 417) are constants. The
  unplug sentence uses `textContent` in today's scene (`NV:858`).
- Hook points (request 4) match the core's described `perform`, the throwing-hook rule keeps
  the tail, and a rejected press calls neither hook.
- The narrowed base64 rule (only `banner` and `title`, a run of 24+ that holds a digit, `+` or
  `=`) is sound. Module paths cannot trip it, and a 24-character letter-only blob is rare in real
  base64. Splitting a blob with spaces gets round it and the hex rule, but the strings are
  display text that never runs, so the rules guard against accidents only. That is acceptable.
- No working exploit procedure. `show options` has only RHOSTS, RPORT and TECHNIQUE, every
  payload option answers locally, and nothing runs. Under option 1, a real module path followed
  by `set TECHNIQUE` and `run` reads like the real tool's sequence without its target and
  payload options. That is standard introductory material, and rule 4's lab-sheet check (102-104)
  is where it is judged.
- Core consistency: `cli` schema ownership at K3 (189, 307-310, 1019-1022, 1469; core:227,
  :1284-1288), the range all-or-none rule (1050; core:491, :1296), `cli.hosts` keys as plain
  strings of 1 to 64 characters (1028; core:1288-1291) and the serving stages (953-955;
  core:1192-1199) agree, apart from m10.
- R9 minors m1-m12 and nits n1-n4 are applied as the decisions log says.

## Verdict

Not settled: two majors (MA1, MA2), both in the K3 validator. The Terminal, the hooks request
and the serving rules are ready. MA1 and MA2 are rule definitions plus fixtures, and need no
redesign.
