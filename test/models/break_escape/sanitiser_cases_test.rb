require 'test_helper'

module BreakEscape
  # Cross-side sanitiser behaviour (SYNC_DELTAS_PLAN 2.1, 3.7 "Behaviour").
  # The committed fixture test/fixtures/files/sync_bodies/sanitiser_cases.json holds
  # inputs that trip every clip/sanitiser rule and the output the server stores for
  # each. This test runs the real server sanitisers over those inputs and asserts the
  # stored output; the node test (test/js/sanitiser-cases.test.mjs) runs the client
  # clips over the same inputs and asserts the same outputs by stableJson. Neither test
  # writes the fixture; scratchpad/gen_sanitiser_fixture.rb generated it once. Changing
  # a sanitiser rule means changing the fixture, and both sides then have to agree.
  class SanitiserCasesTest < ActiveSupport::TestCase
    FIXTURE = JSON.parse(File.read(
      File.expand_path('../../fixtures/files/sync_bodies/sanitiser_cases.json', __dir__)
    ))

    # mail_state_updates keys are arrays (['mailboxes', box, id] or ['threads', key]);
    # turn the one for `key` back into the dotted key the client sends, or :not_stored.
    def mail_update_for(game, key, value)
      updates = game.send(:mail_state_updates, { key => value })
      updates.each do |path, clean|
        next unless path.is_a?(Array)
        dotted = path[0] == 'mailboxes' ? "mailboxes.#{path[1]}.#{path[2]}" : "threads.#{path[1]}"
        return clean if dotted == key
      end
      :not_stored
    end

    test 'mail messages are stored exactly as the fixture records' do
      game = Game.new(player_state: {})
      FIXTURE['mailMessages'].each do |c|
        got = mail_update_for(game, c['key'], c['input'])
        if c['notStored']
          assert_equal :not_stored, got, c['name']
        else
          assert_equal c['stored'], got, c['name']
        end
      end
    end

    test 'mail threads are stored exactly as the fixture records' do
      game = Game.new(player_state: {})
      FIXTURE['mailThreads'].each do |c|
        got = mail_update_for(game, c['key'], c['input'])
        if c['notStored']
          assert_equal :not_stored, got, c['name']
        else
          assert_equal c['stored'], got, c['name']
        end
      end
    end

    test 'mail drafts are stored exactly as the fixture records' do
      game = Game.new(player_state: {})
      FIXTURE['mailDrafts'].each do |c|
        assert_equal c['stored'], game.send(:sanitize_mail_drafts, c['input']), c['name']
      end
    end

    test 'phone entries are stored exactly as the fixture records' do
      game = Game.new(player_state: {})
      FIXTURE['phoneEntries'].each do |c|
        got = game.send(:sanitize_phone_state_entry, c['input'])
        if c['notStored']
          assert_nil got, c['name']
        else
          assert_equal c['stored'], got, c['name']
        end
      end
    end

    test 'npc ink variables are stored exactly as the fixture records' do
      FIXTURE['inkVariables'].each do |c|
        game = Game.new(player_state: {})
        game.send(:merge_npc_ink_variables!, c['input'])
        assert_equal c['stored'], game.player_state['npcInkVariables'], c['name']
      end
    end
  end
end
