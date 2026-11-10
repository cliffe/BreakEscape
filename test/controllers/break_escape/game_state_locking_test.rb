require 'test_helper'

module BreakEscape
  # Every controller action that reads and then writes player_state must hold
  # the row lock, because player_state is a single JSON column: two concurrent
  # actions each load the record, mutate their own copy and save the whole
  # column, so the later save discards the earlier one's changes entirely.
  #
  # This is not theoretical. One ink line can fire #complete_task,
  # #complete_task and #give_item together, and the client sends those as three
  # parallel POSTs. The two task writes held the lock; the inventory add did
  # not, read player_state before them and saved after, dropping both. Game
  # 1022 lost seven tasks that way, one of which was an ending gate at the time,
  # so the mission could never conclude -- and all three requests returned 200.
  #
  # A test that exercised this by racing real threads would be flaky and would
  # only catch the actions it happened to name. This reads the controller
  # instead and holds the whole surface to the rule, so an action added later
  # that writes player_state fails here rather than in a playtest.
  class GameStateLockingTest < ActiveSupport::TestCase
    CONTROLLER = Rails.root.join('..', '..', 'app', 'controllers', 'break_escape',
                                 'games_controller.rb').cleanpath

    # Mutations that go through the model rather than touching player_state
    # directly. Each of these read-modify-writes the same column. Not listed:
    # end_claimed_sessions!, which takes the row lock itself (with_lock reloads).
    STATE_WRITERS = %w[
      save!
      add_inventory_item!
      remove_inventory_item!
      add_note!
      unlock_room!
      unlock_object!
      complete_task!
      skip_task!
      update_task_progress!
      process_flag_task_completions!
      add_item_to_room!
      remove_item_from_room!
      move_npc_to_room!
      remove_npc_from_scene!
      update_npc_state!
      reset_player_state!
      attempt_login!
      claim_login_session!
      logout_session!
      record_card_clone!
      plant_device!
      unplug_device!
      settle_session_at_keyboard!
    ].freeze

    # create builds a brand new record that nothing else can hold a reference
    # to yet, so there is nothing for it to race against.
    EXEMPT_ACTIONS = %w[create].freeze

    def source
      @source ||= File.read(CONTROLLER)
    end

    # The action names listed on the `around_action :with_game_lock` line.
    def locked_actions
      line = source[/around_action :with_game_lock, only: \[(.*?)\]/m, 1]
      refute_nil line, 'could not find the with_game_lock around_action declaration'
      line.scan(/:(\w+)/).flatten
    end

    # Public controller actions, in source order, with their bodies.
    def action_bodies
      offsets = source.enum_for(:scan, /^    def ([a-z_][a-z_0-9?!]*)(?:\(|$)/)
                      .map { [Regexp.last_match.begin(0), Regexp.last_match(1)] }
      offsets.each_with_index.map do |(start, name), i|
        finish = offsets[i + 1]&.first || source.length
        [name, source[start...finish]]
      end
    end

    # The private helpers, by name, with their bodies.
    def helper_bodies
      private_at = source.index(/^    private$/) || source.length
      action_bodies.select { |_name, body| source.index(body) > private_at }.to_h
    end

    # An action's body with the bodies of every private helper it calls, followed
    # through helpers that call helpers. A write made in a helper (container's
    # render_login_desktop settles a session) is the action's write.
    def body_with_helpers(body, helpers = helper_bodies, seen = {})
      helpers.each do |name, helper|
        next if seen[name] || !body.match?(/(?<![\w.])#{Regexp.escape(name)}(?![\w?!])/)

        seen[name] = true
        body += body_with_helpers(helper, helpers, seen)
      end
      body
    end

    # sync_state takes the row lock itself (a narrow `Game.lock.select(...)`
    # load inside a transaction) so it doesn't read scenario_data.
    def takes_own_lock?(body)
      body.match?(/Game\.transaction do\s.*Game\.lock\b/m)
    end

    test 'every action that writes player_state holds the game lock' do
      # Everything after the first private helper is a helper, not an action.
      private_at = source.index(/^    private$/) || source.length
      locked = locked_actions
      helpers = helper_bodies

      unlocked_writers = action_bodies.filter_map do |name, body|
        next if EXEMPT_ACTIONS.include?(name)
        next if source.index(body) > private_at
        next if locked.include?(name)
        next if takes_own_lock?(body)

        body = body_with_helpers(body, helpers)

        written = STATE_WRITERS.select { |w| body.include?("@game.#{w}") }
        written << 'player_state[...] =' if body =~ /@game\.player_state\[[^\]]+\]\s*=/
        next if written.empty?

        "#{name} (writes via #{written.join(', ')})"
      end

      assert_empty unlocked_writers,
                   "These controller actions write player_state without holding the row lock, so a " \
                   "concurrent write can silently discard theirs (or theirs another's):\n  " \
                   "#{unlocked_writers.join("\n  ")}\n" \
                   "Add them to the `around_action :with_game_lock, only: [...]` list."
    end

    test 'sync_state takes its own row lock' do
      body = action_bodies.to_h.fetch('sync_state')
      assert takes_own_lock?(body), 'sync_state must load the game with Game.lock inside a transaction'
      refute_includes locked_actions, 'sync_state', 'locking it twice would load scenario_data again'
    end

    # Guards the two that were actually found missing, so a future refactor of
    # the detection above cannot quietly stop covering them.
    test 'inventory and room are locked' do
      %w[inventory room].each do |action|
        assert_includes locked_actions, action,
                        "#{action} reads and writes player_state; without the lock a concurrent " \
                        'task completion is lost, which is how game 1022 lost talk_to_gary.'
      end
    end

    # Networks slice 9.3a (section 5). container serves a sign-in desktop, and one
    # served at the keyboard clears its session's foothold (settle_session_at_keyboard!,
    # in a private helper); network_plant writes footholds, the inventory and the
    # device's room; network_unplug writes footholds and the inventory and ends the
    # sessions opened through the foothold. Unlocked, a keyboard fetch racing an unplug
    # of the same foothold saves back either a session naming the gone foothold or a
    # duplicated device.
    test 'container, network_plant and network_unplug are locked' do
      %w[container network_plant network_unplug].each do |action|
        assert_includes locked_actions, action,
                        "#{action} writes footholds, sessions or the inventory; without the lock a " \
                        'concurrent plant, unplug or desktop fetch is lost.'
      end
    end

    test 'a write in a private helper counts as its action writing' do
      body = body_with_helpers(action_bodies.to_h.fetch('container'))
      assert_includes body, '@game.settle_session_at_keyboard!',
                      "container's desktop write is in render_login_desktop; the scan must follow helpers"
    end
  end
end
