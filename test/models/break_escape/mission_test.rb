require 'test_helper'

module BreakEscape
  class MissionTest < ActiveSupport::TestCase
    test "should validate presence of name" do
      mission = Mission.new(display_name: 'Test')
      assert_not mission.valid?
      assert mission.errors[:name].any?
    end

    test "should validate uniqueness of name" do
      Mission.create!(name: 'test', display_name: 'Test')
      duplicate = Mission.new(name: 'test', display_name: 'Test 2')
      assert_not duplicate.valid?
    end

    test "published scope returns only published missions" do
      assert_includes Mission.published, break_escape_missions(:ceo_exfil)
      assert_not_includes Mission.published, break_escape_missions(:unpublished)
    end

    test "scenario_path returns correct path" do
      mission = break_escape_missions(:ceo_exfil)
      expected = BreakEscape::Engine.root.join('scenarios', 'ceo_exfil')
      assert_equal expected, mission.scenario_path
    end

    test "ui_theme reads mission.json and falls back to the default" do
      assert_equal 'spy', Mission.new(name: 'm01_first_contact', display_name: 'M1').ui_theme
      assert_equal Mission::DEFAULT_UI_THEME, break_escape_missions(:ceo_exfil).ui_theme
      assert_equal Mission::DEFAULT_UI_THEME, Mission.new(name: 'no_such_mission', display_name: 'X').ui_theme
    end

    test "title_art_path returns a plain title_art image path or nil" do
      mission = Mission.new(name: 'no_such_mission', display_name: 'X')
      assert_nil mission.title_art_path # no mission.json

      { {} => nil, { 'title_art' => '' } => nil, { 'title_art' => 5 } => nil,
        { 'title_art' => '../secrets.jpg' } => nil, { 'title_art' => 'title_art/../x.jpg' } => nil,
        { 'title_art' => 'https://example.com/a.jpg' } => nil, { 'title_art' => '/title_art/a.jpg' } => nil,
        { 'title_art' => 'title_art/a.svg' } => nil,
        { 'title_art' => 'title_art/awareness_e12_visitor_tailgater.jpg' } => 'title_art/awareness_e12_visitor_tailgater.jpg',
        { 'title_art' => 'title_art/a-b_1.png' } => 'title_art/a-b_1.png' }.each do |meta, expected|
        mission.define_singleton_method(:load_mission_metadata) { meta }
        assert_equal expected, mission.title_art_path, "title_art #{meta.inspect}"
      end
    end

    test "title_art_path reads the real mission.json files and the art exists" do
      art = Mission.new(name: 'awareness_e12_visitor_tailgater_defend', display_name: 'A').title_art_path
      assert_equal 'title_art/awareness_e12_visitor_tailgater.jpg', art
      assert File.exist?(BreakEscape::Engine.root.join('public/break_escape/assets', art))
      assert_nil Mission.new(name: 'm01_first_contact', display_name: 'M1').title_art_path
    end

    test "scoring_mode returns each valid value and falls back to tasks" do
      mission = Mission.new(name: 'no_such_mission', display_name: 'X')
      assert_equal 'tasks', mission.scoring_mode # no mission.json

      { nil => 'tasks', 'bogus' => 'tasks', '' => 'tasks', 5 => 'tasks',
        'tasks' => 'tasks', 'partial_then_complete' => 'partial_then_complete',
        'completion' => 'completion' }.each do |value, expected|
        meta = value.nil? ? {} : { 'scoring' => value }
        mission.define_singleton_method(:load_mission_metadata) { meta }
        assert_equal expected, mission.scoring_mode, "scoring #{value.inspect}"
      end
    end

    test "scoring_mode reads the real mission.json files" do
      assert_equal 'partial_then_complete', Mission.new(name: 'lab_tesseract_trials', display_name: 'L').scoring_mode
      assert_equal 'partial_then_complete', Mission.new(name: 'lab_social_engineering', display_name: 'L').scoring_mode
      assert_equal 'completion', Mission.new(name: 'awareness_e1_invoice_fraud', display_name: 'A').scoring_mode
      assert_equal 'tasks', Mission.new(name: 'm01_first_contact', display_name: 'M1').scoring_mode
    end

    test "result_global, result_stage, ending_check? and timed? read mission.json" do
      mission = Mission.new(name: 'no_such_mission', display_name: 'X')
      assert_nil mission.result_global # no mission.json
      assert_nil mission.result_stage
      assert_equal true, mission.ending_check?
      assert_equal false, mission.timed?

      cases = {
        {} => [nil, nil, true, false],
        { 'resultGlobal' => 'triage_pre_percent' } => ['triage_pre_percent', 'pre', true, false],
        { 'resultGlobal' => 'triage_post_percent', 'stage' => 'post' } => ['triage_post_percent', 'post', true, false],
        { 'resultGlobal' => 'episode_e1_defend_percent' } => ['episode_e1_defend_percent', 'episode', true, false],
        { 'resultGlobal' => 'custom_percent', 'stage' => 'episode' } => ['custom_percent', 'episode', true, false],
        { 'resultGlobal' => 'custom_percent', 'stage' => 'bogus' } => ['custom_percent', nil, true, false],
        { 'resultGlobal' => 'bad name!' } => [nil, nil, true, false],
        { 'resultGlobal' => 'no_suffix' } => [nil, nil, true, false],
        { 'stage' => 'pre' } => [nil, nil, true, false], # a stage without a result global
        { 'endingCheck' => false } => [nil, nil, false, true],
        { 'endingCheck' => true } => [nil, nil, true, false],
        { 'endingCheck' => 'no' } => [nil, nil, true, false],
        { 'timed' => true } => [nil, nil, true, true]
      }
      cases.each do |meta, expected|
        mission.define_singleton_method(:load_mission_metadata) { meta }
        actual = [mission.result_global, mission.result_stage, mission.ending_check?, mission.timed?]
        assert_equal expected, actual, "mission.json #{meta.inspect}"
        assert expected[1] == mission.stage, "stage alias for #{meta.inspect}"
        assert_equal expected[2], mission.ending_check
      end
    end

    test "the shipped missions: sis01 and sis02 opt out of the ending warning, m01 and the Tesseract trials do not" do
      { 'sis01_healthcare' => false, 'sis02_energy' => false,
        'm01_first_contact' => true, 'lab_tesseract_trials' => true }.each do |name, expected|
        mission = Mission.new(name: name, display_name: name)
        assert_equal expected, mission.ending_check?, name
        assert_equal !expected, mission.timed?, name
      end
    end

    test "score_facts bundles what a breakdown needs from the mission" do
      mission = Mission.new(name: 'no_such_mission', display_name: 'X')
      mission.define_singleton_method(:load_mission_metadata) { { 'resultGlobal' => 'triage_pre_percent', 'endingCheck' => false, 'scoring' => 'completion' } }
      assert_equal({ result_global: 'triage_pre_percent', result_stage: 'pre', ending_check: false,
                     timed: true, scoring_mode: 'completion' }, mission.score_facts)
    end

    test "normalise_ui_theme accepts only known themes" do
      assert_equal 'cyberpunk', Mission.normalise_ui_theme('cyberpunk')
      assert_nil Mission.normalise_ui_theme('"><script>')
      assert_nil Mission.normalise_ui_theme(nil)
    end
  end
end
