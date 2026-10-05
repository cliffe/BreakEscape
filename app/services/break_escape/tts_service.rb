require 'digest'
require 'fileutils'
require 'open3'
require 'net/http'
require 'json'
require 'base64'
require 'uri'
require 'time'
require 'pathname'

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
    # GEMINI_TTS_MODEL = "gemini-2.5-flash-tts"  # GA model (currently 404 — not available)
    GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
    GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
    # Engine-root cache so pre-generated MP3s can be committed to git and are
    # found in both standalone and mounted (Hacktivity) mode without relying on
    # the host app's Rails.root.
    CACHE_DIR = BreakEscape::Engine.root.join("tts_cache")

    # The text normalisation behind every cache key: lowercase, punctuation
    # stripped, whitespace collapsed. Shared by the batch processor and the cache
    # pruner so all three compute identical keys.
    def self.normalize_text(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end

    # Cache key for already-normalised text (see normalize_text).
    def self.cache_key_for_normalized(normalized, voice_name, style_prompt = nil, language_code = nil)
      Digest::MD5.hexdigest("#{normalized}|#{voice_name}|#{style_prompt}|#{language_code}")
    end

    def self.cache_key(text, voice_name, style_prompt = nil, language_code = nil)
      cache_key_for_normalized(normalize_text(text), voice_name, style_prompt, language_code)
    end

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
    # @return [Pathname, nil] Path to cached MP3 file, or nil on failure
    def generate(text, voice_name, style_prompt = nil, language_code = nil, scenario_name: nil)
      return nil if text.blank?

      cache_key = compute_cache_key(text, voice_name, style_prompt, language_code)
      mp3_path  = cache_path(cache_key, scenario_name)

      # Migrate a flat (legacy) file into the scenario subdir if needed
      migrate_flat_cache!(cache_key, mp3_path) if scenario_name.present?

      # Cache hit. Older files have no sidecar; record what this request asked
      # for so the cache pruner knows exactly which line the file holds.
      if File.exist?(mp3_path)
        Rails.logger.debug "[TTS] Cache hit: #{scenario_name}/#{cache_key}"
        write_sidecar(mp3_path, text, voice_name, style_prompt, language_code, scenario_name, source: "cache_hit") unless File.exist?(sidecar_path(mp3_path))
        return mp3_path
      end

      # Cache miss — generate via API (requires API key)
      return nil unless enabled?
      Rails.logger.info "[TTS] Cache miss, generating: #{text.truncate(60)} (voice: #{voice_name})"
      FileUtils.mkdir_p(mp3_path.dirname)

      pcm_data = call_gemini_tts(text, voice_name, style_prompt, language_code)
      return nil unless pcm_data

      # Write raw PCM to temp file alongside the final MP3
      pcm_path = mp3_path.dirname.join("#{cache_key}.pcm")
      File.binwrite(pcm_path, pcm_data)

      # Convert PCM to MP3 via ffmpeg
      success = convert_pcm_to_mp3(pcm_path, mp3_path)

      # Cleanup temp PCM
      begin
        File.delete(pcm_path) if File.exist?(pcm_path)
      rescue => e
        Rails.logger.warn "[TTS] Failed to delete temp PCM file #{pcm_path}: #{e.message}"
      end

      if success
        Rails.logger.info "[TTS] Generated: #{scenario_name}/#{cache_key}.mp3 (#{(File.size(mp3_path) / 1024.0).round(1)} KB)"
        write_sidecar(mp3_path, text, voice_name, style_prompt, language_code, scenario_name, source: "generate")
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

    # Path of the provenance sidecar for a cached MP3: <key>.json beside <key>.mp3.
    def sidecar_path(mp3_path)
      Pathname.new(mp3_path.to_s).sub_ext(".json")
    end

    # Write a small JSON sidecar recording exactly what a cached MP3 says and in
    # which voice, so the cache pruner can tell for certain whether a file still
    # matches a line of dialogue. Best effort: a failure never affects the audio.
    # source: "generate" (new audio), "cache_hit" (backfilled on a request for an
    # existing file) or "batch" (backfilled by the batch processor).
    def write_sidecar(mp3_path, text, voice_name, style_prompt, language_code, scenario_name, source: "generate")
      data = {
        "key"          => File.basename(mp3_path.to_s, ".mp3"),
        "text"         => text.to_s,
        "voice"        => voice_name,
        "style"        => style_prompt,
        "language"     => language_code,
        "scenario"     => scenario_name,
        "source"       => source,
        "recorded_at"  => Time.now.utc.iso8601
      }
      File.write(sidecar_path(mp3_path), JSON.pretty_generate(data) + "\n")
    rescue => e
      Rails.logger.warn "[TTS] Could not write sidecar for #{mp3_path}: #{e.message}"
      nil
    end

    private

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
      flat_sidecar = sidecar_path(flat_path)
      FileUtils.mv(flat_sidecar, sidecar_path(new_path)) if File.exist?(flat_sidecar)
      Rails.logger.info "[TTS] Migrated #{cache_key}.mp3 → #{new_path.relative_path_from(CACHE_DIR)}"
    rescue => e
      Rails.logger.warn "[TTS] Migration failed for #{cache_key}: #{e.message}"
    end

    def compute_cache_key(text, voice_name, style_prompt = nil, language_code = nil)
      self.class.cache_key(text, voice_name, style_prompt, language_code)
    end

    def call_gemini_tts(text, voice_name, style_prompt, language_code = nil)
      uri = URI("#{GEMINI_API_BASE}/#{GEMINI_TTS_MODEL}:generateContent?key=#{@api_key}")

      # Build the text input — prepend style prompt if provided
      input_text = style_prompt.present? ? "#{style_prompt}\n\n#{text}" : text

      speech_config = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice_name
          }
        }
      }
      speech_config[:languageCode] = language_code if language_code.present?

      body = {
        contents: [{
          parts: [{ text: input_text }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: speech_config
        }
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
          retry_seconds = parse_retry_delay(response.body)
          raise QuotaExhaustedError.new(retry_seconds)
        end

        return nil
      end

      # Try to extract rate limit info from successful response headers too
      extract_rate_limit_info(response)

      parsed = JSON.parse(response.body)
      audio_data = parsed.dig("candidates", 0, "content", "parts", 0, "inlineData", "data")

      unless audio_data
        finish_reason = parsed.dig("candidates", 0, "finishReason")
        Rails.logger.error "[TTS] No audio data in Gemini response (finishReason: #{finish_reason.inspect})"
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
