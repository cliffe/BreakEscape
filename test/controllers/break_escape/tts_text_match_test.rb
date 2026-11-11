require 'test_helper'
require 'minitest/mock'
require 'fileutils'
require 'tmpdir'

module BreakEscape
  # The /tts `text` parameter only chooses a line of the scenario. What is
  # voiced, keyed and cached is the scenario's own text for that line, so
  # characters the cache key ignores (lookalike letters from other scripts,
  # zero-width and bidi marks, other Unicode forms) can neither add paid words
  # to a clip nor replace the clip every other player hears.
  class TtsTextMatchTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    STORY = "test/fixtures/files/ink_line_walker/text_match_fixture.json".freeze
    PHONE_STORY = "test/fixtures/files/ink_line_walker/phone_call_host.json".freeze
    KEVIN = { "name" => "Puck", "style" => "Nervous IT admin.", "language" => "en-GB" }.freeze
    LINE = "The server room is down the hall.".freeze
    QUIET_LINE = "I suppose it doesn't matter now.".freeze
    QUIET_NOTE = "quietly, almost to herself".freeze
    INTERCOM_TEXT = "Welcome to the security system. Please verify your identity.".freeze
    BARK = "Major incident declared, everyone to the floor!".freeze
    FAKE_MP3 = ("\xFF\xFB\x90\x00" + ("\x00" * 128)).b.freeze

    # Text the key's normaliser (ASCII letters, digits, "_" and spaces) drops
    # entirely, so before this fix each of these reached the voice under the
    # real line's key.
    LOOKALIKE_WORDS = {
      "Cyrillic" => "ВУУ СОІNЅ",
      "Greek" => "ΒΥΥ ΤΟΚΕΝΣ",
      "fullwidth Latin" => "ＢＵＹ ＣＯＩＮＳ",
      "small capitals" => "ʙᴜʏ ᴄᴏɪɴꜱ",
      "mathematical bold" => "𝐁𝐔𝐘 𝐂𝐎𝐈𝐍𝐒",
      "Cherokee" => "ᏴᎩ ᏟᎾᏆᏁᏚ"
    }.freeze

    INVISIBLES = {
      "zero-width space" => "​",
      "zero-width joiner" => "‍",
      "zero-width non-joiner" => "‌",
      "word joiner" => "⁠",
      "byte order mark" => "﻿",
      "right-to-left override" => "‮",
      "left-to-right isolate" => "⁦",
      "pop directional isolate" => "⁩",
      "soft hyphen" => "­"
    }.freeze

    setup do
      TtsGenerationLimit.reset!
      @cache_root = Pathname.new(Dir.mktmpdir("tts_text_match"))
      @real_cache = TtsService::CACHE_DIR
      TtsService.send(:remove_const, :CACHE_DIR)
      TtsService.const_set(:CACHE_DIR, @cache_root)

      @mission = break_escape_missions(:ceo_exfil)
      @saved_voice_cache = Mission.voice_config_cache[@mission.name]
      mtime = File.mtime(@mission.scenario_path.join("scenario.json.erb"))
      Mission.voice_config_cache[@mission.name] = { mtime: mtime, configs: {}.freeze }

      @game = Game.create!(
        mission: @mission,
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          "startRoom" => "lobby",
          "narrator" => { "id" => "narrator", "skipTextValidation" => true,
                          "voice" => { "name" => "Algenib", "style" => "Narrator.", "language" => "en-GB" } },
          "rooms" => {
            "lobby" => {
              "npcs" => [
                { "id" => "kevin_park", "displayName" => "Kevin Park", "npcType" => "person",
                  "voice" => KEVIN, "storyPath" => STORY },
                { "id" => "agent_0x99", "displayName" => "Agent HaX", "npcType" => "phone",
                  "voice" => { "name" => "Aoede", "style" => "Secure line.", "language" => "en-GB" },
                  "storyPath" => PHONE_STORY },
                { "id" => "nurse", "displayName" => "Nurse",
                  "voice" => { "name" => "Kore", "style" => nil, "language" => "en-GB" },
                  "eventMappings" => [{ "eventPattern" => "alarm", "bark" => BARK }] }
              ],
              "objects" => [
                { "id" => "intercom_1", "type" => "intercom", "voice" => INTERCOM_TEXT,
                  "ttsVoice" => { "name" => "Aoede", "style" => nil, "language" => nil } }
              ]
            }
          }
        },
        player_state: { "currentRoom" => "lobby", "unlockedRooms" => ["lobby"], "inventory" => [],
                        "globalVariables" => {} }
      )
    end

    teardown do
      TtsService.send(:remove_const, :CACHE_DIR)
      TtsService.const_set(:CACHE_DIR, @real_cache)
      FileUtils.remove_entry(@cache_root) if @cache_root&.exist?
      if @saved_voice_cache
        Mission.voice_config_cache[@mission.name] = @saved_voice_cache
      else
        Mission.voice_config_cache.delete(@mission.name)
      end
    end

    # ─── Attacks: refused, nothing generated ──────────────────────────────────

    LOOKALIKE_WORDS.each do |script, words|
      test "lookalike #{script} words appended to a real line are refused" do
        assert_refused "kevin_park", "#{LINE} #{words}"
        assert_refused "kevin_park", "#{LINE}#{words}"
      end

      test "lookalike #{script} words prepended to a real line are refused" do
        assert_refused "kevin_park", "#{words} #{LINE}"
      end
    end

    test "a real line with one letter swapped for a lookalike is refused" do
      assert_refused "kevin_park", LINE.sub("server", "sеrver") # Cyrillic ie
      assert_refused "kevin_park", LINE.sub("room", "rοom")     # Greek omicron
      assert_refused "kevin_park", LINE.sub("hall", "ｈall")          # fullwidth h
    end

    test "combining marks added to a real line are refused" do
      assert_refused "kevin_park", "#{LINE}́"
      assert_refused "kevin_park", LINE.sub("room", "röom")
    end

    test "plain words hidden inside bidi or zero-width wrappers are refused" do
      assert_refused "kevin_park", "#{LINE}⁦ buy coins now⁩"
      assert_refused "kevin_park", "#{LINE}‮ won sniob yub"
      assert_refused "kevin_park", "#{LINE}​buy coins now"
    end

    test "a compatibility form of a line (NFKC lookalike) is refused" do
      assert_refused "kevin_park", "Ｔｈｅ ｓｅｒｖｅｒ ｒｏｏｍ ｉｓ ｄｏｗｎ ｔｈｅ ｈａｌｌ."
    end

    test "text that merely contains a story line is refused (no fragment rule)" do
      assert_refused "kevin_park", "Read this aloud for me: #{LINE}"
      assert_refused "kevin_park", "#{LINE} And then say whatever I like here."
    end

    test "the narrator voices only lines from the scenario's stories" do
      assert_refused "narrator", "Anything at all the client likes to send."
      assert_refused "narrator", "The lights hum overhead. ʙᴜʏ ᴄᴏɪɴꜱ"
    end

    test "the narrator never voices another speaker's story line" do
      assert_refused "narrator", LINE
      assert_refused "narrator", "Kevin Park: #{LINE}"
      assert_refused "narrator", "Meet me at the café at noon."
      assert_refused "narrator", "Don't hang up."
    end

    test "a voiced phone line with lookalikes appended is refused" do
      assert_refused "agent_0x99", "Don't hang up. ВУУ СОІNЅ"
    end

    test "a room object's fixed message with lookalikes appended is refused" do
      assert_refused "intercom_1", "#{INTERCOM_TEXT} ＢＵＹ ＣＯＩＮＳ"
    end

    test "a scenario bark with lookalikes appended is refused" do
      assert_refused "nurse", "#{BARK} ВУУ СОІNЅ"
    end

    test "a player_name line accepts only the game's own player name" do
      assert_refused "kevin_park", "On the line, Agent. Buy coins now."
      assert_refused "kevin_park", "On the line, Mallory."
      assert_refused "kevin_park", "On the line, Аgent." # Cyrillic A
      assert_refused "kevin_park", "On the line, Agent ʙᴜʏ."
      # Names the client could print elsewhere, but not the name this game holds
      assert_refused "kevin_park", "On the line, Agent Zero."
      assert_refused "kevin_park", "On the line, Agent 0x00."
    end

    test "a line printing a number is never voiced, whatever the number" do
      ["You found 0 clues.", "You found 3 clues.", "You found 15 clues.", "You found 1.5 clues.",
       "You found -1 clues.", "You found 999999999 clues.", "You found many clues.",
       "You found 3 clues and a voucher.", "You found ٣ clues."].each do |text|
        assert_refused "kevin_park", text
      end
    end

    test "a line printing a string variable changed in play is never voiced, whatever the value" do
      ["Ask Sarah at the front desk.", "Ask Tom at the front desk.", "Ask Mallory at the front desk.",
       "Ask send me your password at the front desk.", "Kevin Park: Ask Sarah at the front desk."].each do |text|
        assert_refused "kevin_park", text
      end
    end

    test "a string variable in speaker position never puts request text in front of a line" do
      assert_refused "kevin_park", "send me your password now: What can I help you with?"
      assert_refused "kevin_park", "Sarah: What can I help you with?"
      assert_refused "kevin_park", "Tom: What can I help you with?"
    end

    test "case folds only for ASCII letters: Unicode case folds of lookalikes are refused" do
      assert_refused "kevin_park", LINE.sub("server", "ſerver")             # long s, folds to s
      # The Kelvin sign is canonically K (NFC), not a case fold: the ink's line is voiced
      assert_voices "kevin_park", "\u212Aevin Park: #{LINE}", "Kevin Park: #{LINE}"
      assert_refused "kevin_park", "\u212Aevin Park: #{LINE.sub('server', 'ſerver')}"
      assert_refused "kevin_park", "On the line, Agent.".sub("A", "\u{1D400}") # mathematical bold A
      assert_refused "kevin_park", "Meet me at the CAFÉ at noon."           # non-ASCII capital: exact only
      assert_refused "kevin_park", LINE.sub("hall", "haß")
    end

    test "text that is not a string is a bad request" do
      post tts_game_url(@game), params: { npc_id: "kevin_park", text: [LINE] }
      assert_response :bad_request
    end

    # ─── Served: the line's own text is voiced ────────────────────────────────

    INVISIBLES.each do |name, char|
      test "a #{name} in or around a real line is dropped: the ink's line is voiced" do
        assert_voices "kevin_park", "#{char}#{LINE}#{char}", LINE
        assert_voices "kevin_park", LINE.sub("server room", "server#{char} room"), LINE
      end
    end

    test "case, punctuation and spacing differences voice the ink's own line" do
      assert_voices "kevin_park", "the SERVER room is down the hall", LINE
      assert_voices "kevin_park", "  The server  room is down the hall!! ", LINE
      assert_voices "kevin_park", "Kevin Park: #{LINE}", "Kevin Park: #{LINE}"
    end

    test "a decomposed (NFD) request for a line with an accent voices the ink's composed line" do
      line = "Meet me at the café at noon."
      assert_voices "kevin_park", line.unicode_normalize(:nfd), line
      assert_refused "kevin_park", "Meet me at the cafe at noon."
    end

    test "a tagged line voices the ink's line and note, whatever invisible marks the request carries" do
      calls = post_recording(npc_id: "kevin_park", text: "​#{QUIET_LINE}‮", delivery: QUIET_NOTE)
      assert_equal 1, calls.size
      assert_equal QUIET_LINE, calls.first[:args][0]
      assert_equal QUIET_NOTE, calls.first[:kwargs][:delivery]
    end

    test "a player_name line voices the ink's text around the game's player name, not the request's spelling" do
      assert_voices "kevin_park", "On the line, Agent.", "On the line, Agent."
      assert_voices "kevin_park", "on the line AGENT", "On the line, Agent."
    end

    test "the narrator voices its own Narrator: lines, including one that prints the player name" do
      assert_voices "narrator", "The phone buzzes for Agent.", "The phone buzzes for Agent."
      assert_refused "narrator", "The phone buzzes for Agent Zero."
    end

    test "a glued line voices the joined ink text" do
      assert_voices "kevin_park", "The first half and the glued half.", "The first half and the glued half."
    end

    test "the narrator's line voices the story's text" do
      assert_voices "narrator", "the lights hum overhead​", "The lights hum overhead."
    end

    test "a voiced phone line voices the story's text" do
      assert_voices "agent_0x99", "Don't hang up‍", "Don't hang up."
    end

    test "a room object voices its own fixed message" do
      assert_voices "intercom_1", "welcome to the security system please verify your identity﻿", INTERCOM_TEXT
    end

    test "a bark voices the scenario's own text" do
      assert_voices "nurse", "major incident declared everyone to the floor", BARK
    end

    # ─── Cache: the key is the line's, the clip is never replaced ─────────────

    test "a request with invisible marks is served the line's existing clip, with no generation" do
      clip = write_clip(TtsService.cache_key(LINE, *KEVIN.values))
      service = TtsService.new
      service.define_singleton_method(:enabled?) { true }
      service.define_singleton_method(:generate) { |*_a, **_k| flunk "generated a line that already had a clip" }
      TtsService.stub(:new, service) do
        post tts_game_url(@game), params: { npc_id: "kevin_park", text: "#{LINE}​‮" }
      end
      assert_response :success
      assert_equal FAKE_MP3, File.binread(clip)
    end

    test "the key the endpoint generates under is the line's key, and its sidecar holds the line's text" do
      service = TtsService.new
      service.define_singleton_method(:enabled?) { true }
      service.define_singleton_method(:call_gemini_tts) do |text, *_rest|
        raise "voiced #{text.inspect}" unless text == LINE

        "\x00\x00" * 2400
      end
      TtsService.stub(:new, service) do
        post tts_game_url(@game), params: { npc_id: "kevin_park", text: "⁦#{LINE}⁩" }
      end
      assert_response :success
      mp3 = @cache_root.join(@mission.name, "#{TtsService.cache_key(LINE, *KEVIN.values)}.mp3")
      assert File.exist?(mp3), "clip under the line's own key"
      assert_equal LINE, JSON.parse(File.read(mp3.sub_ext(".json")))["text"]
    end

    # ─── Generation limit ─────────────────────────────────────────────────────

    test "a game over its generation limit gets 429 and nothing is generated" do
      TtsGenerationLimit.stub(:allow?, false) do
        calls = post_recording(npc_id: "kevin_park", text: LINE)
        assert_response :too_many_requests
        assert_empty calls
        assert response.headers["Retry-After"].present?
      end
    end

    test "a cached clip is served whatever the generation limit, and does not count" do
      write_clip(TtsService.cache_key(LINE, *KEVIN.values))
      TtsGenerationLimit.stub(:allow?, ->(*) { flunk "a cache hit was counted" }) do
        calls = post_recording(npc_id: "kevin_park", text: LINE)
        assert_response :success
        assert_empty calls
      end
    end

    test "each generation counts against the game's limit" do
      seen = []
      TtsGenerationLimit.stub(:allow?, ->(id, **) { seen << id; true }) do
        post_recording(npc_id: "kevin_park", text: LINE)
        post_recording(npc_id: "kevin_park", text: QUIET_LINE)
      end
      assert_equal [@game.id, @game.id], seen
    end

    # ─── Keys: no two accepted texts share a key ──────────────────────────────

    test "property: lookalike mutations of real requests never give two voiced texts one key" do
      requests = ["The server room is down the hall.", "I suppose it doesn't matter now.",
                  "On the line, Agent.", "The first half and the glued half.", "Meet me at the café at noon.",
                  "What can I help you with?", "The lights hum overhead.", "Kevin Park: #{LINE}"]
      story = Engine.root.join(STORY).to_s
      base = requests.map { |r| InkTextValidator.canonical(story, r) }
      assert base.all?, "every base request is a line"
      voiced_by_key = Hash.new { |h, k| h[k] = Set.new }
      base.each { |line| voiced_by_key[TtsService.cache_key(line, *KEVIN.values)] << line }

      rng = Random.new(20261111)
      accepted = refused = 0
      requests.each do |request|
        300.times do
          mutated = mutate(request, rng)
          line = InkTextValidator.canonical(story, mutated)
          next refused += 1 unless line

          accepted += 1
          assert_includes base, line, "#{mutated.inspect} voiced text that is not a line"
          voiced_by_key[TtsService.cache_key(line, *KEVIN.values)] << line
          # Accepted only if the mutation changed nothing the match keeps
          assert_equal TtsService.match_form(request), TtsService.match_form(mutated), mutated.inspect
        end
      end
      assert_operator accepted, :>, 100
      assert_operator refused, :>, 100
      voiced_by_key.each { |key, texts| assert_equal 1, texts.size, "#{key}: #{texts.to_a.inspect}" }
    end

    # ─── match_form itself ────────────────────────────────────────────────────

    test "match_form folds ASCII case only" do
      assert_equal "key", TtsService.match_form("KEY")
      # U+212A is canonically "K" (NFC), then ASCII-folded; long s has no such equivalence
      assert_equal "key", TtsService.match_form("\u212Aey")
      refute_equal "secret", TtsService.match_form("ſecret")
      assert_equal "Éclair", TtsService.match_form("Éclair")
      refute_equal TtsService.match_form("éclair"), TtsService.match_form("Éclair")
    end

    test "match_form keeps letters of every script and drops punctuation and invisibles" do
      assert_equal "the server room", TtsService.match_form("The​ server, room!")
      assert_equal "café", TtsService.match_form("Café.")
      assert_equal "a b", TtsService.match_form("a b")
      refute_equal TtsService.match_form(LINE), TtsService.match_form("#{LINE} ВУУ")
      assert_nil TtsService.match_form("\xFF\xFE".dup.force_encoding("BINARY"))
      assert_nil TtsService.match_form(["a"])
    end

    private

    def post_recording(params)
      calls = []
      service = TtsService.new
      service.define_singleton_method(:enabled?) { true }
      service.define_singleton_method(:generate) do |*args, **kwargs|
        calls << { args: args, kwargs: kwargs }
        nil
      end
      saved = ENV["GEMINI_API_KEY"]
      ENV["GEMINI_API_KEY"] = "dummy_key_for_test"
      TtsService.stub(:new, service) { post tts_game_url(@game), params: params }
      calls
    ensure
      saved.nil? ? ENV.delete("GEMINI_API_KEY") : ENV["GEMINI_API_KEY"] = saved
    end

    def assert_refused(npc_id, text)
      calls = post_recording(npc_id: npc_id, text: text)
      assert_response :forbidden, "#{npc_id}: #{text.inspect}"
      assert_empty calls, "generated for #{text.inspect}"
    end

    def assert_voices(npc_id, text, expected)
      calls = post_recording(npc_id: npc_id, text: text)
      assert_equal 1, calls.size, "#{npc_id}: #{text.inspect} (#{response.status})"
      assert_equal expected, calls.first[:args][0]
    end

    # Lookalike letters, case folds, combining marks, invisibles and
    # punctuation, one to three at random places.
    LOOKALIKE_SWAPS = {
      "s" => ["ſ", "ѕ", "ｓ"], "k" => ["\u212A", "ｋ"], "K" => ["\u212A", "Ｋ"], "a" => ["а", "ａ"],
      "A" => ["А", "\u{1D400}"], "o" => ["ο", "о", "ｏ"], "e" => ["е", "ｅ"], "i" => ["і", "ı"], "h" => ["һ"]
    }.freeze
    INSERTS = ["\u0301", "\u0308", "\u200B", "\u202E", "\u00AD", "\uFEFF", ".", "!", "  ", "ß", "\u00A0"].freeze

    def mutate(text, rng)
      chars = text.chars
      rng.rand(1..3).times do
        i = rng.rand(chars.length)
        case rng.rand(4)
        when 0
          swaps = LOOKALIKE_SWAPS[chars[i]]
          chars[i] = swaps.sample(random: rng) if swaps
        when 1 then chars.insert(i, INSERTS.sample(random: rng))
        when 2 then chars[i] = chars[i].match?(/[a-z]/) ? chars[i].upcase : chars[i].downcase
        else chars[i] = "\u{FF00}".ord.+(chars[i].ord - 0x20).chr(Encoding::UTF_8) if chars[i].match?(/[!-~]/)
        end
      end
      chars.join
    end

    def write_clip(key)
      dir = @cache_root.join(@mission.name)
      FileUtils.mkdir_p(dir)
      path = dir.join("#{key}.mp3")
      File.binwrite(path, FAKE_MP3)
      path
    end
  end
end
