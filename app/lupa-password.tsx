import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LupaPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  const handleKirim = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Peringatan', 'Email tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/lupa-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengirim kode');
      setTerkirim(true);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lupa Password</Text>
            <View style={{ minWidth: 80 }} />
          </View>

          <View style={styles.body}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>🔑</Text>
            </View>

            {!terkirim ? (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.desc}>
                  Masukkan email yang terdaftar. Kami akan mengirim kode reset ke email tersebut.
                </Text>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="contoh@email.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleKirim}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.btnText}>Kirim Kode Reset</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Email Terkirim!</Text>
                <Text style={styles.desc}>
                  Jika email <Text style={styles.emailHighlight}>{email}</Text> terdaftar, kode reset telah dikirim.{'\n\n'}
                  Cek inbox Mailtrap Anda dan masukkan kode 8 karakter yang diterima.
                </Text>

                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.replace('/reset-password')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>Masukkan Kode Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={() => { setTerkirim(false); setEmail(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnOutlineText}>Kirim Ulang</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: '#0f4c5c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { minWidth: 80 },
  backText: { color: '#a8d8e8', fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', flex: 1, textAlign: 'center' },
  body: { flex: 1, padding: 24, gap: 16 },
  iconWrap: {
    alignSelf: 'center',
    backgroundColor: '#e0f2fe',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  desc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  emailHighlight: { fontWeight: '700', color: '#0f4c5c' },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  btn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: '#0f4c5c',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnOutlineText: { color: '#0f4c5c', fontWeight: '700', fontSize: 15 },
});
