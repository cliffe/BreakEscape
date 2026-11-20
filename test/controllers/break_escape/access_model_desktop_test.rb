require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 3 (ACCESS_MODEL_PLAN.md sections 5.1, 5.3 and 6): what a sign-in
  # session opens. GET /container for a sign-in PC and a folder in a profile, POST
  # /unlock check 1, and Copy and Move through POST /inventory with source_pc_id.
  class AccessModelDesktopTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    JAKE_PASSWORD = AccessModelScenario::JAKE_PASSWORD
    DANA_PASSWORD = AccessModelScenario::DANA_PASSWORD

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessModelScenario.routes_scenario,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance],
                        'encounteredNPCs' => %w[jake dana] }.merge(player_state)
      )
    end

    def login(username = 'jbrooks', password = JAKE_PASSWORD, pc_id: 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, username: username, password: password }, as: :json
      assert_response :success, response.body
    end

    def logout(pc_id = 'jake_pc')
      post logout_game_url(@game), params: { pc_id: pc_id }, as: :json
    end

    def container(id)
      get "/break_escape/games/#{@game.id}/container/#{id}", as: :json
      response.parsed_body
    end

    def desktop_ids(pc_id = 'jake_pc')
      body = container(pc_id)
      assert_response :success, body.inspect
      body['contents'].map { |c| c['id'] }
    end

    def unlock_object(id, method, attempt = nil)
      post unlock_game_url(@game), params: { targetType: 'object', targetId: id, method: method, attempt: attempt }, as: :json
      response.parsed_body
    end

    def add(item_id, name, transfer: nil, pc_id: 'jake_pc', type: 'text_file')
      params = { action_type: 'add', item: { type: type, id: item_id, name: name } }
      params[:source_pc_id] = pc_id if pc_id
      params[:transfer] = transfer if transfer
      post inventory_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def held?(item_id)
      @game.reload.player_state['inventory'].any? { |i| i['id'] == item_id }
    end

    # ---- GET /container ---------------------------------------------------------------

    test 'a sign-in desktop serves the PC contents, then role profiles, then personal ones' do
      build
      login
      assert_equal %w[jake_local jake_notes staff_handbook jake_budget jake_archive jake_payroll], desktop_ids
      archive = container('jake_pc')['contents'].find { |c| c['id'] == 'jake_archive' }
      assert_equal true, archive['locked']
      refute archive.key?('contents'), 'a locked folder keeps its contents on the server'
      refute archive.key?('requires')
    end

    test 'a sign-in desktop is refused without a session, even with the PC in unlockedObjects' do
      build('unlockedObjects' => ['jake_pc'])
      container('jake_pc')
      assert_response :forbidden
    end

    test 'a sign-in desktop is refused when its room is not reachable' do
      build('unlockedRooms' => ['lobby'], 'sessions' => { 'jake_pc' => { 'id' => 'jake', 'via' => 'password' } })
      container('jake_pc')
      assert_response :forbidden
    end

    # ---- POST /unlock check 1 ---------------------------------------------------------

    test '/unlock refuses a sign-in PC for every method, even when listed as unlocked' do
      build('unlockedObjects' => ['jake_pc'], 'flag_rewards_claimed' => ['anything'])
      login
      { 'unlocked' => nil, 'npc' => 'jake', 'flag_reward' => nil, 'password' => JAKE_PASSWORD, 'login' => nil }.each do |method, attempt|
        body = unlock_object('jake_pc', method, attempt)
        assert_response :unprocessable_entity, method
        assert_equal false, body['success'], method
      end
    end

    test 'a locked archive in a profile opens only while signed in' do
      build
      unlock_object('jake_archive', 'password', 'zip-pass')
      assert_response :unprocessable_entity
      container('jake_archive')
      assert_response :forbidden

      login
      container('jake_archive')
      assert_response :forbidden # signed in, but still locked
      body = unlock_object('jake_archive', 'password', 'zip-pass')
      assert_response :success, body.inspect
      assert_equal %w[jake_inner], body['contents'].map { |c| c['id'] }
      assert_equal %w[jake_inner], container('jake_archive')['contents'].map { |c| c['id'] }

      logout
      unlock_object('jake_archive', 'password', 'zip-pass')
      assert_response :unprocessable_entity
      container('jake_archive')
      assert_response :forbidden
    end

    test 'a refused scoped target gets no letter-case hint' do
      build
      body = unlock_object('jake_archive', 'password', 'ZIP-PASS')
      assert_response :unprocessable_entity
      refute body.key?('caseMismatch')
    end

    test 'a profile folder is refused to a session whose identity the profile does not admit' do
      build('unlockedObjects' => ['jake_archive'])
      login('dwhite', DANA_PASSWORD)
      container('jake_archive')
      assert_response :forbidden
    end

    # ---- POST /inventory with source_pc_id ---------------------------------------------

    test 'Copy of a profile file keeps it on the desktop; Move of a PC-local file removes it' do
      build
      login
      add('jake_budget', 'Q3 budget.xlsx', transfer: 'copy')
      assert_response :success, response.body
      assert held?('jake_budget')
      assert_equal ['jake_budget'], @game.player_state['copiedItems']

      add('jake_notes', 'Notes.txt', transfer: 'move')
      assert_response :success, response.body
      assert held?('jake_notes')
      refute_includes @game.reload.player_state['copiedItems'], 'jake_notes'

      ids = desktop_ids
      assert_includes ids, 'jake_budget'
      refute_includes ids, 'jake_notes'
    end

    test 'Move of a profile file and Copy of a PC-local file' do
      build
      login
      add('jake_budget', 'Q3 budget.xlsx', transfer: 'move')
      assert_response :success
      add('jake_notes', 'Notes.txt', transfer: 'copy')
      assert_response :success
      ids = desktop_ids
      refute_includes ids, 'jake_budget'
      assert_includes ids, 'jake_notes'
      # A moved profile file is gone from the profile on every PC
      login(pc_id: 'profile_pc')
      refute_includes desktop_ids('profile_pc'), 'jake_budget'
    end

    test 'Copy and Move are refused signed out' do
      build
      %w[copy move].each do |transfer|
        add('jake_budget', 'Q3 budget.xlsx', transfer: transfer)
        assert_response :unprocessable_entity, transfer
        add('jake_notes', 'Notes.txt', transfer: transfer)
        assert_response :unprocessable_entity, transfer
      end
      refute held?('jake_budget')
      refute held?('jake_notes')
    end

    test 'Move is refused where transfer is copy' do
      build
      login
      add('jake_payroll', 'Payroll.csv', transfer: 'move')
      assert_response :unprocessable_entity
      add('jake_payroll', 'Payroll.csv', transfer: 'copy')
      assert_response :success
    end

    test 'a file inside a locked archive in a profile is refused until the archive is unlocked' do
      build
      login
      add('jake_inner', 'Inner.txt', transfer: 'move')
      assert_response :unprocessable_entity
      unlock_object('jake_archive', 'password', 'zip-pass')
      assert_response :success
      add('jake_inner', 'Inner.txt', transfer: 'move')
      assert_response :success, response.body
    end

    test 'a profile file is refused through a session whose identity it does not admit' do
      build
      login('dwhite', DANA_PASSWORD)
      add('jake_budget', 'Q3 budget.xlsx', transfer: 'copy')
      assert_response :unprocessable_entity
      add('staff_handbook', 'Staff handbook.pdf', transfer: 'copy')
      assert_response :unprocessable_entity # admitted, but not takeable
    end

    test 'without source_pc_id a sign-in PC file or a profile file is not found' do
      build
      login
      add('jake_notes', 'Notes.txt', pc_id: nil)
      assert_response :unprocessable_entity
      add('jake_budget', 'Q3 budget.xlsx', pc_id: nil)
      assert_response :unprocessable_entity
      refute held?('jake_notes')
    end
  end
end
