package net.sourceforge.guacamole.net.event;

import net.sourceforge.guacamole.net.GuacamoleTunnel;
import net.sourceforge.guacamole.net.auth.Credentials;
import net.sourceforge.guacamole.net.auth.UserContext;

/**
 * An event which is triggered whenever a tunnel is being closed. The tunnel
 * being closed can be accessed through getTunnel(), and the UserContext
 * associated with the request which is closing the tunnel can be retrieved
 * with getUserContext().
 *
 * @author Michael Jumper
 */
public class TunnelCloseEvent implements UserEvent, CredentialEvent, TunnelEvent {

    /**
     * The UserContext associated with the request that is closing the
     * tunnel, if any.
     */
    private UserContext context;

    /**
     * The credentials associated with the request that connected the
     * tunnel, if any.
     */
    private Credentials credentials;

    /**
     * The tunnel being closed.
     */
    private GuacamoleTunnel tunnel;

    /**
     * Creates a new TunnelCloseEvent which represents the closing of the
     * given tunnel via a request associated with the given credentials.
     *
     * @param context The UserContext associated with the request closing 
     *                the tunnel.
     * @param credentials The credentials associated with the request that 
     *                    connected the tunnel.
     * @param tunnel The tunnel being closed.
     */
    public TunnelCloseEvent(UserContext context, Credentials credentials,
            GuacamoleTunnel tunnel) {
        this.context = context;
        this.credentials = credentials;
        this.tunnel = tunnel;
    }

    @Override
    public UserContext getUserContext() {
        return context;
    }

    @Override
    public Credentials getCredentials() {
        return credentials;
    }

    @Override
    public GuacamoleTunnel getTunnel() {
        return tunnel;
    }

}
