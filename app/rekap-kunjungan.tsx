import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getKunjungan, type Kunjungan, type KunjunganSummary } from '@/services/api';

const BULAN_NAMA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTgl(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatJam(jam: string | null) {
  if (!jam) return '-';
  return jam.slice(0, 5);
}

export default function RekapKunjunganScreen() {
  const router = useRouter();
  const now = new Date();

  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState<Kunjungan[]>([]);
  const [summary, setSummary] = useState<KunjunganSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempBulan, setTempBulan] = useState(bulan);
  const [tempTahun, setTempTahun] = useState(tahun);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async (b: number, t: number) => {
    try {
      const res = await getKunjungan(b, t);
      setData(res.data);
      setSummary(res.summary);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData(bulan, tahun).finally(() => setLoading(false));
  }, [bulan, tahun, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(bulan, tahun);
    setRefreshing(false);
  }, [bulan, tahun, fetchData]);

  const handleTerapkan = () => {
    setBulan(tempBulan);
    setTahun(tempTahun);
    setShowPicker(false);
  };

  const handleEkspor = async () => {
    if (data.length === 0) {
      Alert.alert('Tidak Ada Data', 'Tidak ada data kunjungan di periode ini untuk diekspor.');
      return;
    }
    setExporting(true);
    try {
      const rows = data.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${item.nama_anggota}</td>
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${item.jenis_anggota}</td>
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${item.kelas ?? '-'}</td>
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${formatTgl(item.tanggal)}</td>
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${formatJam(item.jam_masuk)}</td>
          <td style="padding:8px;text-align:center;border:1px solid #e5e7eb">${formatJam(item.jam_keluar)}</td>
        </tr>`).join('');

      const html = `
        <html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h2 { color: #0f4c5c; margin-bottom: 4px; }
          .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
          .summary { display: flex; gap: 16px; margin-bottom: 20px; }
          .sum-box { background: #e0f2fe; border-radius: 8px; padding: 12px 20px; text-align: center; }
          .sum-val { font-size: 24px; font-weight: 800; color: #0f4c5c; }
          .sum-lbl { font-size: 12px; color: #374151; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #0f4c5c; color: #fff; padding: 10px 8px; border: 1px solid #0f4c5c; }
          td { vertical-align: middle; }
          .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: right; }
        </style></head>
        <body>
          <h2>Rekap Kunjungan Perpustakaan</h2>
          <p class="subtitle">SMPN 1 Gunung Kaler &nbsp;|&nbsp; Periode: ${BULAN_NAMA[bulan - 1]} ${tahun}</p>
          <div class="summary">
            <div class="sum-box">
              <div class="sum-val">${summary?.total ?? 0}</div>
              <div class="sum-lbl">Total Kunjungan</div>
            </div>
            <div class="sum-box">
              <div class="sum-val">${summary?.unique_anggota ?? 0}</div>
              <div class="sum-lbl">Jumlah Pengunjung</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Nama</th><th>Jenis</th><th>Kelas</th>
                <th>Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="footer">Dicetak pada ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</p>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Rekap Kunjungan ${BULAN_NAMA[bulan - 1]} ${tahun}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal mengekspor PDF');
    } finally {
      setExporting(false);
    }
  };

  const tahunOptions = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
    tahunOptions.push(y);
  }

  const renderItem = ({ item }: { item: Kunjungan }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.namaAnggota}>{item.nama_anggota}</Text>
          <Text style={styles.infoSub}>
            {item.jenis_anggota.toUpperCase()}
            {item.kelas ? ` · Kelas ${item.kelas}` : ''}
          </Text>
        </View>
        <Text style={styles.tanggal}>{formatTgl(item.tanggal)}</Text>
      </View>
      <View style={styles.jamRow}>
        <View style={styles.jamBox}>
          <Text style={styles.jamLabel}>Masuk</Text>
          <Text style={styles.jamValue}>{formatJam(item.jam_masuk)}</Text>
        </View>
        <Text style={styles.jamArrow}>→</Text>
        <View style={styles.jamBox}>
          <Text style={styles.jamLabel}>Keluar</Text>
          <Text style={[styles.jamValue, !item.jam_keluar && styles.jamEmpty]}>
            {formatJam(item.jam_keluar)}
          </Text>
        </View>
        {item.keterangan ? (
          <Text style={styles.keterangan} numberOfLines={1}>"{item.keterangan}"</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekap Kunjungan</Text>
        <TouchableOpacity
          style={styles.eksporBtn}
          onPress={handleEkspor}
          disabled={exporting}
          activeOpacity={0.7}
        >
          {exporting
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={styles.eksporBtnText}>Ekspor</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>
          {BULAN_NAMA[bulan - 1]} {tahun}
        </Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => {
          setTempBulan(bulan);
          setTempTahun(tahun);
          setShowPicker(true);
        }}>
          <Text style={styles.filterBtnText}>Ganti Periode</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total Kunjungan</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.unique_anggota}</Text>
            <Text style={styles.summaryLabel}>Jumlah Pengunjung</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id_kunjungan)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f4c5c']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Tidak ada kunjungan di periode ini</Text>
            </View>
          }
        />
      )}

      {/* Modal Pilih Periode */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Pilih Periode</Text>

            <Text style={styles.pickerSectionLabel}>Bulan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bulanScroll}>
              {BULAN_NAMA.map((nama, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.bulanChip, tempBulan === i + 1 && styles.bulanChipActive]}
                  onPress={() => setTempBulan(i + 1)}
                >
                  <Text style={[styles.bulanChipText, tempBulan === i + 1 && styles.bulanChipTextActive]}>
                    {nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerSectionLabel}>Tahun</Text>
            <View style={styles.tahunRow}>
              {tahunOptions.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.tahunChip, tempTahun === y && styles.tahunChipActive]}
                  onPress={() => setTempTahun(y)}
                >
                  <Text style={[styles.tahunChipText, tempTahun === y && styles.tahunChipTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBatal} onPress={() => setShowPicker(false)}>
                <Text style={styles.modalBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalTerapkan} onPress={handleTerapkan}>
                <Text style={styles.modalTerapkanText}>Terapkan</Text>
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
  eksporBtn: {
    backgroundColor: '#1a6b7c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  eksporBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  filterBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  filterBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#0f4c5c' },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  list: { padding: 12, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardLeft: { flex: 1 },
  namaAnggota: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  tanggal: { fontSize: 11, color: '#6b7280', textAlign: 'right' },
  jamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jamBox: { alignItems: 'center' },
  jamLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  jamValue: { fontSize: 14, fontWeight: '700', color: '#0f4c5c' },
  jamEmpty: { color: '#d1d5db' },
  jamArrow: { fontSize: 14, color: '#9ca3af', marginBottom: 2 },
  keterangan: { flex: 1, fontSize: 11, color: '#6b7280', fontStyle: 'italic' },
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
  pickerSectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  bulanScroll: { flexGrow: 0 },
  bulanChip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, marginRight: 8,
  },
  bulanChipActive: { backgroundColor: '#0f4c5c', borderColor: '#0f4c5c' },
  bulanChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  bulanChipTextActive: { color: '#ffffff' },
  tahunRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tahunChip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  tahunChipActive: { backgroundColor: '#0f4c5c', borderColor: '#0f4c5c' },
  tahunChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  tahunChipTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBatal: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  modalBatalText: { color: '#374151', fontWeight: '600' },
  modalTerapkan: {
    flex: 1, backgroundColor: '#0f4c5c',
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  modalTerapkanText: { color: '#ffffff', fontWeight: '700' },
});
