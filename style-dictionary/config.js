/**
 * Style Dictionary Configuration
 * Used to validate Token Exporter output compatibility
 */

module.exports = {
  source: ['tokens/extracted-tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: true
        }
      }]
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'build/scss/',
      files: [{
        destination: '_variables.scss',
        format: 'scss/variables'
      }]
    },
    ios: {
      transformGroup: 'ios-swift',
      buildPath: 'build/ios/',
      files: [{
        destination: 'TokenColors.swift',
        format: 'ios-swift/class.swift',
        className: 'TokenColors'
      }]
    },
    android: {
      transformGroup: 'android',
      buildPath: 'build/android/',
      files: [{
        destination: 'colors.xml',
        format: 'android/colors'
      }]
    },
    json: {
      buildPath: 'build/json/',
      files: [{
        destination: 'tokens.json',
        format: 'json/nested'
      }]
    }
  }
};