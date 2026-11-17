require 'test_helper'
require 'tmpdir'

module BreakEscape
  # Event barks (eventMappings `bark`, `sendTimedMessage.message`, `timedMessages`) of voiced person NPCs
  # are listed in the batch, kept in `keys` and counted by V6, so they can be generated through the
  # normal tts-audio route. The client voices them (npc-manager.js: useTTS for a person NPC with a
  # voice) and the endpoint accepts them (ScenarioBarkValidator.canonical).
  class TtsLineExtractorBarksTest < ActiveSupport::TestCase
    VOICE = { 'name' => 'Kore', 'style' => 'Dry.', 'language' => 'en-GB' }.freeze
    OTHER = { 'name' => 'Charon', 'style' => 'Dry.', 'language' => 'en-GB' }.freeze

    def person(id, extra = {})
      { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person', 'voice' => VOICE,
        'eventMappings' => [{ 'eventPattern' => 'room_entered:lobby', 'bark' => 'Mind the step.' },
                            { 'eventPattern' => 'item_picked_up:key',
                              'sendTimedMessage' => { 'message' => 'Found it yet?', 'delay' => 5 } }],
        'timedMessages' => [{ 'delay' => 30, 'message' => 'Still there?' }] }.merge(extra)
    end

    def data(*npcs)
      { 'rooms' => { 'lobby' => { 'npcs' => npcs } } }
    end

    def extractor(*npcs)
      TtsLineExtractor.new('barks_test', data(*npcs), chatter: false)
    end

    test 'a voiced person NPC lists its bark texts under its own id and voice' do
      e = extractor(person('guard')).entries
      assert_equal ['Mind the step.', 'Found it yet?', 'Still there?'], e.map(&:text)
      assert_equal ['guard'], e.map(&:npc_id).uniq
      assert_equal [VOICE], e.map(&:voice).uniq
      assert_equal ['npc.bark'], e.map(&:path).uniq
    end

    test 'an NPC with no voice, and a phone contact, list no bark' do
      assert_empty extractor(person('mute', 'voice' => nil)).entries
      assert_empty extractor(person('caller', 'npcType' => 'phone')).entries
    end

    test 'a repeated bark text is one entry; the same text in two voices is two' do
      a = person('a', 'eventMappings' => [{ 'bark' => 'Hello.' }, { 'bark' => ' Hello. ' }], 'timedMessages' => [])
      b = person('b', 'voice' => OTHER, 'eventMappings' => [{ 'bark' => 'Hello.' }], 'timedMessages' => [])
      e = extractor(a, b).entries
      assert_equal %w[a b], e.map(&:npc_id)
      assert_equal 2, e.map(&:key).uniq.size
    end

    test 'keys include the bark clips, whether or not chatter is pre-generated' do
      ex = extractor(person('guard'))
      svc = TtsService.new
      key = svc.cache_key_for('Mind the step.', VOICE['name'], VOICE['style'], VOICE['language'])
      assert_includes ex.keys, key
      assert_includes TtsLineExtractor.new('barks_test', data(person('guard')), chatter: true).keys, key
    end

    test 'V6 counts the bark clips as kind bark, uncached in an empty cache' do
      Dir.mktmpdir do |dir|
        r = TtsOfficeLines.new('barks_test', data(person('guard')), cache_dir: dir).report
        assert_equal ['Found it yet?', 'Mind the step.', 'Still there?'], r.clips.map(&:text).sort
        assert_equal ['bark'], r.clips.map(&:kind).uniq
        assert_equal 3, r.uncached.size
      end
    end

    test 'm03 lists exactly its three office-life barks' do
      ex = TtsLineExtractor.for_scenario('m03_ghost_in_the_machine')
      barks = ex.entries.select { |e| e.path == 'npc.bark' }.map { |b| [b.npc_id, b.text] }
      assert_equal [['ffion_rees', 'Charger, charger... I know I left it here somewhere.'],
                    ['zainab_hussain', "That's my laptop. Can I help you?"],
                    ['yusuf_demir', 'Zainab, ring someone. Now.']].sort, barks.sort
    end

    # M1: the client strips the NPC's own "Name:" prefix (phoneBarkText) before /tts,
    # so the batch and the endpoint use the stripped text
    def sis03_data
      raw = JSON.parse(ERB.new(File.read(Engine.root.join('scenarios', 'sis03_cyber_insurance', 'scenario.json.erb')))
                          .result(Mission::ScenarioBinding.new({}).get_binding))
      raw
    end

    def eleanor(data)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'eleanor_vance' }
    end

    # What npc-barks.js sends: phoneBarkText of the authored line (own name prefix dropped)
    def client_text(authored)
      authored.sub(/\AEleanor Vance:\s*/i, '').strip
    end

    test 'sis03 Eleanor prefixed sendTimedMessage barks key on the text the client sends' do
      data = sis03_data
      npc = eleanor(data)
      authored = npc['eventMappings'].filter_map { |m| m.dig('sendTimedMessage', 'message') }
                    .select { |t| t.start_with?('Eleanor Vance:') }
      assert_equal 3, authored.size
      ex = TtsLineExtractor.new('sis03_cyber_insurance', data, chatter: false)
      barks = ex.entries.select { |e| e.path == 'npc.bark' && e.npc_id == 'eleanor_vance' }
      svc = TtsService.new
      voice = ex.voices['eleanor_vance']
      authored.each do |line|
        sent = client_text(line)
        refute_match(/\AEleanor/, sent)
        key = svc.cache_key_for(sent, voice['name'], voice['style'], voice['language'])
        assert_includes barks.map(&:key), key, "batch lacks the key of the text the client sends: #{sent[0, 50]}"
        assert_includes barks.map(&:text), sent
        assert_equal sent, ScenarioBarkValidator.canonical(npc, sent), 'endpoint refuses the stripped text'
      end
      refute(barks.any? { |b| b.text.start_with?('Eleanor Vance:') })
    end

    test 'a bark prefix naming someone else, or the id forms, follow the client rule' do
      npc = { 'id' => 'dr_chen', 'displayName' => 'Dr Chen',
              'eventMappings' => [{ 'bark' => 'Dr Chen: One.' }, { 'bark' => 'dr_chen : Two.' },
                                  { 'bark' => 'dr chen:Three.' }, { 'bark' => 'Director: Four.' },
                                  { 'bark' => "You: Mine.\nDr Chen: Five.\nNarrator: Quiet." },
                                  { 'bark' => 'Dr Chen:' }] }
      assert_equal ['One.', 'Two.', 'Three.', 'Director: Four.', 'Five.', 'Dr Chen:'],
                   ScenarioBarkValidator.event_bark_texts(npc)
    end

    # Expected values checked against the real phoneBarkText in node
    # (contact { id, displayName }), so the Ruby port matches JS on Unicode.
    test 'Unicode whitespace is trimmed as JS does' do
      npc = { 'id' => 'nia', 'displayName' => 'Nia' }
      spoken = ->(text) { ScenarioBarkValidator.spoken_bark_text(npc, text) }
      assert_equal 'x', spoken.("\u00a0Nia: x")
      assert_equal 'hello', spoken.("Nia:\u00a0hello")
      assert_equal 'x', spoken.("Nia\u3000: x")
      assert_equal 'x', spoken.("\u2028Nia: x")
      assert_equal 'x', spoken.("\ufeffNia: x")
      # U+0085 is not JS whitespace, so the prefix is not at the start
      assert_equal "\u0085Nia: x", spoken.("\u0085Nia: x")
      # "You:" followed only by NBSP is not a player line, it stays (trimmed)
      assert_equal 'You:', spoken.("You:\u00a0")
      assert_equal "x\nYou:", spoken.("Nia: x\nYou:\u00a0\nNarrator:\u00a0y")
    end

    test 'prefix case folding follows JS /i, not full Unicode folding' do
      assert_equal 'STRASSE: x', ScenarioBarkValidator.spoken_bark_text({ 'id' => 's', 'displayName' => 'Straße' }, 'STRASSE: x')
      assert_equal 'İPEK: x', ScenarioBarkValidator.spoken_bark_text({ 'id' => 's', 'displayName' => 'İpek' }, 'İPEK: x')
      assert_equal 'x', ScenarioBarkValidator.spoken_bark_text({ 'id' => 's', 'displayName' => 'Straße' }, 'STRAßE: x')
    end

    # JS never lets a non-ASCII letter match an ASCII one under /i (ſ upcases to
    # S, ı to I), though Ruby's own case folding would. Checked against the real
    # phoneBarkText in node.
    test 'a non-ASCII letter that uppercases to ASCII does not match the ASCII name' do
      sam = { 'id' => 'sam', 'displayName' => 'Sam' }
      assert_equal "\u017fam: x", ScenarioBarkValidator.spoken_bark_text(sam, "\u017fam: x")
      assert_equal 'x', ScenarioBarkValidator.spoken_bark_text(sam, 'SAM: x')
      ismail = { 'id' => 'ismail', 'displayName' => 'Ismail' }
      assert_equal "\u0131smail: x", ScenarioBarkValidator.spoken_bark_text(ismail, "\u0131smail: x")
    end

    test 'a String voice and an NPC with no npcType list no bark' do
      assert_empty extractor(person('obj', 'voice' => 'A fixed line.')).entries
      p = person('plain')
      p.delete('npcType')
      assert_empty extractor(p).entries
    end

    test 'a whitespace-only bark is skipped and non-Hash entries are ignored' do
      npc = person('guard', 'eventMappings' => [{ 'bark' => '   ' }, 'junk', nil,
                                                 { 'sendTimedMessage' => 'junk' }, { 'bark' => 'Real.' }],
                            'timedMessages' => ['junk', nil, { 'message' => "\n" }])
      assert_equal ['Real.'], extractor(npc).entries.map(&:text)
      assert_equal ['Real.'], ScenarioBarkValidator.event_bark_texts(npc)
    end

    test 'bark_texts keeps event barks first, then chatter, in order' do
      npc = person('guard', 'chatter' => { 'idle' => ['Chat one.', 'Chat two.'] })
      assert_equal ['Mind the step.', 'Found it yet?', 'Still there?', 'Chat one.', 'Chat two.'],
                   ScenarioBarkValidator.bark_texts(npc)
    end

    test 'a bark that duplicates a person-chat line is one entry' do
      story = Engine.root.join('scenarios/test_needs_sims/ink/amara.json').to_s
      host = person('amara', 'storyPath' => story, 'currentKnot' => 'start', 'eventMappings' => [], 'timedMessages' => [])
      line = extractor(host).entries.find { |e| e.path != 'npc.bark' }&.text
      assert line, 'fixture story lists no line'
      with_bark = person('amara', 'storyPath' => story, 'currentKnot' => 'start', 'timedMessages' => [],
                                  'eventMappings' => [{ 'bark' => line }, { 'bark' => 'Mind the step.' }])
      entries = extractor(with_bark).entries
      assert_equal 1, entries.count { |e| e.text == line }
      assert_equal entries.size, entries.map(&:key).uniq.size
      assert_includes entries.map(&:text), 'Mind the step.'
    end
  end
end
