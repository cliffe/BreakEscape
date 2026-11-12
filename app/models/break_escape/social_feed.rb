module BreakEscape
  # Social media feeds held on the server (docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3,
  # 9.1, 9.2 and 9.4, sub-slice C). A room NPC's `feed` never ships: the browser asks for the
  # NPC's next post after each met social media use, and the server hands posts over one at a
  # time, in order, no faster than the need's own pace. A post's fact (a social.intelFacts entry)
  # is withheld from the bootstrap with it and travels with the post.
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS):
  #   feedRevealed { npcId => { 'n' => posts out, 'at' => server time of the last } }
  module SocialFeed
    extend ActiveSupport::Concern

    # The keys of a post block the browser renders (the osint browser's post block); anything
    # else authored on a post (`deliberate`) stays on the server
    POST_KEYS = %w[id text fact date note].freeze

    def feed_revealed
      player_state['feedRevealed'] = {} unless player_state['feedRevealed'].is_a?(Hash)
      player_state['feedRevealed']
    end

    # POST /feed_post. Returns { status:, body: }. Checks in order (plan 9.1): the NPC is known;
    # it has a feed with posts and a social_media need; a post is left; for a second or later
    # post, the pace floor.
    def reveal_feed_post!(npc_id)
      id = npc_id.is_a?(String) ? npc_id : nil
      npc = id && scenario_room_npc(id)
      return { status: :forbidden, body: { error: 'unknown NPC' } } unless npc && Array(player_state['encounteredNPCs']).include?(id)

      posts = AccessWork.feed_posts(npc)
      return { status: :ok, body: { npcId: id, post: nil, done: true } } unless AccessWork.feeds?(npc)

      store = feed_revealed
      entry = store[id].is_a?(Hash) ? store[id] : {}
      n = entry['n'].is_a?(Integer) ? entry['n'].clamp(0, posts.size) : 0
      return { status: :ok, body: { npcId: id, post: nil, done: true } } if n >= posts.size

      now = Time.current.to_f
      if n.positive?
        wait = AccessWork.post_floor(scenario_data, npc) - (now - entry['at'].to_f)
        # `revealed` (posts out so far) lets a client whose last answer was lost see that the
        # lost request revealed a post, so it stops asking for this use (review C R3 nit)
        return { status: :ok, body: { npcId: id, post: nil, done: false, tooSoon: true, retryAfter: wait.ceil, revealed: n } } if wait.positive?
      end

      store[id] = { 'n' => n + 1, 'at' => now }
      save!
      { status: :ok, body: feed_answer(npc, posts, n).merge('npcId' => id, 'done' => n + 1 >= posts.size) }
    end

    # The feedPosts block GET /scenario carries (9.4): per NPC with a post out, its site and
    # person, every revealed post with its fact entry, oldest first, and done. Reads the stored
    # record without writing to it.
    def feed_posts_for_client
      store = player_state['feedRevealed']
      return {} unless store.is_a?(Hash)

      store.each_with_object({}) do |(id, entry), out|
        npc = scenario_room_npc(id)
        next unless npc && entry.is_a?(Hash) && AccessWork.feeds?(npc)

        posts = AccessWork.feed_posts(npc)
        n = entry['n'].is_a?(Integer) ? entry['n'].clamp(0, posts.size) : 0
        next if n.zero?

        feed = npc['feed']
        out[id] = { 'site' => feed['site'], 'person' => feed['person'],
                    'posts' => (0...n).map { |i| feed_answer(npc, posts, i).slice('index', 'post', 'fact') },
                    'done' => n >= posts.size }
      end
    end

    # Deletes every feed fact's entry from the bootstrap's social.intelFacts (plan 8.3), never the
    # block itself: an empty intelFacts stays an object, because grantFact grants any id when the
    # block is absent (social-intel.js).
    def withhold_feed_facts!(filtered)
      ids = AccessWork.feed_facts(scenario_data)
      return if ids.empty?

      social = filtered['social']
      return unless social.is_a?(Hash)

      if social['intelFacts'].is_a?(Hash)
        ids.each { |f| social['intelFacts'].delete(f) }
      else
        social['intelFacts'] = {}
      end
    end

    private

    # { index, post, fact, site, person } for the NPC's post at `index`; `fact` is
    # { id, entry } for a post whose fact names an intelFacts entry, else nil
    def feed_answer(npc, posts, index)
      raw = posts[index]
      post = raw.slice(*POST_KEYS).select { |_k, v| v.is_a?(String) }
      fid = post['fact']
      facts = scenario_data.dig('social', 'intelFacts')
      entry = fid && facts.is_a?(Hash) && facts[fid].is_a?(Hash) ? facts[fid].deep_dup : nil
      { 'index' => index, 'post' => post, 'fact' => entry ? { 'id' => fid, 'entry' => entry } : nil,
        'site' => npc['feed']['site'], 'person' => npc['feed']['person'] }
    end
  end
end
