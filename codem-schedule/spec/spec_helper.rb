require 'webmock/rspec'
require 'simplecov'

SimpleCov.start 'rails' do
  add_group 'Controllers' do |src_file|
    src_file.filename =~ %r{/app/controllers/} && !(src_file.filename =~ %r{/app/controllers/api/})
  end
  add_group 'API Controllers' do |src_file|
    src_file.filename =~ %r{/app/controllers/api/}
  end
  add_group 'Mailers' do |src_file|
    src_file.filename =~ %r{/app/mailers/}
  end
  add_filter do |src_file|
    src_file.filename =~ %r{/vendor|lib/}
  end
end

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rspec/rails'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }

RSpec.configure do |config|
  # == Mock Framework
  #
  # If you prefer to use mocha, flexmock or RR, uncomment the appropriate line:
  #
  # config.mock_with :mocha
  # config.mock_with :flexmock
  # config.mock_with :rr
  config.mock_with :rspec

  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true
end

WebMock.disable_net_connect!
