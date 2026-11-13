require 'test_helper'

module BreakEscape
  # A preloaded call opening keeps its #delivery: tags across a reload (the phone
  # save), so the first open still speaks the line with its note. The tags are
  # player-supplied text: strings only, capped, no control characters, never trusted.
  class PhoneMessageDeliveryTagsTest < ActiveSupport::TestCase
    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: { 'startRoom' => 'reception', 'rooms' => {} },
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'globalVariables' => {} }
      )
    end

    def saved_history(tags_value, extra = {})
      msg = { 'type' => 'npc', 'text' => 'Listen carefully.', 'timestamp' => 1, 'preloaded' => true }
      msg = msg.merge('deliveryTags' => tags_value) unless tags_value == :absent
      @game.send(:merge_phone_state!, { 'dev' => { 'history' => [msg.merge(extra)] } })
      @game.player_state.dig('phoneState', 'dev', 'history')
    end

    test 'delivery tags on a message are saved' do
      history = saved_history(['delivery: low and even'])
      assert_equal ['delivery: low and even'], history[0]['deliveryTags']
    end

    test 'a message without tags gains no key' do
      refute saved_history(:absent)[0].key?('deliveryTags')
    end

    test 'non-array tags are dropped, the message stays' do
      [ 'delivery: x', { 'a' => 'b' }, 5, true ].each do |bad|
        history = saved_history(bad)
        assert_equal 'Listen carefully.', history[0]['text']
        refute history[0].key?('deliveryTags'), "kept #{bad.inspect}"
      end
    end

    test 'hostile entries are dropped: non-strings, overlong, control characters, extra tags' do
      long = "delivery: #{'a' * 400}"
      tags = ['delivery: ok', 7, nil, { 'x' => 1 }, ['nested'], long, "delivery: bell\u0007", "delivery: nul\u0000",
              '<script>alert(1)</script>', 'a', 'b', 'c', 'd', 'e']
      kept = saved_history(tags)[0]['deliveryTags']
      assert_equal ['delivery: ok', '<script>alert(1)</script>', 'a', 'b', 'c'], kept
      assert_operator kept.length, :<=, Game::PHONE_DELIVERY_TAGS_MAX
      kept.each { |t| assert_operator t.length, :<=, Game::PHONE_DELIVERY_TAG_MAX }
    end

    test 'a list with only bad entries saves no key' do
      refute saved_history([7, nil, 'x' * 301])[0].key?('deliveryTags')
    end

    test 'the text is plain: the tag is stored verbatim and the text still capped' do
      history = saved_history(['delivery: a & b "c"'], 'text' => 'x' * 5000)
      assert_equal 4000, history[0]['text'].length
      assert_equal ['delivery: a & b "c"'], history[0]['deliveryTags']
    end
  end
end
