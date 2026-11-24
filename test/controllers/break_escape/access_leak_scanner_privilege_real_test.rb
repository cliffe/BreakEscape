require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S5a unit 16 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, the leak scanner's privilege rules): the scanner run over REAL answers
  # of a game of scenarios/test_ops_privilege, as ops_privilege_scenario_test plays it (an ordinary account, the owner's
  # profile refused to it, the administrator at the owner's PC with its folder read, the administrator at the other PC, the
  # owner's own read, a reload). The answers are recorded as the browser's log holds them: a keyboard sign-in row has no tag
  # and no PC id, so each sign-in is named to the scanner by `signins:` (the leak check's `--signin`), as a tester does. The
  # whole run must report nothing, and one fault at a time is injected into a copy of one answer, or one earlier step is
  # left out, and must be reported. The audit rows are read through GET /log_rows on the lobby's reader terminal.
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

    # One recorded answer, in the browser log's shape (no request body, no tag), with a time.
    def rec(extra = {})
      @log << { 't' => (Time.utc(2026, 1, 1) + @log.length).iso8601(3), 'method' => request.request_method,
                'path' => request.path, 'status' => response.status, 'body' => response.parsed_body }.merge(extra)
      @log.last
    end

    # A sign-in; the entry that names its PC for the scanner (the account's n-th sign-in) is kept in @signins.
    def sign_in_at(pc, creds, mark = nil)
      body = sign_in(pc, *creds)
      assert body['success'], body.to_s
      row = rec
      @counts[body['npcId']] += 1
      @signins << "#{body['npcId']}@#{pc}##{@counts[body['npcId']]}"
      @marks[mark] = row if mark
      row
    end

    def synthetic(method, path, status, body)
      { 't' => '2026-01-01T09:00:00.000Z', 'method' => method, 'path' => "/break_escape/games/0/#{path}", 'status' => status, 'body' => body }
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
      @signins = []
      @counts = Hash.new(0)
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
      @marks[:admin_signout] = sign_out('bay_pc')
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
      AccessLeakScanner.new(scenario).scan(lines(rows), **{ signins: @signins }.merge(options))
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

    test 'an access key on the administrator sign-in is reported when the run did not earn it, and a label naming no PC earns nothing' do
      run_game
      row = deep(@marks[:admin_signin])
      row['body']['host'] = 'NOWHERE01'
      assert_includes owners(judged_in_place(@marks[:admin_signin], row)), %w[ops_string ops:key:access], 'a label that names no PC is not guessed'
      assert_empty judged_in_place(@marks[:admin_signin], deep(@marks[:admin_signin])), 'the real answer, with its row named, is clear'
      assert_empty scan(@log, ops_steps: [])
    end

    test 'a label naming no PC does not fall through to the one PC that admits the account' do
      run_game
      data = scenario
      data['rooms'].each_value do |room|
        Array(room['objects']).each { |o| o['access'] = { 'people' => %w[uma olu] } if o['id'] == 'store_pc' }
      end
      index = @log.index { |r| r.equal?(@marks[:admin_signin]) }
      plain = @log.first(index + 1)
      unnamed = deep(@marks[:admin_signin])
      unnamed['body']['host'] = 'NOWHERE01'
      judge = ->(rows) { AccessLeakScanner.new(data).scan(lines(rows), signins: []).select { |f| f.line == index + 1 } }
      assert_empty judge.call(plain), 'one PC admits the account: the unlabelled sign-in is credited to it'
      assert_includes owners(judge.call(plain.first(index) + [unnamed])), %w[ops_string ops:key:access]
    end

    # A real browser capture of a played test_ops_privilege (the scripted S5a playtest: no recorder tag, no request body).
    def browser_run
      %w[ops_privilege_browser_run_1.jsonl ops_privilege_browser_run_2.jsonl].flat_map do |name|
        File.foreach(File.expand_path("../../fixtures/files/#{name}", __dir__)).with_index(1).map { |text, no| [name, no, JSON.parse(text)] }
      end
    end

    # The two capture fixtures predate the scenario's later edits (R3-B3): row 1 has the policy key `records`, `olu_folder` is still
    # a `zip_archive`, and the run has no `container/olu_folder` request, no ADMIN_READ row and no power-on. They still prove the
    # unnamed-sign-in case on a real capture (and, with the two session-end rules, that no rule reports a leak in a correct run).
    # A fresh capture of the replayed playtest will be added after the replay.
    BROWSER_SIGNINS = %w[uma@bay_pc#1 adel@bay_pc#1 adel@bay_pc#2 adel@bay_pc#5].freeze

    test 'the real browser capture reports nothing when each untagged keyboard sign-in is named, and its false alarms are all the sign-ins' do
      run = browser_run
      real = AccessLeakScanner.new(scenario)
      assert_empty real.scan(run, signins: BROWSER_SIGNINS).map { |f| [f.source, f.line, f.rule, f.owner] }
      assert_empty real.unused_entries, 'every entry matched a row; the token deadline and the host-row rules report nothing in this run'
      bare = AccessLeakScanner.new(scenario).scan(run)
      assert_equal %w[ops_string profile_admin_read], bare.map(&:rule).uniq.sort, 'unnamed sign-ins earn nothing: fail closed'
      assert_equal [17, 10], [bare.count { |f| f.rule == 'profile_admin_read' }, bare.count { |f| f.rule == 'ops_string' }]
      wrong = AccessLeakScanner.new(scenario).scan(run, signins: BROWSER_SIGNINS.map { |e| e == 'adel@bay_pc#1' ? 'adel@store_pc#1' : e })
      refute_empty wrong, 'the wrong PC named is still a finding'
    end

    test 'a malformed signin entry is refused' do
      run_game
      assert_raises(ArgumentError) { scan(@log, signins: ['adel-bay_pc']) }
    end

    test 'an untagged keyboard sign-in where two PCs admit the account earns nothing; the entry for that row names its PC' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_signin]) }
      rows = @log.first(index + 1)
      others = @signins.reject { |e| e.start_with?('adel@') }
      assert_includes owners(scan(rows, signins: others)), %w[ops_string ops:key:access], 'no entry: nothing earned, the answer shows admin'
      assert_empty scan(rows, signins: others + ['adel@bay_pc#1']), 'the right PC named: credited'
      assert_empty scan(rows, signins: others + ["adel@bay_pc@#{@marks[:admin_signin]['t']}"]), 'named by the row time'
      assert_includes owners(scan(rows, signins: others + ["adel@bay_pc@#{@marks[:uma_signin]['t']}"])), %w[ops_string ops:key:access], 'another row time credits nothing'
      assert_includes owners(scan(rows, signins: others + ['adel@bay_pc#2'])), %w[ops_string ops:key:access], 'another sign-in of the account credits nothing here'
    end

    test 'the wrong PC named is still a finding: the later admin reads at the PC it really was are reported' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_folder]) }
      found = scan(@log.first(index + 1), signins: @signins.map { |e| e == 'adel@bay_pc#1' ? 'adel@store_pc#1' : e })
      assert_includes owners(found), %w[profile_admin_read item:olu_budget]
    end

    test 'another account sign-in is not credited by an entry for the administrator' do
      run_game
      row = deep(@marks[:uma_signin])
      row['body']['access'] = 'admin'
      found = scan(@log.first(@log.index { |r| r.equal?(@marks[:uma_signin]) }) + [row], signins: @signins.reject { |e| e.start_with?('uma@') })
      assert_includes owners(found), %w[ops_string ops:key:access]
    end

    test 'nothing is earned before the sign-in row, and a supplied admin step is refused' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_signin]) }
      early = deep(@marks[:uma_desktop])
      early['body']['access'] = 'admin'
      early['body']['contents'] << { 'id' => 'olu_notes', 'name' => 'Olu notes.txt', 'text' => "Olu's notes: the bay PC is mine, ask before you borrow it." }
      rows = @log.first(@log.index { |r| r.equal?(@marks[:uma_desktop]) }) + [early] + @log[(@log.index { |r| r.equal?(@marks[:uma_desktop]) } + 1)..index]
      found = scan(rows, signins: @signins).select { |f| f.line == rows.index(early) + 1 }
      assert_includes owners(found), %w[ops_string ops:key:access]
      assert_includes owners(found), %w[profile_admin_read item:olu_notes]
      assert_raises(ArgumentError) { scan(@log, ops_steps: ['admin:bay_pc']) }
    end

    # R2-C2: after the session ended any way the capture shows, admin content at that PC is a finding.
    def after_end(end_rows)
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      folder_row = deep(@marks[:admin_folder])
      desk = deep(@marks[:admin_desktop])
      base = @log.first(index + 1)
      assert_empty scan(base + [deep(folder_row), deep(desk)]).select { |f| f.line > base.length }, 'still held: clear'
      scan(base + end_rows + [folder_row, desk]).select { |f| f.line > base.length + end_rows.length }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def assert_admin_refused_after(end_rows)
      found = after_end(end_rows)
      assert_includes found, %w[profile_admin_read item:olu_budget]
      assert_includes found, %w[ops_string ops:key:access]
    end

    test 'a successful sign-out ends the administrator step' do
      assert_admin_refused_after([synthetic('POST', 'logout', 200, { 'success' => true, 'endedPcIds' => [] })])
    end

    test 'a lock ends the administrator step' do
      assert_admin_refused_after([synthetic('POST', 'lock_session', 200, { 'success' => true, 'pcId' => 'bay_pc', 'locked' => true })])
    end

    test 'a later sign-in by an ordinary account at that PC ends the administrator step' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      later = synthetic('POST', 'login', 200, deep(@marks[:uma_signin])['body'])
      found = scan(base + [later, deep(@marks[:admin_folder])]).select { |f| f.line > base.length }
      assert_includes owners(found), %w[profile_admin_read item:olu_budget]
    end

    test 'a desktop answer refusing with off or not_responding or a lapsed session ends the administrator step' do
      %w[off not_responding expired no_session].each do |reason|
        assert_admin_refused_after([synthetic('GET', 'container/bay_pc', 403, { 'error' => 'refused', 'reason' => reason })])
      end
    end

    test 'a PC named in endedPcIds (a hand-back or a displacing grant) ends the administrator step' do
      assert_admin_refused_after([synthetic('POST', 'login', 200, { 'success' => false, 'endedPcIds' => ['bay_pc'] })])
    end

    test 'a bootstrap that lacks the PC, holds it locked or for another account ends the administrator step' do
      assert_admin_refused_after([synthetic('GET', 'scenario', 200, { 'sessions' => {} })])
      assert_admin_refused_after([synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'locked' => true } } })])
      held = [synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'uma' } } })]
      assert_admin_refused_after(held)
    end

    test 'a profile folder item in an unlock answer needs the earned session too' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:uma_desktop]) }
      unlock = synthetic('POST', 'unlock', 200, { 'success' => true, 'type' => 'object', 'hasContents' => true,
                                                    'contents' => [{ 'id' => 'olu_budget', 'name' => 'Budget draft.txt', 'type' => 'text_file',
                                                                     'text' => 'Budget draft: the van, the toner and one new chair.' }] })
      found = scan(@log.first(index + 1) + [unlock]).select { |f| f.line == index + 2 }
      assert_includes owners(found), %w[profile_admin_read item:olu_budget]
      admin_index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      assert_empty scan(@log.first(admin_index + 1) + [unlock]).select { |f| f.line == admin_index + 2 }, 'under the admin session: clear'
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
      # R2-C4: a keyboard desktop answer carrying `via: technique` is judged as before (no owner, so reported)
      desk = deep(@marks[:uma_desktop])
      desk['body']['via'] = 'technique'
      desk['body']['access'] = 'admin'
      found = AccessLeakScanner.new(data).scan(lines([desk]))
      assert_includes owners(found), %w[ops_string ops:key:via]
      assert_includes owners(found), %w[ops_string ops:key:access]
    end

    # ---- R3 fix pass: C1 (a named sign-in), C3 (a bootstrap without access), B1 (--resume), the deadline and host-row rules ----

    def at(row, time)
      copy = deep(row)
      copy['t'] = time
      copy
    end

    def found_after(rows, from, **options)
      scan(rows, **options).select { |f| f.line > from }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    # Uma's second keyboard sign-in (a copy of her real answer) at a time of its own, so an entry can name it by the row time.
    def uma_again(time)
      at(deep(@marks[:uma_signin]), time)
    end

    test 'R3-C1: a sign-in named at a PC that does not admit the account is refused with a clear message' do
      run_game
      data = scenario
      data['rooms'].each_value { |room| Array(room['objects']).each { |o| o['access'] = { 'people' => %w[olu adel] } if o['id'] == 'store_pc' } }
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      rows = @log.first(index + 1) + [uma_again('2026-01-01T09:00:01.000Z'), deep(@marks[:admin_folder])]
      error = assert_raises(ArgumentError) do
        AccessLeakScanner.new(data).scan(lines(rows), signins: @signins.first(2) + ['uma@store_pc@2026-01-01T09:00:01.000Z'])
      end
      assert_match(/store_pc does not admit uma/, error.message)
      assert_includes owners(AccessLeakScanner.new(data).scan(lines(rows), signins: @signins.first(2) + ['uma@bay_pc@2026-01-01T09:00:01.000Z'])), %w[profile_admin_read item:olu_budget],
                      'named at the PC it really was: the step goes and the folder read is reported'
    end

    test 'R3-C1: an ordinary sign-in named at the other PC leaves the step at the PC it displaced until a desktop answer shows who holds it' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      later = uma_again('2026-01-01T09:00:01.000Z')
      desk = at(@marks[:uma_desktop], '2026-01-01T09:00:02.000Z')
      entry = ['uma@store_pc@2026-01-01T09:00:01.000Z']
      # the client asks for the desktop straight after a sign-in: it shows Uma at the bay PC, and the step is gone
      assert_includes found_after(base + [later, desk, deep(@marks[:admin_folder])], base.length + 2, signins: @signins.first(2) + entry), %w[profile_admin_read item:olu_budget]
      # with no desktop row between, the trust given to a named entry is the documented limit
      assert_empty found_after(base + [later, deep(@marks[:admin_folder])], base.length + 1, signins: @signins.first(2) + entry)
    end

    test 'R3-C1: an unnamed ordinary sign-in takes the step back at every PC that admits the account' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      found = found_after(base + [uma_again('2026-01-01T09:00:01.000Z'), deep(@marks[:admin_folder])], base.length + 1)
      assert_includes found, %w[profile_admin_read item:olu_budget]
    end

    test 'R3-C3: a bootstrap entry for the same account, unlocked, without access admin takes the step back' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      boot = synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'via' => 'password' } } })
      found = found_after(base + [boot, deep(@marks[:admin_folder]), deep(@marks[:admin_desktop])], base.length + 1)
      assert_includes found, %w[profile_admin_read item:olu_budget]
      assert_includes found, %w[ops_string ops:key:access]
      held = synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'via' => 'password', 'access' => 'admin' } } })
      assert_empty found_after(base + [held, deep(@marks[:admin_folder]), deep(@marks[:admin_desktop])], base.length + 1), 'still admin: clear'
    end

    # A power cut: the 403 comes, then the surviving session's desktop opens with the marker (no sign-in row).
    def power_cut_rows(end_between: nil)
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      refused = synthetic('GET', 'container/bay_pc', 403, { 'error' => 'refused', 'reason' => 'off' }).merge('t' => '2026-01-01T09:00:01.000Z')
      back = at(@marks[:admin_desktop], '2026-01-01T09:00:09.000Z')
      rows = @log.first(index + 1) + [refused] + [end_between].compact + [back, deep(@marks[:admin_folder])]
      [rows, index + 3 + [end_between].compact.length]
    end

    test 'R3-B1: a 200 desktop answer after the power came back does not restore the step by itself' do
      rows, desk_at = power_cut_rows
      found = found_after(rows, desk_at - 1, signins: @signins.first(2))
      assert_includes found, %w[profile_admin_read item:olu_budget]
      assert_includes found, %w[ops_string ops:key:access]
    end

    test 'R3-B1: --resume names that one desktop row after the 403 and clears it, and what follows' do
      rows, desk_at = power_cut_rows
      scanner = AccessLeakScanner.new(scenario)
      assert_empty scanner.scan(lines(rows), signins: @signins.first(2), resumes: ['adel@bay_pc@2026-01-01T09:00:09.000Z']).select { |f| f.line >= desk_at }
      assert_empty scanner.unused_entries
    end

    test 'R3-B1: a resume of another account, another PC, a row before the 403 or after a real end does not clear the row' do
      [['uma@bay_pc@2026-01-01T09:00:09.000Z', nil],
       ['adel@store_pc@2026-01-01T09:00:09.000Z', nil],
       ['adel@bay_pc@2026-01-01T09:00:08.000Z', nil],
       ['adel@bay_pc@2026-01-01T09:00:09.000Z', synthetic('GET', 'scenario', 200, { 'sessions' => {} })],
       ['adel@bay_pc@2026-01-01T09:00:09.000Z', synthetic('POST', 'lock_session', 200, { 'success' => true, 'pcId' => 'bay_pc', 'locked' => true })]].each do |entry, between|
        rows, desk_at = power_cut_rows(end_between: between)
        scanner = AccessLeakScanner.new(scenario)
        found = scanner.scan(lines(rows), signins: @signins.first(2), resumes: [entry]).select { |f| f.line >= desk_at }.map { |f| [f.rule, f.owner] }
        assert_includes found, %w[profile_admin_read item:olu_budget], entry
        assert_equal ["#{entry} (--resume)"], scanner.unused_entries, entry
      end
    end

    test 'R3-B1: a resume row that is the row before the 403 (the time of the earlier desktop answer) is an unused entry' do
      rows, = power_cut_rows
      scanner = AccessLeakScanner.new(scenario)
      scanner.scan(lines(rows), signins: @signins.first(2), resumes: ["adel@bay_pc@#{@marks[:admin_desktop]['t']}"])
      assert_equal 1, scanner.unused_entries.length
    end

    # The token deadline: a credential sign-in with `expiresInS`, its row time plus that is the last second of the admin step.
    def token_rows(folder_at)
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_signin]) }
      token = deep(@marks[:admin_signin])
      token['body'].merge!('via' => 'credential', 'kind' => 'token', 'expiresInS' => 60)
      token['t'] = '2026-01-01T10:00:00.000Z'
      rows = @log.first(index) + [token, at(@marks[:admin_folder], folder_at)]
      [rows, index + 1]
    end

    test 'R3 check 2: the admin step from a token is gone after the token deadline, and held before it' do
      rows, from = token_rows('2026-01-01T10:00:30.000Z')
      assert_empty found_after(rows, from, signins: @signins.first(2))
      lapsed, from = token_rows('2026-01-01T10:01:30.000Z')
      assert_includes found_after(lapsed, from, signins: @signins.first(2)), %w[profile_admin_read item:olu_budget]
    end

    test 'R3 check 2: a desktop answer or a host row that shows no admin session for the held account takes the step back' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      folder_row = deep(@marks[:admin_folder])
      desk = deep(@marks[:admin_desktop])
      without_access = deep(desk)
      without_access['body']['session'].delete('access')
      other = deep(desk)
      other['body']['session']['npcId'] = 'uma'
      no_session = deep(desk)
      no_session['body'].delete('session')
      [without_access, other, no_session].each do |answer|
        assert_includes found_after(base + [answer, deep(folder_row)], base.length + 1), %w[profile_admin_read item:olu_budget]
      end
      host = lambda do |session|
        entry = { 'id' => 'bay_pc', 'kind' => 'pc', 'name' => 'Bay desk PC', 'host' => 'BAY01', 'sprite' => 'pc_desktop' }
        entry['session'] = session if session
        synthetic('GET', 'network', 200, { 'footholds' => [{ 'id' => 'f', 'hosts' => [entry] }] })
      end
      assert_includes found_after(base + [host.call(nil), deep(folder_row)], base.length + 1), %w[profile_admin_read item:olu_budget]
      assert_includes found_after(base + [host.call({ 'username' => 'adelwick', 'via' => 'password' }), deep(folder_row)], base.length + 1), %w[profile_admin_read item:olu_budget]
      assert_empty found_after(base + [host.call({ 'username' => 'adelwick', 'via' => 'password', 'access' => 'admin' }), deep(folder_row)], base.length + 1)
    end

    test 'R3-C2: entries are parsed strictly and an entry that matched no row is reported' do
      run_game
      ['adel@bay_pc#1x', 'adel@bay_pc#0', 'adel@bay_pc#abc', 'adel@nowhere#1', 'nobody@bay_pc#1'].each do |entry|
        assert_raises(ArgumentError, entry) { scan(@log, signins: [entry]) }
      end
      assert_raises(ArgumentError) { scan(@log, signins: ['adel@bay_pc#1', 'adel@bay_pc#1']) }
      assert_raises(ArgumentError) { scan(@log, signins: [], resumes: ['adel@bay_pc']) }
      scanner = AccessLeakScanner.new(scenario)
      scanner.scan(lines(@log), signins: @signins + ['adel@bay_pc#9', 'adel@bay_pc@2030-01-01T00:00:00Z'])
      assert_equal ['adel@bay_pc#9 (--signin)', 'adel@bay_pc@2030-01-01T00:00:00Z (--signin)'], scanner.unused_entries
      all = AccessLeakScanner.new(scenario)
      all.scan(lines(@log), signins: @signins)
      assert_empty all.unused_entries
    end
  end
end
