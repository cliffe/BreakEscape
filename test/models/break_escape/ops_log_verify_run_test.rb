require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb --ops-log (OPS_LOG_ROWS_PLAN.md 5.1, L1a): prints the stored log, runs the
  # helper's secret matcher over each row, exits 1 on a hit and never prints the secret.
  class OpsLogVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)
    PIN = '4821'.freeze
    EVENTS = { 'tst_note' => { label: 'NOTE', places: [], results: %w[ok],
                               detail: { 'tag' => %w[a b] } } }.freeze

    setup do
      Thread.current[:ops_log_overlay] = { events: EVENTS, kinds: {} }
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {},
                                  'objects' => [{ 'id' => 'box', 'type' => 'safe', 'locked' => true, 'lockType' => 'pin', 'requires' => PIN }] } },
        'logSources' => { 'notes' => { 'title' => 'Notes', 'events' => ['tst_note'] } }
      }
      @game = create_access_game(mission: Mission.create!(name: 'test_simple_success', display_name: 'V', published: true, difficulty_level: 1),
                                 player: break_escape_demo_users(:test_user), scenario: scenario)
    end

    teardown { Thread.current[:ops_log_overlay] = nil }

    def run_script(*flags)
      out = nil
      status = 0
      ARGV.replace(['--ops-log', *flags, @game.id.to_s])
      out, = capture_io do
        verbose = $VERBOSE
        $VERBOSE = nil
        load SCRIPT
      rescue SystemExit => e
        status = e.status
      ensure
        $VERBOSE = verbose
      end
      [out, status]
    end

    test 'a clean log prints its rows and exits 0' do
      @game.write_log_row!('tst_note', as: nil, where: nil, result: 'ok', detail: { 'tag' => 'a' })
      @game.save!
      out, status = run_script
      assert_equal 0, status, out
      assert_includes out, 'tst_note'
      assert_includes out, 'ops log OK'
    end

    test 'a stored row holding a secret exits 1 and the output never shows the secret' do
      @game.write_log_row!('tst_note', as: nil, where: nil, result: 'ok')
      @game.player_state['opsLog']['notes'][0]['detail'] = { 'tag' => PIN }
      @game.save!
      out, status = run_script
      assert_equal 1, status
      assert_includes out, 'a secret appears at'
      refute_includes out, PIN
    end

    # R1 m15: as.typed may be a password typed into the username box.
    test 'typed text is printed as its length unless --show-flags' do
      @game.write_log_row!('tst_note', as: { typed: 'Hunter2-typed' }, where: nil, result: 'ok')
      @game.save!
      out, status = run_script
      assert_equal 0, status, out
      refute_includes out.downcase, 'hunter2-typed'
      assert_includes out, '[13 chars]'
      out, = run_script('--show-flags')
      assert_includes out.downcase, 'hunter2-typed'
    end

    test 'rows over a cap and a stale ordering are reported' do
      3.times { |i| @game.write_log_row!('tst_note', as: nil, where: nil, result: 'ok', detail: { 'tag' => i.zero? ? 'a' : 'b' }) }
      @game.player_state['opsLog']['notes'].reverse!
      @game.save!
      out, status = run_script
      assert_equal 1, status
      assert_includes out, 'seq does not ascend'
    end
  end
end
