# Proposal: per-course / per-organisation "how to report" route for awareness episodes

Read-only scoping. No files in either repo were changed.

## 1. How Hacktivity launches Break Escape today

- **Mounting.** `Hacktivity/Gemfile:14` pulls the engine by path (`gem "break_escape", path: "../BreakEscape"`); `config/routes.rb:4` mounts it at `/break_escape`.
- **Listings.** A `GameSlot` (`app/models/game_slot.rb`) belongs to an `Event` and a `BreakEscape::Mission`, plus an optional `SecGenBatch`. Admins edit slots in `GameSlotsController` (`game_slot_params`: brief, lab_sheet_url, release dates, weights and so on).
- **Launch.** `GameSlotsController#start` (line 80) calls `create_game_for_listing` (line 408). That builds `BreakEscape::Game.new(player: user, mission:, game_slot:)`, with `vm_set_id` and `player_state['vm_set_id']` for VM-backed slots, then redirects to `break_escape.game_path(game)`. It is a full-page redirect into the engine. The engine's own `show` page is not an iframe (the `?embedded` iframe in `application_helper.rb:88` is the other way round: Hacktivity's VM panel inside the game).
- **Links between the engine and the host.** `BreakEscape::Game` has `belongs_to :game_slot, class_name: '::GameSlot'` only `if defined?(::GameSlot)` (`app/models/break_escape/game.rb:11-13`). So in Hacktivity a game resolves `game.game_slot.event.org`. Legacy games, and games from an engine "New session" that did not inherit the slot, have `game_slot_id` NULL.
- **Host config hook.** `lib/break_escape.rb` defines `BreakEscape::Configuration` with callables (`on_game_complete`, `on_flag_submit`, `on_task_complete`, `can_continue_in_slot`). Hacktivity sets these in `config/initializers/break_escape.rb`. That is the existing, tested pattern (`test/lib/break_escape_on_flag_submit_test.rb`) for engine-to-host calls.
- **Client bootstrap.** `app/views/break_escape/games/show.html.erb:206-230` writes `window.breakEscapeConfig = {...}` in a nonce'd script. There is no `awareness` key yet. `GamesController#show` does no HTTP caching (no `fresh_when` or `expires_in`).
- **Client reader (already done, a8caac8e0).** `episode-model.js` `awarenessSettings()` takes `config.awareness` key by key over `social.awareness` (`reportRoute`, `ruleOfThumb`, `teamSize`), trims and caps text at 600 chars. `debrief-view.js` inserts every string with `textContent`.
- **Existing settings and who edits them.**
  - `Org` (`orgs` table: name, seats, subscription_end_date, stripe_customer_id). Admin-only form (`OrgPolicy#update?` → `user.admin?`; `orgs_controller.rb:71` permits name/seats/subscription_end_date).
  - `Event` (`events` table; `type_of_hacktivity` covers event/course/experience/pool/game; `belongs_to :org, optional`). Admins can edit it, and so can org-scoped VIPs or account managers signed up to the event (`EventPolicy#update?` → `scoped_vip_by_event?`). The controller narrows VIPs to `event_vip_params` (title, description, eligible_emails, send_invitations, scoreboard, faq_url, start/end).
  - There is no generic settings store. The only jsonb column on a Hacktivity table is `users.onboarding_emails_sent`.

So "a course" in Hacktivity is an `Event` with `type_of_hacktivity: course`, and "an organisation" is `Org`. Organisers (VIPs) can already edit their own events but not their org record.

## 2. Smallest clean design

**Where it lives.** Add one nullable `jsonb awareness_settings` column (default `{}`) to both `events` and `orgs`. Each model gets `store_accessor :awareness_settings, :awareness_report_heading, :awareness_report_text`. A single jsonb column leaves room for `ruleOfThumb` and `teamSize` later (the client already reads them) with no further migrations. If you'd rather keep it minimal, two plain columns on `events` alone (`awareness_report_heading` string, `awareness_report_text` text) also works. The org default can come later.

**Resolution order** (first non-blank wins): event (course) → event's org → nothing. Nothing means the client falls back to the scenario's `social.awareness.reportRoute`, then the generic line.
Open choice: add the **player's** org (`user.org`) as a third fallback, for public events with no org. It leaks nothing because it is the player's own organisation. It does mean a student from org A who joins org B's course sees B's route, which is correct for that course.

**Who edits.**
- Event or course route: admins, plus scoped VIPs or account managers (organisers), through the existing event form. Add the two fields to `event_params` **and** `event_vip_params`.
- Org default: admins only, through the existing org form. VIPs cannot edit orgs today. If organisers should set the org default too, that is a separate policy change and is not in this proposal.

**How it reaches Break Escape.** Add a new engine config callable, `config.awareness_settings = ->(game) { Hash or nil }`, set in Hacktivity's initializer. It is resolved live in `GamesController#show`, not stored on the game at creation. Reasons:
- Edits take effect on the next page load, and old games pick them up.
- Games created inside the engine (`new_session`) need no host involvement.
- The engine stays free of Hacktivity model names. It already uses this pattern for `can_continue_in_slot`.

**How show.html.erb renders it.** The engine helper whitelists keys and coerces each value to a plain string of 600 chars or fewer. Only then does it serialise, with `raw json_escape(hash.to_json)`. That matches `missionDisplayName: <%= raw(@mission.display_name.to_json) %>`, plus an explicit `json_escape` so the output never depends on `escape_html_entities_in_json`. The key is left out when the hash is empty. The client already uses `textContent`, so there is no HTML path. Any exception in the hook is caught and logged, and the game loads without the key.

## 3. Files that would change

### Break Escape (engine)

1. `lib/break_escape.rb`: add `:awareness_settings` to `attr_accessor` and set `@awareness_settings = nil  # callable: ->(game) { { report_heading:, report_text: } } or nil` in `initialize`.
2. `app/helpers/break_escape/application_helper.rb` (or a new `games_helper.rb`):
   ```ruby
   AWARENESS_TEXT_MAX = 600
   def break_escape_awareness_config(game)
     hook = BreakEscape.configuration&.awareness_settings
     raw_settings = hook&.call(game)
     return {} unless raw_settings.is_a?(Hash)
     text    = be_plain(raw_settings[:report_text])
     heading = be_plain(raw_settings[:report_heading])
     return {} if text.blank?
     { reportRoute: heading.present? ? { heading: heading, text: text } : text }
   rescue StandardError => e
     Rails.logger.warn "[BreakEscape] awareness_settings hook failed: #{e.class}: #{e.message}"
     {}
   end

   def be_plain(v)
     v.is_a?(String) ? v.gsub(/[[:cntrl:]&&[^\n]]/, '').strip[0, AWARENESS_TEXT_MAX] : ''
   end
   ```
3. `app/views/break_escape/games/show.html.erb`: compute `<% _awareness = break_escape_awareness_config(@game) %>` above the script. Inside `window.breakEscapeConfig` add:
   ```erb
   <% if _awareness.present? %>awareness: <%= raw json_escape(_awareness.to_json) %>,<% end %>
   ```
4. Tests:
   - `test/controllers/break_escape/games_controller_test.rb`: with the hook set to return a route, `GET show` includes `"awareness":{"reportRoute"`; with the hook nil, or raising, there is no `awareness` key and the page still renders 200; a `</script><img onerror=…>` value comes out as `</script>`; text over 600 chars is cut. Reset `BreakEscape.configuration.awareness_settings` in teardown.
   - A unit test for `be_plain` and the key whitelist.
   - The JS side is already covered by a8caac8e0 (`test/js/engine-fixes-engine-a.test.mjs`). Optionally add a case where host config overrides the scenario.
5. Docs: one paragraph in `README_scenario_design.md` (awareness section) saying the host can set the route with `config.awareness_settings`.

### Hacktivity (host). Ask before editing, per the standing rule; changes go on main.

1. Migration `db/migrate/2026XXXXXXXXXX_add_awareness_settings_to_events_and_orgs.rb`:
   ```ruby
   add_column :events, :awareness_settings, :jsonb, null: false, default: {}
   add_column :orgs,   :awareness_settings, :jsonb, null: false, default: {}
   ```
   Then `db/schema.rb` is regenerated.
2. `app/models/concerns/awareness_settable.rb` (new, small), included in `Event` and `Org`:
   ```ruby
   store_accessor :awareness_settings, :awareness_report_heading, :awareness_report_text
   validates :awareness_report_heading, length: { maximum: 80 },  allow_blank: true
   validates :awareness_report_text,    length: { maximum: 600 }, allow_blank: true
   before_validation { self.awareness_report_heading = awareness_report_heading.presence&.strip
                       self.awareness_report_text    = awareness_report_text.presence&.strip }
   def awareness_report_route
     awareness_report_text.present? ? { report_heading: awareness_report_heading, report_text: awareness_report_text } : nil
   end
   ```
3. `config/initializers/break_escape.rb`:
   ```ruby
   config.awareness_settings = lambda do |game|
     event = game.try(:game_slot)&.event
     event&.awareness_report_route || event&.org&.awareness_report_route
     # optional: || (game.player.try(:org)&.awareness_report_route)
   end
   ```
4. `app/controllers/events_controller.rb`: add `:awareness_report_heading, :awareness_report_text` to `event_params` (line ~628) and `event_vip_params` (line ~650); also carry them across in `copy_event` (near line 313, where `faq_url` is copied).
5. `app/views/events/_form.html.erb`: a "Reporting suspicious messages (awareness games)" fieldset, visible to VIPs (outside the `current_user.admin?` blocks). It has a heading `text_field` (placeholder "How to report here"), a `text_area` (maxlength 600) and a hint: "Plain text. Shown in the debrief of every awareness episode in this course. Leave blank to use the organisation default."
6. `app/controllers/orgs_controller.rb:71`: permit the two fields. `app/views/orgs/_form.html.erb` gets the same two inputs, with the hint "Default for all this organisation's courses."
7. Tests:
   - `test/lib/break_escape_awareness_settings_test.rb`, in the style of `break_escape_on_flag_submit_test.rb`: callback configured; event route wins over org; org used when the event is blank; nil for a game with no slot or with an org-less event; another org's route never returned (two orgs, two events, fixtures).
   - `test/models/event_test.rb` and `org_test.rb`: length validations; blank becomes nil.
   - `test/controllers/events_controller_test.rb`: a scoped VIP can update the route on their own event, cannot on another org's event (existing policy), and admin can.
   - `test/controllers/orgs_controller_test.rb`: admin can set it; a VIP is refused.
   - An integration test in `test/integration/` (next to `mission_multi_org_isolation_test.rb`): start a slot in an org-A course and see A's route in the `breakEscapeConfig` script; org-B course shows B's.

## 4. Risks

- **Multi-tenant leakage.** The route is resolved from the game being shown (game → slot → event → org), never from a global or `Thread.current`. The engine's `authorize @game` already limits who can open the page. The isolation integration test above guards this. A wrong fallback, such as "first org", would leak, so the hook returns nil rather than guessing.
- **XSS and escaping.** There are three layers:
  - Server: whitelisting keys and coercing to plain text.
  - Serialisation: `json_escape(to_json)` turns `<`, `>`, `&`, U+2028 and U+2029 into escapes, so `</script>` cannot close the nonce'd block.
  - Client: `textContent` only.
  
  Do **not** follow the view's existing `'<%= … %>'` single-quoted pattern for this value. HTML-escaping inside a JS string is the wrong escaping and breaks on apostrophes ("Don't click…").
- **Caching.** `show` is not HTTP-cached and the route is read on each load, so edits apply on the next load. A tab that is already open keeps the old text until reload. If page or fragment caching is ever added to `show`, the cache key must include the event and org `updated_at`.
- **Defaults when unset.** The hook returns nil, the key is left out, and the client falls through to the scenario `social.awareness.reportRoute`, then the generic line. Per a8caac8e0, the generic line shows only when the episode asks for `slot:customer_report_route`. Standalone mode and demo users never set the hook, so they behave as today. If the hook raises, it is logged and the key left out, so the game still loads.
- **Scope creep and wrong audience.** A course run for one employer gets the right route. A public event with no org gets nothing unless the player-org fallback is adopted. Organisers can edit their own course only, and the org default stays admin-only unless the policy is widened.
- **Copying events.** Without the `copy_event` change, a copied course silently drops its route.
- **Length mismatch.** The server cap (600) and the client cap (600) must stay in step; the server is the source of truth.
