module BreakEscape
  # R2 N3: every /log_rows answer of the classes that include it is scanned for the game's secrets. The scan
  # reads the text cells of the parsed answer (title and each row's event, as, where, result, detail),
  # never a row id, `rev` or `elapsedMs` (hex digits that a short PIN could match by chance); a refusal
  # has no cells, so its whole body is scanned.
  module LogRowsBodyScan
    def read_log_rows(object_id, params = {})
      get game_path('log_rows'), params: { object_id: object_id }.merge(params), as: :json
      assert_body_holds_no_secret(Game.find(@game.id), response.body)
      response.parsed_body
    end

    def assert_body_holds_no_secret(game, body)
      parsed = JSON.parse(body) rescue nil
      texts = if parsed.is_a?(Hash) && parsed['rows'].is_a?(Array)
        parsed['rows'].flat_map { |row| row.values_at('event', 'as', 'where', 'result', 'detail') } << parsed['title']
      else
        [body]
      end
      secrets = OpsLog.compared_secrets(game).map(&:to_s).reject(&:empty?)
      secrets.each do |secret|
        assert texts.none? { |text| text.to_s.include?(secret) }, 'a response body of /log_rows holds a secret'
      end
    end
  end
end
