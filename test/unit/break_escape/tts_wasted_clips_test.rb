require 'test_helper'
require 'fileutils'
require 'tmpdir'
require 'json'
require 'set'

module BreakEscape
  # `rake break_escape:tts:wasted` reads provenance from per-clip sidecars:
  # current-model clips whose key nothing requests are listed; previous-model
  # clips and MP3s without a sidecar are only counted.
  class TtsWastedClipsTest < ActiveSupport::TestCase
    SCENARIO = "wasted_fixture".freeze
    VOICE = ["Kore", "Calm.", "en-GB"].freeze

    setup do
      @cache = Pathname.new(Dir.mktmpdir("tts_wasted_test"))
      @dir = @cache.join(SCENARIO)
      FileUtils.mkdir_p(@dir)
    end

    teardown do
      FileUtils.rm_rf(@cache)
    end

    def clip(text, key: TtsService.cache_key(text, *VOICE), npc: "guard", sidecar: true, mp3: true)
      File.binwrite(@dir.join("#{key}.mp3"), "mp3") if mp3
      if sidecar
        TtsService.write_sidecar_file(@dir.join("#{key}.json"),
                                      "key" => key, "npc" => npc, "text" => text, "voice" => VOICE[0],
                                      "style" => VOICE[1], "language" => VOICE[2])
      end
      key
    end

    test "lists current-model clips nothing requests, and only counts the rest" do
      requested = clip("Who goes there?")
      wasted = clip("A line that was cut.", npc: "narrator")
      gone = clip("Audio already removed.", mp3: false)
      clip("An old take.", key: TtsService.legacy_cache_key("An old take.", *VOICE))
      clip("No provenance.", sidecar: false)
      File.write(@dir.join(".half.json.tmp"), "{")

      r = TtsWastedClips.scan(SCENARIO, expected_keys: Set[requested], cache_dir: @cache)

      assert_equal 3, r.current
      assert_equal [gone, wasted].sort, r.wasted.map(&:key).sort
      assert_equal "narrator", r.wasted.find { |c| c.key == wasted }.sidecar["npc"]
      refute r.wasted.find { |c| c.key == gone }.mp3_exists
      assert_equal 1, r.older_sidecars
      assert_equal 1, r.without_sidecar
      assert_equal 1, r.expected
    end

    test "sidecar writes are atomic and leave no temp files" do
      clip("Who goes there?")
      assert_empty Dir.children(@dir).select { |f| f.start_with?(".") }
      assert_equal ["Who goes there?"], TtsService.read_sidecars(@dir).values.map { |d| d["text"] }
    end
  end
end
