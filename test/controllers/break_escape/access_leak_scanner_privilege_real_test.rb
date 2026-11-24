require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative 'ops_privilege_scenario_test'
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
      # Every other sign-in PC (the cached-account PCs of S5b admit Adel too) is closed to her, so bay_pc is the one PC that admits her.
      data['rooms'].each_value do |room|
        Array(room['objects']).each do |o|
          o['access'] = { 'people' => %w[uma olu] } if o['type'] == 'pc' && o['id'] != 'bay_pc' && o['id'] != 'bay_usb_port'
        end
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
      error = assert_raises(ArgumentError, 'R4-7: the wrong PC named is refuted by the desktop that follows it') do
        AccessLeakScanner.new(scenario).scan(run, signins: BROWSER_SIGNINS.map { |e| e == 'adel@bay_pc#1' ? 'adel@store_pc#1' : e })
      end
      assert_match(/desktop that followed it is bay_pc/, error.message)
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

    test 'R4-7: the wrong PC named is an error (exit 2) once the desktop that follows the sign-in shows where it was' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_folder]) }
      error = assert_raises(ArgumentError) { scan(@log.first(index + 1), signins: @signins.map { |e| e == 'adel@bay_pc#1' ? 'adel@store_pc#1' : e }) }
      assert_match(/sign-in entry adel@store_pc.*desktop that followed it is bay_pc/, error.message)
      # no desktop row follows: the name stands (the documented remainder)
      row = @marks[:admin_signin]
      assert_nothing_raised { scan(@log.first(@log.index { |r| r.equal?(row) } + 1), signins: @signins.map { |e| e == 'adel@bay_pc#1' ? 'adel@store_pc#1' : e }) }
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
      # the client asks for the desktop straight after a sign-in: it shows Uma at the bay PC, so the name is refuted (R4-7)
      assert_raises(ArgumentError) { found_after(base + [later, desk, deep(@marks[:admin_folder])], base.length + 2, signins: @signins.first(2) + entry) }
      # with no desktop row between, the name stands
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

    # ---- Ops S5a fix: the second real browser run (game 72, four capture files), --logout, and --resume after a downgrade ----

    RUN72_FILES = %w[ops_privilege_run72_1.jsonl ops_privilege_run72_2.jsonl ops_privilege_run72_3.jsonl ops_privilege_run72_4.jsonl].freeze
    # Sign-ins in order (every successful POST /login): uma#1 bay, adel#1 bay, adel#2 bay (lock-screen unlock), adel#3 and #4 remote at
    # BAY01 (their host label names the PC), adel#5 bay, uma#2 and #3 remote at RECS01. The fifth successful POST /logout answer
    # (row 141 of the first file, "Records PC: Signed out") was at store_pc, where the technique session of adel was held; the
    # answer names no PC, and the bay desk's admin session went on (the resumed captures open it with no sign-in).
    RUN72_SIGNINS = %w[uma@bay_pc#1 adel@bay_pc#1 adel@bay_pc#2 adel@bay_pc#5].freeze
    RUN72_LOGOUT = 'adel@store_pc#5'.freeze

    def run72
      RUN72_FILES.flat_map do |name|
        File.foreach(File.expand_path("../../fixtures/files/#{name}", __dir__)).with_index(1).map { |text, no| [name, no, JSON.parse(text)] }
      end
    end

    test 'Ops S5a fix: the second real browser run reports nothing with every keyboard sign-in and the one store logout named' do
      scanner = AccessLeakScanner.new(scenario)
      assert_empty scanner.scan(run72, signins: RUN72_SIGNINS, logouts: [RUN72_LOGOUT]).map { |f| [f.source, f.line, f.rule, f.owner] }
      assert_empty scanner.unused_entries
    end

    test 'Ops S5a fix: the same run without the logout named gives 38 findings (a logout names no PC, so it ends every PC), and with nothing named 112' do
      signed = AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS)
      assert_equal({ 'ops_string' => 20, 'profile_admin_read' => 18 }, signed.group_by(&:rule).transform_values(&:length))
      bare = AccessLeakScanner.new(scenario).scan(run72)
      assert_equal 112, bare.length
    end

    test 'Ops S5a fix: the logout entry names a PC and an account: a wrong account, another PC or a wrong number is unused and the row ends every PC' do
      ['uma@store_pc#5', 'adel@store_pc#4', 'adel@store_pc#6', 'adel@store_pc@2026-01-01T00:00:00Z'].each do |entry|
        scanner = AccessLeakScanner.new(scenario)
        found = scanner.scan(run72, signins: RUN72_SIGNINS, logouts: [entry])
        assert_equal 38, found.length, entry
        assert_equal ["#{entry} (--logout)"], scanner.unused_entries, entry
      end
      by_time = AccessLeakScanner.new(scenario)
      time = run72[140][2]['t']
      assert_empty by_time.scan(run72, signins: RUN72_SIGNINS, logouts: ["adel@store_pc@#{time}"])
    end

    test 'Ops S5a fix: --logout entries are parsed strictly' do
      ['adel@store_pc#0', 'adel@store_pc#1x', 'adel@nowhere#1', 'nobody@store_pc#1', 'adel@store_pc'].each do |entry|
        assert_raises(ArgumentError, entry) { AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS, logouts: [entry]) }
      end
      assert_raises(ArgumentError) { AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS, logouts: [RUN72_LOGOUT, RUN72_LOGOUT]) }
    end

    # Admin at bay_pc (Adel), Uma remote at store_pc, then one logout (the second successful one), then Adel's folder read again.
    def logout_rows(between: [])
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      uma = synthetic('POST', 'login', 200, { 'success' => true, 'npcId' => 'uma', 'via' => 'password', 'host' => 'RECS01', 'remote' => true })
      uma['t'] = '2026-01-01T09:00:01.000Z'
      out = synthetic('POST', 'logout', 200, { 'success' => true, 'endedPcIds' => [] }).merge('t' => '2026-01-01T09:00:05.000Z')
      rows = @log.first(index + 1) + [uma] + between + [out, deep(@marks[:admin_folder])]
      [rows, rows.length - 1]
    end

    test 'Ops S5a fix: a named logout ends that PC only; the injected leaks (other PC, other account, before the row, after an end) are still reported' do
      rows, from = logout_rows
      base = { signins: @signins.first(2) }
      assert_includes found_after(rows, from - 1, **base), %w[profile_admin_read item:olu_budget] # unnamed: ends every PC
      assert_empty found_after(rows, from - 1, **base, logouts: ['uma@store_pc#2']), 'the named store logout leaves the bay admin step'
      assert_includes found_after(rows, from - 1, **base, logouts: ['uma@bay_pc#2']), %w[profile_admin_read item:olu_budget] # other PC: Uma is not held at the bay desk
      assert_includes found_after(rows, from - 1, **base, logouts: ['adel@store_pc#2']), %w[profile_admin_read item:olu_budget] # other account
      assert_includes found_after(rows, from - 1, **base, logouts: ['uma@store_pc#1']), %w[profile_admin_read item:olu_budget] # the earlier logout row
      lock = synthetic('POST', 'lock_session', 200, { 'success' => true, 'pcId' => 'bay_pc', 'locked' => true }).merge('t' => '2026-01-01T09:00:02.000Z')
      ended, from_ended = logout_rows(between: [lock])
      assert_includes found_after(ended, from_ended - 1, **base, logouts: ['uma@store_pc#2']), %w[profile_admin_read item:olu_budget] # after an end
      scanner = AccessLeakScanner.new(scenario)
      scanner.scan(lines(rows), **base, logouts: ['uma@bay_pc#2'])
      assert_equal ['uma@bay_pc#2 (--logout)'], scanner.unused_entries
    end

    # The session is shown without access (an off PC lists it so), then the desktop opens again with the marker, no sign-in, no 403.
    def downgrade_rows(first_answer, end_between: nil)
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      shown = first_answer.merge('t' => '2026-01-01T09:00:01.000Z')
      back = at(@marks[:admin_desktop], '2026-01-01T09:00:09.000Z')
      rows = @log.first(index + 1) + [shown] + [end_between].compact + [back, deep(@marks[:admin_folder])]
      [rows, index + 3 + [end_between].compact.length]
    end

    def off_boot
      synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'via' => 'password' } } })
    end

    # A host row as the server sends it when the PC's service is off (R4-4): no `session`, `responding: false`, `heldAs` the
    # held account's display name; a network answer lists each PC twice (here two footholds).
    def off_host
      entry = { 'id' => 'bay_pc', 'kind' => 'pc', 'name' => 'Bay desk PC', 'host' => 'BAY01', 'sprite' => 'pc_desktop',
                'responding' => false, 'heldAs' => 'Adel Wick' }
      synthetic('GET', 'network', 200, { 'footholds' => [{ 'id' => 'f', 'hosts' => [entry] }, { 'id' => 'g', 'hosts' => [deep(entry)] }] })
    end

    # The row of a session shown without `access` (a downed route lists it so), a different shape from the off PC's.
    def route_down_host(session = {})
      entry = { 'id' => 'bay_pc', 'kind' => 'pc', 'name' => 'Bay desk PC', 'host' => 'BAY01', 'sprite' => 'pc_desktop', 'remoteSignIn' => true,
                'session' => { 'username' => 'adelwick', 'displayName' => 'Adel Wick', 'via' => 'password', 'remote' => false }.merge(session) }
      synthetic('GET', 'network', 200, { 'footholds' => [{ 'id' => 'f', 'hosts' => [entry] }, { 'id' => 'g', 'hosts' => [deep(entry)] }] })
    end

    test 'Ops S5a fix: --resume after a bootstrap or a network row that showed the held session without access restores that one desktop row' do
      time = '2026-01-01T09:00:09.000Z'
      [-> { off_boot }, -> { off_host }, -> { route_down_host }].each do |shown|
        rows, desk_at = downgrade_rows(shown.call)
        assert_includes found_after(rows, desk_at - 1, signins: @signins.first(2)), %w[profile_admin_read item:olu_budget]
        scanner = AccessLeakScanner.new(scenario)
        assert_empty scanner.scan(lines(rows), signins: @signins.first(2), resumes: ["adel@bay_pc@#{time}"]).select { |f| f.line >= desk_at }
        assert_empty scanner.unused_entries
      end
    end

    test 'Ops S5a fix: a resume after a downgrade is refused for another PC, another account, a row before the downgrade, a row that is the downgrade, or after an end' do
      time = '2026-01-01T09:00:09.000Z'
      lock = synthetic('POST', 'lock_session', 200, { 'success' => true, 'pcId' => 'bay_pc', 'locked' => true }).merge('t' => '2026-01-01T09:00:02.000Z')
      [["adel@store_pc@#{time}", nil], ["uma@bay_pc@#{time}", nil], ['adel@bay_pc@2026-01-01T09:00:00.500Z', nil],
       ["adel@bay_pc@#{time}", lock]].each do |entry, between|
        rows, desk_at = downgrade_rows(off_host, end_between: between)
        scanner = AccessLeakScanner.new(scenario)
        found = scanner.scan(lines(rows), signins: @signins.first(2), resumes: [entry]).select { |f| f.line >= desk_at }.map { |f| [f.rule, f.owner] }
        assert_includes found, %w[profile_admin_read item:olu_budget], entry
        assert_equal ["#{entry} (--resume)"], scanner.unused_entries, entry
      end
      # a 200 desktop row that shows no access at 09:00:01 and is itself named: it is the downgrade, not a return
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      bare = at(@marks[:admin_desktop], '2026-01-01T09:00:01.000Z')
      bare['body']['session'].delete('access')
      scanner = AccessLeakScanner.new(scenario)
      found = scanner.scan(lines(@log.first(index + 1) + [bare, deep(@marks[:admin_folder])]), signins: @signins.first(2), resumes: ['adel@bay_pc@2026-01-01T09:00:01.000Z'])
      assert_includes found.map { |f| [f.rule, f.owner] }, %w[profile_admin_read item:olu_budget]
      assert_equal ['adel@bay_pc@2026-01-01T09:00:01.000Z (--resume)'], scanner.unused_entries
    end

    test 'Ops S5a fix: a network row of another account without access does not leave a step to resume' do
      rows, desk_at = downgrade_rows(route_down_host('username' => 'umaquay'))
      scanner = AccessLeakScanner.new(scenario)
      found = scanner.scan(lines(rows), signins: @signins.first(2), resumes: ['adel@bay_pc@2026-01-01T09:00:09.000Z']).select { |f| f.line >= desk_at }
      assert_includes found.map { |f| [f.rule, f.owner] }, %w[profile_admin_read item:olu_budget]
      assert_equal 1, scanner.unused_entries.length
    end

    # ---- Ops S5a fix, R4 pass ----

    def refused_off(time)
      synthetic('GET', 'container/bay_pc', 403, { 'error' => 'refused', 'reason' => 'off' }).merge('t' => time)
    end

    # A credential (token) sign-in of the administrator, its desktop, a gap row, then the same desktop at `late` with a session of
    # `via`; the token's deadline is 10:01:00.
    def token_resume_rows(gap, late, via: 'credential', relay: nil)
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_signin]) }
      token = deep(@marks[:admin_signin])
      token['body'].merge!('via' => 'credential', 'kind' => 'token', 'expiresInS' => 60)
      token['t'] = '2026-01-01T10:00:00.000Z'
      first = at(@marks[:admin_desktop], '2026-01-01T10:00:02.000Z')
      first['body']['session']['via'] = 'credential'
      back = at(@marks[:admin_desktop], late)
      back['body']['session']['via'] = via
      back['body']['session']['relay'] = relay unless relay.nil?
      rows = @log.first(index) + [token, first, gap, back, at(@marks[:admin_folder], late)]
      [rows, index + 4]
    end

    def resume_findings(rows, from, entry)
      scanner = AccessLeakScanner.new(scenario)
      found = scanner.scan(lines(rows), signins: @signins.first(2), resumes: [entry]).select { |f| f.line >= from }.map { |f| [f.rule, f.owner] }.uniq
      [found, scanner.unused_entries]
    end

    test 'R4-1: a resume is refused when the named row is past the token deadline of the session being resumed' do
      late = '2026-01-01T10:01:40.000Z'
      gaps = [refused_off('2026-01-01T10:00:05.000Z'),
              synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'via' => 'credential' } } }).merge('t' => '2026-01-01T10:00:05.000Z')]
      gaps.each do |gap|
        rows, from = token_resume_rows(gap, late)
        found, unused = resume_findings(rows, from, "adel@bay_pc@#{late}")
        assert_includes found, %w[profile_admin_read item:olu_budget], gap['path']
        assert_includes found, %w[ops_string ops:key:access], gap['path']
        assert_equal ["adel@bay_pc@#{late} (--resume)"], unused
        # control: the same rows before the deadline are restored
        rows, from = token_resume_rows(gap, '2026-01-01T10:00:30.000Z')
        found, unused = resume_findings(rows, from, 'adel@bay_pc@2026-01-01T10:00:30.000Z')
        assert_empty found, gap['path']
        assert_empty unused
      end
    end

    test 'R4-2: a session shown as admin with via claim or as a relay is a finding wherever it appears' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      [{ 'via' => 'claim' }, { 'relay' => true }].each do |change|
        row = deep(@marks[:admin_desktop])
        row['body']['session'].merge!(change)
        assert_includes found_after(base + [row], base.length, signins: @signins.first(2)), %w[ops_string ops:key:access], change.to_s
        boot = synthetic('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => { 'npcId' => 'adel', 'via' => 'password', 'access' => 'admin' }.merge(change) } })
        assert_includes found_after(base + [boot], base.length, signins: @signins.first(2)), %w[ops_string ops:key:access], change.to_s
      end
    end

    test 'R4-2: a session that became a claim or relay kind loses the admin step, and a resume of another kind is refused' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      [{ 'via' => 'claim' }, { 'relay' => true }].each do |change|
        row = at(@marks[:admin_desktop], '2026-01-01T09:00:01.000Z')
        row['body']['session'].delete('access')
        row['body']['session'].merge!(change)
        assert_includes found_after(base + [row, deep(@marks[:admin_folder])], base.length + 1, signins: @signins.first(2)), %w[profile_admin_read item:olu_budget], change.to_s
        # the desktop answer still says admin on that kind: judged as the step lost, the folder read follows
        kind_only = at(@marks[:admin_desktop], '2026-01-01T09:00:01.000Z')
        kind_only['body']['session'].merge!(change)
        assert_includes found_after(base + [kind_only, deep(@marks[:admin_folder])], base.length + 1, signins: @signins.first(2)), %w[profile_admin_read item:olu_budget], change.to_s
        # a resume (after the 403) whose row is that kind is refused
        rows, desk_at = power_cut_rows
        back = rows.reverse.find { |r| r['path'].end_with?('container/bay_pc') && r['status'] == 200 }
        back['body']['session'].merge!(change)
        found, unused = resume_findings(rows, desk_at, "adel@bay_pc@#{back['t']}")
        assert_includes found, %w[profile_admin_read item:olu_budget], change.to_s
        assert_equal 1, unused.length, change.to_s
      end
    end

    test 'R4-3: a network host row that shows another account as admin at a PC where it has not earned it is a finding, and the step is taken back' do
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      base = @log.first(index + 1)
      other = route_down_host('username' => 'umaquay', 'access' => 'admin')
      found = found_after(base + [other, deep(@marks[:admin_folder])], base.length, signins: @signins.first(2))
      assert_includes found, %w[ops_string ops:key:access]
      assert_includes found_after(base + [other, deep(@marks[:admin_folder])], base.length + 1, signins: @signins.first(2)), %w[profile_admin_read item:olu_budget]
      # the same after a keyboard sign-in of Uma named at the store PC
      desk = at(@marks[:uma_desktop], '2026-01-01T09:00:02.000Z')
      desk['path'] = desk['path'].sub('bay_pc', 'store_pc')
      assert_includes found_after(base + [uma_again('2026-01-01T09:00:01.000Z'), desk, other], base.length + 2, signins: @signins.first(2) + ['uma@store_pc@2026-01-01T09:00:01.000Z']), %w[ops_string ops:key:access]
      # the same account as admin: clear
      assert_empty found_after(base + [route_down_host('access' => 'admin'), deep(@marks[:admin_folder])], base.length, signins: @signins.first(2))
    end

    test 'R4-4: --resume works on the host row an off PC really sends, listed twice, and on two downgrade answers in a row' do
      time = '2026-01-01T09:00:09.000Z'
      rows, desk_at = downgrade_rows(off_host)
      assert_empty resume_findings(rows, desk_at, "adel@bay_pc@#{time}")[0]
      # another account's name in heldAs is not a power cut: the account is ended, nothing to resume
      stranger = off_host.tap { |r| r['body']['footholds'].each { |f| f['hosts'][0]['heldAs'] = 'Uma Quayle' } }
      rows, desk_at = downgrade_rows(stranger)
      found, unused = resume_findings(rows, desk_at, "adel@bay_pc@#{time}")
      assert_includes found, %w[profile_admin_read item:olu_budget]
      assert_equal 1, unused.length
      # two bootstraps without access in a row
      run_game
      index = @log.index { |r| r.equal?(@marks[:admin_desktop]) }
      second = off_boot.merge('t' => '2026-01-01T09:00:02.000Z')
      rows = @log.first(index + 1) + [off_boot.merge('t' => '2026-01-01T09:00:01.000Z'), second, at(@marks[:admin_desktop], time), deep(@marks[:admin_folder])]
      found, unused = resume_findings(rows, index + 4, "adel@bay_pc@#{time}")
      assert_empty found
      assert_empty unused
    end

    def after_logout_rows(*after)
      rows, from = logout_rows
      [rows.first(from) + after + [rows.last], from]
    end

    def listed_store(session)
      entry = { 'id' => 'store_pc', 'kind' => 'pc', 'name' => 'Records PC', 'host' => 'RECS01', 'sprite' => 'pc_desktop' }
      entry['session'] = session if session
      synthetic('GET', 'network', 200, { 'footholds' => [{ 'id' => 'f', 'hosts' => [entry] }] }).merge('t' => '2026-01-01T09:00:06.000Z')
    end

    test 'R4-5: a named logout whose next listing of that PC still shows the account is an error; a listing without it settles' do
      run_game
      base = { signins: @signins.first(2), logouts: ['uma@store_pc#2'] }
      rows, = after_logout_rows(listed_store(nil))
      assert_nothing_raised { scan(rows, **base) }
      rows, = after_logout_rows(listed_store('username' => 'umaquay', 'via' => 'technique'))
      error = assert_raises(ArgumentError) { scan(rows, **base) }
      assert_match(/logout entry uma@store_pc.*still shows uma/, error.message)
      held = synthetic('GET', 'scenario', 200, { 'sessions' => { 'store_pc' => { 'npcId' => 'uma', 'via' => 'password' } } }).merge('t' => '2026-01-01T09:00:06.000Z')
      rows, = after_logout_rows(held)
      assert_raises(ArgumentError) { scan(rows, **base) }
      # a listing of another PC does not settle or refute it
      rows, = after_logout_rows(listed_store(nil).tap { |r| r['body']['footholds'][0]['hosts'][0]['id'] = 'bay_pc' })
      assert_nothing_raised { scan(rows, **base) }
    end

    test 'R4-5: on the real run the logout named at the bay PC is refuted by the network answer that follows' do
      error = assert_raises(ArgumentError) { AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS, logouts: ['adel@bay_pc#5']) }
      assert_match(/logout entry adel@bay_pc.*still shows adel/, error.message)
    end

    test 'R4-6: a technique grant at a PC drops the resumable record and the deadline of the session it replaces' do
      scanner = AccessLeakScanner.new(scenario)
      scanner.scan([], signins: [])
      scanner.instance_variable_set(:@priv_resumable, { 'bay_pc' => { account: 'adel', step: true, deadline: nil, kind: ['password', false] } })
      scanner.instance_variable_set(:@priv_deadlines, { 'bay_pc' => Time.utc(2026, 1, 1) })
      scanner.send(:note_ops_session_grant, { host_id: 'bay_pc' }, { 'npcId' => 'uma', 'via' => 'technique', 'footholdId' => 'f' })
      assert_empty scanner.instance_variable_get(:@priv_resumable)
      assert_empty scanner.instance_variable_get(:@priv_deadlines)
    end

    # ---- Ops S5a fix, R5 pass: the review's runs (S5a_R5.md checks 1 to 7), on rows 1 to 98 of the real capture ("P98": adel's
    # keyboard sign-in #5 at row 97, the admin desktop of bay_pc at row 98) with rows injected after it ----

    R5_SIGNINS = RUN72_SIGNINS

    def r5_clock(second)
      format('2026-11-24T00:39:%06.3fZ', second)
    end

    def r5_base
      run72.first(98).map(&:last)
    end

    def r5_row(method, path, status, body, second)
      { 't' => r5_clock(second), 'method' => method, 'path' => "/break_escape/games/72/#{path}", 'status' => status, 'body' => body }
    end

    # Row 98 again (the admin desktop) or row 27 again (the owner's folder), later.
    def r5_desk(second, &change)
      row = deep(run72[97].last).merge('t' => r5_clock(second))
      change&.call(row['body']['session'])
      row
    end

    def r5_folder(second)
      deep(run72[26].last).merge('t' => r5_clock(second))
    end

    # Row 137 again (GET /network, bay_pc listed twice) with each bay_pc host row changed by the block.
    def r5_net(second)
      row = deep(run72[136].last).merge('t' => r5_clock(second))
      count = 0
      walk = lambda do |node|
        case node
        when Hash
          if node['id'] == 'bay_pc' && node['kind'] == 'pc'
            count += 1
            yield node
          end
          node.each_value { |v| walk.call(v) }
        when Array then node.each { |v| walk.call(v) }
        end
      end
      walk.call(row['body'])
      assert_operator count, :>=, 2
      row
    end

    def r5_net_as(second, session)
      r5_net(second) { |host| host['session'] = deep(session) }
    end

    def r5_net_off(second)
      r5_net(second) do |host|
        host.delete('session')
        host['responding'] = false
        host['heldAs'] = 'Adel Wick'
      end
    end

    def r5_boot(second, session)
      r5_row('GET', 'scenario', 200, { 'sessions' => { 'bay_pc' => session } }, second)
    end

    def r5_off(second)
      r5_row('GET', 'container/bay_pc', 403, { 'error' => 'refused', 'reason' => 'off' }, second)
    end

    ADEL_SESSION = { 'username' => 'adelwick', 'displayName' => 'Adel Wick', 'via' => 'password', 'remote' => false }.freeze

    # P98, the gap rows, the desk (second 50) named by a resume, the folder (second 51): the findings on the last two rows and
    # the unused entries.
    def r5_resume(*gap, resume: true)
      rows = r5_base + gap + [r5_desk(50), r5_folder(51)]
      scanner = AccessLeakScanner.new(scenario)
      found = scanner.scan(lines(rows), signins: R5_SIGNINS, resumes: resume ? ["adel@bay_pc@#{r5_clock(50)}"] : [])
      [found.select { |f| f.line > rows.length - 2 }.map { |f| [f.rule, f.owner] }.uniq.sort, scanner.unused_entries]
    end

    def assert_resume_refused(gap, label = nil)
      found, unused = r5_resume(*gap)
      assert_includes found, %w[profile_admin_read item:olu_budget], label
      assert_equal 1, unused.length, label
    end

    def assert_resume_taken(gap, label = nil)
      found, unused = r5_resume(*gap)
      assert_empty found, label
      assert_empty unused, label
    end

    test 'R5-1: after a 403 off, a host row or bootstrap that shows ANOTHER account at the PC drops the resume record; a plain 403 alone resumes' do
      assert_resume_taken([r5_off(10)], '403 alone')
      assert_resume_refused([r5_off(10), r5_net_as(11, ADEL_SESSION.merge('username' => 'umaquay'))], 'net of uma')
      assert_resume_refused([r5_off(10), r5_boot(11, { 'npcId' => 'uma', 'via' => 'password' })], 'boot of uma')
      assert_resume_refused([r5_off(10), r5_net_as(11, ADEL_SESSION.merge('username' => 'zzz'))], 'net of an unknown username')
      # not the off shape: a net row with no session, a bootstrap with the PC absent
      assert_resume_refused([r5_off(10), r5_net(11) { |host| host.delete('session') }], 'net with no session')
      assert_resume_refused([r5_off(10), r5_boot(11, nil)], 'boot with the PC absent')
    end

    test 'R5-1: repeated off answers of the same held account keep the record; every end between two of them drops it' do
      assert_resume_taken([r5_off(10), r5_off(11)], 'two 403s')
      assert_resume_taken([r5_net_off(10), r5_net_off(11), r5_net_off(12)], 'three off host rows')
      assert_resume_taken([r5_boot(10, { 'npcId' => 'adel', 'via' => 'password' }), r5_boot(11, { 'npcId' => 'adel', 'via' => 'password' })], 'two bootstraps')
      lock = r5_row('POST', 'lock_session', 200, { 'success' => true, 'pcId' => 'bay_pc', 'locked' => true }, 12)
      logout = r5_row('POST', 'logout', 200, { 'success' => true, 'endedPcIds' => [] }, 12)
      ended = r5_row('POST', 'something', 200, { 'success' => true, 'endedPcIds' => ['bay_pc'] }, 12)
      uma_login = deep(run72[15].last).merge('t' => r5_clock(12))
      desk_off = r5_desk(12) { |session| session.delete('access') }
      ends = {
        'net of uma' => r5_net_as(12, ADEL_SESSION.merge('username' => 'umaquay')),
        'net locked' => r5_net_as(12, ADEL_SESSION.merge('locked' => true)),
        'boot with the PC absent' => r5_boot(12, nil),
        'boot of uma' => r5_boot(12, { 'npcId' => 'uma', 'via' => 'password' }),
        'a desktop without access' => desk_off,
        'lock_session' => lock, 'unnamed logout' => logout, 'endedPcIds' => ended, 'unnamed sign-in of uma' => uma_login
      }
      ends.each { |label, end_row| assert_resume_refused([r5_net_off(10), end_row, r5_net_off(13)], label) }
    end

    test 'R5-3: a host row of another account ends the session and never assigns the held account: its own files are not credited' do
      folder_findings = lambda do |gap|
        rows = r5_base + gap + [r5_folder(60)]
        scanner = AccessLeakScanner.new(scenario)
        found = scanner.scan(lines(rows), signins: R5_SIGNINS)
        [found.select { |f| f.line == rows.length }.map { |f| [f.rule, f.owner] }.uniq.sort, found.select { |f| f.line == rows.length - 1 }.map { |f| [f.rule, f.owner] }]
      end
      owner_row = ADEL_SESSION.merge('username' => 'omarsh', 'displayName' => 'Olu Marsh')
      assert_includes folder_findings.call([r5_net_as(55, owner_row)]).first, %w[profile_admin_read item:olu_budget]
      assert_includes folder_findings.call([r5_net_as(55, owner_row.merge('username' => 'zzz'))]).first, %w[profile_admin_read item:olu_budget]
      assert_includes folder_findings.call([r5_net(55) { |host| host.delete('session') }]).first, %w[profile_admin_read item:olu_budget]
      on_folder, on_net = folder_findings.call([r5_net_as(55, owner_row.merge('access' => 'admin'))])
      assert_includes on_net, %w[ops_string ops:key:access]
      assert_includes on_folder, %w[profile_admin_read item:olu_budget]
    end

    test 'R5-3: a desktop answer or a bootstrap that shows another account ends the session and does not assign it either' do
      folder = lambda do |row|
        rows = r5_base + [row, r5_folder(60)]
        AccessLeakScanner.new(scenario).scan(lines(rows), signins: R5_SIGNINS).select { |f| f.line == rows.length }.map { |f| [f.rule, f.owner] }.uniq.sort
      end
      assert_includes folder.call(r5_desk(55) { |session| session['npcId'] = 'olu' }), %w[profile_admin_read item:olu_budget]
      assert_includes folder.call(r5_boot(55, { 'npcId' => 'olu', 'via' => 'password' })), %w[profile_admin_read item:olu_budget]
    end

    test 'R5-2: a session shown as claim or relay without admin drops the resume record' do
      adel = { 'npcId' => 'adel' }
      assert_resume_refused([r5_boot(10, adel.merge('via' => 'claim'))], 'boot claim')
      assert_resume_refused([r5_boot(10, adel.merge('via' => 'credential', 'relay' => true))], 'boot relay')
      assert_resume_refused([r5_off(9), r5_boot(10, adel.merge('via' => 'claim'))], 'boot claim after a 403')
      assert_resume_refused([r5_net_as(10, ADEL_SESSION.merge('via' => 'claim'))], 'host row claim')
      found, unused = r5_resume(r5_desk(10) { |session| session.delete('access'); session['via'] = 'claim' })
      assert_includes found, %w[profile_admin_read item:olu_budget]
      assert_equal 1, unused.length
      # controls: the same account and kind without access is the ordinary power-cut shape
      assert_resume_taken([r5_boot(10, adel.merge('via' => 'password'))], 'boot password')
    end

    test 'R5 check 6: the real captures still give 0 findings with the five named entries, 38 with sign-ins only, 112 with nothing named' do
      scanner = AccessLeakScanner.new(scenario)
      assert_empty scanner.scan(run72, signins: RUN72_SIGNINS, logouts: [RUN72_LOGOUT])
      assert_empty scanner.unused_entries
      assert_equal 38, AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS).length
      assert_equal 112, AccessLeakScanner.new(scenario).scan(run72).length
      error = assert_raises(ArgumentError) { AccessLeakScanner.new(scenario).scan(run72, signins: RUN72_SIGNINS, logouts: ['adel@bay_pc#5']) }
      assert_match(/still shows adel/, error.message)
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

  # Ops S5bc unit 23 (S5b, ruling A, ruling B): the scanner over the REAL answers of the whole played run of
  # scenarios/test_ops_privilege (the ten beats of OpsPrivilegeBeats: collects, hash rows, the borrow, the crack, the stick
  # override, the relay sign-ins), recorded as the browser's log holds them (no request body, no tag), with the game given to
  # the scanner. The run must report nothing; each tamper test then makes ONE edit to that real run and the edit must be
  # reported. Every request the beats make is recorded by `get` and `post` of this test class only.
  class AccessLeakScannerHarvestRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include OpsPrivilegeBeats

    teardown { travel_back }

    %i[get post].each do |verb|
      define_method(verb) do |path, **options|
        result = super(path, **options)
        record_row(verb, options) if @recording
        result
      end
    end

    # One row in the browser log's shape. The keyboard sign-ins are named to the scanner (`--signin`), as a tester does.
    def record_row(method, options)
      body = begin
        JSON.parse(response.body)
      rescue JSON::ParserError
        response.body
      end
      row = { 't' => (BEATS_START + @rows.length).utc.iso8601(3), 'method' => method.to_s.upcase, 'path' => request.path,
              'status' => response.status, 'body' => body }
      @rows << row
      return unless row['path'].end_with?('/login') && row['status'] == 200 && body.is_a?(Hash) && body['success'] && body['npcId']

      params = options[:params] || {}
      @keyboard_pc[row] = params[:pc_id] if params[:username].present? && params[:credential].blank? && params[:claim].blank?
    end

    # The `--signin` entries a tester would name for these rows: the account's n-th successful sign-in answer, at the PC its
    # keyboard row was made at (a relay or a claim sign-in names no keyboard PC and is not named).
    def signins_for(rows)
      counts = Hash.new(0)
      rows.filter_map do |row|
        body = row['body']
        next unless row['path'].end_with?('/login') && row['status'] == 200 && body.is_a?(Hash) && body['success'] && body['npcId']

        counts[body['npcId']] += 1
        pc = @keyboard_pc[row]
        "#{body['npcId']}@#{pc}##{counts[body['npcId']]}" if pc
      end
    end

    # The whole run, once; each test gets its own deep copy.
    def run_real
      @rows = []
      @keyboard_pc = {}.compare_by_identity
      @recording = true
      play_all_beats
      @recording = false
      @game_after = b_game
      @rows
    end

    def lines(rows)
      rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
    end

    def deep(value)
      Marshal.load(Marshal.dump(value))
    end

    # Rows are the real run's rows, edited; the sign-in entries are recomputed from the rows as a tester would.
    def scan(rows, game: @game_after, data: beats_scenario, **options)
      @scanner = AccessLeakScanner.new(data, game: game)
      @scanner.scan(lines(rows), signins: signins_for(rows), **options)
    end

    def named(findings)
      findings.map { |f| [f.line, f.rule, f.owner] }
    end

    def at_path(rows, tail, nth = 0)
      rows.select { |r| r['path'].end_with?(tail) }[nth] or raise "no row #{tail}"
    end

    def collect_rows(rows)
      rows.select { |r| r['path'].end_with?('/harvest_credentials') && r['status'] == 200 }
    end

    test 'the whole real run reports nothing, and holds the answers the tamper tests edit' do
      rows = run_real
      assert_equal 52, rows.length
      assert_equal [], named(scan(rows))
      assert_empty @scanner.unused_entries
      assert_equal 5, collect_rows(rows).length
      assert_equal 4, rows.count { |r| r['path'].end_with?('/keyring') && r['status'] == 200 && r['body']['entries'].any? { |e| e['source'] == 'registry' } }
      assert_equal 'admin', rows[46]['body']['access'], 'the relay sign-in of the administrator'
    end

    # ---- one edit each, on the real run. Row numbers are the run's own (1-based): 1 Uma signs in at bay_pc, 3 a refused collect,
    # 5 Adel signs in at bay_pc, 6 and 7 the collects there, 14 the first keyring with hash rows, 21 the hot desk collect before the
    # borrow, 29 the borrow done answer, 30 the claim, 34 the collect after the borrow, 41 and 42 the stick override, 43 the audit
    # rows, 47 the relay sign-in of Adel at hot_desk, 49 its collect, 51 Uma's relay at store_pc, 52 her refused collect.

    # The run with row `n` replaced by an edited copy.
    def edit(rows, n)
      copy = deep(rows[n - 1])
      @keyboard_pc[copy] = @keyboard_pc[rows[n - 1]]
      yield copy
      rows.dup.tap { |all| all[n - 1] = copy }
    end

    def without(rows, n)
      rows.reject.with_index { |_, i| i == n - 1 }
    end

    def moved_before(rows, n, target)
      rows.dup.tap { |all| all.insert(target - 1, all.delete_at(n - 1)) }
    end

    def reported(rows, **options)
      named(scan(rows, **options)).map { |_, rule, owner| [rule, owner] }.uniq
    end

    def assert_flagged(findings, rule, owner = nil)
      assert(findings.any? { |r, o| r == rule && (owner.nil? || o == owner) }, "expected #{rule} #{owner}, got #{findings.inspect}")
    end

    test 'tamper 1: the administrator sign-in before the first collect is taken out: the collect is unearned' do
      rows = run_real
      assert_flagged reported(without(rows, 5)), 'harvest_unearned'
    end

    test 'tamper 2: the first collect moved before the administrator sign-in is unearned' do
      rows = run_real
      assert_flagged reported(moved_before(rows, 6, 5)), 'harvest_unearned'
    end

    test 'tamper 3: the keyring that lists the harvested hash rows, moved before the collect, is reported' do
      rows = run_real
      found = reported(moved_before(rows, 14, 6))
      assert_flagged found, 'harvest_hash', 'credential:baypc_olu'
    end

    test 'tamper 4: a relay sign-in of an ordinary account that says admin is reported' do
      rows = run_real
      found = reported(edit(rows, 51) { |r| r['body']['access'] = 'admin' })
      assert_flagged found, 'ops_string', 'ops:key:access'
    end

    test 'tamper 5: the relay sign-in of the administrator taken out: the desktop that shows the relay administrator reads the profile unearned' do
      rows = run_real
      # limit: the relay administrator step is also proved by that PC's desktop answer (invite, creds.admin and the game's own
      # account_admin_at?), so the collect after it is still credited; the folder read in the desktop is what is reported
      assert_flagged reported(without(rows, 47)), 'profile_admin_read', 'item:adel_runbook'
    end

    test 'tamper 6: the relay administrator collect moved before the relay sign-in and its desktop is unearned' do
      rows = run_real
      assert_flagged reported(moved_before(rows, 49, 47)), 'harvest_unearned'
    end

    test 'tamper 7: a collect answer naming another PC than the admin earned is unearned' do
      rows = run_real
      found = reported(edit(rows, 21) { |r| r['body']['pcId'] = 'store_pc' })
      assert_flagged found, 'harvest_unearned'
    end

    test 'tamper 8: the borrow done answer taken out leaves the borrower row of the later collect unearned' do
      rows = run_real
      assert_flagged reported(without(rows, 29)), 'harvest_unearned', 'account:sam'
    end

    test 'tamper 9: the game that never recorded the borrow (cachedAt empty) flags the borrower row, though the done answer is in the capture' do
      rows = run_real
      game = b_game
      game.player_state = game.player_state.merge('cachedAt' => [])
      assert_flagged reported(rows, game: game), 'harvest_unearned', 'account:sam'
      assert_flagged reported(rows, game: nil), 'harvest_unearned', 'account:sam'
    end

    test 'tamper 10: a password key added to a collect row is reported' do
      rows = run_real
      found = reported(edit(rows, 6) { |r| r['body']['harvested'][0]['password'] = 'x' })
      assert_flagged found, 'harvest_row'
    end

    test 'tamper 11: a collect row with another account hash id is reported' do
      rows = run_real
      found = reported(edit(rows, 6) { |r| r['body']['harvested'][0]['hashId'] = 'baypc_uma' })
      assert_flagged found, 'harvest_unearned'
    end

    test 'tamper 12: a claim sign-in that says admin is reported' do
      rows = run_real
      found = reported(edit(rows, 30) { |r| r['body']['access'] = 'admin' })
      assert_flagged found, 'ops_string', 'ops:key:access'
    end

    test 'tamper 13: a collect refusal that gives rows is reported' do
      rows = run_real
      found = reported(edit(rows, 3) { |r| r['body']['harvested'] = deep(rows[5]['body']['harvested']) })
      assert_flagged found, 'harvest_row', 'refusal'
    end

    test 'tamper 14: the keyring with the Sam hash row moved before the borrowed collect is reported' do
      rows = run_real
      index = rows.index { |r| r['path'].end_with?('/keyring') && r['body']['entries'].any? { |e| e['id'] == 'hotdesk_sam' } }
      found = reported(moved_before(rows, index + 1, 33))
      assert_flagged found, 'harvest_hash', 'credential:hotdesk_sam'
    end

    test 'tamper 15: the collect cachedAccounts list in a sync body is reported (a never-key)' do
      rows = run_real
      found = reported(edit(rows, 2) { |r| r['body']['cachedAccounts'] = [{ 'npc' => 'olu' }] })
      assert_flagged found, 'harvest_key', 'key:cachedAccounts'
    end

    test 'tamper 16 (the stick audit, ruling A): a USB_OVERRIDE audit row naming a PC where no admin session was ever shown is reported; the real row is clear' do
      rows = run_real
      assert_empty reported(rows)
      found = reported(edit(rows, 43) { |r| r['body']['rows'].find { |x| x['event'] == 'USB_OVERRIDE' }['where'] = 'Records PC' })
      assert_flagged found, 'log_row', 'log:usb_override:store_pc'
    end

    test 'tamper 17: a CRED_COLLECT audit row naming a PC where no admin session was ever shown is reported' do
      rows = run_real
      found = reported(edit(rows, 43) { |r| r['body']['rows'].find { |x| x['event'] == 'CRED_COLLECT' }['where'] = 'Records PC' })
      assert_flagged found, 'log_row', 'log:cred_collect:store_pc'
    end

    test 'tamper 18: a CRED_COLLECT row naming a place that is no PC is reported (fail closed)' do
      rows = run_real
      found = reported(edit(rows, 43) { |r| r['body']['rows'].find { |x| x['event'] == 'CRED_COLLECT' }['where'] = 'Nowhere' })
      assert_flagged found, 'log_row', 'log:cred_collect:unknown'
    end

    test 'tamper 19: the relay administrator audit row read, with no folder read earned at hot_desk, is reported' do
      rows = run_real
      found = reported(edit(rows, 43) { |r| r['body']['rows'] << { 'event' => 'ADMIN_READ', 'as' => 'adelwick', 'where' => 'Hot desk PC', 'result' => 'OK', 'detail' => 'profile', 'elapsedMs' => 0, 'id' => 'aaaa' } })
      assert_flagged found, 'log_row', 'log:admin_read:hot_desk'
    end

    test 'tamper 16: an administrator audit reading row that no admin read earned is reported' do
      rows = run_real
      found = reported(edit(rows, 43) { |r| r['body']['rows'] << { 'event' => 'ADMIN_READ', 'detail' => 'profile: olu' } })
      assert_flagged found, 'log_row'
    end

    # ---- re-checks the scanner fixer listed ----

    def with_account_only(data)
      data = deep(data)
      npc = { 'id' => 'deskadmin', 'displayName' => 'Rota Keeper', 'npcType' => 'person', 'accountOnly' => true,
              'creds' => { 'username' => 'rotakeeper', 'password' => 'Unused-Account-91', 'accountKind' => 'local', 'localTo' => ['bay_pc'] } }
      room = data['rooms'].values.find { |r| r['npcs'].is_a?(Array) }
      room['npcs'] << npc
      data
    end

    test 'recheck: the account-only words of an account in this scenario do not clash, the whole real run stays clean, and a typed sign-in answer naming it is reported' do
      rows = run_real
      data = with_account_only(beats_scenario)
      assert_empty named(scan(rows, data: data)), 'the scanner builds, and the honest run is clear'
      found = reported(edit(rows, 18) { |r| r['body']['username'] = 'rotakeeper' }, data: data)
      assert_flagged found, 'account_only'
      found = reported(edit(rows, 18) { |r| r['body']['displayName'] = 'Rota Keeper' }, data: data)
      assert_flagged found, 'account_only'
    end

    test 'recheck: an account-only word that is an ordinary answer word refuses the scan' do
      rows = run_real
      data = with_account_only(beats_scenario)
      data['rooms'].each_value { |r| Array(r['npcs']).each { |n| n['creds']['username'] = 'admin' if n['id'] == 'deskadmin' } }
      assert_raises(ArgumentError) { scan(rows, data: data) }
    end

    test 'recheck: a relay administrator reading a profile folder of an account it does not reach is reported (the S5a rules hold for a relay)' do
      rows = run_real
      folder = { 't' => rows.last['t'], 'method' => 'GET', 'path' => '/break_escape/games/190019/container/olu_folder', 'status' => 200,
                 'body' => { 'container_id' => 'olu_folder', 'contents' => [{ 'id' => 'olu_budget', 'name' => 'Budget draft.txt', 'type' => 'text_file', 'text' => 'Budget draft: the van, the toner and one new chair.' }] } }
      after_relay = rows.first(49) + [folder]
      assert_flagged reported(after_relay), 'profile_admin_read', 'item:olu_budget'
    end

    test 'recheck: a --signin entry naming a PC the account has no such sign-in at, or a relay sign-in, is refused or unused' do
      rows = run_real
      assert_raises(ArgumentError) { AccessLeakScanner.new(beats_scenario, game: @game_after).scan(lines(rows), signins: signins_for(rows) + ['adel@nowhere#1']) }
      scanner = AccessLeakScanner.new(beats_scenario, game: @game_after)
      scanner.scan(lines(rows), signins: signins_for(rows) + ['adel@hot_desk#6'])
      assert_equal ['adel@hot_desk#6 (--signin)'], scanner.unused_entries, 'the relay sign-in is the sixth: a keyboard entry for it matches no keyboard row'
    end
  end
end
