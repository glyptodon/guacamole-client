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
 * Service for creating connections from URIs.
 */
angular.module('guacQuickConnect').factory('quickConnectService', ['$injector',
    function quickConnectService($injector) {

    /**
     * Regular expression which validates and parses a URI into its components.
     *
     * @constant
     * @type RegExp
     */
    var URI_REGEX = new RegExp(
        /* PROTOCOL://...                    */   '^([^:]+)://'
        /* ...USERNAME:PASSWORD@...          */ + '(?:([^@:]*)(?::([^@]*))?@)?'
        /* ...HOSTNAME...                    */ + '([^?/:]*)'
        /* ...:PORT...                       */ + '(?::([0-9]+))?'
        /* .../?PARAMETERS or ...?PARAMETERS */ + '(?:/)?(?:\\?(.*))?$'
    );

    /**
     * The index of the group containing the protocol (scheme) of a URI which
     * has been parsed using URI_REGEX. The protocol is required and will
     * always be non-empty and non-null for a URI which matches URI_REGEX.
     *
     * @constant
     * @type Number
     */
    var URI_PROTOCOL_GROUP = 1;

    /**
     * The index of the group containing the username specified within a URI
     * which has been parsed using URI_REGEX. If no username is specified,
     * the group may be empty string or null.
     *
     * @constant
     * @type Number
     */
    var URI_USERNAME_GROUP = 2;

    /**
     * The index of the group containing the username specified within a URI
     * which has been parsed using URI_REGEX. If no username is specified,
     * the group may be empty string or null.
     *
     * @constant
     * @type Number
     */
    var URI_PASSWORD_GROUP = 3;

    /**
     * The index of the group containing the password specified within a URI
     * which has been parsed using URI_REGEX. If no password is specified,
     * the group may be empty string or null.
     *
     * @constant
     * @type Number
     */
    var URI_HOSTNAME_GROUP = 4;

    /**
     * The index of the group containing the port specified within a URI which
     * has been parsed using URI_REGEX. If no port is specified, the group may
     * be empty string or null.
     *
     * @constant
     * @type Number
     */
    var URI_PORT_GROUP = 5;

    /**
     * The index of the group containing the query parameters specified within
     * a URI which has been parsed using URI_REGEX. If no parameters are
     * specified, the group may be empty string or null.
     *
     * @constant
     * @type Number
     */
    var URI_QUERY_PARAMS_GROUP = 6;

    // Required services
    var $q                     = $injector.get('$q');
    var connectionGroupService = $injector.get('connectionGroupService');
    var connectionService      = $injector.get('connectionService');
    
    // Required types
    var Connection          = $injector.get('Connection');
    var Error               = $injector.get('Error');
    var TranslatableMessage = $injector.get('TranslatableMessage');

    var service = {};

    /**
     * Creates a BAD_REQUEST error containing the given human-readable message
     * and translation key. The returned error is an Error object which uses
     * the same format as Guacamole's REST API.
     *
     * @private
     * @param {String} message
     *     A human-readable description of the error.
     *
     * @param {String} translation
     *     The key of the translation string which should be used to render the
     *     error if it is displayed within the user interface.
     *
     * @returns {Error}
     *     A BAD_REQUEST error containing the given human-readable message and
     *     translation key.
     */
    var createError = function createError(message, translation) {
        return new Error({
            'type'    : Error.Type.BAD_REQUEST,
            'message' : message,
            'translatableMessage' : new TranslatableMessage({
                'key'       : translation,
                'variables' : {}
            })
        });
    };

    /**
     * Modifies the provided connection, seting the parameter having the given
     * name to the given value. The name and value will be URI-decoded before
     * the value is assigned. If the value is falsy (null, the empty string,
     * etc.), this function has no effect.
     *
     * @private
     * @param {Connection} connection
     *     The Connection whose parameters are being modified.
     *
     * @param {String} name
     *     The URI-encoded name of the parameter to set.
     *
     * @param {String} value
     *     The URI-encoded value that the parameter should be set to.
     */
    var setParameter = function setParameter(connection, name, value) {
        if (name && value)
            connection.parameters[decodeURIComponent(name)] = decodeURIComponent(value);
    };

    /**
     * Automatically derives a name for the given connection using its
     * connection parameters. The name generated is simply a sanitized
     * version of the URI which could be used to produce that same connection.
     *
     * @param {String} connection
     *     The connection to derive a connection name from.
     *
     * @returns {String}
     *     An automatically-derived name for the given connection.
     */
    service.getName = function getName(connection) {

        // PROTOCOL://...
        var name = encodeURIComponent(connection.protocol) + '://';

        // ...USERNAME@...
        if (connection.parameters.username)
            name += encodeURIComponent(connection.parameters.username) + '@';

        // ...HOSTNAME...
        if (connection.parameters.hostname)
            name += encodeURIComponent(connection.parameters.hostname);

        // ...:PORT
        if (connection.parameters.port)
            name += ':' + encodeURIComponent(connection.parameters.port);

        // Final trailing slash
        return name + '/';

    };

    /**
     * Parses the given URI, returning a promise representing the parse
     * operation. If parsing succeeds, the promise is is resolved with a
     * Connection containing the details parsed from the URI. If parsing fails,
     * the promise is rejected with a REST Error describing the failure.
     *
     * @param {String} uri
     *     The URI to parse.
     *
     * @returns {Promise.<Connection, Error>}
     *     A promise which is resolved with a Connection containing the details
     *     parsed from the URI, if parsing succeeds, and is rejected with a
     *     REST Error if parsing fails.
     */
    service.parseURI = function parseURI(uri) {

        // Parse provided URI
        var parsedUri = URI_REGEX.exec(uri);
        if (!parsedUri)
            return $q.reject(createError('Invalid URI Syntax', 'QUICKCONNECT.ERROR_INVALID_URI'));

        var connection = new Connection({
            'parentIdentifier' : 'ROOT',
            'protocol' : decodeURIComponent(parsedUri[URI_PROTOCOL_GROUP]),
            'parameters' : {}
        });

        // Extract core connection parameters from corresponding standard parts
        // of URI
        setParameter(connection, 'username', parsedUri[URI_USERNAME_GROUP]);
        setParameter(connection, 'password', parsedUri[URI_PASSWORD_GROUP]);
        setParameter(connection, 'hostname', parsedUri[URI_HOSTNAME_GROUP]);
        setParameter(connection, 'port',     parsedUri[URI_PORT_GROUP]);

        // Extract arbitrary connection parameteters from query parameters
        if (parsedUri[URI_QUERY_PARAMS_GROUP]) {
            parsedUri[URI_QUERY_PARAMS_GROUP].split(/&/).forEach(function parseQueryParameter(param) {
                var result = /^([^=]+)=(.*)+/.exec(param);
                if (result)
                    setParameter(connection, result[1], result[2]);
            });
        }

        // Derive default name for connection from provided parameters
        connection.name = service.getName(connection);

        return $q.resolve(connection);

    };

    /**
     * Parses the given URI, creating the connection represented by that URI if
     * parsing is successful. If a connection already exists which largely
     * matches the connection that would be created (has the same name), then
     * the existing connection is updated. If the connection is successfully
     * created (or updated), the returned promise will be satisfied with the
     * identifier of the connection.
     * 
     * @param {String} uri
     *     The URI to parse.
     *                          
     * @returns {Promise.<String, Error>}
     *     A promise which is resolved with the identifier of the created
     *     connection if the operation is successful, and is rejected with a
     *     REST Error if the operation fails.
     */
    service.saveConnection = function saveConnection(uri) {

        // Parse connection from provided URI
        return service.parseURI(uri).then(function uriParsed(connection) {

            // Update existing connection, if a matching connection can be found
            return connectionGroupService.getConnectionGroupTree('quickconnect', 'ROOT').then(function rootGroupRetrieved(rootGroup) {

                // Find first connection within root group that has the same name
                var existing = _.find(rootGroup.childConnections, function findIdentifier(child) {
                    return child.name === connection.name;
                });

                // If such a connection is found, update THAT connection rather
                // than create a new one
                if (existing)
                    connection.identifier = existing.identifier;

            })

            // Save/update connection, ultimately resolving with the
            // connection's identifier
            .then(function identifierSearchComplete() {
                return connectionService.saveConnection('quickconnect', connection);
            })
            .then(function connectionSaved() {
                return connection.identifier;
            });

        });

    };
    
    return service;

}]);
