# Unchanged-scenario golden fixtures (docs/achitechture/OPS_LOG_ROWS_PLAN.md section 12, build item 1).
#
#   bin/rails app:ops:unchanged:capture [ONLY=name,name]   (from the engine root; `ops:unchanged:capture`
#                                                            from a host app)
#
# It plays each case in test/support/ops_unchanged_cases.rb through the real routes on the code as it
# stands and writes test/fixtures/files/ops_unchanged/<name>.json. Run it on main (or before the
# engine edits it guards), commit the JSON, and later check the edited code against it. It runs no
# db: task and never touches the development database: it runs the capture test
# (test/lib/ops_unchanged_capture_test.rb) in the test environment, under the shared test lock.
#
# HOW TO ADD A FIXTURE
#   1. Add a case to OpsUnchangedCases.all (test/support/ops_unchanged_cases.rb): a scenario, the
#      seeded playerState, and steps of { id, method, path, params } played in order. Build the
#      scenario as the controller tests do (create_access_game runs inside OpsGolden.play).
#   2. Capture it on UNMODIFIED code: ONLY=<name> bin/rails app:ops:unchanged:capture. Commit the JSON.
#   3. It is replayed by test/lib/ops_unchanged_replay_test.rb, which `bin/ops-golden-compare`
#      runs. Never recapture to make a diff pass; a diff means behaviour changed.
# Normalisations are in OpsGolden: empty ACCESS_STATE_DEFAULTS keys absent from the fixture are
# ignored, and the clock is frozen at the fixture's "clock".
namespace :ops do
  namespace :unchanged do
    desc 'Capture the ops_unchanged golden fixtures from the code as it stands (test environment, test lock)'
    task :capture do
      root = File.expand_path('../..', __dir__)
      common = `git -C #{root} rev-parse --git-common-dir 2>/dev/null`.strip
      lock = ENV['TESTS_LOCK'] || File.join(common.empty? ? root : File.dirname(File.expand_path(common, root)), 'tmp', 'tests.lock')
      env = { 'RAILS_ENV' => 'test', 'OPS_UNCHANGED_CAPTURE' => '1', 'OPS_UNCHANGED_ONLY' => ENV['ONLY'].to_s }
      ok = system(env, 'flock', lock, File.join(root, 'bin/rails'), 'test', File.join(root, 'test/lib/ops_unchanged_capture_test.rb'))
      abort 'ops:unchanged:capture failed' unless ok
    end
  end
end
