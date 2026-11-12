require 'test_helper'
require 'digest'
require 'open3'
require 'tmpdir'

module BreakEscape
  # No scenario's compiled story JSON is stale. The game compiles an .ink newer
  # than its JSON before reading it (InkStoryFile), but the TTS batch and the
  # mission tests read the committed JSON as it is, and mtimes say nothing in a
  # fresh checkout. So for every scenario .ink with a compiled JSON beside it:
  #
  # - its compiled output (bin/inklecate, as scripts/compile-ink.sh runs it)
  #   equals the committed JSON;
  # - in git history, the JSON's last commit is not older than the last commit
  #   of the .ink or of any file it INCLUDEs.
  #
  # Compiles run in parallel, and a pair whose ink, includes, JSON and compiler
  # are unchanged since a passing run is not compiled again (tmp/cache).
  class InkCompiledStalenessTest < ActiveSupport::TestCase
    THREADS = 8
    CACHE_DIR = Engine.root.join('tmp', 'cache', 'ink_staleness')

    # JSON last committed before its .ink, found when this test was added, with
    # compiled output equal to the committed JSON. Left for their missions'
    # owners to recommit; each still has to compile to its committed JSON, and
    # an entry that is no longer out of order must be removed from this list.
    KNOWN_OUT_OF_ORDER = %w[
      scenarios/ink/test2.ink
      scenarios/lab_tesseract_trials/ink/npc_sidhu.ink
      scenarios/sis01_healthcare/ink/npc_bed2_patient.ink
      scenarios/sis01_healthcare/ink/npc_david.ink
      scenarios/sis01_healthcare/ink/npc_hartley.ink
    ].freeze

    # [ink, json] relative to the engine root, for every scenario .ink with a
    # compiled JSON, as InkStoryFile finds it
    def self.pairs
      @pairs ||= Dir.chdir(Engine.root) do
        Dir.glob('scenarios/**/*.ink').sort.filter_map do |ink|
          json = InkStoryFile.compiled_json(Engine.root.join(ink.sub(/\.ink\z/, '.json')))
          json && [ink, json.relative_path_from(Engine.root).to_s]
        end
      end
    end

    def self.includes(ink)
      File.read(Engine.root.join(ink)).scan(/^\s*INCLUDE\s+(\S+)/).flatten
          .map { |name| File.join(File.dirname(ink), name) }
          .select { |path| File.exist?(Engine.root.join(path)) }
    end

    def read_json(path)
      JSON.parse(File.read(Engine.root.join(path), encoding: 'bom|utf-8'))
    end

    test "there are compiled stories to check" do
      assert_operator self.class.pairs.size, :>, 100
    end

    test "every scenario .ink compiles to its committed JSON" do
      compiler = Digest::SHA256.file(InkStoryFile.inklecate.to_s).hexdigest
      FileUtils.mkdir_p(CACHE_DIR)
      queue = Queue.new
      self.class.pairs.each { |pair| queue << pair }
      stale = []
      lock = Mutex.new

      Dir.mktmpdir('ink_staleness') do |out|
        Array.new(THREADS) do
          Thread.new do
            loop do
              ink, json = begin
                queue.pop(true)
              rescue ThreadError
                break
              end
              sources = [ink, *self.class.includes(ink), json]
              digest = Digest::SHA256.hexdigest(([compiler] + sources.map { |f| "#{f}\0#{File.read(Engine.root.join(f))}" }).join("\0"))
              mark = CACHE_DIR.join(digest)
              next if File.exist?(mark)

              compiled = File.join(out, "#{ink.tr('/', '_')}.json")
              _stdout, stderr, status = Open3.capture3(InkStoryFile.inklecate.to_s, '-o', compiled, Engine.root.join(ink).to_s)
              problem =
                if !status.success?
                  "does not compile: #{stderr.lines.first.to_s.strip}"
                elsif JSON.parse(File.read(compiled, encoding: 'bom|utf-8')) != read_json(json)
                  "compiles to something other than #{json}"
                end
              if problem
                lock.synchronize { stale << "#{ink} #{problem}" }
              else
                FileUtils.touch(mark)
              end
            end
          end
        end.each(&:join)
      end

      assert_empty stale.sort, "recompile with scripts/compile-ink.sh:\n#{stale.sort.join("\n")}"
    end

    test "no compiled JSON was last committed before its .ink or the files it includes" do
      _out, _err, status = Open3.capture3('git', '-C', Engine.root.to_s, 'rev-parse', '--is-inside-work-tree')
      skip 'not a git checkout' unless status.success?

      # path => position of its last commit in git log (0 is the newest)
      last = {}
      position = -1
      log, = Open3.capture2('git', '-C', Engine.root.to_s, 'log', '--format=%x00', '--name-only', '--', 'scenarios')
      log.each_line do |line|
        line = line.chomp
        if line.start_with?("\0")
          position += 1
        elsif !line.empty?
          last[line] ||= position
        end
      end

      out_of_order = self.class.pairs.filter_map do |ink, json|
        source = [ink, *self.class.includes(ink)].filter_map { |f| last[f] }.min
        next unless source && last[json] && last[json] > source

        ink
      end

      assert_empty out_of_order - KNOWN_OUT_OF_ORDER,
                   "JSON last committed before its .ink (recompile and commit both):\n#{(out_of_order - KNOWN_OUT_OF_ORDER).join("\n")}"
      assert_empty KNOWN_OUT_OF_ORDER - out_of_order, 'no longer out of order: remove from KNOWN_OUT_OF_ORDER'
    end
  end
end
