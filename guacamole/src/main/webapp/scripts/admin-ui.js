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
 * General set of UI elements and UI-related functions regarding
 * administration.
 */
var GuacAdmin = {

    "containers" : {
        "connection_list"         : document.getElementById("connection-list"),
        "user_list"               : document.getElementById("user-list"),
        "user_list_buttons"       : document.getElementById("user-list-buttons"),
        "connection_list_buttons" : document.getElementById("connection-list-buttons")
    },

    "buttons" : {
        "back"           : document.getElementById("back"),
        "logout"         : document.getElementById("logout"),
        "add_connection" : document.getElementById("add-connection"),
        "add_user"       : document.getElementById("add-user")
    },

    "fields" : {
        "connection_id" : document.getElementById("connection-id"),
        "username"      : document.getElementById("username")
    },

    "cached_permissions" : null,
    "cached_protocols"   : null,
    "cached_connections" : null,

    "selected_user"       : null,
    "selected_connection" : null

};

/**
 * An arbitrary input field.
 * 
 * @constructor
 */
GuacAdmin.Field = function() {

    /**
     * Returns the DOM Element representing this field.
     * 
     * @return {Element} The DOM Element representing this field.
     */
    this.getElement = function() {};

    /**
     * Returns the value of this field.
     * 
     * @return {String} The value of this field.
     */
    this.getValue = function() {};

    /**
     * Sets the value of this field.
     * 
     * @param {String} value The value of this field.
     */
    this.setValue = function(value) {};

};


/**
 * Simple HTML input field.
 * 
 * @augments GuacAdmin.Field
 * @param {String} type The type of HTML field.
 */
GuacAdmin.Field._HTML_INPUT = function(type) {

    // Call parent constructor
    GuacAdmin.Field.apply(this);

    // Create backing element
    var element = GuacUI.createElement("input");
    element.setAttribute("type", type);

    this.getValue = function() {
        return element.value;
    };

    this.getElement = function() {
        return element;
    };

    this.setValue = function(value) {
        element.value = value;
    };

};

GuacAdmin.Field._HTML_INPUT.prototype = new GuacAdmin.Field();


/**
 * A basic text field.
 * 
 * @augments GuacAdmin.Field._HTML_INPUT
 */
GuacAdmin.Field.TEXT = function() {
    GuacAdmin.Field._HTML_INPUT.apply(this, ["text"]);
};

GuacAdmin.Field.TEXT.prototype = new GuacAdmin.Field._HTML_INPUT();


/**
 * A basic password field.
 * 
 * @augments GuacAdmin.Field._HTML_INPUT
 */
GuacAdmin.Field.PASSWORD = function() {
    GuacAdmin.Field._HTML_INPUT.apply(this, ["password"]);
};

GuacAdmin.Field.PASSWORD.prototype = new GuacAdmin.Field._HTML_INPUT();


/**
 * A basic numeric field, leveraging the new HTML5 field types.
 * 
 * @augments GuacAdmin.Field._HTML_INPUT
 */
GuacAdmin.Field.NUMERIC = function() {
    GuacAdmin.Field._HTML_INPUT.apply(this, ["number"]);
};

GuacAdmin.Field.NUMERIC.prototype = new GuacAdmin.Field._HTML_INPUT();


/**
 * Simple checkbox.
 * 
 * @augments GuacAdmin.Field
 */
GuacAdmin.Field.CHECKBOX = function(value) {

    // Call parent constructor
    GuacAdmin.Field.apply(this);

    // Create backing element
    var element = GuacUI.createElement("input");
    element.setAttribute("type", "checkbox");
    element.setAttribute("value", value);

    this.getValue = function() {
        if (element.checked)
            return value;
        else
            return "";
    };

    this.getElement = function() {
        return element;
    };

    this.setValue = function(new_value) {
        if (new_value == value)
            element.checked = true;
        else
            element.checked = false;
    };

};

GuacAdmin.Field.CHECKBOX.prototype = new GuacAdmin.Field();

/**
 * Enumerated field type.
 * 
 * @augments GuacAdmin.Field
 */
GuacAdmin.Field.ENUM = function(values) {

    // Call parent constructor
    GuacAdmin.Field.apply(this);

    // Create backing element
    var element = GuacUI.createElement("select");
    for (var i=0; i<values.length; i++) {
        var option = GuacUI.createChildElement(element, "option");
        option.textContent = values[i].title;
        option.value = values[i].value;
    }

    this.getValue = function() {
        return element.value;
    };

    this.getElement = function() {
        return element;
    };

    this.setValue = function(value) {
        element.value = value;
    };

};

GuacAdmin.Field.ENUM.prototype = new GuacAdmin.Field();


/**
 * An arbitrary button.
 * 
 * @constructor
 * @param {String} title A human-readable title for the button.
 */
GuacAdmin.Button = function(title) {

    /**
     * A human-readable title describing this button.
     */
    this.title = title;

    // Button element
    var element = GuacUI.createElement("button");
    element.textContent = title;

    /**
     * Returns the DOM element associated with this button.
     */
    this.getElement = function() {
        return element;
    };

};

/**
 * An arbitrary list item with an icon and caption.
 */
GuacAdmin.ListItem = function(type, title) {

    // Create connection display elements
    var element = GuacUI.createElement("div",  "list-item");
    var icon    = GuacUI.createChildElement(element, "div",  "icon");
    var name    = GuacUI.createChildElement(element, "span", "name");
    GuacUI.addClass(icon, type);

    // Set name
    name.textContent = title;

    /**
     * Returns the DOM element representing this connection.
     */
    this.getElement = function() {
        return element;
    };

};

/*
 * Set handler for logout
 */

GuacAdmin.buttons.logout.onclick = function() {
    window.location.href = "logout";
};

/*
 * Set handler for back button 
 */

GuacAdmin.buttons.back.onclick = function() {
    window.location.href = "index.xhtml";
};

/**
 * Returns whether the given object has at least one property.
 */
GuacAdmin.hasEntry = function(object) {
    for (var name in object)
        return true;
    return false;
};

/**
 * Given a Date, returns a formatted String.
 * 
 * @param {Date} date The date tor format.
 * @return {String} A formatted String.
 */
GuacAdmin.formatDate = function(date) {

    var month = date.getMonth() + 1;
    var day   = date.getDate();
    var year  = date.getFullYear();

    var hour   = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    return      ("00" +  month).slice(-2)
        + "/" + ("00" +    day).slice(-2)
        + "/" + year
        + " " + ("00" +   hour).slice(-2)
        + ":" + ("00" + minute).slice(-2)
        + ":" + ("00" + second).slice(-2);

};

/**
 * Given a number of seconds, returns a String representing that length
 * of time in a human-readable format.
 * 
 * @param {Number} seconds The number of seconds.
 * @return {String} A human-readable description of the duration specified.
 */
GuacAdmin.formatSeconds = function(seconds) {

    function round(value) {
        return Math.round(value * 10) / 10;
    }

    if (seconds < 60)    return round(seconds)        + " seconds";
    if (seconds < 3600)  return round(seconds / 60)   + " minutes";
    if (seconds < 86400) return round(seconds / 3600) + " hours";
    return round(seconds / 86400) + " days";

};

/**
 * Currently-defined pager for users, if any.
 */
GuacAdmin.userPager = null;

/**
 * Adds the user with the given name to the displayed user list.
 */
GuacAdmin.addUser = function(name, parameters) {

    // Create user list item
    var item = new GuacAdmin.ListItem("user", name);
    var item_element = item.getElement();
    GuacAdmin.userPager.addElement(item_element);

    // When clicked, build and display property form
    item_element.onclick = function() {

        // Ignore clicks if any item is selected
        if (GuacAdmin.selected_user) return;
        else GuacAdmin.selected_user = name;

        // Get user permissions
        var user_perms = GuacamoleService.Permissions.list(name, parameters);

        // Permission deltas
        var added_perms   = new GuacamoleService.PermissionSet();
        var removed_perms = new GuacamoleService.PermissionSet();

        // Create form base elements
        var form_element = GuacUI.createElement("div", "form");
        var user_header = GuacUI.createChildElement(form_element, "h2");
        var sections = GuacUI.createChildElement(
            GuacUI.createChildElement(form_element, "div", "settings section"),
            "dl");

        var field_header = GuacUI.createChildElement(sections, "dt");
        var field_table  = GuacUI.createChildElement(
            GuacUI.createChildElement(sections, "dd"),
            "table", "fields section");

        user_header.textContent = name;
        field_header.textContent = "Properties:";

        // Deselect
        function deselect() {
            GuacUI.removeClass(GuacAdmin.containers.user_list, "disabled");
            GuacUI.removeClass(item_element, "selected");
            item_element.removeChild(form_element);
            GuacAdmin.selected_user = null;
        }

        // Select
        function select() {
            GuacUI.addClass(GuacAdmin.containers.user_list, "disabled");
            GuacUI.addClass(item_element, "selected");
            item_element.appendChild(form_element);
        }

        // Add password field
        var password_field = GuacUI.createChildElement(
                GuacUI.createTabulatedContainer(field_table, "Password:"),
                "input");
        password_field.setAttribute("type",  "password");
        password_field.setAttribute("value", "password");
            
        // Add password re-entry field
        var reenter_password_field = GuacUI.createChildElement(
                GuacUI.createTabulatedContainer(field_table, "Re-enter Password:"),
                "input");
        reenter_password_field.setAttribute("type",  "password");
        reenter_password_field.setAttribute("value", "password");

        // Update password if changed
        var password_modified = false;
        password_field.onchange =
        reenter_password_field.onchange = function() {
            password_modified = true;
        };

        // If administrator, allow manipulation of admin permissions on users
        if (GuacAdmin.cached_permissions.administer) {

            var permission_header = GuacUI.createChildElement(sections, "dt");
            var permission_table  = GuacUI.createChildElement(
                GuacUI.createChildElement(sections, "dd"),
                "table", "permissions section");

            permission_header.textContent = "Permissions:";

            // Add system administration checkbox
            var is_admin = GuacUI.createChildElement(
                    GuacUI.createTabulatedContainer(permission_table, "Administer system:"),
                    "input");
            is_admin.setAttribute("type", "checkbox");
            is_admin.setAttribute("value", "administer");

            // Check if set
            if (user_perms.administer)
                is_admin.checked = true;

            // Add create user permission checkbox
            var create_users = GuacUI.createChildElement(
                    GuacUI.createTabulatedContainer(permission_table, "Create new users:"),
                    "input");
            create_users.setAttribute("type", "checkbox");
            create_users.setAttribute("value",  "create_user");

            // Check if set
            if (user_perms.create_user)
                create_users.checked = true;

            // Add create connection permission checkbox
            var create_connections = GuacUI.createChildElement(
                    GuacUI.createTabulatedContainer(permission_table, "Create new connections:"),
                    "input");
            create_connections.setAttribute("type", "checkbox");
            create_connections.setAttribute("value", "create_connection");

            // Check if set
            if (user_perms.create_connection)
                create_connections.checked = true;

            // Update system permissions when changed
            is_admin.onclick = create_users.onclick =
            create_connections.onclick = function() {

                // Update permission deltas for ADDED permission
                if (this.checked) {
                    added_perms[this.value]   = true;
                    removed_perms[this.value] = false;
                }

                // Update permission deltas for REMOVED permission
                else {
                    added_perms[this.value]   = false;
                    removed_perms[this.value] = true;
                }

            }

        }

        // If readable connections exist, list them
        if (GuacAdmin.cached_permissions.administer ||
            GuacAdmin.hasEntry(GuacAdmin.cached_permissions.administer_connection)) {

            // Add fields for per-connection checkboxes
            var connections_header = GuacUI.createChildElement(sections, "dt");
            connections_header.textContent = "Connections:";

            var connections_section = GuacUI.createChildElement(sections, "dd");

            // Actual paged connections list
            var connections = GuacUI.createChildElement(
                connections_section, "div", "list");

            // Button div
            var connections_buttons = GuacUI.createChildElement(
                connections_section, "div", "list-pager-buttons");

            // Create pager which populates list
            var connections_pager = new GuacUI.Pager(connections);

            // Add connections to pager
            var available_connections = GuacAdmin.cached_connections;
            for (var i=0; i<available_connections.length; i++) {

                // If no admin permission, do not list connection
                var conn = available_connections[i].id;
                if (!GuacAdmin.cached_permissions.administer &&
                        !(conn in GuacAdmin.cached_permissions.administer_connection))
                    continue;

                var connection       = GuacUI.createElement("div", "connection");
                var connection_field = GuacUI.createChildElement(connection, "input");
                var connection_name  = GuacUI.createChildElement(connection, "span", "name");

                connection_field.setAttribute("type", "checkbox");
                connection_field.setAttribute("value", conn);

                // Check checkbox if connection readable by selected user
                if (conn in user_perms.read_connection)
                    connection_field.checked = true;

                // Update selected connections when changed
                connection_field.onclick = connection_field.onchange = function() {

                    // Update permission deltas for ADDED permission
                    if (this.checked) {
                        added_perms.read_connection[this.value] = true;
                        if (removed_perms.read_connection[this.value])
                            delete removed_perms.read_connection[this.value];
                        
                    }

                    // Update permission deltas for REMOVED permission
                    else {
                        removed_perms.read_connection[this.value] = true;
                        if (added_perms.read_connection[this.value])
                            delete added_perms.read_connection[this.value];
                    }

                };

                connection_name.textContent = conn;
                connections_pager.addElement(connection);

            }

            // If more than one page, show buttons
            if (connections_pager.last_page != 0)
                connections_buttons.appendChild(connections_pager.getElement());

            // Start at page 0
            connections_pager.setPage(0);

        }

        // Add buttons
        var button_div = GuacUI.createChildElement(form_element, "div", "object-buttons");

        // Add save button
        var save_button = GuacUI.createChildElement(button_div, "button");
        save_button.textContent = "Save";
        save_button.onclick = function(e) {

            e.stopPropagation();

            try {

                // If password modified, use password given
                var password;
                if (password_modified) {

                    // Get passwords
                    password = password_field.value;
                    var reentered_password = reenter_password_field.value;

                    // Check that passwords match
                    if (password != reentered_password)
                        throw new Error("Passwords do not match.");

                }

                // Otherwise, do not change password
                else
                    password = null;

                // Save user
                GuacamoleService.Users.update(GuacAdmin.selected_user, password, added_perms, removed_perms, parameters);
                deselect();
                GuacAdmin.reset();

            }
            catch (e) {
                alert(e.message);
            }

        };

        // Add cancel button
        var cancel_button = GuacUI.createChildElement(button_div, "button");
        cancel_button.textContent = "Cancel";
        cancel_button.onclick = function(e) {
            e.stopPropagation();
            deselect();
        };

        // Add delete button if permission available
        if (GuacAdmin.cached_permissions.administer ||
            name in GuacAdmin.cached_permissions.remove_user) {
            
            // Create button
            var delete_button = GuacUI.createChildElement(button_div, "button", "danger");
            delete_button.textContent = "Delete";
            
            // Remove selected user when clicked
            delete_button.onclick = function(e) {

                e.stopPropagation();

                // Delete user upon confirmation
                if (confirm("Are you sure you want to delete the user \""
                            + name + "\"?")) {

                    // Attempt to delete user
                    try {
                        GuacamoleService.Users.remove(GuacAdmin.selected_user, parameters);
                        deselect();
                        GuacAdmin.reset();
                    }

                    // Alert on failure
                    catch (e) {
                        alert(e.message);
                    }

                }

            };

        }

        // Select item
        select();

    };

};

/**
 * Currently-defined pager for connections, if any.
 */
GuacAdmin.connectionPager = null;

/**
 * Adds the given connection to the displayed connection list.
 */
GuacAdmin.addConnection = function(connection, parameters) {

    var item = new GuacAdmin.ListItem("connection", connection.id);
    var item_element = item.getElement();
    GuacAdmin.connectionPager.addElement(item_element);

    item_element.onclick = function() {

        // Ignore clicks if any item is selected
        if (GuacAdmin.selected_connection) return;
        else GuacAdmin.selected_connection = connection.id;

        var i;

        // Create form base elements
        var form_element = GuacUI.createElement("div", "form");
        var connection_header = GuacUI.createChildElement(form_element, "h2");
        connection_header.textContent = connection.id;

        var sections = GuacUI.createChildElement(
            GuacUI.createChildElement(form_element, "div", "settings section"),
            "dl");

        // Parameter header
        var protocol_header = GuacUI.createChildElement(sections, "dt")
        protocol_header.textContent = "Protocol:";
        
        var protocol_field = GuacUI.createChildElement(protocol_header, "select");

        // Associative set of protocols
        var available_protocols = {};

        // All form fields by parameter name
        var fields = {};

        // Add protocols
        for (i=0; i<GuacAdmin.cached_protocols.length; i++) {

            // Get protocol and store in associative set
            var protocol = GuacAdmin.cached_protocols[i];
            available_protocols[protocol.name] = protocol;

            // List protocol in select
            var protocol_title = GuacUI.createChildElement(protocol_field, "option");
            protocol_title.textContent = protocol.title;
            protocol_title.value = protocol.name;

        }

        // Parameter section
        var field_table  = GuacUI.createChildElement(
            GuacUI.createChildElement(sections, "dd"),
            "table", "fields section");

        // History header
        var history_header = GuacUI.createChildElement(sections, "dt")
        history_header.textContent = "Usage History:";

        // If history present, display as table
        if (connection.history.length > 0) {

            // History section
            var history_section = GuacUI.createChildElement(sections, "dd");
            var history_table  = GuacUI.createChildElement(history_section,
                "table", "history section");

            var history_table_header = GuacUI.createChildElement(
                history_table, "tr");

            GuacUI.createChildElement(history_table_header, "th").textContent =
                "Username";

            GuacUI.createChildElement(history_table_header, "th").textContent =
                "Start Time";

            GuacUI.createChildElement(history_table_header, "th").textContent =
                "Duration";

            // Paginated body of history
            var history_buttons = GuacUI.createChildElement(history_section, "div",
                "list-pager-buttons");
            var history_body = GuacUI.createChildElement(history_table, "tbody");
            var history_pager = new GuacUI.Pager(history_body);

            // Add history
            for (i=0; i<connection.history.length; i++) {

                // Get record
                var record = connection.history[i];

                // Create record elements
                var row = GuacUI.createElement("tr");
                var user = GuacUI.createChildElement(row, "td", "username");
                var start = GuacUI.createChildElement(row, "td", "start");
                var duration = GuacUI.createChildElement(row, "td", "duration");

                // Display record
                user.textContent = record.username;
                start.textContent = GuacAdmin.formatDate(record.start);
                if (record.duration != null)
                    duration.textContent = GuacAdmin.formatSeconds(record.duration);
                else
                    duration.textContent = "Active now";

                // Add record to pager
                history_pager.addElement(row);

            }

            // Init pager
            history_pager.setPage(0);

            // Add pager if more than one page
            if (history_pager.last_page != 0)
                history_buttons.appendChild(history_pager.getElement());

        }
        else
            GuacUI.createChildElement(
                GuacUI.createChildElement(sections, "dd"), "p").textContent =
                    "This connection has not yet been used.";

        // Deselect
        function deselect() {
            GuacUI.removeClass(GuacAdmin.containers.connection_list, "disabled");
            GuacUI.removeClass(item_element, "selected");
            item_element.removeChild(form_element);
            GuacAdmin.selected_connection = null;
        }

        // Select
        function select() {
            GuacUI.addClass(GuacAdmin.containers.connection_list, "disabled");
            GuacUI.addClass(item_element, "selected");
            item_element.appendChild(form_element);
        }

        // Display fields for the given protocol name 
        function setFields(protocol_name) {

            // Clear fields
            field_table.innerHTML = "";

            // Get protocol
            var protocol = available_protocols[protocol_name];

            // For each parameter
            for (var i=0; i<protocol.parameters.length; i++) {

                // Get parameter
                var parameter = protocol.parameters[i];
                var name = parameter.name;

                // Create corresponding field
                var field;
                switch (parameter.type) {

                    // Text field
                    case GuacamoleService.Protocol.Parameter.TEXT:
                        field = new GuacAdmin.Field.TEXT();
                        break;

                    // Password field
                    case GuacamoleService.Protocol.Parameter.PASSWORD:
                        field = new GuacAdmin.Field.PASSWORD();
                        break;

                    // Numeric field
                    case GuacamoleService.Protocol.Parameter.NUMERIC:
                        field = new GuacAdmin.Field.NUMERIC();
                        break;

                    // Checkbox
                    case GuacamoleService.Protocol.Parameter.BOOLEAN:
                        field = new GuacAdmin.Field.CHECKBOX(parameter.value);
                        break;

                    // Select field
                    case GuacamoleService.Protocol.Parameter.ENUM:
                        field = new GuacAdmin.Field.ENUM(parameter.options);
                        break;

                    default:
                        continue;

                }

                // Create container for field
                var container = 
                    GuacUI.createTabulatedContainer(field_table, parameter.title + ":");

                // Set initial value
                if (connection.parameters[name])
                    field.setValue(connection.parameters[name]);

                // Add field
                container.appendChild(field.getElement());
                fields[name] = field;

            } // end foreach parameter

        }

        // Set initially selected protocol
        protocol_field.value = connection.protocol;
        setFields(connection.protocol);

        protocol_field.onchange = protocol_field.onclick = function() {
            setFields(this.value);
        };

        // Add buttons
        var button_div = GuacUI.createChildElement(form_element, "div", "object-buttons");

        // Add save button
        var save_button = GuacUI.createChildElement(button_div, "button");
        save_button.textContent = "Save";
        save_button.onclick = function(e) {

            e.stopPropagation();

            try {

                // Build connection
                var updated_connection = new GuacamoleService.Connection(
                    protocol_field.value,
                    connection.id
                );

                // Populate parameters
                for (var name in fields) {
                    var field = fields[name];
                    if (field)
                        updated_connection.parameters[name] = field.getValue();
                }

                // Update connection
                GuacamoleService.Connections.update(updated_connection, parameters);
                deselect();
                GuacAdmin.reset();

            }
            catch (e) {
                alert(e.message);
            }

        };

        // Add cancel button
        var cancel_button = GuacUI.createChildElement(button_div, "button");
        cancel_button.textContent = "Cancel";
        cancel_button.onclick = function(e) {
            e.stopPropagation();
            deselect();
        };

        // Add delete button if permission available
        if (GuacAdmin.cached_permissions.administer ||
            connection.id in GuacAdmin.cached_permissions.remove_connection) {
            
            // Create button
            var delete_button = GuacUI.createChildElement(button_div, "button", "danger");
            delete_button.textContent = "Delete";
            
            // Remove selected connection when clicked
            delete_button.onclick = function(e) {

                e.stopPropagation();

                // Delete connection upon confirmation
                if (confirm("Are you sure you want to delete the connection \""
                            + connection.id + "\"?")) {

                    // Attempt to delete connection
                    try {
                        GuacamoleService.Connections.remove(GuacAdmin.selected_connection, parameters);
                        deselect();
                        GuacAdmin.reset();
                    }

                    // Alert on failure
                    catch (e) {
                        alert(e.message);
                    }

                }

            };

        }

        // Select item
        select();

    };

};

GuacAdmin.reset = function() {

    // Get parameters from query string
    var parameters = window.location.search.substring(1);

    /*
     * Show admin elements if admin permissions available
     */

    // Query service for permissions, protocols, and connections
    GuacAdmin.cached_permissions = GuacamoleService.Permissions.list(null, parameters);
    GuacAdmin.cached_protocols   = GuacamoleService.Protocols.list(parameters);
    GuacAdmin.cached_connections = GuacamoleService.Connections.list(parameters);

    // Sort connections by ID
    GuacAdmin.cached_connections.sort(GuacamoleService.Connections.comparator);

    // Connection management
    if (GuacAdmin.cached_permissions.administer
        || GuacAdmin.cached_permissions.create_connection
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.update_connection)
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.remove_connection)
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.administer_connection))
            GuacUI.addClass(document.body, "manage-connections");
        else
            GuacUI.removeClass(document.body, "manage-connections");

    // User management
    if (GuacAdmin.cached_permissions.administer
        || GuacAdmin.cached_permissions.create_user
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.update_user)
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.remove_user)
        || GuacAdmin.hasEntry(GuacAdmin.cached_permissions.administer_user))
            GuacUI.addClass(document.body, "manage-users");
        else
            GuacUI.removeClass(document.body, "manage-users");

    // Connection creation 
    if (GuacAdmin.cached_permissions.administer
        || GuacAdmin.cached_permissions.create_connection) {
        GuacUI.addClass(document.body, "add-connections");

        GuacAdmin.buttons.add_connection.onclick = function() {

            // Try to create connection
            try {
                var connection = new GuacamoleService.Connection(
                    GuacAdmin.cached_protocols[0].name, GuacAdmin.fields.connection_id.value);
                GuacamoleService.Connections.create(connection, parameters);
                GuacAdmin.fields.connection_id.value = "";
                GuacAdmin.reset();
            }

            // Alert on failure
            catch (e) {
                alert(e.message);
            }

        };

    }

    // User creation
    if (GuacAdmin.cached_permissions.administer
       || GuacAdmin.cached_permissions.create_user) {
        GuacUI.addClass(document.body, "add-users");

        GuacAdmin.buttons.add_user.onclick = function() {

            // Attempt to create user
            try {
                GuacamoleService.Users.create(GuacAdmin.fields.username.value, parameters);
                GuacAdmin.fields.username.value = "";
                GuacAdmin.reset();
            }

            // Alert on failure
            catch (e) {
                alert(e.message);
            }

        };

    }

    var i;

    /*
     * Add readable users.
     */

    // Get previous page, if any
    var user_previous_page = 0;
    if (GuacAdmin.userPager)
        user_previous_page = GuacAdmin.userPager.current_page;

    // Add new pager
    GuacAdmin.containers.user_list.innerHTML = "";
    GuacAdmin.userPager = new GuacUI.Pager(GuacAdmin.containers.user_list);

    // Add users to pager
    var usernames = GuacamoleService.Users.list(parameters);
    for (i=0; i<usernames.length; i++) {
        if (GuacAdmin.cached_permissions.administer
            || usernames[i] in GuacAdmin.cached_permissions.update_user)
            GuacAdmin.addUser(usernames[i], parameters);
    }

    // If more than one page, add navigation buttons
    GuacAdmin.containers.user_list_buttons.innerHTML = "";
    if (GuacAdmin.userPager.last_page != 0)
        GuacAdmin.containers.user_list_buttons.appendChild(GuacAdmin.userPager.getElement());

    // Set starting page
    GuacAdmin.userPager.setPage(Math.min(GuacAdmin.userPager.last_page,
            user_previous_page));

    /*
     * Add readable connections.
     */

    // Get previous page, if any
    var connection_previous_page = 0;
    if (GuacAdmin.connectionPager)
        connection_previous_page = GuacAdmin.connectionPager.current_page;

    // Add new pager
    GuacAdmin.containers.connection_list.innerHTML = "";
    GuacAdmin.connectionPager = new GuacUI.Pager(GuacAdmin.containers.connection_list);

    // Add connections to pager
    for (i=0; i<GuacAdmin.cached_connections.length; i++) {
        var connection = GuacAdmin.cached_connections[i];
        if (GuacAdmin.cached_permissions.administer
            || connection.id in GuacAdmin.cached_permissions.update_connection)
            GuacAdmin.addConnection(connection, parameters);
    }

    // If more than one page, add navigation buttons
    GuacAdmin.containers.connection_list_buttons.innerHTML = "";
    if (GuacAdmin.connectionPager.last_page != 0)
        GuacAdmin.containers.connection_list_buttons.appendChild(
            GuacAdmin.connectionPager.getElement());

    // Set starting page
    GuacAdmin.connectionPager.setPage(Math.min(GuacAdmin.connectionPager.last_page,
            connection_previous_page));

};

// Initial load
GuacAdmin.reset();

