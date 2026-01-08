import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

const { width } = Dimensions.get('window');

export default function ServiceTimeline({ route, navigation }) {
  const { serviceId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'completed'

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/service-history/${serviceId}`);
      const timelineData = res.data?.data?.timeline || [];
      const maintenanceData = res.data?.data?.maintenance || [];

      const sortedTimeline = timelineData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      const sortedMaintenance = maintenanceData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

      setTimeline(sortedTimeline);
      setMaintenance(sortedMaintenance);
      
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
    } catch (err) {
      console.log(
        'Timeline fetch error:',
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  /* ===== HELPER FUNCTIONS ===== */

  const getTimelineStatus = (item) => {
    const today = new Date();
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);

    if (today < startDate) return { status: 'upcoming', color: '#f59e0b', label: 'Upcoming' };
    if (today > endDate) return { status: 'completed', color: '#10b981', label: 'Completed' };
    return { status: 'active', color: '#3b82f6', label: 'Active' };
  };

  const getMaintenanceStatus = (item) => {
    const today = new Date();
    const endDate = new Date(item.end_date);

    if (today > endDate) return { status: 'expired', color: '#ef4444', label: 'Expired' };
    return { status: 'active', color: '#10b981', label: 'Active' };
  };

  const getCurrentActiveTimeline = () => {
    const today = new Date();
    return timeline.find(item => {
      const startDate = new Date(item.start_date);
      const endDate = new Date(item.end_date);
      return today >= startDate && today <= endDate;
    });
  };

  const getCurrentActiveMaintenance = () => {
    const today = new Date();
    return maintenance.find(item => today <= new Date(item.end_date));
  };

  const filterEvents = (events) => {
    const today = new Date();
    
    switch (activeFilter) {
      case 'active':
        return events.filter(event => today <= new Date(event.end_date));
      case 'completed':
        return events.filter(event => today > new Date(event.end_date));
      default:
        return events;
    }
  };

  const filteredTimeline = filterEvents(timeline);
  const filteredMaintenance = filterEvents(maintenance);

  const getTimelineIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('development') || lowerType.includes('build')) return 'code-working';
    if (lowerType.includes('design') || lowerType.includes('ui')) return 'color-palette';
    if (lowerType.includes('testing') || lowerType.includes('qa')) return 'checkmark-done';
    if (lowerType.includes('deploy') || lowerType.includes('launch')) return 'rocket';
    if (lowerType.includes('support') || lowerType.includes('maintenance')) return 'construct';
    return 'time';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays}d`;
    return `${Math.floor(diffDays / 30)}m`;
  };

  const getProgressPercentage = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    
    if (today <= startDate) return 0;
    if (today >= endDate) return 100;
    
    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    return Math.floor((elapsedDuration / totalDuration) * 100);
  };

  /* ===== RENDER FUNCTIONS ===== */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Timeline</Text>
          <Text style={styles.pageSubtitle}>Loading timeline...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading service history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentActiveTimeline = getCurrentActiveTimeline();
  const currentActiveMaintenance = getCurrentActiveMaintenance();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Timeline</Text>
        <Text style={styles.pageSubtitle}>
          Service phases and maintenance records
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
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
          {/* ===== SIMPLIFIED KPIs ===== */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={styles.kpiIcon}>
                <Ionicons name="time-outline" size={22} color="#3b82f6" />
              </View>
              <View style={styles.kpiTitleContainer}>
                <Text style={styles.kpiTitle}>Overview</Text>
                <Text style={styles.kpiSubtitle}>
                  {timeline.length + maintenance.length} total events
                </Text>
              </View>
            </View>

            <View style={styles.kpiStats}>
              <View style={styles.kpiStat}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="time-outline" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{timeline.length}</Text>
                <Text style={styles.statLabel}>Timeline</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.kpiStat}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="construct-outline" size={18} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{maintenance.length}</Text>
                <Text style={styles.statLabel}>Maintenance</Text>
              </View>
            </View>
            
            {currentActiveTimeline && (
              <View style={styles.currentStatus}>
                <View style={[styles.statusIndicator, { backgroundColor: '#3b82f6' }]} />
                <View style={styles.currentStatusContent}>
                  <Text style={styles.currentStatusTitle}>Currently Active</Text>
                  <Text style={styles.currentStatusText}>
                    {currentActiveTimeline.timeline_type}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ===== FILTER BUTTONS ===== */}
          <View style={styles.filterContainer}>
            <FilterButton 
              label="All Events" 
              active={activeFilter === 'all'} 
              onPress={() => setActiveFilter('all')}
              count={timeline.length + maintenance.length}
            />
            <FilterButton 
              label="Active" 
              active={activeFilter === 'active'} 
              onPress={() => setActiveFilter('active')}
              count={timeline.filter(item => getTimelineStatus(item).status === 'active').length + 
                     maintenance.filter(item => getMaintenanceStatus(item).status === 'active').length}
            />
            <FilterButton 
              label="Completed" 
              active={activeFilter === 'completed'} 
              onPress={() => setActiveFilter('completed')}
              count={timeline.filter(item => getTimelineStatus(item).status === 'completed' || getTimelineStatus(item).status === 'upcoming').length + 
                     maintenance.filter(item => getMaintenanceStatus(item).status === 'expired').length}
            />
          </View>

          {/* ===== EVENTS LIST ===== */}
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'all' ? 'All Events' : 
                 activeFilter === 'active' ? 'Active Events' : 'Completed Events'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Showing {filteredTimeline.length + filteredMaintenance.length} events
              </Text>
            </View>

            {(filteredTimeline.length === 0 && filteredMaintenance.length === 0) ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>
                  No {activeFilter === 'all' ? '' : activeFilter} events found
                </Text>
                <Text style={styles.emptyText}>
                  {activeFilter === 'all' 
                    ? 'Service events will appear here as service progresses'
                    : activeFilter === 'active'
                    ? 'No active events at the moment'
                    : 'No completed events yet'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {/* Timeline Events */}
                {filteredTimeline.map((item, index) => (
                  <EventItem
                    key={`timeline-${item.id}`}
                    item={item}
                    type="timeline"
                    status={getTimelineStatus(item)}
                    isLast={index === filteredTimeline.length - 1 && filteredMaintenance.length === 0}
                  />
                ))}
                
                {/* Maintenance Events */}
                {filteredMaintenance.map((item, index) => (
                  <EventItem
                    key={`maintenance-${item.id}`}
                    item={item}
                    type="maintenance"
                    status={getMaintenanceStatus(item)}
                    isLast={index === filteredMaintenance.length - 1}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ===== FOOTER NOTE ===== */}
          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={18} color="#f59e0b" />
            <Text style={styles.footerText}>
              Active events show in blue, completed in green. Use filters to view specific event types.
            </Text>
          </View>

          {/* ===== BOTTOM SPACING ===== */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const FilterButton = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    style={[styles.filterButton, active && styles.filterButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label}
    </Text>
    <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
      <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

const EventItem = ({ item, type, status, isLast }) => {
  const isTimeline = type === 'timeline';
  const iconName = isTimeline ? getTimelineIcon(item.timeline_type) : 'construct';
  
  const getItemTitle = () => {
    if (isTimeline) return item.timeline_type;
    return `Maintenance +${item.months_added}m`;
  };

  const getItemDateRange = () => {
    const start = formatDate(item.start_date);
    const end = formatDate(item.end_date);
    return `${start} - ${end}`;
  };

  const getDurationText = () => {
    if (isTimeline) {
      const duration = getDuration(item.start_date, item.end_date);
      const progress = getProgressPercentage(item.start_date, item.end_date);
      if (status.status === 'active' || status.status === 'upcoming') {
        return `${duration} • ${progress}% complete`;
      }
      return duration;
    }
    return `Extended by ${item.months_added} months`;
  };

  return (
    <View style={[styles.eventItem, !isLast && styles.eventItemBorder]}>
      <View style={styles.eventLeft}>
        <View style={[styles.eventIcon, { backgroundColor: `${status.color}15` }]}>
          <Ionicons name={iconName} size={18} color={status.color} />
        </View>
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {getItemTitle()}
            </Text>
            <View style={[styles.eventStatus, { backgroundColor: `${status.color}15` }]}>
              <Text style={[styles.eventStatusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text style={styles.eventDates}>{getItemDateRange()}</Text>
          <Text style={styles.eventDuration}>{getDurationText()}</Text>
        </View>
      </View>
    </View>
  );
};

/* ===== HELPER FUNCTIONS ===== */

const getTimelineIcon = (type) => {
  const lowerType = type?.toLowerCase() || '';
  if (lowerType.includes('development') || lowerType.includes('build')) return 'code-working';
  if (lowerType.includes('design') || lowerType.includes('ui')) return 'color-palette';
  if (lowerType.includes('testing') || lowerType.includes('qa')) return 'checkmark-done';
  if (lowerType.includes('deploy') || lowerType.includes('launch')) return 'rocket';
  if (lowerType.includes('support') || lowerType.includes('maintenance')) return 'construct';
  return 'time';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const getDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays}d`;
  return `${Math.floor(diffDays / 30)}m`;
};

const getProgressPercentage = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const today = new Date();
  
  if (today <= startDate) return 0;
  if (today >= endDate) return 100;
  
  const totalDuration = endDate - startDate;
  const elapsedDuration = today - startDate;
  return Math.floor((elapsedDuration / totalDuration) * 100);
};

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
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
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
    paddingBottom: 20, // Reduced from 40 since we added bottomSpacing
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  // KPI Card
  kpiCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kpiTitleContainer: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  kpiStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiStat: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 25,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
    marginHorizontal: 20,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  currentStatusContent: {
    flex: 1,
  },
  currentStatusTitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  // Filter Buttons
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
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
    borderRadius: 12,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#0f172a',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#f8fafc',
  },
  filterBadge: {
    backgroundColor: '#334155',
    borderRadius: 10,
    minWidth: 24,
    height: 20,
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
  // Events Section
  eventsSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Events List
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventDates: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  // Footer Note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});