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

    # Step 2b (plan item 1, "The boot check"): compile the scenario schema at boot when eager_load
    # is on (production, and test under CI), so a missing, unparsable or broken schema fails Puma
    # boot rather than the first resolver use. With eager_load off (development, rake tasks) it does
    # nothing, and the schema compiles lazily on first use.
    initializer 'break_escape.scenario_schema' do |app|
      require_relative 'scenario_schema'
      BreakEscape::ScenarioSchema.boot_check!(app)
    end

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
