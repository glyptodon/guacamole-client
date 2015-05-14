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

package net.sourceforge.guacamole.net.auth.noauth;

import java.util.Map;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.GuacamoleServerException;
import org.glyptodon.guacamole.environment.Environment;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.net.auth.simple.SimpleAuthenticationProvider;
import org.glyptodon.guacamole.net.auth.Credentials;
import org.glyptodon.guacamole.properties.FileGuacamoleProperty;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.XMLReaderFactory;

/**
 * Disable authentication in Guacamole. All users accessing Guacamole are
 * automatically authenticated as "Anonymous" user and are able to use all
 * available GuacamoleConfigurations.
 *
 * GuacamoleConfiguration are read from the XML file defined by `noauth-config`
 * in the Guacamole configuration file (`guacamole.properties`).
 *
 *
 * Example `guacamole.properties`:
 *
 *  noauth-config: /etc/guacamole/noauth-config.xml
 *
 *
 * Example `noauth-config.xml`:
 *
 *  <configs>
 *    <config name="my-rdp-server" protocol="rdp">
 *      <param name="hostname" value="my-rdp-server-hostname" />
 *      <param name="port" value="3389" />
 *    </config>
 *  </configs>
 *
 * @author Laurent Meunier
 */
public class NoAuthenticationProvider extends SimpleAuthenticationProvider {

    /**
     * Logger for this class.
     */
    private Logger logger = LoggerFactory.getLogger(NoAuthenticationProvider.class);

    /**
     * Map of all known configurations, indexed by identifier.
     */
    private Map<String, GuacamoleConfiguration> configs;

    /**
     * The last time the configuration XML was modified, as milliseconds since
     * UNIX epoch.
     */
    private long configTime;

    /**
     * Guacamole server environment.
     */
    private final Environment environment;
    
    /**
     * The XML file to read the configuration from.
     */
    public static final FileGuacamoleProperty NOAUTH_CONFIG = new FileGuacamoleProperty() {

        @Override
        public String getName() {
            return "noauth-config";
        }

    };

    /**
     * The default filename to use for the configuration, if not defined within
     * guacamole.properties.
     */
    public static final String DEFAULT_NOAUTH_CONFIG = "noauth-config.xml";

    /**
     * Creates a new NoAuthenticationProvider that does not perform any
     * authentication at all. All attempts to access the Guacamole system are
     * presumed to be authorized.
     *
     * @throws GuacamoleException
     *     If a required property is missing, or an error occurs while parsing
     *     a property.
     */
    public NoAuthenticationProvider() throws GuacamoleException {
        environment = new LocalEnvironment();
    }

    /**
     * Retrieves the configuration file, as defined within guacamole.properties.
     *
     * @return The configuration file, as defined within guacamole.properties.
     * @throws GuacamoleException If an error occurs while reading the
     *                            property.
     */
    private File getConfigurationFile() throws GuacamoleException {

        // Get config file, defaulting to GUACAMOLE_HOME/noauth-config.xml
        File configFile = environment.getProperty(NOAUTH_CONFIG);
        if (configFile == null)
            configFile = new File(environment.getGuacamoleHome(), DEFAULT_NOAUTH_CONFIG);

        return configFile;

    }

    public synchronized void init() throws GuacamoleException {

        // Get configuration file
        File configFile = getConfigurationFile();
        logger.debug("Reading configuration file: \"{}\"", configFile);

        // Parse document
        try {

            // Set up parser
            NoAuthConfigContentHandler contentHandler = new NoAuthConfigContentHandler();

            XMLReader parser = XMLReaderFactory.createXMLReader();
            parser.setContentHandler(contentHandler);

            // Read and parse file
            Reader reader = new BufferedReader(new FileReader(configFile));
            parser.parse(new InputSource(reader));
            reader.close();

            // Init configs
            configTime = configFile.lastModified();
            configs = contentHandler.getConfigs();

        }
        catch (IOException e) {
            throw new GuacamoleServerException("Error reading configuration file.", e);
        }
        catch (SAXException e) {
            throw new GuacamoleServerException("Error parsing XML file.", e);
        }

    }

    @Override
    public Map<String, GuacamoleConfiguration> getAuthorizedConfigurations(Credentials credentials) throws GuacamoleException {

        // Check mapping file mod time
        File configFile = getConfigurationFile();
        if (configFile.exists() && configTime < configFile.lastModified()) {

            // If modified recently, gain exclusive access and recheck
            synchronized (this) {
                if (configFile.exists() && configTime < configFile.lastModified()) {
                    logger.debug("Configuration file \"{}\" has been modified.", configFile);
                    init(); // If still not up to date, re-init
                }
            }

        }

        // If no mapping available, report as such
        if (configs == null)
            throw new GuacamoleServerException("Configuration could not be read.");

        return configs;

    }
}
