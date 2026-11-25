# frozen_string_literal: true

module BreakEscape
  # S8b unit 13: POST /games/:id/helpdesk/request. The route only checks the shape of the request
  # (checks 1 of the contract) and hands the rest to Game#request_helpdesk!. Every answer is
  # no-store, and no answer or error here carries the typed username, an answer or a secret.
  module HelpdeskActions
    extend ActiveSupport::Concern

    HELPDESK_MAX_BODY_BYTES = 4 * 1024
    HELPDESK_MAX_PC_ID = 64

    included do
      # Before set_game, whose params[:id] parses the whole body: the size is read from the header
      prepend_before_action :refuse_oversized_helpdesk_body, only: [:helpdesk_request]
    end

    # POST /games/:id/helpdesk/request
    # desk_id, username, what (non-empty strings), answers (absent or a map of strings), pc_id
    # (absent or a string of at most 64 characters).
    def helpdesk_request
      authorize @game if defined?(Pundit)

      response.headers['Cache-Control'] = 'no-store'
      desk_id, username, what, answers, pc_id = helpdesk_request_fields
      return render_helpdesk_bad_request unless desk_id

      result = with_game_lock { @game.request_helpdesk!(desk_id, username, what, answers, pc_id) }
      render json: result[:body], status: result[:status]
    end

    private

    def refuse_oversized_helpdesk_body
      return unless request.content_length.to_i > HELPDESK_MAX_BODY_BYTES

      response.headers['Cache-Control'] = 'no-store'
      render_helpdesk_bad_request
    end

    def render_helpdesk_bad_request
      render json: { reason: 'bad_request' }, status: :bad_request
    end

    # [desk_id, username, what, answers, pc_id], or nil when anything is the wrong shape
    def helpdesk_request_fields
      desk_id, username, what = params[:desk_id], params[:username], params[:what]
      return nil unless [desk_id, username, what].all? { |v| v.is_a?(String) && !v.empty? }

      pc_id = params[:pc_id]
      return nil unless pc_id.nil? || (pc_id.is_a?(String) && pc_id.length <= HELPDESK_MAX_PC_ID)

      answers = helpdesk_answers_param
      return nil if answers.nil?

      [desk_id, username, what, answers, pc_id]
    end

    # {} when absent; a plain Hash of String => String; nil when it is not a map of strings
    def helpdesk_answers_param
      raw = params[:answers]
      return {} if raw.nil?
      return nil unless raw.is_a?(ActionController::Parameters)

      hash = raw.to_unsafe_h
      hash.values.all? { |v| v.is_a?(String) } ? hash.to_h { |k, v| [k.to_s, v] } : nil
    end
  end
end
