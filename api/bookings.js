const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('bookings').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const { data, error } = await supabase.from('bookings').insert([req.body]).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};