require 'test_helper'
require 'minitest/mock'
require 'tmpdir'

module BreakEscape
  # InkStoryFile is the one lookup from a storyPath to its compiled story:
  # GamesController#ink and #tts (through TtsLineResolver) both use it.
  class InkStoryFileTest < ActiveSupport::TestCase
    INK = "Hello there.\n-> END\n".freeze

    def write(path, text)
      File.write(path, text)
      path
    end

    test "finds the storyPath, then its .ink.json form, then its plain .json form" do
      Dir.mktmpdir do |dir|
        plain = write(File.join(dir, 'a.json'), '{}')
        assert_equal plain, InkStoryFile.find(plain, compile: false, allowed_root: dir).to_s
        assert_equal plain, InkStoryFile.find(File.join(dir, 'a.ink.json'), compile: false, allowed_root: dir).to_s

        ink_json = write(File.join(dir, 'b.ink.json'), '{}')
        assert_equal ink_json, InkStoryFile.find(File.join(dir, 'b.json'), compile: false, allowed_root: dir).to_s
        assert_nil InkStoryFile.find(File.join(dir, 'missing.json'), compile: false, allowed_root: dir)
      end
    end

    test "compile: false reads the JSON as it is; compile: true compiles a newer .ink first" do
      Dir.mktmpdir do |dir|
        json = write(File.join(dir, 's.json'), '{"stale":true}')
        ink = write(File.join(dir, 's.ink'), INK)
        File.utime(Time.now - 60, Time.now - 60, json)

        assert_equal json, InkStoryFile.find(json, compile: false, allowed_root: dir).to_s
        assert_equal({ 'stale' => true }, JSON.parse(File.read(json)))

        assert_equal json, InkStoryFile.find(json, allowed_root: dir).to_s
        assert_includes File.read(json, encoding: 'bom|utf-8'), 'Hello there.'
        refute InkStoryFile.needs_compilation?(ink, json)
      end
    end

    test "a stale X.ink.json is recompiled in place, so the next lookup does not compile again" do
      Dir.mktmpdir do |dir|
        ink_json = write(File.join(dir, 'k.ink.json'), '{"stale":true}')
        ink = write(File.join(dir, 'k.ink'), INK)
        File.utime(Time.now - 60, Time.now - 60, ink_json)

        assert_equal ink_json, InkStoryFile.find(ink_json, allowed_root: dir).to_s
        assert_includes File.read(ink_json, encoding: 'bom|utf-8'), 'Hello there.'
        refute File.exist?(File.join(dir, 'k.json'))
        refute InkStoryFile.needs_compilation?(ink, ink_json)
      end
    end

    test "a story with only an .ink is compiled beside it" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'n.ink'), INK)
        assert_equal File.join(dir, 'n.json'), InkStoryFile.find(File.join(dir, 'n.json'), allowed_root: dir).to_s
      end
    end

    test "a storyPath outside the scenarios folder, or not ending in .json, finds nothing" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'o.json'), '{}')
        write(File.join(dir, 'o.ink'), INK)
        # absolute, and outside the game's root (test_helper adds the tmp dir to the default)
        scenarios = Engine.root.join('scenarios')
        assert_nil InkStoryFile.find(File.join(dir, 'o.json'), allowed_root: scenarios)
        assert_nil InkStoryFile.find(File.join(dir, 'o.json'), compile: false, allowed_root: scenarios)
        assert_equal [Engine.root.join('scenarios')], InkStoryFile.allowed_roots.first(1), 'the game allows scenarios/ only'
        # .. out of the root
        inner = File.join(dir, 'inner')
        Dir.mkdir(inner)
        assert_nil InkStoryFile.find(File.join(inner, '..', 'o.json'), allowed_root: inner)
        # package.json exists at the engine root, so only the guard refuses it
        assert File.file?(Engine.root.join('package.json'))
        refute InkStoryFile.find('scenarios/../package.json', compile: false, allowed_root: scenarios)
        # a null byte is no path: nil, not an ArgumentError
        assert_nil InkStoryFile.find("scenarios/test_event_cascade/ink/test_patient\0.ink.json")
        # not a .json path, or a folder named like one
        assert_nil InkStoryFile.find(File.join(dir, 'o.ink'), allowed_root: dir)
        Dir.mkdir(File.join(dir, 'folder.json'))
        assert_nil InkStoryFile.find(File.join(dir, 'folder.json'), compile: false, allowed_root: dir)
        # mirror: inside the root it is found
        assert_equal File.join(dir, 'o.json'), InkStoryFile.find(File.join(dir, 'o.json'), compile: false, allowed_root: dir).to_s
      end
      # a real storyPath, relative to the engine root, is inside the default root
      assert InkStoryFile.find('scenarios/test_event_cascade/ink/test_patient.ink.json', compile: false)
    end

    test "an INCLUDE newer than the JSON recompiles the story" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'part.ink'), "=== part ===\nFrom the part.\n-> END\n")
        ink = write(File.join(dir, 'm.ink'), "INCLUDE part.ink\nHello.\n-> part\n")
        json = write(File.join(dir, 'm.json'), '{"stale":true}')
        File.utime(Time.now - 120, Time.now - 120, ink)
        File.utime(Time.now - 60, Time.now - 60, json)
        assert InkStoryFile.needs_compilation?(ink, json), 'part.ink is newer than m.json'

        assert_equal json, InkStoryFile.find(json, allowed_root: dir).to_s
        assert_includes File.read(json, encoding: 'bom|utf-8'), 'From the part.'
        refute InkStoryFile.needs_compilation?(ink, json)
      end
    end

    test "includes resolve against the root story's folder, nested ones too, and names may have spaces" do
      Dir.mktmpdir do |dir|
        Dir.mkdir(File.join(dir, 'sub'))
        write(File.join(dir, 'shared vars.ink'), "VAR x = 1\n")
        write(File.join(dir, 'b.ink'), "INCLUDE shared vars.ink\n")
        # included from sub/a.ink, but inklecate looks for b.ink beside the root story
        write(File.join(dir, 'sub', 'a.ink'), "INCLUDE b.ink\n")
        root = write(File.join(dir, 'root.ink'), "INCLUDE sub/a.ink\nHi.\n-> END\n")
        assert_equal [File.join(dir, 'sub/a.ink'), File.join(dir, 'b.ink'), File.join(dir, 'shared vars.ink')],
                     InkStoryFile.includes(root)
      end
    end

    test "a failed compile raises with inklecate's message and leaves no file behind" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'bad.ink'), "Hello.\n-> nowhere\n")
        error = assert_raises(RuntimeError) { InkStoryFile.find(File.join(dir, 'bad.json'), allowed_root: dir) }
        assert_includes error.message, 'Divert target not found'
        assert_equal ['bad.ink'], Dir.children(dir)
      end
    end

    test "requests that find the same stale story at once compile it once, and none reads half a file" do
      Dir.mktmpdir do |dir|
        json = write(File.join(dir, 'c.json'), '{"stale":true}')
        ink = write(File.join(dir, 'c.ink'), INK)
        File.utime(Time.now - 60, Time.now - 60, json)
        compiles = 0
        original = InkStoryFile.method(:compile!)
        counting = lambda do |*args|
          compiles += 1
          sleep 0.05
          original.call(*args)
        end
        InkStoryFile.stub(:compile!, counting) do
          found = Array.new(4) { Thread.new { InkStoryFile.find(json, allowed_root: dir).to_s } }.map(&:value)
          assert_equal [json] * 4, found
        end
        assert_equal 1, compiles
        assert_includes File.read(json, encoding: 'bom|utf-8'), 'Hello there.'
        assert_equal %w[c.ink c.json], Dir.children(dir).sort, 'no temporary file is left'
        refute InkStoryFile.needs_compilation?(ink, json)
      end
    end

    test "a symlink inside the root that leads out of it finds nothing, and nothing is compiled through it" do
      Dir.mktmpdir do |outside|
        Dir.mktmpdir do |root|
          secret = write(File.join(outside, 'secret.json'), '{"secret":true}')
          write(File.join(outside, 'story.ink'), INK)
          File.symlink(secret, File.join(root, 'link.json'))
          File.symlink(outside, File.join(root, 'out'))
          assert_nil InkStoryFile.find(File.join(root, 'link.json'), compile: false, allowed_root: root)
          assert_nil InkStoryFile.find(File.join(root, 'out', 'secret.json'), compile: false, allowed_root: root)
          # an .ink through the folder link would compile beside it, outside the root
          assert_nil InkStoryFile.find(File.join(root, 'out', 'story.json'), allowed_root: root)
          refute File.exist?(File.join(outside, 'story.json'))
          # mirror: a symlink that stays inside the root is followed
          inner = write(File.join(root, 'inner.json'), '{}')
          File.symlink(inner, File.join(root, 'alias.json'))
          assert_equal File.join(root, 'alias.json'),
                       InkStoryFile.find(File.join(root, 'alias.json'), compile: false, allowed_root: root).to_s
        end
      end
    end

    test "a compile writes a temporary file beside the output and renames it into place" do
      Dir.mktmpdir do |dir|
        ink = write(File.join(dir, 't.ink'), INK)
        json = File.join(dir, 't.json')
        outputs = []
        real = Open3.method(:capture3)
        recording = lambda do |*args|
          outputs << args[args.index('-o') + 1]
          real.call(*args)
        end
        Open3.stub(:capture3, recording) { InkStoryFile.compile!(ink, json) }
        assert_equal 1, outputs.size
        tmp = outputs.first
        refute_equal json, tmp
        # in a fresh folder of its own beside the output, not at a guessable name
        assert_equal dir, File.dirname(File.dirname(tmp))
        assert File.basename(File.dirname(tmp)).start_with?('.inkc'), tmp
        refute File.exist?(File.dirname(tmp)), 'the temporary folder is gone'
        assert_equal %w[t.ink t.json], Dir.children(dir).sort
        assert_includes File.read(json, encoding: 'bom|utf-8'), 'Hello there.'
      end
    end

    test "the compiled JSON takes the newest source mtime, so an edit made during the compile still counts" do
      Dir.mktmpdir do |dir|
        ink = write(File.join(dir, 'e.ink'), INK)
        at = Time.now - 300
        File.utime(at, at, ink)
        json = InkStoryFile.find(File.join(dir, 'e.json'), allowed_root: dir)
        assert_equal at.to_i, File.mtime(json).to_i
        refute InkStoryFile.needs_compilation?(ink, json)
        File.utime(at + 1, at + 1, ink)
        assert InkStoryFile.needs_compilation?(ink, json)
      end
    end

    test "the include walk is cached until a file it read or looked for changes, and drops a // comment" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'a.ink'), "VAR a = 1\n")
        root = write(File.join(dir, 'r.ink'), "INCLUDE a.ink // shared vars\nINCLUDE later.ink\nHi.\n-> END\n")
        missing = []
        assert_equal [File.join(dir, 'a.ink')], InkStoryFile.includes(root, missing: missing)
        assert_equal [['later.ink', root]], missing

        walks = 0
        real = InkStoryFile.method(:walk_includes)
        counting = ->(ink) { walks += 1; real.call(ink) }
        InkStoryFile.stub(:walk_includes, counting) do
          InkStoryFile.includes(root)
          assert_equal 0, walks, 'nothing changed, so nothing is read again'
          # the missing include appears: the walk runs again and finds it
          write(File.join(dir, 'later.ink'), "VAR b = 2\n")
          assert_equal [File.join(dir, 'a.ink'), File.join(dir, 'later.ink')], InkStoryFile.includes(root)
          assert_equal 1, walks
          # an include gains a nested INCLUDE
          write(File.join(dir, 'deep.ink'), "VAR c = 3\n")
          write(File.join(dir, 'a.ink'), "INCLUDE deep.ink\nVAR a = 1\n")
          File.utime(Time.now + 5, Time.now + 5, File.join(dir, 'a.ink'))
          assert_includes InkStoryFile.includes(root), File.join(dir, 'deep.ink')
          assert_equal 2, walks
        end
      end
    end

    test "the game's default root is scenarios/ only, and #ink and the TTS resolver refuse a story outside it" do
      saved = InkStoryFile.instance_variable_get(:@allowed_roots)
      InkStoryFile.allowed_roots = nil
      assert_equal [Engine.root.join('scenarios')], InkStoryFile.allowed_roots
      Dir.mktmpdir do |dir|
        story = write(File.join(dir, 'outside.json'), '{"inkVersion":21,"root":[["^Hello there.","\n",["done",{"#n":"g-0"}],null],"done",null]}')
        assert_nil GamesController.new.send(:resolve_and_compile_ink, story)
        data = { 'rooms' => { 'r' => { 'npcs' => [{ 'id' => 'ann', 'voice' => { 'name' => 'Kore' }, 'storyPath' => story }] } } }
        npc = TtsLineResolver.find_npc(data, 'ann')
        result = TtsLineResolver.new(scenario_name: nil, scenario_data: data).resolve('ann', npc, 'Hello there.')
        assert_equal :not_found, result.status
      end
    ensure
      InkStoryFile.allowed_roots = saved
    end

    test "read opens a story only while it still resolves inside the roots" do
      Dir.mktmpdir do |outside|
        Dir.mktmpdir do |root|
          secret = write(File.join(outside, 's.json'), '{"secret":true}')
          story = write(File.join(root, 'ok.json'), '{"ok":true}')
          assert_equal '{"ok":true}', InkStoryFile.read(story, [root])
          # the story is swapped for a symlink out after the lookup
          File.delete(story)
          File.symlink(secret, story)
          assert_nil InkStoryFile.read(story, [root])
          assert_nil InkStoryFile.read(File.join(root, 'gone.json'), [root])
        end
      end
    end

    test "an INCLUDE that leads outside the roots is not followed" do
      saved = InkStoryFile.instance_variable_get(:@allowed_roots)
      Dir.mktmpdir do |dir|
        inner = File.join(dir, 'inner')
        Dir.mkdir(inner)
        write(File.join(dir, 'outside.ink'), "VAR o = 1\n")
        write(File.join(inner, 'near.ink'), "VAR n = 1\n")
        root = write(File.join(inner, 'r.ink'), "INCLUDE ../outside.ink\nINCLUDE near.ink\nHi.\n-> END\n")
        InkStoryFile.allowed_roots = [inner]
        missing = []
        assert_equal [File.join(inner, 'near.ink')], InkStoryFile.includes(root, missing: missing)
        assert_equal [['../outside.ink', root]], missing
      end
    ensure
      InkStoryFile.allowed_roots = saved
    end

    test "the TTS line extractor finds stories through InkStoryFile" do
      extractor = TtsLineExtractor.new('test_event_cascade', {}, tts_service: nil)
      # names X.json where only X.ink.json exists: served by #ink, so the batch reads it too
      story = 'scenarios/test_event_cascade/ink/test_patient.json'
      assert_equal InkStoryFile.find(story, compile: false), extractor.send(:resolve_ink_path, story)
      assert_equal Engine.root.join('scenarios/test_event_cascade/ink/test_patient.ink.json'),
                   extractor.send(:resolve_ink_path, story)
      # a story #ink refuses is not read from the scenario folder either
      assert_nil extractor.send(:resolve_ink_path, 'elsewhere/ink/test_patient.ink.json')
    end

    test "the controller and the TTS line resolver both find stories through InkStoryFile" do
      calls = []
      fake = lambda do |story_path, compile: true|
        calls << [story_path, compile]
        nil
      end
      InkStoryFile.stub(:find, fake) do
        GamesController.new.send(:resolve_and_compile_ink, 'scenarios/x/ink/a.json')

        data = { 'rooms' => { 'r' => { 'npcs' => [{ 'id' => 'ann', 'voice' => { 'name' => 'Kore' },
                                                     'storyPath' => 'scenarios/x/ink/b.json' }] } } }
        npc = TtsLineResolver.find_npc(data, 'ann')
        assert_equal :not_found, TtsLineResolver.new(scenario_name: nil, scenario_data: data).resolve('ann', npc, 'Hi.').status
        TtsLineResolver.new(scenario_name: nil, scenario_data: data, compile: false).resolve('ann', npc, 'Hi.')
      end
      assert_equal [['scenarios/x/ink/a.json', true], ['scenarios/x/ink/b.json', true], ['scenarios/x/ink/b.json', false]], calls
    end
  end
end
