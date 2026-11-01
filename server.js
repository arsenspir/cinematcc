const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

// Inisialisasi Supabase client menggunakan environment variables dari Vercel / .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware untuk membaca JSON
app.use(express.json());

// Sajikan file statis dari folder frontend (jika ada, sesuaikan nama foldernya jika public/dist)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint API untuk mengambil data film dari tabel 'movies' di Supabase
app.get('/api/movies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Jalankan server lokal (untuk development)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

// Ekspor app untuk Vercel Serverless Function
module.exports = app;