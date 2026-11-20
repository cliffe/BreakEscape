require 'test_helper'

module BreakEscape
  # A game's scenario_data is a jsonb column, and jsonb returns object keys sorted
  # (by length, then bytes), not in template order. The extractor's "first record
  # in scenario order wins" rule for a shared display name then picked another
  # record, so /tts refused lines the batch voices (m10 and m08 on every game; m09
  # when the start room moves the phone records). TtsLineResolver.in_template_order
  # puts the rooms back.
  class TtsStoredRoomOrderTest < ActiveSupport::TestCase
    # [mission, npc id the client asks for, a line it voices as that id]
    CASES = [
      ['m10_full_disclosure', 'quintero_post', 'Your clock, then.'],
      ['m08_the_mole', 'agent_0x99', "Same classroom, 0x00. Don't ask me whose yet."]
    ].freeze

    def render(name)
      JSON.parse(ERB.new(File.read(Engine.root.join('scenarios', name, 'scenario.json.erb'))).result(Mission::ScenarioBinding.new({}).get_binding))
    end

    # The data as Postgres hands it back from a jsonb column
    def through_jsonb(data)
      json = ActiveRecord::Base.connection.select_value("SELECT #{ActiveRecord::Base.connection.quote(data.to_json)}::jsonb")
      JSON.parse(json)
    end

    def resolve(name, data, npc_id, text)
      resolver = TtsLineResolver.new(scenario_name: name, scenario_data: data,
                                     story_file: ->(path) { Engine.root.join(path) })
      resolver.resolve(npc_id, TtsLineResolver.find_npc(data, npc_id), text)
    end

    test "jsonb does not keep the template's room order (the premise)" do
      fresh = render('m10_full_disclosure')
      assert_not_equal fresh['rooms'].keys, through_jsonb(fresh)['rooms'].keys
    end

    test "stored scenario data resolves the same lines as a fresh render once the rooms are back in template order" do
      CASES.each do |name, npc_id, text|
        fresh = render(name)
        stored = through_jsonb(fresh)
        assert resolve(name, fresh, npc_id, text).line, "#{name}: the fresh render must voice #{npc_id}: #{text}"
        assert_nil resolve(name, stored, npc_id, text).line,
                   "#{name}: jsonb order was expected to break #{npc_id}'s line (premise of this test)"

        ordered = TtsLineResolver.in_template_order(stored, fresh['rooms'].keys)
        assert_equal fresh['rooms'].keys, ordered['rooms'].keys
        assert_equal text, resolve(name, ordered, npc_id, text).line, "#{name}: #{npc_id} refused on stored data"
      end
    end

    test "in_template_order keeps rooms the template lacks (last, in stored order) and ignores template rooms the game lacks" do
      data = { 'rooms' => { 'b' => { 'x' => 1 }, 'zz' => {}, 'aaa' => {} }, 'startRoom' => 'b' }
      ordered = TtsLineResolver.in_template_order(data, %w[aaa gone b])
      assert_equal %w[aaa b zz], ordered['rooms'].keys
      assert_equal({ 'x' => 1 }, ordered['rooms']['b'])
      assert_equal 'b', ordered['startRoom']
      assert_equal %w[b zz aaa], data['rooms'].keys, 'the stored data is not changed'
    end

    test "in_template_order returns the data itself when there is nothing to reorder" do
      data = { 'rooms' => { 'a' => {}, 'b' => {} } }
      assert_same data, TtsLineResolver.in_template_order(data, %w[a b])
      assert_same data, TtsLineResolver.in_template_order(data, [])
      assert_same data, TtsLineResolver.in_template_order(data, nil)
      assert_nil TtsLineResolver.in_template_order(nil, %w[a])
    end

    test "Mission#template_room_order is the template's room order" do
      mission = Mission.new(name: 'm10_full_disclosure')
      assert_equal render('m10_full_disclosure')['rooms'].keys, mission.template_room_order
    end
  end
end
