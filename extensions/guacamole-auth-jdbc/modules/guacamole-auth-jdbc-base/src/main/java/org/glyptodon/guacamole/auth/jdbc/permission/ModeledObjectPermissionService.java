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

package org.glyptodon.guacamole.auth.jdbc.permission;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import org.glyptodon.guacamole.auth.jdbc.user.AuthenticatedUser;
import org.glyptodon.guacamole.auth.jdbc.user.ModeledUser;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.GuacamoleSecurityException;
import org.glyptodon.guacamole.net.auth.permission.ObjectPermission;
import org.glyptodon.guacamole.net.auth.permission.ObjectPermissionSet;

/**
 * Service which provides convenience methods for creating, retrieving, and
 * deleting object permissions within a backend database model. This service
 * will automatically enforce the permissions of the current user.
 *
 * @author Michael Jumper
 */
public abstract class ModeledObjectPermissionService
    extends ModeledPermissionService<ObjectPermissionSet, ObjectPermission, ObjectPermissionModel>
    implements ObjectPermissionService {

    @Override
    protected abstract ObjectPermissionMapper getPermissionMapper();

    @Override
    protected ObjectPermission getPermissionInstance(ObjectPermissionModel model) {
        return new ObjectPermission(model.getType(), model.getObjectIdentifier());
    }

    @Override
    protected ObjectPermissionModel getModelInstance(ModeledUser targetUser,
            ObjectPermission permission) {

        ObjectPermissionModel model = new ObjectPermissionModel();

        // Populate model object with data from user and permission
        model.setUserID(targetUser.getModel().getObjectID());
        model.setUsername(targetUser.getModel().getIdentifier());
        model.setType(permission.getType());
        model.setObjectIdentifier(permission.getObjectIdentifier());

        return model;
        
    }

    /**
     * Determines whether the current user has permission to update the given
     * target user, adding or removing the given permissions. Such permission
     * depends on whether the current user is a system administrator, whether
     * they have explicit UPDATE permission on the target user, and whether
     * they have explicit ADMINISTER permission on all affected objects.
     *
     * @param user
     *     The user who is changing permissions.
     *
     * @param targetUser
     *     The user whose permissions are being changed.
     *
     * @param permissions
     *     The permissions that are being added or removed from the target
     *     user.
     *
     * @return
     *     true if the user has permission to change the target users
     *     permissions as specified, false otherwise.
     *
     * @throws GuacamoleException
     *     If an error occurs while checking permission status, or if
     *     permission is denied to read the current user's permissions.
     */
    protected boolean canAlterPermissions(AuthenticatedUser user, ModeledUser targetUser,
            Collection<ObjectPermission> permissions)
            throws GuacamoleException {

        // A system adminstrator can do anything
        if (user.getUser().isAdministrator())
            return true;
        
        // Verify user has update permission on the target user
        ObjectPermissionSet userPermissionSet = user.getUser().getUserPermissions();
        if (!userPermissionSet.hasPermission(ObjectPermission.Type.UPDATE, targetUser.getIdentifier()))
            return false;

        // Produce collection of affected identifiers
        Collection<String> affectedIdentifiers = new HashSet<String>(permissions.size());
        for (ObjectPermission permission : permissions)
            affectedIdentifiers.add(permission.getObjectIdentifier());

        // Determine subset of affected identifiers that we have admin access to
        ObjectPermissionSet affectedPermissionSet = getPermissionSet(user, user.getUser());
        Collection<String> allowedSubset = affectedPermissionSet.getAccessibleObjects(
            Collections.singleton(ObjectPermission.Type.ADMINISTER),
            affectedIdentifiers
        );

        // The permissions can be altered if and only if the set of objects we
        // are allowed to administer is equal to the set of objects we will be
        // affecting.

        return affectedIdentifiers.size() == allowedSubset.size();
        
    }
    
    @Override
    public void createPermissions(AuthenticatedUser user, ModeledUser targetUser,
            Collection<ObjectPermission> permissions)
            throws GuacamoleException {

        // Create permissions only if user has permission to do so
        if (canAlterPermissions(user, targetUser, permissions)) {
            Collection<ObjectPermissionModel> models = getModelInstances(targetUser, permissions);
            getPermissionMapper().insert(models);
            return;
        }
        
        // User lacks permission to create object permissions
        throw new GuacamoleSecurityException("Permission denied.");

    }

    @Override
    public void deletePermissions(AuthenticatedUser user, ModeledUser targetUser,
            Collection<ObjectPermission> permissions)
            throws GuacamoleException {

        // Delete permissions only if user has permission to do so
        if (canAlterPermissions(user, targetUser, permissions)) {
            Collection<ObjectPermissionModel> models = getModelInstances(targetUser, permissions);
            getPermissionMapper().delete(models);
            return;
        }
        
        // User lacks permission to delete object permissions
        throw new GuacamoleSecurityException("Permission denied.");

    }

    @Override
    public ObjectPermission retrievePermission(AuthenticatedUser user,
            ModeledUser targetUser, ObjectPermission.Type type,
            String identifier) throws GuacamoleException {

        // Retrieve permissions only if allowed
        if (canReadPermissions(user, targetUser)) {

            // Read permission from database, return null if not found
            ObjectPermissionModel model = getPermissionMapper().selectOne(targetUser.getModel(), type, identifier);
            if (model == null)
                return null;

            return getPermissionInstance(model);

        }

        // User cannot read this user's permissions
        throw new GuacamoleSecurityException("Permission denied.");
        
    }

    @Override
    public Collection<String> retrieveAccessibleIdentifiers(AuthenticatedUser user,
            ModeledUser targetUser, Collection<ObjectPermission.Type> permissions,
            Collection<String> identifiers) throws GuacamoleException {

        // Nothing is always accessible
        if (identifiers.isEmpty())
            return identifiers;
        
        // Retrieve permissions only if allowed
        if (canReadPermissions(user, targetUser)) {

            // If user is an admin, everything is accessible
            if (user.getUser().isAdministrator())
                return identifiers;

            // Otherwise, return explicitly-retrievable identifiers
            return getPermissionMapper().selectAccessibleIdentifiers(targetUser.getModel(), permissions, identifiers);
            
        }

        // User cannot read this user's permissions
        throw new GuacamoleSecurityException("Permission denied.");

    }

}
