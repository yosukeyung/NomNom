import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env



export default async function handler(req: any, res: any) {
  // Lazy-init Supabase inside handler so dotenv is guaranteed to have loaded
  const supabaseUrl = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'] || '';
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'] || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured. Check your .env.local file.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });

      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const { user_id, review_text, product_name, aspects, overall_sentiment, overall_score } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });

      const { data, error } = await supabase
        .from('analysis_history')
        .insert([
          {
            user_id,
            review_text,
            product_name,
            aspects,
            overall_sentiment,
            overall_score
          }
        ])
        .select();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      const { id, user_id } = req.body;
      if (!id || !user_id) return res.status(400).json({ error: 'id and user_id are required' });

      const { data, error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
