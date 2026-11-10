require 'test_helper'
require 'tmpdir'

# Slice 9.1 step 3 (ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.2): password pieces, the readable texts,
# the secret homes and the backing of a guessable password. BreakEscape::NpcHabits::Clues is
# reached by name with no require: the autoloader finds lib/break_escape/npc_habits/clues.rb.
class NpcHabitsCluesTest < ActiveSupport::TestCase
  CL = BreakEscape::NpcHabits::Clues

  def kinds(password)
    CL.pieces(password).map { |p| [p[:text], p[:kind]] }
  end

  test 'pieces: words, numbers, fixed pieces and symbols' do
    assert_equal [['Biscuit', :word], ['2019', :number], ['!', :symbol]], kinds('Biscuit2019!')
    assert_equal [['Biscuit', :word], ['Rover', :word], ['2019', :number], ['!', :symbol]], kinds('BiscuitRover2019!')
    assert_equal [['IT', :fixed], ['Support', :word]], kinds('ITSupport')
    assert_equal [['Rex', :word]], kinds('Rex')
    assert_equal [['Jo', :fixed]], kinds('Jo')
    assert_equal [['Ab', :fixed]], kinds('Ab')
    assert_equal [['cd', :fixed]], kinds('cd')
    assert_equal [['Biscuit', :word], ['7', :fixed], ['!', :symbol]], kinds('Biscuit7!')
  end

  test 'a word part is found as a whole word without case, not inside a longer word' do
    assert CL.word_in?('Rex', 'our dog rex')
    assert CL.word_in?('Spring', 'Spring cleaning')
    refute CL.word_in?('Spring', 'their offspring')
    refute CL.word_in?('Rex', 'Rexford')
  end

  test 'a number part is a whole run, or two digits as the end of a four-digit year' do
    assert CL.number_in?('2019', 'May 2019')
    refute CL.number_in?('201', 'May 2019')
    assert CL.number_in?('26', 'Spring 2026')
    refute CL.number_in?('26', 'Room 126')
    assert CL.number_in?('26', 'age 26')
  end

  test 'a fixed piece only in the clue text, with its case, as a whole word or run' do
    assert CL.fixed_in?('Jo', 'start with Jo, then the year')
    refute CL.fixed_in?('Jo', 'start with jo')
    refute CL.fixed_in?('Jo', 'Joanne')
    assert CL.fixed_in?('7', 'end in 7!')
    refute CL.fixed_in?('7', 'end in 77')
  end

  def scenario
    {
      'rooms' => {
        'office' => {
          'objects' => [
            { 'id' => 'photo', 'type' => 'notes', 'name' => 'Photo', 'text' => 'Rex on the beach' },
            { 'id' => 'board', 'type' => 'notes', 'name' => 'Board', 'textVariants' => [{ 'text' => 'Biscuit the cat' }] },
            { 'id' => 'drawer', 'type' => 'safe', 'locked' => true, 'lockType' => 'key',
              'contents' => [{ 'id' => 'card', 'type' => 'notes', 'text' => 'Born 1987' }] },
            { 'id' => 'mei_pc', 'type' => 'pc', 'lockType' => 'login', 'access' => { 'people' => ['mei'] },
              'contents' => [{ 'id' => 'mei_local', 'type' => 'text_file', 'text' => 'Rover' }] },
            { 'id' => 'locker', 'type' => 'safe', 'locked' => true, 'lockType' => 'password', 'requires' => 'Rex2019!' }
          ],
          'npcs' => [
            { 'id' => 'mei', 'creds' => { 'username' => 'mei', 'password' => 'Rex2019!' } },
            { 'id' => 'sam', 'creds' => { 'username' => 'sam', 'password' => 'Rex2019!' } },
            { 'id' => 'len', 'usePayload' => { 'secret' => 'len-secret' } }
          ]
        },
        'vault' => { 'locked' => true, 'lockType' => 'password', 'requires' => 'vault-pw',
                     'objects' => [{ 'id' => 'vault_note', 'type' => 'notes', 'text' => 'Summer' }] }
      },
      'accountProfiles' => { 'mei_files' => { 'for' => { 'people' => ['mei'] },
                                              'contents' => [{ 'id' => 'pet_file', 'type' => 'text_file', 'text' => 'Tiddles' }] } },
      'social' => {
        'intelFacts' => { 'pet' => { 'label' => 'Pet', 'value' => 'Muffin' } },
        'osint' => { 'sites' => [{ 'id' => 'social', 'profiles' => [{ 'posts' => [{ 'kind' => 'post', 'text' => 'Holiday in Malaga' }] }] }] },
        'landingPages' => [{ 'capture' => { 'secret' => 'portal-pw' } }]
      },
      'networks' => { 'lan' => { 'wifi' => { 'psk' => 'wifi-key' } } }
    }
  end

  def text_at(texts, path)
    texts.find { |t| t[:path] == path }
  end

  test 'readable texts: an object, a variant, an intel fact, an osint post and compiled ink' do
    Dir.mktmpdir do |dir|
      Dir.mkdir(File.join(dir, 'ink'))
      File.write(File.join(dir, 'ink', 'mei.json'), JSON.generate({ 'root' => ['^We named him Pickle.', 'done'] }))
      texts = CL.readable_texts(scenario, dir)
      assert_includes text_at(texts, 'photo')[:text], 'Rex'
      assert_includes text_at(texts, 'board')[:text], 'Biscuit'
      assert_includes text_at(texts, 'social/intelFacts/pet')[:text], 'Muffin'
      assert_includes text_at(texts, 'social/osint/social')[:text], 'Malaga'
      assert_includes text_at(texts, 'ink/mei.json')[:text], 'Pickle'
    end
  end

  test 'scopes and locks: a profile, a sign-in PC, a locked room and a locked container' do
    texts = CL.readable_texts(scenario)
    assert_equal({ profile: 'mei_files' }, text_at(texts, 'pet_file')[:scope])
    assert_equal({ pc: 'mei_pc' }, text_at(texts, 'mei_local')[:scope])
    assert_equal ['drawer'], text_at(texts, 'card')[:locks]
    assert_equal ['vault'], text_at(texts, 'vault_note')[:locks]
    assert_empty text_at(texts, 'photo')[:locks]

    mei = scenario['rooms']['office']['npcs'][0]
    refute CL.readable_without?(text_at(texts, 'pet_file'), mei, scenario), "the account's own profile"
    refute CL.readable_without?(text_at(texts, 'mei_local'), mei, scenario), 'a PC only that account opens'
    assert CL.readable_without?(text_at(texts, 'card'), mei, scenario)
  end

  test 'backing: sources found, own profile and own PC excluded, locks carried' do
    data = scenario
    data['rooms']['office']['objects'] << { 'id' => 'memo', 'type' => 'notes', 'text' => 'pet, capital, the year 2019, end with !' }
    mei = data['rooms']['office']['npcs'][0]
    texts = CL.readable_texts(data)
    b = CL.backing(mei, data, texts, 'memo')
    assert b[:backed], b[:reasons].inspect
    assert_equal ['photo'], b[:pieces][0][:sources].map { |s| s[:path] }
    assert b[:pieces][2][:clue]
    assert_equal [1, 1, 3], [b[:capitals], b[:symbols], b[:total]]

    mei['creds']['password'] = 'Tiddles2019!'
    refute CL.backing(mei, data, texts, 'memo')[:backed], 'only in the own profile'
    mei['creds']['password'] = 'Rover2019!'
    refute CL.backing(mei, data, texts, 'memo')[:backed], 'only on a PC only Mei opens'
    mei['creds']['password'] = 'Summer2019!'
    b = CL.backing(mei, data, texts, 'memo')
    assert b[:backed]
    assert_equal [['vault']], b[:pieces][0][:sources].map { |s| s[:locks] }
  end

  test 'secret homes: each kind, and another account marked as shared' do
    homes = CL.secret_homes(scenario)
    kinds = homes.map { |h| [h[:kind], h[:path]] }
    assert_includes kinds, [:lock, 'rooms/vault']
    assert_includes kinds, [:lock, 'locker']
    assert_includes kinds, [:capture, 'social/landingPages[0]']
    assert_includes kinds, [:capture, 'rooms/office/npcs[2]/usePayload']
    assert_includes kinds, [:wifi, 'networks/lan/wifi']
    mei = scenario['rooms']['office']['npcs'][0]
    reused = CL.reuse_homes(mei, scenario, homes)
    assert_equal [[:lock, 'locker'], [:account, 'sam']], reused.map { |h| [h[:kind], h[:path] == 'locker' ? 'locker' : h[:npc_id]] }
  end
end
