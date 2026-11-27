# Load test for GamesController#sync_state, and the Postgres cost of saving.
#
# Runs inside the app (bin/rails runner) so it can create the games and read
# Postgres statistics directly, and sends the requests over HTTP to a running
# server, as browsers would.
#
#   bin/rails runner scripts/load_test/sync_state_load.rb -- [options]
#
#   --base URL        server to test (default http://127.0.0.1:3001)
#   --players N       simulated players (default 200)
#   --duration SECS   how long to run the sync phase (default 120)
#   --interval SECS   sync interval per player (default 30, as state-sync.js)
#   --client MODE     legacy: every tick sends the whole payload (the client
#                     before plan B); delta: only what changed (plan B)
#                     (default delta)
#   --mission NAME    mission the games are made from (default m01_first_contact)
#   --burst           also run the class-start burst: N games created through
#                     POST /games within a few seconds, each then fetching
#                     scenario and one NPC's ink
#   --no-sync         skip the sync phase (burst only)
#
# Games are owned by the first DemoUser, which is who a standalone server
# treats as the current player. Their ids are kept in
# tmp/load_test_game_ids.json and reused on the next run; each run first
# resets them to the same seeded state, so runs are comparable.
#
# What a tick does, per player (rates chosen to match a class mid-mission):
#   80% nothing changed      legacy: full payload   delta: no request
#   15% one global changed   legacy: full payload   delta: that key (+ clock)
#    5% a phone thread or a note changed
#                            legacy: full payload   delta: that entry (+ clock)
#   delta also sends the clock alone every 5 minutes, and a full snapshot on
#   a simulated page reload (1% of ticks).
#
# Reports request latency (p50/p95/p99), errors, and from before to after the
# run: WAL bytes, n_tup_upd / n_tup_hot_upd / n_dead_tup for
# break_escape_games, and table, TOAST and index size.

require 'net/http'
require 'json'
require 'optparse'
require 'securerandom'

module SyncStateLoad
  GAME_IDS_FILE = Rails.root.join('tmp', 'load_test_game_ids.json')
  CLOCK_ONLY_MS = 5 * 60 * 1000

  Options = Struct.new(:base, :players, :duration, :interval, :client, :mission, :burst, :sync, keyword_init: true)

  def self.parse(argv)
    opts = Options.new(base: 'http://127.0.0.1:3001', players: 200, duration: 120, interval: 30,
                       client: 'delta', mission: 'm01_first_contact', burst: false, sync: true)
    OptionParser.new do |o|
      o.on('--base URL') { |v| opts.base = v }
      o.on('--players N', Integer) { |v| opts.players = v }
      o.on('--duration SECS', Integer) { |v| opts.duration = v }
      o.on('--interval SECS', Integer) { |v| opts.interval = v }
      o.on('--client MODE', %w[legacy delta]) { |v| opts.client = v }
      o.on('--mission NAME') { |v| opts.mission = v }
      o.on('--burst') { opts.burst = true }
      o.on('--no-sync') { opts.sync = false }
    end.parse!(argv.reject { |a| a == '--' })
    opts
  end

  # ---------------------------------------------------------------- HTTP

  # One browser session: the session cookie and its CSRF token, taken from the
  # missions page. Masked tokens from one session stay valid for its lifetime.
  class Session
    attr_reader :uri

    def initialize(base)
      @uri = URI(base)
      res = request(Net::HTTP::Get.new('/break_escape/missions', 'Accept' => 'text/html'))
      raise "GET /break_escape/missions returned #{res.code}" unless res.code == '200'

      @cookie = Array(res.get_fields('set-cookie')).map { |c| c.split(';').first }.join('; ')
      @csrf = res.body[/<meta name="csrf-token" content="([^"]+)"/, 1] or raise 'no csrf-token meta on the missions page'
    end

    def request(req, body = nil)
      req['Cookie'] = @cookie if @cookie
      req['X-CSRF-Token'] = @csrf if @csrf
      req['Accept'] ||= 'application/json'
      if body
        req['Content-Type'] = body.is_a?(String) && body.include?('=') && !body.start_with?('{') ? 'application/x-www-form-urlencoded' : 'application/json'
        req.body = body
      end
      Net::HTTP.start(@uri.host, @uri.port, open_timeout: 10, read_timeout: 60) { |http| http.request(req) }
    end

    def timed(req, body = nil)
      t = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      res = begin
        request(req, body)
      rescue StandardError => e
        e
      end
      [res, (Process.clock_gettime(Process::CLOCK_MONOTONIC) - t) * 1000.0]
    end
  end

  class Recorder
    def initialize
      @mutex = Mutex.new
      @latencies = Hash.new { |h, k| h[k] = [] }
      @errors = Hash.new(0)
      @bytes = Hash.new(0)
    end

    def record(kind, res, ms, sent = 0)
      @mutex.synchronize do
        @latencies[kind] << ms
        @bytes[kind] += sent
        @errors[kind] += 1 unless res.is_a?(Net::HTTPResponse) && res.code.to_i < 400
        @errors["#{kind} #{res.is_a?(Net::HTTPResponse) ? res.code : res.class}"] += 1 unless res.is_a?(Net::HTTPResponse) && res.code.to_i < 400
      end
    end

    def report
      @latencies.each do |kind, list|
        s = list.sort
        pct = ->(p) { s.empty? ? 0 : s[[(s.size * p).ceil - 1, 0].max] }
        puts format('  %-10s requests %6d  errors %4d  p50 %7.1f ms  p95 %7.1f ms  p99 %7.1f ms  max %7.1f ms  sent %8.1f KB',
                    kind, s.size, @errors[kind], pct.(0.50), pct.(0.95), pct.(0.99), s.last || 0, @bytes[kind] / 1024.0)
      end
      @errors.each { |k, v| puts "  error detail: #{k}: #{v}" if k.include?(' ') }
    end
  end

  # ---------------------------------------------------------------- Postgres

  def self.pg_stats
    conn = ActiveRecord::Base.connection
    conn.execute('SELECT pg_stat_clear_snapshot()')
    row = conn.select_one(<<~SQL)
      SELECT pg_current_wal_insert_lsn()::text AS lsn,
             s.n_tup_upd, s.n_tup_hot_upd, s.n_dead_tup,
             pg_relation_size('break_escape_games') AS heap,
             COALESCE(pg_relation_size(c.reltoastrelid), 0) AS toast,
             pg_indexes_size('break_escape_games') AS indexes
      FROM pg_stat_user_tables s JOIN pg_class c ON c.oid = s.relid
      WHERE s.relname = 'break_escape_games'
    SQL
    row
  end

  def self.report_pg(before, after)
    conn = ActiveRecord::Base.connection
    wal = conn.select_value("SELECT pg_wal_lsn_diff('#{after['lsn']}', '#{before['lsn']}')").to_i
    puts "  WAL written            #{format('%.1f', wal / 1024.0 / 1024.0)} MB (#{wal} bytes; includes anything else writing to this cluster)"
    %w[n_tup_upd n_tup_hot_upd n_dead_tup].each do |k|
      puts format('  %-22s %d -> %d (%+d)', k, before[k], after[k], after[k].to_i - before[k].to_i)
    end
    %w[heap toast indexes].each do |k|
      puts format('  %-22s %.1f MB -> %.1f MB (%+.1f MB)', "#{k} size", before[k] / 1048576.0, after[k] / 1048576.0,
                  (after[k] - before[k]) / 1048576.0)
    end
  end

  # ---------------------------------------------------------------- Game state

  # A player state shaped like the largest dev-database games: phone threads
  # about 30 KB, notes about 10 KB, globals, fired handlers and NPC ink
  # variables about 3 KB each.
  class PlayerModel
    attr_reader :globals, :notes, :phone, :triggered, :ink_vars, :clock, :room, :visibility

    def initialize(rng, room)
      @rng = rng
      @room = room
      @globals = (1..120).to_h { |i| ["flag_#{i}", i.even? ? rng.rand < 0.5 : rng.rand(100)] }
      @notes = (1..15).map { |i| note(i) }
      @phone = (1..4).to_h { |i| ["contact_#{i}", phone_entry(i, 25)] }
      @triggered = (1..80).to_h { |i| ["npc_#{i % 7}:event_#{i}:0", 1] }
      @ink_vars = (1..6).to_h { |i| ["npc_#{i}", (1..15).to_h { |j| ["var_#{j}", j.odd?] }] }
      @visibility = { 'npc_1' => true }
      @clock = { 'elapsedMs' => 600_000, 'timers' => { 'elapsedMs' => 600_000, 'fired' => ['intro'], 'cancelled' => [], 'started' => {} } }
    end

    def text(len)
      SecureRandom.alphanumeric(len).scan(/.{1,8}/).join(' ')
    end

    def note(i)
      { 'id' => "note_#{i}", 'title' => "Note #{i}", 'text' => text(600), 'timestamp' => 1_700_000_000_000 + i,
        'read' => true, 'important' => false }
    end

    def phone_entry(i, messages)
      { 'history' => (1..messages).map do |m|
        { 'type' => m.odd? ? 'npc' : 'player', 'text' => text(110), 'timestamp' => 1_700_000_000_000 + m, 'read' => true }
      end,
        'storyState' => { 'flows' => { 'DEFAULT_FLOW' => { 'callstack' => text(3000) } } }.to_json,
        'storyPath' => "scenarios/x/contact_#{i}.json", 'currentKnot' => 'hub' }
    end

    def tick_clock(ms)
      @clock['elapsedMs'] = @clock['timers']['elapsedMs'] = @clock['elapsedMs'] + ms
    end

    def change_global!
      key = "flag_#{@rng.rand(1..140)}"
      @globals[key] = @rng.rand(1000)
      { 'globalVariables' => { key => @globals[key] } }
    end

    def change_phone_or_note!
      if @rng.rand < 0.6
        id = "contact_#{@rng.rand(1..4)}"
        entry = @phone[id]
        entry['history'] << { 'type' => 'npc', 'text' => text(110), 'timestamp' => 1_700_000_100_000, 'read' => false }
        entry['history'].shift if entry['history'].size > 60
        { 'phoneState' => { id => entry } }
      else
        n = note(@notes.size + 1)
        @notes << n
        { 'notes' => [n] }
      end
    end

    def full
      { 'currentRoom' => @room, 'globalVariables' => @globals, 'notes' => @notes, 'scenarioClock' => @clock,
        'npcVisibility' => @visibility, 'npcInkVariables' => @ink_vars, 'triggeredEvents' => @triggered,
        'timedMessages' => { 'pending' => [], 'delivered' => [] }, 'phoneState' => @phone }
    end

    # player_state as the server holds it after a full sync
    def seeded(base)
      base.merge('currentRoom' => @room, 'globalVariables' => @globals, 'notes' => @notes,
                 'scenarioClock' => @clock, 'npcVisibility' => @visibility, 'npcInkVariables' => @ink_vars,
                 'triggeredEvents' => @triggered, 'timedMessages' => { 'pending' => [], 'delivered' => [] },
                 'phoneState' => @phone)
    end
  end

  # ---------------------------------------------------------------- Phases

  def self.prepare_games(opts)
    player = BreakEscape::DemoUser.first_or_create!(handle: 'demo_player')
    mission = BreakEscape::Mission.find_by!(name: opts.mission)
    ids = File.exist?(GAME_IDS_FILE) ? JSON.parse(File.read(GAME_IDS_FILE)) : []
    games = BreakEscape::Game.where(id: ids, player: player, mission: mission).to_a
    while games.size < opts.players
      games << BreakEscape::Game.create!(player: player, mission: mission)
    end
    games = games.first(opts.players)
    File.write(GAME_IDS_FILE, JSON.generate((games.map(&:id) + ids).uniq))

    models = games.each_with_index.map do |g, i|
      model = PlayerModel.new(Random.new(i), g.scenario_data['startRoom'])
      base = g.player_state.slice('unlockedRooms', 'unlockedObjects', 'inventory', 'encounteredNPCs',
                                  'objectivesState', 'health', 'room_states', 'biometricSamples',
                                  'biometricUnlocks', 'bluetoothDevices')
      g.update_columns(player_state: model.seeded(base))
      [g.id, model]
    end
    ActiveRecord::Base.connection.execute('VACUUM ANALYZE break_escape_games') rescue nil
    models
  end

  def self.run_sync(opts, session, recorder)
    models = prepare_games(opts)
    puts "Prepared #{models.size} games (#{opts.client} client)."
    sleep 2
    before = pg_stats
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + opts.duration
    interval_ms = opts.interval * 1000
    sent_ticks = Hash.new(0)
    tick_lock = Mutex.new

    threads = models.each_with_index.map do |(game_id, model), i|
      Thread.new do
        rng = Random.new(10_000 + i)
        last_clock = 0
        last_ts = 0
        sleep(rng.rand * opts.interval) # spread first ticks over one interval
        while Process.clock_gettime(Process::CLOCK_MONOTONIC) < deadline
          model.tick_clock(interval_ms)
          roll = rng.rand
          change = if roll < 0.15 then model.change_global!
          elsif roll < 0.20 then model.change_phone_or_note!
          end
          payload =
            if opts.client == 'legacy'
              model.full
            elsif rng.rand < 0.01 # page reload: the new page's first sync is a full snapshot
              model.full
            elsif change
              change.merge('scenarioClock' => model.clock)
            elsif model.clock['elapsedMs'] - last_clock >= CLOCK_ONLY_MS
              { 'scenarioClock' => model.clock }
            end
          if payload
            last_clock = model.clock['elapsedMs'] if payload['scenarioClock']
            last_ts = [(Time.now.to_f * 1000).to_i, last_ts + 1].max
            body = JSON.generate(opts.client == 'delta' ? payload.merge('clientTs' => last_ts) : payload)
            res, ms = session.timed(Net::HTTP::Put.new("/break_escape/games/#{game_id}/sync_state"), body)
            recorder.record('sync_state', res, ms, body.bytesize)
            tick_lock.synchronize { sent_ticks[:sent] += 1 }
          else
            tick_lock.synchronize { sent_ticks[:idle] += 1 }
          end
          sleep(opts.interval * (0.9 + rng.rand * 0.2))
        end
      end
    end
    threads.each(&:join)
    sleep 2 # let the server backends flush their table statistics
    after = pg_stats
    puts "Ticks: #{sent_ticks[:sent]} sent a request, #{sent_ticks[:idle]} had nothing to send."
    [before, after]
  end

  def self.run_burst(opts, session, recorder)
    mission = BreakEscape::Mission.find_by!(name: opts.mission)
    player = BreakEscape::DemoUser.first_or_create!(handle: 'demo_player')
    BreakEscape::PlayerPreference.find_or_create_by!(player: player) do |pref|
      pref.selected_sprite = 'male_hacker_hood_v2'
      pref.in_game_name = 'LoadTest'
    end
    before = pg_stats
    start_id = BreakEscape::Game.maximum(:id).to_i
    queue = Queue.new
    threads = Array.new(opts.players) do |i|
      Thread.new do
        sleep(rand * 3) # N players press Start within a few seconds
        res, ms = session.timed(Net::HTTP::Post.new('/break_escape/games'), "mission_id=#{mission.id}")
        recorder.record('create', res, ms)
        location = res.is_a?(Net::HTTPResponse) ? res['location'].to_s : ''
        game_id = location[%r{/games/(\d+)}, 1] || location[/game_id=(\d+)/, 1]
        queue << game_id if game_id
      end
    end
    threads.each(&:join)
    ids = []
    ids << queue.pop.to_i until queue.empty?
    ids = BreakEscape::Game.where('id > ?', start_id).where(player: player).pluck(:id) if ids.empty?
    npc_by_game = BreakEscape::Game.where(id: ids).to_h do |g|
      npc = (g.scenario_data['rooms'] || {}).values.flat_map { |r| Array(r['npcs']) }.find { |n| n['storyPath'].present? }
      [g.id, npc && npc['id']]
    end
    fetchers = ids.map do |id|
      Thread.new do
        res, ms = session.timed(Net::HTTP::Get.new("/break_escape/games/#{id}/scenario"))
        recorder.record('scenario', res, ms)
        if (npc = npc_by_game[id.to_i])
          res, ms = session.timed(Net::HTTP::Get.new("/break_escape/games/#{id}/ink?npc=#{npc}"))
          recorder.record('ink', res, ms)
        end
      end
    end
    fetchers.each(&:join)
    sleep 2
    after = pg_stats
    puts "Burst created #{ids.size} games. Delete them with: BreakEscape::Game.where(id: #{ids.minmax.inspect}.then { |a, b| a..b }).destroy_all" if ids.any?
    [before, after]
  end

  def self.main(argv)
    opts = parse(argv)
    puts "sync_state load test: #{opts.to_h.inspect}"
    session = Session.new(opts.base)

    if opts.burst
      recorder = Recorder.new
      before, after = run_burst(opts, session, recorder)
      puts "\n== Class-start burst (#{opts.players} games)"
      recorder.report
      report_pg(before, after)
    end

    return unless opts.sync

    recorder = Recorder.new
    before, after = run_sync(opts, session, recorder)
    puts "\n== Sync phase: #{opts.players} players, #{opts.duration} s, #{opts.client} client"
    recorder.report
    report_pg(before, after)
  end
end

SyncStateLoad.main(ARGV)
