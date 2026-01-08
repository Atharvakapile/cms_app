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
          {/* ===== SIMPLIFIED PAYMENT SUMMARY ===== */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons name="cash-outline" size={24} color="#10b981" />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <Text style={styles.summaryStatus}>
                  {summary?.status === 'completed' ? 'Fully Paid' : 'Payment In Progress'}
                </Text>
              </View>
            </View>

            {/* Simplified Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
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

            {/* Simplified Amounts */}
            <View style={styles.amountsRow}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amountValue}>{formatCurrency(summary?.total || 0)}</Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Paid</Text>
                <Text style={[styles.amountValue, { color: '#10b981' }]}>
                  {formatCurrency(summary?.paid || 0)}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Due</Text>
                <Text style={[styles.amountValue, { color: summary?.remaining > 0 ? '#ef4444' : '#10b981' }]}>
                  {formatCurrency(summary?.remaining || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== SIMPLIFIED STATS ===== */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatBox 
                icon="list-outline"
                label="Total"
                value={installments.length}
                color="#3b82f6"
              />
              <StatBox 
                icon="checkmark-circle"
                label="Paid"
                value={installments.filter(item => item.status === 'completed' || item.paid_at).length}
                color="#10b981"
              />
              <StatBox 
                icon="time-outline"
                label="Pending"
                value={installments.filter(item => item.status === 'pending' || !item.paid_at).length}
                color="#f59e0b"
              />
            </View>
          </View>

          {/* ===== SIMPLIFIED FILTERS ===== */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, filter === 'paid' && styles.filterBtnActive]}
                onPress={() => setFilter('paid')}
              >
                <View style={styles.filterBtnContent}>
                  <Ionicons name="checkmark-circle" size={16} color={filter === 'paid' ? '#10b981' : '#94a3b8'} />
                  <Text style={[styles.filterBtnText, filter === 'paid' && styles.filterBtnTextActive]}>
                    Paid
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, filter === 'pending' && styles.filterBtnActive]}
                onPress={() => setFilter('pending')}
              >
                <View style={styles.filterBtnContent}>
                  <Ionicons name="time-outline" size={16} color={filter === 'pending' ? '#f59e0b' : '#94a3b8'} />
                  <Text style={[styles.filterBtnText, filter === 'pending' && styles.filterBtnTextActive]}>
                    Pending
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== SIMPLIFIED INSTALLMENTS LIST ===== */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Ionicons name="receipt-outline" size={20} color="#3b82f6" />
              <Text style={styles.listTitle}>Payment Installments</Text>
              <Text style={styles.listCount}>
                {filteredInstallments.length}
              </Text>
            </View>

            {filteredInstallments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>
                  {filter === 'all' ? 'No Payments Yet' : 
                   filter === 'paid' ? 'No Paid Installments' : 
                   'No Pending Installments'}
                </Text>
                <Text style={styles.emptyText}>
                  Payment installments will appear here once added.
                </Text>
              </View>
            ) : (
              <View style={styles.installmentsList}>
                {filteredInstallments.map((item, index) => (
                  <InstallmentCard 
                    key={item.id}
                    item={item}
                    isLast={index === filteredInstallments.length - 1}
                  />
                ))}
              </View>
            )}
          </View>

         
          
          {/* ===== BOTTOM SPACING ===== */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const StatBox = ({ icon, label, value, color }) => (
  <View style={styles.statBox}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InstallmentCard = ({ item, isLast }) => {
  const isPaid = item.status === 'completed' || item.paid_at;
  const date = isPaid 
    ? new Date(item.paid_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : new Date(item.due_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });

  const getStatus = () => {
    if (isPaid) return { text: 'Paid', color: '#10b981' };
    if (new Date(item.due_date) < new Date()) return { text: 'Overdue', color: '#ef4444' };
    return { text: 'Pending', color: '#f59e0b' };
  };

  const status = getStatus();

  return (
    <View style={[styles.installmentCard, !isLast && styles.installmentBorder]}>
      <View style={styles.installmentLeft}>
        <View style={[
          styles.installmentIcon,
          { backgroundColor: `${status.color}15` }
        ]}>
          <Ionicons 
            name={isPaid ? "checkmark-circle" : "time-outline"} 
            size={20} 
            color={status.color} 
          />
        </View>
        <View style={styles.installmentDetails}>
          <Text style={styles.installmentAmount}>₹ {item.amount_paid || item.amount}</Text>
          <View style={styles.installmentMeta}>
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text style={styles.installmentDate}>{date}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.statusTag, { backgroundColor: `${status.color}15` }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
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
    paddingBottom: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  summaryStatus: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  
  // Stats Card
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
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Filter Section
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0f172a',
  },
  filterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterBtnTextActive: {
    color: '#f8fafc',
  },
  
  // List Card
  listCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 12,
    flex: 1,
  },
  listCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  installmentsList: {
    gap: 12,
  },
  installmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  installmentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
  installmentDetails: {
    flex: 1,
  },
  installmentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  installmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installmentDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  
  // Bottom Spacing
  bottomSpacing: {
    height: 80,
  },
});