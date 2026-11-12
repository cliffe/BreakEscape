require 'test_helper'
require_relative '../support/network_model_scenario'

# Slice 9.3a step 1 (ACCESS_MODEL_SLICE_9_3_PLAN.md, sections 3 and 4.2): the shared rules
# in BreakEscape::NetworkModel, the two player_state keys and the resource content ids.
class NetworkModelTest < ActiveSupport::TestCase
  NM = BreakEscape::NetworkModel

  def data
    @data ||= NetworkModelScenario.scenario
  end

  def ids(entries)
    entries.map { |entry| entry[:object]['id'] }
  end

  test 'membership comes from the object, else from its room, else none' do
    rooms = data['rooms']
    assert_equal 'office_lan', NM.network_of(rooms['desk_room']['objects'][0], rooms['desk_room']),
                 'an object network of its own'
    assert_equal 'office_lan', NM.network_of(rooms['kiosk_room']['objects'][0], rooms['kiosk_room']),
                 "the room's default"
    assert_nil NM.network_of(rooms['desk_room']['objects'][1], rooms['desk_room']), 'neither'

    own = { 'network' => 'workshop_lan' }
    assert_equal 'workshop_lan', NM.network_of(own, { 'network' => 'office_lan' }), "the object's own value wins"
    assert_nil NM.network_of({ 'network' => '  ' }, nil)
  end

  test 'the networks, the jacks and their networks' do
    assert_equal %w[office_lan workshop_lan], NM.networks(data).keys
    jacks = NM.jacks(data)
    assert_equal %w[comms_port server_port bench_port], ids(jacks)
    assert_equal %w[office_lan office_lan workshop_lan], jacks.map { |j| j[:network] }
  end

  # Sorted by id, not in scenario order: scenario_data is stored as jsonb, which keeps
  # object keys sorted by length then bytes, so authored order cannot survive (D3).
  test 'the hosts and resources on a network, sorted by id' do
    assert_equal %w[door_box kiosk_pc lena_pc sam_pc], ids(NM.sign_in_objects_on('office_lan', data)),
                 'every sign-in object on the network, sorted by id'
    assert_equal %w[bench_pc], ids(NM.sign_in_objects_on('workshop_lan', data))
    assert_equal %w[ledger_archive print_queue scanned_inbox], NM.resources_on('office_lan', data).map(&:first)
    assert_equal %w[bench_notes], NM.resources_on('workshop_lan', data).map(&:first)
    assert_empty NM.sign_in_objects_on(nil, data)
    assert_empty NM.resources_on('', data)
  end

  test 'nothing under a sign-in object is a room object' do
    paths = NM.room_objects(data).map { |entry| entry[:object]['id'] }
    refute_includes paths, 'door_codes'
    refute_includes paths, 'sam_local'
    assert_includes paths, 'vault_prize', "an ordinary container's contents are walked"
  end

  test 'a rogue device definition is found in each of the five homes' do
    %w[room container start npc grant].each do |home|
      found = NM.rogue_device_definitions(NetworkModelScenario.with_device_home(home))
      assert_equal [home], found.map { |f| f[:home] }, home
      assert_equal 'kit_dropbox', found.first[:item]['id'], home
    end
  end

  test 'a rogue device needs an id' do
    scenario = NetworkModelScenario.scenario
    scenario['rooms']['lobby']['objects'][0].delete('id')
    assert_empty NM.rogue_device_definitions(scenario)
  end

  test 'reach_conditions: one open route on the same network or with none, no route across' do
    resources = NM.resources(data)
    assert_equal [[]], NM.reach_conditions(data, 'office_lan', resources['scanned_inbox'])
    assert_equal [], NM.reach_conditions(data, 'workshop_lan', resources['scanned_inbox'])
    assert_equal [], NM.reach_conditions(data, nil, resources['scanned_inbox'])
    assert_equal [[]], NM.reach_conditions(data, 'workshop_lan', { 'kind' => 'printer' })
    assert_equal [[]], NM.reach_conditions(data, nil, { 'kind' => 'printer' })
  end

  # Slice 9.3b sub-slice K (ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.1): links and the pivot.
  def linked_scenario(links)
    {
      'networks' => { 'a' => { 'name' => 'A' }, 'b' => { 'name' => 'B' }, 'c' => { 'name' => 'C' },
                      'd' => { 'name' => 'D' } },
      'networkLinks' => links
    }
  end

  test 'network_links keeps only two-item pairs of defined, distinct networks' do
    d = linked_scenario([%w[a b], %w[b c], %w[a x], %w[a], %w[a a], 'junk', %w[a b c]])
    assert_equal [%w[a b], %w[b c]], NM.network_links(d)
  end

  test 'linked_networks is undirected and sorted' do
    d = linked_scenario([%w[a b], %w[c a]])
    assert_equal %w[b c], NM.linked_networks(d, 'a')
    assert_equal %w[a], NM.linked_networks(d, 'b')
    assert_empty NM.linked_networks(d, 'd')
    assert_empty NM.linked_networks(d, nil)
  end

  test 'reach_paths: a chain is shortest first, the same network is a single node, no link is none' do
    chain = linked_scenario([%w[a b], %w[b c], %w[c d]])
    assert_equal [%w[a b c d]], NM.reach_paths(chain, 'a', 'd')
    assert_equal [%w[a]], NM.reach_paths(chain, 'a', 'a')
    assert_empty NM.reach_paths(linked_scenario([%w[a b]]), 'a', 'd')
  end

  test 'reach_paths: a cycle gives both directions, shortest first and ordered' do
    cycle = linked_scenario([%w[a b], %w[b c], %w[c d], %w[a d]])
    assert_equal [%w[a d], %w[a b c d]], NM.reach_paths(cycle, 'a', 'd')
  end

  test 'reach_paths is capped at eight' do
    # a and f joined through ten parallel middle networks plus a direct link: eleven simple
    # paths, so the pivot keeps the first eight.
    middles = (1..10).map { |i| "m#{i}" }
    nets = { 'a' => { 'name' => 'A' }, 'f' => { 'name' => 'F' } }
    middles.each { |m| nets[m] = { 'name' => m } }
    links = middles.flat_map { |m| [['a', m], [m, 'f']] } + [%w[a f]]
    d = { 'networks' => nets, 'networkLinks' => links }
    assert_equal NM::REACH_PATHS_CAP, NM.reach_paths(d, 'a', 'f').length
    assert_operator NM.all_reach_paths(d, 'a', 'f').length, :>, NM::REACH_PATHS_CAP
  end

  test 'reach_conditions over a link: same network, linked, and unreachable' do
    d = linked_scenario([%w[a b]])
    res_on_b = { 'network' => 'b' }
    assert_equal [[]], NM.reach_conditions(d, 'a', res_on_b), 'linked, no downIf: one empty route'
    assert_equal [[]], NM.reach_conditions(d, 'b', res_on_b), 'same network'
    assert_equal [], NM.reach_conditions(d, 'a', { 'network' => 'd' }), 'no link'
    assert_equal [[]], NM.reach_conditions(d, 'a', { 'kind' => 'printer' }), 'no network'
  end

  # ---- Outages (sub-slice O, 5.2) ----

  test 'truthy? is false for each globals-relevant falsy value and true for everything else' do
    [nil, false, 0, 0.0, ''].each { |falsy| refute NM.truthy?(falsy), "#{falsy.inspect} should be falsy" }
    ['false', 'x', '0', true, 1, -1, 0.1, [], {}, ' '].each { |truthy| assert NM.truthy?(truthy), "#{truthy.inspect} should be truthy" }
  end

  test 'reach_conditions over a link carries each network downIf global on the route' do
    d = linked_scenario([%w[a b]])
    d['networks']['a']['downIf'] = 'a_down'
    d['networks']['b']['downIf'] = 'b_down'
    res_on_b = { 'network' => 'b' }
    assert_equal [%w[a_down b_down]], NM.reach_conditions(d, 'a', res_on_b), 'both networks on the route are conditions'
    assert_equal [['b_down']], NM.reach_conditions(d, 'b', res_on_b), 'same network: its own downIf only'
    # The station network's own outage is a condition even for a same-network resource.
    assert_equal [['a_down']], NM.reach_conditions(d, 'a', { 'network' => 'a' })
  end

  test 'a scenario with no networks answers empty everywhere' do
    bare = { 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'objects' => [{ 'id' => 'pc', 'lockType' => 'login' }] } } }
    assert_empty NM.networks(bare)
    assert_empty NM.resources(bare)
    assert_empty NM.jacks(bare)
    assert_empty NM.sign_in_objects_on('office_lan', bare)
    assert_empty NM.resources_on('office_lan', bare)
    assert_empty NM.rogue_device_definitions(bare)
    [nil, [], 'x', {}].each do |junk|
      assert_empty NM.networks(junk)
      assert_empty NM.jacks(junk)
      assert_empty NM.rogue_device_definitions(junk)
    end
  end

  test 'resource content ids are stamped once, and a second run changes nothing' do
    scenario = NetworkModelScenario.scenario
    scenario['resources']['scanned_inbox']['contents'] << { 'type' => 'text_file', 'name' => 'unnamed.txt',
                                                            'contents' => [{ 'type' => 'notes', 'name' => 'deep' }] }
    game = BreakEscape::Game.new(scenario_data: scenario)
    game.prepare_scenario_data!
    added = game.scenario_data['resources']['scanned_inbox']['contents'][1]
    assert_equal 'scanned_inbox_content_1', added['id']
    assert_equal 'scanned_inbox_content_1_content_0', added['contents'][0]['id']
    assert_equal 'inbox_letter', game.scenario_data['resources']['scanned_inbox']['contents'][0]['id'], 'an authored id is kept'

    before = game.scenario_data.deep_dup
    game.prepare_scenario_data!
    assert_equal before, game.scenario_data
  end

  test 'the two player_state keys are defaults: filled on create, dropped and refilled by a reset' do
    game = create_access_game(
      mission: break_escape_missions(:ceo_exfil),
      player: break_escape_demo_users(:test_user),
      scenario: NetworkModelScenario.scenario
    )
    assert_equal({}, game.player_state['footholds'])
    assert_equal [], game.player_state['gainedFootholds']

    game.player_state['footholds'] = { 'jack_comms_port' => { 'via' => 'jack' } }
    game.player_state['gainedFootholds'] = ['comms_port']
    game.save!
    game.reset_player_state!
    assert_equal({}, game.reload.player_state['footholds'])
    assert_equal [], game.player_state['gainedFootholds']
  end

  # Slice 9.3b sub-slice I: the grant_foothold enumerator keeps only server-run paths.
  test 'grant_foothold_actions keeps server-run paths and reads the shape and needs' do
    sc = {
      'rooms' => {
        'office' => { 'objects' => [
          { 'id' => 'socket', 'triggerOnInteract' => [
            { 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true, 'needsHeld' => 'badusb', 'name' => 'BadUSB' }
          ] }
        ] }
      },
      'timers' => [
        { 'id' => 't', 'actions' => [{ 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsDropped' => 'stick', 'name' => 'Stick' }] }
      ],
      # Neither of these is a server-run path, so both are dropped.
      'flagRewards' => [{ 'type' => 'grant_foothold', 'pc' => 'x_pc', 'needsDropped' => 'kit' }],
      'eventMappings' => { 'ev' => [{ 'type' => 'grant_foothold', 'pc' => 'y_pc', 'needsSession' => true }] }
    }
    actions = NM.grant_foothold_actions(sc)
    by_pc = actions.map { |a| [a[:pc], a[:shape]] }.sort
    assert_equal [%w[lena_pc session], %w[sam_pc dropped]], by_pc
    session = actions.find { |a| a[:pc] == 'lena_pc' }
    assert_equal 'badusb', session[:needs_held]
    assert_match %r{triggerOnInteract}, session[:path]
    dropped = actions.find { |a| a[:pc] == 'sam_pc' }
    assert_equal 'stick', dropped[:needs_dropped]
    assert_match %r{timers\[0\]/actions\[0\]}, dropped[:path]
  end

  # Slice 9.3b sub-slice W (ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.3): Wi-Fi.
  test 'wifi_of reads a network block, and absent psk means an open network' do
    d = NetworkModelScenario.scenario
    d['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest', 'psk' => 'seabreeze-2025' } }
    d['networks']['visitor_wifi'] = { 'name' => 'Visitor Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Open' } }
    assert_equal({ 'ssid' => 'Harbour-Guest', 'psk' => 'seabreeze-2025' }, NM.wifi_of(d, 'guest_wifi'))
    assert_nil NM.wifi_of(d, 'visitor_wifi')['psk']
    assert_nil NM.wifi_of(d, 'office_lan'), 'a network with no wifi block'
    assert_nil NM.wifi_of(d, 'no_such_net')
  end

  test 'wifi_aps lists objects with wifiAp on a network that defines wifi' do
    d = NetworkModelScenario.scenario
    d['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest', 'psk' => 'seabreeze-2025' } }
    d['rooms']['lobby']['objects'] << { 'id' => 'guest_ap', 'type' => 'pc', 'name' => 'AP', 'wifiAp' => true, 'network' => 'guest_wifi' }
    d['rooms']['lobby']['objects'] << { 'id' => 'guest_ap2', 'type' => 'pc', 'name' => 'AP2', 'wifiAp' => true, 'network' => 'guest_wifi' }
    # wifiAp on a network with no wifi block is not an access point
    d['rooms']['lobby']['objects'] << { 'id' => 'bogus_ap', 'type' => 'pc', 'name' => 'Bogus', 'wifiAp' => true, 'network' => 'office_lan' }
    assert_equal %w[guest_ap guest_ap2], ids(NM.wifi_aps(d)).sort
  end

  test 'readers default for a game from before this slice' do
    game = BreakEscape::Game.new(scenario_data: NetworkModelScenario.scenario, player_state: {})
    assert_equal({}, game.network_footholds)
    assert_equal [], game.gained_footholds
    game.player_state = { 'footholds' => 'junk', 'gainedFootholds' => 'junk' }
    assert_equal({}, game.network_footholds)
    assert_equal [], game.gained_footholds
  end
end
