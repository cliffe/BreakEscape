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
        assert_equal plain, InkStoryFile.find(plain, compile: false).to_s
        assert_equal plain, InkStoryFile.find(File.join(dir, 'a.ink.json'), compile: false).to_s

        ink_json = write(File.join(dir, 'b.ink.json'), '{}')
        assert_equal ink_json, InkStoryFile.find(File.join(dir, 'b.json'), compile: false).to_s
        assert_nil InkStoryFile.find(File.join(dir, 'missing.json'), compile: false)
      end
    end

    test "compile: false reads the JSON as it is; compile: true compiles a newer .ink first" do
      Dir.mktmpdir do |dir|
        json = write(File.join(dir, 's.json'), '{"stale":true}')
        ink = write(File.join(dir, 's.ink'), INK)
        File.utime(Time.now - 60, Time.now - 60, json)

        assert_equal json, InkStoryFile.find(json, compile: false).to_s
        assert_equal({ 'stale' => true }, JSON.parse(File.read(json)))

        assert_equal json, InkStoryFile.find(json).to_s
        assert_includes File.read(json, encoding: 'bom|utf-8'), 'Hello there.'
        refute InkStoryFile.needs_compilation?(ink, json)
      end
    end

    test "a story with only an .ink is compiled beside it" do
      Dir.mktmpdir do |dir|
        write(File.join(dir, 'n.ink'), INK)
        assert_equal File.join(dir, 'n.json'), InkStoryFile.find(File.join(dir, 'n.json')).to_s
      end
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
