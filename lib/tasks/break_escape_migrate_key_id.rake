namespace :break_escape do
  desc <<~DESC
    Rename the stored `key_id` field to `opens_lock` in existing games.

    The scenario format split key_id into `id` (which object this is) and
    `opens_lock` (which lock it opens). Scenario files and engine code moved
    across; this moves the rows that were snapshotted before the rename, so the
    back-compat fallbacks in helpers.js and BreakEscape::ItemIdentity can go.

    Takes a row lock per game, because player_state is written by live play.
    Safe to re-run: an item that already has opens_lock is left alone.

      bundle exec rake app:break_escape:migrate_key_id[dry]    # report only
      bundle exec rake app:break_escape:migrate_key_id         # apply

    TAKE A DATABASE BACKUP FIRST. The runbook -- backup, dry run, reading the
    conflict report, verifying, and deleting the fallbacks afterwards -- is
    docs/MIGRATION_key_id_to_opens_lock.md. Follow it rather than this summary.
  DESC
  task :migrate_key_id, [:mode] => :environment do |_task, args|
    dry = args[:mode].to_s.downcase.start_with?('dry')

    # Renames the field in place, depth-first, returning how many it renamed.
    # A hash carrying both fields with different values is a conflict we must
    # not resolve by guessing: record it and leave that game alone.
    rename = lambda do |node, conflicts, path = 'root'|
      count = 0
      case node
      when Hash
        if node.key?('key_id')
          if node.key?('opens_lock')
            if node['opens_lock'] == node['key_id']
              node.delete('key_id')
              count += 1
            else
              conflicts << "#{path}: opens_lock=#{node['opens_lock'].inspect} key_id=#{node['key_id'].inspect}"
            end
          else
            node['opens_lock'] = node.delete('key_id')
            count += 1
          end
        end
        node.each_value { |v| count += rename.call(v, conflicts, path) }
      when Array
        node.each_with_index { |v, i| count += rename.call(v, conflicts, "#{path}[#{i}]") }
      end
      count
    end

    scope = BreakEscape::Game.where(
      "scenario_data::text LIKE '%key_id%' OR player_state::text LIKE '%key_id%'"
    )
    total = scope.count
    puts "#{total} game(s) carry key_id.#{dry ? ' DRY RUN -- nothing will be written.' : ''}"

    changed = 0
    renamed = 0
    skipped = []

    scope.find_each do |game|
      game.with_lock do
        game.reload
        conflicts = []
        scenario = game.scenario_data.deep_dup
        state    = game.player_state.deep_dup
        n = rename.call(scenario, conflicts, 'scenario_data') +
            rename.call(state, conflicts, 'player_state')

        if conflicts.any?
          skipped << "game #{game.id}: #{conflicts.join('; ')}"
          next
        end
        next if n.zero?

        unless dry
          game.scenario_data = scenario
          game.player_state = state
          game.save!(validate: false)
        end
        changed += 1
        renamed += n
      end
    end

    puts "#{dry ? 'Would rename' : 'Renamed'} #{renamed} field(s) across #{changed} game(s)."

    if skipped.any?
      puts "\nSkipped #{skipped.size} game(s) holding both fields with different values:"
      skipped.each { |s| puts "  #{s}" }
      puts "opens_lock is the live field -- check which value the lock actually wants before forcing these."
    end
  end
end
