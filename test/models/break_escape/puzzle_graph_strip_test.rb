require 'test_helper'

module BreakEscape
  # puzzle_graph_* fields are authoring notes for the dungeon-graph generator.
  # Room payloads must not carry them, at any depth. puzzle_graph_role and
  # puzzle_graph_unlocks are the two the client reads (consumables.js).
  class PuzzleGraphStripTest < ActiveSupport::TestCase
    def graph_keys(obj, found = [])
      case obj
      when Hash
        obj.each do |k, v|
          found << k if k.to_s.start_with?('puzzle_graph_')
          graph_keys(v, found)
        end
      when Array
        obj.each { |v| graph_keys(v, found) }
      end
      found
    end

    setup do
      note = { 'puzzle_graph_reveals' => 'the PIN is 1234', 'puzzle_graph_note' => 'n',
               'puzzle_graph_aim' => 'a', 'puzzle_graph_and_with' => 'x',
               'puzzle_graph_optional' => true, 'puzzle_graph_links' => ['y'] }
      @scenario_data = {
        'startRoom' => 'start',
        'rooms' => {
          'start' => {
            'type' => 'room_office', 'connections' => {}, 'locked' => false,
            'objects' => [
              { 'type' => 'desk', 'name' => 'Desk', 'puzzle_graph_role' => 'clue',
                'puzzle_graph_unlocks' => 'cabinet', **note,
                'contents' => [{ 'type' => 'note', 'name' => 'Note', **note,
                                 'contents' => [{ 'type' => 'key', 'name' => 'K', **note }] }] }
            ],
            'npcs' => [{ 'id' => 'n1', **note, 'puzzle_graph_actions' => ['z'],
                         'itemsHeld' => [{ 'type' => 'card', 'name' => 'C', **note }] }]
          }
        }
      }
    end

    test 'filtered_room_data carries no stripped puzzle_graph keys at any depth' do
      game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: @scenario_data)
      game.save(validate: false)
      assert_operator graph_keys(game.room_data('start')).length, :>, 10, 'fixture should carry the keys'

      room = game.filtered_room_data('start')
      assert_equal %w[puzzle_graph_role puzzle_graph_unlocks], graph_keys(room).sort
      desk = room['objects'].first
      assert_equal 'clue', desk['puzzle_graph_role']
      assert_equal 'cabinet', desk['puzzle_graph_unlocks']
    end

    test 'container contents filter strips nested keys' do
      item = @scenario_data['rooms']['start']['objects'].first['contents'].first.deep_dup
      Game.new.send(:filter_requires_and_contents_recursive, item)
      assert_empty graph_keys(item)
    end

    test 'strip_puzzle_graph_keys! keeps only the client-read pair' do
      h = { 'puzzle_graph_role' => 1, 'puzzle_graph_unlocks' => 2, 'puzzle_graph_note' => 3, 'name' => 'x' }
      Game.strip_puzzle_graph_keys!(h)
      assert_equal %w[name puzzle_graph_role puzzle_graph_unlocks], h.keys.sort
    end
  end
end
