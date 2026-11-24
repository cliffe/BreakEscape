require 'test_helper'
require 'json'
require_relative '../../scripts/validate_cracking'

# Hash records and the offline cracker, validator side (S7 unit 09). Game abstraction only:
# invented passwords, invented facts.
class ValidateCrackingTest < ActiveSupport::TestCase
  def base
    {
      'startRoom' => 'office',
      'social' => { 'intelFacts' => {
        'pet' => { 'label' => 'Pet' }, 'town' => { 'label' => 'Town' }, 'year' => { 'label' => 'Year' },
        'team' => { 'label' => 'Team' }, 'colour' => { 'label' => 'Colour' }
      } },
      'startItemsInInventory' => [
        { 'type' => 'notes', 'id' => 'diary', 'name' => 'Diary', 'takeable' => true, 'revealsFacts' => %w[pet town] }
      ],
      'credentials' => {
        'dana_hash' => { 'kind' => 'hash', 'account' => 'dana', 'proof' => { 'held' => 'share_file' },
                         'crack' => { 'password' => 'guessable', 'facts' => %w[pet town], 'difficulty' => 'medium' } }
      },
      'rooms' => { 'office' => {
        'type' => 'room_office',
        'objects' => [
          { 'id' => 'share_file', 'type' => 'notes', 'name' => 'Share file', 'takeable' => true, 'readable' => true, 'text' => 'Hash record' },
          { 'id' => 'pattern_note', 'type' => 'notes', 'name' => 'Poster', 'readable' => true, 'text' => 'Name then number' }
        ],
        'npcs' => [
          { 'id' => 'dana', 'displayName' => 'Dana', 'npcType' => 'person', 'creds' => { 'username' => 'dana', 'password' => 'Pw-One-1' } },
          { 'id' => 'eli', 'displayName' => 'Eli', 'npcType' => 'person', 'creds' => { 'username' => 'eli', 'password' => 'Pw-Two-2' } }
        ]
      } }
    }
  end

  def rec(s, id = 'dana_hash')
    s['credentials'][id]
  end

  def dana(s)
    s['rooms']['office']['npcs'].first
  end

  def check(s)
    check_cracking(s)
  end

  def errors(s)
    check(s).grep(/ERROR/)
  end

  def warnings(s)
    check(s).grep(/WARNING/)
  end

  def assert_error(s, text)
    assert(errors(s).any? { |e| e.include?(text) }, "expected an error with #{text.inspect}, got:\n#{check(s).join("\n")}")
  end

  def assert_warning(s, text)
    assert(warnings(s).any? { |e| e.include?(text) }, "expected a warning with #{text.inspect}, got:\n#{check(s).join("\n")}")
  end

  test 'a clean scenario has no errors or warnings' do
    assert_empty check(base), check(base).join("\n")
  end

  test 'a scenario with no hash record is silent' do
    assert_empty check({ 'rooms' => {} })
    assert_empty check('credentials' => { 'x' => { 'kind' => 'password' } })
  end

  test 'account must be an account holder' do
    s = base
    rec(s)['account'] = 'nobody'
    assert_error(s, 'is not an account holder')
  end

  test 'class must resolve' do
    s = base
    rec(s)['crack'].delete('password')
    rec(s)['crack'].delete('facts')
    assert_error(s, 'has no password class')
    rec(s)['crack']['password'] = 'weird'
    assert_error(s, 'is not one of')
    s = base
    dana(s)['creds'].delete('password')
    assert_error(s, 'no creds.password')
  end

  test 'the class may come from the habit' do
    s = base
    dana(s)['habits'] = { 'password' => 'guessable' }
    rec(s)['crack'].delete('password')
    assert_empty errors(s)
  end

  test 'guessable needs one to four facts without repeats' do
    s = base
    rec(s)['crack'].delete('facts')
    assert_error(s, 'must set crack.facts')
    rec(s)['crack']['facts'] = %w[pet town year team colour]
    assert_error(s, 'must set crack.facts')
    rec(s)['crack']['facts'] = %w[pet pet]
    assert_error(s, 'repeats an id')
  end

  test 'facts on another class are an error' do
    s = base
    rec(s)['crack']['password'] = 'strong'
    assert_error(s, 'facts belong to a guessable recipe only')
  end

  test 'a recipe fact with no server-visible source is an error' do
    s = base
    rec(s)['crack']['facts'] = %w[pet year]
    assert_error(s, 'fact `year` must come from an item the server sees the player get')
  end

  test 'each kind of source counts' do
    s = base
    rec(s)['crack']['facts'] = %w[year team colour]
    rec(s)['crack']['difficulty'] = 'hard'
    s['rooms']['office']['objects'] << { 'id' => 'drawer', 'type' => 'safe', 'contents' => [
      { 'type' => 'notes', 'id' => 'letter', 'name' => 'Letter', 'takeable' => true, 'revealsFacts' => ['year'] }
    ] }
    dana(s)['feed'] = { 'posts' => [{ 'id' => 'p1', 'text' => 'hello', 'fact' => 'se_intel_team' }] }
    s['rooms']['office']['objects'] << { 'id' => 'station', 'type' => 'flag-station', 'name' => 'Station',
                                         'flagRewards' => [{ 'type' => 'grant_fact', 'fact' => 'colour' }] }
    assert_empty errors(s), errors(s).join("\n")
  end

  test 'a container item is a source only when it can be taken (R1-S2)' do
    s = base
    rec(s)['crack']['facts'] = ['year']
    rec(s)['crack']['difficulty'] = 'easy'
    s['rooms']['office']['objects'] << { 'id' => 'drawer', 'type' => 'safe', 'contents' => [
      { 'type' => 'notes', 'id' => 'letter', 'name' => 'Letter', 'takeable' => false, 'readable' => true, 'revealsFacts' => ['year'] }
    ] }
    assert_error(s, 'must come from an item the server sees')
    s['rooms']['office']['objects'].last['contents'][0]['takeable'] = true
    assert_empty errors(s), errors(s).join("\n")
  end

  test 'a nested container item is held to the same rule (R1-S2)' do
    s = base
    rec(s)['crack']['facts'] = ['year']
    rec(s)['crack']['difficulty'] = 'easy'
    inner = { 'type' => 'notes', 'id' => 'letter', 'name' => 'Letter', 'revealsFacts' => ['year'] }
    s['rooms']['office']['objects'] << { 'id' => 'drawer', 'type' => 'safe', 'contents' => [
      { 'type' => 'safe', 'id' => 'box', 'contents' => [inner] }
    ] }
    assert_error(s, 'must come from an item the server sees')
    inner['takeable'] = true
    assert_empty errors(s), errors(s).join("\n")
  end

  test 'a hash proof is held or technique_card and nothing else (R1-S6)' do
    s = base
    assert_empty errors(s), errors(s).join("\n")
    rec(s)['proof'] = { 'session' => 'x' }
    assert_error(s, 'proof must be `held`')
    rec(s)['proof'] = { 'foothold' => 'jack_x' }
    assert_error(s, 'proof must be `held`')
    rec(s)['proof'] = { 'technique_card' => 'x.y.z' }
    refute(errors(s).any? { |e| e.include?('proof must be `held`') })
  end

  test 'more than 64 hash records or stampable facts is an error (R1-S10)' do
    s = base
    65.times { |i| s['credentials']["h#{i}"] = { 'kind' => 'hash', 'account' => 'eli', 'proof' => { 'held' => 'share_file' }, 'crack' => { 'password' => 'common' } } }
    assert_error(s, 'hash records')
    t = base
    t['startItemsInInventory'] << { 'type' => 'notes', 'id' => 'many', 'name' => 'Many', 'takeable' => true,
                                    'revealsFacts' => (0..64).map { |i| "f#{i}" } }
    assert_error(t, 'stampable facts')
  end

  test 'an untakeable loose object and an untaken NPC item are not sources' do
    s = base
    rec(s)['crack']['facts'] = ['year']
    rec(s)['crack']['difficulty'] = 'easy'
    s['rooms']['office']['objects'] << { 'id' => 'poster', 'type' => 'notes', 'name' => 'Poster', 'revealsFacts' => ['year'] }
    assert_error(s, 'must come from an item the server sees')
    s['rooms']['office']['objects'].last['takeable'] = true
    assert_empty errors(s), errors(s).join("\n")
    s['rooms']['office']['objects'].pop
    eli = s['rooms']['office']['npcs'].last
    eli['itemsHeld'] = [{ 'type' => 'notes', 'id' => 'held_note', 'name' => 'Held', 'revealsFacts' => ['year'] }]
    assert_error(s, 'must come from an item the server sees')
    eli['itemsHeld'].first['takeable'] = true
    assert_empty errors(s), errors(s).join("\n")
  end

  test 'a station item counts only when a give_item reward names it' do
    s = base
    rec(s)['crack']['facts'] = ['year']
    rec(s)['crack']['difficulty'] = 'easy'
    station = { 'id' => 'station', 'type' => 'flag-station', 'name' => 'Station',
                'itemsHeld' => [{ 'type' => 'notes', 'id' => 'prize', 'name' => 'Prize', 'revealsFacts' => ['year'] }],
                'flagRewards' => [{ 'type' => 'emit_event', 'event_name' => 'x' }] }
    s['rooms']['office']['objects'] << station
    assert_error(s, 'must come from an item the server sees')
    station['flagRewards'] = [{ 'type' => 'give_item', 'item_name' => 'Prize' }]
    assert_empty errors(s), errors(s).join("\n")
  end

  test 'revealsFacts on a declared grant item is an error' do
    s = base
    s['timers'] = [{ 'actions' => [{ 'type' => 'give_item', 'item' => { 'type' => 'notes', 'id' => 'late', 'name' => 'Late', 'revealsFacts' => ['year'] } }] }]
    assert_error(s, 'a timer or object action hands this item over, so the server cannot see the player earn its facts')
  end

  test 'revealsFacts on a notepad or decor cup is an error' do
    s = base
    s['startItemsInInventory'] << { 'type' => 'notepad', 'id' => 'pad', 'name' => 'Pad', 'revealsFacts' => ['year'] }
    assert_error(s, 'notepad or decor cup')
    s = base
    s['startItemsInInventory'] << { 'type' => 'office-misc-cup', 'id' => 'cup', 'name' => 'Cup', 'revealsFacts' => ['year'] }
    assert_error(s, 'notepad or decor cup')
  end

  test 'revealsFacts with no id is an error' do
    s = base
    s['startItemsInInventory'].first.delete('id')
    assert_error(s, 'has no id')
  end

  test 'two definitions with one id where one has revealsFacts is an error' do
    s = base
    s['rooms']['office']['objects'] << { 'id' => 'diary', 'type' => 'notes', 'name' => 'Diary copy' }
    assert_error(s, "item id 'diary' is defined 2 times")
  end

  test 'fact ids must be bare intelFacts ids' do
    s = base
    s['startItemsInInventory'].first['revealsFacts'] = ['pet', 'se_intel_town']
    assert_error(s, 'carries the se_intel_ prefix')
    s['startItemsInInventory'].first['revealsFacts'] = %w[pet ghost]
    assert_error(s, 'is not a social.intelFacts id')
    s = base
    rec(s)['crack']['facts'] = %w[pet se_intel_town]
    assert_error(s, 'carries the se_intel_ prefix')
    s = base
    s['rooms']['office']['objects'] << { 'id' => 'station', 'type' => 'flag-station', 'flagRewards' => [{ 'type' => 'grant_fact', 'fact' => 'ghost' }] }
    assert_error(s, 'grant_fact flag reward fact')
  end

  test 'grades and crackSeconds' do
    s = base
    rec(s)['crack'] = { 'password' => 'guessable', 'facts' => %w[pet town], 'difficulty' => 'medium' }
    assert_empty check(s)
    # hard with four facts is clean
    s['startItemsInInventory'].first['revealsFacts'] = %w[pet town year team]
    rec(s)['crack'] = { 'password' => 'guessable', 'facts' => %w[pet town year team], 'difficulty' => 'hard' }
    assert_empty check(s), check(s).join("\n")
    # crackSeconds on easy refused, clean with salted true, clean on hard, refused on hard with salted false
    rec(s)['crack'] = { 'password' => 'guessable', 'facts' => ['pet'], 'difficulty' => 'easy' }
    rec(s)['crackSeconds'] = 30
    assert_error(s, 'sets crackSeconds but the record is not salted')
    rec(s)['salted'] = true
    assert_empty errors(s)
    rec(s)['crack'] = { 'password' => 'guessable', 'facts' => %w[pet town year], 'difficulty' => 'hard' }
    rec(s).delete('salted')
    assert_empty errors(s)
    rec(s)['salted'] = false
    assert_error(s, 'sets crackSeconds but the record is not salted')
    rec(s).delete('salted')
    rec(s)['crackSeconds'] = 5
    assert_error(s, 'crackSeconds must be a whole number of seconds from 10 to 600')
    rec(s)['crackSeconds'] = 601
    assert_error(s, 'crackSeconds must be a whole number')
  end

  test 'the grade may come from the account habit' do
    s = base
    rec(s)['crack'].delete('difficulty')
    dana(s)['habits'] = { 'passwordDifficulty' => 'hard' }
    rec(s)['crackSeconds'] = 30
    assert_empty errors(s)
    assert_warning(s, 'difficulty `hard` expects 3 or 4 facts; this recipe has 2')
    dana(s)['habits'] = { 'passwordDifficulty' => 'easy' }
    assert_error(s, 'sets crackSeconds but the record is not salted')
    dana(s)['habits'] = { 'passwordDifficulty' => 'brutal' }
    assert_error(s, 'unknown difficulty grade')
  end

  test 'an unknown crack.difficulty is an error' do
    s = base
    rec(s)['crack']['difficulty'] = 'brutal'
    assert_error(s, 'unknown difficulty grade')
  end

  test 'connectsTo on a hash and accepts hash are errors' do
    s = base
    rec(s)['connectsTo'] = 'pc1'
    assert_error(s, 'must not set connectsTo')
    s = base
    s['policies'] = { 'strict' => { 'accepts' => %w[password hash] } }
    assert_error(s, "accepts 'hash'")
  end

  test 'passwordPattern naming no object is an error, and one off a guessable class warns' do
    s = base
    rec(s)['crack']['passwordPattern'] = 'ghost'
    assert_error(s, 'names no object')
    rec(s)['crack']['passwordPattern'] = 'pattern_note'
    assert_empty check(s), check(s).join("\n")
    rec(s)['crack'] = { 'password' => 'strong', 'passwordPattern' => 'pattern_note' }
    assert_warning(s, 'a pattern clue belongs to a guessable one')
  end

  test 'warnings: class differs from habit, strong with a grade' do
    s = base
    dana(s)['habits'] = { 'password' => 'reused' }
    assert_warning(s, "differs from the account's habit")
    s = base
    rec(s)['crack'] = { 'password' => 'strong', 'difficulty' => 'hard' }
    assert_warning(s, 'difficulty has no effect on a strong password')
    assert(warnings(s).none? { |w| w.include?('expects') })
  end

  test 'warnings: reused with no equal password elsewhere' do
    s = base
    rec(s)['crack'] = { 'password' => 'reused' }
    assert_warning(s, 'no other account, registry password entry or capture target holds an equal password')
    s['rooms']['office']['npcs'].last['creds']['password'] = 'Pw-One-1'
    assert(warnings(s).none? { |w| w.include?('reused') })
  end

  test 'warnings: password equals a capture secret without revealSecret' do
    s = base
    s['rooms']['office']['npcs'].last['eventMappings'] = [{ 'addCapture' => { 'targetId' => 't1', 'secret' => 'Pw-One-1' } }]
    assert_warning(s, "equals a capture target's secret")
    s['social']['captures'] = { 'revealSecret' => true }
    assert(warnings(s).none? { |w| w.include?('capture') })
  end

  test 'no message holds a password' do
    s = base
    rec(s)['crack']['facts'] = ['ghost']
    assert(check(s).none? { |m| m.include?('Pw-One-1') })
  end

  test 'a technique-granted hash raises no connectsTo or policy error in the network ops check' do
    require_relative '../../scripts/validate_scenario'
    svc = ->(name, extra = {}) { { 'name' => name, 'port' => 80, 'product' => 'Inkwell WebPanel', 'version' => '2.0' }.merge(extra) }
    fid = 'print01.admin_page.factory_login'
    s = {
      'startRoom' => 'lobby',
      'networks' => { 'office_lan' => { 'name' => 'Office LAN', 'discovery' => 'scan' } },
      'hosts' => { 'print01' => { 'name' => 'Printer', 'network' => 'office_lan', 'sprite' => 'pnw_portable_printer1',
                                  'services' => [svc.call('print', 'port' => 9100, 'product' => 'Inkwell JetServe', 'version' => '1.4'),
                                                 svc.call('admin_page', 'label' => 'Admin page',
                                                          'weaknesses' => [{ 'id' => 'factory_login', 'class' => 'default_creds', 'severity' => 'low',
                                                                             'grants' => { 'credential' => 'print_hash' } }])] } },
      'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [],
                                'npcs' => [{ 'id' => 'it_admin', 'displayName' => 'Admin', 'npcType' => 'person',
                                             'creds' => { 'username' => 'admin1', 'password' => 'Gate-Pass-77' } }] } },
      'techniques' => { 'factory_accounts' => { 'name' => 'Factory accounts', 'worksOn' => { 'class' => 'default_creds' } } },
      'startItemsInInventory' => [{ 'id' => 'card_factory', 'type' => 'technique_card', 'name' => 'Field note', 'technique_card' => 'factory_accounts', 'takeable' => true }],
      'credentials' => { 'print_hash' => { 'kind' => 'hash', 'account' => 'it_admin', 'proof' => { 'technique_card' => fid },
                                           'crack' => { 'password' => 'common' } } }
    }
    out = check_network_ops(s, built: { 'N13' => true, 'N14' => true, 'N15' => true }).grep(/ERROR/)
    assert(out.none? { |m| m.include?('granted credential') || m.include?('connectsTo') || m.include?('policy') }, out.join("\n"))
    s['credentials']['print_hash']['kind'] = 'token'
    out = check_network_ops(s, built: { 'N13' => true, 'N14' => true, 'N15' => true }).grep(/ERROR/)
    assert(out.any? { |m| m.include?('must be of kind saved_connection or hash') })
  end
end
