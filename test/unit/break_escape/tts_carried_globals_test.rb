require 'test_helper'

module BreakEscape
  # A carried-over global (importGlobals) holds what the client wrote in an
  # earlier mission, so a line printing one is never voiced: not with the
  # player's value, not with the ink's default.
  class TtsCarriedGlobalsTest < ActiveSupport::TestCase
    STORY = 'test/fixtures/files/ink_line_walker/carried_global_fixture.json'.freeze
    PLAYER_TEXT = 'BUY COINS NOW'.freeze

    def scenario(imported: true)
      data = {
        'globalVariables' => { 'm01_final_choice' => PLAYER_TEXT },
        'rooms' => { 'lobby' => { 'npcs' => [
          { 'id' => 'kevin_park', 'displayName' => 'Kevin Park', 'npcType' => 'person', 'storyPath' => STORY,
            'voice' => { 'name' => 'Puck', 'style' => nil, 'language' => 'en-GB' } }
        ] } }
      }
      if imported
        data['importGlobals'] = [{ 'from' => 'm01_first_contact', 'var' => 'final_choice', 'default' => '' }]
        data['importedGlobals'] = { 'm01_final_choice' => { 'from' => 'm01_first_contact', 'var' => 'final_choice', 'found' => true } }
      end
      data
    end

    def resolve(data, text)
      resolver = TtsLineResolver.new(scenario_name: "carried_test_#{data.key?('importGlobals')}", scenario_data: data,
                                     story_file: ->(path) { Engine.root.join(path).to_s })
      resolver.resolve('kevin_park', TtsLineResolver.find_npc(data, 'kevin_park'), text).line
    end

    test "the extractor never voices a line printing a carried-over global" do
      texts = TtsLineExtractor.new('carried_test', scenario(imported: true)).entries.map(&:text)
      assert_includes texts, 'Welcome back.'
      refute(texts.any? { |t| t.include?('You chose') }, texts.inspect)
    end

    test "the same line with an ordinary constant global is voiced (the guard is what refuses it)" do
      texts = TtsLineExtractor.new('carried_test', scenario(imported: false)).entries.map(&:text)
      assert_includes texts, "You chose #{PLAYER_TEXT} last time."
    end

    test "the endpoint refuses the line with the player's value and with the ink default" do
      data = scenario(imported: true)
      assert_nil resolve(data, "You chose #{PLAYER_TEXT} last time.")
      assert_nil resolve(data, 'You chose last time.')
      assert_equal 'Welcome back.', resolve(data, 'Welcome back.')
    end

    test "a declared import counts even before the game has resolved it" do
      data = scenario(imported: true)
      data.delete('importedGlobals')
      assert_includes TtsLineExtractor.imported_names(data), 'm01_final_choice'
      refute(TtsLineExtractor.new('carried_test', data).entries.any? { |e| e.text.include?('You chose') })
    end
  end
end
