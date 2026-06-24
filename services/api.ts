import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type UserType = 'user' | 'anggota';

export type LoggedInUser = {
  id: number;
  nama: string;
  username: string;
  role: 'admin' | 'petugas' | 'kepala_sekolah' | 'siswa' | 'guru';
  userType: UserType;
  kelas?: string | null;
  qr_code?: string | null;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: LoggedInUser;
};

export type Kategori = {
  id_kategori: number;
  nama_kategori: string;
};

export type Rak = {
  id_rak: number;
  kode_rak: string;
  lokasi: string;
};

export type Buku = {
  id_buku: number;
  judul: string;
  pengarang: string;
  penerbit: string | null;
  tahun_terbit: string | null;
  isbn: string | null;
  stok_total: number;
  stok_tersedia: number;
  gambar_sampul: string | null;
  status: string;
  nama_kategori: string | null;
  kode_rak: string | null;
  lokasi_rak: string | null;
};

async function getToken(): Promise<string> {
  const token = await SecureStore.getItemAsync('token');
  if (!token) throw new Error('Sesi tidak ditemukan, silakan login ulang');
  return token;
}

async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Request gagal');
  return data;
}

export async function getBuku(): Promise<Buku[]> {
  const data = await authFetch('/buku');
  return data.data;
}

export async function getBukuById(id: number): Promise<Buku> {
  const data = await authFetch(`/buku/${id}`);
  return data.data;
}

export async function tambahBuku(payload: Partial<Buku>): Promise<{ id_buku: number }> {
  const data = await authFetch('/buku', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { id_buku: data.id_buku };
}

export async function editBuku(id: number, payload: Partial<Buku>): Promise<void> {
  await authFetch(`/buku/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function hapusBuku(id: number): Promise<void> {
  await authFetch(`/buku/${id}`, { method: 'DELETE' });
}

export async function getKategori(): Promise<Kategori[]> {
  const data = await authFetch('/kategori');
  return data.data;
}

export async function getRak(): Promise<Rak[]> {
  const data = await authFetch('/rak');
  return data.data;
}

export async function tambahRak(payload: { kode_rak: string; lokasi: string }): Promise<void> {
  await authFetch('/rak', { method: 'POST', body: JSON.stringify(payload) });
}

export async function editRak(id: number, payload: { kode_rak: string; lokasi: string }): Promise<void> {
  await authFetch(`/rak/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function hapusRak(id: number): Promise<void> {
  await authFetch(`/rak/${id}`, { method: 'DELETE' });
}

export type ProfilSekolah = {
  id: number;
  nama_sekolah: string;
  nama_aplikasi: string;
  alamat: string | null;
  no_telp: string | null;
  email: string | null;
  logo: string | null;
  deskripsi: string | null;
  updated_at: string;
};

export async function getProfilSekolah(): Promise<ProfilSekolah> {
  const data = await authFetch('/profil-sekolah');
  return data.data;
}

export type Peminjaman = {
  id_peminjaman: number;
  id_buku: number;
  id_anggota: number;
  id_user: number | null;
  tgl_pengajuan: string;
  tgl_pinjam: string | null;
  tgl_jatuh_tempo: string | null;
  tgl_kembali: string | null;
  status: 'diajukan' | 'disetujui' | 'ditolak' | 'dipinjam' | 'dikembalikan' | 'terlambat' | 'hilang';
  durasi_pinjam: number | null;
  catatan: string | null;
  judul: string;
  pengarang: string;
  gambar_sampul?: string | null;
  nama_anggota?: string;
  kelas?: string | null;
  nama_petugas?: string | null;
};

export async function getPeminjaman(status?: string): Promise<Peminjaman[]> {
  const query = status ? `?status=${status}` : '';
  const data = await authFetch(`/peminjaman${query}`);
  return data.data;
}

export async function ajukanPeminjaman(id_buku: number, durasi_pinjam: number): Promise<void> {
  await authFetch('/peminjaman', {
    method: 'POST',
    body: JSON.stringify({ id_buku, durasi_pinjam }),
  });
}

export type AnggotaQR = {
  id_anggota: number;
  nis_nip: string | null;
  nama: string;
  jenis_anggota: string;
  kelas: string | null;
  status: string;
  qr_code: string;
};

export async function getBukuByQr(kode: string): Promise<Buku> {
  const data = await authFetch(`/buku/qr/${encodeURIComponent(kode)}`);
  return data.data;
}

export async function getAnggotaByQr(kode: string): Promise<AnggotaQR> {
  const data = await authFetch(`/anggota/qr/${encodeURIComponent(kode)}`);
  return data.data;
}

export async function prosesPeminjaman(
  id: number,
  action: 'setujui' | 'tolak' | 'kembalikan',
  catatan?: string
): Promise<void> {
  await authFetch(`/peminjaman/${id}/proses`, {
    method: 'PUT',
    body: JSON.stringify({ action, catatan }),
  });
}

export type Kunjungan = {
  id_kunjungan: number;
  tanggal: string;
  jam_masuk: string;
  jam_keluar: string | null;
  keterangan: string | null;
  nama_anggota: string;
  jenis_anggota: string;
  kelas: string | null;
  nis_nip: string | null;
};

export type KunjunganSummary = {
  total: number;
  unique_anggota: number;
  bulan: number;
  tahun: number;
};

export async function getKunjungan(bulan?: number, tahun?: number): Promise<{ data: Kunjungan[]; summary: KunjunganSummary }> {
  const params = new URLSearchParams();
  if (bulan) params.append('bulan', String(bulan));
  if (tahun) params.append('tahun', String(tahun));
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await authFetch(`/kunjungan${query}`);
  return { data: res.data, summary: res.summary };
}

export async function catatKunjungan(id_anggota: number, keterangan?: string): Promise<{ id_kunjungan: number; tipe: 'masuk' | 'keluar' }> {
  const res = await authFetch('/kunjungan', {
    method: 'POST',
    body: JSON.stringify({ id_anggota, keterangan }),
  });
  return { id_kunjungan: res.id_kunjungan, tipe: res.tipe };
}

export async function catatKeluar(id_kunjungan: number): Promise<void> {
  await authFetch(`/kunjungan/${id_kunjungan}/keluar`, { method: 'PUT' });
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  if (!API_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_URL belum diset. Cek file .env di root project Expo.'
    );
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Login gagal');
  }

  return data;
}
