module BreakEscape
  class StaticFilesController < BreakEscape::ApplicationController
    skip_before_action :verify_authenticity_token

    def serve
      # Use the BreakEscape engine's root, not Rails.root
      engine_root = BreakEscape::Engine.root

      # Determine the actual file path based on the request URL
      request_path = request.path

      # Map different URL patterns to their file locations
      # Remember: request_path will be /break_escape/css/... when mounted at /break_escape
      file_path = case request_path
      when %r{^/break_escape/css/}
                    engine_root.join('public', 'break_escape', 'css', params[:path])
      when %r{^/break_escape/js/}
                    engine_root.join('public', 'break_escape', 'js', params[:path])
      when %r{^/break_escape/assets/}
                    engine_root.join('public', 'break_escape', 'assets', params[:path])
      when %r{^/break_escape/stylesheets/}
                    engine_root.join('public', 'break_escape', 'css', params[:path])
      when %r{^/break_escape/.*\.html$}
                    # HTML test files like /break_escape/test-assets.html
                    engine_root.join('public', 'break_escape', "#{params[:filename]}.html")
      else
                    # Fallback for any other pattern
                    engine_root.join('public', 'break_escape', params[:path])
      end

      # Security: prevent directory traversal
      base_path = engine_root.join('public', 'break_escape').to_s
      unless file_path.to_s.start_with?(base_path)
        return render_not_found
      end

      unless File.file?(file_path)
        return render_not_found
      end

      # Determine content type
      content_type = determine_content_type(file_path.to_s)

      # HTML files served from here are self-contained third-party tools
      # (e.g. CyberChef) that have their own inline scripts and dynamic
      # module loading — they cannot carry Rails nonces. Apply a targeted
      # CSP that allows inline/eval within this file only, without
      # propagating unsafe-inline to any other part of the application.
      if content_type == 'text/html'
        response.set_header('Content-Security-Policy',
          "default-src 'self' https:; " \
          "script-src 'self' https: 'unsafe-inline' 'unsafe-eval' blob:; " \
          "style-src 'self' https: 'unsafe-inline'; " \
          "img-src 'self' https: data: blob:; " \
          "font-src 'self' https: data:; " \
          "connect-src 'self' https: blob: data:; " \
          "media-src 'self' https: data: blob:; " \
          "object-src data: blob:; " \
          "worker-src 'self' blob:;"
        )
      end

      send_file file_path, type: content_type, disposition: 'inline'
    rescue Errno::ENOENT
      render_not_found
    end

    private

    def determine_content_type(file_path)
      case File.extname(file_path).downcase
      when '.html'
        'text/html'
      when '.css'
        'text/css'
      when '.js'
        'application/javascript'
      when '.json'
        'application/json'
      when '.png'
        'image/png'
      when '.jpg', '.jpeg'
        'image/jpeg'
      when '.gif'
        'image/gif'
      when '.svg'
        'image/svg+xml'
      when '.woff'
        'font/woff'
      when '.woff2'
        'font/woff2'
      when '.ttf'
        'font/ttf'
      when '.eot'
        'application/vnd.ms-fontobject'
      when '.mp3'
        'audio/mpeg'
      when '.wav'
        'audio/wav'
      when '.ogg'
        'audio/ogg'
      else
        'application/octet-stream'
      end
    end

    def render_not_found
      render plain: 'Not Found', status: :not_found
    end
  end
end
