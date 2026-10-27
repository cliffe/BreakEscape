require 'test_helper'

module BreakEscape
  # The host's awareness settings (config.awareness_settings) reach the play page as
  # window.breakEscapeConfig.awareness. The engine whitelists keys and cleans the values.
  class AwarenessConfigTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
      @game = Game.create!(
        mission: @mission, player: @player,
        scenario_data: { 'startRoom' => 'reception',
                         'rooms' => { 'reception' => { 'type' => 'room_reception', 'connections' => {}, 'locked' => false, 'objects' => [] } } },
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'unlockedObjects' => [],
                        'inventory' => [], 'encounteredNPCs' => [], 'globalVariables' => {}, 'health' => 100 }
      )
      @original = BreakEscape.configuration.awareness_settings
    end

    teardown do
      BreakEscape.configuration.awareness_settings = @original
    end

    def hook(value = nil, &block)
      BreakEscape.configuration.awareness_settings = block || ->(_game) { value }
    end

    def awareness_json
      match = response.body.match(/awareness: (\{.*?\}),\n/)
      match && JSON.parse(match[1])
    end

    test 'no hook leaves the awareness key out' do
      hook(nil)
      get game_url(@game)
      assert_response :success
      assert_no_match(/awareness:/, response.body)
    end

    test 'a hook returning all three settings writes them to the config' do
      hook(report_heading: 'Report it', report_text: 'Forward it to security@example.com.',
           rule_of_thumb: 'Stop and check.', team_size: '250')
      get game_url(@game)
      assert_response :success
      assert_equal(
        { 'reportRoute' => { 'heading' => 'Report it', 'text' => 'Forward it to security@example.com.' },
          'ruleOfThumb' => 'Stop and check.', 'teamSize' => 250 },
        awareness_json
      )
    end

    test 'report text without a heading is a plain string' do
      hook(report_text: 'Tell the help desk.')
      get game_url(@game)
      assert_equal({ 'reportRoute' => 'Tell the help desk.' }, awareness_json)
    end

    test 'a heading with no text is dropped, and blank values leave the key out' do
      hook(report_heading: 'Heading only', report_text: '  ', rule_of_thumb: '', team_size: nil)
      get game_url(@game)
      assert_response :success
      assert_no_match(/awareness:/, response.body)
    end

    test 'unknown keys are ignored' do
      hook(report_text: 'x route', evil: '<script>alert(1)</script>', ruleOfThumb: 'nope')
      get game_url(@game)
      assert_equal({ 'reportRoute' => 'x route' }, awareness_json)
    end

    test 'a hook that raises still renders the page, without the key' do
      hook { |_game| raise 'boom' }
      get game_url(@game)
      assert_response :success
      assert_no_match(/awareness:/, response.body)
    end

    test 'a script-closing value cannot break out of the config script' do
      evil = "</script><img src=x onerror=alert(1)>"
      hook(report_text: evil, rule_of_thumb: "It's \"quoted\" & <b>bold</b>")
      get game_url(@game)
      assert_response :success
      assert_no_match(%r{</script><img}, response.body)
      assert_no_match(/<img src=x onerror/, response.body)
      assert_match(/\\u003c\/script\\u003e\\u003cimg/, response.body)
      assert_equal evil, awareness_json['reportRoute']
      assert_equal "It's \"quoted\" & <b>bold</b>", awareness_json['ruleOfThumb']
    end

    test 'text is capped at 600 characters and the heading at 80' do
      hook(report_heading: 'h' * 200, report_text: 'a' * 900, rule_of_thumb: 'r' * 900)
      get game_url(@game)
      data = awareness_json
      assert_equal 80, data['reportRoute']['heading'].length
      assert_equal 600, data['reportRoute']['text'].length
      assert_equal 600, data['ruleOfThumb'].length
    end

    test 'team size outside 2..100000, or not a whole number, is dropped' do
      [1, 0, -5, 100_001, 'abc', '2.5', 3.5, '', nil, [3]].each do |bad|
        hook(report_text: 'route', team_size: bad)
        get game_url(@game)
        assert_nil awareness_json['teamSize'], "team_size #{bad.inspect} should be dropped"
      end
      [2, '2', 100_000, ' 40 '].each do |good|
        hook(team_size: good)
        get game_url(@game)
        assert_kind_of Integer, awareness_json['teamSize']
      end
    end
  end

  class AwarenessHelperTest < ActionView::TestCase
    include ApplicationHelper

    test 'be_plain strips control characters, keeps newlines, trims and caps' do
      assert_equal "a\nb", be_plain("  a\u0000\u0007\r\nb\u001b  ")
      assert_equal 'x' * 10, be_plain('x' * 50, 10)
      assert_equal '', be_plain(nil)
      assert_equal '', be_plain(%w[a])
    end

    test 'be_team_size bounds' do
      assert_equal 2, be_team_size('2')
      assert_equal 100_000, be_team_size(100_000)
      assert_nil be_team_size(1)
      assert_nil be_team_size('100001')
    end

    test 'config is empty without a hook and when the hook returns a non-hash' do
      original = BreakEscape.configuration.awareness_settings
      BreakEscape.configuration.awareness_settings = nil
      assert_equal({}, break_escape_awareness_config(nil))
      BreakEscape.configuration.awareness_settings = ->(_g) { 'a string' }
      assert_equal({}, break_escape_awareness_config(nil))
    ensure
      BreakEscape.configuration.awareness_settings = original
    end
  end
end
