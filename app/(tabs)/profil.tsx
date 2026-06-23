import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nama?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>

        <Text style={styles.nama}>{user?.nama ?? '-'}</Text>
        <Text style={styles.username}>@{user?.username ?? '-'}</Text>

        <View style={[
          styles.roleBadge,
          user?.userType === 'anggota' ? styles.badgeSiswa : styles.badgeUser,
        ]}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() ?? ''}</Text>
        </View>

        {user?.kelas ? (
          <Text style={styles.kelas}>Kelas {user.kelas}</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
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
  footer: {
    padding: 24,
  },
  logoutBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
