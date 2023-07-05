export default {
  oidc: {
    clientId: `0oa69luclf5CP3qHH697`, // e.g.: `a0abcEf0gH123ssJS4o5`
    redirectUri: `com.okta.trial-5456188:/callback`, // e.g.: `com.okta.example:/callback`
    endSessionRedirectUri: `com.okta.trial-5456188:/logoutCallback`, // e.g.: com.okta.example:/logout
    discoveryUri: `https://trial-5456188.okta.com/oauth2/default`, // e.g.: https://dev-1234.okta.com/oauth2/default
    scopes: ['openid', 'profile', 'offline_access'],
    requireHardwareBackedKeyStore: false,
  },
};
