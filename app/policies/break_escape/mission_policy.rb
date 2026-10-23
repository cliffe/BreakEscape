module BreakEscape
  class MissionPolicy < ApplicationPolicy
    def index?
      # In standalone mode the mission listing is the entry point for players.
      # When mounted in a host app (e.g. Hacktivity), games are reached through
      # host events (game_slots), so the listing is an admin-only config page.
      BreakEscape.standalone_mode? || user&.admin? || user&.account_manager?
    end

    def show?
      # Published missions or admin
      record.published? || user&.admin? || user&.account_manager?
    end

    def create_game?
      # Anyone authenticated can create a game for a mission they can view
      user.present? && show?
    end

    class Scope < Scope
      def resolve
        if user&.admin? || user&.account_manager?
          scope.all
        elsif BreakEscape.standalone_mode?
          scope.published
        else
          # Mounted mode: non-admins have no business querying mission scope
          # directly — access is via host app game_slots.
          scope.none
        end
      end
    end
  end
end
