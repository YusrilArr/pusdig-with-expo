import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getBukuByQr, getAnggotaByQr, catatKunjungan, type Buku, type AnggotaQR } from '@/services/api';

type ScanResult =
  | { type: 'buku'; data: Buku }
  | { type: 'anggota'; data: AnggotaQR }
  | null;

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setResult(null);

    try {
      if (data.startsWith('BUKU-')) {
        const buku = await getBukuByQr(data);
        setResult({ type: 'buku', data: buku });
      } else if (data.startsWith('QR-')) {
        const anggota = await getAnggotaByQr(data);
        setResult({ type: 'anggota', data: anggota });
      } else {
        Alert.alert('QR Tidak Dikenal', `Kode "${data}" bukan QR buku atau anggota perpustakaan.`);
        setScanned(false);
      }
    } catch (e: any) {
      Alert.alert('Tidak Ditemukan', e.message || 'Data tidak ditemukan');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleScanLagi = () => {
    setScanned(false);
    setResult(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ minWidth: 70 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.permissionText}>Izin kamera diperlukan untuk scan QR.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
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
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      {!result ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
          </View>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Mencari data...</Text>
            </View>
          )}
          <Text style={styles.scanHint}>Arahkan kamera ke QR Code buku atau kartu anggota</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {result.type === 'buku' ? (
            <BukuCard buku={result.data} />
          ) : (
            <AnggotaCard anggota={result.data} />
          )}
          <TouchableOpacity style={styles.scanLagiBtn} onPress={handleScanLagi} activeOpacity={0.8}>
            <Text style={styles.scanLagiBtnText}>Scan QR Lagi</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BukuCard({ buku }: { buku: Buku }) {
  const stokOk = buku.stok_tersedia > 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardIconRow}>
        <View style={[styles.cardIcon, { backgroundColor: '#0f4c5c20' }]}>
          <Text style={styles.cardIconText}>📚</Text>
        </View>
        <View style={styles.cardTypeBadge}>
          <Text style={styles.cardTypeText}>BUKU</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{buku.judul}</Text>
      <Text style={styles.cardSub}>{buku.pengarang}</Text>

      <View style={styles.divider} />

      <InfoRow label="Kategori" value={buku.nama_kategori ?? '-'} />
      <InfoRow label="Rak" value={buku.kode_rak ? `${buku.kode_rak} — ${buku.lokasi_rak ?? ''}` : '-'} />
      <InfoRow label="ISBN" value={buku.isbn ?? '-'} />
      <InfoRow label="Penerbit" value={buku.penerbit ?? '-'} />
      <InfoRow label="Tahun" value={buku.tahun_terbit ?? '-'} />

      <View style={styles.divider} />

      <View style={styles.stokRow}>
        <Text style={styles.stokLabel}>Stok Tersedia</Text>
        <View style={[styles.stokBadge, { backgroundColor: stokOk ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.stokValue, { color: stokOk ? '#16a34a' : '#dc2626' }]}>
            {buku.stok_tersedia} / {buku.stok_total}
          </Text>
        </View>
      </View>
    </View>
  );
}

function AnggotaCard({ anggota }: { anggota: AnggotaQR }) {
  const [loading, setLoading] = useState(false);
  const [tercatat, setTercatat] = useState<'masuk' | 'keluar' | null>(null);

  const handleCatatKunjungan = async () => {
    setLoading(true);
    try {
      const res = await catatKunjungan(anggota.id_anggota);
      setTercatat(res.tipe);
      const label = res.tipe === 'keluar' ? 'Keluar' : 'Masuk';
      Alert.alert('Berhasil', `${anggota.nama} — ${label} berhasil dicatat.`);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal mencatat kunjungan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardIconRow}>
        <View style={[styles.cardIcon, { backgroundColor: '#7c3aed20' }]}>
          <Text style={styles.cardIconText}>👤</Text>
        </View>
        <View style={[styles.cardTypeBadge, { backgroundColor: '#ede9fe' }]}>
          <Text style={[styles.cardTypeText, { color: '#7c3aed' }]}>ANGGOTA</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{anggota.nama}</Text>
      <Text style={styles.cardSub}>{anggota.jenis_anggota.toUpperCase()}</Text>

      <View style={styles.divider} />

      <InfoRow label="NIS/NIP" value={anggota.nis_nip ?? '-'} />
      {anggota.kelas ? <InfoRow label="Kelas" value={anggota.kelas} /> : null}
      <InfoRow label="Status" value={anggota.status.toUpperCase()} />
      <InfoRow label="Kode QR" value={anggota.qr_code} />

      <View style={styles.divider} />

      {tercatat ? (
        <View style={styles.tercatatBadge}>
          <Text style={styles.tercatatText}>
            ✓ {tercatat === 'keluar' ? 'Jam keluar dicatat' : 'Jam masuk dicatat'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.kunjunganBtn, loading && styles.btnDisabled]}
          onPress={handleCatatKunjungan}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.kunjunganBtnText}>Catat Kunjungan</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  permissionText: { fontSize: 15, color: '#374151', textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#0f4c5c', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  permissionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  scanHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    backgroundColor: '#00000066',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resultContainer: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  cardIconText: { fontSize: 22 },
  cardTypeBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardTypeText: { fontSize: 11, fontWeight: '700', color: '#0369a1' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  cardSub: { fontSize: 13, color: '#6b7280' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 13, color: '#6b7280', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 2, textAlign: 'right' },
  stokRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stokLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  stokBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  stokValue: { fontSize: 14, fontWeight: '700' },
  scanLagiBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanLagiBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  kunjunganBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  kunjunganBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  tercatatBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tercatatText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
});
