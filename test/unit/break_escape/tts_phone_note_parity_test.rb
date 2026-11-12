require 'test_helper'
require 'json'

module BreakEscape
  # A1 R1 m2: the notes the extractor lists for a voiced call's lines are the ones the client sends.
  # The client side is test/js/phone-call-note-parity.test.mjs, which runs the same compiled ink
  # through InkEngine.continue and compares with EXPECTED below (the two files share the fixture
  # and the table). A glued line ("one <> two") is joined by the client and left unresolved by
  # the walker, so the server does not list it (as before A1).
  class TtsPhoneNoteParityTest < ActiveSupport::TestCase
    FIXTURE = 'test/fixtures/files/phone_note_parity/call.json'.freeze
    VOICE = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze
    EXPECTED = JSON.parse(File.read(BreakEscape::Engine.root.join('test/fixtures/files/phone_note_parity/expected.json')))

    test "the extractor lists the note the client sends for each line of a voiced call" do
      data = { 'rooms' => { 'r' => { 'npcs' => [
        { 'id' => 'caller', 'displayName' => 'Caller', 'npcType' => 'phone', 'voiced' => true, 'currentKnot' => 'start',
          'voice' => VOICE, 'storyPath' => BreakEscape::Engine.root.join(FIXTURE).to_s }
      ] } } }
      extractor = TtsLineExtractor.new('phone_note_parity', data)
      listed = extractor.entries.to_h { |e| [e.text, e.delivery] }
      EXPECTED['lines'].each do |text, note|
        if EXPECTED['server_skips'].include?(text)
          refute listed.key?(text), "#{text.inspect} is glued: the server does not list it"
        else
          assert listed.key?(text), "#{text.inspect} is listed"
          note.nil? ? assert_nil(listed[text], "no note for #{text.inspect}") : assert_equal(note, listed[text], "note for #{text.inspect}")
        end
      end
      # And a keyed request for each tagged line is accepted with exactly that note
      EXPECTED['lines'].each do |text, note|
        next if note.nil? || EXPECTED['server_skips'].include?(text)

        assert extractor.delivered_by?('caller', text, note), "the endpoint accepts #{note.inspect} for #{text.inspect}"
      end
    end
  end
end
