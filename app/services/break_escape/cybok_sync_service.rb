# frozen_string_literal: true

module BreakEscape
  # Service to sync CyBOK data from mission.json to database tables.
  # Writes to both BreakEscape and Hacktivity tables when Hacktivity is present.
  class CybokSyncService
    class << self
      # Sync CyBOK data for a mission from parsed JSON data
      # @param mission [BreakEscape::Mission] the mission to sync
      # @param cybok_data [Array, nil] array of CyBOK entries from mission.json
      def sync_for_mission(mission, cybok_data)
        return 0 if cybok_data.blank?

        # Normalize input (handle both array and hash formats)
        cybok_entries = Array.wrap(cybok_data)

        # Clear existing entries from BreakEscape table
        mission.break_escape_cyboks.destroy_all

        # Clear Hacktivity entries if available
        clear_hacktivity_cyboks(mission) if hacktivity_mode?

        count = 0
        cybok_entries.each do |entry|
          ka = entry['ka'] || entry[:ka]
          topic = entry['topic'] || entry[:topic]
          keywords = entry['keywords'] || entry[:keywords]

          # Serialize keywords array to string (Hacktivity format)
          keywords_str = serialize_keywords(keywords)

          # Always write to BreakEscape table
          mission.break_escape_cyboks.create!(
            ka: ka,
            topic: topic,
            keywords: keywords_str
          )

          # Also write to Hacktivity table if available
          create_hacktivity_cybok(mission, ka, topic, keywords_str) if hacktivity_mode?

          count += 1
        end

        count
      end

      # Check if Hacktivity mode is active (::Cybok constant exists)
      def hacktivity_mode?
        defined?(::Cybok)
      end

      private

      def serialize_keywords(keywords)
        case keywords
        when Array
          keywords.join(', ')
        when String
          keywords
        else
          keywords.to_s
        end
      end

      def clear_hacktivity_cyboks(mission)
        return unless hacktivity_mode?

        ::Cybok.where(
          cybokable_type: 'BreakEscape::Mission',
          cybokable_id: mission.id
        ).destroy_all
      end

      def create_hacktivity_cybok(mission, ka, topic, keywords_str)
        return unless hacktivity_mode?

        ::Cybok.create!(
          cybokable_type: 'BreakEscape::Mission',
          cybokable_id: mission.id,
          ka: ka,
          topic: topic,
          keywords: keywords_str
        )
      end
    end
  end
end
