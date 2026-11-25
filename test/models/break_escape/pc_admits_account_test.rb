# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'erb'

module BreakEscape
  # Ops S5bc unit 17 (brief D6): `Game#pc_admits_account?` and `CredentialModel.pc_admits_account?`
  # must agree on every sign-in PC and every account of every shipped scenario, before the first
  # delegates to the second. Kind cases live in account_kind_test.rb.
  class PcAdmitsAccountTest < ActiveSupport::TestCase
    def self.shipped
      Dir.glob(Engine.root.join('scenarios', '*', 'scenario.json.erb')).sort
    end

    def render(path)
      srand(1)
      JSON.parse(ERB.new(File.read(path)).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    end

    def game_admits?(pc, npc)
      Game.allocate.send(:pc_admits_account?, pc, npc)
    end

    test 'the two definitions agree on every PC and account of every shipped scenario' do
      checked = 0
      self.class.shipped.each do |path|
        data = render(path)
        npcs = Game.scenario_room_npcs(data).select { |n| Game.account_holder?(n) }
        pcs = AccessIdentities.room_objects(data).map { |e| e[:object] }.select { |o| o.is_a?(Hash) && o.key?('id') }
        pcs.each do |pc|
          npcs.each do |npc|
            checked += 1
            assert_equal CredentialModel.pc_admits_account?(pc, npc), game_admits?(pc, npc),
                         "#{File.basename(File.dirname(path))}: #{pc['id']} / #{npc['id']}"
          end
        end
      end
      assert_operator checked, :>, 100
    end

    def acct(extra = {})
      { 'id' => 'ann', 'roles' => 'staff', 'creds' => { 'username' => 'ann', 'password' => 'x' }.merge(extra) }
    end

    def pc(extra = {})
      { 'id' => 'pc_a', 'lockType' => 'login' }.merge(extra)
    end

    test 'no kind and no access list admit' do
      assert CredentialModel.pc_admits_account?(pc, acct)
      assert game_admits?(pc, acct)
    end
  end
end
