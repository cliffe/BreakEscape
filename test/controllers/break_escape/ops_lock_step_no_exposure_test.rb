require 'test_helper'
require_relative 'ops_lock_step_scenario_test'

module BreakEscape
  # Ops S8c unit 26: every answer of a whole run of scenarios/test_ops_lock_step (the beats of
  # PLAYTEST.md through the real routes, from OpsLockStepRun#play_whole_run) is read for what must
  # never reach the browser: a password, a PIN, a code outside GET mfa/device, a mark for the right
  # number, the four server state keys, and a gated object's contents before its pass. The readable
  # notes of the scenario hold the first factors on purpose and are left out of the scan.
  class OpsLockStepNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLockStepRun

    CONTENT_OWNER = { 'records_note' => 'moira_pc', 'audit_zip' => nil, 'audit_extract' => 'audit_zip',
                      'locker_memo' => 'moira_locker', 'safe_memo' => 'priya_safe', 'cabinet_memo' => 'dana_cabinet',
                      'board_minutes' => 'gordon_briefcase', 'records_memo' => 'records_room',
                      'plant_memo' => 'plant_room' }.freeze
    MARKS = /\A(right|correct|answer|isRight|rightNumber|match|matches)\z/i.freeze

    setup do
      travel_to OpsLockStepRun::T0
      build_lock_step_game
      @all_answers = play_whole_run
      # A 500 is the blocked carried-lock gate (see OpsLockStepRun#skip_when_carried_gate_fails): its
      # body is the framework's error page, which echoes the request, so it is not an answer to scan
      @answers = @all_answers.reject { |a| a['status'] == 500 }
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    # The scenario's own readable notes hold first factors on purpose: drop them from a body
    def without_notes(value)
      case value
      when Hash
        return nil if value['id'].to_s.start_with?('note_', 'sign_')

        value.transform_values { |v| without_notes(v) }
      when Array then value.map { |v| without_notes(v) }.compact
      else value
      end
    end

    def all_keys(value, out = [])
      case value
      when Hash then value.each { |k, v| out << k.to_s; all_keys(v, out) }
      when Array then value.each { |v| all_keys(v, out) }
      end
      out
    end

    def label(a)
      "#{a['verb']} #{a['path']} #{a['params'].slice('targetId', 'target_id', 'item_id').values.first}"
    end

    test 'the run played every beat the routes allow and kept its answers' do
      assert_operator @answers.size, :>, 80
      paths = @answers.map { |a| a['path'] }.uniq
      %w[unlock mfa/verify mfa/prompt mfa/approve mfa/phone mfa/device scenario inventory].each do |p|
        assert_includes paths, p
      end
      assert_equal @all_answers, OpsLockStepAnswers.all
    end

    test 'no answer holds a password or a PIN (the readable notes aside)' do
      secrets = (PW.values + PIN.values)
      @answers.each do |a|
        json = without_notes(a['body']).to_json
        secrets.each { |s| assert_not_includes json, s, "a first factor in #{label(a)}" }
      end
    end

    test 'a code is in no answer but GET mfa/device, and not in any ops log row' do
      codes = @answers.select { |a| a['path'] == 'mfa/device' }.map { |a| a['body']['code'] }
      assert_equal 1, codes.compact.size
      @answers.reject { |a| a['path'] == 'mfa/device' }.each do |a|
        codes.each { |c| assert_not_includes a['body'].to_json, c, "a code in #{label(a)}" }
      end
      codes.each { |c| assert_not_includes fresh.player_state['opsLog'].to_json, c }
      device = @answers.find { |a| a['path'] == 'mfa/device' }
      assert_equal 'no-store', device['cache_control']
    end

    test 'no answer carries the four state keys' do
      @answers.each do |a|
        keys = all_keys(a['body'])
        assert_empty keys & STATE_KEYS, "a state key in #{label(a)}"
        STATE_KEYS.each { |k| assert_not_includes a['body'].to_json, k, "#{k} in #{label(a)}" }
      end
    end

    test 'no answer marks the right number, and the phone lists three sorted' do
      @answers.each { |a| assert_empty all_keys(a['body']).grep(MARKS), "a mark in #{label(a)}" }
      phones = @answers.select { |a| a['path'] == 'mfa/phone' && a['status'] == 200 }.flat_map { |a| a['body']['requests'] }
      with_numbers = phones.select { |r| r['numbers'] }
      assert_operator with_numbers.size, :>=, 1
      with_numbers.each do |r|
        assert_equal 3, r['numbers'].uniq.size
        assert_equal r['numbers'].sort, r['numbers']
        assert(r['numbers'].all? { |n| (10..99).cover?(n) })
        assert_equal %w[n name numbers targetId targetType], r.keys.sort
      end
      # a gate carries one number, only for a number match
      gates = @answers.select { |a| a['path'] == 'unlock' && a['body']['secondStep'] }
      assert_operator gates.size, :>=, 8
      gates.each do |a|
        assert_equal(a['body']['kind'] == 'push_number_match', a['body'].key?('number'), label(a))
        assert_equal(a['body']['targetType'] == 'door' && a['params']['method'] == 'npc', a['body'].key?('opener'), label(a))
      end
    end

    test 'every mfa answer is no-store, and a gate answer is too' do
      @answers.select { |a| a['path'].start_with?('mfa/') || (a['path'] == 'unlock' && a['body']['secondStep']) }.each do |a|
        assert_equal 'no-store', a['cache_control'], "cache control of #{label(a)}"
      end
    end

    test 'a gated object or room shows its contents only in the open answer that follows its pass' do
      passed = []
      first_seen = {}
      @answers.each_with_index do |a, i|
        body = a['body']
        target = a['params']['target_id'] || a['params']['targetId']
        passed << target if body.is_a?(Hash) && body['stepPassed'] == true && %w[mfa/verify mfa/prompt mfa/approve].include?(a['path'])
        json = without_notes(body).to_json
        CONTENT_OWNER.each do |content, owner|
          next if first_seen[content] || owner.nil?
          next unless json.include?("\"id\":\"#{content}\"")

          first_seen[content] = i
          assert_equal 'unlock', a['path'], "#{content} first shown by #{label(a)}"
          assert_equal owner, a['params']['targetId'], "#{content} shown by the wrong lock's answer"
          assert_equal 200, a['status']
          assert_equal true, body['success']
          assert_includes passed, owner, "#{content} shown before the pass of #{owner}"
        end
      end
      # what the run opens, it opened through its pass; Dana's cabinet never shows
      %w[records_note audit_extract locker_memo safe_memo records_memo plant_memo].each { |c| assert first_seen.key?(c), "#{c} was never shown" }
      assert_not first_seen.key?('cabinet_memo'), 'the cabinet that never passes shows nothing'
    end

    test 'the gate and pass answers never carry contents or room data' do
      @answers.select { |a| a['path'].start_with?('mfa/') || (a['path'] == 'unlock' && a['body']['secondStep']) }.each do |a|
        assert_empty all_keys(a['body']) & %w[contents roomData], "contents in #{label(a)}"
      end
    end

    test 'the room read of a shut room holds nothing of it' do
      first_open = @answers.index { |a| a['path'] == 'unlock' && a['body']['roomData'] }
      @answers.first(first_open).select { |a| a['path'] =~ %r{\Aroom/} || a['path'] == 'scenario' }.each do |a|
        json = without_notes(a['body']).to_json
        assert_not_includes json, 'records_memo'
        assert_not_includes json, 'plant_memo'
      end
    end
  end
end
