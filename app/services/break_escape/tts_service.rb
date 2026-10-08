require 'digest'
require 'fileutils'
require 'open3'
require 'net/http'
require 'json'
require 'base64'
require 'uri'

module BreakEscape
  class TtsService
    # Raised when the Gemini API returns 429 RESOURCE_EXHAUSTED.
    # Carries the retry_after seconds from the API's retryDelay field (if present).
    # - retry_after < 120s → per-minute rate limit
    # - retry_after >= 120s → per-day rate limit (or other long-term limit)
    class QuotaExhaustedError < StandardError
      attr_reader :retry_after, :is_daily_limit

      def initialize(retry_after = nil)
        @retry_after = retry_after
        @is_daily_limit = retry_after && retry_after >= 120

        if retry_after
          hours = (retry_after / 3600.0).round(1)
          minutes = (retry_after / 60.0).round(1)
          duration_str = hours >= 1 ? "~#{hours}h" : "~#{minutes}m"
          msg = "Quota exhausted. Retry in #{retry_after}s (#{duration_str})"
        else
          msg = "Quota exhausted"
        end
        super(msg)
      end
    end

    # Stores detected rate limit information from Gemini API responses
    RateLimitInfo = Struct.new(:requests_per_minute, :requests_per_day, :detected_at)
    # The model is part of the cache key, so changing it regenerates every line
    # rather than mixing models within a conversation.
    GEMINI_TTS_MODEL = "gemini-3.8-flash-tts"
    GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
    # Clips made with gemini-2.5-flash-preview-tts were keyed without a model;
    # legacy_cached_path finds them for missions not yet regenerated.
    MANIFEST_FILENAME = "manifest.json"
    # Engine-root cache so pre-generated MP3s can be committed to git and are
    # found in both standalone and mounted (Hacktivity) mode without relying on
    # the host app's Rails.root.
    CACHE_DIR = BreakEscape::Engine.root.join("tts_cache")

    def initialize
      @api_key = ENV["GEMINI_API_KEY"].presence ||
                 Rails.application.credentials.dig(Rails.env.to_sym, :gemini_api_key).presence
      @enabled = @api_key.present?
      @rate_limit_info = nil
    end

    def enabled?
      @enabled
    end

    # Return detected rate limit info, or nil if not yet available
    def rate_limit_info
      @rate_limit_info
    end


    # Generate or retrieve cached MP3 for text + voice.
    # Audio is stored under CACHE_DIR/{scenario_name}/{hash}.mp3 when a scenario
    # name is provided, falling back to CACHE_DIR/{hash}.mp3 for legacy callers.
    # If a flat (legacy) file exists for the same key it is migrated automatically.
    #
    # @param text [String] Dialog text to synthesize
    # @param voice_name [String] Gemini voice name (e.g., "Kore")
    # @param style_prompt [String, nil] Optional style instructions
    # @param language_code [String, nil] BCP-47 language code (e.g., "en-GB")
    # @param scenario_name [String, nil] Scenario directory name (e.g., "m01_first_contact")
    # @param npc_id [String, nil] Speaker, recorded in the manifest only (not part of the key)
    # @return [Pathname, nil] Path to cached MP3 file, or nil on failure
    def generate(text, voice_name, style_prompt = nil, language_code = nil, scenario_name: nil, npc_id: nil)
      return nil if text.blank?

      cache_key = compute_cache_key(text, voice_name, style_prompt, language_code)
      mp3_path  = cache_path(cache_key, scenario_name)

      # Migrate a flat (legacy) file into the scenario subdir if needed
      migrate_flat_cache!(cache_key, mp3_path) if scenario_name.present?

      # Cache hit
      if File.exist?(mp3_path)
        Rails.logger.debug "[TTS] Cache hit: #{scenario_name}/#{cache_key}"
        return mp3_path
      end

      # Cache miss — generate via API (requires API key)
      return nil unless enabled?
      Rails.logger.info "[TTS] Cache miss, generating: #{text.truncate(60)} (voice: #{voice_name})"
      pcm_data = call_gemini_tts(text, voice_name, style_prompt, language_code)
      return nil unless pcm_data

      FileUtils.mkdir_p(mp3_path.dirname)

      # Convert via uniquely named temp files and rename into place, so two
      # requests for the same line can't clobber each other and a crash can't
      # leave a half-written MP3 that later counts as a cache hit.
      tmp_base = mp3_path.dirname.join(".#{cache_key}.#{SecureRandom.hex(4)}")
      pcm_path = Pathname.new("#{tmp_base}.pcm")
      tmp_mp3  = Pathname.new("#{tmp_base}.mp3")
      File.binwrite(pcm_path, pcm_data)

      success = convert_pcm_to_mp3(pcm_path, tmp_mp3)
      File.rename(tmp_mp3, mp3_path) if success

      [pcm_path, tmp_mp3].each do |path|
        File.delete(path) if File.exist?(path)
      rescue => e
        Rails.logger.warn "[TTS] Failed to delete temp file #{path}: #{e.message}"
      end

      if success
        Rails.logger.info "[TTS] Generated: #{scenario_name}/#{cache_key}.mp3 (#{(File.size(mp3_path) / 1024.0).round(1)} KB)"
        record_in_manifest(mp3_path, text: text, npc_id: npc_id, voice_name: voice_name,
                                     style_prompt: style_prompt, language_code: language_code)
        mp3_path
      else
        nil
      end
    rescue QuotaExhaustedError
      # Callers (the TTS endpoint, the batch processor) handle this specifically
      raise
    rescue => e
      Rails.logger.error "[TTS] Error generating audio: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.first(5).join("\n")
      nil
    end

    # Return the expected cache path for a given key and optional scenario name.
    # Public so TtsBatchProcessor can use it for cache-hit checks without calling generate.
    def cache_path(cache_key, scenario_name = nil)
      if scenario_name.present?
        CACHE_DIR.join(scenario_name, "#{cache_key}.mp3")
      else
        CACHE_DIR.join("#{cache_key}.mp3")
      end
    end

    # Compute the cache key for a set of TTS parameters.
    # Public so callers can check cache state without a generate call.
    def cache_key_for(text, voice_name, style_prompt = nil, language_code = nil)
      compute_cache_key(text, voice_name, style_prompt, language_code)
    end

    # A clip from the previous model for this line, if one is still on disk.
    # Missions are moved to the new model one at a time, so for a mission not
    # yet regenerated this is its audio; elsewhere an older voice beats silence.
    def legacy_cached_path(text, voice_name, style_prompt = nil, language_code = nil, scenario_name: nil)
      return nil if text.blank?

      key = Digest::MD5.hexdigest("#{normalize_text(text)}|#{voice_name}|#{style_prompt}|#{language_code}")
      [cache_path(key, scenario_name), cache_path(key)].uniq.find { |path| File.exist?(path) }
    end

    private

    # Per-scenario manifest.json maps each clip's key to what it says and who
    # says it, so a clip can be found by its line and stale clips can be pruned.
    # Locked (the endpoint's threads and the batch can generate at once) and
    # replaced by rename, so a crash mid-write can't truncate it. A manifest
    # that won't parse is set aside rather than overwritten.
    def record_in_manifest(mp3_path, text:, npc_id:, voice_name:, style_prompt:, language_code:)
      manifest_path = mp3_path.dirname.join(MANIFEST_FILENAME)
      File.open("#{manifest_path}.lock", File::RDWR | File::CREAT, 0o644) do |lock|
        lock.flock(File::LOCK_EX)
        manifest = {}
        if File.exist?(manifest_path)
          begin
            manifest = JSON.parse(File.read(manifest_path))
          rescue JSON::ParserError => e
            corrupt_path = "#{manifest_path}.corrupt-#{Time.now.strftime('%Y%m%d%H%M%S')}"
            FileUtils.mv(manifest_path, corrupt_path)
            Rails.logger.error "[TTS] Unreadable manifest moved to #{corrupt_path}: #{e.message}"
          end
        end
        manifest[mp3_path.basename(".mp3").to_s] = {
          "npc" => npc_id, "text" => text, "voice" => voice_name, "style" => style_prompt,
          "language" => language_code, "model" => GEMINI_TTS_MODEL, "generated" => Date.today.iso8601
        }.compact
        tmp_path = "#{manifest_path}.#{SecureRandom.hex(4)}.tmp"
        File.write(tmp_path, JSON.pretty_generate(manifest.sort.to_h))
        File.rename(tmp_path, manifest_path)
      end
    rescue => e
      Rails.logger.warn "[TTS] Could not update manifest #{manifest_path}: #{e.message}"
    end

    # Parse rate limit info from Gemini API response headers or error details
    # The API may include X-Goog-* headers or rate limit details in error responses
    def extract_rate_limit_info(response)
      # Try to extract from response headers first
      rpm = extract_header_value(response, ['x-goog-ratelimit-requests-per-minute', 'X-Goog-Ratelimit-Requests-Per-Minute'])
      rpd = extract_header_value(response, ['x-goog-ratelimit-requests-per-day', 'X-Goog-Ratelimit-Requests-Per-Day'])

      # If not in headers, try to parse from error body (for 429 responses)
      if response.code == "429" && response.body.present?
        parsed = JSON.parse(response.body.to_s) rescue {}
        details = parsed.dig("error", "details") || []
        details.each do |detail|
          if detail["@type"]&.include?("QuotaExceeded") || detail["@type"]&.include?("ResourceExhausted")
            # Some fields may be in metadata
            metadata = detail.dig("metadata") || {}
            rpm ||= metadata["requests_per_minute"]&.to_i
            rpd ||= metadata["requests_per_day"]&.to_i
          end
        end
      end

      if rpm.present? || rpd.present?
        @rate_limit_info = RateLimitInfo.new(rpm&.to_i, rpd&.to_i, Time.now)
      end

      @rate_limit_info
    end

    # Extract header value, checking multiple possible case variations
    def extract_header_value(response, header_names)
      return nil unless response.respond_to?(:each_header)

      header_names.each do |name|
        response.each_header do |key, value|
          return value.to_i if key.downcase == name.downcase
        end
      end
      nil
    end
    # The API returns either a "retryDelay":"8031s" field in details, or a
    # human-readable "2h13m51s" string in the message.
    def parse_retry_delay(body)
      parsed = JSON.parse(body.to_s) rescue {}

      # Prefer the structured retryDelay from RetryInfo details
      details = parsed.dig("error", "details") || []
      details.each do |detail|
        if detail["@type"]&.include?("RetryInfo") && detail["retryDelay"]
          delay_str = detail["retryDelay"].to_s
          return delay_str.to_i if delay_str =~ /\A\d+s?\z/
        end
      end

      # Fall back to parsing "2h13m51s" from the error message
      msg = parsed.dig("error", "message").to_s
      if msg =~ /retry in\s+((?:\d+h)?(?:\d+m)?(?:\d+(?:\.\d+)?s)?)/i
        parse_duration($1)
      end
    rescue
      nil
    end

    def parse_duration(str)
      total = 0
      total += $1.to_i * 3600 if str =~ /(\d+)h/
      total += $1.to_i * 60   if str =~ /(\d+)m/
      total += $1.to_f         if str =~ /(\d+(?:\.\d+)?)s/
      total > 0 ? total.ceil : nil
    end

    def migrate_flat_cache!(cache_key, new_path)
      flat_path = CACHE_DIR.join("#{cache_key}.mp3")
      return unless File.exist?(flat_path)
      return if File.exist?(new_path)

      FileUtils.mkdir_p(new_path.dirname)
      FileUtils.mv(flat_path, new_path)
      Rails.logger.info "[TTS] Migrated #{cache_key}.mp3 → #{new_path.relative_path_from(CACHE_DIR)}"
    rescue => e
      Rails.logger.warn "[TTS] Migration failed for #{cache_key}: #{e.message}"
    end

    def compute_cache_key(text, voice_name, style_prompt = nil, language_code = nil)
      normalized = normalize_text(text)
      Digest::MD5.hexdigest("#{normalized}|#{voice_name}|#{style_prompt}|#{language_code}|#{GEMINI_TTS_MODEL}")
    end

    def normalize_text(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end

    def call_gemini_tts(text, voice_name, style_prompt, language_code = nil)
      uri = URI("#{GEMINI_INTERACTIONS_URL}?key=#{@api_key}")

      # 3.8 speaks the input text verbatim, so the style prompt goes in a
      # speech_metadata annotation rather than in front of the line.
      content = { type: "text", text: text }
      content[:annotations] = [{ type: "speech_metadata", style: style_prompt }] if style_prompt.present?

      speaker = { voice: voice_name }
      speaker[:language] = language_code if language_code.present?

      body = {
        model: GEMINI_TTS_MODEL,
        input: [{ type: "user_input", content: [content] }],
        # Raw PCM rather than the default WAV, to suit convert_pcm_to_mp3
        response_format: { type: "audio", mime_type: "audio/l16", sample_rate: 24_000 },
        generation_config: { speech_config: [speaker] }
      }

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 15
      http.read_timeout = 60

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request.body = body.to_json

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        body_preview = response.body.to_s.truncate(400)
        Rails.logger.error "[TTS] Gemini API error: #{response.code} #{body_preview}"

        # Extract rate limit info from error response if available
        extract_rate_limit_info(response)

        # Surface quota exhaustion clearly so callers (e.g. batch processor) can
        # detect it and abort early rather than retrying hundreds of times.
        if response.code == "429"
          # The Interactions API's error body may carry no RetryInfo, so fall
          # back to the HTTP header before giving up on a delay.
          retry_seconds = parse_retry_delay(response.body) || response['Retry-After'].to_s[/\A\d+\z/]&.to_i
          raise QuotaExhaustedError.new(retry_seconds)
        end

        return nil
      end

      # Try to extract rate limit info from successful response headers too
      extract_rate_limit_info(response)

      parsed = JSON.parse(response.body)
      audio_part = Array(parsed["steps"]).flat_map { |step| Array(step["content"]) }
                                         .find { |part| part["type"] == "audio" }
      audio_data = audio_part&.dig("data")

      unless audio_data
        Rails.logger.error "[TTS] No audio data in Gemini response (status: #{parsed['status'].inspect})"
        Rails.logger.debug "[TTS] Full response: #{response.body.to_s.truncate(500)}"
        return nil
      end

      Base64.decode64(audio_data)
    end

    def convert_pcm_to_mp3(pcm_path, mp3_path)
      # Gemini returns 16-bit signed little-endian PCM at 24kHz, mono
      stdout, stderr, status = Open3.capture3(
        "ffmpeg", "-y",
        "-f", "s16le",
        "-ar", "24000",
        "-ac", "1",
        "-i", pcm_path.to_s,
        "-codec:a", "libmp3lame",
        "-qscale:a", "4",
        mp3_path.to_s
      )

      unless status.success?
        Rails.logger.error "[TTS] ffmpeg conversion failed: #{stderr.truncate(200)}"
        return false
      end

      true
    end
  end
end
