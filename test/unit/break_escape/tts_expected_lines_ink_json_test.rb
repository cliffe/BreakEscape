require 'test_helper'
require 'tmpdir'

module BreakEscape
  # A story stored as X.ink.json has X.ink as its source (not X.ink.ink), so
  # TtsExpectedLines reads that source and warns when it is newer than the JSON.
  class TtsExpectedLinesInkJsonTest < ActiveSupport::TestCase
    def build(root)
      TtsExpectedLines.new('inkjson_fixture', scenarios_dir: root, runtime_walk: false).build!
    end

    test "the source of an X.ink.json story is X.ink, and a newer one draws the recompile warning" do
      Dir.mktmpdir('tts_ink_json') do |dir|
        root = Pathname.new(dir)
        ink_dir = root.join('inkjson_fixture', 'ink')
        FileUtils.mkdir_p(ink_dir)
        ink = ink_dir.join('ann.ink')
        json = ink_dir.join('ann.ink.json')
        File.write(ink, "Ann: Morning.\n-> END\n")
        InkStoryFile.compile!(ink, json)
        data = { 'startRoom' => 'office',
                 'rooms' => { 'office' => { 'type' => 'room_office',
                                            'npcs' => [{ 'id' => 'ann', 'displayName' => 'Ann', 'npcType' => 'person',
                                                         'voice' => { 'name' => 'Kore' },
                                                         'storyPath' => 'scenarios/inkjson_fixture/ink/ann.ink.json' }] } } }
        File.write(root.join('inkjson_fixture', 'scenario.json.erb'), JSON.generate(data))

        File.utime(Time.now - 60, Time.now - 60, json)
        File.utime(Time.now - 120, Time.now - 120, ink)
        fresh = build(root)
        assert_includes fresh.ink_source_files, ink
        refute fresh.warnings.any? { |w| w.include?('older than source') }, fresh.warnings.join("\n")

        File.utime(Time.now, Time.now, ink)
        stale = build(root)
        assert stale.warnings.any? { |w| w.include?('compiled ink older than source') && w.include?('ann.ink.json') },
               stale.warnings.join("\n")
      end
    end
  end
end
