require 'json'

module BreakEscape
  module ApplicationHelper
    AWARENESS_TEXT_MAX    = 600
    AWARENESS_HEADING_MAX = 80
    AWARENESS_TEAM_MIN    = 2
    AWARENESS_TEAM_MAX    = 100_000
    # Zero-width characters and bidi controls (U+200B-200F, 202A-202E, 2060-2064, 2066-2069, FEFF).
    AWARENESS_INVISIBLE   = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/

    # The host's awareness settings for a game, as the client's window.breakEscapeConfig.awareness
    # ({ reportRoute:, ruleOfThumb:, teamSize: }; only keys that have a value). {} when there is no
    # hook, nothing is set, or the hook raises. Keys are whitelisted; text is plain text.
    def break_escape_awareness_config(game)
      hook = BreakEscape.configuration&.awareness_settings
      raw  = hook&.call(game)
      return {} unless raw.respond_to?(:to_h) && !raw.nil?

      raw = raw.to_h.transform_keys(&:to_sym)
      out = {}
      text    = be_plain(raw[:report_text], AWARENESS_TEXT_MAX)
      heading = be_plain(raw[:report_heading], AWARENESS_HEADING_MAX)
      out[:reportRoute] = heading.present? ? { heading: heading, text: text } : text if text.present?
      rule = be_plain(raw[:rule_of_thumb], AWARENESS_TEXT_MAX)
      out[:ruleOfThumb] = rule if rule.present?
      size = be_team_size(raw[:team_size])
      out[:teamSize] = size if size
      out
    rescue StandardError => e
      Rails.logger.warn "[BreakEscape] awareness_settings hook failed: #{e.class}: #{e.message}"
      {}
    end

    # Plain text: control characters removed (newlines and tabs kept as newline/space), trimmed, capped.
    def be_plain(value, max = AWARENESS_TEXT_MAX)
      return '' unless value.is_a?(String)

      value.gsub(/\r\n?/, "\n").gsub("\t", ' ').gsub(/[[:cntrl:]&&[^\n]]/, '').gsub(AWARENESS_INVISIBLE, '').strip[0, max].to_s.strip
    end

    # An integer from 2 to 100000, or nil.
    def be_team_size(value)
      n = case value
      when Integer then value
      when String  then value.strip.match?(/\A\d+\z/) ? value.strip.to_i : nil
      when Float   then value == value.to_i ? value.to_i : nil
      end
      n && n >= AWARENESS_TEAM_MIN && n <= AWARENESS_TEAM_MAX ? n : nil
    end

    def generate_random_id
      SecureRandom.hex(8)
    end

    def be_asset_path(path)
      "#{path}?v=#{BreakEscape::ASSETS_VERSION}"
    end

    def break_escape_import_map
      version = BreakEscape::ASSETS_VERSION
      js_root = BreakEscape::Engine.root.join('public')
      js_dir  = js_root.join('break_escape', 'js')
      imports = Dir.glob("#{js_dir}/**/*.js").sort.each_with_object({}) do |file, h|
        path   = "/#{Pathname.new(file).relative_path_from(js_root)}"
        h[path] = "#{path}?v=#{version}"
      end
      content_tag(:script, JSON.generate({ imports: imports }).html_safe,
                  type: 'importmap', nonce: content_security_policy_nonce)
    end
  end
end
