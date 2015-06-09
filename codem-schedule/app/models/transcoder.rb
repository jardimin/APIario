class Transcoder
  class << self
    def schedule(opts)
      job  = opts[:job]
      host = opts[:host]

      attrs = post("#{host.url}/jobs", job_to_json(job))
      if attrs
        attrs.merge('host_id' => host.id)
      else
        false
      end
    end

    def job_to_json(job)
      if job.preset.thumbnail_options.present?
        thumb_opts = JSON.parse(job.preset.thumbnail_options)
      else
        thumb_opts = nil
      end

      {
        'source_file' => job.source_file,
        'destination_file' => job.destination_file,
        'encoder_options' => job.preset.parameters,
        'thumbnail_options' => thumb_opts
      }
    end

    def host_status(host)
      get "#{host.url}/jobs"
    end

    def job_status(job)
      return unless job.host.try(:url)
      return unless job.remote_job_id
      get "#{job.host.url}/jobs/#{job.remote_job_id}"
    end

    def remove_job(job)
      return unless job.host.try(:url)
      return unless job.remote_job_id
      delete("#{job.host.url}/jobs/#{job.remote_job_id}")
    end

    def probe(file)
      host = Host.with_available_slots.first
      call_transcoder(:post, "#{host.url}/probe", { source_file: file })
    rescue => e
      e
    end

    def post(url, *attrs)
      call_transcoder(:post, url, *attrs)
    end

    def get(url, *attrs)
      call_transcoder(:get, url, *attrs)
    end

    def delete(url)
      call_transcoder(:delete, url)
    end

    private

    def call_transcoder(method, url, *attrs)
      payload = attrs.first.to_json
      params = { method: method,
                 url: url,
                 headers: { content_type: :json, accept: :json },
                 timeout: 2,
                 open_timeout: 2, # Fallback for RestClient < 1.8.x, requires explicit open_timeout
                 payload: payload }
      response = RestClient::Request.execute(params)
      JSON.parse response
    rescue Errno::ECONNREFUSED, SocketError, Errno::ENETUNREACH, Errno::EHOSTUNREACH, RestClient::Exception, JSON::ParserError
      false
    end
  end
end
