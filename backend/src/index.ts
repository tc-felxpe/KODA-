import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? ' configurada' : 'FALTA');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'configurada' : 'FALTA');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`KODA Backend running on http://localhost:${port}`);
});