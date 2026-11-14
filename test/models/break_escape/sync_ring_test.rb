require 'test_helper'

module BreakEscape
  # The pure ring maths (SYNC_STALE_RING_PLAN section 4 and 5): normalisation to
  # the fixed bound and the skip-set build. The controller owns the diff that
  # decides what a merge changed; this pins the bound and the skip rule without
  # HTTP.
  class SyncRingTest < ActiveSupport::TestCase
    SR = BreakEscape::SyncRing
    MAX = 8
    WINDOW = 60_000
    CAP = 32

    def normalise(ring)
      SR.normalise(ring, max: MAX, window_ms: WINDOW, keys_per_entry: CAP)
    end

    def entry(ts, w)
      { 'ts' => ts, 'w' => w }
    end

    # ---- normalisation ----------------------------------------------------

    test 'an entry over the key cap collapses its largest sections to a whole claim' do
      big = (1..40).map { |i| "g#{i}" }
      e = entry(1000, { 'globalVariables' => big, 'playerHealth' => true })
      out = normalise([e]).first

      assert_equal true, out['w']['globalVariables'], 'the largest per-key section collapses to true'
      assert_equal true, out['w']['playerHealth']
      assert_operator SR.entry_key_count(out['w']), :<=, CAP
    end

    test 'collapse stops once within the cap and leaves a small section per key' do
      w = { 'globalVariables' => (1..30).map { |i| "g#{i}" },
            'npcVisibility' => %w[a b c] }
      out = normalise([entry(1000, w)]).first

      assert_equal true, out['w']['globalVariables'], 'the 30-key section collapses'
      assert_equal %w[a b c], out['w']['npcVisibility'], 'the small section stays per key'
    end

    test 'entries more than the window below the newest ts are dropped' do
      ring = [entry(200_000, { 'globalVariables' => ['a'] }),
              entry(200_000 - WINDOW - 1, { 'globalVariables' => ['b'] }),
              entry(200_000 - WINDOW, { 'globalVariables' => ['c'] })]
      out = normalise(ring)

      assert_equal [200_000, 200_000 - WINDOW], out.map { |x| x['ts'] }.sort.reverse,
                   'the entry just over the window is dropped, the one exactly at it is kept'
    end

    test 'at most MAX entries are kept, the newest by ts' do
      ring = (1..12).map { |i| entry(100_000 + i, { 'globalVariables' => ["g#{i}"] }) }
      out = normalise(ring)

      assert_equal MAX, out.size
      assert_equal (100_005..100_012).to_a.reverse, out.map { |x| x['ts'] }
    end

    test 'normalise of an empty ring is empty' do
      assert_equal [], normalise([])
    end

    # ---- skip set ---------------------------------------------------------

    test 'skip set unions the writes of entries at or above the given ts' do
      ring = [entry(1002, { 'globalVariables' => ['g'], 'playerHealth' => true }),
              entry(1001, { 'globalVariables' => ['late'] }),
              entry(1000, { 'globalVariables' => ['old'] })]
      skip = SR.skip_set(ring, 1001)

      assert_equal Set['g', 'late'], skip['globalVariables'], 'ts 1000 is below and excluded'
      assert_equal :whole, skip['playerHealth']
    end

    test 'skip set includes an entry sharing the exact ts (>=, not >)' do
      ring = [entry(1001, { 'globalVariables' => ['g'] })]
      assert_equal Set['g'], SR.skip_set(ring, 1001)['globalVariables']
    end

    test 'a whole-section claim dominates a per-key claim in the skip set' do
      ring = [entry(1002, { 'timedMessages' => true }),
              entry(1001, { 'timedMessages' => ['ignored'] })]
      assert_equal :whole, SR.skip_set(ring, 1001)['timedMessages']
    end

    test 'skip set of an empty or absent ring is empty' do
      assert_equal({}, SR.skip_set([], 1000))
      assert_equal({}, SR.skip_set(nil, 1000))
    end
  end
end
