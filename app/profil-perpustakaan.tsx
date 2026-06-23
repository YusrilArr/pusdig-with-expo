import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getProfilSekolah, type ProfilSekolah } from '@/services/api';

type InfoRowProps = { label: string; value: string | null };

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfilPerpustakaanScreen() {
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilSekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfil = async () => {
    try {
      setError('');
      const data = await getProfilSekolah();
      setProfil(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Perpustakaan</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfil}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : profil ? (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Logo placeholder */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>
                {profil.nama_sekolah.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.namaAplikasi}>{profil.nama_aplikasi}</Text>
            <Text style={styles.namaSekolah}>{profil.nama_sekolah}</Text>
          </View>

          {/* Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Sekolah</Text>
            <InfoRow label="Nama Sekolah" value={profil.nama_sekolah} />
            <InfoRow label="Alamat" value={profil.alamat} />
            <InfoRow label="No. Telepon" value={profil.no_telp} />
            <InfoRow label="Email" value={profil.email} />
          </View>

          {/* Deskripsi */}
          {profil.deskripsi ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tentang Perpustakaan</Text>
              <Text style={styles.deskripsi}>{profil.deskripsi}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
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
  backBtn: { minWidth: 70 },
  backText: { color: '#a8d8e8', fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', flex: 1, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
  retryBtn: { backgroundColor: '#0f4c5c', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#ffffff', fontWeight: '600' },
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0f4c5c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: { fontSize: 36, fontWeight: '800', color: '#ffffff' },
  namaAplikasi: { fontSize: 22, fontWeight: '800', color: '#0f4c5c' },
  namaSekolah: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f4c5c',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  infoLabel: { fontSize: 13, color: '#6b7280', width: 110 },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },
  deskripsi: { fontSize: 13, color: '#374151', lineHeight: 22 },
});
