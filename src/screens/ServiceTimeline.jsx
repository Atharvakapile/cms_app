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

      // Sort timeline events by start date
      const sortedTimeline = timelineData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      const sortedMaintenance = maintenanceData.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

      setTimeline(sortedTimeline);
      setMaintenance(sortedMaintenance);
      
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

  const getOverallServiceStatus = () => {
    if (timeline.length === 0 && maintenance.length === 0) {
      return { status: 'no-data', color: '#94a3b8', label: 'No Data' };
    }

    const allEvents = [...timeline, ...maintenance];
    const activeEvents = allEvents.filter(event => {
      const today = new Date();
      const endDate = new Date(event.end_date);
      return today <= endDate;
    });

    const totalEvents = allEvents.length;
    const activeCount = activeEvents.length;
    const completedCount = totalEvents - activeCount;

    if (activeCount === totalEvents) return { status: 'all-active', color: '#10b981', label: 'All Active' };
    if (activeCount === 0) return { status: 'all-completed', color: '#ef4444', label: 'All Completed' };
    return { status: 'mixed', color: '#f59e0b', label: 'In Progress' };
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

  const filterEvents = (events, type) => {
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

  const filteredTimeline = filterEvents(timeline, 'timeline');
  const filteredMaintenance = filterEvents(maintenance, 'maintenance');

  const getAllEvents = () => {
    const allEvents = [
      ...timeline.map(item => ({
        ...item,
        type: 'timeline',
        status: getTimelineStatus(item),
        icon: getTimelineIcon(item.timeline_type),
      })),
      ...maintenance.map(item => ({
        ...item,
        type: 'maintenance',
        status: getMaintenanceStatus(item),
        icon: 'construct-outline',
        title: `Maintenance Extension (${item.months_added} months)`,
      })),
    ];

    // Sort by end date, most recent first
    return allEvents.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
  };

  const getTimelineIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('development') || lowerType.includes('build')) return 'code-working-outline';
    if (lowerType.includes('design') || lowerType.includes('ui')) return 'color-palette-outline';
    if (lowerType.includes('testing') || lowerType.includes('qa')) return 'checkmark-circle-outline';
    if (lowerType.includes('deploy') || lowerType.includes('launch')) return 'rocket-outline';
    if (lowerType.includes('support') || lowerType.includes('maintenance')) return 'construct-outline';
    return 'time-outline';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /* ===== RENDER FUNCTIONS ===== */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Service Timeline</Text>
          <Text style={styles.pageSubtitle}>Loading timeline...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading service history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allEvents = getAllEvents();
  const totalEvents = timeline.length + maintenance.length;
  const activeTimelineCount = timeline.filter(item => getTimelineStatus(item).status === 'active').length;
  const activeMaintenanceCount = maintenance.filter(item => getMaintenanceStatus(item).status === 'active').length;
  const overallStatus = getOverallServiceStatus();
  const currentActiveTimeline = getCurrentActiveTimeline();
  const currentActiveMaintenance = getCurrentActiveMaintenance();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Service Timeline</Text>
        <Text style={styles.pageSubtitle}>
          Complete service history and maintenance records
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
          {/* ===== SERVICE STATUS OVERVIEW ===== */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={[styles.overviewIcon, { backgroundColor: `${overallStatus.color}15` }]}>
                <Ionicons name="timer-outline" size={28} color={overallStatus.color} />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewTitle}>Service Status</Text>
                <Text style={[styles.overviewSubtitle, { color: overallStatus.color }]}>
                  {overallStatus.label}
                </Text>
              </View>
            </View>

            <View style={styles.overviewStats}>
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="time-outline" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.overviewStatValue}>{timeline.length}</Text>
                <Text style={styles.overviewStatLabel}>Timeline Events</Text>
              </View>
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="construct-outline" size={20} color="#10b981" />
                </View>
                <Text style={styles.overviewStatValue}>{maintenance.length}</Text>
                <Text style={styles.overviewStatLabel}>Maintenance</Text>
              </View>
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.overviewStatValue}>{activeTimelineCount + activeMaintenanceCount}</Text>
                <Text style={styles.overviewStatLabel}>Active</Text>
              </View>
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.overviewStatValue}>{totalEvents}</Text>
                <Text style={styles.overviewStatLabel}>Total Events</Text>
              </View>
            </View>

            {/* ===== CURRENT ACTIVE STATUS ===== */}
            {currentActiveTimeline && (
              <View style={styles.currentActiveCard}>
                <View style={styles.currentActiveHeader}>
                  <Ionicons name="flash-outline" size={20} color="#f59e0b" />
                  <Text style={styles.currentActiveTitle}>Current Active Timeline</Text>
                </View>
                <View style={styles.currentActiveContent}>
                  <Text style={styles.currentActiveText}>
                    {currentActiveTimeline.timeline_type}
                  </Text>
                  <View style={styles.currentActiveDates}>
                    <Text style={styles.currentActiveDate}>
                      {formatDetailedDate(currentActiveTimeline.start_date)} - {formatDetailedDate(currentActiveTimeline.end_date)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {currentActiveMaintenance && (
              <View style={[styles.currentActiveCard, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <View style={styles.currentActiveHeader}>
                  <Ionicons name="construct-outline" size={20} color="#10b981" />
                  <Text style={styles.currentActiveTitle}>Active Maintenance</Text>
                </View>
                <View style={styles.currentActiveContent}>
                  <Text style={styles.currentActiveText}>
                    Extended by {currentActiveMaintenance.months_added} months
                  </Text>
                  <View style={styles.currentActiveDates}>
                    <Text style={styles.currentActiveDate}>
                      Valid until {formatDetailedDate(currentActiveMaintenance.end_date)}
                    </Text>
                  </View>
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
              count={totalEvents}
            />
            <FilterButton 
              label="Active" 
              active={activeFilter === 'active'} 
              onPress={() => setActiveFilter('active')}
              count={activeTimelineCount + activeMaintenanceCount}
            />
            <FilterButton 
              label="Completed" 
              active={activeFilter === 'completed'} 
              onPress={() => setActiveFilter('completed')}
              count={totalEvents - (activeTimelineCount + activeMaintenanceCount)}
            />
          </View>

          {/* ===== TIMELINE SECTION ===== */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="time-outline" size={24} color="#3b82f6" />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Timeline Events</Text>
                <Text style={styles.sectionSubtitle}>
                  Development phases and milestones
                </Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {filteredTimeline.length} of {timeline.length}
                </Text>
              </View>
            </View>

            {filteredTimeline.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="time-outline" size={48} color="#475569" />
                <Text style={styles.emptySectionTitle}>
                  {activeFilter === 'all' ? 'No Timeline Events' : 
                   activeFilter === 'active' ? 'No Active Timeline' : 
                   'No Completed Timeline'}
                </Text>
                <Text style={styles.emptySectionText}>
                  {activeFilter === 'all' ? 
                    'Timeline events will appear here as service progresses' :
                    activeFilter === 'active' ?
                    'No active timeline events found' :
                    'No completed timeline events found'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {filteredTimeline.map((item, index) => (
                  <TimelineCard
                    key={`timeline-${item.id}`}
                    item={item}
                    index={index}
                    isLast={index === filteredTimeline.length - 1}
                    status={getTimelineStatus(item)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ===== MAINTENANCE SECTION ===== */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="construct-outline" size={24} color="#10b981" />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Maintenance History</Text>
                <Text style={styles.sectionSubtitle}>
                  Service extensions and support periods
                </Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {filteredMaintenance.length} of {maintenance.length}
                </Text>
              </View>
            </View>

            {filteredMaintenance.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="construct-outline" size={48} color="#475569" />
                <Text style={styles.emptySectionTitle}>
                  {activeFilter === 'all' ? 'No Maintenance Records' : 
                   activeFilter === 'active' ? 'No Active Maintenance' : 
                   'No Expired Maintenance'}
                </Text>
                <Text style={styles.emptySectionText}>
                  {activeFilter === 'all' ? 
                    'Maintenance records will appear here when service is extended' :
                    activeFilter === 'active' ?
                    'No active maintenance records found' :
                    'No expired maintenance records found'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.maintenanceList}>
                {filteredMaintenance.map((item, index) => (
                  <MaintenanceCard
                    key={`maintenance-${item.id}`}
                    item={item}
                    index={index}
                    isLast={index === filteredMaintenance.length - 1}
                    status={getMaintenanceStatus(item)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ===== ALL EVENTS TIMELINE ===== */}
          {allEvents.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="list-outline" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionTitle}>All Events Timeline</Text>
                  <Text style={styles.sectionSubtitle}>
                    Chronological view of all service events
                  </Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {allEvents.length} events
                  </Text>
                </View>
              </View>

              <View style={styles.combinedTimeline}>
                {allEvents.map((event, index) => (
                  <EventCard
                    key={`${event.type}-${event.id}`}
                    event={event}
                    index={index}
                    isLast={index === allEvents.length - 1}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ===== TIMELINE INFO CARD ===== */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About Service Timeline</Text>
              <Text style={styles.infoText}>
                Track all service events, milestones, and maintenance records. 
                Active events are shown in blue, completed in green, and expired maintenance in red.
              </Text>
            </View>
          </View>
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

const TimelineCard = ({ item, index, isLast, status }) => {
  const duration = getDuration(item.start_date, item.end_date);
  const progress = getProgressPercentage(item.start_date, item.end_date);
  
  return (
    <View style={[styles.timelineCard, isLast && styles.timelineCardLast]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${status.color}15` }]}>
          <Ionicons 
            name={getTimelineIcon(item.timeline_type)} 
            size={20} 
            color={status.color} 
          />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.timeline_type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <Ionicons name="play-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateLabel}>Start</Text>
          <Text style={styles.dateValue}>
            {formatDetailedDate(item.start_date)}
          </Text>
        </View>
        <View style={styles.dateArrow}>
          <Ionicons name="arrow-forward" size={16} color="#64748b" />
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="flag-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateLabel}>End</Text>
          <Text style={styles.dateValue}>
            {formatDetailedDate(item.end_date)}
          </Text>
        </View>
      </View>

      {(status.status === 'active' || status.status === 'upcoming') && (
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{duration} duration</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: status.color
                }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const MaintenanceCard = ({ item, index, isLast, status }) => {
  return (
    <View style={[styles.maintenanceCard, isLast && styles.maintenanceCardLast]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${status.color}15` }]}>
          <Ionicons name="construct-outline" size={20} color={status.color} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Maintenance Extension</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateLabel}>Extended From</Text>
          <Text style={styles.dateValue}>
            {formatDetailedDate(item.start_date)}
          </Text>
        </View>
        <View style={styles.dateArrow}>
          <Ionicons name="arrow-forward" size={16} color="#64748b" />
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateLabel}>Extended To</Text>
          <Text style={styles.dateValue}>
            {formatDetailedDate(item.end_date)}
          </Text>
        </View>
      </View>

      <View style={styles.extensionInfo}>
        <View style={styles.extensionItem}>
          <Ionicons name="time-outline" size={14} color="#10b981" />
          <Text style={styles.extensionLabel}>Extension Period</Text>
          <Text style={styles.extensionValue}>{item.months_added} months</Text>
        </View>
        <View style={styles.extensionItem}>
          <Ionicons name="card-outline" size={14} color="#8b5cf6" />
          <Text style={styles.extensionLabel}>Amount Paid</Text>
          <Text style={styles.extensionValue}>
            {item.amount_paid ? formatCurrency(item.amount_paid) : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const EventCard = ({ event, index, isLast }) => {
  const isTimeline = event.type === 'timeline';
  const iconName = isTimeline ? getTimelineIcon(event.timeline_type) : 'construct-outline';
  
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventTimeline}>
        <View style={[styles.eventDot, { backgroundColor: event.status.color }]} />
        {!isLast && <View style={styles.eventConnector} />}
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: `${event.status.color}15` }]}>
            <Ionicons name={iconName} size={16} color={event.status.color} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>
              {isTimeline ? event.timeline_type : `Maintenance (${event.months_added} months)`}
            </Text>
            <Text style={styles.eventSubtitle}>
              {event.type === 'timeline' ? 'Timeline Event' : 'Maintenance'}
            </Text>
          </View>
          <View style={[styles.eventStatus, { backgroundColor: `${event.status.color}15` }]}>
            <Text style={[styles.eventStatusText, { color: event.status.color }]}>
              {event.status.label}
            </Text>
          </View>
        </View>
        <View style={styles.eventDates}>
          <Text style={styles.eventDatesText}>
            {formatDetailedDate(event.start_date)} - {formatDetailedDate(event.end_date)}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* ===== HELPER FUNCTIONS ===== */

const getTimelineIcon = (type) => {
  const lowerType = type?.toLowerCase() || '';
  if (lowerType.includes('development') || lowerType.includes('build')) return 'code-working-outline';
  if (lowerType.includes('design') || lowerType.includes('ui')) return 'color-palette-outline';
  if (lowerType.includes('testing') || lowerType.includes('qa')) return 'checkmark-circle-outline';
  if (lowerType.includes('deploy') || lowerType.includes('launch')) return 'rocket-outline';
  if (lowerType.includes('support') || lowerType.includes('maintenance')) return 'construct-outline';
  return 'time-outline';
};

const formatDetailedDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
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
  // Overview Card
  overviewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  overviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  overviewContent: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  overviewSubtitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  overviewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  overviewStatItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  overviewStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
  currentActiveCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 12,
  },
  currentActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentActiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 8,
  },
  currentActiveContent: {
    paddingLeft: 28,
  },
  currentActiveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  currentActiveDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentActiveDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Filter Buttons
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
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
  // Section Card
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySectionText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  timelineList: {
    gap: 12,
  },
  maintenanceList: {
    gap: 12,
  },
  // Timeline Card
  timelineCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timelineCardLast: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
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
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  dateArrow: {
    paddingHorizontal: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Maintenance Card
  maintenanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  maintenanceCardLast: {
    marginBottom: 0,
  },
  extensionInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  extensionItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  extensionLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '500',
  },
  extensionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  // Combined Timeline
  combinedTimeline: {
    gap: 8,
  },
  eventCard: {
    flexDirection: 'row',
  },
  eventTimeline: {
    alignItems: 'center',
    marginRight: 16,
    width: 24,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventConnector: {
    width: 2,
    height: '100%',
    backgroundColor: '#334155',
    marginTop: 4,
    marginBottom: 4,
  },
  eventContent: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  eventStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventDates: {
    paddingLeft: 44,
  },
  eventDatesText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
    alignItems: 'center',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});