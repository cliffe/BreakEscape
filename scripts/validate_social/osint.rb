# frozen_string_literal: true

# Social lints for the osint area (P2-B, phase 2): 02 N8 and the 00 section 11 "Lint field list".
#
#   - every `intelFacts` id has `se_intel_<id>` declared in globalVariables, default false, not imported
#     (runs for any scenario with a `social` key, osint data or not; P1-M left it)
#   - when `social.osint` exists:
#       * `se_osint_state` declared with default {}
#       * site, page, tool and element ids unique; element ids are the facts' `source`
#       * every fact (bar call-granted and mail-highlight-granted) granted by exactly one element,
#         and the fact's `source` equals that element's id
#       * every `fact`, `showIf`, `unlockedBy` and `card` resolves
#       * `osint-workstation` siteIds resolve
#   - the host/brand lint over the lint-field-list fields this block and the mail data author:
#     `sites[].url`, `social.people[].address`, OSINT block `address`, `provides[].address`,
#     `mailClient.accounts[]` (and `createMenu[]`) `address`, `mailClient.contacts[].addresses[]`, and
#     host-shaped tokens plus brand words in `conceptCards[].text`. The landing-page fields
#     (`domain`, `browserDomain`, `realDomain`, `linkText`, `capture.address`, brand `name`) belong to
#     landing.rb (P5-C), which can reuse ValidateSocial::Osint::HostLint.
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb.
module ValidateSocial
  module Osint
    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      issues.concat(intel_declared(ctx))
      issues.concat(host_fields(ctx))
      osint = ctx.social['osint']
      issues.concat(workstations(ctx, osint))
      return issues unless osint.is_a?(Hash)

      issues.concat(osint_state(ctx))
      issues.concat(structure(ctx, osint))
      issues.concat(site_types(ctx, osint))
      issues.concat(assets_and_authors(ctx, osint))
      issues.concat(references(ctx, osint))
      issues.concat(award_paths(ctx, osint))
      issues
    end

    def self.err(msg)
      Mail.err(msg)
    end

    def self.warn_(msg)
      Mail.warn_(msg)
    end

    # ---- se_intel_<id> and se_osint_state -------------------------------------------

    def self.intel_declared(ctx)
      issues = []
      Mail.facts(ctx).each_key do |fid|
        name = "se_intel_#{fid}"
        d = Mail.declared_written(ctx, name, "fact '#{fid}' of social.intelFacts")
        if d
          issues << d
        elsif ctx.all_globals[name] != false
          issues << err("global '#{name}' (fact '#{fid}') must be declared with the default false, not #{ctx.all_globals[name].inspect}")
        end
      end
      issues
    end

    def self.osint_state(ctx)
      d = Mail.declared_written(ctx, 'se_osint_state', 'the OSINT browser visited-pages state')
      return [d] if d
      return [] if ctx.all_globals['se_osint_state'] == {}

      [err("global 'se_osint_state' must be declared with the default {} (an object), not #{ctx.all_globals['se_osint_state'].inspect}")]
    end

    # ---- structure: ids -------------------------------------------------------------

    def self.sites(osint)
      Mail.hash_list(osint['sites'])
    end

    def self.structure(ctx, osint)
      issues = []
      issues << err('social.osint.sites must be a non-empty array') if sites(osint).empty?
      issues.concat(Mail.unique_ids(sites(osint), 'social.osint.sites'))
      sites(osint).each do |s|
        sw = "social.osint.sites[#{s['id']}]"
        issues << err("#{sw}.url is missing or empty; the address bar would be blank") if Mail.blank?(s['url'])
        issues.concat(Mail.unique_ids(Mail.hash_list(s['pages']), "#{sw}.pages"))
        Mail.hash_list(s['pages']).each do |pg|
          issues.concat(Mail.unique_ids(Mail.hash_list(pg['blocks']), "#{sw}.pages[#{pg['id']}].blocks"))
        end
      end
      issues.concat(Mail.unique_ids(Mail.hash_list(osint['tools']), 'social.osint.tools'))
      ids = Hash.new { |h, k| h[k] = [] }
      element_ids(osint, 'social.osint') { |id, where| ids[id] << where }
      ids.each do |id, where|
        issues << err("OSINT element id '#{id}' is used more than once (#{where.join(', ')}); a fact's source names one element") if where.length > 1
      end
      elements(osint).each do |e|
        issues << err("#{e[:where]} grants fact '#{e[:fact]}' but has no id; the fact's source must name this element") if e[:id].to_s.empty?
      end
      issues
    end

    SITE_TYPES = %w[company-site social document].freeze

    # osint-model.js siteAllowed drops a site whose type is missing or unknown, so it never shows.
    # The "awareness" profile also drops document sites and the tools panel.
    def self.site_types(ctx, osint)
      issues = []
      sites(osint).each do |s|
        sw = "social.osint.sites[#{s['id']}]"
        if !s['type'].is_a?(String) || s['type'].empty?
          issues << err("#{sw}.type is missing; the browser hides a site with no type (one of #{SITE_TYPES.join(', ')})")
        elsif !SITE_TYPES.include?(s['type'])
          issues << err("#{sw}.type '#{s['type']}' is not one of #{SITE_TYPES.join(', ')}; the browser would hide the site")
        elsif osint['profile'] == 'awareness' && s['type'] == 'document'
          issues << warn_("#{sw} is a document site, which the 'awareness' profile hides; it can never be opened")
        end
      end
      if osint['profile'] == 'awareness' && Mail.hash_list(osint['tools']).any?
        issues << warn_("social.osint defines tools, which the 'awareness' profile hides; the tools panel never shows")
      end
      issues
    end

    ASSETS = 'public/break_escape/assets'

    def self.asset_missing?(ctx, rel)
      !File.exist?(File.join(ctx.repo_root.to_s, ASSETS, rel))
    end

    # Image files the browser loads (missing ones show a broken image or fall back), and post authors.
    # Block `src` and card `image` are relative to assets/, `logo` to assets/logos/, avatars to
    # assets/characters/ (a bare key or key.png).
    def self.assets_and_authors(ctx, osint)
      issues = []
      people = Mail.people_ids(ctx)
      sites(osint).each do |s|
        issues << err("social.osint.sites[#{s['id']}].logo is true; give a file under #{ASSETS}/logos/, or false for no logo") if s['logo'] == true
        next if Mail.blank?(s['logo'])

        rel = "logos/#{s['logo'].sub(%r{\A/+}, '')}"
        issues << warn_("social.osint.sites[#{s['id']}].logo '#{s['logo']}' is not a file under #{ASSETS}/logos/") if asset_missing?(ctx, rel)
      end
      walk(osint, 'social.osint') do |h, path|
        if h['kind'] == 'image' && !Mail.blank?(h['src']) && asset_missing?(ctx, h['src'].sub(%r{\A/+}, ''))
          issues << warn_("#{path}#{h['id'] ? "[#{h['id']}]" : ''}.src '#{h['src']}' is not a file under #{ASSETS}/ (src is relative to assets/)")
        end
        if h.key?('author')
          if !h['author'].is_a?(String) || !people.include?(h['author'])
            issues << err("#{path}#{h['id'] ? "[#{h['id']}]" : ''}.author #{h['author'].inspect} is not a social.people id")
          end
        end
        if h.key?('person') && h.key?('posts') && !Mail.blank?(h['avatar'])
          issues.concat(avatar_check(ctx, h['avatar'], "#{path}.avatar"))
        end
      end
      Mail.hash_list(ctx.social['people']).each do |p|
        issues.concat(avatar_check(ctx, p['avatar'], "social.people[#{p['id']}].avatar")) unless Mail.blank?(p['avatar'])
      end
      Mail.hash_list(ctx.social['conceptCards']).each do |c|
        next if Mail.blank?(c['image'])

        issues << warn_("social.conceptCards[#{c['id']}].image '#{c['image']}' is not a file under #{ASSETS}/ (image is relative to assets/)") if asset_missing?(ctx, c['image'].sub(%r{\A/+}, ''))
      end
      issues
    end

    def self.avatar_check(ctx, avatar, where)
      rel = "characters/#{avatar.sub(/\.png\z/, '')}.png"
      asset_missing?(ctx, rel) ? [warn_("#{where} '#{avatar}' is not a file under #{ASSETS}/characters/")] : []
    end

    # Every hash that carries a `fact`: a block, a post, a result, a metadata field. `unlockedBy`
    # holds a `fact` too but is a condition, so the walk skips it.
    def self.elements(osint)
      out = []
      walk(osint, 'social.osint', skip: %w[unlockedBy]) do |h, path|
        out << { id: h['id'], fact: h['fact'], where: "#{path}#{h['id'] ? "[#{h['id']}]" : ''}" } if h['fact'].is_a?(String)
      end
      out
    end

    # Yields [id, path] for every block, post, result and metadata field, with or without a fact:
    # a fact's `source` names one of them, so the ids share one namespace.
    def self.element_ids(node, path, key = nil, &blk)
      case node
      when Hash
        blk.call(node['id'], path) if %w[blocks posts results fields].include?(key) && node['id'].is_a?(String)
        node.each { |k, v| element_ids(v, "#{path}.#{k}", k, &blk) unless k == 'unlockedBy' }
      when Array
        node.each_with_index { |v, i| element_ids(v, "#{path}[#{i}]", key, &blk) }
      end
    end

    # Yields every Hash under `node` with its path.
    def self.walk(node, path, skip: [], &blk)
      case node
      when Hash
        blk.call(node, path)
        node.each do |k, v|
          next if skip.include?(k)

          walk(v, "#{path}.#{k}", skip: skip, &blk)
        end
      when Array
        node.each_with_index { |v, i| walk(v, "#{path}[#{i}]", skip: skip, &blk) }
      end
    end

    # ---- references: fact, showIf, unlockedBy, card ------------------------------------

    def self.references(ctx, osint)
      issues = []
      facts = Mail.facts(ctx)
      cards = Mail.hash_list(ctx.social['conceptCards']).filter_map { |c| c['id'] if c['id'].is_a?(String) }.to_set
      # a social site has one page per profile, whose id is the profile's person (osint-model.js visiblePages)
      site_ids = sites(osint).to_h do |s|
        pages = Mail.hash_list(s['pages']).filter_map { |p| p['id'] } + Mail.hash_list(s['profiles']).filter_map { |p| p['person'] }
        [s['id'], pages.to_set]
      end

      elements(osint).each do |e|
        issues << err("#{e[:where]}.fact '#{e[:fact]}' is not a social.intelFacts id") unless facts.key?(e[:fact])
      end
      walk(osint, 'social.osint') do |h, path|
        if h.key?('showIf')
          # one global name (02: "showIf names a global"); osint-model.js showIfHolds reads only
          # a string and treats anything else as "always show"
          g = h['showIf']
          if !g.is_a?(String)
            issues << err("#{path}.showIf must be one global name (a string), not #{g.inspect}; the browser ignores anything else and always shows the block")
          elsif !ctx.all_globals.key?(g)
            issues << err("#{path}.showIf '#{g}' is not a global declared in globalVariables; the block would never show")
          end
        end
        if h.key?('card') && !cards.include?(h['card'])
          issues << err("#{path}.card '#{h['card']}' is not a social.conceptCards id")
        end
        issues.concat(unlocked_by(h['unlockedBy'], "#{path}.unlockedBy", facts, site_ids)) if h.key?('unlockedBy')
      end
      issues
    end

    def self.unlocked_by(cond, where, facts, site_ids)
      return [err("#{where} must be { \"visited\": ... } or { \"fact\": ... }")] unless cond.is_a?(Hash)

      keys = cond.keys
      return [err("#{where} must hold exactly one of visited or fact (has #{keys.inspect})")] unless keys.length == 1 && %w[visited fact].include?(keys.first)

      if cond.key?('fact')
        facts.key?(cond['fact']) ? [] : [err("#{where}.fact '#{cond['fact']}' is not a social.intelFacts id")]
      else
        v = cond['visited']
        site, page = v.to_s.split('.', 2)
        if !v.is_a?(String) || !site_ids.key?(site)
          [err("#{where}.visited '#{v}' is not a site id or siteId.pageId in social.osint.sites")]
        elsif page && !site_ids[site].include?(page)
          [err("#{where}.visited '#{v}': site '#{site}' has no page '#{page}'")]
        else
          []
        end
      end
    end

    # ---- one award path per fact ----------------------------------------------------

    # fact id => [highlight paths] and fact id => [call grant paths]
    def self.highlight_grants(ctx)
      out = Hash.new { |h, k| h[k] = [] }
      Mail.hash_list(Mail.mail_client(ctx)['seededMessages']).each do |m|
        Mail.hash_list(m['highlights']).each { |h| out[h['grants']] << "#{m['id']}/#{h['id']}" if h['grants'].is_a?(String) }
      end
      out
    end

    def self.call_grants(ctx)
      out = Hash.new { |h, k| h[k] = [] }
      walk(ctx.social['pretextNpcs'], 'social.pretextNpcs') do |h, path|
        next unless h['grants'].is_a?(Hash)

        Array(h['grants']['intel']).each { |f| out[f] << path if f.is_a?(String) }
      end
      out
    end

    # `grant_fact` actions anywhere in the scenario outside social.osint (the slice's stand-ins).
    def self.action_grants(ctx)
      out = Hash.new { |h, k| h[k] = [] }
      rest = ctx.json.reject { |k, _| k == 'social' }
      walk(rest, '') do |h, path|
        out[h['fact']] << path if h['type'] == 'grant_fact' && h['fact'].is_a?(String)
      end
      out
    end

    def self.award_paths(ctx, osint)
      issues = []
      hl = highlight_grants(ctx)
      calls = call_grants(ctx)
      actions = action_grants(ctx)
      by_fact = Hash.new { |h, k| h[k] = [] }
      elements(osint).each { |e| by_fact[e[:fact]] << e }

      Mail.facts(ctx).each do |fid, f|
        els = by_fact[fid]
        outside = hl.key?(fid) || calls.key?(fid)
        if els.length > 1
          issues << err("fact '#{fid}' is granted by more than one OSINT element (#{els.map { |e| e[:id] }.join(', ')}); each fact has one award path, and the second page shows the same words unmarked")
        elsif els.length == 1
          e = els.first
          if f['source'] != e[:id]
            issues << err("fact '#{fid}' source #{f['source'].inspect} must equal the id of the element that grants it ('#{e[:id]}')")
          end
          issues << err("fact '#{fid}' is granted by OSINT element '#{e[:id]}' and also by a #{hl.key?(fid) ? 'mail highlight' : 'pretext call'}; each fact has one award path") if outside
          issues << warn_("fact '#{fid}' is granted by OSINT element '#{e[:id]}' and also by a grant_fact action (#{actions[fid].first}); two award paths") if actions.key?(fid)
        elsif !outside
          if actions.key?(fid)
            issues << warn_("fact '#{fid}' is granted only by a grant_fact action (#{actions[fid].first}), not by an OSINT element; fine for a stand-in, but the lab needs one OSINT element per fact")
          else
            issues << err("fact '#{fid}' is granted by nothing: no OSINT element, mail highlight, pretext call ask or grant_fact action names it")
          end
        end
      end
      issues
    end

    # ---- osint-workstation objects --------------------------------------------------

    def self.workstations(ctx, osint)
      issues = []
      known = osint.is_a?(Hash) ? sites(osint).filter_map { |s| s['id'] }.to_set : Set.new
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'osint-workstation'

        next unless osint.is_a?(Hash) # no social.osint: nothing to resolve against
        md = obj['minigameData']
        next if md.nil? || (md.is_a?(Hash) && !md.key?('siteIds')) # no list: every site

        ids = md.is_a?(Hash) ? md['siteIds'] : nil
        if !ids.is_a?(Array) || ids.empty?
          issues << err("#{path}: minigameData.siteIds must be a non-empty array of social.osint.sites ids (omit it to offer every site)")
          next
        end
        ids.each do |sid|
          issues << err("#{path}: minigameData.siteIds names '#{sid}', which is not a social.osint.sites id") unless known.include?(sid)
        end
      end
      issues
    end

    # ---- host and brand lint ---------------------------------------------------------

    # Reusable by landing.rb. Rules from 00 section 11 "Lint field list": host-only `.example`
    # (strip the scheme and everything from the first `/`; for an address, the part after the last
    # `@`), the ASCII check, and the fold-and-match denylist.
    module HostLint
      # Real brands that must not appear in a listed field. Matched after folding (case, look-alike
      # digits and symbols, separators removed), so `paypa1` and `pay.pal` both hit `paypal`.
      # Short names match a whole label only, so a longer ordinary word never trips them.
      LONG = %w[paypal paypall microsoft outlook onedrive sharepoint google gmail youtube amazon icloud
                netflix facebook instagram whatsapp twitter linkedin dropbox docusign wetransfer
                barclays natwest santander halifax revolut nationwide wellsfargo citibank
                bankofamerica coinbase binance royalmail fedex spotify airbnb github gitlab].freeze
      SHORT = %w[ebay dhl ups hsbc dpd uber zoom visa amex chase apple adobe yahoo stripe lloyds evri hmrc monzo
                 venmo].freeze
      FOLD = { '0' => 'o', '1' => 'l', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't', '8' => 'b',
               '@' => 'a', '$' => 's', '!' => 'i', '|' => 'l' }.freeze
      # TLDs the host-shaped-token rule knows. A token ending in one of these, and not `.example`, fails.
      TLDS = %w[com org net edu gov mil int info biz uk us ca au nz ie de fr es it nl be ch at se no dk fi pl ru cn jp
                kr in br mx za io co ai app dev me tv xyz online site shop cloud tech top club store live news
                email link page support help bank pay money services solutions group].freeze
      # Dotted names that are files, not hosts (a few extensions collide with TLDs).
      FILE_EXTS = %w[pdf doc docx docm xls xlsx xlsm csv txt odt ods odp ppt pptx zip rar tar gz exe msi js json xml
                     html htm png jpg jpeg gif svg md rtf py sh bat ps1].freeze

      def self.fold(str)
        s = str.to_s.downcase.each_char.map { |c| FOLD.fetch(c, c) }.join
        s.gsub(/[^a-z]/, '')
      end

      # Which denylisted brand a list of labels (or one word) contains, or nil. A long brand matches
      # anywhere in the folded, joined text (`pay.pal`, `paypa1`); a short one matches only a whole
      # piece split on dots and hyphens (`apple-pay` hits, `pineapple` does not).
      def self.brand_in(labels)
        labels = Array(labels)
        joined = labels.map { |l| fold(l) }.join
        hit = LONG.find { |b| joined.include?(b) }
        return hit if hit

        pieces = labels.flat_map { |l| l.to_s.split(/[.-]/) }.map { |l| fold(l) }
        SHORT.find { |b| pieces.include?(b) }
      end

      # [host, nil] or [nil, reason]: the host-only part of a url or an address.
      def self.host_of(value, address: false)
        s = value.to_s.strip
        s = s.sub(%r{\A[a-zA-Z][a-zA-Z0-9+.-]*://}, '')
        s = s.split('/', 2).first.to_s
        s = s.split('@').last.to_s if address || s.include?('@')
        s = s.sub(/:\d+\z/, '')
        s
      end

      # raw_ok: true when the non-ASCII characters of `value` were written as \u escapes in the
      # source (see Osint.ascii_issue). Returns an issue string or nil.
      def self.field_issue(value, where, ascii_ok: nil, address: false)
        return "#{where} is missing or empty" unless value.is_a?(String) && !value.strip.empty?

        host = host_of(value, address: address)
        problems = []
        problems << 'contains a non-ASCII character in the source text (write look-alike letters as a \\u escape only where a lookalike is the point)' unless value.ascii_only? || ascii_ok
        problems << "host '#{host}' does not end .example" unless host.downcase.end_with?('.example')
        brand = brand_in(host.split('.'))
        problems << "host '#{host}' contains the real brand '#{brand}'" if brand
        problems.empty? ? nil : "#{where} #{value.inspect}: #{problems.join('; ')}"
      end

      # Host-shaped tokens in free text: [token, ...] ending in a known public TLD and not .example.
      def self.host_tokens(text)
        t = text.to_s.gsub(/[[:alnum:]._+-]+@/, '@')
        t.scan(/(?<![[:alnum:].@-])[[:alnum:]][[:alnum:]-]*(?:\.[[:alnum:]-]+)+/).filter_map do |tok|
          last = tok.split('.').last.downcase
          next if FILE_EXTS.include?(last)
          next if last == 'example' # handled below: ASCII and denylist still apply

          tok if TLDS.include?(last) || !tok.ascii_only?
        end.then { |bad| bad + example_tokens(t) }
      end

      # `.example` tokens still get the ASCII check and the denylist; returns those that fail either.
      def self.example_tokens(text)
        text.scan(/(?<![[:alnum:].@-])[[:alnum:]][[:alnum:]-]*(?:\.[[:alnum:]-]+)*\.example\b/i).select do |tok|
          !tok.ascii_only? || brand_in(tok.split('.'))
        end
      end

      # Brand words in prose: single words and adjacent pairs ("pay pal").
      def self.brand_words(text)
        words = text.to_s.scan(/[[:alnum:]@$!|]+/)
        found = []
        words.each_with_index do |w, i|
          nxt = words[i + 1]
          if brand_in([w])
            found << w
          elsif nxt && !brand_in([nxt]) && brand_in(["#{w}#{nxt}"])
            found << "#{w} #{nxt}"
          end
        end
        found.uniq
      end
    end

    # The fields' non-ASCII text is checked on the raw JSON source when the context carries it
    # (ctx.raw, a rendered string): a \u escape in the source passes, a raw character fails. Without
    # it the parsed value is all there is, so any non-ASCII character fails.
    def self.ascii_ok?(ctx, value)
      return true if value.to_s.ascii_only?

      raw = ctx.respond_to?(:raw) ? ctx.raw : nil
      return false unless raw.is_a?(String)

      !raw.include?(value.to_s)
    end

    def self.lint_field(ctx, value, where, address: false)
      return [] if value.nil?

      msg = HostLint.field_issue(value, where, ascii_ok: ascii_ok?(ctx, value), address: address)
      msg ? [err(msg)] : []
    end

    # A page `path` is the part appended after the site's host (the address bar shows
    # `site.url` + `path`), so it carries no host of its own and a normal path such as
    # "/careers" must pass. It is still linted like free text for an accidentally embedded
    # host or real brand: any host-shaped token in it must be ASCII, end .example and name
    # no real brand, and no real brand word may appear (00 §11; gap 15 — a path is not a host).
    def self.lint_path(ctx, value, where)
      return [] if value.nil?
      return [err("#{where} is missing or empty")] unless value.is_a?(String) && !value.strip.empty?

      issues = []
      issues << err("#{where} #{value.inspect} contains a non-ASCII character in the source text") unless value.ascii_only? || ascii_ok?(ctx, value)
      HostLint.host_tokens(value).each do |tok|
        issues << err("#{where} #{value.inspect} holds the host-shaped token '#{tok}'; a host in a path must be ASCII, end .example and name no real brand")
      end
      HostLint.brand_words(value).each do |w|
        issues << err("#{where} #{value.inspect} names the real brand '#{w}'; paths use invented, .example hosts")
      end
      issues
    end

    def self.host_fields(ctx)
      issues = []
      s = ctx.social
      osint = s['osint']
      if osint.is_a?(Hash)
        sites(osint).each do |site|
          issues.concat(lint_field(ctx, site['url'], "social.osint.sites[#{site['id']}].url")) unless Mail.blank?(site['url'])
        end
        walk(osint, 'social.osint') do |h, path|
          issues.concat(lint_field(ctx, h['address'], "#{path}.address", address: true)) if h.key?('address')
        end
        # a page may carry its own `url` (address-bar.js formatAddress); it is shown as typed, so it gets the same lint
        sites(osint).each do |site|
          Mail.hash_list(site['pages']).each do |pg|
            issues.concat(lint_field(ctx, pg['url'], "social.osint.sites[#{site['id']}].pages[#{pg['id']}].url")) if pg.key?('url')
            issues.concat(lint_path(ctx, pg['path'], "social.osint.sites[#{site['id']}].pages[#{pg['id']}].path")) if pg.key?('path')
          end
        end
      end
      Mail.hash_list(s['people']).each do |p|
        issues.concat(lint_field(ctx, p['address'], "social.people[#{p['id']}].address", address: true)) if p.key?('address')
      end
      Mail.facts(ctx).each do |fid, f|
        Mail.hash_list(f['provides']).each_with_index do |pr, i|
          next unless pr['type'] == 'address' && pr.key?('address')

          issues.concat(lint_field(ctx, pr['address'], "social.intelFacts.#{fid}.provides[#{i}].address", address: true))
        end
      end
      mc = Mail.mail_client(ctx)
      Mail.hash_list(mc['accounts']).each do |a|
        issues.concat(lint_field(ctx, a['address'], "social.mailClient.accounts[#{a['id']}].address", address: true)) if a.key?('address')
        Mail.hash_list(a['createMenu']).each do |m|
          issues.concat(lint_field(ctx, m['address'], "social.mailClient.accounts[#{a['id']}].createMenu[#{m['id']}].address", address: true)) if m.key?('address')
        end
      end
      Mail.hash_list(mc['contacts']).each do |c|
        Mail.list(c['addresses']).each_with_index do |a, i|
          issues.concat(lint_field(ctx, a, "social.mailClient.contacts[#{c['id']}].addresses[#{i}]", address: true))
        end
      end
      issues.concat(card_text(ctx))
      issues
    end

    def self.card_text(ctx)
      issues = []
      Mail.hash_list(ctx.social['conceptCards']).each do |c|
        next unless c['text'].is_a?(String)

        where = "social.conceptCards[#{c['id']}].text"
        HostLint.host_tokens(c['text']).each do |tok|
          issues << err("#{where} holds the host-shaped token '#{tok}'; a host in card text must be ASCII, end .example and name no real brand")
        end
        HostLint.brand_words(c['text']).each do |w|
          issues << err("#{where} names the real brand '#{w}'; card prose uses invented brands")
        end
      end
      issues
    end
  end
end
