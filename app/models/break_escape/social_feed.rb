module BreakEscape
  # Social media feeds held on the server (docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3,
  # 9.1, 9.2 and 9.4, sub-slice C). A room NPC's `feed` never ships: the browser asks for the
  # NPC's next post after each met social media use, and the server hands posts over one at a
  # time, in order, no faster than the need's own pace. A post's fact (a social.intelFacts entry)
  # is withheld from the bootstrap with it and travels with the post.
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS):
  #   feedRevealed { npcId => { 'shown' => [postId, ...] in reveal order, 'at' => server time of
  #                  the last reveal } }
  # Sub-slice C2 (ACCESS_MODEL_SLICE_9_2_C2_PLAN.md) changed the record from C's `{ n, at }`: a
  # reactive post is served out of authored order, so the actual set of shown ids is kept, and its
  # length is the reveal sequence. AccessWork.feed_shown_ids migrates a C `{ n, at }` save.
  module SocialFeed
    extend ActiveSupport::Concern

    # The keys of a post block the browser renders (the osint browser's post block); anything
    # else authored on a post (`deliberate`, and C2's `when`, server-only `order` on the feed)
    # stays on the server and never ships
    POST_KEYS = %w[id text fact date note].freeze

    def feed_revealed
      player_state['feedRevealed'] = {} unless player_state['feedRevealed'].is_a?(Hash)
      player_state['feedRevealed']
    end

    # POST /feed_post. Returns { status:, body: }. Checks in order (plan 9.1): the NPC is known;
    # it has a feed with posts and a social_media need; a post is left; the use's source (user
    # decision q33); for a second or later post, the pace floor.
    #
    # `source` is the object the use was at (`object_id`), or nil for the NPC's phone. A post is
    # refused (`refused: true`, nothing written) for the phone of an NPC with `"phone": false`,
    # for an object that is not one of the NPC's social media places in a room the player has
    # unlocked, and for a sign-in PC where loginLockouts holds the NPC's username: a lockout stops
    # every use of that PC, social media included, so a tampered client cannot post from a
    # locked-out PC. The refusal says no more than a `check` answer would (6.6).
    def reveal_feed_post!(npc_id, source = nil)
      id = npc_id.is_a?(String) ? npc_id : nil
      npc = id && scenario_room_npc(id)
      return { status: :forbidden, body: { error: 'unknown NPC' } } unless npc && Array(player_state['encounteredNPCs']).include?(id)

      return { status: :ok, body: { npcId: id, post: nil, done: true } } unless AccessWork.feeds?(npc)

      store = feed_revealed
      entry = store[id].is_a?(Hash) ? store[id] : {}
      shown = AccessWork.feed_shown_ids(npc, entry)

      # q33: a refused use (a locked-out PC, an object not one of the NPC's places, the phone for a
      # "phone": false NPC) never reaches the selection, so a tampered client cannot pick a post
      return { status: :ok, body: { npcId: id, post: nil, done: false, refused: true } } unless feed_source_ok?(npc, source)

      # C2: the server picks one eligible post by the feed's order from state it records. The raw
      # npcFrustration entry is read read-only (never frustration_entry(id), which would write a
      # defaulted record); the lockout keys are pre-gated by the per-NPC check record.
      raw_frustration = player_state['npcFrustration'].is_a?(Hash) ? player_state['npcFrustration'][id] : nil
      keys = lockout_recorded?(npc) ? lockout_keys : []
      selected = AccessWork.select_feed_post(scenario_data, npc, entry, raw_frustration, frustration_globals, keys)
      post_id = selected['post']
      done = selected['done'] == true

      # Nothing eligible (an ordered post behind a mode that does not reach it, or a reactive post
      # whose condition is not yet true): no write, the client asks again on the next met use
      return { status: :ok, body: { npcId: id, post: nil, done: done } } if post_id.nil?

      now = Time.current.to_f
      unless shown.empty?
        wait = AccessWork.post_floor(scenario_data, npc) - (now - entry['at'].to_f)
        # `revealed` (posts out so far) lets a client whose last answer was lost see that the
        # lost request revealed a post, so it stops asking for this use (review C R3 nit)
        return { status: :ok, body: { npcId: id, post: nil, done: false, tooSoon: true, retryAfter: wait.ceil, revealed: shown.length } } if wait.positive?
      end

      store[id] = { 'shown' => shown + [post_id], 'at' => now }
      save!
      { status: :ok, body: feed_answer(npc, post_id, shown.length).merge('npcId' => id, 'done' => done) }
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

        # C2: derive shown via feed_shown_ids so a C-shape { n, at } entry renders without a nil
        # error, then list the posts in reveal order with their reveal-sequence index
        shown = AccessWork.feed_shown_ids(npc, entry)
        next if shown.empty?

        feed = npc['feed']
        out[id] = { 'site' => feed['site'], 'person' => feed['person'],
                    'posts' => shown.each_with_index.map { |pid, i| feed_answer(npc, pid, i).slice('index', 'post', 'fact') },
                    'done' => AccessWork.feed_done?(scenario_data, npc, shown) }
      end
    end

    # ── Friendface phone item (q35, docs/achitechture/FRIENDFACE_PHONE_ITEM_PLAN.md) ─────────

    FRIENDFACE_PHONE = 'phone_friendface'.freeze

    # The Friendface phone the player holds for `npc_id` (nil: the player's own phone, one with no
    # phoneOf), or nil. Reads the server's inventory, whose phone items are always the scenario's
    # own copies: phoneOf is a field a client-built item can never carry.
    def held_friendface_phone(npc_id)
      Array(player_state['inventory']).find do |item|
        next false unless item.is_a?(Hash) && item['type'] == FRIENDFACE_PHONE

        owner = item['phoneOf'].is_a?(String) && !item['phoneOf'].empty? ? item['phoneOf'] : nil
        owner == npc_id
      end
    end

    # True once an NPC's Friendface phone has left it: the player holds it, or the server holds a
    # gift record of it from that NPC (given, taken from its items; still true after the player
    # drops it). Such an NPC is "phone": false for the rest of the run (plan section 3).
    def friendface_phone_taken?(npc_id)
      return false unless npc_id.is_a?(String) && !npc_id.empty?

      given = player_state['npc_given_items']
      gifted = given.is_a?(Hash) && Array(given[npc_id]).any? { |g| g.is_a?(Hash) && g['type'] == FRIENDFACE_PHONE }
      gifted || !held_friendface_phone(npc_id).nil?
    end

    # POST /friendface_phone. Returns { status:, body: }. Read only. `npc_id` a String opens that
    # NPC's phone, nil the player's own. Refused (403) unless the player holds that phone. The body
    # names the site and the profile to open, and carries the server's feedPosts for it (that
    # NPC's, or all of them for the player's own phone): posts already revealed, nothing new.
    def open_friendface_phone(npc_id)
      return { status: :forbidden, body: { error: 'no such phone' } } unless npc_id.nil? || (npc_id.is_a?(String) && !npc_id.empty?)

      item = held_friendface_phone(npc_id)
      return { status: :forbidden, body: { error: 'no such phone' } } unless item

      posts = feed_posts_for_client
      if npc_id
        npc = scenario_room_npc(npc_id)
        feed = npc.is_a?(Hash) && npc['feed'].is_a?(Hash) ? npc['feed'] : {}
        site = feed['site'].is_a?(String) ? feed['site'] : default_friendface_site
        person = feed['person'].is_a?(String) ? feed['person'] : nil
        posts = posts.slice(npc_id)
      else
        site = item['site'].is_a?(String) && !item['site'].empty? ? item['site'] : default_friendface_site
        person = nil
      end
      { status: :ok, body: { 'npcId' => npc_id, 'site' => site, 'person' => person, 'feedPosts' => posts } }
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

    # The first social site in the scenario's osint block, or nil
    def default_friendface_site
      sites = scenario_data.dig('social', 'osint', 'sites')
      site = Array(sites).find { |st| st.is_a?(Hash) && st['type'] == 'social' && st['id'].is_a?(String) }
      site && site['id']
    end

    # q33: the phone (nil) when the NPC has one; else a social media place of the NPC (its own
    # station, a non-desk source, a borrowed PC handed over) in a room the player can know of,
    # where the NPC's username is not locked out
    def feed_source_ok?(npc, source)
      return AccessWork.phone?(npc) if source.nil?
      return false unless source.is_a?(String) && frustration_places(npc, 'social_media').include?(source)

      pc = AccessWork.object(scenario_data, source)
      !(pc && AccessIdentities.login_pc?(pc) && AccessWork.locked_out_at?(npc, pc, lockout_keys))
    end

    # { index, post, fact, site, person } for the NPC's post named by `post_id`, with `index` the
    # reveal sequence (C2: a reactive post comes out of authored order, so the served post is
    # looked up by id and the reveal position is emitted separately). `fact` is { id, entry } for a
    # post whose fact names an intelFacts entry, else nil.
    def feed_answer(npc, post_id, reveal_index)
      raw = AccessWork.feed_posts(npc).find { |p| p['id'] == post_id }
      post = raw ? raw.slice(*POST_KEYS).select { |_k, v| v.is_a?(String) } : {}
      fid = post['fact']
      facts = scenario_data.dig('social', 'intelFacts')
      entry = fid && facts.is_a?(Hash) && facts[fid].is_a?(Hash) ? facts[fid].deep_dup : nil
      { 'index' => reveal_index, 'post' => post, 'fact' => entry ? { 'id' => fid, 'entry' => entry } : nil,
        'site' => npc['feed']['site'], 'person' => npc['feed']['person'] }
    end
  end
end
