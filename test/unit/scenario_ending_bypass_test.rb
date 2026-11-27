# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'set'

module BreakEscape
  # The mission-ending convention: before the debrief or credits the player is warned that optional
  # objectives are still open and can carry on playing (systems/ending-check.js confirmEnding). Two
  # engine paths end the mission without that warning:
  #
  #  - F1: skipTask (objectives-manager.js) calls handleMissionConcluded straight from the skip
  #    answer, so a `skipTask` eventMapping or a `#skip_task:<id>` ink tag that settles the last
  #    task of a missionConclusion aim would roll the credits with no warning.
  #  - F2: a server credit (a door gate's creditOnPass.completeTask) that completes a conclusion
  #    task, or a concludeRequires gate task, concludes the mission on the server inside a sync or
  #    unlock; the client can only show the ending afterwards (applyServerMissionConcluded).
  #
  # No scenario uses either today (diagnosis 2026-11-19 on b5a40ae37), so the engine paths stay as
  # they are. This test fails if a scenario ever starts to, so the bypass cannot come back unnoticed.
  # A conclusion task must be completed by the player through completeTask, which asks first.
  class ScenarioEndingBypassTest < ActiveSupport::TestCase
    ROOT = BreakEscape::Engine.root
    SKIP_TAG = /#\s*skip_task\s*:\s*([\w-]+)/

    def scenario_files
      (Dir[ROOT.join('scenarios/*/scenario.json.erb').to_s] + Dir[ROOT.join('scenarios/*/scenario.json').to_s]).sort
    end

    def render_scenario(f)
      text = File.read(f)
      JSON.parse(f.end_with?('.erb') ? BreakEscape::ScenarioBinding.render(text, {}) : text)
    end

    def walk(obj, path = [], &blk)
      blk.call(obj, path)
      case obj
      when Hash then obj.each { |k, v| walk(v, path + [k], &blk) }
      when Array then obj.each_with_index { |v, i| walk(v, path + [i], &blk) }
      end
    end

    def conclusion_task_ids(scenario)
      Array(scenario['objectives']).select { |a| a.is_a?(Hash) && a['missionConclusion'] }
                                   .flat_map { |a| Array(a['tasks']).map { |t| t['taskId'] } }.compact.to_set
    end

    def gate_task_ids(scenario)
      Array(scenario['objectives']).select { |a| a.is_a?(Hash) && a['missionConclusion'] }.flat_map do |a|
        req = a['concludeRequires']
        req.is_a?(Hash) ? Array(req['tasksCompleted']) : []
      end.to_set
    end

    # The .ink sources a scenario's NPCs and phones play, plus their neighbours (INCLUDEd files).
    def ink_sources(scenario_file, scenario)
      dirs = Set[File.join(File.dirname(scenario_file), 'ink')]
      walk(scenario) do |o, _|
        next unless o.is_a?(Hash) && o['storyPath'].is_a?(String)

        dirs << File.dirname(ROOT.join(o['storyPath']).to_s)
      end
      dirs.flat_map { |d| Dir[File.join(d, '**/*.ink')] }.uniq
    end

    # [task id, where] for every skip in the scenario's mappings and ink.
    def skips(scenario_file, scenario)
      found = []
      walk(scenario) do |o, path|
        next unless o.is_a?(Hash) && o.key?('skipTask')

        Array(o['skipTask']).each { |t| found << [t, path.join('.')] }
      end
      ink_sources(scenario_file, scenario).each do |ink|
        File.foreach(ink).with_index(1) do |line, n|
          line.scan(SKIP_TAG) { |(id)| found << [id, "#{ink.sub("#{ROOT}/", '')}:#{n}"] }
        end
      end
      found
    end

    # [task id, where] for every server credit that completes a task.
    def credits(scenario)
      found = []
      walk(scenario) do |o, path|
        next unless o.is_a?(Hash) && o['creditOnPass'].is_a?(Hash)

        o['creditOnPass'].each do |pass, c|
          next unless c.is_a?(Hash)

          Array(c['completeTask']).each { |t| found << [t, "#{path.join('.')}.creditOnPass.#{pass}"] }
        end
      end
      found
    end

    test 'no scenario skip_tasks a mission conclusion task (F1)' do
      files = scenario_files
      assert_operator files.size, :>, 100, 'expected to find the scenario corpus'
      bad = files.flat_map do |f|
        s = render_scenario(f)
        concl = conclusion_task_ids(s)
        skips(f, s).select { |id, _| concl.include?(id) }.map { |id, where| "#{f.sub("#{ROOT}/", '')}: #{id} at #{where}" }
      end
      assert_empty bad, "Skipping a missionConclusion task ends the mission with no optional-objectives warning (objectives-manager.js skipTask). Complete it through the player instead:\n#{bad.join("\n")}"
    end

    test 'no server credit completes a mission conclusion or concludeRequires task (F2)' do
      bad = scenario_files.flat_map do |f|
        s = render_scenario(f)
        watched = conclusion_task_ids(s) | gate_task_ids(s)
        credits(s).select { |id, _| watched.include?(id) }.map { |id, where| "#{f.sub("#{ROOT}/", '')}: #{id} at #{where}" }
      end
      assert_empty bad, "A creditOnPass completeTask on a conclusion or gate task concludes the mission on the server with no warning first:\n#{bad.join("\n")}"
    end

    # The detectors themselves, on a hand-built scenario, so an empty corpus result means "none"
    # and not "the walk found nothing".
    test 'the detectors find a skip and a credit on a conclusion task' do
      s = {
        'objectives' => [
          { 'aimId' => 'end', 'missionConclusion' => true, 'tasks' => [{ 'taskId' => 'debrief' }],
            'concludeRequires' => { 'tasksCompleted' => ['flag_1'] } },
          { 'aimId' => 'side', 'tasks' => [{ 'taskId' => 'chat' }] }
        ],
        'rooms' => {
          'r' => {
            'npcs' => [{ 'eventMappings' => [{ 'skipTask' => %w[chat debrief] }] }],
            'doors' => [{ 'gate' => { 'creditOnPass' => { 'viaPass' => { 'completeTask' => 'flag_1' } } } }]
          }
        }
      }
      assert_equal Set['debrief'], conclusion_task_ids(s)
      assert_equal Set['flag_1'], gate_task_ids(s)
      skipped = skips('/nonexistent/scenario.json', s).map(&:first)
      assert_includes skipped, 'debrief'
      assert_equal ['flag_1'], credits(s).map(&:first)
      assert_equal %w[a-b c], "x #skip_task:a-b y\n# skip_task: c".scan(SKIP_TAG).flatten
    end
  end
end
