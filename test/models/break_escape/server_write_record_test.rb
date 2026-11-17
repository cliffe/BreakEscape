require 'test_helper'

module BreakEscape
  # The per-request record of server writes (tailgate sync): which writers note into it, the
  # client-visibility filter it shares with the bootstrap's savedGlobalVariables, and that it is
  # never stored.
  class ServerWriteRecordTest < ActiveSupport::TestCase
    def scenario
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'emailed_self' => false, 'done_flag' => false, 'set_on_task' => false },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Aim', 'tasks' => [
            { 'taskId' => 'client_task', 'title' => 'Client task', 'type' => 'custom', 'status' => 'active',
              'onComplete' => { 'setGlobal' => { 'set_on_task' => true } } }
          ] }
        ],
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'objects' => [] } }
      }
    end

    def game
      @game ||= create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }
      )
    end

    test 'write_server_globals! records what it wrote and the answer reads the stored values' do
      game.send(:write_server_globals!, { 'done_flag' => true })
      body = game.add_server_writes_to_answer!({})
      assert_equal({ 'done_flag' => true }, body[:serverGlobals])
      refute body.key?(:serverCompletedTasks)
    end

    test 'a server-owned global is never sent, by the bootstrap rule' do
      game.player_state['globalVariables'] = { 'se_captures' => { 'x' => 1 }, 'done_flag' => true }
      game.record_server_global_writes(%w[se_captures done_flag])
      body = game.add_server_writes_to_answer!({})
      assert_equal({ 'done_flag' => true }, body[:serverGlobals])
      refute game.client_visible_global?('se_captures')
      assert_equal({ 'done_flag' => true }, game.client_visible_globals(game.player_state['globalVariables']))
    end

    test 'a recorded name the request then deleted is left out' do
      game.send(:write_server_globals!, { 'done_flag' => true })
      game.player_state['globalVariables'].delete('done_flag')
      refute game.add_server_writes_to_answer!({}).key?(:serverGlobals)
    end

    test 'the NPC frustration writers record their globals' do
      game.send(:set_workaround_global!, { 'setGlobal' => 'done_flag' })
      game.send(:set_usb_habit_global!, { 'id' => 'n', 'habits' => { 'usb' => { 'setGlobal' => 'emailed_self' } } })
      body = game.add_server_writes_to_answer!({})
      assert_equal({ 'done_flag' => true, 'emailed_self' => true }, body[:serverGlobals])
    end

    test 'a trusted completion records the task and its onComplete globals; a client one records only the globals' do
      result = game.complete_task!('client_task', {}, trusted: false)
      assert result[:success], result.inspect
      body = game.add_server_writes_to_answer!({})
      assert_equal({ 'set_on_task' => true }, body[:serverGlobals])
      refute body.key?(:serverCompletedTasks), 'the client asked for this completion, so it already knows'

      other = BreakEscape::Game.find(game.id)
      other.player_state['objectivesState']['tasks'].delete('client_task')
      assert other.complete_task!('client_task', {}, trusted: true)[:success]
      assert_equal ['client_task'], other.add_server_writes_to_answer!({})[:serverCompletedTasks]
    end

    test 'the record is never stored' do
      game.send(:write_server_globals!, { 'done_flag' => true })
      game.save!
      reloaded = BreakEscape::Game.find(game.id)
      refute reloaded.add_server_writes_to_answer!({}).key?(:serverGlobals)
      refute reloaded.player_state.key?('serverGlobals')
      assert_equal true, reloaded.player_state.dig('globalVariables', 'done_flag')
    end
  end
end
