require 'test_helper'
require 'minitest/mock'
require 'fileutils'
require 'tmpdir'
require 'json'

module BreakEscape
  # TTS cache pruner: key parity with TtsService, the expected-line builder on a
  # small fixture scenario, dry run vs trash vs delete, protection of cache
  # directories that match no scenario, and provenance sidecars.
  class TtsCachePrunerTest < ActiveSupport::TestCase
    FIXTURE_SCENARIOS = BreakEscape::Engine.root.join("test/fixtures/files/tts_prune/scenarios")
    SCENARIO = "prune_fixture".freeze

    GUARD    = ["Charon", "Bored night guard.", "en-GB"].freeze
    NARRATOR = ["Algenib", "Grave narrator.", "en-GB"].freeze
    INTERCOM = ["Aoede", nil, nil].freeze

    setup do
      @tmp = Pathname.new(Dir.mktmpdir("tts_prune_test"))
      @cache = @tmp.join("tts_cache")
      @trash = @tmp.join("trash")
      FileUtils.mkdir_p(@cache.join(SCENARIO))
    end

    teardown do
      FileUtils.rm_rf(@tmp)
    end

    def key(text, voice)
      TtsService.cache_key(text, *voice)
    end

    def expected(walk: false)
      TtsExpectedLines.new(SCENARIO, scenarios_dir: FIXTURE_SCENARIOS, runtime_walk: walk).build!
    end

    def put(rel, body = "mp3")
      path = @cache.join(rel)
      FileUtils.mkdir_p(path.dirname)
      File.binwrite(path, body)
      path
    end

    def pruner
      TtsCachePruner.new(cache_dir: @cache, scenarios_dir: FIXTURE_SCENARIOS, trash_root: @trash,
                         runtime_walk: false, today: Date.new(2026, 10, 5))
    end

    # ─── Key parity ───────────────────────────────────────────────────────────

    test "cache key matches TtsService and the formula, with the model; legacy key is the pre-model formula" do
      text = "  Agent -- it's *quietly* 47 people.\nKeep moving!  "
      voice = ["Kore", "Calm. Measured.", "en-GB"]
      normalised = text.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
      legacy = Digest::MD5.hexdigest("#{normalised}|#{voice.join('|')}")
      current = Digest::MD5.hexdigest("#{normalised}|#{voice.join('|')}|#{TtsService::GEMINI_TTS_MODEL}")

      assert_equal current, TtsService.cache_key(text, *voice)
      assert_equal current, TtsService.new.cache_key_for(text, *voice)
      assert_equal current, TtsService.cache_key_for_normalized(TtsService.normalize_text(text), *voice)
      assert_equal legacy, TtsService.legacy_cache_key(text, *voice)
      # nil style/language key the same as the controller's interpolation of a missing field
      assert_equal Digest::MD5.hexdigest("hello there|Aoede||"), TtsService.legacy_cache_key("Hello, there!", "Aoede", nil, nil)
    end

    test "a clip under the previous model's key counts as matched, not orphaned" do
      line = "Halt. Who goes there?"
      put("#{SCENARIO}/#{TtsService.legacy_cache_key(line, *GUARD)}.mp3")
      report = pruner.run(scenario: SCENARIO)
      assert_equal 0, report.scenarios.first.orphans.size
    end

    # ─── Expected-line builder ────────────────────────────────────────────────

    test "expected set covers every branch of an inline alternative, conditionals and glue" do
      e = expected
      assert e.include_key?(key("Halt. Who goes there?", GUARD)), "first visit of {&a|b}"
      assert e.include_key?(key("Stop right there. Who goes there?", GUARD)), "second visit of {&a|b}"
      assert e.include_key?(key("Back again.", GUARD))
      assert e.include_key?(key("Never seen you before.", GUARD))
      assert e.include_key?(key("You'll want the lobby, then.", GUARD)), "glued line"
      assert e.include_key?(key("Auditor. Right. Go on through.", GUARD))
      assert e.include_key?(key("The guard frowns.", NARRATOR)), "narrator line in the narrator's voice"
      refute e.include_key?(key("Halt. Who goes there?", ["Charon", "Old style.", "en-GB"])), "voice no longer configured"
      refute e.include_key?(key("A line nobody wrote.", GUARD))
    end

    test "expected set covers barks, timed messages and fixed-text voice objects" do
      e = expected
      assert e.include_key?(key("Oi! That door's alarmed.", GUARD)), "eventMappings bark"
      assert e.include_key?(key("Still here?", GUARD)), "timed message with the player's line left out"
      assert e.include_key?(key("Reception is closed. Please call back tomorrow.", INTERCOM)), "voice object"
      assert_equal 3, e.voices.size
    end

    test "static expansion of ink source" do
      lines = TtsExpectedLines.ink_source_candidates(<<~INK)
        VAR x = false
        === k ===
        Ann: {x: Yes.|No.} Fine. #tag:one
        * {x} [Ask] Ann: Answer. -> k
        + Choice text [hidden] shown
        {~Red|Blue} sky. // comment
      INK
      assert_includes lines, "Ann: Yes. Fine."
      assert_includes lines, "Ann: No. Fine."
      assert_includes lines, "Ann: Answer."
      assert_includes lines, "Choice text shown"
      assert_includes lines, "Red sky."
      assert_includes lines, "Blue sky."
      refute lines.any? { |l| l.include?("tag:one") || l.include?("->") || l.include?("VAR") }
    end

    test "runtime ink walk adds composed lines when node is available" do
      skip "node not available" unless system("node", "--version", out: File::NULL, err: File::NULL)
      e = expected(walk: true)
      assert_includes %i[done capped], e.walk_status
      assert e.include_key?(key("Halt. Who goes there?", GUARD))
      assert e.texts.any? { |t| e.source_of(t).to_s.start_with?("walk:") } || e.texts.include?("halt who goes there")
    end

    # ─── Dry run, trash, delete ───────────────────────────────────────────────

    test "dry run reports orphans and changes nothing" do
      good = put("#{SCENARIO}/#{key('Stop right there. Who goes there?', GUARD)}.mp3")
      stale = put("#{SCENARIO}/#{key('A line that was rewritten.', GUARD)}.mp3", "x" * 2048)
      unknown = put("quota_test/abc.mp3")

      report = pruner.run
      r = report.scenarios.find { |s| s.name == SCENARIO }
      assert_equal 2, r.files.size
      assert_equal [:matched], r.files.select { |f| f.path == good.to_s }.map(&:status)
      assert_equal [stale.to_s], r.orphans.map(&:path)
      assert_equal 2048, r.orphan_bytes
      assert_equal ["quota_test"], report.unknown.map(&:name)
      assert_empty report.actions
      assert File.exist?(good) && File.exist?(stale) && File.exist?(unknown)
      refute Dir.exist?(@trash)

      out = StringIO.new
      TtsCachePruner.print_report(report, io: out)
      assert_match(/DRY RUN/, out.string)
      assert_match(/quota_test/, out.string)
    end

    test "trash mode moves orphans and their sidecars to a dated folder with a manifest" do
      good = put("#{SCENARIO}/#{key('Back again.', GUARD)}.mp3")
      stale_key = key("A line that was rewritten.", GUARD)
      stale = put("#{SCENARIO}/#{stale_key}.mp3")
      File.write(stale.sub_ext(".json"), { text: "A line that was rewritten.", voice: "Charon",
                                           style: "Bored night guard.", language: "en-GB" }.to_json)
      unknown = put("quota_test/abc.mp3")

      report = pruner.run(scenario: SCENARIO, mode: :trash)
      dest = @trash.join("2026-10-05", SCENARIO)
      assert File.exist?(good)
      refute File.exist?(stale)
      refute File.exist?(stale.sub_ext(".json"))
      assert File.exist?(dest.join("#{stale_key}.mp3"))
      assert File.exist?(dest.join("#{stale_key}.json"))
      assert File.exist?(unknown), "unknown directories are never touched unless named"
      manifest = JSON.parse(File.read(@trash.join("2026-10-05", "manifest.json")))
      assert_equal 1, manifest.size
      assert_equal "orphan_certain", manifest.first["reason"]
      assert_equal 1, report.actions.size
    end

    test "delete mode removes orphans permanently and keeps matched files" do
      good = put("#{SCENARIO}/#{key('Oi! That door\'s alarmed.', GUARD)}.mp3")
      stale = put("#{SCENARIO}/#{key('Gone line.', GUARD)}.mp3")
      pruner.run(scenario: SCENARIO, mode: :delete)
      assert File.exist?(good)
      refute File.exist?(stale)
      refute Dir.exist?(@trash)
    end

    test "certain_only prunes only orphans whose sidecar names their text" do
      inferred = put("#{SCENARIO}/#{key('Old line one.', GUARD)}.mp3")
      certain_key = key("Old line two.", GUARD)
      certain = put("#{SCENARIO}/#{certain_key}.mp3")
      File.write(certain.sub_ext(".json"), { text: "Old line two.", voice: GUARD[0], style: GUARD[1], language: GUARD[2] }.to_json)
      pruner.run(scenario: SCENARIO, mode: :trash, certain_only: true)
      assert File.exist?(inferred)
      refute File.exist?(certain)
    end

    # ─── Unknown directories ──────────────────────────────────────────────────

    test "unknown directories are pruned only when named, and never as a scenario" do
      unknown = put("quota_test/abc.mp3")
      assert_raises(ArgumentError) { pruner.run(scenario: "quota_test", mode: :delete) }
      assert_raises(ArgumentError) { pruner.run(scenario: "no_such_thing") }
      pruner.run(mode: :trash)
      assert File.exist?(unknown)

      report = pruner.run(mode: :trash, unknown: [SCENARIO])
      assert_match(/known scenario/, report.errors.join)

      pruner.run(mode: :trash, unknown: ["quota_test"])
      refute File.exist?(unknown)
      assert File.exist?(@trash.join("2026-10-05", "quota_test", "abc.mp3"))
    end

    test "legacy flat files are reported and only pruned when named, keeping current lines" do
      flat = put("#{key('Old flat file.', GUARD)}.mp3")
      current = put("#{key('Back again.', GUARD)}.mp3")
      report = pruner.run(mode: :trash)
      assert_includes report.unknown.map(&:name), TtsCachePruner::FLAT
      assert File.exist?(flat)
      pruner.run(mode: :trash, unknown: [TtsCachePruner::FLAT])
      refute File.exist?(flat)
      assert File.exist?(current), "a flat file matching a current line is kept (it migrates on use)"
    end

    # ─── Sidecars ─────────────────────────────────────────────────────────────

    test "a sidecar whose exact text the server still accepts keeps the file" do
      # Not reproduced by the expected set, but /tts would accept it (contains a stored fragment)
      text = "Oh. Halt. Who goes there?"
      k = key(text, GUARD)
      refute expected.include_key?(k)
      kept = put("#{SCENARIO}/#{k}.mp3")
      File.write(kept.sub_ext(".json"), { text: text, voice: GUARD[0], style: GUARD[1], language: GUARD[2] }.to_json)

      # Same text in a voice the scenario no longer uses: certain orphan
      old_voice = ["Charon", "Old style.", "en-GB"]
      ok = key(text, old_voice)
      gone = put("#{SCENARIO}/#{ok}.mp3")
      File.write(gone.sub_ext(".json"), { text: text, voice: old_voice[0], style: old_voice[1], language: old_voice[2] }.to_json)

      r = pruner.run.scenarios.first
      assert_equal :kept, r.files.find { |f| f.key == k }.status
      assert_equal :orphan_certain, r.files.find { |f| f.key == ok }.status
    end

    test "TtsService writes a sidecar on generation and backfills one on a cache hit" do
      scenario = "tts_sidecar_test_#{Process.pid}"
      dir = TtsService::CACHE_DIR.join(scenario)
      service = with_api_key { TtsService.new }
      service.define_singleton_method(:call_gemini_tts) { |*_| "pcm" }
      service.define_singleton_method(:convert_pcm_to_mp3) { |_pcm, mp3| File.binwrite(mp3, "mp3"); true }

      path = service.generate("Halt! Who goes there?", "Charon", "Bored.", "en-GB", scenario_name: scenario)
      sidecar = JSON.parse(File.read(path.sub_ext(".json")))
      assert_equal "Halt! Who goes there?", sidecar["text"]
      assert_equal ["Charon", "Bored.", "en-GB", scenario, "generate"],
                   sidecar.values_at("voice", "style", "language", "scenario", "source")
      assert_equal File.basename(path, ".mp3"), sidecar["key"]
      assert_equal TtsService.cache_key("Halt! Who goes there?", "Charon", "Bored.", "en-GB"), sidecar["key"]
      assert_equal TtsService::GEMINI_TTS_MODEL, sidecar["model"]
      refute sidecar.key?("npc"), "no speaker given, so none recorded"
      # Anything that globs the cache for audio still sees one file
      assert_equal 1, Dir.glob(dir.join("*.mp3")).size

      File.delete(path.sub_ext(".json"))
      service.generate("Halt! Who goes there?", "Charon", "Bored.", "en-GB", scenario_name: scenario)
      assert_equal "cache_hit", JSON.parse(File.read(path.sub_ext(".json")))["source"]
    ensure
      FileUtils.rm_rf(dir) if dir
    end

    private

    def with_api_key
      old = ENV["GEMINI_API_KEY"]
      ENV["GEMINI_API_KEY"] = "dummy_key_for_test"
      yield
    ensure
      ENV["GEMINI_API_KEY"] = old
    end
  end
end
