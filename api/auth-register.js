import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase client is not initialized.', 
        details: 'Check Vercel environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      });
    }

    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Check if registration is allowed
    const { data: setting, error: setErr } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'allow_registration')
      .maybeSingle();
    
    if (setErr) console.error('Settings fetch error:', setErr);

    const allowReg = setting?.value === 'true' || setting?.value === true;
    if (!allowReg) return res.status(403).json({ error: 'التسجيل مغلق حالياً. تواصل مع المدير.' });

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (authErr) throw authErr;

    // Create profile
    const { error: profErr } = await supabase.from('users_profile').insert({
      id: authData.user.id,
      email,
      full_name: full_name || email.split('@')[0],
      role: 'user',
      is_active: true,
    });
    
    if (profErr) {
      console.error('Profile creation error:', profErr);
      // Even if profile fails, user was created in Auth
    }

    return res.status(201).json({ ok: true, user: authData.user });
  } catch (err) {
    console.error('Register API Error:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'An internal error occurred during registration',
      details: err.details || null
    });
  }
}

