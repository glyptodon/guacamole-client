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
 * A service for setting and retrieving browser-local preferences. Preferences
 * may be any JSON-serializable type.
 */
angular.module('settings').factory('preferenceService', ['$injector',
        function preferenceService($injector) {

    // Required services
    var $window    = $injector.get('$window');
    var $rootScope = $injector.get('$rootScope');

    var service = {};

    // The parameter name for getting the history from local storage
    var GUAC_PREFERENCES_STORAGE_KEY = "GUAC_PREFERENCES";

    /**
     * All currently-set preferences, as name/value pairs. Each property name
     * corresponds to the name of a preference.
     *
     * @type Object.<String, Object>
     */
    service.preferences = {

        /**
         * Whether translation of touch to mouse events should emulate an
         * absolute pointer device, or a relative pointer device.
         * 
         * @type Boolean
         */
        emulateAbsoluteMouse : true,

        /**
         * The default input method. This may be either "none", "osk", or
         * "text".
         *
         * @type String
         */
        inputMethod : null

    };

    /**
     * Persists the current values of all preferences, if possible.
     */
    service.save = function save() {

        // Save updated preferences, ignore inability to use localStorage
        try {
            if (localStorage)
                localStorage.setItem(GUAC_PREFERENCES_STORAGE_KEY, JSON.stringify(service.preferences));
        }
        catch (ignore) {}

    };

    // Get stored preferences, ignore inability to use localStorage
    try {

        if (localStorage) {
            var preferencesJSON = localStorage.getItem(GUAC_PREFERENCES_STORAGE_KEY);
            if (preferencesJSON)
                service.preferences = JSON.parse(preferencesJSON);
        }

    }
    catch (ignore) {}

    // Choose reasonable default input method based on best-guess at platform
    if (service.preferences.inputMethod === null) {

        // Use text input by default if platform likely lacks physical keyboard
        if (/android|ipad|iphone/i.test(navigator.userAgent))
            service.preferences.inputMethod = 'text';
        else
            service.preferences.inputMethod = 'none';

    }

    // Persist settings when window is unloaded
    $window.addEventListener('unload', service.save);

    // Persist settings upon navigation 
    $rootScope.$on('$routeChangeSuccess', function handleNavigate() {
        service.save();
    });

    // Persist settings upon logout
    $rootScope.$on('guacLogout', function handleLogout() {
        service.save();
    });

    return service;

}]);
