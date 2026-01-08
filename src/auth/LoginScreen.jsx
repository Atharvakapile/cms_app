import { useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import api from '../api/api';
import { AuthContext } from './authContext';
import { registerForPushNotifications } from '../utils/pushNotifications';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    mobile: false,
    pin: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        delay: 200,
      }),
      Animated.timing(gradientOpacity, {
        toValue: 0.15,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
    Haptics.selectionAsync();
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const handleLogin = async () => {
    if (mobile.length !== 10 || pin.length !== 4) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit mobile number and 4-digit PIN',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      // Button press animation with haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setLoading(true);

      const payload = {
        mobile: mobile.trim(),
        pin: pin,
      };

      const res = await api.post('/client-auth/login', payload);

      const token = res.data?.data?.token;
      if (!token) {
        throw new Error('Token missing');
      }

      await login(token);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      registerForPushNotifications().catch(() => {
        console.log('Push registration skipped');
      });
   } catch (err) {
  console.log('========== LOGIN ERROR START ==========');
  console.log('Message:', err.message);
  console.log('Code:', err.code);
  console.log('Response:', err.response);
  console.log('Request:', err.request);
  console.log('Full error:', JSON.stringify(err, null, 2));
  console.log('========== LOGIN ERROR END ==========');

  let errorMessage = 'Something went wrong. Please try again.';

  if (err.message === 'Network Error') {
    errorMessage = 'Cannot connect to server. Please check internet or server.';
  } else if (err.code === 'ECONNABORTED') {
    errorMessage = 'Request timed out. Server unreachable.';
  } else if (err.response?.status === 401) {
    errorMessage = 'Invalid mobile number or PIN.';
  } else if (err.response?.data?.message) {
    errorMessage = err.response.data.message;
  }

  Alert.alert('Login Failed', errorMessage);
}
 finally {
      setLoading(false);
    }
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#060B16" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Animated Gradient Background */}
            <Animated.View style={[styles.gradientBackground, { opacity: gradientOpacity }]} />
            
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              {/* Logo Header - Now positioned with proper top spacing */}
              <View style={styles.header}>
                <View style={styles.logoWrapper}>
                  <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>IP</Text>
                  </View>
                  <View style={styles.logoBadge}>
                    <Text style={styles.badgeText}>CLIENT</Text>
                  </View>
                </View>
                <Text style={styles.headerTitle}>Imperium Partners</Text>
                <Text style={styles.headerSubtitle}>Client Portal</Text>
              </View>

              {/* Login Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={styles.cardSubtitle}>Sign in to your account</Text>
                </View>

                {/* Mobile Input */}
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Icon name="phone-portrait-outline" size={16} color="#8A94A6" />
                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFocused.mobile && styles.inputWrapperFocused,
                      styles.inputWithPrefix,
                    ]}
                  >
                    <View style={styles.prefixContainer}>
                      <Text style={styles.prefix}>+91</Text>
                    </View>
                    <TextInput
                      placeholder="Enter mobile number"
                      placeholderTextColor="#5A6475"
                      value={mobile}
                      onChangeText={setMobile}
                      onFocus={() => handleFocus('mobile')}
                      onBlur={() => handleBlur('mobile')}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={styles.input}
                      editable={!loading}
                    />
                    {mobile.length === 10 && (
                      <Icon name="checkmark-circle" size={20} color="#10B981" style={styles.validationIcon} />
                    )}
                  </View>
                  <Text style={styles.inputHint}>We'll use this number to verify your identity</Text>
                </View>

                {/* PIN Input */}
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Icon name="lock-closed-outline" size={16} color="#8A94A6" />
                    <Text style={styles.inputLabel}>SECURITY PIN</Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFocused.pin && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      placeholder="Enter 4-digit PIN"
                      placeholderTextColor="#5A6475"
                      value={pin}
                      onChangeText={setPin}
                      onFocus={() => handleFocus('pin')}
                      onBlur={() => handleBlur('pin')}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                      style={styles.input}
                      editable={!loading}
                    />
                    {pin.length === 4 && (
                      <Icon name="checkmark-circle" size={20} color="#10B981" style={styles.validationIcon} />
                    )}
                  </View>
                  <Text style={styles.inputHint}>Enter the 4-digit PIN you created</Text>
                </View>

                {/* Login Button */}
                <Animated.View
                  style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}
                >
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>
                        {loading ? 'Authenticating...' : 'Continue'}
                      </Text>
                      {!loading && (
                        <Icon 
                          name="arrow-forward" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.buttonIcon}
                        />
                      )}
                    </View>
                    {loading && (
                      <View style={styles.loadingIndicator}>
                        <View style={styles.loadingDot} />
                        <View style={[styles.loadingDot, styles.loadingDot2]} />
                        <View style={[styles.loadingDot, styles.loadingDot3]} />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Security Note */}
                <View style={styles.securityNote}>
                  <Icon name="shield-checkmark-outline" size={16} color="#10B981" />
                  <Text style={styles.securityNoteText}>
                    All data is encrypted end-to-end
                  </Text>
                </View>
              </View>

             
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= UPDATED STYLES WITH TOP SPACING ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060B16',
  },
  container: {
    flex: 1,
    backgroundColor: '#060B16',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Add padding top to respect status bar area
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 24,
    paddingBottom: 40, // Add bottom padding too
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    // Add margin top for additional spacing if needed
    marginTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    // Less top margin since we already have padding in scrollContainer
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#60A5FA',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  cardHeader: {
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A94A6',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    paddingHorizontal: 20,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#0F172A',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  inputWithPrefix: {
    paddingLeft: 16,
  },
  prefixContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  prefix: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
    height: '100%',
  },
  validationIcon: {
    marginLeft: 12,
  },
  inputHint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '400',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonDisabled: {
    backgroundColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  buttonIcon: {
    marginLeft: 12,
    opacity: 0.9,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  loadingDot2: {
    opacity: 0.8,
  },
  loadingDot3: {
    opacity: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  securityNoteText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLink: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  footerBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  footerBadgeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});