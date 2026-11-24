require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 28: the leak scanner over the REAL answers of a whole run of scenarios/test_ops_lock_step (unit 26's
  # OpsLockStepRun#play_whole_run), turned into the browser capture's rows. The honest run must report nothing; then one edit a
  # leaking server would make is made in a copy of the real capture, and each must be reported.
  class AccessLeakScannerLockStepRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLockStepRun

    # Each answer gets the time it was given (the helper keeps none): the clock is the test's frozen one.
    def step_req(verb, suffix, params = {})
      body = super
      OpsLockStepAnswers.all.last['t'] = Time.current.utc.iso8601(3)
      OpsLockStepAnswers.all.last['game'] = @game.id
      body
    end

    setup do
      travel_to OpsLockStepRun::T0
      @entries = play_whole_run
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def rows_of(entries)
      entries.map do |e|
        path = "/break_escape/games/#{e['game']}/#{e['path']}"
        row = { 't' => e['t'], 'method' => e['verb'], 'path' => path, 'status' => e['status'], 'body' => e['body'] }
        row['query'] = e['params'].to_query if e['verb'] == 'GET' && !e['params'].empty?
        if e['verb'] == 'POST' && e['path'] == 'inventory'
          row['inv'] = { 'action' => e['params']['action_type'], 'itemId' => e['params'].dig('item', 'id') || e['params']['item_id'], 'usedOn' => nil }
        end
        row
      end
    end

    def scan(rows)
      AccessLeakScanner.new(lock_step_scenario).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    test 'the whole played run reports nothing, and holds every shape of answer the rules judge' do
      assert_equal 0, @entries.count { |e| e['status'] == 500 }, 'a 500 answer in the run is a server finding'
      rows = rows_of(@entries)
      assert_operator rows.length, :>, 100
      assert_equal [], scan(rows).map { |f| [f.line, f.rule, f.owner, f.route] }
      bodies = @entries.map { |e| e['body'] }
      assert(bodies.any? { |b| b.is_a?(Hash) && b['secondStep'] == true && b['kind'] == 'push_number_match' && b['number'].is_a?(Integer) })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['opener'] == 'gordon' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['waiting'] == 'held_phone' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['approvedBy'] == 'player' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['cancelled'] == true && b['targetId'] })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['roomData'] && b['type'] == 'door' })
    end
  end
end
