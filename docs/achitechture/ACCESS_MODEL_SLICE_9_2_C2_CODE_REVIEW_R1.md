# Access model slice 9.2 C2: code review round 1 (adversarial)

Reviewed `git diff main...build/9-2-c2` (main carries q33's `object_id` on `POST /feed_post`).
Scope: AccessWork helpers, `when_reachable?`/`feed_done?`/`cause_why_holds?`, the three order
modes, selection after q33's refusals, server authority under a tampered client, the
`feedRevealed` `{n,at}` to `{shown,at}` migration, leak paths and the scanner changes, the
validator, and plain-text output.

Date: 2026-11-12. Reviewer: subagent on Opus 4.8.

## Verification run

- `test/unit/access_work_feed_select_test.rb`, `test/unit/access_leak_scanner_feed_test.rb`,
  `test/controllers/break_escape/access_helper_equality_test.rb`,
  `test/controllers/break_escape/feed_post_test.rb`: 65 runs, 328 assertions, 0 failures, 0 errors
  (under the shared lock).
- `test/js/validator-access-reactive.test.mjs`: 10 pass, 0 fail.
- Validator (`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`,
  counting every `❌` line) over `test_access_doors`, `test_access_habits`, `test_access_networks`,
  `test_access_sessions`, `test_access_signin`, `test_access_social`, `test_access_work` and
  `lab_social_engineering`: **0 ❌ each**. No scenario or `dungeon_graph.*` file was modified by the
  runs (`git status` clean).

## Summary

The code matches the plan closely. Server authority holds: the controller reads only `npc_id`
and `object_id` (`games_controller.rb:1236-1238`), every condition input is the server's own
record, and `select_feed_post` is reached only after q33's `feed_source_ok?` refusals
(`social_feed.rb:50-57`). The one copy of the cause/global rule lives in `AccessWork`; the
`NpcFrustration` wrappers call it and the `locked_out` pre-gating is pinned by the equality test.
The `{n,at}` migration is handled in both route paths and in the scanner. The scanner's inverted
C-era "out-of-order serve is a leak" check is now sound: an out-of-order post is legitimate only
when the server's own `/feed_post` body named it (or the saved `shown`/migrated base covers a
resumed reveal), and a `feedPosts` entry for a post never served is still reported as a
`feed_text` leak (`access_leak_scanner_feed_test.rb:133-134,159-162`).

No blockers, no majors. Findings below are one minor and two nits.

## Blockers

None.

## Majors

None.

## Minors

### MIN-1 — reactive report detail lines are orphaned from their headers in the work report

`scripts/validate_access_work.rb:839`

```ruby
lines.sort_by.with_index { |l, i| [l.start_with?('ℹ️ Feed', 'ℹ️ Reactive feed') ? 1 : 0, i] }
```

`reactive_report_lines` emits a header `ℹ️ Reactive feed <id>: ...` followed by per-post detail
lines that begin `ℹ️   <post_id>: ...` (the indent is `ℹ️` plus three spaces). The sort groups the
headers into bucket 1 (printed last), but the detail lines do not match either prefix, so they fall
into bucket 0 and sort to the **top** of the work report, detached from the headers. Observed on
`test_access_social`: five `ℹ️   f10_vent/...` detail lines print immediately under
`Work report (access slice 9.2):`, while the four `ℹ️ Reactive feed ...` headers (naming only the
order mode and count) sit at the bottom with nothing under them. The author-facing report is
misleading.

Fix: add the indented prefix to the bucket-1 test so a header and its detail lines stay contiguous
(the sort is stable, so authored order within the bucket is preserved):

```ruby
lines.sort_by.with_index { |l, i| [l.start_with?('ℹ️ Feed', 'ℹ️ Reactive feed', 'ℹ️   ') ? 1 : 0, i] }
```

## Nits

### NIT-1 — `needMet` reachability ignores the predicate's own `need` scope

`lib/break_escape/access_work.rb:599-601`

```ruby
when 'frustrationAtLeast', 'frustrationBelow', 'needMet'
  JUDGED_NEEDS.any? { |n| can_fail?(data, npc, n) }
```

`when_predicate_reachable?` treats `needMet` as reachable whenever the NPC can fail *any* judged
need, ignoring an explicit `needMet: "work"` scope. So `needMet: "work"` on an NPC that can fail
only `social_media` is judged reachable: `feed_done?` keeps that feed open forever (branch (b)
never kills the post) and the validator issues no dead-post warning, yet the live `need_met_now?`
can never hold for `work`. This matches the plan's documented coarse rule (section 4 branch (b):
"an NPC with no failable need"), so it is not a divergence, but it is a latent authoring trap
the validator cannot catch. Optional hardening: when `needMet` is a specific need (not `true`),
require `can_fail?(data, npc, needMet_value)` rather than any judged need. The `cause` predicate
already honours its `need` scope in `cause_reachable?`, so this would make the two consistent. Add
a validator warning and a `feed_done?` unit case if changed. Low priority; no built scenario hits
it.

### NIT-2 — `feed_shown_ids` is computed twice per `/feed_post`

`app/models/break_escape/social_feed.rb:46,57`

The route derives `shown = AccessWork.feed_shown_ids(npc, entry)` and then passes `entry` to
`select_feed_post`, which derives the same list again internally
(`access_work.rb:624`). Harmless (both read the same entry), but the route already holds the list
it needs for the pace check and the append. If a later change makes `feed_shown_ids` non-trivial,
pass the derived `shown` into selection instead of recomputing. No action needed now.

## Notes (checked, no finding)

- Globals merge: `frustration_globals` (`npc_frustration.rb:722-727`) builds `defaults.dup.merge(live)`,
  so a live key present wins even at `false`/`0` and the scenario default is used only when the key
  is absent, matching the old per-name `frustration_global`. The equality test pins this.
- `cause: "locked_out"` lines up across the live and pure paths only because `cause_belongs?`
  forces `cause['id']` to the station for that why, so `cause_holds?`'s
  `locked_out_at?(npc, object(data, id), pre_gated_keys)` agrees with the old
  `lockout_recorded?`-only branch. The pre-gating (`[]` when no check record) is passed from both
  the route and the wrapper.
- Withholding: `feed` stays in `WITHHELD_WORK_NPC_KEYS`, `feed_answer` ships only `POST_KEYS`
  (`when`/`order`/`deliberate` never leave the server), and `withhold_feed_facts!` scans all
  `feed.posts[]` including reactive facts. The tampered-client tests confirm no reactive text or
  fact appears in any response before the server serves it.
- `done` is computed over `shown + [chosen]` so the last reveal answers `done: true`; `feed_done?`
  and `when_reachable?` read only scenario reachability, so a transiently-false but reachable
  reactive post keeps the feed open.
