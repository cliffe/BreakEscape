require 'test_helper'
require 'minitest/mock'
require 'digest'
require 'fileutils'

module BreakEscape
  class TtsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    VOICE_TEXT = "Welcome to the security system. Please verify your identity.".freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)

      # Scenario with:
      #   - a room NPC with Hash voice + storyPath (ink_npc)  — validated via InkTextValidator
      #   - a room object with String voice + ttsVoice (intercom_1) — validated by text match
      #   - a room object with no voice config (silent_box)   — should 400
      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          "startRoom" => "lobby",
          "rooms" => {
            "lobby" => {
              "npcs" => [
                {
                  "id"        => "ink_npc",
                  "voice"     => { "name" => "Kore", "style" => "Speak formally.", "language" => "en-GB" },
                  "storyPath" => "scenarios/test/story"
                }
              ],
              "objects" => [
                {
                  "id"       => "intercom_1",
                  "type"     => "intercom",
                  "voice"    => VOICE_TEXT,
                  "ttsVoice" => { "name" => "Aoede", "style" => nil, "language" => nil }
                },
                {
                  "id"   => "silent_box",
                  "type" => "box"
                }
              ]
            }
          }
        },
        player_state: {
          "currentRoom"      => "lobby",
          "unlockedRooms"    => ["lobby"],
          "unlockedObjects"  => [],
          "inventory"        => [],
          "encounteredNPCs"  => [],
          "globalVariables"  => {},
          "biometricSamples" => [],
          "biometricUnlocks" => [],
          "bluetoothDevices" => [],
          "notes"            => [],
          "health"           => 100
        }
      )
    end

    # ─── Parameter validation ────────────────────────────────────────────────

    test "tts returns 400 when npc_id is missing" do
      post tts_game_url(@game), params: { text: "Hello" }
      assert_response :bad_request
      assert_match(/npc_id|text/i, json_body["error"])
    end

    test "tts returns 400 when text is missing" do
      post tts_game_url(@game), params: { npc_id: "intercom_1" }
      assert_response :bad_request
      assert_match(/npc_id|text/i, json_body["error"])
    end

    test "tts returns 400 when text exceeds 1000 characters" do
      post tts_game_url(@game), params: {
        npc_id: "intercom_1",
        text:   "a" * 1001
      }
      assert_response :bad_request
      assert_match(/too long/i, json_body["error"])
    end

    test "tts returns 404 when NPC does not exist in scenario" do
      post tts_game_url(@game), params: {
        npc_id: "nonexistent_entity",
        text:   "Hello world"
      }
      assert_response :not_found
      assert_match(/not found/i, json_body["error"])
    end

    test "tts returns 400 when object has no voice configuration" do
      post tts_game_url(@game), params: {
        npc_id: "silent_box",
        text:   "Hello world"
      }
      assert_response :bad_request
      assert_match(/no voice/i, json_body["error"])
    end

    # ─── TTS service disabled ────────────────────────────────────────────────

    test "tts returns 503 when GEMINI_API_KEY is not set" do
      # Remove any on-disk cache for this text so the service can't return a hit.
      # The file may live in a scenario subdirectory, so search recursively.
      normalized = VOICE_TEXT.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
      cache_key  = Digest::MD5.hexdigest("#{normalized}|Aoede||")
      cached     = Dir.glob(TtsService::CACHE_DIR.join("**", "#{cache_key}.mp3"))
      moved      = cached.map { |f| [f, "#{f}.bak"] }
      moved.each { |src, dst| FileUtils.mv(src, dst) }

      with_env("GEMINI_API_KEY" => nil) do
        post tts_game_url(@game), params: {
          npc_id: "intercom_1",
          text:   VOICE_TEXT
        }
        assert_response :service_unavailable
        assert_match(/not configured|GEMINI_API_KEY/i, json_body["error"])
      end
    ensure
      moved&.each { |src, dst| FileUtils.mv(dst, src) if File.exist?(dst) }
    end

    # ─── Text validation for room objects (voice as String) ──────────────────

    test "tts returns 403 when text does not match intercom voice message" do
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "intercom_1",
          text:   "This text is completely unrelated to the intercom message."
        }
        assert_response :forbidden
        assert_match(/not found/i, json_body["error"])
      end
    end

    test "tts passes text validation for intercom before reaching TTS generation" do
      # When text matches the stored voice message, validation passes.
      # We use a mock TtsService so no real API call is made.
      # If generate returns nil, the controller returns 500 (generation failed),
      # which proves validation succeeded (403 would have been returned otherwise).
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:enabled?, true)
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: {
            npc_id: "intercom_1",
            text:   VOICE_TEXT
          }
        end

        # 500 means we got past the 403-text-validation gate
        assert_response :internal_server_error
        mock_service.verify
      end
    end

    # ─── Gemini quota exhausted (approval log E5) ────────────────────────────

    test "tts returns 429 with a clear message and Retry-After when the Gemini quota is exhausted" do
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        quota_service = Object.new
        quota_service.define_singleton_method(:generate) { |*_args, **_kw| raise TtsService::QuotaExhaustedError.new(52) }

        TtsService.stub(:new, quota_service) do
          post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
        end

        assert_response :too_many_requests
        assert_match(/quota/i, json_body["error"])
        assert_equal 52, json_body["retry_after"]
        assert_equal "52", response.headers["Retry-After"]
      end
    end

    test "tts returns 429 without Retry-After when the quota error carries no delay" do
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        quota_service = Object.new
        quota_service.define_singleton_method(:generate) { |*_args, **_kw| raise TtsService::QuotaExhaustedError.new }

        TtsService.stub(:new, quota_service) do
          post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
        end

        assert_response :too_many_requests
        assert_nil response.headers["Retry-After"]
      end
    end

    test "TtsService.generate lets a quota error through instead of turning it into nil" do
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        service = TtsService.new
        service.define_singleton_method(:call_gemini_tts) { |*_args| raise TtsService::QuotaExhaustedError.new(10) }

        assert_raises(TtsService::QuotaExhaustedError) do
          service.generate("A line nobody has cached #{SecureRandom.hex(8)}", "Kore", nil, nil, scenario_name: "quota_test")
        end
      end
    end

    # ─── Ink NPC — story file not found ─────────────────────────────────────

    test "tts returns 404 when ink story file cannot be resolved" do
      # The ink_npc storyPath ("scenarios/test/story") does not exist on disk
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "ink_npc",
          text:   "Any text"
        }
        assert_response :not_found
        assert_match(/story file not found/i, json_body["error"])
      end
    end

    # ─── Ink NPC — text not in story ─────────────────────────────────────────

    test "tts returns 403 when text is not found in ink story" do
      # Place a fake compiled Ink JSON relative to BreakEscape::Engine.root so
      # resolve_and_compile_ink can find it (it joins storyPath with engine root).
      tmp_dir      = BreakEscape::Engine.root.join("tmp", "tts_ink_test_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      fake_json    = tmp_dir.join("story.json")
      story_path   = "tmp/tts_ink_test_#{Process.pid}/story.json"

      File.write(fake_json, { "inkVersion" => 21, "root" => ["^Narrator: Hello world", "done"] }.to_json)

      # Point the ink_npc's storyPath at our temp file
      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        {
          "id"        => "ink_npc",
          "voice"     => { "name" => "Kore", "style" => "Speak formally.", "language" => "en-GB" },
          "storyPath" => story_path
        }
      ]
      @game.save!

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "ink_npc",
          text:   "Text that is definitely not in the fake story at all"
        }
      end

      assert_response :forbidden
      assert_match(/not found/i, json_body["error"])
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
    end

    # ─── Ink NPC — bark text valid even when not in Ink story ────────────────
    #
    # An NPC can have both a storyPath AND scenario-defined barks.  The bark text
    # won't appear in the Ink JSON, but it must still pass validation.

    test "tts accepts bark text for ink NPC when text is in eventMappings bark" do
      # Bark text is intentionally absent from the Ink story — must still pass validation.
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_bark_ink_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      fake_json  = tmp_dir.join("story.json")
      story_path = "tmp/tts_bark_ink_#{Process.pid}/story.json"

      File.write(fake_json, { "inkVersion" => 21, "root" => ["^NPC: Story line only.", "done"] }.to_json)

      bark_text = "I'm coming!"

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        {
          "id"        => "ink_npc",
          "voice"     => { "name" => "Kore", "style" => nil, "language" => nil },
          "storyPath" => story_path,
          "eventMappings" => [{ "eventPattern" => "foo", "bark" => bark_text }]
        }
      ]
      @game.save!

      # Use a mock so we don't depend on cache paths; a 500 (generation failed) proves
      # we passed the 403 validation gate — that's the behaviour under test here.
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:enabled?, true)
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: { npc_id: "ink_npc", text: bark_text }
        end

        assert_response :internal_server_error
        assert_match(/failed/i, json_body["error"])
        mock_service.verify
      end
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
    end

    test "tts returns 403 for ink NPC when text is neither in story nor in barks" do
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_bark_forbidden_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      fake_json  = tmp_dir.join("story.json")
      story_path = "tmp/tts_bark_forbidden_#{Process.pid}/story.json"

      File.write(fake_json, { "inkVersion" => 21, "root" => ["^NPC: Story line only.", "done"] }.to_json)

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        {
          "id"        => "ink_npc",
          "voice"     => { "name" => "Kore", "style" => nil, "language" => nil },
          "storyPath" => story_path,
          "eventMappings" => [{ "eventPattern" => "foo", "bark" => "Known bark." }]
        }
      ]
      @game.save!

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "ink_npc",
          text:   "Text not in story or barks at all"
        }
      end

      assert_response :forbidden
      assert_match(/not found/i, json_body["error"])
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
    end

    # ─── Bark-only NPC (voice Hash, no storyPath) ────────────────────────────

    test "tts accepts bark text for voice-only NPC (no storyPath) with matching bark" do
      # NPC has a voice Hash but no storyPath — validated via ScenarioBarkValidator.
      # A 500 (generation failed) after a mock proves we passed the 403 validation gate.
      bark_text = "Patient alert received"

      @game.scenario_data["rooms"]["lobby"]["npcs"] << {
        "id"    => "bark_only_npc",
        "voice" => { "name" => "Charon", "style" => nil, "language" => nil },
        "eventMappings" => [{ "eventPattern" => "x", "bark" => bark_text }]
      }
      @game.save!

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:enabled?, true)
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: { npc_id: "bark_only_npc", text: bark_text }
        end

        assert_response :internal_server_error
        assert_match(/failed/i, json_body["error"])
        mock_service.verify
      end
    end

    test "tts returns 403 for voice-only NPC (no storyPath) with unrecognised text" do
      @game.scenario_data["rooms"]["lobby"]["npcs"] << {
        "id"    => "bark_only_npc",
        "voice" => { "name" => "Charon", "style" => nil, "language" => nil },
        "eventMappings" => [{ "eventPattern" => "x", "bark" => "Known bark text." }]
      }
      @game.save!

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "bark_only_npc",
          text:   "Completely unrecognised text that was never in the scenario"
        }
      end

      assert_response :forbidden
      assert_match(/not found/i, json_body["error"])
    end

    # ─── Co-speaker NPC (voice Hash, no storyPath, lines in another NPC's story) ─
    #
    # E.g. a director who only speaks inside an agent's briefing cutscene: the line is in
    # the agent's Ink story, not in the director's barks.

    test "tts accepts co-speaker line found in another NPC's ink story" do
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_cospeaker_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      story_path = "tmp/tts_cospeaker_#{Process.pid}/story.json"
      line       = "The board meets at dawn."
      File.write(tmp_dir.join("story.json"),
                 { "inkVersion" => 21, "root" => ["^Director: #{line}", "done"] }.to_json)

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        { "id" => "briefing_npc", "voice" => { "name" => "Kore", "style" => nil, "language" => nil },
          "storyPath" => story_path },
        { "id" => "director", "voice" => { "name" => "Charon", "style" => nil, "language" => nil } }
      ]
      @game.save!

      # A 500 (generation failed) after a mock proves we passed the 403 validation gate.
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:enabled?, true)
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: { npc_id: "director", text: line }
        end

        assert_response :internal_server_error
        mock_service.verify
      end
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
    end

    test "tts returns 403 for co-speaker text that is in no scenario story" do
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_cospeaker_no_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      story_path = "tmp/tts_cospeaker_no_#{Process.pid}/story.json"
      File.write(tmp_dir.join("story.json"),
                 { "inkVersion" => 21, "root" => ["^Director: A real line.", "done"] }.to_json)

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        { "id" => "briefing_npc", "voice" => { "name" => "Kore", "style" => nil, "language" => nil },
          "storyPath" => story_path },
        { "id" => "director", "voice" => { "name" => "Charon", "style" => nil, "language" => nil } }
      ]
      @game.save!

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: { npc_id: "director", text: "Words nobody wrote" }
      end

      assert_response :forbidden
      assert_match(/not found/i, json_body["error"])
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
    end

    # ─── TTS generation failure ───────────────────────────────────────────────

    test "tts returns 500 when TTS service fails to generate audio" do
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:enabled?, true)
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: {
            npc_id: "intercom_1",
            text:   VOICE_TEXT
          }
        end

        assert_response :internal_server_error
        assert_match(/failed/i, json_body["error"])
        mock_service.verify
      end
    end

    # ─── Successful TTS via cache hit (no real API call) ─────────────────────

    test "tts serves mp3 audio for intercom object when audio is cached" do
      # Compute the exact cache key TtsService will look up
      voice_name   = "Aoede"
      normalized   = VOICE_TEXT.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
      cache_key    = Digest::MD5.hexdigest("#{normalized}|#{voice_name}||")
      fake = write_fake_cached_mp3(cache_key)

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "intercom_1",
          text:   VOICE_TEXT
        }
      end

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    ensure
      remove_fake_cached_mp3(fake)
    end

    # ─── Ink NPC — successful TTS via cache hit ───────────────────────────────

    test "tts serves mp3 for ink NPC when text is valid and audio is cached" do
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_ink_ok_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      fake_json  = tmp_dir.join("story.json")
      story_path = "tmp/tts_ink_ok_#{Process.pid}/story.json"

      npc_text = "Hello world"
      # Compiled Ink stores dialog as ^-prefixed strings
      File.write(fake_json, { "inkVersion" => 21, "root" => ["^Narrator: #{npc_text}", "done"] }.to_json)

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        {
          "id"        => "ink_npc",
          "voice"     => { "name" => "Kore", "style" => nil, "language" => nil },
          "storyPath" => story_path
        }
      ]
      @game.save!

      # Pre-populate TTS cache for this request
      normalized = npc_text.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
      cache_key  = Digest::MD5.hexdigest("#{normalized}|Kore||")
      fake = write_fake_cached_mp3(cache_key)

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: {
          npc_id: "ink_npc",
          text:   npc_text
        }
      end

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    ensure
      FileUtils.rm_rf(tmp_dir) if tmp_dir
      remove_fake_cached_mp3(fake)
    end

    private

    # Put a fake MP3 where TtsService looks for this game's audio
    # (CACHE_DIR/<mission name>/<key>.mp3). Files already there (e.g. real cached
    # audio) are left alone afterwards; only what the test created is removed,
    # including the provenance sidecar a cache hit writes.
    def write_fake_cached_mp3(cache_key)
      mp3_path = TtsService::CACHE_DIR.join(@mission.name, "#{cache_key}.mp3")
      sidecar  = mp3_path.sub_ext(".json")
      fake = { mp3: mp3_path, sidecar: sidecar, created_mp3: !File.exist?(mp3_path),
               created_sidecar: !File.exist?(sidecar), created_dir: !Dir.exist?(mp3_path.dirname) }
      if fake[:created_mp3]
        FileUtils.mkdir_p(mp3_path.dirname)
        File.binwrite(mp3_path, "\xFF\xFB\x90\x00" + ("\x00" * 128))
      end
      fake
    end

    def remove_fake_cached_mp3(fake)
      return unless fake
      File.delete(fake[:mp3]) if fake[:created_mp3] && File.exist?(fake[:mp3])
      File.delete(fake[:sidecar]) if fake[:created_sidecar] && File.exist?(fake[:sidecar])
      dir = fake[:mp3].dirname
      Dir.rmdir(dir) if fake[:created_dir] && Dir.exist?(dir) && Dir.empty?(dir)
    end

    def json_body
      JSON.parse(response.body)
    end

    # Temporarily set (or unset) ENV variables, restoring originals after block.
    def with_env(vars)
      saved = vars.each_with_object({}) { |(k, _), h| h[k.to_s] = ENV[k.to_s] }
      vars.each { |k, v| v.nil? ? ENV.delete(k.to_s) : ENV[k.to_s] = v.to_s }
      yield
    ensure
      saved.each { |k, v| v.nil? ? ENV.delete(k) : ENV[k] = v }
    end
  end
end
