import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { LoggedInUser } from '@/services/api';
import { useAuth } from '@/context/auth';

type IconName = 'books.vertical.fill' | 'doc.badge.plus' | 'person.fill' | 'building.2.fill' | 'square.grid.2x2.fill' | 'tray.fill' | 'qrcode' | 'chart.bar.doc.horizontal' | 'externaldrive.fill' | 'map.fill';

type MenuItem = {
  icon: IconName;
  label: string;
  route: string;
  color: string;
  roles: LoggedInUser['role'][];
};

const CARD_WIDTH = (Dimensions.get('window').width - 16 * 2 - 12) / 2;

const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'books.vertical.fill',
    label: 'Daftar Buku',
    route: '/(tabs)/buku',
    color: '#0f4c5c',
    roles: ['admin', 'petugas', 'kepala_sekolah', 'siswa', 'guru'],
  },
  {
    icon: 'externaldrive.fill',
    label: 'Data Master',
    route: '/data-master',
    color: '#dc2626',
    roles: ['admin'],
  },
  {
    icon: 'doc.badge.plus',
    label: 'Pinjam Buku',
    route: '/peminjaman',
    color: '#16a34a',
    roles: ['siswa', 'guru'],
  },
  {
    icon: 'person.fill',
    label: 'Profil Saya',
    route: '/(tabs)/profil',
    color: '#7c3aed',
    roles: ['siswa', 'guru'],
  },
  {
    icon: 'tray.fill',
    label: 'Kelola Peminjaman',
    route: '/kelola-peminjaman',
    color: '#7c3aed',
    roles: ['admin', 'petugas'],
  },
  {
    icon: 'qrcode',
    label: 'Scan QR',
    route: '/scan-qr',
    color: '#0369a1',
    roles: ['admin', 'petugas'],
  },
  {
    icon: 'chart.bar.doc.horizontal',
    label: 'Rekap Kunjungan',
    route: '/rekap-kunjungan',
    color: '#0369a1',
    roles: ['admin', 'petugas', 'kepala_sekolah'],
  },
  {
    icon: 'map.fill',
    label: 'Tata Letak Buku',
    route: '/tata-letak-buku',
    color: '#d97706',
    roles: ['admin', 'petugas', 'kepala_sekolah', 'siswa', 'guru'],
  },
  {
    icon: 'building.2.fill',
    label: 'Profil Perpustakaan',
    route: '/profil-perpustakaan',
    color: '#b45309',
    roles: ['admin', 'petugas', 'kepala_sekolah', 'siswa', 'guru'],
  },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const visibleMenus = user
    ? MENU_ITEMS.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Pustaka Digital</Text>
          <Text style={styles.appSubtitle}>Perpustakaan SMPN 1 Gunung Kaler</Text>
        </View>

        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <View>
            <Text style={styles.greetingHello}>Halo,</Text>
            <Text style={styles.greetingName}>{user?.nama ?? '...'}</Text>
          </View>
          <View style={[
            styles.roleBadge,
            user?.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeSiswa,
          ]}>
            <Text style={styles.roleText}>
              {user?.role?.toUpperCase() ?? ''}
            </Text>
          </View>
        </View>

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.grid}>
          {visibleMenus.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                <IconSymbol name={item.icon} size={30} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#0f4c5c',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#a8d8e8',
    marginTop: 2,
  },
  greetingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingHello: {
    fontSize: 13,
    color: '#6b7280',
  },
  greetingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#fef3c7',
  },
  roleBadgeSiswa: {
    backgroundColor: '#dbeafe',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
