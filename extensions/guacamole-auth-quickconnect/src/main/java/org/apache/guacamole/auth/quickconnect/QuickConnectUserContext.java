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

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.AbstractUserContext;
import org.apache.guacamole.net.auth.AuthenticationProvider;
import org.apache.guacamole.net.auth.User;
import org.apache.guacamole.net.auth.permission.ObjectPermission;
import org.apache.guacamole.net.auth.permission.ObjectPermissionSet;
import org.apache.guacamole.net.auth.permission.SystemPermission;
import org.apache.guacamole.net.auth.permission.SystemPermissionSet;
import org.apache.guacamole.net.auth.simple.SimpleObjectPermissionSet;
import org.apache.guacamole.net.auth.simple.SimpleSystemPermissionSet;
import org.apache.guacamole.net.auth.simple.SimpleUser;

/**
 * A simple implementation of UserContext to support this
 * extension, used for storing connections the user has created
 * with the QuickConnect bar in the webapp.
 */
public class QuickConnectUserContext extends AbstractUserContext {

    /**
     * The unique identifier of the root connection group.
     */
    public static final String ROOT_IDENTIFIER = DEFAULT_ROOT_CONNECTION_GROUP;

    /**
     * The AuthenticationProvider that created this UserContext.
     */
    private final AuthenticationProvider authProvider;

    /**
     * Reference to the user whose permissions dictate the configurations
     * accessible within this UserContext.
     */
    private final User self;

    /**
     * The Directory with access to all connections within the root group
     * associated with this UserContext.
     */
    private final QuickConnectDirectory connectionDirectory;

    /**
     * Returns an ObjectPermissionSet which includes each of the given
     * permission types for each of the given identifiers.
     *
     * @param identifiers
     *     The identifiers of the objects to be associated with the given
     *     permission types within the returned ObjectPermissionSet.
     *
     * @param types
     *     The types of permissions to grant for each of the given identifiers.
     *
     * @return
     *     An ObjectPermissionSet which includes each of the given permission
     *     types for each of the given identifiers.
     */
    private ObjectPermissionSet getObjectPermissionSet(Set<String> identifiers, ObjectPermission.Type... types) {

        Set<ObjectPermission> permissions = new HashSet<ObjectPermission>(identifiers.size() * types.length);

        // Include each possible identifier/type combination
        for (ObjectPermission.Type type : types) {
            for (String identifier : identifiers) {
                permissions.add(new ObjectPermission(type, identifier));
            }
        }

        return new SimpleObjectPermissionSet(permissions);

    }

    /**
     * Construct a QuickConnectUserContext using the authProvider and
     * the username.
     *
     * @param authProvider
     *     The authentication provider module instantiating this
     *     this class.
     *
     * @param username
     *     The name of the user logging in that will be associated
     *     with this UserContext.
     * 
     * @throws GuacamoleException
     *     If errors occur initializing the ConnectionGroup,
     *     ConnectionDirectory, or User.
     */
    public QuickConnectUserContext(AuthenticationProvider authProvider,
            String username) throws GuacamoleException {

        // Initialize the connection directory
        this.connectionDirectory = new QuickConnectDirectory();

        // Initialize the user to a SimpleUser with the provided username,
        // no connections, and the single root group.
        this.self = new SimpleUser(username) {

            @Override
            public ObjectPermissionSet getConnectionPermissions() throws GuacamoleException {
                return getObjectPermissionSet(connectionDirectory.getIdentifiers(),
                        ObjectPermission.Type.READ,
                        ObjectPermission.Type.UPDATE,
                        ObjectPermission.Type.DELETE);
            }

            @Override
            public ObjectPermissionSet getConnectionGroupPermissions() throws GuacamoleException {
                return new SimpleObjectPermissionSet(Collections.singleton(new ObjectPermission(ObjectPermission.Type.READ, ROOT_IDENTIFIER)));
            }

            @Override
            public SystemPermissionSet getSystemPermissions() throws GuacamoleException {
                return new SimpleSystemPermissionSet(Collections.singleton(new SystemPermission(SystemPermission.Type.CREATE_CONNECTION)));
            }

        };

        // Set the authProvider to the calling authProvider object.
        this.authProvider = authProvider;

    }

    @Override
    public QuickConnectDirectory getConnectionDirectory() {
        return connectionDirectory;
    }

    @Override
    public User self() {
        return self;
    }

    @Override
    public AuthenticationProvider getAuthenticationProvider() {
        return authProvider;
    }

}
