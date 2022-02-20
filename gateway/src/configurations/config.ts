export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  queryEnabled: process.env.QUERY === 'true',
  invokeEnabled: process.env.INVOKE === 'true',
  invokeRoute: '/invoke',
  queryRoute: '/query',
  featureDisabledMessage: 'this feature is disabled',
  adminUserId: process.env.ADMIN_USER_ID || 'admin',
  adminUserPasswd: process.env.ADMIN_USER_PASS || 'adminpw',
  walletPath: 'wallet',
  networkConnectFile:
    process.env.NETWORK_CONNECT_FILE ||
    // Path should be relative to ROOT/src/shared/helpers
    '../../src/connection-profile/connection-profile.json',
});
