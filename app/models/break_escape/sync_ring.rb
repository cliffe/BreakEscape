# frozen_string_literal: true

require 'set'

module BreakEscape
  # The stale-but-recent sync write ring (SYNC_STALE_RING_PLAN).
  #
  # A short, bounded record of the last few accepted last-write-wins writes,
  # each entry { 'ts' => clientTs, 'w' => { section => [keys] | true } }. It
  # records only key names and stamps, never any value, so it can never become a
  # second copy of player_state, and it is read and written only inside
  # GamesController#sync_state (never serialised to the client).
  #
  # These are the pure functions over a ring array (normalisation and skip-set
  # build). The controller owns the diff that decides what a merge changed, since
  # that needs player_state and the request params; this module owns the maths,
  # so the bound and the skip-set rule can be unit-tested without HTTP.
  module SyncRing
    module_function

    # The longest claim key name (in bytes) the ring records per key. A section
    # holding a longer key name is collapsed to a whole-section claim, so an
    # uncapped claim key (globalVariables key names carry no length cap in
    # merge_global_variables!) cannot grow the ring's bytes. With each kept claim
    # key at most this many bytes, and at most keys_per_entry keys per entry, an
    # entry is bounded in bytes, not only in key count (build review R2, Minor 2).
    MAX_KEY_BYTES = 128

    # Normalise the ring to its fixed bound on every append: collapse an entry
    # holding an over-long key name to a whole-section claim, collapse an over-cap
    # entry's largest per-key sections to a whole-section claim, drop entries more
    # than window_ms below the newest ts, keep the newest `max` by ts. Runs on every
    # append and nothing else writes the ring, so it never accumulates. Returns a new
    # array; does not mutate the input entries' hashes in place beyond the collapse
    # of an over-cap or over-long entry.
    def normalise(ring, max:, window_ms:, keys_per_entry:, max_key_bytes: MAX_KEY_BYTES)
      return [] if ring.empty?

      ring = ring.map { |entry| collapse_entry(entry, keys_per_entry, max_key_bytes) }
      newest = ring.map { |entry| entry['ts'] }.max
      ring = ring.reject { |entry| newest - entry['ts'] > window_ms }
      ring.sort_by { |entry| -entry['ts'] }.first(max)
    end

    # Collapse an entry to stay within both bounds. First the byte bound: a per-key
    # section holding a claim key longer than max_key_bytes is collapsed whole, so a
    # very long key name cannot multiply across the ring's entries. Then the count
    # bound: the largest remaining per-key section is collapsed until the recorded
    # keys are within the cap. Conservative: a collapsed section is treated as wholly
    # claimed, which can only forgo a gap 1 recovery, never put an older value over a
    # newer one. In practice this fires only for a first-after-load full snapshot or
    # a hostile long key name.
    def collapse_entry(entry, keys_per_entry, max_key_bytes = MAX_KEY_BYTES)
      w = entry['w']
      w.each do |section, claim|
        next unless claim.is_a?(Array)

        w[section] = true if claim.any? { |k| k.to_s.bytesize > max_key_bytes }
      end
      while entry_key_count(w) > keys_per_entry
        section = w.select { |_, claim| claim.is_a?(Array) }.max_by { |_, claim| claim.size }&.first
        break unless section

        w[section] = true
      end
      entry
    end

    # The recorded-key count of one entry's write map (a whole-section claim
    # counts as one).
    def entry_key_count(w)
      w.sum { |_, claim| claim.is_a?(Array) ? claim.size : 1 }
    end

    # The skip set for a stale-but-recent request at `ts`: the union, over every
    # ring entry with entry.ts >= ts, of that entry's writes. A section any such
    # entry claimed whole maps to :whole (which dominates); otherwise the section
    # maps to the Set of claimed keys. The comparison is >= so a newer entry
    # sharing the request's exact millisecond is still skipped (the conservative
    # choice, matching today's whole-skip of an equal stamp). The request's own
    # entry is appended only after its merges run, so it is never in its own skip
    # set.
    def skip_set(ring, ts)
      return {} unless ring.is_a?(Array)

      skip = {}
      ring.each do |entry|
        next unless entry['ts'].is_a?(Numeric) && entry['ts'] >= ts

        (entry['w'] || {}).each do |section, claim|
          if claim == true || skip[section] == :whole
            skip[section] = :whole
          else
            (skip[section] ||= Set.new).merge(Array(claim))
          end
        end
      end
      skip
    end
  end
end
