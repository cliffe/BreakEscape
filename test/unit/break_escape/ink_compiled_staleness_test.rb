require 'test_helper'
require 'digest'
require 'etc'
require 'open3'
require 'set'
require 'tmpdir'

module BreakEscape
  # No scenario's compiled story JSON is stale. The game compiles an .ink newer
  # than its JSON before reading it (InkStoryFile), but the TTS batch and the
  # mission tests read the committed JSON as it is, and mtimes say nothing in a
  # fresh checkout. So for every scenario .ink, its compiled output (bin/inklecate,
  # as scripts/compile-ink.sh runs it) equals every compiled JSON beside it that
  # a storyPath could name: X.json and X.ink.json, whichever exist.
  #
  # Compiles run in parallel, and an .ink whose source, includes, JSON and
  # compiler are unchanged since a passing run is not compiled again (tmp/cache).
  class InkCompiledStalenessTest < ActiveSupport::TestCase
    THREADS = [Etc.nprocessors, 8].min
    CACHE_DIR = Engine.root.join('tmp', 'cache', 'ink_staleness')

    # [ink, [json, ...]] relative to the engine root, for every scenario .ink
    # with at least one compiled JSON beside it
    def self.pairs
      @pairs ||= Dir.chdir(Engine.root) do
        Dir.glob('scenarios/**/*.ink').sort.filter_map do |ink|
          jsons = [ink.sub(/\.ink\z/, '.json'), ink.sub(/\.ink\z/, '.ink.json')].select { |f| File.exist?(f) }
          [ink, jsons] if jsons.any?
        end
      end
    end

    # Every file ink includes, directly or through another include
    def self.includes(ink, seen = Set.new)
      File.read(Engine.root.join(ink)).scan(/^\s*INCLUDE\s+(\S+)/).flatten.each do |name|
        path = File.join(File.dirname(ink), name)
        next if seen.include?(path) || !File.exist?(Engine.root.join(path))

        seen << path
        includes(path, seen)
      end
      seen.to_a
    end

    def read_json(path)
      JSON.parse(File.read(Engine.root.join(path), encoding: 'bom|utf-8'))
    end

    def assert_inklecate_runs
      assert File.executable?(InkStoryFile.inklecate), "bin/inklecate is missing or not executable"
      Open3.capture3(InkStoryFile.inklecate.to_s)
    rescue SystemCallError => e
      flunk "bin/inklecate does not run here (#{e.class}); it is an x86-64 Linux binary"
    end

    test "there are compiled stories to check" do
      assert_operator self.class.pairs.size, :>, 100
    end

    test "every scenario .ink compiles to each committed JSON beside it" do
      assert_inklecate_runs
      compiler = Digest::SHA256.file(InkStoryFile.inklecate.to_s).hexdigest
      FileUtils.mkdir_p(CACHE_DIR)
      queue = Queue.new
      self.class.pairs.each { |pair| queue << pair }
      stale = []
      digests = Set.new
      lock = Mutex.new

      Dir.mktmpdir('ink_staleness') do |out|
        Array.new(THREADS) do
          Thread.new do
            loop do
              ink, jsons = begin
                queue.pop(true)
              rescue ThreadError
                break
              end
              sources = [ink, *self.class.includes(ink).sort, *jsons]
              digest = Digest::SHA256.hexdigest(([compiler] + sources.map { |f| "#{f}\0#{File.read(Engine.root.join(f))}" }).join("\0"))
              lock.synchronize { digests << digest }
              mark = CACHE_DIR.join(digest)
              next if File.exist?(mark)

              compiled = File.join(out, "#{ink.tr('/', '_')}.json")
              _stdout, stderr, status = Open3.capture3(InkStoryFile.inklecate.to_s, '-o', compiled, Engine.root.join(ink).to_s)
              problems =
                if status.success?
                  output = JSON.parse(File.read(compiled, encoding: 'bom|utf-8'))
                  jsons.reject { |json| output == read_json(json) }.map { |json| "compiles to something other than #{json}" }
                else
                  ["does not compile: #{stderr.lines.first.to_s.strip}"]
                end
              if problems.any?
                lock.synchronize { problems.each { |problem| stale << "#{ink} #{problem}" } }
              else
                FileUtils.touch(mark)
              end
            end
          end
        end.each(&:join)
      end

      # Keep only this run's marks, so the cache does not grow with every edit
      Dir.children(CACHE_DIR).each { |name| File.delete(CACHE_DIR.join(name)) unless digests.include?(name) }

      assert_empty stale.sort, "recompile with scripts/compile-ink.sh:\n#{stale.sort.join("\n")}"
    end
  end
end
