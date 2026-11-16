# frozen_string_literal: true

require_relative 'network_model_scenario'

# Keyring K2 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 7.3): the pivot fixture with a
# credentials registry. Jake (finance, an account holder) owns jake_pc on office_lan and holds
# an assist code in itemsHeld; Lena's .rdp lies loose in the lobby; the ops .rdp (Ian at
# sv_fs02, the plan's ops_pc on server_net) sits in an open crate; records_pc's policy refuses
# saved connections; Sam's .rdp for lena_pc names an account lena_pc's access list refuses.
module KeyringLoginScenario
  NS = NetworkModelScenario
  JAKE_PASSWORD = 'Brooks-Desk-6630'.freeze
  END_GLOBAL = 'jake_ended_assist'.freeze
  JAKE_OFF_GLOBAL = 'jake_pc_off'.freeze
  OFFICE = 'jack_comms_port'.freeze

  module_function

  def scenario
    data = NS.with_pivot
    lobby = data['rooms']['lobby']
    lobby['npcs'] << {
      'id' => 'jake', 'displayName' => 'Jake Brooks', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 2 },
      'role' => 'finance', 'creds' => { 'username' => 'jbrooks', 'password' => JAKE_PASSWORD },
      'needs' => { 'coffee' => { 'decayPerMin' => 1, 'urgentAt' => 50 } },
      'itemsHeld' => [{ 'id' => 'jake_assist_code', 'type' => 'text_file', 'name' => 'Remote assist code',
                        'takeable' => true, 'credential' => 'jake_assist', 'text' => 'Assist code.' }]
    }
    lobby['objects'] << { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp',
                          'takeable' => true, 'credential' => 'lena_rdp', 'text' => 'Saved connection.' }
    lobby['objects'] << { 'id' => 'records_rdp_file', 'type' => 'text_file', 'name' => 'HB-REC-01.rdp',
                          'takeable' => true, 'credential' => 'records_rdp', 'text' => 'Saved connection.' }
    lobby['objects'] << { 'id' => 'sam_fin_rdp_file', 'type' => 'text_file', 'name' => 'Sam-FIN.rdp',
                          'takeable' => true, 'credential' => 'sam_fin_rdp', 'text' => 'Saved connection.' }
    lobby['objects'] << { 'id' => 'ops_crate', 'type' => 'safe', 'name' => 'Ops crate', 'locked' => false,
                          'contents' => [{ 'id' => 'ops_rdp_file', 'type' => 'text_file', 'name' => 'SV-FS02.rdp',
                                           'takeable' => true, 'credential' => 'ops_rdp', 'text' => 'Saved connection.' }] }
    data['rooms']['desk_room']['objects'] << {
      'id' => 'jake_pc', 'type' => 'pc', 'name' => "Jake's PC", 'host' => 'HB-DESK-02', 'network' => 'office_lan',
      'locked' => true, 'lockType' => 'login', 'access' => { 'people' => ['jake'] }, 'owner' => 'jake',
      'locksScreenOnLeave' => false, 'offWhen' => JAKE_OFF_GLOBAL,
      'contents' => [{ 'id' => 'jake_notes', 'type' => 'text_file', 'name' => 'jake_notes.txt', 'takeable' => false,
                       'text' => 'notes' }]
    }
    data['rooms']['desk_room']['objects'] << {
      'id' => 'records_pc', 'type' => 'pc', 'name' => 'Records PC', 'host' => 'HB-REC-01', 'network' => 'office_lan',
      'locked' => true, 'lockType' => 'login', 'policy' => 'password_only'
    }
    data['policies']['password_only'] = { 'accepts' => ['password'], 'remote' => 'allowed' }
    data['globalVariables'] = (data['globalVariables'] || {}).merge(END_GLOBAL => false, JAKE_OFF_GLOBAL => false)
    data['credentials'] = {
      'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                      'proof' => { 'held' => 'lena_rdp_file' } },
      'ops_rdp' => { 'kind' => 'saved_connection', 'account' => 'ian', 'connectsTo' => 'sv_fs02',
                     'proof' => { 'held' => 'ops_rdp_file' } },
      'records_rdp' => { 'kind' => 'saved_connection', 'account' => 'sam', 'connectsTo' => 'records_pc',
                         'proof' => { 'held' => 'records_rdp_file' } },
      'sam_fin_rdp' => { 'kind' => 'saved_connection', 'account' => 'sam', 'connectsTo' => 'lena_pc',
                         'proof' => { 'held' => 'sam_fin_rdp_file' } },
      'jake_assist' => { 'kind' => 'assist_invite', 'account' => 'jake', 'connectsTo' => 'jake_pc',
                         'proof' => { 'held' => 'jake_assist_code' }, 'endsOnGlobal' => END_GLOBAL },
      'jake_pw_note' => { 'kind' => 'password', 'account' => 'jake', 'proof' => { 'session' => 'lena_pc' },
                          'foundIn' => 'lena_local' }
    }
    data
  end

  # A stored, server-stamped inventory entry for a credential item, as a genuine take leaves it.
  def held(id)
    item = find_item(scenario, id)
    raise ArgumentError, "no item #{id}" unless item

    item.slice('id', 'type', 'name', 'credential')
  end

  def find_item(node, id)
    case node
    when Hash
      return node if node['id'] == id && node['type'].is_a?(String) && node.key?('name')

      node.each_value do |v|
        found = find_item(v, id)
        return found if found
      end
    when Array
      node.each do |v|
        found = find_item(v, id)
        return found if found
      end
    end
    nil
  end

  # A jack foothold on office_lan, as a plant at comms_port records it.
  def office_foothold
    { OFFICE => { 'via' => 'jack', 'network' => 'office_lan', 'source' => 'comms_port', 'seq' => 1 } }
  end
end
