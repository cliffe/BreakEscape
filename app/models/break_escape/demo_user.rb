module BreakEscape
  class DemoUser < ApplicationRecord
    self.table_name = 'break_escape_demo_users'

    has_many :games, as: :player, class_name: 'BreakEscape::Game'
    has_one :preference, as: :player, class_name: 'BreakEscape::PlayerPreference', dependent: :destroy

    validates :handle, presence: true, uniqueness: true

    # Mimic User role methods
    def admin?
      role == 'admin'
    end

    def account_manager?
      role == 'account_manager'
    end

    # Ensure preference exists
    def ensure_preference!
      create_preference! unless preference
      preference
    end
  end
end
