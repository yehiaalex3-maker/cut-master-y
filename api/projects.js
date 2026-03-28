import supabase from './_supabase.js';

export default async function handler(req, res) {
  const { method } = req;
  
  // Get auth token from header
  const authHeader = req.headers.authorization;
  let userId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  }
  
  // Also check for user_id in query or body
  if (!userId) {
    userId = req.query.user_id || req.body?.user_id;
  }

  try {
    switch (method) {
      case 'GET': {
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        const { name, client_name, notes, user_id } = req.body;
        const projectUserId = userId || user_id;
        
        if (!projectUserId) {
          return res.status(401).json({ error: 'Unauthorized - no user_id provided' });
        }
        
        if (!name) {
          return res.status(400).json({ error: 'Project name is required' });
        }

        const { data, error } = await supabase
          .from('projects')
          .insert({ name, client_name, notes, user_id: projectUserId })
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      case 'PUT': {
        const { id, name, client_name, notes } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Project ID is required' });
        }

        const { data, error } = await supabase
          .from('projects')
          .update({ name, client_name, notes })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'DELETE': {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'Project ID is required' });
        }

        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Projects API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
