module JobsHelper
  def progress_as_percentage(progress)
    format '%.2f', (progress.to_f * 100.0)
  end

  def encoding_time(job)
    time = job.completed_at.to_i - job.transcoding_started_at.to_i
    time < 0 ? 0 : time
  end

  def destination_filesize(job)
    File.size(job.destination_file)
  rescue Errno::ENOENT
    'unknown (file gone)'
  end

  def notified_at(notification, job)
    return nil if notification.notified_at.blank?
    num = notification.notified_at.to_i - job.completed_at.to_i
    num <= 0 ? '00:00:00' : number_to_time(num)
  end

  def compression_rate(job)
    pct = (destination_filesize(job).to_f / job.filesize.to_f) * 100.0
    format '%.2f', pct
  end

  def number_to_time(seconds)
    return nil if seconds.to_i < 1
    time = Time.at(seconds).utc
    if seconds > 86_400
      days = seconds / 3600 / 24
      "#{format '%02d', days}:#{time.strftime('%H:%M:%S')}"
    else
      time.strftime('%H:%M:%S')
    end
  end
end
