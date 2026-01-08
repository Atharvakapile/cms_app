import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');
const today = new Date();

// Cache for timeline history
const timelineCache = {};

// Helper function to get current active service dates considering timeline extensions
const getCurrentServiceDates = async (serviceId, serviceStartDate, serviceEndDate) => {
  const originalStart = new Date(serviceStartDate);
  const originalEnd = new Date(serviceEndDate);
  
  // Default to original dates
  let currentStart = originalStart;
  let currentEnd = originalEnd;
  let isExtended = false;
  
  try {
    // Check if we have cached timeline data for this service
    if (!timelineCache[serviceId]) {
      const res = await api.get(`/service-history/${serviceId}`);
      timelineCache[serviceId] = res.data?.data?.timeline || [];
    }
    
    const timelineData = timelineCache[serviceId];
    
    // Sort timeline events by end date (most recent first)
    const sortedTimeline = timelineData.sort((a, b) => 
      new Date(b.end_date) - new Date(a.end_date)
    );
    
    // Find the active timeline event (today is between start and end)
    const activeTimeline = sortedTimeline.find(timeline => {
      if (timeline.start_date && timeline.end_date) {
        const timelineStart = new Date(timeline.start_date);
        const timelineEnd = new Date(timeline.end_date);
        return today >= timelineStart && today <= timelineEnd;
      }
      return false;
    });
    
    if (activeTimeline) {
      // If there's an active timeline, use its dates
      currentStart = new Date(activeTimeline.start_date);
      currentEnd = new Date(activeTimeline.end_date);
      isExtended = true;
    } else {
      // If no active timeline, check for the most recent completed timeline
      const completedTimelines = sortedTimeline.filter(timeline => {
        if (!timeline.end_date) return false;
        return new Date(timeline.end_date) < today;
      });
      
      if (completedTimelines.length > 0) {
        // Use the most recent completed timeline's dates
        const latestTimeline = completedTimelines[0];
        currentStart = new Date(latestTimeline.start_date);
        currentEnd = new Date(latestTimeline.end_date);
        isExtended = true;
      }
    }
  } catch (error) {
    console.log(`Error fetching timeline for service ${serviceId}:`, error.message);
    // Keep original dates on error
  }
  
  return {
    currentStart,
    currentEnd,
    isExtended,
    isActive: today >= currentStart && today <= currentEnd
  };
};

export default function Dashboard({ navigation }) {
  const [services, setServices] = useState([]);
  const [clientName, setClientName] = useState('Client');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    activeCount: 0,
    expiredCount: 0,
  });
  const [serviceDatesMap, setServiceDatesMap] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [servicesRes, profileRes] = await Promise.all([
        api.get('/client/services'),
        api.get('/clients/profile/me'),
      ]);

      const rows = servicesRes.data.data || [];
      const profile = profileRes.data.data;

      setServices(rows);
      setClientName(profile?.name || 'Client');

      // Calculate service dates and status
      await calculateServiceDates(rows);
      
    } catch (err) {
      console.log('Dashboard load error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateServiceDates = async (servicesData) => {
    const datesMap = {};
    let activeCount = 0;
    
    for (const service of servicesData) {
      const dates = await getCurrentServiceDates(
        service.id, 
        service.start_date, 
        service.end_date
      );
      datesMap[service.id] = dates;
      
      if (dates.isActive) {
        activeCount++;
      }
    }
    
    setServiceDatesMap(datesMap);
    setSummary({
      activeCount: activeCount,
      expiredCount: servicesData.length - activeCount,
    });
    
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
  };

  const announcements = [
    {
      id: 1,
      title: 'New Service Enhancements',
      text: 'Improved tracking and faster updates are now live.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop',
      link: 'https://imperiumofficial.com/updates',
      icon: 'rocket-outline',
      color: '#3b82f6',
    },
    {
      id: 2,
      title: 'Upcoming Offers',
      text: 'Exclusive renewal benefits coming soon.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w-800&auto=format&fit=crop',
      link: 'https://imperiumofficial.com/offers',
      icon: 'gift-outline',
      color: '#8b5cf6',
    },
    {
      id: 3,
      title: 'Mobile App Update',
      text: 'New features and improved performance.',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop',
      link: 'https://imperiumofficial.com/app-update',
      icon: 'phone-portrait-outline',
      color: '#10b981',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overallStatus = summary.activeCount > 0
    ? 'All Services Active'
    : 'Action Required';

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.pageSubtitle}>Overview of your services</Text>
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
          {/* ===== WELCOME HEADER ===== */}
          <Animated.View style={[
            styles.welcomeCard,
            { transform: [{ scale: headerScale }] }
          ]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.welcomeText}>
                Here's your service overview
              </Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={60} color="#3b82f6" />
            </View>
          </Animated.View>

          {/* ===== QUICK STATS ===== */}
          <View style={styles.statsRow}>
            <StatCard
              icon="checkmark-circle"
              label="Active Services"
              value={summary.activeCount}
              color="#10b981"
            />
            <StatCard
              icon="time-outline"
              label="Expiring Soon"
              value={summary.expiredCount}
              color="#f59e0b"
            />
            <StatCard
              icon="calendar-outline"
              label="Total Services"
              value={services.length}
              color="#3b82f6"
            />
          </View>

          {/* ===== STATUS OVERVIEW ===== */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusIcon,
                { backgroundColor: summary.activeCount > 0 ? '#10b98120' : '#ef444420' }
              ]}>
                <Ionicons
                  name={summary.activeCount > 0 ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={summary.activeCount > 0 ? '#10b981' : '#ef4444'}
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{overallStatus}</Text>
                <Text style={styles.statusSubtitle}>
                  Keep track of your active and expired services
                </Text>
              </View>
            </View>
            <View style={styles.statusProgress}>
              <View style={[
                styles.progressBar,
                { width: `${(summary.activeCount / services.length) * 100 || 0}%` }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {summary.activeCount} of {services.length} services active
            </Text>
          </View>

          {/* ===== SERVICES PREVIEW ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="grid-outline" size={20} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Your Services</Text>
              </View>
              {services.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Services')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>

            {services.length === 0 ? (
              <View style={styles.emptyServices}>
                <Ionicons name="cube-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>No services assigned yet</Text>
                <Text style={styles.emptySubtext}>
                  Services will appear here once assigned
                </Text>
              </View>
            ) : (
              services.slice(0, 3).map(service => {
                const serviceDates = serviceDatesMap[service.id];
                const active = serviceDates?.isActive || false;
                const endDate = serviceDates?.currentEnd || new Date(service.end_date);
                
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    active={active}
                    endDate={endDate}
                    onPress={() => navigation.navigate('Services', {
                      screen: 'ServiceDetails',
                      params: { serviceId: service.id },
                    })}
                  />
                );
              })
            )}
          </View>

          {/* ===== ANNOUNCEMENTS ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="megaphone-outline" size={20} color="#ec4899" />
                <Text style={styles.sectionTitle}>Announcements</Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.announcementsScroll}
            >
              {announcements.map((item, index) => (
                <AnnouncementCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                />
              ))}
            </ScrollView>
          </View>

          {/* ===== SUPPORT CARD ===== */}
          <TouchableOpacity
            style={styles.supportCard}
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={styles.supportIcon}>
              <Ionicons name="headset-outline" size={28} color="#3b82f6" />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Need Assistance?</Text>
              <Text style={styles.supportText}>
                Contact our support team for any queries
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ServiceCard = ({ service, active, endDate, onPress }) => (
  <TouchableOpacity style={styles.serviceCard} onPress={onPress}>
    <View style={styles.serviceContent}>
      <View style={styles.serviceIcon}>
        <Ionicons name="cube-outline" size={20} color="#3b82f6" />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.service_type}</Text>
        <View style={styles.serviceMeta}>
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text style={styles.serviceDate}>
            Valid till {endDate.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
    <View style={[
      styles.serviceStatus,
      active ? styles.statusActive : styles.statusExpired
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: active ? '#10b981' : '#ef4444' }
      ]} />
      <Text style={styles.statusText}>
        {active ? 'Active' : 'Expired'}
      </Text>
    </View>
  </TouchableOpacity>
);

const AnnouncementCard = ({ item, index }) => (
  <TouchableOpacity
    style={styles.announcementCard}
    onPress={() => Linking.openURL(item.link)}
    activeOpacity={0.9}
  >
    <Image
      source={{ uri: item.image }}
      style={styles.announcementImage}
    />
    <View style={styles.announcementOverlay} />
    <View style={styles.announcementContent}>
      <View style={[styles.announcementIcon, { backgroundColor: `${item.color}20` }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={styles.announcementTitle}>{item.title}</Text>
      <Text style={styles.announcementText}>{item.text}</Text>
      <View style={styles.announcementCta}>
        <Text style={styles.announcementCtaText}>Learn More</Text>
        <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
      </View>
    </View>
  </TouchableOpacity>
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  welcomeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  clientName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusProgress: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyServices: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  serviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusActive: {
    borderColor: '#10b98130',
  },
  statusExpired: {
    borderColor: '#ef444430',
  },
  announcementsScroll: {
    paddingLeft: 2,
  },
  announcementCard: {
    width: width * 0.8,
    height: 240,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
    position: 'relative',
  },
  announcementImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  announcementOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 30, 0.7)',
  },
  announcementContent: {
    padding: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  announcementText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 16,
    lineHeight: 20,
  },
  announcementCta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementCtaText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 20,
  },
  supportIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  supportText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});