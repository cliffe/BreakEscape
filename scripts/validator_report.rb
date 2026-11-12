# frozen_string_literal: true

require 'json'
require 'date'

# The validator's one output writer (SCENARIO_FORMAT_HARDENING_PLAN step 1).
#
# Everything the validator prints goes through ValidatorReport#write ($stdout is swapped for the
# report while main runs), so a module that prints its own lines is counted too. Each complete line
# is classified:
#   - a line holding "❌" is an error, tagged with the stage that printed it;
#   - a line whose text (after an optional "12. " list number) starts with "⚠️" is a warning;
#   - headers printed with #header are never counted.
# An error line that a known-failures entry covers (same scenario, same stage, the entry's `match`
# is a substring, and the entry still has room under its `count`) is printed with
# "(known: <owner>, since <added>)" and does not count towards the exit code. "could not run",
# "stale known failure" and "Result:" lines are never matched.
class ValidatorReport
  STAGES = %w[ink schema common habits work social].freeze
  UNMATCHABLE = ['could not run', 'stale known failure', 'Result:'].freeze
  ERROR_MARK = '❌'
  WARNING_RE = /\A\s*(?:\d+\.\s+)?⚠️/.freeze

  attr_reader :errors, :known, :warnings, :stage_lines

  def initialize(out, scenario_paths: [], known_failures: [])
    @out = out
    @buffer = +''
    @stage = 'common'
    @errors = 0
    @known = 0
    @warnings = 0
    @not_full = {}
    @stage_lines = Hash.new(0)
    @scenario_paths = scenario_paths.map(&:to_s)
    @entries = known_failures.select { |e| e.is_a?(Hash) && @scenario_paths.include?(e['scenario'].to_s) }
                             .map { |e| { entry: e, seen: 0 } }
    @header = false
  end

  # The stage whose lines are being printed: one of STAGES.
  def stage=(name)
    flush_line
    @stage = name.to_s
  end

  attr_reader :stage

  # Mark a stage as not run in full (skipped, an ink compile failure, a check that raised).
  def not_full!(stage, reason)
    @not_full[stage.to_s] ||= reason
  end

  def full?(stage)
    !@not_full.key?(stage.to_s)
  end

  # Runs one check under its own rescue. On an exception it returns `fallback` plus a
  # "could not run" line (via the block given to on_error, or appended to the returned list).
  def run_check(stage, name, fallback: [])
    yield
  rescue StandardError, ScriptError => e
    not_full!(stage, "#{name} raised")
    line = "❌ ERROR: #{name} could not run: #{e.class}: #{e.message.to_s.lines.first.to_s.strip}"
    fallback.is_a?(Array) ? fallback + [line] : (puts(line) || fallback)
  end

  # --- IO interface -------------------------------------------------------------------------

  def write(*parts)
    parts.each do |part|
      @buffer << part.to_s
      while (i = @buffer.index("\n"))
        line = @buffer.slice!(0, i + 1)
        emit(line.chomp)
      end
    end
    parts.sum { |p| p.to_s.bytesize }
  end

  def <<(obj)
    write(obj)
    self
  end

  def print(*args)
    write(*args)
    nil
  end

  def puts(*args)
    if args.empty?
      write("\n")
      return nil
    end
    args.flatten.each do |a|
      s = a.nil? ? '' : a.to_s
      write(s.end_with?("\n") ? s : "#{s}\n")
    end
    nil
  end

  def printf(fmt, *args)
    write(format(fmt, *args))
    nil
  end

  def flush
    @out.flush
    self
  end

  def sync
    true
  end

  def sync=(_value); end

  def tty?
    false
  end
  alias isatty tty?

  def fileno
    @out.fileno
  end

  # Prints a line that is never counted (a section header that happens to start with ⚠️).
  def header(text)
    flush_line
    @header = true
    puts text
  ensure
    @header = false
  end

  # --- the end of the run --------------------------------------------------------------------

  # Prints the stale-entry lines, the not-checked note and the Result line. Returns the exit code.
  def finish
    flush_line
    not_checked = []
    @entries.each do |slot|
      e = slot[:entry]
      st = e['stage'].to_s
      unless full?(st)
        not_checked << st
        next
      end
      next unless slot[:seen] < e['count'].to_i

      self.stage = st
      puts "❌ ERROR: stale known failure: #{e['scenario']} #{st} '#{e['match']}' now matches #{slot[:seen]} " \
           "of #{e['count']}; update or remove it"
    end
    flush_line
    unlisted = @errors - @known
    tail = ''
    if not_checked.any?
      skipped = not_checked.uniq.join(', ')
      tail = "; #{not_checked.length} known failure(s) not checked (#{skipped} skipped)"
    end
    @header = true
    puts "Result: #{@errors} errors (#{@known} known), #{@warnings} warnings#{tail}"
    @header = false
    flush
    unlisted.positive? ? 1 : 0
  end

  # Loads a known-failures list. A missing file is an empty list; a broken one raises.
  def self.load_known_failures(path)
    return [] if path.nil? || !File.exist?(path)

    data = JSON.parse(File.read(path))
    raise ArgumentError, "#{path} must hold a JSON array" unless data.is_a?(Array)

    data
  end

  private

  def flush_line
    return if @buffer.empty?

    line = @buffer.dup
    @buffer.clear
    emit(line)
  end

  def emit(line)
    if @header
      @out.write("#{line}\n")
      return
    end
    if line.include?(ERROR_MARK)
      @errors += 1
      @stage_lines[@stage] += 1
      slot = match_entry(line)
      if slot
        slot[:seen] += 1
        @known += 1
        e = slot[:entry]
        line = "#{line} (known: #{e['owner']}, since #{e['added']})"
      end
    elsif line.match?(WARNING_RE)
      @warnings += 1
    end
    @out.write("#{line}\n")
  end

  def match_entry(line)
    return nil if UNMATCHABLE.any? { |u| line.include?(u) }

    @entries.find do |slot|
      e = slot[:entry]
      m = e['match'].to_s
      e['stage'].to_s == @stage && !m.empty? && !"#{ERROR_MARK} ERROR: ".include?(m) &&
        line.include?(m) && slot[:seen] < e['count'].to_i
    end
  end
end
