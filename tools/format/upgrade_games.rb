# Step 7 of the scenario format hardening. The optional sweep tool: upgrade stored games
# ahead of players loading them, so a release can move the whole corpus to the current
# format in one pass. Load time stays the guarantee (Game#ensure_current_format!); this
# tool runs that same helper under each game's own row lock, in batches.
#
# Run it with the Rails runner:
#   bin/rails runner tools/format/upgrade_games.rb --dry-run   # counts only, writes nothing
#   bin/rails runner tools/format/upgrade_games.rb             # upgrades (not in development)
#
# --dry-run reports counts per stored version and, per step, how many games the step would
# change, and writes nothing. A real run is refused against the shared development database
# (plan section 2); run the real sweep only where the database is not the shared dev one.
module BreakEscape
  module UpgradeGamesTool
    module_function

    # Returns an exit status (0 ok, 1 refused). out is injectable for the test.
    def run(argv: ARGV, out: $stdout)
      dry_run = argv.include?('--dry-run')

      if !dry_run && defined?(Rails) && Rails.env.development?
        out.puts('[upgrade_games] refusing a real run against the development database; pass --dry-run (plan section 2)')
        return 1
      end

      current = FormatUpgrade.current
      out.puts("[upgrade_games] current format version: #{current}#{dry_run ? ' (dry run)' : ''}")

      by_version = Hash.new(0)
      unreadable = 0
      too_new = 0
      would_upgrade = 0
      changed_games = 0
      upgraded = 0
      per_step = Hash.new(0) # "version name" => games whose scenario_data the step would change

      Game.find_each(batch_size: 100) do |game|
        stored =
          begin
            FormatUpgrade.version_of(game.scenario_data)
          rescue FormatUpgrade::Unreadable
            unreadable += 1
            next
          end

        by_version[stored] += 1
        if stored > current
          too_new += 1
          next
        end
        next if stored == current

        would_upgrade += 1

        if dry_run
          # Replay each step's scenario transform on a deep copy, count per step, save nothing.
          data = Marshal.load(Marshal.dump(game.scenario_data))
          changed_here = false
          FormatUpgrade.steps.each do |step|
            next unless step[:version] > stored

            before = Marshal.load(Marshal.dump(data))
            step[:scenario]&.call(data)
            next if data == before

            per_step["#{step[:version]} #{step[:name]}"] += 1
            changed_here = true
          end
          changed_games += 1 if changed_here
        else
          game.ensure_current_format! # the same helper: with_lock { reload; upgrade; prepare if changed; save }
          upgraded += 1
        end
      end

      out.puts('[upgrade_games] games by stored version:')
      by_version.sort.each { |v, n| out.puts("  version #{v}: #{n}") }
      out.puts("  unreadable: #{unreadable}") if unreadable.positive?
      out.puts("  too new (> #{current}): #{too_new}") if too_new.positive?
      out.puts("[upgrade_games] would upgrade: #{would_upgrade}")

      if dry_run
        out.puts("[upgrade_games] of those, scenario_data would change (re-prepared): #{changed_games}")
        out.puts('[upgrade_games] per step, games whose scenario_data would change:')
        per_step.sort.each { |k, n| out.puts("  step #{k}: #{n}") }
        out.puts('[upgrade_games] dry run: nothing written')
      else
        out.puts("[upgrade_games] upgraded: #{upgraded}")
      end

      0
    end
  end
end

# The Rails runner evaluates this file top level; run it then. Requiring it from a test
# (Rails.env.test?) only defines the module, so the test can call run with a stub.
BreakEscape::UpgradeGamesTool.run unless defined?(Rails) && Rails.env.test?
