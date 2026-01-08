import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../api/api';
import { Platform } from 'react-native';

/* ================= NOTIFICATION HANDLER ================= */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/* ================= REGISTER ================= */
export async function registerForPushNotifications() {
  try {
    // ❌ Physical device required
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    /* ===== ANDROID CHANNEL ===== */
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        'default',
        {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#38bdf8',
        }
      );
    }

    /* ===== PERMISSIONS ===== */
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push permission denied');
      return null;
    }

    /* ===== EXPO PUSH TOKEN ===== */
    const tokenData =
      await Notifications.getExpoPushTokenAsync({
        projectId:
          'e0a7f55f-f980-464a-8c36-3844a5d25ea9', // ⬅️ REQUIRED
      });

    const token = tokenData.data;

    /* ===== SAVE TO BACKEND ===== */
    await api.post('/push-tokens/register', {
      token,
      platform: Platform.OS,
    });

    return token;
  } catch (err) {
    console.log(
      '❌ PUSH REGISTER ERROR:',
      err.response?.data || err.message
    );
    return null;
  }
}
