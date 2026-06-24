import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getRak, tambahRak, editRak, hapusRak, type Rak } from '@/services/api';

type FormState = { kode_rak: string; lokasi: string };
const EMPTY_FORM: FormState = { kode_rak: '', lokasi: '' };

export default function MasterRakScreen() {
  const router = useRouter();
  const [rakList, setRakList] = useState<Rak[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const fetchRak = useCallback(async () => {
    try {
      setError('');
      const data = await getRak();
      setRakList(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    }
  }, []);

  useEffect(() => {
    fetchRak().finally(() => setLoading(false));
  }, [fetchRak]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (item: Rak) => {
    setEditingId(item.id_rak);
    setForm({ kode_rak: item.kode_rak, lokasi: item.lokasi });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.kode_rak.trim() || !form.lokasi.trim()) {
      setFormError('Kode rak dan lokasi wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { kode_rak: form.kode_rak.trim(), lokasi: form.lokasi.trim() };
      if (editingId) {
        await editRak(editingId, payload);
      } else {
        await tambahRak(payload);
      }
      setShowForm(false);
      await fetchRak();
    } catch (e: any) {
      setFormError(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Rak) => {
    Alert.alert(
      'Hapus Rak',
      `Yakin ingin menghapus rak "${item.kode_rak}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapusRak(item.id_rak);
              await fetchRak();
            } catch (e: any) {
              Alert.alert('Gagal', e.message || 'Gagal menghapus rak');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Rak }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.kodeRak}>{item.kode_rak}</Text>
        <Text style={styles.lokasi}>{item.lokasi}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnEdit} onPress={() => openEdit(item)} activeOpacity={0.7}>
          <Text style={styles.btnEditText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <Text style={styles.btnDeleteText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Rak</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRak}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rakList}
          keyExtractor={(item) => String(item.id_rak)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Belum ada rak. Tap "+ Tambah" untuk menambahkan.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.modalCancel}>Batal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Rak' : 'Tambah Rak'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#0f4c5c" />
                ) : (
                  <Text style={styles.modalSave}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Text style={styles.fieldLabel}>Kode Rak <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.kode_rak}
                onChangeText={(v) => setForm((f) => ({ ...f, kode_rak: v }))}
                placeholder="Contoh: R-01"
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Lokasi <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={form.lokasi}
                onChangeText={(v) => setForm((f) => ({ ...f, lokasi: v }))}
                placeholder="Contoh: Lantai 1, Sisi Kiri dekat pintu masuk"
                multiline
                numberOfLines={3}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  addBtn: {
    backgroundColor: '#ffffff22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  list: { padding: 12, gap: 10, backgroundColor: '#f3f4f6', flexGrow: 1 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardInfo: { flex: 1 },
  kodeRak: { fontSize: 15, fontWeight: '700', color: '#111827' },
  lokasi: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  cardActions: { gap: 6 },
  btnEdit: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnEditText: { color: '#0369a1', fontWeight: '700', fontSize: 12 },
  btnDelete: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnDeleteText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12, backgroundColor: '#f3f4f6' },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  retryBtn: { backgroundColor: '#0f4c5c', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#ffffff', fontWeight: '600' },
  modalSafe: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: { color: '#6b7280', fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalSave: { color: '#0f4c5c', fontSize: 15, fontWeight: '700' },
  formContainer: { padding: 16, gap: 4 },
  formError: {
    color: '#dc2626',
    fontSize: 13,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  required: { color: '#dc2626' },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
