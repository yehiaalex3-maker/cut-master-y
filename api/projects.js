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
        details: 'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel environment variables.'
      });
    }

    if (req.method === 'GET') {

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    if (req.method === 'POST') {
      const { name, client_name, notes, user_id, group_id } = req.body;
      if (!name) return res.status(400).json({ error: 'Project name is required' });

      const { data, error } = await supabase
        .from('projects')
        .insert({ 
          name, 
          client_name, 
          notes, 
          user_id: user_id || null,
          group_id: group_id || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, client_name, notes, group_id } = req.body;
      if (!id) return res.status(400).json({ error: 'Project ID is required' });

      const { data, error } = await supabase
        .from('projects')
        .update({ name, client_name, notes, group_id })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Project ID is required' });

      // Clean up related data first (optional if cascade is on, but safer)
      await supabase.from('units').delete().eq('project_id', id);
      
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'An internal server error occurred',
      details: err.details || null
    });
  }
}

