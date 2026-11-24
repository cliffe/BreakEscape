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

    # The client posts targetType "item" for every object lock (as plain /unlock has always
    # read it: anything but "door" is an object). A lock call names the canonical type, in one
    # place: "item" is "object". Any other word is left as sent, and is refused as before.
    def lock_step_type(type)
      type.to_s == 'item' ? 'object' : type
    end

    # ---- POST /unlock ----

    # The object an unlock request names, resolved once ({ object:, path: }), or nil: for a door,
    # and for any scenario in which no object carries a step, so the old calls stay as they were.
    def lock_step_resolve(target_type, target_id)
      return nil if target_type == 'door'

      lock_step_resolve_id(target_id)
    end

    # The target an id names, as { object:, path: }, or nil when no object carries a step.
    # NOTE (unit 15 report): G4 for a scenario with no gated object would need a walk here too, but
    # a hand-built request for a KO'd NPC's unlocked briefcase is today answered 200
    # (npc_container_unlock_test) and Rule D has no KO-release leg, so G4 stays off until decided.
    def lock_step_resolve_id(id)
      return nil if @game.second_step_ids.empty?

      @game.resolve_unlock_target(id)
    end

    # True when the resolved target must be refused as an invented id is: it sits below a closed
    # gated container (Rule C), is a carried object that has left the player (Rule D) or is a gated
    # thing in a room the player has not opened.
    def lock_step_scope_refused?(resolved)
      return false unless resolved

      @game.behind_closed_step?(resolved[:path]) || !@game.carried_step_reachable?(resolved[:object], resolved[:path]) ||
        @game.step_room_unreached?(resolved[:object], resolved[:path])
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
      target_type = lock_step_type(target_type)
      info = lock_step_info(target_type, target_id, resolved)
      return false unless info

      opener = target_type == 'door' && method == 'npc' ? params[:attempt].to_s : nil
      gate = @game.lock_step_gate(target_type, target_id, method, resolved: resolved, opener: opener)
      if gate
        response.headers['Cache-Control'] = 'no-store'
        render json: gate
        return true
      end
      return false if lock_step_may_open?(info, method)

      render_lock_step_refusal
      true
    end

    # The open answer of a GATED lock names the lock it opened (the request's own canonical
    # targetType and targetId, as the /mfa answers echo them). An ungated lock gets nothing.
    def lock_step_open_echo(target_type, target_id, resolved)
      type = lock_step_type(target_type)
      return {} unless lock_step_info(type, target_id, resolved)

      { targetType: type, targetId: target_id }
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
      resolved = lock_step_resolve_id(container_id.to_s)
      return false unless resolved

      object = resolved[:object]
      lock_step_scope_refused?(resolved) ||
        (@game.second_step_ids.include?(object['id'].to_s) && !@game.step_object_open?(object))
    end

    # True when the object a response is about to SERVE must be refused as an invented id is: it
    # carries a step that is not open (an id-less one included), or sits below a closed step, or is
    # a carried object out of reach. Judged on the object itself, found by identity or its own id,
    # so a plain object that shares the gated one's name or id string opens nothing of it.
    def lock_step_served_refused?(object)
      return false if !object.is_a?(Hash) || @game.second_step_ids.empty?

      return true if BreakEscape::LockStepModel.lock_step(object) && !@game.step_object_open?(object)

      located = @game.locate_served_object(object)
      located ? lock_step_scope_refused?(located) : false
    end

    # True when an item the player asks to take sits below a closed step or has left the player's
    # reach. The item's own lock is no bar (a gated takeable may be carried closed).
    def lock_step_take_refused?(item)
      return false if !item.is_a?(Hash) || item['id'].to_s.empty?

      resolved = lock_step_resolve_id(item['id'].to_s)
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
      LOCK_TARGET_TYPES.include?(lock_step_type(type)) && id.is_a?(String) && !id.empty? ? :lock : :generic
    end

    def render_mfa_generic
      render json: { success: false, message: BreakEscape::Game::LOGIN_INCORRECT }, status: :unprocessable_entity
    end

    # Renders a lock action's answer exactly as the gate returns it: [body, status] (status :ok or
    # :unprocessable_entity) or one of :not_found, :no_phone, :no_device. The phone answer
    # ({ requests: [...] }) is rendered by mfa_lock_phone. Anything else fails closed as not found.
    #
    # The three POST routes pass echo: true, so a [body, status] answer (a valid target) names the
    # lock the request was for. The echo is the request's own targetType and targetId; a symbol
    # answer (not found, no phone, no device) stays exactly as before.
    def render_lock_step_answer(result, echo: false)
      case result
      when :no_phone then render json: { success: false, error: 'no such phone' }, status: :forbidden
      when :no_device then render json: { success: false, error: 'no such device' }, status: :forbidden
      when Array
        if result.length == 2 && result[0].is_a?(Hash) && %i[ok unprocessable_entity].include?(result[1])
          body = echo ? result[0].merge(targetType: lock_step_type(params[:target_type]), targetId: params[:target_id]) : result[0]
          render json: body, status: result[1]
        else
          render json: { success: false, error: 'not found' }, status: :not_found
        end
      else render json: { success: false, error: 'not found' }, status: :not_found
      end
    end

    def mfa_lock_verify
      code = params[:code].is_a?(String) ? params[:code] : ''
      result = with_game_lock { @game.verify_lock_code!(lock_step_type(params[:target_type]), params[:target_id], code) }
      render_lock_step_answer(result, echo: true)
    end

    def mfa_lock_prompt
      result = with_game_lock { @game.prompt_lock!(lock_step_type(params[:target_type]), params[:target_id]) }
      render_lock_step_answer(result, echo: true)
    end

    def mfa_lock_approve
      number = params[:number]
      number = Integer(number, 10) if number.is_a?(String) && number.match?(/\A\d{1,3}\z/)
      number = nil unless number.is_a?(Integer)
      deny = params[:deny] == true || params[:deny] == 'true'
      result = with_game_lock do
        @game.approve_lock!(lock_step_type(params[:target_type]), params[:target_id], number: number, deny: deny)
      end
      render_lock_step_answer(result, echo: true)
    end

    # GET /mfa/phone with target_type and target_id (both, valid): the one request of that lock
    # on a held phone. Without them the route is unchanged. Reads only.
    def mfa_lock_phone_named?
      params.key?(:target_type) || params.key?(:target_id)
    end

    def mfa_lock_phone
      npc_id = params[:npc_id]
      type = lock_step_type(params[:target_type])
      id = params[:target_id]
      valid = npc_id.is_a?(String) && !npc_id.empty? && !params.key?(:own) &&
              LOCK_TARGET_TYPES.include?(type) && id.is_a?(String) && !id.empty?
      return render_lock_step_answer(:no_phone) unless valid

      answer = @game.lock_phone_answer(type, id, npc_id)
      return render json: answer if answer.is_a?(Hash) && answer.key?(:requests)

      render_lock_step_answer(answer == :no_phone ? :no_phone : :not_found)
    end
  end
end
