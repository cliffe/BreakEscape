require 'test_helper'
require 'fileutils'
require 'tmpdir'
require 'json'
require 'base64'
require 'minitest/mock'
require 'open3'

module BreakEscape
  # Per-line delivery notes (`#delivery: quietly, almost to herself`): the note
  # goes into the voice prompt for that line and into its cache key only when
  # there is one, so every untagged line keeps the key (and clip) it has always had.
  class TtsDeliveryTest < ActiveSupport::TestCase
    FIXTURE = 'test/fixtures/files/ink_line_walker/delivery_fixture.json'.freeze
    KEVIN_VOICE = { 'name' => 'Puck', 'style' => 'Nervous IT admin.', 'language' => 'en-GB' }.freeze
    NARRATOR_VOICE = { 'name' => 'Algenib', 'style' => 'Noir.', 'language' => 'en-GB' }.freeze

    # A committed m01 clip (tts_cache/m01_first_contact/456b6920a02816aa3e2184bddb10eb3b.mp3)
    SAMPLE_KEY = '456b6920a02816aa3e2184bddb10eb3b'.freeze
    SAMPLE = [
      'She started investigating. Kept notes in her office.',
      'Leda',
      'Content analyst in her late twenties. Speak with a consistent Chinese-American (California) accent ' \
      'throughout — do not shift to any other accent. Soft, mid-to-high pitch; quiet, hesitant pace. Nervous and concerned.',
      'en-US'
    ].freeze

    # ─── Keys ──────────────────────────────────────────────────────────────

    test "an untagged line keeps its exact existing key" do
      assert_equal SAMPLE_KEY, TtsService.cache_key(*SAMPLE)
      assert_equal SAMPLE_KEY, TtsService.cache_key(*SAMPLE, nil)
      assert_equal SAMPLE_KEY, TtsService.cache_key(*SAMPLE, '')
      assert_equal SAMPLE_KEY, TtsService.cache_key(*SAMPLE, '   ')
      assert_equal SAMPLE_KEY, TtsService.new.cache_key_for(*SAMPLE)
      assert_equal SAMPLE_KEY, TtsService.cache_key_for_normalized(TtsService.normalize_text(SAMPLE[0]), *SAMPLE[1..])
    end

    test "every committed current-model clip is still found under its sidecar's key" do
      checked = 0
      Dir.glob(TtsService::CACHE_DIR.join('*', '*.json').to_s).each do |path|
        data = JSON.parse(File.read(path)) rescue next
        next unless data.is_a?(Hash) && data['text'].is_a?(String) && data['model'] == TtsService::GEMINI_TTS_MODEL
        next if data.key?('delivery')

        key = File.basename(path, '.json')
        old_formula = Digest::MD5.hexdigest(
          "#{TtsService.normalize_text(data['text'])}|#{data['voice']}|#{data['style']}|#{data['language']}|#{TtsService::GEMINI_TTS_MODEL}"
        )
        next unless old_formula == key

        assert_equal key, TtsService.sidecar_cache_key(data), path
        checked += 1
      end
      assert_operator checked, :>, 100
    end

    test "a tagged line has its own key, and the note is normalised like the text" do
      tagged = TtsService.cache_key(*SAMPLE, 'quietly, almost to herself')
      refute_equal SAMPLE_KEY, tagged
      assert_equal tagged, TtsService.cache_key(*SAMPLE, '  Quietly   almost to herself. ')
      refute_equal tagged, TtsService.cache_key(*SAMPLE, 'loudly')
      assert_equal tagged, TtsService.new.cache_key_for(*SAMPLE, 'quietly, almost to herself')
      expected = Digest::MD5.hexdigest(
        "#{TtsService.normalize_text(SAMPLE[0])}|#{SAMPLE[1..].join('|')}|#{TtsService::GEMINI_TTS_MODEL}|delivery:quietly almost to herself"
      )
      assert_equal expected, tagged
    end

    test "a sidecar records the note only when there is one, and the model check uses it" do
      Dir.mktmpdir('tts_delivery') do |dir|
        service = TtsService.new
        plain = Pathname.new(dir).join("#{TtsService.cache_key(*SAMPLE)}.mp3")
        service.write_sidecar(plain, *SAMPLE, 'm01')
        data = JSON.parse(File.read(plain.sub_ext('.json')))
        refute data.key?('delivery')
        assert_equal TtsService::GEMINI_TTS_MODEL, data['model']

        tagged = Pathname.new(dir).join("#{TtsService.cache_key(*SAMPLE, 'quietly')}.mp3")
        service.write_sidecar(tagged, *SAMPLE, 'm01', delivery: 'quietly')
        data = JSON.parse(File.read(tagged.sub_ext('.json')))
        assert_equal 'quietly', data['delivery']
        assert_equal TtsService::GEMINI_TTS_MODEL, data['model']
        assert_equal File.basename(tagged, '.mp3'), TtsService.sidecar_cache_key(data)
      end
    end

    # ─── Tags ──────────────────────────────────────────────────────────────

    test "delivery_from_tags reads the last non-empty delivery tag" do
      assert_nil TtsService.delivery_from_tags(nil)
      assert_nil TtsService.delivery_from_tags(['speaker:npc:kevin', 'exit_conversation'])
      assert_equal 'quietly', TtsService.delivery_from_tags(['delivery: quietly'])
      assert_equal 'quietly, almost to herself', TtsService.delivery_from_tags([' Delivery:quietly,   almost to herself '])
      assert_equal 'dry', TtsService.delivery_from_tags(['delivery: warm', 'delivery: dry'])
      assert_equal 'warm', TtsService.delivery_from_tags(['delivery: warm', 'delivery:   '])
      refute TtsService.delivery_tag?('deliverynote: x')
    end

    test "a note with nothing the key keeps, or over the limit, counts as no note (review R1 m3)" do
      %w[... … ¿? ...!].each { |n| assert_nil TtsService.delivery_from_tags(["delivery: #{n}"]), n }
      assert_nil TtsService.delivery_from_tags(['delivery: тихо']) # all non-ASCII: normalises to nothing
      assert_nil TtsService.clean_delivery('x' * (TtsService::MAX_DELIVERY_LENGTH + 1))
      assert_equal 'x' * TtsService::MAX_DELIVERY_LENGTH, TtsService.clean_delivery('x' * TtsService::MAX_DELIVERY_LENGTH)
      assert_equal 'warm', TtsService.delivery_from_tags(['delivery: warm', 'delivery: …'])
      # so it can never key a note-coloured take as the untagged clip
      assert_equal SAMPLE_KEY, TtsService.cache_key(*SAMPLE, '…')
    end

    test "Unicode spaces collapse like ASCII ones, on both sides (review R1 m4)" do
      nbsp = "quietly,\u00A0almost\u2009to herself"
      assert_equal 'quietly, almost to herself', TtsService.clean_delivery(nbsp)
      assert_equal 'quietly, almost to herself', TtsService.delivery_from_tags(["delivery: #{nbsp}"])
      assert_equal TtsService.cache_key(*SAMPLE, 'quietly, almost to herself'), TtsService.cache_key(*SAMPLE, nbsp)
    end

    # ─── Prompt ────────────────────────────────────────────────────────────

    test "the note joins the style for that line only, and the text is unchanged" do
      assert_equal 'Calm.', TtsService.speech_style('Calm.')
      assert_nil TtsService.speech_style(nil)
      assert_equal 'Calm. For this line only: quietly, almost to herself.',
                   TtsService.speech_style('Calm.', 'quietly, almost to herself')
      assert_equal 'For this line only: after a long pause.', TtsService.speech_style(nil, 'after a long pause.')
    end

    test "generate sends the note in the style annotation, keys and records it, and never speaks it" do
      Dir.mktmpdir('tts_delivery_gen') do |dir|
        real_cache = TtsService::CACHE_DIR
        TtsService.send(:remove_const, :CACHE_DIR)
        TtsService.const_set(:CACHE_DIR, Pathname.new(dir))
        captured = nil
        begin
          with_gemini_key do
            service = TtsService.new
            service.stub(:call_gemini_tts, ->(*args) { captured = args; "\x00\x00" * 50 }) do
              service.stub(:convert_pcm_to_mp3, ->(_pcm, mp3) { File.binwrite(mp3, 'mp3'); true }) do
                path = service.generate('Fine.', 'Puck', 'Nervous IT admin.', 'en-GB',
                                        scenario_name: 'walker_test', npc_id: 'kevin_park', delivery: 'after a long pause')
                assert_equal TtsService.cache_key('Fine.', 'Puck', 'Nervous IT admin.', 'en-GB', 'after a long pause'),
                             File.basename(path, '.mp3')
                assert_equal 'after a long pause', JSON.parse(File.read(path.sub_ext('.json')))['delivery']
              end
            end
          end
        ensure
          TtsService.send(:remove_const, :CACHE_DIR)
          TtsService.const_set(:CACHE_DIR, real_cache)
        end
        text, voice, style, language = captured
        assert_equal 'Fine.', text
        assert_equal 'Puck', voice
        assert_equal 'en-GB', language
        assert_equal 'Nervous IT admin. For this line only: after a long pause.', style
      end
    end

    test "call_gemini_tts puts the combined style in speech_metadata, not in the text" do
      captured = nil
      response = Net::HTTPOK.new('1.1', '200', 'OK')
      body = { 'steps' => [{ 'content' => [{ 'type' => 'audio', 'data' => Base64.strict_encode64("\x00\x00") }] }] }.to_json
      response.instance_variable_set(:@read, true)
      response.instance_variable_set(:@body, body)
      http = Object.new
      http.define_singleton_method(:use_ssl=) { |_| }
      http.define_singleton_method(:open_timeout=) { |_| }
      http.define_singleton_method(:read_timeout=) { |_| }
      http.define_singleton_method(:request) { |req| captured = req; response }

      with_gemini_key do
        Net::HTTP.stub(:new, http) do
          TtsService.new.send(:call_gemini_tts, 'Fine.', 'Puck', TtsService.speech_style('Calm.', 'quietly'), 'en-GB')
        end
      end
      content = JSON.parse(captured.body).dig('input', 0, 'content', 0)
      assert_equal 'Fine.', content['text']
      assert_equal [{ 'type' => 'speech_metadata', 'style' => 'Calm. For this line only: quietly.' }], content['annotations']
    end

    # ─── Which lines carry a note ──────────────────────────────────────────

    test "the walker keeps a delivery tag with its line, whether written after it or on the line above" do
      lines = InkLineWalker.from_file(BreakEscape::Engine.root.join(FIXTURE).to_s).lines
      by_text = lines.to_h { |l| [l.text, TtsService.delivery_from_tags(l.tags)] }
      assert_equal 'quietly, almost to herself', by_text["I suppose it doesn't matter now."]
      assert_equal 'after a long pause', by_text['Fine.']
      assert_nil by_text['An untagged line.']
      assert_equal 'dry', by_text['Two notes, the last wins.']
    end

    # ─── Parity with the client (review R1 M2) ─────────────────────────────

    PARITY_FIXTURES = %w[delivery_parity_edge delivery_parity_edge2 delivery_parity_diverts].freeze

    # For each fixture: every line inkjs shows (played as InkEngine#continue plays it,
    # every choice path) with the note the client sends, against InkLineWalker. A line
    # the walker reads must carry the client's note; a note the walker gives a line must
    # be one the client sends with it. Lines the walker leaves unresolved (glue, game
    # state) are voiced untagged by the endpoint, and dialoguelint warns about them.
    test "the walker gives each line the note inkjs gives it (tag above a divert, glue, counters)" do
      skip 'node not available' unless system('node --version', out: File::NULL, err: File::NULL)

      PARITY_FIXTURES.each do |name|
        json = BreakEscape::Engine.root.join("test/fixtures/files/ink_line_walker/#{name}.json").to_s
        out, err, status = Open3.capture3('node', BreakEscape::Engine.root.join('test/support/ink_delivery_lines.mjs').to_s, json)
        assert status.success?, "#{name}: #{err}"
        client = JSON.parse(out).to_set

        walker = InkLineWalker.from_file(json)
        server = walker.lines.to_set { |l| [l.raw, TtsService.delivery_from_tags(l.tags)] }
        read = walker.lines.to_set(&:raw)
        unread = walker.unresolved.map(&:text)

        client.each do |text, note|
          if read.include?(text)
            assert_includes server, [text, note], "#{name}: the walker misses the client's note for #{text.inspect}"
          else
            assert(unread.any? { |u| text.include?(u) }, "#{name}: #{text.inspect} is neither read nor unresolved")
          end
        end
        server.each do |text, note|
          next unless note

          assert_includes client, [text, note], "#{name}: the walker gives #{text.inspect} a note the client never sends"
        end
      end
    end

    test "a note above a divert lands on the target's first line, which is also listed untagged" do
      json = BreakEscape::Engine.root.join('test/fixtures/files/ink_line_walker/delivery_parity_diverts.json').to_s
      notes = InkLineWalker.from_file(json).lines.group_by(&:raw)
                           .transform_values { |ls| ls.map { |l| TtsService.delivery_from_tags(l.tags) } }
      assert_equal [nil, 'wary'], notes['Kevin Park: The shared line.']
      assert_equal [nil], notes['Kevin Park: After the shared line.']
      assert_equal [nil, 'to the stitch'], notes['Kevin Park: Second stitch.']
      assert_equal [nil], notes['Kevin Park: First stitch.']
      assert_equal [nil], notes['Kevin Park: Picked.'] # dropped before a choice, as inkjs drops it
      assert_equal [nil, 'past the logic'], notes['Kevin Park: After a little logic.']
      assert_equal ['own'], notes['Kevin Park: My own note.'] # its own tag wins over the carried one
    end

    test "the walker carries a delivery tag over an empty line, as the client does, and nothing else" do
      ink = { 'inkVersion' => 21, 'root' => [
        '#', '^delivery: softly', '/#', '#', '^speaker:player', '/#', "\n",
        '^Hello.', "\n", 'done'
      ] }
      line = InkLineWalker.new(ink).lines.first
      assert_equal 'Hello.', line.text
      assert_equal ['delivery: softly'], line.tags
    end

    def scenario
      {
        'player' => { 'displayName' => 'Agent Zero' },
        'narrator' => { 'id' => 'narrator', 'voice' => NARRATOR_VOICE },
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'kevin_park', 'displayName' => 'Kevin Park', 'npcType' => 'person',
                'voice' => KEVIN_VOICE, 'storyPath' => FIXTURE }
            ]
          }
        }
      }
    end

    test "the extractor lists each tagged line with its note and keys it as the client will request it" do
      extractor = TtsLineExtractor.new('walker_test', scenario)
      by_text = extractor.entries.to_h { |e| [e.text, e] }
      quiet = by_text["I suppose it doesn't matter now."]
      assert_equal 'quietly, almost to herself', quiet.delivery
      assert_equal TtsService.cache_key(quiet.text, 'Puck', 'Nervous IT admin.', 'en-GB', 'quietly, almost to herself'), quiet.key

      plain = by_text['An untagged line.']
      assert_nil plain.delivery
      assert_equal TtsService.cache_key(plain.text, 'Puck', 'Nervous IT admin.', 'en-GB'), plain.key

      narr = by_text['The lights hum.']
      assert_equal 'narrator', narr.npc_id
      assert_equal 'hushed', narr.delivery
      refute by_text.key?("I'll take it from here.")

      assert_includes extractor.keys, quiet.key
      # The ink's own note comes back, whatever spelling of it the client sent
      assert_equal 'quietly, almost to herself',
                   extractor.delivery_for('kevin_park', "I suppose it doesn't matter now.", 'Quietly, almost to herself.')
      assert_equal 'quietly, almost to herself',
                   extractor.delivery_for('kevin_park', "I suppose it doesn't matter now.",
                                          "quietly almost to herself \uFF53\uFF48\uFF4F\uFF55\uFF54 \u{1F600}")
      assert_nil extractor.delivery_for('kevin_park', "I suppose it doesn't matter now.", 'shouting')
      assert extractor.delivered_by?('kevin_park', "I suppose it doesn't matter now.", 'Quietly, almost to herself.')
      refute extractor.delivered_by?('kevin_park', "I suppose it doesn't matter now.", 'shouting')
      refute extractor.delivered_by?('kevin_park', 'An untagged line.', 'quietly')
      refute extractor.delivered_by?('narrator', "I suppose it doesn't matter now.", 'quietly, almost to herself')
    end

    test "a voiced phone call's lines carry no note (phone-call-voice.js doesn't send one)" do
      data = scenario
      kevin = data['rooms']['office']['npcs'].first
      kevin['npcType'] = 'phone'
      kevin['voiced'] = true
      extractor = TtsLineExtractor.new('walker_test', data)
      assert(extractor.entries.all? { |e| e.delivery.nil? })
      refute extractor.delivered_by?('kevin_park', "I suppose it doesn't matter now.", 'quietly, almost to herself')
    end

    test "expected lines (the pruner's set) include the tagged key" do
      Dir.mktmpdir('tts_delivery_expected') do |dir|
        root = Pathname.new(dir)
        FileUtils.mkdir_p(root.join('delivery_fixture', 'ink'))
        FileUtils.cp(BreakEscape::Engine.root.join(FIXTURE), root.join('delivery_fixture', 'ink', 'kevin.json'))
        data = scenario
        data['rooms']['office']['npcs'].first['storyPath'] = 'scenarios/delivery_fixture/ink/kevin.json'
        File.write(root.join('delivery_fixture', 'scenario.json.erb'), JSON.generate(data))

        expected = TtsExpectedLines.new('delivery_fixture', scenarios_dir: root, runtime_walk: false).build!
        text = "I suppose it doesn't matter now."
        assert expected.include_key?(TtsService.cache_key(text, 'Puck', 'Nervous IT admin.', 'en-GB', 'quietly, almost to herself'))
        assert expected.include_key?(TtsService.cache_key(text, 'Puck', 'Nervous IT admin.', 'en-GB'))
        refute expected.include_key?(TtsService.cache_key(text, 'Puck', 'Nervous IT admin.', 'en-GB', 'shouting'))
      end
    end

    test "tts:wasted counts a tagged clip as current-model by its sidecar's note" do
      Dir.mktmpdir('tts_delivery_wasted') do |dir|
        scen = Pathname.new(dir).join('walker_test')
        FileUtils.mkdir_p(scen)
        key = TtsService.cache_key('Fine.', 'Puck', 'Nervous IT admin.', 'en-GB', 'after a long pause')
        File.binwrite(scen.join("#{key}.mp3"), 'mp3')
        TtsService.new.write_sidecar(scen.join("#{key}.mp3"), 'Fine.', 'Puck', 'Nervous IT admin.', 'en-GB', 'walker_test',
                                     delivery: 'after a long pause')
        result = TtsWastedClips.scan('walker_test', expected_keys: Set[key], cache_dir: dir)
        assert_equal 1, result.current
        assert_empty result.wasted
      end
    end

    private

    def with_gemini_key
      old = ENV['GEMINI_API_KEY']
      ENV['GEMINI_API_KEY'] = 'dummy_key_for_test'
      yield
    ensure
      ENV['GEMINI_API_KEY'] = old
    end
  end
end
