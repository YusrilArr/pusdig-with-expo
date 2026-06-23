-- =========================================================
-- Database: db_perpustakaan
-- Aplikasi  : Rancang Bangun Aplikasi Pendataan Buku
--             Berbasis Android Dengan QR Code
-- Studi Kasus: SMPN 1 Gunung Kaler - Kabupaten Tangerang
-- Versi 2 - disesuaikan dengan daftar kebutuhan fungsional
-- =========================================================

CREATE DATABASE IF NOT EXISTS db_perpustakaan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_perpustakaan;

-- ---------------------------------------------------------
-- Tabel: kategori_buku
-- ---------------------------------------------------------
CREATE TABLE kategori_buku (
    id_kategori   INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: rak
-- ---------------------------------------------------------
CREATE TABLE rak (
    id_rak     INT AUTO_INCREMENT PRIMARY KEY,
    kode_rak   VARCHAR(20) NOT NULL UNIQUE,
    lokasi     VARCHAR(150) NOT NULL COMMENT 'Contoh: Lantai 1, Sudut kiri dekat jendela',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: users
-- Akun untuk Admin, Petugas, dan Kepala Sekolah
-- Mendukung fitur #1 Login, #9 Akun per pengguna, #12 Lupa Password
-- ---------------------------------------------------------
CREATE TABLE users (
    id_user                INT AUTO_INCREMENT PRIMARY KEY,
    nama                    VARCHAR(100) NOT NULL,
    username                VARCHAR(50) NOT NULL UNIQUE,
    password                VARCHAR(255) NOT NULL COMMENT 'Disimpan dalam bentuk hash, contoh: bcrypt',
    role                    ENUM('admin', 'petugas', 'kepala_sekolah') NOT NULL DEFAULT 'petugas',
    foto_profil             VARCHAR(255) NULL COMMENT 'Untuk menu profil pengguna',
    reset_token             VARCHAR(255) NULL COMMENT 'Token sementara untuk fitur lupa password',
    reset_token_expired_at  DATETIME NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: anggota
-- Siswa/guru. Sekarang punya akun login sendiri karena ada
-- fitur "pengajuan peminjaman" dan "akun untuk setiap pengguna",
-- yang berarti siswa juga login mandiri dan bisa mengajukan
-- peminjaman lewat HP-nya sendiri, tidak hanya lewat scan QR
-- oleh petugas
-- ---------------------------------------------------------
CREATE TABLE anggota (
    id_anggota              INT AUTO_INCREMENT PRIMARY KEY,
    nis_nip                 VARCHAR(30) NOT NULL UNIQUE COMMENT 'NIS untuk siswa, NIP untuk guru',
    nama                     VARCHAR(100) NOT NULL,
    jenis_anggota            ENUM('siswa', 'guru') NOT NULL DEFAULT 'siswa',
    kelas                    VARCHAR(20) NULL COMMENT 'Diisi jika jenis_anggota = siswa',
    username                VARCHAR(50) NULL UNIQUE COMMENT 'Untuk login mandiri ke aplikasi',
    password                VARCHAR(255) NULL COMMENT 'Disimpan dalam bentuk hash',
    qr_code                  VARCHAR(100) NOT NULL UNIQUE COMMENT 'Kode unik di kartu anggota, untuk scan kunjungan/peminjaman',
    foto_profil              VARCHAR(255) NULL,
    no_telp                  VARCHAR(20) NULL,
    reset_token              VARCHAR(255) NULL,
    reset_token_expired_at   DATETIME NULL,
    status                   ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: buku
-- ---------------------------------------------------------
CREATE TABLE buku (
    id_buku        INT AUTO_INCREMENT PRIMARY KEY,
    judul          VARCHAR(200) NOT NULL,
    pengarang      VARCHAR(100) NULL,
    penerbit       VARCHAR(100) NULL,
    tahun_terbit   YEAR NULL,
    isbn           VARCHAR(30) NULL,
    id_kategori    INT NOT NULL,
    id_rak         INT NULL,
    qr_code        VARCHAR(100) NOT NULL UNIQUE COMMENT 'Kode unik per buku, dicetak & ditempel di buku fisik',
    stok_total     INT NOT NULL DEFAULT 1,
    stok_tersedia  INT NOT NULL DEFAULT 1,
    gambar_sampul  VARCHAR(255) NULL,
    status         ENUM('tersedia', 'habis', 'rusak') NOT NULL DEFAULT 'tersedia',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_buku_kategori FOREIGN KEY (id_kategori) REFERENCES kategori_buku(id_kategori)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_buku_rak FOREIGN KEY (id_rak) REFERENCES rak(id_rak)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: peminjaman
-- Sekarang mendukung alur "pengajuan" (request lewat app oleh
-- anggota) yang baru kemudian disetujui/ditolak oleh petugas,
-- bukan hanya transaksi langsung yang diinput petugas di meja
-- ---------------------------------------------------------
CREATE TABLE peminjaman (
    id_peminjaman    INT AUTO_INCREMENT PRIMARY KEY,
    id_buku          INT NOT NULL,
    id_anggota       INT NOT NULL COMMENT 'Yang mengajukan/meminjam',
    id_user          INT NULL COMMENT 'Petugas yang memproses, NULL saat masih berstatus diajukan',
    tgl_pengajuan    DATETIME NOT NULL COMMENT 'Waktu pengajuan dibuat oleh anggota',
    tgl_pinjam       DATE NULL COMMENT 'Diisi saat petugas menyetujui & menyerahkan buku',
    tgl_jatuh_tempo  DATE NULL,
    tgl_kembali      DATE NULL,
    status           ENUM('diajukan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat', 'hilang')
                     NOT NULL DEFAULT 'diajukan',
    catatan          VARCHAR(255) NULL COMMENT 'Contoh: alasan penolakan',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pinjam_buku FOREIGN KEY (id_buku) REFERENCES buku(id_buku)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pinjam_anggota FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pinjam_user FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: kunjungan (BARU)
-- Mencatat kunjungan siswa/guru ke perpustakaan, terpisah
-- dari transaksi peminjaman. Menjawab fitur #7: rekapitulasi
-- data kunjungan
-- ---------------------------------------------------------
CREATE TABLE kunjungan (
    id_kunjungan INT AUTO_INCREMENT PRIMARY KEY,
    id_anggota   INT NOT NULL,
    tanggal      DATE NOT NULL,
    jam_masuk    TIME NOT NULL,
    jam_keluar   TIME NULL,
    keterangan   VARCHAR(255) NULL COMMENT 'Contoh: tujuan kunjungan',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kunjungan_anggota FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: profil_sekolah (BARU)
-- Tabel pengaturan, hanya berisi 1 baris data
-- Menjawab fitur #10: profil perusahaan/instansi
-- ---------------------------------------------------------
CREATE TABLE profil_sekolah (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nama_sekolah    VARCHAR(150) NOT NULL,
    nama_aplikasi   VARCHAR(100) NOT NULL DEFAULT 'Pendataan Buku',
    alamat          VARCHAR(255) NULL,
    no_telp         VARCHAR(20) NULL,
    email           VARCHAR(100) NULL,
    logo            VARCHAR(255) NULL,
    deskripsi       TEXT NULL COMMENT 'Visi misi/profil singkat perpustakaan',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: stock_opname
-- ---------------------------------------------------------
CREATE TABLE stock_opname (
    id_stock_opname INT AUTO_INCREMENT PRIMARY KEY,
    id_user         INT NOT NULL,
    tanggal         DATE NOT NULL,
    keterangan      VARCHAR(255) NULL,
    status          ENUM('proses', 'selesai') NOT NULL DEFAULT 'proses',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_opname_user FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: stock_opname_detail
-- ---------------------------------------------------------
CREATE TABLE stock_opname_detail (
    id_detail       INT AUTO_INCREMENT PRIMARY KEY,
    id_stock_opname INT NOT NULL,
    id_buku         INT NOT NULL,
    stok_sistem     INT NOT NULL COMMENT 'Stok menurut data sistem',
    stok_fisik      INT NOT NULL COMMENT 'Stok hasil hitung fisik di rak',
    selisih         INT GENERATED ALWAYS AS (stok_fisik - stok_sistem) STORED,
    keterangan      VARCHAR(255) NULL COMMENT 'Contoh: hilang, rusak, ditemukan',
    CONSTRAINT fk_detail_opname FOREIGN KEY (id_stock_opname) REFERENCES stock_opname(id_stock_opname)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detail_buku FOREIGN KEY (id_buku) REFERENCES buku(id_buku)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Index tambahan untuk mempercepat pencarian & pelaporan
-- ---------------------------------------------------------
CREATE INDEX idx_buku_judul ON buku(judul);
CREATE INDEX idx_peminjaman_status ON peminjaman(status);
CREATE INDEX idx_anggota_nama ON anggota(nama);
CREATE INDEX idx_kunjungan_tanggal ON kunjungan(tanggal);

-- =========================================================
-- DATA AWAL (SEED DATA) - untuk testing/demo aplikasi
-- =========================================================

INSERT INTO kategori_buku (nama_kategori) VALUES
('Pelajaran'), ('Fiksi'), ('Non-Fiksi'), ('Referensi/Ensiklopedia');

INSERT INTO rak (kode_rak, lokasi) VALUES
('R-01', 'Lantai 1, Sisi Kiri dekat pintu masuk'),
('R-02', 'Lantai 1, Sisi Kanan dekat jendela'),
('R-03', 'Lantai 1, Sudut Belakang');

-- Catatan: ganti nilai password di bawah dengan hash bcrypt yang
-- sebenarnya dari aplikasi backend, jangan disimpan sebagai teks biasa.
INSERT INTO users (nama, username, password, role) VALUES
('Administrator', 'admin', 'GANTI_DENGAN_HASH_BCRYPT', 'admin');

INSERT INTO profil_sekolah (nama_sekolah, nama_aplikasi, alamat, deskripsi) VALUES
('SMP Negeri 1 Gunung Kaler', 'SiPusBuk - Sistem Perpustakaan Digital',
 'Kabupaten Tangerang, Banten',
 'Aplikasi pendataan dan peminjaman buku berbasis Android dengan QR Code untuk Perpustakaan SMPN 1 Gunung Kaler.');
