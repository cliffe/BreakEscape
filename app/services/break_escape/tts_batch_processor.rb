require 'json'
require 'fileutils'
require 'digest'

module BreakEscape
  class TtsBatchProcessor
    attr_reader :stats

    # Seconds to wait between each Gemini API call.
    # Free tier (AI Studio key): ~15 RPM → use 4s.
    # Paid tier (Cloud billing key): 1000+ RPM → 0.1s is fine and keeps batch fast.
    # Override via GEMINI_TTS_DELAY env var: GEMINI_TTS_DELAY=0.5
    INITIAL_REQUEST_DELAY_SECONDS = (ENV['GEMINI_TTS_DELAY'] || 0.1).to_f

    # Maximum number of retry attempts for a failed generation.
    MAX_RETRIES = 3

    # Minimum delay to enforce (seconds)
    MIN_DELAY = 0.05

    # Maximum delay to enforce (seconds)
    MAX_DELAY = 5.0

    def initialize(verbose: true)
      @tts_service = TtsService.new
      @verbose = verbose

      # Check for explicit quota configuration from env vars
      @configured_rpm = ENV['GEMINI_MAX_RPM']&.to_i
      @configured_rpd = ENV['GEMINI_MAX_RPD']&.to_i

      @stats = {
        scenarios_scanned: 0,
        npcs_found: 0,
        dialogue_lines_extracted: 0,
        unique_lines: 0,
        audio_generated: 0,
        cache_hits: 0,
        errors: 0,
        skipped: 0,
        requests_made: 0,
        quota_rpm: nil,
        quota_rpd: nil,
        rpm_limit_hits: 0,
        daily_limit_hits: 0,
        generated_before_rpm_limit: 0,
        generated_before_daily_limit: 0
      }
      @errors_list = []
      @last_request_at = nil

      # Initialize delay: use configured quota or fall back to env var default
      if @configured_rpm
        # Calculate delay from configured RPM: aim for 85% utilization
        @current_delay = (60.0 / @configured_rpm) * 0.85
        @current_delay = [[@current_delay, MIN_DELAY].max, MAX_DELAY].min
      else
        @current_delay = INITIAL_REQUEST_DELAY_SECONDS
      end

      @request_history = []  # Track timestamps of last N requests for RPM calculation
      @consecutive_failures = 0  # Track failures in a row to detect rate limiting

      # Handle Ctrl-C gracefully
      Signal.trap("INT") do
        # Can't use log methods from trap context, print directly instead
        puts ""
        puts "  ╔══════════════════════════════════════════════════════════════╗"
        puts "  ║  Batch interrupted by user (Ctrl-C)                         ║"
        puts "  ║  Printing summary and exiting...                            ║"
        puts "  ╚══════════════════════════════════════════════════════════════╝"
        puts ""
        print_summary
        exit 0
      end
    end

    # Process all scenarios in the scenarios directory
    # @param scenario_filter [String, nil] Optional scenario directory name to process only one scenario
    # @return [Hash] Statistics about the batch processing
    def process_all_scenarios(scenario_filter: nil)
      scenarios_dir = BreakEscape::Engine.root.join('scenarios')

      unless Dir.exist?(scenarios_dir)
        log_error "Scenarios directory not found: #{scenarios_dir}"
        return @stats
      end

      unless @tts_service.enabled?
        log_error "TTS service not enabled — set GEMINI_API_KEY to generate audio"
        @stats[:errors] += 1
        return @stats
      end

      scenario_dirs = Dir.entries(scenarios_dir).select do |entry|
        full_path = scenarios_dir.join(entry)
        File.directory?(full_path) && !entry.start_with?('.')
      end

      # Apply filter if specified
      if scenario_filter
        scenario_dirs.select! { |dir| dir == scenario_filter }
        if scenario_dirs.empty?
          log_error "Scenario not found: #{scenario_filter}"
          return @stats
        end
      end

      log_info "=" * 80
      log_info "TTS BATCH PROCESSOR - Starting"
      log_info "=" * 80
      log_info "Scenarios to process: #{scenario_dirs.length}"
      log_info ""

      # Display initial delay setting
      log_info "Initial request delay: #{@current_delay.round(3)}s"
      if @configured_rpm
        log_info "(Configured quota: #{@configured_rpm} RPM, #{@configured_rpd} RPD)"
        log_info "(Delay calculated from configured RPM: 60/#{@configured_rpm} × 0.85 = #{@current_delay.round(3)}s)"
      else
        log_info "(Will auto-adjust based on detected API quotas)"
      end
      log_info ""

      scenario_dirs.sort.each do |scenario_dir|
        process_scenario(scenarios_dir.join(scenario_dir))
      end

      # Update quota info from service if detected
      if @tts_service.rate_limit_info
        @stats[:quota_rpm] = @tts_service.rate_limit_info.requests_per_minute
        @stats[:quota_rpd] = @tts_service.rate_limit_info.requests_per_day
      end

      print_summary
      @stats
    end

    private

    def process_scenario(scenario_path)
      scenario_name = scenario_path.basename.to_s
      scenario_file = scenario_path.join('scenario.json.erb')

      unless File.exist?(scenario_file)
        log_info "Skipping #{scenario_name} (no scenario.json.erb)"
        @stats[:skipped] += 1
        return
      end

      @stats[:scenarios_scanned] += 1
      log_info "Processing scenario: #{scenario_name}"

      begin
        # Rendered via Mission::ScenarioBinding (empty vm_context, since batch
        # generation runs outside a Hacktivity VM session). The extractor reads
        # each ink story the way the client does and gives every line the
        # npc_id and voice the TTS endpoint will use for it.
        extractor = TtsLineExtractor.for_scenario(scenario_name)
        entries = extractor.entries
        @stats[:npcs_found] += extractor.hosts.length
        @stats[:dialogue_lines_extracted] += entries.length

        if entries.empty?
          log_info "  No voiced lines found"
        else
          by_speaker = entries.group_by(&:npc_id)
          log_info "  #{entries.length} voiced lines from #{extractor.hosts.length} conversations, #{by_speaker.length} speakers"
          by_speaker.each do |npc_id, lines|
            voice = lines.first.voice
            log_info "    #{npc_id} (voice: #{voice['name']}): #{lines.length} lines"
          end
        end

        if extractor.notes.any?
          log_info "  Not voiced by the batch (#{extractor.notes.length}): lines the walker can't reconstruct or the endpoint won't serve"
          extractor.notes.each do |note|
            log_info "    - #{note.source} #{note.path}: #{note.reason}#{note.text ? " | #{note.text.truncate(90)}" : ''}"
          end
        end

        entries.each do |entry|
          generate_audio_for_line(entry.text, entry.voice, scenario_name, entry.npc_id)
        end

        log_info ""
      rescue => e
        log_error "Error processing scenario #{scenario_path.basename}: #{e.message}"
        @stats[:errors] += 1
      end
    end

    def generate_audio_for_line(text, voice_config, scenario_name, npc_id)
      voice_name = voice_config['name']
      style_prompt = voice_config['style']
      language_code = voice_config['language']

      # Check if already cached — no API call needed.
      # Use the service's own cache_path so the path logic is defined in one place.
      cache_key = @tts_service.cache_key_for(text, voice_name, style_prompt, language_code)
      mp3_path = @tts_service.cache_path(cache_key, scenario_name)

      if File.exist?(mp3_path)
        # Backfill provenance for audio cached before sidecars existed
        unless File.exist?(@tts_service.sidecar_path(mp3_path))
          @tts_service.write_sidecar(mp3_path, text, voice_name, style_prompt, language_code, scenario_name,
                                     source: "batch", npc_id: npc_id)
        end
        @stats[:cache_hits] += 1
        @consecutive_failures = 0  # Reset on cache hit
        log_verbose "      ✓ Cached: #{text.truncate(60)}"
        return
      end

      @stats[:unique_lines] += 1
      log_verbose "      → Generating: #{text.truncate(60)}"

      # Respect rate limit: enforce minimum gap between API calls
      throttle_request!

      attempt = 0
      begin
        attempt += 1
        @stats[:requests_made] += 1
        result = @tts_service.generate(text, voice_name, style_prompt, language_code, scenario_name: scenario_name, npc_id: npc_id)

        if result
          @stats[:audio_generated] += 1

          # Detect and log quotas on first successful generation
          if @stats[:requests_made] == 1 && @tts_service.rate_limit_info
            rate_info = @tts_service.rate_limit_info
            @stats[:quota_rpm] = rate_info.requests_per_minute
            @stats[:quota_rpd] = rate_info.requests_per_day
            log_info ""
            log_info "  ⚙ Detected API Rate Limits:"
            log_info "    Requests/minute (RPM): #{@stats[:quota_rpm] || 'Unknown'}"
            log_info "    Requests/day (RPD):    #{@stats[:quota_rpd] || 'Unknown'}"
            log_info "    Optimizing delay to maximize quota usage..."
            log_info ""
          end

          @consecutive_failures = 0  # Reset on success
          log_verbose "      ✓ Generated: #{File.basename(result)}"
        else
          raise "TtsService returned nil"
        end
      rescue TtsService::QuotaExhaustedError => e
        # Handle rate limits intelligently:
        # - Per-minute limits (< 120s): wait 61s and continue once
        # - Per-day limits (>= 120s): stop batch, wait 24h
        @stats[:errors] += 1

        retry_after = e.retry_after || 3600  # Default to 1 hour if unknown

        # If retry_after is under ~120 seconds, it's likely an RPM (per-minute) limit
        if retry_after < 120
          @stats[:rpm_limit_hits] += 1
          @stats[:generated_before_rpm_limit] = @stats[:audio_generated]

          # Allow ONE retry after per-minute limit
          if attempt < 2
            wait_time = 61  # Always wait 61s to clear per-minute quota window
            log_error ""
            log_error "  ╔══════════════════════════════════════════════════════════════╗"
            log_error "  ║  Per-Minute Rate Limit Hit — waiting to recover              ║"
            log_error "  ║  Waiting 61s for quota to reset...                           ║"
            log_error "  ║  (Request rate will be reduced for remaining batch)          ║"
            log_error "  ╚══════════════════════════════════════════════════════════════╝"
            log_error "  Generated #{@stats[:audio_generated]} audio files before hitting limit"
            log_error ""

            # Print summary at this point
            print_summary

            # Increase delay for remaining requests to avoid hitting limit again
            @current_delay = [@current_delay * 2, MAX_DELAY].min
            log_info "Increasing inter-request delay to #{@current_delay.round(3)}s"

            sleep wait_time
            @last_request_at = Time.now

            log_verbose "      ↻ Retrying after RPM reset: #{text.truncate(40)}"
            retry
          else
            # Hit RPM limit twice in a row — likely a daily limit disguised as RPM
            @stats[:daily_limit_hits] += 1
            @stats[:generated_before_daily_limit] = @stats[:audio_generated]
            log_error ""
            log_error "  ╔══════════════════════════════════════════════════════════════╗"
            log_error "  ║  Daily Quota Exhausted (after per-minute retry)             ║"
            log_error "  ║  #{e.message.ljust(62)}║"
            log_error "  ║  Run again once the quota resets (24h window).              ║"
            log_error "  ║  Already-cached files are safe and will be skipped.         ║"
            log_error "  ╚══════════════════════════════════════════════════════════════╝"
            log_error "  Generated #{@stats[:audio_generated]} audio files before hitting daily limit"
            log_error ""
            print_summary
            exit 1
          end
        else
          # Per-day limit or unknown long limit — this is severe
          @stats[:daily_limit_hits] += 1
          @stats[:generated_before_daily_limit] = @stats[:audio_generated]
          log_error ""
          log_error "  ╔══════════════════════════════════════════════════════════════╗"
          log_error "  ║  Daily Quota Exhausted — stopping batch                     ║"
          log_error "  ║  #{e.message.ljust(62)}║"
          log_error "  ║  Run again once the quota resets (24h window).              ║"
          log_error "  ║  Already-cached files are safe and will be skipped.         ║"
          log_error "  ╚══════════════════════════════════════════════════════════════╝"
          log_error "  Generated #{@stats[:audio_generated]} audio files before hitting daily limit"
          log_error ""
          print_summary
          exit 1
        end
      rescue => e
        # Non-quota errors: but detect rate limiting by repeated failures
        @consecutive_failures += 1

        # If we've failed multiple times in a row on early attempts,
        # we're likely rate limited (even without explicit 429)
        if @consecutive_failures >= 2 && @stats[:audio_generated] == 0
          log_error ""
          log_error "  ╔══════════════════════════════════════════════════════════════╗"
          log_error "  ║  Rate Limited (likely per-minute) — waiting to recover       ║"
          log_error "  ║  Multiple failures on startup suggest rate limiting          ║"
          log_error "  ║  Waiting 61s before resuming...                              ║"
          log_error "  ╚══════════════════════════════════════════════════════════════╝"
          log_error ""

          # Increase delay to avoid spam
          @current_delay = [@current_delay * 2, MAX_DELAY].min
          log_info "Increasing inter-request delay to #{@current_delay.round(3)}s"

          sleep 61
          @last_request_at = Time.now
          @consecutive_failures = 0

          # Retry the current line
          if attempt < MAX_RETRIES
            log_verbose "      ↻ Retrying after rate limit reset: #{text.truncate(40)}"
            retry
          end
        end

        # Regular retry logic for other errors
        if attempt < MAX_RETRIES
          # Modest backoff: 0.5s → 1s → 1.5s (linear growth)
          wait = 0.5 * attempt
          log_verbose "      ↻ Retry #{attempt}/#{MAX_RETRIES - 1} in #{wait.round(1)}s: #{text.truncate(35)}"
          sleep wait
          @last_request_at = Time.now
          retry
        end

        @stats[:errors] += 1
        @errors_list << "Failed: #{text.truncate(60)}"
        log_error "      ✗ Failed after #{MAX_RETRIES} attempts: #{text.truncate(60)}"
      end
    end

    # Enforce REQUEST_DELAY_SECONDS between consecutive API calls.
    def throttle_request!
      if @last_request_at
        elapsed = Time.now - @last_request_at
        remaining = @current_delay - elapsed
        if remaining > 0
          log_verbose "      … rate-limit wait #{remaining.round(1)}s (delay: #{@current_delay.round(2)}s)"
          sleep remaining
        end
      end
      @last_request_at = Time.now
      @request_history << @last_request_at

      # Clean up old history (keep only last 60 requests)
      cutoff_time = @last_request_at - 60
      @request_history.select! { |t| t > cutoff_time }

      # Attempt to optimize delay based on detected quotas
      optimize_delay_for_quotas
    end

    # Calculate and adjust delay based on detected quotas and actual throughput
    def optimize_delay_for_quotas
      rate_info = @tts_service.rate_limit_info
      return unless rate_info

      rpm_quota = rate_info.requests_per_minute
      rpd_quota = rate_info.requests_per_day

      # Calculate ideal delay based on RPM limit (most immediate constraint)
      if rpm_quota && rpm_quota > 0
        ideal_delay = 60.0 / rpm_quota
        # Use 85% of the theoretical max to provide safety margin
        ideal_delay = ideal_delay * 0.85
      else
        ideal_delay = @current_delay
      end

      # Calculate ideal delay based on daily limit
      if rpd_quota && rpd_quota > 0 && @stats[:requests_made] > 0
        # Estimate time remaining in the day (assume 24h quota window)
        # Aim to use ~90% of daily quota
        target_daily = rpd_quota * 0.9
        ideal_daily_delay = (24 * 3600) / target_daily
      else
        ideal_daily_delay = @current_delay
      end

      # Use the more conservative (larger) of the two delays
      new_delay = [ideal_delay, ideal_daily_delay].max

      # Clamp to reasonable bounds
      new_delay = [[new_delay, MIN_DELAY].max, MAX_DELAY].min

      # Only update if significantly different (to avoid thrashing)
      if (new_delay - @current_delay).abs > 0.01
        log_verbose "      ⚙ Adjusted delay: #{@current_delay.round(3)}s → #{new_delay.round(3)}s (RPM quota: #{rpm_quota}, RPD quota: #{rpd_quota})"
        @current_delay = new_delay
      end
    end

    def print_summary
      log_info "=" * 80
      log_info "BATCH PROCESSING COMPLETE"
      log_info "=" * 80
      log_info "Scenarios scanned:        #{@stats[:scenarios_scanned]}"
      log_info "NPCs found:               #{@stats[:npcs_found]}"
      log_info "Dialogue lines extracted: #{@stats[:dialogue_lines_extracted]}"
      log_info "Unique lines:             #{@stats[:unique_lines]}"
      log_info "Audio generated:          #{@stats[:audio_generated]}"
      log_info "API requests made:        #{@stats[:requests_made]}"
      log_info "Cache hits:               #{@stats[:cache_hits]}"
      log_info "Errors:                   #{@stats[:errors]}"
      log_info "Skipped scenarios:        #{@stats[:skipped]}"
      log_info ""

      # Display quota limit hits if any occurred
      if @stats[:rpm_limit_hits] > 0 || @stats[:daily_limit_hits] > 0
        log_info "Rate Limit Hits:"
        if @stats[:rpm_limit_hits] > 0
          log_info "  Per-minute limits hit:  #{@stats[:rpm_limit_hits]}"
          log_info "  Generated before RPM:   #{@stats[:generated_before_rpm_limit]}"
        end
        if @stats[:daily_limit_hits] > 0
          log_info "  Per-day limits hit:     #{@stats[:daily_limit_hits]}"
          log_info "  Generated before RPD:   #{@stats[:generated_before_daily_limit]}"
        end
        log_info ""
      end

      # Display detected quotas
      if @stats[:quota_rpm].present? || @stats[:quota_rpd].present?
        log_info "Detected API Quotas:"
        log_info "  Requests/minute (RPM): #{@stats[:quota_rpm] || 'Unknown'}"
        log_info "  Requests/day (RPD):    #{@stats[:quota_rpd] || 'Unknown'}"
        log_info "  Final delay used:      #{@current_delay.round(3)}s"
        log_info ""
      end

      cache_size = calculate_cache_size
      log_info "Cache size: #{format_bytes(cache_size)}"
      log_info "Cache location: #{TtsService::CACHE_DIR}"
      log_info ""

      if @errors_list.any?
        log_info "ERRORS (#{@errors_list.length} failed):"
        @errors_list.each { |err| log_info "  - #{err}" }
        log_info ""
      end

      log_info "=" * 80
    end

    def calculate_cache_size
      return 0 unless Dir.exist?(TtsService::CACHE_DIR)

      Dir.glob(TtsService::CACHE_DIR.join('*.mp3')).sum do |file|
        File.size(file)
      rescue
        0
      end
    end

    def format_bytes(bytes)
      if bytes < 1024
        "#{bytes} B"
      elsif bytes < 1024 * 1024
        "#{(bytes / 1024.0).round(1)} KB"
      else
        "#{(bytes / 1024.0 / 1024.0).round(1)} MB"
      end
    end

    def log_info(message)
      puts message if @verbose
      Rails.logger.info("[TTS Batch] #{message}")
    end

    def log_verbose(message)
      puts message if @verbose
      Rails.logger.debug("[TTS Batch] #{message}")
    end

    def log_error(message)
      puts "ERROR: #{message}" if @verbose
      Rails.logger.error("[TTS Batch] #{message}")
    end
  end
end
