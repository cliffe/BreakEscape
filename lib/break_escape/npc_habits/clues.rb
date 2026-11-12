# frozen_string_literal: true

require_relative '../access_work' unless defined?(BreakEscape::AccessWork)

module BreakEscape
  module NpcHabits
    # Password clues (ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.2): the text a player can read in a
    # scenario, the other places a secret lives, and whether a `guessable` password is backed
    # by both. Authoring time only: used by the validator and the dungeon graph, never by the
    # server. Plain Ruby, no Rails (the scripts require_relative it after access_identities.rb
    # and npc_habits.rb; access_work.rb, for the feed rule, is loaded below when absent).
    #
    # Nothing here returns a password or text from one in a form meant for output: callers
    # report pieces by position and kind, and sources by path.
    module Clues
      module_function

      COMMON_PUNCTUATION = %w[. , - ' : ; / ! ?].freeze
      TEXT_FIELDS = %w[name text observations postitNote].freeze
      # Under social: the keys whose string values a player reads.
      SOCIAL_TEXT_KEYS = %w[text body subject label value title note fact caption].freeze

      # The password split into pieces: runs of letters, runs of digits and single other
      # characters; each run of letters split again where a lower-case letter meets an
      # upper-case one, and before the last capital of a run of capitals followed by a
      # lower-case letter. [{ text:, kind: :word | :number | :fixed | :symbol }].
      def pieces(password)
        return [] unless password.is_a?(String)

        password.scan(/\p{L}+|\p{Nd}+|./m).flat_map do |run|
          if run.match?(/\A\p{L}+\z/)
            run.split(/(?<=\p{Ll})(?=\p{Lu})|(?<=\p{Lu})(?=\p{Lu}\p{Ll})/).map do |part|
              { text: part, kind: part.length >= 3 ? :word : :fixed }
            end
          elsif run.match?(/\A\p{Nd}+\z/)
            [{ text: run, kind: run.length >= 2 ? :number : :fixed }]
          else
            [{ text: run, kind: :symbol }]
          end
        end
      end

      # A word part as a whole word, letters compared without case.
      def word_in?(word, text)
        text.is_a?(String) && text.match?(/(?<!\p{L})#{Regexp.escape(word)}(?!\p{L})/i)
      end

      # A word part as a whole word with its own case.
      def word_exact_in?(word, text)
        text.is_a?(String) && text.match?(/(?<!\p{L})#{Regexp.escape(word)}(?!\p{L})/)
      end

      # A number part as a whole run of digits, or (two digits) the last two digits of a year
      # from 1900 to 2099 (not any four-digit run: a keypad code or an extension is no year).
      def number_in?(number, text)
        return false unless text.is_a?(String)
        return true if text.match?(/(?<!\p{Nd})#{Regexp.escape(number)}(?!\p{Nd})/)

        number.length == 2 && text.match?(/(?<!\p{Nd})(?:19|20)#{Regexp.escape(number)}(?!\p{Nd})/)
      end

      # A fixed piece in the clue's own text, with its case, as a whole word or run.
      def fixed_in?(piece, text)
        return false unless text.is_a?(String)

        if piece.match?(/\A\p{Nd}+\z/)
          text.match?(/(?<!\p{Nd})#{Regexp.escape(piece)}(?!\p{Nd})/)
        else
          text.match?(/(?<!\p{L})#{Regexp.escape(piece)}(?!\p{L})/)
        end
      end

      def capitals(password)
        password.to_s.scan(/\p{Lu}/).size
      end

      # Every text the player can read: [{ text:, path:, object_id:, scope:, locks: [], room:, name: }].
      # scope is nil, { profile: id } or { pc: id }; locks are the ids of the locked room
      # and the locked containers in front of it. An ink file that cannot be read is added
      # to ink_failures ({ path:, error: }) when that array is given.
      def readable_texts(scenario, scenario_dir = nil, ink_failures: nil)
        out = []
        return out unless scenario.is_a?(Hash)

        rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
        rooms.each do |room_id, room|
          next unless room.is_a?(Hash)

          room_locks = room['locked'] ? [room_id.to_s] : []
          walk_objects(room['objects'], "rooms/#{room_id}/objects", room_locks, nil, out, room_id.to_s)
          next unless room['npcs'].is_a?(Array)

          room['npcs'].each_with_index do |npc, i|
            next unless npc.is_a?(Hash)

            walk_objects(npc['itemsHeld'], "rooms/#{room_id}/npcs[#{i}]/itemsHeld", room_locks, nil, out, room_id.to_s)
            # Slice 9.2 C (plan 10): each feed post's text is a clue source (its fact's text is read
            # with intelFacts). Only posts the server can serve count (review C R1 m1): an NPC that
            # feeds (a social_media need) and a post with an id. C3 (plan 9): a set member (a reply,
            # or an own post a reply stands in for) may never ship, so it is left out here and read
            # only by set_member_texts.
            each_feed_text(npc, room_id, i) do |entry, member|
              out << entry unless member
            end
          end
        end
        walk_objects(scenario['startItemsInInventory'], 'startItemsInInventory', [], nil, out)
        profiles = scenario['accountProfiles'].is_a?(Hash) ? scenario['accountProfiles'] : {}
        profiles.each do |profile_id, profile|
          next unless profile.is_a?(Hash)

          walk_objects(profile['contents'], "accountProfiles/#{profile_id}/contents", [], { profile: profile_id.to_s }, out)
        end
        social_texts(scenario['social'], out)
        ink_texts(scenario_dir, out, ink_failures)
        out
      end

      # C3 (plan 9): the feed texts readable_texts leaves out, each tagged with its alternative
      # set id (the own post's id, or a reply's own id when its insteadOf names no own post of
      # its NPC). Reads no ink.
      def set_member_texts(scenario)
        out = []
        return out unless scenario.is_a?(Hash) && scenario['rooms'].is_a?(Hash)

        scenario['rooms'].each do |room_id, room|
          next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

          room['npcs'].each_with_index do |npc, i|
            next unless npc.is_a?(Hash)

            each_feed_text(npc, room_id, i) do |entry, member|
              out << entry if member
            end
          end
        end
        out
      end

      # Yields { text:, path:, ... } for each servable feed post of a feeding NPC, with the set
      # id for a set member (nil otherwise).
      def each_feed_text(npc, room_id, index)
        aw = BreakEscape::AccessWork
        return unless aw.feeds?(npc)

        served = aw.feed_posts(npc)
        members = aw.set_member_ids(npc)
        own_ids = served.reject { |p| aw.reply_post?(p) }.map { |p| p['id'] }
        npc['feed']['posts'].each_with_index do |post, j|
          next unless served.any? { |p| p.equal?(post) } && post['text'].is_a?(String) && !post['text'].empty?

          entry = { text: post['text'], path: "rooms/#{room_id}/npcs[#{index}]/feed/posts[#{j}]", object_id: nil, scope: nil, locks: [] }
          if members.include?(post['id'])
            set = if !aw.reply_post?(post) then post['id']
                  elsif own_ids.include?(post['insteadOf']) then post['insteadOf']
                  else post['id']
                  end
            yield entry.merge(set: set), set
          else
            yield entry, nil
          end
        end
      end

      def walk_objects(list, path, locks, scope, out, room = nil)
        return unless list.is_a?(Array)

        list.each_with_index do |obj, i|
          next unless obj.is_a?(Hash)

          here = "#{path}[#{i}]"
          label = obj['id'].is_a?(String) && !obj['id'].empty? ? obj['id'] : here
          texts = object_strings(obj)
          unless texts.empty?
            out << { text: texts.join("\n"), path: label, object_id: obj['id'], scope: scope, locks: locks.dup, room: room,
                     name: obj['name'] }
          end
          inner_locks = obj['locked'] && obj['lockType'] != 'login' ? locks + [label] : locks
          inner_scope = AccessIdentities.login_pc?(obj) ? { pc: obj['id'].to_s } : scope
          walk_objects(obj['contents'], "#{here}/contents", inner_locks, inner_scope, out, room)
        end
      end

      # The strings a player reads on one object, its variants included.
      def object_strings(obj)
        texts = TEXT_FIELDS.filter_map { |f| obj[f] if obj[f].is_a?(String) && !obj[f].empty? }
        obj.each do |key, value|
          next unless key.to_s.end_with?('Variants', 'variants') && value.is_a?(Array)

          value.each do |variant|
            next unless variant.is_a?(Hash)

            TEXT_FIELDS.each { |f| texts << variant[f] if variant[f].is_a?(String) && !variant[f].empty? }
          end
        end
        texts
      end

      def social_texts(social, out)
        return unless social.is_a?(Hash)

        if social['intelFacts'].is_a?(Hash)
          social['intelFacts'].each do |fact_id, fact|
            next if fact_id.to_s.start_with?('_')

            strings = []
            collect_strings(fact, strings)
            out << { text: strings.join("\n"), path: "social/intelFacts/#{fact_id}", object_id: nil, scope: nil, locks: [] } unless strings.empty?
          end
        end
        sites = social['osint'].is_a?(Hash) ? social['osint']['sites'] : nil
        Array(sites).each_with_index do |site, i|
          next unless site.is_a?(Hash)

          strings = []
          collect_strings(site, strings)
          id = site['id'].is_a?(String) ? site['id'] : "sites[#{i}]"
          out << { text: strings.join("\n"), path: "social/osint/#{id}", object_id: nil, scope: nil, locks: [] } unless strings.empty?
        end
        mail = social['mailClient'].is_a?(Hash) ? social['mailClient']['seededMessages'] : nil
        Array(mail).each_with_index do |message, i|
          next unless message.is_a?(Hash)

          strings = []
          collect_strings(message, strings)
          id = message['id'].is_a?(String) ? message['id'] : "seededMessages[#{i}]"
          out << { text: strings.join("\n"), path: "social/mail/#{id}", object_id: nil, scope: nil, locks: [] } unless strings.empty?
        end
      end

      # The strings under a readable key (SOCIAL_TEXT_KEYS), in a hash or in an array under
      # one; strings under any other key (ids, unlocks, requiredFactors, tags) are not read.
      def collect_strings(node, strings, readable = false)
        case node
        when Hash
          node.each do |key, value|
            if value.is_a?(String)
              strings << value if SOCIAL_TEXT_KEYS.include?(key.to_s)
            else
              collect_strings(value, strings, SOCIAL_TEXT_KEYS.include?(key.to_s))
            end
          end
        when Array
          node.each do |v|
            if v.is_a?(String)
              strings << v if readable
            else
              collect_strings(v, strings, readable)
            end
          end
        end
      end

      # The text the player sees in the scenario's compiled ink (scenario_dir/ink/*.json):
      # output text and choice text, never knot names, variables, divert targets, tags or
      # control words. Read as UTF-8 whatever the locale; a file that cannot be read or
      # parsed is added to `failures` (when given) instead of being skipped silently.
      def ink_texts(scenario_dir, out, failures = nil)
        return unless scenario_dir.is_a?(String) && File.directory?(File.join(scenario_dir, 'ink'))

        Dir.glob(File.join(scenario_dir, 'ink', '*.json')).sort.each do |file|
          path = "ink/#{File.basename(file)}"
          strings = []
          begin
            ink_visible(JSON.parse(File.read(file, encoding: 'bom|utf-8')), strings)
          rescue StandardError => e
            failures << { path: path, error: e.class.name } if failures
            next
          end
          out << { text: strings.join("\n"), path: path, object_id: nil, scope: nil, locks: [] }
        end
      end

      # Compiled ink: a container is an array whose last element may be a hash of named
      # sub-containers (knots, stitches, gathers) plus "#f" and "#n". Text the player sees
      # is a "^" string outside a tag ("#" to "/#"); a "^" string between "str" and "/str"
      # is choice text, unless it is assigned to a variable ({"VAR=": } or {"temp=": }
      # straight after "/str"). Every hash value other than a sub-container (divert targets,
      # variable names, choice points, tags in the old {"#": } form) and the whole
      # "global decl" container are skipped.
      def ink_visible(node, strings)
        case node
        when Array
          in_tag = false
          in_str = false
          pending = []
          node.each_with_index do |item, i|
            case item
            when '#' then in_tag = true
            when '/#' then in_tag = false
            when 'str'
              in_str = true
              pending = []
            when '/str'
              in_str = false
              after = node[i + 1]
              after = node[i + 2] if after == '/ev'
              assigned = after.is_a?(Hash) && (after.key?('VAR=') || after.key?('temp='))
              strings.concat(pending) unless assigned || in_tag
              pending = []
            when String
              next unless item.start_with?('^') && !in_tag

              text = item.delete_prefix('^')
              in_str ? pending << text : strings << text
            when Array, Hash
              ink_visible(item, strings)
            end
          end
        when Hash
          node.each do |key, value|
            ink_visible(value, strings) if value.is_a?(Array) && key != 'global decl'
          end
        end
      end

      # Every other place a secret lives: [{ path:, kind: :lock | :capture | :account | :wifi,
      # secret:, npc_id: (accounts), object_id: }].
      def secret_homes(scenario)
        out = []
        return out unless scenario.is_a?(Hash)

        rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
        rooms.each do |room_id, room|
          next unless room.is_a?(Hash)

          if room['lockType'] == 'password' && room['requires'].is_a?(String)
            out << { path: "rooms/#{room_id}", kind: :lock, secret: room['requires'], object_id: room_id.to_s }
          end
        end
        AccessIdentities.room_objects(scenario).each do |entry|
          obj = entry[:object]
          next unless obj['lockType'] == 'password' && obj['requires'].is_a?(String)

          out << { path: obj['id'] || entry[:path], kind: :lock, secret: obj['requires'], object_id: obj['id'] }
        end
        pages = scenario['social'].is_a?(Hash) ? scenario['social']['landingPages'] : nil
        Array(pages).each_with_index do |page, i|
          capture = page.is_a?(Hash) ? page['capture'] : nil
          next unless capture.is_a?(Hash) && capture['secret'].is_a?(String)

          out << { path: "social/landingPages[#{i}]", kind: :capture, secret: capture['secret'], object_id: nil }
        end
        AccessIdentities.room_npcs(scenario).each do |entry|
          npc = entry[:npc]
          if AccessIdentities.account?(npc)
            pw = npc['creds']['password']
            out << { path: entry[:path], kind: :account, secret: pw, npc_id: npc['id'], object_id: nil } if pw.is_a?(String)
            next
          end
          payload = npc['usePayload']
          if payload.is_a?(Hash) && payload['secret'].is_a?(String)
            out << { path: "#{entry[:path]}/usePayload", kind: :capture, secret: payload['secret'], object_id: nil }
          end
          Array(npc['eventMappings']).each_with_index do |mapping, i|
            capture = mapping.is_a?(Hash) ? mapping['addCapture'] : nil
            next unless capture.is_a?(Hash) && capture['secret'].is_a?(String)

            out << { path: "#{entry[:path]}/eventMappings[#{i}]", kind: :capture, secret: capture['secret'], object_id: nil }
          end
        end
        networks = scenario['networks'].is_a?(Hash) ? scenario['networks'] : {}
        networks.each do |net_id, net|
          wifi = net.is_a?(Hash) ? net['wifi'] : nil
          next unless wifi.is_a?(Hash) && wifi['psk'].is_a?(String)

          out << { path: "networks/#{net_id}/wifi", kind: :wifi, secret: wifi['psk'], object_id: nil }
        end
        out
      end

      # The accounts a sign-in PC admits.
      def admitted_accounts(pc, scenario)
        AccessIdentities.room_npcs(scenario).select { |e| AccessIdentities.account_admitted?(pc, e[:npc]) }
                        .map { |e| e[:npc]['id'] }
      end

      # Can this text be read without the account? Not in the account's own profiles (one
      # whose `for` names it, or that admits no other account), and not in the contents of
      # a sign-in PC that only that account can open.
      def readable_without?(text, npc, scenario)
        scope = text[:scope]
        return true unless scope

        if scope[:profile]
          profile = scenario['accountProfiles'][scope[:profile]]
          acl = profile.is_a?(Hash) ? profile['for'] : nil
          return false if acl.is_a?(Hash) && Array(acl['people']).map(&:to_s).include?(npc['id'].to_s)

          others = AccessIdentities.room_npcs(scenario).map { |e| e[:npc] }.select { |n| AccessIdentities.account?(n) }
                                   .reject { |n| n['id'] == npc['id'] }
          return others.any? { |n| AccessIdentities.acl_admits?(acl, n) }
        end
        if scope[:pc]
          pc = AccessIdentities.sign_in_pcs(scenario).find { |e| e[:object]['id'].to_s == scope[:pc] }&.dig(:object)
          return true unless pc

          return admitted_accounts(pc, scenario) != [npc['id']]
        end
        true
      end

      # The object a passwordPattern names, or nil: a room object or item (any depth) or a
      # profile item, by id.
      def find_object(scenario, id)
        return nil unless id.is_a?(String) && !id.empty?

        found = AccessIdentities.room_objects(scenario).find { |e| e[:object]['id'] == id }
        return found[:object] if found

        profiles = scenario['accountProfiles'].is_a?(Hash) ? scenario['accountProfiles'] : {}
        stack = profiles.values.select { |p| p.is_a?(Hash) }.flat_map { |p| Array(p['contents']) }
        until stack.empty?
          obj = stack.shift
          next unless obj.is_a?(Hash)
          return obj if obj['id'] == id

          stack.concat(Array(obj['contents']))
        end
        nil
      end

      # Is a guessable password backed (7.2, tests 1 to 3)? Returns
      #   { backed:, pieces: [{ index:, kind:, sources: [{ path:, locks: }], clue: bool, case_differs: bool }],
      #     pattern: { id:, path:, readable:, whole:, found: }, capitals:, symbols:, case_changes:, total:,
      #     outside: bool, written: [paths], reasons: [strings] }
      # Never holds the password or text from it.
      def backing(npc, scenario, texts, pattern_id = nil)
        password = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
        result = { backed: false, pieces: [], pattern: nil, capitals: 0, symbols: 0, case_changes: 0, total: 0, outside: false,
                   written: [], reasons: [] }
        return result unless password.is_a?(String) && !password.empty?

        eligible = texts.select { |t| readable_without?(t, npc, scenario) }
        clue_obj = find_object(scenario, pattern_id)
        clue_texts = pattern_id ? eligible.select { |t| t[:object_id] == pattern_id } : []
        clue_text = clue_texts.map { |t| t[:text] }.join("\n")
        clue_whole = clue_text.include?(password)
        result[:pattern] = { id: pattern_id, found: !clue_obj.nil?, readable: !clue_texts.empty?, whole: clue_whole,
                             path: clue_texts.first&.dig(:path), locks: clue_texts.first ? clue_texts.first[:locks] : [],
                             room: clue_texts.first&.dig(:room), name: clue_texts.first&.dig(:name) }
        result[:written] = texts.select { |t| t[:text].include?(password) }.map { |t| t[:path] }.uniq

        list = pieces(password)
        result[:total] = list.size
        result[:capitals] = capitals(password)
        result[:symbols] = list.count { |p| p[:kind] == :symbol }
        list.each_with_index do |piece, i|
          entry = { index: i + 1, kind: piece[:kind], sources: [], clue: false, case_differs: false,
                    common: piece[:kind] == :symbol && COMMON_PUNCTUATION.include?(piece[:text]) }
          case piece[:kind]
          when :word, :number
            matcher = piece[:kind] == :word ? method(:word_in?) : method(:number_in?)
            exact = false
            matched = false
            eligible.each do |t|
              next unless matcher.call(piece[:text], t[:text])

              matched = true
              exact ||= piece[:kind] == :number || word_exact_in?(piece[:text], t[:text])

              if t[:object_id] && t[:object_id] == pattern_id
                entry[:clue] = true
              else
                entry[:sources] << { path: t[:path], locks: t[:locks], room: t[:room], name: t[:name] }
              end
            end
            # Words match without case; when no text holds the word in the password's own
            # case, the player cannot know it unless the pattern clue states it.
            entry[:case_differs] = matched && !exact
          when :fixed
            entry[:clue] = !clue_whole && fixed_in?(piece[:text], clue_text)
          when :symbol
            entry[:clue] = !clue_whole && clue_text.include?(piece[:text])
          end
          entry[:sources].uniq!
          result[:pieces] << entry
        end

        result[:case_changes] = result[:pieces].count { |p| p[:case_differs] }
        result[:outside] = result[:pieces].any? { |p| %i[word number].include?(p[:kind]) && p[:sources].any? }
        unsourced = result[:pieces].reject { |p| p[:sources].any? || p[:clue] }
        result[:reasons] << 'no pattern clue (habits.passwordPattern)' unless pattern_id
        result[:reasons] << 'the pattern clue names no object' if pattern_id && !clue_obj
        result[:reasons] << 'the pattern clue is not readable without the account' if clue_obj && clue_texts.empty?
        result[:reasons] << 'the pattern clue holds the whole password' if clue_whole
        result[:reasons] << "#{unsourced.size} piece#{unsourced.size == 1 ? '' : 's'} with no source" unless unsourced.empty?
        unless result[:outside]
          result[:reasons] << 'no word or number part has a source outside the pattern clue'
        end
        result[:backed] = result[:reasons].empty?
        result
      end

      # Are every word part and number part sourced, ignoring the pattern clue (for
      # `strong`)? False when the password has none.
      def parts_all_sourced?(npc, scenario, texts)
        password = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
        return false unless password.is_a?(String)

        parts = pieces(password).select { |p| %i[word number].include?(p[:kind]) }
        return false if parts.empty?

        eligible = texts.select { |t| readable_without?(t, npc, scenario) }
        parts.all? do |piece|
          matcher = piece[:kind] == :word ? method(:word_in?) : method(:number_in?)
          eligible.any? { |t| matcher.call(piece[:text], t[:text]) }
        end
      end

      # The other secret homes that equal this account's password.
      def reuse_homes(npc, scenario, homes = secret_homes(scenario))
        password = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
        return [] unless password.is_a?(String) && !password.empty?

        homes.select { |h| h[:secret] == password && !(h[:kind] == :account && h[:npc_id] == npc['id']) }
      end
    end
  end
end
