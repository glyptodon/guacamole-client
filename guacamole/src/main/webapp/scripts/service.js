/*
 *  Guacamole - Clientless Remote Desktop
 *  Copyright (C) 2010  Michael Jumper
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Main Guacamole web service namespace.
 * @namespace
 */
var GuacamoleService = GuacamoleService || {};

/**
 * An arbitrary Guacamole connection, consisting of an ID/protocol pair.
 * 
 * @constructor
 * @param {String} protocol The protocol used by this connection.
 * @param {String} id The ID associated with this connection.
 */
GuacamoleService.Connection = function(protocol, id) {

    /**
     * Reference to this connection.
     */
    var guac_connection = this;

    /**
     * The protocol associated with this connection.
     */
    this.protocol = protocol;

    /**
     * The ID associated with this connection.
     */
    this.id = id;

    /**
     * All parameters associated with this connection, if available.
     */
    this.parameters = {};

    /**
     * The hierarchy of groups containing this connection. The first element
     * in this array is the highest-level group. If the connection is within
     * the root group, this array will be empty.
     * 
     * @type String[]
     */
    this.path = id.split("/");

    /**
     * The name of this connection. This name is arbitrary and local to the
     * group containing the connection. If the connection is in the root
     * group, this name will be effectively equal to the ID.
     * 
     * @type String
     */
    this.name = guac_connection.path.pop();

    /**
     * An array of GuacamoleService.Connection.Record listing the usage
     * history of this connection.
     */
    this.history = [];

    /**
     * Returns the number of active users of this connection (which may be
     * multiple instances under the same user) by walking the history records.
     * 
     * @return {Number} The number of active users of this connection.
     */
    this.currentUsage = function() {

        // Number of users of this connection
        var usage = 0;

        // Walk history counting active entries
        for (var i=0; i<guac_connection.history.length; i++) {
            if (guac_connection.history[i].active)
                usage++;
        }

        return usage;

    };

};

/**
 * Creates a new GuacamoleService.Connection.Record describing a single
 * session for the given username and having the given start/end times.
 * 
 * @constructor
 * @param {String} username The username of the user who used the connection.
 * @param {Number} start The time that the connection began (in UNIX epoch
 *                       milliseconds).
 * @param {Number} end The time that the connection ended (in UNIX epoch
 *                     milliseconds). This parameter is optional.
 * @param {Boolean} active Whether the connection is currently active.
 */
GuacamoleService.Connection.Record = function(username, start, end, active) {
    
    /**
     * The username of the user associated with this record.
     * @type String
     */
    this.username = username;
    
    /**
     * The time the corresponding connection began.
     * @type Date
     */
    this.start = new Date(start);

    /**
     * The time the corresponding connection terminated (if any).
     * @type Date
     */
    this.end = null;

    /**
     * Whether this connection is currently active.
     */
    this.active = active;

    /**
     * The duration of this connection, in seconds. This value is only
     * defined if the end time is available.
     * @type Number
     */
    this.duration = null;

    // If end time given, intialize end time
    if (end) {
        this.end = new Date(end);
        this.duration = (end - start) / 1000;
    }
    
};

/**
 * A basic set of permissions that can be assigned to a user, describing
 * whether they can create other users/connections and describing which
 * users/connections they have permission to read or modify.
 */
GuacamoleService.PermissionSet = function() {

    /**
     * Whether permission to create users is granted.
     */
    this.create_user = false;

    /**
     * Whether permission to create connections is granted.
     */
    this.create_connection = false;

    /**
     * Whether permission to administer the system in general is granted.
     */
    this.administer = false;

    /**
     * Object with a property entry for each readable user.
     */
    this.read_user = {};

    /**
     * Object with a property entry for each updatable user.
     */
    this.update_user = {};

    /**
     * Object with a property entry for each removable user.
     */
    this.remove_user = {};

    /**
     * Object with a property entry for each administerable user.
     */
    this.administer_user = {};

    /**
     * Object with a property entry for each readable connection.
     */
    this.read_connection = {};

    /**
     * Object with a property entry for each updatable connection.
     */
    this.update_connection = {};

    /**
     * Object with a property entry for each removable connection.
     */
    this.remove_connection = {};

    /**
     * Object with a property entry for each administerable connection.
     */
    this.administer_connection = {};

};

/**
 * Handles the reponse from the given XMLHttpRequest object, throwing an error
 * with a meaningful message if the request failed.
 * 
 * @param {XMLHttpRequest} xhr The XMLHttpRequest to check the response of.
 */
GuacamoleService.handleResponse = function(xhr) {

    // For HTTP Forbidden, just return permission denied
    if (xhr.status == 403)
        throw new Error("Permission denied.");

    // Otherwise, if unsuccessful, throw error with message derived from
    // response
    if (xhr.status != 200) {

        // Retrieve error message
        var message =    xhr.getResponseHeader("Guacamole-Error-Message")
                      || xhr.statusText;

        // Throw error with derived message
        throw new Error(message);

    }

};

/**
 * Collection of service functions which deal with connections. Each function
 * makes an explicit HTTP query to the server, and parses the response.
 */
GuacamoleService.Connections = {

    /**
     * Comparator which compares two GuacamoleService.Connection objects.
     */
    "comparator" : function(a, b) {
        return a.id.localeCompare(b.id);
    },

     /**
      * Returns an array of Connections for which the current user has access.
      * 
      * @param {String} parameters Any parameters which should be passed to the
      *                            server for the sake of authentication
      *                            (optional).
      * @return {GuacamoleService.Connection[]} An array of Connections for
      *                                         which the current user has
      *                                         access.
      */   
    "list" : function(parameters) {

        // Construct request URL
        var list_url = "connections";
        if (parameters) list_url += "?" + parameters;

        // Get connection list
        var xhr = new XMLHttpRequest();
        xhr.open("GET", list_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

        // Otherwise, get list
        var connections = new Array();

        var connectionElements = xhr.responseXML.getElementsByTagName("connection");
        for (var i=0; i<connectionElements.length; i++) {

            // Create connection for each connection element
            var connectionElement = connectionElements[i];
            var connection = new GuacamoleService.Connection(
                connectionElement.getAttribute("protocol"),
                connectionElement.getAttribute("id")
            )

            var j;

            // Add parameter values for each pameter received
            var paramElements = connectionElement.getElementsByTagName("param");
            for (j=0; j<paramElements.length; j++) {

                var paramElement = paramElements[j];
                var name = paramElement.getAttribute("name");

                connection.parameters[name] = paramElement.textContent;

            }

            // Parse history, if available
            var historyElements = connectionElement.getElementsByTagName("history");
            if (historyElements.length == 1) {

                // For each record in history
                var history = historyElements[0];
                var recordElements = history.getElementsByTagName("record");
                for (j=0; j<recordElements.length; j++) {

                    // Get record
                    var recordElement = recordElements[j];
                    var record = new GuacamoleService.Connection.Record(
                        recordElement.textContent,
                        parseInt(recordElement.getAttribute("start")),
                        parseInt(recordElement.getAttribute("end")),
                        recordElement.getAttribute("active") == "yes"
                    );

                    // Append to connection history
                    connection.history.push(record);

                }

            }

            // Add connection
            connections.push(connection);
            
        }

        // Sort connections by ID
        connections.sort(GuacamoleService.Connections.comparator);

        return connections;
 
    },

    /**
     * Creates a new connection.
     * 
     * @param {GuacamoleService.Connection} connection The connection to create.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "create" : function(connection, parameters) {

        // Construct request URL
        var users_url = "connections/create?id=" + encodeURIComponent(connection.id);
        if (parameters) users_url += "&" + parameters;

        // Init POST data
        var data = "protocol=" + encodeURIComponent(connection.protocol);

        // Add parameters
        for (var name in connection.parameters)
            data += "&_" + encodeURIComponent(name)
                 +  "="  + encodeURIComponent(connection.parameters[name]);

        // Add user
        var xhr = new XMLHttpRequest();
        xhr.open("POST", users_url, false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.send(data);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    },

    /**
     * Updates an existing connection.
     * 
     * @param {GuacamoleService.Connection} connection The connection to create.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "update" : function(connection, parameters) {

        // Construct request URL
        var users_url = "connections/update?id=" + encodeURIComponent(connection.id);
        if (parameters) users_url += "&" + parameters;

        // Init POST data
        var data = "protocol=" + encodeURIComponent(connection.protocol);

        // Add parameters
        for (var name in connection.parameters)
            data += "&_" + encodeURIComponent(name)
                 +  "="  + encodeURIComponent(connection.parameters[name]);

        // Add user
        var xhr = new XMLHttpRequest();
        xhr.open("POST", users_url, false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.send(data);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    },

    /**
     * Deletes the connection having the given identifier.
     * 
     * @param {String} id The identifier of the connection to delete.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "remove" : function(id, parameters) {

        // Construct request URL
        var connections_url = "connections/delete?id=" + encodeURIComponent(id);
        if (parameters) connections_url += "&" + parameters;

        // Add user
        var xhr = new XMLHttpRequest();
        xhr.open("GET", connections_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    }

};

/**
 * Collection of service functions which deal with users. Each function
 * makes an explicit HTTP query to the server, and parses the response.
 */
GuacamoleService.Users = {

    /**
     * Returns an array of usernames for which the current user has access.
     * 
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     * @return {String[]} An array of usernames for which the current user has
     *                    access.
     */
    "list" : function(parameters) {

        // Construct request URL
        var users_url = "users";
        if (parameters) users_url += "?" + parameters;

        // Get user list
        var xhr = new XMLHttpRequest();
        xhr.open("GET", users_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

        // Otherwise, get list
        var users = new Array();

        var userElements = xhr.responseXML.getElementsByTagName("user");
        for (var i=0; i<userElements.length; i++)
            users.push(userElements[i].getAttribute("name"));

        // Sort by username
        users.sort();

        return users;
     
    },

    /**
     * Updates the user having the given username.
     * 
     * @param {String} username The username of the user to create.
     * @param {String} password The password to assign to the user (optional).
     * @param {GuacamoleService.PermissionSet} permissions_added All permissions that were added.
     * @param {GuacamoleService.PermissionSet} permissions_removed All permissions that were removed.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "update" : function(username, password, permissions_added,
        permissions_removed, parameters) {

        // Construct request URL
        var users_url = "users/update";
        if (parameters) users_url += "?" + parameters;

        // Init POST data
        var data = "name=" + encodeURIComponent(username);
        if (password) data += "&password=" + encodeURIComponent(password);

        var name;

        // System permissions
        if (permissions_added.create_user)       data += "&%2Bsys=create-user";
        if (permissions_added.create_connection) data += "&%2Bsys=create-connection";
        if (permissions_added.administer)        data += "&%2Bsys=admin";

        // User permissions 
        for (name in permissions_added.read_user)
            data += "&%2Buser=read:"  + encodeURIComponent(name);
        for (name in permissions_added.administer_user)
            data += "&%2Buser=admin:" + encodeURIComponent(name);
        for (name in permissions_added.update_user)
            data += "&%2Buser=update:" + encodeURIComponent(name);
        for (name in permissions_added.remove_user)
            data += "&%2Buser=delete:" + encodeURIComponent(name);

        // Connection permissions 
        for (name in permissions_added.read_connection)
            data += "&%2Bconnection=read:" + encodeURIComponent(name);
        for (name in permissions_added.administer_connection)
            data += "&%2Bconnection=admin:" + encodeURIComponent(name);
        for (name in permissions_added.update_connection)
            data += "&%2Bconnection=update:" + encodeURIComponent(name);
        for (name in permissions_added.remove_connection)
            data += "&%2Bconnection=delete:" + encodeURIComponent(name);

        // Creation permissions
        if (permissions_removed.create_user)       data += "&-sys=create-user";
        if (permissions_removed.create_connection) data += "&-sys=create-connection";
        if (permissions_removed.administer)        data += "&-sys=admin";

        // User permissions 
        for (name in permissions_removed.read_user)
            data += "&-user=read:"  + encodeURIComponent(name);
        for (name in permissions_removed.administer_user)
            data += "&-user=admin:" + encodeURIComponent(name);
        for (name in permissions_removed.update_user)
            data += "&-user=update:" + encodeURIComponent(name);
        for (name in permissions_removed.remove_user)
            data += "&-user=delete:" + encodeURIComponent(name);

        // Connection permissions 
        for (name in permissions_removed.read_connection)
            data += "&-connection=read:" + encodeURIComponent(name);
        for (name in permissions_removed.administer_connection)
            data += "&-connection=admin:" + encodeURIComponent(name);
        for (name in permissions_removed.update_connection)
            data += "&-connection=update:" + encodeURIComponent(name);
        for (name in permissions_removed.remove_connection)
            data += "&-connection=delete:" + encodeURIComponent(name);

        // Update user
        var xhr = new XMLHttpRequest();
        xhr.open("POST", users_url, false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.send(data);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    },

    /**
     * Creates a new user having the given username.
     * 
     * @param {String} username The username of the user to create.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "create" : function(username, parameters) {

        // Construct request URL
        var users_url = "users/create?name=" + encodeURIComponent(username);
        if (parameters) users_url += "&" + parameters;

        // Add user
        var xhr = new XMLHttpRequest();
        xhr.open("GET", users_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    },

    /**
     * Deletes the user having the given username.
     * 
     * @param {String} username The username of the user to delete.
     * @param {String} parameters Any parameters which should be passed to the
     *                            server for the sake of authentication
     *                            (optional).
     */
    "remove" : function(username, parameters) {

        // Construct request URL
        var users_url = "users/delete?name=" + encodeURIComponent(username);
        if (parameters) users_url += "&" + parameters;

        // Add user
        var xhr = new XMLHttpRequest();
        xhr.open("GET", users_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

    }

};

/**
 * Collection of service functions which deal with permissions. Each function
 * makes an explicit HTTP query to the server, and parses the response.
 */
GuacamoleService.Permissions = {

     /**
      * Returns a PermissionSet describing the permissions given to a
      * specified user.
      *
      * @param {String} username The username of the user to list permissions
      *                          of. 
      * @param {String} parameters Any parameters which should be passed to the
      *                            server for the sake of authentication
      *                            (optional).
      * @return {GuacamoleService.PermissionSet} A PermissionSet describing the
      *                                          permissions given to the
      *                                          specified user.
      */   
    "list" : function(username, parameters) {

        // Construct request URL
        var list_url = "permissions";
        if (parameters) list_url += "?" + parameters;

        // Init POST data
        var data;
        if (username)
            data = "user=" + encodeURIComponent(username);
        else
            data = null;

        // Get permission list
        var xhr = new XMLHttpRequest();
        xhr.open("POST", list_url, false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.send(data);

        // Handle response
        GuacamoleService.handleResponse(xhr);

        // Otherwise, build PermissionSet
        var i, type, name;
        var permissions = new GuacamoleService.PermissionSet();

        // Read system permissions
        var connectionsElements = xhr.responseXML.getElementsByTagName("system");
        for (i=0; i<connectionsElements.length; i++) {

            // Get type
            type = connectionsElements[i].getAttribute("type");
            switch (type) {

                // Create connection permission
                case "create-connection":
                    permissions.create_connection = true;
                    break;

                // Create user permission
                case "create-user":
                    permissions.create_user = true;
                    break;

                // System admin permission
                case "admin":
                    permissions.administer = true;
                    break;

            }

        }

        // Read connection permissions
        var connectionElements = xhr.responseXML.getElementsByTagName("connection");
        for (i=0; i<connectionElements.length; i++) {

            // Get name and type
            type = connectionElements[i].getAttribute("type");
            name = connectionElements[i].getAttribute("name");

            switch (type) {

                // Read permission
                case "read":
                    permissions.read_connection[name] = true;
                    break;

                // Update permission
                case "update":
                    permissions.update_connection[name] = true;
                    break;

                // Admin permission
                case "admin":
                    permissions.administer_connection[name] = true;
                    break;

                // Delete permission
                case "delete":
                    permissions.remove_connection[name] = true;
                    break;

            }

        }

        // Read user permissions
        var userElements = xhr.responseXML.getElementsByTagName("user");
        for (i=0; i<userElements.length; i++) {

            // Get name and type
            type = userElements[i].getAttribute("type");
            name = userElements[i].getAttribute("name");

            switch (type) {

                // Read permission
                case "read":
                    permissions.read_user[name] = true;
                    break;

                // Update permission
                case "update":
                    permissions.update_user[name] = true;
                    break;

                // Admin permission
                case "admin":
                    permissions.administer_user[name] = true;
                    break;

                // Delete permission
                case "delete":
                    permissions.remove_user[name] = true;
                    break;

            }

        }

        return permissions;
 
    }

};

/**
 * Representation of a protocol supported by Guacamole, having a given name,
 * title, and set of parameters.
 */
GuacamoleService.Protocol = function(name, title, parameters) {

    /**
     * The unique name associated with this protocol. This is the name that is
     * used to identify the protocol to Guacamole.
     */
    this.name = name;

    /**
     * A human-readable title describing this protocol. This is what the user
     * will use to identify the protocol.
     */
    this.title = title;

    /**
     * Array of all available parameters, in desired order of presentation.
     * @type GuacamoleService.Protocol.Parameter[]
     */
    this.parameters = parameters || [];

};

/**
 * A parameter belonging to a protocol. Each parameter has a name which
 * identifies the parameter to the protocol, a human-readable title, 
 * a value for boolean parameters, and a type which dictates 
 * its presentation to the user.
 */
GuacamoleService.Protocol.Parameter = function(name, title, type, value, options) {

    /**
     * The name of this parameter.
     */
    this.name = name;

    /**
     * A human-readable title describing this parameter.
     */
    this.title = title;

    /**
     * The type of this parameter.
     */
    this.type = type;

    /**
     * The value of this parameter.
     */
    this.value = value;

    /**
     * All available options, if applicable, in desired order of presentation.
     * @type GuacamoleService.Protocol.Parameter.Option[]
     */
    this.options = options || [];

};

/**
 * An option for a parameter. A parameter has options if it only has a specified
 * and enumerated legal set of values.
 */
GuacamoleService.Protocol.Parameter.Option = function(value, title) {

    /**
     * The value of this option. This is the value that will be assigned to the
     * parameter if this option is chosen.
     */
    this.value = value;

    /**
     * The title of this option. This is the value that will be presented to the
     * user for selection.
     */
    this.title = title;

};

/**
 * A free-form text field.
 */
GuacamoleService.Protocol.Parameter.TEXT     = 0;

/**
 * A password field.
 */
GuacamoleService.Protocol.Parameter.PASSWORD = 1;

/**
 * A numeric field.
 */
GuacamoleService.Protocol.Parameter.NUMERIC  = 2;

/**
 * A boolean (checkbox) field.
 */
GuacamoleService.Protocol.Parameter.BOOLEAN  = 3;

/**
 * An enumerated (select) field.
 */
GuacamoleService.Protocol.Parameter.ENUM     = 4;

/**
 * Collection of service functions which deal with protocols. Each function
 * makes an explicit HTTP query to the server, and parses the response.
 */
GuacamoleService.Protocols = {

     /**
      * Returns an array containing all available protocols and all
      * corresponding parameters, as well as hints regarding expected datatype
      * and allowed/default values.
      * 
      * Note that this function is a stub returning a simple object until the
      * corresponding server-side component is created.
      *
      * @param {String} parameters Any parameters which should be passed to the
      *                            server for the sake of authentication
      *                            (optional).
      * @return {GuacamoleService.Protocol[]} An array containing all available
      *                                     protocols.
      */   
    "list" : function(parameters) {

        // Construct request URL
        var list_url = "protocols";
        if (parameters) list_url += "?" + parameters;

        // Get permission list
        var xhr = new XMLHttpRequest();
        xhr.open("GET", list_url, false);
        xhr.send(null);

        // Handle response
        GuacamoleService.handleResponse(xhr);

        // Array of all protocols
        var protocols = [];

        // Parse all protocols
        var protocolElements = xhr.responseXML.getElementsByTagName("protocol");
        for (var i=0; i<protocolElements.length; i++) {

            // Get protocol element
            var protocolElement = protocolElements[i];

            // Create corresponding protocol
            var protocol = new GuacamoleService.Protocol(
                protocolElement.getAttribute("name"),
                protocolElement.getAttribute("title")
            );

            // Parse all parameters
            var paramElements = protocolElement.getElementsByTagName("param");
            for (var j=0; j<paramElements.length; j++) {

                // Get parameter element
                var paramElement = paramElements[j];

                // Create corresponding parameter
                var parameter = new GuacamoleService.Protocol.Parameter(
                    paramElement.getAttribute("name"),
                    paramElement.getAttribute("title")
                );

                // Parse type
                switch (paramElement.getAttribute("type")) {

                    // Text parameter
                    case "text":
                        parameter.type = GuacamoleService.Protocol.Parameter.TEXT;
                        break;

                    // Password parameter
                    case "password":
                        parameter.type = GuacamoleService.Protocol.Parameter.PASSWORD;
                        break;

                    // Numeric parameter
                    case "numeric":
                        parameter.type = GuacamoleService.Protocol.Parameter.NUMERIC;
                        break;

                    // Boolean parameter
                    case "boolean":
                        parameter.type = GuacamoleService.Protocol.Parameter.BOOLEAN;
                        parameter.value = paramElement.getAttribute("value");
                        break;

                    // Enumerated parameter
                    case "enum":
                        parameter.type = GuacamoleService.Protocol.Parameter.ENUM;
                        break;

                }

                // Parse all options
                var optionElements = paramElement.getElementsByTagName("option");
                for (var k=0; k<optionElements.length; k++) {

                    // Get option element
                    var optionElement = optionElements[k];

                    parameter.options.push(
                        new GuacamoleService.Protocol.Parameter.Option(
                            optionElement.getAttribute("value"),
                            optionElement.textContent
                        ));

                } // end for each option

                // Add parameter 
                protocol.parameters.push(parameter);

            } // end for each parameter

            // Add protocol
            protocols.push(protocol);

        } // end for each protocol

        return protocols;

    }

};