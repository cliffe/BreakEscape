# frozen_string_literal: true

require_relative 'helpdesk_route_scenario'

# S8b unit 18: the helpdesk route scenario with the sign-in PCs behind a second step, for the route
# tests of the own forms. Sam signs in at `sam_pc` behind a gate of the chosen kind.
module HelpdeskReenrolScenario
  HS = HelpdeskRouteScenario
  EVENTS = (HS::EVENTS + %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent
                            mfa_prompt_approved mfa_prompt_denied signin_ok signin_refused]).freeze
  FOB = { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam' }.freeze
  PHONE = { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam' }.freeze
  JAKE_FOB = { 'id' => 'jake_fob', 'type' => 'code_device', 'name' => 'Jake fob', 'owner' => 'jake' }.freeze
  RESET_SAM = { 'accountResets' => { 'sam' => { 'mfa' => true } } }.freeze

  module_function

  def scenario(kind: 'code')
    data = HS.scenario
    data['logSources'] = { 'desk' => { 'title' => 'Desk', 'events' => EVENTS } }
    data['policies']['gate'] = { 'remote' => 'allowed', 'maxAttempts' => 50 }
    data['policies']['gate']['mfa'] = kind if kind
    objects = data['rooms']['desk_room']['objects']
    objects.find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
    lobby = data['rooms']['lobby']['objects']
    if kind.nil?
      # no second step: nothing more to add
    elsif kind == 'code'
      lobby << FOB.merge('takeable' => true) << JAKE_FOB.merge('takeable' => true)
    else
      lobby << PHONE.merge('takeable' => true)
      data['rooms'].each_value do |r|
        Array(r['npcs']).each { |n| n['habits'] = { 'approvesPrompts' => 'never' } if n['id'] == 'sam' }
      end
    end
    data
  end

  # A saved connection for sam at sam_pc (the keyring's answer to a typed-password reset) held at the start
  def with_saved_connection(data)
    data['rooms']['lobby']['objects'] << { 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp',
                                           'takeable' => true, 'credential' => 'sam_gate_rdp', 'text' => 'Saved.' }
    data['credentials']['sam_gate_rdp'] = { 'kind' => 'saved_connection', 'account' => 'sam', 'connectsTo' => 'sam_pc',
                                            'proof' => { 'held' => 'sam_gate_file' } }
    data
  end

  SAVED_FILE = { 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp',
                 'credential' => 'sam_gate_rdp' }.freeze

  def held(item)
    { 'scenarioData' => item.dup, 'id' => item['id'], 'type' => item['type'], 'owner' => item['owner'] }
  end
end
