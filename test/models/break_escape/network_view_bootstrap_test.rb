require 'test_helper'

module BreakEscape
  # Ops skin K3 (S6 unit 21): the top-level `networkView` block is the one new field the browser
  # may read, so it ships as authored; the Terminal's per-network, per-service and per-finding
  # fields ride inside blocks the bootstrap withholds whole, and must never reach it.
  class NetworkViewBootstrapTest < ActiveSupport::TestCase
    def scenario(extra = {})
      {
        'scenario_brief' => 'Network view bootstrap',
        'startRoom' => 'start',
        'rooms' => { 'start' => { 'type' => 'room_office', 'connections' => {}, 'locked' => false, 'objects' => [] } },
        'networks' => {
          'office_lan' => { 'name' => 'Office network',
                            'cli' => { 'range' => '10.20.30.0/24', 'hosts' => { 'files01' => { 'address' => '10.20.30.5' } } } }
        },
        'hosts' => {
          'files01' => {
            'name' => 'Files', 'network' => 'office_lan',
            'services' => [{
              'name' => 'storage', 'port' => 445, 'product' => 'Invented Share', 'version' => '1.0',
              'cli' => { 'protocol' => 'tcp', 'service' => 'file-share', 'banner' => 'Invented banner 1.0' },
              'weaknesses' => [{ 'id' => 'entry_a', 'class' => 'misconfig', 'severity' => 'low', 'realism' => 'fixture_entry' }]
            }]
          }
        }
      }.merge(extra)
    end

    def bootstrap_of(data)
      game = Game.new(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: data
      )
      game.save(validate: false)
      filtered = game.filtered_scenario_for_bootstrap
      BreakEscape::AuthorNotes.strip_notes!(filtered, BreakEscape::ScenarioSchema.root)
      filtered
    end

    test 'networkView reaches the bootstrap unchanged' do
      filtered = bootstrap_of(scenario('networkView' => { 'defaultSkin' => 'cli' }))
      assert_equal({ 'defaultSkin' => 'cli' }, filtered['networkView'])
    end

    test 'a scenario without networkView has no such key in the bootstrap' do
      filtered = bootstrap_of(scenario)
      refute filtered.key?('networkView')
    end

    test 'the Terminal fields on networks, services and findings never reach the bootstrap' do
      json = bootstrap_of(scenario('networkView' => { 'defaultSkin' => 'gui' })).to_json
      %w[10.20.30 Invented\ banner file-share fixture_entry realism files01 office_lan].each do |word|
        refute_includes json, word, "#{word} reached the bootstrap"
      end
    end
  end
end
