/* global module:false */
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        datetime: Date.now(),

        sass: {

            build: {

                options: {
                    style: 'none' // Target options style: 'compressed'
                },

                files: {
                    'dist/css/style.css': 'dev/sass/main.scss'
                }
            }
        },

        uglify: {

            options: {
                mangle: false,
                beautify: true
            },

            build: {

                files: {

                    'dist/js/filtrd.<%= pkg.version %>.js': [

                        'dev/js/core/polyfills.js',
                        'dev/js/vendor/jquery/jquery.js',
                        'dev/js/vendor/q/q.js',
                        'dev/js/vendor/injekter/injekter.js',

                        'dev/js/app.js',

                        'dev/js/core/eventHub.js',
                        'dev/js/core/logger.js',

                        'dev/js/models/FiltrdStack.js',
                        'dev/js/models/Filtr.js',
                        'dev/js/models/FiltrCollection.js',

                        'dev/js/services/FiltrdRules.js',

                        'dev/js/views/FiltrdMenu.js',
                        'dev/js/views/FiltrdTable.js',
                        'dev/js/views/FiltrdRow.js',
                        'dev/js/views/FiltrdHeader.js',
                        'dev/js/views/FiltrdButton.js',
                        'dev/js/views/FiltrdSet.js',
                        'dev/js/views/FiltrdPagination.js'
                    ]
                }
            }
        },

        watch: {

            main: {
                files: ['dev/js/**/*.js', 'dev/sass/*.scss'],
                tasks: ['build'],
                options: {
                    nospawn: true,
                }
            },

            sass: {
                files: ['dev/sass/*.scss'],
                tasks: ['sass'],
                options: {
                    nospawn: true,
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('build', ['sass', 'uglify:build']);
};