import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getBuku, ajukanPeminjaman, type Buku } from '@/services/api';

export default function PeminjamanScreen() {
  const router = useRouter();

  const [buku, setBuku] = useState<Buku[]>([]);
  const [filtered, setFiltered] = useState<Buku[]>([]);
  const [search, setSearch] = useState('');
  const [loadingBuku, setLoadingBuku] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [modalBuku, setModalBuku] = useState<Buku | null>(null);
  const [selectedDurasi, setSelectedDurasi] = useState<3 | 7 | 14>(7);

  const fetchBuku = useCallback(async () => {
    try {
      const data = await getBuku();
      const tersedia = data.filter((b) => b.stok_tersedia > 0);
      setBuku(tersedia);
      setFiltered(tersedia);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBuku().finally(() => setLoadingBuku(false));
  }, [fetchBuku]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBuku();
    setRefreshing(false);
  }, [fetchBuku]);

  const handleSearch = (text: string) => {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(buku.filter(
      (b) => b.judul.toLowerCase().includes(q) || b.pengarang.toLowerCase().includes(q)
    ));
  };

  const handleAjukan = (item: Buku) => {
    setSelectedDurasi(7);
    setModalBuku(item);
  };

  const handleKonfirmasiAjukan = async () => {
    if (!modalBuku) return;
    setSubmitting(modalBuku.id_buku);
    setModalBuku(null);
    try {
      await ajukanPeminjaman(modalBuku.id_buku, selectedDurasi);
      Alert.alert('Berhasil', `Pengajuan peminjaman ${selectedDurasi} hari telah dikirim. Tunggu persetujuan petugas.`);
      await fetchBuku();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal mengajukan peminjaman');
    } finally {
      setSubmitting(null);
    }
  };

  const renderBukuItem = ({ item }: { item: Buku }) => (
    <View style={styles.card}>
      <View style={styles.coverPlaceholder}>
        <Text style={styles.coverText}>{item.judul.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>
        <Text style={styles.pengarang}>{item.pengarang}</Text>
        {item.nama_kategori ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.nama_kategori}</Text>
          </View>
        ) : null}
        <Text style={styles.stok}>Tersedia: {item.stok_tersedia}/{item.stok_total}</Text>
      </View>
      <TouchableOpacity
        style={styles.pinjamBtn}
        onPress={() => handleAjukan(item)}
        disabled={submitting === item.id_buku}
        activeOpacity={0.7}
      >
        {submitting === item.id_buku ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.pinjamBtnText}>Pinjam</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pinjam Buku</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul atau pengarang..."
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {loadingBuku ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0f4c5c" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_buku)}
          renderItem={renderBukuItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search ? 'Buku tidak ditemukan' : 'Tidak ada buku yang tersedia'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Pilih Durasi */}
      <Modal
        visible={modalBuku !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalBuku(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalBuku(null)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>Pilih Durasi Pinjam</Text>
            <Text style={styles.modalBukuJudul} numberOfLines={2}>{modalBuku?.judul}</Text>

            <View style={styles.durasiRow}>
              {([3, 7, 14] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durasiBtn, selectedDurasi === d && styles.durasiBtnActive]}
                  onPress={() => setSelectedDurasi(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durasiBtnText, selectedDurasi === d && styles.durasiBtnTextActive]}>
                    {d} hari
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={handleKonfirmasiAjukan} activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>Ajukan Peminjaman</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalBuku(null)} activeOpacity={0.8}>
              <Text style={styles.modalBtnCancelText}>Batal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f4c5c' },
  header: {
    backgroundColor: '#0f4c5c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { minWidth: 70 },
  backText: { color: '#a8d8e8', fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', flex: 1, textAlign: 'center' },
  searchContainer: { padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
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
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  coverPlaceholder: {
    width: 48,
    height: 62,
    borderRadius: 6,
    backgroundColor: '#0f4c5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  cardInfo: { flex: 1, gap: 3 },
  judul: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pengarang: { fontSize: 12, color: '#6b7280' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeText: { fontSize: 10, color: '#0369a1', fontWeight: '600' },
  stok: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  pinjamBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pinjamBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  modalBukuJudul: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  durasiRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 4 },
  durasiBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durasiBtnActive: { borderColor: '#0f4c5c', backgroundColor: '#e0f2fe' },
  durasiBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  durasiBtnTextActive: { color: '#0f4c5c' },
  modalBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  modalBtnCancel: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnCancelText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
});
