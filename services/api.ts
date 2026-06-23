// Base URL backend diambil dari environment variable EXPO_PUBLIC_API_URL
// yang diset di file .env pada root project Expo.
// Contoh isi .env: EXPO_PUBLIC_API_URL=http://192.168.1.5:3000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id_user: number;
    nama: string;
    username: string;
    role: string;
  };
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
