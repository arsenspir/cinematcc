const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('bookings').select('*').order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      const { customer_name, movie_title, seats, total_price } = req.body;

      // 1. Cek data film & ketersediaan kursi
      const { data: movies, error: fetchErr } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', movie_title);

      if (fetchErr || !movies || movies.length === 0) {
        return res.status(404).json({ error: "Film tidak ditemukan." });
      }

      const movie = movies[0];
      const currentSeats = movie.seats !== undefined ? movie.seats : (movie.total_seats || 30);

      if (currentSeats <= 0) {
        return res.status(400).json({ error: "Maaf, tiket untuk film ini sudah habis!" });
      }

      // 2. Masukkan data ke tabel bookings
      const { data: bookingData, error: bookErr } = await supabase
        .from('bookings')
        .insert([{ customer_name, movie_title, seats, total_price }])
        .select();

      if (bookErr) throw bookErr;

      // 3. Kurangi jumlah kursi film sebanyak 1
      const { error: updateErr } = await supabase
        .from('movies')
        .update({ seats: currentSeats - 1 })
        .eq('id', movie.id);

      if (updateErr) throw updateErr;

      return res.status(201).json(bookingData[0]);
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID pesanan tidak valid." });

      // Ambil detail pesanan sebelum dihapus untuk mengetahui judul filmnya
      const { data: bookingArr, error: getBookErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id);

      if (getBookErr || !bookingArr || bookingArr.length === 0) {
        return res.status(404).json({ error: "Pesanan tidak ditemukan." });
      }

      const booking = bookingArr[0];

      // Hapus pesanan
      const { error: delErr } = await supabase.from('bookings').delete().eq('id', id);
      if (delErr) throw delErr;

      // Kembalikan jumlah kursi film (+1)
      const { data: movies, error: mErr } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', booking.movie_title);

      if (!mErr && movies && movies.length > 0) {
        const movie = movies[0];
        const currentSeats = movie.seats !== undefined ? movie.seats : (movie.total_seats || 30);
        await supabase
          .from('movies')
          .update({ seats: currentSeats + 1 })
          .eq('id', movie.id);
      }

      return res.status(200).json({ message: "Pesanan berhasil dihapus dan kursi dikembalikan." });
    } 
    else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};