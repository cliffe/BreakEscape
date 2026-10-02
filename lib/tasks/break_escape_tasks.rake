namespace :break_escape do
  desc "Load BreakEscape seed data"
  task seed: :environment do
    load File.join(BreakEscape::Engine.root, 'db', 'seeds.rb')
  end

  namespace :tts do
    desc <<~DESC
      Pre-generate TTS audio for scenario dialogue lines. Requires GEMINI_API_KEY.

      When running from the engine root, tasks are prefixed with app:
        bundle exec rake app:break_escape:tts:batch_generate[m01_first_contact]
        bundle exec rake app:break_escape:tts:batch_generate

      When running from the host Rails app:
        bundle exec rake break_escape:tts:batch_generate[m01_first_contact]
        bundle exec rake break_escape:tts:batch_generate

      You can also use the SCENARIO env var:
        SCENARIO=m01_first_contact bundle exec rake app:break_escape:tts:batch_generate
    DESC
    task :batch_generate, [:scenario] => :environment do |_task, args|
      # Accept scenario via task argument or SCENARIO env var (argument takes precedence)
      scenario_filter = args[:scenario].presence || ENV['SCENARIO'].presence

      puts ""
      puts "TTS Batch Generator"
      puts "=" * 80

      if scenario_filter
        puts "Processing scenario: #{scenario_filter}"
      else
        puts "Processing all scenarios"
        puts "(Tip: pass a scenario name to process just one, e.g. rake break_escape:tts:batch_generate[m01_first_contact])"
      end
      puts ""

      processor = BreakEscape::TtsBatchProcessor.new(verbose: true)
      stats = processor.process_all_scenarios(scenario_filter: scenario_filter)

      exit_code = stats[:errors] > 0 ? 1 : 0
      exit exit_code
    end

    desc "Clear TTS audio cache"
    task clear_cache: :environment do
      cache_dir = BreakEscape::TtsService::CACHE_DIR

      if Dir.exist?(cache_dir)
        file_count = Dir.glob(cache_dir.join('*.mp3')).count
        cache_size = Dir.glob(cache_dir.join('*.mp3')).sum { |f| File.size(f) rescue 0 }

        puts "Clearing TTS cache: #{cache_dir}"
        puts "Files to delete: #{file_count}"
        puts "Cache size: #{(cache_size / 1024.0 / 1024.0).round(2)} MB"

        FileUtils.rm_rf(cache_dir)
        FileUtils.mkdir_p(cache_dir)

        puts "Cache cleared successfully"
      else
        puts "Cache directory does not exist: #{cache_dir}"
      end
    end

    desc "Show TTS cache statistics"
    task cache_stats: :environment do
      cache_dir = BreakEscape::TtsService::CACHE_DIR

      unless Dir.exist?(cache_dir)
        puts "Cache directory does not exist: #{cache_dir}"
        exit
      end

      puts ""
      puts "TTS Cache Statistics"
      puts "=" * 80
      puts "Cache location: #{cache_dir}"
      puts ""

      total_files = 0
      total_size  = 0

      # Per-scenario subdirectories
      scenario_dirs = Dir.glob(cache_dir.join('*/'))
                         .select { |d| File.directory?(d) }
                         .sort_by { |d| File.basename(d) }

      if scenario_dirs.any?
        puts sprintf("  %-40s %8s %10s", "Scenario", "Files", "Size")
        puts "  " + "-" * 62
        scenario_dirs.each do |dir|
          files     = Dir.glob(File.join(dir, '*.mp3'))
          size      = files.sum { |f| File.size(f) rescue 0 }
          total_files += files.count
          total_size  += size
          puts sprintf("  %-40s %8d %8.2f MB", File.basename(dir), files.count, size / 1024.0 / 1024.0)
        end
        puts "  " + "-" * 62
      end

      # Flat (legacy) files in the root cache dir
      flat_files = Dir.glob(cache_dir.join('*.mp3'))
      if flat_files.any?
        flat_size    = flat_files.sum { |f| File.size(f) rescue 0 }
        total_files += flat_files.count
        total_size  += flat_size
        puts sprintf("  %-40s %8d %8.2f MB", "(unassigned)", flat_files.count, flat_size / 1024.0 / 1024.0)
      end

      puts ""
      puts sprintf("  %-40s %8d %8.2f MB", "TOTAL", total_files, total_size / 1024.0 / 1024.0)
      puts ""
    end
  end
end
