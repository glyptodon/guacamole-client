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

package org.apache.guacamole.auth.quickconnect;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.UUID;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.GuacamoleResourceNotFoundException;
import org.apache.guacamole.net.auth.simple.SimpleConnection;
import org.apache.guacamole.net.auth.simple.SimpleDirectory;
import org.apache.guacamole.net.auth.Connection;

/**
 * Mutable directory implementation which stores Connection objects in memory
 * only. Parameter tokens are automatically applied when a connection within
 * this directory is used.
 */
public class QuickConnectDirectory extends SimpleDirectory<Connection> {

    /**
     * The Map which contains all connections within this directory, where the
     * key of each entry is the connection's identifier. Changes made to this
     * Map will immediately affect this directory.
     */
    private final Map<String, Connection> connections = new ConcurrentHashMap<String, Connection>();

    /**
     * Creates a new, empty QuickConnectDirectory. The created directory is
     * mutable: new connections may be added using add(), and existing
     * connections may be updated and deleted with update() and remove().
     */
    public QuickConnectDirectory() {
        super.setObjects(this.connections);
    }

    /**
     * Creates an independent copy of the given Connection which automatically
     * applies parameter tokens. Parameter tokens are applied only when the
     * connection is used (connect() is invoked).
     *
     * NOTE: Parameter tokens are not actually currently applied due to API
     * differences with 0.9.12-incubating vs. 1.1.0.
     *
     * @param connection
     *     The connection to copy.
     *
     * @return
     *     An independent copy of the given Connection.
     */
    private Connection copy(Connection connection) {
        Connection copy = new SimpleConnection(connection.getName(), connection.getIdentifier(), connection.getConfiguration());
        copy.setParentIdentifier(connection.getParentIdentifier());
        return copy;
    }

    @Override
    public void add(Connection connection) throws GuacamoleException {

        // Validate selected parent group (must be root)
        if (!QuickConnectUserContext.ROOT_IDENTIFIER.equals(connection.getParentIdentifier()))
            throw new GuacamoleResourceNotFoundException("Parent connection group does not exist.");

        // Add connection to directory
        connection.setIdentifier(UUID.randomUUID().toString());
        connections.put(connection.getIdentifier(), copy(connection));

    }

    @Override
    public void remove(String identifier) throws GuacamoleException {
        connections.remove(identifier);
    }

    @Override
    public void update(Connection connection) throws GuacamoleException {

        // Update connection only if it actually exists
        if (connections.replace(connection.getIdentifier(), copy(connection)) == null)
            throw new GuacamoleResourceNotFoundException("Connection does not exist.");

    }

}
