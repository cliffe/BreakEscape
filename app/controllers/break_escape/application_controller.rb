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

    # Where a game's page is: the host's own address when it has one (BreakEscape.configuration.game_page_path),
    # else the engine's game_path. game is a Game or a game id; query becomes the query string.
    def game_page_path_for(game, query = {})
      record = game.is_a?(::BreakEscape::Game) ? game : ::BreakEscape::Game.find_by(id: game)
      path = host_game_page_path(record)
      path ||= game_path(record || game)
      query.present? ? "#{path}?#{query.to_query}" : path
    end
    helper_method :game_page_path_for

    private

    # the host's path for this game, or nil (no hook, no answer, a hook that fails, or not a local path)
    def host_game_page_path(game)
      hook = BreakEscape.configuration&.game_page_path
      return nil unless hook && game

      path = hook.call(game)
      path.is_a?(String) && path.match?(%r{\A/(?![/\\])}) ? path : nil
    rescue StandardError => e
      Rails.logger.warn "[BreakEscape] game_page_path hook failed for game #{game&.id}: #{e.message}"
      nil
    end


    # Links a host game shell asks the in-game menu and success screen to use
    # (BreakEscape.configuration.shell_links). Empty when there is no hook, the
    # hook returns nil, or it fails: the game then keeps its own defaults.
    def shell_links_for(game)
      hook = BreakEscape.configuration.shell_links
      links = hook&.call(game)
      links.is_a?(Hash) ? links.symbolize_keys.slice(:menu_url, :return_url, :return_label, :walkthrough_url, :icon_url, :manifest_url).compact : {}
    rescue StandardError => e
      Rails.logger.warn "[BreakEscape] shell_links hook failed for game #{game.id}: #{e.message}"
      {}
    end

    # How the host's game shell wants the character picker drawn when it was opened from
    # a shell page (BreakEscape.configuration.shell_picker). Nil when there is no hook, no
    # return_to, the host doesn't recognise it, or the hook fails.
    def shell_picker_for(return_to)
      hook = BreakEscape.configuration.shell_picker
      return nil unless hook && return_to.is_a?(String) && return_to.present?

      # a hook that takes a second argument is also told who is asking (the host's own page rules)
      picker = hook.arity == 1 ? hook.call(return_to) : hook.call(return_to, current_player)
      return nil unless picker.is_a?(Hash)

      picker = picker.symbolize_keys
      # Back goes to a path on this site only: one leading slash (not "//host" or "/\\host")
      back = picker[:back_url]
      back.is_a?(String) && back.match?(%r{\A/(?![/\\])}) ? picker : nil
    rescue StandardError => e
      Rails.logger.warn "[BreakEscape] shell_picker hook failed for #{return_to.inspect}: #{e.message}"
      nil
    end

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
