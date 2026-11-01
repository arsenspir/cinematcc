require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Menyajikan file statis dari folder 'public' (HTML, CSS, JS frontend, gambar)
app.use(express.static(path.join(__dirname, 'public')));

// Rute Halaman Utama (Frontend Pengguna)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute Halaman Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Contoh Endpoint API untuk pengecekan koneksi Supabase / Environment Variables
app.get('/api/health', (req, res) => {
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_KEY;

  res.json({
    status: 'online',
    supabaseConnected: hasSupabaseUrl && hasSupabaseKey,
    message: 'Server Express berjalan dengan baik di Vercel!'
  });
});

// Jalankan server secara lokal jika tidak berjalan di lingkungan Vercel
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server lokal berjalan di http://localhost:${PORT}`);
  });
}
const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase client menggunakan environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint API untuk mengambil data film
app.get('/api/movies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies') // Pastikan nama tabel di Supabase kamu benar ('movies')
      .select('*');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PENTING: Ekspor aplikasi agar bisa dibaca dan dijalankan oleh Vercel Serverless Function
module.exports = app;