module BreakEscape
  # Everything a host needs to score and report a game, computed from the saved
  # game (scenario_data, player_state and a few columns). No migration, nothing
  # stored: the figures are recounted each time, so they cannot drift from the
  # objectives the way the tasks_completed column can (see check_aim_completion).
  #
  #   game.score_breakdown
  #   # => { complete:, concluded_at:, ended:,
  #   #      objectives: { done:, total:, required_done:, required_total:,
  #   #                    optional_done:, optional_total:, skipped:, share: },
  #   #      aims: { done:, total: },
  #   #      result: nil | { percent:, report_rate:, stage:, recorded:, consistent: },
  #   #      verified: { done:, total:, required_missing: [task ids],
  #   #                  trusted_done:, trusted_total: },
  #   #      check_this:, timed:, ending_check:, raw_task_score:, mission_scoring: }
  #
  #   Game.score_breakdowns(relation)   # { game_id => breakdown }, fixed query count
  #   game.policy_score('completion')   # the number a Hacktivity listing policy writes
  #
  # Each game keeps its own scenario_data, so a game is counted against the
  # objectives it was started with, not the mission's current file.
  module ScoreBreakdown
    extend ActiveSupport::Concern

    # Task types complete_task! validates on the server before it records them.
    # enter_room (the client has discovered the room) and custom (ink tags) are
    # taken on the client's word, and so is any type not listed here.
    SERVER_CHECKED_TASK_TYPES = %w[collect_items unlock_room unlock_object npc_conversation submit_flags].freeze

    # Lock types whose unlock the server cannot check (validate_unlock trusts the
    # client for them). An unlock_room / unlock_object task on such a lock is
    # browser-trusted too. Key, lockpick, PIN, password and flag locks are checked.
    BROWSER_TRUSTED_LOCK_TYPES = %w[biometric bluetooth ble rfid].freeze

    POLICIES = %w[completion completion_objectives objectives awareness task_completion flags].freeze

    # Rank letter cut-offs (percent of objectives done), the same A-D bands the
    # game shell has always used for its score.
    RANK_BANDS = { 'A' => 90, 'B' => 75, 'C' => 50 }.freeze

    # One small jsonb per game: room id => lockType, plus every room object's
    # id, name and lockType. Lets the bulk path classify unlock tasks without
    # pulling the whole scenario_data (which holds every room).
    LOCKS_SQL = <<~SQL.squish.freeze
      (SELECT jsonb_build_object(
        'rooms', COALESCE((SELECT jsonb_object_agg(r.key, r.value->'lockType')
                           FROM jsonb_each(CASE WHEN jsonb_typeof(scenario_data->'rooms') = 'object'
                                                THEN scenario_data->'rooms' ELSE '{}'::jsonb END) r
                           WHERE jsonb_typeof(r.value) = 'object' AND r.value ? 'lockType'), '{}'::jsonb),
        'objects', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o->'id', 'name', o->'name', 'lockType', o->'lockType'))
                             FROM jsonb_each(CASE WHEN jsonb_typeof(scenario_data->'rooms') = 'object'
                                                  THEN scenario_data->'rooms' ELSE '{}'::jsonb END) r,
                                  jsonb_array_elements(CASE WHEN jsonb_typeof(r.value->'objects') = 'array'
                                                            THEN r.value->'objects' ELSE '[]'::jsonb END) o
                             WHERE jsonb_typeof(o) = 'object' AND o ? 'lockType'), '[]'::jsonb)))
    SQL

    BULK_COLUMNS = [
      :id, :mission_id, :mission_concluded_at, :status,
      :tasks_completed, :total_tasks, :objectives_completed, :total_aims
    ].freeze

    class_methods do
      # Breakdowns for many games at once: { game_id => breakdown }. One pluck of
      # the small columns and three jsonb sub-documents per game (never the whole
      # scenario_data) and one query for the missions, however many games.
      def score_breakdowns(relation)
        unless connection.adapter_name.match?(/postg/i)
          return relation.to_a.to_h { |game| [game.id, game.score_breakdown] }
        end

        rows = relation.reorder(nil).pluck(
          *BULK_COLUMNS,
          Arel.sql("scenario_data->'objectives'"),
          Arel.sql("player_state->'objectivesState'"),
          Arel.sql("player_state->'globalVariables'"),
          Arel.sql(LOCKS_SQL)
        )
        facts = mission_score_facts(rows.map { |row| row[1] }.uniq)

        rows.each_with_object({}) do |row, out|
          id, mission_id, concluded_at, status, tasks_completed, total_tasks, objectives_completed, total_aims,
            objectives, state, globals, locks = row
          out[id] = build_score_breakdown(
            objectives: objectives, objectives_state: state, globals: globals, locks: locks,
            concluded_at: concluded_at, status: status,
            counts: { tasks_completed: tasks_completed, total_tasks: total_tasks,
                      objectives_completed: objectives_completed, total_aims: total_aims },
            facts: facts[mission_id] || {}
          )
        end
      end

      # What a mission contributes to every one of its games' breakdowns, read
      # once per mission: { mission_id => facts }.
      def mission_score_facts(mission_ids)
        BreakEscape::Mission.where(id: mission_ids).index_by(&:id).transform_values(&:score_facts)
      end

      # room id => lockType, and object id / name => lockType, from a scenario's
      # rooms. The same shape LOCKS_SQL produces.
      def locks_from_rooms(rooms)
        locks = { 'rooms' => {}, 'objects' => [] }
        return locks unless rooms.is_a?(Hash)

        rooms.each do |room_id, room|
          next unless room.is_a?(Hash)

          locks['rooms'][room_id] = room['lockType'] if room.key?('lockType')
          Array(room['objects']).each do |object|
            next unless object.is_a?(Hash) && object.key?('lockType')

            locks['objects'] << { 'id' => object['id'], 'name' => object['name'], 'lockType' => object['lockType'] }
          end
        end
        locks
      end

      # :server when the server checks the task before recording it, :browser
      # when it takes the client's word. An unlock task counts as checked unless
      # its lock is one validate_unlock trusts the client for.
      def task_verification(task, locks)
        type = task['type'].to_s
        return :browser unless SERVER_CHECKED_TASK_TYPES.include?(type)

        lock_type = case type
        when 'unlock_room'
                      locks.dig('rooms', task['targetRoom'])
        when 'unlock_object'
                      ref = task['targetObject'].to_s
                      found = Array(locks['objects']).find { |o| ref.present? && [o['id'].to_s, o['name'].to_s].include?(ref) }
                      found && found['lockType']
        end
        BROWSER_TRUSTED_LOCK_TYPES.include?(lock_type.to_s) ? :browser : :server
      end

      # The pure maths behind score_breakdown, so the single-game and the bulk
      # path share it. objectives is the scenario's aim list, objectives_state
      # player_state['objectivesState'], globals player_state['globalVariables'].
      def build_score_breakdown(objectives:, objectives_state:, globals:, locks:, concluded_at:, status:, counts:, facts:)
        aims = objectives.is_a?(Array) ? objectives.select { |a| a.is_a?(Hash) } : []
        task_states = (objectives_state.is_a?(Hash) && objectives_state['tasks'].is_a?(Hash)) ? objectives_state['tasks'] : {}
        aim_states = (objectives_state.is_a?(Hash) && objectives_state['aims'].is_a?(Hash)) ? objectives_state['aims'] : {}
        globals = {} unless globals.is_a?(Hash)
        locks = { 'rooms' => {}, 'objects' => [] } unless locks.is_a?(Hash)
        concluded = concluded_at.present?

        counts_by = Hash.new(0)
        required_missing = []
        aims.each do |aim|
          Array(aim['tasks']).each do |task|
            next unless task.is_a?(Hash)

            optional = task['optional'] == true
            state = task_states.dig(task['taskId'], 'status')
            kind = task_verification(task, locks)
            counts_by[:total] += 1
            counts_by[optional ? :optional_total : :required_total] += 1
            counts_by[:skipped] += 1 if state == 'skipped'
            if state == 'completed'
              counts_by[:done] += 1
              counts_by[optional ? :optional_done : :required_done] += 1
            end
            if kind == :server
              counts_by[:verified_total] += 1
              counts_by[:verified_done] += 1 if state == 'completed'
              required_missing << task['taskId'] if !optional && !%w[completed skipped].include?(state)
            else
              counts_by[:trusted_total] += 1
              counts_by[:trusted_done] += 1 if state == 'completed'
            end
          end
        end

        total = counts_by[:total]
        raw = raw_score(counts[:tasks_completed], counts[:total_tasks], counts[:objectives_completed], counts[:total_aims])

        {
          complete: concluded,
          concluded_at: concluded_at,
          ended: status.to_s == 'completed' && !concluded,
          objectives: {
            done: counts_by[:done], total: total,
            required_done: counts_by[:required_done], required_total: counts_by[:required_total],
            optional_done: counts_by[:optional_done], optional_total: counts_by[:optional_total],
            skipped: counts_by[:skipped],
            share: total.zero? ? 0.0 : (counts_by[:done].to_f / total * 100).round(1)
          },
          aims: { done: aims.count { |a| aim_states.dig(a['aimId'], 'status') == 'completed' }, total: aims.size },
          result: build_result(globals, facts),
          verified: {
            done: counts_by[:verified_done], total: counts_by[:verified_total],
            required_missing: required_missing,
            trusted_done: counts_by[:trusted_done], trusted_total: counts_by[:trusted_total]
          },
          check_this: concluded && required_missing.any?,
          timed: facts[:timed] == true,
          ending_check: facts[:ending_check] != false,
          raw_task_score: raw,
          mission_scoring: facts[:scoring_mode] || 'tasks'
        }
      end

      # 70 x tasks/total + 30 x aims/total, from the stored counters. The default
      # ("objectives") score, and the figure shown before an ending, capped at 99.
      def raw_score(tasks_completed, total_tasks, objectives_completed, total_aims)
        total_tasks = total_tasks.to_i
        return 0.0 if total_tasks.zero?

        task_score = (tasks_completed.to_f / total_tasks) * 70
        aim_score = total_aims.to_i.positive? ? (objectives_completed.to_f / total_aims.to_i) * 30 : 0
        task_score + aim_score
      end

      # The number a Hacktivity listing policy writes to games.score, from a
      # breakdown alone (every policy but task_completion and flags, which need
      # the game and its VM set; Game#policy_score handles those).
      #   completion, completion_objectives  concluded: 100, else raw capped at 99
      #   objectives                         raw (today's default mode)
      #   awareness                          concluded (and pass mark met, if set): 100, else 0
      def policy_score_for(breakdown, policy, pass_percent: nil)
        case policy.to_s
        when 'completion', 'completion_objectives'
          breakdown[:complete] ? 100.0 : [breakdown[:raw_task_score], 99.0].min
        when 'objectives'
          breakdown[:raw_task_score]
        when 'awareness'
          passed = pass_percent.nil? || breakdown.dig(:result, :percent).to_f >= pass_percent.to_f
          breakdown[:complete] && passed ? 100.0 : 0.0
        else
          raise ArgumentError, "policy_score_for cannot score #{policy.inspect} from a breakdown"
        end
      end

      # A-D from the share of objectives done (0-100). Finished games are ranked
      # on this, not on the score, because every finisher scores 100 under the
      # completion policies.
      def rank_letter(percent)
        RANK_BANDS.each { |letter, floor| return letter if percent.to_f >= floor }
        'D'
      end

      private

      def build_result(globals, facts)
        name = facts[:result_global]
        return nil if name.blank?

        prefix = name.delete_suffix('percent')
        report_rate = number_or_nil(globals["#{prefix}reportRate"])
        stage = facts[:result_stage]
        percent = (number_or_nil(globals[name]) || 0).clamp(0, 100).round
        {
          percent: percent,
          report_rate: (report_rate || 0).clamp(0, 1).to_f,
          stage: stage,
          recorded: truthy?(globals["#{prefix}complete"]) || truthy?(globals["#{prefix}done"]),
          consistent: result_consistent(globals['se_awareness_records'], stage, percent)
        }
      end

      # Whether the percent the check wrote to its global equals the percent in
      # the latest se_awareness_records block for the same stage. nil when no
      # block exists to compare with (nothing recorded yet, or a mission that
      # does not write one).
      def result_consistent(records, stage, percent)
        return nil unless records.is_a?(Array) && stage.present?

        block = records.select { |b| b.is_a?(Hash) && b['stage'] == stage }.max_by { |b| b['at'].to_s }
        block ? block['percent'].to_f.round == percent : nil
      end

      def number_or_nil(value)
        return value.to_f if value.is_a?(Numeric)
        return nil unless value.is_a?(String) && value.strip.match?(/\A-?\d+(\.\d+)?\z/)

        value.to_f
      end

      def truthy?(value)
        value == true || value.to_s == 'true' || value == 1
      end
    end

    # The saved game's breakdown. See the module comment for the shape.
    #
    # Known limit: an unlock_room / unlock_object task counts as server-checked
    # unless its lock is biometric, bluetooth, ble or rfid. A task on a key, PIN,
    # password or flag lock can still be completed by another route the scenario
    # allows (an NPC unlock, a flag reward); player_state does not record which
    # method opened the lock, so that is not visible here.
    def score_breakdown
      self.class.build_score_breakdown(
        objectives: scenario_data.is_a?(Hash) ? scenario_data['objectives'] : nil,
        objectives_state: player_state.is_a?(Hash) ? player_state['objectivesState'] : nil,
        globals: player_state.is_a?(Hash) ? player_state['globalVariables'] : nil,
        locks: self.class.locks_from_rooms(scenario_data.is_a?(Hash) ? scenario_data['rooms'] : nil),
        concluded_at: mission_concluded_at, status: status,
        counts: { tasks_completed: tasks_completed, total_tasks: total_tasks,
                  objectives_completed: objectives_completed, total_aims: total_aims },
        facts: mission&.score_facts || {}
      )
    end

    # The number a listing policy writes to games.score. Hacktivity calls this so
    # the formulas live in one place. task_completion is the mission's own scoring
    # mode (calculate_task_score); flags is the VM set's score.
    def policy_score(policy, pass_percent: nil)
      case policy.to_s
      when 'task_completion' then calculate_task_score
      when 'flags' then (respond_to?(:vm_set) ? vm_set&.score : nil) || 0.0 # vm_set exists under Hacktivity only
      else self.class.policy_score_for(score_breakdown, policy, pass_percent: pass_percent)
      end
    end
  end
end
