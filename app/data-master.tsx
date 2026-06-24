import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

const MENU = [
  {
    label: 'Master Buku',
    desc: 'Tambah, edit, dan hapus data buku',
    route: '/master-buku',
    icon: 'books.vertical.fill' as const,
    color: '#0f4c5c',
  },
  {
    label: 'Master Rak',
    desc: 'Kelola data rak dan lokasi penyimpanan',
    route: '/master-rak',
    icon: 'square.grid.2x2.fill' as const,
    color: '#0369a1',
  },
  {
    label: 'Master Kategori',
    desc: 'Kelola kategori dan jenis buku',
    route: '/master-kategori',
    icon: 'tray.fill' as const,
    color: '#7c3aed',
  },
];

export default function DataMasterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Master</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      <View style={styles.content}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
              <IconSymbol name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  content: { flex: 1, backgroundColor: '#f3f4f6', padding: 16, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardDesc: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  arrow: { fontSize: 22, color: '#9ca3af' },
});
