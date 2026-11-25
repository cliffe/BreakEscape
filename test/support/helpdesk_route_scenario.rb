# frozen_string_literal: true

require_relative 'keyring_login_scenario'

# S8b unit 13: the pivot scenario with a service desk (Ria) and two accounts a desk can reset, for
# the helpdesk route tests. Shared by the two controller test files of the route.
module HelpdeskRouteScenario
  KS = KeyringLoginScenario
  SAM_RESET = 'Tern-Harbour-41'
  RIGHT_SAM = { 'staff_no' => 'A-1042', 'manager' => 'Dana Pryce' }.freeze
  WRONG = { 'staff_no' => 'nope', 'manager' => 'nobody' }.freeze
  EVENTS = %w[helpdesk_request account_password_reset account_mfa_reenrolled signin_fail signin_lockout].freeze

  module_function

  def desk(overrides = {})
    { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no manager], 'minCorrect' => 2,
      'maxTries' => 3, 'resets' => %w[password mfa],
      'questionLabels' => { 'staff_no' => 'Staff number', 'manager' => 'Line manager' } }.merge(overrides)
  end

  def scenario(desk_overrides = {})
    data = KS.scenario
    data['logSources'] = { 'desk' => { 'title' => 'Desk', 'events' => EVENTS } }
    data['helpdesks'] = { 'it_desk' => desk(desk_overrides) }
    npcs = data['rooms']['lobby']['npcs']
    npcs << { 'id' => 'ria', 'displayName' => 'Ria Desk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 } }
    npcs.find { |n| n['id'] == 'sam' }['creds'].merge!(
      'resetPassword' => SAM_RESET, 'recovery' => RIGHT_SAM.dup
    )
    data
  end
end
