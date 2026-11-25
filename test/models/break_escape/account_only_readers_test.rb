require 'test_helper'
require 'yaml'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops S5bc unit 20 (S5c): readers of the room's people leave an account-only NPC out; readers of
  # accounts keep it. The manifest (test/models/account_only_readers.yml) lists every method in app/
  # and lib/ that loops room NPCs, so a new loop must be marked.
  class AccountOnlyReadersTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    MANIFEST = Engine.root.join('test/models/account_only_readers.yml')
    # Direct readers of a room's npcs and the indirect ones (R1-SERVER7): the account lists, one-NPC lookups and
    # room NPC lists each reach the same records through a helper.
    LOOP_PATTERN = /\[['"]npcs['"]\]|scenario_room_npcs|dig\([^)]*['"]npcs['"]|account_npcs|scenario_room_npc\b|scenario_npc_records|room_npcs|room_npc_list/

    def scenario
      data = AccessModelScenario.routes_scenario
      lobby = data['rooms']['lobby']
      lobby['npcs'].first['spriteSheet'] = 'person_sprite'
      lobby['npcs'] << { 'id' => 'deskadmin', 'displayName' => 'Desk Admin', 'npcType' => 'person',
                         'accountOnly' => true, 'spriteSheet' => 'admin_sprite', 'role' => 'it',
                         'creds' => { 'username' => 'deskadmin', 'password' => 'Desk-Admin-1', 'admin' => true } }
      lobby['connections']['east'] = 'closet'
      data['rooms']['closet'] = { 'type' => 'room_office', 'connections' => { 'west' => 'lobby' },
                                  'npcs' => [{ 'id' => 'labadmin', 'displayName' => 'Lab Admin', 'npcType' => 'person',
                                               'accountOnly' => true, 'role' => 'it',
                                               'creds' => { 'username' => 'labadmin', 'password' => 'Lab-Admin-1' } }] }
      data
    end

    setup do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby closet] }
      )
    end

    test 'the room answer has no account-only entry, and a person stays' do
      get room_game_url(@game, room_id: 'lobby')
      assert_response :success
      ids = response.parsed_body['room']['npcs'].map { |n| n['id'] }
      assert_includes ids, 'len'
      refute_includes ids, 'deskadmin'
      refute_includes response.body, 'Desk Admin'
    end

    test 'a room with only an account-only NPC answers with no NPCs and is not encountered' do
      get room_game_url(@game, room_id: 'closet')
      assert_response :success
      assert_equal [], Array(response.parsed_body['room']['npcs'])
      refute_includes Array(@game.reload.player_state['encounteredNPCs']), 'labadmin'
      refute_includes response.body, 'Lab Admin'
    end

    test 'the scenario map says hasNPCs by people only' do
      get scenario_map_game_url(@game)
      assert_response :success
      map = response.parsed_body
      map = map['rooms']
      assert_equal true, map['lobby']['hasNPCs']
      assert_equal false, map['closet']['hasNPCs']
    end

    test 'the bootstrap has no sprite key or present-NPC flag for an account' do
      data = @game.filtered_scenario_for_bootstrap
      assert_includes data['characterSprites'], 'person_sprite'
      refute_includes data['characterSprites'], 'admin_sprite'
      assert_equal true, data['rooms']['lobby']['hasPresentNpc']
      assert_equal false, data['rooms']['closet']['hasPresentNpc']
      refute_includes data.to_json, 'deskadmin'
    end

    test 'an account is not in a room, cannot be knocked out' do
      assert @game.send(:npc_in_room?, 'len', 'lobby')
      assert_not @game.send(:npc_in_room?, 'deskadmin', 'lobby')
      ids = @game.send(:ko_claimable_room_npc_ids)
      assert_includes ids, 'len'
      refute_includes ids, 'deskadmin'
    end

    test 'the narrow stub read leaves an account out of the knock-out ids too' do
      narrow = Game.find(@game.id)
      narrow.define_singleton_method(:has_attribute?) { |name| name.to_s == 'scenario_data' ? false : super(name) }
      ids = narrow.send(:ko_claimable_room_npc_ids)
      assert_includes ids, 'len'
      refute_includes ids, 'deskadmin'
    end

    test 'account readers keep the NPC' do
      assert_includes @game.account_npcs.map { |n| n['id'] }, 'deskadmin'
      assert_equal 'deskadmin', @game.account_for_username('deskadmin')['id']
      assert_includes Game.scenario_room_npcs(@game.scenario_data).map { |n| n['id'] }, 'labadmin'
      # R1-SERVER4: the ids the game can have in a room leave the account out (a sync entry for it is dropped as an invented id's is)
      refute_includes @game.scenario_npc_ids, 'deskadmin'
      assert_includes @game.scenario_npc_ids, 'len'
    end

    test 'the manifest matches the source: no missing and no stale entry, skips name account_only?' do
      found = scan_source
      listed = YAML.load_file(MANIFEST)
      assert_equal [], (found.keys - listed.keys), 'a method loops room NPCs and is not in the manifest'
      assert_equal [], (listed.keys - found.keys), 'the manifest names a method that no longer loops room NPCs'
      listed.each do |key, entry|
        assert_includes %w[skip keep], entry['action'], key
        assert entry['why'].to_s.strip.length > 5, "#{key} needs a reason"
        next unless entry['action'] == 'skip'

        assert_match(/account_only\?/, found[key], "#{key} is marked skip but never calls account_only?")
      end
    end

    private

    # { "path#method" => method source } for every def whose body matches LOOP_PATTERN.
    def scan_source
      out = {}
      Dir[Engine.root.join('app/**/*.rb'), Engine.root.join('lib/**/*.rb')].sort.each do |path|
        rel = path.sub("#{Engine.root}/", '')
        next if rel.start_with?('app/views')

        current = nil
        bodies = Hash.new { |h, k| h[k] = +'' }
        File.foreach(path) do |line|
          current = "#{Regexp.last_match(2)}#{Regexp.last_match(3)}" if line =~ /^(\s*)def\s+(self\.)?([\w?!=]+)/
          next if current.nil? || line =~ /^\s*#/

          bodies[current] << line
        end
        bodies.each { |m, body| out["#{rel}##{m}"] = body if body =~ LOOP_PATTERN }
      end
      out
    end
  end
end
