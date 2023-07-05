import {
  EventEmitter,
  createConfig,
  getAccessToken,
  getUser,
  getUserFromIdToken,
  isAuthenticated,
  refreshTokens,
  signInWithBrowser,
  signOut,
} from '@okta/okta-react-native';
import React, {useEffect, useState} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import sampleConfig from './sample.config';

interface UserAuth {
  isAuthenticated: boolean;
  mesage: string;
}

export const App = () => {
  const [userState, setUserState] = useState<UserAuth>();

  useEffect(() => {
    initOktaConfig();
  }, []);

  useEffect(() => {
    EventEmitter.addListener('signInSuccess', function (event) {
      console.log('Entro al signInSuccess');
      if (event.error_message) {
        console.log(event.error_message);
        changeUserState(false, event.error_message);
        return;
      }

      changeUserState(true, 'Logged in!');
    });

    EventEmitter.addListener('signOutSuccess', function (event) {
      console.log('Entro al signOutSuccess');
      if (event.error_message) {
        console.log(event.error_message);
        changeUserState(true, event.error_message);
        return;
      }

      changeUserState(false, 'Logged out!');
    });

    EventEmitter.addListener('onError', function (error) {
      console.log('Entro al onError');
      console.log(error);
      changeUserState(false, error.error_message);
    });

    EventEmitter.addListener('onCancelled', function (error) {
      console.log(error);
    });

    checkAuthentication();

    return () => {
      EventEmitter.removeAllListeners('signInSuccess');
      EventEmitter.removeAllListeners('signOutSuccess');
      EventEmitter.removeAllListeners('onError');
      EventEmitter.removeAllListeners('onCancelled');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initOktaConfig = async () => {
    await createConfig({
      clientId: sampleConfig.oidc.clientId,
      redirectUri: sampleConfig.oidc.redirectUri,
      endSessionRedirectUri: sampleConfig.oidc.endSessionRedirectUri,
      discoveryUri: sampleConfig.oidc.discoveryUri,
      scopes: sampleConfig.oidc.scopes,
      requireHardwareBackedKeyStore:
        sampleConfig.oidc.requireHardwareBackedKeyStore,
    });
  };

  const checkAuthentication = async () => {
    const result = await isAuthenticated();
    console.log(result);
    if (result.authenticated !== userState?.isAuthenticated) {
      changeUserState(
        result.authenticated,
        `User is auth == ${result.authenticated}`,
      );
    }
  };

  const login = async () => {
    await signInWithBrowser();
  };

  const logout = async () => {
    await signOut();
  };

  const getUserIdToken = async () => {
    let user = await getUserFromIdToken();
    changeUserState(
      true,
      `
      User Profile:
      ${JSON.stringify(user, null, 4)}
    `,
    );
  };

  const getMyUser = async () => {
    let user = await getUser();
    changeUserState(
      true,
      `
      User Profile:
      ${JSON.stringify(user, null, 4)}
    `,
    );
  };

  const getMyUserThroughAccessToken = async () => {
    const accessToken = await getAccessToken();

    let headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      try {
        const wellKnown = await fetch(
          `${sampleConfig.oidc.discoveryUri}/.well-known/openid-configuration`,
          {
            method: 'GET',
            headers: headers,
          },
        );
        if (!wellKnown.ok) {
          throw Error(wellKnown.status);
        }
        let json = await wellKnown.json();
        headers.Authorization = `Bearer ${accessToken.access_token}`;
        const userInfo = await fetch(`${json.userinfo_endpoint}`, {
          method: 'GET',
          headers: headers,
        });
        if (!userInfo.ok) {
          throw Error(userInfo.status);
        }
        json = await userInfo.json();
        changeUserState(true, JSON.stringify(json));
      } catch (e) {
        const message =
          'Failed to fetch user. Make sure you have logged in and access token is valid. Status Code: ' +
          e;
        console.log(message);
        changeUserState(true, message);
      }
    } else {
      const message = 'There is no access token available!';
      console.log(message);
      changeUserState(true, message);
    }
  };

  const refreshMyTokens = async () => {
    let newTokens = await refreshTokens().catch(e => {
      console.log(e);
    });
    if (newTokens) {
      const message =
        'Successfully refreshed tokens: ' + JSON.stringify(newTokens);
      console.log(message);
      changeUserState(true, message);
    } else {
      const message =
        'Failed to refresh tokens: Be sure Refresh Token grant type is enabled in your app in Okta, as well as the offline_access scope in samples.config.js';
      changeUserState(true, message);
    }
  };

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      <View style={styles.button}>
        <Button
          testID="getUserFromIdToken"
          onPress={() => {
            getUserIdToken();
          }}
          title="Get User From Id Token"
        />
      </View>
      <View style={styles.button}>
        <Button
          testID="getUserFromRequest"
          onPress={() => {
            getMyUser();
          }}
          title="Get User From Request"
        />
      </View>
      <View style={styles.button}>
        <Button
          testID="getMyUserFromAccessToken"
          onPress={() => {
            getMyUserThroughAccessToken();
          }}
          title="Get User From Access Token"
        />
      </View>
      <View style={styles.button}>
        <Button
          testID="refreshMyTokens"
          onPress={() => {
            refreshMyTokens();
          }}
          title="Refresh Tokens"
        />
      </View>
      <View style={styles.button}>
        <Button
          testID="clearButton"
          onPress={() => {
            changeUserState(true, '');
          }}
          title="Clear Text"
        />
      </View>
    </View>
  );

  const changeUserState = (isAuth: boolean, mesage: string) => {
    setUserState({isAuthenticated: isAuth, mesage: mesage});
  };

  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Text testID="titleLabel" style={styles.title}>
          Okta + React Native
        </Text>
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            {userState?.isAuthenticated ? (
              <TouchableOpacity
                style={styles.button}
                testID="logoutButton"
                onPress={() => {
                  logout();
                }}>
                <Text>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                testID="loginButton"
                onPress={() => {
                  login();
                }}>
                <Text>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {userState?.isAuthenticated && renderButtons()}
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.context}>
          <Text testID="descriptionBox">{userState?.mesage}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    borderRadius: 40,
    height: 40,
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  context: {
    marginTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0066cc',
    paddingTop: 40,
    textAlign: 'center',
  },
});
