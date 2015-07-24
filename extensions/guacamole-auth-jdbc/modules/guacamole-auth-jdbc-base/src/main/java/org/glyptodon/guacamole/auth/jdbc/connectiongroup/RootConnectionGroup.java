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

package org.glyptodon.guacamole.auth.jdbc.connectiongroup;

import com.google.inject.Inject;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import org.glyptodon.guacamole.auth.jdbc.connection.ConnectionService;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.GuacamoleSecurityException;
import org.glyptodon.guacamole.auth.jdbc.base.RestrictedObject;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.net.auth.ConnectionGroup;
import org.glyptodon.guacamole.protocol.GuacamoleClientInformation;

/**
 * The root connection group, here represented as its own dedicated object as
 * the database does not contain an actual root group.
 *
 * @author Michael Jumper
 */
public class RootConnectionGroup extends RestrictedObject
    implements ConnectionGroup {

    /**
     * The identifier used to represent the root connection group. There is no
     * corresponding entry in the database, thus a reserved identifier that
     * cannot collide with database-generated identifiers is needed.
     */
    public static final String IDENTIFIER = "ROOT";

    /**
     * The human-readable name of this connection group. The name of the root
     * group is not normally visible, and may even be replaced by the web
     * interface for the sake of translation.
     */
    public static final String NAME = "ROOT";

    /**
     * Service for managing connection objects.
     */
    @Inject
    private ConnectionService connectionService;

    /**
     * Service for managing connection group objects.
     */
    @Inject
    private ConnectionGroupService connectionGroupService;
    
    /**
     * Creates a new, empty RootConnectionGroup.
     */
    public RootConnectionGroup() {
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void setName(String name) {
        throw new UnsupportedOperationException("The root connection group cannot be modified.");
    }

    @Override
    public String getParentIdentifier() {
        return null;
    }

    @Override
    public void setParentIdentifier(String parentIdentifier) {
        throw new UnsupportedOperationException("The root connection group cannot be modified.");
    }

    @Override
    public Type getType() {
        return ConnectionGroup.Type.ORGANIZATIONAL;
    }

    @Override
    public void setType(Type type) {
        throw new UnsupportedOperationException("The root connection group cannot be modified.");
    }

    @Override
    public Set<String> getConnectionIdentifiers() throws GuacamoleException {
        return connectionService.getIdentifiersWithin(getCurrentUser(), null);
    }

    @Override
    public Set<String> getConnectionGroupIdentifiers()
            throws GuacamoleException {
        return connectionGroupService.getIdentifiersWithin(getCurrentUser(), null);
    }

    @Override
    public String getIdentifier() {
        return IDENTIFIER;
    }

    @Override
    public void setIdentifier(String identifier) {
        throw new UnsupportedOperationException("The root connection group cannot be modified.");
    }

    @Override
    public GuacamoleTunnel connect(GuacamoleClientInformation info)
            throws GuacamoleException {
        throw new GuacamoleSecurityException("Permission denied.");
    }

    @Override
    public int getActiveConnections() {
        return 0;
    }

    @Override
    public Map<String, String> getAttributes() {
        return Collections.<String, String>emptyMap();
    }

    @Override
    public void setAttributes(Map<String, String> attributes) {
        throw new UnsupportedOperationException("The root connection group cannot be modified.");
    }

}
