# frozen_string_literal: true

# Social lints for the landing-page builder (P5-C, phase 5): 07 N6 and N7 id check, the
# 00 section 11 "Lint field list" for the landing-page fields, and the expectedLink
# cross-check P1-M left (mail.rb target_expected_link is shape-only and defers the brand
# and host checks here).
#
# Landing owns these lint-field-list fields (osint.rb owns the rest, and runs for every
# scenario with a `social` key, so landing never re-lints those):
#   - landingPages[].brands[].realDomain        host-only .example, ASCII, denylist
#   - landingPages[].brands[].name              denylist only
#   - landingPages[].brands[].domains[].domain  allowlist (raw labels) then ASCII/homograph then denylist
#   - landingPages[].brands[].domains[].browserDomain  ASCII, .example, denylist, punycode == domain
#   - landingPages[].linkText                   host-only .example, ASCII, denylist
#   - landingPages[].capture.address            host-only .example, ASCII, denylist
#   - phishTargets[].expectedLink.realDomain    host-only .example, ASCII, denylist
#   - phishTargets[].expectedLink.brandId       names a brand on the page that serves the target
#
# Structure / reference checks (07 N6, N7):
#   - page ids unique; `targets` has at least one key (exactly one in the lab), every key a
#     phishTargets id whose required factors include linkCredible
#   - a `page-builder` object's landingPageId names a page with exactly one `targets` key,
#     and that key is a phishTargets id
#   - each brand `look` is `generic` or `parody`; `decoyWords` pass the denylist
#   - every `strings` value is non-empty and uses only {firstName} {shown} {real} {linkText}
#   - every domain tier used by the menu has a defender string
#   - every `conceptCards` id on a page resolves to a social.conceptCards id
#
# The denylist and confusable fold are reused from ValidateSocial::Osint::HostLint (P2-B):
# the design's "PayPal, Microsoft, the big UK banks and the like" are already on its LONG /
# SHORT lists, so landing adds no list of its own. The ASCII source check reads ctx.raw
# (P2-W) through Osint.ascii_ok?.
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb.
module ValidateSocial
  module Landing
    HL = Osint::HostLint

    ALLOWED_PLACEHOLDERS = %w[firstName shown real linkText].freeze

    # Look-alike letters from other alphabets, mapped to their Latin twin. Used only for the
    # homograph exception: a `trick: "homograph"` domain may carry exactly one of these.
    CONFUSABLES = {
      # Cyrillic
      "а" => 'a', "е" => 'e', "о" => 'o', "р" => 'p', "с" => 'c',
      "х" => 'x', "у" => 'y', "і" => 'i', "ј" => 'j', "ѕ" => 's',
      "һ" => 'h', "ԁ" => 'd', "к" => 'k', "в" => 'b', "м" => 'm',
      "т" => 't', "н" => 'h',
      # Greek
      "ο" => 'o', "α" => 'a', "ι" => 'i', "ρ" => 'p', "υ" => 'u',
      "κ" => 'k', "ν" => 'v', "χ" => 'x', "ε" => 'e', "τ" => 't'
    }.freeze

    # Defender-string key for a domain tier (07 section 4, step-6 line). These are the keys
    # landing-page-model.js reads for the per-tier step-6 line (`defDomainTier<N>`), so the
    # model's names win (build_log/P5-E.md point 1): a `strings` override only takes effect if
    # it uses the same key, and the author writes one per tier the menu uses.
    def self.tier_defender_key(tier)
      "defDomainTier#{tier}"
    end

    def self.err(msg)
      Mail.err(msg)
    end

    def self.warn_(msg)
      Mail.warn_(msg)
    end

    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, social, raw)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      pages = Mail.hash_list(ctx.social['landingPages'])
      issues = []
      issues.concat(expected_link(ctx, pages))
      return issues if pages.empty?

      issues.concat(Mail.unique_ids(pages, 'social.landingPages'))
      cards = Mail.hash_list(ctx.social['conceptCards']).filter_map { |c| c['id'] if c['id'].is_a?(String) }.to_set
      phish = phish_target_ids(ctx)
      pages.each { |pg| issues.concat(page_checks(ctx, pg, cards, phish)) }
      issues.concat(page_builder_objects(ctx, pages, phish))
      issues
    end

    # ---- shared data ----------------------------------------------------------------

    def self.phish_target_ids(ctx)
      Mail.hash_list(ctx.social['phishTargets']).filter_map { |t| t['id'] if t['id'].is_a?(String) }.to_set
    end

    def self.phish_target(ctx, id)
      Mail.hash_list(ctx.social['phishTargets']).find { |t| t['id'] == id }
    end

    # linkCredible is required when it is in requiredFactors, in factors[] with mode required,
    # or when the target has an expectedLink (00 §2: expectedLink makes linkCredible required).
    def self.requires_link_credible?(target)
      return false unless target.is_a?(Hash)
      return true if Mail.list(target['requiredFactors']).include?('linkCredible')
      return true if target['expectedLink'].is_a?(Hash)

      Mail.hash_list(target['factors']).any? do |f|
        f['id'] == 'linkCredible' && %w[required require req].include?(f['mode'].to_s)
      end
    end

    def self.pages_for_target(pages, target_id)
      pages.select { |pg| pg['targets'].is_a?(Hash) && pg['targets'].key?(target_id) }
    end

    # ---- expectedLink cross-check (P1-M left) ---------------------------------------

    def self.expected_link(ctx, pages)
      issues = []
      Mail.hash_list(ctx.social['phishTargets']).each do |t|
        el = t['expectedLink']
        next unless el.is_a?(Hash)

        tid = t['id']
        where = "social.phishTargets[#{tid}].expectedLink"
        # realDomain gets the host-only .example / ASCII / denylist lint (lint field list).
        issues.concat(Osint.lint_field(ctx, el['realDomain'], "#{where}.realDomain")) unless Mail.blank?(el['realDomain'])

        brand_id = el['brandId']
        next if Mail.blank?(brand_id) # shape already flagged by mail.rb
        next if pages.empty?          # no landing data to resolve against

        serving = pages_for_target(pages, tid)
        if serving.empty?
          issues << err("#{where}.brandId '#{brand_id}' cannot be resolved: no social.landingPages entry lists " \
                        "target '#{tid}' in its targets map, so the builder is never launched for this target")
          next
        end
        brands = serving.flat_map { |pg| Mail.hash_list(pg['brands']) }
        brand = brands.find { |b| b['id'] == brand_id }
        if brand.nil?
          ids = brands.filter_map { |b| b['id'] }.uniq
          issues << err("#{where}.brandId '#{brand_id}' is not a brand on the landing page(s) for target '#{tid}' " \
                        "(brands: #{ids.join(', ')})")
        elsif !Mail.blank?(el['realDomain']) && !Mail.blank?(brand['realDomain']) && el['realDomain'] != brand['realDomain']
          issues << err("#{where}.realDomain '#{el['realDomain']}' does not match brand '#{brand_id}' realDomain " \
                        "'#{brand['realDomain']}'; the link tell compares the two")
        end
      end
      issues
    end

    # ---- per-page checks ------------------------------------------------------------

    def self.page_checks(ctx, pg, cards, phish)
      issues = []
      pid = pg['id']
      where = "social.landingPages[#{pid}]"

      issues.concat(targets_block(ctx, pg, phish, where))
      pg['brands'].is_a?(Array) ? issues.concat(brands_block(ctx, pg, where)) : (issues << err("#{where}.brands must be a non-empty array"))
      issues.concat(Osint.lint_field(ctx, pg['linkText'], "#{where}.linkText")) unless Mail.blank?(pg['linkText'])
      issues.concat(capture_block(ctx, pg, where))
      issues.concat(wordings_block(pg, where))
      issues.concat(strings_block(pg, where))
      issues.concat(tier_defender_strings(pg, where))
      issues.concat(concept_cards(pg, cards, where))
      issues
    end

    def self.targets_block(ctx, pg, phish, where)
      tgts = pg['targets']
      return [err("#{where}.targets must be an object with at least one phishTargets id as a key")] unless tgts.is_a?(Hash) && !tgts.empty?

      issues = []
      tgts.each_key do |tid|
        unless phish.include?(tid)
          issues << err("#{where}.targets key '#{tid}' is not a social.phishTargets id")
          next
        end
        unless requires_link_credible?(phish_target(ctx, tid))
          issues << err("#{where}.targets key '#{tid}' is a target whose required factors do not include linkCredible; " \
                        'a landing page is judged by linkCredible, so the target must require it')
        end
      end
      issues
    end

    def self.brands_block(ctx, pg, where)
      issues = []
      brands = Mail.hash_list(pg['brands'])
      issues << err("#{where}.brands must be a non-empty array") if brands.empty?
      issues.concat(Mail.unique_ids(brands, "#{where}.brands"))
      brands.each do |b|
        bid = b['id']
        bw = "#{where}.brands[#{bid}]"
        look = b['look']
        issues << err("#{bw}.look must be 'generic' or 'parody' (got #{look.inspect})") unless %w[generic parody].include?(look)
        issues.concat(brand_name(b, bw))
        issues.concat(Osint.lint_field(ctx, b['realDomain'], "#{bw}.realDomain")) unless Mail.blank?(b['realDomain'])
        issues.concat(decoy_words(b, bw))
        issues.concat(domain_menu(ctx, b, bw))
      end
      issues
    end

    def self.brand_name(b, bw)
      name = b['name']
      return [] unless name.is_a?(String) && !name.strip.empty?

      HL.brand_words(name).map do |hit|
        err("#{bw}.name #{name.inspect} names the real brand '#{hit}'; landing-page brands are invented")
      end
    end

    def self.decoy_words(b, bw)
      issues = []
      Mail.list(b['decoyWords']).each_with_index do |w, i|
        next unless w.is_a?(String)

        hit = HL.brand_in([w])
        issues << err("#{bw}.decoyWords[#{i}] '#{w}' folds to the real brand '#{hit}'; a decoy word must not be a real brand") if hit
      end
      issues
    end

    # ---- domain menu: allowlist, then ASCII/homograph, then denylist ----------------

    def self.domain_menu(ctx, b, bw)
      issues = []
      brand_words = [b['id'], b['name']].filter_map { |w| w.to_s.downcase if w.is_a?(String) && !w.to_s.strip.empty? }.uniq
      decoys = Mail.list(b['decoyWords']).select { |w| w.is_a?(String) }.map(&:downcase)
      Mail.hash_list(b['domains']).each do |opt|
        oid = opt['id']
        ow = "#{bw}.domains[#{oid}]"
        domain = opt['domain']
        if Mail.blank?(domain)
          issues << err("#{ow}.domain is missing or empty")
          next
        end
        host = HL.host_of(domain)
        issues << err("#{ow}.domain host '#{host}' does not end .example") unless host.downcase.end_with?('.example')
        issues.concat(allowlist(host, brand_words, decoys, ow))
        issues.concat(ascii_homograph(ctx, opt, domain, host, ow))
        issues.concat(denylist_host(host, "#{ow}.domain"))
        issues.concat(browser_domain(ctx, opt, domain, ow))
      end
      issues
    end

    # The allowlist runs first, on the raw labels (lower-cased, hyphens kept, nothing folded):
    # each label must contain the brand word, be within edit distance 2 of it, or equal a decoy.
    def self.allowlist(host, brand_words, decoys, ow)
      labels = host.downcase.sub(/\.example\z/, '').split('.')
      issues = []
      labels.each do |label|
        next if decoys.include?(label)
        next if brand_words.any? { |bwd| label.include?(bwd) || levenshtein(label, bwd) <= 2 }

        issues << err("#{ow}.domain label '#{label}' is neither the brand word, within two edits of it, nor an authored decoyWord; " \
                      'a free-standing real brand is rejected here')
      end
      issues
    end

    def self.levenshtein(a, b)
      a = a.chars
      b = b.chars
      prev = (0..b.length).to_a
      a.each_with_index do |ca, i|
        cur = [i + 1]
        b.each_with_index do |cb, j|
          cur << [prev[j + 1] + 1, cur[j] + 1, prev[j] + (ca == cb ? 0 : 1)].min
        end
        prev = cur
      end
      prev.last
    end

    # ASCII, with the homograph exception. A domain may hold non-ASCII only when the option is
    # trick: "homograph", its source wrote the non-ASCII as a \u escape (ctx.raw), it has exactly
    # one non-ASCII character and that character is in the confusable map.
    def self.ascii_homograph(ctx, opt, domain, _host, ow)
      return [] if domain.ascii_only?

      issues = []
      unless opt['trick'] == 'homograph'
        issues << err("#{ow}.domain holds a non-ASCII character but its trick is #{opt['trick'].inspect}, not 'homograph'; " \
                      'only a homograph option may use a look-alike letter')
        return issues
      end
      unless Osint.ascii_ok?(ctx, domain)
        issues << err("#{ow}.domain is a homograph written as a raw non-ASCII character; write the look-alike letter as a \\u escape only")
      end
      non_ascii = domain.each_char.reject(&:ascii_only?)
      if non_ascii.length != 1
        issues << err("#{ow}.domain has #{non_ascii.length} non-ASCII characters; a homograph carries exactly one look-alike letter")
      end
      bad = non_ascii.reject { |c| CONFUSABLES.key?(c) }
      unless bad.empty?
        issues << err("#{ow}.domain uses the non-ASCII character(s) #{bad.map { |c| format('U+%04X', c.ord) }.join(', ')}, " \
                      'which are not in the confusable map; a homograph uses a known look-alike letter')
      end
      issues
    end

    # NFKC-fold and match a real brand on each label and on the concatenation (HostLint handles
    # the fold and the long/short rule). The confusable letters fold to their Latin twin first,
    # so a Cyrillic-spelled brand is caught too.
    def self.denylist_host(host, where)
      labels = host.split('.').map { |l| defold(l) }
      hit = HL.brand_in(labels)
      hit ? [err("#{where} host '#{host}' folds to the real brand '#{hit}'")] : []
    end

    def self.defold(label)
      label.each_char.map { |c| CONFUSABLES.fetch(c, c) }.join
    end

    def self.browser_domain(ctx, opt, domain, ow)
      bd = opt['browserDomain']
      issues = []
      if opt['trick'] == 'homograph' && !domain.ascii_only?
        if Mail.blank?(bd)
          issues << err("#{ow}.browserDomain is missing; a homograph option shows the punycode form as a teaching contrast")
        else
          want = punycode_host(domain)
          issues << err("#{ow}.browserDomain '#{bd}' is not the punycode encoding of the domain (expected '#{want}')") if bd != want
        end
      end
      return issues if Mail.blank?(bd)

      # browserDomain is always plain ASCII; it also gets the .example / denylist lint.
      issues.concat(Osint.lint_field(ctx, bd, "#{ow}.browserDomain"))
      issues
    end

    # ---- capture / strings / concept cards ------------------------------------------

    def self.capture_block(ctx, pg, where)
      cap = pg['capture']
      return [] unless cap.is_a?(Hash)
      return [] if Mail.blank?(cap['address'])

      Osint.lint_field(ctx, cap['address'], "#{where}.capture.address", address: true)
    end

    # Wording variants (07 §5). The P5-A scorer reads full when `match: true`, zero when
    # `slips: true`, and generic (half) otherwise, so the two zero-tone variants are told apart
    # by the `slips` flag, not by `match: false` alone. A page's set must offer exactly one
    # tone-matching variant and at least one slips variant (the ✗ wording tell), and no variant
    # may be both.
    def self.wordings_block(pg, where)
      wordings = Mail.hash_list(pg['wordings'])
      return [] if wordings.empty?

      issues = []
      wordings.each_with_index do |w, i|
        next unless w['match'] == true && w['slips'] == true

        issues << err("#{where}.wordings[#{w['id'] || i}] sets both match: true and slips: true; a wording cannot match the tone and carry slips")
      end
      matches = wordings.count { |w| w['match'] == true }
      slips = wordings.count { |w| w['slips'] == true }
      if matches != 1
        issues << err("#{where}.wordings must offer exactly one match: true variant (the tone that fits the pretext); found #{matches}")
      end
      if slips.zero?
        issues << err("#{where}.wordings must offer at least one slips: true variant (the spelling/grammar-slips page, scored 0 and the ✗ wording tell)")
      end
      issues
    end

    def self.strings_block(pg, where)
      s = pg['strings']
      return [] unless s.is_a?(Hash)

      issues = []
      walk_strings(s, "#{where}.strings") do |value, path|
        if value.strip.empty?
          issues << err("#{path} is an empty string; every landing-page string must be non-empty")
          next
        end
        bad = value.scan(/\{(\w+)\}/).flatten.uniq.reject { |ph| ALLOWED_PLACEHOLDERS.include?(ph) }
        unless bad.empty?
          issues << err("#{path} uses the placeholder(s) #{bad.map { |b| "{#{b}}" }.join(', ')}; " \
                        "only #{ALLOWED_PLACEHOLDERS.map { |p| "{#{p}}" }.join(', ')} are allowed")
        end
      end
      issues
    end

    def self.walk_strings(node, path, &blk)
      case node
      when String then blk.call(node, path)
      when Hash then node.each { |k, v| walk_strings(v, "#{path}.#{k}", &blk) }
      when Array then node.each_with_index { |v, i| walk_strings(v, "#{path}[#{i}]", &blk) }
      end
    end

    # Every domain tier the menu uses (0 included) needs a defender string in `strings`.
    def self.tier_defender_strings(pg, where)
      tiers = Mail.hash_list(pg['brands']).flat_map do |b|
        Mail.hash_list(b['domains']).filter_map { |o| o['tier'] if o['tier'].is_a?(Integer) }
      end.uniq.sort
      s = pg['strings'].is_a?(Hash) ? pg['strings'] : {}
      tiers.filter_map do |tier|
        key = tier_defender_key(tier)
        val = s[key]
        next if val.is_a?(String) && !val.strip.empty?

        err("#{where}.strings is missing a non-empty defender string '#{key}' for domain tier #{tier} (used by the menu)")
      end
    end

    def self.concept_cards(pg, cards, where)
      Mail.list(pg['conceptCards']).filter_map do |cid|
        next unless cid.is_a?(String)

        err("#{where}.conceptCards id '#{cid}' is not a social.conceptCards id") unless cards.include?(cid)
      end
    end

    # ---- page-builder objects -------------------------------------------------------

    def self.page_builder_objects(ctx, pages, phish)
      by_id = pages.each_with_object({}) { |pg, h| h[pg['id']] = pg if pg['id'].is_a?(String) }
      issues = []
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'page-builder'

        md = obj['minigameData']
        lpid = md.is_a?(Hash) ? md['landingPageId'] : nil
        if Mail.blank?(lpid)
          issues << err("#{path} (page-builder) has no minigameData.landingPageId")
          next
        end
        pg = by_id[lpid]
        if pg.nil?
          issues << err("#{path} (page-builder) minigameData.landingPageId '#{lpid}' is not a social.landingPages id")
          next
        end
        tgts = pg['targets']
        if !tgts.is_a?(Hash) || tgts.length != 1
          issues << err("#{path} (page-builder) names page '#{lpid}', which has #{tgts.is_a?(Hash) ? tgts.length : 0} targets; " \
                        'a page opened from a workstation must have exactly one targets key')
          next
        end
        key = tgts.keys.first
        issues << err("#{path} (page-builder) page '#{lpid}' targets key '#{key}' is not a social.phishTargets id") unless phish.include?(key)
      end
      issues
    end

    # ---- punycode (RFC 3492) --------------------------------------------------------

    PUNY_BASE = 36
    PUNY_TMIN = 1
    PUNY_TMAX = 26
    PUNY_SKEW = 38
    PUNY_DAMP = 700
    PUNY_INITIAL_BIAS = 72
    PUNY_INITIAL_N = 128

    def self.punycode_host(host)
      host.split('.').map { |label| punycode_label(label) }.join('.')
    end

    def self.punycode_label(label)
      input = label.codepoints
      return label if input.all? { |c| c < 128 }

      basic = input.select { |c| c < 128 }
      out = basic.map(&:chr).join
      b = basic.length
      out += '-' if b.positive?
      h = b
      n = PUNY_INITIAL_N
      delta = 0
      bias = PUNY_INITIAL_BIAS
      while h < input.length
        m = input.select { |c| c >= n }.min
        delta += (m - n) * (h + 1)
        n = m
        input.each do |c|
          if c < n
            delta += 1
          elsif c == n
            q = delta
            k = PUNY_BASE
            loop do
              t = if k <= bias then PUNY_TMIN
              elsif k >= bias + PUNY_TMAX then PUNY_TMAX
              else k - bias
              end
              break if q < t

              out += puny_digit(t + (q - t) % (PUNY_BASE - t))
              q = (q - t) / (PUNY_BASE - t)
              k += PUNY_BASE
            end
            out += puny_digit(q)
            bias = puny_adapt(delta, h + 1, h == b)
            delta = 0
            h += 1
          end
        end
        delta += 1
        n += 1
      end
      "xn--#{out}"
    end

    def self.puny_digit(d)
      d < 26 ? (97 + d).chr : (48 + d - 26).chr
    end

    def self.puny_adapt(delta, numpoints, first)
      delta = first ? delta / PUNY_DAMP : delta / 2
      delta += delta / numpoints
      k = 0
      while delta > ((PUNY_BASE - PUNY_TMIN) * PUNY_TMAX) / 2
        delta /= (PUNY_BASE - PUNY_TMIN)
        k += PUNY_BASE
      end
      k + (PUNY_BASE - PUNY_TMIN + 1) * delta / (delta + PUNY_SKEW)
    end
  end
end
