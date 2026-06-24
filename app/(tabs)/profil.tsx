import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/auth';

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah kamu yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]
    );
  };

  const isAnggota = user?.userType === 'anggota';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nama?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>

        <Text style={styles.nama}>{user?.nama ?? '-'}</Text>
        <Text style={styles.username}>@{user?.username ?? '-'}</Text>

        <View style={[
          styles.roleBadge,
          isAnggota ? styles.badgeSiswa : styles.badgeUser,
        ]}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() ?? ''}</Text>
        </View>

        {user?.kelas ? (
          <Text style={styles.kelas}>Kelas {user.kelas}</Text>
        ) : null}

        {/* QR Code — hanya untuk siswa/guru */}
        {isAnggota && user?.qr_code ? (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Kartu Anggota QR</Text>
            <Text style={styles.qrSubtitle}>Tunjukkan ke petugas saat meminjam buku</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={user.qr_code}
                size={180}
                color="#0f4c5c"
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrCode}>{user.qr_code}</Text>
          </View>
        ) : null}

        {/* Tombol Keluar */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#0f4c5c',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f4c5c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  nama: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  username: {
    fontSize: 14,
    color: '#6b7280',
  },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
  },
  badgeUser: {
    backgroundColor: '#fef3c7',
  },
  badgeSiswa: {
    backgroundColor: '#dbeafe',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  kelas: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  qrBox: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f4c5c',
    letterSpacing: 1,
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
