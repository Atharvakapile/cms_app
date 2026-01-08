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
    expiringSoonCount: 0,
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
    let expiringSoonCount = 0;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    for (const service of servicesData) {
      const dates = await getCurrentServiceDates(
        service.id, 
        service.start_date, 
        service.end_date
      );
      datesMap[service.id] = dates;
      
      if (dates.isActive) {
        activeCount++;
        
        // Check if service expires within 30 days
        if (dates.currentEnd <= thirtyDaysFromNow && dates.currentEnd >= today) {
          expiringSoonCount++;
        }
      }
    }
    
    setServiceDatesMap(datesMap);
    setSummary({
      activeCount: activeCount,
      expiredCount: servicesData.length - activeCount,
      expiringSoonCount: expiringSoonCount,
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
      title: 'Tailored Business Solutions',
      text: 'Bespoke software solutions designed specifically for your industry needs and operational requirements',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop',
      link: 'https://imperiumofficial.in/custom.php',
      icon: 'rocket-outline',
      color: '#3b82f6',
    },
    {
      id: 2,
      title: 'Upcoming Offers',
      text: 'Transparent Pricing for Every Business.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w-800&auto=format&fit=crop',
      link: 'https://imperiumofficial.in/pricing.php',
      icon: 'gift-outline',
      color: '#8b5cf6',
    },
    {
      id: 3,
      title: 'Enterprise-grade solutions',
      text: 'Comprehensive software suite designed to streamline operations, drive efficiency, and accelerate business growth across industries.',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop',
      link: 'https://imperiumofficial.in/products.php',
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

          {/* ===== IMPROVED KPI CARDS ===== */}
          <View style={styles.kpiSection}>
            <Text style={styles.kpiTitle}>Action Required</Text>
            <View style={styles.kpiGrid}>
              <KPICard
                icon="alert-circle"
                label="Expired"
                value={summary.expiredCount}
                total={services.length}
                color="#ef4444"
                progress={services.length > 0 ? (summary.expiredCount / services.length) * 100 : 0}
                type="expired"
              />
              <KPICard
                icon="time"
                label="Expiring Soon"
                value={summary.expiringSoonCount}
                total={summary.activeCount}
                color="#f59e0b"
                progress={summary.activeCount > 0 ? (summary.expiringSoonCount / summary.activeCount) * 100 : 0}
                type="expiring"
              />
            </View>
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
          <View style={styles.supportContainer}>
            <TouchableOpacity
              style={styles.supportCard}
              onPress={() => navigation.navigate('Contact')}
              activeOpacity={0.9}
            >
              <View style={styles.supportIconContainer}>
                <View style={styles.supportIcon}>
                  <Ionicons name="headset-outline" size={24} color="#fff" />
                </View>
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Need Assistance?</Text>
                <Text style={styles.supportText}>
                  Get help from our support team 24/7
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Extra bottom spacing for safe area */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const KPICard = ({ icon, label, value, total, color, progress, type }) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiHeader}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.kpiLabelContainer}>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
    
    <View style={styles.kpiValueRow}>
      <Text style={styles.kpiValue} numberOfLines={1}>
        {value}
      </Text>
      {type === 'expired' && (
        <Text style={styles.kpiSubtext} numberOfLines={1}>
          of {total} services
        </Text>
      )}
      {type === 'expiring' && (
        <Text style={styles.kpiSubtext} numberOfLines={1}>
          of {total} active
        </Text>
      )}
    </View>
    
    <View style={styles.progressContainer}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${color}30` }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: color,
              }
            ]} 
          />
        </View>
      </View>
      <View style={styles.percentContainer}>
        <Text style={[styles.percentValue, { color }]} numberOfLines={1}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  </View>
);

const ServiceCard = ({ service, active, endDate, onPress }) => {
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = active && daysRemaining <= 30 && daysRemaining > 0;
  
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.serviceContent}>
        <View style={[
          styles.serviceIcon,
          { backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
        ]}>
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={active ? '#3b82f6' : '#ef4444'} 
          />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{service.service_type}</Text>
          <View style={styles.serviceMeta}>
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text style={styles.serviceDate} numberOfLines={1}>
              {active ? 'Expires' : 'Expired'} {endDate.toLocaleDateString()}
            </Text>
            {isExpiringSoon && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.expiringText} numberOfLines={1}>
                  {daysRemaining} days left
                </Text>
              </>
            )}
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
        <Text style={styles.statusText} numberOfLines={1}>
          {active ? 'Active' : 'Expired'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

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
      <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.announcementText} numberOfLines={2}>{item.text}</Text>
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
    paddingBottom: 20,
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
  
  // KPI Section
  kpiSection: {
    marginBottom: 24,
  },
  kpiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 0, // Prevents overflow
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  kpiLabelContainer: {
    flex: 1,
    minWidth: 0,
  },
  kpiLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flexShrink: 1,
  },
  kpiValueRow: {
    marginBottom: 16,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 40,
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentContainer: {
    flexShrink: 0,
  },
  percentValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Section Styles
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
  
  // Service Card
  serviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
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
    minWidth: 0,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  serviceInfo: {
    flex: 1,
    minWidth: 0,
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
    flexWrap: 'wrap',
    minWidth: 0,
  },
  serviceDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
    flexShrink: 1,
  },
  separator: {
    color: '#475569',
    marginHorizontal: 6,
  },
  expiringText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
    flexShrink: 0,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    marginLeft: 8,
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
  
  // Announcements
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
  
  // Support Card with better spacing
  supportContainer: {
    marginBottom: 24,
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
  supportIconContainer: {
    marginRight: 16,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportContent: {
    flex: 1,
    minWidth: 0,
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
  arrowContainer: {
    paddingLeft: 8,
  },
  
  // Bottom spacing for safe area
  bottomSpacing: {
    height: 80,
  },
});