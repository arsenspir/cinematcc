const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      const { customer_name, movie_title, seats, total_price } = req.body;

      // Ambil nama film murni (membersihkan label jam tayang seperti "(13:00)")
      const rawTitle = movie_title.split('(')[0].trim();

      // 1. Cek data film & ketersediaan kursi
      const { data: movies, error: fetchErr } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', rawTitle);

      if (fetchErr || !movies || movies.length === 0) {
        return res.status(404).json({ error: "Film tidak ditemukan." });
      }

      const movie = movies[0];
      const currentSeats = movie.seats !== undefined ? movie.seats : (movie.total_seats || 48);

      // Hitung jumlah kursi yang dipesan (misal "E2, E3" = 2 kursi)
      const seatArray = typeof seats === 'string' ? seats.split(',').map(s => s.trim()).filter(Boolean) : [seats];
      const seatCount = seatArray.length > 0 ? seatArray.length : 1;

      if (currentSeats < seatCount) {
        return res.status(400).json({ error: "Sisa kursi tidak mencukupi untuk jumlah yang Anda pilih!" });
      }

      // 2. Masukkan data ke tabel bookings
      const { data: bookingData, error: bookErr } = await supabase
        .from('bookings')
        .insert([{ customer_name, movie_title, seats, total_price }])
        .select();

      if (bookErr) throw bookErr;

      // 3. Kurangi jumlah kursi film sesuai jumlah yang dipesan
      const { error: updateErr } = await supabase
        .from('movies')
        .update({ seats: currentSeats - seatCount })
        .eq('id', movie.id);

      if (updateErr) throw updateErr;

      return res.status(201).json(bookingData[0]);
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID pesanan tidak valid." });

      // Ambil detail pesanan sebelum dihapus
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

      // Ambil nama film murni tanpa label jam tayang
      const rawTitle = booking.movie_title ? booking.movie_title.split('(')[0].trim() : '';

      // Kembalikan jumlah kursi film sesuai kursi yang dibatalkan
      const { data: movies, error: mErr } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', rawTitle);

      if (!mErr && movies && movies.length > 0) {
        const movie = movies[0];
        const currentSeats = movie.seats !== undefined ? movie.seats : (movie.total_seats || 48);
        
        const bookingSeatArray = typeof booking.seats === 'string' ? booking.seats.split(',').map(s => s.trim()).filter(Boolean) : [booking.seats];
        const bookingSeatCount = bookingSeatArray.length > 0 ? bookingSeatArray.length : 1;

        await supabase
          .from('movies')
          .update({ seats: currentSeats + bookingSeatCount })
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