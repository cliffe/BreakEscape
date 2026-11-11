require 'test_helper'
require_relative '../support/access_social_scenario'

# Access model slice 9.2 sub-slice C (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.1, 8.3 and 10): the feed
# and social media rules in BreakEscape::AccessWork that the server and the validator share.
class AccessWorkSocialTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork

  def data
    @data ||= AccessSocialScenario.scenario
  end

  def npc(id)
    data['rooms']['office']['npcs'].find { |n| n['id'] == id }
  end

  test 'feed facts: every fact a room NPC feed post names, sorted, once each' do
    assert_equal %w[jake_pet_name jake_wedding_year], AW.feed_facts(data)
  end

  test 'feeds? needs both a feed with posts and a social_media need' do
    assert AW.feeds?(npc('jake'))
    refute AW.feeds?(npc('omar'))
    refute AW.feeds?(npc('nia'))
    refute AW.feeds?(npc('jake').merge('feed' => { 'posts' => [{ 'text' => 'no id' }] }))
    refute AW.feeds?(npc('jake').merge('feed' => ['a bare list']))
  end

  test 'the own workstation is a social_media place whatever its affordance; another desk is not' do
    assert_equal ['jake_pc'], AW.places(data, npc('jake'), 'social_media')
    assert_equal [], AW.places(data, npc('jake'), 'work').reject { |id| id == 'jake_pc' }
    refute AW.social_station?(data, npc('omar'), 'social_media'), 'no social_media need'
  end

  test 'a non-desk object that satisfies social_media is a place, and its restores shapes the period' do
    d = data
    d['rooms']['lobby']['objects'] << { 'id' => 'tablet', 'type' => 'notes',
                                       'affordance' => { 'satisfies' => 'social_media', 'restores' => 30, 'useSeconds' => 8 } }
    assert_equal %w[jake_pc tablet], AW.places(d, npc('jake'), 'social_media')
    assert_in_delta 30.0, AW.post_period_seconds(d, npc('jake')), 0.001
    assert_equal 8.0, AW.shortest_use_seconds(d, npc('jake'), 'social_media')
  end

  test 'the post period: min(restores, 100 - urgentAt) / decayPerMin minutes; the floor is 0.9 of it less 3' do
    assert_in_delta 60.0, AW.post_period_seconds(data, npc('jake')), 0.001
    assert_in_delta 51.0, AW.post_floor(data, npc('jake')), 0.001
    small = npc('jake').merge('socialUse' => { 'restores' => 20 })
    assert_in_delta 20.0, AW.post_period_seconds(data, small), 0.001
    jitter = npc('jake').merge('needs' => { 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40, 'jitterPct' => 50 } })
    assert_in_delta 30.0, AW.post_period_seconds(data, jitter), 0.001, 'the low end of the jitter'
    assert_nil AW.post_period_seconds(data, npc('omar'))
    assert_equal 0, AW.post_floor(data, npc('omar'))
    assert_nil AW.post_period_seconds(data, npc('jake').merge('needs' => { 'social_media' => { 'decayPerMin' => 0 } }))
  end

  test 'can fail for social_media: only with no phone, at a station that blocks it or can be off' do
    refute AW.can_fail?(data, npc('jake'), 'social_media'), 'a phone: never fails'
    assert AW.can_fail?(data, npc('jake').merge('phone' => false), 'social_media')
    refute AW.can_fail?(data, npc('lena').merge('phone' => false), 'social_media'), 'lax policy, no offWhen'
  end
end
