import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => { map[r.key] = r.value; });
      return res.status(200).json(map);
    }
    if (req.method === 'POST') {
      // Admin only
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });
      const { data: profile } = await supabase.from('users_profile').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const { key, value } = req.body;
      const { data: existing } = await supabase.from('app_settings').select('id').eq('key', key).single();
      if (existing) {
        await supabase.from('app_settings').update({ value }).eq('key', key);
      } else {
        await supabase.from('app_settings').insert({ key, value });
      }
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
