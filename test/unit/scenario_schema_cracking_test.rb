# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require 'json-schema'

# Ops S7 unit 03: the schema fields the offline cracker adds. Each field is checked against the
# block that owns it, using the schema file itself.
class ScenarioSchemaCrackingTest < Minitest::Test
  SCHEMA = JSON.parse(File.read(File.expand_path('../../scripts/scenario-schema.json', __dir__)))

  def errors(fragment, data)
    JSON::Validator.fully_validate(SCHEMA, data, fragment: fragment, errors_as_objects: false)
  end

  def credentials(extra = {}, crack = nil)
    entry = { 'kind' => 'hash', 'account' => 'npc_a', 'proof' => { 'held' => 'file_a' } }.merge(extra)
    entry['crack'] = crack if crack
    { 'hash_a' => entry }
  end

  CRED = '#/properties/credentials'

  def test_salted_and_crack_seconds_accepted
    assert_empty errors(CRED, credentials('salted' => true, 'crackSeconds' => 10))
    assert_empty errors(CRED, credentials('salted' => true, 'crackSeconds' => 600))
  end

  def test_crack_seconds_out_of_range_refused
    refute_empty errors(CRED, credentials('crackSeconds' => 5))
    refute_empty errors(CRED, credentials('crackSeconds' => 601))
  end

  def test_crack_block_accepted
    %w[strong guessable reused common].each do |klass|
      assert_empty errors(CRED, credentials({}, { 'password' => klass }))
    end
    full = { 'password' => 'guessable', 'facts' => %w[a b c d], 'passwordPattern' => 'poster', 'difficulty' => 'hard' }
    assert_empty errors(CRED, credentials({}, full))
  end

  def test_unknown_crack_key_refused
    refute_empty errors(CRED, credentials({}, { 'password' => 'strong', 'extra' => 1 }))
  end

  def test_fifth_fact_refused
    refute_empty errors(CRED, credentials({}, { 'facts' => %w[a b c d e] }))
  end

  def test_unknown_difficulty_and_class_refused
    refute_empty errors(CRED, credentials({}, { 'difficulty' => 'brutal' }))
    refute_empty errors(CRED, credentials({}, { 'password' => 'weak' }))
  end

  def test_credentials_stay_server_only
    assert_equal true, SCHEMA['properties']['credentials']['x-serverOnly']
  end

  def test_habit_password_difficulty
    habits = '#/definitions/npc/properties/habits'
    assert_empty errors(habits, { 'passwordDifficulty' => 'medium' })
    refute_empty errors(habits, { 'passwordDifficulty' => 'brutal' })
    desc = SCHEMA['definitions']['npc']['properties']['habits']['properties']['password']['description']
    refute_includes desc, 'No run-time effect'
  end

  def test_item_reveals_facts
    item = { 'type' => 'notes', 'name' => 'Notes', 'revealsFacts' => %w[a b] }
    assert_empty errors('#/definitions/item', item)
    refute_empty errors('#/definitions/item', item.merge('revealsFacts' => 'a'))
  end

  def test_grant_fact_reward
    assert_empty errors('#/definitions/flagReward', { 'type' => 'grant_fact', 'fact' => 'a', 'label' => 'L' })
    refute_empty errors('#/definitions/flagReward', { 'type' => 'grant_nothing' })
  end
end
