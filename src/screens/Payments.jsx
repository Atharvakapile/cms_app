import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Payments({ route, navigation }) {
  const { serviceId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'pending'

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      /* ===== PAYMENT SUMMARY ===== */
      const summaryRes = await api.get(
        `/payments/summary/${serviceId}`
      );

      const summaryData = summaryRes.data?.data || {};

      setSummary({
        total: Number(summaryData.total_amount || 0),
        paid: Number(summaryData.paid_amount || 0),
        remaining: Number(summaryData.remaining_amount || 0),
        status: summaryData.status || 'pending',
        lastPayment: summaryData.last_payment_date,
      });

      /* ===== INSTALLMENTS ===== */
      const installmentsRes = await api.get(
        `/payments/installments/${serviceId}`
      );

      const rows = Array.isArray(installmentsRes.data?.data)
        ? installmentsRes.data.data
        : [];

      // Latest first
      const sorted = rows.sort(
        (a, b) => new Date(b.paid_at) - new Date(a.paid_at)
      );

      setInstallments(sorted);
      
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
        'Payments fetch error:',
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const filteredInstallments = installments.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'paid') return item.status === 'completed' || item.paid_at;
    if (filter === 'pending') return item.status === 'pending' || !item.paid_at;
    return true;
  });

  const progressPercentage = summary ? ((summary.paid / summary.total) * 100) || 0 : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Payments</Text>
          <Text style={styles.pageSubtitle}>Loading payment details...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Payments</Text>
        <Text style={styles.pageSubtitle}>
          Payment summary and installments
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
          {/* ===== PAYMENT OVERVIEW CARD ===== */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewIcon}>
                <Ionicons name="cash-outline" size={28} color="#10b981" />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewTitle}>Payment Overview</Text>
                <Text style={styles.overviewSubtitle}>
                  {summary?.status === 'completed' ? 'Fully Paid' : 'Payment In Progress'}
                </Text>
              </View>
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

            {summary && (
              <View style={styles.summaryGrid}>
                <StatItem 
                  label="Total Amount" 
                  value={formatCurrency(summary.total)}
                  icon="wallet-outline"
                  color="#3b82f6"
                />
                <StatItem 
                  label="Amount Paid" 
                  value={formatCurrency(summary.paid)}
                  icon="checkmark-circle"
                  color="#10b981"
                />
                <StatItem 
                  label="Balance Due" 
                  value={formatCurrency(summary.remaining)}
                  icon="alert-circle"
                  color={summary.remaining > 0 ? '#ef4444' : '#10b981'}
                />
                <StatItem 
                  label="Status" 
                  value={summary.status === 'completed' ? 'Paid' : 'Pending'}
                  icon="time-outline"
                  color={summary.status === 'completed' ? '#10b981' : '#f59e0b'}
                />
              </View>
            )}
          </View>

          {/* ===== PAYMENT STATS CARD ===== */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                <Text style={styles.statLabel}>Total Payments</Text>
                <Text style={styles.statValue}>{installments.length}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>
                  {installments.filter(item => item.status === 'completed' || item.paid_at).length}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#f59e0b" />
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>
                  {installments.filter(item => item.status === 'pending' || !item.paid_at).length}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== FILTER BUTTONS ===== */}
          <View style={styles.filterContainer}>
            <FilterButton 
              label="All Payments" 
              active={filter === 'all'} 
              onPress={() => setFilter('all')}
              count={installments.length}
            />
            <FilterButton 
              label="Paid" 
              active={filter === 'paid'} 
              onPress={() => setFilter('paid')}
              count={installments.filter(item => item.status === 'completed' || item.paid_at).length}
            />
            <FilterButton 
              label="Pending" 
              active={filter === 'pending'} 
              onPress={() => setFilter('pending')}
              count={installments.filter(item => item.status === 'pending' || !item.paid_at).length}
            />
          </View>

          {/* ===== INSTALLMENTS LIST ===== */}
          <View style={styles.installmentsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Payment Installments</Text>
              <Text style={styles.installmentsCount}>
                {filteredInstallments.length} of {installments.length}
              </Text>
            </View>

            {filteredInstallments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#475569" />
                <Text style={styles.emptyTitle}>
                  {filter === 'all' ? 'No Payments Yet' : 
                   filter === 'paid' ? 'No Paid Installments' : 
                   'No Pending Installments'}
                </Text>
                <Text style={styles.emptyText}>
                  {filter === 'all' ? 
                    'Payment installments will appear here' :
                    filter === 'paid' ?
                    'No completed payments found' :
                    'No pending payments found'
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredInstallments}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <InstallmentItem 
                    item={item} 
                    index={index}
                    isLast={index === filteredInstallments.length - 1}
                  />
                )}
              />
            )}
          </View>

          {/* ===== PAYMENT INFO CARD ===== */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Payment Information</Text>
              <Text style={styles.infoText}>
                View all payment installments and track your payment progress. 
                Completed payments are marked with a green checkmark.
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
              <Text style={styles.helpTitle}>Need Help with Payments?</Text>
              <Text style={styles.helpText}>
                Contact our support team for payment-related queries
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

const StatItem = ({ label, value, icon, color }) => (
  <View style={styles.statGridItem}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statGridLabel}>{label}</Text>
    <Text style={[styles.statGridValue, { color }]}>{value}</Text>
  </View>
);

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

const InstallmentItem = ({ item, index, isLast }) => {
  const isPaid = item.status === 'completed' || item.paid_at;
  const date = isPaid 
    ? new Date(item.paid_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(item.due_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const getStatusText = () => {
    if (isPaid) return 'Paid';
    if (new Date(item.due_date) < new Date()) return 'Overdue';
    return 'Pending';
  };

  const getStatusColor = () => {
    if (isPaid) return '#10b981';
    if (new Date(item.due_date) < new Date()) return '#ef4444';
    return '#f59e0b';
  };

  return (
    <View style={[styles.installmentItem, isLast && styles.installmentItemLast]}>
      <View style={styles.installmentLeft}>
        <View style={[
          styles.installmentIcon,
          { backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
        ]}>
          <Ionicons 
            name={isPaid ? "checkmark-circle" : "time-outline"} 
            size={20} 
            color={isPaid ? '#10b981' : '#f59e0b'} 
          />
        </View>
        <View style={styles.installmentInfo}>
          <Text style={styles.installmentAmount}>₹ {item.amount_paid || item.amount}</Text>
          <View style={styles.installmentMeta}>
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text style={styles.installmentDate}>{date}</Text>
            {item.reference_id && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.installmentRef}>Ref: {item.reference_id}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.installmentRight}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        {isPaid && (
          <Ionicons name="receipt-outline" size={18} color="#64748b" />
        )}
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    color: '#94a3b8',
    fontWeight: '500',
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statGridItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statGridLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  statGridValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
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
  installmentsCard: {
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
    flex: 1,
    letterSpacing: -0.3,
  },
  installmentsCount: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  installmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  installmentItemLast: {
    borderBottomWidth: 0,
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  installmentInfo: {
    flex: 1,
  },
  installmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  installmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  installmentDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  metaSeparator: {
    color: '#64748b',
    marginHorizontal: 8,
  },
  installmentRef: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  installmentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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