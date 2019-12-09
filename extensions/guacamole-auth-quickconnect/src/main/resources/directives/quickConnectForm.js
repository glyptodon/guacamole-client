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
 * Directive which allows ad-hoc connections to be established from a URI. The
 * form contains a single input field which, when submitted, creates and
 * connects to a connection which is stored only for the duration of the user's
 * session.
 */
angular.module('guacQuickConnect').directive('quickConnectForm', [function quickConnectForm() {

    var directive = {
        restrict    : 'E',
        replace     : true,
        templateUrl : 'app/ext/quickconnect/templates/quickConnectForm.html'
    };

    directive.controller = ['$scope', '$injector', function quickConnectFormController($scope, $injector) {

        // Required types
        var ClientIdentifier    = $injector.get('ClientIdentifier');

        // Required services
        var $location            = $injector.get('$location');
        var guacNotification     = $injector.get('guacNotification');
        var quickConnectService  = $injector.get('quickConnectService');

        /**
         * Creates or updates a connection using the provided URI, immediately
         * connecting to that connection if the creation operation succeeds. If
         * an error prevents the connection from being created (or updated), an
         * error dialog is presented and the user is not navigated to the
         * connection.
         *
         * @param {String} uri
         *     The URI of the connection to be created or updated.
         */
        $scope.connect = function connect(uri) {
            quickConnectService.saveConnection(uri)
            .then(function connectionSaved(identifier) {
                $location.url('/client/' + ClientIdentifier.toString({
                    dataSource : 'quickconnect',
                    type       : ClientIdentifier.Types.CONNECTION,
                    id         : identifier
                }));
            }, guacNotification.SHOW_REQUEST_ERROR);
        };

    }];

    return directive;

}]);
