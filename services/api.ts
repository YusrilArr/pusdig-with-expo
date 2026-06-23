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
