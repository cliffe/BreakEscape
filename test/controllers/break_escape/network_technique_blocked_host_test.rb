require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 step 11 (OPS_CORE_PLAN.md 5.4 and 11.2): the hostile test for the one changed access
  # check. sam_pc is a host whose policy blocks remote sign-in; every request goes through the real
  # routes and the server's own record decides.
  class NetworkTechniqueBlockedHostTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    NOS = NetworkOpsScenario
    OFFICE = NOS::OFFICE
    SECOND = NOS::SECOND_JACK
    FOLDER = { 'id' => 'sam_folder', 'type' => 'folder', 'name' => 'Archive', 'locked' => false,
               'contents' => [{ 'id' => 'sam_note', 'type' => 'text_file', 'name' => 'note.txt', 'takeable' => false, 'text' => 'FOLDER-NOTE' }] }.freeze

    # The S3 fixture with sam_pc on a policy that blocks remote sign-in, a folder on its desktop,
    # and (optionally) no screen or an off-switch.
    def blocked_scenario(policy: 'hardened', headless: false, off: false, away: false, outage: false)
      data = NOS.techniques_scenario
      # outage: the office network goes down while the global `office_down` is true
      if outage
        data['networks']['office_lan']['offWhen'] = 'office_down'
        data['globalVariables'] = data['globalVariables'].merge('office_down' => false)
      end
      pc = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }
      pc['policy'] = policy if policy
      pc['headless'] = true if headless
      pc['offWhen'] = 'lab_off' if off
      pc['contents'] << FOLDER.deep_dup
      # away: the PC's room is locked and not unlocked, so the player cannot reach the PC on foot
      data['rooms']['desk_room'].merge!('locked' => true, 'lockType' => 'pin', 'requires' => '9090') if away
      data
    end

    # room 'lobby' leaves the player away from sam_pc (its room locked); 'desk_room' puts them beside it.
    def blocked_game(second: false, room: 'lobby', **options)
      away = room == 'lobby'
      rooms = NetworkRequests::OPEN_ROOMS + %w[server_room]
      rooms -= %w[desk_room] if away
      techniques_game(second: second, data: blocked_scenario(away: away, **options), state: { 'currentRoom' => room, 'unlockedRooms' => rooms })
    end

    def state
      Game.find(@game.id).player_state
    end

    def fid(id)
      "sam_pc.web.#{id}"
    end

    def grant!(foothold = OFFICE, finding = 'factory_login')
      ops_technique(foothold, fid(finding), 'card_factory')
      assert_response :success, response.body
    end

    def desktop(foothold: nil, from: nil)
      params = {}
      params[:foothold] = foothold if foothold
      params[:from] = from if from
      get game_path('container/sam_pc'), params: params, as: :json
      response.parsed_body
    end

    def folder(foothold: nil)
      get game_path('container/sam_folder'), params: foothold ? { foothold: foothold } : {}, as: :json
      response.parsed_body
    end

    def assert_refused(reason, status = :forbidden)
      assert_response status, response.body
      assert_equal reason, response.parsed_body['reason']
      refute_includes response.body, 'FOLDER-NOTE'
      refute_includes response.body, 'sam_local'
    end

    def assert_served
      assert_response :success, response.body
    end

    def sam_row(foothold = OFFICE)
      view_hosts(foothold).find { |h| h['id'] == 'sam_pc' }
    end

    def seed_session(record)
      game = Game.find(@game.id)
      game.player_state['sessions'] = (game.player_state['sessions'] || {}).merge('sam_pc' => record)
      game.save!
    end

    # ---- the table of what stays refused -----------------------------------------------------------

    test 'a remote sign-in and the remote account tiles stay refused through any foothold' do
      blocked_game
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['remoteBlocked']
      get game_path('login_accounts'), params: { pc_id: 'sam_pc', foothold: OFFICE }, as: :json
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['remoteBlocked']
      assert_nil state['sessions']&.[]('sam_pc')
    end

    test 'with no session at the PC the desktop and its folder through a foothold answer no_session' do
      blocked_game
      desktop(foothold: OFFICE)
      assert_refused 'no_session'
      folder(foothold: OFFICE)
      assert_response :forbidden
    end

    test 'a password session made at the keyboard is refused through a foothold' do
      blocked_game(room: 'desk_room')
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD)
      assert_response :success, response.body
      assert_equal 'password', state['sessions']['sam_pc']['via']
      desktop(foothold: OFFICE)
      assert_refused 'unreachable'
      folder(foothold: OFFICE)
      assert_response :forbidden
      assert_nil sam_row['session'], 'a blocked host lists no session for a password session'
      assert_equal false, sam_row['remoteSignIn']
    end

    test 'a claim, a credential session and a password session record with a foothold are refused through that foothold' do
      blocked_game
      [{ 'id' => 'sam', 'via' => 'claim' }, { 'id' => 'sam', 'via' => 'credential', 'foothold' => OFFICE, 'credential' => 'print_admin' },
       { 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE }].each do |record|
        seed_session(record)
        desktop(foothold: OFFICE)
        assert_refused 'unreachable'
        folder(foothold: OFFICE)
        assert_response :forbidden
        assert_nil sam_row['session'], record.inspect
      end
    end

    test 'a desktop for a technique session by a from route is refused' do
      blocked_game
      grant!
      desktop(foothold: nil, from: 'lena_pc')
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
    end

    test 'a sync body that writes a technique session is ignored' do
      blocked_game
      put game_path('sync_state'), params: { sessions: { sam_pc: { id: 'sam', via: 'technique', foothold: OFFICE, access: 'user' } },
                                             playerState: { sessions: { sam_pc: { id: 'sam', via: 'technique', foothold: OFFICE } } } }, as: :json
      assert_nil state['sessions']&.[]('sam_pc')
      desktop(foothold: OFFICE)
      assert_refused 'no_session'
    end

    # ---- the technique session: its own foothold and no other ---------------------------------------

    test 'a technique session opens the desktop and its folder through its own foothold only' do
      blocked_game(second: true)
      grant!
      record = state['sessions']['sam_pc']
      assert_equal 'technique', record['via']
      desktop(foothold: OFFICE)
      assert_served
      assert_includes response.body, 'sam_local'
      assert_equal OFFICE, state['sessions']['sam_pc']['foothold'], 'served through the foothold: not settled'
      assert_equal 'FOLDER-NOTE', folder(foothold: OFFICE)['contents'].to_s[/FOLDER-NOTE/]
      assert_served
      # the second held foothold reaches the host too, and is refused for the desktop and the folder
      assert network_view(SECOND)['footholds'].any? { |f| f['id'] == SECOND }
      desktop(foothold: SECOND)
      assert_refused 'unreachable'
      folder(foothold: SECOND)
      assert_response :forbidden
      refute_includes response.body, 'FOLDER-NOTE'
    end

    test 'the view offers an Open only in the foothold the session came through' do
      blocked_game(second: true)
      grant!
      first = sam_row(OFFICE)
      assert_equal false, first['remoteSignIn']
      assert_equal 'technique', first['session']['via']
      assert_equal true, first['session']['openHere']
      assert_equal 'sam', state['sessions']['sam_pc']['id']
      other = sam_row(SECOND)
      assert_equal false, other['remoteSignIn']
      assert_nil other['session']
      assert_nil other['heldAs']
    end

    test 'on a host that allows remote sign-in no row carries openHere and the session is listed everywhere' do
      blocked_game(second: true, policy: nil)
      grant!
      [OFFICE, SECOND].each do |foothold|
        row = sam_row(foothold)
        assert_equal 'technique', row['session']['via'], foothold
        refute row['session'].key?('openHere'), foothold
      end
    end

    test 'an admin technique session carries access admin and openHere on the host row' do
      blocked_game
      grant!
      ops_technique(OFFICE, 'sam_pc.files.step_up', 'card_factory')
      assert_response :success, response.body
      row = sam_row
      assert_equal 'admin', row['session']['access']
      assert_equal true, row['session']['openHere']
    end

    test 'a headless blocked host with a technique session at admin passes desktop_request_allowed? through its own foothold only' do
      blocked_game(second: true, headless: true, room: 'desk_room')
      grant!
      ops_technique(OFFICE, 'sam_pc.files.step_up', 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', state['sessions']['sam_pc']['access']
      game = Game.find(@game.id)
      info = game.find_login_pc('sam_pc')
      assert game.desktop_request_allowed?(info, { foothold: OFFICE })
      refute game.desktop_request_allowed?(info, { foothold: SECOND })
      refute game.desktop_request_allowed?(info, { from: 'lena_pc' })
      refute game.desktop_request_allowed?(info, nil)
      desktop(foothold: OFFICE)
      assert_served
      desktop(foothold: nil)
      assert_response :forbidden
    end

    test 'a typed predicate answers only for a technique record through the named foothold' do
      blocked_game
      game = Game.find(@game.id)
      record = { 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE }
      assert game.technique_session_through?(record, OFFICE)
      refute game.technique_session_through?(record, SECOND)
      refute game.technique_session_through?(record, nil)
      refute game.technique_session_through?(record, '')
      refute game.technique_session_through?(record.merge('via' => 'password'), OFFICE)
      refute game.technique_session_through?(record.merge('via' => 'claim'), OFFICE)
      refute game.technique_session_through?(nil, OFFICE)
      refute game.technique_session_through?('technique', OFFICE)
    end

    # ---- the keyboard rule and folders with no route ------------------------------------------------

    test 'a folder request with no route is refused away from the PC and served beside it' do
      blocked_game(room: 'lobby')
      grant!
      folder
      assert_response :forbidden
      assert_equal 'unreachable', response.parsed_body['reason']
      refute_includes response.body, 'FOLDER-NOTE'
      # the same request naming the foothold is served, from anywhere
      folder(foothold: OFFICE)
      assert_served
      assert_includes response.body, 'FOLDER-NOTE'
      # the player walks to the PC
      game = Game.find(@game.id)
      game.player_state['unlockedRooms'] << 'desk_room'
      game.save!
      folder
      assert_served
      assert_includes response.body, 'FOLDER-NOTE'
    end

    test 'a folder request with no route stays refused beside a headless PC' do
      blocked_game(headless: true, room: 'desk_room')
      grant!
      folder
      assert_response :forbidden
      refute_includes response.body, 'FOLDER-NOTE'
      folder(foothold: OFFICE)
      assert_served
    end

    test 'a no-route desktop beside the PC is served with no password, the record keeps its foothold and an unplug ends it' do
      [true, false].each do |blocked|
        blocked_game(room: 'desk_room', policy: blocked ? 'hardened' : nil)
        grant!
        desktop
        assert_served
        assert_includes response.body, 'sam_local'
        assert_equal OFFICE, state['sessions']['sam_pc']['foothold'], "blocked #{blocked}"
        assert_equal 'technique', state['sessions']['sam_pc']['via']
        unplug('comms_port')
        assert_nil state['sessions']&.[]('sam_pc'), "blocked #{blocked}"
        desktop
        assert_refused 'no_session'
      end
    end

    test 'a no-route desktop away from the PC is refused' do
      blocked_game(room: 'lobby')
      grant!
      desktop
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
    end

    test 'a password session at the keyboard still drops its foothold when served there, as before' do
      blocked_game(room: 'desk_room', policy: nil)
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_equal OFFICE, state['sessions']['sam_pc']['foothold']
      desktop
      assert_served
      assert_nil state['sessions']['sam_pc']['foothold']
    end

    # ---- unplug, host off, outage ---------------------------------------------------------------------

    test 'after the foothold is unplugged the same request answers no_session' do
      blocked_game
      grant!
      desktop(foothold: OFFICE)
      assert_served
      unplug('comms_port')
      assert_nil state['sessions']&.[]('sam_pc')
      desktop(foothold: OFFICE)
      assert_refused 'no_session'
      folder(foothold: OFFICE)
      assert_response :forbidden
    end

    test 'a host that is off answers not_responding to a technique session through its foothold, and works again after' do
      blocked_game(off: true)
      grant!
      set_global('lab_off', true)
      desktop(foothold: OFFICE)
      assert_refused 'not_responding'
      assert_equal 'sam', state['sessions']['sam_pc']['id'], 'the session is kept'
      row = sam_row
      assert_equal false, row['responding']
      assert_equal 'Sam Okafor', row['heldAs']
      assert_nil row['session']
      set_global('lab_off', false)
      desktop(foothold: OFFICE)
      assert_served
    end

    test 'a host that is off answers a password session on a blocked host unreachable, as before' do
      blocked_game(off: true, room: 'desk_room')
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD)
      set_global('lab_off', true)
      desktop(foothold: OFFICE)
      assert_refused 'unreachable'
    end

    test 'a network outage over the route keeps a technique session, refuses it while down and serves it again after' do
      blocked_game(second: true, outage: true)
      grant!
      set_global('office_down', true)
      assert_equal 'technique', state['sessions']['sam_pc']['via'], 'the session is kept'
      desktop(foothold: OFFICE)
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
      folder(foothold: OFFICE)
      assert_response :forbidden
      refute_includes response.body, 'FOLDER-NOTE'
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      set_global('office_down', false)
      desktop(foothold: OFFICE)
      assert_served
      assert_includes response.body, 'sam_local'
      folder(foothold: OFFICE)
      assert_served
      assert_includes response.body, 'FOLDER-NOTE'
    end

    test 'during an outage the host row is in a down block with heldAs in the session\'s own foothold view only' do
      blocked_game(second: true, outage: true)
      grant!
      set_global('office_down', true)
      [OFFICE, SECOND].each do |foothold|
        block = view_blocks(foothold).find { |b| b['route'] == 'down' }
        assert block, "a down block in #{foothold}"
        row = block['hosts'].find { |h| h['id'] == 'sam_pc' }
        assert_nil row['session'], foothold
        assert_nil row['openHere'], foothold
        if foothold == OFFICE
          assert_equal 'Sam Okafor', row['heldAs']
        else
          assert_nil row['heldAs'], 'the second foothold\'s view names no account'
        end
      end
      set_global('office_down', false)
      assert_equal true, sam_row['session']['openHere']
      assert_nil sam_row(SECOND)['session']
    end

    # ---- T1 to T4, T9, T10, T12 (security review R1) -------------------------------------------------

    test 'T1 a host that is off through the other foothold answers unreachable and lists nothing for it' do
      blocked_game(second: true, off: true)
      grant!
      set_global('lab_off', true)
      desktop(foothold: SECOND)
      assert_refused 'unreachable'
      folder(foothold: SECOND)
      assert_response :forbidden
      other = sam_row(SECOND)
      assert_nil other['heldAs']
      assert_nil other['session']
      assert_nil other['openHere']
      # through its own foothold the same host answers not_responding and names the account
      desktop(foothold: OFFICE)
      assert_refused 'not_responding'
      assert_equal 'Sam Okafor', sam_row(OFFICE)['heldAs']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
    end

    test 'T2 a technique record whose foothold is unheld, or an invented foothold named for a real session, is refused' do
      blocked_game
      seed_session({ 'id' => 'sam', 'via' => 'technique', 'foothold' => 'jack_gone', 'access' => 'user' })
      desktop(foothold: 'jack_gone')
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
      folder(foothold: 'jack_gone')
      assert_response :forbidden
      refute_includes response.body, 'FOLDER-NOTE'
      assert_nil sam_row['session'], 'the held foothold lists nothing for a record through another one'
      # a real session, the request naming an id that is no foothold at all
      blocked_game
      grant!
      %w[jack_gone jack_invented sam_pc].each do |invented|
        desktop(foothold: invented)
        assert_response :forbidden, invented
        refute_includes response.body, 'sam_local'
        folder(foothold: invented)
        assert_response :forbidden, invented
        refute_includes response.body, 'FOLDER-NOTE'
      end
      desktop(foothold: OFFICE)
      assert_served
    end

    test 'T3 a technique session replaced by a typed sign-in at the keyboard is a plain password session' do
      blocked_game(room: 'desk_room')
      grant!
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD)
      assert_response :success, response.body
      record = state['sessions']['sam_pc']
      assert_equal 'password', record['via']
      %w[foothold access technique from].each { |key| refute record.key?(key), key }
      desktop(foothold: OFFICE)
      assert_refused 'unreachable'
      folder(foothold: OFFICE)
      assert_response :forbidden
      row = sam_row
      assert_nil row['session']
      assert_nil row['openHere']
      assert_nil row['heldAs']
    end

    test 'T3 reverse: a keyboard password session, then the card, then the foothold opens it' do
      blocked_game(room: 'desk_room')
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD)
      assert_response :success, response.body
      desktop(foothold: OFFICE)
      assert_refused 'unreachable'
      grant!
      record = state['sessions']['sam_pc']
      assert_equal 'technique', record['via']
      assert_equal OFFICE, record['foothold']
      desktop(foothold: OFFICE)
      assert_served
      assert_includes response.body, 'sam_local'
    end

    test 'T4 a relay route at a technique session is refused with no contents' do
      blocked_game
      grant!
      get game_path('container/sam_pc'), params: { relay: '1' }, as: :json
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
      get game_path('container/sam_folder'), params: { relay: '1' }, as: :json
      assert_response :forbidden
      refute_includes response.body, 'FOLDER-NOTE'
      get game_path('container/sam_pc'), params: { relay: '1', foothold: OFFICE }, as: :json
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
      assert_equal 'technique', state['sessions']['sam_pc']['via']
    end

    test 'T9 the predicate refuses a technique record with no foothold, a nil one or an empty one' do
      blocked_game
      game = Game.find(@game.id)
      base = { 'id' => 'sam', 'via' => 'technique' }
      [base, base.merge('foothold' => nil), base.merge('foothold' => ''), base.merge('foothold' => '  ')].each do |record|
        [OFFICE, SECOND, '', nil, '  '].each do |asked|
          refute game.technique_session_through?(record, asked), "#{record.inspect} asked #{asked.inspect}"
        end
      end
      refute game.technique_session_through?(base.merge('foothold' => OFFICE), 'jack_other')
      refute game.technique_session_through?(base.merge('foothold' => OFFICE, 'via' => 'credential'), OFFICE)
      refute game.technique_session_through?(base.merge('foothold' => OFFICE, 'via' => 'Technique'), OFFICE)
    end

    test 'T10 a technique session away from the PC is refused for every odd route parameter' do
      blocked_game(room: 'lobby')
      grant!
      own = CGI.escape(OFFICE)
      odd = ['foothold=', 'foothold=%20', "foothold[]=#{own}", 'foothold[a]=b', 'from', 'relay=0', "foothold=#{own}&from=lena_pc",
             "foothold=#{own}&relay=1", 'from=%20']
      odd.each do |query|
        %w[sam_folder sam_pc].each do |id|
          get "#{game_path("container/#{id}")}?#{query}", as: :json
          # a bare `from` is a malformed parameter: the desktop answers 400 "malformed", the folder 403
          assert_response(query == 'from' && id == 'sam_pc' ? :bad_request : :forbidden, "#{id}?#{query}")
          refute_includes response.body, 'FOLDER-NOTE', "#{id}?#{query}"
          refute_includes response.body, 'sam_local', "#{id}?#{query}"
        end
      end
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      folder(foothold: OFFICE)
      assert_served
    end

    test 'T10 the same array foothold for the desktop of a blocked host is refused beside the PC too' do
      blocked_game(room: 'desk_room', second: true)
      grant!
      get "#{game_path('container/sam_pc')}?foothold[]=#{CGI.escape(OFFICE)}", as: :json
      assert_response :forbidden
      refute_includes response.body, 'sam_local'
      get "#{game_path('container/sam_pc')}?foothold[]=#{CGI.escape(SECOND)}", as: :json
      assert_response :forbidden
    end

    test 'T12 a host scan answers openHere only through the session\'s own foothold' do
      blocked_game(second: true)
      grant!
      ops_scan(OFFICE, host_id: 'sam_pc')
      assert_response :success, response.body
      assert_equal true, response.parsed_body['host']['session']['openHere']
      assert_equal 'technique', response.parsed_body['host']['session']['via']
      ops_scan(SECOND, host_id: 'sam_pc')
      assert_response :success, response.body
      assert_nil response.parsed_body['host']['session']
      assert_nil response.parsed_body['host']['openHere']
      assert_nil response.parsed_body['host']['heldAs']
    end

    # ---- an allowed host behaves as before ---------------------------------------------------------------

    test 'on a host that allows remote sign-in a password session through a foothold opens as ever, and a technique session opens through any held foothold' do
      blocked_game(second: true, policy: nil)
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      desktop(foothold: OFFICE)
      assert_served
      grant!
      desktop(foothold: OFFICE)
      assert_served
      desktop(foothold: SECOND)
      assert_served
    end
  end
end
