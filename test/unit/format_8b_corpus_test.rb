require 'test_helper'

# Step 8b (format 2), the corpus equivalence and Ruby reader-parity runs the plan asks for
# (SCENARIO_FORMAT_HARDENING_PLAN.md, "One owner field": the corpus equivalence check and reader
# parity). A committed test, not a one-off script, so the equivalence is re-checked on every run.
#
# For each scenario BOTH sides are vendored fixtures, frozen at this branch (see the folder's README):
# <scenario>.old.json is the pre-8b render (screenOwner / phoneOwner / phoneOf / leftBehindBy, an
# owner derived from a room NPC's needsHome, affordance.owners / affordance.private), and
# <scenario>.new.json is the post-8b render (one object/item `owner`, object-level `private` /
# `deskPhone`, the derived owner written out). Freezing both sides keeps the equivalence a check of
# the transform alone; a later scenario edit changes the live render but not the frozen pair. The live
# templates are guarded separately by an edit-proof retired-key check.
#
# Reader parity reproduces the pre-8b owner readers inline (confirmed by grep: no office preset
# defines an owner field, so an object's own affordance/screenOwner is the whole old answer) and runs
# them on the old render; the live readers run on the new render. For every object the workstation
# owner (AccessIdentities.owner_id), the NPCs a private object admits (OwnerClaim.permitted?/owners_of),
# a desk phone's colleague-phone verdict and owner (OwnerClaim.colleague_phone?), and a left-behind
# item's owner must match across the rename. It also records that no object is two NPCs' needsHome on
# the corpus, so the old Ruby and JS first-match derivations could never disagree.
module BreakEscape
  class Format8bCorpusTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    AI = BreakEscape::AccessIdentities
    OC = BreakEscape::OwnerClaim

    SCENARIOS = %w[test_access_habits test_access_social test_access_work test_needs_sims].freeze
    FIXTURE_DIR = File.expand_path('../fixtures/format_8b', __dir__)

    def template_path(name)
      "scenarios/#{name}/scenario.json.erb"
    end

    # Render a template's text the way Mission#generate_scenario_data does, srand(1) first. The four
    # scenarios carry no ERB, so this is a deterministic parse; the render path is kept to stay
    # faithful to how a game is built.
    def render(text)
      srand(1)
      JSON.parse(ERB.new(text).result(::BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    end

    def old_render(name)
      JSON.parse(File.read(File.join(FIXTURE_DIR, "#{name}.old.json")))
    end

    def new_render(name)
      JSON.parse(File.read(File.join(FIXTURE_DIR, "#{name}.new.json")))
    end

    def live_render(name)
      render(File.read(template_path(name)))
    end

    def deep_copy(data)
      Marshal.load(Marshal.dump(data))
    end

    def transformed(data)
      copy = deep_copy(data)
      FU::STEP_8B[:scenario].call(copy)
      copy
    end

    def prepared(data)
      game = ::BreakEscape::Game.new
      game.scenario_data = deep_copy(data)
      game.prepare_scenario_data!
      game.scenario_data
    end

    # Every room, with its objects and npcs, in order.
    def rooms_of(data)
      (data['rooms'] || {}).values.select { |r| r.is_a?(Hash) }
    end

    def objects_with_room(data)
      out = []
      rooms_of(data).each do |room|
        npcs = Array(room['npcs']).select { |n| n.is_a?(Hash) }
        Array(room['objects']).each { |o| out << [o, room, npcs] if o.is_a?(Hash) }
      end
      out
    end

    def objects_of(data)
      objects_with_room(data).map(&:first)
    end

    # All npcs in a render (every room), for needsHome lookups.
    def npcs_of(data)
      rooms_of(data).flat_map { |r| Array(r['npcs']).select { |n| n.is_a?(Hash) } }
    end

    # ---- pre-8b readers, reproduced inline ----------------------------------

    # Old AccessIdentities.owner_id: screenOwner, else the room NPC whose needsHome names it.
    def owner_id_old(obj, room_npcs)
      return obj['screenOwner'] if obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?

      found = room_npcs.find { |n| n['needsHome'] == obj['id'] }
      found && found['id']
    end

    # Old OwnerClaim.owners_of (own affordance only; no preset defines an owner field).
    def owners_of_old(obj, room_npcs)
      aff = obj['affordance'].is_a?(Hash) ? obj['affordance'] : {}
      return aff['owners'] if aff['owners'].is_a?(Array)
      return [obj['screenOwner']] if obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?

      room_npcs.filter_map { |n| n['id'] if n['needsHome'] == obj['id'] }
    end

    # The inlined isWorkstation rule the transform's phase B uses (and AccessWork.desk? encodes):
    # owner_id is a workstation's owner, so parity is checked within that domain (plus any object
    # that carried an explicit screenOwner). A needsHome target that is not a workstation (e.g. a
    # USB-policy PC) got no derived owner, by design; owner_id has no meaning there and no caller
    # reaches it with one.
    def workstation_domain?(obj, had_screen_owner)
      had_screen_owner ||
        obj['workstation'] == true || obj.key?('locksScreenOnLeave') ||
        obj.key?('lockChance') || obj['lockType'] == 'login'
    end

    def private_old?(obj)
      aff = obj['affordance'].is_a?(Hash) ? obj['affordance'] : {}
      aff['private'] == true
    end

    def permitted_old?(obj, owner, room_npcs)
      return true unless private_old?(obj)

      owners_of_old(obj, room_npcs).include?(owner['id'])
    end

    # Old OwnerClaim.colleague_phone?: any object carrying phoneOwner for someone else.
    def colleague_phone_old?(obj, owner)
      po = obj['phoneOwner']
      po.is_a?(String) && !po.empty? && po != owner['id']
    end

    # ---- Corpus equivalence --------------------------------------------------

    SCENARIOS.each do |name|
      test "#{name}: the 8b transform on the old render equals the new render" do
        old = old_render(name)
        new = new_render(name)

        assert_equal new, transformed(old),
                     "#{name}: upgrading the old render must give exactly the new render"
        assert_equal new, transformed(new),
                     "#{name}: the transform is a no-op on the new (format-2) render"
        # A format-2 render may still carry keys a LATER step retires (habit keys from 8c); it must
        # only be clear of keys retired at or before 8b (version 2).
        assert_empty FU.retired_keys_in(new).select { |e| e[:version] <= 2 },
                     "#{name}: no step-8b retired owner key remains in the new render"
      end

      # The real load pipeline is upgrade THEN prepare (Game#ensure_current_format!: upgrade! then
      # prepare_scenario_data!). prepare derives owner-dependent state (an NPC's screenHabit from the
      # workstation it owns), and does not itself run the upgrade, so unlike 8a the transform and
      # prepare do NOT commute: a stored old game is transformed first, then prepared. The parity is
      # therefore prepared(transform(old)) == prepared(new), matching that order.
      test "#{name}: prepare_scenario_data! agrees across the rename (upgrade then prepare)" do
        prepared_old = prepared(transformed(old_render(name)))
        prepared_new = prepared(new_render(name))

        assert_equal prepared_new, prepared_old,
                     "#{name}: preparing the upgraded old data must equal preparing the new data"
        assert_empty FU.retired_keys_in(prepared_new).select { |e| e[:version] <= 2 },
                     "#{name}: no step-8b retired owner key remains in prepared new data"
      end
    end

    # ---- Live template guard (edit-proof) ------------------------------------

    SCENARIOS.each do |name|
      test "#{name}: the live template carries no retired owner key" do
        assert_empty FU.retired_keys_in(live_render(name)),
                     "#{name}: a retired owner key is back in the live template"
      end
    end

    # ---- Reader parity -------------------------------------------------------

    SCENARIOS.each do |name|
      test "#{name}: workstation owner matches old and new readers" do
        old = old_render(name)
        new = new_render(name)
        old_objs = objects_with_room(old)
        new_by_id = objects_of(new).index_by { |o| o['id'] }

        checked = 0
        old_objs.each do |obj, _room, room_npcs|
          next unless workstation_domain?(obj, obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?)

          new_obj = new_by_id[obj['id']]
          refute_nil new_obj, "#{name}/#{obj['id']}: object missing from new render"
          old_owner = owner_id_old(obj, room_npcs)
          new_owner = AI.owner_id(new_obj, new)
          # Wrapped in arrays so a nil owner (an ownerless workstation) compares without the
          # assert_equal-nil deprecation.
          assert_equal [old_owner], [new_owner],
                       "#{name}/#{obj['id']}: workstation owner must match (old #{old_owner.inspect})"
          checked += 1 unless old_owner.nil?
        end
        assert_operator checked, :>=, 1, "#{name}: at least one workstation owner expected"
      end

      test "#{name}: private-object permission matches old and new readers" do
        old = old_render(name)
        new = new_render(name)
        new_by_id = objects_of(new).index_by { |o| o['id'] }
        all_npcs = npcs_of(new)

        checked = 0
        objects_with_room(old).each do |obj, _room, room_npcs|
          next unless private_old?(obj)

          checked += 1
          new_obj = new_by_id[obj['id']]
          assert_equal owners_of_old(obj, room_npcs).sort, OC.owners_of(new_obj).sort,
                       "#{name}/#{obj['id']}: private object owners must match"
          # Every NPC's permitted? verdict agrees across the rename.
          all_npcs.each do |npc|
            assert_equal permitted_old?(obj, npc, room_npcs), OC.permitted?(new, npc, new_obj),
                         "#{name}/#{obj['id']}: permitted? for #{npc['id']} must match"
          end
        end
        # test_access_social has no private objects; the other three do.
        assert_operator checked, :>=, 1, "#{name}: at least one private object expected" unless name == 'test_access_social'
      end

      test "#{name}: desk-phone verdicts and left-behind owners match" do
        old = old_render(name)
        new = new_render(name)
        new_by_id = objects_of(new).index_by { |o| o['id'] }
        all_npcs = npcs_of(new)

        phones = 0
        left = 0
        objects_of(old).each do |obj|
          new_obj = new_by_id[obj['id']]
          if obj['phoneOwner'].is_a?(String) && !obj['phoneOwner'].empty?
            phones += 1
            assert_equal obj['phoneOwner'], new_obj['owner'],
                         "#{name}/#{obj['id']}: desk-phone owner must carry over"
            all_npcs.each do |npc|
              assert_equal colleague_phone_old?(obj, npc), OC.colleague_phone?(new_obj, npc),
                           "#{name}/#{obj['id']}: colleague_phone? for #{npc['id']} must match"
            end
          end
          if obj['leftBehindBy'].is_a?(String) && !obj['leftBehindBy'].empty?
            left += 1
            assert_equal obj['leftBehindBy'], new_obj['owner'],
                         "#{name}/#{obj['id']}: left-behind owner must carry over"
          end
        end
        # needs_sims is the scenario that carries a desk phone and a left-behind item.
        if name == 'test_needs_sims'
          assert_operator phones, :>=, 1
          assert_operator left, :>=, 1
        end
      end

      # No object is two NPCs' needsHome on the corpus, so the old Ruby owner_id (first room NPC) and
      # the old JS ownerOf (first in the room's npcs list) could never resolve to different owners;
      # first-match order is never observable, and the single-owner merge is unambiguous.
      test "#{name}: no object is two NPCs' needsHome (no Ruby/JS derivation disagreement)" do
        old = old_render(name)
        objects_with_room(old).each do |obj, _room, room_npcs|
          homes = room_npcs.count { |n| n['needsHome'] == obj['id'] }
          assert_operator homes, :<=, 1,
                          "#{name}/#{obj['id']}: #{homes} NPCs name it as needsHome; order would be observable"
        end
      end
    end

    # The emptied affordances on test_needs_sims tom_pc and sanjay_pc must stay candidate objects:
    # a drained affordance is still a Hash (truthy), so the needs targets are unchanged (plan).
    test 'test_needs_sims tom_pc and sanjay_pc keep a truthy (emptied) affordance' do
      new = new_render('test_needs_sims')
      by_id = new_render('test_needs_sims')['rooms'].values.flat_map { |r| Array(r['objects']) }.index_by { |o| o['id'] }
      %w[tom_pc sanjay_pc].each do |id|
        obj = by_id[id]
        refute_nil obj, "#{id} must be present"
        assert_kind_of Hash, obj['affordance'], "#{id}: the emptied affordance stays {} (truthy)"
        assert_empty obj['affordance'], "#{id}: affordance drained to {}"
        assert_equal id.sub('_pc', ''), obj['owner'], "#{id}: derived owner written explicitly"
        assert_equal true, obj['private'], "#{id}: private moved up to object level"
      end
    end
  end
end
