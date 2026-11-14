require 'test_helper'
require 'json'
require 'tmpdir'

module BreakEscape
  # V6 (OFFICE_LIFE_MISSIONS_PLAN.md sections 4 and 10): every office-life clip per voice, as
  # distinct cache keys, marked cached or uncached. Read only: a fixture cache directory stands in
  # for tts_cache/, and nothing is generated.
  class TtsOfficeLinesTest < ActiveSupport::TestCase
    STORY = BreakEscape::Engine.root.join('scenarios/test_needs_sims/ink/amara.json').to_s
    AOEDE = { 'name' => 'Aoede', 'style' => 'Warm.', 'language' => 'en-GB' }.freeze
    CHARON = { 'name' => 'Charon', 'style' => 'Dry.', 'language' => 'en-GB' }.freeze

    def data(shared: nil)
      amara = { 'id' => 'amara', 'displayName' => 'Amara', 'npcType' => 'person', 'voice' => AOEDE, 'storyPath' => STORY,
                'currentKnot' => 'start', 'chatter' => { 'coffee' => ['Kettle on.', 'Milk, anyone?'] },
                'exchanges' => [{ 'with' => 'tom', 'knot' => 'exchange_tom_parcel' }],
                'phoneCalls' => [{ 'knot' => 'call_take_message' }] }
      tom = { 'id' => 'tom', 'displayName' => 'Tom', 'npcType' => 'person', 'voice' => CHARON,
              'chatter' => { 'coffee' => ['Kettle on.'] } }
      d = { 'rooms' => { 'office' => { 'npcs' => [amara, tom] } } }
      d['chatter'] = shared if shared
      d
    end

    def report(cache_dir, d = data)
      TtsOfficeLines.new('ol_fixture', d, cache_dir: cache_dir).report
    end

    test 'lists chatter, exchange and call clips per voice, uncached in an empty cache' do
      Dir.mktmpdir do |dir|
        r = report(dir)
        assert_equal ['Aoede en-GB', 'Charon en-GB'], r.voices.map { |v| v.label.split(' style').first }
        amara = r.voices.first
        assert_equal %w[amara], amara.npc_ids
        kinds = amara.clips.map(&:kind).uniq.sort
        assert_equal %w[call chatter exchange], kinds
        assert_includes amara.clips.map(&:text), 'It was. New headsets for the team.'
        refute_includes amara.clips.map(&:text), 'Was that parcel on the floor for you?' # Tom's line, Tom's voice
        assert_includes r.voices.last.clips.map(&:text), 'Was that parcel on the floor for you?'
        assert(r.clips.none?(&:cached))
        assert_equal r.clips.size, r.uncached.size
        assert_equal r.clips.sum { |c| c.text.length }, r.characters
      end
    end

    test 'the same text in two voices is two clips; a shared pool line is one clip per voice' do
      Dir.mktmpdir do |dir|
        r = report(dir, data(shared: { 'greet' => ['Morning.'] }))
        assert_equal 2, r.clips.count { |c| c.text == 'Kettle on.' }
        assert_equal 2, r.clips.count { |c| c.text == 'Morning.' }
        assert_equal r.clips.map(&:key).uniq.size, r.clips.size
      end
    end

    test 'a clip whose MP3 is in the cache is marked cached' do
      Dir.mktmpdir do |dir|
        clip = report(dir).clips.find { |c| c.text == 'Milk, anyone?' }
        FileUtils.mkdir_p(File.join(dir, 'ol_fixture'))
        File.write(File.join(dir, 'ol_fixture', "#{clip.key}.mp3"), 'x')
        r = report(dir)
        assert(r.clips.find { |c| c.text == 'Milk, anyone?' }.cached)
        assert_equal r.clips.size - 1, r.uncached.size
      end
    end

    test 'person-chat lines outside exchange and call knots are not office-life clips' do
      Dir.mktmpdir do |dir|
        texts = report(dir).clips.map(&:text)
        all = TtsLineExtractor.new('ol_fixture', data, chatter: true).entries.map(&:text)
        assert_operator all.size, :>, texts.size
      end
    end
  end
end
