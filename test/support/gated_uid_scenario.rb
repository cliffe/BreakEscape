# A hand-written scenario for the UID-only after-promotion tests
# (GATED_DOOR_SERVER_CHECK_PLAN.md test 11b, carried from Chunk A to Chunk E).
# Build games from it with create_access_game (test_helper.rb) so the access loader runs.
#
# Shape: a split gated room (secure_area) reached either by the NPC route + a worn hi-vis
# (viaPass) or by a cloned door badge (viaCredential). Inside the route room sit two
# rfid-locked safes keyed to the exec role:
#   - uid_safe:    acceptsUIDOnly true, so an honest UID-only copy of the exec's DESFire
#                  card opens it once the room is promoted.
#   - strict_safe: no acceptsUIDOnly, so the same UID-only copy is refused and (only after
#                  promotion) the controller answers reason uid_only.
# The exec NPC carries a MIFARE_DESFire card, so a copy of it is recorded UID-only.
module GatedUidScenario
  module_function

  EXEC_CARD = { 'name' => 'Executive card', 'card_id' => 'EXEC-DF-01', 'rfid_protocol' => 'MIFARE_DESFire' }.freeze
  EXEC_CARD_ID = EXEC_CARD['card_id']
  CLONER = { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }.freeze
  VEST = { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis',
           'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }.freeze

  def gate
    { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready',
      'creditOnPass' => {
        'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
        'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
      } }
  end

  def scenario
    {
      'startRoom' => 'lobby',
      'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false,
                             'kp_records_cloned' => false },
      'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
      'objectives' => [
        { 'aimId' => 'a1', 'title' => 'Get in', 'tasks' => [
          { 'taskId' => 'tailgate_in', 'title' => 'Past the door', 'type' => 'manual', 'status' => 'active' }
        ] }
      ],
      'rooms' => {
        'lobby' => {
          'type' => 'room_office',
          'connections' => { 'north' => 'secure_area' },
          'doors' => [{ 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                        'gate' => gate }],
          'objects' => [
            CLONER.dup,
            VEST.merge('takeable' => true)
          ],
          'npcs' => [
            { 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
              'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] },
            { 'id' => 'exec', 'displayName' => 'Morgan Hale', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 3 },
              'role' => 'exec', 'creds' => { 'card' => EXEC_CARD.dup } }
          ]
        },
        'secure_area' => {
          'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
          'objects' => [
            { 'type' => 'safe', 'id' => 'uid_safe', 'name' => 'UID safe',
              'locked' => true, 'lockType' => 'rfid', 'access' => { 'roles' => ['exec'] },
              'acceptsUIDOnly' => true,
              'contents' => [{ 'type' => 'notes', 'id' => 'uid_file', 'name' => 'UID file', 'takeable' => true }] },
            { 'type' => 'safe', 'id' => 'strict_safe', 'name' => 'Strict safe',
              'locked' => true, 'lockType' => 'rfid', 'access' => { 'roles' => ['exec'] },
              'contents' => [{ 'type' => 'notes', 'id' => 'strict_file', 'name' => 'Strict file', 'takeable' => true }] }
          ]
        }
      }
    }
  end

  # A recorded UID-only copy of the exec card, the shape POST /clone_card writes for a
  # MIFARE_DESFire source.
  def uid_clone_state
    { 'EXEC-DF-01' => { 'source' => { 'npc' => 'exec' }, 'uidOnly' => true } }
  end
end
