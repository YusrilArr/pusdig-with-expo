import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPeminjaman, type Peminjaman } from '@/services/api';

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

export default function RiwayatScreen() {
  const [riwayat, setRiwayat] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRiwayat = useCallback(async () => {
    try {
      const data = await getPeminjaman();
      setRiwayat(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRiwayat().finally(() => setLoading(false));
  }, [fetchRiwayat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRiwayat();
    setRefreshing(false);
  }, [fetchRiwayat]);

  const renderItem = ({ item }: { item: Peminjaman }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: '#374151', bg: '#f3f4f6' };
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
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
        <Text style={styles.headerTitle}>Riwayat Pinjam</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : (
        <FlatList
          data={riwayat}
          keyExtractor={(item) => String(item.id_peminjaman)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Belum ada riwayat peminjaman</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f4c5c' },
  header: {
    backgroundColor: '#0f4c5c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  list: { padding: 12, gap: 10, backgroundColor: '#f3f4f6', flexGrow: 1 },
  card: {
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  judul: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  pengarang: { fontSize: 12, color: '#6b7280' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tglRow: { gap: 2, marginTop: 4 },
  tglText: { fontSize: 11, color: '#6b7280' },
  catatan: { fontSize: 12, color: '#dc2626', fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, backgroundColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
