# Shared by the S8c scanner tests that build a capture by hand from the shared answer shapes (R1-SCANNER11): every server answer is
# read from test/fixtures/files/lock_step/answers.json through `answer(name)`; nothing here writes a server answer as a literal. A
# lock-form answer of POST mfa/verify, prompt and approve, and an open of a lock, carries the echo (`targetType`, `targetId`) of the
# last gate answer, or of `echo:`. Nothing here touches an application class.
module LockStepScannerRows
  ANSWERS = JSON.parse(File.read(File.expand_path('../fixtures/files/lock_step/answers.json', __dir__))).freeze
  BASE = '/break_escape/games/1'.freeze
  ROUTE_PATHS = { 'POST /unlock' => 'unlock', 'POST /mfa/verify' => 'mfa/verify', 'POST /mfa/prompt' => 'mfa/prompt',
                  'POST /mfa/approve' => 'mfa/approve', 'GET /mfa/phone' => 'mfa/phone', 'GET /mfa/device' => 'mfa/device' }.freeze
  LOCK_ROUTES = %w[mfa/verify mfa/prompt mfa/approve].freeze
  MFA_SCENARIO = File.expand_path('../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)

  def deep(value)
    Marshal.load(Marshal.dump(value))
  end

  def note(id)
    { 'id' => id, 'type' => 'notes', 'name' => id }
  end

  def lock_obj(id, kind, owner, contents, name: nil)
    { 'id' => id, 'name' => name || id.tr('_', ' '), 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => kind, 'owner' => owner }, 'contents' => contents }
  end

  def start
    @clock = Time.utc(2026, 1, 1)
    @rows = []
    @echo = nil
  end

  def tick(seconds = 1)
    @clock += seconds
    @clock.iso8601(3)
  end

  def answer(name, query: nil, seconds: 1, status: nil, echo: true, base: BASE)
    fx = ANSWERS.fetch(name)
    route = { 'any /mfa/*' => 'GET /mfa/phone', 'POST /mfa/verify | /mfa/prompt | /mfa/approve' => 'POST /mfa/verify' }.fetch(fx['route'], fx['route'])
    path = ROUTE_PATHS.fetch(route)
    row = { 't' => tick(seconds), 'method' => route.split.first, 'path' => "#{base}/#{path}", 'status' => status || fx['status'], 'body' => deep(fx['body']) }
    row['query'] = query if query
    yield row['body'] if block_given?
    body = row['body']
    if body['secondStep'] == true
      @echo = [body['targetType'], body['targetId']]
    elsif LOCK_ROUTES.include?(path) || name.start_with?('open_')
      if body.key?('error') || body.keys.sort == %w[message success]
        # the answers that name no lock
      elsif echo
        type, id = echo.is_a?(Array) ? echo : (@echo || %w[object moira_locker])
        body['targetType'] = type
        body['targetId'] = id
      else
        body.delete('targetType')
        body.delete('targetId')
      end
    end
    @rows << row
    row
  end

  def take(item_id)
    @rows << { 't' => tick, 'method' => 'POST', 'path' => "#{BASE}/inventory", 'status' => 200, 'body' => { 'success' => true },
               'inv' => { 'action' => 'add', 'itemId' => item_id, 'usedOn' => nil } }
  end

  def raw(method, path, body, status: 200, query: nil, seconds: 1, base: BASE)
    row = { 't' => tick(seconds), 'method' => method, 'path' => "#{base}/#{path}", 'status' => status }
    row['body'] = body unless body == :none
    row['query'] = query if query
    @rows << row
    row
  end

  def phone_query(npc, type, id)
    URI.encode_www_form(npc_id: npc, target_type: type, target_id: id)
  end

  def open_object(*ids)
    answer('open_object') { |b| b['contents'] = ids.map { |i| { 'id' => i, 'type' => 'notes', 'name' => i } } unless ids.empty? }
  end

  def scan_rows(rows, data)
    AccessLeakScanner.new(data).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
  end

  def lock_findings(findings)
    findings.select { |f| f.rule.start_with?('lock_step_') }.map { |f| [f.rule, f.owner] }.uniq.sort
  end

  def mfa_data
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(MFA_SCENARIO)))
  end

  # [pc id, npc id, kind] of every PC step of the scenario
  def pc_steps(data)
    s = AccessLeakScanner.new(data)
    pcs = s.instance_variable_get(:@priv_pcs).keys
    npcs = s.instance_variable_get(:@priv_npcs).keys
    pcs.product(npcs).map { |pc, n| [pc, n, s.send(:mfa_kind_at, pc, n)] }.reject { |x| x.last == 'none' }
  end

  def pc_required(step)
    raw('POST', 'login', { 'success' => false, 'mfaRequired' => true, 'mfa' => step[2], 'pcId' => step[0], 'npcId' => step[1] })
  end
end
