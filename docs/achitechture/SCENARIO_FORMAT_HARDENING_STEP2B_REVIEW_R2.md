# Step 2b review, round 2 - Author notes are not live

Second reviewer pass over `build/harden-2b` (tip `dcc6ae5aa`). Base for the full re-read:
`git diff 35993ec89...HEAD`. Plan: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`,
step 2b. Build log: step 2b phases A/B1/B2 plus the "R1 fixes" section. R1 review:
`SCENARIO_FORMAT_HARDENING_STEP2B_REVIEW_R1.md` (1 blocker, 0 majors, 1 minor, 1 nit). The
R1 fix is commits `601508b7b` (findings) and `dcc6ae5aa` (strips + sentinel backstop).

Security-sensitive: changes the walkers that grant access and the filters that keep secrets.

## Verdict on R1 findings

- **B1 (blocker) - closed.** `feed_answer` now strips the deep-duped intel fact with
  `#/definitions/socialIntelFact`, and `objectives_state` strips each duped objective with
  `#/definitions/objective`, each on the copy the method already owns, before it ships. Both
  pointers are in `STARTS`. **Must-fail proof reproduced:** reverting both strips makes
  `author_notes_sentinel_test` fail with `feed_post shipped a sentinel note value`
  (`SENTINEL-FACT` embedded in `fact.entry`); files restored with `git checkout`, tree clean.
  The fix is precise: `feed_answer` already slices the `post` itself to `POST_KEYS` and
  string values, so the post was never the leak; only the `facts[fid].deep_dup` entry was
  embedded wholesale, and that is exactly what the strip targets.
- **m1 (minor) - closed.** `scenarios/test_author_notes` grew sentinel notes across the
  note-capable blocks, and `author_notes_sentinel_test` plays the feed and objectives routes
  and asserts no note ships while the fact/objective still do. The two B1 routes are now
  exercised live.
- **n1 (nit) - closed.** `STARTS` holds `#/definitions/socialIntelFact` and
  `#/definitions/objective`; `scenario_schema_test` passes (now 12792 assertions across the
  combined run), so the Explore pointer assertion still covers every `at` call site.

## Independent route audit

Fourteen routes traced from `config/routes.rb` to the body each actually renders, asking only
"does the response embed a scenario sub-object wholesale (deep_dup or an unsliced reference)
without a strip". A note can ride a payload only through a wholesale embed; a key-by-key build
cannot carry an undeclared `_` key.

| Route | Source | Wholesale embed? | Note handling |
|---|---|---|---|
| `GET scenario` (bootstrap) | `filtered_scenario_for_bootstrap` | yes (whole tree) | root strip (`ScenarioSchema.root`) before any player-state key |
| `GET room/:id`, `POST npc_workaround` roomData, unlock roomData | `filtered_room_data` (room deep_dup) | yes | room strip (`#/definitions/room`) |
| `GET container/:id`, `render_login_desktop` contents | `filter_container_contents` (each item deep_dup) | yes | contents strip (`#/definitions/item/properties/contents`) |
| bootstrap `playerInventory` | `client_inventory` (inventory deep_dup) | yes | contents-node strip |
| `POST feed_post`, `POST friendface_phone`, bootstrap `feedPosts` | `feed_answer` fact entry (deep_dup) | yes | FIXED strip (`socialIntelFact`); the `post` is sliced to POST_KEYS |
| `GET objectives` | `objectives_state` (each objective deep_dup) | yes | FIXED strip (`objective`) |
| `GET network` | `host_row` / `resource_row` | no - built key-by-key | none needed |
| `POST login` / `render_login_desktop` session | `session_for_client` -> `login_session_answer` | no - key-by-key | none needed |
| `GET login_accounts` | `login_account_tiles` | no - `{username,displayName,portrait,avatar}` | none needed |
| `POST wear`, bootstrap `wornItem` | `worn_record` (player_state `worn`, not a scenario object) | no | none needed |
| `POST npc_workaround` body | `workaround_body` / `run_description` | no - key-by-key | none needed |
| `complete_task` / `skip_task` / `update_task_progress` | result hashes | no - `{success, taskId, ...}` | none needed |
| `GET capture_secrets` | `capture_secrets_for_client` | no - `{target_id => secret_string}` | none needed |
| bootstrap `objectivesState` | `objectives_state_for_client` | no - merges `{status}` onto player state | none needed |

The held-container lookups (`held_grant_items`, `held_usb_sticks`, `released_npc_containers`)
reach the client only as a container's `contents`, which `filter_container_contents` strips;
the stick's own top level is never rendered. The `social`, `policies` and `mailClient` blocks
ship in the bootstrap and are covered by the root strip. `networks`, `networkLinks` and
`resources` are withheld from the bootstrap (`WITHHELD_SCENARIO_KEYS`) and reach the browser
only through the key-by-key network rows.

**Conclusion of the audit: the two R1 strips close the whole wholesale-embed class. No further
route embeds a scenario sub-object wholesale without a strip.** The redone build-log audit
table is accurate.

## Findings

### n1 (nit) - the sentinel backstop is narrower than its "every block kind" claim

Not a defect in the fix and no live leak; a limit on what the regression net guarantees, worth
recording so a later round does not over-trust it.

1. **Routes the no-leak test does not drive.** `author_notes_sentinel_test` plays bootstrap,
   rooms, container, `feed_post`, `friendface_phone`, objectives, `capture_secrets`, network
   and `sync_state`. It does not drive desktop sign-in (`render_login_desktop`),
   `npc_workaround`, the task routes, `wear` or `login_accounts`. I traced each of those
   (above) and each builds key-by-key or strips through `filter_container_contents` /
   `filtered_room_data`, so there is no leak today; but if a future edit made one of them start
   embedding a sub-object wholesale, this backstop would not catch it. The orchestrator asked
   specifically whether mail, phone, desktop sign-in and workaround are exercised: phone yes
   (`friendface_phone`), mail yes (via the bootstrap `social` strip), desktop sign-in and
   workaround no.
2. **Vacuous sentinels.** `_sentinelNet` and `_sentinelWifi` sit under `networks` and
   `_sentinelRes` under `resources`, both withheld from the bootstrap and never shipped
   wholesale (the network rows are key-by-key); `_sentinelFeedPost` is sliced away by
   `feed_answer`'s `POST_KEYS` slice regardless of any strip. For these, the no-leak assertion
   proves "not shipped", not "stripped", so they do not test a strip path.
3. **Hand-maintained coverage list.** The coverage test's `required` block-kind map (18
   entries) is authored by hand, not derived from the routes or from the resolver's full set of
   note-capable locations, so a newly added wholesale-shipped note-capable block needs a manual
   addition to stay covered.

Optional hardening, not required for sign-off: drive `render_login_desktop` and `npc_workaround`
in the backstop (a login session and a performed workaround in the fixture), or add a short
comment on the test naming which sentinels are "not shipped" vs "stripped" so the guarantee is
not read wider than it is.

## What is correct (checked, no finding)

- `AuthorNotes.strip_notes!` / `note?` / `each_live` and `ScenarioSchema` (rules 1-4, FREE
  propagation, map vs patternProperties, nil pass-through) match the plan and R1's reading;
  the two new strips reuse them unchanged.
- The two fixes mutate owned copies only (`entry` is a `deep_dup`; each objective is
  `map(&:deep_dup)`); the stored `scenario_data` column is never touched.
- `feed_answer`'s `post` and every "no strip needed" row above were each confirmed to build
  key-by-key, so the audit's "none needed" verdicts hold.

## Tests run (single/affected files, flock shared lock per the brief)

- `author_notes_sentinel_test` 5/84; `scenario_schema_test` 10; `author_notes_test` 19
  (combined run 34/12792, 0 failures).
- `notes_never_ship_test` 6; `capture_notes_not_live_test` 4; `network_notes_not_live_test` 8;
  `scenario_schema_boot_test` 4 (combined 22/95, 0 failures).
- Consumers of the two changed methods: `feed_post_test`, `friendface_phone_test` (50/325, 0
  failures).
- Must-fail: both strips reverted -> `author_notes_sentinel_test` 1 failure (`feed_post shipped
  a sentinel note value`); restored via `git checkout`, tree clean.
- Validator: `validate_scenario.rb scenarios/test_author_notes/scenario.json --no-graph` -> 0
  errors, 10 warnings. `scenarios/` left clean (no `dungeon_graph.*` rewrite).

## Counts: 0 blockers, 0 majors, 0 minors, 1 nit.
