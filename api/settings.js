import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not initialized.' });
    }

    if (req.method === 'GET') {
      const { project_id } = req.query;
      if (!project_id) return res.status(400).json({ error: 'project_id required' });
      const { data, error } = await supabase
        .from('cutting_settings')
        .select('*')
        .eq('project_id', project_id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || null);
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body;
      if (!body.project_id) return res.status(400).json({ error: 'project_id required' });

      // Upsert by project_id
      const { data: existing, error: findErr } = await supabase
        .from('cutting_settings')
        .select('id')
        .eq('project_id', body.project_id)
        .maybeSingle();
      
      if (findErr && findErr.code !== 'PGRST116') throw findErr;

      let result;
      if (existing) {
        const { id, project_id, ...rest } = body;
        const { data, error } = await supabase
          .from('cutting_settings')
          .update(rest)
          .eq('project_id', body.project_id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('cutting_settings')
          .insert(body)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      return res.status(200).json(result);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings API Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
}

