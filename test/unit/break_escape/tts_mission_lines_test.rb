require 'test_helper'

module BreakEscape
  # The /tts endpoint's paths for lines the batch doesn't list (lines the ink
  # walker can't place: glue, a divert mid-line, printed values), checked over
  # every compiled story of m01 to m10 and lab_physical_pentest. The batch's
  # own lines are checked by the key identity check (build log).
  class TtsMissionLinesTest < ActiveSupport::TestCase
    MISSIONS = /\A(m(0[1-9]|10)_[a-z_]+|lab_physical_pentest)\z/.freeze

    def self.stories
      Dir.glob(Engine.root.join('scenarios', '*', '**', '*.json').to_s).sort.select do |path|
        rel = Pathname.new(path).relative_path_from(Engine.root.join('scenarios')).to_s
        next false unless rel.split('/').first.match?(MISSIONS)
        next false if path.end_with?('scenario.json', 'mission.json') || path.include?('dungeon_graph')

        head = File.read(path, 64)
        head.include?('"inkVersion"')
      end
    end

    test "every unplaced mission line the client can show is still accepted, and none prints a value other than the player name" do
      printed = []
      checked = 0
      self.class.stories.each do |path|
        walker = InkLineWalker.cached_for_file(path)
        walker.unresolved.each do |u|
          slots = Array(u.slots)
          if slots.empty?
            next if u.text.include?('{')

            checked += 1
            assert InkTextValidator.canonical(path, u.text), "#{path}: #{u.text}"
          elsif u.template && slots.all? { |k| k == :player_name }
            checked += 1
            shown = u.template.map { |part| part.is_a?(Symbol) ? TtsService::PLAYER_NAME_DEFAULT : part }.join
            line = InkTextValidator.canonical(path, shown.sub(/\A[^:]+:\s*/, ''))
            assert line, "#{path}: #{shown}"
            assert_equal TtsService.normalize_text(shown.sub(/\A[^:]+:\s*/, '')), TtsService.normalize_text(line)
          else
            printed << "#{path}: #{u.text}"
          end
        end
        InkTextValidator.send(:glued_runs, walker.unresolved).each do |joined|
          checked += 1
          assert InkTextValidator.canonical(path, joined), "#{path}: #{joined}"
        end
      end
      assert_operator checked, :>, 0
      assert_empty printed, "mission lines that print a value the endpoint now refuses"
    end
  end
end
