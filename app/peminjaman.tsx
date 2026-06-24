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
import { getBuku, ajukanPeminjaman, getPeminjaman, type Buku, type Peminjaman } from '@/services/api';

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  diajukan:    { label: 'Menunggu',    color: '#b45309', bg: '#fef3c7' },
  disetujui:   { label: 'Disetujui',   color: '#0369a1', bg: '#e0f2fe' },
  dipinjam:    { label: 'Dipinjam',    color: '#16a34a', bg: '#dcfce7' },
  dikembalikan:{ label: 'Dikembalikan',color: '#6b7280', bg: '#f3f4f6' },
  ditolak:     { label: 'Ditolak',     color: '#dc2626', bg: '#fee2e2' },
  terlambat:   { label: 'Terlambat',   color: '#dc2626', bg: '#fee2e2' },
  hilang:      { label: 'Hilang',      color: '#7c3aed', bg: '#ede9fe' },
};

function formatTgl(tgl: string | null) {
  if (!tgl) return '-';
  return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function hitungDurasi(item: Peminjaman): string | null {
  if (item.tgl_kembali && item.tgl_pinjam) {
    const diff = Math.round(
      (new Date(item.tgl_kembali).getTime() - new Date(item.tgl_pinjam).getTime()) / 86400000
    );
    return `${diff} hari (aktual)`;
  }
  if (item.durasi_pinjam) return `${item.durasi_pinjam} hari`;
  return null;
}

export default function PeminjamanScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'ajukan' | 'riwayat'>('ajukan');

  const [buku, setBuku] = useState<Buku[]>([]);
  const [filtered, setFiltered] = useState<Buku[]>([]);
  const [search, setSearch] = useState('');
  const [riwayat, setRiwayat] = useState<Peminjaman[]>([]);

  const [loadingBuku, setLoadingBuku] = useState(true);
  const [loadingRiwayat, setLoadingRiwayat] = useState(true);
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

  const fetchRiwayat = useCallback(async () => {
    try {
      const data = await getPeminjaman();
      setRiwayat(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBuku().finally(() => setLoadingBuku(false));
    fetchRiwayat().finally(() => setLoadingRiwayat(false));
  }, [fetchBuku, fetchRiwayat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBuku(), fetchRiwayat()]);
    setRefreshing(false);
  }, [fetchBuku, fetchRiwayat]);

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
      await Promise.all([fetchBuku(), fetchRiwayat()]);
      setTab('riwayat');
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

  const renderRiwayatItem = ({ item }: { item: Peminjaman }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: '#374151', bg: '#f3f4f6' };
    return (
      <View style={styles.riwayatCard}>
        <View style={styles.riwayatTop}>
          <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.pengarang}>{item.pengarang}</Text>
        <View style={styles.tglRow}>
          <Text style={styles.tglText}>Diajukan: {formatTgl(item.tgl_pengajuan)}</Text>
          {hitungDurasi(item) ? (
            <Text style={styles.tglText}>Durasi: {hitungDurasi(item)}</Text>
          ) : null}
          {item.tgl_jatuh_tempo ? (
            <Text style={styles.tglText}>Jatuh tempo: {formatTgl(item.tgl_jatuh_tempo)}</Text>
          ) : null}
          {item.tgl_kembali ? (
            <Text style={styles.tglText}>Dikembalikan: {formatTgl(item.tgl_kembali)}</Text>
          ) : null}
        </View>
        {item.catatan ? (
          <Text style={styles.catatan}>Catatan: {item.catatan}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Peminjaman Buku</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'ajukan' && styles.tabActive]}
          onPress={() => setTab('ajukan')}
        >
          <Text style={[styles.tabText, tab === 'ajukan' && styles.tabTextActive]}>Ajukan Pinjam</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'riwayat' && styles.tabActive]}
          onPress={() => setTab('riwayat')}
        >
          <Text style={[styles.tabText, tab === 'riwayat' && styles.tabTextActive]}>Riwayat Saya</Text>
        </TouchableOpacity>
      </View>

      {tab === 'ajukan' ? (
        <>
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
        </>
      ) : (
        loadingRiwayat ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#0f4c5c" /></View>
        ) : (
          <FlatList
            data={riwayat}
            keyExtractor={(item) => String(item.id_peminjaman)}
            renderItem={renderRiwayatItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Belum ada riwayat peminjaman</Text>
              </View>
            }
          />
        )
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
  tabs: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0f4c5c' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#0f4c5c' },
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
  riwayatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  riwayatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tglRow: { gap: 2, marginTop: 4 },
  tglText: { fontSize: 11, color: '#6b7280' },
  catatan: { fontSize: 12, color: '#dc2626', fontStyle: 'italic' },
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
