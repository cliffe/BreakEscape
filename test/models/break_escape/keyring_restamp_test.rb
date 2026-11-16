require 'test_helper'

module BreakEscape
  # Credential keyring K1 R3 m1/m2: restamp_item_credential! never stamps a credential on a
  # client-built type (notepad, decor cup), and a start-inventory item gets its credential stamped.
  class KeyringRestampTest < ActiveSupport::TestCase
    def build_game(extra = {})
      scenario = {
        'startRoom' => 'office',
        'rooms' => { 'office' => { 'objects' => [] } },
        'credentials' => { 'c1' => { 'kind' => 'saved_connection', 'account' => 'lena' } }
      }.merge(extra)
      Game.new(scenario_data: scenario, player_state: {})
    end

    test 'a start-inventory credential item is stamped from the scenario definition' do
      game = build_game('startItemsInInventory' => [
        { 'id' => 'rdp_file', 'type' => 'text_file', 'name' => 'x.rdp', 'credential' => 'c1' },
        { 'id' => 'plain', 'type' => 'text_file', 'name' => 'plain.txt' }
      ])
      game.send(:initialize_player_state)
      inv = game.player_state['inventory']
      assert_equal 'c1', inv.find { |i| i['id'] == 'rdp_file' }['credential']
      refute inv.find { |i| i['id'] == 'plain' }.key?('credential')
    end

    test 'restamp never stamps a credential on a notepad or decor cup, even with a matching definition' do
      %w[notepad office-misc-cup coffee_cups1].each do |type|
        game = build_game('rooms' => { 'office' => { 'objects' => [
          { 'id' => 'thing', 'type' => type, 'credential' => 'c1' }
        ] } })
        item = { 'id' => 'thing', 'type' => type, 'credential' => 'c1' }
        game.restamp_item_credential!(item)
        refute item.key?('credential'), "#{type} must not carry a credential"
      end
    end
  end
end
