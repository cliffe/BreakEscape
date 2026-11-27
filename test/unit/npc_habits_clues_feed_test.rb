require 'test_helper'

# Slice 9.2 C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md, section 9): readable_texts leaves out every
# alternative-set member (every reply, well formed or not, and every own post an insteadOf
# names), and set_member_texts returns them tagged with their set ids.
class NpcHabitsCluesFeedTest < ActiveSupport::TestCase
  CL = BreakEscape::NpcHabits::Clues

  def feeder(id, posts)
    { 'id' => id, 'npcType' => 'person', 'needs' => { 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40 } },
      'feed' => { 'site' => 'friendface', 'person' => id, 'posts' => posts } }
  end

  def scenario
    ivy = feeder('ivy', [
      { 'id' => 'ivy_own', 'text' => 'Own post outside any set.' },
      { 'id' => 'ivy_vent', 'text' => 'Vent the reply stands in for.', 'when' => { 'cause' => 'down' } },
      { 'id' => 'ivy_re', 'text' => '{name}, reply to the other vent.', 'replyTo' => 'tom_vent', 'insteadOf' => 'ivy_vent',
        'when' => { 'cause' => 'down' } },
      { 'id' => 'ivy_loose', 'text' => 'A reply with no insteadOf at all.', 'replyTo' => 'tom_vent' },
      { 'id' => 'ivy_stray', 'text' => 'A reply whose insteadOf names nothing.', 'replyTo' => 'tom_vent', 'insteadOf' => 'nope' }
    ])
    tom = feeder('tom', [{ 'id' => 'tom_vent', 'text' => 'The thread post, own and outside any set.' }])
    quiet = { 'id' => 'quiet', 'npcType' => 'person',
              'feed' => { 'site' => 'friendface', 'person' => 'quiet', 'posts' => [{ 'id' => 'q_re', 'text' => 'Never served.', 'replyTo' => 'tom_vent', 'insteadOf' => 'q' }] } }
    { 'rooms' => { 'office' => { 'objects' => [], 'npcs' => [ivy, tom, quiet] } } }
  end

  test 'readable_texts leaves out every set member, a reply with no insteadOf included' do
    texts = CL.readable_texts(scenario).map { |t| t[:text] }
    assert_includes texts, 'Own post outside any set.'
    assert_includes texts, 'The thread post, own and outside any set.'
    ['Vent the reply stands in for.', '{name}, reply to the other vent.', 'A reply with no insteadOf at all.',
     'A reply whose insteadOf names nothing.'].each { |t| refute_includes texts, t }
  end

  test 'set_member_texts returns the left-out texts tagged with their set ids' do
    sets = CL.set_member_texts(scenario).map { |t| [t[:text], t[:set], t[:path]] }
    assert_equal [
      ['Vent the reply stands in for.', 'ivy_vent', 'rooms/office/npcs[0]/feed/posts[1]'],
      ['{name}, reply to the other vent.', 'ivy_vent', 'rooms/office/npcs[0]/feed/posts[2]'],
      ['A reply with no insteadOf at all.', 'ivy_loose', 'rooms/office/npcs[0]/feed/posts[3]'],
      ['A reply whose insteadOf names nothing.', 'ivy_stray', 'rooms/office/npcs[0]/feed/posts[4]']
    ], sets
  end

  test 'an NPC that does not feed adds nothing to either list' do
    all = CL.readable_texts(scenario).map { |t| t[:text] } + CL.set_member_texts(scenario).map { |t| t[:text] }
    refute_includes all, 'Never served.'
  end

  test 'set_member_texts on a scenario with no rooms is empty' do
    assert_equal [], CL.set_member_texts({})
    assert_equal [], CL.set_member_texts(nil)
  end
end
