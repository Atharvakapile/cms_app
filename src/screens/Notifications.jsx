import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

const { width } = Dimensions.get('window');
const FILE_BASE_URL = 'https://api.imperiummmm.in';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState(new Set()); // Track read notifications
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* ---------------- FETCH ---------------- */
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/client');
      setNotifications(res.data?.data || []);
      
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
      console.error(
        '❌ FETCH NOTIFICATIONS ERROR:',
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Add to local read set
      setReadIds(prev => new Set(prev).add(notificationId));
      
      // Optional: Send API call to mark as read on server
      // await api.post(`/notifications/${notificationId}/read`);
      
      // You can also filter out the read notification from the list
      // if you want to completely remove it:
      // setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(new Set(allIds));
  };

  // Function to check if notification is read
  const isNotificationRead = (notificationId) => {
    return readIds.has(notificationId);
  };

  // Function to get unread count
  const getUnreadCount = () => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  };

  // Function to get notification icon based on type
  const getNotificationIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('order') || lowerTitle.includes('purchase')) {
      return 'cart-outline';
    } else if (lowerTitle.includes('payment') || lowerTitle.includes('bill')) {
      return 'cash-outline';
    } else if (lowerTitle.includes('update') || lowerTitle.includes('news')) {
      return 'megaphone-outline';
    } else if (lowerTitle.includes('alert') || lowerTitle.includes('warning')) {
      return 'alert-circle-outline';
    } else if (lowerTitle.includes('success') || lowerTitle.includes('completed')) {
      return 'checkmark-circle-outline';
    }
    return 'notifications-outline';
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.pageSubtitle}>Stay updated with alerts</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- EMPTY ---------------- */
  if (!notifications.length) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.pageSubtitle}>Stay updated with alerts</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={64} color="#475569" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptyText}>
            You're all caught up! Check back later for updates.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={18} color="#3b82f6" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSubtitle}>
          {getUnreadCount()} new {getUnreadCount() === 1 ? 'alert' : 'alerts'}
        </Text>
        
        {/* Mark All as Read Button */}
        {getUnreadCount() > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#3b82f6" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isRead = isNotificationRead(item.id);
          
          return (
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  borderColor: isRead ? '#2d3748' : '#3b82f650',
                  backgroundColor: isRead ? '#1e293b' : 'rgba(59, 130, 246, 0.05)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: isRead ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)' }
                ]}>
                  <Ionicons 
                    name={getNotificationIcon(item.title)} 
                    size={20} 
                    color={isRead ? '#3b82f6' : '#3b82f6'} 
                  />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[
                    styles.title,
                    { color: isRead ? '#f8fafc' : '#f8fafc' }
                  ]}>
                    {item.title}
                  </Text>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                    <Text style={styles.timeText}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: isRead ? '#475569' : '#3b82f6',
                    opacity: isRead ? 0.5 : 1
                  }
                ]} />
              </View>

              <Text style={[
                styles.description,
                { color: isRead ? '#cbd5e1' : '#d1d5db' }
              ]}>
                {item.description}
              </Text>

              {item.image && (
                <Image
                  source={{
                    uri: `${FILE_BASE_URL}${item.image}`,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                  <Text style={styles.fullDate}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                
                {/* Mark as Read Button */}
                {!isRead && (
                  <TouchableOpacity 
                    style={styles.markReadButton}
                    onPress={() => markAsRead(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                    <Text style={styles.markReadText}>Mark as read</Text>
                  </TouchableOpacity>
                )}
                
                {/* Already Read Indicator */}
                {isRead && (
                  <View style={styles.readIndicator}>
                    <Ionicons name="checkmark-done" size={16} color="#10b981" />
                    <Text style={styles.readText}>Read</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getUnreadCount()}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {notifications.length - getUnreadCount()}
              </Text>
              <Text style={styles.statLabel}>Read</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.bottomSpacing} />
        }
      />
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
    position: 'relative',
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
    marginBottom: 8,
  },
  markAllButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  markAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    padding: 20,
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  markReadText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  readText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 80,
  },
});