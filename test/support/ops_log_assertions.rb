# Test helper for the ops log (OPS_LOG_ROWS_PLAN.md 13.2 step 2): assert_ops_log_holds_no_secret runs
# the one matcher (BreakEscape::OpsLog.row_secret_hit) over every stored row of a game. Include it
# in a test class (ActiveSupport::TestCase) with `include OpsLogAssertions`.
module OpsLogAssertions
  # Fails, naming the source, the row's seq and the key path (never the value), when any stored row
  # holds a registered or issued secret in a field the matcher reads.
  def assert_ops_log_holds_no_secret(game, message = nil)
    log = game.player_state['opsLog']
    return pass unless log.is_a?(Hash)

    secrets = BreakEscape::OpsLog.compared_secrets(game)
    log.each do |source_id, rows|
      Array(rows).each do |row|
        path = BreakEscape::OpsLog.find_secret_hit(secrets, row)
        assert_nil path, message || "ops log source #{source_id} row #{row['seq']} holds a secret at #{path}"
      end
    end
  end
end
