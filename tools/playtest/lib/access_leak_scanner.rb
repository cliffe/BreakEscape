# frozen_string_literal: true

require 'json'
require 'set'
require 'cgi'
require 'time'
require 'uri'
require_relative '../../../lib/break_escape/author_notes' unless defined?(BreakEscape::AuthorNotes)
require_relative '../../../lib/break_escape/crack_difficulty' unless defined?(BreakEscape::CrackDifficulty)
require_relative '../../../lib/break_escape/credential_model' unless defined?(BreakEscape::CredentialModel)
require_relative '../../../lib/break_escape/hiding_spots' unless defined?(BreakEscape::HidingSpots)
require_relative '../../../lib/break_escape/realism_catalog' unless defined?(BreakEscape::RealismCatalog)

# Checks the responses a playtest captured (playtest-session.js --capture-responses) for
# access model secrets that should never have reached the browser
# (docs/achitechture/ACCESS_MODEL_PLAN.md, section 5.6 and step 6).
#
# The secrets come from the game's own scenario data, so the tester never sees them:
#
# - every room NPC's creds.password;
# - the names and texts of every item under a sign-in PC (lockType "login"), under an
#   account profile, or inside a container the scenario authors as locked.
#
# It reports:
#
# - a password anywhere in any response body, except inside an object whose authored text
#   holds it on purpose (a note or postitNote: a deliberate clue), and except a
#   /capture_secrets answer for an NPC with a capture route in a scenario that sets
#   social.captures.revealSecret. With served_npcs given (the game's own answer to "whose
#   password would GET /capture_secrets serve now", which applies its capture proofs), the
#   exception covers only those NPCs;
# - the content of a sign-in PC or profile item in any response other than
#   GET /container/:id for that PC (any sign-in PC, for a profile item) or a folder inside it;
# - the content of a locked container in a response that still marks that container
#   locked: true.
#
# Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6) add secrets: every
# network name; every resource name, host and observations; the names and texts of the
# items under resources (file share contents). It reports:
#
# - a share item's content anywhere but a GET /container/:id answer for that resource or a
#   folder in it (once served that way, the item may follow into the inventory);
# - a password a share item holds on purpose (a letter, a handover note) is a deliberate clue
#   only by the same rule: in that answer, or after the item has been served that way.
#   Anywhere else it is reported as a password, like any other;
# - a network or resource string in any response other than GET /network, a /network/*
#   answer, a /container answer, the contents of an /unlock answer, or the footholds block
#   of GET /scenario. There is no exception for an NPC's work plan. The /container and
#   /unlock exemptions cover every network string (network name, resource name, host,
#   observations), not only hosts: both serve a container's authored contents, which the
#   server releases only by its own rules, so what that text names is a scenario choice.
#
# Matching of these network strings: a string of six or more characters is matched as a
# substring; a shorter one only as a whole JSON string value; one under three characters is
# ignored; and a string that also appears somewhere public (a room, door sign, object or NPC
# name, or any other text room data ships as authored) is not a secret and is skipped.
#
# Pages (engine plan section 6): a row with a "dom" key instead of a body is the text of a
# page the tester read (the capture log device, a captures terminal), labelled by its "label".
# It is checked for passwords like a /capture_secrets answer, since that is all such a page shows.
#
# Award facts (S7 review R2-L1, rule `fact_unearned`): the entry, label or text of an intel fact an item (revealsFacts) or a
# flag reward (grant_fact) awards is a finding anywhere until a 200 answer grants it, in the server's own place and shape:
# the top-level `facts` of an inventory answer (item facts), a grant_fact reward's `entry`, a give_item reward's `facts`.
# After the grant the bootstrap's social.intelFacts may hold it, and its text or label may appear in any string. An entry
# in a hash keyed by the fact's id anywhere else is a finding even when earned. Given a game, a fact it has not earned (earned_fact_ids at the end of the
# run) is a finding at every place; without a game the scanner cannot tell earned from unearned, so only the place, the
# shape and the order are judged (a grant is taken from the answer itself). Feed facts keep the feed rules. Limit: the
# earned set is read once, at the end of the run.
#
# Slice 9.1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, section 6) adds two exceptions and one finding:
#
# - the note: a GET /login_accounts answer may hold a password at $.postitNote and nowhere
#   else in its body, when the PC its own pc_id names has an owner the game says
#   written_down? (so the scanner is handed the game, not only its scenario data). The
#   exception covers that password value in that answer, whoever else shares it;
# - the saved copy: the same value inside savedNotes, only after an earlier response line
#   (in any file given, in the order given) was a /login_accounts answer that carried it;
# - withheld keys: any NPC record (a hash with an npcType key, or an element of an array
#   under a key named npcs) with a creds, role, awareness, habits or workarounds key.
#   social.characters entries and the social.awareness block are not NPC records.
#
# Slice 9.2 sub-slice B (ACCESS_MODEL_SLICE_9_2_PLAN.md 11): every authored workaround is a
# secret until the server hands it over. A hash whose `do` is a workaround's kind beside that
# workaround's own target (`door`, `prop`, `event`, `pc` or `with`) is reported anywhere but
# where the server hands one over: a `run` or a `pending` entry (every unspent hand-over, B review
# R3 m2) in a POST /npc_frustration answer, and the `pending` and `done` lists of GET /scenario's
# npcFrustration. A password in a
# /npc_workaround answer is reported by the password rule, with one exception (sub-slice H,
# plan 6.5): a heard share_login answer `{ capture, line, note, displayName }` may hold the
# sharer's own password at $.line and $.note, when that NPC authors a share_login and the game
# (it must be given) lists it in sharedLogins; at $.capture.note too only where the scenario's
# social.captures.revealSecret is on (review R1 m3). After such an answer the same value is
# allowed inside savedNotes, and inside the se_captures global only under revealSecret. The note exception
# above follows a done writes_down through the game's written_down?.
#
# Slice 9.2 sub-slice L (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.6 and 9.2): no list of locked-out
# accounts ever reaches the browser. It reports (rule `lockout_list`) a `loginLockouts` or
# `loginFailures` key in any response, and a `lockedOut` list anywhere but GET /scenario's
# `$.npcFrustration.<npcId>.lockedOut`. With the game given it also reports (rule
# `lockout_unrecorded`) a PC in that list, or a `lockedOut: true` in a POST /npc_frustration
# answer, for an NPC whose saved npcFrustration record does not hold it: the browser learns of a
# lockout only through the server's own `check` record.
# Review R1 m4 widened `lockout_list` to a boolean `lockedOut` outside POST /npc_frustration and
# POST /login, and (with the game given) any string holding one of the game's loginLockouts or
# loginFailures keys ("pcId|username"), whatever key it sits under. R1 M1 allows one more field:
# GET /scenario's `$.lockoutPcs`, the sign-in PCs where the player caused a lockout, PC ids only;
# a `lockoutPcs` anywhere else, or an entry in it that is not such a PC, is reported.
# Review R2 n3: the key rule reads hash keys as well as strings (a key under another name, such
# as an attempts map, is reported at its parent's path, so the finding never names the username).
# Its one limit: the game's lockouts and failures are read once, at scan time, from the state at
# the end of the run, so a response that listed a PC before the player locked it out passes.
# R2 n4: a key whose username part is blank ("pc|") is skipped, since it would match any string
# naming that PC.
#
# The USB habit's stick (USB habit code review R2 m2): the files on a habit NPC's stick, authored
# or the default work_file.txt, are served only to a player who holds it. Their names and texts are
# secrets (rule `stick_content`) anywhere but a GET /container/:id answer for that stick or a folder
# on it, or the contents of an /unlock answer, and they are never public room strings.
# Its limits (review R3 n2): the scanner cannot tell whether the player held the stick when an
# answer was served, so files served for a stick still with its NPC or lying on the floor pass,
# and so would an /unlock answer for some other object that carried them (it does not know an
# /unlock answer's target). The held check is the server's, and the controller tests cover it
# (usb_habit_test.rb: a stick the player does not hold, a forged inventory entry, the floor 422
# and 404). Once served, a file is legitimate for the rest of the run, as for every content
# class; files shorter than MIN_CONTENT_LENGTH and fields other than name, text and content (a file's
# observations) are not checked, as for every item. A stick string that another secret also
# carries (a sign-in PC's, a profile's or a share's file of the same name, review R3 n3) is left
# to that secret, since the other file's own answer would otherwise be reported as the stick's.
#
# Scenario format hardening step 3 (SCENARIO_FORMAT_HARDENING_PLAN) adds the non-account capture
# secrets (rule `capture_secret`): the `secret` on an add_capture action, an addCapture mapping or a
# non-account NPC's usePayload, keyed by its target id. The server serves these only through GET
# /capture_secrets once the capture is earned, so the value is reported anywhere else, with the same
# exception /capture_secrets and a capture page already carry (the account-password rule). Account
# capture secrets are an NPC's creds.password and stay with the password rule.
#
# Ops core S1 (OPS_CORE_PLAN.md 11.4, `collect_ops_secrets`): what a discovery network and a host's
# services keep from the browser until the step that earns them. Rule `ops_string`. Each string is
# tagged with its step: `sweep` (a host's name, a share's name and host label on a discovery network,
# an address on a discovery network: earned by that network's sweep, or for a sign-in host by a held
# session shown on its row), `scan` (a service's product, version and label, and a service's authored
# `cli` service word and banner: earned by that host's scan) and `listed` (a network's `cli.range` and
# an address on an open network: a leak only in an answer that is not a /network answer, or before the
# first GET /network answer that shows the network's block or lists the row). The earned steps are read
# from the log itself, in order (a POST /network/scan answer with `network.id` or `host.id`), and
# `scan(lines, ops_steps: [...])` takes more ("sweep:<network>", "scan:<host>", "listed:<network>",
# "listed:<host>", "held:<host>").
#
# Ops core S2 (N14) adds three tags. `check` (a finding's summary, class and severity, its id and the id
# part an author chose, and the strings of the catalog entry its `realism` link names, read through
# BreakEscape::RealismCatalog): earned by a successful POST /network/check answer for that host and
# service ("check:<host>.<service>"). `confirm` (a decoy's `falseBecause`; a real finding's need labels,
# `needs.label`, a credential's label and an item's name): earned by a successful POST /network/confirm
# answer for that finding ("confirm:<finding id>"). `never` (a `realism` link id; the `module` of every
# catalog entry the scenario does not link, and every linked entry's `_` note; the name of a global used
# in `needs.global` or `fixedIf`, as a string value; keys are never judged): a leak in any answer at
# any stage. Steps are earned only from the real routes' successful answers or the caller's `ops_steps`,
# never from the answer being judged. A class or severity word counts only as the value of a `class` or
# `severity` key. `catalog_folder:` names another catalog folder (tests). A structural rule (R3-1) also
# reports a `services` key, or `scanned: true`, on a hash whose id is a known host before that host's
# scan, so a service's `name` and `port` are covered without a distinctive string.
# Addresses and ranges match as whole tokens (not inside a longer number); a `service` word counts
# only when it equals no other service's `service` word or `name`.
#
# Ops core S3 (N15), steps earned PER THING (R2 N-13-1, N-13-2): `card:<technique id>` and `card_item:<item id>` (a
# held card item), `granted:credential:<finding id>` (a credential grant releases only the strings owned by that
# finding), `session:<pc id>`, `through:<pc id>:<foothold id>` and `admin:<pc id>` (a session grant, judged against
# the host a row or answer is about, found from its own `id` or a map key that is a host id). A technique answer does
# not name its finding, so it is taken from the request when the capture holds it (`row['tech']['findingId']`, a
# recorder tag that does not exist yet) and otherwise read from the answer (the grants of that kind, for a session
# the account, host label and level; narrowed to findings confirmed in the log and not granted yet). Where that does
# not leave exactly one finding, nothing is earned (fail closed) and `ops_steps: ["granted:credential:<id>", ...]`
# names the step. A new session at a host takes the earlier foothold and admin step for that host back.
#
# Ops privilege S5a unit 16 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md), steps earned PER PC like the S3 ones. `access: "admin"` on a
# session answer, a mirror entry or a host row is earned a second way: a successful sign-in answer (POST /login, typed or
# keyring) for an account the scenario marks `creds.admin: true` and that PC admits earns `admin:<pc id>`. The PC is named by
# the answer's `host` label (a remote sign-in; a label that names no PC earns nothing and never falls through to a guess), else by
# the one PC that admits the account. A browser capture holds neither the request body nor a PC id in a keyboard sign-in
# answer (no recorder tags it), so where more than one PC admits the account nothing is earned (fail closed) and
# `scan(lines, signins: ["<account id>@<pc id>#<n>"])` (`access-leak-check.rb --signin`) names the PC of ONE sign-in: the
# account's n-th successful POST /login answer in the log (or `<account id>@<pc id>@<row time>`, the row's `t`), credited from
# that row only and for that account only. `ops_steps` cannot name an admin session.
# Session ends take the step and the account back (R2-C2): a later sign-in at that PC, a successful POST /lock_session (no
# `pcId` ends every PC), a PC in an answer's `endedPcIds` (a displacing grant, claim or hand-back that names it), a 403 desktop
# answer (off, not_responding, expired, no_session), a bootstrap whose `sessions` map lacks the PC or holds it locked, for
# another account, or WITHOUT `access: "admin"` (the step only; R3-C3), and a successful POST /logout (every PC: the answer does
# not say which, unless a `logouts: ["<account id>@<pc id>#<n>" | "<account id>@<pc id>@<row time>"]` entry (`--logout`) names that one
# row's PC and the run holds that account there: it then ends that PC only; an entry that does not hold is unused, exit 2). Also, from data already in the log (R3 check 2): a token sign-in's `expiresInS` plus its row time is a deadline
# after which the step and account are gone; a `GET /network` host row of a sign-in PC with no `session` (step and account) or a
# `session` without `access: "admin"` (step), and a 200 desktop answer with no session, another account's, or no admin access, take
# it back. A 200 answer never RESTORES a step. The one way back after a power cut (the session survives it: the desktop opens with
# no sign-in) is `resumes: ["<account id>@<pc id>@<row time>"]` (`--resume`), ONE 200 desktop row after a 403 `off` or
# `not_responding` at that PC, or after ONE answer that showed the held account's session at that PC without `access: "admin"` (a
# bootstrap, a `GET /network` host row of that username, a 200 desktop row: what an off PC shows; a real client sends no request while
# the PC is off, so no 403 exists), whose session is the account held then, with no other end in between (R3-B1). Entries that
# match nothing are in `unused_entries`. A named sign-in of an account at a PC that does not admit it raises ArgumentError (R3-C1).
# Not shown by any answer, so not tracked: a token running out or a power cut with no network view, desktop or bootstrap answer
# before the leaking request, and a hand-back that names no PC in `endedPcIds`. The ADMIN_READ rule counts one
# earned read per profile and PC, so two admin accounts reading one profile at one PC earn one (a false alarm, fail closed).
# Structural rules (rule `ops_string`): the key `admin` inside any NPC record or
# `creds` object is a leak wherever it appears (`ops:key:admin`); an item of an account profile in a GET /container answer is
# a leak (rule `profile_admin_read`) unless the session held there is of an account the profile's `for` admits, or `admin:<pc>`
# is earned at a PC whose OWNER the profile admits (a folder answer names no PC: any such session will do); an ADMIN_READ row
# in a /log_rows answer is a leak (rule `log_row`, owner `log:admin_read:<pc id>`) unless a successful admin read of a profile
# at that PC earned `admin_read:<profile id>@<pc id>` earlier in the run (one earned read per row). These rules run only in a scenario that has an admin account
# or an admin session grant (the keyboard-desktop owner fallback in `ops_session_owner` too), so a log of an older scenario is judged as before.
#
# Ops log reader L2a R2 S6 (OPS_LOG_ROWS_PLAN.md section 7 and 11, `scan_log_rows`): rule `log_row`, for
# a GET .../log_rows answer. The IDENTITY cell of a SIGN_IN row is the player's own typed text and is
# not judged by any rule. Findings: a key the answer or a row may not carry (a row has exactly id,
# elapsedMs or at, event, as, where, result, detail; the answer only rev, title, rows, unchanged,
# success, reason; seq, serverMs, flagged and the other stored-only keys nowhere), a registered log
# secret (`BreakEscape::OpsLog.compared_secrets(game)`, or `log_secrets:`) in a text cell, and a raw
# scenario id (room, object, NPC or card id) as a cell or a detail value where no authored name equals it.
#
# R4-1 and R4-2: a stored-only key is found as a word before `:` or `=` in a detail string, and the
# hidden detail keys of the registry join the hand list.
#
# Ops S7 (hash records and the offline cracker, `scan_crack`), rules `crack_key`, `crack_row`, `crack_answer` and
# `crack_unearned`, all structural and failing closed (a proof that is missing, ambiguous or malformed is a finding):
# - keys the browser never gets, wherever they sit: crack, passwordPattern, passwordDifficulty, earnedFacts, crackRuns,
#   crackStarted, crackedAccounts; `facts` on a credential-shaped hash; `difficulty` on any hash that is not a lock
#   (a door or object lock, the one public use of the word, is told by its own lockType, locked, keyPins, requires or
#   dustable); `crackFacts` only as the top-level list of a GET /keyring answer that lists a hash row, of ids that name an
#   intel fact, none `se_intel_` prefixed, and (given the game) all in its earned set;
# - a `kind: "hash"` hash only as an element of a GET /keyring answer's entries, with the keys of the server's row, a
#   registry source, a status word, `readyInSeconds` only on running, the token shape and the account block, and never a
#   password, routes or connectsTo; a keyring answer's `readyInSeconds` map holds whole seconds for registry hash ids;
# - every POST /crack answer has exactly the keys of its status (a running answer carries nothing but the wait: no
#   account, no credential id, no miss or hit word) and the refusal codes of the route with their HTTP status;
# - a `source: "cracked"` keyring entry, and the password on it, only in a GET /keyring answer after a 200 POST /crack
#   answer of the exact shape `{ success: true, status: "cracked", accountId, credentialIds }` named that account (the
#   account itself, or, in the same answer, another account with an equal password and a hash record of its own), the
#   entry being `<npc>.cracked` with the keys of the server's row and that account's own password. The password is
#   allowed at that one path and nowhere else. The earned set starts empty each scan and grows only from such answers.
#
# A finding names the rule, the route, the response line and the secret's owner (an NPC or
# item id), never the value. Every output line is checked against the secret values before it
# is returned, so blind runs can use it too.
#
# Usage (see tools/playtest/access-leak-check.rb):
#
#   scanner = AccessLeakScanner.new(scenario_data, game: game)   # game: optional (the note exception)
#   findings = scanner.scan(lines)   # lines: [[source_label, line_no, parsed_hash], ...]
#   scanner.report_lines(findings)
class AccessLeakScanner
  # Item fields whose strings are an item's content (its name and its text).
  CONTENT_FIELDS = %w[name text content].freeze
  # Keys under which the scenario nests further items, NPCs or objects.
  CHILD_KEYS = %w[contents itemsHeld tableItems npcs objects].freeze
  # Content strings shorter than this are too generic to tell a leak from a coincidence.
  MIN_CONTENT_LENGTH = 6
  # A password shorter than this is matched as a whole token, not as a substring.
  MIN_SUBSTRING_PASSWORD = 6
  # Network strings (network and resource names, hosts, observations, share item content):
  # this long or longer is matched as a substring, shorter only as a whole JSON string value.
  MIN_SUBSTRING_NETWORK = 6
  # Network strings shorter than this are not checked at all.
  MIN_NETWORK_STRING = 3
  # Room data keys the server withholds: their strings are not public.
  WITHHELD_ROOM_KEYS = %w[network linkName linkStoreIn creds services].freeze
  # A hash under one of these keys is a capture descriptor: its `secret` never ships (E0.3)
  CAPTURE_DESCRIPTOR_KEYS = %w[capture addCapture usePayload].freeze
  # A page the tester read counts as a capture page only when its label says so (E0.3)
  # Space, hyphen or underscore may follow or precede the word ("captures terminal", "captures-terminal", "captures_terminal");
  # \b would not split on "_"
  CAPTURE_PAGE_LABEL = /(?<![[:alnum:]])captures?(?![[:alnum:]])/i.freeze

  Finding = Struct.new(:rule, :owner, :route, :source, :line, :cmd_seq, :json_path, keyword_init: true)

  # Keys an NPC record never takes to the browser (Game::WITHHELD_NPC_KEYS).
  WITHHELD_KEYS = %w[creds role awareness workarounds].freeze
  # Slice 9.2 (9.2): the NPC keys the server withholds beside them (Game::WITHHELD_WORK_NPC_KEYS)
  WITHHELD_WORK_KEYS = %w[workNeeds frustration feed].freeze
  # Step 8c: the `habits` block ships only its allow-listed keys (Game::SHIPPED_HABIT_KEYS); any
  # other key in a shipped `habits` (locksScreen, writesDown, password, passwordPattern, holdsDoors,
  # the USB habit `usb`, or a key added later) is server-only, so it is a leak if it ships.
  SHIPPED_HABIT_KEYS = %w[screen print].freeze
  # Feed texts shorter than this are not searched for (the validator warns about them, 9.2)
  MIN_FEED_TEXT = 12

  # The capture files of one game are one log, read in the order given, so they must be given oldest
  # first. Every recorded row carries its time `t` (ISO 8601, so it sorts as text). `files` is
  # [[label, rows]]; the answer is nil when each file's earliest time is no earlier than the latest time of the
  # previous timed file (rows inside a file need not be sorted: min and max are used), otherwise a sentence naming the first pair out of order. A shell glob puts
  # responses-N-2.jsonl before responses-N.jsonl, and a log read that way reports every earlier
  # sweep, scan and check as a leak (ops core S3 PL7: 776 false findings).
  #
  # Each file's earliest time is compared with the LATEST time of the previous TIMED file, so an untimed
  # file between two timed ones hides nothing, and two captures that overlap in time (two tabs
  # recording at once, which one pass over each file in turn cannot read in time order) are refused too:
  # merge them into one file sorted by `n` and `t` first.
  def self.file_order_problem(files)
    prev = nil # [label, last time] of the last timed file
    files.each do |label, rows|
      times = Array(rows).filter_map { |r| r['t'] if r.is_a?(Hash) && r['t'].is_a?(String) }
      next if times.empty?

      lo = times.min
      hi = times.max
      if prev && lo < prev[1]
        kind = lo < prev[2] ? 'before' : 'inside the span of'
        return "#{label} starts at #{lo}, #{kind} #{prev[0]} (#{prev[2]} to #{prev[1]}): give the capture files " \
               'oldest first, one after another (captures that overlap in time must be merged into one file first)'
      end
      prev = [label, hi, lo]
    end
    nil
  end

  # The scanner judges every row against ONE game's scenario. A row whose path names /games/<n>/ for a
  # different n comes from another game (a capture file from another run): the sentence names the first
  # such file, or nil. Rows carry the game id in their path (the recorder stores the request path).
  # Rows with no /games/<n>/ path (bootstrap pages, other paths) cannot be attributed to a game, so a
  # foreign capture is caught only when it holds at least one game-path row (every real capture does);
  # one foreign row refuses the whole run.
  def self.game_mismatch_problem(game_id, files)
    files.each do |label, rows|
      Array(rows).each do |row|
        next unless row.is_a?(Hash) && row['path'].is_a?(String)

        found = row['path'][%r{/games/(\d+)(?:/|\?|\z)}, 1]
        next if found.nil? || found == game_id.to_s

        return "#{label} holds rows for game #{found}, not game #{game_id}: one run judges one game's capture files"
      end
    end
    nil
  end

  attr_reader :passwords, :items

  # served_npcs: when given, the NPC ids whose password the server would serve from
  # GET /capture_secrets now (its capture proofs applied); nil keeps the scenario-only rule.
  def initialize(scenario_data, served_npcs: nil, game: nil, catalog_folder: nil, log_secrets: nil)
    @catalog_folder = catalog_folder
    @data = scenario_data.is_a?(Hash) ? scenario_data : {}
    @log_secrets = log_secrets&.map(&:to_s)
    @served_npcs = served_npcs&.map(&:to_s)&.to_set
    @game = game
    @noted = Set.new # passwords a /login_accounts answer has carried as its note, so far
    @shared = Set.new # passwords a heard share_login answer has carried, so far (sub-slice H)
    @passwords = {}          # password => [npc_id, ...]
    @capture_npcs = Set.new  # npc ids the capture_secrets exception covers
    @capture_secrets = {}    # a non-account capture secret => [target_id, ...] (served only by /capture_secrets)
    # E0.3: a capture secret => the `proof` of each writer (nil for a writer with none). A secret
    # whose writers all carry a proof is served only once one held, so its served rows are
    # order-checked against the plant (proof_held_before?)
    @capture_secret_proofs = Hash.new { |h, k| h[k] = [] }
    # E0.3: the log's plant rows, filled by prepare_plant_rows at the start of each scan
    @plant_rows = {}
    @plant_rows_any = {}
    @log_mode = :pre
    @untagged_remove = false
    @items = {}              # item_id => { strings:, scope:, profile:, pc:, ancestors:, locked_ancestors: }
    @public_strings = Set.new
    @clue_holders = Hash.new { |h, k| h[k] = Set.new } # password => item ids holding it on purpose
    @clue_texts = Hash.new { |h, k| h[k] = Set.new }   # password => authored strings holding it
    @login_pcs = Set.new
    @network_strings = {}    # string => [owner, ...] (network:<id>, resource:<id>)
    @wifi_secrets = {}       # a Wi-Fi SSID or psk => [network:<id>, ...] (never in any response)
    @ops_global_names = {}   # global name => [owners]: judged as a JSON KEY too (scan_ops_global_keys)
    @ops_strings = {}        # string => [{ tag:, net:, host:, owner:, token: }] (ops core S1, collect_ops_secrets)
    @ops_earned = Set.new    # "sweep:<net>", "scan:<host>", "listed:<net or host>", "held:<host>", "check:<host>.<service>", "confirm:<finding>"
    @ops_host_ids = Set.new  # every host id of the scenario (the structural services rule)
    @ops_discovery_ids = Set.new # ids of the discovery networks (the unswept-block rule)
    @ops_finding_ids = Set.new # every finding id (host.service.id) of the scenario (the structural finding rules)
    @ops_gating_globals = Set.new # every global named in a `fixedIf` or `needs.global`, public or not
    @ops_techniques = {}     # technique id => registry entry (S3, the card registry)
    @ops_card_items = {}     # item id => technique id, for every item carrying a registry key in `technique_card`
    @ops_start_steps = Set.new # steps earned before the log starts: a card in the starting inventory
    @ops_grant_findings = [] # every weakness that grants (S3): { finding_id:, host_id:, host_label:, kind:, account:, access:, credential: }
    @ops_supplied = Set.new  # the steps the caller named in `ops_steps` (a held card by technique id)
    @ops_answer_pc = nil     # the host the technique answer being judged granted a session at
    @ops_host_by_label = {}  # a sign-in PC's label (`host` on a session answer) => its host id, when the label is unique
    @priv_active = false     # the scenario has an admin account or an admin session grant (S5a): the privilege rules run
    @priv_npcs = {}          # NPC id => NPC record (the accounts' ACL answers)
    @priv_admins = Set.new   # ids of the NPCs whose creds.admin is the literal true
    @priv_pcs = {}           # sign-in PC id => its object
    @priv_profiles = {}      # profile id => its `for` list
    @priv_folder_profile = {} # a folder id inside a profile => that profile's id
    @priv_signin_pc = nil    # the PC the sign-in answer being judged resolved to
    @ops_session_accounts = {} # PC id => the NPC id of the session the run's own answers last put there
    @ops_notes = []          # one line each for a `never` string the collector had to drop (shown by the leak check)
    @share_items = {}        # item_id => { strings:, resource:, ancestors: }
    @share_item_pairs = Set.new # [resource_id, item_id] for every item of every share, whether or not it holds a string
    # password => [{ label:, holder:, texts:, resource:, ancestors: }]: share items holding a
    # password on purpose, exempt only where that item's content may be (scan_passwords)
    @share_clues = Hash.new { |h, k| h[k] = [] }
    @workarounds = [] # { npc:, index:, do:, target: [key, value] }
    # Sub-slice C: feed posts and feed facts, by text; served once a /feed_post answer has
    # carried them, or a GET /scenario feedPosts block lists them within the reveals so far
    @feed_texts = {}          # text => { owner:, post: npc|post_id, fact: id or nil }
    @feed_fact_ids = Set.new
    @feed_served = Set.new    # "npc|post_id" and "fact:<id>"
    @feed_order = Hash.new { |h, k| h[k] = [] } # npc id => [[post_id, fact id or nil], ...] as authored
    @feed_ordered_ids = Hash.new { |h, k| h[k] = [] } # npc id => authored post ids with no `when` (C2 migration)
    @feed_post_key = {}       # C3: post id => "npc|post_id", the first authored owner (feed_reply_target)
    # C2: reactive posts come out of authored order, so "revealed so far" is no longer an authored
    # prefix; the scanner accumulates the ids the log shows served and falls back to the game's
    # saved reveal set (its `shown` list, or a legacy count migrated to ordered ids) only where no
    # log line names them (a resumed game, or a lost /feed_post body)
    @feed_shown = Hash.new { |h, k| h[k] = [] } # npc id => post ids the log has shown served so far
    @saved_shown = {}           # npc id => the game's saved reveal ids (new shape, or migrated)
    @feed_base = {}             # npc id => reveals made before the log starts (a resumed game)
    @feed_fallback = []         # npc ids whose base came from the game's feedRevealed
    # Review C R2 m2: /feed_post answers (200) whose body the capture could not read. Each
    # stands for at most one reveal, at its own place in the log, for an NPC the game shows
    # more reveals for than the log holds
    @feed_unknown_share = {}    # npc id => unreadable answers that may have been its reveals
    @feed_unknown_seen = Hash.new(0) # npc id => unreadable answers passed so far that may be its reveals
    @feed_at = {}               # npc id => the game's saved time of its last reveal (server seconds)
    @feed_unknown = []          # npc ids that took a reveal from an unreadable answer
    @feed_ruled_out = []        # fallback npc ids that a lost answer's npcId tag ruled out of it
    @feed_tags_ignored = false  # a readable answer's npcId tag disagreed with its body
    # Friendface reactions (FRIENDFACE_REACTIONS_PLAN.md section 9): NPCs with a served post so far,
    # and the reaction items judged (a clean verdict proves something only when this is above 0)
    @feed_posters = Set.new
    @reaction_items = 0
    collect_passwords
    collect_crack
    collect_capture_secrets
    @object_by_id = BreakEscape::AccessIdentities.room_objects(@data).each_with_object({}) do |e, h|
      id = e[:object]['id']
      h[id.to_s] ||= e[:object] if id.is_a?(String) && !id.empty?
    end
    # A plant is recorded only on a top-level room object (CaptureProofs#planted_target_object),
    # so the plant lookup ignores objects nested in contents or an NPC's itemsHeld.
    @plant_object_by_id = BreakEscape::CaptureModel.top_level_room_objects(@data).each_with_object({}) do |o, h|
      id = o['id']
      h[id.to_s] ||= o if id.is_a?(String) && !id.empty?
    end
    collect_items
    collect_network_secrets
    collect_ops_secrets
    collect_privilege
    collect_wifi_secrets
    collect_workarounds
    collect_feeds
    collect_facts
    require_game_methods
    @items.each_value { |info| info[:strings] = info[:strings].reject { |s| @public_strings.include?(s) } }
    drop_shared_stick_strings
    @items.delete_if { |_, info| info[:strings].empty? }
  end

  # Lines for the leak check's output: what an empty or narrowed rule means (M2 c).
  attr_reader :ops_notes

  def counts
    {
      passwords: @passwords.values.flatten.uniq.length,
      capture_secrets: @capture_secrets.length,
      login_items: @items.count { |_, i| i[:scope] && i[:scope] != :stick },
      stick_items: @items.count { |_, i| i[:scope] == :stick },
      locked_items: @items.count { |_, i| i[:locked_ancestors].any? },
      network_strings: @network_strings.length,
      ops_strings: @ops_strings.length,
      wifi_secrets: @wifi_secrets.length,
      share_items: @share_items.length,
      workarounds: @workarounds.length,
      # Distinct posts with a registered text; a reply with two pieces is one post, its pieces
      # counted apart in feed_texts (review C3 R1 m5)
      feed_posts: @feed_texts.values.select { |f| f[:kind] == :post }.flat_map { |f| f[:served] }.uniq.length,
      feed_texts: @feed_texts.values.count { |f| f[:kind] == :post },
      feed_facts: @feed_fact_ids.length,
      lockout_records: lockout_records.values.sum(&:length),
      # Reaction items judged by scan so far (0 before a scan)
      reaction_items: @reaction_items
    }
  end

  # NPCs whose GET /scenario feedPosts were judged partly against the game's saved feedRevealed
  # count from the log's first line, because the log holds fewer /feed_post answers than the
  # game has revealed and the unreadable answers do not account for them all (a resumed game).
  # Filled by scan.
  attr_reader :feed_fallback

  # NPCs allowed one more reveal at an unreadable /feed_post answer (review C R2 m2: a lost
  # response body), from that answer on and never before it. Filled by scan.
  attr_reader :feed_unknown

  # NPCs with first-line credit that no lost answer could cover (share 0) while at least one
  # lost answer was tagged for another NPC. Filled by scan.
  attr_reader :feed_ruled_out

  # Entries (`signins:` and `resumes:`) that matched no row, as the strings the tester gave. Filled by scan; the leak check
  # exits 2 when it is not empty (R3-C2): a typo must not look like a leak, and an entry that did nothing must not pass.
  def unused_entries
    unused = []
    (@priv_named || {}).each { |key, pc| unused << priv_entry_text(key, pc) unless @priv_used.include?([:signin, key]) }
    (@priv_resumes || {}).each_key { |key| unused << "#{key.join('@')} (--resume)" unless @priv_used.include?([:resume, key]) }
    (@priv_logouts || {}).each { |key, pc| unused << priv_logout_text(key, pc) unless @priv_used.include?([:logout, key]) }
    unused
  end

  # Whether a readable /feed_post answer's npcId tag disagreed with the NPC its body names, so
  # every tag in the log was ignored. Filled by scan.
  attr_reader :feed_tags_ignored

  # lines: [[source, line_no, hash]]. Returns findings, deduplicated per response line, rule
  # and owner (the first JSON path is kept).
  def scan(lines, ops_steps: nil, signins: nil, resumes: nil, logouts: nil)
    findings = []
    seen = Set.new
    @ops_supplied = Set.new(Array(ops_steps).map(&:to_s))
    # an admin session is earned only by a sign-in row, never by a step named for the whole run (R2-C1)
    if @ops_supplied.any? { |step| step.start_with?('admin:') }
      raise ArgumentError, 'ops_steps cannot name an admin session: use signins: ["<account>@<pc id>#<n>"] for one sign-in row'
    end
    @priv_named = parse_priv_signins(signins)
    @priv_resumes = parse_priv_resumes(resumes)
    @priv_logouts = parse_priv_logouts(logouts)
    @priv_logout_count = 0
    @priv_used = Set.new
    @priv_signin_counts = Hash.new(0)
    @priv_deadlines = {}
    @priv_resumable = {}
    @priv_kinds = {}          # pc => [via, relay] of the session that earned the held admin step (R4-2)
    @priv_logout_pending = {} # pc => account a named --logout ended, until an answer lists that PC's session state (R4-5)
    @priv_signin_pending = nil # { account:, pc: } of a named keyboard sign-in until the desktop that follows it (R4-7)
    @priv_last_named = nil
    @ops_earned = @ops_supplied | @ops_start_steps
    @crack_earned = Set.new # NPC ids a 200 POST /crack answer of the exact cracked shape named, so far (S7)
    @crack_running_credits = 0 # well formed 200 running answers not yet used by a salted grant (S7)
    @crack_running_seen = false # a well formed 200 running answer so far (R2-L4: a running row or a wait map follows one)
    @crack_runs_seen = false # a 200 nomatch answer with `runs: 1` so far (R2-L3: the strong record's first run)
    @crack_infeasible_seen = false # a well formed 200 infeasible answer so far (R2-L4)
    @crack_last_grant = nil # the accounts the cracked answer of the current row granted, nil if none or not grantable (R2-L2)
    @fact_granted = @fact_start_ids.dup # award fact ids a 200 answer of the server's own shape has granted so far, and the start items' (S7 R2-L1)
    @fact_game_earned = @game && !@fact_entries.empty? ? Array(@game.earned_fact_ids).map(&:to_s).to_set : nil
    @networks_swept = Set.new # network ids with an earlier 200 POST /network/scan answer (success, network.id, swept: true) this run; the capture only
    @shares_opened = Set.new # resource ids with an earlier successful GET /container/<share or item in it> this run
    legit = Set.new # items already served by their own allowed route earlier in the run
    prepare_feed_base(lines)
    prepare_plant_rows(lines)
    lines.each_with_index do |(source, line_no, row), index|
      next unless row.is_a?(Hash)

      note_feed_unreadable(row) if feed_unreadable?(row)
      body = if row.key?('dom') then row['dom']
      elsif row.key?('body') then row['body']
      else row['bodyText']
      end
      next if body.nil?

      ctx = response_context(row).merge(index: index)
      body = log_rows_without_typed(body) if ctx[:log_rows]
      add = lambda do |rule, owner, json_path|
        key = [source, line_no, rule, owner]
        next if seen.include?(key)

        seen << key
        findings << Finding.new(rule: rule, owner: owner, route: ctx[:route], source: source, line: line_no,
                                cmd_seq: row['cmdSeq'], json_path: json_path)
      end
      note_privilege_before(body, ctx, row)
      note_crack_earned(body, ctx, row)
      scan_passwords(body, ctx, legit, add)
      scan_capture_secrets(body, ctx, add)
      scan_withheld_keys(body, add)
      scan_login_content(body, ctx, legit, add)
      scan_locked_content(body, add)
      scan_share_content(body, ctx, legit, add)
      scan_network_strings(body, ctx, add)
      note_ops_steps(body, ctx, row)
      scan_ops_strings(body, ctx, add)
      scan_ops_global_keys(body, add)
      scan_ops_services(body, add)
      scan_ops_room_keys(body, ctx, add)
      scan_ops_unswept_blocks(body, add)
      scan_ops_finding_rows(body, add)
      scan_ops_never_keys(body, add)
      scan_ops_techniques(body, ctx, add)
      scan_ops_technique_answer(body, ctx, add)
      scan_ops_session_keys(body, ctx, add)
      scan_privilege_keys(body, add)
      scan_privilege_log_rows(body, ctx, add)
      scan_ops_foothold_views(body, ctx, add)
      scan_wifi_secrets(body, add)
      scan_workarounds(body, ctx, add)
      scan_lockouts(body, ctx, add)
      scan_reacts_key(body, add)
      note_feed_served(body, ctx)
      scan_feed(body, ctx, add)
      scan_credentials(body, add)
      scan_crack(body, ctx, row, add)
      scan_facts(body, ctx, row, add)
      scan_log_rows(body, ctx, add)
      note_share_opened(body, ctx, row)
      note_network_swept(body, ctx, row)
    end
    findings
  end

  def report_lines(findings)
    findings.map do |f|
      cmd = f.cmd_seq.nil? ? 'before the first command' : "command at log seq #{f.cmd_seq}"
      redact("FINDING #{f.rule}  owner=#{f.owner}  route=#{f.route}  response=#{f.source}:#{f.line} " \
             "(#{cmd})  at=#{f.json_path}")
    end
  end

  # Replaces any secret value in an output line, as a last guard.
  def redact(text)
    out = text.dup
    secret_values.each { |v| out = out.gsub(v, '[withheld]') if v.length >= 3 }
    out
  end

  RULE_TEXT = {
    'password' => 'an NPC password in a response',
    'capture_secret' => 'a non-account capture secret outside a GET /capture_secrets answer or a capture page',
    'signin_content' => 'sign-in PC content outside its own container response',
    'stick_content' => "a habit USB stick's files outside a container or unlock response for that stick",
    'profile_content' => 'profile content outside a sign-in PC container response',
    'profile_admin_read' => 'an account profile\'s content in a container answer when the session there is not of an account the profile admits and no admin session was earned at a PC whose owner it admits',
    'locked_content' => 'locked container content in a response that marks it locked',
    'share_content' => 'file share content outside a container response for that share',
    'network_string' => 'a network or resource name, host or observations outside the network routes',
    'ops_string' => 'a host, share, address, range, product, version or service text before the sweep, scan, check, confirm or first listing that earns it (a range or listed address also in a non-network answer; a link id, a global name or an unlinked catalog module at any stage; a services key on an unscanned host)',
    'wifi_secret' => 'a Wi-Fi SSID or pre-shared key in any response (the key is compared on the server, never served)',
    'withheld_key' => 'a withheld key (creds, role, awareness, workarounds, workNeeds, frustration, feed, or a habits key other than screen and print such as locksScreen, writesDown, password, holdsDoors or usb) on an NPC record',
    'workaround' => 'a workaround (its kind beside its target) outside a hand-over',
    'feed_text' => "a feed post's or feed fact's whole text before the server served it",
    'feed_fact_key' => 'an object keyed by a feed fact id with a text key before its post was served, or a bootstrap social.intelFacts that is not an object',
    'feed_reply_target' => 'a feed reply whose replyTo names a post the server had not served yet',
    'feed_reacts_key' => 'an authored reacts key in a response (reactions are derived on the server, never shipped as authored)',
    'feed_reaction_target' => 'a feed reaction on a post the server had not served yet',
    'feed_reaction_key' => 'a feed reaction with a key outside like, laugh, sad, angry',
    'feed_reaction_reactor' => 'a feed reaction from an NPC with no served post yet',
    'lockout_list' => 'a list of sign-in lockouts or failures, a lockout key, a lockedOut list outside GET /scenario ' \
                      'npcFrustration, a lockedOut flag outside a check or sign-in answer, or a lockoutPcs entry that is not a locked-out PC',
    'lockout_unrecorded' => 'a lockout the server\'s check did not record',
    'log_row' => 'a /log_rows answer with a key it may not carry, a registered log secret, or a raw scenario id in a cell',
    'credential_registry' => 'a credentials key in a response (the credential registry is server-only, stripped from the bootstrap)',
    'credential_unheld' => 'a registry credential in a GET /keyring answer whose proof does not hold in the recorded state',
    'credential_password_value' => 'a registry password credential carrying its password value in a GET /keyring answer',
    'credential_clock' => 'a credentialClock key, or a recorded token clock value, in a response (the token clock is server-only; the client gets expiresInS only)',
    'credential_field' => 'an item-level credential field in a response (server-only; both client filters strip it)',
    'crack_key' => 'a key the browser never gets from the cracker (the recipe, the difficulty, the earned-fact and cracking state) or a misplaced or unearned crackFacts',
    'crack_row' => 'a hash row outside a GET /keyring answer, or with a key or value the server\'s row does not have (a password, routes, connectsTo), or a malformed readyInSeconds map',
    'crack_answer' => 'a POST /crack answer that is not exactly the shape of its status or refusal (a running answer carries only the wait)',
    'crack_unearned' => 'a cracked keyring entry, or its password, that no earlier 200 POST /crack cracked answer named, or one that is not the server\'s row',
    'fact_unearned' => "an intel fact's entry, label or text before the answer that grants it (the entry only in the bootstrap's social.intelFacts after the grant, the top-level facts of an inventory answer, the entry of a grant_fact reward or the facts of a give_item reward, in the server's own shape), or any entry of a fact the game has not earned",
    'keyring_capture_key' => 'a captures entry in a GET /keyring answer with a key other than tag, source or account (the map carries no value)'
  }.freeze

  private

  def secret_values
    @secret_values ||= (@passwords.keys + @capture_secrets.keys + @items.values.flat_map { |i| i[:strings] } + @network_strings.keys + @ops_strings.keys +
                        @wifi_secrets.keys + @share_items.values.flat_map { |i| i[:strings] } + @feed_texts.keys).uniq.sort_by { |v| -v.length }
  end

  # ---- catalogue ---------------------------------------------------------------------------

  WORKAROUND_TARGET_KEYS = %w[door prop event pc with].freeze
  # Kept equal to BreakEscape::AccessWork::REACTION_KEYS (the scanner keeps its own copy; a unit
  # test checks they match)
  REACTION_KEYS = %w[like laugh sad angry].freeze

  # Kept equal to BreakEscape::AccessWork::WORKAROUND_KINDS (the scanner loads no Rails code)
  WORKAROUND_KINDS = %w[writes_down prop_door emit borrow_session share_login].freeze

  # Every room NPC's own workarounds, and each role's list (an NPC with none of its own uses
  # its role's): the kind and the first target key it authors. A kind with no target (a
  # writes_down) is identified by nothing beyond its kind, so it is not catalogued.
  def collect_workarounds
    lists = []
    each_room_npc { |npc| lists << [npc['id'], npc['workarounds']] if npc['workarounds'].is_a?(Array) }
    roles = @data['roles'].is_a?(Hash) ? @data['roles'] : {}
    roles.each { |role, r| lists << ["role:#{role}", r['workarounds']] if r.is_a?(Hash) && r['workarounds'].is_a?(Array) }
    lists.each do |owner, list|
      list.each_with_index do |w, i|
        next unless w.is_a?(Hash) && w['do'].is_a?(String)

        key = WORKAROUND_TARGET_KEYS.find { |k| w[k].is_a?(String) && !w[k].empty? }
        @workarounds << { owner: owner, index: i, do: w['do'], target: [key, w[key]] } if key
      end
    end
  end

  def collect_passwords
    reveal = @data.dig('social', 'captures', 'revealSecret') == true
    each_room_npc do |npc|
      creds = npc['creds']
      next unless creds.is_a?(Hash)

      password = creds['password']
      next unless password.is_a?(String) && !password.empty?

      id = npc['id'].to_s
      (@passwords[password] ||= []) << id
      @capture_npcs << id if reveal && BreakEscape::Game.capture_route?(npc)
    end
  end

  # Non-account capture secrets (step 3, SCENARIO_FORMAT_HARDENING_PLAN): the `secret` on an
  # add_capture action, an addCapture mapping or a non-account NPC's usePayload, keyed by target
  # id. The server serves these only through GET /capture_secrets once the capture is earned (and
  # its proof holds), so, like an account password, the value must appear nowhere else. Account
  # secrets stay with collect_passwords (they are an NPC's creds.password, caught there); a writer
  # on an account holder is skipped here, as build_authored_capture_secrets does.
  def collect_capture_secrets
    cm = BreakEscape::CaptureModel
    cm.each_capture_writer(@data) do |capture, _kind, _path, owner|
      next if owner.is_a?(Hash) && cm.account_holder?(owner)

      add_capture_secret(capture['secret'], capture['targetId'], capture['proof'])
    end
    each_room_npc do |npc|
      payload = npc['usePayload']
      next unless payload.is_a?(Hash) && !cm.account_holder?(npc)

      add_capture_secret(payload['secret'], payload['targetId'] || npc['id'], payload['proof'])
    end
  end

  def add_capture_secret(secret, target, proof = nil)
    return unless secret.is_a?(String) && !secret.strip.empty?

    owner = target.is_a?(String) && !target.strip.empty? ? target.strip : 'capture'
    owners = (@capture_secrets[secret.strip] ||= [])
    owners << owner unless owners.include?(owner)
    @capture_secret_proofs[secret.strip] << (proof.is_a?(Hash) ? proof : nil)
  end

  # The proofs of a capture secret whose writers all carry one, or nil (E0.3)
  def capture_secret_proofs(secret)
    list = @capture_secret_proofs.fetch(secret, [])
    list.empty? || list.any?(&:nil?) ? nil : list
  end

  def each_room_npc(&block)
    BreakEscape::Game.scenario_room_npcs(@data).each(&block)
  end

  def collect_items
    @stick_ids = habit_stick_ids
    rooms = @data['rooms']
    (rooms.is_a?(Hash) ? rooms.values : []).each do |room|
      next unless room.is_a?(Hash)

      walk_children(room, base_ctx)
    end
    profiles = @data['accountProfiles']
    (profiles.is_a?(Hash) ? profiles : {}).each do |profile_id, profile|
      next unless profile.is_a?(Hash)

      walk_list(profile['contents'], base_ctx.merge(scope: :profile, profile: profile_id.to_s))
    end
    # Starting items and other top-level objects are public.
    walk_list(@data['startItemsInInventory'], base_ctx)
  end

  # Networks: the strings a foothold's view shows and the content of file shares (step 6).
  def collect_network_secrets
    public_strings = room_data_strings
    usable = ->(v) { v.is_a?(String) && v.strip.length >= MIN_NETWORK_STRING && !public_strings.include?(v.strip) }
    networks = @data['networks'].is_a?(Hash) ? @data['networks'] : {}
    networks.each do |net_id, net|
      next unless net.is_a?(Hash) && usable.call(net['name'])

      (@network_strings[net['name'].strip] ||= []) << "network:#{net_id}"
    end
    resources = @data['resources'].is_a?(Hash) ? @data['resources'] : {}
    resources.each do |res_id, res|
      next unless res.is_a?(Hash)

      %w[name host observations].each do |field|
        next unless usable.call(res[field])

        owners = (@network_strings[res[field].strip] ||= [])
        owners << "resource:#{res_id}" unless owners.include?("resource:#{res_id}")
      end
      walk_share(res['contents'], res_id.to_s, [], usable)
    end
  end

  # A Wi-Fi SSID and pre-shared key (slice 9.3b W, 5.3) are never sent to the browser: the
  # networks block is deleted whole from the bootstrap and the key is only compared on the
  # server. A key the scenario deliberately shows the player in authored room text (a note, a
  # document) is not a hidden secret, so it is skipped, the same rule network_strings uses.
  def collect_wifi_secrets
    public_strings = room_data_strings
    networks = @data['networks'].is_a?(Hash) ? @data['networks'] : {}
    networks.each do |net_id, net|
      wifi = net.is_a?(Hash) ? net['wifi'] : nil
      next unless wifi.is_a?(Hash)

      %w[ssid psk].each do |field|
        v = wifi[field]
        next unless v.is_a?(String) && v.strip.length >= MIN_NETWORK_STRING
        next if public_strings.any? { |s| s.include?(v.strip) }
        # E0.3: a key that is also a capture secret whose writers all carry a proof is served on
        # GET /capture_secrets once the proof holds, so scan_capture_secrets judges it there (by
        # the order of the plant). With no proof the server never serves it: a Wi-Fi secret.
        next if field == 'psk' && capture_secret_proofs(v.strip)

        (@wifi_secrets[v.strip] ||= []) << "network:#{net_id}"
      end
    end
  end

  def walk_share(list, resource_id, ancestors, usable)
    (list.is_a?(Array) ? list : []).each do |item|
      next unless item.is_a?(Hash)

      strings = CONTENT_FIELDS.filter_map { |f| item[f].strip if usable.call(item[f]) }.uniq
      label = item['id'] ? item['id'].to_s : "#{resource_id}/unnamed-#{@share_items.length + 1}"
      # A file in a share that holds a password holds it on purpose, as a note in a room
      # does (the feature scenario's letter and handover note, slice 9.3a step 8), but only
      # where the share's content may be: kept apart from the room notes (review R1 M2)
      share_clues(item, label, resource_id, ancestors)
      @share_item_pairs << [resource_id, item['id'].to_s] if item['id']
      @share_items[label] = { strings: strings, resource: resource_id, ancestors: ancestors.dup } if strings.any?
      walk_share(item['contents'], resource_id, item['id'] ? ancestors + [item['id'].to_s] : ancestors, usable)
    end
  end

  # Every string room data ships as authored: rooms, door signs, objects and NPCs, except the
  # keys the server withholds, sign-in PC desktops, the contents of locked containers and the
  # `secret` of a capture descriptor (a hash under capture, addCapture or usePayload), which
  # Game#strip_capture_secrets! removes before room data ships (E0.3).
  def room_data_strings
    out = Set.new
    walk = lambda do |node, descriptor = false|
      case node
      when String then out << node.strip
      when Array then node.each { |v| walk.call(v) }
      when Hash
        hidden = BreakEscape::Game.login_pc?(node) || node['locked'] == true || habit_stick?(node)
        node.each do |k, v|
          next if WITHHELD_ROOM_KEYS.include?(k)
          next if k == 'contents' && hidden
          next if k == 'secret' && descriptor

          walk.call(v, CAPTURE_DESCRIPTOR_KEYS.include?(k) && v.is_a?(Hash))
        end
      end
    end
    walk.call(@data['rooms']) if @data['rooms'].is_a?(Hash)
    out
  end

  def base_ctx
    { scope: nil, profile: nil, pc: nil, ancestors: [], locked_ancestors: [] }
  end

  def walk_list(list, ctx)
    (list.is_a?(Array) ? list : []).each { |item| walk_item(item, ctx) if item.is_a?(Hash) }
  end

  def walk_children(hash, ctx)
    CHILD_KEYS.each { |key| walk_list(hash[key], ctx) }
  end

  def walk_item(item, ctx)
    note_clues(item)
    if npc_record?(item)
      walk_children(item, ctx)
      return
    end

    strings = content_strings(item)
    secret = ctx[:scope] || ctx[:locked_ancestors].any?
    if secret
      @items[item_label(item, ctx)] = {
        strings: strings, scope: ctx[:scope], profile: ctx[:profile], pc: ctx[:pc],
        ancestors: ctx[:ancestors].dup, locked_ancestors: ctx[:locked_ancestors].dup
      }
    elsif !secret
      strings.each { |s| @public_strings << s }
    end

    child_ctx = ctx.dup
    if BreakEscape::Game.login_pc?(item) && item['id']
      @login_pcs << item['id'].to_s
      child_ctx = ctx.merge(scope: :signin, pc: item['id'].to_s, profile: nil, ancestors: [])
    elsif habit_stick?(item)
      sid = item['id'].to_s
      child_ctx = ctx.merge(scope: :stick, pc: nil, profile: nil, ancestors: [sid])
      add_default_stick_file(item, child_ctx)
    else
      child_ctx = ctx.merge(ancestors: ctx[:ancestors] + [item['id'].to_s]) if item['id']
      if item['locked'] == true && item['id']
        child_ctx = child_ctx.merge(locked_ancestors: ctx[:locked_ancestors] + [item['id'].to_s])
      end
    end
    walk_children(item, child_ctx)
  end

  # Review R3 n3: a stick string that another secret also carries is that secret's, so the other
  # file's own /container answer is not reported as stick_content
  def drop_shared_stick_strings
    others = Set.new
    @items.each_value { |info| info[:strings].each { |s| others << s } unless info[:scope] == :stick }
    @share_items.each_value { |info| info[:strings].each { |s| others << s } }
    @items.each_value { |info| info[:strings] = info[:strings].reject { |s| others.include?(s) } if info[:scope] == :stick }
  end

  # Every habit NPC's stick id (BreakEscape::AccessWork.usb_stick: a storage usb item in itemsHeld)
  def habit_stick_ids
    BreakEscape::AccessWork.usb_habit_sticks(@data).map { |_npc, stick| stick['id'].to_s }.to_set
  end

  def habit_stick?(node)
    @stick_ids ||= habit_stick_ids
    node.is_a?(Hash) && node['type'] == 'usb' && node['id'] && @stick_ids.include?(node['id'].to_s)
  end

  # A stick with no authored files holds the engine's default one, which no scenario text names
  def add_default_stick_file(stick, ctx)
    files = stick['contents']
    return if files.is_a?(Array) && files.any? { |f| f.is_a?(Hash) }

    @items["#{stick['id']}_work_file"] = {
      strings: [BreakEscape::AccessWork::USB_STICK_DEFAULT_FILE, BreakEscape::AccessWork::USB_STICK_DEFAULT_TEXT], scope: :stick, profile: nil, pc: nil,
      ancestors: ctx[:ancestors].dup, locked_ancestors: []
    }
  end

  # The item's id; an item without one (data that skipped the id stamp) is named by where it sits.
  def item_label(item, ctx)
    return item['id'].to_s if item['id']

    @unnamed = (@unnamed || 0) + 1
    parent = ctx[:ancestors].last || ctx[:pc] || ctx[:profile] || 'scenario'
    "#{parent}/unnamed-#{@unnamed}"
  end

  def npc_record?(hash)
    hash.key?('npcType') || hash.key?('creds') || hash.key?('rfidCard') && !hash.key?('type')
  end

  def content_strings(item)
    CONTENT_FIELDS.filter_map do |field|
      v = item[field]
      v.strip if v.is_a?(String) && v.strip.length >= MIN_CONTENT_LENGTH
    end.uniq
  end

  # An item (not an NPC) whose own authored strings hold a password holds it on purpose:
  # a note, a postitNote, a document (section 5.6, "Deliberate clues").
  def note_clues(item)
    return if npc_record?(item) || @passwords.empty?

    own_strings(item).each do |str|
      @passwords.each_key do |password|
        next unless contains_password?(str, password)

        @clue_texts[password] << str
        @clue_holders[password] << item['id'].to_s if item['id']
      end
    end
  end

  # A share item whose own strings hold a password: recorded with its share and folders, so
  # the exemption applies only in a /container answer for that share or a folder in it, or
  # after the item has been served that way (scan_passwords, share_clue?).
  def share_clues(item, label, resource_id, ancestors)
    return if npc_record?(item) || @passwords.empty?

    own_strings(item).each do |str|
      @passwords.each_key do |password|
        next unless contains_password?(str, password)

        entry = @share_clues[password].find { |e| e[:label] == label }
        unless entry
          entry = { label: label, holder: item['id']&.to_s, texts: Set.new, resource: resource_id, ancestors: ancestors.dup }
          @share_clues[password] << entry
        end
        entry[:texts] << str
      end
    end
  end

  # Strings on the item itself and in its non-item fields (observationVariants and the like),
  # not in the items it contains.
  def own_strings(node, top: true)
    case node
    when String then [node]
    when Array then node.flat_map { |v| own_strings(v, top: false) }
    when Hash
      node.flat_map do |k, v|
        next [] if top && CHILD_KEYS.include?(k)
        next [] if !top && v.is_a?(Hash) && v.key?('type') # a nested item

        own_strings(v, top: false)
      end
    else []
    end
  end

  def contains_password?(str, password)
    return false unless str.is_a?(String)

    if password.length >= MIN_SUBSTRING_PASSWORD
      str.include?(password)
    else
      str.match?(/(?<![A-Za-z0-9])#{Regexp.escape(password)}(?![A-Za-z0-9])/)
    end
  end

  # ---- scanning ----------------------------------------------------------------------------

  def response_context(row)
    if row.key?('dom')
      # E0.3: only a page labelled as a capture page (a capture log, a captures terminal) is
      # exempt like a GET /capture_secrets answer; any other page (a device console) is scanned
      return { route: "page #{row['label'] || 'dom'}", container: nil, unlock: false,
               capture_secrets: row['label'].to_s.match?(CAPTURE_PAGE_LABEL),
               network: false, any_container: false, scenario: false }
    end

    method = row['method'].to_s.upcase
    path = row['path'].to_s.split('?').first.to_s
    container = method == 'GET' && path =~ %r{/container/([^/]+)\z} ? URI.decode_www_form_component(Regexp.last_match(1)) : nil
    {
      route: "#{method} #{path}",
      container: container,
      unlock: method == 'POST' && path.end_with?('/unlock'),
      capture_secrets: path.end_with?('/capture_secrets'),
      network: path.end_with?('/network') || path.include?('/network/'),
      any_container: path.include?('/container/'),
      scenario: method == 'GET' && path.end_with?('/scenario'),
      room: method == 'GET' && path.match?(%r{/room/[^/]+\z}),
      login_accounts: method == 'GET' && path.end_with?('/login_accounts'),
      npc_workaround: method == 'POST' && path.end_with?('/npc_workaround'),
      npc_frustration: method == 'POST' && path.end_with?('/npc_frustration'),
      login: method == 'POST' && path.end_with?('/login'),
      logout: method == 'POST' && path.end_with?('/logout'),
      lock_session: method == 'POST' && path.end_with?('/lock_session'),
      friendface_phone: method == 'POST' && path.end_with?('/friendface_phone'),
      keyring: method == 'GET' && path.end_with?('/keyring'),
      # S7 crack rules: the exact game route (the older rules above keep their own looser matching)
      crack: method == 'POST' && path.match?(%r{\A(?:/break_escape)?/games/\d+/crack\z}),
      crack_keyring_route: method == 'GET' && path.match?(%r{\A(?:/break_escape)?/games/\d+/keyring\z}),
      crack_keyring: method == 'GET' && row['status'].is_a?(Integer) && row['status'] == 200 && path.match?(%r{\A(?:/break_escape)?/games/\d+/keyring\z}),
      ops_scan: method == 'POST' && path.end_with?('/network/scan'),
      ops_check: method == 'POST' && path.end_with?('/network/check'),
      ops_confirm: method == 'POST' && path.end_with?('/network/confirm'),
      ops_technique: method == 'POST' && path.end_with?('/network/technique'),
      inventory_add: ops_inventory_add_id(row, method, path),
      network_view: method == 'GET' && path.end_with?('/network'),
      log_rows: method == 'GET' && path.end_with?('/log_rows'),
      log_rows_ok: method == 'GET' && path.end_with?('/log_rows') && row['status'].is_a?(Integer) && row['status'] == 200
    }
  end

  # Walks every string in a body, with its JSON path and the nearest enclosing hash id.
  def each_string(node, path = '$', owner_id = nil, &block)
    case node
    when String then yield node, path, owner_id
    when Array then node.each_with_index { |v, i| each_string(v, "#{path}[#{i}]", owner_id, &block) }
    when Hash
      id = node['id'].is_a?(String) || node['id'].is_a?(Integer) ? node['id'].to_s : owner_id
      node.each { |k, v| each_string(v, "#{path}.#{k}", id, &block) }
    end
  end

  def scan_passwords(body, ctx, legit, add)
    return if @passwords.empty?

    note = ctx[:login_accounts] ? served_note_password(body) : nil
    shared = ctx[:npc_workaround] ? heard_share_password(body) : nil
    # A GET /keyring answer's implicit capture entries carry the captured account's own
    # password, just as GET /capture_secrets does. Exempt the `password` field on a
    # `source: "capture"` entry only when its id is `<npcId>.password` for an account the
    # recorded state serves as captured (Game#account_capture_usernames) and the password found
    # there is that NPC's own (carry-in m3): the `source` label alone exempts nothing. A
    # registry-sourced entry is never exempted, so a password on one is still flagged.
    keyring_capture_paths = ctx[:keyring] && @game ? keyring_capture_password_paths(body) : nil
    cracked_paths = ctx[:crack_keyring] ? crack_password_paths(body) : nil
    each_string(body) do |str, json_path, holder|
      @passwords.each do |password, owners|
        next unless contains_password?(str, password)
        next if deliberate_clue?(password, str, holder)
        next if share_clue?(password, str, holder, ctx, json_path, legit)
        next if keyring_capture_paths && owners.include?(keyring_capture_paths[json_path])
        next if cracked_paths && owners.include?(cracked_paths[json_path])
        next if note == password && json_path == '$.postitNote'
        next if @noted.include?(password) && json_path.include?('.savedNotes[')
        next if shared == password && share_path?(json_path)
        next if reveal_secret? && @shared.include?(password) && json_path.include?('.captures')

        owners.each do |npc_id|
          next if ctx[:capture_secrets] && @capture_npcs.include?(npc_id) && (@served_npcs.nil? || @served_npcs.include?(npc_id)) &&
                  account_proof_held_before?(npc_id, ctx[:index])

          add.call('password', "npc:#{npc_id}", safe_path(json_path))
        end
      end
    end
  end

  # A non-account capture secret anywhere but the two routes that legitimately serve it: a GET
  # /capture_secrets answer and a capture page the tester read (a dom row, labelled a capture log
  # or captures terminal). Both set ctx[:capture_secrets]. The match rule mirrors a password: a
  # secret of six or more characters is matched as a substring, a shorter one as a whole token.
  #
  # E0.3: on those routes a secret whose writers all carry a proof passes only when one of its
  # proofs held before the row (proof_held_before?).
  def scan_capture_secrets(body, ctx, add)
    return if @capture_secrets.empty?

    each_string(body) do |str, json_path, _owner|
      @capture_secrets.each do |secret, targets|
        next unless contains_password?(str, secret)
        next if ctx[:capture_secrets] && capture_secret_served_in_order?(secret, ctx[:index])

        targets.each { |t| add.call('capture_secret', "capture:#{t}", safe_path(json_path)) }
      end
    end
  end

  # The password a /login_accounts answer may carry as its note (slice 9.1, 5.3): its own
  # pc_id names a sign-in PC whose owner the game says written_down?. Recorded, so a later
  # savedNotes copy of it is allowed. nil without a game.
  def served_note_password(body)
    return nil unless @game && body.is_a?(Hash) && body['postitNote'].is_a?(String)

    pc = @game.find_login_pc(body['pc_id'].to_s)&.dig(:object)
    owner = pc && @game.login_pc_owner(pc)
    return nil unless owner && @game.written_down?(owner)

    password = owner.dig('creds', 'password')
    return nil unless password.is_a?(String) && contains_password?(body['postitNote'], password)

    @noted << password
    password
  end

  SHARE_PATHS = %w[$.line $.note].freeze

  # The capture's note (served in the bootstrap/answer `captures` record, server-owned since 6a)
  # holds the password only where social.captures.revealSecret is on (review R1 m3)
  def share_path?(json_path)
    SHARE_PATHS.include?(json_path) || (json_path == '$.capture.note' && reveal_secret?)
  end

  def reveal_secret?
    @data.dig('social', 'captures', 'revealSecret') == true
  rescue TypeError
    false
  end

  # The password a heard share_login answer may carry (sub-slice H, plan 6.5): the capture's
  # targetId is an NPC that authors a share_login, the game lists it in sharedLogins, and the
  # password is that NPC's own. Recorded, so a later savedNotes or se_captures copy is allowed.
  # nil without a game.
  def heard_share_password(body)
    return nil unless @game && body.is_a?(Hash) && body['capture'].is_a?(Hash)
    return nil unless body['line'].is_a?(String) && body['note'].is_a?(String)

    npc_id = body['capture']['targetId'].to_s
    return nil unless @workarounds.any? { |w| w[:owner] == npc_id && w[:do] == 'share_login' }

    shared = @game.player_state.is_a?(Hash) ? @game.player_state['sharedLogins'] : nil
    return nil unless shared.is_a?(Array) && shared.map(&:to_s).include?(npc_id)

    npc = nil
    each_room_npc { |n| npc = n if n['id'].to_s == npc_id }
    password = npc&.dig('creds', 'password')
    return nil unless password.is_a?(String) && !password.empty?

    @shared << password
    @noted << password
    password
  end

  # A workaround outside the places the server hands one over (sub-slice B)
  def scan_workarounds(body, ctx, add)
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash['do'].is_a?(String)

      # An authored entry carries `at`, which no run, pending or done entry does: a leak
      # anywhere, with no exemption (the only way to see a leaked writes_down, which has no target)
      if WORKAROUND_KINDS.include?(hash['do']) && hash.key?('at')
        add.call('workaround', "authored #{hash['do']}", safe_path(json_path))
        next
      end
      next if @workarounds.empty?
      next if ctx[:route].end_with?('/npc_frustration') && json_path =~ /\A\$\.answers\[\d+\]\.(run|pending\[\d+\])\z/
      next if ctx[:scenario] && json_path =~ /\A\$\.npcFrustration\.[^.]+\.(pending|done)\[\d+\]\z/

      @workarounds.each do |w|
        key, value = w[:target]
        next unless hash['do'] == w[:do] && hash[key] == value

        add.call('workaround', "#{w[:owner]}[#{w[:index]}]", safe_path(json_path))
      end
    end
  end

  # ---- sub-slice C: feeds (plan 9.2 and 11) ---------------------------------------------

  def collect_feeds
    facts = @data.dig('social', 'intelFacts')
    facts = {} unless facts.is_a?(Hash)
    each_room_npc do |npc|
      feed = npc['feed']
      next unless feed.is_a?(Hash) && feed['posts'].is_a?(Array)

      feed['posts'].each do |post|
        # Review C R2 nit: the server's own test (AccessWork.present_string? in feed_posts), so a
        # blank id is skipped here too
        next unless post.is_a?(Hash) && post['id'].is_a?(String) && !post['id'].strip.empty?

        key = "#{npc['id']}|#{post['id']}"
        # C3 (plan 9): a post with a reply field adds no feed fact, as on the server (feed_facts)
        reply = BreakEscape::AccessWork.reply_post?(post)
        fid = !reply && post['fact'].is_a?(String) && facts[post['fact']].is_a?(Hash) ? post['fact'] : nil
        @feed_order[npc['id'].to_s] << [post['id'], fid]
        @feed_ordered_ids[npc['id'].to_s] << post['id'] unless post['when'].is_a?(Hash) || reply
        @feed_post_key[post['id']] ||= key
        text = post['text']
        # C3: a reply ships with {name} filled, so it is matched by each literal piece around
        # {name} of MIN_FEED_TEXT or more (the validator's piece rules use the same helper)
        texts = reply ? BreakEscape::AccessWork.reply_text_pieces(text) : [text]
        texts.each do |t|
          (@feed_texts[t] ||= { kind: :post, owner: "feed:#{key}", served: [] })[:served] << key if t.is_a?(String) && t.length >= MIN_FEED_TEXT
        end
        next unless fid

        @feed_fact_ids << fid
        ftext = facts[fid]['text']
        next unless ftext.is_a?(String) && ftext.length >= MIN_FEED_TEXT

        (@feed_texts[ftext] ||= { kind: :fact, owner: "fact:#{fid}", served: [] })[:served] << "fact:#{fid}"
      end
    end
  end

  # A /feed_post answer the server gave (200) whose body the log does not hold as JSON: the
  # capture's bodyError (the browser dropped the body, as on a reload) or an unparsed bodyText
  def feed_unreadable?(row)
    row['path'].to_s.split('?').first.to_s.end_with?('/feed_post') && row['status'].to_i == 200 &&
      !row['body'].is_a?(Hash)
  end

  # Review C R3 m1: the capture's time on an unreadable answer and the game's saved time of an
  # NPC's last reveal (`feedRevealed[npc].at`) are both wall-clock times, so a lost answer
  # captured more than this after that NPC's last reveal cannot have been one of its reveals
  # (it was another NPC's answer, or a tooSoon or done answer).
  LOST_ANSWER_SLACK_S = 5

  # The NPC a /feed_post row's request named (the capture's `npcId`), or nil when the row has no
  # tag, a blank one, or an `npc_id` in its query string (Rails lets the query beat the body, so
  # the body's id may not be the NPC the server revealed for), or when the log's tags were found
  # untrustworthy.
  def feed_row_tag(row)
    return nil if @feed_tags_ignored

    tagged = row['npcId']
    return nil unless tagged.is_a?(String) && !tagged.strip.empty?
    return nil if query_names_npc?(row['query'])

    tagged
  end

  def query_names_npc?(query)
    return false unless query.is_a?(String)

    # Rack splits the query on `;` as well as `&`; over-matching only falls back to the old rule
    CGI.unescape(query).include?('npc_id')
  end

  # Whether an unreadable answer may have been one of `npc_id`'s reveals. A row the capture tagged
  # with the request's `npcId` was that NPC's answer and no other's. An untagged row (a capture
  # file older than the tag) may be any NPC's. Without a capture time or a saved time it may (the
  # log cannot settle it, so the note says so).
  def lost_answer_may_be?(npc_id, row)
    tagged = feed_row_tag(row)
    return false if tagged && tagged != npc_id

    at = @feed_at[npc_id]
    t = capture_time(row)
    at.nil? || t.nil? || t <= at + LOST_ANSWER_SLACK_S
  end

  def capture_time(row)
    row['t'].is_a?(String) ? Time.iso8601(row['t']).to_f : nil
  rescue ArgumentError
    nil
  end

  def note_feed_unreadable(row)
    @feed_unknown_share.each_key { |npc_id| @feed_unknown_seen[npc_id] += 1 if lost_answer_may_be?(npc_id, row) }
  end

  # Reveals the log does not show: the game's saved count less the /feed_post answers the log
  # holds. An unreadable answer (review C R2 m2) may be one of them, but only from its own place
  # in the log, so up to one reveal per unreadable answer is granted there, and only what is
  # still missing after that counts from the first line (a resumed game). An unreadable answer
  # captured after the NPC's last saved reveal is not counted for it (review C R3 m1), and one
  # tagged with another NPC's `npcId` is not counted for it either, so tagged lost rows give out
  # no more shares than there are of them. Untagged rows from older capture files may still be
  # counted for every NPC they could belong to. A complete
  # log gives 0, so every reveal is judged in log order.
  def prepare_feed_base(lines)
    @feed_shown = Hash.new { |h, k| h[k] = [] }
    @saved_shown = {}
    @feed_base = {}
    @feed_fallback = []
    @feed_unknown_share = {}
    @feed_unknown_seen = Hash.new(0)
    @feed_unknown = []
    @feed_ruled_out = []
    @feed_tags_ignored = false
    @feed_at = {}
    return if @feed_order.empty?

    in_log = Hash.new(0)
    unreadable = []
    lines.each do |_source, _no, row|
      next unless row.is_a?(Hash)

      unreadable << row if feed_unreadable?(row)
      next unless row['body'].is_a?(Hash) && row['path'].to_s.split('?').first.to_s.end_with?('/feed_post')

      # every readable answer that names its NPC (a post, done, refused or tooSoon) checks the tag
      tag = feed_row_tag(row)
      @feed_tags_ignored = true if tag && row['body']['npcId'].is_a?(String) && tag != row['body']['npcId']
      next unless row['body']['post'].is_a?(Hash)

      in_log[row['body']['npcId'].to_s] += 1
    end
    revealed = @game&.player_state.is_a?(Hash) ? @game.player_state['feedRevealed'] : nil
    return unless revealed.is_a?(Hash)

    @feed_order.each_key do |npc_id|
      entry = revealed[npc_id].is_a?(Hash) ? revealed[npc_id] : {}
      # C2: the saved reveal set is `shown` (ids) when present, else a legacy `{ n, at }` count
      # migrated to the first n ordered post ids (mirrors AccessWork.feed_shown_ids)
      saved = entry['shown'].is_a?(Array) ? entry['shown'].select { |i| i.is_a?(String) } : @feed_ordered_ids[npc_id].first(entry['n'].to_i)
      @saved_shown[npc_id] = saved
      n = saved.length
      @feed_at[npc_id] = entry['at'].to_f if entry['at'].is_a?(Numeric)
      missing = n - in_log[npc_id]
      next unless missing.positive?

      share = [missing, unreadable.count { |row| lost_answer_may_be?(npc_id, row) }].min
      if share.positive?
        @feed_unknown_share[npc_id] = share
        @feed_unknown << npc_id
      end
      base = missing - share
      next unless base.positive?

      @feed_base[npc_id] = base
      @feed_fallback << npc_id
      @feed_ruled_out << npc_id if share.zero? && unreadable.any? { |row| (tag = feed_row_tag(row)) && tag != npc_id }
    end
  end

  # The post ids this NPC may legitimately carry at this point of the log: the ids the log has
  # shown served so far, plus, where no log line names them (reveals before the log, or a lost
  # /feed_post body), the first of the game's saved reveal ids up to that count. Saved ids are
  # never used as the whole `allowed` on a live run, only to cover reveals the log cannot show.
  def feed_allowed_ids(npc_id)
    ids = @feed_shown[npc_id].dup
    credits = (@feed_base[npc_id] || 0) + [@feed_unknown_seen[npc_id], @feed_unknown_share[npc_id] || 0].min
    saved = @saved_shown[npc_id]
    ids |= (saved - ids).first(credits) if credits.positive? && saved
    ids
  end

  # A /feed_post answer with a post serves the post its own body names and its own fact id (C2:
  # the server serves reactive posts out of authored order, so the served id is read from the
  # answer, not from an authored-order prefix). A GET /scenario feedPosts entry is allowed only
  # for a post among the ids shown so far (feed_allowed_ids), looked up by its own id, and only
  # with that post's authored fact; an out-of-order reactive post the server served is covered by
  # the accumulated ids, so it raises no false feed_text leak.
  def note_feed_served(body, ctx)
    return if @feed_texts.empty? && @feed_fact_ids.empty?
    return unless body.is_a?(Hash)

    if ctx[:route].end_with?('/feed_post') && body['post'].is_a?(Hash)
      npc_id = body['npcId'].to_s
      post_id = body['post']['id']
      return unless post_id.is_a?(String)

      @feed_shown[npc_id] << post_id unless @feed_shown[npc_id].include?(post_id)
      fact = body['fact']
      serve_feed(npc_id, post_id, fact.is_a?(Hash) ? fact['id'] : nil)
    elsif (ctx[:scenario] || ctx[:friendface_phone]) && body['feedPosts'].is_a?(Hash)
      # C3 (plan 9): POST /friendface_phone answers with a feedPosts slice, judged as GET /scenario's
      body['feedPosts'].each do |npc_id, f|
        nid = npc_id.to_s
        allowed = feed_allowed_ids(nid)
        Array(f.is_a?(Hash) ? f['posts'] : nil).each do |item|
          next unless item.is_a?(Hash) && item['post'].is_a?(Hash)

          post_id = item['post']['id']
          next unless allowed.include?(post_id)

          _id, fid = @feed_order[nid].find { |id, _| id == post_id }
          fact = item['fact']
          serve_feed(nid, post_id, fact.is_a?(Hash) && fact['id'] == fid ? fid : nil)
        end
      end
    end
  end

  def serve_feed(npc_id, post_id, fid)
    @feed_posters << npc_id.to_s
    @feed_served << "#{npc_id}|#{post_id}"
    @feed_served << "fact:#{fid}" if fid
  end

  def feed_served?(entry)
    entry[:served].any? { |k| @feed_served.include?(k) }
  end

  # Reactions: a `reacts` key anywhere is the authored list shipped; it needs no feed texts or facts,
  # so it runs outside scan_feed's early return
  def scan_reacts_key(body, add)
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash.key?('reacts')

      owner = hash['id'].is_a?(String) ? "reacts:#{hash['id']}" : 'reacts'
      add.call('feed_reacts_key', owner, safe_path("#{json_path}.reacts"))
    end
  end

  # Reaction items in a /feed_post answer ({ postId, npc, person, key }) and in a feedPosts block
  # (on the item they target: { npc, person, key }). Each target must be served by now (the
  # answer's own post and the block's own items were noted first), each key one of
  # REACTION_KEYS, and each reactor an NPC with a served post.
  def scan_reactions(body, ctx, add)
    return unless body.is_a?(Hash)

    if ctx[:route].end_with?('/feed_post')
      Array(body['reactions']).each_with_index do |r, i|
        next unless r.is_a?(Hash)

        target = r['postId'].is_a?(String) ? @feed_post_key[r['postId']] : nil
        judge_reaction(r, target, r['postId'], "$.reactions[#{i}]", add)
      end
    elsif (ctx[:scenario] || ctx[:friendface_phone]) && body['feedPosts'].is_a?(Hash)
      body['feedPosts'].each do |npc_id, f|
        Array(f.is_a?(Hash) ? f['posts'] : nil).each_with_index do |item, j|
          next unless item.is_a?(Hash) && item['post'].is_a?(Hash)

          post_id = item['post']['id']
          Array(item['reactions']).each_with_index do |r, i|
            next unless r.is_a?(Hash)

            target = post_id.is_a?(String) ? "#{npc_id}|#{post_id}" : nil
            judge_reaction(r, target, post_id, "$.feedPosts.#{npc_id}.posts[#{j}].reactions[#{i}]", add)
          end
        end
      end
    end
  end

  def judge_reaction(item, target, post_id, path, add)
    @reaction_items += 1
    unless target && feed_target_out?(target)
      add.call('feed_reaction_target', target ? "feed:#{target}" : "post:#{post_id}", safe_path(path))
    end
    add.call('feed_reaction_key', "post:#{post_id}", safe_path("#{path}.key")) unless REACTION_KEYS.include?(item['key'])
    reactor = item['npc'].to_s
    add.call('feed_reaction_reactor', "npc:#{reactor}", safe_path("#{path}.npc")) unless feed_poster_out?(reactor)
  end

  # Whether a post ("npc|post_id") may be out at this point of the log: served by a line the log
  # holds, or among the owner's saved reveal ids that a lost /feed_post answer passed so far (or a
  # reveal before the log) accounts for (feed_allowed_ids). Reactions code review R1 m2: a post
  # whose answer body was lost is never served by serve_feed, so a later reaction or reply on it
  # would otherwise be a false leak.
  def feed_target_out?(key)
    return true if @feed_served.include?(key)

    npc_id, post_id = key.split('|', 2)
    @feed_order.key?(npc_id) && feed_allowed_ids(npc_id).include?(post_id)
  end

  # Whether an NPC may have a post out at this point of the log, by the same credit
  def feed_poster_out?(npc_id)
    @feed_posters.include?(npc_id) || (@feed_order.key?(npc_id) && feed_allowed_ids(npc_id).any?)
  end

  def scan_feed(body, ctx, add)
    return if @feed_texts.empty? && @feed_fact_ids.empty?

    scan_reactions(body, ctx, add)

    # C3: a served reply's replyTo names its thread post, which must be out already
    walk_hashes(body, '$') do |hash, json_path|
      target = hash['replyTo']
      next unless target.is_a?(String) && hash['id'].is_a?(String) && @feed_post_key.key?(target)
      next if feed_target_out?(@feed_post_key[target])

      add.call('feed_reply_target', "feed:#{@feed_post_key[target]}", safe_path("#{json_path}.replyTo"))
    end

    each_string(body) do |str, json_path, _owner|
      @feed_texts.each do |text, entry|
        next unless str.include?(text)
        next if feed_served?(entry)

        add.call('feed_text', entry[:owner], safe_path(json_path))
      end
    end
    return if @feed_fact_ids.empty?

    # Plan 9.2: the bootstrap's social.intelFacts stays an object, or grantFact grants any id
    if ctx[:scenario] && body.is_a?(Hash) && body['social'].is_a?(Hash) && !body['social']['intelFacts'].is_a?(Hash)
      add.call('feed_fact_key', 'social.intelFacts', '$.social.intelFacts')
    end
    walk_hashes(body, '$') do |hash, json_path|
      hash.each do |k, v|
        next unless @feed_fact_ids.include?(k) && v.is_a?(Hash) && v.key?('text')
        next if @feed_served.include?("fact:#{k}")

        add.call('feed_fact_key', "fact:#{k}", safe_path("#{json_path}.#{k}"))
      end
    end
  end

  # Credential keyring (CREDENTIAL_KEYRING_PLAN.md, section 6.1). Three leaks:
  # - any response carrying a `credentials` key (the registry is server-only, stripped from the
  #   bootstrap, so it must never reach the browser);
  # - a registry credential served in a GET /keyring answer whose proof does not hold in the
  #   recorded state (@game, read once at scan time, as the lockout records are);
  # - a registry password credential carrying its `password` value (only a captured account's
  #   implicit entry may carry one, and only where GET /capture_secrets already serves it).
  def scan_credentials(body, add)
    walk_hashes(body, '$') do |hash, path|
      add.call('credential_registry', 'credentials', safe_path("#{path}.credentials")) if hash.key?('credentials')
      # The item-level `credential` field is server-only: both client filters strip it, so it
      # must never reach the browser. A second guard on the field R1 m1 flagged (K1 R2 m3).
      add.call('credential_field', 'credential', safe_path("#{path}.credential")) if hash['credential'].is_a?(String)
      # K5: the token clock is server-only (never the key, never a recorded value).
      add.call('credential_clock', 'credentialClock', safe_path("#{path}.credentialClock")) if hash.key?('credentialClock')
      next if credential_clock_values.empty?

      hash.each do |k, v|
        add.call('credential_clock', 'credentialClock', safe_path("#{path}.#{k}")) if v.is_a?(Numeric) && credential_clock_values.include?(v.to_f)
      end
    end

    entries = keyring_entries_in(body)
    return if entries.nil?

    scan_keyring_captures(body, add)
    entries.each_with_index do |entry, i|
      next unless entry.is_a?(Hash)
      next unless entry['source'].to_s == 'registry'

      id = entry['id'].to_s
      base = "$.entries[#{i}]"
      if entry['kind'].to_s == 'password' && entry.key?('password')
        add.call('credential_password_value', "credential:#{id}", safe_path("#{base}.password"))
      end
      next if credential_proof_held_ids.nil?

      add.call('credential_unheld', "credential:#{id}", safe_path(base)) unless credential_proof_held_ids.include?(id)
    end
  end

  KEYRING_CAPTURE_KEYS = %w[tag source account].freeze

  # K3d (plan 8.7): the `captures` map of a GET /keyring answer carries a tag, a source and an
  # account id per target, never a value. Any other key, or an entry that is not an object, is a
  # finding named by its target id; the path is reported, the value never.
  def scan_keyring_captures(body, add)
    captures = body['captures']
    return unless captures.is_a?(Hash)

    captures.each do |target_id, entry|
      owner = "capture:#{target_id}"
      unless entry.is_a?(Hash)
        add.call('keyring_capture_key', owner, safe_path("$.captures.#{target_id}"))
        next
      end
      (entry.keys - KEYRING_CAPTURE_KEYS).each do |key|
        add.call('keyring_capture_key', owner, safe_path("$.captures.#{target_id}.#{key}"))
      end
    end
  end

  # A GET /keyring answer, told apart by its shape (`{ rev, entries: [...] }`); nil otherwise.
  def keyring_entries_in(body)
    return nil unless body.is_a?(Hash) && body.key?('rev') && body['entries'].is_a?(Array)

    body['entries']
  end

  # { JSON path => npc id } for the `password` field on every `source: "capture"` keyring entry
  # whose id is `<npcId>.password` for an account the recorded state serves as captured, so
  # scan_passwords can exempt that NPC's own value there (and only there). An entry labelled
  # capture under any other id, or for an account not captured, maps to nothing.
  def keyring_capture_password_paths(body)
    entries = keyring_entries_in(body)
    return {} if entries.nil?

    captured = captured_account_ids
    paths = {}
    entries.each_with_index do |entry, i|
      next unless entry.is_a?(Hash) && entry['source'].to_s == 'capture' && entry['password'].is_a?(String)

      id = entry['id'].to_s
      next unless id.end_with?('.password')

      npc_id = id.delete_suffix('.password')
      paths["$.entries[#{i}].password"] = npc_id if captured.include?(npc_id)
    end
    paths
  end

  # The NPC ids whose capture the recorded state serves (Game#account_capture_usernames, the
  # reader the server's implicit keyring entries use), read once from the game at scan time;
  # empty when the game cannot say, so nothing is exempted.
  def captured_account_ids
    return @captured_account_ids if defined?(@captured_account_ids)

    usernames =
      if @game.respond_to?(:account_capture_usernames, true)
        @game.send(:account_capture_usernames)
      end
    @captured_account_ids = usernames.is_a?(Hash) ? usernames.keys.map(&:to_s).to_set : Set.new
  end

  # The registry credential ids whose proof holds in the recorded state, from the game read once at
  # scan time; nil when no game is given (the unheld check then does not run).
  def credential_proof_held_ids
    return @credential_proof_held_ids if defined?(@credential_proof_held_ids)

    @credential_proof_held_ids =
      if @game.respond_to?(:credential_proof_holds?)
        BreakEscape::CredentialModel.registry(@data)
                                    .select { |id, entry| @game.credential_proof_holds?(id, entry) }
                                    .keys.map(&:to_s).to_set
      end
  end

  # The recorded token clock values of the game read at scan time (empty without a game).
  def credential_clock_values
    @credential_clock_values ||= begin
      state = @game.respond_to?(:player_state) && @game.player_state.is_a?(Hash) ? @game.player_state['credentialClock'] : nil
      (state.is_a?(Hash) ? state.values : []).select { |v| v.is_a?(Numeric) }.map(&:to_f).to_set
    end
  end

  def walk_hashes(node, path, &block)
    case node
    when Array then node.each_with_index { |v, i| walk_hashes(v, "#{path}[#{i}]", &block) }
    when Hash
      yield node, path
      node.each { |k, v| walk_hashes(v, "#{path}.#{k}", &block) }
    end
  end

  # Sub-slice L: the game's own check records, npcId => [pcId] (empty without a game)
  def lockout_records
    @lockout_records ||= begin
      store = @game.respond_to?(:player_state) && @game.player_state.is_a?(Hash) ? @game.player_state['npcFrustration'] : nil
      (store.is_a?(Hash) ? store : {}).each_with_object({}) do |(id, e), out|
        list = e.is_a?(Hash) && e['lockedOut'].is_a?(Array) ? e['lockedOut'].map(&:to_s) : []
        out[id.to_s] = list unless list.empty?
      end
    end
  end

  LOCKOUT_LIST_KEYS = %w[loginLockouts loginFailures].freeze
  CLIENT_LOCKED_OUT_PATH = /\A\$\.npcFrustration\.([^.\[]+)\.lockedOut\z/.freeze
  CLIENT_LOCKOUT_PCS_PATH = '$.lockoutPcs'.freeze

  # Review R1 m4: the game's loginLockouts and loginFailures keys ("pcId|username"), empty without a game
  def lockout_key_strings
    @lockout_key_strings ||= begin
      ps = @game.respond_to?(:player_state) && @game.player_state.is_a?(Hash) ? @game.player_state : {}
      list = ps['loginLockouts'].is_a?(Array) ? ps['loginLockouts'] : []
      fails = ps['loginFailures'].is_a?(Hash) ? ps['loginFailures'].keys : []
      (list + fails).select { |k| k.is_a?(String) && k.include?('|') && !k.split('|', 2).last.to_s.strip.empty? }.uniq
    end
  end

  # Review R1 M1: the PCs of the game's loginLockouts keys, which GET /scenario may list
  def lockout_pc_ids
    @lockout_pc_ids ||= begin
      ps = @game.respond_to?(:player_state) && @game.player_state.is_a?(Hash) ? @game.player_state : {}
      (ps['loginLockouts'].is_a?(Array) ? ps['loginLockouts'] : []).filter_map { |k| k.is_a?(String) && k.include?('|') ? k.split('|', 2).first : nil }.to_set
    end
  end

  # Sub-slice L (6.6, 9.2): no lockout list, and no lockout the server's check did not record
  def scan_lockouts(body, ctx, add)
    walk_hashes(body, '$') do |hash, json_path|
      LOCKOUT_LIST_KEYS.each do |key|
        add.call('lockout_list', key, safe_path("#{json_path}.#{key}")) if hash.key?(key)
      end
      scan_lockout_pcs(hash, json_path, ctx, add) if hash.key?('lockoutPcs')
      next unless hash.key?('lockedOut')

      value = hash['lockedOut']
      path = "#{json_path}.lockedOut"
      if value.is_a?(Array)
        m = ctx[:scenario] ? CLIENT_LOCKED_OUT_PATH.match(path) : nil
        unless m
          add.call('lockout_list', 'lockedOut', safe_path(path))
          next
        end
        next unless @game

        value.each do |pc|
          add.call('lockout_unrecorded', "npc:#{m[1]}/#{pc}", safe_path(path)) unless Array(lockout_records[m[1]]).include?(pc.to_s)
        end
      elsif [true, false].include?(value) && !ctx[:npc_frustration] && !ctx[:login]
        # Review R1 m4: a lockout answer belongs to a check answer or a sign-in answer only
        add.call('lockout_list', 'lockedOut', safe_path(path))
      elsif value == true && ctx[:npc_frustration] && @game
        npc = hash['npcId'].to_s
        add.call('lockout_unrecorded', "npc:#{npc}", safe_path(path)) if Array(lockout_records[npc]).empty?
      end
    end
    # Review R1 m4: a lockout or failure key under any key name (a global, a log payload)
    keys = lockout_key_strings
    return if keys.empty?

    each_string(body) do |str, json_path, _owner|
      add.call('lockout_list', 'lockout_key', safe_path(json_path)) if keys.any? { |k| str.include?(k) }
    end
    # Review R2 n3: a lockout key used as a hash key, reported at the parent's path
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash.keys.any? { |hk| hk.is_a?(String) && keys.any? { |k| hk.include?(k) } }

      add.call('lockout_list', 'lockout_key', safe_path("#{json_path}.[lockout key]"))
    end
  end

  # Review R1 M1: GET /scenario's top-level lockoutPcs, PC ids where the game holds a lockout
  def scan_lockout_pcs(hash, json_path, ctx, add)
    path = "#{json_path}.lockoutPcs"
    value = hash['lockoutPcs']
    unless ctx[:scenario] && path == CLIENT_LOCKOUT_PCS_PATH && value.is_a?(Array)
      add.call('lockout_list', 'lockoutPcs', safe_path(path))
      return
    end
    value.each_with_index do |pc, i|
      bad = !pc.is_a?(String) || pc.include?('|') || (@game && !lockout_pc_ids.include?(pc))
      add.call('lockout_list', 'lockoutPcs', safe_path("#{path}[#{i}]")) if bad
    end
  end

  # NPC records holding a key the server withholds: by key and NPC id, never the value.
  def scan_withheld_keys(body, add)
    walk_records(body, '$', false) do |record, json_path|
      (WITHHELD_KEYS + WITHHELD_WORK_KEYS).each do |key|
        next unless record.key?(key)

        add.call('withheld_key', "npc:#{record['id']}/#{key}", safe_path("#{json_path}.#{key}"))
      end
      # Step 8c: the habits block ships only screen and print; any other habits key is server-only.
      habits = record['habits']
      next unless habits.is_a?(Hash)

      habits.each_key do |hk|
        next if SHIPPED_HABIT_KEYS.include?(hk)

        add.call('withheld_key', "npc:#{record['id']}/habits.#{hk}", safe_path("#{json_path}.habits.#{hk}"))
      end
    end
  end

  def walk_records(node, path, under_npcs, &block)
    case node
    when Array
      node.each_with_index { |v, i| walk_records(v, "#{path}[#{i}]", under_npcs, &block) }
    when Hash
      yield node, path if node.key?('npcType') || under_npcs
      node.each do |k, v|
        next if k == 'social' && path == '$' # social.characters and social.awareness are not NPC records

        walk_records(v, "#{path}.#{k}", k == 'npcs' && v.is_a?(Array), &block)
      end
    end
  end

  def deliberate_clue?(password, str, holder)
    return true if holder && @clue_holders[password].include?(holder)

    @clue_texts[password].any? { |text| str.include?(text) }
  end

  # A share item's password where that item's content may be: a GET /container answer for its
  # share or a folder in it, a folder's own /unlock answer (as scan_share_content allows), or
  # any route once the item has been served that way (legit). Anywhere else it is a leak.
  def share_clue?(password, str, holder, ctx, json_path, legit)
    @share_clues[password].any? do |entry|
      next false unless (holder && holder == entry[:holder]) || entry[:texts].any? { |text| str.include?(text) }
      next true if legit.include?("share:#{entry[:label]}")
      next true if ctx[:container] && ([entry[:resource]] + entry[:ancestors]).include?(ctx[:container])

      ctx[:unlock] && entry[:ancestors].any? && json_path.start_with?('$.contents[')
    end
  end

  def scan_login_content(body, ctx, legit, add)
    scoped = @items.select { |_, info| info[:scope] }
    return if scoped.empty?

    hits = Hash.new { |h, k| h[k] = [] }
    disclosed = ctx[:keyring] ? held_keyring_disclosure_paths(body) : []
    each_string(body) do |str, json_path|
      next if disclosed.any? { |p| json_path == p || json_path.start_with?("#{p}[") }

      scoped.each do |item_id, info|
        hits[item_id] << json_path if content_match?(str, info[:strings])
      end
    end
    hits.each do |item_id, paths|
      info = scoped[item_id]
      if allowed_login_route?(info, ctx[:container]) || folder_unlock_answer?(info, ctx, paths)
        if info[:scope] == :profile && (ctx[:container] || ctx[:unlock]) && !priv_profile_read_earned?(info[:profile], ctx[:container])
          add.call('profile_admin_read', "item:#{item_id}", safe_path(paths.first))
        end
        legit << item_id
        next
      end
      next if legit.include?(item_id)

      rule = { profile: 'profile_content', stick: 'stick_content' }.fetch(info[:scope], 'signin_content')
      add.call(rule, "item:#{item_id}", safe_path(paths.first))
    end
  end

  # The JSON paths of the `label` and `foundIn` fields on GET /keyring registry entries whose proof
  # holds: the keyring serves them on purpose once the proof holds, so a label equal to a sign-in
  # item's name (a "passwords.txt" note) is not sign-in content. An unheld entry is not exempted
  # (credential_unheld flags it too), and no other field (a file body) is. Empty without a game.
  def held_keyring_disclosure_paths(body)
    entries = keyring_entries_in(body)
    held = credential_proof_held_ids
    return [] if entries.nil? || held.nil?

    paths = []
    entries.each_with_index do |entry, i|
      next unless entry.is_a?(Hash) && entry['source'].to_s == 'registry' && held.include?(entry['id'].to_s)

      paths << "$.entries[#{i}].label" << "$.entries[#{i}].foundIn"
    end
    paths
  end

  # A folder inside a sign-in PC or profile (a locked archive) opened by /unlock: the server
  # answers with the folder's contents only for a session that admits it (/unlock check 1),
  # as GET /container/<folder> would. So an item inside a folder may sit in an /unlock
  # answer's top-level contents. The scanner does not know the answer's target, so a
  # wrongly served folder here is not flagged: access_model_no_password_test.rb covers
  # that class on the server.
  def folder_unlock_answer?(info, ctx, paths)
    ctx[:unlock] && info[:ancestors].any? && paths.all? { |p| p.start_with?('$.contents[') }
  end

  def allowed_login_route?(info, container)
    return false unless container
    return true if info[:ancestors].include?(container)

    return false if info[:scope] == :stick

    info[:scope] == :profile ? @login_pcs.include?(container) : container == info[:pc]
  end

  def scan_locked_content(body, add)
    candidates = @items.select { |_, info| info[:locked_ancestors].any? }
    return if candidates.empty?

    marked = Set.new
    collect_locked_marks(body, marked)
    return if marked.empty?

    candidates.each do |item_id, info|
      next unless info[:locked_ancestors].any? { |id| marked.include?(id) }

      each_string(body) do |str, json_path|
        next unless content_match?(str, info[:strings])

        add.call('locked_content', "item:#{item_id}", safe_path(json_path))
        break
      end
    end
  end

  # A share item's content outside a GET /container answer for its resource or a folder in it.
  # Once served that way, the item may follow (an inventory answer after a Copy or a Move).
  def scan_share_content(body, ctx, legit, add)
    return if @share_items.empty?

    hits = Hash.new { |h, k| h[k] = [] }
    each_string(body) do |str, json_path|
      @share_items.each do |item_id, info|
        hits[item_id] << json_path if info[:strings].any? { |secret| network_match?(str, secret) }
      end
    end
    hits.each do |item_id, paths|
      info = @share_items[item_id]
      allowed = ctx[:container] && ([info[:resource]] + info[:ancestors]).include?(ctx[:container])
      if allowed || folder_unlock_answer?(info, ctx, paths)
        legit << "share:#{item_id}"
        next
      end
      next if legit.include?("share:#{item_id}")

      add.call('share_content', "item:#{item_id}", safe_path(paths.first))
    end
  end

  # A network or resource string outside GET /network, /network/*, /container, the
  # contents of an /unlock answer (the server's other way of serving a container's contents,
  # as GET /container would, for example a held grant item whose file names a share's host)
  # and the footholds block of /scenario. Both container exemptions cover every network
  # string, by design (see the header).
  # ---- order of the plant (E0.3) -------------------------------------------------------------

  # The log's POST /inventory rows: the index of the earliest tagged 200 remove for each
  # [item, used_on]; whether any row carries an `inv` key (a log written after the recorder
  # change); and whether a 200 remove row is untagged (inv null or missing) in such a log.
  # Rows are indexed in the order given, every file in argument order, DOM rows included.
  def prepare_plant_rows(lines)
    @plant_rows = {}
    @plant_rows_any = {}
    rows = []
    lines.each_with_index do |(_source, _line_no, row), index|
      next unless row.is_a?(Hash) && !row.key?('dom')
      next unless row['method'].to_s.upcase == 'POST' && row['path'].to_s.split('?').first.to_s.end_with?('/inventory')

      rows << [index, row]
    end
    tagged = rows.any? { |_i, row| row.key?('inv') }
    @log_mode = if rows.empty? then :no_inventory
    elsif tagged then :tagged
    else :pre
    end
    @untagged_remove = false
    rows.each do |index, row|
      next unless row['status'].to_i == 200

      inv = row['inv']
      if inv.is_a?(Hash) && inv['action'] == 'hide'
        # Plant hiding (PLANT_HIDING_PLAN.md section 7): a 200 hide is the plant of its item when
        # the spot passes HidingSpots for that item, as the server checks it.
        unless inv['itemId'].is_a?(String) && inv['hiddenIn'].is_a?(String)
          @untagged_remove = true
          next
        end
        defn = BreakEscape::HidingSpots.item_defs(@data)[inv['itemId']]
        finder = ->(id) { BreakEscape::HidingSpots.find_object(@data, id) }
        if defn && BreakEscape::HidingSpots.resolve_spot(defn, inv['hiddenIn'], finder)
          @plant_rows[[inv['itemId'], inv['hiddenIn']]] ||= index
          @plant_rows_any[inv['itemId']] ||= index
        end
      elsif inv.is_a?(Hash)
        next unless inv['action'] == 'remove' && inv['usedOn'].is_a?(String)

        # A remove naming an object but no readable item id may have been the plant (t1)
        unless inv['itemId'].is_a?(String)
          @untagged_remove = true
          next
        end

        @plant_rows[[inv['itemId'], inv['usedOn']]] ||= index
        # The earliest plant of the item on any non-jack object, for a proof with no `on` (m2)
        used = @plant_object_by_id[inv['usedOn']]
        # and only an object that takes the item records a plant: the server refuses the rest
        # (object_takes_item?), so a remove on a decoy object is no plant (R2 m1)
        if used.is_a?(Hash) && !BreakEscape::NetworkModel.jack?(used) &&
           BreakEscape::CaptureModel.object_takes_item?(used, BreakEscape::CredentialModel.item_definition(@data, inv['itemId']))
          @plant_rows_any[inv['itemId']] ||= index
        end
      elsif tagged
        # A remove row whose body the recorder could not read may have been the plant. Untagged
        # rows carry no action, so any 200 row with a null or missing tag counts as one
        @untagged_remove = true
      end
    end
  end

  # A planted proof on a room object that is no network jack, or with no `on` (met only by a
  # non-jack plant): the only plants sent as a POST /inventory remove with used_on, so the only
  # ones the log can order
  def order_checked_plant?(proof)
    return false unless BreakEscape::CaptureModel.proof_kind(proof) == 'planted'

    on = proof['on']
    return true if on.nil?
    return false unless on.is_a?(String) && !on.empty?

    obj = @object_by_id[on]
    obj.is_a?(Hash) && !BreakEscape::NetworkModel.jack?(obj)
  end

  # Whether an order-checked plant proof held before the row at index. A pre-change log is not
  # order-checked. A tagged plant row must come first (and, with a game, the proof must hold
  # now). With no plant row: an untagged remove row makes the log unverifiable; otherwise, with
  # a game, the plant predates the log when the proof holds now; without one it is flagged.
  def plant_held_before?(proof, index)
    return true if @log_mode == :pre

    final = @game.nil? || @game.capture_proof_holds?(proof)
    at = proof['on'].nil? ? @plant_rows_any[proof['planted']] : @plant_rows[[proof['planted'], proof['on']]]
    return at < index && final if at
    return false if @untagged_remove || @game.nil?

    final
  end

  # A capture secret on a capture route: one with no proof on some writer keeps the old
  # exemption. Otherwise one of its proofs must have held before the row: an order-checked
  # plant by plant_held_before?, any other kind by the final state with a game (no check
  # without one, as before).
  def capture_secret_served_in_order?(secret, index)
    proofs = capture_secret_proofs(secret)
    return true unless proofs

    proofs.any? do |proof|
      if order_checked_plant?(proof) then plant_held_before?(proof, index)
      else @game.nil? || @game.capture_proof_holds?(proof)
      end
    end
  end

  # An account password on a capture route, for an NPC whose proofs include an order-checked
  # plant: one of its proofs must have held before the row, a plant by plant_held_before? and
  # any other kind by the final state with a game, as the capture secret route does (R1 m1). Other NPCs pass as before.
  def account_proof_held_before?(npc_id, index)
    npc = each_room_npc.find { |n| n['id'].to_s == npc_id }
    return true unless npc

    proofs = BreakEscape::CaptureModel.proofs_for(npc, @data)
    return true unless proofs.any? { |proof| order_checked_plant?(proof) }

    proofs.any? do |proof|
      if order_checked_plant?(proof) then plant_held_before?(proof, index)
      else @game.nil? || @game.capture_proof_holds?(proof)
      end
    end
  end

  def scan_network_strings(body, ctx, add)
    return if @network_strings.empty?
    return if ctx[:network] || ctx[:any_container]

    each_string(body) do |str, json_path, holder|
      next if ctx[:scenario] && json_path.start_with?('$.footholds')
      next if ctx[:unlock] && json_path.start_with?('$.contents[')
      # A network link item is the handle of a foothold the player holds: its label and
      # observations name the network the player has already reached (slice 9.3b W, 5.3),
      # so a network name there is not a leak.
      next if holder.to_s.start_with?('netlink_')
      # Ops log L3 (L3b R1 S1): in a SHARE_OPEN row's LOCATION cell the name of a share this run opened
      # earlier (a successful GET /container/<share or an item in it>) is not a leak: the browser was
      # served that name by the open. Only that owner is dropped; every other owner of the string, any
      # other cell or event, and a share not yet opened stays a finding. A /network listing is no open.
      earned = earned_share_owners(body, json_path, str) if ctx[:log_rows]
      # A NET_SWEEP row's LOCATION cell holds the name of a network this run swept earlier (a 200 POST /network/scan
      # answer said so): the browser was served that name by the sweep. Only that owner is dropped.
      if ctx[:log_rows_ok] && (swept = swept_network_owners(body, json_path, str)).any?
        earned = (earned || []) + swept
      end

      @network_strings.each do |secret, owners|
        next unless network_match?(str, secret)

        owners.each do |owner|
          next if earned&.include?(owner)

          add.call('network_string', owner, safe_path(json_path))
        end
      end
    end
  end

  # The `resource:<id>` owners a SHARE_OPEN row's LOCATION cell may carry: opened earlier, name equal.
  def earned_share_owners(body, json_path, str)
    match = json_path.to_s.match(/\A\$\.rows\[(\d+)\]\.where\z/)
    return nil unless match && body.is_a?(Hash) && body['rows'].is_a?(Array)

    row = body['rows'][match[1].to_i]
    return nil unless row.is_a?(Hash) && row['event'] == 'SHARE_OPEN'

    resources = @data['resources'].is_a?(Hash) ? @data['resources'] : {}
    @shares_opened.select do |id|
      res = resources[id]
      res.is_a?(Hash) && res['name'].is_a?(String) && res['name'].strip == str.to_s.strip
    end.map { |id| "resource:#{id}" }
  end

  # The `network:<id>` owners a NET_SWEEP row's LOCATION cell may carry: swept earlier in this capture, name equal.
  def swept_network_owners(body, json_path, str)
    match = json_path.to_s.match(/\A\$\.rows\[(\d+)\]\.where\z/)
    return [] unless match && body.is_a?(Hash) && body['rows'].is_a?(Array)

    row = body['rows'][match[1].to_i]
    return [] unless row.is_a?(Hash) && row['event'] == 'NET_SWEEP' && row['where'].equal?(str)

    networks = @data['networks'].is_a?(Hash) ? @data['networks'] : {}
    @networks_swept.select do |id|
      net = networks[id]
      net.is_a?(Hash) && net['name'].is_a?(String) && net['name'] == str.to_s
    end.map { |id| "network:#{id}" }
  end

  # Notes a 200 POST /network/scan answer of a sweep: success true, the network's id, swept true.
  def note_network_swept(body, ctx, row)
    return unless ctx[:ops_scan] && row['status'].is_a?(Integer) && row['status'] == 200 && body.is_a?(Hash) && body['success'] == true

    net = body['network']
    @networks_swept << net['id'] if net.is_a?(Hash) && net['swept'] == true && net['id'].is_a?(String)
  end

  # Notes a successful GET /container/<share or an item in it> answer: that share is opened for this run.
  def note_share_opened(body, ctx, row)
    id = ctx[:container]
    return unless id && row['status'].to_i == 200 && body.is_a?(Hash) && body['success'] != false && !body.key?('error')

    resources = @data['resources'].is_a?(Hash) ? @data['resources'] : {}
    # Only a share counts as opened (R2-4): a printer or other resource id earns nothing
    if resources[id].is_a?(Hash) && resources[id]['kind'] == 'file_share'
      @shares_opened << id
      return
    end
    # An item id is read with its share, as a pair; an id held by more than one share cannot be told
    # apart by the request, so it opens none of them
    holders = @share_item_pairs.select { |_resource, item_id| item_id == id }.map(&:first).uniq
    holders = holders.select { |rid| resources[rid].is_a?(Hash) && resources[rid]['kind'] == 'file_share' }
    @shares_opened << holders.first if holders.length == 1
  end

  # ---- ops core S1: discovery and services (OPS_CORE_PLAN.md 11.4) ----------------------------

  # Registers one ops string. `token` strings (addresses, ranges) match as whole tokens.
  def add_ops_string(value, tag, owner, net: nil, host: nil, token: false, usable: nil, step: nil, key: nil)
    return unless usable.call(value)

    list = (@ops_strings[value.strip] ||= [])
    entry = { tag: tag, net: net, host: host, owner: owner, token: token, step: step, key: key }
    list << entry unless list.include?(entry)
  end

  def collect_ops_secrets
    nm = BreakEscape::NetworkModel
    public_strings = room_data_strings
    usable = ->(v) { v.is_a?(String) && v.strip.length >= MIN_NETWORK_STRING && !public_strings.include?(v.strip) }
    service_words = ops_service_words(nm)
    @ops_host_ids = nm.hosts_on_all(@data).map { |rec| rec[:id].to_s }.to_set
    @ops_host_by_label = ops_host_labels(nm)
    @ops_discovery_ids = nm.networks(@data).keys.select { |net_id| nm.discovery?(@data, net_id) }.map(&:to_s).to_set
    collect_ops_findings(nm, usable)
    collect_ops_techniques(nm, usable)
    nm.networks(@data).each do |net_id, net|
      discovery = nm.discovery?(@data, net_id)
      cli = net['cli'].is_a?(Hash) ? net['cli'] : {}
      add_ops_string(cli['range'], :listed, "ops:network:#{net_id}", net: net_id, token: true, usable: usable)
      addresses = cli['hosts'].is_a?(Hash) ? cli['hosts'] : {}
      records = nm.hosts_on(net_id, @data)
      records.each do |rec|
        host_id = rec[:id].to_s
        obj = rec[:object]
        if discovery
          %w[name host].each { |field| add_ops_string(obj[field], :sweep, "ops:host:#{host_id}", net: net_id, host: host_id, usable: usable) }
        elsif rec[:kind].to_s == 'device'
          add_ops_string(obj['name'], :listed, "ops:host:#{host_id}", net: net_id, host: host_id, usable: usable)
        end
        add_ops_address(addresses[host_id], discovery, net_id, host_id, usable)
        collect_ops_services(rec, service_words, usable)
      end
      next unless discovery

      nm.resources_on(net_id, @data).each do |res_id, res|
        %w[name host].each { |field| add_ops_string(res[field], :sweep, "ops:share:#{res_id}", net: net_id, usable: usable) }
        add_ops_address(addresses[res_id.to_s], true, net_id, res_id.to_s, usable)
      end
    end
  end

  # ---- ops core S2: findings (OPS_CORE_PLAN.md 7, 11.4) ---------------------------------------

  def collect_ops_findings(nm, usable)
    linked = Set.new
    (nm.weaknesses(@data) + nm.decoys(@data)).each do |found|
      entry = found[:entry]
      link = entry['realism'].is_a?(String) ? entry['realism'] : nil
      linked << link if link
      collect_ops_finding(found, entry, link, usable)
    end
    collect_ops_catalog_never(linked, usable)
  end

  def collect_ops_finding(found, entry, link, usable)
    fid = found[:finding_id]
    service_key = "#{found[:host_id]}.#{found[:service_name]}"
    owner = "ops:finding:#{fid}"
    @ops_finding_ids << fid.to_s
    check = ->(value, key: nil) { add_ops_string(value, :check, owner, usable: usable, step: service_key, key: key) }
    check.call(entry['summary'])
    check.call(entry['class'], key: 'class')
    check.call(entry['severity'], key: 'severity')
    check.call(fid)
    check.call(found[:id])
    collect_ops_cli(link, service_key, owner, usable)
    if found[:kind] == 'decoy'
      add_ops_string(entry['falseBecause'], :confirm, owner, usable: usable, step: fid)
    else
      collect_ops_needs(entry['needs'], fid, owner, usable)
    end
    collect_ops_globals(entry, owner, usable)
  end

  # The linked entry's strings (check) and its `_` note and the link id (never).
  def collect_ops_cli(link, service_key, owner, usable)
    return unless link

    add_ops_string(link, :never, owner, usable: usable)
    catalog = ops_catalog_entry(link)
    return unless catalog.is_a?(Hash)

    add_ops_string(catalog['_'], :never, owner, usable: usable)
    %w[title module script].each { |field| add_ops_string(catalog[field], :check, owner, usable: usable, step: service_key) }
    %w[advisories output].each do |field|
      Array(catalog[field]).each { |line| add_ops_string(line, :check, owner, usable: usable, step: service_key) }
    end
  end

  # A confirmed finding's authored need label (`needs.label`, on an itemType or global need). A
  # credential's label (in the keyring) and an item's name (on the item) are shown elsewhere before the
  # confirm, so they are not registered (R2 N5); the finding row's own `needs` key is judged structurally
  # (scan_ops_finding_rows), whatever its strings are.
  def collect_ops_needs(needs, fid, owner, usable)
    return unless needs.is_a?(Hash)

    add_ops_string(needs['label'], :confirm, owner, usable: usable, step: fid)
  end

  # A global's name used in `needs.global` or `fixedIf` never reaches the browser, as a string value or as a
  # JSON key (plan section 7: "`fixedIf` and its global: never", and "no ... global name ever"). The one
  # place a name legitimately rides as a key is the top-level `globalVariables` map: the bootstrap sends
  # the declared globals the client holds as ever, and `needs.global` must name a declared global, so
  # every such name is there. A key that is a direct child of the top-level `globalVariables` hash is
  # therefore not judged; a key anywhere else (a finding row, a room, a check answer, a nested
  # `globalVariables`) is. A name that is also room text (a switch that sets it) is not registered as a
  # string, but it is still judged inside any finding row (scan_ops_finding_rows).
  def collect_ops_globals(entry, owner, usable)
    [entry['fixedIf'], (entry['needs'].is_a?(Hash) ? entry['needs']['global'] : nil)].each do |cond|
      names = cond.is_a?(Hash) ? cond.keys : [cond]
      names.each do |name|
        next unless name.is_a?(String) && !name.strip.empty?

        @ops_gating_globals << name.strip
        add_ops_string(name, :never, owner, usable: usable)
        if usable.call(name)
          (@ops_global_names[name.strip] ||= []) << owner
        else
          note = "global #{name.strip} is in room text; judged only inside finding rows"
          @ops_notes << note unless @ops_notes.include?(note)
        end
      end
    end
  end

  def scan_ops_global_keys(body, add)
    return if @ops_global_names.empty?

    each_key_path(body) do |key, json_path|
      (@ops_global_names[key.to_s.strip] || []).uniq.each { |owner| add.call('ops_string', owner, safe_path(json_path)) }
    end
  end

  # Yields every hash key with its JSON path, except a direct child key of the top-level `globalVariables` hash.
  def each_key_path(node, path = '$', &block)
    case node
    when Array then node.each_with_index { |v, i| each_key_path(v, "#{path}[#{i}]", &block) }
    when Hash
      declared = path == '$.globalVariables' # only the bootstrap's (or a sync answer's) top-level map
      node.each do |k, v|
        yield k, "#{path}.#{k}" unless declared
        each_key_path(v, "#{path}.#{k}", &block)
      end
    end
  end

  # The `module` of every catalog entry the scenario does not link is never sent.
  def collect_ops_catalog_never(linked, usable)
    with_ops_catalog do
      BreakEscape::RealismCatalog.entry_ids.each do |id|
        entry = BreakEscape::RealismCatalog.lookup(id)
        next if linked.include?(id) || !entry.is_a?(Hash)

        add_ops_string(entry['module'], :never, "ops:catalog:#{id}", usable: usable)
      end
    end
  end

  def ops_catalog_entry(link)
    with_ops_catalog { BreakEscape::RealismCatalog.lookup(link) }
  end

  def with_ops_catalog(&block)
    return yield unless @catalog_folder

    BreakEscape::RealismCatalog.with_folder(@catalog_folder, &block)
  end

  def add_ops_address(entry, discovery, net_id, host_id, usable)
    return unless entry.is_a?(Hash)

    add_ops_string(entry['address'], discovery ? :sweep : :listed, "ops:address:#{host_id}", net: net_id, host: host_id,
                                                                                         token: true, usable: usable)
  end

  def collect_ops_services(rec, service_words, usable)
    host_id = rec[:id].to_s
    owner = "ops:service:#{host_id}"
    rec[:services].each do |svc|
      %w[product version label].each { |field| add_ops_string(svc[field], :scan, owner, host: host_id, usable: usable) }
      cli = svc['cli'].is_a?(Hash) ? svc['cli'] : {}
      add_ops_string(cli['banner'], :scan, owner, host: host_id, usable: usable)
      word = cli['service']
      add_ops_string(word, :scan, owner, host: host_id, usable: usable) if word.is_a?(String) && service_words[word.strip] == 1
    end
  end

  # How many times each service `name` or `service` word is authored across the scenario: a word
  # that more than one service carries is left out (it appears legitimately once any host is scanned).
  def ops_service_words(nm)
    counts = Hash.new(0)
    hosts = nm.networks(@data).keys.flat_map { |net_id| nm.hosts_on(net_id, @data) }
    hosts.each do |rec|
      rec[:services].each do |svc|
        counts[svc['name'].to_s.strip] += 1
        word = svc['cli'].is_a?(Hash) ? svc['cli']['service'] : nil
        counts[word.strip] += 1 if word.is_a?(String)
      end
    end
    counts
  end

  # Reads the steps a response earns, before the response is judged: a sweep answer earns its
  # network, a host answer earns that host, a GET /network answer earns `listed` for each network
  # block (`id` and `name` together) and each row it shows, and `held` for a row with a session.
  def note_ops_steps(body, ctx, row = {})
    @ops_answer_pc = nil
    @priv_signin_pc = nil
    note_privilege_ends(body, ctx, row)
    note_privilege_read(body, ctx, row)
    return unless body.is_a?(Hash)

    note_privilege_signin(body, ctx, row)
    note_ops_technique_steps(body, ctx, row)
    if ctx[:ops_scan] && body['success'] == true
      @ops_earned << "sweep:#{body['network']['id']}" if body['network'].is_a?(Hash) && body['network']['swept'] == true
      # Only the scan request earns `scan:<host>`: a `scanned: true` on a listed row arrives together with
      # its services, so earning from it would let the leak itself pay for the step.
      @ops_earned << "scan:#{body['host']['id']}" if body['host'].is_a?(Hash) && body['host']['id'].is_a?(String)
    elsif ctx[:ops_check] && body['success'] == true
      @ops_earned << "check:#{body['hostId']}.#{body['service']}" if body['hostId'].is_a?(String) && body['service'].is_a?(String)
    elsif ctx[:ops_confirm] && body['success'] == true
      @ops_earned << "confirm:#{body['finding']['id']}" if body['finding'].is_a?(Hash) && body['finding']['id'].is_a?(String)
    elsif ctx[:network_view]
      ops_each_hash(body) do |hash|
        next unless hash['id'].is_a?(String)

        @ops_earned << "listed:#{hash['id']}" if hash.key?('name') || hash.key?('kind')
        @ops_earned << "held:#{hash['id']}" if hash['kind'] == 'pc' && hash['session']
      end
    end
  end

  def ops_each_hash(node, &block)
    case node
    when Array then node.each { |v| ops_each_hash(v, &block) }
    when Hash
      yield node
      node.each_value { |v| ops_each_hash(v, &block) }
    end
  end

  def ops_earned?(entry)
    case entry[:tag]
    when :sweep then @ops_earned.include?("sweep:#{entry[:net]}") || @ops_earned.include?("held:#{entry[:host]}")
    when :scan then @ops_earned.include?("scan:#{entry[:host]}")
    when :check then @ops_earned.include?("check:#{entry[:step]}")
    when :confirm then @ops_earned.include?("confirm:#{entry[:step]}")
    when :listed then @ops_earned.include?("listed:#{entry[:host] || entry[:net]}")
    when :card then @ops_earned.include?("card:#{entry[:step]}")
    when :grant then @ops_earned.include?("granted:credential:#{entry[:step]}")
    else false
    end
  end

  def ops_match?(str, secret, entry)
    s = str.strip
    return s == secret if entry[:key]
    return s.match?(/(?<![0-9])#{Regexp.escape(secret)}(?![0-9]|\.[0-9])/) if entry[:token]

    network_match?(s, secret)
  end

  # An entry with a `key` judges only the value of that key.
  # A held card's `worksOn.class` (in GET /network's `techniques` map) is a class word the card shows from the
  # moment it is held; that map is judged structurally (scan_ops_techniques), not by this string rule.
  def ops_entry_applies?(entry, json_path)
    return false if entry[:key] == 'class' && json_path.start_with?('$.techniques.')

    entry[:key].nil? || json_path.end_with?(".#{entry[:key]}")
  end

  # A string is a leak when none of its entries is earned yet, or (a `listed` string) when the
  # answer is not a /network answer at all. A string several hosts share is clear once any is earned.
  def scan_ops_strings(body, ctx, add)
    return if @ops_strings.empty?

    each_string(body) do |str, json_path, holder|
      next if holder.to_s.start_with?('netlink_')

      @ops_strings.each do |secret, all_entries|
        entries = all_entries.select { |e| ops_entry_applies?(e, json_path) && ops_match?(str, secret, e) }
        next if entries.empty?

        early = entries.reject { |e| ops_earned?(e) }
        listed_outside = entries.select { |e| e[:tag] == :listed && ops_earned?(e) && !ctx[:network] }
        leaking = early.size == entries.size ? early : listed_outside
        leaking.each { |e| add.call('ops_string', e[:owner], safe_path(json_path)) }
      end
    end
  end

  # Structural rule (R3-1): a hash whose id is a known host and that carries a `services` key, or
  # `scanned: true`, is a leak before that host's scan, whatever its strings are (a port number or a
  # short name is not a distinctive string). Earned only by a successful scan answer.
  def scan_ops_services(body, add)
    return if @ops_host_ids.empty?

    ops_each_hash(body) do |hash|
      id = hash['id']
      next unless id.is_a?(String) && @ops_host_ids.include?(id)
      next unless hash.key?('services') || hash['scanned'] == true
      next if @ops_earned.include?("scan:#{id}")

      add.call('ops_string', "ops:service:#{id}", '$.services')
    end
  end

  # R3-7 (a): section 7, `hosts` and `services` are never in the bootstrap or room data. A top-level `hosts` key
  # and a `services` key anywhere in a GET /scenario or GET /room answer are a leak by name (the server deletes
  # them: WITHHELD_SCENARIO_KEYS and WITHHELD_OBJECT_FIELDS).
  def scan_ops_room_keys(body, ctx, add)
    return unless (ctx[:scenario] || ctx[:room]) && body.is_a?(Hash)

    add.call('ops_string', 'ops:key:hosts', '$.hosts') if body.key?('hosts')
    each_key_path(body) do |key, json_path|
      add.call('ops_string', 'ops:key:services', safe_path(json_path)) if key.to_s == 'services'
    end
  end

  # R3-7 (b): a discovery network lists no host and carries no `ops` key until it is swept (section 5.2; the
  # server's network_blocks gives it `hosts: []`, `swept: false`, and only the PCs the player holds a session on).
  # In any answer, a block (a hash with the id of a discovery network and a `hosts` list) with no `sweep:<id>`
  # earned may carry: no `ops` key, no `services` or nested `hosts` key in a row, and only rows of PCs held
  # (`held:<id>`), whatever their strings are.
  def scan_ops_unswept_blocks(body, add)
    return if @ops_discovery_ids.empty?

    ops_each_hash(body) do |block|
      net = block['id']
      next unless net.is_a?(String) && @ops_discovery_ids.include?(net) && block['hosts'].is_a?(Array)
      next if @ops_earned.include?("sweep:#{net}")

      owner = "ops:network:#{net}"
      add.call('ops_string', owner, '$.ops') if block.key?('ops')
      block['hosts'].each do |row|
        next unless row.is_a?(Hash)

        add.call('ops_string', owner, '$.hosts') unless @ops_earned.include?("held:#{row['id']}")
        add.call('ops_string', owner, '$.hosts.services') if row.key?('services') || row.key?('hosts')
      end
    end
  end

  # Keys the plan's section 7 says no answer ever carries, wherever they nest (M2 a). No string test.
  OPS_NEVER_KEYS = %w[fixedIf grants realism weaknesses decoys].freeze

  # The keys a finding row may carry before its confirm (ops_finding_row: the unconfirmed set, plus `cli`
  # from the check).
  OPS_UNCONFIRMED_KEYS = %w[id alias hostId service class severity summary status cli].freeze

  def scan_ops_never_keys(body, add)
    each_key_path(body) do |key, json_path|
      add.call('ops_string', "ops:key:#{key}", safe_path(json_path)) if OPS_NEVER_KEYS.include?(key.to_s)
    end
  end

  # Structural rules on a hash whose `id` is a known finding id (M1, M2 b), whatever its strings are.
  # Before `confirm:<id>` the row may carry only the unconfirmed key set and the status `unconfirmed`
  # (`needs`, `fixed`, `falseBecause` or a settled status is the "which one is real" leak). A gating
  # global's name, as a value or a key anywhere under the row, is a leak at any stage, even when the
  # name is public in room text.
  def scan_ops_finding_rows(body, add)
    return if @ops_finding_ids.empty?

    ops_each_hash(body) do |hash|
      id = hash['id']
      next unless id.is_a?(String) && @ops_finding_ids.include?(id)

      owner = "ops:finding:#{id}"
      early = !@ops_earned.include?("confirm:#{id}")
      add.call('ops_string', owner, '$.finding') if early && ops_row_settled?(hash)
      add.call('ops_string', owner, '$.finding') if ops_row_names_global?(hash)
      add.call('ops_string', owner, '$.finding') if ops_row_technique?(hash) || ops_row_shape_bad?(hash)
    end
  end

  # S3: a finding row never names a technique (an id, or a `technique`, `itemId` or `worksOn` key), and its
  # keys and `needs` rows are the known sets (a need row is `kind`, `label` and `met`; a `session` need is a
  # row of kind `session`, never a `session` key).
  def ops_row_technique?(node)
    case node
    when String then @ops_techniques.key?(node.strip)
    when Array then node.any? { |v| ops_row_technique?(v) }
    when Hash
      node.any? { |k, v| %w[technique techniques itemId worksOn].include?(k.to_s) || @ops_techniques.key?(k.to_s.strip) || ops_row_technique?(v) }
    else false
    end
  end

  def ops_row_shape_bad?(hash)
    return true unless (hash.keys.map(&:to_s) - OPS_FINDING_ROW_KEYS).empty?

    needs = hash['needs']
    return false unless hash.key?('needs')
    return true unless needs.is_a?(Array)

    needs.any? { |n| !n.is_a?(Hash) || !(n.keys.map(&:to_s) - OPS_NEED_ROW_KEYS).empty? || !OPS_NEED_KINDS.include?(n['kind']) }
  end

  def ops_row_settled?(hash)
    (hash.keys.map(&:to_s) - OPS_UNCONFIRMED_KEYS).any? || (hash.key?('status') && hash['status'] != 'unconfirmed')
  end

  def ops_row_names_global?(node)
    return false if @ops_gating_globals.empty?

    case node
    when String then @ops_gating_globals.include?(node.strip)
    when Array then node.any? { |v| ops_row_names_global?(v) }
    when Hash then node.any? { |k, v| @ops_gating_globals.include?(k.to_s.strip) || ops_row_names_global?(v) }
    else false
    end
  end

  # ---- ops core S3: technique cards and sessions (OPS_CORE_PLAN.md 7, 11.4) --------------------

  # The keys a technique answer may carry (section 5.4): a grant of a session, of a credential, or a refusal.
  OPS_TECHNIQUE_SUCCESS_KEYS = %w[success grant session keyringChanged already endedPcIds].freeze
  OPS_TECHNIQUE_REFUSAL_KEYS = %w[success reason need].freeze
  OPS_NEED_ROW_KEYS = %w[kind label met].freeze
  OPS_NEED_KINDS = %w[credential item itemType session global].freeze
  OPS_FINDING_ROW_KEYS = (OPS_UNCONFIRMED_KEYS + %w[needs fixed falseBecause]).freeze
  # A session answer (login_session_answer): no `technique` (the finding id) and no foothold's name.
  OPS_SESSION_KEYS = %w[npcId username displayName via portrait avatar access remote footholdId host].freeze
  # The entry of the held-card map in GET /network (ops_held_techniques).
  OPS_HELD_TECHNIQUE_KEYS = %w[name summary worksOn itemId].freeze
  OPS_SESSION_FREE_ROUTES = %i[ops_scan ops_check ops_confirm].freeze

  # The item id a successful, tagged POST /inventory `add` row names (the recorder's `inv` tag), or nil.
  def ops_inventory_add_id(row, method, path)
    return nil unless method == 'POST' && path.end_with?('/inventory') && row['status'].to_i == 200

    inv = row['inv']
    inv.is_a?(Hash) && inv['action'] == 'add' && inv['itemId'].is_a?(String) ? inv['itemId'] : nil
  end

  # The registry, the cards that carry its keys (tag `card`: earned when the card item is held, by an
  # inventory add answer, the starting inventory or `ops_steps: ["card:<technique id>"]`), the granted
  # credentials' ids and labels (tag `grant`: earned by a successful credential grant answer), and the
  # registry ids no item carries (never). A product or version a technique works on is a card string too: the
  # card shows it before any scan, so a `scan` entry for the same string is cleared once the card is held
  # (a string is clear once any owner is earned), and the services structural rule still covers a row.
  def collect_ops_techniques(nm, usable)
    @ops_techniques = nm.techniques(@data)
    carried = Set.new
    nm.technique_items(@data).each do |found|
      item = found[:item]
      key = item['technique_card']
      next unless key.is_a?(String) && @ops_techniques.key?(key)

      carried << key
      @ops_card_items[item['id'].to_s] = key if item['id'].is_a?(String)
      next unless found[:home] == 'start'

      @ops_start_steps << "card:#{key}"
      @ops_start_steps << "card_item:#{item['id']}" if item['id'].is_a?(String)
    end
    @ops_techniques.each do |tid, entry|
      owner = "ops:technique:#{tid}"
      %w[name summary].each { |field| add_ops_string(entry[field], :card, owner, usable: usable, step: tid) }
      works = entry['worksOn'].is_a?(Hash) ? entry['worksOn'] : {}
      add_ops_string(works['product'], :card, owner, usable: usable, step: tid)
      Array(works['versions']).each { |version| add_ops_string(version, :card, owner, usable: usable, step: tid) }
      add_ops_string(tid, :never, owner, usable: usable) unless carried.include?(tid)
    end
    collect_ops_grants(nm, usable)
  end

  # `grants.credential` names a registry credential: its id and label reach the browser only in the keyring,
  # once the grant has happened. (A session grant's account is an NPC id, public in room data.) Each is owned by
  # its finding, and its step is that finding's own grant (`granted:credential:<finding id>`): a grant of
  # another finding releases nothing here. Every granting weakness is also listed for note_ops_technique_steps.
  def collect_ops_grants(nm, usable)
    registry = BreakEscape::CredentialModel.registry(@data)
    nm.weaknesses(@data).each do |found|
      grants = found[:entry]['grants']
      next unless grants.is_a?(Hash)

      owner = "ops:grant:#{found[:finding_id]}"
      if grants['session'].is_a?(Hash)
        collect_ops_session_grant(found, grants['session'])
        next
      end
      id = grants['credential']
      next unless id.is_a?(String)

      @ops_grant_findings << { finding_id: found[:finding_id], kind: 'credential', credential: id }
      add_ops_string(id, :grant, owner, usable: usable, step: found[:finding_id])
      add_ops_string(registry[id]['label'], :grant, owner, usable: usable, step: found[:finding_id]) if registry[id].is_a?(Hash)
    end
  end

  def collect_ops_session_grant(found, session)
    pc = found[:host].is_a?(Hash) ? found[:host][:object] : nil
    label = pc.is_a?(Hash) ? (pc['host'].presence || pc['name']) : nil
    @ops_grant_findings << { finding_id: found[:finding_id], kind: 'session', host_id: found[:host_id].to_s, host_label: label,
                             account: session['account'].to_s, access: session['access'] == 'admin' ? 'admin' : 'user' }
  end

  # Steps earned from the real routes' successful answers: an inventory add of a card item (`card:<technique id>`
  # and `card_item:<item id>`), and a technique answer's grant, earned PER THING (N-13-1, N-13-2): a credential
  # by its finding (`granted:credential:<finding id>`), a session by its host (`session:<pc id>`), the foothold
  # it came through (`through:<pc id>:<foothold id>`) and an admin level (`admin:<pc id>`).
  # The finding comes from the request (`row['tech']['findingId']`, a recorder tag), or, while the recorder does not
  # tag it, from the answer: the grants of that kind and, for a session, the answer's account, host label and level,
  # narrowed to the findings confirmed in this log and not granted yet; a grant is earned only when exactly one
  # finding is left (fail closed: with several, nothing is earned and the caller names the step in `ops_steps`).
  def note_ops_technique_steps(body, ctx, row = {})
    key = ctx[:inventory_add]
    if key && body['success'] == true && @ops_card_items.key?(key)
      @ops_earned << "card:#{@ops_card_items[key]}"
      @ops_earned << "card_item:#{key}"
    end
    return unless ctx[:ops_technique] && body['success'] == true

    grant = body['grant']
    return unless %w[session credential].include?(grant)

    found = ops_granted_finding(body, row)
    return unless found

    if grant == 'credential'
      @ops_earned << "granted:credential:#{found[:finding_id]}"
    else
      note_ops_session_grant(found, body['session'])
    end
  end

  def note_ops_session_grant(found, session)
    return unless session.is_a?(Hash)

    pc = found[:host_id]
    @ops_answer_pc = pc
    @ops_earned << "session:#{pc}"
    @ops_session_accounts[pc] = session['npcId'].to_s
    # R4-6: a new session is not the one an earlier downgrade or deadline was about
    @priv_resumable.delete(pc)
    @priv_deadlines.delete(pc)
    @priv_logout_pending.delete(pc)
    @priv_kinds[pc] = priv_kind_of(session)
    @ops_earned.delete_if { |step| step.start_with?("through:#{pc}:") || step == "admin:#{pc}" }
    @ops_earned << "through:#{pc}:#{session['footholdId']}" if session['footholdId'].is_a?(String)
    @ops_earned << "admin:#{pc}" if session['access'] == 'admin'
    @priv_kinds.delete(pc) unless session['access'] == 'admin'
  end

  def ops_granted_finding(body, row)
    tag = row['tech'].is_a?(Hash) ? row['tech']['findingId'] : nil
    kind = body['grant']
    pool = @ops_grant_findings.select { |f| f[:kind] == kind }
    return pool.find { |f| f[:finding_id] == tag } if tag.is_a?(String)
    return nil if body['already'] == true

    session = body['session']
    if kind == 'session'
      return nil unless session.is_a?(Hash)

      level = session['access'] == 'admin' ? 'admin' : 'user'
      pool = pool.select { |f| f[:account] == session['npcId'].to_s && f[:host_label] == session['host'] && f[:access] == level }
      # Fail closed (R3-1): findings on more than one PC fit this answer (two PCs share a host label), and a session
      # can be granted afresh after a sign-out, so "not granted yet" cannot tell them apart. Credit nothing.
      return nil if pool.map { |f| f[:host_id] }.uniq.size > 1
    end
    pool = pool.select { |f| ops_unused_confirmed?(f, kind) } if pool.size > 1
    pool.size == 1 ? pool.first : nil
  end

  # Confirmed in this log (or named by the caller) and not granted yet.
  def ops_unused_confirmed?(found, kind)
    return false unless @ops_earned.include?("confirm:#{found[:finding_id]}")

    kind == 'credential' ? !@ops_earned.include?("granted:credential:#{found[:finding_id]}") : !@ops_earned.include?("session:#{found[:host_id]}")
  end

  # The `techniques` key: only GET /network's top-level map, only for a held card, only the held-card keys;
  # anywhere else the registry is leaking (it is deleted from the bootstrap and room data by name, section 7).
  # `worksOn` outside that map is a registry key too.
  def scan_ops_techniques(body, ctx, add)
    each_key_path(body) do |key, json_path|
      if key.to_s == 'techniques' && !(ctx[:network_view] && json_path == '$.techniques')
        add.call('ops_string', 'ops:key:techniques', safe_path(json_path))
      elsif key.to_s == 'worksOn' && !(ctx[:network_view] && json_path.match?(/\A\$\.techniques\.[^.\[]+\.worksOn\z/))
        add.call('ops_string', 'ops:key:worksOn', safe_path(json_path))
      end
    end
    return unless ctx[:network_view] && body.is_a?(Hash) && body['techniques'].is_a?(Hash)

    body['techniques'].each do |tid, entry|
      add.call('ops_string', "ops:technique:#{tid}", safe_path("$.techniques.#{tid}")) unless ops_held_technique_entry?(tid, entry)
    end
  end

  # A held-card entry is one the player holds a card for, with only its keys, and an `itemId` that is an item
  # carrying that very registry key.
  def ops_held_technique_entry?(tid, entry)
    return false unless @ops_techniques.key?(tid.to_s) && @ops_earned.include?("card:#{tid}") && entry.is_a?(Hash)
    return false unless (entry.keys.map(&:to_s) - OPS_HELD_TECHNIQUE_KEYS).empty?

    item = entry['itemId'].to_s
    @ops_card_items[item] == tid.to_s && (@ops_earned.include?("card_item:#{item}") || @ops_supplied.include?("card:#{tid}"))
  end

  # The shape of a POST /network/technique answer: a grant carries `grant` and the session (or
  # `keyringChanged`) and nothing else; a refusal carries `success`, `reason` and at most a `need` of
  # `kind` and `label`; a `no_grant` refusal carries `reason` and nothing else.
  def scan_ops_technique_answer(body, ctx, add)
    return unless ctx[:ops_technique] && body.is_a?(Hash)

    ok = body['success'] == true ? ops_technique_success_ok?(body) : ops_technique_refusal_ok?(body)
    add.call('ops_string', 'ops:technique:answer', '$') unless ok
  end

  def ops_technique_success_ok?(body)
    return false unless (body.keys - OPS_TECHNIQUE_SUCCESS_KEYS).empty?

    session = body['session']
    case body['grant']
    when 'session'
      session.is_a?(Hash) && (session.keys - OPS_SESSION_KEYS).empty? && !body.key?('keyringChanged')
    when 'credential'
      !body.key?('session') && !body.key?('endedPcIds')
    else false
    end
  end

  def ops_technique_refusal_ok?(body)
    return false unless (body.keys - OPS_TECHNIQUE_REFUSAL_KEYS).empty?
    return false if body['reason'] == 'no_grant' && body.key?('need')

    need = body['need']
    need.nil? || (need.is_a?(Hash) && (need.keys - %w[kind label]).empty?)
  end

  # Like ops_each_hash, with the host a hash belongs to: the nearest enclosing hash's `id`, or a map key that is a
  # known host id (the bootstrap's `sessions` map is keyed by PC). Yields (hash, host id or nil).
  def ops_each_hash_owned(node, owner = nil, &block)
    case node
    when Array then node.each { |v| ops_each_hash_owned(v, owner, &block) }
    when Hash
      own = node['id'].is_a?(String) ? node['id'] : owner
      yield node, own
      node.each do |key, value|
        ops_each_hash_owned(value, value.is_a?(Hash) && @ops_host_ids.include?(key.to_s) ? key.to_s : own, &block)
      end
    end
  end

  # Session-record keys outside the answers that carry them (section 7). `technique` (the finding id that
  # granted a session) is never sent. `via: "technique"` is sent on a host row, in the session answer and in
  # the reloaded sessions once a technique session was granted AT THAT HOST (`session:<pc id>`; the technique
  # answer's own session is judged against the host it just granted), never in a scan, check or confirm answer.
  # `access` is sent only as "admin", and only once an admin technique session was granted at that host
  # (`admin:<pc id>`). `openHere` is judged by foothold (scan_ops_foothold_views).
  def scan_ops_session_keys(body, ctx, add)
    ops_each_hash_owned(body) do |hash, owner|
      owner ||= ops_session_owner(hash, ctx)
      add.call('ops_string', 'ops:key:technique', '$') if hash.key?('technique')
      if hash['via'] == 'technique' && (owner.nil? || !@ops_earned.include?("session:#{owner}") || OPS_SESSION_FREE_ROUTES.any? { |r| ctx[r] })
        add.call('ops_string', 'ops:key:via', '$')
      end
      next unless hash.key?('access')

      level = hash['access']
      scalar = !level.is_a?(Hash) && !level.is_a?(Array)
      add.call('ops_string', 'ops:key:access', '$') if scalar && (level != 'admin' || owner.nil? || !@ops_earned.include?("admin:#{owner}"))
      # R4-2a: the server never gives a claim or a relay session admin, wherever the answer shows one
      add.call('ops_string', 'ops:key:access', '$') if level == 'admin' && (hash['via'] == 'claim' || hash['relay'] == true)
    end
  end

  # The host a session answer (`login_session_answer`: no `id`, a `host` label) belongs to: the PC whose label it
  # names (a technique answer, `already` or not, and a container answer both carry it; a label two PCs share
  # names none), else the host the grant answer just judged. nil when none resolves, which the rules below
  # treat as unearned (fail closed).
  def ops_session_owner(hash, ctx)
    label = hash['host']
    by_label = label.is_a?(String) && (hash.key?('via') || hash.key?('access')) ? @ops_host_by_label[label] : nil
    return by_label if by_label

    return @ops_answer_pc if ctx[:ops_technique]
    return @priv_signin_pc if ctx[:login]

    # a keyboard desktop's answer (GET /container/<pc id>) carries the session's level and no host label; a label that
    # names no PC still fails closed
    @priv_active && @priv_pcs.key?(ctx[:container].to_s) && !hash.key?('host') ? ctx[:container].to_s : nil
  end

  # Host label => the one PC id that carries it. Built over every sign-in object, networked or not, and every
  # host device, so a label two PCs share (or an off-network PC sharing one with a networked PC) names no PC.
  def ops_host_labels(nm)
    labels = Hash.new { |h, k| h[k] = [] }
    objects = nm.hosts_on_all(@data).map { |rec| [rec[:id], rec[:object]] }
    objects += nm.room_objects(@data).select { |entry| nm.sign_in_object?(entry[:object]) }.map { |entry| [entry[:object]['id'], entry[:object]] }
    objects.each do |id, pc|
      label = pc.is_a?(Hash) ? (pc['host'].presence || pc['name']) : nil
      labels[label] << id.to_s if label.is_a?(String)
    end
    labels.select { |_, ids| ids.uniq.size == 1 }.transform_values(&:first)
  end

  # `openHere` on a session is sent only in the view of the foothold a technique session came through, for
  # that host (`through:<pc id>:<foothold id>`, earned from a grant answer's `footholdId`), and so is a session
  # listed on a host that blocks remote sign-in (`remoteSignIn: false`).
  def scan_ops_foothold_views(body, ctx, add)
    return unless body.is_a?(Hash)

    outside = ctx[:network_view] && body['footholds'].is_a?(Array) ? body.reject { |k, _| k == 'footholds' } : body
    ops_each_hash(outside) { |hash| add.call('ops_string', 'ops:key:openHere', '$') if hash.key?('openHere') }
    return unless outside != body

    body['footholds'].each do |entry|
      next unless entry.is_a?(Hash)

      ops_each_hash_owned(entry) do |hash, owner|
        own = entry['id'].is_a?(String) && owner && @ops_earned.include?("through:#{owner}:#{entry['id']}")
        add.call('ops_string', 'ops:key:openHere', '$.footholds') if hash.key?('openHere') && !own
        add.call('ops_string', 'ops:host_row', '$.footholds') if !own && hash['session'].is_a?(Hash) && hash['remoteSignIn'] == false
      end
    end
  end

  # ---- ops privilege S5a: admin sessions, the owner's profile, the admin-read row (unit 16) ----------

  # The facts the privilege rules need, read from the scenario alone. The rules run only when the scenario has an
  # account marked `creds.admin: true` or a technique grant at `access: "admin"` (an older scenario's log is judged as before).
  def collect_privilege
    BreakEscape::Game.scenario_room_npcs(@data).each do |npc|
      next unless npc.is_a?(Hash) && npc['id'].is_a?(String)

      @priv_npcs[npc['id']] = npc
      @priv_admins << npc['id'] if npc['creds'].is_a?(Hash) && npc['creds']['admin'] == true
    end
    @login_pcs.each { |id| @priv_pcs[id] = @object_by_id[id] if @object_by_id[id].is_a?(Hash) }
    profiles = @data['accountProfiles'].is_a?(Hash) ? @data['accountProfiles'] : {}
    profiles.each do |profile_id, profile|
      next unless profile.is_a?(Hash)

      @priv_profiles[profile_id.to_s] = profile['for']
      note_priv_folders(profile['contents'], profile_id.to_s)
    end
    @priv_active = !@priv_admins.empty? || @ops_grant_findings.any? { |f| f[:kind] == 'session' && f[:access] == 'admin' }
  end

  def note_priv_folders(list, profile_id)
    Array(list).each do |item|
      next unless item.is_a?(Hash) && item['contents'].is_a?(Array)

      @priv_folder_profile[item['id'].to_s] = profile_id if item['id']
      note_priv_folders(item['contents'], profile_id)
    end
  end

  def priv_acl_admits?(acl, npc_id)
    npc = @priv_npcs[npc_id.to_s]
    npc ? BreakEscape::AccessIdentities.acl_admits?(acl, npc) : false
  end

  # The PC owner's NPC id, as Game#login_pc_owner reads it (the explicit `owner` only).
  def priv_owner(pc_id)
    owner = @priv_pcs[pc_id.to_s]&.dig('owner')
    owner.is_a?(String) && @priv_npcs.key?(owner) ? owner : nil
  end

  # The PCs that could be the one a sign-in answer is about: the recorder's `login` tag if a log has one, the answer's host
  # label (a remote sign-in), the caller's `signins:` entry for THIS sign-in row (account, PC, and the row's order among that
  # account's sign-ins or its time), else the one PC that admits the account. Returns [pcs, exact]: exact only for one named
  # PC. A host label that names no PC never falls through to a guess (R2-C5): nothing is earned. The browser capture holds
  # neither the request body nor a PC id in a keyboard sign-in answer, so with more than one admitting PC and no entry
  # nothing is earned (fail closed).
  def priv_signin_candidates(body, row)
    npc_id = body['npcId'].to_s
    npc = @priv_npcs[npc_id]
    admitting = @priv_pcs.select { |_, pc| npc && BreakEscape::CredentialModel.pc_admits_account?(pc, npc) }.keys
    tag = row['login'].is_a?(Hash) ? row['login']['pcId'] : nil
    return [[tag], true] if tag.is_a?(String) && @priv_pcs.key?(tag)

    label = body['host']
    if label.is_a?(String)
      by_label = @ops_host_by_label[label]
      return by_label && @priv_pcs.key?(by_label) ? [[by_label], true] : [admitting, false]
    end

    key = [[npc_id, :n, @priv_signin_counts[npc_id]], (row['t'].is_a?(String) ? [npc_id, :t, row['t']] : nil)].compact.find { |k| @priv_named.key?(k) }
    if key
      named = @priv_named[key]
      # R3-C1: a PC that does not admit the account cannot be where it signed in: refuse, never take it on trust
      unless admitting.include?(named)
        raise ArgumentError, "sign-in entry #{priv_entry_text(key, named)}: #{named} does not admit #{npc_id} (it admits: #{admitting.join(', ').then { |l| l.empty? ? 'no PC' : l }})"
      end

      @priv_used << [:signin, key]
      @priv_last_named = named
      return [[named], true]
    end

    [admitting, admitting.size == 1]
  end

  # `signins:` entries, "<account id>@<pc id>#<n>" (the account's n-th successful POST /login answer in the log, counting from
  # 1 over EVERY successful answer of the account, remote and relay ones included, across every file) or
  # "<account id>@<pc id>@<row time>" (the row's `t`). Each credits that ONE row, that account and that PC. Strict (R3-C2): n is a
  # plain positive number, the account and the PC are ones of the scenario, and no two entries share a key.
  def parse_priv_signins(list)
    named = {}
    Array(list).each do |entry|
      account, pc, kind, key = entry.to_s.match(/\A([^@#\s]+)@([^@#\s]+)([#@])(\S+)\z/)&.captures
      raise ArgumentError, "bad sign-in entry #{entry.inspect}: use <account id>@<pc id>#<n> or <account id>@<pc id>@<row time>" unless account
      raise ArgumentError, "bad sign-in entry #{entry.inspect}: n must be a whole number from 1 (no trailing text)" if kind == '#' && !key.match?(/\A[1-9]\d*\z/)

      check_priv_entry_names(entry, account, pc)
      full = [account, kind == '#' ? :n : :t, kind == '#' ? key.to_i : key]
      raise ArgumentError, "sign-in entry #{entry.inspect} is given twice (or names the same row as an earlier entry)" if named.key?(full)

      named[full] = pc
    end
    named
  end

  # `resumes:` entries, "<account id>@<pc id>@<row time>" (R3-B1): ONE 200 desktop answer of that PC after a 403 `off` or
  # `not_responding` there, whose session is the account held when the 403 came, with no other end in between. It restores the
  # admin step (and the account) from that row only.
  def parse_priv_resumes(list)
    named = {}
    Array(list).each do |entry|
      account, pc, time = entry.to_s.match(/\A([^@#\s]+)@([^@#\s]+)@(\S+)\z/)&.captures
      raise ArgumentError, "bad resume entry #{entry.inspect}: use <account id>@<pc id>@<row time>" unless account

      check_priv_entry_names(entry, account, pc)
      raise ArgumentError, "resume entry #{entry.inspect} is given twice" if named.key?([account, pc, time])

      named[[account, pc, time]] = true
    end
    named
  end

  # `logouts:` entries (`--logout`), "<account id>@<pc id>#<n>" (the n-th successful POST /logout answer in the log) or
  # "<account id>@<pc id>@<row time>": a logout answer does not say which PC it was at (the capture holds no request body), so
  # unnamed it ends every PC. A named one ends that PC only, and only if the run holds that account at that PC when the row
  # comes; otherwise the entry is unused (exit 2) and the row ends every PC as before.
  def parse_priv_logouts(list)
    named = {}
    Array(list).each do |entry|
      account, pc, kind, key = entry.to_s.match(/\A([^@#\s]+)@([^@#\s]+)([#@])(\S+)\z/)&.captures
      raise ArgumentError, "bad logout entry #{entry.inspect}: use <account id>@<pc id>#<n> or <account id>@<pc id>@<row time>" unless account
      raise ArgumentError, "bad logout entry #{entry.inspect}: n must be a whole number from 1 (no trailing text)" if kind == '#' && !key.match?(/\A[1-9]\d*\z/)

      check_priv_entry_names(entry, account, pc)
      full = [account, kind == '#' ? :n : :t, kind == '#' ? key.to_i : key]
      raise ArgumentError, "logout entry #{entry.inspect} is given twice (or names the same row as an earlier entry)" if named.key?(full)

      named[full] = pc
    end
    named
  end

  def priv_logout_text(key, pc)
    account, kind, value = key
    "#{account}@#{pc}#{kind == :n ? '#' : '@'}#{value} (--logout)"
  end

  # The PCs a successful POST /logout row ends: the one a `--logout` entry names for THIS row if the run holds that account
  # there, else every PC (fail closed).
  def priv_logout_pcs(row)
    @priv_logout_count += 1
    @priv_logouts.each do |key, pc|
      account, kind, value = key
      this_row = kind == :n ? value == @priv_logout_count : value == row['t']
      next unless this_row && @ops_session_accounts[pc] == account && !@priv_used.include?([:logout, key])

      @priv_used << [:logout, key]
      @priv_logout_pending[pc] = account
      return [pc]
    end
    @priv_pcs.keys
  end

  def check_priv_entry_names(entry, account, pc)
    raise ArgumentError, "entry #{entry.inspect}: #{account} is not an account of this scenario" unless @priv_npcs.key?(account)
    raise ArgumentError, "entry #{entry.inspect}: #{pc} is not a sign-in PC of this scenario (#{@priv_pcs.keys.join(', ')})" unless @priv_pcs.key?(pc)
  end

  def priv_entry_text(key, pc)
    account, kind, value = key
    "#{account}@#{pc}#{kind == :n ? '#' : '@'}#{value} (--signin)"
  end

  # A successful sign-in answer (typed or keyring) puts that account at that PC and takes any earlier admin step at the
  # PC back; it earns `admin:<pc>` only for an account marked creds.admin, at a PC that admits it, as a password or
  # credential session that is not a relay, and only when the PC is known for certain.
  def note_privilege_signin(body, ctx, row)
    return unless @priv_active && ctx[:login] && body['success'] == true && body['npcId'].is_a?(String)

    @priv_signin_counts[body['npcId']] += 1
    @priv_last_named = nil
    pcs, exact = priv_signin_candidates(body, row)
    @priv_signin_pc = pcs.first if exact
    # R4-7: a named keyboard sign-in is checked against the desktop answer that follows it
    @priv_signin_pending = nil if @priv_signin_pending && @priv_signin_pending[:account] == body['npcId']
    @priv_signin_pending = { account: body['npcId'], pc: @priv_last_named } if @priv_last_named && body['via'] == 'password' && !body['remote']
    pcs.each do |pc|
      @ops_earned.delete("admin:#{pc}")
      @priv_deadlines.delete(pc)
      @priv_resumable.delete(pc)
      @priv_kinds.delete(pc)
      @priv_logout_pending.delete(pc)
      exact ? @ops_session_accounts[pc] = body['npcId'] : @ops_session_accounts.delete(pc)
    end
    return unless exact && @priv_admins.include?(body['npcId']) && %w[password credential].include?(body['via']) && body['relay'] != true

    npc = @priv_npcs[body['npcId']]
    return unless BreakEscape::CredentialModel.pc_admits_account?(@priv_pcs[pcs.first], npc)

    @ops_earned << "admin:#{pcs.first}"
    @priv_kinds[pcs.first] = priv_kind_of(body)
    # a token's deadline is the answer's row time plus `expiresInS` (R3 check 2, rule 1): the step is gone after it
    seconds = body['expiresInS']
    at = priv_row_time(row)
    @priv_deadlines[pcs.first] = at + seconds if body['kind'] == 'token' && seconds.is_a?(Numeric) && seconds.positive? && at
  end

  def priv_row_time(row)
    row['t'].is_a?(String) ? Time.iso8601(row['t']) : nil
  rescue ArgumentError
    nil
  end

  # A session of a PC ends: take back its admin step and the account the run holds there. What the capture can show (R2-C2): a
  # successful POST /lock_session (its answer names `pcId`); a PC id in an answer's `endedPcIds` (a later sign-in, a grant or an
  # NPC's hand-back that displaced a session); a desktop answer (GET /container/<pc id>) refusing with 403; and a bootstrap's
  # `sessions` map (a PC absent or `locked` loses its step, a PC holding another account's session ends it; the account shown is never assigned, R5-3). A
  # successful POST /logout answer does not say which PC, so it ends every PC (fail closed). Not shown by any answer: a token
  # running out, a power cut or a dropped route between requests, and a hand-back that names no PC in `endedPcIds`.
  def note_privilege_ends(body, ctx, row)
    return unless @priv_active && body.is_a?(Hash)

    status = row['status'].to_i
    ok = status == 200 && body['success'] == true
    end_priv_session(priv_logout_pcs(row)) if ok && ctx[:logout]
    # a lock answer that names no PC ends every PC (fail closed)
    end_priv_session(body['pcId'].is_a?(String) ? [body['pcId']] : @priv_pcs.keys) if ok && ctx[:lock_session] && body['locked'] == true
    end_priv_session(Array(body['endedPcIds'])) if status == 200
    if ctx[:container] && status == 403
      pc = ctx[:container]
      remember_priv_resumable(pc) if @priv_pcs.key?(pc) && %w[off not_responding].include?(body['reason'])
      end_priv_session([pc], keep_resumable: true)
    end
  end

  # What an answer itself shows about a session, applied BEFORE the answer is judged, so that a desktop answer that serves a
  # profile to a session that is not admin (or a token that lapsed) is reported on that row, not on the next: the token
  # deadline, a 200 desktop answer, a `GET /network` host row, a bootstrap's `sessions` map. See note_privilege_ends for the rest.
  def note_privilege_before(body, ctx, row)
    return unless @priv_active && body.is_a?(Hash)

    check_priv_named(body, ctx, row)
    note_priv_deadlines(row)
    note_priv_desktop(body, ctx, row) if ctx[:container] && row['status'].to_i == 200
    note_priv_host_rows(body) if ctx[:network_view]
    note_privilege_bootstrap(body) if ctx[:scenario] && body['sessions'].is_a?(Hash)
  end

  # R3 check 2, rule 1: a token sign-in's admin step is gone after its deadline, whatever the server says since.
  def note_priv_deadlines(row)
    at = priv_row_time(row)
    return unless at

    @priv_deadlines.select { |_, deadline| at > deadline }.each_key { |pc| end_priv_session([pc]) }
  end

  # What a resume may restore: the account held at the PC when the session went quiet, whether it held the admin step, the
  # kind of session that earned it and its token deadline. Dropped by any other end (end_priv_session without keep_resumable).
  def remember_priv_resumable(pc)
    account = @ops_session_accounts[pc]
    return unless account

    @priv_resumable[pc] = { account: account, step: @ops_earned.include?("admin:#{pc}"), deadline: @priv_deadlines[pc], kind: @priv_kinds[pc] }
  end

  # What kind of session an answer shows (R4-2): its `via` and whether it is a relay. A host row never lists a relay.
  def priv_kind_of(hash)
    [hash['via'].to_s, hash['relay'] == true]
  end

  # The step is gone for good and nothing of it may be resumed (the session became another kind, or another session replaced it).
  def lose_priv_step(pc)
    @ops_earned.delete("admin:#{pc}")
    @priv_deadlines.delete(pc)
    @priv_kinds.delete(pc)
    @priv_resumable.delete(pc)
  end

  # R4-2: an answer shows the held account's session as another kind than the one that earned the step (a claim, a relay, a
  # technique session): the step is lost, not suspended.
  def check_priv_kind(pc, session)
    kind = @priv_kinds[pc]
    lose_priv_step(pc) if kind && priv_kind_of(session) != kind
  end

  # A 200 desktop answer (GET /container/<pc id>): its session shows no session, or another account than the one held, or no
  # `access: "admin"`, and the step is taken back (R3 check 2, rule 2; R3-C1). It never restores a step by itself; only a
  # `resumes:` entry naming this row does, and only after a 403 `off` or `not_responding` with no other end since (R3-B1).
  def note_priv_desktop(body, ctx, row)
    pc = ctx[:container]
    return unless @priv_pcs.key?(pc)

    session = body['session']
    held = @ops_session_accounts[pc]
    earlier = @priv_resumable[pc]
    if !session.is_a?(Hash) || session['locked'] == true
      end_priv_session([pc])
    elsif held && session['npcId'].is_a?(String) && session['npcId'] != held
      end_priv_session([pc]) # R5-3: ends only
    elsif session['access'] != 'admin'
      downgrade_priv_step(pc, keep: false, session: session)
    else
      check_priv_kind(pc, session)
    end
    # only a record that was there BEFORE this row can be resumed by it (the row that shows the downgrade makes its own)
    apply_priv_resume(pc, session, row, earlier) if earlier && @priv_resumable[pc].equal?(earlier)
  end

  # The session at a PC is shown without `access: "admin"` (an off PC lists its session and leaves `access` out): the step and
  # token deadline go. If the step was held, the account and step are kept as what a `--resume` may restore (a real client
  # sends no request while the PC is off, so there is no 403). An answer that repeats it (each PC is listed twice in a network
  # answer, and a poll repeats the answer) leaves the record as it is (`keep`), since nothing ended in between; a step that was
  # not held and has no record leaves nothing to restore.
  def downgrade_priv_step(pc, keep: true, session: nil, shown: nil)
    saved = @priv_resumable[pc]
    kind = @priv_kinds[pc] || (saved && saved[:step] ? saved[:kind] : nil)
    # R5-2: the same account shown as another kind (a claim, a relay) means the session was replaced: nothing to resume
    return lose_priv_step(pc) if session.is_a?(Hash) && kind && priv_kind_of(session) != kind

    if @ops_earned.include?("admin:#{pc}") && @ops_session_accounts[pc]
      remember_priv_resumable(pc)
    elsif !(keep && saved && saved[:account] == (shown || @ops_session_accounts[pc]))
      # R5-1: a record is kept only by a repeat of the same held account's shape; another account's row drops it
      @priv_resumable.delete(pc)
    end
    @ops_earned.delete("admin:#{pc}")
    @priv_deadlines.delete(pc)
    @priv_kinds.delete(pc)
  end

  # A resume restores the step only when every one of these holds (R4 check 3): the row is not past the token deadline of the
  # session being resumed (R4-1), its session is the same account and the same kind as the one that earned the step (R4-2), and
  # nothing ended or replaced the session in between (the record is dropped by any other end).
  def apply_priv_resume(pc, session, row, saved = @priv_resumable[pc])
    return unless saved && session.is_a?(Hash) && row['t'].is_a?(String)

    key = [saved[:account], pc, row['t']]
    return unless @priv_resumes.key?(key) && session['npcId'] == saved[:account]

    at = priv_row_time(row)
    return if saved[:deadline] && (at.nil? || at > saved[:deadline])
    return if saved[:step] && saved[:kind] && priv_kind_of(session) != saved[:kind]

    @priv_used << [:resume, key]
    @priv_resumable.delete(pc)
    @ops_session_accounts[pc] = saved[:account]
    return unless saved[:step] && session['access'] == 'admin'

    @ops_earned << "admin:#{pc}"
    @priv_kinds[pc] = saved[:kind] if saved[:kind]
    @priv_deadlines[pc] = saved[:deadline] if saved[:deadline]
  end

  # The account a host row's session belongs to: the held account when the username is its own, else the one NPC with that
  # username, else nil (R5-1: only used to decide whether a resume record is kept).
  def priv_host_row_account(held, session)
    return held if held && @priv_npcs.dig(held, 'creds', 'username') == session['username']

    owners = @priv_npcs.select { |_, npc| npc['creds'].is_a?(Hash) && npc['creds']['username'] == session['username'] }.keys
    owners.size == 1 ? owners.first : nil
  end

  # A `GET /network` host row of a sign-in PC (R3 check 2, rule 2; R4-3, R4-4), judged as the desktop and the bootstrap are:
  # no `session` takes the step and the account back, unless the row is the one an off PC sends (`responding: false` and
  # `heldAs` the held account's display name, no `session`), which is a power cut and suspends the step; a locked session or
  # another account's username (judged by username) ends it; a session that is another kind loses it; one without
  # `access: "admin"` takes the step back.
  def note_priv_host_rows(body)
    ops_each_hash(body) do |hash|
      pc = hash['id']
      next unless hash['kind'] == 'pc' && pc.is_a?(String) && @priv_pcs.key?(pc)

      held = @ops_session_accounts[pc]
      session = hash['session']
      if !session.is_a?(Hash)
        shown = held && (@priv_npcs.dig(held, 'displayName') || held)
        hash['responding'] == false && hash['heldAs'].is_a?(String) && hash['heldAs'] == shown ? downgrade_priv_step(pc) : end_priv_session([pc])
      elsif session['locked'] == true
        end_priv_session([pc])
      elsif held && (username = @priv_npcs.dig(held, 'creds', 'username')).is_a?(String) && session['username'] != username
        end_priv_session([pc]) # R5-3: ends only; the account shown is never assigned
      elsif session['access'] != 'admin'
        downgrade_priv_step(pc, session: session, shown: priv_host_row_account(held, session))
      else
        check_priv_kind(pc, session)
      end
    end
  end

  # R4-5 and R4-7: a name the tester gave is not taken on trust once an answer shows otherwise.
  # A named logout (the account at that PC): the next answer that lists that PC's session state must not show that account's
  # session; if it does, the logout was not at that PC (exit 2). A named keyboard sign-in: the desktop answer right after it
  # shows the PC it was at; if that is another PC, where the run does not hold the account, the name is wrong (exit 2). Where no
  # such answer follows, the name stands.
  def check_priv_named(body, ctx, row)
    return unless row['status'].to_i == 200

    check_priv_logout_pending(body, ctx)
    check_priv_signin_pending(body, ctx)
  end

  def check_priv_logout_pending(body, ctx)
    @priv_logout_pending.keys.each do |pc|
      account = @priv_logout_pending[pc]
      npc = @priv_npcs[account]
      shown = nil # nil: this answer does not list the PC's session state; true or false: it does
      if ctx[:container] == pc
        shown = body['session'].is_a?(Hash) && body['session']['npcId'] == account
      elsif ctx[:scenario] && body['sessions'].is_a?(Hash)
        held = body['sessions'][pc]
        shown = held.is_a?(Hash) && held['npcId'] == account
      elsif ctx[:network_view]
        ops_each_hash(body) do |hash|
          next unless hash['kind'] == 'pc' && hash['id'] == pc

          shown = true if hash['session'].is_a?(Hash) ? hash['session']['username'] == npc.dig('creds', 'username') : hash['heldAs'] == (npc['displayName'] || account)
          shown = false if shown.nil?
        end
      end
      next if shown.nil?

      raise ArgumentError, "logout entry #{account}@#{pc}: the next answer that lists #{pc}'s session still shows #{account} there, so the sign-out was not at #{pc}" if shown

      @priv_logout_pending.delete(pc)
    end
  end

  def check_priv_signin_pending(body, ctx)
    pending = @priv_signin_pending
    return unless pending && ctx[:container] && @priv_pcs.key?(ctx[:container])

    session = body['session']
    return unless session.is_a?(Hash) && session['npcId'] == pending[:account] && session['via'] == 'password' && !session['remote']

    shown = ctx[:container]
    if shown == pending[:pc]
      @priv_signin_pending = nil
    elsif @ops_session_accounts[shown] != pending[:account]
      raise ArgumentError, "sign-in entry #{pending[:account]}@#{pending[:pc]}: the desktop that followed it is #{shown}, where the run holds no session of #{pending[:account]}, so the sign-in was not at #{pending[:pc]}"
    end
  end

  def end_priv_session(pcs, keep_resumable: false)
    pcs.each do |pc|
      next unless pc.is_a?(String) && @priv_pcs.key?(pc)

      @ops_earned.delete("admin:#{pc}")
      @ops_session_accounts.delete(pc)
      @priv_deadlines.delete(pc)
      @priv_kinds.delete(pc)
      @priv_resumable.delete(pc) unless keep_resumable
      @priv_signin_pending = nil if @priv_signin_pending && @priv_signin_pending[:pc] == pc
    end
  end

  def note_privilege_bootstrap(body)
    @priv_pcs.each_key do |pc|
      held = body['sessions'][pc]
      if !held.is_a?(Hash) || held['locked'] == true
        end_priv_session([pc])
      elsif @ops_session_accounts[pc] && held['npcId'] && held['npcId'] != @ops_session_accounts[pc]
        end_priv_session([pc]) # R5-3: ends only
      elsif held['access'] != 'admin'
        # R3-C3: present but not admin (an off PC or a downed route lists the session and leaves `access` out): the step goes
        downgrade_priv_step(pc, session: held, shown: held['npcId'])
      else
        check_priv_kind(pc, held)
      end
    end
  end

  # A successful read of a folder inside an account profile, by an admin session, earns `admin_read:<profile id>@<pc id>` for
  # each PC where `admin:<pc>` is earned and the PC's owner is admitted by the profile: the server writes its audit row
  # only then (no live session of an account the profile admits, an admin session at a PC whose owner it admits). A folder
  # answer names no PC, so every such PC is credited.
  def note_privilege_read(body, ctx, row)
    return unless @priv_active && ctx[:container] && row['status'].to_i == 200 && body.is_a?(Hash) && body['contents'].is_a?(Array)

    profile = @priv_folder_profile[ctx[:container]]
    return unless profile

    acl = @priv_profiles[profile]
    return if @ops_session_accounts.values.any? { |id| priv_acl_admits?(acl, id) }

    @priv_pcs.each_key { |pc| @ops_earned << "admin_read:#{profile}@#{pc}" if priv_admin_opens?(acl, pc) }
  end

  # Is `admin:<pc>` earned at a PC (the given one, or any) whose owner the list admits?
  def priv_admin_opens?(acl, pc_id)
    (pc_id ? [pc_id] : @priv_pcs.keys).any? do |pc|
      @ops_earned.include?("admin:#{pc}") && (owner = priv_owner(pc)) && priv_acl_admits?(acl, owner)
    end
  end

  # May this container answer hold the profile's items? `container` is a PC id (the desktop) or a folder id.
  def priv_profile_read_earned?(profile_id, container)
    return true unless @priv_active

    acl = @priv_profiles[profile_id.to_s]
    return false if acl.nil?

    pc = @priv_pcs.key?(container.to_s) ? container.to_s : nil
    own = pc ? [@ops_session_accounts[pc]].compact : @ops_session_accounts.values
    own.any? { |id| priv_acl_admits?(acl, id) } || priv_admin_opens?(acl, pc)
  end

  # The key `admin` inside an NPC record or a `creds` object (creds.admin never leaves the server).
  def scan_privilege_keys(body, add)
    return unless @priv_active

    walk_records(body, '$', false) { |rec, path| add.call('ops_string', 'ops:key:admin', safe_path("#{path}.admin")) if rec.key?('admin') }
    walk_hashes(body, '$') do |hash, path|
      creds = hash['creds']
      add.call('ops_string', 'ops:key:admin', safe_path("#{path}.creds.admin")) if creds.is_a?(Hash) && creds.key?('admin')
    end
  end

  # An ADMIN_READ row of a /log_rows answer needs an earned admin read at the PC its `where` names (the browser's row
  # names the PC and the account, and shows only the word `profile` for the profile, never its id): one earned
  # `admin_read:<profile>@<pc>` per row. A row whose `where` names no PC of the scenario, or more rows for a PC than
  # earned reads, is judged unearned (fail closed).
  def scan_privilege_log_rows(body, ctx, add)
    return unless @priv_active && ctx[:log_rows] && body.is_a?(Hash)

    seen = Hash.new(0)
    Array(body['rows']).each_with_index do |row, i|
      next unless row.is_a?(Hash) && row['event'] == 'ADMIN_READ'

      pcs = @priv_pcs.select { |_, pc| pc['name'] == row['where'] }.keys
      pc = pcs.size == 1 ? pcs.first : nil
      seen[pc] += 1
      earned = pc ? @ops_earned.count { |step| step.match?(/\Aadmin_read:.+@#{Regexp.escape(pc)}\z/) } : 0
      add.call('log_row', "log:admin_read:#{pc || 'unknown'}", "$.rows[#{i}]") if seen[pc] > earned
    end
  end

  # ---- ops log reader L2a: GET /log_rows (OPS_LOG_ROWS_PLAN.md section 7) --------------------

  LOG_ANSWER_KEYS = %w[rev title rows unchanged success reason].freeze
  LOG_ROW_KEYS = [%w[as detail elapsedMs event id result where], %w[as at detail event id result where]].freeze
  LOG_STORED_ONLY_KEYS = %w[seq serverMs flagged p last by opsLog opsLogSeq opsLogClockAt opsLogOnce opsLogSaves logSources].freeze

  # The answer with the IDENTITY cell of each typed SIGN_IN row blanked: it may hold what the player typed,
  # which may be a password, and the player is shown their own text (plan section 11). A successful
  # sign-in (`signin_ok`, the only SIGN_IN row whose detail has `method:`) shows an account, so it is judged.
  # A refusal for a known account looks the same as one for typed text in the answer (no detail), so it is exempt.
  def log_rows_without_typed(body)
    return body unless body.is_a?(Hash) && body['rows'].is_a?(Array)

    typed = ->(r) { r.is_a?(Hash) && r['event'] == 'SIGN_IN' && r.key?('as') && !r['detail'].to_s.match?(/(\A|, )method: /) }
    body.merge('rows' => body['rows'].map { |r| typed.call(r) ? r.merge('as' => '-') : r })
  end

  # R4-2: the stored-only keys are the hand list plus every detail key the registry marks `show: false`
  # (the table the server runs, so a later event's hidden key is seen without an edit here).
  def log_stored_only_keys
    @log_stored_only_keys ||= begin
      events = if defined?(BreakEscape::OpsLog) then BreakEscape::OpsLog.events
      elsif defined?(BreakEscape::OpsLogEvents) then BreakEscape::OpsLogEvents::EVENTS
      else {}
      end
      hidden = events.values.flat_map do |event|
        (event[:detail] || {}).select { |_key, rule| rule.is_a?(Hash) && rule[:show] == false }.keys
      end
      LOG_STORED_ONLY_KEYS | hidden.map(&:to_s)
    end
  end

  def log_secrets
    @log_secrets ||= @game && defined?(BreakEscape::OpsLog) ? BreakEscape::OpsLog.compared_secrets(@game).map(&:to_s) : []
  end

  # Authored raw ids that are not also an authored display text, as cell values to refuse.
  def log_raw_ids
    @log_raw_ids ||= begin
      ids = Set.new((@data['rooms'].is_a?(Hash) ? @data['rooms'].keys : []).map(&:to_s))
      ids.merge(@object_by_id.keys)
      each_room_npc { |npc| ids << npc['id'].to_s if npc.is_a?(Hash) }
      names = Set.new
      walk_hashes(@data, '$') do |h, _path|
        %w[name displayName door_sign username].each { |k| names << h[k].to_s if h[k].is_a?(String) }
        ids << h['card_id'].to_s if h['card_id'].is_a?(String)
      end
      ids - names - [''].to_set
    end
  end

  def log_cell_texts(row)
    detail_values = row['detail'].to_s.split(/,\s*/).map { |pair| pair.split(': ', 2).last }
    [row['as'], row['where'], *detail_values].map { |v| v.to_s.strip }
  end

  # The keys of a detail string ("key: value, key: value"), found by looking for a word before a colon or
  # equals sign anywhere in it (R4-1), not by trusting one separator: a change of the server's format
  # does not hide a key.
  def log_detail_keys(row)
    row['detail'].to_s.scan(/\b([A-Za-z][A-Za-z0-9_]*)\s*[:=]/).flatten.uniq
  end

  def log_secret_in?(text)
    log_secrets.any? { |secret| text == secret || (secret.length >= MIN_SUBSTRING_PASSWORD && text.include?(secret)) }
  end

  def scan_log_rows(body, ctx, add)
    return unless ctx[:log_rows] && body.is_a?(Hash)

    (body.keys - LOG_ANSWER_KEYS).each { |k| add.call('log_row', "log:answer_key:#{k}", safe_path("$.#{k}")) }
    walk_hashes(body, '$') do |hash, path|
      (hash.keys & log_stored_only_keys).each { |k| add.call('log_row', "log:stored_key:#{k}", safe_path("#{path}.#{k}")) }
    end
    texts = [body['title']]
    Array(body['rows']).each_with_index do |row, i|
      next add.call('log_row', 'log:row_shape', "$.rows[#{i}]") unless row.is_a?(Hash)

      add.call('log_row', 'log:row_keys', "$.rows[#{i}]") unless LOG_ROW_KEYS.include?(row.keys.map(&:to_s).sort)
      cells = %w[event result].map { |k| row[k] } + log_cell_texts(row)
      texts.concat(cells)
      texts << row['detail'] # whole, so a secret holding ", " is not cut in two before the compare
      log_detail_keys(row).each { |k| add.call('log_row', "log:stored_key:#{k}", "$.rows[#{i}].detail") if log_stored_only_keys.include?(k) }
      log_cell_texts(row).each { |t| add.call('log_row', "log:raw_id:#{t}", "$.rows[#{i}]") if log_raw_ids.include?(t) }
    end
    texts.each { |t| add.call('log_row', 'log:secret', '$.rows') if t.is_a?(String) && log_secret_in?(t.strip) }
  end

  # A Wi-Fi SSID or key in any response is a leak, with no route exemption: unlike a network
  # name, neither is ever legitimately served (5.3).
  def scan_wifi_secrets(body, add)
    return if @wifi_secrets.empty?

    each_string(body) do |str, json_path|
      @wifi_secrets.each do |secret, owners|
        next unless str.strip == secret || str.include?(secret)

        owners.each { |owner| add.call('wifi_secret', owner, safe_path(json_path)) }
      end
    end
  end

  def network_match?(str, secret)
    s = str.strip
    s == secret || (secret.length >= MIN_SUBSTRING_NETWORK && s.include?(secret))
  end

  def collect_locked_marks(node, marked)
    case node
    when Array then node.each { |v| collect_locked_marks(v, marked) }
    when Hash
      marked << node['id'].to_s if node['id'] && node['locked'] == true
      node.each_value { |v| collect_locked_marks(v, marked) }
    end
  end

  # A name must match a whole string; a text may sit inside a longer one.
  def content_match?(str, strings)
    s = str.strip
    strings.any? { |secret| s == secret || (secret.length >= 20 && s.include?(secret)) }
  end

  # ---- hash records and the cracker (S7) ----------------------------------------------------------

  CRACK_NEVER_KEYS = %w[crack passwordPattern passwordDifficulty earnedFacts crackRuns crackStarted crackedAccounts].freeze
  CRACK_CREDENTIAL_KEYS = %w[kind account token source proof].freeze
  CRACK_ROW_KEYS = %w[id kind source account label token salted status readyInSeconds gainedAt forThisPc accepted].freeze
  CRACK_ROW_STATUSES = %w[ready running infeasible cracked].freeze
  CRACK_ACCOUNT_KEYS = %w[npcId username displayName].freeze
  CRACK_ENTRY_KEYS = %w[id kind source account label password gainedAt forThisPc accepted].freeze
  CRACK_TOKEN = /\A(?:[A-HJ-NP-Z2-9]{4}-){5}[A-HJ-NP-Z2-9]{4}\z/.freeze
  CRACK_REFUSALS = { 'bad_request' => 400, 'not_found' => 404, 'no_recipe' => 422, 'fact_not_held' => 422 }.freeze
  CRACK_MAX_WAIT = 600
  # The two one-key answers of the app's own handlers that can reach POST /crack: a Pundit refusal and a CSRF failure.
  CRACK_APP_ERRORS = { 'Not authorized' => 403, 'invalid_authenticity_token' => 422 }.freeze

  CRACK_GRANTING_CLASSES = %w[common guessable reused].freeze

  # Hash records of the scenario (with the class and grade the server resolves for each), and each NPC's own password.
  # Read once.
  def collect_crack
    @crack_hash_accounts = Set.new
    @crack_hash_ids = Set.new
    @crack_records = []
    BreakEscape::CredentialModel.registry(@data).each do |id, entry|
      next unless entry['kind'] == 'hash'

      @crack_hash_ids << id.to_s
      @crack_hash_accounts << entry['account'] if entry['account'].is_a?(String)
      npc = BreakEscape::CredentialModel.account_npc(@data, entry['account'])
      @crack_records << { id: id.to_s, entry: entry, account: entry['account'], npc: npc, klass: crack_record_class(entry, npc),
                          resolved: npc ? BreakEscape::CrackDifficulty.resolve(entry, npc) : nil }
    end
    @crack_npc_password = {}
    @passwords.each { |password, owners| owners.each { |id| @crack_npc_password[id] = password } }
    waits = @crack_records.filter_map { |r| r[:resolved] && r[:resolved][:salted] ? r[:resolved][:crack_seconds] : nil }
    @crack_max_wait = [waits.max || 0, CRACK_MAX_WAIT].min
    facts = @crack_records.select { |r| r[:klass] == 'guessable' }.map { |r| Array(r[:entry].dig('crack', 'facts')).length }
    @crack_max_facts = [facts.max || 0, 4].min
  end

  GAME_METHODS_CRACK = %i[credential_proof_holds? earned_fact_ids crack_token password_held_for? player_state].freeze
  GAME_METHODS_FACTS = %i[earned_fact_ids].freeze

  # R2-L5: given a game, the proof, fact, token and held-partner checks need these public methods. A game that lacks one is an
  # error (the CLI stops and prints no clean result), never a check that quietly passes everything. Only the checks the
  # scenario can reach are required: hash records need the crack set, award facts the fact set.
  def require_game_methods
    return unless @game

    needed = []
    needed |= GAME_METHODS_CRACK unless @crack_records.empty?
    needed |= GAME_METHODS_FACTS unless @fact_entries.empty?
    missing = needed.reject { |m| @game.respond_to?(m) }
    raise ArgumentError, "the game given to the leak scanner lacks #{missing.join(', ')}: a check would be skipped" unless missing.empty?
  end

  # OpsCracking#crack_class: crack.password, else the NPC's habits.password, for an NPC with a password and a grade that
  # resolves; nil otherwise.
  def crack_record_class(entry, npc)
    return nil unless entry.is_a?(Hash) && npc.is_a?(Hash)
    return nil unless BreakEscape::CredentialModel.present_string?(npc.dig('creds', 'password'))
    return nil unless BreakEscape::CrackDifficulty.resolve(entry, npc)

    crack = entry['crack']
    written = crack.is_a?(Hash) ? crack['password'] : nil
    habits = npc['habits']
    klass = written || (habits.is_a?(Hash) ? habits['password'] : nil)
    %w[strong guessable reused common].include?(klass) ? klass : nil
  end

  # Earned set: a 200 POST /crack answer of the exact cracked shape names accounts (all or none), and only if the
  # server could have given it (see crack_grant). A well formed 200 running answer is one credit for a later salted grant.
  def note_crack_earned(body, ctx, row)
    @crack_last_grant = nil
    return unless ctx[:crack] && row['status'].is_a?(Integer) && row['status'] == 200 && body.is_a?(Hash) && crack_answer_shape_ok?(body)

    case body['status']
    when 'running'
      @crack_running_credits += 1
      @crack_running_seen = true
    when 'nomatch' then @crack_runs_seen = true if body['runs'] == 1
    when 'infeasible' then @crack_infeasible_seen = true
    end
    @crack_last_grant = crack_cracked_accounts(body)
    @crack_earned.merge(@crack_last_grant) if @crack_last_grant
  end

  # The accounts a cracked answer grants, or nil unless the whole answer is well formed and the server could have given it.
  def crack_cracked_accounts(body)
    return nil unless body['status'] == 'cracked' && body.key?('accountId')

    account = body['accountId']
    accounts = body['credentialIds'].map { |cid| cid.delete_suffix('.cracked') }
    return nil unless accounts.include?(account) && accounts.uniq.length == accounts.length

    crack_grant(account, accounts) ? accounts : nil
  end

  # OpsCracking#run_crack! and #crack_grant!: a record of the named account that is held, has a class that can be cracked
  # (never strong), has its recipe met as far as the game shows (all the facts of a guessable record earned; a reused
  # record's equal-password account already held), and either is unsalted (a direct hit grants at once) or follows a
  # running answer (a salted hit is granted only by a post after a stored run). More than one account is a batch: only an
  # unsalted direct hit batches, only to accounts with an equal password and a held unsalted record of their own.
  def crack_grant(account, accounts)
    candidates = crack_held_records(account).select { |r| crack_recipe_met?(r) }
    return false if candidates.empty?

    if accounts.length > 1
      password = @crack_npc_password[account]
      return false unless candidates.any? { |r| !r[:resolved][:salted] }

      return (accounts - [account]).all? do |other|
        @crack_npc_password[other] == password && crack_held_records(other).any? { |r| !r[:resolved][:salted] }
      end
    end
    return true if candidates.any? { |r| !r[:resolved][:salted] }
    return false if @crack_running_credits < 1

    @crack_running_credits -= 1
    true
  end

  def crack_held_records(npc_id)
    return [] unless @crack_npc_password[npc_id]

    @crack_records.select do |r|
      r[:account] == npc_id && r[:resolved] && crack_record_held?(r)
    end
  end

  def crack_record_held?(record)
    return true unless @game

    @game.credential_proof_holds?(record[:id], record[:entry])
  end

  def crack_recipe_met?(record)
    return false unless CRACK_GRANTING_CLASSES.include?(record[:klass])

    case record[:klass]
    when 'guessable'
      return true unless @game

      (Array(record[:entry].dig('crack', 'facts')).map(&:to_s) - Array(@game.earned_fact_ids).map(&:to_s)).empty?
    when 'reused'
      password = @crack_npc_password[record[:account]]
      @crack_npc_password.any? do |other, pw|
        other != record[:account] && pw == password && (@crack_earned.include?(other) || crack_held_elsewhere?(other))
      end
    else true
    end
  end

  # The game holds this account's password by a route other than a crack (a capture, a registry password entry).
  def crack_held_elsewhere?(npc_id)
    return false unless @game

    state = @game.player_state
    cracked = state.is_a?(Hash) ? Array(state['crackedAccounts']) : []
    @game.password_held_for?(npc_id) && !cracked.include?(npc_id)
  end

  # The exact keys and value ranges of each 200 answer of POST /crack.
  def crack_answer_shape_ok?(body)
    return false unless body['success'] == true

    keys = body.keys.sort
    int = ->(v, range) { v.is_a?(Integer) && range.cover?(v) }
    case body['status']
    when 'cracked'
      return keys == %w[status success] unless body.key?('accountId') || body.key?('credentialIds')

      keys == %w[accountId credentialIds status success] && body['accountId'].is_a?(String) && !body['accountId'].empty? &&
        body['credentialIds'].is_a?(Array) && body['credentialIds'].length.between?(1, 64) &&
        body['credentialIds'].all? { |c| c.is_a?(String) && c.end_with?('.cracked') && c.length > '.cracked'.length }
    when 'running' then keys == %w[readyInSeconds status success] && int.call(body['readyInSeconds'], 0..crack_held_max_wait)
    when 'nomatch'
      keys == %w[status success] || (keys == %w[runs status success] && body['runs'] == 1 && crack_held_class?('strong'))
    when 'infeasible' then keys == %w[runs status success] && body['runs'] == 2 && crack_held_class?('strong') && @crack_runs_seen
    when 'needMoreFacts' then keys == %w[missingCount status success] && int.call(body['missingCount'], 1..crack_held_max_facts)
    else false
    end
  end

  # R2-L3: the server answers `running` only for a held salted record of a crackable class, `needMoreFacts` only for a held
  # guessable one and `runs` only for a held strong one. Without a game every record counts as held.
  def crack_waiting_record?(record)
    record[:resolved] && record[:resolved][:salted] && CRACK_GRANTING_CLASSES.include?(record[:klass])
  end

  def crack_held_max_wait
    waits = @crack_records.select { |r| crack_waiting_record?(r) && crack_record_held?(r) }.map { |r| r[:resolved][:crack_seconds] }
    [waits.compact.max || 0, CRACK_MAX_WAIT].min
  end

  def crack_held_max_facts
    facts = @crack_records.select { |r| r[:resolved] && r[:klass] == 'guessable' && crack_record_held?(r) }
                          .map { |r| Array(r[:entry].dig('crack', 'facts')).length }
    [facts.max || 0, 4].min
  end

  def crack_held_class?(klass)
    @crack_records.any? { |r| r[:resolved] && r[:klass] == klass && crack_record_held?(r) }
  end

  def crack_refusal_shape_ok?(body, http)
    body['success'] == false && body.keys.sort == %w[reason success] && CRACK_REFUSALS[body['reason']] == http
  end

  # { JSON path => npc id } for the `password` of each cracked keyring entry that passes the full check, so
  # scan_passwords can let that NPC's own value through there, and only there.
  def crack_password_paths(body)
    entries = keyring_entries_in(body)
    return {} if entries.nil?

    paths = {}
    entries.each_with_index do |entry, i|
      npc_id = crack_entry_account(entry)
      paths["$.entries[#{i}].password"] = npc_id if npc_id
    end
    paths
  end

  # The account of a well formed, earned cracked entry (the server's row, its own password), else nil.
  def crack_entry_account(entry)
    return nil unless entry.is_a?(Hash) && entry['source'] == 'cracked'
    return nil unless (entry.keys - CRACK_ENTRY_KEYS).empty? && entry['kind'] == 'password'

    id = entry['id']
    return nil unless id.is_a?(String) && id.end_with?('.cracked')

    npc_id = id.delete_suffix('.cracked')
    return nil unless @crack_earned.include?(npc_id) && entry['label'] == 'Cracked' && crack_scope_keys_ok?(entry)
    return nil unless entry['account'] == crack_account_block(BreakEscape::CredentialModel.account_npc(@data, npc_id))

    password = entry['password']
    password.is_a?(String) && password == @crack_npc_password[npc_id] ? npc_id : nil
  end

  def scan_crack(body, ctx, row, add)
    scan_crack_keys(body, ctx, add)
    scan_crack_answer(body, ctx, row, add)
    scan_crack_rows(body, ctx, add)
    scan_crack_entries(body, ctx, add)
  end

  def scan_crack_keys(body, ctx, add)
    each_key_path(body) do |key, json_path|
      add.call('crack_key', "crack:key:#{key}", safe_path(json_path)) if CRACK_NEVER_KEYS.include?(key.to_s)
    end
    recipe_route = ctx[:keyring] || ctx[:crack] || ctx[:crack_keyring_route]
    walk_hashes(body, '$') do |hash, json_path|
      add.call('crack_key', 'crack:key:difficulty', safe_path("#{json_path}.difficulty")) if hash.key?('difficulty') && !crack_lock_difficulty?(hash, recipe_route)
      credential_shaped = hash['kind'].is_a?(String) || hash['account'].is_a?(Hash) || hash.key?('proof')
      add.call('crack_key', 'crack:key:facts', safe_path("#{json_path}.facts")) if hash.key?('facts') && (credential_shaped || recipe_route)
      add.call('crack_key', 'crack:key:crackFacts', safe_path("#{json_path}.crackFacts")) if hash.key?('crackFacts') && !crack_facts_ok?(body, hash, json_path, ctx)
    end
  end

  # The one public use of `difficulty`: a door or object lock, told by a string lockType and none of a credential's keys,
  # and never on the keyring or crack routes (every shipped lock with a difficulty has a string lockType).
  def crack_lock_difficulty?(hash, recipe_route)
    !recipe_route && hash['lockType'].is_a?(String) && (hash.keys & CRACK_CREDENTIAL_KEYS).empty?
  end

  # crackFacts: the top-level list of a keyring answer that lists a hash row; known fact ids, bare, no repeats,
  # and (given the game) earned.
  def crack_facts_ok?(body, hash, json_path, ctx)
    return false unless ctx[:crack_keyring] && json_path == '$' && hash.equal?(body)

    entries = keyring_entries_in(body)
    list = hash['crackFacts']
    return false unless entries && entries.any? { |e| e.is_a?(Hash) && e['kind'] == 'hash' }
    return false unless list.is_a?(Array) && list.all? { |f| f.is_a?(String) } && list.uniq.length == list.length

    known = @data.dig('social', 'intelFacts')
    return false unless known.is_a?(Hash) && list.all? { |f| !f.start_with?('se_intel_') && known.key?(f) }
    return true unless @game

    (list - Array(@game.earned_fact_ids)).empty?
  end

  # Every JSON object answered by POST /crack is judged: the shape of its 200 status, one of the route's four refusals, or
  # one of the two exact one-key errors the app's own handlers give (Pundit 403, CSRF 422). A body that is not JSON
  # (an HTML error page, kept as bodyText) on a non-200 stays out.
  def scan_crack_answer(body, ctx, row, add)
    return unless ctx[:crack]

    http = row['status']
    return add.call('crack_answer', 'crack:answer', '$') unless http.is_a?(Integer)
    return if http != 200 && body.is_a?(String)

    ok = body.is_a?(Hash) && (http == 200 ? crack_answer_shape_ok?(body) : crack_refusal_shape_ok?(body, http) || crack_app_error_ok?(body, http))
    add.call('crack_answer', 'crack:answer', '$') unless ok
    # R2-L2: a well formed cracked answer for an account the server must not grant is a finding by itself
    return unless ok && http == 200 && body['status'] == 'cracked' && body.key?('accountId') && @crack_last_grant.nil?

    add.call('crack_unearned', "crack:answer:#{body['accountId']}", '$')
  end

  def crack_app_error_ok?(body, http)
    body.keys == ['error'] && CRACK_APP_ERRORS[body['error']] == http
  end

  def scan_crack_rows(body, ctx, add)
    elements = {}
    entries = ctx[:crack_keyring] ? keyring_entries_in(body) : nil
    entries&.each_with_index { |e, i| elements["$.entries[#{i}]"] = e }
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash['kind'] == 'hash'

      %w[password routes connectsTo].each do |key|
        add.call('crack_row', "crack:row:#{key}", safe_path("#{json_path}.#{key}")) if hash.key?(key)
      end
      add.call('crack_row', 'crack:row', safe_path(json_path)) unless elements[json_path].equal?(hash) && crack_row_ok?(hash)
    end
    scan_crack_waits(body, ctx, add)
  end

  # A hash row is the server's row (OpsCracking#hash_keyring_entry): the registry record's own values, nothing free.
  def crack_row_ok?(row)
    return false unless (row.keys - CRACK_ROW_KEYS).empty? && row['source'] == 'registry' && row['id'].is_a?(String)

    record = @crack_records.find { |r| r[:id] == row['id'] }
    return false unless record && record[:resolved] && CRACK_ROW_STATUSES.include?(row['status'])
    return false unless row['label'] == crack_record_label(record[:entry]) && row['kind'] == 'hash'
    return false unless row['account'] == crack_account_block(record[:npc]) && row['salted'] == record[:resolved][:salted]
    return false unless crack_token_ok?(row['token'], record) && crack_scope_keys_ok?(row)
    return false if row['status'] == 'cracked' && !crack_account_granted?(record[:account])
    return false if row['status'] == 'infeasible' && !(record[:klass] == 'strong' && @crack_infeasible_seen)

    wait = row['readyInSeconds']
    return !row.key?('readyInSeconds') unless row['status'] == 'running'

    # R2-L4: running only for a salted record of a crackable class, within its own wait, after a running answer
    crack_waiting_record?(record) && @crack_running_seen && wait.is_a?(Integer) && wait.between?(0, [record[:resolved][:crack_seconds], CRACK_MAX_WAIT].min)
  end

  # The token shape; given a game that can say it, the token it would show for this record (Game#crack_token is pure).
  def crack_token_ok?(token, record)
    return false unless token.is_a?(String) && token.match?(CRACK_TOKEN)
    return true unless @game

    token == @game.crack_token(record[:id], record[:entry], record[:npc])
  end

  # gainedAt, forThisPc and accepted, when present: an Integer and two booleans.
  def crack_scope_keys_ok?(hash)
    (!hash.key?('gainedAt') || hash['gainedAt'].is_a?(Integer)) &&
      %w[forThisPc accepted].all? { |k| !hash.key?(k) || [true, false].include?(hash[k]) }
  end

  # OpsCracking credential_label: the record's own label, else its held item's name, else empty.
  def crack_record_label(entry)
    return entry['label'] if BreakEscape::CredentialModel.present_string?(entry['label'])

    definition = BreakEscape::CredentialModel.item_definition(@data, entry.dig('proof', 'held'))
    definition.is_a?(Hash) && BreakEscape::CredentialModel.present_string?(definition['name']) ? definition['name'] : ''
  end

  # CredentialKeyring#account_block.
  def crack_account_block(npc)
    return nil unless npc.is_a?(Hash)

    { 'npcId' => npc['id'], 'username' => npc.dig('creds', 'username'), 'displayName' => npc['displayName'] || npc['id'] }
  end

  # A row may say cracked only for an account a cracked answer granted in this scan, or one the game holds by another route.
  def crack_account_granted?(npc_id)
    @crack_earned.include?(npc_id) || crack_held_elsewhere?(npc_id)
  end

  def crack_wait_ok?(id, seconds)
    record = @crack_records.find { |r| r[:id] == id }
    !record.nil? && crack_waiting_record?(record) && crack_record_held?(record) && @crack_running_seen &&
      seconds.between?(0, [record[:resolved][:crack_seconds], CRACK_MAX_WAIT].min)
  end

  # The keyring `unchanged` answer's readyInSeconds map: whole seconds for registry hash ids only.
  def scan_crack_waits(body, ctx, add)
    return unless ctx[:crack_keyring_route] && body.is_a?(Hash) && body.key?('readyInSeconds')

    waits = body['readyInSeconds']
    # The server sends the map only on its `unchanged` answer (no entries), and only for rows it lists: proof holds.
    ok = ctx[:crack_keyring] && body['unchanged'] == true && !body.key?('entries') && waits.is_a?(Hash) && waits.all? do |id, v|
      @crack_hash_ids.include?(id.to_s) && v.is_a?(Integer) && crack_wait_ok?(id.to_s, v)
    end
    add.call('crack_row', 'crack:row:readyInSeconds', '$.readyInSeconds') unless ok
  end

  # A `source: "cracked"` hash anywhere: only an earned, well formed entry of a GET /keyring answer passes.
  def scan_crack_entries(body, ctx, add)
    entries = ctx[:crack_keyring] ? keyring_entries_in(body) : nil
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash['source'] == 'cracked'

      listed = entries&.each_with_index&.any? { |e, i| e.equal?(hash) && json_path == "$.entries[#{i}]" }
      next if listed && crack_entry_account(hash)

      add.call('crack_unearned', "crack:entry:#{hash['id'].is_a?(String) ? hash['id'] : '?'}", safe_path(json_path))
    end
  end


  # ---- award facts (S7 review R2-L1) ---------------------------------------------------------------

  # The facts an item (revealsFacts) or a flag reward (grant_fact) awards are withheld from the bootstrap until earned
  # (EarnedFacts#withhold_unearned_facts!) and sent with the answer that earns them: the inventory answer's top-level
  # `facts`, a grant_fact reward's `entry`, a give_item reward's `facts`. A reload then holds the entry in the bootstrap's
  # social.intelFacts. Feed facts keep their own rules (scan_feed) and are left out here, so nothing is reported twice.
  # Given a game, a fact it has not earned is a finding wherever its entry, label or text sits; without one the scanner
  # cannot tell earned from unearned, so only the place, the shape and the order are judged.
  def collect_facts
    @fact_entries = {} # id => { entry: the server's entry (notes stripped), text:, label: }
    @fact_item_ids = Set.new
    @fact_grant_ids = Set.new
    @fact_start_ids = Set.new
    @fact_reward_labels = Hash.new { |h, k| h[k] = Set.new } # fact id => the authored `label` of its grant_fact rewards (room data ships them)
    facts = @data.dig('social', 'intelFacts')
    return unless facts.is_a?(Hash)

    grant = lambda do |r|
      next unless r.is_a?(Hash) && r['type'] == 'grant_fact' && r['fact'].is_a?(String)

      @fact_grant_ids << r['fact']
      @fact_reward_labels[r['fact']] << r['label'] if r['label'].is_a?(String)
    end
    walk = lambda do |node, key|
      case node
      when Hash
        # the hash form of flagRewards, { "<flag>": { type: grant_fact, ... } }, as EarnedFacts reads it
        node.each_value { |r| grant.call(r) } if key == 'flagRewards'
        node.each { |k, v| walk.call(v, k) }
      when Array
        node.each { |f| @fact_item_ids << f if key == 'revealsFacts' && f.is_a?(String) && !f.empty? }
        node.each { |r| grant.call(r) } if key == 'flagRewards'
        node.each { |v| walk.call(v, key) }
      end
    end
    walk.call(@data.except('social'), nil)
    Array(@data['startItemsInInventory']).each do |item|
      next unless item.is_a?(Hash)

      data = item['scenarioData'].is_a?(Hash) ? item['scenarioData'] : item
      Array(data['revealsFacts']).grep(String).each { |f| @fact_start_ids << f }
    end
    feed = Set.new(BreakEscape::AccessWork.feed_facts(@data)) | @feed_fact_ids
    (@fact_item_ids | @fact_grant_ids).each do |id|
      next if feed.include?(id) || !facts[id].is_a?(Hash)

      entry = Marshal.load(Marshal.dump(facts[id]))
      BreakEscape::AuthorNotes.strip_notes!(entry, BreakEscape::ScenarioSchema.at('#/definitions/socialIntelFact'))
      @fact_entries[id] = { entry: entry, text: entry['text'], label: entry['label'] }
    end
    @fact_start_ids &= @fact_entries.keys.to_set
  end

  # { json path of an entry the server sends in this answer => fact id } for the three places that carry one, and the
  # bootstrap's own, each only for the exact entry the scenario holds and only on a 200 answer.
  def fact_places(body, ctx, row)
    places = {}
    return places unless body.is_a?(Hash) && row['status'].is_a?(Integer) && row['status'] == 200

    route = ctx[:route]
    if route.start_with?('POST ') && route.end_with?('/inventory') && body['facts'].is_a?(Hash)
      body['facts'].each { |id, e| places["$.facts.#{id}"] = [id, :item] if fact_entry_ok?(id, e, @fact_item_ids) }
    end
    if route.start_with?('POST ') && (route.end_with?('/flags') || route.end_with?('/unlock')) && body['rewards'].is_a?(Array)
      body['rewards'].each_with_index do |r, i|
        next unless r.is_a?(Hash)

        id = r['fact']
        places["$.rewards[#{i}].entry"] = [id, :grant] if r['type'] == 'grant_fact' && id.is_a?(String) && fact_entry_ok?(id, r['entry'], @fact_grant_ids)
        next unless r['type'] == 'give_item' && r['facts'].is_a?(Hash)

        r['facts'].each { |fid, e| places["$.rewards[#{i}].facts.#{fid}"] = [fid, :item] if fact_entry_ok?(fid, e, @fact_item_ids) }
      end
    end
    if ctx[:scenario] && body.dig('social', 'intelFacts').is_a?(Hash)
      body['social']['intelFacts'].each do |id, e|
        places["$.social.intelFacts.#{id}"] = [id, :bootstrap] if @fact_granted.include?(id) && fact_entry_ok?(id, e, @fact_entries.keys)
      end
    end
    places
  end

  # The room data ships a flag reward's own authored label (`...flagRewards[i].label`); when it reads the same as the fact's
  # label it is that authored string, not the withheld entry. Only the label, only at that key, only the reward's own text,
  # and only when that label does not hold the fact's text (a label with the text inside a longer sentence is a finding).
  def fact_reward_label_place?(id, str, json_path)
    text = @fact_entries[id][:text]
    json_path.match?(/\.flagRewards\[\d+\]\.label\z/) && @fact_reward_labels[id].include?(str) &&
      !(text.is_a?(String) && !text.empty? && str.include?(text))
  end

  def fact_entry_ok?(id, entry, sources)
    known = @fact_entries[id]
    id.is_a?(String) && known && sources.include?(id) && fact_earned_by_game?(id) && entry == known[:entry]
  end

  def fact_earned_by_game?(id)
    @fact_game_earned.nil? || @fact_game_earned.include?(id)
  end

  def scan_facts(body, ctx, row, add)
    return if @fact_entries.empty?

    places = fact_places(body, ctx, row)
    granted_now = places.values.reject { |_id, kind| kind == :bootstrap }.map(&:first).to_set
    walk_hashes(body, '$') do |hash, json_path|
      hash.each do |k, v|
        next unless @fact_entries.key?(k) && v.is_a?(Hash) && (v.key?('label') || v.key?('text'))

        path = "#{json_path}.#{k}"
        add.call('fact_unearned', "fact:#{k}", safe_path(path)) unless places.key?(path)
      end
    end
    each_string(body) do |str, json_path, _owner|
      next if places.keys.any? { |p| json_path == p || json_path.start_with?("#{p}.") || json_path.start_with?("#{p}[") }

      @fact_entries.each do |id, f|
        hit = (f[:text].is_a?(String) && content_match?(str, [f[:text]])) ||
              (f[:label].is_a?(String) && !f[:label].empty? && str.strip == f[:label] && !@public_strings.include?(f[:label]))
        next unless hit
        next if fact_reward_label_place?(id, str, json_path)
        next if fact_earned_by_game?(id) && (@fact_granted.include?(id) || granted_now.include?(id))

        add.call('fact_unearned', "fact:#{id}", safe_path(json_path))
      end
    end
    @fact_granted.merge(granted_now)
  end

  def safe_path(json_path)
    redact(json_path)
  end
end
