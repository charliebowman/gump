import React from 'react';
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

const MY_LISTS = [
  {
    title: 'Best of 2024',
    subtitle: 'My favorite films, shows, and albums from this year',
    items: 24,
    visibility: 'Public',
    images: [
      'https://image.tmdb.org/t/p/w200/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
      'https://image.tmdb.org/t/p/w200/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      'https://image.tmdb.org/t/p/w200/sZ1cSCjVPqVAjkgsMzCXsOOCmoc.jpg',
      'https://image.tmdb.org/t/p/w200/aowr4xpLP5BTX2MsPe5cmD4oe0j.jpg',
    ],
  },
  {
    title: 'Weekend Watch',
    subtitle: 'Perfect for a cozy weekend',
    items: 12,
    visibility: 'Public',
    collaborative: true,
    images: [
      'https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      'https://image.tmdb.org/t/p/w200/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
    ],
  },
  {
    title: 'To Read',
    subtitle: 'Books on my radar',
    items: 8,
    visibility: 'Private',
    images: [],
  },
];

const SAVED_LISTS = [
  {
    title: 'Must Watch Thrillers',
    subtitle: 'Edge-of-your-seat thrillers that will keep you guessing',
    author: 'Jordan Lee',
    items: 18,
    visibility: 'Public',
    images: [
      'https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      'https://image.tmdb.org/t/p/w200/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      'https://image.tmdb.org/t/p/w200/sZ1cSCjVPqVAjkgsMzCXsOOCmoc.jpg',
      'https://image.tmdb.org/t/p/w200/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
    ],
  },
];

export default function ListsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lists</Text>
          <Text style={styles.headerSub}>Curate your collections</Text>
        </View>
        <TouchableOpacity style={styles.newButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newButtonText}>NEW LIST</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="list-outline" size={20} color={colors.accent} />
          <View>
            <Text style={styles.statLabel}>My Lists</Text>
            <Text style={styles.statValue}>142 <Text style={styles.statUnit}>Items</Text></Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="bookmark-outline" size={20} color={colors.accent} />
          <View>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      {/* Create Collection */}
      <TouchableOpacity style={styles.createCard}>
        <View style={styles.createIconBox}>
          <Ionicons name="add-circle-outline" size={32} color={colors.accent} />
        </View>
        <Text style={styles.createTitle}>Create Collection</Text>
        <Text style={styles.createSub}>Mix movies, books, TV & music in themed collections</Text>
      </TouchableOpacity>

      {/* My Lists */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Lists</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {MY_LISTS.map((list, i) => (
          <TouchableOpacity key={i} style={styles.listCard}>
            <View style={styles.listImageRow}>
              {list.images.length > 0 ? (
                list.images.slice(0, 4).map((img, j) => (
                  <Image key={j} source={{ uri: img }} style={styles.listThumb} />
                ))
              ) : (
                <View style={[styles.listThumb, styles.listThumbEmpty]}>
                  <Ionicons name="book-outline" size={20} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <Text style={styles.listTitle}>{list.title}</Text>
            <Text style={styles.listSub} numberOfLines={1}>{list.subtitle}</Text>
            <View style={styles.listMeta}>
              <Text style={styles.listCount}>{list.items} items</Text>
              <View style={styles.visibilityTag}>
                <Ionicons
                  name={list.visibility === 'Public' ? 'globe-outline' : 'lock-closed-outline'}
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={styles.visibilityText}>{list.visibility}</Text>
              </View>
              {list.collaborative && (
                <View style={styles.collabTag}>
                  <Text style={styles.collabText}>Collaborative</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Saved Lists */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Lists</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {SAVED_LISTS.map((list, i) => (
          <TouchableOpacity key={i} style={styles.listCard}>
            <View style={styles.listImageRow}>
              {list.images.slice(0, 4).map((img, j) => (
                <Image key={j} source={{ uri: img }} style={styles.listThumb} />
              ))}
            </View>
            <View style={styles.authorRow}>
              <View style={[styles.authorAvatar, { backgroundColor: '#4ecdc4' }]}>
                <Text style={styles.authorInitial}>{list.author[0]}</Text>
              </View>
              <Text style={styles.authorName}>{list.author}'s List</Text>
            </View>
            <Text style={styles.listTitle}>{list.title}</Text>
            <Text style={styles.listSub} numberOfLines={1}>{list.subtitle}</Text>
            <View style={styles.listMeta}>
              <Text style={styles.listCount}>{list.items} items</Text>
              <View style={styles.visibilityTag}>
                <Ionicons name="globe-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.visibilityText}>{list.visibility}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  newButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statUnit: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  createCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  createIconBox: { marginBottom: 8 },
  createTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  createSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  listImageRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  listThumb: { width: 60, height: 85, borderRadius: 8 },
  listThumbEmpty: {
    backgroundColor: colors.tagBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  listTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  listSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  listCount: { fontSize: 12, color: colors.textSecondary },
  visibilityTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visibilityText: { fontSize: 12, color: colors.textSecondary },
  collabTag: { backgroundColor: colors.accent + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  collabText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  authorInitial: { fontSize: 12, fontWeight: '700', color: '#fff' },
  authorName: { fontSize: 13, color: colors.textSecondary },
});
