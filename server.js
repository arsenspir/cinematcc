require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Data film dengan array 'bookedSeats' untuk mencatat kursi spesifik
let movies = [
  {
    id: 1,
    title: "Inception",
    price: 50000,
    seatsAvailable: 30,
    bookedSeats: [],
    posterUrl: "https://via.placeholder.com/300x400"
  }
];

let bookingHistory = []; // Riwayat transaksi

// API: Ambil daftar film
app.get('/api/movies', (req, res) => {
  res.json(movies);
});

// API: Tambah film baru + Upload poster ke Supabase
app.post('/api/movies', upload.single('poster'), async (req, res) => {
  try {
    const { title, price, seatsAvailable } = req.body;
    let posterUrl = "https://via.placeholder.com/300x400";

    if (req.file) {
      const fileName = `posters/${Date.now()}_${req.file.originalname}`;
      const { error } = await supabase.storage
        .from('posters')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(fileName);

      posterUrl = publicUrlData.publicUrl;
    }

    const newMovie = {
      id: movies.length + 1,
      title,
      price: parseInt(price),
      seatsAvailable: parseInt(seatsAvailable),
      bookedSeats: [],
      posterUrl
    };

    movies.push(newMovie);
    res.json({ success: true, movie: newMovie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Pesan tiket (Mencatat kursi spesifik dan jam tayang)
app.post('/api/book', (req, res) => {
  const { movieId, selectedSeats, selectedTime } = req.body;
  const movie = movies.find(m => m.id === movieId);
  
  if (!movie) return res.status(404).json({ message: "Film tidak ditemukan" });
  
  if (!selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return res.status(400).json({ message: "Belum ada kursi yang dipilih!" });
  }

  // Validasi apakah kursi sudah pernah dipesan orang lain
  const alreadyBooked = selectedSeats.some(seat => movie.bookedSeats.includes(seat));
  if (alreadyBooked) {
    return res.status(400).json({ message: "Maaf, salah satu kursi yang kamu pilih sudah dipesan orang lain!" });
  }

  // Masukkan kursi ke daftar bookedSeats film tersebut
  movie.bookedSeats.push(...selectedSeats);
  movie.seatsAvailable -= selectedSeats.length;

  // Catat ke riwayat transaksi
  const newBooking = {
    id: bookingHistory.length + 1,
    movieTitle: movie.title,
    seats: selectedSeats.join(', '),
    showtime: selectedTime || "12:30 WIB",
    totalTickets: selectedSeats.length,
    bookingDate: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })
  };
  bookingHistory.push(newBooking);

  res.json({ success: true, message: "Pemesanan tiket berhasil!", booking: newBooking });
});

// API: Lihat semua riwayat pemesanan
app.get('/api/bookings', (req, res) => {
  res.json(bookingHistory);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});