/*
 * Copyright (C) 2013 Glyptodon LLC
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

package org.glyptodon.guacamole.net.auth.simple;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.form.Form;
import org.glyptodon.guacamole.net.auth.ActiveConnection;
import org.glyptodon.guacamole.net.auth.Connection;
import org.glyptodon.guacamole.net.auth.ConnectionGroup;
import org.glyptodon.guacamole.net.auth.Directory;
import org.glyptodon.guacamole.net.auth.User;
import org.glyptodon.guacamole.net.auth.UserContext;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;

/**
 * An extremely simple UserContext implementation which provides access to
 * a defined and restricted set of GuacamoleConfigurations. Access to
 * querying or modifying either users or permissions is denied.
 *
 * @author Michael Jumper
 */
public class SimpleUserContext implements UserContext {

    /**
     * The unique identifier of the root connection group.
     */
    private static final String ROOT_IDENTIFIER = "ROOT";
    
    /**
     * Reference to the user whose permissions dictate the configurations
     * accessible within this UserContext.
     */
    private final User self;

    /**
     * The Directory with access only to the User associated with this
     * UserContext.
     */
    private final Directory<User> userDirectory;

    /**
     * The Directory with access only to the root group associated with this
     * UserContext.
     */
    private final Directory<ConnectionGroup> connectionGroupDirectory;

    /**
     * The Directory with access to all connections within the root group
     * associated with this UserContext.
     */
    private final Directory<Connection> connectionDirectory;

    /**
     * The root connection group.
     */
    private final ConnectionGroup rootGroup;

    /**
     * Creates a new SimpleUserContext which provides access to only those
     * configurations within the given Map. The username is assigned
     * arbitrarily.
     * 
     * @param configs A Map of all configurations for which the user associated
     *                with this UserContext has read access.
     */
    public SimpleUserContext(Map<String, GuacamoleConfiguration> configs) {
        this(UUID.randomUUID().toString(), configs);
    }

    /**
     * Creates a new SimpleUserContext for the user with the given username
     * which provides access to only those configurations within the given Map.
      * 
     * @param username The username of the user associated with this
     *                 UserContext.
     * @param configs A Map of all configurations for which the user associated
     *                with this UserContext has read access.
     */
    public SimpleUserContext(String username, Map<String, GuacamoleConfiguration> configs) {

        Collection<String> connectionIdentifiers = new ArrayList<String>(configs.size());
        Collection<String> connectionGroupIdentifiers = Collections.singleton(ROOT_IDENTIFIER);
        
        // Produce collection of connections from given configs
        Collection<Connection> connections = new ArrayList<Connection>(configs.size());
        for (Map.Entry<String, GuacamoleConfiguration> configEntry : configs.entrySet()) {

            // Get connection identifier and configuration
            String identifier = configEntry.getKey();
            GuacamoleConfiguration config = configEntry.getValue();

            // Add as simple connection
            Connection connection = new SimpleConnection(identifier, identifier, config);
            connection.setParentIdentifier(ROOT_IDENTIFIER);
            connections.add(connection);

            // Add identifier to overall set of identifiers
            connectionIdentifiers.add(identifier);
            
        }
        
        // Add root group that contains only the given configurations
        this.rootGroup = new SimpleConnectionGroup(
            ROOT_IDENTIFIER, ROOT_IDENTIFIER,
            connectionIdentifiers, Collections.<String>emptyList()
        );

        // Build new user from credentials
        this.self = new SimpleUser(username, connectionIdentifiers,
                connectionGroupIdentifiers);

        // Create directories for new user
        this.userDirectory = new SimpleUserDirectory(self);
        this.connectionDirectory = new SimpleConnectionDirectory(connections);
        this.connectionGroupDirectory = new SimpleConnectionGroupDirectory(Collections.singleton(this.rootGroup));
        
    }

    @Override
    public User self() {
        return self;
    }

    @Override
    public Directory<User> getUserDirectory()
            throws GuacamoleException {
        return userDirectory;
    }

    @Override
    public Directory<Connection> getConnectionDirectory()
            throws GuacamoleException {
        return connectionDirectory;
    }

    @Override
    public Directory<ConnectionGroup> getConnectionGroupDirectory()
            throws GuacamoleException {
        return connectionGroupDirectory;
    }

    @Override
    public ConnectionGroup getRootConnectionGroup() throws GuacamoleException {
        return rootGroup;
    }

    @Override
    public Directory<ActiveConnection> getActiveConnectionDirectory()
            throws GuacamoleException {
        return new SimpleDirectory<ActiveConnection>();
    }

    @Override
    public Collection<Form> getUserAttributes() {
        return Collections.<Form>emptyList();
    }

    @Override
    public Collection<Form> getConnectionAttributes() {
        return Collections.<Form>emptyList();
    }

    @Override
    public Collection<Form> getConnectionGroupAttributes() {
        return Collections.<Form>emptyList();
    }

}
