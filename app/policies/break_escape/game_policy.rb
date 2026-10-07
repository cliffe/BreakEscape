module BreakEscape
  class GamePolicy < ApplicationPolicy
    def show?
      # Owner, admin, or an account_manager who manages the player (same org when the
      # host has orgs)
      record.player == user || user&.admin? || managing_account_manager?
    end

    def update?
      show?
    end

    def scenario?
      show?
    end

    def ink?
      show?
    end

    def bootstrap?
      show?
    end

    def sync_state?
      show?
    end

    def update_room?
      show?
    end

    def unlock?
      show?
    end

    def inventory?
      show?
    end

    def room?
      show?
    end

    def objectives?
      show?
    end

    def complete_task?
      show?
    end

    def skip_task?
      show?
    end

    def conclude_mission?
      show?
    end

    def update_task_progress?
      show?
    end

    def unlock_objective?
      show?
    end

    def container?
      show?
    end

    def submit_flag?
      show?
    end

    def tts?
      show?
    end

    def reset?
      show?
    end

    # Creates a game for, and abandons the game of, the current player, so only the
    # owner may do it. Staff can view other players' games but not spawn sessions.
    def new_session?
      user.present? && record.player == user
    end

    def vm_panel?
      show? && record.status == 'in_progress'
    end

    def vm_set_panel?
      show? && record.status == 'in_progress'
    end

    private

    # An account_manager only manages players in their own org. Hosts without orgs
    # (standalone demo users have no org_id) keep the old behaviour of managing everyone.
    def managing_account_manager?
      return false unless user&.account_manager?
      return true unless user.respond_to?(:org_id)

      user.org_id.present? && record.player.respond_to?(:org_id) && record.player.org_id == user.org_id
    end

    class Scope < Scope
      def resolve
        if user&.admin?
          scope.all
        elsif user&.account_manager?
          if user.respond_to?(:org_id)
            return scope.where(player: user) if user.org_id.blank?

            same_org = user.class.where(org_id: user.org_id).select(:id)
            scope.where(player_type: user.class.name, player_id: same_org)
          else
            scope.all
          end
        else
          scope.where(player: user)
        end
      end
    end
  end
end
