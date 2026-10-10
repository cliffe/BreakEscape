require 'test_helper'
require 'minitest/mock'
require 'digest'
require 'fileutils'
require 'tmpdir'
require 'base64'

module BreakEscape
  class TtsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    VOICE_TEXT = "Welcome to the security system. Please verify your identity.".freeze

    setup do
      # Every test gets its own cache directory, so nothing reads or writes the
      # repo's committed tts_cache/.
      @cache_root   = Pathname.new(Dir.mktmpdir("tts_cache_test"))
      @real_cache   = TtsService::CACHE_DIR
      TtsService.send(:remove_const, :CACHE_DIR)
      TtsService.const_set(:CACHE_DIR, @cache_root)

      @mission = break_escape_missions(:ceo_exfil)
      @saved_voice_cache = Mission.voice_config_cache[@mission.name]
      stub_current_voices({})
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

    test "tts returns 503 when GEMINI_API_KEY is not set and nothing is cached" do
      with_env("GEMINI_API_KEY" => nil) do
        post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
        assert_response :service_unavailable
        assert_match(/not configured|GEMINI_API_KEY/i, json_body["error"])
      end
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
        mock_service.expect(:cache_key_for, "missing", [String, String, NilClass, NilClass])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, NilClass, NilClass], scenario_name: String)

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
        quota_service.define_singleton_method(:legacy_cached_path) { |*_args, **_kw| nil }
        quota_service.define_singleton_method(:cache_key_for) { |*_args| "missing" }
        quota_service.define_singleton_method(:cache_path) { |*_args| Pathname.new("/nonexistent/missing.mp3") }

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
        quota_service.define_singleton_method(:legacy_cached_path) { |*_args, **_kw| nil }
        quota_service.define_singleton_method(:cache_key_for) { |*_args| "missing" }
        quota_service.define_singleton_method(:cache_path) { |*_args| Pathname.new("/nonexistent/missing.mp3") }

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

    # ─── Ink NPC — line with escaped quotes ──────────────────────────────────

    test "tts accepts an ink line containing escaped quotes" do
      tmp_dir    = BreakEscape::Engine.root.join("tmp", "tts_quote_#{Process.pid}")
      FileUtils.mkdir_p(tmp_dir)
      story_path = "tmp/tts_quote_#{Process.pid}/story.json"
      line       = 'Fired. "Performance issues," they said.'
      File.write(tmp_dir.join("story.json"),
                 { "inkVersion" => 21, "root" => [["^Sarah: #{line}", "\n", "done"], "done", nil] }.to_json)

      @game.scenario_data["rooms"]["lobby"]["npcs"] = [
        { "id" => "ink_npc", "voice" => { "name" => "Kore", "style" => "Speak formally.", "language" => "en-GB" },
          "storyPath" => story_path }
      ]
      @game.save!

      # A 500 (generation failed) after a mock proves we passed the 403 validation gate.
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        mock_service = Minitest::Mock.new
        mock_service.expect(:cache_key_for, "missing", [String, String, String, String])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, String, String], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, String, String], scenario_name: String)

        TtsService.stub(:new, mock_service) do
          post tts_game_url(@game), params: { npc_id: "ink_npc", text: line }
        end

        assert_response :internal_server_error
      end
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
        mock_service.expect(:cache_key_for, "missing", [String, String, NilClass, NilClass])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, NilClass, NilClass], scenario_name: String)

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
        mock_service.expect(:cache_key_for, "missing", [String, String, NilClass, NilClass])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, NilClass, NilClass], scenario_name: String)

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
        mock_service.expect(:cache_key_for, "missing", [String, String, NilClass, NilClass])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, NilClass, NilClass], scenario_name: String)

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
        mock_service.expect(:cache_key_for, "missing", [String, String, NilClass, NilClass])
        mock_service.expect(:cache_path, Pathname.new("/nonexistent/missing.mp3"), [String, String])
        mock_service.expect(:generate, nil, [String, String, NilClass, NilClass], scenario_name: String, npc_id: String)
        mock_service.expect(:legacy_cached_path, nil, [String, String, NilClass, NilClass], scenario_name: String)

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

    test "tts serves the previous model's clip without generating, for missions not yet regenerated" do
      write_clip(legacy_key(VOICE_TEXT, "Aoede", nil, nil))

      post_with_generate_forbidden("intercom_1", VOICE_TEXT)

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    end

    test "tts serves a current-model clip without generating" do
      write_clip(TtsService.new.cache_key_for(VOICE_TEXT, "Aoede", nil, nil))

      post_with_generate_forbidden("intercom_1", VOICE_TEXT)

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    end

    test "tts prefers the current voice config over the saved scenario_data voice" do
      current = { "name" => "Puck", "style" => "Calm and slow.", "language" => "en-GB" }
      stub_current_voices("intercom_1" => current)
      # Clip exists only under the current voice; the saved voice (Aoede) has none.
      write_clip(TtsService.new.cache_key_for(VOICE_TEXT, "Puck", "Calm and slow.", "en-GB"))

      post_with_generate_forbidden("intercom_1", VOICE_TEXT)

      assert_response :success
    end

    test "tts ignores a current-model clip made under the saved voice when the current voice differs" do
      stub_current_voices("intercom_1" => { "name" => "Puck", "style" => nil, "language" => nil })
      write_clip(TtsService.new.cache_key_for(VOICE_TEXT, "Aoede", nil, nil)) # saved voice only

      calls = []
      stub_generate_returning(nil, calls) do
        post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
      end

      assert_response :internal_server_error
      assert_equal 1, calls.size
      assert_equal "Puck", calls.first[:args][1]
    end

    test "tts finds a previous-model clip under the saved voice when the current style has changed" do
      # In-progress game: the clip was made under the voice the game started with.
      stub_current_voices("intercom_1" => { "name" => "Aoede", "style" => "A new style.", "language" => nil })
      write_clip(legacy_key(VOICE_TEXT, "Aoede", nil, nil))

      post_with_generate_forbidden("intercom_1", VOICE_TEXT)

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    end

    test "tts generates with the speaker's npc_id when no clip exists anywhere" do
      calls = []
      stub_generate_returning(nil, calls) do
        post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
      end

      assert_response :internal_server_error
      assert_equal 1, calls.size
      assert_equal "intercom_1", calls.first[:kwargs][:npc_id]
      assert_equal @mission.name, calls.first[:kwargs][:scenario_name]
      assert_equal VOICE_TEXT, calls.first[:args][0]
    end

    test "tts serves the clip that generate returns" do
      generated = @cache_root.join("generated.mp3")
      File.binwrite(generated, FAKE_MP3)

      stub_generate_returning(generated, []) do
        post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
      end

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
    end

    # ─── TtsService#generate ─────────────────────────────────────────────────

    test "generate writes the mp3 and a sidecar naming speaker and model, leaving no temp files" do
      service = stubbed_gemini_service
      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        path = service.generate("Hello there, agent.", "Kore", "Speak formally.", "en-GB",
                                scenario_name: "gen_test", npc_id: "agent_x")

        assert_equal @cache_root.join("gen_test", "#{service.cache_key_for('Hello there, agent.', 'Kore', 'Speak formally.', 'en-GB')}.mp3"), path
        assert File.size(path) > 0

        sidecar = JSON.parse(File.read(path.sub_ext(".json")))
        assert_equal path.basename(".mp3").to_s, sidecar["key"]
        assert_equal "agent_x", sidecar["npc"]
        assert_equal "Hello there, agent.", sidecar["text"]
        assert_equal "Kore", sidecar["voice"]
        assert_equal "Speak formally.", sidecar["style"]
        assert_equal "en-GB", sidecar["language"]
        assert_equal TtsService::GEMINI_TTS_MODEL, sidecar["model"]
        assert_equal "gen_test", sidecar["scenario"]
        assert_equal "generate", sidecar["source"]
        assert_equal Date.today.iso8601, sidecar["generated"]

        # The sidecar is the only provenance record
        refute File.exist?(@cache_root.join("gen_test", "manifest.json"))
        leftovers = Dir.children(@cache_root.join("gen_test")).select do |f|
          f.start_with?(".") || f.end_with?(".pcm", ".tmp", ".lock")
        end
        assert_empty leftovers
      end
    end

    test "a cache hit backfills a missing sidecar with speaker and model, and keeps an existing one" do
      service = stubbed_gemini_service
      key = service.cache_key_for("A fresh line.", "Kore", nil, nil)
      mp3 = write_clip(key, "gen_test")
      sidecar_path = mp3.sub_ext(".json")

      service.generate("A fresh line.", "Kore", nil, nil, scenario_name: "gen_test", npc_id: "agent_x")
      sidecar = JSON.parse(File.read(sidecar_path))
      assert_equal "cache_hit", sidecar["source"]
      assert_equal "agent_x", sidecar["npc"]
      assert_equal TtsService::GEMINI_TTS_MODEL, sidecar["model"]
      assert_nil sidecar["style"]
      assert sidecar.key?("style"), "a nil style is part of the key, so it is written"
      refute sidecar.key?("generated"), "a backfill doesn't know when the audio was made"

      File.write(sidecar_path, { text: "A fresh line.", voice: "Kore", npc: "first_speaker" }.to_json)
      service.generate("A fresh line.", "Kore", nil, nil, scenario_name: "gen_test", npc_id: "someone_else")
      assert_equal "first_speaker", JSON.parse(File.read(sidecar_path))["npc"]
    end

    test "a sidecar names the previous model only for a file on the pre-model key" do
      text, voice = "An old take.", ["Kore", nil, "en-GB"]
      current = TtsService.cache_key(text, *voice)
      legacy = TtsService.legacy_cache_key(text, *voice)

      assert_equal TtsService::GEMINI_TTS_MODEL, TtsService.model_for_key(current, text, *voice)
      assert_equal TtsService::LEGACY_TTS_MODEL, TtsService.model_for_key(legacy, text, *voice)
      assert_nil TtsService.model_for_key("0" * 32, text, *voice)

      mp3 = write_clip(legacy, "gen_test")
      TtsService.new.write_sidecar(mp3, text, *voice, "gen_test", source: "batch")
      assert_equal TtsService::LEGACY_TTS_MODEL, JSON.parse(File.read(mp3.sub_ext(".json")))["model"]

      odd = write_clip("0" * 32, "gen_test")
      TtsService.new.write_sidecar(odd, text, *voice, "gen_test", source: "batch")
      refute JSON.parse(File.read(odd.sub_ext(".json"))).key?("model")
    end

    # ─── Gemini request and response ─────────────────────────────────────────

    test "call_gemini_tts sends style as speech_metadata and does not prepend it to the text" do
      pcm = "\x01\x00" * 100
      captured = nil
      http = fake_http { |req| captured = req; ok_audio_response(pcm) }

      result = with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        Net::HTTP.stub(:new, http) do
          TtsService.new.send(:call_gemini_tts, "Spoken words only.", "Kore", "Speak formally.", "en-GB")
        end
      end

      body = JSON.parse(captured.body)
      assert_equal TtsService::GEMINI_TTS_MODEL, body["model"]

      content = body.dig("input", 0, "content", 0)
      assert_equal "Spoken words only.", content["text"]
      assert_equal [{ "type" => "speech_metadata", "style" => "Speak formally." }], content["annotations"]
      refute_includes content["text"], "formally"

      assert_equal [{ "voice" => "Kore", "language" => "en-GB" }], body.dig("generation_config", "speech_config")
      assert_equal "audio", body.dig("response_format", "type")
      assert_equal "audio/l16", body.dig("response_format", "mime_type")
      assert_equal 24_000, body.dig("response_format", "sample_rate")
      assert_equal pcm.b, result.b
    end

    test "call_gemini_tts omits the annotation and language when there is no style or language" do
      captured = nil
      http = fake_http { |req| captured = req; ok_audio_response("\x00\x00") }

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        Net::HTTP.stub(:new, http) do
          TtsService.new.send(:call_gemini_tts, "Plain.", "Aoede", nil, nil)
        end
      end

      body = JSON.parse(captured.body)
      assert_nil body.dig("input", 0, "content", 0, "annotations")
      assert_equal [{ "voice" => "Aoede" }], body.dig("generation_config", "speech_config")
    end

    test "call_gemini_tts raises QuotaExhaustedError with the Retry-After header on a 429" do
      response = Net::HTTPTooManyRequests.new("1.1", "429", "Too Many Requests")
      response["Retry-After"] = "30"
      set_body(response, { "error" => { "message" => "Resource exhausted", "code" => "resource_exhausted" } }.to_json)
      http = fake_http { |_req| response }

      error = with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        Net::HTTP.stub(:new, http) do
          assert_raises(TtsService::QuotaExhaustedError) do
            TtsService.new.send(:call_gemini_tts, "Anything.", "Kore", nil, nil)
          end
        end
      end

      assert_equal 30, error.retry_after
      refute error.is_daily_limit
    end

    test "TtsService cache keys include the model, so a model change can't reuse old clips" do
      service = TtsService.new
      normalized = "hello there"
      refute_equal Digest::MD5.hexdigest("#{normalized}|Kore||"), service.cache_key_for("Hello there!", "Kore")
      assert_equal service.cache_key_for("Hello there!", "Kore"), service.cache_key_for("hello   there", "Kore")
    end

    # ─── Successful TTS via cache hit (no real API call) ─────────────────────

    test "tts serves mp3 audio for intercom object when audio is cached" do
      write_clip(TtsService.new.cache_key_for(VOICE_TEXT, "Aoede"))

      with_env("GEMINI_API_KEY" => "dummy_key_for_test") do
        post tts_game_url(@game), params: { npc_id: "intercom_1", text: VOICE_TEXT }
      end

      assert_response :success
      assert_equal "audio/mpeg", response.media_type
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

      write_clip(TtsService.new.cache_key_for(npc_text, "Kore"))

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
    end

    private

    FAKE_MP3 = ("\xFF\xFB\x90\x00" + ("\x00" * 128)).b.freeze

    # Put a fake clip where the controller looks: <cache>/<mission name>/<key>.mp3
    def write_clip(key, scenario = @mission.name)
      dir = @cache_root.join(scenario)
      FileUtils.mkdir_p(dir)
      path = dir.join("#{key}.mp3")
      File.binwrite(path, FAKE_MP3)
      path
    end

    # Key used by the previous (2.5) model, which did not include the model name.
    def legacy_key(text, voice, style, language)
      normalized = text.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
      Digest::MD5.hexdigest("#{normalized}|#{voice}|#{style}|#{language}")
    end

    # Seed Mission#current_voice_configs (the controller loads its own Mission
    # instance, so a singleton on @mission would not reach it). The cache is
    # keyed on the template's real mtime, so this is used as if just computed.
    def stub_current_voices(configs)
      mtime = File.mtime(@mission.scenario_path.join("scenario.json.erb"))
      Mission.voice_config_cache[@mission.name] = { mtime: mtime, configs: configs.freeze }
    end

    # POST a line whose clip is already on disk; generate must not be reached.
    def post_with_generate_forbidden(npc_id, text)
      service = TtsService.new
      service.define_singleton_method(:generate) { |*_args, **_kw| flunk "generated a line that already had a clip" }
      TtsService.stub(:new, service) do
        post tts_game_url(@game), params: { npc_id: npc_id, text: text }
      end
    end

    # Replace TtsService#generate with a recorder returning +result+.
    def stub_generate_returning(result, calls)
      service = TtsService.new
      service.define_singleton_method(:enabled?) { true }
      service.define_singleton_method(:generate) do |*args, **kwargs|
        calls << { args: args, kwargs: kwargs }
        result
      end
      TtsService.stub(:new, service) { yield }
    end

    # A real service whose Gemini call returns a short burst of PCM.
    def stubbed_gemini_service
      service = TtsService.new
      service.define_singleton_method(:call_gemini_tts) { |*_args| "\x00\x00" * 2400 }
      service
    end

    # Stand-in for the Net::HTTP instance; the block receives the request.
    def fake_http(&on_request)
      http = Object.new
      %i[use_ssl= open_timeout= read_timeout=].each { |m| http.define_singleton_method(m) { |_v| } }
      http.define_singleton_method(:request) { |req| on_request.call(req) }
      http
    end

    def ok_audio_response(pcm)
      response = Net::HTTPOK.new("1.1", "200", "OK")
      set_body(response, {
        "steps" => [{ "type" => "model_output",
                      "content" => [{ "type" => "audio", "mime_type" => "audio/l16; rate=24000; channels=1",
                                      "data" => Base64.strict_encode64(pcm) }] }]
      }.to_json)
      response
    end

    def set_body(response, body)
      response.instance_variable_set(:@body, body)
      response.instance_variable_set(:@read, true)
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
