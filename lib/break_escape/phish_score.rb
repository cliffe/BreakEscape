# frozen_string_literal: true

module BreakEscape
  # Server-side port of the landing-page scorer
  # (public/break_escape/js/minigames/landing-page-builder/landing-page-model.js), the pure,
  # deterministic half the server recomputes rather than trusting the client's verdict
  # (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md section 4).
  #
  # A line-for-line port of scorePage / scoreFakeCheck, the domain guard (guardDomain), the
  # per-factor scorers, the gates block and the point tables. It is pure: inputs are the page
  # hash from the scenario (string-keyed, as scenario_data is), the validated choices hash and
  # the target (a string id, or a hash carrying 'id'). It returns only the numbers the gate
  # needs; it emits no strings, reads no secret and makes no request.
  #
  #   PhishScore.score(page_def, choices, target)
  #     -> { credibility:, gates_passed:, meets_threshold:, blocked: }
  #
  # A blocked page (an off-menu or non-.example domain, mirroring scorePage returning
  # { blocked: true }) has no credibility to report, so credibility is nil, gates_passed false
  # and meets_threshold false: a blocked page is never convincing. The JS and Ruby scorers are
  # kept from drifting by the shared-fixture parity test (test/models/break_escape/
  # phish_score_parity_test.rb and the matching node test).
  module PhishScore
    module_function

    FACTOR_ORDER = %w[brand purpose domain logo wording form padlock].freeze

    EXAMPLE_SUFFIX = '.example'

    # Full-value points (landing-page-model.js DEFAULT_POINTS). domain is a per-tier table.
    DEFAULT_POINTS = {
      'brand' => 15, 'purpose' => 10, 'domain' => [0, 10, 22, 35],
      'logo' => 10, 'wording' => 10, 'form' => 10, 'padlock' => 10
    }.freeze

    LOGO_PARTIAL = 4   # blurry or stretched (fixed 4)
    FORM_MISSING = 4   # a real field missing (fixed 4)

    CHECK_FACTOR_ORDER = %w[borrowedTrust pretext stepWording urgency].freeze
    CHECK_DEFAULT_POINTS = {
      'borrowedTrust' => 35, 'pretext' => 25, 'stepWording' => 25, 'urgency' => 15
    }.freeze

    # The port's result for a page the runtime domain guard blocks.
    def blocked_result
      { credibility: nil, gates_passed: false, meets_threshold: false, blocked: true }
    end

    # scorePage / scoreFakeCheck (landing-page-model.js). Returns the gate numbers only.
    def score(page_def, choices, target)
      return score_fake_check(page_def, choices, target) if obj?(page_def) && page_def['pageType'] == 'fakeCheck'

      return blocked_result if guard_domain(page_def, choices)[:blocked]

      c = obj?(choices) ? choices : {}
      p = points(page_def)
      target_id = obj?(target) ? target['id'] : target
      cfg = per_target_cfg(page_def, target_id)

      brand = score_brand(page_def, c, p)
      scored = {
        'brand' => brand,
        'purpose' => score_purpose(page_def, c, p),
        'domain' => score_domain(page_def, c, p),
        'logo' => score_logo(c, p),
        'wording' => score_wording(page_def, c, p),
        'form' => score_form(page_def, c, p),
        'padlock' => score_padlock(c, p)
      }

      credibility = FACTOR_ORDER.sum { |id| scored[id][:points] }

      # Gates: brand gate active unless the target turns it off (awareness); careful-reader
      # gate active when minDomainTier is a positive number.
      gates = []
      gates << (brand[:gate_brand] == true) if cfg['brandGate'] != false
      min_tier = to_number(cfg['minDomainTier'])
      gates << (scored['domain'][:tier] >= min_tier) if min_tier && min_tier > 0

      gates_passed = gates.all?
      threshold = to_number(cfg['linkThreshold'])
      meets_threshold = !threshold.nil? && credibility >= threshold && gates_passed

      { credibility: credibility, gates_passed: gates_passed, meets_threshold: meets_threshold, blocked: false }
    end

    # --- domain guard (N6b) ---------------------------------------------------------------
    def guard_domain(page_def, choices)
      domain_id = choices.is_a?(Hash) ? choices['domainId'] : nil
      option = find_domain_option(page_def, (choices.is_a?(Hash) ? choices['brand'] : nil), domain_id)
      return { blocked: true } if option.nil?

      host = host_of(option['domain'])
      return { blocked: true } unless host.end_with?(EXAMPLE_SUFFIX)

      { blocked: false }
    end

    # --- per-factor scorers ---------------------------------------------------------------
    def score_brand(page_def, choices, p)
      pretext = obj?(page_def) && obj?(page_def['pretext']) ? page_def['pretext']['brandId'] : nil
      pass = !choices['brand'].nil? && choices['brand'] == pretext
      { points: pass ? p['brand'] : 0, gate_brand: pass }
    end

    def score_purpose(page_def, choices, p)
      want = obj?(page_def) && obj?(page_def['pretext']) ? page_def['pretext']['purposeId'] : nil
      return { points: p['purpose'] } if !choices['purpose'].nil? && choices['purpose'] == want
      return { points: half(p['purpose']) } if choices['purpose'] == 'signin'

      { points: 0 }
    end

    def score_domain(page_def, choices, p)
      option = find_domain_option(page_def, choices['brand'], choices['domainId'])
      tier = option && option['tier'].is_a?(Integer) ? option['tier'] : 0
      table = p['domain']
      pts = (tier >= 0 && tier < table.length) ? table[tier] : 0
      { points: pts, tier: tier }
    end

    def score_logo(choices, p)
      return { points: p['logo'] } if choices['logo'] == 'crisp'
      return { points: LOGO_PARTIAL } if choices['logo'] == 'blurry' || choices['logo'] == 'stretched'

      { points: 0 }
    end

    def score_wording(page_def, choices, p)
      option = arr(obj?(page_def) ? page_def['wordings'] : nil).find { |w| w.is_a?(Hash) && w['id'] == choices['wording'] }
      return { points: p['wording'] } if option && option['match'] == true
      return { points: 0 } if option && option['slips'] == true

      { points: half(p['wording']) }
    end

    def score_form(page_def, choices, p)
      brand = brand_by_id(page_def, choices['brand'])
      real = arr(brand && brand['realFields'])
      sensitive = arr(obj?(page_def) ? page_def['extraSensitiveFields'] : nil)
      chosen = arr(choices['fields'])

      # 1. any extra sensitive field (beyond the real set) -> 0
      return { points: 0 } if chosen.any? { |f| sensitive.include?(f) && !real.include?(f) }

      # 2. a real field missing -> 4
      return { points: FORM_MISSING } if real.any? { |f| !chosen.include?(f) }

      # 3. an extra non-sensitive field -> half
      return { points: half(p['form']) } if chosen.any? { |f| !real.include?(f) }

      # 4. exactly the real fields -> full
      { points: p['form'] }
    end

    def score_padlock(choices, p)
      { points: choices['padlock'] == true ? p['padlock'] : 0 }
    end

    # --- fake-check scorer (ENG-03b) ------------------------------------------------------
    def score_fake_check(page_def, choices, target)
      defn = obj?(page_def) ? page_def : {}
      check = obj?(defn['check']) ? defn['check'] : {}
      sel = obj?(choices) && obj?(choices['check']) ? choices['check'] : {}
      p = check_points(defn)
      target_id = obj?(target) ? target['id'] : target
      cfg = per_target_cfg(defn, target_id)

      host_opt = opt_by_id(check['hosts'], sel['hostId'])
      trust = host_opt && str_like?(host_opt['trust']) ? host_opt['trust'] : 'unrelated'
      borrowed = case trust
      when 'genuine' then p['borrowedTrust']
      when 'lookalike' then half(p['borrowedTrust'])
      else 0
      end

      pretext_opt = opt_by_id(check['pretexts'], sel['pretextId'])
      pretext = if pretext_opt && pretext_opt['match'] == true
                  p['pretext']
      elsif pretext_opt && pretext_opt['slips'] == true
                  0
      else
                  half(p['pretext'])
      end

      step_opt = opt_by_id(check['steps'], sel['stepsId'])
      steps = step_opt && step_opt['match'] == true ? p['stepWording'] : 0

      urgency_opt = opt_by_id(check['urgencies'], sel['urgencyId'])
      urgency = urgency_opt && urgency_opt['match'] == true ? p['urgency'] : half(p['urgency'])

      credibility = borrowed + pretext + steps + urgency
      threshold = to_number(cfg['linkThreshold'])
      meets_threshold = !threshold.nil? && credibility >= threshold

      { credibility: credibility, gates_passed: true, meets_threshold: meets_threshold, blocked: false }
    end

    # --- helpers --------------------------------------------------------------------------
    def obj?(v)
      v.is_a?(Hash)
    end

    def arr(v)
      v.is_a?(Array) ? v : []
    end

    # Math.round(n / 2): points are never negative, so round-half-up matches Math.round.
    def half(n)
      ((n.to_f) / 2).round
    end

    def per_target_cfg(page_def, target_id)
      targets = obj?(page_def) ? page_def['targets'] : nil
      obj?(targets) && obj?(targets[target_id]) ? targets[target_id] : {}
    end

    # Host part of an address: drop any scheme, take everything before the first '/', '?' or '#'.
    def host_of(address)
      s = address.nil? ? '' : address.to_s
      scheme = s.index('://')
      s = s[(scheme + 3)..] if scheme
      idx = s.index(%r{[/?#]})
      s = s[0...idx] if idx
      s
    end

    def find_domain_option(page_def, brand_id, domain_id)
      return nil unless obj?(page_def) && !domain_id.nil?

      brands = arr(page_def['brands'])
      in_brand = lambda do |b|
        arr(b.is_a?(Hash) ? b['domains'] : nil).find { |d| d.is_a?(Hash) && d['id'] == domain_id }
      end
      chosen = brands.find { |b| b.is_a?(Hash) && b['id'] == brand_id }
      (chosen && in_brand.call(chosen)) || brands.map { |b| in_brand.call(b) }.find { |d| d } || nil
    end

    def brand_by_id(page_def, brand_id)
      arr(obj?(page_def) ? page_def['brands'] : nil).find { |b| b.is_a?(Hash) && b['id'] == brand_id }
    end

    def points(page_def)
      p = obj?(page_def) && obj?(page_def['points']) ? page_def['points'] : {}
      {
        'brand' => p['brand'].nil? ? DEFAULT_POINTS['brand'] : p['brand'],
        'purpose' => p['purpose'].nil? ? DEFAULT_POINTS['purpose'] : p['purpose'],
        'domain' => p['domain'].is_a?(Array) ? p['domain'] : DEFAULT_POINTS['domain'],
        'logo' => p['logo'].nil? ? DEFAULT_POINTS['logo'] : p['logo'],
        'wording' => p['wording'].nil? ? DEFAULT_POINTS['wording'] : p['wording'],
        'form' => p['form'].nil? ? DEFAULT_POINTS['form'] : p['form'],
        'padlock' => p['padlock'].nil? ? DEFAULT_POINTS['padlock'] : p['padlock']
      }
    end

    def check_points(page_def)
      p = obj?(page_def) && obj?(page_def['check']) && obj?(page_def['check']['points']) ? page_def['check']['points'] : {}
      CHECK_FACTOR_ORDER.each_with_object({}) do |id, out|
        out[id] = p[id].nil? ? CHECK_DEFAULT_POINTS[id] : (to_number(p[id]) || 0)
      end
    end

    def opt_by_id(list, id)
      arr(list).find { |o| o.is_a?(Hash) && o['id'] == id }
    end

    def str_like?(v)
      v.is_a?(String) && !v.empty?
    end

    # A finite numeric value, or nil for anything else (NaN/Infinity/non-numeric), which the gate
    # reads as "no threshold" (meets_threshold false) and "no tier gate" (the careful-reader gate
    # is skipped). It mirrors JS Number() + Number.isFinite for the inputs that actually occur: an
    # integer, a float or a numeric string.
    #
    # It deliberately does NOT mirror Number() for a boolean or an array, the two non-numeric cases
    # the review raised (R1 Minor 4). JS would coerce Number(true) to 1, Number(false)/Number([]) to
    # 0 and Number([n]) to n, but to_number returns nil for all of these. This is used for two gate
    # fields only, linkThreshold and minDomainTier, and both are always authored as numbers, so there
    # is no honest divergence to catch. Were a malformed value ever to reach here, nil is the safe
    # reading for linkThreshold: a boolean or empty-array value coerced to 0 or 1 would let a weak page
    # clear the gate, whereas nil withholds. For minDomainTier nil skips the careful-reader gate, so
    # there it is less strict than a coerced number; that is acceptable only because both fields are
    # scenario-authored, never client input, so a malformed value cannot come from a hostile body.
    # Replicating JS array-to-primitive coercion would add fragile
    # code for input that cannot occur and would weaken that guarantee, so the gap is left closed.
    def to_number(v)
      case v
      when Integer then v
      when Float then v.finite? ? v : nil
      when String
        return nil if v.strip.empty?

        begin
          f = Float(v)
          f.finite? ? f : nil
        rescue ArgumentError, TypeError
          nil
        end
      end
    end
  end
end
