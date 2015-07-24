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

package net.sourceforge.guacamole.net.auth.ldap;


import com.novell.ldap.LDAPAttribute;
import com.novell.ldap.LDAPConnection;
import com.novell.ldap.LDAPEntry;
import com.novell.ldap.LDAPException;
import com.novell.ldap.LDAPSearchResults;
import com.novell.ldap.LDAPSocketFactory;
import com.novell.ldap.LDAPJSSESecureSocketFactory;
import java.io.UnsupportedEncodingException;
import java.security.Security;
import java.util.Enumeration;
import java.util.Map;
import java.util.TreeMap;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.auth.Credentials;
import net.sourceforge.guacamole.net.auth.ldap.properties.LDAPGuacamoleProperties;
import org.glyptodon.guacamole.GuacamoleServerException;
import org.glyptodon.guacamole.environment.Environment;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.net.auth.simple.SimpleAuthenticationProvider;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Allows users to be authenticated against an LDAP server. Each user may have
 * any number of authorized configurations. Authorized configurations may be
 * shared.
 *
 * @author Michael Jumper
 */
public class LDAPAuthenticationProvider extends SimpleAuthenticationProvider {

    /**
     * Logger for this class.
     */
    private Logger logger = LoggerFactory.getLogger(LDAPAuthenticationProvider.class);

    /**
     * Guacamole server environment.
     */
    private final Environment environment;

    /**
     * Creates a new LDAPAuthenticationProvider that authenticates users
     * against an LDAP directory.
     *
     * @throws GuacamoleException
     *     If a required property is missing, or an error occurs while parsing
     *     a property.
     */
    public LDAPAuthenticationProvider() throws GuacamoleException {
        environment = new LocalEnvironment();
    }

    // Courtesy of OWASP: https://www.owasp.org/index.php/Preventing_LDAP_Injection_in_Java
    private static String escapeLDAPSearchFilter(String filter) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < filter.length(); i++) {
            char curChar = filter.charAt(i);
            switch (curChar) {
                case '\\':
                    sb.append("\\5c");
                    break;
                case '*':
                    sb.append("\\2a");
                    break;
                case '(':
                    sb.append("\\28");
                    break;
                case ')':
                    sb.append("\\29");
                    break;
                case '\u0000':
                    sb.append("\\00");
                    break;
                default:
                    sb.append(curChar);
            }
        }
        return sb.toString();
    }

    // Courtesy of OWASP: https://www.owasp.org/index.php/Preventing_LDAP_Injection_in_Java
    private static String escapeDN(String name) {
       StringBuilder sb = new StringBuilder();
       if ((name.length() > 0) && ((name.charAt(0) == ' ') || (name.charAt(0) == '#'))) {
           sb.append('\\'); // add the leading backslash if needed
       }
       for (int i = 0; i < name.length(); i++) {
           char curChar = name.charAt(i);
           switch (curChar) {
               case '\\':
                   sb.append("\\\\");
                   break;
               case ',':
                   sb.append("\\,");
                   break;
               case '+':
                   sb.append("\\+");
                   break;
               case '"':
                   sb.append("\\\"");
                   break;
               case '<':
                   sb.append("\\<");
                   break;
               case '>':
                   sb.append("\\>");
                   break;
               case ';':
                   sb.append("\\;");
                   break;
               default:
                   sb.append(curChar);
           }
       }
       if ((name.length() > 1) && (name.charAt(name.length() - 1) == ' ')) {
           sb.insert(sb.length() - 1, '\\'); // add the trailing backslash if needed
       }
       return sb.toString();
   }

    @Override
    public Map<String, GuacamoleConfiguration> getAuthorizedConfigurations(Credentials credentials) throws GuacamoleException {

        // Require username
        if (credentials.getUsername() == null) {
            logger.debug("Anonymous bind is not currently allowed by the LDAP authentication provider.");
            return null;
        }

        // Require password, and do not allow anonymous binding
        if (credentials.getPassword() == null
                || credentials.getPassword().length() == 0) {
            logger.debug("Anonymous bind is not currently allowed by the LDAP authentication provider.");
            return null;
        }
        
//        String ldapKeystorePath = "/att/scdmzfs/home/bdwills/sslkey.keystore";
       	
       //LDAPSocketFactory, if LDAP with SSL is used
       	LDAPSocketFactory ssf;
       
       	// Connect to LDAP server
        LDAPConnection ldapConnection;
        try {
        	
        	//Populated if LDAP with SSL is used
            String ldapKeystorePath = environment.getProperty(LDAPGuacamoleProperties.LDAP_KEYSTORE_PATH);
        	
        	//check for LDAP with SSL
        	if (ldapKeystorePath != null) {
        		Security.addProvider(new com.sun.net.ssl.internal.ssl.Provider());
                System.setProperty("javax.net.ssl.trustStore", ldapKeystorePath);
                ssf = new LDAPJSSESecureSocketFactory();
                LDAPConnection.setSocketFactory(ssf);
        	}
        	
        	ldapConnection = new LDAPConnection();
            ldapConnection.connect(
                    environment.getRequiredProperty(LDAPGuacamoleProperties.LDAP_HOSTNAME),
                    environment.getRequiredProperty(LDAPGuacamoleProperties.LDAP_PORT)
            );
        }
        catch (LDAPException e) {
            throw new GuacamoleServerException("Unable to connect to LDAP server.", e);
        }

        // Get username attribute
        String username_attribute = environment.getRequiredProperty(
            LDAPGuacamoleProperties.LDAP_USERNAME_ATTRIBUTE
        );

        // Get user base DN
        String user_base_dn = environment.getRequiredProperty(
                LDAPGuacamoleProperties.LDAP_USER_BASE_DN
        );

        // Construct user DN
        String user_dn =
            escapeDN(username_attribute) + "=" + escapeDN(credentials.getUsername())
            + "," + user_base_dn;

        try {

            // Bind as user
            try {
                ldapConnection.bind(
                        LDAPConnection.LDAP_V3,
                        user_dn,
                        credentials.getPassword().getBytes("UTF-8")
                );
            }
            catch (UnsupportedEncodingException e) {
                throw new GuacamoleException(e);
            }

        }
        catch (LDAPException e) {
            logger.debug("LDAP bind failed.", e);
            return null;
        }

        // Get config base DN
        String config_base_dn = environment.getRequiredProperty(
                LDAPGuacamoleProperties.LDAP_CONFIG_BASE_DN
        );

        // Pull all connections
        try {

            // Find all guac configs for this user
            LDAPSearchResults results = ldapConnection.search(
                    config_base_dn,
                    LDAPConnection.SCOPE_SUB,
                    "(&(objectClass=guacConfigGroup)(member=" + escapeLDAPSearchFilter(user_dn) + "))",
                    null,
                    false
            );

            // Add all configs
            Map<String, GuacamoleConfiguration> configs = new TreeMap<String, GuacamoleConfiguration>();
            while (results.hasMore()) {

                LDAPEntry entry = results.next();

                // New empty configuration
                GuacamoleConfiguration config = new GuacamoleConfiguration();

                // Get CN
                LDAPAttribute cn = entry.getAttribute("cn");
                if (cn == null)
                    throw new GuacamoleException("guacConfigGroup without cn");

                // Get protocol
                LDAPAttribute protocol = entry.getAttribute("guacConfigProtocol");
                if (protocol == null)
                    throw new GuacamoleException("guacConfigGroup without guacConfigProtocol");

                // Set protocol
                config.setProtocol(protocol.getStringValue());

                // Get parameters, if any
                LDAPAttribute parameterAttribute = entry.getAttribute("guacConfigParameter");
                if (parameterAttribute != null) {

                    // For each parameter
                    Enumeration<?> parameters = parameterAttribute.getStringValues();
                    while (parameters.hasMoreElements()) {

                        String parameter = (String) parameters.nextElement();

                        // Parse parameter
                        int equals = parameter.indexOf('=');
                        if (equals != -1) {

                            // Parse name
                            String name = parameter.substring(0, equals);
                            String value = parameter.substring(equals+1);

                            config.setParameter(name, value);

                        }

                    }

                }

                // Store config by CN
                configs.put(cn.getStringValue(), config);

            }

            // Disconnect
            ldapConnection.disconnect();
            return configs;

        }
        catch (LDAPException e) {
            throw new GuacamoleServerException("Error while querying for connections.", e);
        }

    }

}

