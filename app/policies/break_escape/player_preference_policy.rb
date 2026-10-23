module BreakEscape
  class PlayerPreferencePolicy < ApplicationPolicy
    def show?
      # All authenticated players can view their preferences
      player_owns_preference?
    end

    def update?
      # All authenticated players can update their preferences
      player_owns_preference?
    end

    private

    def player_owns_preference?
      return false unless user

      # Check if user owns this preference record
      record.player_type == user.class.name && record.player_id == user.id
    end
  end
end
