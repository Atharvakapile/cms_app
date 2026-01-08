import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ServiceDetails({ route, navigation }) {
  const { serviceId } = route.params;

  const [service, setService] = useState(null);
  const [webDetails, setWebDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSummary, setPaymentSummary] = useState({
    paid: 0,
    total: 0,
  });
  const [timelineHistory, setTimelineHistory] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* ================= FETCH SERVICE ================= */

  useEffect(() => {
    fetchServiceDetails();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      const res = await api.get(`/client/services/${serviceId}`);
      const payload = res.data?.data;

      if (payload?.service) {
        setService(payload.service);
        setWebDetails(payload.webDetails || null);
      } else {
        setService(null);
        setWebDetails(null);
      }
    } catch (err) {
      console.log(
        'Service details error:',
        err.response?.data || err.message
      );
      setService(null);
      setWebDetails(null);
    } finally {
      setLoading(false);
      
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
      ]).start();
    }
  };

  /* ================= FETCH PAYMENT SUMMARY AND TIMELINE ================= */

  useEffect(() => {
    if (service) {
      fetchPaymentSummary();
      fetchTimelineHistory();
    }
  }, [service]);

  const fetchPaymentSummary = async () => {
    try {
      const res = await api.get(`/payments/summary/${serviceId}`);

      setPaymentSummary({
        paid: Number(res.data.data?.paid_amount || 0),
        total: Number(res.data.data?.total_amount || 0),
      });
    } catch (err) {
      console.log(
        'Payment summary error:',
        err.response?.data || err.message
      );
    }
  };

  const fetchTimelineHistory = async () => {
    try {
      const res = await api.get(`/service-history/${serviceId}`);
      const timelineData = res.data?.data?.timeline || [];
      setTimelineHistory(timelineData);
    } catch (err) {
      console.log(
        'Timeline history error:',
        err.response?.data || err.message
      );
    }
  };

  /* ================= CALCULATIONS ================= */

  const getCurrentActiveServicePeriod = () => {
    if (!service) {
      // Return default values if service is null
      const today = new Date();
      return {
        startDate: today,
        endDate: today,
        isExtended: false,
        timelineType: 'No Service Data'
      };
    }

    const hasValidDates = service.start_date && service.end_date;
    const today = new Date();

    if (!timelineHistory.length) {
      // If no timeline history, use original service dates with null checks
      if (hasValidDates) {
        return {
          startDate: new Date(service.start_date),
          endDate: new Date(service.end_date),
          isExtended: false
        };
      } else {
        // Fallback to current date if no valid dates
        return {
          startDate: today,
          endDate: today,
          isExtended: false
        };
      }
    }

    // Find the active timeline event (current date is between start and end)
    const activeTimeline = timelineHistory.find(event => {
      if (!event.start_date || !event.end_date) return false;
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return today >= startDate && today <= endDate;
    });

    if (activeTimeline) {
      // If there's an active timeline event, use its dates
      return {
        startDate: new Date(activeTimeline.start_date),
        endDate: new Date(activeTimeline.end_date),
        isExtended: true,
        timelineType: activeTimeline.timeline_type || 'Extended Period'
      };
    }

    // If no active timeline, find the most recent completed timeline
    const completedTimelines = timelineHistory
      .filter(event => {
        if (!event.end_date) return false;
        return new Date(event.end_date) < today;
      })
      .sort((a, b) => {
        if (!a.end_date || !b.end_date) return 0;
        return new Date(b.end_date) - new Date(a.end_date);
      });

    if (completedTimelines.length > 0) {
      // Use the most recent completed timeline
      const latestTimeline = completedTimelines[0];
      return {
        startDate: new Date(latestTimeline.start_date || service.start_date || today),
        endDate: new Date(latestTimeline.end_date || service.end_date || today),
        isExtended: true,
        timelineType: latestTimeline.timeline_type || 'Completed Period',
        isCompleted: true
      };
    }

    // Fallback to original service dates with null checks
    if (hasValidDates) {
      return {
        startDate: new Date(service.start_date),
        endDate: new Date(service.end_date),
        isExtended: false
      };
    }

    // Ultimate fallback
    return {
      startDate: today,
      endDate: today,
      isExtended: false
    };
  };

  const calculateServiceStatus = () => {
    if (!service) return { status: 'unknown', color: '#94a3b8', label: 'Unknown' };

    const currentPeriod = getCurrentActiveServicePeriod();
    const today = new Date();
    const effectiveEndDate = currentPeriod.endDate;
    
    if (today > effectiveEndDate) {
      return { status: 'expired', color: '#ef4444', label: 'Expired' };
    } else {
      const daysRemaining = Math.floor((effectiveEndDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 7) {
        return { status: 'expiring-soon', color: '#f59e0b', label: `Expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` };
      } else if (daysRemaining < 0) {
        return { status: 'expired', color: '#ef4444', label: 'Expired' };
      } else {
        return { status: 'active', color: '#10b981', label: 'Active' };
      }
    }
  };

  const getDomainStatus = () => {
    if (!webDetails?.domain_valid_till) {
      return { status: 'unknown', color: '#94a3b8', label: 'Not specified' };
    }

    try {
      const domainValidTill = new Date(webDetails.domain_valid_till);
      const today = new Date();
      
      if (today > domainValidTill || isNaN(domainValidTill.getTime())) {
        return { status: 'expired', color: '#ef4444', label: 'Expired' };
      } else {
        const daysRemaining = Math.floor((domainValidTill - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 30) {
          return { status: 'expiring-soon', color: '#f59e0b', label: `Expiring in ${daysRemaining} days` };
        } else {
          return { status: 'active', color: '#10b981', label: 'Active' };
        }
      }
    } catch (error) {
      console.log('Error parsing domain date:', error);
      return { status: 'unknown', color: '#94a3b8', label: 'Invalid date' };
    }
  };

  const serviceStatus = calculateServiceStatus();
  const currentPeriod = getCurrentActiveServicePeriod();
  const domainStatus = getDomainStatus();
  const isServiceActive = serviceStatus.status !== 'expired';
  
  const daysRemaining = isServiceActive && currentPeriod.endDate 
    ? Math.floor((currentPeriod.endDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const progressPercentage = paymentSummary.total > 0 
    ? ((paymentSummary.paid / paymentSummary.total) * 100) 
    : 0;
  const balance = paymentSummary.total - paymentSummary.paid;

  const getServiceIcon = (serviceType) => {
    if (!serviceType) return 'cube-outline';
    const type = serviceType.toLowerCase();
    if (type.includes('web') || type.includes('site')) return 'globe-outline';
    if (type.includes('app') || type.includes('mobile')) return 'phone-portrait-outline';
    if (type.includes('marketing') || type.includes('seo')) return 'megaphone-outline';
    if (type.includes('design') || type.includes('ui')) return 'color-palette-outline';
    if (type.includes('cms') || type.includes('portal')) return 'server-outline';
    return 'cube-outline';
  };

  /* ================= LOADING / ERROR ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Service Details</Text>
          <Text style={styles.pageSubtitle}>Loading...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Service Details</Text>
          <Text style={styles.pageSubtitle}>Service not found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Service Not Found</Text>
          <Text style={styles.errorText}>
            The requested service could not be loaded.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Service Details</Text>
        <Text style={styles.pageSubtitle}>Complete service overview</Text>
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
          {/* ===== SERVICE HEADER CARD ===== */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <View style={[
                styles.serviceIcon,
                { backgroundColor: `${serviceStatus.color}15` }
              ]}>
                <Ionicons 
                  name={getServiceIcon(service.service_type)} 
                  size={28} 
                  color={serviceStatus.color} 
                />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.serviceTitle}>
                  {service.project_name || service.service_type || 'Unnamed Service'}
                </Text>
                <Text style={styles.serviceType}>
                  {service.service_type || 'General Service'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { borderColor: `${serviceStatus.color}30` }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: serviceStatus.color }
                ]} />
                <Text style={styles.statusText}>
                  {serviceStatus.label}
                </Text>
              </View>
            </View>

            {currentPeriod.isExtended && (
              <View style={styles.extensionNotice}>
                <Ionicons name="time-outline" size={16} color="#3b82f6" />
                <Text style={styles.extensionNoticeText}>
                  {currentPeriod.timelineType || 'Extended Service Period'}
                </Text>
              </View>
            )}

            <View style={styles.timeline}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                <Text style={styles.dateLabel}>Current Start</Text>
                <Text style={styles.dateValue}>
                  {currentPeriod.startDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>→</Text>
              </View>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                <Text style={styles.dateLabel}>Valid Until</Text>
                <Text style={styles.dateValue}>
                  {currentPeriod.endDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {service.start_date && service.end_date && (
              <View style={styles.originalDates}>
                <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                <Text style={styles.originalDatesText}>
                  Original: {new Date(service.start_date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })} - {new Date(service.end_date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
            )}

            {isServiceActive && daysRemaining > 0 && daysRemaining <= 30 && (
              <View style={[
                styles.daysRemaining,
                { 
                  backgroundColor: daysRemaining <= 7 
                    ? 'rgba(245, 158, 11, 0.1)' 
                    : 'rgba(59, 130, 246, 0.1)',
                  borderColor: daysRemaining <= 7 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(59, 130, 246, 0.2)'
                }
              ]}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={daysRemaining <= 7 ? '#f59e0b' : '#3b82f6'} 
                />
                <Text style={[
                  styles.daysText,
                  { color: daysRemaining <= 7 ? '#f59e0b' : '#3b82f6' }
                ]}>
                  {daysRemaining === 0 
                    ? 'Expires today' 
                    : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                  }
                </Text>
              </View>
            )}
          </View>

          {/* ===== PAYMENT SUMMARY CARD ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Payment Summary</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Payment Progress</Text>
                <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progressPercentage, 100)}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.paymentGrid}>
              <PaymentItem 
                label="Total Amount" 
                value={`₹ ${paymentSummary.total.toLocaleString()}`}
                icon="wallet-outline"
                color="#3b82f6"
              />
              <PaymentItem 
                label="Amount Paid" 
                value={`₹ ${paymentSummary.paid.toLocaleString()}`}
                icon="checkmark-circle-outline"
                color="#10b981"
              />
              <PaymentItem 
                label="Balance Due" 
                value={`₹ ${balance.toLocaleString()}`}
                icon="alert-circle-outline"
                color={balance > 0 ? '#ef4444' : '#10b981'}
              />
              <PaymentItem 
                label="Payment Status" 
                value={balance === 0 ? 'Paid in Full' : 'Pending'}
                icon="card-outline"
                color={balance === 0 ? '#10b981' : '#f59e0b'}
              />
            </View>

            <TouchableOpacity
              style={styles.viewPaymentsButton}
              onPress={() =>
                navigation.navigate('Services', {
                  screen: 'Payments',
                  params: { serviceId },
                })
              }
            >
              <Text style={styles.viewPaymentsText}>View All Payments</Text>
              <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* ===== QUICK ACTIONS GRID ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Quick Actions</Text>
            </View>

            <View style={styles.actionsGrid}>
              <ActionCard
                icon="time-outline"
                label="Timeline"
                description="View service history"
                onPress={() =>
                  navigation.navigate('Services', {
                    screen: 'ServiceTimeline',
                    params: { serviceId },
                  })
                }
              />

              <ActionCard
                icon="folder-outline"
                label="Files"
                description="Access all files"
                onPress={() =>
                  navigation.navigate('Services', {
                    screen: 'ServiceFiles',
                    params: { serviceId },
                  })
                }
              />

              <ActionCard
                icon="document-text-outline"
                label="Notes"
                description="View service notes"
                onPress={() =>
                  navigation.navigate('Services', {
                    screen: 'ServiceNotes',
                    params: { serviceId },
                  })
                }
              />

              <ActionCard
                icon="chatbubble-outline"
                label="Support"
                description="Get assistance"
                onPress={() =>
                  navigation.navigate('Contact')
                }
              />
            </View>
          </View>

          {/* ===== WEBSITE DETAILS CARD ===== */}
          {webDetails && (
            <View style={styles.detailCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="globe-outline" size={24} color="#3b82f6" />
                <Text style={styles.cardTitle}>Website Details</Text>
              </View>

              <View style={styles.webDetailsGrid}>
                <DetailItem 
                  label="Website Type" 
                  value={webDetails.website_type || 'Not specified'}
                  icon="browsers-outline"
                />
                <DetailItem 
                  label="Domain Status" 
                  value={domainStatus.label}
                  icon="earth-outline"
                  status={domainStatus.status}
                />
                {webDetails.domain_valid_till && (
                  <DetailItem 
                    label="Domain Valid Till" 
                    value={new Date(webDetails.domain_valid_till).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    icon="calendar-outline"
                  />
                )}
                {webDetails.domain_purchased !== undefined && (
                  <DetailItem 
                    label="Domain Purchased" 
                    value={webDetails.domain_purchased ? 'Yes' : 'No'}
                    icon="checkmark-circle-outline"
                    status={webDetails.domain_purchased ? 'success' : 'warning'}
                  />
                )}
              </View>
            </View>
          )}

          {/* ===== SERVICE INFO CARD ===== */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Service Information</Text>
              <Text style={styles.infoText}>
                Shows current active service period. Original and historical dates are available in the timeline.
              </Text>
            </View>
          </View>

          {/* ===== NEED HELP CARD ===== */}
          <TouchableOpacity 
            style={styles.helpCard}
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={styles.helpIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#3b82f6" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Service Support?</Text>
              <Text style={styles.helpText}>
                Contact our support team for any service-related queries
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

const PaymentItem = ({ label, value, icon, color }) => (
  <View style={styles.paymentItem}>
    <View style={[styles.paymentIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={[styles.paymentValue, { color }]}>{value}</Text>
  </View>
);

const ActionCard = ({ icon, label, description, onPress }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View style={styles.actionIcon}>
      <Ionicons name={icon} size={22} color="#3b82f6" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
  </TouchableOpacity>
);

const DetailItem = ({ label, value, icon, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      case 'expiring-soon': return '#f59e0b';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#f8fafc';
    }
  };

  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#94a3b8" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color: getStatusColor() }]}>
          {value}
        </Text>
      </View>
    </View>
  );
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
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  headerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  headerInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  serviceType: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  extensionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  extensionNoticeText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  dateSeparator: {
    paddingHorizontal: 12,
  },
  dateSeparatorText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  originalDates: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  originalDatesText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 6,
  },
  daysRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  progressContainer: {
    marginBottom: 24,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  paymentItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewPaymentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  viewPaymentsText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  webDetailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});