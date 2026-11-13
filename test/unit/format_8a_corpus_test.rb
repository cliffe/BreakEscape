require 'test_helper'

# Step 8a (format 1), the corpus equivalence and Ruby reader-parity runs the plan asks for
# (SCENARIO_FORMAT_HARDENING_PLAN.md, "The corpus equivalence check" and "Reader parity"). It is a
# committed test rather than a one-off script so the equivalence is re-checked on every run.
#
# For each of the four scenarios the step rewrites, the old render (old field names) is a vendored
# fixture under test/fixtures/format_8a/<scenario>.old.json (captured from the pre-8a template at the
# merge base; see that folder's README) and the new render (new names) is the current template,
# rendered with srand(1). Reading the old side from a fixture, not through git, keeps the equivalence
# meaningful once 8a is on main and lets the test run in a gitless checkout. The test shows:
#   - the step's `scenario` transform applied to the old render equals the new render;
#   - the transform leaves the new render unchanged (a no-op on format-1 data);
#   - `retired_keys_in` finds nothing in the new render;
#   - `prepare_scenario_data!` on each side (an unsaved Game built with the data) agrees the same
#     way: the transform applied to the prepared old data equals the prepared new data. This also
#     exercises the transform on prepared data (plan step 8a, "the step on prepared data").
#
# Reader parity: the pre-8a outage readers are reproduced inline here (the old object reader read
# `affordance.offWhen`; networks and resources read a bare `downIf`), and run on the old render; the
# live readers run on the new render. The derived outage condition of every object must match, and
# the up/down verdict of every network, resource and object must match across a sweep of the outage
# globals.
module BreakEscape
  class Format8aCorpusTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    AW = BreakEscape::AccessWork
    NM = BreakEscape::NetworkModel

    SCENARIOS = %w[test_access_networks test_access_social test_access_work test_needs_sims].freeze
    FIXTURE_DIR = File.expand_path('../fixtures/format_8a', __dir__)

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
      JSON.parse(File.read(File.join(FIXTURE_DIR, "#{name}.old.json")))
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

    # The pre-8a object outage reader, reproduced inline: an object's outage condition was the
    # `offWhen` inside its own affordance Hash (AccessWork#affordance at the merge base; the preset
    # merge is not reproduced because no office preset defines offWhen, so the own-affordance read is
    # the whole answer on this corpus).
    def object_off_when_old(obj)
      aff = obj.is_a?(Hash) && obj['affordance'].is_a?(Hash) ? obj['affordance'] : nil
      aff&.dig('offWhen')
    end

    # The pre-8a AccessWork#globals_hold?, reproduced inline. truthy_global? was NetworkModel.truthy?.
    def globals_hold_old?(cond, globals)
      globals = {} unless globals.is_a?(Hash)
      case cond
      when String then NM.truthy?(globals[cond])
      when Hash then cond.all? { |k, v| globals[k.to_s] == v }
      else false
      end
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
          old_cond = object_off_when_old(old_obj)
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

      globals_hold_old?(cond, globals)
    end

    def object_off_new(cond, globals)
      return false if cond.nil? || cond == false || cond == ''

      AW.globals_hold?(cond, globals)
    end
  end
end
