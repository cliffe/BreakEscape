# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c unit 14): the controller's share. Every helper GamesController
  # needs for the gate on POST /unlock, the lock form of the /mfa/* routes and the exits that
  # must refuse a gated object are here, so GamesController gains only short calls.
  #
  # Nothing here decides a pass: the decisions are the Game concerns (LockSecondStep,
  # LockStepGate, LockStepReach). A scenario with no `secondStep` never reaches any of this
  # past its first line.
  module LockStepRequests
    LOCK_TARGET_TYPES = %w[object door].freeze
    LOCK_STEP_REFUSAL = { success: false, message: 'Invalid attempt' }.freeze

    private

    # ---- POST /unlock ----

    # The object an unlock request names, resolved once ({ object:, path: }), or nil: for a door,
    # and for any scenario in which no object carries a step, so the old calls stay as they were.
    def lock_step_resolve(target_type, target_id)
      return nil if target_type == 'door' || @game.second_step_ids.empty?

      @game.resolve_unlock_target(target_id)
    end

    # True when the resolved target must be refused as an invented id is: it sits below a closed
    # gated container (Rule C) or is a carried object that has left the player (Rule D).
    def lock_step_scope_refused?(resolved)
      return false unless resolved

      @game.behind_closed_step?(resolved[:path]) || !@game.carried_step_reachable?(resolved[:object], resolved[:path])
    end

    # Rule B for a gated target, else today's test (used for the rfid `alreadyOpen` flag)
    def lock_step_already_open?(target_type, target_id, resolved)
      return @game.room_unlocked?(target_id) if target_type == 'door'
      return @game.step_object_open?(resolved[:object]) if lock_step_gated_object?(resolved)

      @game.object_unlocked?(target_id)
    end

    def lock_step_gated_object?(resolved)
      resolved && @game.second_step_ids.include?(resolved[:object]['id'].to_s)
    end

    # The refusal an invented id gets from POST /unlock (no feedback, no reason, no row)
    def render_lock_step_refusal
      render json: LOCK_STEP_REFUSAL, status: :unprocessable_entity
    end

    # The gate, before the transaction. Renders and answers true when the request is stopped:
    # the gate answer (200, no-store) or, failing closed, the refusal of a gated lock whose
    # step has neither passed nor been skipped by the server. Answers false to go on and open.
    def lock_step_gate_rendered?(target_type, target_id, method, resolved)
      info = lock_step_info(target_type, target_id, resolved)
      return false unless info

      gate = @game.lock_step_gate(target_type, target_id, method, resolved: resolved)
      if gate
        response.headers['Cache-Control'] = 'no-store'
        render json: gate
        return true
      end
      return false if lock_step_may_open?(info, method)

      render_lock_step_refusal
      true
    end

    # lock_step_for for the lock this request names, or nil when it has no step
    def lock_step_info(target_type, target_id, resolved)
      if target_type == 'door'
        @game.lock_step_for('door', target_id)
      elsif lock_step_gated_object?(resolved)
        @game.lock_step_for('object', resolved[:object]['id'])
      end
    end

    # The gate answered nil: open only when the lock is already open, its step has passed, or
    # the server accepts the flag reward. Anything else is a gate that did not run.
    def lock_step_may_open?(info, method)
      return true if info[:object] ? @game.step_object_open?(info[:object]) : @game.room_unlocked?(info[:subject][:id])

      rec = @game.lock_steps_map[info[:key]]
      return true if rec.is_a?(Hash) && rec['passed'] == true

      method == 'flag_reward' && (info[:object].nil? || @game.send(:flag_reward_unlocks_object?, info[:object]))
    end

    # In the transaction: a gated object opens through record_step_open!, never unlock_object!
    def lock_step_open_object!(resolved, method, target_id)
      return @game.unlock_object!(target_id) unless lock_step_gated_object?(resolved)

      object = resolved[:object]
      return if @game.step_object_open?(object)

      key = @game.lock_step_for('object', object['id'])[:key]
      rec = @game.lock_steps_map[key]
      unless rec.is_a?(Hash) && rec['passed'] == true
        # Only a flag reward the server accepted (lock_step_may_open? has judged it)
        @game.lock_steps_map[key] = { 'passed' => true } if method == 'flag_reward'
      end
      @game.record_step_open!(object)
    end

    # In the transaction, before unlock_room! saves: a gated door's record goes with the open
    def lock_step_clear_door_record(target_id)
      info = @game.lock_step_for('door', target_id)
      @game.lock_steps_map.delete(info[:key]) if info
    end

    # ---- GET /container and take from a container ----

    # True when the object an id names must be refused as an invented id is (Rules C and D, or a
    # gated object whose step is not open). Reads only.
    def lock_step_container_refused?(container_id)
      return false if @game.second_step_ids.empty?

      resolved = @game.resolve_unlock_target(container_id.to_s)
      return false unless resolved

      object = resolved[:object]
      lock_step_scope_refused?(resolved) ||
        (@game.second_step_ids.include?(object['id'].to_s) && !@game.step_object_open?(object))
    end

    # True when an item the player asks to take sits below a closed step or has left the player's
    # reach. The item's own lock is no bar (a gated takeable may be carried closed).
    def lock_step_take_refused?(item)
      return false if @game.second_step_ids.empty? || !item.is_a?(Hash) || item['id'].to_s.empty?

      resolved = @game.resolve_unlock_target(item['id'].to_s)
      lock_step_scope_refused?(resolved)
    end

    # ---- /mfa/* ----

    # :lock when the request names a lock (target_type object or door, and a target_id, and no
    # pc_id), :pc when it is today's PC form, :generic for anything else (both forms, neither
    # half-named). The PC form is judged exactly as before.
    def mfa_form
      has_target = params.key?(:target_type) || params.key?(:target_id)
      pc_id = params[:pc_id]
      return :pc if pc_id.is_a?(String) && !pc_id.empty? && !has_target
      return :generic if params.key?(:pc_id)

      type = params[:target_type]
      id = params[:target_id]
      LOCK_TARGET_TYPES.include?(type) && id.is_a?(String) && !id.empty? ? :lock : :generic
    end

    def render_mfa_generic
      render json: { success: false, message: BreakEscape::Game::LOGIN_INCORRECT }, status: :unprocessable_entity
    end

    # Renders a lock action's answer: [body, status], { body:, status: } or a symbol. Always
    # no-store (the caller sets the header first).
    def render_lock_step_answer(result)
      case result
      when :no_phone then render json: { success: false, error: 'no such phone' }, status: :forbidden
      when :no_device then render json: { success: false, error: 'no such device' }, status: :forbidden
      when Array then render json: result[0], status: result[1]
      when Hash
        if result.key?(:body)
          render json: result[:body], status: result[:status] || :ok
        else
          render json: result
        end
      else render json: { success: false, error: 'not found' }, status: :not_found
      end
    end

    def mfa_lock_verify
      code = params[:code].is_a?(String) ? params[:code] : ''
      result = with_game_lock { @game.verify_lock_code!(params[:target_type], params[:target_id], code) }
      render_lock_step_answer(result)
    end

    def mfa_lock_prompt
      result = with_game_lock { @game.prompt_lock!(params[:target_type], params[:target_id]) }
      render_lock_step_answer(result)
    end

    def mfa_lock_approve
      number = params[:number]
      number = Integer(number, 10) if number.is_a?(String) && number.match?(/\A\d{1,3}\z/)
      number = nil unless number.is_a?(Integer)
      deny = params[:deny] == true || params[:deny] == 'true'
      result = with_game_lock do
        @game.approve_lock!(params[:target_type], params[:target_id], number: number, deny: deny)
      end
      render_lock_step_answer(result)
    end

    # GET /mfa/phone with target_type and target_id (both, valid): the one request of that lock
    # on a held phone. Without them the route is unchanged. Reads only.
    def mfa_lock_phone_named?
      params.key?(:target_type) || params.key?(:target_id)
    end

    def mfa_lock_phone
      npc_id = params[:npc_id]
      type = params[:target_type]
      id = params[:target_id]
      valid = npc_id.is_a?(String) && !npc_id.empty? && !params.key?(:own) &&
              LOCK_TARGET_TYPES.include?(type) && id.is_a?(String) && !id.empty?
      return render_lock_step_answer(:no_phone) unless valid

      render_lock_step_answer(lock_phone_call(npc_id, type, id))
    end

    # unit 13's brief names the owner first, the stub types first: follow the parameter names
    def lock_phone_call(npc_id, type, id)
      params_of = @game.method(:lock_phone_answer).parameters
      if params_of.first && params_of.first[1].to_s == 'npc_id'
        @game.lock_phone_answer(npc_id, type, id)
      elsif params_of.any? { |kind, _name| %i[key keyreq keyrest].include?(kind) }
        @game.lock_phone_answer(type, id, npc_id: npc_id)
      else
        @game.lock_phone_answer(type, id, npc_id)
      end
    end
  end
end
