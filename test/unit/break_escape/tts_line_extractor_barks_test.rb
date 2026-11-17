require 'test_helper'
require 'tmpdir'

module BreakEscape
  # Event barks (eventMappings `bark`, `sendTimedMessage.message`, `timedMessages`) of voiced person NPCs
  # are listed in the batch, kept in `keys` and counted by V6, so they can be generated through the
  # normal tts-audio route. The client voices them (npc-manager.js: useTTS for a person NPC with a
  # voice) and the endpoint accepts them (ScenarioBarkValidator.canonical).
  class TtsLineExtractorBarksTest < ActiveSupport::TestCase
    VOICE = { 'name' => 'Kore', 'style' => 'Dry.', 'language' => 'en-GB' }.freeze
    OTHER = { 'name' => 'Charon', 'style' => 'Dry.', 'language' => 'en-GB' }.freeze

    def person(id, extra = {})
      { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person', 'voice' => VOICE,
        'eventMappings' => [{ 'eventPattern' => 'room_entered:lobby', 'bark' => 'Mind the step.' },
                            { 'eventPattern' => 'item_picked_up:key',
                              'sendTimedMessage' => { 'message' => 'Found it yet?', 'delay' => 5 } }],
        'timedMessages' => [{ 'delay' => 30, 'message' => 'Still there?' }] }.merge(extra)
    end

    def data(*npcs)
      { 'rooms' => { 'lobby' => { 'npcs' => npcs } } }
    end

    def extractor(*npcs)
      TtsLineExtractor.new('barks_test', data(*npcs), chatter: false)
    end

    test 'a voiced person NPC lists its bark texts under its own id and voice' do
      e = extractor(person('guard')).entries
      assert_equal ['Mind the step.', 'Found it yet?', 'Still there?'], e.map(&:text)
      assert_equal ['guard'], e.map(&:npc_id).uniq
      assert_equal [VOICE], e.map(&:voice).uniq
      assert_equal ['npc.bark'], e.map(&:path).uniq
    end

    test 'an NPC with no voice, and a phone contact, list no bark' do
      assert_empty extractor(person('mute', 'voice' => nil)).entries
      assert_empty extractor(person('caller', 'npcType' => 'phone')).entries
    end

    test 'a repeated bark text is one entry; the same text in two voices is two' do
      a = person('a', 'eventMappings' => [{ 'bark' => 'Hello.' }, { 'bark' => ' Hello. ' }], 'timedMessages' => [])
      b = person('b', 'voice' => OTHER, 'eventMappings' => [{ 'bark' => 'Hello.' }], 'timedMessages' => [])
      e = extractor(a, b).entries
      assert_equal %w[a b], e.map(&:npc_id)
      assert_equal 2, e.map(&:key).uniq.size
    end

    test 'keys include the bark clips, whether or not chatter is pre-generated' do
      ex = extractor(person('guard'))
      svc = TtsService.new
      key = svc.cache_key_for('Mind the step.', VOICE['name'], VOICE['style'], VOICE['language'])
      assert_includes ex.keys, key
      assert_includes TtsLineExtractor.new('barks_test', data(person('guard')), chatter: true).keys, key
    end

    test 'V6 counts the bark clips as kind bark, uncached in an empty cache' do
      Dir.mktmpdir do |dir|
        r = TtsOfficeLines.new('barks_test', data(person('guard')), cache_dir: dir).report
        assert_equal ['Found it yet?', 'Mind the step.', 'Still there?'], r.clips.map(&:text).sort
        assert_equal ['bark'], r.clips.map(&:kind).uniq
        assert_equal 3, r.uncached.size
      end
    end

    test 'm03 lists its office-life barks' do
      ex = TtsLineExtractor.for_scenario('m03_ghost_in_the_machine')
      barks = ex.entries.select { |e| e.path == 'npc.bark' }
      puts "m03 bark lines: #{barks.map { |b| [b.npc_id, b.text] }.inspect}" if ENV['SHOW_BARKS']
      assert_operator barks.size, :>=, 2
    end
  end
end
