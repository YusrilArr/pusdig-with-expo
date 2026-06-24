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
import {
  getAnggota,
  tambahAnggota,
  editAnggota,
  hapusAnggota,
  type Anggota,
  type AnggotaPayload,
} from '@/services/api';

type FormState = {
  nis_nip: string;
  nama: string;
  jenis_anggota: 'siswa' | 'guru';
  kelas: string;
  username: string;
  password: string;
  email: string;
  no_telp: string;
  status: 'aktif' | 'nonaktif';
};

const EMPTY_FORM: FormState = {
  nis_nip: '',
  nama: '',
  jenis_anggota: 'siswa',
  kelas: '',
  username: '',
  password: '',
  email: '',
  no_telp: '',
  status: 'aktif',
};

export default function MasterAnggotaScreen() {
  const router = useRouter();
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const fetchAnggota = useCallback(async () => {
    try {
      setError('');
      const data = await getAnggota();
      setAnggotaList(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    }
  }, []);

  useEffect(() => {
    fetchAnggota().finally(() => setLoading(false));
  }, [fetchAnggota]);

  const filtered = search.trim()
    ? anggotaList.filter(
        (a) =>
          a.nama.toLowerCase().includes(search.toLowerCase()) ||
          a.nis_nip.includes(search) ||
          a.username.toLowerCase().includes(search.toLowerCase())
      )
    : anggotaList;

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (item: Anggota) => {
    setEditingId(item.id_anggota);
    setForm({
      nis_nip: item.nis_nip,
      nama: item.nama,
      jenis_anggota: item.jenis_anggota,
      kelas: item.kelas ?? '',
      username: item.username,
      password: '',
      email: item.email ?? '',
      no_telp: item.no_telp ?? '',
      status: item.status,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nis_nip.trim() || !form.nama.trim() || !form.username.trim()) {
      setFormError('NIS/NIP, nama, dan username wajib diisi');
      return;
    }
    if (!editingId && !form.password.trim()) {
      setFormError('Password wajib diisi untuk anggota baru');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload: AnggotaPayload = {
        nis_nip: form.nis_nip.trim(),
        nama: form.nama.trim(),
        jenis_anggota: form.jenis_anggota,
        kelas: form.kelas.trim() || null,
        username: form.username.trim(),
        email: form.email.trim() || null,
        no_telp: form.no_telp.trim() || null,
        status: form.status,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      if (editingId) {
        await editAnggota(editingId, payload);
      } else {
        await tambahAnggota(payload);
      }
      setShowForm(false);
      await fetchAnggota();
    } catch (e: any) {
      setFormError(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Anggota) => {
    Alert.alert(
      'Hapus Anggota',
      `Yakin ingin menghapus anggota "${item.nama}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapusAnggota(item.id_anggota);
              await fetchAnggota();
            } catch (e: any) {
              Alert.alert('Gagal', e.message || 'Gagal menghapus anggota');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Anggota }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.cardTop}>
          <Text style={styles.nama}>{item.nama}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'aktif' ? styles.statusAktif : styles.statusNonaktif,
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'aktif' ? styles.statusTextAktif : styles.statusTextNonaktif,
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.nisnip}>{item.nis_nip} · {item.jenis_anggota === 'siswa' ? 'Siswa' : 'Guru'}{item.kelas ? ` · ${item.kelas}` : ''}</Text>
        <Text style={styles.username}>@{item.username}</Text>
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
        <Text style={styles.headerTitle}>Master Anggota</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, NIS/NIP, atau username..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAnggota}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_anggota)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search ? 'Anggota tidak ditemukan' : 'Belum ada anggota. Tap "+ Tambah" untuk menambahkan.'}
              </Text>
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit Anggota' : 'Tambah Anggota'}</Text>
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

              <Text style={styles.fieldLabel}>NIS / NIP <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.nis_nip}
                onChangeText={(v) => setForm((f) => ({ ...f, nis_nip: v }))}
                placeholder="Contoh: 2024001"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Nama Lengkap <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.nama}
                onChangeText={(v) => setForm((f) => ({ ...f, nama: v }))}
                placeholder="Nama lengkap anggota"
              />

              <Text style={styles.fieldLabel}>Jenis Anggota <Text style={styles.required}>*</Text></Text>
              <View style={styles.toggleRow}>
                {(['siswa', 'guru'] as const).map((j) => (
                  <TouchableOpacity
                    key={j}
                    style={[styles.toggleBtn, form.jenis_anggota === j && styles.toggleBtnActive]}
                    onPress={() => setForm((f) => ({ ...f, jenis_anggota: j, kelas: j === 'guru' ? '' : f.kelas }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleText, form.jenis_anggota === j && styles.toggleTextActive]}>
                      {j === 'siswa' ? 'Siswa' : 'Guru'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.jenis_anggota === 'siswa' && (
                <>
                  <Text style={styles.fieldLabel}>Kelas</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.kelas}
                    onChangeText={(v) => setForm((f) => ({ ...f, kelas: v }))}
                    placeholder="Contoh: 7A, 8B, 9C"
                    autoCapitalize="characters"
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Username <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.username}
                onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
                placeholder="Username untuk login"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>
                Password {editingId ? <Text style={styles.optional}>(kosongkan jika tidak diubah)</Text> : <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'Password awal'}
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>No. Telepon</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.no_telp}
                onChangeText={(v) => setForm((f) => ({ ...f, no_telp: v }))}
                placeholder="Contoh: 08123456789"
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>
                Email <Text style={styles.optional}></Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="contoh@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {editingId ? (
                <>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.toggleRow}>
                    {(['aktif', 'nonaktif'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.toggleBtn, form.status === s && styles.toggleBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, status: s }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.toggleText, form.status === s && styles.toggleTextActive]}>
                          {s === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
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
  searchContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
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
  cardInfo: { flex: 1, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nama: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  nisnip: { fontSize: 12, color: '#6b7280' },
  username: { fontSize: 11, color: '#9ca3af' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusAktif: { backgroundColor: '#dcfce7' },
  statusNonaktif: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextAktif: { color: '#16a34a' },
  statusTextNonaktif: { color: '#6b7280' },
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
  optional: { color: '#9ca3af', fontWeight: '400' },
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
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { borderColor: '#0f4c5c', backgroundColor: '#e0f7f4' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#0f4c5c' },
});
