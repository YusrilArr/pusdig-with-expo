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
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { login, getApiUrl, saveApiUrl } from '@/services/api';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSetting, setShowSetting] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await login(username, password);
      await signIn(result.token, result.user);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Login gagal, coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSetting = () => {
    setInputUrl(getApiUrl());
    setShowSetting(true);
  };

  const handleSaveSetting = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed.startsWith('http')) {
      Alert.alert('Format salah', 'URL harus diawali dengan http:// atau https://\nContoh: http://192.168.1.10:3000/api');
      return;
    }
    await saveApiUrl(trimmed);
    setShowSetting(false);
    Alert.alert('Tersimpan', 'URL API berhasil diperbarui.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Tombol setting di pojok kanan atas */}
      <TouchableOpacity style={styles.settingBtn} onPress={handleOpenSetting}>
        <MaterialIcons name="settings" size={22} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Pustaka Digital</Text>
        <Text style={styles.subtitle}>Perpustakaan SMPN 1 Gunung Kaler</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Masukkan password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lupaBtn}
            onPress={() => router.push('/lupa-password' as any)}
          >
            <Text style={styles.lupaText}>Lupa Password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Pengaturan URL API */}
      <Modal
        visible={showSetting}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSetting(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}></Text>
              <TouchableOpacity onPress={() => setShowSetting(false)}>
                <MaterialIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

         

            <Text style={styles.modalLabel}>URL API</Text>
            <TextInput
              style={styles.modalInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.10:3000/api"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.modalHint}>
              Contoh: http://192.168.1.10:3000/api
            </Text>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveSetting}>
              <Text style={styles.modalSaveText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4c5c',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f4c5c',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  form: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: { padding: 4 },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0f4c5c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  lupaBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  lupaText: {
    color: '#0f4c5c',
    fontSize: 14,
    fontWeight: '600',
  },
  settingBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f4c5c',
  },
  modalDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    marginBottom: 20,
  },
  modalSaveBtn: {
    backgroundColor: '#0f4c5c',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
