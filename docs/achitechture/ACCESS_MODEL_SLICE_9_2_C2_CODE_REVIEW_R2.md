# Access model slice 9.2 C2: code review round 2 (adversarial, fresh eyes)

Reviewed `git diff main...build/9-2-c2` at merge commit `475093294`. Scope: reactive
Friendface posts chosen by the server from NPC state, each shown at most once, order modes
`facts_first` / `reactive_first` / `mixed`. Plan `ACCESS_MODEL_SLICE_9_2_C2_PLAN.md`.

## Verdict

No blockers, no majors. One minor, two nits. The merge resolution is correct, server
authority holds against a tampered client, the save migration is complete, and the touched
suites plus the 9.2 frustration and 9.3b outage suites are green.

## Counts

| Severity | Count |
|----------|-------|
| Blocker  | 0 |
| Major    | 0 |
| Minor    | 1 |
| Nit      | 2 |

## Checks carried out

- **Merge resolution (`npc_frustration.rb`, `475093294`).** C2's `frustration_globals` plus
  the `AccessWork` helpers were kept; `AccessWork.truthy_global?`
  (`lib/break_escape/access_work.rb:383`) delegates to `NetworkModel.truthy?`
  (`lib/break_escape/network_model.rb:309`). No removed method is still called: a grep for
  `frustration_global`, the old `NpcFrustration#truthy_global?` and the inline
  `frustration_globals_hold?` body finds only the `network_model.rb:302` comment, which now
  names `AccessWork.truthy_global?` (which exists). Globals merge semantics agree:
  `Game#global_variable_value` (`game.rb:315`) returns the player value when the key is
  present, else the scenario default, else nil; `frustration_globals`
  (`npc_frustration.rb:722`) is `defaults.merge(live)`, so a single-key read gives the same
  player-or-default by key presence. No 9.2 frustration or 9.3b outage behaviour changed:
  `outage_global` still delegates to `global_variable_value`, and `network_outages_test.rb`
  and `npc_frustration_test.rb` pass.
- **Server authority with a tampered client.** The served post is picked entirely by
  `AccessWork.select_feed_post` from state the server records (feed `order`, the `when`
  conditions over merged globals, the raw `npcFrustration` entry read read-only, and
  lockout keys pre-gated by the per-NPC check record). The client's `source` is validated by
  `feed_source_ok?` before selection (`social_feed.rb:52`); no request field names the post.
  The build log records a live tampered-client proof (forged `post_id`, `index`, `when`,
  `force` ignored).
- **Save migration.** `AccessWork.feed_shown_ids` (`access_work.rb:367`) migrates a C
  `{ n, at }` save to the first `n` ordered (no-`when`) post ids; the serve path, the
  `feedPosts` restore block and `verify-run.rb:116` all read `shown` when present and fall
  back to `n`. The JS client (`social-feed.js restore`) consumes only the server-built
  `feedPosts` block, never the raw record, so a C-shaped save renders without a nil error.
- **Leak paths and the scanner.** `access_leak_scanner.rb` now accumulates served ids
  (`@feed_shown`) and migrates a saved `{ n, at }` to ordered ids (`:800`); it reads the
  served id from the answer body rather than an authored-order prefix, which matches the
  server serving reactive posts out of order. `access_leak_scanner_feed_test.rb` passes.
- **Plain-text output.** `social-feed.js:244` passes `{ plainText: true, verbatim: true }`
  to `gameAlert`; `notifications.js` now defaults to plain text and honours `verbatim`
  (`:193`-`:234`), so the "<name> posted on <site name>" toast renders verbatim with no dash
  display. Correct.
- **Validator checks and false positives.** New reactive checks live in
  `validate_access_work.rb` (`check_feed_order`, `check_reactive_post`,
  `reactive_report_lines`). Validator run (`LANG=C.UTF-8 /usr/bin/ruby3.2
  scripts/validate_scenario.rb <file> --no-graph`, counting `❌`):
  - `test_access_*` (doors, habits, networks, sessions, signin, social, work): **0 each**.
  - Labs: `lab_exploitation` 13, `lab_feeling_blu` 10, `lab_malware_metasploit` 1,
    `lab_post_exploitation` 12, `lab_vulnerabilities` 3, `lab_vulnerability_analysis` 9;
    the rest 0. None of these `❌` lines are reactive/feed/order related (labs author no
    feeds), so they are pre-existing and not a C2 false positive.
- **Tests.** Touched Ruby suites plus frustration and outage suites
  (`feed_post_test`, `access_helper_equality_test`, `npc_frustration_test`,
  `network_outages_test`, `access_leak_scanner_feed_test`, `access_work_feed_select_test`):
  **113 runs, 658 assertions, 0 failures, 0 errors** under the shared lock. Touched and
  related JS (`validator-access-reactive` 10, `social-feed` 23, `npc-needs-social-media` 19,
  `validator-access-social` 17, `playtest-verify-run-access` 14, `npc-needs-work` 51):
  **all pass, 0 fail.**

## Findings

### Minor

**MIN-1 `frustration_globals_hold?` has no production caller.**
`app/models/break_escape/npc_frustration.rb:731`. The method now only delegates to
`AccessWork.globals_hold?`, and the old inline caller (the `off` cause branch) was lifted
into `AccessWork.cause_holds?`. A grep across `app lib test tools` finds no production
reference; the sole use is the parity assertion in
`test/controllers/break_escape/access_helper_equality_test.rb:67`. It is harmless but reads
as live code. Fix: either delete it and have the equality test call
`AccessWork.globals_hold?(cond, @game.send(:frustration_globals))` directly, or add a
one-line comment that it exists only as the equality-test parity point.

### Nits

**NIT-1 `feed_answer` can emit an empty post block for a stale saved id.**
`app/models/break_escape/social_feed.rb` `feed_answer` and the `feedPosts` builder
(`:98`-`:100`). If a game's saved `shown` list holds an id that the scenario no longer
contains (scenario edited between saves), the `feedPosts` map emits `{ index, post: {},
fact: nil }` for it rather than skipping it. The client renders nothing from an empty post,
so the effect is cosmetic, but a defensive `next unless AccessWork.feed_posts(npc).any? { |p|
p['id'] == pid }` in the `shown.each_with_index` map would drop it cleanly.

**NIT-2 Reactive report lines interleave with per-post detail lines by original index.**
`scripts/validate_access_work.rb` work-report sort
(`l.start_with?('ℹ️ Feed', 'ℹ️ Reactive feed', 'ℹ️   ')`). All three `ℹ️` prefixes sort to
the bottom with a stable secondary index, so a feed header, a reactive header and the
indented `fires when ...` detail lines can appear in a slightly mixed order across NPCs. The
report is still readable; grouping by NPC (sort on `npc['id']` within the `ℹ️` block) would
tidy it. Purely cosmetic.
