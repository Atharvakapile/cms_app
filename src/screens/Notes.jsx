import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
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
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/client/${serviceId}`);
      setNotes(res.data?.data || []);
      
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
      console.log('Notes fetch error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const openNoteModal = (note) => {
    setSelectedNote(note);
    setModalVisible(true);
  };

  const closeNoteModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedNote(null), 300);
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

  // Calculate KPIs
  const totalNotes = notes.length;
  const totalDates = Object.keys(noteGroups).length;
  const latestNoteDate = notes.length > 0 
    ? new Date(notes[0].created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })
    : '-';

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Service Notes</Text>
        <Text style={styles.pageSubtitle}>
          {totalNotes} note{totalNotes !== 1 ? 's' : ''} recorded
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
          {/* Simplified KPIs */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={styles.kpiIcon}>
                <Ionicons name="document-text-outline" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.kpiTitle}>Notes Overview</Text>
                <Text style={styles.kpiStatus}>
                  {totalNotes > 0 ? `${totalNotes} notes` : 'No notes yet'}
                </Text>
              </View>
            </View>

            {totalNotes > 0 ? (
              <View style={styles.statsRow}>
                <StatBox 
                  icon="document-text-outline"
                  label="Total"
                  value={totalNotes}
                  color="#3b82f6"
                />
                <StatBox 
                  icon="calendar-outline"
                  label="Dates"
                  value={totalDates}
                  color="#10b981"
                />
                <StatBox 
                  icon="time-outline"
                  label="Latest"
                  value={latestNoteDate}
                  color="#8b5cf6"
                />
              </View>
            ) : (
              <View style={styles.emptyKpi}>
                <Ionicons name="document-text-outline" size={40} color="#64748b" />
                <Text style={styles.emptyKpiText}>
                  Notes from the support team will appear here
                </Text>
              </View>
            )}
          </View>

          {/* Notes List */}
          {totalNotes > 0 ? (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <Ionicons name="list-outline" size={20} color="#3b82f6" />
                <Text style={styles.listTitle}>All Notes</Text>
                <Text style={styles.listCount}>{totalNotes}</Text>
              </View>

              <View style={styles.notesList}>
                {Object.entries(noteGroups).map(([date, dateNotes]) => (
                  <View key={date} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                      <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                      <Text style={styles.dateTitle}>{date}</Text>
                      <Text style={styles.dateCount}>{dateNotes.length} notes</Text>
                    </View>
                    
                    {dateNotes.map((note) => (
                      <NoteCard 
                        key={note.id}
                        note={note}
                        onPress={() => openNoteModal(note)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={64} color="#475569" />
              </View>
              <Text style={styles.emptyTitle}>No Notes Yet</Text>
              <Text style={styles.emptyText}>
                Service notes will appear here once added by the support team.
              </Text>
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>What are service notes?</Text>
                <Text style={styles.tipsText}>
                  • Updates from support team{'\n'}
                  • Service progress reports{'\n'}
                  • Important communications
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Note Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeNoteModal}
      >
        <TouchableWithoutFeedback onPress={closeNoteModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedNote && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalIcon}>
                        <Ionicons 
                          name={getNoteIcon(selectedNote.note)} 
                          size={24} 
                          color="#3b82f6" 
                        />
                      </View>
                      <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitle}>
                          {getNoteType(selectedNote.note)}
                        </Text>
                        <View style={styles.modalMeta}>
                          <Ionicons name="time-outline" size={12} color="#94a3b8" />
                          <Text style={styles.modalTime}>
                            {new Date(selectedNote.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} • {new Date(selectedNote.created_at).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={closeNoteModal} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                      <Text style={styles.modalNoteText}>
                        {selectedNote.note}
                      </Text>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <View style={styles.footerLeft}>
                        <Ionicons name="person-circle-outline" size={16} color="#94a3b8" />
                        <Text style={styles.modalAuthor}>
                          {selectedNote.created_by || 'Support Team'}
                        </Text>
                      </View>
                      <View style={styles.footerBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                        <Text style={styles.footerBadgeText}>Added</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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

const NoteCard = ({ note, onPress }) => {
  const isLongNote = note.note.length > 120;
  const displayText = isLongNote 
    ? `${note.note.substring(0, 120)}...` 
    : note.note;

  return (
    <TouchableOpacity 
      style={styles.noteCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteIcon}>
          <Ionicons 
            name={getNoteIcon(note.note)} 
            size={20} 
            color="#3b82f6" 
          />
        </View>
        <View style={styles.noteInfo}>
          <Text style={styles.noteTitle}>
            {getNoteType(note.note)}
          </Text>
          <View style={styles.noteMeta}>
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text style={styles.noteTime}>
              {new Date(note.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.noteText}>
        {displayText}
      </Text>

      <View style={styles.noteFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
          <Text style={styles.noteAuthor}>
            {note.created_by || 'Support Team'}
          </Text>
        </View>
        {isLongNote && (
          <View style={styles.readMoreBadge}>
            <Ionicons name="expand-outline" size={12} color="#3b82f6" />
            <Text style={styles.readMoreText}>View</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

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
    paddingBottom: 20,
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
    marginBottom: 20,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kpiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  kpiStatus: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyKpi: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyKpiText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  
  // List Card
  listCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
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
  notesList: {
    gap: 16,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
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
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  readMoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  readMoreText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 300,
  },
  tipsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTime: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  modalBody: {
    padding: 24,
    maxHeight: 400,
  },
  modalNoteText: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalAuthor: {
    fontSize: 14,
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
});