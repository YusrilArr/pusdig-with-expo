import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfilScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      <View style={styles.content}>
        <IconSymbol name="person.fill" size={48} color="#d1d5db" />
        <Text style={styles.placeholder}>Profil Pengguna</Text>
        <Text style={styles.placeholderSub}>Segera hadir</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 8,
  },
  placeholderSub: {
    fontSize: 13,
    color: '#d1d5db',
  },
});
