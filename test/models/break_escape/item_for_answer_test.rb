require 'test_helper'

module BreakEscape
  # SYNC_DELTAS_PLAN 2.3 and P2 (section 4): the deep copy that strips saved_cards from
  # any item an answer carries, and the network answer's added/removed delta rule. Both
  # read only the loaded player_state, so a plain Game.new (no DB) exercises them.
  class ItemForAnswerTest < ActiveSupport::TestCase
    test 'item_for_answer deep-copies and drops saved_cards, leaving the stored item whole' do
      stored = { 'id' => 'rfid_cloner', 'type' => 'rfid_cloner', 'name' => 'Flipper',
                 'saved_cards' => [{ 'card_id' => 'a' }, { 'card_id' => 'b' }],
                 'scenarioData' => { 'nested' => { 'keep' => true } } }
      game = Game.new(player_state: { 'inventory' => [stored] })

      answer = game.item_for_answer(stored)
      refute answer.key?('saved_cards'), 'the answer copy drops saved_cards'
      assert_equal 'Flipper', answer['name']
      assert_equal({ 'nested' => { 'keep' => true } }, answer['scenarioData'])

      # The stored item is untouched: the copy is deep, so editing it leaves the save alone.
      answer['scenarioData']['nested']['keep'] = false
      assert_equal true, stored['scenarioData']['nested']['keep']
      assert stored.key?('saved_cards'), 'the stored item keeps its saved_cards'
    end

    test 'item_for_answer returns a non-hash argument unchanged' do
      game = Game.new(player_state: {})
      assert_nil game.item_for_answer(nil)
      assert_equal 'x', game.item_for_answer('x')
    end

    test 'network_inventory_delta names a still-held id as added and a vanished id as removed' do
      held = { 'id' => 'netlink_jack_a', 'type' => 'network_link', 'name' => 'Link',
               'saved_cards' => [{ 'card_id' => 'leak' }] }
      game = Game.new(player_state: { 'inventory' => [held] })

      delta = game.network_inventory_delta(%w[netlink_jack_a kit_rogue_pi])
      assert_equal %w[netlink_jack_a], delta[:added].map { |i| i['id'] }
      assert_equal %w[kit_rogue_pi], delta[:removed]
      # Through item_for_answer: no saved_cards can ride the echo.
      refute delta[:added].first.key?('saved_cards')
    end

    test 'network_inventory_delta keeps an id the player still holds a copy of out of removed' do
      # Two distinct tray items, one carrying the touched id: the id is present, so it is
      # added, never removed (SYNC_DELTAS_PLAN 4.3).
      game = Game.new(player_state: { 'inventory' => [
        { 'id' => 'kit_rogue_pi', 'type' => 'pc', 'name' => 'Pi' },
        { 'id' => 'other', 'type' => 'pc', 'name' => 'Other' }
      ] })
      delta = game.network_inventory_delta(%w[kit_rogue_pi])
      assert_equal %w[kit_rogue_pi], delta[:added].map { |i| i['id'] }
      assert_empty delta[:removed]
    end
  end
end
