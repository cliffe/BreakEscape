require 'open3'
require 'set'

module BreakEscape
  # The compiled story file a scenario's storyPath names, decided in one place.
  # GamesController#ink, TtsLineResolver (and so GamesController#tts), the TTS
  # line extractor, TtsExpectedLines and the TTS mission tests all find stories
  # through here, so they read the same file.
  #
  # With compile: true (the game), an .ink newer than its compiled JSON (or with
  # no JSON), or with an INCLUDE newer than it, is compiled first. With
  # compile: false (tests, tools), the lookup is the same but nothing is
  # written; ink_compiled_staleness_test.rb checks that no committed JSON is
  # stale, so both read the same content.
  #
  # A storyPath must end in .json and resolve inside one of allowed_roots (the
  # scenarios folder; test_helper.rb adds the test fixtures and the temporary
  # folder), with symlinks resolved, so a storyPath cannot name, or have
  # compiled over, any other file the server can reach.
  module InkStoryFile
    # One lock per output file, so two requests that find the same stale story
    # at once compile it once, and neither reads a half-written file
    COMPILE_LOCKS = Hash.new { |h, k| h[k] = Mutex.new }
    COMPILE_LOCKS_GUARD = Mutex.new
    # { ink path => { includes:, missing:, mtimes: } }, valid while every file
    # in mtimes (the .ink, its includes, the names not found) keeps its mtime
    INCLUDE_CACHE = {}
    INCLUDE_CACHE_GUARD = Mutex.new
    INCLUDE_LINE = /^\s*INCLUDE\s+(\S.*?)\s*$/.freeze

    class << self
      attr_writer :allowed_roots

      # The folders a storyPath may resolve into
      def allowed_roots
        @allowed_roots ||= [Engine.root.join('scenarios')]
      end
    end

    module_function

    # @param story_path [String] a storyPath, relative to the engine root
    # @param allowed_root [String, Pathname, nil] the folder the story must be
    #   in (default: any of allowed_roots)
    # @return [Pathname, nil] the compiled story, or nil when there is none
    def find(story_path, compile: true, allowed_root: nil)
      roots = allowed_root ? [allowed_root] : InkStoryFile.allowed_roots
      base = confined(story_path, roots)
      return nil unless base

      json = compiled_json(base)
      ink = ink_source(base)
      return nil unless [json, ink].compact.all? { |path| really_inside?(path, roots) }

      if compile && ink && needs_compilation?(ink, json)
        # Into the file the lookup reads next time (a stale X.ink.json, say),
        # or beside the .ink when there is none, so it compiles only once
        target = json || Pathname.new(ink.to_s.sub(/\.ink\z/, '.json'))
        return nil unless really_inside?(target, roots)

        compile_lock(target).synchronize do
          # Another request may have compiled it while this one waited
          compile!(ink, target) if needs_compilation?(ink, target)
        end
        json = target
      end
      json
    end

    # The storyPath as an absolute Pathname when it ends in .json and lies
    # inside one of roots, else nil (symlinks are checked by really_inside?)
    def confined(story_path, roots)
      return nil unless story_path.is_a?(String) && story_path.end_with?('.json') && !story_path.include?("\0")

      full = File.expand_path(story_path, Engine.root.to_s)
      inside = Array(roots).any? { |root| full.start_with?("#{File.expand_path(root.to_s)}/") }
      inside ? Pathname.new(full) : nil
    end

    # The file (or, for one not yet written, its folder) resolves, symlinks
    # followed, inside one of roots
    def really_inside?(path, roots)
      real = File.exist?(path) ? File.realpath(path) : File.realdirpath(path)
      Array(roots).any? do |root|
        real_root = File.exist?(root.to_s) ? File.realpath(root.to_s) : File.expand_path(root.to_s)
        real.start_with?("#{real_root}/")
      end
    rescue SystemCallError
      false
    end

    # The compiled JSON for a storyPath: the path itself, its .ink.json form or
    # its plain .json form, whichever is a file first.
    def compiled_json(base_path)
      base = base_path.to_s
      return nil unless base.end_with?('.json')

      [base, base.sub(/(?<!\.ink)\.json\z/, '.ink.json'), base.sub(/\.ink\.json\z/, '.json')].each do |path|
        return Pathname.new(path) if File.file?(path)
      end
      nil
    end

    # The .ink source for a storyPath, or nil
    def ink_source(base_path)
      ink = base_path.to_s.sub(/\.(ink\.)?json\z/, '.ink')
      File.file?(ink) ? Pathname.new(ink) : nil
    end

    # Every file an .ink includes, directly or through another include, in the
    # same form as ink_path (relative to the engine root, or absolute).
    # inklecate resolves every INCLUDE, nested ones too, against the root
    # story's folder, and ignores a trailing // comment. A name that is not
    # there is skipped, and added to `missing` as [name, including file].
    def includes(ink_path, missing: nil)
      entry = include_walk(ink_path.to_s)
      missing&.concat(entry[:missing])
      entry[:includes].dup
    end

    # The include walk for one .ink, cached until a file it read (or looked
    # for) changes, so a lookup costs a stat per file rather than a read
    def include_walk(ink)
      cached = INCLUDE_CACHE_GUARD.synchronize { INCLUDE_CACHE[ink] }
      return cached if cached && cached[:mtimes].all? { |file, mtime| mtime_or_nil(file) == mtime }

      entry = walk_includes(ink)
      INCLUDE_CACHE_GUARD.synchronize { INCLUDE_CACHE[ink] = entry }
    end

    def walk_includes(ink)
      root_dir = File.dirname(ink)
      found = []
      missing = []
      looked = [ink]
      queue = [ink]
      until queue.empty?
        from = queue.shift
        File.read(Engine.root.join(from)).scan(INCLUDE_LINE).flatten.each do |name|
          name = name.sub(%r{\s*//.*\z}, '')
          path = File.join(root_dir, name)
          next if looked.include?(path)

          looked << path
          if File.file?(Engine.root.join(path))
            found << path
            queue << path
          else
            missing << [name, from]
          end
        end
      end
      { includes: found.freeze, missing: missing.freeze, mtimes: looked.to_h { |f| [f, mtime_or_nil(f)] } }
    end

    def mtime_or_nil(file)
      File.mtime(Engine.root.join(file.to_s))
    rescue SystemCallError
      nil
    end

    # The newest mtime of the .ink and the files it includes
    def source_mtime(ink_path)
      [ink_path, *includes(ink_path)].map { |f| File.mtime(Engine.root.join(f.to_s)) }.max
    end

    # The .ink, or any file it includes, is newer than the JSON (or there is no JSON)
    def needs_compilation?(ink_path, json_path)
      return true unless json_path && File.exist?(json_path)

      source_mtime(ink_path) > File.mtime(json_path)
    end

    def inklecate
      Engine.root.join('bin', 'inklecate')
    end

    def compile_lock(output_path)
      COMPILE_LOCKS_GUARD.synchronize { COMPILE_LOCKS[output_path.to_s] }
    end

    # Compiles ink_path to output_path: into a temporary file beside it, then
    # renamed into place, so a reader sees the old file or the new one, never
    # half of one. inklecate prints errors, warnings and TODOs on stdout. The
    # output takes the newest source mtime seen before the compile, so an edit
    # saved while inklecate runs is still newer and compiles next time.
    # @raise [RuntimeError] when inklecate fails
    def compile!(ink_path, output_path)
      sources_at = source_mtime(ink_path)
      tmp = "#{output_path}.#{Process.pid}.#{Thread.current.object_id}.tmp"
      stdout, stderr, status = Open3.capture3(inklecate.to_s, '-o', tmp, ink_path.to_s)
      detail = [stdout, stderr].map(&:to_s).map(&:strip).reject(&:empty?).join("\n")
      unless status.success? && File.file?(tmp)
        File.delete(tmp) if File.exist?(tmp)
        Rails.logger.error "[BreakEscape] Ink compilation failed for #{File.basename(ink_path)}: #{detail}"
        raise "Ink compilation failed for #{File.basename(ink_path)}: #{detail}"
      end

      File.rename(tmp, output_path.to_s)
      File.utime(File.atime(output_path.to_s), sources_at, output_path.to_s)
      Rails.logger.warn "[BreakEscape] Ink compilation warnings for #{File.basename(ink_path)}: #{detail}" unless detail.empty?
      Rails.logger.info "[BreakEscape] Compiled #{File.basename(ink_path)} (#{(File.size(output_path) / 1024.0).round(2)} KB)"
      Pathname.new(output_path)
    end
  end
end
