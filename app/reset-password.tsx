import { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [kode, setKode] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [berhasil, setBerhasil] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleReset = async () => {
    if (!kode.trim()) {
      Alert.alert('Peringatan', 'Kode reset tidak boleh kosong');
      return;
    }
    if (passwordBaru.length < 6) {
      Alert.alert('Peringatan', 'Password minimal 6 karakter');
      return;
    }
    if (passwordBaru !== konfirmasi) {
      Alert.alert('Peringatan', 'Konfirmasi password tidak cocok');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode: kode.trim(), password_baru: passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal reset password');
      setBerhasil(true);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleKirimUlang = async () => {
    if (countdown > 0 || resending || !email) return;
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/auth/lupa-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengirim ulang kode');
      setCountdown(60);
      Alert.alert('Terkirim', 'Kode reset telah dikirim ulang ke email Anda.');
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setResending(false);
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
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={{ minWidth: 80 }} />
          </View>

          <View style={styles.body}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>{berhasil ? '✅' : '🔒'}</Text>
            </View>

            {!berhasil ? (
              <>
                <Text style={styles.title}>Password Baru</Text>
                <Text style={styles.desc}>
                  Masukkan kode 8 karakter yang diterima di email, lalu buat password baru.
                </Text>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Kode Reset</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan kode dari email"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={kode}
                    onChangeText={setKode}
                    editable={!loading}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Password Baru</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={passwordBaru}
                      onChangeText={setPasswordBaru}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                      <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Konfirmasi Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Ulangi password baru"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showKonfirmasi}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={konfirmasi}
                      onChangeText={setKonfirmasi}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowKonfirmasi((v) => !v)} style={styles.eyeBtn}>
                      <MaterialIcons name={showKonfirmasi ? 'visibility' : 'visibility-off'} size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.btnText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                {email ? (
                  <TouchableOpacity
                    style={[styles.btnOutline, (countdown > 0 || resending) && styles.btnDisabled]}
                    onPress={handleKirimUlang}
                    disabled={countdown > 0 || resending}
                    activeOpacity={0.8}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color="#0f4c5c" />
                    ) : (
                      <Text style={styles.btnOutlineText}>
                        {countdown > 0 ? `Kirim Ulang Kode (${countdown}s)` : 'Kirim Ulang Kode'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.title}>Password Berhasil Direset!</Text>
                <Text style={styles.desc}>
                  Password Anda telah berhasil diperbarui. Silakan login menggunakan password baru.
                </Text>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>Kembali ke Login</Text>
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
  safe: { flex: 1, backgroundColor: '#0f4c5c' },
  scroll: { flexGrow: 1, backgroundColor: '#f3f4f6' },
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111827' },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
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
