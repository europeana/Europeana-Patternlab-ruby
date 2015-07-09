require 'europeana/styleguide/version'

module Europeana
  module Styleguide
    require 'europeana/styleguide/engine' if defined?(Rails)

    extend ActiveSupport::Concern

    included do
      if respond_to?(:prepend_view_path)
        prepend_view_path(File.expand_path('../../../app/views', __FILE__))
        prepend_view_path('app/views')
      end
    end
  end
end
