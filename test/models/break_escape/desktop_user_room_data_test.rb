require 'test_helper'

module BreakEscape
  # q94: a PC's host (computer name) and desktopUser (the signed-in user shown on the unlocked
  # desktop and taskbar) reach the client in the room payload (GET /room via filtered_room_data),
  # on an open PC and on a password-locked one.
  class DesktopUserRoomDataTest < ActiveSupport::TestCase
    setup do
      @scenario_data = {
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => {}, 'locked' => false,
            'objects' => [
              { 'type' => 'pc', 'id' => 'open_pc', 'name' => 'Front Desk PC', 'host' => 'FRONT-WS-01',
                'desktopUser' => { 'name' => 'Sam Lee', 'character' => 'sam_lee' } },
              { 'type' => 'pc', 'id' => 'locked_pc', 'name' => 'Back Office PC', 'host' => 'BACK-WS-02',
                'locked' => true, 'lockType' => 'password', 'requires' => 'secret-answer',
                'desktopUser' => { 'name' => 'Alex Moore' } },
              { 'type' => 'pc', 'id' => 'kiosk', 'name' => 'Kiosk', 'host' => 'KIOSK-01' }
            ]
          }
        }
      }
      @game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario_data: @scenario_data)
      @game.save(validate: false)
    end

    test 'host and desktopUser reach the client through filtered_room_data' do
      objects = @game.filtered_room_data('office')['objects'].index_by { |o| o['id'] }

      assert_equal 'FRONT-WS-01', objects['open_pc']['host']
      assert_equal({ 'name' => 'Sam Lee', 'character' => 'sam_lee' }, objects['open_pc']['desktopUser'])

      assert_equal 'BACK-WS-02', objects['locked_pc']['host']
      assert_equal({ 'name' => 'Alex Moore' }, objects['locked_pc']['desktopUser'])
      assert_nil objects['locked_pc']['requires'], 'the password must still be withheld'

      assert_equal 'KIOSK-01', objects['kiosk']['host']
      assert_not objects['kiosk'].key?('desktopUser')
    end
  end
end
