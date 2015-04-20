/*
 * Copyright (C) 2015 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * A service for defining the ActiveConnectionWrapper class.
 */
angular.module('settings').factory('ActiveConnectionWrapper', [
    function defineActiveConnectionWrapper() {

    /**
     * Wrapper for ActiveConnection which adds display-specific
     * properties, such as a checked option.
     * 
     * @constructor
     * @param {String} name
     *     The display name of the active connection.
     *     
     * @param {String} startDate
     *     The date and time this session began, pre-formatted for display.
     *
     * @param {ActiveConnection} activeConnection
     *     The ActiveConnection to wrap.
     */
    var ActiveConnectionWrapper = function ActiveConnectionWrapper(name, startDate, activeConnection) {

        /**
         * The display name of this connection.
         *
         * @type String
         */
        this.name = name;

        /**
         * The date and time this session began, pre-formatted for display.
         *
         * @type String
         */
        this.startDate = startDate;

        /**
         * The wrapped ActiveConnection.
         *
         * @type ActiveConnection
         */
        this.activeConnection = activeConnection;

        /**
         * A flag indicating that the active connection has been selected.
         *
         * @type Boolean
         */
        this.checked = false;

    };

    return ActiveConnectionWrapper;

}]);