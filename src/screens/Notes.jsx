import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Notes({ route }) {
  const { serviceId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get(
        `/notes/client/${serviceId}`
      );

      setNotes(res.data?.data || []);
      
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
        'Notes fetch error:',
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  // Group notes by date
  const groupNotesByDate = (notes) => {
    const groups = {};
    notes.forEach(note => {
      const date = new Date(note.created_at);
      const dateKey = date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(note);
    });
    return groups;
  };

  const noteGroups = groupNotesByDate(notes);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Service Notes</Text>
          <Text style={styles.pageSubtitle}>Loading notes...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading service notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Service Notes</Text>
        <Text style={styles.pageSubtitle}>
          {notes.length} note{notes.length !== 1 ? 's' : ''} recorded
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
          {/* ===== NOTES STATS ===== */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#3b82f615' }]}>
                <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{notes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#10b98115' }]}>
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>
                {Object.keys(noteGroups).length}
              </Text>
              <Text style={styles.statLabel}>Dates</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#8b5cf615' }]}>
                <Ionicons name="time-outline" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>
                {notes.length > 0 
                  ? new Date(notes[0].created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'
                }
              </Text>
              <Text style={styles.statLabel}>Latest</Text>
            </View>
          </View>

          {/* ===== NOTES LIST ===== */}
          {notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={64} color="#475569" />
              </View>
              <Text style={styles.emptyTitle}>No Notes Yet</Text>
              <Text style={styles.emptyText}>
                Service notes will appear here once added by the support team.
              </Text>
              <View style={styles.emptyTips}>
                <Text style={styles.tipsTitle}>What are service notes?</Text>
                <Text style={styles.tipsText}>
                  • Updates from support team{'\n'}
                  • Service progress reports{'\n'}
                  • Important communications
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.notesContainer}>
              {Object.entries(noteGroups).map(([date, dateNotes]) => (
                <View key={date} style={styles.dateSection}>
                  <View style={styles.dateHeader}>
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                    <Text style={styles.dateTitle}>{date}</Text>
                    <Text style={styles.dateCount}>{dateNotes.length} notes</Text>
                  </View>
                  
                  {dateNotes.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.noteCard,
                        {
                          opacity: fadeAnim,
                          transform: [{ translateY: slideAnim }],
                        },
                      ]}
                    >
                      <View style={styles.noteHeader}>
                        <View style={styles.noteIcon}>
                          <Ionicons 
                            name={getNoteIcon(item.note)} 
                            size={20} 
                            color="#3b82f6" 
                          />
                        </View>
                        <View style={styles.noteInfo}>
                          <Text style={styles.noteTitle}>
                            {getNoteType(item.note)}
                          </Text>
                          <View style={styles.noteMeta}>
                            <Ionicons name="time-outline" size={12} color="#94a3b8" />
                            <Text style={styles.noteTime}>
                              {new Date(item.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <Text style={styles.noteText}>
                        {item.note}
                      </Text>

                      <View style={styles.noteFooter}>
                        <View style={styles.footerLeft}>
                          <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
                          <Text style={styles.noteAuthor}>
                            {item.created_by || 'Support Team'}
                          </Text>
                        </View>
                        <View style={styles.footerBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                          <Text style={styles.footerBadgeText}>Added</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ===== NOTES INFO CARD ===== */}
          {notes.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle-outline" size={24} color="#f59e0b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>About Service Notes</Text>
                <Text style={styles.infoText}>
                  These notes are added by our support team to keep you updated 
                  about your service progress and important communications.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== HELPER FUNCTIONS ===== */

const getNoteIcon = (noteText) => {
  const text = noteText.toLowerCase();
  if (text.includes('update') || text.includes('progress')) return 'rocket-outline';
  if (text.includes('issue') || text.includes('problem')) return 'warning-outline';
  if (text.includes('complete') || text.includes('finished')) return 'checkmark-circle-outline';
  if (text.includes('payment') || text.includes('invoice')) return 'cash-outline';
  if (text.includes('meeting') || text.includes('call')) return 'chatbubble-outline';
  if (text.includes('file') || text.includes('document')) return 'folder-outline';
  return 'document-text-outline';
};

const getNoteType = (noteText) => {
  const text = noteText.toLowerCase();
  if (text.includes('update') || text.includes('progress')) return 'Service Update';
  if (text.includes('issue') || text.includes('problem')) return 'Issue Reported';
  if (text.includes('complete') || text.includes('finished')) return 'Task Completed';
  if (text.includes('payment') || text.includes('invoice')) return 'Payment Related';
  if (text.includes('meeting') || text.includes('call')) return 'Communication';
  if (text.includes('file') || text.includes('document')) return 'Documentation';
  return 'General Note';
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  emptyTips: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
  notesContainer: {
    marginBottom: 20,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 8,
    flex: 1,
    letterSpacing: -0.3,
  },
  dateCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTime: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  noteText: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  noteFooter: {
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
  noteAuthor: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  footerBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
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