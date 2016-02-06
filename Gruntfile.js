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

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                files: {
                    'js/script.js': [
                        '_javascript/prism.js',
                        '_javascript/script.js'
                    ]
                }
            }
        },

        uglify: {
            prod: {
                files: {
                    'js/script.js': 'js/script.js'
                }
            }
        }
    });

    grunt.registerTask('prepare', ['concat']);
    grunt.registerTask('compress', ['cssmin', 'htmlmin', 'uglify']);
};
