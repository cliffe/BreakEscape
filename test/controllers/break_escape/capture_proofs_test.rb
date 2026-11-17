require 'test_helper'
require_relative '../../support/capture_proof_scenario'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md, section 6). Every
  # proof is earned through the real requests, never by writing player_state: an inventory remove
  # with used_on, a player_drop, a sign-in or an owner claim, a network plant.
  class CaptureProofsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    CP = CaptureProofScenario

    def build_game(scenario = CP.scenario, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }.merge(player_state)
      )
    end

    # A CP scenario with one phish target under a landing page that carries a secret, reached by a
    # link kit (the honest route). Used by the 6b evidence tests.
    def phish_scenario
      scenario = CP.scenario
      scenario['social']['landingPages'] = [{ 'id' => 'portal', 'capture' => { 'address' => 'p@x.example', 'secret' => 'Land-Secret-1' } }]
      scenario['social']['phishTargets'] = [{ 'id' => 'phished' }]
      scenario['social']['mailClient'] = { 'payloadKit' => [{ 'id' => 'kit_portal', 'kind' => 'link', 'landingPageId' => 'portal' }] }
      scenario
    end

    def forge(*ids)
      captures = ids.each_with_index.to_h do |id, i|
        [id, { 'targetId' => id, 'kind' => 'credential', 'address' => CP::USERNAMES[id], 'at' => i + 1 }]
      end
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def secrets
      get game_path('capture_secrets'), as: :json
      assert_response :success
      response.parsed_body['secrets']
    end

    # Count the SELECT scenario_data queries (Game#stored_scenario_data's pick on the narrow sync
    # load) issued during the block, to prove the m1 scenario-load skip.
    def count_scenario_loads
      count = 0
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        sql = payload[:sql].to_s
        # Count only full scenario_data column loads (the quoted column), not the formatVersion
        # jsonb-scalar pluck sync_format_refusal issues on every sync once current is non-zero
        # (step 8a makes current 1). The quoted "scenario_data" appears only in the full-column
        # load; the pluck uses the unquoted scalar form, as reload_persistence_test.rb:841 draws it.
        count += 1 if sql.start_with?('SELECT') && sql.include?('"scenario_data"') && !sql.include?('*')
      end
      yield
      count
    ensure
      ActiveSupport::Notifications.unsubscribe(sub) if sub
    end

    def take(id, type, name)
      post game_path('inventory'), params: { action_type: 'add', item: { type: type, id: id, name: name } }, as: :json
      response.parsed_body
    end

    def remove(id, used_on = nil)
      params = { action_type: 'remove', item: { id: id } }
      params[:used_on] = used_on if used_on
      post game_path('inventory'), params: params, as: :json
      assert_response :success, response.body
    end

    def drop(id, name)
      post game_path('update_room'), params: {
        roomId: 'office', actionType: 'add_object', sourceType: 'player_drop',
        data: { id: id, type: 'usb', name: name, x: 10, y: 10 }
      }, as: :json
    end

    def planted
      @game.reload.player_state['plantedItems']
    end

    test 'a forged se_captures entry on a fresh game earns no password in a scenario that declares proofs' do
      build_game
      forge(*CP::PASSWORDS.keys)
      served = secrets
      %w[chris mel sofia ned quinn].each { |id| refute served.key?(id), "#{id} was served with no proof" }
      CP::PASSWORDS.except('opal').each_value { |pw| refute_includes response.body, pw }
    end

    test 'an account whose password opens nothing is served as today in a strict scenario' do
      build_game
      forge('opal')
      assert_equal CP::PASSWORDS['opal'], secrets['opal']
    end

    # M1 (code review R1): a password that is also the code of a password or PIN lock opens
    # something, wherever the lock sits.
    {
      'a password-locked drawer in the room' => lambda do |sc, pw|
        sc['rooms']['office']['objects'] << { 'id' => 'opal_drawer', 'type' => 'safe', 'name' => 'Drawer',
                                              'locked' => true, 'lockType' => 'password', 'requires' => pw }
      end,
      'a PIN lock nested in a container' => lambda do |sc, pw|
        sc['rooms']['office']['objects'] << { 'id' => 'cabinet', 'type' => 'safe', 'name' => 'Cabinet', 'contents' => [
          { 'id' => 'tin', 'type' => 'safe', 'name' => 'Tin', 'locked' => true, 'lockType' => 'pin', 'requires' => pw }
        ] }
      end,
      'a password-locked door' => lambda do |sc, pw|
        sc['rooms']['vault'].merge!('lockType' => 'password', 'requires' => pw)
      end,
      'a granted item' => lambda do |sc, pw|
        sc['timers'] = [{ 'id' => 'g', 'afterMs' => 1000, 'actions' => [{ 'type' => 'give_item', 'item' => {
          'id' => 'laptop', 'type' => 'laptop', 'name' => 'Laptop', 'locked' => true, 'lockType' => 'password', 'requires' => pw
        } }] }]
      end
    }.each do |where, add_lock|
      test "a forged capture of an account whose password is the code of #{where} is not served without a proof" do
        scenario = CP.scenario
        # Opal's sign-in PC admits someone else, so only the lock makes her password open something.
        scenario['rooms']['office']['objects'] << CP.login_pc('opal_pc', 'chris')
        add_lock.call(scenario, CP::PASSWORDS['opal'])
        build_game(scenario)
        assert CaptureModel.password_opens_lock?(CP.npc('opal'), @game.scenario_data)
        forge('opal')
        refute secrets.key?('opal'), "opal's password was served on a forged capture"
        refute_includes response.body, CP::PASSWORDS['opal']
      end
    end

    test 'a password lock with a different code leaves an account that opens nothing served' do
      scenario = CP.scenario
      scenario['rooms']['office']['objects'] << { 'id' => 'drawer', 'type' => 'safe', 'name' => 'Drawer',
                                                  'locked' => true, 'lockType' => 'password', 'requires' => 'Other-Code-1' }
      build_game(scenario)
      forge('opal')
      assert_equal CP::PASSWORDS['opal'], secrets['opal']
    end

    test 'planted: a room pickup then a consumesItem remove with used_on, holding after the device is taken back' do
      build_game
      forge('chris')
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      remove('kit_logger', 'chris_desk')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
      refute @game.reload.player_state.dig('room_states', 'office', 'objects_removed')&.include?('chris_desk'),
             'no removed-objects write was made for the desk'

      take('kit_logger', 'usb', 'Inline keylogger')
      remove('kit_logger')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted, 'taking the device back does not undo it'
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
    end

    test 'planted: a start-item device removed by a confirm remove_item, through the address shorthand' do
      build_game
      forge('ned')
      refute secrets.key?('ned')
      remove('kit_box', 'box_port')
      assert_equal [{ 'item' => 'kit_box', 'on' => 'box_port' }], planted
      assert_equal CP::PASSWORDS['ned'], secrets['ned']
    end

    # Code review R2, B1: an object added to a room with no server-known source is stamped
    # clientAdded (ItemIdentity::CLIENT_ADDED_MARKER) with a server id, but keeps its
    # client-chosen type and name. object_takes_item? matches a plant target's requiresItem
    # on id/type/name, so a forged device whose name equals the target's requiresItem would
    # otherwise mint a plant and serve the gated secret. record_planted_item! and
    # object_takes_item? now skip a client-forged item.
    test 'a forged clientAdded device matching a plant target records no plant and serves no secret' do
      build_game
      forge('chris')
      refute secrets.key?('chris'), 'chris starts gated behind the planted kit_logger proof'

      # Unsourced add_object: the forged device takes the name of chris_desk's requiresItem.
      post game_path('update_room'), params: {
        roomId: 'office', actionType: 'add_object',
        data: { type: 'usb', name: 'kit_logger', takeable: true, x: 5, y: 5 }
      }, as: :json
      assert_response :success, response.body
      added = @game.reload.player_state.dig('room_states', 'office', 'objects_added').last
      assert_equal true, added['clientAdded'], 'the unsourced add is marked client-added'
      forged_id = added['id']
      refute_equal 'kit_logger', forged_id, 'the client id was replaced with a server id'

      post game_path('inventory'), params: { action_type: 'add',
                                             item: { type: 'usb', id: forged_id, name: 'kit_logger' } }, as: :json
      assert_response :success, response.body
      held = @game.reload.player_state['inventory'].find { |i| i['id'] == forged_id }
      assert held && BreakEscape::ItemIdentity.client_forged?(held), 'the forged item carried its marker into the inventory'

      remove(forged_id, 'chris_desk')
      assert_equal [], planted, 'a forged device records no plant'
      refute secrets.key?('chris'), 'chris password served from a forged plant'
      refute_includes response.body, CP::PASSWORDS['chris']
    end

    test 'a remove with used_on that does not consume the item, matched only by name, or in a locked room records nothing' do
      build_game
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      %w[decoy_desk chris_desk_by_name vault_desk box_port no_such_object].each do |object_id|
        post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_logger' }, used_on: object_id }, as: :json
        assert_equal [], planted, "a remove used on #{object_id} recorded a plant"
        take('kit_logger', 'usb', 'Inline keylogger')
      end
      # Not held: nothing is recorded even at the right object.
      remove('kit_logger')
      remove('kit_logger', 'chris_desk')
      assert_equal [], planted
    end

    test 'planted: a plant the PC\'s USB policy refuses is never recorded, whatever the client sends (9.2 U)' do
      data = CP.scenario
      data['policies'] = { 'managed' => { 'usb' => 'storage_blocked' }, 'locked' => { 'usb' => 'blocked' } }
      data['defaultPolicy'] = 'managed'
      objs = data['rooms']['office']['objects']
      objs.find { |o| o['id'] == 'kit_logger' }['usbClass'] = 'storage'
      objs.find { |o| o['id'] == 'chris_desk' }['workstation'] = true
      build_game(data)
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      remove('kit_logger', 'chris_desk')
      assert_equal [], planted, 'storage on a storage_blocked workstation'

      # A hid device on the same PC is accepted; on a PC whose policy blocks every USB, refused
      data['rooms']['office']['objects'].find { |o| o['id'] == 'kit_logger' }['usbClass'] = 'hid'
      build_game(data)
      take('kit_logger', 'usb', 'Inline keylogger')
      remove('kit_logger', 'chris_desk')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted
      data['rooms']['office']['objects'].find { |o| o['id'] == 'chris_desk' }['policy'] = 'locked'
      build_game(data)
      take('kit_logger', 'usb', 'Inline keylogger')
      remove('kit_logger', 'chris_desk')
      assert_equal [], planted, 'hid on a blocked PC'
    end

    test 'planted: an ungoverned object under a blocking defaultPolicy takes the device and is recorded (review R2 m4)' do
      # pc-policy.js and the validator's "does not reach it" warning: the default policy governs
      # only workstations and objects naming a policy, so a plain consumesItem object accepts it
      data = CP.scenario
      data['policies'] = { 'locked' => { 'usb' => 'blocked' } }
      data['defaultPolicy'] = 'locked'
      data['rooms']['office']['objects'].find { |o| o['id'] == 'kit_logger' }['usbClass'] = 'storage'
      build_game(data)
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      remove('kit_logger', 'chris_desk')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted
    end

    test 'dropped: an accepted player_drop holds, a refused drop records nothing' do
      build_game
      forge('sofia')
      drop('kit_logger', 'Inline keylogger')
      assert_equal [], @game.reload.player_state['droppedItems'], 'a refused drop (not held) is not recorded'
      refute secrets.key?('sofia')

      drop('kit_qr', 'QR card')
      assert_response :success, response.body
      assert_equal ['kit_qr'], @game.reload.player_state['droppedItems']
      assert_equal CP::PASSWORDS['sofia'], secrets['sofia']
    end

    test 'session: an owner claim alone holds the shorthand session proof' do
      build_game
      forge('mel')
      refute secrets.key?('mel')
      post game_path('login'), params: { pc_id: 'mel_pc', claim: 'owner' }, as: :json
      assert_response :success, response.body
      assert_equal CP::PASSWORDS['mel'], secrets['mel']
    end

    test 'session: a password sign-in holds the proof' do
      build_game
      forge('mel')
      body = sign_in('mel_pc', CP::USERNAMES['mel'], CP::PASSWORDS['mel'])
      assert_equal true, body['success'], body.inspect
      assert_equal CP::PASSWORDS['mel'], secrets['mel']
    end

    test 'an account with a capture route, a password that opens a PC and no proof is never served' do
      build_game
      forge('quinn')
      body = sign_in('quinn_pc', CP::USERNAMES['quinn'], CP::PASSWORDS['quinn'])
      assert_equal true, body['success'], body.inspect
      refute secrets.key?('quinn')
    end

    test 'a scenario with no proof anywhere is served as today' do
      build_game(CP.scenario_without_proofs)
      forge(*CP::PASSWORDS.keys)
      served = secrets
      CP::PASSWORDS.each { |id, pw| assert_equal pw, served[id], id }
    end

    test 'an existing game row whose frozen scenario has no proof is served as before' do
      build_game(CP.scenario_without_proofs)
      forge('chris')
      # The scenario file gaining a proof later does not change the frozen copy.
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
      refute CaptureModel.declares_proofs?(@game.reload.scenario_data)
    end

    # Chunk C (plan section 6): write the two server-owned stores the way the two gated routes do,
    # so a controller test can serve a phish credential off them without driving the full lab
    # builder/mail progression. Nothing here forges: the stores are server-written only and this
    # stands in for the routes having run.
    def seed_phish_stores(landed: true, meets: true, built: true, kit: 'kit_portal', target: 'phished')
      @game.reload
      @game.player_state['seLandingPages'] = { 'portal' => {
        'pageId' => 'portal', 'targetId' => target, 'choices' => {}, 'credibility' => 88,
        'meetsThreshold' => meets, 'built' => built, 'at' => 1
      } }
      @game.player_state['sePhishSends'] = { "#{target}/#{kit}" => {
        'targetId' => target, 'kitId' => kit, 'pageId' => 'portal', 'landed' => landed, 'at' => 1
      } }
      @game.save!
    end

    test 'chunk C: a landing page capture is served from the two server stores, and the single-secret fallback refuses an undeclared target id' do
      build_game(phish_scenario)
      # The build and send routes recorded the page build and a landed send to lord's analogue; the
      # reader reads only those two server stores (never the client globals).
      seed_phish_stores
      put game_path('sync_state'), params: {
        globalVariables: {
          'se_captures' => {
            'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 },
            'invented' => { 'targetId' => 'invented', 'kind' => 'credential', 'address' => 'p@x.example', 'at' => 2 }
          }
        }
      }, as: :json
      # phished resolves through the single-secret fallback and has a landed send in sePhishSends;
      # invented resolves to portal by its capture address but has no landed send to targetId
      # invented, so the fallback refuses it.
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets)
    end

    test 'chunk C: a landing page capture claimed with no server evidence is not served' do
      build_game(phish_scenario)
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 }
      } } }, as: :json
      assert_equal({}, secrets)
    end

    # The forge the plan closes (section 1, hostile case 5): a tampered client syncs a built,
    # convincing se_landing_pages global with a victim.submitted marker and a landed sent mail, and
    # NEVER calls the two routes. After the reader change the gate reads neither client section, so
    # the capture stays unproven and the secret is withheld.
    test 'chunk C: the forged se_landing_pages and mailState sync no longer serves the secret' do
      build_game(phish_scenario)
      put game_path('sync_state'), params: {
        globalVariables: {
          'se_captures' => { 'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 } },
          'se_landing_pages' => { 'portal' => { 'built' => true, 'meetsThreshold' => true, 'victim' => { 'submitted' => true } } }
        },
        mailState: { 'mailboxes.inbox.m_forge' => { 'id' => 'm_forge', 'folder' => 'sent', 'landed' => true,
                                                    'targetId' => 'phished', 'link' => { 'kitId' => 'kit_portal' } } }
      }, as: :json
      assert_equal({}, secrets, 'the forged client globals no longer serve the secret')
      refute @game.reload.player_state.dig('seCaptures', 'phished', 'proven'), 'the capture stays unproven'
      assert_empty @game.player_state['seLandingPages'] || {}, 'no build store is written from a sync'
      assert_empty @game.player_state['sePhishSends'] || {}, 'no send store is written from a sync'
    end

    # A convincing server-built page whose kit's page has no landed send in sePhishSends withholds
    # the secret (plan section 14, chunk C tests; hostile case 2 second half, case 3).
    test 'chunk C: a convincing page with no landed send withholds the secret' do
      build_game(phish_scenario)
      seed_phish_stores(landed: false)
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 }
      } } }, as: :json
      assert_equal({}, secrets, 'a page built but with no landed send does not serve the secret')
    end

    # The two server stores stamp the capture proven on the bootstrap and the proven entry survives
    # the stores later going away (part 2 evidence only ever withholds, never retracts).
    test 'chunk C: the server stores stamp proven on bootstrap and the proven entry survives the stores going away' do
      build_game(phish_scenario)
      # Claim the capture with no server evidence yet: recorded unproven, withheld.
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 }
      } } }, as: :json
      assert_equal({}, secrets, 'no server evidence yet, so no secret')
      refute @game.reload.player_state.dig('seCaptures', 'phished', 'proven'), 'stored unproven'

      # The two routes record the build and a landed send; the next bootstrap stamps the capture.
      seed_phish_stores
      get game_path('scenario'), as: :json
      assert_response :success
      assert_equal true, @game.reload.player_state.dig('seCaptures', 'phished', 'proven'), 'stamped proven on the bootstrap'
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets, 'served once the server evidence holds')

      # Clear the server stores: the stamped entry stays served.
      @game.reload
      @game.player_state['seLandingPages'] = {}
      @game.player_state['sePhishSends'] = {}
      @game.save!
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets, 'a proven entry is never withdrawn')
    end

    # 6b: an entry recorded under 6a (stored proven: true) keeps its secret when the reader ships,
    # even with no server stores at all.
    test 'chunk C: a grandfathered proven entry is served with no server evidence' do
      build_game(phish_scenario, 'seCaptures' => {
        'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'p@x.example', 'at' => 1, 'proven' => true }
      })
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets)
    end

    # A stale-but-recent request still records the capture (a capture is grow-only and recorded on a
    # stale request too), and serving reads the live server stores, so the secret is served off the
    # routes' records whatever the sync's staleness.
    test 'chunk C: a stale-but-recent request records the capture and serves it off the server stores' do
      build_game(phish_scenario)
      seed_phish_stores
      # Prime a non-empty ring so clientTs 25 is stale-but-recent (at or above the oldest retained
      # entry, 20). Neither primed key is claimed by this request, so it is not whole-skipped.
      put game_path('sync_state'), params: { clientTs: 20, globalVariables: { 'anchor' => 1 } }, as: :json
      put game_path('sync_state'), params: { clientTs: 30, globalVariables: { 'anchor2' => 1 } }, as: :json
      put game_path('sync_state'), params: {
        clientTs: 25,
        globalVariables: { 'se_captures' => { 'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'at' => 1 } } }
      }, as: :json
      assert_equal true, JSON.parse(response.body)['stale'], 'the request is stale-but-recent'
      assert @game.reload.player_state.dig('seCaptures', 'phished'), 'the capture is recorded'
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets,
                   'the server stores hold, so the secret is served')
    end

    # Without the server stores a recorded capture is withheld; once the routes populate the stores
    # a later sync serves it.
    test 'chunk C: a capture recorded before the server stores exist is served once they are populated' do
      build_game(phish_scenario)
      put game_path('sync_state'), params: { clientTs: 50, globalVariables: {
        'se_captures' => { 'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'at' => 1 } }
      } }, as: :json
      assert @game.reload.player_state.dig('seCaptures', 'phished'), 'the capture is recorded'
      assert_equal({}, secrets, 'no server stores yet, so the secret is withheld')

      seed_phish_stores
      put game_path('sync_state'), params: { clientTs: 101, globalVariables: { 'poke' => 1 } }, as: :json
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets, 'the populated server stores serve it')
    end

    # Minor 2 (review R1): pin the plain-sync fast path. apply_capture_sync_step returns before
    # stored_scenario_data when the request carries no capture and no legacy se_captures global
    # (games_controller.rb:948), so a plain sync loads no scenario; a capture-bearing sync must load
    # one to record the capture. count_scenario_loads counts the full scenario_data column loads.
    test 'chunk C: a plain sync with no capture and no legacy global loads no scenario, a capture-bearing one does' do
      build_game(phish_scenario)
      # Prime the sync ring so later syncs are not the first (keeps the two counts comparable).
      put game_path('sync_state'), params: { currentRoom: 'office', globalVariables: { 'poke' => 1 } }, as: :json
      assert_response :success

      plain_loads = count_scenario_loads do
        put game_path('sync_state'), params: { currentRoom: 'office', globalVariables: { 'poke2' => 1 } }, as: :json
        assert_response :success
      end
      assert_equal 0, plain_loads, 'a plain sync skips the scenario load'

      capture_loads = count_scenario_loads do
        put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
          'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'at' => 1 }
        } } }, as: :json
        assert_response :success
      end
      assert_operator capture_loads, :>, 0, 'a capture-bearing sync loads the scenario to record it'
    end

    # m4 (code review R1): phishTargets as a map, and a page with no capture block.
    test 'phishTargets as a map is read as the mail bridge reads it, and every target is declared' do
      data = { 'social' => { 'phishTargets' => { 'a' => { 'id' => 'tgt_a' }, 'b' => { 'id' => 'tgt_b', 'foothold' => {} } },
                             'landingPages' => [{ 'id' => 'portal' }] } }
      assert_equal %w[tgt_a tgt_b], CaptureModel.phish_target_ids(data)
      assert_includes CaptureModel.declared_target_ids(data), 'tgt_a'
      data['social']['phishTargets'] = [{ 'id' => 'tgt_c' }, 'junk', { 'id' => '' }]
      assert_equal %w[tgt_c], CaptureModel.phish_target_ids(data)
    end

    test 'a phish credential under a page with no capture block is answered by the account pass' do
      scenario = CP.scenario
      scenario['social']['landingPages'] = [{ 'id' => 'portal' }]
      scenario['social']['phishTargets'] = { 'opal_target' => { 'id' => 'opal_target', 'address' => CP::USERNAMES['opal'] } }
      # The honest route to this phish credential is a link kit landing on the page (6a records
      # the scenario's own fields); the page carries no capture, so the target's own address is used.
      scenario['social']['mailClient'] = { 'payloadKit' => [{ 'id' => 'kit_portal', 'kind' => 'link', 'landingPageId' => 'portal' }] }
      build_game(scenario)
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'opal_target' => { 'targetId' => 'opal_target', 'kind' => 'credential', 'address' => CP::USERNAMES['opal'], 'at' => 1 }
      } } }, as: :json
      assert_equal({ 'opal_target' => CP::PASSWORDS['opal'] }, secrets)
    end

    # m7 (code review R1): the client consumes an item only inside triggerOnInteract.
    test 'a consumesItem object with no triggerOnInteract takes no plant' do
      item = { 'id' => 'kit_logger', 'type' => 'usb' }
      refute CaptureModel.object_takes_item?({ 'id' => 'd', 'requiresItem' => 'kit_logger', 'consumesItem' => true }, item)
      assert CaptureModel.object_takes_item?({ 'id' => 'd', 'requiresItem' => 'kit_logger', 'consumesItem' => true,
                                               'triggerOnInteract' => [] }, item)

      scenario = CP.scenario
      scenario['rooms']['office']['objects'] << { 'id' => 'bare_desk', 'type' => 'pc', 'name' => 'Bare desk',
                                                  'requiresItem' => 'kit_logger', 'consumesItem' => true }
      build_game(scenario)
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      remove('kit_logger', 'bare_desk')
      assert_equal [], planted
    end

    test 'a stored grant contents are in neither the bootstrap nor the inventory answer' do
      scenario = CP.scenario
      scenario['timers'] = [{ 'id' => 'grant', 'afterMs' => 1000, 'actions' => [{ 'type' => 'give_item', 'item' => {
        'id' => 'session_item', 'type' => 'pc', 'name' => 'Remote session', 'storeIn' => 'capture_log',
        'contents' => [{ 'type' => 'text_file', 'name' => 'secret.txt', 'text' => 'GRANT-CONTENTS-MARKER-77' }]
      } }] }]
      build_game(scenario)
      get game_path('scenario'), as: :json
      refute_includes response.body, 'GRANT-CONTENTS-MARKER-77'
      take('session_item', 'pc', 'Remote session')
      assert_response :success, response.body
      refute_includes response.body, 'GRANT-CONTENTS-MARKER-77'
    end

    test 'an older game row with no holder and no proof keys loads' do
      build_game(CP.scenario_without_proofs)
      state = @game.player_state.except('plantedItems', 'droppedItems')
      @game.update_columns(player_state: state)
      get game_path('scenario'), as: :json
      assert_response :success
      remove('kit_box', 'box_port')
      assert_equal [{ 'item' => 'kit_box', 'on' => 'box_port' }], planted
    end

    # ---- networks: accounts and the jack proof ------------------------------------

    def network_scenario_with_proof(proof)
      scenario = NetworkModelScenario.scenario
      lena = scenario['rooms']['lobby']['npcs'].find { |n| n['id'] == 'lena' }
      lena['usePayload']['targetId'] = 'lena'
      lena['captureProof'] = [proof]
      scenario
    end

    def network_forge
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox', 'at' => 1 }
      } } }, as: :json
      assert_response :success
    end

    test 'in a network scenario that declares proofs, an account is absent from secrets and accounts until its proof holds' do
      build_network_game({}, network_scenario_with_proof({ 'planted' => 'kit_dropbox', 'on' => 'comms_port' }))
      network_forge
      get game_path('capture_secrets'), as: :json
      assert_equal({}, response.parsed_body['secrets'])
      assert_equal({}, response.parsed_body['accounts'])

      # A planted proof on a jack holds through gainedFootholds (9.3's own plant route).
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
      get game_path('capture_secrets'), as: :json
      assert_equal({ 'lena' => NetworkModelScenario::LENA_PASSWORD }, response.parsed_body['secrets'])
      assert_equal({ 'lena' => 'lfox' }, response.parsed_body['accounts'])
    end

    # m1 (code review R1, probe P1): accounts skips an undeclared target id, as secrets does.
    test 'in a network scenario, accounts skips a target id no capture route declares' do
      scenario = NetworkModelScenario.scenario
      scenario['rooms']['lobby']['npcs'].find { |n| n['id'] == 'lena' }['usePayload']['targetId'] = 'lena'
      build_network_game({}, scenario)
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'zzz_undeclared' => { 'targetId' => 'zzz_undeclared', 'kind' => 'credential', 'address' => 'lfox', 'at' => 1 }
      } } }, as: :json
      assert_response :success
      get game_path('capture_secrets'), as: :json
      assert_equal({}, response.parsed_body['secrets'])
      assert_equal({}, response.parsed_body['accounts'])

      network_forge
      get game_path('capture_secrets'), as: :json
      assert_equal({ 'lena' => 'lfox' }, response.parsed_body['accounts'], 'a declared id still answers')
    end
  end
end
