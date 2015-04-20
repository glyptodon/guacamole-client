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
 * A directive for managing all users in the system.
 */
angular.module('settings').directive('guacSettingsUsers', [function guacSettingsUsers() {
    
    return {
        // Element only
        restrict: 'E',
        replace: true,

        scope: {
        },

        templateUrl: 'app/settings/templates/settingsUsers.html',
        controller: ['$scope', '$injector', function settingsUsersController($scope, $injector) {

            // Required types
            var PermissionSet   = $injector.get('PermissionSet');
            var User            = $injector.get('User');

            // Required services
            var $location              = $injector.get('$location');
            var authenticationService  = $injector.get('authenticationService');
            var guacNotification       = $injector.get('guacNotification');
            var permissionService      = $injector.get('permissionService');
            var userService            = $injector.get('userService');

            // Identifier of the current user
            var currentUserID = authenticationService.getCurrentUserID();

            /**
             * An action to be provided along with the object sent to
             * showStatus which closes the currently-shown status dialog.
             */
            var ACKNOWLEDGE_ACTION = {
                name        : "SETTINGS_USERS.ACTION_ACKNOWLEDGE",
                // Handle action
                callback    : function acknowledgeCallback() {
                    guacNotification.showStatus(false);
                }
            };

            /**
             * All visible users.
             *
             * @type User[]
             */
            $scope.users = null;

            /**
             * Whether the current user can manage users. If the current
             * permissions have not yet been loaded, this will be null.
             *
             * @type Boolean
             */
            $scope.canManageUsers = null;

            /**
             * Whether the current user can create new users. If the current
             * permissions have not yet been loaded, this will be null.
             *
             * @type Boolean
             */
            $scope.canCreateUsers = null;

            /**
             * The name of the new user to create, if any, when user creation
             * is requested via newUser().
             *
             * @type String
             */
            $scope.newUsername = "";

            /**
             * All permissions associated with the current user, or null if the
             * user's permissions have not yet been loaded.
             *
             * @type PermissionSet
             */
            $scope.permissions = null;

            /**
             * Returns whether critical data has completed being loaded.
             *
             * @returns {Boolean}
             *     true if enough data has been loaded for the user interface
             *     to be useful, false otherwise.
             */
            $scope.isLoaded = function isLoaded() {

                return $scope.users                     !== null
                    && $scope.permissions               !== null
                    && $scope.canManageUsers            !== null
                    && $scope.canCreateUsers            !== null;

            };

            // Retrieve current permissions
            permissionService.getPermissions(currentUserID)
            .success(function permissionsRetrieved(permissions) {

                $scope.permissions = permissions;

                // Determine whether the current user can create new users
                $scope.canCreateUsers =
                       PermissionSet.hasSystemPermission(permissions, PermissionSet.SystemPermissionType.ADMINISTER)
                    || PermissionSet.hasSystemPermission(permissions, PermissionSet.SystemPermissionType.CREATE_USER);

                // Determine whether the current user can manage other users
                $scope.canManageUsers =
                       $scope.canCreateUsers
                    || PermissionSet.hasUserPermission(permissions, PermissionSet.ObjectPermissionType.UPDATE)
                    || PermissionSet.hasUserPermission(permissions, PermissionSet.ObjectPermissionType.DELETE);

                // Return to home if there's nothing to do here
                if (!$scope.canManageUsers)
                    $location.path('/');
                
            });

            // Retrieve all users for whom we have UPDATE or DELETE permission
            userService.getUsers([PermissionSet.ObjectPermissionType.UPDATE, 
                PermissionSet.ObjectPermissionType.DELETE])
            .success(function usersReceived(users) {

                // Display only other users, not self
                $scope.users = users.filter(function isNotSelf(user) {
                    return user.username !== currentUserID;
                });

            });

            /**
             * Creates a new user having the username specified in the user
             * creation interface.
             */
            $scope.newUser = function newUser() {

                // Create user skeleton
                var user = new User({
                    username: $scope.newUsername || ''
                });

                // Create specified user
                userService.createUser(user)

                // Add user to visible list upon success
                .success(function userCreated() {
                    $scope.users.push(user);
                })

                // Notify of any errors
                .error(function userCreationFailed(error) {
                    guacNotification.showStatus({
                        'className'  : 'error',
                        'title'      : 'SETTINGS_USERS.DIALOG_HEADER_ERROR',
                        'text'       : error.message,
                        'actions'    : [ ACKNOWLEDGE_ACTION ]
                    });
                });

                // Reset username
                $scope.newUsername = "";

            };
            
        }]
    };
    
}]);
