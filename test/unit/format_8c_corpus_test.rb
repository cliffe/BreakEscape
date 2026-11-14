require 'test_helper'

# Step 8c (format 3), the corpus equivalence, the stored-game equivalence and the Ruby reader-parity
# runs the plan asks for (SCENARIO_FORMAT_HARDENING_PLAN.md, "Habits in one block": corpus
# equivalence and reader parity). A committed test, not a one-off script, so the equivalence is
# re-checked on every run. The JS counterpart is test/js/format-8c-reader-parity.test.mjs.
#
# Fixtures (frozen at this branch; see the folder's README):
#   <scenario>.old.json / .new.json  -- the format-2 render (top-level screenHabit/printHabit/usbHabit)
#     and the format-3 render (habits.screen/.print/.usb), for the three rewritten templates plus
#     test_access_habits (which authors no habit key, so its pair is identical bar formatVersion).
#   <scenario>.old.loaded.json       -- the format-2 LOADER output (NpcHabits.expand! on the 8b tip
#     ab14d1926, which fills a top-level screenHabit from awareness / habits.locksScreen), for
#     test_access_habits and lab_physical_pentest and a minimal priya scenario. These drive the
#     stored-game equivalence: a game prepared the format-2 way, folded, must give the same effective
#     lock rule per workstation as a fresh format-3 game.
#
# The transform skips author notes (step 7), so a `_comment` whose wording was hand-updated from a
# retired key differs between transform(old) and the new render. The structural equivalence strips
# author-note keys before comparing; a separate check proves no live author note still names a
# retired key, so the templates no longer teach the old names.
module BreakEscape
  class Format8cCorpusTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    AI = BreakEscape::AccessIdentities

    RENDERED = %w[test_access_social test_access_work test_needs_sims test_access_habits].freeze
    FIXTURE_DIR = File.expand_path('../fixtures/format_8c', __dir__)
    RETIRED_NAMES = %w[screenHabit printHabit usbHabit].freeze

    # The five workstations whose owner carries a habit that differs from their own PC on purpose
    # (plan step 8c): the precedence-stays-as-it-is fixtures.
    NAMED = {
      'test_access_habits' => %w[priya_pc],
      'test_access_social' => %w[omar_pc],
      'test_access_work' => %w[rosa_pc ian_pc jake_pc]
    }.freeze

    def fixture(file)
      JSON.parse(File.read(File.join(FIXTURE_DIR, file)))
    end

    def live_render(name)
      srand(1)
      JSON.parse(ERB.new(File.read("scenarios/#{name}/scenario.json.erb"))
        .result(::BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    end

    def deep_copy(data)
      Marshal.load(Marshal.dump(data))
    end

    def transformed(data)
      copy = deep_copy(data)
      FU::STEP_8C[:scenario].call(copy)
      copy
    end

    def prepared(data)
      game = ::BreakEscape::Game.new
      game.scenario_data = deep_copy(data)
      game.prepare_scenario_data!
      game.scenario_data
    end

    # Drop every author-note key (`_`-prefixed) so the structural equivalence is not moved by a
    # hand-updated comment the transform never touches.
    def strip_notes(node)
      case node
      when Hash
        node.each_with_object({}) do |(k, v), h|
          next if k.to_s.start_with?('_')

          h[k] = strip_notes(v)
        end
      when Array then node.map { |v| strip_notes(v) }
      else node
      end
    end

    def rooms_of(data)
      (data['rooms'] || {}).values.select { |r| r.is_a?(Hash) }
    end

    def workstations_with_npcs(data)
      out = []
      rooms_of(data).each do |room|
        npcs = Array(room['npcs']).select { |n| n.is_a?(Hash) }
        Array(room['objects']).each do |o|
          out << [o, npcs] if o.is_a?(Hash) && workstation?(o)
        end
      end
      out
    end

    def workstation?(obj)
      obj['workstation'] == true || obj.key?('locksScreenOnLeave') ||
        obj.key?('lockChance') || obj['lockType'] == 'login'
    end

    def all_npcs(data)
      rooms_of(data).flat_map { |r| Array(r['npcs']).select { |n| n.is_a?(Hash) } }
    end

    # ---- The old screen reader, reproduced verbatim bar the one moved line -------------------
    # Base ab14d1926 AccessIdentities.screen_always_locks? read owner['screenHabit']; the live reader
    # reads owner['habits']['screen']. Everything else (js_number, the decideLocked order) is copied
    # unchanged, so parity proves the fold feeds the new reader exactly what the old key fed the old.
    def js_number(value)
      case value
      when Numeric then value.to_f
      when nil, false then 0.0
      when true then 1.0
      when String
        s = value.strip
        s.empty? ? 0.0 : Float(s, exception: false) || Float::NAN
      else Float::NAN
      end
    end

    def old_screen_always_locks?(pc, owner)
      pc = {} unless pc.is_a?(Hash)
      chance = pc['lockChance']
      return chance >= 1 if chance.is_a?(Numeric)
      return pc['locksScreenOnLeave'] != false if pc.key?('locksScreenOnLeave')

      habit = owner.is_a?(Hash) ? owner['screenHabit'] : nil
      return true unless habit.is_a?(Hash)

      over = js_number(habit['lockIfAwayOverSeconds']) if habit.key?('lockIfAwayOverSeconds')
      return false if over&.finite? && over >= 0
      return habit['lockChance'] >= 1 if habit['lockChance'].is_a?(Numeric)

      true
    end

    def owner_of(obj)
      obj['owner'].is_a?(String) && !obj['owner'].empty? ? obj['owner'] : nil
    end

    # ---- Corpus equivalence --------------------------------------------------
    RENDERED.each do |name|
      test "#{name}: the 8c transform on the old render equals the new render (notes aside)" do
        old = fixture("#{name}.old.json")
        new = fixture("#{name}.new.json")

        assert_equal strip_notes(new), strip_notes(transformed(old)),
                     "#{name}: upgrading the old render must give the new render"
        assert_equal new, transformed(new),
                     "#{name}: the transform is a no-op on the new (format-3) render"
        assert_empty FU.retired_keys_in(new),
                     "#{name}: no retired habit key remains in the new render"
      end

      # The real load pipeline is upgrade THEN prepare. prepare fills habits.screen only where it is
      # absent, so preparing the upgraded old data must equal preparing the new data.
      test "#{name}: prepare_scenario_data! agrees across the fold (upgrade then prepare)" do
        prepared_old = prepared(transformed(fixture("#{name}.old.json")))
        prepared_new = prepared(fixture("#{name}.new.json"))

        assert_equal strip_notes(prepared_new), strip_notes(prepared_old),
                     "#{name}: preparing the upgraded old data must equal preparing the new data"
        assert_empty FU.retired_keys_in(prepared_new),
                     "#{name}: no retired habit key remains in prepared new data"
      end
    end

    # ---- Live template guard (edit-proof) ------------------------------------
    (RENDERED + %w[lab_physical_pentest]).each do |name|
      test "#{name}: the live template carries no retired habit key and no note names one" do
        live = live_render(name)
        assert_empty FU.retired_keys_in(live),
                     "#{name}: a retired habit key is back in the live template"
        hits = []
        walk = lambda do |node|
          case node
          when Hash then node.each { |k, v| k.to_s.start_with?('_') && v.is_a?(String) ? (RETIRED_NAMES.each { |r| hits << r if v.include?(r) }) : walk.call(v) }
          when Array then node.each { |v| walk.call(v) }
          end
        end
        walk.call(live)
        assert_empty hits.uniq, "#{name}: an author note still names a retired key: #{hits.uniq.inspect}"
      end
    end

    # ---- Reader parity on the authored-habit renders -------------------------
    # For every workstation and every NPC that could borrow it, the effective "every leave locks"
    # rule is the same under the old reader (screenHabit) on the old render and the live reader
    # (habits.screen) on the new render.
    %w[test_access_social test_access_work test_needs_sims].each do |name|
      test "#{name}: screen lock rule matches old and new readers for every workstation and borrower" do
        old = fixture("#{name}.old.json")
        new = fixture("#{name}.new.json")
        old_ws = workstations_with_npcs(old)
        new_by_id = {}
        workstations_with_npcs(new).each { |o, _| new_by_id[o['id']] = o }
        old_npc_by_id = all_npcs(old).index_by { |n| n['id'] }
        new_npc_by_id = all_npcs(new).index_by { |n| n['id'] }

        checked = 0
        old_ws.each do |pc_old, _npcs|
          pc_new = new_by_id[pc_old['id']]
          refute_nil pc_new, "#{name}/#{pc_old['id']}: workstation missing from new render"
          # Owner, then every NPC as a potential hot-desk guest.
          ([owner_of(pc_old)].compact + old_npc_by_id.keys).uniq.each do |npc_id|
            old_v = old_screen_always_locks?(pc_old, old_npc_by_id[npc_id])
            new_v = AI.screen_always_locks?(pc_new, new_npc_by_id[npc_id])
            assert_equal old_v, new_v,
                         "#{name}/#{pc_old['id']}: lock rule for #{npc_id} must match (old #{old_v})"
            checked += 1
          end
        end
        assert_operator checked, :>=, 1, "#{name}: at least one workstation checked"
      end
    end

    # ---- The five named precedence fixtures ----------------------------------
    NAMED.each do |name, pcs|
      pcs.each do |pc_id|
        test "named fixture #{name}/#{pc_id}: owner's screen habit carries over and the lock rule holds" do
          # Loaded fixtures for test_access_habits (loader-filled habit); rendered for the others.
          if name == 'test_access_habits'
            old = fixture("#{name}.old.loaded.json")
            new = prepared(fixture("#{name}.new.json"))
          else
            old = fixture("#{name}.old.json")
            new = fixture("#{name}.new.json")
          end
          pc_old = rooms_of(old).flat_map { |r| Array(r['objects']) }.find { |o| o.is_a?(Hash) && o['id'] == pc_id }
          pc_new = rooms_of(new).flat_map { |r| Array(r['objects']) }.find { |o| o.is_a?(Hash) && o['id'] == pc_id }
          refute_nil pc_old; refute_nil pc_new
          owner_id = owner_of(pc_new)
          refute_nil owner_id, "#{pc_id}: a workstation owner is expected"
          owner_old = all_npcs(old).find { |n| n['id'] == owner_id }
          owner_new = all_npcs(new).find { |n| n['id'] == owner_id }

          # The owner's habit moved from top-level screenHabit to habits.screen, values intact.
          old_habit = owner_old['screenHabit']
          new_habit = owner_new.dig('habits', 'screen')
          assert_equal old_habit, new_habit,
                       "#{pc_id}: #{owner_id}'s screen habit must carry over unchanged" if old_habit
          assert_equal old_screen_always_locks?(pc_old, owner_old),
                       AI.screen_always_locks?(pc_new, owner_new),
                       "#{pc_id}: the effective lock rule must match across the fold"
        end
      end
    end

    # ---- Stored-game equivalence: test_access_habits and lab_physical_pentest -
    # Neither authors a habit key; both carry awareness or habits.locksScreen, so the format-2 loader
    # filled a top-level screenHabit. Upgrading that stored data, then re-preparing, must give the
    # same effective lock rule per workstation (and the same folded data, field for field) as a fresh
    # format-3 game.
    %w[test_access_habits lab_physical_pentest].each do |name|
      test "#{name}: a format-2 loader game, upgraded, matches a fresh format-3 game" do
        old_loaded = fixture("#{name}.old.loaded.json")
        folded = transformed(old_loaded)
        fresh = begin
          loaded = deep_copy(live_render(name))
          BreakEscape::NpcHabits.expand!(loaded)
          loaded
        end

        assert_equal strip_notes(fresh), strip_notes(folded),
                     "#{name}: the folded format-2 loader output must equal the fresh format-3 loader output"
        assert_empty FU.retired_keys_in(folded), "#{name}: no retired habit key after the fold"

        # Effective lock rule per workstation: new reader on both (folded data is format 3).
        upgraded_by_id = all_npcs(folded).index_by { |n| n['id'] }
        fresh_by_id = all_npcs(fresh).index_by { |n| n['id'] }
        checked = 0
        rooms_of(folded).each do |room|
          Array(room['objects']).each do |pc|
            next unless pc.is_a?(Hash) && workstation?(pc)

            owner = upgraded_by_id[owner_of(pc)]
            fresh_pc = rooms_of(fresh).flat_map { |r| Array(r['objects']) }.find { |o| o.is_a?(Hash) && o['id'] == pc['id'] }
            assert_equal AI.screen_always_locks?(fresh_pc, fresh_by_id[owner_of(pc)]),
                         AI.screen_always_locks?(pc, owner),
                         "#{name}/#{pc['id']}: effective lock rule must match"
            checked += 1
          end
        end
        assert_operator checked, :>=, 1, "#{name}: at least one workstation checked"
      end
    end
  end
end
