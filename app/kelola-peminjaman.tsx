import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getPeminjaman, prosesPeminjaman, type Peminjaman } from '@/services/api';

type FilterTab = 'menunggu' | 'aktif' | 'selesai';

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

export default function KelolaPeminjamanScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>('menunggu');
  const [semua, setSemua] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  const [tolakModal, setTolakModal] = useState<Peminjaman | null>(null);
  const [catatanTolak, setCatatanTolak] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await getPeminjaman();
      setSemua(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filtered = semua.filter((p) => {
    if (tab === 'menunggu') return p.status === 'diajukan';
    if (tab === 'aktif') return p.status === 'dipinjam' || p.status === 'terlambat';
    return ['dikembalikan', 'ditolak', 'hilang'].includes(p.status);
  });

  const handleSetujui = (item: Peminjaman) => {
    Alert.alert(
      'Setujui Peminjaman',
      `Setujui peminjaman "${item.judul}" oleh ${item.nama_anggota}?\n\nDurasi: ${item.durasi_pinjam ?? 7} hari dari sekarang.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: async () => {
            setProcessing(item.id_peminjaman);
            try {
              await prosesPeminjaman(item.id_peminjaman, 'setujui');
              await fetchData();
              setTab('aktif');
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleTolak = async () => {
    if (!tolakModal) return;
    setProcessing(tolakModal.id_peminjaman);
    try {
      await prosesPeminjaman(tolakModal.id_peminjaman, 'tolak', catatanTolak || undefined);
      setTolakModal(null);
      setCatatanTolak('');
      await fetchData();
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleKembalikan = (item: Peminjaman) => {
    Alert.alert(
      'Konfirmasi Pengembalian',
      `Buku "${item.judul}" milik ${item.nama_anggota} telah dikembalikan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kembalikan',
          onPress: async () => {
            setProcessing(item.id_peminjaman);
            try {
              await prosesPeminjaman(item.id_peminjaman, 'kembalikan');
              await fetchData();
              setTab('selesai');
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Peminjaman }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: '#374151', bg: '#f3f4f6' };
    const isProcessing = processing === item.id_peminjaman;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>
            <Text style={styles.anggota}>
              {item.nama_anggota}{item.kelas ? ` · Kelas ${item.kelas}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

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
          <Text style={styles.catatan}>Alasan: {item.catatan}</Text>
        ) : null}

        {/* Action buttons */}
        {item.status === 'diajukan' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSetujui, isProcessing && styles.btnDisabled]}
              onPress={() => handleSetujui(item)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnSetujuiText}>Setujui</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnTolak, isProcessing && styles.btnDisabled]}
              onPress={() => { setTolakModal(item); setCatatanTolak(''); }}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={styles.btnTolakText}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}

        {(item.status === 'dipinjam' || item.status === 'terlambat') && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnKembalikan, isProcessing && styles.btnDisabled]}
              onPress={() => handleKembalikan(item)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnKembalikanText}>Kembalikan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const tabCount = (t: FilterTab) => semua.filter((p) => {
    if (t === 'menunggu') return p.status === 'diajukan';
    if (t === 'aktif') return p.status === 'dipinjam' || p.status === 'terlambat';
    return ['dikembalikan', 'ditolak', 'hilang'].includes(p.status);
  }).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Peminjaman</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {(['menunggu', 'aktif', 'selesai'] as FilterTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'menunggu' ? 'Menunggu' : t === 'aktif' ? 'Aktif' : 'Selesai'}
            </Text>
            {tabCount(t) > 0 && (
              <View style={[styles.tabBadge, tab === t && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === t && styles.tabBadgeTextActive]}>
                  {tabCount(t)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0f4c5c" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_peminjaman)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Tidak ada data</Text>
            </View>
          }
        />
      )}

      {/* Modal Tolak */}
      <Modal visible={tolakModal !== null} transparent animationType="fade" onRequestClose={() => setTolakModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tolak Peminjaman</Text>
            <Text style={styles.modalDesc}>
              Tolak peminjaman "{tolakModal?.judul}" oleh {tolakModal?.nama_anggota}?
            </Text>
            <TextInput
              style={styles.catatanInput}
              placeholder="Alasan penolakan (opsional)"
              value={catatanTolak}
              onChangeText={setCatatanTolak}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBatal} onPress={() => setTolakModal(null)}>
                <Text style={styles.modalBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTolak, processing !== null && styles.btnDisabled]}
                onPress={handleTolak}
                disabled={processing !== null}
              >
                {processing !== null ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalTolakText}>Tolak</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0f4c5c' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#0f4c5c' },
  tabBadge: { backgroundColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: '#0f4c5c' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
  tabBadgeTextActive: { color: '#ffffff' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardInfo: { flex: 1 },
  judul: { fontSize: 14, fontWeight: '700', color: '#111827' },
  anggota: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tglRow: { gap: 2 },
  tglText: { fontSize: 11, color: '#6b7280' },
  catatan: { fontSize: 12, color: '#dc2626', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnSetujui: {
    flex: 1, backgroundColor: '#16a34a', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnSetujuiText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  btnTolak: {
    flex: 1, backgroundColor: '#fee2e2', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnTolakText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  btnKembalikan: {
    flex: 1, backgroundColor: '#0f4c5c', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnKembalikanText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  modalOverlay: {
    flex: 1, backgroundColor: '#00000066',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 20, width: '100%', gap: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalDesc: { fontSize: 13, color: '#6b7280' },
  catatanInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, minHeight: 72, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBatal: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  modalBatalText: { color: '#374151', fontWeight: '600' },
  modalTolak: {
    flex: 1, backgroundColor: '#dc2626',
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  modalTolakText: { color: '#ffffff', fontWeight: '700' },
});
