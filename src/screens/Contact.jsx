import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Contact() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
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
  }, []);

  const openEmail = () => {
    Linking.openURL('mailto:imperiumofficialgroup@gmail.com');
  };

  const openPhone = () => {
    Linking.openURL('tel:+917887741483');
  };

  const openMaps = () => {
    Linking.openURL(
      'https://maps.app.goo.gl/je94sAyQrG6UfonB8'
    );
  };

  const openWebsite = () => {
    Linking.openURL('https://imperiumofficial.in');
  };

  const openInstagram = () => {
    Linking.openURL('https://instagram.com/imperiumofficial_services');
  };

  const openLinkedIn = () => {
    Linking.openURL('https://linkedin.com/company/imperiumofficial');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== PAGE HEADER ===== */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Contact Us</Text>
        <Text style={styles.pageSubtitle}>Get in touch with our team</Text>
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
          {/* ===== HEADER WITH GRADIENT ===== */}
          <View style={styles.headerCard}>
            <View style={styles.headerGradient}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>I</Text>
              </View>
              <Text style={styles.company}>Imperium Official</Text>
              <Text style={styles.tagline}>
                Digital Solutions • Growth • Reliability
              </Text>
            </View>
          </View>

          {/* ===== QUICK ACTIONS ===== */}
          <View style={styles.actionsRow}>
            <QuickAction
              icon="call-outline"
              label="Call"
              onPress={openPhone}
              color="#0ea5e9"
            />
            <QuickAction
              icon="mail-outline"
              label="Email"
              onPress={openEmail}
              color="#8b5cf6"
            />
            <QuickAction
              icon="location-outline"
              label="Location"
              onPress={openMaps}
              color="#10b981"
            />
          </View>

          {/* ===== CONTACT DETAILS CARD ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Contact Details</Text>
            </View>
            
            <ContactRow
              icon="mail-outline"
              title="Email Address"
              subtitle="imperiumofficialgroup@gmail.com"
              onPress={openEmail}
            />
            
            <ContactRow
              icon="call-outline"
              title="Phone Number"
              subtitle="+91 78877 41483"
              onPress={openPhone}
            />
            
            <ContactRow
              icon="location-outline"
              title="Headquarters"
              subtitle="Pune, Maharashtra, India"
              onPress={openMaps}
            />
            
            <ContactRow
              icon="time-outline"
              title="Business Hours"
              subtitle="Mon – Sat • 10:00 AM – 7:00 PM"
            />
          </View>

          {/* ===== SERVICES CARD ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="rocket-outline" size={24} color="#f59e0b" />
              <Text style={styles.cardTitle}>Our Services</Text>
            </View>
            
            {/* Centered Services Grid */}
            <View style={styles.servicesGrid}>
              <View style={styles.gridRow}>
                <ServiceBadge icon="code-slash-outline" label="Web Development" />
                <ServiceBadge icon="phone-portrait-outline" label="App Development" />
              </View>
              <View style={styles.gridRow}>
                <ServiceBadge icon="megaphone-outline" label="Digital Marketing" />
                <ServiceBadge icon="color-palette-outline" label="Branding & Design" />
              </View>
              <View style={styles.gridRow}>
                <ServiceBadge icon="server-outline" label="CMS Solutions" />
                <ServiceBadge icon="shield-checkmark-outline" label="Client Portals" />
              </View>
            </View>
            
            {/* Service List */}
            <View style={styles.servicesList}>
              <ServiceItem text="Website Development & Maintenance" />
              <ServiceItem text="Mobile App Development (iOS & Android)" />
              <ServiceItem text="Digital Marketing & SEO Services" />
              <ServiceItem text="UI/UX Design & Brand Identity" />
              <ServiceItem text="Custom CMS & Portal Development" />
              <ServiceItem text="IT Consultation & Strategy" />
            </View>
          </View>

          {/* ===== SOCIAL CARD ===== */}
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="share-social-outline" size={24} color="#ec4899" />
              <Text style={styles.cardTitle}>Connect With Us</Text>
            </View>
            
            <Text style={styles.socialSubtitle}>
              Follow us for updates, offers, and insights
            </Text>
            
            <View style={styles.socialGrid}>
              <SocialCard
                icon="globe-outline"
                label="Official Website"
                description="imperiumofficial.in"
                onPress={openWebsite}
                color="#3b82f6"
              />
              <SocialCard
                icon="logo-instagram"
                label="Instagram"
                description="@imperiumofficial_services"
                onPress={openInstagram}
                color="#ec4899"
              />
              <SocialCard
                icon="logo-linkedin"
                label="LinkedIn"
                description="Company Profile"
                onPress={openLinkedIn}
                color="#0ea5e9"
              />
            </View>
          </View>

          {/* ===== FOOTER ===== */}
          <View style={styles.footerCard}>
            <View style={styles.footerIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
            </View>
            <Text style={styles.footerText}>
              Trusted Partner for Digital Transformation
            </Text>
            <Text style={styles.footerSubtext}>
              Since 2024 • Based in Pune, India
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */

const QuickAction = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ContactRow = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity 
    style={styles.contactRow} 
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.contactIcon}>
      <Ionicons name={icon} size={20} color="#3b82f6" />
    </View>
    <View style={styles.contactContent}>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={[styles.contactSubtitle, onPress && styles.link]}>
        {subtitle}
      </Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    )}
  </TouchableOpacity>
);

const ServiceBadge = ({ icon, label }) => (
  <View style={styles.badge}>
    <View style={styles.badgeIcon}>
      <Ionicons name={icon} size={18} color="#3b82f6" />
    </View>
    <Text style={styles.badgeLabel}>{label}</Text>
  </View>
);

const ServiceItem = ({ text }) => (
  <View style={styles.serviceItem}>
    <View style={styles.serviceBullet}>
      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
    </View>
    <Text style={styles.serviceText}>{text}</Text>
  </View>
);

const SocialCard = ({ icon, label, description, onPress, color }) => (
  <TouchableOpacity style={styles.socialCard} onPress={onPress}>
    <View style={[styles.socialIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.socialContent}>
      <Text style={styles.socialLabel}>{label}</Text>
      <Text style={styles.socialDescription}>{description}</Text>
    </View>
    <Ionicons name="open-outline" size={18} color="#64748b" />
  </TouchableOpacity>
);

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
  container: {
    padding: 20,
    paddingTop: 16,
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
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  company: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  link: {
    color: '#3b82f6',
  },
  // Centered Services Grid
  servicesGrid: {
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: width * 0.4,
    maxWidth: width * 0.45,
  },
  badgeIcon: {
    marginRight: 10,
  },
  badgeLabel: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  servicesList: {
    marginTop: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  serviceBullet: {
    marginRight: 12,
    marginTop: 2,
  },
  serviceText: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  socialSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  socialGrid: {
    gap: 12,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  socialIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  socialContent: {
    flex: 1,
  },
  socialLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  socialDescription: {
    fontSize: 13,
    color: '#94a3b8',
  },
  footerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
});