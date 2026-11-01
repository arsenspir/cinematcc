const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('movies').select('*').order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      const { title, price, seats, genre, schedule, image_url } = req.body;
      const { data, error } = await supabase
        .from('movies')
        .insert([{ title, price, seats, genre, schedule, image_url }])
        .select();

      if (error) throw error;
      return res.status(201).json(data[0]);
    } 
    else if (req.method === 'PUT') {
      const { id } = req.query;
      const { title, price, seats, genre, schedule, image_url } = req.body;
      
      const { data, error } = await supabase
        .from('movies')
        .update({ title, price, seats, genre, schedule, image_url })
        .eq('id', id)
        .select();

      if (error) throw error;
      return res.status(200).json(data[0]);
    } 
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: "Film berhasil dihapus" });
    } 
    else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};