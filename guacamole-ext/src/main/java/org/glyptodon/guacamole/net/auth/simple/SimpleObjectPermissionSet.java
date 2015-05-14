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

package org.glyptodon.guacamole.net.auth.simple;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.GuacamoleSecurityException;
import org.glyptodon.guacamole.net.auth.permission.ObjectPermission;
import org.glyptodon.guacamole.net.auth.permission.ObjectPermissionSet;

/**
 * A read-only implementation of ObjectPermissionSet which uses a backing Set
 * of Permissions to determine which permissions are present.
 *
 * @author Michael Jumper
 */
public class SimpleObjectPermissionSet implements ObjectPermissionSet {

    /**
     * The set of all permissions currently granted.
     */
    private Set<ObjectPermission> permissions = Collections.<ObjectPermission>emptySet();

    /**
     * Creates a new empty SimpleObjectPermissionSet.
     */
    public SimpleObjectPermissionSet() {
    }

    /**
     * Creates a new SimpleObjectPermissionSet which contains the permissions
     * within the given Set.
     *
     * @param permissions 
     *     The Set of permissions this SimpleObjectPermissionSet should
     *     contain.
     */
    public SimpleObjectPermissionSet(Set<ObjectPermission> permissions) {
        this.permissions = permissions;
    }

    /**
     * Sets the Set which backs this SimpleObjectPermissionSet. Future function
     * calls on this SimpleObjectPermissionSet will use the provided Set.
     *
     * @param permissions 
     *     The Set of permissions this SimpleObjectPermissionSet should
     *     contain.
     */
    protected void setPermissions(Set<ObjectPermission> permissions) {
        this.permissions = permissions;
    }

    @Override
    public Set<ObjectPermission> getPermissions() {
        return permissions;
    }

    @Override
    public boolean hasPermission(ObjectPermission.Type permission,
            String identifier) throws GuacamoleException {

        ObjectPermission objectPermission =
                new ObjectPermission(permission, identifier);
        
        return permissions.contains(objectPermission);

    }

    @Override
    public void addPermission(ObjectPermission.Type permission,
            String identifier) throws GuacamoleException {
        throw new GuacamoleSecurityException("Permission denied.");
    }

    @Override
    public void removePermission(ObjectPermission.Type permission,
            String identifier) throws GuacamoleException {
        throw new GuacamoleSecurityException("Permission denied.");
    }

    @Override
    public Collection<String> getAccessibleObjects(
            Collection<ObjectPermission.Type> permissionTypes,
            Collection<String> identifiers) throws GuacamoleException {

        Collection<String> accessibleObjects = new ArrayList<String>(permissions.size());

        // For each identifier/permission combination
        for (String identifier : identifiers) {
            for (ObjectPermission.Type permissionType : permissionTypes) {

                // Add identifier if at least one requested permission is granted
                ObjectPermission permission = new ObjectPermission(permissionType, identifier);
                if (permissions.contains(permission)) {
                    accessibleObjects.add(identifier);
                    break;
                }

            }
        }

        return accessibleObjects;
        
    }

    @Override
    public void addPermissions(Set<ObjectPermission> permissions)
            throws GuacamoleException {
        throw new GuacamoleSecurityException("Permission denied.");
    }

    @Override
    public void removePermissions(Set<ObjectPermission> permissions)
            throws GuacamoleException {
        throw new GuacamoleSecurityException("Permission denied.");
    }

}
