import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getBuku, type Buku } from '@/services/api';

type Section = {
  kode: string;
  lokasi: string | null;
  data: Buku[];
};

function groupByRak(buku: Buku[]): Section[] {
  const map = new Map<string, Section>();

  for (const b of buku) {
    const key = b.kode_rak ?? '__NONE__';
    if (!map.has(key)) {
      map.set(key, {
        kode: b.kode_rak ?? 'Belum Ditempatkan',
        lokasi: b.lokasi_rak ?? null,
        data: [],
      });
    }
    map.get(key)!.data.push(b);
  }

  const sections = Array.from(map.values());

  // Pisahkan "Belum Ditempatkan" ke paling bawah
  const placed = sections
    .filter((s) => s.kode !== 'Belum Ditempatkan')
    .sort((a, b) => a.kode.localeCompare(b.kode));
  const unplaced = sections.filter((s) => s.kode === 'Belum Ditempatkan');

  return [...placed, ...unplaced];
}

export default function TataLetakBukuScreen() {
  const router = useRouter();
  const [buku, setBuku] = useState<Buku[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getBuku();
      setBuku(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const sections = useMemo(() => groupByRak(buku), [buku]);

  const totalRak = sections.filter((s) => s.kode !== 'Belum Ditempatkan').length;
  const totalBuku = buku.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tata Letak Buku</Text>
          <View style={{ minWidth: 80 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tata Letak Buku</Text>
          <View style={{ minWidth: 80 }} />
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tata Letak Buku</Text>
        <View style={{ minWidth: 80 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id_buku)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalRak}</Text>
              <Text style={styles.summaryLabel}>Rak</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalBuku}</Text>
              <Text style={styles.summaryLabel}>Total Buku</Text>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[
            styles.sectionHeader,
            section.kode === 'Belum Ditempatkan' && styles.sectionHeaderGray,
          ]}>
            <View style={styles.sectionLeft}>
              <MaterialIcons
                name={section.kode === 'Belum Ditempatkan' ? 'help-outline' : 'shelves'}
                size={18}
                color={section.kode === 'Belum Ditempatkan' ? '#6b7280' : '#0f4c5c'}
              />
              <View style={{ marginLeft: 8 }}>
                <Text style={[
                  styles.sectionKode,
                  section.kode === 'Belum Ditempatkan' && { color: '#6b7280' },
                ]}>
                  {section.kode}
                </Text>
                {section.lokasi ? (
                  <Text style={styles.sectionLokasi}>{section.lokasi}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{section.data.length} buku</Text>
            </View>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={[
            styles.bookItem,
            index === section.data.length - 1 && styles.bookItemLast,
          ]}>
            <View style={styles.bookIndex}>
              <Text style={styles.bookIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookJudul} numberOfLines={2}>{item.judul}</Text>
              <Text style={styles.bookPengarang} numberOfLines={1}>{item.pengarang}</Text>
            </View>
            <View style={styles.bookRight}>
              <View style={[
                styles.stokBadge,
                item.stok_tersedia === 0 && styles.stokHabis,
              ]}>
                <Text style={[
                  styles.stokText,
                  item.stok_tersedia === 0 && styles.stokTextHabis,
                ]}>
                  {item.stok_tersedia}/{item.stok_total}
                </Text>
              </View>
              <Text style={styles.stokLabel}>stok</Text>
            </View>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.sectionFooter} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="shelves" size={56} color="#d1d5db" />
            <Text style={styles.emptyText}>Belum ada buku</Text>
          </View>
        }
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#0f4c5c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { minWidth: 80 },
  backText: { color: '#a8d8e8', fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginHorizontal: 32 },
  retryBtn: {
    backgroundColor: '#0f4c5c',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { paddingBottom: 40 },

  // Summary bar
  summary: {
    flexDirection: 'row',
    backgroundColor: '#0f4c5c',
    marginBottom: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 0,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 26, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#a8d8e8', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0f4c5c',
  },
  sectionHeaderGray: {
    backgroundColor: '#f1f5f9',
    borderLeftColor: '#9ca3af',
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionKode: { fontSize: 14, fontWeight: '700', color: '#0f4c5c' },
  sectionLokasi: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  sectionBadge: {
    backgroundColor: '#0f4c5c',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Book item
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  bookItemLast: { borderBottomWidth: 0 },
  bookIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookIndexText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  bookInfo: { flex: 1 },
  bookJudul: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  bookPengarang: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  bookRight: { alignItems: 'center', minWidth: 44 },
  stokBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stokHabis: { backgroundColor: '#fee2e2' },
  stokText: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  stokTextHabis: { color: '#b91c1c' },
  stokLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  sectionFooter: { height: 8, backgroundColor: '#f3f4f6' },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
