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

package org.apache.guacamole.net.auth;

import org.apache.guacamole.GuacamoleException;

/**
 * Base implementation of AuthenticationProvider which provides default
 * implementations of most functions. Implementations must provide their
 * own {@link #getIdentifier()}, but otherwise need only override an implemented
 * function if they wish to actually implement the functionality defined for
 * that function by the AuthenticationProvider interface.
 */
public abstract class AbstractAuthenticationProvider implements AuthenticationProvider {

    /**
     * {@inheritDoc}
     *
     * <p>This implementation performs no authentication whatsoever, ignoring
     * the provided {@code credentials} and simply returning {@code null}. Any
     * authentication attempt will thus fall through to other
     * {@link AuthenticationProvider} implementations, perhaps within other
     * installed extensions, with this {@code AuthenticationProvider} making no
     * claim regarding the user's identity nor whether the user should be
     * allowed or disallowed from accessing Guacamole. Implementations that wish
     * to authenticate users should override this function.
     */
    @Override
    public AuthenticatedUser authenticateUser(Credentials credentials)
            throws GuacamoleException {
        return null;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation simply returns the provided
     * {@code authenticatedUser} without modification. Implementations that
     * wish to update a user's {@link AuthenticatedUser} object with respect to
     * new {@link Credentials} received in requests which follow the initial,
     * successful authentication attempt should override this function.
     */
    @Override
    public AuthenticatedUser updateAuthenticatedUser(AuthenticatedUser authenticatedUser,
            Credentials credentials) throws GuacamoleException {
        return authenticatedUser;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation simply returns {@code null}, effectively allowing
     * authentication to continue but refusing to provide data for the given
     * user. Implementations that wish to veto the authentication results of
     * other {@link AuthenticationProvider} implementations or provide data for
     * authenticated users should override this function.
     */
    @Override
    public UserContext getUserContext(AuthenticatedUser authenticatedUser)
            throws GuacamoleException {
        return null;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation simply returns the provided {@code context}
     * without modification. Implementations that wish to update a user's
     * {@link UserContext} object with respect to newly-updated
     * {@link AuthenticatedUser} or {@link Credentials} (such as those received
     * in requests which follow the initial, successful authentication attempt)
     * should override this function.
     */
    @Override
    public UserContext updateUserContext(UserContext context,
            AuthenticatedUser authenticatedUser,
            Credentials credentials) throws GuacamoleException {
        return context;
    }

}
