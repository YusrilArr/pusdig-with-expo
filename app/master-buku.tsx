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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getBuku,
  tambahBuku,
  editBuku,
  hapusBuku,
  getKategori,
  getRak,
  type Buku,
  type Kategori,
  type Rak,
} from '@/services/api';

type FormState = {
  judul: string;
  pengarang: string;
  penerbit: string;
  tahun_terbit: string;
  isbn: string;
  id_kategori: number | null;
  id_rak: number | null;
  stok_total: string;
};

const EMPTY_FORM: FormState = {
  judul: '',
  pengarang: '',
  penerbit: '',
  tahun_terbit: '',
  isbn: '',
  id_kategori: null,
  id_rak: null,
  stok_total: '1',
};

type PickerTarget = 'kategori' | 'rak' | null;

export default function MasterBukuScreen() {
  const router = useRouter();
  const [buku, setBuku] = useState<Buku[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [rakList, setRakList] = useState<Rak[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      const [bukuData, kategoriData, rakData] = await Promise.all([
        getBuku(),
        getKategori(),
        getRak(),
      ]);
      setBuku(bukuData);
      setKategoriList(kategoriData);
      setRakList(rakData);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    }
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (item: Buku) => {
    setEditingId(item.id_buku);
    setForm({
      judul: item.judul,
      pengarang: item.pengarang,
      penerbit: item.penerbit ?? '',
      tahun_terbit: item.tahun_terbit ?? '',
      isbn: item.isbn ?? '',
      id_kategori: kategoriList.find((k) => k.nama_kategori === item.nama_kategori)?.id_kategori ?? null,
      id_rak: rakList.find((r) => r.kode_rak === item.kode_rak)?.id_rak ?? null,
      stok_total: String(item.stok_total),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.judul.trim() || !form.pengarang.trim()) {
      setFormError('Judul dan pengarang wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        judul: form.judul.trim(),
        pengarang: form.pengarang.trim(),
        penerbit: form.penerbit.trim() || null,
        tahun_terbit: form.tahun_terbit.trim() || null,
        isbn: form.isbn.trim() || null,
        id_kategori: form.id_kategori,
        id_rak: form.id_rak,
        stok_total: parseInt(form.stok_total) || 1,
      };
      if (editingId) {
        await editBuku(editingId, payload);
      } else {
        await tambahBuku(payload);
      }
      setShowForm(false);
      await fetchAll();
    } catch (e: any) {
      setFormError(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Buku) => {
    Alert.alert(
      'Hapus Buku',
      `Yakin ingin menghapus "${item.judul}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapusBuku(item.id_buku);
              await fetchAll();
            } catch (e: any) {
              Alert.alert('Gagal', e.message || 'Gagal menghapus buku');
            }
          },
        },
      ]
    );
  };

  const selectedKategori = kategoriList.find((k) => k.id_kategori === form.id_kategori);
  const selectedRak = rakList.find((r) => r.id_rak === form.id_rak);

  const renderItem = ({ item }: { item: Buku }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.judul} numberOfLines={2}>{item.judul}</Text>
        <Text style={styles.pengarang}>{item.pengarang}</Text>
        <View style={styles.metaRow}>
          {item.nama_kategori ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.nama_kategori}</Text>
            </View>
          ) : null}
          <Text style={[styles.stok, item.stok_tersedia === 0 && styles.stokHabis]}>
            Stok: {item.stok_tersedia}/{item.stok_total}
          </Text>
        </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Data Buku</Text>
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={buku}
          keyExtractor={(item) => String(item.id_buku)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Belum ada buku. Tap "+ Tambah" untuk menambahkan.</Text>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.modalCancel}>Batal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Buku' : 'Tambah Buku'}</Text>
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

              <Text style={styles.fieldLabel}>Judul <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.judul}
                onChangeText={(v) => setForm((f) => ({ ...f, judul: v }))}
                placeholder="Judul buku"
              />

              <Text style={styles.fieldLabel}>Pengarang <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                value={form.pengarang}
                onChangeText={(v) => setForm((f) => ({ ...f, pengarang: v }))}
                placeholder="Nama pengarang"
              />

              <Text style={styles.fieldLabel}>Penerbit</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.penerbit}
                onChangeText={(v) => setForm((f) => ({ ...f, penerbit: v }))}
                placeholder="Nama penerbit"
              />

              <Text style={styles.fieldLabel}>Tahun Terbit</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.tahun_terbit}
                onChangeText={(v) => setForm((f) => ({ ...f, tahun_terbit: v }))}
                placeholder="Contoh: 2023"
                keyboardType="numeric"
                maxLength={4}
              />

              <Text style={styles.fieldLabel}>ISBN</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.isbn}
                onChangeText={(v) => setForm((f) => ({ ...f, isbn: v }))}
                placeholder="Nomor ISBN"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Stok</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.stok_total}
                onChangeText={(v) => setForm((f) => ({ ...f, stok_total: v }))}
                placeholder="Jumlah stok"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Kategori</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerTarget('kategori')}
              >
                <Text style={selectedKategori ? styles.pickerValue : styles.pickerPlaceholder}>
                  {selectedKategori ? selectedKategori.nama_kategori : 'Pilih kategori...'}
                </Text>
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Rak</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerTarget('rak')}
              >
                <Text style={selectedRak ? styles.pickerValue : styles.pickerPlaceholder}>
                  {selectedRak ? `${selectedRak.kode_rak} — ${selectedRak.lokasi}` : 'Pilih rak...'}
                </Text>
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Picker Modal */}
      <Modal
        visible={pickerTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerSheetHeader}>
              <Text style={styles.pickerSheetTitle}>
                {pickerTarget === 'kategori' ? 'Pilih Kategori' : 'Pilih Rak'}
              </Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Text style={styles.pickerClose}>Tutup</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {pickerTarget === 'kategori'
                ? kategoriList.map((k) => (
                    <TouchableOpacity
                      key={k.id_kategori}
                      style={[
                        styles.pickerOption,
                        form.id_kategori === k.id_kategori && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setForm((f) => ({ ...f, id_kategori: k.id_kategori }));
                        setPickerTarget(null);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        form.id_kategori === k.id_kategori && styles.pickerOptionTextSelected,
                      ]}>
                        {k.nama_kategori}
                      </Text>
                    </TouchableOpacity>
                  ))
                : rakList.map((r) => (
                    <TouchableOpacity
                      key={r.id_rak}
                      style={[
                        styles.pickerOption,
                        form.id_rak === r.id_rak && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setForm((f) => ({ ...f, id_rak: r.id_rak }));
                        setPickerTarget(null);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        form.id_rak === r.id_rak && styles.pickerOptionTextSelected,
                      ]}>
                        {r.kode_rak} — {r.lokasi}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </View>
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
  list: { padding: 12, gap: 10 },
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
  judul: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pengarang: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: '#0369a1', fontWeight: '600' },
  stok: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  stokHabis: { color: '#dc2626' },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  retryBtn: { backgroundColor: '#0f4c5c', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#ffffff', fontWeight: '600' },

  // Form Modal
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
  pickerBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValue: { fontSize: 14, color: '#111827' },
  pickerPlaceholder: { fontSize: 14, color: '#9ca3af' },
  pickerArrow: { fontSize: 18, color: '#9ca3af' },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerSheetTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  pickerClose: { color: '#0f4c5c', fontWeight: '600', fontSize: 14 },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: { backgroundColor: '#e0f7f4' },
  pickerOptionText: { fontSize: 14, color: '#374151' },
  pickerOptionTextSelected: { color: '#0f4c5c', fontWeight: '700' },
});
