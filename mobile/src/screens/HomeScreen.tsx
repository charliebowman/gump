import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getFeed, getUser } from '../services/api';

const FRIEND_AVATARS = [
  { name: 'Alex', color: '#ff6b6b' },
  { name: 'Jordan', color: '#4ecdc4' },
  { name: 'Sam', color: '#ffe66d' },
  { name: 'Morgan', color: '#a29bfe' },
];

const TRENDING = {
  title: 'Dune: Part Two',
  year: '2024',
  rating: 4.5,
  genre: 'Sci-Fi',
  image: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
};

const FRIENDS_WATCHING = [
  { title: 'Oppenheimer', image: 'https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { title: 'True Detective', image: 'https://image.tmdb.org/t/p/w300/aowr4xpLP5BTX2MsPe5cmD4oe0j.jpg' },
  { title: 'Intermezzo', image: 'https://covers.openlibrary.org/b/title/Intermezzo-M.jpg' },
];

export default function HomeScreen({ navigation }: any) {
  const [feed, setFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loadData = async () => {
    try {
      const [feedData, userData] = await Promise.all([
        getFeed(10).catch(() => []),
        getUser(),
      ]);
      setFeed(feedData || []);
      setUser(userData);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GUMP</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Friends Circle */}
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsRow}>
          {FRIEND_AVATARS.map((f, i) => (
            <TouchableOpacity key={i} style={styles.friendItem}>
              <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
                <Text style={styles.friendInitial}>{f.name[0]}</Text>
              </View>
              <Text style={styles.friendName}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.friendsSubtext}>Your circle is active</Text>
      </View>

      {/* Weekly Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>THIS WEEK</Text>
          <Text style={styles.statValue}>12</Text>
          <View style={styles.statIconRow}>
            <Ionicons name="pencil-outline" size={14} color={colors.accent} />
            <Text style={styles.statDesc}>Reviews logged</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>AVG RATING</Text>
          <Text style={styles.statValue}>4.2</Text>
          <View style={styles.statIconRow}>
            <Ionicons name="star-outline" size={14} color={colors.orange} />
            <Text style={styles.statDesc}>This month</Text>
          </View>
        </View>
      </View>

      {/* Trending */}
      <TouchableOpacity style={styles.trendingCard}>
        <Image source={{ uri: TRENDING.image }} style={styles.trendingImage} />
        <View style={styles.trendingOverlay}>
          <Text style={styles.trendingLabel}>{'🎬 TRENDING NOW'}</Text>
          <Text style={styles.trendingTitle}>{TRENDING.title}</Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingYear}>{TRENDING.year}</Text>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={colors.orange} />
              <Text style={styles.ratingText}>{TRENDING.rating}</Text>
            </View>
            <Text style={styles.trendingGenre}>{TRENDING.genre}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {feed.length > 0 ? (
          feed.slice(0, 5).map((item: any, i: number) => (
            <View key={i} style={styles.activityCard}>
              <View style={[styles.activityAvatar, { backgroundColor: '#4ecdc4' }]}>
                <Text style={styles.activityInitial}>{(item.username || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{item.username} </Text>
                  {item.type === 'review' ? 'reviewed' : `set status to ${item.status} for`}{' '}
                  <Text style={styles.activityMedia}>{item.media_title}</Text>
                </Text>
                {item.rating != null && (
                  <View style={styles.activityStars}>
                    {Array.from({ length: 5 }, (_, j) => (
                      <Ionicons
                        key={j}
                        name={j < Math.round(item.rating / 2) ? 'star' : 'star-outline'}
                        size={14}
                        color={colors.orange}
                      />
                    ))}
                  </View>
                )}
                <Text style={styles.activityTime}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Follow some users to see their activity here</Text>
          </View>
        )}
      </View>

      {/* Media Category Quick Links */}
      <View style={styles.categoriesRow}>
        {[
          { icon: 'film-outline' as const, label: 'Movies', count: '45 watched' },
          { icon: 'tv-outline' as const, label: 'TV Shows', count: '32 watched' },
          { icon: 'book-outline' as const, label: 'Books', count: '28 read' },
          { icon: 'musical-notes-outline' as const, label: 'Music', count: '18 albums' },
        ].map((cat, i) => (
          <TouchableOpacity key={i} style={styles.categoryItem}>
            <Ionicons name={cat.icon} size={24} color={colors.accent} />
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categoryCount}>{cat.count}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Action */}
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => navigation.navigate('Discover')}
      >
        <View>
          <Text style={styles.quickActionLabel}>Quick Action</Text>
          <Text style={styles.quickActionTitle}>Log Something New</Text>
        </View>
        <View style={styles.quickActionButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Friends Are Watching */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends Are Watching</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {FRIENDS_WATCHING.map((item, i) => (
            <TouchableOpacity key={i} style={styles.friendWatchCard}>
              <Image source={{ uri: item.image }} style={styles.friendWatchImage} />
              <Text style={styles.friendWatchTitle} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1 },
  headerDate: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  notifButton: { padding: 8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  viewAll: { fontSize: 14, color: colors.accent },
  friendsRow: { marginBottom: 8 },
  friendItem: { alignItems: 'center', marginRight: 16 },
  friendAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.accent },
  friendInitial: { fontSize: 20, fontWeight: '700', color: '#fff' },
  friendName: { fontSize: 12, color: colors.text, marginTop: 4 },
  friendsSubtext: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 1 },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  statDesc: { fontSize: 12, color: colors.textSecondary },
  trendingCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    height: 200,
  },
  trendingImage: { width: '100%', height: '100%' },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  trendingLabel: { fontSize: 12, fontWeight: '600', color: colors.orange, marginBottom: 4 },
  trendingTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  trendingYear: { fontSize: 13, color: colors.textSecondary },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  trendingGenre: { fontSize: 13, color: colors.textSecondary },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activityAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInitial: { fontSize: 16, fontWeight: '700', color: '#fff' },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  activityUser: { fontWeight: '700', color: colors.textPrimary },
  activityMedia: { fontWeight: '600', color: colors.accent },
  activityStars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  activityTime: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  categoryItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: colors.text, marginTop: 6 },
  categoryCount: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  quickAction: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  quickActionLabel: { fontSize: 12, color: colors.textSecondary },
  quickActionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendWatchCard: { marginRight: 12, width: 120 },
  friendWatchImage: { width: 120, height: 170, borderRadius: 10 },
  friendWatchTitle: { fontSize: 12, color: colors.text, marginTop: 6, textAlign: 'center' },
});
