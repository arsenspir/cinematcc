const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('movies').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const { data, error } = await supabase.from('movies').insert([req.body]).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID film tidak valid." });
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: "Film berhasil dihapus." });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};