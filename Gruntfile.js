module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    bowercopy: {
      options: {
        srcPrefix: 'bower_components'
      },
      scripts: {
        options: {
          destPrefix: 'public/js/libs'
        },
        files: {
          'jquery.js': 'jquery/dist/jquery.js',
          'jquery.placeholder.js': 'jquery-placeholder/jquery.placeholder.js',
          'jquery.cookie.js': 'jquery.cookie/jquery.cookie.js',
          'modernizr.js': 'modernizr/modernizr.js',
          'fastclick.js': 'fastclick/lib/fastclick.js',
          'foundation.js': 'foundation/js/foundation.js',
          'underscore.js': 'underscore/underscore.js',
          'backbone.js': 'backbone/backbone.js',
          'backbone.marionette.js': 'marionette/lib/backbone.marionette.js',
          'require.js': 'requirejs/require.js',
          'foundation.abide.js': 'foundation/js/foundation/foundation.abide.js',
          'foundation.accordion.js': 'foundation/js/foundation/foundation.accordion.js',
          'foundation.alert.js': 'foundation/js/foundation/foundation.alert.js',
          'foundation.clearing.js': 'foundation/js/foundation/foundation.clearing.js',
          'foundation.dropdown.js': 'foundation/js/foundation/foundation.dropdown.js',
          'foundation.equalizer.js': 'foundation/js/foundation/foundation.equalizer.js',
          'foundation.interchange.js': 'foundation/js/foundation/foundation.interchange.js',
          'foundation.joyride.js': 'foundation/js/foundation/foundation.joyride.js',
          'foundation.magellan.js': 'foundation/js/foundation/foundation.magellan.js',
          'foundation.offcanvas.js': 'foundation/js/foundation/foundation.offcanvas.js',
          'foundation.orbit.js': 'foundation/js/foundation/foundation.orbit.js',
          'foundation.reveal.js': 'foundation/js/foundation/foundation.reveal.js',
          'foundation.slider.js': 'foundation/js/foundation/foundation.slider.js',
          'foundation.tab.js': 'foundation/js/foundation/foundation.tab.js',
          'foundation.toolbar.js': 'foundation/js/foundation/foundation.toolbar.js',
          'foundation.topbar.js': 'foundation/js/foundation/foundation.topbar.js'
        }
      }
    },

    sass: {
      options: {
        includePaths: ['bower_components/foundation/scss']
      },
      dist: {
        options: {
          outputStyle: 'compressed',
          sourceMap: true,
        },
        files: {
          'public/css/app.css': 'scss/app.scss'
        }
      }
    },

    watch: {
      grunt: {
        options: {
          reload: true
        },
        files: ['Gruntfile.js']
      },

      sass: {
        files: 'scss/**/*.scss',
        tasks: ['sass']
      }
    },

    

  });

  grunt.loadNpmTasks('grunt-bowercopy');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['sass']);
  grunt.registerTask('default', ['bowercopy', 'build','watch']);
}
