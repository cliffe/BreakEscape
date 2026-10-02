require 'pundit'

module BreakEscape
  class Engine < ::Rails::Engine
    isolate_namespace BreakEscape

    config.generators do |g|
      g.test_framework :test_unit, fixture: true
      g.assets false
      g.helper false
    end

    # Load lib directory
    config.autoload_paths << File.expand_path('../', __dir__)

    # Pundit authorization
    config.after_initialize do
      if defined?(Pundit)
        BreakEscape::ApplicationController.include Pundit::Authorization
      end
    end

    # Static files from public/break_escape
    config.middleware.use ::ActionDispatch::Static, "#{root}/public"
  end
end
