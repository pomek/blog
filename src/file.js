'use strict';

const path = require('path');

module.exports = class File {
    /**
     * @param {Object} [options={}] options
     * @param {String} [options.contents=''] options.contents
     * @param {String} [options.basename=''] options.basename
     * @param {String} [options.dirname=''] options.dirname
     */
    constructor (options = {
        contents: '',
        basename: '',
        dirname: ''
    }) {
        this._meta = new Map();
        this.contents = options.contents;
        this.dirname = options.dirname;
        this.basename = options.basename;
        this.nestingLevel = this._findNestingLevel(this.dirname || '.');
    }

    /**
     * @returns {String}
     */
    get path () {
        return path.join(this.dirname, this.basename);
    }

    /**
     * @param {String} key
     * @param {*} value
     * @returns {void}
     */
    setMetaTag (key, value) {
        this._meta.set(key, value);
    }

    /**
     * @param {String} key
     * @returns {*}
     */
    getMetaTag (key) {
        return this._meta.get(key);
    }

    /**
     * @private
     * @param {String} path
     * @returns {Number}
     */
    _findNestingLevel (path) {
        if (path === '.') {
            return 0;
        }

        return path.split('/').length - 1;
    }
};
