# Handover: realism skin plan, R2-3 revision (terminal shows simulated nmap and msf output)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`. Ruling: R2-3 at the end of
`docs/agents/ops_layer/USER_PICKS_2026-11-19.md`. Do not commit. Edit tool only, section by
section. Plan stays standalone (no mention of reviews, rounds or picks). Do not open SecGen XML
or exploit-detail field guides. Do not edit `OPS_CORE_PLAN.md`.

## Done (edited in the plan)

- Header "Words used here": defines a **generator**.
- 1.1: Terminal bullet and scan-output paragraph rewritten for nmap-style and msf-style output.
- 1.2: teaching paragraph (tool vocabulary, shorter step to a VM lab).
- 1.3: now four rules; rule 1 says game information is shown in both, the Terminal adds console
  dress only; new rule 4 "It stays a simulation".
- 2: two bullets added (core fields enough for defaults; no address/protocol/banner exists today;
  networks schema has only name, offWhen, wifi and is server-only).
- 3: K2 row gains grammar shapes, registry and two generators (defaults only); K3 renamed
  "Scenario fields": defaultSkin, `cli` display fields, `scripts/validate_realism_skin.rb`.
- 4: split into 4.1 (defaultSkin, settled: no forcing, lives in the scenario) and 4.2 (`cli`
  fields table, placement reasons, label rules, JSON example, default output description).
- 5.1: server changes listed; `cli` rides in core's answers (request 3); absent `cli` left out.
- 5.2: file table gains `cli-gen/registry.js`, `cli-gen/scanner-output.js`,
  `cli-gen/framework-console.js`; generator export shape (`id`, `started`, `result`,
  `TEMPLATES`, lines of `{text, cls}` spans, cls closed set prompt/head/ok/bad/note);
  grammar signature gains `mode`; control table's Terminal column now tool lines
  (`nmap -sn`, `nmap -sV`, `nmap -sV --script vuln -p <port> <host>`,
  `msf > use <module>; check`, `msf > use <module>; set TECHNIQUE <id>; run`); game verbs kept.

## Status 2026-11-19 (second agent)

All open steps below are done in the plan (now 1445 lines), and the decision lines are appended.
Change from this list: question 15(a) recommends option 1 (allow real advisory ids and product
names as authored labels), per the orchestrator; the advisory/real-product validator rule
applies only under option 2. Leftover grep is clean. Not reviewed yet; not committed.

## Open (as originally listed; now done)

1. **5.3** Terminal skin:
   - Layout sketch: show `$ nmap -sV files01` and an msf prompt.
   - Layouts table: sweep/scan/check rows now "scanner generator"; confirm/use rows "framework
     generator"; keep every Panels sentence as its own span (alias, status, needs yes/no,
     falseBecause, Fixed, admin tag, refusal words) so piece comparison still works.
   - Replace "Scan output" + `SCAN_OUTPUT_TEXT` (Echoreel/Lookmark lists and the "no real tool
     name / no digit / no protocol word" sentences) with: `recordSent` writes the echo then the
     generator's `started` lines (only ids/labels the view already shows); `recordResult` writes
     `result` lines. Keep the event-driven, ending-order, switch and failure rules unchanged.
   - Scanner output (defaults in 4.2): sweep "Starting Nmap (simulated) ..."; per host
     "Nmap scan report for <host id> (<address>)", "Host is up."; "Nmap done: <N> IP addresses
     (<n> hosts up) scanned" (N from range prefix; without range "Nmap done: <n> hosts up").
     Version scan: `PORT STATE SERVICE VERSION` rows, `<port>/<protocol> open <service word>
     <product> <version>`, `|_banner:` line, "Service detection performed (simulated)."
     Script scan: per finding `| <script>:` then `|   <title>`, alias, status words, label,
     summary. No timestamps, no latency, no invented hosts/ports, no random text.
   - Framework: `msfconsole` enters framework mode (prompt `msf >`, `msf (<module>) >` when
     a module is selected); `exit`/`quit` leave; `back` clears module. Verbs: `search [word]`,
     `use <module|alias|search number>`, `info`, `show options` (RHOSTS, RPORT, TECHNIQUE only,
     plus held techniques), `set TECHNIQUE <id>`, `unset TECHNIQUE`, `check` -> confirm offer,
     `run`/`exploit` -> use offer (TECHNIQUE unset = local message, nothing sent), `sessions`
     (listing of held sessions from rows). `;` joins commands on one line; a line holding two
     request commands answers "One action at a time." and sends nothing. Results: confirmed
     "[+] <addr or host>:<port> - The target appears to be vulnerable." plus Panels lines; false
     "[-] ... - The target is not vulnerable." plus falseBecause; session "[*] Session opened on
     <host> as <account> (<access>)"; credential "[+] Credential added to the keyring." (or the
     Panels' useResultText line); refusal "[-] " + REFUSAL_TEXT words.
   - Grammar: nmap parsing. Target a network (id or range) -> sweep; a host (id or address)
     without `--script` -> scan; with `--script <anything>` -> check, port from `-p`; no `-p`
     and one checkable service -> that one, else local "Name a port with -p: ..." listing ports.
     Value-taking flags: `-p`, `--script`, `-oN`, `-oX`, `-oG`, `-oA`, `--top-ports`,
     `--min-rate`, `--max-retries`, `-e`. Known flags (`-sS -sT -sV -sC -A -O -Pn -n -v -vv
     -T0..-T5 -sn` and the value flags) are accepted silently; unknown flags get one note line
     "Ignored in this simulation: <flag>" through textContent. `-iL` answers "Reading targets
     from a file is not part of this simulation." `-p` on a version scan is noted and ignored
     (the table always shows every service, so Panels and Terminal show the same).
     Existing rules hold: only a line resolving to a current offer reaches `perform`; typos and
     unlisted targets send nothing; pending offers print the pending line.
   - Mode and selected module/TECHNIQUE are renderer-local state (allowed by the renderer
     contract), dropped on unmount; a quick-command or Panels-press echo for confirm/use writes
     the one-line `use <module>; ...` form.
   - `TERMINAL_ONLY_TEXT`: replace the SCAN_OUTPUT_TEXT entry with "each generator's
     `TEMPLATES`" and the authored `cli` strings and generic defaults; add the framework prompt
     marks, "One action at a time.", the flag notes, the port prompt.
   - Delete "The column headers are plain words... no table layout reproduces a real tool's
     output" sentence and the "What it may print" sentence; restate: constants, TEMPLATES,
     answer fields, `cli` fields, counts computed from the answer, and the player's line only.
2. **5.4**: VT323 16px stays; the span classes use the view's existing colours (no palette).
3. **5.7**: generators pure; no clock, no random; output is a function of the answer, the
   offer, the view and the player's line.
4. **7**: add rows: `range` with the block; `address` with the host after the sweep;
   service `cli` after the host scan; finding `cli` after the check, same keys for weakness and
   decoy; never in bootstrap or room answers; leak collector covers the strings by stage.
5. **8**: framework mode/module/TECHNIQUE in the renderer, never stored or sent. Nothing in
   player_state.
6. **9**: schema rows for each `cli` object (closed, `_` notes, patterns and caps of 4.2), under
   core's `definitions.service`, weakness, decoy and `networks` entries (shared file). Validator
   file `scripts/validate_realism_skin.rb`, hooked by one line in `validate_scenario.rb`; move the
   two wording/default warnings there. Errors: address outside range or duplicate; `hosts` key
   not a host on that network; range not private or prefix outside /16-/30; `address` without
   `range`; duplicate `module` in scenario; `module` starting `simulated/`; uneven authoring of
   `title`/`module`/`script` across a service's weaknesses and decoys (decoy tell); a `cli`
   string matching a CVE/bulletin pattern (`cve-\d{4}-\d+`, `ms\d\d-\d{3}`, case-insensitive);
   `banner`/`title` in `real_product_names.txt`; a `cli` string containing a scenario password
   (core's VN:519 rule). Warnings: `cli` string reading as a procedure (core S2 rule:
   path-like token other than `module`, flag, pipe); `cli` on a scenario with no `services`.
7. **10**: no existing scenario declares services, so nothing changes; add a sentence on the
   core's ops scenarios (no `cli` fields): they print defaults as 4.2 describes.
8. **11.1**: in `network-terminal-format.test.mjs` delete the deny-list sentence and the
   snapshot-against-plan sentence. Add `cli-gen-scanner.test.mjs` and
   `cli-gen-framework.test.mjs`: golden output per fixture under
   `test/js/fixtures/network-view/cli-golden/<generator>/<fixture>.<step>.txt`, each fixture
   twice (no `cli` fields; all fields authored); a provenance test (every span is a TEMPLATES
   entry, a field of the answer/view/`cli`, a computed count, or the player's line; marker
   fixtures); `show options` names exactly RHOSTS, RPORT, TECHNIQUE; no generator imports
   anything outside the allowed list; decoy and weakness with equal authored shapes print
   alike before confirm. Grammar test gains nmap and msf cases, unknown flags, `;` with two
   request commands, `-iL`, address targets. Copy lists: seven modules become ten.
9. **11.2**: test 3 "for a `confirm` offer the line begins `confirm`" -> begins `msf > use`;
   test 9 reverse direction: Terminal pieces may also be generator TEMPLATES spans or `cli`
   field values (Terminal-only dress), and all Panels pieces must still appear; the
   "scan output is the one text the Terminal alone prints" paragraph -> generator `started`
   lines.
10. **11.4**: `test_ops_skin` K3 gives the file server authored `cli` fields and leaves the
    printer on defaults; T2 adds a mistyped flag and `nmap -iL`; T4 Terminal run uses
    `nmap --script vuln -p ...`; T7 Terminal uses `msfconsole`, `use`, `set TECHNIQUE`, `run`.
11. **11.6**: screenshots of a version-scan table and an msf `run` with session opened.
12. **12**: step 4 adds `cli-gen/*`; step 6 adds `cli` schema/validator; shared files gain
    core's schema definitions and the leak collector.
13. **14**: add **request 3 to core**: serve optional `cli` fields with their objects:
    `networks.<id>.cli.range` on the view's block; `networks.<id>.cli.hosts.<hostId>.address`
    as `address` on the host row in the sweep answer and `GET /network`, only once discovered;
    a service's `cli` (`protocol`, `service`, `banner`) with the service after the host scan;
    a weakness's or decoy's `cli` (`title`, `module`, `script`) on the finding after the check,
    same keys for both; never in bootstrap or room answers; absent object left out; the leak
    collector stages them. Authored data only, generic defaults are client-side.
14. **15**: remove question 1 (answered: no forcing, default in the scenario). Add new
    questions with options and recommendation: (a) real advisory ids or real product names in
    `cli` fields: allow / refuse (recommend refuse, keeps the brief's "invented products,
    weaknesses are classes"); (b) mark the output as simulated ("Starting Nmap (simulated)") or
    print it bare (recommend the mark on the first line of each run only).
15. Final check: grep the plan for `SCAN_OUTPUT_TEXT`, `Echoreel`, `Lookmark`, `deny`,
    `no real tool`, `invented tools`, `open question 1`, `three design rules` and fix leftovers.
16. Append the remaining one-line-per-change entries under "## Round 2 picks (2026-11-19)" in
    `docs/agents/ops_layer/reviews/OPS_REALISM_SKIN_DECISIONS.md` (heading and first lines
    already added for the done items).

## Gotchas

- Rule 1 parity: generator lines must keep each Panels sentence as its own span, or test 9's
  piece comparison breaks.
- A decoy must get the same `cli` keys and defaults as a weakness, or the console tells it apart.
- Host addresses are under `networks.<id>.cli.hosts` because sign-in hosts are room objects,
  which ride in the bootstrap.
- Line count before this revision: 1121.
