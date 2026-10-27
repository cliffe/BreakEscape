# Awareness settings: adversarial review

Reviewed 2026-10-27, read-only.

- Engine: commit 9a830925c (`BreakEscape/BreakEscape`).
- Host: uncommitted awareness changes in `Hacktivity`. The `platform_helper.rb` and `game_shell.css` edits belong to the Android work and were not reviewed.
- Spec: `HACKTIVITY_ROUTE_PROPOSAL.md`, plus the owner's decisions: three keys, each resolved slot → course → course's org → nothing; never the player's org; VIPs edit their course, admins the org default, slots per `GameSlotPolicy`.

Tests run: the four host test files (48 runs, 216 assertions, 0 failures), the engine's `awareness_config_test.rb` (12 runs, 0 failures) and `test/js/social-fun-engine.test.mjs` (13 pass).

Paths below are relative to each repo. "H:" is Hacktivity, "E:" is the engine.

## Findings

### Major

**M1. Copying a course carries its settings, and its listings' settings, into another org.**
H:`app/controllers/events_controller.rb:341` and `:424` deep-copy `awareness_settings` whatever the target org is. The target comes from `:312-322`: a VIP's copy goes to `current_user.org_id`, and an admin's goes to `params[:event][:org_id]`. Two paths result:
- An admin copies org A's course into org B. The copy keeps A's "forward it to security@a.example" route at course level, and since the course outranks the org, B's own default is masked in every game of the new course.
- A VIP copies an org-less pool (`EventPolicy#org_manager_may_copy?`, H:`app/policies/event_policy.rb:131-137`). Any course- or slot-level text an admin put on the pool lands in the VIP's course and overrides that org's default.

Nothing on the copy form shows that this text comes along. The spec (§4, "Copying events") wanted copies to keep the route, but it assumed a same-org copy. The copy test (H:`test/controllers/awareness_settings_forms_test.rb:113-128`) only covers a same-org copy.
*Fix:* copy event and slot settings only when the new event's `org_id` equals `@event.org_id` and both are non-nil. Otherwise start the copy at `{}`. Add a test where an admin copies to org2 and a VIP copies a pool, asserting `{}` on the copy and its slots.

### Minor

**m1. The isolation test never has a player from one org play another org's listing.**
H:`test/integration/awareness_settings_isolation_test.rb:58-70` pairs each slot with a player from the same org. The rule "never the player's own org" is only proven for a game with no slot (`:72-78`), plus a stubbed `FakeGame` (H:`test/lib/break_escape_awareness_settings_test.rb:62-67`). The code never reads the player (H:`app/models/concerns/awareness_settable.rb:29-37`, H:`config/initializers/break_escape.rb:111-113`), so the risk is low.
*Fix:* add a case where `@org2_user` plays `@slot1` with both orgs set. Assert org 1's values and that "Org 2" is absent from the body.

**m2. Line breaks count once in the browser and twice in the validation.**
`maxlength=600` on the text areas (H:`app/views/shared/_awareness_settings_fields.html.erb:13,21`) counts a line break as one character. The form submits CRLF, and `validates length: 600` (H:`app/models/concerns/awareness_settable.rb:21`) counts it as two. A 600-character text with blank lines passes the browser, then fails on save with a confusing error. The engine already folds CRLF (E:`app/helpers/break_escape/application_helper.rb:37`).
*Fix:* in `normalise_awareness_settings` (H:`awareness_settable.rb:56-59`), apply `value.gsub(/\r\n?/, "\n")` before `strip`.

**m3. Bidi and zero-width characters get through.**
`[[:cntrl:]]` in E:`app/helpers/break_escape/application_helper.rb:37` removes Cc only. U+202E (right-to-left override) and U+200B survive (checked: `"a‮b​c"` comes out unchanged). An organiser could make an address display reversed. This is not script injection (the text goes in through `textContent`), and it only affects courses that organiser runs.
*Fix:* also strip `[​-‏‪-‮⁦-⁩﻿]`.

**m4. No test renders a hostile stored value back into the edit forms.**
The fields use `form.text_field` / `form.text_area` (H:`_awareness_settings_fields.html.erb:5,13,21`), which Rails escapes. `blank_means` is a literal string, also escaped (H:`app/views/events/_form.html.erb:92`, `orgs/_form.html.erb:54`, `game_slots/_form.html.erb:52`). The forms are safe today, but nothing locks that in.
*Fix:* store `"\"><script>x</script>` on an event, GET the edit form, and `assert_select` that the textarea content equals the raw string and that no extra `script` element appears.

**m5. The event form hint sends VIPs to a page they cannot edit.**
H:`app/views/events/_form.html.erb:91` says "(set on the organisation's page)", but `OrgPolicy#update?` is admin-only (H:`app/policies/org_policy.rb:25-27`).
*Fix:* for non-admins, say "(set by Hacktivity staff)" or drop the parenthesis.

## Checks that passed

1. **Isolation.** Resolution reads only `game.game_slot`, then `slot.event`, then `slot.event&.org` (H:`awareness_settable.rb:32`, H:`config/initializers/break_escape.rb:112`). There is no `Thread.current`, no memo and no class-level cache. The engine helper calls the hook on every render with no instance variable (E:`application_helper.rb:13-31`, E:`games/show.html.erb:211`). A restart inherits the slot only when `can_continue_in_slot` allows it (E:`app/controllers/break_escape/games_controller.rb:243-249`). Otherwise the new game has no slot and gets nothing. The real view test proves the two-org split (H:`awareness_settings_isolation_test.rb:58-70`). The one leak is M1.
2. **Escaping.** Stored value → helper whitelist, `be_plain` (String only) → `raw json_escape(hash.to_json)` (E:`show.html.erb:234`). That escapes `<`, `>`, `&`, U+2028 and U+2029, with no double escaping, since `to_json` has already turned them into `<` and so on. On the client, `awarenessSettings` (E:`public/break_escape/js/minigames/episode-runner/episode-model.js:449-459`) → `textBox`/`el` set `textContent` only (E:`debrief-view.js:70-74, 279-287`). There is no `innerHTML` in the episode-runner directory. The `</script>` test runs through the real view in both repos (E:`test/controllers/break_escape/awareness_config_test.rb:83-94`, H:`awareness_settings_isolation_test.rb:80-85`).
3. **Authorisation.** Org: `OrgPolicy#update?` is admin-only, so the extra `current_user.admin?` guard in H:`orgs/_form.html.erb:50` is belt and braces. Event: VIPs and account managers go through `event_vip_params` (H:`events_controller.rb:159-160, 699-713`), which adds only the four awareness keys, and `EventPolicy#update?` limits them to their own events. Slot: `GameSlotPolicy#update?`/`create?` are admin-only, and `update_quick_edit` writes `release_at` only (H:`game_slots_controller.rb:357-364`). The tests cover VIP on org, VIP on another org's event, VIP not signed up, and VIP on a slot.
4. **Correctness.** Each key resolves on its own, slot first (H:`awareness_settable.rb:35`). Heading and text come from one level, and a heading with no text is dropped on both sides (H:`:34, :44`; E:`application_helper.rb:20-22`). Blanks are stripped to nil and compacted out of the hash (H:`:55-65`). Team size is cast from a whole-number string and validated to 2..100000 (H:`:60-71`), and the engine bounds it again (E:`:41-48`). Old `{}` rows read as all-nil. A nil slot gives nil, a nil org is compacted away, and `event` is a required `belongs_to`. The client's `pick` honours the host key by key (E:`episode-model.js:452`).
5. **Migration.** `add_column ... :jsonb, null: false, default: {}` on three tables (H:`db/migrate/20261027160000_add_awareness_settings.rb:8-10`). A constant default is metadata-only on PostgreSQL 11+, and the migration is reversible. The `db/schema.rb` diff has only the version line and the three `t.jsonb` lines.
6. **Tests.** The isolation and `</script>` tests go through the real engine `show` view, with a real `GameSlot` → `Event` → `Org` chain. Only `generate_scenario_data`/`initialize_player_state` are stubbed. The `FakeGame` struct is used only in the hook unit test. Gaps: m1, m4, M1.
7. **Engine stays generic.** The commit names no Hacktivity model (the existing `belongs_to :game_slot, class_name: '::GameSlot'` predates it). With no hook, `BreakEscape.configuration&.awareness_settings` is nil, the helper returns `{}` and the key is left out (tested: E:`awareness_config_test.rb:39-44`, and `:131-140` for nil and non-hash returns). A hook that raises is logged, and the page still renders (`:78-83`).

Not a finding: the host test run warns that `BreakEscape-merge/lib/break_escape/version.rb` loaded before `BreakEscape/BreakEscape`'s. The engine helper under test still came from the reviewed tree (the merge tree does not contain 9a830925c, yet the awareness tests pass). It may be worth checking which tree puts that file on the load path.

## Counts and verdict

- Blockers: 0
- Major: 1 (M1)
- Minor: 5 (m1 to m5)

**Verdict: fix first.** M1 is a small change: a same-org guard in `copy_event`, plus a test. The minors can go in the same pass or later.
