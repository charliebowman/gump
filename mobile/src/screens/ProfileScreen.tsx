import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getUser, getUserReviews, getUserStatuses, getProfile, logout as apiLogout } from '../services/api';

const TABS = ['Reviews', 'Library', 'Wall'];

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Reviews');
  const [reviews, setReviews] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const u = await getUser();
      setUser(u);
      if (u?.user_id) {
        const [p, r, s] = await Promise.all([
          getProfile(u.user_id).catch(() => null),
          getUserReviews(u.user_id).catch(() => []),
          getUserStatuses(u.user_id).catch(() => []),
        ]);
        setProfile(p);
        setReviews(r || []);
        setStatuses(s || []);
      }
    } catch {}
  };

  const handleLogout = async () => {
    await apiLogout();
    // In a real app, navigate to login
  };

  const displayName = profile?.display_name || user?.username || 'User';
  const username = profile?.username || user?.username || 'user';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.follower_count || 0}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.following_count || 0}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.review_count || reviews.length}</Text>
            <Text style={styles.statLabel}>reviews</Text>
          </View>
        </View>
      </View>

      {/* Media Breakdown */}
      <View style={styles.mediaBreakdown}>
        {[
          { icon: 'film-outline' as const, label: 'Movies', count: '45' },
          { icon: 'tv-outline' as const, label: 'TV', count: '32' },
          { icon: 'book-outline' as const, label: 'Books', count: '28' },
          { icon: 'musical-notes-outline' as const, label: 'Music', count: '18' },
        ].map((item, i) => (
          <View key={i} style={styles.mediaItem}>
            <Ionicons name={item.icon} size={20} color={colors.accent} />
            <Text style={styles.mediaCount}>{item.count}</Text>
            <Text style={styles.mediaLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'Reviews' && (
          reviews.length > 0 ? (
            reviews.map((r: any, i: number) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTitle}>{r.media_title}</Text>
                  <Text style={styles.reviewRating}>{r.rating}/10</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{r.media_type}</Text>
                </View>
                {r.body && <Text style={styles.reviewBody}>{r.body}</Text>}
                <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pencil-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Start reviewing to build your profile</Text>
            </View>
          )
        )}

        {activeTab === 'Library' && (
          statuses.length > 0 ? (
            statuses.map((s: any, i: number) => (
              <View key={i} style={styles.libraryCard}>
                <View style={styles.libraryInfo}>
                  <Text style={styles.libraryTitle}>{s.media_title}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{s.media_type}</Text>
                  </View>
                </View>
                <View style={[styles.statusTag, s.status === 'finished' && styles.statusFinished]}>
                  <Text style={styles.statusText}>{s.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Library is empty</Text>
              <Text style={styles.emptySubtext}>Track what you're watching, reading & listening to</Text>
            </View>
          )
        )}

        {activeTab === 'Wall' && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No wall posts yet</Text>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.red} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  settingsButton: { padding: 8 },
  avatarSection: { alignItems: 'center', marginTop: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 12 },
  username: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  bio: { fontSize: 14, color: colors.text, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 24,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder },
  mediaBreakdown: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  mediaItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mediaCount: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  mediaLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },
  tabContent: { paddingHorizontal: 20, paddingTop: 16 },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  reviewRating: { fontSize: 16, fontWeight: '700', color: colors.orange },
  reviewBody: { fontSize: 14, color: colors.text, marginTop: 8, lineHeight: 20 },
  reviewDate: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  tag: { backgroundColor: colors.tagBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder },
  tagText: { fontSize: 11, color: colors.textSecondary },
  libraryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  libraryInfo: { flex: 1 },
  libraryTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  statusTag: { backgroundColor: colors.tagBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusFinished: { backgroundColor: colors.green + '30' },
  statusText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.red },
});
