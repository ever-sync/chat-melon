
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=') || line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
            supabaseKey = line.split('=')[1].trim();
        }
    }
} catch (e) { }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
    const { data, error } = await supabase.from('messages').select('*').limit(5);
    if (error) {
        console.error('Error:', error.message);
        if (error.message.includes('RLS')) console.log('RLS is active and blocking access.');
    } else {
        console.log(`Found ${data?.length || 0} messages.`);
        data?.forEach(m => console.log(m));
    }
}

checkMessages();
