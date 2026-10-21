require 'test_helper'

module BreakEscape
  # The mail client's saved state (00 §10a, 01 "Persisted mail"): the server
  # sanitiser, its caps, per-message and per-thread upserts, seeded stubs and the
  # trim order of merge_mail_state!.
  class MailStateTest < ActiveSupport::TestCase
    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: { 'startRoom' => 'reception', 'rooms' => {} },
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'globalVariables' => {} }
      )
    end

    def msg(id, folder: 'inbox', read: true, seeded: false, game_time: nil, body: 'Hello')
      m = { 'id' => id, 'thread' => 'pierce:guest', 'mailbox' => 'guest', 'folder' => folder,
            'body' => body, 'read' => read, 'tells' => [], 'landed' => nil }
      m['seeded'] = true if seeded
      m['gameTime'] = game_time if game_time
      m
    end

    def mail
      @game.player_state['mailState']
    end

    # One key per message, as the client sends them
    def keyed(box, messages)
      messages.to_h { |m| ["mailboxes.#{box}.#{m['id']}", m] }
    end

    def ids(box)
      mail.dig('mailboxes', box, 'messages').map { |m| m['id'] }
    end

    test 'per-message keys upsert by id, append new ids, and leave other mailboxes alone' do
      assert @game.merge_mail_state!(keyed('guest', [msg('m1'), msg('m2', read: false)]))
      assert @game.merge_mail_state!(keyed('freemail', [msg('m9')]))
      assert @game.merge_mail_state!('mailboxes.guest.m2' => msg('m2', read: true), 'mailboxes.guest.m3' => msg('m3'))

      assert_equal %w[m1 m2 m3], ids('guest'), 'm2 replaced in place, m3 appended'
      assert_equal true, mail.dig('mailboxes', 'guest', 'messages', 1, 'read')
      assert_equal %w[m9], ids('freemail')
      refute mail.dig('mailboxes', 'guest').key?('unread'), 'No unread count is stored'
    end

    test 'a null message key removes that message; an emptied mailbox goes' do
      @game.merge_mail_state!(keyed('guest', [msg('m1'), msg('m2')]).merge(keyed('freemail', [msg('m9')])))
      @game.merge_mail_state!('mailboxes.guest.m1' => nil, 'mailboxes.freemail.m9' => nil, 'mailboxes.guest.nope' => nil)

      assert_equal %w[m2], ids('guest')
      refute mail['mailboxes'].key?('freemail')
    end

    test 'a message id may hold dots: the key splits on the first dot after the mailbox' do
      @game.merge_mail_state!('mailboxes.guest.msg.v2.1' => msg('ignored'))

      assert_equal %w[msg.v2.1], ids('guest'), 'The key names the message; the id follows it'
    end

    test 'a whole-mailbox key, the nested mailboxes key and a whole threads key are not accepted' do
      refute @game.merge_mail_state!('mailboxes' => { 'guest' => { 'messages' => [msg('m1')] } },
                                     'mailboxes.guest' => { 'messages' => [msg('m2')], 'unread' => 0 },
                                     'threads' => { 'pierce:guest' => { 'position' => 'p' } })
      refute @game.player_state.key?('mailState')
    end

    test 'a seeded stub is stored as a stub' do
      stub = { 'id' => 'welcome', 'seeded' => true, 'read' => true, 'gameTime' => 0 }
      @game.merge_mail_state!('mailboxes.guest.welcome' => stub)

      assert_equal [stub], mail.dig('mailboxes', 'guest', 'messages')
    end

    test 'threads upsert and delete per key' do
      @game.merge_mail_state!('threads.pierce:guest' => { 'position' => 'a' }, 'threads.lord:guest' => { 'position' => 'b' })
      @game.merge_mail_state!('threads.pierce:guest' => { 'position' => 'c' }, 'threads.lord:guest' => nil)

      assert_equal({ 'pierce:guest' => { 'position' => 'c' } }, mail['threads'])
      @game.merge_mail_state!('threads.pierce:guest' => nil)
      refute mail.key?('threads')
    end

    test 'a null key removes it; jobs, drafts and metrics replace whole' do
      @game.merge_mail_state!('jobs' => [{ 'jobId' => 'j1', 'kind' => 'text', 'remainingMs' => 5000 }],
                              'metrics' => { 'pierce' => { 'sent' => 1, 'failed' => 1, 'landed' => 0, 'firstTryLanded' => false } },
                              'mailboxes.guest.m1' => msg('m1'))
      @game.merge_mail_state!('jobs' => nil, 'mailboxes.guest.m1' => nil)

      refute mail.key?('jobs')
      refute mail.key?('mailboxes')
      assert_equal 1, mail.dig('metrics', 'pierce', 'sent')
    end

    test 'unknown keys are stripped at every level' do
      @game.merge_mail_state!(
        'hacked' => { 'x' => 1 },
        'mailboxes.guest.m1' => msg('m1').merge('evil' => '<script>', 'templates' => { 'from' => 'from_named' }),
        'jobs' => [{ 'jobId' => 'j1', 'kind' => 'ink', 'character' => 'pierce', 'npcId' => 'pierce',
                     'vars' => { 'email_subject' => 'Hi' }, 'knot' => 'on_email', 'remainingMs' => 1000, 'extra' => 'no' }],
        'threads.pierce:guest' => { 'position' => '{"inkSaveVersion":10}', 'expects' => { 'mode' => 'compose', 'targetId' => 'pierce', 'x' => 1 }, 'y' => 2 },
        'drafts' => { 'guest' => { 'to' => 'm.pierce@ledgerwell.example', 'subject' => 'Q3', 'password' => 'nope' } },
        'metrics' => { 'pierce' => { 'sent' => 2, 'failed' => 1, 'landed' => 1, 'firstTryLanded' => false, 'note' => 'x' } }
      )

      assert_equal %w[drafts jobs mailboxes metrics threads], mail.keys.sort
      assert_equal({ 'messages' => [msg('m1').merge('templates' => { 'from' => 'from_named' })] }, mail.dig('mailboxes', 'guest'))
      refute mail['jobs'][0].key?('extra')
      assert_equal({ 'email_subject' => 'Hi' }, mail['jobs'][0]['vars'])
      assert_equal({ 'position' => '{"inkSaveVersion":10}', 'expects' => { 'mode' => 'compose', 'targetId' => 'pierce' } },
                   mail.dig('threads', 'pierce:guest'))
      assert_equal({ 'to' => 'm.pierce@ledgerwell.example', 'subject' => 'Q3' }, mail.dig('drafts', 'guest'))
      assert_equal({ 'sent' => 2, 'failed' => 1, 'landed' => 1, 'firstTryLanded' => false }, mail.dig('metrics', 'pierce'))
    end

    test 'bad records are dropped: a message that is not an object, a job with no id or an unknown kind' do
      @game.merge_mail_state!(
        'mailboxes.guest.bad' => 'string',
        'mailboxes.guest.ok' => msg('ok'),
        'mailboxes..empty' => msg('x'),
        'jobs' => [{ 'kind' => 'ink' }, { 'jobId' => 'j1', 'kind' => 'rm -rf' }, { 'jobId' => 'j2', 'kind' => 'seed', 'messageId' => 'm9', 'mailbox' => 'guest', 'global' => 'gate' }]
      )

      assert_equal %w[guest], mail['mailboxes'].keys
      assert_equal %w[ok], ids('guest')
      assert_equal [{ 'jobId' => 'j2', 'kind' => 'seed', 'messageId' => 'm9', 'mailbox' => 'guest', 'global' => 'gate' }], mail['jobs']
    end

    test 'a body is cut to 4000 characters and a job delay is clamped' do
      @game.merge_mail_state!('mailboxes.guest.m1' => msg('m1', body: 'x' * 5000),
                              'jobs' => [{ 'jobId' => 'j1', 'kind' => 'text', 'text' => '', 'outcomeGlobal' => nil, 'remainingMs' => -5 }])

      assert_equal Game::MAX_MAIL_BODY_CHARS, mail.dig('mailboxes', 'guest', 'messages', 0, 'body').length
      assert_equal({ 'jobId' => 'j1', 'kind' => 'text', 'text' => '', 'outcomeGlobal' => nil, 'remainingMs' => 0 }, mail['jobs'][0],
                   'A silent text job keeps its empty text and null outcome')
    end

    test 'over 200 messages a mailbox drops read replies, then sent; never a seeded stub or unread mail' do
      seeded  = (1..5).map { |i| { 'id' => "seed#{i}", 'seeded' => true, 'read' => true, 'gameTime' => i } }
      replies = (1..5).map { |i| msg("reply#{i}", game_time: 100 + i) }
      sent    = (1..5).map { |i| msg("sent#{i}", folder: 'sent', game_time: 200 + i) }
      unread  = (1..187).map { |i| msg("unread#{i}", read: false, game_time: 300 + i) }
      # 202 in all: 2 must go, and the oldest are the stubs
      assert @game.merge_mail_state!(keyed('guest', seeded + replies + sent + unread))

      kept = ids('guest')
      assert_equal Game::MAX_MAIL_MESSAGES_PER_MAILBOX, kept.size
      assert_equal %w[seed1 seed2 seed3 seed4 seed5 reply3 reply4 reply5 sent1], kept.first(9)

      # 7 more unread: the replies and sent go, the stubs stay
      assert @game.merge_mail_state!(keyed('guest', (188..194).map { |i| msg("unread#{i}", read: false, game_time: 300 + i) }))
      kept = ids('guest')
      assert_equal %w[seed1 seed2 seed3 seed4 seed5], kept.first(5)
      assert_equal 0, kept.count { |id| id.start_with?('reply') }
      assert_equal 194, kept.count { |id| id.start_with?('unread') }
    end

    test 'a mailbox of more than 200 unread messages is not saved; the previous state stands' do
      @game.merge_mail_state!('mailboxes.guest.keep' => msg('keep', read: false))
      unread = (1..200).map { |i| msg("u#{i}", read: false) }

      assert_equal false, @game.merge_mail_state!(keyed('guest', unread).merge('jobs' => []))

      assert_equal %w[keep], ids('guest')
      refute mail.key?('jobs'), 'The rest of the update is not saved either'
    end

    test 'more than 50 jobs is not saved, since a pending job is never dropped' do
      @game.merge_mail_state!('jobs' => [{ 'jobId' => 'j0', 'kind' => 'text', 'remainingMs' => 1 }])
      jobs = (1..51).map { |i| { 'jobId' => "j#{i}", 'kind' => 'text', 'remainingMs' => 1 } }

      assert_equal false, @game.merge_mail_state!('jobs' => jobs)
      assert_equal %w[j0], mail['jobs'].map { |j| j['jobId'] }

      assert @game.merge_mail_state!('jobs' => jobs.first(Game::MAX_MAIL_JOBS))
      assert_equal Game::MAX_MAIL_JOBS, mail['jobs'].size
    end

    test 'one draft per account; too many accounts is not saved' do
      @game.merge_mail_state!('drafts' => { 'guest' => { 'subject' => 'A' }, 'freemail' => { 'subject' => 'B' } })
      assert_equal({ 'guest' => { 'subject' => 'A' }, 'freemail' => { 'subject' => 'B' } }, mail['drafts'])

      many = (0..Game::MAX_MAIL_DRAFTS).to_h { |i| ["acct#{i}", { 'subject' => 'x' }] }
      refute @game.merge_mail_state!('drafts' => many)
      assert_equal 2, mail['drafts'].size
    end

    test 'over MAX_MAIL_STATE_BYTES the section trims read mail across mailboxes, oldest first' do
      big = 'y' * Game::MAX_MAIL_BODY_CHARS
      # Each record is about 4.1 KB; 3 mailboxes of 100 read messages is about 1.2 MB
      %w[a b c].each_with_index do |box, b|
        messages = (1..100).map { |i| msg("#{box}#{i}", body: big, game_time: (i * 10) + b) }
        @game.merge_mail_state!(keyed(box, messages))
      end

      assert_operator mail.to_json.bytesize, :<=, Game::MAX_MAIL_STATE_BYTES
      counts = %w[a b c].map { |box| mail.dig('mailboxes', box, 'messages').size }
      assert_operator counts.sum, :<, 300
      assert_operator counts[0], :<, 100, 'Mailbox a was not in the update that passed the total, but its oldest mail goes'
      remaining = mail['mailboxes'].values.flat_map { |box| box['messages'] }
      dropped_times = (%w[a b c].each_with_index.flat_map { |box, b| (1..100).map { |i| [(i * 10) + b, "#{box}#{i}"] } }
                         .reject { |_, id| remaining.any? { |m| m['id'] == id } }.map(&:first))
      assert_operator dropped_times.max, :<, remaining.map { |m| m['gameTime'] }.min,
                      'The oldest read mail goes first, whichever mailbox holds it'
    end

    test 'over MAX_MAIL_STATE_BYTES with only unread mail the update is not saved' do
      big = 'z' * Game::MAX_MAIL_BODY_CHARS
      @game.merge_mail_state!('drafts' => { 'guest' => { 'subject' => 'kept' } })
      %w[a b c].each do |box|
        @game.merge_mail_state!(keyed(box, (1..100).map { |i| msg("#{box}#{i}", read: false, body: big) }))
      end

      assert_operator mail.to_json.bytesize, :<=, Game::MAX_MAIL_STATE_BYTES
      assert_nil mail.dig('mailboxes', 'c'), 'The mailbox that would pass the total was refused whole'
      assert_equal 100, mail.dig('mailboxes', 'b', 'messages').size
      assert_equal 'kept', mail.dig('drafts', 'guest', 'subject')
    end

    test 'over MAX_MAIL_STATE_BYTES a seeded stub is never trimmed' do
      big = 'y' * Game::MAX_MAIL_BODY_CHARS
      stub = { 'id' => 'welcome', 'seeded' => true, 'read' => true, 'gameTime' => 0 }
      @game.merge_mail_state!('mailboxes.a.welcome' => stub)
      %w[a b c].each_with_index do |box, b|
        @game.merge_mail_state!(keyed(box, (1..100).map { |i| msg("#{box}#{i}", body: big, game_time: (i * 10) + b) }))
      end

      assert_operator mail.to_json.bytesize, :<=, Game::MAX_MAIL_STATE_BYTES
      assert_equal stub, mail.dig('mailboxes', 'a', 'messages', 0), 'The oldest read message, but a stub'
    end

    test 'an update with nothing usable writes no mailState and is not a refusal' do
      assert_nil @game.merge_mail_state!('unknown' => 1, 'jobs' => 'not a list')
      refute @game.player_state.key?('mailState')
      assert_nil @game.merge_mail_state!('not a hash')
    end

    test 'an oversized thread position is dropped but the thread kept' do
      @game.merge_mail_state!('threads.pierce:guest' => { 'position' => 'p' * (Game::MAX_MAIL_THREAD_POSITION_BYTES + 1),
                                                           'expects' => { 'mode' => 'choices' } })

      assert_equal({ 'expects' => { 'mode' => 'choices' } }, mail.dig('threads', 'pierce:guest'))
    end
  end
end
