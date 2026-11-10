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

  test 'a number part is a whole run, or two digits as the end of a year' do
    assert CL.number_in?('2019', 'May 2019')
    refute CL.number_in?('201', 'May 2019')
    assert CL.number_in?('26', 'Spring 2026')
    assert CL.number_in?('19', 'since 1919')
    refute CL.number_in?('26', 'Room 126')
    assert CL.number_in?('26', 'age 26')
    refute CL.number_in?('19', 'keypad code 4419'), 'a four-digit run that is no year'
    refute CL.number_in?('19', 'call x2219')
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

  # Compiled ink in the shape inklecate writes: a knot "hub", a variable "hub_quiet" set and
  # read, a "speaker" tag in both forms, a divert, a string assigned to an unprinted VAR and
  # a temp, and only "Morning, I'm Mei." and the choice "Ask about the dog" printed.
  def ink_fixture
    {
      'inkVersion' => 21,
      'root' => [
        [['done', { '#n' => 'g-0' }], nil],
        'done',
        {
          'start' => ['#', '^speaker:npc', '/#', '^Morning, I\'m Mei.', "\n",
                      'ev', true, '/ev', { 'VAR=' => 'hub_quiet', 're' => true },
                      'ev', 'str', '^Pepper', '/str', '/ev', { 'VAR=' => 'asked_about_pepper', 're' => true },
                      'ev', 'str', '^Biscuit', '/str', { 'temp=' => 'other' }, '/ev',
                      { '#' => 'Visit' }, { '->' => 'hub' }, nil],
          'hub' => [['ev', { 'VAR?' => 'hub_quiet' }, '/ev', 'visit', 'nop', "\n",
                     'ev', 'str', '^Ask about the dog', '/str', '/ev', { '*' => '.^.c-0', 'flg' => 4 },
                     { 'c-0' => ["\n", { '->' => 'pepper_story' }, nil] }], nil],
          'pepper_story' => ['^Fine.', 'done', nil],
          'global decl' => ['ev', 'str', '^Speaker', '/str', { 'VAR=' => 'quiet_name' }, '/ev', 'end', nil]
        }
      ],
      'listDefs' => {}
    }
  end

  test 'compiled ink: only text the player sees, never knots, variables, diverts or tags' do
    Dir.mktmpdir do |dir|
      Dir.mkdir(File.join(dir, 'ink'))
      File.write(File.join(dir, 'ink', 'mei.json'), JSON.generate(ink_fixture))
      text = text_at(CL.readable_texts({}, dir), 'ink/mei.json')[:text]
      assert CL.word_in?('Morning', text)
      assert CL.word_in?('Ask', text), 'choice text is read'
      %w[Hub Quiet Speaker Pepper Biscuit Visit Done Story].each do |word|
        refute CL.word_in?(word, text), "#{word} is not text the player sees"
      end

      # An unprinted VAR and a knot named for the dog do not source the password's word.
      data = { 'rooms' => { 'office' => {
        'objects' => [{ 'id' => 'memo', 'type' => 'notes', 'text' => 'pet name, the year 1998, then !' }],
        'npcs' => [{ 'id' => 'mei', 'creds' => { 'username' => 'mei', 'password' => 'Pepper1998!' } }]
      } } }
      b = CL.backing(data['rooms']['office']['npcs'][0], data, CL.readable_texts(data, dir), 'memo')
      refute b[:backed]
      assert_empty b[:pieces][0][:sources]
    end
  end

  test 'compiled ink of test_access_habits: its knots, variables and tags are not read' do
    dir = File.expand_path('../../scenarios/test_access_habits', __dir__)
    texts = CL.readable_texts({}, dir).select { |t| t[:path].start_with?('ink/') }
    refute_empty texts
    texts.each do |t|
      %w[Hub Quiet Speaker].each { |word| refute CL.word_in?(word, t[:text]), "#{word} in #{t[:path]}" }
    end
    assert(texts.any? { |t| t[:text].include?('Anything else?') })
  end

  test 'compiled ink is read as UTF-8 whatever the locale, and a broken file is named' do
    Dir.mktmpdir do |dir|
      Dir.mkdir(File.join(dir, 'ink'))
      File.binwrite(File.join(dir, 'ink', 'cafe.json'),
                    "\xEF\xBB\xBF".b + JSON.generate({ 'root' => ['^We met at the café, Pickle and me.', 'done'] }).b)
      File.write(File.join(dir, 'ink', 'broken.json'), '{"root": [')
      previous = Encoding.default_external
      failures = []
      begin
        silence_warnings { Encoding.default_external = Encoding::US_ASCII }
        texts = CL.readable_texts({}, dir, ink_failures: failures)
      ensure
        silence_warnings { Encoding.default_external = previous }
      end
      assert_includes text_at(texts, 'ink/cafe.json')[:text], 'Pickle'
      assert_nil text_at(texts, 'ink/broken.json')
      assert_equal ['ink/broken.json'], failures.map { |f| f[:path] }
    end
  end

  test 'social: strings in an array count only under a readable key' do
    data = { 'social' => { 'intelFacts' => {
      'photo' => { 'unlocks' => ['pepper_photo'], 'requiredFactors' => %w[pepper], 'label' => 'Photo' },
      'caption' => { 'text' => ['Pepper at the park'] }
    } } }
    texts = CL.readable_texts(data)
    refute CL.word_in?('Pepper', text_at(texts, 'social/intelFacts/photo')[:text])
    assert CL.word_in?('Pepper', text_at(texts, 'social/intelFacts/caption')[:text])
  end

  test 'backing: a word found only in another case is flagged' do
    data = { 'rooms' => { 'office' => {
      'objects' => [{ 'id' => 'photo', 'type' => 'notes', 'text' => 'Pepper on the beach' },
                    { 'id' => 'memo', 'type' => 'notes', 'text' => 'pet name, the year 1998, then !' },
                    { 'id' => 'card', 'type' => 'notes', 'text' => 'Since 1998' }],
      'npcs' => [{ 'id' => 'mei', 'creds' => { 'username' => 'mei', 'password' => 'pepper1998!' } }]
    } } }
    mei = data['rooms']['office']['npcs'][0]
    b = CL.backing(mei, data, CL.readable_texts(data), 'memo')
    assert b[:backed], b[:reasons].inspect
    assert b[:pieces][0][:case_differs]
    refute b[:pieces][1][:case_differs]
    assert_equal 1, b[:case_changes]

    mei['creds']['password'] = 'Pepper1998!'
    b = CL.backing(mei, data, CL.readable_texts(data), 'memo')
    refute b[:pieces][0][:case_differs]
    assert_equal 0, b[:case_changes]
  end
end
