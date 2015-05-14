/*
 * Copyright (C) 2014 Glyptodon LLC
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
 * A directive which displays the contents of a connection group.
 */
angular.module('home').directive('guacRecentConnections', [function guacRecentConnections() {

    return {
        restrict: 'E',
        replace: true,
        scope: {

            /**
             * The root connection group, and all visible descendants.
             * Recent connections will only be shown if they exist within this
             * hierarchy, regardless of their existence within the history.
             *
             * @type ConnectionGroup
             */
            rootGroup : '='

        },

        templateUrl: 'app/home/templates/guacRecentConnections.html',
        controller: ['$scope', '$injector', function guacRecentConnectionsController($scope, $injector) {

            // Required types
            var ActiveConnection = $injector.get('ActiveConnection');
            var RecentConnection = $injector.get('RecentConnection');

            // Required services
            var guacClientManager = $injector.get('guacClientManager');
            var guacHistory       = $injector.get('guacHistory');

            /**
             * Array of all known and visible active connections.
             *
             * @type ActiveConnection[]
             */
            $scope.activeConnections = [];

            /**
             * Array of all known and visible recently-used connections.
             *
             * @type RecentConnection[]
             */
            $scope.recentConnections = [];

            /**
             * Returns whether recent connections are available for display.
             * Note that, for the sake of this directive, recent connections
             * include any currently-active connections, even if they are not
             * yet in the history.
             *
             * @returns {Boolean}
             *     true if recent (or active) connections are present, false
             *     otherwise.
             */
            $scope.hasRecentConnections = function hasRecentConnections() {
                return !!($scope.activeConnections.length || $scope.recentConnections.length);
            };

            /**
             * Map of all visible objects, connections or connection groups, by
             * object identifier.
             *
             * @type Object.<String, Connection|ConnectionGroup>
             */
            var visibleObjects = {};

            /**
             * Adds the given connection to the internal set of visible
             * objects.
             * 
             * @param {Connection} connection
             *     The connection to add to the internal set of visible objects.
             */
            var addVisibleConnection = function addVisibleConnection(connection) {

                // Add given connection to set of visible objects
                visibleObjects['c/' + connection.identifier] = connection;

            };

            /**
             * Adds the given connection group to the internal set of visible
             * objects, along with any descendants.
             * 
             * @param {ConnectionGroup} connectionGroup
             *     The connection group to add to the internal set of visible
             *     objects, along with any descendants.
             */
            var addVisibleConnectionGroup = function addVisibleConnectionGroup(connectionGroup) {

                // Add given connection group to set of visible objects
                visibleObjects['g/' + connectionGroup.identifier] = connectionGroup;

                // Add all child connections
                if (connectionGroup.childConnections)
                    connectionGroup.childConnections.forEach(addVisibleConnection);

                // Add all child connection groups
                if (connectionGroup.childConnectionGroups)
                    connectionGroup.childConnectionGroups.forEach(addVisibleConnectionGroup);

            };

            // Update visible objects when root group is set
            $scope.$watch("rootGroup", function setRootGroup(rootGroup) {

                // Clear connection arrays
                $scope.activeConnections = [];
                $scope.recentConnections = [];

                // Produce collection of visible objects
                visibleObjects = {};
                if (rootGroup)
                    addVisibleConnectionGroup(rootGroup);

                var managedClients = guacClientManager.getManagedClients();

                // Add all active connections
                for (var id in managedClients) {

                    // Get corresponding managed client
                    var client = managedClients[id];

                    // Add active connections for clients with associated visible objects
                    if (id in visibleObjects) {

                        var object = visibleObjects[id];
                        $scope.activeConnections.push(new ActiveConnection(object.name, client));

                    }

                }

                // Add any recent connections that are visible
                guacHistory.recentConnections.forEach(function addRecentConnection(historyEntry) {

                    // Add recent connections for history entries with associated visible objects
                    if (historyEntry.id in visibleObjects && !(historyEntry.id in managedClients)) {

                        var object = visibleObjects[historyEntry.id];
                        $scope.recentConnections.push(new RecentConnection(object.name, historyEntry));

                    }

                });

            }); // end rootGroup scope watch

        }]

    };
}]);
