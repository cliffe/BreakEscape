require 'test_helper'

# Step 8a (format 1), the corpus equivalence and Ruby reader-parity runs the plan asks for
# (SCENARIO_FORMAT_HARDENING_PLAN.md, "The corpus equivalence check" and "Reader parity"). It is a
# committed test rather than a one-off script so the equivalence is re-checked on every run.
#
# For each of the four scenarios the step rewrites, the template is rendered from the merge base
# (old field names, read with `git show <base>:<path>`) and from the branch (new names), each with
# srand(1). The test shows:
#   - the step's `scenario` transform applied to the old render equals the new render;
#   - the transform leaves the new render unchanged (a no-op on format-1 data);
#   - `retired_keys_in` finds nothing in the new render;
#   - `prepare_scenario_data!` on each side (an unsaved Game built with the data) agrees the same
#     way: the transform applied to the prepared old data equals the prepared new data. This also
#     exercises the transform on prepared data (plan step 8a, "the step on prepared data").
#
# Reader parity: the old object outage reader is loaded from the merge base under
# BreakEscape::AccessWorkOld and run on the old render; the new reader on the new render. The
# derived outage condition of every object must match, and the up/down verdict of every network,
# resource and object must match across a sweep of the outage globals. A network's and a resource's
# old reader is a bare field read (`downIf`), so the old side reads that field on the old render
# directly; nothing is derived there that a re-read could get wrong.
module BreakEscape
  class Format8aCorpusTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    AW = BreakEscape::AccessWork
    NM = BreakEscape::NetworkModel

    SCENARIOS = %w[test_access_networks test_access_social test_access_work test_needs_sims].freeze

    def base
      @base ||= begin
        sha = `git merge-base main HEAD`.strip
        raise 'could not find the merge base of main and HEAD' if sha.empty?

        sha
      end
    end

    def template_path(name)
      "scenarios/#{name}/scenario.json.erb"
    end

    # Render a template's text the way Mission#generate_scenario_data does, with srand(1) first.
    # The four scenarios carry no ERB, so this is a deterministic parse; the render path is kept so
    # the check is faithful to how a game is built.
    def render(text)
      srand(1)
      erb = ERB.new(text)
      JSON.parse(erb.result(::BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    end

    def old_render(name)
      render(`git show #{base}:#{template_path(name)}`)
    end

    def new_render(name)
      render(File.read(template_path(name)))
    end

    def deep_copy(data)
      Marshal.load(Marshal.dump(data))
    end

    # The step's scenario transform on a copy of the data.
    def transformed(data)
      copy = deep_copy(data)
      FU::STEP_8A[:scenario].call(copy)
      copy
    end

    # prepare_scenario_data! on an unsaved Game built with the supplied data.
    def prepared(data)
      game = ::BreakEscape::Game.new
      game.scenario_data = deep_copy(data)
      game.prepare_scenario_data!
      game.scenario_data
    end

    # The old object outage reader, loaded from the merge base under BreakEscape::AccessWorkOld.
    # require lines are dropped (the constants are already loaded in the test env) and the module is
    # renamed so it sits beside the live AccessWork.
    def access_work_old
      return ::BreakEscape::AccessWorkOld if defined?(::BreakEscape::AccessWorkOld)

      src = `git show #{base}:lib/break_escape/access_work.rb`
      src = src.gsub(/^\s*require.*$/, '')
      src = src.sub(/\bmodule AccessWork\b/, 'module AccessWorkOld')
      # At the top-level binding so the module lands at ::BreakEscape::AccessWorkOld, not nested
      # inside this test's namespace.
      eval(src, TOPLEVEL_BINDING) # rubocop:disable Security/Eval -- trusted repo source at a known commit
      ::BreakEscape::AccessWorkOld
    end

    # Every room object in a render, in order, each with its id.
    def objects_of(data)
      out = []
      (data['rooms'] || {}).each_value do |room|
        next unless room.is_a?(Hash)

        Array(room['objects']).each { |o| out << o if o.is_a?(Hash) }
      end
      out
    end

    # Collect the outage global names used by any condition, to build the sweep.
    def names_in(cond)
      case cond
      when String then cond.strip.empty? ? [] : [cond]
      when Hash then cond.keys.map(&:to_s)
      else []
      end
    end

    # A sweep of global states: all off, then each name on alone.
    def global_sweep(names)
      sweep = [{}]
      names.uniq.each { |n| sweep << { n => true } }
      sweep
    end

    # ---- Corpus equivalence --------------------------------------------------

    SCENARIOS.each do |name|
      test "#{name}: the 8a transform on the old render equals the new render" do
        old = old_render(name)
        new = new_render(name)

        assert_equal new, transformed(old),
                     "#{name}: upgrading the old render must give exactly the new render"
        assert_equal new, transformed(new),
                     "#{name}: the transform is a no-op on the new (format-1) render"
        assert_empty FU.retired_keys_in(new),
                     "#{name}: no retired key remains in the new render"
      end

      test "#{name}: prepare_scenario_data! agrees across the rename" do
        prepared_old = prepared(old_render(name))
        prepared_new = prepared(new_render(name))

        assert_equal prepared_new, transformed(prepared_old),
                     "#{name}: the transform on prepared old data must equal prepared new data"
        assert_empty FU.retired_keys_in(prepared_new),
                     "#{name}: no retired key remains in prepared new data"
      end
    end

    # ---- Reader parity -------------------------------------------------------

    SCENARIOS.each do |name|
      test "#{name}: object outage conditions and verdicts match old and new readers" do
        old = old_render(name)
        new = new_render(name)
        old_by_id = objects_of(old).index_by { |o| o['id'] }
        new_by_id = objects_of(new).index_by { |o| o['id'] }

        assert_equal old_by_id.keys.sort, new_by_id.keys.sort,
                     "#{name}: the object set must be unchanged by the rename"

        checked = 0
        new_by_id.each do |id, new_obj|
          old_obj = old_by_id[id]
          old_cond = access_work_old.affordance(old, old_obj)&.dig('offWhen')
          new_cond = AW.object_off_when(new_obj)
          assert new_cond == old_cond,
                 "#{name}/#{id}: the derived object outage condition must match " \
                 "(old #{old_cond.inspect}, new #{new_cond.inspect})"
          next if old_cond.nil?

          checked += 1
          global_sweep(names_in(old_cond)).each do |globals|
            old_off = object_off_old(old_cond, globals)
            new_off = object_off_new(new_cond, globals)
            assert_equal old_off, new_off,
                         "#{name}/#{id}: object off verdict must match for #{globals.inspect}"
          end
        end
        # Every one of the four scenarios carries at least one object outage (plan step 8a counts:
        # networks 1, social 2, work 1, needs_sims 3).
        assert_operator checked, :>=, 1, "#{name}: at least one object outage expected"
      end

      test "#{name}: network and resource outage verdicts match old and new readers" do
        old = old_render(name)
        new = new_render(name)

        (new['networks'] || {}).each do |id, new_net|
          old_net = (old['networks'] || {})[id]
          old_cond = old_net.is_a?(Hash) ? old_net['downIf'] : nil
          new_cond = new_net.is_a?(Hash) ? new_net['offWhen'] : nil
          assert new_cond == old_cond, "#{name}/network #{id}: outage field must carry over"
          next if old_cond.nil?

          global_sweep(names_in(old_cond)).each do |globals|
            old_down = NM.present_string?(old_cond) && NM.truthy?(globals[old_cond])
            new_down = AW.off_when_present?(new_cond) && AW.globals_hold?(new_cond, globals)
            assert_equal old_down, new_down,
                         "#{name}/network #{id}: down verdict must match for #{globals.inspect}"
          end
        end

        (new['resources'] || {}).each do |id, new_res|
          old_res = (old['resources'] || {})[id]
          old_cond = old_res.is_a?(Hash) ? old_res['downIf'] : nil
          new_cond = new_res.is_a?(Hash) ? new_res['offWhen'] : nil
          assert new_cond == old_cond, "#{name}/resource #{id}: outage field must carry over"
          next if old_cond.nil?

          global_sweep(names_in(old_cond)).each do |globals|
            old_down = NM.present_string?(old_cond) && NM.truthy?(globals[old_cond])
            new_down = AW.off_when_present?(new_cond) && AW.globals_hold?(new_cond, globals)
            assert_equal old_down, new_down,
                         "#{name}/resource #{id}: down verdict must match for #{globals.inspect}"
          end
        end
      end
    end

    # bench_pc's affordance is emptied by the move; it must stay a Hash (truthy) so the needs target
    # lists still hold it (plan step 8, "An emptied affordance").
    test 'test_access_networks bench_pc keeps a truthy affordance and gains offWhen' do
      new = new_render('test_access_networks')
      bench = objects_of(new).find { |o| o['id'] == 'bench_pc' }
      refute_nil bench, 'bench_pc must be present'
      assert_kind_of Hash, bench['affordance'], 'the emptied affordance stays {} (truthy)'
      refute bench.key?('downIf')
      assert bench.key?('offWhen'), 'the moved outage field lands on the object as offWhen'
    end

    private

    # Old host_service_off? and new host_service_off? share the same guard and evaluator; both are
    # reproduced here so the sweep exercises the real verdict on each side.
    def object_off_old(cond, globals)
      return false if cond.nil? || cond == false || cond == ''

      access_work_old.globals_hold?(cond, globals)
    end

    def object_off_new(cond, globals)
      return false if cond.nil? || cond == false || cond == ''

      AW.globals_hold?(cond, globals)
    end
  end
end
