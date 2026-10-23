module BreakEscape
  class ApplicationController < ActionController::Base
    protect_from_forgery with: :exception

    # Include Pundit if available
    include Pundit::Authorization if defined?(Pundit)

    # Helper method to get current player (polymorphic)
    def current_player
      if BreakEscape.standalone_mode? || !respond_to?(:current_user, true)
        # Standalone mode or no current_user available - get/create demo user
        @current_player ||= DemoUser.first_or_create!(handle: 'demo_player')
      else
        # Mounted mode - use Hacktivity's current_user
        current_user
      end
    end
    helper_method :current_player

    # Tell Pundit to use current_player as the user for authorization
    def pundit_user
      current_player
    end

    # Handle authorization errors
    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

    private

    def user_not_authorized
      # Do NOT redirect to request.referrer — when this handler fires inside an
      # iframe (e.g. the vm_panel endpoint), the referrer is the game's own show
      # page, which would cause the game to reload inside the iframe.
      #
      # Use main_app.root_path when mounted so we leave the engine entirely —
      # redirecting to engine root_path would loop back to missions#index.
      safe_root = respond_to?(:main_app) ? main_app.root_path : '/'
      respond_to do |format|
        format.html { redirect_to safe_root, alert: 'You are not authorized to perform this action.' }
        format.json { render json: { error: 'Not authorized' }, status: :forbidden }
        format.any  { head :forbidden }
      end
    end
  end
end
