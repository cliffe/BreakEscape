require 'test_helper'
require 'json'
require 'stringio'
require 'tmpdir'

# Scanner hardening U5: the command-line entry's capture modes. The script is driven as
# test/unit/access_leak_scanner_test.rb drives it. Tagged files are built from the untagged fixture's own rows plus
# PC-route and /crack rows tagged as the recorder (1.0.21) writes them; the refusals are the scanner's `tag_problem`.
class AccessLeakCheckCliTagsTest < ActiveSupport::TestCase
  SCRIPT = Rails.root.join('../../tools/playtest/access-leak-check.rb').to_s

  setup do
    @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                               scenario: JSON.parse(file_fixture('access_leak/scenario.json').read))
    @dir = Dir.mktmpdir
  end

  teardown { FileUtils.remove_entry(@dir) }

  def base
    "/break_escape/games/#{@game.id}"
  end

  def plain_rows
    file_fixture('access_leak/responses.jsonl').read.gsub('/games/1/', "/games/#{@game.id}/").lines.first(3).map { |l| JSON.parse(l) }
  end

  def pc_row(tag = { 'pcId' => 'front_pc' }, path: 'login')
    { 'method' => 'POST', 'path' => "#{base}/#{path}", 'status' => 403, 'body' => { 'success' => false }, 'pc' => tag }
  end

  def crack_row(tag = { 'hashId' => 'hash_a' })
    { 'method' => 'POST', 'path' => "#{base}/crack", 'status' => 403, 'body' => { 'success' => false }, 'hash' => tag }
  end

  # a tagged capture: a sign-in row and a crack row, every tag-bearing row with its key
  def tagged_rows
    plain_rows + [pc_row, crack_row]
  end

  def write(name, rows)
    path = File.join(@dir, name)
    File.write(path, rows.map { |r| "#{JSON.generate(r)}\n" }.join)
    path
  end

  def run_check(*args)
    old_argv = ARGV.dup
    ARGV.replace(args.map(&:to_s))
    out = StringIO.new
    err = StringIO.new
    status = 0
    old_stdout = $stdout
    old_stderr = $stderr
    $stdout = out
    $stderr = err
    begin
      load SCRIPT
    rescue SystemExit => e
      status = e.status
    ensure
      $stdout = old_stdout
      $stderr = old_stderr
      ARGV.replace(old_argv)
    end
    [out.string + err.string, status]
  end

  def check(rows, *options)
    run_check(*options, @game.id, write('r.jsonl', rows))
  end

  def assert_refused(rows, *options)
    out, status = check(rows, *options)
    assert_equal 2, status, out
    refute_includes out, 'VERDICT'
    out
  end

  test 'T1: one PC-route row without its tag is refused' do
    rows = tagged_rows
    rows.find { |r| r['path'].end_with?('/login') }.delete('pc')
    assert_refused(rows)
    assert_refused(rows, '--untagged')
  end

  test 'T2: every tag stripped is refused without --untagged and says what to do' do
    rows = tagged_rows.map { |r| r.reject { |k, _| %w[pc hash].include?(k) } }
    out = assert_refused(rows)
    assert_includes out, '--untagged'
  end

  test 'T3: a pc tag on a GET container row, a hash tag on a login row' do
    assert_refused(plain_rows + [pc_row.merge('method' => 'GET', 'path' => "#{base}/container/desk")])
    assert_refused(plain_rows + [pc_row.merge('hash' => { 'hashId' => 'hash_a' })])
    assert_refused(plain_rows + [crack_row.merge('pc' => { 'pcId' => 'front_pc' })])
  end

  test 'T4: tag values that are not null or exactly the id object are refused' do
    [{ 'pcId' => 5 }, { 'pcId' => '' }, { 'pcId' => 'x' * 201 }, { 'pcId' => 'front_pc', 'extra' => 1 }, { 'pcid' => 'front_pc' },
     'front_pc', []].each do |bad|
      assert_refused(plain_rows + [pc_row(bad)])
    end
    assert_refused(plain_rows + [crack_row({ 'hashId' => 5 })])
    assert_refused(plain_rows + [crack_row({ 'pcId' => 'hash_a' })])
  end

  test 'T5: a login key on any row is refused, in either mode' do
    rows = plain_rows
    rows.first['login'] = { 'pcId' => 'front_pc' }
    assert_refused(rows)
    assert_refused(rows, '--untagged')
  end

  test 'T8: a tagged capture with --signin or --logout is refused, and so is --untagged on a tagged file' do
    assert_refused(tagged_rows, '--signin', 'jake@jake_pc#1')
    assert_refused(tagged_rows, '--logout', 'jake@jake_pc#1')
    assert_refused(tagged_rows, '--untagged', '--signin', 'jake@jake_pc#1')
    assert_refused(tagged_rows, '--untagged')
  end

  test 'T16: a tagged file and an untagged file of one run are refused' do
    tagged = write('a.jsonl', plain_rows + [pc_row])
    untagged = write('b.jsonl', plain_rows + [pc_row.reject { |k, _| k == 'pc' }])
    [[], ['--untagged']].each do |opts|
      out, status = run_check(*opts, @game.id, tagged, untagged)
      assert_equal 2, status, out
      out, status = run_check(*opts, @game.id, untagged, tagged)
      assert_equal 2, status, out
    end
  end

  test 'a tagged capture is judged in the default mode, with a --resume entry allowed' do
    out, status = check(tagged_rows)
    assert_includes [0, 1], status, out
    assert_includes out, 'VERDICT'
    # --resume is allowed beside tags: the refusal, if any, is the unmatched entry, never the mode
    out, status = check(tagged_rows, '--resume', 'jake@jake_pc@2026-01-01T00:00:00.000Z')
    assert_equal 2, status, out
    assert_includes out, 'entries that matched no row'
    refute_match(/tag|--untagged/i, out)
  end

  test 'a file with no tag-bearing rows fits either mode and gives the same output' do
    rows = plain_rows
    default_out, default_status = check(rows)
    untagged_out, untagged_status = check(rows, '--untagged')
    assert_equal default_status, untagged_status, default_out
    assert_equal default_out, untagged_out
  end

  test 'an untagged capture with --untagged and its entries gives the old output; without it, it is refused' do
    rows = plain_rows + [pc_row.reject { |k, _| k == 'pc' }]
    out, status = check(rows, '--untagged')
    assert_includes [0, 1], status, out
    assert_includes out, 'VERDICT'
    assert_includes out, '4 responses from 1 file(s)'
    out = assert_refused(rows)
    assert_includes out, '--untagged'
  end

  test 'the real untagged fixture with --untagged gives main output' do
    fixture = file_fixture('access_leak/responses.jsonl').read.gsub('/games/1/', "/games/#{@game.id}/")
    path = File.join(@dir, 'full.jsonl')
    File.write(path, fixture)
    out, status = run_check('--untagged', @game.id, path)
    assert_equal 1, status, out
    assert_includes out, '14 responses from 1 file(s)'
    assert_includes out, 'VERDICT: 6 finding(s)'
  end

  test 'entries that match no row still exit 2 with --untagged' do
    rows = plain_rows + [pc_row.reject { |k, _| k == 'pc' }]
    out, status = check(rows, '--untagged', '--signin', 'jake@jake_pc#9')
    assert_equal 2, status, out
    assert_includes out, 'entries that matched no row'
  end

  test 'the usage text names --untagged' do
    out, status = run_check
    assert_equal 2, status
    assert_includes out, '--untagged'
  end
end
