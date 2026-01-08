import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AuthProvider, AuthContext } from './src/auth/authContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/auth/LoginScreen';
import './src/utils/notificationConfig';

const Stack = createNativeStackNavigator();

function RootNavigator({ navigationRef }) {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#020617',
        }}
      >
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="App">
          {() => <AppNavigator />}
        </Stack.Screen>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    /**
     * 🔔 HANDLE NOTIFICATION TAP
     */
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data =
            response.notification.request.content.data;

          // Optional: handle deep data later
          // console.log('Notification data:', data);

          if (navigationRef.current) {
            navigationRef.current.navigate('Notifications');
          }
        }
      );

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator navigationRef={navigationRef} />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
