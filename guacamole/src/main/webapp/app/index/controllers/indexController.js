/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * The controller for the root of the application.
 */
angular.module('index').controller('indexController', ['$scope', '$injector',
        function indexController($scope, $injector) {

    // Required services
    var $window          = $injector.get('$window');
    var clipboardService = $injector.get('clipboardService');
    var guacNotification = $injector.get('guacNotification');
    var guacKeyboard     = $injector.get('guacKeyboard');
    
    /**
     * The notification service.
     */
    $scope.guacNotification = guacNotification;

    /**
     * The message to display to the user as instructions for the login
     * process.
     *
     * @type TranslatableMessage
     */
    $scope.loginHelpText = null;

    /**
     * The credentials that the authentication service is has already accepted,
     * pending additional credentials, if any. If the user is logged in, or no
     * credentials have been accepted, this will be null. If credentials have
     * been accepted, this will be a map of name/value pairs corresponding to
     * the parameters submitted in a previous authentication attempt.
     *
     * @type Object.<String, String>
     */
    $scope.acceptedCredentials = null;

    /**
     * The credentials that the authentication service is currently expecting,
     * if any. If the user is logged in, this will be null.
     *
     * @type Field[]
     */
    $scope.expectedCredentials = null;

    /**
     * Basic page-level information.
     */
    $scope.page = {

        /**
         * The title of the page.
         * 
         * @type String
         */
        title: '',

        /**
         * The name of the CSS class to apply to the page body, if any.
         *
         * @type String
         */
        bodyClassName: ''

    };

    // Broadcast keydown events
    guacKeyboard.onkeydown = function onkeydown(keysym) {

        // Do not handle key events if not logged in
        if ($scope.expectedCredentials)
            return true;

        // Warn of pending keydown
        var guacBeforeKeydownEvent = $scope.$broadcast('guacBeforeKeydown', keysym, guacKeyboard);
        if (guacBeforeKeydownEvent.defaultPrevented)
            return true;

        // If not prevented via guacBeforeKeydown, fire corresponding keydown event
        var guacKeydownEvent = $scope.$broadcast('guacKeydown', keysym, guacKeyboard);
        return !guacKeydownEvent.defaultPrevented;

    };
    
    // Broadcast keyup events
    guacKeyboard.onkeyup = function onkeyup(keysym) {

        // Do not handle key events if not logged in
        if ($scope.expectedCredentials)
            return;

        // Warn of pending keyup
        var guacBeforeKeydownEvent = $scope.$broadcast('guacBeforeKeyup', keysym, guacKeyboard);
        if (guacBeforeKeydownEvent.defaultPrevented)
            return;

        // If not prevented via guacBeforeKeyup, fire corresponding keydown event
        $scope.$broadcast('guacKeyup', keysym, guacKeyboard);

    };

    // Release all keys when window loses focus
    $window.onblur = function () {
        guacKeyboard.reset();
    };

    /**
     * Checks whether the clipboard data has changed, firing a new
     * "guacClipboard" event if it has.
     */
    var checkClipboard = function checkClipboard() {
        clipboardService.getLocalClipboard().then(function clipboardRead(data) {
            $scope.$broadcast('guacClipboard', data);
        });
    };

    // Attempt to read the clipboard if it may have changed
    $window.addEventListener('load',  checkClipboard, true);
    $window.addEventListener('copy',  checkClipboard, true);
    $window.addEventListener('cut',   checkClipboard, true);
    $window.addEventListener('focus', function focusGained(e) {

        // Only recheck clipboard if it's the window itself that gained focus
        if (e.target === $window)
            checkClipboard();

    }, true);

    // Display login screen if a whole new set of credentials is needed
    $scope.$on('guacInvalidCredentials', function loginInvalid(event, parameters, error) {
        $scope.page.title = 'APP.NAME';
        $scope.page.bodyClassName = '';
        $scope.loginHelpText = null;
        $scope.acceptedCredentials = {};
        $scope.expectedCredentials = error.expected;
    });

    // Prompt for remaining credentials if provided credentials were not enough
    $scope.$on('guacInsufficientCredentials', function loginInsufficient(event, parameters, error) {
        $scope.page.title = 'APP.NAME';
        $scope.page.bodyClassName = '';
        $scope.loginHelpText = error.translatableMessage;
        $scope.acceptedCredentials = parameters;
        $scope.expectedCredentials = error.expected;
    });

    // Clear login screen if login was successful
    $scope.$on('guacLogin', function loginSuccessful() {
        $scope.loginHelpText = null;
        $scope.acceptedCredentials = null;
        $scope.expectedCredentials = null;
    });

    // Update title and CSS class upon navigation
    $scope.$on('$routeChangeSuccess', function(event, current, previous) {
       
        // If the current route is available
        if (current.$$route) {

            // Set title
            var title = current.$$route.title;
            if (title)
                $scope.page.title = title;

            // Set body CSS class
            $scope.page.bodyClassName = current.$$route.bodyClassName || '';
        }

    });

}]);
