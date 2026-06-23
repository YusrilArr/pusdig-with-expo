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
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: LoggedInUser;
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
