import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/clients/profile/me');
      setProfile(res.data?.data);
      
      // Start animations after data loads
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
        Animated.spring(headerScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (err) {
      console.log(
        'Profile fetch error:',
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorText}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <Text style={styles.pageSubtitle}>Account details and information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
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
          {/* ===== PROFILE HEADER ===== */}
          <Animated.View style={[
            styles.headerCard,
            { transform: [{ scale: headerScale }] }
          ]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBackground}>
                <Ionicons name="person" size={48} color="#ffffff" />
              </View>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: profile.status === 'active' ? '#10b981' : '#f59e0b' }
                ]} />
                <Text style={styles.statusText}>
                  {profile.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.mobile}>{profile.mobile}</Text>
          </Animated.View>

          {/* ===== QUICK INFO BADGES (CENTER ALIGNED) ===== */}
          <View style={styles.badgesContainer}>
            <InfoBadge
              icon="calendar-outline"
              label="Member Since"
              value={new Date(profile.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
              })}
            />
            <InfoBadge
              icon="shield-checkmark-outline"
              label="Account Status"
              value={profile.status === 'active' ? 'Verified' : 'Pending'}
              status={profile.status}
            />
            <InfoBadge
              icon="phone-portrait-outline"
              label="Device"
              value="Mobile App"
            />
          </View>

          {/* ===== ACCOUNT DETAILS CARD ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="card-outline" size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Account Details</Text>
            </View>

            <InfoRow
              icon="person-outline"
              label="Full Name"
              value={profile.name}
            />
            <InfoRow
              icon="mail-outline"
              label="Email Address"
              value={profile.email}
            />
            <InfoRow
              icon="call-outline"
              label="Mobile Number"
              value={profile.mobile}
            />
            <InfoRow
              icon="location-outline"
              label="Address"
              value={profile.address || 'Not provided'}
            />
            <InfoRow
              icon="time-outline"
              label="Account Created"
              value={new Date(profile.created_at).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </View>

          {/* ===== ACCOUNT ACTIVITY ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart-outline" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Account Status</Text>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusContent}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: profile.status === 'active' ? '#10b981' : '#f59e0b' }
                ]} />
                <View>
                  <Text style={styles.statusTitle}>
                    {profile.status === 'active' ? 'Active Account' : 'Account Pending'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    {profile.status === 'active' 
                      ? 'Your account is fully activated and ready to use'
                      : 'Your account is pending verification'
                    }
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatItem icon="checkmark-circle" label="Verified" value="Yes" />
              <StatItem icon="shield-checkmark" label="Security" value="High" />
              <StatItem icon="notifications" label="Alerts" value="Enabled" />
            </View>
          </View>

          
          
          {/* ===== BOTTOM SPACING ===== */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const InfoBadge = ({ icon, label, value, status }) => (
  <View style={styles.badge}>
    <View style={styles.badgeIcon}>
      <Ionicons name={icon} size={18} color="#3b82f6" />
    </View>
    <View style={styles.badgeContent}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={[
        styles.badgeValue,
        status === 'active' && styles.badgeValueActive,
        status !== 'active' && styles.badgeValueInactive,
      ]}>
        {value}
      </Text>
    </View>
  </View>
);

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color="#94a3b8" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={20} color="#3b82f6" />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1e',
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  headerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: -16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  mobile: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Badges Container with center alignment
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  badge: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContent: {
    alignItems: 'center',
    width: '100%',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  badgeValueActive: {
    color: '#10b981',
  },
  badgeValueInactive: {
    color: '#f59e0b',
  },
  
  detailCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  
  // Stats Grid with center alignment
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  
  // Support Section with bottom spacing
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