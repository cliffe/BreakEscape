require 'open3'

module BreakEscape
  # The compiled story file a scenario's storyPath names, decided in one place.
  # GamesController#ink, TtsLineResolver (and so GamesController#tts) and the
  # TTS mission tests all find stories through here, so they read the same file.
  #
  # With compile: true (the game), an .ink newer than its compiled JSON (or with
  # no JSON) is compiled first. With compile: false (tests, tools), the lookup is
  # the same but nothing is written; ink_compiled_staleness_test.rb checks that
  # no committed JSON is stale, so both read the same content.
  module InkStoryFile
    module_function

    # @param story_path [String] a storyPath, relative to the engine root
    # @return [Pathname, nil] the compiled story, or nil when there is none
    def find(story_path, compile: true)
      base = Engine.root.join(story_path)
      json = compiled_json(base)
      ink = ink_source(base)
      if compile && ink && needs_compilation?(ink, json)
        Rails.logger.info "[BreakEscape] Compiling #{File.basename(ink)}..."
        # Into the file the lookup reads next time (a stale X.ink.json, say),
        # or beside the .ink when there is none, so it compiles only once
        json = compile!(ink, json || ink.to_s.sub(/\.ink\z/, '.json'))
      end
      json
    end

    # The compiled JSON for a storyPath: the path itself, its .ink.json form or
    # its plain .json form, whichever exists first.
    def compiled_json(base_path)
      return Pathname.new(base_path) if File.exist?(base_path)

      ink_json = base_path.to_s.sub(/\.json\z/, '.ink.json')
      return Pathname.new(ink_json) if File.exist?(ink_json)

      json = base_path.to_s.sub(/\.ink\.json\z/, '.json')
      return Pathname.new(json) if File.exist?(json)

      nil
    end

    # The .ink source for a storyPath, or nil
    def ink_source(base_path)
      ink = base_path.to_s.sub(/\.(ink\.)?json\z/, '.ink')
      File.exist?(ink) ? Pathname.new(ink) : nil
    end

    def needs_compilation?(ink_path, json_path)
      return true unless json_path && File.exist?(json_path)

      File.mtime(ink_path) > File.mtime(json_path)
    end

    def inklecate
      Engine.root.join('bin', 'inklecate')
    end

    # Compiles ink_path to output_path (by default beside it, as .json).
    # @raise [RuntimeError] when inklecate fails
    def compile!(ink_path, output_path = ink_path.to_s.sub(/\.ink\z/, '.json'))
      _stdout, stderr, status = Open3.capture3(inklecate.to_s, '-jo', output_path.to_s, ink_path.to_s)
      unless status.success?
        Rails.logger.error "[BreakEscape] Ink compilation failed: #{stderr}"
        raise "Ink compilation failed for #{File.basename(ink_path)}: #{stderr}"
      end

      Rails.logger.warn "[BreakEscape] Ink compilation warnings: #{stderr}" if stderr.present?
      Rails.logger.info "[BreakEscape] Compiled #{File.basename(ink_path)} (#{(File.size(output_path) / 1024.0).round(2)} KB)"
      Pathname.new(output_path)
    end
  end
end
