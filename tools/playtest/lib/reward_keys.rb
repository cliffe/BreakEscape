# Which key names a flag reward's target object can sit under. The server reads
# `objectId` (Game#flag_station_unlock_targets); scenarios use that spelling. The
# older snake_case spellings stay accepted so earlier playtest scripts keep working.
module RewardKeys
  module_function

  UNLOCK_OBJECT_KEYS = %w[objectId object_id target_object id].freeze

  def unlock_object_id(reward)
    return nil unless reward.is_a?(Hash)

    UNLOCK_OBJECT_KEYS.each do |key|
      value = reward[key]
      return value unless value.nil? || value.to_s.strip.empty?
    end
    nil
  end
end
