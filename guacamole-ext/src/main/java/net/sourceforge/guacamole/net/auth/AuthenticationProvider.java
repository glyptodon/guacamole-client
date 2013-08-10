
package net.sourceforge.guacamole.net.auth;

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is guacamole-ext.
 *
 * The Initial Developer of the Original Code is
 * Michael Jumper.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

import net.sourceforge.guacamole.GuacamoleException;


/**
 * Provides means of accessing and managing the available
 * GuacamoleConfiguration objects and User objects. Access to each configuration
 * and each user is limited by a given Credentials object.
 *
 * @author Michael Jumper
 */
public interface AuthenticationProvider {

    /**
     * Returns the UserContext of the user authorized by the given credentials.
     *
     * @param credentials The credentials to use to retrieve the environment.
     * @return The UserContext of the user authorized by the given credentials,
     *         or null if the credentials are not authorized.
     *
     * @throws GuacamoleException If an error occurs while creating the
     *                            UserContext.
     */
    UserContext getUserContext(Credentials credentials)
            throws GuacamoleException;

    /**
     * Returns a new or updated UserContext for the user authorized by the
     * give credentials and having the given existing UserContext. Note that
     * because this function will be called for all future requests after
     * initial authentication, including tunnel requests, care must be taken
     * to avoid using functions of HttpServletRequest which invalidate the
     * entire request body, such as getParameter().
     * 
     * @param context The existing UserContext belonging to the user in
     *                question.
     * @param credentials The credentials to use to retrieve or update the
     *                    environment.
     * @return The updated UserContext, which need not be the same as the
     *         UserContext given, or null if the user is no longer authorized.
     *         
     * @throws GuacamoleException If an error occurs while updating the
     *                            UserContext.
     */
    UserContext updateUserContext(UserContext context, Credentials credentials)
            throws GuacamoleException;
    
}
