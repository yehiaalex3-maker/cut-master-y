import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase client is not initialized.',
        details: 'Check Vercel environment variables.'
      });
    }

    if (req.method === 'GET') {
      const { project_id } = req.query;
      let query = supabase.from('units').select('*').order('sort_order', { ascending: true });
      if (project_id) query = query.eq('project_id', project_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase
        .from('units')
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { data, error } = await supabase
        .from('units')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Units API Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}

