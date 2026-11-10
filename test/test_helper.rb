# Configure Rails Environment
ENV["RAILS_ENV"] = "test"
ENV["BREAK_ESCAPE_STANDALONE"] = "true"  # Use standalone mode for tests

require_relative "../test/dummy/config/environment"
ActiveRecord::Migrator.migrations_paths = [ File.expand_path("../test/dummy/db/migrate", __dir__) ]
ActiveRecord::Migrator.migrations_paths << File.expand_path("../db/migrate", __dir__)
require "rails/test_help"

# Load fixtures from the engine (fixture_paths= is Rails 7.1+; fixture_path= for 7.0)
fixtures_dir = File.expand_path("fixtures", __dir__)
if ActiveSupport::TestCase.respond_to?(:fixture_paths=)
  ActiveSupport::TestCase.fixture_paths = [ fixtures_dir ]
  ActionDispatch::IntegrationTest.fixture_paths = ActiveSupport::TestCase.fixture_paths
else
  ActiveSupport::TestCase.fixture_path = fixtures_dir
  ActionDispatch::IntegrationTest.fixture_path = fixtures_dir
end
ActiveSupport::TestCase.file_fixture_path = fixtures_dir + "/files"

ActiveSupport::TestCase.set_fixture_class(
  break_escape_missions: BreakEscape::Mission,
  break_escape_demo_users: BreakEscape::DemoUser
)
ActiveSupport::TestCase.fixtures :break_escape_missions, :break_escape_demo_users

# Reload configuration after setting ENV variable
BreakEscape.configure do |config|
  config.standalone_mode = true
  config.demo_user_handle = 'test_user'
end

# Access model tests (docs/achitechture/ACCESS_MODEL_PLAN.md, step 1). A test that
# hand-writes scenario_data skips Game#generate_scenario_data (it returns at once
# when scenario_data is set), so it would run without the access model loader.
# Every access model test with a hand-written scenario builds its game here.
module AccessGameHelper
  def create_access_game(mission:, player:, scenario:, player_state: {})
    game = BreakEscape::Game.new(
      mission: mission,
      player: player,
      scenario_data: scenario.deep_dup,
      player_state: player_state.deep_dup
    )
    game.prepare_scenario_data!
    game.save!
    game
  end
end

ActiveSupport::TestCase.include(AccessGameHelper)
