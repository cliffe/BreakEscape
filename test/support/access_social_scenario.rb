# A hand-written scenario for the access model slice 9.2 sub-slice C tests (social media feeds,
# docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md section 8). Build games from it with
# create_access_game (test_helper.rb).
#
# - jake: a social_media need (decayPerMin 60, urgentAt 40: a post period of 60 seconds, a
#   floor of 51), a phone, a feed of three posts, two of them with feed facts;
# - lena: a social_media need and a feed of one post with no fact;
# - omar: a feed but no social_media need (he never posts);
# - nia: a social_media need and no feed.
module AccessSocialScenario
  POSTS = [
    'Biscuit turns 5 today! Best boy in the whole office.',
    'Twenty years since we got married in 1998, and still laughing.',
    'Back from Crete, three hundred emails waiting for me...'
  ].freeze
  FACT_TEXTS = {
    'jake_pet_name' => 'Jake Brooks has a dog called Biscuit.',
    'jake_wedding_year' => 'Jake Brooks married in 1998.'
  }.freeze
  ORDINARY_FACT_TEXT = 'Jake Brooks works in the finance office.'.freeze
  LENA_POST = 'Lena Fox is running the charity five kilometre race on Sunday.'.freeze

  def self.npc(id, extra = {})
    { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person',
      'needsHome' => "#{id}_pc", 'needsDeferMin' => 0.5 }.merge(extra)
  end

  def self.pc(id, extra = {})
    { 'type' => 'pc', 'id' => id, 'name' => id, 'locked' => true, 'lockType' => 'login',
      'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } }.merge(extra)
  end

  def self.social_need
    { 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40, 'initial' => 50 } }
  end

  def self.scenario
    {
      'scenario_brief' => 'Slice 9.2 C test scenario',
      'startRoom' => 'lobby',
      'policies' => { 'no_social' => { 'social' => 'blocked' }, 'lax' => { 'social' => 'allowed' } },
      'globalVariables' => {},
      'social' => {
        'intelFacts' => {
          'jake_office' => { 'label' => 'Office', 'subject' => 'jake', 'text' => ORDINARY_FACT_TEXT },
          'jake_pet_name' => { 'label' => 'Pet', 'subject' => 'jake', 'text' => FACT_TEXTS['jake_pet_name'] },
          'jake_wedding_year' => { 'label' => 'Year', 'subject' => 'jake', 'text' => FACT_TEXTS['jake_wedding_year'] }
        },
        'osint' => { 'sites' => [{ 'id' => 'friendface', 'type' => 'social', 'name' => 'Friendface',
                                   'profiles' => [
                                     { 'person' => 'jake', 'name' => 'Jake Brooks',
                                       'posts' => [{ 'id' => 'jake_authored', 'text' => 'Finance office, third floor.', 'fact' => 'jake_office' }] },
                                     { 'person' => 'lena', 'name' => 'Lena Fox', 'posts' => [] }
                                   ] }] }
      },
      'rooms' => {
        'lobby' => {
          'type' => 'room_reception', 'connections' => { 'north' => 'office' },
          'objects' => [], 'npcs' => []
        },
        'office' => {
          'type' => 'room_office', 'connections' => { 'south' => 'lobby' },
          'objects' => [pc('jake_pc', 'policy' => 'no_social'), pc('lena_pc', 'policy' => 'lax'),
                        pc('omar_pc'), pc('nia_pc')],
          'npcs' => [
            npc('jake', 'needs' => social_need,
                        'feed' => { 'site' => 'friendface', 'person' => 'jake', 'posts' => [
                          { 'id' => 'jake_post_1', 'text' => POSTS[0], 'fact' => 'jake_pet_name', 'date' => 'Monday', 'deliberate' => true },
                          { 'id' => 'jake_post_2', 'text' => POSTS[1], 'fact' => 'jake_wedding_year' },
                          { 'id' => 'jake_post_3', 'text' => POSTS[2] }
                        ] }),
            npc('lena', 'needs' => social_need,
                        'feed' => { 'site' => 'friendface', 'person' => 'lena', 'posts' => [{ 'id' => 'lena_post_1', 'text' => LENA_POST }] }),
            npc('omar', 'feed' => { 'site' => 'friendface', 'person' => 'omar', 'posts' => [{ 'id' => 'omar_post_1', 'text' => 'Omar never posts this one.' }] }),
            npc('nia', 'needs' => social_need)
          ]
        }
      }
    }
  end
end
