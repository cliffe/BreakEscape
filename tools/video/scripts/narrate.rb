#!/usr/bin/env ruby
# frozen_string_literal: true

# Voice a trailer edit's "vo" cues with Gemini TTS (not a game line: no tts_cache).
#
#   GEMINI_API_KEY=... ruby tools/video/scripts/narrate.rb tools/video/edits/ca12_trailer_r3.json \
#     --voice Sulafat --style "A calm, warm British presenter..." --ids v1,v10,v11 --out DIR
#
# Writes <id>.mp3 and <id>.json (text, voice, style, language, model, generated) per cue.
# Skips a cue whose mp3 and sidecar already match text, voice and style. The style goes in a
# speech_metadata annotation, never in the text. A 429 stops the run (exit 3). The key is read
# from the environment and never printed.

require "json"
require "net/http"
require "base64"
require "optparse"
require "fileutils"
require "open3"
require "date"

MODEL = "gemini-3.8-flash-tts"
URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
LANGUAGE = "en-GB"

opts = { language: LANGUAGE }
parser = OptionParser.new do |o|
  o.banner = "Usage: narrate.rb EDIT.json --voice NAME --style TEXT --out DIR [--ids a,b] [--language en-GB]"
  o.on("--voice NAME") { |v| opts[:voice] = v }
  o.on("--style TEXT") { |v| opts[:style] = v }
  o.on("--ids LIST") { |v| opts[:ids] = v.split(",").map(&:strip) }
  o.on("--out DIR") { |v| opts[:out] = v }
  o.on("--language CODE") { |v| opts[:language] = v }
end
parser.parse!
edit_path = ARGV.shift
abort parser.help unless edit_path && opts[:voice] && opts[:out]

key = ENV["GEMINI_API_KEY"].to_s
if key.empty?
  warn "GEMINI_API_KEY is not set; stopping."
  exit 2
end

cues = JSON.parse(File.read(edit_path)).fetch("vo", [])
cues = cues.select { |c| opts[:ids].include?(c["id"]) } if opts[:ids]
missing = (opts[:ids] || []) - cues.map { |c| c["id"] }
abort "Unknown cue ids: #{missing.join(', ')}" unless missing.empty?
FileUtils.mkdir_p(opts[:out])

def synthesise(key, text, voice, style, language)
  content = { type: "text", text: text }
  content[:annotations] = [{ type: "speech_metadata", style: style }] if style && !style.empty?
  body = {
    model: MODEL,
    input: [{ type: "user_input", content: [content] }],
    response_format: { type: "audio", mime_type: "audio/l16", sample_rate: 24_000 },
    generation_config: { speech_config: [{ voice: voice, language: language }] }
  }
  uri = URI("#{URL}?key=#{key}")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.open_timeout = 15
  http.read_timeout = 90
  req = Net::HTTP::Post.new(uri)
  req["Content-Type"] = "application/json"
  req.body = body.to_json
  res = http.request(req)
  if res.code == "429"
    warn "429 quota/rate limit from Gemini; stopping."
    exit 3
  end
  unless res.is_a?(Net::HTTPSuccess)
    warn "Gemini error #{res.code}: #{res.body.to_s[0, 300].gsub(key, '[key]')}"
    return nil
  end
  part = Array(JSON.parse(res.body)["steps"]).flat_map { |s| Array(s["content"]) }.find { |p| p["type"] == "audio" }
  part && part["data"] ? Base64.decode64(part["data"]) : nil
end

failed = []
cues.each do |cue|
  id = cue["id"]
  text = cue["text"]
  mp3 = File.join(opts[:out], "#{id}.mp3")
  side = File.join(opts[:out], "#{id}.json")
  if File.exist?(mp3) && File.exist?(side)
    old = JSON.parse(File.read(side)) rescue {}
    if old["text"] == text && old["voice"] == opts[:voice] && old["style"] == opts[:style]
      puts "skip #{id} (unchanged)"
      next
    end
  end
  pcm = synthesise(key, text, opts[:voice], opts[:style], opts[:language])
  unless pcm
    failed << id
    warn "no audio for #{id}"
    next
  end
  tmp_pcm = "#{mp3}.pcm"
  tmp_mp3 = "#{mp3}.tmp.mp3"
  File.binwrite(tmp_pcm, pcm)
  _o, err, st = Open3.capture3("ffmpeg", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tmp_pcm,
                               "-codec:a", "libmp3lame", "-q:a", "2", tmp_mp3)
  File.delete(tmp_pcm) if File.exist?(tmp_pcm)
  unless st.success?
    warn "ffmpeg failed for #{id}: #{err.lines.last}"
    failed << id
    next
  end
  File.rename(tmp_mp3, mp3)
  File.write(side, JSON.pretty_generate(
    id: id, text: text, voice: opts[:voice], style: opts[:style], language: opts[:language],
    model: MODEL, generated: Date.today.iso8601
  ) + "\n")
  puts "wrote #{mp3}"
end
exit(failed.empty? ? 0 : 1)
