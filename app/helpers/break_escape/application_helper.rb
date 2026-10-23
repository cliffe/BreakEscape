require 'json'

module BreakEscape
  module ApplicationHelper
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
