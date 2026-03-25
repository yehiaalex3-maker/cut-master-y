import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Check if registration is allowed
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'allow_registration')
      .single();
    const allowReg = setting?.value === 'true';
    if (!allowReg) return res.status(403).json({ error: 'التسجيل مغلق حالياً. تواصل مع المدير.' });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    // Create profile
    await supabase.from('users_profile').insert({
      id: data.user.id,
      email,
      full_name: full_name || email.split('@')[0],
      role: 'user',
      is_active: true,
    });

    return res.status(201).json({ ok: true, user: data.user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
}
