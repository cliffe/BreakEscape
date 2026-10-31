# frozen_string_literal: true

# Lints for direct messages on phone-chat (README_scenario_design.md "Direct messages (social theme)").
#
#   device (type "phone", inventory or room object):
#     "app": { "title", "theme": "social"|"terminal", "accent": "#rrggbb", "chrome": "app", "logo": "x.png" }
#   phone NPC:
#     "handle": "@name", "profile": { "siteId": <social.osint.sites id>, "person": <social.people id> }
#
# Everything is opt-in: a scenario with no `app`, `handle` or `profile` produces no issue here.
# Runs for every scenario (the profile checks read `social`, which may be absent).
module ValidateSocial
  module DmApp
    THEMES = %w[social terminal].freeze
    CHROMES = %w[app].freeze
    APP_KEYS = %w[title theme accent chrome logo].freeze
    PROFILE_KEYS = %w[siteId person].freeze
    HEX = /\A#(?:\h{3}|\h{6})\z/.freeze

    def self.err(msg)
      "❌ SOCIAL: #{msg}"
    end

    def self.warn_(msg)
      "⚠️ SOCIAL: #{msg}"
    end

    # Every phone device with where it lives: [device, path].
    def self.devices(json)
      list = []
      Array(json['startItemsInInventory']).each_with_index do |item, i|
        list << [item, "startItemsInInventory[#{i}](#{item['id'] || item['name'] || '?'})"] if item.is_a?(Hash)
      end
      ValidateSocial.rooms(json).each do |rid, room|
        Array(room['objects']).each_with_index do |obj, i|
          list << [obj, "rooms/#{rid}/objects[#{i}](#{obj['id'] || obj['name'] || '?'})"] if obj.is_a?(Hash)
        end
      end
      list
    end

    def self.check(ctx)
      json = ctx.json
      issues = []
      npcs = ValidateSocial.npc_records(json).select { |n| n['id'].is_a?(String) }.to_h { |n| [n['id'], n] }
      devs = devices(json)
      devs.each { |dev, path| issues.concat(device_checks(ctx, dev, path, npcs)) }
      ValidateSocial.npc_records(json).each { |npc| issues.concat(npc_checks(ctx, npc)) }
      issues
    end

    def self.device_checks(ctx, dev, path, npcs)
      return [] unless dev.key?('app')

      issues = []
      app = dev['app']
      unless dev['type'] == 'phone'
        issues << warn_("#{path}.app is read only on a device of type 'phone' (this one is '#{dev['type']}'); it is ignored")
      end
      unless app.is_a?(Hash)
        return issues << err("#{path}.app must be an object")
      end

      app.each_key do |k|
        next if APP_KEYS.include?(k) || k.to_s.start_with?('_')

        issues << err("#{path}.app has unknown key '#{k}' (allowed: #{APP_KEYS.join(', ')})")
      end
      if app.key?('theme') && !THEMES.include?(app['theme'])
        issues << err("#{path}.app.theme #{app['theme'].inspect} is not one of: #{THEMES.join(', ')}")
      end
      if app.key?('accent') && !(app['accent'].is_a?(String) && app['accent'].match?(HEX))
        issues << err("#{path}.app.accent #{app['accent'].inspect} must be a hex colour such as \"#3b5bdb\"")
      end
      if app.key?('chrome') && !CHROMES.include?(app['chrome'])
        issues << err("#{path}.app.chrome #{app['chrome'].inspect} is not one of: #{CHROMES.join(', ')}")
      end
      if app.key?('title') && (!app['title'].is_a?(String) || app['title'].strip.empty?)
        issues << err("#{path}.app.title must be a non-empty string")
      end
      if app.key?('logo')
        logo = app['logo']
        file = logo.is_a?(String) && logo.match?(/\A[\w.-]+\z/) ? File.join(ctx.repo_root.to_s, 'public/break_escape/assets/logos', logo) : nil
        issues << err("#{path}.app.logo #{logo.inspect} is not a file in public/break_escape/assets/logos") unless file && File.exist?(file)
      end
      if app['theme'] == 'social' && !app.key?('title')
        issues << warn_("#{path}.app has theme 'social' but no title; the list heading stays 'Messages'")
      end
      if %w[social].include?(app['theme']) && !app.key?('accent')
        issues << warn_("#{path}.app has theme 'social' but no accent; the default blue is used")
      end

      # Contacts: every npcIds entry is a phone NPC on this device's phoneId
      Array(dev['npcIds']).each do |nid|
        npc = npcs[nid]
        if npc.nil?
          issues << err("#{path}.npcIds names '#{nid}', which is not an NPC")
        elsif npc['npcType'] != 'phone'
          issues << err("#{path}.npcIds names '#{nid}', which is not a phone NPC")
        elsif dev['phoneId'] && npc['phoneId'] != dev['phoneId']
          issues << err("#{path}.npcIds names '#{nid}', whose phoneId is #{npc['phoneId'].inspect}, not #{dev['phoneId'].inspect}; the contact would not appear")
        end
      end
      issues << warn_("#{path}.app is set but the device has no phoneId/npcIds; there is no contact list to theme") if dev['npcIds'].nil? && dev['phoneId'].nil?
      issues
    end

    def self.npc_checks(ctx, npc)
      where = "NPC '#{npc['id']}'"
      issues = []
      if npc.key?('handle')
        if !npc['handle'].is_a?(String) || npc['handle'].strip.empty?
          issues << err("#{where}.handle must be a non-empty string")
        elsif !npc['handle'].start_with?('@')
          issues << warn_("#{where}.handle #{npc['handle'].inspect} does not start with '@'")
        end
        issues << warn_("#{where}.handle is shown only for a phone NPC; it is ignored") unless npc['npcType'] == 'phone'
      end
      issues.concat(profile_checks(ctx, npc, where)) if npc.key?('profile')
      issues.concat(call_checks(ctx, npc, where))
      issues
    end

    def self.profile_checks(ctx, npc, where)
      issues = []
      prof = npc['profile']
      issues << warn_("#{where}.profile is used only by a phone NPC; it is ignored") unless npc['npcType'] == 'phone'
      return issues << err("#{where}.profile must be an object { siteId, person }") unless prof.is_a?(Hash)

      prof.each_key do |k|
        issues << err("#{where}.profile has unknown key '#{k}' (allowed: #{PROFILE_KEYS.join(', ')})") unless PROFILE_KEYS.include?(k) || k.to_s.start_with?('_')
      end
      PROFILE_KEYS.each do |k|
        issues << err("#{where}.profile.#{k} is required") if !prof[k].is_a?(String) || prof[k].strip.empty?
      end
      return issues unless PROFILE_KEYS.all? { |k| prof[k].is_a?(String) && !prof[k].strip.empty? }

      social = ctx.social.is_a?(Hash) ? ctx.social : {}
      sites = social.dig('osint', 'sites')
      sites = [] unless sites.is_a?(Array)
      site = sites.find { |s| s.is_a?(Hash) && s['id'] == prof['siteId'] }
      if site.nil?
        issues << err("#{where}.profile.siteId '#{prof['siteId']}' is not a social.osint.sites id")
      else
        profiles = site['profiles'].is_a?(Array) ? site['profiles'] : []
        unless profiles.any? { |p| p.is_a?(Hash) && p['person'] == prof['person'] }
          issues << warn_("#{where}.profile: site '#{prof['siteId']}' has no profile for '#{prof['person']}'; View profile would open the site's profile list")
        end
      end
      people = Array(social['people']).filter_map { |p| p['id'] if p.is_a?(Hash) }
      issues << err("#{where}.profile.person '#{prof['person']}' is not a social.people id") unless people.include?(prof['person'])
      issues
    end

    # A callId on a phone NPC (a judged DM) must name a social.pretextNpcs entry
    def self.call_checks(ctx, npc, _where)
      return [] unless npc['npcType'] == 'phone' && npc['callId'].is_a?(String)

      calls = ctx.social.is_a?(Hash) ? Array(ctx.social['pretextNpcs']) : []
      return [] if calls.any? { |c| c.is_a?(Hash) && c['callId'] == npc['callId'] }

      [err("NPC '#{npc['id']}'.callId '#{npc['callId']}' is not a social.pretextNpcs callId")]
    end
  end
end
