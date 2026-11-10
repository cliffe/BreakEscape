# A hand-written scenario for the capture proof tests
# (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md, section 6). Build games from it
# with create_access_game (test_helper.rb) so the loader runs.
#
# - chris: captureProof planted kit_logger on chris_desk (a consumesItem object);
# - mel: the shorthand, a session proof inside her own addCapture (no address);
# - sofia: captureProof dropped kit_qr;
# - ned: the shorthand resolved by the capture's address, a planted kit_box on box_port
#   (a requiresItem object whose confirm runs remove_item);
# - quinn: a capture route, a password that opens a PC, and no proof;
# - opal: a capture route and a password that opens nothing.
# Every sign-in PC has an access list, so a password opens only the PCs named.
module CaptureProofScenario
  PASSWORDS = {
    'chris' => 'Chris-Keys-401', 'mel' => 'Mel-Screen-402', 'sofia' => 'Sofia-Qr-403',
    'ned' => 'Ned-Port-404', 'quinn' => 'Quinn-None-405', 'opal' => 'Opal-Opens-406'
  }.freeze
  USERNAMES = {
    'chris' => 'c.hampshire', 'mel' => 'm.pierce', 'sofia' => 's.lord',
    'ned' => 'n.okafor', 'quinn' => 'q.reed', 'opal' => 'o.shah'
  }.freeze

  module_function

  def npc(id, extra = {})
    { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person', 'position' => { 'x' => 2, 'y' => 2 },
      'creds' => { 'username' => USERNAMES[id], 'password' => PASSWORDS[id] } }.merge(extra)
  end

  def capture(target_id, extra = {})
    { 'targetId' => target_id, 'kind' => 'credential', 'note' => "#{target_id} captured" }.merge(extra)
  end

  def login_pc(id, person, extra = {})
    { 'id' => id, 'type' => 'pc', 'name' => "#{person.capitalize}'s PC", 'locked' => true, 'lockType' => 'login',
      'access' => { 'people' => [person] } }.merge(extra)
  end

  def scenario
    {
      'scenario_brief' => 'Capture proof fixture',
      'startRoom' => 'office',
      'social' => { 'captures' => { 'revealSecret' => true } },
      'startItemsInInventory' => [
        { 'type' => 'usb', 'id' => 'kit_qr', 'name' => 'QR card', 'takeable' => true, 'droppable' => true },
        { 'type' => 'pc', 'id' => 'kit_box', 'name' => 'Drop box', 'takeable' => true }
      ],
      'rooms' => {
        'office' => {
          'type' => 'room_office',
          'connections' => { 'north' => 'vault' },
          'objects' => [
            { 'id' => 'kit_logger', 'type' => 'usb', 'name' => 'Inline keylogger', 'takeable' => true },
            { 'id' => 'chris_desk', 'type' => 'pc', 'name' => "Chris's desk", 'requiresItem' => 'kit_logger',
              'consumesItem' => true,
              'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'logger_planted', 'value' => true }] },
            { 'id' => 'box_port', 'type' => 'pc', 'name' => 'Wall port', 'requiresItem' => 'kit_box',
              'triggerOnInteract' => [{ 'type' => 'confirm_action', 'text' => 'Plant it?',
                                        'onConfirm' => [{ 'type' => 'remove_item', 'item' => 'kit_box' }] }] },
            { 'id' => 'decoy_desk', 'type' => 'pc', 'name' => 'Decoy desk', 'requiresItem' => 'kit_logger',
              'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'decoy', 'value' => true }] },
            { 'id' => 'named_desk', 'type' => 'pc', 'name' => 'chris_desk_by_name', 'requiresItem' => 'kit_logger',
              'consumesItem' => true, 'triggerOnInteract' => [] },
            login_pc('chris_pc', 'chris'),
            login_pc('mel_pc', 'mel', 'screenOwner' => 'mel', 'locksScreenOnLeave' => false),
            login_pc('sofia_pc', 'sofia'),
            login_pc('ned_pc', 'ned'),
            login_pc('quinn_pc', 'quinn')
          ],
          'npcs' => [
            npc('chris', 'eventMappings' => [{ 'eventPattern' => 'global_variable_changed:logger_planted',
                                               'addCapture' => capture('chris', 'address' => USERNAMES['chris']) }],
                         'captureProof' => [{ 'planted' => 'kit_logger', 'on' => 'chris_desk' }]),
            npc('mel', 'needs' => { 'coffee' => { 'decayPerMin' => 1, 'urgentAt' => 50 } },
                       'eventMappings' => [{ 'eventPattern' => 'pc_signed_in:mel_pc',
                                             'addCapture' => capture('mel', 'proof' => { 'session' => 'mel_pc' }) }]),
            npc('sofia', 'eventMappings' => [{ 'eventPattern' => 'item_collected:kit_qr',
                                               'addCapture' => capture('sofia', 'address' => USERNAMES['sofia']) }],
                         'captureProof' => [{ 'dropped' => 'kit_qr' }]),
            npc('quinn', 'eventMappings' => [{ 'eventPattern' => 'never', 'addCapture' => capture('quinn', 'address' => USERNAMES['quinn']) }]),
            npc('opal', 'eventMappings' => [{ 'eventPattern' => 'never', 'addCapture' => capture('opal', 'address' => USERNAMES['opal']) }]),
            npc('ned', 'usePayload' => { 'host' => 'NED-PC' }),
            { 'id' => 'hax', 'displayName' => 'Hax', 'npcType' => 'phone',
              'eventMappings' => [{ 'eventPattern' => 'never',
                                    'addCapture' => capture('ned', 'address' => USERNAMES['ned'],
                                                            'proof' => { 'planted' => 'kit_box', 'on' => 'box_port' }) }] }
          ]
        },
        'vault' => {
          'type' => 'room_office', 'connections' => { 'south' => 'office' },
          'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
          'objects' => [
            { 'id' => 'vault_desk', 'type' => 'pc', 'name' => 'Vault desk', 'requiresItem' => 'kit_logger', 'consumesItem' => true,
              'triggerOnInteract' => [] }
          ]
        }
      }
    }
  end

  # The scenario with every proof taken out: it declares none.
  def scenario_without_proofs
    data = scenario
    data['rooms']['office']['npcs'].each do |npc|
      npc.delete('captureProof')
      Array(npc['eventMappings']).each { |m| m['addCapture']&.delete('proof') }
    end
    data
  end
end
