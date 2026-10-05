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

    desc <<~DESC
      List clips nothing will request (dry run; deletes nothing).

      Prints each manifest entry whose key is not one the client can ask for
      now: every line TtsLineExtractor finds in the scenario, voiced as the
      endpoint voices it. Lines generated live by the endpoint are in that set,
      so whatever is left is waste. The text is printed so a person can judge.
        bundle exec rake app:break_escape:tts:wasted[m01_first_contact]
        bundle exec rake app:break_escape:tts:wasted          # every scenario with a manifest
    DESC
    task :wasted, [:scenario] => :environment do |_task, args|
      cache_dir = BreakEscape::TtsService::CACHE_DIR
      filter = args[:scenario].presence || ENV['SCENARIO'].presence
      scenarios = if filter
        [filter]
      else
        Dir.glob(cache_dir.join('*', BreakEscape::TtsService::MANIFEST_FILENAME)).map { |p| File.basename(File.dirname(p)) }.sort
      end

      totals = Hash.new(0)
      scenarios.each do |scenario|
        manifest_path = cache_dir.join(scenario, BreakEscape::TtsService::MANIFEST_FILENAME)
        unless File.exist?(manifest_path)
          puts "#{scenario}: no manifest"
          next
        end
        unless File.exist?(BreakEscape::Engine.root.join('scenarios', scenario, 'scenario.json.erb'))
          puts "#{scenario}: no scenario.json.erb, so every clip is unrequested; skipped"
          next
        end

        manifest = JSON.parse(File.read(manifest_path))
        expected = BreakEscape::TtsLineExtractor.for_scenario(scenario).keys
        wasted = manifest.reject { |key, _| expected.include?(key) }

        puts ""
        puts "#{scenario}: #{wasted.size} of #{manifest.size} manifest clips are not requested (#{expected.size} lines expected)"
        wasted.sort_by { |_, e| [e['npc'].to_s, e['text'].to_s] }.each do |key, entry|
          mp3 = cache_dir.join(scenario, "#{key}.mp3")
          state = File.exist?(mp3) ? '' : ' (mp3 missing)'
          puts "  #{mp3.relative_path_from(BreakEscape::Engine.root)}#{state}"
          puts "    #{entry['npc']} [#{entry['voice']}]: #{entry['text']}"
        end
        totals[:manifest] += manifest.size
        totals[:wasted] += wasted.size
      end

      puts ""
      puts "Total: #{totals[:wasted]} unrequested of #{totals[:manifest]} manifest clips. Nothing was deleted."
    end

    desc <<~DESC
      Find cached TTS audio that no longer matches any line of dialogue. Dry run by default.

      Builds every line each scenario can still voice (ink source with every inline
      alternative/conditional expanded, compiled ink, a runtime ink walk with node,
      and every string in scenario.json.erb: barks, timed messages, voice objects),
      crosses them with every voice in the scenario, and lists cache files whose key
      matches none. Files with a sidecar (<key>.json, written since sidecars were
      added) are judged on their exact text.

        bin/rails app:break_escape:tts:prune_cache                     # dry run, all scenarios
        bin/rails app:break_escape:tts:prune_cache[sis02_energy]       # dry run, one scenario
        APPLY=1  bin/rails app:break_escape:tts:prune_cache[sis02_energy]   # move orphans to tmp/tts_pruned/<date>/
        DELETE=1 bin/rails app:break_escape:tts:prune_cache[sis02_energy]   # delete orphans permanently

      Options (env vars):
        APPLY=1         move orphans (and their sidecars) to tmp/tts_pruned/<date>/<scenario>/, with a manifest.json
        DELETE=1        delete orphans permanently instead of moving them
        UNKNOWN=a,b     also prune these cache directories that match no scenario ("(flat)" = legacy root files)
        CERTAIN_ONLY=1  prune only orphans whose sidecar names their text
        VERBOSE=1       list matched and kept files too
        NO_WALK=1       skip the node runtime ink walk (static scan only)
        WALK_TIME=8     seconds per ink file for the runtime walk
      Wrapper: scripts/tts_prune_cache.sh [scenario] [--apply|--delete] [--unknown a,b] ...
      From the host app, drop the app: prefix (rake break_escape:tts:prune_cache).
    DESC
    task :prune_cache, [:scenario] => :environment do |_task, args|
      truthy = ->(v) { %w[1 true yes].include?(v.to_s.downcase) }
      scenario = args[:scenario].presence || ENV['SCENARIO'].presence
      mode = if truthy.(ENV['DELETE']) then :delete
             elsif truthy.(ENV['APPLY']) then :trash
             else :dry_run
             end
      unknown = ENV['UNKNOWN'].to_s.split(',').map(&:strip).reject(&:empty?)

      pruner = BreakEscape::TtsCachePruner.new(
        runtime_walk: !truthy.(ENV['NO_WALK']),
        walk_time: (ENV['WALK_TIME'].presence || 8).to_i
      )
      begin
        report = pruner.run(scenario: scenario, mode: mode, unknown: unknown,
                            certain_only: truthy.(ENV['CERTAIN_ONLY']))
      rescue ArgumentError => e
        abort "ERROR: #{e.message}"
      end
      BreakEscape::TtsCachePruner.print_report(report, verbose: truthy.(ENV['VERBOSE']))
      exit(report.errors.any? ? 1 : 0)
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
