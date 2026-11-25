# frozen_string_literal: true

require 'test_helper'
require 'minitest/mock'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # S8b unit 10: the helpdesk concern at model level, time frozen. Ria is the desk's NPC; Sam and
  # Lena are the accounts it can reset.
  class HelpdeskAccessTest < ActiveSupport::TestCase
    include HelpdeskAnswerShapes

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    SAM_RESET = 'Tern-Harbour-41'.freeze
    LENA_RESET = 'Quay-Lantern-77'.freeze
    EVENTS = %w[helpdesk_request account_password_reset account_mfa_reenrolled signin_fail signin_lockout].freeze

    def desk(overrides = {})
      { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no manager], 'minCorrect' => 2,
        'maxTries' => 3, 'resets' => %w[password mfa],
        'questionLabels' => { 'staff_no' => 'Staff number', 'manager' => 'Line manager' } }.merge(overrides)
    end

    def build(desk_overrides: {}, state: {}, sources: true)
      data = KS.scenario
      data['logSources'] = { 'desk' => { 'title' => 'Desk', 'events' => EVENTS } } if sources
      data['helpdesks'] = { 'it_desk' => desk(desk_overrides) }
      lobby_npcs = data['rooms']['lobby']['npcs']
      lobby_npcs << { 'id' => 'ria', 'displayName' => 'Ria Desk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 } }
      lobby_npcs.find { |n| n['id'] == 'sam' }['creds'].merge!(
        'resetPassword' => SAM_RESET, 'recovery' => { 'staff_no' => 'A-1042', 'manager' => 'Dana Pryce' }
      )
      lobby_npcs.find { |n| n['id'] == 'lena' }['creds'].merge!(
        'resetPassword' => LENA_RESET, 'recovery' => { 'staff_no' => 'B-2210', 'manager' => 'Kofi Adair' }
      )
      create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                         scenario: data,
                         player_state: { 'currentRoom' => 'lobby', 'encounteredNPCs' => %w[ria sam lena] }.merge(state))
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    RIGHT_SAM = { 'staff_no' => 'A-1042', 'manager' => 'Dana Pryce' }.freeze
    WRONG = { 'staff_no' => 'nope', 'manager' => 'nobody' }.freeze

    def ask(user: 'sokafor', what: 'password', answers: RIGHT_SAM, pc: nil, game: @game, desk_id: 'it_desk')
      game.request_helpdesk!(desk_id, user, what, answers, pc)
    end

    def rows(game = @game)
      game.log_rows_for('desk')
    end

    def sign_in_sam_at(pc_id, locked: false)
      @game.player_state['sessions'] = { pc_id => { 'id' => 'sam', 'locked' => locked } }
    end

    # --- the checks, in order -----------------------------------------------------------------

    test 'an unknown desk is not_found and writes nothing' do
      res = ask(desk_id: 'nope')
      assert_equal :not_found, res[:status]
      assert_equal({ reason: 'not_found' }, res[:body])
      assert_empty rows
      assert_empty @game.helpdesk_tries
    end

    test 'a desk NPC not yet met, or knocked out, is unavailable and counts nothing' do
      met = build(state: { 'encounteredNPCs' => %w[sam] })
      res = ask(game: met)
      assert_equal [:unprocessable_entity, { reason: 'unavailable' }], [res[:status], res[:body]]
      assert_empty met.helpdesk_tries

      ko = build(state: { 'npcHostility' => { 'ria' => { 'ko' => true } } })
      assert_equal 'unavailable', ask(game: ko)[:body][:reason]
      assert_empty rows(ko)
    end

    test 'an account-only desk NPC has no person behind it: unavailable and counts nothing' do
      game = build
      game.scenario_data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'ria' }['accountOnly'] = true
      res = ask(game: game)
      assert_equal [:unprocessable_entity, { reason: 'unavailable' }], [res[:status], res[:body]]
      assert_empty game.helpdesk_tries
    end

    test 'an earlier failure wins over a later one: unknown desk over the rest, unavailable over blocked' do
      @game.helpdesk_tries['it_desk|sokafor'] = { 'n' => 3, 'seq' => 1, 'stoppedAt' => T0.to_i }
      assert_equal 'not_found', ask(desk_id: 'nope', what: 'bogus', pc: 'invented')[:body][:reason]
      assert_equal 'unavailable', ask(what: 'bogus')[:body][:reason]
      assert_equal 'unavailable', ask(pc: 'invented')[:body][:reason]
      assert_equal 'blocked', ask[:body][:reason]
    end

    test 'pc_id cases: open and unlocked passes, locked, none, invented and a non sign-in id are unavailable' do
      sign_in_sam_at('sam_pc')
      assert_equal :ok, ask(pc: 'sam_pc')[:status]

      fresh = build
      fresh.player_state['sessions'] = { 'sam_pc' => { 'id' => 'sam', 'locked' => true } }
      assert_equal 'unavailable', ask(game: fresh, pc: 'sam_pc')[:body][:reason]
      assert_equal 'unavailable', ask(game: fresh, pc: 'lena_pc')[:body][:reason]
      assert_equal 'unavailable', ask(game: fresh, pc: 'no_such_pc')[:body][:reason]
      assert_equal 'unavailable', ask(game: fresh, pc: 'ian')[:body][:reason]
      bodies = [ask(game: fresh, pc: 'lena_pc')[:body], ask(game: fresh, pc: 'no_such_pc')[:body]]
      assert_equal bodies.first, bodies.last
      assert_equal :ok, ask(game: fresh)[:status]
    end

    test 'a reset the desk does not offer is unavailable' do
      game = build(desk_overrides: { 'resets' => %w[password] })
      assert_equal 'unavailable', ask(game: game, what: 'mfa')[:body][:reason]
      assert_empty game.helpdesk_tries
    end

    # --- refusals, the stop, the lift -----------------------------------------------------------

    test 'wrong answers and an unknown username give equal bodies and rows of the same shape' do
      known = ask(answers: WRONG)
      unknown = ask(user: 'nobody', answers: RIGHT_SAM)
      assert_equal known, unknown
      assert_equal({ reason: 'refused', triesLeft: 2 }, known[:body])
      assert_shape('helpdesk.refused', known)
      shapes = rows.map { |r| [r['event'], r['result'], r['detail']&.keys, r['as']&.keys] }
      assert_equal 2, shapes.size
      assert_equal shapes.first, shapes.last
    end

    test 'a password request for an account with no resetPassword is refused and counted like a wrong answer' do
      @game.scenario_data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'sam' }['creds'].delete('resetPassword')
      assert_equal({ reason: 'refused', triesLeft: 2 }, ask[:body])
      assert_equal :ok, ask(what: 'mfa')[:status]
    end

    test 'the stop at maxTries, blocked with retryIn, served again after 300 seconds with the count at 0' do
      assert_equal 2, ask(answers: WRONG)[:body][:triesLeft]
      assert_equal 1, ask(answers: WRONG)[:body][:triesLeft]
      last = ask(answers: WRONG)
      assert_equal({ reason: 'refused', triesLeft: 0 }, last[:body])
      assert_equal T0.to_i, @game.helpdesk_tries['it_desk|sokafor']['stoppedAt']

      travel_to T0 + 60
      blocked = ask
      assert_equal :unprocessable_entity, blocked[:status]
      assert_equal({ reason: 'blocked', retryIn: 240 }, blocked[:body])

      travel_to T0 + 299
      assert_equal 1, ask[:body][:retryIn]
      travel_to T0 + 300
      assert_equal :ok, ask[:status]
      assert_nil @game.helpdesk_tries['it_desk|sokafor']

      later = build
      3.times { ask(game: later, answers: WRONG) }
      travel_to T0 + 700
      assert_equal 2, ask(game: later, answers: WRONG)[:body][:triesLeft]
    end

    test 'a blocked desk asked twenty times stores ten blocked rows' do
      3.times { ask(answers: WRONG) }
      20.times { ask }
      blocked = rows.select { |r| r['result'] == 'blocked' }
      assert_equal 1, blocked.size
      assert_equal 10, blocked.first['n']
      assert_equal 10, @game.reload.log_rows_for('desk').find { |r| r['result'] == 'blocked' }['n']
    end

    test 'the stop is per username and per desk' do
      3.times { ask(answers: WRONG) }
      assert_equal :ok, ask(user: 'lfox', answers: { 'staff_no' => 'B-2210', 'manager' => 'Kofi Adair' })[:status]
    end

    test 'R2-SERVER1: two wrong, 200 other names, a third wrong is triesLeft 0 and the fourth blocked' do
      2.times { ask(answers: WRONG) }
      HelpdeskModel::TRIES_CAP.times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      assert_equal 0, ask(answers: WRONG)[:body][:triesLeft]
      assert_equal 'blocked', ask(answers: WRONG)[:body][:reason]
    end

    test 'R2-SERVER1: no live entry is ever dropped; the table of one desk stops at 200 names' do
      ask(answers: WRONG)
      (HelpdeskModel::TRIES_CAP + 5).times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      keys = @game.helpdesk_tries.keys
      assert_equal HelpdeskModel::TRIES_CAP, keys.size
      assert_includes keys, 'it_desk|sokafor'
      assert_includes keys, 'it_desk|ghost0'
      refute_includes keys, "it_desk|ghost#{HelpdeskModel::TRIES_CAP + 4}"
    end

    test 'R2-SERVER1: a count is forgotten after five quiet minutes, an account and a non-account alike' do
      2.times { ask(answers: WRONG) }
      2.times { ask(user: 'nobody', answers: WRONG) }
      travel_to T0 + 299
      assert_equal 0, ask(user: 'nobody', answers: WRONG)[:body][:triesLeft]
      travel_to T0 + 301
      assert_equal 2, ask(answers: WRONG)[:body][:triesLeft], 'the account count lapsed'
      travel_to T0 + 299 + 300
      assert_equal 2, ask(user: 'nobody', answers: WRONG)[:body][:triesLeft], 'the stop of a non-account lapsed'
    end

    test 'R2-SERVER1: a refusal renews the quiet time, so a slow guesser is still counted' do
      ask(answers: WRONG)
      travel_to T0 + 200
      ask(answers: WRONG)
      travel_to T0 + 450
      assert_equal 0, ask(answers: WRONG)[:body][:triesLeft]
    end

    test 'R2-SERVER1: a full table answers a new name blocked with the time to the soonest spent entry, account or not' do
      HelpdeskModel::TRIES_CAP.times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      travel_to T0 + 100
      # a new account name and a new non-account name meet the same full table
      fresh = ask(user: 'lfox', answers: WRONG)
      none = ask(user: 'zzz', answers: WRONG)
      assert_equal({ reason: 'blocked', retryIn: 200 }, fresh[:body])
      assert_equal fresh, none
      travel_to T0 + 300
      assert_equal 'refused', ask(user: 'lfox', answers: WRONG)[:body][:reason]
    end

    test 'R3-CORE1: at a full desk a name with no entry is blocked whatever its answers, account or not, and served once an entry lapses' do
      HelpdeskModel::TRIES_CAP.times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      5.times { assert_equal 'blocked', ask(answers: WRONG)[:body][:reason] }
      assert_equal 'blocked', ask(answers: RIGHT_SAM)[:body][:reason]
      assert_equal 'blocked', ask(what: 'mfa', answers: RIGHT_SAM)[:body][:reason]
      assert_equal ask(answers: RIGHT_SAM), ask(user: 'zzz', answers: RIGHT_SAM), 'account and non-account alike'
      assert_empty @game.account_resets
      refute @game.helpdesk_tries.key?('it_desk|sokafor'), 'nothing was counted for the name'
      travel_to T0 + HelpdeskModel::DESK_STOP_SECONDS
      assert_equal :ok, ask(answers: RIGHT_SAM)[:status]
    end

    test 'R3-CORE1: a name that already has an entry is still judged at a full desk' do
      ask(answers: WRONG)
      (HelpdeskModel::TRIES_CAP - 1).times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      assert_equal 1, ask(answers: WRONG)[:body][:triesLeft]
      assert_equal :ok, ask(answers: RIGHT_SAM)[:status]
    end

    test 'R3-CORE2: an entry with no time is treated as last touched on first request, so it lapses and 200 of them do not stop the desk for good' do
      HelpdeskModel::TRIES_CAP.times { |i| @game.helpdesk_tries["it_desk|old#{i}"] = { 'n' => 2, 'seq' => i } }
      @game.helpdesk_tries['it_desk|sokafor'] = { 'n' => 2 }
      @game.save!
      assert_equal 'blocked', ask(user: 'newname', answers: WRONG)[:body][:reason]
      assert_equal 0, ask(answers: WRONG)[:body][:triesLeft], 'the count it had is kept, not reset'
      travel_to T0 + HelpdeskModel::DESK_STOP_SECONDS
      res = ask(user: 'newname', answers: WRONG)
      assert_equal 2, res[:body][:triesLeft], 'they lapsed five minutes after first being seen'
    end

    test 'R2-SERVER1: the cap is per desk' do
      @game.scenario_data['helpdesks']['id_desk'] = desk
      HelpdeskModel::TRIES_CAP.times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      assert_equal 'blocked', ask(user: 'late', answers: WRONG)[:body][:reason]
      assert_equal 'refused', ask(user: 'late', answers: WRONG, desk_id: 'id_desk')[:body][:reason]
    end

    test 'R2-SERVER1: a stopped name is never dropped by other names; a stop that has run out is' do
      3.times { ask(answers: WRONG) }
      (HelpdeskModel::TRIES_CAP + 5).times { |i| ask(user: "ghost#{i}", answers: WRONG) }
      assert_equal 'blocked', ask(answers: WRONG)[:body][:reason]
      travel_to T0 + HelpdeskModel::DESK_STOP_SECONDS + 1
      assert_equal 'refused', ask(user: 'newcomer', answers: WRONG)[:body][:reason]
      refute_includes @game.helpdesk_tries.keys, 'it_desk|sokafor'
    end

    # R1-SERVER4: the rule is evaluated for every name, account or not
    test 'the rule runs once for an account and once for a name that is not one' do
      calls = []
      real = HelpdeskModel.method(:rule_met?)
      HelpdeskModel.stub(:rule_met?, ->(*args) { calls << args.last; real.call(*args) }) do
        ask(user: 'sokafor', answers: WRONG)
        ask(user: 'nobody', answers: WRONG)
      end
      assert_equal [WRONG, WRONG], calls
    end

    test 'the callback rule looks for a phone for an account and for a name that is not one' do
      game = build(desk_overrides: { 'verify' => 'callback', 'questions' => [] })
      asked = []
      game.define_singleton_method(:held_friendface_phone) { |id| asked << id; nil }
      ask(game: game, user: 'sokafor')
      ask(game: game, user: 'nobody')
      assert_equal %w[sam nobody], asked
    end

    test 'R1-SERVER5: approve_second_step does not take an own-phone approval unless the caller says so' do
      params = Game.instance_method(:approve_second_step).parameters
      assert_includes params, %i[key own_form]
      map = { 'sam_pc' => { 'id' => 'sam_pc', 'kind' => 'push', 'at' => T0.to_i, 'n' => 0, 'tries' => 0 } }
      res = @game.send(:approve_second_step, map, 'sam_pc', { kind: 'pc', id: 'sam_pc' }, npc_id: 'sam', reenrolled: true)
      assert_equal :no_phone, res
      assert map.key?('sam_pc')
    end

    # --- the rules ------------------------------------------------------------------------------

    test 'the questions rule honours minCorrect and normalises answers' do
      game = build(desk_overrides: { 'minCorrect' => 1 })
      assert_equal :ok, ask(game: game, answers: { 'staff_no' => '  a-1042 ' })[:status]
      two = build
      assert_equal 'refused', ask(game: two, answers: { 'staff_no' => 'A-1042' })[:body][:reason]
      assert_equal 'refused', ask(game: two, answers: { 'staff_no' => 'A-1042', 'other' => 'Dana Pryce' })[:body][:reason]
      assert_equal 'refused', ask(game: two, answers: 'not a hash')[:body][:reason]
    end

    test 'the none rule always holds for an account, and never for a non-account' do
      game = build(desk_overrides: { 'verify' => 'none', 'questions' => [] })
      assert_equal :ok, ask(game: game, answers: {})[:status]
      assert_equal 'refused', ask(game: game, user: 'nobody', answers: {})[:body][:reason]
    end

    test 'the callback rule needs the account owner phone held' do
      game = build(desk_overrides: { 'verify' => 'callback', 'questions' => [] })
      assert_equal 'refused', ask(game: game)[:body][:reason]
      game.scenario_data['rooms']['lobby']['objects'] << { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam', 'takeable' => true }
      game.player_state['inventory'] = [{ 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam' }]
      game.define_singleton_method(:declared_friendface_phones) { [{ 'id' => 'sam_phone', 'type' => 'phone_friendface', 'owner' => 'sam' }] }
      assert_equal :ok, ask(game: game)[:status]
    end

    # --- grants ---------------------------------------------------------------------------------

    test 'a password grant answers the password, clears that account lockout at two PCs and leaves another' do
      @game.player_state['loginFailures'] = { 'sam_pc|sokafor' => { 'n' => 2, 'seq' => 1 }, 'jake_pc|sokafor' => { 'n' => 1, 'seq' => 2 },
                                              'sam_pc|lfox' => { 'n' => 1, 'seq' => 3 } }
      @game.player_state['loginLockouts'] = %w[sam_pc|sokafor jake_pc|sokafor sam_pc|lfox]
      ask(answers: WRONG)
      res = ask
      assert_equal :ok, res[:status]
      assert_equal({ granted: true, what: 'password', password: SAM_RESET, lockoutPcIds: %w[sam_pc], npcId: 'sam', deskId: 'it_desk' }, res[:body])
      assert_equal %w[sam_pc|lfox], @game.player_state['loginLockouts']
      assert_equal %w[sam_pc|lfox], @game.player_state['loginFailures'].keys
      assert_equal({ 'password' => true }, @game.account_resets['sam'])
      assert_nil @game.helpdesk_tries['it_desk|sokafor']
      assert_equal %w[helpdesk_request helpdesk_request account_password_reset], rows.map { |r| r['event'] }
    end

    test 'a second factor grant zeroes wrong, removes closedAt and leaves lockouts' do
      @game.player_state['mfaAccounts'] = { 'sam' => { 'wrong' => 4, 'closedAt' => 12 } }
      @game.player_state['loginLockouts'] = %w[sam_pc|sokafor]
      res = ask(what: 'mfa')
      assert_equal({ granted: true, what: 'mfa', npcId: 'sam', deskId: 'it_desk' }, res[:body])
      assert_equal({ 'wrong' => 0 }, @game.player_state['mfaAccounts']['sam'])
      assert_equal %w[sam_pc|sokafor], @game.player_state['loginLockouts']
      assert_equal({ 'mfa' => true }, @game.account_resets['sam'])
      assert_equal %w[helpdesk_request account_mfa_reenrolled], rows.map { |r| r['event'] }
      assert_equal 'ria', rows.last['detail']['agent']
    end

    test 'a repeat of a grant gives the same body, writes and logs nothing, and keeps a lockout earned since' do
      first = ask
      before = rows.size
      @game.player_state['loginLockouts'] = %w[sam_pc|sokafor]
      @game.player_state['loginFailures'] = { 'sam_pc|sokafor' => { 'n' => 3, 'seq' => 1 } }
      again = ask
      assert_equal first[:body].except(:lockoutPcIds), again[:body].except(:lockoutPcIds)
      assert_equal %w[sam_pc], again[:body][:lockoutPcIds]
      assert_equal before, rows.size
      assert_equal %w[sam_pc|sokafor], @game.player_state['loginLockouts']
      assert_equal 3, @game.player_state['loginFailures']['sam_pc|sokafor']['n']
    end

    test 'the lockout keys of an account are found by normalised username' do
      @game.player_state['loginFailures'] = { 'a|sokafor' => {}, 'b|lfox' => {}, 'oddkey' => {} }
      @game.player_state['loginLockouts'] = ['c|sokafor', 'a|sokafor', 7]
      sam = @game.scenario_room_npc('sam')
      assert_equal %w[a|sokafor c|sokafor], @game.login_lockout_keys_for(sam).sort
    end

    test 'effective_password, note_typed_sign_in! and the keyring entries follow the reset' do
      sam = @game.scenario_room_npc('sam')
      assert_equal NS::SAM_PASSWORD, @game.effective_password(sam)
      @game.note_typed_sign_in!('sam')
      assert_empty @game.account_resets
      assert_empty @game.helpdesk_keyring_entries
      ask(what: 'mfa')
      assert_equal NS::SAM_PASSWORD, @game.effective_password(sam)
      assert_empty @game.helpdesk_keyring_entries
      ask
      assert_equal SAM_RESET, @game.effective_password(sam)
      assert_equal NS::LENA_PASSWORD, @game.effective_password(@game.scenario_room_npc('lena'))
      entries = @game.helpdesk_keyring_entries
      assert_equal 1, entries.size
      assert_answer_shape('keyring.reset_entry', Shaped.new(200, entries.first))
      refute @game.account_resets['sam']['typed']
      @game.note_typed_sign_in!('sam')
      assert @game.account_resets['sam']['typed']
    end

    test 'non-Hash state is replaced by the accessors' do
      @game.player_state['accountResets'] = 'x'
      @game.player_state['helpdeskTries'] = []
      assert_equal({}, @game.account_resets)
      assert_equal({}, @game.helpdesk_tries)
      refute @game.account_reset?('sam', 'password')
    end

    # --- reading never writes ---------------------------------------------------------------------

    test 'every public reader leaves a game with no helpdesk state unchanged' do
      game = build
      before = Marshal.load(Marshal.dump(game.player_state))
      sam = game.scenario_room_npc('sam')
      game.save!
      readers = {
        account_reset: -> { game.account_reset?('sam', 'password') },
        effective_password: -> { game.effective_password(sam) },
        lockout_keys: -> { game.login_lockout_keys_for(sam) },
        note_typed: -> { game.note_typed_sign_in!('sam') },
        forms: -> { game.helpdesk_forms_for_client },
        keyring: -> { game.helpdesk_keyring_entries }
      }
      readers.each do |name, call|
        call.call
        assert_equal before, game.player_state, "#{name} changed player_state"
        refute game.changed?, "#{name} marked the game changed"
      end
    end

    test 'refused-before-counting requests create no state keys' do
      game = build
      before = Marshal.load(Marshal.dump(game.player_state))
      ask(game: game, desk_id: 'nope')
      ask(game: game, what: 'bogus')
      assert_equal before, game.reload.player_state
    end

    test 'non-Hash state under the keys is treated as empty by readers and does not raise' do
      game = build(state: { 'accountResets' => 'forged', 'helpdeskTries' => [1] })
      before = Marshal.load(Marshal.dump(game.player_state))
      sam = game.scenario_room_npc('sam')
      refute game.account_reset?('sam', 'password')
      assert_equal NS::SAM_PASSWORD, game.effective_password(sam)
      assert_nil game.note_typed_sign_in!('sam')
      assert_empty game.helpdesk_keyring_entries
      assert_equal before, game.player_state
    end

    # --- hostile input and what never leaves ------------------------------------------------------

    test 'a hostile username and answers are cut, cleaned, echoed nowhere and stored only as the normalised key' do
      hostile = "<script>alert(1)</script>\u0000\n#{'x' * 300}"
      res = ask(user: hostile, answers: { 'staff_no' => 'y' * 500, 'manager' => "<b>\u0007" })
      assert_equal({ reason: 'refused', triesLeft: 2 }, res[:body])
      refute_includes res.to_json, 'script'
      key = @game.helpdesk_tries.keys.first
      assert_equal 'it_desk|', key[0, 8]
      assert_operator key.partition('|').last.length, :<=, 64
      refute_match(/[[:cntrl:]]/, key)
      row = rows.first
      assert_operator row['as'].values.first.to_s.length, :<=, 64
      refute_includes rows.to_json, 'y' * 20
      assert_equal :unprocessable_entity, ask(user: "\u0000\u0001")[:status]
    end

    test 'refusals carry nothing of the answers, the recovery values or the reset password' do
      bodies = [ask(answers: WRONG), ask(user: 'zz', answers: RIGHT_SAM)].map { |r| r[:body].to_json }
      3.times { ask(answers: WRONG) }
      bodies << ask[:body].to_json
      bodies.each do |text|
        [SAM_RESET, 'A-1042', 'Dana Pryce', 'sokafor', 'nope'].each { |s| refute_includes text, s }
      end
    end

    test 'forms for the client carry three keys per desk and nothing of the rule or the answers' do
      forms = @game.helpdesk_forms_for_client
      assert_equal %w[npc questionLabels resets], forms['it_desk'].keys.sort
      assert_answer_shape('bootstrap.helpdesk_forms', Shaped.new(200, forms))
      text = forms.to_json
      [SAM_RESET, LENA_RESET, 'A-1042', 'minCorrect', 'maxTries', 'verify'].each { |s| refute_includes text, s }
      plain = KS.scenario
      assert_nil create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                    scenario: plain).helpdesk_forms_for_client
    end

    test 'the helpdesk secret source holds every resetPassword and refuses it in a stored row' do
      assert_equal [SAM_RESET, LENA_RESET].sort, OpsLog.secret_sources[:helpdesk].call(@game).sort
      assert_includes OpsLog.secret_values(@game), SAM_RESET
      refute_includes OpsLog.secret_values(@game), 'A-1042'
      # a desk whose id is a reset password resolves, so the guard (not the registry) refuses the row
      @game.scenario_data['helpdesks'][SAM_RESET] = desk
      assert_raises(OpsLog::SecretInRow) do
        @game.write_log_row!('helpdesk_request', as: { typed: 'x' }, where: { kind: 'desk', id: SAM_RESET }, result: 'granted', detail: { what: 'password' })
      end
      @game.scenario_data['helpdesks'].delete(SAM_RESET)
      # a real run leaves neither reset password in any stored row
      ask
      ask(user: 'lfox', answers: { 'staff_no' => 'B-2210', 'manager' => 'Kofi Adair' })
      assert_nil OpsLog.row_secret_hit(@game, rows.first)
      rows.each { |row| assert_nil OpsLog.row_secret_hit(@game, row) }
      refute_includes rows.to_json, SAM_RESET
    end

    test 'no log source: grants still work and write no rows' do
      game = build(sources: false)
      assert_equal :ok, ask(game: game)[:status]
      assert_empty game.log_rows_for('desk')
    end

    Shaped = Struct.new(:status, :parsed_body)

    # Checks a concern answer against the shared answer shape of that name
    def assert_shape(name, res)
      assert_answer_shape(name, Shaped.new(Rack::Utils::SYMBOL_TO_STATUS_CODE[res[:status]], JSON.parse(res[:body].to_json)))
    end

    test 'the answers this concern produces match the shared shapes' do
      assert_shape('helpdesk.not_found', ask(desk_id: 'nope'))
      assert_shape('helpdesk.unavailable', ask(pc: 'invented'))
      assert_shape('helpdesk.refused', ask(answers: WRONG))
      assert_shape('helpdesk.refused_last', (ask(answers: WRONG) && ask(answers: WRONG)))
      assert_shape('helpdesk.blocked', ask)
      other = build
      assert_shape('helpdesk.granted_password', ask(game: other))
      assert_shape('helpdesk.granted_mfa', ask(game: other, what: 'mfa'))
    end
  end
end
