import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchMedia, addMedia } from '../services/api';

const MEDIA_TYPES = [
  { key: 'all', label: 'All', emoji: '' },
  { key: 'movie', label: 'Movie', emoji: '🎬' },
  { key: 'tv', label: 'TV', emoji: '📺' },
  { key: 'book', label: 'Book', emoji: '📚' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'podcast', label: 'Podcast', emoji: '🎙' },
];

const FOR_YOU = [
  { title: 'Dune: Part Two', rating: 4.5, image: 'https://image.tmdb.org/t/p/w300/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg' },
  { title: 'The Bear', rating: 4.8, image: 'https://image.tmdb.org/t/p/w300/sZ1cSCjVPqVAjkgsMzCXsOOCmoc.jpg' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', rating: 4.6, image: 'https://covers.openlibrary.org/b/title/Tomorrow%20and%20Tomorrow%20and%20Tomorrow-M.jpg' },
];

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const type = activeType === 'all' ? 'movie' : activeType;
      const data = await searchMedia(type, query);
      setResults(data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleAdd = async (item: any) => {
    try {
      await addMedia({
        media_type: item.media_type,
        external_id: item.external_id,
        title: item.title,
        metadata: item.metadata,
      });
    } catch {}
  };

  const renderResult = (item: any) => {
    const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata || {};
    const poster = meta.image_url || meta.cover_url || meta.poster_path || '';
    const sub = meta.author || meta.release_date || meta.first_air_date || '';

    return (
      <TouchableOpacity style={styles.resultCard} onPress={() => handleAdd(item)}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.resultImage} />
        ) : (
          <View style={[styles.resultImage, styles.resultPlaceholder]}>
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.resultMeta}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.media_type}</Text>
            </View>
            {sub ? <Text style={styles.resultSub}>{sub}</Text> : null}
          </View>
        </View>
        <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search for content..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Type Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {MEDIA_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterPill, activeType === t.key && styles.filterPillActive]}
            onPress={() => setActiveType(t.key)}
          >
            <Text style={[styles.filterPillText, activeType === t.key && styles.filterPillTextActive]}>
              {t.emoji ? `${t.emoji} ` : ''}{t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : searched && results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        ) : searched ? (
          results.map((item, i) => <View key={i}>{renderResult(item)}</View>)
        ) : (
          <>
            {/* For You Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>For You</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FOR_YOU.map((item, i) => (
                <TouchableOpacity key={i} style={styles.forYouCard}>
                  <Image source={{ uri: item.image }} style={styles.forYouImage} />
                  <View style={styles.forYouRating}>
                    <Ionicons name="star" size={12} color={colors.orange} />
                    <Text style={styles.forYouRatingText}>{item.rating}</Text>
                  </View>
                  <Text style={styles.forYouTitle} numberOfLines={2}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Trending This Week */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Ionicons name="trending-up" size={20} color={colors.green} />
              <Text style={styles.sectionTitle}>Trending This Week</Text>
            </View>
            <View style={styles.trendingGrid}>
              {FOR_YOU.map((item, i) => (
                <TouchableOpacity key={i} style={styles.trendingItem}>
                  <Image source={{ uri: item.image }} style={styles.trendingImage} />
                  <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.trendingRating}>
                    <Ionicons name="star" size={10} color={colors.orange} />
                    <Text style={styles.trendingRatingText}>{item.rating}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 12 },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterRow: { paddingHorizontal: 20, marginTop: 12, marginBottom: 8, maxHeight: 44 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterPillText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  filterPillTextActive: { color: '#fff', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  forYouCard: { width: 140, marginRight: 12 },
  forYouImage: { width: 140, height: 200, borderRadius: 12 },
  forYouRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  forYouRatingText: { fontSize: 12, fontWeight: '700', color: colors.orange },
  forYouTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 },
  trendingGrid: { flexDirection: 'row', gap: 12 },
  trendingItem: { flex: 1 },
  trendingImage: { width: '100%', height: 150, borderRadius: 10 },
  trendingTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 6 },
  trendingRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trendingRatingText: { fontSize: 11, color: colors.orange, fontWeight: '600' },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultImage: { width: 60, height: 90, borderRadius: 8, marginRight: 12 },
  resultPlaceholder: {
    backgroundColor: colors.tagBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resultSub: { fontSize: 13, color: colors.textSecondary },
  tag: { backgroundColor: colors.tagBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder },
  tagText: { fontSize: 11, color: colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
});
