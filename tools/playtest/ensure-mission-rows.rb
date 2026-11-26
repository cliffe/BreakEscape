# frozen_string_literal: true

# Creates or updates exactly the named Mission rows from each scenario folder's mission.json,
# the way db/seeds.rb does for one folder. (SHOWCASE_TOUR_PLAN.md 2.7, unit U6.)
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/ensure-mission-rows.rb \
#       [--apply] [name ...]
#
# With no names: demo_ops_recon demo_ops_terminal demo_ops_passwords demo_ops_second_step.
# Without --apply it only prints what it would do and writes nothing. It never deletes a row,
# never touches a row that is not named, and rolls the whole run back (aborting) if any other
# Mission row differs afterwards. A named folder that is missing, has no scenario.json.erb, has
# an invalid mission.json or does not render to JSON is reported and stops the run before any
# write. It writes only the database the environment selects: break_escape_development for a
# standalone runner, and Hacktivity's hacktivity_db only when run from the Hacktivity checkout.
require 'json'
require 'erb'

module EnsureMissionRows
  DEFAULT_NAMES = %w[demo_ops_recon demo_ops_terminal demo_ops_passwords demo_ops_second_step].freeze
  Result = Struct.new(:plan, :errors, :written, keyword_init: true)

  module_function

  def scenarios_root
    BreakEscape::Engine.root.join('scenarios')
  end

  # Attributes of a row that a rerun must not change when the row was not named.
  def snapshot(excluding)
    BreakEscape::Mission.where.not(name: excluding).order(:id).map { |m| m.attributes.to_a }
  end

  # Reads and checks one folder; returns [attrs_hash_or_nil, error_or_nil].
  def read_folder(name, root)
    return [nil, "#{name}: not a plain folder name"] unless name.match?(/\A[a-z0-9_-]+\z/i)

    dir = root.join(name)
    return [nil, "#{name}: no folder #{dir}"] unless dir.directory?

    template = dir.join('scenario.json.erb')
    return [nil, "#{name}: no scenario.json.erb"] unless template.file?

    begin
      JSON.parse(ERB.new(template.read).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
    rescue StandardError => e
      return [nil, "#{name}: scenario.json.erb does not render to JSON (#{e.class})"]
    end

    path = dir.join('mission.json')
    return [nil, "#{name}: no mission.json"] unless path.file?

    meta = begin
      JSON.parse(path.read)
    rescue JSON::ParserError => e
      return [nil, "#{name}: invalid mission.json (#{e.message.lines.first.to_s.strip})"]
    end
    return [nil, "#{name}: mission.json is not an object"] unless meta.is_a?(Hash)

    attrs = {
      display_name: meta['display_name'] || name.titleize,
      description: meta['description'] || "Play the #{name.titleize} scenario",
      difficulty_level: meta['difficulty_level'] || 3,
      secgen_scenario: meta['secgen_scenario'],
      collection: meta['collection'] || 'default',
      published: true
    }
    [{ attrs: attrs, cybok: meta['cybok'] }, nil]
  end

  def run(names: DEFAULT_NAMES, apply: false, out: $stdout, root: scenarios_root)
    names = names.uniq
    errors = []
    folders = {}
    names.each do |n|
      info, err = read_folder(n, root)
      err ? errors << err : folders[n] = info
    end
    unless errors.empty?
      errors.each { |e| out.puts "  ERROR: #{e}" }
      out.puts 'Nothing written.'
      return Result.new(plan: [], errors: errors, written: [])
    end

    plan = folders.map do |n, info|
      row = BreakEscape::Mission.find_by(name: n)
      changes = row ? info[:attrs].reject { |k, v| row[k] == v } : info[:attrs]
      action = row.nil? ? 'CREATE' : (changes.empty? ? 'SAME' : 'UPDATE')
      out.puts "  #{apply ? '' : 'would '}#{action}: #{n}#{row && !changes.empty? ? " (#{changes.keys.join(', ')})" : ''}"
      { name: n, action: action, info: info }
    end

    unless apply
      out.puts 'Dry run: nothing written. Give --apply to write these rows.'
      return Result.new(plan: plan, errors: [], written: [])
    end

    before = snapshot(names)
    written = []
    tampered = false
    BreakEscape::Mission.transaction(requires_new: true) do
      plan.each do |p|
        next if p[:action] == 'SAME'

        m = BreakEscape::Mission.find_or_initialize_by(name: p[:name])
        m.assign_attributes(p[:info][:attrs])
        m.save!
        BreakEscape::CybokSyncService.sync_for_mission(m, p[:info][:cybok]) if p[:info][:cybok].present?
        written << "#{p[:action]} #{p[:name]} (id #{m.id})"
      end
      if snapshot(names) != before
        tampered = true
        raise ActiveRecord::Rollback, 'another Mission row changed'
      end
    end
    raise 'Aborted: another Mission row changed; the run was rolled back' if tampered

    written.each { |w| out.puts "  WROTE: #{w}" }
    out.puts "Done. #{written.size} row(s) written, 0 deleted, other rows unchanged."
    Result.new(plan: plan, errors: [], written: written)
  end
end

unless ENV['ENSURE_MISSION_ROWS_NO_AUTORUN']
  apply = ARGV.delete('--apply') ? true : false
  bad = ARGV.select { |a| a.start_with?('-') }
  abort "unknown option #{bad.first}" unless bad.empty?
  puts "Database: #{ActiveRecord::Base.connection_db_config.database}"
  result = EnsureMissionRows.run(names: ARGV.empty? ? EnsureMissionRows::DEFAULT_NAMES : ARGV, apply: apply)
  exit 1 unless result.errors.empty?
end
