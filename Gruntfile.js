var fs = require('fs');
var path = require('path');

var htmlFiles = (function findHtmlFiles (startPath, response) {
    response = response || [];

    if (!fs.existsSync(startPath)) {
        return;
    }

    var files = fs.readdirSync(startPath);

    files.forEach(function (item) {
        var filename = path.join(startPath, item),
            stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            findHtmlFiles(filename, response);
        }
        else if (filename.indexOf('.html') >= 0) {
            response.push(filename);
        }
    });

    return response;
})('_site');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        sass: {
            dist: {
                files: {
                    'css/main.css': '_assets/stylesheets/main.scss'
                }
            }
        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                files: {
                    'js/script.js': [
                        '_assets/javascript/prism.js',
                        '_assets/javascript/script.js'
                    ]
                }
            }
        },

        copy: {
            fonts: {
                expand: true,
                cwd: '_assets/fonts',
                src: '*',
                dest: 'fonts/'
            },

            images: {
                expand: true,
                cwd: '_assets/images',
                src: '**',
                dest: 'images/'
            }
        },

        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            prod: {
                files: {
                    '_site/css/main.css': '_site/css/main.css'
                }
            }
        },

        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            prod: {
                files: (function (files) {
                    var result = {};

                    files.forEach(function (item) {
                        result[item] = item;
                    });

                    return result;
                })(htmlFiles)
            }
        },

        uglify: {
            prod: {
                files: {
                    '_site/js/script.js': '_site/js/script.js'
                }
            }
        },

        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: '_assets/images',
                    src: ['**/*.{png,jpg}'],
                    dest: '_site/images/'
                }]
            }
        },

        clean: {
            css: ["css/**"],
            js: ["js/**"],
            images: ["images/**"],
            fonts: ["fonts/**"]
        },

        watch: {
            sass: {
                files: ['_assets/stylesheets/**/*.scss'],
                tasks: ['sass']
            },
            js: {
                files: ['_assets/javascript/**/*.js'],
                tasks: ['concat']
            }
        }
    });

    grunt.registerTask('prepare', ['sass', 'concat', 'copy:fonts', 'copy:images']);
    grunt.registerTask('compress', ['cssmin', 'htmlmin', 'uglify', 'imagemin']);
};
