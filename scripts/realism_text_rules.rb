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
  TELLTALE = ['decoy', 'fake', 'false', 'bait', 'patched', 'not\s+vulnerable'].freeze
  WEAK_TELLTALE = %w[real true fixed safe].freeze

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
    flag = tokens.find { |t| t =~ /\A--?[A-Za-z]/ }
    add.call('flag', flag) if flag
    m = s.match(/\h{16,}/)
    if m
      add.call('encoded_blob', m[0])
    elsif prose
      b = tokens.map { |t| strip(t) }.find { |t| t =~ %r{\A[A-Za-z0-9+/=]{24,}\z} && t =~ %r{[0-9+=]} }
      add.call('encoded_blob', b) if b
    end
    path_rules(tokens, prose, add)
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

  def credential_rules(s, tokens, kind, add)
    tokens.each do |raw|
      t = strip(raw)
      next if t.empty?

      if t =~ /\A[^:\s]+(:[^:\s]+)+\z/ && t !~ PRIVATE_V4_PORT && t !~ %r{://}
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

      last = t.split('.').last
      add.call('host', t) if last =~ /\A[A-Za-z]+\z/ && !ALLOWED_TLDS.include?(last.downcase)
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
