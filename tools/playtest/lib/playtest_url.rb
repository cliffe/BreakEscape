# The URL lines new-game.rb prints for a fresh game. The game is played on the
# caller's own keyless server, named by PLAYTEST_PORT. With no port set there is
# no URL= line: a guessed :3000 would point at the user's own server, which
# playtests never touch. The path is printed so the caller can add its own port.
module PlaytestUrl
  module_function

  def lines(game_id, port)
    path = "/break_escape/games/#{game_id}"
    port = port.to_s.strip
    if port.match?(/\A\d+\z/)
      ["URL=http://127.0.0.1:#{port}#{path}"]
    else
      ["URL_PATH=#{path}",
       'URL_NOTE=PLAYTEST_PORT is not set, so no URL is printed. Set it to your own keyless ' \
       "server's port (3400-3499 for agents); never open :3000."]
    end
  end
end
