# frozen_string_literal: true

# The text rules of the realism skin (docs/agents/ops_core_build/S6_BUILD_BRIEF.md, unit 20). Pure Ruby,
# no Rails. The catalog validator runs them over every catalog string; the skin validator runs them
# over every scenario `cli` string.
#
#   RealismTextRules.check(text, kind: :prose, scenario: false) -> [Finding, ...]
#
# `kind` says what the string is:
#   :prose  a banner, a title or an output line (the path and base64 rules apply)
#   :text   any other text string (an advisory id, a short word)
#   :module a framework module path (also: two equal neighbouring segments; telltale words joined by _ or -)
#   :script a script name (telltale words joined by _ or -)
#   :id     a catalog id (telltale words joined by _)
#
# A Finding has `rule` (a name), `level` (:error or :warning) and `fragment` (the matched text, only
# when `scenario: true`; catalog strings are never quoted). Several findings can come back; none for
# a clean string.
module RealismTextRules
  Finding = Struct.new(:rule, :level, :fragment)

  PRIVATE_V4 = [
    /\A10\.\d{1,3}\.\d{1,3}\.\d{1,3}\z/,
    /\A172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\z/,
    /\A192\.168\.\d{1,3}\.\d{1,3}\z/
  ].freeze
  DOTTED_V4 = /\A\d{1,3}(\.\d{1,3}){3}\z/.freeze
  PRIVATE_V4_PORT = /\A(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}):\d{1,5}\z/.freeze
  ALLOWED_TLDS = %w[local internal lan test example invalid].freeze
  SYSTEM_DIRS = %w[bin boot dev etc home lib lib64 mnt opt proc root run sbin srv sys tmp usr var windows system32 users program].freeze
  DEFAULT_PASSWORDS = %w[admin administrator password passwd 123456 12345 1234 root toor guest letmein changeme default qwerty test user pass welcome secret].freeze
  ACCOUNT_WORDS = %w[admin administrator root user guest ops service svc backup test operator sa postgres oracle].freeze
  TELLTALE = ['decoy', 'fake', 'false', 'bait', 'patched', 'not\s+vulnerable', 'honeypot', 'bogus', 'dummy', 'spoof', 'phony', 'harmless', 'benign'].freeze
  WEAK_TELLTALE = %w[real true fixed safe].freeze

  # Words that make a line read as a step or a request (R1-S4). The list cannot be complete: a human review of
  # every new catalog entry is still required (docs/ACCESS_AND_NETWORKS.md, N16).
  INSTRUCTION_VERBS = %w[send request post get put delete run type enter set supply craft inject upload execute trigger bypass overflow use submit open append log visit call try leave give browse go].freeze
  # A verb reads as a step when any word follows it, unless that word is a state noun (R3-1): `Run level 3 reached`,
  # `Upload limit 20 MB`, `Delete protection on` pass; `Send long name`, `Run check twice`, `Type 2 device` do not.
  STEP_NEXT = '(?!(?:level|queue|limit|protection|permission|warnings|pending|mode|count|size|key)\\b)\\S'
  STEP_LEAD = '(?:please|first|next|now|then|just|simply|must|can|you\s+can|you\s+should|you\s+must)'
  INSTRUCTION_WORDS = %w[payload payloads shellcode].freeze
  SENSITIVE_DIRS = %w[etc proc root var tmp bin sbin usr sys].freeze
  # Ordinary words too (`Dev/test build`, `Boot/recovery mode`): a request form only when the right side has a dot
  SOFT_DIRS = %w[dev opt boot].freeze

  module_function

  # The findings for one string.
  def check(text, kind: :prose, scenario: false)
    s = text.to_s
    out = []
    add = lambda do |rule, fragment = nil, level = :error|
      out << Finding.new(rule, level, scenario ? fragment : nil)
    end
    prose = kind == :prose

    m = s.match(/[^\x20-\x7e]/)
    add.call('characters', m && m[0].dump) if m
    add.call('backslash', '\\') if s.include?('\\')
    m = s.match(/%\h\h/)
    add.call('percent_escape', m[0]) if m
    m = s.match(/0x\h{4,}/i)
    add.call('hex_literal', m[0]) if m
    m = s.match(/[<>]/)
    add.call('angle_bracket', m[0]) if m
    m = s.match(/[;|&`]|\$\(/)
    add.call('shell_metacharacter', m[0]) if m
    tokens = s.split(/\s+/).reject(&:empty?)
    flag = tokens.find { |t| strip(t) =~ /\A--?[A-Za-z]/ }
    add.call('flag', flag) if flag
    m = s.match(/\h{16,}/)
    if m
      add.call('encoded_blob', m[0])
    elsif prose
      b = tokens.map { |t| strip(t) }.find { |t| t =~ %r{\A[A-Za-z0-9+/=]{24,}\z} && t =~ %r{[0-9+=]} }
      add.call('encoded_blob', b) if b
    end
    path_rules(tokens, prose, add)
    step_rules(s, tokens, prose, add)
    credential_rules(s, tokens, kind, add)
    host_rules(s, tokens, add)
    telltale_rules(s, kind, add)
    out
  end

  def errors(text, **opts)
    check(text, **opts).select { |f| f.level == :error }
  end

  def strip(token)
    token.gsub(/\A[\s"'(\[{]+|[\s"')\]}.,;:!?]+\z/, '')
  end

  def path_rules(tokens, prose, add)
    return unless prose

    tokens.each do |raw|
      t = strip(raw)
      next if t.empty? && raw !~ %r{\A/}
      raw_t = raw.gsub(/\A[\s"'(\[{]+|[\s"')\]}]+\z/, '')
      if raw_t =~ %r{\A(/|~/|\./|\.\./)} || raw_t =~ %r{\A[A-Za-z]:/}
        add.call('path', raw_t)
        next
      end
      next unless t.include?('/')

      parts = t.split('/', -1)
      if parts.length >= 3
        letters = parts.all? { |p| p =~ /\A[A-Za-z]+\z/ }
        add.call('path', t) unless letters && !SYSTEM_DIRS.include?(parts.first.downcase)
      elsif parts.length == 2 && parts.any?(&:empty?)
        add.call('path', t)
      end
    end
  end

  # A line that tells someone what to do, or a request written as a request (R1-S4).
  def step_rules(s, tokens, prose, add)
    return unless prose

    verbs = INSTRUCTION_VERBS.join('|')
    m = s.match(/\A(?:[A-Za-z][A-Za-z ]{0,20}:\s*)?(?:#{STEP_LEAD},?\s+)?(#{verbs})(?![\w:-])\s+#{STEP_NEXT}/i) ||
        s.match(/(?:\A|[,;.]\s*|\s)#{STEP_LEAD},?\s+(#{verbs})(?![\w:-])\s+#{STEP_NEXT}/i)
    add.call('instruction', m[1]) if m
    m = s.match(/(?<![A-Za-z0-9])(#{INSTRUCTION_WORDS.join('|')})(?![A-Za-z0-9])/i)
    add.call('instruction', m[1]) if m
    tokens.each do |raw|
      t = strip(raw)
      next unless t.include?('/') || t.include?('?') || t.include?('=')

      if t =~ /\?[A-Za-z0-9_]+=/ || t =~ /\A(?:id|uid|pid|page|file|cmd|name)=\d+\z/i
        add.call('request_form', t)
        next
      end
      parts = t.split('/', -1)
      next unless parts.length == 2 && parts.none?(&:empty?)

      # A file name has a letter before the dot and a two-letter-or-longer extension (`1.x` and `v2.x` are versions)
      if parts.last =~ /\A[A-Za-z0-9_-]*[A-Za-z][A-Za-z0-9_-]*\.[A-Za-z][A-Za-z0-9]{1,4}\z/ || parts.last.include?('?') ||
         %w[api cgi-bin admin].include?(parts.first.downcase) ||
         (SENSITIVE_DIRS.include?(parts.first.downcase) && parts.last =~ /\A[A-Za-z0-9_.-]+\z/) ||
         (SOFT_DIRS.include?(parts.first.downcase) && parts.last =~ /\A[A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+\z/)
        add.call('request_form', t)
      end
    end
  end

  def credential_rules(s, tokens, kind, add)
    tokens.each do |raw|
      t = strip(raw)
      next if t.empty?

      if t =~ /\A[^:\s]+(:[^:\s]+)+\z/ && t !~ PRIVATE_V4_PORT && t !~ %r{://} && t !~ /\A\d{1,2}:\d{2}(:\d{2})?\z/
        add.call('credential', t)
        next
      end
      pair = t.match(%r{\A([^/=\s]+)[/=]([^/=\s]+)\z})
      next unless pair

      l = pair[1].downcase
      r = pair[2].downcase
      weak = l == r || DEFAULT_PASSWORDS.include?(r) ||
             (ACCOUNT_WORDS.include?(l) && r.length >= 6 && r =~ /[a-z]/ && r =~ /\d/)
      add.call('credential', t) if weak
    end
    m = s.match(/\b(passwd|password|pwd|secret)\s*[=:]\s*\S+/i)
    add.call('credential', m[0]) if m
    m = s.match(/\b(user|username|login|pass|key|token)[=:]\S+/i)
    add.call('credential', m[0]) if m
    return unless kind == :module

    segs = s.split('/')
    segs.each_cons(2) { |a, b| (add.call('credential', "#{a}/#{b}"); break) if a == b }
  end

  def host_rules(s, tokens, add)
    add.call('host', '://') if s.include?('://')
    add.call('host', 'www.') if s =~ /\bwww\./i
    tokens.each do |raw|
      t = strip(raw)
      if t =~ DOTTED_V4
        add.call('host', t) unless PRIVATE_V4.any? { |re| t =~ re }
        next
      end
      next unless t =~ /\A[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+\z/

      parts = t.split('.')
      last = parts.last
      # a name needs a last part of two or more letters after a part that holds a letter (not 2.4.x or e.g)
      next unless parts[0...-1].any? { |p| p =~ /[A-Za-z]/ }

      add.call('host', t) if last =~ /\A[A-Za-z]{2,}\z/ && !ALLOWED_TLDS.include?(last.downcase)
    end
  end

  def telltale_rules(s, kind, add)
    joined = %i[module script id].include?(kind)
    strong = TELLTALE.join('|')
    weak = WEAK_TELLTALE.join('|')
    re = lambda do |words|
      joined ? /(?<![A-Za-z0-9])(#{words})(?![A-Za-z0-9])/i : /\b(#{words})\b/i
    end
    s2 = joined ? s.gsub('-', '_') : s
    m = s2.match(re.call(strong))
    add.call('telltale', m[0]) if m
    m = s2.match(re.call(weak))
    add.call('weak_telltale', m[0], :warning) if m
  end
end
