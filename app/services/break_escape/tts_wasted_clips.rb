require 'pathname'

module BreakEscape
  # Current-model clips that nothing will request, read from the provenance
  # sidecars (<key>.json). Used by `rake break_escape:tts:wasted` after a batch.
  #
  # A clip counts as current-model when its key is the current-model key for
  # its sidecar's text, voice, style and language. It is wasted when that key is
  # not one the client can ask for now: TtsLineExtractor's lines, each voiced
  # exactly as the endpoint voices it.
  #
  # This is stricter than TtsCachePruner, which keeps any clip whose text
  # matches a line under any of the scenario's voices (and previous-model
  # clips), so it can't see a line voiced with the wrong speaker's voice.
  # MP3s with no sidecar are only counted: their text isn't known here.
  class TtsWastedClips
    Clip = Struct.new(:key, :sidecar, :mp3_exists, keyword_init: true)
    Result = Struct.new(:scenario, :current, :wasted, :older_sidecars, :without_sidecar, :expected,
                        keyword_init: true)

    # @param scenario [String] cache directory / scenario name
    # @param expected_keys [Set<String>, Array<String>] keys the client can request
    # @return [Result]
    def self.scan(scenario, expected_keys:, cache_dir: TtsService::CACHE_DIR)
      dir = Pathname.new(cache_dir.to_s).join(scenario)
      sidecars = TtsService.read_sidecars(dir)
      current = sidecars.select do |key, data|
        key == TtsService.cache_key(*data.values_at("text", "voice", "style", "language"))
      end
      wasted = current.reject { |key, _| expected_keys.include?(key) }.map do |key, data|
        Clip.new(key: key, sidecar: data, mp3_exists: File.exist?(dir.join("#{key}.mp3")))
      end
      mp3_keys = Dir.glob(dir.join("*.mp3").to_s).map { |f| File.basename(f, ".mp3") }

      Result.new(scenario: scenario, current: current.size,
                 wasted: wasted.sort_by { |c| [c.sidecar["npc"].to_s, c.sidecar["text"].to_s] },
                 older_sidecars: sidecars.size - current.size,
                 without_sidecar: (mp3_keys - sidecars.keys).size,
                 expected: expected_keys.size)
    end
  end
end
