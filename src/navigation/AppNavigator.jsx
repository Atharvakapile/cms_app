import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useState, useContext, useRef } from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

import Dashboard from '../screens/Dashboard';
import RequestService from '../screens/RequestService';
import ServicesStack from './ServicesStack';
import Contact from '../screens/Contact';
import Profile from '../screens/Profile';
import Notifications from '../screens/Notifications';
import { AuthContext } from '../auth/authContext';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

function TabsWithMoreModal() {
  const [moreVisible, setMoreVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  // Animation values for modal
  const modalTranslateY = useRef(new Animated.Value(height)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const showModal = () => {
    setMoreVisible(true);
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMoreVisible(false);
    });
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => hideModal()
        },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            hideModal();
            setTimeout(() => logout(), 300);
          }
        },
      ]
    );
  };

  const goTo = (screen) => {
    hideModal();
    setTimeout(() => {
      navigation.navigate('App', { screen });
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1e' }}>
      <StatusBar style="light" backgroundColor="#0a0f1e" />

      {/* ================= ENHANCED MORE MODAL ================= */}
      <Modal 
        visible={moreVisible} 
        transparent 
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <Pressable
            style={styles.backdropPressable}
            onPress={hideModal}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              opacity: modalOpacity,
              transform: [{ translateY: modalTranslateY }]
            }
          ]}
        >
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>More Options</Text>
              <Text style={styles.modalSubtitle}>
                Additional features and settings
              </Text>
            </View>

            {/* OPTIONS LIST */}
            <View style={styles.optionsList}>
              {/* PROFILE OPTION */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => goTo('Profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#3b82f615' }]}>
                  <Ionicons name="person-circle-outline" size={24} color="#3b82f6" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Profile</Text>
                  <Text style={styles.optionDescription}>
                    View and manage your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>

              {/* NOTIFICATIONS OPTION */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => goTo('Notifications')}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#ec489915' }]}>
                  <Ionicons name="notifications-outline" size={24} color="#ec4899" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Notifications</Text>
                  <Text style={styles.optionDescription}>
                    View alerts and updates
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>

              {/* SETTINGS DIVIDER */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Account</Text>
              </View>

              {/* LOGOUT OPTION */}
              <TouchableOpacity
                style={[styles.optionItem, styles.logoutOption]}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#ef444415' }]}>
                  <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, styles.logoutTitle]}>Logout</Text>
                  <Text style={styles.optionDescription}>
                    Sign out of your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* MODAL FOOTER */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                Imperium Client Portal • v1.2
              </Text>
            </View>
          </View>
        </Animated.View>
      </Modal>

      {/* ================= CLEAN BOTTOM TABS (NO LABELS) ================= */}
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tabBarIcon = ({ focused, color, size }) => {
            let iconName;
            
            switch (route.name) {
              case 'Dashboard':
                iconName = 'home';
                break;
              case 'Services':
                iconName = 'briefcase';
                break;
              case 'Request':
                iconName = 'add-circle';
                break;
              case 'Contact':
                iconName = 'call';
                break;
              case 'More':
                iconName = 'ellipsis-horizontal';
                break;
            }

            return (
              <View style={styles.tabIconContainer}>
                <Ionicons 
                  name={iconName} 
                  size={route.name === 'Request' ? 26 : 24} 
                  color={focused ? '#3b82f6' : '#94a3b8'} 
                />
                {focused && <View style={styles.activeLine} />}
              </View>
            );
          };

          return {
            headerShown: false,
            tabBarShowLabel: false, // Hide all labels
            tabBarStyle: {
              backgroundColor: '#0f172a',
              borderTopColor: '#1e293b',
              borderTopWidth: 1,
              height: 64 + insets.bottom,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
              paddingTop: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
            },
            tabBarIcon,
          };
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={Dashboard} 
          options={{ 
            tabBarAccessibilityLabel: 'Home Dashboard'
          }}
        />
        <Tab.Screen 
          name="Services" 
          component={ServicesStack} 
          options={{ 
            tabBarAccessibilityLabel: 'Services'
          }}
        />
        <Tab.Screen 
          name="Request" 
          component={RequestService} 
          options={{ 
            tabBarAccessibilityLabel: 'Request Service',
            tabBarIcon: ({ focused }) => (
              <View style={styles.requestTabContainer}>
                <View style={[
                  styles.requestTabWrapper,
                  focused && styles.requestTabWrapperActive
                ]}>
                  <Ionicons 
                    name="add-circle" 
                    size={26} 
                    color={focused ? '#ffffff' : '#3b82f6'} 
                  />
                </View>
                {focused && <View style={[styles.activeLine, styles.requestActiveLine]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Contact" 
          component={Contact} 
          options={{ 
            tabBarAccessibilityLabel: 'Contact'
          }}
        />

        {/* ===== HIDDEN SCREENS ===== */}
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />

        <Tab.Screen
          name="Notifications"
          component={Notifications}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />

        {/* ===== MORE TRIGGER ===== */}
        <Tab.Screen
          name="More"
          component={Dashboard}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              showModal();
            },
          }}
          options={{
            tabBarAccessibilityLabel: 'More Options'
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function AppNavigator() {
  return <TabsWithMoreModal />;
}

/* ================= ENHANCED STYLES ================= */

const styles = StyleSheet.create({
  // Backdrop Styles
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  backdropPressable: {
    flex: 1,
  },
  
  // Modal Container
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#2d3748',
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#475569',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Options List
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoutOption: {
    borderColor: '#ef444430',
  },
  logoutTitle: {
    color: '#ef4444',
  },
  
  // Modal Footer
  modalFooter: {
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Tab Bar Styles (Clean - No Labels)
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingTop: 4,
  },
  activeLine: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  
  // Request Tab Special Styling
  requestTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingTop: 4,
  },
  requestTabWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  requestTabWrapperActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  requestActiveLine: {
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
});