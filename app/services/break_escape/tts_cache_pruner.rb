require 'json'
require 'fileutils'
require 'pathname'
require 'date'

module BreakEscape
  # Finds cached TTS audio that no longer matches any line of dialogue, and
  # (only when asked) moves it to a dated trash folder or deletes it.
  #
  #   pruner = TtsCachePruner.new
  #   report = pruner.run                                   # dry run, all scenarios
  #   report = pruner.run(scenario: "sis02_energy", mode: :trash)
  #   report = pruner.run(scenario: "sis02_energy", mode: :delete)
  #   report = pruner.run(unknown: ["quota_test"], mode: :trash)
  #
  # A file is:
  #   matched   - its key is in the scenario's expected set (TtsExpectedLines)
  #   kept      - it has a sidecar whose exact text the /tts endpoint would still
  #               accept, in a voice the scenario still uses (a line composed at
  #               runtime that the expected set did not reproduce)
  #   orphan    - neither. "certain" when a sidecar names the text, otherwise
  #               "inferred" from the key alone.
  # Cache directories that match no scenario (and legacy flat files in the cache
  # root) are reported separately and are only touched when named in `unknown:`
  # (use "(flat)" for the flat files).
  class TtsCachePruner
    FLAT = "(flat)".freeze

    FileEntry = Struct.new(:path, :key, :size, :status, :sidecar, :note, keyword_init: true) do
      def orphan?
        status == :orphan_certain || status == :orphan_inferred
      end
    end

    ScenarioReport = Struct.new(:name, :files, :expected, :warnings, :walk_status, :variable_lines,
                                :voices, keyword_init: true) do
      def count(*statuses)
        files.count { |f| statuses.include?(f.status) }
      end
      def orphans
        files.select(&:orphan?)
      end
      def orphan_bytes
        orphans.sum(&:size)
      end
      def bytes
        files.sum(&:size)
      end
    end

    UnknownReport = Struct.new(:name, :files, :bytes, keyword_init: true)

    Report = Struct.new(:scenarios, :unknown, :mode, :actions, :trash_dir, :errors, keyword_init: true)

    attr_reader :cache_dir, :scenarios_dir

    def initialize(cache_dir: TtsService::CACHE_DIR,
                   scenarios_dir: BreakEscape::Engine.root.join("scenarios"),
                   trash_root: BreakEscape::Engine.root.join("tmp", "tts_pruned"),
                   runtime_walk: true, walk_time: 8, today: Date.today)
      @cache_dir = Pathname.new(cache_dir)
      @scenarios_dir = Pathname.new(scenarios_dir)
      @trash_root = Pathname.new(trash_root)
      @runtime_walk = runtime_walk
      @walk_time = walk_time
      @today = today
    end

    # @param scenario [String, nil] only this scenario's cache directory
    # @param mode [Symbol] :dry_run (default), :trash (move to tmp/tts_pruned/<date>/) or :delete
    # @param unknown [Array<String>] unknown cache directories (or "(flat)") to prune too
    # @param certain_only [Boolean] prune only orphans whose sidecar names the text
    # @return [Report]
    def run(scenario: nil, mode: :dry_run, unknown: [], certain_only: false)
      raise ArgumentError, "mode must be :dry_run, :trash or :delete" unless %i[dry_run trash delete].include?(mode)
      unknown = Array(unknown).map(&:to_s).reject(&:empty?)
      errors = []

      known = known_scenarios
      cached = cache_subdirs
      if scenario
        unless known.include?(scenario) || cached.include?(scenario)
          raise ArgumentError, "No scenario or cache directory named #{scenario.inspect}"
        end
        unless known.include?(scenario)
          raise ArgumentError, "#{scenario} matches no scenario; it is an unknown cache directory. " \
                               "Name it with unknown: [#{scenario.inspect}] to prune it."
        end
      end

      targets = scenario ? [scenario] : (cached & known).sort
      reports = targets.map { |name| scan_scenario(name) }

      unknown_reports = (scenario ? [] : (cached - known).sort.map { |d| unknown_report(d, @cache_dir.join(d)) })
      flat = flat_files
      unknown_reports << UnknownReport.new(name: FLAT, files: flat, bytes: flat.sum { |f| File.size(f) }) if flat.any? && !scenario

      unknown.each do |u|
        next if unknown_reports.any? { |r| r.name == u }
        if u == FLAT then errors << "no flat files to prune"
        elsif known.include?(u) then errors << "#{u} is a known scenario, not an unknown directory"
        elsif cached.include?(u) then unknown_reports << unknown_report(u, @cache_dir.join(u))
        else errors << "no cache directory named #{u}"
        end
      end

      actions = []
      trash_dir = @trash_root.join(@today.iso8601)
      unless mode == :dry_run
        reports.each do |r|
          r.orphans.each do |f|
            next if certain_only && f.status != :orphan_certain
            actions << remove(f.path, r.name, mode, trash_dir, f.status.to_s)
          end
        end
        unknown_reports.select { |u| unknown.include?(u.name) }.each do |u|
          u.files.each do |path|
            if u.name == FLAT
              # Legacy flat files migrate into a scenario directory on use: keep current lines
              next if reports.any? { |r| r.expected.include_key?(File.basename(path, ".mp3")) }
              actions << remove(path, u.name, mode, trash_dir, "flat_orphan")
            else
              actions << remove(path, u.name, mode, trash_dir, "unknown_directory")
            end
          end
        end
        write_manifest(trash_dir, actions) if mode == :trash && actions.any?
      end

      Report.new(scenarios: reports, unknown: unknown_reports, mode: mode, actions: actions,
                 trash_dir: (mode == :trash ? trash_dir : nil), errors: errors)
    end

    # Scenario directories with a scenario.json.erb
    def known_scenarios
      Dir.glob(@scenarios_dir.join("*", "scenario.json.erb")).map { |f| File.basename(File.dirname(f)) }.sort
    end

    def cache_subdirs
      return [] unless Dir.exist?(@cache_dir)
      Dir.children(@cache_dir).select { |d| File.directory?(@cache_dir.join(d)) && !d.start_with?(".") }.sort
    end

    def flat_files
      Dir.glob(@cache_dir.join("*.mp3")).sort
    end

    def scan_scenario(name)
      dir = @cache_dir.join(name)
      expected = TtsExpectedLines.new(name, scenarios_dir: @scenarios_dir,
                                            runtime_walk: @runtime_walk, walk_time: @walk_time).build!
      files = Dir.glob(dir.join("*.mp3")).sort.map { |path| classify(path, expected) }
      ScenarioReport.new(name: name, files: files, expected: expected, warnings: expected.warnings,
                         walk_status: expected.walk_status, variable_lines: expected.variable_lines,
                         voices: expected.voices)
    end

    private

    def classify(path, expected)
      key = File.basename(path, ".mp3")
      size = File.size(path)
      sidecar = read_sidecar(path)
      entry = FileEntry.new(path: path, key: key, size: size, sidecar: sidecar)

      if expected.include_key?(key)
        entry.status = :matched
        entry.note = expected.source_of(expected.keys[key][0])
      elsif sidecar
        sidecar_args = sidecar.values_at("text", "voice", "style", "language")
        sidecar_keys = [TtsService.cache_key(*sidecar_args), TtsService.legacy_cache_key(*sidecar_args)]
        voice_ok = expected.voice_configured?(sidecar["voice"], sidecar["style"], sidecar["language"])
        if !sidecar_keys.include?(key)
          # Sidecar doesn't describe this file: fall back to the key alone
          entry.status = :orphan_inferred
          entry.note = "sidecar does not match file key"
        elsif voice_ok && expected.requestable_text?(sidecar["text"])
          entry.status = :kept
          entry.note = "sidecar text still accepted by /tts"
        else
          entry.status = :orphan_certain
          entry.note = voice_ok ? "text no longer in the scenario" : "voice no longer configured"
        end
      else
        entry.status = :orphan_inferred
      end
      entry
    end

    def read_sidecar(mp3_path)
      path = Pathname.new(mp3_path).sub_ext(".json")
      return nil unless File.exist?(path)
      data = JSON.parse(File.read(path))
      data.is_a?(Hash) && data["text"].is_a?(String) ? data : nil
    rescue JSON::ParserError
      nil
    end

    def unknown_report(name, dir)
      files = Dir.glob(dir.join("*")).select { |f| File.file?(f) }.sort
      UnknownReport.new(name: name, files: files, bytes: files.sum { |f| File.size(f) })
    end

    def remove(path, group, mode, trash_dir, reason)
      paths = [path]
      sidecar = Pathname.new(path).sub_ext(".json").to_s
      paths << sidecar if path.end_with?(".mp3") && File.exist?(sidecar)
      moved_to = nil
      if mode == :trash
        dest_dir = trash_dir.join(group)
        FileUtils.mkdir_p(dest_dir)
        paths.each { |p| FileUtils.mv(p, dest_dir.join(File.basename(p)), force: true) }
        moved_to = dest_dir.join(File.basename(path)).to_s
      else
        paths.each { |p| File.delete(p) }
      end
      { "file" => relative(path), "group" => group, "reason" => reason, "action" => mode.to_s,
        "moved_to" => moved_to && relative(moved_to), "with_sidecar" => paths.size > 1 }
    end

    def write_manifest(trash_dir, actions)
      manifest = trash_dir.join("manifest.json")
      existing = File.exist?(manifest) ? (JSON.parse(File.read(manifest)) rescue []) : []
      stamp = Time.now.utc.iso8601
      File.write(manifest, JSON.pretty_generate(existing + actions.map { |a| a.merge("at" => stamp) }) + "\n")
    end

    def relative(path)
      Pathname.new(path).relative_path_from(BreakEscape::Engine.root).to_s
    rescue ArgumentError
      path.to_s
    end

    # Human-readable report. verbose lists matched/kept files too.
    def self.print_report(report, verbose: false, io: $stdout)
      mb = ->(b) { Kernel.format("%.2f MB", b / 1024.0 / 1024.0) }
      io.puts ""
      io.puts "TTS cache prune (#{report.mode == :dry_run ? 'DRY RUN: nothing moved or deleted' : report.mode})"
      io.puts "=" * 96
      io.puts Kernel.format("  %-24s %6s %9s %8s %8s %6s %8s %9s %10s", "Scenario", "Files", "Size", "Lines",
                            "Matched", "Kept", "Orphans", "(certain)", "Orphan sz")
      io.puts "  " + "-" * 94
      report.scenarios.each do |r|
        io.puts Kernel.format("  %-24s %6d %9s %8d %8d %6d %8d %9d %10s", r.name, r.files.size, mb.(r.bytes),
                              r.expected.texts.size, r.count(:matched), r.count(:kept), r.orphans.size,
                              r.count(:orphan_certain), mb.(r.orphan_bytes))
      end
      io.puts "  " + "-" * 94
      io.puts "  Lines = distinct normalised candidate texts (crossed with every voice in the scenario)."
      report.scenarios.each do |r|
        io.puts ""
        io.puts "#{r.name}: #{r.files.size} files, #{r.orphans.size} orphan (#{mb.(r.orphan_bytes)}); " \
                "voices #{r.voices.size}; ink walk #{r.walk_status}"
        r.warnings.uniq.each { |w| io.puts "  ! #{w}" }
        if r.variable_lines.positive?
          io.puts "  ! #{r.variable_lines} ink line(s) print a variable; audio for those can't be matched statically"
        end
        r.files.each do |f|
          next unless f.orphan? || verbose
          label = { matched: "match", kept: "KEEP ", orphan_certain: "ORPH!", orphan_inferred: "orph " }[f.status]
          text = f.sidecar ? "  \"#{f.sidecar['text'].to_s.tr("\n", ' ')[0, 70]}\" [#{f.sidecar['voice']}]" : ""
          io.puts Kernel.format("    %s %s.mp3 %7.1f KB%s%s", label, f.key, f.size / 1024.0, text,
                                f.note && f.status != :matched ? "  (#{f.note})" : "")
        end
      end
      if report.unknown.any?
        io.puts ""
        io.puts "Unknown cache directories (match no scenario; never pruned unless named):"
        report.unknown.each do |u|
          io.puts Kernel.format("  %-24s %6d files %10s", u.name, u.files.size, mb.(u.bytes))
        end
      end
      report.errors.each { |e| io.puts "ERROR: #{e}" }
      io.puts ""
      if report.mode == :dry_run
        total = report.scenarios.sum { |r| r.orphans.size }
        io.puts "#{total} orphan file(s) found. Nothing was changed."
        io.puts "Move them to tmp/tts_pruned/<date>/ with APPLY=1 (restore by moving back), or delete with DELETE=1."
      else
        io.puts "#{report.actions.size} file(s) #{report.mode == :trash ? "moved to #{report.trash_dir}" : 'deleted'}."
      end
      io.puts ""
    end
  end
end
