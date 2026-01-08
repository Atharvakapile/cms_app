import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

const { width } = Dimensions.get('window');

export default function RequestService() {
  const [type, setType] = useState('service');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState({
    name: false,
    contact: false,
    description: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pickerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const togglePicker = () => {
    if (showPicker) {
      Animated.timing(pickerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowPicker(false));
    } else {
      setShowPicker(true);
      Animated.timing(pickerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleTypeSelect = (value) => {
    setType(value);
    togglePicker();
  };

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const submitRequest = async () => {
    // Validation
    if (!name.trim() || !contact.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (contact.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid contact number');
      return;
    }

    try {
      setLoading(true);
      
      // Button press animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.94,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      await api.post('/suggestions', {
        type,
        name,
        contact,
        description,
      });

      Alert.alert(
        'Request Submitted Successfully',
        'We will review your request and get back to you soon.',
        [{ text: 'OK', onPress: () => {
          setName('');
          setContact('');
          setDescription('');
          setType('service');
        }}]
      );

    } catch (err) {
      console.log('Submit error:', err.response?.data || err.message);
      Alert.alert(
        'Submission Failed',
        'Unable to submit your request. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'service':
        return 'construct-outline';
      case 'suggestion':
        return 'bulb-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'service':
        return 'Request New Service';
      case 'suggestion':
        return 'Suggestion / Query';
      default:
        return 'Select Type';
    }
  };

  const getTypeTitle = () => {
    return type === 'service' ? 'Request New Service' : 'Make a Suggestion';
  };

  const getTypeDescription = () => {
    return type === 'service'
      ? 'Request a new service or modification to existing services'
      : 'Share your suggestions or queries for improvement';
  };

  const getTypeColor = () => {
    return type === 'service' ? '#3b82f6' : '#8b5cf6';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Request Service</Text>
        <Text style={styles.pageSubtitle}>
          Submit requests or suggestions
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          if (showPicker) togglePicker();
        }}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* ===== INFO CARD ===== */}
              <View style={styles.infoCard}>
                <View style={[styles.infoIcon, { backgroundColor: `${getTypeColor()}15` }]}>
                  <Ionicons name={getTypeIcon()} size={32} color={getTypeColor()} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>{getTypeTitle()}</Text>
                  <Text style={styles.infoText}>{getTypeDescription()}</Text>
                </View>
              </View>

              {/* ===== FORM CARD ===== */}
              <View style={styles.formCard}>
                {/* ===== TYPE SELECTION ===== */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="layers-outline" size={20} color={getTypeColor()} />
                    <Text style={styles.sectionTitle}>Request Type</Text>
                  </View>
                  
                  {/* Custom Dropdown Button */}
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={togglePicker}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownLeft}>
                      <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor()}15` }]}>
                        <Ionicons name={getTypeIcon()} size={18} color={getTypeColor()} />
                      </View>
                      <Text style={styles.dropdownText}>{getTypeLabel()}</Text>
                    </View>
                    <Ionicons 
                      name={showPicker ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>

                  {/* Custom Picker Modal */}
                  {showPicker && (
                    <Animated.View style={[styles.pickerModal, { opacity: pickerOpacity }]}>
                      <TouchableOpacity 
                        style={styles.pickerOption}
                        onPress={() => handleTypeSelect('service')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[styles.optionIcon, { backgroundColor: '#3b82f615' }]}>
                            <Ionicons name="construct-outline" size={18} color="#3b82f6" />
                          </View>
                          <View>
                            <Text style={styles.optionTitle}>Request New Service</Text>
                            <Text style={styles.optionSubtitle}>New service or modification</Text>
                          </View>
                        </View>
                        {type === 'service' && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.pickerDivider} />
                      
                      <TouchableOpacity 
                        style={styles.pickerOption}
                        onPress={() => handleTypeSelect('suggestion')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[styles.optionIcon, { backgroundColor: '#8b5cf615' }]}>
                            <Ionicons name="bulb-outline" size={18} color="#8b5cf6" />
                          </View>
                          <View>
                            <Text style={styles.optionTitle}>Suggestion / Query</Text>
                            <Text style={styles.optionSubtitle}>Share suggestions or queries</Text>
                          </View>
                        </View>
                        {type === 'suggestion' && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color="#8b5cf6" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>

                {/* ===== NAME FIELD ===== */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Your Name</Text>
                  </View>
                  <View style={[
                    styles.inputWrapper,
                    isFocused.name && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="person-outline" size={18} color="#64748b" />
                    <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor="#64748b"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* ===== CONTACT FIELD ===== */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="call-outline" size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Contact Number</Text>
                  </View>
                  <View style={[
                    styles.inputWrapper,
                    isFocused.contact && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="call-outline" size={18} color="#64748b" />
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.separator} />
                    <TextInput
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#64748b"
                      value={contact}
                      onChangeText={setContact}
                      onFocus={() => handleFocus('contact')}
                      onBlur={() => handleBlur('contact')}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={styles.input}
                    />
                  </View>
                  <Text style={styles.inputHelper}>
                    We'll use this to contact you regarding your request
                  </Text>
                </View>

                {/* ===== DESCRIPTION FIELD ===== */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Description</Text>
                  </View>
                  <View style={[
                    styles.textAreaWrapper,
                    isFocused.description && styles.inputWrapperFocused
                  ]}>
                    <TextInput
                      placeholder="Describe your request or suggestion in detail..."
                      placeholderTextColor="#64748b"
                      value={description}
                      onChangeText={setDescription}
                      onFocus={() => handleFocus('description')}
                      onBlur={() => handleBlur('description')}
                      style={styles.textArea}
                      multiline
                      textAlignVertical="top"
                      maxLength={500}
                    />
                  </View>
                  <View style={styles.charCounter}>
                    <Text style={styles.charText}>
                      {description.length}/500 characters
                    </Text>
                  </View>
                </View>

                {/* ===== SUBMIT BUTTON ===== */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={submitRequest}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonContent}>
                      {loading ? (
                        <>
                          <Ionicons name="sync" size={20} color="#ffffff" />
                          <Text style={styles.buttonText}>Submitting...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
                          <Text style={styles.buttonText}>Submit Request</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* ===== FORM TIPS ===== */}
                <View style={styles.tipsCard}>
                  <View style={styles.tipsIcon}>
                    <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.tipsContent}>
                    <Text style={styles.tipsTitle}>Tips for better response</Text>
                    <Text style={styles.tipsText}>
                      • Be specific and detailed in your description
                      {'\n'}• Include relevant contact information
                      {'\n'}• Response time: 24-48 business hours
                    </Text>
                  </View>
                </View>
              </View>

              
              
              {/* ===== BOTTOM SPACING ===== */}
              <View style={styles.bottomSpacing} />
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  // Page Header
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#0a0f1e',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  infoText: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  formSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 12,
  },
  
  // Custom Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d3748',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  
  // Custom Picker Modal
  pickerModal: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: '#2d3748',
  },
  
  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d3748',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#0f172a',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  countryCode: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#2d3748',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  inputHelper: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    marginLeft: 4,
  },
  textAreaWrapper: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d3748',
    minHeight: 140,
    padding: 16,
  },
  textArea: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    textAlignVertical: 'top',
  },
  charCounter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  charText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  
  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  
  // Support Section
  supportContainer: {
    marginBottom: 20,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  supportText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  
  // Bottom spacing for safe area
  bottomSpacing: {
    height: 80,
  },
});