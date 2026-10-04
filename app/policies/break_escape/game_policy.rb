module BreakEscape
  class GamePolicy < ApplicationPolicy
    def show?
      # Owner or admin/account_manager
      owner? || user&.admin? || user&.account_manager?
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

    def new_session?
      show?
    end

    def vm_panel?
      (owner? || user&.admin? || user&.account_manager?) &&
        record.status == 'in_progress'
    end

    def vm_set_panel?
      (owner? || user&.admin? || user&.account_manager?) &&
        record.status == 'in_progress'
    end

    class Scope < Scope
      def resolve
        if user&.admin? || user&.account_manager?
          scope.all
        else
          scope.where(player: user)
        end
      end
    end

    private

    # The same test as record.player == user, on the foreign key, so checking
    # a request doesn't load the player's row (every sync_state is checked).
    def owner?
      user.is_a?(ActiveRecord::Base) &&
        record.player_type == user.class.polymorphic_name && record.player_id == user.id
    end
  end
end
