require 'test_helper'

# mailState over HTTP (00 §10a, 01 "Persisted mail"): sync_state merges it as a
# last-write-wins section, one key per message, so a stale request cannot
# overwrite it; the scenario bootstrap returns it as savedMailState; a section a
# merge refuses comes back as notSaved (mailState and phoneState).
module BreakEscape
  class MailStateSyncTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end

      @game = Game.create!(
        mission: @mission, player: @owner,
        scenario_data: {
          'startRoom' => 'lobby',
          'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                    'objects' => [], 'npcs' => [] } },
          'globalVariables' => { 'se_intel_email_pattern' => false }
        },
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [],
                        'inventory' => [], 'globalVariables' => { 'se_intel_email_pattern' => false }, 'notes' => [] }
      )
    end

    def reply(id, read: false)
      { 'id' => id, 'thread' => 'pierce:guest', 'mailbox' => 'guest', 'folder' => 'inbox',
        'from' => { 'name' => 'Mel Pierce', 'address' => 'm.pierce@ledgerwell.example' },
        'subject' => 'Re: Quick one', 'body' => 'Thanks, opening it now.', 'tells' => [], 'landed' => nil,
        'time' => '09:14', 'gameTime' => 663_000, 'read' => read }
    end

    def sync(params)
      put sync_state_game_url(@game), params: params, as: :json
      assert_response :success
      response.parsed_body
    end

    def scenario_json
      get scenario_game_url(@game)
      assert_response :success
      response.parsed_body
    end

    test 'mailState syncs and comes back on load as savedMailState' do
      sync(mailState: { 'mailboxes.guest.msg_1' => reply('msg_1'),
                        'jobs' => [{ 'jobId' => 'job_1', 'kind' => 'ink', 'character' => 'pierce', 'npcId' => 'pierce',
                                     'accountId' => 'guest', 'msgId' => 'msg_0', 'knot' => 'on_email',
                                     'vars' => { 'email_subject' => 'Quick one' }, 'remainingMs' => 9000 }],
                        'drafts' => { 'guest' => { 'to' => 'l.lord@ledgerwell.example', 'subject' => 'Draft' } } },
           clientTs: 1000)

      saved = scenario_json['savedMailState']
      assert_equal 'msg_1', saved.dig('mailboxes', 'guest', 'messages', 0, 'id')
      refute saved.dig('mailboxes', 'guest').key?('unread')
      assert_equal 9000, saved.dig('jobs', 0, 'remainingMs')
      assert_equal 'Draft', saved.dig('drafts', 'guest', 'subject')
    end

    test 'a stale request cannot overwrite mailState' do
      sync(mailState: { 'mailboxes.guest.msg_1' => reply('msg_1', read: true), 'mailboxes.guest.msg_2' => reply('msg_2'),
                        'jobs' => [] },
           clientTs: 2000)

      # The old page's unload flush, landing after the new page synced: it still
      # has the job the newer write delivered and msg_1 unread
      body = sync(mailState: { 'mailboxes.guest.msg_1' => reply('msg_1'),
                               'jobs' => [{ 'jobId' => 'job_2', 'kind' => 'text', 'remainingMs' => 100 }] },
                  clientTs: 1500)

      assert_equal true, body['stale']
      mail = @game.reload.player_state['mailState']
      assert_equal %w[msg_1 msg_2], mail.dig('mailboxes', 'guest', 'messages').map { |m| m['id'] }
      assert_equal [], mail['jobs']
      assert_equal true, mail.dig('mailboxes', 'guest', 'messages', 0, 'read')
    end

    test 'a keyed diff upserts only the messages and keys it carries' do
      sync(mailState: { 'mailboxes.guest.msg_1' => reply('msg_1'), 'mailboxes.guest.msg_2' => reply('msg_2'),
                        'mailboxes.guest.welcome' => { 'id' => 'welcome', 'seeded' => true, 'read' => false, 'gameTime' => 0 },
                        'metrics' => { 'pierce' => { 'sent' => 1, 'failed' => 1, 'landed' => 0, 'firstTryLanded' => false } } },
           clientTs: 1000)
      # A read mark and a delivery in another mailbox: one message each
      sync(mailState: { 'mailboxes.guest.msg_2' => reply('msg_2', read: true),
                        'mailboxes.freemail.msg_9' => reply('msg_9', read: true) }, clientTs: 2000)

      mail = @game.reload.player_state['mailState']
      assert_equal %w[freemail guest], mail['mailboxes'].keys.sort
      assert_equal %w[msg_1 msg_2 welcome], mail.dig('mailboxes', 'guest', 'messages').map { |m| m['id'] }
      assert_equal [false, true], mail.dig('mailboxes', 'guest', 'messages').first(2).map { |m| m['read'] }
      assert_equal({ 'id' => 'welcome', 'seeded' => true, 'read' => false, 'gameTime' => 0 },
                   mail.dig('mailboxes', 'guest', 'messages', 2), 'The stub is stored as sent')
      assert_equal 1, mail.dig('metrics', 'pierce', 'sent')
    end

    test 'an unsaveable mailState is refused without losing the rest of the sync' do
      sync(mailState: { 'jobs' => [{ 'jobId' => 'keep', 'kind' => 'text', 'remainingMs' => 1 }] }, clientTs: 1000)
      jobs = (1..(Game::MAX_MAIL_JOBS + 1)).map { |i| { 'jobId' => "j#{i}", 'kind' => 'text', 'remainingMs' => 1 } }

      body = sync(mailState: { 'jobs' => jobs }, globalVariables: { 'se_intel_email_pattern' => true }, clientTs: 2000)

      assert_equal %w[mailState], body['notSaved'], 'The refusal is reported, so the client resends it'
      state = @game.reload.player_state
      assert_equal %w[keep], state['mailState']['jobs'].map { |j| j['jobId'] }
      assert_equal true, state.dig('globalVariables', 'se_intel_email_pattern')
    end

    test 'a saved sync answers exactly { success: true }, with no notSaved' do
      body = sync(mailState: { 'mailboxes.guest.msg_1' => reply('msg_1') }, phoneState: {}, clientTs: 1000)

      assert_equal({ 'success' => true }, body)
    end

    # P1-D: a save that trims read mail to fit the byte cap answers with the
    # dropped keys in mailTrimmed, so the client drops them too rather than keep
    # holding them as confirmed and lose them silently on the next reload.
    test 'a byte-cap trim answers with the dropped keys in mailTrimmed' do
      big = 'y' * Game::MAX_MAIL_BODY_CHARS
      read_reply = lambda do |id, box, time|
        reply(id, read: true).merge('mailbox' => box, 'gameTime' => time, 'body' => big)
      end
      state = {}
      %w[guest freemail].each_with_index do |box, b|
        (1..150).each { |i| state["mailboxes.#{box}.#{box}#{i}"] = read_reply.call("#{box}#{i}", box, (i * 10) + b) }
      end

      body = sync(mailState: state, clientTs: 1000)

      refute body.key?('notSaved'), 'the save succeeded'
      assert body['mailTrimmed'].is_a?(Array) && body['mailTrimmed'].any?, 'the dropped keys are reported'
      assert(body['mailTrimmed'].all? { |k| k.start_with?('mailboxes.') })
      saved = @game.reload.player_state['mailState']
      assert_operator saved.to_json.bytesize, :<=, Game::MAX_MAIL_STATE_BYTES
      remaining = saved['mailboxes'].values.flat_map { |bx| bx['messages'].map { |m| m['id'] } }
      trimmed_ids = body['mailTrimmed'].map { |k| k.split('.', 3).last }
      assert(trimmed_ids.none? { |id| remaining.include?(id) }, 'a reported key names a message no longer saved')
    end

    test 'an over-cap phoneState is reported as notSaved and the saved one stands' do
      sync(phoneState: { 'alice' => { 'history' => [{ 'type' => 'npc', 'text' => 'kept' }] } }, clientTs: 1000)
      huge = (1..40).to_h do |i|
        ["npc#{i}", { 'history' => (1..150).map { { 'type' => 'npc', 'text' => 'x' * 100 } } }]
      end

      body = sync(phoneState: huge, clientTs: 2000)

      assert_equal %w[phoneState], body['notSaved']
      assert_equal %w[alice], @game.reload.player_state['phoneState'].keys
    end

    test "a grant's se_intel_* global round-trips through sync_state" do
      sync(globalVariables: { 'se_intel_email_pattern' => true }, clientTs: 1000)

      assert_equal true, scenario_json.dig('savedGlobalVariables', 'se_intel_email_pattern')
    end

    test 'a mission without mail gets no savedMailState and stores no mailState' do
      sync(globalVariables: { 'se_intel_email_pattern' => true }, phoneState: {}, clientTs: 1000)

      refute @game.reload.player_state.key?('mailState')
      refute scenario_json.key?('savedMailState')
    end
  end
end
