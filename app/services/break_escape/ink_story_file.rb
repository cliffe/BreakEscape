require 'open3'
require 'set'

module BreakEscape
  # The compiled story file a scenario's storyPath names, decided in one place.
  # GamesController#ink, TtsLineResolver (and so GamesController#tts), the TTS
  # line extractor and the TTS mission tests all find stories through here, so
  # they read the same file.
  #
  # With compile: true (the game), an .ink newer than its compiled JSON (or with
  # no JSON), or with an INCLUDE newer than it, is compiled first. With
  # compile: false (tests, tools), the lookup is the same but nothing is
  # written; ink_compiled_staleness_test.rb checks that no committed JSON is
  # stale, so both read the same content.
  #
  # A storyPath must end in .json and resolve inside one of allowed_roots (the
  # scenarios folder; test_helper.rb adds the test fixtures and the temporary
  # folder), so a storyPath cannot name, or have compiled over, any other file
  # the server can reach.
  module InkStoryFile
    # One lock per output file, so two requests that find the same stale story
    # at once compile it once, and neither reads a half-written file
    COMPILE_LOCKS = Hash.new { |h, k| h[k] = Mutex.new }
    COMPILE_LOCKS_GUARD = Mutex.new

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
      base = confined(story_path, allowed_root ? [allowed_root] : InkStoryFile.allowed_roots)
      return nil unless base

      json = compiled_json(base)
      ink = ink_source(base)
      if compile && ink && needs_compilation?(ink, json)
        # Into the file the lookup reads next time (a stale X.ink.json, say),
        # or beside the .ink when there is none, so it compiles only once
        target = json || Pathname.new(ink.to_s.sub(/\.ink\z/, '.json'))
        compile_lock(target).synchronize do
          # Another request may have compiled it while this one waited
          compile!(ink, target) if needs_compilation?(ink, target)
        end
        json = target
      end
      json
    end

    # The storyPath as an absolute Pathname when it ends in .json and lies
    # inside one of roots, else nil
    def confined(story_path, roots)
      return nil unless story_path.is_a?(String) && story_path.end_with?('.json')

      full = File.expand_path(story_path, Engine.root.to_s)
      inside = Array(roots).any? { |root| full.start_with?("#{File.expand_path(root.to_s)}/") }
      inside ? Pathname.new(full) : nil
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
    # story's folder; a name that is not there is skipped.
    def includes(ink_path, root_dir = File.dirname(ink_path.to_s), seen = Set.new)
      File.read(Engine.root.join(ink_path.to_s)).scan(/^\s*INCLUDE\s+(\S.*?)\s*$/).flatten.each do |name|
        path = File.join(root_dir, name)
        next if seen.include?(path) || !File.file?(Engine.root.join(path))

        seen << path
        includes(path, root_dir, seen)
      end
      seen.to_a
    end

    # The .ink, or any file it includes, is newer than the JSON (or there is no JSON)
    def needs_compilation?(ink_path, json_path)
      return true unless json_path && File.exist?(json_path)

      newest = [ink_path, *includes(ink_path)].map { |f| File.mtime(Engine.root.join(f.to_s)) }.max
      newest > File.mtime(json_path)
    end

    def inklecate
      Engine.root.join('bin', 'inklecate')
    end

    def compile_lock(output_path)
      COMPILE_LOCKS_GUARD.synchronize { COMPILE_LOCKS[output_path.to_s] }
    end

    # Compiles ink_path to output_path: into a temporary file beside it, then
    # renamed into place, so a reader sees the old file or the new one, never
    # half of one. inklecate prints errors, warnings and TODOs on stdout.
    # @raise [RuntimeError] when inklecate fails
    def compile!(ink_path, output_path)
      tmp = "#{output_path}.#{Process.pid}.#{Thread.current.object_id}.tmp"
      stdout, stderr, status = Open3.capture3(inklecate.to_s, '-o', tmp, ink_path.to_s)
      detail = [stdout, stderr].map(&:to_s).map(&:strip).reject(&:empty?).join("\n")
      unless status.success? && File.file?(tmp)
        File.delete(tmp) if File.exist?(tmp)
        Rails.logger.error "[BreakEscape] Ink compilation failed for #{File.basename(ink_path)}: #{detail}"
        raise "Ink compilation failed for #{File.basename(ink_path)}: #{detail}"
      end

      File.rename(tmp, output_path.to_s)
      Rails.logger.warn "[BreakEscape] Ink compilation warnings for #{File.basename(ink_path)}: #{detail}" unless detail.empty?
      Rails.logger.info "[BreakEscape] Compiled #{File.basename(ink_path)} (#{(File.size(output_path) / 1024.0).round(2)} KB)"
      Pathname.new(output_path)
    end
  end
end
