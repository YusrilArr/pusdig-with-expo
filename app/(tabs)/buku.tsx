import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBuku, type Buku } from '@/services/api';

export default function BukuScreen() {
  const [buku, setBuku] = useState<Buku[]>([]);
  const [filtered, setFiltered] = useState<Buku[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBuku = useCallback(async () => {
    try {
      setError('');
      const data = await getBuku();
      setBuku(data);
      setFiltered(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data buku');
    }
  }, []);

  useEffect(() => {
    fetchBuku().finally(() => setLoading(false));
  }, [fetchBuku]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBuku();
    setRefreshing(false);
  }, [fetchBuku]);

  const handleSearch = (text: string) => {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(
      buku.filter(
        (b) =>
          b.judul.toLowerCase().includes(q) ||
          b.pengarang.toLowerCase().includes(q) ||
          (b.nama_kategori ?? '').toLowerCase().includes(q)
      )
    );
  };

  const renderItem = ({ item }: { item: Buku }) => (
    <View style={styles.card}>
      <View style={styles.coverPlaceholder}>
        <Text style={styles.coverText}>{item.judul.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>
        <Text style={styles.pengarang}>{item.pengarang}</Text>
        {item.nama_kategori ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.nama_kategori}</Text>
          </View>
        ) : null}
        <Text style={[styles.stok, item.stok_tersedia === 0 && styles.stokHabis]}>
          {item.stok_tersedia === 0
            ? 'Stok habis'
            : `Tersedia: ${item.stok_tersedia}/${item.stok_total}`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daftar Buku</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul, pengarang, atau kategori..."
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBuku}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_buku)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search ? 'Buku tidak ditemukan' : 'Belum ada buku'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#0f4c5c',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  searchContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  coverPlaceholder: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#0f4c5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  cardRight: { flex: 1, gap: 4 },
  judul: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pengarang: { fontSize: 12, color: '#6b7280' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, color: '#0369a1', fontWeight: '600' },
  stok: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 4 },
  stokHabis: { color: '#dc2626' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
