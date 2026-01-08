import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

const { width } = Dimensions.get('window');

// Cache for timeline history to avoid multiple API calls
const timelineCache = {};

// Helper function to get current active service dates considering timeline extensions
const getCurrentServiceDates = async (serviceId, serviceStartDate, serviceEndDate) => {
  const today = new Date();
  const originalStart = new Date(serviceStartDate);
  const originalEnd = new Date(serviceEndDate);
  
  // Default to original dates
  let currentStart = originalStart;
  let currentEnd = originalEnd;
  let isExtended = false;
  let timelineType = null;
  
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
      timelineType = activeTimeline.timeline_type;
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
        timelineType = latestTimeline.timeline_type;
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
    timelineType,
    isActive: today >= currentStart && today <= currentEnd
  };
};

const getServiceIcon = (serviceType) => {
  const type = serviceType?.toLowerCase() || '';
  if (type.includes('web') || type.includes('site')) return 'globe-outline';
  if (type.includes('app') || type.includes('mobile')) return 'phone-portrait-outline';
  if (type.includes('marketing') || type.includes('seo')) return 'megaphone-outline';
  if (type.includes('design') || type.includes('ui')) return 'color-palette-outline';
  if (type.includes('cms') || type.includes('portal')) return 'server-outline';
  if (type.includes('hosting') || type.includes('server')) return 'cloud-outline';
  return 'cube-outline';
};

export default function ServicesList({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'
  const [serviceDatesMap, setServiceDatesMap] = useState({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/client/services');
      const servicesData = res.data.data || [];
      setServices(servicesData);
      
      // Calculate service dates after getting services
      await calculateServiceDates(servicesData);
      
      // Start animations after data loads
      if (!refreshing) {
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
      }
    } catch (error) {
      console.log(
        'Fetch services error:',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateServiceDates = async (servicesData) => {
    const datesMap = {};
    
    for (const service of servicesData) {
      const dates = await getCurrentServiceDates(
        service.id, 
        service.start_date, 
        service.end_date
      );
      datesMap[service.id] = dates;
    }
    
    setServiceDatesMap(datesMap);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Clear cache on refresh
    Object.keys(timelineCache).forEach(key => delete timelineCache[key]);
    fetchServices();
  };

  const filteredServices = services.filter(item => {
    if (filter === 'all') return true;
    const serviceDates = serviceDatesMap[item.id];
    if (!serviceDates) return false;
    
    const active = serviceDates.isActive;
    if (filter === 'active') return active;
    if (filter === 'expired') return !active;
    return true;
  });

  const getStats = () => {
    const active = Object.values(serviceDatesMap).filter(dates => dates?.isActive).length;
    const expired = services.length - active;
    return { active, expired, total: services.length };
  };

  const stats = getStats();

  const renderService = ({ item, index }) => {
    const serviceDates = serviceDatesMap[item.id];
    const active = serviceDates?.isActive || false;
    const daysLeft = active ? Math.floor((serviceDates.currentEnd - new Date()) / (1000 * 60 * 60 * 24)) : null;
    const showExtended = serviceDates?.isExtended;

    return (
      <Animated.View
        style={[
          styles.serviceCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ServiceDetails', {
              serviceId: item.id,
            })
          }
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.serviceHeader}>
              <View style={[
                styles.serviceIcon,
                { backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)' }
              ]}>
                <Ionicons 
                  name={getServiceIcon(item.service_type)} 
                  size={24} 
                  color={active ? '#3b82f6' : '#94a3b8'} 
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.service_type}</Text>
                <View style={styles.serviceMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>
                      {serviceDates ? 
                        serviceDates.currentStart.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : 
                        'Loading...'
                      }
                    </Text>
                  </View>
                  <View style={styles.metaSeparator}>
                    <Text style={styles.metaSeparatorText}>→</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>
                      {serviceDates ? 
                        serviceDates.currentEnd.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : 
                        'Loading...'
                      }
                    </Text>
                  </View>
                </View>
                {showExtended && (
                  <View style={styles.extendedBadge}>
                    <Ionicons name="time-outline" size={10} color="#3b82f6" />
                    <Text style={styles.extendedText}>Extended</Text>
                  </View>
                )}
              </View>
              <View style={[
                styles.statusBadge,
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
            </View>

            {active && daysLeft !== null && daysLeft <= 30 && (
              <View style={[
                styles.daysRemaining,
                { 
                  backgroundColor: daysLeft <= 7 
                    ? 'rgba(245, 158, 11, 0.1)' 
                    : 'rgba(59, 130, 246, 0.1)',
                  borderColor: daysLeft <= 7 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(59, 130, 246, 0.2)'
                }
              ]}>
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={daysLeft <= 7 ? '#f59e0b' : '#3b82f6'} 
                />
                <Text style={[
                  styles.daysText,
                  { color: daysLeft <= 7 ? '#f59e0b' : '#3b82f6' }
                ]}>
                  {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                </Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.viewDetails}>
                View complete details
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Services</Text>
          <Text style={styles.pageSubtitle}>Service portfolio</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Services</Text>
        <Text style={styles.pageSubtitle}>
          {services.length} service{services.length !== 1 ? 's' : ''} in your portfolio
        </Text>
      </View>

      <View style={styles.container}>
        {/* ===== STATISTICS ===== */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="cube-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="time-outline" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {/* ===== FILTER BUTTONS ===== */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Services
            </Text>
            <View style={[styles.filterBadge, filter === 'all' && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, filter === 'all' && styles.filterBadgeTextActive]}>
                {stats.total}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              Active
            </Text>
            <View style={[styles.filterBadge, filter === 'active' && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, filter === 'active' && styles.filterBadgeTextActive]}>
                {stats.active}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'expired' && styles.filterButtonActive]}
            onPress={() => setFilter('expired')}
          >
            <Text style={[styles.filterText, filter === 'expired' && styles.filterTextActive]}>
              Expired
            </Text>
            <View style={[styles.filterBadge, filter === 'expired' && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, filter === 'expired' && styles.filterBadgeTextActive]}>
                {stats.expired}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== SERVICES LIST ===== */}
        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={64} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Services Yet' : 
               filter === 'active' ? 'No Active Services' : 
               'No Expired Services'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 
                'Services will appear here once assigned' :
                filter === 'active' ?
                'All your services have expired or are not active yet' :
                'No expired services found'
              }
            </Text>
            {filter !== 'all' && (
              <TouchableOpacity 
                style={styles.resetFilterButton}
                onPress={() => setFilter('all')}
              >
                <Text style={styles.resetFilterText}>View All Services</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderService}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3b82f6"
                colors={['#3b82f6']}
              />
            }
            ListHeaderComponent={
              <Text style={styles.resultsCount}>
                Showing {filteredServices.length} of {services.length} services
              </Text>
            }
          />
        )}
      </View>
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
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#0f172a',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginRight: 6,
  },
  filterTextActive: {
    color: '#3b82f6',
  },
  filterBadge: {
    backgroundColor: '#334155',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    fontWeight: '500',
  },
  serviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 24,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  metaSeparator: {
    marginHorizontal: 8,
  },
  metaSeparatorText: {
    color: '#64748b',
    fontSize: 12,
  },
  extendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  extendedText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusActive: {
    borderColor: '#10b98130',
  },
  statusExpired: {
    borderColor: '#ef444430',
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
  daysRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  daysText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  viewDetails: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resetFilterButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetFilterText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
});