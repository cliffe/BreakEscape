require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S2 (OPS_CORE_PLAN.md 11.2, "the loop costs nothing but rows"): confirming every
  # finding of a service, decoys and weaknesses alike, changes no state beyond the statuses and the
  # log, and adds no state key. S3 adds the card half of this file.
  class NetworkOpsFreeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOS = NetworkOpsScenario

    setup do
      hold_office_foothold({}, NOS.findings_scenario)
      sweep_and_scan('sam_pc')
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
    end

    def comparable(state)
      state.except('opsFindings', 'opsLog', 'opsLogSeq', 'opsLogClockAt')
    end

    test 'confirming every finding of a service changes only the statuses and the log, and adds no state key' do
      before = ops_state.deep_dup
      ids = before['opsFindings'].keys
      assert_equal 4, ids.length
      ids.each { |id| ops_confirm(OFFICE, id) }
      after = ops_state
      assert_equal comparable(before), comparable(after), 'a confirm changed state beyond statuses and the log'
      assert_equal before.keys.sort, after.keys.sort, 'a confirm added or removed a state key'
      assert_equal ids.sort, after['opsFindings'].keys.sort
      assert_equal before['opsFindings'].transform_values { |v| v[1..] }, after['opsFindings'].transform_values { |v| v[1..] },
                   'aliases are never changed by a confirm'
      assert_equal %w[c f c c], ids.sort.map { |id| after['opsFindings'][id][0] }
    end

    test 'a confirm costs no inventory, no global and no session' do
      before = ops_state.deep_dup
      ops_findings = before['opsFindings'].keys
      ops_findings.each { |id| ops_confirm(OFFICE, id) }
      after = ops_state
      %w[inventory globalVariables sessions signedInPcs footholds credentialClock keyringGained].each do |key|
        assert before.key?(key), "the state has no #{key} to compare" if %w[inventory globalVariables footholds].include?(key)
        assert_equal before[key], after[key], key
      end
    end

    test 'the confirms write one row each and a repeat of any writes none' do
      ids = ops_state['opsFindings'].keys
      ids.each { |id| ops_confirm(OFFICE, id) }
      assert_equal 4, ops_rows.count { |row| row['event'] == 'finding_confirmed' }
      ids.each { |id| ops_confirm(OFFICE, id) }
      assert_equal 4, ops_rows.count { |row| row['event'] == 'finding_confirmed' }
    end

    test 'checking every service of every scanned host adds findings and the checked list and nothing else' do
      sweep_and_scan('print_srv')
      before = ops_state.deep_dup
      ops_check(OFFICE, host_id: 'sam_pc', service: 'files')
      ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      after = ops_state
      assert_equal comparable(before).except('opsDiscovered'), comparable(after).except('opsDiscovered')
      assert_equal before.keys.sort, after.keys.sort
      assert_equal %w[hosts networks services], after['opsDiscovered'].keys.sort
      assert_equal ['sam_pc.web'], before['opsDiscovered']['services']
      assert_equal %w[print_srv.queue sam_pc.files sam_pc.web], after['opsDiscovered']['services'].sort,
                   'each check adds its service to the checked list'
      assert_equal [NOS::SPOOL], after['opsFindings'].keys - before['opsFindings'].keys,
                   'the print server check adds exactly its one finding'
      assert_equal before['opsFindings'], after['opsFindings'].slice(*before['opsFindings'].keys),
                   'a check never changes a finding already held'
    end
  end
end
