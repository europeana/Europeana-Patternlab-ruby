# coding: utf-8
# frozen_string_literal: true
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'europeana/styleguide/version'

Gem::Specification.new do |spec|
  spec.name          = 'europeana-styleguide'
  spec.version       = Europeana::Styleguide::VERSION
  spec.authors       = ['Richard Doe']
  spec.email         = ['richard.doe@europeana.eu']
  spec.summary       = 'Europeana styleguide for Ruby.'
  spec.homepage      = 'https://github.com/europeana/europeana-styleguide-ruby'
  spec.license       = 'EUPL-1.2'

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ['lib']

  spec.add_dependency 'activesupport', '>= 4.0', '< 6.0'
  spec.add_dependency 'europeana-i18n'
  spec.add_dependency 'mustache', '~> 1.0.1'
  spec.add_dependency 'stache', '>= 1.1.1'

  spec.add_development_dependency 'bundler', '~> 1.7'
  spec.add_development_dependency 'rake', '~> 10.0'
end
