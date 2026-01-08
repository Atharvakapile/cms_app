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
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

const { width } = Dimensions.get('window');
const FILE_BASE_URL = 'http://192.168.1.5:5000';

export default function ServiceFiles({ route, navigation }) {
  const { serviceId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'images', 'documents', 'others'

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchFiles();
  }, []);

  /* ================= FETCH FILES ================= */

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/files/client/${serviceId}`);
      const filesData = res.data?.data || [];
      setFiles(filesData);
      
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
      console.log('Files fetch error:', err.response?.data || err.message);
      Alert.alert('Error', 'Unable to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  /* ================= OPEN FILE ================= */

  const openFile = async (filePath) => {
    try {
      const url = `${FILE_BASE_URL}/${filePath}`;
      console.log('Opening file URL:', url);
      await Linking.openURL(url);
    } catch (err) {
      console.log('Open file error:', err.message);
      Alert.alert('Error', 'Unable to open file');
    }
  };

  /* ================= FILTER FILES ================= */

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'images';
    } else if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return 'documents';
    } else {
      return 'others';
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return getFileType(file.file_name) === filter;
  });

  const fileStats = {
    total: files.length,
    images: files.filter(f => getFileType(f.file_name) === 'images').length,
    documents: files.filter(f => getFileType(f.file_name) === 'documents').length,
    others: files.filter(f => getFileType(f.file_name) === 'others').length,
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Service Files</Text>
          <Text style={styles.pageSubtitle}>Loading files...</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading service files...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Service Files</Text>
        <Text style={styles.pageSubtitle}>
          All documents and images related to your service
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
          {/* ===== OVERVIEW CARD ===== */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewIcon}>
                <Ionicons name="folder-outline" size={28} color="#8b5cf6" />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewTitle}>File Overview</Text>
                <Text style={styles.overviewSubtitle}>
                  All uploaded documents and images
                </Text>
              </View>
            </View>

            {files.length > 0 ? (
              <>
                <View style={styles.statsRow}>
                  <StatItem 
                    label="Total Files" 
                    value={fileStats.total.toString()}
                    icon="documents-outline"
                    color="#3b82f6"
                  />
                  <View style={styles.statDivider} />
                  <StatItem 
                    label="Images" 
                    value={fileStats.images.toString()}
                    icon="image-outline"
                    color="#10b981"
                  />
                  <View style={styles.statDivider} />
                  <StatItem 
                    label="Document" 
                    value={fileStats.documents.toString()}
                    icon="document-text-outline"
                    color="#f59e0b"
                  />
                </View>

                {/* ===== STORAGE BAR ===== */}
                <View style={styles.storageContainer}>
                  <View style={styles.storageLabels}>
                    <Text style={styles.storageLabel}>Storage Usage</Text>
                    <Text style={styles.storagePercentage}>
                      {files.length > 0 ? 'Active' : 'Empty'}
                    </Text>
                  </View>
                  <View style={styles.storageBar}>
                    <View 
                      style={[
                        styles.storageFill,
                        { 
                          width: `${Math.min((files.length / 50) * 100, 100)}%`,
                          backgroundColor: files.length > 0 ? '#8b5cf6' : '#94a3b8'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.storageText}>
                    {files.length} files uploaded • Limited to 50 files
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyOverview}>
                <Ionicons name="cloud-offline-outline" size={48} color="#64748b" />
                <Text style={styles.emptyOverviewTitle}>No Files Yet</Text>
                <Text style={styles.emptyOverviewText}>
                  Files uploaded by the service provider will appear here
                </Text>
              </View>
            )}
          </View>

          {/* ===== FILTER BUTTONS ===== */}
          {files.length > 0 && (
            <>
              <View style={styles.filterContainer}>
                <FilterButton 
                  label="All Files" 
                  active={filter === 'all'} 
                  onPress={() => setFilter('all')}
                  count={fileStats.total}
                />
                <FilterButton 
                  label="Images" 
                  active={filter === 'images'} 
                  onPress={() => setFilter('images')}
                  count={fileStats.images}
                />
                <FilterButton 
                  label="Document" 
                  active={filter === 'documents'} 
                  onPress={() => setFilter('documents')}
                  count={fileStats.documents}
                />
                <FilterButton 
                  label="Others" 
                  active={filter === 'others'} 
                  onPress={() => setFilter('others')}
                  count={fileStats.others}
                />
              </View>

              {/* ===== FILES LIST CARD ===== */}
              <View style={styles.filesCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="list-outline" size={24} color="#8b5cf6" />
                  <Text style={styles.cardTitle}>Uploaded Files</Text>
                  <Text style={styles.filesCount}>
                    {filteredFiles.length} of {files.length}
                  </Text>
                </View>

                {filteredFiles.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color="#475569" />
                    <Text style={styles.emptyTitle}>
                      No {filter === 'all' ? '' : filter} files found
                    </Text>
                    <Text style={styles.emptyText}>
                      Try selecting a different filter category
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredFiles}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item, index }) => (
                      <FileItem 
                        item={item} 
                        index={index}
                        isLast={index === filteredFiles.length - 1}
                        onPress={() => openFile(item.file_path)}
                      />
                    )}
                  />
                )}
              </View>
            </>
          )}

          {/* ===== FILE INFO CARD ===== */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>File Information</Text>
              <Text style={styles.infoText}>
                All files related to your service are stored here. Tap any file to view or download it. 
                Files are organized by type for easy access.
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
              <Text style={styles.helpTitle}>Need Help with Files?</Text>
              <Text style={styles.helpText}>
                Contact support if you have issues viewing or downloading files
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
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
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

const FileItem = ({ item, index, isLast, onPress }) => {
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return { name: 'image-outline', color: '#10b981' };
    } else if (ext === 'pdf') {
      return { name: 'document-text-outline', color: '#ef4444' };
    } else if (['doc', 'docx'].includes(ext)) {
      return { name: 'document-outline', color: '#3b82f6' };
    } else if (['xls', 'xlsx'].includes(ext)) {
      return { name: 'stats-chart-outline', color: '#10b981' };
    } else {
      return { name: 'document-attach-outline', color: '#8b5cf6' };
    }
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) return sizeInBytes + ' B';
    if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(1) + ' KB';
    return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = getFileIcon(item.file_name);
  const uploadDate = item.uploaded_at 
    ? new Date(item.uploaded_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <TouchableOpacity 
      style={[styles.fileItem, isLast && styles.fileItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fileLeft}>
        <View style={[styles.fileIcon, { backgroundColor: `${fileIcon.color}15` }]}>
          <Ionicons name={fileIcon.name} size={20} color={fileIcon.color} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file_name}
          </Text>
          <View style={styles.fileMeta}>
            <Text style={styles.fileType}>{item.file_type || 'File'}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.fileDate}>{uploadDate}</Text>
            {item.file_size && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.fileSize}>{formatFileSize(item.file_size)}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      <Ionicons name="download-outline" size={20} color="#64748b" />
    </TouchableOpacity>
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  storageContainer: {
    marginTop: 8,
  },
  storageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  storagePercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyOverview: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyOverviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOverviewText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '80%',
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#0f172a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginRight: 6,
  },
  filterTextActive: {
    color: '#8b5cf6',
  },
  filterBadge: {
    backgroundColor: '#334155',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#8b5cf6',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  filesCard: {
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
  filesCount: {
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
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  fileItemLast: {
    borderBottomWidth: 0,
  },
  fileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileType: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metaSeparator: {
    color: '#64748b',
    marginHorizontal: 8,
  },
  fileDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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