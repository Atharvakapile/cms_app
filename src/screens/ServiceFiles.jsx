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
const FILE_BASE_URL = 'https://api.imperiummmm.in';

export default function ServiceFiles({ route, navigation }) {
  const { serviceId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'images', 'documents'

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
          {/* ===== SIMPLIFIED OVERVIEW ===== */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons name="folder-outline" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.summaryTitle}>File Overview</Text>
                <Text style={styles.summaryStatus}>
                  {files.length > 0 ? `${files.length} files` : 'No files yet'}
                </Text>
              </View>
            </View>

            {files.length > 0 ? (
              <View style={styles.statsRow}>
                <StatBox 
                  icon="documents-outline"
                  label="Total"
                  value={fileStats.total}
                  color="#3b82f6"
                />
                <StatBox 
                  icon="image-outline"
                  label="Images"
                  value={fileStats.images}
                  color="#10b981"
                />
                <StatBox 
                  icon="document-text-outline"
                  label="Documents"
                  value={fileStats.documents}
                  color="#f59e0b"
                />
              </View>
            ) : (
              <View style={styles.emptyOverview}>
                <Ionicons name="cloud-offline-outline" size={40} color="#64748b" />
                <Text style={styles.emptyOverviewText}>
                  Files uploaded by the service provider will appear here
                </Text>
              </View>
            )}
          </View>

          {/* ===== SIMPLIFIED FILTERS ===== */}
          {files.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filter by Type</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
                  onPress={() => setFilter('all')}
                >
                  <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
                    All Files
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, filter === 'images' && styles.filterBtnActive]}
                  onPress={() => setFilter('images')}
                >
                  <View style={styles.filterBtnContent}>
                    <Ionicons name="image-outline" size={16} color={filter === 'images' ? '#10b981' : '#94a3b8'} />
                    <Text style={[styles.filterBtnText, filter === 'images' && styles.filterBtnTextActive]}>
                      Images
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, filter === 'documents' && styles.filterBtnActive]}
                  onPress={() => setFilter('documents')}
                >
                  <View style={styles.filterBtnContent}>
                    <Ionicons name="document-text-outline" size={16} color={filter === 'documents' ? '#f59e0b' : '#94a3b8'} />
                    <Text style={[styles.filterBtnText, filter === 'documents' && styles.filterBtnTextActive]}>
                      Documents
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===== FILES LIST ===== */}
          {files.length > 0 ? (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <Ionicons name="list-outline" size={20} color="#3b82f6" />
                <Text style={styles.listTitle}>Uploaded Files</Text>
                <Text style={styles.listCount}>
                  {filteredFiles.length}
                </Text>
              </View>

              {filteredFiles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={40} color="#475569" />
                  <Text style={styles.emptyTitle}>
                    No {filter === 'all' ? '' : filter} files found
                  </Text>
                  <Text style={styles.emptyText}>
                    Try selecting a different filter
                  </Text>
                </View>
              ) : (
                <View style={styles.filesList}>
                  {filteredFiles.map((item, index) => (
                    <FileCard 
                      key={item.id}
                      item={item}
                      isLast={index === filteredFiles.length - 1}
                      onPress={() => openFile(item.file_path)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

         
          
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

const FileCard = ({ item, isLast, onPress }) => {
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
    if (!sizeInBytes) return '';
    if (sizeInBytes < 1024) return sizeInBytes + ' B';
    if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(1) + ' KB';
    return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = getFileIcon(item.file_name);
  const uploadDate = item.uploaded_at 
    ? new Date(item.uploaded_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : 'Recent';

  return (
    <TouchableOpacity 
      style={[styles.fileCard, !isLast && styles.fileBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fileLeft}>
        <View style={[styles.fileIcon, { backgroundColor: `${fileIcon.color}15` }]}>
          <Ionicons name={fileIcon.name} size={20} color={fileIcon.color} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file_name}
          </Text>
          <View style={styles.fileMeta}>
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
      <Ionicons name="download-outline" size={18} color="#64748b" />
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
  emptyOverview: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyOverviewText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
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
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
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
  filesList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  fileBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metaSeparator: {
    color: '#64748b',
    marginHorizontal: 8,
  },
  fileSize: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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