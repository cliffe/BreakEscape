# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'erb'
require_relative '../../scripts/validate_lock_step'

# S8c unit 23: test_ops_lock_step must be playable by clicks, row by row of the brief's table.
# For each lock: the object or door exists, can be reached from the start room through doors a beat
# opens, has a clickable type, is locked with a lockType or plainly unlocked, and its first factor
# is written on a note (or a card or an ink line) the player can reach. Every item an ink hands
# over is offered in that ink. No gated object sits where the validator forbids.
class OpsLockStepClickPathsTest < ActiveSupport::TestCase
  DIR = 'scenarios/test_ops_lock_step'
  # Types the game draws as a clickable sprite (checked against the assets by the validator).
  CLICKABLE = %w[pc safe filing_cabinet bin zip_archive briefcase keycard notes1 text_file code_device
                 phone_friendface ops_log_terminal].freeze

  def scenario
    @scenario ||= begin
      srand(1)
      JSON.parse(ERB.new(File.read("#{DIR}/scenario.json.erb")).result(::BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    end
  end

  def walk(list, &block)
    Array(list).each do |o|
      next unless o.is_a?(Hash)

      block.call(o)
      walk(o['contents'], &block)
      walk(o['itemsHeld'], &block)
    end
  end

  def all_items
    out = []
    scenario['rooms'].each_value do |room|
      walk(room['objects']) { |o| out << o }
      Array(room['npcs']).each { |n| walk(n['itemsHeld']) { |o| out << o } }
    end
    out
  end

  def item(id)
    all_items.find { |o| o['id'] == id } || flunk("no object #{id}")
  end

  def office_notes
    scenario['rooms']['office']['objects'].select { |o| o['type'] == 'notes1' }.map { |o| o['text'] }.join("\n")
  end

  def ink(npc)
    File.read("#{DIR}/ink/#{npc}.ink")
  end

  OBJECT_ROWS = {
    'moira_pc' => %w[password push moira], 'audit_zip' => %w[password push_number_match gordon],
    'moira_locker' => %w[pin push moira], 'priya_safe' => %w[pin code priya],
    'dana_cabinet' => %w[password push_number_match dana], 'gordon_briefcase' => %w[pin push gordon]
  }.freeze

  test 'every gated object is as the brief says, clickable, has an id and a first factor on a note' do
    OBJECT_ROWS.each do |id, (lock, kind, owner)|
      o = item(id)
      assert_includes CLICKABLE, o['type'], "#{id} type"
      assert_equal true, o['locked'], id
      assert_equal lock, o['lockType'], id
      assert_equal({ 'kind' => kind, 'owner' => owner }, o['secondStep'], id)
      assert_includes office_notes, o['requires'], "#{id}: its first factor is on a note in the office"
    end
  end

  test 'gated objects sit where the validator allows' do
    lines = check_lock_step(scenario)
    assert_empty lines.grep(/ERROR/), lines.join("\n")
    assert_equal 1, lines.grep(/never passes/).size, 'only the finance cabinet never passes'
    assert_match(/dana_cabinet/, lines.grep(/never passes/).first)
  end

  test 'audit_zip is inside moira_pc, which is in the start room' do
    pc = scenario['rooms']['office']['objects'].find { |o| o['id'] == 'moira_pc' }
    assert_equal 'pc', pc['type']
    assert_includes Array(pc['contents']).map { |c| c['id'] }, 'audit_zip'
    assert_equal 'office', scenario['startRoom']
  end

  test 'rooms: both doors lead from the start room, and each first factor can be had by clicks' do
    rooms = scenario['rooms']
    assert_equal 'records_room', rooms['office']['connections']['north']
    assert_equal 'plant_room', rooms['office']['connections']['east']
    records = rooms['records_room']
    assert_equal({ 'kind' => 'push', 'owner' => 'moira' }, records['secondStep'])
    assert_equal 'rfid', records['lockType']
    card = item('records_card')
    assert_equal 'keycard', card['type']
    assert_equal true, card['takeable']
    assert_includes records['requires'], card['card_id']
    assert_includes rooms['office']['objects'], card

    plant = rooms['plant_room']
    assert_equal({ 'kind' => 'push', 'owner' => 'moira' }, plant['secondStep'])
    assert_equal 'key', plant['lockType']
    assert_nil all_items.find { |o| o['opens_lock'] == plant['requires'] }, 'no key in the scenario'
    gordon = rooms['office']['npcs'].find { |n| n['id'] == 'gordon' }
    assert_includes gordon['unlockable'], 'plant_room'
    assert_match(/#unlock_door:plant_room/, ink('gordon'))
  end

  test 'every item an ink hands over is offered in that ink and held by that NPC' do
    handed = { 'gordon' => %w[phone_friendface briefcase], 'priya' => %w[code_device] }
    handed.each do |npc_id, types|
      npc = scenario['rooms']['office']['npcs'].find { |n| n['id'] == npc_id }
      types.each do |type|
        assert_includes ink(npc_id), "#give_item:#{type}", "#{npc_id} ink offers #{type}"
        assert_includes Array(npc['itemsHeld']).map { |i| i['type'] }, type
      end
    end
    %w[moira dana].each { |id| refute_match(/give_item|unlock_door/, ink(id), "#{id} hands nothing over") }
    dana = scenario['rooms']['office']['npcs'].find { |n| n['id'] == 'dana' }
    assert_equal 'phone_friendface', dana['itemsHeld'].first['type']
  end

  test 'the cast: Moira is pestered at patience 3, Gordon aware and Priya keeps a code device' do
    npcs = scenario['rooms']['office']['npcs'].to_h { |n| [n['id'], n] }
    assert_equal 'low', npcs['moira']['awareness']
    assert_equal({ 'approvesPrompts' => 'pestered', 'promptPatience' => 3 }, npcs['moira']['habits'])
    assert_equal 'high', npcs['gordon']['awareness']
    assert_equal 'high', npcs['dana']['awareness']
    device = item('priya_device')
    assert_equal 'priya', device['owner']
    assert_equal 'code_device', device['type']
  end

  test 'the courier box is clickable and takes the briefcase by id; the briefcase is droppable' do
    box = item('courier_box')
    assert_includes CLICKABLE, box['type']
    assert_equal false, box['locked']
    assert_nil box['secondStep']
    assert_match(/gordon_briefcase/, JSON.generate(box['triggerOnInteract']))
    assert_equal true, item('gordon_briefcase')['droppable']
    assert_equal 'board_minutes', item('gordon_briefcase')['contents'].first['id']
  end

  test 'container-like objects have a real lock or locked false, every gated object has an id, no step in profiles or resources' do
    all_items.each do |o|
      next unless o['contents'].is_a?(Array) || o.key?('secondStep')

      assert o['id'].is_a?(String) && !o['id'].empty?, "#{o['name']} needs an id" if o.key?('secondStep')
      assert [true, false].include?(o['locked']), "#{o['id']} locked"
      assert o['lockType'], "#{o['id']} lockType" if o['locked']
    end
    refute_match(/"(accountProfiles|resources)"/, JSON.generate(scenario))
  end

  test 'a log reader exists and the scenario declares logSources and a game clock' do
    reader = item('audit_log_pc')
    assert_equal 'ops_log_terminal', reader['type']
    assert scenario['logSources'].key?(reader['minigameData']['logSource'])
    assert scenario['gameClock']
  end

  test 'no id or name gives an answer away' do
    secrets = OBJECT_ROWS.keys.map { |id| item(id)['requires'] }
    names = all_items.flat_map { |o| [o['id'], o['name']] }.compact.join("\n").downcase
    secrets.each { |s| refute_includes names, s.downcase }
  end
end
