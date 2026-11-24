# Helpers of the S8c scanner tests that edit copies of the rows of a real run (R1 scanner fixes). Nothing here touches an application class.
module LockStepRealRows
  def rows_of(entries)
    entries.map do |e|
      path = "/break_escape/games/#{e['game']}/#{e['path']}"
      row = { 't' => e['t'], 'method' => e['verb'], 'path' => path, 'status' => e['status'], 'body' => e['body'] }
      row['query'] = e['params'].to_query if e['verb'] == 'GET' && !e['params'].empty?
      if e['verb'] == 'POST' && e['path'] == 'inventory'
        row['inv'] = { 'action' => e['params']['action_type'], 'itemId' => e['params'].dig('item', 'id') || e['params']['item_id'], 'usedOn' => nil }
      end
      row
    end
  end

  def deep(value)
    Marshal.load(Marshal.dump(value))
  end

  def path_of(row)
    row['path'][%r{/games/\d+/(.*)\z}, 1]
  end

  def idx(rows, method, route, &cond)
    rows.index { |r| r['method'] == method && path_of(r) == route && (cond.nil? || cond.call(r)) } or raise "no row #{method} #{route}"
  end

  def scan_with(rows, data)
    AccessLeakScanner.new(data).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
  end

  def pairs(findings)
    findings.map { |f| [f.rule, f.owner] }.uniq
  end

  def like(base, body, status = base['status'])
    deep(base).merge('body' => body, 'status' => status)
  end
end
