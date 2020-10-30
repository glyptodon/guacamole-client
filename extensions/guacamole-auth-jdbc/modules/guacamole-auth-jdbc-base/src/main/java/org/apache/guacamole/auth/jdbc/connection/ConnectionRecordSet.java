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

package org.apache.guacamole.auth.jdbc.connection;

import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.auth.jdbc.base.RestrictedObject;
import org.apache.guacamole.auth.jdbc.user.ModeledAuthenticatedUser;
import org.apache.guacamole.net.auth.ConnectionRecord;

/**
 * A JDBC implementation of ConnectionRecordSet. Calls to asCollection() will 
 * query connection history records from the database. Which records are
 * returned will be determined by the values passed in earlier.
 * 
 * @author James Muehlner
 */
public class ConnectionRecordSet extends RestrictedObject
        implements org.apache.guacamole.net.auth.ConnectionRecordSet {

    /**
     * Service for managing connection objects.
     */
    @Inject
    private ConnectionService connectionService;
    
    /**
     * The identifier of the connection to which this record set should be
     * limited, if any. If null, the set should contain all records readable
     * by the user making the request.
     */
    private String identifier = null;

    /**
     * The set of strings that each must occur somewhere within the returned 
     * connection records, whether within the associated username, the name of 
     * the associated connection, or any associated date. If non-empty, any 
     * connection record not matching each of the strings within the collection 
     * will be excluded from the results.
     */
    private final Set<ConnectionRecordSearchTerm> requiredContents = 
            new HashSet<ConnectionRecordSearchTerm>();
    
    /**
     * The maximum number of connection history records that should be returned
     * by a call to asCollection().
     */
    private int limit = Integer.MAX_VALUE;
    
    /**
     * A list of predicates to apply while sorting the resulting connection
     * records, describing the properties involved and the sort order for those 
     * properties.
     */
    private final List<ConnectionRecordSortPredicate> connectionRecordSortPredicates =
            new ArrayList<ConnectionRecordSortPredicate>();
   
    /**
     * Initializes this object, associating it with the current authenticated
     * user and connection identifier.
     *
     * @param currentUser
     *     The user that created or retrieved this object.
     * 
     * @param identifier
     *     The connection identifier to which this record set should be limited,
     *     or null if the record set should contain all records readable by the
     *     currentUser.
     */
    protected void init(ModeledAuthenticatedUser currentUser, String identifier) {
        super.init(currentUser);
        this.identifier = identifier;
    }
    
    @Override
    public Collection<ConnectionRecord> asCollection()
            throws GuacamoleException {
        // Retrieve history from database
        return connectionService.retrieveHistory(identifier, getCurrentUser(),
                requiredContents, connectionRecordSortPredicates, limit);
    }

    @Override
    public ConnectionRecordSet contains(String value)
            throws GuacamoleException {
        requiredContents.add(new ConnectionRecordSearchTerm(value));
        return this;
    }

    @Override
    public ConnectionRecordSet limit(int limit) throws GuacamoleException {
        this.limit = Math.min(this.limit, limit);
        return this;
    }

    @Override
    public ConnectionRecordSet sort(SortableProperty property, boolean desc)
            throws GuacamoleException {
        
        connectionRecordSortPredicates.add(new ConnectionRecordSortPredicate(
            property,
            desc
        ));
        
        return this;

    }

}
