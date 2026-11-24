require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S5a unit 16 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, the leak scanner's privilege rules): the scanner run over REAL answers
  # of a game of scenarios/test_ops_privilege, as ops_privilege_scenario_test plays it (an ordinary account, the owner's
  # profile refused to it, the administrator at the owner's PC with its folder read, the administrator at the other PC, the
  # owner's own read, a reload). The answers are recorded as the browser's log would hold them (a sign-in carries the
  # recorder's `login` tag); the whole run must report nothing, and one fault at a time is injected into a copy of one
  # answer, or one earlier step is left out, and must be reported. The scenario has no log reader object, so the audit
  # rows are read through the model (`log_rows_for_client`) and judged in the answer shape GET /log_rows has.
  class AccessLeakScannerPrivilegeRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)
    UMA = ['umaquay', 'Quayside-Uma-17'].freeze
    ADEL = ['adelwick', 'Lanternwick-Adel-52'].freeze
    OLU = ['omarsh', 'Harbourlight-Olu-08'].freeze
    AUDIT = 'priv_audit'.freeze

    # The real scenario, as shipped.
    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    # One recorded answer, in the browser log's shape; `login` is the recorder's tag naming the PC of a sign-in.
    def rec(extra = {})
      @log << { 'method' => request.request_method, 'path' => request.path, 'status' => response.status,
                'body' => response.parsed_body }.merge(extra)
      @log.last
    end

    def sign_in_at(pc, creds, mark = nil)
      body = sign_in(pc, *creds)
      assert body['success'], body.to_s
      row = rec('login' => { 'pcId' => pc })
      @marks[mark] = row if mark
      row
    end

    def desktop(pc, mark = nil)
      get game_path("container/#{pc}"), as: :json
      assert_response :success, response.body
      row = rec
      @marks[mark] = row if mark
      row
    end

    def folder(mark = nil)
      get game_path('container/olu_folder'), as: :json
      row = rec
      @marks[mark] = row if mark
      row
    end

    def sign_out(pc)
      post game_path('logout'), params: { pc_id: pc }, as: :json
      rec
    end

    # The audit rows through the lobby's reader terminal, the route a player uses.
    def audit_answer
      get game_path('log_rows'), params: { object_id: 'audit_log_pc' }, as: :json
      assert_response :success, response.body
      rec
    end

    # The played run. @marks names the rows a test injects into.
    def run_game
      @log = []
      @marks = {}
      build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[olu uma adel] }, scenario)
      get game_path('scenario'), as: :json
      @marks[:bootstrap] = rec
      %w[lobby bay store].each do |room|
        get game_path("room/#{room}"), as: :json
        rec
      end
      sign_in_at('bay_pc', UMA, :uma_signin)
      desktop('bay_pc', :uma_desktop)
      @marks[:uma_folder] = folder
      sign_out('bay_pc')
      sign_in_at('bay_pc', ADEL, :admin_signin)
      @marks[:admin_desktop] = desktop('bay_pc')
      @marks[:admin_folder] = folder
      @marks[:admin_audit] = audit_answer
      sign_out('bay_pc')
      sign_in_at('bay_pc', OLU, :owner_signin)
      desktop('bay_pc', :owner_desktop)
      folder(:owner_folder)
      sign_out('bay_pc')
      sign_in_at('store_pc', ADEL, :store_admin_signin)
      desktop('store_pc', :store_desktop)
      sign_in_at('bay_pc', UMA)
      get game_path('scenario'), as: :json
      @marks[:reload] = rec
      @log
    end

    def lines(rows)
      rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
    end

    def scan(rows, **options)
      AccessLeakScanner.new(scenario).scan(lines(rows), **options)
    end

    def deep(row)
      Marshal.load(Marshal.dump(row))
    end

    def owners(findings)
      findings.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    # Judges `replacement` in the place of the logged row `mark`, after every row that came before it.
    def judged_in_place(mark, replacement)
      index = @log.index { |r| r.equal?(mark) }
      rows = @log.first(index) + [replacement]
      scan(rows).select { |f| f.line == index + 1 }
    end

    test 'the whole played run, uninjected, reports nothing' do
      run_game
      assert_operator @log.length, :>, 15
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal 'admin', @marks[:admin_signin]['body']['access']
      assert_nil @marks[:uma_signin]['body']['access']
      assert_equal %w[olu_budget], @marks[:admin_folder]['body']['contents'].map { |c| c['id'] }
      assert_equal 1, @marks[:admin_audit]['body']['rows'].count { |r| r['event'] == 'ADMIN_READ' }
      assert_equal 'admin', @marks[:reload]['body'].dig('sessions', 'store_pc', 'access')
    end

    test 'an access key on an ordinary account sign-in answer is reported' do
      run_game
      row = deep(@marks[:uma_signin])
      row['body']['access'] = 'admin'
      assert_includes owners(judged_in_place(@marks[:uma_signin], row)), %w[ops_string ops:key:access]
    end

    test 'an access key on the administrator sign-in is reported when the run did not earn it, and a sign-in at a PC naming no PC earns nothing' do
      run_game
      row = deep(@marks[:admin_signin])
      row.delete('login')
      row['body']['host'] = 'NOWHERE01'
      assert_includes owners(judged_in_place(@marks[:admin_signin], row)), %w[ops_string ops:key:access], 'admitted at two PCs and named by none: nothing earned'
      assert_empty judged_in_place(@marks[:admin_signin], deep(@marks[:admin_signin])), 'the real, tagged answer is clear'
      assert_empty scan(@log, ops_steps: [])
      named = deep(row)
      assert_empty scan(@log.first(@log.index { |r| r.equal?(@marks[:admin_signin]) }) + [named], ops_steps: ['admin:bay_pc']),
                    'the caller can name the step for an untagged log'
    end

    test 'an admin key inside an NPC record or a creds object is reported wherever it appears' do
      run_game
      boot = deep(@marks[:bootstrap])
      boot['body']['npcs'] = [{ 'id' => 'adel', 'npcType' => 'person', 'admin' => true }]
      assert_includes owners(judged_in_place(@marks[:bootstrap], boot)), %w[ops_string ops:key:admin]
      room = deep(@marks[:admin_desktop])
      room['body']['extra'] = { 'creds' => { 'username' => 'x', 'admin' => true } }
      assert_includes owners(judged_in_place(@marks[:admin_desktop], room)), %w[ops_string ops:key:admin]
    end

    test 'the owner profile items under an ordinary session are reported, and the admin session earns them only at its own PC' do
      run_game
      desk = deep(@marks[:uma_desktop])
      desk['body']['contents'] << { 'id' => 'olu_notes', 'name' => 'Olu notes.txt', 'type' => 'notes' }
      found = judged_in_place(@marks[:uma_desktop], desk)
      assert_includes owners(found), %w[profile_admin_read item:olu_notes]
      assert_empty judged_in_place(@marks[:admin_desktop], deep(@marks[:admin_desktop])), 'the same item under the admin session is clear'
      # the administrator's session at the OTHER PC does not open the bay PC owner's profile
      other = deep(@marks[:store_desktop])
      other['body']['contents'] << { 'id' => 'olu_notes', 'name' => 'Olu notes.txt', 'type' => 'notes' }
      assert_includes owners(judged_in_place(@marks[:store_desktop], other)), %w[profile_admin_read item:olu_notes]
    end

    test 'a folder of the owner profile read with no admin session earned is reported' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_folder]) }
      without_signin = @log.first(index).reject { |r| r.equal?(@marks[:admin_signin]) }
      rows = without_signin + [@marks[:admin_folder]]
      assert_includes owners(scan(rows).select { |f| f.rule == 'profile_admin_read' }), %w[profile_admin_read item:olu_budget]
    end

    test 'admin earned at one PC and used at the other is reported, in a sign-in, a mirror entry and a host row' do
      run_game
      store = deep(@marks[:uma_signin])
      store['body']['host'] = 'RECS01'
      store['body']['access'] = 'admin'
      assert_includes owners(judged_in_place(@marks[:uma_signin], store)), %w[ops_string ops:key:access]
      # earned at bay_pc only (the store sign-in left out), then a mirror entry at store_pc carries admin
      index = @log.index { |r| r.equal?(@marks[:reload]) }
      rows = @log.first(index).reject { |r| r.equal?(@marks[:store_admin_signin]) }
      reload = deep(@marks[:reload])
      reload['body']['sessions']['store_pc']['access'] = 'admin'
      found = scan(rows + [reload]).select { |f| f.line == rows.length + 1 }
      assert_includes owners(found), %w[ops_string ops:key:access]
    end

    test 'the admin read row is reported when no admin read of the profile was earned, and passes after one' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_audit]) }
      without_read = @log.first(index).reject { |r| r.equal?(@marks[:admin_folder]) }
      found = scan(without_read + [@marks[:admin_audit]]).select { |f| f.rule == 'log_row' }
      assert_equal [%w[log_row log:admin_read:bay_pc]], owners(found)
      assert_empty scan(@log).select { |f| f.rule == 'log_row' }
    end

    test 'an admin read row after the reading session was a user session only is reported' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_audit]) }
      # the folder was opened by the owner's own session (no audit row would exist): leave the admin folder read out and keep the owner's
      rows = @log.first(index).reject { |r| r.equal?(@marks[:admin_folder]) } + [@marks[:admin_audit]]
      assert_includes owners(scan(rows)), %w[log_row log:admin_read:bay_pc]
    end

    def strip_admin_grants(node)
      case node
      when Array then node.each { |v| strip_admin_grants(v) }
      when Hash
        node['grants']['session'].delete('access') if node['grants'].is_a?(Hash) && node['grants']['session'].is_a?(Hash)
        node.each_value { |v| strip_admin_grants(v) }
      end
    end

    test 'a scenario with no admin account and no admin grant is judged as before: no privilege rule runs' do
      run_game
      data = scenario
      data['rooms'].each_value { |room| Array(room['npcs']).each { |npc| npc['creds']&.delete('admin') } }
      strip_admin_grants(data)
      rows = deep(@log)
      assert_empty AccessLeakScanner.new(data).scan(lines(rows)).select { |f| f.rule == 'profile_admin_read' || f.owner == 'ops:key:admin' }
    end
  end
end
