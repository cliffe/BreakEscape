module BreakEscape
  module PlayerPreferencesHelper
    # Returns the in_game_name to display in the form. Falls back to the
    # player's handle when the name is blank or the generic 'Zero' default
    # (meaning a custom name has never been set).
    def suggested_in_game_name(preference)
      name = preference.in_game_name
      if (name.blank? || name == 'Zero') && current_player.respond_to?(:handle) && current_player.handle.present?
        BreakEscape::PlayerPreference.sanitise_name(current_player.handle)
      else
        name
      end
    end

    # Validation messages for one field of the preference form, for display next to it.
    def preference_field_errors(preference, field)
      label = field == :in_game_name ? 'Code name' : field.to_s.humanize
      preference.errors[field].map { |msg| "#{label} #{msg}" }
    end

    # Menu label for a sprite key; the _v2 suffix is an asset detail, not part of the name.
    def sprite_label(sprite)
      sprite.delete_suffix('_v2').humanize
    end

    # Tooltip for an avatar menu card (an AvatarUnlocks.menu row).
    def avatar_card_title(entry)
      missions = Array(entry['missions'])
      case entry['status']
      when 'locked'
        missions.any? ? "Complete #{missions.to_sentence(two_words_connector: ' or ', last_word_connector: ', or ')} to unlock" : 'Locked'
      when 'unlocked'
        missions.any? ? "Unlocked by completing #{missions.to_sentence}" : nil
      when 'mission' then 'Available in this mission'
      end
    end

    # 'This mission' only tells cards apart when the mission picks some characters
    # out of the menu; when every card carries it (no validSprites), it is noise.
    def avatar_badge(entry, menu = nil)
      return nil if entry['status'] == 'mission' && menu && menu.all? { |e| e['status'] == 'mission' }

      { 'unlocked' => 'Unlocked', 'mission' => 'This mission' }[entry['status']]
    end

    def sprite_headshot_path(sprite)
      "/break_escape/assets/characters/#{sprite}_headshot.png?v=#{BreakEscape::ASSETS_VERSION}"
    end
  end
end
