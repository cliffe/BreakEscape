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
  # 1022 lost seven tasks that way, one of which was a requiresCompleted gate,
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
    # directly. Each of these read-modify-writes the same column.
    STATE_WRITERS = %w[
      save!
      add_inventory_item!
      remove_inventory_item!
      update_global_variables!
      add_note!
      unlock_room!
      unlock_object!
      complete_task!
      update_task_progress!
      process_flag_task_completions!
      add_item_to_room!
      remove_item_from_room!
      move_npc_to_room!
      remove_npc_from_scene!
      update_npc_state!
      reset_player_state!
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
      offsets = source.enum_for(:scan, /^    def ([a-z_][a-z_0-9]*)$/)
                      .map { [Regexp.last_match.begin(0), Regexp.last_match(1)] }
      offsets.each_with_index.map do |(start, name), i|
        finish = offsets[i + 1]&.first || source.length
        [name, source[start...finish]]
      end
    end

    test 'every action that writes player_state holds the game lock' do
      # Everything after the first private helper is a helper, not an action.
      private_at = source.index(/^    private$/) || source.length
      locked = locked_actions

      unlocked_writers = action_bodies.filter_map do |name, body|
        next if EXEMPT_ACTIONS.include?(name)
        next if source.index(body) > private_at
        next if locked.include?(name)

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

    # Guards the two that were actually found missing, so a future refactor of
    # the detection above cannot quietly stop covering them.
    test 'inventory and room are locked' do
      %w[inventory room].each do |action|
        assert_includes locked_actions, action,
                        "#{action} reads and writes player_state; without the lock a concurrent " \
                        'task completion is lost, which is how game 1022 lost talk_to_gary.'
      end
    end
  end
end
