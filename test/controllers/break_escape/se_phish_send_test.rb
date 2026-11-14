# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # Phish evidence Route 2 (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 3.3, 5, 7, 15).
  # POST se/phish_send records the send the server verified itself: it validates the target and kit
  # against the authored sets and the message fields against the authored accounts and payload kits
  # (hostile-input hygiene), then computes `landed` from its own seLandingPages store under the
  # lighter gate (the kit's page is server-built and server-convincing). The body's `landed` is
  # ignored; no account is resolved and no message judged. Driven through real POST requests.
  class SePhishSendTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CP = CaptureProofScenario

    PAGE = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    )['pages']['signin'].freeze

    CONVINCING = { 'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_word',
                   'logo' => 'crisp', 'wording' => 'w_formal', 'fields' => %w[email password],
                   'padlock' => true }.freeze
    WEAK = { 'brand' => 'ledgerwell', 'purpose' => 'signin', 'domainId' => 'd_letter',
             'logo' => 'blurry', 'wording' => 'w_slips', 'fields' => %w[email password card_number],
             'padlock' => false }.freeze

    # An authored, well-crafted message, and a deliberately weak/mis-addressed one. The server
    # treats both only as bounded input; neither changes `landed` (the guard test).
    GOOD_MESSAGE = { 'fromAccount' => 'guest', 'to' => 's.lord@ledgerwell.example',
                     'headerFrom' => 'portal', 'link' => 'kit_payroll_page',
                     'templates' => { 'subject' => 't_payslip', 'body' => 'b_formal' },
                     'slots' => { 'greeting' => 'g_sofia', 'org' => 'o_ledgerwell' } }.freeze
    WEAK_MESSAGE = { 'fromAccount' => 'guest', 'to' => 's.lord@ledgerwell.example',
                     'headerFrom' => 'freemail', 'link' => 'kit_payroll_page',
                     'templates' => { 'subject' => 't_hey', 'body' => 'b_casual' },
                     'slots' => { 'greeting' => 'g_wrong' } }.freeze

    def se_scenario
      scenario = CP.scenario
      scenario['social'] ||= {}
      scenario['social']['landingPages'] = [PAGE.deep_dup]
      scenario['social']['phishTargets'] = [{ 'id' => 'lord' }, { 'id' => 'pierce' }]
      scenario['social']['mailClient'] = {
        'accounts' => [
          { 'id' => 'guest', 'address' => 'guest@workstation.example', 'kind' => 'given' },
          { 'id' => 'freemail', 'kind' => 'created', 'unlockedBy' => 'acct_freemail' }
        ],
        'payloadKit' => [
          { 'id' => 'kit_cv', 'label' => 'CV.docx', 'kind' => 'document' },
          { 'id' => 'kit_payroll_page', 'label' => 'Payroll portal link', 'kind' => 'link',
            'landingPageId' => 'payroll_login' }
        ]
      }
      scenario
    end

    def build_game(scenario = se_scenario, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }.merge(player_state)
      )
    end

    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    def post_build(choices: CONVINCING, page_id: 'payroll_login', target_id: 'lord')
      post game_path('se/landing_page'),
           params: { pageId: page_id, targetId: target_id, choices: choices }, as: :json
    end

    def post_send(message: GOOD_MESSAGE, target_id: 'lord', kit_id: 'kit_payroll_page')
      post game_path('se/phish_send'),
           params: message.merge('targetId' => target_id, 'kitId' => kit_id), as: :json
    end

    def sends
      @game.reload.player_state['sePhishSends'] || {}
    end

    # ── landed from the built page ────────────────────────────────────────────

    test 'a send after a convincing build lands from the server page verdict' do
      build_game
      post_build(choices: CONVINCING)
      post_send
      assert_response :success, response.body
      assert_equal true, response.parsed_body['success']
      assert_equal true, response.parsed_body['landed']

      entry = sends['lord/kit_payroll_page']
      assert entry, 'the send is stored under targetId/kitId'
      assert_equal true, entry['landed']
      assert_equal 'lord', entry['targetId']
      assert_equal 'kit_payroll_page', entry['kitId']
      assert_equal 'payroll_login', entry['pageId']
    end

    test 'a send over a server-weak page records landed false, not retryable' do
      build_game
      post_build(choices: WEAK)
      post_send
      assert_response :success, response.body
      assert_equal false, response.parsed_body['landed']
      assert_equal 'page_below_threshold', response.parsed_body['reason']
      assert_nil response.parsed_body['retryable']
      assert_equal false, sends['lord/kit_payroll_page']['landed']
    end

    test 'a send before any build records landed false and is retryable' do
      build_game
      post_send
      assert_response :success, response.body
      assert_equal false, response.parsed_body['landed']
      assert_equal 'page_not_built_yet', response.parsed_body['reason']
      assert_equal true, response.parsed_body['retryable']
      assert_equal false, sends['lord/kit_payroll_page']['landed']
    end

    test 'a retryable miss lands on the re-post after the build' do
      build_game
      post_send
      assert_equal true, response.parsed_body['retryable']

      post_build(choices: CONVINCING)
      post_send
      assert_equal true, response.parsed_body['landed']
      assert_equal 1, sends.size, 'the re-post overwrites the earlier miss, it does not add a row'
    end

    # ── refusals and hygiene ──────────────────────────────────────────────────

    test 'an unauthored target is refused invalid and nothing is stored' do
      build_game
      post_build(choices: CONVINCING)
      post_send(target_id: 'stranger')
      assert_response :unprocessable_entity
      assert_equal 'invalid', response.parsed_body['reason']
      assert_empty sends
    end

    test 'a kit that is not an authored link kit is refused invalid' do
      build_game
      post_build(choices: CONVINCING)
      post_send(kit_id: 'kit_cv') # a document kit, not a link kit
      assert_response :unprocessable_entity
      assert_equal 'invalid', response.parsed_body['reason']
      assert_empty sends
    end

    test 'an unknown kit id is refused invalid' do
      build_game
      post_build(choices: CONVINCING)
      post_send(kit_id: 'kit_nonexistent')
      assert_response :unprocessable_entity
      assert_empty sends
    end

    test 'a fromAccount that is not an authored account is refused invalid' do
      build_game
      post_build(choices: CONVINCING)
      post_send(message: GOOD_MESSAGE.merge('fromAccount' => 'attacker_inbox'))
      assert_response :unprocessable_entity
      assert_equal 'invalid', response.parsed_body['reason']
      assert_empty sends
    end

    test 'an unauthored attachment kit is refused invalid' do
      build_game
      post_build(choices: CONVINCING)
      post_send(message: GOOD_MESSAGE.merge('attachment' => 'kit_evil'))
      assert_response :unprocessable_entity
      assert_empty sends
    end

    test 'an oversized targetId is refused with no exception and nothing stored' do
      build_game
      post_build(choices: CONVINCING)
      post_send(target_id: 'x' * 5000)
      assert_response :unprocessable_entity
      assert_empty sends
    end

    test 'an over-long slot value is refused with no exception' do
      build_game
      post_build(choices: CONVINCING)
      post_send(message: GOOD_MESSAGE.merge('slots' => { 'greeting' => 'z' * 5000 }))
      assert_response :unprocessable_entity
      assert_empty sends
    end

    # ── the body's landed is ignored ──────────────────────────────────────────

    test 'a body-asserted landed true over an unbuilt page does not land' do
      build_game
      post game_path('se/phish_send'),
           params: GOOD_MESSAGE.merge('targetId' => 'lord', 'kitId' => 'kit_payroll_page',
                                      'landed' => true), as: :json
      assert_response :success
      assert_equal false, response.parsed_body['landed'], 'the server ignores the body landed'
      assert_equal false, sends['lord/kit_payroll_page']['landed']
    end

    # ── idempotency ───────────────────────────────────────────────────────────

    test 'a resend after a landed first is first-wins idempotent' do
      build_game
      post_build(choices: CONVINCING)
      post_send
      first_at = sends['lord/kit_payroll_page']['at']
      post_send
      assert_response :success
      assert_equal 1, sends.size
      assert_equal true, sends['lord/kit_payroll_page']['landed']
      assert_equal first_at, sends['lord/kit_payroll_page']['at'], 'the landed entry is not rewritten'
    end

    # ── superset (section 7): every client-landed case passes the server gate ──
    #
    # The client judge grants the capture only when meets (the page meetsThreshold) and the email
    # landed. The server gate asks for less: a convincing built page plus an authored target and
    # kit. So any convincing build + authored send lands on the server, whatever the message craft.

    test 'superset: a convincing build plus an authored send always lands on the server' do
      build_game
      post_build(choices: CONVINCING)
      [GOOD_MESSAGE, WEAK_MESSAGE].each do |message|
        post_send(message: message)
        assert_equal true, response.parsed_body['landed'],
                     "the server gate must pass a send the client judge would land (#{message['templates']})"
      end
    end

    # ── guard (section 7): landed reads only the page threshold and authored target/kit ──

    test 'guard: a weak, mis-addressed message over a convincing page still lands' do
      build_game
      post_build(choices: CONVINCING)
      post_send(message: WEAK_MESSAGE)
      assert_response :success
      assert_equal true, response.parsed_body['landed'],
                   'the server landed must not read any message-craft factor'
    end
  end
end
