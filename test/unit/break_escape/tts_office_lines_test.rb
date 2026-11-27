require 'test_helper'
require 'json'
require 'tmpdir'
require 'open3'

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

    # Fixture stories: amara.ink has an exchange line tagged #delivery: and a start line that
    # repeats a chatter line; sam.ink has a knot named like amara's exchange knot.
    FIXTURES = BreakEscape::Engine.root.join('test/fixtures/files/tts_office_lines')

    def fixture_data
      amara = { 'id' => 'amara', 'displayName' => 'Amara', 'npcType' => 'person', 'voice' => AOEDE,
                'storyPath' => FIXTURES.join('amara.json').to_s, 'currentKnot' => 'start',
                'chatter' => { 'coffee' => ['Kettle on.', 'Milk, anyone?'] },
                'exchanges' => [{ 'with' => 'tom', 'knot' => 'exchange_tom_parcel' }],
                'phoneCalls' => [{ 'knot' => 'call_take_message' }] }
      tom = { 'id' => 'tom', 'displayName' => 'Tom', 'npcType' => 'person', 'voice' => CHARON }
      sam = { 'id' => 'sam', 'displayName' => 'Sam', 'npcType' => 'person', 'voice' => CHARON,
              'storyPath' => FIXTURES.join('sam.json').to_s, 'currentKnot' => 'start' }
      { 'rooms' => { 'office' => { 'npcs' => [amara, tom, sam] } } }
    end

    test 'an exchange line tagged #delivery: is keyed with no delivery, as NpcChatterVoice requests it' do
      Dir.mktmpdir do |dir|
        text = 'It was. New headsets for the team.'
        clip = report(dir, fixture_data).clips.find { |c| c.text == text }
        assert_equal 'exchange', clip.kind
        svc = TtsService.new
        assert_equal svc.cache_key_for(text, 'Aoede', 'Warm.', 'en-GB'), clip.key
        person = TtsLineExtractor.new('ol_fixture', fixture_data, chatter: false).entries.find { |e| e.text == text }
        assert_equal 'whispering', person.delivery
        refute_equal person.key, clip.key
        # a cached clip under the client's key (no delivery) shows cached; one under the tagged key does not
        FileUtils.mkdir_p(File.join(dir, 'ol_fixture'))
        File.write(File.join(dir, 'ol_fixture', "#{person.key}.mp3"), 'x')
        refute report(dir, fixture_data).clips.find { |c| c.text == text }.cached
        File.write(File.join(dir, 'ol_fixture', "#{clip.key}.mp3"), 'x')
        assert report(dir, fixture_data).clips.find { |c| c.text == text }.cached
      end
    end

    test 'a chatter line a person-chat line also holds is listed, marked shared' do
      Dir.mktmpdir do |dir|
        clips = report(dir, fixture_data).clips
        kettle = clips.find { |c| c.text == 'Kettle on.' }
        assert_equal 'chatter', kettle.kind
        assert kettle.shared
        refute clips.find { |c| c.text == 'Milk, anyone?' }.shared
      end
    end

    test 'a knot named like an exchange knot in another NPC story is not office life' do
      Dir.mktmpdir do |dir|
        texts = report(dir, fixture_data).clips.map(&:text)
        refute_includes texts, 'Parcels go to the post room.'
        assert_includes texts, 'Was that parcel on the floor for you?'
      end
    end

    test 'person-chat lines outside exchange and call knots are left out, exactly' do
      Dir.mktmpdir do |dir|
        texts = report(dir, fixture_data).clips.map(&:text)
        person = TtsLineExtractor.new('ol_fixture', fixture_data, chatter: false).entries.map(&:text)
        assert_equal ['Morning.', 'Parcels go to the post room.'], (person - texts).sort
        assert_equal ["Tom's desk. He's out, can I take a message?", 'It was. New headsets for the team.',
                      'Kettle on.', 'Milk, anyone?', 'Was that parcel on the floor for you?'].sort, texts.sort
      end
    end

    # The rake task itself, keyless, as the merge gate runs it.
    def run_task(env, *args)
      rails = BreakEscape::Engine.root.join('bin/rails').to_s
      base = { 'GEMINI_API_KEY' => nil, 'RAILS_ENV' => 'test', 'STRICT' => nil }
      Open3.capture3(base.merge(env), rails, *args, chdir: BreakEscape::Engine.root.to_s)
    end

    test 'the rake task runs keyless: exit 0 without STRICT, 1 with STRICT on an uncached clip, 0 once all are cached' do
      Dir.mktmpdir do |dir|
        task = 'app:break_escape:tts:office_lines[test_needs_sims]'
        out, err, st = run_task({ 'TTS_CACHE_DIR' => dir }, task)
        assert_equal 0, st.exitstatus, err
        assert_match(/test_needs_sims: office-life clips per voice/, out)
        assert_match(/UNCACHED/, out)
        _out, err, st = run_task({ 'TTS_CACHE_DIR' => dir, 'STRICT' => '1' }, task)
        assert_equal 1, st.exitstatus, err
        TtsOfficeLines.for_scenario('test_needs_sims', cache_dir: dir).clips.each do |c|
          FileUtils.mkdir_p(File.join(dir, 'test_needs_sims'))
          File.write(File.join(dir, 'test_needs_sims', "#{c.key}.mp3"), 'x')
        end
        out, err, st = run_task({ 'TTS_CACHE_DIR' => dir, 'STRICT' => '1' }, task)
        assert_equal 0, st.exitstatus, err
        assert_match(/, 0 uncached/, out)
        assert_empty Dir.children(File.join(dir, 'test_needs_sims')) - TtsOfficeLines.for_scenario('test_needs_sims', cache_dir: dir).clips.map { |c| "#{c.key}.mp3" }
      end
    end

    test 'the rake task aborts with usage when no mission is named' do
      _out, err, st = run_task({}, 'app:break_escape:tts:office_lines')
      assert_equal 1, st.exitstatus
      assert_match(/usage: bin\/rails "app:break_escape:tts:office_lines\[<mission>\]"/, err)
    end
  end
end
