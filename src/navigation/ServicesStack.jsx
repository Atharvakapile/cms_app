import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ServicesList from '../screens/ServicesList';
import ServiceDetails from '../screens/ServiceDetails';
import Payments from '../screens/Payments';
import Notes from '../screens/Notes';
import ServiceFiles from '../screens/ServiceFiles'; // ✅ ADD FILES SCREEN
import ServiceTimeline from '../screens/ServiceTimeline';

const Stack = createNativeStackNavigator();

export default function ServicesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* SERVICES LIST */}
      <Stack.Screen
        name="ServicesList"
        component={ServicesList}
      />

      {/* SERVICE DETAILS */}
      <Stack.Screen
        name="ServiceDetails"
        component={ServiceDetails}
      />

      {/* PAYMENTS */}
      <Stack.Screen
        name="Payments"
        component={Payments}
      />

      {/* NOTES */}
      <Stack.Screen
        name="ServiceNotes"
        component={Notes}
      />

      {/* FILES (NEW) */}
      <Stack.Screen
        name="ServiceFiles"
        component={ServiceFiles}
      />

      <Stack.Screen
  name="ServiceTimeline"
  component={ServiceTimeline}
/>
    </Stack.Navigator>
  );
}
