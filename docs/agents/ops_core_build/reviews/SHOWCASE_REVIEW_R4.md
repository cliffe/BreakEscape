# Showcase review, round 4

Reviewer: re-review of the round 3 fixes and the scanner change. Date: 2026-11-26. Tree: `/data/be-ops-follow`, branch `ops-showcase-review`. Commits reviewed (`git log 5ada6d5e3..HEAD`): fc8dfcd0d (engine opening line), ba91ed812 (recon and second step text, clips), 1be8d2177 (leak scanner, R3 minors 2 and 3).

## Verdict

**Ready to merge: B 0, M 0, m 3.** R3 M1 is closed: the Terminal's opening line is now true. The coffee line names Gwen and has its clip. Both scanner rules are tighter than before. My own probes on the real captures show that a real leak is still caught and the honest captures stay clean. The eventMappings are append-only. The three minors are wording and notes. None of them blocks a merge.

## Checks run

| Check | Result |
|---|---|
| Rails (under flock): the four `demo_ops_*_scenario_test.rb`, every `access_leak_scanner_helpdesk_*` and `access_leak_scanner_ops_*` file | 351 runs, 0 failures, 0 errors |
| JS: `network-terminal-format`, `network-terminal-grammar` | Both pass |
| `ruby tools/check_mapping_index_drift.rb` | 4 scenarios, 0 failures |
| Mapping order | Recon: Jun's new "Back at my desk." entry is the last of Jun's list. The R7a bark changed its text in place, and its index is unchanged. Second step: no mapping change |
| Validator: recon, second step, terminal | 0 errors each. The recon realism-skin warnings (ink lines 61, 108, 261, 273) are on lines this range did not change |
| New clips | 5 sidecars, one for each new or changed spoken line, and each sidecar's text matches its line exactly: Ama's drop box intro, the R6 console line, the R7a bark, Jun's return bark, and the second step coffee line. The four clips they replace are removed. The hub choice labels are player choices, and player choices are not voiced |
| `access-leak-check.rb` on the honest captures 325, 326, 330, 331 | 326, 330, 331: no leaks found. 325: the repeat grant is reported unless its stops are named (see below) |
| Exploit content | None |

I could not run the TTS prune dry run (`app:break_escape:tts:prune_cache`), because the permission check refused it. I checked the sidecars by hand instead.

## R3 findings

- **M1 closed.** `OPENING_TEXT` now reads "Type help, or pick a command below. This console is a simulation: the tool names are real, but the machines, products and results are made up and nothing touches a real network." This is accurate. `nmap` and `msfconsole` are the real names. The products come from `realism_catalog/training_fixtures.json`, which are invented ("FileHold", advisory year 0000). The machines are scenario hosts. The console sends nothing over a network. The three JS assertions and the recon PLAYTEST note are updated. Ama's spoken R6 line now agrees: "It looks like a real console. The tool names are real, but the machines and results are made up." It has a new clip.
- **m1 closed.** The second step line now reads "Lorna, Darren, Gwen and Yusuf should be up for coffee within a couple of minutes." It has a new clip, and the old clip is removed.
- **m2 closed.** See probe (a).
- **m3 closed.** See probe (b).

## Scanner probes

Each probe used a tampered copy of a real capture, kept under `/data/tmp/scratch/r4-review/` and deleted afterwards. The scanner prints no values.

### (a) Repeat password grant inside a stop (game 325, line 203)

The two stopping rows are at 09:19:49.188Z and 09:19:54.787Z. The server's state shows that both were for `lorna_easton`.

| Run | Result |
|---|---|
| No `--refused` | 2 findings (`helpdesk_grant`, `helpdesk_secret`) |
| Both rows named `lorna_easton`, or both named `other` | No leaks found |
| Only one row named | 2 findings: an unnamed stop still holds |
| One row named `darren_price`, which is the grant's own account | 2 findings |
| An extra entry at a time with no stopping row | Exit 2, the entry is listed as unused |
| An account that is not in the scenario | Exit 2 |
| Both rows named `other`, and line 203's password replaced with Lorna's real password | `password` (owner Lorna) and `helpdesk_grant`: a real leak is still caught |
| Both rows named `other`, and line 203's `npcId` changed to `lorna_easton` (an account the run had not earned) | `helpdesk_grant` and `helpdesk_secret`: still caught |

A stop that has no readable time still blocks the exception (`@hd_stop_unknown`). A `--refused` name is the tester's claim, in the same way as `--signin`, and the header says so. It can only let a repeat of a value the run already holds pass. So a wrong claim can hide a lockout bypass, but it can never expose a secret.

### (b) A gating global set in ink (game 326, `printer_fixed`)

The honest capture is clean, with the note "public only from the answer that serves that ink". In every tampered copy, the setter ink rows (lines 145 and 147) were changed:

| Tamper | Result |
|---|---|
| `npc=` changed to another NPC (`jun_watanabe`) | 3 `ops_string` findings: both ink rows and the later `/scenario` key (line 164) |
| Status changed to 403 | Same 3 findings |
| The `set_global:printer_fixed:` tag removed from the body | Same 3 findings |
| The `/scenario` row moved in front of the ink rows | The gate key is reported on that early row. Moving the row also brings in 4 `ops:key:access` findings on later `/network` rows. Those come from the reordering itself, not from this rule |

The skips (`ops_ink_public?`) are only in `scan_ops_strings` and `scan_ops_global_keys`. The name now goes into `@ops_strings` again, so it also reaches `secret_values`. That list is used only to withhold output text, so this can only add findings, never hide one.

## Minor

- **m1. The terminal mission's plug-in bark still says "Every name is invented."** `scenarios/demo_ops_terminal/scenario.json.erb` (the `plug_in_done` bark): "This Terminal imitates two tools. ... Every name is invented." The Terminal's own opening line, in the same view, now says "the tool names are real". The rest of the bark makes the meaning clear, but the two lines read as a contradiction. Fix: "Every machine and product name is invented." It needs a new clip, an in-place text change (the index stays the same), and the matching line in that mission's PLAYTEST.md (T1 and the summary on line 3).
- **m2. The recon PLAYTEST quotes the old lines.** In `scenarios/demo_ops_recon/PLAYTEST.md`, R6 still quotes "It looks like a real console, but every product and name in it is made up." R6c quotes "...with the scan as a table, but the products and names are made up.", which is no longer the ink line (ink line 261: "The Terminal shows the scan as a table, the way a console prints it."). Update both quotes. These are notes only.
- **m3. Jun's new return bark is not described in the notes.** `npc_returned_post:jun_watanabe` with `data.playerDistance > 80` gives "Back at my desk." on every return, with no cooldown. Unlike the catch bark, it does not check `jun_caught`. A null distance does not fire it, which is correct. Add it to PLAYTEST R1a, and check live that it is not too frequent after repeated coffee calls, and that it reads well when the player is in another room.

## What a fixer should touch

Nothing is needed before merge. m1: one bark string, one clip and PLAYTEST lines in `demo_ops_terminal`. m2 and m3: PLAYTEST notes in `demo_ops_recon`.
